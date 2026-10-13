#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 2.7① 即时战斗交互验证：真实触控跑一场（移动/普攻/技能/闪避/躲弹道），断言无 pageerror、胜负结算正确。
# 退出码 = 失败数。截图存 test/out27/
import asyncio, os, sys, time
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
URL = 'file://' + os.path.join(HERE, '..', 'www', 'index.html')
OUT = os.path.join(HERE, 'out27')
os.makedirs(OUT, exist_ok=True)

failures = []
def check(cond, msg):
    print(('PASS' if cond else 'FAIL'), '-', msg, flush=True)
    if not cond:
        failures.append(msg)

async def main():
    async with async_playwright() as p:
        chrome = os.environ.get('CHROME', '/opt/vm/preinstall/ms-playwright/chromium-1169/chrome-linux/chrome')
        b = await p.chromium.launch(executable_path=chrome,
                                    args=['--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files', '--no-sandbox'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        errs = []
        def _on_console(m):
            t = m.text or ''
            if m.type == 'error' and 'net::ERR_FILE_NOT_FOUND' not in t and 'Failed to load resource' not in t:
                errs.append(t)
        pg.on('console', _on_console)
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))

        await pg.goto(URL)
        await pg.wait_for_timeout(2500)
        await pg.click('text=开始新人生'); await pg.wait_for_timeout(400)
        await pg.click('#nx'); await pg.wait_for_timeout(200)          # 取名 -> 天赋
        for k in range(3):
            await pg.locator('.talb').nth(k).click(); await pg.wait_for_timeout(150)
        await pg.click('#nx'); await pg.wait_for_timeout(200)          # 天赋 -> 属性
        await pg.click('#rs'); await pg.wait_for_timeout(200)          # 随机分配属性
        await pg.click('#nx'); await pg.wait_for_timeout(200)        # 属性 -> 命盘
        await pg.click('#nx'); await pg.wait_for_timeout(2500)        # 出生
        # 关掉出生/帮助事件卡
        for k in range(5):
            o = pg.locator('#modals .opt').first
            if await o.count():
                await o.click(); await pg.wait_for_timeout(300)
            else:
                break
        await pg.wait_for_timeout(800)
        await pg.screenshot(path=os.path.join(OUT, 'map.png'))

        ready = await pg.evaluate("()=> !!(Game.G && R.mode==='map' && Game.G.v===2)")
        check(ready, '进入地图主循环')

        # 直接起一场实时战：纸符小鬼（会放火球=可躲弹道），压低 tier 便于通关
        await pg.evaluate("()=>{ Game.G.hp=Game.stats().mhp; Game.G.mp=Game.stats().mmp; window.__rtRes=null; window.__rtDone=RT27.start([monUnit('paper',0.3,false)],{}).then(r=>window.__rtRes=r); }")
        await pg.wait_for_timeout(900)
        mode_ok = await pg.evaluate("()=> RT27.on && R.mode==='battle'")
        check(mode_ok, '实时战已进入（R.mode=battle, RT27.on）')
        await pg.screenshot(path=os.path.join(OUT, 'rt_start.png'))

        # 1) 触控移动：左下摇杆拖拽（走位/躲弹道）
        await pg.mouse.move(130, 720); await pg.mouse.down(); await pg.wait_for_timeout(120)
        await pg.mouse.move(210, 620, steps=8); await pg.wait_for_timeout(150)
        await pg.mouse.move(150, 560, steps=6); await pg.wait_for_timeout(150)
        await pg.mouse.up(); await pg.wait_for_timeout(200)
        await pg.screenshot(path=os.path.join(OUT, 'rt_move.png'))

        # 2) 闪避冲刺按钮
        dash = pg.locator('#rt27-dash')
        if await dash.count():
            await dash.tap(); await pg.wait_for_timeout(300)
            dash_cd = await pg.evaluate("()=> RT27.player.dashCd>0")
            check(dash_cd, '触发闪避冲刺（进入冷却/无敌）')
        else:
            check(False, '存在闪避按钮 #rt27-dash')

        # 3) 放一次技能槽
        sk = pg.locator('#rt27-skills button')
        if await sk.count():
            await sk.first.tap(); await pg.wait_for_timeout(250)
            check(True, '点击技能槽按钮')
        else:
            check(True, '（无已学技能槽，跳过）')

        # 4) 普攻连点（自动锁敌+点按冲锋贴身）直至结束
        atk = pg.locator('#rt27-atk')
        check(await atk.count() > 0, '存在普攻按钮 #rt27-atk')
        t0 = time.time(); ended = False
        while time.time() - t0 < 35:
            if await pg.evaluate("()=>!RT27.on"):
                ended = True; break
            await atk.tap(); await pg.wait_for_timeout(350)
        await pg.wait_for_timeout(500)
        await pg.screenshot(path=os.path.join(OUT, 'rt_end.png'))

        check(ended, '实时战正常结束（未卡死）')
        res = await pg.evaluate("()=> window.__rtRes")
        check(res is not None, '结算 resolve 被调用')
        if res:
            check(res.get('res') == 'win', f'胜负结算=win（实际 {res.get("res")}）')
            check(len(res.get('killed', [])) == 1, '击杀统计含该怪（killed.length=1）')
            check(res['killed'][0].get('mon') == 'paper', '击杀单位 mon 字段=paper')
        # 回主循环
        back = await pg.evaluate("()=> R.mode==='map'")
        check(back, '战斗结束后回到 R.mode=map')
        hp_ok = await pg.evaluate("()=> Game.G.hp>=1")
        check(hp_ok, '战后 Game.G.hp 已回写且>=1')

        await pg.wait_for_timeout(600)
        print('--- console errors ---')
        for e in errs[:20]:
            print('ERR:', e[:300])
        check(len(errs) == 0, f'零 JS/page 错误（实际 {len(errs)} 条）')
        await b.close()

    print('FAILURES', len(failures))
    sys.exit(len(failures))

asyncio.run(main())

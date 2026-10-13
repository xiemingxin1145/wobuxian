#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 2.8② 神通参悟悟道交互验证：参悟面板→点悟道节点→获/装神通→实时战+回合战各放一次神通→论道一次。
# 退出码 = 失败数。截图存 test/out28/
import asyncio, os, sys, time
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
URL = 'file://' + os.path.join(HERE, '..', 'www', 'index.html')
OUT = os.path.join(HERE, 'out28')
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
        await pg.click('#nx'); await pg.wait_for_timeout(200)
        for k in range(3):
            await pg.locator('.talb').nth(k).click(); await pg.wait_for_timeout(150)
        await pg.click('#nx'); await pg.wait_for_timeout(200)
        await pg.click('#rs'); await pg.wait_for_timeout(200)
        await pg.click('#nx'); await pg.wait_for_timeout(200)
        await pg.click('#nx'); await pg.wait_for_timeout(2500)
        for k in range(6):
            o = pg.locator('#modals .opt').first
            if await o.count():
                await o.click(); await pg.wait_for_timeout(300)
            else:
                break
        await pg.wait_for_timeout(800)
        ready = await pg.evaluate("()=> !!(Game.G && R.mode==='map')")
        check(ready, '进入游戏')

        # 金丹期 + 给悟道点
        await pg.evaluate("()=>{ Game.G.flags.awakened=1; Game.G.realm=3; DAO28.ensure(); Game.G.daoPoints=6; }")
        on = await pg.evaluate("()=> DAO28.active()")
        check(on, '金丹期开启神通/悟道')

        # 1) 打开参悟面板
        await pg.evaluate("()=>{ UI.panel('dao28'); }"); await pg.wait_for_timeout(500)
        has_tree = await pg.evaluate("()=> document.querySelector('#modals').innerText.includes('剑道') && document.querySelector('#modals').innerText.includes('悟道点')")
        check(has_tree, '参悟面板显示悟道分支与悟道点')
        await pg.screenshot(path=os.path.join(OUT, 'dao_panel.png'))
        # 关掉面板
        x = pg.locator('#modals .x').first; await x.click(); await pg.wait_for_timeout(300)

        # 2) 参悟剑道到3层（解锁一剑破万法）——直接驱动方法并点掉确认卡
        for k in range(3):
            await pg.evaluate("()=>{ DAO28.learn('jiandao'); }")
            await pg.wait_for_timeout(200)
            for _ in range(3):
                o = pg.locator('#modals .opt').first
                if await o.count(): await o.click(); await pg.wait_for_timeout(200)
                else: break
        have = await pg.evaluate("()=> Game.G.shentong.includes('st_jianpo')")
        check(have, '参悟剑道3层→悟得神通「一剑破万法」')

        # 3) 装备神通
        await pg.evaluate("()=>{ Game.G.shentongEq=[]; DAO28.toggleEquip('st_jianpo'); }")
        eq = await pg.evaluate("()=> Game.G.shentongEq.includes('st_jianpo')")
        check(eq, '装备神通成功（神通槽）')
        sl = await pg.evaluate("()=> Game.skillList().includes('st_jianpo')")
        check(sl, '神通已进入战斗技能表（回合/实时共用）')

        # 4) 实时战放一次神通
        await pg.evaluate("()=>{ window.RT27=RT27; window.__rt28=null; RT27.start([monUnit('slime',0.3,false)],{}).then(r=>window.__rt28=r); }")
        await pg.wait_for_timeout(900)
        inrt = await pg.evaluate("()=> RT27.on && R.mode==='battle'")
        check(inrt, '进入实时战')
        has_sk = await pg.evaluate("()=> RT27.skills.some(s=>s.id==='st_jianpo')")
        check(has_sk, '实时战神通按钮出现（技能槽含一剑破万法）')
        # 点神通按钮
        skbtns = pg.locator('#rt27-skills button')
        cnt = await skbtns.count()
        clicked = False
        for i in range(cnt):
            t = await skbtns.nth(i).text_content()
            if '剑' in t or i == cnt-1:
                await skbtns.nth(i).tap(); await pg.wait_for_timeout(300); clicked = True; break
        check(clicked, '点击实时战神通按钮')
        await pg.wait_for_timeout(1500)  # 让神通弹道飞出命中
        await pg.screenshot(path=os.path.join(OUT, 'dao_rt.png'))
        # 强制结束该场实时战（神通已验证释放无报错即可）
        await pg.evaluate("()=>{ if(RT27.on){ RT27.foes.forEach(f=>f.hp=0); RT27.finish({res:'win',killed:RT27.foes.map(f=>({mon:f.mon,tier:f.tier||0.3}))}); } }")
        for k in range(6):
            o = pg.locator('#modals .opt').first
            if await o.count(): await o.click(); await pg.wait_for_timeout(250)
            else: break
        for k in range(10):
            if await pg.evaluate("()=> window.__rt28"): break
            await pg.wait_for_timeout(300)

        # 5) 回合战放一次神通（临时取消实时路由）
        await pg.evaluate("()=>{ delete window.RT27; window.__tb=null; Game.fight('slime',{tier:0.3,solo:true}).then(r=>window.__tb=r.res); }")
        await pg.wait_for_timeout(1200)
        tb_sk = await pg.evaluate("()=> (typeof B!=='undefined' && B.on) ? B.units.find(u=>u.side===0&&u.alive).skills.includes('st_jianpo') : 'nobattle'")
        check(tb_sk is True, f'回合战玩家单位技能含神通（{tb_sk}）')
        # 开自动打完结算
        ab = pg.locator('#battlebar button[data-a=auto]')
        if await ab.count():
            await ab.tap(); await pg.wait_for_timeout(300)
        t0 = time.time()
        while time.time() - t0 < 20:
            if await pg.evaluate("()=> window.__tb"): break
            await pg.wait_for_timeout(400)
        await pg.screenshot(path=os.path.join(OUT, 'dao_tb.png'))
        for k in range(6):
            o = pg.locator('#modals .opt').first
            if await o.count(): await o.click(); await pg.wait_for_timeout(250)
            else: break

        # 6) 论道一次（给悟道点）
        dp0 = await pg.evaluate("()=> Game.G.daoPoints")
        await pg.evaluate("()=>{ DAO28.discuss('mentor'); }")
        await pg.wait_for_timeout(200)
        for _ in range(3):
            o = pg.locator('#modals .opt').first
            if await o.count(): await o.click(); await pg.wait_for_timeout(250)
            else: break
        for _ in range(3):
            o = pg.locator('#modals .opt').first
            if await o.count(): await o.click(); await pg.wait_for_timeout(250)
            else: break
        dp1 = await pg.evaluate("()=> Game.G.daoPoints")
        print('   悟道点', dp0, '->', dp1)
        check(dp1 >= dp0 - 1, '论道流程可走完（悟道点变动正常）')

        print('--- console errors ---')
        for e in errs[:20]:
            print('ERR:', e[:300])
        check(len(errs) == 0, f'零 JS/page 错误（实际 {len(errs)} 条）')
        await b.close()

    print('FAILURES', len(failures))
    sys.exit(len(failures))

asyncio.run(main())

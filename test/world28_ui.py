#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 2.8① 世界大地图交互验证：进大地图→自由移动→遭遇怪(实时战往返)→进节点→出城返回大地图。
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
        await pg.screenshot(path=os.path.join(OUT, 'map.png'))
        ready = await pg.evaluate("()=> !!(Game.G && R.mode==='map')")
        check(ready, '进入地图主循环')
        # 大地图需觉醒灵根（测试环境直接赋予）
        await pg.evaluate("()=>{ Game.G.flags.awakened=1; }")

        # 1) 从御剑/传送面板进入大地图
        await pg.evaluate("()=>{ UI.panel('travel'); }"); await pg.wait_for_timeout(600)
        btn = pg.locator('#modals .opt', has_text='神游大地图')
        check(await btn.count() > 0, '传送面板含「神游大地图」入口')
        await btn.first.tap(); await pg.wait_for_timeout(1200)
        wmode = await pg.evaluate("()=> R.mode==='world' && World28.on")
        check(wmode, '进入世界大地图（R.mode=world）')
        node_count = await pg.evaluate("()=> World28.nodes.length")
        print('   节点数:', node_count)
        check(node_count >= 8, f'大地图已散布节点（{node_count} 张）')
        await pg.screenshot(path=os.path.join(OUT, 'world.png'))

        # 2) 自由移动：记录坐标 → 点选远处移动 → 坐标变化
        p0 = await pg.evaluate("()=>({x:World28.px,y:World28.py})")
        # 点选屏幕右上某处（世界坐标偏移）
        await pg.mouse.click(300, 300); await pg.wait_for_timeout(1500)
        p1 = await pg.evaluate("()=>({x:World28.px,y:World28.py})")
        moved = abs(p1['x'] - p0['x']) + abs(p1['y'] - p0['y']) > 20
        check(moved, f'点选自由移动生效（Δ=%.0f）' % (abs(p1['x']-p0['x'])+abs(p1['y']-p0['y'])))
        await pg.screenshot(path=os.path.join(OUT, 'world_move.png'))

        # 3) 移动触发遭遇怪 → 实时战往返
        await pg.evaluate("()=>{ window.__wdone=null; (async()=>{ await World28._fight('slime',{tier:0.3,solo:true}); window.__wdone=1; })(); }")
        await pg.wait_for_timeout(900)
        in_rt = await pg.evaluate("()=> RT27.on && R.mode==='battle'")
        check(in_rt, '大地图移动遭遇→进入实时战')
        # 自动打一会儿：连点普攻直到结束
        atk = pg.locator('#rt27-atk')
        t0 = time.time(); ended = False
        while time.time() - t0 < 30:
            if await pg.evaluate("()=>!RT27.on"):
                ended = True; break
            if await atk.count():
                await atk.tap(); await pg.wait_for_timeout(350)
            else:
                await pg.wait_for_timeout(200)
        await pg.wait_for_timeout(600)
        await pg.screenshot(path=os.path.join(OUT, 'world_fight_end.png'))
        # 点掉战斗胜利/失败结算卡，等待 _fight 异步收尾
        for k in range(4):
            o = pg.locator('#modals .opt').first
            if await o.count():
                await o.click(); await pg.wait_for_timeout(300)
            else:
                break
        for k in range(12):
            if await pg.evaluate("()=> window.__wdone===1"): break
            await pg.wait_for_timeout(300)
        back = await pg.evaluate("()=> R.mode==='world' && World28.on")
        check(back, '实时战结束后回到大地图（未卡死）')

        # 4) 靠近节点 → 进入该区域
        # 把玩家瞬移到 village 节点旁，触发进入按钮
        ent = await pg.evaluate("()=>{ const n=World28.nodeById('village'); World28.px=n.x+80; World28.py=n.y+80; World28.moveTarget=null; return n?n.id:null; }")
        await pg.wait_for_timeout(500)
        enter_btn = pg.locator('#w28-enter button')
        await enter_btn.wait_for(state='visible', timeout=3000)
        etxt = await enter_btn.text_content()
        check('进入' in etxt, f'靠近节点出现「进入」按钮（{etxt}）')
        await enter_btn.tap(); await pg.wait_for_timeout(1200)
        in_map = await pg.evaluate("()=> R.mode==='map' && !!R.M")
        check(in_map, '进入区域成功（回到 R.mode=map）')
        mapid = await pg.evaluate("()=> R.mapId")
        check(mapid == 'village', f'落点正确（village），实际 {mapid}')
        await pg.screenshot(path=os.path.join(OUT, 'entered_village.png'))

        # 5) 从区域再出城回大地图
        await pg.evaluate("()=>{ UI.panel('travel'); }"); await pg.wait_for_timeout(600)
        btn2 = pg.locator('#modals .opt', has_text='神游大地图')
        await btn2.first.tap(); await pg.wait_for_timeout(1200)
        wmode2 = await pg.evaluate("()=> R.mode==='world' && World28.on")
        check(wmode2, '出城/御剑返回大地图成功')

        # 6) 跑一次随机 roll（奇遇/采集/道友）确保不崩
        await pg.evaluate("()=>{ World28.dist=520; }")
        await pg.wait_for_timeout(800)
        # 若弹出 modal，点掉
        for k in range(4):
            o = pg.locator('#modals .opt').first
            if await o.count():
                await o.click(); await pg.wait_for_timeout(300)
            else:
                break
        await pg.wait_for_timeout(400)

        print('--- console errors ---')
        for e in errs[:20]:
            print('ERR:', e[:300])
        check(len(errs) == 0, f'零 JS/page 错误（实际 {len(errs)} 条）')
        await b.close()

    print('FAILURES', len(failures))
    sys.exit(len(failures))

asyncio.run(main())

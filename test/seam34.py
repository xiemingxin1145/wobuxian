# 3.4 无缝相邻地图：真实触摸走到地图边缘出口 → 不弹菜单、不黑屏切到邻图，落在反向出口旁；再走回去。
# 作弊：仅开发者面板「解锁全部地图」「不遇敌」（UI 点按）。无瞬移，evaluate 只读。
import asyncio, os, sys, json
from playwright.async_api import async_playwright
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www')
URL = 'file://' + os.path.abspath(ROOT) + '/index.html#dev'
VW, VH = 412, 915
async def main():
    fails = []; log = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME', '/opt/google/chrome/chrome'), args=['--allow-file-access-from-files'])
        ctx = await b.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        cdp = await ctx.new_cdp_session(pg)
        async def tap(x, y):
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]}); await pg.wait_for_timeout(60)
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        await pg.tap('text=开始新人生'); await pg.wait_for_timeout(400)
        await pg.tap('#nx'); await pg.wait_for_timeout(200)
        for k in range(3): await pg.locator('.talb').nth(k).tap()
        for k in range(3): await pg.tap('#nx'); await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(2500)
        async def closeall():
            for k in range(12):
                o = pg.locator('#modals').get_by_text('离开', exact=True).last
                if not await o.count(): o = pg.locator('#modals .opt, #modals .x, #modals .close').first
                if await o.count() and await o.is_visible(): await o.tap(); await pg.wait_for_timeout(400)
                elif not await pg.evaluate('()=>UI.modal'): break
        await closeall(); await pg.wait_for_timeout(800)
        await pg.locator('#devbtn').tap(); await pg.wait_for_timeout(500)
        await pg.locator('#modals .dt', has_text='解锁').first.tap(); await pg.wait_for_timeout(300)
        await pg.locator('#modals [data-a="maps"]').tap(); await pg.wait_for_timeout(400)
        await pg.locator('#modals .dt', has_text='调试').first.tap(); await pg.wait_for_timeout(300)
        await pg.locator('#modals [data-a="noenc"]').tap(); await pg.wait_for_timeout(300)
        await closeall(); await pg.wait_for_timeout(500)
        links = await pg.evaluate('()=>Seam34.links')
        bad = [(a, s, b) for a in links for s, b in links[a].items() if links.get(b, {}).get({'ip':'im','im':'ip','jp':'jm','jm':'jp'}[s]) != a]
        log.append({'links_village': links.get('village'), 'n_links': sum(len(v) for v in links.values()), 'asym': bad})
        if bad or not links.get('village'): fails.append('links')
        async def walk_to_exit(to, limit=80):
            import math, random; last = None; stuck = 0
            for k in range(limit):
                s = await pg.evaluate("(to)=>{const x=Seam34.exits.find(e=>e.to===to);const P=R.player;if(!x||R.mapId===to)return {map:R.mapId,tx:0,ty:0,px:0,py:0,path:0,modal:UI.modal};const [a,b]=w2s(...t2p(x.i+.5,x.j+.5));const [c,d]=w2s(...t2p(P.i,P.j));return {map:R.mapId,tx:a/R.dpr,ty:b/R.dpr,px:c/R.dpr,py:d/R.dpr,path:P.path.length,modal:UI.modal}}", to)
                if s['map'] == to: return k
                if os.environ.get('DBG'): print(k, s, flush=True)
                if s['modal']:
                    await closeall()
                    if await pg.evaluate('()=>UI.modal'):
                        t = await pg.evaluate("()=>UI.stack.map(e=>e.className+':'+e.innerText.slice(0,200)).join('|')"); log.append({'stuck_modal': t}); return -1
                    continue
                if s['path'] == 0 or True:
                    pos = (round(s['px']), round(s['py'])); stuck = stuck + 1 if pos == last else 0; last = pos
                    dx, dy = s['tx'] - s['px'], s['ty'] - s['py']; m = max(1, (dx * dx + dy * dy) ** .5); r = min(m, 160)
                    if stuck:
                        a = random.choice([-1, 1]) * random.uniform(0.6, 1.6); dx, dy = dx * math.cos(a) - dy * math.sin(a), dx * math.sin(a) + dy * math.cos(a); r = 120; m = max(1, (dx * dx + dy * dy) ** .5)
                    if 30 < s['tx'] < VW - 30 and 200 < s['ty'] < VH - 260 and not stuck:
                        await tap(s['tx'], s['ty'])
                    else:  # 屏幕外：用摇杆朝出口方向推（真实触摸，避免点到路人）
                        J0 = (110, VH - 150); ux, uy = dx / m, dy / m
                        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': J0[0], 'y': J0[1], 'id': 0}]})
                        for q in range(1, 5): await cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': J0[0] + ux * 12 * q, 'y': J0[1] + uy * 12 * q, 'id': 0}]}); await pg.wait_for_timeout(16)
                        await pg.wait_for_timeout(450)
                        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
                await pg.wait_for_timeout(350)
            return -1
        fade_seen = []
        await pg.evaluate("()=>{window.__fade=0;const f=()=>{const o=+getComputedStyle(document.querySelector('#fade')).opacity;const l=getComputedStyle(document.querySelector('#loading')).display!=='none';if(o>0.3||l)window.__fade++;requestAnimationFrame(f)};f()}")
        to = list(links['village'].values())[0]; ap0 = await pg.evaluate('()=>Game.G.ap')
        k = await walk_to_exit(to)
        await pg.wait_for_timeout(800)
        st = await pg.evaluate("(from)=>{const P=R.player;const x=Seam34.exits.find(e=>e.to===from);return {map:R.mapId,i:P.i,j:P.j,back:x&&[x.i,x.j],ap:Game.G.ap,fade:window.__fade,modal:UI.modal}}", 'village')
        log.append({'go': to, 'taps': k, **st, 'ap0': ap0})
        await pg.screenshot(path=os.path.join(os.path.dirname(__file__), 'seam34_arrive.png'))
        if k < 0 or st['map'] != to: fails.append('cross')
        elif not st['back'] or abs(st['i'] - st['back'][0] - .5) + abs(st['j'] - st['back'][1] - .5) > 4.1 or (int(st['i']), int(st['j'])) == tuple(st['back']): fails.append('arrive_pos')
        if st['fade'] > 0: fails.append('fade_or_loading_shown')
        if st['ap'] != ap0: fails.append('ap_spent')
        if not fails:
            k2 = await walk_to_exit('village'); s2 = await pg.evaluate('()=>R.mapId'); log.append({'back_taps': k2, 'map': s2})
            if s2 != 'village': fails.append('return')
        log.append({'errs': errs[:5]})
        if errs: fails.append('pageerror')
        await b.close()
    print(json.dumps(log, ensure_ascii=False, indent=1)); print('FAILS', fails); sys.exit(len(fails))
asyncio.run(main())

# 3.8.1 称号真页面测试（真实触摸 412×915）：python3 -B test/tit39_page.py，退出码 = 失败数。
# 作弊（只走开发者面板 UI）：「称号39」页签的「全部获得」。page.evaluate 只读状态。
import asyncio, os, sys, json
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www'))
URL = 'file://' + ROOT + '/index.html'
VW, VH = 412, 915
SHOTS = os.environ.get('SHOTS', '/workspace/shots381'); os.makedirs(SHOTS, exist_ok=True)
LAYOUT = """()=>{const p=document.querySelector('#modals .mwrap:last-child .pf38');if(!p)return null;const r=p.getBoundingClientRect();
  const bad=[...p.querySelectorAll('*')].filter(e=>{const q=e.getBoundingClientRect();return q.width>0&&(q.x<-1||q.right>VW+1||e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflowX!=='visible')}).map(e=>e.className||e.tagName).slice(0,5);
  return {x:r.x,right:r.right,bad,text:p.innerText.slice(0,400)}}""".replace('VW', str(VW))
async def main():
    errs = []; fails = []; cheats = []
    def ok(k, cond, info=None):
        print(k, 'PASS' if cond else 'FAIL', json.dumps(info, ensure_ascii=False)[:500], flush=True)
        if not cond: fails.append(k)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME', '/opt/google/chrome/chrome'), args=['--allow-file-access-from-files'])
        ctx = await b.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        cdp = await ctx.new_cdp_session(pg)
        async def tap(x, y):
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]}); await pg.wait_for_timeout(60)
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        async def tap_sel(sel, wait=400, scroll=True, text=None):
            r = await pg.evaluate("([s,sc,tx])=>{const e=[...document.querySelectorAll(s)].filter(x=>x.getClientRects().length>0&&(!tx||x.textContent.includes(tx))).pop();if(!e)return null;if(sc)e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;const t=document.elementFromPoint(x,y);return {x,y,hit:!!t&&(t===e||e.contains(t))}}", [sel, scroll, text])
            if not r: return False
            await pg.wait_for_timeout(120); await tap(r['x'], r['y']); await pg.wait_for_timeout(wait); return r['hit']
        async def settle(n=30):
            for k in range(n):
                if await pg.evaluate('()=>UX.inMap()'): return True
                if await pg.evaluate('()=>typeof B!=="undefined"&&B.on'): await tap_sel('#battlebar button[data-a=auto]', 1500); continue
                for s in ['.gacha-fx .gclose', '.gacha-fx .gskip', '#modals .mwrap:last-child .ph .x', '#modals .mwrap:last-child .opt']:
                    if await tap_sel(s, 500): break
                else: await pg.wait_for_timeout(600)
            return False
        async def close_all():
            for k in range(5):
                if not await pg.evaluate("()=>!!document.querySelector('#modals .mwrap:last-child .ph .x')"): break
                await tap_sel('#modals .mwrap:last-child .ph .x', 500, False)
        G = lambda js: pg.evaluate('()=>{const G=Game.G;return ' + js + '}')
        async def mingge():  # 3.3 先天命格弹窗：真实点「随缘补齐」，之后若有确认按钮再点
            for k in range(4):
                t = await pg.evaluate("()=>{const w=document.querySelector('#modals .mwrap:last-child');return w?w.innerText.slice(0,40):''}")
                if '先天命格' not in t: return
                if not await tap_sel('#modals .mwrap:last-child button', 900, True, '随缘补齐'):
                    await tap_sel('#modals .mwrap:last-child button', 900, True, '确')
        async def open_title():
            for k in range(3):
                await mingge()
                if await pg.evaluate("()=>!!document.querySelector('#modals .big2[data-k=\\'title\\']')"): break
                await settle(); await tap_sel('#menu .mb[data-p="more"]', 800, False)
            return await tap_sel("#modals .big2[data-k='title']", 900, False)
        PANEL = "()=>{const w=document.querySelector('#modals .mwrap:last-child');if(!w)return null;const r=w.getBoundingClientRect();return {t:w.innerText.slice(0,600),right:r.right,x:r.x}}"
        await pg.goto(URL + '#dev'); await pg.wait_for_timeout(1500)
        await pg.tap('text=开始新人生'); await pg.wait_for_timeout(400); await pg.tap('#nx'); await pg.wait_for_timeout(200)
        for k in range(3): await pg.locator('.talb').nth(k).tap()
        for k in range(3): await pg.tap('#nx'); await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(2500); await settle(); await mingge(); await settle()
        st = await G("({t39:typeof T39,n:TITLES.length,t39n:TITLES.filter(t=>t.id.startsWith('t39_')).length,v:G.v,ch:typeof Chain37,zf:typeof ZF39})")
        ok('1_loaded', st['t39'] == 'object' and st['n'] >= 56 and st['t39n'] == 40 and st['v'] == 2 and st['ch'] == 'object', st)
        # 2 更多 → 称号：收藏进度行
        hit = await open_title(); p1 = await pg.evaluate(PANEL); await pg.screenshot(path=f'{SHOTS}/tit39_panel.png')
        ok('2_panel', hit and p1 and '称号收藏' in p1['t'] and p1['right'] <= VW + 1, p1)
        await close_all(); await settle()
        # 3 开发者面板 → 称号39 → 全部获得
        for k in range(3):
            if await pg.evaluate("()=>!!document.querySelector('.devtabs')"): break
            await mingge(); await settle(); await tap_sel('#devbtn', 700, False)
        await tap_sel('.devtabs .dt[data-t="t39"]', 500)
        hit = await tap_sel('#modals button.opt[data-a="all"]', 700); cheats.append('t39:全部获得')
        st3 = await G("({got:Object.keys((G.t39||{}).got||{}).length,cnt:(G.t39||{}).cnt||0,cult:+(Sys.bonus('cult')).toFixed(4),saved:(JSON.parse(localStorage.getItem('wbx2_save')||'{}').t39||{}).got})")
        ok('3_all', hit and st3['got'] == 40 and st3['cnt'] >= 40 and st3['cult'] >= 0.05 and st3['saved'] and len(st3['saved']) == 40, {k: v for k, v in st3.items() if k != 'saved'})
        await close_all(); await settle()
        # 4 称号面板 → 佩戴一个 t39 称号（真实点「佩戴」）
        await open_title()
        hit = await tap_sel("#modals .mwrap:last-child button.sm[data-t='t39_jianghu']", 800)
        st4 = await G("({title:G.title,spd:+(Sys.bonus('spd')).toFixed(4)})"); p4 = await pg.evaluate(PANEL)
        await pg.screenshot(path=f'{SHOTS}/tit39_wear.png')
        ok('4_wear', hit and st4['title'] == 't39_jianghu' and st4['spd'] >= 0.03, st4)
        await close_all(); await settle()
        ok('5_no_js_error', not errs, errs[:3])
        await b.close()
    print('cheats:', cheats); print(f'FAILS {fails}'); sys.exit(len(fails))
asyncio.run(main())

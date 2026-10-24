# 3.8.0 人物详情面板真页面测试（真实触摸 412×915）：python3 -B test/pf38_page.py，退出码 = 失败数。
# 作弊（只走开发者面板 UI）：「人物详情」页签的「打开『娘』的详情」「神识 +4」「重置窥探次数」。page.evaluate 只读状态。
import asyncio, os, sys, json
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www'))
URL = 'file://' + ROOT + '/index.html'
VW, VH = 412, 915
SHOTS = os.environ.get('SHOTS', '/workspace/shots38'); os.makedirs(SHOTS, exist_ok=True)
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
        await pg.goto(URL + '#dev'); await pg.wait_for_timeout(1500)
        await pg.tap('text=开始新人生'); await pg.wait_for_timeout(400); await pg.tap('#nx'); await pg.wait_for_timeout(200)
        for k in range(3): await pg.locator('.talb').nth(k).tap()
        for k in range(3): await pg.tap('#nx'); await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(2500); await settle()
        st = await G("({pf:typeof PF38,has:!!G.pf38,v:G.v,menu:Talk.extra('mom').map(x=>x[0])})")
        ok('1_loaded', st['pf'] == 'object' and st['v'] == 2 and '📜 查看详情' in st['menu'], st)
        # 2 角色面板 → 自己的详情
        for k in range(3):
            if await pg.evaluate("()=>!!document.querySelector('#modals .pf38me')"): break
            await settle(); await tap_sel('#menu .mb[data-p="char"]', 900, False) if k < 2 else await tap_sel('#hud .por', 900, False)
        cp = await pg.evaluate("()=>({btn:!!document.querySelector('#modals .pf38me'),title:[...document.querySelectorAll('#modals .ph b')].map(e=>e.textContent)})")
        hit = await tap_sel('#modals .pf38me', 800)
        lay = await pg.evaluate(LAYOUT); await pg.screenshot(path=f'{SHOTS}/pf38_me.png')
        ok('2_self', hit and lay and not lay['bad'] and '自己' in lay['text'] and '神识' in lay['text'], {'char': cp, 'lay': lay})
        await close_all(); await settle()
        # 3 开发者面板 → 「人物详情」→ 打开娘
        for k in range(3):
            if await pg.evaluate("()=>!!document.querySelector('.devtabs')"): break
            await settle(); await tap_sel('#devbtn', 700, False)
        await tap_sel('.devtabs .dt[data-t="pf38"]', 500)
        await tap_sel('#modals .pb button[data-x="mom"]', 900); cheats.append('pf38:打开娘的详情')
        lay = await pg.evaluate(LAYOUT); await pg.screenshot(path=f'{SHOTS}/pf38_mom.png')
        ok('3_mom', lay and not lay['bad'] and '娘' in lay['text'] and '唠叨·护短' in lay['text'] and '🔒' in lay['text'], lay)
        # 4 凡人点窥探：境界不够/神识不够 → 置灰提示，不扣次数
        n0 = await G("PF38.ensure(G).peek.n"); await tap_sel('#modals .pf38 button[data-f="peek"]', 600)
        n1 = await G("PF38.ensure(G).peek.n")
        ok('4_peek_locked', n0 == n1 == 0, {'n0': n0, 'n1': n1})
        await close_all(); await settle()
        # 5 神识 +4 ×3（筑基初期 SS 8 → 不够 9；×3 = 金丹？realm 0→3）→ 窥探娘（凡人）
        for k in range(3):
            if await pg.evaluate("()=>!!document.querySelector('.devtabs')"): break
            await settle(); await tap_sel('#devbtn', 700, False)
        await tap_sel('.devtabs .dt[data-t="pf38"]', 500)
        for k in range(3): await tap_sel('#modals .pb button[data-x="ss"]', 300); cheats.append('pf38:神识+4')
        await tap_sel('#modals .pb button[data-x="mom"]', 900)
        before = await G("({n:PF38.ensure(G).peek.n,lg:PF38.has('mom','lg'),aff:G.aff.mom||0,ss:PF38.ss(G)})")
        await tap_sel('#modals .pf38 button[data-f="peek"]', 800)
        after = await G("({n:PF38.ensure(G).peek.n,lg:PF38.has('mom','lg'),aff:G.aff.mom||0,saved:JSON.parse(localStorage.getItem('wbx2_save')||'{}').pf38})")
        await pg.screenshot(path=f'{SHOTS}/pf38_peek.png')
        ok('5_peek', before['ss'] >= 12 and after['n'] == 1 and after['aff'] <= before['aff'] and (after['lg'] or after['aff'] <= before['aff']) and after['saved'] and after['saved']['peek']['n'] == 1, {'before': before, 'after': {k: v for k, v in after.items() if k != 'saved'}})
        txt = await pg.evaluate("()=>document.querySelector('#modals .mwrap:last-child .pf38').innerText")
        ok('6_refresh', ('五行伪灵根' in txt) == after['lg'] and '2/3' in txt, txt[:300])
        await close_all()
        ok('7_no_js_error', not errs, errs[:3])
        await b.close()
    print('cheats:', cheats); print(f'FAILS {fails}'); sys.exit(len(fails))
asyncio.run(main())

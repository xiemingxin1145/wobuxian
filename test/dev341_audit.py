# 3.4.1 开发者面板审计：逐个 Tab、逐个按钮真实触摸点按，记录点按前后游戏状态差异 + JS 错误。
# 只走 UI（CDP touch），evaluate 只读。输出 test/results/dev341_audit.json，截图 /workspace/shots341/audit_*.png
import asyncio, os, sys, json
from playwright.async_api import async_playwright
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www')
URL = 'file://' + os.path.abspath(ROOT) + '/index.html#dev'
VW, VH = 412, 915
SHOTS = os.environ.get('SHOTS', '/workspace/shots341')
ONLY = [x for x in os.environ.get('TABS', '').split(',') if x]
SNAP = """()=>{const G=Game.G;if(!G)return null;const n=o=>o?Object.keys(o).length:0;const s=Game.stats();return {stone:G.stone,xyf:G.inv.xyf||0,inv:Object.values(G.inv).reduce((a,b)=>a+b,0),ninv:n(G.inv),ap:G.ap,apMax:Game.apMax(),debt:G.debt,hp:G.hp,mhp:s.mhp,mp:G.mp,realm:G.realm,stage:G.stage,exp:Math.round(G.exp),need:Game.need(),life:G.lifeBonus,devmaps:!!G.flags.devmaps,cg:n(Game.meta.cg),mounts:(G.mounts||[]).length,cos:n(Game.meta.cos),pets:G.pets.length,aff:Object.values(G.aff).reduce((a,b)=>a+b,0),techs:n(G.techs),main:G.main,map:R.mapId,god:DEV.god,ohk:DEV.ohk,noEnc:DEV.noEnc,ts:R.ts,fb33:G.fb33?G.fb33.tier+':'+G.fb33.aff:null,wb33:!!(G.wb33&&G.wb33.y===G.year),eqs:G.eqs.length,talents:G.talents.length,shentong:(G.shentong||[]).length,modal:!!UI.modal,battle:!!(typeof B!=='undefined'&&B.on),rel:typeof Life34!=='undefined'?JSON.stringify(Life34.st().rel).length:0,offAt:G.offAt||0,dev:G.dev||0}}"""
async def main():
    out = []; errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME', '/opt/google/chrome/chrome'), args=['--allow-file-access-from-files'])
        ctx = await b.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        cdp = await ctx.new_cdp_session(pg)
        async def tap(x, y):
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]}); await pg.wait_for_timeout(60)
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        async def tap_sel(sel, nth=0, wait=400):
            r = await pg.evaluate("([s,n])=>{const e=document.querySelectorAll(s)[n];if(!e)return null;e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;const top=document.elementFromPoint(x,y);return {x,y,hit:!!top&&(top===e||e.contains(top))}}", [sel, nth])
            if not r: return 'missing'
            await pg.wait_for_timeout(120)
            await tap(r['x'], r['y']); await pg.wait_for_timeout(wait); return 'ok' if r['hit'] else 'covered'
        async def closeall(n=24):
            for k in range(n):
                if await pg.evaluate('()=>UX.inMap()'): return
                fx = await pg.evaluate("()=>{const e=document.querySelector('.gacha-fx,.brk-fx,.g22w,.mwrap');return !UI.modal&&!!document.querySelector('.gacha-fx,.brk-fx')}")
                if fx: await tap(206, 140); await pg.wait_for_timeout(700); continue
                if not await pg.evaluate('()=>!!UI.modal||(typeof B!=="undefined"&&B.on)'): await pg.wait_for_timeout(700); continue
                if await pg.evaluate('()=>typeof B!=="undefined"&&B.on'):
                    await tap_sel('#battlebar button[data-a=auto]', 0, 1500); continue
                for s in ['#modals .mwrap:last-child .ph .x', '#modals .mwrap:last-child .opt', '#modals .mwrap:last-child button']:
                    if await pg.evaluate("(s)=>{const e=document.querySelector(s);return !!e&&e.offsetParent!==null}", s):
                        await tap_sel(s, 0, 500); break
                else: await pg.wait_for_timeout(500)
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        await pg.tap('text=开始新人生'); await pg.wait_for_timeout(400); await pg.tap('#nx'); await pg.wait_for_timeout(200)
        for k in range(3): await pg.locator('.talb').nth(k).tap()
        for k in range(3): await pg.tap('#nx'); await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(2500); await closeall()
        await tap_sel('#devbtn', 0, 600)
        tabs = await pg.evaluate("()=>{const t=[...document.querySelectorAll('.devtabs .dt')].map(e=>[e.dataset.t,e.textContent]);return t}")
        await closeall()
        for tk, tn in tabs:
            if ONLY and tk not in ONLY: continue
            await tap_sel('#devbtn', 0, 600); await tap_sel(f'.devtabs .dt[data-t="{tk}"]', 0, 500)
            await pg.screenshot(path=f'{SHOTS}/audit_{tk}.png')
            btns = await pg.evaluate("()=>[...document.querySelectorAll('#modals .pb [data-a],#modals .pb [data-a33],#modals .pb button')].filter((e,i,a)=>a.indexOf(e)===i).map((e,i)=>({i,a:e.dataset.a||e.dataset.a33||e.className,t:e.textContent.trim().slice(0,30)}))")
            await closeall()
            for bt in btns:
                if bt['a'] in ('reset', 'devoff') or bt['a'].startswith('dt'): continue
                e0 = len(errs); s0 = await pg.evaluate(SNAP)
                await tap_sel('#devbtn', 0, 600); await tap_sel(f'.devtabs .dt[data-t="{tk}"]', 0, 400)
                toast0 = await pg.evaluate("()=>document.querySelectorAll('.toast').length")
                res = await tap_sel("#modals .pb [data-a],#modals .pb [data-a33],#modals .pb button", bt['i'], 900)
                toasts = await pg.evaluate("()=>[...document.querySelectorAll('.toast')].map(e=>e.textContent).slice(-2)")
                mid = await pg.evaluate(SNAP)
                await closeall(); await pg.wait_for_timeout(300); s1 = await pg.evaluate(SNAP)
                diff = {k: [s0[k], s1[k]] for k in s0 if s0[k] != s1[k]} if s0 and s1 else 'nostate'
                rec = dict(tab=tk, a=bt['a'], label=bt['t'], tap=res, diff=diff, mid_modal=mid and mid['modal'], mid_battle=mid and mid['battle'], toast=toasts, errors=errs[e0:])
                out.append(rec); print(json.dumps(rec, ensure_ascii=False), flush=True)
        os.makedirs(os.path.join(os.path.dirname(__file__), 'results'), exist_ok=True)
        json.dump(out, open(os.path.join(os.path.dirname(__file__), 'results', 'dev341_audit.json'), 'w'), ensure_ascii=False, indent=1)
        await b.close()
asyncio.run(main())

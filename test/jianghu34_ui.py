# 3.4 江湖自转 真实点按流程（CDP 触摸，412×915 DPR2）：坊市点赵铁锅 → 对话「⚑ 奇遇·铁锅的债（1/3）」→ 作保 → 债务/好感变化 → 更多→江湖风云面板（不溢出）
# 场景准备（作弊，记录在结果里）：page.evaluate 新人生 + 觉醒 + 筑基 + 灵石/欠款 1000 + 赵铁锅本月在坊市且不游历 + 直接进坊市。之后只用触摸。截图 test/jianghu34/（不入库）
import asyncio, os, json, sys
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.abspath(__file__)); URL = 'file://' + os.path.abspath(os.path.join(ROOT, '..', 'www', 'index.html')); OUT = os.path.join(ROOT, 'jianghu34') + '/'; os.makedirs(OUT, exist_ok=True)
CHEATS = ['newLife', 'awakened', 'realm=2', 'stone=1000', 'debt=1000', 'jh_tieguo@market hold', 'enterMap(market)']
JS_TOP = "()=>{const w=[...document.querySelectorAll('#modals .mwrap')].filter(w=>!w.classList.contains('outm')).pop();if(!w)return null;return {title:(w.querySelector('.ct,.ph b,.dn')||{}).textContent||'',opts:[...w.querySelectorAll('.opt')].map(b=>b.textContent.trim())}}"
JS_OPT = "(t)=>{const w=[...document.querySelectorAll('#modals .mwrap')].filter(w=>!w.classList.contains('outm')).pop();if(!w)return null;const b=[...w.querySelectorAll('.opt')].find(b=>b.textContent.trim().startsWith(t));if(!b)return null;const r=b.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}"
JS_SEL = "([s,t])=>{const b=[...document.querySelectorAll(s)].find(b=>{const r=b.getBoundingClientRect();return r.width>0&&(!t||b.textContent.includes(t))});if(!b)return null;const r=b.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}"
JS_NPC = "(id)=>{const e=R.ents.find(x=>x.id===id);if(!e)return null;const h=entHitRect(e);const [a,b]=w2s((h.x0+h.x1)/2,(h.y0+h.y1)/2);return [a/R.dpr,b/R.dpr]}"
async def main():
    errs = []; res = {'cheats': CHEATS}
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--allow-file-access-from-files'])
        ctx = await br.new_context(viewport={'width': 412, 'height': 915}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg)
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        async def tap(xy, wait=600):
            x, y = xy; await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]}); await pg.wait_for_timeout(70)
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await pg.wait_for_timeout(wait)
        async def opt(t, wait=700):
            xy = await pg.evaluate(JS_OPT, t)
            if xy: await tap(xy, wait)
            return bool(xy)
        await pg.goto(URL); await pg.wait_for_timeout(3000)
        await pg.evaluate("""async()=>{Game.newLife({name:'测试',sex:'m',lg:LINGGEN[1].id,talents:[],st:{str:5,con:5,int:5,luck:5,wealth:5,charm:5}});const G=Game.G;G.flags.awakened=1;G.mingge=['nitian'];G.flags.mg33_done=1;G.realm=2;G.stone=1000;G.debt=1000;G.flags.chShown=99;
          const L=JH34.ensure(G);L.npcs.jh_tieguo.map='market';L.npcs.jh_tieguo.hold=1;document.body.classList.add('ingame');const t=document.getElementById('title');if(t)t.style.display='none';G.map='market';G.pos=null;await Game.enterMap('market');}""")
        await pg.wait_for_timeout(2500)
        for _ in range(10):
            top = await pg.evaluate(JS_TOP)
            if not top: break
            await tap(await pg.evaluate(JS_OPT, top['opts'][-1]) if top['opts'] else (200, 450))
        res['npcVisible'] = (await pg.evaluate(JS_NPC, 'jh_tieguo')) is not None
        res['mark'] = await pg.evaluate("()=>{const e=R.ents.find(x=>x.id==='jh_tieguo');return e?e.mark:null}")
        opened = False
        for k in range(4):   # 点他（远了会先走过去再开对话）
            xy = await pg.evaluate(JS_NPC, 'jh_tieguo')
            if not xy: break
            if not (20 < xy[0] < 392 and 120 < xy[1] < 760):  # 不在屏内：点他方向的地面走近一些
                await tap((max(40, min(372, xy[0])), max(200, min(700, xy[1]))), 2500); continue
            await tap(xy, 300)
            for _ in range(30):
                top = await pg.evaluate(JS_TOP)
                if top: break
                await pg.wait_for_timeout(500)
            if top and any(o.startswith('⚑ 奇遇·铁锅的债') for o in top['opts']): opened = True; break
            if top: await opt('离开')
        res['dialogHasChain'] = opened; await pg.screenshot(path=OUT + '01_dialog.png')
        if opened:
            await opt('⚑ 奇遇·铁锅的债'); top = await pg.evaluate(JS_TOP); res['chainCard'] = top
            await pg.screenshot(path=OUT + '02_chain.png')
            await opt('替他作保', 900); top = await pg.evaluate(JS_TOP); res['resultCard'] = top
            await opt('好', 800)
            st = await pg.evaluate("()=>({debt:Game.G.debt,aff:Game.G.aff.jh_tieguo,s:Game.G.jh34.ch.tieguo.s})"); res['after'] = st
            await opt('离开', 800)
        await tap(await pg.evaluate(JS_SEL, ['#menu .mb', '更多']), 800)
        await tap(await pg.evaluate(JS_SEL, ['#modals .big2', '江湖风云']), 1000)
        panel = await pg.evaluate("()=>{const w=[...document.querySelectorAll('#modals .mwrap')].pop();if(!w)return null;const b=w.querySelector('.pb,.body,.pbody')||w;return {txt:w.innerText.slice(0,600),over:[...w.querySelectorAll('*')].some(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>413||r.left<-1)})}}")
        res['panel'] = panel; await pg.screenshot(path=OUT + '03_panel.png')
        await br.close()
    ok = res.get('npcVisible') and res.get('mark') == '⚑' and res.get('dialogHasChain') and res.get('after', {}).get('debt') == 1300 and res.get('after', {}).get('aff') == 20 and res.get('after', {}).get('s') == 1 \
        and res.get('panel') and '宗门势力' in res['panel']['txt'] and '铁锅的债' in res['panel']['txt'] and not res['panel']['over']
    res['ok'] = bool(ok); res['errs'] = errs
    print(json.dumps(res, ensure_ascii=False, indent=1)); sys.exit(0 if ok and not errs else 1)
asyncio.run(main())

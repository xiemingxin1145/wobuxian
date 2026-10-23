# 3.4.0 回归：催收令标记旁站着怪 / 刷怪贴着 NPC 时，点标记名牌仍打开「天道催收使」而不是开怪战（S3）；刷怪离 NPC/标记 ≥2 格（N1）
import asyncio, json, sys, os
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--allow-file-access-from-files'])
        ctx = await b.new_context(viewport={'width': 412, 'height': 915}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///' + os.path.abspath('www/index.html')); await pg.wait_for_timeout(1500)
        await pg.tap('text=开始新人生'); await pg.wait_for_timeout(400); await pg.tap('#nx')
        for k in range(3): await pg.locator('.talb').nth(k).tap()
        for k in range(3): await pg.tap('#nx'); await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(2500)
        for k in range(10):
            o = pg.locator('#modals .opt').first
            if await o.count(): await o.tap(); await pg.wait_for_timeout(400)
        out = {}
        # N1：重新刷怪后没有怪贴着 NPC/标记
        out['mons_close'] = await pg.evaluate("()=>{Game.spawnMonsters();return R.ents.filter(e=>e.kind==='mon'&&!e.gone&&Life34.tooClose(e.i,e.j)).length}")
        # S3：降临催收使，把一只怪放到标记格上，点标记名牌
        await pg.evaluate("()=>{const G=Game.G;G.flags.awakened=1;G.realm=3;G.wb33=null;WB33.spawn(true)}"); await pg.wait_for_timeout(1500)
        for k in range(5):
            o = pg.locator('#modals .opt').first
            if await o.count(): await o.tap(); await pg.wait_for_timeout(500)
        r = await pg.evaluate("""()=>{const G=Game.G;
          const m=R.marks.find(m=>m.act==='wb33');if(!m)return null;const mon=R.ents.find(e=>e.kind==='mon'&&!e.gone);if(mon){mon.i=m.i+0.5;mon.j=m.j+0.6;mon.path=[];mon.ai=()=>{};}
          const [x,y]=t2p(m.i+0.5,m.j+0.5);const [sx,sy]=w2s(x,y-(m.h||110));return {s:[sx/R.dpr,sy/R.dpr],tries:G.wb33.tries,mon:!!mon}}""")
        out['setup'] = r; ok_card = False; battle = False
        if r:
            await pg.wait_for_timeout(500)
            out['pick'] = await pg.evaluate(f"()=>{{const h=pickAt({r['s'][0]}*R.dpr,{r['s'][1]}*R.dpr);return h.mark?'mark:'+h.mark.act:h.ent?h.ent.kind+':'+h.ent.label:'tile'}}")
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': r['s'][0], 'y': r['s'][1], 'id': 0}]}); await pg.wait_for_timeout(60)
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
            for k in range(60):
                await pg.wait_for_timeout(300); s = await pg.evaluate("()=>({b:R.mode==='battle',t:UI.stack.map(e=>e.innerText.slice(0,12)).join('|')})")
                if s['b']: battle = True; break
                if '天道催收使' in s['t']: ok_card = True; break
        out['last'] = await pg.evaluate("()=>({mode:R.mode,modal:!!UI.modal,t:UI.stack.map(e=>e.innerText.slice(0,20)).join('|'),d:(()=>{const m=R.marks.find(m=>m.act==='wb33');return m&&Math.hypot(m.i+.5-R.player.i,m.j+.5-R.player.j)})()})")
        out['card'] = ok_card; out['monster_battle'] = battle
        fails = [k for k, v in [('mons_close', out['mons_close'] == 0), ('card', ok_card and not battle)] if not v]
        print(json.dumps({'out': out, 'fails': fails, 'js_errors': errs}, ensure_ascii=False, indent=1)); await b.close()
        sys.exit(1 if fails or errs else 0)
asyncio.run(main())

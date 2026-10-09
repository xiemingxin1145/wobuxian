import asyncio, sys, json
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'file:///workspace/game/www/index.html'
OUT = '/workspace/game/test/'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': 412, 'height': 892}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); pg.set_default_timeout(5000)
        errs = []
        pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
        pg.on('console', lambda m: errs.append('console.' + m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=OUT + 's1_title.png')
        await pg.click('#bNew'); await pg.wait_for_timeout(300)
        for k in range(3): await pg.locator('#talentList .card').nth(k).click()
        await pg.screenshot(path=OUT + 's2_talent.png')
        await pg.click('#bTalentOk'); await pg.wait_for_timeout(200)
        await pg.click('#bLing'); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=OUT + 's3_stats.png')
        await pg.click('#bBorn'); await pg.wait_for_timeout(1200)
        # boost for testing
        async def handle_modal():
            for _ in range(6):
                vis = await pg.evaluate("!document.getElementById('modal').classList.contains('hidden')")
                if not vis: return
                btn = await pg.query_selector('#evCh .btn, #evOk, #bagX, #shX, #mpX')
                if btn: await btn.click(); await pg.wait_for_timeout(250)
                else: return
        shots = 0
        for i in range(int(__import__("os").environ.get("TURNS","14"))):
            acts = await pg.query_selector_all('#actions .btn')
            if not acts: break
            await acts[0 if i % 3 else min(1, len(acts)-1)].click()
            for _ in range(40):
                await pg.wait_for_timeout(150)
                await handle_modal()
                busy = await pg.evaluate("document.getElementById('battleTag').classList.contains('hidden')")
                if busy: break
            print('turn', i, await pg.evaluate("__wbx.S && __wbx.S.age"), flush=True)
            if i == 8: await pg.screenshot(path=OUT + 's4_village.png')
            alive = await pg.evaluate("window.__wbx.S && window.__wbx.S.alive")
            if not alive: break
        st = await pg.evaluate("JSON.stringify({age:__wbx.S.age, realm:__wbx.S.realm, stage:__wbx.S.stage, exp:__wbx.S.exp, loc:__wbx.S.loc, flags:__wbx.S.flags})")
        print('state', st)
        # 跳到秘境并斗法
        await pg.evaluate("(()=>{const S=__wbx.S; S.realm=Math.max(S.realm,2); S.flags.manual=1; S.unlocked.sect=1; S.age=Math.max(S.age,20);})()")
        await pg.evaluate("(()=>{const S=__wbx.S; S.loc='secret'; __wbx.R.setMap('secret');})()")
        await pg.click('#bMenu'); await pg.click('#mnBack')
        await pg.click('#bMap'); await pg.wait_for_timeout(300)
        await pg.click('[data-loc=sect]'); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=OUT + 's5_sect.png')
        await pg.click('#bMap'); await pg.wait_for_timeout(300)
        await pg.click('[data-loc=secret]'); await pg.wait_for_timeout(1500)
        acts = await pg.query_selector_all('#actions .btn')
        await acts[1].click(); await pg.wait_for_timeout(1700)
        await pg.screenshot(path=OUT + 's6_battle.png')
        for _ in range(60):
            await pg.wait_for_timeout(200); await handle_modal()
            if await pg.evaluate("document.getElementById('battleTag').classList.contains('hidden') && !__wbx.S || document.getElementById('battleTag').classList.contains('hidden')"): break
        await handle_modal()
        # 天劫
        await pg.evaluate("(()=>{const S=__wbx.S; S.realm=2; S.stage=3; S.exp=99999; S.st.luck=10; S.injured=0;})()")
        await pg.click('#bMap'); await pg.click('[data-loc=market]'); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=OUT + 's7_market.png')
        await pg.evaluate("()=>{__wbx.doAction('cult')}"); await pg.wait_for_timeout(300); await handle_modal(); await pg.wait_for_timeout(1500); await handle_modal()
        await pg.evaluate("(()=>{const S=__wbx.S; S.exp=99999; S.stage=3})()")
        await pg.evaluate("document.getElementById('bBreak').disabled=false"); 
        await pg.evaluate("()=>{__wbx.doBreak()}"); await pg.wait_for_timeout(400)
        await pg.click('#bkGo'); await pg.wait_for_timeout(2300)
        await pg.screenshot(path=OUT + 's8_trib.png')
        await pg.wait_for_timeout(4000); await handle_modal()
        await pg.screenshot(path=OUT + 's9_after.png')
        await pg.click('#bBag'); await pg.wait_for_timeout(300); await pg.screenshot(path=OUT + 's10_bag.png'); await pg.click('#bagX')
        await pg.click('#bMenu'); await pg.click('#mnSuicide'); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=OUT + 's11_death.png')
        await pg.click('#dMeta'); await pg.wait_for_timeout(300); await pg.screenshot(path=OUT + 's12_meta.png')
        fps = await pg.evaluate("new Promise(r=>{let n=0,t=performance.now();function f(){n++; if(performance.now()-t<2000) requestAnimationFrame(f); else r(n/2)} requestAnimationFrame(f)})")
        print('fps', fps)
        print('ERRORS', json.dumps(errs, ensure_ascii=False, indent=1))
        await b.close()
asyncio.run(main())

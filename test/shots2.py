import asyncio, sys, time
from playwright.async_api import async_playwright
URL = 'file://' + __import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__), '..', 'www', 'index.html'))
OUT = '/workspace/game/test/shots/'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=OUT + '00_title.png')
        await pg.click('text=开始新人生'); await pg.wait_for_timeout(400)
        await pg.click('#nx'); await pg.wait_for_timeout(300)
        for k in range(3): await pg.locator('.talb').nth(k).click()
        await pg.screenshot(path=OUT + '01_talents.png')
        await pg.click('#nx'); await pg.wait_for_timeout(300); await pg.click('#rs'); await pg.click('#nx'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT + '02_linggen.png')
        await pg.click('#nx'); await pg.wait_for_timeout(3000)
        await pg.screenshot(path=OUT + '03_event_born.png')
        async def clear():
            for k in range(8):
                o = pg.locator('#modals .opt').first
                if await o.count(): await o.click(); await pg.wait_for_timeout(350)
                else:
                    x = pg.locator('#modals .x').first
                    if await x.count(): await x.click(); await pg.wait_for_timeout(300)
                    else: break
        await clear()
        await pg.evaluate("""()=>{const G=Game.G; G.flags.awakened=1; G.realm=4; G.stage=1; G.age=160; G.stone=88888; G.sex=G.sex;
          Game.learn('qingyun'); Game.learn('changsheng'); for (const t of Object.keys(TECHS).slice(3,7)) Game.learn(t);
          for (const k of ['hcd','hld','pyd','zjd','tsf','ysf','herb','lz','ore','peach','egg','ledger','wine']) Game.give(k, 3);
          for (const sl of ['weapon','armor','treasure']) { try { const e=Game.randEq(4.2, 3, sl); G.eqs.push(e); Game.equip(e.uid);} catch(e){} }
          for (let k=0;k<6;k++) try { G.eqs.push(Game.randEq(3+Math.random()*2, k%5)); } catch(e){}
          Game.addPet('fox', 4); Game.addPet('crab', 4); G.pts=3; Game.joinSect('qingyun'); const s=Game.stats(); G.hp=s.mhp; G.mp=s.mmp; UI.hud(); }""")
        for i, mid in enumerate(['village','sect','market','secret','graveyard','island','rift','heaven']):
            await pg.evaluate(f"async()=>{{Game.G.pos=null; R.ents=[]; await Game.enterMap('{mid}');}}")
            await pg.wait_for_timeout(2600); await clear()
            await pg.screenshot(path=OUT + f'map_{i}_{mid}.png')
        # walk: tap-to-move in heaven
        await pg.mouse.click(250, 380); await pg.wait_for_timeout(900)
        await pg.screenshot(path=OUT + 'map_walk.png')
        await pg.evaluate("async()=>{Game.G.pos=null; R.ents=[]; await Game.enterMap('island');}"); await pg.wait_for_timeout(2000); await clear()
        # battle
        await pg.evaluate("()=>{B.speed=1; Game.fight('dragon',{tier:4.2, adds:['crab','crab']}); return 1}")
        await pg.wait_for_timeout(3500)
        await pg.screenshot(path=OUT + 'battle_0.png')
        sk = pg.locator('#battlebar button[data-a=skill]')
        if await sk.count():
            await sk.click(); await pg.wait_for_timeout(300); await pg.screenshot(path=OUT + 'battle_skills.png')
            s1 = pg.locator('#battlebar button[data-s]:not([disabled])')
            n = await s1.count()
            if n: await s1.nth(min(2, n-1)).click(); await pg.wait_for_timeout(300)
            await pg.mouse.click(110, 330); await pg.wait_for_timeout(300)
        for k in range(10):
            await pg.wait_for_timeout(260); await pg.screenshot(path=OUT + f'battle_fx{k}.png')
        await pg.evaluate("()=>{B.speed=6}")
        for k in range(200):
            if not await pg.evaluate("()=>B.on"): break
            await pg.evaluate("()=>{const ab=document.querySelector('#battlebar button[data-a=auto]'); if(ab && !document.querySelector('#battlebar.wait')) ab.click();}")
            await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(500); await pg.screenshot(path=OUT + 'battle_end.png'); await clear()
        await pg.evaluate("()=>{B.speed=1}")
        for nm in ['bag','char','skills','pets','quests','travel','ach','comps','more']:
            await pg.evaluate(f"()=>{{UI.panel('{nm}'); return 1}}"); await pg.wait_for_timeout(500)
            await pg.screenshot(path=OUT + f'ui_{nm}.png'); await clear()
        await pg.evaluate("()=>{UI.alchemy(); return 1}"); await pg.wait_for_timeout(600)
        await pg.screenshot(path=OUT + 'ui_alchemy.png'); await clear()
        await pg.evaluate("()=>{const ev=EVENTS.find(e=>e[0]&&e[0].startsWith('m_'))||EVENTS[40]; Game.runEvent(ev); return 1}"); await pg.wait_for_timeout(700)
        await pg.screenshot(path=OUT + 'event_card.png'); await clear()
        await pg.evaluate("()=>{Game.die('sit'); return 1}"); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=OUT + 'ending.png')
        print('ERRORS', len(errs)); from collections import Counter; [print(n, 'x', e[:300]) for e, n in Counter(errs).most_common(30)]
        await b.close()
asyncio.run(main())

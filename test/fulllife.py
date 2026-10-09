import asyncio, sys, time
from playwright.async_api import async_playwright
URL = 'file://' + __import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__), '..', 'www', 'index.html'))
OUT = '/workspace/game/test/out2/'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type in ('error',) else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=OUT + 'title.png')
        await pg.click('text=开始新人生'); await pg.wait_for_timeout(500)
        await pg.screenshot(path=OUT + 'create0.png')
        await pg.click('#nx'); await pg.wait_for_timeout(300)
        for k in range(3): await pg.locator('.talb').nth(k).click()
        await pg.screenshot(path=OUT + 'create1.png')
        await pg.click('#nx'); await pg.wait_for_timeout(300); await pg.click('#rs'); await pg.click('#nx'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT + 'create3.png')
        await pg.click('#nx'); await pg.wait_for_timeout(3000)
        await pg.screenshot(path=OUT + 'born.png')
        for k in range(3):
            o = pg.locator('#modals .opt').first
            if await o.count(): await o.click(); await pg.wait_for_timeout(400)
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=OUT + 'map.png')
        await pg.evaluate("()=>{B.speed=6}")
        t0 = time.time(); last = ''; shot_end = False
        while time.time() - t0 < float(sys.argv[1] if len(sys.argv) > 1 else 60):
            r = await pg.evaluate("()=>BOT.tick()")
            await pg.wait_for_timeout(120)
            if r == 'ending' and not shot_end:
                shot_end = True; await pg.screenshot(path=OUT + 'ending_pre.png')
            if r == 'meta':
                await pg.wait_for_timeout(800); await pg.screenshot(path=OUT + 'meta.png'); break
            if int(time.time()-t0) % 15 == 0 and int(time.time()-t0) != last:
                last = int(time.time()-t0); print(last, await pg.evaluate("()=>Game.G && [Game.G.age, Game.realmName(), Game.G.main, R.mapId, Game.G.killsTotal, Game.G.hp|0, Math.round(Game.G.stone)].join(' ')"), flush=True)
        st = await pg.evaluate("()=>Game.G && ({age:Game.G.age, realm:Game.G.realm, stage:Game.G.stage, main:Game.G.main, map:R.mapId, kills:Game.G.killsTotal, dead:Game.G.dead, ending:Game.G.ending, stone:Game.G.stone})")
        print(st)
        await pg.screenshot(path=OUT + 'after.png')
        print('ERRORS', len(errs)); from collections import Counter; [print(n, 'x', e[:300]) for e, n in Counter(errs).most_common(30)]
        await b.close()
asyncio.run(main())

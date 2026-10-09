import asyncio
from playwright.async_api import async_playwright
O = '/workspace/game/screenshots/'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome')
        ctx = await b.new_context(viewport={'width': 412, 'height': 892}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///workspace/game/www/index.html'); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=O + '01_title.png')
        await pg.click('#bNew'); await pg.wait_for_timeout(300)
        for k in (0, 2, 4): await pg.locator('#talentList .card').nth(k).click()
        await pg.screenshot(path=O + '02_talents.png')
        await pg.click('#bTalentOk'); await pg.click('#bLing'); await pg.wait_for_timeout(1600); await pg.click('#bBorn'); await pg.wait_for_timeout(1500)
        await pg.evaluate("()=>{const S=__wbx.S; S.age=16; S.realm=1; S.stage=2; S.exp=40; S.flags.manual=1; S.unlocked.sect=1; __wbx.G0=1}")
        for _ in range(3):
            await pg.evaluate("()=>{__wbx.doAction('cult')}"); await pg.wait_for_timeout(900)
            while await pg.evaluate("!document.getElementById('modal').classList.contains('hidden')"):
                await pg.locator('#evCh .btn, #evOk').first.click(); await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{__wbx.runEvent(EVENTS.find(e=>e.id==='meet_mentor'))}"); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=O + '03_event.png')
        await pg.locator('#evCh .btn').first.click(); await pg.wait_for_timeout(400); await pg.click('#evOk')
        await pg.evaluate("()=>{__wbx.travel('secret')}"); await pg.wait_for_timeout(2600)
        await pg.evaluate("()=>{__wbx.battle('fox', 1.0, '狐妖')}"); await pg.wait_for_timeout(2150)
        await pg.screenshot(path=O + '04_battle.png')
        await pg.wait_for_timeout(9000)
        await pg.evaluate("()=>{__wbx.travel('sect')}"); await pg.wait_for_timeout(2600)
        await pg.evaluate("()=>{const S=__wbx.S; S.realm=2; S.stage=3; S.exp=99999; S.age=60; S.st.luck=10}")
        await pg.evaluate("()=>{__wbx.doBreak()}"); await pg.wait_for_timeout(500); await pg.click('#bkGo')
        for t in range(40):
            await pg.wait_for_timeout(60)
            if await pg.evaluate("__wbx.R.ents && document.querySelector('#log').innerText.includes('冲击金丹')") and t > 22: break
        await pg.screenshot(path=O + '05_tribulation.png')
        await pg.wait_for_timeout(5000)
        print('errors', errs)
        await b.close()
asyncio.run(main())

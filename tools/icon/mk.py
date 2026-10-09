import asyncio
from playwright.async_api import async_playwright
sizes = {'mdpi':48,'hdpi':72,'xhdpi':96,'xxhdpi':144,'xxxhdpi':192}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome')
        for name, n in list(sizes.items()) + [('store', 512)]:
            pg = await b.new_page(viewport={'width': n, 'height': n})
            await pg.goto(f'file:///workspace/game/tools/icon/icon.html#{n}'); await pg.wait_for_timeout(400)
            out = f'/workspace/game/android/app/src/main/res/mipmap-{name}/ic_launcher.png' if name != 'store' else '/workspace/game/icon-512.png'
            import os; os.makedirs(os.path.dirname(out), exist_ok=True)
            await pg.locator('#c').screenshot(path=out, omit_background=True)
            await pg.close()
        await b.close()
asyncio.run(main())

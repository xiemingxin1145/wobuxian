# v2.2 突破演出截图（用页面内时间点触发截图，避免截图耗时导致时序偏差）
import asyncio, os, sys
from playwright.async_api import async_playwright
ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out22') + '/'; os.makedirs(OUT, exist_ok=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--allow-file-access-from-files'])
        pg = await (await b.new_context(viewport={'width': 412, 'height': 915}, device_scale_factor=2, is_mobile=True, has_touch=True)).new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + os.path.abspath(ROOT) + '/index.html'); await pg.wait_for_timeout(1500)
        await pg.click('text=开始新人生'); await pg.wait_for_timeout(400); await pg.click('#nx'); await pg.wait_for_timeout(200)
        for k in range(3): await pg.locator('.talb').nth(k).click()
        await pg.click('#nx'); await pg.wait_for_timeout(200); await pg.click('#nx'); await pg.wait_for_timeout(200); await pg.click('#nx'); await pg.wait_for_timeout(2500)
        for k in range(5):
            o = pg.locator('#modals .opt').first
            if await o.count(): await o.click(); await pg.wait_for_timeout(400)
        for fail in (False, True):
            tag = 'fail' if fail else 'ok'
            # 暂停时间：演出期间逐个阶段截图（演出本身用 setTimeout，截图前等待到目标时刻）
            await pg.evaluate(f"()=>{{window.__bd=0;VFX.breakthrough('{'练气失败' if fail else '筑基期'}',{str(fail).lower()}).then(()=>window.__bd=1)}}")
            for name, at in [('clouds', 450), ('bolt', 1100), ('gold', 2600), ('title', 3300)]:
                await pg.wait_for_function(f"()=>performance.now()-(window.__bt0||(window.__bt0=performance.now()))>={at}") if False else await pg.wait_for_timeout(at if name == 'clouds' else 0)
                await pg.screenshot(path=OUT + f'brk_{tag}_{name}.png')
            await pg.wait_for_function('()=>window.__bd===1', timeout=15000)
        print('errors', errs)
        await b.close()
asyncio.run(main())

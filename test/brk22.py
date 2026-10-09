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
            await pg.evaluate(f"()=>{{window.__bd=0;VFX.breakthrough('{'金丹期' if fail else '筑基期'}',{str(fail).lower()}).then(()=>window.__bd=1)}}")
            # 按演出相位截图：乌云(0.4s) → 雷击(1.0s) → 大字出现(.show) → 大字停留 0.6s
            await pg.wait_for_timeout(400); await pg.screenshot(path=OUT + f'brk_{tag}_clouds.png')
            await pg.wait_for_timeout(600); await pg.screenshot(path=OUT + f'brk_{tag}_bolt.png')
            await pg.wait_for_selector('.brk-fx.show', timeout=10000); await pg.wait_for_timeout(150); await pg.screenshot(path=OUT + f'brk_{tag}_gold.png')
            await pg.wait_for_timeout(600); await pg.screenshot(path=OUT + f'brk_{tag}_title.png')
            await pg.wait_for_function('()=>window.__bd===1', timeout=15000)
        print('errors', errs)
        await b.close()
asyncio.run(main())

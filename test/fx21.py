# 技能序列帧特效冒烟测试：#bot 自动游玩，战斗中截图，统计 JS 错误
import asyncio, os, sys
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'www', 'index.html')) + '#bot'
OUT = os.path.join(os.path.dirname(__file__), 'out21') + '/'
async def main(secs):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files'])
        ctx = await b.new_context(viewport={'width': 412, 'height': 915}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load' not in m.text else None)
        pg.on('requestfailed', lambda r: None if 'ABORTED' in (r.failure or '') else errs.append('REQFAIL ' + str(r.failure) + ' ' + r.url.split('www/')[-1]))
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        await pg.goto(URL); shots = 0; t = 0
        while t < secs and shots < 6:
            await pg.wait_for_timeout(250); t += 0.25
            st = await pg.evaluate("()=>{try{return R.mode==='battle' && B.on}catch(e){return false}}")
            if st and int(t * 4) % 6 == 0:
                await pg.screenshot(path=OUT + f'fx_{shots}.png'); shots += 1
        print('shots', shots, 'errors', len(errs)); [print(' ', e[:200]) for e in errs[:10]]
        await b.close()
asyncio.run(main(float(sys.argv[1]) if len(sys.argv) > 1 else 90))

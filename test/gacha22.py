# v2.2 抽卡演出逐帧截图 + 跳过测试
import asyncio, os, sys
from playwright.async_api import async_playwright
ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www')
URL = 'file://' + os.path.abspath(ROOT) + '/index.html'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out22') + '/'; os.makedirs(OUT, exist_ok=True)
ITEMS = "[{tier:2,n:'回春丹×5',ic:'pill_g'},{tier:3,n:'坐骑·筋斗祥云',spr:'mount_cloud'},{tier:2,n:'灵石×300',ic:'stone'},{tier:2,n:'聚气丹×2',ic:'pill_b'},{tier:4,n:'坐骑·仙鹤',spr:'mount_crane'},{tier:2,n:'灵草×3',ic:'herb'},{tier:3,n:'时装·大红喜服',spr:'cos_xifu_m'},{tier:2,n:'兽蛋×1',ic:'egg'},{tier:2,n:'洗髓丹×1',ic:'pill_p'},{tier:4,n:'时装·仙鹤羽衣',spr:'cos_yuyi_m'}]"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'])
        pg = await (await b.new_context(viewport={'width': 412, 'height': 915}, device_scale_factor=2, is_mobile=True, has_touch=True)).new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load' not in m.text else None)
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        await pg.evaluate("()=>{Game.newLife&&0}")
        await pg.evaluate(f"()=>{{window.__g=UI.gachaShow({ITEMS}).then(()=>window.__gd=1)}}")
        t = 0
        for name, at in [('a_array', 700), ('b_charge', 1900), ('c_pillar', 2700), ('d_flip', 3700), ('e_cutin', 4700), ('f_cutin2', 7000)]:
            await pg.wait_for_timeout(at - t); t = at; await pg.screenshot(path=OUT + f'gacha_{name}.png')
        await pg.wait_for_selector('.gclose', timeout=20000); await pg.wait_for_timeout(800); await pg.screenshot(path=OUT + 'gacha_g_result.png')
        await pg.click('.gclose'); await pg.wait_for_timeout(500)
        # 跳过路径
        await pg.evaluate(f"()=>{{UI.gachaShow({ITEMS})}}"); await pg.wait_for_timeout(600); await pg.click('.gskip')
        await pg.wait_for_selector('.gclose', timeout=4000); print('skip ok')
        await pg.screenshot(path=OUT + 'gacha_h_skipped.png')
        print('errors', len(errs)); [print(' ', e[:200]) for e in errs[:8]]
        await b.close()
asyncio.run(main())

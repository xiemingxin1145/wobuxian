# -*- coding: utf-8 -*-
# 新地图验证：建角进游戏，检查 asset-guard 后 MAP_ORDER 含新地图，并逐张进入验证底图/NPC/无报错。
import asyncio, os, sys
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', 'www'))
URL = 'file://' + ROOT + '/index.html'
OUT = os.path.join(HERE, 'out21') + '/'; os.makedirs(OUT, exist_ok=True)
CHROME = os.environ.get('CHROME', '/opt/vm/preinstall/ms-playwright/chromium-1169/chrome-linux/chrome')
NEW_MAPS = ['wanbao','juluyuan','yaowang','jianzhong','luanxing','wendao','jiuct','xianfang','yaochi','lingxiao']

CLICK_JS = """()=>{
  const ws=[...document.querySelectorAll('#modals .mwrap')];
  if(!ws.length) return false;
  const w=ws[ws.length-1];
  const opt=w.querySelector('.opts .opt');
  if(opt){opt.click(); return true;}
  return false;
}"""

async def main():
    errs = []
    results = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)

        async def pump(n=10, every=500):
            for _ in range(n):
                clicked = await pg.evaluate(CLICK_JS)
                await pg.wait_for_timeout(every if clicked else 200)

        await pg.goto(URL); await pg.wait_for_timeout(2500)
        await pg.click('text=开始新人生'); await pg.wait_for_timeout(400)
        await pg.click('#nx'); await pg.wait_for_timeout(300)
        for k in range(3): await pg.locator('.talb').nth(k).click()
        await pg.click('#nx'); await pg.wait_for_timeout(300)
        await pg.click('#rs'); await pg.click('#nx'); await pg.wait_for_timeout(300)
        await pg.click('#nx'); await pg.wait_for_timeout(3000)
        await pump(10, 350)
        await pg.wait_for_timeout(800)

        # 觉醒后检查 MAP_ORDER
        order = await pg.evaluate("()=>MAP_ORDER.slice()")
        in_order = [m for m in NEW_MAPS if m in order]
        results['MAP_ORDER含新地图'] = in_order
        print('MAP_ORDER 新地图:', in_order)

        # 逐张进入（直接 enterMap，绕过境界门槛，测试地图本身）
        for mid in NEW_MAPS:
            try:
                await pg.evaluate(f"()=>{{ Game.enterMap('{mid}'); }}")
                await pg.wait_for_timeout(900)
                await pump(4, 400)
                cur = await pg.evaluate("()=>R.mapId")
                npc_here = await pg.evaluate("()=>{ const n=[]; for(const k in NPCS){ const c=NPCS[k]; if(c.map===R.mapId) n.push(k);} return n; }")
                ok = (cur == mid)
                results[mid] = {'entered': ok, 'npcs': npc_here}
                print(f'{mid}: entered={ok} npcs={npc_here}')
                await pg.screenshot(path=OUT + f'map_{mid}.png')
            except Exception as e:
                results[mid] = {'entered': False, 'err': str(e)}
                print(f'{mid}: ERROR {e}')

        await b.close()

    import json
    json.dump(results, open(OUT + 'results.json', 'w'), ensure_ascii=False, indent=1)
    print('--- errors ---')
    for e in errs: print('ERR:', e[:200])
    print('total errors:', len(errs))
    entered = sum(1 for m in NEW_MAPS if results.get(m, {}).get('entered'))
    print(f'新地图进入成功: {entered}/{len(NEW_MAPS)}')
    sys.exit(0 if entered == len(NEW_MAPS) and not errs else 1)

if __name__ == '__main__':
    asyncio.run(main())

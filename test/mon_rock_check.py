# -*- coding: utf-8 -*-
# AI 精绘精灵链自测（mon_rock）：强制 spr=mon_rock，遍历 5 方向×4 动作截图。
import asyncio, os, sys, json
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', 'www'))
URL = 'file://' + ROOT + '/index.html'
OUT = os.path.join(HERE, 'shots_mon_rock') + '/'; os.makedirs(OUT, exist_ok=True)
CHROME = os.environ.get('CHROME', '/opt/vm/preinstall/ms-playwright/chromium-1169/chrome-linux/chrome')
SID = 'mon_rock'

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
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)

        async def pump(n=10, every=600):
            for _ in range(n):
                clicked = await pg.evaluate(CLICK_JS)
                if clicked: await pg.wait_for_timeout(every)
                else: await pg.wait_for_timeout(250)

        await pg.goto(URL); await pg.wait_for_timeout(2500)
        await pg.click('text=开始新人生'); await pg.wait_for_timeout(400)
        await pg.click('#nx'); await pg.wait_for_timeout(300)
        for k in range(3): await pg.locator('.talb').nth(k).click()
        await pg.click('#nx'); await pg.wait_for_timeout(300)
        await pg.click('#rs'); await pg.click('#nx'); await pg.wait_for_timeout(300)
        await pg.click('#nx'); await pg.wait_for_timeout(3000)
        await pump(10, 350)
        await pg.wait_for_timeout(1200)

        await pg.evaluate(f"()=>{{ if(R.player){{ R.player.spr='{SID}'; R.player.anim='idle'; R.player.dir='S'; R.player.at=0; }} }}")
        await pg.wait_for_timeout(400)
        g = await pg.evaluate(f"()=>{{return {{ spr:R.player.spr, fw:ASSETS.sprites.{SID}.fw, fh:ASSETS.sprites.{SID}.fh }};}}")
        print('forced:', g)

        dirs = ['S','SW','W','NW','N']
        anims = ['idle','walk','attack','hurt']
        for d in dirs:
            for an in anims:
                await pg.evaluate(f"()=>{{ if(R.player){{ R.player.dir='{d}'; R.player.anim='{an}'; R.player.at=0; }} }}")
                await pg.wait_for_timeout(300)
                await pg.screenshot(path=OUT + f'chk_{an}_{d}.png')

        await b.close()

    print('--- errors ---')
    for e in errs: print('ERR:', e[:200])
    print('total errors:', len(errs))

if __name__ == '__main__':
    asyncio.run(main())

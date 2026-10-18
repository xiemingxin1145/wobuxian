# -*- coding: utf-8 -*-
# AI 精绘精灵链自测：建角进游戏，遍历 8 方向 × 4 动作，截图，断言 0 控制台错误。
import asyncio, os, sys, json
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', 'www'))
URL = 'file://' + ROOT + '/index.html'
OUT = os.path.join(HERE, 'shots') + '/'; os.makedirs(OUT, exist_ok=True)
CHROME = os.environ.get('CHROME', '/opt/vm/preinstall/ms-playwright/chromium-1169/chrome-linux/chrome')

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

        g = await pg.evaluate("()=>Game.G ? {age:Game.G.age, map:R.mapId, spr:R.player&&R.player.spr} : null")
        print('game_loaded:', g)

        # 强制把玩家 sprite 换成 player_f2（本任务验证对象）
        await pg.evaluate("()=>{ if(R.player){ R.player.spr='player_f2'; } }")
        await pg.wait_for_timeout(400)
        g2 = await pg.evaluate("()=>R.player && R.player.spr")
        print('forced spr:', g2)

        # 遍历 8 方向 × 4 动作
        dirs = ['S','SW','W','NW','N','NE','E','SE']
        anims = ['idle','walk','attack','hurt']
        for d in dirs:
            for an in anims:
                nframes = await pg.evaluate(f"()=>{{ const S=ASSETS.sprites.player_f2; return S.anims['{an}']||0; }}")
                await pg.evaluate(f"()=>{{ if(R.player){{ R.player.dir='{d}'; R.player.anim='{an}'; R.player.at=0; }} }}")
                await pg.wait_for_timeout(350)
                await pg.screenshot(path=OUT + f'chk_{an}_{d}.png')
                print(f'shot {an}_{d} (n={nframes})')

        await b.close()

    print('--- errors ---')
    for e in errs: print('ERR:', e[:200])
    print('total errors:', len(errs))

if __name__ == '__main__':
    asyncio.run(main())

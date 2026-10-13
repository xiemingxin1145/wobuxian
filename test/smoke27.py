#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 2.7 正式页面 smoke：建号后 BOT 自动玩 90s，断言零 JS/page 错误。
import asyncio, os, sys
from playwright.async_api import async_playwright

URL = 'file://' + os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www', 'index.html')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME', '/opt/vm/preinstall/ms-playwright/chromium-1169/chrome-linux/chrome'),
                                    args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        pg = await (await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True)).new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type=='error' and 'net::ERR_FILE_NOT_FOUND' not in (m.text or '') and 'Failed to load resource' not in (m.text or '') else None)
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        await pg.click('text=开始新人生'); await pg.wait_for_timeout(400)
        await pg.click('#nx'); await pg.wait_for_timeout(200)
        for k in range(3): await pg.locator('.talb').nth(k).click(); await pg.wait_for_timeout(120)
        await pg.click('#nx'); await pg.wait_for_timeout(200)
        await pg.click('#rs'); await pg.click('#nx'); await pg.click('#nx'); await pg.wait_for_timeout(2500)
        for k in range(8):
            o = pg.locator('#modals .opt').first
            if await o.count(): await o.click(); await pg.wait_for_timeout(300)
            else: break
        await pg.wait_for_timeout(800)
        ok = await pg.evaluate("()=> !!(Game.G && R.mode==='map')")
        print('进入游戏:', ok)
        # BOT 自动跑 90s（会自动遇怪打实时战）
        await pg.evaluate("()=>{ if(window.BOT){BOT.on=true; BOT.speed=DEV?DEV.ts||6:6;} }")
        for i in range(18):
            await pg.wait_for_timeout(5000)
            st = await pg.evaluate("()=>({age:Game.G.age,hp:Math.round(Game.G.hp),mode:R.mode,rt:RT27.on?1:0,err:null})")
            print(f'  +{(i+1)*5}s', st)
        print('errors:', len(errs))
        for e in errs[:15]: print('  E:', e[:200])
        await b.close()
        sys.exit(1 if errs else 0)
asyncio.run(main())

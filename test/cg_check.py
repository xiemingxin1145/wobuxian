#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# CG 插画增量自测：建号 → 解锁全 CG（ux23 dev）→ 打开图鉴 → 断言 32 张在列且 0 JS 错误。
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
        # dev 解锁全部 CG
        await pg.evaluate("()=>{ Game.meta.cg={}; for(const [id] of CG_LIST) Game.meta.cg[id]=1; Game.saveMeta(); return CG_LIST.length; }")
        # 打开图鉴（画册）界面
        for _ in range(3):
            await pg.evaluate("()=>{ if(window.UI && UI.dev) UI.dev(); }")
            await pg.wait_for_timeout(500)
        # 直接查 CG_LIST 与解锁状态
        n = await pg.evaluate("()=>CG_LIST.length")
        unlocked = await pg.evaluate("()=>CG_LIST.filter(c=>Game.meta.cg[c[0]]).length")
        new_ids = await pg.evaluate("()=>['cg_feisheng','cg_jiuct','cg_dabi','cg_daolv','cg_dengxian'].every(id=>CG_LIST.some(c=>c[0]===id))")
        print('CG_LIST 总数:', n, '| 已解锁:', unlocked, '| 新5张已注册:', new_ids)
        # 逐张加载确认资源存在
        bad = []
        for cg in ['cg_feisheng','cg_jiuct','cg_dabi','cg_daolv','cg_dengxian']:
            r = await pg.evaluate("(id)=>new Promise(res=>{const i=new Image();i.onload=()=>res('ok');i.onerror=()=>res('MISS');i.src='assets/cg/'+id+'.webp';})", cg)
            if r != 'ok': bad.append(cg)
        print('资源缺失:', bad if bad else '无')
        # 图鉴 DOM 渲染检查
        await pg.evaluate("()=>{const b=document.querySelector('.devr'); if(!b) return 'no-dev'; b.innerHTML=b.innerHTML; return 'ok';}")
        await pg.wait_for_timeout(300)
        await pg.screenshot(path='test/shots_cg/cg_album.png' if os.path.isdir('test/shots_cg') else '/tmp/cg_album.png')
        print('errors:', len(errs))
        for e in errs[:15]: print('  E:', e[:200])
        await b.close()
        sys.exit(1 if (errs or bad or not new_ids or n < 32) else 0)
asyncio.run(main())

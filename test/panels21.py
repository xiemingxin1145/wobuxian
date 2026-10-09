import asyncio, sys, os
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'www', 'index.html'))
OUT = os.path.join(os.path.dirname(__file__), 'out21') + '/'
async def run(p, vw, vh, tag):
    b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files'])
    ctx = await b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = await ctx.new_page(); errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(2000)
    await pg.screenshot(path=OUT + f'{tag}_title.png')
    await pg.click('text=开始新人生'); await pg.wait_for_timeout(400)
    await pg.click('#nx'); await pg.wait_for_timeout(200)
    for k in range(3): await pg.locator('.talb').nth(k).click()
    await pg.click('#nx'); await pg.wait_for_timeout(200); await pg.click('#nx'); await pg.wait_for_timeout(200)
    await pg.click('#nx'); await pg.wait_for_timeout(2500)
    for k in range(4):
        o = pg.locator('#modals .opt').first
        if await o.count(): await o.click(); await pg.wait_for_timeout(400)
    await pg.wait_for_timeout(800)
    # 给些资源，测试面板
    await pg.evaluate("()=>{const G=Game.G;G.inv.xyf=30;G.stone=50000;G.realm=2;G.inv.ore=3;G.inv.yd=2;Sys.ensure(G);Sys.addMount('fsword',1);Sys.addMount('gourd',1);Game.meta.cos.xifu=1;UI.hud();}")
    await pg.wait_for_timeout(5500)
    await pg.screenshot(path=OUT + f'{tag}_map.png')
    for name in ['more', 'cave', 'mount', 'title', 'nitian', 'gacha', 'album', 'char', 'bag', 'quests', 'comps']:
        await pg.evaluate(f"()=>{{UI.panel('{name}')}}"); await pg.wait_for_timeout(700)
        await pg.screenshot(path=OUT + f'{tag}_p_{name}.png')
        ov = await pg.evaluate("()=>{const p=document.querySelector('.panel');if(!p)return 'nopanel';const r=p.getBoundingClientRect();const bad=[];p.querySelectorAll('*').forEach(e=>{const q=e.getBoundingClientRect();if(q.width>0&&(q.right>r.right+1||q.left<r.left-1))bad.push(e.className||e.tagName)});return [r.width|0,r.height|0,innerWidth,innerHeight,bad.slice(0,5).join('|')]}")
        print(tag, name, ov)
        if name == 'gacha':
            await pg.click('[data-d="10"]'); await pg.wait_for_timeout(1000); await pg.screenshot(path=OUT + f'{tag}_gacha_anim.png')
            await pg.wait_for_timeout(1400); await pg.screenshot(path=OUT + f'{tag}_gacha_res.png')
            await pg.click('.gclose'); await pg.wait_for_timeout(600)
        await pg.evaluate("()=>{const x=[...document.querySelectorAll('.panel .x')].pop(); if(x)x.click()}"); await pg.wait_for_timeout(300)
    await pg.evaluate("()=>VFX.breakthrough('金丹初期')"); await pg.wait_for_timeout(900); await pg.screenshot(path=OUT + f'{tag}_brk.png'); await pg.wait_for_timeout(2000)
    await pg.evaluate("()=>UI.chapterShow(MAIN[MI('rival')])"); await pg.wait_for_timeout(1500); await pg.screenshot(path=OUT + f'{tag}_chapter.png')
    print(tag, 'ERRORS', len(errs)); [print(e[:300]) for e in errs[:10]]
    await b.close()
async def main():
    async with async_playwright() as p:
        for vw, vh, tag in [(360, 640, 's'), (412, 915, 'l')]: await run(p, vw, vh, tag)
asyncio.run(main())

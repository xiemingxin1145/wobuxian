"""完整人生加速测试：A) 正常游玩后寿终→结局→轮回殿→购买强化→再投胎；B) 渡劫期→飞升结局。全程统计 JS 错误。"""
import asyncio, sys, time, os
from playwright.async_api import async_playwright
WWW = os.environ.get('WWW', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www'))
URL = 'file://' + os.path.abspath(WWW) + '/index.html'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out2') + '/'
async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        async def create():
            await pg.click('text=开始新人生'); await pg.wait_for_timeout(400)
            await pg.click('#nx'); await pg.wait_for_timeout(300)
            for k in range(3): await pg.locator('.talb').nth(k).click()
            await pg.click('#nx'); await pg.wait_for_timeout(300); await pg.click('#rs'); await pg.click('#nx'); await pg.wait_for_timeout(300)
            await pg.click('#nx'); await pg.wait_for_timeout(2500)
            await pg.evaluate("()=>{B.speed=8}")
        async def run(sec, hook=None, label=''):
            t0 = time.time(); last = -1; seen_end = False
            while time.time() - t0 < sec:
                r = await pg.evaluate("()=>BOT.tick()")
                if r == 'ending' and not seen_end:
                    seen_end = True; await pg.screenshot(path=OUT + f'end_{label}.png')
                if r == 'meta': return True
                if hook and await pg.evaluate(hook): hook = None
                el = int(time.time() - t0)
                if el // 15 != last:
                    last = el // 15; print(label, el, await pg.evaluate("()=>Game.G ? [Game.G.age, Game.realmName(), 'main'+Game.G.main, R.mapId, Game.G.ending||''].join(' ') : 'noG'"), flush=True)
                await pg.wait_for_timeout(100)
            return False
        await pg.goto(URL); await pg.wait_for_timeout(2000)
        # ---- A：普通一生，寿终 ----
        await create()
        await run(90, label='A-play')
        await pg.evaluate("()=>{Game.G.age = Game.lifeMax() - 1}")
        okA = await run(300, label='A-old')
        print('A reached meta:', okA, await pg.evaluate("()=>JSON.stringify({pts:Game.meta.pts, lives:Game.meta.lives, endings:Game.meta.endings})"))
        await pg.screenshot(path=OUT + 'meta_A.png')
        # 轮回殿：买一个强化然后再投胎
        await pg.evaluate("()=>{const b=document.querySelector('.meta [data-id]'); if(b) b.click();}")
        await pg.click('#newlife'); await pg.wait_for_timeout(2500)
        # ---- B：渡劫期飞升 ----
        await create()
        await run(20, label='B-start')
        await pg.evaluate("""()=>{const G=Game.G; G.flags.awakened=1; G.flags.main1=1; G.realm=6; G.stage=3; G.exp=Game.need(); G.jieRes=0.6; G.debt=0; G.age=500; G.main=9;
          for(const sl of ['weapon','armor','treasure']){const e=Game.randEq(6.5,4,sl); G.eqs.push(e); Game.equip(e.uid);} Game.give('tsf',5); const s=Game.stats(); G.hp=s.mhp; G.mp=s.mmp; UI.hud(); }""")
        okB = await run(400, label='B-ascend')
        print('B reached meta:', okB, await pg.evaluate("()=>JSON.stringify({pts:Game.meta.pts, lives:Game.meta.lives, endings:Game.meta.endings})"))
        await pg.screenshot(path=OUT + 'meta_B.png')
        print('ERRORS', len(errs)); from collections import Counter; [print(n, 'x', e[:300]) for e, n in Counter(errs).most_common(30)]
        await b.close()
        sys.exit(0 if okA and okB and not errs else 1)
asyncio.run(main())

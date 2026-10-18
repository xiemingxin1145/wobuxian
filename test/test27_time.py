#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 2.7② 月级时间验证：默认关闭=旧行为；开启后连过 12 个月应等于 1 年（修为/年/月/季节/事件无报错）。
# 退出码=失败数
import asyncio, os, sys
from playwright.async_api import async_playwright

URL = 'file://' + os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www', 'index.html')
failures = []
def check(c, m):
    print(('PASS' if c else 'FAIL'), '-', m, flush=True)
    if not c: failures.append(m)

async def dismiss_modals(pg, n=8):
    for _ in range(n):
        o = pg.locator('#modals .opt').first
        if await o.count():
            await o.click(); await pg.wait_for_timeout(200)
        else: break

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME', '/opt/vm/preinstall/ms-playwright/chromium-1169/chrome-linux/chrome'),
                                    args=['--no-sandbox', '--allow-file-access-from-files'])
        pg = await (await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True)).new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append('PAGEERR '+str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type=='error' and 'net::ERR_FILE_NOT_FOUND' not in (m.text or '') and 'Failed to load resource' not in (m.text or '') else None)
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        await pg.click('text=开始新人生'); await pg.wait_for_timeout(400)
        await pg.click('#nx'); await pg.wait_for_timeout(200)
        for k in range(3): await pg.locator('.talb').nth(k).click(); await pg.wait_for_timeout(120)
        await pg.click('#nx'); await pg.wait_for_timeout(200)
        await pg.click('#rs'); await pg.click('#nx'); await pg.click('#nx'); await pg.wait_for_timeout(2500)
        await dismiss_modals(pg, 10)
        await pg.wait_for_timeout(500)

        # 1) 默认关闭：G.monthMode undefined，行为=年度制
        default_off = await pg.evaluate("()=> Time27.on()===false && Game.G.monthMode!==true")
        check(default_off, '默认关闭月级时间（旧行为不变）')

        # 2) 开启月级时间
        await pg.evaluate("()=>{ Game.G.monthMode=true; Game.G.month=0; }")
        on = await pg.evaluate("()=> Time27.on()===true")
        check(on, '开启月级时间 Time27.on()=true')

        y0 = await pg.evaluate("()=> Game.G.year")
        exp0 = await pg.evaluate("()=> Game.G.exp")
        # 3) 连过 12 个月（nextMonth 内部会弹卡片，启动后轮询点掉直到 month 变化）
        for i in range(12):
            before = await pg.evaluate("()=> Game.G.month")
            await pg.evaluate("()=>{ Time27.nextMonth(); }")
            for _ in range(30):
                await pg.wait_for_timeout(150)
                await dismiss_modals(pg, 2)
                now = await pg.evaluate("()=> Game.G.month")
                if now != before: break
            print(f'  month {i+1}: {before} -> {await pg.evaluate("()=>Game.G.month")}', flush=True)
        await pg.wait_for_timeout(600)
        await pg.wait_for_timeout(500)
        st = await pg.evaluate("()=>({year:Game.G.year, month:Game.G.month, season:Time27.seasonName(), exp:Game.G.exp, ap:Game.G.ap})")
        print('  after 12 months:', st)
        check(st['year'] == y0 + 1, f'过12月=年+1（{y0}->{st["year"]}）')
        check(st['month'] == 0, '满12月后 month 归 0（触发年结）')
        check(st['exp'] >= exp0, '修为未减少（月结+年结入账）')
        check(st['season'] in ['春','夏','秋','冬'], f'季节驱动正常（{st["season"]}）')

        # 4) 年结链可能开年度事件卡（生产由玩家点）。多等几轮 drain，再确认可继续推进
        for _ in range(30):
            if await pg.evaluate("()=> !Game._busy"): break
            await pg.wait_for_timeout(200); await dismiss_modals(pg, 3)
        st2 = await pg.evaluate("()=>({busy:Game._busy, month:Game.G.month, year:Game.G.year})")
        print('  post-year settle:', st2, flush=True)
        # 月计数已在上方 12 步日志中单调 0->1->...->11->0；此处只验证年/月状态稳定
        check(st2['year'] >= 2, f'年结后年份推进（year={st2["year"]}）')

        print('errors:', len(errs))
        for e in errs[:10]: print('  E:', e[:200])
        check(len(errs) == 0, f'零 JS/page 错误（{len(errs)} 条）')
        await b.close()
    print('FAILURES', len(failures)); sys.exit(len(failures))
asyncio.run(main())

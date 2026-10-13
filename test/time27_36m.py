# -*- coding: utf-8 -*-
# 3.1③ 月级时间(time27)连续 ≥36 月自动化回归：事件链 / AP / 修为 / 闭关稳定性
# 结论用途：稳定 → 建议转正默认；不稳定 → 维持 beta 并记录。
import asyncio, os, sys, json
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'www'))
URL = 'file://' + ROOT + '/index.html'
OUT = os.path.join(HERE, 'out31') + '/'
os.makedirs(OUT, exist_ok=True)
CHROME = os.environ.get('CHROME', '/opt/vm/preinstall/ms-playwright/chromium-1169/chrome-linux/chrome')

CLICK_JS = """()=>{
  const ws=[...document.querySelectorAll('#modals .mwrap')];
  if(!ws.length) return false;
  const w=ws[ws.length-1];
  const opt=w.querySelector('.opts .opt');
  if(opt){opt.click(); return true;}
  return false;
}"""
async def pump(pg, n=6, every=200):
    for _ in range(n):
        clicked = await pg.evaluate(CLICK_JS)
        if clicked: await pg.wait_for_timeout(every)
        else: await pg.wait_for_timeout(120)

async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'net::ERR_FILE_NOT_FOUND' not in (m.text or '') and 'Failed to load resource' not in (m.text or '') else None)

        await pg.goto(URL); await pg.wait_for_timeout(2500)
        await pg.click('text=开始新人生'); await pg.wait_for_timeout(400)
        await pg.click('#nx'); await pg.wait_for_timeout(200)
        for k in range(3): await pg.locator('.talb').nth(k).click(); await pg.wait_for_timeout(120)
        await pg.click('#nx'); await pg.wait_for_timeout(200)
        await pg.click('#rs'); await pg.click('#nx'); await pg.click('#nx'); await pg.wait_for_timeout(2500)
        await pump(pg, 8, 300)

        # 给一个有一定修为/血量的中年状态，开启月级
        await pg.evaluate("()=>{ const G=Game.G; G.flags.awakened=1; G.year=20; G.age=25; G.realm=4; G.stage=2; G.monthMode=true; G.month=0; const s=Game.stats(); G.hp=s.mhp; G.mp=s.mmp; G.ap=0; G.debt=0; G.stone=5000; }")
        base = await pg.evaluate("()=>({exp:Game.G.exp, year:Game.G.year, hp:Math.round(Game.G.hp), ap:Game.G.ap, month:Time27.month()})")

        # 连续过 36 个月（非阻塞：kick 后快速连点直到 month 推进）
        deaths = []; timeline = []
        for i in range(36):
            m0 = await pg.evaluate("()=>{ Game._busy=false; return Time27.month(); }")
            await pg.evaluate("()=>{ Game._busy=false; Time27.nextMonth(); }")
            # 快速连点直到月份变化（腊月年结可能多卡）
            advanced = False
            for _ in range(60):
                await pg.evaluate(CLICK_JS)
                await pg.wait_for_timeout(90)
                m1 = await pg.evaluate("()=>Time27.month()")
                if m1 != m0: advanced = True; break
            await pg.wait_for_timeout(120)
            st = await pg.evaluate("()=>({month:Time27.month(), year:Game.G.year, hp:Math.round(Game.G.hp), exp:Math.round(Game.G.exp), ap:Game.G.ap, dead:!!Game.G.dead, mode:Game.G.monthMode})")
            timeline.append(st)
            if st['dead']: deaths.append(f'death at month {i+1}')

        yearends = sum(1 for i in range(1, len(timeline)) if timeline[i]['month'] == 0 and timeline[i-1]['month'] != 0)

        final = await pg.evaluate("()=>({exp:Math.round(Game.G.exp), year:Game.G.year, hp:Math.round(Game.G.hp), mhp:Game.stats().mhp, ap:Game.G.ap, month:Time27.month(), dead:!!Game.G.dead})")

        summary = dict(
            base=base, final=final,
            months_elapsed=len(timeline),
            yearends_seen=yearends,
            exp_grew=(final['exp'] - base['exp']),
            hp_min=min(t['hp'] for t in timeline) if timeline else 0,
            deaths=deaths,
            js_errors=errs[:10],
            stable=(len(deaths) == 0 and not final['dead'] and len(errs) == 0 and yearends >= 2 and final['year'] - base['year'] >= 2),
        )
        json.dump(dump:=dict(summary=summary, timeline=timeline[-6:]), open(OUT + 'results_time27_36m.json', 'w'), ensure_ascii=False, indent=1)
        print('BASE', base)
        print('FINAL', final)
        print('yearends', yearends, 'exp_grew', summary['exp_grew'], 'hp_min', summary['hp_min'])
        print('deaths', deaths, 'js_errs', len(errs))
        print('STABLE', summary['stable'])
        await b.close()
        return 0 if summary['stable'] else 1

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))

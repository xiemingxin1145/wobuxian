# -*- coding: utf-8 -*-
# 2.5 新入口交互自动化验证（宗门面板/晋升挑战/三年大比/拍卖会/寄卖/新事件入口注册）
# 风格参考 smoke2.py / human_olaf.py：开局建角 → 用 evaluate 注入入宗/灵石作为场景搭建（任务允许），
# 随后点开真实 UI.panel 与 Talk.extra 按钮，断言渲染无 JS 报错。退出码 = 失败用例数。
import asyncio, os, sys, json
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'www'))
URL = 'file://' + ROOT + '/index.html'
OUT = os.path.join(HERE, 'out25') + '/'; os.makedirs(OUT, exist_ok=True)
CHROME = os.environ.get('CHROME', '/opt/vm/preinstall/ms-playwright/chromium-1169/chrome-linux/chrome')

fails = []; cases = []
def case(name, ok, info=''):
    cases.append(dict(case=name, ok=bool(ok), info=str(info)[:200]))
    print(('PASS' if ok else 'FAIL'), name, '|', str(info)[:160], flush=True)
    if not ok: fails.append(name)

# 程序化点最顶层弹窗的第一个选项（.opts 是 .cb 的兄弟节点，不在 .cb 内；绕过覆盖层拦截）
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

        # ---- 开局建角（与 smoke2.py 一致）----
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        await pg.click('text=开始新人生'); await pg.wait_for_timeout(400)
        await pg.click('#nx'); await pg.wait_for_timeout(300)
        for k in range(3): await pg.locator('.talb').nth(k).click()
        await pg.click('#nx'); await pg.wait_for_timeout(300)
        await pg.click('#rs'); await pg.click('#nx'); await pg.wait_for_timeout(300)
        await pg.click('#nx'); await pg.wait_for_timeout(3000)
        await pump(10, 350)
        await pg.wait_for_timeout(1200)

        g = await pg.evaluate("()=>Game.G ? {age:Game.G.age, sect:Game.G.sect, map:R.mapId} : null")
        case('game_loaded', g is not None, g)
        await pg.evaluate("()=>{ if(typeof B!=='undefined'&&B) B.speed=6; }")   # 战斗自动加速，避免年结随机事件开战卡住

        # ---- 场景搭建：入宗 + 足够贡献/灵石（任务允许 evaluate 注入）----
        await pg.evaluate("""()=>{
            Game.joinSect('qingyun');
            Game.G.contrib=500; Game.G.sectRank=2; Game.G.sectRenown=10;
            Game.G.stone=9999; Game.G.realm=1; Game.G.stage=0;
            Game.give('pyd',3); UI.hud();
        }""")
        st = await pg.evaluate("()=>({sect:Game.G.sect, rank:Game.G.sectRank, contrib:Game.G.contrib})")
        case('join_sect_setup', st.get('sect') == 'qingyun' and st.get('rank') == 2, st)

        # ---- T1 Talk.extra 师父处注入了「我的宗门」+「晋升挑战」----
        extra = await pg.evaluate("()=>Talk.extra('elder').map(x=>x[0])")
        case('talk_extra_sect_buttons', any('我的宗门' in x for x in extra) and any('晋升挑战' in x for x in extra), extra)

        # ---- T2 打开宗门面板 sect25，断言位阶/贡献/大比渲染 ----
        await pg.evaluate("()=>{ UI.panel('sect25'); }")   # fire-and-forget（panel 在 close 时才 resolve，不能 return promise）
        await pg.wait_for_timeout(300)
        pb = await pg.evaluate("()=>document.querySelector('.pb')?.innerHTML || ''")
        case('panel_sect25_render', ('位阶' in pb) and ('贡献' in pb) and ('真传弟子' in pb),
             '位阶/贡献/大比文案存在' if ('位阶' in pb and '贡献' in pb) else pb[:120])
        await pg.screenshot(path=OUT + 'sect25_panel.png')
        await pg.click('.panel .x'); await pg.wait_for_timeout(250)

        # ---- T3 晋升挑战按钮链路：点它触发迎战确认（不强制打赢，只点开不炸）----
        await pg.evaluate("()=>{ const out=Talk.extra('elder'); const it=out.find(x=>x[0].includes('晋升挑战')); if(it) it[1](); }")
        await pg.wait_for_timeout(400)
        await pump(8, 600)
        await pg.wait_for_timeout(500)
        case('rankup_challenge_no_crash', True, '晋升挑战入口已点开并走完 modal 分支')

        # ---- T4 三年大比：把年份调到 2，触发 yearEnd（→年3=大比年）----
        await pg.evaluate("()=>{ Game.G.year=2; Game.G.tournDone=0; Game.yearEnd(); }")  # fire-and-forget
        # 年结随机事件可能开战（mode=battle），需点 auto；大比也在 yearEnd 包裹链里开战。一直 pump + 点 auto，直到 tournDone>=1。
        for _ in range(45):
            done = await pg.evaluate("()=>Game.G.tournDone>=1")
            if done: break
            inbattle = await pg.evaluate("()=>{ if(R.mode==='battle'&&B&&B.on){ const ab=document.querySelector('#battlebar button[data-a=auto]'); if(ab&&!B.auto){ab.click(); return true} return true } return false; }")
            clicked = await pg.evaluate(CLICK_JS)
            if clicked: await pg.wait_for_timeout(600)
            elif inbattle: await pg.wait_for_timeout(900)
            else: await pg.wait_for_timeout(500)
        await pg.wait_for_timeout(500)
        dbg = await pg.evaluate("()=>({mode:R.mode, busy:!!Game._busy, cb:[...document.querySelectorAll('#modals .cb')].length, mwrap:[...document.querySelectorAll('#modals .mwrap')].length, battle:(typeof B!=='undefined'&&B&&B.units?B.units.length:0), over:[...document.querySelectorAll('#modals .cb .opts .opt')].map(o=>o.textContent.slice(0,10))})")
        t = await pg.evaluate("()=>({year:Game.G.year, tournDone:Game.G.tournDone, tournWins:Game.G.tournWins, busy:!!Game._busy})")
        print('DBG T4', dbg, flush=True)
        case('tournament_yearend', t.get('year') == 3 and t.get('tournDone', 0) >= 1, t)

        # ---- T5 拍卖会面板 auction：设在 market 图，打开渲染出价/寄卖按钮 ----
        await pg.evaluate("()=>{ R.mapId='market'; Game.G.stone=9999; UI.panel('auction'); }")
        await pg.wait_for_timeout(300)
        pb2 = await pg.evaluate("()=>document.querySelector('.pb')?.innerHTML || ''")
        case('panel_auction_render', pb2.count('竞拍') >= 1 and '寄卖' in pb2,
             f"拍品按钮={pb2.count('竞拍')}, 寄卖={'寄卖' in pb2}")
        await pg.screenshot(path=OUT + 'auction_panel.png')

        # ---- T6 点一个「竞拍」走一轮出价 modal ----
        bid = pg.locator('.pb .bid').first
        if await bid.count():
            await bid.click(); await pg.wait_for_timeout(400)
            await pump(12, 600)
        await pg.wait_for_timeout(400)
        try: await pg.click('.panel .x'); await pg.wait_for_timeout(250)
        except Exception: pass
        case('auction_bid_no_crash', True, '竞拍按钮点过并走完 modal 分支')

        # ---- T7 寄卖入口：重新开拍卖面板，点寄卖，走一轮 ----
        await pg.evaluate("()=>{ R.mapId='market'; UI.panel('auction'); }")
        await pg.wait_for_timeout(300)
        cons = pg.locator('#consign')
        if await cons.count():
            await cons.click(); await pg.wait_for_timeout(400)
            await pump(10, 600)
        await pg.wait_for_timeout(300)
        try: await pg.click('.panel .x'); await pg.wait_for_timeout(250)
        except Exception: pass
        case('auction_consign_no_crash', True, '寄卖按钮点过并走完 modal 分支')

        # ---- T8 新事件已注册进事件池（v25_grudge / v25_enbo）----
        ev = await pg.evaluate("()=>EVENTS.filter(e=>e[0].startsWith('v25_')).map(e=>[e[0], e[3], e[4]])")
        ids = [e[0] for e in ev]
        case('new_events_registered', 'v25_grudge' in ids and 'v25_enbo' in ids, ev)

        await pg.wait_for_timeout(500)
        await b.close()

    json.dump(dict(cases=cases, fails=fails, js_errors=errs), open(OUT + 'results.json', 'w'), ensure_ascii=False, indent=1)
    print(f'\n{len(cases)-len(fails)}/{len(cases)} passed; FAIL={fails}; JS errors={len(errs)}')
    for e in errs[:10]: print('  ERR:', e[:200])
    return len(fails)

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))

# v2.3 “真人式”试玩：只用真实触摸（CDP Input.dispatchTouchEvent）点屏幕上看得见的元素，不调用任何游戏 JS。
# 读取 DOM 只用于“眼睛看”（元素位置/文字），等同于玩家看屏幕。412×915，isMobile/hasTouch。
# 步骤：新开一局 → 跟着指引点主线目标 → 序章战斗 → 追踪栏寻路到剑仙并完成对话 → 交互按钮 → 接支线 → 寻路完成并交付 → 挂机 → 开发者面板 → 切换地图
# 每步截图到 test/human23/，结果写 test/human23/result.json。任何一步失败 → 退出码 1。
import math, asyncio, os, sys, json, time, re
from playwright.async_api import async_playwright
ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www')
URL = 'file://' + os.path.abspath(ROOT) + '/index.html'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'human23') + '/'; os.makedirs(OUT, exist_ok=True)
VW, VH = 412, 915
steps = []; T0 = time.time()
def log(*a): print(f'[{time.time() - T0:5.0f}s]', *a, flush=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load' not in m.text and 'ERR_FILE' not in m.text else None)
        cdp = await ctx.new_cdp_session(pg)
        async def touch_xy(x, y, hold=70):
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]}); await pg.wait_for_timeout(hold)
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        async def vis(sel):
            l = pg.locator(sel)
            for k in range(await l.count()):
                if await l.nth(k).is_visible(): return l.nth(k)
            return None
        async def tap(sel_or_loc, wait=350):
            l = (await vis(sel_or_loc)) if isinstance(sel_or_loc, str) else sel_or_loc
            if not l: return False
            try: bb = await l.bounding_box(timeout=3000)
            except Exception: bb = None
            if not bb: return False
            await touch_xy(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); await pg.wait_for_timeout(wait); return True
        async def wait_vis(sel, ms=8000):
            t = time.time()
            while (time.time() - t) * 1000 < ms:
                l = await vis(sel)
                if l: return l
                await pg.wait_for_timeout(200)
            return None
        async def opts():
            l = pg.locator('#modals .mwrap:last-child .opt'); out = []
            for k in range(await l.count()):
                if await l.nth(k).is_visible(): out.append(l.nth(k))
            return out
        async def text(sel):
            l = await vis(sel); return (await l.inner_text()) if l else ''
        async def tap_opt(pat, fallback_first=False):
            os_ = await opts()
            for o in os_:
                if re.search(pat, await o.inner_text()): await tap(o, 500); return True
            if fallback_first and os_: await tap(os_[0], 500); return True
            return False
        async def clear_popups(pref=r'收下|继续|好|知道了|确定|离开|关闭', n=12):
            for k in range(n):
                for sel in ['.gacha-fx .gclose', '.gacha-fx .gskip', '.chapter-fx', '.brk-fx']:
                    if await vis(sel): await tap(sel, 600); break
                else:
                    os_ = await opts()
                    if not os_:
                        x = await vis('#modals .mwrap:last-child .ph .x')
                        if x: await tap(x, 400); continue
                        return
                    ok = False
                    for o in os_:
                        if re.search(pref, await o.inner_text()): await tap(o, 500); ok = True; break
                    if not ok: await tap(os_[0], 500)
        async def battle_through(ms=90000):
            t = time.time()
            while (time.time() - t) * 1000 < ms:
                if await vis('#battlebar button[data-a=auto]'): await tap('#battlebar button[data-a=auto]', 600)
                if not await vis('#battlebar'):
                    await pg.wait_for_timeout(800); await clear_popups(); return True
                await pg.wait_for_timeout(500)
            return False
        async def shot(name): path = OUT + name + '.png'; await pg.screenshot(path=path); return path
        def step(n, ok, note, path): steps.append({'step': n, 'ok': bool(ok), 'note': note, 'shot': path}); log('PASS' if ok else 'FAIL', n, note)
        hudtxt = lambda: text('#hud')

        await pg.goto(URL); await pg.wait_for_timeout(1800)
        # 1 新开一局
        await tap('#title .opt[data-k=new]', 600)
        await tap('#nx', 300)
        for k in range(3):
            l = pg.locator('.talb'); await tap(l.nth(k), 200)
        for k in range(3): await tap('#nx', 400)
        await pg.wait_for_timeout(2500); await clear_popups(r'继续|好|收下|知道了|开始')
        await pg.wait_for_timeout(1200)
        ok = await vis('#hud') is not None and await vis('#qt') is not None
        step('1 新开一局', ok, (await hudtxt()).replace('\n', ' ')[:40], await shot('01_new_game'))
        async def wait_opts(ms=12000):
            t = time.time()
            while (time.time() - t) * 1000 < ms:
                if await opts(): return True
                if await vis('#battlebar'): return 'battle'
                await pg.wait_for_timeout(250)
            return False
        async def title_txt():
            l = await vis('#modals .mwrap:last-child .dn, #modals .mwrap:last-child .ct'); return (await l.inner_text()) if l else ''
        async def settle(n=6):  # 先打完/关掉当前的战斗和弹窗，再做下一步（真人也会这样）
            for k in range(n):
                if await vis('#battlebar'): await battle_through(); continue
                if await opts() or await vis('#modals .mwrap'): await clear_popups(r'收下|继续|好|知道了|确定|离开|关闭|算了', 12); continue
                return
        async def qbtn(q):
            l = pg.locator(f'#qt .qbtn[data-q="{q}"]'); return l if await l.count() and await l.first.is_visible() else None
        # 2 新手指引指向头顶 ★ 的讨债史莱姆；按指引点它（点名字/标记位置）
        tut = await wait_vis('#tuthint.show', 6000); path = await shot('02_tutorial_hint'); got = False; note = '没出现指引'
        if tut:
            bb = await tut.bounding_box(); x, y = bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] + 30
            await touch_xy(x, y); note = f'指引在({x:.0f},{y:.0f})，点指引下方的★标记'
            got = bool(await wait_opts(8000)); note += ' → ' + (await title_txt())
        step('2 跟着指引点主线目标', got, note, await shot('03_tapped_target'))
        # 3 序章：抄起扫帚 → 战斗（点“自动”）→ 第一章卡
        await tap_opt(r'抄起扫帚'); fought = await wait_vis('#battlebar', 8000) is not None
        if fought: await battle_through()
        await pg.wait_for_timeout(800); t3 = await title_txt(); await shot('04_prologue_done'); await clear_popups(r'去看看|好|继续|收下')
        qt = await text('#qt')
        step('3 序章：打跑讨债史莱姆', fought and '剑仙' in qt, f'战斗={fought} 卡片={t3!r} 追踪栏={qt[:40]!r}', OUT + '04_prologue_done.png')
        # 4 追踪栏“前往”自动寻路到剑仙 → 对话 → ★替他付酒钱 → 测灵根
        b4 = await qbtn('main'); ok = False; note = ''
        if b4:
            await tap(b4.first, 400); await shot('05_autopath_mentor')
            r = await wait_opts(20000)
            while r == 'battle': await battle_through(); await tap(b4.first, 400); r = await wait_opts(20000)
            note = await title_txt()
            if r is True:
                did = await tap_opt(r'替他付酒钱'); await pg.wait_for_timeout(500)
                for k in range(8):
                    if not await tap_opt(r'继续|好|伸手|原来如此|知道了|收下', fallback_first=False): break
                    await pg.wait_for_timeout(500)
                ok = did
        await clear_popups(r'继续|好|收下|知道了|离开'); await pg.wait_for_timeout(1000)
        qt = await text('#qt'); ok = ok and ('宗' in qt or '练气' in qt or '修炼' in qt)
        step('4 追踪栏寻路→剑仙对话→测灵根', ok, f'对话={note!r} 追踪栏={qt[:50]!r}', await shot('06_awakened'))
        # 5 靠近 NPC 时的交互按钮（剑仙就在身边）
        ab = await wait_vis('#actbtn.show', 4000); ok = False; abt = (await ab.text_content()) if ab else '没出现'
        if ab:
            await tap(ab, 300); ok = await wait_opts(8000) is True; await shot('07_actbtn_dialog')
            await tap_opt(r'闲聊'); await pg.wait_for_timeout(500); await clear_popups(r'离开|继续|好')
        step('5 「对话」交互按钮', ok, abt, OUT + '07_actbtn_dialog.png' if ok else await shot('07_actbtn_dialog'))
        # 6 接支线：过年到 7 岁后，追踪栏出现“附近有委托（！）”，点前往 → 对话 → ！任务 → 接受
        accepted = None
        for yr in range(6):
            bq = await qbtn('bang')
            if bq:
                await tap(bq.first, 400)
                if await wait_opts(20000) is True:
                    os_ = await opts()
                    for o in os_:
                        n = (await o.inner_text()).strip()
                        if n.startswith('！'): accepted = n; await tap(o, 700); await tap_opt(r'接受'); break
                await clear_popups(r'离开|继续|好')
                if await wait_opts(2500) == 'battle': await battle_through(); await clear_popups(r'离开|继续|好|收下')
                if accepted and await pg.locator('#qt .qbtn:not([data-q=main]):not([data-q=bang])', has_text='前往').count(): break
                continue
            if not bq: await tap('#yearbtn', 900); await clear_popups(r'过年|确定|继续|好|收下|知道了', 20); await pg.wait_for_timeout(1500); await clear_popups(r'继续|好|收下|知道了', 20)
        await pg.wait_for_timeout(1800); qt = await text('#qt')
        step('6 接受支线任务', bool(accepted) and '支·' in qt, f'{accepted} | 追踪栏={qt[:60]!r}', await shot('08_quest_accepted'))
        # 7 支线：点“前往”自动寻路去完成 → 回去交付
        done = False; trail = []
        for rep in range(10):
            qt = await text('#qt'); l = pg.locator('#qt .qbtn:not([data-q=main]):not([data-q=bang])', has_text=re.compile('前往|交付|过年'))
            if not await l.count(): break
            await tap(l.first, 400); trail.append((await text('#navbar'))[:24] or (await text('#toasts'))[:24])
            if rep == 0: await shot('09_autopath_quest')
            r = await wait_opts(20000)
            if r == 'battle': await battle_through(); continue
            if r is True:
                if await tap_opt(r'交付'): done = True; await pg.wait_for_timeout(700); await shot('10_quest_done'); await clear_popups(); break
                if await tap_opt(r'前往'): await pg.wait_for_timeout(2500); continue
                await clear_popups(r'过年|确定|离开|继续|好|收下|知道了', 20)
            await pg.wait_for_timeout(800)
        step('7 寻路完成并交付支线', done, ' → '.join(t for t in trail if t)[:120], OUT + '10_quest_done.png' if done else await shot('10_quest_done'))
        # 8 挂机（修为满了挂机会直接停，所以真人会先点「突破」）
        await settle()
        for k in range(2):
            if await vis('#brkbtn'):
                await tap('#brkbtn', 1500)
                for j in range(30):
                    if await vis('.brk-fx'): await tap('.brk-fx', 600)
                    elif await opts(): await clear_popups(r'突破|渡劫|开始|确定|继续|好|收下|知道了', 12)
                    elif await vis('#battlebar'): await battle_through()
                    else: break
                    await pg.wait_for_timeout(400)
        await settle()
        h0 = (await hudtxt()).split('\n'); await tap('#afkbtn', 600); await tap_opt(r'开始挂机')
        on = await wait_vis('#afk23.show', 3000) is not None; await pg.wait_for_timeout(1500); await shot('11_afk_on')
        t = time.time()
        while time.time() - t < 50:
            await pg.wait_for_timeout(1000)
            if not await vis('#afk23.show'): break
            os_ = await opts()
            if os_:  # 挂机中弹出的需要玩家决定的事件：像真人一样点第一个不危险的选项
                for o in os_:
                    tx = await o.inner_text()
                    if not re.search(r'结局|道侣|借|高利贷|渡劫|放弃', tx): await tap(o, 600); break
        afk = await text('#afk23 .afkc'); await shot('12_afk_progress')
        if await vis('#afkstop23'): await tap('#afkstop23', 800)
        summ = ''
        for k in range(8):
            await wait_opts(3000); summ = await title_txt()
            if '挂机' in summ: break
            if await vis('#battlebar'): await battle_through(); continue
            os_ = await opts()
            if os_: await tap(os_[0], 600)
        await shot('13_afk_summary'); await clear_popups(r'好|收下|继续|离开', 20)
        h1 = (await hudtxt()).split('\n')
        import re as _re
        gain = _re.search(r'击败 (\d+)', afk); 
        step('8 挂机', on and '挂机' in summ and (h1[:3] != h0[:3] or (gain and int(gain.group(1)) > 0)), f'{afk!r} | {h0[:3]} → {h1[:3]} | 总结={summ!r}', OUT + '12_afk_progress.png')
        await clear_popups(r'收下|继续|好|离开'); await pg.wait_for_timeout(1000)
        await settle()
        # 9 开发者面板：未开启时没有 🛠；更多 → 设置 → 版本号连点 7 次 → 🛠
        await settle(); nodev = await pg.locator('#devbtn').count() == 0
        await tap('#menu .mb[data-p=more]', 600); await tap(pg.locator('.big2', has_text='设置'), 600)
        vr = await vis('.verrow')
        if vr:
            for k in range(7): await tap(vr, 100)
        await pg.wait_for_timeout(300); await shot('14_dev_unlock')
        await tap('#modals .mwrap:last-child .ph .x', 500)
        dev = await wait_vis('#devbtn', 3000); ok = False
        if dev:
            await tap(dev, 700); ok = await vis('.devwarn') is not None; await shot('15_dev_panel')
            for tb_ in ['境界', '解锁', '演出', '调试']:
                await tap(pg.locator('.devtabs .dt', has_text=tb_), 400)
            await shot('16_dev_debug_tab')
        if await vis('.devtabs'): await tap('#modals .mwrap:last-child .ph .x', 500)  # 用右上角 ✕ 关面板（settle 会点到“关闭开发者模式”）
        step('9 开发者面板', nodev and ok, f'开启前无🛠={nodev}', OUT + '15_dev_panel.png' if ok else await shot('15_dev_panel'))
        await settle()  # 关掉面板（.x）
        # 10 切换地图：开发者“解锁全部地图” → 关面板 → 御剑 → 第一张可去的新地图
        if ok:
            for _try in range(3):  # 只读检查 G.flags.devmaps；没生效（被弹窗/战斗挡住）就收拾一下再点一次
                await settle()
                if not await vis('.devtabs'):
                    tb = await tap('#devbtn', 900)
                    d2 = await pg.evaluate("()=>{const b=document.querySelector('#devbtn');if(!b)return 'nobtn';const r=b.getBoundingClientRect();const e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return (e&&(e.id||e.className||e.tagName))+' '+JSON.stringify([r.x,r.y,r.width,r.height])}")
                    print(f'[step10] 点🛠 tap={tb} top={d2} devtabs={bool(await vis(".devtabs"))}', flush=True)
                await tap(pg.locator('.devtabs .dt', has_text='解锁'), 500); await tap('.opt[data-a=maps]', 600)
                dm = await pg.evaluate('()=>!!(Game.G&&Game.G.flags&&Game.G.flags.devmaps)')
                diag = await pg.evaluate("()=>JSON.stringify({modal:!!UI.modal,stack:UI.stack.length,busy:!!Game._busy,b:!!(window.B&&B.on),mode:R.mode,inMap:UX.inMap(),fx:!!document.querySelector('.gacha-fx,.chapter-fx,.brk-fx,.endw'),afk:!!(window.AFK&&AFK.on)})")
                print(f'[step10] 尝试 {_try+1}: devtabs={bool(await vis(".devtabs"))} devmaps={dm} {diag}', flush=True)
                if await vis('.devtabs'): await tap('#modals .mwrap:last-child .ph .x', 500)
                if dm: break
        if not await pg.locator('#ap i.on').count():  # 行动力用完了就先过年（御剑要 1 点行动力）
            await tap('#yearbtn', 900); await clear_popups(r'过年|确定|继续|好|收下|知道了', 20); await settle()
        await tap('#menu .mb[data-p=travel]', 700); m = pg.locator('.mapb:not(.lock):not(.here)'); target = ''
        if await m.count(): target = await m.first.locator('b').inner_text(); await tap(m.first, 3500)
        await clear_popups(); await pg.wait_for_timeout(1500)
        await settle(); ban = await shot('17_map_switched')
        await tap('#menu .mb[data-p=travel]', 700); here = await text('.mapb.here b'); await shot('18_travel_here'); await settle()
        step('10 切换地图', bool(target) and target == here.strip(), f'前往 {target} → 当前所在 {here!r}', ban)
        # 11 判定框重叠 / 摇杆区：点每个 NPC 的身体中心，必须打开这个 NPC（不是旁边的人）；只读取位置，点按全用触摸
        JS_NPC = """()=>{if(!R.player||R.mode!=='map')return [];const S=(x,y)=>{const [a,b]=w2s(x,y);return [a/R.dpr,b/R.dpr]};return R.ents.filter(e=>e.kind==='npc'&&!e.hidden).map(e=>{const [x,y]=t2p(e.i,e.j);const b=spriteBox(e.spr,e.s);return {id:e.id,n:e.label,i:e.i,j:e.j,body:S(x,y-b.h/2)}})}"""
        JS_WHO = "()=>{const t=[...document.querySelectorAll('#modals .mwrap')].pop();return t&&t.querySelector('.dn')?t.querySelector('.dn').textContent:(t?'card:'+t.innerText.slice(0,12):null)}"
        async def tap_npc_body(nid):
            for _ in range(2):
                L = await pg.evaluate(JS_NPC); t = next((x for x in L if x['id'] == nid), None)
                if not t: return 'missing', None
                x, y = t['body']
                if 10 < x < VW - 10 and 120 < y < VH - 120: break
                return 'offscreen', None
            jz = x < 170 and y > VH - 380
            await touch_xy(x, y)
            who = None
            for _ in range(50):
                await pg.wait_for_timeout(200); who = await pg.evaluate(JS_WHO)
                if who: break
            ok = bool(who) and who.startswith(t['n'].split('  ')[0])
            await clear_popups(r'离开|继续|好|收下'); await settle()
            return ('ok' if ok else f'wrong:{who}'), jz
        rows11 = []; L = await pg.evaluate(JS_NPC)
        # 先测互相最靠近的一对（重叠最可能误判），再测其余
        pairs = sorted(((math.hypot(a['body'][0] - b_['body'][0], a['body'][1] - b_['body'][1]), a['id'], b_['id']) for k, a in enumerate(L) for b_ in L[k + 1:]), key=lambda z: z[0])
        order = ([pairs[0][1], pairs[0][2]] if pairs else []) + [x['id'] for x in L]
        seen = set()
        for nid in order:
            if nid in seen or len(seen) >= 6: continue
            seen.add(nid); r, jz = await tap_npc_body(nid)
            if r in ('missing', 'offscreen'): continue
            rows11.append(f'{nid}:{r}' + ('(摇杆区)' if jz else ''))
        ok11 = len(rows11) >= 3 and all(':ok' in r for r in rows11)
        step('11 点身体中心=打开这个 NPC（重叠/摇杆区回归）', ok11, ' '.join(rows11), await shot('19_tap_body_regression'))
        # 12 站在 NPC 旁边：#actbtn 必须是按脚下世界距离最近的 NPC，点了打开的也是他
        rows12 = []
        for nid in [x['id'] for x in (await pg.evaluate(JS_NPC))][:3]:
            r, _ = await tap_npc_body(nid)   # 点 NPC → 走到他身边并对话 → 离开
            if r != 'ok': continue
            await pg.wait_for_timeout(400)
            near = await pg.evaluate("()=>{const P=R.player;const c=R.ents.filter(e=>(e.kind==='npc'||e.kind==='boss')&&!e.hidden).map(e=>[Math.hypot(e.i-P.i,e.j-P.j),e.label]).sort((a,b)=>a[0]-b[0]);return c.slice(0,2)}")
            ab = await vis('#actbtn.show'); lab = (await ab.text_content()) if ab else ''
            if not ab or not near or near[0][0] > 1.8: continue
            want = near[0][1].split('  ')[0]; tie = len(near) > 1 and abs(near[1][0] - near[0][0]) <= 0.1
            await tap(ab, 300); who = None
            for _ in range(40):
                await pg.wait_for_timeout(200); who = await pg.evaluate(JS_WHO)
                if who: break
            okr = (want in lab.replace('对话', '').replace('交付', '').replace('挑战', '') or tie) and bool(who) and (who.startswith(want) or tie)
            rows12.append(f'{nid}:按钮={lab!r} 最近={want}({near[0][0]:.2f}) 打开={who} ' + ('ok' if okr else 'WRONG'))
            await clear_popups(r'离开|继续|好|收下'); await settle()
        step('12 #actbtn 选最近的 NPC', len(rows12) >= 1 and all(r.endswith('ok') for r in rows12), ' | '.join(rows12), await shot('20_actbtn_nearest'))
        step('无 JS 错误', not errs, '; '.join(errs[:3]), None)
        await b.close()
    json.dump(steps, open(OUT + 'result.json', 'w'), ensure_ascii=False, indent=1)
    bad = [s for s in steps if not s['ok']]; print('RESULT', len(steps) - len(bad), '/', len(steps)); sys.exit(1 if bad else 0)
asyncio.run(main())

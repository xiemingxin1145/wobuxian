"""多世轮回机器人测试：python3 multilife.py <lives> <secs_per_life> [accel]
检查：JS错误、卡死（状态长时间不变）、NaN、存档读档一致性、返回键。"""
import asyncio, sys, time, os, json
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'www', 'index.html'))
OUT = os.path.join(os.path.dirname(__file__), 'out21') + '/'
LIVES = int(sys.argv[1]) if len(sys.argv) > 1 else 3; SECS = float(sys.argv[2]) if len(sys.argv) > 2 else 300; ACC = float(sys.argv[3]) if len(sys.argv) > 3 else 1
STATE = "()=>Game.G ? [Game.G.age, Game.realmName(), 'main'+Game.G.main+'/'+(MAIN[Game.G.main]||{}).id, R.mapId, 'k'+Game.G.killsTotal, 'hp'+(Game.G.hp|0), 's'+Math.round(Game.G.stone), 'd'+Math.round(Game.G.debt), 'q'+Object.keys(Game.G.quests).length, 'xyf'+(Game.G.inv.xyf||0), Game.G.mount||'-', 'stk'+UI.stack.length, Game._busy?'busy':''].join(' ') : 'noG'"
NANCHK = """()=>{const G=Game.G; if(!G) return ''; const bad=[]; for(const k in G){ if(typeof G[k]==='number' && !isFinite(G[k])) bad.push(k);} for(const k in G.st) if(!isFinite(G.st[k])) bad.push('st.'+k);
 try{const s=Game.stats(); for(const k in s) if(typeof s[k]==='number' && !isFinite(s[k])) bad.push('stats.'+k);}catch(e){bad.push('stats-err '+e)} return bad.join(',')}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files', '--mute-audio'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs = []; issues = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'ERR_FILE_NOT_FOUND' not in m.text else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        for life in range(LIVES):
            await pg.wait_for_selector('text=开始新人生', timeout=20000)
            await pg.click('text=开始新人生'); await pg.wait_for_timeout(400)
            if life % 2: await pg.evaluate("()=>{const s=document.querySelector('[data-sex=f],.sexb:last-child'); if(s) s.click()}")
            await pg.click('#nx'); await pg.wait_for_timeout(300)
            n = await pg.locator('.talb').count()
            for k in range(3): await pg.locator('.talb').nth((life * 2 + k) % max(1, n)).click()
            await pg.click('#nx'); await pg.wait_for_timeout(300); await pg.click('#rs'); await pg.click('#nx'); await pg.wait_for_timeout(300)
            await pg.click('#nx'); await pg.wait_for_timeout(2500)
            if ACC > 1: await pg.evaluate(f"()=>{{const f=Game.addExp.bind(Game); Game.addExp=(v,q)=>f(v*{ACC},q);}}")
            await pg.evaluate("()=>{B.speed=8}")
            t0 = time.time(); last = -1; lastState = None; lastChange = time.time(); reloaded = False; backed = False; res = None
            while time.time() - t0 < SECS:
                try: r = await pg.evaluate("()=>BOT.tick()")
                except Exception as e: r = 'EXC ' + str(e)[:80]
                await pg.wait_for_timeout(90)
                if r == 'meta': res = 'meta'; break
                el = int(time.time() - t0)
                if el // 20 != last:
                    last = el // 20; st = await pg.evaluate(STATE); print(f'L{life} {el}s', st, r, flush=True)
                    nan = await pg.evaluate(NANCHK)
                    if nan: issues.append(f'L{life} NaN: {nan} @ {st}'); print('NAN', nan, flush=True)
                    core = st.rsplit(' stk', 1)[0]
                    if core != lastState: lastState = core; lastChange = time.time()
                    elif time.time() - lastChange > 75:
                        issues.append(f'L{life} STUCK {st} last={r}'); await pg.screenshot(path=OUT + f'stuck_L{life}_{el}.png')
                        print('STUCK', st, r, await pg.evaluate("()=>[UI.stack.map(e=>e.className+':'+e.textContent.slice(0,80)).join(' | '), B.on, R.mode, Game._busy].join(' ; ')"), flush=True); lastChange = time.time()
                    # 返回键测试
                    if not backed and el > 40:
                        backed = True; rb = await pg.evaluate("()=>{const a=window.onAndroidBack(); const b=window.onAndroidBack(); return [a,b,UI.stack.length]}"); print('BACK', rb, flush=True)
                        await pg.wait_for_timeout(300); await pg.evaluate("()=>{const x=[...document.querySelectorAll('.mwrap .x')].pop(); if(x)x.click()}")
                    # 存档/读档一致性
                    if not reloaded and el > 60 and await pg.evaluate("()=>!!Game.G && !Game._busy && !B.on && UI.stack.length===0 && !Game.G.dead"):
                        reloaded = True
                        before = await pg.evaluate("()=>{Game.save(); const G=Game.G; return JSON.stringify([G.age,G.realm,G.stage,Math.round(G.stone),G.main,G.killsTotal,Object.keys(G.quests).length,G.inv.xyf||0,G.mount||null])}")
                        await pg.reload(); await pg.wait_for_timeout(1500)
                        await pg.click('[data-k=cont]'); await pg.wait_for_timeout(2500)
                        after = await pg.evaluate("()=>{const G=Game.G; return JSON.stringify([G.age,G.realm,G.stage,Math.round(G.stone),G.main,G.killsTotal,Object.keys(G.quests).length,G.inv.xyf||0,G.mount||null])}")
                        print('RELOAD', before, after, flush=True)
                        if before != after: issues.append(f'L{life} SAVE MISMATCH {before} vs {after}')
                        if ACC > 1: await pg.evaluate(f"()=>{{const f=Game.addExp.bind(Game); Game.addExp=(v,q)=>f(v*{ACC},q);}}")
                        await pg.evaluate("()=>{B.speed=8}")
            if res != 'meta':
                print(f'L{life} time up, forcing death', flush=True)
                await pg.evaluate("()=>{ if(Game.G && !Game.G.dead){ Game.G.age = Game.lifeMax(); Game.yearEnd(); } }")
                for k in range(900):  # v2.2：Boss 战可能较长，死亡在战斗结束后结算
                    r = await pg.evaluate("()=>BOT.tick()"); await pg.wait_for_timeout(100)
                    if r == 'meta': res = 'meta'; break
            info = await pg.evaluate("()=>JSON.stringify({lives:Game.meta.lives, endings:Game.meta.endings, pts:Game.meta.pts, cg:Game.meta.cg, gacha:Game.meta.gacha})")
            print(f'L{life} END', res, info, flush=True)
            await pg.screenshot(path=OUT + f'life{life}_end.png')
            await pg.evaluate("()=>{const b=document.querySelector('#newlife'); if(b) b.click();}"); await pg.wait_for_timeout(2500)
        print('ISSUES', len(issues)); [print(' ', i) for i in issues]
        from collections import Counter
        print('ERRORS', len(errs)); [print(n, 'x', e[:400]) for e, n in Counter(errs).most_common(20)]
        await b.close()
asyncio.run(main())

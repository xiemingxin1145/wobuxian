"""v2.2 新章节冒烟：从“冷月之约”后跳入，用机器人推进 龙宫→魔尊→鬼市→判官→催债司→天道分身→天道真身。
python3 test/content22.py [secs]  输出 test/out22/c22_*.png 与 c22.json"""
import asyncio, sys, time, os, json
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
URL = 'file://' + ROOT + '/www/index.html'; OUT = ROOT + '/test/out22/'; os.makedirs(OUT, exist_ok=True)
SECS = float(sys.argv[1]) if len(sys.argv) > 1 else 420
SETUP = """()=>{const G=Game.G; G.flags.awakened=1; G.realm=4; G.stage=3; G.age=300; G.lifeBonus=5000; G.main=MI('longgong'); G.atkBonus=(G.atkBonus||0)+6; G.stone=50000; G.ap=99;
 for(const b of ['corpse','dragon']) {G.bosses[b]=1; G.flags['boss_'+b]=1;} G.visited={village:1,sect:1,market:1,secret:1,graveyard:1,island:1}; Game.give('hcd',30);
 const ye=Game.yearEnd.bind(Game); Game.yearEnd=async function(){ const r=await ye(); if(Game.G) Game.G.ap=Math.max(Game.G.ap,6); return r; };
 const st=Game.stats.bind(Game); Game.stats=function(){const s=st(); s.atk*=4; s.def*=3; s.mhp*=3; return s;}; Game.refreshNpcs(); return MAIN[G.main].id}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--allow-file-access-from-files', '--mute-audio'])
        ctx = await b.new_context(viewport={'width': 412, 'height': 915}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'ERR_FILE_NOT_FOUND' not in m.text else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        await pg.click('text=开始新人生'); await pg.wait_for_timeout(400); await pg.click('#nx'); await pg.wait_for_timeout(300)
        for k in range(3): await pg.locator('.talb').nth(k).click()
        await pg.click('#nx'); await pg.wait_for_timeout(300); await pg.click('#rs'); await pg.click('#nx'); await pg.wait_for_timeout(300)
        await pg.click('#nx'); await pg.wait_for_timeout(2500)
        for k in range(30):
            if await pg.evaluate("()=>UI.stack.length===0 && !Game._busy"): break
            await pg.evaluate("()=>BOT.tick()"); await pg.wait_for_timeout(200)
        print('setup', await pg.evaluate(SETUP), flush=True)
        await pg.evaluate("()=>{B.speed=8}")
        seen = []; shots = {}; t0 = time.time(); last = None
        while time.time() - t0 < SECS:
            try: await pg.evaluate("()=>BOT.tick()")
            except Exception as e: errs.append('tick ' + str(e)[:200])
            await pg.wait_for_timeout(120)
            st = await pg.evaluate("()=>{const G=Game.G; if(!G) return null; if(G.realm<5 && ['judge','cuizhai','tiandao','zhenshen'].includes(MAIN[G.main].id)) {G.realm=5; G.stage=2;} return [MAIN[G.main].id, R.mapId, B.on ? B.units.filter(u=>u.side).map(u=>u.mon).join('+') : '', UI.stack.length ? (UI.stack[UI.stack.length-1].textContent||'').slice(0,40) : '', G.dead?1:0]}")
            if not st: continue
            if st[0] not in seen: seen.append(st[0]); print(f'{time.time()-t0:.0f}s chapter', st[0], st[1], flush=True)
            if st[4]: print('DEAD'); break
            for key in ['taizi', 'guiwang', 'dasiming', 'tiandao2']:
                if key in st[2].split('+') and key not in shots:
                    await pg.wait_for_timeout(1400); shots[key] = OUT + f'c22_battle_{key}.png'; await pg.screenshot(path=shots[key]); print('shot', key, flush=True)
            for mp in ['longgong', 'guishi', 'cuizhai']:
                if st[1] == mp and not st[2] and not st[3] and 'map_' + mp not in shots:
                    await pg.wait_for_timeout(900); shots['map_' + mp] = OUT + f'c22_map_{mp}.png'; await pg.screenshot(path=shots['map_' + mp]); print('shot map', mp, flush=True)
            if st[0] == 'done': break
        info = await pg.evaluate("()=>JSON.stringify({main:MAIN[Game.G.main].id, bosses:Game.G.bosses, achs:Object.keys(Game.meta.achs||{}).filter(a=>['longgong','guiwang_win','dasiming_win','zhenshen_win'].includes(a)), debt:Math.round(Game.G.debt), dead:!!Game.G.dead})")
        res = dict(chapters=seen, shots=shots, final=json.loads(info), errors=errs)
        json.dump(res, open(OUT + 'c22.json', 'w'), ensure_ascii=False, indent=1); print(json.dumps(res, ensure_ascii=False, indent=1))
        await b.close()
asyncio.run(main())

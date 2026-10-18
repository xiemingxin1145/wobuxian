# -*- coding: utf-8 -*-
# 3.0① 主线终章扩展验证：尾声章节注册 → 追踪指向 → 走完 asc1→daotong→ba → 回 done → 尾声开启接口
import asyncio, os, sys, json
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'www'))
URL = 'file://' + ROOT + '/index.html'
OUT = os.path.join(HERE, 'out30') + '/'
os.makedirs(OUT, exist_ok=True)
CHROME = os.environ.get('CHROME', '/opt/vm/preinstall/ms-playwright/chromium-1169/chrome-linux/chrome')

fails = []; cases = []
def case(name, ok, info=''):
    cases.append(dict(case=name, ok=bool(ok), info=str(info)[:300]))
    print(('PASS' if ok else 'FAIL'), name, '|', str(info)[:200], flush=True)
    if not ok: fails.append(name)

CLICK_JS = """()=>{
  const ws=[...document.querySelectorAll('#modals .mwrap')];
  if(!ws.length) return false;
  const w=ws[ws.length-1];
  const opt=w.querySelector('.opts .opt');
  if(opt){opt.click(); return true;}
  return false;
}"""

async def pump(pg, n=14, every=450):
    for _ in range(n):
        clicked = await pg.evaluate(CLICK_JS)
        if clicked: await pg.wait_for_timeout(every)
        else: await pg.wait_for_timeout(200)

async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)

        await pg.goto(URL); await pg.wait_for_timeout(2500)
        await pg.click('text=开始新人生'); await pg.wait_for_timeout(400)
        await pg.click('#nx'); await pg.wait_for_timeout(200)
        for k in range(3): await pg.locator('.talb').nth(k).click(); await pg.wait_for_timeout(120)
        await pg.click('#nx'); await pg.wait_for_timeout(200)
        await pg.click('#rs'); await pg.click('#nx'); await pg.click('#nx'); await pg.wait_for_timeout(2500)
        await pump(pg, 8, 350)
        await pg.wait_for_timeout(800)

        g = await pg.evaluate("()=>Game.G ? {age:Game.G.age, map:R.mapId} : null")
        case('game_loaded', g is not None, g)

        # ---- T1: main30 全局接口与章节注册 ----
        has30 = await pg.evaluate("()=>typeof window.Main30 === 'object' && Main30 !== null")
        case('main30_loaded', has30, 'Main30 global exposed')
        chaps = await pg.evaluate("()=>({asc1:MI('asc1'), daotong:MI('daotong'), ba:MI('ba'), done:MI('done')})")
        case('chapters_registered', chaps['asc1'] > chaps['done'] > 0, f"MI: {chaps}")

        # ---- T2: 场景搭建：done 后、债清、化神以上 ----
        await pg.evaluate("""()=>{
            const G = Game.G;
            G.flags.awakened = 1;
            G.realm = 5; G.stage = 3; G.debt = 0;
            G.main = MI('done');
            UI.hud();
        }""")
        st = await pg.evaluate("()=>({main:MAIN[Game.G.main].id, realm:Game.G.realm, debt:Game.G.debt})")
        case('setup_done', st['main'] == 'done' and st['realm'] == 5, st)

        # ---- T3: 尾声开启（Main30.start）----
        await pg.evaluate("()=>{ Main30.start(); }")
        await pump(pg, 10, 450)
        st = await pg.evaluate("()=>({main:MAIN[Game.G.main].id, started:!!Game.G.flags.epi30_started})")
        case('epilogue_starts', st['main'] == 'asc1' and st['started'], st)
        await pg.screenshot(path=OUT + 'epi_start.png')

        # ---- T4: 追踪指向记账童子（heaven）----
        trk = await pg.evaluate("()=>{ const t = Track.target('main'); return t ? {kind:t.kind, map:t.map, id:t.id, txt:t.txt} : null; }")
        case('tracking_points_to_xianguan', trk and trk.get('id') == 'xianguan' and trk.get('map') == 'heaven', trk)
        star = await pg.evaluate("()=>!!Talk.mainTalk('xianguan', true)")
        case('xianguan_has_star', star, 'Talk.mainTalk(xianguan, true) truthy')

        # ---- T5: 走完 asc1（南天门接风宴）----
        await pg.evaluate("()=>{ const h = Talk.mainTalk('xianguan'); h && h[1](); }")
        await pump(pg, 16, 450)
        st = await pg.evaluate("()=>({main:MAIN[Game.G.main].id, epi_asc:!!Game.G.flags.epi_asc, aff:Game.G.aff.xianguan||0})")
        case('asc1_completed', st['main'] == 'daotong' and st['epi_asc'], st)
        await pg.screenshot(path=OUT + 'after_asc1.png')

        # ---- T6: 追踪此时指向落魄剑仙（village）----
        trk = await pg.evaluate("()=>{ const t = Track.target('main'); return t ? {id:t.id, map:t.map} : null; }")
        case('tracking_points_to_mentor', trk and trk.get('id') == 'mentor' and trk.get('map') == 'village', trk)

        # ---- T7: 走完 daotong（剑仙的托付）----
        await pg.evaluate("()=>{ const h = Talk.mainTalk('mentor'); h && h[1](); }")
        await pump(pg, 16, 450)
        st = await pg.evaluate("()=>({main:MAIN[Game.G.main].id, affMentor:Game.G.aff.mentor||0, dao:Game.G.daoPoints||0})")
        case('daotong_completed', st['main'] == 'ba' and st['affMentor'] > 0, st)
        await pg.screenshot(path=OUT + 'after_daotong.png')

        # ---- T8: 走完 ba（掌门之问，需有宗门）----
        await pg.evaluate("()=>{ Game.G.sect = Game.G.sect || 'qingyun'; }")
        await pg.evaluate("()=>{ const h = Talk.mainTalk('elder'); h && h[1](); }")
        await pump(pg, 16, 450)
        st = await pg.evaluate("()=>({main:MAIN[Game.G.main].id, contrib:Game.G.contrib||0})")
        case('ba_completed_back_to_done', st['main'] == 'done', st)
        await pg.screenshot(path=OUT + 'after_ba.png')

        # ---- T9: 尾声走完后追踪显示已完结，不再死循环 ----
        trk = await pg.evaluate("()=>{ const t = Track.target('main'); return t ? {kind:t.kind, txt:t.txt} : null; }")
        case('tracking_done_state', trk and trk.get('kind') == 'none', trk)

        # ---- T10: 旧档兜底——在 done/债清/化神状态过年，自动补发尾声开启 ----
        # （临时跳过随机事件：年结事件可能触发战斗界面，干扰兜底验证）
        await pg.evaluate("""()=>{
            delete Game.G.flags.epi30_started;
            Game.G.main = MI('done');
            Game.G.debt = 0; Game.G.realm = 5;
            Game.runEvent = async () => {};
        }""")
        await pg.evaluate("()=>{ Game.yearEnd(); }")
        await pump(pg, 20, 450)
        st = await pg.evaluate("()=>({main:MAIN[Game.G.main].id, started:!!Game.G.flags.epi30_started, dead:Game.G.dead})")
        case('yearend_fallback_starts_epilogue', st['main'] == 'asc1' and st['started'] and not st['dead'], st)

        await pg.wait_for_timeout(500)
        await b.close()

    json.dump(dict(cases=cases, fails=fails, js_errors=errs), open(OUT + 'results.json', 'w'), ensure_ascii=False, indent=1)
    print(f'\n{len(cases)-len(fails)}/{len(cases)} passed; FAIL={fails}; JS errors={len(errs)}')
    for e in errs[:10]: print('  ERR:', e[:200])
    return len(fails)

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))

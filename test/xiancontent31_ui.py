# -*- coding: utf-8 -*-
# 3.1② 仙界内容扩充验证：新怪/NPC/技能/事件支线登记 → 实时+回合打怪 → NPC对话/神通 → 无 pageerror
import asyncio, os, sys, json
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'www'))
URL = 'file://' + ROOT + '/index.html'
OUT = os.path.join(HERE, 'out31') + '/'
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
async def pump(pg, n=14, every=400):
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
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'net::ERR_FILE_NOT_FOUND' not in (m.text or '') and 'Failed to load resource' not in (m.text or '') else None)

        await pg.goto(URL); await pg.wait_for_timeout(2500)
        await pg.click('text=开始新人生'); await pg.wait_for_timeout(400)
        await pg.click('#nx'); await pg.wait_for_timeout(200)
        for k in range(3): await pg.locator('.talb').nth(k).click(); await pg.wait_for_timeout(120)
        await pg.click('#nx'); await pg.wait_for_timeout(200)
        await pg.click('#rs'); await pg.click('#nx'); await pg.click('#nx'); await pg.wait_for_timeout(2500)
        await pump(pg, 8, 350)
        await pg.wait_for_timeout(800)
        case('game_loaded', await pg.evaluate("()=>!!Game.G"), None)

        # 强制进入仙界状态
        await pg.evaluate("()=>{ const G=Game.G; G.flags.awakened=1; G.realm=10; G.stage=3; G.exp=Game.need(); G.flags.xianjie_open=1; G.st.int=40; G.st.con=40; G.st.luck=40; G.st.cha=40; const s=Game.stats(); G.hp=s.mhp; G.mp=s.mmp; }")

        # ---- T1: 新怪登记 ----
        mons = await pg.evaluate("()=>({have:['xian_tianbing','xian_tianjiang','xian_qilin','xian_pixiu','xian_xianhe','xian_sanxian','xian_yaomo'].every(k=>MONS[k]), spr:!!MONS.xian_tianbing.spr, drops:MONS.xian_tianbing.drop})")
        case('mons_registered', mons['have'] and mons['spr'], mons)

        # ---- T2: 新 NPC 登记 ----
        npcs = await pg.evaluate("()=>({have:['nanyun','yaochi_shi','taibai','qianxd'].every(k=>NPCS[k]), maps:['nanyun','yaochi_shi','taibai','qianxd'].map(k=>NPCS[k].map)})")
        case('npcs_registered', npcs['have'], npcs)

        # ---- T3: 新技能/功法登记 ----
        sk = await pg.evaluate("()=>({have:['xian_zhanlu','xian_wulei','xian_xianlu','xian_buhuo'].every(k=>SKILLS[k]), tech:!!TECHS.xiandao, skNum:TECHS.xiandao.sk.length})")
        case('skills_registered', sk['have'] and sk['tech'], sk)

        # ---- T4: 新事件/支线登记 ----
        ev = await pg.evaluate("()=>({xevents:EVENTS.filter(e=>/^x_/.test(e[0])).length, qs:['q_ny1','q_yaochi1','q_taibai1','q_qxd1'].every(k=>QUESTS[k])})")
        case('events_quests_registered', ev['xevents']>=5 and ev['qs'], ev)

        # ---- T5: 新怪战斗就绪：monUnit 全部可构建（实时/回合共用）----
        units = await pg.evaluate("()=>{ const ids=['xian_tianbing','xian_tianjiang','xian_qilin','xian_pixiu','xian_xianhe','xian_sanxian','xian_yaomo']; try{ return ids.map(id=>{ const u=monUnit(id,9); return !!u && u.mhp>0 && u.atk>0 && (u.skills||[]).length>0; }).every(Boolean); }catch(e){ return 'ERR:'+e.message; } }")
        case('monUnit_build_all', units is True, units)

        # ---- T6: 战斗无错开局（RT 默认开；进 battle 模式即证明接线正确，胜负靠画布手操）----
        await pg.evaluate("()=>{ window.__fr=Game.fight('xian_tianbing',{tier:8.5}); }")
        await pg.wait_for_timeout(1200)
        mode = await pg.evaluate("()=>({mode:R.mode, on:window.RT27?RT27.on:null})")
        await pg.evaluate("()=>{ try{ if(window.RT27) RT27.flee&&RT27.flee(); }catch(e){} }")
        await pump(pg, 6, 350)
        case('fight_starts_noerror', mode['mode']=='battle', mode)
        await pg.screenshot(path=OUT + 'fight_rt.png')

        # ---- T7: NPC Talk.extra 仙界功能选项存在 ----
        taibai_opts = await pg.evaluate("()=>Talk.extra('taibai').map(x=>x[0])")
        qxd_opts = await pg.evaluate("()=>Talk.extra('qianxd').map(x=>x[0])")
        case('talk_taibai', any('论道' in o or '大道经' in o for o in taibai_opts), taibai_opts)
        case('talk_qxd_auction', any('拍卖' in o for o in qxd_opts), qxd_opts)

        # ---- T8: 进入九重天看 NPC 出场（refreshNpcs 生成）----
        await pg.evaluate("()=>Game.enterMap('jiuct')")
        await pg.wait_for_timeout(600)
        ents = await pg.evaluate("()=>({mapId:R.mapId, npcIds:R.ents.filter(e=>e.kind==='npc').map(e=>e.id), monCount:R.ents.filter(e=>e.kind==='mon').length})")
        case('jiuct_npc_spawn', ents['mapId']=='jiuct' and 'nanyun' in ents['npcIds'], ents)
        await pg.screenshot(path=OUT + 'jiuct_npc.png')

        await pg.wait_for_timeout(500)
        await b.close()

    json.dump(dict(cases=cases, fails=fails, js_errors=errs), open(OUT + 'results_xiancontent31.json', 'w'), ensure_ascii=False, indent=1)
    print(f'\n{len(cases)-len(fails)}/{len(cases)} passed; FAIL={fails}; JS errors={len(errs)}')
    for e in errs[:10]: print('  ERR:', e[:200])
    return len(fails)

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))

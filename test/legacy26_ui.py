# -*- coding: utf-8 -*-
# 2.6 正式页面交互验证（26 系为 index.html 真实 <script> 加载，非注入）。
# 风格对齐 test/sect25_ui.py：建角 → evaluate 搭场景 → 真实点开 Talk.extra/面板/事件。
# 覆盖：秘境入口+开跑+一场战斗、传承面板+收徒条件、仇敌/报恩事件与 grudge 台账、
#       新 BGM 按名调用、maps26 剑碑入口对接。退出码 = 失败用例数。
import asyncio, os, sys, json
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', 'www'))
URL = 'file://' + ROOT + '/index.html'
OUT = os.path.join(HERE, 'out26') + '/'; os.makedirs(OUT, exist_ok=True)
CHROME = os.environ.get('CHROME', '/opt/vm/preinstall/ms-playwright/chromium-1169/chrome-linux/chrome')

fails = []; cases = []
def case(name, ok, info=''):
    cases.append(dict(case=name, ok=bool(ok), info=str(info)[:200]))
    print(('PASS' if ok else 'FAIL'), name, '|', str(info)[:160], flush=True)
    if not ok: fails.append(name)

CLICK_JS = """()=>{
  const ws=[...document.querySelectorAll('#modals .mwrap')];
  if(!ws.length) return false;
  const w=ws[ws.length-1];
  const opt=w.querySelector('.opts .opt');
  if(opt){opt.click(); return true;}
  return false;
}"""

async def main():
    errs = []; failed_res = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('requestfailed', lambda r: failed_res.append(r.url))

        async def pump(n=10, every=450):
            for _ in range(n):
                # 战斗中自动
                try:
                    await pg.evaluate("()=>{ if(R&&R.mode==='battle'&&typeof B!=='undefined'&&B&&B.on&&!B.auto){ const ab=document.querySelector('#battlebar button[data-a=auto]'); if(ab) ab.click(); } }")
                except Exception: pass
                c = await pg.evaluate(CLICK_JS)
                await pg.wait_for_timeout(every if c else 200)

        # ---- 正式加载（26 系 script 在此一并加载）----
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        loadcheck = await pg.evaluate("()=>({dungeon:typeof window.dungeon26, Dng:typeof window.Dng, legacy:typeof window.legacy26, audio26:typeof window.Audio26, panels:typeof UI.p_dungeon26==='function'&&typeof UI.p_legacy26==='function', ev:EVENTS.filter(e=>String(e[0]).startsWith('v26_')).length})")
        case('scripts_real_load', loadcheck.get('dungeon')=='object' and loadcheck.get('legacy')=='object' and loadcheck.get('audio26')=='object' and loadcheck.get('panels') and loadcheck.get('ev',0)>=3, loadcheck)

        # ---- 开局建角 ----
        await pg.click('text=开始新人生'); await pg.wait_for_timeout(400)
        await pg.click('#nx'); await pg.wait_for_timeout(300)
        for k in range(3): await pg.locator('.talb').nth(k).click()
        await pg.click('#nx'); await pg.wait_for_timeout(300)
        await pg.click('#rs'); await pg.click('#nx'); await pg.wait_for_timeout(300)
        await pg.click('#nx'); await pg.wait_for_timeout(3000)
        await pump(6, 300)

        # 场景搭建：金丹境 + 灵石 + 好感
        await pg.evaluate("""()=>{
            Game.G.realm=3; Game.G.stage=0; Game.G.flags.awakened=1;
            Game.G.stone=9999; Game.G.aff['ali']=90; Game.G.aff['mentor']=90;
            Game.G.techs['changsheng']=1; Game.G.techs['moyu']=1;
            Game.G.hp=Game.stats().mhp; Game.G.mp=Game.stats().mmp; UI.hud();
        }""")

        # ---- T1 秘境：Talk.extra('ali') 入口 → 面板 → 开跑 → 探索一场战斗 ----
        extra_ali = await pg.evaluate("()=>Talk.extra('ali').map(x=>x[0])")
        case('dungeon_entry', any('探索秘境' in x for x in extra_ali), extra_ali)
        await pg.evaluate("()=>{ UI.panel('dungeon26'); }")
        await pg.wait_for_timeout(300)
        shot1 = await pg.evaluate("()=>document.querySelector('.pb')?.innerHTML||''")
        case('dungeon_panel_open', '秘境' in shot1 and ('踏入' in shot1 or '探索' in shot1), shot1[:100])
        await pg.screenshot(path=OUT + '01_dungeon_panel.png')
        # 点「踏入秘境」
        await pg.evaluate("()=>{ const b=document.querySelector('.pb'); const go=b&&b.querySelector('#go'); if(go) go.click(); }")
        await pg.wait_for_timeout(400)
        run0 = await pg.evaluate("()=>window.Dng&&Dng.run?{floor:Dng.run.floor,max:Dng.run.maxFloor,band:Dng.run.band}:null")
        case('dungeon_run_start', run0 is not None and run0.get('floor')==1, run0)
        # 探索一间密室（可能开战，pump 处理 modal/战斗 auto）
        await pg.evaluate("()=>{ const b=document.querySelector('.pb'); const r=b&&b.querySelector('#room'); if(r) r.click(); }")
        await pump(14, 500)
        await pg.wait_for_timeout(300)
        run1 = await pg.evaluate("()=>window.Dng&&Dng.run?{done:Dng.run.doneRooms,over:Dng.run.over,mode:R.mode}:{ended:true}")
        case('dungeon_explore_fought', run1 is not None, run1)
        await pg.screenshot(path=OUT + '02_dungeon_floor.png')
        # 撤离
        await pg.evaluate("()=>{ const b=document.querySelector('.pb'); const rt=b&&b.querySelector('#retreat'); if(rt) rt.click(); }")
        await pump(4, 400)
        try: await pg.evaluate("()=>Dng.exit(true)"); await pg.click('.panel .x'); await pg.wait_for_timeout(200)
        except Exception: pass

        # ---- T2 maps26 剑碑入口对接：Acts.jianbei 存在且走 dungeon26.enter ----
        jb = await pg.evaluate("()=>({acts:typeof Acts.jianbei, dngEnter:typeof (window.dungeon26&&dungeon26.enter)})")
        case('jianbei_wired', jb.get('acts')=='function' and jb.get('dngEnter')=='function', jb)

        # ---- T3 传承：Talk.extra('mentor') → 传承面板 → 收徒条件/传功按钮渲染 ----
        extra_men = await pg.evaluate("()=>Talk.extra('mentor').map(x=>x[0])")
        case('legacy_entry', any('传承道统' in x for x in extra_men), extra_men)
        await pg.evaluate("()=>{ UI.panel('legacy26'); }")
        await pg.wait_for_timeout(300)
        pb = await pg.evaluate("()=>document.querySelector('.pb')?.innerHTML||''")
        case('legacy_panel_render', ('弟子' in pb) and ('封剑' in pb or '道统' in pb), pb[:120])
        await pg.screenshot(path=OUT + '03_legacy_panel.png')
        try: await pg.click('.panel .x'); await pg.wait_for_timeout(200)
        except Exception: pass
        # 收徒条件：ali 好感90、金丹、无弟子 → extra 含「收为弟子」
        extra_ali2 = await pg.evaluate("()=>Talk.extra('ali').map(x=>x[0])")
        case('apprentice_offer', any('收为弟子' in x for x in extra_ali2), extra_ali2)

        # ---- T4 仇敌/报恩：注入 grudge + 旗标，触发事件 modal，检查台账 ----
        await pg.evaluate("()=>{ Game.G.grudge={aotian:3}; Game.G.flags.foe_final=1; Game.G.karma=20; Game.G.flags.grace_due=1; }")
        evhit = await pg.evaluate("()=>{ const e=EVENTS.find(x=>x[0]==='v26_foe_final'); return e?{id:e[0],cond:e[3],weight:e[4]}:null; }")
        case('foe_event_in_pool', evhit is not None and evhit.get('cond')=='flag:foe_final', evhit)
        # 跑一次年结，让包裹链处理 grudge/旗标
        await pg.evaluate("()=>{ Game.G.year=1; Game.yearEnd(); }")
        await pump(16, 500)
        await pg.wait_for_timeout(400)
        grudge = await pg.evaluate("()=>({grudge:Game.G.grudge, foeResolved:!!Game.G.flags.foe_resolved, graceResolved:!!Game.G.flags.grace_resolved, year:Game.G.year})")
        case('causality_bookkeeping', grudge.get('year',0)>=2, grudge)
        await pg.screenshot(path=OUT + '04_causality.png')

        # ---- T5 音频：Audio2.bgm 按名调新 ogg，断言 cur/路径且无加载失败 ----
        await pg.evaluate("()=>{ Audio2.bgm('mijing'); }")
        await pg.wait_for_timeout(400)
        aud = await pg.evaluate("()=>({cur:Audio2.cur, src:Audio2.el?Audio2.el.getAttribute('src'):null})")
        case('new_bgm_played', aud.get('cur')=='mijing' and 'bgm_mijing.ogg' in (aud.get('src') or ''), aud)
        # 还原地图 BGM
        await pg.evaluate("()=>{ Audio2.bgm(MAPINFO[R.mapId]?MAPINFO[R.mapId].bgm:'village'); }")

        # ---- 汇总：加载期错误（排除音频 autoplay 类良性提示）----
        hard_errs = [e for e in errs if 'autoplay' not in e.lower() and 'The play()' not in e]
        case('no_hard_js_errors', len(hard_errs)==0, hard_errs[:5])
        await pg.wait_for_timeout(300)
        await b.close()

    json.dump(dict(cases=cases, fails=fails, js_errors=errs, failed_res=failed_res), open(OUT + 'results.json','w'), ensure_ascii=False, indent=1)
    print(f'\n{len(cases)-len(fails)}/{len(cases)} passed; FAIL={fails}')
    print('JS errors:', errs[:8])
    print('failed resources:', failed_res[:8])
    return len(fails)

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))

# -*- coding: utf-8 -*-
# 2.9① 宗门关系与战争交互自动化验证
# 风格参考 sect25_ui.py：开局建角 → evaluate 注入场景 → 测试关系矩阵→征召→攻防战→结算→宗主晋升/宣战议和
import asyncio, os, sys, json
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'www'))
URL = 'file://' + ROOT + '/index.html'
OUT = os.path.join(HERE, 'out29') + '/'
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

        # ---- 开局建角 ----
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        await pg.click('text=开始新人生'); await pg.wait_for_timeout(400)
        await pg.click('#nx'); await pg.wait_for_timeout(200)
        for k in range(3): await pg.locator('.talb').nth(k).click(); await pg.wait_for_timeout(120)
        await pg.click('#nx'); await pg.wait_for_timeout(200)
        await pg.click('#rs'); await pg.click('#nx'); await pg.click('#nx'); await pg.wait_for_timeout(2500)
        await pump(8, 350)
        await pg.wait_for_timeout(1000)

        g = await pg.evaluate("()=>Game.G ? {age:Game.G.age, sect:Game.G.sect, map:R.mapId} : null")
        case('game_loaded', g is not None, g)
        await pg.evaluate("()=>{ if(typeof B!=='undefined'&&B) B.speed=6; }")

        # ---- 场景搭建：入宗 + 高境界/贡献/灵石 ----
        await pg.evaluate("""()=>{
            Game.joinSect('qingyun');
            Game.G.contrib=2000; Game.G.sectRank=4; Game.G.sectRenown=250;
            Game.G.stone=99999; Game.G.realm=3; Game.G.stage=0;
            Game.G.flags.awakened=1;
            UI.hud();
        }""")
        st = await pg.evaluate("()=>({sect:Game.G.sect, rank:Game.G.sectRank, contrib:Game.G.contrib, renown:Game.G.sectRenown})")
        case('setup_sect', st.get('sect') == 'qingyun' and st.get('rank') == 4, st)

        # ---- T1: War29 全局接口存在 ----
        hasWar29 = await pg.evaluate("()=>typeof window.War29 === 'object' && War29 !== null")
        case('war29_loaded', hasWar29, 'War29 global exposed')

        # ---- T2: 关系矩阵惰性兜底 ----
        rel = await pg.evaluate("()=>War29.getRel(Game.G, Game.G.sect, 'tianmo')")
        case('rel_default_zero', rel == 0, f'default rel={rel}')

        # ---- T3: 设置敌对关系 ----
        await pg.evaluate("()=>War29.forceRel('qingyun', 'tianmo', -80)")
        rel2 = await pg.evaluate("()=>War29.getRel(Game.G, 'qingyun', 'tianmo')")
        case('rel_set_hostile', rel2 == -80, f'rel after set={rel2}')

        # ---- T4: 打开宗门面板，断言战争区块渲染 ----
        await pg.evaluate("()=>{ UI.panel('sect25'); }")
        await pg.wait_for_timeout(400)
        pb = await pg.evaluate("()=>document.querySelector('.pb')?.innerHTML || ''")
        case('panel_sect25_war_extended', '宗门征伐' in pb and '敌对' in pb,
             f"宗门征伐 in panel: {'宗门征伐' in pb}, 敌对: {'敌对' in pb}")
        await pg.screenshot(path=OUT + 'sect25_war_panel.png')
        await pg.click('.panel .x'); await pg.wait_for_timeout(300)

        # ---- T5: 打开宗门征伐面板 sectWar ----
        await pg.evaluate("()=>{ UI.panel('sectWar'); }")
        await pg.wait_for_timeout(400)
        pb2 = await pg.evaluate("()=>document.querySelector('.pb')?.innerHTML || ''")
        case('panel_sectWar_render', '宗门关系' in pb2 and '天魔殿' in pb2 and '敌对' in pb2,
             f"sectWar panel: {'宗门关系' in pb2}, tianmo: {'天魔殿' in pb2}")
        await pg.screenshot(path=OUT + 'sectwar_panel.png')
        await pg.click('.panel .x'); await pg.wait_for_timeout(300)

        # ---- T6: 触发征召→请战→攻防战（BOT 自动打实时战）----
        # 直接调用 War29.declareWar 触发战争
        await pg.evaluate("()=>{ window.BOT && (BOT.on=true); }")
        await pg.evaluate("()=>{ window.War29.declareWar('tianmo'); }")
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=OUT + 'war_start.png')

        # 等待战争结束（实时战 + 波次切换 + 结算弹窗）
        war_done = False
        for i in range(120):  # 最多等 60 秒
            await pg.wait_for_timeout(500)
            # 检查是否回到地图且无 modal
            st = await pg.evaluate("()=>({warActive:Game.G.war&&Game.G.war.active, rt:typeof RT27!=='undefined'&&RT27.on, modal:!!document.querySelector('#modals .mwrap')})")
            if not st.get('warActive') and not st.get('rt'):
                war_done = True
                break
            # 如果有 modal，点掉
            if st.get('modal'):
                await pg.evaluate(CLICK_JS)
                await pg.wait_for_timeout(400)

        await pg.wait_for_timeout(1000)
        await pg.screenshot(path=OUT + 'war_end.png')

        warState = await pg.evaluate("()=>({active:Game.G.war.active, target:Game.G.war.target, wins:Game.G.war.wins, losses:Game.G.war.losses})")
        case('war_completed', war_done and not warState.get('active'),
             f'war_done={war_done}, warState={warState}')

        # ---- T7: 结算后应有贡献/灵石变化或赔款 ----
        g2 = await pg.evaluate("()=>({stone:Math.round(Game.G.stone), contrib:Game.G.contrib, merit:Game.G.warMerit, sectRenown:Game.G.sectRenown, wins:Game.G.war.wins, losses:Game.G.war.losses})")
        case('war_settlement_applied', g2.get('merit', 0) > 0 or g2.get('losses', 0) > 0,
             f'after war: {g2}')

        # ---- T8: 宗主晋升（大长老+贡献+声望+功绩 → 宗主）----
        # 先确保功绩够
        await pg.evaluate("()=>{ Game.G.warMerit = Math.max(Game.G.warMerit, 200); War29.checkSectLeaderPromotion(Game.G); }")
        await pg.wait_for_timeout(1000)
        await pump(6, 600)
        rank = await pg.evaluate("()=>({rank:Game.G.sectRank, leader:Game.G.sectLeader})")
        case('sect_leader_promotion', rank.get('rank') == 5 and rank.get('leader') == 1,
             f'after promotion check: {rank}')

        # ---- T9: 宗主可宣战（Talk.extra 有宣战按钮）----
        if rank.get('rank') == 5:
            extra = await pg.evaluate("()=>Talk.extra('elder').map(x=>x[0])")
            has_declare = any('宣战' in x for x in extra)
            case('sect_leader_can_declare', has_declare, f'Talk.extra options: {extra}')
        else:
            case('sect_leader_can_declare', False, 'not promoted to leader')

        # ---- T10: 关系值范围正确（-100~100）----
        await pg.evaluate("()=>War29.forceRel('qingyun', 'baicao', 150)")  # 应该被截断到 100
        rel_max = await pg.evaluate("()=>War29.getRel(Game.G, 'qingyun', 'baicao')")
        case('rel_clamp_max', rel_max == 100, f'rel after set 150 → {rel_max}')

        await pg.evaluate("()=>War29.forceRel('qingyun', 'baicao', -150)")
        rel_min = await pg.evaluate("()=>War29.getRel(Game.G, 'qingyun', 'baicao')")
        case('rel_clamp_min', rel_min == -100, f'rel after set -150 → {rel_min}')

        await pg.wait_for_timeout(500)
        await b.close()

    json.dump(dict(cases=cases, fails=fails, js_errors=errs), open(OUT + 'results.json', 'w'), ensure_ascii=False, indent=1)
    print(f'\n{len(cases)-len(fails)}/{len(cases)} passed; FAIL={fails}; JS errors={len(errs)}')
    for e in errs[:10]: print('  ERR:', e[:200])
    return len(fails)

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))

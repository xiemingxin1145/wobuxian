# -*- coding: utf-8 -*-
# 2.9② 实时战宠物/道侣出战 AI 队友自动化验证
# 风格参考 war29_ui.py / sect25_ui.py
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

        g = await pg.evaluate("()=>Game.G ? {age:Game.G.age} : null")
        case('game_loaded', g is not None, g)
        await pg.evaluate("()=>{ if(typeof B!=='undefined'&&B) B.speed=6; }")

        # ---- T1: RT29 全局接口存在 ----
        hasRT29 = await pg.evaluate("()=>typeof window.RT29 === 'object' && RT29 !== null")
        case('rt29_loaded', hasRT29, 'RT29 global exposed')

        # ---- T2: 场景搭建：给玩家一个宠物 + 一个伙伴 ----
        await pg.evaluate("""()=>{
            Game.G.realm = 2; Game.G.stage = 0;
            Game.G.flags.awakened = 1;
            // 添加宠物
            Game.addPet('boar', 2);
            // 添加伙伴（follower）
            Game.G.follower = 'sister';
            Game.G.aff['sister'] = 80;
            UI.hud();
        }""")
        st = await pg.evaluate("()=>({pet:Game.G.pets.length>0, petA:Game.G.petA, follower:Game.G.follower})")
        case('setup_pet_companion', st.get('pet') and st.get('follower') == 'sister', st)

        # ---- T3: 触发实时战，检查队友是否生成 ----
        # 确保 RT27 可用
        await pg.evaluate("()=>{ window.RT27 = RT27; }")
        # 开启 BOT
        await pg.evaluate("()=>{ window.BOT && (BOT.on=true); }")
        # 触发一场实时战（打野猪）
        await pg.evaluate("""()=>{
            Game.fight('boar', {tier: 2, solo: false});
        }""")
        await pg.wait_for_timeout(2000)

        # 检查是否在实时战中
        rt_on = await pg.evaluate("()=>RT27.on")
        case('rt_battle_started', rt_on, f'RT27.on={rt_on}')

        if rt_on:
            # ---- T4: 队友生成 ----
            await pg.wait_for_timeout(500)
            allies = await pg.evaluate("()=>RT29.allies.map(a=>({name:a.name, alive:a.alive, kind:a.isPet?'pet':'comp'}))")
            case('allies_spawned', len(allies) >= 1, f'allies={allies}')

            # ---- T5: 队友 UI 存在 ----
            has_ally_ui = await pg.evaluate("()=>!!document.getElementById('rt29-ally-ui')")
            case('ally_ui_exists', has_ally_ui, 'rt29-ally-ui in DOM')

            # ---- T6: 队友血条更新 ----
            await pg.wait_for_timeout(1000)
            ally_bars = await pg.evaluate("()=>{ const el=document.querySelector('#rt29-ally-bars'); return el ? el.children.length : 0; }")
            case('ally_bars_rendered', ally_bars >= 1, f'bars count={ally_bars}')

            await pg.screenshot(path=OUT + 'rt29_battle_with_allies.png')

            # ---- T7: 等待战斗结束 ----
            for i in range(60):
                await pg.wait_for_timeout(500)
                rt = await pg.evaluate("()=>RT27.on")
                if not rt: break
                # BOT 自动打
                await pg.evaluate("()=>{ if(RT27.on && window.BOT && BOT.on) RT27._botAct(); }")

            await pg.wait_for_timeout(500)
            rt_after = await pg.evaluate("()=>RT27.on")
            case('rt_battle_ended', not rt_after, f'RT27.on after={rt_after}')

            # ---- T8: 队友战后恢复（不真死）----
            # 检查战斗结束后 allies 已清空（恢复逻辑在 finish 里做了）
            allies_after = await pg.evaluate("()=>RT29.allies.length")
            case('allies_cleared_after_battle', allies_after == 0, f'allies.length after={allies_after}')

            # ---- T9: 队友 UI 已移除 ----
            has_ui_after = await pg.evaluate("()=>!!document.getElementById('rt29-ally-ui')")
            case('ally_ui_removed', not has_ui_after, 'rt29-ally-ui removed')

        # ---- T10: 无 JS 错误 ----
        await pg.wait_for_timeout(500)
        case('no_js_errors', len([e for e in errs if 'ERR_FILE_NOT_FOUND' not in e and 'Failed to load resource' not in e]) == 0,
             f'total errors={len(errs)}')

        await pg.wait_for_timeout(500)
        await b.close()

    json.dump(dict(cases=cases, fails=fails, js_errors=errs), open(OUT + 'results_rt29.json', 'w'), ensure_ascii=False, indent=1)
    print(f'\n{len(cases)-len(fails)}/{len(cases)} passed; FAIL={fails}; JS errors={len(errs)}')
    for e in errs[:10]: print('  ERR:', e[:200])
    return len(fails)

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))

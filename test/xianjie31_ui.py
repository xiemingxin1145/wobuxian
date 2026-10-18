# -*- coding: utf-8 -*-
# 3.1① 仙界初开·九重天阙验证：新境界登记 → 飞升续修突破地仙 → 仙界四图进入与节点正确
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

        # ---- T1: 三境登记 ----
        realms = await pg.evaluate("()=>({n:REALMS.length, names:REALMS.slice(8).map(r=>r.n), tier:[REALMS[8].tier,REALMS[9].tier,REALMS[10].tier]})")
        case('realms_registered', realms['n'] == 11 and realms['names'] == ['地仙','天仙','金仙'], realms)

        # ---- T2: 四图登记进 MAPINFO / MAP_ORDER / AS.maps ----
        maps = await pg.evaluate("()=>({info:['jiuct','xianfang','yaochi','lingxiao'].every(k=>MAPINFO[k]), order:['jiuct','xianfang','yaochi','lingxiao'].every(k=>MAP_ORDER.includes(k)), asm:['jiuct','xianfang','yaochi','lingxiao'].every(k=>window.ASSETS&&ASSETS.maps[k]), wx:MAPINFO.jiuct.wx, wy:MAPINFO.jiuct.wy})")
        case('maps_registered', maps['info'] and maps['order'] and maps['asm'], maps)

        # ---- T3: 飞升续修：强制 realm=7，验证 need/yearExp/realmName 打通 ----
        await pg.evaluate("()=>{ const G=Game.G; G.realm=7; G.stage=3; G.exp=Game.need(); G.tmpBrk=1; G.st.int=30; G.st.luck=30; G.flags.xianjie_open=1; }")
        pre = await pg.evaluate("()=>({need:Game.need(), yearExp:Math.round(Game.yearExp()), rn:Game.realmName(), can:Game.canBreak()})")
        case('ascend_cultivation_open', pre['need']>0 and pre['can']==True and pre['rn']=='飞升', pre)

        # ---- T4: 突破 飞升→地仙（确定性 tmpBrk，循环直到成功）----
        broke = False
        for attempt in range(6):
            await pg.evaluate("()=>{ const G=Game.G; if(G.realm===7){ G.stage=3; G.exp=Game.need(); G.tmpBrk=1; Game.tryBreak(); } }")
            await pump(pg, 10, 380)
            st = await pg.evaluate("()=>Game.G.realm")
            if st >= 8: broke = True; break
        st8 = await pg.evaluate("()=>({realm:Game.G.realm, rn:Game.realmName(), life:Game.lifeMax()})")
        case('break_to_dixian', broke and st8['realm']==8 and st8['rn'].startswith('地仙'), st8)
        await pg.screenshot(path=OUT + 'break_dixian.png')

        # ---- T5: 进入四张仙界地图（travel 后 R.mapId 正确、NPC/怪可生成）----
        for mid in ['jiuct','xianfang','yaochi','lingxiao']:
            ok = await pg.evaluate("async (id)=>{ try{ await Game.enterMap(id); return R.mapId===id; }catch(e){ return 'ERR:'+e.message; } }", mid)
            case(f'enter_{mid}', ok is True, ok)
            await pg.wait_for_timeout(300)
            await pg.screenshot(path=OUT + f'map_{mid}.png')

        # ---- T6: 大地图节点（World28）含仙界四图且归天境 ----
        w28 = await pg.evaluate("()=>{ World28.buildNodes(); return ['jiuct','xianfang','yaochi','lingxiao'].map(id=>{const n=World28.nodeById(id); return n?{id:id,region:n.region,need:n.need}:null;}); }")
        case('world_nodes', w28 and all(x and x['region']=='天境' for x in w28), w28)

        # ---- T7: canEnter 门槛正确 ----
        await pg.evaluate("()=>{ Game.G.flags.awakened=1; Game.G.realm=10; }")
        ent = await pg.evaluate("()=>({jiuct:Game.canEnter('jiuct'), yaochi:Game.canEnter('yaochi'), lingxiao:Game.canEnter('lingxiao'), need_lingxiao:MAPINFO.lingxiao.need})")
        case('canenter_threshold', ent['jiuct']==True and ent['yaochi']==True and ent['lingxiao']==True, ent)

        await pg.wait_for_timeout(500)
        await b.close()

    json.dump(dict(cases=cases, fails=fails, js_errors=errs), open(OUT + 'results_xianjie31.json', 'w'), ensure_ascii=False, indent=1)
    print(f'\n{len(cases)-len(fails)}/{len(cases)} passed; FAIL={fails}; JS errors={len(errs)}')
    for e in errs[:10]: print('  ERR:', e[:200])
    return len(fails)

if __name__ == '__main__':
    sys.exit(asyncio.run(main()))

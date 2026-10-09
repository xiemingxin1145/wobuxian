# 触控操作验证（真实触摸事件，CDP Input.dispatchTouchEvent，412x915，isMobile/hasTouch）
#  (a) 摇杆 8 方向：角色世界坐标移动方向 == 拖动方向；朝向 == 期望；拖动中 walk、松开 idle；朝向与实际运动一致
#  (b) 点按移动：到达点按位置附近；行走中朝向与运动方向一致
#  (c) 边界：拖出摇杆区域后松开、多指（摇杆按住+另一指点按）、点 UI 按钮不移动、面板内滑动不移动
import asyncio, os, sys, math, json
from playwright.async_api import async_playwright
ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www')
URL = 'file://' + os.path.abspath(ROOT) + '/index.html'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'controls') + '/'; os.makedirs(OUT, exist_ok=True)
VW, VH = 412, 915
J0 = (110, VH - 150)
DIRS = [('上', 0, -1, 'N'), ('右上', 1, -1, 'NE'), ('右', 1, 0, 'E'), ('右下', 1, 1, 'SE'), ('下', 0, 1, 'S'), ('左下', -1, 1, 'SW'), ('左', -1, 0, 'W'), ('左上', -1, -1, 'NW')]
DV = {'N': (0, -1), 'NE': (1, -1), 'E': (1, 0), 'SE': (1, 1), 'S': (0, 1), 'SW': (-1, 1), 'W': (-1, 0), 'NW': (-1, -1)}
def ang(a, b):
    la = math.hypot(*a); lb = math.hypot(*b)
    if la < 1e-6 or lb < 1e-6: return 999
    c = (a[0] * b[0] + a[1] * b[1]) / la / lb; return math.degrees(math.acos(max(-1, min(1, c))))
STATE = "()=>{const P=R.player;const [x,y]=t2p(P.i,P.j);const [sx,sy]=w2s(x,y);return {i:P.i,j:P.j,x,y,sx:sx/R.dpr,sy:sy/R.dpr,dir:P.dir,anim:P.anim,joy:!!(R.joy&&R.joy.active),path:(P.path||[]).length,mode:R.mode,modal:!!UI.modal}}"
async def main():
    res = {'joy': [], 'tap': [], 'edge': []}; fails = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load' not in m.text else None)
        cdp = await ctx.new_cdp_session(pg)
        async def touch(kind, pts): await cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in pts]})
        async def tap(x, y): await touch('touchStart', [(0, (x, y))]); await pg.wait_for_timeout(60); await touch('touchEnd', [])
        st = lambda: pg.evaluate(STATE)
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        # 开局（与 panels21 相同的点击流程，但用触摸）
        await pg.tap('text=开始新人生'); await pg.wait_for_timeout(400)
        await pg.tap('#nx'); await pg.wait_for_timeout(200)
        for k in range(3): await pg.locator('.talb').nth(k).tap()
        await pg.tap('#nx'); await pg.wait_for_timeout(200); await pg.tap('#nx'); await pg.wait_for_timeout(200); await pg.tap('#nx'); await pg.wait_for_timeout(2500)
        for k in range(6):
            o = pg.locator('#modals .opt').first
            if await o.count(): await o.tap(); await pg.wait_for_timeout(500)
        await pg.wait_for_timeout(1500)
        # 清空地图上的 NPC/怪物，避免触发对话/战斗干扰测量；关闭过场
        await pg.evaluate("()=>{R.ents=R.ents.filter(e=>e===R.player);R.marks.forEach(m=>m.hidden=true);document.querySelectorAll('.chapter-fx').forEach(e=>e.click())}")
        await pg.wait_for_timeout(800)
        # 找一个四周 3 格都可走的中心点
        center = await pg.evaluate("()=>{let best=null;for(let j=2;j<R.n-2;j++)for(let i=2;i<R.n-2;i++){if(!walkable(i,j))continue;let c=0;for(let dj=-3;dj<=3;dj++)for(let di=-3;di<=3;di++)if(walkable(i+di,j+dj))c++;if(!best||c>best[2])best=[i,j,c]}return best.concat([R.mode,R.player.speed])}")
        print('center', center)
        async def reset():
            await pg.evaluate(f"()=>{{const P=R.player;P.i={center[0]}+0.5;P.j={center[1]}+0.5;P.path=[];P.anim='idle';R.cam.x=t2p(P.i,P.j)[0];R.cam.y=t2p(P.i,P.j)[1]}}"); await pg.wait_for_timeout(250)
        # ---------- (a) 摇杆 8 方向 ----------
        for name, dx, dy, want in DIRS:
            await reset(); s0 = await st()
            L = 50 / math.hypot(dx, dy); tx, ty = J0[0] + dx * L, J0[1] + dy * L
            await touch('touchStart', [(0, J0)])
            for k in range(1, 6): await touch('touchMove', [(0, (J0[0] + dx * L * k / 5, J0[1] + dy * L * k / 5))]); await pg.wait_for_timeout(16)
            samples = []
            for k in range(6):
                await pg.wait_for_timeout(110); samples.append(await st())
            # 角色特写截图（证据）
            s = samples[-1]; clip = {'x': max(0, s['sx'] - 70), 'y': max(0, s['sy'] - 150), 'width': 140, 'height': 180}
            await pg.screenshot(path=OUT + f'joy_{want}.png', clip=clip)
            await touch('touchEnd', []); await pg.wait_for_timeout(350); s2 = await st()
            mv = (s['x'] - s0['x'], s['y'] - s0['y'])
            # 朝向与“实际运动方向”一致性（逐帧）
            worst = 0
            for a_, b_ in zip(samples, samples[1:]):
                m = (b_['x'] - a_['x'], b_['y'] - a_['y'])
                if math.hypot(*m) > 0.5: worst = max(worst, ang(m, (DV[b_['dir']][0] * 2, DV[b_['dir']][1])))  # 等距：斜向屏幕角约 26.6°
            e = ang(mv, (dx, dy)); ok = e < 30 and all(x['anim'] == 'walk' for x in samples[1:]) and samples[-1]['dir'] == want and s2['anim'] == 'idle' and not s2['joy'] and worst < 30
            row = dict(drag=name, expect=want, got=samples[-1]['dir'], move_angle_err=round(e, 1), facing_vs_motion_err=round(worst, 1), walk_while_drag=all(x['anim'] == 'walk' for x in samples[1:]), idle_after_release=s2['anim'] == 'idle', moved_px=round(math.hypot(*mv), 1), ok=ok)
            res['joy'].append(row); print('JOY', row)
            if not ok: fails.append(('joy', row))
        # ---------- (b) 点按移动 ----------
        for (oi, oj) in [(3, 0), (0, 3), (-3, -2), (2, -3), (-3, 2)]:
            await reset(); s0 = await st()
            ti, tj = center[0] + oi, center[1] + oj
            sc = await pg.evaluate(f"()=>{{const [x,y]=t2p({ti}+0.5,{tj}+0.5);const [sx,sy]=w2s(x,y);return [sx/R.dpr,sy/R.dpr]}}")
            await pg.evaluate("()=>{window.__rec=[];const f=()=>{if(!window.__rec)return;const P=R.player;const [x,y]=t2p(P.i,P.j);window.__rec.push([x,y,P.dir,P.anim]);requestAnimationFrame(f)};requestAnimationFrame(f)}")
            await tap(*sc); samples = []
            for k in range(40):
                await pg.wait_for_timeout(100); s = await st(); samples.append(s)
                if k > 2 and s['path'] == 0 and s['anim'] == 'idle': break
            rec = await pg.evaluate("()=>{const r=window.__rec;window.__rec=null;return r}")
            mv_frames = bad = 0
            for a_, b_ in zip(rec, rec[1:]):
                m = (b_[0] - a_[0], b_[1] - a_[1])
                if math.hypot(*m) > 0.3 and b_[3] == 'walk':
                    mv_frames += 1; bad += ang(m, (DV[b_[2]][0] * 2, DV[b_[2]][1])) > 30
            worst = round(100 * bad / max(1, mv_frames), 1)  # 朝向与运动不符的帧百分比
            s = samples[-1]; d = math.hypot(s['i'] - (ti + 0.5), s['j'] - (tj + 0.5))
            first_walk = next((x['dir'] for x in samples if x['anim'] == 'walk'), None)
            ok = d < 1.01 and worst <= 5 and s['anim'] == 'idle'
            row = dict(target=f'({oi:+d},{oj:+d})', screen=[round(sc[0]), round(sc[1])], end_dist_tiles=round(d, 2), first_facing=first_walk, mismatch_frames_pct=worst, path_tiles=len(samples), idle_on_arrival=s['anim'] == 'idle', ok=ok)
            res['tap'].append(row); print('TAP', row)
            if not ok: fails.append(('tap', row))
        await pg.screenshot(path=OUT + 'tap_end.png')
        # ---------- (c) 边界情况 ----------
        # c1 拖出摇杆区域到屏幕顶部再松开
        await reset(); await touch('touchStart', [(0, J0)])
        for k in range(1, 11): await touch('touchMove', [(0, (J0[0] + 20 * k, J0[1] - 70 * k))]); await pg.wait_for_timeout(20)
        s1 = await st(); await touch('touchEnd', []); await pg.wait_for_timeout(400); s2 = await st()
        row = dict(case='拖出摇杆区域后松开', during_walk=s1['anim'] == 'walk', after_idle=s2['anim'] == 'idle', joy_released=not s2['joy'], ok=s1['anim'] == 'walk' and s2['anim'] == 'idle' and not s2['joy'])
        res['edge'].append(row); print('EDGE', row)
        # c2 多指：摇杆按住，另一指点按地图
        await reset(); await touch('touchStart', [(0, J0)]); await touch('touchMove', [(0, (J0[0] + 50, J0[1]))]); await pg.wait_for_timeout(200)
        await touch('touchStart', [(0, (J0[0] + 50, J0[1])), (1, (300, 300))]); await pg.wait_for_timeout(60); await touch('touchMove', [(0, (J0[0] + 50, J0[1]))])  # 只抬起第二指
        await pg.wait_for_timeout(300); s1 = await st()
        await touch('touchEnd', []); await pg.wait_for_timeout(400); s2 = await st()
        row = dict(case='摇杆按住+另一指点按', joy_still_active=s1['joy'], still_facing_E=s1['dir'] == 'E', released_ok=not s2['joy'], ok=s1['joy'] and s1['dir'] == 'E' and not s2['joy'])
        res['edge'].append(row); print('EDGE', row)
        # c3 点按 UI 按钮（背包）不应移动角色
        await pg.evaluate("()=>{R.player.path=[]}"); await reset(); s0 = await st()
        btn = pg.locator('#menu button').first
        bb = await btn.bounding_box() if await btn.count() else None
        if bb is None:
            bb = await pg.evaluate("()=>{const b=[...document.querySelectorAll('button')].find(x=>x.offsetParent&&x.textContent.includes('背包'));if(!b)return null;const r=b.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}}")
        await tap(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); await pg.wait_for_timeout(700); s1 = await st()
        await pg.screenshot(path=OUT + 'ui_button_tap.png')
        row = dict(case='点按UI按钮(背包)', panel_opened=s1['modal'] or await pg.evaluate("()=>!!document.querySelector('.panel')"), player_path=s1['path'], moved=round(math.hypot(s1['x'] - s0['x'], s1['y'] - s0['y']), 2))
        row['ok'] = row['player_path'] == 0 and row['moved'] < 0.5; res['edge'].append(row); print('EDGE', row)
        # c4 面板内滑动（触摸拖动列表）
        pb = await pg.evaluate("()=>{const p=document.querySelector('.panel .pbody')||document.querySelector('.panel');if(!p)return null;const r=p.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}")
        if pb:
            await touch('touchStart', [(0, (pb[0], pb[1] + 120))])
            for k in range(1, 9): await touch('touchMove', [(0, (pb[0], pb[1] + 120 - 25 * k))]); await pg.wait_for_timeout(16)
            await touch('touchEnd', []); await pg.wait_for_timeout(500)
        s2 = await st()
        row = dict(case='面板内滑动', player_path=s2['path'], moved=round(math.hypot(s2['x'] - s0['x'], s2['y'] - s0['y']), 2)); row['ok'] = row['player_path'] == 0 and row['moved'] < 0.5
        res['edge'].append(row); print('EDGE', row)
        # c5 关闭面板后摇杆仍正常
        await pg.evaluate("()=>{UI.closePanel?UI.closePanel():document.querySelector('.panel .x, .panel .close')?.click()}"); await pg.wait_for_timeout(400)
        await reset(); s0 = await st(); await touch('touchStart', [(0, J0)])
        for k in range(1, 6): await touch('touchMove', [(0, (J0[0] - 10 * k, J0[1]))]); await pg.wait_for_timeout(16)
        await pg.wait_for_timeout(500); s1 = await st(); await touch('touchEnd', [])
        row = dict(case='关闭面板后摇杆', dir=s1['dir'], moved_left=s1['x'] < s0['x'] - 2, ok=s1['dir'] == 'W' and s1['x'] < s0['x'] - 2)
        res['edge'].append(row); print('EDGE', row)
        res['errors'] = errs; print('JS errors', len(errs), errs[:5])
        json.dump(res, open(OUT + 'results.json', 'w'), ensure_ascii=False, indent=1)
        print('FAILS', len(fails) + sum(1 for r in res['edge'] if not r['ok']))
        await b.close()
asyncio.run(main())

# 真人点击测试 human_olaf —— 发版前门禁（只用真实触摸，不调用任何游戏逻辑）
#
# 原则（对应 docs 设计规格 v2.3 的 G.1）：
#  - 动作只用 CDP Input.dispatchTouchEvent（与 test/controls.py 同法），412x915、is_mobile、has_touch。
#  - 点哪儿 = 屏幕上实际画在哪儿：UI 用 getBoundingClientRect()；NPC 用 w2s(t2p(...)) + spriteBox + 绘制常量
#    （engine.js 头顶名字 y-b.h-6，标记再上 30 世界 px）。page.evaluate 只读状态做断言，绝不删 NPC、不瞬移、不调 Game.*。
#  - 需要造场景（传送/跳章/离线模拟）的用例只能走“开发者模式”（URL #dev 或标题页连点版本号 7 次）的 UI；
#    当前构建没有开发者模式时，这些用例记为 FAIL（BLOCKED: no dev mode），用到的作弊会写进结果。
#  - 每个用例截图到 test/human_olaf/，结果写 test/human_olaf/results.json；退出码 = 失败用例数。
#
# 用例（设计规格 G.2 的 T1–T13，全部点按实现）：
#  N1  打完一场战斗后，点地面/点 NPC 是否还有效（本测试新发现的阻断 bug）
#  T0  开局：标题→新人生→捏人→进地图，找最近的“！”NPC，点它→对话→接任务→追踪栏
#  T1  判定框：每个 NPC 点 脚/身体/头/名字/头顶标记 5 点，100% 打开该 NPC 对话，0 次命中道具/地面
#  T2  摇杆区点按：走位让 NPC 落在左下摇杆区 (≈120,700)，点它 → 对话，且摇杆没被激活
#  T3  靠近交互按钮：走到 NPC 1.5 格内，300ms 内出现 #actbtn/#talkbtn（含 NPC 名），点它 → 该 NPC 对话
#  T4  NPC 闲逛：5–6 格外点 NPC 身体 20 次（村里 NPC 轮流），20/20 打开正确对话
#  T5  空路径边界（需开发者传送）
#  T6  前两章可点：新人生不按“过年”，只点追踪栏“前往”+ 点按，60 秒内觉醒灵根、主线到“宗门”
#  T7  跨图寻路（需开发者模式）  T8 取消寻路  T9 自动任务（需开发者模式）
#  T10 开发者模式入口（不带 #dev 时 #devbtn 不存在；标题页点版本号 7 次开启）
#  T11 离线收益（需开发者模式）  T12 在线挂机（#afkbtn）
#  T13 回归：controls.py / panels21.py / multilife.py / node validate22.js（HUMAN_OLAF_T13=0 可跳过）
#
# 用法：python3 test/human_olaf.py [www目录]      环境变量：DPR=2.625（真机像素比）  ONLY=T1,T4  T4_N=20
import asyncio, os, sys, json, math, threading, functools, http.server, socketserver, subprocess, time
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'www'))
OUT = os.environ.get('OUT') or os.path.join(HERE, 'human_olaf') + '/'; os.makedirs(OUT, exist_ok=True)
VW, VH = 412, 915
DPR = float(os.environ.get('DPR', '2'))
CHROME = os.environ.get('CHROME', '/opt/google/chrome/chrome')
ONLY = set(x.strip() for x in os.environ.get('ONLY', '').split(',') if x.strip())
T4_N = int(os.environ.get('T4_N', '20'))
T4_BUDGET = float(os.environ.get('T4_BUDGET', '600'))   # 秒；超时剩余次数记为 timeout（算失败）
JOY = lambda x, y: x < VW * 0.4 and y > VH * 0.62          # engine.js:296 的摇杆区（CSS px）

def serve(root):
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    s = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=root)); s.daemon_threads = True
    threading.Thread(target=s.serve_forever, daemon=True).start(); return s

# ---------- 只读脚本 ----------
JS_NPCS = """()=>{if(!R.player||R.mode!=='map'||!R.M)return null;const P=R.player;const k=R.Z/R.dpr;const o=[];
const S=(x,y)=>{const [a,b]=w2s(x,y);return [a/R.dpr,b/R.dpr]};
for(const e of R.ents){if((e.kind!=='npc'&&e.kind!=='boss')||e.hidden)continue;const [x,y]=t2p(e.i,e.j);const b=spriteBox(e.spr,e.s);
 o.push({id:e.id,kind:e.kind,name:e.label,mark:e.mark||null,i:e.i,j:e.j,dist:Math.hypot(e.i-P.i,e.j-P.j),moving:!!(e.path&&e.path.length),
  pts:{feet:S(x,y-4),body:S(x,y-b.h/2),head:S(x,y-b.h*0.88),name:S(x,y-b.h-6-8),mark:e.mark?S(x,y-b.h-6-30-14):null},
  box_css:[Math.round((b.w+20)*k),Math.round((b.h+30)*k)]})}
const [px,py]=t2p(P.i,P.j);
return {p:[P.i,P.j],ps:S(px,py),k,age:Game.G&&Game.G.age,map:R.mapId,joy:!!(R.joy&&R.joy.active),
 marks:R.marks.filter(m=>!m.hidden).map(m=>{const [x,y]=t2p(m.i+.5,m.j+.5);return {act:m.act,label:m.label||m.n||m.act,i:m.i,j:m.j,s:S(x,y-(m.h||110))}}),
 npcs:o.sort((a,b)=>a.dist-b.dist)}}"""
JS_SCREEN = """()=>{const vis=e=>{if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none'};
const top=[...document.querySelectorAll('#modals .mwrap')].filter(w=>!w.classList.contains('outm')).pop();
const GM=typeof Game!=='undefined'?Game:null;const G=GM&&GM.G;
return {modal:UI.stack.length,top:top?top.className:null,dlg:!!(top&&top.querySelector('.dlg')),
 who:top&&top.querySelector('.dn')?top.querySelector('.dn').textContent:null,
 title:top&&top.querySelector('.ct,.ph b')?top.querySelector('.ct,.ph b').textContent:null,
 text:top?((top.querySelector('.dt,.tx')||{}).textContent||'').slice(0,90):null,
 opts:top?[...top.querySelectorAll('.opt')].map(b=>b.textContent.trim()):[],
 hasX:!!(top&&top.querySelector('.x')),chapter:!!document.querySelector('.chapter-fx'),
 qt:vis(document.querySelector('#qt'))?document.querySelector('#qt').innerText.replace(/\\n/g,' | '):null,
 path:R.player?(R.player.path||[]).length:0,busy:!!(GM&&GM._busy),battle:!!(typeof B!=='undefined'&&B.on),mode:R.mode,
 joy:!!(R.joy&&R.joy.active),age:G?G.age:null,main:G&&typeof MAIN!=='undefined'&&MAIN[G.main]?MAIN[G.main].id:null,awakened:!!(G&&G.flags&&G.flags.awakened),
 ap:G?G.ap:null,mapId:R.mapId,ingame:document.body.classList.contains('ingame')}}"""
JS_RECT = """([sel,txt])=>{const e=[...document.querySelectorAll(sel)].filter(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'&&!e.closest('.outm')&&(!txt||e.textContent.includes(txt))}).pop();
if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,e.textContent.trim().slice(0,30)]}"""
JS_HIT = "([x,y])=>{const e=document.elementFromPoint(x,y);return e?(e.id?'#'+e.id:e.tagName.toLowerCase()+(e.className&&e.className.baseVal===undefined?'.'+e.className:'')):null}"
JS_WALK = "([i,j])=>walkable(i,j)"   # 只读：网格可走
JS_TILE_S = "([i,j])=>{const [x,y]=t2p(i,j);const [a,b]=w2s(x,y);return [a/R.dpr,b/R.dpr]}"
SAFE_NO = ('离开', '再见', '算了', '取消', '……', '不了', '下次', '先不', '再想想', '好')

class Ctx: pass

async def main():
    srv = serve(ROOT); base = f'http://127.0.0.1:{srv.server_address[1]}/index.html'
    cases, errs, n = [], [], [0]
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path=CHROME, args=['--autoplay-policy=no-user-gesture-required'])
        async def new_page(hash_=''):
            ctx = await br.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=DPR, is_mobile=True, has_touch=True)
            pg = await ctx.new_page()
            pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
            pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'Failed to load' not in m.text and 'favicon' not in m.text else None)
            c = Ctx(); c.pg = pg; c.ctx = ctx; c.cdp = await ctx.new_cdp_session(pg); c.battles = 0; c.cheats = []
            await pg.goto(base + hash_); await pg.wait_for_timeout(2500); return c

        # ---------- 动作（只有触摸） ----------
        async def touch(c, kind, pts): await c.cdp.send('Input.dispatchTouchEvent', {'type': kind, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in pts]})
        async def tap(c, x, y, hold=70):
            await touch(c, 'touchStart', [(0, (x, y))]); await c.pg.wait_for_timeout(hold); await touch(c, 'touchEnd', [])
        async def shot(c, name):
            n[0] += 1; f = f'{n[0]:03d}_{name}.png'; await c.pg.screenshot(path=OUT + f); return f
        scr = lambda c: c.pg.evaluate(JS_SCREEN)
        npcs = lambda c: c.pg.evaluate(JS_NPCS)
        async def rect(c, sel, txt=None): return await c.pg.evaluate(JS_RECT, [sel, txt])
        async def tap_el(c, sel, txt=None, wait=450):
            r = await rect(c, sel, txt)
            if not r: return None
            await tap(c, r[0], r[1]); await c.pg.wait_for_timeout(wait); return r
        async def clear_popups(c, limit=25, prefer=None):
            seen = []
            for _ in range(limit):
                s = await scr(c)
                if s['chapter']: await tap_el(c, '.chapter-fx', None, 500); seen.append('chapter'); continue
                if s['battle'] and not s['modal']: break
                if not s['modal']:
                    await c.pg.wait_for_timeout(450); s = await scr(c)
                    if not s['modal'] and not s['chapter']: break
                    continue
                pk = None
                for want in ([prefer] if prefer else []) + list(SAFE_NO):
                    pk = next((o for o in s['opts'] if want and o.startswith(want)), None)
                    if pk: break
                if s['opts'] and not pk: pk = s['opts'][0] if not s['dlg'] else s['opts'][-1]
                if pk: await tap_el(c, '#modals .mwrap .opt', pk, 550); seen.append(pk); continue
                if s['hasX']: await tap_el(c, '#modals .mwrap .x', None, 450); seen.append('x'); continue
                await c.pg.wait_for_timeout(400)
            return seen
        async def ensure_map(c):
            """路上撞怪进了战斗：像真人一样点“自动”打完、点掉结算"""
            hit = False
            for _ in range(240):
                s = await scr(c)
                if not s['battle'] and not s['busy']:
                    if s['modal'] or s['chapter']: await clear_popups(c, 8, prefer='收下'); continue
                    break
                hit = True
                if s['battle'] and not s['modal']: await tap_el(c, '#battlebar button[data-a=auto]', None, 300)
                if s['modal']: await clear_popups(c, 4, prefer='收下')
                await c.pg.wait_for_timeout(500)
            if hit: c.battles += 1; await c.pg.wait_for_timeout(700)
            return hit
        async def taps_alive(c): return await c.pg.evaluate("()=>typeof R.onTap==='function'")   # 只读：地图点按回调是否还在
        async def recover(c):
            """N1 bug 的真人绕法：战斗后点按失效 → 回到标题“继续人生”重进地图（只在 c.auto_recover 时用，并计数）"""
            if not getattr(c, 'auto_recover', False) or await taps_alive(c) or (await scr(c))['battle']: return False
            await c.pg.reload(); await c.pg.wait_for_timeout(2500); await tap_el(c, '#title .opt', '继续人生', 600)
            await c.pg.wait_for_timeout(3000); await clear_popups(c, 10); c.recoveries = getattr(c, 'recoveries', 0) + 1; return True
        async def free_point(c, x, y):
            """该屏幕点是否直接落在画布上（没被 HUD/菜单盖住），且不在摇杆区"""
            return not JOY(x, y) and 20 < x < VW - 20 and 20 < y < VH - 20 and await c.pg.evaluate(JS_HIT, [x, y]) == '#cv'
        async def walk_to(c, i, j, tol=0.75, hops=14):
            """点地面走到格子 (i,j)。只点没被 UI 盖住、不在摇杆区的点；太远就朝那个方向点一步。"""
            for _ in range(hops):
                await ensure_map(c); await recover(c); st = await npcs(c)
                if not st: return False
                if math.hypot(st['p'][0] - (i + .5), st['p'][1] - (j + .5)) < tol: return True
                tx, ty = await c.pg.evaluate(JS_TILE_S, [i + .5, j + .5])
                if not await free_point(c, tx, ty):
                    px, py = st['ps']; dx, dy = tx - px, ty - py; L = math.hypot(dx, dy) or 1; ok = False
                    for r in (150, 110, 80, 50):
                        cx, cy = px + dx / L * r, py + dy / L * r
                        if await free_point(c, cx, cy): tx, ty, ok = cx, cy, True; break
                    if not ok: return False
                await tap(c, tx, ty)
                for _ in range(40):
                    await c.pg.wait_for_timeout(150); s = await scr(c)
                    if s['modal'] or s['battle']: break
                    if s['path'] == 0: break
                s = await scr(c)
                if s['modal'] and not s['battle']: await clear_popups(c, 6)
            st = await npcs(c); return bool(st) and math.hypot(st['p'][0] - (i + .5), st['p'][1] - (j + .5)) < tol + 0.5
        def find(st, nid): return next((x for x in st['npcs'] if x['id'] == nid), None) if st else None
        async def outcome(c, name, wait_s):
            """点完以后发生了什么：npc（正确对话）/other_npc/card（道具、事件）/battle/none"""
            t0 = time.time(); walked = False; s = None; joy = False
            while time.time() - t0 < wait_s:
                await c.pg.wait_for_timeout(150); s = await scr(c); walked |= s['path'] > 0; joy |= s['joy']
                if s['battle'] or s['modal']: break
            if s['battle']: res = 'battle'
            elif s['modal'] and s['dlg']: res = 'npc' if (s['who'] or '').startswith(name) else 'other_npc:' + str(s['who'])
            elif s['modal']: res = 'card:' + str(s['title'] or s['text'])[:20]
            else: res = 'none(walked)' if walked else 'none'
            return dict(result=res, walked=walked, joy_activated=joy, opts=s['opts'][:4] if s else [])
        async def tap_npc_point(c, nid, part, wait_s=6.0):
            await ensure_map(c); await recover(c); st = await npcs(c); t = find(st, nid)
            if not t or not t['pts'].get(part): return dict(result='skip(no point)')
            x, y = t['pts'][part]; hit = await c.pg.evaluate(JS_HIT, [x, y])
            d0 = round(t['dist'], 2); await tap(c, x, y); o = await outcome(c, t['name'], wait_s)
            o.update(tap=[round(x), round(y)], dom_at_point=hit, in_joy_zone=JOY(x, y), dist_before=d0)
            if o['result'] == 'battle': await shot(c, f'interrupt_{nid}'); await ensure_map(c)
            else: await clear_popups(c, 8)
            return o
        async def stand_near(c, nid, d=(0, 2)):
            """站到 NPC 附近（默认南边 2 格，NPC 在画面中上部，点位不被 UI 挡）"""
            st = await npcs(c); t = find(st, nid)
            if not t: return False
            bi, bj = int(t['i']), int(t['j'])
            for di, dj in [d, (1, 2), (-1, 2), (2, 1), (0, 3), (2, 2), (-2, 2), (1, 1), (0, 1)]:
                if await c.pg.evaluate(JS_WALK, [bi + di, bj + dj]):
                    return await walk_to(c, bi + di, bj + dj)
            return False
        async def new_life(c):
            await tap_el(c, '#title .opt', '开始新人生', 700); talents = 0
            for _ in range(14):
                if (await scr(c))['ingame']: break
                k = await c.pg.evaluate("()=>{const t=[...document.querySelectorAll('.talb')];const i=t.findIndex(x=>!x.classList.contains('on'));if(i<0)return null;const r=t[i].getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}")
                if k and talents < 3: await tap(c, *k); await c.pg.wait_for_timeout(250); talents += 1; continue
                await tap_el(c, '#rs', None, 250)
                if not await tap_el(c, '#nx', None, 500): await c.pg.wait_for_timeout(600)
            await c.pg.wait_for_timeout(3000); seen = await clear_popups(c, 30); await c.pg.wait_for_timeout(600); await ensure_map(c)
            return seen
        async def has_dev(c): return await c.pg.evaluate("()=>!!document.querySelector('#devbtn')||typeof DEV!=='undefined'||typeof window.DEV!=='undefined'")
        async def dev_tap(c, *labels):
            """开发者面板里按文字逐个点（只走 UI）。返回是否全部点到。"""
            if not await tap_el(c, '#devbtn', None, 600): return False
            for lb in labels:
                if not await tap_el(c, '#modals button, #modals [data-k], #modals .opt, #modals .tab, #modals [data-t]', lb, 600): return False
            c.cheats.append('dev:' + '>'.join(labels)); return True

        # ---- v2.3 补：开发者面板造场景（只点 UI），关面板 ----
        async def dev_close(c):
            for _ in range(3):
                if not await tap_el(c, '#modals .mwrap .x', None, 400): break
        async def dev_setup(c, *steps):
            ok = True
            for st_ in steps: ok = await dev_tap(c, *st_) and ok; await dev_close(c); await clear_popups(c, 6)
            return ok
        JS_ST = "()=>{const G=Game.G,P=R.player;return {map:R.mapId,ap:G.ap,main:G.main,age:G.age,exp:G.exp,realm:G.realm,stage:G.stage,p:P?[P.i,P.j]:null,nav:P?P.nav||null:null,speed:P?P.speed:0,ts:R.ts||1,afk:typeof AFK!=='undefined'?{on:AFK.on,box:AFK.box,kills:AFK.st?(G.killsTotal||0)-AFK.st.kills0:0}:null}}"
        gst = lambda c: c.pg.evaluate(JS_ST)
        def case(cid, ok, **info):
            row = dict(case=cid, ok=bool(ok), **info); cases.append(row)
            json.dump(dict(dpr=DPR, cases=cases, js_errors=errs, partial=True), open(OUT + 'results.json', 'w'), ensure_ascii=False, indent=1)
            print(('PASS ' if ok else 'FAIL ') + cid, json.dumps(info, ensure_ascii=False)[:700], flush=True); return ok
        want = lambda cid: not ONLY or cid in ONLY

        # =============== 主会话：全新存档 ===============
        c = await new_page()
        s0 = await scr(c)
        if want('T10'):
            devbtn_title = await c.pg.evaluate("()=>!!document.querySelector('#devbtn')")
        popups = await new_life(c); s = await scr(c); st = await npcs(c)
        f = await shot(c, 'T0_enter_map')
        npc_list = [(x['name'], x['id'], x['mark'], round(x['dist'], 1), x['box_css']) for x in st['npcs']] if st else []
        case('T0a_new_life_enter_map', s['ingame'] and st is not None, age=s['age'], map=s['mapId'], tracker=s['qt'], popups=popups, npcs=npc_list,
             hitbox_css_wxh=st and {x['name']: x['box_css'] for x in st['npcs']}, shot=f)
        # ---- N1 打完一场战斗后，地图点按是否还有效（新发现：ui.js battleChoose 的 done() 把 R.onTap 置空） ----
        if want('N1'):
            c2 = await new_page(); await new_life(c2); info = {}
            mons = await c2.pg.evaluate("()=>{const P=R.player;return R.ents.filter(e=>e.kind==='mon'&&!e.hidden).map(e=>{const [x,y]=t2p(e.i,e.j);const b=spriteBox(e.spr,e.s);const [a,c]=w2s(x,y-b.h/2);return {n:e.label,d:Math.hypot(e.i-P.i,e.j-P.j),s:[a/R.dpr,c/R.dpr]}}).sort((a,b)=>a.d-b.d)}")
            info['ontap_before'] = await taps_alive(c2)
            fought = False
            for m in mons[:8]:
                if await free_point(c2, *m['s']):
                    await tap(c2, *m['s'])
                    for _ in range(60):
                        await c2.pg.wait_for_timeout(250)
                        if (await scr(c2))['battle']: fought = True; break
                    if fought: break
            if fought:
                await c2.pg.wait_for_timeout(800); info['battle_shot'] = await shot(c2, 'N1_battle')
                await ensure_map(c2)
            info['fought'] = fought; info['ontap_after_battle'] = await taps_alive(c2)
            # 点空地：主角应当开始走
            st2 = await npcs(c2); px, py = st2['ps']; moved = None
            for dx, dy in ((0, -120), (110, -60), (-110, -60), (100, 60)):
                if await free_point(c2, px + dx, py + dy):
                    p0 = st2['p']; await tap(c2, px + dx, py + dy); await c2.pg.wait_for_timeout(1500)
                    p1 = (await npcs(c2))['p']; moved = round(math.hypot(p1[0] - p0[0], p1[1] - p0[1]), 2); break
            info['ground_tap_moved_tiles'] = moved
            cand_ = [x for x in (await npcs(c2))['npcs'] if x['kind'] == 'npc']
            t = cand_[0]
            for x in cand_:
                if await free_point(c2, *x['pts']['body']): t = x; break
            info['npc'] = t['name']   # v2.3：只挑普通 NPC（讨债史莱姆是 boss，点它本来就会开打）
            o = await tap_npc_point(c2, t['id'], 'body', 8) if await free_point(c2, *t['pts']['body']) else dict(result='npc not tappable on screen')
            info['npc_tap_after_battle'] = o['result']; info['shot'] = await shot(c2, 'N1_after_battle_tap_dead')
            case('N1_taps_still_work_after_battle', fought and info['ontap_after_battle'] and (moved or 0) > 0.5 and o['result'] == 'npc', **info)
            await c2.ctx.close()
        # ---- T0 找最近的“！”NPC → 点 → 对话 → 接任务 → 追踪栏 ----
        if want('T0'):
            giver = next((x for x in st['npcs'] if x['mark'] == '!' and x['kind'] == 'npc'), None)
            steps = {}
            if giver:
                await stand_near(c, giver['id'], (0, 3))
                o = await tap_npc_point(c, giver['id'], 'mark', 6)          # 真人最先点的：头顶“！”
                steps['tap_mark'] = o['result']
                o = await tap_npc_point(c, giver['id'], 'name', 6); steps['tap_name'] = o['result']
                await stand_near(c, giver['id'], (0, 3))
                st2 = await npcs(c); t = find(st2, giver['id']); x, y = t['pts']['body']
                await tap(c, x, y); o = await outcome(c, giver['name'], 8); steps['tap_body'] = o['result']
                f = await shot(c, 'T0_dialog')
                acc = None
                if o['result'] == 'npc':
                    q = next((x for x in o['opts'] if x.startswith('！')), None); steps['quest_option'] = q
                    if q:
                        await tap_el(c, '#modals .mwrap .opt', q, 700); s = await scr(c); steps['detail'] = s['text']
                        if any('接受' in x for x in s['opts']): await tap_el(c, '#modals .mwrap .opt', '接受', 900); acc = q[1:]
                await clear_popups(c, 8); await c.pg.wait_for_timeout(600); s = await scr(c)
                steps['tracker'] = s['qt']
                await tap_el(c, '#qt', None, 800); s2 = await scr(c)
                body = await c.pg.evaluate("()=>{const p=[...document.querySelectorAll('#modals .panel')].pop();return p?p.innerText:''}")
                steps['quest_panel_lists_it'] = bool(acc and acc in body)
                steps['tracker_go_button'] = await c.pg.evaluate("()=>[...document.querySelectorAll('#qt *,#modals .panel *')].some(b=>/前往|寻路|导航/.test(b.textContent)&&(b.tagName==='BUTTON'||b.onclick||b.dataset.go))")
                f2 = await shot(c, 'T0_quest_panel'); await clear_popups(c, 4)
                ok = steps['tap_body'] == 'npc' and acc and steps['quest_panel_lists_it']
                case('T0_quest_giver_flow', ok, npc=giver['name'], accepted=acc, steps=steps, shots=[f, f2], battles_on_way=c.battles)
            else:
                case('T0_quest_giver_flow', False, err='地图上没有带“！”的 NPC')
        # 以下 T1–T4 只想测“判定/摇杆/闲逛”本身：遇到 N1（战斗后点按失效）时用真人绕法（回标题继续人生）恢复，并记录次数
        c.auto_recover = True; await recover(c)
        # ---- T1 判定框：每个 NPC 5 个点 ----
        if want('T1'):
            st = await npcs(c); rows = []; hits = tot = wrong = 0
            for t in [x for x in st['npcs'] if x['kind'] == 'npc']:
                for part in ('feet', 'body', 'head', 'name', 'mark'):
                    if part == 'mark' and not t['mark']: continue
                    await stand_near(c, t['id'])
                    o = await tap_npc_point(c, t['id'], part, 7)
                    if o['result'].startswith('skip'): continue
                    tot += 1; hits += o['result'] == 'npc'; wrong += o['result'].startswith('card') or o['result'].startswith('other')
                    rows.append(dict(npc=t['name'], part=part, **{k: o[k] for k in ('result', 'tap', 'dom_at_point', 'dist_before')}))
                    if o['result'] != 'npc' and part in ('name', 'mark'): await shot(c, f'T1_{t["id"]}_{part}_miss')
            byp = {}
            for r in rows: byp.setdefault(r['part'], [0, 0]); byp[r['part']][0] += r['result'] == 'npc'; byp[r['part']][1] += 1
            case('T1_hitbox_5_points', tot and hits == tot and wrong == 0, map='village', hit=f'{hits}/{tot}', wrong_target=wrong,
                 by_part={k: f'{a}/{b}' for k, (a, b) in byp.items()}, misses=[r for r in rows if r['result'] != 'npc'],
                 note='sect/market 需开发者传送，当前只测 village' if not await has_dev(c) else '')
        # ---- T2 摇杆区点按 ----
        if want('T2'):
            info = {}; ok = False
            st = await npcs(c); cand = [x for x in st['npcs'] if x['kind'] == 'npc']
            for t in cand:
                for _ in range(4):   # 迭代走位：让 NPC 屏幕位置落到摇杆区 (≈110,650)
                    st = await npcs(c); tt = find(st, t['id']); k = st['k']
                    bx, by = tt['pts']['body']
                    if JOY(bx, by) and bx > 40 and by < VH - 120: break
                    wx = (bx - 110) / k; wy = (by - 650) / k   # 主角需要在世界坐标里挪动的量
                    tgt = await c.pg.evaluate(f"()=>{{const [x,y]=t2p({st['p'][0]},{st['p'][1]});const [i,j]=p2t(x+{wx},y+{wy});return [Math.floor(i),Math.floor(j)]}}")
                    best = None
                    for r in range(0, 5):
                        for di in range(-r, r + 1):
                            for dj in range(-r, r + 1):
                                if best is None and await c.pg.evaluate(JS_WALK, [tgt[0] + di, tgt[1] + dj]): best = (tgt[0] + di, tgt[1] + dj)
                    if not best: break
                    await walk_to(c, *best); await c.pg.wait_for_timeout(1200)
                st = await npcs(c); tt = find(st, t['id']); bx, by = tt['pts']['body']
                if JOY(bx, by):
                    f = await shot(c, 'T2_npc_in_joystick_zone')
                    o = await tap_npc_point(c, t['id'], 'body', 6); ok = o['result'] == 'npc'
                    info = dict(npc=t['name'], tap=o['tap'], result=o['result'], joy_activated_sampled=o['joy_activated'], shot=f); break
                info = dict(err=f'走位后 NPC 没进摇杆区：{t["name"]} at {[round(bx), round(by)]}')
            case('T2_tap_npc_in_joystick_zone', ok, **info)
        # ---- T3 靠近交互按钮 ----
        if want('T3'):
            st = await npcs(c); t = next(x for x in st['npcs'] if x['kind'] == 'npc')
            await stand_near(c, t['id'], (0, 1)); await c.pg.wait_for_timeout(300)
            st = await npcs(c); tt = find(st, t['id'])
            r = await rect(c, '#actbtn, #talkbtn'); f = await shot(c, 'T3_near_npc')
            res = None
            if r:
                await tap(c, r[0], r[1]); o = await outcome(c, t['name'], 3); res = o['result']; await clear_popups(c, 6)
            case('T3_near_interact_button', bool(r) and res == 'npc', npc=t['name'], dist=round(tt['dist'], 2) if tt else None,
                 button=r and r[2], result=res, shot=f, note=None if r else '靠近 NPC 后屏幕上没有任何“对话”按钮（#actbtn/#talkbtn 不存在）')
        # ---- T4 NPC 闲逛：5–6 格外点身体 ----
        if want('T4'):
            rows = []; st = await npcs(c); ids = [x['id'] for x in st['npcs'] if x['kind'] == 'npc']; t4 = time.time()
            for k in range(T4_N):
                if time.time() - t4 > T4_BUDGET: rows.append(dict(npc=ids[k % len(ids)], result='timeout(budget)')); continue
                nid = ids[k % len(ids)]; st = await npcs(c); t = find(st, nid)
                if not t: rows.append(dict(npc=nid, result='npc missing')); continue
                ring = sorted([(di, dj) for di in range(-6, 7) for dj in range(-6, 7) if 5 <= math.hypot(di, dj) <= 6.2], key=lambda d: (-d[1], abs(d[0])))
                placed = False; tries = 0
                for di, dj in ring:   # 优先站在 NPC 南边（NPC 在画面上方，不被底部 UI 挡）
                    a, b = int(t['i']) + di, int(t['j']) + dj
                    if not await c.pg.evaluate(JS_WALK, [a, b]): continue
                    tries += 1
                    if await walk_to(c, a, b): placed = True; break
                    if tries >= 4: break
                if not placed: rows.append(dict(npc=t['name'], result='could not position (harness)')); continue
                await c.pg.wait_for_timeout(900); b0 = c.battles
                st = await npcs(c); t = find(st, nid); x, y = t['pts']['body']
                if not await free_point(c, x, y):
                    rows.append(dict(npc=t['name'], result='npc body covered by UI/joystick', tap=[round(x), round(y)])); continue
                d0 = t['dist']; await tap(c, x, y); o = await outcome(c, t['name'], 10)
                if o['result'] == 'battle': await shot(c, f'T4_{k}_battle_interrupt'); await ensure_map(c)
                else: await clear_popups(c, 8)
                rows.append(dict(npc=t['name'], dist=round(d0, 1), result=o['result']))
            okn = sum(r['result'] == 'npc' for r in rows)
            case('T4_wandering_npc_far_tap', okn == len(rows) == T4_N, passed=f'{okn}/{T4_N}',
                 fails=[r for r in rows if r['result'] != 'npc'])
        # ---- T5 空路径（需要开发者传送） ----
        if want('T5'):
            c5 = await new_page('#dev'); await new_life(c5); await ensure_map(c5)
            okd = await dev_tap(c5, '传送', '站到最近NPC旁'); await c5.pg.wait_for_timeout(500)
            st = await npcs(c5); t = st['npcs'][0] if st and st['npcs'] else None; res = None; f = await shot(c5, 'T5_setup')
            if t:
                x, y = t['pts']['body']; await tap(c5, x, y); o = await outcome(c5, t['name'], 5); res = o['result']
            case('T5_empty_path_edge', okd and res == 'npc', npc=t and t['name'], dist=t and round(t['dist'], 2), result=res, shot=f, cheats=c5.cheats)
            await c5.ctx.close()
        # ---- T10 ① 不带 #dev 时 #devbtn 不存在（主会话就是不带 #dev） ----
        if want('T10'):
            t10 = dict(no_devbtn_without_hash=not devbtn_title and not await c.pg.evaluate("()=>!!document.querySelector('#devbtn')"))
        # ---- T12 在线挂机 ----
        if want('T12'):
            T12_S = float(os.environ.get('T12_SECS', '150'))
            c12 = await new_page('#dev'); await new_life(c12); await ensure_map(c12)
            await dev_setup(c12, ('调试', '×5'))
            r2 = await tap_el(c12, '#afkbtn', None, 700); await tap_el(c12, '#modals .mwrap .opt', '开始挂机', 700)
            f = await shot(c12, 'T12_afk_on'); t0 = time.time(); outside = 0; samples = 0; kills = 0
            while time.time() - t0 < T12_S:
                await c12.pg.wait_for_timeout(1000); g = await gst(c12)
                if not g['afk'] or not g['afk']['on']: break
                b_ = g['afk']['box']; samples += 1; kills = g['afk']['kills']
                if R_ := g['p']:
                    if not (b_[0] - 1 <= R_[0] <= b_[2] + 2 and b_[1] - 1 <= R_[1] <= b_[3] + 2): outside += 1
                s_ = await scr(c12)
                if s_['opts'] and not s_['battle']:  # 挂机暂停等人选（年度事件）：像真人一样点第一个
                    await tap_el(c12, '#modals .mwrap .opt', s_['opts'][0], 500)
            f2 = await shot(c12, 'T12_afk_running')
            await tap_el(c12, '#afkstop23', None, 900); summ = None
            for _ in range(12):
                s_ = await scr(c12)
                if s_['title'] and '挂机' in s_['title']: summ = s_['text']; break
                if s_['battle']: await ensure_map(c12); continue
                if s_['opts']: await tap_el(c12, '#modals .mwrap .opt', s_['opts'][0], 500)
                else: await c12.pg.wait_for_timeout(500)
            f3 = await shot(c12, 'T12_afk_summary')
            case('T12_online_afk', bool(r2) and kills > 0 and outside == 0 and summ is not None, kills=kills, samples=samples, outside_box=outside, summary=summ, shots=[f, f2, f3], cheats=c12.cheats)
            await c12.ctx.close()
        case('info_recoveries_used', True, recoveries=getattr(c, 'recoveries', 0), battles=c.battles,
             note='T1–T4 期间因 N1（战斗后点按失效）回标题“继续人生”的次数')
        await c.ctx.close()

        # =============== T6：新人生，不按“过年”，只用追踪栏 + 点按 ===============
        if want('T6'):
            c = await new_page(); await new_life(c); t0 = time.time(); trail = []
            s = await scr(c); age0 = s['age']; f = await shot(c, 'T6_tracker')
            while time.time() - t0 < 60:
                s = await scr(c)
                if s['awakened'] and s['main'] == 'sect': break
                go = await rect(c, '#qt button, #qt [data-go], #qt .go', None)
                go = go if go and any(w in (go[2] or '') for w in ('前往', '寻路', '▶')) else None
                if go: await tap(c, go[0], go[1]); trail.append('tap 前往')
                else:
                    await tap_el(c, '#qt', None, 700); s2 = await scr(c)
                    g2 = await rect(c, '#modals button', '前往') or await rect(c, '#modals button', '寻路')
                    if g2: await tap(c, g2[0], g2[1]); trail.append('panel 前往')
                    else: trail.append(f'无“前往”按钮（追踪栏：{s["qt"]}）'); await clear_popups(c, 4); break
                o = await outcome(c, '', 15)
                if o['result'] == 'battle': await ensure_map(c); trail.append('battle')
                elif o['result'] != 'none' and o['result'] != 'none(walked)':
                    s3 = await scr(c); star = next((x for x in s3['opts'] if x.startswith('★')), None)
                    if star: await tap_el(c, '#modals .mwrap .opt', star, 700); trail.append('★')
                    await clear_popups(c, 10, prefer='伸手')
            s = await scr(c); f2 = await shot(c, 'T6_end')
            # 证据：剑仙是否在地图上（只读）
            st = await npcs(c); mentor_on_map = bool(st and find(st, 'mentor'))
            case('T6_prologue_ch1_by_tapping', s['awakened'] and s['main'] == 'sect' and s['age'] == age0, age=s['age'], main=s['main'],
                 awakened=s['awakened'], tracker=s['qt'], mentor_on_map=mentor_on_map, trail=trail[:12], shots=[f, f2], secs=round(time.time() - t0))
            await c.ctx.close()

        # =============== 开发者模式相关：T7 T8 T9 T10② T11 ===============
        if want('T10') or want('T7') or want('T8') or want('T9') or want('T11'):
            c = await new_page()
            r = await rect(c, '#title .ver'); before = await c.pg.evaluate("()=>localStorage.getItem('wbx2_dev')")
            if r:
                for _ in range(7): await tap(c, r[0], r[1], 40); await c.pg.wait_for_timeout(150)
            await c.pg.wait_for_timeout(600); after = await c.pg.evaluate("()=>localStorage.getItem('wbx2_dev')")
            f = await shot(c, 'T10_ver_7taps')
            await new_life(c); devbtn = await c.pg.evaluate("()=>!!document.querySelector('#devbtn')")
            if want('T10'):
                t10.update(ver_found=bool(r), wbx2_dev_after_7_taps=after, devbtn_in_game=devbtn, shot=f)
                case('T10_dev_mode_entry', t10['no_devbtn_without_hash'] and after == '1' and devbtn, **t10,
                     note=None if devbtn else '点版本号 7 次没有开启开发者模式；面板 Tab 断言无法进行')
            await c.ctx.close()
            async def market_setup():
                cx = await new_page('#dev'); await new_life(cx); await ensure_map(cx)
                ok = await dev_setup(cx, ('境界', '练气初期'), ('剧情', '坊市查账')); return cx, ok
            async def tap_main_go(cx):
                await tap_el(cx, '#qt .qbtn[data-q=main]', None, 700)
                s_ = await scr(cx)
                if any(o.startswith('前往') for o in s_['opts']): await tap_el(cx, '#modals .mwrap .opt', '前往', 300); return True
                return False
            if want('T7') or want('T8'):
                c7, okd = await market_setup(); g0 = await gst(c7); t0 = time.time()
                card = await tap_main_go(c7); who = None; f = await shot(c7, 'T7_after_confirm')
                while time.time() - t0 < 40:
                    s_ = await scr(c7)
                    if s_['battle']: await ensure_map(c7); continue
                    if s_['dlg']: who = s_['who']; break
                    await c7.pg.wait_for_timeout(250)
                g1 = await gst(c7); f2 = await shot(c7, 'T7_dialog')
                if want('T7'):
                    case('T7_cross_map_nav', okd and card and g1['map'] == 'market' and (who or '').startswith('钱多多') and g1['ap'] == g0['ap'] - 1,
                         map=g1['map'], who=who, ap=[g0['ap'], g1['ap']], secs=round(time.time() - t0), shots=[f, f2], cheats=c7.cheats)
                if want('T8'):
                    await clear_popups(c7, 8); await ensure_map(c7)
                    await dev_setup(c7, ('传送', '桃花村'))
                    await tap_main_go(c7); nav_on = False; t0 = time.time()
                    while time.time() - t0 < 15:   # 等它到坊市开始走
                        g = await gst(c7)
                        if g['map'] == 'market' and g['nav']: nav_on = True; break
                        await c7.pg.wait_for_timeout(200)
                    st = await npcs(c7); px, py = st['ps']; tapped = False
                    for dx, dy in ((0, 130), (120, 60), (-120, 60), (0, -130)):
                        if await free_point(c7, px + dx, py + dy): await tap(c7, px + dx, py + dy); tapped = True; break
                    await c7.pg.wait_for_timeout(500); g = await gst(c7); bar = await rect(c7, '#navbar'); f = await shot(c7, 'T8_cancel')
                    case('T8_cancel_nav', nav_on and tapped and g['nav'] is None and not bar, nav_before=nav_on, nav_after=g['nav'], navbar_visible=bool(bar), shot=f)
                await c7.ctx.close()
            if want('T9'):
                T9_S = float(os.environ.get('T9_SECS', '180'))
                c9, okd = await market_setup(); g0 = await gst(c9)
                await tap_el(c9, '#qt .qauto', None, 500); jumps = 0; last = g0; t0 = time.time(); waits = 0
                while time.time() - t0 < T9_S:
                    await c9.pg.wait_for_timeout(1000); g = await gst(c9)
                    if g['p'] and last['p'] and g['map'] == last['map']:
                        d = math.hypot(g['p'][0] - last['p'][0], g['p'][1] - last['p'][1])
                        if d > g['speed'] * g['ts'] * 1.0 * 1.5 + 0.5: jumps += 1
                    last = g
                    if g['main'] > g0['main']: break
                g1 = await gst(c9); f = await shot(c9, 'T9_end')
                case('T9_auto_quest_loop', okd and g1['main'] > g0['main'] and jumps == 0, main=[g0['main'], g1['main']], teleport_jumps=jumps, secs=round(time.time() - t0), shot=f, cheats=c9.cheats)
                await c9.ctx.close()
            if want('T11'):
                c11 = await new_page('#dev'); await new_life(c11); await ensure_map(c11); g0 = await gst(c11)
                yexp = await c11.pg.evaluate("()=>Game.yearExp()")   # 只读：公式用的年修为
                await dev_tap(c11, '调试', '离线模拟 +13'); await c11.pg.wait_for_timeout(1200); s_ = await scr(c11); g1 = await gst(c11)
                txt = await c11.pg.evaluate("()=>{const t=[...document.querySelectorAll('#modals .mwrap')].pop();return t?t.innerText:''}")
                f = await shot(c11, 'T11_offline_card')
                want_exp = round(yexp * 0.25 * (4 + 4 * 0.7 + 4 * 0.4))
                got = g1['exp'] - g0['exp'] if g1['realm'] == g0['realm'] and g1['stage'] == g0['stage'] else None
                import re as _re
                m_ = _re.search(r'应得 (\d+)', txt) or _re.search(r'修为 \+(\d+)', txt)
                exp_ok = bool(m_) and abs(int(m_.group(1)) - want_exp) <= max(1, want_exp * 0.01)
                await clear_popups(c11, 6)
                await dev_tap(c11, '调试', '离线模拟 -1'); await c11.pg.wait_for_timeout(1500); s2 = await scr(c11)
                neg_card = bool(s2['title'] and '闭关归来' in s2['title'])
                case('T11_offline_income', '闭关归来' in txt and '12' in txt and g1['age'] == g0['age'] and exp_ok and not neg_card,
                     card=txt[:120], exp_gain=got, formula=want_exp, age=[g0['age'], g1['age']], negative_time_card=neg_card, shot=f)
                await c11.ctx.close()
        await br.close()

    # =============== T13 回归 ===============
    if want('T13') and os.environ.get('HUMAN_OLAF_T13', '1') != '0':
        reg = {}
        for cmd in (['python3', 'test/controls.py'], ['python3', 'test/panels21.py'], ['python3', 'test/multilife.py', '1', '120'], ['node', 'test/validate22.js']):
            t0 = time.time()
            try:
                r = subprocess.run(cmd, cwd=os.path.join(HERE, '..'), capture_output=True, text=True, timeout=900)
                tail = (r.stdout + r.stderr).strip().splitlines()[-3:]; reg[' '.join(cmd)] = dict(rc=r.returncode, secs=round(time.time() - t0), tail=tail)
            except subprocess.TimeoutExpired: reg[' '.join(cmd)] = dict(rc='timeout')
        # controls.py 自己不以退出码报失败：解析它的 “FAILS n”
        def ok_of(k, v):
            if v.get('rc') != 0: return False
            if 'controls.py' in k: return any(l.startswith('FAILS 0') for l in v['tail'])
            return True
        case('T13_regression', all(ok_of(k, v) for k, v in reg.items()), runs=reg)
    srv.shutdown()
    fails = [x['case'] for x in cases if not x['ok']]
    json.dump(dict(dpr=DPR, www=ROOT, cases=cases, fails=fails, js_errors=errs), open(OUT + 'results.json', 'w'), ensure_ascii=False, indent=1)
    print(f'\n{len(cases) - len(fails)}/{len(cases)} cases passed; FAIL: {fails}; JS errors: {len(errs)}', errs[:5])
    return len(fails)

if __name__ == '__main__':
    sys.exit(min(asyncio.run(main()) or 0, 100))

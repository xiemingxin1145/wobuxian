# 3.4.2 点按回归（#27 N2 / #26 N1）：只用真实触摸（CDP touch，412×915）。
# 摆位（把 NPC/主角放到指定格、冻结闲逛）是测试前置，用 evaluate 写；点按与判定全部走真实触摸 + 读屏。
#  N2a 娘亲在「打坐」周围逐格摆放，点名字牌（含被任务栏 #qt 盖住、旁边站着讨债史莱姆的格）→ 必须打开娘亲对话
#  N2b 货郎在「古井」周围闲逛中，点 0.3 秒前名字牌所在位置 → 选中货郎（不走空）
#  N2c 任务栏下没有名字牌时，点任务栏仍打开「任务」面板
#  N1  （ONLY=N1 REPS=10）打完一场仗后点空地面 → 主角走动
import asyncio, os, sys, json, math
from playwright.async_api import async_playwright
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www')
URL = 'file://' + os.path.abspath(ROOT) + '/index.html'
VW, VH = 412, 915; ONLY = os.environ.get('ONLY', ''); REPS = int(os.environ.get('REPS', '1'))
def want(k): return not ONLY or k in ONLY.split(',')
async def main():
    res = {}; fails = []; errs = []
    def ok(k, cond, info=None):
        res[k] = {'ok': bool(cond), 'info': info}; print(k, 'PASS' if cond else 'FAIL', json.dumps(info, ensure_ascii=False)[:600], flush=True)
        if not cond: fails.append(k)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME', '/opt/google/chrome/chrome'), args=['--allow-file-access-from-files'])
        ctx = await b.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e))); cdp = await ctx.new_cdp_session(pg)
        async def tap(x, y):
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]}); await pg.wait_for_timeout(60)
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        async def tap_sel(sel, wait=400):
            r = await pg.evaluate("(s)=>{const e=[...document.querySelectorAll(s)].find(x=>x.getClientRects().length>0);if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}", sel)
            if not r: return False
            await tap(*r); await pg.wait_for_timeout(wait); return True
        async def scr():
            return await pg.evaluate("()=>{const top=[...document.querySelectorAll('#modals .mwrap')].filter(w=>!w.classList.contains('outm')).pop();return {modal:UI.stack.length,dlg:!!(top&&top.querySelector('.dlg')),who:top&&top.querySelector('.dn')?top.querySelector('.dn').textContent:null,title:top&&top.querySelector('.ph b')?top.querySelector('.ph b').textContent:null,battle:typeof B!=='undefined'&&B.on,inMap:UX.inMap(),path:R.player?(R.player.path||[]).length:0}}")
        async def settle(n=40):
            for k in range(n):
                s = await scr()
                if os.environ.get('DBG') and k>8: print('   settle', k, s, await pg.evaluate("()=>[...document.querySelectorAll('#modals .mwrap')].map(w=>w.className+':'+w.innerText.slice(0,200))"), flush=True)
                if s['inMap']: return True
                if s['battle']: await tap_sel('#battlebar button[data-a=auto]', 1500); continue
                safe = await pg.evaluate("()=>{const t=[...document.querySelectorAll('#modals .mwrap:last-child .opt')];const S=['离开','再见','算了','取消','不了','下次','先不','再想想','好','……'];const o=t.find(b=>S.some(w=>b.textContent.includes(w)))||t[t.length-1];if(!o)return null;const r=o.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]}")
                if await tap_sel('.mg33 .opt[data-k=ok]', 500): continue
                if await tap_sel('.gacha-fx .gclose', 400) or await tap_sel('#modals .mwrap:last-child .ph .x', 400): continue
                if safe: await tap(*safe); await pg.wait_for_timeout(400); continue
                await tap(206, 600); await pg.wait_for_timeout(400)
            return False
        async def outcome(name, wait_s=7):
            for k in range(int(wait_s / 0.15)):
                await pg.wait_for_timeout(150); s = await scr()
                if s['battle'] or s['modal']: break
            if s['battle']: return 'battle'
            if s['dlg']: return 'npc' if (s['who'] or '').startswith(name) else 'other:' + str(s['who'])
            if s['modal']: return 'card:' + str(s['title'])
            return 'none'
        # 开局
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        await pg.tap('text=开始新人生'); await pg.wait_for_timeout(400); await pg.tap('#nx'); await pg.wait_for_timeout(200)
        for k in range(3): await pg.locator('.talb').nth(k).tap()
        for k in range(3): await pg.tap('#nx'); await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(2500); await settle()
        PLACE = """([nid,ml,di,dj,freeze])=>{const e=R.ents.find(x=>x.id===nid);const m=R.marks.find(x=>x.label===ml);if(!e||!m)return null;
          const P=R.player;P.path=[];P.chase=null;if(Math.hypot(P.i-m.i,P.j-m.j)>5){const [si,sj]=nearestWalk(m.i,m.j+4);P.i=si+.5;P.j=sj+.5;}
          const i=m.i+di,j=m.j+dj;if(!walkable(i,j))return null;e.i=i+.5;e.j=j+.5;e.path=[];e._trail=[];if(freeze){e.wt=1e9;e.talking=0;}
          for(const o of R.ents){if(o.kind==='mon'){o.wt=1e9;o.path=[];if(Math.hypot(o.i-e.i,o.j-e.j)<6||Math.hypot(o.i-P.i,o.j-P.j)<6){o.i=-60;o.j=-60;}}if(o.kind==='npc'&&o!==e&&o.id!=='debt_slime'&&Math.hypot(o.i-e.i,o.j-e.j)<4){o.i=-40;o.j=-40;o.path=[];o.wt=1e9;}}
          const [x,y]=t2p(e.i,e.j);const b=spriteBox(e.spr,e.s);const [sx,sy]=w2s(x,y-b.h-6-8);const cx=sx/R.dpr,cy=sy/R.dpr;
          if(cx<12||cx>400||cy<12||cy>900)return null;const el=document.elementFromPoint(cx,cy);
          const dom=el?(el.id==='cv'?'cv':el.closest('#qt')?(el.closest('.qbtn,.qauto')?'qtbtn':'qt'):'other'):'none';
          return {x:cx,y:cy,dom,name:e.label,slime:R.ents.some(o=>o.kind==='boss'&&!o.hidden&&Math.hypot(o.i-e.i,o.j-e.j)<2.2)}}"""
        if want('N2'):
            rows = []
            for di in range(-3, 4):
                for dj in range(-3, 4):
                    await settle(); await pg.wait_for_timeout(250)
                    t = await pg.evaluate(PLACE, ['mom', '打坐', di, dj, True])
                    if not t or t['dom'] not in ('cv', 'qt'): continue
                    for k in range(12):   # 镜头跟上（点位稳定）后再点
                        await pg.wait_for_timeout(200); t2 = await pg.evaluate(PLACE, ['mom', '打坐', di, dj, True])
                        if not t2: break
                        if abs(t2['x'] - t['x']) + abs(t2['y'] - t['y']) < 1: break
                        t = t2
                    t = t2
                    if not t or t['dom'] not in ('cv', 'qt'): continue
                    dbg = await pg.evaluate("([x,y])=>{const h=pickAt(x*R.dpr,y*R.dpr);const s=R.ents.find(o=>o.id==='shuoshu');const e=R.ents.find(o=>o.id==='mom');return {h:h.ent?h.ent.id:JSON.stringify(h),mom:[e.i,e.j],s:s&&[s.i,s.j,s.hidden],P:[R.player.i,R.player.j]}}", [t['x'], t['y']])
                    await tap(t['x'], t['y']); r = await outcome(t['name'])
                    if r != 'npc': print('   DBG', dbg, flush=True)
                    rows.append(dict(d=[di, dj], dom=t['dom'], slime=t['slime'], res=r)); print('  ', rows[-1], flush=True); await settle()
            # 名字牌被任务栏盖住：主角不动，找一格让娘亲名字牌落在 #qt 正文（非按钮）下
            await settle()
            q = await pg.evaluate("""()=>{const e=R.ents.find(x=>x.id==='mom');const P=R.player;P.path=[];const q=document.querySelector('#qt').getBoundingClientRect();
              for(let di=-12;di<=12;di++)for(let dj=-12;dj<=12;dj++){const i=Math.floor(P.i)+di,j=Math.floor(P.j)+dj;if(!walkable(i,j))continue;e.i=i+.5;e.j=j+.5;e.path=[];e.wt=1e9;
                const [x,y]=t2p(e.i,e.j);const b=spriteBox(e.spr,e.s);const [sx,sy]=w2s(x,y-b.h-6-8);const cx=sx/R.dpr,cy=sy/R.dpr;const el=document.elementFromPoint(cx,cy);
                if(el&&el.closest('#qt')&&!el.closest('.qbtn,.qauto')&&cx>q.left+6&&cx<q.right-6)return {x:cx,y:cy,name:e.label,d:[di,dj]};}return null}""")
            if q:
                await pg.wait_for_timeout(400); await tap(q['x'], q['y']); r = await outcome(q['name'])
                rows.append(dict(d=q['d'], dom='qt', slime=False, res=r)); print('  ', rows[-1], flush=True); await settle()
            ok('N2a_mom_name_tag', rows and all(r['res'] == 'npc' for r in rows) and any(r['dom'] == 'qt' for r in rows) and any(r['slime'] for r in rows),
               dict(n=len(rows), qt=sum(r['dom'] == 'qt' for r in rows), slime=sum(r['slime'] for r in rows), bad=[r for r in rows if r['res'] != 'npc']))
            rows = []
            for di, dj in [(-1, -1), (1, -1), (-1, 1), (0, -2), (1, 1), (-2, 0)]:
                await settle(); t = await pg.evaluate(PLACE, ['b34_peddler', '古井', di, dj, False])
                if not t or t['dom'] != 'cv': continue
                await pg.wait_for_timeout(300); t = await pg.evaluate(PLACE, ['b34_peddler', '古井', di, dj, False])
                if not t or t['dom'] != 'cv': continue
                # 让货郎开始走开（0.3 秒后点他刚才名字牌的位置）
                mv = await pg.evaluate("([di,dj])=>{const e=R.ents.find(x=>x.id==='b34_peddler');const m=R.marks.find(x=>x.label==='古井');for(const [a,c] of [[2,0],[-2,0],[0,2],[0,-2]]){if(walkable(Math.floor(e.i)+a,Math.floor(e.j)+c)){e.speed=1.2;moveTo(e,Math.floor(e.i)+a,Math.floor(e.j)+c);return true}}return false}", [di, dj])
                await pg.wait_for_timeout(300); await tap(t['x'], t['y']); r = await outcome(t['name'], 8)
                rows.append(dict(d=[di, dj], moving=mv, res=r)); await settle()
            ok('N2b_peddler_moving_name', rows and all(r['res'] == 'npc' for r in rows), rows)
            await settle(); await pg.evaluate("()=>{for(const e of R.ents)if(e.kind==='npc'||e.kind==='boss'){e.i=-50;e.j=-50;}}")
            await pg.wait_for_timeout(400); r = await pg.evaluate("()=>{const q=document.querySelector('#qt');const r=q.getBoundingClientRect();return [r.x+r.width/2,r.y+12]}")
            await tap(*r); await pg.wait_for_timeout(800); s = await scr()
            ok('N2c_qt_still_opens_quests', s['title'] == '任务', s)
        ok('no_js_errors', not errs, errs[:5])
        os.makedirs(os.path.join(os.path.dirname(__file__), 'results'), exist_ok=True)
        json.dump({'res': res, 'fails': fails}, open(os.path.join(os.path.dirname(__file__), 'results', 'tap342.json'), 'w'), ensure_ascii=False, indent=1)
        print('FAILS', fails); await b.close()
asyncio.run(main())

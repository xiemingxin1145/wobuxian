# NPC37 路遇真页面测试：python3 -B test/npc37_page.py，退出码 = 失败数
# 普通玩家（不开开发者模式）：新开一局，玩家走到熟人 NPC 身边 ≤2 格 → 自动弹「⚑ 路遇·」卡；选项全带「⚑ 」前缀，ux23 自动任务 AUTO.pick 不会代选；
# 结算后计 1 次、同图冷却内不再触发；自动任务开着时不触发；过年后 jh34.feed 有 npc37 新闻（本年 3–6 条）。
import asyncio, os, sys, threading, functools, http.server, socketserver
from playwright.async_api import async_playwright
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www'); PORT = int(os.environ.get('PORT', '8837'))
def serve():
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    socketserver.TCPServer.allow_reuse_address = True
    socketserver.ThreadingTCPServer(('127.0.0.1', PORT), functools.partial(Q, directory=ROOT)).serve_forever()
NEAR = """async(id)=>{ // 找当前图一个 TEXT37 熟人，把玩家放到它身边 1 格
  const e=R.ents.find(o=>o.kind==='npc'&&TEXT37.lines[o.id]&&(!id||o.id===id)); if(!e) return null;
  R.player.path=[]; R.player.i=e.i+1; R.player.j=e.j; return e.id }"""
async def main():
    threading.Thread(target=serve, daemon=True).start(); checks = []
    ck = lambda m, c: (checks.append((m, bool(c))), print(('PASS ' if c else 'FAIL ') + m))
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME', '/opt/google/chrome/chrome'), args=['--no-sandbox'])
        pg = await (await b.new_context(viewport={'width': 412, 'height': 915})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.goto(f'http://127.0.0.1:{PORT}/index.html'); await pg.wait_for_timeout(1500)
        await pg.evaluate("""async()=>{localStorage.removeItem('wbx2_dev');localStorage.removeItem('wbx2_save');Game.newLife({name:'路人',sex:'m',lg:LINGGEN[1].id,talents:[],st:{str:5,con:5,int:5,luck:5,wealth:5,charm:5}});}""")
        await pg.evaluate("document.body.classList.add('ingame');const t=document.getElementById('title');if(t)t.style.display='none'")
        await pg.wait_for_timeout(600)
        await pg.evaluate("async()=>{const ids=Object.keys(TEXT37.lines).filter(id=>NPCS[id]);for(const id of ids){const m=NPCS[id].map;if(m&&MAPINFO[m]){await Game.enterMap(m);if(R.ents.some(o=>o.kind==='npc'&&TEXT37.lines[o.id]))return m}}return null}")
        await pg.wait_for_timeout(1200)
        st = await pg.evaluate("()=>({dev:localStorage.getItem('wbx2_dev'),npc37:typeof NPC37,mode:R.mode,map:R.mapId,stack:UI.stack.length,ids:R.ents.filter(o=>o.kind==='npc'&&TEXT37.lines[o.id]).map(o=>o.id)})")
        ck(f'非开发者模式下 NPC37 已加载，当前图有熟人 {st}', st['dev'] is None and st['npc37'] == 'object' and st['mode'] == 'map' and st['ids'])
        # 先关掉开局弹窗
        for _ in range(10):
            if not await pg.evaluate("UI.stack.length"): break
            await pg.evaluate("(()=>{const t=UI.stack[UI.stack.length-1];const o=t&&t.querySelector('.opt');if(o)o.click();else{const x=t&&t.querySelector('.ph .x');x&&x.click()}})()"); await pg.wait_for_timeout(400)
        # 自动任务开着：不触发
        await pg.evaluate("AUTO.on='quest'"); nid = await pg.evaluate(NEAR); await pg.wait_for_timeout(1500)
        ck('自动任务开着时贴近熟人不触发路遇', await pg.evaluate("!document.querySelector('.card .ct') || ![...document.querySelectorAll('.card .ct')].some(x=>x.textContent.startsWith('⚑ 路遇'))") and await pg.evaluate("!(Game.G.npc37&&Game.G.npc37.yc.n)"))
        await pg.evaluate("AUTO.on=null"); nid = await pg.evaluate(NEAR, nid); await pg.wait_for_timeout(1500)
        t = await pg.evaluate("(()=>{const c=[...document.querySelectorAll('.ct')].map(x=>x.textContent).filter(s=>s.startsWith('⚑ 路遇'));return c[0]||null})()")
        ck(f'普通游玩：走到 {nid} 身边自动弹路遇卡：{t}', t and t.startswith('⚑ 路遇·'))
        opts = await pg.evaluate("[...UI.stack[UI.stack.length-1].querySelectorAll('.opt')].map(b=>b.textContent.trim())")
        ck(f'选项全带「⚑ 」前缀 {opts}', opts and all(o.startswith('⚑ ') for o in opts))
        await pg.evaluate("AUTO.on='quest'")
        ck('ux23 自动任务 AUTO.pick 对路遇卡返回 null（不代选）', await pg.evaluate("AUTO.pick(UI.stack[UI.stack.length-1])===null"))
        await pg.evaluate("AUTO.on='idle'")
        ck('挂机模式 AUTO.pick 同样不代选', await pg.evaluate("AUTO.pick(UI.stack[UI.stack.length-1])===null"))
        await pg.evaluate("AUTO.on=null")
        k = await pg.evaluate("[...UI.stack[UI.stack.length-1].querySelectorAll('.opt')].findIndex(b=>!b.textContent.includes('（缺）'))")
        await pg.evaluate(f"UI.stack[UI.stack.length-1].querySelectorAll('.opt')[{k}].click()"); await pg.wait_for_timeout(900)
        s = await pg.evaluate("({n:Game.G.npc37.yc.n,q:Game.G.npc37.q.length,open:[...document.querySelectorAll('.ct')].some(x=>x.textContent.startsWith('⚑ 路遇'))})")
        ck(f'选完后卡片关闭、计 1 次、队列清空 {s}', s['n'] == 1 and s['q'] == 0 and not s['open'])
        await pg.evaluate(NEAR); await pg.wait_for_timeout(1500)
        ck('同图冷却内再贴近不再触发', await pg.evaluate("Game.G.npc37.yc.n===1 && ![...document.querySelectorAll('.ct')].some(x=>x.textContent.startsWith('⚑ 路遇'))"))
        await pg.evaluate("()=>{window._ye37=0;Game.G.ap=0;Game.yearEnd().then(()=>{window._ye37=1},()=>{window._ye37=2})}")
        for _ in range(150):  # 过年会弹若干人生事件卡 / 可能开战：点第一个选项推进，战斗开托管
            if await pg.evaluate("window._ye37"): break
            await pg.evaluate("(()=>{if(B.on){B.speed=8;const ab=document.querySelector('#battlebar button[data-a=auto]');if(ab&&!B.auto)ab.click();}const t=UI.stack[UI.stack.length-1];if(!t)return;const o=t.querySelector('.opt');if(o)o.click();else{const x=t.querySelector('.ph .x');x&&x.click()}})()"); await pg.wait_for_timeout(400)
        y = await pg.evaluate("({done:window._ye37,yr:Game.G.npc37.yc.yr,gy:Life34.yr(),news:Game.G.npc37.yc.news,feed:Game.G.jh34.feed.filter(f=>f.k==='npc37').length,len:Game.G.jh34.feed.length})")
        ck(f'过年后本年 3–6 条 npc37 新闻写入 jh34.feed（≤40）{y}', y['done'] == 1 and y['yr'] == y['gy'] and 3 <= y['news'] <= 6 and y['feed'] >= 3 and y['len'] <= 40)
        # 第二十八轮：仇档「拔剑应战」（fight:1）真的进回合制战斗，打完回来结算胜负
        sc = await pg.evaluate("""()=>{const e=R.ents.find(o=>o.kind==='npc'&&TEXT37.lines[o.id]);if(!e)return null;Game.G.life34.rel[e.id]=-60;Game.G.hp=Game.stats().mhp;
          const sc=NPC37.onMeet(e.id,R.mapId,{k:0,force:true});if(!sc)return null;window._f37=null;window._b37=0;NPC37._busy=true;NPC37.play(sc).then(r=>{window._f37=r?(r.fight||'none'):'null';NPC37._busy=false});return {tier:sc.tier,t:sc.t}}""")
        ck(f'强制一次仇档路遇 {sc}', sc and sc['tier'] == 'chou')
        await pg.wait_for_timeout(500)
        await pg.evaluate("(()=>{const t=UI.stack[UI.stack.length-1];const o=t&&[...t.querySelectorAll('.opt')].find(b=>b.textContent.includes('拔剑应战'));o&&o.click()})()")
        for _ in range(200):
            if await pg.evaluate("window._f37"): break
            await pg.evaluate("(()=>{if(B.on){window._b37=1;B.speed=8;const ab=document.querySelector('#battlebar button[data-a=auto]');if(ab&&!B.auto)ab.click();return}const t=UI.stack[UI.stack.length-1];if(!t)return;const o=t.querySelector('.opt');if(o)o.click();else{const x=t.querySelector('.ph .x');x&&x.click()}})()"); await pg.wait_for_timeout(300)
        fr = await pg.evaluate("({f:window._f37,b:window._b37,on:B.on,mode:R.mode})")
        ck(f'选「拔剑应战」后进入真实战斗并带回胜负 {fr}', fr['b'] == 1 and fr['f'] in ('win', 'lose', 'flee') and not fr['on'])
        ck(f'无页面报错 {errs[:3]}', not errs)
        await b.close()
    f = sum(1 for _, c in checks if not c); print(f'{len(checks) - f}/{len(checks)} PASS'); sys.exit(f)
asyncio.run(main())

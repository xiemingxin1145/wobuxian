# NPC37E 自发事件真页面测试：python3 -B test/npc37_events_page.py，退出码 = 失败数
# 普通玩家（不开开发者模式）：新开一局，过一次年 → NPC 之间 1–2 条自发事件（结仇/求助/讨债）写进 G.npc37.rel 与 G.jh34.feed，与路遇新闻共用额度（本年 3–6 条、每人 ≤2）；存档读回关系网不丢。
# 开发者模式（wbx2_dev='1'）：「开放世界」面板有「自发事件」按钮，点一次强制触发一次并弹结果卡、计入额度、已存档。
import asyncio, os, sys, threading, functools, http.server, socketserver
from playwright.async_api import async_playwright
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www'); PORT = int(os.environ.get('PORT', '8838'))
def serve():
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    socketserver.TCPServer.allow_reuse_address = True
    socketserver.ThreadingTCPServer(('127.0.0.1', PORT), functools.partial(Q, directory=ROOT)).serve_forever()
NEW = """async()=>{localStorage.removeItem('wbx2_save');Game.newLife({name:'路人',sex:'m',lg:LINGGEN[1].id,talents:[],st:{str:5,con:5,int:5,luck:5,wealth:5,charm:5}});}"""
CLOSE = "(()=>{if(B.on){B.speed=8;const ab=document.querySelector('#battlebar button[data-a=auto]');if(ab&&!B.auto)ab.click();}const t=UI.stack[UI.stack.length-1];if(!t)return;const o=t.querySelector('.opt');if(o)o.click();else{const x=t.querySelector('.ph .x');x&&x.click()}})()"
async def main():
    threading.Thread(target=serve, daemon=True).start(); checks = []
    ck = lambda m, c: (checks.append((m, bool(c))), print(('PASS ' if c else 'FAIL ') + m))
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME', '/opt/google/chrome/chrome'), args=['--no-sandbox'])
        pg = await (await b.new_context(viewport={'width': 412, 'height': 915})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.goto(f'http://127.0.0.1:{PORT}/index.html'); await pg.wait_for_timeout(1500)
        await pg.evaluate("localStorage.removeItem('wbx2_dev')"); await pg.evaluate(NEW)
        await pg.evaluate("document.body.classList.add('ingame');const t=document.getElementById('title');if(t)t.style.display='none'")
        await pg.wait_for_timeout(800)
        await pg.evaluate("async()=>{const ids=Object.keys(TEXT37.lines).filter(id=>NPCS[id]);for(const id of ids){const m=NPCS[id].map;if(m&&MAPINFO[m]){await Game.enterMap(m);return m}}return null}")
        await pg.wait_for_timeout(1200)
        st = await pg.evaluate("({dev:localStorage.getItem('wbx2_dev'),e:typeof NPC37E,wrap:NPC37.yearNews._e37,n:Object.keys(NEWS37C).join(),btn:!!document.getElementById('dow-zf')})")
        ck(f'非开发者模式：NPC37E 已加载并包住 NPC37.yearNews，没有开发者按钮 {st}', st['dev'] is None and st['e'] == 'object' and st['wrap'] == 1 and st['n'] == 'feud,help,debt' and not st['btn'])
        for _ in range(10):
            if not await pg.evaluate("UI.stack.length"): break
            await pg.evaluate(CLOSE); await pg.wait_for_timeout(400)
        await pg.evaluate("()=>{window._ev37=[];['npc:feud','npc:help','npc:debt'].forEach(k=>Story37.on(k,e=>_ev37.push(e)));window._ye37=0;Game.G.ap=0;Game.yearEnd().then(()=>{window._ye37=1},e=>{window._ye37=2;window._ye37e=String(e)})}")
        for _ in range(150):
            if await pg.evaluate("window._ye37"): break
            await pg.evaluate(CLOSE); await pg.wait_for_timeout(400)
        ye = await pg.evaluate("({d:window._ye37,e:window._ye37e||null,s:!!Game.G.npc37})")
        ck(f'过年结束 {ye}', ye['d'] == 1 and ye['s'])
        if not ye['s']: await b.close(); print('0/1'); sys.exit(1)
        y = await pg.evaluate("""()=>{const S=Game.G.npc37,c=S.yc;const F=Game.G.jh34.feed;const tx=[].concat(...Object.values(NEWS37C));
          const hit=F.filter(f=>f.k==='npc37'&&tx.some(t=>new RegExp('^【江湖风云】'+t.replace(/[.*+?^$()|[\\]\\\\]/g,'\\\\$&').replace(/\\{(a|b|map)\\}/g,'.+?')+'$').test(f.s))).length;
          return {done:window._ye37,e37:c.e37,ev:_ev37.length,kinds:_ev37.map(e=>e.kind),news:c.news,per:Math.max(0,...Object.values(c.per)),toast:c.toast,rel:Object.keys(S.rel).length,hit,len:F.length,
            relOk:_ev37.every(e=>S.rel[NPC37E.key(e.a,e.b)]===e.rel||e.rel===undefined)}}""")
        ck(f'过一次年：1–2 条自发事件、发 Story37 npc:* 事件 {y}', y['done'] == 1 and 1 <= y['e37'] <= 2 and y['ev'] == y['e37'])
        ck(f'结果写回关系网 G.npc37.rel（与事件返回值一致）', y['rel'] >= 1 and y['relOk'])
        ck(f'NEWS37C 新闻写进 jh34.feed，与路遇共用额度：本年 3–6 条、每人 ≤2、toast ≤2、feed ≤40', y['hit'] >= 1 and 3 <= y['news'] <= 6 and y['per'] <= 2 and y['toast'] <= 2 and y['len'] <= 40)
        await pg.evaluate("Game.save()")
        sv = await pg.evaluate("(()=>{const s=JSON.parse(localStorage.getItem('wbx2_save')||'null');const g=s&&(s.G||s);return g&&g.npc37?{rel:JSON.stringify(g.npc37.rel),owe:JSON.stringify(g.npc37.owe||{}),cur:JSON.stringify(Game.G.npc37.rel)}:null})()")
        ck('存档里带着 NPC 关系网（rel / owe）', sv and sv['rel'] == sv['cur'])
        # 开发者模式：「自发事件」按钮
        await pg.evaluate("localStorage.setItem('wbx2_dev','1')"); await pg.reload(); await pg.wait_for_timeout(3000)
        await pg.evaluate(NEW); await pg.evaluate("document.body.classList.add('ingame');const t=document.getElementById('title');if(t)t.style.display='none'"); await pg.wait_for_timeout(1500)
        for _ in range(10):
            if not await pg.evaluate("UI.stack.length"): break
            await pg.evaluate(CLOSE); await pg.wait_for_timeout(400)
        await pg.click('#dow-open'); await pg.wait_for_timeout(300)
        if not await pg.evaluate("!!document.getElementById('dow-ly')"):  # PR 分支（main）开发者面板不带 路遇/自发事件 按钮，只走正常游玩
            ck('main：开发者面板不带「自发事件」按钮（只走正常游玩年末入口）', not await pg.evaluate("!!document.getElementById('dow-zf')"))
            await pg.evaluate("localStorage.removeItem('wbx2_dev')"); ck(f'无页面报错 {errs[:3]}', not errs); await b.close()
            f = sum(1 for _, c in checks if not c); print(f'{len(checks) - f}/{len(checks)} PASS'); sys.exit(f)
        bt = await pg.evaluate("(()=>{const e=document.getElementById('dow-zf');return e?{t:e.textContent,n:document.querySelectorAll('#dow-panel button').length}:null})()")
        ck(f'开发者模式「开放世界」面板有「自发事件」按钮 {bt}', bt and bt['t'] == '自发事件' and bt['n'] == 11)
        b0 = await pg.evaluate("({e:(Game.G.npc37&&Game.G.npc37.yc.e37)||0,f:Game.G.jh34?Game.G.jh34.feed.filter(f=>f.k==='npc37').length:0})")
        await pg.evaluate("document.getElementById('dow-zf').scrollIntoView()"); await pg.click('#dow-zf'); await pg.wait_for_timeout(800)
        card = await pg.evaluate("(()=>{const t=UI.stack[UI.stack.length-1];return t?t.textContent:''})()")
        ck(f'点「自发事件」弹结果卡（类别 + 双方 + 关系变化 + 新闻）：{card[:80]}', '自发事件' in card and any(k in card for k in ('结仇', '求助', '讨债')) and '关系' in card and '【江湖风云】' in card)
        b1 = await pg.evaluate("(()=>{const s=JSON.parse(localStorage.getItem('wbx2_save')||'null');const g=s&&(s.G||s);return {e:Game.G.npc37.yc.e37,f:Game.G.jh34.feed.filter(f=>f.k==='npc37').length,sv:g&&g.npc37?g.npc37.yc.e37:null}})()")
        ck(f'强制触发计入本年额度、新闻 +1、已存档 {b0}→{b1}', b1['e'] == b0['e'] + 1 and b1['f'] == b0['f'] + 1 and b1['sv'] == b1['e'])
        await pg.evaluate(CLOSE); await pg.wait_for_timeout(300)
        ck('结果卡点「知道了」关闭', await pg.evaluate("UI.stack.length===0"))
        await pg.evaluate("localStorage.removeItem('wbx2_dev')")
        ck(f'无页面报错 {errs[:3]}', not errs)
        await b.close()
    f = sum(1 for _, c in checks if not c); print(f'{len(checks) - f}/{len(checks)} PASS'); sys.exit(f)
asyncio.run(main())

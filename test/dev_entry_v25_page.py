# v2.5 开发者入口真页面冒烟（诊断用，非点按门禁；evaluate 只用于建档/读状态）：python3 -B test/dev_entry_v25_page.py，退出码=失败数
# 覆盖：#dev 出现按钮；「全套神装」确认后真的穿上 5 件；「试炼场」取消 → 阶段3 债务奇遇卡片真的弹出并能点完、改债务/好感/存档；
#      「试炼场」确认 → 覆盖层 iframe，Escape 关闭。
import asyncio, os, sys, json, threading, functools, http.server, socketserver
from playwright.async_api import async_playwright
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www'); PORT = int(os.environ.get('PORT', '8812'))
def serve():
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    socketserver.TCPServer.allow_reuse_address = True
    socketserver.ThreadingTCPServer(('127.0.0.1', PORT), functools.partial(Q, directory=ROOT)).serve_forever()
async def main():
    threading.Thread(target=serve, daemon=True).start(); errs = []; checks = []
    ck = lambda m, c: checks.append((m, bool(c)))
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME', '/opt/google/chrome/chrome'), args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 412, 'height': 915})
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        pg.on('console', lambda m: m.type == 'error' and '404' not in m.text and errs.append(m.text[:300]))
        dialog = {'accept': True, 'seen': []}
        async def on_dialog(d):
            dialog['seen'].append(d.message[:20])
            await (d.accept() if dialog['accept'] else d.dismiss())
        pg.on('dialog', lambda d: asyncio.ensure_future(on_dialog(d)))
        await pg.goto(f'http://127.0.0.1:{PORT}/index.html#dev'); await pg.wait_for_timeout(3500)
        await pg.evaluate("""()=>{localStorage.removeItem('wbx2_save');Game.newLife({name:'测试',sex:'m',lg:LINGGEN[1].id,talents:[],st:{str:5,con:5,int:5,luck:5,wealth:5,charm:5}});
          const G=Game.G;G.debt=8888;G.stone=500;G.aff=G.aff||{};delete G.aff.debtor_family;G.flags=G.flags||{};delete G.flags.bounty;Game.save&&Game.save();}""")
        await pg.wait_for_timeout(600)
        ck('#dev 出现 试炼场/全套神装/即时战 三个按钮', await pg.evaluate("['v25-entry','v25-eq','v25-rt'].every(id=>!!document.getElementById(id))"))
        # 1. 全套神装
        dialog['accept'] = True
        await pg.click('#v25-eq'); await pg.wait_for_timeout(500)
        eq = await pg.evaluate("(()=>{const G=Game.G;const s=['weapon','armor','acc1','acc2','treasure'];return s.filter(k=>G.eq[k]&&String(G.eq[k]).startsWith('dev_')).length})()")
        ck('全套神装：确认后 5 个槽位都穿上 dev 神装', eq == 5)
        # 2. 试炼场 → 取消 → 阶段3 债务奇遇
        dialog['accept'] = False
        await pg.click('#v25-entry')
        try:
            await pg.wait_for_selector('.card .ct:text("债主之家")', timeout=3000); opened = True
        except Exception: opened = False
        ck('试炼场取消 → 阶段3「债主之家」卡片真的弹出', opened)
        if opened:
            txt = await pg.inner_text('.card')
            ck('卡片显示债务 8888 / 态度 敌意', '8888' in txt and '敌意' in txt)
            await pg.click('.card .opt[data-k="0"]')  # 赖账
            await pg.wait_for_selector('.card .ct:text("奇遇结果")', timeout=3000)
            await pg.click('.card .opt[data-k="0"]'); await pg.wait_for_timeout(400)
            st = await pg.evaluate("({debt:Game.G.debt,aff:Game.G.aff.debtor_family,saved:JSON.parse(localStorage.getItem('wbx2_save')||'{}').debt})")
            ck('选「赖账」→ 债务 ×1.2 = 10666、好感钳到 0、已存档', st['debt'] == 10666 and st['aff'] == 0 and st['saved'] == 10666)
        # 3. 试炼场 → 确认 → 覆盖层，Escape 关闭
        dialog['accept'] = True
        await pg.click('#v25-entry'); await pg.wait_for_timeout(500)
        ov = await pg.evaluate("!!document.querySelector('#v25-encounter-overlay iframe')")
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        ov2 = await pg.evaluate("!!document.getElementById('v25-encounter-overlay')")
        ck('试炼场确认 → 覆盖层 iframe，Escape 关闭', ov and not ov2)
        ck('无 JS 错误', not errs)
        await b.close()
    for m, c in checks: print(('PASS ' if c else 'FAIL ') + m)
    print(json.dumps({'dialogs': dialog['seen'], 'errs': errs}, ensure_ascii=False))
    sys.exit(sum(1 for _, c in checks if not c))
asyncio.run(main())

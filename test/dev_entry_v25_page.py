# v2.5 开发者入口真页面冒烟（诊断用，非点按门禁；evaluate 只用于建档/读状态）：python3 -B test/dev_entry_v25_page.py，退出码=失败数
# 覆盖：#dev 出现按钮；「奇遇链」钱多多两步闭环并接上讨债追兵；「查账链」记账童子贿赂露馅；「全套神装」确认后真的穿上 5 件；「试炼场」取消 → 阶段3 债务奇遇卡片真的弹出并能点完、改债务/好感/存档；
#      「试炼场」确认 → 覆盖层 iframe，Escape 关闭；「追兵战」按债压档位刷讨债鬼进即时战，打完按胜负结算（中途关掉不结算）。
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
        boxes = await pg.evaluate("['v25-entry','v25-eq','v25-rt','v25-qy','v25-qy2','v25-zb'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return [r.top,r.bottom]})")
        ck('六个开发者按钮互不重叠且都在屏内（可点）', all(boxes[i][1] <= boxes[j][0] or boxes[j][1] <= boxes[i][0] for i in range(6) for j in range(i+1, 6)) and all(b[0] >= 0 for b in boxes))
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
        # 2b. 奇遇链（钱多多）：举报 → 记仇 → 回访卖行踪 +10% 挂追兵 → 试炼场取消弹「讨债追兵」（真页面闭环）
        async def card_click(title, k):
            c = pg.locator(f'.card:has(.ct:text("{title}"))').last
            await c.wait_for(timeout=3000); await c.locator(f'.opt[data-k="{k}"]').click()
        ck('#dev 出现「奇遇链」按钮', await pg.evaluate("!!document.getElementById('v25-qy')"))
        b0 = await pg.evaluate("({debt:Game.G.debt,aff:(Game.G.aff.merchant||0)})")
        try:
            await pg.click('#v25-qy'); await card_click('钱多多的赊账单', 1); await card_click('奇遇结果', 0); await pg.wait_for_timeout(300)
            s1 = await pg.evaluate("({debt:Game.G.debt,aff:Game.G.aff.merchant,step:Game.G.flags.s3m_step})")
            ck('奇遇链第 1 步：举报 → 债务 -200、钱多多好感 -40、记下 s3m_step', s1['debt'] == b0['debt'] - 200 and s1['aff'] == max(0, b0['aff'] - 40) and s1['step'] == 1)
            await pg.click('#v25-qy'); await card_click('钱多多回访', 0)
            res = pg.locator('.card:has(.ct:text("奇遇结果"))').last
            await res.wait_for(timeout=3000)
            vtxt = await res.inner_text()
            await res.locator('.opt[data-k="0"]').click(); await pg.wait_for_timeout(300)
            s2 = await pg.evaluate("({debt:Game.G.debt,bounty:Game.G.flags.bounty,done:Game.G.flags.s3m_done,saved:JSON.parse(localStorage.getItem('wbx2_save')||'{}').debt})")
            exp = s1['debt'] + round(max(s1['debt'], 100) * 0.1)
            ck('奇遇链第 2 步（记仇）：欠款 +10%、挂讨债追兵、已存档', s2['debt'] == exp and s2['bounty'] == 1 and s2['done'] == 1 and s2['saved'] == exp and '讨债司' in vtxt)
            dialog['accept'] = False
            await pg.click('#v25-entry'); await card_click('讨债追兵', 2); await card_click('奇遇结果', 0); await pg.wait_for_timeout(300)
            ck('债务后果接上第 1 条链：试炼场取消 → 弹「讨债追兵」', True)
        except Exception as e:
            ck('奇遇链真页面流程（异常：' + str(e)[:80] + '）', False)
        # 2c. 查账链（记账童子）：贿赂 → 一般 → 查账露馅
        try:
            ck('#dev 出现「查账链」按钮', await pg.evaluate("!!document.getElementById('v25-qy2')"))
            await pg.evaluate("()=>{const G=Game.G;G.stone=1000;G.aff.xianguan=0;}")
            c0 = await pg.evaluate("({debt:Game.G.debt})")
            await pg.click('#v25-qy2'); await card_click('记账童子的错账', 1); await card_click('奇遇结果', 0); await pg.wait_for_timeout(300)
            c1 = await pg.evaluate("({debt:Game.G.debt,stone:Game.G.stone,aff:Game.G.aff.xianguan,step:Game.G.flags.s3x_step})")
            ck('查账链第 1 步：贿赂 → 灵石 -300、欠款 -1500、童子好感 20', c1['stone'] == 700 and c1['debt'] == c0['debt'] - 1500 and c1['aff'] == 20 and c1['step'] == 1)
            await pg.click('#v25-qy2'); await card_click('天道查账', 0)
            res = pg.locator('.card:has(.ct:text("奇遇结果"))').last; await res.wait_for(timeout=3000); rtxt = await res.inner_text()
            await res.locator('.opt[data-k="0"]').click(); await pg.wait_for_timeout(300)
            c2 = await pg.evaluate("({debt:Game.G.debt,done:Game.G.flags.s3x_done,saved:JSON.parse(localStorage.getItem('wbx2_save')||'{}').debt})")
            ck('查账链第 2 步：露馅补回 1650 并存档', c2['debt'] == c1['debt'] + 1650 and c2['done'] == 1 and c2['saved'] == c2['debt'] and '露馅' in rtxt)
        except Exception as e:
            ck('查账链真页面流程（异常：' + str(e)[:80] + '）', False)
        # 3. 试炼场 → 确认 → 覆盖层，Escape 关闭
        dialog['accept'] = True
        await pg.click('#v25-entry'); await pg.wait_for_timeout(500)
        ov = await pg.evaluate("!!document.querySelector('#v25-encounter-overlay iframe')")
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        ov2 = await pg.evaluate("!!document.getElementById('v25-encounter-overlay')")
        ck('试炼场确认 → 覆盖层 iframe，Escape 关闭', ov and not ov2)
        # 4. 追兵战（债务系统强化 #1）：重债 3 个讨债鬼；挂追兵加一档 4 个含头子；只读不改存档；Escape 关闭
        try:
            await pg.evaluate("()=>{const G=Game.G;G.debt=8888;delete G.flags.bounty;Game.save();}")
            before = await pg.evaluate("JSON.stringify(Game.G)")
            await pg.click('#v25-zb'); await pg.wait_for_timeout(800)
            z1 = await pg.evaluate("({ov:!!document.getElementById('rtp-overlay'),n:RealtimeBattle.state.enemies.length,label:RealtimeBattle.state.label,spr:RealtimeBattle.state.enemies.map(e=>e.spr)})")
            ck('追兵战：欠 8888 → 债压「重债」，3 个讨债鬼进即时战', z1['ov'] and z1['n'] == 3 and z1['label'] == '追兵·重债' and all(x == 'mon_collector' for x in z1['spr']))
            await pg.screenshot(path=os.environ.get('SHOT_ZB', '/tmp/dev_entry_zb.png'))
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
            after = await pg.evaluate("JSON.stringify(Game.G)")
            ck('追兵战关闭后覆盖层消失、存档 G 不变', not await pg.evaluate("!!document.getElementById('rtp-overlay')") and before == after)
            await pg.evaluate("()=>{Game.G.debt=30000;Game.G.flags.bounty=1;}")
            await pg.click('#v25-zb'); await pg.wait_for_timeout(500)
            z2 = await pg.evaluate("({n:RealtimeBattle.state.enemies.length,label:RealtimeBattle.state.label,boss:RealtimeBattle.state.enemies[0].name})")
            ck('欠 30000 且被通缉 → 「天道通缉」4 个、领头讨债鬼头子', z2['n'] == 4 and z2['label'] == '追兵·天道通缉' and z2['boss'] == '讨债鬼头子')
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        except Exception as e:
            ck('追兵战真页面流程（异常：' + str(e)[:80] + '）', False)
        # 5. 追兵战按胜负结算（债务系统强化 #2）：胜撤通缉、败加误工费，都存档；结算卡在覆盖层关掉后才弹
        try:
            await pg.evaluate("()=>{const G=Game.G;G.debt=30000;G.flags.bounty=1;G.flags.stage3_bountyDebt=30000;Game.save();}")
            await pg.click('#v25-zb'); await pg.wait_for_timeout(400)
            await pg.evaluate("()=>RealtimeBattle.state.enemies.forEach(e=>{e.hp=0;})")
            card = pg.locator('.card:has(.ct:text("追兵战结算"))').last; await card.wait_for(timeout=5000)
            wtxt = await card.inner_text()
            w = await pg.evaluate("({ov:!!document.getElementById('rtp-overlay'),debt:Game.G.debt,bounty:!!Game.G.flags.bounty,bd:'stage3_bountyDebt' in Game.G.flags,win:Game.G.flags.s3b_win,sv:JSON.parse(localStorage.getItem('wbx2_save')||'{}')})")
            ck('追兵战打赢（天道通缉）→ 结算卡在覆盖层关掉后弹出、撤掉通缉、欠款不变、已存档', not w['ov'] and not w['bounty'] and not w['bd'] and w['debt'] == 30000 and w['win'] == 1
               and not (w['sv'].get('flags') or {}).get('bounty') and w['sv'].get('debt') == 30000 and '通缉已撤销' in wtxt)
            await card.locator('.opt[data-k="0"]').click(); await pg.wait_for_timeout(300)
            await pg.evaluate("()=>{const G=Game.G;G.debt=8888;Game.save();}")
            await pg.click('#v25-zb'); await pg.wait_for_timeout(400)
            await pg.evaluate("()=>{RealtimeBattle.state.player.hp=0;}")
            card = pg.locator('.card:has(.ct:text("追兵战结算"))').last; await card.wait_for(timeout=5000)
            ltxt = await card.inner_text()
            l = await pg.evaluate("({debt:Game.G.debt,lose:Game.G.flags.s3b_lose,saved:JSON.parse(localStorage.getItem('wbx2_save')||'{}').debt})")
            ck('追兵战打输（重债）→ 误工费 889（10%）记进欠款并存档', l['debt'] == 8888 + 889 and l['saved'] == l['debt'] and l['lose'] == 1 and '误工费 889' in ltxt)
            await card.locator('.opt[data-k="0"]').click(); await pg.wait_for_timeout(300)
        except Exception as e:
            ck('追兵战结算真页面流程（异常：' + str(e)[:80] + '）', False)
        ck('无 JS 错误', not errs)
        await b.close()
    for m, c in checks: print(('PASS ' if c else 'FAIL ') + m)
    print(json.dumps({'dialogs': dialog['seen'], 'errs': errs}, ensure_ascii=False))
    sys.exit(sum(1 for _, c in checks if not c))
asyncio.run(main())

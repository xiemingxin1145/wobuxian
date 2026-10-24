# 开放世界开发者按钮真页面冒烟（原 dev_entry_v25_page.py；按钮已挪到 www/js/dev_openworld.js，经兜底入口「开放世界」面板点）（诊断用，非点按门禁；evaluate 只用于建档/读状态）：python3 -B test/dev_entry_v25_page.py，退出码=失败数
# 覆盖：wbx2_dev='1' 无 hash 重载后出现按钮；「奇遇链」钱多多两步闭环并接上讨债追兵；「查账链」记账童子贿赂露馅；「全套神装」确认后真的穿上 5 件；「试炼场」取消 → 阶段3 债务奇遇卡片真的弹出并能点完、改债务/好感/存档；
#      「试炼场」确认 → 覆盖层 iframe，Escape 关闭；「追兵战」按债压档位刷讨债鬼进即时战，打完按胜负结算（中途关掉不结算）；
#      「突破预估」按债压档位弹卡显示基础成功率 − 惩罚（只读，存档不变）；
#      追兵战按档位分化敌人（债务强化 #4）：重债/通缉档讨债鬼带快攻/散射参数、顶栏与结算卡标注特性，真页面齐射 2/3 发 vs 小账 1 发；
#      天道通缉头子专属招式（债务强化 #5）：只有头子带环弹参数，真页面前冲收招后放一圈 8 发环形弹，小账前冲不放；结算卡「头子：…」。
#      头子掉「讨债令」（债务强化 #6）：天道通缉打赢 → 结算卡「缴获讨债令×1（共 N 枚）」且 flags.s3b_token 已存档；重债打输/打赢都不含、计数不变。
#      讨债令冷却（债务强化 #9）：同一年再打赢被挡，卡片说明「今年已缴获过讨债令，明年再来」；次年才得第 2 枚。
#      追兵调参（债务强化 #7）：localStorage wbx_dev_bounty_tuning 写覆盖 → 追兵战敌人参数按合并表变化（越界被钳制）、「追兵调参」卡显示生效表与被覆盖字段；
#      坏 JSON / 非对象 → 回退默认并在卡片提示；清除覆盖后与默认逐字段一致；覆盖键不进存档。
#      追兵调参一键预设（债务强化 #8）：卡片点「预设·好躲/原样/地狱」→ 只写/删 wbx_dev_bounty_tuning，追兵战按预设变化，卡片标出当前预设；存档不变。
import asyncio, os, re, sys, json, threading, functools, http.server, socketserver
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
        # 开发者模式 = main 的持久开关 localStorage.wbx2_dev='1'，再无 hash 重载（模拟 APK 重启）
        await pg.goto(f'http://127.0.0.1:{PORT}/index.html'); await pg.evaluate("localStorage.setItem('wbx2_dev','1')")
        await pg.reload(); await pg.wait_for_timeout(3500)
        await pg.evaluate("""()=>{localStorage.removeItem('wbx2_save');Game.newLife({name:'测试',sex:'m',lg:LINGGEN[1].id,talents:[],st:{str:5,con:5,int:5,luck:5,wealth:5,charm:5}});
          const G=Game.G;G.debt=8888;G.stone=500;G.aff=G.aff||{};delete G.aff.debtor_family;G.flags=G.flags||{};delete G.flags.bounty;Game.save&&Game.save();}""")
        await pg.evaluate("document.body.classList.add('ingame');const t=document.getElementById('title');if(t)t.style.display='none'")  # main.js 离开标题页时加 ingame；本测试绕过标题直接 newLife。兜底入口与 main 的 v25 按钮一样只在游戏内显示
        await pg.wait_for_timeout(600)
        await pg.evaluate("localStorage.removeItem('wbx_dev_bounty_tuning')")
        await pg.click('#dow-open'); await pg.wait_for_timeout(300)
        ck('「开放世界」兜底入口打开面板，面板里有十一个按钮（第二十一轮加「讨债令」、第二十四轮加「路遇」、第三十轮加「自发事件」）', await pg.evaluate("document.getElementById('dow-panel').style.display==='flex' && document.querySelectorAll('#dow-panel button').length===11"))
        boxes = await pg.evaluate("""()=>{const q=[...document.querySelectorAll('#v25-entry,#v25-eq,#v25-rt,#dow-open')].concat([...document.querySelectorAll('#dow-panel button')]);return q.map(e=>{const r=e.getBoundingClientRect();return [r.top,r.bottom,r.left,r.right]})}""")
        ck('main 三个开发者按钮 + 「开放世界」入口 + 面板十一个按钮（含「突破预估」「讨债令」「追兵调参」「路遇」「自发事件」）互不重叠且都在屏内（可点）', len(boxes) == 15 and all(boxes[i][1] <= boxes[j][0] or boxes[j][1] <= boxes[i][0] for i in range(15) for j in range(i+1, 15)) and all(b[0] >= 0 and b[1] <= 915 and b[2] >= 0 and b[3] <= 412 for b in boxes))
        ck('wbx2_dev=1 出现 试炼场/全套神装/即时战 三个按钮', await pg.evaluate("['dow-entry','dow-eq','dow-rt'].every(id=>!!document.getElementById(id))"))
        # 1. 全套神装
        dialog['accept'] = True
        await pg.click('#dow-eq'); await pg.wait_for_timeout(500)
        eq = await pg.evaluate("(()=>{const G=Game.G;const s=['weapon','armor','acc1','acc2','treasure'];return s.filter(k=>G.eq[k]&&String(G.eq[k]).startsWith('dev_')).length})()")
        ck('全套神装：确认后 5 个槽位都穿上 dev 神装', eq == 5)
        # 2. 试炼场 → 取消 → 阶段3 债务奇遇
        dialog['accept'] = False
        await pg.click('#dow-entry')
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
        ck('wbx2_dev=1 出现「奇遇链」按钮', await pg.evaluate("!!document.getElementById('dow-qy')"))
        b0 = await pg.evaluate("({debt:Game.G.debt,aff:(Game.G.aff.merchant||0),rel:(((Game.G.life34&&Game.G.life34.rel)||{}).merchant||0)})")
        try:
            await pg.click('#dow-qy'); await card_click('钱多多的赊账单', 1); await card_click('奇遇结果', 0); await pg.wait_for_timeout(300)
            s1 = await pg.evaluate("({debt:Game.G.debt,aff:Game.G.aff.merchant,step:Game.G.flags.s3m_step})")
            ck('奇遇链第 1 步：举报 → 债务 -200、钱多多好感 -40、记下 s3m_step', s1['debt'] == b0['debt'] - 200 and s1['aff'] == max(0, b0['aff'] - 40) and s1['step'] == 1)
            # 第十二轮：举报 = 记仇选项 → main 的 Life34.rel('merchant', -20)（真页面里 life34.js 已加载；只读检查 G.life34.rel 与存档）
            r1 = await pg.evaluate("({rel:(((Game.G.life34&&Game.G.life34.rel)||{}).merchant),sv:((JSON.parse(localStorage.getItem('wbx2_save')||'{}').life34||{}).rel||{}).merchant,sect:JSON.stringify(Game.G.sectRel||null)})")
            # 第十三轮：总变化 = -20（main 的好感同步 trunc(Δaff×0.5) + 补差额，不重复计）
            ck(f'举报 → L.rel 恩怨 merchant 总变化 {b0["rel"]}→{r1["rel"]}（恰好 -20：好感 {b0["aff"]}→{s1["aff"]} 的同步 + 补差额，不重复计）并已存档', r1['rel'] == max(-100, b0['rel'] - 20) and r1['sv'] == r1['rel'])
            await pg.click('#dow-qy'); await card_click('钱多多回访', 0)
            res = pg.locator('.card:has(.ct:text("奇遇结果"))').last
            await res.wait_for(timeout=3000)
            vtxt = await res.inner_text()
            await res.locator('.opt[data-k="0"]').click(); await pg.wait_for_timeout(300)
            s2 = await pg.evaluate("({debt:Game.G.debt,bounty:Game.G.flags.bounty,done:Game.G.flags.s3m_done,saved:JSON.parse(localStorage.getItem('wbx2_save')||'{}').debt})")
            exp = s1['debt'] + round(max(s1['debt'], 100) * 0.1)
            ck('奇遇链第 2 步（记仇）：欠款 +10%、挂讨债追兵、已存档', s2['debt'] == exp and s2['bounty'] == 1 and s2['done'] == 1 and s2['saved'] == exp and '讨债司' in vtxt)
            dialog['accept'] = False
            await pg.click('#dow-entry'); await card_click('讨债追兵', 2); await card_click('奇遇结果', 0); await pg.wait_for_timeout(300)
            ck('债务后果接上第 1 条链：试炼场取消 → 弹「讨债追兵」', True)
        except Exception as e:
            ck('奇遇链真页面流程（异常：' + str(e)[:80] + '）', False)
        # 2c. 查账链（记账童子）：贿赂 → 一般 → 查账露馅
        try:
            ck('wbx2_dev=1 出现「查账链」按钮', await pg.evaluate("!!document.getElementById('dow-qy2')"))
            await pg.evaluate("()=>{const G=Game.G;G.stone=1000;G.aff.xianguan=0;}")
            c0 = await pg.evaluate("({debt:Game.G.debt,rel:(((Game.G.life34&&Game.G.life34.rel)||{}).xianguan||0),sect:JSON.stringify(Game.G.sectRel||null)})")
            await pg.click('#dow-qy2'); await card_click('记账童子的错账', 1); await card_click('奇遇结果', 0); await pg.wait_for_timeout(300)
            c1 = await pg.evaluate("({debt:Game.G.debt,stone:Game.G.stone,aff:Game.G.aff.xianguan,step:Game.G.flags.s3x_step,rel:(((Game.G.life34&&Game.G.life34.rel)||{}).xianguan||0)})")
            ck(f'贿赂（好感 0→20）→ L.rel xianguan {c0["rel"]}→{c1["rel"]}（只有 main 同步那份 +10）', c1['rel'] == min(100, c0['rel'] + 10))
            ck('查账链第 1 步：贿赂 → 灵石 -300、欠款 -1500、童子好感 20', c1['stone'] == 700 and c1['debt'] == c0['debt'] - 1500 and c1['aff'] == 20 and c1['step'] == 1)
            await pg.click('#dow-qy2'); await card_click('天道查账', 0)
            res = pg.locator('.card:has(.ct:text("奇遇结果"))').last; await res.wait_for(timeout=3000); rtxt = await res.inner_text()
            await res.locator('.opt[data-k="0"]').click(); await pg.wait_for_timeout(300)
            c2 = await pg.evaluate("({debt:Game.G.debt,done:Game.G.flags.s3x_done,saved:JSON.parse(localStorage.getItem('wbx2_save')||'{}').debt})")
            ck('查账链第 2 步：露馅补回 1650 并存档', c2['debt'] == c1['debt'] + 1650 and c2['done'] == 1 and c2['saved'] == c2['debt'] and '露馅' in rtxt)
            c3 = await pg.evaluate("({rel:(((Game.G.life34&&Game.G.life34.rel)||{}).xianguan),sv:((JSON.parse(localStorage.getItem('wbx2_save')||'{}').life34||{}).rel||{}).xianguan,sect:JSON.stringify(Game.G.sectRel||null)})")
            ck(f'贿赂露馅这一步 → L.rel 恩怨 xianguan {c1["rel"]}→{c3["rel"]}（恰好 -15）并已存档、结果卡写明、G.sectRel 不变', c3['rel'] == max(-100, c1['rel'] - 15) and c3['sv'] == c3['rel'] and '恩怨 -15' in rtxt and c3['sect'] == c0['sect'])
        except Exception as e:
            ck('查账链真页面流程（异常：' + str(e)[:80] + '）', False)
        # 2d. 第十五轮：对账（好感 +60）→ L.rel 总变化封顶 +20（参考 qc34 每步 +15；不再是同步出的 +30），第 2 步仍按亲近结算
        try:
            await pg.evaluate("()=>{const G=Game.G;G.aff.xianguan=0;delete G.flags.s3x_step;delete G.flags.s3x_bribe;G.debt=5000;Game.save();}")
            d0 = await pg.evaluate("({rel:(((Game.G.life34&&Game.G.life34.rel)||{}).xianguan||0)})")
            await pg.click('#dow-qy2'); await card_click('记账童子的错账', 0)
            res = pg.locator('.card:has(.ct:text("奇遇结果"))').last; await res.wait_for(timeout=3000); htxt = await res.inner_text()
            await res.locator('.opt[data-k="0"]').click(); await pg.wait_for_timeout(300)
            d1 = await pg.evaluate("({aff:Game.G.aff.xianguan,rel:(((Game.G.life34&&Game.G.life34.rel)||{}).xianguan),sv:((JSON.parse(localStorage.getItem('wbx2_save')||'{}').life34||{}).rel||{}).xianguan})")
            ck(f'对账（好感 0→60）→ L.rel xianguan {d0["rel"]}→{d1["rel"]}（恰好 +20，封顶不再 +30）并已存档、结果卡写明「恩怨 +20」', d1['aff'] == 60 and d1['rel'] == min(100, d0['rel'] + 20) and d1['sv'] == d1['rel'] and '恩怨 +20' in htxt)
            await pg.click('#dow-qy2'); await card_click('天道查账', 0)
            res = pg.locator('.card:has(.ct:text("奇遇结果"))').last; await res.wait_for(timeout=3000)
            await res.locator('.opt[data-k="0"]').click(); await pg.wait_for_timeout(300)
            d2 = await pg.evaluate("({debt:Game.G.debt,rel:(((Game.G.life34&&Game.G.life34.rel)||{}).xianguan)})")
            ck('对账后查账仍按亲近：欠款 ×0.8（5000→4000），这一步 L.rel 不变', d2['debt'] == 4000 and d2['rel'] == d1['rel'])
        except Exception as e:
            ck('对账真页面流程（异常：' + str(e)[:80] + '）', False)
        # 3. 试炼场 → 确认 → 覆盖层，Escape 关闭
        dialog['accept'] = True
        await pg.click('#dow-entry'); await pg.wait_for_timeout(500)
        ov = await pg.evaluate("!!document.querySelector('#v25-encounter-overlay iframe')")
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        ov2 = await pg.evaluate("!!document.getElementById('v25-encounter-overlay')")
        ck('试炼场确认 → 覆盖层 iframe，Escape 关闭', ov and not ov2)
        # 4. 追兵战（债务系统强化 #1）：重债 3 个讨债鬼；挂追兵加一档 4 个含头子；只读不改存档；Escape 关闭
        try:
            await pg.evaluate("()=>{const G=Game.G;G.debt=8888;delete G.flags.bounty;Game.save();}")
            before = await pg.evaluate("JSON.stringify(Game.G)")
            await pg.click('#dow-zb'); await pg.wait_for_timeout(800)
            z1 = await pg.evaluate("({ov:!!document.getElementById('rtp-overlay'),n:RealtimeBattle.state.enemies.length,label:RealtimeBattle.state.label,spr:RealtimeBattle.state.enemies.map(e=>e.spr),tr:RealtimeBattle.state.enemies.map(e=>[e.atkCdMul,e.windMul,e.shotCount,e.shotSpread]),rs:RealtimeBattle.state.enemies.map(e=>e.ringShots)})")
            ck('追兵战：欠 8888 → 债压「重债」，3 个讨债鬼进即时战，顶栏「追兵·重债·快攻双发」', z1['ov'] and z1['n'] == 3 and z1['label'] == '追兵·重债·快攻双发' and all(x == 'mon_collector' for x in z1['spr']))
            ck('重债档讨债鬼带档位参数进原型：冷却×0.75、前摇×0.8、2 发/14°', all(t == [0.75, 0.8, 2, 14] for t in z1['tr']))
            ck('重债档 3 个讨债鬼都没有头子环弹（原型里 ringShots=0）', z1['rs'] == [0, 0, 0])
            await pg.screenshot(path=os.environ.get('SHOT_ZB', '/tmp/dev_entry_zb.png'))
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
            after = await pg.evaluate("JSON.stringify(Game.G)")
            ck('追兵战关闭后覆盖层消失、存档 G 不变', not await pg.evaluate("!!document.getElementById('rtp-overlay')") and before == after)
            await pg.evaluate("()=>{Game.G.debt=30000;Game.G.flags.bounty=1;}")
            await pg.click('#dow-zb'); await pg.wait_for_timeout(500)
            z2 = await pg.evaluate("({n:RealtimeBattle.state.enemies.length,label:RealtimeBattle.state.label,boss:RealtimeBattle.state.enemies[0].name,rs:RealtimeBattle.state.enemies.map(e=>[e.ringShots,e.ringWarn,e.ringCd])})")
            ck('天道通缉档只有头子带环弹参数进原型：8 发 / 0.4s / 3s，其余 3 个讨债鬼 ringShots=0', z2['rs'][0] == [8, 0.4, 3] and all(r[0] == 0 for r in z2['rs'][1:]))
            ck('欠 30000 且被通缉 → 「天道通缉」4 个、领头讨债鬼头子，顶栏标注「疾攻三发」', z2['n'] == 4 and z2['label'] == '追兵·天道通缉·疾攻三发' and z2['boss'] == '讨债鬼头子')
            # 真页面 rAF 跑 3.5s：讨债鬼站桩远处只放弹道，主角血量拉满不倒 → 数齐射次数与弹丸数
            volley_js = "()=>{const S=RealtimeBattle.state;S.player.hp=S.player.max=1e7;S.player.x=300;S.player.y=320;S.enemies.forEach((e,i)=>{e.speed=0;e.x=[300,150,450,220][i];e.y=110;});}"
            await pg.evaluate(volley_js); await pg.wait_for_timeout(3500)
            v3 = await pg.evaluate("({v:RealtimeBattle.state.foeVolleys,s:RealtimeBattle.state.foeShots,on:RealtimeBattle.state.on,r:RealtimeBattle.state.foeRings})")
            # 头子贴近主角（只有它出手）：rAF 跑 2s → 前冲收招 → 预警圈 → 一圈 8 发环形弹（3s 间隔内只放 1 次）
            ring_js = "()=>{const S=RealtimeBattle.state;S.enemies.forEach((e,i)=>{e.state='chase';e.speed=0;if(i){e.atkCd=1e9;e.x=[0,150,450,220][i];e.y=110;}else{e.x=300;e.y=240;e.atkCd=0;}});S.player.x=300;S.player.y=320;}"
            await pg.evaluate(ring_js); await pg.wait_for_timeout(2000)
            r3 = await pg.evaluate("({r:RealtimeBattle.state.foeRings,rs:RealtimeBattle.state.foeRingShots,b:RealtimeBattle.state.enemies[0].rings,a:RealtimeBattle.state.enemies[0].attacks,on:RealtimeBattle.state.on})")
            await pg.screenshot(path=os.environ.get('SHOT_RING', '/tmp/dev_entry_ring.png'))
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
            await pg.evaluate("()=>{Game.G.debt=500;delete Game.G.flags.bounty;}")
            await pg.click('#dow-zb'); await pg.wait_for_timeout(300)
            z0 = await pg.evaluate("({n:RealtimeBattle.state.enemies.length,label:RealtimeBattle.state.label,sc:RealtimeBattle.state.enemies[0].shotCount,cd:RealtimeBattle.state.enemies[0].atkCdMul})")
            await pg.evaluate(volley_js); await pg.wait_for_timeout(3500)
            v0 = await pg.evaluate("({v:RealtimeBattle.state.foeVolleys,s:RealtimeBattle.state.foeShots,on:RealtimeBattle.state.on})")
            await pg.evaluate(ring_js); await pg.wait_for_timeout(2000)
            r0 = await pg.evaluate("({r:RealtimeBattle.state.foeRings,a:RealtimeBattle.state.enemies[0].attacks,on:RealtimeBattle.state.on})")
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
            ck(f'真页面 3.5s：天道通缉 齐射 {v3["v"]} 次 / 弹丸 {v3["s"]}（每次 3 发），小账 齐射 {v0["v"]} 次 / 弹丸 {v0["s"]}（每次 1 发），通缉弹丸更多',
               v3['on'] and v0['on'] and v3['v'] >= 4 and v3['s'] == 3 * v3['v'] and v0['v'] >= 1 and v0['s'] == v0['v'] and v3['s'] > v0['s'])
            ck('小账档：1 个讨债鬼、顶栏无特性后缀、参数为中性值（= 旧行为）', z0['n'] == 1 and z0['label'] == '追兵·小账' and z0['sc'] == 1 and z0['cd'] == 1)
            ck(f'真页面 2s 头子贴身：前冲 {r3["a"]} 次后放环弹 {r3["r"]} 次 / {r3["rs"]} 发（远射阶段 {v3["r"]} 次）；小账讨债鬼同样贴身前冲 {r0["a"]} 次、环弹 {r0["r"]} 次',
               r3['on'] and r0['on'] and v3['r'] == 0 and r3['a'] >= 1 and r3['r'] == 1 and r3['b'] == 1 and r3['rs'] == 8 and r0['a'] >= 1 and r0['r'] == 0)
        except Exception as e:
            ck('追兵战真页面流程（异常：' + str(e)[:80] + '）', False)
        # 5. 追兵战按胜负结算（债务系统强化 #2）：胜撤通缉、败加误工费，都存档；结算卡在覆盖层关掉后才弹
        try:
            await pg.evaluate("()=>{const G=Game.G;G.debt=30000;G.flags.bounty=1;G.flags.stage3_bountyDebt=30000;Game.save();}")
            await pg.click('#dow-zb'); await pg.wait_for_timeout(400)
            await pg.evaluate("()=>RealtimeBattle.state.enemies.forEach(e=>{e.hp=0;})")
            card = pg.locator('.card:has(.ct:text("追兵战结算"))').last; await card.wait_for(timeout=5000)
            wtxt = await card.inner_text()
            w = await pg.evaluate("({ov:!!document.getElementById('rtp-overlay'),debt:Game.G.debt,bounty:!!Game.G.flags.bounty,bd:'stage3_bountyDebt' in Game.G.flags,win:Game.G.flags.s3b_win,sv:JSON.parse(localStorage.getItem('wbx2_save')||'{}')})")
            ck('追兵战打赢（天道通缉）→ 结算卡在覆盖层关掉后弹出、撤掉通缉、欠款不变、已存档', not w['ov'] and not w['bounty'] and not w['bd'] and w['debt'] == 30000 and w['win'] == 1
               and not (w['sv'].get('flags') or {}).get('bounty') and w['sv'].get('debt') == 30000 and '通缉已撤销' in wtxt and '追兵特性：疾攻三发' in wtxt and '头子：回身环弹' in wtxt)
            t = await pg.evaluate("({n:Game.G.flags.s3b_token,src:Game.G.flags.s3b_token_src,y:Game.G.flags.s3b_token_year,gy:Game.G.year,sv:(JSON.parse(localStorage.getItem('wbx2_save')||'{}').flags||{})})")
            ck(f'天道通缉打赢、头子被打倒 → 结算卡含「缴获讨债令×1（共 1 枚）：只是凭证，暂无用途」，flags.s3b_token={t["n"]} 来源/年份已记并存档',
               '缴获讨债令×1（共 1 枚）：只是凭证，暂无用途' in wtxt and t['n'] == 1 and t['src'] == '天道通缉·讨债鬼头子' and t['y'] == t['gy']
               and t['sv'].get('s3b_token') == 1 and t['sv'].get('s3b_token_src') == '天道通缉·讨债鬼头子' and t['sv'].get('s3b_token_year') == t['gy'])
            ck('第二十二轮：追兵战结算卡带「本场：用时 X.Xs，受击 N 次，闪避 M 次」一行（胜）', bool(re.search(r'本场：用时 \d+\.\ds，受击 \d+ 次，闪避 \d+ 次', wtxt)))
            await card.locator('.opt[data-k="0"]').click(); await pg.wait_for_timeout(300)
            # 第十八轮（债务强化 #9）：同一年再打赢天道通缉 → 冷却挡下，卡片说明「今年已缴获过讨债令，明年再来」，计数仍 1
            await pg.evaluate("()=>{const G=Game.G;G.debt=30000;Game.save();}")
            await pg.click('#dow-zb'); await pg.wait_for_timeout(400)
            await pg.evaluate("()=>RealtimeBattle.state.enemies.forEach(e=>{e.hp=0;})")
            card = pg.locator('.card:has(.ct:text("追兵战结算"))').last; await card.wait_for(timeout=5000)
            wctxt = await card.inner_text()
            tc = await pg.evaluate("({n:Game.G.flags.s3b_token,sv:(JSON.parse(localStorage.getItem('wbx2_save')||'{}').flags||{}).s3b_token,win:Game.G.flags.s3b_win})")
            ck('同一年再打赢天道通缉 → 冷却挡下：卡片含「今年已缴获过讨债令，明年再来」、不含「缴获讨债令×1」，s3b_token 仍 1（存档同），胜场照记 2',
               '今年已缴获过讨债令，明年再来' in wctxt and '缴获讨债令×1' not in wctxt and tc['n'] == 1 and tc['sv'] == 1 and tc['win'] == 2)
            await card.locator('.opt[data-k="0"]').click(); await pg.wait_for_timeout(300)
            # 次年再打赢一次天道通缉：计数累加到 2（卡片显示共 2 枚）
            await pg.evaluate("()=>{const G=Game.G;G.debt=30000;G.year=(G.year||0)+1;Game.save();}")
            await pg.click('#dow-zb'); await pg.wait_for_timeout(400)
            await pg.evaluate("()=>RealtimeBattle.state.enemies.forEach(e=>{e.hp=0;})")
            card = pg.locator('.card:has(.ct:text("追兵战结算"))').last; await card.wait_for(timeout=5000)
            w2txt = await card.inner_text()
            t2 = await pg.evaluate("({n:Game.G.flags.s3b_token,sv:(JSON.parse(localStorage.getItem('wbx2_save')||'{}').flags||{}).s3b_token})")
            ck('次年再打赢一次天道通缉 → 「共 2 枚」，s3b_token 累加到 2 并存档', '缴获讨债令×1（共 2 枚）' in w2txt and t2['n'] == 2 and t2['sv'] == 2)
            await card.locator('.opt[data-k="0"]').click(); await pg.wait_for_timeout(300)
            # 第二十一轮：讨债令第一个只读用途——「讨债令」按钮出卡显示 2/9、今年已领；点前点后 G 与存档逐字节不变
            async def lt_card():
                before = await pg.evaluate("({g:JSON.stringify(Game.G),sv:localStorage.getItem('wbx2_save')})")
                await pg.click('#dow-lt')
                c = pg.locator('.card:has(.ct:text("讨债令"))').last; await c.wait_for(timeout=3000)
                tx = await c.inner_text(); nopt = await c.locator('.opt').count()
                await c.locator('.opt[data-k="0"]').click(); await pg.wait_for_timeout(300)
                after = await pg.evaluate("({g:JSON.stringify(Game.G),sv:localStorage.getItem('wbx2_save')})")
                return tx, nopt, before == after
            ltx, lno, lsame = await lt_card()
            ck('「讨债令」按钮（只读）：卡片「讨债令 2/9」「今年（第 N 年）已领过，明年再来」「今年冷却中」、只有「知道了」，G 与存档不变',
               '讨债令 2/9' in ltx and '已领过，明年再来' in ltx and '今年冷却中' in ltx and '天道通缉·讨债鬼头子' in ltx and lno == 1 and lsame)
            await pg.evaluate("()=>{Game.G.year=(Game.G.year||0)+1;}")
            ltx2, _, lsame2 = await lt_card()
            ck('次年再看「讨债令」：「还没领」「可缴获 1 枚」，G 与存档不变', '讨债令 2/9' in ltx2 and '还没领' in ltx2 and '可缴获 1 枚' in ltx2 and lsame2)
            await pg.evaluate("()=>{Game.G.year=Game.G.year-1;}")
            await pg.evaluate("()=>{const G=Game.G;G.debt=8888;Game.save();}")
            await pg.click('#dow-zb'); await pg.wait_for_timeout(400)
            await pg.evaluate("()=>{RealtimeBattle.state.player.hp=0;}")
            card = pg.locator('.card:has(.ct:text("追兵战结算"))').last; await card.wait_for(timeout=5000)
            ltxt = await card.inner_text()
            l = await pg.evaluate("({debt:Game.G.debt,lose:Game.G.flags.s3b_lose,saved:JSON.parse(localStorage.getItem('wbx2_save')||'{}').debt})")
            ck('第二十二轮：追兵战打输结算卡同样带「本场：用时…受击…闪避…」一行', bool(re.search(r'本场：用时 \d+\.\ds，受击 \d+ 次，闪避 \d+ 次', ltxt)))
            ck('追兵战打输（重债）→ 误工费 889（10%）记进欠款并存档', l['debt'] == 8888 + 889 and l['saved'] == l['debt'] and l['lose'] == 1 and '误工费 889' in ltxt and '追兵特性：快攻双发' in ltxt and '头子：' not in ltxt)
            await card.locator('.opt[data-k="0"]').click(); await pg.wait_for_timeout(300)
            # 重债打赢（没有头子）：结算卡不含讨债令，计数仍为 2
            await pg.click('#dow-zb'); await pg.wait_for_timeout(400)
            await pg.evaluate("()=>RealtimeBattle.state.enemies.forEach(e=>{e.hp=0;})")
            card = pg.locator('.card:has(.ct:text("追兵战结算"))').last; await card.wait_for(timeout=5000)
            htxt = await card.inner_text()
            h = await pg.evaluate("({n:Game.G.flags.s3b_token,sv:(JSON.parse(localStorage.getItem('wbx2_save')||'{}').flags||{}).s3b_token,win:Game.G.flags.s3b_win})")
            ck('重债打赢（没有头子）→ 结算卡不含「讨债令」、s3b_token 仍为 2（存档同）；重债打输卡也不含', '胜·重债' in htxt and '讨债令' not in htxt and '讨债令' not in ltxt and h['n'] == 2 and h['sv'] == 2 and h['win'] == 4)
            await card.locator('.opt[data-k="0"]').click(); await pg.wait_for_timeout(300)
        except Exception as e:
            ck('追兵战结算真页面流程（异常：' + str(e)[:80] + '）', False)
        # 5b. 第十二轮：追兵战 × life34「仇家上门」同一年互斥（造场景：直接挂一个 life34 仇家 pending，与上面造债务的做法相同）
        try:
            hy = await pg.evaluate("({h:Game.G.flags.s3b_hunt_year,y:(Game.G.year||Game.G.age||0),sv:(JSON.parse(localStorage.getItem('wbx2_save')||'{}').flags||{}).s3b_hunt_year})")
            ck(f'打过追兵战 → flags.s3b_hunt_year = 当年 {hy["y"]}（给 life34 侧读）并已存档', hy['h'] == hy['y'] and hy['sv'] == hy['y'])
            await pg.evaluate("()=>{const G=Game.G;Life34.st();G.life34.pending={type:'foe',npc:'merchant'};G.debt=8888;Game.save();}")
            await pg.click('#dow-zb'); await pg.wait_for_timeout(500)
            g1 = await pg.evaluate("({ov:!!document.getElementById('rtp-overlay'),on:!!(RealtimeBattle.state&&RealtimeBattle.state.on),debt:Game.G.debt,body:document.body.innerText})")
            ck('当年仇家上门挂着（life34 pending foe）→ 点「追兵战」不开即时战、欠款不变、提示「追兵战不触发」', not g1['ov'] and not g1['on'] and g1['debt'] == 8888 and '追兵战不触发' in g1['body'])
            # 第十三轮：main 的 life34 仇家来访写 L.seen['foe_'+(G.year||G.age)] → 同年追兵战只认这个键
            await pg.evaluate("()=>{const G=Game.G;G.life34.pending=null;G.life34.seen['foe_'+(G.year||G.age)]=1;Game.save();}"); await pg.wait_for_timeout(2600)
            await pg.click('#dow-zb'); await pg.wait_for_timeout(500)
            gk = await pg.evaluate("({ov:!!document.getElementById('rtp-overlay'),on:!!(RealtimeBattle.state&&RealtimeBattle.state.on),body:document.body.innerText,k:'foe_'+(Game.G.year||Game.G.age)})")
            ck(f'本年 L.seen.{gk["k"]}（life34 仇家已来过）→ 点「追兵战」不开', not gk['ov'] and not gk['on'] and '追兵战不触发' in gk['body'])
            await pg.evaluate("()=>{const G=Game.G;delete G.life34.seen['foe_'+(G.year||G.age)];G.life34.seen['foe_'+((G.year||G.age)-1)]=1;Game.save();}"); await pg.wait_for_timeout(2600)
            await pg.click('#dow-zb'); await pg.wait_for_timeout(500)
            g2 = await pg.evaluate("({ov:!!document.getElementById('rtp-overlay'),on:!!(RealtimeBattle.state&&RealtimeBattle.state.on)})")
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
            g3 = await pg.evaluate("({debt:Game.G.debt})")
            ck('本年无 foe 键（只有去年的）、无 pending → 追兵战照常打开；Escape 中途离场不结算', g2['ov'] and g2['on'] and g3['debt'] == 8888)
            # 方向②：真页面 life34 读 Stage3.huntBlocksFoe —— 本年打过追兵战，simYear 不派仇家
            hb = await pg.evaluate("(()=>{const G=Game.G;const y=G.year||G.age;G.flags.s3b_hunt_year=y;const p=G.life34.pending;const blk=Stage3.huntBlocksFoe(G);return {blk,y};})()")
            ck(f'flags.s3b_hunt_year = 当年 {hb["y"]} → Stage3.huntBlocksFoe 为真（main life34 派仇家前读它）', hb['blk'])
        except Exception as e:
            ck('追兵战同年互斥真页面流程（异常：' + str(e)[:80] + '）', False)
        # 6. 突破预估（债务强化 #3）：按债压档位显示 基础成功率 − 惩罚 0/3/8/15，只读：G 与存档都不变
        try:
            await pg.evaluate("()=>{const G=Game.G;G.realm=4;G.stage=3;G.exp=Game.need();Game.save();}")
            cases = [(500, False, '小账', 0), (3000, False, '欠款', 3), (8888, False, '重债', 8), (30000, True, '天道通缉', 15), (3000, True, '重债', 8)]
            for debt, bounty, name, pen in cases:
                await pg.evaluate(f"()=>{{const G=Game.G;G.debt={debt};if({str(bounty).lower()})G.flags.bounty=1;else delete G.flags.bounty;Game.save();}}")
                st = await pg.evaluate("""(()=>{const G=Game.G;return {g:JSON.stringify(G),sv:localStorage.getItem('wbx2_save'),
                    raw:REALMS[G.realm].brk+G.st.int*0.015+G.st.luck*0.005+G.brkBonus+Game.treeVal('brk')+(G.tmpBrk||0),zjd:(G.inv.zjd||0),pjd:(G.inv.pjd||0),realm:G.realm}})()""")
                raw = st['raw'] + (0.3 if st['realm'] == 1 and st['zjd'] else 0)
                if st['realm'] >= 1 and st['pjd'] and raw < 0.95: raw += 0.15
                base = round(min(0.97, raw) * 100); est = max(5, base - pen)
                await pg.click('#dow-tp')
                card = pg.locator('.card:has(.ct:text("突破预估"))').last; await card.wait_for(timeout=3000)
                txt = await card.inner_text()
                await card.locator('.opt[data-k="0"]').click(); await pg.wait_for_timeout(300)
                st2 = await pg.evaluate("({g:JSON.stringify(Game.G),sv:localStorage.getItem('wbx2_save')})")
                okc = (f'债压：{name}' in txt and f'约 {base}%（现行突破公式）' in txt and f'−{pen} 个百分点' in txt and f'预估成功率：约 {est}%' in txt
                       and '元婴 → 化神' in txt and st2['g'] == st['g'] and st2['sv'] == st['sv'])
                ck(f'突破预估：欠 {debt}{"+通缉" if bounty else ""} → {name} 基础 {base}% −{pen} = {est}%，存档不变', okc)
                if not okc: print('  card:', txt.replace(chr(10), ' | ')[:200])
        except Exception as e:
            ck('突破预估真页面流程（异常：' + str(e)[:80] + '）', False)
        # 7. 追兵调参（债务强化 #7）：开发者覆盖只走 localStorage 专用键；覆盖生效 / 钳制 / 坏 JSON 回退 / 清除后与默认一致 / 不进存档
        try:
            KEY = 'wbx_dev_bounty_tuning'
            sig_js = "RealtimeBattle.state.enemies.map(e=>[e.name,e.maxHp,e.speed,e.atkCdMul,e.windMul,e.shotCount,e.shotSpread,e.ringShots,e.ringWarn,e.ringCd])"
            async def zb_sig():
                await pg.click('#dow-zb'); await pg.wait_for_timeout(400)
                sg = await pg.evaluate(sig_js); lb = await pg.evaluate("RealtimeBattle.state.label")
                await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
                return sg, lb
            async def zt_card(k=0):
                await pg.click('#dow-zt')
                c = pg.locator('.card:has(.ct:text("追兵调参"))').last; await c.wait_for(timeout=3000)
                tx = await c.inner_text(); nopt = await c.locator('.opt').count()
                await c.locator(f'.opt[data-k="{k}"]').click(); await pg.wait_for_timeout(300)
                return tx, nopt
            await pg.evaluate(f"()=>{{localStorage.removeItem('{KEY}');const G=Game.G;G.debt=30000;delete G.flags.bounty;Game.save();}}")
            sig0, lb0 = await zb_sig()
            t0, n0 = await zt_card()
            ck('没设覆盖：追兵调参卡显示「未设置覆盖：使用默认表」「当前预设：原样」与四档默认值、头子 8 发，选项 = 知道了 + 三个预设', '未设置覆盖' in t0 and '当前预设：原样' in t0 and '天道通缉：4 只 血×1.45 冷却×0.6 前摇×0.7 3 发/16° 移速+8' in t0 and '小账：1 只' in t0
               and '8 发 预警 0.4s 间隔 3s' in t0 and KEY in t0 and n0 == 4 and len(sig0) == 4 and sig0[0][7] == 8)
            ov = {'tiers': {'wanted': {'shotCount': 5, 'hunters': 2, 'atkCdMul': 9}, 'light': {'foo': 1}}, 'boss': {'ringShots': 12, 'ringWarn': 'x'}}
            await pg.evaluate(f"()=>{{localStorage.setItem('{KEY}', {json.dumps(json.dumps(ov))});}}")
            sv0 = await pg.evaluate("localStorage.getItem('wbx2_save')")
            sig1, lb1 = await zb_sig()
            ck(f'写入覆盖后追兵战敌人参数变化：天道通缉 {len(sig1)} 个（覆盖 2）、5 发、冷却×9→钳到 2、头子环弹 12 发、ringWarn 非法回退 0.4；默认 {len(sig0)} 个/3 发/8 发',
               len(sig1) == 2 and all(e[5] == 5 and e[3] == 2 for e in sig1) and sig1[0][7] == 12 and sig1[0][8] == 0.4 and sig1[1][7] == 0 and lb1 == lb0 == '追兵·天道通缉·疾攻三发')
            t1, n1 = await zt_card()
            ck('追兵调参卡：标出覆盖生效项、被覆盖字段（*）、钳制、非法回退与未知字段、「当前：自定义覆盖」，并给「预设·原样（清除覆盖）」',
               '覆盖生效：改了 4 项' in t1 and 'tiers.wanted.shotCount 3→5' in t1 and 'boss.ringShots 8→12' in t1 and '天道通缉：2 只*' in t1 and '5 发*' in t1
               and '已钳制：tiers.wanted.atkCdMul 9→2' in t1 and 'boss.ringWarn="x"' in t1 and 'tiers.light.foo' in t1 and '当前：自定义覆盖' in t1 and n1 == 4)
            # 带覆盖打赢一场：结算卡注明调参生效；存档里没有覆盖键/调参字段，覆盖键本身也没被游戏改写
            await pg.click('#dow-zb'); await pg.wait_for_timeout(400)
            await pg.evaluate("()=>RealtimeBattle.state.enemies.forEach(e=>{e.hp=0;})")
            card = pg.locator('.card:has(.ct:text("追兵战结算"))').last; await card.wait_for(timeout=5000)
            wt = await card.inner_text(); await card.locator('.opt[data-k="0"]').click(); await pg.wait_for_timeout(300)
            sv1 = await pg.evaluate(f"({{sv:localStorage.getItem('wbx2_save'),g:JSON.stringify(Game.G),raw:localStorage.getItem('{KEY}')}})")
            ck('带覆盖打赢：结算卡含「开发者调参：4 项生效」；存档/G 不含覆盖键与调参字段，覆盖键原样未被改写',
               '开发者调参：4 项生效' in wt and '胜·天道通缉' in wt and all(x not in sv1['sv'] and x not in sv1['g'] for x in ('wbx_dev', 'tuning', 'ringWarn', 'shotCount')) and sv1['raw'] == json.dumps(ov) and sv0 != sv1['sv'])
            # 坏 JSON / 非对象：回退默认表（与没覆盖逐字段一致），卡片提示
            bad_ok = []
            for raw, hint in (('{bad json', '不是合法 JSON'), ('[1,2]', '不是 JSON 对象'), ('null', '不是 JSON 对象'), ('"str"', '不是 JSON 对象')):
                await pg.evaluate(f"()=>{{localStorage.setItem('{KEY}', {json.dumps(raw)});const G=Game.G;G.debt=30000;delete G.flags.bounty;Game.save();}}")
                sg, _ = await zb_sig(); tb, nb = await zt_card()
                bad_ok.append(sg == sig0 and '⚠' in tb and hint in tb and '天道通缉：4 只 血×1.45' in tb and nb == 4)
            ck(f'坏 JSON / 数组 / null / 字符串覆盖：追兵与默认逐字段一致，卡片提示「⚠ …已用默认表」：{bad_ok}', all(bad_ok))
            # 清除覆盖：卡片「预设·原样（清除覆盖）」（第 3 个选项）→ 键被删，追兵与默认逐字段一致
            await pg.evaluate(f"()=>{{localStorage.setItem('{KEY}', {json.dumps(json.dumps(ov))});}}")
            sigx, _ = await zb_sig()
            await zt_card(2)
            gone = await pg.evaluate(f"localStorage.getItem('{KEY}')")
            sig2, lb2 = await zb_sig()
            t2, _ = await zt_card()
            ck('「预设·原样（清除覆盖）」后覆盖键被删，追兵战与默认表逐字段一致、卡片回到「未设置覆盖」', sigx != sig0 and gone is None and sig2 == sig0 and lb2 == lb0 and '未设置覆盖' in t2)
        except Exception as e:
            ck('追兵调参真页面流程（异常：' + str(e)[:80] + '）', False)
        # 8. 追兵调参一键预设（债务强化 #8）：点预设只写/删覆盖专用键（JSON = Stage3 预设表），追兵战按预设变化；存档与其它 localStorage 键不变
        try:
            KEY = 'wbx_dev_bounty_tuning'
            ls_js = "(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k);}return o;})()"
            await pg.evaluate(f"()=>{{localStorage.removeItem('{KEY}');const G=Game.G;G.debt=30000;delete G.flags.bounty;Game.save();}}")
            P = await pg.evaluate("Stage3.BOUNTY_TUNING_PRESETS.map(p=>({key:p.key,n:p.n,json:p.override==null?null:JSON.stringify(p.override)}))")
            ck('页面里有三个预设：好躲 / 原样（override=null）/ 地狱', [x['n'] for x in P] == ['好躲', '原样', '地狱'] and P[1]['json'] is None and P[0]['json'] and P[2]['json'])
            ls0 = await pg.evaluate(ls_js)
            # 卡片 4 个选项都在屏内可点（截图存证）
            await pg.click('#dow-zt')
            c = pg.locator('.card:has(.ct:text("追兵调参"))').last; await c.wait_for(timeout=3000)
            labels = await c.locator('.opt').all_inner_texts()
            obox = await c.evaluate("c=>[...c.querySelectorAll('.opt')].map(b=>{const r=b.getBoundingClientRect();return [r.top,r.bottom,r.left,r.right]})")
            await pg.screenshot(path=os.environ.get('SHOT_ZT', '/tmp/dev_entry_zt_presets.png'))
            await c.locator('.opt[data-k="3"]').click(); await pg.wait_for_timeout(300)
            ck(f'追兵调参卡选项 = {labels}，四个按钮都在 412×915 屏内', labels == ['知道了', '预设·好躲', '预设·原样（清除覆盖）', '预设·地狱'] and all(b[0] >= 0 and b[1] <= 915 and b[2] >= 0 and b[3] <= 412 for b in obox))
            ls1 = await pg.evaluate(ls_js)
            ck('点「预设·地狱」→ 覆盖键 = 地狱预设 JSON；其它 localStorage 键（含存档 wbx2_save）一个字节不变',
               ls1.get(KEY) == P[2]['json'] and {k: v for k, v in ls1.items() if k != KEY} == {k: v for k, v in ls0.items() if k != KEY} and KEY not in ls0)
            sgH, lbH = await zb_sig(); tH, nH = await zt_card()
            ck(f'地狱预设生效：天道通缉 {len(sgH)} 个、5 发、冷却×0.4、前摇×0.5、头子环弹 12 发/0.3s/1.5s；卡片「当前预设：地狱」「改了 30 项」、无钳制/非法',
               len(sgH) == 4 and all(e[5] == 5 and e[3] == 0.4 and e[4] == 0.5 for e in sgH) and sgH[0][7:10] == [12, 0.3, 1.5] and lbH == '追兵·天道通缉·疾攻三发'
               and '当前预设：地狱' in tH and '覆盖生效：改了 30 项' in tH and '已钳制' not in tH and '非法' not in tH and '未知字段' not in tH and nH == 4)
            await pg.click('#dow-zt')
            c = pg.locator('.card:has(.ct:text("追兵调参"))').last; await c.wait_for(timeout=3000)
            await c.locator('.opt[data-k="1"]').click(); await pg.wait_for_timeout(300)
            rawE = await pg.evaluate(f"localStorage.getItem('{KEY}')")
            sgE, _ = await zb_sig(); tE, _ = await zt_card()
            ck(f'改点「预设·好躲」→ 覆盖键换成好躲 JSON；天道通缉 {len(sgE)} 个、2 发、冷却×0.85、头子环弹 6 发/0.6s/5s；卡片「当前预设：好躲」',
               rawE == P[0]['json'] and len(sgE) == 3 and sgE[0][0] == '讨债鬼头子' and all(e[5] == 2 and e[3] == 0.85 for e in sgE) and sgE[0][7:10] == [6, 0.6, 5] and '当前预设：好躲' in tE)
            # 带好躲预设打赢：结算照常（欠款不变、讨债令照记），存档不含任何调参内容（第十八轮：先过一年，避开讨债令每年一枚的冷却）
            await pg.evaluate("()=>{const G=Game.G;G.year=(G.year||0)+1;Game.save();}")
            await pg.click('#dow-zb'); await pg.wait_for_timeout(400)
            await pg.evaluate("()=>RealtimeBattle.state.enemies.forEach(e=>{e.hp=0;})")
            card = pg.locator('.card:has(.ct:text("追兵战结算"))').last; await card.wait_for(timeout=5000)
            we = await card.inner_text(); await card.locator('.opt[data-k="0"]').click(); await pg.wait_for_timeout(300)
            sve = await pg.evaluate(f"({{sv:localStorage.getItem('wbx2_save'),g:JSON.stringify(Game.G),debt:Game.G.debt,raw:localStorage.getItem('{KEY}')}})")
            ck('好躲预设下打赢天道通缉：结算卡「胜·天道通缉」「开发者调参：20 项生效」、含讨债令；欠款 30000 不变；存档/G 不含调参内容，覆盖键原样',
               '胜·天道通缉' in we and '开发者调参：20 项生效' in we and '缴获讨债令×1' in we and sve['debt'] == 30000 and sve['raw'] == P[0]['json']
               and all(x not in sve['sv'] and x not in sve['g'] for x in ('wbx_dev', 'tuning', 'ringWarn', 'shotCount', '好躲')))
            ls2 = await pg.evaluate(ls_js)
            await pg.click('#dow-zt')
            c = pg.locator('.card:has(.ct:text("追兵调参"))').last; await c.wait_for(timeout=3000)
            await c.locator('.opt[data-k="2"]').click(); await pg.wait_for_timeout(300)
            ls3 = await pg.evaluate(ls_js)
            sgP, lbP = await zb_sig(); tP, _ = await zt_card()
            ck('点「预设·原样（清除覆盖）」→ 覆盖键被删、其它键不变；追兵战与默认表逐字段一致；卡片「未设置覆盖」「当前预设：原样」',
               KEY not in ls3 and {k: v for k, v in ls3.items()} == {k: v for k, v in ls2.items() if k != KEY} and sgP == sig0 and lbP == lb0 and '未设置覆盖' in tP and '当前预设：原样' in tP)
            await pg.click('#dow-zt')
            c = pg.locator('.card:has(.ct:text("追兵调参"))').last; await c.wait_for(timeout=3000)
            await c.locator('.opt[data-k="2"]').click(); await pg.wait_for_timeout(300)
            ck('没覆盖时再点「原样」→ 仍无覆盖键、不报错', await pg.evaluate(f"localStorage.getItem('{KEY}')") is None)
        except Exception as e:
            ck('追兵调参预设真页面流程（异常：' + str(e)[:80] + '）', False)
        ck('无 JS 错误', not errs)
        await b.close()
    for m, c in checks: print(('PASS ' if c else 'FAIL ') + m)
    print(json.dumps({'dialogs': dialog['seen'], 'errs': errs}, ensure_ascii=False))
    sys.exit(sum(1 for _, c in checks if not c))
asyncio.run(main())

# 开发者模式门禁真页面测试：python3 -B test/dev_openworld_gate_page.py，退出码 = 失败数
# 开发者模式唯一判定 = main 的 localStorage.wbx2_dev === '1'（ux23.js 持久开关，版本号 7 连点切换；APK 重启 = 无 hash 重新加载页面）。
# 非开发者模式：原型脚本 battle_realtime_prototype.js / stage3_encounter_draft.js / lowpoly_box_chars.js 不请求、不执行，
#   RealtimeBattle / Stage3 / LowpolyBox 全局不存在，DevOpenWorld 只是空壳（active=false、ready()===false），没有任何开发者按钮 / 覆盖层 / 页签。
# 用例：(a) wbx2_dev='1' 后无 hash 重载（模拟 APK 重启）→ 原型 + 页签都在；(b) 未设 / '0' → 什么都没有；
#   (c) 开发者模式下用 ux23 真实 7 连点关掉 → 兜底入口立即消失；再重载 → 什么都不加载；(d) 用 ux23 真实 7 连点打开 → 本会话内懒加载 + 登记页签；
#   (e) main 真实 3.4.1 作弊菜单（UI.p_dev + dev341.js 包装）里「开放世界」页签恰好 1 个，点开渲染 8 个按钮。
import asyncio, os, sys, re, threading, functools, http.server, socketserver
from playwright.async_api import async_playwright
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www'); PORT = int(os.environ.get('PORT', '8813'))
PROTO = ['battle_realtime_prototype.js', 'stage3_encounter_draft.js', 'lowpoly_box_chars.js']
def serve():
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    socketserver.TCPServer.allow_reuse_address = True
    socketserver.ThreadingTCPServer(('127.0.0.1', PORT), functools.partial(Q, directory=ROOT)).serve_forever()
STATE = """()=>({rt:typeof RealtimeBattle, s3:typeof Stage3, lp:typeof LowpolyBox, dow:typeof DevOpenWorld, active:!!(window.DevOpenWorld&&DevOpenWorld.active),
  dev:localStorage.getItem('wbx2_dev'),
  ids:['dow-open','dow-panel','v25-entry','v25-eq','v25-rt','rtp-overlay','v25-encounter-overlay'].filter(i=>document.getElementById(i)),
  owTabs:(window.DevTabs||[]).filter(t=>t&&t.key==='openworld').length,
  p341:(window.DevPanel&&DevPanel.tabs)?DevPanel.tabs().filter(t=>t.key==='openworld').length:-1,
  tags:[...document.scripts].map(s=>s.getAttribute('src')||'').filter(s=>/battle_realtime_prototype|stage3_encounter_draft|lowpoly_box_chars/.test(s))})"""
# main 真实 3.4.1 菜单：调用 ux23 的 UI.p_dev（已被 dev341.js 包装），数页签条里的「开放世界」，再切到该页签看渲染
MENU = """async()=>{const g0=Game.G;if(!g0)Game.G={flags:{}};const b=document.createElement('div');document.body.appendChild(b);let cur='res';
  const re=t=>{cur=t||cur;b.innerHTML='';UI.p_dev(b,re,()=>{},cur)};re('res');
  const tabs=[...b.querySelectorAll('.devtabs .dt')].filter(x=>x.dataset.t==='openworld'||x.textContent==='开放世界');
  const a={n:tabs.length,name:tabs[0]?tabs[0].textContent:null,all:[...b.querySelectorAll('.devtabs .dt')].map(x=>x.textContent).join(',')};
  if(tabs[0]){re('openworld');a.inBox=b.querySelectorAll('.dvext button.dow-btn').length;a.fbHidden=!document.getElementById('dow-open')||document.getElementById('dow-open').style.display==='none';}
  DevPanel.cleanup&&DevPanel.cleanup();b.remove();a.fbBack=!!document.getElementById('dow-open')&&document.getElementById('dow-open').style.display!=='none';Game.G=g0;return a}"""
async def main():
    threading.Thread(target=serve, daemon=True).start(); checks = []
    ck = lambda m, c: checks.append((m, bool(c)))
    html = open(os.path.join(ROOT, 'index.html'), encoding='utf8').read()
    srcs = re.findall(r'<script src="([^"]+)"', html)
    ck('index.html（release 包原样拷贝）不直接加载任何原型脚本', not any(any(p in s for p in PROTO) for s in srcs))
    ck('index.html 加载 js/dev_openworld.js 恰好一次，且在 ux23.js 之后', srcs.count('js/dev_openworld.js') == 1 and srcs.index('js/ux23.js') < srcs.index('js/dev_openworld.js'))
    src = open(os.path.join(ROOT, 'js', 'dev_openworld.js'), encoding='utf8').read()
    code = '\n'.join(l for l in src.split('\n') if not l.strip().startswith('//'))
    ck('dev_openworld.js 不再自己数点击、不看 location.hash / location.search', 'location.hash' not in code and 'location.search' not in code and "addEventListener('click'" not in code)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME', '/opt/google/chrome/chrome'), args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width': 412, 'height': 915})
        pg = await ctx.new_page(); reqs = []; errs = []
        pg.on('request', lambda r: reqs.append(r.url)); pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        base = f'http://127.0.0.1:{PORT}/index.html'
        async def load(dev=None, url=base):  # dev=None 不动；'' 删键；其他写入；然后无 hash 重载 = APK 重启
            await pg.goto(base); await pg.wait_for_timeout(300)
            if dev is not None: await pg.evaluate("v=>v===''?localStorage.removeItem('wbx2_dev'):localStorage.setItem('wbx2_dev',v)", dev)
            reqs.clear(); errs.clear(); await pg.goto('about:blank'); await pg.goto(url); await pg.wait_for_timeout(3500)
            return await pg.evaluate(STATE)
        async def none_loaded(tag, st):
            ck(f'{tag}：RealtimeBattle/Stage3/LowpolyBox 都不存在 {st["rt"]}/{st["s3"]}/{st["lp"]}', st['rt'] == st['s3'] == st['lp'] == 'undefined')
            ck(f'{tag}：没有请求任何原型脚本、无原型 script 标签', not [u for u in reqs if any(x in u for x in PROTO)] and not st['tags'])
            ck(f'{tag}：DevOpenWorld 空壳（active=false、ready()===false），无开发者按钮/覆盖层 {st["ids"]}', st['dow'] == 'object' and not st['active'] and not st['ids'] and await pg.evaluate('DevOpenWorld.ready()===false'))
            ck(f'{tag}：DevTabs 与 dev341 DevPanel.tabs() 里都没有 openworld 页签 {st["owTabs"]}/{st["p341"]}', st['owTabs'] == 0 and st['p341'] == 0)
            ck(f'{tag}：无 JS 错误 ' + str(errs[:2]), not errs)
        async def all_loaded(tag, st):
            ck(f'{tag}：RealtimeBattle/Stage3 已懒加载、DevOpenWorld.active，「开放世界」入口 + main 三个按钮在 {st["ids"]}', st['rt'] == 'object' and st['s3'] == 'object' and st['active'] and {'dow-open', 'v25-entry', 'v25-eq', 'v25-rt'} <= set(st['ids']))
            ck(f'{tag}：openworld 页签 DevTabs 1 个、dev341 tabs() 1 个 {st["owTabs"]}/{st["p341"]}', st['owTabs'] == 1 and st['p341'] == 1)
            ck(f'{tag}：LowpolyBox 仍不存在', st['lp'] == 'undefined')
            ck(f'{tag}：无 JS 错误 ' + str(errs[:2]), not errs)
        async def ux23_toggle():  # ux23 真实 7 连点：标题页版本号（#title .ver），真实鼠标点击，间隔 < 1.5s
            loc = pg.locator('#title .ver').first
            for _ in range(7): await loc.click(); await pg.wait_for_timeout(120)
            await pg.wait_for_timeout(1500)
        # (b) 未设 / '0'
        await none_loaded('(b) wbx2_dev 未设', await load(''))
        await none_loaded("(b) wbx2_dev='0'", await load('0'))
        # (a) wbx2_dev='1' + 无 hash 重载（APK 重启）
        st = await load('1'); await all_loaded("(a) wbx2_dev='1' 后无 hash 重载（APK 重启）", st)
        m = await pg.evaluate("""(()=>{const D=DevOpenWorld;const box=document.createElement('div');document.body.appendChild(box);const un=D.mount(box);
          const a={id:D.id,title:D.title,n:D.buttons.length,inBox:box.querySelectorAll('button.dow-btn').length,fbHidden:document.getElementById('dow-open').style.display==='none'};
          un();a.after=box.querySelectorAll('button').length;a.fbBack=document.getElementById('dow-open').style.display!=='none';return a})()""")
        ck(f'(a) mount API：id=openworld / title=开放世界 / 8 个按钮 {m}', m['id'] == 'openworld' and m['title'] == '开放世界' and m['n'] == 8 and m['inBox'] == 8)
        ck('(a) mount() 后兜底入口隐藏，卸载后恢复', m['fbHidden'] and m['after'] == 0 and m['fbBack'])
        await pg.add_script_tag(url='js/dev_openworld.js'); await pg.wait_for_timeout(1200); st = await pg.evaluate(STATE)
        ck(f'(a) dev_openworld.js 再执行一次，页签仍 1 个 {st["owTabs"]}/{st["p341"]}', st['owTabs'] == 1 and st['p341'] == 1)
        # (e) main 真实 3.4.1 作弊菜单
        mm = await pg.evaluate(MENU)
        ck(f'(e) main 真实作弊菜单（ux23 UI.p_dev + dev341）页签条里「开放世界」恰好 1 个 {mm}', mm['n'] == 1 and mm['name'] == '开放世界')
        ck('(e) 点开「开放世界」页签：8 个按钮渲染进页签、兜底入口隐藏；关面板后恢复', mm.get('inBox') == 8 and mm.get('fbHidden') and mm['fbBack'])
        # (c) 开发者模式下 ux23 真实 7 连点关掉 → 兜底入口/页签立即消失，不再加载；重载后什么都没有
        await ux23_toggle(); st = await pg.evaluate(STATE)
        ck(f'(c) ux23 7 连点后 wbx2_dev 被移除（{st["dev"]}）', st['dev'] is None)
        ck(f'(c) 会话内关掉：兜底入口/面板消失、DevOpenWorld.active=false、页签撤销、ready()===false {st}', 'dow-open' not in st['ids'] and 'dow-panel' not in st['ids'] and not st['active'] and st['owTabs'] == 0 and st['p341'] == 0 and await pg.evaluate('DevOpenWorld.ready()===false'))
        await none_loaded('(c) 关掉后无 hash 重载', await load())
        # (d) ux23 真实 7 连点打开 → 本会话懒加载 + 页签
        reqs.clear(); await ux23_toggle(); await pg.wait_for_timeout(1500); st = await pg.evaluate(STATE)
        ck(f"(d) ux23 7 连点后 wbx2_dev='1'（{st['dev']}）", st['dev'] == '1')
        await all_loaded('(d) 会话内用 ux23 打开', st)
        mm = await pg.evaluate(MENU)
        ck(f'(d)(e) 打开后 main 真实作弊菜单里「开放世界」恰好 1 个、8 个按钮 {mm}', mm['n'] == 1 and mm.get('inBox') == 8)
        await all_loaded('(d) 再无 hash 重载（APK 重启）', await load())
        await pg.evaluate("localStorage.removeItem('wbx2_dev')")
        await b.close()
    for m, c in checks: print(('PASS ' if c else 'FAIL ') + m)
    print(f'{sum(c for _, c in checks)}/{len(checks)} PASS')
    sys.exit(sum(1 for _, c in checks if not c))
asyncio.run(main())

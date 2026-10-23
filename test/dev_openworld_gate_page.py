# 开发者模式门禁真页面测试：python3 -B test/dev_openworld_gate_page.py，退出码 = 失败数
# 非开发者模式（release 包同一份 index.html）：原型脚本 battle_realtime_prototype.js / stage3_encounter_draft.js / lowpoly_box_chars.js 不请求、不执行，
#   RealtimeBattle / Stage3 / LowpolyBox 全局不存在，DevOpenWorld 只是空壳（active=false），没有任何开发者按钮 / 覆盖层。
# 开发者模式（#dev、?dev=1、7 连点 #title）：dev_openworld.js 懒加载原型脚本，全局出现，「开放世界」兜底入口出现；mount() 后兜底入口隐藏，卸载后恢复。
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
  ids:['dow-open','dow-panel','v25-entry','v25-eq','v25-rt','rtp-overlay','v25-encounter-overlay'].filter(i=>document.getElementById(i)),
  tags:[...document.scripts].map(s=>s.getAttribute('src')||'').filter(s=>/battle_realtime_prototype|stage3_encounter_draft|lowpoly_box_chars/.test(s))})"""
async def main():
    threading.Thread(target=serve, daemon=True).start(); checks = []
    ck = lambda m, c: checks.append((m, bool(c)))
    html = open(os.path.join(ROOT, 'index.html'), encoding='utf8').read()
    srcs = re.findall(r'<script src="([^"]+)"', html)
    ck('index.html（release 包原样拷贝）不直接加载任何原型脚本：' + ','.join(s for s in srcs if any(p in s for p in PROTO)), not any(any(p in s for p in PROTO) for s in srcs))
    ck('index.html 加载 js/dev_openworld.js 恰好一次', srcs.count('js/dev_openworld.js') == 1)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME', '/opt/google/chrome/chrome'), args=['--no-sandbox'])
        async def page(url):
            pg = await b.new_page(viewport={'width': 412, 'height': 915}); reqs = []; errs = []
            pg.on('request', lambda r: reqs.append(r.url)); pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
            await pg.goto(f'http://127.0.0.1:{PORT}/{url}'); await pg.wait_for_timeout(3500)
            return pg, reqs, errs
        pg, reqs, errs = await page('index.html')
        st = await pg.evaluate(STATE)
        ck(f'非开发者模式：RealtimeBattle/Stage3/LowpolyBox 都不存在 {st["rt"]}/{st["s3"]}/{st["lp"]}', st['rt'] == st['s3'] == st['lp'] == 'undefined')
        ck('非开发者模式：没有请求任何原型脚本', not [u for u in reqs if any(x in u for x in PROTO)])
        ck(f'非开发者模式：DevOpenWorld 是空壳（active=false），无开发者按钮 / 覆盖层 {st["ids"]}、无原型 script 标签', st['dow'] == 'object' and not st['active'] and not st['ids'] and not st['tags'])
        ck('非开发者模式：无 JS 错误 ' + str(errs[:2]), not errs)
        ck('非开发者模式：window.DevTabs 里没有 openworld 页签', await pg.evaluate("!(window.DevTabs||[]).some(t=>t&&t.key==='openworld')"))
        # 7 连点标题 → 开发者模式
        n = await pg.evaluate("(()=>{const t=document.querySelector('#title, .ver, #ver');if(!t)return 0;for(let i=0;i<7;i++)t.dispatchEvent(new MouseEvent('click',{bubbles:true}));return 1})()")
        await pg.wait_for_timeout(1500); st = await pg.evaluate(STATE)
        ck(f'7 连点 #title/.ver → 原型脚本懒加载、出现「开放世界」入口 {st}', n and st['rt'] == 'object' and st['s3'] == 'object' and st['active'] and 'dow-open' in st['ids'] and 'v25-entry' in st['ids'])
        await pg.close()
        for url in ['index.html#dev', 'index.html?dev=1']:
            pg, reqs, errs = await page(url); st = await pg.evaluate(STATE)
            ck(f'{url}：RealtimeBattle/Stage3 已懒加载、DevOpenWorld.active，「开放世界」入口 + main 三个按钮在 {st["ids"]}', st['rt'] == 'object' and st['s3'] == 'object' and st['active'] and {'dow-open', 'v25-entry', 'v25-eq', 'v25-rt'} <= set(st['ids']))
            ck(f'{url}：LowpolyBox 仍不存在（只有 prototypes/lowpoly_box 独立页加载）', st['lp'] == 'undefined')
            ck(f'{url}：无 JS 错误 ' + str(errs[:2]), not errs)
            if url.endswith('#dev'):
                m = await pg.evaluate("""(()=>{const D=DevOpenWorld;const box=document.createElement('div');document.body.appendChild(box);const un=D.mount(box);
                  const a={id:D.id,title:D.title,n:D.buttons.length,labels:D.buttons.map(b=>b.label).join(','),inBox:box.querySelectorAll('button.dow-btn').length,fbHidden:document.getElementById('dow-open').style.display==='none'};
                  un();a.after=box.querySelectorAll('button').length;a.fbBack=document.getElementById('dow-open').style.display!=='none';return a})()""")
                ck(f'mount API：id=openworld / title=开放世界 / 8 个按钮 {m["labels"]}', m['id'] == 'openworld' and m['title'] == '开放世界' and m['n'] == 8 and m['inBox'] == 8)
                ck('mount() 后兜底入口隐藏，卸载后按钮移除、兜底入口恢复', m['fbHidden'] and m['after'] == 0 and m['fbBack'])
                # 3.4.1 作弊菜单接口 DevTabs：再执行一次 dev_openworld.js 也只登记一次
                await pg.add_script_tag(url='js/dev_openworld.js'); await pg.wait_for_timeout(800)
                t = await pg.evaluate("""(()=>{const L=(window.DevTabs||[]).filter(t=>t&&t.key==='openworld');const T=L[0]||{};
                  const box=document.createElement('div');document.body.appendChild(box);const un=T.render?T.render(box):null;
                  const a={n:L.length,name:T.name,inBox:box.querySelectorAll('button.dow-btn').length,fbHidden:document.getElementById('dow-open').style.display==='none'};
                  if(typeof un==='function')un();a.fbBack=document.getElementById('dow-open').style.display!=='none';return a})()""")
                ck(f'#dev：DevTabs 里恰好 1 个 openworld 页签（文件执行两次后仍 1 个）name=开放世界 {t}', t['n'] == 1 and t['name'] == '开放世界')
                # 载入 origin/dev341 真实 dev341.js 的 DevPanel.tabs() 过滤（按 key），确认能被 3.4.1 菜单识别
                import subprocess
                src = subprocess.run(['git','show','origin/dev341:www/js/dev341.js'],capture_output=True,text=True,cwd=ROOT).stdout
                k = src.find('window.DevTabs = window.DevTabs || [];'); e = src.find('(function () {', k)
                if k > 0 and e > k:
                    seg = src[k:e].replace('const DevPanel = window.DevPanel =', 'const _DP =').replace('DEV341.TABS', '[]')
                    n341 = await pg.evaluate("(()=>{" + seg + " return _DP.tabs().filter(t=>t.key==='openworld').length})()")
                    ck(f'dev341 真实 DevPanel.tabs() 识别到 openworld 页签 1 个（{n341}）', n341 == 1)
                ck('DevTabs render(el)：8 个按钮进 el、隐藏 #dow-open；返回的卸载函数调用后兜底入口恢复', t['inBox'] == 8 and t['fbHidden'] and t['fbBack'])
            await pg.close()
        await b.close()
    for m, c in checks: print(('PASS ' if c else 'FAIL ') + m)
    print(f'{sum(c for _, c in checks)}/{len(checks)} PASS')
    sys.exit(sum(1 for _, c in checks if not c))
asyncio.run(main())

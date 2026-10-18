# 3.3 无头 JS 错误巡检：逐张地图 + 大地图 + 主要系统面板（诊断用，非点按门禁，允许直接调用 Game.*）
import asyncio, os, sys, json, threading, functools, http.server, socketserver
from playwright.async_api import async_playwright
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www')
PORT = int(os.environ.get('PORT', '8799'))
def serve():
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    h.log_message = lambda *a: None
    socketserver.TCPServer.allow_reuse_address = True
    socketserver.ThreadingTCPServer(('127.0.0.1', PORT), h).serve_forever()
async def main():
    threading.Thread(target=serve, daemon=True).start()
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME', '/opt/google/chrome/chrome'), args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 412, 'height': 915})
        cur = {'s': 'boot'}
        pg.on('pageerror', lambda e: errs.append([cur['s'], 'pageerror', str(e)[:300]]))
        pg.on('console', lambda m: m.type == 'error' and 'favicon.ico' not in ((m.location or {}).get('url') or '') and errs.append([cur['s'], 'console', m.text[:300]]))  # 本地 http.server 没有 favicon.ico，浏览器自动请求的 404 不算游戏错误
        await pg.goto(f'http://127.0.0.1:{PORT}/index.html')
        await pg.wait_for_timeout(4000)
        cur['s'] = 'newLife'
        await pg.evaluate("""()=>{localStorage.clear();Game.newLife({name:'测试',sex:'m',lg:LINGGEN[1].id,talents:[],st:{str:5,con:5,int:5,luck:5,wealth:5,charm:5}});const G=Game.G;G.flags.awakened=1;G.realm=6;Game.save&&Game.save();}""")
        maps = await pg.evaluate("Object.keys(MAPINFO)")
        for m in maps:
            cur['s'] = 'map:' + m
            try:
                await pg.evaluate(f"(async()=>{{Game.G.map='{m}';Game.G.pos=null;await Game.enterMap('{m}')}})()")
                await pg.wait_for_timeout(1500)
            except Exception as e: errs.append([cur['s'], 'evaluate', str(e)[:300]])
        for name, js in [('world28', "World28.enter()"), ('yearEnd', "Game.yearEnd&&Game.yearEnd()")]:
            cur['s'] = name
            try:
                await pg.evaluate(f"(async()=>{{try{{await {js}}}catch(e){{console.error('THROW '+e.stack)}}}})()")
                await pg.wait_for_timeout(2500)
            except Exception as e: errs.append([name, 'evaluate', str(e)[:300]])
        await b.close()
    out = {'maps': maps, 'errors': errs}
    json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'results', 'jsscan33.json'), 'w'), ensure_ascii=False, indent=1)
    print(json.dumps(out, ensure_ascii=False, indent=1)); sys.exit(len(errs))
asyncio.run(main())

# 即时战原型页面冒烟（诊断用，非点按门禁；允许 evaluate 摆位）：python3 -B test/battle_rt_proto_page.py，退出码=失败数
import asyncio, os, sys, json, threading, functools, http.server, socketserver
from playwright.async_api import async_playwright
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','www'); PORT=int(os.environ.get('PORT','8811'))
def serve():
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self,*a): pass
    h=functools.partial(Q, directory=ROOT)
    socketserver.TCPServer.allow_reuse_address=True
    socketserver.ThreadingTCPServer(('127.0.0.1',PORT),h).serve_forever()
async def main():
    threading.Thread(target=serve,daemon=True).start(); errs=[]
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/google/chrome/chrome',args=['--no-sandbox'])
        pg=await b.new_page(viewport={'width':412,'height':915})
        pg.on('pageerror',lambda e: errs.append(str(e)[:300]))
        pg.on('console',lambda m: m.type=='error' and '404' not in m.text and errs.append(m.text[:300]))
        await pg.goto(f'http://127.0.0.1:{PORT}/index.html#dev'); await pg.wait_for_timeout(4000)
        n=await pg.evaluate("document.querySelectorAll('#v25-rt').length")
        await pg.click('#v25-rt'); await pg.wait_for_timeout(1200)
        st=await pg.evaluate("({ov:!!document.getElementById('rtp-overlay'),on:RealtimeBattle.state.on,spr:RealtimeBattle.state.player.spr,img:!!img(SPR_PATH(RealtimeBattle.state.player.spr))})")
        await pg.keyboard.down('w'); await pg.wait_for_timeout(500); await pg.keyboard.up('w')
        # 把敌人拉到面前再挥砍（诊断用）
        await pg.evaluate("(()=>{const S=RealtimeBattle.state;S.enemies[0].x=S.player.x;S.enemies[0].y=S.player.y-60})()")
        await pg.click('#rtp-overlay button >> text=攻'); await pg.wait_for_timeout(120)
        st2=await pg.evaluate("({hp:RealtimeBattle.state.enemies[0].hp,nums:RealtimeBattle.state.dmgNums.map(n=>n.txt)})")
        await pg.screenshot(path=os.environ.get('SHOT','/tmp/battle_rt_proto_page.png'))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        st3=await pg.evaluate("({ov:!!document.getElementById('rtp-overlay'),on:RealtimeBattle.state.on})")
        # 有存档时：属性只读来自 Game.stats()，战斗前后 G 不变（诊断用 evaluate 建档）
        await pg.evaluate("""()=>{localStorage.removeItem('wbx2_save');Game.newLife({name:'测试',sex:'f',lg:LINGGEN[1].id,talents:[],st:{str:5,con:5,int:5,luck:5,wealth:5,charm:5}});Game.G.realm=3;}""")
        await pg.wait_for_timeout(500)
        st4=await pg.evaluate("""(async()=>{const before=JSON.stringify(Game.G);const s=Game.stats();const h=RealtimeBattle.open(null,{force:true});const S=RealtimeBattle.state;
          const r={src:S.statSrc,max:S.player.max,mhp:Math.round(s.mhp),atk:S.player.atk,sa:Math.round(s.atk),spr:S.player.spr};h.close();await h.done;r.same=JSON.stringify(Game.G)===before;return r;})()""")
        await b.close()
    checks=[('#dev 出现「即时战」按钮',n==1),('点按钮打开覆盖层并开战',st['ov'] and st['on']),('主角用游戏现有精灵且图已加载',st['spr'].startswith('player_') and st['img']),
            ('普攻命中扣血并出伤害飘字',st2['hp']<80 and str(80-st2['hp']) in st2['nums']),('Escape 关闭覆盖层并结束原型',not st3['ov'] and not st3['on']),('有存档时血/攻只读取自 Game.stats()',st4['src']=='game' and st4['max']==st4['mhp'] and st4['atk']==st4['sa'] and st4['spr'].startswith('player_f')),('战斗前后存档 G 不变',st4['same']),('无 JS 错误',not errs)]
    for m,c in checks: print(('PASS ' if c else 'FAIL ')+m)
    print(json.dumps({'st4':st4,'st':st,'st2':st2,'st3':st3,'errs':errs},ensure_ascii=False))
    sys.exit(sum(1 for _,c in checks if not c))
asyncio.run(main())

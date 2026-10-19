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
        await pg.click('#dow-open'); await pg.wait_for_timeout(200)  # 「即时战」按钮已挪到 dev_openworld.js 的「开放世界」面板
        n=await pg.evaluate("document.querySelectorAll('#dow-rt').length")
        await pg.click('#dow-rt'); await pg.wait_for_timeout(1200)
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
        # 灵根 × 武器技能（诊断：evaluate 改测试存档的灵根/武器）
        await pg.evaluate("""()=>{const G=Game.G;G.lg='tian';G.eqs.push({uid:'t_w',slot:'weapon',name:'寒霜剑',rar:1,tier:1,ic:'sword_b',main:{atk:1},aff:[]});G.eq.weapon='t_w';}""")
        st5 = await pg.evaluate("""(async()=>{const h=RealtimeBattle.open([{name:'A',hp:80,x:300,y:250,speed:0,atkCd:99},{name:'B',hp:80,x:300,y:170,speed:0,atkCd:99}],{force:true});const S=RealtimeBattle.state;
          S.player.x=300;S.player.y=320;S.player.faceX=0;S.player.faceY=-1;return {n:S.player.skill.n,key:S.player.skill.key,swap:!!document.querySelector('#rtp-overlay button:nth-of-type(5)')&&[...document.querySelectorAll('#rtp-overlay button')].some(b=>b.textContent==='换')}})()""")
        await pg.keyboard.press('q'); await pg.wait_for_timeout(500)
        st6 = await pg.evaluate("RealtimeBattle.state.enemies.map(e=>[e.hp,e.maxHp])")
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await pg.evaluate("""()=>{const G=Game.G;G.lg='shuang';G.eqs.push({uid:'t_f',slot:'weapon',name:'折扇',rar:1,tier:1,ic:'fan',main:{atk:1},aff:[]});G.eq.weapon='t_f';}""")
        st7 = await pg.evaluate("""(async()=>{RealtimeBattle.open([{name:'A',hp:80,x:300,y:240,speed:0,atkCd:99}],{force:true});const S=RealtimeBattle.state;S.player.x=300;S.player.y=320;S.player.faceX=0;S.player.faceY=-1;
          const k0=S.player.skill.key;const sw=[...document.querySelectorAll('#rtp-overlay button')].find(b=>b.textContent==='换');return {k0,has:!!sw}})()""")
        await pg.click('#rtp-overlay button:text("换")'); await pg.click('#rtp-overlay button:text("技")'); await pg.wait_for_timeout(120)
        st8 = await pg.evaluate("({k:RealtimeBattle.state.player.skill.n,cone:RealtimeBattle.state.fx.some(f=>f.kind==='cone'),burn:RealtimeBattle.state.enemies[0].burnT>0,hp:RealtimeBattle.state.enemies[0].hp,max:RealtimeBattle.state.enemies[0].maxHp})")
        await pg.screenshot(path=os.environ.get('SHOT2','/tmp/battle_rt_skill.png'))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        await b.close()
    checks=[('#dev 出现「即时战」按钮',n==1),('点按钮打开覆盖层并开战',st['ov'] and st['on']),('主角用游戏现有精灵且图已加载',st['spr'].startswith('player_') and st['img']),
            ('普攻命中扣血并出伤害飘字',st2['hp']<80 and str(80-st2['hp']) in st2['nums']),('Escape 关闭覆盖层并结束原型',not st3['ov'] and not st3['on']),('有存档时血/攻只读取自 Game.stats()',st4['src']=='game' and st4['max']==st4['mhp'] and st4['atk']==st4['sa'] and st4['spr'].startswith('player_f')),('战斗前后存档 G 不变',st4['same']),('天灵根+剑 → 技能「庚金剑气·剑」，单灵根无「换」按钮',st5['key']=='metal' and st5['n']=='庚金剑气·剑' and not st5['swap']),
            ('Q 键剑气贯穿：前后两只都掉血',all(h<m for h,m in st6)),
            ('双灵根+扇：默认木、有「换」按钮',st7['k0']=='wood' and st7['has']),
            ('点「换」再点「技」→ 焚天扇火·扇：锥形火焰+灼烧',st8['k']=='焚天扇火·扇' and st8['cone'] and st8['burn'] and st8['hp']<st8['max']),
            ('无 JS 错误',not errs)]
    for m,c in checks: print(('PASS ' if c else 'FAIL ')+m)
    print(json.dumps({'st5':st5,'st6':st6,'st7':st7,'st8':st8,'st4':st4,'st':st,'st2':st2,'st3':st3,'errs':errs},ensure_ascii=False))
    sys.exit(sum(1 for _,c in checks if not c))
asyncio.run(main())

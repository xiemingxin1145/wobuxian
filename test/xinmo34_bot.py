# 3.4 心魔幻境 × 自动机器人（BOT.tick，挂机/多世试玩同款选项逻辑）：金丹圆满起跑 120 秒，核对幻境不卡死、能连续冲关到更高境界
import asyncio, os, sys, json
from playwright.async_api import async_playwright
ROOT=os.path.dirname(os.path.abspath(__file__)); URL='file://'+os.path.abspath(os.path.join(ROOT,'..','www','index.html'))
SECS=int(os.environ.get('XM_BOT_SECS','120'))
async def main():
    errs=[]
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/google/chrome/chrome',args=['--allow-file-access-from-files'])
        pg=await b.new_page(viewport={'width':412,'height':915})
        pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
        await pg.goto(URL); await pg.wait_for_timeout(3000)
        await pg.evaluate("""async()=>{Game.newLife({name:'测试',sex:'m',lg:LINGGEN[1].id,talents:[],st:{str:8,con:8,int:8,luck:5,wealth:5,charm:5}});const G=Game.G;G.flags.awakened=1;G.mingge=[];G.flags.mg33_done=1;G.realm=3;G.stage=3;G.exp=Game.need();G.flags.chShown=99;G.inv.tsf=20;
          document.body.classList.add('ingame');const t=document.getElementById('title');if(t)t.style.display='none';await Game.enterMap('village');
          window._xmlog=[];const c=UI.card;UI.card=function(t){if(/心魔|冲击瓶颈|突破|幻境/.test(t))_xmlog.push(t+'@'+Game.G.realm);return c.apply(this,arguments)};B.speed=6;BOT.on=true;window._bt=setInterval(()=>{try{BOT.tick()}catch(e){console.error('tick '+e)}},150);}""")
        await pg.wait_for_timeout(SECS*1000)
        res=await pg.evaluate("()=>{clearInterval(_bt);const G=Game.G;return {realm:G.realm,dead:!!G.dead,log:_xmlog.slice(0,40),intro:_xmlog.filter(x=>x.startsWith('心魔幻境@')).length,grade:_xmlog.filter(x=>x.startsWith('幻境评级')).length,brk:_xmlog.filter(x=>x.startsWith('冲击瓶颈')).length}}")
        await b.close()
    ok=res['intro']>=1 and res['grade']>=1 and res['brk']>=1 and (res['realm']>3 or res['dead'] or res['brk']>=2)
    print(json.dumps(dict(ok=ok,res=res,errs=errs),ensure_ascii=False,indent=1)); sys.exit(0 if ok and not errs else 1)
asyncio.run(main())

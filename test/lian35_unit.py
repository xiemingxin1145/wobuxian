# 3.5 一键连炼无头单测：炼丹/炼器批量的消耗、上限、成功率与 UI 按钮。
import asyncio, os, sys, json
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www', 'index.html'))
async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': 412, 'height': 915})
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto(URL); await pg.wait_for_timeout(3000)
        res = await pg.evaluate("""async()=>{const o={};
          Game.newLife({name:'测试',sex:'m',lg:LINGGEN[1].id,talents:[],st:{str:5,con:5,int:5,luck:5,wealth:5,charm:5}}); const G=Game.G;
          G.flags.awakened=1; G.realm=3; G.stage=0; if(G.cheat) G.cheat={};
          const r=RECIPES.find(x=>x.lv<=1)||RECIPES[0]; G.alchLv=Math.max(G.alchLv,r.lv);
          for(const [i,c] of Object.entries(r.need)) G.inv[i]=c*4; G.ap=20;
          o.max4=LIAN35.maxAlch(r); G.ap=3; o.maxAp3=LIAN35.maxAlch(r); G.ap=20;
          for(const [i,c] of Object.entries(r.need)) G.inv[i]=c*50; o.maxCap=LIAN35.maxAlch(r);
          // 全成功：rng 恒 0
          for(const [i,c] of Object.entries(r.need)) G.inv[i]=c*5; G.ap=10; const out0=G.inv[r.out]||0; const ac0=G.alchCount||0;
          const a=LIAN35.batchAlch(r,5,0,()=>0); o.allOk=a.runs===5&&a.ok===5&&a.made===5*r.n&&(G.inv[r.out]||0)===out0+5*r.n&&G.ap===5&&G.alchCount===ac0+5;
          o.matsUsed=Object.entries(r.need).every(([i,c])=>(G.inv[i]||0)===0);
          // 全失败：rng 恒 0.999
          for(const [i,c] of Object.entries(r.need)) G.inv[i]=c*3; G.ap=10; const out1=G.inv[r.out]||0;
          const f=LIAN35.batchAlch(r,3,0,()=>0.999); o.allFail=f.runs===3&&f.fail===3&&(G.inv[r.out]||0)===out1&&G.ap===7;
          // 请求超过可炼数会被截断，行动力 0 不炼
          for(const [i,c] of Object.entries(r.need)) G.inv[i]=c*2; G.ap=10; o.trunc=LIAN35.batchAlch(r,10,0,()=>0).runs===2;
          for(const [i,c] of Object.entries(r.need)) G.inv[i]=c*2; G.ap=0; o.noAp=LIAN35.batchAlch(r,2,0,()=>0).runs===0;
          // 连炼成功率 = 中等火候，低于完美火候
          o.qLower=LIAN35.chance(r,LIAN35.Q,0)<=LIAN35.chance(r,1,0);
          // 炼器
          G.cave=G.cave||{zl:0,field:0,forge:0}; G.cave.forge=0; o.forgeLocked=LIAN35.maxForge()===0;
          G.cave.forge=2; G.inv.ore=7; G.inv.yd=5; const cost=LIAN35.forgeCost(); G.stone=cost*10;
          o.forgeMax=LIAN35.maxForge(); const eqs=LIAN35.batchForge(9,()=>0.5);
          o.forge=eqs.length===3&&G.inv.ore===1&&G.inv.yd===2&&G.stone===cost*7&&eqs.every(e=>e.rar>=2);
          G.inv.ore=20; G.inv.yd=20; G.stone=cost*2; o.forgeStone=LIAN35.maxForge()===2;
          // UI：炼丹面板出现连炼按钮并能点
          for(const [i,c] of Object.entries(r.need)) G.inv[i]=c*4; G.ap=10;
          const pr=UI.alchemy(0); await new Promise(z=>setTimeout(z,200));
          const bn=document.querySelector('.mkn'); o.uiBtn=!!bn&&bn.textContent.includes('连炼×4');
          if(bn){bn.click(); await new Promise(z=>setTimeout(z,200)); o.uiRan=G.ap===6;}
          const x=document.querySelector('.panel .x'); if(x) x.click();
          return o;}""")
        await b.close()
    exp = {'max4': 4, 'maxAp3': 3, 'maxCap': 10, 'allOk': True, 'matsUsed': True, 'allFail': True, 'trunc': True, 'noAp': True, 'qLower': True,
           'forgeLocked': True, 'forgeMax': 3, 'forge': True, 'forgeStone': True, 'uiBtn': True, 'uiRan': True}
    fails = [k for k, v in exp.items() if res.get(k) != v]
    print(json.dumps(res, ensure_ascii=False)); print('pageerrors', errs)
    if fails or errs: print('FAIL', fails); sys.exit(1)
    print('lian35_unit ALL PASS')
asyncio.run(main())

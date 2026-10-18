# 3.3 新系统无头单元检查（诊断用：直接调用模块函数核对公式；点按验收见 test/sys33_tap.py）
import asyncio, os, sys, json
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www', 'index.html'))
async def main():
    errs = []; res = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': 412, 'height': 915})
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto(URL); await pg.wait_for_timeout(3000)
        res = await pg.evaluate("""()=>{const o={};
          o.cost3=FB33.cost(3); o.cost5=FB33.cost(5); o.cost8=FB33.cost(8);
          const rolls=[...Array(300)].map(()=>MG33.roll(6)); o.rollLen=rolls.every(r=>r.length===6&&new Set(r).size===6); o.excl=rolls.every(r=>!(r.includes('tianmo')&&r.includes('dao_xin')));
          Game.newLife({name:'测试',sex:'m',lg:LINGGEN[1].id,talents:[],st:{str:5,con:5,int:5,luck:5,wealth:5,charm:5}}); const G=Game.G; o.mgNull=G.mingge===null;
          G.flags.awakened=1; G.realm=3; G.stage=0;
          const s0=Game.stats(); G.mingge=['tieshen']; const s1=Game.stats(); o.tieshen=+(s1.mhp/s0.mhp).toFixed(3);
          const l0=Game.lifeMax(); G.mingge=['changshou']; o.changshou=+(Game.lifeMax()/l0).toFixed(3);
          G.mingge=['nitian']; const b0=G.brkBonus||0; MG33.applyOnce(G); o.nitian=+((G.brkBonus||0)-b0).toFixed(3); MG33.applyOnce(G); o.nitianOnce=+((G.brkBonus||0)-b0).toFixed(3);
          G.mingge=[]; G.fb33={id:'fb_jian',tier:5,spent:0,aff:0}; const a0=s0.atk; o.fbAtk=+(Game.stats().atk/a0).toFixed(3);
          G.fb33.tier=9; G.fb33.aff=100; o.fbSkill=Game.skillList().includes('fbs_jian');
          G.year=4; G.wb33=null; o.spawn=WB33.spawn(); o.wbHp=G.wb33&&G.wb33.hp; o.wbExpect=REALMS[3].need*40;
          G.wb33.dmg=G.wb33.hp*0.16; o.tier16=WB33.tierOf(G.wb33); G.wb33.dmg=G.wb33.hp*0.04; o.tier4=WB33.tierOf(G.wb33);
          o.board1=JSON.stringify(WB33.board(G.wb33)); o.board2=JSON.stringify(WB33.board(G.wb33)); o.boardRepro=o.board1===o.board2; delete o.board1; delete o.board2;
          G.year=5; G.wb33=null; o.noSpawn5=WB33.spawn()===false;
          o.tj=[TJ33.bonusOf(0.24),TJ33.bonusOf(0.25),TJ33.bonusOf(0.5),TJ33.bonusOf(0.75),TJ33.bonusOf(1)].join(',');
          G.kills={slime:1}; G.tj33=null; TJ33.backfill(G); o.tjBack=!!G.tj33.m.slime;
          const D=DAILY33.st(); const d0=D.day; DAILY33.inc('kill',99); const t0=JSON.stringify(D.tasks); DAILY33.off=-3*86400e3; DAILY33.st(); o.dailyNoBack=JSON.stringify(Game.meta.d33.tasks)===t0&&Game.meta.d33.day===d0; DAILY33.off=0;
          D.sign.n=2; D.sign.last=0; DAILY33.devSkip(); DAILY33.devSkip(); DAILY33.devSkip(); o.signKeep=Game.meta.d33.sign.n===2; DAILY33.off=0;
          // ---- 身外化身 HS33 ----
          G.realm=3; G.hs33=null; o.hsLock=!HS33.unlocked()&&HS33.max()===0;
          G.realm=4; G.stage=0; G.exp=0; G.inv=G.inv||{}; G.inv.lz=10; G.cave=G.cave||{zl:0,field:0,forge:0}; G.hs33={clones:[]};
          o.hsMax4=HS33.max()===1; const cost=HS33.craftCost(); o.hsCostExp=cost.exp===Math.round(REALMS[4].need*0.3); o.hsCostLz=cost.lz===3;
          G.exp=cost.exp+50; const lz0=G.inv.lz; HS33.craft(); o.hsCraft1=G.hs33.clones.length===1&&G.inv.lz===lz0-3&&G.exp===50;
          HS33.craft(); o.hsMaxBlock=G.hs33.clones.length===1;
          G.realm=5; G.inv.lz=10; G.exp=HS33.craftCost().exp+10; o.hsMax5=HS33.max()===2; HS33.craft(); o.hsCraft2=G.hs33.clones.length===2;
          // 闭关 need×0.12（公式 + addClosedExp）
          G.realm=4; G.stage=0; G.exp=0; const need4=REALMS[4].need; const got=HS33.addClosedExp(Math.round(need4*0.12));
          o.hsClosed=Math.abs(got-Math.round(need4*0.12))<=1&&Math.abs(G.exp-Math.round(need4*0.12))<=1;
          // 疲劳：yearsOnJob>=3 → mul 0.8；第 4 年产出 −20%
          o.hsFat=HS33.fatigued({yearsOnJob:3})===true&&HS33.fatMul({yearsOnJob:3})===0.8&&HS33.fatMul({yearsOnJob:2})===1;
          G.exp=0; const fatAdd=Math.round(need4*0.12*0.8); const gotF=HS33.addClosedExp(fatAdd); o.hsFatExp=Math.abs(gotF-fatAdd)<=1;
          return o;}""")
        await b.close()
    exp = {'cost3': {'stone': 3194, 'ore': 3, 'yd': 0, 'rate': 0.76}, 'tieshen': 1.1, 'changshou': 1.08, 'nitian': 0.08, 'nitianOnce': 0.08, 'fbAtk': 1.2, 'fbSkill': True, 'tier16': '乙', 'tier4': None, 'boardRepro': True, 'noSpawn5': True, 'mgNull': True, 'rollLen': True, 'excl': True, 'spawn': True, 'tj': '0,0.01,0.02,0.03,0.05', 'tjBack': True, 'dailyNoBack': True, 'signKeep': True, 'hsLock': True, 'hsMax4': True, 'hsCostExp': True, 'hsCostLz': True, 'hsCraft1': True, 'hsMaxBlock': True, 'hsMax5': True, 'hsCraft2': True, 'hsClosed': True, 'hsFat': True, 'hsFatExp': True}
    fails = [k for k, v in exp.items() if (abs(res.get(k) - v) > 0.011 if isinstance(v, float) else res.get(k) != v)]
    if res.get('wbHp') != res.get('wbExpect'): fails.append('wbHp')
    if res['cost5']['yd'] != 1 or res['cost8']['rate'] != 0.4: fails.append('cost5/8')
    out = {'res': res, 'fails': fails, 'errors': errs}; print(json.dumps(out, ensure_ascii=False, indent=1))
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'results'), exist_ok=True)
    json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'results', 'sys33_unit.json'), 'w'), ensure_ascii=False, indent=1)
    sys.exit(len(fails) + len(errs))
asyncio.run(main())

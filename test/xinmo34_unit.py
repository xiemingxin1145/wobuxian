# 3.4 心魔幻境无头单测（research_v33 §7 A7.1–A7.4）：打桩 UI.card / 战斗 / 随机数，只核对触发、评级、成功率加总、debuff
import asyncio, os, sys, json
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www', 'index.html'))
JS = r"""async()=>{const o={}; const PASS=['不是自己挣的钱，不要','问一句：这钱从哪来？','合上箱子','拔剑，与它一战','迎上去','向前一步','“等我回来。”然后转身','轻轻松开手','不回头'];
  Game.newLife({name:'测试',sex:'m',lg:LINGGEN[1].id,talents:[],st:{str:5,con:5,int:5,luck:5,wealth:5,charm:5}}); const G=Game.G; G.flags.awakened=1; G.mingge=[]; G.debt=12345;
  const card0=UI.card, sb0=Game._startBattle, rnd0=Math.random; let log=[], mode='good', brk=1, win=true, lastList=null;
  UI.card=async(t,txt,por,opts)=>{opts=opts||['好']; log.push({t,txt,opts}); if(t==='心魔幻境') return mode==='skip'?1:0; if(t==='冲击瓶颈') return brk;
    if(/^心魔幻境 · /.test(t)){const k=opts.findIndex(x=>PASS.includes(x)); return mode==='good'?k:(k===0?1:0);} return 0;};
  Game._startBattle=async(list)=>{lastList=list; return {res:win?'win':'lose',units:list,killed:win?list:[]}};
  const setup=r=>{G.realm=r;G.stage=3;G.exp=Game.need();G._xm34=null;G.xm34=null;G.tmpBrk=0;G.hp=Game.stats().mhp;};
  const go=async()=>{log=[]; Game._busy=false; Game._breaking=false; await Game.tryBreak(); return log;};
  // A7.1 筑基→金丹不触发
  setup(2); brk=1; await go(); o.noTrig2=!log.some(x=>x.t==='心魔幻境');
  // 金丹→元婴 触发、跳过按钮可见；大成
  setup(3); mode='good'; win=true; brk=1; await go(); const intro=log.find(x=>x.t==='心魔幻境'); o.trig3=!!intro; o.skipVisible=!!(intro&&intro.opts.some(s=>s.startsWith('跳过')));
  o.stages=log.filter(x=>/^心魔幻境 · /.test(x.t)).map(x=>x.t.slice(-1)).join(''); o.battled=!!lastList;
  o.phantom80=lastList?+(lastList[0].atk/Game.stats().atk).toFixed(2):null;
  o.grade3=G._xm34&&G._xm34.g; const bc=log.find(x=>x.t==='冲击瓶颈'); const m=bc&&bc.txt.match(/基础 (-?\d+)% ([+−]) 心魔「(.+?)」(\d+)% = 最终 (\d+)%/);
  o.sumOk=!!m&&(+m[1]+(m[2]==='+'?1:-1)*(+m[4]))===+m[5]&&m[3]==='大成'; o.capOk=!!m&&+m[5]<=97;
  o.debtRef=log.some(x=>x.t.includes('贪')&&x.txt.includes(fmt(12345)));
  // 再等等后保留评级，不重玩
  await go(); o.keepNoReplay=!log.some(x=>x.t==='心魔幻境')&&log.some(x=>x.t==='冲击瓶颈');
  // 痴关引用道侣名（A7.4）
  const pid=Object.keys(NPCS).find(k=>NPCS[k].por&&k!=='mom'); G.partner=pid; setup(3); mode='good'; await go(); const nm=NPCS[pid].n.split('·').pop(); o.partnerRef=log.some(x=>x.t.includes('痴')&&x.txt.includes(nm)); G.partner=null;
  // 沦陷 + 突破失败 → 心魔缠身 3 年、修为 −20%、状态栏显示
  setup(3); mode='bad'; const cm0=Game.cultMult(); Math.random=()=>0.9999; brk=0; await go(); Math.random=rnd0;
  o.grade0Fail=!!G.xm34&&G.xm34.until===G.year+3&&G.realm===3; o.cult80=+(Game.cultMult()/cm0).toFixed(2);
  const bc0=log.find(x=>x.t==='冲击瓶颈'); o.minusShown=!!bc0&&/− 心魔「沦陷」10%/.test(bc0.txt);
  UI.hud(); o.hudDebuff=(document.querySelector('#money')||{}).textContent||''; o.hudDebuff=o.hudDebuff.includes('心魔缠身·剩3年');
  G.year+=3; o.expired=!XM34.active(G); G.xm34=null;
  // 道心无暇保底小成
  setup(3); G.mingge=['dao_xin']; mode='bad'; brk=1; await go(); o.daoxin=G._xm34&&G._xm34.g;
  // 跳过 = 未成（道心无暇时保底小成）
  G.mingge=[]; setup(4); mode='skip'; await go(); o.skip=G._xm34&&G._xm34.g; o.skipNoStage=!log.some(x=>/^心魔幻境 · /.test(x.t));
  // 天魔种：战斗关属性 = 100%
  setup(4); G.mingge=['tianmo']; mode='good'; lastList=null; await go(); o.phantom100=lastList?+(lastList[0].atk/Game.stats().atk).toFixed(2):null; G.mingge=[];
  // 化神→渡劫 也触发；渡劫→飞升走 ascend 不触发
  setup(5); mode='skip'; await go(); o.trig5=log.some(x=>x.t==='心魔幻境');
  UI.card=card0; Game._startBattle=sb0; return o;}"""
async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': 412, 'height': 915})
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto(URL); await pg.wait_for_timeout(3000)
        res = await pg.evaluate(JS)
        await b.close()
    exp = {'noTrig2': True, 'trig3': True, 'skipVisible': True, 'stages': '贪嗔痴', 'battled': True, 'phantom80': 0.8, 'grade3': 3, 'sumOk': True, 'capOk': True,
           'debtRef': True, 'keepNoReplay': True, 'partnerRef': True, 'grade0Fail': True, 'cult80': 0.8, 'minusShown': True, 'hudDebuff': True, 'expired': True,
           'daoxin': 2, 'skip': 1, 'skipNoStage': True, 'phantom100': 1.0, 'trig5': True}
    fails = [k for k, v in exp.items() if res.get(k) != v]
    out = dict(res=res, fails=fails, js_errors=errs)
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'results'), exist_ok=True)
    json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'results', 'xinmo34_unit.json'), 'w'), ensure_ascii=False, indent=1)
    print(json.dumps(out, ensure_ascii=False, indent=1))
    sys.exit(len(fails) + len(errs))
asyncio.run(main())

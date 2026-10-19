# 3.4 江湖自转（life34.js）无头单测：世界月推进 / NPC 跨图 / 宗门涨落与冲突 / 奇遇链 G.debt·G.aff / 存档兼容 / 自动任务安全
# 诊断用：直接调用模块函数（可改江湖状态造场景）；点按验收另见 human 系列。
import asyncio, os, sys, json
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www', 'index.html'))
JS = r"""async()=>{const o={};
  Game.newLife({name:'测试',sex:'m',lg:LINGGEN[1].id,talents:[],st:{str:5,con:5,int:5,luck:5,wealth:5,charm:5}}); const G=Game.G; G.flags.awakened=1; G.realm=1;
  o.noFieldBefore = G.life34===undefined;
  // 存档兼容：残缺的旧字段补默认值
  G.life34={v:1,npcs:{jh_tieguo:{map:'village'}}}; const L0=Life34.ensure(G);
  o.compat = L0.npcs.jh_tieguo.map==='market' && typeof L0.npcs.jh_tieguo.realm==='number' && Object.keys(L0.npcs).length===6 && Array.isArray(L0.feed) && Object.keys(L0.sects).length===Object.keys(SECTS).length;
  delete G.life34; const L=Life34.ensure(G);
  o.validateMapFallback = Life34.mapOf('jh_mozi')==='rift';
  // 推进 40 年（逐月）
  const visited={}; for(const [id] of Life34.CAST) visited[id]=new Set([L.npcs[id].map]);
  const r0={}; for(const [id] of Life34.CAST) r0[id]=L.npcs[id].realm*4+L.npcs[id].stage; const p0={}; for(const k in SECTS) p0[k]=L.sects[k].pow;
  let steps=0, allFeed=[]; let badMap=0;
  for(let m=0;m<480;m++){ G.month=((G.month||0)+1)%12; if(G.month===0) G.year++; const n0=L.feed.length; steps+=Life34.sync(); allFeed=allFeed.concat(L.feed.slice(Math.max(0, n0 - (n0>=Life34.FEED_MAX?1:0)))); for(const [id] of Life34.CAST){ const mp=L.npcs[id].map; visited[id].add(mp); if(mp==='village'||mp==='wendao'||!MAP_ORDER.includes(mp)||(MAPINFO[mp].need||0)>L.npcs[id].realm) badMap++; } }
  o.steps=steps; o.badMap=badMap;
  o.movers=Object.values(visited).filter(s=>s.size>=2).length; o.mapsSeen=new Set(Object.values(visited).flatMap(s=>[...s])).size;
  o.grew=Life34.CAST.filter(([id])=>L.npcs[id].realm*4+L.npcs[id].stage>r0[id]).length;
  const kinds={}; for(const f of L.feed) kinds[f.k]=(kinds[f.k]||0)+1; o.kinds=kinds; o.feedLen=L.feed.length;
  o.sectMoved=Object.keys(SECTS).some(k=>Math.abs(L.sects[k].pow-p0[k])>3); o.wars=Object.values(L.sects).reduce((a,s)=>a+s.wins,0);
  o.idem = Life34.sync()===0;
  o.bigJump = (G.year+=10, Life34.sync()); // 跳 10 年只补 24 个月
  // NPC 真的出现在地图上（且站位可走、与出生点连通）
  L.npcs.jh_tieguo.map='market'; L.npcs.jh_danniang.map='market'; await Game.travel('market', true); Game.refreshNpcs();
  const e=R.ents.find(x=>x.id==='jh_tieguo'), e2=R.ents.find(x=>x.id==='jh_danniang');
  o.onMap=!!e&&!!e2; o.walk=!!e&&walkable(Math.floor(e.i),Math.floor(e.j)); o.apart=!!(e&&e2)&&Math.hypot(e.i-e2.i,e.j-e2.j)>=2;
  Object.assign(L.npcs.jh_danniang,{inj:0,hold:0}); L.npcs.jh_tieguo.hold=1; const rnd0=Math.random; Math.random=()=>0; L.t--; Life34.sync(); Math.random=rnd0; L.npcs.jh_tieguo.hold=0; o.leftMap=L.npcs.jh_danniang.map!=='market'&&!R.ents.find(x=>x.id==='jh_danniang')&&!!R.ents.find(x=>x.id==='jh_tieguo');
  // 奇遇链：铁锅的债（作保 → 一年后还钱 → 吃一锅）
  const card0=UI.card; let pickLbl=null, seen=[]; UI.card=async(t,txt,por,opts)=>{seen.push({t,opts:opts||[]}); if(!opts) return 0; const k=pickLbl?opts.findIndex(x=>x.startsWith(pickLbl)):0; return k<0?0:k;};
  L.npcs.jh_tieguo.map='market'; L.npcs.jh_tieguo.hold=1; G.debt=1000; G.stone=1000; G.aff.jh_tieguo=0;
  o.availStep0=Chain34.avail(G,'jh_tieguo').length===1; o.extraHas=Talk.extra('jh_tieguo').some(([t])=>t.startsWith('⚑ 奇遇·铁锅的债（1/3）'));
  o.notSafe=!SAFE.test(Chain34.label('tieguo')) && !SAFE.test('打听近况') && UNSAFE.test('借他 200 灵石');
  pickLbl='替他作保'; let r=await Chain34.run('tieguo'); o.c1=r; o.c1ok=r.debt[1]===1300&&r.aff[1]===20&&r.next===1&&!r.done;
  o.waitBlocks=Chain34.avail(G,'jh_tieguo').length===0;
  const sv=JSON.parse(JSON.stringify(G)); o.persist=sv.life34.ch.tieguo.s===1&&sv.life34.ch.tieguo.guar===1;
  for(let m=0;m<12;m++){ G.month=((G.month||0)+1)%12; if(G.month===0) G.year++; Life34.sync(); } L.npcs.jh_tieguo.map='market';
  Chain34.st(G,'tieguo').ok=1; pickLbl='收下他还的钱'; r=await Chain34.run('tieguo'); o.c2ok=!!r&&r.debt[1]===1000&&r.next===2;
  for(let m=0;m<3;m++){ G.month=((G.month||0)+1)%12; if(G.month===0) G.year++; Life34.sync(); } L.npcs.jh_tieguo.map='market';
  pickLbl='坐下吃一锅'; const hc0=G.inv.hcd||0; r=await Chain34.run('tieguo'); o.c3ok=!!r&&r.done&&G.flags.tieguo_friend===1&&(G.inv.hcd||0)===hc0+2;
  o.doneNoAvail=Chain34.avail(G,'jh_tieguo').length===0;
  // 铁锅·坏分支：跑路 + 作保利息 +150（只加一次）
  delete L.ch.tieguo; L.npcs.jh_tieguo.map='market'; G.debt=0; pickLbl='替他作保'; await Chain34.run('tieguo'); L.t+=12; const S=Chain34.st(G,'tieguo'); S.ok=0; pickLbl='改日再说'; await Chain34.run('tieguo'); pickLbl='一拳揍过去'; r=await Chain34.run('tieguo'); o.badBranch=G.debt===450&&r.done&&S.out==='beat';
  // 藏宝图：跨 NPC（钱满仓在秘境 → 去找丹娘 → 回秘境）
  L.npcs.jh_xunbao.map='secret'; L.npcs.jh_danniang.map='island'; await Game.travel('secret', true);
  G.stone=50; pickLbl='出 100 灵石入伙'; r=await Chain34.run('cangbao'); o.needBlocks=r.cancelled===true&&Chain34.st(G,'cangbao').s===0;
  G.stone=1000; r=await Chain34.run('cangbao'); o.cb1=r.next===1&&G.stone===900;
  o.cbWrongNpc=Chain34.avail(G,'jh_xunbao').length===0; L.npcs.jh_danniang.map='secret'; o.cbDanniang=Chain34.avail(G,'jh_danniang').length===1;
  pickLbl='出 300 灵石买'; r=await Chain34.run('cangbao'); o.cb2=r.next===2&&G.stone===600;
  const eg0=G.inv.egg||0; pickLbl='五五分账'; r=await Chain34.run('cangbao'); o.cb3=r.done&&(G.inv.egg||0)===eg0+1&&G.aff.jh_xunbao===30;
  UI.card=card0;
  // 江湖风云面板
  UI.panel('life34'); await new Promise(r=>setTimeout(r,600)); const tx=document.body.innerText; o.panel=tx.includes('宗门势力')&&tx.includes('江湖人物')&&tx.includes('铁锅的债')&&tx.includes('江湖传闻');
  return o;}"""
async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': 412, 'height': 915})
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto(URL); await pg.wait_for_timeout(3000)
        res = await pg.evaluate(JS)
        await b.close()
    exp = {'noFieldBefore': True, 'compat': True, 'validateMapFallback': True, 'badMap': 0, 'idem': True, 'bigJump': 24, 'onMap': True, 'walk': True, 'apart': True, 'leftMap': True,
           'availStep0': True, 'extraHas': True, 'notSafe': True, 'c1ok': True, 'waitBlocks': True, 'persist': True, 'c2ok': True, 'c3ok': True, 'doneNoAvail': True, 'badBranch': True,
           'needBlocks': True, 'cb1': True, 'cbWrongNpc': True, 'cbDanniang': True, 'cb2': True, 'cb3': True, 'sectMoved': True, 'panel': True}
    fails = [k for k, v in exp.items() if res.get(k) != v]
    if res.get('steps', 0) < 470: fails.append('steps')
    if res.get('movers', 0) < 4: fails.append('movers')
    if res.get('mapsSeen', 0) < 4: fails.append('mapsSeen')
    if res.get('grew', 0) < 4: fails.append('grew')
    if not res.get('kinds', {}).get('war') and res.get('wars', 0) < 1: fails.append('wars')
    out = dict(res=res, fails=fails, js_errors=errs)
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'results'), exist_ok=True)
    json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'results', 'life34_unit.json'), 'w'), ensure_ascii=False, indent=1, default=str)
    print(json.dumps(out, ensure_ascii=False, indent=1, default=str))
    sys.exit(len(fails) + len(errs))
asyncio.run(main())

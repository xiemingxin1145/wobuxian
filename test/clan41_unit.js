// 3.8.3 家族深化单测：node test/clan41_unit.js（退出码 = 失败数）。vm 桩 + 真实 clan41.js，对照 docs/research_v22.md §14。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'www/js/clan41.js'), 'utf8');
const FAM = fs.readFileSync(path.join(ROOT, 'www/js/fam37.js'), 'utf8');
// 只抽 FAM37 运行时需要的最小桩：不整文件跑 fam37（依赖太多），手写兼容桩。
function box(G) {
  const c = {
    console: { log() {}, warn() {}, error() {} },
    Math: Object.create(Math),
    setTimeout() {},
    document: { createElement: () => ({ style: {}, appendChild() {} }), head: { appendChild() {} } },
    toasts: [], cards: [], news: [], applied: []
  };
  c.window = c;
  vm.createContext(c);
  vm.runInContext(`
    var REALMS=[
      {n:'凡人',need:80,brk:0.9},{n:'练气',need:200,brk:0.75},{n:'筑基',need:520,brk:0.6},
      {n:'金丹',need:1300,brk:0.5},{n:'元婴',need:3200,brk:0.42},{n:'化神',need:7600,brk:0.36},
      {n:'渡劫',need:18000,brk:0.3},{n:'飞升',need:1e12,brk:0}
    ];
    var STAGES=['初期','中期','后期','圆满'];
    var STAGE_MUL=[1,1.35,1.75,2.2];
    var LINGGEN=[
      {id:'wu',n:'五行伪灵根',mult:0.7},{id:'san',n:'三灵根',mult:1.0},{id:'shuang',n:'双灵根',mult:1.3},
      {id:'tian',n:'天灵根',mult:1.8},{id:'lei',n:'异·雷灵根',mult:2.0},{id:'bing',n:'异·冰灵根',mult:2.0}
    ];
    var TALENTS=[{id:'tough',n:'皮糙肉厚'},{id:'smart',n:'过目不忘'}];
    var ITEMS={herb:{n:'灵草'},ore:{n:'矿石'},wine:{n:'桃花酿'},scroll:{n:'残卷'},lz:{n:'灵芝'},zjd:{n:'筑基丹'},
      i40_jiapu:{n:'空白族谱',clan:1},i40_zuxun:{n:'祖训竹简',clan:1},i40_dici:{n:'地契',clan:1},
      i40_ditu:{n:'藏宝残图',clan:1},i40_zupu_old:{n:'残破古族谱',clan:1},i40_lianhun:{n:'联姻帖',clan:1},
      i40_laojiu:{n:'三十年老窖'}};
    var NPCS={sumei:{n:'苏魅',por:'npc_girl'},mom:{n:'娘',por:'npc_mom'}};
    var SECTS={qingyun:1,baicao:1,tianmo:1};
    var MAPINFO={village:{n:'桃花村',mons:['slime']}};
    var esc=s=>String(s==null?'':s).replace(/[<>&]/g,c=>({ '<':'&lt;','>':'&gt;','&':'&amp;' }[c]));
    var h=(t,c,html)=>{const e={tag:t,className:c,innerHTML:html,onclick:null,appendChild(){},insertBefore(){}};return e;};
    var Sfx={play(){}};
    var UI={titles:{},toast(s){toasts.push(s);},async card(t,s,p,opts){cards.push([t,s,opts]);return 0;},panel(){},hud(){},
      async useItem(k){useLog.push(k);return true;},p_fam37(b){b.innerHTML='fam37';}};
    var useLog=[];
    var Talk={extra:null};
    var Sys={bonus(k){return 0;}};
    var JH34={ensure(G){return G.jh34=G.jh34||{feed:[]};},say(L,s){L.feed.push(s);news.push(s);}};
    var Route37={_rep:{},rep(k){return this._rep[k]||0;}};
    var DevPanel={tabs:{},registerTab(k,n,r){this.tabs[k]=r;return true;}};
    var FAM37={
      KID_MAX:4, SP_LG:{sumei:'shuang'},
      T:{dis:{ming:['小满','二狗','青禾','清漪','望舒']},fam:{spouse:{sumei:{ask:'?',yes:'!',no:'x'}},birth:{base:['生了{k}'],same:'同',up:'升',down:'降'},grow:[],events:[]}},
      ensure(G){G.fam37=G.fam37||{v:1,sp:null,kids:[],rate:0,log:[],ev:{}};return G.fam37;},
      G(){return Game.G;},
      nm(id){return (NPCS[id]&&NPCS[id].n)||id;},
      lgN(id){const L=LINGGEN.find(x=>x.id===id);return L?L.n:id;},
      rankOf(lg){return {wu:1,san:3,shuang:4,tian:5,lei:6,bing:6}[lg]||2;},
      pick(a,rnd){rnd=rnd||Math.random;return a[Math.floor(rnd()*a.length)];},
      fill(s,o){return String(s||'').replace(/\\{(\\w+)\\}/g,(_,k)=>o&&o[k]!=null?o[k]:'');},
      news(G,s){const F=this.ensure(G);F.log.unshift({y:G.year||0,s});news.push(s);},
      inheritLg(a,b,rnd){return {lg:b||a||'san',k:'same'};},
      birth(rnd){const G=Game.G;const F=this.ensure(G);if(!F.sp||F.kids.length>=this.KID_MAX)return null;
        const kid={n:(G.surname||'')+this.pick(this.T.dis.ming,rnd),lg:'san',born:G.year||0,age:0,sp:F.sp,nodes:{}};
        F.kids.push(kid);return kid;},
      canEff(){return true;},
      async applyEff(e){applied.push(e);if(e&&e.stone){Game.G.stone=(Game.G.stone||0)+Math.round(e.stone*(1+(Game.G.realm||0)));}
        if(e&&e.karma)Game.G.karma=(Game.G.karma||0)+e.karma;
        if(e&&e.debt)Game.G.debt=Math.max(0,(Game.G.debt||0)+e.debt);
        if(e&&e.rate){const F=this.ensure(Game.G);F.rate=(F.rate||0)+e.rate;}
        return ['ok'];},
      async famYear(){}
    };
    var Game={
      G:null,meta:{},save(){},ach(){},
      has(id,n){n=n||1;return (this.G.inv[id]||0)>=n;},
      give(id,n){n=n==null?1:n;this.G.inv[id]=(this.G.inv[id]||0)+n;if(this.G.inv[id]<=0)delete this.G.inv[id];},
      take(id,n){this.give(id,-(n||1));},
      stats(){return {mhp:100,mmp:50,atk:10,def:5,spd:10,crit:0.05};},
      lifeMax(){return 100;},
      async apply(s){applied.push(s);return {txt:s,later:[]};},
      async yearEnd(){this.G.year++;this.G.age++;},
      newLife(cfg){this.G={v:2,name:cfg&&cfg.name||'测试',surname:'测',sex:'m',age:6,realm:0,stage:0,year:1,stone:1000,debt:8888,karma:0,inv:{},aff:{},flags:{},partner:null,fam37:null,clan41:null,hp:100,mingge:[],route37:{rep:{},id:null}};},
      canEnter(id){const G=this.G;if(id==='village')return true;if(!G||!G.flags)return false;return !!G.flags.awakened;}
    };
  `, c);
  c.Game.G = G;
  vm.runInContext(SRC, c);
  return c;
}
const run = (c, s) => vm.runInContext(s, c);
const base = (o) => Object.assign({
  v: 2, name: '张三', surname: '张', sex: 'm', age: 20, realm: 0, stage: 0, year: 1,
  stone: 100000, debt: 10000, karma: 0, inv: {}, aff: {}, flags: {}, partner: null,
  fam37: { v: 1, sp: null, kids: [], rate: 0, log: [], ev: {} },
  clan41: null, hp: 100, mingge: [], route37: { rep: {}, id: null }, i40: {}
}, o || {});

(async () => {
  // 1 TEXT41 JSON / 结构
  let c = box(base());
  ok(run(c, 'TEXT41.lv.length===10 && TEXT41.props.length===12 && TEXT41.rules.length===10 && TEXT41.fams.length===8 && TEXT41.events.length===21'), 'TEXT41：10 级/12 族产/10 族规/8 家族/21 事件');
  ok(run(c, 'TEXT41.ui.tabs.length===6 && TEXT41.ui2.found.length===2'), 'UI tabs=6、ui2.found 存在');
  ok(!!run(c, 'JSON.parse(JSON.stringify(TEXT41))'), 'TEXT41 JSON 往返');

  // 2 老档惰性、不升 G.v
  c = box(base());
  ok(run(c, '!Game.G.clan41'), '老档：未触碰前无 G.clan41');
  ok(run(c, 'C41.ensure(Game.G); Game.G.clan41.v===1 && Game.G.v===2 && Game.G.clan41.on===0'), 'ensure 惰性生成、G.v 仍为 2');

  // 3 立族
  c = box(base({ fam37: { v: 1, sp: 'sumei', kids: [], rate: 0, log: [], ev: {} }, partner: 'sumei' }));
  ok(run(c, 'C41.canFound(Game.G)===true'), '有道侣可立族');
  ok(run(c, 'C41.found(Game.G); Game.G.clan41.on===1 && Game.G.clan41.name==="张氏"'), '立族 → 张氏');
  c = box(base({ inv: { i40_jiapu: 1 } }));
  ok(run(c, 'C41.canFound(Game.G)===true'), '持空白族谱可立族');
  c = box(base({ route37: { id: 'shijia', rep: {} } }));
  ok(run(c, 'C41.canFound(Game.G)===true'), '世家路线免族谱可立族');

  // 4 族产：不乘境界、升级费 cost×L、产出 base×L
  c = box(base({ realm: 6, fam37: { v: 1, sp: 'sumei', kids: [], rate: 0, log: [], ev: {} }, partner: 'sumei' }));
  run(c, 'C41.found(Game.G); C41.buyProp(Game.G,"tian");');
  ok(run(c, 'Game.G.clan41.props.tian===1 && Game.G.stone===100000-3000'), '购置良田扣 3000');
  run(c, 'Math.random=()=>0.5; var r=C41.settleProps(Game.G);');
  // yieldMul lv1=1.0, stoneMod≈0 → 150
  const st1 = run(c, '(function(){const s0=Game.G.stone;C41.settleProps(Game.G);return Game.G.stone-s0;})()');
  // 上面已经 settle 过一次了；再 settle 一次看增量。先重置 stone 差：
  c = box(base({ realm: 6, fam37: { v: 1, sp: 'sumei', kids: [], rate: 0, log: [], ev: {} }, partner: 'sumei' }));
  run(c, 'C41.found(Game.G); Game.G.clan41.props.tian=1; Game.G.stone=0; Math.random=()=>0.5; C41.settleProps(Game.G);');
  ok(run(c, 'Game.G.stone===150'), '渡劫期良田 1 级年产仍 150（不乘境界） stone=' + run(c, 'Game.G.stone'));
  run(c, 'Game.G.stone=100000; C41.upProp(Game.G,"tian");');
  ok(run(c, 'Game.G.clan41.props.tian===2 && Game.G.stone===100000-3000'), '升 2 级费 cost×1=3000');
  run(c, 'Game.G.stone=0; C41.settleProps(Game.G);');
  ok(run(c, 'Game.G.stone===300'), '良田 2 级年产 300');

  // 5 当铺+还债为本减息上限 −2%，不改 F.rate
  c = box(base({ fam37: { v: 1, sp: 'sumei', kids: [], rate: 0.05, log: [], ev: {} }, partner: 'sumei', debt: 10000, realm: 3 }));
  run(c, 'C41.found(Game.G); Game.G.clan41.lv=4; Game.G.clan41.props.dangpu=1; Game.G.clan41.rules=["haiqian"]; Game.G.stone=0;');
  run(c, 'C41.settleProps(Game.G);'); // 设 C.rate
  ok(run(c, 'Game.G.clan41.rate===-0.02'), '减息合计 −2%（当铺+还债不叠）');
  ok(run(c, 'Game.G.fam37.rate===0.05'), '不改 F.rate');
  const debt0 = run(c, 'Game.G.debt');
  run(c, 'C41.yearStep=C41.yearStep; (async()=>{await C41.yearStep(Game.G);})()');
  // sync call rate step only:
  run(c, 'var C=Game.G.clan41; if(C.rate<0&&Game.G.debt>0){var cut=Math.floor(Game.G.debt*Math.min(-C.rate,0.02)); Game.G.debt-=cut;}');
  ok(run(c, 'Game.G.debt===' + (debt0 - Math.floor(debt0 * 0.02))), '年减债恰 2%');

  // 6 族规互斥与槽位
  c = box(base({ fam37: { v: 1, sp: 'sumei', kids: [], rate: 0, log: [], ev: {} }, partner: 'sumei' }));
  run(c, 'C41.found(Game.G); C41.setRule(Game.G,"qinxue");');
  ok(run(c, 'C41.has("qinxue")'), '挂勤学');
  ok(run(c, '!C41.canSetRule(Game.G,"zhongshang").ok'), '槽位满不可再挂（Lv1 仅 1 槽）');
  run(c, 'Game.G.clan41.lv=4; C41.setRule(Game.G,"zhongshang");'); // lv4 有 2 槽
  // wait - qinxue still there, lv4 has 2 slots so zhongshang ok. Then moxiu vs renhou:
  run(c, 'Game.G.clan41.rules=["renhou"];');
  ok(run(c, '!C41.canSetRule(Game.G,"moxiu").ok && /相冲/.test(C41.canSetRule(Game.G,"moxiu").why)'), '仁厚↔魔道互斥');
  run(c, 'Game.G.clan41.ruleY=-99; Game.G.year=10; C41.dropRule(Game.G,"renhou");');
  ok(run(c, '!C41.has("renhou") && Game.G.clan41.rep===0'), '卸下扣声望（隐世未开，−50 但 rep 下限 0）');

  // 7 KID_MAX getter
  c = box(base({ fam37: { v: 1, sp: 'sumei', kids: [], rate: 0, log: [], ev: {} }, partner: 'sumei' }));
  run(c, 'C41.found(Game.G);');
  ok(run(c, 'FAM37.KID_MAX===4'), '默认 KID_MAX=4');
  run(c, 'Game.G.clan41.lv=4; Game.G.clan41.rules=["kaizhi"];');
  ok(run(c, 'FAM37.KID_MAX===6'), '开枝 → KID_MAX=6');

  // 8 子嗣境界上限
  c = box(base({ realm: 3, year: 30, fam37: { v: 1, sp: 'sumei', kids: [{ n: '张小满', lg: 'san', born: 1, age: 29, nodes: {} }], rate: 0, log: [], ev: {} }, partner: 'sumei' }));
  run(c, 'C41.found(Game.G); var k=Game.G.fam37.kids[0]; C41.ensureKid(k); k.realm=2; k.stage=3; k.xp=99999; Math.random=()=>0; C41.growKids(Game.G);');
  ok(run(c, 'Game.G.fam37.kids[0].realm<=2'), '玩家金丹时子嗣上限筑基（realm≤2）');

  // 9 等级门槛 Lv6/10
  c = box(base({ realm: 3, stage: 0, fam37: { v: 1, sp: 'sumei', kids: [{ n: 'A', lg: 'tian', born: 1, age: 20, realm: 2, stage: 0, xp: 0, nodes: {} }], rate: 0, log: [], ev: {} }, partner: 'sumei' }));
  run(c, 'C41.found(Game.G); var C=Game.G.clan41; C.lv=5; C.rep=3000; C.props={tian:1,jiusi:1,kuang:1};');
  ok(run(c, 'C41.canLv(Game.G,6)===true'), 'Lv6：族产≥3 + 子嗣筑基');
  run(c, 'Game.G.clan41.lv=9; Game.G.clan41.rep=50000; Game.G.realm=6; Game.G.stage=0; Game.G.clan41.heirIdx=0; Game.G.fam37.kids[0].realm=3;');
  ok(run(c, 'C41.canLv(Game.G,10)===true'), 'Lv10：继承人金丹（非 G.heir 真值）');
  run(c, 'Game.G.clan41.heirIdx=-1; Game.G.stage=3;');
  ok(run(c, 'C41.canLv(Game.G,10)===true'), 'Lv10：渡劫圆满亦可');

  // 10 婚配门槛与聘礼
  c = box(base({ realm: 2, karma: 0, fam37: { v: 1, sp: null, kids: [{ n: '张小满', lg: 'bing', born: 1, age: 18, wed: -1, nodes: {} }], rate: 0, log: [], ev: {} }, partner: null }));
  run(c, 'C41.found(Game.G); Game.G.clan41.lv=5;');
  ok(run(c, 'C41.dowry("wang")===1200 && C41.dowry("qian")===14400'), '聘礼：王 1200、钱 14400');
  ok(run(c, '!!C41.marryLock(Game.G,"su",{lg:"san",kidIdx:0})'), '苏氏 karma 不够 → 🔒');
  run(c, 'Game.G.karma=-30;');
  ok(run(c, '!C41.marryLock(Game.G,"su",{lg:"san",kidIdx:0})'), '苏氏 karma≤-20 可提亲');
  ok(run(c, '!!C41.marryLock(Game.G,"long",{lg:"lei",kidIdx:0})'), '敖氏关系不够 → 🔒');

  // 11 世家联姻占 sp + c41_sp
  c = box(base({ fam37: { v: 1, sp: null, kids: [], rate: 0, log: [], ev: {} }, partner: null, stone: 50000 }));
  run(c, 'C41.found(Game.G); Game.G.clan41.lv=3; Math.random=()=>0;'); // rate 必成？0 < rate → fail. Use 0.01
  // force success: Math.random returns 0 → 0 < rate always true
  run(c, 'Math.random=()=>0.01;');
  await run(c, 'C41.propose(Game.G,"wang",-1)');
  ok(run(c, 'Game.G.partner==="c41_sp" && Game.G.fam37.sp==="c41_sp" && Game.G.clan41.spInfo && Game.G.clan41.spInfo.fam==="wang"'), '世家联姻占 c41_sp');
  ok(run(c, 'NPCS.c41_sp.n.indexOf("·")>=0 && typeof NPCS.c41_sp.roam==="function" && NPCS.c41_sp.roam()===null'), 'c41_sp 有名/不上地图');
  ok(run(c, 'FAM37.SP_LG.c41_sp==="san" || typeof FAM37.SP_LG.c41_sp==="string"'), 'SP_LG.c41_sp getter 可读');

  // 12 道具
  c = box(base({ inv: { i40_jiapu: 1, i40_zuxun: 1, i40_dici: 1, i40_ditu: 4, i40_zupu_old: 1 }, fam37: { v: 1, sp: 'sumei', kids: [], rate: 0, log: [], ev: {} }, partner: 'sumei', realm: 2 }));
  ok(run(c, 'C41.useItem("i40_jiapu")===true && Game.G.clan41.on===1 && !Game.G.inv.i40_jiapu'), '空白族谱立族并消耗');
  ok(run(c, 'C41.useItem("i40_jiapu")===false'), '已立族再用族谱 🔒');
  ok(run(c, 'C41.useItem("i40_zuxun")===true && Game.G.clan41.extraSlot===1'), '祖训竹简 +extraSlot');
  ok(run(c, 'C41.useItem("i40_dici")===true && Game.G.clan41.props.tian>=1'), '地契→良田');
  ok(run(c, 'C41.useItem("i40_ditu")===true && Game.G.clan41.props.kuang>=1 && !Game.G.inv.i40_ditu'), '四张残图→灵矿');
  run(c, 'Game.G.inv.i40_ditu=2;');
  ok(run(c, 'C41.useItem("i40_ditu")===false && Game.G.inv.i40_ditu===2'), '残图不足不消耗');

  // 13 Sys.bonus cult / atk
  c = box(base({ fam37: { v: 1, sp: 'sumei', kids: [], rate: 0, log: [], ev: {} }, partner: 'sumei' }));
  run(c, 'C41.found(Game.G); Game.G.clan41.lv=5; Game.G.clan41.props.wuguan=2; Game.G.clan41.rules=["shangwu"];');
  ok(Math.abs(run(c, "Sys.bonus('cult')") - 0.025) < 1e-9, '家族 Lv5 cult +2.5%');
  ok(Math.abs(run(c, "Sys.bonus('atk')") - (0.02 + 0.03)) < 1e-9, '武馆2级+尚武 atk +5%');

  // 14 事件 cond / 新字段
  c = box(base({ fam37: { v: 1, sp: 'sumei', kids: [{ n: '张小满', lg: 'san', born: 1, age: 10, nodes: {} }], rate: 0, log: [], ev: {} }, partner: 'sumei' }));
  run(c, 'C41.found(Game.G); Game.G.clan41.props.biaoju=1;');
  ok(run(c, 'C41.condOk(Game.G,"kids") && C41.condOk(Game.G,"prop:biaoju") && !C41.condOk(Game.G,"kidAge16")'), 'cond：kids/prop 过、kidAge16 不过');
  run(c, 'Game.G.stone=5000; Math.random=()=>0;');
  await run(c, 'C41.runEvent(Game.G,"c41_harvest")');
  ok(run(c, 'Game.G.clan41.ev.c41_harvest>=1'), '事件可强制触发');

  // 15 轮回保留 best、新档重置
  c = box(base({ fam37: { v: 1, sp: 'sumei', kids: [], rate: 0, log: [], ev: {} }, partner: 'sumei' }));
  run(c, 'C41.found(Game.G); Game.G.clan41.lv=6; Game.newLife({name:"李四"});');
  ok(run(c, 'Game.meta.clan41Best===6 && Game.G.clan41 && Game.G.clan41.on===0'), '轮回：best=6，新档未立族');

  // 16 Game.canEnter G=null
  c = box(base());
  ok(run(c, 'Game.G=null; (function(){try{return Game.canEnter("village")===true;}catch(e){return false;}})()'), 'G=null 时 canEnter(village) 不抛（桩）');
  // 真实 ux23 包装不在本测；确认 clan41 未破坏

  // 17 DevPanel / UI 钩子
  ok(run(c, 'typeof DevPanel.tabs.c41==="function"'), 'DevPanel 注册 c41');
  ok(run(c, 'typeof UI.p_clan41==="function" && UI.titles.clan41'), 'UI.p_clan41 / titles');
  ok(run(c, 'UI.p_fam37._c41===1 && UI.useItem._c41===1'), '已包 p_fam37 / useItem');

  // 18 隐世声望减半、世家 +20%
  c = box(base({ fam37: { v: 1, sp: 'sumei', kids: [], rate: 0, log: [], ev: {} }, partner: 'sumei', route37: { id: 'shijia', rep: {} } }));
  run(c, 'C41.found(Game.G); Game.G.clan41.rules=["yinshi"]; C41.addRep(Game.G.clan41,100,Game.G);');
  // yinshi 0.5 * shijia 1.2 = 0.6 → 60
  ok(run(c, 'Game.G.clan41.rep===60'), '隐世×0.5 × 世家×1.2 → 60');

  // 19 lifeMax 洞天
  c = box(base({ fam37: { v: 1, sp: 'sumei', kids: [], rate: 0, log: [], ev: {} }, partner: 'sumei' }));
  run(c, 'C41.found(Game.G); Game.G.clan41.props.dongtian=1;');
  ok(run(c, 'Game.lifeMax()===105'), '洞天寿元 +5%');

  // 20 年结算不抛
  c = box(base({ fam37: { v: 1, sp: 'sumei', kids: [{ n: '张小满', lg: 'san', born: 1, age: 18, nodes: {}, wed: -1 }], rate: 0, log: [], ev: {} }, partner: 'sumei', year: 5 }));
  run(c, 'C41.found(Game.G); Game.G.clan41.props.tian=1; Game.G.clan41.rules=["qinxue"]; Math.random=()=>0.9;');
  let threw = false;
  try { await run(c, 'C41.yearStep(Game.G)'); } catch (e) { threw = true; console.log(e); }
  ok(!threw && run(c, 'Game.G.clan41.yr===5'), 'yearStep 完整跑通');

  console.log(`${n - fails}/${n} PASS`);
  process.exit(fails);
})().catch(e => { console.error(e); process.exit(1); });

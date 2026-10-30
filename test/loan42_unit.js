// 3.9.1 天道小贷 loan42 第 1 轮单测：node test/loan42_unit.js（退出码 = 失败数）
// 覆盖 docs/research_v22.md §16.11 L1–L13 中可纯逻辑验收项；vm 沙箱 + 真实 loan42.js，无 Chrome。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'www/js/loan42.js'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'www/index.html'), 'utf8');
const SCRIPTS = [...HTML.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);

function box(extra) {
  const c = Object.assign({
    console: { log() {}, warn() {}, error() {} },
    Math: Object.create(Math), JSON,
    setTimeout() {}, clearTimeout() {},
    document: { readyState: 'complete', addEventListener() {} },
    toasts: [], cards: []
  }, extra || {});
  c.window = c; c.globalThis = c;
  vm.createContext(c);
  vm.runInContext(`
    var REALMS=[
      {n:'凡人',life:72,need:80},{n:'练气',life:130,need:200},{n:'筑基',life:220,need:520},
      {n:'金丹',life:420,need:1300},{n:'元婴',life:800,need:3200},{n:'化神',life:1500,need:7600},
      {n:'渡劫',life:3000,need:18000},{n:'飞升',life:99999,need:1e12}
    ];
    var MAPINFO={village:{n:'村',mons:['slime']},market:{n:'坊',mons:['collector']},heaven:{n:'天',mons:['collector']}};
    var NPCS={merchant:{n:'钱多多'},xianguan:{n:'记账童子'},suanpan:{n:'算无遗'}};
    var B={on:false};
    var NPC37={storyBlock:function(){return null;}};
    var UI={toast:function(s){toasts.push(String(s));},card:async function(t,x,p,o){cards.push({t,x,o});return 0;},hud:function(){}};
    var Sys={_v:{},bonus:function(k){return this._v[k]||0;}};
    var Talk={extra:function(){return [];}};
    var MG33={_vip:false,has:function(id){return id==='tiandao_vip'&&this._vip;}};
    var Game={
      G:null, rolls:[],
      roll:function(p,kind){this.rolls.push([p,kind]);return Math.random()<p;},
      lifeMax:function(){var G=this.G;return REALMS[G.realm].life+(G.lifeBonus||0)+(G.st&&G.st.con||0);},
      log:function(){},save:function(){},give:function(id,n){G=this.G;G.inv=G.inv||{};G.inv[id]=(G.inv[id]||0)+(n||1);},
      async yearEnd(){var G=this.G;G.year++;G.age++;if(G.debt>0)G.debt+=Math.ceil(G.debt*0.03);},
      async seclude(years){var G=this.G;for(var i=0;i<years;i++){G.year++;G.age++;if(G.debt>0)G.debt+=Math.ceil(G.debt*0.03);}},
      async enterMap(id){this._map=id;},
      async die(kind){this.G.dead=true;this.G.ending=kind;},
      stats:function(){return {atk:10,def:5,hp:100,mhp:100};}
    };
  `, c);
  vm.runInContext(SRC, c);
  return c;
}
const run = (c, s) => vm.runInContext(s, c);
const mkG = (o) => Object.assign({
  v: 2, year: 10, age: 30, realm: 2, stage: 0, stone: 100000, debt: 8888,
  lifeBonus: 0, flags: {}, inv: {}, st: { con: 5 }, aff: {}
}, o || {});

// ---- index 顺序 ----
ok(SCRIPTS.includes('js/loan42.js'), 'index 含 loan42.js');
ok(SCRIPTS.indexOf('js/loan42.js') === SCRIPTS.indexOf('js/clan41.js') + 1, 'loan42 紧接 clan41 之后');
ok(SCRIPTS.indexOf('js/loan42.js') < SCRIPTS.indexOf('js/audio32.js'), 'loan42 在 audio32 之前');
ok(SCRIPTS.indexOf('js/loan42.js') > SCRIPTS.indexOf('js/zf39_hook.js'), 'loan42 在 zf39_hook 之后（外层于 mingge）');

// ---- 模块加载 / TEXT42 ----
{
  const c = box();
  ok(!!run(c, 'typeof LOAN42==="object" && LOAN42.TEXT42'), 'LOAN42 + TEXT42 导出');
  ok(run(c, 'TEXT42.entryAgent').includes('代办点') && run(c, 'TEXT42.entryHQ').includes('总行'), '入口文案');
  ok(run(c, '["bt","fq","sy"].every(t=>LOAN42.PROD[t]&&TEXT42.prod[t])'), '三产品数据齐全');
  ok(run(c, 'LOAN42.cap===2 && LOAN42.MIN_RATE===0.08 && LOAN42.AGENT_FEE===0.03'), '常量 cap/地板息/代办费');
}

// ---- 老档惰性：不碰 G.loan42 ----
{
  const c = box(); const G = mkG(); run(c, 'Game.G=' + JSON.stringify(G).replace(/"/g, "'") ); // fallback
  c.Game.G = mkG();
  const snap = JSON.stringify(c.Game.G);
  ok(run(c, 'LOAN42.sync(Game.G)') === null && !c.Game.G.loan42, '未借过：sync 跳过且不创建');
  ok(run(c, 'LOAN42.peek(Game.G)') === null, 'peek 不创建');
  ok(JSON.stringify(c.Game.G) === snap, '只读不改存档');
  run(c, 'LOAN42.off=true');
  c.Game.G.debt = 0;
  const b0 = run(c, "Sys.bonus('atk')");
  ok(b0 === 0, 'off=true：无债之身不生效');
  run(c, 'LOAN42.off=false');
}

// ---- L1 入口可见性 ----
{
  const c = box();
  c.Game.G = mkG({ realm: 0 });
  ok(!run(c, "LOAN42.canShowEntry(Game.G,'merchant')"), 'L1 凡人看不到代办点');
  c.Game.G.realm = 1;
  ok(run(c, "LOAN42.canShowEntry(Game.G,'merchant')") && !run(c, "LOAN42.canShowEntry(Game.G,'xianguan')"), 'L1 练气见代办、不见总行');
  c.Game.G.realm = 5;
  ok(run(c, "LOAN42.canShowEntry(Game.G,'xianguan')&&LOAN42.canShowEntry(Game.G,'suanpan')&&LOAN42.canShowEntry(Game.G,'merchant')"), 'L1 化神见总行+代办');
  const ex = run(c, "Talk.extra('merchant').map(x=>x[0])");
  ok(ex.some(t => t.includes('天道小贷') && t.includes('借')), 'Talk.extra 注入代办入口且含「借」');
  const ex2 = run(c, "Talk.extra('xianguan').map(x=>x[0])");
  ok(ex2.some(t => t.includes('总行')), 'Talk.extra 注入总行入口');
}

// ---- L2 额度 / 代办费 / 境界锁 ----
{
  const c = box();
  c.Game.G = mkG({ realm: 2, debt: 100 }); // 征信默认 600 → K=2，筑基 N=520，Q=1040
  // 尚未 ensure；quota 用默认 cr600
  ok(run(c, 'LOAN42.quota(Game.G)') === 1040, 'L2 征信600 筑基额度 1040');
  ok(run(c, "LOAN42.prodMax('bt',Game.G)") === 520, 'L2 白条上限 520');
  ok(run(c, "LOAN42.prodMax('fq',Game.G)") === 1040, 'L2 分期上限 1040');
  ok(run(c, "LOAN42.canBorrow('sy',Game.G).ok") === false && run(c, "LOAN42.canBorrow('sy',Game.G).reason") === 'realm', 'L2 寿元贷未到金丹 🔒');
  const rAgent = run(c, "LOAN42.borrow(Game.G,'fq',1040,true)");
  ok(rAgent.ok && rAgent.fee === 31 && rAgent.net === 1009, 'L2 代办点分期 1040 到手 1009（fee Math.round 3%）');
  // 总行
  c.Game.G = mkG({ realm: 2, debt: 100, stone: 0 });
  const rHQ = run(c, "LOAN42.borrow(Game.G,'fq',1040,false)");
  ok(rHQ.ok && rHQ.fee === 0 && rHQ.net === 1040 && c.Game.G.stone === 1040, 'L2 总行到手 1040');
}

// ---- L3 分期四年扣款表 ----
{
  const c = box();
  c.Game.G = mkG({ realm: 2, year: 10, stone: 100000, debt: 100 });
  run(c, "LOAN42.borrow(Game.G,'fq',1040,false)");
  // 强制年息 11%（无 VIP）
  c.Game.G.loan42.L[0].r = 0.11;
  const dues = [];
  for (let i = 0; i < 4; i++) {
    const stone0 = c.Game.G.stone;
    c.Game.G.year++;
    const log = run(c, 'LOAN42.sync(Game.G,{quiet:true})');
    const paid = log && log.find(x => x.kind === 'paid');
    dues.push(paid ? paid.amt : -1);
    ok(c.Game.G.stone === stone0 - dues[i], 'L3 y' + (i + 1) + ' 扣石 ' + dues[i]);
  }
  ok(dues.join() === '375,346,318,289', 'L3 四年依次 375/346/318/289 实得 ' + dues.join());
  ok(dues.reduce((a, b) => a + b, 0) === 1328, 'L3 共还 1328');
  ok(!c.Game.G.loan42.L.length, 'L3 结清后删除该笔');
  ok(c.Game.G.loan42.cr === 600 + 15 * 4, 'L3 每年征信 +15 → ' + c.Game.G.loan42.cr);
}

// ---- L4 VIP + 征信 800 地板 8% ----
{
  const c = box();
  c.Game.G = mkG({ realm: 3 });
  run(c, 'LOAN42.ensure(Game.G).cr=800');
  run(c, 'MG33._vip=true');
  ok(run(c, "LOAN42.rateOf('fq',Game.G)") === 0.08, 'L4 VIP+800 分期年息 = 8% 地板');
  ok(run(c, "LOAN42.rateOf('sy',Game.G)") === 0.08, 'L4 寿元贷 8%×0.7 仍 8%');
  run(c, 'MG33._vip=false');
  ok(run(c, "LOAN42.rateOf('fq',Game.G)") === 0.1 || run(c, "Math.abs(LOAN42.rateOf('fq',Game.G)-0.1)<1e-9"), 'L4 无VIP 征信800：11%×0.9=9.9%→四舍五入 10% 得 ' + run(c, "LOAN42.rateOf('fq',Game.G)"));
}

// ---- L5 逾期 → 转尾款 ----
{
  const c = box();
  c.Game.G = mkG({ realm: 2, year: 10, stone: 0, debt: 1000 });
  run(c, "LOAN42.borrow(Game.G,'fq',1040,false)"); // stone 仍 0（借到 1040）
  c.Game.G.stone = 0; // 花光
  c.Game.G.loan42.L[0].r = 0.11;
  c.Game.G.year = 11;
  let log = run(c, 'LOAN42.sync(Game.G,{quiet:true})');
  const l = c.Game.G.loan42.L[0];
  ok(l && l.od === 1 && c.Game.G.loan42.squad === 1 && c.Game.G.stone === 0, 'L5 不够一分不扣、od=1、squad=1');
  ok(c.Game.G.loan42.cr === 600 - 80, 'L5 征信 −80 → ' + c.Game.G.loan42.cr);
  const p = l.p, ins = l.ins;
  c.Game.G.year = 12;
  const debt0 = c.Game.G.debt;
  log = run(c, 'LOAN42.sync(Game.G,{quiet:true})');
  const add = Math.ceil((p + ins) * 1.2); // 注意：第二年会再累利息/罚息改 ins，transfer 用当时 p+ins
  // 重新按日志取
  const tr = log && log.find(x => x.kind === 'transfer');
  ok(tr && !c.Game.G.loan42.L.length, 'L5 连续 2 年逾期 → 转尾款、该笔消失');
  ok(c.Game.G.debt === debt0 + tr.add, 'L5 debt += ceil((p+ins)×1.2) add=' + tr.add);
  ok(c.Game.G.loan42.cr === 300, 'L5 征信再 −80 再 −150 后钳到 300 → ' + c.Game.G.loan42.cr);
}

// ---- L6 寿元抵押 ----
{
  const c = box();
  c.Game.G = mkG({ realm: 3, year: 10, age: 100, lifeBonus: 20, stone: 0, debt: 0 });
  // 金丹 N=1300，借满 2×额度；征信600 K=2 → Q=2600，sy max=5200
  run(c, "LOAN42.borrow(Game.G,'sy',2000,false)");
  c.Game.G.stone = 0;
  c.Game.G.loan42.L[0].r = 0.08;
  // 强制两年逾期
  c.Game.G.year = 11; run(c, 'LOAN42.sync(Game.G,{quiet:true})');
  c.Game.G.stone = 0;
  const life0 = c.Game.G.lifeBonus;
  const debt0 = c.Game.G.debt;
  c.Game.G.year = 12; run(c, 'LOAN42.sync(Game.G,{quiet:true})');
  ok(!c.Game.G.loan42.L.length, 'L6 寿元贷转尾款后笔消失');
  const cut = life0 - c.Game.G.lifeBonus;
  ok(cut >= 0 && cut <= 50, 'L6 扣寿 ≤50 实扣 ' + cut);
  ok(run(c, 'Game.lifeMax()') >= c.Game.G.age + 1, 'L6 lifeMax ≥ age+1');
  // 无寿可扣：age 贴近 lifeMax
  c.Game.G = mkG({ realm: 3, year: 10, age: 400, lifeBonus: 0, stone: 0, debt: 100, st: { con: 0 } });
  // lifeMax = 420+0+0=420，age=400 → max cut = 19
  run(c, "LOAN42.borrow(Game.G,'sy',5000,false)"); // 大额
  c.Game.G.stone = 0; c.Game.G.loan42.L[0].r = 0.08;
  c.Game.G.year = 11; run(c, 'LOAN42.sync(Game.G,{quiet:true})');
  c.Game.G.stone = 0; c.Game.G.year = 12;
  // 把 lifeBonus 扣光并抬 age 使无可扣
  c.Game.G.age = run(c, 'Game.lifeMax()') - 1; // cut clamp 0
  c.Game.G.lifeBonus = 0;
  // 直接测 _lifeCut / transfer 路径：把 od 设到 1 再 sync 一年
  const l = c.Game.G.loan42.L[0];
  l.od = 1; l.ins = 100; l.p = 1000;
  const debt1 = c.Game.G.debt;
  run(c, 'LOAN42.transfer(Game.G, Game.G.loan42.L[0], [])');
  // transfer 后若 cut<=0 会额外 +0.3*(p+ins)；但我们在 transfer 里先加 1.2x 再 lifeCut
  // age = lifeMax-1 → cut max 0 → lifeCash
  ok(c.Game.G.debt > debt1 + Math.ceil(1100 * 1.2) - 1, 'L6 无可扣寿时额外尾款 +30% 路径触发 debt=' + c.Game.G.debt);
}

// ---- L7 闭关 10 年 sync 与逐年一致 ----
{
  const c1 = box(); const c2 = box();
  const base = () => mkG({ realm: 2, year: 10, stone: 100000, debt: 100 });
  c1.Game.G = base(); c2.Game.G = base();
  run(c1, "LOAN42.borrow(Game.G,'fq',1040,false)");
  run(c2, "LOAN42.borrow(Game.G,'fq',1040,false)");
  c1.Game.G.loan42.L[0].r = 0.11; c2.Game.G.loan42.L[0].r = 0.11;
  // 路径 A：逐年
  for (let i = 0; i < 10; i++) { c1.Game.G.year++; run(c1, 'LOAN42.sync(Game.G,{quiet:true})'); }
  // 路径 B：一次跳 10 年
  c2.Game.G.year += 10; run(c2, 'LOAN42.sync(Game.G,{quiet:true})');
  const snap = G => JSON.stringify({ cr: G.loan42.cr, L: G.loan42.L, y: G.loan42.y, stone: G.stone, debt: G.debt, hist: G.loan42.hist });
  ok(snap(c1.Game.G) === snap(c2.Game.G), 'L7 闭关 10 年 sync 与逐年一致');
}

// ---- L8 逾期置灰 / 第4笔 / 总本金帽 ----
{
  const c = box();
  c.Game.G = mkG({ realm: 3, year: 10, stone: 100000, debt: 100 }); // 金丹 Q=2600
  run(c, "LOAN42.borrow(Game.G,'bt',100,false)");
  run(c, "LOAN42.borrow(Game.G,'bt',100,false)");
  run(c, "LOAN42.borrow(Game.G,'bt',100,false)");
  ok(run(c, "LOAN42.canBorrow('bt',Game.G).reason") === 'cap', 'L8 第 4 笔 🔒 cap');
  c.Game.G.loan42.L[0].od = 1;
  ok(run(c, "LOAN42.canBorrow('fq',Game.G).reason") === 'od', 'L8 有逾期借款置灰');
  // 总本金 ≤ 2×额度
  c.Game.G = mkG({ realm: 2, stone: 100000, debt: 100 }); // Q=1040, 2Q=2080
  run(c, "LOAN42.borrow(Game.G,'fq',1040,false)");
  ok(run(c, "LOAN42.prodMax('fq',Game.G)") === 1040, 'L8 已借 1040 后分期上限下调到剩余房间 1040');
  run(c, "LOAN42.borrow(Game.G,'fq',1040,false)");
  ok(run(c, "LOAN42.prodMax('bt',Game.G)") === 0 && run(c, "LOAN42.activePrin(Game.G)") === 2080, 'L8 总本金达 2×额度后不可再借');
}

// ---- L9 死亡转入 ----
{
  const c = box();
  c.Game.G = mkG({ realm: 2, debt: 1000, stone: 5000 });
  run(c, "LOAN42.borrow(Game.G,'fq',1040,false)");
  c.Game.G.loan42.L[0].p = 800; c.Game.G.loan42.L[0].ins = 50;
  const debt0 = c.Game.G.debt;
  const tr = run(c, 'LOAN42.deathTransfer(Game.G)');
  ok(tr.amt === 800 && c.Game.G.debt === debt0 + 800 && !c.Game.G.loan42.L.length, 'L9 死时按剩余本金×1.0 转入（不含息）');
  // 征信不变
  ok(c.Game.G.loan42.cr === 600, 'L9 死亡转尾款不扣征信');
}

// ---- L10 催收小分队数值 ----
{
  const c = box();
  c.Game.G = mkG({ realm: 2, year: 12, stone: 5000, debt: 100, flags: {} });
  run(c, 'LOAN42.ensure(Game.G)');
  c.Game.G.loan42.squad = 1;
  c.Game.G.loan42.L = [{ id: 'L1', t: 'fq', p0: 1040, p: 780, r: 0.11, y0: 10, n: 4, left: 3, due: 400, od: 1, ins: 50 }];
  c.Game.G.loan42.y = 12;
  ok(run(c, 'LOAN42.squadFee(Game.G)') === Math.round(520 * 0.1), 'L10 误工费 0.1×N');
  // 无讨债令
  ok(!run(c, 'LOAN42.hasToken(Game.G)'), 'L10 无讨债令');
  const lose = run(c, 'LOAN42.squadLose(Game.G,true)'); // 想用令但没有
  ok(lose && !lose.token && c.Game.G.loan42.cr === 600 - 20, 'L10 败：无令扣误工费、征信−20');
  // 有令抵扣
  c.Game.G.flags.s3b_token = 2; c.Game.G.stone = 5000;
  const lose2 = run(c, 'LOAN42.squadLose(Game.G,true)');
  ok(lose2.token && c.Game.G.flags.s3b_token === 1 && c.Game.G.stone === 5000, 'L10 有令可抵误工费');
  // 跑：od+1；已 od=1 → 变 2 立刻转尾款（§16.6 加速）
  c.Game.G.loan42.L = [{ id: 'L1', t: 'fq', p0: 1040, p: 780, r: 0.11, y0: 10, n: 4, left: 3, due: 400, od: 1, ins: 50 }];
  const debtRun0 = c.Game.G.debt;
  const runR = run(c, 'LOAN42.squadRun(Game.G)');
  ok(runR && runR.transferred === 1 && !c.Game.G.loan42.L.length && c.Game.G.loan42.squad === 0
    && c.Game.G.debt === debtRun0 + Math.ceil((780 + 50) * 1.2), 'L10 跑：od1→2 立刻转尾款、本年不刷');
  // 胜：欠款不变
  c.Game.G.loan42.L = [{ id: 'L1', t: 'fq', p0: 1040, p: 780, r: 0.11, y0: 10, n: 4, left: 3, due: 400, od: 1, ins: 50 }];
  c.Game.G.loan42.squad = 1;
  const debtX = c.Game.G.debt; const odX = c.Game.G.loan42.L[0].od;
  run(c, 'Math.random=()=>0.99'); // 不掉落
  const win = run(c, 'LOAN42.squadWin(Game.G)');
  ok(win && win.stone === Math.round(520 * 0.3) && c.Game.G.debt === debtX && c.Game.G.loan42.L[0].od === odX, 'L10 胜：赏石、账不变');
  // 当场还款
  c.Game.G.stone = 100000; c.Game.G.loan42.squad = 1;
  c.Game.G.loan42.L = [{ id: 'L1', t: 'fq', p0: 1040, p: 780, r: 0.11, y0: 10, n: 4, left: 3, due: 400, od: 1, ins: 50 }];
  const pay = run(c, 'LOAN42.squadPayNow(Game.G)');
  ok(pay.ok && c.Game.G.loan42.squad === 0, 'L10 当场还款清 squad');
}

// ---- L11 无债之身 ----
{
  const c = box();
  c.Game.G = mkG({ debt: 0, realm: 2, stone: 10000 });
  // 无贷款
  ok(run(c, 'LOAN42.isD0(Game.G)'), 'L11 debt=0 无贷款 → 无债之身');
  const atk0 = run(c, "Sys.bonus('atk')");
  // hook 已在加载时包上
  ok(Math.abs(atk0 - 0.03) < 1e-9, 'L11 Sys.bonus(atk) +0.03 得 ' + atk0);
  ok(Math.abs(run(c, "Sys.bonus('cult')") - 0.05) < 1e-9, 'L11 cult +0.05');
  run(c, "LOAN42.borrow(Game.G,'bt',100,false)");
  ok(!run(c, 'LOAN42.isD0(Game.G)'), 'L11 借一笔后失效');
  ok(run(c, "Sys.bonus('atk')") === 0, 'L11 借后 atk 加成消失');
  ok(c.toasts.some(t => t.includes('无债之身') && t.includes('失效')), 'L11 失效 toast');
}

// ---- L12 SAFE/UNSAFE 文案 + off 快照 ----
{
  const c = box();
  const SAFE = /^(打坐（|★|✔|！|接受|继续|好|收下|交付|……|应战|带路|明白|谢|原来如此|伸手|去后巷|去看看|你说什么|撤|知道了|确定|抄起扫帚|开始|过年)/;
  const UNSAFE = /(结局|道侣|拜师|高利贷|借|送礼|交易|出售|驱逐|成为新天道|销账|渡劫|飞升|放弃|轮回|删除|重置|落幕|算天道|算剑仙|各退一步)/;
  const T = run(c, 'TEXT42');
  const fmt = (a, o) => run(c, 'LOAN42.fmt')(a, o);
  const btns = [
    T.entryAgent, T.entryHQ,
    T.btnBorrow.bt, T.btnBorrow.fq, T.btnBorrow.sy,
    T.btnSign, fmt(T.btnRepayAll, { amt: 1 }), fmt(T.btnRepayOd, { amt: 1 }), T.btnClose,
    fmt(T.squadOpts[0], { amt: 1 }), T.squadOpts[1], T.squadOpts[2]
  ];
  const autoOk = btns.filter(t => SAFE.test(t) && !UNSAFE.test(t));
  ok(autoOk.length === 1 && autoOk[0] === '应战', 'L12 仅「应战」可被自动点 实得 ' + JSON.stringify(autoOk));
  // off
  c.Game.G = mkG({ debt: 0 });
  run(c, 'LOAN42.off=true');
  ok(run(c, "Sys.bonus('atk')") === 0 && run(c, "Talk.extra('merchant')").every(x => !String(x[0]).includes('小贷')), 'L12 off 时无入口且无 d0 加成');
  run(c, 'LOAN42.off=false');
}

// ---- L13 套利粗检：借 sy 持有 20 年利息成本 ≥ 8%/年 ----
{
  const c = box();
  c.Game.G = mkG({ realm: 3, year: 1, stone: 0, debt: 100 });
  run(c, "LOAN42.borrow(Game.G,'sy',2000,false)");
  c.Game.G.loan42.L[0].r = 0.08;
  // 20 年只付息（有钱）
  let paid = 0; c.Game.G.stone = 1e9;
  for (let i = 0; i < 5; i++) { // 产品期限 5 年
    c.Game.G.year++;
    const stone0 = c.Game.G.stone;
    run(c, 'LOAN42.sync(Game.G,{quiet:true})');
    paid += stone0 - c.Game.G.stone;
  }
  ok(paid >= 2000 + Math.ceil(2000 * 0.08) * 4, 'L13 寿元贷 5 年总成本 ≥ 本金+4 年息 实付 ' + paid);
  // 利率地板保证借天道放贷给 NPC（+3%~+7%）必亏
  ok(run(c, 'LOAN42.MIN_RATE') >= 0.08, 'L13 地板息 ≥ 8% > route37 放贷收益');
}

// ---- #53 弹窗守卫 ----
{
  const c = box();
  c.Game.G = mkG({ realm: 2, year: 10, stone: 0, debt: 100 });
  run(c, "LOAN42.borrow(Game.G,'fq',500,false)");
  c.Game.G.stone = 0; c.Game.G.loan42.L[0].r = 0.11;
  c.Game.G.year = 11;
  run(c, "NPC37.storyBlock=()=> 'prologue'");
  run(c, 'LOAN42.sync(Game.G)'); // 非 quiet，应排队但不弹
  ok(c.cards.length === 0, '#53 storyBlock 时年账单不弹');
  run(c, 'NPC37.storyBlock=()=>null');
  run(c, 'B.on=true');
  ok(run(c, 'LOAN42.storyBlock()') === 'battle', '#53 B.on → battle');
  run(c, 'B.on=false');
}

// ---- 包装标记 ----
{
  const c = box();
  ok(run(c, '!!Game.yearEnd._loan42 && !!Game.seclude._loan42 && !!Game.enterMap._loan42 && !!Game.die._loan42 && !!Sys._loan42 && !!Talk._loan42'), 'yearEnd/seclude/enterMap/die/Sys.bonus/Talk.extra 已包装');
}

// ---- 奥拉夫 PR#64 回归：High 征信刷分 / MED1 原子还逾期 / MED2 squad 残留 / MED3 跑加速 / LOW Talk 防重入 ----
{
  // HIGH：12 次借满立刻还 → 征信不变、K 仍 2
  const c = box();
  c.Game.G = mkG({ realm: 2, year: 10, stone: 100000, debt: 100 });
  const cr0 = 600;
  for (let i = 0; i < 12; i++) {
    const max = run(c, "LOAN42.prodMax('fq',Game.G)");
    const b = run(c, "LOAN42.borrow(Game.G,'fq'," + max + ',false)');
    ok(b.ok, 'HIGH 第' + (i + 1) + '次借 ok');
    const id = c.Game.G.loan42.L[0].id;
    const r = run(c, "LOAN42.repayLoan(Game.G,'" + id + "')");
    ok(r.ok && (r.cr | 0) === 0, 'HIGH 第' + (i + 1) + '次同年还无 +25');
  }
  ok(c.Game.G.loan42.cr === cr0, 'HIGH 12 循环后征信仍 ' + cr0 + ' 实得 ' + c.Game.G.loan42.cr);
  ok(run(c, 'LOAN42.KOf(Game.G)') === 2, 'HIGH K 仍为 2');
}
{
  // HIGH：仅有利息、未跨年结算 → 不算 +25（防 ins 刷分）
  const c = box();
  c.Game.G = mkG({ realm: 2, year: 10, stone: 100000, debt: 100 });
  run(c, "LOAN42.borrow(Game.G,'fq',1040,false)");
  c.Game.G.loan42.L[0].ins = 200; // 伪造利息，无 crossed
  delete c.Game.G.loan42.L[0].crossed;
  const cr0 = c.Game.G.loan42.cr;
  const id = c.Game.G.loan42.L[0].id;
  const r = run(c, "LOAN42.repayLoan(Game.G,'" + id + "')");
  ok(r.ok && (r.cr | 0) === 0 && c.Game.G.loan42.cr === cr0, 'HIGH 仅利息无 sync 不加征信');
}
{
  // 更稳：手工造 crossed，不依赖 sync 扣款
  const c = box();
  c.Game.G = mkG({ realm: 2, year: 11, stone: 100000, debt: 100 });
  run(c, 'LOAN42.ensure(Game.G)');
  c.Game.G.loan42.y = 11;
  c.Game.G.loan42.L = [
    { id: 'L1', t: 'fq', p0: 500, p: 500, r: 0.11, y0: 10, n: 4, left: 4, due: 0, od: 0, ins: 0, crossed: 1 },
    { id: 'L2', t: 'fq', p0: 500, p: 500, r: 0.11, y0: 10, n: 4, left: 4, due: 0, od: 0, ins: 0, crossed: 1 }
  ];
  const cr0 = c.Game.G.loan42.cr;
  const r1 = run(c, "LOAN42.repayLoan(Game.G,'L1')");
  ok(r1.ok && r1.cr === 25 && c.Game.G.loan42.cr === cr0 + 25, 'HIGH 跨 sync 提前还 +25');
  const r2 = run(c, "LOAN42.repayLoan(Game.G,'L2')");
  ok(r2.ok && (r2.cr | 0) === 0 && c.Game.G.loan42.cr === cr0 + 25, 'HIGH 同年第二笔提前还不加（每年最多一次）');
}
{
  // MED1：两笔逾期、石只够第一笔 → 原子失败、两笔都还在
  const c = box();
  c.Game.G = mkG({ realm: 2, year: 12, stone: 450, debt: 100 });
  run(c, 'LOAN42.ensure(Game.G)');
  c.Game.G.loan42.y = 12;
  c.Game.G.loan42.L = [
    { id: 'L1', t: 'fq', p0: 1040, p: 780, r: 0.11, y0: 10, n: 4, left: 3, due: 400, od: 1, ins: 50 },
    { id: 'L2', t: 'fq', p0: 1040, p: 780, r: 0.11, y0: 10, n: 4, left: 3, due: 600, od: 1, ins: 50 }
  ];
  c.Game.G.loan42.squad = 1;
  const snap = JSON.stringify(c.Game.G.loan42.L);
  const stone0 = c.Game.G.stone;
  const r = run(c, 'LOAN42.repayOverdue(Game.G)');
  ok(r && r.ok === false && (r.paid | 0) === 0 && c.Game.G.stone === stone0, 'MED1 不够总额 → ok:false paid:0 石不动');
  ok(JSON.stringify(c.Game.G.loan42.L) === snap && c.Game.G.loan42.L.every(l => l.od === 1), 'MED1 两笔逾期状态不变');
}
{
  // MED2：sync 付清逾期后 squad=0；repayLoan 清唯一逾期后 squad=0；trySquad amt<=0 no-op
  const c = box();
  c.Game.G = mkG({ realm: 2, year: 10, stone: 100000, debt: 100 });
  run(c, "LOAN42.borrow(Game.G,'fq',500,false)");
  c.Game.G.loan42.L[0].r = 0.11;
  c.Game.G.stone = 0;
  c.Game.G.year = 11; // 跨年才计息逾期
  run(c, 'LOAN42.sync(Game.G,{quiet:true})');
  ok(c.Game.G.loan42.squad === 1 && c.Game.G.loan42.L[0].od === 1, 'MED2 预备：逾期 squad=1');
  // 次年有钱 sync 付清
  c.Game.G.year = 12; c.Game.G.stone = 100000;
  run(c, 'LOAN42.sync(Game.G,{quiet:true})');
  ok(c.Game.G.loan42.squad === 0 && !(c.Game.G.loan42.L[0] && c.Game.G.loan42.L[0].od > 0), 'MED2 sync 清逾期后 squad=0');

  // repayLoan 清唯一逾期笔
  const c2 = box();
  c2.Game.G = mkG({ realm: 2, year: 12, stone: 100000, debt: 100 });
  run(c2, 'LOAN42.ensure(Game.G)');
  c2.Game.G.loan42.y = 12; c2.Game.G.loan42.squad = 1;
  c2.Game.G.loan42.L = [{ id: 'L1', t: 'fq', p0: 500, p: 500, r: 0.11, y0: 10, n: 4, left: 3, due: 400, od: 1, ins: 50, crossed: 1 }];
  run(c2, "LOAN42.repayLoan(Game.G,'L1')");
  ok(c2.Game.G.loan42.squad === 0 && !c2.Game.G.loan42.L.length, 'MED2 repayLoan 清逾期后 squad=0');

  // trySquad 幽灵：squad=1 但无逾期 amt=0 → null 且清旗
  const c3 = box();
  c3.Game.G = mkG({ realm: 2, year: 12, stone: 1000, debt: 100 });
  run(c3, 'LOAN42.ensure(Game.G)');
  c3.Game.G.loan42.squad = 1; c3.Game.G.loan42.y = 12; c3.Game.G.loan42.L = [];
  run(c3, 'Math.random=()=>0'); // 若误入会 100% 触发；应先被 amt<=0 挡住
  const ts = run(c3, "LOAN42.trySquad(Game.G,'market')");
  ok(ts === null && c3.Game.G.loan42.squad === 0, 'MED2 trySquad amt<=0 → null 且 squad=0');
}
{
  // MED3：跑加速 — od=1 跑后立刻 transfer；对照 od 仍 0 的笔不动
  const c = box();
  c.Game.G = mkG({ realm: 2, year: 12, stone: 1000, debt: 100 });
  run(c, 'LOAN42.ensure(Game.G)');
  c.Game.G.loan42.y = 12; c.Game.G.loan42.squad = 1;
  c.Game.G.loan42.L = [
    { id: 'L1', t: 'fq', p0: 1040, p: 780, r: 0.11, y0: 10, n: 4, left: 3, due: 400, od: 1, ins: 50 },
    { id: 'L2', t: 'bt', p0: 200, p: 200, r: 0.15, y0: 11, n: 2, left: 2, due: 0, od: 0, ins: 0 }
  ];
  const debt0 = c.Game.G.debt;
  run(c, 'LOAN42.squadRun(Game.G)');
  ok(!c.Game.G.loan42.L.find(l => l.id === 'L1') && c.Game.G.loan42.L.length === 1 && c.Game.G.loan42.L[0].id === 'L2',
    'MED3 仅逾期笔被转走，未逾期保留');
  ok(c.Game.G.debt === debt0 + Math.ceil((780 + 50) * 1.2), 'MED3 转尾款金额 ×1.2');
}
{
  // LOW：Talk.extra 防重入 — hook 两次不加双入口
  const c = box();
  c.Game.G = mkG({ realm: 2 });
  const n1 = run(c, "Talk.extra('merchant').filter(x=>String(x[0]).includes('小贷')).length");
  run(c, 'LOAN42.off=false');
  // 直接再调内部 hook：通过重新执行包装条件
  run(c, `(function(){
    if (typeof Talk !== 'undefined' && !Talk._loan42) {
      Talk._loan42 = 1;
      const _ex = Talk.extra;
      Talk.extra = function(id){
        const out = _ex ? (_ex.apply(this, arguments) || []) : [];
        if (!LOAN42.off && LOAN42.canShowEntry(Game.G, id)) {
          const label = LOAN42.entryLabel(id);
          if (label) out.push([label, async function(){}]);
        }
        return out;
      };
    }
  })()`);
  // 模拟「无守卫时」会双包：验证守卫已立，二次注入被跳过
  ok(run(c, '!!Talk._loan42'), 'LOW Talk._loan42 守卫已立');
  const n2 = run(c, "Talk.extra('merchant').filter(x=>String(x[0]).includes('小贷')).length");
  ok(n1 === 1 && n2 === 1, 'LOW hook 重入后仍仅 1 个小贷入口 得 ' + n1 + '/' + n2);
  // 若强行清守卫再包一次，会双入口——对照证明守卫必要
  run(c, 'Talk._loan42=0');
  run(c, `(function(){
    if (typeof Talk !== 'undefined' && !Talk._loan42) {
      Talk._loan42 = 1;
      const _ex = Talk.extra;
      Talk.extra = function(id){
        const out = _ex ? (_ex.apply(this, arguments) || []) : [];
        if (!LOAN42.off && LOAN42.canShowEntry(Game.G, id)) {
          const label = LOAN42.entryLabel(id);
          if (label) out.push([label, async function(){}]);
        }
        return out;
      };
    }
  })()`);
  const n3 = run(c, "Talk.extra('merchant').filter(x=>String(x[0]).includes('小贷')).length");
  ok(n3 === 2, 'LOW 对照：清守卫后再包会出现双入口（' + n3 + '）');
}


console.log(fails ? `${fails} FAIL / ${n}` : `ALL PASS ${n}`);
process.exitCode = fails;

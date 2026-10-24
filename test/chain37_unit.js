// 3.7.5 奇遇链 chain37 单测：node test/chain37_unit.js（退出码 = 失败数）。vm 桩 + 真实 fam37.js 数据/效果执行器（截到 UI 段之前）+ 真实 chain37.js。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const JS = path.join(__dirname, '..', 'www', 'js');
const FAM = fs.readFileSync(path.join(JS, 'fam37.js'), 'utf8'); const FAMCUT = FAM.slice(0, FAM.indexOf('(function () {\n  UI.titles.fam37'));
const SRC = fs.readFileSync(path.join(JS, 'chain37.js'), 'utf8');
function box(gx) {
  const c = { console: { log() {}, warn() {}, error() {} }, Math: Object.create(Math), JSON, setTimeout }; c.window = c; vm.createContext(c);
  vm.runInContext(`
    var MAPINFO={village:{n:'桃花村',tier:0,need:0,mons:['slime']},sect:{n:'青云宗',tier:1,need:1,mons:['slime']},market:{n:'云来坊市',tier:1,need:1,mons:['slime']},secret:{n:'万妖秘境',tier:1.9,need:2,mons:['treant']},island:{n:'东海仙岛',tier:3.3,need:3,mons:['crab']},rift:{n:'魔道裂谷',tier:4.3,need:4,mons:['demon']},heaven:{n:'天外天',tier:5.6,need:5,mons:['x']}};
    var ITEMS={bill:{n:'欠条'},ledger:{n:'账本'},key:{n:'秘境钥匙'},herb:{n:'灵草'},ore:{n:'玄铁'},hcd:{n:'回春丹'},tsf:{n:'替死符'},lz:{n:'灵芝'},ysd:{n:'延寿丹'},yd:{n:'妖丹'},pyd:{n:'培元丹'},zjd:{n:'筑基丹'}};
    var LINGGEN=[];var SECTS={qingyun:{n:'青云'},baicao:{n:'百草'},tianmo:{n:'天魔'}};
    var NPCS={merchant:{n:'钱多多',map:'market',por:'p'},xianguan:{n:'记账童子',map:'heaven'},mentor:{n:'落魄剑仙',map:'village'},sister:{n:'师姐',map:'sect'},villager:{n:'说书先生',map:'village'},
      jh_jianke:{n:'游方剑客·萧十三'},jh_danniang:{n:'丹娘·苏半夏'},jh_mozi:{n:'魔修·厉无咎'},jh_tieguo:{n:'散修·赵铁锅'},jh_xunbao:{n:'寻宝客·钱满仓'},jh_yangui:{n:'女侠·燕归'}};
    var HOME={jh_jianke:'sect',jh_danniang:'market',jh_mozi:'rift',jh_tieguo:'market',jh_xunbao:'secret',jh_yangui:'island'};
    var FABAO={jian:{n:'剑'}};var FB33={cost(n){return {stone:Math.round(300*Math.pow(2.2,n))}}};
    var CH34={dazhai:{},cangbao:{}};
    var R={mapId:'market',mode:'map',player:{i:0,j:0}};
    var toasts=[],cards=[],script=[],fightRes='win',fights=[],rollQ=null;
    var UI={async card(t,x,p,o){cards.push({t,x,o});const k=script.length?script.shift():o.length-1;return typeof k==='function'?k(o):k},toast(s){toasts.push(s)},hud(){}};
    var JH34={now(G){return (G.year||0)*12+(G.month||0)},ensure(G){G.jh34=G.jh34||{v:1,t:0,feed:[],npcs:{},ch:{}};for(const k in HOME){G.jh34.npcs[k]=G.jh34.npcs[k]||{map:HOME[k],inj:0}}return G.jh34},
      mapOf(id){const G=Game.G;return this.ensure(G).npcs[id].map},say(L,s,k){L.feed.push({s,k})}};
    function JH34hold(id,v){JH34.ensure(Game.G).npcs[id].hold=v?1:0}
    var Life34={rel(id,d){const L=Game.G.life34;L.rel[id]=Math.max(-100,Math.min(100,(L.rel[id]||0)+d))},st(){return Game.G.life34}};
    var NPC37={emit(kind,a,b){return '【江湖风云】'+kind},st(){const G=Game.G;G.npc37=G.npc37||{v:1,st:{}};G.npc37.st=G.npc37.st||{};return G.npc37},idle(){return !(R.player&&R.player.nav)}};
    var Story37={ev:[],fire(e,d){this.ev.push(e)}};
    var Talk={extra(id){return [['打听',()=>0]]}};
    var Route37={chainsDone(G){return -1}};var LIAN35={batchAlch(){return {runs:3,ok:0,fail:3,made:0}}};
    var Game={G:null,save(){},log(){},async yearEnd(){this.G.year++},async enterMap(){},refreshNpcs(){},
      roll(p,k){if(rollQ!==null)return rollQ;return Math.random()<p},
      async fight(m,o){fights.push([m,o]);return {res:fightRes}},
      async apply(eff){const G=this.G;for(let tk of eff.split(';')){let m;if((m=tk.match(/^(stone|karma)([+\\-])(\\d+)$/))){let v=+m[3]*(m[2]==='-'?-1:1);if(m[1]==='stone')G.stone+=v;else G.karma+=v;continue}
        const p=tk.split(':');if(p[0]==='aff')G.aff[p[1]]=Math.max(0,(G.aff[p[1]]||0)+ +p[2]);else if(p[0]==='item')G.inv[p[1]]=(G.inv[p[1]]||0)+ +p[2];else if(p[0]==='fight')fights.push(['APPLY',p[1]])}return {txt:eff,later:[]}}};
  `, c);
  vm.runInContext(FAMCUT + '\n;window.TEXT37B=TEXT37B;window.FAM37=FAM37;', c);
  vm.runInContext(SRC, c);
  c.Game.G = Object.assign({ year: 10, month: 0, realm: 2, stage: 0, stone: 100000, debt: 10000, karma: 0, aff: {}, inv: {}, flags: { awakened: 1 }, life34: { rel: {} } }, gx || {});
  return c;
}
(async () => {
  let c = box(); let C = c.Chain37, X = c.CHAIN37X, G = () => c.Game.G;
  // ---- 静态：数据与补丁块一致 ----
  const T = c.TEXT37B; ok(T.chains.length === 6 && T.chains.reduce((a, x) => a + x.nodes.length, 0) === 36 && T.chains.reduce((a, x) => a + x.ends.length, 0) === 18, 'TEXT37B：6 链 36 节点 18 结局');
  const fightCh = []; T.chains.forEach(ch => ch.nodes.forEach(nd => nd.ch.forEach((x, k) => { if (x.fx && x.fx.fight) fightCh.push(nd.id + '/' + k); })));
  ok(fightCh.every(k => X.fights[k]) && Object.keys(X.fights).filter(k => !k.startsWith('c3_x')).every(k => fightCh.includes(k)), 'F5：战斗表覆盖全部 fight:1 选项（' + fightCh.length + ' 个）');
  ok(Object.keys(X.fights).every(k => X.fightLine[k]), '战斗表每项都有战前一句');
  ok(C.name('c37_3') === '秘境石门' && C.def('c37_3').id === 'c37_3', 'F1：c37_3 显示名「秘境石门」，id 不变');
  const allNodes = T.chains.flatMap(ch => ch.nodes.map(nd => C.node(ch.id, nd.id))).concat(X.chase);
  ok(allNodes.length === 38 && allNodes.every(nd => nd.ch.some(x => !(x.fx && (x.fx.stone < 0 || (x.fx.item && Object.values(x.fx.item).some(v => v < 0)))))), 'A4.6 静态：38 节点每个都有零成本选项（含 c6_3 补丁选项）');
  ok(T.chains.every(ch => ch.nodes.every(nd => nd.ch.every(x => C.isEnd(x.next) ? !!C.endOf(ch.id, x.next) : !!C.node(ch.id, x.next)))), '所有 next 指向存在的节点/结局');
  ok(X.chase.every(nd => nd.ch.every(x => C.isEnd(x.next) ? !!C.endOf('c37_3', x.next) : !!C.node('c37_3', x.next))), '追凶支线 next 有效');
  // ---- 触发条件 F6/F10/F11/F1 ----
  G().realm = 1; ok(!C.can('c37_1'), 'c37_1：练气不触发'); G().realm = 2; ok(C.can('c37_1'), 'c37_1：筑基+欠款触发'); G().debt = 0; ok(!C.can('c37_1'), 'c37_1：无欠款不触发'); G().debt = 10000;
  G().realm = 4; ok(!C.can('c37_2'), 'F10 c37_2 元婴不触发'); G().realm = 5; ok(C.can('c37_2'), 'F10 c37_2 化神即触发（不看主线）');
  G().realm = 3; G().karma = -30; ok(!C.can('c37_4'), 'F11 c37_4 金丹 karma−30 不触发'); G().realm = 4; ok(C.can('c37_4'), 'F11 c37_4 元婴 karma−30 触发'); G().karma = 0; G().route37 = { id: 'moxiu' }; ok(C.can('c37_4'), 'c37_4 魔修路线触发'); delete G().route37;
  G().realm = 2; G().aff.jh_xunbao = 30; ok(!C.can('c37_3'), 'F1 c37_3 无 CH34 cangbao 不触发'); c.JH34.ensure(G()).ch.cangbao = { done: 1, out: 'greedy' }; ok(!C.can('c37_3'), 'F1 cangbao 独吞不触发'); G().jh34.ch.cangbao.out = 'split'; ok(C.can('c37_3'), 'F1 cangbao 分账后触发（续篇）');
  ok(!C.can('c37_5'), 'c37_5 炼丹<2 不触发'); G().alchLv = 2; ok(C.can('c37_5'), 'c37_5 炼丹 Lv2 触发');
  G().realm = 3; ok(!C.can('c37_6'), 'c37_6 无本命法宝不触发'); G().fb33 = { id: 'jian', tier: 4, aff: 10 }; ok(C.can('c37_6'), 'c37_6 有法宝+金丹触发');
  // ---- 老档 A4.8 ----
  c = box({ jh34: { v: 1, t: 0, feed: [], npcs: {}, ch: { dazhai: { s: 2, done: 0 }, cangbao: { s: 1, done: 0 } } } }); C = c.Chain37; X = c.CHAIN37X;
  ok(G().chain37 === undefined && C.active().length === 0 && C.st('c37_1') === null, 'A4.8 老档：无 G.chain37 不报错，全部未开始');
  await c.Game.yearEnd(); ok(G().chain37 && G().chain37.v === 1 && JSON.stringify(G().jh34.ch.dazhai) === '{"s":2,"done":0}' && G().jh34.ch.cangbao.s === 1, 'A4.8 年结算后惰性建 G.chain37，CH34 进度不变');
  // ---- 风声 ----
  c.rollQ = true; G().chain37 = undefined; await c.Game.yearEnd(); const S1 = C.st('c37_1'); ok(S1 && S1.offer === G().year && c.toasts.some(t => /赊账单/.test(t)) && G().jh34.feed.some(f => /风声/.test(f.s)), '风声：掷中写 offer + toast + 江湖传闻(JH34.say)');
  let opts = c.Talk.extra('merchant'); ok(opts[0][0] === '⚑ 奇遇·钱多多的赊账单', '起点 NPC 对话出现「⚑ 奇遇·钱多多的赊账单」');
  c.rollQ = false; G().year += 2; await C.yearTick(G()); ok(!C.st('c37_1').offer, '风声 2 年未接自动过期');
  ok(!/^(打坐（|★|✔|！|接受|继续|好|收下|交付|……|应战|带路|明白|谢|原来如此|伸手|去后巷|去看看|你说什么|撤|知道了|确定|抄起扫帚|开始|过年)/.test('⚑ 奇遇·x') && !/^(打坐（|★|✔|！|接受|继续|好|收下|交付|……|应战|带路)/.test('⚑ 出手'), 'A4.7 ⚑ 前缀不在 ux23 SAFE 白名单');
  // ---- 完整走一条 c37_1（真实卡片脚本） ----
  C.mk('c37_1').offer = G().year; opts = c.Talk.extra('merchant'); c.script = [1]; const st0 = G().stone; let r = await opts[0][1]();
  ok(C.st('c37_1').s === 'c1_3' && G().aff.merchant === 0 && c.cards[c.cards.length - 1].o.every((x, k, a) => k === a.length - 1 || x.startsWith('⚑ ')), '开链→c1_1 选〔一把抢过〕→ c1_3；选项全部 ⚑ 开头');
  ok(G().jh34.npcs.jh_tieguo.hold === 1, 'F8 c1_3 赵铁锅被钉住');
  c.fightRes = 'lose'; c.script = [1, 0]; r = await C.run('c37_1'); ok(r.lost && C.st('c37_1').s === 'c1_3' && c.fights.pop()[0] === 'collector' && c.toasts.pop() === '没打过，回头再来', 'A4.5 战斗输：节点不动、提示可重试');
  c.fightRes = 'win'; c.script = [1, 0]; r = await C.run('c37_1'); const f = c.fights.pop(); ok(r.next === 'c1_5' && f[0] === 'collector' && f[1].solo && !f[1].elite && f[1].tier === 2, 'F5 c1_3〔独自夜探〕赢 → c1_5（collector 非精英 tier=max(1,2)）');
  ok(G().jh34.npcs.jh_tieguo.hold === 0, 'F8 离开节点解除钉住');
  ok(c.Talk.extra('merchant').length === 1, 'F7 地点节点 c1_5 不挂在 NPC 上');
  ok(C.target('c37_1').kind === 'here' && /在云来坊市点此继续/.test(C.target('c37_1').txt), 'F7 追踪栏：在{图}点此继续');
  G().inv.bill = 1; c.script = [1]; r = await C.run('c37_1'); ok(r.end === 'e1_b' && C.st('c37_1').done && G().inv.ledger === 1 && G().inv.bill === 0 && G().aff.merchant === 10, 'c1_5〔用祖传欠条换〕→ 结局 e1_b（账本+1、钱多多+10）');
  ok(c.toasts.includes(X.doneToast.c37_1) && c.Story37.ev.includes('chain:done') && C.doneCount() === 1, '完成 toast + chain:done 事件 + doneCount=1');
  ok(c.Talk.extra('merchant').length === 1, '完成后起点不再出现');
  // ---- 并发上限 A4.4 ----
  c = box({ realm: 5, alchLv: 2, fb33: { id: 'jian', tier: 4, aff: 0 } }); C = c.Chain37; X = c.CHAIN37X;
  C.start('c37_1'); C.start('c37_2'); C.mk('c37_5').offer = 10; opts = c.Talk.extra('jh_danniang'); ok(opts[0][0] === '🔒 手头奇遇太多（2/2）', 'A4.4 已接 2 条：第 3 条起点显示 🔒');
  await opts[0][1](); ok(!C.st('c37_5').s, 'A4.4 🔒 选项点了不开链');
  // ---- 灵石不足锁 F12 / 缺物品 F13 ----
  G().stone = 100; c.script = [0, 2]; C.dev.jump('c37_2', 'c2_5'); r = await C.run('c37_2'); const lc = c.cards.slice(-2)[0]; ok(/🔒 复原字迹（灵石不足（需 1800））/.test(lc.o[0]) && C.st('c37_2').s === 'c2_5', 'F12 化神复原字迹需 300×6=1800，不足锁定');
  C.dev.jump('c37_2', 'c2_2'); c.script = [1, 2]; await C.run('c37_2'); ok(/🔒 翻天庭旧档（缺 账本）/.test(c.cards[c.cards.length - 2].o[1]), 'F13 缺物品显示「缺 账本」');
  // ---- A4.1 直达结局（20 个） ----
  const endChk = { e1_a: g => g.debt === 9000 && g.karma === 5, e1_b: g => g.inv.ledger === 1 && g.aff.merchant === 10, e1_c: g => g.stone === 100000 + 800 * 6 && g.karma === -5, e2_a: g => Math.abs(g.fam37.rate + 0.005) < 1e-9 && g.aff.xianguan === 20, e2_b: g => g.inv.ysd === 1,
    e2_c: g => g.debt === 8000 && g.karma === -10, e3_a: g => g.inv.lz === 1 && g.stone === 100000 + 300 * 6, e3_b: g => g.inv.lz === 2 && g.inv.bill === 1, e3_c: g => g.life34.rel.jh_xunbao === -10, e4_a: g => g.stone === 100000 + 1500 * 6, e4_b: g => g.sectRel.tianmo === -30 && g.karma === 10,
    e4_c: g => g.inv.yd === 1, e5_a: g => g.inv.zjd === 1 && g.aff.jh_danniang === 20, e5_b: g => g.aff.jh_danniang === 30, e5_c: g => g.aff.jh_danniang === 10, e6_a: g => g.fb33.aff === 30 && g.stone === 100000 + Math.round(300 * Math.pow(2.2, 4) * 0.5) && g.aff.jh_jianke === 10,
    e6_b: g => g.aff.jh_jianke === 30 && g.aff.jh_yangui === 15, e6_c: g => g.inv.ore === 2, chase_a: g => g.stone === 100000 + 200 * 6 && g.inv.lz === 1, chase_b: g => g.life34.rel.jh_xunbao === -10 };
  let endOk = 0; const bad = [];
  for (const eid of Object.keys(endChk)) { c = box({ realm: 5, fb33: { id: 'jian', tier: 4, aff: 0 } }); const id = eid.startsWith('chase') ? 'c37_3' : 'c37_' + eid[1]; await c.Chain37.dev.end(id, eid); const g = c.Game.G; if (endChk[eid](g) && g.chain37.ch[id].done && g.chain37.ch[id].out === eid) endOk++; else bad.push(eid); }
  ok(endOk === 20 && Object.keys(endChk).length === 20, 'A4.1 18 原结局 + 2 追凶结局直达奖励正确（F3 debt%/rate%、F4 剑意半阶费）' + (bad.length ? ' bad=' + bad : ''));
  c = box({ realm: 5, route37: { id: 'sanxiu' } }); await c.Chain37.dev.end('c37_4', 'e4_a'); ok(c.Game.G.stone === 100000 + Math.round(1500 * 1.2 * 6), '散修路线结局灵石 ×1.2');
  c = box({ realm: 5, fb33: { id: 'jian', tier: 9, aff: 90 } }); await c.Chain37.dev.end('c37_6', 'e6_a'); ok(c.Game.G.stone === 102000 && c.Game.G.fb33.aff === 100, 'F4 法宝 9 阶：+2000 灵石，器灵好感封顶 100');
  c = box(); await c.Chain37.dev.end('c37_3', 'chase_b'); ok(c.Chain37.doneCount() === 0, 'chase_b 不计入 doneCount');
  c = box(); c.Game.G.jh34 = { v: 1, ch: { dazhai: { done: 1, out: 'paid' }, cangbao: { done: 1, out: 'no' } }, npcs: {}, feed: [] }; await c.Chain37.dev.end('c37_5', 'e5_a'); await c.Chain37.dev.end('c37_3', 'chase_a'); ok(c.Chain37.doneCount() === 3, 'doneCount = CH34(非 no) + chain37(非失败非 chase_b)');
  // ---- A4.2 判超时 ----
  const to = {};
  c = box({ debt: 10000 }); await c.Chain37.dev.jump('c37_1', 'c1_2'); await c.Chain37.dev.timeout('c37_1'); to.c1 = c.Game.G.debt === 11000 && c.Chain37.st('c37_1').fail === 1 && c.Chain37.st('c37_1').hunt === 1;
  c.fightRes = 'lose'; c.Game.G.stone = 1000; await c.Game.yearEnd(); to.c1h = c.fights.some(x => x[0] === 'collector' && x[1].elite) && c.Game.G.stone === 900;
  ok(to.c1 && to.c1h, 'A4.2 c37_1 超时：欠款 +10%，次年讨债鬼精英追猎，输了扣 10% 灵石');
  c = box({ debt: 0 }); c.Game.G.chain37 = { v: 1, ch: { c37_1: { s: 'c1_1', t0: 120, tn: 120 } }, cy: -1 }; c.Game.G.year = 12; await c.Chain37.check('c37_1'); ok(c.Chain37.st('c37_1').fail === 1, 'c37_1 链总时限 24 月（节点未满 36 也失败）');
  c = box({ realm: 5, debt: 5000 }); c.Chain37.start('c37_2'); await c.Chain37.dev.timeout('c37_2'); for (let y = 0; y < 8; y++) await c.Game.yearEnd(); const r6 = c.Game.G.fam37.rate;
  c.Game.G.debt = 0; await c.Game.yearEnd(); ok(Math.abs(r6 - 0.06) < 1e-9 && Math.abs(c.Game.G.fam37.rate - 0.06) < 1e-9 && c.Chain37.st('c37_2').fail, 'A4.10 c37_2 超时罚息连 8 年只到 +6%');
  c = box({ realm: 5, debt: 5000 }); c.Chain37.start('c37_2'); await c.Chain37.dev.timeout('c37_2'); await c.Game.yearEnd(); c.Game.G.debt = 0; await c.Game.yearEnd(); await c.Game.yearEnd(); ok(Math.abs(c.Game.G.fam37.rate - 0.01) < 1e-9, 'A4.10 debt=0 后停止累加');
  c = box({ realm: 2 }); c.Chain37.start('c37_3'); await c.Chain37.dev.timeout('c37_3'); const S3 = c.Chain37.st('c37_3'); ok(S3.s === 'c3_x1' && !S3.done && S3.chase === 1, 'A4.2 c37_3 超时转追凶支线 c3_x1');
  ok(c.Chain37.target('c37_3').map === 'secret' && c.Game.G.jh34.npcs.jh_mozi.map === 'secret' && c.Game.G.jh34.npcs.jh_mozi.hold === 1, 'F8 筑基追凶：厉无咎钉住并挪到 secret');
  await c.Chain37.dev.timeout('c37_3'); ok(S3.done && S3.fail && S3.out === 'fail' && c.Game.G.jh34.npcs.jh_mozi.hold === 0, '追凶再超时 → 真失败，解除钉住');
  c = box({ realm: 4 }); c.Chain37.start('c37_4'); await c.Chain37.dev.timeout('c37_4'); ok(c.Game.G.sectRel.tianmo === -30 && c.Game.G.life34.rel.jh_mozi === -30, 'A4.2 c37_4 超时：天魔宗 −30、厉无咎恩怨 −30');
  c = box({ aff: { jh_danniang: 25 } }); c.rollQ = false; c.Chain37.start('c37_5'); await c.Chain37.dev.timeout('c37_5'); ok(c.Game.G.jh34.npcs.jh_danniang.inj === 12 && c.Game.G.aff.jh_danniang === 15, 'A4.2 c37_5 超时 70% 支：重伤 12 月、好感 −10');
  c = box(); c.rollQ = true; c.Chain37.start('c37_5'); c.Chain37.dev.jump('c37_5', 'c5_3'); c.LIAN35.batchAlch(); await new Promise(r => setTimeout(r, 10)); ok(c.Chain37.st('c37_5').fail && c.Game.G.npc37.st.jh_danniang.dead === 1, 'c37_5 c5_3 期间炸炉 3 次 → 失败，30% 支陨落');
  c = box(); c.Chain37.start('c37_5'); c.LIAN35.batchAlch(); ok(c.Chain37.st('c37_5').burst === 0, '炸炉只在 c5_3–c5_5 计数');
  c = box({ realm: 3, aff: { jh_jianke: 41 }, fb33: { id: 'jian', tier: 1 } }); c.Chain37.start('c37_6'); await c.Chain37.dev.timeout('c37_6'); ok(c.Game.G.life34.rel.jh_jianke === -40 && c.Game.G.aff.jh_jianke === 20, 'A4.2 c37_6 超时：恩怨 −40、好感减半');
  ok(c.Talk.extra('jh_jianke').length === 1 && c.cards.some(x => /落空/.test(x.t) && x.x.includes(c.CHAIN37X.failText.c37_6)), 'A4.2 失败卡文案 + 起点不再出现');
  // c37_6 等待期
  c = box({ realm: 3, fb33: { id: 'jian', tier: 1 } }); c.Chain37.start('c37_6'); c.script = [0, 1]; await c.Chain37.run('c37_6'); await c.Chain37.run('c37_6'); const S6 = c.Chain37.st('c37_6');
  ok(S6.s === 'c6_5' && S6.after === S6.t0 + 36, 'c6_1→c6_5 强制等 36 月'); c.Game.G.year += 2; let w = await c.Chain37.run('c37_6'); ok(w.wait && !S6.done, '等待期内找萧十三：还得再等'); c.Game.G.year += 1; c.Game.G.month = 6; ok((await c.Chain37.check('c37_6')) === null, '等待期不算超时');
  // ---- A4.3 杀节点 NPC ----
  const k3 = []; for (const [id, nid] of [['c37_3', 'c3_1'], ['c37_5', 'c5_1'], ['c37_6', 'c6_1'], ['c37_4', 'c4_1']]) { c = box({ realm: 4, fb33: { id: 'jian', tier: 1 } }); c.Chain37.dev.jump(id, nid); const npc = c.Chain37.dev.kill(id); await c.Chain37.checkAll(); const S = c.Chain37.st(id); k3.push(id === 'c37_3' ? S.s === 'c3_x1' && !S.done : S.fail === 1 && !c.Chain37.target(id)); }
  ok(k3.every(Boolean), 'A4.3 杀钱满仓→追凶；杀苏半夏/萧十三/厉无咎→失败，追踪栏不再指向死人');
  c = box({ realm: 2 }); c.Chain37.dev.jump('c37_3', 'c3_x1'); c.Chain37.kill('jh_mozi'); await c.Chain37.check('c37_3'); ok(c.Chain37.st('c37_3').s === 'c3_x2', '追凶 c3_x1 厉无咎已死 → 跳 c3_x2');
  c.Chain37.kill('jh_xunbao'); ok(c.Chain37.target('c37_3').id === 'villager' && (await c.Chain37.check('c37_3')) === null, 'c3_x2 钱满仓已死 → 说书先生代收，不判失败');
  // ---- F9 负好感同步恩怨 ----
  c = box({ realm: 2, aff: { jh_xunbao: 3 } }); c.Chain37.dev.jump('c37_3', 'c3_1'); c.script = [1]; await c.Chain37.run('c37_3'); ok(c.Game.G.aff.jh_xunbao === 0 && c.Game.G.life34.rel.jh_xunbao === -5, 'F9 负 aff 写 G.aff（夹 0）并同步 Life34.rel');
  // ---- F2 空 fx ----
  c = box(); c.Chain37.start('c37_1'); c.script = [0]; r = await c.Chain37.run('c37_1'); ok(r.next === 'c1_2', 'F2 空字符串 fx 视为无效果');
  // ---- 年结算同年最多 1 张卡 ----
  c = box({ realm: 5, fb33: { id: 'jian', tier: 1 } }); for (const id of ['c37_2', 'c37_4']) { c.Chain37.start(id); const S = c.Chain37.st(id); S.tn -= 40; } c.cards.length = 0; c.rollQ = false; await c.Game.yearEnd(); ok(c.cards.length === 1 && c.Chain37.st('c37_2').fail && c.Chain37.st('c37_4').fail, '年结算两条同时失败：只弹 1 张卡');
  // ---- 地点节点进图弹卡 F7 ----
  c = box(); c.Chain37.dev.jump('c37_1', 'c1_5'); c.R.player.nav = { txt: 'x' }; await c.Game.enterMap('market'); await new Promise(r => setTimeout(r, 1600)); const nc = c.cards.length;
  c.R.player.nav = null; await c.Game.enterMap('market'); await new Promise(r => setTimeout(r, 1600)); ok(nc === 0 && c.cards.length >= 1 && /第/.test(c.cards[0].t), 'F7 进图 1.5 秒弹地点卡；寻路中(R.player.nav)不弹');
  // ---- c37_3 被夺宝抢先（PR #46 后） ----
  c = box({ realm: 2 }); c.Chain37.start('c37_3'); c.NPC37.emit('duobao', 'jh_mozi', 'jh_tieguo'); ok((await c.Chain37.check('c37_3')) === null, '夺宝新闻不涉及钱满仓 → 不触发');
  c.NPC37.emit('jiechou', 'jh_xunbao', 'jh_mozi'); ok((await c.Chain37.check('c37_3')) === null, '钱满仓非夺宝新闻 → 不触发');
  c.Game.G.npc37 = { v: 1, st: {}, ev: { total: 1, meet: 0, feud: 0, help: 0, debt: 0 } }; c.NPC37.emit('duobao', 'jh_mozi', 'jh_xunbao'); ok((await c.Chain37.check('c37_3')) === 'chase' && c.Chain37.st('c37_3').s === 'c3_x1', '夺宝新闻涉及钱满仓 → 转追凶 c3_x1');
  ok((await c.Chain37.check('c37_3')) === null && !c.Chain37.st('c37_3').done, '追凶中不重复触发');
  c = box({ realm: 2 }); c.NPC37.emit('duobao', 'jh_xunbao', 'jh_mozi'); c.Game.G.year += 1; c.Chain37.start('c37_3'); ok((await c.Chain37.check('c37_3')) === null, '开链前的旧夺宝记录不算');
  c = box({ realm: 2 }); c.Chain37.start('c37_3'); c.Game.G.chain37.db = { yr: 'x' }; ok((await c.Chain37.check('c37_3')) === null, '坏数据 G.chain37.db 惰性忽略');
  c = box({ realm: 2 }); delete c.Game.G.npc37; c.Chain37.start('c37_3'); ok(c.Chain37.robbed(c.Game.G, c.Chain37.st('c37_3')) === false, '老档无 G.npc37 不报错');
  c = box(); await c.Chain37.dev.end('c37_5', 'e5_a'); ok(c.Route37.chainsDone(c.Game.G) === 1, 'route37.chainsDone 改用 Chain37.doneCount');
  console.log(`\n${n - fails}/${n} passed`); process.exit(fails);
})().catch(e => { console.error(e); process.exit(99); });

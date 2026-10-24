'use strict';
// 3.7.4 自由路线 route37：数据逐字核对 + 核心逻辑纯 JS 单测（不开浏览器）
const fs = require('fs'), path = require('path'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const JS = path.join(__dirname, '..', 'www', 'js'); const SRC = fs.readFileSync(path.join(JS, 'route37.js'), 'utf8');
const DOC = fs.readFileSync(path.join(__dirname, '..', 'docs', 'research_v22.md'), 'utf8');
function box(G) {
  const c = { console, Math: Object.create(Math) }; c.Math.random = Math.random; vm.createContext(c);
  vm.runInContext(`var ENDINGS={demon:['魔尊降世','x'],tycoon:['富甲三界','y'],sit:['坐化','z']};var NPCS={jh_tieguo:{n:'散修·赵铁锅'},jh_xunbao:{n:'钱满仓'},merchant:{n:'坊市掌柜'}};
    var toasts=[];var UI={toast(s){toasts.push(s)}};var YEAR=0;var Life34={yr(){return Game.G.year}};
    var Game={G:null,meta:{pts:0,endings:{}},rolls:[],rollv:null,roll(p,k){this.rolls.push([p,k]);return this.rollv===null?Math.random()<p:this.rollv},need(){return 1000},
      async apply(s){const G=this.G;const out=[];for(const tk of s.split(';')){let m;if((m=tk.match(/^(stone|karma|exp)([+\\-%])(\\d+)$/))){let v=+m[3];if(m[2]==='-')v=-v;if(m[2]==='%'&&m[1]==='stone'){v=Math.round(G.stone*v/100)}G[m[1]]=(G[m[1]]||0)+v;out.push(tk)}
        else if((m=tk.match(/^item:(\\w+):(-?\\d+)$/))){G.inv[m[1]]=(G.inv[m[1]]||0)+(+m[2]);out.push(tk)}else if((m=tk.match(/^aff:(\\w+):(-?\\d+)$/))){G.aff[m[1]]=(G.aff[m[1]]||0)+(+m[2]);out.push(tk)}else out.push('?'+tk)}return {txt:out.join(','),later:[]}},
      async yearEnd(){YEAR++;return 'ye'},async die(k){this.G.dead=true;this.G.ending=k;this.meta.pts+=10;this.meta.endings[k]=1}};`, c);
  vm.runInContext(SRC + ';this.Route37=Route37;this.TEXT374=TEXT374;this.EVT374=EVT374;', c);
  c.Game.G = Object.assign({ year: 100, age: 40, realm: 0, stage: 0, stone: 10000, karma: 0, debt: 0, sect: null, inv: {}, aff: {}, lifeBonus: 0, route37: null }, G || {});
  return c;
}
(async () => {
  let c = box(); let R = c.Route37, G = () => c.Game.G;
  // —— 数据 ——
  const j = DOC.slice(DOC.indexOf('### 10.9')); const js = j.slice(j.indexOf('```json') + 7, j.indexOf('```', j.indexOf('```json') + 7));
  ok(JSON.stringify(JSON.parse(js)) === JSON.stringify(c.TEXT374), 'TEXT374 逐字等于 research_v22 §10.9 JSON');
  ok(R.IDS.every(id => c.EVT374[id] && c.EVT374[id].length === 4), '5 条路线 × 4 条专属年事件 = 20 条');
  const sec = DOC.slice(DOC.indexOf('### 10.6'), DOC.indexOf('### 10.7')); let miss = [];
  for (const id of R.IDS) for (const e of c.EVT374[id]) { if (!e.t.startsWith('⚑ ')) miss.push(e.id + ' 无⚑'); const line = sec.split('\n').find(l => l.indexOf(e.t + '｜') >= 0);
    if (!line) { miss.push(e.id + ' 标题'); continue; } const seg = line.replace(/^\d+\. /, '').split('｜'); if (seg[1] !== e.x) miss.push(e.id + ' 正文');
    e.o.forEach((o, i) => { if (!seg[2 + i] || !seg[2 + i].startsWith(o[0] + '（')) miss.push(e.id + ' 选项' + i); }); if (e.o.length !== 2) miss.push(e.id + ' 不是二选一'); }
  ok(!miss.length, '年事件标题/正文/选项文字逐字来自 §10.6，标题以 ⚑ 开头，二选一 ' + JSON.stringify(miss));
  ok(['r37_xiaoyao', 'r37_mojun', 'r37_fujia', 'r37_shijia'].every(k => c.ENDINGS[k] && c.ENDINGS[k][0] === c.TEXT374.endings[k][0]) && c.ENDINGS.demon[0] === '魔尊降世' && c.ENDINGS.tycoon[0] === '富甲三界', '4 个 r37_ 结局写入 ENDINGS，demon/tycoon 不动');
  ok(Object.keys(c.TEXT374.tips).length === 5 && Object.values(c.TEXT374.tips).every(a => a.length === 2) && Object.keys(c.TEXT374.endings).length === 4, '12 张卡：4 结局 + 4×2 提示 + 掌门 2 提示');
  // —— 老档 ——
  ok(R.yearTick() === null && R.ready().length === 0 && R.cur() === null && R.mul() === 1 && R.price('buy') === 1 && R.canMed(), '老档 route37=null：不结算、无结局入口、无加成（A5.3/A10.1）');
  await c.Game.yearEnd(); ok(G().route37 === null && G().lifeBonus === 0 && c.Game.yearEnd._r37 === 1, 'Game.yearEnd 已包装，老档年结算不建档不改值');
  // —— 进入条件 ——
  G().sect = 'qingyun'; ok(R.can('sanxiu') === c.TEXT374.routes.sanxiu.lock, '散修：有宗门 🔒'); G().sect = null; ok(R.can('sanxiu') === null, '散修：无宗门可进');
  G().karma = -49; ok(R.can('moxiu') === c.TEXT374.routes.moxiu.lock, '魔修：善恶 −49 🔒'); G().karma = -50; ok(R.can('moxiu') === null, '魔修：善恶 ≤ −50 可进');
  ok(R.can('zhangmen') !== null, '掌门：非一宗之主 🔒'); G().sectLeader = 'qingyun'; ok(R.can('zhangmen') === null, '掌门：sectLeader 可进'); delete G().sectLeader;
  G().age = 29; ok(R.can('shangjia') !== null, '商贾：未满 30 🔒'); G().age = 40; G().realm = 1; ok(R.can('shangjia') !== null, '商贾：已入仙途 🔒'); G().realm = 0; ok(R.can('shangjia') === null, '商贾：凡人且 ≥30 可进');
  ok(R.can('shijia') === c.TEXT374.routes.shijia.lock, '家族：族谱不足三代 🔒'); G().fam37 = { gen: 3, kids: [] }; ok(R.can('shijia') === null, '家族：fam37 三代可进'); delete G().fam37;
  ok(R.can('nope') === '未知路线', '未知路线 id 拒绝');
  // —— 选择 / 冷却 / 魔修切出 ——
  G().karma = -60; let r = R.choose('moxiu'); ok(r.ok && r.txt === c.TEXT374.routes.moxiu.enter && G().route37.id === 'moxiu' && G().route37.since === 100, '首次选择无冷却，返回 enter 文案');
  G().year = 112; ok(R.canLeave() === c.TEXT374.routes.moxiu.lockLeave && !R.choose(null).ok, '魔修 karma −60 切出 🔒 心魔未消（A10.3）');
  G().karma = 0; G().year = 105; ok(R.canLeave() === '还要再走 5 年' && R.choose(null).why === '还要再走 5 年', '冷却 10 年内 🔒「还要再走 N 年」');
  G().year = 110; G().route37.pts = 33; r = R.choose('sanxiu'); ok(r.ok && r.txt === c.TEXT374.routes.moxiu.leave + '\n' + c.TEXT374.routes.sanxiu.enter && G().route37.pts === 0 && G().route37.prev === 'moxiu', '满 10 年可换：leave + enter 文案，pts 清零');
  ok(G().route37.hist.length === 1 && G().route37.hist[0].id === 'moxiu' && G().route37.hist[0].pts === 33 && G().route37.hist[0].yr === 110, 'hist 记 {id,pts,yr}');
  for (let i = 0; i < 20; i++) { G().year += 10; R.choose(i % 2 ? 'sanxiu' : null); } ok(G().route37.hist.length === 8, 'hist 最多 8 条');
  ok(R.choose(G().route37.id).why === '已在此路线', '重复选同一路线拒绝');
  // —— 年结算：积分 / 被动 ——
  c = box({ karma: -80, sectRel: { qingyun: 0, tianmo: 10 } }); R = c.Route37; c.Game.rollv = false; R.choose('moxiu'); G().year = 101; await c.Game.yearEnd();
  ok(G().route37.pts === 1 && G().karma === -82 && G().sectRel.qingyun === -3 && G().sectRel.baicao === -3 && G().sectRel.tianmo === 10, '魔修年结算：+1 分、善恶 −2、正道宗门 sectRel −3');
  ok(R.mul() === 1.15, '魔修修为 ×1.15'); ok(R.yearTick() === null, '同一年只结算一次');
  c = box({ stone: 10000 }); R = c.Route37; c.Game.rollv = false; R.choose('shangjia'); for (let y = 101; y <= 125; y++) { G().year = y; if (y === 101) G().stone += 25000; await c.Game.yearEnd(); }
  ok(G().route37.pts === 2 && G().lifeBonus === 20 && G().route37.lifeAdd === 20, '商贾：每净赚 1 万 +1 分（2.5 万→2）；寿元每年 +1，封顶 +20');
  ok(R.mul() === 0 && !R.canMed() && R.price('buy') === 0.9 && R.price('sell') === 1.1 && R.stoneK() === 1, '商贾：修炼 ×0、不能打坐、买 −10% 卖 +10%、灵石不按境界放大');
  // —— 放贷 ——
  c = box({ stone: 1000000 }); R = c.Route37; ok(/凡人商贾/.test(R.lendLock('merchant', 50000)), '非商贾不能放贷'); R.choose('shangjia');
  ok(R.lendLock('jh_tieguo', 4999) === '额度 5000–20000' && R.lendLock('nobody', 9000) === '此人不借', '额度与借款人校验');
  ok(R.lend('jh_tieguo', 10000).ok && R.lend('jh_xunbao', 50000).ok && R.lend('merchant', 100000).ok && G().stone === 840000, '三笔放出，本金从灵石扣');
  G().npcs = 1; ok(R.lendLock('merchant', 60000) === '同时最多 3 笔', '第 4 笔 🔒（A10.5）');
  c.Game.rollv = false; G().year = 101; let t = R.yearTick(); ok(G().stone === 840000 + 1800 + 6000 + 7000 && t.loans.every(l => l.k === 'int'), '第 1 年：铁锅 18%、钱满仓 12%、掌柜 7% 付息');
  G().year = 102; R.yearTick(); G().year = 103; t = R.yearTick(); ok(t.loans.every(l => l.k === 'done') && G().route37.loans.length === 0 && G().stone === 840000 + 3 * 14800 + 160000, '3 年到期还本，账清');
  R.lend('jh_tieguo', 20000); R.lend('jh_xunbao', 20000); R.lend('merchant', 50000); const s0 = G().stone; c.Game.rollv = true; G().year = 104; t = R.yearTick();
  ok(G().stone === s0 + 8000 + 12000 + 40000 && t.loans.every(l => l.k === 'def') && t.loans[0].aff === -10 && t.loans[1].clue === 'c37_3', '违约：本金回 40%/60%/80%，铁锅附带好感 −10 与灵草，钱满仓给链线索');
  R.lend('merchant', 50000); G().npc37 = { st: { merchant: { dead: 1 } } }; G().year = 105; c.Game.rollv = false; t = R.yearTick(); ok(t.loans[0].k === 'dead' && G().route37.loans.length === 0, '借款人陨落 = 全额违约（A10.5）');
  ok(R.lendLock('merchant', 50000) === '此人已陨落', '陨落者不能再借');
  // —— 年事件：概率 / 每年 ≤1 ——
  c = box(); R = c.Route37; R.choose('sanxiu'); c.Game.rollv = true; c.Game.rolls.length = 0; G().year = 101; t = R.yearTick();
  ok(t.ev && c.EVT374.sanxiu.indexOf(t.ev) >= 0 && c.Game.rolls.some(x => x[0] === 0.35 && x[1] === 'route37'), '概率 35% 经 Game.roll(p,\'route37\')，命中出 1 条本路线事件');
  c.Game.rollv = false; G().year = 102; ok(R.yearTick().ev === null, 'roll 为假 → 本年无事件');
  const hits = {}; for (const id of R.IDS) { const cc = box({ karma: -90, sectLeader: 'q', fam37: { gen: 3, kids: [] } }); cc.Game.rollv = true; cc.Route37.choose(id); cc.Game.G.year = 101; hits[id] = cc.Route37.yearTick().ev.id; }
  ok(Object.keys(hits).every(id => c.EVT374[id].some(e => e.id === hits[id])), '每条路线只抽自己的事件池');
  // —— 年事件效果 ——
  c = box({ realm: 2, stone: 1000 }); R = c.Route37; R.choose('sanxiu');
  await R.fx(c.EVT374.sanxiu[0].o[1][1]); ok(G().stone === 1000 + 400 * 3, '灵石按 ×(1+大境界)（talk37 惯例）');
  c.Game.rollv = true; await R.fx(c.EVT374.sanxiu[0].o[0][1]); ok(G().exp === 50 && G().mem37.dx === -3, '野路子：修为 +need×5%，30% 命中道心 −3（写 G.mem37.dx，与 dlg37 同字段）');
  await R.fx(c.EVT374.sanxiu[2].o[1][1]); ok(G().sectRel.qingyun === -5 && G().mem37.dx === 0, '撕招贤帖：道心 +3、青云 sectRel −5');
  await R.fx(c.EVT374.sanxiu[3].o[0][1]); for (let y = 101; y <= 104; y++) { G().year = y; R.yearTick(); } ok(G().inv.herb === 6 && !G().route37.buff.herb, '无主灵田：灵草每年 +2，持续 3 年');
  c = box({ stone: 5000, debt: 300 }); R = c.Route37; R.choose('shangjia'); await R.fx(c.EVT374.shangjia[3].o[0][1]); ok(G().stone === 10000 && G().debt === 2300, '商贾 ×1：天道来进货 灵石 +5000、债务 +2000');
  G().karma = -90; R.choose(null); G().route37.since = 0; G().year = 200; R.choose('moxiu'); await R.fx(c.EVT374.moxiu[2].o[0][1]); ok(G().debt === 1800, '给钱：有债先抵债 −500');
  G().debt = 0; const st = G().stone; await R.fx(c.EVT374.moxiu[2].o[0][1]); ok(G().stone === st - 500, '无债则扣灵石 500');
  c = box({ stone: 5000 }); R = c.Route37; R.choose('shangjia'); await R.fx(c.EVT374.shangjia[0].o[0][1]); ok(G().stone === 3000 && G().route37.later.length === 1, '囤货：先扣 2000，挂次年结果');
  c.Game.rollv = true; G().year = 101; t = R.yearTick(); ok(t.later[0].v === 4000 && G().stone === 7000 && !G().route37.later.length, '次年 50% 回 4000');
  ok(R.okOpt(c.EVT374.zhangmen[1].o[1][1], G()) === false, '回春丹不足 2 颗时「各发一颗」不可选');
  // —— 提示卡 ——
  c = box({ stone: 900000 }); R = c.Route37; R.choose('shangjia'); c.Game.rollv = false; G().year = 101; t = R.yearTick();
  ok(t.tips.length === 2 && t.tips.every(x => x.t === '⚑ 富甲一方') && t.tips[0].s === c.TEXT374.tips.r37_fujia[0], '商贾 ≥30 万 / ≥80 万：两张提示卡，标题 ⚑');
  G().year = 102; ok(R.yearTick().tips.length === 0, '提示卡各只弹一次');
  c = box({ karma: -90, jh34: { npcs: { jh_jianke: { sect: 'qingyun' }, jh_mozi: { sect: 'tianmo' } } } }); R = c.Route37; R.choose('moxiu');
  ok(R.onKill('jh_mozi') === 0 && R.onKill('jh_jianke') === 1 && G().route37.pts === 8, '只有击败正道 NPC 才计 kills，+8 分');
  // —— 结局入口 ——
  c = box({ stone: 1000000 }); R = c.Route37; ok(R.ready().length === 0, '不在路线：没有路线结局'); R.choose('shangjia');
  let rd = R.ready(); ok(rd.length === 1 && rd[0].id === 'r37_fujia' && rd[0].where === 'merchant' && rd[0].label === '⚑ 大结局·富甲一方' && rd[0].confirm === '此生就此落幕？', '商贾 100 万：merchant 处出现「⚑ 大结局·富甲一方」，二次确认（A10.2）');
  ok(R.optionsFor('merchant').length === 1 && R.optionsFor('villager').length === 0, 'optionsFor 按 NPC 过滤');
  G().npc37 = { st: { merchant: { dead: 1 } } }; ok(R.ready()[0].where === 'villager', 'where 陨落 → 兜底 villager（A10.4）');
  const p0 = c.Game.meta.pts; await c.Game.die('r37_fujia'); ok(c.Game.meta.pts === p0 + 10 + 15 && G().ending === 'r37_fujia', '路线结局积分额外 +15，不要主线 done');
  c = box(); const q0 = c.Game.meta.pts; await c.Game.die('sit'); ok(c.Game.meta.pts === q0 + 10, '非路线结局积分不变');
  c = box({ realm: 4, debt: 0, jh34: { ch: { a: { done: 1 }, b: { done: 1 }, c: { done: 1 }, d: { done: 1, fail: 1 } } } }); R = c.Route37; R.choose('sanxiu');
  ok(R.ready().length === 0, '逍遥游：成功的链只有 3 条 → 不出'); G().jh34.ch.e = { done: 1 }; ok(R.ready()[0].id === 'r37_xiaoyao' && R.ready()[0].where === 'jh_jianke', '链 ≥4 且无债、元婴：萧十三处出逍遥游');
  G().debt = 5; ok(R.ready().length === 0, '还欠债 → 不出');
  c = box({ karma: -90, sectRel: { tianmo: 60 } }); R = c.Route37; R.choose('moxiu'); G().route37.kills = 3; ok(R.ready()[0].id === 'r37_mojun', '魔君：kills ≥3 且 tianmo ≥60');
  c = box({ realm: 2, fam37: { gen: 3, kids: [{ realm: 2 }, { realm: 3 }, { realm: 2, dead: 1 }] } }); R = c.Route37; R.choose('shijia'); ok(R.clanZj(G()) === 3 && R.ready()[0].id === 'r37_shijia' && R.ready()[0].where === 'mom', '仙门世家：族中在世筑基+ ≥3（含本人，不含已故）');
  // —— 坏档 / 源码约束 ——
  c = box({ route37: { id: 'bogus', pts: 'x', hist: 3, tip: [], loans: {}, later: null } }); R = c.Route37; ok(R.cur() === null && R.ensure().pts === 0 && Array.isArray(R.ensure().hist) && R.yearTick() === null, '坏 route37 字段修复，不报错');
  c = box(); c.Game.G = null; ok(R && c.Route37.yearTick() === null && c.Route37.ready().length === 0 && c.Route37.choose('sanxiu').ok === false, '没有存档不报错');
  ok(!/Math\.random\(\)\s*</.test(SRC.replace('return Math.random() < p;', '')), '概率判定都走 roll()（Game.roll 兜底一处）');
  ok(!/G\.realm\s*=[^=]|G\.sect\s*=[^=]|L\.pending|Life34\.rel\(/.test(SRC), '不改境界/宗门、不写 L.pending、不调 Life34.rel');
  const idx = fs.readFileSync(path.join(JS, '..', 'index.html'), 'utf8'); ok(idx.indexOf('js/route37.js') > idx.indexOf('js/fam37.js') && idx.indexOf('js/route37.js') < idx.indexOf('js/main.js'), 'index.html 在 fam37.js 之后、main.js 之前加载 route37.js');
  console.log(`${n - fails}/${n} PASS`); process.exit(fails);
})().catch(e => { console.log('FAIL 异常 ' + (e && e.stack)); process.exit(99); });

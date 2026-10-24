// NPC37E 自发事件（结仇/求助/讨债）单测：node test/npc37_events_unit.js（退出码 = 失败数）。纯 JS，vm 桩 + 真实 life34.js + 真实 jianghu34 say + 真实 npc37.js + npc37_events.js。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const JS = path.join(__dirname, '..', 'www', 'js');
const LIFE = fs.readFileSync(path.join(JS, 'life34.js'), 'utf8'), N37 = fs.readFileSync(path.join(JS, 'npc37.js'), 'utf8'), SRC = fs.readFileSync(path.join(JS, 'npc37_events.js'), 'utf8');
const JH = fs.readFileSync(path.join(JS, 'jianghu34.js'), 'utf8');
const sayLine = (JH.match(/^\s*say\(L, s, k, notable\) \{.*\},$/m) || [''])[0].trim().replace(/,$/, '');
const addAffLine = (JH.match(/^\s*addAff\(G, id, d\) \{.*\},$/m) || [''])[0].trim().replace(/,$/, '');
function box(noJH) {
  const c = { console: { log() {}, error() {} }, Math: Object.create(Math) }; c.window = c; vm.createContext(c);
  vm.runInContext(`
    var REALMS=[{n:'凡人',need:80}];var QUESTS={},SECTS={},ASSETS={maps:{}};var ITEMS={};
    var MAPINFO={market:{n:'云来坊市',mons:['slime'],tier:1},forest:{n:'青木林',mons:['treant'],tier:1},sect:{n:'青云宗',mons:[],tier:1}};
    var NPCS={jh_mozi:{n:'魔修·厉无咎',map:'forest'},jh_danniang:{n:'丹娘·苏半夏',map:'market'},jh_jianke:{n:'游方剑客·萧十三',map:'sect'},jh_yangui:{n:'女侠·燕归',map:'sect'},jh_tieguo:{n:'散修·赵铁锅',map:'market'},ali:{n:'狐妖·阿离',map:'forest'},mentor:{n:'落魄剑仙',map:'market'},sumei:{n:'魔女·苏魅',map:'market'}};
    var R={ents:[],mapId:'nowhere'};function t2p(i,j){return[i,j]}function s2w(x,y){return[x,y]}var pickAt=function(){return null};function walkable(){return true}function addEnt(){}function removeEnt(){}function loadSprite(){}var npcAI=function(){};
    var toasts=[];var UI={card:async()=>0,say:async()=>0,hud(){},toast(s){toasts.push(s)},modal:null};
    ${noJH ? '' : `var JH34={FEED_MAX:40,AFF_MAX:150,_toasts:[],relKey(a,b){return [a,b].sort().join('|')},ensure(G){G.jh34=G.jh34||{t:0,feed:[],npcs:{}};return G.jh34}, ${sayLine}, ${addAffLine}};`}
    var Game={G:null,save(){},async yearEnd(){},interactEnt(){},refreshNpcs(){},async enterMap(){},acceptQuest(){},canEnter(){return true},give(){},has(){return true},async apply(){return {txt:'',later:[]}}};
  `, c);
  vm.runInContext(LIFE, c); vm.runInContext(N37, c); vm.runInContext(SRC, c);
  vm.runInContext(`Game.G={year:10,age:30,stone:500,karma:0,aff:{},inv:{},flags:{},sectRel:{'qingyun|tianmo':-30},life34:{v:1,loc:{},rel:{},sect:{},log:[],seen:{},pending:null,qt:{},yc:null},
    jh34:{t:120,feed:[],npcs:{jh_jianke:{sect:'qingyun',map:'sect',debt:0},jh_yangui:{sect:'qingyun',map:'sect',debt:0},jh_mozi:{sect:'tianmo',map:'forest',debt:0},jh_tieguo:{sect:null,map:'market',debt:600},jh_danniang:{sect:'baicao',map:'market',debt:0}}}};`, c);
  return c;
}
const G = c => c.Game.G;
const esc = t => t.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
const from = (E, kind, s, ix) => (ix || E.TEXT[kind].map((_, i) => i)).some(i => new RegExp('^【江湖风云】' + esc(E.TEXT[kind][i]).replace(/\{(a|b|map)\}/g, '.+?') + '$').test(s));
(async () => {
  let c = box(); let E = c.NPC37E, N = c.NPC37;
  ok(E && typeof E.run === 'function' && typeof E.yearTick === 'function' && typeof E.force === 'function' && c.NEWS37C, '导出 NPC37E.run / yearTick / force 与 NEWS37C');
  const doc = fs.readFileSync(path.join(__dirname, '..', 'docs', 'research_story37_news_c.md'), 'utf8');
  const body = doc.slice(doc.indexOf('const NEWS37C = ') + 16, doc.lastIndexOf('};') + 1).replace(/(\n\s*)(feud|help|debt):/g, '$1"$2":').replace(/,(\s*[\]}])/g, '$1');
  ok(JSON.stringify(JSON.parse(body)) === JSON.stringify(E.TEXT) && E.TEXT.feud.length === 9 && E.TEXT.help.length === 9 && E.TEXT.debt.length === 9, 'NEWS37C 逐字等于 docs/research_story37_news_c.md（3 类 × 9 条）');
  ok(E.DEBT_PAID.concat(E.DEBT_DODGE).every(i => E.TEXT.debt[i]) && E.DEBT_PAID.every(i => E.DEBT_DODGE.indexOf(i) < 0), '讨债模板按讨回/赖账分组，下标有效且不重叠');
  // 关系初始化
  ok(E.key('mentor', 'ali') === 'ali|mentor' && E.key('ali', 'mentor') === 'ali|mentor', '关系键按字典序拼接');
  ok(E.rel('jh_jianke', 'jh_yangui') === 20 && E.rel('jh_jianke', 'jh_mozi') === -20 && E.rel('jh_jianke', 'jh_danniang') === 0 && E.rel('ali', 'mentor') === 0, '惰性初始化：同宗 +20、敌对宗 −20、其余 0');
  ok(G(c).npc37.rel['jh_jianke|jh_yangui'] === 20 && G(c).npc37.owe && typeof G(c).npc37.owe === 'object', '关系写进 G.npc37.rel（npc37 已有字段），欠账 G.npc37.owe');
  // 结仇
  G(c).npc37.rel['ali|mentor'] = -40; const f = E.run('feud', 'mentor', 'ali');
  ok(f && f.rel === -70 && G(c).npc37.tie['ali|mentor'] === 'ch' && f.s && f.s.startsWith('【江湖风云】') && /落魄剑仙|阿离/.test(f.s) && !/\{[abmap]+\}/.test(f.s), '结仇：rel −30（−40→−70），≤−60 标 tie=ch，新闻已填名');
  ok(G(c).jh34.feed.slice(-1)[0].k === 'npc37' && G(c).jh34.feed.slice(-1)[0].s === f.s && from(E, 'feud', f.s), '新闻写入 G.jh34.feed（k:npc37，经 JH34.say），文案来自 NEWS37C.feud');
  ok(N.st().yc.per.mentor === 1 && N.st().yc.per.ali === 1 && N.st().yc.news === 1, '与路遇共用计数：双方 per +1、年新闻 +1');
  ok(E.block('feud', 'mentor', 'sumei') === 'feud' && E.run('feud', 'sumei', 'mentor') === null, '每人每年最多 1 条结仇');
  // 求助
  c.Math.random = () => 0.1; G(c).life34.rel.jh_danniang = 50; G(c).aff.jh_tieguo = 10; const L0 = G(c).life34.rel.jh_tieguo || 0;
  const h = E.run('help', 'jh_danniang', 'jh_tieguo');
  ok(h && h.rel === 20 && h.loan === 100 && G(c).npc37.owe['jh_tieguo>jh_danniang'] === 100 && from(E, 'help', h.s), '求助：rel +20，出手者借钱给被救者记账 owe[债主>欠债人]');
  ok(h.aff === 3 && G(c).aff.jh_tieguo === 13 && (G(c).life34.rel.jh_tieguo || 0) === L0, '被救者是玩家好友（rel≥40）→ 玩家对出手者 G.aff +3（JH34.addAff），不直接加 L.rel');
  c.Math.random = Math.random;
  // 讨债
  ok(E.block('debt', 'mentor', 'sumei') !== null && E.block('debt', 'jh_tieguo', 'jh_danniang') === null, '讨债：没有账且对方不欠讨债司 → 不发生；有账可讨');
  const d1 = E.run('debt', 'jh_tieguo', 'jh_danniang', { paid: false });
  ok(d1 && !d1.paid && d1.amt === 100 && G(c).npc37.owe['jh_tieguo>jh_danniang'] === 110 && d1.rel === 5 && from(E, 'debt', d1.s, E.DEBT_DODGE), '讨债赖账：加息一成（100→110）、rel −15、用赖账模板');
  G(c).year = 11; const d2 = E.run('debt', 'jh_tieguo', 'jh_danniang', { paid: true });
  ok(d2 && d2.paid && d2.amt === 110 && !G(c).npc37.owe['jh_tieguo>jh_danniang'] && d2.rel === 10 && from(E, 'debt', d2.s, E.DEBT_PAID), '讨债讨回：账清、rel +5、用讨回模板');
  ok(E.block('debt', 'sumei', 'jh_tieguo') === null, '对方欠讨债司（JH34 s.debt>0，只读）也可被讨债');
  const g0 = G(c).jh34.npcs.jh_tieguo.debt; const d3 = E.run('debt', 'sumei', 'jh_tieguo', { paid: false });
  ok(d3 && d3.amt === 300 && G(c).jh34.npcs.jh_tieguo.debt === g0 && G(c).debt === undefined && G(c).stone === 500, '按其讨债司欠款一半起账（600→300），不改 JH34 s.debt / 玩家 G.debt / 灵石');
  // 上限
  G(c).year = 12; const S = N.st(); S.yc.per.ali = 2; ok(E.block('help', 'ali', 'mentor') === 'quota' && E.run('help', 'ali', 'mentor') === null, '某人本年已 2 条（含路遇）→ 不再发生');
  G(c).year = 13; N.st().yc.news = 6; ok(E.block('help', 'mentor', 'sumei') === 'quota', '全年新闻已 6 条 → 不再发生');
  const fz = E.run('help', 'mentor', 'sumei', { force: true }); ok(fz && fz.s && N.st().yc.news === 7, '开发者强制：跳过额度但照样计入');
  // 路遇占额度 → 自发事件跳过
  G(c).year = 14; N.st(); G(c).jh34.t = 400; N.onMeet('ali', 'forest'); N.onMeet('ali', 'market2', { force: true }); ok(E.block('help', 'ali', 'mentor') === 'quota', '路遇用掉 2 次 → 同年该 NPC 无自发事件');
  // toast：与玩家好友相关 / 本图；全年 ≤2
  G(c).year = 15; c.toasts.length = 0; G(c).life34.rel.mentor = 60; c.Math.random = () => 0.9;
  E.run('help', 'mentor', 'ali'); E.run('help', 'sumei', 'mentor', { force: true }); G(c).npc37.rel['jh_mozi|mentor'] = -10; E.run('feud', 'mentor', 'jh_mozi', { force: true });
  c.Math.random = Math.random;
  ok(N.st().yc.toast === 2 && c.toasts.length === 2, '与玩家 rel≥40 者相关才 toast，全年 ≤2 条（与路遇共用）');
  // 衰减
  G(c).npc37.rel['a|b'] = 80; G(c).npc37.rel['c|d'] = -62; G(c).npc37.tie['c|d'] = 'ch'; G(c).npc37.rel['e|f'] = 50; E.decay();
  ok(G(c).npc37.rel['a|b'] === 75 && G(c).npc37.rel['c|d'] === -57 && !G(c).npc37.tie['c|d'] && G(c).npc37.rel['e|f'] === 50, '年度衰减：|rel|>60 向 0 移 5，回到 −60 以上解除 ch');
  // rel 夹取
  G(c).npc37.rel['ali|sumei'] = -95; ok(E.addRel('ali', 'sumei', -30) === -100 && E.addRel('ali', 'sumei', 500) === 100, 'rel 夹取 −100..100');
  // 陨落者不参与
  G(c).npc37.st.sumei = { dead: 1 }; ok(E.block('help', 'sumei', 'mentor') === 'dead' && E.ids().indexOf('sumei') < 0 && !!E.force('help'), '陨落 NPC 不参与自发事件');
  delete G(c).npc37.st.sumei;
  // 年末包裹：yearNews 先掷自发事件再补到 3 条；100 年模拟
  c = box(); E = c.NPC37E; N = c.NPC37;
  ok(N.yearNews._e37 === 1, 'NPC37.yearNews 已被包裹（不再包 Game.yearEnd）');
  let bad = [], evs = 0, kinds = {}; const bus = []; N.bus.on('npc:feud', e => bus.push(e)); N.bus.on('npc:help', e => bus.push(e)); N.bus.on('npc:debt', e => bus.push(e));
  for (let y = 20; y < 120; y++) { G(c).year = y; G(c).jh34.t = y * 12; await c.Game.yearEnd(); const yc = N.st().yc; evs += yc.e37; const mx = Math.max(0, ...Object.values(yc.per)); const fm = Math.max(0, ...Object.values(yc.feud || {}));
    if (yc.news > 6 || yc.news < 3 || mx > 2 || fm > 1 || yc.toast > 2 || yc.e37 < 1 || yc.e37 > 2) bad.push([y, yc.news, mx, fm, yc.e37]); }
  bus.forEach(e => kinds[e.kind] = (kinds[e.kind] || 0) + 1);
  ok(!bad.length, `100 年模拟：每年新闻 3–6、每人 ≤2、结仇每人 ≤1、toast ≤2、自发事件 1–2 条 ${JSON.stringify(bad.slice(0, 3))}`);
  ok(kinds.feud > 0 && kinds.help > 0 && kinds.debt > 0, `三类都会发生 ${JSON.stringify(kinds)}`);
  ok(Object.values(G(c).npc37.rel).every(v => v >= -100 && v <= 100 && Number.isInteger(v)), 'rel 永远在 −100..100 的整数');
  ok(G(c).jh34.feed.length === 40, '100 年后 feed 恰好 40 条（FEED_MAX 裁剪）');
  ok(G(c).life34.pending === null, '不碰 L.pending');
  // 存档兼容
  c = box(); delete G(c).npc37; ok(c.NPC37E.rel('ali', 'mentor') === 0 && G(c).npc37.v === 1 && G(c).npc37.owe, '老档无 G.npc37：惰性建档');
  { const cc = box(); G(cc).npc37 = { v: 1, st: {}, yc: { yr: 10, n: 0, per: {}, map: {} }, ev: {}, q: [] }; const E = cc.NPC37E; E.run('feud', 'ali', 'mentor', { force: true }); E.run('help', 'ali', 'mentor', { force: true }); const V = G(cc).npc37.ev; ok(V.feud === 1 && V.help === 1 && V.debt === 0 && V.meet === 0 && V.total === 2, '旧档 ev={} → 自发事件 feud/help/total 计数'); delete G(cc).npc37.ev; E.run('debt', 'ali', 'mentor', { force: true }); ok(G(cc).npc37.ev.debt === 1 && G(cc).npc37.ev.total === 1, 'ev 缺失 → 重建并计 debt'); }
  c = box(); G(c).npc37 = { v: 1, st: {}, yc: { yr: 10, n: 1, per: { ali: 1 }, map: {} }, ev: {}, q: [] }; const ev = c.NPC37E.run('help', 'ali', 'mentor');
  ok(ev && G(c).npc37.rel['ali|mentor'] === 20 && G(c).npc37.tie && G(c).npc37.owe && G(c).npc37.yc.per.ali === 2, '旧 npc37 存档（无 rel/tie/owe/feud）补字段并保留本年计数');
  c = box(); G(c).npc37 = { v: 1, rel: 'bad', tie: null, owe: 3, st: {}, yc: { yr: 10, n: 0, per: {}, map: {} }, ev: {}, q: [] }; ok(c.NPC37E.run('feud', 'ali', 'mentor', { force: true }) && typeof G(c).npc37.rel === 'object', '坏字段（rel/tie/owe 非对象）重建不报错');
  c = box(); G(c).jh34.feed = Array.from({ length: 40 }, (_, i) => ({ t: 0, s: 'x' + i, k: 'x' })); c.NPC37E.force('feud');
  ok(G(c).jh34.feed.length === 40 && G(c).jh34.feed[39].k === 'npc37' && G(c).jh34.feed[0].s === 'x1', 'feed 已满 40 → 裁掉最旧一条');
  c = box(true); c.NPC37E.force('help'); ok(G(c).jh34.feed.length === 1 && G(c).jh34.feed[0].k === 'npc37', '没有 JH34 时走 npc37 兜底 feed');
  c = box(); c.Game.G = null; ok(c.NPC37E.yearTick() === 0 && c.NPC37E.force() === null && c.NPC37E.run('help', 'a', 'b') === null, '没有存档不报错');
  // 寻路守卫（对齐 2f9407b）：R.player.nav 时不弹 toast
  c = box(); c.R.mapId = 'market'; c.R.player = { nav: true }; ok(c.NPC37E.notable('jh_danniang', 'jh_tieguo') === false, '寻路中（R.player.nav）自发事件不算 notable、不弹 toast');
  c.R.player.nav = null; ok(c.NPC37E.notable('jh_danniang', 'jh_tieguo') === true, '不寻路时同图事件照常 notable');
  // 概率走 Game.roll（奥拉夫 #42 建议，与 dlg37 一致）；没有 Game.roll 时退回 Math.random
  c = box(); { const calls = []; c.Game.roll = (p, k) => { calls.push([p, k]); return false; }; c.Math.random = () => 0;
    ok(c.NPC37E.roll(0.99) === false && calls.length === 1 && calls[0][0] === 0.99 && calls[0][1] === 'npc37e', 'Game.roll 存在时概率判定交给 Game.roll(p, \'npc37e\')，不看 Math.random');
    c.Game.roll = () => true; const hh = c.NPC37E.run('help', 'jh_danniang', 'jh_tieguo'); ok(hh && hh.loan > 0, 'Game.roll 为真 → 求助附带借钱（走 roll 而非 Math.random）');
    delete c.Game.roll; c.Math.random = () => 0.2; ok(c.NPC37E.roll(0.3) === true && c.NPC37E.roll(0.1) === false, '没有 Game.roll → 退回 Math.random() < p');
    c.Math.random = Math.random; }
  ok(!/Math\.random\(\)\s*</.test(SRC.replace(/return Math\.random\(\) < p;/, '')), '源码里概率判定只剩 roll() 兜底一处 Math.random() <');
  // 源码约束
  ok(!/L\.pending\s*=|pending\.push|Life34\.rel\(|\.rel\[[^\]]+\]\s*[+\-]?=/.test(SRC.replace(/S\.rel\[[^\]]+\]\s*=/g, '').replace(/S\.rel\[p\]\s*=/g, '')), '不写 L.pending、不调 Life34.rel、不直接改 L.rel');
  ok(!/G\.debt\s*[+\-]?=|\.debt\s*[+\-]=|G\.stone\s*[+\-]?=/.test(SRC), '不改玩家 G.debt / 灵石、不改 JH34 债务（只读）');
  ok(!/Game\.yearEnd\s*=/.test(SRC) && !/npcAI\s*=/.test(SRC), '不再包 Game.yearEnd / npcAI（只包 NPC37.yearNews）');
  const idx = fs.readFileSync(path.join(JS, '..', 'index.html'), 'utf8'); ok(idx.indexOf('js/npc37.js') >= 0 && idx.indexOf('js/npc37.js') < idx.indexOf('js/npc37_events.js'), 'index.html 在 npc37.js 之后加载 npc37_events.js');
  { const dev = fs.readFileSync(path.join(JS, 'dev_openworld.js'), 'utf8');
    if (/NPC37/.test(dev)) ok(/label: '自发事件'/.test(dev) && /NPC37E\.force\(\)/.test(dev), '开发者面板有「自发事件」强制触发按钮');
    else ok(!/NPC37E/.test(dev), 'main 的 dev_openworld.js 不引用 NPC37E'); }
  console.log(`${n - fails}/${n} PASS`); process.exit(fails);
})().catch(e => { console.log('FAIL 异常 ' + (e && e.stack)); process.exit(99); });

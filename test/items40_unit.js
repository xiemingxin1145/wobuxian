// 3.8.2 道具 items40 单测：node test/items40_unit.js（退出码 = 失败数）
// vm 里按 index.html 顺序加载真实 www/js（除 update/main），桩 UI 弹窗/DOM；可选注入 3.8.0 profile38.js（www/js 里有就用，否则从 origin/prof38 取）。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
let fails = 0, n = 0, skip = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..'), W = path.join(ROOT, 'www');
const html = fs.readFileSync(path.join(W, 'index.html'), 'utf8');
const SCRIPTS = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(s => !/js\/(update|main)\.js$/.test(s));
let PF_SRC = null;
if (fs.existsSync(path.join(W, 'js/profile38.js'))) PF_SRC = fs.readFileSync(path.join(W, 'js/profile38.js'), 'utf8');
else { try { PF_SRC = cp.execSync('git show origin/prof38:www/js/profile38.js', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch (e) { PF_SRC = null; } }
function mkEl() { return new Proxy({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } }, { get(t, k) { if (k in t) return t[k]; if (k === 'querySelector') return () => null; if (k === 'querySelectorAll') return () => []; return typeof k === 'string' && /^(append|add|remove|set|insert|focus|click)/.test(k) ? () => {} : undefined; } }); }
function box(withPF) {
  const doc = { createElement: mkEl, head: mkEl(), body: mkEl(), addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, getElementById() { return null; } };
  const c = { console: { log() {}, warn() {}, error() {}, info() {} }, Math: Object.create(Math), JSON, setTimeout: (f, ms) => setTimeout(f, 0), clearTimeout() {}, setInterval() { return 0; }, clearInterval() {}, document: doc, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    navigator: { userAgent: '' }, performance: { now: () => 0 }, requestAnimationFrame() {}, addEventListener() {}, location: { hash: '', search: '' }, Image: function () {}, Audio: function () {}, MutationObserver: function () { this.observe = () => {}; }, innerWidth: 412, innerHeight: 915, devicePixelRatio: 1 };
  c.window = c; vm.createContext(c);
  for (const s of SCRIPTS) {
    // withPF=false：跳过 profile38，模拟 3.8.0 未合入（gate / 窥心类静默）
    if (!withPF && /js\/profile38\.js$/.test(s)) continue;
    if (withPF && s === 'js/items40.js' && PF_SRC && !SCRIPTS.includes('js/profile38.js')) {
      try { vm.runInContext(PF_SRC, c, { filename: 'profile38.js' }); } catch (e) { }
    }
    try { vm.runInContext(fs.readFileSync(path.join(W, s), 'utf8'), c, { filename: s }); } catch (e) { }
  }
  vm.runInContext(`
    var T = { cards: [], says: [], toasts: [], panels: [], script: [], fights: [], fightRes: 'win' };
    const pickOpt = (o) => { if (!T.script.length) return o.length - 1; const k = T.script.shift(); return typeof k === 'function' ? k(o) : k; };
    UI.card = async (t, x, p, o) => { T.cards.push({ t, x, o }); return pickOpt(o || ['好']); };
    UI.say = async (p, nm, x, o) => { T.says.push({ nm, x, o }); return pickOpt(o || ['好']); };
    UI.toast = s => { T.toasts.push(String(s)); }; UI.hud = () => {}; UI.panel = async (k, id) => { T.panels.push([k, id]); }; UI.yearFx = () => {}; UI.fade = async () => {};
    Game.save = () => {}; Game.saveMeta = () => {}; Game.fight = async (m, o) => { T.fights.push([m, o]); return { res: T.fightRes }; };
    Sfx.play = () => {}; part = () => {}; t2p = () => [0, 0]; Game.levelFx = () => {};
    fx = async () => {}; moveUnit = async () => {}; floatText = (x, y, s) => { T.floats = T.floats || []; T.floats.push(String(s)); }; uPos = () => [0, 0];
    R.dpr = 1; R.shake = 0; R.mode = 'map'; R.player = { i: 1, j: 1 }; R.mapId = 'village'; R.ents = [];
  `, c);
  return c;
}
function newG(c, extra) {
  const G = vm.runInContext(`Game.loadMeta(); Game.newLife({ name: '测试', sex: 'm', lg: 'tian', talents: [], st: { con: 5, int: 5, luck: 5, cha: 5, wealth: 5 } }); Game.G`, c);
  Object.assign(G, { stone: 100000, realm: 2, stage: 0, year: 10, month: 0 }, extra || {}); G.flags.awakened = 1; return G;
}
const ev = (c, s) => vm.runInContext(s, c);
(async () => {
  // ============ 静态 ============
  let c = box(false); const IT = ev(c, 'ITEMS'), I40 = ev(c, 'ITEMS40'), GIFTS = ev(c, 'GIFTS'), NPCS = ev(c, 'NPCS'), AS = c.ASSETS, I = ev(c, 'Items40');
  const ids = Object.keys(I40);
  ok(ids.length === 60 && ids.every(k => k.startsWith('i40_')), '60 个 id 全部 i40_ 前缀');
  const baseN = Object.keys(IT).filter(k => !k.startsWith('i40_')).length; ok(ids.length === 60 && Object.keys(IT).length === baseN + 60 && baseN >= 31, 'ITEMS 总数 = 非i40(' + baseN + ') + 60 i40（基线≥31，开放世界线可含 zf39 道具）');
  ok(ids.filter(k => I40[k].t === 'gift').length === 20 && ids.filter(k => I40[k].t === 'quest').length === 15 && ids.filter(k => !['gift', 'quest'].includes(I40[k].t)).length === 25, '分类 25 / 20 / 15');
  ok(ids.every(k => AS.icons.f[I40[k].ic]), '全部图标存在于图集');
  ok(I.GIFTS.every(g => GIFTS.includes(g)) && GIFTS.length === 26, 'GIFTS = 原 6 + 20');
  ok(ids.filter(k => I40[k].quest).every(k => I40[k].p === 0 && !GIFTS.includes(k)), '剧情道具 p=0（不可出售）且不在 GIFTS（不可赠送）');
  const bad = []; I.GIFTS.forEach(g => I40[g].love.concat(I40[g].hate).forEach(x => { if (x !== 'kin' && !NPCS[x]) bad.push(g + ':' + x); })); ok(!bad.length, '礼物 love/hate 引用的 NPC 都存在' + (bad.length ? ' ' + bad : ''));
  ok(ev(c, "DevTabs.some(t => t.key === 'items40')"), '开发者面板注册「道具40」Tab');
  const idxs = SCRIPTS.indexOf('js/items40.js'); ok(idxs > SCRIPTS.indexOf('js/chain37.js') && idxs > SCRIPTS.indexOf('js/fam37.js') && idxs > SCRIPTS.indexOf('js/lg36.js'), 'index.html：items40 在 3.7 模块之后加载');
  ok(SCRIPTS.indexOf('js/profile38.js') >= 0 && idxs > SCRIPTS.indexOf('js/profile38.js') && idxs > SCRIPTS.indexOf('js/zf39.js') && (SCRIPTS.indexOf('js/zf39_ui.js') < 0 || idxs > SCRIPTS.indexOf('js/zf39_ui.js')), 'index.html：items40 在 profile38 / zf39(/ui) 之后');
  // ============ 老存档兼容 ============
  let G = newG(c); delete G.i40; const v0 = G.v;
  ok(ev(c, "Game.roll(1.1,'qiyu')") === true && ev(c, "Game.roll(-1,'qiyu')") === false && !G.i40, '老档：Game.roll 行为不变，不偷偷建 G.i40');
  const cm0 = ev(c, 'Game.cultMult()'); ok(cm0 > 0, '老档：cultMult 正常');
  G.debt = 10000; await ev(c, 'Game.yearEnd()'); ok(G.year === 11 && G.debt >= 10300 && !G.dead, '老档：过年欠款照常 3% 计息，无报错（' + G.debt + '）');
  G.i40 = { cnt: [], yr: 'x', mixin: 3 }; const S0 = I.ensure(G); ok(S0.v === 1 && !Array.isArray(S0.cnt) && typeof S0.yr === 'object' && Array.isArray(S0.mixin) && S0.half === -1 && S0.birth === -1 && G.v === v0 && v0 === 2, 'ensure 修复坏字段；G.v 仍为 2');
  ev(c, 'Math.random = () => 0.01'); ok(I.chance(0.05, 'drop') === true, 'chance：走 Game.roll（rnd 0.01 < 0.05）');
  ev(c, 'Math.random = () => 0.9'); ok(I.chance(0.05, 'drop') === false, 'chance：走 Game.roll（rnd 0.9 不中）');
  ev(c, 'Math.random = Object.getPrototypeOf(Math).random');
  ev(c, 'T.toasts.length = 0'); I.toast('玩家动作 toast'); ok(ev(c, 'T').toasts.includes('玩家动作 toast'), 'toast：玩家动作始终弹出');
  ev(c, "NPC37.storyBlock = () => 'prologue'"); ev(c, 'T.toasts.length = 0'); I.autoToast('序章不弹'); ok(!ev(c, 'T').toasts.includes('序章不弹'), 'autoToast：storyBlock 为真时不弹（#53）');
  ev(c, 'NPC37.storyBlock = function () { return null; }'); ev(c, 'T.toasts.length = 0'); I.autoToast('放行 toast'); ok(ev(c, 'T').toasts.includes('放行 toast'), 'autoToast：storyBlock 放行时弹出');
  // ============ 使用效果 ============
  const use = async k => { const n0 = G.inv[k] || 0; await ev(c, `UI.useItem(${JSON.stringify(k)})`); return n0 - (G.inv[k] || 0); };
  const T = ev(c, 'T'); const lastToast = () => T.toasts[T.toasts.length - 1] || '';
  c = box(false); G = newG(c); const Tc = () => ev(c, 'T'); const use2 = async k => { const n0 = G.inv[k] || 0; await ev(c, `UI.useItem(${JSON.stringify(k)})`); return n0 - (G.inv[k] || 0); };
  const toast = () => { const t = Tc().toasts; return t[t.length - 1] || ''; };
  ev(c, "Game.give('i40_xiaoyao',5)"); let lb = G.lifeBonus; let used = 0; for (let i = 0; i < 3; i++) used += await use2('i40_xiaoyao');
  ok(used === 3 && G.lifeBonus === lb + 6, '逍遥丸：每颗寿元 +2（不是 +20）');
  ok(await use2('i40_xiaoyao') === 0 && /🔒/.test(toast()), '逍遥丸：同境界第 4 颗 🔒 不消耗'); G.realm = 3; ok(await use2('i40_xiaoyao') === 1, '逍遥丸：换大境界重新计数'); G.realm = 2;
  ev(c, "Game.give('i40_huanyan',4);Game.give('i40_kaiqiao',4)"); const cha0 = G.st.cha, int0 = G.st.int; for (let i = 0; i < 3; i++) { await use2('i40_huanyan'); await use2('i40_kaiqiao'); }
  ok(G.st.cha === cha0 + 3 && G.st.int === int0 + 3, '驻颜丹/开窍丹：魅力/悟性 +1×3');
  ok(await use2('i40_huanyan') === 0 && await use2('i40_kaiqiao') === 0 && G.st.cha === cha0 + 3, '驻颜丹/开窍丹：第 4 颗 🔒 不消耗');
  const L36 = ev(c, 'LG36'); L36.st(G).pur = 50; ev(c, "Game.give('i40_xisui_s',3)"); ok(await use2('i40_xisui_s') === 1 && L36.pur(G) === 58, '小洗髓液：纯度 +8（不是 +5）'); L36.st(G).pur = 100; ok(await use2('i40_xisui_s') === 0, '小洗髓液：纯度满不消耗');
  ev(c, "Game.give('i40_lingshou',2)"); G.petA = -1; ok(await use2('i40_lingshou') === 0 && /没有出战的灵宠/.test(toast()), '灵兽肉干：无出战灵宠不消耗');
  ev(c, "Game.addPet(Object.keys(PET_SKILL)[0],1)"); G.petA = 0; const pe0 = JSON.stringify(G.pets[0]); ok(await use2('i40_lingshou') === 1 && JSON.stringify(G.pets[0]) !== pe0, '灵兽肉干：有出战灵宠 → 消耗、灵宠成长');
  ev(c, "Game.give('i40_jingxin',2)"); ok(await use2('i40_jingxin') === 1 && G.i40.dz === 1, '静心丹：标记下一次打坐'); ok(await use2('i40_jingxin') === 0, '静心丹：同年第 2 颗 🔒');
  // 打坐：dz 时 bonus×2（选项 0 = 打坐）
  const matGain = async () => { G.ap = 3; Tc().script.push(0); Tc().cards.length = 0; await ev(c, 'Acts.mat({})'); const cd = Tc().cards.find(x => x.t === '出关'); return cd ? +(cd.x.match(/修为 \+([\d.]+)/) || [0, 0])[1] : -1; };
  G.exp = 0; G.realm = 1; G.i40.dz = 0; ev(c, 'Math.random = () => 0.5'); const g1 = await matGain(); G.i40.dz = 1; const g2 = await matGain();
  ok(g1 > 0 && Math.abs(g2 / g1 - 2) < 0.05 && G.i40.dz === 0, `静心丹：打坐修为 ×2（${g1} → ${g2}），打坐后效果用掉`);
  G.i40.dz = 1; G.ap = 3; Tc().script.push(o => o.length - 1); await ev(c, 'Acts.mat({})'); ok(G.i40.dz === 1, '静心丹：选「算了」不消耗药效'); G.realm = 2;
  ev(c, "Game.give('i40_xingyun',1)"); await use2('i40_xingyun'); ok(G.i40.luck === 1, '转运珠：使用后 luck=1');
  ok(ev(c, "Game.roll(-1,'qiyu')") === false && G.i40.luck === 1, '转运珠：非 Chain37.yearTick 的 qiyu 不消耗 luck（防 VIP 偷吃）');
  ok(ev(c, "Game.roll(-1,'drop')") === false && G.i40.luck === 1, '转运珠：不影响其它 kind');
  // yearTick 风声才消耗：random=0.99 本会失败，luck 强制命中
  G.debt = 10000; G.realm = 2; G.dead = false; ev(c, 'Chain37.root(Game.G).ch = {}');
  ev(c, 'Math.random = () => 0.99'); await ev(c, 'Chain37.yearTick(Game.G)');
  ok(G.i40.luck === 0 && !!ev(c, "Chain37.st('c37_1', Game.G).offer"), '转运珠：yearTick 风声必中并消耗 luck');
  // VIP yearEnd 复现（奥拉夫 #55）：vip=1 + luck=1 + random0.99 → yearTick 入口 luck 仍为 1，风声拿到
  G.flags.vip = 1; I.ensure(G).luck = 1; G.debt = 10000; G.realm = 2; G.dead = false;
  ev(c, 'Chain37.root(Game.G).ch = {}');
  ev(c, 'var __luckAtTick = -1; (function(){ const _yt = Chain37.yearTick; Chain37.yearTick = async function (G) { __luckAtTick = (G && G.i40 && G.i40.luck) || 0; try { return await _yt.apply(this, arguments); } finally { Chain37.yearTick = _yt; } }; })()');
  await ev(c, 'Game.yearEnd()');
  ok(ev(c, '__luckAtTick') === 1, '转运珠 VIP 复现：yearTick 入口 luck 仍为 1（未被 VIP roll(0.3,qiyu) 偷吃）');
  ok(G.i40.luck === 0 && !!ev(c, "Chain37.st('c37_1', Game.G).offer"), '转运珠 VIP 复现：yearEnd 后风声仍触发、luck 耗尽');
  G.flags.vip = 0;
  const cmA = ev(c, 'Game.cultMult()'); ev(c, "Game.give('i40_dazuo',2)"); const cmB = ev(c, 'Game.cultMult()'); ok(Math.abs(cmB / cmA - 1.1) < 1e-9, '千年蒲团：持有 cultMult ×1.10，多个不叠加');
  ok(!I40.i40_dazuo.use, '千年蒲团：无「使用」按钮（passive）');
  // 延期还款单
  const yearDebt = async (half) => { G.debt = 100000; G.dead = false; if (G.fam37) G.fam37.rate = 0; if (half) { ev(c, "Game.give('i40_jiezhai',1)"); await use2('i40_jiezhai'); } const d0 = G.debt; await ev(c, 'Game.yearEnd()'); return G.debt - d0; };
  ev(c, 'Math.random = () => 0.99'); const inc0 = await yearDebt(false); const dUse = G.debt; const inc1 = await yearDebt(true);
  ok(inc0 === 3000 && inc1 === 1500, `延期还款单：年结算利息减半（${inc0} → ${inc1}）`);
  G.debt = 5000; ev(c, "Game.give('i40_jiezhai',1)"); await use2('i40_jiezhai'); ok(G.debt === 5000, '延期还款单：使用本身不增加欠款（I2 回归）'); ok(await use2('i40_jiezhai') === 0, '延期还款单：同年第 2 张 🔒');
  // 忘忧水
  G.aff.cuihua = 50; G.aff.mom = 40; G.aff.sumei = 30; G.partner = 'sumei'; ev(c, 'Life34.st().rel.cuihua = 20'); ev(c, "Game.give('i40_wangyou',1)");
  Tc().script.push(o => { Tc()._wy = o; return o.findIndex(x => x.startsWith(NPCS.cuihua.n)); }); ok(await use2('i40_wangyou') === 1 && G.aff.cuihua === 0 && ev(c, 'Life34.st().rel.cuihua') === 0, '忘忧水：好感与恩怨清零');
  ok(!Tc()._wy.some(x => x.startsWith(NPCS.mom.n) || x.startsWith(NPCS.sumei.n)), '忘忧水：名单排除道侣与娘'); G.partner = null;
  // 月老红线 / 送子
  const F = ev(c, 'FAM37'); F.ensure(G); G.aff.ruyan = 85; ev(c, 'Life34.st().rel.ruyan = 45'); ok(!F.canMarry(G, 'ruyan'), '月老红线：未用时 aff85/rel45 不能结侣');
  ev(c, "Game.give('i40_yuelao',1)"); await use2('i40_yuelao'); ok(F.canMarry(G, 'ruyan'), '月老红线：门槛降为 aff≥80 && rel≥40'); ok(F.marry('ruyan') && G.i40.match === 0 && G.fam37.sp === 'ruyan', '月老红线：结侣后红线用掉');
  G.fam37.kids = []; ev(c, "Game.give('i40_songzi',1)"); await use2('i40_songzi'); ok(G.i40.birth === G.year, '送子观音瓶：标记当年');
  G.year++; await F.famYear(() => 0.9); ok(G.fam37.kids.length === 0 && G.i40.birth === -1, '送子观音瓶：+40% 掷骰失败（0.9）不出生，标记清除');
  G.i40.birth = G.year - 1; await F.famYear((() => { const q = [0.9, 0.9, 0.1]; return () => q.length ? q.shift() : 0.9; })()); ok(G.fam37.kids.length === 1, '送子观音瓶：原 30% 没中时再掷 40% 中 → 降生');
  G.partner = null; G.fam37.sp = null; ev(c, "Game.give('i40_songzi',1)"); ok(await use2('i40_songzi') === 0 && /道侣/.test(toast()), '送子观音瓶：无道侣不消耗');
  // 3.8.3 道具 / 战斗道具 / 无 PF38
  for (const k of I.CLAN) ev(c, `Game.give('${k}',1)`); let cl = 0; for (const k of I.CLAN) cl += await use2(k); ok(I.CLAN.length === 6 && cl === 0 && /3\.8\.3/.test(toast()), '6 个 3.8.3 道具：使用不消耗，提示尚未开放');
  for (const k of ['i40_poxie', 'i40_dunfu', 'i40_leifu']) ev(c, `Game.give('${k}',1)`); let bu = 0; for (const k of ['i40_poxie', 'i40_dunfu', 'i40_leifu']) bu += await use2(k); ok(bu === 0 && /战斗中才能用/.test(toast()), '战斗符：背包里使用不消耗');
  for (const k of I.PF) ev(c, `Game.give('${k}',1)`); let pu = 0; for (const k of I.PF) pu += await use2(k); ok(pu === 0 && /3\.8\.0/.test(toast()), '无 PF38：窥心/养神丹使用不消耗，提示未开放');
  ev(c, "Game.give('i40_huiyuan',1)"); G.hp = 1; ok(await use2('i40_huiyuan') === 1 && G.hp > 1, '回元散：背包里回血（use:heal）');
  ev(c, "Game.give('i40_shuguan',1)"); const tk0 = Object.keys(G.techs).length; ok(await use2('i40_shuguan') === 1 && Object.keys(G.techs).length >= tk0, '书馆借书证：use:scroll 可用');
  ev(c, "Game.give('i40_cuihuabao',1)"); const ac0 = G.aff.cuihua || 0; ok(await use2('i40_cuihuabao') === 1 && G.aff.cuihua === ac0 + 15, '七个荷包：使用翠花好感 +15');
  ev(c, "Game.give('i40_jiezhai_qi',1)"); ok(await use2('i40_jiezhai_qi') === 0 && G.flags.i40_contract === 1 && Tc().cards.some(x => x.t === '天道借债契' && /担保人/.test(x.x)), '天道借债契：弹契约全文、flag、不消耗');
  ev(c, "Game.give('i40_lingpai',1)"); ok(await use2('i40_lingpai') === 0 && /守墓人/.test(toast()), '剧情道具：背包使用只提示交给谁，不消耗');
  // ============ 商店 / 掉落 ============
  const SH = ev(c, 'SHOPS'); G.aff.danlao = 0; G.aff.leigong = 0; G.realm = 1;
  const allShop = () => Object.values(SH).flatMap(s => s.items);
  ok(['yaopu', 'merchant', 'sumei', 'xianguan', 'fisherm', 'qianxd', 'sanniang', 'shuoshu', 'danlao', 'leigong', 'guzhu', 'taizi', 'guanghan', 'farmer', 'guichengxiang', 'caishen'].every(s => SH[s]), '商店：6 家追加 + 10 家新店');
  ok(SH.yaopu.items.includes('i40_huiyuan') && SH.merchant.items.includes('i40_dunfu') && SH.sumei.items.includes('i40_huanyan') && SH.xianguan.items.includes('i40_jiezhai') && SH.fisherm.items.includes('i40_xingyun') && SH.qianxd.items.includes('i40_yueguang'), '商店：追加货品到位');
  ok(!I.CLAN.some(k => allShop().includes(k)), '商店：6 个 3.8.3 道具不在任何店');
  ok(!I.PF.some(k => allShop().includes(k)), '无 PF38：窥心类/养神丹不进商店');
  ok(!SH.leigong.items.includes('i40_leifu') && !SH.merchant.items.includes('i40_tiezhi'), '门槛：雷公 aff<40 无掌心雷；练气无请柬');
  G.aff.leigong = 40; G.realm = 2; ok(SH.leigong.items.includes('i40_leifu') && SH.merchant.items.includes('i40_tiezhi'), '门槛：雷公 aff≥40 出掌心雷；筑基出请柬');
  ok(SH.merchant.items.includes('hcd') && SH.yaopu.items.includes('herb'), '商店：原有货品不变');
  const shopIds = new Set(allShop()); const unsold = ids.filter(k => !I40[k].quest && !I40[k].clan && !I40[k].pf && !shopIds.has(k) && !['i40_huaduo', 'i40_dazuo', 'i40_yaocao', 'i40_jianpei'].includes(k) && !shopIds.has(k)); ok(!unsold.length, '非剧情/非 3.8.3/非 PF 道具都有来源（商店或掉落）' + (unsold.length ? ' 缺:' + unsold : ''));
  // 采药野花
  G.ap = 3; ev(c, 'Math.random = () => 0.1'); const hf0 = G.inv.i40_huaduo || 0; await ev(c, "Acts.herb({key:'h1'})"); ok((G.inv.i40_huaduo || 0) === hf0 + 1, '采药：15% 掉野花一束（rnd 0.1）');
  ev(c, 'Math.random = () => 0.5'); G.ap = 3; await ev(c, "Acts.herb({key:'h2'})"); ok((G.inv.i40_huaduo || 0) === hf0 + 1, '采药：rnd 0.5 不掉');
  // 秘境通关
  const D = ev(c, 'Dng'); if (D && D.exit) { D.run = { over: false, bossDone: true, floor: 3, maxFloor: 3 }; ev(c, 'Math.random = () => 0.01'); const z0 = G.inv.i40_dazuo || 0; try { D.exit(true); } catch (e) { } ok((G.inv.i40_dazuo || 0) === z0 + 1 && G.inv.i40_yaocao >= 1 && G.inv.i40_jianpei >= 1, '秘境通关：蒲团 10% / 灵芝 15% / 剑穗 15% 掉落'); } else ok(false, 'Dng.exit 不存在');
  ev(c, 'Math.random = Object.getPrototypeOf(Math).random');
  // 假秤砣举报 9 折
  const M25 = c.Market25; const bm0 = M25.buyMod(); G.i40.yr.scale = G.year; let inShop = null; const pr = ev(c, 'UI.shop'); const prev = Object.getPrototypeOf; // shop 在 vm 中依赖 DOM，只验证包装改 buyMod
  ok(typeof pr === 'function', '假秤砣：UI.shop 已包装');
  // ============ 送礼 ============
  c = box(false); G = newG(c); const Tg = () => ev(c, 'T'); const S = I => 0;
  const gift = async (id, g, pickIdx) => { Tg().says.length = 0; Tg().script.push(o => o.findIndex(x => x.startsWith(ev(c, 'ITEMS')[g].n + '（'))); await ev(c, `Talk.gift(${JSON.stringify(id)})`); return Tg().says[Tg().says.length - 1]; };
  ev(c, "Game.give('i40_laojiu',3);Game.give('i40_yuzan',3);Game.give('i40_huaduo',3);Game.give('i40_tiezhi',3);Game.give('i40_guihua',3);Game.give('fan',2)");
  G.aff.mentor = 10; let sy = await gift('mentor', 'i40_laojiu'); ok(G.aff.mentor === 32 && /最喜欢/.test(sy.x), '送礼：love +22（剑仙·老窖）');
  ok(G.i40.pref['mentor@i40_laojiu'] === 1, '送礼：命中爱记 pref=1（详情面板喜好）');
  sy = await gift('mentor', 'i40_yuzan'); ok(G.aff.mentor === 32 && /这个月已经收过/.test(sy.x) && G.inv.i40_yuzan === 3, '送礼：同一 NPC 同月第二次被拒，不扣礼物');
  G.month = 1; sy = await gift('mentor', 'i40_yuzan'); ok(G.aff.mentor === 20 && /债主/.test(sy.x) && G.i40.pref['mentor@i40_yuzan'] === -1, '送礼：hate −12 + 专属台词（剑仙·碧玉簪）');
  G.aff.sister = 5; ev(c, 'Life34.st().rel.sister = 0'); await gift('sister', 'i40_laojiu'); ok(G.aff.sister === 0, '送礼：hate 后好感不低于 0'); ok(ev(c, 'Life34.st().rel.sister') < 0, '送礼：hate 额外 rel −3（并经 life34 同步）');
  G.aff.cuihua = 10; ev(c, 'Life34.st().rel.cuihua = 0'); await gift('cuihua', 'i40_huaduo'); ok(G.aff.cuihua === 32 && ev(c, 'Life34.st().rel.cuihua') > 0, '送礼：love 也同步 life34 恩怨');
  G.aff.mom = 0; await gift('mom', 'i40_guihua'); ok(G.aff.mom === 22, '送礼：kin 标签（娘·桂花糕）+22');
  G.aff.ruyan = 61; await gift('ruyan', 'i40_tiezhi'); G.aff.ali = 10; await gift('ali', 'i40_tiezhi'); ok(G.aff.ruyan === 76 && G.aff.ali === 13, '送礼：请柬 aff≥60 +15，否则 +3');
  G.aff.aoxiao = 0; await gift('aoxiao', 'fan'); ok(G.aff.aoxiao >= 8 && G.aff.aoxiao <= 12, '送礼：普通 +8~12');
  G.aff.xiaoyi = 0; G.month = 5; await gift('xiaoyi', 'fan'); ok(G.aff.xiaoyi === 22, '送礼：旧 Talk.prefs 最爱仍 +22（萧逸·折扇）');
  ok(G.giftCount >= 8, '送礼：giftCount 照常累计');
  // 分页
  for (const g of I.GIFTS) ev(c, `Game.give('${g}',1)`); G.month = 9; Tg().says.length = 0; Tg().script.push(o => { Tg()._p1 = o; return o.indexOf('下一页'); }, o => { Tg()._p2 = o; return o.length - 1; }); await ev(c, "Talk.gift('cuihua')");
  ok(Tg()._p1 && Tg()._p1.length === 9 && Tg()._p1.includes('下一页') && Tg()._p2 && Tg()._p2.length >= 2, '送礼：超过 8 个礼物分页（每页 7 + 下一页 + 算了）');
  // 非伙伴 NPC 送礼入口
  const exOpts = id => ev(c, `Talk.extra(${JSON.stringify(id)}).map(x => x[0])`);
  ok(exOpts('danlao').includes('送礼') && !exOpts('cuihua').includes('送礼'), '送礼入口：非伙伴 NPC（丹老）出现，伙伴不重复');
  // ============ 战斗道具 ============
  c = box(false); G = newG(c); const Tb = () => ev(c, 'T');
  const Bx = ev(c, 'B'); const mkU = (o) => Object.assign({ alive: true, hp: 1000, mhp: 1000, mp: 100, mmp: 100, buf: {}, atk: 100, def: 10, spd: 10, crit: 0, skills: ['atk'] }, o);
  const P = mkU({ side: 0, isPlayer: true, hp: 100 }); const ghost = mkU({ side: 1, mon: 'ghost', tier: 2, hp: 500 }); const slime = mkU({ side: 1, mon: 'slime', tier: 2, hp: 300 });
  Bx.units = [P, ghost, slime]; Bx.opts = {}; Bx.i40 = {}; Bx.fled = false;
  ev(c, "Game.give('i40_huiyuan',2);Game.give('i40_poxie',2);Game.give('i40_dunfu',2);Game.give('i40_leifu',2)");
  // renderBB：伪 battlebar
  const bb = { innerHTML: '', querySelector(s) { return /back/.test(s) && bb.innerHTML.includes('data-a="back"') ? { insertAdjacentHTML: (p, h) => { bb.innerHTML = bb.innerHTML.replace('<button data-a="back">', h + '<button data-a="back">'); } } : null; } };
  c.document.querySelector = s => s === '#battlebar' ? bb : null; ev(c, "UI.renderBB('item')");
  ok(['hcd', 'hld', 'i40_huiyuan', 'i40_poxie', 'i40_dunfu', 'i40_leifu'].every(k => bb.innerHTML.includes(`data-i="${k}"`)) && bb.innerHTML.indexOf('i40_huiyuan') > bb.innerHTML.indexOf('hld'), '战斗道具栏：回春/回灵后追加四个 i40 战斗道具');
  ev(c, "Game.take('i40_dunfu',2)"); ev(c, "UI.renderBB('item')"); ok(!bb.innerHTML.includes('i40_dunfu'), '战斗道具栏：不持有不显示'); ev(c, "Game.give('i40_dunfu',2)");
  const act = async (item, t) => { c._a = { u: P, sk: 'item', item, t: t || [P] }; await ev(c, 'doAction(_a)'); };
  await act('i40_huiyuan'); ok(P.hp === 600 && G.inv.i40_huiyuan === 1, '回元散（战斗）：回复 50% 气血');
  ev(c, 'Math.random = () => 0.5'); const d1 = ev(c, 'calcDmg(B.units[0], B.units[1], SKILLS.atk)').dm; await act('i40_poxie'); const d2 = ev(c, 'calcDmg(B.units[0], B.units[1], SKILLS.atk)'); const d3 = ev(c, 'calcDmg(B.units[0], B.units[2], SKILLS.atk)').dm;
  ok(Math.abs(d2.dm / d1 - 1.2) < 0.02 && /破邪/.test(d2.tag) && G.inv.i40_poxie === 1, `破邪符：对鬼系伤害 ×1.2（${d1}→${d2.dm}）`);
  ok(Math.abs(d3 - ev(c, 'calcDmg(B.units[0], B.units[2], SKILLS.atk)').dm) <= 1 && d3 <= d1 * 1.01, '破邪符：对非魔鬼系无加成');
  await act('i40_poxie'); ok(G.inv.i40_poxie === 1, '破邪符：每场 1 张（第二张不消耗）');
  const ed = ev(c, 'calcDmg(B.units[1], B.units[0], SKILLS.atk)'); ok(!/破邪/.test(ed.tag || ''), '破邪符：敌方攻击不加成');
  Bx.opts = { boss: true }; await act('i40_dunfu'); ok(!Bx.fled && G.inv.i40_dunfu === 2, '土遁符：BOSS 战不消耗');
  Bx.opts = { noflee: true }; await act('i40_dunfu'); ok(!Bx.fled && G.inv.i40_dunfu === 2, '土遁符：禁逃战不消耗');
  Bx.opts = {}; await act('i40_dunfu'); ok(Bx.fled && G.inv.i40_dunfu === 1, '土遁符：普通战必定脱离');
  Bx.fled = false; const exp = Math.round(90 * Math.pow(1.75, 2) * 0.35); const h0 = slime.hp; await act('i40_leifu'); ok(slime.hp === h0 - exp && G.inv.i40_leifu === 1, `掌心雷：打血量最低的敌人 round(90×POW(tier)×0.35)=${exp}`);
  await act('i40_leifu'); ok(G.inv.i40_leifu === 1, '掌心雷：每场 1 张');
  ok(I.leiDmg({ tier: 2, boss: true }) === Math.round(exp / 2), '掌心雷：BOSS 伤害减半');
  slime.hp = 10; Bx.i40 = {}; await act('i40_leifu'); ok(!slime.alive, '掌心雷：打死目标走 kill()');
  ev(c, 'startBattle'); Bx.i40 = { poxie: 1, lei: 1 }; try { ev(c, 'startBattle([], {})'); } catch (e) { } ok(Bx.i40 && !Bx.i40.poxie && !Bx.i40.lei, 'startBattle：每场清空 B.i40');
  const aiSrc = ev(c, 'chooseAI.toString()'); ok(!/item/.test(aiSrc), '自动战斗 chooseAI 不使用道具');
  ev(c, 'Math.random = Object.getPrototypeOf(Math).random');
  // ============ 剧情道具 ============
  c = box(false); G = newG(c); const Ts = () => ev(c, 'T'); const ex = id => ev(c, `Talk.extra(${JSON.stringify(id)})`);
  const SAFE = ev(c, 'SAFE'); const run = async (id, label) => { const o = ex(id).find(x => x[0].startsWith(label)); if (!o) return false; await o[1](); return true; };
  ok(!ex('sanniang').some(x => /赎回/.test(x[0])), '无 flag：阴三娘不出赎尾巴选项');
  G.flags.pf_ali_tail = 1; G.stone = 6000; ok(await run('sanniang', '⚑ 赎回阿离的尾巴') && G.inv.i40_weibali === 1 && G.stone === 1000, '第九尾当票：flag pf_ali_tail → 阴三娘处付 5000 获得');
  ok(!ex('sanniang').some(x => /赎回/.test(x[0])), '第九尾当票：拿到后选项消失');
  G.aff.ali = 0; ok(await run('ali', '⚑ 把当票还给她') && G.aff.ali === 20 && !G.inv.i40_weibali && G.i40.done.i40_weibali, '第九尾当票：交给阿离 aff+20，记 done');
  G.flags.pf_mom_debt = 1; G.debt = 10000; ok(await run('mom', '⚑ 翻家里的旧箱子') && G.inv.i40_yuejie === 1, '旧借据：flag pf_mom_debt → 娘处获得');
  ok(ex('mom').some(x => x[0] === '⚑ 收好，不提了') && ex('suanpan').some(x => x[0] === '⚑ 拿去讨债司对质'), '旧借据：两个交付对象都出现');
  const k0 = G.karma; ok(await run('suanpan', '⚑ 拿去讨债司对质') && G.debt === 9000 && G.karma === k0 + 2 && G.i40.done.i40_yuejie.c === 1, '旧借据：对质 欠款 −10%、karma+2、二选一记录 c=1');
  ok(!ex('mom').some(x => x[0] === '⚑ 收好，不提了') && !ex('mom').some(x => /旧箱子/.test(x[0])), '旧借据：交付后两边选项都消失，不能再拿');
  G.flags.pf_qian_scale = 1; G.aff.merchant = 30; c.Math.random = () => 0.1; ok(await run('merchant', '⚑ 顺走他的秤砣') && G.inv.i40_jiacheng === 1 && G.aff.merchant === 20, '假秤砣：50% 被发现 aff−10，仍到手');
  delete c.Math.random; ok(await run('farmer', '⚑ 交给王大爷（举报）') && G.i40.yr.scale === G.year, '假秤砣：举报 → 当年钱多多 9 折标记');
  G.flags.pf_keeper_tablet = 1; await run('keeper', '⚑ 问那块灵牌'); const lb0 = G.lifeBonus; ok(await run('keeper', '⚑ 把灵牌供回去') && G.lifeBonus === lb0 + 3, '无名灵牌：守墓人处获得并供回 karma+3 life+3');
  G.flags.pf_elder_mortgage = 1; G.sect = null; ok(!ex('elder').some(x => /旧档/.test(x[0])), '灵脉抵押书：未入青云宗不出现'); G.sect = 'qingyun'; G.contrib = 100; G.aff.elder = 50; ev(c, 'Life34.st().rel.elder = 0');
  ok(await run('elder', '⚑ 翻一翻旧档') && G.inv.i40_diya === 1, '灵脉抵押书：青云宗 + flag → 藏经阁获得');
  G.debt = 10000; ok(await run('xianguan', '⚑ 递给讨债司') && G.debt === 9000 && G.aff.elder === 0 && G.contrib === 0 && ev(c, 'Life34.st().rel.elder') <= -50, '灵脉抵押书：递给讨债司 欠款−10%、掌门反目、贡献清零');
  G.flags.pf_ruyan_oath = 1; await run('ruyan', '⚑ 问剑冢之约'); ok(G.inv.i40_jianzhong === 1, '剑冢誓书：柳如烟处获得');
  ev(c, "T.fightRes = 'lose'"); G.aff.ruyan = 0; await run('ruyan', '⚑ 接她三剑'); ok(G.inv.i40_jianzhong === 1 && Ts().fights.length === 1 && !G.flags.ruyan_duel, '剑冢誓书：败一场即止，道具不消耗');
  ev(c, "T.fightRes = 'win'; T.fights.length = 0"); await run('ruyan', '⚑ 接她三剑'); ok(Ts().fights.length === 3 && Ts().fights.every(f => f[0] === 'ruyan' && f[1].noflee && f[1].elite && f[1].solo) && G.flags.ruyan_duel && G.aff.ruyan === 30 && !G.inv.i40_jianzhong, '剑冢誓书：连胜 3 场 aff+30、flag ruyan_duel');
  G.main = ev(c, "MI('done')"); ok(ev(c, "MI('done')") >= 0 && await run('zhuiming', '⚑ 调阅原始契约') && G.inv.i40_jiezhai_qi === 1, '天道借债契：主线完结后催债司 NPC 处获得');
  ok(!ex('mom').some(x => /契约/.test(x[0])), '天道借债契：非催债司 NPC 不出现');
  const allX = I.STORY.flatMap(s => (s.get ? [s.get.x] : []).concat(s.give.map(g => g.x)));
  ok(allX.length >= 20 && allX.every(x => x.startsWith('⚑') && !SAFE.test(x)), `剧情道具：${allX.length} 个获得/交付选项全以「⚑」开头且不在 SAFE 白名单`);
  ok(I.STORY.length === 11 && I.STORY.every(s => !!I40[s.k]), '剧情道具：交付表 11 项（+七个荷包 自动给）');
  // 无 PF38：秘密类剧情道具不出现
  ok(!ex('xianguan').some(x => /断剑|册子/.test(x[0])) && !ex('lengyue').some(x => /冰封/.test(x[0])), '无 PF38：断剑/坏账名单/冰心玉入口不出现');
  // 密信无 PF38 不掉落
  const N37 = ev(c, 'NPC37'); if (N37 && N37.resolve) { c.Math.random = () => 0; const sc = { id: 'mentor', map: 'village', ch: [{ x: 'a', fx: {} }] }; N37.st().q.push(sc); await N37.resolve(sc, 0); ok(!G.inv.i40_mixin, '无 PF38：路遇不掉密信'); delete c.Math.random; }
  // ============ PF38（3.8.0）联动 ============
  if (!PF_SRC) { console.log('SKIP PF38 联动：找不到 profile38.js（origin/prof38 不可用）'); skip++; }
  else {
    c = box(true); G = newG(c); const Tp = () => ev(c, 'T'); const PF = ev(c, 'PF38'); const SHp = ev(c, 'SHOPS'); const usep = async k => { const n0 = G.inv[k] || 0; await ev(c, `UI.useItem(${JSON.stringify(k)})`); return n0 - (G.inv[k] || 0); };
    ok(!!PF && ev(c, 'Items40.pf()') === PF, 'PF38 已加载');
    ok(SHp.sanniang.items.includes('i40_kuixin_jing') && SHp.shuoshu.items.includes('i40_mingpan') && SHp.guanghan.items.includes('i40_tongxin'), 'PF38：窥灵镜/命盘/同心香进商店');
    G.aff.danlao = 79; ok(!SHp.danlao.items.includes('i40_shenshi'), '养神丹：丹老 aff<80 不卖'); G.aff.danlao = 80; ok(SHp.danlao.items.includes('i40_shenshi'), '养神丹：丹老 aff≥80 出售');
    ev(c, "Game.give('i40_kuixin_jing',2)"); Tp().script.push(o => o.findIndex(x => x.startsWith(ev(c, 'NPCS').mentor.n))); ok(await usep('i40_kuixin_jing') === 1 && PF.has('mentor', 'lg') && Tp().panels.some(p => p[0] === 'pf38' && p[1] === 'mentor'), '窥灵镜：揭示隐藏灵根并打开详情');
    Tp().script.push(o => { Tp()._pk = o; return o.length - 1; }); await usep('i40_kuixin_jing'); ok(!Tp()._pk.some(x => x.startsWith(ev(c, 'NPCS').mentor.n)), '窥灵镜：已知晓的不进名单');
    ev(c, "Game.give('i40_tongxin',1)"); Tp().script.push(o => o.findIndex(x => x.startsWith(ev(c, 'NPCS').mom.n))); await usep('i40_tongxin'); ok(PF.has('mom', 'taff'), '同心香：当年可见真实好感'); G.year++; ok(!PF.has('mom', 'taff'), '同心香：次年失效');
    const ss0 = PF.ss(G); ev(c, "Game.give('i40_shenshi',2)"); await usep('i40_shenshi'); ok(PF.ss(G) === ss0 + 3, '养神丹：当年神识 +3'); ok(await usep('i40_shenshi') === 0, '养神丹：每年 1 颗'); G.year++; ok(PF.ss(G) === ss0, '养神丹：次年恢复');
    // 密信：路遇掉落（绑定 NPC）→ 使用揭示该 NPC 秘密①
    const N37p = ev(c, 'NPC37'); c.Math.random = () => 0; const sc = { id: 'merchant', map: 'market', ch: [{ x: 'a', fx: {} }] }; N37p.st().q.push(sc); await N37p.resolve(sc, 0); delete c.Math.random;
    ok(G.inv.i40_mixin === 1 && G.i40.mixin[0] === 'merchant', '密信：路遇 5% 掉落，绑定当时 NPC');
    ok(await usep('i40_mixin') === 1 && PF.has('merchant', 'sec0') && !PF.has('merchant', 'sec1') && G.flags.pf_qian_scale, '密信：揭示的是秘密①（sec0，I7）');
    ev(c, "Game.give('i40_mixin',1)"); G.i40.mixin.push('merchant');
    // 固定随机：不要抽到 mentor（否则会提前揭示秘密①，干扰下一段断剑入口）
    c.Math.random = () => 0.99; await usep('i40_mixin'); delete c.Math.random;
    ok(G.i40.mixin.length === 0 && !PF.has('mentor', 'sec0'), '密信：绑定 NPC 已知晓 → 换一个随机有秘密①的 NPC（避开剑仙）');
    // 剧情：断剑 / 逆鳞 / 坏账 / 冰心 / 荷包
    ok(!ev(c, "Talk.extra('xianguan').some(x => /断剑/.test(x[0]))"), '断剑残片：未知剑仙秘密①不出现');
    PF.reveal('mentor', 'sec0'); G.stone = 100000; const opt = ev(c, "Talk.extra('xianguan').find(x => x[0].startsWith('⚑ 打听断剑下落'))"); ok(!!opt && /900灵石/.test(opt[0]), '断剑残片：秘密①后记账童子处出现（300×(1+境界)）');
    await opt[1](); const atk0 = G.atkBonus; G.aff.mentor = 0; await ev(c, "Talk.extra('mentor').find(x => x[0] === '⚑ 把断剑交给他')[1]()"); ok(PF.has('mentor', 'sec1') && G.aff.mentor === 15 && Math.abs(G.atkBonus - atk0 - 0.02) < 1e-9, '断剑残片：交给剑仙 → 秘密② + aff15 + 攻击+2%');
    PF.reveal('aoxiao', 'sec1'); ok(G.inv.i40_nilin === 1, '逆鳞：揭示敖小乐秘密② 时自动获得');
    G.aff.aoxiao = 50; G.karma = 50; const st0 = G.stone; Tp().cards.length = 0; await ev(c, "Talk.extra('taizi').find(x => x[0] === '⚑ 交给龙宫')[1]()"); ok(G.stone === st0 + 30000 && G.karma === 40 && G.aff.aoxiao === 0 && !G.inv.i40_nilin, '逆鳞：交给龙宫 灵石+10000×(1+境界)、karma−10、敖小乐好感清零');
    ok(Tp().cards.some(x => /业力−10/.test(x.x)), '逆鳞：交龙宫卡文案「业力−10」与 karma-=10 / §13.6 一致');
    PF.reveal('xianguan', 'sec0'); await ev(c, "Talk.extra('xianguan').find(x => x[0] === '⚑ 他抽屉里的册子')[1]()"); G.debt = 10000; G.aff.xianguan = 0; await ev(c, "Talk.extra('xianguan').find(x => x[0] === '⚑ 还给他')[1]()"); ok(G.aff.xianguan === 25 && G.debt === 9500, '坏账名单：还给记账童子 aff+25、欠款−5%');
    PF.reveal('lengyue', 'sec0'); await ev(c, "Talk.extra('lengyue').find(x => x[0] === '⚑ 问冰封之人')[1]()"); G.aff.lengyue = 0; await ev(c, "Talk.extra('lengyue').find(x => x[0] === '⚑ 把玉放回冰棺')[1]()"); ok(G.aff.lengyue === 20 && G.flags.i40_ly_jade, '冰心玉：放回冰棺 aff+20、flag');
    G.aff.cuihua = 130; PF.reveal('cuihua', 'sec0'); G.aff.cuihua = 130; Tp().script.push(o => o.length - 1); await ev(c, "Talk.npc('cuihua')"); ok(G.inv.i40_cuihuabao === 1, '七个荷包：aff≥120 且知晓秘密① → 对话时自动给');
    Tp().script.push(o => o.length - 1); await ev(c, "Talk.npc('cuihua')"); ok(G.inv.i40_cuihuabao === 1, '七个荷包：只给一次');
    // 送礼命格
    const hid = PF.hid('cuihua', G); ok(hid.mg === 'n_tianxi', '翠花命格 = 红鸾天喜（PF38 固定）'); ev(c, "Game.give('i40_huaduo',1)"); G.aff.cuihua = 0; G.month = 3; Tp().script.push(o => o.findIndex(x => x.startsWith('野花一束'))); await ev(c, "Talk.gift('cuihua')"); ok(G.aff.cuihua === Math.round(22 * 1.25), '送礼：n_tianxi 好感 ×1.25（22→28）');
    const fhid = PF.hid('farmer', G); ev(c, "Game.give('fan',1)"); G.aff.farmer = 0; c.Math.random = () => 0; Tp().script.push(o => o.findIndex(x => x.startsWith('题字折扇'))); await ev(c, "Talk.gift('farmer')"); delete c.Math.random; ok(fhid.mg === 'n_qiongxiang' && G.aff.farmer === 13, '送礼：n_qiongxiang +5（8→13）');
  }
  console.log(`\nitems40_unit: ${n - fails}/${n} PASS, ${fails} FAIL${skip ? `, ${skip} SKIP` : ''}`);
  process.exit(fails);
})().catch(e => { console.log('FAIL 异常', e && e.stack); process.exit(fails + 1); });

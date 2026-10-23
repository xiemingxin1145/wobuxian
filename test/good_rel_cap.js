// GOOD_REL 封顶 / _inApply 不重复计：node test/good_rel_cap.js（退出码 = 失败数）
// 用真实 life34.js（main 工作区版本 + origin/dev341 版本，后者有 Life34._inApply）+ 真实 stage3_encounter_draft.js，vm 最小桩。
// 每个用例记录 L.rel 的「总」变化（含 life34 的好感同步那份 + Stage3 补的差额 + 外层 Game.apply 包装的同步）：
//   正向：扛税（钱多多 cover）/ 对账（记账童子 help），好感 +60。好感从 0 → 总 +20；从 120（钳到 150，同步 +15）→ 总 +15。绝不超过。
//   负向：举报 / 告发（-20）：好感从 0 或 120 → 总 -20；贿赂露馅（-15）→ 总 -15。绝不更负。
//   路径：直接调用；以及在 Game.apply 包装内调用（dev341：包装期间 Life34._inApply=true，Stage3 不自己同步，交给外层）。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const JS = path.join(__dirname, '..', 'www', 'js');
const STAGE3 = fs.readFileSync(path.join(JS, 'stage3_encounter_draft.js'), 'utf8');
const MAIN = fs.readFileSync(path.join(JS, 'life34.js'), 'utf8');
let DEV341 = null; try { DEV341 = cp.execSync('git show origin/dev341:www/js/life34.js', { cwd: path.join(__dirname, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { DEV341 = null; }

function sandbox(life) {
  const c = { console: { log() {}, error() {} } }; c.window = c; vm.createContext(c);
  vm.runInContext(`
    var REALMS = [{ n: '凡人', need: 80 }, { n: '练气', need: 200 }];
    var NPCS = { merchant: { n: '奸商·钱多多', map: 'market', at: [9, 9] }, xianguan: { n: '仙官·记账童子', map: 'heaven', at: [10, 10] } };
    var QUESTS = {}, SECTS = {}, ITEMS = {}, MAPINFO = { market: { n: '云来坊市', mons: ['slime'], tier: 1 } }, ASSETS = { maps: {} };
    var R = { ents: [], mapId: 'market', mode: 'map', player: null };
    function t2p(i, j) { return [i, j]; } function s2w(x, y) { return [x, y]; } var pickAt = function () { return null; }; function walkable() { return true; } function addEnt() {} function removeEnt() {} function loadSprite() {}
    var npcAI = function () {};
    var UI = { card: async () => 0, say: async () => 0, hud() {}, toast() {}, modal: null };
    var Game = { G: null, save() {}, async yearEnd() {}, interactEnt() {}, refreshNpcs() {}, async enterMap() {}, acceptQuest() {}, async fight() { return { res: 'win' }; }, canEnter() { return true }, give() {},
      async apply(eff) { if (typeof eff === 'function') { this._last = eff(); return []; } return []; } };
  `, c);
  vm.runInContext(life, c); vm.runInContext(STAGE3, c);
  return c;
}
const CASES = [
  // [名称, NPC, 起始好感, 期望总变化, (S,G)=>结果]
  ['扛税@0', 'merchant', 0, 20, (S, G) => S.applyMerchant1(G, S.merchantChoices().find(c => c.key === 'cover'))],
  ['扛税@120', 'merchant', 120, 15, (S, G) => S.applyMerchant1(G, S.merchantChoices().find(c => c.key === 'cover'))],
  ['对账@0', 'xianguan', 0, 20, (S, G) => S.applyLedger1(G, S.ledgerChoices(G).find(c => c.key === 'help'))],
  ['对账@120', 'xianguan', 120, 15, (S, G) => S.applyLedger1(G, S.ledgerChoices(G).find(c => c.key === 'help'))],
  ['举报@0', 'merchant', 0, -20, (S, G) => S.applyMerchant1(G, S.merchantChoices().find(c => c.key === 'report'))],
  ['举报@120', 'merchant', 120, -20, (S, G) => S.applyMerchant1(G, S.merchantChoices().find(c => c.key === 'report'))],
  ['告发@0', 'xianguan', 0, -20, (S, G) => S.applyLedger1(G, S.ledgerChoices(G).find(c => c.key === 'report'))],
  ['告发@120', 'xianguan', 120, -20, (S, G) => S.applyLedger1(G, S.ledgerChoices(G).find(c => c.key === 'report'))],
  ['贿赂露馅@0', 'xianguan', 0, -15, (S, G) => { G.flags.s3x_step = 1; G.flags.s3x_bribe = 1500; return S.applyLedger2(G); }],
  ['贿赂露馅@30', 'xianguan', 30, -15, (S, G) => { G.flags.s3x_step = 1; G.flags.s3x_bribe = 1500; return S.applyLedger2(G); }],
];
async function runAll(c, wrapped) {
  const S = vm.runInContext('Stage3', c), GM = vm.runInContext('Game', c), out = {};
  for (const [k, id, a0, , fn] of CASES) {
    const G = { year: 4, age: 14, realm: 1, debt: 5000, stone: 1000, aff: { [id]: a0 }, flags: {}, life34: { v: 1, fav: 1, rel: {}, seen: {}, log: [], pending: null } };
    GM.G = G; let flagIn = null, r;
    if (wrapped) { await GM.apply(() => { flagIn = vm.runInContext('typeof Life34._inApply === "undefined" ? "none" : Life34._inApply', c); return fn(S, G); }); r = GM._last; }
    else r = fn(S, G);
    out[k] = { d: G.life34.rel[id] || 0, aff: G.aff[id], flagIn, flagAfter: vm.runInContext('typeof Life34._inApply === "undefined" ? "none" : Life34._inApply', c), deferred: !!(r && r.rel && r.rel.deferred) };
  }
  return out;
}
(async () => {
  const S = vm.runInContext('Stage3', sandbox(MAIN));
  ok(Object.isFrozen(S.GOOD_REL) && S.GOOD_REL.cover === 20 && S.GOOD_REL.help === 20 && S.GRUDGE_REL.report === -20 && S.GRUDGE_REL.bribeExposed === -15, 'GOOD_REL = {cover:20, help:20}（冻结），GRUDGE_REL.report=-20 / bribeExposed=-15');
  const check = (tag, out, extra) => {
    for (const [k, , , exp] of CASES) {
      const o = out[k]; const bound = exp > 0 ? o.d <= 20 : o.d >= -20;
      ok(o.d === exp && bound && (!extra || extra(o)), `${tag} ${k}：L.rel 总变化 ${o.d}（期望 ${exp}，${exp > 0 ? '≤ +20' : '≥ -20'}）好感→${o.aff}${o.flagIn !== null ? `，包装内 _inApply=${o.flagIn}、之后=${o.flagAfter}、deferred=${o.deferred}` : ''}`);
    }
  };
  check('main 直接调用', await runAll(sandbox(MAIN), false));
  // 对照：main 没有 _inApply，Stage3 若在 Game.apply 包装内跑会被外层再同步一次（只做记录，不算失败：当前 main 上 Stage3 只由开发者按钮直接调用，不经 Game.apply）
  const mw = await runAll(sandbox(MAIN), true);
  console.log('INFO main（无 _inApply）包装内对照：' + CASES.map(([k]) => `${k}=${mw[k].d}`).join(' '));
  if (!DEV341 || !/_inApply/.test(DEV341)) ok(false, '读不到 origin/dev341 的 life34.js 或其中没有 _inApply（先 git fetch）');
  else {
    check('dev341 直接调用', await runAll(sandbox(DEV341), false), o => o.flagAfter === false && !o.deferred);
    check('dev341 Game.apply 包装内', await runAll(sandbox(DEV341), true), o => o.flagIn === true && o.flagAfter === false && o.deferred);
  }
  console.log(`${n - fails}/${n} PASS`);
  process.exit(fails);
})();

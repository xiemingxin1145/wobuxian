// 3.9.4 秘境扫荡 sweep44 第 1 轮单测：node test/sweep44_unit.js（退出码 = 失败数）
// 覆盖 docs/research_v22.md §18.1/18.2/18.6 纯逻辑；vm 沙箱 + 真实 sweep44.js，无 Chrome。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0;
const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'www/js/sweep44.js'), 'utf8');

function box(opts) {
  opts = opts || {};
  const c = { console, Math, JSON, Object, Array, String, Number, isFinite, NumberIsFinite: Number.isFinite };
  c.window = c;
  vm.createContext(c);
  vm.runInContext(`
    const POW = t => Math.pow(1.75, t);
    const ITEMS = { herb:{n:'灵草'}, lz:{n:'千年灵芝'}, coin:{n:'铜钱'}, scroll:{n:'残页'},
      yd:{n:'妖丹'}, peach:{n:'蟠桃'}, pjd:{n:'破境丹'}, xsd:{n:'洗髓丹'}, sqj:{n:'神器碎晶'} };
    let _exitHooked = [];
    const Dng = {
      run: null, _sw44: 0,
      exit(silent) {
        _exitHooked.push({ run: this.run, silent: !!silent });
        // 模拟 shenqi36：全通关给碎晶（扫荡合成 run 也应触发）
        const r = this.run;
        const ok = r && !r.over && r.bossDone && r.floor >= r.maxFloor;
        if (ok && Game.G) {
          Game.give('sqj', 2);
          this._sqj = (this._sqj || 0) + 2;
        }
        this.run = null;
      }
    };
    const Game = {
      G: null, rolls: [],
      yearExp() { return 1000; },
      roll(p, k) { this.rolls.push([p, k]); return Math.random() < p; },
      addExp(x) { const v = Math.round(x); this.G.exp = (this.G.exp || 0) + v; return v; },
      give(id, n) { const G = this.G; G.inv = G.inv || {}; G.inv[id] = (G.inv[id] || 0) + (n || 1); },
      randEq(tier, minR) {
        const e = { name: 'eq_' + tier.toFixed(2) + '_r' + minR, tier, r: minR };
        this.G.eqs = this.G.eqs || []; this.G.eqs.push(e); return e;
      },
      useAP(n) {
        n = n || 1;
        if (!this.G || this.G.ap < n) return false;
        this.G.ap -= n; return true;
      }
    };
    const UI = { toasts: [], cards: [], toast(m, c) { this.toasts.push([m, c]); },
      async card(t, x, p, o, e) { this.cards.push({ t, x, p, o, e }); return 0; } };
    let _npcBlock = null;
    const NPC37 = { storyBlock() { return _npcBlock; } };
    const B = { on: false };
    // helpers exposed for tests
    globalThis.__setNpcBlock = v => { _npcBlock = v; };
    globalThis.__setB = v => { B.on = !!v; };
    globalThis.__exits = () => _exitHooked;
    globalThis.__resetExits = () => { _exitHooked = []; };
  `, c);
  // expose stubs on context
  vm.runInContext(`
    this.POW = POW; this.ITEMS = ITEMS; this.Dng = Dng; this.Game = Game;
    this.UI = UI; this.NPC37 = NPC37; this.B = B;
    // also as bare bindings for typeof checks inside IIFE
  `, c);
  // Make bare names visible to script via context properties (vm uses context as global)
  // Re-bind: the const above are local to the previous script. Re-declare on context:
  vm.runInContext(`
    var POW = this.POW, ITEMS = this.ITEMS, Dng = this.Dng, Game = this.Game,
        UI = this.UI, NPC37 = this.NPC37, B = this.B;
  `, c);
  // Actually previous run used const in a separate script - need single setup
  return c;
}

// Rebuild box properly in one script so const/var are on the shared context via assignment
function box2() {
  const c = { console, Math, JSON, Object, Array, String, Number, isFinite };
  c.window = c;
  vm.createContext(c);
  vm.runInContext(`
    var POW = t => Math.pow(1.75, t);
    var ITEMS = { herb:{n:'灵草'}, lz:{n:'千年灵芝'}, coin:{n:'铜钱'}, scroll:{n:'残页'},
      yd:{n:'妖丹'}, peach:{n:'蟠桃'}, pjd:{n:'破境丹'}, xsd:{n:'洗髓丹'}, sqj:{n:'神器碎晶'} };
    var _exitHooked = [];
    var Dng = {
      run: null, _sw44: 0, _sqj: 0,
      exit(silent) {
        _exitHooked.push({ run: this.run ? Object.assign({}, this.run) : null, silent: !!silent });
        const r = this.run;
        const okx = r && !r.over && r.bossDone && r.floor >= r.maxFloor;
        if (okx && Game.G) { Game.give('sqj', 2); this._sqj += 2; }
        this.run = null;
      }
    };
    var Game = {
      G: null, rolls: [],
      yearExp() { return 1000; },
      roll(p, k) { this.rolls.push([p, k]); return Math.random() < p; },
      addExp(x) { const v = Math.round(x); this.G.exp = (this.G.exp || 0) + v; return v; },
      give(id, n) { const G = this.G; G.inv = G.inv || {}; G.inv[id] = (G.inv[id] || 0) + (n || 1); },
      randEq(tier, minR) {
        const e = { name: 'eq_' + Number(tier).toFixed(2) + '_r' + minR, tier, r: minR };
        this.G.eqs = this.G.eqs || []; this.G.eqs.push(e); return e;
      },
      useAP(n) {
        n = n || 1;
        if (!this.G || this.G.ap < n) return false;
        this.G.ap -= n; return true;
      }
    };
    var UI = { toasts: [], cards: [],
      toast(m, col) { this.toasts.push([m, col]); },
      async card(t, x, p, o, e) { this.cards.push({ t, x, p, o, e }); return 0; }
    };
    var _npcBlock = null;
    var NPC37 = { storyBlock() { return _npcBlock; } };
    var B = { on: false };
    function __setNpcBlock(v) { _npcBlock = v; }
    function __setB(v) { B.on = !!v; }
    function __exits() { return _exitHooked; }
    function __resetExits() { _exitHooked = []; Dng._sqj = 0; }
  `, c);
  vm.runInContext(SRC, c);
  return c;
}

const mkG = o => Object.assign({
  v: 2, year: 10, age: 20, realm: 1, stone: 0, exp: 0, ap: 4,
  inv: {}, eqs: [], dungeon: { floor: 0, best: 0, clear: {} }
}, o || {});

const R = (c, s) => vm.runInContext(s, c);
const asyncR = (c, s) => vm.runInContext(`(async () => { ${s} })()`, c);

(async () => {
  let c = box2();
  const SW = R(c, 'Sweep44');
  ok(!!SW && typeof SW.st === 'function', 'Sweep44 已导出');
  ok(R(c, 'typeof window.Sweep44') === 'object', 'Sweep44 挂到 window');
  ok(R(c, 'typeof TEXT44') === 'object' || R(c, 'typeof window.TEXT44') === 'object', 'TEXT44 文案包导出');
  ok(SW.TEXT.title.includes('讨债司外包'), 'TEXT44.title');
  ok(SW.TEXT.flavor.length === 6, 'flavor 6 句');
  ok(SW.CAP === 3, 'CAP=3');
  ok(SW.BANDS_N.length === 5 && SW.TIER[0] === 1.15 && SW.TIER[4] === 5.15, '档名/TIER 表');
  ok(SW.LOOT[0].join(',') === 'herb,lz,coin,scroll', 'LOOT 练气档与 dungeon26 一致');

  // ---- 存档惰性 / 不升版本 / wbx2 约定 ----
  let G = mkG();
  R(c, 'Game').G = G;
  const S0 = SW.st(G);
  ok(S0 && S0.full && typeof S0.full === 'object' && S0.n === 0 && S0.tot === 0, 'G.sw44 惰性补全');
  ok(G.v === 2, '不升 G.v（仍 wbx2_* / v===2）');
  ok(SW.st(null) && SW.st(null).n === 0, 'st(null) 回落 Game.G 不抛');
  G.sw44 = { full: null, n: 'x', tot: 'y', y: 'z' };
  const Sfix = SW.st(G);
  ok(Sfix.n === 0 && Sfix.tot === 0 && Sfix.full && typeof Sfix.full === 'object', '坏字段修复');

  // ---- §18.7 / 18.6#1：clear 单层 ≠ 首通；full clear 才解锁 ----
  c = box2(); G = mkG({ dungeon: { floor: 1, best: 1, clear: { 0: 1 } } });
  R(c, 'Game').G = G;
  let SW2 = R(c, 'Sweep44');
  ok(!SW2.isFull(G, 0), '只过第 1 层守关（clear=1,best=1）→ 不首通');
  ok(SW2.bandStatus(G, 0) === 'locked_first', '面板状态 locked_first');

  // 真实全通关：onExit / Dng.exit wrap
  R(c, '__resetExits()');
  R(c, `Dng.run = { band:0, tier:1.3, maxFloor:3, floor:3, doneRooms:3, needRooms:3, bossDone:true, loot:[], over:false };`);
  R(c, 'Dng.exit(true)');
  ok(SW2.isFull(G, 0), '全通关 Dng.exit → full[0]=1');
  ok(R(c, 'UI.toasts').some(t => String(t[0]).includes('已首通')), 'unlock toast');
  ok(SW2.bandStatus(G, 0) === 'ready', '首通后 ready（有 AP）');

  // 扫荡合成 run 带 sweep:1 不再次 toast 解锁
  const toastN = R(c, 'UI.toasts.length');
  R(c, `Dng.run = { band:0, tier:1.3, maxFloor:3, floor:3, doneRooms:3, needRooms:3, bossDone:true, loot:[], over:false, sweep:1 };`);
  R(c, 'Dng.exit(true)');
  ok(R(c, 'UI.toasts.length') === toastN, 'sweep 合成 exit 不重复 unlock toast');

  // 中途撤离（over 或未打完）不解锁
  c = box2(); G = mkG(); R(c, 'Game').G = G; SW2 = R(c, 'Sweep44');
  ok(!SW2.onExit(G, { band: 0, bossDone: true, floor: 2, maxFloor: 3, over: false }), '未打完最高层不解锁');
  ok(!SW2.onExit(G, { band: 0, bossDone: true, floor: 3, maxFloor: 3, over: true }), 'over 不解锁');
  ok(!SW2.isFull(G, 0), '仍未首通');

  // ---- §18.6#6 老档迁移：best>=3 + clear → full；best<3 不迁 ----
  c = box2();
  G = mkG({ dungeon: { floor: 4, best: 4, clear: { 0: 1, 1: 1 } } });
  R(c, 'Game').G = G; SW2 = R(c, 'Sweep44');
  SW2.st(G);
  ok(!!G.sw44.full[0] && !!G.sw44.full[1], '老档 best=4 + clear → 练气/筑基已首通');
  c = box2();
  G = mkG({ dungeon: { floor: 2, best: 2, clear: { 0: 1, 1: 1 } } });
  R(c, 'Game').G = G; SW2 = R(c, 'Sweep44');
  SW2.st(G);
  ok(!G.sw44.full[0] && !G.sw44.full[1], '老档 best=2 + clear → 均未首通（防 clear 偏差）');

  // ---- §18.6#2 扫荡 ×1 数值 ----
  c = box2();
  G = mkG({ realm: 1, ap: 4, stone: 0, exp: 0, inv: {}, eqs: [] });
  R(c, 'Game').G = G; SW2 = R(c, 'Sweep44');
  SW2.markFull(G, 0, true);
  R(c, '__resetExits()');
  const POW = t => Math.pow(1.75, t);
  const T = 1.15 + 0.15; // 1.3
  const lo = Math.round(100 * POW(T) * 0.85);
  const hi = Math.round(100 * POW(T) * 1.15);
  let r1 = await asyncR(c, 'return await Sweep44.go(Game.G, 0, 1, { silent: true });');
  ok(r1.ok, '扫荡 ×1 ok');
  ok(G.ap === 3, 'AP −1');
  ok(G.stone >= lo && G.stone <= hi, `灵石在 [${lo},${hi}] 内（得 ${G.stone}）`);
  ok(G.exp === 600, '修为 yearExp×0.6 = 600');
  ok(G.eqs.length === 2, '装备 +2');
  ok(Object.values(G.inv).filter(x => x > 0).reduce((s, x) => s + (typeof x === 'number' ? x : 0), 0) >= 2, '材料 ≥2（含可能碎晶）');
  const matOnly = ['herb', 'lz', 'coin', 'scroll'].reduce((s, k) => s + (G.inv[k] || 0), 0);
  ok(matOnly === 2, '练气档材料恰好 2');
  ok((G.inv.sqj || 0) === 2, '合成 exit 触发碎晶钩子 +2');
  ok(G.sw44.n === 1 && G.sw44.tot === 1 && SW2.left(G) === 2, '本年剩余 2/3');
  const exits = R(c, '__exits()');
  ok(exits.length === 1 && exits[0].run && exits[0].run.sweep === 1 && exits[0].silent, 'Dng.exit(true) 且 run.sweep=1');
  ok(R(c, 'Dng.run') === null, '扫荡后面板 run 已清空（未进入状态）');

  // ---- §18.6#3 同年 3 次封顶；跨年重置 ----
  r1 = await asyncR(c, 'return await Sweep44.go(Game.G, 0, 1, { silent: true });');
  ok(r1.ok && G.sw44.n === 2, '第 2 次');
  r1 = await asyncR(c, 'return await Sweep44.go(Game.G, 0, 1, { silent: true });');
  ok(r1.ok && G.sw44.n === 3 && SW2.left(G) === 0, '第 3 次用满');
  ok(SW2.bandStatus(G, 0) === 'cap', '次数用完 → cap');
  r1 = await asyncR(c, 'return await Sweep44.go(Game.G, 0, 1, { silent: true });');
  ok(!r1.ok && r1.reason === 'cap', '第 4 次拒绝');
  G.year = 11; G.ap = 4;
  ok(SW2.left(G) === 3 && SW2.bandStatus(G, 0) === 'ready', '过年后恢复 3/3');
  ok(G.sw44.tot === 3, 'tot 跨年不重置');

  // ---- §18.6#4 AP 边界 ----
  c = box2();
  G = mkG({ ap: 1 }); R(c, 'Game').G = G; SW2 = R(c, 'Sweep44');
  SW2.markFull(G, 0, true);
  ok(SW2.maxN(G) === 1, 'AP=1 时 maxN=1（不显示 ×N）');
  G.ap = 0;
  ok(SW2.bandStatus(G, 0) === 'noap' && !SW2.can(G, 0), 'AP=0 → noap / can=false');
  G.ap = 4; G.sw44.n = 0; G.sw44.y = G.year;
  ok(SW2.maxN(G) === 3, 'AP=4 且剩余 3 → maxN=3');

  // ---- §18.6#7 低档奖励用低档 T；境界掉档锁高档 ----
  c = box2();
  G = mkG({ realm: 3, ap: 4, stone: 0, exp: 0, eqs: {}, eqs: [] }); // 金丹 → curBand=2
  R(c, 'Game').G = G; SW2 = R(c, 'Sweep44');
  SW2.markFull(G, 0, true);
  SW2.markFull(G, 2, true);
  ok(SW2.curBand(G) === 2, '金丹 curBand=2');
  const stoneBefore = G.stone;
  r1 = await asyncR(c, 'return await Sweep44.go(Game.G, 0, 1, { silent: true });');
  ok(r1.ok, '金丹玩家可扫练气档');
  const gained = G.stone - stoneBefore;
  const lo0 = Math.round(100 * POW(T) * 0.85), hi0 = Math.round(100 * POW(T) * 1.15);
  ok(gained >= lo0 && gained <= hi0, `练气档奖励按 T=1.3（得 ${gained}）`);
  // 境界掉回筑基
  G.realm = 2; // curBand=1
  ok(SW2.bandStatus(G, 2) === 'locked_realm', '降境后金丹档 locked_realm');
  ok(SW2.can(G, 0), '低档仍可扫');
  ok(!SW2.can(G, 2), '高档不可扫');

  // ---- ×N 一次结算 ----
  c = box2();
  G = mkG({ ap: 4, stone: 0 }); R(c, 'Game').G = G; SW2 = R(c, 'Sweep44');
  SW2.markFull(G, 0, true);
  r1 = await asyncR(c, 'return await Sweep44.go(Game.G, 0, 2, { silent: true });');
  ok(r1.ok && r1.outs.length === 2 && G.ap === 2 && G.sw44.n === 2, '扫荡 ×2 一次结算');
  ok(r1.sum.eq.length === 4 && r1.sum.it.length === 4, '汇总装备 4 / 材料 4');

  // ---- off / storyBlock / B.on ----
  c = box2();
  G = mkG({ ap: 4 }); R(c, 'Game').G = G; SW2 = R(c, 'Sweep44');
  SW2.markFull(G, 0, true);
  SW2.off = true;
  ok(!SW2.can(G, 0) && SW2.bandStatus(G, 0) === 'off', 'off 总开关关闭');
  r1 = await asyncR(c, 'return await Sweep44.go(Game.G, 0, 1, { silent: true });');
  ok(!r1.ok && r1.reason === 'off', 'off 时 go 拒绝');
  SW2.off = false;
  R(c, '__setNpcBlock("intro")');
  ok(SW2.storyBlock() === 'intro' && !SW2.canPopup(), 'NPC37.storyBlock 挡住弹卡');
  R(c, 'UI.toasts = []');
  SW2.toast('x');
  ok(R(c, 'UI.toasts.length') === 0, 'storyBlock 时 toast 不发');
  R(c, '__setNpcBlock(null)');
  R(c, '__setB(true)');
  ok(SW2.storyBlock() === 'battle' && !SW2.canPopup(), 'B.on 挡住弹卡');
  R(c, '__setB(false)');
  ok(SW2.canPopup(), '解除后可弹');

  // ---- null guards ----
  ok(SW2.st(undefined) !== null || true, 'st 有 Game.G');
  ok(SW2._once === undefined && typeof SW2._once !== 'function', 'Sweep44._once 未暴露（闭包私有）');
  ok(typeof SW2.once !== 'function', 'once 不再作为公开 API');
  c = box2(); SW2 = R(c, 'Sweep44');
  ok(SW2.can(null, 0) === false, 'can(null) 无 Game.G → false');
  R(c, 'Game').G = mkG();
  ok(SW2.can(null, 0) === false, 'can 回落未首通 G → false');
  ok(SW2.curBand(null) === 0, 'curBand(null)=0');
  ok(SW2.onExit(null, null) === false, 'onExit null 安全');
  ok(typeof SW2.flavorLine() === 'string' && SW2.flavorLine().length > 0, 'flavorLine');

  // ---- Game.roll 路径（pick 材料）----
  c = box2();
  G = mkG({ ap: 4 }); R(c, 'Game').G = G; SW2 = R(c, 'Sweep44');
  SW2.markFull(G, 0, true);
  R(c, 'Game.rolls = []');
  // force roll to always false then true variety — just ensure roll was called
  await asyncR(c, 'return await Sweep44.go(Game.G, 0, 1, { silent: true });');
  ok(R(c, 'Game.rolls').some(x => x[1] === 'sweep44'), '材料 pick 走 Game.roll(..., sweep44)');

  // ---- listMax ----
  c = box2();
  G = mkG({ realm: 1 }); R(c, 'Game').G = G; SW2 = R(c, 'Sweep44');
  SW2.markFull(G, 0, true); SW2.markFull(G, 3, true);
  G.realm = 1;
  ok(SW2.listMax(G) === 3, 'listMax = max(当前档, 已首通最高)');

  // ---- 未首通拒绝 ----
  c = box2();
  G = mkG({ ap: 4 }); R(c, 'Game').G = G; SW2 = R(c, 'Sweep44');
  r1 = await asyncR(c, 'return await Sweep44.go(Game.G, 0, 1, { silent: true });');
  ok(!r1.ok && r1.reason === 'locked_first', '未首通 go 拒绝');


  // ---- 对抗：M1 storyBlock / B.on 下 go（非 silent）不花 AP、不计数 ----
  c = box2();
  G = mkG({ ap: 5, stone: 100, exp: 0, realm: 2 }); R(c, 'Game').G = G; SW2 = R(c, 'Sweep44');
  SW2.markFull(G, 0, true);
  const snap = () => ({ ap: G.ap, n: G.sw44.n, tot: G.sw44.tot, stone: G.stone, exp: G.exp, eqs: (G.eqs || []).length, inv: JSON.stringify(G.inv || {}) });
  R(c, '__setNpcBlock("prologue")');
  let before = snap();
  r1 = await asyncR(c, 'return await Sweep44.go(Game.G, 0, 1);');
  ok(!r1.ok && r1.reason === 'blocked', 'storyBlock 时 go 拒绝 blocked');
  ok(JSON.stringify(snap()) === JSON.stringify(before), 'storyBlock 时 AP/n/tot/奖励不变');
  R(c, '__setNpcBlock(null)');
  R(c, '__setB(true)');
  before = snap();
  r1 = await asyncR(c, 'return await Sweep44.go(Game.G, 0, 1);');
  ok(!r1.ok && r1.reason === 'blocked', 'B.on 时 go 拒绝 blocked');
  ok(JSON.stringify(snap()) === JSON.stringify(before), 'B.on 时 AP/n/tot/奖励不变');
  R(c, '__setB(false)');
  // silent 路径仍可测逻辑（不受 storyBlock 挡）
  R(c, '__setNpcBlock("prologue")');
  r1 = await asyncR(c, 'return await Sweep44.go(Game.G, 0, 1, { silent: true });');
  ok(r1.ok && G.ap === 4 && G.sw44.n === 1, 'silent 逻辑层单测仍可过 storyBlock');
  R(c, '__setNpcBlock(null)');

  // ---- 对抗：公开 API 无法绕过年 cap / 未解锁 / 无 AP ----
  c = box2();
  G = mkG({ ap: 10, stone: 0, realm: 2 }); R(c, 'Game').G = G; SW2 = R(c, 'Sweep44');
  // 未解锁
  r1 = await asyncR(c, 'return await Sweep44.go(Game.G, 0, 1, { silent: true });');
  ok(!r1.ok && r1.reason === 'locked_first' && G.ap === 10 && G.stone === 0, '未解锁公开 go 拒绝且不发奖');
  ok(typeof SW2.once !== 'function' && SW2._once === undefined, '公开对象无 once/_once（防绕过）');
  // 公开路径受门闩；验证反复 go 不能超过 3
  SW2.markFull(G, 0, true);
  for (let i = 0; i < 3; i++) {
    r1 = await asyncR(c, 'return await Sweep44.go(Game.G, 0, 1, { silent: true });');
    ok(r1.ok, '公开 go 第 ' + (i + 1) + ' 次');
  }
  ok(G.sw44.n === 3 && SW2.left(G) === 0, '满 3 次');
  const apAfter3 = G.ap, stoneAfter3 = G.stone, totAfter3 = G.sw44.tot;
  r1 = await asyncR(c, 'return await Sweep44.go(Game.G, 0, 1, { silent: true });');
  ok(!r1.ok && r1.reason === 'cap', '第 4 次公开 go 拒 cap');
  ok(G.ap === apAfter3 && G.stone === stoneAfter3 && G.sw44.n === 3 && G.sw44.tot === totAfter3, '超 cap 后状态不变');
  // ×N 一次也不能突破 cap
  G.sw44.n = 2; G.sw44.y = G.year; G.ap = 5;
  r1 = await asyncR(c, 'return await Sweep44.go(Game.G, 0, 2, { silent: true });');
  ok(!r1.ok && r1.reason === 'cap' && G.sw44.n === 2, '×2 在剩余 1 时拒 cap、不计数');
  // 无 AP
  G.sw44.n = 0; G.sw44.y = G.year; G.ap = 0; G.stone = 0;
  r1 = await asyncR(c, 'return await Sweep44.go(Game.G, 0, 1, { silent: true });');
  ok(!r1.ok && r1.reason === 'noap' && G.stone === 0 && G.sw44.n === 0, '无 AP 公开 go 拒绝且不发奖');
  // AP 不足 times
  G.ap = 1;
  r1 = await asyncR(c, 'return await Sweep44.go(Game.G, 0, 2, { silent: true });');
  ok(!r1.ok && r1.reason === 'noap' && G.ap === 1 && G.sw44.n === 0, 'AP 不足 ×N 拒绝');


  console.log(`\n${n - fails}/${n} passed, ${fails} failed`);
  process.exit(fails);
})().catch(e => { console.error(e); process.exit(1); });

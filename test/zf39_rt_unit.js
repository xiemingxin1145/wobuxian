// 3.9.0 阵法 zf39 第 4 轮 即时战接入单测：node test/zf39_rt_unit.js（退出码 = 失败数）。
// vm 沙箱：最小 calcDmg + RT27.on 开关 + 真实 zf39.js / zf39_rt.js。
// 验证：非 RT27 不改；老档不动；锋矢 out×1.12；玄武 inc；北斗 crit 加到 a.crit；重复加载不重复包；index 顺序。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const rd = f => fs.readFileSync(path.join(__dirname, '..', 'www', 'js', f), 'utf8');
const ZF = rd('zf39.js'), RT = rd('zf39_rt.js');
const INDEX = fs.readFileSync(path.join(__dirname, '..', 'www', 'index.html'), 'utf8');
const near = (a, b, e) => Math.abs(a - b) <= (e || 1e-9);

ok(/zf39_rt\.js/.test(INDEX), 'index.html 加载 zf39_rt.js');
ok(INDEX.indexOf('zf39_ui.js') < INDEX.indexOf('zf39_rt.js'), 'zf39_rt.js 在 zf39_ui.js 之后');
ok(!/RealtimeBattle/.test(RT), 'zf39_rt.js 不引用 RealtimeBattle（避免污染 battle_rt_proto 引用白名单）');

const FAKE = `
var __rand = 0.99;
Math.random = function () { return __rand; };
function calcDmg(a, d, sk) {
  sk = sk || { k: 1 };
  let dm = Math.max(1, Math.round((a.atk || 0) * (sk.k || 1)));
  let crit = Math.random() < (a.crit || 0);
  if (crit) dm = Math.max(1, Math.round(dm * 1.6));
  return { dm, crit, tag: '' };
}
var RT27 = { on: false, player: null };
const Game = { G: null, rolls: [], rollRet: false, roll(p, kind) { this.rolls.push([p, kind]); return this.rollRet; } };
`;

function box(extra) {
  const c = Object.assign({ console, Math, JSON, Object, Array }, extra || {});
  c.window = c; c.globalThis = c; vm.createContext(c);
  vm.runInContext(FAKE, c);
  vm.runInContext(ZF, c);
  vm.runInContext(RT, c);
  return c;
}
const mkG = () => ({ v: 2, year: 30, realm: 4, stage: 0, stone: 1e6, inv: {}, flags: {} });
function setZ(c, G, war, tiers, lv) {
  c.ZF39.ensure(G); G.zf39.lv = lv; G.zf39.xp = c.ZF39.need(lv);
  for (const id in tiers) { G.zf39.know[id] = 1; G.zf39.tier[id] = tiers[id]; }
  G.zf39.war = war.slice();
}
const P = () => ({ name: '主角', isPlayer: true, side: 0, atk: 100, def: 50, crit: 0.1, buf: {} });
const E = () => ({ name: '小怪', side: 1, atk: 40, def: 20, crit: 0.05, buf: {} });

// 加载与幂等
{
  const c = box();
  ok(c.__zf39Rt === 1 && c.ZF39.rtHooked === true, '加载后已包 calcDmg（__zf39Rt + rtHooked）');
  const before = vm.runInContext('calcDmg', c);
  vm.runInContext(RT, c);
  ok(vm.runInContext('calcDmg', c) === before && c.__zf39Rt === 1, '重复加载不重复包');
}
// 无 calcDmg 时安全跳过
{
  const c = { console, Math, JSON, Object, Array, RT27: { on: true } }; c.window = c; vm.createContext(c);
  vm.runInContext(ZF, c); vm.runInContext(RT, c);
  ok(!c.__zf39Rt && !c.ZF39.rtHooked, '没有 calcDmg 时 hook 安全跳过（不置 __zf39Rt）');
}
// 非即时战：完全不改
{
  const c = box(); const G = mkG(); vm.runInContext('Game', c).G = G;
  setZ(c, G, ['fengshi'], { fengshi: 3 }, 7);
  vm.runInContext('RT27.on = false', c);
  const a = P(), d = E();
  const r = vm.runInContext('calcDmg', c)(a, d, { k: 1 });
  ok(r.dm === 100 && !r.crit && a.crit === 0.1, '回合制（RT27.off）：锋矢也不改 calcDmg 结果');
}
// 老档无 G.zf39
{
  const c = box(); const G = mkG(); vm.runInContext('Game', c).G = G;
  vm.runInContext('RT27.on = true', c);
  const snap = JSON.stringify(G);
  const a = P(), d = E();
  const r = vm.runInContext('calcDmg', c)(a, d, { k: 1 });
  ok(r.dm === 100 && JSON.stringify(G) === snap && G.zf39 === undefined, '老档即时战：伤害不变且不创建 G.zf39');
}
// 学了没布
{
  const c = box(); const G = mkG(); vm.runInContext('Game', c).G = G;
  setZ(c, G, [], { fengshi: 3 }, 7);
  vm.runInContext('RT27.on = true', c);
  const r = vm.runInContext('calcDmg', c)(P(), E(), { k: 1 });
  ok(r.dm === 100, '学了没布：即时战伤害不变');
}
// 锋矢上品 out ×1.12
{
  const c = box(); const G = mkG(); vm.runInContext('Game', c).G = G;
  setZ(c, G, ['fengshi'], { fengshi: 3 }, 7);
  vm.runInContext('RT27.on = true; __rand = 0.99', c);
  const a = P(), d = E();
  const r = vm.runInContext('calcDmg', c)(a, d, { k: 1 });
  ok(r.dm === Math.round(100 * 1.12) && !r.crit, 'A11.2：锋矢上品即时战出手 ×1.12（' + r.dm + '）');
  ok(near(c.ZF39.rtMult(G).out, 1.12), 'rtMult.out === 1.12');
  // 敌打我：锋矢不影响受伤
  const r2 = vm.runInContext('calcDmg', c)(E(), P(), { k: 1 });
  ok(r2.dm === 40, '锋矢：敌→我 不受 out 影响');
}
// 玄武上品 inc = 1/1.16
{
  const c = box(); const G = mkG(); vm.runInContext('Game', c).G = G;
  setZ(c, G, ['xuanwu'], { xuanwu: 3 }, 7);
  vm.runInContext('RT27.on = true; __rand = 0.99', c);
  const m = c.ZF39.rtMult(G);
  const r = vm.runInContext('calcDmg', c)(E(), P(), { k: 1 });
  ok(near(m.inc, 1 / 1.16, 1e-6) && r.dm === Math.max(1, Math.round(40 * m.inc)),
    '玄武上品：受伤 ×inc≈' + m.inc.toFixed(4) + ' → dm=' + r.dm);
  const rOut = vm.runInContext('calcDmg', c)(P(), E(), { k: 1 });
  ok(rOut.dm === 100, '玄武：我→敌 不受 inc 影响');
}
// 北斗上品 crit +0.08（临时加到 a.crit）
{
  const c = box(); const G = mkG(); vm.runInContext('Game', c).G = G;
  setZ(c, G, ['beidou'], { beidou: 3 }, 7);
  vm.runInContext('RT27.on = true', c);
  ok(near(c.ZF39.rtMult(G).crit, 0.08), '北斗上品 rtMult.crit=0.08');
  // 原 crit=0.1，加 0.08 → 0.18；__rand=0.15 → 暴击
  vm.runInContext('__rand = 0.15', c);
  const a = P(), d = E();
  const r = vm.runInContext('calcDmg', c)(a, d, { k: 1 });
  ok(r.crit === true && a.crit === 0.1, '北斗：crit 判定吃到加成且事后 a.crit 还原');
  // 无北斗时 0.15 不暴击
  G.zf39.war = [];
  const a2 = P(); const r2 = vm.runInContext('calcDmg', c)(a2, E(), { k: 1 });
  ok(r2.crit === false, '撤北斗后同种子不暴击');
}
// 疾风（非 rt）即时战无效
{
  const c = box(); const G = mkG(); vm.runInContext('Game', c).G = G;
  setZ(c, G, ['jifeng'], { jifeng: 3 }, 7);
  vm.runInContext('RT27.on = true; __rand = 0.99', c);
  ok(c.ZF39.rtMult(G).out === 1, '疾风阵 rtMult.out=1');
  ok(vm.runInContext('calcDmg', c)(P(), E(), { k: 1 }).dm === 100, '疾风阵即时战不改伤害');
}
// 连阵：土生金 锋矢 0.12×1.25
{
  const c = box(); const G = mkG(); vm.runInContext('Game', c).G = G;
  setZ(c, G, ['xuanwu', 'fengshi'], { xuanwu: 3, fengshi: 3 }, 9);
  vm.runInContext('RT27.on = true; __rand = 0.99', c);
  const out = c.ZF39.rtMult(G).out;
  ok(near(out, 1.15), '连阵 rtMult.out≈1.15（' + out + '）');
  ok(vm.runInContext('calcDmg', c)(P(), E(), { k: 1 }).dm === Math.round(100 * out), '连阵出手伤害取整');
}
// Game.roll 约定（rtRoll）
{
  const c = box();
  const Game = vm.runInContext('Game', c);
  Game.rollRet = true;
  ok(c.ZF39.rtRoll(0.3) === true && Game.rolls[0][1] === 'zf39', 'rtRoll 走 Game.roll(...,"zf39")');
  const c2 = { console, Math, JSON }; c2.window = c2; vm.createContext(c2);
  vm.runInContext(ZF, c2); vm.runInContext(RT, c2);
  ok(typeof c2.ZF39.rtRoll === 'function' && c2.ZF39.rtRoll(1) === true && c2.ZF39.rtRoll(0) === false,
    '无 Game：rtRoll 退回 Math.random');
}
// items40 外包顺序：先 items40 假包，再 zf39_rt，外层是 zf39
{
  const FAKE2 = FAKE + `
var __order = [];
var _cd0 = calcDmg;
calcDmg = function (a, d, sk) { __order.push('items40'); return _cd0(a, d, sk); };
`;
  const c = { console, Math, JSON, Object, Array }; c.window = c; c.globalThis = c; vm.createContext(c);
  vm.runInContext(FAKE2, c); vm.runInContext(ZF, c); vm.runInContext(RT, c);
  const G = mkG(); vm.runInContext('Game', c).G = G;
  setZ(c, G, ['fengshi'], { fengshi: 3 }, 7);
  vm.runInContext('RT27.on = true; __rand = 0.99; __order = []', c);
  const r = vm.runInContext('calcDmg', c)(P(), E(), { k: 1 });
  const order = vm.runInContext('__order', c);
  ok(order.join() === 'items40' && r.dm === 112, 'wrap 顺序：zf39_rt 在 items40 之外（先记 items40，再乘阵法）');
}

console.log(`\n${n - fails}/${n} PASS`);
process.exit(fails);

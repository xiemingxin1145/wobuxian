// 3.9.0 阵法 zf39 第 2 轮 战斗接入单测：node test/zf39_hook_unit.js（退出码 = 失败数）。
// vm 沙箱里放一个最小 battle（顶层 const B + function battleLoop，和 battle.js 同样的全局绑定方式）+ 顶层 const Game，
// 再加载真实 www/js/zf39.js 与 www/js/zf39_hook.js。验证：没布阵完全不动；锋矢开局加攻；困龙定身走 Game.roll；欠条阵按回合补挂反弹；老档无 G.zf39 不建字段。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const rd = f => fs.readFileSync(path.join(__dirname, '..', 'www', 'js', f), 'utf8');
const ZF = rd('zf39.js'), HOOK = rd('zf39_hook.js');
const FAKE = `
const B = { on: false, units: [], round: 0, log: [] };
var __rounds = [];
async function battleLoop() { while (B.on) { B.round++; __rounds.push(B.round); const P = B.units.find(u => u.isPlayer);
  __rounds.push('r' + (P.buf.reflect || 0)); P.buf.reflect = 0; if (B.round >= __stopAt) B.on = false; } }
var __stopAt = 10;
const Game = { G: null, rolls: [], rollRet: false, roll(p, kind) { this.rolls.push([p, kind]); return this.rollRet; } };
function startBattle(units) { Object.assign(B, { on: true, units, round: 0 }); for (const u of units) u.buf = {}; return battleLoop(); }
`;
function box() {
  const c = { console, Math, JSON, Object, Array }; c.window = c; vm.createContext(c);
  vm.runInContext(FAKE, c); vm.runInContext(ZF, c); vm.runInContext(HOOK, c); return c;
}
const units = () => [
  { name: '主角', side: 0, isPlayer: true, atk: 100, def: 50, spd: 20, crit: 0.1, buf: {} },
  { name: '小怪', side: 1, atk: 30, def: 10, spd: 10, crit: 0.05, buf: {} },
  { name: '大BOSS', side: 1, boss: true, atk: 300, def: 100, spd: 15, crit: 0.05, buf: {} },
];
const mkG = c => ({ v: 2, year: 30, realm: 4, stage: 0, stone: 1e6, inv: {}, flags: {} });
function setZ(c, G, war, tiers, lv) { c.ZF39.ensure(G); G.zf39.lv = lv; G.zf39.xp = c.ZF39.need(lv);
  for (const id in tiers) { G.zf39.know[id] = 1; G.zf39.tier[id] = tiers[id]; } G.zf39.war = war.slice(); }
const run = async (c, us, stop) => { vm.runInContext('__rounds = []; __stopAt = ' + (stop || 10), c); await c.startBattle(us); return vm.runInContext('__rounds', c); };

(async () => {
  { const c = box(); ok(c.ZF39.hooked === true && c.__zf39Hook === 1, '加载后已包 battleLoop'); vm.runInContext(HOOK, c);
    ok(vm.runInContext('typeof battleLoop', c) === 'function', '重复加载不重复包'); }
  // 老档：没有 G.zf39
  { const c = box(); const G = mkG(); vm.runInContext('Game', c).G = G; const us = units(); const rs = await run(c, us, 3);
    ok(us[0].atk === 100 && us[0].def === 50 && !us[1].buf.slow, '老档无阵法：数值不变');
    ok(G.zf39 === undefined, '老档：不新建 G.zf39'); ok(c.ZF39.lastFx === null, 'lastFx=null');
    ok(Object.getOwnPropertyDescriptor(vm.runInContext('B', c), 'round').hasOwnProperty('value'), '没布阵：B.round 仍是普通字段'); ok(rs.filter(x => typeof x === 'number').join() === '1,2,3', '回合照常推进');
    ok(vm.runInContext('Game', c).rolls.length === 0, '没布阵不调 Game.roll'); }
  // 学了但没布
  { const c = box(); const G = mkG(); vm.runInContext('Game', c).G = G; setZ(c, G, [], { fengshi: 3 }, 7); const us = units(); await run(c, us, 2);
    ok(us[0].atk === 100, '学了没布：不加攻'); }
  // 锋矢上品 ×1.12
  { const c = box(); const G = mkG(); vm.runInContext('Game', c).G = G; setZ(c, G, ['fengshi'], { fengshi: 3 }, 7); const us = units(); await run(c, us, 2);
    ok(Math.abs(us[0].atk - 112) < 1e-9 && us[1].atk === 30, '锋矢上品：主角 atk 100→112，敌方不变');
    ok(c.ZF39.lastFx && c.ZF39.lastFx.atkPct > 0, 'lastFx 记下本场效果');
    const us2 = units(); await run(c, us2, 2); ok(Math.abs(us2[0].atk - 112) < 1e-9, '第二场重新从原值套用，不叠加'); }
  // 困龙上品：定身走 Game.roll
  { const c = box(); const G = mkG(); vm.runInContext('Game', c).G = G; setZ(c, G, ['kunlong'], { kunlong: 3 }, 7);
    vm.runInContext('Game', c).rollRet = true; let us = units(); await run(c, us, 1);
    ok(us[1].buf.stun === 1 && !us[2].buf.stun && us[2].buf.slow === 1, '困龙上品 Game.roll=真：小怪定身，BOSS 不定身只 slow=1');
    ok(vm.runInContext('Game', c).rolls.length === 1 && vm.runInContext('Game', c).rolls[0][1] === 'zf39' && Math.abs(vm.runInContext('Game', c).rolls[0][0] - 0.15) < 1e-9, '只对普通怪调一次 Game.roll(0.15, "zf39")');
    vm.runInContext('Game', c).rollRet = false; us = units(); await run(c, us, 1); ok(!us[1].buf.stun && us[1].buf.slow === 3, 'Game.roll=假：不定身，slow=3'); }
  // 欠条阵上品：开局挂一次，第 4、7、10 回合补挂
  { const c = box(); const G = mkG(); vm.runInContext('Game', c).G = G; setZ(c, G, ['qiantiao'], { qiantiao: 3 }, 7); const us = units(); const rs = await run(c, us, 10);
    const got = []; for (let i = 0; i < rs.length; i += 2) if (rs[i + 1] === 'r1') got.push(rs[i]);
    ok(got.join() === '1,4,7,10', '欠条上品：反弹在第 1（开局）/4/7/10 回合（' + got.join() + '）');
    ok(vm.runInContext('B.round', c) === 10, 'B.round getter 正常读'); }
  // 欠条阵一场之后换成没布阵：setter 不再补挂
  { const c = box(); const G = mkG(); vm.runInContext('Game', c).G = G; setZ(c, G, ['qiantiao'], { qiantiao: 3 }, 7); await run(c, units(), 4);
    G.zf39.war = []; const us = units(); const rs = await run(c, us, 7); ok(!rs.includes('r1'), '撤阵后下一场不再补挂反弹'); }
  // 没有 Game 时 roll 退回 Math.random
  { const c = { console, Math, JSON }; c.window = c; vm.createContext(c); vm.runInContext(ZF, c);
    ok(typeof c.ZF39.roll(0.5) === 'boolean' && c.ZF39.roll(1) === true && c.ZF39.roll(0) === false, '无 Game：ZF39.roll 退回 Math.random');
    vm.runInContext(HOOK, c); ok(!c.ZF39.hooked, '没有 battleLoop/B 时 hook 安全跳过'); }
  console.log(`\n${n - fails}/${n} PASS`); process.exit(fails);
})().catch(e => { console.error(e); process.exit(99); });

// 3.9.0 阵法 zf39 第 1 轮单测：node test/zf39_unit.js（退出码 = 失败数）。vm 沙箱 + 真实 www/js/zf39.js，不开浏览器、不碰真实页面。
// 覆盖 docs/research_v22.md §11.8：A11.2（锋矢上品 atk ×1.12，含 rtMult）、A11.3（困龙上品 BOSS slow=1 不定身 / 普通 slow=3）、
// A11.4（回春+疾风 lv5 疾风 spd ×1.10，顺序无关）、破阵 3/4/5 眼生成与判定、容错 2 / lv9=3、等级表、炼制成本、槽位、老档惰性默认、阵眼冷却。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const SRC = fs.readFileSync(path.join(__dirname, '..', 'www', 'js', 'zf39.js'), 'utf8');
const DOC = fs.readFileSync(path.join(__dirname, '..', 'docs', 'research_v22.md'), 'utf8');
function box(extra) {
  const c = Object.assign({ console, Math, JSON }, extra || {}); c.window = c; vm.createContext(c);
  const before = new Set(Object.keys(c));
  vm.runInContext(SRC, c);
  c.__added = Object.keys(c).filter(k => !before.has(k));
  return c;
}
const near = (a, b, e) => Math.abs(a - b) <= (e || 1e-9);
const seq = arr => { let i = 0; return () => arr[i++ % arr.length]; };
const mkG = o => Object.assign({ v: 2, year: 30, realm: 4, stage: 0, stone: 1e6, inv: { zws39: 999, yd: 99, tcdb: 99 }, flags: {} }, o || {});
const units = () => [
  { name: '主角', side: 0, isPlayer: true, atk: 100, def: 50, spd: 20, crit: 0.1, buf: {} },
  { name: '灵兽', side: 0, isPet: true, atk: 40, def: 20, spd: 30, crit: 0.05, buf: {} },
  { name: '小怪', side: 1, atk: 30, def: 10, spd: 10, crit: 0.05, buf: {} },
  { name: '大BOSS', side: 1, boss: true, atk: 300, def: 100, spd: 15, crit: 0.05, buf: {} },
];
// 直接造一个「已学/已炼/已布」的阵法存档
function zfG(war, tiers, lv, o) {
  const G = mkG(o); const c = box(); c.ZF39.ensure(G);
  G.zf39.lv = lv; G.zf39.xp = c.ZF39.need(lv);
  for (const id in tiers) { G.zf39.know[id] = 1; G.zf39.tier[id] = tiers[id]; }
  G.zf39.war = war.slice(); return G;
}

const c = box(); const Z = c.ZF39;
// ---- 加载：惰性 ----
ok(c.__added.length === 1 && c.__added[0] === 'ZF39', '加载只定义 window.ZF39（新增全局 ' + c.__added.join(',') + '）');
const c2 = box({ ITEMS: { herb: { n: '灵草' } }, SHOPS: { merchant: [] }, Game: { G: mkG(), fight() { return 'orig'; } } });
ok(Object.keys(c2.ITEMS).join() === 'herb' && c2.SHOPS.merchant.length === 0 && c2.Game.G.zf39 === undefined && c2.Game.fight() === 'orig', '加载不改 ITEMS/SHOPS/Game.G，不包 Game 函数');

// ---- TEXT390 与规格 §11.10 逐字一致 ----
{ const i = DOC.indexOf('### 11.10 JSON'); const a = DOC.indexOf('```json\n', i) + 8; const b = DOC.indexOf('\n```', a);
  ok(JSON.stringify(Z.TEXT390) === JSON.stringify(JSON.parse(DOC.slice(a, b))), 'TEXT390 与 docs §11.10 JSON 完全一致'); }
ok(Z.WAR_IDS.length === 9 && Z.CAVE_IDS.length === 4, '9 战阵 + 4 洞府阵');
ok(Z.WAR.fengshi.el === '金' && Z.WAR.xuanwu.el === '土' && Z.WAR.huichun.el === '木' && Z.WAR.yinling.el === '水' && Z.WAR.jifeng.el === '火' && Z.WAR.beidou.el === '金' && Z.WAR.kunlong.el === '土' && Z.WAR.huanghe.el === '水' && Z.WAR.qiantiao.el === '无', '§11.4 五行表');
ok(Z.WAR_IDS.filter(id => Z.WAR[id].rt).join() === 'fengshi,xuanwu,beidou', 'rt 列：仅锋矢/玄武/北斗');
ok(Z.WAR.fengshi.atkPct.join() === '0,0.06,0.09,0.12' && Z.WAR.xuanwu.defPct.join() === '0,0.08,0.12,0.16' && Z.WAR.jifeng.spdPct.join() === '0,0.08,0.12,0.16' && Z.WAR.huichun.regen.join() === '0,0.02,0.03,0.04' && Z.WAR.yinling.mpregen.join() === '0,0.03,0.04,0.05' && Z.WAR.beidou.crit.join() === '0,0.04,0.06,0.08', '§11.4 百分比数值');
ok(Z.CAVE.hushan.blockP === 0.35 && Z.CAVE.mizong.foeW === 0.5 && Z.CAVE.jubao.stonePct === 0.15 && Z.CAVE.danhuo.alchPP === 5, '§11.5 洞府阵数值');
ok(Z.ITEMS390.zws39.t === 'mat' && Z.ITEMS390.zws39.p === 80 && Z.ITEMS390.ztc39.p === 300 && Z.ITEMS390.zws39.n === '阵纹石' && Z.ITEMS390.ztc39.n === '阵图残页', '§11.7 新道具数据（本轮不并入 ITEMS）');

// ---- 等级表 ----
ok([1, 2, 3, 4, 5, 6, 7, 8, 9].map(Z.need).join() === '0,60,240,540,960,1500,2160,2940,3840', 'need(lv)=60·(lv−1)²：0/60/240/540/960/1500/2160/2940/3840');
ok(Z.LV.slice(1).map(l => l.war).join() === '1,1,1,1,2,2,2,2,3', '战阵槽 1,1,1,1,2,2,2,2,3');
ok(Z.LV.slice(1).map(l => l.cave).join() === '1,1,2,2,2,3,3,3,4', '洞府阵眼 1,1,2,2,2,3,3,3,4');
ok(Z.LV.slice(1).map(l => l.tier).join() === '1,1,1,2,2,2,3,3,3', '可炼品阶 下×3 中×3 上×3');
ok(Z.LV.slice(1).map(l => (l.glow ? 'g' : '-') + (l.arrow ? 'a' : '-')).join() === '--,--,g-,g-,g-,ga,ga,ga,ga', '提示：lv3 生门发光，lv6 淡箭头');
ok(Z.lvOf(0) === 1 && Z.lvOf(59) === 1 && Z.lvOf(60) === 2 && Z.lvOf(959) === 4 && Z.lvOf(960) === 5 && Z.lvOf(3839) === 8 && Z.lvOf(3840) === 9 && Z.lvOf(1e9) === 9, 'lvOf 边界（上限 9）');

// ---- 老档惰性默认 ----
{ const G = mkG(); delete G.zf39; const snap = JSON.stringify(G); const us = units(); const us0 = JSON.stringify(us);
  const f = Z.apply(us, G, () => 0); Z.rtMult(G); Z.fx(G); Z.active(G); Z.eyeCooldown(G, 'village', 30); Z.caveOn(G, 'hushan'); Z.learned(G); Z.canCraft(G, 'fengshi', 1); Z.winXp(G, 30); Z.setWar(G, ['fengshi']);
  ok(JSON.stringify(G) === snap && G.zf39 === undefined, '老档无 G.zf39：只读函数全部不创建/不改 G');
  ok(JSON.stringify(us) === us0 && f.chain.length === 0, '老档：apply 不改任何战斗单位');
  const r = Z.rtMult(G); ok(r.out === 1 && r.inc === 1 && r.crit === 0, '老档：rtMult = 1/1/0');
  ok(Z.addXp(G, 50).add === 0 && G.zf39.lv === 0 && G.zf39.xp === 0, '没学阵法 addXp 不加经验');
  const Zs = Z.ensure(G); ok(JSON.stringify(Zs) === JSON.stringify({ lv: 0, xp: 0, know: {}, tier: {}, war: [], cave: [], yrWinXp: 0, yrKey: 0, eyes: {} }), 'ensure 默认结构与 §11.2 一致');
  const o = JSON.parse(snap); delete o.zf39; const g2 = JSON.parse(JSON.stringify(G)); delete g2.zf39;
  ok(JSON.stringify(o) === JSON.stringify(g2) && G.v === 2, 'ensure 只加 G.zf39，其它字段与 G.v===2 不变');
  const G3 = mkG({ zf39: { lv: 3, xp: 300, know: { fengshi: 1 } } }); Z.ensure(G3);
  ok(G3.zf39.lv === 3 && G3.zf39.know.fengshi === 1 && Array.isArray(G3.zf39.war) && G3.zf39.yrKey === 0 && typeof G3.zf39.eyes === 'object', 'ensure 补齐残缺字段、保留已有值');
  const c3 = box({ Game: { G: mkG() } }); c3.ZF39.ensure(); ok(c3.Game.G.zf39 && c3.Game.G.zf39.lv === 0, '缺省参数走 Game.G');
}

// ---- 解锁 + 经验 ----
{ const G = mkG({ realm: 0, stone: 1000, inv: {} });
  ok(!Z.unlock(G) && G.zf39 === undefined, '凡人买不了施工图');
  G.realm = 1; G.stone = 499; ok(!Z.unlock(G), '灵石不足 500 买不了');
  G.stone = 1000; ok(Z.unlock(G) && G.stone === 500 && G.zf39.lv === 1 && G.zf39.know.fengshi && G.zf39.know.xuanwu && G.inv.zws39 === 3, '施工图：-500 灵石，lv1，锋矢+玄武，阵纹石×3');
  ok(!Z.unlock(G) && G.stone === 500, '不能重复买');
  let r = Z.addXp(G, 59); ok(G.zf39.lv === 1 && r.ups.length === 0, 'xp 59 仍 lv1');
  r = Z.addXp(G, 1); ok(G.zf39.lv === 2 && r.ups.join() === '2', 'xp 60 → lv2');
  r = Z.addXp(G, 900); ok(G.zf39.lv === 5 && r.ups.join() === '3,4,5' && G.zf39.xp === 960, '一次 +900 连升 3,4,5');
  r = Z.addXp(G, 1e6); ok(G.zf39.lv === 9 && r.to === 9, '封顶 lv9');
  ok(Z.breakXp(3) === 30 && Z.breakXp(4) === 35 && Z.breakXp(5) === 40, '破阵 xp 30/35/40');
}
{ const G = zfG(['fengshi'], { fengshi: 1 }, 1);
  let s = 0; for (let k = 0; k < 50; k++) s += Z.winXp(G, 30).add;
  ok(s === 40 && G.zf39.yrWinXp === 40 && G.zf39.yrKey === 30, '布阵赢一场 +1，每年上限 40');
  let wr = Z.winXp(G, 31); ok(wr.add === 1 && Array.isArray(wr.ups) && G.zf39.yrWinXp === 1 && G.zf39.yrKey === 31, '换年清零（返回 {add,ups}）');
  G.zf39.war = []; ok(Z.winXp(G, 31).add === 0, '没布阵不加');
}
// ---- winXp：缺 war 不 NPE；跨级 ups ----
{ const G = mkG(); Z.ensure(G); G.zf39.lv = 1; G.zf39.xp = 0; delete G.zf39.war;
  let wr = Z.winXp(G, 1);
  ok(wr && wr.add === 0 && Array.isArray(wr.ups) && wr.ups.length === 0, '缺 war：返回 {add:0,ups:[]} 不抛');
  G.zf39 = { lv: 2, xp: 10 }; wr = null; let threw = false;
  try { wr = Z.winXp(G, 2); } catch (e) { threw = true; }
  ok(!threw && wr && wr.add === 0 && Array.isArray(wr.ups), '残缺 zf39 无 war：不 NPE，add=0');
}
{ const G = zfG(['fengshi'], { fengshi: 1 }, 1);
  G.zf39.xp = Z.need(2) - 1; G.zf39.lv = 1; G.zf39.yrKey = 99; G.zf39.yrWinXp = 0;
  const wr = Z.winXp(G, 99);
  ok(wr.add === 1 && wr.ups.join() === '2' && G.zf39.lv === 2 && G.zf39.xp === Z.need(2), 'xp=need(2)-1 胜利：ups=[2] 升到 lv2');
}

// ---- 炼制 ----
{ const G = mkG({ realm: 1, stone: 600, inv: { zws39: 3 } }); Z.unlock(Object.assign(G, { stone: 1100 }));
  G.inv.zws39 = 3; G.stone = 600;
  ok(!Z.canCraft(G, 'huichun', 1).ok && Z.canCraft(G, 'huichun', 1).why === 'know', '没学阵图不能炼');
  let k = Z.canCraft(G, 'fengshi', 1); ok(k.ok && k.cost.zws39 === 3 && k.cost.stone === 600 && k.cost.realm === 1, '下品：阵纹石×3 + 600 + 练气 + lv1');
  let r = Z.craft(G, 'fengshi', 1); ok(r.ok && G.zf39.tier.fengshi === 1 && G.inv.zws39 === 0 && G.stone === 0 && r.xp === 10 && G.zf39.xp === 10, '炼成下品：扣材料灵石，+10 xp');
  ok(!Z.canCraft(G, 'fengshi', 1).ok && Z.canCraft(G, 'fengshi', 1).why === 'have', '同品不能重炼');
  k = Z.canCraft(G, 'xuanwu', 1); ok(!k.ok && k.lack.map(x => x.k).join() === 'zws39,stone', '缺料列出 lack（阵纹石、灵石）');
  ok(G.inv.zws39 === 0 && G.stone === 0 && !G.zf39.tier.xuanwu && !Z.craft(G, 'xuanwu', 1).ok && G.zf39.tier.xuanwu === undefined, '缺料 craft 不扣任何东西');
  // 中品
  G.inv = { zws39: 8, yd: 4 }; G.stone = 4000; G.realm = 3;
  k = Z.canCraft(G, 'fengshi', 2); ok(!k.ok && k.lack.length === 1 && k.lack[0].k === 'lv' && k.lack[0].need === 4, '中品需阵道 lv4');
  Z.addXp(G, 540); ok(G.zf39.lv === 4, '升到 lv4');
  G.realm = 2; k = Z.canCraft(G, 'fengshi', 2); ok(!k.ok && k.lack[0].k === 'realm' && k.lack[0].need === 3, '中品需金丹');
  G.realm = 3; r = Z.craft(G, 'fengshi', 2); ok(r.ok && G.zf39.tier.fengshi === 2 && G.inv.zws39 === 0 && G.inv.yd === 0 && G.stone === 0 && r.xp === 30, '中品：阵纹石×8 + 妖丹×4 + 4000，+30 xp，升品覆盖');
  // 上品
  G.inv = { zws39: 20, tcdb: 1 }; G.stone = 20000; G.realm = 4;
  ok(!Z.canCraft(G, 'fengshi', 3).ok && Z.canCraft(G, 'fengshi', 3).lack[0].need === 7, '上品需阵道 lv7');
  Z.addXp(G, 2160); G.realm = 3; ok(Z.canCraft(G, 'fengshi', 3).lack.map(x => x.k).join() === 'realm', '上品需元婴');
  G.realm = 4; r = Z.craft(G, 'fengshi', 3); ok(r.ok && G.zf39.tier.fengshi === 3 && G.inv.zws39 === 0 && G.inv.tcdb === 0 && G.stone === 0 && r.xp === 80, '上品：阵纹石×20 + 天材地宝×1 + 20000，+80 xp');
  ok(!Z.canCraft(G, 'fengshi', 2).ok, '已上品不能降品重炼');
  // 洞府阵
  G.inv = { zws39: 30 }; G.stone = 10000; G.realm = 2;
  ok(Z.craft(G, 'hushan', 1).ok && G.inv.zws39 === 20 && G.stone === 7000 && G.zf39.tier.hushan === 1, '护山大阵：阵纹石×10 + 3000');
  ok(Z.canCraft(G, 'jubao', 1).lack.map(x => x.k).join() === 'realm', '聚宝阵需金丹');
  G.realm = 3; ok(Z.craft(G, 'jubao', 1).ok && G.inv.zws39 === 5 && G.stone === 2000, '聚宝阵：阵纹石×15 + 5000');
  ok(!Z.canCraft(G, 'nope', 1).ok && Z.cost('fengshi', 4) === null && Z.cost('hushan', 2) === null, '无效 id/品阶');
}

// ---- 槽位 ----
{ const G = zfG([], { fengshi: 1, xuanwu: 1, jifeng: 1, huichun: 1 }, 1); G.zf39.know.beidou = 1;
  ok(Z.setWar(G, ['fengshi']) && !Z.setWar(G, ['fengshi', 'xuanwu']) && G.zf39.war.join() === 'fengshi', 'lv1 战阵槽 1');
  ok(!Z.setWar(G, ['beidou']) && !Z.setWar(G, ['huanghe']), '没炼成/没学不能布');
  G.zf39.lv = 5; ok(Z.setWar(G, ['fengshi', 'xuanwu']) && !Z.setWar(G, ['fengshi', 'xuanwu', 'jifeng']) && !Z.setWar(G, ['fengshi', 'fengshi']), 'lv5 槽 2；不能重复');
  G.zf39.lv = 9; ok(Z.setWar(G, ['fengshi', 'xuanwu', 'jifeng']) && !Z.setWar(G, ['fengshi', 'xuanwu', 'jifeng', 'huichun']), 'lv9 槽 3');
  ok(Z.setWar(G, []) && G.zf39.war.length === 0, '可以清空');
  G.zf39.war = ['fengshi', 'xuanwu', 'jifeng']; G.zf39.lv = 1; ok(Z.active(G).length === 1, '超槽的旧布阵只取前 N 个生效');
  // 洞府阵眼
  const env = { Life34: {}, NPC37: {} }; G.zf39.tier.hushan = 1; G.zf39.tier.mizong = 1; G.zf39.tier.jubao = 1;
  G.zf39.lv = 2; ok(Z.setCave(G, ['hushan'], env) && !Z.setCave(G, ['hushan', 'mizong'], env), 'lv2 阵眼 1');
  G.zf39.lv = 3; ok(Z.setCave(G, ['hushan', 'mizong'], env) && Z.caveOn(G, 'mizong'), 'lv3 阵眼 2');
  ok(!Z.caveUseful('jubao', env) && !Z.setCave(G, ['jubao'], env) && Z.caveUseful('jubao', { PET35: {} }), 'A11.6：没装 pet35 时聚宝阵暂无用处、不让放入');
  ok(!Z.setCave(G, ['danhuo'], { LIAN35: {} }), '没炼成的洞府阵不能放');
}

// ---- A11.2 锋矢阵 上品 ----
{ const G = zfG(['fengshi'], { fengshi: 3 }, 7); const us = units(); Z.apply(us, G, () => 0.99);
  ok(near(us[0].atk, 112) && near(us[1].atk, 44.8), 'A11.2：主角 atk 100→112（×1.12），灵兽同样 ×1.12');
  ok(us[2].atk === 30 && us[3].atk === 300 && us[0].def === 50 && us[0].spd === 20 && us[0].crit === 0.1, '敌方与其它字段不变');
  const r = Z.rtMult(G); ok(r.out === 1.12 && r.inc === 1 && r.crit === 0, 'A11.2：rtMult 出手 ×1.12');
  const G2 = zfG(['fengshi'], { fengshi: 1 }, 1); const u2 = units(); Z.apply(u2, G2); ok(near(u2[0].atk, 106), '下品 atk ×1.06');
  ok(Z.rtMult(zfG(['jifeng'], { jifeng: 3 }, 7)).out === 1, '疾风阵（非 rt）即时战无效');
}
// ---- 玄武/北斗/回春/引灵/欠条 ----
{ const G = zfG(['xuanwu', 'beidou', 'qiantiao'], { xuanwu: 3, beidou: 3, qiantiao: 3 }, 9); const us = units(); Z.apply(us, G);
  ok(near(us[0].def, 58) && near(us[1].def, 23.2) && us[0].buf.def === 1 && !us[1].buf.def, '玄武上品：我方 def ×1.16，只有主角 buf.def=1');
  ok(near(us[0].crit, 0.2) && near(us[1].crit, 0.05), '北斗上品被玄武（土生金）相生：只给主角 crit +0.08×1.25=+0.10');
  ok(us[0].buf.reflect === 1 && !us[1].buf.reflect, '欠条阵：只给主角开局 reflect');
  const r = Z.rtMult(G); ok(r.out === 1 && near(r.inc, 1 / 1.16, 1e-6) && r.crit === 0.1, 'rtMult：玄武受伤 ÷1.16、北斗 crit +0.10（连阵）');
  ok([2, 3, 4, 5, 6, 7, 8, 9, 10].filter(k => Z.reflectAt(3, k)).join() === '4,7,10' && [2, 3, 4, 5, 6, 7, 8].filter(k => Z.reflectAt(2, k)).join() === '4' && ![2, 3, 4, 5].some(k => Z.reflectAt(1, k)), '欠条阵再挂：中品第 4 回合，上品每 3 回合');
  const u2 = units(); ok(!Z.roundStart(u2, 3, G) && Z.roundStart(u2, 4, G) && u2[0].buf.reflect === 1 && !u2[1].buf.reflect, 'roundStart 第 4 回合给主角再挂反弹');
  const G2 = zfG(['huichun', 'yinling'], { huichun: 2, yinling: 3 }, 5); const u3 = units(); u3[1].regen = 0.01; Z.apply(u3, G2);
  ok(near(u3[0].regen, 0.0375) && near(u3[1].regen, 0.0475) && near(u3[0].mpregen, 0.05) && !u3[2].regen && !u3[2].mpregen, '回春中品（被引灵 水生木）regen +0.0375，叠加到原 regen；引灵 mpregen +0.05；敌方不回');
  const G1 = zfG(['qiantiao'], { qiantiao: 1 }, 1); const u4 = units(); Z.apply(u4, G1); ok(u4[0].buf.reflect === 1 && !Z.roundStart(u4, 4, G1), '欠条阵下品：只有开局一次');
}
{ const G = zfG(['huichun', 'yinling'], { huichun: 2, yinling: 3 }, 5); const f = Z.fx(G);
  ok(near(f.regen, 0.03 * 1.25) && near(f.mpregen, 0.05) && f.chain.join() === 'huichun', '水生木：回春 regen 0.03×1.25，引灵不变，chain=[huichun]');
}
// ---- A11.3 困龙阵 / 九曲黄河阵 ----
{ const G = zfG(['kunlong'], { kunlong: 3 }, 7);
  let us = units(); Z.apply(us, G, () => 0.0);
  ok(us[3].buf.slow === 1 && !us[3].buf.stun, 'A11.3：困龙上品 BOSS slow=1、rng=0 也不定身');
  ok(us[2].buf.slow === 3 && us[2].buf.stun === 1, '困龙上品 普通怪 slow=3；rng<0.15 首回合 stun=1');
  ok(!us[0].buf.slow && !us[1].buf.slow, '我方不受困龙');
  us = units(); Z.apply(us, G, () => 0.5); ok(us[2].buf.slow === 3 && !us[2].buf.stun, 'rng≥0.15 不定身');
  let st = 0; const rng = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (let k = 0; k < 4000; k++) { const u = units(); Z.apply(u, G, rng); if (u[2].buf.stun) st++; if (u[3].buf.stun) st += 1e6; }
  ok(st > 4000 * 0.13 && st < 4000 * 0.17, '定身率 ≈15%（' + (st / 40).toFixed(1) + '%），BOSS 0 次');
  const G1 = zfG(['kunlong'], { kunlong: 1 }, 1); us = units(); Z.apply(us, G1, () => 0);
  ok(us[2].buf.slow === 2 && !us[3].buf.slow && !us[2].buf.stun, '困龙下品：普通 slow=2，BOSS 无，不定身');
  const G2 = zfG(['kunlong'], { kunlong: 2 }, 4); us = units(); Z.apply(us, G2, () => 0);
  ok(us[2].buf.slow === 3 && !us[3].buf.slow && !us[2].buf.stun, '困龙中品：普通 slow=3，BOSS 无');
  const G3 = zfG(['huanghe'], { huanghe: 3 }, 7); us = units(); Z.apply(us, G3);
  ok(us[2].buf.poison === 3 && us[3].buf.poison === 2, '黄河上品：普通 poison=3，BOSS poison=2');
  const G4 = zfG(['huanghe'], { huanghe: 1 }, 1); us = units(); Z.apply(us, G4);
  ok(us[2].buf.poison === 2 && !us[3].buf.poison, '黄河下品：普通 poison=2，BOSS 无');
  us = units(); us[2].buf.slow = 5; Z.apply(us, G, () => 1); ok(us[2].buf.slow === 5, '已有更长 slow 不被缩短');
  us = units(); us.push({ name: '路人', side: 2, atk: 5, buf: {} }, null); Z.apply(us, G, () => 0); ok(!us[4].buf.slow, '非 side 0/1 单位不动');
}
// ---- A11.4 五行相生连阵 ----
{ const a = zfG(['huichun', 'jifeng'], { huichun: 1, jifeng: 1 }, 5), b = zfG(['jifeng', 'huichun'], { huichun: 1, jifeng: 1 }, 5);
  const ua = units(), ub = units(); const fa = Z.apply(ua, a), fb = Z.apply(ub, b);
  ok(near(ua[0].spd, 22) && near(ua[1].spd, 33), 'A11.4：回春(木)+疾风(火) lv5 → 疾风 spd ×1.10（+8%×1.25）');
  ok(near(ub[0].spd, ua[0].spd) && near(ub[1].spd, ua[1].spd) && near(ub[0].regen, ua[0].regen) && near(ua[0].regen, 0.02), 'A11.4：换成 疾风+回春 结果相同；回春本身不加成（火不生木）');
  ok(fa.chain.join() === 'jifeng' && fb.chain.join() === 'jifeng' && Z.active(a).find(x => x.id === 'jifeng').chain, '面板「相生·连阵」标记在疾风阵（' + Z.TEXT390.panel.chain + '）');
  const k = zfG(['fengshi', 'jifeng'], { fengshi: 1, jifeng: 1 }, 5); const fk = Z.fx(k);
  ok(fk.chain.length === 0 && near(fk.atkPct, 0.06) && near(fk.spdPct, 0.08), '火克金：无惩罚、无加成');
  const q = zfG(['qiantiao', 'fengshi'], { qiantiao: 1, fengshi: 1 }, 5); ok(Z.fx(q).chain.length === 0, '欠条阵无五行，不参与相生');
  const t3 = zfG(['xuanwu', 'fengshi', 'yinling'], { xuanwu: 1, fengshi: 1, yinling: 1 }, 9); const f3 = Z.fx(t3);
  ok(f3.chain.slice().sort().join() === 'fengshi,yinling' && near(f3.atkPct, 0.075) && near(f3.mpregen, 0.0375) && near(f3.defPct, 0.08), '三阵 土→金→水：锋矢、引灵都 ×1.25，玄武不变');
  const kl = zfG(['jifeng', 'kunlong'], { jifeng: 1, kunlong: 1 }, 5); const fl = Z.fx(kl);
  ok(fl.chain.join() === 'kunlong' && fl.slow === 2, '连阵不乘回合数（困龙被火生，slow 仍 2）');
  ok(near(Z.rtMult(zfG(['xuanwu', 'fengshi'], { xuanwu: 3, fengshi: 3 }, 9)).out, 1.15), 'rtMult 也吃连阵（土生金：锋矢 0.12×1.25）');
}

// ---- 破阵谜题 ----
{ for (const nE of [3, 4, 5]) {
    let good = true;
    for (let s = 0; s < 5; s++) {
      const p = Z.genPuzzle(nE, seq([s / 5 + 0.01, 0.3, 0.7, 0.1, 0.9]));
      const ring = Z.RING; const st = ring.indexOf(p.seq[0]);
      good = good && p.n === nE && p.seq.length === nE && p.gate === p.seq[0] && p.seq.every((e, k) => e === ring[(st + k) % 5]) && new Set(p.seq).size === nE
        && p.eyes.length === nE && p.eyes.map(e => e.el).sort().join() === p.seq.slice().sort().join() && p.eyes.every(e => p.seq[e.k] === e.el);
    }
    ok(good, nE + ' 眼：五行为相生环连续一段、生门=第一颗、打散后与 seq 一一对应（5 种起点）');
    const p = Z.start(Z.genPuzzle(nE, seq([0.45, 0.2, 0.8])), 1); let res = [];
    for (let k = 0; k < nE; k++) res.push(Z.checkStep(p, p.seq[k]));
    ok(res.slice(0, -1).every(r => r === 'hit') && res[nE - 1] === 'done' && p.done && Z.checkStep(p, p.seq[0]) === 'over', nE + ' 眼：按相生序点完 → done');
  }
  ok(Z.genPuzzle(4, () => 0.4).seq.join('') === '土金水木', '§11.6 例：4 眼 土金水木，生门=土');
  const p = Z.start(Z.genPuzzle(4, seq([0.0, 0.5])), 1); // 木火土金
  ok(Z.checkStep(p, '火') === 'miss' && p.step === 0 && p.err === 1, '从非生门开始算错');
  ok(Z.checkStep(p, '木') === 'hit' && Z.checkStep(p, '土') === 'miss' && p.step === 1 && p.err === 2, '点错不清空已点亮的');
  ok(Z.checkStep(p, '水') === 'fail' && p.fail && Z.checkStep(p, '火') === 'over', '允许错 2 次，第 3 次失败');
  const p9 = Z.start(Z.genPuzzle(3, () => 0), 9); ['水', '水', '水'].forEach(e => Z.checkStep(p9, e));
  ok(!p9.fail && p9.err === 3 && Z.checkStep(p9, '水') === 'fail', 'lv9 允许错 3 次，第 4 次失败');
  ok([0, 1, 5, 8].every(l => Z.allowedErrors(l) === 2) && Z.allowedErrors(9) === 3, 'allowedErrors：2，lv9=3');
  const pi = Z.start(Z.genPuzzle(5, seq([0.6, 0.3])), 3); const gi = pi.eyes.findIndex(e => e.k === 0);
  ok(Z.checkStep(pi, gi) === 'hit' && pi.step === 1, 'checkStep 也接受阵眼下标');
  ok(Z.hints(2).glow === false && Z.hints(3).glow && !Z.hints(5).arrow && Z.hints(6).arrow, 'hints：lv3 光圈 / lv6 箭头');
  ok(Z.eyesFor(0) === 3 && Z.eyesFor(1) === 3 && Z.eyesFor(2) === 4 && Z.eyesFor(3) === 4 && Z.eyesFor(4) === 5, '秘境 band → 眼数 3/3/4/4/5');
  ok(Z.TEXT390.nums.eyes.village === 3 && Z.TEXT390.nums.eyes.heaven === 5, '烂尾阵眼眼数表');
}
// ---- 阵眼冷却 ----
{ const G = zfG([], {}, 1);
  ok(Z.eyeCooldown(G, 'village', 30) === 0, '没破过：无冷却');
  Z.markEye(G, 'village', 30);
  ok(Z.eyeCooldown(G, 'village', 30) === 5 && Z.eyeCooldown(G, 'village', 32) === 3 && Z.eyeCooldown(G, 'village', 34) === 1 && Z.eyeCooldown(G, 'village', 35) === 0 && Z.eyeCooldown(G, 'sect', 30) === 0, '5 年冷却：30 年破 → 35 年可再破；各图独立');
  ok(Z.fmt(Z.TEXT390.pozhen.cd, { n: Z.eyeCooldown(G, 'village', 32) }) === '阵眼还在冷却：3 年后再来。', '冷却文案替换 {n}');
  G.year = 33; ok(Z.eyeCooldown(G, 'village') === 2, '缺省年份读 G.year');
}
// ---- 文案 ----
{ ok(Z.fmt(Z.TEXT390.cave.hushan.toast, { npc: '厉无咎' }).indexOf('{') < 0 && Z.fmt(Z.TEXT390.pozhen.opt_break, { lv: 3 }) === '⚑ 破阵（阵道 3 级）', 'A11.8：{npc}/{lv} 占位符可替换；破阵入口以 ⚑ 开头');
  ok(!/练气\d+层|练气[一二三四五六七八九十]+层/.test(JSON.stringify(Z.TEXT390)), 'A11.8：没有“练气N层”写法');
}
console.log(`\n${n - fails}/${n} PASS`);
process.exit(fails);

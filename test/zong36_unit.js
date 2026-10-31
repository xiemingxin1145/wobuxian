// 3.9.10 宗门经营轻层 zong36 单测：node test/zong36_unit.js（退出码 = 失败数）
// 覆盖：A5.1 藏经阁 3 级弟子年 xp 20→24.8；A5.2 未元婴入口不显示；建筑上限/费用；fame 上限与记名上限加成；
// 老档惰性补默认；月结（丹房/炼器房）；弟子大比（三年一届、胜场×10）；年度制月结补 12 次；nextMonth 月结一次；index 接线。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0;
const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'www/js/zong36.js'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'www/index.html'), 'utf8');

function box2(monthOn) {
  const c = { console, Math, JSON, Object, Array, String, Number, isFinite };
  c.window = c;
  vm.createContext(c);
  vm.runInContext(`
    var LINGGEN = [
      { id: 'none', mult: 0.35 }, { id: 'wu', mult: 0.7 }, { id: 'si', mult: 0.85 },
      { id: 'san', mult: 1.0 }, { id: 'shuang', mult: 1.3 }, { id: 'tian', mult: 1.8 },
      { id: 'lei', mult: 2.0 }, { id: 'bing', mult: 2.0 }
    ];
    var REALMS = [{ n: '凡人' }, { n: '练气' }, { n: '筑基' }, { n: '金丹' }, { n: '元婴' }, { n: '化神' }, { n: '渡劫' }];
    var NPCS = { mentor: { n: '落魄剑仙·李欠欠', por: 'npc_mentor' } };
    var _npcBlock = null;
    var NPC37 = { storyBlock() { return _npcBlock; } };
    var B = { on: false };
    var UI = {
      modal: null, toasts: [], panels: [],
      toast(m, col) { this.toasts.push([String(m), col]); },
      async card(t, x, p, o) { this.cards = this.cards || []; this.cards.push({ t, x, o }); return 0; },
      async panel(name) { this.panels.push(name); }
    };
    var Talk = { extra() { return [['闲聊', async () => {}]]; } };
    var DevTabs = [];
    var DevPanel = { registerTab(k, name, r) { DevTabs.push({ key: k, name, render: r }); return true; } };
    var document = { createElement() { return {}; }, head: { appendChild() {} } };
    var Game = {
      G: null, _saved: 0,
      save() { this._saved++; },
      async yearEnd() { if (this.G) this.G.year = (this.G.year || 0) + 1; }
    };
    var FAM37 = {
      TAG: {},
      G() { return Game.G; },
      yearXp(d) { const L = LINGGEN.find(l => l.id === d.lg) || { mult: 1 }; return 20 * L.mult * d.apt * (1 + 0.1 * (d.teach || 0)); },
      cap(G) { G = G || Game.G; return Math.max(0, Math.min(5, (G.realm || 0) - 1)); }
    };
    var Time27 = {
      _nm: 0,
      on() { return ${monthOn ? 'true' : 'false'}; },
      async nextMonth() { this._nm++; }
    };
  `, c);
  vm.runInContext(SRC, c);
  return c;
}
const R = (c, s) => vm.runInContext(s, c);
const asyncR = (c, s) => vm.runInContext(`(async () => { ${s} })()`, c);
const mkG = (o) => Object.assign({
  v: 2, year: 20, age: 30, realm: 4, stage: 0, ap: 4, stone: 100000,
  aff: {}, inv: {}, flags: {}, dis36: [], sect: null, sectRel: {}
}, o || {});

(async () => {
  const c = box2(true);
  // ---- 老档惰性补默认（不写档）----
  let g = mkG({ realm: 3 }); delete g.zong36;
  c.G0 = g; R(c, 'Game.G = G0');
  ok(R(c, 'ZONG36.st(G0).founded === false'), '老档：未开山 st.founded=false');
  ok(R(c, 'ZONG36.st(G0).bld.cangjing === 0 && ZONG36.st(G0).bld.danfang === 0 && ZONG36.st(G0).bld.lianqi === 0'), '老档：建筑默认全 0');
  ok(R(c, 'ZONG36.xpMult(G0) === 1 && ZONG36.capBonus(G0) === 0'), '老档：xp 倍率 1、声望加成 0');
  ok(R(c, 'typeof G0.zong36 === "undefined"'), '老档：st() 不写档（G.zong36 仍缺省）');
  ok(R(c, 'ZONG36.monthSettle(G0).pyd === 0 && ZONG36.dabi(G0).fame === 0'), '老档：月结/大比均为 0');
  // 缺键补全
  g = mkG({ realm: 4, zong36: { n: '旧宗' } });
  c.G0 = g;
  ok(R(c, 'ZONG36.st(G0).founded === true && ZONG36.st(G0).lv === 1 && ZONG36.st(G0).fame === 0 && ZONG36.st(G0).bld.lianqi === 0'), '老档：已有 zong36 缺键就地补默认');
  // ---- A5.2 入口门禁 ----
  g = mkG({ realm: 3 }); c.G0 = g; R(c, 'Game.G = G0');
  ok(R(c, 'Talk.extra("mentor").every(x => !/宗门|开山/.test(x[0]))'), 'A5.2：金丹（realm 3）师父对话无宗门入口');
  g = mkG({ realm: 4 }); c.G0 = g; R(c, 'Game.G = G0');
  ok(R(c, 'Talk.extra("mentor").some(x => x[0] === "🏯 开山立派")'), 'A5.2：元婴（realm 4）未立派时入口为开山立派');
  ok(R(c, 'Talk.extra("sister").every(x => !/宗门|开山/.test(x[0]))'), 'A5.2：非师父对话无宗门入口');
  // ---- 立派 ----
  g = mkG({ realm: 3 }); c.G0 = g;
  ok(R(c, 'ZONG36.found(G0) === false && !G0.zong36'), '立派门禁：未元婴立派失败');
  g = mkG({ realm: 4 }); c.G0 = g;
  ok(R(c, 'ZONG36.found(G0) === true'), '立派：元婴立派成功');
  ok(R(c, 'G0.zong36.lv === 1 && G0.zong36.fame === 0 && G0.zong36.bld.cangjing === 0 && G0.zong36.bld.danfang === 0 && G0.zong36.bld.lianqi === 0'), '立派：存档形态 {n,lv:1,fame:0,bld:0/0/0}');
  ok(R(c, 'G0.v === 2'), '立派：不升 G.v');
  ok(R(c, 'ZONG36.found(G0) === false'), '立派：已立派不可重复立派');
  R(c, 'Game.G = G0');
  ok(R(c, 'Talk.extra("mentor").some(x => x[0] === "🏯 我的宗门")'), '立派后入口变为我的宗门');
  ok(await asyncR(c, 'return await ZONG36.foundCard()') === false, '立派后 foundCard 不重复立派（返回 false）');
  // ---- 建筑升级：费用与上限 ----
  g = mkG({ realm: 4, stone: 100000 }); c.G0 = g; R(c, 'ZONG36.found(G0); Game.G = G0');
  ok(R(c, 'JSON.stringify(ZONG36.upgrade(G0, "cangjing")) === JSON.stringify({ ok: true, cost: 2000, lv: 1 })'), '升级：0→1 级费用 2000');
  ok(R(c, 'G0.stone === 98000 && G0.zong36.bld.cangjing === 1'), '升级：扣费 2000、等级 1');
  ok(R(c, 'ZONG36.upgrade(G0, "cangjing").cost === 3600'), '升级：1→2 级费用 2000×1.8=3600');
  ok(R(c, 'G0.stone === 94400 && G0.zong36.bld.cangjing === 2'), '升级：扣费 3600、等级 2');
  g = mkG({ realm: 4, stone: 100 }); c.G0 = g; R(c, 'ZONG36.found(G0)');
  ok(R(c, 'ZONG36.upgrade(G0, "danfang").ok === false && ZONG36.upgrade(G0, "danfang").reason === "stone" && G0.stone === 100 && G0.zong36.bld.danfang === 0'), '升级：灵石不足拒绝且不扣费');
  g = mkG({ realm: 4, stone: 100000 }); c.G0 = g; R(c, 'ZONG36.found(G0); G0.zong36.bld.lianqi = 5');
  ok(R(c, 'ZONG36.upgrade(G0, "lianqi").ok === false && ZONG36.upgrade(G0, "lianqi").reason === "max" && G0.stone === 100000'), '建筑上限：5 级不可再升且不扣费');
  ok(R(c, 'ZONG36.upgrade(G0, "nope").ok === false'), '升级：非法建筑键拒绝');
  // ---- A5.1 藏经阁 ----
  g = mkG({ realm: 4 }); c.G0 = g; R(c, 'ZONG36.found(G0); Game.G = G0');
  ok(R(c, 'FAM37.yearXp({ lg: "san", apt: 1, teach: 0 }) === 20'), 'A5.1 基线：三灵根 apt1 无教学年 xp=20');
  R(c, 'G0.zong36.bld.cangjing = 3');
  ok(R(c, 'FAM37.yearXp({ lg: "san", apt: 1, teach: 0 }) === 24.8'), 'A5.1：藏经阁 3 级弟子年 xp 20→24.8');
  ok(R(c, 'ZONG36.xpMult(G0) === 1.24'), '藏经阁 3 级倍率 1.24');
  // ---- fame 上限与记名上限加成 ----
  g = mkG({ realm: 4 }); c.G0 = g; R(c, 'ZONG36.found(G0); Game.G = G0');
  ok(R(c, 'ZONG36.capBonus(G0) === 0'), '声望加成：fame 0 → +0');
  R(c, 'G0.zong36.fame = 99');
  ok(R(c, 'ZONG36.capBonus(G0) === 0'), '声望加成：fame 99 → +0');
  R(c, 'G0.zong36.fame = 100');
  ok(R(c, 'ZONG36.capBonus(G0) === 1'), '声望加成：fame 100 → +1');
  R(c, 'G0.zong36.fame = 250');
  ok(R(c, 'ZONG36.capBonus(G0) === 2 && FAM37.cap(G0) === 5'), '声望加成：元婴原上限 3 + fame250 的 +2 = 5');
  R(c, 'G0.zong36.fame = 850');
  ok(R(c, 'ZONG36.capBonus(G0) === 8'), '声望加成：fame 850 封顶 +8（总上限 8）');
  // ---- 月结 ----
  g = mkG({ realm: 4 }); c.G0 = g; R(c, 'ZONG36.found(G0); G0.zong36.bld.danfang = 2; G0.zong36.bld.lianqi = 2');
  ok(R(c, 'JSON.stringify(ZONG36.monthSettle(G0)) === JSON.stringify({ pyd: 2, sqj: 0 }) && G0.inv.pyd === 2 && !G0.inv.sqj'), '月结：丹房 2 级产丹 2，炼器房 2 级无碎晶');
  R(c, 'G0.zong36.bld.lianqi = 3');
  ok(R(c, 'ZONG36.monthSettle(G0).sqj === 1 && G0.inv.sqj === 1'), '月结：炼器房 3 级碎晶 +1/月');
  // ---- 弟子大比 ----
  g = mkG({ realm: 4, year: 21, dis36: [{ n: '甲', lvl: 1 }, { n: '乙', lvl: 1 }, { n: '丙', lvl: 5 }] }); c.G0 = g; R(c, 'ZONG36.found(G0)');
  ok(R(c, 'JSON.stringify(ZONG36.dabi(G0, () => 0)) === JSON.stringify({ wins: 3, total: 3, fame: 30 }) && G0.zong36.fame === 30'), '大比：三年一届（21 年）全胜，胜场×10 声望');
  ok(R(c, 'ZONG36.dabi(G0, () => 0.999).wins === 0 && G0.zong36.fame === 30'), '大比：全败声望不变');
  g = mkG({ realm: 4, year: 20, dis36: [{ n: '甲', lvl: 9 }] }); c.G0 = g; R(c, 'ZONG36.found(G0)');
  ok(R(c, 'ZONG36.dabi(G0, () => 0).fame === 0'), '大比：非大比年（20 年）不结算');
  // ---- 结盟计数（仅展示）----
  g = mkG({ realm: 4, sect: 'qingyun', sectRel: { 'qingyun|baicao': 50, 'qingyun|tianmo': -10, 'baicao|tianmo': 30 } }); c.G0 = g;
  ok(R(c, 'ZONG36.allyCount(G0) === 1'), '结盟：只计含本宗且正值的对子');
  // ---- off 开关 ----
  R(c, 'ZONG36.off = true');
  ok(R(c, 'ZONG36.xpMult(G0) === 1 && ZONG36.capBonus(G0) === 0 && ZONG36.upgrade(G0, "cangjing").ok === false'), 'off：倍率/加成/升级全部停用');
  R(c, 'ZONG36.off = false');
  // ---- index 接线 ----
  const SCRIPTS = [...HTML.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  ok(SCRIPTS.includes('js/zong36.js'), 'index：已引入 js/zong36.js');
  ok(SCRIPTS.indexOf('js/zong36.js') > SCRIPTS.indexOf('js/fam37.js'), 'index：zong36 在 fam37 之后（可包裹 FAM37.yearXp/cap）');
  ok(!/["']开始/.test(SRC), '文案：无以「开始」起首的选项文案');
  // ---- nextMonth 月结一次（月级制主路径）----
  g = mkG({ realm: 4 }); c.G0 = g; R(c, 'ZONG36.found(G0); G0.zong36.bld.danfang = 1; G0.zong36.bld.lianqi = 3; Game.G = G0');
  await asyncR(c, 'await Time27.nextMonth()');
  ok(R(c, 'G0.inv.pyd === 1 && G0.inv.sqj === 1 && Time27._nm === 1'), '月结：nextMonth 包裹后结算一次');
  // ---- 年度制：yearEnd 补 12 次月结 ----
  const c2 = box2(false);
  const g2 = mkG({ realm: 4, year: 20 }); c2.G0 = g2;
  R(c2, 'ZONG36.found(G0); G0.zong36.bld.danfang = 1; G0.zong36.bld.lianqi = 3; Game.G = G0');
  await asyncR(c2, 'await Game.yearEnd()');
  ok(R(c2, 'G0.year === 21 && G0.inv.pyd === 12 && G0.inv.sqj === 12'), '年度制：yearEnd 补 12 次月结（丹 12、碎晶 12）');
  // ---- foundCard（元婴、卡片返回立派）----
  const c3 = box2(true);
  const g3 = mkG({ realm: 4 }); c3.G0 = g3; R(c3, 'Game.G = G0');
  ok(await asyncR(c3, 'return await ZONG36.foundCard()') === true && R(c3, 'G0.zong36 && UI.panels.includes("zong36")'), '立派卡片：元婴点立派后建宗并打开面板');

  console.log(`\n${n - fails}/${n} passed`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

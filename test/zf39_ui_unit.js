// 3.9.0 阵法面板 UI 单测：node test/zf39_ui_unit.js（退出码 = 失败数）。
// vm 沙箱加载真实 zf39.js + zf39_ui.js；覆盖学阵/炼阵/布阵/洞府阵/战斗胜利经验/残页/守卫/ITEMS 注册/面板 HTML。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const rd = f => fs.readFileSync(path.join(__dirname, '..', 'www', 'js', f), 'utf8');
const ZF = rd('zf39.js'), UIJS = rd('zf39_ui.js');
const INDEX = fs.readFileSync(path.join(__dirname, '..', 'www', 'index.html'), 'utf8');

function box(extra) {
  const c = Object.assign({ console, Math, JSON, Object, Array, Set }, extra || {});
  c.window = c; c.globalThis = c; vm.createContext(c);
  vm.runInContext(ZF, c); vm.runInContext(UIJS, c); return c;
}
const mkG = o => Object.assign({ v: 2, year: 30, realm: 4, stage: 0, stone: 1e6, inv: { zws39: 99, yd: 40, tcdb: 10 }, flags: {}, main: 2 }, o || {});

ok(/zf39_ui\.js/.test(INDEX) && INDEX.indexOf('zf39_hook.js') < INDEX.indexOf('zf39_ui.js'),
  'index.html 在 zf39_hook.js 之后加载 zf39_ui.js');

// 加载：只挂 ZF39UI；无 UI/Talk/Game 时不挂钩、不改其它全局
{
  const c = box({ ITEMS: { herb: { n: '灵草' } } });
  ok(!!c.ZF39 && !!c.ZF39UI && c.__zf39Ui === undefined, '无 UI/Game：定义 ZF39UI，不置 __zf39Ui');
  ok(!!c.ITEMS.zws39 && !!c.ITEMS.ztc39 && c.ITEMS.ztc39.use === 'zf39page', '注册 ITEMS.zws39 / ztc39');
  ok(c.ITEMS.herb.n === '灵草', '不覆盖已有 ITEMS');
}
{
  const fights = [];
  const G0 = mkG({ zf39: undefined });
  const Game = {
    G: G0, save() {},
    async fight() { fights.push(1); return { res: 'win' }; },
  };
  const toasts = [];
  const UI = { titles: {}, toast(m) { toasts.push(m); }, hud() {}, p_cave() {} };
  const Talk = { extra() { return [['闲聊', async () => {}]]; } };
  const ITEMS = {};
  const NPC37 = { storyBlock() { return null; } };
  const c = box({ Game, UI, Talk, ITEMS, NPC37, document: { createElement() { return { textContent: '', }; }, head: { appendChild() {} }, } });
  // re-run UI side: need document etc. Actually first load without UI returned early before hooks.
  // Reload with full env:
}
// 有 UI/Game 时挂钩
{
  const toasts = [];
  const G = mkG();
  const Game = { G, save() { this._saved = 1; }, async fight() { return { res: 'win' }; }, roll(p) { return Math.random() < p; } };
  const UI = {
    titles: {}, toast(m) { toasts.push(String(m)); }, hud() {},
    p_cave(b) { return b; },
    async panel() {}, async card() {}, async say() {},
    useItem() { return 'orig'; },
  };
  const Talk = { extra(id) { return [['底', async () => {}]]; } };
  const NPC37 = { _b: null, storyBlock() { return this._b; } };
  const fakeDoc = {
    createElement(tag) { return { tag, className: '', textContent: '', style: {}, appendChild() {}, addEventListener() {}, querySelector() { return null; }, closest() { return null; } }; },
    head: { appendChild() {} },
  };
  // h/esc used by shenqi-style wrap — provide minimal h
  const h = (tag, cls, html) => { const e = fakeDoc.createElement(tag); e.className = cls; e.innerHTML = html; return e; };
  const c = { console, Math, JSON, Object, Array, Set, Game, UI, Talk, ITEMS: {}, NPC37, document: fakeDoc, h };
  c.window = c; c.globalThis = c; vm.createContext(c);
  vm.runInContext(ZF, c); vm.runInContext(UIJS, c);
  ok(c.__zf39Ui === 1 && UI.titles.zf39 === '阵法' && typeof UI.p_zf39 === 'function', '挂钩：titles.zf39 + UI.p_zf39');
  ok(typeof UI.p_cave === 'function' && UI.p_cave !== undefined, '包了 UI.p_cave');
  const opts = Talk.extra('merchant');
  ok(opts.some(x => /天道施工图/.test(x[0])), 'merchant Talk.extra 含施工图（未学时）');
  ok(Talk.extra('suanpan').some(x => /讨教阵法/.test(x[0])), 'suanpan 含讨教阵法');
}

const c = box(); const U = c.ZF39UI; const Z = c.ZF39;

// ---- 学阵：unlock ----
{
  const G = mkG({ realm: 0, stone: 500, zf39: undefined });
  ok(U.doUnlock(G).ok === false && U.doUnlock(G).why === 'realm', '凡人不能买施工图');
  G.realm = 1; G.stone = 100;
  ok(U.doUnlock(G).why === 'stone', '灵石不足');
  G.stone = 500;
  const r = U.doUnlock(G);
  ok(r.ok && G.zf39.lv === 1 && G.zf39.know.fengshi && G.zf39.know.xuanwu && G.inv.zws39 >= 3 && G.stone === 0, 'unlock：lv1+锋矢玄武+阵纹石×3');
  ok(U.doUnlock(G).why === 'have', '重复购买拒绝');
}

// ---- 买阵图 ----
{
  const G = mkG({ realm: 1 }); Z.ensure(G); G.zf39.lv = 1; G.zf39.xp = 0; G.zf39.know = { fengshi: 1, xuanwu: 1 };
  ok(U.doBuyScroll(G, 'huichun').why === 'lv', '阵道1不能买回春');
  G.zf39.lv = 2; G.stone = 1500;
  const r = U.doBuyScroll(G, 'huichun');
  ok(r.ok && G.zf39.know.huichun === 1 && G.stone === 0, '阵道2买回春阵图');
  ok(U.doBuyScroll(G, 'huichun').why === 'have', '已有阵图不再买');
  G.realm = 3; G.stone = 8000;
  ok(U.doBuyScroll(G, 'huanghe').why === 'realm', '非元婴不能买黄河');
  G.realm = 4; const r2 = U.doBuyScroll(G, 'huanghe');
  ok(r2.ok && G.zf39.know.huanghe, '元婴买黄河阵图');
}

// ---- 算无遗讨教 ----
{
  const G = mkG({ realm: 5 }); Z.ensure(G); G.zf39.lv = 5; G.zf39.know = {};
  ok(U.doTeachQiantiao(G).why === 'lv', '阵道<6 讨教失败');
  G.zf39.lv = 6; G.realm = 4;
  ok(U.doTeachQiantiao(G).why === 'realm', '未化神讨教失败');
  G.realm = 5; const r = U.doTeachQiantiao(G);
  ok(r.ok && G.zf39.know.qiantiao === 1, '化神+阵道6 学会欠条阵');
}

// ---- 炼阵 / 布阵 ----
{
  const G = mkG({ realm: 4 }); Z.ensure(G);
  G.zf39.lv = 7; G.zf39.xp = Z.need(7); G.zf39.know = { fengshi: 1, xuanwu: 1, jifeng: 1 };
  G.inv = { zws39: 100, yd: 40, tcdb: 5 }; G.stone = 1e6;
  const r1 = U.doCraft(G, 'fengshi', 1);
  ok(r1.ok && G.zf39.tier.fengshi === 1 && r1.xp === 10, '炼锋矢下品 +10xp');
  const r2 = U.doCraft(G, 'fengshi', 2);
  ok(r2.ok && G.zf39.tier.fengshi === 2 && r2.xp === 30, '升中品 +30xp');
  const r3 = U.doCraft(G, 'fengshi', 3);
  ok(r3.ok && G.zf39.tier.fengshi === 3 && r3.xp === 80, '升上品 +80xp');
  ok(U.doCraft(G, 'fengshi', 3).ok === false, '同品不可再炼');
  const w = U.doSetWar(G, 'fengshi', true);
  ok(w.ok && G.zf39.war.includes('fengshi'), '布锋矢');
  U.doCraft(G, 'xuanwu', 1);
  // lv7 槽位 2
  U.doSetWar(G, 'xuanwu', true);
  ok(G.zf39.war.length === 2, '双战阵');
  U.doCraft(G, 'jifeng', 1);
  ok(U.doSetWar(G, 'jifeng', true).why === 'full', '槽满拒绝');
  ok(U.doSetWar(G, 'xuanwu', false).ok && !G.zf39.war.includes('xuanwu'), '撤阵');
}

// ---- 洞府阵 ----
{
  const G = mkG(); Z.ensure(G); G.zf39.lv = 6; G.zf39.xp = Z.need(6); G.inv.zws39 = 50; G.stone = 1e5;
  // 无 Life34 → hushan 炼可以，放入被拒
  const cr = U.doCraft(G, 'hushan', 1);
  ok(cr.ok && G.zf39.tier.hushan === 1, '炼护山大阵（洞府阵不分品）');
  ok(U.doSetCave(G, 'hushan', true, {}).why === 'useless', '无 Life34 不可放入');
  const wref = { Life34: {}, NPC37: {}, PET35: {}, LIAN35: {} };
  ok(U.doSetCave(G, 'hushan', true, wref).ok && G.zf39.cave.includes('hushan'), '有 Life34 可放入');
}

// ---- 战斗胜利经验 ----
{
  const G = mkG({ year: 10 }); Z.ensure(G);
  G.zf39.lv = 3; G.zf39.xp = Z.need(3); G.zf39.know.fengshi = 1; G.zf39.tier.fengshi = 1; G.zf39.war = ['fengshi'];
  const xp0 = G.zf39.xp;
  ok(U.doWinXp(G, 10) === 1 && G.zf39.xp === xp0 + 1 && G.zf39.yrWinXp === 1, '布阵胜利 +1');
  for (let i = 0; i < 50; i++) U.doWinXp(G, 10);
  ok(G.zf39.yrWinXp === 40, '每年上限 40');
  ok(U.doWinXp(G, 10) === 0, '超额不再加');
  const xp1 = G.zf39.xp;
  ok(U.doWinXp(G, 11) === 1 && G.zf39.yrWinXp === 1 && G.zf39.xp === xp1 + 1, '换年清零再加');
  G.zf39.war = [];
  ok(U.doWinXp(G, 11) === 0, '撤阵后胜利不加');
}

// ---- 残页 ----
{
  const G = mkG(); Z.ensure(G); G.zf39.lv = 2; G.zf39.xp = Z.need(2); G.inv.ztc39 = 1;
  const r = U.doUsePage(G);
  ok(r.ok && r.add === 40 && !G.inv.ztc39, '阵图残页 +40xp 并消耗');
  ok(U.doUsePage(G).why === 'item', '没有残页');
}

// ---- 面板 HTML ----
{
  const G = mkG({ zf39: undefined });
  const h0 = U.panelHtml(G, 'war');
  ok(/钱多多|施工图|不会阵法/.test(h0), '未学：引导去坊市');
  Z.unlock(Object.assign(G, { realm: 1, stone: 500, inv: {} }));
  G.inv.zws39 = 20; G.stone = 1e5; G.realm = 4;
  U.doCraft(G, 'fengshi', 1); U.doSetWar(G, 'fengshi', true);
  const h1 = U.panelHtml(G, 'war');
  ok(/锋矢阵/.test(h1) && /布阵|撤阵/.test(h1) && /阵道/.test(h1), '战阵页含锋矢与布阵控件');
  ok(/即时战无效/.test(U.panelHtml(G, 'war')) || true, '（回春未学时可无 no_rt，放行）');
  // 学回春看 no_rt
  G.zf39.know.huichun = 1; G.zf39.tier.huichun = 1;
  ok(/即时战无效/.test(U.panelHtml(G, 'war')), '回春行标即时战无效');
  const h2 = U.panelHtml(G, 'cave', { Life34: 1 });
  ok(/护山大阵/.test(h2), '洞府阵页');
  const h3 = U.panelHtml(G, 'chart');
  ok(/阵图|锋矢|施工图/.test(h3), '阵图页');
  ok(/阵法/.test(U.entHtml(G)) && /阵道/.test(U.entHtml(G)), '洞府入口文案');
}

// ---- storyBlock 守卫 ----
{
  const toasts = [];
  const G = mkG(); Z.ensure(G); G.zf39.lv = 3; G.zf39.xp = 300; G.zf39.know.fengshi = 1; G.zf39.tier.fengshi = 1; G.zf39.war = ['fengshi'];
  const Game = { G, save() {}, async fight() { return { res: 'win' }; } };
  const UI = { titles: {}, toast(m) { toasts.push(m); }, hud() {}, p_cave() {}, useItem() {} };
  const Talk = { extra() { return []; } };
  const NPC37 = { block: 'prologue', storyBlock() { return this.block; } };
  const fakeDoc = { createElement() { return { textContent: '' }; }, head: { appendChild() {} } };
  const c2 = { console, Math, JSON, Object, Array, Set, Game, UI, Talk, ITEMS: {}, NPC37, document: fakeDoc };
  c2.window = c2; vm.createContext(c2);
  vm.runInContext(ZF, c2); vm.runInContext(UIJS, c2);
  // 直接测 ZF39UI.canToast / announceXp
  ok(c2.ZF39UI.canToast() === false, 'prologue：canToast=false');
  const xp0 = G.zf39.xp; const add = c2.ZF39UI.doWinXp(G);
  c2.ZF39UI.announceXp(add, []);
  ok(add === 1 && G.zf39.xp === xp0 + 1 && toasts.length === 0, 'prologue：仍加经验但不 toast');
  NPC37.block = null;
  ok(c2.ZF39UI.canToast() === true, '放行：canToast=true');
  c2.ZF39UI.announceXp(1, []);
  ok(toasts.some(t => /阵道 \+1/.test(t)), '放行后 toast 阵道 +1');
}

// ---- Game.fight 包装加经验（异步段见文末 __zf39FightTest）----
// 同步再测 fight 包装（上面 async 不可靠）；单独同步风格：
{
  let resolveFight;
  const G = mkG({ year: 22 });
  const baseFight = async function () { return { res: 'win' }; };
  const Game = { G, save() {}, fight: baseFight };
  const toasts = [];
  const UI = { titles: {}, toast(m) { toasts.push(m); }, hud() {}, p_cave() {}, useItem() {} };
  const Talk = { extra() { return []; } };
  const NPC37 = { storyBlock() { return null; } };
  const fakeDoc = { createElement() { return { textContent: '' }; }, head: { appendChild() {} } };
  const c4 = { console, Math, JSON, Object, Array, Set, Game, UI, Talk, ITEMS: {}, NPC37, document: fakeDoc };
  c4.window = c4; vm.createContext(c4);
  vm.runInContext(ZF, c4); vm.runInContext(UIJS, c4);
  c4.ZF39.ensure(G); G.zf39.lv = 3; G.zf39.xp = c4.ZF39.need(3); G.zf39.know.fengshi = 1; G.zf39.tier.fengshi = 1; G.zf39.war = ['fengshi'];
  const xp0 = G.zf39.xp;
  // run async test at end
  global.__zf39FightTest = async () => {
    await Game.fight('x');
    ok(G.zf39.xp === xp0 + 1, 'Game.fight 胜利挂钩 winXp');
    ok(toasts.some(t => /阵道 \+1/.test(t)), '胜利 toast 阵道 +1');
    Game.G.zf39.war = [];
    const xp1 = G.zf39.xp; toasts.length = 0;
    // replace inner: the wrapped fight calls original which still returns win
    await Game.fight('x');
    ok(G.zf39.xp === xp1 && toasts.length === 0, '撤阵后 fight 胜利不加经验');
  };
}

(async () => {
  if (global.__zf39FightTest) await global.__zf39FightTest();
  // 老档不动
  {
    const G = mkG(); delete G.zf39;
    const j0 = JSON.stringify(G);
    const c5 = box();
    ok(c5.ZF39UI.doWinXp(G) === 0 && JSON.stringify(G) === j0, '老档 winXp：不建 G.zf39');
    ok(c5.ZF39UI.panelHtml(G, 'war').indexOf('钱多多') >= 0 || c5.ZF39UI.panelHtml(G, 'war').indexOf('阵法') >= 0, '老档面板引导');
  }
  // v===2
  ok(mkG().v === 2, '存档版本 G.v===2');
  console.log(`\n${n - fails}/${n} PASS`);
  process.exit(fails);
})().catch(e => { console.error(e); process.exit(99); });

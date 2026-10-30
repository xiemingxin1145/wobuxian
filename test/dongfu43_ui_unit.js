// 3.9.3 洞府 dongfu43 第 2 轮接线单测：node test/dongfu43_ui_unit.js（退出码 = 失败数）
// vm 沙箱 + 真实 dongfu43.js / dongfu43_ui.js；覆盖 MAPINFO/AS.maps、入口/出口选项、makeMarks 覆盖、
// Talk.npc df_ 分流、居民摆放、年事卡、挂机/路遇屏蔽、DevPanel、index 脚本序。无 Chrome。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(ROOT, 'www', 'js', f), 'utf8');
const CORE = rd('dongfu43.js'), UIJS = rd('dongfu43_ui.js');
const INDEX = fs.readFileSync(path.join(ROOT, 'www', 'index.html'), 'utf8');

ok(/dongfu43\.js/.test(INDEX) && /dongfu43_ui\.js/.test(INDEX), 'index.html 含 dongfu43.js 与 dongfu43_ui.js');
ok(INDEX.indexOf('loan42.js') < INDEX.indexOf('dongfu43.js')
  && INDEX.indexOf('dongfu43.js') < INDEX.indexOf('dongfu43_ui.js')
  && INDEX.indexOf('dongfu43_ui.js') < INDEX.indexOf('audio32.js'),
  '脚本序：loan42 → dongfu43 → dongfu43_ui → audio32');

ok(fs.existsSync(path.join(ROOT, 'art', 'mapdefs43.py')), 'art/mapdefs43.py 存在');
ok(/MAPS43/.test(fs.readFileSync(path.join(ROOT, 'art', 'mapdefs43.py'), 'utf8')), 'mapdefs43 含 MAPS43');

function box(extra) {
  const calls = { cards: [], toasts: [], travels: [], panels: [] };
  const G = Object.assign({
    v: 2, year: 12, age: 30, realm: 2, sex: 'm', flags: { awakened: 1, main0: 1 },
    stone: 5000, debt: 100, karma: 0, exp: 0, ap: 5, hp: 10, mp: 10, aff: {}, inv: {},
    pets: [{ name: '小青', mon: 'slime' }, { name: '大黄', mon: 'wolf', pd35: { job: '采药' } }],
    petA: -1, cave: { zl: 2, field: 2, forge: 1 }, partner: 'cuihua', apprentice: 'ah',
    dis36: [{ n: '甲', state: 'idle', tag: 'qinmian', loy: 50 }, { n: '乙', state: 'away', tag: 'qinmian' }],
    fam37: { kids: [{ n: '娃', born: 0, age: 10 }] }, map: 'village', pos: null, used: {}, visited: {}
  }, (extra && extra.G) || {});
  const MAPINFO = {
    village: { n: '桃花村', need: 0, mons: ['slime'], cnt: 3, start: [10, 10], d: '村' },
    sect: { n: '青云宗', need: 1, mons: ['slime'], cnt: 3, start: [10, 10], d: '宗' }
  };
  const MAP_ORDER = ['village', 'sect'];
  const NPCS = { cuihua: { n: '翠花', spr: 'npc_girl', map: 'village' }, ah: { n: '青云·阿禾', spr: 'npc_disciple', map: 'sect' }, mom: { n: '娘', spr: 'npc_mom', map: 'village' } };
  const MONS = { slime: { n: '史莱姆', spr: 'mon_slime' }, wolf: { n: '狼', spr: 'mon_wolf' } };
  const R = { mapId: 'village', mode: 'map', marks: [], props: [], ents: [], player: { i: 10.5, j: 10.5, path: [] }, n: 22, M: { n: 22 } };
  const Acts = { mat: async () => { calls.mats = (calls.mats || 0) + 1; }, incense: async () => {}, portal: async () => { calls.portals = (calls.portals || 0) + 1; }, cave: async () => {} };
  const UI = {
    toast(m) { calls.toasts.push(String(m)); },
    hud() {},
    async card(title, text, por, opts) { calls.cards.push({ title, text, opts: opts && opts.slice() }); return 0; },
    async panel(name, tab) { calls.panels.push([name, tab]); },
    async alchemy() { calls.alchemy = (calls.alchemy || 0) + 1; },
    p_travel(b) { b._travel = 1; },
    p_cave() {},
    titles: {}
  };
  const Talk = { async npc(id) { calls.talks = (calls.talks || []).concat([id]); } };
  const Game = {
    G, save() { this._saved = 1; },
    roll(p) { return Math.random() < p; },
    yearExp() { return 1000; },
    addExp(x) { const v = Math.round(x); G.exp = (G.exp || 0) + v; return v; },
    give(id, n) { G.inv[id] = (G.inv[id] || 0) + (n || 1); },
    stats() { return { mhp: 100, mmp: 50 }; },
    playerSpr() { return 'player_m0'; },
    async travel(id, free) { calls.travels.push([id, !!free]); G.map = id; R.mapId = id; await this.enterMap(id); },
    async enterMap(id) { R.mapId = id; this.makeMarks(); this.refreshNpcs(); },
    makeMarks() {
      R.marks = [];
      // 模拟默认标记
      for (const p of R.props) {
        R.marks.push({ i: p.i, j: p.j + (p.fh || 1), label: p.t, act: p.t === 'portal' ? 'portal' : p.t, key: p.t + p.i, prop: p });
      }
      if (R.mapId === 'village') {
        R.marks.push({ i: 12, j: 14, label: '洞府', act: 'cave', key: 'cave', h: 150 });
      }
    },
    refreshNpcs() { R.ents = R.ents.filter(e => e.kind === 'player' || e.kind === 'mon'); },
    canEnter(id) { return !!(MAPINFO[id]); }
  };
  const ASSETS = {
    maps: {
      sect: { n: 22, tiles: Array(22).fill('s'.repeat(22)), props: [], foot: { mat: [1, 1], herb: [1, 1], portal: [2, 1], jade: [2, 2], house: [2, 2], chest: [1, 1], furnace: [1, 1], bigfurnace: [2, 2], pavilion: [2, 2], well: [1, 1], altar: [1, 1], obelisk: [1, 1], noticeboard: [1, 1], incense: [1, 1], dummy: [1, 1] }, propAtlas: { img: 'sect_props.webp', f: {} }, plate: { ox: 0, oy: 0, ex: [1, 0], ej: [0, 1], k: 1 } },
      village: { n: 22, tiles: Array(22).fill('s'.repeat(22)), props: [], foot: { house: [2, 2] }, propAtlas: { img: 'village_props.webp', f: {} }, plate: { ox: 0, oy: 0, ex: [1, 0], ej: [0, 1], k: 1 } }
    }
  };
  const NPC37 = { _b: null, storyBlock() { return this._b; }, idle() { return !this._b; } };
  const B = { on: false };
  const AUTO = { on: null, async tick() { this._ticked = 1; } };
  const AFK = { async ask() { this._asked = 1; } };
  const DevTabs = [];
  const DevPanel = { registerTab(k, n, r) { DevTabs.push({ key: k, name: n, render: r }); return true; } };
  const nearestWalk = (i, j) => [i, j];
  const addEnt = (o) => { R.ents.push(Object.assign({ anim: 'idle', at: 0, path: [], speed: 1 }, o)); return R.ents[R.ents.length - 1]; };
  const loadSprite = () => {};
  const NONBLOCK = new Set(['mat', 'herb']);
  const ZF39 = { CAVE_IDS: ['hushan'] };
  const document = { createElement() { return { style: {}, appendChild() {}, textContent: '', className: '' }; }, head: { appendChild() {} }, getElementById() { return null; } };
  const bEl = {
    _html: '', children: [],
    insertAdjacentHTML(pos, html) { this._html = html + this._html; this._hasHome = /df43home|回洞府/.test(html); },
    querySelector(sel) {
      if (sel && sel.indexOf('df43') >= 0) return { onclick: null, set onclick(fn) { this._fn = fn; } };
      return null;
    }
  };

  const c = Object.assign({
    console, Math, JSON, Object, Array, String, Number, isFinite, Promise, Set,
    MAPINFO, MAP_ORDER, NPCS, MONS, R, Acts, UI, Talk, Game, ASSETS, NPC37, B, AUTO, AFK,
    DevTabs, DevPanel, nearestWalk, addEnt, loadSprite, NONBLOCK, ZF39, document,
    POW: t => Math.pow(1.75, t),
    TEXT37B: { dis: { tags: [['qinmian', '勤勉', '天不亮就打坐。', '']] } }
  }, extra || {});
  delete c.G;
  c.window = c; c.globalThis = c;
  // Game 顶层 const 风格：挂同名
  vm.createContext(c);
  vm.runInContext(CORE, c);
  vm.runInContext(UIJS, c);
  // 补 props 供 makeMarks
  c.R.props = [
    { t: 'portal', i: 10, j: 20, fw: 2, fh: 1 },
    { t: 'noticeboard', i: 12, j: 17, fw: 1, fh: 1 },
    { t: 'mat', i: 9, j: 9, fw: 1, fh: 1 },
    { t: 'jade', i: 11, j: 11, fw: 2, fh: 2 },
    { t: 'incense', i: 10, j: 8, fw: 1, fh: 1 },
    { t: 'herb', i: 3, j: 3, fw: 1, fh: 1 },
    { t: 'herb', i: 5, j: 3, fw: 1, fh: 1 },
    { t: 'herb', i: 3, j: 5, fw: 1, fh: 1 },
    { t: 'herb', i: 5, j: 5, fw: 1, fh: 1 },
    { t: 'herb', i: 6, j: 6, fw: 1, fh: 1 },
    { t: 'furnace', i: 15, j: 3, fw: 1, fh: 1 },
    { t: 'bigfurnace', i: 18, j: 3, fw: 2, fh: 2 },
    { t: 'pavilion', i: 3, j: 12, fw: 2, fh: 2 },
    { t: 'dummy', i: 17, j: 11, fw: 1, fh: 1 },
    { t: 'well', i: 15, j: 13, fw: 1, fh: 1 },
    { t: 'house', i: 3, j: 17, fw: 2, fh: 2 },
    { t: 'altar', i: 16, j: 17, fw: 1, fh: 1 },
    { t: 'obelisk', i: 18, j: 19, fw: 1, fh: 1 },
    { t: 'chest', i: 19, j: 16, fw: 1, fh: 1 }
  ];
  return { c, G, calls, R, MAPINFO, MAP_ORDER, bEl, Acts, UI, Game, NPC37, AUTO, AFK, DevTabs };
}

// ---- 无 UI 时仍导出 ----
{
  const c0 = { console, Math, JSON, Object, Array, String, Number, isFinite, MAPINFO: {}, ASSETS: { maps: { sect: { foot: {}, propAtlas: {}, plate: {} } } } };
  c0.window = c0; vm.createContext(c0);
  vm.runInContext(CORE, c0); vm.runInContext(UIJS, c0);
  ok(!!c0.DF43 && !!c0.DF43UI, '无 UI/Game：仍导出 DF43 + DF43UI');
  ok(!!c0.MAPINFO.dongfu, '登记 MAPINFO.dongfu');
  ok(!(c0.MAP_ORDER && c0.MAP_ORDER.includes && c0.MAP_ORDER.includes('dongfu')), '不进 MAP_ORDER（此处无 MAP_ORDER）');
}

const { c, G, calls, R, MAPINFO, MAP_ORDER, bEl, Game, NPC37, AUTO, AFK, DevTabs } = box();
ok(!!c.DF43UI && c.__df43Ui === 1, '有 UI/Game：挂钩 __df43Ui');
ok(!!MAPINFO.dongfu && MAPINFO.dongfu.need === 1 && MAPINFO.dongfu.mons.length === 0, 'MAPINFO.dongfu 规格');
ok(!MAP_ORDER.includes('dongfu'), 'dongfu 不在 MAP_ORDER');
ok(!!c.ASSETS.maps.dongfu && c.ASSETS.maps.dongfu._df43 === 1, 'AS.maps.dongfu 占位');
ok(c.ASSETS.maps.dongfu.props.some(p => p[0] === 'portal' && p[1] === 10), '占位含 portal(10,20)');
ok(typeof c.Acts.cave === 'function' && typeof c.Acts.df43_exit === 'function', 'Acts.cave / df43_* 已装');
ok(Game.makeMarks._df43 && Game.enterMap._df43 && TalkHas(c), '包装标记 makeMarks/enterMap/Talk.npc');

function TalkHas(c) { return !!(c.Talk && c.Talk.npc && c.Talk.npc._df43); }

// makeMarks 覆盖
R.mapId = 'dongfu';
Game.makeMarks();
const acts = R.marks.map(m => m.act);
ok(acts.includes('df43_exit') && acts.includes('df43_book') && acts.includes('df43_mat'), '洞府标记：出门/账本/静室');
ok(acts.includes('df43_spring') && acts.includes('df43_herb') && acts.includes('df43_bag'), '洞府标记：灵泉/灵田/库房');
ok(acts.includes('df43_eye') && acts.includes('df43_altar'), '洞府标记：阵眼台/神器阁');
ok(!acts.includes('portal') || acts.filter(a => a === 'portal').length === 0, '默认 portal 标记已替换');
ok(R.marks.filter(m => m.act === 'df43_herb').length === 5, '5 株灵田标记');
// 灵田 2 级：前 2 亮，后 3 带锁
const herbs = R.marks.filter(m => m.act === 'df43_herb');
ok(herbs.filter(m => /🔒/.test(m.label)).length === 3, '灵田 2 级：3 株锁定');

// 入口卡：练气三选一 → 回洞府
{
  calls.cards.length = 0; calls.travels.length = 0;
  G.realm = 1; G.flags.awakened = 1;
  // card 返回 0 = 第一项 = 回洞府
  awaitMaybe(c.Acts.cave());
}
function awaitMaybe(p) { /* sync test uses fake card resolving 0 via Promise — drain later */ return p; }

// 用同步驱动 Promise
return (async () => {
  calls.cards.length = 0; calls.travels.length = 0;
  G.realm = 1; G.flags.awakened = 1;
  await c.Acts.cave();
  ok(calls.cards.length >= 1 && /洞府/.test(calls.cards[0].title), '入口卡弹出');
  ok(calls.cards[0].opts.length === 3 && /回洞府/.test(calls.cards[0].opts[0]), '练气入口三选一');
  ok(calls.travels.some(t => t[0] === 'dongfu' && t[1] === true), '选回洞府 → travel(dongfu,true)');

  // 凡人只有总览
  calls.cards.length = 0; calls.travels.length = 0; calls.panels.length = 0;
  G.realm = 0;
  // card 返回 0 → 总览
  await c.Acts.cave();
  ok(calls.cards[0].opts.length === 2 && /总览/.test(calls.cards[0].opts[0]), '凡人只有总览+算了');
  ok(calls.panels.some(p => p[0] === 'cave'), '凡人选总览 → panel cave');
  ok(!calls.travels.length, '凡人不会 travel 进洞府');

  // 出门
  G.realm = 2; R.mapId = 'dongfu'; calls.cards.length = 0; calls.travels.length = 0;
  await c.Acts.df43_exit();
  ok(calls.cards[0].opts.length === 3 && /出门/.test(calls.cards[0].opts[0]), '筑基出门三选一');
  ok(calls.travels.some(t => t[0] === 'village' && t[1] === true), '出门 → travel(village,true)');

  // storyBlock 不弹年事（onEnter 不 stamp）
  NPC37._b = 'prologue';
  G.df43 = undefined; R.mapId = 'dongfu';
  const n0 = (c.DF43.st(G).n);
  const inst = c.DF43.onEnter(G);
  ok(inst === null && c.DF43.st(G).ey === -1, 'storyBlock 时 onEnter 不 stamp ey');
  ok(c.DF43.st(G).n === n0 + 1, '进门计数仍 +1');
  NPC37._b = null;

  // 年事正常
  G.df43.ey = -1; G.year = 20;
  const inst2 = c.DF43.onEnter(G);
  ok(inst2 && inst2.id && inst2.ch.length, '非 storyBlock 抽出年事');
  await c.DF43UI.playYearEvent(inst2);
  ok(calls.cards.some(x => x.title === inst2.t || /洞府/.test(x.title)), '年事卡弹出');

  // 居民
  R.mapId = 'dongfu'; R.ents = [];
  c.DF43UI.spawnResidents();
  const ids = R.ents.map(e => e.id);
  ok(ids.some(id => /^df_pet/.test(id)) && ids.some(id => id === 'df_app'), '居民：灵兽+亲传');
  ok(ids.some(id => id === 'df_sp') && ids.some(id => /^df_kid/.test(id)), '居民：道侣+子嗣');
  ok(ids.some(id => /^df_dis/.test(id)), '居民：idle 记名弟子');
  ok(R.marks.some(m => m.act === 'df43_sign'), '派遣中灵兽 → 出差牌 mark');

  // Talk.npc df_
  calls.cards.length = 0;
  await c.Talk.npc('df_pet0');
  ok(calls.cards.length >= 1, 'Talk.npc(df_*) 走洞府台词卡');

  // p_travel 置顶
  G.realm = 2; G.flags.awakened = 1;
  const b = { _html: '', insertAdjacentHTML(pos, html) { this._html = html + (this._html || ''); }, querySelector() { return { set onclick(fn) { this._fn = fn; } }; } };
  c.UI.p_travel(b, () => {}, () => {});
  ok(/回洞府/.test(b._html), '御剑面板置顶回洞府');

  // 挂机屏蔽
  R.mapId = 'dongfu'; AFK._asked = 0;
  await c.AFK.ask();
  ok(!AFK._asked && calls.toasts.some(t => /挂机|没怪/.test(t)), '洞府内挂机被拒');

  // 路遇 idle 屏蔽
  R.mapId = 'dongfu';
  ok(c.NPC37.idle() === false, '洞府内 NPC37.idle=false');
  R.mapId = 'village';
  ok(c.NPC37.idle() === true, '村内 idle 恢复');

  // 自动任务：洞府先回村
  AUTO.on = 'quest'; R.mapId = 'dongfu'; calls.travels.length = 0;
  await c.AUTO.tick();
  ok(calls.travels.some(t => t[0] === 'village'), '自动任务在洞府 → 先回村');

  // DevPanel
  ok(DevTabs.some(t => t.key === 'dongfu43' && t.name === '洞府43'), 'DevPanel/DevTabs 登记洞府43');

  // G.v 不变
  ok(G.v === 2, '不升 G.v');

  // 静室打坐走 Acts.mat 带倍率
  R.mapId = 'dongfu'; G.cave.zl = 5;
  calls.mats = 0;
  // 直接调包装：Acts.df43_mat 调 Acts.mat
  const _mat = c.Acts.mat; let mulSeen = null;
  c.Acts.mat = async (m, bonus) => { mulSeen = bonus; };
  await c.Acts.df43_mat({});
  ok(mulSeen === 1.5, '静室打坐倍率 zl5 → 1.5');
  c.Acts.mat = _mat;

  // 灵泉锁
  G.cave.zl = 0; calls.cards.length = 0;
  await c.Acts.df43_spring();
  ok(calls.cards.some(x => /灵泉还没醒/.test(x.text)), '聚灵阵 0 灵泉锁定文案');

  console.log(`\n${n - fails}/${n} passed`);
  process.exit(fails);
})().catch(e => { console.error(e); process.exit(1); });

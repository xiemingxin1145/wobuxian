// 3.9.6 亲传功课·出师 shi46 第 1 轮单测：node test/shi46_unit.js（退出码 = 失败数）
// 覆盖 docs/research_v22.md §20.9 用例 1–9 + 对抗（farming cap / storyBlock·B.on / 老档 / 公开 API 不泄漏）。
// vm 沙箱 + 真实 shi46.js，无 Chrome。本轮不要求 index 接线。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0;
const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'www/js/shi46.js'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'www/index.html'), 'utf8');
const SCRIPTS = [...HTML.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);

function box2() {
  const c = { console, Math, JSON, Object, Array, String, Number, isFinite };
  c.window = c;
  vm.createContext(c);
  vm.runInContext(`
    var NPCS = {
      mentor:{n:'落魄剑仙·李欠欠',por:'npc_mentor'},
      lengyue:{n:'冷月仙子',por:'npc_lengyue'},
      cuihua:{n:'翠花',por:'npc_girl'},
      aotian:{n:'龙傲天',por:'npc_aotian'}
    };
    var REALMS = [
      { n:'凡人', need:80 }, { n:'练气', need:200 }, { n:'筑基', need:520 },
      { n:'金丹', need:1300 }, { n:'元婴', need:3200 }, { n:'化神', need:7600 }
    ];
    var _npcBlock = null;
    var NPC37 = { storyBlock() { return _npcBlock; } };
    var B = { on: false };
    var Life34 = {
      _rel: {},
      st() { return { rel: this._rel }; },
      rel(id, d) { this._rel[id] = Math.max(-100, Math.min(100, (this._rel[id] || 0) + d)); }
    };
    var UI = {
      modal: null, toasts: [], cards: [],
      toast(m, col) { this.toasts.push([String(m), col]); },
      async card(t, x, p, o) { this.cards.push({ t, x, o }); return 0; },
      p_legacy26(b) { b._legacy = 1; }
    };
    var Talk = { extra() { return [['闲聊', async () => {}]]; } };
    var DevTabs = [];
    var DevPanel = {
      registerTab(k, name, r) { DevTabs.push({ key: k, name, render: r }); return true; }
    };
    var Game = {
      G: null, meta: { lives: 1 }, rolls: [],
      roll(p, k) { this.rolls.push([p, k]); return Math.random() < p; },
      useAP(n) { n = n || 1; if (!this.G || this.G.ap < n) return false; this.G.ap -= n; return true; },
      give(id, n) { const G = this.G; G.inv = G.inv || {}; G.inv[id] = (G.inv[id] || 0) + (n || 1); },
      save() { this._saved = (this._saved || 0) + 1; },
      saveMeta() { this._metaSaved = (this._metaSaved || 0) + 1; },
      async yearEnd() { if (this.G) this.G.year = (this.G.year || 0) + 1; },
      newLife(cfg) {
        this.G = Object.assign({ v: 2, year: 1, age: 16, realm: 2, stage: 0, ap: 4, stone: 0, aff: {}, inv: {}, apprentice: null, apprenticeLvl: 0, apprenticeTechs: {} }, cfg || {});
        return this.G;
      },
      async die() { if (this.G) this.G.dead = true; },
      async enterMap(id) { this._map = id; }
    };
    function __setNpcBlock(v) { _npcBlock = v; }
    function __setB(v) { B.on = !!v; }
    function __setModal(v) { UI.modal = v; }
  `, c);
  vm.runInContext(SRC, c);
  return c;
}

const mkG = (o) => Object.assign({
  v: 2, year: 20, age: 30, realm: 3, stage: 0, ap: 4, stone: 100,
  aff: {}, inv: {}, flags: {},
  apprentice: 'lengyue', apprenticeLvl: 5, apprenticeTechs: { sword: 1 }
}, o || {});

const R = (c, s) => vm.runInContext(s, c);
const asyncR = (c, s) => vm.runInContext(`(async () => { ${s} })()`, c);

(async () => {
  // ---- 导出 / 文案包 / 不进 index ----
  let c = box2();
  ok(!!R(c, 'SHI46') && !!R(c, 'Shi46') && !!R(c, 'TEXT_SHI46'), 'SHI46 / Shi46 / TEXT_SHI46 导出');
  ok(R(c, 'SHI46.TEXT.meta.ver') === '3.9.6', 'TEXT ver 3.9.6');
  ok(R(c, 'TEXT_SHI46.hw.tasks.length') >= 8, '7 hw.tasks≥8');
  ok(R(c, 'TEXT_SHI46.tiandao.length') >= 4, '7 tiandao≥4');
  const roundTrip = JSON.parse(JSON.stringify(R(c, 'TEXT_SHI46')));
  ok(roundTrip.meta.id === 'TEXT_SHI46' && roundTrip.ui.sec.indexOf('亲传') >= 0, '7 TEXT_SHI46 JSON 往返');
  ok(!SCRIPTS.includes('js/shi46.js'), '本轮不进 index.html');

  // ---- 常量 ----
  const S0 = R(c, 'SHI46');
  ok(S0.HW_CAP === 3 && S0.HW_OK === 0.7 && S0.GRAD_LV === 8 && S0.GRAD_TECH === 2, '常量 HW/GRAD');
  ok(S0.GRAD_MOOD === 70 && S0.GRAD_AFF === 80 && S0.VISIT_P === 0.35 && S0.GIFT_STONE_MUL === 0.08, '常量 mood/aff/visit/gift');

  // ---- §20.9.1 无亲传 / off ----
  {
    c = box2();
    const G = mkG({ apprentice: null, apprenticeLvl: 0, apprenticeTechs: {} });
    R(c, 'Game').G = G;
    const info = R(c, 'SHI46.panelInfo(Game.G)');
    ok(info.empty === true && !info.canHw, '1 无亲传面板 empty、无功课');
    ok(!R(c, 'SHI46.canHw(Game.G)'), '1 canHw false 无亲传');
    R(c, 'SHI46.off = true');
    G.apprentice = 'lengyue';
    ok(!R(c, 'SHI46.canHw(Game.G)') && !R(c, 'SHI46.canPopup()'), '1 off=true 全跳过');
    const r = await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceOk: true });');
    ok(!r.ok && r.reason === 'off' && G.ap === 4, '1 off 时 doHw 拒绝且不花 AP');
    R(c, 'SHI46.off = false');
  }

  // ---- §20.9.2 布置功课 AP−1 / n+1 / roll / mood / 第4次拒 ----
  {
    c = box2();
    const G = mkG({ ap: 5, apprenticeLvl: 4 });
    R(c, 'Game').G = G;
    R(c, 'Game.rolls = []');
    const r1 = await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceOk: true });');
    ok(r1.ok && r1.success && G.ap === 4 && G.shi46.n === 1, '2 成功：AP−1 n=1');
    ok(G.shi46.mood > 60, '2 成功 mood↑（自 60）');
    ok(G.shi46.lessons === 1, '2 lessons++');
    const r2 = await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceFail: true });');
    ok(r2.ok && r2.success === false && G.ap === 3 && G.shi46.n === 2, '2 失败：n=2 AP−1');
    ok(G.shi46.mood < (60 + r1.moodDelta), '2 失败 mood↓');
    await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceOk: true });');
    ok(G.shi46.n === 3, '2 第3次 n=3');
    const r4 = await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceOk: true });');
    ok(!r4.ok && r4.reason === 'cap' && G.ap === 2 && G.shi46.n === 3, '2 同年第4次拒绝 cap、不花 AP');
    // Game.roll 被调用（非 force 路径）
    c = box2();
    R(c, 'Game').G = mkG({ ap: 3 });
    R(c, 'Game.rolls = []');
    await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true });');
    ok(R(c, 'Game.rolls').some(x => x[0] === 0.7 && x[1] === 'qiyu'), '2 Game.roll(HW_OK,qiyu) 被调用');
  }

  // ---- §20.9.3 跨年 n 归零；放养次年 cap=2（§20.4.1）----
  {
    c = box2();
    const G = mkG({ ap: 10, year: 20 });
    R(c, 'Game').G = G;
    await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceOk: true });');
    await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceOk: true });');
    ok(G.shi46.n === 2, '3 本年 n=2');
    G.year = 21;
    R(c, 'SHI46.ensure(Game.G)');
    ok(G.shi46.n === 0 && G.shi46.y === 21, '3 跨年 n 归零');
    const yr = await asyncR(c, "return SHI46.applyYearStyle(Game.G, 'free');");
    ok(yr.ok && G.shi46.style === 'free' && G.shi46.freeCut === 1, '3 放养 style/freeCut');
    // 设定当年 cap 仍 3（不立刻降）
    ok(R(c, 'SHI46.hwCap(Game.G)') === 3, '3 放养设定当年 cap 仍 3');
    G.year = 22;
    R(c, 'SHI46.ensure(Game.G)');
    ok(G.shi46.n === 0 && R(c, 'SHI46.hwCap(Game.G)') === 2, '3 跨年后放养年 cap=2');
    await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceOk: true });');
    await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceOk: true });');
    const r3 = await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceOk: true });');
    ok(!r3.ok && r3.reason === 'cap' && G.shi46.n === 2, '3 放养年第3次拒绝');
  }

  // ---- §20.9.4 出师门槛 / 清空 / ally / aff·rel ----
  {
    c = box2();
    const G = mkG({
      apprentice: 'lengyue', apprenticeLvl: 7, apprenticeTechs: { a: 1 },
      aff: { lengyue: 90 }, realm: 3
    });
    R(c, 'Game').G = G;
    R(c, 'SHI46.ensure(Game.G)').mood = 80;
    ok(!R(c, 'SHI46.canGrad(Game.G)'), '4 门槛不足（lv7 tech1）canGrad false');
    G.apprenticeLvl = 8;
    G.apprenticeTechs = { a: 1, b: 1 };
    G.shi46.mood = 70;
    G.aff.lengyue = 80;
    ok(R(c, 'SHI46.canGrad(Game.G)'), '4 满足门槛 canGrad true');
    const stoneBefore = G.stone;
    const relBefore = R(c, 'Life34._rel.lengyue') || 0;
    const gr = await asyncR(c, "return await SHI46.graduate(Game.G, 'stone', { silent: true });");
    ok(gr.ok && !G.apprentice && G.apprenticeLvl === 0, '4 出师清空 apprentice*');
    ok(Object.keys(G.apprenticeTechs || {}).length === 0, '4 apprenticeTechs 清空');
    ok(G.shi46.ally && G.shi46.ally.id === 'lengyue' && G.shi46.grad === 1, '4 写入 ally / grad++');
    ok(G.aff.lengyue === 90, '4 aff +10 有上限内提升（80→90）');
    ok((R(c, 'Life34._rel.lengyue') || 0) === relBefore + 15, '4 Life34.rel +15');
    ok(G.stone === stoneBefore + Math.min(2000, Math.round(1300 * 0.08)), '4 灵石贺仪 0.08×need cap2000');
    ok(R(c, 'Game.meta.shi46.totGrad') === 1, '4 meta.totGrad++');
  }

  // ---- §20.9.5 storyBlock / B.on → canPopup false，年终不插卡 ----
  {
    c = box2();
    const G = mkG({ age: 30 });
    R(c, 'Game').G = G;
    R(c, 'SHI46.ensure(Game.G)');
    R(c, '__setNpcBlock("prologue")');
    ok(R(c, 'SHI46.storyBlock()') === 'prologue' && !R(c, 'SHI46.canPopup()'), '5 storyBlock 挡住');
    const y1 = await asyncR(c, 'return await SHI46.yearReview(Game.G, {});');
    ok(!y1.ok && y1.reason === 'blocked' && y1.pending && G.shi46.pendYear === 1, '5 年终不插卡、pendYear');
    ok(R(c, 'UI.cards').length === 0, '5 无卡片入队');
    R(c, '__setNpcBlock(null)');
    R(c, '__setB(true)');
    ok(R(c, 'SHI46.storyBlock()') === 'battle' && !R(c, 'SHI46.canPopup()'), '5 B.on 挡住');
    const hw = await asyncR(c, 'return await SHI46.doHw(Game.G, { forceOk: true });'); // 非 silent
    ok(!hw.ok && hw.reason === 'blocked' && G.ap === 4, '5 B.on 时功课不花 AP');
    R(c, '__setB(false)');
    ok(R(c, 'SHI46.canPopup()'), '5 解除后可弹');
  }

  // ---- §20.9.6 Talk.extra 回访；助战同年第二次拒绝 ----
  {
    c = box2();
    const G = mkG({ apprentice: null, apprenticeLvl: 0, apprenticeTechs: {}, aff: { lengyue: 100 }, year: 30 });
    R(c, 'Game').G = G;
    const s = R(c, 'SHI46.ensure(Game.G)');
    s.ally = { id: 'lengyue', n: '冷月', y0: 24, fightY: 0 };
    R(c, 'SHI46.wire()');
    const ex = R(c, 'Talk.extra("lengyue")');
    ok(ex.some(x => /门下回访/.test(x[0])), '6 Talk.extra(ally) 含回访');
    const ex2 = R(c, 'Talk.extra("cuihua")');
    ok(!ex2.some(x => /门下回访/.test(x[0])), '6 非 ally 无回访');
    const f1 = await asyncR(c, "return await SHI46.allyVisit(Game.G, { silent: true, act: 'fight' });");
    ok(f1.ok && G.follower === 'lengyue' && G.shi46.ally.fightY === 30, '6 助战第一次 OK');
    const f2 = await asyncR(c, "return await SHI46.allyVisit(Game.G, { silent: true, act: 'fight' });");
    ok(!f2.ok && f2.reason === 'fight_cap', '6 助战同年第二次拒绝');
  }

  // ---- §20.9.8 keepFnMarks：先打 _leg26 再包 yearEnd ----
  {
    c = box2();
    R(c, `
      Game.yearEnd._leg26 = 1;
      Game.yearEnd._fam37 = 1;
      Game.yearEnd._mem45 = 1;
    `);
    R(c, 'SHI46.wire()');
    ok(R(c, 'Game.yearEnd._shi46') === 1, '8 yearEnd 打上 _shi46');
    ok(R(c, 'Game.yearEnd._leg26') === 1 && R(c, 'Game.yearEnd._fam37') === 1 && R(c, 'Game.yearEnd._mem45') === 1,
      '8 keepFnMarks 保留 _leg26/_fam37/_mem45');
    // 直接测 keepFnMarks
    const km = R(c, `(function(){
      var src = function(){}; src._leg26 = 1; src._x = 2;
      var dst = function(){};
      SHI46.keepFnMarks(src, dst, '_shi46');
      return { a: dst._leg26, b: dst._x };
    })()`);
    ok(km.a === 1 && km.b === 2, '8 keepFnMarks 复制 _* 标记');
  }

  // ---- §20.9.9 老档无 G.shi46：ensure 不抛；G.v===2 ----
  {
    c = box2();
    const G = mkG();
    delete G.shi46;
    R(c, 'Game').G = G;
    let threw = false;
    try {
      const s = R(c, 'SHI46.ensure(Game.G)');
      ok(s && s.v === 1 && s.mood === 60 && s.n === 0, '9 老档 ensure 默认结构');
    } catch (e) { threw = true; }
    ok(!threw, '9 ensure 不抛');
    ok(G.v === 2, '9 不升 G.v（仍 wbx2_* / v===2）');
    // 无亲传老档
    const G2 = { v: 2, year: 5, age: 20, realm: 1, aff: {} };
    R(c, 'Game').G = G2;
    ok(R(c, 'SHI46.ensure(Game.G)') && G2.shi46.mood === 60, '9 无亲传老档 ensure OK');
  }

  // ---- 对抗：farming caps（公开 API 无法绕过）----
  {
    c = box2();
    const G = mkG({ ap: 20 });
    R(c, 'Game').G = G;
    for (let i = 0; i < 3; i++) {
      const r = await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceOk: true });');
      ok(r.ok, 'adv 功课第 ' + (i + 1) + ' 次');
    }
    const apAfter = G.ap, nAfter = G.shi46.n, moodAfter = G.shi46.mood, lessonsAfter = G.shi46.lessons;
    const rx = await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceOk: true });');
    ok(!rx.ok && rx.reason === 'cap', 'adv 第4次公开 doHw 拒 cap');
    ok(G.ap === apAfter && G.shi46.n === nAfter && G.shi46.mood === moodAfter && G.shi46.lessons === lessonsAfter,
      'adv 超 cap 后状态不变');
    // 无 AP
    G.shi46.n = 0; G.ap = 0;
    const r0 = await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceOk: true });');
    ok(!r0.ok && r0.reason === 'noap' && G.shi46.n === 0, 'adv 无 AP 拒绝且不计数');
    // 公开对象无 unguarded once / _doHw
    ok(typeof R(c, 'SHI46.once') !== 'function' && R(c, 'SHI46._once') === undefined, 'adv 无 once/_once');
    ok(typeof R(c, 'SHI46._doHw') !== 'function' && typeof R(c, 'SHI46._graduate') !== 'function', 'adv 无 _doHw/_graduate');
  }

  // ---- 对抗：storyBlock 下 graduate / allyVisit 不改档 ----
  {
    c = box2();
    const G = mkG({
      apprentice: 'lengyue', apprenticeLvl: 9, apprenticeTechs: { a: 1, b: 1 },
      aff: { lengyue: 100 }, ap: 4
    });
    R(c, 'Game').G = G;
    R(c, 'SHI46.ensure(Game.G)').mood = 90;
    R(c, '__setNpcBlock("intro")');
    const before = JSON.stringify({
      ap: G.apprentice, lvl: G.apprenticeLvl, techs: G.apprenticeTechs,
      aff: G.aff.lengyue, stone: G.stone, ally: G.shi46 && G.shi46.ally
    });
    const g1 = await asyncR(c, "return await SHI46.graduate(Game.G, 'stone');"); // 非 silent
    ok(!g1.ok && g1.reason === 'blocked', 'adv storyBlock 出师拒绝');
    ok(JSON.stringify({
      ap: G.apprentice, lvl: G.apprenticeLvl, techs: G.apprenticeTechs,
      aff: G.aff.lengyue, stone: G.stone, ally: G.shi46 && G.shi46.ally
    }) === before, 'adv storyBlock 出师状态不变');
    R(c, '__setNpcBlock(null)');
    // silent 逻辑层仍可测
    const g2 = await asyncR(c, "return await SHI46.graduate(Game.G, 'none', { silent: true });");
    ok(g2.ok && !G.apprentice, 'adv silent 出师仍可（单测）');
  }

  // ---- 对抗：新收徒重置 mood；年终风格 strict/kind ----
  {
    c = box2();
    const G = mkG({ apprentice: 'lengyue', year: 10 });
    R(c, 'Game').G = G;
    const s = R(c, 'SHI46.ensure(Game.G)');
    s.mood = 20; s.n = 2; s.y = 10;
    G.apprentice = 'cuihua';
    R(c, 'SHI46.ensure(Game.G)');
    ok(G.shi46.mood === 60 && G.shi46.n === 0, 'adv 换亲传重置 mood/n');
    R(c, "SHI46.applyYearStyle(Game.G, 'strict')");
    ok(G.shi46.style === 'strict' && G.shi46.mood === 55, 'adv strict mood−5');
    R(c, "SHI46.applyYearStyle(Game.G, 'kind')");
    ok(G.shi46.style === 'kind' && G.shi46.mood === 63, 'adv kind mood+8');
  }

  // ---- 对抗：Math.random 回退（无 Game.roll）----
  {
    c = box2();
    const G = mkG({ ap: 3 });
    R(c, 'Game').G = G;
    R(c, 'Game.roll = undefined');
    const r = await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true });');
    ok(r.ok && G.ap === 2 && G.shi46.n === 1, 'adv 无 Game.roll 时 Math.random 回退仍结算');
  }

  // ---- 对抗：null 守卫 ----
  {
    c = box2();
    ok(R(c, 'SHI46.ensure(null)') === null, 'adv ensure(null)=null');
    ok(R(c, 'SHI46.canHw(null)') === false, 'adv canHw(null)=false');
    ok(R(c, 'SHI46.canGrad(null)') === false, 'adv canGrad(null)=false');
    const r = await asyncR(c, 'return await SHI46.doHw(null, { silent: true });');
    ok(!r.ok, 'adv doHw(null) 安全');
    const g = await asyncR(c, 'return await SHI46.graduate(null, "none", { silent: true });');
    ok(!g.ok, 'adv graduate(null) 安全');
  }

  // ---- 对抗：出师礼 scroll / none；勉励回访 ----
  {
    c = box2();
    const G = mkG({
      apprentice: 'cuihua', apprenticeLvl: 10, apprenticeTechs: { x: 1, y: 1 },
      aff: { cuihua: 120 }, inv: {}
    });
    R(c, 'Game').G = G;
    R(c, 'SHI46.ensure(Game.G)').mood = 100;
    const gr = await asyncR(c, "return await SHI46.graduate(Game.G, 'scroll', { silent: true });");
    ok(gr.ok && (G.inv.scroll | 0) === 1, 'adv 出师赠 scroll');
    const th = await asyncR(c, "return await SHI46.allyVisit(Game.G, { silent: true, act: 'thank' });");
    ok(th.ok && th.act === 'thank' && G.aff.cuihua >= 123, 'adv 勉励 aff+3');
  }

  // ---- wire 幂等 / DevTab ----
  {
    c = box2();
    R(c, 'Game').G = mkG();
    ok(R(c, 'SHI46.wire()') === true, 'wire 成功');
    ok(R(c, 'SHI46.wire()') === true && R(c, 'SHI46._wired') === true, 'wire 幂等');
    ok(R(c, 'DevTabs').some(t => t.key === 'shi46'), 'DevPanel 师徒46 注册');
    ok(R(c, 'Talk._shi46') === 1, 'Talk._shi46 标记');
  }

  // ---- panelInfo 有亲传 ----
  {
    c = box2();
    const G = mkG({ apprenticeLvl: 7, apprenticeTechs: { a: 1, b: 1 }, ap: 2 });
    R(c, 'Game').G = G;
    R(c, 'SHI46.ensure(Game.G)').mood = 75;
    const info = R(c, 'SHI46.panelInfo(Game.G)');
    ok(!info.empty && info.name === '冷月仙子' && info.lvl === 7 && info.techs === 2, 'panelInfo 亲传摘要');
    ok(info.canHw && !info.canGrad, 'panelInfo canHw、未达出师');
  }

  // ---- §20.9.9a 放养计年 + visitY 闸 thank/allyOptFor ----
  {
    c = box2();
    const G = mkG({ ap: 20, year: 20 });
    R(c, 'Game').G = G;
    for (let i = 0; i < 3; i++) {
      const r = await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceOk: true });');
      ok(r.ok, '9a 当年功课第 ' + (i + 1) + ' 次');
    }
    ok(G.shi46.n === 3, '9a 布置满 n=3');
    const fr = await asyncR(c, "return SHI46.applyYearStyle(Game.G, 'free');");
    ok(fr.ok && G.shi46.freeCut === 1 && G.shi46.n === 3, '9a 选放养后 n 仍 3、freeCut=1');
    ok(R(c, 'SHI46.hwCap(Game.G)') === 3, '9a 设定当年 cap 仍 3');
    const over = await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceOk: true });');
    ok(!over.ok && over.reason === 'cap' && G.shi46.n === 3, '9a 放养不绕开当年封顶');
    G.year = 21;
    R(c, 'SHI46.ensure(Game.G)');
    ok(G.shi46.n === 0 && R(c, 'SHI46.hwCap(Game.G)') === 2, '9a 次年 n=0 cap=2');
    await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceOk: true });');
    await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceOk: true });');
    const r3 = await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceOk: true });');
    ok(!r3.ok && r3.reason === 'cap' && G.shi46.n === 2, '9a 次年第3次功课拒绝');

    // visitY 闸 thank / allyOptFor
    c = box2();
    const G2 = mkG({ apprentice: null, apprenticeLvl: 0, apprenticeTechs: {}, aff: { lengyue: 50 }, year: 40, inv: {} });
    R(c, 'Game').G = G2;
    const s2 = R(c, 'SHI46.ensure(Game.G)');
    s2.ally = { id: 'lengyue', n: '冷月', y0: 30, fightY: 0 };
    R(c, 'SHI46.wire()');
    ok(R(c, 'SHI46.allyOptFor("lengyue")') === true, '9a 回访前 allyOptFor true');
    const t1 = await asyncR(c, "return await SHI46.allyVisit(Game.G, { silent: true, act: 'thank' });");
    ok(t1.ok && G2.aff.lengyue === 53 && G2.shi46.visitY === 40, '9a 首次 thank aff+3');
    const t2 = await asyncR(c, "return await SHI46.allyVisit(Game.G, { silent: true, act: 'thank' });");
    ok(!t2.ok && t2.reason === 'visit_cap' && G2.aff.lengyue === 53, '9a 同年二次 thank 拒 visit_cap');
    ok(R(c, 'SHI46.allyOptFor("lengyue")') === false, '9a visitY 后 allyOptFor false');
    const ex = R(c, 'Talk.extra("lengyue")');
    ok(!ex.some(x => /门下回访/.test(x[0])), '9a Talk.extra 同年不再注入回访');
  }

  // ---- 对抗 M2：Talk.extra 上层 undefined/非数组 → 仍返回 [] ----
  {
    c = box2();
    R(c, 'Game').G = mkG({ apprentice: null });
    R(c, 'Talk.extra = function () { return undefined; }');
    R(c, 'SHI46.wire()');
    const out1 = R(c, 'Talk.extra("x")');
    ok(Array.isArray(out1) && out1.length === 0, 'adv M2 prev=undefined → []');

    c = box2();
    R(c, 'Game').G = mkG({ apprentice: null });
    R(c, 'Talk.extra = function () { return { not: "array" }; }');
    R(c, 'SHI46.wire()');
    const out2 = R(c, 'Talk.extra("x")');
    ok(Array.isArray(out2) && out2.length === 0, 'adv M2 prev=非数组 → []');
  }

  // ---- 对抗 L1：die 拦截未死不叹；真死后才遗憾 + keepFnMarks ----
  {
    c = box2();
    const G = mkG({ apprentice: 'lengyue' });
    R(c, 'Game').G = G;
    R(c, 'SHI46.ensure(Game.G)');
    // 拦截版内层：不置 dead（模拟 main40 newdao/auditor）
    R(c, `
      Game.die = async function () { /* intercepted */ };
      Game.die._main40 = 1;
      Game.die._mem45 = 1;
    `);
    R(c, 'SHI46.wire()');
    R(c, 'UI.toasts = []');
    await asyncR(c, 'return await Game.die("newdao");');
    ok(!G.dead && R(c, 'UI.toasts').length === 0, 'adv L1 拦截未死无遗憾 toast');
    ok(R(c, 'Game.die._shi46') === 1 && R(c, 'Game.die._main40') === 1 && R(c, 'Game.die._mem45') === 1,
      'adv L1 keepFnMarks 保留 _main40/_mem45');

    // 真死版：新沙箱
    c = box2();
    const G2 = mkG({ apprentice: 'lengyue' });
    R(c, 'Game').G = G2;
    R(c, 'SHI46.ensure(Game.G)');
    R(c, 'Game.die._main40 = 1');
    R(c, 'SHI46.wire()');
    R(c, 'UI.toasts = []');
    await asyncR(c, 'return await Game.die("sit");');
    ok(G2.dead && R(c, 'UI.toasts').some(x => /弟子尚在门下/.test(x[0])), 'adv L1 真死后遗憾 toast');
  }

  // ---- 对抗 M1：visitY 闸 aff/herb 双刷 ----
  {
    c = box2();
    const G = mkG({ apprentice: null, aff: { lengyue: 50 }, year: 20, inv: {} });
    R(c, 'Game').G = G;
    const s = R(c, 'SHI46.ensure(Game.G)');
    s.ally = { id: 'lengyue', n: '冷月', y0: 10, fightY: 0 };
    R(c, 'Game.roll = function(){ return true; }'); // 必出 herb
    const a1 = await asyncR(c, "return await SHI46.allyVisit(Game.G, { silent: true, act: 'thank' });");
    const aff1 = G.aff.lengyue, herb1 = G.inv.herb | 0;
    ok(a1.ok && aff1 === 53 && herb1 >= 1, 'adv M1 首次 thank 生效');
    const a2 = await asyncR(c, "return await SHI46.allyVisit(Game.G, { silent: true, act: 'thank' });");
    ok(!a2.ok && a2.reason === 'visit_cap', 'adv M1 二次 thank visit_cap');
    ok(G.aff.lengyue === aff1 && (G.inv.herb | 0) === herb1, 'adv M1 二次不刷 aff/herb');
    ok(!R(c, 'SHI46.allyOptFor("lengyue")'), 'adv M1 allyOptFor 同年隐藏');
  }

  // ---- validate22 在外部跑；这里确认模块不污染 G.v ----
  {
    c = box2();
    const G = mkG({ v: 2, apprenticeLvl: 8, apprenticeTechs: { a: 1, b: 1 }, aff: { lengyue: 90 } });
    R(c, 'Game').G = G;
    R(c, 'SHI46.ensure(Game.G)').mood = 80;
    await asyncR(c, 'return await SHI46.doHw(Game.G, { silent: true, forceOk: true });');
    await asyncR(c, "return await SHI46.graduate(Game.G, 'none', { silent: true });");
    ok(G.v === 2 && !G.apprentice, '全程 G.v 仍为 2（wbx2_*）且出师成功');
  }

  console.log('\n' + (fails ? fails + ' FAIL / ' + n : 'ALL PASS ' + n));
  process.exit(fails);
})().catch(e => { console.error(e); process.exit(1); });

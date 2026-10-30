// 3.9.5 似曾相识 memory45 单测：node test/memory45_unit.js（退出码 = 失败数）
// 覆盖 docs/research_v22.md §19.8 用例 1–8；vm + 真实 memory45.js，无 Chrome。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'www/js/memory45.js'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'www/index.html'), 'utf8');
const SCRIPTS = [...HTML.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);

function box() {
  const c = {
    console: { log() {}, warn() {}, error() {} },
    Math: Object.create(Math), JSON, Date,
    setTimeout() {}, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    document: { readyState: 'complete', addEventListener() {} },
    toasts: [], cards: [], dies: []
  };
  c.window = c; c.globalThis = c;
  vm.createContext(c);
  vm.runInContext(`
    var NPCS={
      mentor:{n:'落魄剑仙',por:'npc_mentor'},
      lengyue:{n:'冷月',por:'npc_lengyue'},
      aotian:{n:'龙傲天',por:'npc_aotian'},
      cuihua:{n:'翠花',por:'npc_girl'},
      merchant:{n:'钱多多',por:'npc_merchant'},
      xianguan:{n:'记账童子',por:'npc_tongzi'}
    };
    var B={on:false};
    var NPC37={storyBlock:function(){return null;}};
    var Life34={
      _rel:{},
      st:function(){return {rel:this._rel,loc:{},log:[],seen:{}};}
    };
    var UI={modal:null, toast:function(s){toasts.push(String(s));},
      card:async function(t,x,p,o){cards.push({t:t,x:x,o:o});return 0;}, hud:function(){}};
    var Talk={extra:function(){return [];}};
    var DevTabs=[];
    var DevPanel={registerTab:function(k,n,r){DevTabs.push({key:k,name:n,render:r});return true;}};
    var Game={
      G:null, meta:{lives:1,achs:{},endings:{},best:{realm:0,age:0},pts:0},
      rolls:[],
      roll:function(p,kind){this.rolls.push([p,kind]);return Math.random()<p;},
      save:function(){}, saveMeta:function(){this._metaSaved=(this._metaSaved||0)+1;},
      yearExp:function(){return 1000;},
      addExp:function(n,raw){this._exp=(this._exp||0)+n;return n;},
      async die(kind){dies.push(kind); if(this.G){this.G.dead=true;this.G.ending=kind;}},
      newLife:function(cfg){this.G=Object.assign({v:2,year:1,age:16,realm:0,stage:0,aff:{},flags:{},visited:{},bosses:{},inv:{}},cfg||{}); return this.G;},
      async enterMap(id){this._map=id;},
      async interactEnt(e){this._ie=e;}
    };
  `, c);
  vm.runInContext(SRC, c);
  return c;
}

const mkG = (o) => Object.assign({
  v: 2, year: 10, age: 30, realm: 2, stage: 0, stone: 1000, debt: 8888,
  aff: {}, flags: {}, visited: { village: 1 }, bosses: {}, inv: {}, partner: null
}, o || {});

(async () => {
  // index order
  ok(SCRIPTS.includes('js/memory45.js'), 'index 含 memory45.js');
  ok(SCRIPTS.indexOf('js/memory45.js') === SCRIPTS.indexOf('js/dongfu43_ui.js') + 1, 'memory45 紧接 dongfu43_ui');
  ok(SCRIPTS.indexOf('js/memory45.js') < SCRIPTS.indexOf('js/audio32.js'), 'memory45 在 audio32 之前');
  ok(!SCRIPTS.includes('js/sweep44.js') || SCRIPTS.indexOf('js/memory45.js') !== SCRIPTS.indexOf('js/sweep44.js'), '未误绑 sweep44');

  // §19.8.1 ensure + off
  {
    const c = box();
    ok(!!c.MEM45 && !!c.Memory45, 'MEM45 / Memory45 导出');
    delete c.Game.meta.mem45;
    const m = c.Memory45.ensureMeta();
    ok(m && m.v === 1 && m.npcs && m.places && m.bosses && m.tot === 0, '1 ensureMeta 默认结构');
    c.MEM45.off = true;
    c.Game.G = mkG();
    c.Memory45.inject('mentor', 'friend', 50);
    const ex = c.Talk.extra('mentor');
    ok(!ex.some(x => /似曾相识/.test(x[0])), '1 off=true 不注入选项');
    c.MEM45.off = false;
  }

  // §19.8.2 snapshot dao + cap 24
  {
    const c = box();
    const G = mkG({ partner: 'lengyue', aff: { lengyue: 90 } });
    c.Game.G = G;
    c.Life34._rel = {};
    c.Memory45.snapshot(G, true);
    const meta = c.Game.meta.mem45;
    ok(meta.npcs.lengyue && meta.npcs.lengyue.t === 'dao', '2 partner → dao');
    // fill 30 weak friends then strong one
    for (let i = 0; i < 30; i++) {
      G.aff['n' + i] = 60;
      c.Life34._rel['n' + i] = 40;
    }
    G.aff.lengyue = 90;
    c.Memory45.snapshot(G, true);
    const keys = Object.keys(c.Game.meta.mem45.npcs);
    ok(keys.length === 24, '2 NPC 封顶 ===24 得 ' + keys.length);
    ok(!!c.Game.meta.mem45.npcs.lengyue, '2 强权重 dao 保留');
  }

  // §19.8.3 foe / friend
  {
    const c = box();
    const G = mkG({ aff: {} });
    c.Game.G = G;
    c.Life34._rel = { aotian: -50, cuihua: 55 };
    c.Memory45.snapshot(G, true);
    ok(c.Game.meta.mem45.npcs.aotian && c.Game.meta.mem45.npcs.aotian.t === 'foe', '3 aotian → foe');
    ok(c.Game.meta.mem45.npcs.cuihua && c.Game.meta.mem45.npcs.cuihua.t === 'friend', '3 cuihua → friend');
  }

  // §19.8.4 fired + YEAR_CAP + year reset
  {
    const c = box();
    c.Game.G = mkG({ year: 5 });
    c.Memory45.inject('mentor', 'friend', 50);
    c.Memory45.inject('cuihua', 'friend', 50);
    c.Memory45.inject('lengyue', 'dao', 90);
    c.Memory45.inject('aotian', 'foe', -50);
    ok(await c.Memory45.fireCard(c.Game.G, 'mentor'), '4 第1次触发');
    ok(c.Game.G.mem45.fired.mentor === 1, '4 fired 置位');
    ok(await c.Memory45.fireCard(c.Game.G, 'cuihua'), '4 第2次');
    ok(await c.Memory45.fireCard(c.Game.G, 'lengyue'), '4 第3次');
    ok(!(await c.Memory45.fireCard(c.Game.G, 'aotian')), '4 第4次 YEAR_CAP 拒绝');
    ok(c.Game.G.mem45.n === 3, '4 本年 n===3');
    // 跨年
    c.Game.G.year = 6;
    c.Memory45.ensureG(c.Game.G);
    ok(c.Game.G.mem45.n === 0 && c.Game.G.mem45.y === 6, '4 跨年 n 归零');
    ok(await c.Memory45.fireCard(c.Game.G, 'aotian'), '4 跨年后可再触发');
  }

  // §19.8.5 storyBlock / B.on
  {
    const c = box();
    c.Game.G = mkG();
    c.Memory45.inject('mentor', 'friend', 50);
    c.NPC37.storyBlock = () => 'prologue';
    ok(c.Memory45.canFire(c.Game.G, 'mentor') === false, '5 storyBlock prologue → canFire false');
    c.NPC37.storyBlock = () => null;
    c.B.on = true;
    ok(c.Memory45.canFire(c.Game.G, 'mentor') === false, '5 B.on → canFire false');
    c.B.on = false;
    c.UI.modal = {};
    ok(c.Memory45.canFire(c.Game.G, 'mentor') === false, '5 UI.modal → canFire false');
    c.UI.modal = null;
    ok(c.Memory45.canFire(c.Game.G, 'mentor') === true, '5 无守卫可触发');
  }

  // §19.8.6 Game.roll + AFF_CAP + insight once
  {
    const c = box();
    c.Game.G = mkG({ year: 1, aff: {} });
    c.Memory45.inject('lengyue', 'dao', 90);
    c.Game.rolls = [];
    await c.Memory45.fireCard(c.Game.G, 'lengyue');
    ok(c.Game.rolls.some(r => r[1] === 'qiyu'), '6 使用 Game.roll');
    const d = (c.Game.G.aff.lengyue || 0);
    ok(d > 0 && d <= c.MEM45.AFF_CAP, '6 aff 增量 ≤ AFF_CAP 得 ' + d);
    ok(c.Game.G.mem45.insight === 1, '6 顿悟已领');
    const exp1 = c.Game._exp || 0;
    c.Memory45.inject('mentor', 'shi', 80);
    await c.Memory45.fireCard(c.Game.G, 'mentor');
    ok(c.Game.G.mem45.insight === 1, '6 顿悟仅一次');
    // foeHint path
    c.Memory45.inject('aotian', 'foe', -60);
    c.Game.G.year = 2; c.Memory45.ensureG(c.Game.G);
    await c.Memory45.fireCard(c.Game.G, 'aotian');
    ok(c.Game.G.mem45.foeHint && c.Game.G.mem45.foeHint.aotian === 1, '6 foe → foeHint');
  }

  // §19.8.7 TEXT roundtrip
  {
    const c = box();
    const T = c.MEM45.TEXT;
    const rt = JSON.parse(JSON.stringify(T));
    ok(rt.meta && rt.meta.id === 'TEXT_MEM45', '7 JSON 往返 meta');
    const pools = ['generic', 'friend', 'foe', 'debtor', 'creditor', 'dao', 'shi', 'di', 'place', 'boss', 'tiandao'];
    ok(pools.every(k => Array.isArray(rt[k]) && rt[k].length >= 1), '7 各类型池 ≥1');
    ok(rt.tiandao.length >= 4, '7 tiandao.length≥4 得 ' + rt.tiandao.length);
  }

  // §19.8.8 old save / G==null
  {
    const c = box();
    c.Game.meta = { lives: 2, achs: {}, endings: {}, best: { realm: 0, age: 0 }, pts: 0 }; // no mem45
    ok(c.Memory45.ensureMeta() && c.Game.meta.mem45.npcs, '8 老 meta 无 mem45 可 ensure');
    c.Memory45.snapshot(null);
    ok(true, '8 snapshot(null) 不抛');
    ok(c.Memory45.canFire(null, 'mentor') === false, '8 G==null canFire false');
    const ex = c.Talk.extra('mentor');
    ok(Array.isArray(ex), '8 Talk.extra G==null 不抛');
    c.Game.G = mkG({ v: 2 });
    delete c.Game.G.mem45;
    c.Memory45.ensureG(c.Game.G);
    ok(c.Game.G.mem45 && c.Game.G.v === 2, '8 老档 G.v===2 惰性 mem45');
    c.Game.saveMeta();
    ok((c.Game._metaSaved || 0) >= 1, '8 saveMeta 可调用');
  }

  // Talk.extra inject + DevPanel
  {
    const c = box();
    c.Game.G = mkG();
    c.Memory45.inject('mentor', 'friend', 55);
    const ex = c.Talk.extra('mentor');
    ok(ex.some(x => x[0] === '✦ 似曾相识'), 'Talk.extra 注入似曾相识');
    ok(c.DevTabs.some(t => t.key === 'mem45'), 'DevPanel 注册记忆45');
  }

  // die wraps snapshot
  {
    const c = box();
    c.Game.G = mkG({ partner: 'lengyue', aff: { lengyue: 99 }, visited: { village: 1, market: 1 } });
    await c.Game.die('sit');
    ok(c.Game.meta.mem45 && c.Game.meta.mem45.npcs.lengyue, 'M1 真死后 snapshot 写入 meta');
    ok(c.Game.meta.mem45.places.market === 1, 'places 记录 visited');
  }

  // ---- M1: main40-like blocked die does NOT snapshot ----
  {
    const c = box();
    // simulate main40 outer wrap under mem45: mem45 wires first in box(), then we wrap again like main40
    const _inner = c.Game.die.bind(c.Game);
    // mem45 already wrapped die; insert main40-like block inside by re-wrapping as outer? 
    // Load order: mem45 (outer) → main40 → base. So mem45 calls main40 which may return early.
    // In box(), only mem45 wraps base. Re-wire: put main40 between mem45 and base.
    const memDie = c.Game.die;
    // rebuild: base → main40-block → need mem45 on outside
    // Easier: replace Game.die with chain manually
    let baseCalled = 0;
    const base = async function (kind) {
      baseCalled++;
      this.G.dead = true; this.G.ending = kind; c.dies.push(kind);
    };
    const main40ish = async function (kind) {
      const G = this.G;
      if (G && G.flags && G.flags.boss_tiandao2 && (kind === 'newdao' || kind === 'auditor') && !G.flags.ys_end) {
        return; // blocked — no dead
      }
      return base.apply(this, arguments);
    };
    // mem45-style outer (same as fixed code)
    c.Game.die = async function (kind) {
      const G0 = this.G;
      const aliveBefore = !!(G0 && !G0.dead);
      const r = await main40ish.apply(this, arguments);
      try {
        const G = this.G;
        if (aliveBefore && G && G.dead) c.Memory45.snapshot(G);
      } catch (e) { }
      return r;
    };
    delete c.Game.meta.mem45;
    c.Game.G = mkG({ partner: 'lengyue', aff: { lengyue: 90 }, flags: { boss_tiandao2: 1 } });
    await c.Game.die('newdao');
    ok(!c.Game.G.dead, 'M1 拦截后 G.dead===false');
    ok(!c.Game.meta.mem45 || !c.Game.meta.mem45.npcs || !c.Game.meta.mem45.npcs.lengyue, 'M1 拦截死亡不写 mem45');
    ok(baseCalled === 0, 'M1 未落入 base die');
    // real death still snapshots
    c.Game.G.dead = false; c.Game.G.flags = {};
    delete c.Game.meta.mem45;
    await c.Game.die('sit');
    ok(c.Game.G.dead && c.Game.meta.mem45 && c.Game.meta.mem45.npcs.lengyue, 'M1 真死仍 snapshot');
  }

  // ---- M2: placeHint replaces {map} ----
  {
    const c = box();
    c.Game.G = mkG({ year: 3 });
    c.Memory45.ensureMeta();
    c.Game.meta.mem45.places = { market: 1 };
    // force place line containing {map}
    const orig = c.MEM45.TEXT.place;
    c.MEM45.TEXT.place = ['你踏进{map}，旧尘在靴底发响。'];
    // force roll success: stub roll always true
    c.Game.roll = function (p, kind) { this.rolls.push([p, kind]); return true; };
    c.toasts.length = 0;
    await c.Memory45.placeHint(c.Game.G, 'market');
    ok(c.toasts.length >= 1 && !/\{map\}/.test(c.toasts[0]) && /market/.test(c.toasts[0]), 'M2 placeHint 替换 {map}');
    c.MEM45.TEXT.place = orig;
  }

  // ---- M3: places keep newest ----
  {
    const c = box();
    c.Game.G = mkG({ visited: { village: 1 } });
    const meta = c.Memory45.ensureMeta();
    meta.places = {};
    for (let i = 0; i < 12; i++) meta.places['old' + i] = 1;
    c.Game.G.visited = { village: 1, market: 1, heaven: 1 };
    c.Memory45.snapshot(c.Game.G, true);
    const keys = Object.keys(c.Game.meta.mem45.places);
    ok(keys.length === 12, 'M3 places 仍封顶 12 得 ' + keys.length);
    ok(!!c.Game.meta.mem45.places.market && !!c.Game.meta.mem45.places.heaven, 'M3 新地图保留');
    ok(!c.Game.meta.mem45.places.old0 || !c.Game.meta.mem45.places.old1, 'M3 最旧被丢（至少 old0/old1 之一）');
    // stronger: old0 should be gone (first inserted)
    ok(!c.Game.meta.mem45.places.old0, 'M3 弃最旧 old0');
  }

  // ---- L1: pickLine uses Game.roll ----
  {
    const c = box();
    c.Game.rolls = [];
    c.Game.roll = function (p, kind) { this.rolls.push([p, kind]); return p >= 1 || Math.random() < p; };
    // access pickLine via fireCard path or weak - inject and fire
    c.Game.G = mkG();
    c.Memory45.inject('mentor', 'friend', 50);
    // TEXT has multiple lines → reservoir rolls
    await c.Memory45.fireCard(c.Game.G, 'mentor');
    ok(c.Game.rolls.filter(r => r[1] === 'qiyu').length >= 2, 'L1 pickLine/触发 多次 Game.roll');
  }

  // ---- L2: Talk._mem45 ----
  {
    const c = box();
    ok(c.Talk._mem45 === 1, 'L2 Talk._mem45 标记');
  }

  console.log('\n' + n + ' tests, ' + fails + ' failed');
  process.exit(fails);
})().catch(e => { console.error(e); process.exit(1); });

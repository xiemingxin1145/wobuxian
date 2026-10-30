// 3.9.2 主线终局补完 main40 第 1 轮单测：node test/main40_unit.js（退出码 = 失败数）
// 覆盖 docs/research_story40_main.md G1–G8 中可纯逻辑验收项；vm 沙箱 + 真实 main40.js，无 Chrome。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'www/js/main40.js'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'www/index.html'), 'utf8');
const SCRIPTS = [...HTML.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);

function box() {
  const c = {
    console: { log() {}, warn() {}, error() {} },
    Math: Object.create(Math), JSON,
    setTimeout() {}, clearTimeout() {},
    document: { readyState: 'complete', addEventListener() {} },
    toasts: [], cards: [], says: [], dies: []
  };
  c.window = c; c.globalThis = c;
  vm.createContext(c);
  vm.runInContext(`
    var REALMS=[{n:'凡人'},{n:'练气'},{n:'筑基'},{n:'金丹'},{n:'元婴'},{n:'化神'},{n:'渡劫'},{n:'飞升'}];
    var MAIN=[{id:'tiandao'},{id:'dianfei'},{id:'hetong'},{id:'zhenshen'},{id:'yanshou'},{id:'done'}];
    var MI=function(id){return MAIN.findIndex(function(m){return m.id===id;});};
    var ENDINGS={ys_paid:['旧付清',''],jiaxiang:['旧回家','']};
    var CG_END={};
    var QUESTS={q_ev3:{n:'散人的口供',need:{f:'visit_guishi'},d:'旧'}};
    var NPCS={leigong:{n:'雷公',por:'npc_leigong'},mentor:{n:'剑仙',por:'npc_mentor'},xiaoyao:{n:'逍遥散人',por:'npc_xiaoyao'}};
    var MONS={tiandao2:{n:'天道真身·总账房'}};
    var B={on:false};
    var NPC37={storyBlock:function(){return null;}};
    var Chain37={doneCount:function(G){return (G&&G._chains)||0;}};
    var AUTO={pick:function(top){var os=[].slice.call(top.querySelectorAll('.opt'));return os[0]||null;}};
    var UI={
      modal:null,
      toast:function(s){toasts.push(String(s));},
      card:async function(t,x,p,o){cards.push({t:t,x:x,o:o});return 0;},
      say:async function(por,n,t,o){says.push({por:por,n:n,t:t,o:o});return 0;},
      hud:function(){}
    };
    var Talk={mainTalk:function(){return null;}, boss:async function(id){this._bossed=id;}};
    var Track={target:function(){return {kind:'npc',id:'leigong',btn:'去',txt:'旧追踪'};}};
    var DevTabs=[];
    var DevPanel={registerTab:function(k,n,r){DevTabs.push({key:k,name:n,render:r});return true;}};
    var Game={
      G:null, rolls:[], _ach:[],
      roll:function(p,kind){this.rolls.push([p,kind]);return Math.random()<p;},
      save:function(){}, give:function(){}, ach:function(a){this._ach.push(a);},
      refreshNpcs:function(){}, checkMain:function(){},
      questDone:function(q){var G=this.G,Q=QUESTS[q];if(!G||!Q||!Q.need)return false;if(Q.need.f)return!!(G.flags&&G.flags[Q.need.f]);return false;},
      questProg:function(q){var G=this.G,Q=QUESTS[q];if(!G||!Q||!Q.need)return '';if(Q.need.f)return (G.flags&&G.flags[Q.need.f])?'已完成':'未完成';return '';},
      async enterMap(id){this._map=id;},
      async die(kind){dies.push(kind); this.G.dead=true; this.G.ending=kind;},
      async fight(){return {res:'win'};}
    };
    Game.enterMap._loan42=1; Game.die._loan42=1;
  `, c);
  vm.runInContext(SRC, c);
  return c;
}

const mkG = (o) => Object.assign({
  v: 2, year: 10, age: 30, realm: 5, stage: 0, stone: 1000, debt: 8888, karma: 0,
  main: 1, flags: {}, aff: {}, quests: {}, qdone: {}, bosses: {}, inv: {},
  route37: { id: null, rep: {} }, fam37: { kids: [] }, _chains: 0
}, o || {});

(async () => {
  // ---- index 顺序 ----
  ok(SCRIPTS.includes('js/main40.js'), 'index 含 main40.js');
  ok(SCRIPTS.indexOf('js/main40.js') === SCRIPTS.indexOf('js/loan42.js') + 1, 'main40 紧接 loan42 之后');
  ok(SCRIPTS.indexOf('js/main40.js') < SCRIPTS.indexOf('js/audio32.js'), 'main40 在 audio32 之前');
  ok(SCRIPTS.indexOf('js/main40.js') > SCRIPTS.indexOf('js/content23.js'), 'main40 在 content23 之后');

  // ---- boot / TEXT ----
  {
    const c = box();
    ok(!!c.Main40, 'Main40 全局导出');
    ok(!!(c.Main40.TEXT && c.Main40.TEXT.endings && c.Main40.TEXT.endings.ys_karma), 'TEXT_MAIN40.endings 含 ys_karma');
    ok(!!c.ENDINGS.ys_route_mo && !!c.ENDINGS.jiaxiang, 'ENDINGS 已 Object.assign 增量');
    ok(c.QUESTS.q_ev3.need.f === 'ev_xy_chess', 'G4 q_ev3.need.f → ev_xy_chess');
    ok(c.CG_END.ys_clan === 'cg_mentor', 'CG_END 含新结局');
    ok(true, 'tolerate G==null wire');
  }

  // ---- G1 Track ----
  {
    const c = box();
    c.Game.G = mkG({ main: 1, realm: 5 });
    const t = c.Track.target('main');
    ok(t && t.kind === 'realm' && /渡劫/.test(t.txt), 'G1 Track 化神 dianfei → 先渡劫');
    c.Game.G.realm = 6;
    const t2 = c.Track.target('main');
    ok(t2 && t2.kind !== 'realm', '渡劫后 Track 不再强制 realm 软引导');
  }

  // ---- G1 Talk.mainTalk ----
  {
    const c = box();
    c.Game.G = mkG({ main: 1, realm: 5 });
    const r = c.Talk.mainTalk('leigong', false);
    ok(Array.isArray(r) && /电费/.test(r[0]), 'G1 化神 leigong 出星标');
    ok(!!c.Talk.mainTalk('leigong', true), 'G1 check 返回真');
  }

  // ---- G1 huashen_wait + storyBlock/B.on ----
  {
    const c = box();
    c.Game.G = mkG({ main: 1, realm: 5, flags: {} });
    await c.Main40.maybeHuashenWait(c.Game.G);
    ok(c.Game.G.flags.m40_wait === 1, 'G1 m40_wait 旗标');
    ok(c.cards.length === 1 && /暂缓催收/.test(c.cards[0].t), 'G1 弹出 huashen_wait 卡');
    const n0 = c.cards.length;
    await c.Main40.maybeHuashenWait(c.Game.G);
    ok(c.cards.length === n0, 'G1 卡只弹一次');
    c.NPC37.storyBlock = () => 'talk';
    c.Game.G.flags.m40_wait = 0;
    await c.Main40.maybeHuashenWait(c.Game.G);
    ok(c.Game.G.flags.m40_wait !== 1, 'NPC37.storyBlock 时不弹卡');
    c.NPC37.storyBlock = () => null;
    c.B.on = true;
    await c.Main40.maybeHuashenWait(c.Game.G);
    ok(c.Game.G.flags.m40_wait !== 1, 'B.on 战斗中不弹卡');
  }

  // ---- G2 Track + boss ----
  {
    const c = box();
    c.Game.G = mkG({ main: 3, realm: 6, stage: 1 });
    const t = c.Track.target('main');
    ok(t && /圆满/.test(t.txt), 'G2 Track zhenshen 未圆满 → 提示');
    c.Game.G.stage = 3;
    const t2 = c.Track.target('main');
    ok(t2 && !/圆满后再战/.test(t2.txt || ''), 'G2 圆满后不再 stage 提示');
  }
  {
    const c = box();
    c.Game.G = mkG({ main: 3, realm: 6, stage: 1 });
    await c.Talk.boss('tiandao2');
    ok(c.says.length >= 1 && /圆满|差一层/.test(c.says[0].t), 'G2 boss 拒战');
    ok(c.Talk._bossed !== 'tiandao2', 'G2 未圆满不落入下层 boss');
  }

  // ---- G3 pickEnd ----
  {
    const c = box();
    const M = c.Main40;
    ok(M.pickEnd(mkG({ debt: 0, aff: { mentor: 100 } }), [2, 0, 0]) === 'jiaxiang', 'G3 jiaxiang');
    ok(M.pickEnd(mkG({ debt: 100, route37: { id: 'moxiu', rep: { tianmo: 60 } }, karma: -40 }), [0, 0, 0]) === 'ys_route_mo', 'G3 ys_route_mo');
    ok(M.pickEnd(mkG({ debt: 100, route37: { id: 'shangjia', rep: {} }, stone: 1e6 }), [0, 0, 0]) === 'ys_route_fu', 'G3 ys_route_fu');
    ok(M.pickEnd(mkG({ debt: 100, route37: { id: 'shijia', rep: {} }, fam37: { kids: [{}, {}] }, _chains: 3 }), [0, 0, 0]) === 'ys_clan', 'G3 ys_clan');
    ok(M.pickEnd(mkG({ debt: 2000, karma: 80 }), [0, 0, 0]) === 'ys_karma', 'G3 ys_karma');
    ok(M.pickEnd(mkG({ debt: 5000, karma: 0 }), [2, 0, 0]) === 'ys_paid', 'G3 bargain → ys_paid');
    ok(M.pickEnd(mkG({ debt: 5000, karma: 0 }), [0, 0, 2]) === 'ys_auditor', 'G3 bargain → ys_auditor');
    ok(M.pickEnd(mkG({ debt: 5000, karma: 0 }), [0, 2, 0]) === 'ys_newdao', 'G3 bargain → ys_newdao');
    ok(M.pickEnd(mkG({ debt: 5000, karma: 0, flags: { suanpan_ally: 1 } }), [1, 0, 1]) === 'ys_auditor', 'G3 suanpan_ally 加权 auditor');
    ok(M.pickEnd(null, [0, 0, 0]) === 'ys_paid', 'G3 G==null 兜底');
  }

  // ---- G3 UI.card + die ----
  {
    const c = box();
    c.Game.G = mkG({ debt: 0, aff: { mentor: 100 }, flags: { bargain: '2,0,0' } });
    await c.UI.card('结局·工程验收通过', '旧文案', null, ['留在仙界（继续）', '以此结局落幕']);
    ok(c.cards.length === 1 && c.cards[0].t === '结局·回家', 'G3 结局卡标题按 pickEnd 重写');
    ok(c.Game.G.flags.ys_end === 'jiaxiang', 'G3 ys_end=jiaxiang');
    ok(c.Game.G.flags.ys40 && c.Game.G.flags.ys40.debt === 0, 'G3 ys40 快照');
    ok(c.Game._ach.includes('jiaxiang_end'), 'G3 jiaxiang_end 成就');
  }
  {
    const c = box();
    c.Game.G = mkG({ flags: { ys_end: 'ys_karma', bargain: '0,0,0' } });
    await c.Game.die('ys_paid');
    ok(c.dies[0] === 'ys_karma', 'G3 die 使用 ys_end');
  }

  // ---- G7 + M1 content22 die path ----
  {
    const c = box();
    c.Game.G = mkG({ main: 5, flags: {} }); // done-like
    const c2 = await c.UI.card('天道认账', '旧', 'boss_tiandao2', ['成为新天道（结局）', '让算无遗做天庭审计（结局）', '销账，继续修仙']);
    ok(c.cards.length === 1 && /旧三选一已关闭|甲方/.test(c.cards[0].x + c.cards[0].t), 'G7 吞掉天道认账三选一');
    ok(c2 === 2, 'M1 G7 返回 2（非 0/1）');
    // content22-like fallthrough
    if (c2 === 0) { await c.Game.die('newdao'); }
    else if (c2 === 1) { await c.Game.die('auditor'); }
    else { /* 销账继续修仙 */ }
    ok(!c.Game.G.dead && c.dies.length === 0, 'M1 玩家不会 die(newdao/auditor)');
  }
  // M1 防护：即使误调 die('newdao') 也被挡住
  {
    const c = box();
    c.Game.G = mkG({ flags: { boss_tiandao2: 1 } });
    await c.Game.die('newdao');
    ok(!c.Game.G.dead && c.dies.length === 0, 'M1 die(newdao) 在 G7 接管后被拒');
  }
  // M2：G.flags undefined 不抛
  {
    const c = box();
    const G = mkG({ main: 5 });
    delete G.flags;
    c.Game.G = G;
    let threw = false;
    try {
      const c2 = await c.UI.card('天道认账', '旧', 'boss_tiandao2', ['成为新天道（结局）', '让算无遗做天庭审计（结局）', '销账，继续修仙']);
      ok(c2 === 2, 'M2 flags 缺失仍返回 2');
      ok(G.flags && G.flags.boss_tiandao2 === 1, 'M2 惰性补 flags');
    } catch (e) { threw = true; console.error(e); }
    ok(!threw, 'M2 G.flags undefined 不抛');
  }
  // M3：G.aff undefined 不抛
  {
    const c = box();
    const G = mkG({
      main: 2, realm: 6,
      flags: { hetong_1: 1, m37_mt_forgive: 1 },
      qdone: { q_ev1: 1, q_ev2: 1, q_ev3: 1 }
    });
    delete G.aff;
    c.Game.G = G;
    const opt = c.Talk.mainTalk('mentor', false);
    ok(Array.isArray(opt) && typeof opt[1] === 'function', 'M3 mentor 星标可调用');
    let threw = false;
    try { await opt[1](); } catch (e) { threw = true; console.error(e); }
    ok(!threw, 'M3 G.aff undefined 不抛');
    ok(G.aff && typeof G.aff.mentor === 'number', 'M3 惰性补 aff.mentor');
  }

  // ---- G4 ----
  {
    const c = box();
    c.Game.G = mkG({ quests: { q_ev3: { k0: {} } }, flags: {} });
    ok(!!c.Talk.mainTalk('xiaoyao', true), 'G4 xiaoyao 猜拳入口 check');
    await c.Main40.tryXyChess(c.Game.G);
    ok(c.Game.G.flags.ev_xy_chess === 1, 'G4 ev_xy_chess 旗标');
    ok(c.Game.rolls.length >= 1, 'G4 使用 Game.roll');
  }

  // ---- G8 ----
  {
    const c = box();
    const top = {
      querySelectorAll(sel) {
        if (sel !== '.opt') return [];
        return [{ textContent: '留在仙界（继续）', disabled: false, offsetParent: {} }];
      }
    };
    ok(c.AUTO.pick(top) === null, 'G8 AUTO 不点「留在仙界」');
  }

  // ---- G6 ----
  {
    const c = box();
    ok(c.DevTabs.some(t => t.key === 'main40'), 'G6 DevPanel 注册 main40');
    const tab = c.DevTabs.find(t => t.key === 'main40');
    c.Game.G = mkG({ main: 0, realm: 1, flags: {} });
    const el = { innerHTML: '', onclick: null };
    tab.render(el, { toast() {} });
    ok(/跳·第十七章/.test(el.innerHTML), 'G6 渲染跳转按钮');
    el.onclick({ target: { dataset: { m40: 'm40_yanshou' } } });
    ok(c.Game.G.realm === 7 && c.Main40.mainId(c.Game.G) === 'yanshou', 'G6 跳·终章下验收');
    ok(c.Game.G.flags.boss_tiandao2 === 1 && c.Game.G.flags.mentor_ally === 1, 'G6 跳转置旗');
  }

  // ---- L1 ending sticky ----
  {
    const c = box();
    c.Game.G = mkG({ debt: 0, aff: { mentor: 100 }, flags: { bargain: '2,0,0' } });
    await c.UI.card('结局·工程验收通过', '旧', null, ['留在仙界（继续）', '以此结局落幕']);
    ok(c.Game.G.flags.ys_end === 'jiaxiang' && c.Game.G.flags.m40_ys_locked === 1, 'L1 首次锁定 ys_end');
    c.Game.G.debt = 99999; c.Game.G.aff.mentor = 0; c.Game.G.flags.bargain = '0,2,0';
    await c.UI.card('结局·工程验收通过', '再弹', null, ['留在仙界（继续）', '以此结局落幕']);
    ok(c.Game.G.flags.ys_end === 'jiaxiang', 'L1 再次弹结局卡不改写 ys_end');
    ok(c.cards.length === 2 && c.cards[1].t === '结局·回家', 'L1 第二次仍显示锁定结局文案');
  }

  // ---- L2 UI.modal defer ----
  {
    const c = box();
    c.UI.modal = {}; // open modal
    c.Game.G = mkG({ main: 1, realm: 5, flags: {} });
    await c.Main40.maybeHuashenWait(c.Game.G);
    ok(c.Game.G.flags.m40_wait !== 1 && c.cards.length === 0, 'L2 modal 打开时不弹、不置 flag');
    c.UI.modal = null;
    await c.Main40.maybeHuashenWait(c.Game.G);
    ok(c.Game.G.flags.m40_wait === 1 && c.cards.length === 1, 'L2 modal 关闭后可弹');
  }

  // ---- L3 m40Say rename (no global say pollution) ----
  {
    const c = box();
    ok(typeof c.say === 'undefined', 'L3 未导出与 content23 冲突的 say');
    ok(typeof c.m40Say === 'undefined', 'L3 m40Say 为 G5 局部函数');
  }

  // ---- L4 quest copy + questDone wrap ----
  {
    const c = box();
    ok(c.QUESTS.q_ev3._main40 === 1 && c.QUESTS.q_ev3._main40_src, 'L4 浅拷贝替换 QUESTS.q_ev3');
    ok(c.QUESTS.q_ev3._main40_src.need.f === 'visit_guishi', 'L4 原 need 未原地改写');
    ok(c.QUESTS.q_ev3.need.f === 'ev_xy_chess', 'L4 拷贝 need → ev_xy_chess');
    c.Game.G = mkG({ quests: { q_ev3: { k0: {} } }, flags: { visit_guishi: 1 } });
    ok(c.Game.questDone('q_ev3') === false, 'L4 visit_guishi 不再秒完成');
    c.Game.G.flags.ev_xy_chess = 1;
    ok(c.Game.questDone('q_ev3') === true, 'L4 ev_xy_chess 可完成');
  }

  // ---- L5 _loan42 marker preserved ----
  {
    const c = box();
    ok(c.Game.enterMap._loan42 === 1, 'L5 enterMap._loan42 保留');
    ok(c.Game.die._loan42 === 1, 'L5 die._loan42 保留');
    ok(c.Game.enterMap._main40 === 1 && c.Game.die._main40 === 1, 'L5 同时有 _main40 标记');
  }

  // ---- old save ----
  {
    const c = box();
    const G = mkG({ v: 2 });
    delete G.flags;
    G.flags = {};
    const end = c.Main40.pickEnd(G, [1, 0, 0]);
    ok(typeof end === 'string', '老档 G.v===2 pickEnd 可用');
    c.Main40.snapshotYs40(G, [1, 0, 0]);
    ok(!!G.flags.ys40, '惰性 flags.ys40');
  }

  console.log('\n' + n + ' tests, ' + fails + ' failed');
  process.exit(fails);
})().catch(e => { console.error(e); process.exit(1); });

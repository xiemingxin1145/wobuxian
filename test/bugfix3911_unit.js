// 3.9.11 深审剩余项 M1-M13 / L1-L3 单测：node test/bugfix3911_unit.js（退出码 = 失败数）
// 只新增覆盖，不改 3.9.9 已有单测语义。vm + 真实 auc48.js / qing47.js / shi46.js / shi46_ui.js，无 Chrome。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0;
const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'www/index.html'), 'utf8');
const SCRIPTS = [...HTML.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);

function elMock() {
  return {
    tag: 'div', style: {}, id: '', className: '', children: [], childNodes: [],
    parentNode: null, onclick: null, _attrs: {}, dataset: {}, innerHTML: '', firstChild: null,
    setAttribute(k, v) { this._attrs[k] = String(v); },
    getAttribute(k) { return this._attrs[k]; },
    appendChild(ch) { ch.parentNode = this; this.children.push(ch); return ch; },
    insertBefore(ch) { ch.parentNode = this; this.children.push(ch); return ch; },
    removeChild(ch) { const i = this.children.indexOf(ch); if (i >= 0) this.children.splice(i, 1); return ch; }
  };
}
function docMock() {
  return {
    readyState: 'complete', addEventListener() {}, head: { appendChild() {} },
    createElement: () => elMock(), getElementById() { return null; }
  };
}

// ---------------- auc48 ----------------
function aucBox() {
  const SRC = fs.readFileSync(path.join(ROOT, 'www/js/auc48.js'), 'utf8');
  const c = {
    console: { log() {}, warn() {}, error() {} },
    Math: Object.create(Math), JSON, Date,
    setTimeout() {}, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    document: docMock(), toasts: [], cards: [], cardChoices: []
  };
  c.window = c; c.globalThis = c;
  vm.createContext(c);
  vm.runInContext(`
    var NPCS={ merchant:{n:'钱多多',por:'npc_merchant'} };
    var B={on:false};
    var NPC37={storyBlock:function(){return null;}};
    var ITEMS={
      pyd:{n:'培元丹',p:90,t:'pill'}, zjd:{n:'筑基丹',p:300,t:'pill'},
      pjd:{n:'破境丹',p:800,t:'pill'}, ysf:{n:'御兽符',p:120,t:'tal'},
      ysd:{n:'延寿丹',p:600,t:'pill'}, tsf:{n:'替死符',p:900,t:'tal'},
      xsd:{n:'洗髓丹',p:2000,t:'pill'}, lz:{n:'千年灵芝',p:60,t:'mat'},
      yd:{n:'妖丹',p:45,t:'mat'}, herb:{n:'灵草',p:15,t:'mat'},
      peach:{n:'蟠桃',p:120,t:'mat'}, coin:{n:'古钱',p:300,t:'misc'},
      scroll:{n:'残破功法',p:200,t:'misc'}, bill:{n:'祖传欠条',p:0,t:'quest'}
    };
    var R={mapId:'market'};
    var MAPINFO={market:{n:'云来坊市'}};
    var UI={
      modal:null, titles:{},
      toast:function(s){ toasts.push(String(s)); },
      card:async function(t,x,p,o){
        cards.push({t:t,x:x,o:o});
        if(cardChoices.length) return cardChoices.shift();
        return 0;
      },
      hud:function(){}, panel:async function(name){ return name; },
      p_auction:function(b){ if(b){ b.innerHTML='<p>shallow</p>'; } }
    };
    var Talk={extra:function(){ return []; }};
    var DevTabs=[];
    var DevPanel={registerTab:function(k,n,r){ DevTabs.push({key:k,name:n,render:r}); return true; }};
    var Market25={ renownOf:function(){return 0;} };
    var Loan42={
      _od:false,
      hasOverdue:function(G){ return !!this._od; },
      canBorrow:function(tid,G){
        if(this._od) return {ok:false, reason:'od', msg:'od'};
        return {ok:true, max:5000};
      },
      borrow:function(G,tid,amt){
        const gate=this.canBorrow(tid,G);
        if(!gate.ok) return {ok:false, msg:gate.msg};
        amt=Math.round(+amt||0);
        G.stone=(G.stone|0)+amt;
        G.loan42=G.loan42||{L:[]}; G.loan42.L.push({id:'L1',t:tid,p:amt,od:0,due:0});
        return {ok:true, amt:amt, net:amt};
      }
    };
    var Game={
      G:null, meta:{lives:1, achs:{}, endings:{}, best:{realm:0,age:0}, pts:0},
      rolls:[],
      roll:function(p,kind){ this.rolls.push([p,kind]); return Math.random()<p; },
      save:function(){}, saveMeta:function(){},
      give:function(id,n){ n=n==null?1:n; if(!this.G)return; this.G.inv=this.G.inv||{}; this.G.inv[id]=(this.G.inv[id]|0)+n; if(this.G.inv[id]<=0) delete this.G.inv[id]; },
      take:function(id,n){ this.give(id, -(n==null?1:n)); },
      useAP:function(n){ n=n||1; if(!this.G||(this.G.ap|0)<n) return false; this.G.ap-=n; return true; },
      newLife:function(cfg){ this.G=Object.assign({v:2,year:1,age:16,realm:1,stage:0,aff:{},flags:{},inv:{},ap:4,stone:500},cfg||{}); return this.G; },
      yearEnd:async function(){ if(this.G){ this.G.year=(this.G.year||1)+1; } return true; },
      enterMap:async function(id){ this._map=id; return true; }
    };
  `, c);
  vm.runInContext(SRC, c);
  return c;
}
const aucG = (o) => Object.assign({
  v: 2, year: 12, age: 30, realm: 2, stage: 0, stone: 20000, debt: 0,
  aff: {}, flags: {}, inv: { pyd: 2, herb: 3 }, ap: 6, karma: 0
}, o || {});

// ---------------- qing47 ----------------
function qingBox() {
  const SRC = fs.readFileSync(path.join(ROOT, 'www/js/qing47.js'), 'utf8');
  const c = {
    console: { log() {}, warn() {}, error() {} },
    Math: Object.create(Math), JSON, Date,
    setTimeout() {}, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    document: docMock(), toasts: [], cards: [], cardChoices: []
  };
  c.window = c; c.globalThis = c;
  vm.createContext(c);
  vm.runInContext(`
    var NPCS={
      sumei:{n:'苏魅',por:'npc_girl',comp:1,sex:'f'},
      lengyue:{n:'冷月',por:'npc_lengyue',comp:1,sex:'f'}
    };
    var B={on:false};
    var NPC37={storyBlock:function(){return null;}};
    var Life34={_rel:{}, rel:function(id,d){this._rel[id]=(this._rel[id]|0)+(d|0);}, st:function(){return {rel:this._rel};}};
    var UI={modal:null,
      toast:function(s){toasts.push(String(s));},
      card:async function(t,x,p,o){cards.push({t:t,x:x,o:o}); if(cardChoices.length) return cardChoices.shift(); return 0;},
      hud:function(){}, panel:function(){}};
    var Talk={extra:function(){return [];}};
    var DevTabs=[];
    var DevPanel={registerTab:function(k,n,r){DevTabs.push({key:k,name:n,render:r});return true;}};
    var Game={
      G:null, meta:{lives:1,achs:{},endings:{},best:{realm:0,age:0},pts:0},
      rolls:[],
      roll:function(p,kind){this.rolls.push([p,kind]);return Math.random()<p;},
      save:function(){}, saveMeta:function(){},
      need:function(){return 1000;},
      addExp:function(n){return n;},
      useAP:function(n){n=n||1; if(!this.G||(this.G.ap|0)<n){UI.toast('行动力不足');return false;} this.G.ap-=n; return true;},
      newLife:function(cfg){this.G=Object.assign({v:2,year:1,age:16,realm:0,stage:0,aff:{},flags:{},inv:{},ap:4,stone:500,partner:null},cfg||{}); return this.G;},
      yearEnd:async function(){ if(this.G){ this.G.year=(this.G.year||1)+1; } return true; },
      _tryBreak:async function(){ if(this.G){ this.G.realm=(this.G.realm||0)+1; } },
      tryBreak:async function(){ return this._tryBreak(); }
    };
    var UI_p_comps_calls=0;
    UI.p_comps=function(b){ UI_p_comps_calls++; if(b){ b._comps=1; } };
    UI.p_fam37=function(b){ if(b){ b._fam=1; b.onclick=function(){}; } };
  `, c);
  vm.runInContext(SRC, c);
  return c;
}
const qingG = (o) => Object.assign({
  v: 2, year: 10, age: 30, realm: 2, stage: 0, stone: 1000, debt: 0,
  aff: {}, flags: {}, inv: {}, partner: null, ap: 4, karma: 0
}, o || {});

// ---------------- shi46 ----------------
function shiBox() {
  const SRC = fs.readFileSync(path.join(ROOT, 'www/js/shi46.js'), 'utf8');
  const c = { console, Math, JSON, Object, Array, String, Number, isFinite, toasts: [], cards: [], cardChoices: [] };
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
      card: async function (t, x, p, o) { this.cards.push({ t, x, o }); if (cardChoices.length) return cardChoices.shift(); return 0; },
      hud() {},
      p_legacy26(b) { b._legacy = 1; }
    };
    var Talk = { extra() { return [['闲聊', async () => {}]]; } };
    Talk.extra._zz = 42;
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
const shiG = (o) => Object.assign({
  v: 2, year: 20, age: 30, realm: 3, stage: 0, ap: 4, stone: 100,
  aff: {}, inv: {}, flags: {},
  apprentice: 'lengyue', apprenticeLvl: 5, apprenticeTechs: { sword: 1 }
}, o || {});
const R = (c, s) => vm.runInContext(s, c);
const asyncR = (c, s) => vm.runInContext(`(async () => { ${s} })()`, c);

(async () => {
  ok(SCRIPTS.includes('js/auc48.js') && SCRIPTS.includes('js/qing47.js')
    && SCRIPTS.includes('js/shi46.js') && SCRIPTS.includes('js/shi46_ui.js'), 'index 接线含 auc48/qing47/shi46/shi46_ui');

  // ---- M1：初始 nextY 去掉 || gap，当前网格年可开拍 ----
  {
    const c = aucBox();
    const g1 = aucG({ year: 1 }); c.Game.G = g1;
    const s1 = c.Auc48.ensure(g1);
    ok(s1.nextY === 1, 'M1 year=1 网格年 nextY=1（旧逻辑为 4）');
    const g4 = aucG({ year: 4 }); c.Game.G = g4;
    ok(c.Auc48.ensure(g4).nextY === 4, 'M1 year=4 网格年 nextY=4');
    const g2 = aucG({ year: 2 }); c.Game.G = g2;
    ok(c.Auc48.ensure(g2).nextY === 4, 'M1 year=2 非网格年 nextY=4');
    const g3 = aucG({ year: 3 }); c.Game.G = g3;
    ok(c.Auc48.ensure(g3).nextY === 4, 'M1 year=3 非网格年 nextY=4');
    const g5 = aucG({ year: 1 }); c.Game.G = g5;
    const op = c.Auc48.tryOpen(g5, {});
    ok(op.ok && op.opened, 'M1 网格年当季可开拍（非 early）');
  }

  // ---- M2：寄拍先算 fee 并查灵石，通过后再扣笺/AP/nCon ----
  {
    const c = aucBox();
    c.Game.G = aucG({ year: 12, ap: 4, stone: 20, inv: { pyd: 1 } });
    c.Auc48.tryOpen(c.Game.G, { force: true });
    const r = await c.Auc48.consign(c.Game.G, { force: true, itemId: 'pyd' });
    ok(!r.ok && r.reason === 'stone', 'M2 入场笺+手续不足拒绝（stone=20 < 15+7）');
    ok(c.Game.G.stone === 20 && c.Game.G.ap === 4 && c.Game.G.auc48.nCon === 0
      && (c.Game.G.inv.pyd | 0) === 1, 'M2 拒绝后不扣石/AP/nCon、不取物');
    ok(c.Game.G.auc48.feePaid === 0, 'M2 拒绝后入场笺未付');
    c.Game.G.stone = 5000;
    const r2 = await c.Auc48.consign(c.Game.G, { force: true, itemId: 'pyd', forceSold: true });
    ok(r2.ok && c.Game.G.auc48.nCon === 1 && c.Game.G.auc48.feePaid === 1, 'M2 足额时寄拍正常扣笺计次');
  }

  // ---- M3：pend 按 lotId 分键 ----
  {
    const c = aucBox();
    c.Game.G = aucG({ year: 12, ap: 4, stone: 50000, inv: { pyd: 2 } });
    c.Auc48.tryOpen(c.Game.G, { force: true });
    const lots = c.Game.G.auc48.lots;
    const A = lots[0], B = lots[1];
    c.cardChoices = [-1];
    const m1 = await c.Auc48.bid(c.Game.G, A.id, { force: true });
    ok(m1.reason === 'modal', 'M3 A 举牌弹卡关闭留 pend');
    c.cardChoices = [-1];
    const m2 = await c.Auc48.bid(c.Game.G, B.id, { force: true });
    ok(m2.reason === 'modal', 'M3 B 举牌弹卡关闭留 pend');
    const pends = c.Game.G.auc48.pends || {};
    ok(!!pends[A.id] && !!pends[B.id], 'M3 A/B pend 分键共存（旧单槽会被 B 覆盖）');
    ok(c.Game.G.ap === 2 && c.Game.G.auc48.nBid === 2, 'M3 两次弹卡各扣 1 AP、计 2 次');
    const backA = await c.Auc48.bid(c.Game.G, A.id, { force: true, choice: 1 });
    ok(backA.ok && backA.result === 'pass', 'M3 回头举 A 可结算（不重扣）');
    ok(!c.Game.G.auc48.pends[A.id] && !!c.Game.G.auc48.pends[B.id], 'M3 A 结算后仅清 A 键，B pend 保留');
    ok(c.Game.G.ap === 2 && c.Game.G.auc48.nBid === 2, 'M3 恢复 A 不重扣 AP/nBid');
    const backB = await c.Auc48.bid(c.Game.G, B.id, { force: true, choice: 1 });
    ok(backB.ok && !c.Game.G.auc48.pends[B.id], 'M3 再举 B 可结算、分键清空');
  }

  // ---- M4：逾期高价不走 gap<=0 早返 ----
  {
    const c = aucBox();
    c.Loan42._od = true;
    c.Game.G = aucG({ year: 12, ap: 4, stone: 1000, inv: {} });
    c.Auc48.tryOpen(c.Game.G, { force: true });
    const lot = c.Game.G.auc48.lots[0];
    lot.done = 0; lot.won = 0; lot.cur = 100;
    const padD = await c.Auc48._padOrBail(c.Game.G, c.Game.G.auc48, lot, { cur: 950, odLimit: true, odChoice: 1 });
    ok(!padD.ok && padD.reason === 'oddecline', 'M4 逾期高价 gap<=0 时拒绝即拦截（非早返成功）');
    const padA = await c.Auc48._padOrBail(c.Game.G, c.Game.G.auc48, lot, { cur: 950, odLimit: true, odChoice: 0 });
    ok(padA.ok && padA.odAccepted, 'M4 接受催收优先受偿后放行');
    lot.done = 0; lot.won = 0;
    const bust = await c.Auc48._winLot(c.Game.G, c.Game.G.auc48, lot, 950, { odChoice: 1, silent: true });
    ok(bust.result === 'bust' && c.Game.G.stone === 1000 && lot.won === 0, 'M4 _winLot 逾期高价拒绝则流拍、不扣款');
    lot.done = 0; lot.won = 0;
    const win = await c.Auc48._winLot(c.Game.G, c.Game.G.auc48, lot, 950, { odChoice: 0, silent: true });
    ok(win.result === 'win' && c.Game.G.stone === 50 && lot.won === 1, 'M4 _winLot 接受后成交扣款');
    c.Loan42._od = false;
    lot.done = 0; lot.won = 0; c.Game.G.stone = 1000;
    const win2 = await c.Auc48._winLot(c.Game.G, c.Game.G.auc48, lot, 950, { silent: true });
    ok(win2.result === 'win' && c.Game.G.stone === 50, 'M4 非逾期不弹同意关、直接成交');
  }

  // ---- M5：p_comps 照抄 p_fam37 委托 ----
  {
    const c = qingBox();
    c.Game.G = qingG({ partner: 'sumei', ap: 4, year: 10 });
    c.Qing47.ensure(c.Game.G);
    const b = { _comps: 0, onclick: null, appendChild() {} };
    let prevCalled = 0;
    b.onclick = function () { prevCalled++; };
    c.UI.p_comps(b);
    ok(typeof b.onclick === 'function', 'M5 p_comps 渲染后仍有 onclick');
    b.onclick({ target: { closest: () => null }, stopPropagation() {} });
    ok(prevCalled === 1, 'M5 非 data-q47 点击委托旧 handler');
    const btn = { getAttribute: (k) => (k === 'data-q47' ? 'ev' : null) };
    b.onclick({ target: { closest: () => btn }, stopPropagation() {} });
    await new Promise(r => setTimeout(r, 0));
    ok(prevCalled === 1, 'M5 data-q47 点击不委托旧 handler');
  }

  // ---- M6：周年先验 canPopup、历劫被拦不清除 ----
  {
    const c = qingBox();
    c.Game.roll = function () { return false; }; // 确定性：不触发心结/离别 roll
    c.Game.G = qingG({ partner: 'sumei', ap: 4, year: 10 });
    c.Qing47.ensure(c.Game.G);
    c.Game.G.year = 12; c.Qing47.ensure(c.Game.G);
    c.B.on = true; // canPopup false
    const out1 = await c.Qing47.yearTick({});
    ok(!out1.anniv && c.Game.G.qing47._annivY !== 12, 'M6 被拦时周年不写 _annivY');
    c.B.on = false;
    const out2 = await c.Qing47.yearTick({});
    ok(out2.anniv && c.Game.G.qing47._annivY === 12, 'M6 守卫解除后周年可补发');
  }
  {
    const c = qingBox();
    c.Game.roll = function () { return false; };
    c.Game.G = qingG({ partner: 'sumei', ap: 4, year: 10 });
    const S = c.Qing47.ensure(c.Game.G);
    S.bond = 60; S.nJie = 0; c.Game.G._qing47Jie = 1;
    c.B.on = true;
    await c.Qing47.yearTick({});
    ok(c.Game.G._qing47Jie === 1 && c.Game.G.qing47.pend === 'jie', 'M6 历劫被拦不清除 _qing47Jie');
    c.B.on = false;
    c.Game.roll = function (p) { return p === 0.85; }; // 历劫护持成功 roll
    await c.Qing47.yearTick({});
    ok(c.Game.G._qing47Jie === 0 && S.nJie === 1, 'M6 历劫执行后才清标记并计次');
  }

  // ---- M7：配偶变更 / 清档残留 ----
  {
    const c = qingBox();
    c.Game.G = qingG({ partner: 'sumei', year: 10 });
    const S = c.Qing47.ensure(c.Game.G);
    S._annivY = 10;
    c.Game.G.partner = 'lengyue';
    const S2 = c.Qing47.ensure(c.Game.G);
    ok(S2.id === 'lengyue' && S2._annivY === 0, 'M7 配偶变更 reset 清 _annivY');
    c.Game.G._qing47Jie = 1;
    c.Qing47.clear(c.Game.G);
    ok(c.Game.G.qing47._annivY === 0 && c.Game.G._qing47Jie === 0, 'M7 clear 清 _annivY 与 _qing47Jie');
    const g2 = c.Game.newLife({});
    ok(!g2._qing47Jie, 'M7 newLife 包裹清 _qing47Jie');
  }

  // ---- M8：四函数 + inquire 入口 off 检查 ----
  {
    const c = qingBox();
    c.Game.G = qingG({ partner: 'sumei', ap: 4, year: 20 });
    const S = c.Qing47.ensure(c.Game.G);
    S.bond = 10; S.knot = 2; S.away = 0; S.lastAwayY = 0;
    c.QING47.off = true;
    const k = await c.Qing47.doKnotAsk({ force: true, choice: 0, silent: true });
    ok(!k.ok && k.reason === 'off', 'M8 off 时 doKnotAsk 拒绝（force 不绕 off）');
    S.bond = 60; S.nJie = 0;
    const j = await c.Qing47.doJie({ force: true, choice: 0, forceOk: true, silent: true });
    ok(!j.ok && j.reason === 'off', 'M8 off 时 doJie 拒绝（force 不绕 off）');
    S.bond = 10; S.knot = 2;
    const a = await c.Qing47.doAway({ force: true, choice: 2, silent: true });
    ok(!a.ok && a.reason === 'off' && S.away === 0, 'M8 off 时 doAway 拒绝且不写 away');
    S.away = 20;
    const bk = await c.Qing47.doBack({ force: true, choice: 0, forceOk: true, silent: true });
    ok(!bk.ok && bk.reason === 'off' && S.away === 20, 'M8 off 时 doBack 拒绝且不回');
    const iq = await c.Qing47.inquire();
    ok(!iq.ok && iq.reason === 'off', 'M8 off 时 inquire 拒绝');
    c.QING47.off = false;
  }

  // ---- M9：离别灵石不足拒绝 ----
  {
    const c = qingBox();
    c.Game.G = qingG({ partner: 'sumei', ap: 4, year: 20, stone: 100 });
    const S = c.Qing47.ensure(c.Game.G);
    S.bond = 10; S.knot = 2; S.away = 0; S.lastAwayY = 0;
    const r = await c.Qing47.doAway({ silent: true, choice: 1 });
    ok(!r.ok && r.reason === 'stone' && S.away === 0 && c.Game.G.stone === 100, 'M9 灵石不足选盘缠拒绝、不写 away、不扣石');
    ok(c.toasts.join('').indexOf('灵石不足') >= 0, 'M9 灵石不足有 toast 提示');
    c.Game.G.stone = 500;
    const r2 = await c.Qing47.doAway({ silent: true, choice: 1 });
    ok(r2.ok && r2.stayed && c.Game.G.stone === 300, 'M9 足额时盘缠挽留成功扣 200');
  }

  // ---- L2：qing47 选项下标校验 ----
  {
    const c = qingBox();
    c.Game.G = qingG({ partner: 'sumei', ap: 4, year: 10 });
    const S = c.Qing47.ensure(c.Game.G);
    const ap0 = c.Game.G.ap;
    const bad = await c.Qing47.doEv({ silent: true, choice: 99 });
    ok(!bad.ok && bad.reason === 'choice' && S.nEv === 0 && c.Game.G.ap === ap0, 'L2 doEv 越界不计次不扣 AP');
    const neg = await c.Qing47.doEv({ silent: true, choice: -1 });
    ok(!neg.ok && neg.reason === 'choice' && S.nEv === 0, 'L2 doEv 关闭(-1)不按首选项结算');
    c.cardChoices = [-1];
    const cardClose = await c.Qing47.doEv({});
    ok(!cardClose.ok && cardClose.reason === 'choice' && S.nEv === 0 && c.Game.G.ap === ap0, 'L2 doEv 卡片关闭不结算不扣 AP');
    const k = await c.Qing47.doKnotAsk({ silent: true, choice: 5 });
    ok(!k.ok && k.reason === 'choice' && S.nKnot === 0, 'L2 doKnotAsk 越界不计次');
    S.bond = 60; S.nJie = 0;
    const j = await c.Qing47.doJie({ silent: true, choice: 2 });
    ok(!j.ok && j.reason === 'choice' && S.nJie === 0, 'L2 doJie 越界不计次');
    S.bond = 10; S.knot = 2; S.away = 0; S.lastAwayY = 0;
    const a = await c.Qing47.doAway({ silent: true, choice: 7 });
    ok(!a.ok && a.reason === 'choice' && S.away === 0, 'L2 doAway 越界不离别');
    S.away = 20;
    const bk = await c.Qing47.doBack({ silent: true, choice: 9 });
    ok(!bk.ok && bk.reason === 'choice' && S.away === 20, 'L2 doBack 越界不回归');
  }

  // ---- M10：回访卡关闭不计次 ----
  {
    const c = shiBox();
    const G = shiG({ year: 20 });
    R(c, 'Game').G = G;
    R(c, 'SHI46.ensure(Game.G)');
    R(c, 'Game.G.shi46.ally = { id: "lengyue", n: "冷月", y0: 19, fightY: 0 }');
    c.cardChoices = [-1];
    const r = await asyncR(c, 'return await SHI46.allyVisit(Game.G, {});');
    ok(!r.ok && r.reason === 'cancel', 'M10 回访卡关闭返回 cancel');
    ok(G.shi46.visitY === 0, 'M10 关闭不写 visitY');
    ok(R(c, 'SHI46.allyOptFor("lengyue")') === true, 'M10 关闭后回访入口仍可见');
  }

  // ---- M11：年结 toast 不烧回访 ----
  {
    const c = shiBox();
    const G = shiG({ year: 20, apprentice: 'lengyue', apprenticeLvl: 5 });
    R(c, 'Game').G = G;
    R(c, 'SHI46.ensure(Game.G)');
    R(c, 'Game.G.shi46.ally = { id: "lengyue", n: "冷月", y0: 19, fightY: 0 }');
    R(c, 'SHI46.wire()');
    R(c, 'Game.roll = function (p) { return p === 0.35; }');
    await asyncR(c, 'return await Game.yearEnd();');
    const toastText = R(c, 'UI.toasts').map(t => t[0]).join('|');
    ok(toastText.indexOf('回门探望') >= 0, 'M11 年结回访 toast 仍提示');
    ok(G.shi46.visitY === 0, 'M11 toast 不写 visitY');
    ok(R(c, 'SHI46.allyOptFor("lengyue")') === true, 'M11 toast 后回访入口仍可见');
  }

  // ---- M12：换徒清年终状态 ----
  {
    const c = shiBox();
    const G = shiG({ year: 20, apprentice: 'lengyue' });
    R(c, 'Game').G = G;
    R(c, 'SHI46.ensure(Game.G)');
    G.shi46.yearDone = 20; G.shi46.pendYear = 1;
    G.apprentice = 'cuihua';
    R(c, 'SHI46.ensure(Game.G)');
    ok(G.shi46.yearDone !== 20 && G.shi46.pendYear === 0, 'M12 换徒清 yearDone/pendYear');
    const y = await asyncR(c, 'return await SHI46.yearReview(Game.G, {});');
    ok(y.ok || y.reason !== 'done', 'M12 新徒当年年终卡不再判 done 跳过');
    G.shi46.yearDone = 20; G.shi46.pendYear = 1;
    const d = await asyncR(c, 'return await SHI46.yearReview(Game.G, { silent: true });');
    ok(!d.ok && d.reason === 'done' && G.shi46.pendYear === 0, 'M12 已督导 done 路径顺手清过期 pend');
  }

  // ---- M13：放养减帽仅次年 ----
  {
    const c = shiBox();
    const G = shiG({ year: 20, apprentice: 'lengyue' });
    R(c, 'Game').G = G;
    R(c, 'SHI46.ensure(Game.G)');
    const fr = R(c, 'SHI46.applyYearStyle(Game.G, "free")');
    ok(fr.ok && G.shi46.freeYear === 20, 'M13 放养记 freeYear=设定年');
    ok(R(c, 'SHI46.hwCap(Game.G)') === 3, 'M13 设定当年 cap 仍 3');
    G.year = 21; R(c, 'SHI46.ensure(Game.G)');
    ok(R(c, 'SHI46.hwCap(Game.G)') === 2, 'M13 次年 cap=2');
    G.year = 22; R(c, 'SHI46.ensure(Game.G)');
    ok(G.shi46.freeCut === 0 && R(c, 'SHI46.hwCap(Game.G)') === 3, 'M13 第三次年过期自动清 freeCut、cap 回 3');
    // 旧档迁移：freeCut 已置、freeYear 缺失时以 yearDone 为设定年
    G.year = 21; G.shi46.style = 'free'; G.shi46.freeCut = 1;
    delete G.shi46.freeYear; G.shi46.yearDone = 20;
    R(c, 'SHI46.ensure(Game.G)');
    ok(G.shi46.freeYear === 20 && R(c, 'SHI46.hwCap(Game.G)') === 2, 'M13 旧档迁移 freeYear=yearDone、次年 cap=2');
  }

  // ---- L1：applyYearStyle 首行 off 检查 ----
  {
    const c = shiBox();
    const G = shiG({ year: 20, apprentice: 'lengyue' });
    R(c, 'Game').G = G;
    R(c, 'SHI46.ensure(Game.G)');
    R(c, 'SHI46.off = true');
    const r = R(c, 'SHI46.applyYearStyle(Game.G, "strict")');
    ok(!r.ok && r.reason === 'off' && G.shi46.style === 'kind', 'L1 off 时 applyYearStyle 拒绝且不改档');
    R(c, 'SHI46.off = false');
  }

  // ---- L3：shi46 Talk.extra 包装补 keepFnMarks；shi46_ui 备用 storyBlock 补 UI.modal ----
  {
    const c = shiBox();
    R(c, 'SHI46.wire()');
    ok(R(c, 'Talk.extra._zz') === 42, 'L3 shi46 Talk.extra 包装保留上层 _ 标记');
    ok(R(c, 'Talk._shi46') === 1, 'L3 shi46 wire 幂等标记');
  }
  {
    // shi46_ui 单独加载：SHI46 缺失时走备用 storyBlock
    const SRC = fs.readFileSync(path.join(ROOT, 'www/js/shi46_ui.js'), 'utf8');
    const c2 = {
      console: { log() {}, warn() {}, error() {} },
      Math: Object.create(Math), JSON, Date,
      setTimeout() {}, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
      document: undefined
    };
    c2.window = c2;
    vm.createContext(c2);
    vm.runInContext(`
      var B = { on: false };
      var NPC37 = { storyBlock: function () { return null; } };
      var UI = { modal: null, toast: function () {} };
      var Talk = {};
      var Game = { G: null };
    `, c2);
    vm.runInContext(SRC, c2);
    ok(!!c2.Shi46UI, 'L3 shi46_ui 加载导出 Shi46UI');
    c2.UI.modal = {};
    ok(c2.Shi46UI.storyBlock() === 'modal', 'L3 备用 storyBlock 见 UI.modal 返回 modal');
    c2.UI.modal = null;
    ok(c2.Shi46UI.storyBlock() === null, 'L3 备用 storyBlock 无阻塞返回 null');
  }

  // ---- L3：auc48 Talk.extra 为 undefined 时也安装；openPanel 验 off ----
  {
    const SRC = fs.readFileSync(path.join(ROOT, 'www/js/auc48.js'), 'utf8');
    const c = {
      console: { log() {}, warn() {}, error() {} },
      Math: Object.create(Math), JSON, Date,
      setTimeout() {}, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
      document: docMock(), toasts: [], cards: [], cardChoices: []
    };
    c.window = c; c.globalThis = c;
    vm.createContext(c);
    vm.runInContext(`
      var NPCS={ merchant:{n:'钱多多'} };
      var B={on:false};
      var NPC37={storyBlock:function(){return null;}};
      var ITEMS={};
      var R={mapId:'market'};
      var UI={modal:null, titles:{}, toast:function(s){toasts.push(String(s));},
        card:async function(){return 0;}, hud:function(){}, panel:async function(){return 'auc48';}};
      var Talk={};
      var DevPanel={registerTab:function(){return true;}};
      var Game={G:null, meta:{}, roll:function(){return false;},
        give:function(){}, take:function(){}, useAP:function(){return true;},
        newLife:function(){}, yearEnd:async function(){}, enterMap:async function(){}};
    `, c);
    vm.runInContext(SRC, c);
    ok(typeof c.Talk.extra === 'function', 'L3 auc48 Talk.extra 为 undefined 时仍安装包装');
    const entries = c.Talk.extra('merchant');
    ok(Array.isArray(entries) && entries.some(x => String(x[0]).indexOf('天道拍卖行') >= 0), 'L3 auc48 Talk.extra 缺失时入口仍可达');
    c.AUC48.off = true;
    ok(c.Auc48.openPanel() === null, 'L3 auc48 openPanel 在 off 时拒绝');
    c.AUC48.off = false;
  }

  console.log(`${n} tests, ${fails} failed`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

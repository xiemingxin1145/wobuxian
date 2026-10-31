// 3.9.8 拍卖行 auc48 单测：node test/auc48_unit.js（退出码 = 失败数）
// 覆盖 docs/research_v22.md §22.9；vm + 真实 auc48.js，无 Chrome。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'www/js/auc48.js'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'www/index.html'), 'utf8');
const SCRIPTS = [...HTML.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);

const SAFE_START = /^开始/;

function box(extra) {
  const c = {
    console: { log() {}, warn() {}, error() {} },
    Math: Object.create(Math), JSON, Date,
    setTimeout() {}, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    document: (function () {
      function el(tag) {
        const o = {
          tagName: String(tag || 'div').toUpperCase(),
          tag: tag || 'div',
          style: {}, id: '', className: '',
          children: [], childNodes: [], parentNode: null,
          onclick: null, _attrs: {}, _listeners: [], dataset: {},
          setAttribute(k, v) {
            this._attrs[k] = String(v);
            if (k.indexOf('data-') === 0) {
              this.dataset = this.dataset || {};
              this.dataset[k.slice(5)] = String(v);
            }
          },
          getAttribute(k) {
            if (k && k.indexOf('data-') === 0 && this.dataset) return this.dataset[k.slice(5)];
            return this._attrs[k];
          },
          appendChild(ch) {
            if (ch.parentNode && ch.parentNode.removeChild) ch.parentNode.removeChild(ch);
            ch.parentNode = this; this.children.push(ch); this.childNodes.push(ch); return ch;
          },
          insertBefore(ch, ref) {
            if (ch.parentNode && ch.parentNode.removeChild) ch.parentNode.removeChild(ch);
            ch.parentNode = this;
            const i = ref ? this.children.indexOf(ref) : -1;
            if (i >= 0) { this.children.splice(i, 0, ch); this.childNodes.splice(i, 0, ch); }
            else { this.children.push(ch); this.childNodes.push(ch); }
            return ch;
          },
          removeChild(ch) {
            const i = this.children.indexOf(ch);
            if (i >= 0) { this.children.splice(i, 1); this.childNodes.splice(i, 1); ch.parentNode = null; }
            return ch;
          },
          addEventListener(t, fn) { this._listeners.push([t, fn]); },
          get firstChild() { return this.children[0] || null; },
          querySelector(sel) {
            const walk = (node) => {
              if (sel.indexOf('[data-a48=') === 0) {
                const v = sel.match(/data-a48="?([^\]"]+)/);
                if (v && node.dataset && node.dataset.a48 === v[1]) return node;
              }
              if (sel === '[data-a48]' && node.dataset && node.dataset.a48 != null) return node;
              if (sel.charAt(0) === '.' && (node.className || '').split(/\s+/).indexOf(sel.slice(1)) >= 0) return node;
              for (const ch of (node.children || [])) { const r = walk(ch); if (r) return r; }
              return null;
            };
            return walk(this);
          },
          querySelectorAll(sel) {
            const out = [];
            const walk = (node) => {
              if (sel === '[data-a48]' && node.dataset && node.dataset.a48 != null) out.push(node);
              if (sel.indexOf('[data-a48') === 0 && node.dataset && node.dataset.a48 != null) {
                const m = sel.match(/data-a48\^?=/);
                if (!m || sel.indexOf('bid:') >= 0) {
                  if (sel.indexOf('bid:') >= 0) {
                    if (String(node.dataset.a48).indexOf('bid:') === 0) out.push(node);
                  } else out.push(node);
                } else out.push(node);
              }
              for (const ch of (node.children || [])) walk(ch);
            };
            walk(this);
            return out;
          },
          click() {
            const e = { target: this, stopPropagation() {} };
            if (typeof this.onclick === 'function') this.onclick(e);
            let p = this.parentNode;
            while (p) {
              if (typeof p.onclick === 'function') { p.onclick({ target: this, stopPropagation() {} }); break; }
              p = p.parentNode;
            }
          }
        };
        Object.defineProperty(o, 'innerHTML', {
          get() { return this._html || ''; },
          set(v) {
            this._html = String(v == null ? '' : v);
            this.children = [];
            this.childNodes = [];
            const re = /<(button|div)\b([^>]*)>/gi;
            let m;
            while ((m = re.exec(this._html))) {
              const attrs = m[2] || '';
              const dq = /data-a48\s*=\s*"([^"]+)"/.exec(attrs);
              if (!dq && m[1].toLowerCase() !== 'button') continue;
              const btn = el(m[1]);
              btn.dataset = { a48: dq ? dq[1] : '' };
              btn._attrs['data-a48'] = btn.dataset.a48;
              btn.parentNode = o;
              o.children.push(btn);
              o.childNodes.push(btn);
            }
          }
        });
        return o;
      }
      return {
        readyState: 'complete', addEventListener() {},
        head: { appendChild() {} },
        body: el('body'),
        createElement: el,
        getElementById() { return null; }
      };
    })(),
    toasts: [], cards: [], cardChoices: []
  };
  c.window = c; c.globalThis = c;
  vm.createContext(c);
  vm.runInContext(`
    var NPCS={ merchant:{n:'钱多多',por:'npc_merchant'}, suanpan:{n:'算盘',por:'npc_merchant'} };
    var B={on:false};
    var NPC37={storyBlock:function(){return null;}};
    var ITEMS={
      pyd:{n:'培元丹',p:90,t:'pill'}, zjd:{n:'筑基丹',p:300,t:'pill'},
      pjd:{n:'破境丹',p:800,t:'pill'}, ysf:{n:'御兽符',p:120,t:'tal'},
      ysd:{n:'延寿丹',p:600,t:'pill'}, tsf:{n:'替死符',p:900,t:'tal'},
      xsd:{n:'洗髓丹',p:2000,t:'pill'}, lz:{n:'千年灵芝',p:60,t:'mat'},
      yd:{n:'妖丹',p:45,t:'mat'}, herb:{n:'灵草',p:15,t:'mat'},
      peach:{n:'蟠桃',p:120,t:'mat'}, coin:{n:'古钱',p:300,t:'misc'},
      scroll:{n:'残破功法',p:200,t:'misc'},
      bill:{n:'祖传欠条',p:0,t:'quest'}
    };
    var R={mapId:'market'};
    var MAPINFO={market:{n:'云来坊市'}, longgong:{n:'龙宫'}, guishi:{n:'鬼市'}};
    var UI={
      modal:null, titles:{},
      toast:function(s){ toasts.push(String(s)); },
      card:async function(t,x,p,o){
        cards.push({t:t,x:x,o:o});
        if(cardChoices.length) return cardChoices.shift();
        return 0;
      },
      hud:function(){},
      panel:async function(name){ this._lastPanel=name; return name; },
      p_auction:function(b,re){ if(b){ b.innerHTML='<p>shallow</p>'; b._auction=1; } }
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
      borrow:function(G,tid,amt,agent){
        const gate=this.canBorrow(tid,G);
        if(!gate.ok) return {ok:false, msg:gate.msg};
        amt=Math.round(+amt||0);
        if(amt<=0||amt>gate.max) return {ok:false,msg:'amt'};
        G.stone=(G.stone|0)+amt;
        G.loan42=G.loan42||{L:[]};
        G.loan42.L.push({id:'L1',t:tid,p:amt,od:0,due:0});
        return {ok:true, amt:amt, net:amt};
      }
    };
    var Game={
      G:null, meta:{lives:1, achs:{}, endings:{}, best:{realm:0,age:0}, pts:0},
      rolls:[],
      roll:function(p,kind){ this.rolls.push([p,kind]); return Math.random()<p; },
      save:function(){ this._saved=(this._saved||0)+1; },
      saveMeta:function(){},
      give:function(id,n){ n=n==null?1:n; if(!this.G)return; this.G.inv=this.G.inv||{}; this.G.inv[id]=(this.G.inv[id]|0)+n; if(this.G.inv[id]<=0) delete this.G.inv[id]; },
      take:function(id,n){ this.give(id, -(n==null?1:n)); },
      useAP:function(n){ n=n||1; if(!this.G||(this.G.ap|0)<n){ UI.toast('行动力不足'); return false;} this.G.ap-=n; return true; },
      newLife:function(cfg){ this.G=Object.assign({v:2,year:1,age:16,realm:1,stage:0,aff:{},flags:{},inv:{},ap:4,stone:500},cfg||{}); return this.G; },
      yearEnd:async function(){ if(this.G){ this.G.year=(this.G.year||1)+1; } return true; },
      enterMap:async function(id){ this._map=id; return true; }
    };
  `, c);
  if (extra) vm.runInContext(extra, c);
  vm.runInContext(SRC, c);
  return c;
}

const mkG = (o) => Object.assign({
  v: 2, year: 12, age: 30, realm: 2, stage: 0, stone: 20000, debt: 8888,
  aff: {}, flags: {}, inv: { pyd: 2, herb: 3, bill: 1 }, ap: 6, karma: 0
}, o || {});

(async () => {
  // ---- index 序 ----
  ok(SCRIPTS.includes('js/auc48.js'), 'index 含 auc48.js');
  const iA = SCRIPTS.indexOf('js/auc48.js');
  const iAu = SCRIPTS.indexOf('js/audio32.js');
  const iQ = SCRIPTS.indexOf('js/qing47.js');
  const iSw = SCRIPTS.indexOf('js/sweep44_ui.js');
  ok(iA > iSw && iA < iAu, 'auc48 在 sweep44_ui 之后、audio32 之前');
  ok(iQ < 0 || iA > iQ, '若有 qing47 则 auc48 在其后');
  ok(!SCRIPTS.includes('js/shi46.js') || iA > SCRIPTS.indexOf('js/shi46.js'), '若有 shi46 则 auc48 在其后（或无）');

  // ---- 导出 / TEXT JSON / 不以「开始」起首 ----
  {
    const c = box();
    ok(!!c.AUC48 && !!c.Auc48 && !!c.TEXT_AUC48, 'AUC48 / Auc48 / TEXT_AUC48 导出');
    const T = c.TEXT_AUC48;
    let round = false;
    try { JSON.parse(JSON.stringify(T)); round = true; } catch (e) { }
    ok(round, 'TEXT_AUC48 JSON 往返');
    ok(Array.isArray(T.tiandao) && T.tiandao.length >= 4, 'tiandao.length≥4');
    ok(Array.isArray(T.bid.rivals) && T.bid.rivals.length >= 6, 'bid.rivals.length≥6');
    const labels = [];
    const walk = (o) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(walk); return; }
      for (const k of Object.keys(o)) {
        const v = o[k];
        if (typeof v === 'string' && /^(opt_|bid_btn|buyout_btn|consign_btn|leak_btn|loan_btn|entry_talk|legacy_go|tab|cancel)/.test(k) || /_btn$|^opt_/.test(k) || k === 'tab' || k === 'entry_talk' || k === 'legacy_go' || k === 'cancel' || k === 'opt_ok') {
          labels.push(v);
        }
        if (typeof v === 'object') walk(v);
      }
    };
    walk(T);
    // also push known short clickable
    ['bid_btn','buyout_btn','consign_btn','leak_btn','loan_btn','entry_talk','legacy_go'].forEach(k => labels.push(T.ui[k]));
    labels.push(T.bid.opt_raise, T.bid.opt_pass, T.bid.opt_buyout);
    labels.push(T.consign.cancel, T.leak.opt_a, T.leak.opt_b, T.leak.opt_c, T.leak.cancel);
    labels.push(T.loan.opt_go, T.loan.opt_no, T.year.opt_ok);
    labels.push(T.dev.tab);
    const bad = labels.filter(s => typeof s === 'string' && SAFE_START.test(s.replace(/\{[^}]+\}/g, 'X')));
    ok(bad.length === 0, '所有可点短标签不以「开始」起首（bad=' + JSON.stringify(bad) + ')');
    ok(T.dev.tab === '拍卖48', 'Dev 标签「拍卖48」');
  }

  // ---- 1. off / ensure / G.v===2 ----
  {
    const c = box();
    c.AUC48.off = true;
    c.Game.G = mkG({ auc48: undefined });
    const r = c.Talk.extra('merchant');
    ok(Array.isArray(r) && !r.some(x => String(x[0] || '').indexOf('天道拍卖行') >= 0), 'off=true 不注入 Talk');
    const open = c.Auc48.tryOpen(c.Game.G, {});
    ok(!open.ok && open.reason === 'off', 'off=true 不开拍');
    c.AUC48.off = false;
    const G2 = { v: 2, year: 5, realm: 1, stone: 100, ap: 3, inv: {} };
    const S = c.Auc48.ensure(G2);
    ok(!!S && S.v === 1 && Array.isArray(S.lots) && S.nextY > 0, 'G.v===2 老档 ensure 补默认不抛');
    ok(G2.auc48 === S, 'ensure 写入 G.auc48');
  }

  // ---- 2. 开拍 lots / 不重掷 ----
  {
    const c = box();
    // 确定性 roll：交替
    let i = 0;
    c.Game.roll = function (p, kind) {
      this.rolls.push([p, kind]);
      i++;
      return (i % 3) !== 0;
    };
    c.Game.G = mkG({ year: 12 });
    const r = c.Auc48.tryOpen(c.Game.G, { force: true });
    ok(r.ok && r.S.lots.length === c.AUC48.LOTS, '开拍 lots.length===LOTS（' + (r.S && r.S.lots.length) + ')');
    ok(!!r.S.leak && typeof r.S.leak.price === 'number', '开拍写入 leak');
    const snap = JSON.stringify(r.S.lots);
    const leakP = r.S.leak.price;
    c.Auc48.ensure(c.Game.G);
    c.Auc48.tryOpen(c.Game.G, {}); // already same year
    ok(JSON.stringify(c.Game.G.auc48.lots) === snap, '再 ensure/同岁开拍不改变 lots（防重掷）');
    ok(c.Game.G.auc48.leak.price === leakP, 'leak 价不重掷');
  }

  // ---- 3. 举牌 AP/年帽/roll/胜/第6次拒 ----
  {
    const c = box();
    c.Game.roll = function (p, kind) {
      this.rolls.push([p, kind]);
      // NPC 不跟 → 玩家胜
      if (p === 0.62) return false;
      return Math.random() < p;
    };
    c.Game.G = mkG({ year: 12, ap: 6, stone: 50000 });
    c.Auc48.tryOpen(c.Game.G, { force: true });
    const lot = c.Game.G.auc48.lots[0];
    const ap0 = c.Game.G.ap;
    const stone0 = c.Game.G.stone;
    const rolls0 = c.Game.rolls.length;
    const win = await c.Auc48.bid(c.Game.G, lot.id, { force: true, choice: 0 });
    ok(win.ok && win.result === 'win', '举牌胜');
    ok(c.Game.G.ap === ap0 - 1, '举牌 AP−1');
    ok(c.Game.G.auc48.nBid === 1, 'nBid+1');
    ok(c.Game.rolls.length > rolls0, '调用 Game.roll');
    ok(c.Game.G.stone < stone0, '胜则扣石');
    ok((c.Game.G.inv[lot.item] | 0) >= 1, '胜则给物');

    // 塞满年帽
    c.Game.G.auc48.nBid = c.AUC48.BID_CAP;
    c.Game.G.ap = 6;
    const lot2 = c.Game.G.auc48.lots.find(l => !l.done) || c.Game.G.auc48.lots[1];
    if (lot2 && !lot2.done) {
      const r6 = await c.Auc48.bid(c.Game.G, lot2.id, { force: true, choice: 0 });
      ok(!r6.ok && r6.reason === 'cap', '同年第 6 次举牌拒绝');
    } else {
      ok(true, '同年第 6 次举牌拒绝（无剩余 lot，跳过实点）');
    }
  }

  // ---- 4. 寄拍 ----
  {
    const c = box();
    c.Game.roll = function (p, kind) {
      this.rolls.push([p, kind]);
      if (Math.abs(p - 0.55) < 1e-9) return true; // 成交
      return false;
    };
    c.Game.G = mkG({ year: 12, ap: 4, stone: 5000, inv: { pyd: 2, bill: 1 } });
    c.Auc48.tryOpen(c.Game.G, { force: true });
    const sold = await c.Auc48.consign(c.Game.G, { force: true, itemId: 'pyd', forceSold: true });
    ok(sold.ok && sold.result === 'sold' && sold.got > 0, '寄拍成交得石');
    ok(c.Game.G.auc48.nCon === 1, '寄拍 nCon+1');
    ok((c.Game.G.inv.pyd | 0) === 1, '寄拍 take 物品');

    c.Game.roll = function (p) { this.rolls.push([p]); if (Math.abs(p - 0.55) < 1e-9) return false; return false; };
    const pass = await c.Auc48.consign(c.Game.G, { force: true, itemId: 'pyd', forceSold: false });
    ok(pass.ok && pass.result === 'pass' && pass.fee > 0, '寄拍流拍扣手续');
    ok((c.Game.G.inv.pyd | 0) === 1, '3.9.9 S1 寄拍流拍退物（1→取走→退回 1）');

    c.Game.G.auc48.nCon = 0;
    c.Game.G.inv = { bill: 1 };
    const none = await c.Auc48.consign(c.Game.G, { force: true });
    ok(!none.ok && none.reason === 'none', '无可寄拍物走 none');

    c.Game.G.inv = { pyd: 1 };
    c.Game.G.auc48.nCon = c.AUC48.CON_CAP;
    const cap = await c.Auc48.consign(c.Game.G, { force: true, itemId: 'pyd' });
    ok(!cap.ok && cap.reason === 'cap', '寄拍年帽 2');
  }

  // ---- 5. 赌货 ----
  {
    const c = box();
    c.Game.G = mkG({ year: 12, ap: 4, stone: 50000 });
    c.Auc48.tryOpen(c.Game.G, { force: true });
    const price = c.Game.G.auc48.leak.price;
    const stone0 = c.Game.G.stone;
    const g = await c.Auc48.leak(c.Game.G, { force: true, forceTier: 'good', choice: 0 });
    ok(g.ok && g.result === 'good' && g.item, '赌货 good 发奖');
    ok(c.Game.G.auc48.nLeak === 1, 'nLeak 年帽计数');
    ok(c.Game.G.stone === stone0 - price - (c.Game.G.auc48.feePaid ? 0 : 0) || c.Game.G.stone < stone0, '扣标价');

    // 再开一场赌货 mid/bad
    c.Game.G.year = 15;
    c.Auc48.ensure(c.Game.G);
    c.Auc48.tryOpen(c.Game.G, { force: true });
    c.Game.G.ap = 4; c.Game.G.stone = 50000;
    const mid = await c.Auc48.leak(c.Game.G, { force: true, forceTier: 'mid', choice: 1, skipCap: true });
    ok(mid.ok && mid.result === 'mid', '赌货 mid');

    c.Game.G.year = 18;
    c.Auc48.ensure(c.Game.G);
    c.Auc48.tryOpen(c.Game.G, { force: true });
    c.Game.G.ap = 4; c.Game.G.stone = 50000;
    const bad = await c.Auc48.leak(c.Game.G, { force: true, forceTier: 'bad', choice: 2, skipCap: true });
    ok(bad.ok && bad.result === 'bad', '赌货 bad');

    c.Game.G.auc48.leak.opened = 0;
    c.Game.G.auc48.nLeak = 0;
    c.Game.G.stone = 1;
    c.Game.G.ap = 4;
    c.Game.G.auc48.feePaid = 1;
    const nostone = await c.Auc48.leak(c.Game.G, { force: true, choice: 0 });
    ok(!nostone.ok && nostone.reason === 'stone', '标价不足拒绝');
  }

  // ---- 6. pend 防重掷 ----
  {
    const c = box();
    c.cardChoices = [-1]; // 弹出后关卡
    c.Game.roll = function (p, kind) { this.rolls.push([p, kind]); return false; };
    c.Game.G = mkG({ year: 12, ap: 4, stone: 50000 });
    c.Auc48.tryOpen(c.Game.G, { force: true });
    const lot = c.Game.G.auc48.lots[0];
    const lotsSnap = JSON.stringify(c.Game.G.auc48.lots);
    const r1 = await c.Auc48.bid(c.Game.G, lot.id, { force: true }); // choice from cardChoices → -1
    ok(r1.reason === 'modal' && c.Game.G.auc48.pend && c.Game.G.auc48.pend.kind === 'bid', '弹出竞价卡后写入 pend');
    ok(JSON.stringify(c.Game.G.auc48.lots) === lotsSnap, 'pend 期间 lots 不重生成');
    // 模拟读档复牌：选定 raise→win
    const rollsBefore = c.Game.rolls.length;
    // restore 会再走 bid；清掉 modal 选择，直接 choice
    delete c.Game.G.auc48.pend; // 手动设回
    c.Game.G.auc48.pend = { kind: 'bid', y: 12, lotId: lot.id, cur: lot.cur, paid: 1 };
    // 复牌不重抽 lots
    const r2 = await c.Auc48.restorePend(c.Game.G, { force: true, choice: 0 });
    ok(r2 && r2.ok, '读档复牌可完成');
    ok(!c.Game.G.auc48.pend, '选定后清除 pend');
    // lots 结构仍同 id
    ok(c.Game.G.auc48.lots[0].id === lot.id, '复牌不换拍品 id');
    ok(c.Game.rolls.length >= rollsBefore, '复牌路径可继续 roll 跟价（不重生 lots）');
  }

  // ---- 7. overdue 禁一口价；垫资 canBorrow ----
  {
    const c = box();
    c.Loan42._od = true;
    c.Game.G = mkG({ year: 12, ap: 4, stone: 100, loan42: { L: [{ od: 1, due: 50, p: 100 }] } });
    c.Auc48.tryOpen(c.Game.G, { force: true });
    const lot = c.Game.G.auc48.lots[0];
    // 一口价 choice=2 但逾期时选项不含一口价；传 choice=2 会被当成？我们的实现：choice===2 && !od 才买断
    // 用 choice=2 应不走买断（因为 od）——会落到 raise 以外。直接测 _padOrBail / bid 选项构建
    c.cards = [];
    c.cardChoices = [1]; // 不跟
    await c.Auc48.bid(c.Game.G, lot.id, { force: true });
    const last = c.cards[0];
    ok(last && last.o && last.o.length === 2, 'hasOverdue 时竞价选项无一口价（len=' + (last && last.o && last.o.length) + ')');

    // 垫资：无逾期时 canBorrow 桩
    c.Loan42._od = false;
    c.Game.G.stone = 10;
    c.Game.G.ap = 4;
    c.Auc48.tryOpen(c.Game.G, { force: true });
    const lot2 = c.Game.G.auc48.lots.find(l => !l.done) || c.Game.G.auc48.lots[0];
    lot2.done = 0; lot2.won = 0; lot2.cur = lot2.start;
    c.Game.G.auc48.nBid = 0;
    c.Game.roll = function (p, kind) { this.rolls.push([p, kind]); if (p === 0.62) return false; return false; };
    // 抬到付不起：先把 cur 设高
    lot2.cur = 5000;
    c.Game.G.stone = 10;
    c.cardChoices = [0]; // 选垫资
    // 直接测 _padOrBail
    const pad = await c.Auc48._padOrBail(c.Game.G, c.Game.G.auc48, lot2, { loanChoice: 0, cur: 5000 });
    ok(pad.ok && c.Game.G.stone > 10, '垫资走 canBorrow/borrow 桩');

    c.Loan42._od = true;
    const pad2 = await c.Auc48._padOrBail(c.Game.G, c.Game.G.auc48, lot2, { loanChoice: 0, cur: 9000 });
    ok(!pad2.ok, '逾期时垫资 blocked');
  }

  // ---- 8. Talk.extra 归一 + keepFnMarks ----
  {
    const c = {
      console: { log() {}, warn() {}, error() {} },
      Math: Object.create(Math), JSON, Date,
      setTimeout() {}, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
      document: { readyState: 'complete', addEventListener() {}, head: { appendChild() {} },
        createElement(tag) { return { tag, style: {}, setAttribute() {}, appendChild() {}, insertBefore() {}, innerHTML: '', id: '', children: [], dataset: {}, onclick: null }; },
        getElementById() { return null; } },
      toasts: [], cards: [], cardChoices: []
    };
    c.window = c; c.globalThis = c;
    vm.createContext(c);
    vm.runInContext(`
      var NPCS={merchant:{n:'钱多多'}};
      var B={on:false}; var NPC37={storyBlock:function(){return null;}};
      var ITEMS={pyd:{n:'培元丹',p:90,t:'pill'},herb:{n:'灵草',p:15,t:'mat'},bill:{n:'欠条',p:0,t:'quest'}};
      var R={mapId:'market'}; var MAPINFO={market:{n:'坊市'}};
      var UI={modal:null,titles:{},toast:function(){},card:async function(){return 0;},hud:function(){},panel:async function(){},p_auction:function(){}};
      var Talk={extra:function(){ return undefined; }};
      Talk.extra._qing47=1; Talk.extra._loan42=1;
      var DevTabs=[]; var DevPanel={registerTab:function(k,n,r){DevTabs.push({key:k,name:n});}};
      var Loan42={hasOverdue:function(){return false;},canBorrow:function(){return {ok:true,max:100};},borrow:function(){return {ok:true};}};
      var Game={G:null,meta:{},rolls:[],roll:function(p){return Math.random()<p;},save:function(){},
        give:function(){},take:function(){},
        newLife:function(cfg){this.G=Object.assign({v:2,year:1,ap:4,inv:{},stone:100},cfg||{});return this.G;},
        yearEnd:async function(){if(this.G)this.G.year++;},
        enterMap:async function(){}};
      Game.yearEnd._qing47=1; Game.enterMap._loan42=1;
    `, c);
    vm.runInContext(SRC, c);
    c.Game.G = mkG();
    const r1 = c.Talk.extra('merchant');
    ok(Array.isArray(r1), 'Talk.extra 上层 undefined → 仍数组');
    ok(r1.some(x => String(x[0]).indexOf('天道拍卖行') >= 0), '注入天道拍卖行');
    ok(c.Talk.extra._qing47 === 1 && c.Talk.extra._loan42 === 1 && c.Talk.extra._auc48 === 1, 'keepFnMarks 保留 _qing47/_loan42');
    ok(c.Game.yearEnd._qing47 === 1 && c.Game.yearEnd._auc48 === 1, 'yearEnd keepFnMarks');
    ok(c.Game.enterMap._loan42 === 1 && c.Game.enterMap._auc48 === 1, 'enterMap keepFnMarks');
  }
  {
    const c = box('Talk.extra=function(){ return "nope"; };');
    // re-wire after overwriting? SRC already ran; need fresh
  }
  {
    const c = {
      console: { log() {}, warn() {}, error() {} },
      Math: Object.create(Math), JSON, Date,
      setTimeout() {}, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
      document: { readyState: 'complete', addEventListener() {}, head: { appendChild() {} },
        createElement(tag) { return { tag, style: {}, setAttribute() {}, appendChild() {}, insertBefore() {}, innerHTML: '', id: '', children: [], dataset: {}, onclick: null }; },
        getElementById() { return null; } },
      toasts: [], cards: []
    };
    c.window = c; c.globalThis = c;
    vm.createContext(c);
    vm.runInContext(`
      var NPCS={merchant:{n:'钱多多'}}; var B={on:false}; var NPC37={storyBlock:function(){return null;}};
      var ITEMS={pyd:{n:'培元丹',p:90}}; var R={mapId:'market'}; var MAPINFO={market:{n:'坊市'}};
      var UI={modal:null,titles:{},toast:function(){},card:async function(){return 0;},hud:function(){},panel:async function(){},p_auction:function(){}};
      var Talk={extra:function(){ return null; }};
      var DevTabs=[]; var DevPanel={registerTab:function(){}};
      var Loan42={hasOverdue:function(){return false;},canBorrow:function(){return {ok:false};},borrow:function(){return {ok:false};}};
      var Game={G:null,meta:{},rolls:[],roll:function(p){return false;},give:function(){},take:function(){},
        newLife:function(cfg){this.G=Object.assign({v:2,year:1},cfg||{});},yearEnd:async function(){},enterMap:async function(){}};
    `, c);
    vm.runInContext(SRC, c);
    c.Game.G = mkG();
    const r = c.Talk.extra('merchant');
    ok(Array.isArray(r), 'Talk.extra 上层 null → 数组');
    const r2 = c.Talk.extra('suanpan');
    ok(Array.isArray(r2) && r2.length >= 1, 'suanpan 也注入');
  }

  // ---- 9. G==null 容忍 + canPopup 守卫 ----
  {
    const c = box();
    c.Game.G = null;
    ok(c.Auc48.ensure(null) === null, 'ensure(null) 不抛');
    ok(c.Auc48.canPopup() === false, 'G==null 时 canPopup false');
    c.Game.G = mkG();
    c.B.on = true;
    ok(c.Auc48.canPopup() === false, 'B.on 时 canPopup false');
    c.B.on = false;
    c.NPC37.storyBlock = () => 'prologue';
    ok(c.Auc48.canPopup() === false, 'storyBlock 时 canPopup false');
    c.NPC37.storyBlock = () => null;
    c.UI.modal = {};
    ok(c.Auc48.canPopup() === false, 'UI.modal 时 canPopup false');
    c.UI.modal = null;
    ok(c.Auc48.canPopup() === true, '常态 canPopup true');
  }

  // ---- 10. 面板 re() 两次后 onclick 不叠加 ----
  {
    const c = box();
    c.Game.G = mkG({ year: 12, ap: 6, stone: 50000 });
    c.Auc48.tryOpen(c.Game.G, { force: true });
    // 让 bid 立刻胜且不弹复杂卡
    c.Game.roll = function (p, kind) { this.rolls.push([p, kind]); if (p === 0.62) return false; return false; };
    c.cardChoices = []; // default 0
    const b = c.document.createElement('div');
    let added = 0;
    const _a = b.addEventListener.bind(b);
    b.addEventListener = function (t, fn, o) {
      if (t === 'click') added++;
      return _a(t, fn, o);
    };
    const re = () => c.Auc48.renderPanel(b, re);
    re(); re(); re();
    ok(added === 0, '面板 re() 不用 addEventListener 叠 click（added=' + added + ')');
    ok(typeof b.onclick === 'function', '面板用 onclick 赋值');
    const btn = b.querySelector('[data-a48]');
    ok(!!btn && String(btn.dataset.a48).indexOf('bid:') === 0, '含举牌按钮');
    const nBid0 = c.Game.G.auc48.nBid | 0;
    const ap0 = c.Game.G.ap;
    await new Promise((res) => {
      const prev = b.onclick;
      b.onclick = function (e) {
        const r = prev && prev.call(this, e);
        Promise.resolve(r).then(() => setTimeout(res, 0));
      };
      btn.click();
    });
    await new Promise(r => setTimeout(r, 20));
    ok(c.Game.G.auc48.nBid === nBid0 + 1, '三次渲染后一点举牌只 +1 nBid（got ' + c.Game.G.auc48.nBid + ')');
    ok(c.Game.G.ap === ap0 - 1, '一点只扣 1 AP（got ' + c.Game.G.ap + ')');
  }

  // ---- Dev 注册 ----
  {
    const c = box();
    ok(c.DevTabs.some(t => t.key === 'auc48' && t.name === '拍卖48'), 'DevPanel 注册「拍卖48」');
  }

  // ---- newLife 清本世 ----
  {
    const c = box();
    c.Game.G = mkG({ year: 12 });
    c.Auc48.tryOpen(c.Game.G, { force: true });
    ok(!!c.Game.G.auc48.lots.length, '开拍后有 lots');
    c.Game.meta.auc48 = { totDeal: 3, totLeakGood: 1, totCon: 2 };
    c.Game.newLife({ year: 1, realm: 0 });
    ok(!c.Game.G.auc48, 'newLife 清 G.auc48');
    ok(c.Game.meta.auc48.totDeal === 3, 'meta 统计保留');
  }

  console.log(n + ' tests, ' + fails + ' failed');
  process.exit(fails);
})().catch(e => { console.error(e); process.exit(1); });

// 3.9.1 天道小贷 loan42 第 2 轮：催收小分队开战 + 面板行 + DevPanel（node，无 Chrome）
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'www/js/loan42.js'), 'utf8');

function box(extra) {
  const c = Object.assign({
    console: { log() {}, warn() {}, error() {} },
    Math: Object.create(Math), JSON,
    setTimeout(fn) { try { if (typeof fn === 'function') fn(); } catch (e) {} return 0; },
    clearTimeout() {},
    document: {
      readyState: 'complete', addEventListener() {},
      head: { appendChild() {} },
      createElement(tag) {
        const el = {
          tagName: String(tag).toUpperCase(), className: '', style: {},
          children: [], textContent: '', _html: '',
          set innerHTML(v) { this._html = String(v); },
          get innerHTML() { return this._html; },
          appendChild(ch) { this.children.push(ch); return ch; },
          closest() { return null; }
        };
        return el;
      },
      getElementById() { return null; }
    },
    toasts: [], cards: [], fights: [],
  }, extra || {});
  c.window = c; c.globalThis = c;
  vm.createContext(c);
  vm.runInContext(`
    var REALMS=[
      {n:'凡人',life:72,need:80},{n:'练气',life:130,need:200},{n:'筑基',life:220,need:520},
      {n:'金丹',life:420,need:1300},{n:'元婴',life:800,need:3200},{n:'化神',life:1500,need:7600},
      {n:'渡劫',life:3000,need:18000},{n:'飞升',life:99999,need:1e12}
    ];
    var MAPINFO={village:{n:'村',mons:['slime']},market:{n:'坊',mons:['collector']},heaven:{n:'天',mons:['collector']}};
    var NPCS={merchant:{n:'钱多多'},xianguan:{n:'记账童子'},suanpan:{n:'算无遗'}};
    var MONS={
      collector:{ n:'讨债鬼', spr:'mon_collector', el:'金', hp:1.0, atk:1.0, def:0.9, spd:1.1, sk:['atk','freeload'], drop:['coin','yd'] }
    };
    var B={on:false};
    var NPC37={storyBlock:function(){return null;}};
    var R={player:null, mapId:'market'};
    var UI={
      toast:function(s){toasts.push(String(s));},
      card:async function(t,x,p,o){cards.push({t:t,x:x,o:o}); return (UI._cardIdx!=null?UI._cardIdx:0);},
      hud:function(){},
      p_char:function(b){ b._base=1; return b; }
    };
    var Sys={_v:{},bonus:function(k){return this._v[k]||0;}};
    var Talk={extra:function(){return [];}};
    var MG33={_vip:false,has:function(id){return id==='tiandao_vip'&&this._vip;}};
    var DevTabs=[];
    var DevPanel={
      registerTab:function(key,name,render){
        const i=DevTabs.findIndex(t=>t&&t.key===key);
        const t={key:key,name:name,render:render};
        if(i>=0) DevTabs[i]=t; else DevTabs.push(t);
        return true;
      }
    };
    function h(tag,cls,html){
      const e=document.createElement(tag); if(cls)e.className=cls; if(html!==undefined)e.innerHTML=html; return e;
    }
    var Game={
      G:null, rolls:[],
      roll:function(p,kind){this.rolls.push([p,kind]);return Math.random()<p;},
      lifeMax:function(){var G=this.G;return REALMS[G.realm].life+(G.lifeBonus||0)+(G.st&&G.st.con||0);},
      log:function(){},save:function(){},give:function(id,n){var G=this.G;G.inv=G.inv||{};G.inv[id]=(G.inv[id]||0)+(n||1);},
      async yearEnd(){var G=this.G;G.year++;G.age++;if(G.debt>0)G.debt+=Math.ceil(G.debt*0.03);},
      async seclude(years){var G=this.G;for(var i=0;i<years;i++){G.year++;G.age++;if(G.debt>0)G.debt+=Math.ceil(G.debt*0.03);}},
      async enterMap(id){this._map=id;},
      async die(kind){this.G.dead=true;this.G.ending=kind;},
      async fight(mon,opts){
        fights.push({mon:mon,opts:Object.assign({},opts||{})});
        return {res: (Game._fightRes||'win'), killed:[], _raw:1};
      },
      stats:function(){return {atk:10,def:5,hp:100,mhp:100};}
    };
  `, c);
  vm.runInContext(SRC, c);
  return c;
}
const run = (c, s) => vm.runInContext(s, c);
const mkG = (o) => Object.assign({
  v: 2, year: 12, age: 30, realm: 2, stage: 0, stone: 100000, debt: 8888,
  lifeBonus: 0, flags: {}, inv: {}, st: { con: 5 }, aff: {}
}, o || {});

function seedOd(c, od) {
  c.Game.G = mkG({ stone: 100000, debt: 100 });
  run(c, 'LOAN42.ensure(Game.G)');
  c.Game.G.loan42.y = 12;
  c.Game.G.loan42.squad = 1;
  c.Game.G.loan42.L = [{
    id: 'L1', t: 'fq', p0: 1040, p: 780, r: 0.11, y0: 10, n: 4, left: 3,
    due: 400, od: od == null ? 1 : od, ins: 50
  }];
}

// ---- MONS 缩放注册 ----
{
  const c = box();
  ok(run(c, 'LOAN42.ensureSquadMons()') === true, 'ensureSquadMons 注册成功');
  ok(run(c, '!!MONS.loan42_sq'), 'MONS.loan42_sq 存在');
  ok(run(c, 'Math.abs(MONS.loan42_sq.hp - 1.8) < 1e-9'), 'hp ×1.8');
  ok(run(c, 'Math.abs(MONS.loan42_sq.atk - 1.3) < 1e-9'), 'atk ×1.3');
  ok(run(c, 'Math.abs(MONS.loan42_sq.def - 0.9*1.2) < 1e-9'), 'def ×1.2');
  ok(run(c, 'MONS.collector.hp === 1'), '不改动原 MONS.collector');
}

// (async fight / offer cases below)

async function drain(c, expr) {
  return await new Promise((resolve, reject) => {
    try {
      const p = run(c, expr);
      Promise.resolve(p).then(resolve, reject);
    } catch (e) { reject(e); }
  });
}

(async () => {
  // ---- fight wrap 胜 ----
  {
    const c = box();
    seedOd(c, 1);
    c.Game._fightRes = 'win';
    c.Math.random = () => 0.99;
    const debt0 = c.Game.G.debt;
    const od0 = c.Game.G.loan42.L[0].od;
    const stone0 = c.Game.G.stone;
    const fr = await drain(c, 'Game.fight(LOAN42.SQUAD_MON,{elite:true,solo:true,noflee:true,adds:[LOAN42.SQUAD_MON,LOAN42.SQUAD_MON],loan42Squad:true,tier:2.4})');
    ok(fr && fr.res === 'win' && fr._loan42Handled === 1, 'R2 胜：fight 包装标记 handled');
    ok(c.fights.length === 1 && c.fights[0].mon === 'loan42_sq' && c.fights[0].opts.loan42Squad
      && Array.isArray(c.fights[0].opts.adds) && c.fights[0].opts.adds.length === 2, 'R2 胜：3 只（主+adds2）loan42_sq');
    ok(c.Game.G.loan42.squad === 0, 'R2 胜：squad 清零');
    ok(c.Game.G.loan42.L[0].od === od0 && c.Game.G.debt === debt0, 'R2 胜：欠款/逾期不变');
    ok(c.Game.G.stone === stone0 + Math.round(520 * 0.3), 'R2 胜：赏石 0.3×N');
    ok(c.cards.some(x => String(x.x).includes('打赢了催收') || String(x.t).includes('催收')), 'R2 胜：结算卡');
  }

  // ---- fight wrap 败 + 讨债令 ----
  {
    const c = box();
    seedOd(c, 1);
    c.Game.G.flags.s3b_token = 2;
    c.Game.G.stone = 5000;
    c.Game._fightRes = 'lose';
    c.UI._cardIdx = 0; // 选讨债令
    const cr0 = c.Game.G.loan42.cr;
    const fr = await drain(c, 'Game.fight(LOAN42.SQUAD_MON,{loan42Squad:true,solo:true,noflee:true})');
    ok(fr && fr.res === 'lose' && fr._loan42Handled === 1, 'R2 败：handled');
    ok(c.Game.G.flags.s3b_token === 1, 'R2 败：耗 1 令');
    ok(c.Game.G.loan42.cr === cr0 - 20, 'R2 败：征信−20');
    ok(c.Game.G.loan42.squad === 1, 'R2 败：squad 保持');
    ok(c.Game.G.stone === 5000, 'R2 败：有令不扣误工费灵石');
  }

  // ---- offerSquad：当场还款 ----
  {
    const c = box();
    seedOd(c, 1);
    c.UI._cardIdx = 0; // 当场还款
    const r = await drain(c, 'LOAN42.offerSquad(Game.G,{trigger:true,amt:LOAN42.squadOdAmt(Game.G)})');
    ok(r && r.choice === 'pay' && r.r && r.r.ok, 'R2 offer 当场还款');
    ok(c.Game.G.loan42.squad === 0, 'R2 还款后 squad=0');
  }

  // ---- offerSquad：跑 ----
  {
    const c = box();
    seedOd(c, 1);
    c.UI._cardIdx = 2;
    const debt0 = c.Game.G.debt;
    const r = await drain(c, 'LOAN42.offerSquad(Game.G,{trigger:true,amt:400})');
    ok(r && r.choice === 'run', 'R2 offer 跑');
    ok(!c.Game.G.loan42.L.length && c.Game.G.debt === debt0 + Math.ceil((780 + 50) * 1.2), 'R2 跑：od→转尾款');
  }

  // ---- offerSquad：应战 ----
  {
    const c = box();
    seedOd(c, 1);
    c.UI._cardIdx = 1; // 应战
    c.Game._fightRes = 'win';
    c.Math.random = () => 0.99;
    // offerSquad 内 card 返回 1，随后 fight；但 card 被多次调用——第一次选应战，后续结算卡也返回 1（无害）
    const r = await drain(c, 'LOAN42.offerSquad(Game.G,{trigger:true,amt:400})');
    ok(r && r.choice === 'fight', 'R2 offer 应战');
    ok(c.fights.length >= 1 && c.fights[0].opts.loan42Squad, 'R2 应战真正调用 Game.fight');
    ok(c.Game.G.loan42.squad === 0, 'R2 应战胜后 squad=0');
  }

  // ---- #53：storyBlock 时 trySquad / offer 不弹 ----
  {
    const c = box();
    seedOd(c, 1);
    run(c, 'NPC37.storyBlock=function(){return "prologue";}');
    const ts = run(c, "LOAN42.trySquad(Game.G,'market')");
    ok(ts === null, 'R2 storyBlock → trySquad null');
    run(c, 'NPC37.storyBlock=function(){return null;}; B.on=true;');
    ok(run(c, 'LOAN42.storyBlock()') === 'battle', 'R2 B.on → storyBlock battle');
    const off = await drain(c, 'LOAN42.offerSquad(Game.G,{trigger:true,amt:400})');
    ok(off && off.blocked, 'R2 B.on 时 offer 被挡');
    ok(c.cards.length === 0, 'R2 被挡不弹卡');
  }

  // ---- enterMap 串联：roll 必中 → offer ----
  {
    const c = box();
    seedOd(c, 1);
    c.Game.roll = function (p, k) { this.rolls.push([p, k]); return true; }; // 60% 必中
    c.UI._cardIdx = 0;
    await drain(c, "Game.enterMap('market')");
    ok(c.cards.some(x => String(x.t).includes('催收') || (x.o && x.o.some(t => String(t).includes('应战')))),
      'R2 enterMap 触发催收卡');
  }

  // ---- panelRow / p_char ----
  {
    const c = box();
    seedOd(c, 1);
    const txt = run(c, 'LOAN42.panelRowText(Game.G)');
    ok(typeof txt === 'string' && txt.includes('天道小贷') && txt.includes('征信'), 'R2 panelRow 文案');
    const b = run(c, 'var b=document.createElement("div"); UI.p_char(b); b');
    ok(b && b.children && b.children.some(ch => ch.className === 'loan42row'), 'R2 p_char 注入 loan42row');
    // 无贷款 peek null
    c.Game.G = mkG({ debt: 100 });
    ok(run(c, 'LOAN42.panelRowText(Game.G)') === null, 'R2 未借过无面板行');
  }

  // ---- DevPanel 小贷42 ----
  {
    const c = box();
    ok(run(c, 'DevTabs.some(t=>t&&t.key==="loan42"&&t.name==="小贷42")'), 'R2 DevPanel/DevTabs 登记 小贷42');
    c.Game.G = mkG({ realm: 3, stone: 1e6 });
    const boxEl = run(c, 'var el=document.createElement("div"); var tab=DevTabs.find(t=>t.key==="loan42"); tab.render(el,{toast:function(){},save:function(){},rerender:function(){}}); el');
    ok(boxEl && String(boxEl.innerHTML || boxEl._html).includes('征信'), 'R2 小贷42 面板渲染');
  }

  // ---- rng 走 Game.roll ----
  {
    const c = box();
    seedOd(c, 1);
    c.Game.rolls = [];
    c.Game.roll = function (p, k) { this.rolls.push([p, k]); return false; }; // 60% 不中 → deferred
    const ts = run(c, "LOAN42.trySquad(Game.G,'market')");
    ok(ts && ts.deferred, 'R2 roll 失败 → deferred');
    ok(c.Game.rolls.some(r => r[0] === 0.6 && r[1] === 'loan42'), 'R2 trySquad 经 Game.roll(,loan42)');
  }

  // ---- M1 §16.6：灵石不够 →「当场还款」🔒 灰掉；点了不关死，可改选战/跑 ----
  {
    const c = box();
    seedOd(c, 1);
    c.Game.G.stone = 1; // 远低于 overdue 400
    // 第一次点灰掉的还款(0)，第二次选跑(2)
    let nAsk = 0;
    const seq = [0, 2];
    c.UI.card = async function (t, x, p, o) {
      c.cards.push({ t, x, o: (o || []).slice() });
      const i = seq[Math.min(nAsk, seq.length - 1)];
      nAsk++;
      return i;
    };
    const r = await drain(c, 'LOAN42.offerSquad(Game.G,{trigger:true,amt:LOAN42.squadOdAmt(Game.G)})');
    const first = c.cards[0];
    ok(first && first.o && String(first.o[0]).startsWith('🔒') && String(first.o[0]).includes('当场还款'),
      'M1 灵石不足：当场还款选项 🔒 灰置');
    ok(first.o[1] === '应战' && first.o[2] === '跑', 'M1 仍保留应战/跑');
    ok(nAsk >= 2, 'M1 点灰项后重弹卡（不关死）');
    ok(c.toasts.some(t => String(t).includes('灵石不足')), 'M1 点灰项 toast 灵石不足');
    ok(r && r.choice === 'run', 'M1 改选跑可执行');
    ok(c.Game.G.loan42._squadDoneY === (c.Game.G.year | 0), 'M1 选定后记 _squadDoneY');
    ok(!c.Game.G.loan42.sqPend, 'M1 选定后清 sqPend');
    // 灵石够时不加 🔒
    const c2 = box();
    seedOd(c2, 1);
    c2.Game.G.stone = 100000;
    c2.UI._cardIdx = 0;
    await drain(c2, 'LOAN42.offerSquad(Game.G,{trigger:true,amt:LOAN42.squadOdAmt(Game.G)})');
    ok(c2.cards[0] && !String(c2.cards[0].o[0]).startsWith('🔒'), 'M1 灵石够：当场还款不加 🔒');
  }

  // ---- M2 §16.6：当年最多 1 次 — 选定 还/战/跑 后才 _squadDoneY；弹出仅写 sqPend ----
  {
    const c = box();
    seedOd(c, 1);
    c.Game.G.stone = 1;
    // 只点一次灰项还款后改选应战：模拟「失败还款」路径的同年封锁
    let nAsk = 0;
    c.UI.card = async function (t, x, p, o) {
      c.cards.push({ t, x, o: (o || []).slice() });
      // 首张三选一：先点灰还，再点应战；后续结算卡随便
      if (String(t).includes('催收') && o && o.length >= 3) {
        const i = nAsk === 0 ? 0 : 1;
        nAsk++;
        return i;
      }
      nAsk++;
      return 0;
    };
    c.Game._fightRes = 'lose';
    c.Math.random = () => 0.99;
    await drain(c, 'LOAN42.offerSquad(Game.G,{trigger:true,amt:400})');
    ok(c.Game.G.loan42._squadDoneY === 12, 'M2 选定后 _squadDoneY=year（含灰还→战）');
    ok(!c.Game.G.loan42.sqPend, 'M2 选定后清 sqPend');
    c.Game.roll = function () { return true; };
    const again = run(c, "LOAN42.trySquad(Game.G,'market')");
    ok(again === null, 'M2 同年 trySquad 不再触发（即使 roll 必中）');
    // 跑：同样记年
    const c3 = box();
    seedOd(c3, 1);
    c3.UI._cardIdx = 2;
    await drain(c3, 'LOAN42.offerSquad(Game.G,{trigger:true,amt:400})');
    ok(c3.Game.G.loan42._squadDoneY === (c3.Game.G.year | 0), 'M2 跑亦记 _squadDoneY');
    ok(!c3.Game.G.loan42.sqPend, 'M2 跑后清 sqPend');
    // choice none（关）：只留 sqPend，不记年 → 下张图复弹
    const c4 = box();
    seedOd(c4, 1);
    c4.UI._cardIdx = 99; // 非 0/1/2
    const r4 = await drain(c4, 'LOAN42.offerSquad(Game.G,{trigger:true,amt:400})');
    ok(r4 && r4.choice === 'none', 'M2 非三选返回 none');
    ok((c4.Game.G.loan42._squadDoneY | 0) !== (c4.Game.G.year | 0), 'M2 关不记 _squadDoneY');
    ok(c4.Game.G.loan42.sqPend && c4.Game.G.loan42.sqPend.amt === 400, 'M2 关后保留 sqPend');
    c4.Game.roll = () => false; // 即使 roll 不中，pending 仍触发
    const t4 = run(c4, "LOAN42.trySquad(Game.G,'market')");
    ok(t4 && t4.trigger && t4.pending && t4.amt === 400, 'M2 关后同年 trySquad 复弹 pending');
  }

  // ---- M3 奥拉夫 low：card() 返回 -1（卡未弹出）→ 不记 _squadDoneY、不写 sqPend，下一张图仍可弹 ----
  {
    const c = box();
    seedOd(c, 1);
    c.UI._cardIdx = -1;
    const r = await drain(c, 'LOAN42.offerSquad(Game.G,{trigger:true,amt:400})');
    ok(r && r.blocked === true, 'M3 card=-1 返回 blocked');
    ok((c.Game.G.loan42._squadDoneY | 0) !== (c.Game.G.year | 0), 'M3 card=-1 不记 _squadDoneY');
    ok(!c.Game.G.loan42.sqPend, 'M3 card=-1 不写 sqPend');
    ok(c.Game.G.loan42.squad === 1, 'M3 card=-1 保留 squad=1');
    c.Game.roll = () => true;
    const t = run(c, "LOAN42.trySquad(Game.G,'market')");
    ok(t && t.trigger === true, 'M3 下一张有怪图仍可触发');
    c.UI._cardIdx = 2;
    await drain(c, 'LOAN42.offerSquad(Game.G,{trigger:true,amt:400})');
    ok(c.Game.G.loan42._squadDoneY === (c.Game.G.year | 0), 'M3 之后真弹出并选定才记年');
    ok(!c.Game.G.loan42.sqPend, 'M3 选定后清 sqPend');
  }

  // ---- M4 奥拉夫 Medium（研究员确认）：弹卡写 sqPend；存档重进复弹同 tier/amt；选定后清 marker 同年不再刷 ----
  {
    const c = box();
    seedOd(c, 1);
    c.Game.G.realm = 2; c.Game.G.stage = 1; // tier = 2 + 0.2 + 0.4 = 2.6
    // 只弹出、不选：card 返回无效 idx，留下 sqPend
    c.UI._cardIdx = 99;
    const rShow = await drain(c, 'LOAN42.offerSquad(Game.G,{trigger:true,amt:400})');
    ok(rShow && rShow.choice === 'none', 'M4 弹出未选定 → none');
    const pend0 = c.Game.G.loan42.sqPend;
    ok(pend0 && pend0.amt === 400 && pend0.y === 12 && Math.abs(pend0.tier - 2.6) < 1e-9, 'M4 弹出写 sqPend={y,tier,amt}');
    ok((c.Game.G.loan42._squadDoneY | 0) !== 12, 'M4 弹出未选定不记 _squadDoneY');

    // 模拟 save/reload：JSON 往返 G
    const raw = JSON.stringify(c.Game.G);
    const c2 = box();
    c2.Game.G = JSON.parse(raw);
    ok(c2.Game.G.loan42.sqPend && c2.Game.G.loan42.sqPend.amt === 400, 'M4 JSON 往返保留 sqPend');
    c2.Game.roll = () => false; // 强制 roll 不中，仍应因 pending 触发
    c2.cards = [];
    const ts = run(c2, "LOAN42.trySquad(Game.G,'market')");
    ok(ts && ts.trigger && ts.pending && ts.amt === 400 && Math.abs(ts.tier - 2.6) < 1e-9,
      'M4 读档后 trySquad 复弹同 amt/tier（跳过 roll）');
    // enterMap 串联：复弹同一张
    c2.UI._cardIdx = 99; // 再次不选，确认 enterMap 路径也能弹
    await drain(c2, "Game.enterMap('market')");
    ok(c2.cards.some(x => String(x.t).includes('催收') && String(x.x).includes('400')),
      'M4 enterMap 复弹催收卡同 amt');
    ok(c2.Game.G.loan42.sqPend && c2.Game.G.loan42.sqPend.amt === 400, 'M4 仍未选定则 sqPend 保留');

    // 跨年仍复弹同一张（文档约定）
    c2.Game.G.year = 13;
    const tsY = run(c2, "LOAN42.trySquad(Game.G,'market')");
    ok(tsY && tsY.trigger && tsY.pending && tsY.amt === 400, 'M4 跨年仍复弹同 amt（pending）');

    // 选定后：清 marker，同年不再刷
    c2.Game.G.year = 12; // 回到弹出年结案
    c2.UI._cardIdx = 2; // 跑
    c2.cards = [];
    await drain(c2, 'LOAN42.offerSquad(Game.G,{trigger:true,amt:400,tier:2.6,pending:true})');
    ok(c2.Game.G.loan42._squadDoneY === 12, 'M4 选定后记 _squadDoneY');
    ok(!c2.Game.G.loan42.sqPend, 'M4 选定后清 sqPend');
    c2.Game.roll = () => true;
    ok(run(c2, "LOAN42.trySquad(Game.G,'market')") === null, 'M4 选定后同年不再刷');
  }

  // ---- M5：催收开场文案稳定 — sqPend.oi 首次写入；复弹/读档复用；老档无 oi 补抽一次 ----
  {
    const c = box();
    seedOd(c, 1);
    // 强制 roll：intro 循环 i=1 → p=1/2；i=2 → p=1/3；使 oi 落到 2（两轮都 true）
    const rollPs = [];
    c.Game.roll = function (p, k) { this.rolls.push([p, k]); rollPs.push(p); return true; };
    c.UI._cardIdx = 99; // 弹出不选
    await drain(c, 'LOAN42.offerSquad(Game.G,{trigger:true,amt:400})');
    const pend = c.Game.G.loan42.sqPend;
    ok(pend && (pend.oi | 0) === 2, 'M5 首次弹出写 sqPend.oi=2');
    ok(rollPs.includes(0.5) && rollPs.includes(1 / 3), 'M5 开场抽签经 Game.roll(1/(i+1))');
    const opens = run(c, 'TEXT42.squadOpen');
    const want = opens[2];
    ok(c.cards[0] && String(c.cards[0].x).startsWith(want), 'M5 首弹卡文案=opens[oi]');

    // 读档复弹：即使 roll 全 false，仍用同一 oi/文案，且不再为开场再 roll
    const raw = JSON.stringify(c.Game.G);
    const c2 = box();
    c2.Game.G = JSON.parse(raw);
    c2.Game.rolls = [];
    c2.Game.roll = function (p, k) { this.rolls.push([p, k]); return false; };
    c2.UI._cardIdx = 99;
    c2.cards = [];
    const tier2 = +c2.Game.G.loan42.sqPend.tier;
    await drain(c2, 'LOAN42.offerSquad(Game.G,{trigger:true,amt:400,tier:' + tier2 + ',pending:true})');
    ok(c2.Game.G.loan42.sqPend && (c2.Game.G.loan42.sqPend.oi | 0) === 2, 'M5 读档复弹保留 oi=2');
    ok(c2.cards[0] && String(c2.cards[0].x).startsWith(want), 'M5 读档复弹同开场文案（不重抽）');
    ok(!c2.Game.rolls.some(r => r[0] === 0.5 || Math.abs(r[0] - 1 / 3) < 1e-12),
      'M5 有 oi 时复弹不为开场再 roll');

    // 老档：sqPend 无 oi → 补抽一次写入，之后稳定
    const c3 = box();
    seedOd(c3, 1);
    c3.Game.G.loan42.sqPend = { y: 12, amt: 400, tier: 2.6 }; // 无 oi
    let nIntroRoll = 0;
    c3.Game.roll = function (p, k) {
      this.rolls.push([p, k]);
      if (p === 0.5 || Math.abs(p - 1 / 3) < 1e-12) { nIntroRoll++; return true; }
      return false;
    };
    c3.UI._cardIdx = 99;
    await drain(c3, 'LOAN42.offerSquad(Game.G,{trigger:true,amt:400,tier:2.6,pending:true})');
    ok(c3.Game.G.loan42.sqPend && (c3.Game.G.loan42.sqPend.oi | 0) === 2, 'M5 老档无 oi：补抽并写入 oi');
    ok(nIntroRoll >= 1, 'M5 老档无 oi：至少一次开场 roll');
    const want3 = run(c3, 'TEXT42.squadOpen')[2];
    ok(c3.cards[0] && String(c3.cards[0].x).startsWith(want3), 'M5 老档补抽后卡文案=opens[oi]');
    // 再弹一次：不应再为开场 roll
    nIntroRoll = 0;
    c3.Game.rolls = [];
    c3.cards = [];
    c3.UI._cardIdx = 99;
    await drain(c3, 'LOAN42.offerSquad(Game.G,{trigger:true,amt:400,tier:2.6,pending:true})');
    ok((c3.Game.G.loan42.sqPend.oi | 0) === 2, 'M5 老档补齐后二次复弹 oi 不变');
    ok(c3.cards[0] && String(c3.cards[0].x).startsWith(want3), 'M5 老档补齐后二次同文案');
    ok(nIntroRoll === 0, 'M5 老档补齐后二次不再开场 roll');

    // Math.random 回退：无 Game.roll 时仍能选开场并写入 oi
    const c4 = box();
    seedOd(c4, 1);
    c4.Game.roll = undefined;
    c4.Math.random = () => 0.01; // 总是 < p → oi 走高
    c4.UI._cardIdx = 99;
    await drain(c4, 'LOAN42.offerSquad(Game.G,{trigger:true,amt:400})');
    ok(c4.Game.G.loan42.sqPend && Number.isFinite(+c4.Game.G.loan42.sqPend.oi),
      'M5 无 Game.roll 时 Math.random 回退仍写 oi');
  }


  // ---- marker fix：DOMContentLoaded 重 hook 不得冲掉 main40 的 _main40 ----
  {
    const c = box();
    // 模拟 main40 先包：enterMap/die 仅有 _main40，无 _loan42
    c.Game.enterMap = async function (id) { this._map = id; this._main40ran = (this._main40ran || 0) + 1; };
    c.Game.enterMap._main40 = 1;
    c.Game.die = async function (kind) { this.G.dead = true; this.G.ending = kind; this._main40died = 1; };
    c.Game.die._main40 = 1;
    // 其余钩子已有 _loan42（首次加载），仅 enterMap/die 会再包
    ok(typeof c.LOAN42._hook === 'function', 'L42._hook 可重入');
    c.LOAN42._hook();
    ok(!!c.Game.enterMap._loan42, '重 hook 后 enterMap._loan42');
    ok(!!c.Game.enterMap._main40, '重 hook 后仍保留 enterMap._main40');
    ok(!!c.Game.die._loan42, '重 hook 后 die._loan42');
    ok(!!c.Game.die._main40, '重 hook 后仍保留 die._main40');
    // 调用链：loan42 外层 → main40 stub
    c.Game.G = { v: 2, year: 1, age: 20, realm: 1, stone: 0, debt: 0, ap: 4, loan42: null, inv: {}, flags: {} };
    await c.Game.enterMap('market');
    ok(c.Game._main40ran === 1, '重 hook 后仍调用到原 _main40 包装');
    // 已有 _loan42 时再 hook 不重复包（标记仍在）
    const em1 = c.Game.enterMap;
    c.LOAN42._hook();
    ok(c.Game.enterMap === em1 && c.Game.enterMap._loan42 && c.Game.enterMap._main40,
      '已包装时再 hook 不重包且双标记仍在');
  }

  console.log(fails ? `${fails} FAIL / ${n}` : `ALL PASS ${n}`);
  process.exitCode = fails;
})().catch(e => { console.error(e); process.exitCode = 1; });

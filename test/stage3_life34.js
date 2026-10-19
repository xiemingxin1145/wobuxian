// 第十二轮：钱多多/记账童子记仇选项 → Life34.rel；追兵战 × life34「仇家上门」同一年互斥。
// node test/stage3_life34.js（退出码 = 失败数）。两部分：
//   A. 间谍版 Life34（只有 rel，记录每次调用）：查每个记仇选项调的 id / 幅度、非记仇选项不调、Life34 不存在 / 无 rel / 抛错 / 非当前存档时不报错；
//   B. vm 载入 main 真实的 www/js/life34.js（最小桩环境）+ stage3：真实 G.life34.rel 变化、simYear 生成的仇家上门、Life34.visit 写的日志，
//      验证同年互斥两方向与跨年不互斥；life34 的 Life34 是顶层 const，删掉 window.Life34 后 stage3 仍能用 typeof 拿到。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const JS = path.join(__dirname, '..', 'www', 'js');
const STAGE3 = fs.readFileSync(path.join(JS, 'stage3_encounter_draft.js'), 'utf8');
const LIFE34 = fs.readFileSync(path.join(JS, 'life34.js'), 'utf8');
const DEV = fs.readFileSync(path.join(JS, 'dev_entry_v25.js'), 'utf8');
const J = v => JSON.stringify(v);

// ---------- A. 间谍版 Life34 ----------
function sandboxA() {
  const ctx = { console: { log() {}, error() {} }, picks: [], shown: [], saves: 0 };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(`
    var UI = { card: async (t, b, ic, opts) => { shown.push({ t, b }); return picks.length ? picks.shift() : 0; }, hud() {}, toast() {} };
    var Game = { G: null, save() { saves++; } };
  `, ctx);
  vm.runInContext(STAGE3, ctx);
  return ctx;
}
const spyLife = (ctx, opt = {}) => {
  ctx.relCalls = []; ctx.otherGets = [];
  vm.runInContext(`var Life34 = undefined;`, ctx);
  const base = { rel: (id, d) => { ctx.relCalls.push([id, d]); if (opt.throws) throw new Error('boom'); } };
  if (opt.noRel) delete base.rel;
  ctx.Life34 = new Proxy(base, { get(t, k) { if (k !== 'rel' && typeof k === 'string') ctx.otherGets.push(k); return t[k]; } });
};
const S0 = (ctx) => vm.runInContext('Stage3', ctx);
const run = async (ctx, fn, G, picks) => { ctx.picks = picks.slice(); ctx.shown.length = 0; ctx.Game.G = G; return S0(ctx)[fn](G); };

(async () => {
  {
    const ctx = sandboxA(), S = S0(ctx);
    ok(Object.isFrozen(S.GRUDGE_REL) && S.GRUDGE_REL.renege === -10 && S.GRUDGE_REL.bribeExposed === -15 && S.GRUDGE_REL.report === -20, '档位表冻结：赖账 -10 / 贿赂露馅 -15 / 举报·告发 -20');
    ok(Object.values(S.GRUDGE_REL).every(v => v <= -10 && v >= -20), '所有档位都在 -10..-20 之间');

    // A1 钱多多：举报 → Life34.rel('merchant', -20)，只调一次
    spyLife(ctx);
    let G = { debt: 1000, stone: 0, aff: {}, flags: {} };
    let r = await run(ctx, 'runMerchantChain', G, [1, 0]);
    ok(J(ctx.relCalls) === J([['merchant', -20]]) && r.rel && r.rel.ok && r.rel.id === 'merchant' && r.rel.d === -20, '钱多多「举报」→ Life34.rel("merchant", -20) 恰好 1 次：' + J(ctx.relCalls));
    ok(G.debt === 800 && G.aff.merchant === 0 && G.flags.s3m_step === 1, '举报原有结算不变：欠款 -200、好感钳 0、记 s3m_step');
    ok(ctx.shown.some(c => c.t === '奇遇结果' && c.b.includes('钱多多记仇：恩怨 -20')), '结果卡写明「钱多多记仇：恩怨 -20」');
    ctx.relCalls.length = 0;
    r = await run(ctx, 'runMerchantChain', G, [0, 0]);
    ok(r.step === 'visit' && r.attitude === 'grudge' && ctx.relCalls.length === 0 && G.flags.bounty === 1, '钱多多回访（记仇卖行踪）是 NPC 的后果，不再额外调 rel');
    // A2 扛税 / 不掺和 不调
    for (const [pk, nm] of [[0, '扛税'], [2, '不掺和']]) {
      spyLife(ctx); G = { debt: 1000, stone: 0, aff: { merchant: 30 }, flags: {} };
      await run(ctx, 'runMerchantChain', G, [pk, 0]); await run(ctx, 'runMerchantChain', G, [0, 0]);
      ok(ctx.relCalls.length === 0, `钱多多「${nm}」及回访：不调 Life34.rel`);
    }
    // A3 记账童子：告发 → rel('xianguan', -20)；查账（记仇误工费）不再调
    spyLife(ctx); G = { debt: 5000, stone: 1000, aff: {}, flags: {} };
    r = await run(ctx, 'runLedgerChain', G, [2, 0]);
    ok(r.choice === 'report' && J(ctx.relCalls) === J([['xianguan', -20]]) && r.rel.ok, '记账童子「告发」→ Life34.rel("xianguan", -20) 恰好 1 次');
    ok(ctx.shown.some(c => c.t === '奇遇结果' && c.b.includes('记账童子记仇：恩怨 -20')), '告发结果卡写明恩怨 -20');
    ctx.relCalls.length = 0; r = await run(ctx, 'runLedgerChain', G, [0, 0]);
    ok(r.attitude === 'grudge' && !r.exposed && ctx.relCalls.length === 0 && G.debt === 4700 + Math.round(4700 * 0.15), '查账（记仇误工费 +15%）是后果，不再调 rel');
    // A4 贿赂 → 一般 → 露馅 → rel('xianguan', -15)
    spyLife(ctx); G = { debt: 5000, stone: 1000, aff: {}, flags: {} };
    r = await run(ctx, 'runLedgerChain', G, [1, 0]);
    ok(r.choice === 'bribe' && ctx.relCalls.length === 0, '贿赂当下（还没露馅）不调 rel');
    r = await run(ctx, 'runLedgerChain', G, [0, 0]);
    ok(r.exposed && J(ctx.relCalls) === J([['xianguan', -15]]) && r.rel.ok && G.debt === 3500 + 1650, '查账露馅 → Life34.rel("xianguan", -15) 恰好 1 次，补回 +1650 不变');
    ok(ctx.shown.some(c => c.t === '奇遇结果' && c.b.includes('露馅') && c.b.includes('记账童子记仇：恩怨 -15')), '露馅结果卡写明恩怨 -15');
    // A5 贿赂后刷到亲近 → 不露馅 → 不调；对账 → 不调
    spyLife(ctx); G = { debt: 5000, stone: 1000, aff: {}, flags: {} };
    await run(ctx, 'runLedgerChain', G, [1, 0]); G.aff.xianguan = 80; r = await run(ctx, 'runLedgerChain', G, [0, 0]);
    ok(!r.exposed && ctx.relCalls.length === 0, '贿赂后亲近（童子瞒下）：不调 rel');
    spyLife(ctx); G = { debt: 5000, stone: 1000, aff: {}, flags: {} };
    await run(ctx, 'runLedgerChain', G, [0, 0]); await run(ctx, 'runLedgerChain', G, [0, 0]);
    ok(ctx.relCalls.length === 0, '对账 + 查账（亲近）：不调 rel');
    ok(ctx.otherGets.every(k => k === 'syncAff'), '只用 Life34.rel / Life34.syncAff，不碰 Life34 的其它接口：' + J(ctx.otherGets));

    // A6 不调平行系统：举报/告发/露馅后存档里没有新的恩怨/仇恨字段，G.sectRel 原样（有则不变、无则不建）
    spyLife(ctx);
    const base = { debt: 5000, stone: 1000, aff: { mom: 33 }, flags: { s3b_token: 2 }, sect: 'qingyun', sectRel: { 'qingyun|tianmo': -30, 'baicao|qingyun': 12 } };
    G = JSON.parse(J(base)); await run(ctx, 'runMerchantChain', G, [1, 0]); await run(ctx, 'runMerchantChain', G, [0, 0]);
    await run(ctx, 'runLedgerChain', G, [1, 0]); await run(ctx, 'runLedgerChain', G, [0, 0]);
    const G2 = JSON.parse(J(base)); delete G2.sectRel; await run(ctx, 'runLedgerChain', G2, [2, 0]);
    ok(J(G.sectRel) === J(base.sectRel) && !('sectRel' in G2), 'G.sectRel：两条链只读不写——已有关系逐字段不变，没有时不新建');
    const topNew = Object.keys(G).filter(k => !(k in base)), topNew2 = Object.keys(G2).filter(k => !(k in base));
    ok(topNew.length === 0 && topNew2.length === 0 && !('life34' in G), '存档没多出顶层字段（不自建 G.grudge / G.life34 等平行系统）：' + J(topNew.concat(topNew2)));
    const badFlag = Object.keys(G.flags).concat(Object.keys(G2.flags)).filter(k => /grudge|hate|enmity|rel|仇|恩怨|sect/i.test(k));
    ok(badFlag.length === 0, 'flags 里没有自建的仇恨 / 恩怨 / 宗门好感 flag：' + J(badFlag));
    ok(J(Object.keys(G.aff).sort()) === J(['merchant', 'mom', 'xianguan']) && G.aff.mom === 33, 'G.aff 只动链里的两位 NPC（正式好感照旧，不当恩怨用）');
    const CODE = STAGE3.replace(/\/\/.*$/gm, ''); // 去掉行注释（注释里会提到 G.life34.rel[id]）
    ok(!/sectRel/.test(CODE) && !/life34\.rel\s*\[/.test(CODE) && !/\.rel\s*\[[^\]]*\]\s*=/.test(CODE), 'stage3 源码（去注释）：不出现 sectRel、不直接改 G.life34.rel，只经 Life34.rel');
    ok((STAGE3.match(/L34\.rel\(/g) || []).length === 1 && (STAGE3.match(/L34\.syncAff\(/g) || []).length === 1 && (STAGE3.match(/this\.affRel\(/g) || []).length === 3 && !/lifeRel|this\.addAffTo\(G, this\.(M|X)_NPC/.test(CODE),
      'stage3 只有 affRel 一处调 Life34.rel / Life34.syncAff；两条链改好感 3 处都经 affRel（钱多多第 1 步 / 童子第 1 步 / 露馅），不再直接 addAffTo');

    // A7 Life34 不存在 / 无 rel / rel 抛错 / 不是当前存档：不报错，链照常结算
    const cases = [
      ['Life34 未定义', () => { vm.runInContext('var Life34 = undefined;', ctx); ctx.relCalls = []; }, 'no-life34'],
      ['Life34 = null', () => { ctx.Life34 = null; ctx.relCalls = []; }, 'no-life34'],
      ['Life34 没有 rel', () => spyLife(ctx, { noRel: true }), 'no-life34'],
      ['Life34.rel 抛错', () => spyLife(ctx, { throws: true }), 'error'],
    ];
    for (const [nm, setup, why] of cases) {
      setup(); G = { debt: 1000, stone: 1000, aff: {}, flags: {} };
      let threw = false, r1, r2, r3;
      try { r1 = await run(ctx, 'runMerchantChain', G, [1, 0]); r2 = await run(ctx, 'runLedgerChain', G, [1, 0]); r3 = await run(ctx, 'runLedgerChain', G, [0, 0]); } catch (e) { threw = e; }
      ok(!threw && r1.ok && r1.rel.ok === false && r1.rel.why === why && r3.exposed && r3.rel.why === why && G.debt === 880 && G.stone === 700 && G.aff.merchant === 0 && G.aff.xianguan === 20,
        `${nm}：不报错，链照常结算（举报 1000→800、贿赂抹 800、露馅补 880），rel 标 ${why}` + (threw ? '（抛了 ' + threw + '）' : ''));
      ok(!ctx.shown.some(c => c.b.includes('记仇：恩怨')), `${nm}：结果卡不写恩怨`);
    }
    spyLife(ctx); G = { debt: 1000, stone: 0, aff: {}, flags: {} };
    ctx.picks = [1, 0]; ctx.Game.G = { other: 1 }; r = await S.runMerchantChain(G);
    ok(r.ok && ctx.relCalls.length === 0 && r.rel.why === 'not-current-save', 'G 不是 Game.G（Life34.rel 只认当前存档）：不调用，避免记到别的存档上');
    vm.runInContext('var Game = undefined;', ctx); ctx.picks = [1, 0]; r = await S.runMerchantChain({ debt: 1000, aff: {}, flags: {} });
    ok(r.ok && ctx.relCalls.length === 0 && r.rel.why === 'not-current-save', 'Game 未定义：不调用、不报错');
    ok(S.lifeYear({ year: 7, age: 20 }) === 7 && S.lifeYear({ age: 20 }) === 20 && S.lifeYear({}) === 0 && S.lifeYear(null) === 0, 'lifeYear 与 Life34.yr 同式：G.year || G.age || 0');
  }

  // ---------- B. vm 载入真实 life34.js ----------
  const ctx = { console: { log() {}, error() {} }, Math, setTimeout: () => 0 };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(`
    var saves = 0, says = [], fights = [];
    var REALMS = [{ n: '凡人', need: 80 }, { n: '练气', need: 200 }, { n: '筑基', need: 520 }, { n: '金丹', need: 1300 }];
    var NPCS = { merchant: { n: '奸商·钱多多', spr: 'npc_merchant', map: 'market', at: [9, 9], por: 'npc_merchant' },
                 xianguan: { n: '仙官·记账童子', spr: 'npc_disciple', map: 'heaven', at: [10, 10], por: 'npc_disciple' } };
    var QUESTS = {}, SECTS = { qingyun: { n: '青云宗' }, tianmo: { n: '天魔殿' } }, ITEMS = {};
    var MAPINFO = { market: { n: '云来坊市', mons: ['slime'], tier: 1 } }, ASSETS = { maps: {} };
    var R = { ents: [], mapId: 'market', mode: 'map', player: null };
    function t2p(i, j) { return [i, j]; } function walkable() { return true; } function addEnt() {} function removeEnt() {} function loadSprite() {}
    var npcAI = function () {};
    var UI = { picks: [], card: async () => (UI.picks.length ? UI.picks.shift() : 0), say: async (por, nm, txt, opts) => { says.push(txt); return UI.picks.length ? UI.picks.shift() : 0; }, hud() {}, toast() {}, modal: null };
    var Game = { G: null, save() { saves++; }, async yearEnd() { this.G.year++; this.G.age++; }, interactEnt() {}, refreshNpcs() {}, async enterMap() {}, acceptQuest() {},
      async fight(m, o) { fights.push(m); return { res: Game._fightRes || 'win' }; }, canEnter() { return true }, give() {},
      // 与 game.js Game.apply 的 aff 分支同式（life34 载入时包装它，做 G.aff → L.rel 的 50% 同步）
      async apply(eff) { const G = this.G; for (const tk of (eff || '').split(';')) { const p = tk.trim().split(':'); if (p[0] === 'aff') { const n = +p[2]; G.aff[p[1]] = Math.max(0, Math.min(150, (G.aff[p[1]] || 0) + n)); } } return []; } };
  `, ctx);
  vm.runInContext(LIFE34, ctx);
  vm.runInContext(STAGE3, ctx);
  const S = vm.runInContext('Stage3', ctx), GM = vm.runInContext('Game', ctx), UIx = vm.runInContext('UI', ctx);
  const L34 = vm.runInContext('Life34', ctx);
  ok(typeof L34.rel === 'function' && L34.rel.length === 2, '真实 life34.js 载入：Life34.rel(id, d) 存在');
  vm.runInContext('delete window.Life34;', ctx);
  ok(vm.runInContext('typeof window.Life34', ctx) === 'undefined' && vm.runInContext('typeof Life34', ctx) === 'object', '删掉 window.Life34 后顶层 const Life34 仍在（stage3 用 typeof 取，不依赖 window）');
  const pick = (...a) => { UIx.picks = a; };
  const rel = (g, id) => (g.life34 && g.life34.rel && g.life34.rel[id]) || 0;
  ok(typeof L34.syncAff === 'function' && /Game\.apply = async function/.test(LIFE34), 'main 的 life34：有 Life34.syncAff，并包装了 Game.apply（好感同步入口）');
  // B0 定位：链原来的写法（addAffTo 直接写 G.aff）不经 Game.apply → 同步不触发；同样的变化走 Game.apply('aff:…') 才同步
  {
    const g0 = { year: 2, age: 10, realm: 0, debt: 0, stone: 0, aff: { merchant: 30 }, flags: {}, life34: { v: 1, fav: 1, rel: {}, seen: {}, log: [], pending: null } };
    GM.G = g0; S.addAffTo(g0, 'merchant', -40);
    ok(g0.aff.merchant === 0 && rel(g0, 'merchant') === 0, 'B0 直接写 G.aff（旧 addAffTo 路径）：好感 30→0，L.rel 仍 0 —— main 的同步不会触发');
    g0.aff.merchant = 30; await GM.apply('aff:merchant:-40');
    ok(g0.aff.merchant === 0 && rel(g0, 'merchant') === -15, 'B0 同样变化走 Game.apply：L.rel -15（trunc(-30×0.5)）—— 同步只挂在 Game.apply / Talk.gift');
    g0.aff.xianguan = 0; g0.life34.rel = {}; await GM.apply('aff:xianguan:9'); await GM.apply('aff:xianguan:-5');
    ok(rel(g0, 'xianguan') === 4 - 2, 'B0 向零取整：+9 → +4，-5 → -2');
  }
  // B1 每个选择的 L.rel 总变化（同步那份 + 补差额，不重复计），按不同起始好感
  const fresh = (aff, o) => Object.assign({ year: 4, age: 14, realm: 1, debt: 5000, stone: 1000, aff: Object.assign({}, aff), flags: {}, life34: { v: 1, fav: 1, rel: { merchant: 0, xianguan: 0 }, seen: {}, log: [], pending: null } }, o || {});
  const totals = {};
  const caseM = async (nm, pk, a0, want, wantAff) => {
    const g = fresh({ merchant: a0 }); GM.G = g; pick(pk, 0); const r = await S.runMerchantChain(g);
    totals['钱多多·' + nm + '@' + a0] = rel(g, 'merchant');
    ok(rel(g, 'merchant') === want && g.aff.merchant === wantAff && (want === 0 ? !r.rel : r.rel.ok && r.rel.d === want && r.rel.synced + r.rel.extra === want),
      `钱多多「${nm}」好感 ${a0}→${wantAff}：L.rel 总变化 = ${want}（同步 ${r.rel ? r.rel.synced : 0} + 补 ${r.rel ? r.rel.extra : 0}），实得 ${rel(g, 'merchant')}`);
    return g;
  };
  await caseM('举报', 1, 0, -20, 0);    // 好感已 0：同步 0 + 补 -20
  await caseM('举报', 1, 30, -20, 0);   // Δ-30：同步 -15 + 补 -5
  await caseM('举报', 1, 100, -20, 60); // Δ-40：同步 -20 + 补 0（已达标）
  await caseM('扛税', 0, 0, 30, 60);    // 正向：只有同步 +30，不另加
  await caseM('扛税', 0, 120, 15, 150); // 钳 150：实际 Δ+30 → +15
  await caseM('不掺和', 2, 30, -2, 25); // Δ-5 → trunc(-2.5) = -2
  const caseX = async (nm, pk, a0, want, wantAff) => {
    const g = fresh({ xianguan: a0 }); GM.G = g; pick(pk, 0); const r = await S.runLedgerChain(g);
    totals['记账童子·' + nm + '@' + a0] = rel(g, 'xianguan');
    ok(rel(g, 'xianguan') === want && g.aff.xianguan === wantAff && (!r.rel || r.rel.d === want),
      `记账童子「${nm}」好感 ${a0}→${wantAff}：L.rel 总变化 = ${want}，实得 ${rel(g, 'xianguan')}`);
    return g;
  };
  await caseX('对账', 0, 0, 30, 60);
  await caseX('告发', 2, 0, -20, 0);
  await caseX('告发', 2, 50, -20, 10);
  const gb = await caseX('贿赂', 1, 0, 10, 20);
  { const r0 = rel(gb, 'xianguan'); pick(0, 0); const r = await S.runLedgerChain(gb);
    totals['记账童子·贿赂露馅(查账这一步)'] = rel(gb, 'xianguan') - r0;
    ok(r.exposed && rel(gb, 'xianguan') - r0 === -15 && r.rel.synced === 0 && r.rel.extra === -15 && gb.aff.xianguan === 20, '记账童子「贿赂露馅」这一步：好感不变 → 同步 0 + 补 -15 = -15（贿赂当时的 +10 是同步，整条链净 -5）'); }
  { const g = fresh({ xianguan: 0 }); GM.G = g; pick(1, 0); await S.runLedgerChain(g); g.aff.xianguan = 80; const r0 = rel(g, 'xianguan'); pick(0, 0); const r = await S.runLedgerChain(g);
    ok(!r.exposed && rel(g, 'xianguan') === r0, '贿赂后亲近（不露馅）：查账这一步 L.rel 不变'); }
  // 第 2 步（回访/查账）只改债务，不改好感 → 不动 L.rel
  { const g = fresh({ merchant: 0 }); GM.G = g; pick(1, 0); await S.runMerchantChain(g); const r0 = rel(g, 'merchant'); pick(0, 0); await S.runMerchantChain(g);
    ok(rel(g, 'merchant') === r0 && g.flags.bounty === 1, '钱多多回访（卖行踪）：L.rel 不再变'); }
  console.log('PER-CHOICE L.rel ' + J(totals));
  let G = { year: 3, age: 12, realm: 1, debt: 1000, stone: 1000, aff: {}, flags: {}, sect: 'qingyun', sectRel: { 'qingyun|tianmo': -30 } };
  GM.G = G;
  pick(1, 0); let r = await S.runMerchantChain(G);
  ok(r.rel.ok && G.life34 && G.life34.rel.merchant === -20, '真实 Life34.rel：钱多多举报后 G.life34.rel.merchant = -20');
  pick(0, 0); await S.runMerchantChain(G); // 回访，链结束
  pick(1, 0); await S.runMerchantChain(G); // 再举报一次
  ok(G.life34.rel.merchant === -40, '再举报一次 → -40（到 life34 的「仇」线）');
  pick(1, 0); await S.runLedgerChain(G); pick(0, 0); r = await S.runLedgerChain(G);
  ok(r.exposed && G.life34.rel.xianguan === 10 - 15 && r.rel.d === -15, '真实 Life34：记账童子贿赂（好感 +20 → 同步 +10）后露馅（-15）→ G.life34.rel.xianguan = -5');
  ok(J(G.sectRel) === J({ 'qingyun|tianmo': -30 }), '真实环境下 G.sectRel 不被两条链改动');
  ok(G.life34.pending === null, '同一年里 life34 不会凭空生成仇家上门（只在过年 simYear 时生成）');

  // 方向②：本年打追兵战 → 写互斥标记；同年 huntBlocksFoe 为真
  const y3 = G.year;
  let s = S.settleBounty(G, { result: 'win', reason: 'cleared', tier: 0 });
  ok(s.settled && G.flags.s3b_hunt_year === y3 && S.huntBlocksFoe(G), `年 ${y3} 打完追兵战（胜）→ flags.s3b_hunt_year=${y3}，huntBlocksFoe 为真（给 life34 侧读）`);
  const Gl = { year: 9, debt: 2000, flags: {} }; s = S.settleBounty(Gl, { result: 'lose', reason: 'dead', tier: 1 });
  ok(s.settled && Gl.flags.s3b_hunt_year === 9 && S.huntBlocksFoe(Gl), '打输也算打过：s3b_hunt_year = 当年');
  const Gc = { year: 9, debt: 2000, flags: {} }; s = S.settleBounty(Gc, { result: 'lose', reason: 'closed', tier: 1 });
  const Gi = { year: 9, debt: 2000, flags: {} }; S.settleBounty(Gi, { result: 'draw' });
  ok(!s.settled && !('s3b_hunt_year' in Gc.flags) && !('s3b_hunt_year' in Gi.flags) && !S.huntBlocksFoe(Gc), '中途关掉 / 非法结果：不写标记');
  ok(S.huntBlocksFoe({ age: 15, flags: { s3b_hunt_year: 15 } }) && !S.huntBlocksFoe({ year: 4, flags: { s3b_hunt_year: '4' } }) && !S.huntBlocksFoe({ year: 4 }) && !S.huntBlocksFoe(null), 'huntBlocksFoe：没有 year 用 age；标记非数字 / 缺 flags / 无存档 → 假');

  // 过年 → simYear：rel ≤ -40 的钱多多「必上门」（下一年），跨年不受去年追兵战影响
  await GM.yearEnd();
  ok(G.year === y3 + 1 && G.life34.pending && G.life34.pending.type === 'foe' && G.life34.pending.npc === 'merchant', `过年后 life34 安排钱多多年 ${y3 + 1} 上门寻仇（真实 simYear）`);
  ok(!S.huntBlocksFoe(G), '跨年不互斥：去年的追兵战标记不挡今年的仇家上门');
  // 方向①：今年仇家在路上 → 不开追兵战
  let c = S.canHunt(G);
  ok(!c.ok && c.reason === 'foe' && c.src === 'pending' && c.npc === 'merchant' && /钱多多/.test(c.note), '方向①：今年仇家上门挂着（pending foe）→ canHunt 拒绝追兵战：' + c.note);
  // 应战打赢：life34 清 pending、记日志「第N年：钱多多找你寻仇。」→ 仍是同一年 → 仍不开
  pick(0); GM._fightRes = 'win'; await L34.visit({ label: '奸商·钱多多' });
  ok(G.life34.pending === null && G.life34.log.some(t => t === `第${G.year}年：奸商·钱多多找你寻仇。`), '真实 Life34.visit 应战：pending 清空、日志记本年寻仇');
  ok(G.life34.seen['foe_' + G.year] === 1 && !('foe_' + G.age in G.life34.seen && G.age !== G.year), `真实 Life34.visit 写 L.seen.foe_${G.year}（键年 = G.year || G.age）`);
  c = S.canHunt(G); ok(!c.ok && c.src === 'seen', '方向①：本年仇家已上过门（L.seen.foe_年）→ 仍不开追兵战');
  // 赔礼路径同样算
  const Gp = { year: 20, age: 30, realm: 1, debt: 0, stone: 999, aff: {}, flags: {}, life34: { v: 1, loc: {}, rel: { merchant: -60 }, sect: {}, log: [], seen: {}, pending: { type: 'foe', npc: 'merchant' } } };
  GM.G = Gp; pick(1); await L34.visit({ label: '奸商·钱多多' });
  ok(Gp.life34.pending === null && Gp.life34.log[0] === '第20年：你向奸商·钱多多赔礼，恩怨稍解。' && Gp.life34.seen.foe_20 === 1 && !S.canHunt(Gp).ok && S.canHunt(Gp).src === 'seen', '真实 Life34.visit 赔礼：写 L.seen.foe_20 → canHunt 拒绝');
  // 只认 seen 键：本年日志有寻仇句但没有键 → 不挡（日志文字不再作判据）；键在、日志空 → 挡
  ok(S.canHunt({ year: 20, life34: { log: ['第20年：奸商·钱多多找你寻仇。'], seen: {} } }).ok && !S.canHunt({ year: 20, life34: { log: [], seen: { foe_20: 1 } } }).ok, '追兵战互斥只读 L.seen.foe_<年>（+ pending），不再匹配日志文字');
  // 年份表达式同 life34：没有 G.year 用 G.age
  { const Ga = { age: 33, realm: 1, debt: 0, stone: 0, aff: {}, flags: {}, life34: { v: 1, loc: {}, rel: { merchant: -60 }, sect: {}, log: [], seen: {}, pending: { type: 'foe', npc: 'merchant' } } };
    GM.G = Ga; pick(0); GM._fightRes = 'win'; await L34.visit({ label: '奸商·钱多多' });
    ok(Ga.life34.seen.foe_33 === 1 && !S.canHunt(Ga).ok && S.canHunt(Ga).src === 'seen', '无 G.year 的存档：life34 写 foe_33（G.age），canHunt 读同一个键');
    ok(S.canHunt({ age: 34, life34: { seen: { foe_33: 1 } } }).ok, '…次年（age 34）不挡'); }
  // 方向② 真实 simYear：本年追兵战打过（huntBlocksFoe）→ 本年不派仇家；次年照派
  { const Gh = { year: 7, age: 20, realm: 1, debt: 0, stone: 0, aff: {}, flags: {}, life34: { v: 1, loc: {}, rel: { merchant: -80 }, sect: {}, log: [], seen: {}, pending: null } };
    GM.G = Gh; await GM.yearEnd(); // → 年 8（未打追兵战）
    ok(Gh.life34.pending && Gh.life34.pending.type === 'foe', '对照：没打追兵战 → 年 8 仇家照派');
    Gh.life34.pending = null; Gh.year = 8; Gh.flags.s3b_hunt_year = 9; // 标记写成「下一年」= 过年后的本年
    await GM.yearEnd();
    ok(Gh.year === 9 && S.huntBlocksFoe(Gh) && !(Gh.life34.pending && Gh.life34.pending.type === 'foe') && !Gh.life34.seen.foe_9, '方向②（真实 life34）：huntBlocksFoe(年 9) 为真 → simYear 不派仇家、不写 foe_9');
    Gh.life34.pending = null; await GM.yearEnd(); // 清掉可能随机派来的其它来客，否则 simYear 不再生成
    ok(Gh.year === 10 && !S.huntBlocksFoe(Gh) && Gh.life34.pending && Gh.life34.pending.type === 'foe', '…年 10 标记过期 → 仇家照派（仇照记，明年再来）'); }
  GM.G = Gp;
  // 跨年：明年（仇已解到 > -40、没有新 pending）→ 可以开
  Gp.life34.rel.merchant = 0; await GM.yearEnd();
  ok(Gp.year === 21 && !(Gp.life34.pending && Gp.life34.pending.type === 'foe') && S.canHunt(Gp).ok, '跨年不互斥：去年的寻仇 / 赔礼日志不挡今年追兵战');
  GM.G = G; G.year += 1; ok(S.canHunt(G).ok, '跨年不互斥：去年应战日志不挡今年');
  // 其它来客不挡；约定键 L.seen.foe_年 也认
  ok(S.canHunt({ year: 5, life34: { pending: { type: 'friend', npc: 'merchant' }, log: [], seen: {} } }).ok && S.canHunt({ year: 5, life34: { pending: { type: 'sect', pair: 'a|b' } } }).ok && S.canHunt({ year: 5, life34: { pending: { type: 'errand' } } }).ok, '报恩 / 宗门求援 / 托付来客不挡追兵战');
  ok(!S.canHunt({ year: 5, life34: { seen: { foe_5: 1 }, log: [] } }).ok && S.canHunt({ year: 6, life34: { seen: { foe_5: 1 } } }).ok, 'L.seen.foe_<年>（main life34 写的键）当年挡、跨年不挡');
  ok(S.canHunt({ year: 1, life34: { seen: { foe_10: 1, foe_11: 1 } } }).ok, '键年份精确匹配：foe_10 / foe_11 不算第 1 年');
  // 健壮性：没有 life34 / 结构坏 → 不报错，放行
  let threw = false; try {
    ok([null, undefined, {}, { year: 3 }, { year: 3, life34: 'x' }, { year: 3, life34: { pending: 'foe', log: 'x', seen: null } }, { year: 3, life34: { log: [null, 5] } }].every(g => S.canHunt(g).ok), '没有 G / 没有 life34 / 字段坏：不报错、放行');
  } catch (e) { threw = e; } ok(!threw, 'canHunt 对坏数据不抛错' + (threw ? '：' + threw : ''));
  ok(J(S.foeVisitThisYear({ year: 3, life34: { pending: { type: 'foe', npc: 'merchant' } } })) === J({ hit: true, src: 'pending', npc: 'merchant', year: 3 }), 'foeVisitThisYear 返回来源与年份');
  const Gro = { year: 3, flags: {}, life34: { pending: { type: 'foe', npc: 'x' }, log: [], seen: {} } }; const snap = J(Gro); S.canHunt(Gro); S.foeVisitThisYear(Gro); S.huntBlocksFoe(Gro);
  ok(J(Gro) === snap, 'canHunt / foeVisitThisYear / huntBlocksFoe 只读，不改存档');

  // 开发者入口：追兵战按钮先过 canHunt 再开即时战；只有 dev_entry 调 canHunt
  const zb = DEV.slice(DEV.indexOf('zb.onclick'), DEV.indexOf('document.body.appendChild(zb)'));
  ok(zb.indexOf('Stage3.canHunt(G)') > 0 && zb.indexOf('Stage3.canHunt(G)') < zb.indexOf('RealtimeBattle.open(') && /if \(!gate\.ok\) \{[^}]*return; \}/.test(zb), 'dev_entry「追兵战」：先 Stage3.canHunt，拒绝时 toast 后 return，不开即时战');
  const users = re => fs.readdirSync(JS).filter(f => f.endsWith('.js') && f !== 'stage3_encounter_draft.js' && re.test(fs.readFileSync(path.join(JS, f), 'utf8'))).join(',');
  ok(users(/canHunt|affRel/) === 'dev_entry_v25.js', '只有 dev_entry_v25.js 调 canHunt（正式流程不接）：' + users(/canHunt|affRel/));
  ok(users(/huntBlocksFoe/) === 'life34.js' && /Stage3\.huntBlocksFoe\(G\)/.test(LIFE34) && /L\.seen\['foe_' \+ Life34\.yr\(\)\] = 1/.test(LIFE34) && !/s3b_hunt_year/.test(LIFE34),
    'main 的 life34.js 读 Stage3.huntBlocksFoe(G)、写 L.seen[\'foe_\' + Life34.yr()]；不直接读 s3b_hunt_year（本分支未改 life34.js）');

  console.log(fails ? fails + ' FAILED' : 'ALL PASS');
  process.exit(fails);
})().catch(e => { console.error(e); process.exit(99); });

// v3.7.0 NPC 之间的自发事件 NPC37E（开放世界线第三十轮）：结仇 / 求助 / 讨债，NPC 之间发生，不需要玩家在场。
// 独立文件，放在 npc37.js 之后加载；不改 game.js / main.js / jianghu34.js / life34.js / talk.js。只包裹 NPC37.yearNews（npc37.js 已包 Game.yearEnd），所以每年年末先掷自发事件，再走原来的年度新闻 + topUp 补到 3 条。
// 规则（docs/research_story37.md §1）：
//   NPC↔NPC 关系存 G.npc37.rel['a|b']（键按字典序拼接，−100..100），标签 G.npc37.tie（ch 仇）；首次读到某对时按宗门惰性初始化：同宗 +20、G.sectRel 敌对（<0）−20、其余 0。
//   NPC↔NPC 欠账存 G.npc37.owe['债主>欠债人'] = 灵石数（只是 NPC 之间的账，不动玩家灵石 / G.debt）；JH34 的 s.debt（欠讨债司）只读，影响讨债成败。
//   额度与路遇共用：新闻走 NPC37.emit（每 NPC 每年 ≤2 条事件含路遇、全年新闻 ≤6、toast ≤2），另外每人每年最多 1 条结仇。每年自发事件 1–2 条。
//   年度衰减（鬼谷式）：|rel|>60 的每年向 0 移 5。
//   玩家只在「求助」里被间接影响：被救的人是你的好友（Life34.rel≥40）→ 你对出手相助者好感 +3，走 JH34.addAff 只改 G.aff（不直接加 L.rel）。
//   新闻 k:'npc37' 写 G.jh34.feed（JH34.say，FEED_MAX 40）；Story37 总线发 'npc:feud' / 'npc:help' / 'npc:debt'。
'use strict';
const NEWS37C = {"feud":["{a}与{b}在{map}争一株灵草，两人当场翻脸。","{a}当众说{b}的剑法是“抄来的”，梁子就此结下。","{b}抢先拿走了{a}看中的洞府，{a}放话不死不休。","{a}在{map}的茶楼里泼了{b}一身茶，在场众人都看呆了。","{a}欠{b}一顿酒，赖了三年，今日终于翻脸。","{b}揭了{a}的老底，{a}如今见他就绕道走。","{a}与{b}为谁是{map}第一剑客打了起来，平手收场，结了仇。","{a}的灵兽咬了{b}的道袍，赔了钱，{b}还是不肯罢休。","{map}传言：{a}与{b}已经割袍断义。"],"help":["{a}在{map}被困，{b}连夜赶去相救。","{a}走火入魔，{b}守了他三天三夜。","{a}缺一味主药，{b}把自家珍藏送了过去。","{a}被仇家追杀，逃到{b}门前，{b}开门让他进来。","{b}替{a}挡下天道催收使，说“这笔记我账上”。","{a}托{b}照看徒弟，{b}一口应下。","{a}在{map}迷了路，{b}点了一盏灯为他引路。","{b}把半块干粮分给了落难的{a}，{a}记下了这份情。","听说{a}突破失败，{b}送来一枚丹药，没有留名。"],"debt":["{a}追着{b}要了三条街的债，{map}人人都看见了。","{b}欠{a}八百灵石不还，{a}把欠条贴在了{map}城门上。","{a}找{b}讨债，{b}拿一只鸡抵了账。","{b}躲债躲进了闭关洞府，{a}就在洞口守着。","{a}请记账童子去催{b}还债，{b}当天就还清了。","{b}还债还了一半，说剩下的“下辈子再还”。","{a}给{b}的债加了利息，{b}说他比天道还黑。","{map}的钱庄说，{b}已经替{a}还清了旧债。","{a}一时心软免了{b}的债，{b}当场跪下谢恩。"]};
const NPC37E = {
  V: 1, FEUD_MAX: 1, WANT_MIN: 1, WANT_MAX: 2, TEXT: NEWS37C, KINDS: ['feud', 'help', 'debt'], LABEL: { feud: '结仇', help: '求助', debt: '讨债' },
  // 讨债模板按结局分：讨回（还了 / 抵了 / 免了）与 赖账（追债 / 躲债 / 加息）；第 7 条（钱庄代还）不用
  DEBT_PAID: [2, 4, 5, 8], DEBT_DODGE: [0, 1, 3, 6],
  N() { return typeof NPC37 !== 'undefined' ? NPC37 : null; },
  G() { const N = this.N(); return N ? N.G() : null; },
  st() { const N = this.N(); const S = N && N.st(); if (!S) return null; if (!S.rel || typeof S.rel !== 'object') S.rel = {}; if (!S.tie || typeof S.tie !== 'object') S.tie = {};
    if (!S.owe || typeof S.owe !== 'object') S.owe = {}; if (!S.st || typeof S.st !== 'object') S.st = {}; if (!S.yc.feud) S.yc.feud = {}; if (!S.yc.e37) S.yc.e37 = 0; return S; },
  key(a, b) { return a < b ? a + '|' + b : b + '|' + a; },
  clamp(v) { return Math.max(-100, Math.min(100, Math.round(v))); },
  sect(id) { const G = this.G(); const s = G && G.jh34 && G.jh34.npcs && G.jh34.npcs[id]; if (s && s.sect) return s.sect; const N = typeof NPCS !== 'undefined' && NPCS[id]; return (N && N.sect) || null; },
  seed(a, b) { const sa = this.sect(a), sb = this.sect(b); if (!sa || !sb) return 0; if (sa === sb) return 20; const G = this.G(); const R = G && G.sectRel;
    const k = (typeof JH34 !== 'undefined' && JH34.relKey) ? JH34.relKey(sa, sb) : [sa, sb].sort().join('|'); return R && R[k] < 0 ? -20 : 0; },
  rel(a, b) { const S = this.st(); if (!S) return 0; const k = this.key(a, b); if (typeof S.rel[k] !== 'number') S.rel[k] = this.seed(a, b); return S.rel[k]; },
  addRel(a, b, d) { const S = this.st(); const k = this.key(a, b); const v = S.rel[k] = this.clamp(this.rel(a, b) + d); if (v <= -60) S.tie[k] = 'ch'; else if (S.tie[k] === 'ch' && v > -60) delete S.tie[k]; return v; },
  alive(id) { const S = this.st(); return !(S && S.st[id] && S.st[id].dead); },
  ids() { const N = this.N(); return N ? N.ids().filter(id => this.alive(id)) : []; },
  jh(id) { const G = this.G(); return (G && G.jh34 && G.jh34.npcs && G.jh34.npcs[id]) || null; },
  // 概率判定走 Game.roll（与 dlg37 一致，作弊/种子可统一接管）；Game.roll 不存在时退回 Math.random。下标抽取仍用 Math.random
  roll(p) { try { if (typeof Game !== 'undefined' && Game && typeof Game.roll === 'function') return !!Game.roll(p, 'npc37e'); } catch (e) {} return Math.random() < p; },
  owes(lender, debtor) { const S = this.st(); return (S && S.owe[lender + '>' + debtor]) || 0; },
  // 能否发生（不改状态）：null 或原因
  block(kind, a, b) { const N = this.N(), S = this.st(); if (!N || !S) return 'nogame'; if (!a || !b || a === b) return 'pair'; if (!this.alive(a) || !this.alive(b)) return 'dead';
    if (!N.room(a, b)) return 'quota'; if (kind === 'feud' && ((S.yc.feud[a] || 0) >= this.FEUD_MAX || (S.yc.feud[b] || 0) >= this.FEUD_MAX)) return 'feud';
    if (kind === 'debt' && !this.owes(a, b) && !(this.jh(b) && this.jh(b).debt > 0)) return 'nodebt';
    return null; },
  // 这一对最自然的事件：有账先讨债；关系 <0 或同图结仇；关系 ≥0 求助
  pick(a, b) { if (this.owes(a, b)) return 'debt'; const r = this.rel(a, b); const N = this.N();
    const same = N && N.schedule(a) && N.schedule(a) === N.schedule(b); if (r < 0) return 'feud'; if (same && this.roll(0.4)) return 'feud'; return 'help'; },
  // 寻路中（R.player.nav，对齐 npc37 路遇的 2f9407b 守卫）不弹 toast，只进新闻流
  notable(a, b) { const N = this.N(); if (!N) return false; let here = null; try { if (typeof R !== 'undefined' && R && R.player && R.player.nav) return false; here = typeof R !== 'undefined' && R.mapId; } catch (e) { }
    return N.rel(a) >= 40 || N.rel(b) >= 40 || (!!here && (N.schedule(a) === here || N.schedule(b) === here)); },
  news(kind, a, b, ix, opt) { const N = this.N(); const pool = ix ? ix.map(i => NEWS37C[kind][i]).filter(Boolean) : NEWS37C[kind];
    return N.emit(kind, a, b, N.schedule(a) || N.schedule(b), { pool, notable: this.notable(a, b), force: !!(opt && opt.force) }); },
  // 发生一次事件：kind ∈ feud/help/debt；a 为主动方（结仇发起者 / 被救者 / 债主），b 为另一方。返回 { kind,a,b,rel,s,... } 或 null
  run(kind, a, b, opt) { opt = opt || {}; const N = this.N(), S = this.st(); if (!N || !S || this.KINDS.indexOf(kind) < 0) return null; const why = this.block(kind, a, b);
    if (why && !(opt.force && why !== 'pair' && why !== 'dead' && why !== 'nogame')) return null;
    const r0 = this.rel(a, b); let ev = { kind, a, b, r0, yr: N.yr() }, ix = null;
    if (kind === 'feud') { ev.rel = this.addRel(a, b, -30); S.yc.feud[a] = (S.yc.feud[a] || 0) + 1; S.yc.feud[b] = (S.yc.feud[b] || 0) + 1; ev.tie = S.tie[this.key(a, b)] || null; }
    else if (kind === 'help') { ev.rel = this.addRel(a, b, 20);
      // 出手相助者 b 借钱给被救者 a（NPC 之间的账，下次讨债用）
      if (this.roll(0.5)) { const amt = 100 * (1 + Math.floor(Math.random() * 3)); const k = b + '>' + a; S.owe[k] = (S.owe[k] || 0) + amt; ev.loan = amt; }
      if (N.rel(a) >= 40) { const G = this.G(); if (typeof JH34 !== 'undefined' && JH34.addAff) JH34.addAff(G, b, 3); else { G.aff = G.aff || {}; G.aff[b] = Math.max(0, Math.min(150, (G.aff[b] || 0) + 3)); } ev.aff = 3; } }
    else { const k = a + '>' + b; if (!S.owe[k]) { const s = this.jh(b); S.owe[k] = Math.max(100, Math.min(800, Math.round(((s && s.debt) || 200) / 2 / 50) * 50)); }
      const amt = S.owe[k]; const broke = !!(this.jh(b) && this.jh(b).debt > 0); const paid = opt.paid != null ? !!opt.paid : this.roll(broke ? 0.3 : 0.55);
      ev.amt = amt; ev.paid = paid;
      if (paid) { delete S.owe[k]; ev.rel = this.addRel(a, b, 5); ix = this.DEBT_PAID; }
      else { S.owe[k] = Math.min(5000, Math.round(amt * 1.1)); ev.rel = this.addRel(a, b, -15); ix = this.DEBT_DODGE; } }
    ev.s = this.news(kind, a, b, ix, opt); S.yc.e37++;
    N.bus.fire('npc:' + kind, ev); return ev; },
  // 年度衰减：|rel|>60 每年向 0 移 5
  decay() { const S = this.st(); if (!S) return 0; let k = 0; for (const p in S.rel) { const v = S.rel[p]; if (Math.abs(v) > 60) { S.rel[p] = v > 0 ? v - 5 : v + 5; k++; if (S.tie[p] === 'ch' && S.rel[p] > -60) delete S.tie[p]; } } return k; },
  // 每年 1–2 条（额度不够就少发）
  yearTick() { const S = this.st(); if (!S) return 0; this.decay(); const ids = this.ids(); if (ids.length < 2) return 0; let k = 0;
    const want = this.WANT_MIN + Math.floor(Math.random() * (this.WANT_MAX - this.WANT_MIN + 1));
    // 先处理旧账：有欠账的一对优先讨债
    const debts = Object.keys(S.owe).map(x => x.split('>')).filter(p => ids.indexOf(p[0]) >= 0 && ids.indexOf(p[1]) >= 0);
    for (let g = 0; g < want * 6 && k < want; g++) { let a, b, kind;
      if (debts.length && this.roll(0.5)) { [a, b] = debts[Math.floor(Math.random() * debts.length)]; kind = 'debt'; }
      else { a = ids[Math.floor(Math.random() * ids.length)]; b = ids[Math.floor(Math.random() * ids.length)]; if (a === b) continue; kind = this.pick(a, b); }
      if (this.block(kind, a, b)) continue; if (this.run(kind, a, b)) k++; }
    return k; },
  // 开发者按钮：强制一次（跳过额度但照样计入）；kind 不给就随机
  force(kind) { const ids = this.ids(); if (ids.length < 2) return null; kind = this.KINDS.indexOf(kind) >= 0 ? kind : this.KINDS[Math.floor(Math.random() * 3)];
    for (let g = 0; g < 30; g++) { const a = ids[Math.floor(Math.random() * ids.length)], b = ids[Math.floor(Math.random() * ids.length)]; if (a === b) continue; const r = this.run(kind, a, b, { force: true }); if (r) return r; }
    return null; },
};
if (typeof NPC37 !== 'undefined' && NPC37.yearNews && !NPC37.yearNews._e37) { const _yn = NPC37.yearNews; NPC37.yearNews = function () { let k = 0; try { k = NPC37E.yearTick(); } catch (x) { } return k + _yn.apply(this, arguments); }; NPC37.yearNews._e37 = 1; }
window.NPC37E = NPC37E; window.NEWS37C = NEWS37C;

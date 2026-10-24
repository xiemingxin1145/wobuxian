'use strict';
// ======================= 3.7.5 奇遇链运行器 chain37（规格 docs/research_v22.md §12） =======================
// 数据：fam37.js 的 TEXT37B.chains（6 链 36 节点 18 结局）；本文件只加运行器 + §12.10 CHAIN37X 补丁块。
// 规则：不改 game.js/talk.js/data.js/ui.js；全部用包装接入（Talk.extra / Game.yearEnd / Game.enterMap / UI.hud / Track.go / Track.target / LIAN35.batchAlch）。
// 存档：G.chain37 = { v:1, ch:{ c37_x: { s, t0, tn, k, done, out, fail, pen, burst, offer, after, chase, hunt } }, cy } —— 惰性兜底，老档无字段 = 全部未开始。
// 修正（§12.1）：F1 c37_3 改名「秘境石门」+ CH34 cangbao split 续篇；F2 空 fx；F3/F4 结局归一化；F5 战斗表 + 胜负；F6 can() 函数；F7 地点节点；
//   F8 jh_ 节点用 JH34.mapOf + JH34hold 钉住/越级挪回首图；F9 负好感同步 Life34.rel；F10/F11 触发条件；F12 灵石不足锁；F13 缺物品锁。
// 选项一律以「⚑」开头（不在 ux23 SAFE 白名单），挂机/自动任务不会代选；chain37 不进 Track.list，AUTO 不会追踪寻路。
const CHAIN37X = {
  OFFER_P: 0.4, OFFER_YEARS: 2, MAX_ACTIVE: 2, NODE_TO: 36,
  c37_1: { n: '钱多多的赊账单', home: 'market', limit: 24,
    can: G => G.debt > 0 && G.realm >= 2,
    fail: { debtPct: 10, hunt: { mon: 'collector', elite: 1, add: 0.3, losePct: 10 } } },
  c37_2: { n: '记账童子的错账', home: 'heaven', can: G => G.realm >= 5, fail: { ratePerYear: 0.01, rateMax: 0.06 } },
  c37_3: { n: '秘境石门', home: 'secret',
    can: G => { const c = G.jh34 && G.jh34.ch && G.jh34.ch.cangbao; return G.realm >= 2 && ((G.aff && G.aff.jh_xunbao) || 0) >= 20 && !!(c && c.done && c.out === 'split'); },
    fail: { chase: 'c3_x1' } },
  c37_4: { n: '魔修的欠条', home: 'rift', can: G => G.realm >= 4 && (G.karma <= -20 || (G.route37 && G.route37.id === 'moxiu')),
    fail: { sectRel: { tianmo: -30 }, rel: { jh_mozi: -30 } } },
  c37_5: { n: '丹娘的炸炉', home: 'market', can: G => (G.alchLv || 0) >= 2, burstNodes: ['c5_3', 'c5_4', 'c5_5'],
    fail: { burst: 3, dieP: 0.3, injMonths: 12, aff: { jh_danniang: -10 } } },
  c37_6: { n: '剑与当铺', home: 'sect', can: G => !!(G.fb33 && typeof FABAO !== 'undefined' && FABAO[G.fb33.id]) && G.realm >= 3,
    wait: { from: 'c6_1', to: 'c6_5', months: 36 }, fail: { rel: { jh_jianke: -40 }, affHalf: 'jh_jianke' } },
  fights: {
    'c1_3/0': ['collector', 0, 0], 'c1_5/0': ['collector', 1, 0.3], 'c3_3/0': ['treant', 0, 0], 'c3_4/1': ['rock', 1, 0.3],
    'c3_5/1': ['demon', 1, 0.5], 'c4_1/1': ['demon', 1, 0.5], 'c4_4/0': ['paper', 1, 0.4], 'c6_4/0': ['crab', 1, 0.3], 'c3_x1/0': ['demon', 0, 0.2],
  }, // key = 节点id/选项下标 → [MONS id, elite, 加档]
  norm: { e1_a: { debtPct: -10, karma: 5 }, e2_c: { debtPct: -20, karma: -10 }, e2_a: { rate: -0.005, aff: { xianguan: 20 } },
    e6_a: { fbHalfCost: 1, fbAff: 30, aff: { jh_jianke: 10 } } },
  chase: [
    { id: 'c3_x1', npc: 'jh_mozi', t: '抢图的人留下一串魔火脚印，一路通到厉无咎的落脚处。',
      ch: [{ t: '硬抢', fx: {}, next: 'c3_x2' }, { t: '花钱赎图', fx: { stone: -300 }, next: 'c3_x2' }, { t: '算了', fx: {}, next: 'chase_b' }], to: '脚印被雨冲没了。' },
    { id: 'c3_x2', npc: 'jh_xunbao', alt: 'villager', t: '图追回来了，边角被魔火燎掉一块，石门的位置还认得出。',
      ch: [{ t: '交还钱满仓', fx: { aff: { jh_xunbao: 15 } }, next: 'chase_a' }, { t: '自己留着', fx: { item: { key: 1 }, karma: -5 }, next: 'chase_b' }], to: '图上的墨迹褪得一干二净。' },
  ],
  chaseEnd: { chase_a: { t: '钱满仓拍着你的肩：“图丢了能追回来，兄弟丢了可追不回来。”石门下回一起开。', fx: { stone: 200, item: { lz: 1 } }, count: 1 },
    chase_b: { t: '你把这桩事咽下了。秘境深处那扇石门，以后大概会有别人去开。', fx: { aff: { jh_xunbao: -10 } }, count: 0 } },
  failText: {
    c37_1: '讨债司在赊账单上盖了个“逾期”，顺手把你的名字描粗了一圈。',
    c37_2: '童子没等到你，只好把错账原样上报。天道批示：“利息照算，错的那笔按复利。”',
    c37_3: '钱满仓托人带话：“图被抢了，石门的位置也漏了。帮我把东西追回来！”',
    c37_4: '厉无咎在裂谷口等了三年，最后把那张欠条钉在了你的名字上。',
    c37_5: '炉子炸了第三回，整条街都听见了。苏半夏被抬走的时候还攥着那张丹方。',
    c37_6: '当票过期了。萧十三没来，只托人送来一截断掉的剑穗。',
  },
  rumor: {
    c37_1: '坊市有人在传：钱多多翻出一卷很旧的赊账单，逢人就问认不认得上面的名字。',
    c37_2: '天外天来了只纸鹤，翅膀上写着：“急！账错了！是你的！——记账童子”',
    c37_3: '钱满仓托人捎话：“上回那箱子底下还压着东西，这回是扇门。”',
    c37_4: '魔道裂谷飘出一张烧了一半的欠条，落款处是青云宗的掌门印。',
    c37_5: '坊市东头又“轰”了一声。街坊说：苏半夏的炉子，这个月第四回了。',
    c37_6: '青云宗山脚的当铺里，挂出了一把很眼熟的剑。',
  },
  doneToast: {
    c37_1: '赊账单这事总算了了。坊市的算盘声都轻快了些。',
    c37_2: '天道账本翻过了一页。你那一页上，墨迹总算干了。',
    c37_3: '石门的事传开了，秘境里的妖都说你是“开门的那位”。',
    c37_4: '那张欠条的事，正魔两道都记住了你的名字——用不同的语气。',
    c37_5: '丹香飘过半条街，路过的人都多吸了两口。',
    c37_6: '当铺的掌柜说，这辈子没见过谁把当票当成婚书一样收着。',
  },
  fightLine: {
    'c1_3/0': '地库门口的讨债鬼正在数铜板，数到一半看见了你。', 'c1_5/0': '账房鬼一拍算盘：“擅闯者，按日计息！”',
    'c3_3/0': '你刚踩进去，脚下的树根就动了。', 'c3_4/1': '石门上的门神是块石头精，脾气比门还硬。',
    'c3_5/1': '厉无咎没拔刀，只放出了一团魔火：“陪它玩玩。”', 'c4_1/1': '厉无咎冷笑着接下了你的第一剑。',
    'c4_4/0': '萧十三剑出如符，满天剑气化成纸符扑面而来。', 'c6_4/0': '海妖首领挥着两只大钳子，嫌你们来得太晚。',
    'c3_x1/0': '抢图的小魔头把图塞进嘴里，你只好动手。',
  },
};
const Chain37 = {
  X: CHAIN37X, IDS: ['c37_1', 'c37_2', 'c37_3', 'c37_4', 'c37_5', 'c37_6'], FIXED: ['merchant', 'xianguan', 'mentor', 'sister', 'villager'],
  G() { return typeof Game !== 'undefined' ? Game.G : null; },
  now(G) { G = G || this.G(); return typeof JH34 !== 'undefined' ? JH34.now(G) : (G.year || 0) * 12 + (G.month || 0); },
  root(G) { G = G || this.G(); if (!G) return null; let C = G.chain37; if (!C || typeof C !== 'object' || C.v !== 1) C = G.chain37 = { v: 1, ch: {}, cy: -1 }; if (!C.ch || typeof C.ch !== 'object') C.ch = {}; return C; },
  st(id, G) { const C = this.root(G); return C ? C.ch[id] || null : null; },
  mk(id, G) { const C = this.root(G); return C.ch[id] || (C.ch[id] = { s: null, t0: 0, tn: 0, k: 0, done: 0, out: '', fail: 0, pen: 0, burst: 0, offer: 0 }); },
  def(id) { return typeof TEXT37B !== 'undefined' ? TEXT37B.chains.find(c => c.id === id) : null; },
  name(id) { return (this.X[id] && this.X[id].n) || (this.def(id) || {}).n || id; },
  node(id, nid) { if (!nid) return null; const ch = this.X.chase.find(n => n.id === nid); if (ch) return Object.assign({ map: null }, ch); const D = this.def(id); return D ? D.nodes.find(n => n.id === nid) || null : null; },
  isEnd(nid) { return /^e\d_/.test(nid) || /^chase_/.test(nid); },
  endOf(id, eid) { if (this.X.chaseEnd[eid]) return { id: eid, t: this.X.chaseEnd[eid].t, rw: this.X.chaseEnd[eid].fx }; const D = this.def(id); return D ? D.ends.find(e => e.id === eid) : null; },
  isActive(S) { return !!(S && S.s && !S.done); },
  active(G) { return this.IDS.filter(id => this.isActive(this.st(id, G))); },
  can(id, G) { G = G || this.G(); try { return !!this.X[id].can(G); } catch (e) { return false; } },
  mult(G) { return 1 + ((G || this.G()).realm || 0); },
  sanxiu(G) { return !!(G.route37 && G.route37.id === 'sanxiu'); },
  dead(npc, G) { G = G || this.G(); if (!npc) return false; if (typeof NPCS === 'undefined' || !NPCS[npc]) return true; const S = G && G.npc37; return !!(S && S.st && S.st[npc] && S.st[npc].dead); },
  // 节点的 NPC（null = 地点节点 F7）；c3_x2 钱满仓已陨落 → 说书先生代收
  npcOf(id, n, G) { if (!n || !n.npc || n.npc === '—' || n.npc === '-') return null; if (n.alt && this.dead(n.npc, G)) return n.alt; return n.npc; },
  mapOfNode(id, n, G) { const npc = this.npcOf(id, n, G); if (npc && /^jh_/.test(npc) && typeof JH34 !== 'undefined') return JH34.mapOf(npc); if (npc && !n.map && typeof NPCS !== 'undefined' && NPCS[npc]) return NPCS[npc].map; return n.map || this.X[id].home; },
  nm(npc) { const N = typeof NPCS !== 'undefined' && NPCS[npc]; return N ? String(N.n).split('·').pop() : npc; },
  mapN(m) { return typeof MAPINFO !== 'undefined' && MAPINFO[m] ? MAPINFO[m].n : m; },
  news(G, s) { try { if (typeof JH34 !== 'undefined') JH34.say(JH34.ensure(G), s, 'chain37'); } catch (e) { console.warn('chain37 news', e); } },
  fire(e, d) { try { if (typeof Story37 !== 'undefined' && Story37.fire) Story37.fire(e, d); } catch (x) { } },
  hold(npc, v) { if (npc && /^jh_/.test(npc) && typeof JH34hold === 'function') try { JH34hold(npc, v); } catch (e) { } },
  // ---- 节点激活（F8：钉住 jh_，越级地图挪回本链首图） ----
  activate(id, nid, G) {
    G = G || this.G(); const S = this.mk(id, G); const prev = this.node(id, S.s); if (prev) this.hold(this.npcOf(id, prev, G), 0);
    // 追凶支线：厉无咎已死 → 直接跳到 c3_x2
    if (nid === 'c3_x1' && this.dead('jh_mozi', G)) nid = 'c3_x2';
    S.s = nid; S.tn = this.now(G); S.after = 0;
    const w = this.X[id].wait; if (w && nid === w.to) S.after = (S.t0 || S.tn) + w.months; // c6_1→c6_5 强制等 36 月（不算超时）
    const n = this.node(id, nid); const npc = this.npcOf(id, n, G);
    if (npc && /^jh_/.test(npc) && typeof JH34 !== 'undefined') { this.hold(npc, 1); const L = JH34.ensure(G); const s = L.npcs[npc]; const I = s && typeof MAPINFO !== 'undefined' && MAPINFO[s.map];
      if (s && I && (I.need || 0) > (G.realm || 0)) { s.map = this.X[id].home; try { if (Game.refreshNpcs) Game.refreshNpcs(); } catch (e) { } } }
    return n;
  },
  release(id, G) { const S = this.st(id, G); if (S && S.s) { const n = this.node(id, S.s); this.hold(this.npcOf(id, n, G), 0); } },
  start(id, G) { G = G || this.G(); const S = this.mk(id, G); Object.assign(S, { s: null, t0: this.now(G), k: 0, done: 0, out: '', fail: 0, pen: 0, burst: 0, offer: 0, chase: 0, hunt: 0 }); const D = this.def(id); this.activate(id, D.nodes[0].id, G); this.news(G, `【奇遇】你接下了「${this.name(id)}」。`); return S; },
  // ---- 效果：§12.1 F2/F3/F4/F9 + 散修 ×1.2 ----
  async applyFx(fx, o) {
    o = o || {}; const G = this.G(); if (!fx || typeof fx !== 'object' || !Object.keys(fx).length) return [];
    const e = JSON.parse(JSON.stringify(fx)); const out = [];
    delete e.fight; if (typeof e.debt === 'string') { const m = e.debt.match(/^([+-]?\d+(?:\.\d+)?)%$/); e.debtPct = m ? +m[1] : 0; delete e.debt; }
    if (typeof e.rate === 'string') { const m = e.rate.match(/^([+-]?\d+(?:\.\d+)?)%$/); e.rate = m ? +m[1] / 100 : 0; }
    if (typeof e.fb33 === 'string') { delete e.fb33; e.fbHalfCost = 1; e.fbAff = e.fbAff || 30; }
    if (e.debtPct) { e.debt = Math.round((G.debt || 0) * e.debtPct / 100); delete e.debtPct; if (!e.debt) delete e.debt; }
    if (e.fbHalfCost || e.fbAff) { const f = G.fb33; if (f) { if (e.fbAff) f.aff = Math.min(100, (f.aff || 0) + e.fbAff);
        if (e.fbHalfCost) { const add = f.tier >= 9 || typeof FB33 === 'undefined' ? 2000 : Math.round(FB33.cost(f.tier || 0).stone * 0.5); G.stone = (G.stone || 0) + add; out.push(`灵石+${add}`); }
        out.push('萧十三的剑意抵了半阶炼器费'); } delete e.fbHalfCost; delete e.fbAff; }
    if (o.end && e.stone > 0 && this.sanxiu(G)) e.stone = e.stone * 1.2;
    if (e.aff) for (const k in e.aff) if (e.aff[k] < 0 && typeof Life34 !== 'undefined' && Life34.rel) Life34.rel(k, e.aff[k]);
    if (typeof e.rate === 'number' && !e.rate) delete e.rate;
    const r = await FAM37.applyEff(e); return out.concat(r || []);
  },
  // F12/F13：选项锁
  lock(G, fx) { if (!fx || typeof fx !== 'object') return null; if (fx.stone < 0) { const need = Math.round(-fx.stone * this.mult(G)); if ((G.stone || 0) < need) return `灵石不足（需 ${need}）`; }
    if (!FAM37.canEff(G, fx)) { const k = Object.keys(fx.item).find(k => fx.item[k] < 0 && ((G.inv && G.inv[k]) || 0) < -fx.item[k]); return `缺 ${typeof ITEMS !== 'undefined' && ITEMS[k] ? ITEMS[k].n : k}`; } return null; },
  label(id, S) { return `⚑ 奇遇·${this.name(id)}（第 ${(S.k || 0) + 1} 步）`; },
  baseTier(G) { const I = (typeof MAPINFO !== 'undefined' && MAPINFO[(typeof R !== 'undefined' && R.mapId) || 'village']) || { tier: 0 }; return Math.max(I.tier || 0, (G.realm || 0) + (G.stage || 0) * 0.2); },
  // ---- 走一个节点：返回 {cancelled}|{lost}|{next}|{end} ----
  async run(id) {
    const G = this.G(); const S = this.st(id, G); if (!this.isActive(S)) return null; if (await this.check(id)) return { failed: true };
    if (S.after && this.now(G) < S.after) { UI.toast(`「${this.name(id)}」：还得再等 ${S.after - this.now(G)} 个月`); return { cancelled: true, wait: true }; }
    const nid = S.s, n = this.node(id, nid); const npc = this.npcOf(id, n, G); const N = npc && NPCS[npc];
    for (let tries = 0; tries < 4; tries++) {
      const locks = n.ch.map(c => this.lock(G, c.fx)); const labels = n.ch.map((c, k) => locks[k] ? `🔒 ${c.t}（${locks[k]}）` : `⚑ ${c.t}`).concat(['改日再说']);
      const c = await UI.card(this.label(id, S), n.t, N ? N.por : 'i:scroll', labels);
      if (!(c >= 0 && c < n.ch.length)) { Game.save(); return { cancelled: true }; }
      if (locks[c]) { UI.toast(locks[c]); continue; }
      const ch = n.ch[c]; const fk = `${nid}/${c}`; const F = this.X.fights[fk];
      if (F) { await UI.card(`⚑ ${N ? this.nm(npc) + '出手了' : '有人拦路'}`, this.X.fightLine[fk] || '', N ? N.por : 'i:scroll', ['⚑ 出手']);
        const r = await Game.fight(F[0], { elite: !!F[1], solo: true, tier: this.baseTier(G) + F[2] });
        if (!r || r.res !== 'win') { UI.toast('没打过，回头再来'); if (UI.hud) UI.hud(); Game.save(); return { lost: true, node: nid }; } }
      const out = await this.applyFx(ch.fx); S.k = (S.k || 0) + 1;
      this.news(G, `【奇遇】${this.name(id)}：${ch.t}`); Game.log && Game.log(`奇遇·${this.name(id)}：${ch.t}。`);
      if (out.length) UI.toast(out.join('，'));
      if (this.isEnd(ch.next)) { await this.finish(id, ch.next); return { end: ch.next }; }
      this.activate(id, ch.next, G); Game.save(); if (UI.hud) UI.hud(); try { if (Game.refreshNpcs) Game.refreshNpcs(); } catch (e) { }
      return { next: ch.next };
    }
    return { cancelled: true };
  },
  async finish(id, eid, opt) {
    const G = this.G(); const S = this.mk(id, G); const E = this.endOf(id, eid); this.release(id, G);
    S.done = 1; S.fail = 0; S.out = eid; S.s = null;
    const out = await this.applyFx(this.X.norm[eid] || (E && E.rw), { end: 1 });
    this.news(G, `【奇遇】「${this.name(id)}」了结：${E ? E.t : eid}`); this.fire('chain:done', { id, out: eid });
    if (!(opt && opt.quiet)) { await UI.card(`⚑ 奇遇·${this.name(id)}·完`, `${E ? E.t : ''}${out.length ? '\n\n' + out.join('，') : ''}`, 'i:scroll', ['好']); if (this.X.doneToast[id]) UI.toast(this.X.doneToast[id], '#ffd8a0'); }
    Game.save(); if (UI.hud) UI.hud(); try { if (Game.refreshNpcs) Game.refreshNpcs(); } catch (e) { }
    return out;
  },
  // ---- 失败态（§12.3） ----
  async fail(id, why, opt) {
    opt = opt || {}; const G = this.G(); const S = this.mk(id, G); const n = this.node(id, S.s); const pre = n && n.to ? n.to + '\n\n' : '';
    if (id === 'c37_3' && !S.chase) { // 转追凶支线
      S.chase = 1; this.activate(id, 'c3_x1', G); S.k = S.k || 0; this.news(G, `【奇遇】秘境石门生变：图被抢了。`);
      await this.card(opt, `⚑ 奇遇·${this.name(id)}·生变`, pre + this.X.failText.c37_3); Game.save(); return 'chase';
    }
    this.release(id, G); S.done = 1; S.fail = 1; S.out = 'fail'; S.s = null; S.why = why || 'timeout'; let extra = '';
    if (!S.chase) {
      if (id === 'c37_1') { const add = Math.round((G.debt || 0) * this.X.c37_1.fail.debtPct / 100); G.debt = (G.debt || 0) + add; S.hunt = 1; extra = `\n天道欠款 +${add}。明年讨债鬼会来追猎。`; }
      if (id === 'c37_2') extra = '\n此后每年天道利率 +1%（最多 +6%，欠款还清即止）。';
      if (id === 'c37_4') { G.sectRel = G.sectRel || {}; G.sectRel.tianmo = Math.max(-100, Math.min(100, (G.sectRel.tianmo || 0) - 30)); if (typeof Life34 !== 'undefined' && Life34.rel) Life34.rel('jh_mozi', -30); extra = '\n天魔宗关系 −30。'; }
      if (id === 'c37_5') { const P = this.X.c37_5.fail;
        if (Game.roll(P.dieP, 'chain37')) { this.kill('jh_danniang', G); extra = '\n苏半夏没能挺过去。'; this.news(G, '【江湖风云】丹娘苏半夏炸炉陨落，坊市东头再没有“轰”的一声了。'); }
        else { if (typeof JH34 !== 'undefined') { const s = JH34.ensure(G).npcs.jh_danniang; if (s) s.inj = Math.max(s.inj || 0, P.injMonths); } G.aff = G.aff || {}; G.aff.jh_danniang = Math.max(0, (G.aff.jh_danniang || 0) + P.aff.jh_danniang); extra = '\n苏半夏重伤，要养一年。好感 −10。'; } }
      if (id === 'c37_6') { if (typeof Life34 !== 'undefined' && Life34.rel) Life34.rel('jh_jianke', -40); G.aff = G.aff || {}; G.aff.jh_jianke = Math.floor((G.aff.jh_jianke || 0) / 2); extra = '\n萧十三与你结仇。'; }
    }
    this.news(G, `【奇遇】「${this.name(id)}」落空。`); this.fire('chain:fail', { id, why });
    await this.card(opt, `⚑ 奇遇·${this.name(id)}·落空`, pre + (S.chase ? '' : this.X.failText[id]) + extra); Game.save(); if (UI.hud) UI.hud();
    return 'fail';
  },
  // 年结算同年最多 1 张卡（§12.7.4），其余改 toast
  async card(opt, title, text) { const G = this.G(); if (opt.quiet || typeof UI === 'undefined' || !UI.card) { if (typeof UI !== 'undefined' && UI.toast) UI.toast(title); return; }
    if (opt.year) { const C = this.root(G); if (C.cy === G.year) { UI.toast(title); return; } C.cy = G.year; }
    await UI.card(title, text, 'i:scroll', ['好']); },
  kill(npc, G) { G = G || this.G(); if (typeof NPC37 !== 'undefined' && NPC37.st) { const S = NPC37.st(); if (S) { S.st[npc] = Object.assign(S.st[npc] || {}, { dead: 1 }); return; } } G.npc37 = G.npc37 || { v: 1, st: {} }; G.npc37.st = G.npc37.st || {}; G.npc37.st[npc] = { dead: 1 }; },
  // 检查超时/陨落/炸炉：触发失败则返回 'fail'|'chase'
  async check(id, opt) {
    const G = this.G(); const S = this.st(id, G); if (!this.isActive(S)) return null; const now = this.now(G); const X = this.X[id];
    if (id === 'c37_1' && !S.chase && now - (S.t0 || 0) >= X.limit) return this.fail(id, 'limit', opt);
    if (now - Math.max(S.tn || 0, S.after || 0) >= this.X.NODE_TO) return this.fail(id, 'timeout', opt);
    if (id === 'c37_5' && (S.burst || 0) >= X.fail.burst) return this.fail(id, 'burst', opt);
    const n = this.node(id, S.s); const npc = n && n.npc && n.npc !== '—' ? n.npc : null;
    if (npc && this.dead(this.npcOf(id, n, G), G)) { if (S.s === 'c3_x1') { this.activate(id, 'c3_x2', G); return null; } return this.fail(id, 'dead', opt); }
    return null;
  },
  async checkAll(opt) { for (const id of this.active()) { try { await this.check(id, opt); } catch (e) { console.warn('chain37 check', e); } } },
  // ---- 年结算：罚息 / 追猎 / 超时 / 风声 ----
  async yearTick(G) {
    G = G || this.G(); if (!G || G.dead) return; this.root(G);
    const S2 = this.st('c37_2', G); if (S2 && S2.fail && !S2.chase && (S2.pen || 0) < this.X.c37_2.fail.rateMax / this.X.c37_2.fail.ratePerYear - 1e-9 && (G.debt || 0) > 0) { const F = FAM37.ensure(G); F.rate = Math.round((F.rate + this.X.c37_2.fail.ratePerYear) * 1000) / 1000; S2.pen = (S2.pen || 0) + 1; }
    const S1 = this.st('c37_1', G); if (S1 && S1.hunt) { S1.hunt = 0; await this.hunt(G); }
    await this.checkAll({ year: 1 });
    const p = this.X.OFFER_P * (this.sanxiu(G) ? 1.5 : 1);
    for (const id of this.IDS) { const S = this.st(id, G); if (S && (S.s || S.done)) continue;
      if (S && S.offer && (G.year || 0) - S.offer >= this.X.OFFER_YEARS) S.offer = 0;
      if (S && S.offer) continue; if (!this.can(id, G)) continue;
      if (Game.roll(p, 'qiyu')) { const T = this.mk(id, G); T.offer = G.year || 0; if (UI.toast) UI.toast(this.X.rumor[id], '#ffd8a0'); this.news(G, '【风声】' + this.X.rumor[id]); } }
  },
  async hunt(G) { const H = this.X.c37_1.fail.hunt; const C = this.root(G); if (C.cy !== G.year && UI.card) { C.cy = G.year; await UI.card('⚑ 讨债鬼追猎', '赊账单逾期了。讨债司派的讨债鬼循着那圈描粗的名字，一路找上门来。', 'i:bill', ['⚑ 出手']); }
    let r = null; try { r = await Game.fight(H.mon, { elite: !!H.elite, solo: true, tier: this.baseTier(G) + H.add }); } catch (e) { console.warn('chain37 hunt', e); }
    if (r && r.res === 'win') { G.karma = (G.karma || 0) + 1; UI.toast('打跑了讨债鬼，功德 +1'); }
    else { const lose = Math.round((G.stone || 0) * H.losePct / 100); G.stone = (G.stone || 0) - lose; UI.toast(`讨债鬼卷走了 ${lose} 灵石`); }
    return r; },
  // §12.7.1：route37 / tit39 用
  doneCount(G) { G = G || this.G(); if (!G) return 0; let n = 0; const L = G.jh34 && G.jh34.ch;
    if (L && typeof CH34 !== 'undefined') for (const k in CH34) { const S = L[k]; if (S && S.done && !['no', 'ignored'].includes(S.out)) n++; }
    for (const id of this.IDS) { const S = this.st(id, G); if (S && S.done && !S.fail && S.out !== 'chase_b') n++; } return n; },
  // ---- 对话入口 ----
  talkOpts(npc, G) {
    G = G || this.G(); const out = []; if (!G) return out;
    const nAct = this.active(G).length;
    for (const id of this.IDS) { const S = this.st(id, G); const D = this.def(id); if (!D) continue;
      if (this.isActive(S)) { const n = this.node(id, S.s); if (this.npcOf(id, n, G) === npc) out.push([this.label(id, S), () => this.run(id)]); continue; }
      if (S && S.offer && !S.done && !S.s && this.npcOf(id, D.nodes[0], G) === npc && this.can(id, G)) {
        if (nAct >= this.X.MAX_ACTIVE) out.push([`🔒 手头奇遇太多（${nAct}/${this.X.MAX_ACTIVE}）`, async () => { UI.toast(`手头奇遇太多（${nAct}/${this.X.MAX_ACTIVE}）`); }]);
        else out.push([`⚑ 奇遇·${this.name(id)}`, async () => { this.start(id, G); return this.run(id); }]); } }
    return out;
  },
  // ---- 追踪栏 ----
  target(id, G) { G = G || this.G(); const S = this.st(id, G); if (!this.isActive(S)) return null; const n = this.node(id, S.s); const npc = this.npcOf(id, n, G); const map = this.mapOfNode(id, n, G);
    if (S.after && this.now(G) < S.after) return { kind: 'none', txt: `${S.after - this.now(G)} 个月后再去找${this.nm(npc)}` };
    if (!npc) return { kind: 'here', map, btn: '前往', txt: `在${this.mapN(map)}点此继续` };
    return { kind: 'npc', map, id: npc, btn: '前往', txt: `找${this.nm(npc)}于${this.mapN(map)}` }; },
  // F7：地点节点弹卡
  idle() { try { if (typeof NPC37 !== 'undefined' && NPC37.idle) return NPC37.idle(); } catch (e) { } if (typeof R !== 'undefined' && R && R.player && R.player.nav) return false; return true; },
  hereNodes(map, G) { G = G || this.G(); return this.active(G).filter(id => { const S = this.st(id, G); const n = this.node(id, S.s); return !this.npcOf(id, n, G) && this.mapOfNode(id, n, G) === map; }); },
  // 开发者
  dev: {
    jump(id, nid) { const G = Chain37.G(); const S = Chain37.mk(id, G); if (!S.s || S.done) { Chain37.start(id, G); } if (nid.startsWith('c3_x')) S.chase = 1; Chain37.activate(id, nid, G); return S; },
    async end(id, eid) { const G = Chain37.G(); const S = Chain37.mk(id, G); if (!S.s || S.done) Chain37.start(id, G); return Chain37.finish(id, eid, { quiet: 1 }); },
    async timeout(id) { const G = Chain37.G(); const S = Chain37.st(id, G); if (!Chain37.isActive(S)) return null; S.tn -= 37; S.t0 -= 37; if (S.after) S.after -= 37; return Chain37.check(id); },
    kill(id) { const G = Chain37.G(); const S = Chain37.st(id, G); if (!Chain37.isActive(S)) return null; const n = Chain37.node(id, S.s); const npc = n && n.npc; if (!npc || !/^jh_/.test(npc)) return null; Chain37.kill(npc, G); return npc; },
    reset(id) { const G = Chain37.G(); Chain37.release(id, G); delete Chain37.root(G).ch[id]; },
  },
};
window.CHAIN37X = CHAIN37X; window.Chain37 = Chain37;

(function () {
  if (typeof Talk !== 'undefined') { const _ex = Talk.extra; Talk.extra = function (id) { const out = _ex ? _ex.apply(this, arguments) : []; try { const G = Game.G; if (G) out.unshift(...Chain37.talkOpts(id, G)); } catch (e) { console.error('chain37 extra', e); } return out; }; }
  if (typeof Game !== 'undefined' && Game.yearEnd) { const _ye = Game.yearEnd; Game.yearEnd = async function () { const G = this.G; const y0 = G && G.year; const r = await _ye.apply(this, arguments); if (G && !G.dead && G.year !== y0) { try { await Chain37.yearTick(G); Game.save(); } catch (e) { console.warn('chain37 year', e); } } return r; }; }
  if (typeof Game !== 'undefined' && Game.enterMap) { const _em = Game.enterMap; Game.enterMap = async function (id) { const r = await _em.apply(this, arguments);
    try { const G = this.G; if (G && Chain37.hereNodes(id, G).length) setTimeout(() => { if (!Chain37.idle() || (typeof R !== 'undefined' && R.mapId !== id)) return; const c = Chain37.hereNodes(id, Game.G)[0]; if (c) Chain37.run(c); }, 1500); } catch (e) { console.warn('chain37 enter', e); } return r; }; }
  // 炸炉计数（c37_5 c5_3–c5_5 期间）
  if (typeof LIAN35 !== 'undefined' && LIAN35.batchAlch) { const _ba = LIAN35.batchAlch; LIAN35.batchAlch = function () { const o = _ba.apply(this, arguments); try { const S = Chain37.st('c37_5'); if (o && o.fail && Chain37.isActive(S) && CHAIN37X.c37_5.burstNodes.includes(S.s)) { S.burst = (S.burst || 0) + o.fail; if (S.burst >= CHAIN37X.c37_5.fail.burst) Chain37.check('c37_5'); } } catch (e) { } return o; }; }
  // 追踪栏：不进 Track.list（AUTO 不代办），只在 HUD 里加行；按钮走 Track.go
  if (typeof Track !== 'undefined') {
    const _tt = Track.target; Track.target = function (q) { if (/^c37_\d$/.test(q)) return Chain37.target(q); return _tt.apply(this, arguments); };
    const _go = Track.go; Track.go = async function (q) { if (/^c37_\d$/.test(q)) { const t = Chain37.target(q); if (t && t.kind === 'here') { if (R.mapId === t.map) return Chain37.run(q); return this.step({ kind: 'map', map: t.map }); } } return _go.apply(this, arguments); };
  }
  if (typeof UI !== 'undefined' && UI.hud) { const _hud = UI.hud; UI.hud = function () { const r = _hud.apply(this, arguments); try { const G = Game.G; const qt = typeof document !== 'undefined' && document.getElementById('qt'); if (G && qt && qt.innerHTML) for (const id of Chain37.active(G).slice(0, 2)) { const S = Chain37.st(id, G); const t = Chain37.target(id, G) || {}; const d = document.createElement('div'); d.className = 'qr'; d.dataset.q = id;
      d.innerHTML = `<div class="qx"><b>${esc(Chain37.label(id, S))}</b><em>${esc(t.txt || '')}</em></div>${t.btn ? `<button class="qbtn" data-q="${id}">${t.btn}▶</button>` : ''}`; qt.appendChild(d); } } catch (e) { } return r; }; }
  // 开发者面板 Tab「奇遇37」（§12.8）
  if (window.DevPanel && DevPanel.registerTab) DevPanel.registerTab('chain37', '奇遇37', (box, ctx) => {
    const G = Game.G; const rows = Chain37.IDS.map(id => { const D = Chain37.def(id); const S = Chain37.st(id, G); const st = !S ? '未开始' : S.done ? (S.fail ? '落空' : '完成 ' + S.out) : S.s ? '进行中 ' + S.s : S.offer ? '有风声' : '未开始';
      const nodes = D.nodes.map(n => n.id).concat(id === 'c37_3' ? ['c3_x1', 'c3_x2'] : []); const ends = D.ends.map(e => e.id).concat(id === 'c37_3' ? ['chase_a', 'chase_b'] : []);
      return `<div class="it"><div style="flex:1"><b>${id} ${Chain37.name(id)}</b><small>${st}</small><div><button class="opt" data-x="start" data-c="${id}">开始</button><select data-x="jump" data-c="${id}"><option value="">跳到节点▾</option>${nodes.map(n => `<option>${n}</option>`).join('')}</select><select data-x="end" data-c="${id}"><option value="">直达结局▾</option>${ends.map(n => `<option>${n}</option>`).join('')}</select><button class="opt" data-x="to" data-c="${id}">判超时</button><button class="opt" data-x="kill" data-c="${id}">杀节点NPC</button><button class="opt" data-x="reset" data-c="${id}">重置</button></div></div></div>`; }).join('');
    box.innerHTML = `<button class="opt" data-x="roll">本年掷风声</button><button class="opt" data-x="burst">炸炉×3</button>` + rows;
    const re = () => { try { ctx.save(); } catch (e) { } };
    box.onclick = async e => { const b = e.target.closest('button[data-x]'); if (!b) return; const x = b.dataset.x, id = b.dataset.c; const G = Game.G; if (!G) return;
      if (x === 'roll') { for (const k of Chain37.IDS) { const S = Chain37.st(k, G); if (S && S.offer) S.offer = 0; } await Chain37.yearTick(G); }
      if (x === 'burst') { const S = Chain37.st('c37_5', G); if (S) { S.burst = (S.burst || 0) + 3; await Chain37.check('c37_5'); } }
      if (x === 'start') { Chain37.start(id, G); ctx.toast('已开始 ' + id); }
      if (x === 'to') ctx.toast(String(await Chain37.dev.timeout(id)));
      if (x === 'kill') ctx.toast('杀 ' + Chain37.dev.kill(id));
      if (x === 'reset') Chain37.dev.reset(id);
      re(); };
    box.onchange = async e => { const t = e.target.closest('select[data-x]'); if (!t || !t.value) return; const id = t.dataset.c;
      if (t.dataset.x === 'jump') Chain37.dev.jump(id, t.value); else await Chain37.dev.end(id, t.value); ctx.toast(id + ' → ' + t.value); re(); };
  });
})();

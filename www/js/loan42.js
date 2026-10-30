// ======================= 3.9.1 天道小贷 loan42（规格 docs/research_v22.md §16）第 2 轮 =======================
// 第1轮：数据+核心逻辑（额度/征信/借还/sync/逾期转尾款/寿元抵押/无债之身/Talk.extra）。
// 第2轮：催收小分队开战（包 Game.fight，#53 storyBlock/B.on，rng=Game.roll 回退）；角色面板征信行；DevPanel「小贷42」。
// 存档 G.loan42 惰性；LOAN42.off=true 整系统隐藏。不改 game.js/talk.js/data.js/ui.js/systems21/dev_entry_v25/dev341 本体。
// 加载：index 在 clan41 之后、audio32 之前（外层于 mingge33，转入尾款不吃 VIP 30% 折扣）。
'use strict';
(function (W) {
  const TEXT42 = {
    entryAgent: '💰 天道小贷·代办点（借/还）',
    entryHQ: '💰 天道小贷·总行（借/还）',
    greetAgent: [
      '钱多多压低声音：“天道的钱，我代办。手续费三成——开玩笑的，三个点。”',
      '钱多多把算盘往前一推：“借钱不丢人，丢人的是借了还不上。不过还不上也不是我的事。”',
      '“天道小贷，当天放款。审批？审批就是看你还活着。”'
    ],
    greetHQ: [
      '记账童子头也不抬：“取号。……哦，您是VIP？那也取号。”',
      '算无遗推了推眼镜：“你的征信报告我看了。有点意思。”',
      '“总行不收代办费。总行收的是别的。”'
    ],
    minor: '未成年人不得借贷。这是天道唯一一条良心条款。',
    black: '征信分 {cr}。天道说：您已进入名单，不是光荣榜那种。',
    odBlock: '先把逾期的还了。天道也是要面子的。',
    capFull: '你名下已有 {n} 笔贷款。天道说：再借，就不是你借钱，是钱借你了。',
    prod: {
      bt: { n: '天道白条', d: '两年后一次还清。利息不高，十五个点，跟天道的良心差不多高。' },
      fq: { n: '修仙分期', d: '四年分期，每年年末自动扣款。扣不到也没关系，天道会记得。' },
      sy: { n: '寿元抵押贷', d: '利息最低。抵押物是你的寿元——反正你修仙也活得够久。' }
    },
    confirm: '借款 {amt} 灵石（到手 {net}），年息 {rate}%，期限 {n} 年。\n预计共还 {total}。\n{extra}\n条款第一条：甲方（天道）有权解释一切。\n条款第二条：乙方（你）有权保持沉默，但没有权利不还钱。',
    confirmSy: '若连续 2 年逾期，将扣除寿元最多 {cut} 年。',
    confirmD0: '提醒：借款后你将失去「无债之身」。',
    btnBorrow: { bt: '借·白条', fq: '借·分期', sy: '借·寿元贷' },
    btnSign: '借，按手印',
    btnRepayAll: '还清此笔（{amt}）',
    btnRepayOd: '还逾期（{amt}）',
    btnClose: '关闭',
    lent: [
      '灵石到账。天道发来一条传音：“感谢您选择天道小贷，祝您修行顺利、按时还款，后者更重要。”',
      '纸鹤叼来一张收据，背面印着广告：“介绍朋友借款，双方各减一个点。”（该活动已于一万年前结束）'
    ],
    repaidEarly: '你提前还清了这笔。记账童子愣了一下，在你的档案上画了个小红花。征信 +25。',
    yearCard: {
      title: '天道小贷·年度账单',
      paid: '{name}：已扣 {amt} 灵石，剩余 {left} 期。',
      od: '{name}：应还 {amt}，灵石不足，已逾期（第 {od} 年）。罚息照算。',
      done: '{name}：已结清。天道表示：期待与您再次合作。',
      foot: '当前征信 {cr}（{tier}）。'
    },
    transfer: [
      '连续逾期两年，{name} 剩余 {amt} 灵石按 1.2 倍转入你的尾款。尾款现在是 {debt}。天道说：这样好算账。',
      '讨债司在你的账本上又订了一页。订书钉是金的，计入成本。'
    ],
    lifeCut: '抵押执行：寿元 −{cut} 年。你照镜子，觉得自己老了一点点，具体是 {cut} 年那么一点点。',
    lifeCutCash: '你的寿元已经押无可押。天道叹了口气：“那就按现金算。”尾款 +{amt}。',
    deathTransfer: '人死账不消。你名下未还的小贷 {amt} 灵石转入了尾款。',
    squadNames: ['催收小分队·王队长', '催收小分队·二组长', '催收小分队·实习生甲', '催收小分队·外包李'],
    squadOpen: [
      '三个讨债鬼排成一排，齐声道：“您好，天道小贷贷后管理部，打扰了。”',
      '领头的讨债鬼掏出一张单子：“本季度考核，就差您这一单。”',
      '“我们讲文明、讲礼貌、讲……主要讲业绩。”'
    ],
    squadOpts: ['当场还款（{amt}）', '应战', '跑'],
    squadWin: '打赢了催收，账还在。但他们本月的业绩没了。讨债鬼临走前塞给你一张名片：“下季度见。”',
    squadLose: '你被摁在地上按了手印。误工费 {fee} 灵石。征信 −20。',
    squadRun: '你跑了。讨债鬼在后面喊：“跑得了和尚跑不了庙！”——你没有庙，但逾期又多记了一年。',
    squadToken: '花 1 枚讨债令抵掉误工费',
    d0On: '你身上一笔债都没有。天道翻了半天档案，确认无误，在你名字旁写了四个字：无债之身。（攻防血 +3%，修炼 +5%）',
    d0Off: '你又借钱了。「无债之身」失效。天道在档案上把那四个字划掉，划得很开心。',
    panelRow: '天道小贷：{n} 笔，待还 {amt}｜征信 {cr}（{tier}）',
    tiers: ['黑名单', '关注', '正常', '优质']
  };

  const PROD = {
    bt: { id: 'bt', n: '天道白条', realm: 1, mul: 0.5, years: 2, rate: 0.15 },
    fq: { id: 'fq', n: '修仙分期', realm: 2, mul: 1, years: 4, rate: 0.11 },
    sy: { id: 'sy', n: '寿元抵押贷', realm: 3, mul: 2, years: 5, rate: 0.08 }
  };
  const K_TAB = [
    { max: 449, K: 0, tier: 0 },
    { max: 599, K: 1, tier: 1 },
    { max: 749, K: 2, tier: 2 },
    { max: 1e9, K: 3, tier: 3 }
  ];

  const L42 = {
    off: false,
    TEXT42,
    PROD,
    K: [0, 1, 2, 3],
    cap: 2,
    AGENT_FEE: 0.03,
    MIN_RATE: 0.08,
    _pendingCard: null,
    _d0was: null,

    fmt(s, o) {
      return String(s == null ? '' : s).replace(/\{(\w+)\}/g, (_, k) => (o && o[k] != null ? o[k] : ''));
    },
    roll(p) {
      try {
        const g = (typeof Game !== 'undefined' && Game) || W.Game;
        if (g && typeof g.roll === 'function') return !!g.roll(p, 'loan42');
      } catch (e) {}
      return Math.random() < p;
    },
    storyBlock() {
      try {
        if (typeof NPC37 !== 'undefined' && NPC37 && typeof NPC37.storyBlock === 'function') {
          const r = NPC37.storyBlock();
          if (r) return r;
        }
      } catch (e) {}
      try { if (typeof B !== 'undefined' && B && B.on) return 'battle'; } catch (e) {}
      return null;
    },
    canPopup() { return !this.storyBlock(); },
    toast(msg, color) {
      if (!this.canPopup()) return false;
      try { if (typeof UI !== 'undefined' && UI.toast) { UI.toast(msg, color || '#9ad8ff'); return true; } } catch (e) {}
      return false;
    },
    async card(title, text, por, opts) {
      if (!this.canPopup()) return -1;
      try {
        if (typeof UI !== 'undefined' && UI.card) return await UI.card(title, text, por || 'i:bill', opts || ['好']);
      } catch (e) {}
      return -1;
    },

    G(g) {
      if (g) return g;
      try { if (typeof Game !== 'undefined' && Game && Game.G) return Game.G; } catch (e) {}
      return (W.Game && W.Game.G) || null;
    },
    has(G) { return !!(G && G.loan42); },
    ensure(G) {
      G = this.G(G); if (!G) return null;
      let S = G.loan42;
      if (!S || typeof S !== 'object') {
        S = G.loan42 = { v: 1, cr: 600, y: G.year || 1, seq: 0, L: [], hist: { borrowed: 0, repaid: 0, defaulted: 0 }, squad: 0 };
      }
      if (S.v == null) S.v = 1;
      if (typeof S.cr !== 'number' || !Number.isFinite(S.cr)) S.cr = 600;
      S.cr = Math.max(300, Math.min(900, Math.round(S.cr)));
      if (typeof S.y !== 'number') S.y = G.year || 1;
      if (typeof S.seq !== 'number') S.seq = 0;
      if (!Array.isArray(S.L)) S.L = [];
      if (!S.hist || typeof S.hist !== 'object') S.hist = { borrowed: 0, repaid: 0, defaulted: 0 };
      for (const k of ['borrowed', 'repaid', 'defaulted']) if (typeof S.hist[k] !== 'number') S.hist[k] = 0;
      if (typeof S.squad !== 'number') S.squad = 0;
      return S;
    },
    /** 只读窥探：不存在则不创建 */
    peek(G) { G = this.G(G); return G && G.loan42 ? this.ensure(G) : null; },

    N(G) {
      G = this.G(G); const r = Math.min(6, Math.max(0, (G && G.realm) | 0));
      try {
        if (typeof REALMS !== 'undefined' && REALMS[r] && REALMS[r].need != null) return REALMS[r].need;
      } catch (e) {}
      const fallback = [80, 200, 520, 1300, 3200, 7600, 18000];
      return fallback[r] || 80;
    },
    band(cr) {
      cr = Math.max(300, Math.min(900, Math.round(+cr || 600)));
      for (const b of K_TAB) if (cr <= b.max) return b;
      return K_TAB[K_TAB.length - 1];
    },
    tierName(cr) { return TEXT42.tiers[this.band(cr).tier] || TEXT42.tiers[2]; },
    KOf(G) { const S = this.peek(G); const cr = S ? S.cr : 600; return this.band(cr).K; },
    quota(G) { return this.N(G) * this.KOf(G); },
    vip(G) {
      G = this.G(G);
      try {
        if (typeof MG33 !== 'undefined' && MG33 && typeof MG33.has === 'function' && MG33.has('tiandao_vip')) return true;
      } catch (e) {}
      return !!(G && G.flags && G.flags.vip);
    },
    /** 实际年息：产品基率 × VIP0.7 × 征信≥800 再×0.9，地板 8%，四舍五入到 0.5% */
    rateOf(tid, G) {
      const P = PROD[tid]; if (!P) return this.MIN_RATE;
      let r = P.rate;
      if (this.vip(G)) r *= 0.7;
      const S = this.peek(G); const cr = S ? S.cr : 600;
      if (cr >= 800) r *= 0.9;
      r = Math.max(this.MIN_RATE, r);
      return Math.round(r * 200) / 200;
    },
    activePrin(G) {
      const S = this.peek(G); if (!S) return 0;
      return S.L.reduce((a, l) => a + (l.p | 0), 0);
    },
    hasOverdue(G) {
      const S = this.peek(G); if (!S) return false;
      return S.L.some(l => (l.od | 0) > 0);
    },
    isD0(G) {
      G = this.G(G); if (!G) return false;
      if ((G.debt | 0) > 0) return false;
      const S = G.loan42;
      if (!S || !Array.isArray(S.L) || !S.L.length) return true;
      return false;
    },
    bumpCr(S, d) {
      if (!S) return;
      S.cr = Math.max(300, Math.min(900, Math.round((S.cr || 600) + d)));
    },
    prodMax(tid, G) {
      const P = PROD[tid]; if (!P) return 0;
      G = this.G(G); if (!G || ((G.realm | 0) < P.realm)) return 0;
      const Q = this.quota(G);
      if (Q <= 0) return 0;
      let max = Math.floor(Q * P.mul);
      const room = Math.max(0, Math.floor(this.cap * Q) - this.activePrin(G));
      max = Math.min(max, room);
      return Math.max(0, max);
    },
    canBorrow(tid, G) {
      if (this.off) return { ok: false, reason: 'off' };
      G = this.G(G); if (!G) return { ok: false, reason: 'nogame' };
      if ((G.realm | 0) < 1) return { ok: false, reason: 'minor', msg: TEXT42.minor };
      const P = PROD[tid]; if (!P) return { ok: false, reason: 'bad' };
      if ((G.realm | 0) < P.realm) return { ok: false, reason: 'realm' };
      const S = this.peek(G);
      const cr = S ? S.cr : 600;
      if (this.band(cr).K <= 0) return { ok: false, reason: 'black', msg: this.fmt(TEXT42.black, { cr }) };
      if (this.hasOverdue(G)) return { ok: false, reason: 'od', msg: TEXT42.odBlock };
      const n = S ? S.L.length : 0;
      if (n >= 3) return { ok: false, reason: 'cap', msg: this.fmt(TEXT42.capFull, { n }) };
      const max = this.prodMax(tid, G);
      if (max <= 0) return { ok: false, reason: 'full' };
      return { ok: true, max };
    },
    agentFee(amt, agent) {
      if (!agent) return 0;
      return Math.round((+amt || 0) * this.AGENT_FEE);
    },
    estSyCut(amt, G) {
      const N = this.N(G) || 1;
      let cut = Math.min(50, Math.ceil((+amt || 0) / N * 10));
      try {
        if (typeof Game !== 'undefined' && Game && typeof Game.lifeMax === 'function') {
          const life = Game.lifeMax();
          const age = (G && G.age) | 0;
          cut = Math.min(cut, Math.max(0, life - age - 1));
        }
      } catch (e) {}
      return Math.max(0, cut);
    },
    estTotal(tid, amt, G) {
      const P = PROD[tid]; if (!P) return amt;
      const r = this.rateOf(tid, G);
      if (tid === 'bt') return Math.ceil(amt * (1 + r * P.years)); // 粗估；实际按年 ceil
      if (tid === 'fq') {
        let p = amt, tot = 0;
        for (let i = 0; i < P.years; i++) {
          const prin = Math.ceil(amt / P.years);
          const int = Math.ceil(p * r);
          tot += prin + int;
          p = Math.max(0, p - prin);
        }
        return tot;
      }
      // sy：每年利息 + 期末本金
      return amt + Math.ceil(amt * r) * P.years;
    },

    /**
     * 借款。agent=true 时代办点扣 3%。
     * 返回 {ok,loan,net,fee,msg}；成功才创建/改 G.loan42。
     */
    borrow(G, tid, amt, agent) {
      if (this.off) return { ok: false, msg: 'off' };
      G = this.G(G); if (!G) return { ok: false, msg: 'nogame' };
      const gate = this.canBorrow(tid, G);
      if (!gate.ok) return { ok: false, msg: gate.msg || gate.reason };
      amt = Math.round(+amt || 0);
      if (amt <= 0 || amt > gate.max) return { ok: false, msg: 'amt' };
      const P = PROD[tid];
      const wasD0 = this.isD0(G);
      const S = this.ensure(G);
      // 借款前补算到当前年，避免闭关后直接借漏年
      this.sync(G, { quiet: true });
      const r = this.rateOf(tid, G);
      const fee = this.agentFee(amt, !!agent);
      const net = amt - fee;
      S.seq++;
      const id = 'L' + S.seq;
      const loan = {
        id, t: tid, p0: amt, p: amt, r, y0: G.year | 0,
        n: P.years, left: P.years, due: 0, od: 0, ins: 0
      };
      S.L.push(loan);
      S.hist.borrowed += amt;
      G.stone = (G.stone | 0) + net;
      this._notifyD0(G, wasD0);
      return { ok: true, loan, net, fee, amt, rate: r };
    },

    /** 提前还清一笔：剩余本金 + 已计未付利息 */
    earlyDue(l) {
      if (!l) return 0;
      return Math.max(0, (l.p | 0) + (l.ins | 0));
    },
    /** 逾期应还：优先用 l.due；否则按当前产品重算一笔 */
    odDue(l) {
      if (!l || !(l.od > 0)) return 0;
      if ((l.due | 0) > 0) return l.due | 0;
      return this.earlyDue(l);
    },
    repayLoan(G, loanId) {
      if (this.off) return { ok: false };
      G = this.G(G); const S = this.peek(G); if (!S) return { ok: false };
      this.sync(G, { quiet: true });
      const l = S.L.find(x => x.id === loanId); if (!l) return { ok: false };
      const amt = this.earlyDue(l);
      if ((G.stone | 0) < amt) return { ok: false, msg: 'stone', amt };
      G.stone -= amt;
      S.hist.repaid += amt;
      // 提前还清 +25：仅当本笔至少跨过一次年结算 sync（l.crossed）；同年借还/仅有利息不算；每年最多一次
      let crGain = 0;
      const crossed = !!(l.crossed);
      const y = G.year | 0;
      if (crossed && (S.crEarlyY | 0) !== y) {
        this.bumpCr(S, 25);
        S.crEarlyY = y;
        crGain = 25;
      }
      S.L = S.L.filter(x => x !== l);
      this._clearSquadIfNoOd(S);
      this._checkDebtPaid(G);
      this._notifyD0(G);
      return { ok: true, amt, early: true, cr: crGain };
    },
    repayOverdue(G) {
      if (this.off) return { ok: false };
      G = this.G(G); const S = this.peek(G); if (!S) return { ok: false };
      this.sync(G, { quiet: true });
      const ods = S.L.filter(l => (l.od | 0) > 0);
      if (!ods.length) { S.squad = 0; return { ok: true, amt: 0, lines: [] }; }
      // 原子：先合计再扣；不够则一分不动
      let need = 0;
      for (const l of ods) need += this.odDue(l);
      if ((G.stone | 0) < need) return { ok: false, msg: 'stone', need, paid: 0 };
      let total = 0;
      const lines = [];
      for (const l of [...ods]) {
        if (!S.L.includes(l)) continue;
        const amt = this.odDue(l);
        G.stone -= amt;
        // 还逾期：清 od/ins，扣掉对应本金（fq/到期本），期数推进一年份
        const prin = this._prinPart(l);
        l.p = Math.max(0, (l.p | 0) - prin);
        l.ins = 0; l.od = 0; l.due = 0; l.left = Math.max(0, (l.left | 0) - 1);
        S.hist.repaid += amt;
        this.bumpCr(S, 15);
        total += amt;
        lines.push(l);
        if (l.left <= 0 || l.p <= 0) S.L = S.L.filter(x => x !== l);
      }
      this._clearSquadIfNoOd(S);
      this._checkDebtPaid(G);
      this._notifyD0(G);
      return { ok: true, amt: total, lines };
    },

    /** 无逾期笔时清催收旗（repayLoan / sync / repayOverdue 共用） */
    _clearSquadIfNoOd(S) {
      if (!S) return;
      if (!S.L.some(l => (l.od | 0) > 0)) S.squad = 0;
    },
    _prinPart(l) {
      if (!l) return 0;
      if (l.t === 'fq') return Math.ceil(l.p0 / l.n);
      if (l.t === 'bt' && l.left <= 1) return l.p | 0;
      if (l.t === 'sy' && l.left <= 1) return l.p | 0;
      return 0;
    },
    _yearDue(l) {
      const int = Math.ceil(l.p * l.r);
      let due = 0, prin = 0;
      if (l.t === 'bt') {
        // 利息先累进 ins；到期年才要还
        // 调用方负责把 int 加进 ins；这里算「若本年末要还」的 due
        const insAfter = (l.ins | 0) + int;
        if (l.left <= 1) { prin = l.p | 0; due = prin + insAfter; }
        else due = 0;
        return { due, prin, int, insAfter, mid: due === 0 };
      }
      if (l.t === 'fq') {
        prin = Math.ceil(l.p0 / l.n);
        due = prin + int + (l.ins | 0);
      } else if (l.t === 'sy') {
        prin = (l.left <= 1) ? (l.p | 0) : 0;
        due = int + (l.ins | 0) + prin;
      }
      return { due, prin, int, insAfter: l.ins | 0, mid: false };
    },

    transfer(G, l, log) {
      G = this.G(G); const S = this.ensure(G); if (!S || !l) return null;
      const base = (l.p | 0) + (l.ins | 0);
      const add = Math.ceil(base * 1.2);
      G.debt = (G.debt | 0) + add;
      this.bumpCr(S, -150);
      S.hist.defaulted++;
      S.L = S.L.filter(x => x !== l);
      const row = { kind: 'transfer', name: (PROD[l.t] && PROD[l.t].n) || l.t, amt: base, add, debt: G.debt, id: l.id };
      if (log) log.push(row);
      if (l.t === 'sy') this._lifeCut(G, l, base, log);
      return row;
    },
    _lifeCut(G, l, base, log) {
      const N = this.N(G) || 1;
      let cut = Math.min(50, Math.ceil(base / N * 10));
      let lifeMax = 99999, age = (G.age | 0);
      try {
        if (typeof Game !== 'undefined' && Game && typeof Game.lifeMax === 'function') lifeMax = Game.lifeMax();
      } catch (e) {}
      cut = Math.min(cut, Math.max(0, lifeMax - age - 1));
      if (cut <= 0) {
        const extra = Math.round(base * 0.3);
        G.debt = (G.debt | 0) + extra;
        if (log) log.push({ kind: 'lifeCash', amt: extra });
        try { if (typeof Game !== 'undefined' && Game.log) Game.log(this.fmt(TEXT42.lifeCutCash, { amt: extra })); } catch (e) {}
      } else {
        G.lifeBonus = (G.lifeBonus | 0) - cut;
        if (log) log.push({ kind: 'lifeCut', cut });
        try { if (typeof Game !== 'undefined' && Game.log) Game.log(this.fmt(TEXT42.lifeCut, { cut })); } catch (e) {}
      }
      return cut;
    },

    /** 死亡/坐化/渡劫失败：剩余本金×1.0 转入尾款；不扣寿、不扣征信 */
    deathTransfer(G) {
      if (this.off) return null;
      G = this.G(G); const S = this.peek(G); if (!S || !S.L.length) return null;
      let amt = 0;
      for (const l of S.L) amt += (l.p | 0);
      if (amt <= 0) { S.L = []; return { amt: 0 }; }
      G.debt = (G.debt | 0) + amt;
      S.L = [];
      S.squad = 0;
      return { amt };
    },

    /**
     * 按 G.year - S.y 补算缺年（闭关/过年共用）。
     * quiet: 不弹年账单；返回变更日志。
     */
    sync(G, opts) {
      opts = opts || {};
      if (this.off) return null;
      G = this.G(G); if (!G || !G.loan42) return null;
      const S = this.ensure(G);
      const log = [];
      const yEnd = G.year | 0;
      if (yEnd <= (S.y | 0)) {
        this._checkDebtPaid(G);
        return log;
      }
      // 按年推进 S.y；借款当年（y0）不计息，从下一次年结算开始（§16.1/16.4）
      let steps = 0;
      while ((S.y | 0) < yEnd && steps < 200) {
        steps++;
        S.y = (S.y | 0) + 1;
        const k = S.y | 0;
        for (const l of [...S.L]) {
          if (!S.L.includes(l)) continue;
          if (k === (l.y0 | 0)) continue; // 借款当年不计息
          l.crossed = 1; // 至少跨过一次年结算（提前还清 +25 门槛）
          const int = Math.ceil(l.p * l.r);
          let due = 0, prin = 0;
          if (l.t === 'bt') {
            l.ins = (l.ins | 0) + int;
            if (l.left <= 1) { prin = l.p | 0; due = prin + (l.ins | 0); }
            else { l.left--; continue; }
          } else if (l.t === 'fq') {
            prin = Math.ceil(l.p0 / l.n);
            due = prin + int + (l.ins | 0);
          } else if (l.t === 'sy') {
            prin = (l.left <= 1) ? (l.p | 0) : 0;
            due = int + (l.ins | 0) + prin;
          }
          if ((l.od | 0) > 0) due += Math.ceil(int * 0.5);
          l.due = due;
          if (due === 0) { l.left--; continue; }
          if ((G.stone | 0) >= due) {
            G.stone -= due;
            l.p = Math.max(0, (l.p | 0) - prin);
            l.ins = 0; l.od = 0; l.due = 0; l.left--;
            this.bumpCr(S, 15);
            S.hist.repaid += due;
            const name = (PROD[l.t] && PROD[l.t].n) || l.t;
            log.push({ kind: 'paid', name, amt: due, left: l.left, id: l.id });
            if (l.left <= 0 || l.p <= 0) {
              S.L = S.L.filter(x => x !== l);
              log.push({ kind: 'done', name, id: l.id });
            }
          } else {
            // 灵石不够一分不扣
            l.ins = due - prin;
            l.od = (l.od | 0) + 1;
            l.due = due;
            this.bumpCr(S, -80);
            S.squad = 1;
            const name = (PROD[l.t] && PROD[l.t].n) || l.t;
            log.push({ kind: 'od', name, amt: due, od: l.od, id: l.id });
            if (l.od >= 2) this.transfer(G, l, log);
          }
        }
      }
      S.y = yEnd; // 与 G.year 对齐（while 已推进；防中途 break）
      this._clearSquadIfNoOd(S);
      this._checkDebtPaid(G);
      if (!opts.quiet && log.length) this._queueYearCard(G, log);
      return log;
    },

    _checkDebtPaid(G) {
      G = this.G(G); if (!G || !G.flags) return;
      const S = this.peek(G); if (!S) return;
      // 尾款从 >0 变 0：一世一次 +100。用 flags.loan42_d0 记已发；用 flags.loan42_hadDebt 记曾欠尾款。
      if ((G.debt | 0) > 0) G.flags.loan42_hadDebt = 1;
      if ((G.debt | 0) === 0 && G.flags.loan42_hadDebt && !G.flags.loan42_d0) {
        G.flags.loan42_d0 = 1;
        this.bumpCr(S, 100);
      }
    },
    _notifyD0(G, prev) {
      G = this.G(G); if (!G || this.off) return;
      const now = this.isD0(G);
      // prev：调用方借入前的 isD0；否则用缓存
      const was = (prev != null) ? !!prev : this._d0was;
      if (was == null) { this._d0was = now; return; }
      if (now && !was) this.toast(TEXT42.d0On, '#9aff9a');
      if (!now && was) this.toast(TEXT42.d0Off, '#ff9a9a');
      this._d0was = now;
    },
    _queueYearCard(G, log) {
      const S = this.peek(G); if (!S) return;
      const lines = [];
      for (const row of log) {
        if (row.kind === 'paid') lines.push(this.fmt(TEXT42.yearCard.paid, row));
        else if (row.kind === 'od') lines.push(this.fmt(TEXT42.yearCard.od, row));
        else if (row.kind === 'done') lines.push(this.fmt(TEXT42.yearCard.done, row));
        else if (row.kind === 'transfer') lines.push(this.fmt(TEXT42.transfer[0], row));
      }
      if (!lines.length) return;
      lines.push(this.fmt(TEXT42.yearCard.foot, { cr: S.cr, tier: this.tierName(S.cr) }));
      this._pendingCard = { title: TEXT42.yearCard.title, body: lines.join('\n') };
      this._flushCard();
    },
    async _flushCard() {
      const p = this._pendingCard; if (!p) return;
      if (!this.canPopup()) return; // 排队到下次 enterMap
      this._pendingCard = null;
      await this.card(p.title, p.body, 'i:bill', ['好']);
    },

    // ---- 催收小分队（§16.6；第2轮：弹卡+包 Game.fight 开战） ----
    SQUAD_MON: 'loan42_sq',
    SQUAD_MUL: { hp: 1.8, atk: 1.3, def: 1.2 },
    squadFee(G) { return Math.round(this.N(G) * 0.1); },
    squadOdAmt(G) {
      const S = this.peek(G); if (!S) return 0;
      return S.L.filter(l => l.od > 0).reduce((a, l) => a + this.odDue(l), 0);
    },
    hasToken(G) {
      G = this.G(G);
      const v = Number(G && G.flags && G.flags.s3b_token);
      return Number.isFinite(v) && v > 0;
    },
    /** 注册 MONS.loan42_sq = collector × (hp1.8/atk1.3/def1.2)；不改 data.js */
    ensureSquadMons() {
      try {
        if (typeof MONS === 'undefined' || !MONS) return false;
        const base = MONS.collector || { n: '讨债鬼', spr: 'mon_collector', el: '金', hp: 1, atk: 1, def: 0.9, spd: 1.1, sk: ['atk', 'freeload'], drop: ['coin', 'yd'] };
        const M = this.SQUAD_MUL;
        const id = this.SQUAD_MON;
        MONS[id] = Object.assign({}, base, {
          n: base.n || '讨债鬼',
          spr: base.spr || 'mon_collector',
          el: base.el || '金',
          hp: (base.hp != null ? base.hp : 1) * M.hp,
          atk: (base.atk != null ? base.atk : 1) * M.atk,
          def: (base.def != null ? base.def : 0.9) * M.def,
          spd: base.spd != null ? base.spd : 1.1,
          sk: (base.sk && base.sk.slice) ? base.sk.slice() : ['atk', 'freeload'],
          drop: (base.drop && base.drop.slice) ? base.drop.slice() : ['coin', 'yd']
        });
        return true;
      } catch (e) { return false; }
    },
    pickSquadName() {
      const names = TEXT42.squadNames || ['催收小分队'];
      const n = names.length || 1;
      let idx = 0;
      try {
        const g = (typeof Game !== 'undefined' && Game) || W.Game;
        if (g && typeof g.roll === 'function') {
          for (let i = 1; i < n; i++) {
            if (g.roll(1 / (i + 1), 'loan42')) idx = i;
          }
        } else {
          idx = Math.floor(Math.random() * n);
        }
      } catch (e) { idx = Math.floor(Math.random() * n); }
      return names[Math.max(0, Math.min(n - 1, idx | 0))];
    },
    squadPayNow(G) {
      G = this.G(G); const S = this.peek(G); if (!S) return { ok: false };
      const amt = this.squadOdAmt(G);
      if (amt <= 0) { S.squad = 0; return { ok: true, amt: 0 }; }
      if ((G.stone | 0) < amt) return { ok: false, msg: 'stone', amt };
      const r = this.repayOverdue(G);
      if (r && r.ok) { S.squad = 0; return { ok: true, amt: r.amt }; }
      return { ok: false, amt };
    },
    squadRun(G) {
      G = this.G(G); const S = this.peek(G); if (!S) return;
      // §16.6 跑：逾期笔 od+1 加速转尾款；od 达 2 立刻 transfer
      const xfer = [];
      for (const l of S.L) {
        if ((l.od | 0) > 0) {
          l.od++;
          if (l.od >= 2) xfer.push(l);
        }
      }
      for (const l of xfer) this.transfer(G, l, []);
      S.squad = 0; // 本年不再刷
      S._squadDoneY = G.year | 0;
      this._clearSquadIfNoOd(S);
      return { ok: true, transferred: xfer.length };
    },
    squadWin(G) {
      G = this.G(G); const S = this.peek(G); if (!S) return null;
      const N = this.N(G);
      const stone = Math.round(N * 0.3);
      G.stone = (G.stone | 0) + stone;
      const loot = { stone, yd: 0, xyf: 0 };
      if (this.roll(0.4)) { loot.yd = 1; try { if (typeof Game !== 'undefined' && Game.give) Game.give('yd', 1); } catch (e) { G.inv = G.inv || {}; G.inv.yd = (G.inv.yd || 0) + 1; } }
      if (this.roll(0.15)) { loot.xyf = 1; try { if (typeof Game !== 'undefined' && Game.give) Game.give('xyf', 1); } catch (e) { G.inv = G.inv || {}; G.inv.xyf = (G.inv.xyf || 0) + 1; } }
      S.squad = 0;
      S._squadDoneY = G.year | 0;
      // 欠款/逾期不变
      return loot;
    },
    squadLose(G, useToken) {
      G = this.G(G); const S = this.ensure(G); if (!S) return null;
      const fee = this.squadFee(G);
      let paid = 0, debtAdd = 0, token = false;
      if (useToken && this.hasToken(G)) {
        G.flags.s3b_token = (Number(G.flags.s3b_token) || 0) - 1;
        if (G.flags.s3b_token <= 0) delete G.flags.s3b_token;
        G.flags.s3b_token_used = (Number(G.flags.s3b_token_used) || 0) + 1;
        token = true;
      } else {
        if ((G.stone | 0) >= fee) { G.stone -= fee; paid = fee; }
        else { debtAdd = fee - (G.stone | 0); paid = G.stone | 0; G.stone = 0; G.debt = (G.debt | 0) + debtAdd; }
      }
      this.bumpCr(S, -20);
      // squad 保持，明年还来
      S._squadDoneY = G.year | 0;
      return { fee, paid, debtAdd, token };
    },
    /** 开战：3 只 loan42_sq，solo+noflee；经 Game.fight（外包套标记 loan42Squad） */
    async startSquadFight(G) {
      G = this.G(G); if (!G) return null;
      this.ensureSquadMons();
      const name = this.pickSquadName();
      try {
        if (typeof MONS !== 'undefined' && MONS && MONS[this.SQUAD_MON]) MONS[this.SQUAD_MON].n = name;
      } catch (e) {}
      const tier = ((G.realm | 0) + ((G.stage || 0) * 0.2) + 0.4);
      const opts = {
        elite: true, solo: true, noflee: true,
        adds: [this.SQUAD_MON, this.SQUAD_MON],
        loan42Squad: true,
        tier
      };
      try {
        if (typeof Game !== 'undefined' && Game && typeof Game.fight === 'function') {
          return await Game.fight(this.SQUAD_MON, opts);
        }
      } catch (e) { console.warn('[loan42] startSquadFight', e); }
      return null;
    },
    /** 胜/败结算卡（由 Game.fight 包装在 r.res 后调用；也可单测直调） */
    async applySquadFightResult(G, res) {
      G = this.G(G); if (!G) return null;
      if (res === 'win') {
        const loot = this.squadWin(G) || { stone: 0 };
        const extra = [];
        if (loot.yd) extra.push('玉简×1');
        if (loot.xyf) extra.push('仙缘符×1');
        const body = TEXT42.squadWin + `\n灵石 +${loot.stone}` + (extra.length ? '　' + extra.join('、') : '');
        await this.card('催收小分队', body, 'mon_collector', ['好']);
        return { res: 'win', loot };
      }
      // lose / flee / 其它：按败结算
      let useToken = false;
      if (this.hasToken(G) && this.canPopup()) {
        const c = await this.card('催收小分队', TEXT42.squadLose.replace('{fee}', String(this.squadFee(G))) + '\n' + TEXT42.squadToken + '？', 'mon_collector', [TEXT42.squadToken, '认了']);
        useToken = (c === 0);
      }
      const lose = this.squadLose(G, useToken) || { fee: 0 };
      const msg = lose.token
        ? (TEXT42.squadToken + '。征信 −20。')
        : this.fmt(TEXT42.squadLose, { fee: lose.fee });
      await this.card('催收小分队', msg, 'mon_collector', ['唉']);
      return { res: 'lose', lose };
    },
    /**
     * 弹催收三选一卡并执行（当场还款 / 应战→Game.fight / 跑）。
     * 守 #53：storyBlock 或 !canPopup 则不弹，留 squad=1 下次再试。
     * §16.6：灵石不够时「当场还款」🔒 灰掉不可点（同 life34 赔礼）；卡真正弹出（card()!==-1）后才记 _squadDoneY（当年最多 1 次）。
     */
    async offerSquad(G, info) {
      if (this.off) return null;
      G = this.G(G); if (!G || !info || !info.trigger) return null;
      if (this.storyBlock() || !this.canPopup()) return { blocked: true };
      const amt = info.amt | 0;
      const S = this.peek(G);
      const opens = TEXT42.squadOpen || ['催收上门。'];
      let open = opens[0];
      try {
        // rng 选开场白
        let oi = 0;
        for (let i = 1; i < opens.length; i++) if (this.roll(1 / (i + 1))) oi = i;
        open = opens[oi];
      } catch (e) {}
      // §16.6 灵石够才可点「当场还款」：不够则 🔒 灰置，点了 toast 后重弹卡（卡不关死，只可战/跑）
      let idx = -1;
      let shown = false;
      for (;;) {
        const canPay = amt <= 0 || (G.stone | 0) >= amt;
        const payLabel = this.fmt(TEXT42.squadOpts[0], { amt });
        const opts = [
          canPay ? payLabel : ('🔒 ' + payLabel),
          TEXT42.squadOpts[1],
          TEXT42.squadOpts[2]
        ];
        idx = await this.card('催收小分队', open + `\n逾期应还 ${amt} 灵石。`, 'mon_collector', opts);
        // card() 返回 -1 表示卡未弹出：不记年，留 squad=1 下一张图再试
        if (idx === -1 && !shown) return { blocked: true, notShown: true };
        // 卡成功弹出后即记年（含点灰项重弹 / 战 / 跑 / 关），当年不再刷
        if (!shown) {
          shown = true;
          if (S) S._squadDoneY = G.year | 0;
        }
        if (idx === 0 && !canPay) {
          this.toast('灵石不足，还不成');
          continue;
        }
        break;
      }
      if (idx === 0) {
        const r = this.squadPayNow(G);
        if (r && r.ok) {
          this.toast('已还清逾期 ' + (r.amt | 0), '#9aff9a');
          await this.card('催收小分队', '讨债鬼点了点头，收起单子走了。', 'mon_collector', ['好']);
        } else {
          this.toast('灵石不足，还不成');
        }
        try { if (typeof Game !== 'undefined' && Game.save) Game.save(); } catch (e) {}
        return { choice: 'pay', r };
      }
      if (idx === 1) {
        const fr = await this.startSquadFight(G);
        // 若 fight 包装未跑（无 Game.fight），本地补结算
        if (fr && fr._loan42Handled) return { choice: 'fight', fr };
        if (fr && fr.res) await this.applySquadFightResult(G, fr.res);
        else if (!fr) await this.applySquadFightResult(G, 'lose');
        try { if (typeof Game !== 'undefined' && Game.save) Game.save(); } catch (e) {}
        return { choice: 'fight', fr };
      }
      if (idx === 2) {
        this.squadRun(G);
        await this.card('催收小分队', TEXT42.squadRun, 'mon_collector', ['好']);
        try { if (typeof Game !== 'undefined' && Game.save) Game.save(); } catch (e) {}
        return { choice: 'run' };
      }
      return { choice: 'none', idx };
    },
    /** 进入有怪地图时尝试刷催收（每年最多 1 次，60%） */
    trySquad(G, mapId) {
      if (this.off) return null;
      G = this.G(G); const S = this.peek(G); if (!S || S.squad !== 1) return null;
      const amt0 = this.squadOdAmt(G);
      if (amt0 <= 0) { S.squad = 0; return null; } // 无逾期应还：清幽灵旗，不触发
      if ((S._squadDoneY | 0) === (G.year | 0)) return null;
      if (this.storyBlock()) return null;
      try {
        if (typeof R !== 'undefined' && R && R.player && R.player.nav) return null;
      } catch (e) {}
      let hasMons = true;
      try {
        if (typeof MAPINFO !== 'undefined' && mapId && MAPINFO[mapId]) hasMons = !!(MAPINFO[mapId].mons && MAPINFO[mapId].mons.length);
      } catch (e) {}
      if (!hasMons) return null;
      if (!this.roll(0.6)) return { deferred: true }; // 下一张图再判
      return { trigger: true, amt: amt0, names: TEXT42.squadNames };
    },
    /** 角色面板行文案；无贷款且无 G.loan42 时返回 null */
    panelRowText(G) {
      G = this.G(G); if (!G || this.off) return null;
      const S = this.peek(G); if (!S) return null;
      const n = (S.L && S.L.length) || 0;
      const amt = n ? S.L.reduce((a, l) => a + this.earlyDue(l), 0) : 0;
      let t = this.fmt(TEXT42.panelRow, { n, amt, cr: S.cr, tier: this.tierName(S.cr) });
      if (this.isD0(G)) t += ' · 无债之身';
      return t;
    },

    // ---- 最小 UI：Talk.extra 窗口 ----
    entryLabel(id) {
      if (id === 'merchant') return TEXT42.entryAgent;
      if (id === 'xianguan' || id === 'suanpan') return TEXT42.entryHQ;
      return null;
    },
    canShowEntry(G, id) {
      if (this.off) return false;
      G = this.G(G); if (!G) return false;
      if (id === 'merchant') return (G.realm | 0) >= 1;
      if (id === 'xianguan' || id === 'suanpan') return (G.realm | 0) >= 5;
      return false;
    },
    async openWindow(npcId) {
      if (this.off || !this.canPopup()) return;
      const G = this.G(); if (!G) return;
      this.sync(G, { quiet: true });
      const agent = npcId === 'merchant';
      if ((G.realm | 0) < 1) { await this.card('天道小贷', TEXT42.minor, 'i:bill', ['好']); return; }
      const greets = agent ? TEXT42.greetAgent : TEXT42.greetHQ;
      const greet = greets[Math.floor(Math.random() * greets.length)];
      const S = this.peek(G) || { cr: 600, L: [] };
      const Q = this.quota(G);
      const rows = [];
      rows.push(`征信 ${S.cr || 600}（${this.tierName(S.cr || 600)}）｜额度 ${Q}｜灵石 ${G.stone | 0}`);
      if (S.L && S.L.length) {
        for (const l of S.L) {
          const pn = (PROD[l.t] && PROD[l.t].n) || l.t;
          rows.push(`· ${pn} ${l.id}：本金余 ${l.p}，息 ${l.ins | 0}，剩 ${l.left} 期${l.od ? `，逾期${l.od}年` : ''}`);
        }
      } else rows.push('· 当前无进行中贷款');
      const opts = [];
      const keys = [];
      for (const tid of ['bt', 'fq', 'sy']) {
        const gate = this.canBorrow(tid, G);
        const label = TEXT42.btnBorrow[tid];
        if (!gate.ok) {
          if (gate.reason === 'realm') { opts.push('🔒 ' + label); keys.push(null); }
          else if (gate.reason === 'od' || gate.reason === 'black' || gate.reason === 'cap' || gate.reason === 'full') {
            opts.push(label + '（不可）'); keys.push(null);
          } else { opts.push(label); keys.push(null); }
        } else { opts.push(label); keys.push(['borrow', tid]); }
      }
      if (S.L && S.L.length) {
        for (const l of S.L) {
          const amt = this.earlyDue(l);
          opts.push(this.fmt(TEXT42.btnRepayAll, { amt })); keys.push(['repay', l.id]);
        }
        if (this.hasOverdue(G)) {
          const od = this.squadOdAmt(G);
          opts.push(this.fmt(TEXT42.btnRepayOd, { amt: od })); keys.push(['od']);
        }
      }
      opts.push(TEXT42.btnClose); keys.push(['close']);
      const body = greet + '\n\n' + rows.join('\n');
      const idx = await this.card(agent ? TEXT42.entryAgent : TEXT42.entryHQ, body, agent ? 'npc_merchant' : 'i:bill', opts);
      if (idx < 0 || !keys[idx]) return;
      const act = keys[idx];
      if (!act || act[0] === 'close') return;
      if (act[0] === 'borrow') await this._confirmBorrow(G, act[1], agent);
      else if (act[0] === 'repay') {
        const r = this.repayLoan(G, act[1]);
        if (r && r.ok) await this.card('还款', (r.cr > 0) ? TEXT42.repaidEarly : '你还清了这笔。记账童子点了点头。', 'i:bill', ['好']);
        else this.toast(r && r.msg === 'stone' ? '灵石不足' : '还不成');
      } else if (act[0] === 'od') {
        const r = this.repayOverdue(G);
        if (r && r.ok) this.toast('已还逾期 ' + r.amt, '#9aff9a');
        else this.toast('灵石不足');
      }
      try { if (typeof Game !== 'undefined' && Game.save) Game.save(); } catch (e) {}
      try { if (typeof UI !== 'undefined' && UI.hud) UI.hud(); } catch (e) {}
    },
    async _confirmBorrow(G, tid, agent) {
      const gate = this.canBorrow(tid, G); if (!gate.ok) { await this.card('天道小贷', gate.msg || '借不成', 'i:bill', ['好']); return; }
      const amt = gate.max;
      const fee = this.agentFee(amt, agent);
      const net = amt - fee;
      const rate = this.rateOf(tid, G);
      const total = this.estTotal(tid, amt, G);
      let extra = '';
      if (tid === 'sy') extra += this.fmt(TEXT42.confirmSy, { cut: this.estSyCut(amt, G) }) + '\n';
      if (this.isD0(G)) extra += TEXT42.confirmD0 + '\n';
      const txt = this.fmt(TEXT42.confirm, {
        amt, net, rate: Math.round(rate * 1000) / 10, n: PROD[tid].years, total, extra
      });
      const c = await this.card(TEXT42.prod[tid].n, txt + '\n' + TEXT42.prod[tid].d, 'i:bill', [TEXT42.btnSign, '算了']);
      if (c !== 0) return;
      const r = this.borrow(G, tid, amt, agent);
      if (!r.ok) { this.toast('借不成'); return; }
      const msg = TEXT42.lent[Math.floor(Math.random() * TEXT42.lent.length)];
      await this.card('放款', msg + `\n到手 ${r.net} 灵石（年息 ${Math.round(r.rate * 1000) / 10}%）。`, 'i:bill', ['好']);
    },

    d0Bonus(k) {
      if (k === 'atk' || k === 'def' || k === 'hp') return 0.03;
      if (k === 'cult') return 0.05;
      return 0;
    }
  };

  W.LOAN42 = L42;
  W.TEXT42 = TEXT42;

  // ---- 包装接入 ----
  function hook() {
    if (L42.off) return;
    // Sys.bonus：无债之身
    try {
      if (typeof Sys !== 'undefined' && Sys.bonus && !Sys._loan42) {
        Sys._loan42 = 1;
        const _b = Sys.bonus;
        Sys.bonus = function (k) {
          let v = _b.apply(this, arguments);
          try {
            if (!L42.off) {
              const G = L42.G();
              if (G && L42.isD0(G)) v += L42.d0Bonus(k);
            }
          } catch (e) {}
          return v;
        };
      }
    } catch (e) {}

    // yearEnd / seclude：尾部 sync
    try {
      if (typeof Game !== 'undefined' && Game.yearEnd && !Game.yearEnd._loan42) {
        const _ye = Game.yearEnd;
        Game.yearEnd = async function () {
          const r = await _ye.apply(this, arguments);
          try { if (!L42.off && this.G) L42.sync(this.G); } catch (e) { console.warn('[loan42] yearEnd', e); }
          return r;
        };
        Game.yearEnd._loan42 = 1;
      }
      if (typeof Game !== 'undefined' && Game.seclude && !Game.seclude._loan42) {
        const _sc = Game.seclude;
        Game.seclude = async function () {
          const r = await _sc.apply(this, arguments);
          try { if (!L42.off && this.G) L42.sync(this.G); } catch (e) { console.warn('[loan42] seclude', e); }
          return r;
        };
        Game.seclude._loan42 = 1;
      }
      if (typeof Game !== 'undefined' && Game.enterMap && !Game.enterMap._loan42) {
        const _em = Game.enterMap;
        Game.enterMap = async function (id) {
          const r = await _em.apply(this, arguments);
          try {
            if (!L42.off && this.G) {
              L42.sync(this.G, { quiet: true });
              await L42._flushCard();
              const sq = L42.trySquad(this.G, id);
              if (sq && sq.trigger) await L42.offerSquad(this.G, sq);
            }
          } catch (e) { console.warn('[loan42] enterMap', e); }
          return r;
        };
        Game.enterMap._loan42 = 1;
      }
      if (typeof Game !== 'undefined' && Game.die && !Game.die._loan42) {
        const _die = Game.die;
        Game.die = async function (kind) {
          try {
            if (!L42.off && this.G && this.G.loan42) {
              const tr = L42.deathTransfer(this.G);
              if (tr && tr.amt > 0) L42.toast(L42.fmt(TEXT42.deathTransfer, { amt: tr.amt }), '#ff9a9a');
            }
          } catch (e) { console.warn('[loan42] die', e); }
          return _die.apply(this, arguments);
        };
        Game.die._loan42 = 1;
      }
    } catch (e) {}

    // Game.fight 包装：loan42Squad 胜/败按 §16.6 结算（不改 battle.js/game.js）
    try {
      if (typeof Game !== 'undefined' && Game.fight && !Game.fight._loan42) {
        const _f = Game.fight;
        Game.fight = async function (mon, opts) {
          opts = opts || {};
          const tagged = !!(opts && opts.loan42Squad);
          const r = await _f.apply(this, arguments);
          try {
            if (tagged && !L42.off && this.G) {
              await L42.applySquadFightResult(this.G, (r && r.res) || 'lose');
              if (r && typeof r === 'object') r._loan42Handled = 1;
            }
          } catch (e) { console.warn('[loan42] fight', e); }
          return r;
        };
        Game.fight._loan42 = 1;
      }
    } catch (e) {}

    // UI.p_char：角色面板小贷征信行（有 wrap 钩子才注入）
    try {
      if (typeof UI !== 'undefined' && UI.p_char && !UI.p_char._loan42) {
        const _pc = UI.p_char;
        UI.p_char = function (b, re) {
          const r = _pc.apply(this, arguments);
          try {
            if (!L42.off && typeof Game !== 'undefined' && Game.G && b && b.appendChild) {
              const txt = L42.panelRowText(Game.G);
              if (txt) {
                let row = null;
                try { row = (typeof h === 'function') ? h('div', 'loan42row', txt) : null; } catch (e) {}
                if (!row) {
                  row = (typeof document !== 'undefined' && document.createElement)
                    ? document.createElement('div') : null;
                  if (row) { row.className = 'loan42row'; row.textContent = txt; }
                } else {
                  // h() 用 innerHTML；文案无用户输入，安全
                  row.innerHTML = txt;
                }
                if (row) b.appendChild(row);
              }
            }
          } catch (e) { console.warn('[loan42] p_char', e); }
          return r;
        };
        UI.p_char._loan42 = 1;
      }
    } catch (e) {}

    // Talk.extra：钱多多代办 / 仙官·算盘总行（防重入）
    try {
      if (typeof Talk !== 'undefined' && !Talk._loan42) {
        Talk._loan42 = 1;
        const _ex = Talk.extra;
        Talk.extra = function (id) {
          const out = _ex ? (_ex.apply(this, arguments) || []) : [];
          try {
            if (!L42.off && L42.canShowEntry(Game.G, id)) {
              const label = L42.entryLabel(id);
              if (label) out.push([label, async () => { await L42.openWindow(id); }]);
            }
          } catch (e) { console.warn('[loan42] Talk.extra', e); }
          return out;
        };
      }
    } catch (e) {}
  }

  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hook);
  } else {
    hook();
  }

  // DevPanel「小贷42」（dev_openworld / clan41 同款；不改 dev_entry_v25 / dev341）
  (function dev42() {
    const reg = () => {
      const render = (box, ctx) => {
        try {
          const G = (typeof Game !== 'undefined' && Game.G) || null;
          if (!G) { box.innerHTML = '<p class="hint">未开局</p>'; return; }
          const S = L42.ensure(G);
          const dump = JSON.stringify(S, null, 0).slice(0, 280);
          box.innerHTML = `<p class="hint">征信 ${S.cr}（${L42.tierName(S.cr)}）· ${S.L.length} 笔 · squad=${S.squad} · 额度 ${L42.quota(G)}</p>` +
            `<p class="hint" style="word-break:break-all;font-size:11px;opacity:.85">${dump}${(JSON.stringify(S).length > 280) ? '…' : ''}</p>` +
            ['cr+:+100征信', 'cr-:-100征信', 'bt:借白条', 'fq:借分期', 'sy:借寿元贷',
              'od:强制逾期1年', 'xfer:强制转尾款', 'sq:刷催收小分队', 'clr:清空贷款', 'fight:立刻催收开战'].map(x => {
              const [a, n] = x.split(':');
              return `<button class="opt" data-a="${a}">${n}</button>`;
            }).join('');
          box.onclick = async (e) => {
            const t = e.target.closest && e.target.closest('button[data-a]');
            const a = t && t.dataset && t.dataset.a; if (!a) return;
            const G2 = Game.G; if (!G2) return;
            const S2 = L42.ensure(G2);
            if (a === 'cr+') { L42.bumpCr(S2, 100); ctx && ctx.toast && ctx.toast('征信 ' + S2.cr); }
            else if (a === 'cr-') { L42.bumpCr(S2, -100); ctx && ctx.toast && ctx.toast('征信 ' + S2.cr); }
            else if (a === 'bt' || a === 'fq' || a === 'sy') {
              G2.realm = Math.max(G2.realm | 0, L42.PROD[a].realm);
              const max = L42.prodMax(a, G2);
              const r = L42.borrow(G2, a, Math.max(1, max || 100), false);
              ctx && ctx.toast && ctx.toast(r.ok ? ('借到 ' + r.net) : ('借不成:' + (r.msg || '')));
            } else if (a === 'od') {
              if (!S2.L.length) { const max = L42.prodMax('fq', G2) || 100; L42.borrow(G2, 'fq', max, false); }
              const l = S2.L[0]; if (l) { l.od = Math.max(1, (l.od | 0) + 1); l.due = Math.max(l.due | 0, L42.earlyDue(l)); S2.squad = 1; }
              ctx && ctx.toast && ctx.toast('逾期 ' + (l && l.od));
            } else if (a === 'xfer') {
              if (!S2.L.length) { ctx && ctx.toast && ctx.toast('无贷款'); }
              else { L42.transfer(G2, S2.L[0], []); ctx && ctx.toast && ctx.toast('已转尾款'); }
            } else if (a === 'sq') {
              S2.squad = 1; S2._squadDoneY = 0;
              if (!S2.L.some(l => (l.od | 0) > 0)) {
                if (!S2.L.length) { G2.realm = Math.max(G2.realm | 0, 2); L42.borrow(G2, 'fq', L42.prodMax('fq', G2) || 100, false); }
                if (S2.L[0]) { S2.L[0].od = 1; S2.L[0].due = L42.earlyDue(S2.L[0]); }
              }
              ctx && ctx.toast && ctx.toast('squad=1');
            } else if (a === 'clr') {
              S2.L = []; S2.squad = 0; ctx && ctx.toast && ctx.toast('已清空');
            } else if (a === 'fight') {
              S2.squad = 1; S2._squadDoneY = 0;
              if (!S2.L.some(l => (l.od | 0) > 0)) {
                if (!S2.L.length) { G2.realm = Math.max(G2.realm | 0, 2); L42.borrow(G2, 'fq', L42.prodMax('fq', G2) || 100, false); }
                if (S2.L[0]) { S2.L[0].od = 1; S2.L[0].due = L42.earlyDue(S2.L[0]); }
              }
              await L42.offerSquad(G2, { trigger: true, amt: L42.squadOdAmt(G2) });
            }
            ctx && ctx.save && ctx.save();
            if (ctx && ctx.rerender) ctx.rerender();
            else render(box, ctx);
          };
        } catch (err) { box.innerHTML = '<p class="hint">小贷42 面板错误</p>'; console.warn('[loan42] dev', err); }
      };
      if (typeof window !== 'undefined' && window.DevPanel && typeof DevPanel.registerTab === 'function') {
        DevPanel.registerTab('loan42', '小贷42', render);
        return true;
      }
      // 兜底：DevTabs（dev_openworld 同款），等 dev341 扫描
      try {
        const tabs = (window.DevTabs = window.DevTabs || []);
        if (!tabs.some(t => t && (t.key === 'loan42' || t.id === 'loan42'))) {
          tabs.push({ key: 'loan42', id: 'loan42', name: '小贷42', render });
        }
        return true;
      } catch (e) { return false; }
    };
    if (typeof window !== 'undefined') {
      if (!reg()) setTimeout(reg, 500);
      try {
        if (typeof document !== 'undefined' && document.head && !document.getElementById('loan42-css')) {
          const css = document.createElement('style');
          css.id = 'loan42-css';
          css.textContent = '.loan42row{margin-top:8px;padding:6px 8px;border-radius:8px;background:rgba(80,120,60,.12);border:1px solid rgba(160,200,100,.35);color:#c8e8a0;font-size:12px;line-height:1.35}';
          document.head.appendChild(css);
        }
      } catch (e) {}
    }
  })();
})(typeof window !== 'undefined' ? window : globalThis);

// ======================= 3.9.8 拍卖行 auc48（规格 docs/research_v22.md §22） =======================
// 天道拍卖行·聚宝阁深化：定期开拍 / 竞价·寄拍·赌货 / 年帽 / pend 防重掷 / loan42 垫资。
// 不改 game.js/talk.js/data.js/ui.js/market25.js/loan42.js；不升 G.v；Game.roll；
// 守 storyBlock/B.on/UI.modal；keepFnMarks；Talk.extra 非数组→[]；onclick= 不叠 listener。
// 加载：index 在 qing47（若有）/sweep44_ui 之后、audio32 之前。
'use strict';
(function (W) {
  const TEXT_AUC48 = {
    "meta": {
      "id": "TEXT_AUC48",
      "ver": "3.9.8",
      "module": "auc48.js",
      "title": "天道拍卖行·聚宝阁深化",
      "basedOn": [
        "research_v22.md§20",
        "research_v22.md§21",
        "market25.auction",
        "loan42",
        "items40",
        "ux23.SAFE"
      ]
    },
    "ui": {
      "sec": "天道拍卖行",
      "season": "本季拍场 · 第 {y} 年",
      "next": "下场开拍：再过 {n} 年（每 {gap} 年一场）",
      "open_now": "本场正在进行 · 拍品 {n}/{cap}",
      "stone": "灵石 {s}",
      "fee": "入场笺 {f} 灵石（本场一次）",
      "bid_btn": "🔨 举牌竞价",
      "buyout_btn": "💰 一口价买断",
      "consign_btn": "📦 寄拍一件",
      "leak_btn": "🎲 赌货席（捡漏）",
      "loan_btn": "💸 问小贷能不能垫",
      "cap_bid": "本年举牌已满（{n}/{cap}）",
      "cap_consign": "本年寄拍已满（{n}/{cap}）",
      "cap_leak": "本年赌货已满（{n}/{cap}）",
      "noap": "行动力不够。逛拍场也要花半日。",
      "nostone": "灵石不够。钱多多朝你翻白眼。",
      "closed": "本场已落槌。下次开拍见。",
      "empty": "拍卖行未开张（未到开拍年，或 AUC48.off）。可先去坊市钱多多处看旧聚宝阁。",
      "hint": "竞价与寄拍耗行动力；赌货有风险。逾期小贷在身时，拍行会限制高价举牌。",
      "od_warn": "你名下有逾期小贷。高价举牌前请先还清，或接受「催收优先受偿」条款。",
      "entry_talk": "🏛 天道拍卖行",
      "legacy_hint": "（旧）聚宝阁浅拍仍在 market25；本行是 3.9.8 深化场。",
      "legacy_go": "前往天道拍卖行"
    },
    "open": {
      "title": "开拍鼓",
      "banner": "聚宝阁传来三声鼓：第 {y} 年季拍开场。\n天道备注：成交额的百分之三记入「市场管理费」，不开发票。",
      "toast": "拍卖行开张了。钱多多换上了假笑。"
    },
    "bid": {
      "title": "竞价·{name}",
      "ask": "【{n}】起拍 {start}，当前价 {cur}。\n估价约 {base}。\n对手：{rival}\n还举吗？",
      "opt_raise": "再加到 {next}",
      "opt_pass": "不跟了",
      "opt_buyout": "一口价 {buy}（直接落槌）",
      "win": "木槌落下。【{n}】归你，成交 {price} 灵石。\n天道会计在远处记了一笔。",
      "lose": "对手把价抬到 {price}，你没跟。\n拍品落入【{rival}】袖中。",
      "bust": "口袋比脸干净。对手笑了一下，拍品走了。",
      "rivals": [
        "散修·爱砍价",
        "讨债小鬼（公款）",
        "龙宫采购办",
        "阴三娘的马仔",
        "天道体验官（匿名）",
        "一位戴斗笠的债主"
      ]
    },
    "consign": {
      "title": "寄拍",
      "ask": "选择寄拍物品（收 {fee}% 手续费；流拍费不退）：",
      "cancel": "算了",
      "sold": "【{n}】拍出 {got} 灵石（已扣手续 {fee}）。买家留下一句：「值。」",
      "pass": "【{n}】流拍。手续费 {fee} 灵石已扣。钱多多：「行情不好。」",
      "none": "背包里没有可寄拍之物（需有标价且非剧情锁）。"
    },
    "leak": {
      "title": "赌货席",
      "ask": "三只封条木匣，任选一只。标价 {price} 灵石。\n可能是好货，也可能是「天道体验装」。\n打开前不可退。",
      "opt_a": "左边那只（封条有爪印）",
      "opt_b": "中间那只（封条写着「非卖品」又划掉）",
      "opt_c": "右边那只（封条是催收函背面）",
      "cancel": "不敢赌",
      "good": "打开！里面是【{n}】！捡漏成功。天道备注：统计上你仍亏。",
      "mid": "打开。是【{n}】，不好不坏。钱多多：「运气一般。」",
      "bad": "打开。一张「感谢参与赌货席」礼券……和一撮灰。\n灵石已扣。灰可以留作纪念。"
    },
    "loan": {
      "title": "垫资？",
      "ask": "当前价 {cur}，你还差 {gap} 灵石。\n要不要走一趟天道小贷？（调用 loan42，不改其公式）",
      "opt_go": "去小贷窗口看看",
      "opt_no": "算了，不跟了",
      "blocked": "小贷窗口：逾期未清或征信不够，不垫拍场款。",
      "ok": "小贷到账。你可以继续举牌——也多了一笔要还的。"
    },
    "year": {
      "title": "拍场年结",
      "line": "本岁拍场：成交 {deal} 笔，寄拍 {con}，赌货 {leak}。\n天道抽成已从你看不见的地方拿走。",
      "opt_ok": "知道了"
    },
    "tiandao": [
      "天道备注：拍卖行成交记入「市场活跃度」。活跃度越高，明年利息宣传越响。",
      "讨债司市场科：贵客若拍下催收函真迹，可享逾期提醒个性化彩铃。",
      "孟婆：赌货席的灰，轮回殿回收价为零。",
      "纸鹤：「恭喜成交。附件：拍品来源合法性免责声明（很长）。」",
      "钱多多：「我只是代办。假货？那是天道质检的事。」"
    ],
    "dev": {
      "tab": "拍卖48",
      "hint": "天道拍卖行（G.auc48）。仅开发者模式。标签勿加 SAFE 前缀。"
    },
    "toast": {
      "off": "拍卖48 已关闭（AUC48.off）。",
      "blocked": "此刻不宜开拍（序章/战斗/教程中）。",
      "pend_restore": "检测到未决拍场选择，按存档续锤（不重抽）。",
      "farm_cap": "本年份额用尽。留给别的散修一点汤喝。"
    }
  };

  try { JSON.parse(JSON.stringify(TEXT_AUC48)); } catch (e) { console.warn('[auc48] TEXT invalid', e); }

  const POOL = [
    { minRealm: 1, item: 'pyd', base: 500 },
    { minRealm: 1, item: 'zjd', base: 1500 },
    { minRealm: 1, item: 'ysf', base: 600 },
    { minRealm: 2, item: 'pjd', base: 3000 },
    { minRealm: 2, item: 'ysd', base: 2500 },
    { minRealm: 2, item: 'tsf', base: 4000 },
    { minRealm: 3, item: 'xsd', base: 8000 },
    { minRealm: 3, item: 'lz', base: 400 },
    { minRealm: 4, item: 'yd', base: 800 },
    { minRealm: 1, item: 'herb', base: 200 },
    { minRealm: 1, item: 'peach', base: 800 },
    { minRealm: 2, item: 'coin', base: 1200 }
  ];
  const LEAK_GOOD = ['pjd', 'xsd', 'tsf', 'ysd'];
  const LEAK_MID = ['pyd', 'zjd', 'ysf', 'lz', 'peach', 'scroll'];

  const A = W.AUC48 = {
    off: false,
    GAP: 3, FEE: 15, LOTS: 4,
    AP_BID: 1, AP_CON: 1, AP_LEAK: 1,
    BID_CAP: 5, CON_CAP: 2, LEAK_CAP: 1,
    RAISE: 1.28, BUYOUT: 1.85, AI_CEIL: [1.15, 1.55],
    CON_FEE: 0.10, CON_OK: 0.55, CON_MUL: [1.0, 1.45],
    LEAK_PRICE_MUL: 0.45, LEAK_GOOD: 0.22, LEAK_MID: 0.45,
    OD_BID_MUL: 0.9,
    GIFT_REN: 3,
    TEXT: TEXT_AUC48,
    _wired: false
  };

  function fmt(s, vars) {
    let t = String(s == null ? '' : s);
    if (!vars) return t;
    for (const k of Object.keys(vars)) {
      t = t.replace(new RegExp('\\{' + k + '\\}', 'g'), String(vars[k]));
    }
    return t;
  }
  function itemName(id) {
    try {
      if (typeof ITEMS !== 'undefined' && ITEMS[id] && ITEMS[id].n) return ITEMS[id].n;
    } catch (e) { }
    return id || '?';
  }
  function roll(p, kind) {
    try {
      if (typeof Game !== 'undefined' && Game.roll) return !!Game.roll(p, kind || 'qiyu');
    } catch (e) { }
    return Math.random() < p;
  }
  function rndRange(a, b) {
    try {
      if (typeof Game !== 'undefined' && typeof Game.roll === 'function') {
        let u = 0, bit = 0.5;
        for (let i = 0; i < 16; i++) {
          if (Game.roll(0.5, 'qiyu')) u += bit;
          bit *= 0.5;
        }
        return a + u * (b - a);
      }
    } catch (e) { }
    return a + Math.random() * (b - a);
  }
  function rollIndex(n) {
    if (n <= 1) return 0;
    let i = 0;
    try {
      if (typeof Game !== 'undefined' && Game.roll) {
        for (let k = 1; k < n; k++) {
          if (Game.roll(1 / (k + 1), 'qiyu')) i = k;
        }
        return i;
      }
    } catch (e) { }
    return Math.floor(Math.random() * n) % n;
  }
  function toast(msg, color) {
    try { if (typeof UI !== 'undefined' && UI.toast) UI.toast(msg, color); } catch (e) { }
  }
  function keepFnMarks(src, dst, selfMark) {
    if (!src || !dst) return dst;
    try {
      for (const k of Object.keys(src)) {
        if (k.charAt(0) !== '_') continue;
        if (selfMark && k === selfMark) continue;
        try { dst[k] = src[k]; } catch (e) { }
      }
    } catch (e) { }
    return dst;
  }
  function hasLoan() {
    try {
      return typeof Loan42 !== 'undefined' && Loan42 && typeof Loan42.hasOverdue === 'function';
    } catch (e) { return false; }
  }
  function overdue(G) {
    if (!hasLoan()) return false;
    try { return !!Loan42.hasOverdue(G); } catch (e) { return false; }
  }
  function metaOf() {
    try {
      if (typeof Game === 'undefined' || !Game.meta) return null;
      if (!Game.meta.auc48 || typeof Game.meta.auc48 !== 'object') {
        Game.meta.auc48 = { totDeal: 0, totLeakGood: 0, totCon: 0 };
      }
      const m = Game.meta.auc48;
      if (typeof m.totDeal !== 'number') m.totDeal = 0;
      if (typeof m.totLeakGood !== 'number') m.totLeakGood = 0;
      if (typeof m.totCon !== 'number') m.totCon = 0;
      return m;
    } catch (e) { return null; }
  }
  function addRenown(n) {
    try {
      if (typeof Market25 === 'undefined' || !Market25) return;
      const mapId = (typeof R !== 'undefined' && R && R.mapId) ? R.mapId : 'market';
      if (typeof Market25.renownOf === 'function' && Game && Game.G) {
        if (!Game.G.renown) Game.G.renown = {};
        Game.G.renown[mapId] = Math.max(-9999, (Game.G.renown[mapId] || 0) + (n | 0));
      }
    } catch (e) { }
  }

  const API = W.Auc48 = {
    TEXT: TEXT_AUC48,

    canPopup() {
      if (A.off) return false;
      try {
        if (typeof Game === 'undefined' || !Game || !Game.G) return false;
      } catch (e) { return false; }
      try {
        if (typeof NPC37 !== 'undefined' && NPC37 && typeof NPC37.storyBlock === 'function' && NPC37.storyBlock()) return false;
      } catch (e) { }
      try {
        if (typeof B !== 'undefined' && B && B.on) return false;
      } catch (e) { }
      try {
        if (typeof UI !== 'undefined' && UI && UI.modal) return false;
      } catch (e) { }
      return true;
    },

    ensure(G) {
      if (!G || typeof G !== 'object') return null;
      if (!G.auc48 || typeof G.auc48 !== 'object') {
        G.auc48 = {
          v: 1, yOpen: 0, nextY: 0, feePaid: 0, lots: [], leak: null,
          y: 0, nBid: 0, nCon: 0, nLeak: 0, dealY: 0, pend: null, lastToastY: 0
        };
      }
      const S = G.auc48;
      if (typeof S.v !== 'number') S.v = 1;
      if (typeof S.yOpen !== 'number') S.yOpen = 0;
      if (typeof S.nextY !== 'number') S.nextY = 0;
      if (typeof S.feePaid !== 'number') S.feePaid = 0;
      if (!Array.isArray(S.lots)) S.lots = [];
      if (S.leak != null && typeof S.leak !== 'object') S.leak = null;
      if (typeof S.y !== 'number') S.y = 0;
      for (const k of ['nBid', 'nCon', 'nLeak', 'dealY', 'lastToastY']) {
        if (typeof S[k] !== 'number') S[k] = 0;
      }
      if (S.pend != null && typeof S.pend !== 'object') S.pend = null;
      // 年帽跨年归零
      const yr = G.year | 0;
      if (S.y !== yr) {
        S.y = yr;
        S.nBid = 0; S.nCon = 0; S.nLeak = 0; S.dealY = 0;
      }
      // nextY 对齐
      if (!S.nextY) {
        const gap = A.GAP | 0;
        const y = Math.max(1, yr);
        S.nextY = y + ((gap - ((y - 1) % gap)) % gap || gap);
        if (S.nextY < y) S.nextY = y;
      }
      metaOf();
      return S;
    },

    clear(G) {
      if (!G) return;
      try { delete G.auc48; } catch (e) { G.auc48 = null; }
    },

    _pool(G) {
      const realm = (G && G.realm) | 0;
      return POOL.filter(g => realm >= (g.minRealm | 0));
    },

    _genLots(G, S) {
      const pool = this._pool(G).slice();
      const lots = [];
      const used = {};
      const n = A.LOTS | 0;
      while (lots.length < n && pool.length) {
        const i = rollIndex(pool.length);
        const g = pool.splice(i, 1)[0];
        if (!g || used[g.item]) continue;
        used[g.item] = 1;
        const base = g.base | 0;
        const start = Math.max(1, Math.round(base * 0.6));
        const ceilMul = rndRange(A.AI_CEIL[0], A.AI_CEIL[1]);
        const rivals = TEXT_AUC48.bid.rivals;
        lots.push({
          id: 'L' + (lots.length + 1),
          item: g.item,
          base: base,
          start: start,
          cur: start,
          rival: rivals[rollIndex(rivals.length)],
          aiCeil: Math.round(base * ceilMul),
          done: 0,
          won: 0
        });
      }
      S.lots = lots;
      // 赌货标价：本场估价均值 × LEAK_PRICE_MUL
      let avg = 800;
      if (lots.length) {
        avg = lots.reduce((a, l) => a + (l.base | 0), 0) / lots.length;
      }
      S.leak = {
        price: Math.max(10, Math.round(avg * A.LEAK_PRICE_MUL)),
        opened: 0
      };
    },

    /** 到年则开拍：写入 lots/leak；已有本场且未过期不重抽 */
    tryOpen(G, opts) {
      opts = opts || {};
      if (A.off && !opts.force) return { ok: false, reason: 'off' };
      if (!G) return { ok: false, reason: 'nog' };
      const S = this.ensure(G);
      if (!S) return { ok: false, reason: 'nog' };
      const yr = G.year | 0;
      const force = !!opts.force;
      if (!force && S.yOpen === yr && S.lots && S.lots.length) {
        return { ok: true, already: true, S };
      }
      if (!force && yr < (S.nextY | 0)) return { ok: false, reason: 'early', nextY: S.nextY };
      if (!force && !opts.silent && !this.canPopup()) return { ok: false, reason: 'block' };
      // 生成（force 或到年）
      this._genLots(G, S);
      S.yOpen = yr;
      S.nextY = yr + (A.GAP | 0);
      S.feePaid = 0;
      return { ok: true, opened: true, S };
    },

    openDrum(G, opts) {
      opts = opts || {};
      const r = this.tryOpen(G, opts);
      if (!r.ok) return r;
      if (r.already && !opts.force) return r;
      if (opts.silent) return r;
      if (!this.canPopup() && !opts.force) return { ok: false, reason: 'block' };
      // 开拍鼓卡
      return this._openDrumUI(G, r.S, opts);
    },

    async _openDrumUI(G, S, opts) {
      opts = opts || {};
      try {
        if (typeof UI !== 'undefined' && UI.card) {
          S.pend = { kind: 'open', y: G.year | 0 };
          const c = await UI.card(
            TEXT_AUC48.open.title,
            fmt(TEXT_AUC48.open.banner, { y: G.year | 0 }),
            'npc_merchant',
            [TEXT_AUC48.year.opt_ok]
          );
          if (c === -1) return { ok: false, reason: 'modal', S };
          delete S.pend;
          toast(TEXT_AUC48.open.toast);
          S.lastToastY = G.year | 0;
        }
      } catch (e) { }
      return { ok: true, opened: true, S };
    },

    seasonOpen(G) {
      const S = this.ensure(G);
      if (!S) return false;
      return (S.yOpen | 0) === (G.year | 0) && Array.isArray(S.lots) && S.lots.length > 0;
    },

    payFee(G, S) {
      S = S || this.ensure(G);
      if (!S) return { ok: false, reason: 'nog' };
      if (S.feePaid) return { ok: true, paid: 0 };
      const fee = A.FEE | 0;
      if (((G.stone | 0) < fee)) return { ok: false, reason: 'stone', fee };
      G.stone = (G.stone | 0) - fee;
      S.feePaid = 1;
      try { if (typeof UI !== 'undefined' && UI.hud) UI.hud(); } catch (e) { }
      return { ok: true, paid: fee };
    },

    findLot(S, lotId) {
      if (!S || !Array.isArray(S.lots)) return null;
      return S.lots.find(l => l && l.id === lotId) || null;
    },

    /** 举牌：扣 AP / 年帽；NPC 跟价用 Game.roll；pend 防重掷 */
    async bid(G, lotId, opts) {
      opts = opts || {};
      if (A.off && !opts.force) return { ok: false, reason: 'off' };
      if (!G) return { ok: false, reason: 'nog' };
      const S = this.ensure(G);
      if (!this.seasonOpen(G) && !opts.force) return { ok: false, reason: 'closed' };
      let lot = this.findLot(S, lotId);
      if (!lot) return { ok: false, reason: 'nolot' };
      if (lot.done) return { ok: false, reason: 'done' };
      if (!opts.skipCap && (S.nBid | 0) >= (A.BID_CAP | 0)) {
        toast(TEXT_AUC48.toast.farm_cap);
        return { ok: false, reason: 'cap' };
      }
      if (!opts.silent && !this.canPopup() && !opts.force) return { ok: false, reason: 'block' };

      // 费用 / AP（pend.paid 则不重复扣）
      const pend = S.pend && S.pend.kind === 'bid' && S.pend.lotId === lotId ? S.pend : null;
      if (!(pend && pend.paid)) {
        const fee = this.payFee(G, S);
        if (!fee.ok) { toast(TEXT_AUC48.ui.nostone); return { ok: false, reason: 'fee' }; }
        if (!opts.skipAp) {
          const ap = A.AP_BID | 0;
          if ((G.ap | 0) < ap) { toast(TEXT_AUC48.ui.noap); return { ok: false, reason: 'ap' }; }
          G.ap = (G.ap | 0) - ap;
          S.nBid = (S.nBid | 0) + 1;
        }
      }
      if (pend && typeof pend.cur === 'number') lot.cur = pend.cur | 0;

      const buy = Math.round((lot.base | 0) * A.BUYOUT);
      const next = Math.round((lot.cur | 0) * A.RAISE);
      const od = overdue(G);
      const optsLabels = [
        fmt(TEXT_AUC48.bid.opt_raise, { next: next }),
        TEXT_AUC48.bid.opt_pass
      ];
      // 逾期禁一口价
      if (!od) optsLabels.push(fmt(TEXT_AUC48.bid.opt_buyout, { buy: buy }));

      S.pend = { kind: 'bid', y: G.year | 0, lotId: lot.id, cur: lot.cur | 0, paid: 1 };

      let choice = opts.choice;
      if (choice == null) {
        try {
          if (typeof UI !== 'undefined' && UI.card) {
            choice = await UI.card(
              fmt(TEXT_AUC48.bid.title, { name: itemName(lot.item) }),
              fmt(TEXT_AUC48.bid.ask, {
                n: itemName(lot.item), start: lot.start | 0, cur: lot.cur | 0,
                base: lot.base | 0, rival: lot.rival || '?'
              }),
              'npc_merchant',
              optsLabels
            );
          } else choice = 1;
        } catch (e) { choice = 1; }
      }
      if (choice === -1) return { ok: false, reason: 'modal', pend: true };

      // 不跟了
      if (choice === 1) {
        lot.done = 1; lot.won = 0;
        delete S.pend;
        try {
          if (typeof UI !== 'undefined' && UI.card) {
            await UI.card(TEXT_AUC48.bid.title.replace('{name}', itemName(lot.item)),
              fmt(TEXT_AUC48.bid.lose, { price: lot.cur | 0, rival: lot.rival || '?' }),
              'npc_merchant', [TEXT_AUC48.year.opt_ok]);
          }
        } catch (e) { }
        return { ok: true, result: 'pass', lot };
      }

      // 一口价
      if (choice === 2 && !od) {
        return await this._winLot(G, S, lot, buy, opts);
      }

      // 再加到 next：NPC 是否跟
      lot.cur = next;
      S.pend.cur = lot.cur;
      if (lot.cur < (lot.aiCeil | 0) && roll(0.62, 'qiyu')) {
        // NPC 再抬
        lot.cur = Math.round(lot.cur * A.RAISE);
        S.pend.cur = lot.cur;
        // 玩家付不起或逾期高价 → 垫资岔路
        const needPad = (lot.cur > (G.stone | 0)) || (od && lot.cur > (G.stone | 0) * A.OD_BID_MUL);
        if (needPad) {
          const pad = await this._padOrBail(G, S, lot, opts);
          if (!pad.ok) {
            lot.done = 1; lot.won = 0;
            delete S.pend;
            try {
              if (typeof UI !== 'undefined' && UI.card) {
                await UI.card('竞价', TEXT_AUC48.bid.bust, 'npc_merchant', [TEXT_AUC48.year.opt_ok]);
              }
            } catch (e) { }
            return { ok: true, result: 'bust', lot };
          }
        }
        // NPC 跟了之后玩家再举一次（简化：视作玩家坚持则成交于 cur，若仍超 aiCeil 则 NPC 停）
        if (lot.cur >= (lot.aiCeil | 0) || !roll(0.62, 'qiyu')) {
          return await this._winLot(G, S, lot, lot.cur | 0, opts);
        }
        // 继续抬一轮后玩家成交
        lot.cur = Math.round(lot.cur * A.RAISE);
        return await this._winLot(G, S, lot, lot.cur | 0, opts);
      }
      // NPC 放弃 → 玩家成交
      return await this._winLot(G, S, lot, lot.cur | 0, opts);
    },

    async _winLot(G, S, lot, price, opts) {
      opts = opts || {};
      price = price | 0;
      if ((G.stone | 0) < price) {
        // 再试垫资
        const pad = await this._padOrBail(G, S, lot, Object.assign({}, opts, { cur: price }));
        if (!pad.ok || (G.stone | 0) < price) {
          lot.done = 1; lot.won = 0;
          delete S.pend;
          try {
            if (typeof UI !== 'undefined' && UI.card) {
              await UI.card('竞价', TEXT_AUC48.bid.bust, 'npc_merchant', [TEXT_AUC48.year.opt_ok]);
            }
          } catch (e) { }
          return { ok: true, result: 'bust', lot };
        }
      }
      G.stone = (G.stone | 0) - price;
      try {
        if (typeof Game !== 'undefined' && Game.give) Game.give(lot.item, 1);
        else {
          G.inv = G.inv || {};
          G.inv[lot.item] = (G.inv[lot.item] | 0) + 1;
        }
      } catch (e) { }
      lot.done = 1; lot.won = 1; lot.cur = price;
      S.dealY = (S.dealY | 0) + 1;
      const m = metaOf();
      if (m) m.totDeal = (m.totDeal | 0) + 1;
      addRenown(A.GIFT_REN | 0);
      delete S.pend;
      try {
        if (!opts.silent && typeof UI !== 'undefined' && UI.card) {
          await UI.card(
            fmt(TEXT_AUC48.bid.title, { name: itemName(lot.item) }),
            fmt(TEXT_AUC48.bid.win, { n: itemName(lot.item), price: price }),
            'i:chest',
            [TEXT_AUC48.year.opt_ok]
          );
        }
        if (typeof UI !== 'undefined' && UI.hud) UI.hud();
      } catch (e) { }
      return { ok: true, result: 'win', lot, price };
    },

    async _padOrBail(G, S, lot, opts) {
      opts = opts || {};
      const cur = (opts.cur != null ? opts.cur : lot.cur) | 0;
      const gap = Math.max(0, cur - (G.stone | 0));
      if (gap <= 0) return { ok: true };
      if (!hasLoan()) return { ok: false, reason: 'noloan' };
      // 逾期时 canBorrow 会失败 → blocked
      let choice = opts.loanChoice;
      if (choice == null) {
        try {
          if (typeof UI !== 'undefined' && UI.card) {
            choice = await UI.card(
              TEXT_AUC48.loan.title,
              fmt(TEXT_AUC48.loan.ask, { cur: cur, gap: gap }),
              'npc_merchant',
              [TEXT_AUC48.loan.opt_go, TEXT_AUC48.loan.opt_no]
            );
          } else choice = 1;
        } catch (e) { choice = 1; }
      }
      if (choice === -1) return { ok: false, reason: 'modal' };
      if (choice !== 0) return { ok: false, reason: 'bail' };
      try {
        const gate = Loan42.canBorrow('fq', G);
        if (!gate || !gate.ok) {
          try {
            if (typeof UI !== 'undefined' && UI.card) {
              await UI.card(TEXT_AUC48.loan.title, TEXT_AUC48.loan.blocked, 'npc_merchant', [TEXT_AUC48.year.opt_ok]);
            }
          } catch (e) { }
          return { ok: false, reason: 'blocked' };
        }
        const amt = Math.min(gate.max | 0, Math.max(gap, 1));
        const r = Loan42.borrow(G, 'fq', amt, false);
        if (!r || !r.ok) {
          try {
            if (typeof UI !== 'undefined' && UI.card) {
              await UI.card(TEXT_AUC48.loan.title, TEXT_AUC48.loan.blocked, 'npc_merchant', [TEXT_AUC48.year.opt_ok]);
            }
          } catch (e) { }
          return { ok: false, reason: 'blocked' };
        }
        toast(TEXT_AUC48.loan.ok);
        return { ok: true, borrowed: amt };
      } catch (e) {
        return { ok: false, reason: 'err' };
      }
    },

    /** 寄拍 */
    async consign(G, opts) {
      opts = opts || {};
      if (A.off && !opts.force) return { ok: false, reason: 'off' };
      if (!G) return { ok: false, reason: 'nog' };
      const S = this.ensure(G);
      if (!this.seasonOpen(G) && !opts.force) {
        // 允许未开拍时寄拍？规格：本场活动；要求开拍
        return { ok: false, reason: 'closed' };
      }
      if (!opts.skipCap && (S.nCon | 0) >= (A.CON_CAP | 0)) {
        toast(TEXT_AUC48.toast.farm_cap);
        return { ok: false, reason: 'cap' };
      }
      if (!opts.silent && !this.canPopup() && !opts.force) return { ok: false, reason: 'block' };

      const inv = G.inv || {};
      const sellable = Object.keys(inv).filter(k => {
        if ((inv[k] | 0) <= 0) return false;
        try {
          if (typeof ITEMS === 'undefined' || !ITEMS[k]) return false;
          if (!(ITEMS[k].p > 0)) return false;
          if (ITEMS[k].t === 'quest') return false;
        } catch (e) { return false; }
        return true;
      });
      if (!sellable.length) {
        toast(TEXT_AUC48.consign.none);
        return { ok: false, reason: 'none' };
      }

      let idx = opts.itemIndex;
      let itemId = opts.itemId;
      if (itemId == null) {
        if (idx == null) {
          const labels = sellable.slice(0, 8).map(k => {
            const n = itemName(k);
            const p = (ITEMS[k] && ITEMS[k].p) | 0;
            return n + '（持' + (inv[k] | 0) + '）估' + p;
          }).concat([TEXT_AUC48.consign.cancel]);
          try {
            if (typeof UI !== 'undefined' && UI.card) {
              S.pend = { kind: 'consign', y: G.year | 0 };
              idx = await UI.card(
                TEXT_AUC48.consign.title,
                fmt(TEXT_AUC48.consign.ask, { fee: Math.round(A.CON_FEE * 100) }),
                'npc_merchant',
                labels
              );
              if (idx === -1) return { ok: false, reason: 'modal', pend: true };
            } else idx = sellable.length;
          } catch (e) { idx = sellable.length; }
        }
        if (idx == null || idx >= sellable.length) {
          delete S.pend;
          return { ok: false, reason: 'cancel' };
        }
        itemId = sellable[idx];
      }
      if (sellable.indexOf(itemId) < 0 && !(opts.itemId && (inv[itemId] | 0) > 0)) {
        delete S.pend;
        return { ok: false, reason: 'none' };
      }

      const feeR = this.payFee(G, S);
      if (!feeR.ok) { toast(TEXT_AUC48.ui.nostone); delete S.pend; return { ok: false, reason: 'fee' }; }
      if (!opts.skipAp) {
        if ((G.ap | 0) < (A.AP_CON | 0)) { toast(TEXT_AUC48.ui.noap); delete S.pend; return { ok: false, reason: 'ap' }; }
        G.ap = (G.ap | 0) - (A.AP_CON | 0);
        S.nCon = (S.nCon | 0) + 1;
      }

      const base = (ITEMS[itemId] && ITEMS[itemId].p) | 0;
      const reserve = Math.round(base * 0.8);
      const fee = Math.max(1, Math.round(reserve * A.CON_FEE));
      if ((G.stone | 0) < fee) {
        // 手续费不足：退 AP? 规格：扣了就不退；尽量先检查
        toast(TEXT_AUC48.ui.nostone);
        delete S.pend;
        return { ok: false, reason: 'stone' };
      }
      try {
        if (typeof Game !== 'undefined' && Game.take) Game.take(itemId, 1);
        else { G.inv[itemId] = (G.inv[itemId] | 0) - 1; if (G.inv[itemId] <= 0) delete G.inv[itemId]; }
      } catch (e) { }
      G.stone = (G.stone | 0) - fee;

      const sold = (opts.forceSold != null) ? !!opts.forceSold : roll(A.CON_OK, 'qiyu');
      delete S.pend;
      if (sold) {
        const mul = rndRange(A.CON_MUL[0], A.CON_MUL[1]);
        const got = Math.max(1, Math.round(reserve * mul));
        G.stone = (G.stone | 0) + got;
        const m = metaOf();
        if (m) m.totCon = (m.totCon | 0) + 1;
        S.dealY = (S.dealY | 0) + 1;
        addRenown(2);
        try {
          if (!opts.silent && typeof UI !== 'undefined' && UI.card) {
            await UI.card(TEXT_AUC48.consign.title,
              fmt(TEXT_AUC48.consign.sold, { n: itemName(itemId), got: got, fee: fee }),
              'npc_merchant', [TEXT_AUC48.year.opt_ok]);
          }
          if (typeof UI !== 'undefined' && UI.hud) UI.hud();
        } catch (e) { }
        return { ok: true, result: 'sold', item: itemId, got: got, fee: fee };
      }
      try {
        if (!opts.silent && typeof UI !== 'undefined' && UI.card) {
          await UI.card(TEXT_AUC48.consign.title,
            fmt(TEXT_AUC48.consign.pass, { n: itemName(itemId), fee: fee }),
            'npc_merchant', [TEXT_AUC48.year.opt_ok]);
        }
        if (typeof UI !== 'undefined' && UI.hud) UI.hud();
      } catch (e) { }
      return { ok: true, result: 'pass', item: itemId, fee: fee };
    },

    /** 赌货席 */
    async leak(G, opts) {
      opts = opts || {};
      if (A.off && !opts.force) return { ok: false, reason: 'off' };
      if (!G) return { ok: false, reason: 'nog' };
      const S = this.ensure(G);
      if (!this.seasonOpen(G) && !opts.force) return { ok: false, reason: 'closed' };
      if (!S.leak || S.leak.opened) return { ok: false, reason: 'opened' };
      if (!opts.skipCap && (S.nLeak | 0) >= (A.LEAK_CAP | 0)) {
        toast(TEXT_AUC48.toast.farm_cap);
        return { ok: false, reason: 'cap' };
      }
      if (!opts.silent && !this.canPopup() && !opts.force) return { ok: false, reason: 'block' };

      const price = (S.leak.price | 0);
      const pend = S.pend && S.pend.kind === 'leak' ? S.pend : null;
      if (!(pend && pend.paid)) {
        const fee = this.payFee(G, S);
        if (!fee.ok) { toast(TEXT_AUC48.ui.nostone); return { ok: false, reason: 'fee' }; }
        if ((G.stone | 0) < price) { toast(TEXT_AUC48.ui.nostone); return { ok: false, reason: 'stone' }; }
        if (!opts.skipAp) {
          if ((G.ap | 0) < (A.AP_LEAK | 0)) { toast(TEXT_AUC48.ui.noap); return { ok: false, reason: 'ap' }; }
          G.ap = (G.ap | 0) - (A.AP_LEAK | 0);
          S.nLeak = (S.nLeak | 0) + 1;
        }
        G.stone = (G.stone | 0) - price;
        S.pend = { kind: 'leak', y: G.year | 0, paid: 1, price: price };
      }

      let choice = opts.choice;
      if (choice == null) {
        try {
          if (typeof UI !== 'undefined' && UI.card) {
            choice = await UI.card(
              TEXT_AUC48.leak.title,
              fmt(TEXT_AUC48.leak.ask, { price: price }),
              'npc_merchant',
              [TEXT_AUC48.leak.opt_a, TEXT_AUC48.leak.opt_b, TEXT_AUC48.leak.opt_c, TEXT_AUC48.leak.cancel]
            );
          } else choice = 3;
        } catch (e) { choice = 3; }
      }
      if (choice === -1) return { ok: false, reason: 'modal', pend: true };
      if (choice === 3) {
        // 取消：退石？规格「打开前不可退」——但取消未打开。退还标价与不退 AP（已花半日）
        G.stone = (G.stone | 0) + price;
        // 年帽已计；不退 AP
        delete S.pend;
        return { ok: false, reason: 'cancel' };
      }

      // 三匣同概率 → 再按 good/mid/bad 档
      let tier = opts.forceTier;
      if (tier == null) {
        if (roll(A.LEAK_GOOD, 'qiyu')) tier = 'good';
        else if (roll(A.LEAK_MID / Math.max(0.01, 1 - A.LEAK_GOOD), 'qiyu')) tier = 'mid';
        else tier = 'bad';
      }
      S.leak.opened = 1;
      delete S.pend;

      if (tier === 'good') {
        const id = LEAK_GOOD[rollIndex(LEAK_GOOD.length)];
        try {
          if (typeof Game !== 'undefined' && Game.give) Game.give(id, 1);
          else { G.inv = G.inv || {}; G.inv[id] = (G.inv[id] | 0) + 1; }
        } catch (e) { }
        const m = metaOf();
        if (m) m.totLeakGood = (m.totLeakGood | 0) + 1;
        try {
          if (!opts.silent && typeof UI !== 'undefined' && UI.card) {
            await UI.card(TEXT_AUC48.leak.title, fmt(TEXT_AUC48.leak.good, { n: itemName(id) }), 'i:chest', [TEXT_AUC48.year.opt_ok]);
          }
        } catch (e) { }
        return { ok: true, result: 'good', item: id };
      }
      if (tier === 'mid') {
        const id = LEAK_MID[rollIndex(LEAK_MID.length)];
        try {
          if (typeof Game !== 'undefined' && Game.give) Game.give(id, 1);
          else { G.inv = G.inv || {}; G.inv[id] = (G.inv[id] | 0) + 1; }
        } catch (e) { }
        try {
          if (!opts.silent && typeof UI !== 'undefined' && UI.card) {
            await UI.card(TEXT_AUC48.leak.title, fmt(TEXT_AUC48.leak.mid, { n: itemName(id) }), 'npc_merchant', [TEXT_AUC48.year.opt_ok]);
          }
        } catch (e) { }
        return { ok: true, result: 'mid', item: id };
      }
      try {
        if (!opts.silent && typeof UI !== 'undefined' && UI.card) {
          await UI.card(TEXT_AUC48.leak.title, TEXT_AUC48.leak.bad, 'npc_merchant', [TEXT_AUC48.year.opt_ok]);
        }
      } catch (e) { }
      return { ok: true, result: 'bad' };
    },

    /** 读档/切图复牌 */
    async restorePend(G, opts) {
      opts = opts || {};
      if (!G) return null;
      const S = this.ensure(G);
      if (!S || !S.pend) return null;
      if (A.off) return null;
      if (!opts.force && !this.canPopup()) return null;
      const p = S.pend;
      toast(TEXT_AUC48.toast.pend_restore);
      if (p.kind === 'bid' && p.lotId) {
        return await this.bid(G, p.lotId, { force: true, skipCap: true, skipAp: true, choice: opts.choice });
      }
      if (p.kind === 'leak') {
        return await this.leak(G, { force: true, skipCap: true, skipAp: true, choice: opts.choice });
      }
      if (p.kind === 'open') {
        delete S.pend;
        return { ok: true, restored: 'open' };
      }
      if (p.kind === 'consign') {
        return await this.consign(G, { force: true, skipCap: true, skipAp: true, itemIndex: opts.itemIndex, itemId: opts.itemId });
      }
      return null;
    },

    async yearTick(G, opts) {
      opts = opts || {};
      if (!G || A.off) return null;
      const S = this.ensure(G);
      if (!S) return null;
      // 先复 pend
      if (S.pend && this.canPopup()) {
        try { await this.restorePend(G, opts); } catch (e) { }
      }
      const yr = G.year | 0;
      // 到年开拍
      if (yr >= (S.nextY | 0) && !(S.yOpen === yr && S.lots && S.lots.length)) {
        if (this.canPopup() || opts.force) {
          await this.openDrum(G, opts);
        }
      } else if (S.yOpen === yr && (S.dealY | 0) + (S.nCon | 0) + (S.nLeak | 0) > 0 && S.lastToastY !== yr) {
        // 年结一行（有活动时）
        if (this.canPopup() || opts.force) {
          try {
            if (typeof UI !== 'undefined' && UI.card) {
              await UI.card(
                TEXT_AUC48.year.title,
                fmt(TEXT_AUC48.year.line, { deal: S.dealY | 0, con: S.nCon | 0, leak: S.nLeak | 0 }),
                'npc_merchant',
                [TEXT_AUC48.year.opt_ok]
              );
              S.lastToastY = yr;
            }
          } catch (e) { }
        }
      }
      return S;
    },

    /** 打开面板 */
    openPanel() {
      try {
        if (typeof UI !== 'undefined' && UI.panel) return UI.panel('auc48');
      } catch (e) { }
      return null;
    },

    askLoan(G) {
      if (!hasLoan()) { toast(TEXT_AUC48.loan.blocked); return { ok: false }; }
      try {
        if (overdue(G)) { toast(TEXT_AUC48.loan.blocked); return { ok: false, reason: 'od' }; }
        const gate = Loan42.canBorrow('fq', G);
        if (!gate || !gate.ok) { toast(TEXT_AUC48.loan.blocked); return { ok: false }; }
        toast(TEXT_AUC48.loan.ok);
        // 仅提示；实际借在竞价垫资路径。此处给一笔小垫方便逛
        const amt = Math.min(gate.max | 0, 500);
        if (amt > 0) {
          const r = Loan42.borrow(G, 'fq', amt, false);
          return r;
        }
      } catch (e) { }
      return { ok: false };
    },

    renderPanel(b, re) {
      if (!b) return;
      const G = (typeof Game !== 'undefined' && Game) ? Game.G : null;
      if (!G) {
        b.innerHTML = '<p class="hint">无存档</p>';
        return;
      }
      if (A.off) {
        b.innerHTML = '<p class="hint">' + TEXT_AUC48.ui.empty + '</p>';
        b.onclick = null;
        return;
      }
      const S = this.ensure(G);
      const open = this.seasonOpen(G);
      const yr = G.year | 0;
      const nextLeft = Math.max(0, (S.nextY | 0) - yr);
      const od = overdue(G);
      let html = '<div class="auc48">';
      html += '<b>' + TEXT_AUC48.ui.sec + '</b>';
      if (!open) {
        html += '<p class="hint">' + TEXT_AUC48.ui.empty + '</p>';
        html += '<p class="hint">' + fmt(TEXT_AUC48.ui.next, { n: nextLeft || A.GAP, gap: A.GAP }) + '</p>';
        html += '<p class="hint">' + TEXT_AUC48.ui.legacy_hint + '</p>';
      } else {
        html += '<p class="hint">' + fmt(TEXT_AUC48.ui.season, { y: S.yOpen | 0 }) + '<br>';
        html += fmt(TEXT_AUC48.ui.open_now, { n: S.lots.filter(l => !l.done).length, cap: S.lots.length }) + '<br>';
        html += fmt(TEXT_AUC48.ui.stone, { s: G.stone | 0 }) + '　';
        html += (S.feePaid ? '入场笺已付' : fmt(TEXT_AUC48.ui.fee, { f: A.FEE })) + '</p>';
        html += '<p class="hint">本年 举牌 ' + (S.nBid | 0) + '/' + A.BID_CAP
          + '　寄拍 ' + (S.nCon | 0) + '/' + A.CON_CAP
          + '　赌货 ' + (S.nLeak | 0) + '/' + A.LEAK_CAP + '</p>';
        if (od) html += '<p class="hint" style="color:#f66">' + TEXT_AUC48.ui.od_warn + '</p>';
        html += '<h4>本场拍品</h4>';
        for (const lot of S.lots) {
          const nm = itemName(lot.item);
          const done = lot.done ? (lot.won ? '（成交）' : '（落槌）') : '';
          html += '<div class="it"><div><b>' + nm + '</b>' + done
            + '<small>估价 ' + (lot.base | 0) + '　当前 ' + (lot.cur | 0)
            + '　对手：' + (lot.rival || '?') + '</small></div>';
          if (!lot.done) {
            html += '<button class="sm" data-a48="bid:' + lot.id + '">' + TEXT_AUC48.ui.bid_btn + '</button>';
          }
          html += '</div>';
        }
        html += '<div class="auc48r">';
        html += '<button class="opt" data-a48="consign">' + TEXT_AUC48.ui.consign_btn + '</button>';
        if (S.leak && !S.leak.opened) {
          html += '<button class="opt" data-a48="leak">' + TEXT_AUC48.ui.leak_btn + '</button>';
        }
        if (hasLoan()) {
          html += '<button class="opt" data-a48="loan">' + TEXT_AUC48.ui.loan_btn + '</button>';
        }
        html += '</div>';
        html += '<p class="hint">' + TEXT_AUC48.ui.hint + '</p>';
      }
      // 天道彩蛋一行
      const tip = TEXT_AUC48.tiandao[rollIndex(TEXT_AUC48.tiandao.length)];
      html += '<p class="hint">' + tip + '</p>';
      html += '</div>';
      b.innerHTML = html;
      // 关键不叠加：赋值覆盖
      b.onclick = async (e) => {
        const t = e && e.target;
        let a = t && t.getAttribute && t.getAttribute('data-a48');
        if (!a && t && t.dataset) a = t.dataset.a48;
        if (!a) {
          // bubble from child
          let n = t;
          while (n && n !== b) {
            a = (n.getAttribute && n.getAttribute('data-a48')) || (n.dataset && n.dataset.a48);
            if (a) break;
            n = n.parentNode;
          }
        }
        if (!a) return;
        try { if (e && e.stopPropagation) e.stopPropagation(); } catch (err) { }
        const g = Game && Game.G;
        if (!g) return;
        if (a.indexOf('bid:') === 0) {
          await API.bid(g, a.slice(4));
        } else if (a === 'consign') {
          await API.consign(g);
        } else if (a === 'leak') {
          await API.leak(g);
        } else if (a === 'loan') {
          API.askLoan(g);
        }
        try { if (typeof re === 'function') re(); else API.renderPanel(b, re); } catch (err) { }
      };
    },

    wire() {
      if (A._wired) {
        // 仍允许补 Dev / 面板（幂等旗在各包装上）
      }
      A._wired = true;
      this._css();
      this._dev();

      // UI.titles / p_auc48
      try {
        if (typeof UI !== 'undefined') {
          if (!UI.titles) UI.titles = {};
          UI.titles.auc48 = TEXT_AUC48.ui.sec;
          if (!UI.p_auc48 || !UI.p_auc48._auc48) {
            UI.p_auc48 = function (b, re) { API.renderPanel(b, re); };
            UI.p_auc48._auc48 = 1;
          }
        }
      } catch (e) { }

      // 可选：包浅拍面板顶部链
      try {
        if (typeof UI !== 'undefined' && UI.p_auction && !UI.p_auction._auc48) {
          const _pa = UI.p_auction;
          UI.p_auction = function (b, re) {
            _pa.apply(this, arguments);
            try {
              if (A.off || !b) return;
              const row = (typeof document !== 'undefined' && document.createElement)
                ? document.createElement('button') : null;
              if (row) {
                row.className = 'opt';
                row.textContent = TEXT_AUC48.ui.legacy_go;
                row.onclick = async () => { await API.openPanel(); };
                if (b.insertBefore && b.firstChild) b.insertBefore(row, b.firstChild);
                else if (b.appendChild) b.appendChild(row);
              } else {
                // jsdom-less：prepend via innerHTML 不安全；跳过
              }
            } catch (e2) { }
          };
          UI.p_auction._auc48 = 1;
          keepFnMarks(_pa, UI.p_auction, '_auc48');
        }
      } catch (e) { }

      // Talk.extra → merchant / suanpan
      try {
        if (typeof Talk !== 'undefined' && Talk.extra && !Talk.extra._auc48) {
          const _ex = Talk.extra;
          Talk.extra = function (id) {
            const out = [];
            try {
              const prev = _ex ? _ex.apply(this, arguments) : [];
              if (Array.isArray(prev) && prev.length) out.push.apply(out, prev);
            } catch (e) { }
            try {
              if (A.off) return out;
              if (id === 'merchant' || id === 'suanpan') {
                out.push([TEXT_AUC48.ui.entry_talk, async () => { await API.openPanel(); }]);
              }
            } catch (e) { console.warn('[auc48] Talk.extra', e); }
            return out;
          };
          Talk.extra._auc48 = 1;
          keepFnMarks(_ex, Talk.extra, '_auc48');
        }
      } catch (e) { }

      // Game.yearEnd
      try {
        if (typeof Game !== 'undefined' && Game.yearEnd && !Game.yearEnd._auc48) {
          const _ye = Game.yearEnd;
          Game.yearEnd = async function () {
            const r = await _ye.apply(this, arguments);
            try {
              if (!A.off && this.G) await API.yearTick(this.G);
            } catch (e) { console.warn('[auc48] yearEnd', e); }
            return r;
          };
          Game.yearEnd._auc48 = 1;
          keepFnMarks(_ye, Game.yearEnd, '_auc48');
        }
      } catch (e) { }

      // Game.enterMap → market/longgong/guishi 复牌 / 开拍
      try {
        if (typeof Game !== 'undefined' && Game.enterMap && !Game.enterMap._auc48) {
          const _em = Game.enterMap;
          Game.enterMap = async function (id) {
            const r = await _em.apply(this, arguments);
            try {
              if (!A.off && this.G) {
                const S = API.ensure(this.G);
                if (S && S.pend && API.canPopup()) {
                  await API.restorePend(this.G);
                } else if (id === 'market' || id === 'longgong' || id === 'guishi') {
                  const yr = this.G.year | 0;
                  if (yr >= (S.nextY | 0) && !(S.yOpen === yr && S.lots && S.lots.length) && API.canPopup()) {
                    await API.openDrum(this.G);
                  }
                }
              }
            } catch (e) { console.warn('[auc48] enterMap', e); }
            return r;
          };
          Game.enterMap._auc48 = 1;
          keepFnMarks(_em, Game.enterMap, '_auc48');
        }
      } catch (e) { }

      // Game.newLife → 清本世；meta 保留
      try {
        if (typeof Game !== 'undefined' && Game.newLife && !Game.newLife._auc48) {
          const _nl = Game.newLife;
          Game.newLife = function (cfg) {
            const r = _nl.apply(this, arguments);
            try {
              if (this.G) API.clear(this.G);
            } catch (e) { }
            return r;
          };
          Game.newLife._auc48 = 1;
          keepFnMarks(_nl, Game.newLife, '_auc48');
        }
      } catch (e) { }

      return true;
    },

    _css() {
      if (typeof document === 'undefined' || !document.head) return;
      if (document.getElementById('auc48css')) return;
      const css = document.createElement('style');
      css.id = 'auc48css';
      css.textContent = `.auc48{margin-top:8px;padding:10px;border-radius:10px;background:rgba(255,210,58,.08);border:1px solid rgba(255,210,58,.35)}.auc48>b{display:block;font-size:16px;color:#ffd23a}.auc48 p{margin:4px 0}.auc48r{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}`;
      document.head.appendChild(css);
    },

    _dev() {
      if (typeof W === 'undefined' || !W.DevPanel || typeof DevPanel.registerTab !== 'function') return;
      if (DevPanel._auc48) return;
      DevPanel._auc48 = 1;
      DevPanel.registerTab('auc48', (TEXT_AUC48.dev && TEXT_AUC48.dev.tab) || '拍卖48', (box, ctx) => {
        const G = Game && Game.G;
        const S = G && G.auc48;
        const m = Game && Game.meta && Game.meta.auc48;
        const st = S
          ? `yOpen=${S.yOpen} nextY=${S.nextY} nBid=${S.nBid} nCon=${S.nCon} nLeak=${S.nLeak} pend=${S.pend ? S.pend.kind : '-'} lots=${(S.lots && S.lots.length) || 0}`
          : '无档';
        const mt = m ? `totDeal=${m.totDeal} totLeakGood=${m.totLeakGood} totCon=${m.totCon}` : '';
        box.innerHTML = `<p class="hint">${(TEXT_AUC48.dev && TEXT_AUC48.dev.hint) || ''}</p>`
          + `<p class="hint">${st}<br>${mt}<br>off=${A.off}</p>`
          + [
            ['open', '强制开拍'], ['cap0', '清空年帽'], ['stone', '补灵石+50000'],
            ['win', '模拟举牌胜'], ['pass', '模拟流拍'],
            ['lg', '打开赌货 good'], ['lb', '打开赌货 bad'],
            ['od', '挂逾期小贷'], ['pend', '清 pend'], ['off', '开关 off']
          ].map(([k, n]) => `<button class="opt" data-x="${k}">${n}</button>`).join('');
        box.onclick = async (e) => {
          const x = e.target && e.target.dataset && e.target.dataset.x;
          if (!x || !Game || !Game.G) return;
          const g = Game.G;
          if (x === 'open') {
            await API.openDrum(g, { force: true });
            ctx.toast && ctx.toast('强制开拍');
          }
          if (x === 'cap0') {
            const s = API.ensure(g);
            if (s) { s.nBid = 0; s.nCon = 0; s.nLeak = 0; }
          }
          if (x === 'stone') { g.stone = (g.stone | 0) + 50000; }
          if (x === 'win') {
            const s = API.ensure(g);
            if (!API.seasonOpen(g)) await API.tryOpen(g, { force: true });
            const lot = (s.lots || []).find(l => !l.done);
            if (lot) await API.bid(g, lot.id, { force: true, choice: 0, skipCap: true });
          }
          if (x === 'pass') {
            const s = API.ensure(g);
            if (!API.seasonOpen(g)) await API.tryOpen(g, { force: true });
            await API.consign(g, { force: true, forceSold: false, itemId: Object.keys(g.inv || {}).find(k => (g.inv[k] | 0) > 0 && ITEMS[k] && ITEMS[k].p > 0) || 'herb', skipCap: true });
          }
          if (x === 'lg') {
            if (!API.seasonOpen(g)) await API.tryOpen(g, { force: true });
            const s = API.ensure(g);
            if (s.leak) s.leak.opened = 0;
            g.stone = Math.max(g.stone | 0, (s.leak && s.leak.price) | 0);
            await API.leak(g, { force: true, forceTier: 'good', choice: 0, skipCap: true });
          }
          if (x === 'lb') {
            if (!API.seasonOpen(g)) await API.tryOpen(g, { force: true });
            const s = API.ensure(g);
            if (s.leak) s.leak.opened = 0;
            g.stone = Math.max(g.stone | 0, (s.leak && s.leak.price) | 0);
            await API.leak(g, { force: true, forceTier: 'bad', choice: 0, skipCap: true });
          }
          if (x === 'od') {
            try {
              if (hasLoan()) {
                // 尽量借一笔再人工标逾期（不改公式：若有公开 API 更好；否则写 od 旗仅 Dev）
                const gate = Loan42.canBorrow('fq', g);
                if (gate && gate.ok) Loan42.borrow(g, 'fq', Math.min(200, gate.max | 0), false);
                const S2 = g.loan42;
                if (S2 && S2.L && S2.L[0]) { S2.L[0].od = 1; S2.L[0].due = S2.L[0].due || 100; }
                ctx.toast && ctx.toast('已挂逾期（Dev）');
              } else ctx.toast && ctx.toast('无 Loan42');
            } catch (err) { }
          }
          if (x === 'pend') { const s = API.ensure(g); if (s) delete s.pend; }
          if (x === 'off') { A.off = !A.off; ctx.toast && ctx.toast(A.off ? TEXT_AUC48.toast.off : '拍卖48 已开启'); }
          ctx.save && ctx.save();
        };
      });
    }
  };

  W.TEXT_AUC48 = TEXT_AUC48;

  try { API.wire(); } catch (e) { console.warn('[auc48]', e); }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => { try { A._wired = false; API.wire(); } catch (e) { } });
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

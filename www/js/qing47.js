// ======================= 3.9.7 道侣线深化 qing47（规格 docs/research_v22.md §21） =======================
// 情缘循环：叙旧 / 并肩吐纳 / 心结 / 共同历劫 / 离别·回归；反刷年帽+AP+CD。
// 不改 game.js/talk.js/data.js/ui.js；不升 G.v；Game.roll；守 storyBlock/B.on/UI.modal；keepFnMarks。
// 加载：index 在 memory45/sweep44(_ui) 之后、audio32 之前（无 shi46 时接 sweep44_ui）。
'use strict';
(function (W) {
  const TEXT_QING47 = {"meta":{"id":"TEXT_QING47","ver":"3.9.7","module":"qing47.js","title":"道侣线深化·情缘循环","basedOn":["research_v22.md§20","fam37.spouse","events21.v_p_*","dongfu43.spouse","memory45.dao","items40.yuelao"]},"ui":{"sec":"情缘 · 道侣","bond":"情缘 {b}/100","knot":"心结 {k}/3","years":"结侣第 {n} 年","ev_btn":"💗 叙旧（1 行动力）","dx_btn":"☯ 并肩吐纳（1 行动力）","knot_btn":"⚡ 解开心结","away_btn":"🌙 打听行踪","ev_cap":"本年叙旧已满（{n}/{cap}）","dx_cap":"本年双修已满（{n}/{cap}）","dx_lock":"心结太重，吐纳乱了。先解开再并肩。","noap":"行动力不够。谈情也要花一季光阴。","away":"【{n}】云游中（自第 {y} 年）。双修与叙旧暂不可用。","empty":"尚未结为道侣。伙伴面板好感满、或门下家族求亲成功后，情缘线才会展开。","hint":"情缘值与好感分开计；旧年事卡仍可能出现，不冲突。"},"ev":{"title":"情缘·{name}","pool":[{"id":"tea","ask":"{n}斟了桃花酿：「还打算把天道电话拉黑吗？」","opts":[{"l":"拉黑，然后陪你看月","bond":6,"aff":2,"r":"{n}笑了。月色好，账单在抽屉里睡觉。"},{"l":"回一封「下个月一定」","bond":3,"r":"{n}摇头：「你啊。」却把杯子添满。"},{"l":"把话题转到利息表","bond":-2,"r":"气氛冷了半寸。酒还是甜的。"}]},{"id":"market","ask":"坊市口，{n}盯着同心结：「……我们要不要也买？」","opts":[{"l":"买，挂洞府梁上","bond":7,"stone":-50,"r":"梁上多了个结。讨债小鬼打了个喷嚏。"},{"l":"手已经够了","bond":5,"r":"{n}耳尖红了：「油嘴。」"},{"l":"太贵了","bond":-3,"r":"{n}自己买了个便宜的，没给你看。"}]},{"id":"letter","ask":"枕下纸条，字迹是{n}的：「今晚后山，有话讲。」","opts":[{"l":"准时去","bond":8,"r":"后山风大。{n}只说：「我在。」"},{"l":"闭关忘了","bond":-6,"knot":1,"r":"纸条粘在门上，多了一笔：「下次。」"},{"l":"回条：债催完就来","bond":2,"r":"{n}回：「那你快点。」"}]},{"id":"debtjoke","ask":"{n}推来纸鹤：「哪句骂天道比较文雅？」","opts":[{"l":"一起改诗","bond":6,"r":"改到天亮。最文雅的一句仍被退回。"},{"l":"劝别寄","bond":3,"r":"纸鹤最终寄给了月老。"},{"l":"署名写成讨债司","bond":-4,"karma":-2,"r":"翌日约谈函。情缘−。"}]},{"id":"cook","ask":"{n}围围裙：「今日下厨。你负责——不许还债。」","opts":[{"l":"老实切菜","bond":7,"r":"菜焦了一点。两人吃光了。"},{"l":"偷看利息表","bond":-5,"r":"勺子敲了你手背。"},{"l":"债单叠纸花摆盘","bond":4,"r":"{n}又好气又好笑。"}]},{"id":"rain","ask":"暴雨困破庙。{n}披来外裳：「修仙也会打喷嚏。」","opts":[{"l":"靠着坐到雨停","bond":8,"r":"雷声里谁也没提欠款。"},{"l":"运功分他/她一点","bond":5,"r":"两人干干的。雨还在下。"},{"l":"担心洞府漏雨先赶回去","bond":-3,"r":"{n}跟着跑，一路没说话。"}]},{"id":"gift","ask":"生辰将至。{n}说「随便」，眼睛却在看暖玉。","opts":[{"l":"买下暖玉","bond":9,"stone":-120,"r":"{n}握着暖玉，半天：「……谢。」"},{"l":"手写欠条当礼物（玩笑）","bond":-8,"knot":1,"r":"那一夜洞府特别安静。"},{"l":"炼一颗普通培元丹","bond":6,"r":"丹相平平，{n}收得像仙品。"}]},{"id":"spar","ask":"{n}提剑：「比划？输的人今年洗碗。」","opts":[{"l":"认真比","bond":5,"r":"平手。碗轮着洗。"},{"l":"故意输","bond":4,"r":"{n}看穿了，罚你洗一个月。"},{"l":"改比谁算账快","bond":3,"r":"你赢了。{n}说这不算。"}]}]},"dx":{"title":"并肩吐纳","ask":"你与【{n}】对坐，周天缓缓相合。\n（本年 {nDx}/{cap} · 心结降低成功率）","opt_ok":"运转周天","opt_cancel":"改日","ok":"灵息相交。修为松动一寸，情缘亦然。\n情缘 +{b}","fail":"气息岔了一下。{n}按住你手：「别急。」\n情缘 −{b}","toast_ok":"双修吐纳顺利。","toast_fail":"吐纳未成，未损根本。"},"knot":{"ask_title":"心结","ask":"{n}把茶杯放重了：「你是不是把我排在利息后面了？」","opt_sorry":"认错，今晚陪你（情缘+6）","opt_reason":"讲道理：修仙不能误（情缘−4，心结+1）","opt_cold":"先闭关，改日说（心结+1）","heal_ask":"你想试着解开与【{n}】的心结。","heal_ok":"话虽笨，但送到了。心结 −1，情缘 +4。","heal_fail":"{n}听完：「我知道了。」心结仍在。","toast_up":"你们之间多了一层未说完的话。","full":"心结已满。吐纳之门暂时关上。"},"jie":{"title":"共同历劫","ask":"天劫将至。你望向【{n}】：「要不要一起扛一下气氛？」","opt_yes":"请他/她在阵外护持","opt_no":"独自渡（不影响数值）","ok":"{n}在雷云下撑着破伞——伞是假的，人是真的。情缘 +10。","fail":"护持晚了半步。劫过了，伞湿了。","toast":"有人愿意站在雷边，比多一颗破境丹难得。"},"away":{"title":"小别离","ask":"【{n}】收拾包袱：「我想出去走走。不是散伙——是透透气。」","opt_stay":"挽留（认错，情缘+8）","opt_stone":"塞盘缠请留（灵石−200）","opt_let":"尊重，等你回来","gone":"{n}出了洞府。纸条：「账还是你的，心……你看着办。」","stayed":"{n}放下包袱：「……再给你一次机会。」","cd":"才别不久，再提云游太伤。"},"back":{"title":"回归","ask":"门外熟悉脚步。【{n}】风尘仆仆：「欠债人还在不在？」","opt_hug":"迎上去","opt_tea":"先沏茶，再说话","opt_cool":"淡淡点头","ok":"包袱落地。云游结束。情缘 +15，心结缓和。","fail":"{n}看了你一眼：「再过一阵。」茶还热。","toast":"道侣归家。梁上同心结晃了晃。"},"year":{"anniv_title":"结缘周年","anniv":"与【{n}】结侣第 {n} 年。天道没贺电，月老打了个喷嚏。","anniv_opt":"简单纪念一下","anniv_done":"点了一盏灯。债单在抽屉，灯在桌上。"},"tiandao":["天道备注：道侣联名担保持续生效。离婚不自动销账。","月老：红线不是网线，通话记录我这儿有备份。","讨债司家事科：恭喜周年。附件：夫妻共同债务告知书。","纸鹤：「双修顺利。利息照旧。」","孟婆：忘不掉的人，汤也救不了。记在情缘簿上吧。"],"dev":{"tab":"道侣47","hint":"情缘循环（G.qing47）。仅开发者模式。"},"toast":{"off":"道侣47 已关闭（QING47.off）。","need":"需要道侣才能展开情缘。","blocked":"此刻不宜谈情（序章/战斗/教程中）。","stone":"灵石不足，盘缠不够，这次留不下他/她。"}};

  // 校验：模块加载时 JSON 往返必须通过
  try { JSON.parse(JSON.stringify(TEXT_QING47)); } catch (e) { console.warn('[qing47] TEXT invalid', e); }

  const Q = W.QING47 = {
    off: false,
    EV_CAP: 2,
    DX_CAP: 2,
    DX_AP: 1,
    EV_AP: 1,
    DX_OK: 0.75,
    KNOT_P: 0.22,
    JIE_P: 0.18,
    AWAY_P: 0.08,
    BACK_P: 0.4,
    AWAY_CD: 5,
    BOND_DX: 8,
    BOND_EV: 5,
    AFF_YCAP: 12,
    TEXT: TEXT_QING47,
    _wired: false
  };

  function fmt(s, vars) {
    let t = String(s == null ? '' : s);
    if (!vars) return t;
    for (const k of Object.keys(vars)) {
      const re = new RegExp('\\{' + k + '\\}', 'g');
      t = t.replace(re, String(vars[k]));
    }
    return t;
  }

  function npcName(id) {
    try {
      if (typeof NPCS !== 'undefined' && NPCS[id] && NPCS[id].n) return NPCS[id].n;
    } catch (e) { }
    return id || '道侣';
  }

  function porOf(id) {
    try {
      if (typeof NPCS !== 'undefined' && NPCS[id] && NPCS[id].por) return NPCS[id].por;
    } catch (e) { }
    return 'npc_girl';
  }

  function roll(p, kind) {
    try {
      if (typeof Game !== 'undefined' && Game.roll) return !!Game.roll(p, kind || 'qiyu');
    } catch (e) { }
    return Math.random() < p;
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

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v | 0));
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

  function spouseId(G) {
    if (!G) return null;
    if (G.partner) return G.partner;
    try {
      if (G.fam37 && G.fam37.sp) return G.fam37.sp;
    } catch (e) { }
    return null;
  }

  function ensureMeta() {
    try {
      if (typeof Game === 'undefined') return null;
      if (!Game.meta) Game.meta = {};
      const m = Game.meta.qing47 = Game.meta.qing47 || {};
      if (m.totDx == null) m.totDx = 0;
      if (m.totJie == null) m.totJie = 0;
      if (m.totBack == null) m.totBack = 0;
      if (m.totKnot == null) m.totKnot = 0;
      return m;
    } catch (e) { return null; }
  }

  const API = W.Qing47 = {
    TEXT: TEXT_QING47,

    /** 惰性建档；无配偶不建；id 变则 reset；跨年计数清零。容忍 G==null。 */
    ensure(G) {
      if (!G) return null;
      const sp = spouseId(G);
      if (!sp) {
        // 无配偶但已有档：若外部离婚，清掉
        if (G.qing47 && G.qing47.id) {
          // 保留结构但清空业务字段，便于测试「清档」
          this.clear(G);
        }
        return null;
      }
      let S = G.qing47;
      if (!S || typeof S !== 'object') S = G.qing47 = {};
      if (S.v == null) S.v = 1;
      // 配偶变更 → reset
      if (S.id && S.id !== sp) {
        S.id = sp;
        S.y0 = G.year || 1;
        S.bond = 40;
        S.knot = 0;
        S.away = 0;
        S.nEv = 0; S.nDx = 0; S.nJie = 0; S.nKnot = 0; S.nHeal = 0;
        S.affY = 0;
        S.lastAwayY = 0;
        S.pend = null;
        S.offHint = 0;
        S._annivY = 0; // 3.9.11 M7：配偶变更清周年标记，新道侣当年可纪念
      }
      if (!S.id) {
        S.id = sp;
        if (!S.y0) S.y0 = G.year || 1;
        if (S.bond == null) S.bond = 40;
        if (S.knot == null) S.knot = 0;
        if (S.away == null) S.away = 0;
        if (S.nEv == null) S.nEv = 0;
        if (S.nDx == null) S.nDx = 0;
        if (S.nJie == null) S.nJie = 0;
        if (S.nKnot == null) S.nKnot = 0;
        if (S.nHeal == null) S.nHeal = 0;
        if (S.affY == null) S.affY = 0;
        if (S.lastAwayY == null) S.lastAwayY = 0;
        if (S.pend == null) S.pend = null;
        if (S.offHint == null) S.offHint = 0;
        if (S.y == null) S.y = G.year || 0;
      }
      // 缺键补默认
      if (S.bond == null) S.bond = 40;
      if (S.knot == null) S.knot = 0;
      if (S.away == null) S.away = 0;
      if (S.nEv == null) S.nEv = 0;
      if (S.nDx == null) S.nDx = 0;
      if (S.nJie == null) S.nJie = 0;
      if (S.nKnot == null) S.nKnot = 0;
      if (S.nHeal == null) S.nHeal = 0;
      if (S.affY == null) S.affY = 0;
      if (S.lastAwayY == null) S.lastAwayY = 0;
      if (S.y0 == null) S.y0 = G.year || 1;
      // 跨年归零
      const y = G.year || 0;
      if (S.y !== y) {
        S.y = y;
        S.nEv = 0; S.nDx = 0; S.nJie = 0; S.nKnot = 0; S.nHeal = 0; S.affY = 0;
      }
      ensureMeta();
      return S;
    },

    clear(G) {
      if (!G) return;
      G.qing47 = {
        v: 1, id: null, y0: 0, bond: 40, knot: 0, away: 0,
        y: G.year || 0, nEv: 0, nDx: 0, nJie: 0, nKnot: 0, nHeal: 0, affY: 0,
        lastAwayY: 0, pend: null, offHint: 0, _annivY: 0 // 3.9.11 M7：与 reset 分支一致
      };
      // 3.9.11 M7：清档/离婚同时清历劫标记，新档不再误触发
      try { G._qing47Jie = 0; } catch (e) { }
    },

    storyBlock() {
      try {
        if (typeof NPC37 !== 'undefined' && NPC37 && typeof NPC37.storyBlock === 'function') {
          const r = NPC37.storyBlock();
          if (r) return r;
        }
      } catch (e) { }
      try { if (typeof B !== 'undefined' && B && B.on) return 'battle'; } catch (e) { }
      return null;
    },

    canPopup() {
      if (Q.off) return false;
      try {
        if (typeof Game === 'undefined' || !Game.G) return false;
        const G = Game.G;
        const S = G.qing47;
        if (!spouseId(G) && !(S && S.id)) return false;
      } catch (e) { return false; }
      if (this.storyBlock()) return false;
      try { if (typeof UI !== 'undefined' && UI.modal) return false; } catch (e) { }
      return true;
    },

    isAway(S) { return !!(S && S.away > 0); },

    yearsTogether(G, S) {
      if (!G || !S || !S.y0) return 0;
      return Math.max(1, (G.year || 1) - S.y0 + 1);
    },

    addBond(S, d) {
      if (!S) return;
      S.bond = clamp((S.bond || 0) + (d | 0), 0, 100);
    },

    addAff(G, id, d) {
      if (!G || !id || !d) return 0;
      const S = G.qing47;
      if (!S) return 0;
      let add = d | 0;
      if (add > 0) {
        const room = Math.max(0, Q.AFF_YCAP - (S.affY || 0));
        add = Math.min(add, room);
        if (add <= 0) return 0;
        S.affY = (S.affY || 0) + add;
      }
      if (!G.aff) G.aff = {};
      G.aff[id] = (G.aff[id] || 0) + add;
      try {
        if (typeof Life34 !== 'undefined' && Life34.rel) Life34.rel(id, add > 0 ? Math.min(2, add) : add);
      } catch (e) { }
      return add;
    },

    spendAP(n) {
      n = n || 1;
      try {
        if (typeof Game !== 'undefined' && Game.useAP) return !!Game.useAP(n);
      } catch (e) { }
      try {
        const G = Game && Game.G;
        if (!G) return false;
        if ((G.ap || 0) < n) { toast(TEXT_QING47.ui.noap); return false; }
        G.ap -= n;
        try { if (typeof UI !== 'undefined' && UI.hud) UI.hud(); } catch (e2) { }
        return true;
      } catch (e) { return false; }
    },

    /** 叙旧：同席、nEv<cap、AP、canPopup */
    async doEv(opts) {
      opts = opts || {};
      if (Q.off) { toast(TEXT_QING47.toast.off); return { ok: false, reason: 'off' }; }
      const G = (typeof Game !== 'undefined') ? Game.G : null;
      if (!G) return { ok: false, reason: 'nog' };
      const S = this.ensure(G);
      if (!S || !S.id) { toast(TEXT_QING47.toast.need); return { ok: false, reason: 'need' }; }
      if (this.isAway(S)) { toast(fmt(TEXT_QING47.ui.away, { n: npcName(S.id), y: S.away })); return { ok: false, reason: 'away' }; }
      if ((S.nEv || 0) >= Q.EV_CAP) {
        toast(fmt(TEXT_QING47.ui.ev_cap, { n: S.nEv, cap: Q.EV_CAP }));
        return { ok: false, reason: 'cap' };
      }
      if (!opts.force && !this.canPopup()) {
        S.pend = 'year';
        toast(TEXT_QING47.toast.blocked);
        return { ok: false, reason: 'block' };
      }
      const pool = (TEXT_QING47.ev && TEXT_QING47.ev.pool) || [];
      if (!pool.length) return { ok: false, reason: 'empty' };
      const ei = opts.evIndex != null ? (opts.evIndex % pool.length) : rollIndex(pool.length);
      const ev = pool[ei];
      const n = npcName(S.id);
      const ask = fmt(ev.ask, { n: n, name: n });
      const labels = (ev.opts || []).map(o => o.l);
      // 3.9.11 L2：下标校验在计次/扣 AP 之前；显式 choice 先验，卡片返回后复验（含关闭 -1）
      if (opts.choice != null && (!Number.isInteger(opts.choice) || opts.choice < 0 || opts.choice >= labels.length)) {
        return { ok: false, reason: 'choice' };
      }
      let choice = opts.choice;
      if (choice == null) {
        try {
          if (typeof UI !== 'undefined' && UI.card) {
            choice = await UI.card(fmt(TEXT_QING47.ev.title, { name: n }), ask, porOf(S.id), labels);
          } else choice = 0;
        } catch (e) { choice = 0; }
      }
      if (!Number.isInteger(choice) || choice < 0 || choice >= labels.length) {
        return { ok: false, reason: 'choice' };
      }
      // AP 在确认合法选项后才扣（与 doDx 对齐；旧流程先扣 AP 再弹卡）
      if (!opts.skipAp && !this.spendAP(Q.EV_AP)) return { ok: false, reason: 'ap' };
      const opt = ev.opts[choice];
      this.applyEvOpt(G, S, opt);
      S.nEv = (S.nEv || 0) + 1;
      try { if (typeof Game !== 'undefined' && Game.save) Game.save(); } catch (e) { }
      if (!opts.silent) {
        try {
          if (typeof UI !== 'undefined' && UI.card) {
            await UI.card(fmt(TEXT_QING47.ev.title, { name: n }), fmt(opt.r, { n: n }), porOf(S.id), ['好']);
          }
        } catch (e) { }
      }
      return { ok: true, ev: ev.id, choice: choice, bond: S.bond, nEv: S.nEv };
    },

    applyEvOpt(G, S, opt) {
      if (!opt) return;
      if (opt.bond) this.addBond(S, opt.bond);
      if (opt.aff) this.addAff(G, S.id, opt.aff);
      if (opt.knot) {
        S.knot = clamp((S.knot || 0) + (opt.knot | 0), 0, 3);
        const m = ensureMeta(); if (m) m.totKnot = (m.totKnot || 0) + 1;
      }
      if (opt.stone) {
        G.stone = Math.max(0, (G.stone || 0) + (opt.stone | 0));
      }
      if (opt.karma) {
        G.karma = (G.karma || 0) + (opt.karma | 0);
      }
    },

    /** 并肩吐纳（双修）；UI 名避「双修」技能撞名 */
    async doDx(opts) {
      opts = opts || {};
      if (Q.off) { toast(TEXT_QING47.toast.off); return { ok: false, reason: 'off' }; }
      const G = (typeof Game !== 'undefined') ? Game.G : null;
      if (!G) return { ok: false, reason: 'nog' };
      const S = this.ensure(G);
      if (!S || !S.id) { toast(TEXT_QING47.toast.need); return { ok: false, reason: 'need' }; }
      if (this.isAway(S)) { toast(fmt(TEXT_QING47.ui.away, { n: npcName(S.id), y: S.away })); return { ok: false, reason: 'away' }; }
      if ((S.knot || 0) >= 3) {
        toast(TEXT_QING47.ui.dx_lock);
        return { ok: false, reason: 'knot' };
      }
      if ((S.nDx || 0) >= Q.DX_CAP) {
        toast(fmt(TEXT_QING47.ui.dx_cap, { n: S.nDx, cap: Q.DX_CAP }));
        return { ok: false, reason: 'cap' };
      }
      if (!opts.force && !this.canPopup()) {
        toast(TEXT_QING47.toast.blocked);
        return { ok: false, reason: 'block' };
      }
      const n = npcName(S.id);
      let go = opts.go;
      if (go == null && !opts.silent) {
        try {
          if (typeof UI !== 'undefined' && UI.card) {
            const ask = fmt(TEXT_QING47.dx.ask, { n: n, nDx: S.nDx || 0, cap: Q.DX_CAP });
            go = await UI.card(TEXT_QING47.dx.title, ask, porOf(S.id), [TEXT_QING47.dx.opt_ok, TEXT_QING47.dx.opt_cancel]);
          } else go = 0;
        } catch (e) { go = 0; }
      }
      if (go == null) go = 0;
      if (go !== 0) return { ok: false, reason: 'cancel' };
      if (!opts.skipAp && !this.spendAP(Q.DX_AP)) return { ok: false, reason: 'ap' };
      const p = Math.max(0.05, Q.DX_OK - (S.knot || 0) * 0.12);
      let ok;
      if (opts.forceOk === true) ok = true;
      else if (opts.forceOk === false) ok = false;
      else ok = roll(p, 'qiyu');
      S.nDx = (S.nDx || 0) + 1;
      const m = ensureMeta();
      if (ok) {
        const b = Q.BOND_DX;
        this.addBond(S, b);
        try {
          if (typeof Game !== 'undefined' && Game.addExp && Game.need) {
            Game.addExp(Math.round(Game.need() * 0.02), true);
          }
        } catch (e) { }
        if (m) m.totDx = (m.totDx || 0) + 1;
        toast(TEXT_QING47.dx.toast_ok, '#9affd8');
        if (!opts.silent) {
          try {
            if (typeof UI !== 'undefined' && UI.card) {
              await UI.card(TEXT_QING47.dx.title, fmt(TEXT_QING47.dx.ok, { b: b, n: n }), porOf(S.id), ['好']);
            }
          } catch (e) { }
        }
      } else {
        this.addBond(S, -3);
        toast(TEXT_QING47.dx.toast_fail);
        if (!opts.silent) {
          try {
            if (typeof UI !== 'undefined' && UI.card) {
              await UI.card(TEXT_QING47.dx.title, fmt(TEXT_QING47.dx.fail, { b: 3, n: n }), porOf(S.id), ['好']);
            }
          } catch (e) { }
        }
      }
      try { if (typeof Game !== 'undefined' && Game.save) Game.save(); } catch (e) { }
      return { ok: true, success: !!ok, bond: S.bond, nDx: S.nDx };
    },

    /** 年终被动：心结 / 离别·回归 / 周年；可记 pend */
    async yearTick(opts) {
      opts = opts || {};
      if (Q.off) return { skipped: 'off' };
      const G = (typeof Game !== 'undefined') ? Game.G : null;
      if (!G) return { skipped: 'nog' };
      // 外部离婚
      if (!spouseId(G)) {
        if (G.qing47 && G.qing47.id) this.clear(G);
        return { skipped: 'nopartner' };
      }
      const S = this.ensure(G);
      if (!S) return { skipped: 'nodata' };
      const out = { knot: false, away: false, back: false, anniv: false, jie: false };

      // 回归尝试（已离别）
      if (this.isAway(S)) {
        const bp = Q.BACK_P + (S.bond || 0) / 200;
        const want = opts.forceBack || roll(bp, 'qiyu');
        if (want) {
          if (!this.canPopup() && !opts.force) {
            S.pend = 'back';
          } else {
            await this.doBack(Object.assign({ force: !!opts.force }, opts.backOpts || {}));
            out.back = true;
          }
        }
        try { if (typeof Game !== 'undefined' && Game.save) Game.save(); } catch (e) { }
        return out;
      }

      // 共同历劫：破境年后标记 _qing47Jie
      // 3.9.11 M6：被拦不清除 _qing47Jie，下次 yearTick 可重试（不新增 pend 消费点）
      if (G._qing47Jie && (S.bond || 0) >= 50 && (S.nJie || 0) === 0) {
        if (!this.canPopup() && !opts.force) S.pend = 'jie';
        else {
          await this.doJie(Object.assign({ force: !!opts.force }, opts.jieOpts || {}));
          out.jie = true;
          G._qing47Jie = 0;
        }
      }

      // 心结
      if ((S.nKnot || 0) === 0) {
        const kp = Q.KNOT_P + ((S.bond || 0) < 30 ? 0.1 : 0);
        if (opts.forceKnot || roll(kp, 'qiyu')) {
          if (!this.canPopup() && !opts.force) S.pend = 'knot';
          else {
            await this.doKnotAsk(Object.assign({ force: !!opts.force }, opts.knotOpts || {}));
            out.knot = true;
          }
        }
      }

      // 离别：低 bond 或高 knot + CD
      const cdOk = !(S.lastAwayY) || ((G.year || 0) - S.lastAwayY >= Q.AWAY_CD);
      if (cdOk && ((S.bond || 0) < 25 || (S.knot || 0) >= 2)) {
        if (opts.forceAway || roll(Q.AWAY_P, 'qiyu')) {
          if (!this.canPopup() && !opts.force) S.pend = null; // 离别不强制 pend
          else {
            await this.doAway(Object.assign({ force: !!opts.force }, opts.awayOpts || {}));
            out.away = true;
          }
        }
      }

      // 周年：结侣整年
      const yrs = this.yearsTogether(G, S);
      if (yrs > 1 && S.y0 && ((G.year - S.y0) % 1 === 0) && !S._annivY) {
        // 每年都可纪念；用 _annivY 防同岁重复
      }
      // 3.9.11 M6：周年先验 canPopup 再写 _annivY，被拦不写、下次可重试
      if (S.y0 && G.year > S.y0 && S._annivY !== G.year) {
        if (this.canPopup() || opts.force) {
          S._annivY = G.year;
          const n = npcName(S.id);
          try {
            if (typeof UI !== 'undefined' && UI.card && !opts.silent) {
              const c = await UI.card(TEXT_QING47.year.anniv_title,
                fmt(TEXT_QING47.year.anniv.replace(/结侣第 \{n\} 年/, '结侣第 ' + yrs + ' 年'), { n: n }),
                porOf(S.id), [TEXT_QING47.year.anniv_opt, '……']);
              if (c === 0) {
                this.addBond(S, 3);
                await UI.card(TEXT_QING47.year.anniv_title, TEXT_QING47.year.anniv_done, porOf(S.id), ['好']);
              }
            }
          } catch (e) { }
          out.anniv = true;
        } else {
          S.pend = S.pend || 'year';
        }
      }

      try { if (typeof Game !== 'undefined' && Game.save) Game.save(); } catch (e) { }
      return out;
    },

    async doKnotAsk(opts) {
      opts = opts || {};
      if (Q.off) return { ok: false, reason: 'off' }; // 3.9.11 M8：force 不绕 off
      const G = Game.G; const S = this.ensure(G);
      if (!S) return { ok: false };
      if ((S.nKnot || 0) > 0 && !opts.force) return { ok: false, reason: 'cap' };
      if (!opts.force && !this.canPopup()) return { ok: false, reason: 'block' }; // 3.9.11 L3
      const n = npcName(S.id);
      let c = opts.choice;
      if (c == null && !opts.silent) {
        try {
          c = await UI.card(TEXT_QING47.knot.ask_title, fmt(TEXT_QING47.knot.ask, { n: n }), porOf(S.id),
            [TEXT_QING47.knot.opt_sorry, TEXT_QING47.knot.opt_reason, TEXT_QING47.knot.opt_cold]);
        } catch (e) { c = 0; }
      }
      if (c == null) c = 0;
      if (!Number.isInteger(c) || c < 0 || c > 2) return { ok: false, reason: 'choice' }; // 3.9.11 L2
      S.nKnot = (S.nKnot || 0) + 1;
      if (c === 0) {
        this.addBond(S, 6);
      } else if (c === 1) {
        this.addBond(S, -4);
        S.knot = clamp((S.knot || 0) + 1, 0, 3);
        const m = ensureMeta(); if (m) m.totKnot = (m.totKnot || 0) + 1;
      } else {
        S.knot = clamp((S.knot || 0) + 1, 0, 3);
        const m = ensureMeta(); if (m) m.totKnot = (m.totKnot || 0) + 1;
      }
      if ((S.knot || 0) > 0) toast(TEXT_QING47.knot.toast_up);
      if ((S.knot || 0) >= 3) toast(TEXT_QING47.knot.full);
      return { ok: true, choice: c, knot: S.knot };
    },

    /** 主动解开；一年 1 次；roll 0.65 */
    async healKnot(opts) {
      opts = opts || {};
      if (Q.off) return { ok: false, reason: 'off' };
      const G = Game.G; const S = this.ensure(G);
      if (!S || !S.id) return { ok: false, reason: 'need' };
      if ((S.knot || 0) <= 0) return { ok: false, reason: 'none' };
      if ((S.nHeal || 0) >= 1) return { ok: false, reason: 'cap' };
      if (!opts.force && !this.canPopup()) return { ok: false, reason: 'block' };
      const n = npcName(S.id);
      if (!opts.silent) {
        try {
          if (typeof UI !== 'undefined' && UI.card) {
            await UI.card(TEXT_QING47.knot.ask_title, fmt(TEXT_QING47.knot.heal_ask, { n: n }), porOf(S.id), ['好']);
          }
        } catch (e) { }
      }
      let ok;
      if (opts.forceOk === true) ok = true;
      else if (opts.forceOk === false) ok = false;
      else ok = roll(0.65, 'qiyu');
      S.nHeal = (S.nHeal || 0) + 1;
      if (ok) {
        S.knot = clamp((S.knot || 0) - 1, 0, 3);
        this.addBond(S, 4);
        if (!opts.silent) {
          try { await UI.card(TEXT_QING47.knot.ask_title, TEXT_QING47.knot.heal_ok, porOf(S.id), ['好']); } catch (e) { }
        }
      } else {
        if (!opts.silent) {
          try { await UI.card(TEXT_QING47.knot.ask_title, fmt(TEXT_QING47.knot.heal_fail, { n: n }), porOf(S.id), ['好']); } catch (e) { }
        }
      }
      try { Game.save && Game.save(); } catch (e) { }
      return { ok: true, success: !!ok, knot: S.knot };
    },

    async doJie(opts) {
      opts = opts || {};
      if (Q.off) return { ok: false, reason: 'off' }; // 3.9.11 M8：force 不绕 off
      const G = Game.G; const S = this.ensure(G);
      if (!S) return { ok: false };
      if ((S.nJie || 0) > 0 && !opts.force) return { ok: false, reason: 'cap' };
      if ((S.bond || 0) < 50 && !opts.force) return { ok: false, reason: 'bond' };
      if (!opts.force && !this.canPopup()) return { ok: false, reason: 'block' }; // 3.9.11 L3
      const n = npcName(S.id);
      let c = opts.choice;
      if (c == null && !opts.silent) {
        try {
          c = await UI.card(TEXT_QING47.jie.title, fmt(TEXT_QING47.jie.ask, { n: n }), porOf(S.id),
            [TEXT_QING47.jie.opt_yes, TEXT_QING47.jie.opt_no]);
        } catch (e) { c = 0; }
      }
      if (c == null) c = 0;
      if (!Number.isInteger(c) || c < 0 || c > 1) return { ok: false, reason: 'choice' }; // 3.9.11 L2
      S.nJie = (S.nJie || 0) + 1;
      if (c === 0) {
        // 护持成功叙事（不改雷劫数值）；forceOk 可指定
        let ok = opts.forceOk;
        if (ok == null) ok = roll(0.85, 'qiyu');
        if (ok) {
          this.addBond(S, 10);
          const m = ensureMeta(); if (m) m.totJie = (m.totJie || 0) + 1;
          toast(TEXT_QING47.jie.toast, '#9affd8');
          if (!opts.silent) {
            try { await UI.card(TEXT_QING47.jie.title, fmt(TEXT_QING47.jie.ok, { n: n }), porOf(S.id), ['好']); } catch (e) { }
          }
          return { ok: true, success: true };
        }
        if (!opts.silent) {
          try { await UI.card(TEXT_QING47.jie.title, TEXT_QING47.jie.fail, porOf(S.id), ['好']); } catch (e) { }
        }
        return { ok: true, success: false };
      }
      return { ok: true, success: null, solo: true };
    },

    async doAway(opts) {
      opts = opts || {};
      if (Q.off) return { ok: false, reason: 'off' }; // 3.9.11 M8：force 不绕 off
      const G = Game.G; const S = this.ensure(G);
      if (!S) return { ok: false };
      if (this.isAway(S)) return { ok: false, reason: 'already' };
      const cdOk = !(S.lastAwayY) || ((G.year || 0) - S.lastAwayY >= Q.AWAY_CD);
      if (!cdOk && !opts.force) {
        toast(TEXT_QING47.away.cd);
        return { ok: false, reason: 'cd' };
      }
      const cond = (S.bond || 0) < 25 || (S.knot || 0) >= 2;
      if (!cond && !opts.force) return { ok: false, reason: 'cond' };
      if (!opts.force && !this.canPopup()) return { ok: false, reason: 'block' }; // 3.9.11 L3
      const n = npcName(S.id);
      let c = opts.choice;
      if (c == null && !opts.silent) {
        try {
          c = await UI.card(TEXT_QING47.away.title, fmt(TEXT_QING47.away.ask, { n: n }), porOf(S.id),
            [TEXT_QING47.away.opt_stay, TEXT_QING47.away.opt_stone, TEXT_QING47.away.opt_let]);
        } catch (e) { c = 2; }
      }
      if (c == null) c = 2;
      if (!Number.isInteger(c) || c < 0 || c > 2) return { ok: false, reason: 'choice' }; // 3.9.11 L2
      if (c === 0) {
        this.addBond(S, 8);
        if (!opts.silent) {
          try { await UI.card(TEXT_QING47.away.title, fmt(TEXT_QING47.away.stayed, { n: n }), porOf(S.id), ['好']); } catch (e) { }
        }
        return { ok: true, stayed: true };
      }
      if (c === 1) {
        if ((G.stone || 0) >= 200) {
          G.stone -= 200;
          this.addBond(S, 5);
          if (!opts.silent) {
            try { await UI.card(TEXT_QING47.away.title, fmt(TEXT_QING47.away.stayed, { n: n }), porOf(S.id), ['好']); } catch (e) { }
          }
          return { ok: true, stayed: true, stone: true };
        }
        // 3.9.11 M9：灵石不足不再静默放行，toast 并拒绝，不写 away
        toast(TEXT_QING47.toast.stone);
        return { ok: false, reason: 'stone' };
      }
      // 放行：away=year，不 unpartner
      S.away = G.year || 1;
      S.lastAwayY = G.year || 1;
      if (!opts.silent) {
        try { await UI.card(TEXT_QING47.away.title, fmt(TEXT_QING47.away.gone, { n: n }), porOf(S.id), ['好']); } catch (e) { }
      }
      try { Game.save && Game.save(); } catch (e) { }
      return { ok: true, stayed: false, away: S.away };
    },

    async doBack(opts) {
      opts = opts || {};
      if (Q.off) return { ok: false, reason: 'off' }; // 3.9.11 M8：force 不绕 off
      const G = Game.G; const S = this.ensure(G);
      if (!S || !this.isAway(S)) return { ok: false, reason: 'notaway' };
      if (!opts.force && !this.canPopup()) return { ok: false, reason: 'block' }; // 3.9.11 L3
      const n = npcName(S.id);
      let c = opts.choice;
      if (c == null && !opts.silent) {
        try {
          c = await UI.card(TEXT_QING47.back.title, fmt(TEXT_QING47.back.ask, { n: n }), porOf(S.id),
            [TEXT_QING47.back.opt_hug, TEXT_QING47.back.opt_tea, TEXT_QING47.back.opt_cool]);
        } catch (e) { c = 0; }
      }
      if (c == null) c = 0;
      if (!Number.isInteger(c) || c < 0 || c > 2) return { ok: false, reason: 'choice' }; // 3.9.11 L2
      // 回归成功：默认成功（已过 roll）；forceOk false 可失败
      let ok = opts.forceOk;
      if (ok == null) ok = true;
      if (!ok) {
        if (!opts.silent) {
          try { await UI.card(TEXT_QING47.back.title, fmt(TEXT_QING47.back.fail, { n: n }), porOf(S.id), ['好']); } catch (e) { }
        }
        return { ok: true, success: false };
      }
      S.away = 0;
      this.addBond(S, 15);
      if ((S.knot || 0) > 0) S.knot = clamp(S.knot - 1, 0, 3);
      if (c === 2) this.addBond(S, -2); // 淡淡点头略冷
      const m = ensureMeta(); if (m) m.totBack = (m.totBack || 0) + 1;
      toast(TEXT_QING47.back.toast, '#9affd8');
      if (!opts.silent) {
        try { await UI.card(TEXT_QING47.back.title, TEXT_QING47.back.ok, porOf(S.id), ['好']); } catch (e) { }
      }
      try { Game.save && Game.save(); } catch (e) { }
      return { ok: true, success: true, bond: S.bond };
    },

    /** 打听行踪（离别中） */
    async inquire() {
      if (Q.off) return { ok: false, reason: 'off' }; // 3.9.11 M8 补：inquire 至少加 off 检查
      const G = Game.G; const S = this.ensure(G);
      if (!S || !this.isAway(S)) return { ok: false };
      toast(fmt(TEXT_QING47.ui.away, { n: npcName(S.id), y: S.away }));
      return { ok: true };
    },

    /** 面板 HTML 片段 */
    panelHtml(G) {
      if (Q.off) return '';
      if (!G) return `<div class="qing47"><b>${TEXT_QING47.ui.sec}</b><p class="empty">${TEXT_QING47.ui.empty}</p></div>`;
      const S = this.ensure(G);
      if (!S || !S.id) {
        return `<div class="qing47"><b>${TEXT_QING47.ui.sec}</b><p class="empty">${TEXT_QING47.ui.empty}</p></div>`;
      }
      const n = npcName(S.id);
      const yrs = this.yearsTogether(G, S);
      const away = this.isAway(S);
      let btns = '';
      if (away) {
        btns = `<button class="opt" data-q47="inq">${TEXT_QING47.ui.away_btn}</button>`;
      } else {
        btns = `<button class="opt" data-q47="ev">${TEXT_QING47.ui.ev_btn}</button>`
          + `<button class="opt" data-q47="dx">${TEXT_QING47.ui.dx_btn}</button>`;
        if ((S.knot || 0) > 0) btns += `<button class="opt" data-q47="heal">${TEXT_QING47.ui.knot_btn}</button>`;
      }
      return `<div class="qing47"><b>${TEXT_QING47.ui.sec}</b>`
        + `<p>【${n}】${fmt(TEXT_QING47.ui.bond, { b: S.bond })}　${fmt(TEXT_QING47.ui.knot, { k: S.knot || 0 })}　${fmt(TEXT_QING47.ui.years, { n: yrs })}</p>`
        + `<p>本年 叙旧 ${S.nEv || 0}/${Q.EV_CAP}　双修 ${S.nDx || 0}/${Q.DX_CAP}</p>`
        + (away ? `<p class="hint">${fmt(TEXT_QING47.ui.away, { n: n, y: S.away })}</p>` : '')
        + `<div class="qing47r">${btns}</div>`
        + `<p class="hint">${TEXT_QING47.ui.hint}</p></div>`;
    },

    async onPanelClick(btn) {
      const a = btn && btn.getAttribute('data-q47');
      if (!a) return;
      if (a === 'ev') await this.doEv();
      else if (a === 'dx') await this.doDx();
      else if (a === 'heal') await this.healKnot();
      else if (a === 'inq') await this.inquire();
    },

    /** 破境成功后标记历劫机会 */
    onBreakSuccess(G) {
      if (!G || Q.off) return;
      G._qing47Jie = 1;
    },

    wire() {
      if (Q._wired) return;
      Q._wired = true;
      try { this._hookAll(); } catch (e) { console.warn('[qing47] wire', e); }
      try { this._css(); } catch (e) { }
      try { this._dev(); } catch (e) { }
    },

    _hookAll() {
      // UI.p_comps 尾部注入
      try {
        if (typeof UI !== 'undefined' && UI.p_comps && !UI.p_comps._qing47) {
          const _pc = UI.p_comps;
          UI.p_comps = function (b) {
            const r = _pc.apply(this, arguments);
            try {
              if (!Q.off && typeof Game !== 'undefined' && Game.G && b) {
                const wrap = document.createElement('div');
                wrap.innerHTML = API.panelHtml(Game.G);
                while (wrap.firstChild) b.appendChild(wrap.firstChild);
                // 3.9.11 M5：照抄 p_fam37 模式，先存 prev、非 data-q47 时委托
                const prev = b.onclick;
                b.onclick = function (e) {
                  const t = e && e.target && e.target.closest && e.target.closest('[data-q47]');
                  if (t) {
                    if (e.stopPropagation) e.stopPropagation();
                    API.onPanelClick(t).then(() => {
                      try { UI.p_comps(b); } catch (e2) { }
                    });
                    return;
                  }
                  if (typeof prev === 'function') return prev.call(this, e);
                };
              }
            } catch (e) { console.warn('[qing47] p_comps', e); }
            return r;
          };
          UI.p_comps._qing47 = 1;
          keepFnMarks(_pc, UI.p_comps, '_qing47');
        }
      } catch (e) { }

      // UI.p_fam37 尾部注入
      try {
        if (typeof UI !== 'undefined' && UI.p_fam37 && !UI.p_fam37._qing47) {
          const _pf = UI.p_fam37;
          UI.p_fam37 = function (b) {
            const r = _pf.apply(this, arguments);
            try {
              if (!Q.off && typeof Game !== 'undefined' && Game.G) {
                const html = API.panelHtml(Game.G);
                const div = document.createElement('div');
                div.innerHTML = html;
                while (div.firstChild) b.appendChild(div.firstChild);
                const prev = b.onclick;
                b.onclick = async function (e) {
                  const t = e.target.closest('[data-q47]');
                  if (t) { e.stopPropagation(); await API.onPanelClick(t); try { UI.p_fam37(b); } catch (e2) { } return; }
                  if (typeof prev === 'function') return prev.call(this, e);
                };
              }
            } catch (e) { console.warn('[qing47] p_fam37', e); }
            return r;
          };
          UI.p_fam37._qing47 = 1;
          keepFnMarks(_pf, UI.p_fam37, '_qing47');
        }
      } catch (e) { }

      // Talk.extra：对道侣加叙旧/吐纳入口
      try {
        if (typeof Talk !== 'undefined' && Talk.extra && !Talk.extra._qing47) {
          const _ex = Talk.extra;
          Talk.extra = function (id) {
            // MEDIUM fix: 上层 undefined/非数组 → 归一 []（同 shi46），避免 out.push 炸链返回 undefined
            const out = [];
            try {
              const prev = _ex ? _ex.apply(this, arguments) : [];
              if (Array.isArray(prev) && prev.length) out.push.apply(out, prev);
            } catch (e) { }
            try {
              if (Q.off) return out;
              const G = Game && Game.G;
              if (!G || !id) return out;
              const S = API.ensure(G);
              if (!S || S.id !== id) return out;
              if (API.isAway(S)) {
                out.push([TEXT_QING47.ui.away_btn, async () => { await API.inquire(); }]);
              } else {
                out.push([TEXT_QING47.ui.ev_btn, async () => { await API.doEv(); }]);
                out.push([TEXT_QING47.ui.dx_btn, async () => { await API.doDx(); }]);
                if ((S.knot || 0) > 0) out.push([TEXT_QING47.ui.knot_btn, async () => { await API.healKnot(); }]);
              }
            } catch (e) { console.warn('[qing47] Talk.extra', e); }
            return out;
          };
          Talk.extra._qing47 = 1;
          keepFnMarks(_ex, Talk.extra, '_qing47');
        }
      } catch (e) { }

      // Game.yearEnd：被动检定 + unpartner 侦测
      try {
        if (typeof Game !== 'undefined' && Game.yearEnd && !Game.yearEnd._qing47) {
          const _ye = Game.yearEnd;
          Game.yearEnd = async function () {
            const G = this.G;
            const had = G && (G.partner || (G.qing47 && G.qing47.id));
            const r = await _ye.apply(this, arguments);
            try {
              if (!Q.off && G) {
                if (had && !spouseId(G)) API.clear(G);
                else if (spouseId(G)) await API.yearTick({ silent: false });
              }
            } catch (e) { console.warn('[qing47] yearEnd', e); }
            return r;
          };
          Game.yearEnd._qing47 = 1;
          keepFnMarks(_ye, Game.yearEnd, '_qing47');
        }
      } catch (e) { }

      // Game.newLife
      try {
        if (typeof Game !== 'undefined' && Game.newLife && !Game.newLife._qing47) {
          const _nl = Game.newLife;
          Game.newLife = function (cfg) {
            const r = _nl.apply(this, arguments);
            try {
              if (this.G) {
                // 新世无道侣；清掉残留
                if (this.G.qing47) API.clear(this.G);
                this.G._qing47Jie = 0; // 3.9.11 M7：newLife 包裹显式清历劫标记
              }
            } catch (e) { }
            return r;
          };
          Game.newLife._qing47 = 1;
          keepFnMarks(_nl, Game.newLife, '_qing47');
        }
      } catch (e) { }

      // Game.tryBreak / _tryBreak：破境成功标记历劫
      try {
        if (typeof Game !== 'undefined' && Game._tryBreak && !Game._tryBreak._qing47) {
          const _tb = Game._tryBreak;
          Game._tryBreak = async function () {
            const G = this.G;
            const r0 = G && G.realm;
            const ret = await _tb.apply(this, arguments);
            try {
              if (!Q.off && G && G.realm > r0) API.onBreakSuccess(G);
            } catch (e) { }
            return ret;
          };
          Game._tryBreak._qing47 = 1;
          keepFnMarks(_tb, Game._tryBreak, '_qing47');
        }
      } catch (e) { }
    },

    _css() {
      if (typeof document === 'undefined' || !document.head) return;
      if (document.getElementById('qing47css')) return;
      const css = document.createElement('style');
      css.id = 'qing47css';
      css.textContent = `.qing47{margin-top:12px;padding:10px;border-radius:10px;background:rgba(255,160,200,.10);border:1px solid rgba(255,160,200,.4)}.qing47>b{display:block;font-size:16px;color:#ffb0d0}.qing47 p{margin:4px 0}.qing47r{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}`;
      document.head.appendChild(css);
    },

    _dev() {
      if (typeof W === 'undefined' || !W.DevPanel || typeof DevPanel.registerTab !== 'function') return;
      if (DevPanel._qing47) return;
      DevPanel._qing47 = 1;
      DevPanel.registerTab('qing47', (TEXT_QING47.dev && TEXT_QING47.dev.tab) || '道侣47', (box, ctx) => {
        const G = Game && Game.G;
        const S = G && G.qing47;
        const m = Game && Game.meta && Game.meta.qing47;
        const st = S
          ? `bond=${S.bond} knot=${S.knot} away=${S.away} nEv=${S.nEv} nDx=${S.nDx} y0=${S.y0} id=${S.id}`
          : '无档';
        const mt = m ? `totDx=${m.totDx} totJie=${m.totJie} totBack=${m.totBack} totKnot=${m.totKnot}` : '';
        box.innerHTML = `<p class="hint">${(TEXT_QING47.dev && TEXT_QING47.dev.hint) || ''}</p>`
          + `<p class="hint">${st}<br>${mt}<br>off=${Q.off}</p>`
          + [
            ['fake', '假结侣(sumei)'], ['b100', 'bond=100'], ['b10', 'bond=10'],
            ['k1', 'knot+1'], ['k0', '清心结'], ['ev', '强制情缘卡'],
            ['dxok', '双修成功'], ['dxfail', '双修失败'],
            ['jie', '强制历劫'], ['away', '强制离别'], ['back', '强制回归'],
            ['clr', '清 qing47'], ['off', '开关 off'], ['ye', '年终检定']
          ].map(([k, n]) => `<button class="opt" data-x="${k}">${n}</button>`).join('');
        box.onclick = async (e) => {
          const x = e.target && e.target.dataset && e.target.dataset.x;
          if (!x || !Game || !Game.G) return;
          const g = Game.G;
          if (x === 'fake') {
            g.partner = 'sumei'; g.aff = g.aff || {}; g.aff.sumei = 100;
            if (g.fam37) g.fam37.sp = 'sumei';
            API.ensure(g); ctx.toast('假结侣 sumei');
          }
          if (x === 'b100') { const s = API.ensure(g); if (s) s.bond = 100; }
          if (x === 'b10') { const s = API.ensure(g); if (s) s.bond = 10; }
          if (x === 'k1') { const s = API.ensure(g); if (s) s.knot = clamp((s.knot || 0) + 1, 0, 3); }
          if (x === 'k0') { const s = API.ensure(g); if (s) s.knot = 0; }
          if (x === 'ev') await API.doEv({ force: true, choice: 0 });
          if (x === 'dxok') await API.doDx({ force: true, forceOk: true, go: 0 });
          if (x === 'dxfail') await API.doDx({ force: true, forceOk: false, go: 0 });
          if (x === 'jie') { g._qing47Jie = 1; const s = API.ensure(g); if (s) { s.bond = Math.max(50, s.bond || 0); s.nJie = 0; } await API.doJie({ force: true, choice: 0, forceOk: true }); }
          if (x === 'away') { const s = API.ensure(g); if (s) { s.bond = 10; s.knot = 2; } await API.doAway({ force: true, choice: 2 }); }
          if (x === 'back') await API.doBack({ force: true, choice: 0, forceOk: true });
          if (x === 'clr') API.clear(g);
          if (x === 'off') { Q.off = !Q.off; ctx.toast(Q.off ? TEXT_QING47.toast.off : '道侣47 已开启'); }
          if (x === 'ye') await API.yearTick({ force: true });
          ctx.save && ctx.save();
        };
      });
    }
  };

  W.TEXT_QING47 = TEXT_QING47;

  // 立即 wire；DOM 就绪再补一次（DevPanel）
  try { API.wire(); } catch (e) { console.warn('[qing47]', e); }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => { try { Q._wired = false; API.wire(); } catch (e) { } });
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);

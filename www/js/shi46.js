// ======================= 3.9.6 亲传功课·出师 shi46（规格 docs/research_v22.md §20）第 1 轮 =======================
// 第 1 轮：数据 + 纯逻辑（功课/年终督导/出师/盟友回访/反刷封顶/TEXT_SHI46）。
// 第 2 轮：index 接线 + 面板区块实装页测。本轮不进 index.html。
// 存档 G.shi46 惰性；账号 Game.meta.shi46 可选统计。不升 G.v，仍走 wbx2_* / G.v===2。
// rng：Game.roll → Math.random。弹卡守 NPC37.storyBlock + B.on + UI.modal。
// LOOP：SHI46.off=true 整模块停用。不改 game/talk/data/ui/battle/main/legacy26 正文。
'use strict';
(function (W) {
  const TEXT_SHI46 = {
    "meta": {
      "id": "TEXT_SHI46",
      "ver": "3.9.6",
      "module": "shi46.js",
      "title": "亲传功课·出师",
      "basedOn": [
        "legacy26",
        "fam37.dis36",
        "pet35",
        "research_v22.md§19",
        "dongfu43"
      ]
    },
    "ui": {
      "sec": "亲传功课 · 出师",
      "mood": "心境 {m}/100",
      "lvl": "修为 {lv} 级",
      "techs": "已授功法 {n} 门",
      "hw_btn": "📜 布置功课（1 行动力）",
      "hw_busy": "本年功课已满（{n}/{cap}）",
      "hw_noap": "行动力不够。教书也要花一季光阴。",
      "grad_btn": "🎓 准许出师",
      "grad_lock": "出师需：修为≥{lv}、功法≥{tech}、心境≥{mood}、好感≥{aff}",
      "grad_done": "已出师：{n}（盟友）",
      "empty": "尚未收亲传弟子。筑基后、好感≥80 的可结交 NPC 处可收徒。",
      "ally_hint": "出师弟子偶尔回门探望；洞府弟子院仍可能看见他/她。"
    },
    "hw": {
      "title": "功课·{name}",
      "ask": "你给【{n}】布置功课：\n\n「{task}」\n\n弟子拱手领命。",
      "opt_ok": "去吧",
      "opt_cancel": "改日再说",
      "done_title": "功课回禀",
      "done_ok": "{n}回来了：\n「{line}」\n\n心境 +{mood}　修为级进度有所精进。",
      "done_fail": "{n}灰头土脸回来：\n「{line}」\n\n心境 −{mood}。你叹了口气，没有责罚。",
      "tasks": [
        "去后山捡一百片落叶，悟剑意",
        "替宗门抄三页欠条（字要端正）",
        "在坊市听一上午讨债司宣讲，回来复述",
        "闭关半日，把《基础吐纳》再走一遍",
        "给洞府灵田浇水，不许偷吃蟠桃",
        "与记名师兄切磋一局，不许动杀招",
        "去村口帮娘劈柴，体会凡人心",
        "夜观天象，画一张「今晚利息走势图」"
      ],
      "ok_lines": [
        "功课做完了。落叶我按剑痕排的。",
        "欠条抄完了。发现自己也欠三笔……",
        "宣讲很吵，但我记住了：利滚利不道德，但合法。",
        "吐纳顺了。师父，您要不要也歇歇？",
        "水浇了。蟠桃我只闻了一下。",
        "切磋赢了半招。他请我喝了半碗粥。",
        "娘说让您早点回家吃饭。",
        "利息走势图我画歪了，但心是诚的。"
      ],
      "fail_lines": [
        "落叶被风吹跑了……我追了一下午。",
        "字写成了鬼符，掌门让我重抄。",
        "听宣讲睡着了，被天兵戳醒。",
        "走火入魔了一小下，现在好了。",
        "蟠桃……好吧我吃了一口。对不起。",
        "切磋输了，膝盖还在响。",
        "劈柴劈到自己鞋上了。",
        "观星时被讨债纸鹤挡住了月亮。"
      ]
    },
    "year": {
      "ask_title": "年终课业",
      "ask": "又一年。你想怎么带【{n}】？",
      "opt_strict": "严加督导（心境−5，修为快）",
      "opt_kind": "温言鼓励（心境+8，修为正常）",
      "opt_free": "放他/她自己悟（心境+3，本年功课上限−1）",
      "toast_strict": "{n}咬牙练到深夜。",
      "toast_kind": "{n}眼睛亮了一下。",
      "toast_free": "{n}去浪了——说是体悟红尘。"
    },
    "grad": {
      "title": "出师礼",
      "ask": "【{n}】已可独当一面。\n准许出师后：亲传位空出，可再收徒；对方成为门下盟友，偶尔回访。\n\n赠礼（选一）：",
      "gift_stone": "灵石贺仪（{s}）",
      "gift_scroll": "赠残破功法×1",
      "gift_none": "只赐名号，不送礼",
      "cancel": "再留两年",
      "done": "{n}跪谢三叩：「师恩如山，账……我自己还。」\n\n你把他/她的名字从亲传册上抹去，又写进了盟友录。",
      "title_name": "门下出师·{n}",
      "meta_toast": "桃李又多一枝。讨债司发来贺电：师资培训费请在下个季度结清。"
    },
    "ally": {
      "talk": [
        "{n}远远拱手：「师父近日可好？我带了点薄礼。」",
        "{n}：「外面的债，比师门功课难多了。」",
        "{n}塞给你一包灵草：「当束脩。」",
        "{n}：「有人问起您，我说——那是会教人躲利息的真人。」"
      ],
      "opt_thank": "勉励几句",
      "opt_ask": "可愿助战一场（本年一次）",
      "opt_leave": "去忙吧",
      "gift_line": "你收下礼物。师徒二人相视一笑。",
      "fight_ok": "{n}提剑站到你身侧：「这回我罩着您。」",
      "fight_cap": "今年已助战过一次。让弟子也歇歇。",
      "visit_cap": "今年已回访过一次。让师徒都歇歇。",
      "visit_toast": "出师弟子【{n}】回门探望。"
    },
    "tiandao": [
      "天道备注：出师不等于销账。师生连带担保条款仍有效。",
      "讨债司培训科：贵门下本季度出师率高于均值，请继续欠……咳，继续培养。",
      "孟婆：出师宴的份子钱，轮回殿不收，但记账。",
      "纸鹤：「恭喜出师。附件：学费利息试算表。」"
    ],
    "dev": {
      "tab": "师徒46",
      "hint": "亲传功课/出师（G.shi46）。仅开发者模式。"
    },
    "toast": {
      "off": "师徒46 已关闭（SHI46.off）。",
      "need_ap": "需要亲传弟子才能布置功课。",
      "blocked": "此刻不宜授课（序章/战斗/教程中）。"
    }
  };

  const SHI46 = {
    off: false,
    HW_CAP: 3,
    HW_OK: 0.7,
    GRAD_LV: 8,
    GRAD_TECH: 2,
    GRAD_MOOD: 70,
    GRAD_AFF: 80,
    VISIT_P: 0.35,
    FIGHT_ONCE: 1,
    GIFT_STONE_MUL: 0.08,
    TEXT: TEXT_SHI46,
    _wired: false
  };

  // ---- helpers（闭包私有，不挂公开对象）----
  const Gm = () => {
    try { if (typeof Game !== 'undefined' && Game) return Game; } catch (e) {}
    return (W && W.Game) || null;
  };
  const getG = (G) => {
    if (G) return G;
    const g = Gm();
    return (g && g.G) || null;
  };
  const fill = (s, o) => String(s == null ? '' : s).replace(/\{(\w+)\}/g, (m, k) => (o && o[k] !== undefined ? o[k] : m));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v | 0));

  const roll = (p, kind) => {
    try {
      const g = Gm();
      if (g && typeof g.roll === 'function') return !!g.roll(p, kind || 'qiyu');
    } catch (e) {}
    return Math.random() < p;
  };

  /** 从池中均匀抽一项：优先 Game.roll 水库采样，否则 Math.random */
  const pick = (arr) => {
    if (!arr || !arr.length) return null;
    let i = 0;
    try {
      const g = Gm();
      if (g && typeof g.roll === 'function') {
        for (let k = 1; k < arr.length; k++) {
          if (g.roll(1 / (k + 1), 'qiyu')) i = k;
        }
      } else {
        i = Math.floor(Math.random() * arr.length) % arr.length;
      }
    } catch (e) {
      i = Math.floor(Math.random() * arr.length) % arr.length;
    }
    return arr[i];
  };

  /** 微抖整数：base ± amp（含端点），走 roll 二进制展开或 Math.random */
  const jitter = (base, amp) => {
    amp = amp | 0;
    if (amp <= 0) return base | 0;
    let u = 0;
    try {
      const g = Gm();
      if (g && typeof g.roll === 'function') {
        let bit = 0.5;
        for (let i = 0; i < 8; i++) {
          if (g.roll(0.5, 'qiyu')) u += bit;
          bit *= 0.5;
        }
      } else {
        u = Math.random();
      }
    } catch (e) { u = Math.random(); }
    const span = amp * 2 + 1;
    return (base | 0) - amp + Math.floor(u * span) % span;
  };

  const npcName = (id) => {
    try {
      if (typeof NPCS !== 'undefined' && NPCS[id] && NPCS[id].n) {
        const n = String(NPCS[id].n);
        const parts = n.split('·');
        return parts[parts.length - 1] || n;
      }
    } catch (e) {}
    return id || '弟子';
  };

  const toast = (msg, col) => {
    try { if (typeof UI !== 'undefined' && UI.toast) UI.toast(msg, col); } catch (e) {}
  };

  const card = async (t, x, p, o) => {
    try {
      if (typeof UI !== 'undefined' && UI.card) return await UI.card(t, x, p, o);
    } catch (e) {}
    return 0;
  };

  function keepFnMarks(src, dst, selfKey) {
    if (!src || !dst) return dst;
    try {
      for (const k of Object.keys(src)) {
        if (k.charAt(0) !== '_') continue;
        if (selfKey && k === selfKey) continue;
        try { dst[k] = src[k]; } catch (e) {}
      }
    } catch (e) {}
    return dst;
  }

  function storyBlock() {
    try {
      if (typeof NPC37 !== 'undefined' && NPC37 && typeof NPC37.storyBlock === 'function') {
        const b = NPC37.storyBlock();
        if (b) return b;
      }
    } catch (e) {}
    try {
      if (typeof B !== 'undefined' && B && B.on) return 'battle';
    } catch (e) {}
    try {
      if (typeof UI !== 'undefined' && UI && UI.modal) return 'modal';
    } catch (e) {}
    return null;
  }

  function canPopup() {
    if (SHI46.off) return false;
    try {
      const g = Gm();
      if (!g || !g.G) return false;
    } catch (e) { return false; }
    return !storyBlock();
  }

  function ensureMeta() {
    try {
      const g = Gm();
      if (!g) return null;
      if (!g.meta) g.meta = {};
      const m = g.meta.shi46 = g.meta.shi46 || {};
      if (m.v == null) m.v = 1;
      if (m.totGrad == null) m.totGrad = 0;
      if (m.totLesson == null) m.totLesson = 0;
      return m;
    } catch (e) { return null; }
  }

  function ensure(G) {
    G = getG(G);
    if (!G) return null;
    const s = G.shi46 = G.shi46 || {};
    if (s.v == null) s.v = 1;
    if (s.mood == null) s.mood = 60;
    if (s.y == null) s.y = 0;
    if (s.n == null) s.n = 0;
    if (s.lessons == null) s.lessons = 0;
    if (s.style == null) s.style = 'kind';
    if (s.freeCut == null) s.freeCut = 0;
    if (s.grad == null) s.grad = 0;
    if (s.ally === undefined) s.ally = null;
    if (s.visitY == null) s.visitY = 0;
    if (s.blockedGradHint == null) s.blockedGradHint = 0;
    if (s.pendYear == null) s.pendYear = 0;
    if (s.yearDone == null) s.yearDone = 0; // 本年是否已弹督导卡的年份标记
    if (s.freeYear == null) s.freeYear = 0; // 3.9.11 M13：放养设定的年份，仅次年减帽
    if (s._apprenticeId === undefined) s._apprenticeId = G.apprentice || null;

    // 旧档迁移：freeCut 由 applyYearStyle 写入时 yearDone 即设定年
    if (s.freeCut && !s.freeYear && s.yearDone) s.freeYear = s.yearDone;

    // 亲传 id 变化（新收徒）→ 重置心境与本年功课
    const cur = G.apprentice || null;
    if (cur && s._apprenticeId !== cur) {
      s.mood = 60;
      s.y = G.year || 0;
      s.n = 0;
      s.freeCut = 0;
      s.style = 'kind';
      s._apprenticeId = cur;
      // 3.9.11 M12：换徒清年终状态（yearDone 取与当年不等的值），不继承旧徒督导/顺延
      s.yearDone = (G.year || 0) - 1;
      s.pendYear = 0;
      s.freeYear = 0;
    } else if (!cur) {
      s._apprenticeId = null;
    }

    // 跨年功课计数归零。§20.4.1：上年选放养留下的 freeCut/style 跨年保留，
    // 新年 hwCap 见 freeCut+freeYear → 仅 freeYear+1 年 cap=2；切换督导风格时由 applyYearStyle 重设。
    const yr = G.year || 0;
    if (s.y !== yr) {
      s.y = yr;
      s.n = 0;
    }
    // 3.9.11 M13：放养减帽过期自动清
    if (s.freeCut && s.freeYear && (G.year || 0) > (s.freeYear | 0) + 1) {
      s.freeCut = 0;
      s.freeYear = 0;
    }
    return s;
  }

  function hwCap(G) {
    G = getG(G);
    if (!G) return SHI46.HW_CAP;
    const s = ensure(G);
    if (!s) return SHI46.HW_CAP;
    // §20.4.1 / §20.4 规则3：放养设定当年 cap 仍为 HW_CAP（n 不清零、不绕开封顶）；
    // 3.9.11 M13：仅 freeYear+1 年 cap=2，过期自动清 freeCut（见 ensure），不再无限期泄漏。
    if (s.style === 'free' && s.freeCut && (s.freeYear | 0) && (G.year | 0) === (s.freeYear | 0) + 1) {
      return Math.max(1, SHI46.HW_CAP - 1);
    }
    return SHI46.HW_CAP;
  }

  function canHw(G) {
    G = getG(G);
    if (!G || SHI46.off) return false;
    if (!G.apprentice) return false;
    const s = ensure(G);
    if (!s) return false;
    return (s.n | 0) < hwCap(G);
  }

  function hasAp(G, n) {
    n = n || 1;
    if (!G) return false;
    if (typeof G.ap === 'number') return G.ap >= n;
    return false;
  }

  function useAp(G, n) {
    n = n || 1;
    try {
      const g = Gm();
      if (g && typeof g.useAP === 'function') return !!g.useAP(n);
    } catch (e) {}
    if (!G || typeof G.ap !== 'number' || G.ap < n) return false;
    G.ap -= n;
    return true;
  }

  /**
   * 布置功课（逻辑层）。
   * opts.silent：跳过弹卡（单测）；opts.forceOk / forceFail：强制成败；
   * 非 silent 时需 canPopup，且弹确认卡。
   * 返回 { ok, reason, success?, moodDelta?, leveled? }
   */
  async function doHw(G, opts) {
    opts = opts || {};
    G = getG(G);
    if (!G) return { ok: false, reason: 'nog' };
    if (SHI46.off) return { ok: false, reason: 'off' };
    if (!G.apprentice) return { ok: false, reason: 'no_apprentice' };
    if (!opts.silent && !canPopup()) return { ok: false, reason: 'blocked' };

    const s = ensure(G);
    const cap = hwCap(G);
    if ((s.n | 0) >= cap) return { ok: false, reason: 'cap', n: s.n, cap };

    if (typeof G.ap === 'number' && G.ap < 1) return { ok: false, reason: 'noap', msg: TEXT_SHI46.ui.hw_noap };

    const name = npcName(G.apprentice);
    const task = pick(TEXT_SHI46.hw.tasks) || TEXT_SHI46.hw.tasks[0];

    if (!opts.silent) {
      const ask = fill(TEXT_SHI46.hw.ask, { n: name, task });
      const ch = await card(
        fill(TEXT_SHI46.hw.title, { name }),
        ask,
        null,
        [TEXT_SHI46.hw.opt_ok, TEXT_SHI46.hw.opt_cancel]
      );
      if (ch !== 0) return { ok: false, reason: ch === 1 ? 'cancel' : 'blocked' };
    }

    if (!useAp(G, 1)) return { ok: false, reason: 'noap', msg: TEXT_SHI46.ui.hw_noap };

    // 扣 AP 后立刻占一次额度，防并发刷
    s.n = (s.n | 0) + 1;
    s.y = G.year || s.y;

    let success;
    if (opts.forceOk === true) success = true;
    else if (opts.forceFail === true) success = false;
    else success = roll(SHI46.HW_OK, 'qiyu');

    let moodDelta = 0;
    let leveled = false;

    if (success) {
      moodDelta = jitter(8, 2); // +6..10
      s.mood = clamp((s.mood | 0) + moodDelta, 0, 100);
      s.lessons = (s.lessons | 0) + 1;
      const meta = ensureMeta();
      if (meta) meta.totLesson = (meta.totLesson | 0) + 1;

      // 40% 升级；严格督导年成功时额外 50% 再试
      const lv = G.apprenticeLvl | 0;
      if (lv < 10) {
        let up = roll(0.4, 'qiyu');
        if (!up && s.style === 'strict') up = roll(0.5, 'qiyu');
        if (up) {
          G.apprenticeLvl = Math.min(10, lv + 1);
          leveled = true;
        }
      }
    } else {
      moodDelta = jitter(6, 2); // 4..8
      s.mood = clamp((s.mood | 0) - moodDelta, 0, 100);
    }

    if (!opts.silent) {
      const line = success
        ? (pick(TEXT_SHI46.hw.ok_lines) || '')
        : (pick(TEXT_SHI46.hw.fail_lines) || '');
      const body = fill(success ? TEXT_SHI46.hw.done_ok : TEXT_SHI46.hw.done_fail, {
        n: name, line, mood: moodDelta
      });
      await card(TEXT_SHI46.hw.done_title, body, null, ['知道了']);
    }

    try {
      const g = Gm();
      if (g && g.save) g.save();
    } catch (e) {}

    return { ok: true, success, moodDelta, leveled, n: s.n, mood: s.mood, cap };
  }

  function canGrad(G) {
    G = getG(G);
    if (!G || SHI46.off) return false;
    if (!G.apprentice) return false;
    const s = ensure(G);
    if (!s) return false;
    const techs = G.apprenticeTechs && typeof G.apprenticeTechs === 'object'
      ? Object.keys(G.apprenticeTechs).length : 0;
    const aff = (G.aff && G.aff[G.apprentice]) || 0;
    return (G.apprenticeLvl | 0) >= SHI46.GRAD_LV
      && techs >= SHI46.GRAD_TECH
      && (s.mood | 0) >= SHI46.GRAD_MOOD
      && aff >= SHI46.GRAD_AFF;
  }

  function giftStoneAmt(G) {
    G = getG(G);
    let need = 1000;
    try {
      if (typeof REALMS !== 'undefined' && REALMS && G && REALMS[G.realm] && REALMS[G.realm].need != null) {
        need = REALMS[G.realm].need;
      }
    } catch (e) {}
    return Math.min(2000, Math.round(need * SHI46.GIFT_STONE_MUL));
  }

  /**
   * 出师。gift: 'stone'|'scroll'|'none'；silent 跳卡。
   * 成功：清 apprentice*，写 ally，aff/rel 提升，meta.totGrad++。
   */
  async function graduate(G, gift, opts) {
    opts = opts || {};
    G = getG(G);
    if (!G) return { ok: false, reason: 'nog' };
    if (SHI46.off) return { ok: false, reason: 'off' };
    if (!G.apprentice) return { ok: false, reason: 'no_apprentice' };
    if (!canGrad(G)) return { ok: false, reason: 'locked' };
    if (!opts.silent && !canPopup()) return { ok: false, reason: 'blocked' };

    const id = G.apprentice;
    const name = npcName(id);
    const stoneAmt = giftStoneAmt(G);

    if (!opts.silent) {
      const ask = fill(TEXT_SHI46.grad.ask, { n: name })
        + '\n\n（出师后「桃李天下」结局将暂时不可用，需再收徒并培养到 4 级。）';
      const optsArr = [
        fill(TEXT_SHI46.grad.gift_stone, { s: stoneAmt }),
        TEXT_SHI46.grad.gift_scroll,
        TEXT_SHI46.grad.gift_none,
        TEXT_SHI46.grad.cancel
      ];
      const ch = await card(TEXT_SHI46.grad.title, ask, null, optsArr);
      if (ch === 3 || ch < 0) return { ok: false, reason: 'cancel' };
      gift = ch === 0 ? 'stone' : ch === 1 ? 'scroll' : 'none';
    }
    gift = gift || 'none';

    // 3.9.9 S2 出师赠礼先验资再扣费：校验放在清徒弟/写 ally 之前，不足直接拒绝、不改档
    if (gift === 'stone' && (G.stone | 0) < stoneAmt) return { ok: false, reason: 'no_stone' };
    if (gift === 'scroll' && ((G.inv && G.inv.scroll) | 0) < 1) return { ok: false, reason: 'no_scroll' };

    const s = ensure(G);
    s.ally = { id, n: name, y0: G.year | 0, fightY: 0 };
    s.grad = (s.grad | 0) + 1;
    const meta = ensureMeta();
    if (meta) meta.totGrad = (meta.totGrad | 0) + 1;

    G.apprentice = null;
    G.apprenticeLvl = 0;
    G.apprenticeTechs = {};
    s._apprenticeId = null;

    // 好感 / 人情
    G.aff = G.aff || {};
    G.aff[id] = Math.min(150, (G.aff[id] || 0) + 10);
    try {
      if (typeof Life34 !== 'undefined' && Life34 && typeof Life34.rel === 'function') {
        Life34.rel(id, 15);
      }
    } catch (e) {}

    if (gift === 'stone') {
      G.stone = (G.stone | 0) - stoneAmt;
    } else if (gift === 'scroll') {
      try {
        const g = Gm();
        if (g && typeof g.take === 'function') g.take('scroll', 1);
        else if (g && typeof g.give === 'function') g.give('scroll', -1);
        else { G.inv = G.inv || {}; G.inv.scroll = (G.inv.scroll | 0) - 1; if (G.inv.scroll <= 0) delete G.inv.scroll; }
      } catch (e) {
        G.inv = G.inv || {}; G.inv.scroll = (G.inv.scroll | 0) - 1; if (G.inv.scroll <= 0) delete G.inv.scroll;
      }
    }

    if (!opts.silent) {
      await card(TEXT_SHI46.grad.title, fill(TEXT_SHI46.grad.done, { n: name }), null, ['好']);
      toast(TEXT_SHI46.grad.meta_toast, '#ffd8a0');
      const td = pick(TEXT_SHI46.tiandao);
      if (td) toast(td, '#c8e0ff');
    }

    try {
      const g = Gm();
      if (g && g.save) g.save();
      if (g && g.saveMeta) g.saveMeta();
    } catch (e) {}

    return { ok: true, ally: s.ally, gift, stoneAmt, aff: G.aff[id] };
  }

  /** 应用年终督导风格（逻辑）。style: strict|kind|free */
  function applyYearStyle(G, style) {
    if (SHI46.off) return { ok: false, reason: 'off' }; // 3.9.11 L1：首行 off 守卫
    G = getG(G);
    if (!G || !G.apprentice) return { ok: false, reason: 'no_apprentice' };
    const s = ensure(G);
    style = style || 'kind';
    s.style = style;
    s.yearDone = G.year | 0;
    s.pendYear = 0;
    const name = npcName(G.apprentice);
    if (style === 'strict') {
      s.mood = clamp((s.mood | 0) - 5, 0, 100);
      s.freeCut = 0;
      s.freeYear = 0;
      toast(fill(TEXT_SHI46.year.toast_strict, { n: name }), '#ffc8a0');
    } else if (style === 'free') {
      s.mood = clamp((s.mood | 0) + 3, 0, 100);
      // §20.4.1：freeCut=1 标记「下一年功课上限 2」；设定当年 n 不清零、cap 仍 3（不绕开封顶）。
      // 3.9.11 M13：另记 freeYear=设定年，hwCap 仅 freeYear+1 年降为 2。
      s.freeCut = 1;
      s.freeYear = G.year | 0;
      toast(fill(TEXT_SHI46.year.toast_free, { n: name }), '#c8ffd8');
    } else {
      s.style = 'kind';
      s.mood = clamp((s.mood | 0) + 8, 0, 100);
      s.freeCut = 0;
      s.freeYear = 0;
      toast(fill(TEXT_SHI46.year.toast_kind, { n: name }), '#ffe8a0');
    }
    return { ok: true, style: s.style, mood: s.mood, freeCut: s.freeCut };
  }

  /**
   * 年终督导卡。一年最多一张；storyBlock 时设 pendYear 顺延。
   * opts.silent + opts.style：单测直接应用。
   */
  async function yearReview(G, opts) {
    opts = opts || {};
    G = getG(G);
    if (!G) return { ok: false, reason: 'nog' };
    if (SHI46.off) return { ok: false, reason: 'off' };
    if (!G.apprentice) return { ok: false, reason: 'no_apprentice' };
    const s = ensure(G);
    if ((G.age | 0) < 8 && !opts.forceAge) return { ok: false, reason: 'age' };
    if (s.yearDone === (G.year | 0) && !opts.force) {
      s.pendYear = 0; // 3.9.11 M12：当年已督导，残留顺延过期顺手清
      return { ok: false, reason: 'done' };
    }

    if (!opts.silent && !canPopup()) {
      s.pendYear = 1;
      return { ok: false, reason: 'blocked', pending: true };
    }

    if (opts.silent && opts.style) {
      return applyYearStyle(G, opts.style);
    }

    const name = npcName(G.apprentice);
    const ch = await card(
      TEXT_SHI46.year.ask_title,
      fill(TEXT_SHI46.year.ask, { n: name }),
      null,
      [TEXT_SHI46.year.opt_strict, TEXT_SHI46.year.opt_kind, TEXT_SHI46.year.opt_free]
    );
    // 无 SAFE 前缀 → 自动任务不代选；玩家取消/关闭 → 记 pending
    if (ch < 0 || ch > 2) {
      s.pendYear = 1;
      return { ok: false, reason: 'cancel', pending: true };
    }
    const style = ch === 0 ? 'strict' : ch === 2 ? 'free' : 'kind';
    return applyYearStyle(G, style);
  }

  /** 盟友回访：勉励 / 助战 / 离开。silent 直接执行 act。 */
  async function allyVisit(G, opts) {
    opts = opts || {};
    G = getG(G);
    if (!G) return { ok: false, reason: 'nog' };
    if (SHI46.off) return { ok: false, reason: 'off' };
    const s = ensure(G);
    if (!s.ally || !s.ally.id) return { ok: false, reason: 'no_ally' };
    if (!opts.silent && !canPopup()) return { ok: false, reason: 'blocked' };

    // §20.4 / 反刷：每年回访卡 ≤1；visitY 同时闸 allyOptFor 与 thank（M1）
    const ally = s.ally;
    const name = ally.n || npcName(ally.id);
    const yr = G.year | 0;

    if (!opts.silent) {
      const line = pick(TEXT_SHI46.ally.talk) || TEXT_SHI46.ally.talk[0];
      const ch = await card(
        '门下回访',
        fill(line, { n: name }),
        null,
        [TEXT_SHI46.ally.opt_thank, TEXT_SHI46.ally.opt_ask, TEXT_SHI46.ally.opt_leave]
      );
      // 3.9.11 M10：关闭/ESC（ch<0）或越界直接取消，不写 visitY、不烧年帽
      if (ch < 0 || ch > 2) return { ok: false, reason: 'cancel' };
      opts.act = ch === 0 ? 'thank' : ch === 1 ? 'fight' : 'leave';
    }
    const act = opts.act || 'leave';

    if (act === 'thank') {
      // 同年已回访（含勉励/助战/离开写过 visitY）→ 拒刷 aff/herb
      if ((s.visitY | 0) === yr) {
        if (!opts.silent) toast(TEXT_SHI46.ally.visit_cap, '#ffc8a0');
        return { ok: false, reason: 'visit_cap' };
      }
      s.visitY = yr;
      G.aff = G.aff || {};
      G.aff[ally.id] = Math.min(150, (G.aff[ally.id] || 0) + 3);
      let gift = false;
      if (roll(0.5, 'qiyu')) {
        gift = true;
        try {
          const g = Gm();
          if (g && typeof g.give === 'function') g.give('herb', 1);
          else { G.inv = G.inv || {}; G.inv.herb = (G.inv.herb | 0) + 1; }
        } catch (e) {
          G.inv = G.inv || {}; G.inv.herb = (G.inv.herb | 0) + 1;
        }
      }
      if (!opts.silent) toast(TEXT_SHI46.ally.gift_line, '#c8ffd8');
      return { ok: true, act: 'thank', gift, aff: G.aff[ally.id] };
    }

    if (act === 'fight') {
      if ((ally.fightY | 0) === yr) {
        if (!opts.silent) toast(TEXT_SHI46.ally.fight_cap, '#ffc8a0');
        return { ok: false, reason: 'fight_cap' };
      }
      ally.fightY = yr;
      s.visitY = yr; // 回访卡年帽：助战后同年不再开回访选项
      G.follower = ally.id;
      if (!opts.silent) toast(fill(TEXT_SHI46.ally.fight_ok, { n: name }), '#ffd8a0');
      return { ok: true, act: 'fight', follower: G.follower };
    }

    s.visitY = yr;
    return { ok: true, act: 'leave' };
  }

  /** Talk.extra 注入用：是否可对 id 显示回访（§20.4：visitY===year 则隐藏） */
  function allyOptFor(id) {
    if (SHI46.off || !id) return false;
    const G = getG();
    if (!G) return false;
    const s = ensure(G);
    if (!s || !s.ally || s.ally.id !== id) return false;
    if ((s.visitY | 0) === (G.year | 0)) return false;
    return true;
  }

  /** 面板信息快照（UI 轮用；本轮供单测） */
  function panelInfo(G) {
    G = getG(G);
    if (!G || SHI46.off) return { off: !!SHI46.off, empty: true };
    const s = ensure(G);
    if (!G.apprentice) {
      return {
        empty: true,
        emptyText: TEXT_SHI46.ui.empty,
        ally: s && s.ally ? s.ally : null,
        sec: TEXT_SHI46.ui.sec
      };
    }
    const techs = G.apprenticeTechs && typeof G.apprenticeTechs === 'object'
      ? Object.keys(G.apprenticeTechs).length : 0;
    const cap = hwCap(G);
    return {
      empty: false,
      sec: TEXT_SHI46.ui.sec,
      name: npcName(G.apprentice),
      mood: s.mood | 0,
      lvl: G.apprenticeLvl | 0,
      techs,
      n: s.n | 0,
      cap,
      canHw: canHw(G) && hasAp(G, 1),
      canGrad: canGrad(G),
      gradLock: fill(TEXT_SHI46.ui.grad_lock, {
        lv: SHI46.GRAD_LV, tech: SHI46.GRAD_TECH, mood: SHI46.GRAD_MOOD, aff: SHI46.GRAD_AFF
      }),
      ally: s.ally,
      hwBtn: TEXT_SHI46.ui.hw_btn,
      gradBtn: TEXT_SHI46.ui.grad_btn
    };
  }

  // ---- 公开 API（仅守卫后的入口；不暴露 once/_doHw 等可绕过内部）----
  const API = {
    TEXT: TEXT_SHI46,
    ensure,
    ensureMeta,
    storyBlock,
    canPopup,
    hwCap,
    canHw,
    canGrad,
    giftStoneAmt,
    doHw,
    graduate,
    applyYearStyle,
    yearReview,
    allyVisit,
    allyOptFor,
    panelInfo,
    keepFnMarks,

    /** 包装接入（宿主已有 Game/Talk/UI 时）；可重复调用，幂等 */
    wire() {
      if (SHI46.off) return false;
      if (SHI46._wired) return true;
      try {
        if (typeof Game !== 'undefined' && Game) {
          // yearEnd 尾部督导卡 + 偶发回访 toast
          if (Game.yearEnd && !Game.yearEnd._shi46) {
            const _ye = Game.yearEnd;
            Game.yearEnd = async function () {
              const r = await _ye.apply(this, arguments);
              try {
                if (!SHI46.off && this.G && this.G.apprentice) {
                  const s = ensure(this.G);
                  if (s && (this.G.age | 0) >= 8 && s.yearDone !== (this.G.year | 0)) {
                    await yearReview(this.G, {});
                  }
                  // 盟友年结回访概率（3.9.11 M11：toast 只提示，不写 visitY、不烧回访年帽）
                  if (s && s.ally && s.visitY !== (this.G.year | 0) && canPopup()) {
                    if (roll(SHI46.VISIT_P, 'qiyu')) {
                      toast(fill(TEXT_SHI46.ally.visit_toast, { n: s.ally.n || npcName(s.ally.id) }), '#c8e0ff');
                    }
                  }
                } else if (!SHI46.off && this.G) {
                  const s = ensure(this.G);
                  if (s && s.pendYear && this.G.apprentice && canPopup()) {
                    await yearReview(this.G, {});
                  }
                }
              } catch (e) { try { console.warn('[shi46] yearEnd', e); } catch (e2) {} }
              return r;
            };
            Game.yearEnd._shi46 = 1;
            keepFnMarks(_ye, Game.yearEnd, '_shi46');
          }

          // newLife：清本世 G.shi46，保留 meta
          if (Game.newLife && !Game.newLife._shi46) {
            const _nl = Game.newLife;
            Game.newLife = function () {
              const r = _nl.apply(this, arguments);
              try {
                if (this.G) {
                  delete this.G.shi46;
                  ensure(this.G);
                }
              } catch (e) {}
              return r;
            };
            Game.newLife._shi46 = 1;
            keepFnMarks(_nl, Game.newLife, '_shi46');
          }

          // die：先内层；仅真死（alive→G.dead）后遗憾 toast（L1：main40 拦截 newdao/auditor 不叹；同 mem45/#74）
          if (Game.die && !Game.die._shi46) {
            const _die = Game.die;
            Game.die = async function () {
              const G0 = this.G;
              const aliveBefore = !!(G0 && !G0.dead);
              const r = await _die.apply(this, arguments);
              try {
                const G = this.G;
                if (!SHI46.off && aliveBefore && G && G.dead && G.apprentice) {
                  toast('弟子尚在门下，未能亲送你一程……', '#c8c0b0');
                }
              } catch (e) {}
              return r;
            };
            Game.die._shi46 = 1;
            keepFnMarks(_die, Game.die, '_shi46');
          }

          // enterMap：pendYear 顺延弹卡
          if (Game.enterMap && !Game.enterMap._shi46) {
            const _em = Game.enterMap;
            Game.enterMap = async function () {
              const r = await _em.apply(this, arguments);
              try {
                if (!SHI46.off && this.G && this.G.apprentice) {
                  const s = ensure(this.G);
                  if (s && s.pendYear && canPopup()) await yearReview(this.G, {});
                }
              } catch (e) {}
              return r;
            };
            Game.enterMap._shi46 = 1;
            keepFnMarks(_em, Game.enterMap, '_shi46');
          }
        }
      } catch (e) {}

      try {
        if (typeof Talk !== 'undefined' && Talk && !Talk._shi46) {
          const _ex = Talk.extra;
          Talk.extra = function (id) {
            // M2：上层若返回 undefined/非数组，归一成 [] 再拼，避免 out.push 炸链
            const out = [];
            try {
              const prev = _ex ? _ex.apply(this, arguments) : [];
              if (Array.isArray(prev) && prev.length) out.push.apply(out, prev);
            } catch (e) {}
            try {
              if (!SHI46.off && allyOptFor(id) && canPopup()) {
                out.push(['✦ 门下回访', async () => { await allyVisit(getG(), {}); }]);
              }
            } catch (e) {}
            return out;
          };
          keepFnMarks(_ex, Talk.extra, '_shi46'); // 3.9.11 L3：上层 _ 标记不丢失
          Talk._shi46 = 1;
        }
      } catch (e) {}

      try {
        if (typeof UI !== 'undefined' && UI && typeof UI.p_legacy26 === 'function' && !UI.p_legacy26._shi46) {
          const _p = UI.p_legacy26;
          UI.p_legacy26 = function (b, re) {
            const r = _p.apply(this, arguments);
            try {
              if (SHI46.off) return r;
              const G = getG();
              if (!G || !b) return r;
              ensure(G);
              const info = panelInfo(G);
              // 第 1 轮仅挂 data 属性供单测/Dev；真正 DOM 追加留给第 2 轮
              try { b._shi46 = info; } catch (e) {}
            } catch (e) {}
            return r;
          };
          UI.p_legacy26._shi46 = 1;
          keepFnMarks(_p, UI.p_legacy26, '_shi46');
        }
      } catch (e) {}

      try {
        if (typeof DevPanel !== 'undefined' && DevPanel && DevPanel.registerTab && !SHI46._dev) {
          SHI46._dev = 1;
          DevPanel.registerTab('shi46', (TEXT_SHI46.dev && TEXT_SHI46.dev.tab) || '师徒46', (box) => {
            try {
              const G = getG();
              const s = G ? ensure(G) : null;
              const meta = ensureMeta() || {};
              box.innerHTML = `<p class="hint">${(TEXT_SHI46.dev && TEXT_SHI46.dev.hint) || ''}</p>
                <p>off=${SHI46.off} mood=${s ? s.mood : '-'} n=${s ? s.n : '-'} lessons=${s ? s.lessons : '-'}
                ally=${s && s.ally ? s.ally.id : '-'} totGrad=${meta.totGrad || 0}</p>
                <button data-a="ap">收徒假数据</button>
                <button data-a="mood">mood=100</button>
                <button data-a="ready">lvl+techs</button>
                <button data-a="hwok">功课成功</button>
                <button data-a="hwfail">功课失败</button>
                <button data-a="grad">强制出师</button>
                <button data-a="clr">清 ally</button>
                <button data-a="off">开关 off</button>
                <button data-a="year">年终卡</button>`;
              box.onclick = async (ev) => {
                const a = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-a');
                if (!a || !G) return;
                if (a === 'ap' && !G.apprentice) {
                  G.apprentice = 'cuihua'; G.apprenticeLvl = 1; G.apprenticeTechs = {};
                  G.aff = G.aff || {}; G.aff.cuihua = Math.max(G.aff.cuihua || 0, 80);
                  ensure(G);
                } else if (a === 'mood') { ensure(G).mood = 100; }
                else if (a === 'ready') {
                  G.apprenticeLvl = Math.max(G.apprenticeLvl || 0, SHI46.GRAD_LV);
                  G.apprenticeTechs = G.apprenticeTechs || {};
                  G.apprenticeTechs.t1 = 1; G.apprenticeTechs.t2 = 1;
                  ensure(G).mood = Math.max(ensure(G).mood, SHI46.GRAD_MOOD);
                  G.aff = G.aff || {}; if (G.apprentice) G.aff[G.apprentice] = Math.max(G.aff[G.apprentice] || 0, SHI46.GRAD_AFF);
                } else if (a === 'hwok') await doHw(G, { silent: true, forceOk: true });
                else if (a === 'hwfail') await doHw(G, { silent: true, forceFail: true });
                else if (a === 'grad') {
                  ensure(G).mood = 100;
                  G.apprenticeLvl = Math.max(G.apprenticeLvl || 0, SHI46.GRAD_LV);
                  G.apprenticeTechs = { t1: 1, t2: 1 };
                  if (G.apprentice) { G.aff = G.aff || {}; G.aff[G.apprentice] = Math.max(G.aff[G.apprentice] || 0, SHI46.GRAD_AFF); }
                  await graduate(G, 'none', { silent: true });
                } else if (a === 'clr') { ensure(G).ally = null; }
                else if (a === 'off') { SHI46.off = !SHI46.off; }
                else if (a === 'year') await yearReview(G, {});
              };
            } catch (e) {}
          });
        }
      } catch (e) {}

      SHI46._wired = true;
      return true;
    }
  };

  // 挂常量到 SHI46，方法只从 API 暴露（防 _do / once 泄漏）
  SHI46.ensure = (G) => API.ensure(G);
  SHI46.ensureMeta = () => API.ensureMeta();
  SHI46.canPopup = () => API.canPopup();
  SHI46.storyBlock = () => API.storyBlock();
  SHI46.hwCap = (G) => API.hwCap(G);
  SHI46.canHw = (G) => API.canHw(G);
  SHI46.canGrad = (G) => API.canGrad(G);
  SHI46.giftStoneAmt = (G) => API.giftStoneAmt(G);
  SHI46.doHw = (G, o) => API.doHw(G, o);
  SHI46.graduate = (G, gift, o) => API.graduate(G, gift, o);
  SHI46.applyYearStyle = (G, style) => API.applyYearStyle(G, style);
  SHI46.yearReview = (G, o) => API.yearReview(G, o);
  SHI46.allyVisit = (G, o) => API.allyVisit(G, o);
  SHI46.allyOptFor = (id) => API.allyOptFor(id);
  SHI46.panelInfo = (G) => API.panelInfo(G);
  SHI46.wire = () => API.wire();
  SHI46.keepFnMarks = (a, b, c) => API.keepFnMarks(a, b, c);
  SHI46.API = API;

  W.TEXT_SHI46 = TEXT_SHI46;
  W.SHI46 = SHI46;
  W.Shi46 = API;
  try {
    if (typeof window !== 'undefined') {
      window.TEXT_SHI46 = TEXT_SHI46;
      window.SHI46 = SHI46;
      window.Shi46 = API;
    }
  } catch (e) {}

  // 自动 wire（有 document 时等 DOM；node 单测可手动 SHI46.wire()）
  try {
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { try { API.wire(); } catch (e) {} });
      } else {
        try { API.wire(); } catch (e) {}
      }
    }
  } catch (e) {}
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));

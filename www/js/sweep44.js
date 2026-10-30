// ======================= 3.9.4 秘境扫荡 sweep44（规格 docs/research_v22.md §18）第 1 轮 =======================
// 本轮：数据 + 纯逻辑（首通/次数/奖励结算/合成 Dng.run→exit / TEXT44），附 test/sweep44_unit.js。
// 本轮不进 index.html、不包 UI.p_dungeon26 面板区块——接线留第 2 轮。
// 存档 G.sw44 = { full:{}, y:0, n:0, tot:0 } 惰性；老档迁移仅当 dungeon.best>=3 才认 clear（§18.1⑥ / §18.7：clear 在单层守关就写，不能单独当首通）。
// 不升 G.v，仍走 wbx2_* / G.v===2。rng：Game.roll → Math.random。弹卡守 NPC37.storyBlock + B.on（#53）。
// LOOP 总开关：Sweep44.off=true 整系统停用。不改 dungeon26/game/talk/data/ui/battle/main。
'use strict';
(function (W) {
  const TEXT44 = {
    title: '讨债司外包 · 秘境代扫',
    unlock: '【{b}】已首通！讨债司外包部门来电：以后这片秘境可以交给我们代扫了（每次 1 行动力）。',
    locked_first: '先亲自打通一次。外包也要看你的通关截图。',
    locked_realm: '境界不足。外包员说这档秘境的保险你买不起。',
    cap: '今年的外包额度用完了。讨债司：“明年请早，工位有限。”',
    noap: '行动力不够。外包按次计费，计费单位是你的一季光阴。',
    btn1: '扫荡 ×1',
    btnN: '扫荡 ×{n}',
    confirm: '委托讨债司外包代扫【{b}】{n} 次？\n消耗行动力 {n}，不战斗、不受伤、不会失败。',
    confirm_ok: '签外包合同',
    confirm_no: '我再想想',
    card_title: '代扫回执',
    card_body: '讨债司外包员擦着汗回来，递上一张回执：\n\n【{b}】× {n} 次\n灵石 +{st}　修为 +{exp}\n材料：{it}\n装备：{eqn} 件（见下）\n\n回执背面印着：“本服务不含守关遗宝保底。想要好东西，请亲自下场。”',
    card_ok: '签收',
    flavor: [
      '外包员甲：“秘境我们熟，三层还是五层都一个价。”',
      '外包员乙：“打怪？不打怪。我们跟守关的是老同事，打个招呼就过。”',
      '外包员丙：“遗宝我们不拿，拿了要入账，入账要交税，交税要找天道。”',
      '“讨债司外包部门，专业代扫，童叟无欺，概不赊账——尤其不赊给你。”',
      '外包员甲：“上次有个修士让我们代扫元婴秘境，我们回来时他已经化神了。”',
      '外包员乙：“你问我们为什么不自己修仙？修仙要还贷，打工不用。”'
    ],
    title_unlock: { id: 't_sw44', n: '外包大户', d: '累计委托秘境代扫 30 次。', fl: '讨债司年会上，你的名字被念了三遍。' },
    first_hint: '（秘境首通后，可以在这里委托讨债司外包代扫。）'
  };

  const CAP = 3;
  const BANDS_N = ['练气秘境', '筑基秘境', '金丹秘境', '元婴秘境', '化神秘境'];
  const TIER = [1.15, 2.15, 3.15, 4.15, 5.15];
  // 与 dungeon26 BANDS[b].loot 一致（BANDS 未导出，本地抄一份）
  const LOOT = [
    ['herb', 'lz', 'coin', 'scroll'],
    ['lz', 'yd', 'coin', 'scroll', 'peach'],
    ['yd', 'lz', 'peach', 'pjd', 'coin'],
    ['yd', 'pjd', 'xsd', 'peach', 'scroll'],
    ['xsd', 'pjd', 'peach', 'coin', 'scroll']
  ];

  const Gm = () => {
    try { if (typeof Game !== 'undefined' && Game) return Game; } catch (e) {}
    return (W && W.Game) || null;
  };
  const getG = G => {
    if (G) return G;
    const g = Gm();
    return (g && g.G) || null;
  };
  const POWf = t => {
    try { if (typeof POW === 'function') return POW(t); } catch (e) {}
    return Math.pow(1.75, t);
  };
  const yr = G => (typeof G.year === 'number' ? G.year : (G.age || 0));
  const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (o && o[k] !== undefined ? o[k] : m));

  // 连续随机：优先 Math.random（Game.roll 是布尔掷骰）
  const rndRange = (a, b) => a + Math.random() * (b - a);
  // 布尔掷骰：Game.roll → Math.random
  const roll = (p, kind) => {
    try {
      const g = Gm();
      if (g && typeof g.roll === 'function') return !!g.roll(p, kind || 'sweep44');
    } catch (e) {}
    return Math.random() < p;
  };
  // 从数组抽样：Game.roll 蓄水池 → Math.random
  const pick = (a) => {
    if (!a || !a.length) return undefined;
    try {
      const g = Gm();
      if (g && typeof g.roll === 'function') {
        let idx = 0;
        for (let i = 1; i < a.length; i++) if (g.roll(1 / (i + 1), 'sweep44')) idx = i;
        return a[idx];
      }
    } catch (e) {}
    return a[Math.floor(Math.random() * a.length) % a.length];
  };
  const itemName = id => {
    try {
      if (typeof ITEMS !== 'undefined' && ITEMS && ITEMS[id] && ITEMS[id].n) return ITEMS[id].n;
    } catch (e) {}
    return id;
  };

  const Sweep44 = {
    TEXT: TEXT44,
    CAP,
    BANDS_N,
    TIER,
    LOOT,
    off: false, // LOOP 总开关：true 时整系统停用

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
    canPopup() { return !this.off && !this.storyBlock(); },
    toast(msg, color) {
      if (!this.canPopup()) return false;
      try {
        if (typeof UI !== 'undefined' && UI && typeof UI.toast === 'function') {
          UI.toast(msg, color || '#ffe680');
          return true;
        }
      } catch (e) {}
      return false;
    },
    async card(title, text, por, opts, extra) {
      if (!this.canPopup()) return -1;
      try {
        if (typeof UI !== 'undefined' && UI && typeof UI.card === 'function') {
          return await UI.card(title, text, por || 'i:chest', opts || ['好'], extra);
        }
      } catch (e) {}
      return -1;
    },

    curBand(G) {
      G = getG(G);
      if (!G) return 0;
      return Math.max(0, Math.min(4, (G.realm | 0) - 1));
    },

    /**
     * 惰性补全 G.sw44。老档迁移：仅当 dungeon.best>=3 时把 clear[b]===1 的档记入 full
     * （§18.7：clear 在「任意一层守关击破」就写，不能单独当首通）。
     */
    st(G) {
      G = getG(G);
      if (!G) return null;
      let S = G.sw44;
      if (!S || typeof S !== 'object') {
        S = G.sw44 = { full: {}, y: 0, n: 0, tot: 0 };
        const d = G.dungeon;
        if (d && d.clear && typeof d.clear === 'object' && (d.best | 0) >= 3) {
          for (const b in d.clear) {
            if (d.clear[b] === 1) S.full[b] = 1;
          }
        }
      }
      if (!S.full || typeof S.full !== 'object') S.full = {};
      if (typeof S.y !== 'number' || !Number.isFinite(S.y)) S.y = 0;
      if (typeof S.n !== 'number' || !Number.isFinite(S.n)) S.n = 0;
      if (typeof S.tot !== 'number' || !Number.isFinite(S.tot)) S.tot = 0;
      const y = yr(G);
      if (S.y !== y) { S.y = y; S.n = 0; }
      return S;
    },

    /** 是否已首通该档（不看 clear；只看 sw44.full） */
    isFull(G, b) {
      G = getG(G);
      if (!G || this.off) return false;
      b = b | 0;
      if (b < 0 || b > 4) return false;
      const S = this.st(G);
      return !!(S && S.full[b]);
    },

    /** 手动写入首通（测试 / 未来接线）；返回是否新解锁 */
    markFull(G, b, silent) {
      G = getG(G);
      if (!G || this.off) return false;
      b = b | 0;
      if (b < 0 || b > 4) return false;
      const S = this.st(G);
      if (!S || S.full[b]) return false;
      S.full[b] = 1;
      if (!silent) this.toast(fill(TEXT44.unlock, { b: BANDS_N[b] }), '#ffe680');
      return true;
    },

    /**
     * 在真实通关 exit 时调用：ok 同 shenqi36，且 !r.sweep 才记首通。
     * 合成扫荡 run 带 sweep:1，不会误触发 unlock toast。
     */
    onExit(G, r) {
      G = getG(G);
      if (!G || this.off || !r) return false;
      const ok = !r.over && r.bossDone && (r.floor | 0) >= (r.maxFloor | 0) && !r.sweep;
      if (!ok) return false;
      return this.markFull(G, r.band | 0, false);
    },

    left(G) {
      G = getG(G);
      if (!G || this.off) return 0;
      const S = this.st(G);
      return Math.max(0, CAP - (S ? S.n | 0 : 0));
    },

    /** 一键 ×N 的 N = min(本年剩余, 当前 AP)；N≥2 才显示 ×N 按钮（面板用） */
    maxN(G) {
      G = getG(G);
      if (!G || this.off) return 0;
      const ap = Number.isFinite(G.ap) ? G.ap | 0 : 0;
      return Math.min(this.left(G), Math.max(0, ap));
    },

    /**
     * 档状态：'ready' | 'locked_first' | 'locked_realm' | 'cap' | 'noap' | 'off'
     * ready 仍可能因次数/AP 置灰（panel 再查 left/ap）。
     */
    bandStatus(G, b) {
      G = getG(G);
      if (!G || this.off) return 'off';
      b = b | 0;
      if (b < 0 || b > 4) return 'locked_realm';
      const S = this.st(G);
      if (!S.full[b]) return 'locked_first';
      if (b > this.curBand(G)) return 'locked_realm';
      if (S.n >= CAP) return 'cap';
      if (!Number.isFinite(G.ap) || G.ap < 1) return 'noap';
      return 'ready';
    },

    can(G, b) {
      G = getG(G);
      if (!G || this.off) return false;
      b = b | 0;
      if (b < 0 || b > 4) return false;
      const S = this.st(G);
      return !!(S.full[b] && b <= this.curBand(G) && S.n < CAP && Number.isFinite(G.ap) && G.ap >= 1);
    },

    /** 内部单次结算（不弹卡）。合成已通关 run → Dng.exit(true) 触发 shenqi36/items40 钩子。
     * 不对外：无 unlock/AP/年 cap 门闩；仅由 go() 在校验后调用。 */
    _once(G, b) {
      G = getG(G);
      if (!G || this.off) return null;
      b = b | 0;
      if (b < 0 || b > 4) return null;
      const t = TIER[b] + 0.15;
      const out = { st: 0, exp: 0, eq: [], it: [], band: b, T: t };
      const g = Gm();

      out.st = Math.round(100 * POWf(t) * rndRange(0.85, 1.15));
      G.stone = (G.stone || 0) + out.st;

      const need = (typeof g !== 'undefined' && g && typeof g.yearExp === 'function')
        ? g.yearExp() * 0.6
        : 0;
      if (g && typeof g.addExp === 'function') {
        out.exp = g.addExp(need, true);
      } else {
        out.exp = Math.round(need);
        G.exp = Math.max(0, (G.exp || 0) + out.exp);
      }

      if (g && typeof g.randEq === 'function') {
        out.eq.push(g.randEq(t, 1), g.randEq(t + 0.5, 2));
      } else {
        // stub：无 Game.randEq 时记占位，便于单测计数
        const mk = (tier, minR) => ({ name: `eq_t${tier}_r${minR}`, tier, r: minR });
        out.eq.push(mk(t, 1), mk(t + 0.5, 2));
        G.eqs = G.eqs || [];
        G.eqs.push(out.eq[0], out.eq[1]);
      }

      const loot = LOOT[b] || LOOT[0];
      for (let i = 0; i < 2; i++) {
        const k = pick(loot);
        if (g && typeof g.give === 'function') g.give(k, 1);
        else { G.inv = G.inv || {}; G.inv[k] = (G.inv[k] || 0) + 1; }
        out.it.push(k);
      }

      // 合成已打完的 run，让下游 Dng.exit 钩子发碎晶/3.8.2 道具
      try {
        if (typeof Dng !== 'undefined' && Dng && typeof Dng.exit === 'function') {
          Dng.run = {
            band: b, tier: t, maxFloor: 3, floor: 3,
            doneRooms: 3, needRooms: 3, bossDone: true,
            loot: [], over: false, sweep: 1
          };
          Dng.exit(true);
        }
      } catch (e) {}

      return out;
    },

    _useAP(G, n) {
      n = n | 0;
      if (n <= 0) return true;
      const g = Gm();
      if (g && typeof g.useAP === 'function') {
        // useAP 可能 toast；不足时返回 false
        try { return !!g.useAP(n); } catch (e) { return false; }
      }
      if (!Number.isFinite(G.ap) || G.ap < n) return false;
      G.ap -= n;
      return true;
    },

    /**
     * 扫荡 b 档 times 次。opts.silent 跳过弹卡；opts.confirm===false 跳过确认。
     * 返回 { ok, reason?, outs, sum }；弹卡受 storyBlock/B.on/off 约束。
     */
    async go(G, b, times, opts) {
      G = getG(G);
      opts = opts || {};
      b = b | 0;
      times = Math.max(1, times | 0);
      if (!G) return { ok: false, reason: 'noG' };
      if (this.off) return { ok: false, reason: 'off' };
      if (b < 0 || b > 4) return { ok: false, reason: 'band' };

      const S = this.st(G);
      if (!S.full[b]) return { ok: false, reason: 'locked_first', msg: TEXT44.locked_first };
      if (b > this.curBand(G)) return { ok: false, reason: 'locked_realm', msg: TEXT44.locked_realm };
      if (S.n + times > CAP) return { ok: false, reason: 'cap', msg: TEXT44.cap };
      if (!Number.isFinite(G.ap) || G.ap < times) return { ok: false, reason: 'noap', msg: TEXT44.noap };

      // 非 silent：storyBlock/B.on 下禁止推进（不花 AP、不计数）。silent 留给逻辑层单测。
      if (!opts.silent) {
        if (!this.canPopup()) return { ok: false, reason: 'blocked' };
        if (opts.confirm !== false) {
          const conf = fill(TEXT44.confirm, { b: BANDS_N[b], n: times });
          const ch = await this.card(TEXT44.title, conf, 'i:chest', [TEXT44.confirm_ok, TEXT44.confirm_no]);
          // -1 / 非 0：拒收或取消 → 提前返回，不花 AP、不计数
          if (ch !== 0) return { ok: false, reason: ch === 1 ? 'cancel' : 'blocked' };
        }
      }

      const outs = [];
      for (let i = 0; i < times; i++) {
        if (!this._useAP(G, 1)) return { ok: false, reason: 'noap', msg: TEXT44.noap, outs };
        const one = this._once(G, b);
        if (!one) return { ok: false, reason: 'once', outs };
        outs.push(one);
        S.n++;
        S.tot++;
      }

      const sum = {
        st: outs.reduce((s, o) => s + (o.st || 0), 0),
        exp: outs.reduce((s, o) => s + (o.exp || 0), 0),
        eq: outs.reduce((a, o) => a.concat(o.eq || []), []),
        it: outs.reduce((a, o) => a.concat(o.it || []), [])
      };

      if (!opts.silent) {
        const itStr = sum.it.map(itemName).join('、') || '无';
        const body = fill(TEXT44.card_body, {
          b: BANDS_N[b], n: times, st: sum.st, exp: Math.round(sum.exp),
          it: itStr, eqn: sum.eq.length
        });
        await this.card(TEXT44.card_title, body, 'i:chest', [TEXT44.card_ok], { eq: sum.eq });
      }

      return { ok: true, outs, sum, n: S.n, tot: S.tot, left: this.left(G) };
    },

    /** 面板用 flavor 一句（每次打开换） */
    flavorLine() {
      return pick(TEXT44.flavor) || TEXT44.flavor[0];
    },

    /** 面板应列到的最高档：max(当前档, 已首通最高) ，再多一行预告由 UI 轮处理 */
    listMax(G) {
      G = getG(G);
      if (!G) return 0;
      const S = this.st(G);
      let hi = this.curBand(G);
      for (const k in S.full) if (S.full[k] === 1) hi = Math.max(hi, k | 0);
      return Math.min(4, hi);
    }
  };

  // 包裹 Dng.exit：真实全通关时记首通（扫荡合成 run 带 sweep:1 会跳过）
  // 本轮不进 index，故仅当宿主已加载 Dng 时生效；单测可手动 hook 或调 onExit。
  try {
    if (typeof Dng !== 'undefined' && Dng && typeof Dng.exit === 'function' && !Dng._sw44) {
      Dng._sw44 = 1;
      const _ex = Dng.exit;
      Dng.exit = function () {
        const r = this.run;
        let unlocked = false;
        try {
          if (!Sweep44.off) unlocked = Sweep44.onExit(getG(), r);
        } catch (e) {}
        const res = _ex.apply(this, arguments);
        return res;
      };
    }
  } catch (e) {}

  W.TEXT44 = TEXT44;
  W.Sweep44 = Sweep44;
  try { if (typeof window !== 'undefined') { window.TEXT44 = TEXT44; window.Sweep44 = Sweep44; } } catch (e) {}
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));

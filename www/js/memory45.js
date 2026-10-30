// ======================= 3.9.5 似曾相识 memory45（规格 docs/research_v22.md §19） =======================
// 跨世人情印象快照 + 来世「✦ 似曾相识」对话 / 地点弱提示；微好感与一世顿悟（有上限）。
// 不改 game.js/talk.js/data.js/ui.js；不升 G.v；Game.roll；守 storyBlock/B.on/UI.modal。
// 加载：index 在 dongfu43_ui 之后、audio32 之前。不碰 sweep44。
'use strict';
(function (W) {
  const TEXT_MEM45 = {"meta":{"id":"TEXT_MEM45","ver":"3.9.5","module":"memory45.js","title":"似曾相识·前世记忆继承补完","basedOn":["research_v22.md§18.7","legacy26","life34","npc37","Game.meta"]},"toast":{"snap":"轮回殿的书吏抄下了你今生的人情账……来世或许会梦到。","cap_year":"今年的似曾相识已经够多了。孟婆说：记太多会噎着。","off":"记忆45 已关闭（MEM45.off）。","fired":"【似曾相识】与{n}的前世余波已了结。"},"generic":["你看见{n}的侧脸，心里忽然一软——像在哪儿见过。","风里有一缕熟悉的味道。{n}抬头看你，也愣了一瞬。","你脱口叫出半个名字，又咽回去。{n}：“……你认识我？”","讨债司路过的纸鹤掉下一片灰，上面隐约写着：{n}·旧档未清。","你梦里走过这条路。醒过来，{n}就站在路中央。"],"friend":["{n}远远招手，又停住：“奇怪，总觉得该请你喝过酒。”","{n}塞给你半块糕：“别问为什么。我做多了。”","{n}：“你这眼神……像欠我人情的那种熟人。”","你与{n}对视三息，同时笑了。笑完又一起尴尬。","{n}拍拍你肩：“下辈子见——哦，这不就是。”"],"foe":["{n}目光一冷：“脸生。手熟。”","{n}摸了摸剑柄：“上辈子没砍完的，这辈子可以再约。”","你看见{n}，脚底发凉。对方也皱眉：“欠条呢？……算了，先欠着。”","{n}冷笑：“孟婆汤对你无效？对我也一样。”","空气里像有未结的梁子。{n}：“别站那么近。我怕手比脑子快。”"],"debtor":["{n}摸出三枚灵石，又缩回去：“我……是不是该还你什么？”","{n}：“梦见自己欠人一顿酒。你看着像债主。”","讨债鬼从{n}身边飘过，对你点头如打招呼。{n}背后发凉。","{n}塞给你一包草药：“利息？当我孝敬——别问前世。”","{n}小声：“上辈子你是不是借我走过夜路？我总想谢你。”"],"creditor":["{n}看着你，像在算账：“你这辈子……打算先还哪一笔？”","{n}递来一张空白欠条：“习惯了。你填数就行。”","你下意识想掏灵石。{n}：“哦？条件反射还在？”","{n}：“别紧张。我这辈子还不催你——除非你主动提。”","风吹起{n}衣摆，露出半截旧账本。你忽然想躲进草丛。"],"dao":["{n}看你的眼神太熟，熟到像一起看过同一轮月。","{n}低声：“红线……是不是打过死结？怎么又碰上了。”","你想叫一声“道侣”，舌尖发涩。{n}耳尖却红了。","{n}：“别用那种眼神。我还没结亲——至少这辈子还没。”","月色很好。{n}偏过头：“你是不是……梦到过我？”"],"shi":["{n}下意识摆出指点的架势，又收住：“咳，面生。”","{n}：“你站姿像我带过的徒弟。可惜我不收拖欠学费的。”","你想行礼，膝盖先动了。{n}：“……起来。这辈子还没拜呢。”","{n}递来一壶劣酒：“师父不喝这个。我只是路过。”","剑意一闪。{n}盯着你：“谁教你握剑的？别说是我。”"],"di":["{n}看见你，腰杆一挺，像要听训——随即满脸困惑。","{n}：“师……啊不，道友。我怎么想叫你师傅？”","你脱口：“功课做完了吗？”{n}：“啊？我还没拜师啊！”","{n}摸出半卷残页：“梦见有人传我剑诀。字迹像你。”","{n}：“这辈子换我罩着你？……开玩笑的。大概。”"],"place":["你踏进{map}，脚步自己慢了半拍——像回来过。","{map}的风带着旧尘。你想起一张没还完的人情账。","路牌歪着，你却知道该往哪拐。{map}像在点头。"],"boss":["你看见{n}的虚影，脊背发凉。账本翻页声在耳边。","{n}（记忆里的劲敌）留下一句余音：“下辈子，利息加倍。”","擂台旧痕还在。你对{n}的名字有一种莫名的胜负欲。"],"tiandao":["天道客服弹窗：检测到前世人情残留。是否一键清除？【清除失败：权限不足】","讨债司提示：跨世记忆不计入征信，但计入尴尬值。","孟婆加班留言：汤喝了也会做梦的人，请自觉少来轮回殿排队。","天道：“你以为轮回能销账？人情账比灵石账难清。”","纸鹤账单背面印小字：似曾相识服务费已减免——本次免费，下次再说。","天兵甲：“又一个带前世通讯录投胎的。”天兵乙：“记仇的那种最麻烦。”"],"choice":{"title":"似曾相识","ask":"{line}\n\n（前世与【{n}】的缘分残留。可轻轻应一声，或当作路过。）","opt_yes":"轻声应：“……好像见过。”","opt_no":"当作路过","opt_joke":"“你是不是也欠天道钱？”","after_yes":"对方眼神柔了一瞬。世界像把旧账翻到了夹缝里。","after_no":"你把那一缕记忆按回心底。风继续吹。","after_joke":"{n}愣住，随即骂笑：“……你还是这么欠抽。”"},"bonus":{"aff":"好感初值{sgn}{v}（一次）","insight":"顿悟余波：修为 +{v}（一世一次）","hint":"你隐约记得对方的破绽（下次与其战斗暴击倾向微升，已达上限则跳过）"},"dev":{"tab":"记忆45","hint":"跨世似曾相识（Game.meta.mem45）。仅开发者模式。"}};

  const MEM45 = W.MEM45 = {
    off: false,
    YEAR_CAP: 3,
    AFF_CAP: 12,
    INSIGHT_EXP: 0.08,
    AUTO_P: 0.35,
    TALK_P: 1,
    NPC_CAP: 24,
    PLACE_CAP: 12,
    BOSS_CAP: 8,
    TEXT: TEXT_MEM45,
    _wired: false
  };

  function npcName(id) {
    try {
      if (typeof NPCS !== 'undefined' && NPCS[id] && NPCS[id].n) return NPCS[id].n;
    } catch (e) { }
    return id;
  }

  function relOf(G, id) {
    try {
      if (typeof Life34 !== 'undefined' && Life34.st) {
        const L = Life34.st();
        if (L && L.rel && L.rel[id] != null) return L.rel[id] | 0;
      }
    } catch (e) { }
    try {
      if (G && G.life34 && G.life34.rel && G.life34.rel[id] != null) return G.life34.rel[id] | 0;
    } catch (e) { }
    return 0;
  }

  function affOf(G, id) {
    return (G && G.aff && G.aff[id]) || 0;
  }

  function roll(p, kind) {
    try {
      if (typeof Game !== 'undefined' && Game.roll) return !!Game.roll(p, kind || 'qiyu');
    } catch (e) { }
    return Math.random() < p;
  }

  function pickLine(pool, n) {
    const arr = pool && pool.length ? pool : (TEXT_MEM45.generic || ['……']);
    let i = 0;
    try {
      if (typeof Game !== 'undefined' && Game.roll) {
        // use roll only for flavor; pick index via Math after seeding attempt
        roll(1, 'qiyu');
      }
    } catch (e) { }
    i = Math.floor(Math.random() * arr.length) % arr.length;
    return String(arr[i]).replace(/\{n\}/g, n || '故人');
  }

  const API = W.Memory45 = {
    TEXT: TEXT_MEM45,

    ensureMeta() {
      try {
        if (typeof Game === 'undefined') return null;
        if (!Game.meta) Game.meta = {};
        const m = Game.meta.mem45 = Game.meta.mem45 || {};
        if (m.v == null) m.v = 1;
        if (!m.npcs || typeof m.npcs !== 'object') m.npcs = {};
        if (!m.places || typeof m.places !== 'object') m.places = {};
        if (!m.bosses || typeof m.bosses !== 'object') m.bosses = {};
        if (m.tot == null) m.tot = 0;
        if (m.lastSnap == null) m.lastSnap = 0;
        return m;
      } catch (e) { return null; }
    },

    ensureG(G) {
      if (!G) return null;
      const s = G.mem45 = G.mem45 || {};
      if (s.v == null) s.v = 1;
      if (s.y == null) s.y = G.year || 0;
      if (s.n == null) s.n = 0;
      if (!s.fired || typeof s.fired !== 'object') s.fired = {};
      if (!s.placeFired || typeof s.placeFired !== 'object') s.placeFired = {};
      if (!s.bossFired || typeof s.bossFired !== 'object') s.bossFired = {};
      if (s.insight == null) s.insight = 0;
      if (s.auto == null) s.auto = 1;
      if (!s.weak || typeof s.weak !== 'object') s.weak = {};
      if (!s.foeHint || typeof s.foeHint !== 'object') s.foeHint = {};
      // 跨年归零
      const y = G.year || 0;
      if (s.y !== y) { s.y = y; s.n = 0; }
      return s;
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
      if (this.storyBlock()) return false;
      try { if (typeof UI !== 'undefined' && UI.modal) return false; } catch (e) { }
      return true;
    },

    canFire(G, id) {
      if (MEM45.off || !G || !id) return false;
      const meta = this.ensureMeta();
      if (!meta || !meta.npcs || !meta.npcs[id]) return false;
      const s = this.ensureG(G);
      if (!s || s.fired[id]) return false;
      if ((s.n || 0) >= MEM45.YEAR_CAP) return false;
      if (!this.canPopup()) return false;
      return true;
    },

    /** 快照本世人情 → meta.mem45 */
    snapshot(G, force) {
      if (!G || MEM45.off) return null;
      const meta = this.ensureMeta();
      if (!meta) return null;
      const now = Date.now();
      if (!force && meta.lastSnap && now - meta.lastSnap < 50) return meta;
      meta.lastSnap = now;

      const lives = (typeof Game !== 'undefined' && Game.meta && Game.meta.lives) || 0;
      const cand = {};

      const put = (id, t, w) => {
        if (!id) return;
        const ww = Math.max(-100, Math.min(100, Math.round(w)));
        const prev = cand[id];
        // 优先级：已有更高 |w| 或更「特殊」类型不覆盖；同 id 取 |w| 更大
        if (prev && Math.abs(prev.w) >= Math.abs(ww) && prev.t !== 'friend') return;
        // 若新类型更优先（dao>di>shi>foe>friend），用序
        const rank = { dao: 6, di: 5, shi: 4, foe: 3, debtor: 2, creditor: 2, friend: 1 };
        if (prev && (rank[prev.t] || 0) > (rank[t] || 0)) return;
        cand[id] = { t, w: ww, n: npcName(id), life: lives };
      };

      // 1 dao
      if (G.partner) {
        const id = G.partner;
        put(id, 'dao', Math.max(80, affOf(G, id), relOf(G, id)));
      }
      // 2 di
      const discs = [];
      if (G.apprentice) discs.push(G.apprentice);
      if (Array.isArray(G.dis36)) for (const x of G.dis36) {
        const id = typeof x === 'string' ? x : (x && (x.id || x.npc));
        if (id) discs.push(id);
      }
      for (const id of discs) put(id, 'di', Math.max(70, affOf(G, id), relOf(G, id)));
      // 3 shi
      for (const id of ['mentor', 'mentor2']) {
        const a = affOf(G, id), r = relOf(G, id);
        if (a >= 60 || r >= 40) put(id, 'shi', Math.max(60, a, r));
      }
      // collect ids from aff + life34.rel
      const ids = new Set();
      if (G.aff) for (const k in G.aff) ids.add(k);
      try {
        const L = (typeof Life34 !== 'undefined' && Life34.st) ? Life34.st() : (G.life34 || null);
        if (L && L.rel) for (const k in L.rel) ids.add(k);
      } catch (e) { }
      // tie debt (optional)
      try {
        if (G.npc37 && G.npc37.tie) {
          for (const id in G.npc37.tie) {
            const d = G.npc37.tie[id];
            if (d && typeof d.debt === 'number' && d.debt !== 0) {
              put(id, d.debt > 0 ? 'creditor' : 'debtor', d.debt > 0 ? 35 : -35);
            }
          }
        }
      } catch (e) { }

      for (const id of ids) {
        if (cand[id]) continue;
        const r = relOf(G, id), a = affOf(G, id);
        if (r <= -40) put(id, 'foe', -Math.max(40, Math.abs(r)));
        else if (r >= 40 || a >= 60) put(id, 'friend', Math.max(r, a / 2));
      }

      // merge into meta.npcs with cap 24 by |w|
      const merged = Object.assign({}, meta.npcs, cand);
      const list = Object.keys(merged).map(id => ({ id, e: merged[id] }));
      list.sort((a, b) => Math.abs(b.e.w || 0) - Math.abs(a.e.w || 0));
      const next = {};
      for (let i = 0; i < list.length && i < MEM45.NPC_CAP; i++) next[list[i].id] = list[i].e;
      meta.npcs = next;

      // places
      const places = Object.assign({}, meta.places);
      const vis = G.visited || {};
      for (const mid in vis) {
        if (mid === 'village') continue;
        places[mid] = 1;
      }
      const pkeys = Object.keys(places);
      if (pkeys.length > MEM45.PLACE_CAP) {
        const keep = {};
        for (let i = 0; i < MEM45.PLACE_CAP; i++) keep[pkeys[i]] = 1;
        meta.places = keep;
      } else meta.places = places;

      // bosses
      const bosses = Object.assign({}, meta.bosses);
      if (G.bosses) for (const b in G.bosses) if (G.bosses[b]) bosses[b] = 1;
      if (G.flags) for (const f in G.flags) if (/^boss_/.test(f) && G.flags[f]) bosses[f] = 1;
      const bkeys = Object.keys(bosses);
      if (bkeys.length > MEM45.BOSS_CAP) {
        const keep = {};
        for (let i = 0; i < MEM45.BOSS_CAP; i++) keep[bkeys[i]] = 1;
        meta.bosses = keep;
      } else meta.bosses = bosses;

      try {
        if (typeof Game !== 'undefined' && Game.saveMeta) Game.saveMeta();
        if (typeof UI !== 'undefined' && UI.toast) UI.toast(TEXT_MEM45.toast.snap);
      } catch (e) { }
      return meta;
    },

    affDelta(entry) {
      const w = Math.abs((entry && entry.w) || 40);
      // 8..12 by |w| 插值
      const t = Math.min(1, Math.max(0, (w - 40) / 60));
      return Math.min(MEM45.AFF_CAP, Math.round(8 + t * 4));
    },

    async applyReward(G, id, entry, choice) {
      // choice: 0 yes, 1 no, 2 joke
      const s = this.ensureG(G);
      G.aff = G.aff || {};
      const t = (entry && entry.t) || 'generic';
      let insightGain = 0;
      if (choice === 1) {
        // 路过
      } else if (choice === 2) {
        G.aff[id] = (G.aff[id] || 0) + 2;
        try {
          if (typeof UI !== 'undefined' && UI.toast) UI.toast(pickLine(TEXT_MEM45.tiandao, npcName(id)));
        } catch (e) { }
      } else {
        // 应
        if (t === 'foe') {
          s.foeHint[id] = 1;
          try { if (typeof UI !== 'undefined' && UI.toast) UI.toast(TEXT_MEM45.bonus.hint); } catch (e) { }
        } else if (t === 'debtor') {
          G.aff[id] = Math.min(150, (G.aff[id] || 0) + 6);
        } else if (t === 'creditor') {
          G.aff[id] = Math.min(150, (G.aff[id] || 0) + 4);
        } else {
          const d = this.affDelta(entry);
          G.aff[id] = Math.min(150, (G.aff[id] || 0) + d);
        }
        // 顿悟
        if (!s.insight && (t === 'dao' || t === 'shi' || (t === 'friend' && Math.abs(entry.w || 0) >= 80))) {
          try {
            if (typeof Game !== 'undefined' && Game.yearExp && Game.addExp) {
              const raw = Game.yearExp() * MEM45.INSIGHT_EXP;
              insightGain = Game.addExp(raw, true);
              s.insight = 1;
              if (typeof UI !== 'undefined' && UI.toast) {
                UI.toast(String(TEXT_MEM45.bonus.insight).replace('{v}', String(Math.round(insightGain || raw))));
              }
            }
          } catch (e) { }
        }
      }
      return { insightGain };
    },

    async fireCard(G, id) {
      if (!this.canFire(G, id)) {
        const s = this.ensureG(G);
        if (s && (s.n || 0) >= MEM45.YEAR_CAP) {
          try { if (typeof UI !== 'undefined' && UI.toast) UI.toast(TEXT_MEM45.toast.cap_year); } catch (e) { }
        }
        return false;
      }
      if (!roll(MEM45.TALK_P, 'qiyu')) return false;
      const meta = this.ensureMeta();
      const entry = meta.npcs[id];
      const t = entry.t || 'generic';
      const n = entry.n || npcName(id);
      const pool = TEXT_MEM45[t] || TEXT_MEM45.generic;
      const line = pickLine(pool, n);
      const ch = TEXT_MEM45.choice;
      const body = String(ch.ask).replace(/\{line\}/g, line).replace(/\{n\}/g, n);
      const opts = [ch.opt_yes, ch.opt_no, ch.opt_joke];
      let c = 0;
      try {
        if (typeof UI !== 'undefined' && UI.card) {
          c = await UI.card(ch.title, body, (typeof NPCS !== 'undefined' && NPCS[id] && NPCS[id].por) || null, opts);
        }
      } catch (e) { return false; }
      if (c < 0) return false;
      const s = this.ensureG(G);
      s.fired[id] = 1;
      s.n = (s.n || 0) + 1;
      meta.tot = (meta.tot || 0) + 1;
      await this.applyReward(G, id, entry, c);
      try {
        if (typeof Game !== 'undefined' && Game.saveMeta) Game.saveMeta();
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        if (typeof UI !== 'undefined' && UI.toast) UI.toast(String(TEXT_MEM45.toast.fired).replace(/\{n\}/g, n));
      } catch (e) { }
      return true;
    },

    async weakHint(G, id) {
      if (MEM45.off || !G || !id) return false;
      const meta = this.ensureMeta();
      if (!meta || !meta.npcs[id]) return false;
      const s = this.ensureG(G);
      if (!s.auto || s.fired[id]) return false;
      if (!this.canPopup()) return false;
      const y = G.year || 0;
      if (s.weak[id] === y) return false;
      if (!roll(MEM45.AUTO_P, 'qiyu')) return false;
      s.weak[id] = y;
      const entry = meta.npcs[id];
      const pool = TEXT_MEM45[entry.t] || TEXT_MEM45.generic;
      try {
        if (typeof UI !== 'undefined' && UI.toast) UI.toast(pickLine(pool, entry.n || npcName(id)));
      } catch (e) { }
      return true;
    },

    async placeHint(G, mapId) {
      if (MEM45.off || !G || !mapId) return false;
      const meta = this.ensureMeta();
      if (!meta || !meta.places[mapId]) return false;
      const s = this.ensureG(G);
      if (s.placeFired[mapId]) return false;
      if (!this.canPopup()) return false;
      if (!roll(0.4, 'qiyu')) return false;
      s.placeFired[mapId] = 1;
      try {
        if (typeof UI !== 'undefined' && UI.toast) UI.toast(pickLine(TEXT_MEM45.place, mapId));
        if (typeof Game !== 'undefined' && Game.save) Game.save();
      } catch (e) { }
      return true;
    },

    inject(id, t, w, n) {
      const meta = this.ensureMeta();
      if (!meta) return false;
      meta.npcs[id] = { t: t || 'friend', w: w == null ? 50 : w, n: n || npcName(id), life: (Game.meta && Game.meta.lives) || 0 };
      try { if (Game.saveMeta) Game.saveMeta(); } catch (e) { }
      return true;
    },

    wire() {
      if (this._wired || typeof Game === 'undefined') return;
      this._wired = true;
      this.ensureMeta();

      // Game.die → snapshot first
      if (Game.die && !Game.die._mem45) {
        const _die = Game.die;
        Game.die = async function (kind) {
          try { API.snapshot(this.G); } catch (e) { console.warn('[mem45] snapshot', e); }
          return _die.apply(this, arguments);
        };
        Game.die._mem45 = 1;
        if (_die._loan42) Game.die._loan42 = 1;
        if (_die._main40) Game.die._main40 = 1;
      }

      // Game.newLife → ensure G.mem45
      if (Game.newLife && !Game.newLife._mem45) {
        const _nl = Game.newLife.bind(Game);
        Game.newLife = function (cfg) {
          const r = _nl(cfg);
          try { if (this.G) API.ensureG(this.G); } catch (e) { }
          return r;
        };
        Game.newLife._mem45 = 1;
      }

      // Talk.extra
      if (typeof Talk !== 'undefined') {
        const _ex = Talk.extra ? Talk.extra.bind(Talk) : function () { return []; };
        Talk.extra = function (id) {
          const out = [];
          try {
            const prev = _ex(id);
            if (prev && prev.length) for (const x of prev) out.push(x);
          } catch (e) { }
          try {
            if (MEM45.off) return out;
            const G = Game.G;
            if (!G || !id) return out;
            const meta = API.ensureMeta();
            if (!meta || !meta.npcs[id]) return out;
            const s = API.ensureG(G);
            if (s.fired[id]) return out;
            if ((s.n || 0) >= MEM45.YEAR_CAP) return out;
            // 不在 storyBlock 时仍展示选项；点开时再守卫
            out.push(['✦ 似曾相识', async () => {
              if (!API.canPopup()) {
                try { if (UI.toast) UI.toast('此刻不宜追忆。'); } catch (e) { }
                return;
              }
              await API.fireCard(G, id);
            }]);
          } catch (e) { console.warn('[mem45] Talk.extra', e); }
          return out;
        };
      }

      // enterMap place hint
      if (Game.enterMap && !Game.enterMap._mem45) {
        const _em = Game.enterMap;
        Game.enterMap = async function (id) {
          const r = await _em.apply(this, arguments);
          try {
            const G = this.G;
            if (G) { API.ensureG(G); await API.placeHint(G, id); }
          } catch (e) { console.warn('[mem45] enterMap', e); }
          return r;
        };
        Game.enterMap._mem45 = 1;
        if (_em._loan42) Game.enterMap._loan42 = 1;
        if (_em._main40) Game.enterMap._main40 = 1;
      }

      // interactEnt weak hint
      if (Game.interactEnt && !Game.interactEnt._mem45) {
        const _ie = Game.interactEnt.bind(Game);
        Game.interactEnt = async function (e) {
          try {
            const G = this.G;
            if (G && e && e.kind === 'npc' && e.id) {
              const s = API.ensureG(G);
              if (s && s.auto) await API.weakHint(G, e.id);
            }
          } catch (e2) { }
          return _ie(e);
        };
        Game.interactEnt._mem45 = 1;
      }

      // DevPanel
      const reg = () => {
        if (!W.DevPanel || typeof DevPanel.registerTab !== 'function') return false;
        DevPanel.registerTab('mem45', (TEXT_MEM45.dev && TEXT_MEM45.dev.tab) || '记忆45', (box, ctx) => {
          const G = Game.G;
          const meta = API.ensureMeta() || { npcs: {}, tot: 0 };
          const s = G ? API.ensureG(G) : { n: 0, insight: 0, auto: 1, fired: {} };
          const nN = Object.keys(meta.npcs || {}).length;
          box.innerHTML = `<p class="hint">${(TEXT_MEM45.dev && TEXT_MEM45.dev.hint) || ''}</p>
<p class="hint">npcs ${nN}/24 · tot ${meta.tot || 0} · 本年 ${s.n || 0}/${MEM45.YEAR_CAP} · insight ${s.insight || 0} · off ${MEM45.off ? 1 : 0} · auto ${s.auto ? 1 : 0}</p>
<pre class="hint" style="max-height:8em;overflow:auto">${JSON.stringify(meta.npcs || {}).slice(0, 400)}</pre>
<button class="opt" data-a="friend">注入友人(mentor)</button>
<button class="opt" data-a="foe">注入仇敌(aotian)</button>
<button class="opt" data-a="dao">注入道侣(lengyue)</button>
<button class="opt" data-a="di">注入弟子(cuihua)</button>
<button class="opt" data-a="debtor">注入债户</button>
<button class="opt" data-a="creditor">注入债主</button>
<button class="opt" data-a="clr">清空 mem45</button>
<button class="opt" data-a="reset">重置本世 fired</button>
<button class="opt" data-a="fire">强制弹卡(mentor)</button>
<button class="opt" data-a="auto">开关 auto</button>
<button class="opt" data-a="off">开关 off</button>`;
          box.onclick = async e => {
            const a = e.target && e.target.dataset && e.target.dataset.a;
            if (!a) return;
            try {
              if (a === 'friend') API.inject('mentor', 'friend', 55);
              else if (a === 'foe') API.inject('aotian', 'foe', -50);
              else if (a === 'dao') API.inject('lengyue', 'dao', 90);
              else if (a === 'di') API.inject('cuihua', 'di', 70);
              else if (a === 'debtor') API.inject('merchant', 'debtor', -35, '钱多多');
              else if (a === 'creditor') API.inject('xianguan', 'creditor', 35, '记账童子');
              else if (a === 'clr') { meta.npcs = {}; meta.places = {}; meta.bosses = {}; meta.tot = 0; Game.saveMeta && Game.saveMeta(); }
              else if (a === 'reset' && G) { const st = API.ensureG(G); st.fired = {}; st.n = 0; st.placeFired = {}; st.weak = {}; }
              else if (a === 'fire' && G) { await API.fireCard(G, 'mentor'); }
              else if (a === 'auto' && G) { const st = API.ensureG(G); st.auto = st.auto ? 0 : 1; }
              else if (a === 'off') { MEM45.off = !MEM45.off; }
              if (ctx && ctx.toast) ctx.toast(a);
              else if (UI.toast) UI.toast(a);
              // re-render
              reg();
              const tabs = W.DevTabs || [];
              const tab = tabs.find(x => x.key === 'mem45');
              if (tab) tab.render(box, ctx);
            } catch (er) { console.error('[mem45] dev', er); }
          };
        });
        return true;
      };
      if (!reg()) {
        let n = 0;
        const t = setInterval(() => { if (reg() || ++n > 40) clearInterval(t); }, 500);
      }
    }
  };

  // alias snapshot on MEM45
  MEM45.snapshot = (G) => API.snapshot(G);
  MEM45.ensureMeta = () => API.ensureMeta();
  MEM45.ensureG = (G) => API.ensureG(G);
  MEM45.canFire = (G, id) => API.canFire(G, id);
  MEM45.fireCard = (G, id) => API.fireCard(G, id);
  MEM45.inject = (...a) => API.inject(...a);

  function boot() {
    try { API.wire(); } catch (e) { console.error('[mem45] wire', e); }
  }
  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  try { boot(); } catch (e) { }
})(typeof window !== 'undefined' ? window : globalThis);

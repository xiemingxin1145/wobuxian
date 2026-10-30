// ======================= 3.9.3 自家洞府 dongfu43 第 2 轮：地图/标记/卡片接线 =======================
// 规格：docs/research_v22.md §17。依赖 DF43（dongfu43.js）。
// 本轮：MAPINFO 登记（不进 MAP_ORDER）+ AS.maps 占位 + 包 makeMarks/Acts/enterMap/refreshNpcs/Talk.npc/p_travel
//       + 居民 ents + 洞府年事卡 + 自动任务/挂机/路遇屏蔽 + DevPanel「洞府43」。
// 不改 game.js/talk.js/data.js/ui.js/battle.js/main.js/systems21/ux23/dev_entry_v25/dev341 本体（只包装）。
// 存档仍 G.df43 惰性、不升 G.v；rng=Game.roll 回退；弹卡守 NPC37.storyBlock + B.on（#53）。
'use strict';
(function (W) {
  const ID = 'dongfu';
  const DF = () => (typeof DF43 !== 'undefined' ? DF43 : (W.DF43 || null));
  const Gm = () => (typeof Game !== 'undefined' ? Game : null);
  const getG = () => { const g = Gm(); return g && g.G ? g.G : null; };
  const off = () => { const D = DF(); return !D || D.off; };

  // §17.2 固定 props（不含 scatter；美术渲完后由 assets 覆盖）
  const PROPS43 = [
    ['portal', 10, 20], ['noticeboard', 12, 17], ['stonelamp', 8, 16], ['stonelamp', 12, 19],
    ['mat', 9, 9], ['jade', 11, 11], ['incense', 10, 8],
    ['herb', 3, 3], ['herb', 5, 3], ['herb', 3, 5], ['herb', 5, 5], ['herb', 6, 6], ['haystack', 2, 7],
    ['furnace', 15, 3], ['bigfurnace', 18, 3], ['crates', 17, 5],
    ['pavilion', 3, 12], ['bamboo', 2, 9],
    ['dummy', 17, 11], ['dummy', 18, 13], ['well', 15, 13],
    ['house', 3, 17],
    ['altar', 16, 17], ['obelisk', 18, 19], ['chest', 19, 16]
  ];

  const UI43 = {
    ID, PROPS: PROPS43, off: false,
    isHome() { try { return typeof R !== 'undefined' && R && R.mapId === ID; } catch (e) { return false; } },
    storyBlock() {
      const D = DF(); if (D && typeof D.storyBlock === 'function') return D.storyBlock();
      try {
        if (typeof NPC37 !== 'undefined' && NPC37 && typeof NPC37.storyBlock === 'function') {
          const r = NPC37.storyBlock(); if (r) return r;
        }
      } catch (e) { }
      try { if (typeof B !== 'undefined' && B && B.on) return 'battle'; } catch (e) { }
      return null;
    },
    canPopup() { return !this.storyBlock(); },
    toast(msg, c) { try { if (typeof UI !== 'undefined' && UI.toast) UI.toast(msg, c); } catch (e) { } },
    async card(title, body, por, opts) {
      try {
        if (typeof UI !== 'undefined' && typeof UI.card === 'function') return await UI.card(title, body, por || 'i:scroll', opts || ['好']);
      } catch (e) { console.warn('[dongfu43_ui] card', e); }
      return -1;
    },
    pick(a) {
      if (!a || !a.length) return '';
      const g = Gm();
      if (g && typeof g.roll === 'function') {
        let idx = 0;
        for (let i = 1; i < a.length; i++) if (g.roll(1 / (i + 1), 'dongfu43')) idx = i;
        return a[idx];
      }
      return a[Math.floor(Math.random() * a.length) % a.length];
    },

    // ---- MAPINFO + AS.maps 占位（仿 maps26 wendao / xianjie31）----
    registerMap() {
      const D = DF(); if (!D) return false;
      try {
        if (typeof MAPINFO !== 'undefined' && MAPINFO && !MAPINFO[ID]) {
          MAPINFO[ID] = Object.assign({}, D.MAPINFO || {});
        }
      } catch (e) { console.warn('[dongfu43_ui] MAPINFO', e); }
      try {
        const AS = W.ASSETS || (typeof ASSETS !== 'undefined' ? ASSETS : null);
        if (!AS || !AS.maps || AS.maps[ID]) return true;
        const base = AS.maps.sect || AS.maps.village || AS.maps.heaven;
        if (!base) return true;
        const foot = Object.assign({}, base.foot || {});
        for (const mid in AS.maps) {
          const f = AS.maps[mid] && AS.maps[mid].foot; if (!f) continue;
          for (const k in f) if (!foot[k]) foot[k] = f[k];
        }
        // 兜底：规格 props 的 foot
        const FB = { portal: [2, 1], noticeboard: [1, 1], stonelamp: [1, 1], mat: [1, 1], jade: [2, 2], incense: [1, 1], herb: [1, 1], haystack: [1, 1], furnace: [1, 1], bigfurnace: [2, 2], crates: [1, 1], pavilion: [2, 2], bamboo: [1, 1], dummy: [1, 1], well: [1, 1], house: [2, 2], altar: [1, 1], obelisk: [1, 1], chest: [1, 1], rock: [1, 1], mushroom: [1, 1] };
        for (const k in FB) if (!foot[k]) foot[k] = FB[k];
        const n = 22; const tiles = [];
        for (let j = 0; j < n; j++) {
          let row = '';
          for (let i = 0; i < n; i++) {
            // 占位：全可走石坪（灵泉美术水圈待 Blender；wlx 才不可走）
            if (i === 0 || j === 0 || i === n - 1 || j === n - 1) row += 'r';
            else row += 's';
          }
          tiles.push(row);
        }
        AS.maps[ID] = {
          name: (D.MAPINFO && D.MAPINFO.n) || '自家洞府',
          biome: 'sect', n, tiles, props: PROPS43.slice(),
          foot, propAtlas: Object.assign({}, base.propAtlas), plate: Object.assign({}, base.plate),
          _df43: 1
        };
      } catch (e) { console.warn('[dongfu43_ui] AS.maps', e); }
      return true;
    },

    // ---- 桃花村洞府入口旁坐标（出门落点）----
    villageCavePos() {
      try {
        if (typeof R === 'undefined' || !R || !R.marks) return null;
        const m = R.marks.find(x => x && (x.act === 'cave' || x.key === 'cave'));
        if (m) return [m.i + 0.5, m.j + 0.5];
      } catch (e) { }
      return null;
    },

    // ---- 入口卡（包 Acts.cave）----
    async entryCard() {
      if (off()) { try { await UI.panel('cave'); } catch (e) { } return; }
      const D = DF(); const G = getG(); if (!D || !G) return;
      const opts = D.entryChoices(G); const note = D.entryNote(G);
      const body = (note ? note + '\n\n' : '') + '房契在你手里。天道在房契背面贴了张查封预备。';
      const idx = await this.card('洞府', body, 'i:scroll', opts);
      if (idx < 0 || this.storyBlock()) return;
      const pick = opts[idx];
      if (pick === D.TEXT.btnHome) {
        if (!D.canHome(G)) { this.toast(D.TEXT.lock.mortal); return; }
        try { await Game.travel(ID, true); } catch (e) { console.warn('[dongfu43_ui] travel home', e); }
        return;
      }
      if (pick === D.TEXT.btnPanel) {
        try { await UI.panel('cave'); } catch (e) { }
        return;
      }
    },

    // ---- 出门 ----
    async exitCard() {
      const D = DF(); const G = getG(); if (!D || !G) return;
      const opts = D.exitChoices(G);
      const idx = await this.card('出门', this.pick(D.TEXT.leave), 'i:scroll', opts);
      if (idx < 0 || this.storyBlock()) return;
      const pick = opts[idx];
      if (pick === D.TEXT.btnOut) {
        try {
          // 先记下村内落点：进村后 makeMarks 会出洞府标记，再挪位置
          G._df43Exit = 1;
          await Game.travel('village', true);
        } catch (e) { console.warn('[dongfu43_ui] exit', e); }
        return;
      }
      if (pick === D.TEXT.btnFly) {
        try { if (typeof Acts !== 'undefined' && Acts.portal) await Acts.portal(); } catch (e) { }
        return;
      }
    },

    // ---- 年事卡 ----
    async playYearEvent(inst) {
      if (!inst || this.storyBlock()) return;
      const D = DF(); const G = getG(); if (!D || !G) return;
      const opts = (inst.ch || []).map(c => c.l);
      if (!opts.length) return;
      const idx = await this.card(inst.t || '洞府年事', inst.x || '', 'i:scroll', opts);
      if (idx < 0 || this.storyBlock()) return;
      const res = D.choose(G, inst, idx);
      if (res) await this.card(inst.t || '洞府年事', res, 'i:scroll', ['好']);
      try { if (Gm() && Gm().save) Gm().save(); } catch (e) { }
    },

    // ---- 进门：横幅台词 + 年事 ----
    async onEnterHome() {
      const D = DF(); const G = getG(); if (!D || !G || off()) return;
      try { this.toast(this.pick(D.TEXT.enter), '#9affd0'); } catch (e) { }
      // 始终走 DF43.onEnter：storyBlock 时仍 n++、不 stamp ey（奥拉夫 L2）；有年事再弹卡
      const inst = D.onEnter(G);
      if (inst) await this.playYearEvent(inst);
    },

    // ---- 居民摆放 ----
    clearResidents() {
      try {
        if (typeof R === 'undefined' || !R) return;
        if (R.ents) R.ents = R.ents.filter(e => !(e && e._df43));
        // 出差牌在 marks 上，必须一并清掉，否则 spawn/enter 叠 mark（奥拉夫 M1）
        if (R.marks) R.marks = R.marks.filter(m => !(m && m._df43 && m.act === 'df43_sign'));
      } catch (e) { }
    },
    spawnResidents() {
      if (!this.isHome() || off()) return;
      const D = DF(); const G = getG(); if (!D || !G) return;
      // 幂等：先清 ents + df43_sign，再摆（enterMap 经 refreshNpcs + 外层会调两次）
      this.clearResidents();
      const list = D.residents(G) || [];
      for (const r of list) {
        try {
          const at = r.at || [10, 10];
          let i = at[0], j = at[1];
          try { if (typeof nearestWalk === 'function') { const w = nearestWalk(i, j); i = w[0]; j = w[1]; } } catch (e) { }
          if (r.kind === 'sign') {
            // 出差牌：用 mark 而不是 ent（无精灵）
            try {
              if (R.marks) R.marks.push({ i, j, label: r.label, act: 'df43_sign', key: r.id, h: 80, c: '#c8e8a0', _df43: 1 });
            } catch (e) { }
            continue;
          }
          let spr = r.spr;
          if (!spr && r.kind === 'pet' && r.mon && typeof MONS !== 'undefined' && MONS[r.mon]) spr = MONS[r.mon].spr;
          if (!spr && r.npc && typeof NPCS !== 'undefined' && NPCS[r.npc]) spr = NPCS[r.npc].spr;
          if (!spr && (r.kind === 'spouse' || r.kind === 'apprentice') && r.npc && typeof NPCS !== 'undefined' && NPCS[typeof r.npc === 'string' ? r.npc : '']) {
            spr = NPCS[typeof r.npc === 'string' ? r.npc : r.npc].spr;
          }
          if (!spr && r.kind === 'clone' && Gm() && typeof Gm().playerSpr === 'function') spr = Gm().playerSpr();
          if (!spr) spr = 'npc_disciple';
          // 亲传/道侣：若 DF 层 label 仍是裸 id（如 ah），再从 NPCS 解析一次（奥拉夫 L3）
          let label = r.label;
          if ((r.kind === 'apprentice' || r.kind === 'spouse') && r.npc && typeof NPCS !== 'undefined') {
            const nid = typeof r.npc === 'string' ? r.npc : (r.npc.npc || r.npc.id || '');
            const N = nid && NPCS[nid];
            if (N && N.n) label = String(N.n).split('·').pop();
            else if (r.npc && typeof r.npc === 'object' && r.npc.n) label = String(r.npc.n).split('·').pop();
            else if (!label || label === nid) label = '亲传';
          }
          const ent = {
            kind: 'npc', id: r.id, spr, i: i + 0.5, j: j + 0.5, dir: 'S',
            s: r.s != null ? r.s : 1, label, lc: '#9affd0',
            alpha: r.a != null ? r.a : 1, _df43: 1, _dfKind: r.kind, _dfRef: Object.assign({}, r, { label }),
            home: [i, j], ai: (typeof npcAI === 'function' ? npcAI : null)
          };
          try {
            if (typeof addEnt === 'function') addEnt(ent);
            else R.ents.push(Object.assign({ anim: 'idle', at: 0, path: [], speed: 1.2 }, ent));
            if (typeof loadSprite === 'function') loadSprite(spr);
          } catch (e) { console.warn('[dongfu43_ui] spawn', e); }
        } catch (e) { console.warn('[dongfu43_ui] resident', e); }
      }
    },

    // ---- Talk.npc df_ 分流 ----
    async talkResident(id) {
      const D = DF(); const G = getG(); if (!D || !G) return;
      let e = null;
      try { e = (R.ents || []).find(x => x && x.id === id); } catch (err) { }
      const ref = (e && e._dfRef) || { kind: 'sign', id, label: id };
      const line = D.line(ref, G);
      const opts = ['……'];
      if (ref.kind === 'apprentice') opts.unshift('打开传承');
      const idx = await this.card(ref.label || '洞府', line || '……', 'i:scroll', opts);
      if (idx === 0 && ref.kind === 'apprentice' && opts[0] === '打开传承') {
        try { await UI.panel('legacy26'); } catch (err) { }
      }
    },

    // ---- makeMarks：洞府覆盖 ----
    patchMarks() {
      if (!this.isHome() || off()) return;
      const D = DF(); const G = getG(); if (!D || !G || typeof R === 'undefined' || !R) return;
      const cave = Object.assign({ zl: 0, field: 0, forge: 0 }, G.cave || {});
      // 删掉需覆盖的默认标记（§17.3）
      const kill = new Set(['herb', 'chest', 'noticeboard', 'portal', 'altar', 'obelisk', 'jade', 'mat', 'incense', 'furnace', 'bigfurnace', 'pavilion', 'well', 'house']);
      R.marks = (R.marks || []).filter(m => {
        if (m && m._df43) return true; // 居民出差牌
        const t = m && m.prop && m.prop.t;
        const a = m && m.act;
        if (kill.has(t) || kill.has(a) || (a && String(a).indexOf('df43_') === 0 && a !== 'df43_sign')) return false;
        return true;
      });
      const push = (prop, label, act, extra) => {
        if (!prop) return;
        let ti = prop.i + Math.floor((prop.fw || 1) / 2), tj = prop.j + (prop.fh || 1);
        try { if (typeof NONBLOCK !== 'undefined' && NONBLOCK.has(prop.t)) { ti = prop.i; tj = prop.j; } } catch (e) { }
        let i = ti, j = tj;
        try { if (typeof nearestWalk === 'function') { const w = nearestWalk(ti, tj); i = w[0]; j = w[1]; } } catch (e) { }
        R.marks.push(Object.assign({ i, j, label, act, key: 'df43_' + act + '_' + prop.i + '_' + prop.j, prop, h: 100, _df43: 1 }, extra || {}));
      };
      const props = R.props || [];
      const find = (t, oi, oj) => props.find(p => p.t === t && (oi == null || (p.i === oi && p.j === oj)));
      const all = t => props.filter(p => p.t === t);

      // portal
      const portal = find('portal', 10, 20) || find('portal');
      if (portal) push(portal, '出门', 'df43_exit');
      // noticeboard
      const nb = find('noticeboard', 12, 17) || find('noticeboard');
      if (nb) push(nb, '洞府账本', 'df43_book');
      // mat
      const mat = find('mat', 9, 9) || find('mat');
      if (mat) push(mat, '静室打坐', 'df43_mat');
      // jade / 灵泉
      const jade = find('jade', 11, 11) || find('jade');
      if (jade) {
        const lock = D.lockMsg('jade', G);
        push(jade, lock ? '🔒 灵泉' : '灵泉', 'df43_spring');
      }
      // incense
      const inc = find('incense', 10, 8) || find('incense');
      if (inc) push(inc, '祖师牌位', 'df43_incense');
      // herbs
      const herbs = all('herb');
      herbs.forEach((p, k) => {
        // 按 HERB_AT 匹配序号；找不到就按出现顺序
        let idx = -1;
        const AT = D.HERB_AT || [];
        for (let i = 0; i < AT.length; i++) if (AT[i][0] === p.i && AT[i][1] === p.j) { idx = i; break; }
        if (idx < 0) idx = k;
        const lit = D.herbLit(G, idx);
        const lock = D.lockMsg('herb', G, idx);
        push(p, lit ? '照看灵田' : ('🔒 灵田'), 'df43_herb', { _herbK: idx, hidden: false });
      });
      // furnace
      const fur = find('furnace', 15, 3) || find('furnace');
      if (fur) push(fur, cave.forge >= 3 ? '丹房·八卦火' : '丹房', 'df43_alch');
      // bigfurnace
      const bf = find('bigfurnace', 18, 3) || find('bigfurnace');
      if (bf) {
        const lock = D.lockMsg('bigfurnace', G);
        push(bf, lock ? '🔒 炼器炉' : '炼器炉', 'df43_forge');
      }
      // pavilion
      const pav = find('pavilion', 3, 12) || find('pavilion');
      if (pav) {
        const lock = D.lockMsg('pavilion', G);
        push(pav, lock ? '🔒 灵兽园' : '灵兽园', 'df43_pets');
      }
      // well
      const well = find('well', 15, 13) || find('well');
      if (well) {
        const lock = D.lockMsg('well', G);
        push(well, lock ? '🔒 弟子院' : '弟子院', 'df43_well');
      }
      // house
      const house = find('house', 3, 17) || find('house');
      if (house) {
        const lock = D.lockMsg('house', G);
        push(house, lock ? '🔒 家' : '家', 'df43_home');
      }
      // altar
      const altar = find('altar', 16, 17) || find('altar');
      if (altar) {
        const lock = D.lockMsg('altar', G);
        push(altar, lock ? '🔒 神器阁' : '神器阁', 'df43_altar');
      }
      // obelisk：无 zf39 模块时不出
      const ob = find('obelisk', 18, 19) || find('obelisk');
      if (ob && typeof ZF39 !== 'undefined') {
        const lock = D.lockMsg('obelisk', G);
        push(ob, lock ? '🔒 阵眼台' : '阵眼台', 'df43_eye');
      }
      // chest → 库房
      const chest = find('chest', 19, 16) || find('chest');
      if (chest) {
        let lab = '洞府库房';
        try {
          const y = typeof G.year === 'number' ? G.year : G.age;
          const log = Array.isArray(G.pd35log) ? G.pd35log : [];
          const n = log.filter(x => x && (x.y === y || x.year === y)).length;
          if (n > 0) lab += ' ·' + n;
        } catch (e) { }
        push(chest, lab, 'df43_bag');
      }
    },

    bagCountHint(G) {
      try {
        const y = typeof G.year === 'number' ? G.year : G.age;
        const log = Array.isArray(G.pd35log) ? G.pd35log : [];
        return log.filter(x => x && (x.y === y || x.year === y)).length;
      } catch (e) { return 0; }
    }
  };

  // ---- Acts ----
  function installActs() {
    if (typeof Acts === 'undefined' || !Acts) return;
    // 包装原 Acts.cave（systems21 面板），off 或不适用时回落原实现（奥拉夫 L1）
    if (!Acts.cave || !Acts.cave._df43) {
      const _cave = typeof Acts.cave === 'function' ? Acts.cave : null;
      Acts.cave = async function () {
        if (off()) {
          if (_cave) return await _cave.apply(this, arguments);
          try { await UI.panel('cave'); } catch (e) { }
          return;
        }
        await UI43.entryCard();
      };
      Acts.cave._df43 = 1;
    }
    Acts.df43_exit = async function () { await UI43.exitCard(); };
    Acts.df43_book = async function () { try { await UI.panel('cave'); } catch (e) { } };
    Acts.df43_mat = async function (m) {
      const D = DF(); const G = getG(); if (!D || !G) return;
      const mul = D.medMul(G);
      try { await Acts.mat(m, mul); } catch (e) { console.warn('[dongfu43_ui] mat', e); }
    };
    Acts.df43_spring = async function () {
      const D = DF(); const G = getG(); if (!D || !G) return;
      const lock = D.lockMsg('jade', G);
      if (lock) { await UI43.card('灵泉', lock, 'i:scroll', ['好']); return; }
      const r = D.spring(G);
      await UI43.card('灵泉', r.msg || '', 'i:scroll', ['好']);
      try { if (Gm() && Gm().save) Gm().save(); } catch (e) { }
    };
    Acts.df43_incense = async function (m) {
      const D = DF(); const G = getG();
      if (D && G && G.apprentice) {
        const line = D.tabletLine(G);
        await UI43.card('祖师牌位', line, 'i:scroll', ['上香', '算了']).then(async idx => {
          if (idx === 0) {
            try { await Acts.incense(m); } catch (e) { }
          }
        });
        return;
      }
      try { await Acts.incense(m); } catch (e) { }
    };
    Acts.df43_herb = async function (m) {
      const D = DF(); const G = getG(); if (!D || !G) return;
      const k = (m && m._herbK != null) ? m._herbK : 0;
      const lock = D.lockMsg('herb', G, k);
      if (lock) { await UI43.card('灵田', lock, 'i:scroll', ['好']); return; }
      const r = D.harvest(G);
      await UI43.card('照看灵田', r.msg || '', 'i:scroll', ['好']);
      try { if (Gm() && Gm().save) Gm().save(); UI.hud && UI.hud(); } catch (e) { }
    };
    Acts.df43_alch = async function () {
      const D = DF(); const G = getG(); const bonus = D ? D.alchBonus(G) : 0;
      try { await UI.alchemy(bonus); } catch (e) { console.warn('[dongfu43_ui] alch', e); }
    };
    Acts.df43_forge = async function () {
      const D = DF(); const G = getG(); if (!D || !G) return;
      const lock = D.lockMsg('bigfurnace', G);
      if (lock) { await UI43.card('炼器炉', lock, 'i:scroll', ['好']); return; }
      const opts = ['打开洞府账本'];
      if (typeof LIAN35 !== 'undefined') opts.push('一键连炼');
      opts.push('算了');
      const idx = await UI43.card('炼器炉', '炉火正旺。要升级炼器炉请去洞府账本。', 'i:scroll', opts);
      if (idx === 0) { try { await UI.panel('cave'); } catch (e) { } }
      else if (idx === 1 && typeof LIAN35 !== 'undefined') {
        try {
          if (typeof UI.alchemy === 'function') await UI.alchemy(0); // 连炼入口多挂在炼丹/洞府；无专用入口时回账本
          else await UI.panel('cave');
        } catch (e) { }
      }
    };
    Acts.df43_pets = async function () {
      const D = DF(); const G = getG(); if (!D || !G) return;
      const lock = D.lockMsg('pavilion', G);
      if (lock) { await UI43.card('灵兽园', lock, 'i:scroll', ['好']); return; }
      try { await UI.panel('pets'); } catch (e) { }
    };
    Acts.df43_well = async function () {
      const D = DF(); const G = getG(); if (!D || !G) return;
      const lock = D.lockMsg('well', G);
      if (lock) { await UI43.card('弟子院', lock, 'i:scroll', ['好']); return; }
      try { await UI.panel('legacy26'); } catch (e) { }
    };
    Acts.df43_home = async function () {
      const D = DF(); const G = getG(); if (!D || !G) return;
      const lock = D.lockMsg('house', G);
      if (lock) { await UI43.card('家', lock, 'i:scroll', ['好']); return; }
      try {
        if (typeof UI.p_pf38 === 'function') await UI.panel('pf38', '_me');
        else if (typeof UI.p_fam37 === 'function') await UI.panel('fam37');
        else await UI.panel('char');
      } catch (e) { }
    };
    Acts.df43_altar = async function () {
      const D = DF(); const G = getG(); if (!D || !G) return;
      const lock = D.lockMsg('altar', G);
      if (lock) { await UI43.card('神器阁', lock, 'i:scroll', ['好']); return; }
      try {
        if (typeof Acts.sq36 === 'function') await Acts.sq36();
        else if (typeof SQ36 !== 'undefined' && SQ36.onClue) await SQ36.onClue();
        else UI43.toast('神器阁暂时无法打开');
      } catch (e) { }
    };
    Acts.df43_eye = async function () {
      const D = DF(); const G = getG(); if (!D || !G) return;
      const lock = D.lockMsg('obelisk', G);
      if (lock) { await UI43.card('阵眼台', lock, 'i:scroll', ['好']); return; }
      try {
        if (typeof UI !== 'undefined') {
          UI._zf39tab = 'cave';
          await UI.panel('zf39', 'cave');
        }
      } catch (e) { console.warn('[dongfu43_ui] zf39', e); }
    };
    Acts.df43_bag = async function () { try { await UI.panel('bag'); } catch (e) { } };
    Acts.df43_sign = async function (m) {
      await UI43.card('出差中', (m && m.label) || '窝里留着一根毛。', 'i:scroll', ['好']);
    };
  }

  // ---- 包装挂钩 ----
  function hook() {
    if (off()) return;
    if (W.__df43Ui) return;
    W.__df43Ui = 1;
    UI43.registerMap();
    installActs();

    // makeMarks
    try {
      if (typeof Game !== 'undefined' && Game.makeMarks && !Game.makeMarks._df43) {
        const _mm = Game.makeMarks;
        Game.makeMarks = function () {
          const r = _mm.apply(this, arguments);
          try { UI43.patchMarks(); } catch (e) { console.warn('[dongfu43_ui] makeMarks', e); }
          return r;
        };
        Game.makeMarks._df43 = 1;
      }
    } catch (e) { }

    // enterMap：进洞府弹年事；从洞府回村落到标记旁
    try {
      if (typeof Game !== 'undefined' && Game.enterMap && !Game.enterMap._df43) {
        const _em = Game.enterMap;
        Game.enterMap = async function (id) {
          const from = (typeof R !== 'undefined' && R) ? R.mapId : null;
          const r = await _em.apply(this, arguments);
          try {
            if (id === ID && !off()) {
              UI43.spawnResidents();
              await UI43.onEnterHome();
            }
            if (id === 'village' && this.G && this.G._df43Exit) {
              delete this.G._df43Exit;
              const pos = UI43.villageCavePos();
              if (pos && R.player) {
                R.player.i = pos[0]; R.player.j = pos[1]; R.player.path = [];
                this.G.pos = pos;
              }
            }
            if (from === ID && id !== ID) {
              const D = DF(); if (D) try { UI43.toast(UI43.pick(D.TEXT.leave)); } catch (e) { }
            }
          } catch (e) { console.warn('[dongfu43_ui] enterMap', e); }
          return r;
        };
        Game.enterMap._df43 = 1;
      }
    } catch (e) { }

    // refreshNpcs：保留/重摆洞府居民
    try {
      if (typeof Game !== 'undefined' && Game.refreshNpcs && !Game.refreshNpcs._df43) {
        const _rn = Game.refreshNpcs;
        Game.refreshNpcs = function () {
          const r = _rn.apply(this, arguments);
          try { if (UI43.isHome()) UI43.spawnResidents(); } catch (e) { }
          return r;
        };
        Game.refreshNpcs._df43 = 1;
      }
    } catch (e) { }

    // Talk.npc：df_ 前缀
    try {
      if (typeof Talk !== 'undefined' && Talk.npc && !Talk.npc._df43) {
        const _npc = Talk.npc.bind(Talk);
        Talk.npc = async function (id) {
          if (id && String(id).indexOf('df_') === 0) { await UI43.talkResident(id); return; }
          return _npc(id);
        };
        Talk.npc._df43 = 1;
      }
    } catch (e) { }

    // UI.p_travel：筑基起置顶「回洞府」
    try {
      if (typeof UI !== 'undefined' && UI.p_travel && !UI.p_travel._df43) {
        const _tr = UI.p_travel;
        UI.p_travel = function (b, re, close) {
          const r = _tr.apply(this, arguments);
          try {
            const D = DF(); const G = getG();
            if (!off() && D && G && D.travelRow(G) && b && b.insertAdjacentHTML) {
              const row = `<button class="mapb df43home" data-df43="home"><b>${D.TEXT.travelRow}</b><small>不耗行动力 · 不在御剑名册里</small><em>🏠</em></button>`;
              b.insertAdjacentHTML('afterbegin', row);
              const btn = b.querySelector('[data-df43="home"]');
              if (btn) btn.onclick = async e => {
                e.stopPropagation();
                try { if (close) close(); } catch (err) { }
                try { await Game.travel(ID, true); } catch (err) { console.warn(err); }
              };
            }
          } catch (e) { console.warn('[dongfu43_ui] p_travel', e); }
          return r;
        };
        UI.p_travel._df43 = 1;
      }
    } catch (e) { }

    // 自动任务：在洞府则先回村
    try {
      if (typeof AUTO !== 'undefined' && AUTO && AUTO.tick && !AUTO.tick._df43) {
        const _tk = AUTO.tick.bind(AUTO);
        AUTO.tick = async function () {
          try {
            if (this.on && UI43.isHome()) {
              UI43.toast((DF() && DF().TEXT.auto_block) || '家里没怪可打。');
              try { await Game.travel('village', true); } catch (e) { }
              return;
            }
          } catch (e) { }
          return _tk();
        };
        AUTO.tick._df43 = 1;
      }
    } catch (e) { }

    // 挂机：洞府内拒绝开始
    try {
      if (typeof AFK !== 'undefined' && AFK && AFK.ask && !AFK.ask._df43) {
        const _ask = AFK.ask.bind(AFK);
        AFK.ask = async function () {
          if (UI43.isHome()) {
            UI43.toast((DF() && DF().TEXT.auto_block) || '家里没怪可打。去外面挂机吧。');
            return;
          }
          return _ask();
        };
        AFK.ask._df43 = 1;
      }
    } catch (e) { }

    // 路遇：洞府内不触发（df_ 本无 TEXT37.lines；再包一层 idle）
    try {
      if (typeof NPC37 !== 'undefined' && NPC37 && NPC37.idle && !NPC37.idle._df43) {
        const _id = NPC37.idle.bind(NPC37);
        NPC37.idle = function () {
          try { if (UI43.isHome()) return false; } catch (e) { }
          return _id();
        };
        NPC37.idle._df43 = 1;
      }
    } catch (e) { }

    // life34 来客：无怪图本就不触发；再守一层
    try {
      if (typeof Life34 !== 'undefined' && Life34 && Life34.tick && !Life34.tick._df43) {
        // 无统一 tick 名则跳过；showPending 在文件内是 IIFE 调用
      }
    } catch (e) { }
  }

  // DevPanel「洞府43」
  function dev43() {
    const reg = () => {
      const render = (box, ctx) => {
        try {
          const G = getG();
          if (!G) { box.innerHTML = '<p class="hint">未开局</p>'; return; }
          const D = DF(); const S = D ? D.st(G) : {};
          box.innerHTML = `<p class="hint">洞府43 · n=${S.n|0} · ey=${S.ey} · hv=${S.hv} · map=${(typeof R!=='undefined'&&R)?R.mapId:'?'}</p>` +
            ['go:传送到自家洞府', 'panel:洞府总览', 'ev:强制洞府年事', 'sp:重置灵泉/手采', 'res:重摆居民', 'cave:洞府满级'].map(x => {
              const [a, n] = x.split(':');
              return `<button class="opt" data-a="${a}">${n}</button>`;
            }).join('');
          box.onclick = async (e) => {
            const t = e.target.closest && e.target.closest('button[data-a]');
            const a = t && t.dataset && t.dataset.a; if (!a) return;
            const G2 = getG(); if (!G2) return;
            if (a === 'go') {
              G2.flags = G2.flags || {}; G2.flags.awakened = 1;
              G2.realm = Math.max(G2.realm | 0, 1);
              UI43.registerMap();
              try { await Game.travel(ID, true); } catch (err) { ctx && ctx.toast && ctx.toast('传送失败'); }
              ctx && ctx.toast && ctx.toast('已到洞府');
            } else if (a === 'panel') {
              try { await UI.panel('cave'); } catch (err) { }
            } else if (a === 'ev') {
              const D2 = DF(); if (!D2) return;
              const S2 = D2.st(G2); S2.ey = -1;
              const inst = D2.onEnter(G2);
              if (inst) await UI43.playYearEvent(inst);
              else ctx && ctx.toast && ctx.toast('无年事（可能 storyBlock）');
            } else if (a === 'sp') {
              const D2 = DF(); if (!D2) return;
              const S2 = D2.st(G2); S2.sp = -1; S2.hv = -1;
              ctx && ctx.toast && ctx.toast('已重置灵泉/手采年戳');
            } else if (a === 'res') {
              UI43.spawnResidents(); ctx && ctx.toast && ctx.toast('已重摆');
            } else if (a === 'cave') {
              G2.cave = { zl: 5, field: 5, forge: 4 };
              ctx && ctx.toast && ctx.toast('洞府建筑满级');
            }
            ctx && ctx.save && ctx.save();
            if (ctx && ctx.rerender) ctx.rerender(); else render(box, ctx);
          };
        } catch (err) { box.innerHTML = '<p class="hint">洞府43 面板错误</p>'; console.warn('[dongfu43_ui] dev', err); }
      };
      if (typeof W !== 'undefined' && W.DevPanel && typeof DevPanel.registerTab === 'function') {
        DevPanel.registerTab('dongfu43', '洞府43', render);
        return true;
      }
      try {
        const tabs = (W.DevTabs = W.DevTabs || []);
        if (!tabs.some(t => t && (t.key === 'dongfu43' || t.id === 'dongfu43'))) {
          tabs.push({ key: 'dongfu43', id: 'dongfu43', name: '洞府43', render });
        }
        return true;
      } catch (e) { return false; }
    };
    if (typeof W !== 'undefined') {
      if (!reg()) setTimeout(reg, 500);
    }
  }

  // 导出
  W.DF43UI = UI43;
  if (typeof module !== 'undefined' && module.exports) module.exports = UI43;

  // 启动：等 DF43；浏览器里挂钩
  const boot = () => {
    if (!DF()) { setTimeout(boot, 0); return; }
    try { UI43.registerMap(); } catch (e) { }
    if (typeof UI !== 'undefined' && typeof Game !== 'undefined') {
      try { hook(); } catch (e) { console.warn('[dongfu43_ui] hook', e); }
      try { dev43(); } catch (e) { }
    } else {
      // node 单测：只登记，不挂钩
      try { UI43.registerMap(); } catch (e) { }
    }
  };
  boot();
})(typeof window !== 'undefined' ? window : globalThis);

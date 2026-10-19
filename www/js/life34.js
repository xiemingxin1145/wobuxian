'use strict';
// ======================= 3.4 江湖自转：自主 NPC 与宗门 + 地图奇遇链（第一片） =======================
// 设计（鬼谷八荒式「世界自己在动」）：
//  - 6 位有名有姓的江湖人物（NPCS.jh_*），各有宗门、性格、境界、灵石、欠款。每个游戏月推进一次：
//    修炼/突破、在相邻地图之间游历（按 Seam34 邻接或 MAP_ORDER 相邻，受境界门槛限制，不进桃花村/问道崖）、
//    向讨债司借钱/还钱、还玩家借给他们的钱。玩家所在地图会真的多出/少掉这些人（NPCS[id].roam）。
//  - 三宗（SECTS）每年按门人境界和随机波动涨落「势力」，关系最差的两宗可能爆发冲突（读写 war29 的 G.sectRel）。
//  - 一切写进「江湖风云」（更多 → 江湖风云），重要的在本图/本宗发生的事会 toast。
//  - 地图奇遇链 CH34：数据驱动的多步奇遇（推广 stage3_encounter_draft.js），每步绑定 NPC，可要求 NPC 身在某图；
//    选择修改 G.debt / G.aff / 灵石 / 修为 / 物品。对话入口以「⚑ 奇遇·」开头——不在自动任务 SAFE 白名单里，挂机/自动任务不会替玩家选。
// 存档：G.life34 = { v, t(绝对月), npcs{}, sects{}, feed[], ch{} }，缺省即惰性初始化，不改 G.v；新人生是新的江湖。
const Life34 = {
  V: 1, FEED_MAX: 40, AFF_MAX: 150,
  // id, 名字, 精灵, 宗门, 老家, 性格（cult 修炼 / roam 游历 / debt 借钱 / war 好斗 / trade 经商）, 初始境界, 资质
  CAST: [
    ['jh_jianke', '游方剑客·萧十三', 'npc_zhuiming', 'qingyun', 'sect', 'cult', 2, 1.2],
    ['jh_danniang', '丹娘·苏半夏', 'npc_sanniang', 'baicao', 'market', 'trade', 1, 1.0],
    ['jh_mozi', '魔修·厉无咎', 'npc_guizu', 'tianmo', 'rift', 'war', 4, 1.1],
    ['jh_tieguo', '散修·赵铁锅', 'npc_keeper', null, 'market', 'debt', 1, 0.7],
    ['jh_xunbao', '寻宝客·钱满仓', 'npc_suanpan', null, 'secret', 'roam', 2, 0.9],
    ['jh_yangui', '女侠·燕归', 'npc_guanghan', 'qingyun', 'island', 'roam', 3, 1.0],
  ],
  LINES: {
    jh_jianke: ['剑在人在，剑不在……那就是被当铺收了。', '我在找一块能磨剑的石头，最好不要钱。'],
    jh_danniang: ['新炼的回春丹，童叟无欺，副作用另附说明书。', '丹炉又炸了，这个月白干。'],
    jh_mozi: ['正道说我是魔头，讨债司说我是客户。', '天魔殿的年终奖又是欠条。'],
    jh_tieguo: ['这口铁锅是我全部家当，也是我全部债务。', '借钱的事……你听我解释。'],
    jh_xunbao: ['我手里有张藏宝图，可惜只有一半。', '每个秘境我都去过，每个秘境都欠了门票钱。'],
    jh_yangui: ['路见不平，拔刀相助；刀是借的。', '东海的风浪大，讨债司的船更大。'],
  },
  GOAL_N: { cult: '闭关苦修', roam: '四处游历', debt: '躲债', war: '找人切磋', trade: '跑买卖' },
  G() { return typeof Game !== 'undefined' ? Game.G : null; },
  now(G) { return (G.year || 0) * 12 + (G.month || 0); },
  ensure(G) {
    G = G || this.G(); if (!G) return null;
    let L = G.life34;
    if (!L || typeof L !== 'object' || L.v !== this.V) {
      L = G.life34 = { v: this.V, t: this.now(G), npcs: {}, sects: {}, feed: [], ch: {} };
    }
    if (!L.npcs || typeof L.npcs !== 'object') L.npcs = {};
    if (!L.sects || typeof L.sects !== 'object') L.sects = {};
    if (!Array.isArray(L.feed)) L.feed = [];
    if (!L.ch || typeof L.ch !== 'object') L.ch = {};
    if (typeof L.t !== 'number') L.t = this.now(G);
    for (const [id, , , sect, home, goal, realm, apt] of this.CAST) {
      const s = L.npcs[id] || (L.npcs[id] = {});
      if (typeof s.map !== 'string' || !this.okMap(s.map)) s.map = home;
      if (typeof s.realm !== 'number') s.realm = realm; if (typeof s.stage !== 'number') s.stage = 0; if (typeof s.p !== 'number') s.p = 0;
      if (typeof s.stone !== 'number') s.stone = 100 + realm * 120; if (typeof s.debt !== 'number') s.debt = goal === 'debt' ? 600 : 0;
      if (typeof s.owe !== 'number') s.owe = 0; if (s.sect === undefined) s.sect = sect; if (!s.goal) s.goal = goal; if (typeof s.apt !== 'number') s.apt = apt;
      if (typeof s.inj !== 'number') s.inj = 0;
      if (!this.canGo(s, s.map)) s.map = home;
    }
    for (const sid in SECTS) { const S = L.sects[sid] || (L.sects[sid] = {}); if (typeof S.pow !== 'number') S.pow = 100; if (typeof S.wins !== 'number') S.wins = 0; if (typeof S.loss !== 'number') S.loss = 0; }
    return L;
  },
  okMap(m) { return typeof MAPINFO !== 'undefined' && !!MAPINFO[m] && m !== 'village' && m !== 'wendao' && (typeof MAP_ORDER === 'undefined' || MAP_ORDER.includes(m)); },
  nm(id) { const N = NPCS[id]; return N ? N.n.split('·').pop() : id; },
  mapN(m) { return MAPINFO[m] ? MAPINFO[m].n : m; },
  mapOf(id) { const G = this.G(); const c = this.CAST.find(x => x[0] === id); if (!G || !G.life34 || !G.life34.npcs[id]) return c ? c[4] : null; return G.life34.npcs[id].map; },
  neighbors(m) {
    const out = new Set();
    if (typeof Seam34 !== 'undefined' && Seam34.links) { if (!Object.keys(Seam34.links).length && Seam34.build) try { Seam34.build(); } catch (e) { } const l = Seam34.links[m]; if (l) for (const k in l) if (l[k]) out.add(l[k]); }
    if (typeof MAP_ORDER !== 'undefined') { const k = MAP_ORDER.indexOf(m); if (k > 0) out.add(MAP_ORDER[k - 1]); if (k >= 0 && k < MAP_ORDER.length - 1) out.add(MAP_ORDER[k + 1]); }
    return [...out].filter(x => this.okMap(x));
  },
  canGo(s, m) { const I = MAPINFO[m]; return !!I && (I.need || 0) <= s.realm; },
  say(L, s, k, notable) { L.feed.push({ t: L.t, s, k: k || '' }); if (L.feed.length > this.FEED_MAX) L.feed.splice(0, L.feed.length - this.FEED_MAX); if (notable && typeof UI !== 'undefined' && UI.toast) this._toasts.push(s); },
  _toasts: [],
  when(t) { return `${Math.floor(t / 12)}年${(t % 12) + 1}月`; },
  // ---- 每月一步 ----
  stepMonth(G, L) {
    const here = typeof R !== 'undefined' && R.mapId;
    for (const [id] of this.CAST) {
      const s = L.npcs[id]; const n = this.nm(id);
      // 修炼（受伤时减半）
      const maxR = 6; if (s.inj > 0) s.inj--;
      if (s.realm < maxR) {
        s.p += s.apt * (s.goal === 'cult' ? 1.6 : 1) * (s.inj ? 0.5 : 1) * (0.6 + Math.random() * 0.8) / (8 * Math.pow(1.35, s.realm));
        if (s.p >= 1) { s.p = 0;
          if (s.stage < 3) s.stage++;
          else { const ch = (REALMS[s.realm].brk || 0.3) * 0.9;
            if (Math.random() < ch) { s.realm++; s.stage = 0; this.say(L, `${n}突破至【${REALMS[s.realm].n}】，${this.mapN(s.map)}上空霞光三日不散。`, 'brk', s.map === here); }
            else { s.inj = 6; s.p = 0.3; this.say(L, `${n}冲击${REALMS[s.realm + 1].n}失败，闭关养伤半年。`, 'fail'); } }
        }
      }
      // 游历
      const pr = { roam: 0.22, war: 0.12, trade: 0.1, debt: 0.08, cult: 0.05 }[s.goal] || 0.08;
      if (!s.inj && !s.hold && Math.random() < pr) {
        const nb = this.neighbors(s.map).filter(m => this.canGo(s, m)); const home = this.CAST.find(x => x[0] === id)[4];
        // 离家太久会想回去：一半概率朝老家方向（邻图里优先老家）
        let to = nb.includes(home) && Math.random() < 0.35 ? home : nb[Math.floor(Math.random() * nb.length)];
        if (to && to !== s.map) { const from = s.map; s.map = to;
          if (to === here) this.say(L, `${n}从${this.mapN(from)}来到了${this.mapN(to)}。`, 'move', true);
          else if (from === here) this.say(L, `${n}离开${this.mapN(from)}，往${this.mapN(to)}去了。`, 'move', true);
          else if (Math.random() < 0.3) this.say(L, `有人在${this.mapN(to)}见到了${n}。`, 'move'); }
      }
      // 灵石：收入与花销
      s.stone += Math.round((s.goal === 'trade' ? 40 : 15) * (1 + s.realm) * (0.5 + Math.random()));
      s.stone -= Math.round((s.goal === 'debt' ? 30 : 10) * (1 + s.realm) * Math.random());
      if (s.stone < 0) { const b = Math.round(-s.stone + 100 * (1 + s.realm)); s.stone += b; s.debt += b; if (Math.random() < 0.6) this.say(L, `${n}手头紧，又向天道讨债司借了 ${fmt(b)} 灵石。`, 'debt'); }
      if (s.debt > 0 && s.stone > s.debt * 1.5 && Math.random() < 0.4) { const p = s.debt; s.stone -= p; s.debt = 0; this.say(L, `${n}还清了讨债司的 ${fmt(p)} 灵石，账房先生难得露出了笑容。`, 'repay'); }
      if (s.owe > 0 && s.stone > s.owe * 1.4 && Math.random() < 0.5) {
        const back = Math.round(s.owe * 1.2); s.stone -= back; G.stone = (G.stone || 0) + back; this.addAff(G, id, 8);
        this.say(L, `${n}托人捎来 ${fmt(back)} 灵石：“上回借你的，连本带利。”`, 'repay', true); s.owe = 0;
      }
    }
    if (L.t % 12 === 0) this.stepYear(G, L);
  },
  relKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; },
  stepYear(G, L) {
    const ids = Object.keys(SECTS); if (!G.sectRel || typeof G.sectRel !== 'object') G.sectRel = {};
    const before = ids.slice().sort((a, b) => L.sects[b].pow - L.sects[a].pow);
    for (const sid of ids) { const S = L.sects[sid]; let d = (Math.random() - 0.45) * 8;
      for (const [id] of this.CAST) { const s = L.npcs[id]; if (s.sect === sid) d += s.realm * 0.8; }
      if (G.sect === sid) d += (G.realm || 0) * 1.2;
      S.pow = Math.max(30, Math.min(400, Math.round((S.pow + d) * 10) / 10)); }
    // 宗门冲突：关系最差的一对；玩家正在打宗门战（war29）时不另起冲突
    if (!(G.war && G.war.active)) {
      let worst = null; for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) { const r = G.sectRel[this.relKey(ids[a], ids[b])] || 0; if (!worst || r < worst[2]) worst = [ids[a], ids[b], r]; }
      if (worst && Math.random() < 0.12 + Math.max(0, -worst[2]) / 400) {
        const [a, b] = worst; const pa = L.sects[a].pow * (0.7 + Math.random() * 0.6), pb = L.sects[b].pow * (0.7 + Math.random() * 0.6);
        const [w, l] = pa >= pb ? [a, b] : [b, a]; L.sects[w].pow = Math.round(L.sects[w].pow * 1.08); L.sects[l].pow = Math.max(30, Math.round(L.sects[l].pow * 0.85));
        L.sects[w].wins++; L.sects[l].loss++; const k = this.relKey(a, b); G.sectRel[k] = Math.max(-100, (G.sectRel[k] || 0) - 5);
        const mine = G.sect === w || G.sect === l;
        this.say(L, `【宗门冲突】${SECTS[w].n}与${SECTS[l].n}在边境大打出手，${SECTS[w].n}占了上风。${mine ? (G.sect === w ? '（同门士气大振，贡献 +10）' : '（同门灰头土脸，贡献 −5）') : ''}`, 'war', mine);
        if (mine) G.contrib = Math.max(0, (G.contrib || 0) + (G.sect === w ? 10 : -5));
        for (const [id] of this.CAST) { const s = L.npcs[id]; if (s.sect === l && Math.random() < 0.5) { s.inj = 4; } }
      }
    }
    const after = ids.slice().sort((a, b) => L.sects[b].pow - L.sects[a].pow);
    if (after[0] !== before[0]) this.say(L, `【风云】${SECTS[after[0]].n}势力压过${SECTS[before[0]].n}，成为天下第一宗。`, 'rank', G.sect === after[0] || G.sect === before[0]);
  },
  // 把世界推进到当前月（幂等；跨度上限 24 个月，防止老档/跳年一次算太久）
  sync() {
    const G = this.G(); if (!G || G.dead) return 0; const L = this.ensure(G); const to = this.now(G);
    if (to <= L.t) { L.t = Math.min(L.t, to); return 0; }
    const where0 = {}; for (const [id] of this.CAST) where0[id] = L.npcs[id].map;
    let n = 0; if (to - L.t > 24) L.t = to - 24;
    while (L.t < to) { L.t++; this.stepMonth(G, L); n++; }
    // 本图有人来去 → 重刷 NPC
    if (typeof R !== 'undefined' && R.mode === 'map' && R.mapId) { const moved = this.CAST.some(([id]) => (where0[id] === R.mapId) !== (L.npcs[id].map === R.mapId)); if (moved && Game.refreshNpcs) try { Game.refreshNpcs(); } catch (e) { console.warn(e); } }
    const ts = this._toasts.splice(0); if (typeof UI !== 'undefined' && UI.toast) ts.slice(-2).forEach((t, k) => setTimeout(() => UI.toast(t, '#ffd8a0'), 400 + k * 1600));
    return n;
  },
  addAff(G, id, d) { if (!G.aff || typeof G.aff !== 'object') G.aff = {}; G.aff[id] = Math.max(0, Math.min(this.AFF_MAX, (G.aff[id] || 0) + (d || 0))); },
  // 在当前地图给江湖人物找一个与出生点连通、离出生点 5–14 步、互相隔开的站位
  _spots: {},
  atOf(id) {
    const m = this.mapOf(id); const I = MAPINFO[m]; if (!I) return [10, 10];
    const fallback = [I.start[0] + 3, I.start[1] + 3];
    if (typeof R === 'undefined' || R.mapId !== m || !R.grid) return fallback;
    let sp = this._spots[m]; if (!sp || sp.grid !== R.grid) {
      const [si, sj] = nearestWalk(I.start[0], I.start[1]); const dist = new Map([[si + ',' + sj, 0]]); const q = [[si, sj]]; const cand = [];
      while (q.length) { const [i, j] = q.shift(); const d = dist.get(i + ',' + j); if (d >= 5 && d <= 14) cand.push([i, j]); if (d > 14) continue;
        for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + a, nj = j + b, k = ni + ',' + nj; if (!dist.has(k) && walkable(ni, nj)) { dist.set(k, d + 1); q.push([ni, nj]); } } }
      const others = []; for (const k in NPCS) { if (k.startsWith('jh_')) continue; const N = NPCS[k]; let mm; try { mm = N.roam ? N.roam(Game.G) : N.map; } catch (e) { mm = null; } if (mm === m && N.at) others.push(N.at); }
      const free = cand.filter(([i, j]) => others.every(([a, b]) => Math.abs(a - i) + Math.abs(b - j) >= 4));
      sp = this._spots[m] = { grid: R.grid, list: free.length ? free : cand, used: {} };
    }
    if (!sp.list.length) return fallback;
    if (sp.used[id]) return sp.used[id];
    let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const taken = Object.values(sp.used); let best = null;
    for (let k = 0; k < sp.list.length; k++) { const c = sp.list[(h + k * 7) % sp.list.length]; if (taken.every(([a, b]) => Math.abs(a - c[0]) + Math.abs(b - c[1]) >= 4)) { best = c; break; } }
    return (sp.used[id] = best || sp.list[h % sp.list.length]);
  },
  status(id) {
    const G = this.G(); const L = G && this.ensure(G); if (!L) return ''; const s = L.npcs[id];
    return `${REALMS[s.realm].n}${STAGES[s.stage]}${s.sect ? '·' + SECTS[s.sect].n : '·散修'}　在${this.mapN(s.map)}${s.inj ? '（养伤）' : '（' + this.GOAL_N[s.goal] + '）'}${s.debt > 0 ? '　欠讨债司 ' + fmt(s.debt) : ''}${s.owe > 0 ? '　欠你 ' + fmt(s.owe) : ''}`;
  },
};

// ======================= 奇遇链 CH34（数据驱动；每步：npc、可选 map、可选等待月数） =======================
// opt.fx(G, S, L) 返回 { note, next: 步下标 | 'end', wait: 月 } ；S = G.life34.ch[id]（链状态，可随意存字段）
const CH34 = {
  tieguo: { n: '铁锅的债', map: 'market', steps: [
    { npc: 'jh_tieguo', map: 'market', text: (G, S, s) => `赵铁锅抱着一口黑铁锅蹲在坊市角落，讨债司的账房先生正拿算盘敲他的脑门。\n“${G.name}！救命！我欠了 ${fmt(Math.max(300, s.debt))} 灵石，你给我作个保，明年一定还！”\n（你自己还欠天道 ${fmt(G.debt || 0)} 灵石）`,
      opts: [
        { t: '替他作保（你的欠款 +300）', fx: (G, S, L) => { G.debt = (G.debt || 0) + 300; Life34.addAff(G, 'jh_tieguo', 20); S.guar = 1; L.npcs.jh_tieguo.debt = Math.max(0, L.npcs.jh_tieguo.debt - 300); return { note: '你在担保人一栏签了名。账房先生满意地多看了你两眼。\n欠款 +300，赵铁锅好感 +20。', next: 1, wait: 12 }; } },
        { t: '直接替他还 200 灵石', need: G => (G.stone || 0) >= 200, fx: (G, S, L) => { G.stone -= 200; Life34.addAff(G, 'jh_tieguo', 25); S.paid = 1; L.npcs.jh_tieguo.debt = Math.max(0, L.npcs.jh_tieguo.debt - 200); return { note: '你掏出 200 灵石拍在算盘上。赵铁锅抱着铁锅哭得像个孩子。\n灵石 −200，好感 +25。', next: 1, wait: 6 }; } },
        { t: '装作没看见', fx: (G, S) => { Life34.addAff(G, 'jh_tieguo', -5); S.out = 'ignored'; return { note: '你低头快步走过。身后传来铁锅被敲响的声音，“当——”。', next: 'end' }; } },
      ] },
    { npc: 'jh_tieguo', text: (G, S) => { if (S.ok === undefined) S.ok = Math.random() < 0.35 + ((G.aff && G.aff.jh_tieguo) || 0) / 150 + (G.st ? G.st.luck * 0.02 : 0) ? 1 : 0;
        return S.ok ? `赵铁锅在${Life34.mapN(Life34.mapOf('jh_tieguo'))}支起了一个铁锅炖的摊子，香飘十里。\n“恩人！生意好了，钱我带来了！”` : `你在${Life34.mapN(Life34.mapOf('jh_tieguo'))}堵住了赵铁锅。他背着铁锅，正准备连夜跑路。\n${S.guar ? '讨债司已经把他欠的利息记到了担保人——也就是你——头上（欠款 +150）。' : '“恩人……那 200 灵石，能不能再宽限宽限？”'}`; },
      enter: (G, S) => { if (!S.ok && S.guar && !S.int) { S.int = 1; G.debt = (G.debt || 0) + 150; } },
      opts: [
        { t: '收下他还的钱', show: (G, S) => S.ok, fx: (G, S) => { const back = S.guar ? 300 : 300; if (S.guar) G.debt = Math.max(0, (G.debt || 0) - 300); else G.stone = (G.stone || 0) + back; Life34.addAff(G, 'jh_tieguo', 10); return { note: S.guar ? '他当着账房先生的面把账还清了，你的担保一笔勾销。\n欠款 −300，好感 +10。' : '他塞给你 300 灵石：“多的是利息！”\n灵石 +300，好感 +10。', next: 2, wait: 3 }; } },
        { t: '让他立字据，分期还', show: (G, S) => !S.ok, fx: (G, S) => { S.iou = 1; Life34.addAff(G, 'jh_tieguo', 5); L34hold('jh_tieguo', 0); return { note: '他按了手印，说要去外地闯闯，挣了钱就回来找你。', next: 2, wait: 6 }; } },
        { t: '一拳揍过去', show: (G, S) => !S.ok, fx: (G, S, L) => { Life34.addAff(G, 'jh_tieguo', -30); G.karma = (G.karma || 0) - 1; const s = L.npcs.jh_tieguo; const g = Math.min(150, Math.max(0, s.stone)); s.stone -= g; G.stone = (G.stone || 0) + g; S.out = 'beat'; return { note: `你揍得他铁锅都扁了，从他怀里摸出 ${g} 灵石。\n好感 −30，功德 −1。`, next: 'end' }; } },
      ] },
    { npc: 'jh_tieguo', text: (G, S) => S.ok ? '铁锅炖开张满三个月，赵铁锅非要请你吃一锅。\n“没有你，我这口锅早被讨债司收走了。”' : `你在${Life34.mapN(Life34.mapOf('jh_tieguo'))}又碰上了赵铁锅。他晒黑了，铁锅也换了口新的。\n“欠你的，我一直记着。”`,
      opts: [
        { t: '坐下吃一锅', fx: (G, S) => { Life34.addAff(G, 'jh_tieguo', 20); const g = Game.addExp ? Game.addExp(Game.yearExp() * 0.3) : 0; Game.give('hcd', 2); S.out = 'friend'; G.flags.tieguo_friend = 1; return { note: `一锅灵鱼炖下肚，周身暖洋洋的。\n修为 +${fmt(g)}，回春丹 ×2，好感 +20。\n（赵铁锅成了你的朋友）`, next: 'end' }; } },
        { t: '让他把账结清', fx: (G, S, L) => { const s = L.npcs.jh_tieguo; const pay = S.guar ? 150 : 200; if (S.guar) G.debt = Math.max(0, (G.debt || 0) - pay); else G.stone = (G.stone || 0) + pay; s.stone -= pay; S.out = 'paid'; return { note: S.guar ? '他把那 150 利息替你还了。账两清，情分也淡了些。\n欠款 −150。' : '他数出 200 灵石还你。账两清。\n灵石 +200。', next: 'end' }; } },
      ] },
  ] },
  cangbao: { n: '半张藏宝图', map: 'secret', steps: [
    { npc: 'jh_xunbao', map: 'secret', text: G => `钱满仓神神秘秘地把你拉到一块石头后面，抖开半张发黄的羊皮：\n“秘境深处有个前朝修士的藏宝洞，另外半张在丹娘苏半夏手里。100 灵石，这半张归你，宝贝咱俩分。”`,
      opts: [
        { t: '出 100 灵石入伙', need: G => (G.stone || 0) >= 100, fx: (G, S) => { G.stone -= 100; Life34.addAff(G, 'jh_xunbao', 10); return { note: '你拿到了半张藏宝图。另外半张，得去找苏半夏——她四处跑买卖，不知道现在在哪。', next: 1 }; } },
        { t: '这年头骗子太多了', fx: (G, S) => { S.out = 'no'; return { note: '钱满仓叹了口气，把图揣回怀里。', next: 'end' }; } },
      ] },
    { npc: 'jh_danniang', text: (G, S) => `苏半夏听你说完，从药箱夹层里取出另外半张图。\n“钱满仓那个老滑头……图可以给你，不过得拿东西换。”`,
      opts: [
        { t: '用 2 株灵草换', need: G => (G.inv && G.inv.herb || 0) >= 2, fx: G => { Game.take('herb', 2); Life34.addAff(G, 'jh_danniang', 10); return { note: '她收下灵草，把半张图递给你。\n灵草 −2，苏半夏好感 +10。', next: 2 }; } },
        { t: '帮她试一颗新丹（气血 −30%）', fx: G => { const s = Game.stats(); G.hp = Math.max(1, Math.round(G.hp - s.mhp * 0.3)); Life34.addAff(G, 'jh_danniang', 20); const g = Game.addExp(Game.yearExp() * 0.2); return { note: `丹药入口，又苦又辣，但灵气在经脉里乱窜——\n气血 −30%，修为 +${fmt(g)}，苏半夏好感 +20。她把半张图塞给你。`, next: 2 }; } },
        { t: '出 300 灵石买', need: G => (G.stone || 0) >= 300, fx: G => { G.stone -= 300; return { note: '一手交钱一手交图。\n灵石 −300。', next: 2 }; } },
      ] },
    { npc: 'jh_xunbao', map: 'secret', text: () => '两张图一拼，钱满仓的眼睛都直了：“就在这块石头底下！”\n一锄头下去，挖出一只锈迹斑斑的箱子。',
      opts: [
        { t: '五五分账', fx: (G, S, L) => { const st = 400 + (G.realm || 0) * 200; G.stone = (G.stone || 0) + st; Game.give('egg', 1); Life34.addAff(G, 'jh_xunbao', 20); L.npcs.jh_xunbao.stone += st; S.out = 'split'; return { note: `箱子里有 ${st * 2} 灵石和一枚灵兽蛋。蛋归你，灵石对半分。\n灵石 +${st}，灵兽蛋 ×1，钱满仓好感 +20。`, next: 'end' }; } },
        { t: '独吞（他打不过你）', fx: (G, S) => { const st = (400 + (G.realm || 0) * 200) * 2; G.stone = (G.stone || 0) + st; Game.give('egg', 1); Life34.addAff(G, 'jh_xunbao', -40); G.karma = (G.karma || 0) - 2; S.out = 'greedy'; return { note: `你把整箱抱走了。钱满仓在身后骂了半个秘境。\n灵石 +${st}，灵兽蛋 ×1，好感 −40，功德 −2。`, next: 'end' }; } },
      ] },
  ] },
};
function L34hold(id, v) { const G = Life34.G(); const L = G && Life34.ensure(G); if (L) L.npcs[id].hold = v ? 1 : 0; }
const Chain34 = {
  st(G, id) { const L = Life34.ensure(G); return L.ch[id] || (L.ch[id] = { s: 0, after: 0, done: 0 }); },
  // 当前可在 npcId 身上触发的链步：[chainId, step, S]
  avail(G, npcId, mapId) {
    const out = []; if (!G || !G.flags || !G.flags.awakened) return out; const L = Life34.ensure(G);
    for (const id in CH34) { const C = CH34[id]; const S = this.st(G, id); if (S.done) continue; const st = C.steps[S.s]; if (!st || st.npc !== npcId) continue;
      if (L.t < (S.after || 0)) continue; const here = mapId || (typeof R !== 'undefined' && R.mapId); if (st.map && st.map !== here) continue; if (Life34.mapOf(npcId) !== here) continue;
      out.push([id, st, S]); }
    return out;
  },
  label(id) { const C = CH34[id]; const S = this.st(Game.G, id); return `⚑ 奇遇·${C.n}（${S.s + 1}/${C.steps.length}）`; },
  async run(id) {
    const G = Game.G; const C = CH34[id]; const S = this.st(G, id); const st = C.steps[S.s]; if (!st || S.done) return null; const L = Life34.ensure(G);
    const s = L.npcs[st.npc]; if (st.enter) st.enter(G, S, L);
    const opts = st.opts.filter(o => !o.show || o.show(G, S)); const N = NPCS[st.npc];
    const labels = opts.map(o => o.need && !o.need(G) ? o.t + '（条件不足）' : o.t).concat(['改日再说']);
    const k = await UI.card(`奇遇·${C.n}（${S.s + 1}/${C.steps.length}）`, st.text(G, S, s), N ? N.por : 'i:scroll', labels);
    const o = opts[k]; if (!o) { Game.save(); return { id, step: S.s, cancelled: true }; }
    if (o.need && !o.need(G)) { UI.toast('条件不足'); return { id, step: S.s, cancelled: true }; }
    const d0 = G.debt || 0, a0 = (G.aff && G.aff[st.npc]) || 0; const r = o.fx(G, S, L) || {}; const step = S.s;
    if (r.next === 'end' || r.next === undefined) { S.done = 1; S.s = C.steps.length; } else { S.s = r.next; S.after = L.t + (r.wait || 0); }
    Life34.say(L, `【奇遇】${C.n}：${o.t}${S.done ? '（完）' : ''}`, 'chain');
    Game.log && Game.log(`奇遇·${C.n}：${o.t}。`); Game.save();
    await UI.card(`奇遇·${C.n}`, r.note + (S.done ? '\n\n——奇遇完——' : (r.wait ? `\n\n（${r.wait >= 12 ? Math.round(r.wait / 12) + ' 年' : r.wait + ' 个月'}后再看看）` : '')), N ? N.por : 'i:scroll', ['好']);
    if (UI.hud) UI.hud(); if (Game.refreshNpcs) Game.refreshNpcs();
    return { id, step, choice: o.t, debt: [d0, G.debt || 0], aff: [a0, (G.aff && G.aff[st.npc]) || 0], done: !!S.done, next: S.s };
  },
};

(function () {
  // ---- NPC 注册：位置由江湖状态决定（roam/map/at 都是 getter；validate22 无存档时回落老家）----
  for (const [id, n, spr, , home] of Life34.CAST) {
    if (NPCS[id]) continue;
    NPCS[id] = { n, spr, por: spr, minRealm: 1, jh34: 1,
      roam: () => Life34.mapOf(id) || home,
      get at() { try { return Life34.atOf(id); } catch (e) { const I = MAPINFO[home]; return I ? I.start : [10, 10]; } } };
    Object.defineProperty(CHAT, id, { configurable: true, enumerable: true, get() {
      const base = Life34.LINES[id] || ['……']; const G = Life34.G(); if (!G || !G.life34) return base; const s = G.life34.npcs[id]; if (!s) return base;
      const x = []; if (s.inj) x.push('咳咳……前些日子突破没成，受了点伤。'); if (s.debt > 500) x.push(`讨债司追着我要 ${fmt(s.debt)} 灵石，你可别说见过我。`); if (s.realm >= 4) x.push(`如今我也算${REALMS[s.realm].n}的人了，说话要有派头。`);
      return base.concat(x); } });
  }
  // ---- 时间推进：月级/年度制都走绝对月，幂等 ----
  if (typeof Time27 !== 'undefined' && Time27.nextMonth) { const _nm = Time27.nextMonth; Time27.nextMonth = async function () { const r = await _nm.apply(this, arguments); try { Life34.sync(); } catch (e) { console.error('life34', e); } return r; }; }
  const _ye = Game.yearEnd; Game.yearEnd = async function () { const r = await _ye.apply(this, arguments); try { Life34.sync(); } catch (e) { console.error('life34', e); } return r; };
  // ---- 对话：江湖人物的额外选项 + 奇遇链入口 ----
  const _ex = Talk.extra;
  Talk.extra = function (id) {
    const out = _ex ? _ex.call(this, id) : []; const G = Game.G; if (!G) return out;
    try {
      for (const [cid] of Chain34.avail(G, id)) out.push([Chain34.label(cid), () => Chain34.run(cid)]);
      if (NPCS[id] && NPCS[id].jh34) { const L = Life34.ensure(G); const s = L.npcs[id];
        out.push(['打听近况', async () => { const N = NPCS[id]; const near = L.feed.slice(-4).reverse().map(f => `· ${Life34.when(f.t)} ${f.s}`).join('\n');
          await UI.say(N.por, N.n, `${Life34.status(id)}\n\n最近江湖上：\n${near || '· 风平浪静'}`, ['……']); }]);
        if (s.debt > 0 && !s.owe) out.push(['借他 200 灵石', async () => { if ((G.stone || 0) < 200) { UI.toast('灵石不够'); return; } G.stone -= 200; s.owe = 200; s.stone += 200; Life34.addAff(G, id, 6); Life34.say(L, `你借给${Life34.nm(id)} 200 灵石。`, 'loan'); Game.save(); await UI.say(NPCS[id].por, NPCS[id].n, '“够意思！等我手头宽裕了，连本带利还你。”', ['好']); }]);
      }
    } catch (e) { console.error('life34 extra', e); }
    return out;
  };
  // ---- 进图提示：本图有可接的奇遇 ----
  const _em = Game.enterMap; Game.enterMap = async function (id) {
    const r = await _em.apply(this, arguments);
    try { const G = this.G; Life34.sync(); for (const k in NPCS) { if (!NPCS[k].jh34) continue; const a = Chain34.avail(G, k, id); if (a.length) { const key = 'ch34hint_' + a[0][0] + '_' + a[0][2].s; if (!G.used[key]) { G.used[key] = 1; setTimeout(() => UI.toast(`【奇遇】${Life34.nm(k)}在${MAPINFO[id].n}，好像有事找你`, '#ffd8a0'), 1200); } } } } catch (e) { console.error('life34 enter', e); }
    return r;
  };
  const _mk = Game.npcMark; Game.npcMark = function (id) { const m = _mk.apply(this, arguments); if (m) return m; try { if (NPCS[id] && NPCS[id].jh34 && Chain34.avail(this.G, id).length) return '…'; } catch (e) { } return m; };
  // ---- 「更多 → 江湖风云」面板 ----
  function install() {
    if (typeof UI === 'undefined' || !UI.p_more || !UI.titles) { setTimeout(install, 300); return; }
    UI.titles.life34 = '江湖风云';
    UI.p_life34 = function (b) {
      const G = Game.G; const L = Life34.ensure(G); Life34.sync();
      const ss = Object.keys(SECTS).sort((a, c) => L.sects[c].pow - L.sects[a].pow); const mx = Math.max(...ss.map(k => L.sects[k].pow));
      let h = '<h4>宗门势力</h4>' + ss.map((k, i) => `<div class="it"><div style="flex:1"><b>${i + 1}. ${SECTS[k].n}${G.sect === k ? '（本宗）' : ''}</b><small>势力 ${Math.round(L.sects[k].pow)}　战绩 ${L.sects[k].wins} 胜 ${L.sects[k].loss} 负</small><div style="height:6px;background:#333;border-radius:3px"><div style="height:6px;width:${Math.round(L.sects[k].pow / mx * 100)}%;background:#d9a441;border-radius:3px"></div></div></div></div>`).join('');
      h += '<h4>江湖人物</h4>' + Life34.CAST.map(([id]) => `<div class="it"><div><b>${NPCS[id].n}${G.aff && G.aff[id] ? `　♥${G.aff[id]}` : ''}</b><small>${Life34.status(id)}</small></div></div>`).join('');
      const chs = Object.keys(CH34).map(k => { const C = CH34[k]; const S = L.ch[k]; return `<div class="it"><div><b>⚑ ${C.n}</b><small>${!S || (!S.s && !S.done) ? `未开始（${MAPINFO[C.map] ? MAPINFO[C.map].n : C.map}）` : S.done ? '已完成' : `进行中 ${S.s + 1}/${C.steps.length}：找${Life34.nm(C.steps[S.s].npc)}${C.steps[S.s].map ? '（' + Life34.mapN(C.steps[S.s].map) + '）' : ''}${L.t < (S.after || 0) ? `，${S.after - L.t} 个月后` : ''}`}</small></div></div>`; }).join('');
      h += '<h4>奇遇</h4>' + chs;
      h += '<h4>江湖传闻</h4><div class="log">' + (L.feed.slice().reverse().map(f => `<p>${Life34.when(f.t)}　${esc(f.s)}</p>`).join('') || '<p>风平浪静。过几个月再来看看。</p>') + '</div>';
      b.innerHTML = h;
    };
    const _more = UI.p_more;
    UI.p_more = function (b, re, close) {
      _more.call(this, b, re, close);
      const btn = document.createElement('button'); btn.className = 'big2'; btn.setAttribute('data-k', 'life34');
      btn.innerHTML = '<i style="' + iconCss('scroll', 48) + '"></i>江湖风云';
      (b.querySelector('.grid3') || b.querySelector('.grid2') || b).appendChild(btn);
    };
  }
  install();
})();

// ======================= 3.9.3 自家洞府 dongfu43（规格 docs/research_v22.md §17）第 1 轮 =======================
// 本轮：数据 + 纯逻辑（入口判定/静室倍率/灵泉/手采灵田/洞府年事池/居民摆放/锁定文案），附 test/dongfu43_unit.js。
// 本轮不进 index.html、不登记 MAPINFO、不包任何函数——地图 art/mapdefs43.py、makeMarks 覆盖、居民 ents、入口卡片留第 2 轮。
// 存档：G.df43 = { ev:{}, ey:0, hv:0, n:0 }（§17.1⑥）+ 本模块惰性附加 sp（灵泉年）、mouse（田鼠还利息年）、seal（裱封条年）。
// 老档缺省即全 0，不升 G.v；新一世 G 重建即归零。不新增货币，不改 G.cave 价格/年产出。
// rng：Game.roll(p,'dongfu43') → Math.random；奖励只用灵石/修为/已有道具 herb/lz/peach + 好感/善恶/道心（mem37.dx）。
'use strict';
(function (W) {
  const TEXT43 = {
    enter: ['你推开洞府的门。门轴吱呀一声，像在说：欢迎回来，欠债的。',
      '洞府里的灵气扑面而来。聚灵阵嗡嗡转着，电费是天道出的——记在你账上。',
      '回家了。蒲团还是那个蒲团，欠条还是那些欠条。'],
    leave: ['你关上洞府的门，把查封预告的封条又按平了一点。', '出门。记得带钱，记得别带欠条。'],
    lock: {
      jade: '灵泉还没醒。聚灵阵修到 1 级，泉眼才会冒水。',
      herb: '这块地还荒着。灵田升到 {n} 级，才开垦到这里。',
      bigfurnace: '炉膛是空的。先在洞府账本里建炼器炉。',
      pavilion: '凉亭里只有一窝麻雀。收服一只灵兽，它们会自己让位。',
      well: '练功场边的井台上落满了叶子。收个徒弟，就有人扫了。',
      house: '厢房收拾得很干净，但还没有人陪你过年。',
      altar: '供台空着，等一件配得上它的东西。',
      obelisk: '一根光秃秃的石柱。学会阵法以后，它才算阵眼。',
      mortal: '洞府还在装修。练气以后，房东（你自己）允许入住。'
    },
    spring: ['灵泉汩汩冒水，你喝了一口，浑身舒坦。修为 +{x}。', '灵泉在蓄水。明年再来。'],
    harvest: '你在灵田里转了一圈，顺手摘了：{got}。田鼠在远处看着你，眼神复杂。',
    pet: ['{p}在凉亭里打了个滚，露出肚皮。', '{p}叼来一根草放在你脚边，像是在交房租。', '{p}冲着门外讨债司的方向龇牙。好孩子。', '{p}睡着了，梦里还在吧唧嘴。'],
    pet_away: '出差中：{job}。窝里留着它的一根毛。',
    apprentice: ['“师父回来了！今天的剑我练了三百遍——好吧，两百遍。”', '“师父，我听说您欠天道八千多，我攒了一点……”', '“师父，祖师牌位上那个名字，为什么写的是‘剑仙（未付）’？”'],
    dis_tag_default: ['“师父好！”', '“师父，今天教什么？”', '“师父，伙房的米又快没了。”'],
    spouse: ['“回来啦？锅里有汤。”', '“今天讨债司的人又来了，我说你出门了。他说他知道。”', '“账本我帮你理了一下。……你别看，看了睡不着。”'],
    kid_small: ['“爹/娘抱！”', '“我今天背了《还款经》第一章！”', '“为什么我们家门口有封条？”'],
    kid_big: ['“我想下山闯荡。……也想顺便帮家里还点债。”', '“我在坊市听人说，咱家是三界最出名的欠债户。我觉得挺威风的。”'],
    tablet: ['牌位上写着：「本门祖师·落魄剑仙（尾款未付）」。香灰里埋着一张欠条。', '你给祖师上了一炷香。牌位好像晃了一下，像是心虚。'],
    clone: '化身看着你：“本体，你今天也没还钱。”',
    auto_block: '家里没怪可打。去外面挂机吧。',
    // 卡片按钮（§17.1①②）
    btnHome: '🚪 回洞府（走进去）', btnPanel: '📜 洞府总览（面板）', btnNo: '算了',
    btnOut: '🚪 出门', btnFly: '🗡 御剑去别处', travelRow: '🏠 回洞府（免费）',
    harvestDone: '今年的灵田已经摘过了。明年再来。', apShort: '行动力不够，明天再摘。'
  };
  const ITEM_N = { herb: '灵草', lz: '千年灵芝', peach: '蟠桃' };
  const MAPINFO43 = { n: '自家洞府', tier: 0.5, need: 1, mons: [], cnt: 0, bgm: 'village', sky: ['#cfe8d8', '#f4fff8'], amb: 'firefly', start: [10, 19],
    d: '你的洞府。房契在你手里，但天道在房契背面贴了一张「查封预备」。' };
  // §17.6 居民位置
  const SPOT = {
    pet: [[3, 10], [5, 11], [3, 13], [5, 13]], apprentice: [16, 10], dis: [[16, 12], [18, 11], [17, 14], [19, 12]],
    spouse: [4, 18], kid: [[3, 19], [5, 19], [5, 17]], qiling: [11, 9], clone: [8, 10]
  };
  const HERB_AT = [[3, 3], [5, 3], [3, 5], [5, 5], [6, 6]]; // 第 k 株（0 起）需灵田 k+1 级

  // 注意：Game/NPCS/TEXT37B/DLG37/POW 都是顶层 const，不挂在 window 上，只能用 typeof 直接取。
  const Gm = () => (typeof Game !== 'undefined' ? Game : null);
  const getG = G => G || (Gm() ? Gm().G : null);
  const npcs = () => (typeof NPCS !== 'undefined' ? NPCS : null);
  const rng = (p, kind) => { const g = Gm(); if (g && typeof g.roll === 'function') return !!g.roll(p, kind || 'dongfu43'); return Math.random() < p; };
  const POWf = t => (typeof POW === 'function' ? POW(t) : Math.pow(1.75, t));
  const yr = G => (G.year || G.age || 0);
  const pick = (a, r) => a[Math.floor((r ? r() : Math.random()) * a.length) % a.length];
  const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (o && o[k] !== undefined ? o[k] : m));
  const parentWord = G => (G && G.sex === 'm' ? '爹' : G && G.sex === 'f' ? '娘' : '爹娘');
  const sexFix = (s, G) => String(s).replace(/爹\/娘/g, parentWord(G));
  const npcN = id => { const N = npcs() && npcs()[id]; return N ? String(N.n).split('·').pop() : (id || ''); };
  const cave = G => Object.assign({ zl: 0, field: 0, forge: 0 }, G && G.cave || {});
  const yExp = () => { const g = Gm(); try { return g && typeof g.yearExp === 'function' ? g.yearExp() : 0; } catch (e) { return 0; } };
  const addExp = (G, x) => { const g = Gm(); if (x >= 0 && g && typeof g.addExp === 'function') return g.addExp(x, true); const v = Math.round(x); G.exp = Math.max(0, (G.exp || 0) + v); return v; };
  const give = (G, id, n) => { const g = Gm(); if (g && typeof g.give === 'function') g.give(id, n); else { G.inv = G.inv || {}; G.inv[id] = (G.inv[id] || 0) + n; } };
  const affAdd = (G, id, n) => { if (!id) return; G.aff = G.aff || {}; G.aff[id] = Math.max(0, Math.min(150, (G.aff[id] || 0) + n)); };
  const dxAdd = (G, n) => {
    const D = typeof DLG37 !== 'undefined' ? DLG37 : null; if (D && typeof D.st === 'function') { const M = D.st(G); const cap = D.DX || 100; M.dx = Math.max(-cap, Math.min(cap, M.dx + n)); return; }
    const M = G.mem37 = (G.mem37 && typeof G.mem37 === 'object') ? G.mem37 : {}; M.dx = (typeof M.dx === 'number' && isFinite(M.dx) ? M.dx : 0) + n;
  };

  const DF43 = {
    TEXT: TEXT43, MAPINFO: MAPINFO43, SPOT, HERB_AT, ID: 'dongfu', off: false,
    st(G) {
      G = getG(G); if (!G) return null;
      let D = G.df43; if (!D || typeof D !== 'object') D = G.df43 = {};
      if (!D.ev || typeof D.ev !== 'object') D.ev = {};
      for (const k of ['ey', 'hv', 'n', 'sp', 'mouse', 'seal']) if (typeof D[k] !== 'number' || !isFinite(D[k])) D[k] = 0;
      return D;
    },
    // ---- §17.1 入口/出口 ----
    canHome(G) { G = getG(G); return !!(G && G.flags && G.flags.awakened && (G.realm || 0) >= 1); },
    entryChoices(G) { G = getG(G); return this.canHome(G) ? [TEXT43.btnHome, TEXT43.btnPanel, TEXT43.btnNo] : [TEXT43.btnPanel, TEXT43.btnNo]; },
    entryNote(G) { return this.canHome(G) ? '' : TEXT43.lock.mortal; },
    travelRow(G) { G = getG(G); return !!(G && (G.realm || 0) >= 2 && this.canHome(G)); }, // 筑基起御剑面板置顶
    exitChoices(G) { G = getG(G); return (G && (G.realm || 0) >= 2) ? [TEXT43.btnOut, TEXT43.btnFly, TEXT43.btnNo] : [TEXT43.btnOut, TEXT43.btnNo]; },
    // ---- §17.4① 静室打坐 ----
    medMul(G) { G = getG(G); const zl = Math.max(0, Math.min(5, cave(G).zl | 0)); const D = this.st(G); return Math.round((1 + 0.1 * zl + (D && D.seal === yr(G) ? 0.05 : 0)) * 100) / 100; },
    // ---- §17.4② 灵泉 ----
    springReady(G) { G = getG(G); const D = this.st(G); return cave(G).zl >= 1 && D.sp !== yr(G); },
    spring(G) {
      G = getG(G); const D = this.st(G); const zl = cave(G).zl | 0;
      if (zl < 1) return { ok: false, msg: TEXT43.lock.jade };
      if (D.sp === yr(G)) return { ok: false, msg: TEXT43.spring[1] };
      D.sp = yr(G); const g = Gm();
      if (g && typeof g.stats === 'function') { try { const s = g.stats(); if (s && s.mhp) G.hp = s.mhp; if (s && s.mmp) G.mp = s.mmp; } catch (e) { } }
      const x = addExp(G, yExp() * 0.05 * zl);
      return { ok: true, x, msg: fill(TEXT43.spring[0], { x: Math.round(x) }) };
    },
    // ---- §17.4③ 手采灵田 ----
    harvestYield(field, r) {
      field = field | 0; const out = {};
      if (field <= 0) return out;
      if (field <= 3) out.herb = 1;
      else if (field === 4) { out.herb = 2; out.lz = 1; }
      else { out.herb = 2; out.lz = 1; if (r ? r() < 0.1 : rng(0.1, 'dongfu43_peach')) out.peach = 1; }
      return out;
    },
    herbLit(G, k) { return (cave(getG(G)).field | 0) > k; },
    harvest(G, r) {
      G = getG(G); const D = this.st(G); const f = cave(G).field | 0;
      if (f < 1) return { ok: false, msg: fill(TEXT43.lock.herb, { n: 1 }) };
      if (D.hv === yr(G)) return { ok: false, msg: TEXT43.harvestDone };
      if ((G.ap || 0) < 1) return { ok: false, msg: TEXT43.apShort };
      G.ap -= 1; D.hv = yr(G);
      const got = this.harvestYield(f, r);
      if (D.mouse && D.mouse === yr(G) - 1) got.herb = (got.herb || 0) + 3; // df_mouse 放它一马：下一年手采追加灵草×3
      const parts = [];
      for (const id in got) if (got[id] > 0) { give(G, id, got[id]); parts.push(`${ITEM_N[id] || id}×${got[id]}`); }
      return { ok: true, got, msg: fill(TEXT43.harvest, { got: parts.join('、') }) };
    },
    // ---- §17.3 锁定 ----
    lockMsg(prop, G, k) {
      G = getG(G); const c = cave(G);
      switch (prop) {
        case 'jade': return c.zl >= 1 ? null : TEXT43.lock.jade;
        case 'herb': return (c.field | 0) > (k | 0) ? null : fill(TEXT43.lock.herb, { n: (k | 0) + 1 });
        case 'bigfurnace': return c.forge >= 1 ? null : TEXT43.lock.bigfurnace;
        case 'pavilion': return (G.pets && G.pets.length) ? null : TEXT43.lock.pavilion;
        case 'well': return (G.apprentice || (Array.isArray(G.dis36) && G.dis36.length)) ? null : TEXT43.lock.well;
        case 'house': return (G.partner || this.kids(G).length) ? null : TEXT43.lock.house;
        case 'altar': return ((G.realm || 0) >= 2 && this.hasShenqi(G)) ? null : TEXT43.lock.altar;
        case 'obelisk': return (G.zf39 && (G.zf39.lv | 0) >= 1) ? null : TEXT43.lock.obelisk;
        default: return null;
      }
    },
    hasShenqi(G) { const S = G && G.sq36; if (!S || typeof S !== 'object') return false; if (Array.isArray(S.own)) return S.own.length > 0; if (S.own && typeof S.own === 'object') return Object.keys(S.own).length > 0; return !!S.id; },
    alchBonus(G) { return cave(getG(G)).forge >= 3 ? 0.15 : 0; },
    // ---- 居民/在家判定 ----
    homePets(G) { G = getG(G); return (Array.isArray(G.pets) ? G.pets : []).filter(p => p && !p.pd35); },
    awayPets(G) { G = getG(G); return (Array.isArray(G.pets) ? G.pets : []).filter(p => p && p.pd35); },
    homeDis(G) { G = getG(G); return (Array.isArray(G.dis36) ? G.dis36 : []).filter(d => d && d.state === 'idle'); },
    kids(G) { G = getG(G); const F = G.fam37; const ks = F && Array.isArray(F.kids) ? F.kids.slice() : [];
      return ks.map(k => Object.assign({}, k, { _age: typeof k.age === 'number' ? k.age : Math.max(0, yr(G) - (k.born || 0)), _ref: k })).sort((a, b) => b._age - a._age); },
    residents(G) {
      G = getG(G); const out = []; const act = (typeof G.petA === 'number' && G.petA >= 0 && G.pets) ? G.pets[G.petA] : null;
      const pets = (Array.isArray(G.pets) ? G.pets : []); let slot = 0;
      for (const p of pets) { if (slot >= 4) break; if (!p || p === act) continue;
        if (p.pd35) out.push({ kind: 'sign', id: 'df_away' + slot, at: SPOT.pet[slot], label: fill(TEXT43.pet_away, { job: p.pd35.job || '' }) });
        else out.push({ kind: 'pet', id: 'df_pet' + slot, at: SPOT.pet[slot], label: p.name, mon: p.mon, s: 0.7, ref: p });
        slot++; }
      if (G.apprentice) out.push({ kind: 'apprentice', id: 'df_app', at: SPOT.apprentice, label: npcN(typeof G.apprentice === 'string' ? G.apprentice : (G.apprentice.npc || G.apprentice.n || '')), npc: G.apprentice });
      this.homeDis(G).slice(0, 4).forEach((d, i) => out.push({ kind: 'dis', id: 'df_dis' + i, at: SPOT.dis[i], label: d.n, spr: 'npc_disciple', ref: d }));
      if (G.partner) out.push({ kind: 'spouse', id: 'df_sp', at: SPOT.spouse, label: npcN(G.partner), npc: G.partner });
      this.kids(G).slice(0, 3).forEach((k, i) => out.push({ kind: 'kid', id: 'df_kid' + i, at: SPOT.kid[i], label: k.n, s: k._age < 16 ? 0.75 : 1, spr: k._age < 16 ? 'npc_disciple' : null, ref: k._ref, age: k._age }));
      if (G.fb33 && (G.fb33.tier | 0) >= 6) out.push({ kind: 'qiling', id: 'df_ql', at: SPOT.qiling, label: '器灵' });
      const hs = G.hs33 && Array.isArray(G.hs33.clones) ? G.hs33.clones.filter(c => c && !c.job) : [];
      if (hs.length) out.push({ kind: 'clone', id: 'df_clone', at: SPOT.clone, label: '身外化身', a: 0.5 });
      return out;
    },
    line(e, G, r) {
      G = getG(G);
      switch (e.kind) {
        case 'pet': return fill(pick(TEXT43.pet, r), { p: e.label });
        case 'sign': return e.label;
        case 'apprentice': return pick(TEXT43.apprentice, r);
        case 'dis': { // 优先该弟子 tag 在 fam37 TEXT37B.dis.tags 里的已有台词（[id,名,台词,效果]），取不到用兜底
          const tags = typeof TEXT37B !== 'undefined' && TEXT37B.dis && Array.isArray(TEXT37B.dis.tags) ? TEXT37B.dis.tags : [];
          const T = e.ref && tags.find(t => Array.isArray(t) && t[0] === e.ref.tag);
          return T && T[2] ? `${e.label}：${T[2]}` : pick(TEXT43.dis_tag_default, r); }
        case 'spouse': return pick(TEXT43.spouse, r);
        case 'kid': return sexFix(pick((e.age || 0) < 16 ? TEXT43.kid_small : TEXT43.kid_big, r), G);
        case 'clone': return TEXT43.clone;
        default: return '';
      }
    },
    tabletLine(G, r) { return pick(TEXT43.tablet, r); },
    // ---- §17.5 洞府年事 ----
    ctx(G, r) {
      G = getG(G); const hp = this.homePets(G), hd = this.homeDis(G), ks = this.kids(G);
      const sh = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor((r ? r() : Math.random()) * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
      const ps = sh(hp), ds = sh(hd);
      const L = G.life34 && G.life34.rel ? G.life34.rel : {}; const vis = Object.keys(L).filter(id => L[id] > 0 && npcs() && npcs()[id]);
      return { P: ps, D: ds, K: ks, V: vis.length ? pick(vis, r) : null,
        o: { p1: ps[0] ? ps[0].name : '', p2: ps[1] ? ps[1].name : '', d1: ds[0] ? ds[0].n : '', d2: ds[1] ? ds[1].n : '', k1: ks[0] ? ks[0].n : '', sp: npcN(G.partner), npc: vis.length ? '' : '' } };
    },
    pool(G, c) {
      G = getG(G); const D = this.st(G); const y = yr(G);
      return EV.filter(e => e.cond(G, c, this) && (e.id === 'df_quiet' || !(e.id in D.ev) || y - D.ev[e.id] >= 6));
    },
    pickEv(G, r) {
      G = getG(G); const c = this.ctx(G, r); if (c.V) c.o.npc = npcN(c.V);
      const P = this.pool(G, c); const tot = P.reduce((s, e) => s + e.w, 0); let x = (r ? r() : Math.random()) * tot;
      let ev = P[P.length - 1]; for (const e of P) { x -= e.w; if (x < 0) { ev = e; break; } }
      return { ev, c };
    },
    // 主角本人进门：计数 + 本年第一次进门抽 1 件（§17.1④）
    onEnter(G, r) {
      G = getG(G); if (!G || this.off) return null; const D = this.st(G); D.n++;
      if (D.ey === yr(G)) return null;
      const { ev, c } = this.pickEv(G, r); D.ey = yr(G); D.ev[ev.id] = yr(G);
      return { id: ev.id, t: ev.t, x: sexFix(fill(ev.x, c.o), G), ch: ev.ch.filter(o => !o.ok || o.ok(G, c)).map(o => ({ l: fill(o.l, c.o), o })), c };
    },
    choose(G, inst, idx, r) {
      G = getG(G); const it = inst && inst.ch[idx]; if (!it) return '';
      const res = it.o.fx(G, inst.c, r || Math.random, this) || it.o.r || '';
      return sexFix(fill(res, inst.c.o), G);
    },
    _helpers: { fill, sexFix, POWf, yExp, addExp, give, affAdd, dxAdd, parentWord }
  };

  const K = (G, n) => { G.karma = (G.karma || 0) + n; };
  const ST = (G, n) => { G.stone = Math.max(0, (G.stone || 0) + n); };
  const cost = (G, k) => Math.round(k * POWf(G.realm || 0));
  const debtOn = G => (G.debt || 0) > 0;
  const zfHas = (G, id) => !!(G.zf39 && Array.isArray(G.zf39.cave) && G.zf39.cave.indexOf(id) >= 0);
  const petXp = (p, n) => { if (p) p.exp = (p.exp || 0) + n; };
  const loy = (d, n) => { if (d) d.loy = Math.max(0, Math.min(100, (d.loy || 0) + n)); };

  const EV = [
    { id: 'df_seal', w: 10, cond: G => debtOn(G), t: '查封预告', x: '大门上贴着一张新封条：「本洞府已列入天道讨债司查封预备名单。如需撕下，请先还款。」字是烫金的，挺贵。', ch: [
      { l: '撕了', fx: G => { dxAdd(G, 3); K(G, -2); }, r: '封条撕下来，背面印着「撕毁封条，罚款另计」。你又贴回去了一半。' },
      { l: '裱起来', fx: (G, c, r, M) => { dxAdd(G, 1); M.st(G).seal = yr(G); }, r: '你把它挂在静室，每天打坐前看一眼，修炼格外专心。' },
      { l: '写个“已阅”', fx: () => null, r: '第二天封条上多了一行批注：“阅什么阅，还钱。”' }] },
    { id: 'df_leak', w: 8, cond: () => true, t: '洞顶漏水', x: '静室顶上滴下来一滴水，正好落在你的蒲团上。抬头一看，石缝里卡着一张欠条——是剑仙一万年前塞进去堵缝的。', ch: [
      { l: '修好', ok: G => (G.stone || 0) >= cost(G, 10), fx: G => { ST(G, -cost(G, 10)); }, r: '修好了。欠条留着，当个纪念。' },
      { l: '接水泡茶', fx: G => { addExp(G, yExp() * 0.1); }, r: '万年石乳泡的茶，有股欠款的味道，但确实提神。' }] },
    { id: 'df_mouse', w: 8, cond: G => (cave(G).field | 0) >= 1, t: '灵田闹鼠', x: '灵田里的灵草少了三棵，地上留着一串小脚印，脚印尽头是一张字条：「借三棵，明年还。——田鼠」', ch: [
      { l: '放它一马', fx: (G, c, r, M) => { K(G, 3); M.st(G).mouse = yr(G); }, r: '第二年你在田边捡到三棵灵草和一颗松子，算利息。' },
      { l: '下夹子', fx: G => { give(G, 'herb', 1); }, r: '夹住了一只田鼠，它哭着说它也欠天道的钱。你放了它，它塞给你一棵灵草。' }] },
    { id: 'df_pet_fight', w: 6, cond: (G, c) => c.P.length >= 2, t: '灵兽打架', x: '{p1}和{p2}在灵兽园里打成一团，原因是争谁睡凉亭。', ch: [
      { l: '各打五十大板', fx: (G, c) => { petXp(c.P[0], 20); petXp(c.P[1], 20); }, r: '两只都委屈地蹲着，过了一会儿又挤在一起睡了。' },
      { l: '拉偏架给{p1}', fx: (G, c) => { petXp(c.P[0], 40); }, r: '{p1}得意地睡上了凉亭，{p2}在下面叹气叹了一晚上。' }] },
    { id: 'df_pet_gift', w: 6, cond: (G, c) => c.P.length >= 1, t: '叼回来的东西', x: '{p1}叼着一样东西回来，放在你脚边，尾巴摇得飞快。', ch: [
      { l: '看看是什么', fx: (G, c, r) => { const x = r();
        if (x < 0.5) { give(G, 'lz', 1); return '「是千年灵芝！」'; }
        if (x < 0.8) { const s = cost(G, 20); ST(G, s); return `「是${s}灵石！」`; }
        return '……是别人家的欠条。你夸了它，然后偷偷还回去了。'; } }] },
    { id: 'df_dis_fight', w: 6, cond: (G, c) => c.D.length >= 2, t: '弟子争执', x: '{d1}和{d2}在练功场吵起来了，起因是{d1}说{d2}的剑招“跟师父学歪了”。', ch: [
      { l: '亲自示范', fx: (G, c) => { loy(c.D[0], 3); loy(c.D[1], 3); addExp(G, -yExp() * 0.05); }, r: '你演示了一遍，自己也发现有一招确实歪了，默默改了。' },
      { l: '让他们比一场', fx: (G, c, r) => { const a = c.D[0], b = c.D[1]; const sa = ((a.lvl || 0) + (a.apt || 1)) * (0.5 + r()), sb = ((b.lvl || 0) + (b.apt || 1)) * (0.5 + r());
        const [w, l] = sa >= sb ? [a, b] : [b, a]; loy(w, 5); loy(l, -2); c.o.winner = w.n; c.o.loser = l.n; },
        r: '{winner}赢了，{loser}不服，说明年再来。练功场又热闹了一年。' }] },
    { id: 'df_dis_tea', w: 6, cond: (G, c) => c.D.length >= 1, t: '弟子奉茶', x: '{d1}端着一杯茶进来：“师父，喝茶。……顺便，我能不能下个月去坊市逛逛？”', ch: [
      { l: '准了', ok: G => (G.stone || 0) >= cost(G, 5), fx: (G, c) => { loy(c.D[0], 5); ST(G, -cost(G, 5)); }, r: '{d1}高高兴兴走了，回来给你带了一包桂花糕，用的是你给的零花钱。' },
      { l: '先把功课做完', fx: G => { addExp(G, yExp() * 0.05); }, r: '{d1}垮着脸去练剑，你在旁边看着，顺便也练了练。' }] },
    { id: 'df_kid', w: 7, cond: (G, c) => c.K.length >= 1, t: '孩子问账', x: '{k1}拿着一本账本跑过来：“爹/娘，这个八千八百八十八是什么意思？”', ch: [
      { l: '老实说', fx: G => { dxAdd(G, 3); }, r: '孩子沉默了很久，然后把自己的压岁钱放在你手里：“先还一点。”' },
      { l: '说是祖传宝贝', fx: G => { K(G, -1); affAdd(G, G.partner, 3); }, r: '孩子信了，逢人就说家里有个八千多的宝贝。道侣在旁边笑出了声。' }] },
    { id: 'df_spouse', w: 7, cond: G => !!G.partner, t: '家常', x: '{sp}在厢房门口晒被子：“今年过年回谁家？”', ch: [
      { l: '回桃花村看娘', fx: G => { affAdd(G, 'mom', 5); affAdd(G, G.partner, 3); }, r: '娘杀了一只鸡，又杀了一只。' },
      { l: '在洞府过', fx: G => { affAdd(G, G.partner, 5); }, r: '两个人守着一盏灯，外面讨债司的云车飞过去，没停。' }] },
    { id: 'df_visitor', w: 6, cond: (G, c) => !!c.V, t: '不速之客', x: '{npc}站在洞府门口：“路过，讨杯茶。”他背后的包袱鼓鼓囊囊的。', ch: [
      { l: '请进', ok: G => (G.stone || 0) >= cost(G, 5), fx: (G, c) => { affAdd(G, c.V, 5); ST(G, -cost(G, 5)); give(G, 'herb', 2); }, r: '他喝了三杯茶，临走留下一个小布包：灵草×2。' },
      { l: '隔着门说话', fx: () => null, r: '你们隔着门聊了半个时辰，最后他把包袱从门缝塞进来——是给你娘带的年货。' }] },
    { id: 'df_hushan', w: 5, cond: G => zfHas(G, 'hushan') && debtOn(G), t: '催收员迷路', x: '护山大阵外，一个讨债司的小吏转了一下午，最后坐在门口哭：“我只是来送个通知……”', ch: [
      { l: '放他进来', fx: G => { K(G, 3); }, r: '通知上写：本年利息已计入。你给了他一杯茶，他给你行了个礼，说你是他见过最客气的欠债人。' },
      { l: '让阵法再转他一会', fx: G => { dxAdd(G, 2); }, r: '你看着他又转了三圈。他走的时候在门口留了张便条：「下次带地图。」' }] },
    { id: 'df_quiet', w: 10, cond: () => true, t: '无事', x: '洞府里静悄悄的。灵泉在响，炉子在响，你的肚子也在响。', ch: [
      { l: '歇一会', fx: G => { addExp(G, yExp() * 0.05); }, r: '难得一个没有人上门讨债的下午。' }] }
  ];
  DF43.EV = EV;
  W.DF43 = DF43;
  if (typeof module !== 'undefined' && module.exports) module.exports = DF43;
})(typeof window !== 'undefined' ? window : globalThis);

'use strict';
// ======================= 3.4③ 自由度层（life34）=======================
// 第 1 部分：#12 根治——NPC 屏幕重叠。
//  原因：等距投影下 (i-j) 相同的两格在屏幕同一竖列；翠花家 (12,16) 与剑仙家 (9,13) 同列、上下只差 144px，
//  翠花的头/名牌正好压在剑仙身上，点剑仙常打开翠花。
//  ①把翠花家挪到 (14,15)（同屋前空地，屏幕上与剑仙错开 3 列）；
//  ②NPC 闲逛目标若会与其他 NPC 在屏幕上叠成一列（|dx|<72 且 |dy|<230 世界 px），放弃这次闲逛。
if (typeof NPCS !== 'undefined' && NPCS.cuihua && NPCS.cuihua.at && NPCS.cuihua.at[0] === 12 && NPCS.cuihua.at[1] === 16) NPCS.cuihua.at = [14, 15];
const Life34 = {
  screenClash(e, ti, tj) {
    const [x, y] = t2p(ti + 0.5, tj + 0.5);
    for (const o of R.ents) { if (o === e || o.hidden || !(o.kind === 'npc' || o.kind === 'boss')) continue; const [ox, oy] = t2p(o.i, o.j); if (Math.abs(ox - x) < 72 && Math.abs(oy - y) < 230) return true; }
    return false;
  },
};
window.Life34 = Life34;
{ const _npcAI = npcAI; npcAI = function (e, dt) {
    const had = e.path && e.path.length; const r = _npcAI(e, dt);
    if (!had && e.path && e.path.length && !(e.talking > 0)) { const end = e.path[e.path.length - 1]; const ti = Array.isArray(end) ? end[0] : end.i, tj = Array.isArray(end) ? end[1] : end.j; if (Life34.screenClash(e, ti, tj)) e.path = []; }
    return r; }; }

// ======================= 第 2 部分：年度世界模拟（期 1）=======================
// 设计见 docs/openworld_upgrade.md「3.4 自由度层设计」。存档 G.life34（惰性默认值，不改 G.v）。
Life34.WANDER = ['fisherm', 'shuoshu', 'yaopu', 'b34_peddler', 'luren'].filter(id => !Object.values(QUESTS).some(q => q.giver === id)); // 任务给予者不流动，保证任务栏能追到
Life34.st = function () { const G = Game.G; if (!G) return null; const L = G.life34 = G.life34 || {}; L.v = 1; L.loc = L.loc || {}; L.rel = L.rel || {}; L.sect = L.sect || {}; L.log = L.log || []; L.seen = L.seen || {}; if (L.pending === undefined) L.pending = null; return L; };
Life34.home = function (id) { const N = NPCS[id]; return N && (N._map34 || N.map); };
Life34.where = function (id) { const L = Life34.st(); return (L && L.loc[id]) || Life34.home(id); };
Life34.say = function (txt) { const L = Life34.st(); if (!L) return; L.log.unshift(`第${Game.G.year || Game.G.age}年：${txt}`); L.log.length = Math.min(L.log.length, 20); };
// 流动 NPC：通过 roam 生效（保留原有 roam）
for (const id of Life34.WANDER) { const N = NPCS[id]; if (!N || N._wander34) continue; N._wander34 = 1; N._map34 = N.map; const r0 = N.roam; N.roam = function (G) { const L = G && G.life34; if (L && L.loc && L.loc[id]) return L.loc[id]; return r0 ? r0(G) : N._map34; }; }
Life34.simYear = function () {
  const G = Game.G, L = Life34.st(); if (!L || G.dead) return; const rnd = Math.random;
  // ① NPC 走动：35% 去相邻且玩家已能进入的图；15% 回家
  for (const id of Life34.WANDER) { const N = NPCS[id]; if (!N) continue; const cur = Life34.where(id); const links = (typeof Seam34 !== 'undefined' && (Object.keys(Seam34.links).length ? Seam34.links : Seam34.build())[cur]) || {};
    const opts = Object.values(links).filter(m => Game.canEnter(m) && ASSETS.maps[m]);
    if (cur !== N._map34 && rnd() < 0.15) { L.loc[id] = null; delete L.loc[id]; Life34.say(`${N.n}回到了${MAPINFO[N._map34].n}。`); }
    else if (opts.length && rnd() < 0.35) { const to = opts[Math.floor(rnd() * opts.length)]; L.loc[id] = to; Life34.say(`${N.n}去了${MAPINFO[to].n}。`); } }
  // ② 宗门关系：统一用 jianghu34/war29 的 G.sectRel（三宗势力由 JH34 年度推进），这里只读最差的一对
  const rel = G.sectRel || {}; let worst = null; for (const k in rel) if (rel[k] <= -50 && (!worst || rel[k] < worst[1])) worst = [k, rel[k]];
  // ②b 负面来源（数值按研究员定稿）：宗门敌对外溢在 sectWar 里处理；讨债司公示逾期（本年欠款涨了）→ 所有正恩怨 −5（每年一次）
  // #17：年息 3%（game.js 每年 ceil(debt×0.03) 自动滚）不算公示；只有超出「上次记录按年息滚到今天」+ 小余量（新借款/催收失败加罚）才算
  const yr0 = Life34.yr(); const d = G.debt || 0;
  if (L.lastDebt !== undefined && L.lastDebtYr !== undefined && d > 0) { let exp = L.lastDebt; for (let y = L.lastDebtYr; y < yr0 && y < L.lastDebtYr + 200; y++) if (exp > 0) exp += Math.ceil(exp * 0.03);
    if (d > exp + Math.max(5, exp * 0.005) && L.seen.debtPost !== yr0) { L.seen.debtPost = yr0; for (const id in L.rel) if (L.rel[id] > 0) Life34.rel(id, -5); Life34.say('讨债司张榜公示你的逾期欠款，熟人脸上都挂不住。'); } }
  L.lastDebt = d; L.lastDebtYr = yr0;
  // 奇遇链任务接了 3 年还没交 → 超时作废，给予者 −20
  for (const q in (G.quests || {})) if (q.startsWith('qc34_') && L.qt && L.qt[q] !== undefined && yr0 - L.qt[q] >= 3) { delete G.quests[q]; delete L.qt[q]; Life34.rel(QUESTS[q].giver, -20); Life34.say(`你没办完「${QUESTS[q].n}」，${NPCS[QUESTS[q].giver].n}很失望。`); }
  // ③ 找上门事件（每年最多 1 个；已有未处理的就不再生成）
  if (L.pending || G.age < 8) return;
  const foes = Object.entries(L.rel).filter(([, v]) => v <= -40), friends = Object.entries(L.rel).filter(([, v]) => v >= 40);
  const r = rnd();
  const yr = Life34.yr(); const fr = friends.filter(([id]) => !(yr - (L.seen['vf_' + id] ?? -99) < 3)); // 同一人 3 年冷却
  if (foes.length) L.pending = { type: 'foe', npc: foes[Math.floor(rnd() * foes.length)][0] }; // 有仇家必上门（一年内）
  else if (fr.length && r < 0.6) { let t = rnd() * fr.reduce((a, [, v]) => a + v, 0), pick = fr[0][0]; for (const [id, v] of fr) { t -= v; if (t <= 0) { pick = id; break; } } L.pending = { type: 'friend', npc: pick }; L.seen['vf_' + pick] = yr; }
  else if (worst && G.sect && worst[0].includes(G.sect) && r < 0.8) L.pending = { type: 'sect', pair: worst[0] };
  else if (r < 0.3) L.pending = { type: 'errand', npc: Life34.WANDER[Math.floor(rnd() * Life34.WANDER.length)] };
};
Life34.yr = function () { const G = Game.G; return (G && (G.year || G.age)) || 0; };
Life34.need = function () { const G = Game.G; return (REALMS[G.realm] || REALMS[0]).need; };
Life34.fee = function () { return Math.round(Life34.need() * 0.15); }; // 赔礼价：练气 30、金丹 195、化神 1140
Life34.gift = function (id) { const L = Life34.st(), nd = Life34.need(); const k = 'vfn_' + id; const n = L.seen[k] = (L.seen[k] || 0) + 1; let g = Math.min(Math.round(nd * (0.15 + 0.1 * Math.random())), Math.round(nd * 0.25)); if (n >= 2) g = Math.round(g / 2); if (n >= 3 && Math.random() < 0.5) return Math.random() < 0.5 ? { item: 'herb', c: 3 } : { item: 'ore', c: 1 }; return { stone: g }; };
Life34.rel = function (id, d) { const L = Life34.st(); if (!L) return; L.rel[id] = Math.max(-100, Math.min(100, (L.rel[id] || 0) + d)); };
{ const _ye = Game.yearEnd; Game.yearEnd = async function () { const y = this.G && this.G.year, a = this.G && this.G.age; const r = await _ye.apply(this, arguments); try { if (this.G && (this.G.year !== y || this.G.age !== a)) Life34.simYear(); } catch (e) { console.error('life34 sim', e); } return r; }; }
// 送礼/闲聊提升恩怨；收下“找上门”事件在进图时生成实体
{ const _ie = Game.interactEnt; Game.interactEnt = function (e) { try { if (e && e.kind === 'npc' && e.id && !e.id.startsWith('l34_')) Life34.onChat(e.id); } catch (er) { } return _ie.apply(this, arguments); }; }
Life34.spawnVisitor = function () {
  const G = Game.G, L = Life34.st(); if (!L || !L.pending || !R.player || R.mode !== 'map' || L.pending.shown === R.mapId) return; const p = L.pending;
  const base = p.npc && NPCS[p.npc]; const spr = base ? base.spr : 'npc_disciple'; const nm = p.type === 'sect' ? `${SECTS[p.pair.split('|').find(s => s !== G.sect) || G.sect].n}弟子` : base ? base.n : '来客';
  const P = R.player; let spot = null; for (let r = 2; r <= 4 && !spot; r++) for (let a = 0; a < 8 && !spot; a++) { const i = Math.floor(P.i + Math.cos(a) * r), j = Math.floor(P.j + Math.sin(a) * r); if (walkable(i, j) && !R.ents.some(e => Math.floor(e.i) === i && Math.floor(e.j) === j)) spot = [i, j]; }
  if (!spot) return; loadSprite(spr);
  R.ents = R.ents.filter(e => e.id !== 'l34_visitor');
  addEnt({ kind: 'npc', id: 'l34_visitor', spr, i: spot[0] + 0.5, j: spot[1] + 0.5, dir: 'S', label: nm, mark: '！', s: 1, home: spot, ai: () => { } });
  p.shown = R.mapId; UI.toast(p.type === 'foe' ? `${nm}找上门来了！` : p.type === 'friend' ? `${nm}特地来找你` : p.type === 'sect' ? `${nm}匆匆赶来求援` : `${nm}有事相托`);
};
Life34.visit = async function (e) {
  const G = Game.G, L = Life34.st(), p = L && L.pending; if (!p) { removeEnt(e); return; } const N = p.npc && NPCS[p.npc]; const por = (N && N.por) || 'npc_disciple'; const nm = e.label;
  if (p.type === 'foe') {
    const fee = Life34.fee(); let c;
    for (;;) { const can = (G.stone || 0) >= fee; c = await UI.say(por, nm, `【冤家路窄】${nm}拦住了你：“上回那笔账，今天算清楚！”` + (can ? '' : `\n\n（赔礼要 ${fee} 灵石，你不够）`), ['应战', (can ? '' : '🔒') + `赔礼（灵石 ${fee}）`]);
      if (c === 1 && !can) { UI.toast(`灵石不足（需 ${fee}）`); continue; } break; }
    if (c === 1) { G.stone -= fee; Life34.rel(p.npc, 25); Life34.say(`你向${nm}赔礼，恩怨稍解。`); }
    else { L.pending = null; removeEnt(e); Life34.say(`${nm}找你寻仇。`);
      const mons = MAPINFO[R.mapId].mons; const mon = mons[Math.floor(Math.random() * mons.length)]; const tier = MAPINFO[R.mapId].tier + 0.3;
      const r = await Game.fight(mon, { tier, elite: true }); Life34.rel(p.npc, r && r.res === 'win' ? -10 : 5); Game.save(); UI.hud(); return; }
  } else if (p.type === 'friend') {
    const gf = Life34.gift(p.npc); const txt = gf.stone ? `灵石 +${gf.stone}` : `${ITEMS[gf.item].n} ×${gf.c}`; await UI.say(por, nm, `【知恩图报】“上次多亏你了，这点心意收下！”\n\n${txt}`, ['收下']); if (gf.stone) G.stone = (G.stone || 0) + gf.stone; else Game.give(gf.item, gf.c); Life34.say(`${nm}登门道谢。`);
  } else if (p.type === 'sect') {
    const [a, b] = p.pair.split('|'); const other = a === G.sect ? b : a;
    const c = await UI.say(por, nm, `【宗门纠纷】${SECTS[other].n}与本门起了冲突，${nm}请你出面调停。`, ['出面调停（宗门贡献 +20）', '打发走']);
    if (c === 0) { G.contrib = (G.contrib || 0) + 20; G.sectRel = G.sectRel || {}; G.sectRel[p.pair] = Math.min(100, (G.sectRel[p.pair] || 0) + 40); Life34.say(`你出面调停了${SECTS[other].n}的纷争。`); } else { G.sectRel = G.sectRel || {}; G.sectRel[p.pair] = Math.max(-100, (G.sectRel[p.pair] || 0) - 10); Life34.sectNpcs(G.sect).forEach(id => Life34.rel(id, -10)); }
  } else {
    const c = await UI.say(por, nm, `【托付小事】“劳驾帮我跑一趟，回头请你喝茶。”`, ['答应（恩怨 +15，修为 +）', '打发走']);
    if (c === 1) Life34.rel(p.npc, -10);
    if (c === 0) { Life34.rel(p.npc, 15); G.exp = (G.exp || 0) + 60 + G.realm * 40; Life34.say(`你帮${nm}跑了一趟腿。`); }
  }
  L.pending = null; removeEnt(e); Game.save(); UI.hud();
};
{ const _ie2 = Game.interactEnt; Game.interactEnt = function (e) { if (e && e.id === 'l34_visitor') { if (R.player) R.player.path = []; return Life34.visit(e); } return _ie2.apply(this, arguments); }; }
{ const _rn = Game.refreshNpcs; Game.refreshNpcs = function () { const keep = R.ents.filter(e => e.id === 'l34_visitor'); const r = _rn.apply(this, arguments); for (const e of keep) if (!R.ents.includes(e)) R.ents.push(e); return r; }; }
{ const _em = Game.enterMap; Game.enterMap = async function () { const r = await _em.apply(this, arguments); try { const L = Life34.st(); if (L && L.pending) L.pending.shown = null; setTimeout(() => { try { if (!UI.modal) Life34.spawnVisitor(); } catch (e) { } }, 1500); } catch (e) { } return r; }; }

// ======================= 第 3 部分：每图一条奇遇链（期 1：5 张图）=======================
// 用现有 QUESTS（pre 串联），任务栏/追踪寻路/validate22 全部复用。
Life34.CHAINS = {
  qc34_v1: { n: '渡口欠条·一', giver: 'b34_boatman', d: '船夫的渡船被野猪拱翻了，帮他赶走 3 头暴躁野猪。', need: { k: { boar: 3 } }, rw: { exp: 120, stone: 80 } },
  qc34_v2: { n: '渡口欠条·二', giver: 'farmer', pre: 'qc34_v1', d: '王大爷说欠条是青云宗一个弟子打的。去青云宗看看（到达青云宗即可）。', need: { f: 'visit_sect' }, rw: { exp: 160, stone: 60 } },
  qc34_v3: { n: '渡口欠条·三', giver: 'b34_boatman', pre: 'qc34_v2', d: '欠条找不回来了，船夫想用灵草补船。带 2 株灵草给他。', need: { i: { herb: 2 } }, rw: { exp: 260, stone: 200 } },
  qc34_s1: { n: '后山禁地·一', giver: 'b34_guard', minRealm: 1, d: '后山石头精成灾，守山弟子请你打退 3 只。', need: { k: { rock: 3 } }, rw: { exp: 300, stone: 120 } },
  qc34_s2: { n: '后山禁地·二', giver: 'danlao', pre: 'qc34_s1', d: '丹房长老要 3 株灵草给守山弟子疗伤。', need: { i: { herb: 3 } }, rw: { exp: 300, stone: 150 } },
  qc34_s3: { n: '后山禁地·三', giver: 'b34_guard', pre: 'qc34_s2', d: '禁地里的纸符小鬼又出来了，清掉 4 只。', need: { k: { paper: 4 } }, rw: { exp: 500, stone: 300 } },
  qc34_m1: { n: '假货风波·一', giver: 'b34_hawker', minRealm: 1, d: '有狐狸精冒充小贩卖假货，抓 3 只。', need: { k: { fox: 3 } }, rw: { exp: 300, stone: 150 } },
  qc34_m2: { n: '假货风波·二', giver: 'merchant', pre: 'qc34_m1', d: '钱多多说真货要用玄铁晶验，给他 1 块。', need: { i: { ore: 1 } }, rw: { exp: 300, stone: 200 } },
  qc34_m3: { n: '假货风波·三', giver: 'b34_hawker', pre: 'qc34_m2', d: '幕后是讨债鬼在收保护费，打跑 3 只。', need: { k: { collector: 3 } }, rw: { exp: 600, stone: 400 } },
  qc34_x1: { n: '第三个宝箱·一', giver: 'b34_seeker', minRealm: 2, d: '寻宝人被树妖困住了，打倒 3 只树妖。', need: { k: { treant: 3 } }, rw: { exp: 500, stone: 200 } },
  qc34_x2: { n: '第三个宝箱·二', giver: 'b34_seeker', pre: 'qc34_x1', d: '藏宝图要用灵草汁显影，带 3 株灵草。', need: { i: { herb: 3 } }, rw: { exp: 500, stone: 250 } },
  qc34_x3: { n: '第三个宝箱·三', giver: 'b34_seeker', pre: 'qc34_x2', d: '宝箱旁守着火灵，打倒 3 只。', need: { k: { fire: 3 } }, rw: { exp: 900, stone: 600 } },
  qc34_h1: { n: '踩云费·一', giver: 'b34_clerk', minRealm: 5, d: '游魂赖着不交踩云费，赶走 4 只。', need: { k: { ghost: 4 } }, rw: { exp: 2000, stone: 800 } },
  qc34_h2: { n: '踩云费·二', giver: 'b34_clerk', pre: 'qc34_h1', d: '收费站缺建材，送 2 块玄铁晶。', need: { i: { ore: 2 } }, rw: { exp: 2000, stone: 1000 } },
  qc34_h3: { n: '踩云费·三', giver: 'b34_clerk', pre: 'qc34_h2', d: '讨债鬼想抢收费站，打跑 4 只。', need: { k: { collector: 4 } }, rw: { exp: 4000, stone: 2000 } },
};
{ const groups = {}; for (const q in Life34.CHAINS) { Life34.CHAINS[q].minAge = Life34.CHAINS[q].minAge || 8; } // 8 岁后才出现，不挤新手期追踪栏
  for (const q in Life34.CHAINS) (groups[q.slice(0, -1)] = groups[q.slice(0, -1)] || []).push(q); // 整条链的给予者都在才注册
  for (const g in groups) if (groups[g].every(q => NPCS[Life34.CHAINS[q].giver])) for (const q of groups[g]) if (!QUESTS[q]) QUESTS[q] = Life34.CHAINS[q]; }

// 恩怨负面来源的钩子：接奇遇链记年份（超时用）；宗门征伐中打赢敌宗弟子 → 该宗 NPC 全体 −15（每场征伐一次）
Life34.sectNpcs = function (sid) { const J = Game.G && Game.G.jh34; return J && J.npcs ? Object.keys(J.npcs).filter(id => J.npcs[id].sect === sid) : []; };
{ const _aq = Game.acceptQuest; Game.acceptQuest = function (q) { const r = _aq.apply(this, arguments); try { if (q.startsWith('qc34_')) { const L = Life34.st(); L.qt = L.qt || {}; L.qt[q] = Life34.yr(); } } catch (e) { } return r; }; }
{ const _f = Game.fight; Game.fight = async function () { const G = this.G, w = G && G.war, tg = w && w.active && w.target; const r = await _f.apply(this, arguments);
    try { if (tg && r && r.res === 'win') { const L = Life34.st(), k = 'war_' + tg + '_' + Life34.yr(); if (!L.seen[k]) { L.seen[k] = 1; Life34.sectNpcs(tg).forEach(id => Life34.rel(id, -15)); Life34.say(`你在征伐中打伤了${SECTS[tg].n}弟子，该宗上下记恨于你。`); } } } catch (e) { } return r; }; }

// ======================= 好感节奏（研究员定稿，2026-10-19）=======================
// 1) 旧好感 G.aff 的每次变化（Game.apply 的 aff 效果、Talk.gift）同步 L.rel += trunc(Δ×0.5)（向零取整：+9→+4，−5→−2）
// 2) 闲聊：每 NPC 每年第 1 次 +4，第 2、3 次各 +1，封顶 +6/年
// 3) 送礼（在 1 之外）：普通 +3、珍稀（千年灵芝/玄铁晶/妖丹）+6、对方最爱 +10；送礼部分每 NPC 每年封顶 +15
// 4) 奇遇链 qc34：每步给予者 +15，最后一步再 +10（整条 +55）
// 5) 不自然衰减；6) 老存档不按已有高 G.aff 回填，只同步今后的变化（L.fav=1 标记）
Life34.RARE = ['lz', 'ore', 'yd'];
Life34.LIKE = { mentor: 'wine', sister: 'jadeg', cuihua: 'jadeg', ali: 'fish', aoxiao: 'peach', sumei: 'coin', xiaoyi: 'fan', aotian: 'coin', ruyan: 'wine', bailang: 'fan', lengyue: 'jadeg' }; // 与 talk.js 送礼一致
Life34.yc = function () { const L = Life34.st(), y = Life34.yr(); if (!L.yc || L.yc.y !== y) L.yc = { y, chat: {}, gift: {} }; if (!L.fav) L.fav = 1; return L.yc; };
Life34.onChat = function (id) { const c = Life34.yc(); const n = c.chat[id] = (c.chat[id] || 0) + 1; const d = n === 1 ? 4 : n <= 3 ? 1 : 0; if (d) Life34.rel(id, d); };
Life34.onGift = function (id, item) { const c = Life34.yc(); const want = item === Life34.LIKE[id] ? 10 : Life34.RARE.includes(item) ? 6 : 3; const d = Math.max(0, Math.min(want, 15 - (c.gift[id] || 0))); c.gift[id] = (c.gift[id] || 0) + d; if (d) Life34.rel(id, d); };
Life34.syncAff = function (before) { const G = Game.G; if (!G || !G.aff) return; Life34.yc(); for (const id in G.aff) { const d = (G.aff[id] || 0) - (before[id] || 0); const r = Math.trunc(d * 0.5); if (r) Life34.rel(id, r); } };
{ const _ap = Game.apply; Game.apply = async function () { const G = this.G; const b = G && G.aff ? Object.assign({}, G.aff) : null; const r = await _ap.apply(this, arguments); try { if (b) Life34.syncAff(b); } catch (e) { } return r; }; }
if (typeof Talk !== 'undefined' && Talk.gift) { const _g = Talk.gift; Talk.gift = async function (id) { const G = Game.G; const b = Object.assign({}, G.aff), inv = Object.assign({}, G.inv); const r = await _g.apply(this, arguments);
    try { Life34.syncAff(b); const it = Object.keys(inv).find(k => (G.inv[k] || 0) < inv[k]); if (it) Life34.onGift(id, it); } catch (e) { } return r; }; }
{ const _fq = Game.finishQuest; Game.finishQuest = async function (q) { const r = await _fq.apply(this, arguments); try { if (q.startsWith('qc34_') && QUESTS[q]) { const L = Life34.st(); if (L.qt) delete L.qt[q]; Life34.rel(QUESTS[q].giver, 15 + (q.endsWith('3') ? 10 : 0)); } } catch (e) { } return r; }; }

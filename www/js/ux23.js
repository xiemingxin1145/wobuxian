// ======================= v2.3 体验：点NPC、交互按钮、标记/指引、主线前两章可点、任务追踪/寻路、自动任务、挂机/离线收益、开发者模式 =======================
// 根因（2.2.0 真机触控复现，见 design_feedback_v23.md §0）：命中框只有身体；名字/标记点了会落到道具或地面；左下摇杆区吞点击；
// 序章/第一章只能靠“过年”推进；NPC 闲逛导致走过去后静默失败；旧测试靠瞬移，从没真正“点”过 NPC。
const UX = {
  w: px => px * R.dpr / R.Z, // CSS 像素 → 世界坐标
  inMap() { return Game.G && !Game.G.dead && R.mode === 'map' && R.player && !UI.modal && !UI.stack.length && !Game._busy && !B.on && !document.querySelector('.gacha-fx,.chapter-fx,.brk-fx,.endw'); },
  // 走到实体旁边再交互：冻结 NPC、空路径直接到、到达后若 NPC 走开就重试，失败有提示；路上不被闲逛怪截胡
  goTo(e, quiet) {
    const P = R.player; if (!P || !e) return false;
    R.tapMark = { i: Math.floor(e.i), j: Math.floor(e.j), t: 0 };
    if (e.kind === 'npc') { e.talking = Math.max(e.talking || 0, 30); e.path = []; }
    if (Math.hypot(e.i - P.i, e.j - P.j) <= 1.7) { P.path = []; P.safeWalk = false; Game.interactEnt(e); return true; }
    let tries = 0;
    const arrive = () => {
      P.safeWalk = false; if (e.gone || !R.ents.includes(e) || UI.modal || Game._busy) return;
      if (Math.hypot(e.i - P.i, e.j - P.j) <= 2.6) { Nav.clear(); Game.interactEnt(e); return; }
      if (typeof AFK !== 'undefined' && AFK.on && !AFK.inBox(e.i, e.j)) return; /* 挂机不追出方框 */
      if (tries++ < 3) { const t = this.adj(e, P); P.safeWalk = e.kind !== 'mon'; moveTo(P, t[0], t[1], arrive); }
    };
    const t = this.adj(e, P); P.safeWalk = e.kind !== 'mon';
    if (!t || !moveTo(P, t[0], t[1], arrive)) { P.safeWalk = false; if (!quiet) UI.toast('那边过不去'); return false; }
    if (e.kind === 'mon') P.chase = e;
    return true;
  },
  adj(e, P) {
    const ei = Math.floor(e.i), ej = Math.floor(e.j); let best = null, bd = 1e9;
    for (const [di, dj] of [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]) { const i = ei + di, j = ej + dj; if (!walkable(i, j)) continue; const d = Math.hypot(i + 0.5 - P.i, j + 0.5 - P.j); if (d < bd) { bd = d; best = [i, j]; } }
    return best || nearestWalk(ei, ej + 1);
  },
  goMark(m, quiet) {
    const P = R.player; R.tapMark = { i: m.i, j: m.j, t: 0 };
    if (Math.abs(P.i - (m.i + 0.5)) < 1.3 && Math.abs(P.j - (m.j + 0.5)) < 1.3) { Game.interactMark(m); return true; }
    const ok = moveTo(P, m.i, m.j, ok => { Nav.clear(); if (ok) Game.interactMark(m); }); if (!ok && !quiet) UI.toast('那边过不去'); return ok;
  },
  near() { // 交互按钮目标：1.8 格内 NPC/BOSS 优先，其次 1.3 格内交互点
    const P = R.player; let best = null, bd = 1.8;
    for (const e of R.ents) { if ((e.kind !== 'npc' && e.kind !== 'boss') || e.hidden) continue; const d = Math.hypot(e.i - P.i, e.j - P.j); const hot = e.mark === '★' || e.mark === '?'; /* 按脚下世界距离取最近；几乎一样近（±0.1 格）时才优先主线/可交付目标 */ if (!best ? d < bd : (d < bd - 0.1 || (Math.abs(d - bd) <= 0.1 && hot && !best.hot))) { bd = Math.min(bd, d); best = { ent: e, hot }; } }
    if (best) return best;
    for (const m of R.marks) { if (m.hidden) continue; const d = Math.hypot(m.i + 0.5 - P.i, m.j + 0.5 - P.j); if (d < 1.3) return { mark: m }; }
    return null;
  },
};
// ---------- A.1 命中：身体+名字+标记（≥56×88 CSS px），NPC/BOSS 优先；胖手指兜底；交互点只认“标签药丸+脚下圆” ----------
function entHitRect(e) {
  const [x, y] = t2p(e.i, e.j); const b = spriteBox(e.spr, e.s); const npc = e.kind === 'npc' || e.kind === 'boss';
  const head = e.label ? (npc ? 44 : 30) : 0, mark = e.mark ? 70 : 0;
  const hw = Math.max(b.w / 2 + 10, UX.w(npc ? 32 : 28)); const top = y - b.h - 6 - head - mark - 8, bot = y + Math.max(20, UX.w(10));
  return { x0: x - hw, x1: x + hw, y0: Math.min(top, bot - UX.w(88)), y1: bot, cx: x, cy: y - b.h / 2, ytop: top, ybot: y };
}
pickAt = function (sx, sy) {
  const [wx, wy] = s2w(sx, sy);
  // 统一规则（摇杆区内外一样）：所有判定框/名字牌命中的人里，选“身体中心或名字牌中心”离点按位置最近的那个；怪要明显更近才选（不误触开战）
  let best = null, bs = 1e9;
  for (const e of R.ents) {
    if (e.hidden || e === R.player || e.gone || !(e.kind === 'npc' || e.kind === 'boss' || e.kind === 'mon')) continue;
    const r = entHitRect(e); const [ex, ey] = t2p(e.i, e.j); const sb = spriteBox(e.spr, e.s);
    let hit = wx >= r.x0 && wx <= r.x1 && wy >= r.y0 && wy <= r.y1, dp = 1e9;
    if (e.label && e.kind !== 'mon') { const ty = ey - sb.h - 6 - (e.lift || 0); const hw = (e.label.length * 30 + 22) / 2 + 6; const mk = e.mark ? 50 : 0;
      if (Math.abs(wx - ex) <= hw && wy >= ty - 38 - mk && wy <= ty + 14) { hit = true; dp = Math.hypot(wx - ex, Math.max(0, wy - (ty - 12)) + Math.max(0, (ty - 38) - wy) * 0.3); } }
    if (!hit) continue;
    const cy = ey - (sb.h + (e.lift || 0)) / 2; const db = Math.hypot(wx - ex, Math.max(0, Math.abs(wy - cy) - sb.h * 0.3) * 0.8 + Math.min(Math.abs(wy - cy), sb.h * 0.3) * 0.25);
    const sc = Math.min(db, dp) + (e.kind === 'mon' ? 30 : 0);
    if (sc < bs) { bs = sc; best = { ent: e }; }
  }
  if (best) return best;
  let fd = UX.w(36);
  for (const e of R.ents) { if (e.hidden || (e.kind !== 'npc' && e.kind !== 'boss')) continue; const r = entHitRect(e); const d = Math.max(0, Math.hypot(wx - r.cx, wy - r.cy) - (r.x1 - r.x0) / 2); if (d < fd) { fd = d; best = { ent: e }; } }
  if (best) return best;
  for (const m of R.marks) {
    if (m.hidden) continue; const [x, y] = t2p(m.i + 0.5, m.j + 0.5); const by = y - (m.h || 110);
    if ((Math.abs(wx - x) < 56 && wy > by - 30 && wy < by + 18) || Math.hypot(wx - x, (wy - y) * 2) < 50) return { mark: m };
  }
  const [ti, tj] = p2t(wx, wy); return { tile: [Math.floor(ti), Math.floor(tj)] };
};
Game.onTap = function (x, y) {
  if (UI.modal || this._busy || R.mode !== 'map') return; const P = R.player; if (!P) return;
  if (AUTO.on) AUTO.stop('你接管了操作，自动已暂停');
  const h = pickAt(x, y); Nav.clear();
  if (h.ent) { UX.goTo(h.ent); return; }
  if (h.mark) { UX.goMark(h.mark); return; }
  const [ti, tj] = h.tile; R.tapMark = { i: ti, j: tj, t: 0 }; P.chase = null; P.safeWalk = false; if (!moveTo(P, ti, tj)) UI.toast('那边过不去');
};
R.onJoy = () => { Nav.clear(); if (AUTO.on) AUTO.stop('你接管了操作，自动已暂停'); };
// ---------- A.4 标记：主线 ★、可接 ！、可交 ？、进行中 …、普通 💬 ----------
const _npcMark = Game.npcMark.bind(Game);
Game.npcMark = function (id) {
  const G = this.G; if (Talk.mainTalk(id, true)) return '★';
  const m = _npcMark(id); if (m) return m;
  for (const q in G.quests) if (QUESTS[q].giver === id) return '…';
  return '💬';
};
// 保险（issue #2）：任何战斗结束后，地图点按回调一定恢复
const _fight23 = Game.fight.bind(Game);
Game.fight = async function (...a) { try { const r = await _fight23(...a); if (AUTO.on && r && r.res !== 'win' && Game.G) { const G = Game.G; AUTO.weak = { main: G.main, pw: G.realm * 10 + G.stage, y: G.year }; UI.toast('打不过——自动先去变强（打怪/修炼），两年后或境界提升再来'); } return r; } finally { R.onTap = (x, y) => Game.onTap(x, y); } };
// 桃花村原本没有采药点，但娘的「灵草汤」7 岁就给 → 支线做不了。给村子加两处野草丛采药点（每年可采）
const VILLAGE_HERBS = [[8, 14], [17, 6]];
const _mm23 = Game.makeMarks.bind(Game);
Game.makeMarks = function (...a) { const r = _mm23(...a); const G = this.G;
  if (R.mapId === 'village') VILLAGE_HERBS.forEach(([ti, tj], k) => { const [i, j] = nearestWalk(ti, tj); const key = `village_herb23_${k}`; if (!R.marks.some(m => m.i === i && m.j === j)) R.marks.push({ i, j, label: '采药', act: 'herb', key, prop: { t: 'herb', i, j, fw: 1, fh: 1 }, h: 60, hidden: !!G.used[key] }); });
  return r; };
const HERB_MAPS = ['village', ...Object.keys((window.ASSETS && ASSETS.maps) || {}).filter(id => (ASSETS.maps[id].props || []).some(p => (Array.isArray(p) ? p[0] : p.t) === 'herb'))];
// 守卫：在地图上（非战斗）时点按回调必须是地图的；任何遗漏的退出路径都会在 0.3 秒内被修正
setInterval(() => { if (R.mode === 'map' && !(typeof B !== 'undefined' && B.on) && typeof R.onTap !== 'function' && Game.G) { R.onTap = (x, y) => Game.onTap(x, y); console.warn('R.onTap restored by guard'); } }, 300);
// 修 bug：过年会清空 G.used，但地图上已采的药/开过的箱子标记一直隐藏到换地图才回来 → 过年后立即恢复
const _ye23 = Game.yearEnd.bind(Game);
Game.yearEnd = async function (...a) { const r = await _ye23(...a); const G = this.G; if (G && R.marks) for (const m of R.marks) if (m.hidden && m.key && !G.used[m.key] && ['herb', 'chest', 'peach', 'bell', 'well', 'incense', 'coffin'].includes(m.act)) m.hidden = false; return r; };
// ---------- A.6 序章/第一章改成“能点出来” ----------
if (NPCS.mentor) delete NPCS.mentor.minAge; // 剑仙在打跑讨债史莱姆后就出现（game.js refreshNpcs 以 flags.main0 为条件）
const _ie = Game.interactEnt.bind(Game);
Game.interactEnt = function (e) { if (Game.meta && !Game.meta.tut23 && (e.kind === 'npc' || e.kind === 'boss')) { Game.meta.tut23 = 1; Game.saveMeta(); } return _ie(e); };
const _refresh = Game.refreshNpcs.bind(Game);
Game.refreshNpcs = function () {
  _refresh(); const G = this.G; if (!G || !R.M || (R.mode !== 'map' && R.mode !== 'battle')) return;
  for (const e of R.ents) if (e.kind === 'boss' && e.mark === '!') e.mark = '★';
  if (R.mapId === 'village' && MAIN[G.main] && MAIN[G.main].id === 'debt' && !G.flags.main0 && !R.ents.find(e => e.id === 'debt_slime')) {
    const [i, j] = nearestWalk(8, 10); addEnt({ kind: 'boss', id: 'debt_slime', spr: 'mon_collector', i: i + 0.5, j: j + 0.5, dir: 'SE', label: '讨债史莱姆', lc: '#ffb040', s: 0.95, mark: '★' }); loadSprite('mon_collector');
  }
};
const _mainTalk = Talk.mainTalk.bind(Talk);
Talk.mainTalk = function (id, check) {
  const G = Game.G;
  if (G && G.main === MI('mentor') && id === 'mentor' && !G.flags.main1) return ['替他付酒钱', async () => {
    await UI.card('落魄剑仙', '村口酒肆来了个醉醺醺的剑客，赊了三坛酒没给钱，正被老板娘追着打。\n\n你掏出攒了好久的零花钱，替他付了酒钱。', 'npc_mentor', ['继续']);
    G.stone = Math.max(0, G.stone - 30); G.flags.main1 = 1; G.flags.ev_c_mentor = 1; G.aff.mentor = (G.aff.mentor || 0) + 20;
    await UI.say('npc_mentor', '落魄剑仙', '嗝……小子，我看你骨骼清奇……要不要测测灵根？', ['好']);
    const nx = _mainTalk('mentor'); if (nx) await nx[1]();
    Game.refreshNpcs(); UI.hud();
  }];
  return _mainTalk(id, check);
};
const _boss = Talk.boss.bind(Talk);
Talk.boss = async function (id) {
  if (id !== 'debt_slime') return _boss(id);
  const G = Game.G;
  await UI.card('讨债的来了', `一只戴着小礼帽的史莱姆在门口敲锣：“老${G.name.slice(0, 1)}家！飞升尾款该还了！”\n\n娘躲在你身后，你握紧了扫帚。`, 'mon_collector', ['抄起扫帚']);
  const r = await Game.fight('slime', { tier: 0.3, solo: true, noflee: true });
  G.flags.main0 = 1; G.flags.ev_c_debtor = 1; if (G.main === 0) G.main = MI('mentor'); Game.checkMain();
  if (r.res !== 'win') await UI.card('讨债的来了', '你被史莱姆弹飞了……娘抄起扫帚把它打跑了。\n“下回打不过就喊娘！”', 'npc_mom', ['好']);
  await UI.card('第一章·剑仙路过', '刚打跑讨债的，村口酒肆就传来一阵吵闹——一个醉醺醺的剑客赊酒不给钱。\n\n（头顶有 ★ 的就是主线人物，点他对话）', 'npc_mentor', ['去看看']);
  Game.refreshNpcs(); UI.hud(); Game.save();
};
// ---------- A.3 交互按钮（靠近 NPC/BOSS/交互点） + 首次指引 + 屏幕外主线箭头 ----------
const mk = (tag, id, html) => { const d = document.createElement(tag); d.id = id; if (html) d.innerHTML = html; document.body.appendChild(d); return d; };
const AB_ = mk('button', 'actbtn');
AB_.onclick = () => { const t = UX.near() || AB_._t; /* 点下的瞬间重新取最近目标，避免用到上一帧的 */ if (!t || !UX.inMap()) return; Sfx.play('click'); if (AUTO.on) AUTO.stop('你接管了操作，自动已暂停'); Nav.clear(); if (t.ent) UX.goTo(t.ent); else UX.goMark(t.mark); };
const TUT = mk('div', 'tuthint', '<div class="tb">头顶有 <b>★</b> 的是主线人物<br>点他（身体、名字、标记都行）就能对话</div><div class="th">👇</div>');
const ARW = mk('button', 'navarrow', '<i>➤</i><small></small>');
ARW.onclick = () => { if (UX.inMap()) { Sfx.play('click'); Track.go('main'); } };
const _npcTalk = Talk.npc.bind(Talk);
Talk.npc = async function (id) { if (Game.meta && !Game.meta.tut23) { Game.meta.tut23 = 1; Game.saveMeta(); } return _npcTalk(id); };
const scr = e => { const [a, b] = t2p(e.i, e.j); const [sx, sy] = w2s(a, b); return [sx / R.dpr, sy / R.dpr]; };
setInterval(() => {
  const ok = UX.inMap() && document.body.classList.contains('ingame') && !AFK.on;
  const t = ok ? UX.near() : null; AB_._t = t;
  if (t) {
    const e = t.ent, N = e && NPCS[e.id]; const act = e ? (e.kind === 'boss' ? '挑战' : e.mark === '?' ? '交付' : '对话') : t.mark.label;
    const por = e ? (N ? porCss(N.por, 44) : '') : iconCss(({ herb: 'herb', chest: 'chest', mat: 'scroll' })[t.mark.act] || 'scroll', 40);
    const html = `<i style="${por}"></i><b>${esc(act)}</b><small>${esc(e ? (e.label || '') : '')}</small>`; if (AB_._h !== html) { AB_.innerHTML = html; AB_._h = html; }
    AB_.className = 'show' + (e && e.mark === '★' ? ' hot' : '');
  } else AB_.className = '';
  // 首次指引：指向屏幕内的 ★（没有就 ！/最近的 NPC），直到第一次对话
  let g = null; const W = innerWidth, H = innerHeight; const inView = e => { const [sx, sy] = scr(e); return sx > 40 && sx < W - 40 && sy > 260 && sy < H - 300; };
  if (ok && Game.meta && !Game.meta.tut23 && !t) { const P = R.player; const c = R.ents.filter(x => (x.kind === 'npc' || x.kind === 'boss') && !x.hidden && inView(x)); const rank = x => ({ '★': 0, '!': 1, '?': 1 }[x.mark] ?? 2); c.sort((a, b) => rank(a) - rank(b) || Math.hypot(a.i - P.i, a.j - P.j) - Math.hypot(b.i - P.i, b.j - P.j)); g = c[0]; }
  if (g) { const [x, y] = t2p(g.i, g.j); const b = spriteBox(g.spr, g.s); const [sx, sy] = w2s(x, y - b.h - (g.mark ? 130 : 60)); TUT.style.left = (sx / R.dpr) + 'px'; TUT.style.top = (sy / R.dpr) + 'px'; TUT.className = 'show'; } else TUT.className = '';
  // 屏幕外主线箭头
  let a = null; if (ok) { a = R.ents.find(x => x.mark === '★' && !x.hidden); if (a && inView(a)) a = null; }
  if (a) { const P = R.player; const [sx, sy] = scr(a); const cx = W / 2, cy = H / 2; const ang = Math.atan2(sy - cy, sx - cx); const ax = Math.max(28, Math.min(W - 72, cx + Math.cos(ang) * 400)), ay = Math.max(300, Math.min(560, cy + Math.sin(ang) * 400));
    ARW.style.left = ax + 'px'; ARW.style.top = ay + 'px'; ARW.querySelector('i').style.transform = `rotate(${ang}rad)`; ARW.querySelector('small').textContent = `${esc(a.label || '')} ${Math.round(Math.hypot(a.i - P.i, a.j - P.j))}格`; ARW.className = 'show'; } else ARW.className = '';
}, 150);
// ---------- B 任务追踪 + 一键寻路（跨图御剑需确认） ----------
const Nav = {
  bar: mk('div', 'navbar'), cur: null,
  set(txt) { this.cur = txt; if (R.player) R.player.nav = { txt }; this.bar.textContent = `自动寻路 → ${txt} · 点地面取消`; this.bar.className = 'show'; },
  clear() { this.cur = null; this.bar.className = ''; if (R.player) { R.player.safeWalk = false; R.player.nav = null; } },
};
const Track = {
  mapOf(id) { const N = NPCS[id]; return N ? (N.roam ? N.roam(Game.G) : N.map) : null; },
  // { kind:'npc'|'boss'|'mon'|'mark'|'year'|'realm'|'break'|'none', map, id, txt, btn }
  target(q) {
    const G = Game.G; if (!G) return null;
    if (q === 'main') {
      const m = MAIN[G.main]; if (!m || m.id === 'done' || G.main >= MAIN.length - 1) return { kind: 'none', txt: '主线已完结' };
      if (G.realm < (m.realm || 0)) return Game.canBreak() ? { kind: 'break', btn: '突破', txt: '修为已满，可以突破了' } : { kind: 'realm', btn: '修炼', txt: `需要「${REALMS[m.realm].n}」，先修炼` };
      if (m.id === 'debt' && !G.flags.main0) return { kind: 'boss', map: 'village', id: 'debt_slime', btn: '前往', txt: '打跑讨债史莱姆' };
      for (const id in NPCS) { const mp = this.mapOf(id); if (mp && Talk.mainTalk(id, true)) return Game.canEnter(mp) ? { kind: 'npc', map: mp, id, btn: '前往', txt: `找${NPCS[id].n.split('·').pop()}` } : { kind: 'realm', btn: '修炼', txt: `${MAPINFO[mp].n}需要${REALMS[MAPINFO[mp].need].n}` }; }
      const I = MAPINFO[m.map]; if (I && I.boss && m.boss === I.boss && !G.bosses[I.boss]) return Game.canEnter(m.map) ? { kind: 'boss', map: m.map, id: I.boss, btn: '前往', txt: `挑战${MONS[I.boss].n.split('·').pop()}` } : { kind: 'realm', btn: '修炼', txt: `需要${REALMS[I.need].n}才能前往${I.n}` };
      return { kind: 'year', btn: '过年', txt: '过年推进剧情' };
    }
    if (q === 'bang') { const P = R.player; if (!P) return null; const c = R.ents.filter(e => e.kind === 'npc' && e.mark === '!'); if (!c.length) return null; c.sort((a, b) => Math.hypot(a.i - P.i, a.j - P.j) - Math.hypot(b.i - P.i, b.j - P.j)); return { kind: 'npc', map: R.mapId, id: c[0].id, btn: '前往', txt: `${c[0].label}有委托`, n: c.length }; }
    const Q = QUESTS[q]; if (!Q || !G.quests[q]) return null; const nm = id => NPCS[id].n.split('·').pop();
    if (Game.questDone(q)) { const mp = this.mapOf(Q.giver); return mp ? { kind: 'npc', map: mp, id: Q.giver, btn: '前往', txt: `交付给${nm(Q.giver)}` } : { kind: 'none', txt: '交付人不在' }; }
    if (Q.need.f) { const f = Q.need.f; if (/^visit_/.test(f)) { const mp = f.slice(6); const I = MAPINFO[mp]; if (I && !Game.canEnter(mp)) return { kind: 'realm', btn: '修炼', txt: `${I.n}需要${REALMS[I.need].n}` }; return { kind: 'map', map: mp, btn: '前往', txt: `去${I ? I.n : mp}` }; } const mp = this.mapOf(Q.giver); return mp ? { kind: 'npc', map: mp, id: Q.giver, btn: '前往', txt: `找${nm(Q.giver)}` } : { kind: 'none', txt: '' }; }
    if (Q.need.k) {
      const e = Object.entries(Q.need.k).find(([m, c]) => (G.kills[m] || 0) - (G.quests[q].k0[m] || 0) < c); if (!e) return null; const mon = e[0];
      const mp = MAP_ORDER.filter(id => MAPINFO[id].mons.includes(mon) && Game.canEnter(id)).sort((a, b) => MAPINFO[a].tier - MAPINFO[b].tier)[0];
      return mp ? { kind: 'mon', map: mp, id: mon, btn: '前往', txt: `击败${MONS[mon].n}` } : { kind: 'realm', btn: '修炼', txt: `${MONS[mon].n}所在地图未解锁` };
    }
    if (Q.need.i) {
      const e = Object.entries(Q.need.i).find(([i, c]) => !Game.has(i, c)); if (!e) return null; const it = e[0]; const iname = ITEMS[it] ? ITEMS[it].n : it;
      if (['herb', 'lz'].includes(it)) {
        if (R.marks.some(m => m.act === 'herb' && !m.hidden)) return { kind: 'mark', map: R.mapId, act: ['herb'], btn: '前往', txt: `采药得${iname}` };
        const mp = HERB_MAPS.find(id => id !== R.mapId && Game.canEnter(id) && MAPINFO[id]);
        if (mp && G.ap > 0) return { kind: 'mark', map: mp, act: ['herb'], btn: '前往', txt: `去${MAPINFO[mp].n}采药` };
        return { kind: 'year', btn: '过年', txt: `药采完了，过年后再长（还差${iname}）` };
      }
      for (const id of MAP_ORDER) { if (!Game.canEnter(id)) continue; const mon = MAPINFO[id].mons.find(m => (MONS[m].drop || []).includes(it)); if (mon) return { kind: 'mon', map: id, id: mon, btn: '前往', txt: `打${MONS[mon].n}掉${iname}` }; }
      return { kind: 'none', txt: `${iname}：打怪/事件掉落` };
    }
    return null;
  },
  async travel(map, quiet) { // 御剑确认（含“不再询问”）；行动力不足时提示过年
    const G = Game.G; G.track = Object.assign({ askTravel: true }, G.track || {});
    if (G.ap <= 0) { if (quiet) return false; const c = await UI.card('行动力不足', `今年行动力用完了，御剑前往${MAPINFO[map].n}需要 1 点行动力。`, null, ['过年', '取消']); if (c === 0) await UI.confirmYear(); return false; }
    if (G.track.askTravel && !quiet) { const c = await UI.card('自动寻路', `御剑前往【${MAPINFO[map].n}】？\n（消耗 1 点行动力，剩余 ${G.ap}）`, null, ['前往', '前往且不再询问', '取消']); if (c === 2) return false; if (c === 1) G.track.askTravel = false; }
    await Game.travel(map); return R.mapId === map;
  },
  // 执行一步：'travel' | 'walk' | 'act' | 'none'
  async step(t, quiet) {
    if (!t) return 'none';
    if (t.kind === 'year') { if (!quiet) await UI.confirmYear(); return quiet ? 'none' : 'act'; }
    if (t.kind === 'break') { if (!quiet) await Game.tryBreak(); return quiet ? 'none' : 'act'; }
    if (t.kind === 'realm') { const m = R.marks.find(m => ['mat', 'jade'].includes(m.act)); if (!quiet) { UI.toast(t.txt); if (m) { Nav.set(m.label); UX.goMark(m); return 'walk'; } } return 'none'; }
    if (t.kind === 'none') { if (!quiet && t.txt) UI.toast(t.txt); return 'none'; }
    if (t.map && t.map !== R.mapId) { if (!Game.canEnter(t.map)) { if (!quiet) UI.toast(`还不能前往${MAPINFO[t.map].n}`); return 'none'; } return (await this.travel(t.map, quiet)) ? 'travel' : 'none'; }
    if (t.kind === 'map') { if (!quiet) UI.toast(`已到达${MAPINFO[t.map].n}`); return 'none'; }
    let e = null; const P = R.player;
    if (t.kind === 'npc') e = R.ents.find(x => x.kind === 'npc' && x.id === t.id);
    if (t.kind === 'boss') e = R.ents.find(x => x.kind === 'boss' && x.id === t.id);
    if (t.kind === 'mon') { e = R.ents.filter(x => x.kind === 'mon' && !x.gone && x.mon === t.id).sort((a, b) => Math.hypot(a.i - P.i, a.j - P.j) - Math.hypot(b.i - P.i, b.j - P.j))[0]; if (!e) { if (!quiet) UI.toast(`这里的${MONS[t.id].n}暂时打完了，过年后会再出现`); return 'none'; } }
    if (e) { if (!quiet) Nav.set(t.txt); if (e.kind === 'npc') e.talking = 30; return UX.goTo(e, quiet) ? 'walk' : 'none'; }
    if (t.kind === 'npc' || t.kind === 'boss') { if (!quiet) UI.toast(`${t.txt}：他现在不在这里`); return 'none'; }
    if (t.kind === 'mark') { const m = R.marks.filter(m => t.act.includes(m.act) && !m.hidden).sort((a, b) => Math.hypot(a.i - P.i, a.j - P.j) - Math.hypot(b.i - P.i, b.j - P.j))[0]; if (m) { if (!quiet) Nav.set(t.txt); if (UX.goMark(m, quiet)) return 'walk'; } else if (!quiet) UI.toast('这张图的药已经采完了'); return 'none'; }
    if (!quiet) UI.toast(t.txt || '目标不在这里'); return 'none';
  },
  async go(q) { if (!UX.inMap()) return; Nav.clear(); const r = await this.step(this.target(q)); if (r === 'travel') { await new Promise(r => setTimeout(r, 600)); if (UX.inMap()) await this.step(this.target(q)); } },
  list() { const G = Game.G; const qs = Object.keys(G.quests); qs.sort((a, b) => Game.questDone(b) - Game.questDone(a)); return ['main', ...qs]; },
};
const _hud = UI.hud.bind(UI);
UI.hud = function () {
  const r = _hud(); const G = Game.G; const qt = $('#qt'); if (!G || !qt || !MAIN[G.main]) return r;
  const M = MAIN[G.main]; const row = (q, name, sub) => { const t = Track.target(q) || {}; return `<div class="qr" data-q="${q}"><div class="qx"><b>${name}</b><em>${esc(t.txt || sub || '')}</em></div>${t.btn ? `<button class="qbtn${t.kind === 'year' ? ' yr' : ''}" data-q="${q}">${t.btn}${t.btn === '前往' ? '▶' : ''}</button>` : ''}</div>`; };
  const rows = [row('main', '主·' + esc(M.n.replace(/^第.+?章·/, '')))];
  for (const q of Track.list().slice(1, 3)) rows.push(row(q, '支·' + (Game.questDone(q) ? '✔' : '') + esc(QUESTS[q].n), Game.questProg(q)));
  if (Track.list().filter(q => q !== 'main' && (Track.target(q) || {}).kind !== 'realm').length === 0) { const t = Track.target('bang'); if (t) rows.push(row('bang', `附近有 ${t.n} 个委托（！）`)); }
  qt.innerHTML = `<div class="qh"><span class="qt1">任务</span><button class="qauto${AUTO.on === 'quest' ? ' on' : ''}${AUTO.wait ? ' wait' : ''}">${AUTO.wait ? '等你选' : '自动'}</button></div>` + rows.join('');
  return r;
};
document.addEventListener('click', e => { // 捕获阶段接管任务栏（UI.init 里旧的 onclick 只会打开任务面板）
  if (!e.target.closest('#qt')) return; e.stopPropagation(); e.preventDefault(); if (UI.modal || !Game.G) return; Sfx.play('click');
  if (e.target.closest('.qauto')) { if (AUTO.on === 'quest') AUTO.stop('已关闭自动任务'); else AUTO.start('quest'); return; }
  const b = e.target.closest('.qbtn'); if (b) { if (AUTO.on) AUTO.stop(); Track.go(b.dataset.q); return; }
  UI.panel('quests');
}, true);
const _pq = UI.p_quests.bind(UI);
UI.p_quests = function (b, re, close) {
  _pq(b, re, close); const qs = ['main', ...Object.keys(Game.G.quests)]; const its = [...b.querySelectorAll('.it')];
  its.forEach((it, k) => { const q = qs[k]; if (!q) return; const t = Track.target(q); if (!t || !t.btn) return; const bt = document.createElement('button'); bt.className = 'opt qgo'; bt.textContent = t.btn; bt.onclick = ev => { ev.stopPropagation(); close(); setTimeout(() => Track.go(q), 300); }; it.appendChild(bt); });
};
// ---------- B.4 自动任务 / C.1 挂机：只走路、对话、托管战斗，绝不瞬移；只点“安全选项”，需要玩家决定就暂停 ----------
const SAFE = /^(打坐（|★|✔|！|接受|继续|好|收下|交付|……|应战|带路|明白|谢|原来如此|伸手|去后巷|去看看|你说什么|撤|知道了|确定|抄起扫帚|开始|过年)/;
const UNSAFE = /(结局|道侣|拜师|高利贷|借|送礼|交易|出售|驱逐|成为新天道|销账|渡劫|飞升|放弃|轮回|删除|重置)/;
const AUTO = {
  on: null, wait: false, last: 0, n: 0, seen: {},
  start(mode) { if (mode === 'idle') return AFK.ask(); this.on = mode; this.wait = false; UI.toast('自动任务：自动寻路、对话、战斗、交付（不会替你做重要选择）'); UI.hud(); },
  stop(msg) { if (!this.on) return; const was = this.on; this.on = null; this.wait = false; B.speed = DEV.ts || 1; Nav.clear(); if (msg) UI.toast(msg); if (was === 'idle') AFK.end(); UI.hud(); },
  pick(top) { // 当前弹窗里的安全选项；NPC 菜单没有安全项时“离开”
    const os = [...top.querySelectorAll('.opt')].filter(b => !b.disabled && b.offsetParent); if (!os.length) return null;
    const ok = os.filter(b => SAFE.test(b.textContent.trim()) && !UNSAFE.test(b.textContent));
    if (this.on === 'idle') { const nq = ok.filter(b => !/^！/.test(b.textContent.trim())); if (nq.length) return nq[0]; } else if (ok.length) return ok[0];
    if (os.length === 1 && !UNSAFE.test(os[0].textContent)) return os[0];
    const leave = os.find(b => /^(离开|算了|先撤|撤)$/.test(b.textContent.trim())); if (leave && top.querySelector('.dlg,.say,.dn')) return leave;
    return null;
  },
  modal() { // true = 有弹窗/演出/战斗在处理
    const G = Game.G; if (document.querySelector('.endw') || G.dead) { this.stop('这一世结束了，自动已停止'); return true; }
    const fx = document.querySelector('.gacha-fx .gclose, .chapter-fx'); if (fx) { fx.click(); return true; }
    if (document.querySelector('.gacha-fx,.brk-fx')) return true;
    if (B.on) { B.speed = Math.max(B.speed, AFK.on ? 3 : 2); const ab = document.querySelector('#battlebar button[data-a=auto]'); if (ab && !document.querySelector('#battlebar.wait') && !B.auto) ab.click(); return true; }
    const top = UI.stack[UI.stack.length - 1];
    if (top) {
      if (top.querySelector('.create,.meta')) { this.stop(); return true; }
      const b = this.pick(top);
      if (b) { this.wait = false; if (!top._autoT) top._autoT = performance.now(); if (performance.now() - top._autoT > 700 / Math.max(1, DEV.ts || 1)) { top._autoT = 0; b.click(); } return true; }
      if (top.querySelector('.ph .x') && !top.querySelector('.opt')) { top.querySelector('.ph .x').click(); return true; }
      if (!this.wait) { this.wait = true; UI.toast('需要你做选择（自动已暂停，选完继续）'); UI.hud(); }
      return true;
    }
    if (this.wait) { this.wait = false; UI.hud(); }
    return false;
  },
  async tick() {
    if (!this.on || !Game.G) return; if (this.modal()) return;
    if (Game._busy || R.mode !== 'map' || !R.player) return; const P = R.player, G = Game.G;
    if (P.path && P.path.length) return;
    const now = performance.now(); if (now - this.last < 450 / Math.max(1, DEV.ts || 1)) return; this.last = now; this.n++;
    const s = Game.stats();
    if (G.hp < s.mhp * 0.3) { if (Game.has('hcd')) { UI.useItem('hcd'); return; } if (!this._lowTold) { this._lowTold = 1; UI.toast('气血不足：先打坐/过年回血，不去打架'); } return AFK.chores(this.on === 'quest', true); }
    this._lowTold = 0;
    if (Game.lifeMax() - G.age <= 3) { this.stop('寿元将尽，自己做决定吧'); return; }
    for (const [sl] of SLOTS) { const c = G.eqs.filter(e => e.slot === sl).sort((a, b) => Game.eqScore(b) - Game.eqScore(a))[0]; if (c && G.eq[sl] !== c.uid && Game.eqScore(c) > (G.eq[sl] ? Game.eqScore(G.eqs.find(e => e.uid === G.eq[sl]) || { main: {}, aff: [], rar: 0 }) : -1)) Game.equip(c.uid); }
    if (Game.canBreak() && !this._brkTold) { this._brkTold = G.realm; UI.toast('修为已满！渡劫突破要你自己点「突破」'); }
    if (this.on === 'quest') {
      const pw = G.realm * 10 + G.stage, wk = this.weak; const weakMain = wk && wk.main === G.main && pw <= wk.pw && G.year - wk.y < 2;
      for (const q of Track.list()) { if (q === 'main' && weakMain) continue; const t = Track.target(q); if (!t || !['npc', 'boss', 'mon', 'mark', 'map'].includes(t.kind)) continue; if (t.map && t.map !== R.mapId && (G.ap <= 0 || !Game.canEnter(t.map))) continue; const r = await Track.step(t, true); if (r === 'walk' || r === 'travel') return; }
      const bang = R.ents.find(e => e.kind === 'npc' && e.mark === '!' && !this.seen[e.id + G.year]); if (bang) { this.seen[bang.id + G.year] = 1; if (UX.goTo(bang, true)) return; }
      return AFK.chores(true);
    }
    return AFK.chores(false);
  },
};
const AFK = {
  on: false, box: null, st: null, el: mk('div', 'afk23', '<div class="afkc"><b>挂机中</b><p></p></div>'), stopEl: mk('button', 'afkstop23', '停止挂机'), // 停止按钮单独一层，弹窗盖着也能点
  async ask() {
    const c = await UI.card('挂机', '挂机会自动：打当前地图的怪、采药开宝箱、行动力用完自动过年。\n不会：自动渡劫（大境界突破要你自己点）、替你做剧情选择（年度事件会暂停等你）、抽卡、花大钱。\n\n关掉游戏也有离线收益（最多 12 小时，聚灵阵每级 +1 小时）。', null, ['开始挂机', '取消']);
    if (c !== 0) return; const G = Game.G, P = R.player; this.on = true; AUTO.on = 'idle'; AUTO.wait = false;
    const ci = Math.floor(P.i), cj = Math.floor(P.j); this.box = [ci - 6, cj - 6, ci + 6, cj + 6];
    this.st = { t0: Date.now(), exp0: G.exp, stage0: G.stage, realm0: G.realm, stone0: G.stone, kills0: G.killsTotal || 0, age0: G.age, herbs: 0 };
    G.afk = 1; this.el.className = 'show'; this.stopEl.className = 'afkstop show'; this.upd(); UI.toast('开始挂机');
  },
  end() { if (!this.on) return; this.on = false; const G = Game.G; R.ents.forEach(e => { if (e.kind === 'mon') e.cool = 3; }); /* 刚停挂机别被贴脸的怪拉进战斗 */ G.afk = 0; this.el.className = ''; this.stopEl.className = 'afkstop'; const st = this.st;
    UI.card('挂机总结', `挂机 ${(() => { const sec = Math.round((Date.now() - st.t0) / 1000); return sec >= 60 ? `${Math.floor(sec / 60)} 分 ${sec % 60} 秒` : `${sec} 秒`; })()}\n过了 ${G.age - st.age0} 年 · 击败 ${(G.killsTotal || 0) - st.kills0} 只妖怪\n灵石 ${G.stone - st.stone0 >= 0 ? '+' : ''}${G.stone - st.stone0} · 境界 ${Game.realmName()}`, null, ['好']); },
  upd() { if (!this.on) return; const G = Game.G, st = this.st; const m = Math.floor((Date.now() - st.t0) / 60000), s = Math.floor((Date.now() - st.t0) / 1000) % 60;
    this.el.querySelector('p').textContent = `${m}:${String(s).padStart(2, '0')} · ${G.age}岁 ${Game.realmName()} · 击败 ${(G.killsTotal || 0) - st.kills0} · 灵石 +${Math.max(0, G.stone - st.stone0)}`; },
  inBox(i, j) { const b = this.box; return !b || (i >= b[0] && i <= b[2] && j >= b[1] && j <= b[3]); },
  async chores(questMode, noFight) {
    const G = Game.G, P = R.player, s = Game.stats(); const box = AFK.on ? (e => this.inBox(e.i, e.j)) : (() => true);
    const mons = R.ents.filter(e => e.kind === 'mon' && !e.gone && box(e));
    if (mons.length && !noFight && G.hp > s.mhp * 0.5) { const m = mons.sort((a, b) => Math.hypot(a.i - P.i, a.j - P.j) - Math.hypot(b.i - P.i, b.j - P.j))[0]; if (UX.goTo(m, true)) return; }
    for (const act of ['herb', 'chest']) { const m = R.marks.find(m => m.act === act && !m.hidden && box(m)); if (m && (act !== 'herb' || G.ap > 1) && UX.goMark(m, true)) { if (act === 'herb') this.st && this.st.herbs++; return; } }
    if (AFK.on && !this.inBox(P.i, P.j)) { const b = this.box; moveTo(P, (b[0] + b[2]) >> 1, (b[1] + b[3]) >> 1); return; }
    const mat = R.marks.find(m => ['mat', 'jade', 'dummy'].includes(m.act) && !m.hidden && box(m)); if (mat && G.ap > 0 && UX.goMark(mat, true)) return; // 行动力先拿去打坐/练剑，用完才过年
    if (Game.canBreak()) { AUTO.stop('修为已满，自己点「突破」吧（挂机不会替你渡劫，也不白白耗寿元）'); return; }
    if (AFK.on && Date.now() - (this._ye || 0) < 10000) return; // 挂机时别狂过年：每年至少 10 秒，给怪刷新、给玩家看
    this._ye = Date.now(); await Game.yearEnd();
  },
};
AFK.stopEl.onclick = () => { Sfx.play('click'); AUTO.stop('已停止挂机'); };
AFK.el.onclick = e => { if (true) UI.toast('挂机中，点“停止挂机”再操作'); };
setInterval(() => AFK.upd(), 1000);
const AFB = mk('button', 'afkbtn', '挂机'); AFB.onclick = () => { if (!Game.G || UI.modal || !UX.inMap()) return; Sfx.play('click'); if (AUTO.on) AUTO.stop(); AUTO.start('idle'); };
setInterval(() => { AUTO.tick().catch(e => console.error(e)); }, 150);
// ---------- C.2 离线收益：切后台/关游戏记时，读档、回到前台都结算；12h 上限 + 聚灵阵；分段递减；修为不越过瓶颈；不长岁数、不给仙缘符 ----------
const OFFLINE = { capH: 12, perZl: 1, maxExtra: 8, minMin: 5, expK: 0.25, stoneK: 40 };
const Offline = {
  mark() { const G = Game.G; if (G && !G.dead) G.offAt = Date.now(); },
  calc(dtMs) { const G = Game.G; const zl = (G.cave && G.cave.zl) || 0; const capH = OFFLINE.capH + Math.min(OFFLINE.maxExtra, zl * OFFLINE.perZl); const h = Math.min(dtMs / 3600e3, capH);
    const eff = Math.min(h, 4) + Math.max(0, Math.min(h, 8) - 4) * 0.7 + Math.max(0, h - 8) * 0.4;
    return { h, capH, capped: dtMs / 3600e3 >= capH, exp: Math.round(Game.yearExp() * OFFLINE.expK * eff * (1 + 0.1 * zl)), stone: Math.round(OFFLINE.stoneK * POW(MAPINFO[G.map || 'village'].tier) * eff * (1 + 0.1 * ((G.cave && G.cave.field) || 0))), herbs: Math.floor(eff / 2) }; },
  async check() {
    const G = Game.G; if (!G || G.dead || !G.offAt || this._busy) return; const dt = Date.now() - G.offAt;
    if (!(dt > OFFLINE.minMin * 60e3)) { if (dt < 0) G.offAt = Date.now(); return; }
    this._busy = true; G.offAt = Date.now();
    try {
      const r = this.calc(dt); const exp0 = G.exp, st0 = G.stage; G.stone += r.stone; if (r.herbs) Game.give('herb', r.herbs);
      const gained = Math.round(Game.addExp(r.exp, true) || 0); // addExp 最多加到本境界瓶颈（大境界要自己渡劫）
      const hrs = r.h >= 1 ? `${Math.floor(r.h)} 小时 ${Math.round((r.h % 1) * 60)} 分钟` : `${Math.round(r.h * 60)} 分钟`;
      (G.offLog = G.offLog || []).unshift({ t: Date.now(), h: +r.h.toFixed(2), exp: r.exp, stone: r.stone }); G.offLog.length = Math.min(5, G.offLog.length);
      Game.save(); UI.hud();
      const wait = () => new Promise(res => { const f = () => (UX.inMap() ? res() : setTimeout(f, 400)); f(); }); await wait();
      await UI.card('闭关归来', `你离开了 ${hrs}${r.capped ? `（已达上限 ${r.capH} 小时）` : ''}，一直在打坐。\n\n修为 +${gained}${gained < r.exp ? `（应得 ${r.exp}，已到瓶颈，多出的修为散去了）` : ''}${Game.canBreak() ? '\n瓶颈已至，可以突破！' : ''}\n灵石 +${r.stone}${r.herbs ? `\n灵草 ×${r.herbs}` : ''}\n\n（离线不长岁数；上限 12 小时，聚灵阵每级 +1 小时）`, 'i:sk_light', ['收下']);
    } finally { this._busy = false; }
  },
};
const _save = Game.save.bind(Game);
Game.save = function () { Offline.mark(); return _save(); };
// main.js 在本文件之后加载并会重新赋值 onAppPause/onAppResume，所以等全部脚本加载完再包一层（否则安卓切回前台不结算离线收益）
const hookApp23 = () => { if (window.onAppResume && window.onAppResume._ux23) return; const _pause = window.onAppPause, _resume = window.onAppResume;
  window.onAppPause = () => { Offline.mark(); if (_pause) _pause(); };
  window.onAppResume = () => { if (_resume) _resume(); Offline.check(); }; window.onAppResume._ux23 = 1; };
if (document.readyState === 'complete') hookApp23(); else window.addEventListener('load', hookApp23);
document.addEventListener('visibilitychange', () => { if (document.hidden) { Offline.mark(); Game.save(); } else Offline.check(); });
setInterval(() => { if (!Offline._first && UX.inMap()) { Offline._first = 1; Offline.check(); } }, 1000);
// ---------- D 开发者模式（标题/设置里的版本号连点 7 次（每下间隔 ≤1.5 秒），或 URL #dev） ----------
const DEV = { ts: 1, god: false, ohk: false, noEnc: false, taps: 0, t0: 0 };
window.DEV = DEV;
const devOn = () => localStorage.getItem('wbx2_dev') === '1';
if (location.hash.includes('dev')) localStorage.setItem('wbx2_dev', '1');
function devTap() {
  const now = Date.now(); if (now - DEV.t0 > 1500) DEV.taps = 0; DEV.t0 = now; DEV.taps++;  // 两次点按间隔 ≤1.5 秒就算连点（手慢/机器卡也能开）
  if (DEV.taps >= 7) { DEV.taps = 0; if (devOn()) localStorage.removeItem('wbx2_dev'); else localStorage.setItem('wbx2_dev', '1'); UI.toast(devOn() ? '开发者模式已开启 🛠' : '已关闭开发者模式'); devBtn(); }
  else if (DEV.taps >= 4) UI.toast(`再点 ${7 - DEV.taps} 次${devOn() ? '关闭' : '进入'}开发者模式`);
}
document.addEventListener('click', e => { if (e.target.closest('#title .logo span, #title .ver, .verrow')) devTap(); }, true);
function devBtn() {
  let b = $('#devbtn'); if (!devOn()) { if (b) b.remove(); return; }
  if (!b) { b = mk('button', 'devbtn', '🛠'); b.onclick = () => { if (!UI.modal && Game.G && UX.inMap()) UI.panel('dev'); }; }
}
setTimeout(devBtn, 300);
const _set = UI.p_settings.bind(UI);
UI.p_settings = function (b, re, close) { _set(b, re, close); const d = document.createElement('div'); d.className = 'verrow'; d.textContent = `版本 v${APP_VERSION.name} (build ${APP_VERSION.code})`; b.appendChild(d); };
UI.titles.dev = '🛠 开发者模式（测试用）';
UI.p_dev = function (b, re, close, tab) {
  const G = Game.G; tab = tab || DEV.tab || 'res'; DEV.tab = tab; const sel = (id, opts) => `<select id="${id}">${opts.map(([v, n]) => `<option value="${v}">${esc(String(n))}</option>`).join('')}</select>`; const btn = (a, t, on) => `<button class="opt${on ? ' on' : ''}" data-a="${a}">${t}</button>`;
  const TABS = [['res', '资源'], ['realm', '境界'], ['unlock', '解锁'], ['story', '剧情'], ['tp', '传送'], ['show', '演出'], ['dbg', '调试']];
  let body = '';
  if (tab === 'res') body = `<div class="devg">${btn('stone', '灵石 +1万')}${btn('stone2', '灵石 +100万')}${btn('xyf', '仙缘符 +10')}${btn('xyf2', '仙缘符 +100')}${btn('items', '全部物品 ×5')}${btn('ap', '行动力回满')}${btn('debt0', '欠款清零')}${btn('heal', '满血满蓝')}</div>`;
  if (tab === 'realm') body = `<div class="devr">境界 ${sel('d_realm', REALMS.map((r, k) => [k, r.n]))} 小境界 ${sel('d_stage', [[0, '初期'], [1, '中期'], [2, '后期'], [3, '圆满']])}${btn('realm', '设定')}</div><div class="devg">${REALMS.slice(0, 5).map((r, k) => `<button class="opt" data-a="rq" data-v="${k}">${r.n}初期</button><button class="opt" data-a="rq" data-v="${k}" data-s="3">${r.n}圆满</button>`).join('')}</div><div class="devg">${btn('expfull', '修为加满（到瓶颈）')}${btn('life', '寿元 +1000')}</div>`;
  if (tab === 'unlock') body = `<div class="devg">${btn('maps', '解锁全部地图', G.flags.devmaps)}${btn('cg', '解锁全部插画')}${btn('mounts', '全部坐骑')}${btn('cos', '全部时装')}${btn('pets', '全部灵兽各 1')}${btn('aff', '全部 NPC 好感 100')}${btn('techs', '全部功法')}</div>`;
  if (tab === 'story') body = `<div class="devg">${MAIN.map((m, k) => `<button class="opt" data-a="mq" data-v="${k}">${esc(m.n)}</button>`).join('')}</div>`+`<div class="devr">章节 ${sel('d_main', MAIN.map((m, k) => [k, m.n]))}${btn('main', '跳到此章')}</div><div class="devr">Boss ${sel('d_boss', Object.keys(MONS).filter(k => MONS[k].boss).map(k => [k, MONS[k].n]))}${btn('boss', '开打')}</div><div class="devr">事件 ${sel('d_ev', EVENTS.map((e, k) => [k, e[0] + ' ' + e[1]]))}${btn('ev', '触发')}</div>`;
  if (tab === 'tp') body = `<div class="devg">${MAP_ORDER.map(id => `<button class="opt" data-a="tpm" data-v="${id}">${MAPINFO[id].n}</button>`).join('')}<button class="opt" data-a="t5">站到最近NPC旁 1.7 格</button></div>`+`<div class="devr">地图 ${sel('d_map', MAP_ORDER.map(id => [id, MAPINFO[id].n]))}${btn('tp', '传送')}</div><div class="devr">NPC ${sel('d_npc', Object.keys(NPCS).filter(k => Track.mapOf(k)).map(k => [k, `${NPCS[k].n}（${(MAPINFO[Track.mapOf(k)] || {}).n || ''}）`]))}${btn('tpnpc', '传送到他身边')}</div>`;
  if (tab === 'show') body = `<div class="devr">CG ${sel('d_cg', MAIN.map((m, k) => [k, m.n]))}${btn('showcg', '播放章节过场')}</div><div class="devg">${btn('g2', '抽卡演出·宝')}${btn('g3', '抽卡演出·仙')}${btn('g4', '抽卡演出·神')}${btn('g10', '十连演出')}${btn('brk', '突破演出·成功')}${btn('brkf', '突破演出·失败')}</div><p class="hint">演出只播放，不发任何奖励。</p>`;
  if (tab === 'dbg') body = `<div class="devg">${btn('god', '无敌 ' + (DEV.god ? '开' : '关'), DEV.god)}${btn('ohk', '一击必杀 ' + (DEV.ohk ? '开' : '关'), DEV.ohk)}${btn('noenc', '不遇敌 ' + (DEV.noEnc ? '开' : '关'), DEV.noEnc)}${btn('off13', '离线模拟 +13 小时')}${btn('off1', '离线模拟 +1 小时')}${btn('offm', '离线模拟 -1 小时')}</div><div class="devr">速度 ${[1, 2, 5, 10].map(v => `<button class="opt spd${DEV.ts === v ? ' on' : ''}" data-a="ts" data-v="${v}">×${v}</button>`).join('')}</div>
    <details><summary>flags（${Object.keys(G.flags).length}）</summary><div class="devflags">${Object.entries(G.flags).map(([k, v]) => `${esc(k)}=${esc(String(v))}`).join('<br>')}</div></details>
    <details><summary>缺素材被隐藏的内容（${(window.ASSET_DROPPED || []).length}）</summary><div class="devflags">${(window.ASSET_DROPPED || []).map(esc).join('<br>') || '无'}</div></details>
    <div class="devg">${btn('reset', '重置存档')}${btn('devoff', '关闭开发者模式')}</div>`;
  b.innerHTML = `<p class="hint devwarn">⚠ 作弊面板，仅供测试；用过的存档会标记为开发者存档。</p><div class="devtabs">${TABS.map(([k, n]) => `<button class="dt${k === tab ? ' on' : ''}" data-t="${k}">${n}</button>`).join('')}</div>${body}`;
  b.onclick = async e => {
    const tb = e.target.closest('.dt'); if (tb) { DEV.tab = tb.dataset.t; re(tb.dataset.t); return; }
    const t = e.target.closest('[data-a]'); if (!t) return; const a = t.dataset.a; Sfx.play('click'); const v = id => b.querySelector(id).value; G.dev = 1;
    const fake = n => Array.from({ length: n }, (_, k) => ({ tier: n === 1 ? +a[1] : (k === 9 ? 4 : k % 3 === 0 ? 3 : 2), n: '演出预览（不发奖）', ic: 'sword_o', por: (n === 1 ? +a[1] : (k === 9 ? 4 : 0)) >= 4 ? 'npc_lengyue' : undefined }));
    switch (a) {
      case 'stone': G.stone += 1e4; break; case 'stone2': G.stone += 1e6; break; case 'xyf': Game.give('xyf', 10); break; case 'xyf2': Game.give('xyf', 100); break;
      case 'items': for (const k in ITEMS) Game.give(k, 5); break; case 'ap': G.ap = Game.apMax(); break; case 'debt0': G.debt = 0; break;
      case 'heal': { const s = Game.stats(); G.hp = s.mhp; G.mp = s.mmp; break; }
      case 'rq': b.querySelector('#d_realm').value = t.dataset.v; b.querySelector('#d_stage').value = t.dataset.s || 0; /* fallthrough */
      case 'realm': { G.realm = +v('#d_realm'); G.stage = +v('#d_stage'); G.exp = Math.floor(Game.need() * 0.5); G.flags.awakened = 1; G.flags.main0 = G.flags.main1 = 1; if (R.player) { R.player.spr = Game.playerSpr(); loadSprite(R.player.spr); } const s = Game.stats(); G.hp = s.mhp; G.mp = s.mmp; Game.checkMain(); Game.refreshNpcs(); break; }
      case 'expfull': Game.addExp(Game.need() * 10, true); break; case 'life': G.lifeBonus = (G.lifeBonus || 0) + 1000; break;
      case 'maps': G.flags.awakened = 1; G.flags.devmaps = 1; break;
      case 'cg': Game.meta.cg = Game.meta.cg || {}; for (const [id] of CG_LIST) Game.meta.cg[id] = 1; Game.saveMeta(); break;
      case 'mounts': Sys.ensure(G); for (const id in MOUNTS) Sys.addMount(id, true); break;
      case 'cos': Sys.ensure(G); for (const id in COSTUMES) Game.meta.cos[id] = 1; Game.saveMeta(); break;
      case 'pets': for (const id in PET_SKILL) if (MONS[id]) Game.addPet(id, 1 + G.realm); break;
      case 'aff': for (const id in NPCS) G.aff[id] = 100; break;
      case 'techs': for (const id in TECHS) Game.learn(id); break;
      case 'mq': b.querySelector('#d_main').value = t.dataset.v; /* fallthrough */
      case 'main': { const k = +v('#d_main'); G.main = k; G.flags.main0 = G.flags.main1 = G.flags.awakened = 1; G.realm = Math.max(G.realm, MAIN[k].realm || 0); if (k > MI('sect') && !G.sect) Game.joinSect(Object.keys(SECTS)[0]); for (let x = 0; x < k; x++) { const M = MAIN[x]; if (M.boss) { G.bosses[M.boss] = 1; G.flags['boss_' + M.boss] = 1; } } if (R.player) { R.player.spr = Game.playerSpr(); loadSprite(R.player.spr); } Game.checkMain(); Game.refreshNpcs(); break; }
      case 'tpm': b.querySelector('#d_map').value = t.dataset.v; /* fallthrough */
      case 'tp': close(); G.flags.awakened = 1; await Game.travel(v('#d_map'), true); return;
      case 'tpnpc': { close(); const id = v('#d_npc'); const mp = Track.mapOf(id); G.flags.awakened = 1; if (mp !== R.mapId) await Game.travel(mp, true); const e2 = R.ents.find(x => x.kind === 'npc' && x.id === id); if (e2) { const t2 = UX.adj(e2, R.player); R.player.i = t2[0] + 0.5; R.player.j = t2[1] + 0.5; R.player.path = []; Game.interactEnt(e2); } return; }
      case 't5': { close(); const P = R.player; const e2 = R.ents.filter(x => x.kind === 'npc').sort((x, y) => Math.hypot(x.i - P.i, x.j - P.j) - Math.hypot(y.i - P.i, y.j - P.j))[0]; if (!e2) return;
        e2.talking = 8; for (const [di, dj] of [[1.2, 1.2], [-1.2, 1.2], [1.2, -1.2], [-1.2, -1.2], [1.7, 0], [0, 1.7], [-1.7, 0], [0, -1.7]]) if (walkable(Math.floor(e2.i + di), Math.floor(e2.j + dj))) { P.i = e2.i + di; P.j = e2.j + dj; P.path = []; break; }
        const [px, py] = t2p(P.i, P.j); R.cam.x = px; R.cam.y = py - 60; UI.toast('T5 场景：已站到 ' + e2.label + ' 旁 ' + Math.hypot(P.i - e2.i, P.j - e2.j).toFixed(1) + ' 格'); return; }
      case 'boss': { close(); const id = v('#d_boss'); await Game.fight(id, { tier: (MAPINFO[MAP_ORDER.find(m => MAPINFO[m].boss === id) || 'village'] || {}).tier || G.realm }); UI.hud(); return; }
      case 'ev': close(); Game._busy = true; try { await Game.runEvent(EVENTS[+v('#d_ev')]); } finally { Game._busy = false; } UI.hud(); return;
      case 'showcg': { close(); const m = MAIN[+v('#d_cg')]; document.querySelectorAll('.chapter-fx').forEach(x => x.remove()); UI.chapterShow(m); return; }
      case 'g2': case 'g3': case 'g4': close(); await UI.gachaShow(fake(1)); return;
      case 'g10': close(); await UI.gachaShow(fake(10)); return;
      case 'brk': close(); await VFX.breakthrough(REALMS[Math.min(7, G.realm + 1)].n, false); return;
      case 'brkf': close(); await VFX.breakthrough(REALMS[Math.min(7, G.realm + 1)].n, true); return;
      case 'god': DEV.god = !DEV.god; break; case 'ohk': DEV.ohk = !DEV.ohk; break; case 'noenc': DEV.noEnc = !DEV.noEnc; break;
      case 'off13': case 'off1': case 'offm': close(); G.offAt = Date.now() - ({ off13: 13, off1: 1, offm: -1 })[a] * 3600e3; hookApp23(); window.onAppResume(); return;
      case 'ts': DEV.ts = +t.dataset.v; R.ts = DEV.ts; B.speed = DEV.ts; break;
      case 'reset': if (await UI.card('重置存档', '确定删除当前存档并回到标题吗？（轮回殿进度保留）', null, ['确定重置', '取消']) === 0) { localStorage.removeItem('wbx2_save'); location.reload(); } return;
      case 'devoff': localStorage.removeItem('wbx2_dev'); devBtn(); close(); UI.toast('已关闭开发者模式'); return;
    }
    UI.toast('已执行：' + t.textContent); UI.hud(); Game.save(); re(tab);
  };
};
const _canEnter = Game.canEnter.bind(Game);
Game.canEnter = function (id) { return (this.G && this.G.flags && this.G.flags.devmaps) ? true : _canEnter(id); };
const _monAI = monAI; monAI = function (e, dt) { if (DEV.noEnc) return; return _monAI(e, dt); };
const _hit = hitTargets;
hitTargets = function (u, S, targets) { // 无敌 / 一击必杀（只在开发者开关打开时生效）
  const before = targets.map(t => t.hp);
  if (DEV.god) targets.forEach(t => { if (t.side === 0) t.hp += 1e9; });
  if (DEV.ohk && u.side === 0) targets.forEach(t => { if (t.side === 1 && t.alive) t.hp = 1; });
  const r = _hit(u, S, targets);
  if (DEV.god) targets.forEach((t, k) => { if (t.side === 0) t.hp = Math.min(before[k], t.hp); });
  return r;
};
setInterval(() => { if (UX.inMap() && document.body.classList.contains('ingame')) UI.hud(); }, 1500);

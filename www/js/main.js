'use strict';
// ======================= 启动 =======================
window.addEventListener('error', e => { console.error('ERR', e.message, e.filename, e.lineno); });
window.addEventListener('unhandledrejection', e => { console.error('REJ', e.reason && (e.reason.stack || e.reason)); });
async function boot() {
  Game.loadMeta(); initEngine($('#cv')); UI.init();
  if (localStorage.getItem('wbx2_bgm') === '0') Audio2.on = false; if (localStorage.getItem('wbx2_sfx') === '0') Sfx.on = false;
  // 标题背景：村子底图缓慢平移
  await Promise.all([loadImg('assets/maps/village.webp'), loadImg('assets/maps/' + AS.maps.village.propAtlas.img), loadSprite('player_m0'), loadSprite('player_f0'), loadSprite('npc_mentor'), loadSprite('mon_slime')]);
  R.drawTitle = ctx => {
    const P = AS.maps.village.plate; const im = img('assets/maps/village.webp'); const t = R.t;
    const g = ctx.createLinearGradient(0, 0, 0, R.H); g.addColorStop(0, '#9fd4ff'); g.addColorStop(1, '#fff0e0'); ctx.fillStyle = g; ctx.fillRect(0, 0, R.W, R.H);
    const Z = R.Z * 1.1; const cx = P.ox + Math.sin(t * 0.05) * 300, cy = P.oy + P.h * 0.32;
    ctx.setTransform(Z, 0, 0, Z, R.W / 2 - cx * Z, R.H * 0.62 - cy * Z); if (im) ctx.drawImage(im, 0, 0);
    const pa = AS.maps.village.propAtlas; const pim = img('assets/maps/' + pa.img); const M = AS.maps.village;
    const pos = (i, j) => [P.ox + i * P.ex[0] + j * P.ej[0], P.oy + i * P.ex[1] + j * P.ej[1]];
    const list = M.props.map(([tp, i, j]) => { const [fw, fh] = M.foot[tp]; return { d: i + j + (fw + fh) / 2, tp, x: pos(i + fw / 2, j + fh / 2) }; });
    [['player_m0', 9.5, 11.5, 'S'], ['player_f0', 11.5, 11.5, 'SW'], ['npc_mentor', 10.5, 13.5, 'N'], ['mon_slime', 13.5, 13.5, 'W']].forEach(([s, i, j, d]) => list.push({ d: i + j, s, x: pos(i, j), dir: d }));
    list.sort((a, b) => a.d - b.d);
    for (const it of list) { if (it.tp) { const f = pa.f[it.tp]; if (f && pim) ctx.drawImage(pim, f[0], f[1], f[2], f[3], it.x[0] - f[4], it.x[1] - f[5], f[2], f[3]); } else { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(it.x[0], it.x[1], 34, 15, 0, 0, 7); ctx.fill(); drawSprite(ctx, it.s, 'idle', it.dir, t * 5, it.x[0], it.x[1]); } }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (Math.random() < 0.3) part({ x: Math.random() * R.W, y: -10, vx: -30 * R.dpr, vy: 50 * R.dpr, r: 5 * R.dpr, c: '#ffc0d8', life: 8, add: false, spin: 1, world: false, ph: Math.random() * 6 });
    drawParts(ctx, false);
  };
  Audio2.bgm('title');
  setTimeout(() => Updater.check(), 1500);
  const r = await UI.title();
  const isNew = r !== 'cont';
  if (isNew) Game.newLife(r);
  else { const G = Game.G; for (const k of ['lifeBonus', 'cultBonus', 'apBonus']) G[k] = G[k] || 0; }
  R.drawTitle = null; R.parts = []; document.body.classList.add('ingame');
  await Game.enterMap(Game.G.map);
  UI.hud();
  if (isNew) { const ev = EVENTS.find(e => e[0] === 'c_born'); await Game.runEvent(ev); await UI.help(); }
  setInterval(() => Game.save(), 20000);
}
// 安卓返回键：有面板就关面板；对话/事件卡等必须选择的弹窗吞掉返回键；其余情况需连按两次才退出
window.onAndroidBack = () => {
  const top = UI.stack[UI.stack.length - 1];
  if (top) { const x = top.querySelector('.x'); if (x) x.click(); else UI.toast('请先做出选择'); return true; }
  if (B.on) { UI.toast('斗法中无法退出'); return true; }
  const now = Date.now(); if (window._backAt && now - window._backAt < 2000) { Game.save(); return false; }
  window._backAt = now; UI.toast('再按一次返回键退出（进度已自动保存）'); Game.save(); return true;
};
window.onAppPause = () => { Game.save(); Audio2.pause(); };
window.onAppResume = () => { Audio2.resume(); };
document.addEventListener('visibilitychange', () => { if (document.hidden) { Game.save(); Audio2.pause(); } else Audio2.resume(); });
// ======================= 自动测试机器人 =======================
window.BOT = {
  log: [], n: 0,
  pref: ['★', '✔', '突破', '冲！', '渡劫飞升', '收下', '继续', '好', '接受', '拜师', '揭榜', '闭关', '过年', '交付', '同去', '我要对账', '一起闯荡', '结为道侣', '认真的', '拿账本', '高利贷', '先打一架', '同去'],
  tick() {
    this.n++;
    const end = document.querySelector('.endw .opt'); if (end) { end.click(); return 'ending'; }
    const top = UI.stack[UI.stack.length - 1];
    if (top) {
      if (top.querySelector('.create')) return 'creating';
      if (top.querySelector('.meta')) { const nl = top.querySelector('#newlife'); this.done = true; return 'meta'; }
      const opts = [...top.querySelectorAll('.opt')].filter(b => !b.disabled);
      if (top.querySelector('.fire') && opts.length) return 'mini';
      if (opts.length) {
        let best = null;
        const secl = opts.filter(b => b.textContent.startsWith('闭关'));
        if (secl.length && Math.random() < 0.4) best = secl[secl.length - 1];
        if (!best) best = opts.find(b => b.textContent.startsWith('打坐'));
        for (const p of this.pref) { if (best) break; best = opts.find(b => b.textContent.includes(p)); if (best) break; }
        if (!best) { best = opts.find(b => /离开|算了|先撤|再想想|再等等|取消/.test(b.textContent)) || opts[Math.random() * Math.min(2, opts.length) | 0]; }
        best.click(); return 'opt:' + best.textContent.slice(0, 8);
      }
      const x = top.querySelector('.x'); if (x) { x.click(); return 'close'; }
      return 'modal?';
    }
    if (B.on) { const ab = document.querySelector('#battlebar button[data-a=auto]'); if (ab && !document.querySelector('#battlebar.wait')) { ab.click(); return 'auto'; } return 'battle'; }
    if (Game._busy || !Game.G || Game.G.dead || R.mode !== 'map') return 'busy';
    if (this._act && performance.now() - this._act < 300) return 'cool';
    this._act = performance.now();
    const G = Game.G; const P = R.player;
    // 自动装备/加点
    for (const [sl] of SLOTS) { const c = G.eqs.filter(e => e.slot === sl).sort((a, b) => Game.eqScore(b) - Game.eqScore(a))[0]; if (c && G.eq[sl] !== c.uid) Game.equip(c.uid); }
    if (G.eqs.length > 30) for (const e of G.eqs.slice()) if (!Object.values(G.eq).includes(e.uid) && e.rar <= 2) Game.sellEq(e.uid);
    while (G.pts > 0) { const br = ['body', 'sword', 'magic', 'misc'].find(b => G.tree[b] < 5); if (!br) break; G.tree[br]++; G.pts--; }
    for (const id in G.techs) { const cost = Math.round(120 * Math.pow(2.2, G.techs[id]) * (1 + G.realm)); if (G.techs[id] < 5 && G.stone > cost * 3) { G.stone -= cost; G.techs[id]++; } }
    if (G.hp < Game.stats().mhp * 0.5 && Game.has('hcd')) { UI.useItem('hcd'); return 'heal'; }
    if (!Game.has('hcd', 3) && G.stone > 300) { G.stone -= 120; Game.give('hcd', 3); }
    if (!Game.has('ysf') && G.stone > 500) { G.stone -= 120; Game.give('ysf', 1); }
    if (G.debt > 0 && G.stone > G.debt * 1.5 && G.realm >= 4) { G.stone -= G.debt; G.debt = 0; Game.ach('debt0'); }
    if (Game.canBreak()) { Game.tryBreak(); return 'break'; }
    // 主线
    const mainE = R.ents.find(e => (e.kind === 'npc' || e.kind === 'boss') && (e.mark === '!' || e.mark === '?') && (e.kind === 'boss' ? G.realm >= MAIN[G.main].realm : true) && !(this.talked || {})[e.id + G.year]);
    if (mainE) { (this.talked = this.talked || {})[mainE.id + G.year] = 1; P.i = mainE.i; P.j = mainE.j + 1; Game.interactEnt(mainE); return 'talk:' + mainE.id; }
    if (!G.sect && G.flags.awakened && G.realm >= 1) { if (R.mapId !== 'sect' && G.ap > 0) { Game.travel('sect'); return 'go sect'; } const el = R.ents.find(e => e.id === 'elder'); if (el && !(this.talked || {})['join' + G.year]) { this.talked['join' + G.year] = 1; Game.interactEnt(el); return 'join'; } }
    const s = Game.stats();
    const mons = R.ents.filter(e => e.kind === 'mon' && !e.gone);
    if (mons.length && G.hp > s.mhp * 0.4) { const m = mons.sort((a, b) => Math.hypot(a.i - P.i, a.j - P.j) - Math.hypot(b.i - P.i, b.j - P.j))[0]; P.i = m.i + 0.6; P.j = m.j; Game.monBattle(m); return 'fight'; }
    // 去合适的地图
    const mm = MAIN[G.main] && MAIN[G.main].map; let target = (mm && Game.canEnter(mm) && G.realm >= MAIN[G.main].realm) ? mm : MAP_ORDER.filter(id => Game.canEnter(id)).pop();
    if (this.n % 7 === 0) target = pick(MAP_ORDER.filter(id => Game.canEnter(id)));
    if (target && target !== R.mapId && G.ap > 0) { Game.travel(target); return 'travel:' + target; }
    const herb = R.marks.find(m => m.act === 'herb' && !m.hidden); if (herb && G.ap > 1) { Game.interactMark(herb); return 'herb'; }
    const chest = R.marks.find(m => m.act === 'chest' && !m.hidden); if (chest) { Game.interactMark(chest); return 'chest'; }
    const mat = R.marks.find(m => m.act === 'mat' || m.act === 'jade' || m.act === 'dummy'); if (mat && G.ap > 0) { Game.interactMark(mat); return 'mat'; }
    if (G.ap > 0 && R.mapId !== 'village' && Game.canEnter('village') && Math.random() < 0.2) { Game.travel('village'); return 'home'; }
    Game.yearEnd(); return 'year';
  },
};
boot();

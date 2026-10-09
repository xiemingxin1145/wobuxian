'use strict';
// ======================= 资源 =======================
const AS = window.ASSETS;
const IMG = {};
function loadImg(src) {
  if (IMG[src]) return IMG[src].p;
  const im = new Image(); const o = { im, ok: false };
  o.p = new Promise(res => { im.onload = () => { o.ok = true; res(im); }; im.onerror = () => { console.warn('img fail', src); res(null); }; });
  im.src = src; IMG[src] = o; return o.p;
}
function img(src) { const o = IMG[src]; return o && o.ok ? o.im : null; }
const SPR_PATH = id => 'assets/spr/' + AS.sprites[id].img;
function loadSprite(id) { return AS.sprites[id] ? loadImg(SPR_PATH(id)) : Promise.resolve(null); }
const MIRROR = { SE: 'SW', E: 'W', NE: 'NW' };
const DIR8 = ['SE', 'S', 'SW', 'W', 'NW', 'N', 'NE', 'E'];
const DIRT = { S: [1, 1], SW: [0, 1], W: [-1, 1], NW: [-1, 0], N: [-1, -1], NE: [0, -1], E: [1, -1], SE: [1, 0] };
function dirFrom(di, dj) { const a = Math.atan2(dj, di); return DIR8[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8]; }
// 画精灵：x,y 为脚底锚点（屏幕坐标）
function drawSprite(ctx, id, anim, dir, f, x, y, s = 1, alpha = 1, tint = null) {
  const S = AS.sprites[id]; if (!S) return false;
  const im = img(SPR_PATH(id)); if (!im) return false;
  let flip = false, d = dir;
  if (!S.dirs.includes(d)) { if (MIRROR[d] && S.dirs.includes(MIRROR[d])) { d = MIRROR[d]; flip = true; } else if (S.dirs.includes('SE')) { d = 'SE'; flip = ['W', 'NW', 'SW', 'N'].includes(dir); } else d = S.dirs[0]; }
  if (!S.anims[anim]) anim = 'idle';
  const n = S.anims[anim]; const fr = S.f[`${anim}_${d}_${((f | 0) % n + n) % n}`]; if (!fr) return false;
  const K = S.k || 1; const big = S.fw / K >= 300; const ax = S.fw / 2, ay = S.fh * (big ? 0.9 : 0.86);
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale((flip ? -s : s) / K, s / K);
  ctx.drawImage(im, fr[0], fr[1], fr[2], fr[3], fr[4] - ax, fr[5] - ay, fr[2], fr[3]);
  if (tint) { ctx.globalCompositeOperation = 'source-atop'; }
  ctx.restore();
  return { top: y + (fr[5] - ay) * s / K, h: S.fh * s / K };
}
function spriteBox(id, s = 1) { const S = AS.sprites[id]; if (!S) return { w: 80, h: 120 }; const K = S.k || 1; const big = S.fw / K >= 300; return { w: S.fw / K * 0.55 * s, h: S.fh / K * (big ? 0.8 : 0.78) * s }; }
// UI 图集：头像 / 图标（CSS）
function iconCss(key, size = 48) {
  const I = AS.icons; const f = I.f[key] || I.f['scroll']; const k = size / I.size;
  return `background:url(assets/ui/icons.webp) ${-f[0] * k}px ${-f[1] * k}px/${I.w * k}px ${I.h * k}px no-repeat;width:${size}px;height:${size}px`;
}
function porCss(key, size = 72) {
  const P = AS.portraits; const f = P.f[key]; if (!f) return iconCss(key.replace(/^i:/, ''), size);
  const k = size / P.size;
  return `background:url(assets/ui/portraits.webp) ${-f[0] * k}px ${-f[1] * k}px/${P.w * k}px ${P.h * k}px no-repeat;width:${size}px;height:${size}px`;
}
// ======================= 世界 =======================
const R = {
  cv: null, ctx: null, W: 0, H: 0, dpr: 1, Z: 1, cam: { x: 0, y: 0 }, t: 0, map: null, M: null, ents: [], props: [], parts: [], texts: [], marks: [],
  joy: null, tapMark: null, shake: 0, flash: 0, dark: 0, mode: 'map', clouds: [], onTap: null, onArrive: null, paused: false,
};
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2); R.dpr = dpr;
  R.W = R.cv.width = Math.round(innerWidth * dpr); R.H = R.cv.height = Math.round(innerHeight * dpr);
  R.cv.style.width = innerWidth + 'px'; R.cv.style.height = innerHeight + 'px';
  const css = Math.min(innerWidth, innerHeight * 0.75);
  R.Z = (innerWidth * dpr) / (innerWidth < 600 ? 860 : 1200);
}
function initEngine(cv) {
  R.cv = cv; R.ctx = cv.getContext('2d'); resize(); addEventListener('resize', resize);
  for (let k = 0; k < 14; k++) R.clouds.push({ x: Math.random(), y: Math.random(), s: 0.5 + Math.random() * 1.2, v: 0.004 + Math.random() * 0.01 });
  // 云朵贴图
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  for (let k = 0; k < 9; k++) { const x = 40 + Math.random() * 176, y = 50 + Math.random() * 40, r = 22 + Math.random() * 30; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  R.cloudImg = c;
  setupInput();
  let last = performance.now();
  const loop = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; R.t += dt; try { if (!R.paused) update(dt); render(); } catch (e) { console.error(e); } requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
// 坐标换算
function t2p(i, j) { const P = R.M.plate; return [P.ox + i * P.ex[0] + j * P.ej[0], P.oy + i * P.ex[1] + j * P.ej[1]]; }
function p2t(x, y) { const P = R.M.plate; const a = P.ex[0], b = P.ej[0], c = P.ex[1], d = P.ej[1]; const det = a * d - b * c; x -= P.ox; y -= P.oy; return [(d * x - b * y) / det, (-c * x + a * y) / det]; }
function w2s(x, y) { return [(x - R.cam.x) * R.Z + R.W / 2, (y - R.cam.y) * R.Z + R.H / 2]; }
function s2w(x, y) { return [(x - R.W / 2) / R.Z + R.cam.x, (y - R.H / 2) / R.Z + R.cam.y]; }
const NONBLOCK = new Set(['mat', 'herb', 'mushroom', 'cloudpuff', 'grave', 'torch']);
async function loadMap(id, extraSprites = []) {
  const M = AS.maps[id]; R.mapId = id; const n = M.n;
  const need = [loadImg('assets/maps/' + id + '.webp'), loadImg('assets/maps/' + M.propAtlas.img), ...extraSprites.map(loadSprite)];
  await Promise.all(need);
  R.M = M; R.n = n; R.ents = []; R.parts = []; R.texts = []; R.marks = [];
  // 可走网格
  const grid = []; for (let j = 0; j < n; j++) { grid.push([]); for (let i = 0; i < n; i++) grid[j].push('wlx'.includes(M.tiles[j][i]) ? 0 : 1); }
  R.props = M.props.map(([t, i, j]) => {
    const [fw, fh] = M.foot[t]; const [x, y] = t2p(i + fw / 2, j + fh / 2);
    if (!NONBLOCK.has(t)) for (let jj = j; jj < j + fh; jj++) for (let ii = i; ii < i + fw; ii++) if (grid[jj] && grid[jj][ii] !== undefined) grid[jj][ii] = 0;
    return { t, i, j, fw, fh, x, y, depth: i + fw / 2 + j + fh / 2 };
  });
  R.grid = grid;
}
function walkable(i, j) { return i >= 0 && j >= 0 && i < R.n && j < R.n && R.grid[j][i] === 1; }
function nearestWalk(i, j) {
  i = Math.round(i); j = Math.round(j);
  for (let r = 0; r < 12; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) if (Math.max(Math.abs(di), Math.abs(dj)) === r && walkable(i + di, j + dj)) return [i + di, j + dj];
  return [i, j];
}
// A* 8 方向
function findPath(si, sj, ti, tj, occupied) {
  if (!walkable(ti, tj)) return null; const n = R.n; const key = (i, j) => j * n + i;
  const open = [[si, sj, 0, 0]]; const came = new Map(); const g = new Map([[key(si, sj), 0]]); const closed = new Set();
  const h = (i, j) => { const dx = Math.abs(i - ti), dy = Math.abs(j - tj); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
  let guard = 0;
  while (open.length && guard++ < 4000) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][3] < open[bi][3]) bi = k;
    const [ci, cj] = open.splice(bi, 1)[0]; const ck = key(ci, cj);
    if (ci === ti && cj === tj) { const path = [[ti, tj]]; let k = ck; while (came.has(k)) { k = came.get(k); path.unshift([k % n, (k / n) | 0]); } path.shift(); return path; }
    if (closed.has(ck)) continue; closed.add(ck);
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      if (!di && !dj) continue; const ni = ci + di, nj = cj + dj; if (!walkable(ni, nj)) continue;
      if (di && dj && (!walkable(ci + di, cj) || !walkable(ci, cj + dj))) continue;
      const nk = key(ni, nj); const ng = g.get(ck) + (di && dj ? 1.414 : 1);
      if (ng < (g.has(nk) ? g.get(nk) : 1e9)) { g.set(nk, ng); came.set(nk, ck); open.push([ni, nj, ng, ng + h(ni, nj)]); }
    }
  }
  return null;
}
// 实体
function addEnt(o) {
  const e = Object.assign({ i: 10.5, j: 10.5, dir: 'S', anim: 'idle', at: Math.random() * 4, path: [], speed: 3.2, s: 1, kind: 'npc', alpha: 1 }, o);
  R.ents.push(e); return e;
}
function removeEnt(e) { const k = R.ents.indexOf(e); if (k >= 0) R.ents.splice(k, 1); }
function moveTo(e, ti, tj, cb) {
  const si = Math.floor(e.i), sj = Math.floor(e.j);
  if (!walkable(ti, tj)) [ti, tj] = nearestWalk(ti, tj);
  const p = findPath(si, sj, ti, tj); if (!p) { cb && cb(false); return false; }
  e.path = p; e.onArrive = cb; return true;
}
function stepEnt(e, dt) {
  if (e.path && e.path.length) {
    const [ti, tj] = e.path[0]; const tx = ti + 0.5, ty = tj + 0.5; const dx = tx - e.i, dy = ty - e.j; const d = Math.hypot(dx, dy);
    const sp = e.speed * dt;
    if (d <= sp) { e.i = tx; e.j = ty; e.path.shift(); if (e.kind === 'player' && Math.random() < 0.5) Sfx.play('step', 0.25); if (!e.path.length) { e.anim = 'idle'; const cb = e.onArrive; e.onArrive = null; cb && cb(true); } }
    else { e.i += dx / d * sp; e.j += dy / d * sp; e.dir = dirFrom(dx, dy); e.anim = 'walk'; }
  } else if (e.anim === 'walk' && !e.joyMove) e.anim = 'idle';
  e.at += dt;
}
// ======================= 粒子/特效 =======================
function part(o) { R.parts.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 1, t: 0, r: 6, c: '#fff', add: true, shrink: true, world: true }, o)); }
function floatText(x, y, txt, c = '#fff', size = 34, world = true) { R.texts.push({ x, y, txt, c, size, t: 0, life: 1.3, world }); }
const AMB = {
  petal: () => ({ c: ['#ffc0d8', '#ffb0cc', '#fff0f5'][Math.random() * 3 | 0], r: 5, vy: 20, vx: -18, g: 0, life: 7, add: false, spin: 1 }),
  leaf: () => ({ c: ['#9ad86a', '#e8d070', '#ffffff'][Math.random() * 3 | 0], r: 4, vy: 16, vx: -12, life: 7, add: false, spin: 1 }),
  lantern: () => ({ c: '#ffb050', r: 7, vy: -14, vx: 4, life: 6, add: true }),
  firefly: () => ({ c: '#c8ff8a', r: 4, vy: -6, vx: 6, life: 5, add: true, wob: 1 }),
  ghostfire: () => ({ c: '#7affc8', r: 7, vy: -12, vx: 0, life: 4, add: true, wob: 1 }),
  bubble: () => ({ c: '#e0f8ff', r: 5, vy: -18, vx: 2, life: 5, add: true, ring: 1 }),
  ember: () => ({ c: ['#ff7a2a', '#ffcc4a'][Math.random() * 2 | 0], r: 4, vy: -30, vx: 6, life: 4, add: true }),
  sparkle: () => ({ c: '#fff6c0', r: 4, vy: -8, vx: 0, life: 3, add: true, star: 1 }),
};
function update(dt) {
  if (R.mode === 'map' && R.M) {
    const P = R.player;
    // 摇杆移动
    if (R.joy && R.joy.active && P) {
      const jx = R.joy.dx, jy = R.joy.dy; const m = Math.hypot(jx, jy);
      if (m > 12) {
        // 屏幕方向 → 网格方向
        const sx = jx / m, sy = jy / m; const P_ = R.M.plate; const det = P_.ex[0] * P_.ej[1] - P_.ej[0] * P_.ex[1];
        let di = (P_.ej[1] * sx - P_.ej[0] * sy) / det, dj = (-P_.ex[1] * sx + P_.ex[0] * sy) / det; const l = Math.hypot(di, dj); di /= l; dj /= l;
        const sp = P.speed * dt * Math.min(1, m / 60); const ni = P.i + di * sp, nj = P.j + dj * sp;
        P.path = []; P.onArrive = null;
        if (walkable(Math.floor(ni), Math.floor(nj))) { P.i = ni; P.j = nj; } else if (walkable(Math.floor(ni), Math.floor(P.j))) P.i = ni; else if (walkable(Math.floor(P.i), Math.floor(nj))) P.j = nj;
        P.dir = dirFrom(di, dj); P.anim = 'walk'; P.joyMove = true;
        if ((R.t * 3 | 0) !== (R._st | 0)) { R._st = R.t * 3; Sfx.play('step', 0.2); }
      } else { P.joyMove = false; }
    } else if (P) P.joyMove = false;
    for (const e of R.ents) {
      if (e.ai) e.ai(e, dt);
      stepEnt(e, dt);
    }
    if (P) {
      const [px, py] = t2p(P.i, P.j); const k = 1 - Math.pow(0.002, dt);
      R.cam.x += (px - R.cam.x) * k; R.cam.y += (py - 60 - R.cam.y) * k;
      if (R.onTick) R.onTick(dt);
    }
    // 环境粒子
    const A = MAPINFO[R.mapId] && AMB[MAPINFO[R.mapId].amb];
    if (A && Math.random() < dt * 9) { const [wx, wy] = s2w(Math.random() * R.W * 1.3, Math.random() * R.H * 0.9); const o = A(); part(Object.assign(o, { x: wx, y: wy, ph: Math.random() * 6 })); }
  }
  if (R.onUpdate) R.onUpdate(dt);
  for (const p of R.parts) { p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt + (p.wob ? Math.sin(p.t * 3 + p.ph) * 0.6 : 0); p.y += p.vy * dt; }
  R.parts = R.parts.filter(p => p.t < p.life);
  for (const t of R.texts) t.t += dt; R.texts = R.texts.filter(t => t.t < t.life);
  R.shake = Math.max(0, R.shake - dt * 2); R.flash = Math.max(0, R.flash - dt * 2.5);
}
function drawSky(ctx, a, b) {
  const g = ctx.createLinearGradient(0, 0, 0, R.H); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, 0, R.W, R.H);
  ctx.globalAlpha = 0.55;
  for (const c of R.clouds) { c.x = (c.x + c.v * 0.016) % 1.3; const w = 380 * c.s * R.dpr; ctx.drawImage(R.cloudImg, (c.x - 0.2) * R.W * 1.2 - (R.cam.x * 0.05 % 200), c.y * R.H - (R.cam.y * 0.04 % 120), w, w / 2); }
  ctx.globalAlpha = 1;
}
function render() {
  const ctx = R.ctx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (R.mode === 'battle' && R.drawBattle) { R.drawBattle(ctx); drawOverlay(ctx); return; }
  if (!R.M) { ctx.fillStyle = '#123'; ctx.fillRect(0, 0, R.W, R.H); if (R.drawTitle) R.drawTitle(ctx); return; }
  const info = MAPINFO[R.mapId];
  drawSky(ctx, info.sky[0], info.sky[1]);
  const sx = (Math.random() - 0.5) * R.shake * 20, sy = (Math.random() - 0.5) * R.shake * 20;
  ctx.setTransform(R.Z, 0, 0, R.Z, R.W / 2 - R.cam.x * R.Z + sx, R.H / 2 - R.cam.y * R.Z + sy);
  if (R.drawUnder) R.drawUnder(ctx);
  const plate = img('assets/maps/' + R.mapId + '.webp'); if (plate) ctx.drawImage(plate, 0, 0);
  if (R.drawGround) R.drawGround(ctx);
  // 标记目标
  if (R.tapMark && R.tapMark.t < 0.8) { R.tapMark.t += 0.016; const [x, y] = t2p(R.tapMark.i + 0.5, R.tapMark.j + 0.5); const k = 1 - R.tapMark.t / 0.8; ctx.strokeStyle = `rgba(255,240,150,${k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 40 * (1.2 - k * 0.4), 20 * (1.2 - k * 0.4), 0, 0, 7); ctx.stroke(); }
  // 阴影
  for (const e of R.ents) { if (e.hidden) continue; const [x, y] = t2p(e.i, e.j); const b = spriteBox(e.spr, e.s); ctx.fillStyle = 'rgba(20,30,40,0.28)'; ctx.beginPath(); ctx.ellipse(x, y, b.w * 0.42, b.w * 0.2, 0, 0, 7); ctx.fill(); }
  // 深度排序
  const P = R.player; const pd = P ? P.i + P.j : 0; const [ppx, ppy] = P ? t2p(P.i, P.j) : [0, 0];
  const list = [];
  const PA = R.M.propAtlas; const pim = img('assets/maps/' + PA.img);
  for (const p of R.props) list.push({ d: p.depth, p });
  for (const e of R.ents) if (!e.hidden) list.push({ d: e.i + e.j + 0.01, e });
  list.sort((a, b) => a.d - b.d);
  for (const it of list) {
    if (it.p) {
      const p = it.p; const f = PA.f[p.t]; if (!f || !pim) continue;
      const dx = p.x - f[4], dy = p.y - f[5];
      let al = 1;
      if (P && p.depth > pd + 0.3 && ppx > dx + 10 && ppx < dx + f[2] - 10 && ppy - 90 > dy && ppy - 20 < dy + f[3] && ppy < p.y + 10) al = 0.45;
      ctx.globalAlpha = al; ctx.drawImage(pim, f[0], f[1], f[2], f[3], dx, dy, f[2], f[3]); ctx.globalAlpha = 1;
    } else {
      const e = it.e; const [x, y] = t2p(e.i, e.j);
      const fps = e.anim === 'walk' ? 10 : 5;
      const lift = R.entPre ? R.entPre(ctx, e, x, y) || 0 : 0;
      drawSprite(ctx, e.spr, e.anim, e.dir, e.at * fps, x, y - lift + (e.bob ? Math.sin(R.t * 3) * 3 : 0), e.s, e.alpha);
      if (R.entPost) R.entPost(ctx, e, x, y - lift);
    }
  }
  // 头顶标签
  ctx.textAlign = 'center';
  for (const e of R.ents) {
    if (e.hidden || !e.label) continue; const [x, y] = t2p(e.i, e.j); const b = spriteBox(e.spr, e.s);
    const ty = y - b.h - 6 - (e.lift || 0);
    ctx.font = 'bold 22px WBXKai,sans-serif'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(e.label, x, ty); ctx.fillStyle = e.lc || '#fff'; ctx.fillText(e.label, x, ty);
    if (e.mark) { const by = ty - 30 + Math.sin(R.t * 4) * 5; ctx.font = 'bold 40px WBXKai,sans-serif'; ctx.strokeText(e.mark, x, by); ctx.fillStyle = e.mark === '!' ? '#ffd23a' : e.mark === '?' ? '#7affb0' : '#ff6a6a'; ctx.fillText(e.mark, x, by); }
  }
  // 交互点
  for (const m of R.marks) {
    if (m.hidden) continue; const [x, y] = t2p(m.i + 0.5, m.j + 0.5); const by = y - (m.h || 110) + Math.sin(R.t * 3 + m.i) * 6;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 52, by - 26, 104, 40, 18) : ctx.rect(x - 52, by - 26, 104, 40); ctx.fill();
    ctx.font = 'bold 22px WBXKai,sans-serif'; ctx.fillStyle = m.c || '#ffe9a0'; ctx.fillText(m.label, x, by + 2);
  }
  drawParts(ctx, true);
  if (R.drawAbove) R.drawAbove(ctx);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (R.drawScreen) R.drawScreen(ctx);
  drawOverlay(ctx);
}
function drawParts(ctx, world) {
  for (const p of R.parts) {
    if (p.world !== world) continue; const k = 1 - p.t / p.life; const r = p.shrink ? p.r * (0.3 + 0.7 * k) : p.r;
    ctx.globalCompositeOperation = p.add ? 'lighter' : 'source-over'; ctx.globalAlpha = Math.min(1, k * 1.5) * (p.a || 1);
    ctx.fillStyle = p.c;
    if (p.line) { ctx.strokeStyle = p.c; ctx.lineWidth = p.r; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05); ctx.stroke(); }
    else if (p.ring) { ctx.strokeStyle = p.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.stroke(); }
    else if (p.star) { ctx.beginPath(); for (let k2 = 0; k2 < 8; k2++) { const a = k2 * Math.PI / 4 + p.t * 2; const rr = k2 % 2 ? r * 0.35 : r * 1.6; ctx.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr); } ctx.fill(); }
    else if (p.spin) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.t * 3 + (p.ph || 0)); ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.5, 0, 0, 7); ctx.fill(); ctx.restore(); }
    else { ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill(); }
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  for (const t of R.texts) {
    if (t.world !== world) continue; const k = t.t / t.life; const y = t.y - 60 * k - (k < 0.15 ? (0.15 - k) * -200 : 0);
    ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; ctx.font = `bold ${t.size * (k < 0.1 ? 1 + (0.1 - k) * 5 : 1)}px WBXKai,sans-serif`; ctx.textAlign = 'center';
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.strokeText(t.txt, t.x, y); ctx.fillStyle = t.c; ctx.fillText(t.txt, t.x, y);
  }
  ctx.globalAlpha = 1;
}
function drawOverlay(ctx) {
  if (R.dark > 0) { ctx.fillStyle = `rgba(10,10,30,${R.dark})`; ctx.fillRect(0, 0, R.W, R.H); }
  if (R.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${R.flash})`; ctx.fillRect(0, 0, R.W, R.H); }
  drawParts(ctx, false);
  if (R.bolts) { for (const b of R.bolts) drawBolt(ctx, b); R.bolts = R.bolts.filter(b => (b.t += 0.016) < b.life); }
  if (R.joy && R.mode === 'map' && R.showJoy) {
    const j = R.joy; const cx = j.active ? j.ox : 110 * R.dpr, cy = j.active ? j.oy : R.H - 150 * R.dpr; const rr = 56 * R.dpr;
    ctx.globalAlpha = j.active ? 0.55 : 0.25; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); const m = Math.min(1, Math.hypot(j.dx, j.dy) / rr) || 0; const a = Math.atan2(j.dy, j.dx); ctx.arc(cx + (j.active ? Math.cos(a) * m * rr : 0), cy + (j.active ? Math.sin(a) * m * rr : 0), rr * 0.42, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  }
}
function drawBolt(ctx, b) {
  const k = 1 - b.t / b.life; ctx.globalCompositeOperation = 'lighter';
  for (const [w, c] of [[14, 'rgba(160,140,255,0.35)'], [6, 'rgba(220,210,255,0.8)'], [2.5, '#fff']]) {
    ctx.strokeStyle = c; ctx.lineWidth = w * R.dpr * k; ctx.beginPath(); ctx.moveTo(b.pts[0][0], b.pts[0][1]); for (const p of b.pts) ctx.lineTo(p[0], p[1]); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
}
function makeBolt(x0, y0, x1, y1, life = 0.35) {
  const pts = [[x0, y0]]; const n = 12; for (let k = 1; k < n; k++) { const t = k / n; pts.push([x0 + (x1 - x0) * t + (Math.random() - 0.5) * 60 * R.dpr, y0 + (y1 - y0) * t]); } pts.push([x1, y1]);
  (R.bolts = R.bolts || []).push({ pts, t: 0, life });
}
// ======================= 输入 =======================
function setupInput() {
  const cv = R.cv; R.joy = { active: false, dx: 0, dy: 0 }; R.showJoy = true;
  let down = null;
  cv.addEventListener('pointerdown', e => {
    const x = e.clientX * R.dpr, y = e.clientY * R.dpr;
    if (R.mode === 'map' && R.showJoy && x < R.W * 0.4 && y > R.H * 0.62) { R.joy = { active: true, ox: x, oy: y, dx: 0, dy: 0, id: e.pointerId }; cv.setPointerCapture(e.pointerId); return; }
    down = { x, y, t: performance.now() };
  });
  cv.addEventListener('pointermove', e => { if (R.joy.active && e.pointerId === R.joy.id) { R.joy.dx = e.clientX * R.dpr - R.joy.ox; R.joy.dy = e.clientY * R.dpr - R.joy.oy; } });
  const up = e => {
    if (R.joy.active && e.pointerId === R.joy.id) { R.joy.active = false; R.joy.dx = R.joy.dy = 0; return; }
    if (!down) return; const x = e.clientX * R.dpr, y = e.clientY * R.dpr;
    if (Math.hypot(x - down.x, y - down.y) < 30 * R.dpr && R.onTap) R.onTap(x, y);
    down = null;
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
}
// 屏幕点击 → 实体/交互点/地块
function pickAt(sx, sy) {
  const [wx, wy] = s2w(sx, sy);
  let best = null, bd = 1e9;
  for (const e of R.ents) {
    if (e.hidden || e === R.player || e.kind === 'pet') continue; const [x, y] = t2p(e.i, e.j); const b = spriteBox(e.spr, e.s);
    if (wx > x - b.w / 2 - 10 && wx < x + b.w / 2 + 10 && wy > y - b.h - 10 && wy < y + 20) { const d = Math.abs(wy - (y - b.h / 2)); if (d < bd) { bd = d; best = { ent: e }; } }
  }
  if (best) return best;
  for (const m of R.marks) { if (m.hidden) continue; const [x, y] = t2p(m.i + 0.5, m.j + 0.5); const by = y - (m.h || 110); if (Math.abs(wx - x) < 60 && wy > by - 40 && wy < y + 20) return { mark: m }; }
  const [ti, tj] = p2t(wx, wy); return { tile: [Math.floor(ti), Math.floor(tj)] };
}

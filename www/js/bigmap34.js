'use strict';
// ======================= 3.4② 大地图：桃花村 36、青云宗/天外天 32、坊市/秘境 28 =======================
// 原 22×22 区域与坐标完全不变（存档/任务/NPC 坐标零迁移），向 +i（屏幕右下）/+j（左下）扩展。
// 新区域：程序化等距地块（配色取自各图底板采样）+ 本图道具图集里的建筑/树木/交互点；
// 主路与旧图边缘打通。地块按 1024px 分块缓存到离屏画布，只画与视口相交的块（§E.3）。
const Big34 = {
  CFG: {
    village: { n: 36, base: 'g', alt: 'f', pal: { g: '#689b56', f: '#6e9c59', p: '#e2c694', d: '#8a6a53', s: '#9c978f', w: '#81cef6' }, cliff: '#5c4a3d', rows: [10, 17], cols: [10, 3],
      build: ['house', 'house2', 'house', 'haystack', 'cart', 'well', 'noticeboard', 'mat', 'lanternpole', 'lanternpole'], deco: ['peach', 'peach', 'oak', 'willow', 'bamboo', 'bush', 'bush', 'rock', 'fence'] },
    sect: { n: 32, base: 'g', alt: 'f', pal: { g: '#6d9f59', f: '#77ab5e', p: '#ddc190', s: '#8f8b83', j: '#aad7c8', w: '#6ec5f3' }, cliff: '#604d3f', rows: [15], cols: [10, 4],
      build: ['pagoda', 'paifang', 'dummy', 'stonelamp', 'stonelamp', 'incense', 'mat', 'crane'], deco: ['pine', 'pine', 'bamboo', 'bush', 'rock', 'crane'] },
    heaven: { n: 32, base: 'c', alt: 'c', pal: { c: '#e4e4e5', j: '#8cb1a2', p: '#8cb1a2' }, path: 'j', cliff: '#9d9eb3', rows: [15], cols: [10],
      build: ['cloudpillar', 'cloudpillar', 'jade', 'fairypeach', 'sundisk', 'crane'], deco: ['cloudpuff', 'cloudpuff', 'cloudpillar', 'crane'] },
    market: { n: 28, base: 'g', alt: 'g', pal: { g: '#679855', p: '#d7bb8b', s: '#a39d95', w: '#67c3f3' }, cliff: '#58473b', rows: [11], cols: [10],
      build: ['stall_r', 'stall_b', 'stall_y', 'crates', 'lanternpole', 'teahouse'], deco: ['willow', 'peach', 'bush', 'crates'] },
    secret: { n: 28, base: 'm', alt: 'r', pal: { m: '#697c74', r: '#60555d', p: '#eccf9b', l: '#fecd41' }, cliff: '#42394c', rows: [11], cols: [10],
      build: ['ruin', 'crystal', 'crystal_b', 'torch', 'herb', 'chest'], deco: ['deadtree', 'rock', 'mushroom', 'crystal', 'torch'] },
  },
  orig: {}, chunks: null, chunkFor: null,
  rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; },
  extend(id) {
    const C = this.CFG[id], M = ASSETS.maps[id]; if (!C || !M || M.n !== 22 || M._big34) return;
    const n0 = 22, n = C.n, PATH = C.path || 'p', rnd = this.rng(id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
    const T = []; for (let j = 0; j < n; j++) { const r = []; for (let i = 0; i < n; i++) r.push(i < n0 && j < n0 ? M.tiles[j][i] : (i === n - 1 || j === n - 1 || (i === 0 && j >= n0) || (j === 0 && i >= n0)) ? 'x' : (rnd() < 0.18 ? C.alt : C.base)); T.push(r); }
    // 打通旧图东南/西南边缘（第 21 行/列只把 'x' 改为地面，靠近 22 的两圈）
    for (let k = 1; k < n0 - 1; k++) for (const [i, j] of [[n0 - 1, k], [k, n0 - 1], [n0 - 2, k], [k, n0 - 2]]) if (T[j][i] === 'x' && (i >= n0 - 2 || j >= n0 - 2)) { const inner = T[Math.min(j, n0 - 3)][Math.min(i, n0 - 3)]; if (inner !== 'x' || rnd() < 0.7) T[j][i] = C.base; }
    // 主路延长 + 新区环路
    for (const j of C.rows) for (let i = 1; i < n - 1; i++) if (T[j][i] !== 'x' || i >= n0 - 2) if (i >= n0 - 3) T[j][i] = PATH;
    for (const i of C.cols) for (let j = 1; j < n - 1; j++) if (j >= n0 - 3) T[j][i] = PATH;
    const R2 = n - 5; for (let i = 2; i < n - 1; i++) T[R2][i] = PATH; for (let j = 2; j < n - 1; j++) T[j][R2] = PATH;
    if (C.pal.w) { const ci = n0 + 2, cj = n - 9; for (let j = cj; j < cj + 3; j++) for (let i = ci; i < ci + 4; i++) if (T[j][i] !== PATH) T[j][i] = 'w'; }
    // 道具：只放在新区地面格，离路 ≥1 格，互不重叠
    const occ = new Set(); for (const [t, i, j] of M.props) { const f = M.foot[t] || [1, 1]; for (let a = 0; a < f[0]; a++) for (let b = 0; b < f[1]; b++) occ.add((i + a) + ',' + (j + b)); }
    const props = M.props.slice(); const nearPath = (i, j) => { for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const r = T[j + b]; if (r && (r[i + a] === PATH || r[i + a] === 'x' || r[i + a] === 'w')) return true; } return false; };
    const free = (i, j, f) => { for (let a = -1; a <= f[0]; a++) for (let b = -1; b <= f[1]; b++) if (occ.has((i + a) + ',' + (j + b))) return false; for (let a = 0; a < f[0]; a++) for (let b = 0; b < f[1]; b++) { const t = (T[j + b] || [])[i + a]; if (!t || t === 'x' || t === PATH || t === 'w' || (i + a < n0 && j + b < n0)) return false; } return true; };
    const place = (t, tries, wantPath) => { const f = M.foot[t]; if (!f) return; for (let k = 0; k < tries; k++) { const i = 1 + Math.floor(rnd() * (n - 2)), j = 1 + Math.floor(rnd() * (n - 2)); if (i < n0 && j < n0) continue; if (!free(i, j, f)) continue; if (wantPath && !nearPathAny(i, j, f)) continue; if (!wantPath && nearPath(i, j)) continue; props.push([t, i, j]); for (let a = 0; a < f[0]; a++) for (let b = 0; b < f[1]; b++) occ.add((i + a) + ',' + (j + b)); return; } };
    const nearPathAny = (i, j, f) => { for (let a = -1; a <= f[0]; a++) for (let b = -1; b <= f[1]; b++) if ((T[j + b] || [])[i + a] === PATH) return true; return false; };
    for (const t of C.build) place(t, 400, true);
    const area = n * n - n0 * n0; for (let k = 0; k < area * 0.07; k++) place(C.deco[Math.floor(rnd() * C.deco.length)], 30, false);
    M.tiles = T.map(r => r.join('')); M.props = props; M.n = n; M._big34 = { n0, C };
    // 连通性兜底：从出生点洪泛，堵住的道具移除（逐个从后往前）
    this.fixConnect(id);
  },
  fixConnect(id) {
    const M = ASSETS.maps[id], n = M.n, st = MAPINFO[id].start;
    const grid = () => { const g = M.tiles.map(r => [...r].map(c => 'wlx'.includes(c) ? 0 : 1)); for (const [t, i, j] of M.props) { if (typeof NONBLOCK !== 'undefined' && NONBLOCK.has(t)) continue; const f = M.foot[t]; for (let b = 0; b < f[1]; b++) for (let a = 0; a < f[0]; a++) if (g[j + b] && g[j + b][i + a] !== undefined) g[j + b][i + a] = 0; } return g; };
    for (let guard = 0; guard < 60; guard++) {
      const g = grid(); const seen = new Set([st[0] + ',' + st[1]]); const q = [st]; while (q.length) { const [i, j] = q.pop(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = i + a, y = j + b; if (g[y] && g[y][x] === 1 && !seen.has(x + ',' + y)) { seen.add(x + ',' + y); q.push([x, y]); } } }
      let bad = null; for (let j = 0; j < n && !bad; j++) for (let i = 0; i < n; i++) if (g[j][i] === 1 && !seen.has(i + ',' + j) && (i >= 22 || j >= 22)) { bad = [i, j]; break; }
      if (!bad) return; // 删离孤岛最近的新增道具
      let bk = -1, bd = 1e9; for (let k = M.props.length - 1; k >= 0; k--) { const [, i, j] = M.props[k]; if (i < 22 && j < 22) continue; const d = Math.hypot(i - bad[0], j - bad[1]); if (d < bd) { bd = d; bk = k; } }
      if (bk < 0) { const r = [...M.tiles[bad[1]]]; r[bad[0]] = 'x'; M.tiles[bad[1]] = r.join(''); } else M.props.splice(bk, 1);
    }
  },
  // ---- 绘制：新区与打通格的地块，分块缓存 ----
  build() {
    const M = R.M, B = M && M._big34; this.chunks = null; this.chunkFor = R.mapId; if (!B) return;
    const P = M.plate, n = M.n, C = B.C, PATH = C.path || 'p';
    const corners = (i, j) => [t2p(i, j), t2p(i + 1, j), t2p(i + 1, j + 1), t2p(i, j + 1)];
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const cells = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const t = M.tiles[j][i]; const isNew = i >= B.n0 || j >= B.n0; const opened = !isNew && (i >= B.n0 - 2 || j >= B.n0 - 2) && t !== 'x'; if (!isNew && !opened) continue; if (t === 'x') continue; const c = corners(i, j); cells.push([i, j, t, c]); for (const [x, y] of c) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y + 70); } }
    if (!cells.length) return;
    const S = 1024, chunks = [];
    for (let cy = y0; cy < y1; cy += S) for (let cx = x0; cx < x1; cx += S) { const cv = document.createElement('canvas'); cv.width = Math.min(S, Math.ceil(x1 - cx)); cv.height = Math.min(S, Math.ceil(y1 - cy)); chunks.push({ x: cx, y: cy, cv, g: cv.getContext('2d'), used: false }); }
    const isVoid = (i, j) => i < 0 || j < 0 || i >= n || j >= n || M.tiles[j][i] === 'x';
    const shade = (hex, k) => { const v = parseInt(hex.slice(1), 16); const r = Math.min(255, ((v >> 16) & 255) * k) | 0, g = Math.min(255, ((v >> 8) & 255) * k) | 0, b = Math.min(255, (v & 255) * k) | 0; return `rgb(${r},${g},${b})`; };
    for (const ch of chunks) {
      const g = ch.g; g.translate(-ch.x, -ch.y);
      // 崖壁（先画，在地面之下）
      for (const [i, j, , c] of cells) { const dz = 60; if (isVoid(i + 1, j)) { g.fillStyle = shade(C.cliff, 0.85); g.beginPath(); g.moveTo(...c[1]); g.lineTo(...c[2]); g.lineTo(c[2][0], c[2][1] + dz); g.lineTo(c[1][0], c[1][1] + dz); g.fill(); ch.used = true; } if (isVoid(i, j + 1)) { g.fillStyle = shade(C.cliff, 1.05); g.beginPath(); g.moveTo(...c[3]); g.lineTo(...c[2]); g.lineTo(c[2][0], c[2][1] + dz); g.lineTo(c[3][0], c[3][1] + dz); g.fill(); ch.used = true; } }
      for (const [i, j, t, c] of cells) { const col = C.pal[t] || C.pal[C.base]; const k = 0.94 + ((i * 7 + j * 13) % 5) * 0.03; g.fillStyle = shade(col, k); g.beginPath(); g.moveTo(...c[0]); for (let q = 1; q < 4; q++) g.lineTo(...c[q]); g.closePath(); g.fill(); g.strokeStyle = shade(col, k * 0.97); g.lineWidth = 1; g.stroke(); ch.used = true;
        if (t === 'f') { g.fillStyle = 'rgba(255,200,220,0.8)'; const [cx, cy] = t2p(i + 0.5, j + 0.5); for (let q = 0; q < 3; q++) { g.beginPath(); g.arc(cx - 12 + q * 12, cy - 3 + (q % 2) * 6, 3, 0, 7); g.fill(); } } }
    }
    this.chunks = chunks.filter(c => c.used);
  },
  draw(ctx) {
    if (!R.M || !R.M._big34) return; if (this.chunkFor !== R.mapId || !this.chunks) this.build(); if (!this.chunks) return;
    const [vx0, vy0] = s2w(0, 0), [vx1, vy1] = s2w(R.W, R.H);
    for (const c of this.chunks) if (c.x < vx1 && c.x + c.cv.width > vx0 && c.y < vy1 && c.y + c.cv.height > vy0) ctx.drawImage(c.cv, c.x, c.y);
  },
};
for (const id in Big34.CFG) try { Big34.extend(id); } catch (e) { console.error('Big34', id, e); }
(function () {
  Big34.hook = function () { if (R.drawGround && R.drawGround._big) return; const oG = R.drawGround; const f = ctx => { try { Big34.draw(ctx); } catch (e) { console.error(e); } if (oG) oG(ctx); }; f._big = 1; if (oG && oG._seam) f._seam = 1; R.drawGround = f; };
  Big34.hook(); setInterval(() => Big34.hook(), 500);
})();

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
    graveyard: { n: 28, base: 'b', alt: 'g', pal: { b: '#5a5560', g: '#55704a', p: '#b8a27a', w: '#4a6a8a' }, cliff: '#3a3540',
      build: ['grave', 'grave', 'stele', 'wlantern', 'wlantern', 'tomb', 'herb'], deco: ['deadtree', 'grave', 'rock', 'bonespike', 'wlantern'] },
    island: { n: 28, base: 'g', alt: 'a', pal: { g: '#6aa05a', a: '#e8d6a0', p: '#e2c694', s: '#a0a0a0', w: '#6ec5f3' }, cliff: '#6a5a48',
      build: ['pavilion', 'boat', 'herb', 'palm', 'coral', 'shellrock'], deco: ['palm', 'palm', 'bush', 'coral', 'shellrock'] },
    rift: { n: 28, base: 'r', alt: 's', pal: { r: '#5a3a38', s: '#6a6060', p: '#a08070', l: '#ff7a30' }, cliff: '#3a2420',
      build: ['obelisk', 'altar', 'herb', 'crystal_r', 'lavarock'], deco: ['lavarock', 'deadtree', 'bonespike', 'crystal_r'] },
  },
  // 源格表由 tools/big34_src.py 离线生成（颜色接近类型中位色、无道具、不透明）
  SRC: {"village":{"g":[[5,2],[15,19],[1,11],[16,8],[4,2],[16,19]],"d":[[14,5],[12,5],[14,6],[13,5],[13,6]],"p":[[10,17],[3,10],[10,10]],"w":[[6,15],[5,14],[5,15]]},"sect":{"g":[[17,5],[5,19],[12,18],[5,17],[17,4],[5,18],[17,6],[17,7]],"s":[[10,11],[9,12],[11,12]]},"heaven":{"c":[[4,7],[17,11],[2,11],[18,11],[18,10],[17,9],[18,12],[3,11]],"j":[[9,9],[9,7],[9,8],[9,10],[12,9],[10,7],[10,9],[11,8]]},"market":{"s":[[15,7],[12,16],[13,16],[19,13],[4,7],[14,7],[20,8],[5,8]],"p":[[10,11]],"w":[[3,18],[4,19],[4,18],[3,19]],"g":[[15,19]]},"secret":{"l":[[14,6],[15,5],[14,5],[5,15],[15,6],[16,6],[4,15]],"p":[[10,10],[10,11],[11,11],[11,10]],"m":[[17,18]]},"graveyard":{"b":[[16,5],[6,14],[15,6],[14,6],[8,2]],"p":[[10,12]],"w":[[15,15],[16,15],[15,16]]},"island":{"s":[[13,5],[12,4],[10,7],[13,4],[12,5]],"g":[[19,10]],"p":[[10,12]],"a":[[12,14],[18,14]],"w":[[8,18],[7,19],[5,18],[6,18],[6,17],[7,18],[6,19],[5,19]]},"rift":{"r":[[7,11],[5,10],[5,11],[6,11],[12,18],[4,11],[8,11],[12,17]],"l":[[5,6],[5,5],[4,6],[5,7]],"s":[[10,7],[9,7],[11,7]]}},
  orig: {}, chunks: null, chunkFor: null,
  rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; },
  extend(id) {
    const C = this.CFG[id], M = ASSETS.maps[id]; if (!C || !M || M.n !== 22 || M._big34) return;
    if (!C.rows) { const cnt = k => M.tiles.map((r, j) => [j, [...r].filter((c, i) => (k ? M.tiles[i][j] : c) === (C.path || 'p')).length]).sort((a, b) => b[1] - a[1]); C.rows = [cnt(0)[0][0]]; C.cols = [cnt(1)[0][0]]; }
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
    // 真实地块纹理：从本图底板里同类型「内部格」（四邻同类）抠菱形贴过来，随机源格 → 自然变化；崖壁同样抠旧图边缘的崖面
    const plate = img('assets/maps/' + R.mapId + '.webp'); const pk = P.k || 1; const O = M.tiles; const src = {}, cliffI = [], cliffJ = [];
    const ot = (i, j) => (i < 0 || j < 0 || i >= B.n0 || j >= B.n0) ? 'x' : O[j][i];
    Object.assign(src, Big34.SRC[R.mapId] || {});
    for (let j = 1; j < B.n0 - 1; j++) for (let i = 1; i < B.n0 - 1; i++) { if (ot(i, j) === 'x') continue; if (ot(i + 1, j) === 'x' && ot(i + 1, j + 1) === 'x' && i < B.n0 - 3) cliffI.push([i, j]); if (ot(i, j + 1) === 'x' && ot(i + 1, j + 1) === 'x' && j < B.n0 - 3) cliffJ.push([i, j]); }
    const hash = (i, j, k) => { let h = (i * 73856093) ^ (j * 19349663) ^ (k * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const poly = (g, pts) => { g.beginPath(); g.moveTo(...pts[0]); for (let q = 1; q < pts.length; q++) g.lineTo(...pts[q]); g.closePath(); };
    const blit = (g, si, sj, di, dj, clipPts, pad) => { // 平移拷贝：源格 (si,sj) → 目标格 (di,dj)
      const [sx, sy] = t2p(si, sj), [dx, dy] = t2p(di, dj); g.save(); poly(g, clipPts); g.clip();
      const bx = Math.min(...clipPts.map(p => p[0])) - 2, by = Math.min(...clipPts.map(p => p[1])) - 2, bw = Math.max(...clipPts.map(p => p[0])) - bx + 4, bh = Math.max(...clipPts.map(p => p[1])) - by + 4;
      const ox = bx - dx + sx, oy = by - dy + sy; g.drawImage(plate, ox * pk, oy * pk, bw * pk, bh * pk, bx, by, bw, bh); g.restore(); };
    for (const ch of chunks) {
      const g = ch.g; g.translate(-ch.x, -ch.y);
      for (const [i, j, , c] of cells) { const dz = 64;
        if (isVoid(i + 1, j)) { const pts = [c[1], c[2], [c[2][0], c[2][1] + dz], [c[1][0], c[1][1] + dz]]; if (plate && cliffI.length) { const s = cliffI[Math.floor(hash(i, j, 1) * cliffI.length)]; blit(g, s[0], s[1], i, j, pts); } else { g.fillStyle = shade(C.cliff, 0.85); poly(g, pts); g.fill(); } ch.used = true; }
        if (isVoid(i, j + 1)) { const pts = [c[3], c[2], [c[2][0], c[2][1] + dz], [c[3][0], c[3][1] + dz]]; if (plate && cliffJ.length) { const s = cliffJ[Math.floor(hash(i, j, 2) * cliffJ.length)]; blit(g, s[0], s[1], i, j, pts); } else { g.fillStyle = shade(C.cliff, 1.05); poly(g, pts); g.fill(); } ch.used = true; } }
      for (let [i, j, t, c] of cells) {
        const tt = (src[t] && src[t].length) || C.pal[t] ? t : C.base; const pool = src[tt] && src[tt].length ? src[tt] : null; t = tt; ch.used = true;
        // 稍放大一圈避免缝
        const cx = (c[0][0] + c[2][0]) / 2, cy = (c[0][1] + c[2][1]) / 2; const pts = c.map(([x, y]) => [cx + (x - cx) * 1.1, cy + (y - cy) * 1.1]);
        if (plate && pool && pool.length) { const s = pool[Math.floor(hash(i, j, 3) * pool.length)]; blit(g, s[0], s[1], i, j, pts); }
        else { g.fillStyle = shade(C.pal[t] || C.pal[C.base], 0.96 + hash(i, j, 4) * 0.06); poly(g, pts); g.fill(); const [mx, my] = t2p(i + 0.5, j + 0.5); for (let q = 0; q < 7; q++) { g.fillStyle = `rgba(90,70,50,${0.12 + hash(i, j, q + 9) * 0.15})`; g.beginPath(); g.ellipse(mx + (hash(i, j, q + 20) - 0.5) * 60, my + (hash(i, j, q + 30) - 0.5) * 28, 2 + hash(i, j, q) * 3, 1 + hash(i, j, q) * 1.5, 0, 0, 7); g.fill(); } }
      }
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
// ---- 新区 NPC（复用现有精灵/头像，闲聊台词；位置取新区环路旁的可走格）----
Big34.NPCS = {
  village: [['b34_boatman', '渡口船夫', 'npc_fisher', ['过河一文，欠条不收。', '上回讨债司的人坐我的船，船票也赊着。', '后山那边新开了路，桃花比村口还多。']],
            ['b34_peddler', '集市货郎', 'npc_merchant', ['糖葫芦、针头线脑、天道发票，应有尽有！', '新集市刚开张，摊位费比坊市便宜一半。']]],
  sect: [['b34_guard', '守山弟子', 'npc_disciple', ['后山禁地，闲人免进……你交学费了吗？', '这片新练功场是去年用你们的学费修的。']]],
  heaven: [['b34_clerk', '收费仙吏', 'npc_disciple', ['南天门收费站规划中，先登记一下欠款。', '这块云是新铺的，踩之前请先缴纳踩云费。']]],
  market: [['b34_hawker', '吆喝的小贩', 'npc_villager', ['新摊位！新摊位！价格公道童叟无欺（概不退换）。']]],
  secret: [['b34_seeker', '迷路的寻宝人', 'npc_luren', ['我在这片新塌出来的洞里转了三天了……', '听说宝箱旁边的蘑菇不能吃，我吃了两个。']]],
};
Big34.addNpcs = function () {
  for (const id in this.NPCS) { const M = ASSETS.maps[id]; if (!M || !M._big34) continue; const n = M.n, n0 = M._big34.n0, PATH = M._big34.C.path || 'p';
    const blocked = new Set(); for (const [t, i, j] of M.props) { const f = M.foot[t] || [1, 1]; for (let a = 0; a < f[0]; a++) for (let b = 0; b < f[1]; b++) blocked.add((i + a) + ',' + (j + b)); }
    const cand = []; for (let j = 2; j < n - 2; j++) for (let i = 2; i < n - 2; i++) { if (i < n0 + 1 && j < n0 + 1) continue; const t = M.tiles[j][i]; if ('wlx'.includes(t) || t === PATH || blocked.has(i + ',' + j)) continue; let np = 0; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (M.tiles[j + b][i + a] === PATH) np++; if (np) cand.push([i, j]); }
    this.NPCS[id].forEach(([key, nm, spr, lines], k) => { if (NPCS[key] || !cand.length) return; const c = cand[Math.floor((k * 0.37 + 0.21) * cand.length) % cand.length]; NPCS[key] = { n: nm, spr, map: id, at: c, por: spr }; CHAT[key] = lines; });
  }
};
try { Big34.addNpcs(); } catch (e) { console.error('Big34 npcs', e); }

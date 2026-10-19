'use strict';
// ======================= 3.4① 无缝相邻地图（九州连通） =======================
// 相邻关系：按 world28 九州大地图节点坐标，每张图四条边各连向该方向最近的已注册地图。
// 地图边缘放「出口」（发光箭头 + 邻图名），走上去即免费切图（不耗行动力、无菜单、无黑屏淡入），
// 到达邻图对应反方向边的出口旁。进入地图时预加载所有邻图的底板/道具图集，切换无需等待加载。
const Seam34 = {
  MAXD: 1500, links: {}, exits: [], cool: 0, busy: false, armed: false, noFade: false,
  // 边：等距视角下 i+ 朝屏幕右下（东南），j+ 朝左下（西南），i- 西北，j- 东北
  SIDES: { ip: [1, 1], jp: [-1, 1], im: [-1, -1], jm: [1, -1] },
  OPP: { ip: 'im', im: 'ip', jp: 'jm', jm: 'jp' },
  pos(id) { const I = MAPINFO[id]; if (!I) return null; if (I.wx !== undefined && I.wy !== undefined) return [I.wx, I.wy]; return (typeof World28 !== 'undefined' && World28.DEFAULT_LAYOUT[id]) || null; },
  build() {
    // 只连常规地图（MAP_ORDER）：问道崖 wendao 按 maps26 设定只由主线/传承仪式进入，不能从边缘走进去
    const reg = (typeof MAP_ORDER !== 'undefined' && MAP_ORDER.length) ? new Set(MAP_ORDER) : null;
    const ids = Object.keys(MAPINFO).filter(id => this.pos(id) && ASSETS.maps[id] && (!reg || reg.has(id)));
    const L = {}; for (const id of ids) L[id] = {};
    // 先收集候选边 (a,side,b,dist)，按距离贪心，保证双向一致：a 的 side 连 b ⇔ b 的 OPP[side] 连 a
    const cand = [];
    for (const a of ids) for (const b of ids) { if (a >= b) continue; const [ax, ay] = this.pos(a), [bx, by] = this.pos(b); const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy); if (d > this.MAXD || d < 1) continue;
      let best = null, bd = -2; for (const s in this.SIDES) { const v = this.SIDES[s]; const c = (dx * v[0] + dy * v[1]) / (d * Math.SQRT2); if (c > bd) { bd = c; best = s; } }
      cand.push([d, a, best, b]); }
    cand.sort((x, y) => x[0] - y[0]);
    for (const [, a, s, b] of cand) { const o = this.OPP[s]; if (L[a][s] || L[b][o]) continue; L[a][s] = b; L[b][o] = a; }
    this.links = L; return L;
  },
  // 出口格：本图可走、与出生点连通、在该边方向最外侧且靠近边中线
  exitTile(side) {
    const n = R.n, v = this.SIDES[side]; const st = MAPINFO[R.mapId].start; const [si, sj] = nearestWalk(st[0], st[1]);
    const seen = new Uint8Array(n * n), q = [[si, sj]]; seen[sj * n + si] = 1; let best = null, bs = -1e9;
    // 方向向量在 (i,j) 网格上：ip→(+1,0) jp→(0,+1) im→(-1,0) jm→(0,-1)
    const g = { ip: [1, 0], jp: [0, 1], im: [-1, 0], jm: [0, -1] }[side]; const c = (n - 1) / 2;
    while (q.length) { const [i, j] = q.pop(); const out = (i - c) * g[0] + (j - c) * g[1], perp = Math.abs((i - c) * g[1] - (j - c) * g[0]); const sc = out * 4 - perp; if (sc > bs) { bs = sc; best = [i, j]; }
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (walkable(a, b) && !seen[b * n + a]) { seen[b * n + a] = 1; q.push([a, b]); } } }
    return best;
  },
  setup() {
    this.exits = []; this.armed = false; this.cool = 0.8; if (!R.M || !this.links[R.mapId]) return;
    for (const s in this.links[R.mapId]) { const to = this.links[R.mapId][s]; const t = this.exitTile(s); if (!t) continue; this.exits.push({ side: s, to, i: t[0], j: t[1] }); this.preload(to); }
  },
  preload(id) { try { const M = ASSETS.maps[id]; loadImg('assets/maps/' + id + '.webp'); loadImg('assets/maps/' + M.propAtlas.img); } catch (e) { } },
  draw(ctx) {
    if (!R.M || R.mode !== 'map' || !this.exits.length) return;
    const t = R.t || 0;
    for (const x of this.exits) try { this.strip(ctx, x); } catch (e) { }
    for (const x of this.exits) {
      const [cx, cy] = t2p(x.i + 0.5, x.j + 0.5); const ok = Game.canEnter(x.to); const v = this.SIDES[x.side];
      ctx.save(); const a = 0.55 + 0.25 * Math.sin(t * 3);
      const gr = ctx.createRadialGradient(cx, cy, 4, cx, cy, 56); gr.addColorStop(0, ok ? `rgba(255,240,160,${a})` : `rgba(200,120,120,${a})`); gr.addColorStop(1, 'rgba(255,240,160,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(cx, cy, 56, 28, 0, 0, 7); ctx.fill();
      // 箭头指向边外
      const ax = cx + v[0] * 22, ay = cy + v[1] * 11 + Math.sin(t * 4) * 3; const ang = Math.atan2(v[1] * 0.5, v[0]);
      ctx.translate(ax, ay); ctx.rotate(ang); ctx.fillStyle = ok ? 'rgba(255,230,120,0.95)' : 'rgba(220,140,140,0.9)'; ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-8, -12); ctx.lineTo(-2, 0); ctx.lineTo(-8, 12); ctx.closePath(); ctx.fill();
      ctx.restore(); ctx.save();
      ctx.font = 'bold 20px WBXKai,sans-serif'; ctx.textAlign = 'center'; const lb = (ok ? '→ ' : '🔒 ') + MAPINFO[x.to].n; const tw = ctx.measureText(lb).width + 16;
      ctx.fillStyle = 'rgba(20,14,8,0.6)'; ctx.fillRect(cx - tw / 2, cy - 64, tw, 28); ctx.fillStyle = ok ? '#ffe9a0' : '#f3b0b0'; ctx.fillText(lb, cx, cy - 43); ctx.restore();
    }
    this.tick();
  },
  // 出口外侧画一条邻图「对边」真实地块边条：邻图底板上反向出口附近 5×3.5 格，按等距网格平移对齐拼到本图出口外，向外渐隐
  strip(ctx, x) {
    const N = ASSETS.maps[x.to]; if (!N) return; const im = img('assets/maps/' + x.to + '.webp'); if (!im) return;
    const g = { ip: [1, 0], jp: [0, 1], im: [-1, 0], jm: [0, -1] }[x.side]; const nb = this.OPP[x.side]; const nn = N.n, c = (nn - 1) / 2;
    // 邻图反向边的出口近似：该边最外侧非 x 格中最靠中线者（只在原 22 格底板范围内）
    const gn = { ip: [1, 0], jp: [0, 1], im: [-1, 0], jm: [0, -1] }[nb]; let best = null, bs = -1e9;
    for (let j = 0; j < 22; j++) for (let i = 0; i < 22; i++) { if ('xwl'.includes(N.tiles[j][i])) continue; const out = (i - 10.5) * gn[0] + (j - 10.5) * gn[1], perp = Math.abs((i - 10.5) * gn[1] - (j - 10.5) * gn[0]); const sc = out * 4 - perp; if (sc > bs) { bs = sc; best = [i, j]; } }
    if (!best) return; const NP = N.plate, k = NP.k || 1; const tp = (P, i, j) => [P.ox + i * P.ex[0] + j * P.ej[0], P.oy + i * P.ex[1] + j * P.ej[1]];
    // 本图目标锚点：出口外 2 格；邻图源锚点：其出口格（再往其图内 1 格）
    // 平移对齐：本图 (x.i,x.j)+g·k ↔ 邻图 best+g·(k-1)（邻图里 g 方向即其「向内」）
    const [ax, ay] = t2p(x.i + 0.5, x.j + 0.5), [bx, by] = tp(NP, best[0] + 0.5 - g[0], best[1] + 0.5 - g[1]); const offx = bx - ax, offy = by - ay;
    const pg = [g[1], g[0]]; // 沿边方向
    const Q = (u, v) => t2p(x.i + 0.5 + g[0] * u + pg[0] * v, x.j + 0.5 + g[1] * u + pg[1] * v);
    const poly = [Q(0.5, -2.5), Q(0.5, 2.5), Q(4, 2.5), Q(4, -2.5)];
    const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]); const x0 = Math.min(...xs) - 4, y0 = Math.min(...ys) - 4, w = Math.max(...xs) - x0 + 8, h = Math.max(...ys) - y0 + 8;
    ctx.save(); ctx.beginPath(); ctx.moveTo(...poly[0]); for (let q = 1; q < 4; q++) ctx.lineTo(...poly[q]); ctx.closePath(); ctx.clip();
    ctx.globalAlpha = 0.9; ctx.drawImage(im, (x0 + offx) * k, (y0 + offy) * k, w * k, h * k, x0, y0, w, h);
    const [n0x, n0y] = Q(0.5, 0), [n1x, n1y] = Q(4, 0); const gr = ctx.createLinearGradient(n0x, n0y, n1x, n1y); gr.addColorStop(0, 'rgba(235,245,255,0)'); gr.addColorStop(0.45, 'rgba(235,245,255,0.15)'); gr.addColorStop(1, 'rgba(235,245,255,0.95)');
    ctx.globalAlpha = 1; ctx.fillStyle = gr; ctx.fillRect(x0, y0, w, h); ctx.restore();
  },
  tick() {
    const P = R.player; if (!P || this.busy || R.mode !== 'map' || (window.UI && UI.stack && UI.stack.length)) return;
    if (typeof UX !== 'undefined' && UX.inMap && !UX.inMap()) return; // 战斗/剧情/突破抽卡特效/死亡/Game._busy 期间不切图
    if (this.cool > 0) { this.cool -= 0.016; return; }
    if (P.path && P.path.length && !P.joyMove) return; // 寻路途经出口（自动任务/追踪）不切图；停在出口或摇杆走上去才切
    const on = this.exits.find(x => Math.floor(P.i) === x.i && Math.floor(P.j) === x.j);
    if (!on) { this.armed = true; return; }
    if (!this.armed) return;
    if (!Game.canEnter(on.to)) { this.armed = false; UI.toast(`${MAPINFO[on.to].n}：境界不足（需${(typeof REALMS !== 'undefined' && REALMS[MAPINFO[on.to].need] && REALMS[MAPINFO[on.to].need].n) || '更高境界'}）`); return; }
    this.go(on);
  },
  async go(x) {
    this.busy = true; const from = R.mapId; this.noFade = true;
    try {
      try { R.player.path = []; await Game.travel(x.to, true); }
      finally { this.noFade = false; }
      if (R.mapId === x.to) {
        const back = this.exits.find(e => e.to === from) || this.exits.find(e => e.side === this.OPP[x.side]);
        if (back) { // 落在反向出口内侧一格
          const v = { ip: [1, 0], jp: [0, 1], im: [-1, 0], jm: [0, -1] }[back.side]; let ti = back.i, tj = back.j, bo = 1e9; // 反向出口旁、更靠内侧的一格可走格
          for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) { if (!di && !dj) continue; const a = back.i + di, b = back.j + dj; if (!walkable(a, b) || !findPath(back.i, back.j, a, b)) continue; const o = (di * v[0] + dj * v[1]) * 3 + Math.abs(di) + Math.abs(dj); if (o < bo) { bo = o; ti = a; tj = b; } }
          const P = R.player; P.i = ti + 0.5; P.j = tj + 0.5; P.path = []; if (R.pet) { R.pet.i = P.i; R.pet.j = P.j; }
          const [px, py] = t2p(P.i, P.j); R.cam.x = px; R.cam.y = py - 60; Game.G.pos = [P.i, P.j];
          this.armed = false; this.cool = 0.6;
        }
      }
    } catch (e) { console.error(e); } finally { this.busy = false; } // travel 抛错也要复位 busy，否则本局所有出口失效
  },
};
window.Seam34 = Seam34;
(function () {
  const oF = UI.fade.bind(UI), oL = UI.loading.bind(UI);
  UI.fade = (on, ms) => Seam34.noFade ? Promise.resolve() : oF(on, ms);
  UI.loading = on => Seam34.noFade ? undefined : oL(on);
  const oE = Game.enterMap.bind(Game);
  Game.enterMap = async function (id) { const r = await oE(id); try { if (!Object.keys(Seam34.links).length) Seam34.build(); Seam34.setup(); } catch (e) { console.error(e); } return r; };
  Seam34.hook = function () { if (R.drawGround && R.drawGround._seam) return; const oG = R.drawGround; const f = ctx => { if (oG) oG(ctx); try { Seam34.draw(ctx); } catch (e) { console.error(e); } }; f._seam = 1; R.drawGround = f; };
  Seam34.hook(); setInterval(() => Seam34.hook(), 500);
})();

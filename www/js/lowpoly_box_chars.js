'use strict';
// ======================= 方块低模角色（开放世界线 · 阶段 1 运行时草稿） =======================
// 用长方体（Cube）拼 Q 版人形，Canvas 2D 等距投影 + 背面剔除 + 三面明暗，零贴图零第三方素材。
// 比例参照 art/prototypes/openworld_v25（大头、短身、裙摆/长袍加宽），但这里是 Canvas 现画，不是 Blender 渲染图。
// 隔离：不进 www/index.html；只由 www/prototypes/lowpoly_box/ 预览页和即时战原型（opts.skin==='box' 时）使用。
// 模型坐标：x=右，y=前（面向），z=上；单位≈像素（scale=1 时整个人约 100px 高）。
(function () {
  const C30 = Math.cos(Math.PI / 6), S30 = 0.5;
  // part: [名称, 中心 x,y,z, 尺寸 w,d,h, 颜色, 动画组]
  const CHARS = {
    jianxiu: { name: '青衫剑修', parts: [
      ['legL', -7, 0, 9, 8, 8, 18, '#3a4a5a', 'legL'],
      ['legR', 7, 0, 9, 8, 8, 18, '#3a4a5a', 'legR'],
      ['robe', 0, 0, 30, 26, 16, 26, '#4f9a8a', ''],
      ['belt', 0, 0, 32, 27, 17, 4, '#e8d08a', ''],
      ['armL', -17, 0, 34, 7, 7, 20, '#4f9a8a', 'armL'],
      ['armR', 17, 0, 34, 7, 7, 20, '#4f9a8a', 'armR'],
      ['head', 0, 0, 58, 26, 24, 24, '#f0d2b0', ''],
      ['hair', 0, -3, 70, 28, 22, 8, '#2a2230', ''],
      ['bun', 0, -4, 78, 10, 10, 8, '#2a2230', ''],
      ['eyeL', -6, 12.5, 58, 4, 1, 5, '#1a1a22', ''],
      ['eyeR', 6, 12.5, 58, 4, 1, 5, '#1a1a22', ''],
      ['sword', 20, 14, 30, 3, 30, 3, '#d8e4f0', 'sword'],
    ] },
    taozhai: { name: '讨债鬼差', parts: [
      ['legL', -7, 0, 8, 9, 9, 16, '#2a2a2a', 'legL'],
      ['legR', 7, 0, 8, 9, 9, 16, '#2a2a2a', 'legR'],
      ['robe', 0, 0, 30, 32, 20, 28, '#5a3a6a', ''],
      ['sash', 0, 0, 33, 33, 21, 4, '#c04a3a', ''],
      ['armL', -20, 0, 34, 8, 8, 20, '#5a3a6a', 'armL'],
      ['armR', 20, 0, 34, 8, 8, 20, '#5a3a6a', 'armR'],
      ['head', 0, 0, 58, 26, 24, 24, '#c8d8c8', ''],
      ['hat', 0, 0, 74, 34, 30, 8, '#1e1e26', ''],
      ['hatTop', 0, 0, 82, 16, 16, 8, '#1e1e26', ''],
      ['eyeL', -6, 12.5, 58, 4, 1, 3, '#e04040', ''],
      ['eyeR', 6, 12.5, 58, 4, 1, 3, '#e04040', ''],
      ['ledger', 22, 12, 30, 12, 4, 14, '#e8d08a', 'sword'], // 账本当武器
    ] },
  };

  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = v => Math.max(0, Math.min(255, Math.round(v * k)));
    return '#' + [f(n >> 16 & 255), f(n >> 8 & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  // 姿势偏移（模型坐标）：idle 呼吸起伏 / walk 摆腿摆臂 / attack 前刺
  function poseOffset(grp, anim, t) {
    let dx = 0, dy = 0, dz = 0;
    if (anim === 'idle') dz = Math.sin(t * 3) * 1.2;
    if (anim === 'walk') {
      const s = Math.sin(t * 10);
      if (grp === 'legL') { dy = s * 6; dz = Math.max(0, s) * 3; }
      if (grp === 'legR') { dy = -s * 6; dz = Math.max(0, -s) * 3; }
      if (grp === 'armL') dy = -s * 5;
      if (grp === 'armR' || grp === 'sword') dy = s * 5;
    }
    if (anim === 'attack') {
      const k = Math.sin(Math.min(1, Math.max(0, t)) * Math.PI); // t: 0→1 挥砍进度
      if (grp === 'armR') { dy = k * 10; dz = k * 4; }
      if (grp === 'sword') { dy = k * 22; dz = k * 4; }
    }
    return [dx, dy, dz];
  }

  // 把一个角色展开为可绘制的面（已投影、已剔除、已排序）
  function build(id, opts) {
    const ch = CHARS[id]; if (!ch) return [];
    opts = opts || {};
    const s = opts.scale || 1, ang = opts.angle || 0, anim = opts.anim || 'idle', t = opts.t || 0;
    // 面向角 ang：0 = 朝屏幕右下（模型 +y 对齐世界 +x+y 方向的等距“南”）；用屏幕面向 atan2(fy,fx) 转换见 angleFromFace
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const rot = (x, y) => [x * ca - y * sa, x * sa + y * ca];
    const proj = (x, y, z) => [(x - y) * C30 * s, ((x + y) * S30 - z) * s];
    const faces = [];
    for (const [n, cx, cy, cz, w, d, h, col, grp] of ch.parts) {
      const [ox, oy, oz] = poseOffset(grp, anim, t);
      const px = cx + ox, py = cy + oy, pz = cz + oz;
      const hw = w / 2, hd = d / 2, hh = h / 2;
      const P = [];
      for (const [a, b, c] of [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]) {
        const [rx, ry] = rot(px + a * hw, py + b * hd);
        P.push({ w: [rx, ry, pz + c * hh], s: proj(rx, ry, pz + c * hh) });
      }
      const [wx, wy] = rot(px, py);
      // 6 面（顶点逆时针 → 屏幕上带符号面积>0 为朝向镜头）+ 明暗
      const F = [[4, 5, 6, 7, 1.15, 'top'], [3, 2, 1, 0, 0.5, 'bottom'], [0, 1, 5, 4, 0.8, 'back'], [2, 3, 7, 6, 0.95, 'front'], [1, 2, 6, 5, 0.7, 'right'], [3, 0, 4, 7, 0.9, 'left']];
      for (const [a, b, c, e, k, side] of F) {
        const q = [P[a].s, P[b].s, P[c].s, P[e].s];
        let area = 0;
        for (let i = 0; i < 4; i++) { const [x1, y1] = q[i], [x2, y2] = q[(i + 1) % 4]; area += x1 * y2 - x2 * y1; }
        if (area <= 1e-6) continue; // 背面剔除
        faces.push({ part: n, side, pts: q, fill: shade(col, k), depth: wx + wy + pz }); // 朝镜头方向 = (1,1,1)（由投影基推出），按部件中心深度排序
      }
    }
    faces.sort((A, B) => A.depth - B.depth); // 远→近（画家算法）
    return faces;
  }

  // 屏幕面向 (fx,fy) → 模型角：模型 +y 指向屏幕方向 (fx,fy)
  function angleFromFace(fx, fy) {
    if (!fx && !fy) return 0;
    // 屏幕方向反投影到世界平面：sx=(x-y)C30, sy=(x+y)S30 → x=(sx/C30+sy/S30)/2, y=(sy/S30-sx/C30)/2
    const wx = (fx / C30 + fy / S30) / 2, wy = (fy / S30 - fx / C30) / 2;
    return Math.atan2(wy, wx) - Math.PI / 2;
  }

  // 画到 ctx：x,y 为脚底屏幕坐标。返回 { faces, bbox }
  function draw(ctx, id, x, y, opts) {
    const faces = build(id, opts);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const f of faces) {
      ctx.beginPath();
      f.pts.forEach(([px, py], i) => {
        if (i === 0) ctx.moveTo(x + px, y + py); else ctx.lineTo(x + px, y + py);
        x0 = Math.min(x0, x + px); x1 = Math.max(x1, x + px); y0 = Math.min(y0, y + py); y1 = Math.max(y1, y + py);
      });
      ctx.closePath();
      ctx.fillStyle = f.fill; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.stroke();
    }
    return { faces: faces.length, bbox: { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 } };
  }

  const API = { CHARS, build, draw, angleFromFace, poseOffset, ids: Object.keys(CHARS) };
  if (typeof window !== 'undefined') window.LowpolyBox = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();

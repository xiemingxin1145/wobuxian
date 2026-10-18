// 方块低模角色无头单测：node test/lowpoly_box.js（退出码 = 失败数）
// 验证 www/js/lowpoly_box_chars.js 的几何/投影/剔除/排序/姿势，以及它没有进入正式游戏加载链。
'use strict';
const fs = require('fs');
const path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
global.window = global;
const L = require(path.join(ROOT, 'www', 'js', 'lowpoly_box_chars.js'));
const calls = [];
const fakeCtx = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : (...a) => calls.push(k)), set: (t, k, v) => { t[k] = v; return true; } });
const cen = pts => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
const partCen = (faces, n) => cen(faces.filter(f => f.part === n).flatMap(f => f.pts));
const ang = (fx, fy) => L.angleFromFace(fx, fy);

// 1. 两个样例角色，全部由长方体组成
ok(window.LowpolyBox === L && L.ids.length === 2 && L.ids.includes('jianxiu') && L.ids.includes('taozhai'), '两个样例：青衫剑修 / 讨债鬼差');
for (const id of L.ids) {
  const P = L.CHARS[id].parts;
  ok(P.length >= 10 && P.every(p => p.length === 9 && p[4] > 0 && p[5] > 0 && p[6] > 0 && /^#[0-9a-f]{6}$/i.test(p[7])), `${id}：${P.length} 个长方体，尺寸>0、颜色合法`);
  ok(['head', 'robe', 'legL', 'legR', 'armL', 'armR', 'eyeL', 'eyeR'].every(n => P.some(p => p[0] === n)), `${id}：头/身/双腿/双臂/双眼齐全`);
}

// 2. 背面剔除：任意朝向每个长方体只画 2~3 个面，且顶面始终可见
let cullOk = true, topOk = true;
for (const id of L.ids) for (let k = 0; k < 16; k++) {
  const faces = L.build(id, { angle: k * Math.PI / 8 });
  for (const p of L.CHARS[id].parts) {
    const fs_ = faces.filter(f => f.part === p[0]);
    if (fs_.length < 2 || fs_.length > 3) cullOk = false;
    if (!fs_.some(f => f.side === 'top') || fs_.some(f => f.side === 'bottom')) topOk = false;
  }
}
ok(cullOk, '16 个朝向下每块都只剩 2~3 个朝镜头的面');
ok(topOk, '俯视镜头：顶面始终可见、底面始终剔除');

// 3. 面向映射：模型「前方」投影到屏幕上就是给定面向
for (const [fx, fy, nm] of [[0, 1, '下'], [1, 0, '右'], [0, -1, '上'], [-1, 0, '左']]) {
  const a = ang(fx, fy);
  const wx = -Math.sin(a), wy = Math.cos(a); // 模型 +y 旋转后
  const sx = (wx - wy) * Math.cos(Math.PI / 6), sy = (wx + wy) * 0.5;
  const l = Math.hypot(sx, sy);
  ok(Math.abs(sx / l - fx) < 1e-6 && Math.abs(sy / l - fy) < 1e-6, `angleFromFace：面向${nm}`);
}

// 4. 画家排序：正面看眼睛画在脸前、头发压在头顶；背面看眼睛被头挡住（先画）
const idx = (faces, n) => faces.map((f, i) => (f.part === n ? i : -1)).filter(i => i >= 0);
let F = L.build('jianxiu', { angle: ang(0, 1) });
ok(Math.min(...idx(F, 'eyeL')) > Math.max(...idx(F, 'head')), '面向下：眼睛在头之后绘制（看得见）');
ok(Math.min(...idx(F, 'hair')) > Math.max(...idx(F, 'head')), '头发在头之后绘制（压在头顶）');
F = L.build('jianxiu', { angle: ang(0, -1) });
ok(Math.max(...idx(F, 'eyeL')) < Math.min(...idx(F, 'head')), '面向上：眼睛先画、被头遮住');

// 5. 姿势：挥砍时剑沿面向推出；行走双腿反向摆
for (const id of L.ids) {
  const wpn = L.CHARS[id].parts.find(p => p[8] === 'sword')[0];
  const a = partCen(L.build(id, { angle: ang(1, 0), anim: 'attack', t: 0 }), wpn);
  const b = partCen(L.build(id, { angle: ang(1, 0), anim: 'attack', t: 0.5 }), wpn);
  ok(b[0] - a[0] > 10, `${id}：面向右挥砍，武器向右推出 ${(b[0] - a[0]).toFixed(1)}px`);
}
const lo = L.poseOffset('legL', 'walk', 0.15), ro = L.poseOffset('legR', 'walk', 0.15);
ok(lo[1] * ro[1] < 0, '行走：左右腿前后反向');
ok(L.poseOffset('robe', 'idle', 0.5)[2] !== 0, '待机：呼吸起伏');

// 6. 绘制与尺度：scale=1 约一个 Q 版人高（80~110px），scale 线性
for (const id of L.ids) {
  calls.length = 0;
  const r = L.draw(fakeCtx(), id, 100, 200, {});
  ok(r.faces > 20 && calls.filter(c => c === 'fill').length === r.faces, `${id}：draw 填充 ${r.faces} 个面`);
  ok(r.bbox.h > 80 && r.bbox.h < 110 && r.bbox.y1 <= 200 + 12, `${id}：高 ${r.bbox.h.toFixed(1)}px，脚底贴锚点`);
  const r2 = L.draw(fakeCtx(), id, 100, 200, { scale: 2 });
  ok(Math.abs(r2.bbox.h - 2 * r.bbox.h) < 0.01, `${id}：scale 线性`);
}
ok(L.build('nobody', {}).length === 0, '未知角色 id 返回空，不崩');

// 7. 隔离：不进正式加载链；正式 js 里只有即时战原型（skin==='box' 分支）引用 LowpolyBox
const html = fs.readFileSync(path.join(ROOT, 'www', 'index.html'), 'utf8');
ok(!/lowpoly_box/.test(html), 'www/index.html 未加载 lowpoly_box_chars.js');
const refs = fs.readdirSync(path.join(ROOT, 'www', 'js')).filter(f => f.endsWith('.js') && f !== 'lowpoly_box_chars.js')
  .filter(f => /LowpolyBox/.test(fs.readFileSync(path.join(ROOT, 'www', 'js', f), 'utf8')));
ok(refs.join(',') === 'battle_realtime_prototype.js', '正式 js 只有即时战原型引用 LowpolyBox：' + refs.join(','));
ok(fs.existsSync(path.join(ROOT, 'www', 'prototypes', 'lowpoly_box', 'index.html')), '独立预览页存在');

console.log(fails ? `FAILED ${fails}` : 'ALL PASS');
process.exit(fails);

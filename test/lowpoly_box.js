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
ok(window.LowpolyBox === L && ['jianxiu', 'taozhai', 'nvzhu', 'jianxian'].every(id => L.ids.includes(id)) && L.ids.length === 4, '四个样例：青衫剑修 / 讨债鬼差 / 主角女 / 剑仙');
for (const id of L.ids) {
  const P = L.CHARS[id].parts;
  ok(P.length >= 10 && P.every(p => p.length === 9 && p[4] > 0 && p[5] > 0 && p[6] > 0 && /^#[0-9a-f]{6}$/i.test(p[7])), `${id}：${P.length} 个长方体，尺寸>0、颜色合法`);
  ok(['head', 'legL', 'legR', 'armL', 'armR', 'eyeL', 'eyeR'].every(n => P.some(p => p[0] === n)) && P.some(p => p[0] === 'robe' || p[0] === 'skirt'), `${id}：头/身/双腿/双臂/双眼齐全`);
  ok(P.filter(p => p[8] === 'sword').length === 1, `${id}：恰好一件手持武器（挥砍姿势用）`);
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
  ok(r.bbox.h > 80 && r.bbox.h < 115 && r.bbox.y1 <= 200 + 12, `${id}：高 ${r.bbox.h.toFixed(1)}px，脚底贴锚点`);
  const r2 = L.draw(fakeCtx(), id, 100, 200, { scale: 2 });
  ok(Math.abs(r2.bbox.h - 2 * r.bbox.h) < 0.01, `${id}：scale 线性`);
}
ok(L.build('nobody', {}).length === 0, '未知角色 id 返回空，不崩');

// 5b. 新角色特征：主角女裙摆宽（剪影区别于男性角色）+ 双侧长发；剑仙最高、背剑在身后
const part = (id, n) => L.CHARS[id].parts.find(p => p[0] === n);
ok(part('nvzhu', 'skirt')[4] / part('jianxiu', 'robe')[4] >= 1.5, `主角女裙摆宽 ${part('nvzhu', 'skirt')[4]} ≥ 剑修袍 ${part('jianxiu', 'robe')[4]} 的 1.5 倍`);
ok(!!part('nvzhu', 'tailL') && !!part('nvzhu', 'tailR'), '主角女有双侧长发束');
const H = id => L.draw(fakeCtx(), id, 0, 0, {}).bbox.h;
ok(H('jianxian') > Math.max(H('jianxiu'), H('nvzhu'), H('taozhai')) - 1e-9 && H('jianxian') < 115, `剑仙最高（${H('jianxian').toFixed(1)}px）`);
F = L.build('jianxian', { angle: ang(0, 1) });
ok(Math.max(...idx(F, 'backSword')) < Math.min(...idx(F, 'robe')), '剑仙面向下：背上长剑先画（在身后）');
F = L.build('jianxian', { angle: ang(0, -1) });
ok(Math.min(...idx(F, 'backSword')) > Math.max(...idx(F, 'robe')), '剑仙面向上：背上长剑后画（露在背上）');

// 5c. 受击 hurt：上身后仰、双臂上扬、腿不动，首尾归零
for (const id of L.ids) {
  const a0 = L.build(id, { angle: ang(0, 1), anim: 'hurt', t: 0 }), a1 = L.build(id, { angle: ang(0, 1), anim: 'hurt', t: 0.5 });
  const hy0 = partCen(a0, 'head')[1], hy1 = partCen(a1, 'head')[1];
  const ly0 = partCen(a0, 'legL'), ly1 = partCen(a1, 'legL');
  ok(hy1 < hy0 - 2 && Math.abs(ly1[0] - ly0[0]) < 1e-9 && Math.abs(ly1[1] - ly0[1]) < 1e-9, `${id}：受击面向下 → 头往屏幕上方后仰 ${(hy0 - hy1).toFixed(1)}px，腿不动`);
}
ok(L.poseOffset('armL', 'hurt', 0.5)[2] > 0 && L.poseOffset('head', 'hurt', 0).every(v => Math.abs(v) < 1e-9) && L.poseOffset('head', 'hurt', 1).every(v => Math.abs(v) < 1e-9), '受击：双臂上扬，t=0/1 回正');
ok(L.poseOffset('legR', 'hurt', 0.5).every(v => v === 0), '受击：腿偏移为 0');

// 7. 隔离：不进正式加载链；正式 js 里只有即时战原型（skin==='box' 分支）引用 LowpolyBox
const html = fs.readFileSync(path.join(ROOT, 'www', 'index.html'), 'utf8');
ok(!/lowpoly_box/.test(html), 'www/index.html 未加载 lowpoly_box_chars.js');
const refs = fs.readdirSync(path.join(ROOT, 'www', 'js')).filter(f => f.endsWith('.js') && f !== 'lowpoly_box_chars.js')
  .filter(f => /LowpolyBox/.test(fs.readFileSync(path.join(ROOT, 'www', 'js', f), 'utf8')));
ok(refs.join(',') === 'battle_realtime_prototype.js', '正式 js 只有即时战原型引用 LowpolyBox：' + refs.join(','));
ok(fs.existsSync(path.join(ROOT, 'www', 'prototypes', 'lowpoly_box', 'index.html')), '独立预览页存在');

console.log(fails ? `FAILED ${fails}` : 'ALL PASS');
process.exit(fails);

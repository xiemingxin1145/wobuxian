// 3.6 低模外观挂点无头单测：node test/lowpoly_attach.js（退出码 = 失败数）
// 验证 www/js/lowpoly_box_chars.js 的挂点（冠/佩/神器手持位）+ 衣服换色：位置、面数预算、跟随动画、不改原表、只读不碰 G。
'use strict';
const fs = require('fs');
const path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
global.window = global;
const L = require(path.join(ROOT, 'www', 'js', 'lowpoly_box_chars.js'));
const EXTRA = require(path.join(ROOT, 'www', 'js', 'lowpoly_extra_chars.js'));
Object.assign(L.CHARS, EXTRA); // 预览页同样合并扩展角色
const ALL = Object.keys(L.CHARS);
const cen = pts => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
const fcen = (faces, pre) => cen(faces.filter(f => f.part.startsWith(pre)).flatMap(f => f.pts));
const WEAR = { guan: 'douli', pei: 'hulu', shenqi: 'sq_xuanyuan' };
const ang = L.angleFromFace;

// 1. 物件表：命名沿用 research_v36（槽位 guan/pei/shenqi，神器 sq_*），面数在预算内
ok(L.SLOT_BUDGET.guan === 150 && L.SLOT_BUDGET.pei === 150 && L.SLOT_BUDGET.shenqi === 300, '面数预算：冠/佩 150、神器 300（research_v36 §6）');
for (const [k, it] of Object.entries(L.ATTACH)) {
  ok(L.triCount(k) > 0 && L.triCount(k) <= L.SLOT_BUDGET[it.slot], `${it.name}(${k})：${L.triCount(k)} tri ≤ ${L.SLOT_BUDGET[it.slot]}`);
  ok(it.parts.every(p => p.length === 8 && p[4] > 0 && p[5] > 0 && p[6] > 0 && /^#[0-9a-f]{6}$/i.test(p[7])), `${k}：部件尺寸>0、颜色合法`);
}
ok(L.ATTACH.douli.slot === 'guan' && L.ATTACH.hulu.slot === 'pei' && /^sq_/.test(Object.keys(L.ATTACH).find(k => L.ATTACH[k].slot === 'shenqi')), '斗笠=冠、酒葫芦=佩、神器 id 用 sq_ 前缀');
ok(L.triCount('nope') === 0, '未知物件 0 tri');

// 2. 挂点位置：冠在头顶最高处之上、佩在腰侧、手持位 = 原武器中心
for (const id of ALL) {
  const S = L.sockets(id), P = L.CHARS[id].parts;
  const top = Math.max(...P.filter(p => ['head', 'hair', 'bun', 'hat', 'hatTop', 'crown', 'flower'].includes(p[0])).map(p => p[3] + p[6] / 2));
  const head = P.find(p => p[0] === 'head');
  ok(S && S.guan && S.guan[2] === top && top >= head[3] + head[6] / 2, `${id}：冠挂点 z=${top}（头顶最高处）`);
  ok(S.pei[0] < 0 && S.pei[2] > 10 && S.pei[2] < head[3], `${id}：佩挂点在左腰（x=${S.pei[0]}, z=${S.pei[2]}）`);
  const w = P.find(p => p[8] === 'sword');
  if (w) ok(S.hand.join() === [w[1], w[2], w[3]].join(), `${id}：手持位 = 原武器 ${w[0]} 中心`);
  else { const a = P.find(p => p[0] === 'armR'); ok(S.hand.join() === [a[1], a[2] + 6, a[3] - a[6] / 2].join(), `${id}：没武器 → 手持位在右手下端前方`); }
}
ok(L.sockets('nobody') === null && L.dressParts('nobody', WEAR).length === 0, '未知角色：挂点 null、穿戴空表，不崩');

// 3. 穿戴：加部件、神器替换原武器；原表不变
for (const id of ALL) {
  const before = JSON.stringify(L.CHARS[id].parts);
  const D = L.dressParts(id, WEAR);
  const nAtt = D.filter(p => p[0].startsWith('att:')).length;
  ok(nAtt === L.ATTACH.douli.parts.length + L.ATTACH.hulu.parts.length + L.ATTACH.sq_xuanyuan.parts.length, `${id}：加了 ${nAtt} 块挂件`);
  ok(D.filter(p => p[8] === 'sword').every(p => p[0].startsWith('att:shenqi:')) && D.some(p => p[8] === 'sword'), `${id}：神器替换原手持武器，并跟随挥砍组`);
  ok(JSON.stringify(L.CHARS[id].parts) === before, `${id}：CHARS 原表未被改动`);
  const hadW = L.CHARS[id].parts.some(p => p[8] === 'sword') ? 1 : 0;
  const tri = (D.length - L.CHARS[id].parts.length + hadW) * 12; // 加的块 + 被替换掉的原武器
  ok(tri === (L.triCount('douli') + L.triCount('hulu') + L.triCount('sq_xuanyuan')), `${id}：挂件合计 ${tri} tri`);
}
ok(L.dressParts('jianxiu', { guan: 'hulu', pei: 'douli', shenqi: 'douli' }).length === L.CHARS.jianxiu.parts.length, '槽位不符（葫芦戴头上等）全部忽略');
ok(L.dressParts('jianxiu', { guan: 'zzz' }).length === L.CHARS.jianxiu.parts.length, '认不得的 id 忽略');

// 4. 绘制：斗笠在头之上、跟头一起后仰；神器跟挥砍推出；佩随呼吸
const H = L.build('jianxiu', { angle: ang(0, 1), wear: WEAR });
ok(fcen(H, 'att:guan')[1] < fcen(H, 'head')[1] - 10, '斗笠画在头的上方（屏幕 y 更小）');
const h0 = L.build('jianxiu', { angle: ang(0, 1), anim: 'hurt', t: 0, wear: WEAR }), h1 = L.build('jianxiu', { angle: ang(0, 1), anim: 'hurt', t: 0.5, wear: WEAR });
const dHead = fcen(h1, 'head')[1] - fcen(h0, 'head')[1], dGuan = fcen(h1, 'att:guan')[1] - fcen(h0, 'att:guan')[1];
ok(Math.abs(dHead - dGuan) < 1e-6 && dHead < -2, `受击后仰：斗笠与头同步移动 ${dGuan.toFixed(1)}px`);
for (const id of ALL) {
  const a = fcen(L.build(id, { angle: ang(1, 0), anim: 'attack', t: 0, wear: WEAR }), 'att:shenqi');
  const b = fcen(L.build(id, { angle: ang(1, 0), anim: 'attack', t: 0.5, wear: WEAR }), 'att:shenqi');
  ok(b[0] - a[0] > 10, `${id}：面向右挥砍，神器向右推出 ${(b[0] - a[0]).toFixed(1)}px`);
}
const calls = [];
const fakeCtx = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : (...a) => calls.push(k)), set: (t, k, v) => { t[k] = v; return true; } });
const r0 = L.draw(fakeCtx(), 'jianxiu', 0, 0, {}), r1 = L.draw(fakeCtx(), 'jianxiu', 0, 0, { wear: WEAR });
ok(r1.faces > r0.faces && r1.bbox.y0 < r0.bbox.y0, `穿戴后多画 ${r1.faces - r0.faces} 面，顶部被斗笠抬高 ${(r0.bbox.y0 - r1.bbox.y0).toFixed(1)}px`);
ok(JSON.stringify(L.build('jianxiu', {})) === JSON.stringify(L.build('jianxiu', { wear: {} })), '空 wear 与不穿一致（旧调用不受影响）');

// 5. 换色：与主衣同色的部件全换，别的不动；坏颜色忽略
const base = L.CHARS.jianxiu.parts.find(p => p[0] === 'robe')[7];
const D = L.dressParts('jianxiu', null, { yi: '#3F7F9F' });
ok(D.filter(p => p[7] === '#3f7f9f').map(p => p[0]).join() === L.CHARS.jianxiu.parts.filter(p => p[7] === base).map(p => p[0]).join(), '衣染青：袍 + 同色袖子换色（' + D.filter(p => p[7] === '#3f7f9f').map(p => p[0]).join('/') + '）');
ok(D.find(p => p[0] === 'belt')[7] === L.CHARS.jianxiu.parts.find(p => p[0] === 'belt')[7], '腰带不跟着换色');
ok(L.dressParts('nvzhu', null, { yi: '#123456' }).find(p => p[0] === 'skirt')[7] === '#123456', '主角女：裙子换色');
for (const bad of ['red', '#12345', '#ggg000', 7, null]) ok(JSON.stringify(L.dressParts('jianxiu', null, { yi: bad })) === JSON.stringify(L.CHARS.jianxiu.parts), `坏颜色 ${JSON.stringify(bad)} 忽略`);

// 6. 只读、隔离：源码不碰 G / localStorage；预览页有试穿开关；正式页面不加载
// 第 26 轮：research_v36 §6 冠 4 款 / 佩 4 款全部到位，任意角色任意组合可穿
const GUAN4 = ['douli', 'jinguan', 'longjiao', 'doumao'], PEI4 = ['hulu', 'yupei', 'yushan', 'suanpan'];
ok(GUAN4.every(k => L.ATTACH[k] && L.ATTACH[k].slot === 'guan'), '冠 4 款：斗笠/金冠/龙角/兜帽');
ok(PEI4.every(k => L.ATTACH[k] && L.ATTACH[k].slot === 'pei'), '佩 4 款：酒葫芦/玉佩/羽扇/算盘');
ok([...GUAN4, ...PEI4].every(k => L.triCount(k) <= 150), '冠/佩 每件 ≤150 tri：' + [...GUAN4, ...PEI4].map(k => k + '=' + L.triCount(k)).join(' '));
for (const id of L.ids) {
  const S = L.sockets(id); if (!S || !S.guan || !S.pei) continue;
  let all = true;
  for (const g of GUAN4) for (const pe of PEI4) {
    const D = L.dressParts(id, { guan: g, pei: pe });
    const add = D.filter(p => p[0].startsWith('att:'));
    if (add.length !== L.ATTACH[g].parts.length + L.ATTACH[pe].parts.length) all = false;
    if (!add.filter(p => p[0].startsWith('att:guan:')).every(p => p[3] + p[6] / 2 > S.guan[2] - 13)) all = false; // 冠不掉到脸下
    if (!add.filter(p => p[0].startsWith('att:pei:')).every(p => p[1] < 0)) all = false; // 佩都在左侧
    if (L.build(id, { wear: { guan: g, pei: pe } }).length <= L.build(id).length) all = false;
  }
  ok(all, `${id}：16 种冠×佩组合都能穿、冠在头部、佩在左侧、多出可见面`);
}

// 7. 第 29 轮：神器觉醒Ⅲ发光壳（aw 由调用方传，对齐数据层 sq36.own[id].aw）
const SQ = 'sq_xuanyuan', nSq = L.ATTACH[SQ].parts.length;
ok(/^#[0-9a-f]{6}$/i.test(L.ATTACH[SQ].glow) && L.GLOW_AW === 3, '轩辕残剑带觉醒Ⅲ发光壳颜色，门槛 aw=3');
ok(!L.hasGlow(SQ) && !L.hasGlow(SQ, 1) && !L.hasGlow(SQ, 2) && L.hasGlow(SQ, 3) && L.hasGlow(SQ, 9) && !L.hasGlow(SQ, 'x'), '只有 aw≥3 出壳（缺省/Ⅰ/Ⅱ/坏值 不出，>3 钳到 Ⅲ）');
ok(!L.hasGlow('douli', 3) && !L.hasGlow('nope', 3), '冠/佩/未知物件不出发光壳');
ok(L.triCount(SQ, 3) === nSq * 24 && L.triCount(SQ, 3) <= L.SLOT_BUDGET.shenqi && L.triCount(SQ) === nSq * 12, `觉醒Ⅲ 含壳 ${L.triCount(SQ, 3)} tri ≤ 300（Ⅰ/Ⅱ ${L.triCount(SQ)}）`);
for (const id of ALL) {
  const S = L.sockets(id);
  for (const aw of [1, 2]) ok(!L.dressParts(id, { shenqi: SQ, aw }).some(p => p[0].startsWith('att:glow:')), `${id}：觉醒${aw} 无发光壳`);
  const D = L.dressParts(id, { shenqi: SQ, aw: 3 }), G3 = D.filter(p => p[0].startsWith('att:glow:'));
  const body = D.filter(p => p[0].startsWith('att:shenqi:'));
  let fit = G3.length === nSq;
  for (const g of G3) {
    const b = body.find(p => p[0] === 'att:shenqi:' + g[0].slice(9));
    if (!b || g[1] !== b[1] || g[2] !== b[2] || g[3] !== b[3] || g[4] !== b[4] + 2 * L.GLOW_PAD || g[5] !== b[5] + 2 * L.GLOW_PAD || g[6] !== b[6] + 2 * L.GLOW_PAD || g[8] !== 'sword' || g[7] !== L.ATTACH[SQ].glow) fit = false;
  }
  ok(fit && S.hand, `${id}：觉醒Ⅲ 每块神器外套同中心、外扩 ${L.GLOW_PAD} 的发光壳，跟随挥砍组`);
  const a = fcen(L.build(id, { angle: ang(1, 0), anim: 'attack', t: 0, wear: { shenqi: SQ, aw: 3 } }), 'att:glow');
  const b = fcen(L.build(id, { angle: ang(1, 0), anim: 'attack', t: 0.5, wear: { shenqi: SQ, aw: 3 } }), 'att:glow');
  const c = fcen(L.build(id, { angle: ang(1, 0), anim: 'attack', t: 0.5, wear: { shenqi: SQ, aw: 3 } }), 'att:shenqi');
  ok(b[0] - a[0] > 10 && Math.abs(b[0] - c[0]) < 2, `${id}：挥砍时发光壳与神器一起推出 ${(b[0] - a[0]).toFixed(1)}px`);
}
{
  const F = L.build('jianxiu', { wear: { shenqi: SQ, aw: 3 } }); // 与下面 draw 同参数（angle 0）
  const gl = F.filter(f => f.glow), last = {};
  F.forEach((f, i) => { last[f.part] = i; });
  ok(gl.length > 0 && gl.every(f => f.part.startsWith('att:glow:') && f.fill === L.ATTACH[SQ].glow), `发光壳 ${gl.length} 面标 glow、不做明暗（统一 ${L.ATTACH[SQ].glow}）`);
  ok(gl.every(f => F.indexOf(f) > last['att:shenqi:' + f.part.slice(9)]), '发光壳面排在对应神器本体面之后（盖在本体上）');
  ok(F.filter(f => !f.glow).every(f => !f.part.startsWith('att:glow:')), '普通面不带 glow 标记');
  const ops = [], stk = []; let alpha = [];
  const ctx = new Proxy({ _a: 1, _op: 'source-over' }, {
    get: (t, k) => (k === 'save' ? () => { ops.push('save'); stk.push([t.globalAlpha, t.globalCompositeOperation]); } : k === 'restore' ? () => { ops.push('restore'); [t.globalAlpha, t.globalCompositeOperation] = stk.pop(); } : k === 'fill' ? () => { ops.push('fill'); alpha.push([t.globalAlpha === undefined ? 1 : t.globalAlpha, t.globalCompositeOperation || 'source-over']); } : k === 'stroke' ? () => ops.push('stroke') : (k in t ? t[k] : () => {})),
    set: (t, k, v) => { t[k] = v; return true; } });
  const r3 = L.draw(ctx, 'jianxiu', 0, 0, { wear: { shenqi: SQ, aw: 3 } });
  const nFill = ops.filter(o => o === 'fill').length, nStroke = ops.filter(o => o === 'stroke').length;
  ok(r3.faces === F.length, `觉醒Ⅲ draw ${r3.faces} 面 = build 面数`);
  ok(nFill - nStroke === gl.length && ops.filter(o => o === 'save').length === gl.length && ops.filter(o => o === 'restore').length === gl.length, `发光壳 ${gl.length} 面：叠加画、不描边、save/restore 成对`);
  ok(alpha.filter(([a, op]) => op === 'lighter' && a < 1).length === gl.length, '发光壳用 lighter 叠加 + 半透明');
  const r1 = L.draw(fakeCtx(), 'jianxiu', 0, 0, { wear: { shenqi: SQ, aw: 1 } });
  ok(r3.faces - r1.faces === gl.length, `觉醒Ⅲ 比Ⅰ多画 ${r3.faces - r1.faces} 面发光壳`);
  ok(JSON.stringify(L.dressParts('jianxiu', WEAR)) === JSON.stringify(L.dressParts('jianxiu', Object.assign({ aw: 1 }, WEAR))), '旧调用（不传 aw）= 觉醒Ⅰ，外观不变');
}
// 8. 第 29 轮：预览页冠/佩下拉 + 觉醒等级
{
  const pv = fs.readFileSync(path.join(ROOT, 'www', 'prototypes', 'lowpoly_box', 'index.html'), 'utf8');
  ok(/id="guan"/.test(pv) && /id="pei"/.test(pv) && /id="aw"/.test(pv), '预览页有 冠 / 佩 / 神器觉醒 下拉');
  ok(/it\.slot === \(slot === 'sq' \? 'shenqi' : slot\)/.test(pv) && /LowpolyBox\.ATTACH/.test(pv), '冠/佩/神器下拉选项从 ATTACH 按槽位生成（4+4+5 款）');
  ok(/value="3"[^<]*觉醒Ⅲ/.test(pv) && /aw: \+document\.getElementById\('aw'\)\.value/.test(pv), '觉醒下拉含 Ⅲ，并把 aw 传给 wear');
}

const src = fs.readFileSync(path.join(ROOT, 'www', 'js', 'lowpoly_box_chars.js'), 'utf8');
ok(!/\bG\.|\bG\[|localStorage|Game\./.test(src), '挂点代码不读写 G / Game / localStorage');
const prev = fs.readFileSync(path.join(ROOT, 'www', 'prototypes', 'lowpoly_box', 'index.html'), 'utf8');
ok(/id="wear"/.test(prev) && /shenqi: document\.getElementById\('sq'\)\.value \|\| 'sq_xuanyuan'/.test(prev) && /id="sq"/.test(prev), '预览页有「试穿 3.6 挂点」开关 + 神器下拉（默认轩辕残剑）');

// 第 30 轮：其余 4 把神器低模 + 觉醒Ⅲ发光壳
{
  const SQ5 = ['sq_xuanyuan', 'sq_kunlun', 'sq_shennong', 'sq_haotian', 'sq_fuxi'];
  const SQSRC = fs.readFileSync(path.join(ROOT, 'www', 'js', 'shenqi36.js'), 'utf8');
  ok(SQ5.every(k => L.ATTACH[k] && L.ATTACH[k].slot === 'shenqi') && Object.keys(L.ATTACH).filter(k => L.ATTACH[k].slot === 'shenqi').join() === SQ5.join(), '5 把神器齐全（顺序同 shenqi36）');
  ok(SQ5.every(k => new RegExp(k + ": \\{ n: '" + L.ATTACH[k].name + "'").test(SQSRC)), 'id 与中文名对齐 shenqi36.js 数据层');
  for (const k of SQ5) {
    const it = L.ATTACH[k];
    ok(/^#[0-9a-f]{6}$/i.test(it.glow) && L.hasGlow(k, 3) && !L.hasGlow(k, 2), `${it.name}：有发光色，只在觉醒Ⅲ出壳`);
    ok(L.triCount(k) === it.parts.length * 12 && L.triCount(k, 3) === it.parts.length * 24 && L.triCount(k, 3) <= L.SLOT_BUDGET.shenqi, `${it.name}：Ⅰ/Ⅱ ${L.triCount(k)} tri，Ⅲ 含壳 ${L.triCount(k, 3)} tri ≤ 300`);
    for (const id of L.ids) {
      const D = L.dressParts(id, { shenqi: k, aw: 3 }); const body = D.filter(p => p[0].startsWith('att:shenqi:')), gl = D.filter(p => p[0].startsWith('att:glow:'));
      ok(body.length === it.parts.length && gl.length === it.parts.length && gl.every(g => { const b = body.find(p => p[0] === 'att:shenqi:' + g[0].slice(9)); return b && g[1] === b[1] && g[2] === b[2] && g[3] === b[3] && g[4] === b[4] + L.GLOW_PAD * 2 && g[7] === it.glow.toLowerCase() && g[8] === 'sword'; }), `${id} 持${it.name}：本体 + 同中心外扩发光壳，跟随挥砍组`);
    }
    const F = L.build('jianxiu', { wear: { shenqi: k, aw: 3 } }); ok(F.some(f => f.glow) && F.filter(f => f.glow).every(f => f.part.startsWith('att:glow:')), `${it.name}：build 出发光面`);
  }
}
ok(!/lowpoly_box/.test(fs.readFileSync(path.join(ROOT, 'www', 'index.html'), 'utf8')), 'www/index.html 仍未加载低模脚本');

console.log(fails ? `FAILED ${fails}` : 'ALL PASS');
process.exit(fails);

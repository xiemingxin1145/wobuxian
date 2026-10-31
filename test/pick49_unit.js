// 3.9.9 pick49 单测：node test/pick49_unit.js（退出码 = 失败数）
// 覆盖 03_spec_399.md §23.9：V1-V6、怪不误触、胖手指兜底不动。
// 关键：被测的 pickAt 不是重写版——本文件从 www/js/ux23.js 源码中抽取
// 真实的 entHitRect / pickAt / UX.sd / UX.ovl 文本，在 vm 沙箱里执行。
// 旧版 pickOrig 仅作 V1/V3 的 bug 复现参照（原型语义），不参与修复版断言。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'www/js/ux23.js'), 'utf8');

// ---- 从源码抽取真实裁决段（抽不到即失败，不静默重写）----
const entSrc = SRC.slice(SRC.indexOf('function entHitRect'), SRC.indexOf('pickAt = function'));
const pickSrc = SRC.slice(SRC.indexOf('pickAt = function'), SRC.indexOf('};\nGame.onTap')) + '};';
const sdMatch = SRC.match(/UX\.sd = .*?\nUX\.ovl = .*?;/s);
ok(entSrc.includes('entHitRect') && pickSrc.includes('pickAt') && !!sdMatch, 'pick49 从 ux23.js 抽取 entHitRect/pickAt/UX.sd,ovl');
ok(!/dp - 25/.test(pickSrc), 'pick49 真实 pickAt 已无名牌 -25 加分');
ok(/'★'/.test(pickSrc) && /'!'/.test(pickSrc) && /'\?'/.test(pickSrc), 'pick49 真实 pickAt 保留 ★/!/ ? 标记圆优先');
ok(/kind === 'mon' \? 30 : 0/.test(pickSrc), 'pick49 真实 pickAt 保留 mon +30');

const EX = 48.083, EY = 24.042;
const t2p = (i, j) => [(i - j) * EX, (i + j) * EY];
const ctx = {
  console, Math,
  R: { ents: [], marks: [], player: null, dpr: 2, Z: 1 },
  UX: { w: px => px * 2 },
  t2p,
  s2w: (x, y) => [x, y],
  p2t: (x, y) => [(x / EX + y / EY) / 2, (y / EY - x / EX) / 2],
  spriteBox: () => ({ w: 86.4, h: 156.8 }), // 192x224 v24：0.45/0.70
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(entSrc + '\n' + pickSrc + '\n' + sdMatch[0], ctx);
const pick = (x, y) => { const h = ctx.pickAt(x, y); return h.ent ? h.ent.id : (h.mark ? 'mark:' + h.mark.i : 'tile'); };
const setEnts = list => { ctx.R.ents = list.map(e => Object.assign({ kind: 'npc', spr: 'x', s: 1 }, e)); };
const pt = (e, dy) => { const [x, y] = t2p(e.i, e.j); return [x, y + dy]; };

// ---- 旧版参照（原型 pickOrig 语义：sc = min(db, dp-25) + mon30），仅复现 bug ----
function pickOrig(ents, wx, wy) {
  const W = px => px * 2; let best = null, bs = 1e9;
  for (const e of ents) {
    const [x, y] = t2p(e.i, e.j); const bw = 86.4, bh = 156.8;
    const head = e.label ? 44 : 0, mark = e.mark ? 70 : 0;
    const hw = Math.max(bw / 2 + 10, W(32));
    const top = y - bh - 6 - head - mark - 8, bot = y + Math.max(20, W(10));
    const r = { x0: x - hw, x1: x + hw, y0: Math.min(top, bot - W(88)), y1: bot };
    let hit = wx >= r.x0 && wx <= r.x1 && wy >= r.y0 && wy <= r.y1, dp = 1e9;
    if (e.label) {
      const ty = y - bh - 6 - (e.lift || 0); const hw2 = (e.label.length * 30 + 22) / 2 + 6; const mk = e.mark ? 50 : 0;
      if (Math.abs(wx - x) <= hw2 && wy >= ty - 38 - mk && wy <= ty + 14) {
        hit = true; dp = Math.hypot(wx - x, Math.max(0, wy - (ty - 12)) + Math.max(0, (ty - 38) - wy) * 0.3);
      }
    }
    if (!hit) continue;
    const cy = y - (bh + (e.lift || 0)) / 2;
    const db = Math.hypot(wx - x, Math.max(0, Math.abs(wy - cy) - bh * 0.3) * 0.8 + Math.min(Math.abs(wy - cy), bh * 0.3) * 0.25);
    const sc = Math.min(db, dp - 25) + (e.kind === 'mon' ? 30 : 0);
    if (sc < bs) { bs = sc; best = e; }
  }
  return best ? best.id : null;
}

const jian = { id: 'jianxian', i: 9.5, j: 13.5, label: '落魄剑仙', mark: null };
const cui = { id: 'cuihua', i: 12.5, j: 16.5, label: '翠花', mark: '💬' };

// V1：点剑仙身体中心
{
  const [x, y] = pt(jian, -78.4); setEnts([jian, cui]);
  ok(pickOrig([jian, cui], x, y) === 'cuihua', 'V1 旧版复现：点剑仙身体中心判翠花（bug）');
  ok(pick(x, y) === 'jianxian', 'V1 修复版：点剑仙身体中心判剑仙');
}
// V2：剑仙名牌点 / 头点
{
  setEnts([jian, cui]);
  const [x1, y1] = pt(jian, -170); ok(pick(x1, y1) === 'jianxian', 'V2 修复版：点剑仙名牌判剑仙');
  const [x2, y2] = pt(jian, -138); ok(pick(x2, y2) === 'jianxian', 'V2b 修复版：点剑仙头判剑仙');
}
// V3：同列、和差 4 格（sd=1.33，ovl=false：让位层对此姿态是瞎的，本版不修让位，只记录）
{
  const j2 = Object.assign({}, jian, { i: 10.5, j: 12.5 }), c2 = Object.assign({}, cui, { i: 12.5, j: 14.5 });
  const [x, y] = pt(j2, -78.4); setEnts([j2, c2]);
  ok(pickOrig([j2, c2], x, y) === 'cuihua', 'V3 旧版复现：和差 4 格点剑仙身体中心判翠花');
  ok(pick(x, y) === 'jianxian', 'V3 修复版：和差 4 格点剑仙身体中心判剑仙');
  ok(ctx.UX.ovl(10.5, 12.5, 12.5, 14.5) === false, 'V3 真实 UX.ovl(和差4格) === false');
}
// V4：挪家后翠花 (14.5,15.5)
{
  const c3 = Object.assign({}, cui, { i: 14.5, j: 15.5 }); setEnts([jian, c3]);
  const [x, y] = pt(jian, -78.4); ok(pick(x, y) === 'jianxian', 'V4 修复版：挪家后点剑仙身体中心判剑仙');
}
// V5：标记拆分——★/!/ ? 圆心仍归主人；💬/…/无标记不优先，身体胜
{
  for (const mk of ['★', '!', '?']) {
    const cs = Object.assign({}, cui, { mark: mk }); setEnts([jian, cs]);
    const [ex, ey] = t2p(cs.i, cs.j); const ty = ey - 156.8 - 6; // 圆心 ty-fs-34，npc fs=30
    ok(pick(ex, ty - 64) === 'cuihua', `V5 修复版：翠花 ${mk} 圆心点（压在剑仙身体上）仍判翠花`);
  }
  setEnts([jian, cui]);
  const [bx, by] = pt(jian, -78.4); ok(pick(bx, by) === 'jianxian', 'V5 修复版：💬 不优先，点剑仙身体中心判剑仙');
  const [ex, ey] = t2p(cui.i, cui.j); const ty = ey - 156.8 - 6;
  ok(pick(ex, ty - 54) === 'jianxian', 'V5 修复版：💬 气泡圆心点（落在剑仙身体内）判剑仙，不抢');
  const cn = Object.assign({}, cui, { mark: null }); setEnts([jian, cn]);
  ok(pick(bx, by) === 'jianxian', 'V5 修复版：无标记时点剑仙身体中心判剑仙');
}
// V6：深度平局——分差 ≤15 时 i+j 更大者胜
{
  const a = { id: 'back', i: 10, j: 10, label: '甲', mark: null };
  const b = { id: 'front', i: 11, j: 11, label: '乙', mark: null };
  setEnts([a, b]);
  ok(pick(0, 440) === 'front', 'V6 修复版：重叠区平局点判 i+j 更大者（front）');
  const [px, py] = t2p(10.5, 10.5); ok(pick(px, py - 40) === 'front', 'V6 修复版：原型重叠点判 front');
}
// V7：怪不误触——mon +30 保留，点 npc 身体时邻位 mon 不抢
{
  const npc = { id: 'npc1', i: 11, j: 10, label: '路人', mark: null };
  const mon = { id: 'mon1', i: 10, j: 10, label: null, mark: null, kind: 'mon' };
  setEnts([npc, mon]);
  // 点 (20, mon 身体中心高)：两身体内；mon 裸分 20 < npc 裸分 28.7（无 +30 时 mon 会赢），
  // +30 后 mon 50、差 21.3 > 15，npc 赢——此点可区分 +30 是否保留
  const [, my] = t2p(mon.i, mon.j);
  ok(pick(20, my - 78.4) === 'npc1', 'V7 修复版：mon +30 保留，近身 mon 不抢 npc 身体点');
  setEnts([npc, Object.assign({}, mon, { i: 11, j: 10 })]);
  const [nx, ny] = pt(npc, -78.4); ok(pick(nx, ny) === 'npc1', 'V7 修复版：点 npc 身体中心时邻位 mon 不抢');
}
// V8：胖手指兜底不动——点空不返回 null，近失落点走兜底，远点走地块
{
  setEnts([cui]);
  const [cx, cy] = t2p(cui.i, cui.j); const ccy = cy - 78.4;
  ok(pick(cx + 100, ccy) === 'cuihua', 'V8 修复版：矩形外近失落点仍走胖手指兜底判翠花');
  const far = ctx.pickAt(cx + 1000, ccy + 1000);
  ok(far && far.tile && !far.ent, 'V8 修复版：远点空不返回 null，走地块回退');
}
console.log(`pick49_unit: ${n - fails}/${n} PASS, ${fails} FAIL`);
process.exit(fails ? 1 : 0);

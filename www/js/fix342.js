'use strict';
// ======================= 3.4.2 点按修复（#27 N2）=======================
// ①名字牌优先（名字牌画在所有人物之上，点在底牌上就是点这个人；只在底牌外的宽容边缘才让位给别人的身体，保 #12）：点在 NPC/BOSS 名字牌上，一定选中这个人——不被旁边 BOSS 身体（讨债史莱姆）、交互标记（古井/打坐）或地面抢走；
//   正在闲逛的 NPC（货郎）点到 0.6 秒内名字牌所在的位置也算（以前只认身体框，点名字落空→走过去）。
// ②任务栏（#qt）盖在名字牌上：点任务栏正文（不是「去/自动」按钮）且下面正好是名字牌 → 选中这个 NPC；
//   同时任务栏变半透明，名字牌不再淡出看不见。
const Fix342 = {
  labelAt(wx, wy, e, i, j) { // 名字牌矩形（与 engine.js 绘制一致：fs=30，底牌 fs+12 高）
    const [x, y] = t2p(i, j); const b = spriteBox(e.spr, e.s); const ty = y - b.h - 6 - (e.lift || 0);
    const hw = (e.label.length * 30 + 22) / 2 + 6; const mk = e.mark ? 40 : 0;
    if (Math.abs(wx - x) <= hw && wy >= ty - 36 - mk && wy <= ty + 14) { this._core = Math.abs(wx - x) <= hw - 6 && wy >= ty - 32 && wy <= ty + 10; return Math.hypot(wx - x, wy - (ty - 12)); } return -1;
  },
  pickLabel(sx, sy) {
    const [wx, wy] = s2w(sx, sy); let best = null, bd = 1e9; this.core = false;
    for (const e of R.ents) {
      if (e.hidden || e.gone || !e.label || !(e.kind === 'npc' || e.kind === 'boss')) continue;
      const pos = [[e.i, e.j]].concat(e.kind === 'npc' && e._trail ? e._trail.map(t => [t[1], t[2]]) : []);
      for (const [i, j] of pos) { const d = this.labelAt(wx, wy, e, i, j); if (d >= 0 && d < bd) { bd = d; best = e; this.core = this._core; } }
    }
    return best;
  },
  inBody(sx, sy, e) { const [wx, wy] = s2w(sx, sy); const [x, y] = t2p(e.i, e.j); const b = spriteBox(e.spr, e.s); return Math.abs(wx - x) <= b.w * 0.4 && wy >= y - b.h * 0.9 - (e.lift || 0) && wy <= y; },
  qtRect() { const q = document.getElementById('qt'); const r = q && q.offsetParent && q.getBoundingClientRect(); return r && r.width ? r : null; },
};
window.Fix342 = Fix342;
{ const _pk = pickAt; pickAt = function (sx, sy) {
    const h = _pk(sx, sy);
    try { const e = Fix342.pickLabel(sx, sy); if (e && h && h.ent !== e && !(h.ent && h.ent.kind !== 'mon' && !Fix342.core && Fix342.inBody(sx, sy, h.ent))) return { ent: e }; } catch (er) { }
    return h; }; }
// ② 任务栏：window 捕获阶段先于 ux23 的 document 捕获处理
window.addEventListener('click', ev => {
  const t = ev.target; if (!t || !t.closest || !t.closest('#qt') || t.closest('.qbtn,.qauto')) return;
  if (UI.modal || !Game.G || R.mode !== 'map' || Game._busy) return;
  const e = Fix342.pickLabel(ev.clientX * R.dpr, ev.clientY * R.dpr); if (!e) return;
  ev.stopImmediatePropagation(); ev.preventDefault();
  if (typeof AUTO !== 'undefined' && AUTO.on) AUTO.stop('你接管了操作，自动已暂停');
  if (typeof Nav !== 'undefined') Nav.clear(); UX.goTo(e);
}, true);
setInterval(() => { try {
  const q = document.getElementById('qt'); if (!q) return; let under = false; const r = R.mode === 'map' && Fix342.qtRect();
  if (r) for (const e of R.ents) { if (e.hidden || !e.label || !(e.kind === 'npc' || e.kind === 'boss')) continue; const [x, y] = t2p(e.i, e.j); const b = spriteBox(e.spr, e.s); const ty = y - b.h - 6 - (e.lift || 0);
    const [a, c] = w2s(x - 90, ty - 34), [a2, c2] = w2s(x + 90, ty + 12); if (a2 / R.dpr > r.left && a / R.dpr < r.right && c2 / R.dpr > r.top && c / R.dpr < r.bottom) { under = true; break; } }
  q.classList.toggle('qt-see', under);
} catch (er) { } }, 200);
{ const st = document.createElement('style'); st.textContent = '#qt.qt-see{opacity:.4}'; document.head.appendChild(st); }

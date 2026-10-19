'use strict';
// ======================= 3.4③ 自由度层（life34）=======================
// 第 1 部分：#12 根治——NPC 屏幕重叠。
//  原因：等距投影下 (i-j) 相同的两格在屏幕同一竖列；翠花家 (12,16) 与剑仙家 (9,13) 同列、上下只差 144px，
//  翠花的头/名牌正好压在剑仙身上，点剑仙常打开翠花。
//  ①把翠花家挪到 (14,15)（同屋前空地，屏幕上与剑仙错开 3 列）；
//  ②NPC 闲逛目标若会与其他 NPC 在屏幕上叠成一列（|dx|<72 且 |dy|<230 世界 px），放弃这次闲逛。
if (typeof NPCS !== 'undefined' && NPCS.cuihua && NPCS.cuihua.at && NPCS.cuihua.at[0] === 12 && NPCS.cuihua.at[1] === 16) NPCS.cuihua.at = [14, 15];
const Life34 = {
  screenClash(e, ti, tj) {
    const [x, y] = t2p(ti + 0.5, tj + 0.5);
    for (const o of R.ents) { if (o === e || o.hidden || !(o.kind === 'npc' || o.kind === 'boss')) continue; const [ox, oy] = t2p(o.i, o.j); if (Math.abs(ox - x) < 72 && Math.abs(oy - y) < 230) return true; }
    return false;
  },
};
window.Life34 = Life34;
{ const _npcAI = npcAI; npcAI = function (e, dt) {
    const had = e.path && e.path.length; const r = _npcAI(e, dt);
    if (!had && e.path && e.path.length && !(e.talking > 0)) { const end = e.path[e.path.length - 1]; const ti = Array.isArray(end) ? end[0] : end.i, tj = Array.isArray(end) ? end[1] : end.j; if (Life34.screenClash(e, ti, tj)) e.path = []; }
    return r; }; }

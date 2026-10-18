'use strict';
// ======================= 3.3③ 天道催收令·世界首领（docs/research_v33.md §3）=======================
// 每逢 年份%3==1 的年初（过年后），讨债司派「天道催收使」降临当前地图；当年 3 次挑战，每次限 10 回合（回合制）。
// 首领血量 = REALMS[境界].need × 40（飞升后按渡劫计）；攻防 = 同境界后期标准怪 × 2.5。
// 档位（累计伤害 / 首领血量）：丙 ≥5%、乙 ≥15%、甲 ≥35%、天 = 击杀；奖励按最高档发一次（3 次用完、击杀或年末结算）。
// 讨债风云榜：8 名虚拟修士，伤害 = 血量 × [3%,30%]，种子 = 年份（同届可复现）；榜首 +2 仙缘符、前三 +1。
// 存档：G.wb33 = { y, hp, tries, dmg, best, done, killed }；G.flags.wb33_kill（称号「反向催收」）；G.inv.wb33_frag（时装碎片）。
MONS.wb33 = { n: '天道催收使', spr: 'mon_collector', el: '金', hp: 1, atk: 1, def: 1, spd: 1.1, sk: ['atk', 'zhangdan'], boss: 1, drop: [] };
ITEMS.wb33_frag = { n: '讨债司制服碎片', ic: 'tal_r', t: 'mat', p: 0, d: '击杀天道催收使所得。集齐 5 片可换时装「讨债司制服」（兑换将在后续版本开放）。' };
if (typeof TITLES !== 'undefined') TITLES.push({ id: 'fanxiang', n: '反向催收', d: '击杀天道催收使（攻击+4%）', ok: G => !!(G.flags && G.flags.wb33_kill), fx: { atk: 0.04 } });
const WB_RIVALS = ['龙傲天', '冷月仙子', '萧逸', '钱多多', '算无遗', '敖小白', '阴三娘', '逍遥散人'];
const WB33 = {
  TIERS: [['天', 1], ['甲', 0.35], ['乙', 0.15], ['丙', 0.05]],
  realmIdx() { return Math.min(6, Game.G.realm); },
  bossHp() { return Math.round(REALMS[this.realmIdx()].need * 40); },
  need() { return REALMS[this.realmIdx()].need; },
  active() { const G = Game.G; return !!(G && G.wb33 && G.wb33.y === G.year && !G.wb33.done && G.flags && G.flags.awakened); },
  tierOf(w) { if (w.killed) return '天'; const p = w.dmg / w.hp; for (const [t, r] of this.TIERS) if (t !== '天' && p >= r) return t; return null; },
  seeded(y) { let s = (y * 2654435761) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; },
  board(w) { const rng = this.seeded(w.y); const rows = WB_RIVALS.map(n => [n, Math.round(w.hp * (0.03 + rng() * 0.27))]); rows.push([Game.G.name + '（你）', w.dmg, 1]); rows.sort((a, b) => b[1] - a[1]); return rows; },
  rank(w) { return this.board(w).findIndex(r => r[2]) + 1; },
  spawn(force) {
    const G = Game.G; if (!G || !G.flags || !G.flags.awakened) return false;
    if (!force && G.year % 3 !== 1) return false;
    if (G.wb33 && G.wb33.y === G.year) return false;
    G.wb33 = { y: G.year, hp: this.bossHp(), tries: 3, dmg: 0, best: null, done: false, killed: false };
    UI.card('天道催收令', `讨债司发来公文：\n「兹派天道催收使一名，于本年度巡回催收。各位修士可自愿“协助对账”，按出力多少发放奖励。」\n\n首领气血 ${fmt(G.wb33.hp)}，今年有 3 次挑战机会，每次限 10 回合。\n首领就在本图，头顶有「催收令」标记，点它即可前往。`, 'mon_collector', ['知道了']);
    this.mark(); Game.save(); return true;
  },
  mark() {
    if (!R.marks || R.mode !== 'map' || !R.mapId) return; R.marks = R.marks.filter(m => m.act !== 'wb33'); if (!this.active()) return;
    const info = MAPINFO[R.mapId]; const P = R.player; const ci = Math.floor(P ? P.i : info.start[0]), cj = Math.floor(P ? P.j : info.start[1]);
    // 选离 NPC/交互点最远的可走格（距主角 3–6 格），避免名牌和别人叠在一起点错
    let best = null, bs = -1; const others = [...R.ents.filter(e => e.kind === 'npc' || e.kind === 'boss').map(e => [e.i, e.j]), ...R.marks.map(m => [m.i + 0.5, m.j + 0.5])];
    for (let di = -6; di <= 6; di++) for (let dj = -6; dj <= 6; dj++) { const d = Math.hypot(di, dj); if (d < 3 || d > 6) continue; const a = ci + di, b = cj + dj; if (!walkable(a, b)) continue; const sc = Math.min(4, ...others.map(([x, y]) => Math.hypot(x - a - 0.5, y - b - 0.5))) - d * 0.05; if (sc > bs) { bs = sc; best = [a, b]; } }
    const [i, j] = best || nearestWalk(ci + 3, cj - 2);
    R.marks.push({ i, j, label: '催收令·天道催收使', act: 'wb33', key: 'wb33', h: 160, c: '#ff8a5a' });
  },
  async challenge() {
    const G = Game.G; const w = G.wb33; if (!this.active()) { UI.toast('催收使已经离开了'); this.mark(); return; }
    const c = await UI.card('天道催收使', `“协助对账？好啊。你打出多少，我记多少。”\n\n剩余挑战 ${w.tries}/3 · 累计伤害 ${fmt(w.dmg)}（${(w.dmg / w.hp * 100).toFixed(1)}%）`, 'mon_collector', ['应战（限 10 回合）', '先撤']);
    if (c !== 0) return;
    const tier = this.realmIdx() + 0.5; const u = monUnit('wb33', tier); const rem = Math.max(1, w.hp - w.dmg);
    u.mhp = w.hp; u.hp = rem; u.atk *= 2.5; u.def *= 2.5; u.name = '天道催收使'; u.boss = true;
    w.tries--; this.fighting = true; let r;
    try { r = await Game._startBattle([u], { boss: true, solo: true, noflee: true, wb33: 1 }); } finally { this.fighting = false; R.onTap = (x, y) => Game.onTap(x, y); }
    const end = r && r.units ? r.units.find(x => x.mon === 'wb33') : u; const hit = Math.max(0, Math.round(rem - Math.max(0, end.hp)));
    w.dmg += hit; if (end.hp <= 0 || !end.alive) { w.killed = true; w.dmg = w.hp; }
    const t = this.tierOf(w); w.best = t; const rk = this.rank(w);
    await UI.card(w.killed ? '催收使被反向催收了！' : '对账结算', `本次伤害 ${fmt(hit)}\n累计伤害 ${fmt(w.dmg)}（${(w.dmg / w.hp * 100).toFixed(1)}%）\n当前档位：${t || '未入档（需 ≥5%）'}\n讨债风云榜：第 ${rk} 名\n剩余挑战 ${w.tries}/3${w.tries > 0 && !w.killed ? '\n（奖励在 3 次用完或击杀后按最高档发放一次）' : ''}`, 'mon_collector', ['查看风云榜', '好']).then(k => k === 0 ? this.showBoard() : null);
    if (w.killed || w.tries <= 0) await this.settle();
    this.mark(); Game.save(); UI.hud();
  },
  async showBoard() { const G = Game.G, w = G.wb33; if (!w) return; await UI.card('讨债风云榜 · 第 ' + w.y + ' 年', this.board(w).map((r, k) => `${k + 1}. ${r[0]}  ${fmt(r[1])}`).join('\n'), 'i:scroll', ['好']); },
  async settle() {
    const G = Game.G, w = G.wb33; if (!w || w.done) return; w.done = true; const t = this.tierOf(w); const need = this.need(); const got = [];
    const give = (k, n, label) => { if (n <= 0) return; if (k === 'stone') G.stone += n; else Game.give(k, n); got.push(`${label}×${fmt(n)}`); };
    if (t === '丙') { give('stone', Math.round(need * 0.5), '灵石'); give('xyf', 1, '仙缘符'); }
    if (t === '乙') { give('stone', Math.round(need * 1.2), '灵石'); give('xyf', 2, '仙缘符'); give('ore', 3, '玄铁晶'); }
    if (t === '甲' || t === '天') { give('stone', Math.round(need * 2.5), '灵石'); give('xyf', 3, '仙缘符'); give('yd', 3, '妖丹'); }
    if (t === '天') { G.flags.wb33_kill = 1; give('wb33_frag', 1, '讨债司制服碎片'); got.push('称号「反向催收」'); }
    const rk = this.rank(w); if (t) { if (rk === 1) give('xyf', 2, '榜首仙缘符'); else if (rk <= 3) give('xyf', 1, '前三仙缘符'); }
    await UI.card('催收令结算', `最终档位：${t || '未入档'} · 风云榜第 ${rk} 名\n${got.length ? '获得：' + got.join('、') : '没有达到 5%，这次什么也没拿到。'}`, 'i:scroll', ['收下']);
    Game.save();
  },
};
(function () {
  Acts.wb33 = async () => WB33.challenge();
  const _mm = Game.makeMarks; Game.makeMarks = function () { const r = _mm.apply(this, arguments); try { WB33.mark(); } catch (e) { } return r; };
  const _ye = Game.yearEnd; Game.yearEnd = async function () {
    const G = this.G; const y0 = G && G.year; const r = await _ye.apply(this, arguments);
    if (G && !G.dead && G.year !== y0) { if (G.wb33 && G.wb33.y !== G.year && !G.wb33.done) { if (G.wb33.dmg > 0) await WB33.settle(); else G.wb33.done = true; } WB33.spawn(); WB33.mark(); }
    return r;
  };
  // 回合上限：第 11 回合轮到主角时结束
  const _bc = UI.battleChoose; UI.battleChoose = function (P) { if (WB33.fighting && B.round > 10) { UI.toast('10 回合到，催收使收工了'); endBattle('timeup'); return Promise.resolve(null); } return _bc.apply(this, arguments); };
  const _ai = chooseAI; chooseAI = function (u) { if (WB33.fighting && u && u.isPlayer && B.round > 10 && B.on) { UI.toast('10 回合到，催收使收工了'); endBattle('timeup'); return null; } return _ai.apply(this, arguments); };
  // 开发者面板·调试：立即降临催收使
  const _pd = UI.p_dev; UI.p_dev = function (b, re, close, tab) {
    const r = _pd.apply(this, arguments);
    if ((tab || DEV.tab) === 'dbg') { const d = h('div', 'devg', '<button class="opt" data-a33="wb">立即降临催收使</button><button class="opt" data-a33="fb9">本命法宝 9 阶·好感 100</button><button class="opt" data-a33="day">日课：跳到明日 05:00</button>'); b.appendChild(d);
      d.addEventListener('click', e => { const t = e.target.closest('[data-a33]'); if (!t) return; e.stopPropagation(); const G = Game.G; G.dev = 1;
        if (t.dataset.a33 === 'wb') { if (G.wb33 && G.wb33.y === G.year) G.wb33 = null; G.flags.awakened = 1; close && close(); setTimeout(() => WB33.spawn(true), 250); }
        if (t.dataset.a33 === 'fb9') { G.fb33 = { id: (G.fb33 && G.fb33.id) || 'fb_jian', tier: 9, spent: 0, aff: 100, wipe: 0 }; UI.toast('本命法宝已设为 9 阶、好感 100'); }
        if (t.dataset.a33 === 'day' && typeof DAILY33 !== 'undefined') { DAILY33.devSkip(); UI.toast('日课已跳到明日 05:00'); }
        Game.save(); }); }
    return r;
  };
})();

'use strict';
// ======================= 3.3⑥ 万象图鉴（docs/research_v33.md §6）=======================
// 怪物（击败 1 次）、NPC（对话 1 次）、灵兽（获得）、法宝（炼成本命）、时装（拥有）各一类；每类收集度 25/50/75/100% → 全属性 +1/2/3/5%。
// 套组奖励只发一次。老存档按击杀/好感/灵兽/时装记录补点亮（A6.2）。存档：G.tj33 = { m, n, p, f, sets }。
const TJ_SETS = [
  { id: 'taohua', n: '桃花村众', cat: 'n', ids: ['mom', 'farmer', 'cuihua', 'villager', 'luren', 'mentor'], rw: [['xyf', 1]] },
  { id: 'cuizhai', n: '讨债司全员', cat: 'm', ids: ['collector', 'debt_slime', 'wb33'], rw: [['xyf', 2]], title: '老赖认证' },
  { id: 'tianbing', n: '天兵天将', cat: 'm', ids: ['tianbing', 'paper'], rw: [['xyf', 3]] },
];
const TJ33 = {
  CATS: [['m', '怪物'], ['n', 'NPC'], ['p', '灵兽'], ['f', '法宝'], ['c', '时装']],
  all(cat) {
    if (cat === 'm') return Object.keys(MONS).filter(k => !MONS[k].boss || k === 'wb33');
    if (cat === 'n') return Object.keys(NPCS);
    if (cat === 'p') return Object.keys(PET_SKILL).filter(k => MONS[k]);
    if (cat === 'f') return typeof FABAO !== 'undefined' ? Object.keys(FABAO) : [];
    if (cat === 'c') return typeof COSTUMES !== 'undefined' ? Object.keys(COSTUMES) : [];
    return [];
  },
  st(G) { G = G || Game.G; if (!G) return null; if (!G.tj33) G.tj33 = { m: {}, n: {}, p: {}, f: {}, sets: {} }; return G.tj33; },
  backfill(G) { const T = this.st(G); for (const k in G.kills || {}) T.m[k] = 1; for (const k in G.aff || {}) if (NPCS[k]) T.n[k] = 1; for (const p of G.pets || []) T.p[p.mon] = 1; if (G.fb33 && G.fb33.id) T.f[G.fb33.id] = 1; },
  got(cat) { const G = Game.G; const T = this.st(G); if (cat === 'c') { const own = (Game.meta && Game.meta.cos) || {}; return this.all('c').filter(k => own[k]).length; } return this.all(cat).filter(k => T[cat][k]).length; },
  pct(cat) { const n = this.all(cat).length; return n ? this.got(cat) / n : 0; },
  bonusOf(p) { return p >= 1 ? 0.05 : p >= 0.75 ? 0.03 : p >= 0.5 ? 0.02 : p >= 0.25 ? 0.01 : 0; },
  bonus() { if (!Game.G) return 0; return this.CATS.reduce((a, [c]) => a + this.bonusOf(this.pct(c)), 0); },
  light(cat, id) { const G = Game.G; if (!G || !id) return; const T = this.st(G); if (T[cat][id]) return; T[cat][id] = 1; const nm = cat === 'm' ? (MONS[id] || {}).n : cat === 'n' ? (NPCS[id] || {}).n : cat === 'p' ? (MONS[id] || {}).n : id; UI.toast(`图鉴点亮：${nm || id}`, '#b8e0ff'); this.checkSets(); },
  checkSets() { const G = Game.G; const T = this.st(G); for (const S of TJ_SETS) { if (T.sets[S.id]) continue; if (S.ids.every(id => T[S.cat][id])) { T.sets[S.id] = 1; for (const [k, n] of S.rw) Game.give(k, n); if (S.title) { G.flags.tj33_title = 1; } UI.toast(`图鉴套组「${S.n}」完成：仙缘符 +${S.rw[0][1]}${S.title ? '，称号「' + S.title + '」' : ''}`, '#ffc84a'); } } },
};
if (typeof TITLES !== 'undefined') TITLES.push({ id: 'laolai', n: '老赖认证', d: '图鉴套组「讨债司全员」（防御+3%）', ok: G => !!(G.flags && G.flags.tj33_title), fx: { def: 0.03 } });
(function () {
  UI.titles.tj33 = '万象图鉴';
  UI.p_tj33 = function (b) {
    const G = Game.G; const T = TJ33.st(G);
    b.innerHTML = `<p class="hint">收集度每类 25/50/75/100% → 全属性 +1/2/3/5%。当前图鉴总加成：+${Math.round(TJ33.bonus() * 100)}%</p>` + TJ33.CATS.map(([c, n]) => {
      const all = TJ33.all(c); const own = c === 'c' ? ((Game.meta && Game.meta.cos) || {}) : T[c];
      const nm = k => c === 'm' || c === 'p' ? (MONS[k] || {}).n : c === 'n' ? (NPCS[k] || {}).n : c === 'f' ? FABAO[k].n : (COSTUMES[k] || {}).n || k;
      return `<div class="tj33c"><b>${n} ${TJ33.got(c)}/${all.length}（+${Math.round(TJ33.bonusOf(TJ33.pct(c)) * 100)}%）</b><div class="tj33l">${all.map(k => `<span class="${own[k] ? 'on' : ''}">${own[k] ? esc(nm(k) || k) : '？？？'}</span>`).join('')}</div></div>`;
    }).join('') + `<div class="tj33c"><b>套组</b>${TJ_SETS.map(S => `<div>${T.sets[S.id] ? '✔' : '·'} ${S.n}（${S.ids.filter(id => T[S.cat][id]).length}/${S.ids.length}）</div>`).join('')}</div>`;
  };
  const _more = UI.p_more; UI.p_more = function (b, re, close) { _more.apply(this, arguments); const g = b.querySelector('.grid3'); if (g && !g.querySelector('[data-k="tj33"]')) { const x = h('button', 'big2', `<i style="${iconCss('book_o', 48)}"></i>万象图鉴`); x.dataset.k = 'tj33'; g.appendChild(x); } };
  const _st = Game.stats; Game.stats = function () { const s = _st.apply(this, arguments); const k = 1 + TJ33.bonus(); if (k > 1) { s.mhp = Math.round(s.mhp * k); s.mmp = Math.round(s.mmp * k); s.atk *= k; s.def *= k; s.spd *= k; } return s; };
  const _f = Game.fight; Game.fight = async function () { const G = this.G; const k0 = G ? Object.assign({}, G.kills) : {}; const r = await _f.apply(this, arguments); if (G) for (const k in G.kills) if (!k0[k]) TJ33.light('m', k); return r; };
  const _ie = Game.interactEnt; Game.interactEnt = function (e) { const r = _ie.apply(this, arguments); try { if (e && e.kind === 'npc' && NPCS[e.id]) TJ33.light('n', e.id); } catch (er) { } return r; };
  const _ap = Game.addPet; Game.addPet = function (mon) { const r = _ap.apply(this, arguments); try { TJ33.light('p', mon); } catch (e) { } return r; };
  const _em = Game.enterMap; Game.enterMap = async function () { const r = await _em.apply(this, arguments); try { const G = this.G; if (G && !G.tj33) TJ33.backfill(G); else if (G && G.fb33 && G.fb33.id) TJ33.st(G).f[G.fb33.id] = 1; } catch (e) { } return r; };
  const _pc = UI.p_char; UI.p_char = function (b) { const r = _pc.apply(this, arguments); if (Game.G) b.appendChild(h('div', 'mg33row', `<b>万象图鉴</b><small>收集度加成：全属性 +${Math.round(TJ33.bonus() * 100)}%</small>`)); return r; };
  const css = document.createElement('style'); css.textContent = `.tj33c{margin:8px 0}.tj33c>b{display:block;margin-bottom:4px}.tj33l{display:flex;flex-wrap:wrap;gap:4px}.tj33l span{font-size:12px;padding:2px 6px;border-radius:6px;background:rgba(0,0,0,.25);opacity:.55}.tj33l span.on{opacity:1;background:rgba(120,200,255,.25)}`; document.head.appendChild(css);
})();

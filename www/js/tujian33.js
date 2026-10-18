'use strict';
// ======================= 3.3⑥ 万象图鉴（docs/research_v33.md §6）=======================
// 怪物（击败 1 次）、NPC（对话 1 次）、灵兽（获得）、法宝（炼成本命）、时装（拥有）各一类；每类收集度 25/50/75/100% → 全属性 +1/2/3/5%。
// 套组奖励只发一次。老存档按击杀/好感/灵兽/时装记录补点亮（A6.2）。存档：G.tj33 = { m, n, p, f, sets }。
// 按 research_v33 §6 首批 6 组（#9）。条目写成 "类:id"；f:ling_suan = 本命天机算盘到 6 阶诞生的「账房先生」器灵。
// 规格里的「天将」暂无独立 NPC，用斗法里的天兵（怪物 tianbing）代替；「洛水」无对应地图，用云来坊市套组代替（见 #9）。
const TJ_SETS = [
  { id: 'longgong', n: '东海龙宫众', ids: ['n:taizi', 'n:xiabing', 'n:aoxiao', 'n:guichengxiang'], rw: [['wb33_frag', 2]] },
  { id: 'tianbing', n: '天兵天将', ids: ['n:tianbing', 'm:tianbing', 'n:guanghan', 'n:xiaoyao'], rw: [['xyf', 3]] },
  { id: 'cuizhai', n: '讨债司全员', ids: ['m:wb33', 'f:ling_suan', 'n:zhuiming', 'n:judge'], rw: [], title: '老赖认证' },
  { id: 'taohua', n: '桃花村', ids: ['n:mom', 'n:farmer', 'n:cuihua', 'n:villager', 'n:luren', 'n:mentor', 'n:yuelao'], rw: [['xyf', 1]] },
  { id: 'market', n: '云来坊市', ids: ['n:merchant', 'n:caishen', 'n:bailang', 'n:ruyan', 'n:yaopu', 'n:shuoshu', 'n:xiaoyao'], rw: [['xyf', 1]] },
  { id: 'xianjie', n: '仙界', ids: ['n:xianguan', 'n:mentor2', 'n:judge', 'n:guolucai'], rw: [['xyf', 1]] },
];
const TJ_CAT_TITLE = { m: '百妖通鉴', n: '众生通鉴', p: '灵兽通鉴', f: '法宝通鉴', c: '霓裳通鉴' };
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
  backfill(G) { const T = this.st(G); for (const k in G.kills || {}) T.m[k] = 1; for (const k in G.aff || {}) if (NPCS[k]) T.n[k] = 1; for (const p of G.pets || []) T.p[p.mon] = 1; if (G.fb33 && G.fb33.id) T.f[G.fb33.id] = 1; if (G.fb33 && G.fb33.id === 'fb_suan' && G.fb33.tier >= 6) T.f.ling_suan = 1; if (G.flags && G.flags.wb33_kill) T.m.wb33 = 1; },
  got(cat) { const G = Game.G; const T = this.st(G); if (cat === 'c') { const own = (Game.meta && Game.meta.cos) || {}; return this.all('c').filter(k => own[k]).length; } return this.all(cat).filter(k => T[cat][k]).length; },
  pct(cat) { const n = this.all(cat).length; return n ? this.got(cat) / n : 0; },
  bonusOf(p) { return p >= 1 ? 0.05 : p >= 0.75 ? 0.03 : p >= 0.5 ? 0.02 : p >= 0.25 ? 0.01 : 0; },
  bonus() { if (!Game.G) return 0; return this.CATS.reduce((a, [c]) => a + this.bonusOf(this.pct(c)), 0); },
  light(cat, id) { const G = Game.G; if (!G || !id) return; const T = this.st(G); if (T[cat][id]) return; T[cat][id] = 1; const nm = cat === 'm' ? (MONS[id] || {}).n : cat === 'n' ? (NPCS[id] || {}).n : cat === 'p' ? (MONS[id] || {}).n : id; UI.toast(`图鉴点亮：${nm || id}`, '#b8e0ff'); this.checkSets(); this.checkCats(); },
  has(x) { const [c, id] = x.split(':'); const T = this.st(); return !!(T[c] && T[c][id]); },
  checkCats() { const G = Game.G; G.flags = G.flags || {}; for (const [c] of this.CATS) if (this.pct(c) >= 1 && !G.flags['tj33_all_' + c]) { G.flags['tj33_all_' + c] = 1; UI.toast(`图鉴：${TJ_CAT_TITLE[c]}！获得称号「${TJ_CAT_TITLE[c]}」`, '#ffc84a'); } },
  checkSets() { const G = Game.G; const T = this.st(G); for (const S of TJ_SETS) { if (T.sets[S.id]) continue; if (S.ids.every(x => this.has(x))) { T.sets[S.id] = 1; for (const [k, n] of S.rw) Game.give(k, n); if (S.title) { G.flags.tj33_title = 1; } UI.toast(`图鉴套组「${S.n}」完成：${S.rw.map(([k, n]) => (ITEMS[k] || { n: k }).n + '×' + n).concat(S.title ? ['称号「' + S.title + '」'] : []).join('、')}`, '#ffc84a'); } } },
};
if (typeof TITLES !== 'undefined') { TITLES.push({ id: 'laolai', n: '老赖认证', d: '图鉴套组「讨债司全员」（防御+3%）', ok: G => !!(G.flags && G.flags.tj33_title), fx: { def: 0.03 } }); for (const c in TJ_CAT_TITLE) TITLES.push({ id: 'tj33_' + c, n: TJ_CAT_TITLE[c], d: `万象图鉴该类收集 100%`, ok: G => !!(G.flags && G.flags['tj33_all_' + c]), fx: {} }); }
(function () {
  UI.titles.tj33 = '万象图鉴';
  UI.p_tj33 = function (b) {
    const G = Game.G; const T = TJ33.st(G);
    b.innerHTML = `<p class="hint">收集度每类 25/50/75/100% → 全属性 +1/2/3/5%。当前图鉴总加成：+${Math.round(TJ33.bonus() * 100)}%</p>` + TJ33.CATS.map(([c, n]) => {
      const all = TJ33.all(c); const own = c === 'c' ? ((Game.meta && Game.meta.cos) || {}) : T[c];
      const nm = k => c === 'm' || c === 'p' ? (MONS[k] || {}).n : c === 'n' ? (NPCS[k] || {}).n : c === 'f' ? FABAO[k].n : (COSTUMES[k] || {}).n || k;
      return `<div class="tj33c"><b>${n} ${TJ33.got(c)}/${all.length}（+${Math.round(TJ33.bonusOf(TJ33.pct(c)) * 100)}%）</b><div class="tj33l">${all.map(k => `<span class="${own[k] ? 'on' : ''}">${own[k] ? esc(nm(k) || k) : '？？？'}</span>`).join('')}</div></div>`;
    }).join('') + `<div class="tj33c"><b>套组</b>${TJ_SETS.map(S => `<div>${T.sets[S.id] ? '✔' : '·'} ${S.n}（${S.ids.filter(x => TJ33.has(x)).length}/${S.ids.length}）</div>`).join('')}</div>`;
  };
  const _more = UI.p_more; UI.p_more = function (b, re, close) { _more.apply(this, arguments); const g = b.querySelector('.grid3'); if (g && !g.querySelector('[data-k="tj33"]')) { const x = h('button', 'big2', `<i style="${iconCss('book_o', 48)}"></i>万象图鉴`); x.dataset.k = 'tj33'; g.appendChild(x); } };
  const _st = Game.stats; Game.stats = function () { const s = _st.apply(this, arguments); const k = 1 + TJ33.bonus(); if (k > 1) { s.mhp = Math.round(s.mhp * k); s.mmp = Math.round(s.mmp * k); s.atk *= k; s.def *= k; s.spd *= k; } return s; };
  const _f = Game.fight; Game.fight = async function () { const G = this.G; const k0 = G ? Object.assign({}, G.kills) : {}; const r = await _f.apply(this, arguments); if (G) for (const k in G.kills) if (!k0[k]) TJ33.light('m', k); return r; };
  const _ie = Game.interactEnt; Game.interactEnt = function (e) { const r = _ie.apply(this, arguments); try { if (e && e.kind === 'npc' && NPCS[e.id]) TJ33.light('n', e.id); } catch (er) { } return r; };
  const _ap = Game.addPet; Game.addPet = function (mon) { const r = _ap.apply(this, arguments); try { TJ33.light('p', mon); } catch (e) { } return r; };
  setInterval(() => { try { const G = Game.G; if (G && G.fb33 && G.fb33.id === 'fb_suan' && G.fb33.tier >= 6 && !TJ33.st(G).f.ling_suan) { TJ33.st(G).f.ling_suan = 1; TJ33.checkSets(); } } catch (e) { } }, 2000);
  const _em = Game.enterMap; Game.enterMap = async function () { const r = await _em.apply(this, arguments); try { const G = this.G; if (G && !G.tj33) TJ33.backfill(G); else if (G && G.fb33 && G.fb33.id) TJ33.st(G).f[G.fb33.id] = 1; if (G && G.flags && G.flags.wb33_kill && !TJ33.st(G).m.wb33) { TJ33.st(G).m.wb33 = 1; TJ33.checkSets(); } } catch (e) { } return r; };
  const _pc = UI.p_char; UI.p_char = function (b) { const r = _pc.apply(this, arguments); if (Game.G) b.appendChild(h('div', 'mg33row', `<b>万象图鉴</b><small>收集度加成：全属性 +${Math.round(TJ33.bonus() * 100)}%</small>`)); return r; };
  const css = document.createElement('style'); css.textContent = `.tj33c{margin:8px 0}.tj33c>b{display:block;margin-bottom:4px}.tj33l{display:flex;flex-wrap:wrap;gap:4px}.tj33l span{font-size:12px;padding:2px 6px;border-radius:6px;background:rgba(0,0,0,.25);opacity:.55}.tj33l span.on{opacity:1;background:rgba(120,200,255,.25)}`; document.head.appendChild(css);
})();

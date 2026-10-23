'use strict';
// ======================= 3.6 灵根深化（docs/research_v36.md §3）=======================
// 惯例：只包裹/赋值接入，不动 game.js / talk.js / data.js；存档 G.lg36 惰性兜底，不升 G.v；G.lg 不动。
// ① 元素亲和：灵根 el 中每个元素，对应属性技能（SKILLS[k].el，data.js 已有字段）伤害 +24%/元素数；雷/冰（异灵根）再 +6%。
//    只作用于玩家本人的非普攻技能（calcDmg 包装，回合制 battle.js 与即时战 rt27 共用 calcDmg）；普攻、灵兽、伙伴不吃。
// ② 突破修正：brk' = clamp(REALMS[r].brk + Δ, 0.1, 0.95)，Δ 见 BRK；写进 G.tmpBrk（原版 _tryBreak 读完即清零），所以「冲击瓶颈」卡片显示的成功率自动包含。
// ③ 纯度 G.lg36.pur（0–100，老档 50）：cultMult 最终 ×(0.9 + pur/500)。来源：打坐 +1（每游戏月最多 1 次，此来源上限 70）、灵根丹 +5、心魔幻境小成及以上 +3（xinmo34 已合入时）。
// ④ 洗灵根：洗髓丹（原有，向上一档）追加纯度 −20；逆脉洗根（5000 灵石 + 寿元上限 10%，按 LINGGEN 权重重随，纯度不变）；
//    定向淬根（天材地宝×3 + 8000 灵石，增/删 1 个五行元素，档位按元素数重算：0 无 / 1 天 / 2 双 / 3 三 / 4 四 / 5 五行伪；异灵根不可淬）。
//    淬根后的元素存 G.lg36.el（仅当 G.lg36.elFor === G.lg 时生效；灵根被其他途径改变即自动失效 → 回到 LINGGEN 原值）。
// 入口：角色面板「灵根」一栏（纯度条、亲和、突破修正、两个按钮，均二次确认）。开发者面板 Tab「灵根36」。
const LG36 = {
  BRK: { none: 0.05, wu: 0, si: 0, san: 0, shuang: -0.02, tian: -0.04, lei: -0.05, bing: -0.05 },
  WU: ['金', '木', '水', '火', '土'],
  NIMAI_STONE: 5000, NIMAI_LIFE: 0.1, CUI_STONE: 8000, CUI_ITEM: 'tcdb', CUI_N: 3,
  MED_CAP: 70, LINES: {
    pur: '静坐一日，灵根干净了一点点，心里的债没少。',
    nimai: '洗是洗了，洗成什么样，天道说了算。',
    lei: '天劫：老乡，这次我下手轻点？',
  },
  off: false, // 单测对照用：true 时全部按 LINGGEN 原值运行
  st(G) { G = G || (Game && Game.G); if (!G) return null; if (!G.lg36 || typeof G.lg36 !== 'object') G.lg36 = { pur: 50, extraEl: [] }; const s = G.lg36; if (!Number.isFinite(s.pur)) s.pur = 50; if (!Array.isArray(s.extraEl)) s.extraEl = []; return s; },
  pur(G) { const s = this.st(G); return s ? Math.max(0, Math.min(100, s.pur)) : 50; },
  addPur(n, G) { const s = this.st(G); if (!s) return 0; const p0 = s.pur; s.pur = Math.max(0, Math.min(100, Math.round((s.pur + n) * 10) / 10)); return s.pur - p0; },
  base(G) { G = G || Game.G; return LINGGEN.find(l => l.id === (G && G.lg)) || LINGGEN[1]; },
  els(G) { G = G || Game.G; const L = this.base(G); const s = G && G.lg36; if (!this.off && s && Array.isArray(s.el) && s.elFor === G.lg) return s.el.slice(); return L.el.slice(); },
  aff(el, G) { if (this.off || !el) return 0; const E = this.els(G); if (!E.length || !E.includes(el)) return 0; return 0.24 / E.length + (el === '雷' || el === '冰' ? 0.06 : 0); },
  brkD(r, G) { G = G || Game.G; if (this.off || !G || !REALMS[r] || r >= 6) return 0; const b = REALMS[r].brk; const d = this.BRK[G.lg] || 0; return Math.max(0.1, Math.min(0.95, b + d)) - b; },
  purMul(G) { return this.off ? 1 : 0.9 + this.pur(G) / 500; },
  tierFor(E) { const n = E.length; if (!n) return 'none'; if (n === 1) return E[0] === '雷' ? 'lei' : E[0] === '冰' ? 'bing' : 'tian'; return ['', '', 'shuang', 'san', 'si', 'wu'][Math.min(5, n)]; },
  roll(rng) { rng = rng || Math.random; const ws = LINGGEN.map(l => l.w); let r = rng() * ws.reduce((a, b) => a + b); for (let k = 0; k < ws.length; k++) { r -= ws[k]; if (r < 0) return LINGGEN[k].id; } return LINGGEN[LINGGEN.length - 1].id; },
  setLg(G, id, el) { G.lg = id; const s = this.st(G); if (el) { s.el = el.slice(); s.elFor = id; const B = (LINGGEN.find(l => l.id === id) || {}).el || []; s.extraEl = el.filter(x => !B.includes(x)); } else { delete s.el; delete s.elFor; s.extraEl = []; } },
  nimaiCost(G) { G = G || Game.G; return { stone: this.NIMAI_STONE, life: Math.max(1, Math.round(Game.lifeMax() * this.NIMAI_LIFE)) }; },
  nimaiCheck(G) { G = G || Game.G; const c = this.nimaiCost(G); if (!G.flags.awakened) return '灵根尚未觉醒'; if (G.stone < c.stone) return `灵石不够（需 ${c.stone}）`; if (Game.lifeMax() - c.life <= G.age + 1) return '寿元不足，再洗就要洗进轮回殿了'; return ''; },
  // 只做结果（单测 / UI 共用）；扣费在 nimai()
  nimaiApply(G, rng) { G = G || Game.G; const id = this.roll(rng); this.setLg(G, id, null); return id; },
  cuiCheck(G) { G = G || Game.G; if (!G.flags.awakened) return '灵根尚未觉醒'; if (G.lg === 'lei' || G.lg === 'bing') return '异灵根天生地养，淬不动'; if ((G.inv[this.CUI_ITEM] || 0) < this.CUI_N) return `天材地宝不够（需 ${this.CUI_N}）`; if (G.stone < this.CUI_STONE) return `灵石不够（需 ${this.CUI_STONE}）`; return ''; },
  cuiApply(G, op, el) { G = G || Game.G; let E = this.els(G); if (op === 'add') { if (E.includes(el) || !this.WU.includes(el) || E.length >= 5) return null; E.push(el); } else { if (!E.includes(el) || E.length <= 1) return null; E = E.filter(x => x !== el); } E = this.WU.filter(x => E.includes(x)); const id = this.tierFor(E); const B = LINGGEN.find(l => l.id === id).el; const same = B.length === E.length && B.every(x => E.includes(x)); this.setLg(G, id, same ? null : E); return id; },
  async nimai() {
    const G = Game.G; const why = this.nimaiCheck(G); if (why) { UI.toast(why); return false; }
    const c = this.nimaiCost(G);
    const k = await UI.card('逆脉洗根', `逆转经脉，把灵根打散重来。\n消耗：灵石 ${c.stone}、寿元上限 −${c.life} 年。\n结果按天生概率重新随机——可能更好，也可能更差。纯度不变。`, 'i:sk_light', ['逆脉！', '算了']);
    if (k !== 0 || this.nimaiCheck(G)) return false;
    const from = this.base(G).n; G.stone -= c.stone; G.lifeBonus = (G.lifeBonus || 0) - c.life; const id = this.nimaiApply(G); const L = LINGGEN.find(l => l.id === id);
    Game.log(`逆脉洗根：${from} → ${L.n}（寿元上限 −${c.life}）。`); Sfx.play && Sfx.play('magic');
    UI.toast(this.LINES.nimai, '#ffd23a'); await UI.card('洗根结果', `${from} → 【${L.n}】\n修炼速度 ×${L.mult}\n${L.d}`, 'i:sk_light', ['好']);
    UI.hud && UI.hud(); Game.save && Game.save(); return id;
  },
  async cui() {
    const G = Game.G; const why = this.cuiCheck(G); if (why) { UI.toast(why); return false; }
    const E = this.els(G); const add = this.WU.filter(x => !E.includes(x)), rm = E.length > 1 ? E : [];
    const opts = [...add.map(x => '淬入 ' + x), ...rm.map(x => '剔除 ' + x), '算了'];
    const k = await UI.card('定向淬根', `以天材地宝×${this.CUI_N} + 灵石 ${this.CUI_STONE} 淬炼灵根：增或删一个五行元素，档位按元素数重算（元素越少越精纯，修炼越快；越多越杂，亲和越平均）。\n当前：${E.join('') || '无'}`, 'i:lingzhi', opts);
    if (k < 0 || k >= opts.length - 1 || this.cuiCheck(G)) return false;
    const op = k < add.length ? 'add' : 'rm', el = op === 'add' ? add[k] : rm[k - add.length];
    const after = op === 'add' ? this.WU.filter(x => E.includes(x) || x === el) : E.filter(x => x !== el); const nid = this.tierFor(after), NL = LINGGEN.find(l => l.id === nid);
    const ok = await UI.card('确认淬根', `${op === 'add' ? '淬入' : '剔除'}【${el}】后：${after.join('')}（${NL.n}，修炼 ×${NL.mult}）。\n确定吗？`, 'i:lingzhi', ['淬！', '算了']);
    if (ok !== 0 || this.cuiCheck(G)) return false;
    G.stone -= this.CUI_STONE; Game.take(this.CUI_ITEM, this.CUI_N); const from = this.base(G).n; const id = this.cuiApply(G, op, el);
    Game.log(`定向淬根：${op === 'add' ? '淬入' : '剔除'}${el}，${from} → ${LINGGEN.find(l => l.id === id).n}。`); Sfx.play && Sfx.play('magic');
    UI.toast(`淬根成功：${this.els(G).join('')}（${LINGGEN.find(l => l.id === id).n}）`, '#ffd23a'); UI.hud && UI.hud(); Game.save && Game.save(); return id;
  },
  rowHtml(G) {
    const L = Game.linggen(), E = this.els(G), p = this.pur(G), dB = this.BRK[G.lg] || 0;
    const aff = E.length ? E.map(x => `<span style="color:${ELEM[x] || '#fff'}">${x}系+${Math.round(this.aff(x, G) * 1000) / 10}%</span>`).join('') : '<span>无（技能不吃亲和）</span>';
    const nc = this.nimaiCost(G);
    return `<b>灵根 · ${esc(L.n)}</b><div class="lg36bar"><i style="width:${p}%"></i><em>纯度 ${Math.round(p)}/100</em></div>
      <small>修炼 ×${L.mult} × 纯度 ${(this.purMul(G)).toFixed(2)}｜突破 ${dB > 0 ? '+' : dB < 0 ? '−' : '±'}${Math.abs(Math.round(dB * 100))}%</small><small class="lg36aff">技能亲和：${aff}</small>
      ${G.flags.awakened ? `<div class="lg36btns"><button class="sm lg36nm">逆脉洗根<br><small>${nc.stone}灵石·寿元−${nc.life}</small></button><button class="sm lg36cu">定向淬根<br><small>天材地宝×${this.CUI_N}·${this.CUI_STONE}</small></button></div><small>洗髓丹：向上一档，纯度 −20。打坐每月 +1（上限 ${this.MED_CAP}），灵根丹 +5。</small>` : '<small>灵根尚未觉醒。</small>'}`;
  },
};
window.LG36 = LG36;
(function () {
  // 道具：灵根丹 / 天材地宝（新增，不改 data.js）
  ITEMS.lgd = { n: '灵根丹', ic: 'pill_green', t: 'pill', p: 600, d: '灵根纯度 +5（上限 100）', use: 'lg36pur' };
  ITEMS.tcdb = { n: '天材地宝', ic: 'lingzhi', t: 'mat', p: 1500, d: '定向淬根材料（角色面板 → 灵根）' };
  if (typeof SHOPS !== 'undefined') {
    const add = (s, k) => { if (SHOPS[s] && !SHOPS[s].items.includes(k)) SHOPS[s].items.push(k); };
    add('yaopu', 'lgd'); add('sumei', 'lgd'); add('xianguan', 'lgd'); add('sumei', 'tcdb'); add('xianguan', 'tcdb');
  }
  // 淬根后的元素（展示、战斗 a.el）
  const _lg = Game.linggen; Game.linggen = function () { const L = _lg.apply(this, arguments); const G = this.G; const s = G && G.lg36; if (LG36.off || !s || !Array.isArray(s.el) || s.elFor !== G.lg || L.id !== G.lg) return L; return Object.assign({}, L, { el: s.el.slice() }); };
  // 纯度 → 修炼倍率
  const _cm = Game.cultMult; Game.cultMult = function () { return _cm.apply(this, arguments) * (this.G ? LG36.purMul(this.G) : 1); };
  // 元素亲和 → 技能伤害
  if (typeof calcDmg === 'function') {
    const _cd = calcDmg;
    calcDmg = function (a, d, sk) { const r = _cd.apply(this, arguments); if (a && a.isPlayer && sk && sk !== SKILLS.atk && sk.el && Game.G) { const x = LG36.aff(sk.el); if (x) r.dm = Math.max(1, Math.round(r.dm * (1 + x))); } return r; };
  }
  // 突破修正（写进 tmpBrk → 卡片显示的成功率自动包含）
  const _tb = Game._tryBreak; Game._tryBreak = async function () {
    const G = this.G; if (!G || G.realm >= 6 || !this.canBreak()) return _tb.apply(this, arguments);
    const d = LG36.brkD(G.realm, G); if (!d) return _tb.apply(this, arguments);
    const t0 = G.tmpBrk || 0, t1 = t0 + d; G.tmpBrk = t1;
    if (d < 0 && (G.lg === 'lei' || G.lg === 'bing')) UI.toast(LG36.LINES.lei, '#c8a0ff');
    try { return await _tb.apply(this, arguments); } finally { if (G.tmpBrk === t1) G.tmpBrk = t0; }
  };
  // 洗髓丹 −20 纯度；灵根丹 +5
  const _ui = UI.useItem; UI.useItem = async function (k) {
    const G = Game.G; const I = ITEMS[k];
    if (I && I.use === 'lg36pur') { if (!G.inv[k]) return; const g = LG36.addPur(5, G); Game.take(k); Sfx.play && Sfx.play('heal'); UI.toast(g > 0 ? `灵根纯度 +${g}（${LG36.pur(G)}/100）` : '纯度已满，吃了个寂寞', '#9affd0'); UI.hud(); return; }
    const n0 = G && G.inv[k] || 0; const r = await _ui.apply(this, arguments);
    if (I && I.use === 'linggen' && G && (G.inv[k] || 0) < n0) { LG36.setLg(G, G.lg, null); const s = LG36.st(G); s.pur = Math.max(0, s.pur - 20); UI.toast(`灵根纯度 −20（${LG36.pur(G)}/100）`, '#c58aff'); }
    return r;
  };
  // 打坐：每游戏月最多 +1，此来源上限 70
  if (typeof Acts !== 'undefined' && Acts.mat) {
    const _mat = Acts.mat; Acts.mat = async function () {
      const G = Game.G; const ap0 = G ? G.ap : 0; const r = await _mat.apply(this, arguments);
      if (G && ap0 > 0 && G.ap === 0) { const s = LG36.st(G); const key = G.year * 12 + (G.month || 0); if (s.medKey !== key && s.pur < LG36.MED_CAP) { s.medKey = key; s.pur = Math.min(LG36.MED_CAP, s.pur + 1); UI.toast(LG36.LINES.pur + `（纯度 ${s.pur}）`, '#9affd0'); } }
      return r;
    };
  }
  // 心魔幻境（xinmo34，若已合入）：小成及以上 +3
  function hookXM() { if (typeof XM34 === 'undefined' || !XM34.run || XM34._lg36) return; const _run = XM34.run; XM34._lg36 = 1; XM34.run = async function () { const o = await _run.apply(this, arguments); if (o && o.g >= 2) { const g = LG36.addPur(3); if (g > 0) UI.toast(`心魔已破，灵根纯度 +${g}`, '#9affd0'); } return o; }; }
  hookXM(); window.addEventListener('load', hookXM);
  // 角色面板：灵根一栏
  const _pc = UI.p_char; UI.p_char = function (b, re) {
    const r = _pc.apply(this, arguments); const G = Game.G; if (!G) return r;
    const d = document.createElement('div'); d.className = 'lg36row'; d.innerHTML = LG36.rowHtml(G); b.appendChild(d);
    d.onclick = async e => { const t = e.target.closest('button'); if (!t) return; e.stopPropagation(); const ok = t.classList.contains('lg36nm') ? await LG36.nimai() : t.classList.contains('lg36cu') ? await LG36.cui() : false; if (ok && re) re(); };
    return r;
  };
  const css = document.createElement('style');
  css.textContent = `.lg36row{margin-top:10px;padding:8px;border-radius:8px;background:rgba(0,0,0,.2);overflow:hidden}.lg36row>b{display:block;margin-bottom:4px}.lg36row small{display:block;font-size:12px;opacity:.9;line-height:1.35;margin-top:3px}
.lg36aff span{display:inline-block;margin-right:6px;font-weight:bold;text-shadow:0 0 2px #000,0 0 1px #000}.lg36bar{position:relative;height:16px;border-radius:8px;background:rgba(0,0,0,.35);overflow:hidden}.lg36bar i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#2a7ab8,#3aa88a)}.lg36bar em{position:relative;display:block;text-align:center;font-size:11px;font-style:normal;line-height:16px;color:#fff;text-shadow:0 0 2px #000}
.lg36btns{display:flex;gap:6px;margin-top:6px}.lg36btns button{flex:1 1 0;min-width:0;min-height:44px;line-height:1.2;white-space:normal}.lg36btns button small{display:block;font-size:10px;margin:0;opacity:.85}`;
  document.head.appendChild(css);
  // 开发者面板 Tab
  if (window.DevPanel && DevPanel.registerTab) DevPanel.registerTab('lg36', '灵根36', (box, ctx) => {
    const G = Game.G; if (!G) { box.innerHTML = '<p>先开始一局</p>'; return; }
    box.innerHTML = `<p>纯度 ${LG36.pur(G)}｜灵根 ${Game.linggen().n}（${LG36.els(G).join('') || '无'}）</p><div class="dvb" style="justify-content:flex-start">${[0, 50, 70, 100].map(v => `<button class="sm dvx" data-p="${v}">纯度${v}</button>`).join('')}<button class="sm dvx" data-i="tcdb">天材地宝×3</button><button class="sm dvx" data-i="lgd">灵根丹×5</button><button class="sm dvx" data-s="1">灵石+20000</button></div><div class="dvb" style="justify-content:flex-start;margin-top:6px">${LINGGEN.map(l => `<button class="sm dvx${G.lg === l.id ? ' on' : ''}" data-l="${l.id}">${l.n}</button>`).join('')}</div>`;
    box.onclick = e => { const t = e.target.closest('button'); if (!t) return; const s = LG36.st(G);
      if (t.dataset.p) { s.pur = +t.dataset.p; ctx.toast('纯度 ' + s.pur); }
      else if (t.dataset.s) { G.stone += 20000; ctx.toast('灵石 +20000'); }
      else if (t.dataset.i) { Game.give(t.dataset.i, t.dataset.i === 'tcdb' ? 3 : 5); ctx.toast(ITEMS[t.dataset.i].n + ' 已发放'); }
      else if (t.dataset.l) { LG36.setLg(G, t.dataset.l, null); G.flags.awakened = 1; ctx.toast('灵根：' + LG36.base(G).n); }
      ctx.save(); ctx.rerender(); };
  });
})();

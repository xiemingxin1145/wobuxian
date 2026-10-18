'use strict';
// ======================= 3.3④ 道途日课 + 七日签到（docs/research_v33.md §4）=======================
// 按现实日期（本地 05:00 刷新）每天随机 4 条日课（各 25 道途点），满 100 点开宝箱；七日签到循环，断签不清零、只暂停。
// 防回调时间：用「上次领取日期 ≥ 今天」判断，不会重复领。跨世共享：存在 Game.meta.d33（轮回不丢）。
const DAILY_POOL = [
  ['kill', '击败 15 只怪', 15], ['herb', '采药 5 次', 5], ['quest', '完成 1 个任务', 1], ['talk', '与 3 个 NPC 对话', 3], ['wipe', '擦拭法宝 1 次', 1], ['afk', '挂机满 30 分钟', 30],
];
const DAILY33 = {
  off: 0, // 开发者「跳到明日 05:00」累加的偏移（毫秒）
  now() { return Date.now() + this.off; },
  day(t) { const d = new Date((t || this.now()) - 5 * 3600e3); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); },
  st() {
    const M = Game.meta; M.d33 = M.d33 || { day: 0, tasks: [], pts: 0, box: 0, talked: {}, sign: { n: 0, last: 0 } }; const D = M.d33; const today = this.day();
    if (today > D.day) { // 只在“日期前进”时刷新；时间往回调不刷新、不重复领
      const pool = DAILY_POOL.slice(); const pickN = []; let seed = today; const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
      while (pickN.length < 4) pickN.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
      D.day = today; D.tasks = pickN.map(([k, n, need]) => ({ k, n, need, cnt: 0, got: 0 })); D.pts = 0; D.box = 0; D.talked = {};
    }
    return D;
  },
  inc(k, n = 1) { if (!Game.meta) return; const D = this.st(); let ch = false; for (const t of D.tasks) if (t.k === k && t.cnt < t.need) { t.cnt = Math.min(t.need, t.cnt + n); ch = true; if (t.cnt >= t.need) UI.toast(`日课完成：${t.n}（去领道途点）`, '#9affd0'); } if (ch) { Game.saveMeta(); this.dot(); } },
  need() { const G = Game.G; return REALMS[Math.min(6, G ? G.realm : 0)].need; },
  red() { const D = this.st(); return D.tasks.some(t => t.cnt >= t.need && !t.got) || (D.pts >= 100 && !D.box) || D.sign.last < this.day(); },
  dot() { if (this.btn) this.btn.classList.toggle('red', this.red()); },
  signRw(n) { const need = this.need(); return [[['stone', Math.round(need * 0.2)]], [['herb', 5]], [['ore', 2]], [['yd', 1]], [['stone', Math.round(need * 0.4)]], [['xyf', 1]], [['xyf', 3], ['mg_reroll', 1]]][n]; },
  give(list) { const G = Game.G; const out = []; for (const [k, n] of list) { if (k === 'stone') G.stone += n; else Game.give(k, n); out.push(`${k === 'stone' ? '灵石' : (ITEMS[k] || { n: k }).n}×${fmt(n)}`); } return out.join('、'); },
  html() {
    const D = this.st(); const today = this.day(); const signed = D.sign.last >= today;
    return `<p class="hint">每天 05:00 刷新 4 条；全部可在挂机中自然完成。道途点 ${D.pts}/100</p>` + D.tasks.map((t, k) => `<div class="it d33"><b>${esc(t.n)}</b><small>${t.cnt}/${t.need}</small>${t.got ? '<button class="opt" disabled>已领</button>' : `<button class="opt" data-d="t" data-v="${k}" ${t.cnt >= t.need ? '' : 'disabled'}>领 25 点</button>`}</div>`).join('')
      + `<div class="it d33"><b>道途宝箱（100 点）</b>${D.box ? '<button class="opt" disabled>已开</button>' : `<button class="opt" data-d="box" ${D.pts >= 100 ? '' : 'disabled'}>开宝箱</button>`}</div>`
      + `<div class="it d33"><b>七日签到 · 第 ${D.sign.n + 1} 天</b><small></small><button class="opt" data-d="sign" ${signed ? 'disabled' : ''}>${signed ? '今日已签' : '签到'}</button></div>`;
  },
  async open() {
    const w = h('div', 'mwrap'); const c = h('div', 'card d33card'); const draw = () => { c.innerHTML = `<div class="ct">道途日课</div>${this.html()}<div class="opts"><button class="opt" data-d="x">关闭</button></div>`; };
    draw(); w.appendChild(c); UI.push(w);
    await new Promise(res => { c.onclick = e => { const b = e.target.closest('[data-d]'); if (!b || b.disabled) return; Sfx.play('click'); const D = this.st(); const a = b.dataset.d;
      if (a === 'x') { UI.pop(w); res(); return; }
      if (a === 't') { const t = D.tasks[+b.dataset.v]; if (t && t.cnt >= t.need && !t.got) { t.got = 1; D.pts += 25; } }
      if (a === 'box' && D.pts >= 100 && !D.box) { D.box = 1; UI.toast('道途宝箱：' + this.give([['stone', Math.round(this.need() * 0.3)], ['herb', 5], ['xyf', 1]]), '#ffc84a'); }
      if (a === 'sign' && D.sign.last < this.day()) { const got = this.give(this.signRw(D.sign.n)); D.sign.last = this.day(); D.sign.n = (D.sign.n + 1) % 7; UI.toast('签到：' + got, '#ffc84a'); }
      Game.saveMeta(); Game.save(); draw(); this.dot(); }; });
  },
  devSkip() { const now = this.now(); const d = new Date(now - 5 * 3600e3); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 1); this.off += (d.getTime() + 5 * 3600e3 + 1000) - now; this.st(); Game.saveMeta(); this.dot(); },
};
ITEMS.mg_reroll = { n: '命格重铸石', ic: 'stone_r', t: 'mat', p: 0, d: '可把一个先天命格换成新抽的命格（角色面板 → 先天命格，3.4 开放重铸界面）。' };
(function () {
  const btn = document.createElement('button'); btn.id = 'd33btn'; btn.textContent = '日课'; document.body.appendChild(btn); DAILY33.btn = btn;
  btn.onclick = () => { if (!Game.G || UI.stack.length || !UX.inMap()) return; Sfx.play('click'); DAILY33.open(); };
  const _f = Game.fight; Game.fight = async function () { const k0 = this.G ? this.G.killsTotal || 0 : 0; const r = await _f.apply(this, arguments); if (this.G && (this.G.killsTotal || 0) > k0) DAILY33.inc('kill', (this.G.killsTotal || 0) - k0); return r; };
  const _im = Game.interactMark; Game.interactMark = async function (m) { const r = await _im.apply(this, arguments); if (m && m.act === 'herb') DAILY33.inc('herb'); return r; };
  const _ie = Game.interactEnt; Game.interactEnt = function (e) { const r = _ie.apply(this, arguments); try { if (e && e.kind === 'npc') { const D = DAILY33.st(); if (!D.talked[e.id]) { D.talked[e.id] = 1; DAILY33.inc('talk'); } } } catch (er) { } return r; };
  const _fq = Game.finishQuest; Game.finishQuest = async function () { const r = await _fq.apply(this, arguments); DAILY33.inc('quest'); return r; };
  setInterval(() => { try { if (Game.G && typeof AFK !== 'undefined' && AFK.on) { DAILY33._afk = (DAILY33._afk || 0) + 1; if (DAILY33._afk % 60 === 0) DAILY33.inc('afk'); } if (Game.G) DAILY33.dot(); } catch (e) { } }, 1000);
  const css = document.createElement('style'); css.textContent = `#d33btn{position:fixed;left:106px;top:calc(120px + env(safe-area-inset-top));width:62px;height:40px;border-radius:20px;border:2px solid #9affd0;background:rgba(10,30,20,.78);color:#d8ffe8;font-size:15px;z-index:5;font-family:inherit}#d33btn.red::after{content:'';position:absolute;right:4px;top:2px;width:10px;height:10px;border-radius:5px;background:#ff4a4a}body:not(.ingame) #d33btn{display:none!important}.d33card{max-width:380px}.d33{display:flex;align-items:center;gap:6px;margin:6px 0}.d33 b{flex:1}.d33 small{opacity:.85;font-size:12px;flex:1}`; document.head.appendChild(css);
})();

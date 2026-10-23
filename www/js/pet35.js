'use strict';
// ======================= 3.5 灵宠派遣（ROADMAP P2 #16 “灵宠派遣”）=======================
// 不出战的灵兽可以派出去跑一年差事，过年结算带回材料，并获得灵兽经验。
// 名额：1 + floor(大境界/2)，最多 4。出战中的灵兽不能派遣（改出战会自动召回）。
// 灵兽五行与差事相合 ×1.5 收获；探秘境有 20% 负伤空手而归（水/冰系 10%）。
// 存档：差事写在灵兽对象上 p.pd35 = { job, y }（放生即随之消失），G.pd35log 最近 6 条结算记录；老档无字段即空闲，不 bump G.v。
const PD35_JOBS = {
  herb: { n: '采药', el: '木', d: '灵草，概率千年灵芝' },
  ore: { n: '寻矿', el: '土', d: '玄铁晶' },
  hunt: { n: '狩猎', el: '火', d: '妖丹，额外灵兽经验' },
  stall: { n: '帮人看摊', el: '金', d: '灵石（按境界）' },
  explore: { n: '探秘境', el: '水', d: '钥匙/残破功法/灵兽蛋，有负伤风险' },
};
const PD35 = {
  max(G) { G = G || Game.G; if (!G) return 0; return Math.min(4, 1 + Math.floor((G.realm || 0) / 2)); },
  away(G) { G = G || Game.G; return G ? G.pets.filter((p, k) => p.pd35 && p.pd35.job && k !== G.petA) : []; },
  match(p, job) { const J = PD35_JOBS[job], M = MONS[p.mon]; if (!J || !M) return false; return M.el === J.el || (job === 'explore' && M.el === '冰'); },
  send(k, job) {
    const G = Game.G; const p = G && G.pets[k]; if (!p || !PD35_JOBS[job]) return false;
    if (k === G.petA) { UI.toast('出战中的灵兽不能派遣'); return false; }
    if (!(p.pd35 && p.pd35.job) && this.away(G).length >= this.max(G)) { UI.toast(`派遣名额已满（${this.max(G)}）`); return false; }
    p.pd35 = { job, y: 0 }; Game.save(); return true;
  },
  recall(k) { const G = Game.G; const p = G && G.pets[k]; if (p && p.pd35) { delete p.pd35; Game.save(); } },
  // 单只结算，rnd 可注入便于测试
  settleOne(p, rnd) {
    const G = Game.G; rnd = rnd || Math.random; const job = p.pd35.job; const J = PD35_JOBS[job]; if (!J) { delete p.pd35; return null; }
    const mul = this.match(p, job) ? 1.5 : 1; const lv = p.lv || 1; const parts = []; let exp = 30 * Math.pow(1.25, lv) * 0.3; // 研究员：0.6→0.3
    const CAP = { ore: 3, yd: 3, herb: 6 }; // 每只每年在五行 ×1.5 之前封顶：玄铁晶/妖丹 3、灵草 6
    const give = (id, n, base) => { if (base !== undefined) n = Math.min(CAP[id] || 1e9, base) * mul; n = Math.max(0, Math.floor(n)); if (n > 0) { Game.give(id, n); parts.push(`${ITEMS[id].n}+${n}`); } };
    if (job === 'herb') { give('herb', 0, 2 + lv / 3); if (rnd() < 0.25 * mul) give('lz', 1); }
    else if (job === 'ore') give('ore', 0, 1 + lv / 4);
    else if (job === 'hunt') { give('yd', 0, 1 + lv / 4); exp *= 1.5; }
    else if (job === 'stall') { const need = REALMS[Math.min(6, G.realm || 0)].need; const s = Math.round(need * 0.04 * mul * (1 + lv * 0.05)); G.stone += s; parts.push(`灵石+${fmt(s)}`); }
    else if (job === 'explore') {
      const hurt = this.match(p, job) ? 0.1 : 0.2;
      if (rnd() < hurt) { p.hp = 1; exp *= 0.3; parts.push('负伤而归，空手'); }
      else { const r = rnd(); if (r < 0.03) give('egg', 1); else if (r < 0.33) give('scroll', 1); else give('key', 1 + (mul > 1 ? 1 : 0)); }
    }
    p.pd35.y = (p.pd35.y || 0) + 1;
    // 每只每年经验上限：下一级所需的 50%，记在 G.pd35exp（与 G.pd35log 同级）= { y, g: { 灵兽键: 本年已得 } }
    { const yr = G.year || G.age; const X = G.pd35exp = (G.pd35exp && G.pd35exp.y === yr) ? G.pd35exp : { y: yr, g: {} }; const key = p.k35 = p.k35 || ('p' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36));
      const cap = 0.5 * 40 * Math.pow(1.25, p.lv || 1); exp = Math.max(0, Math.min(Math.round(exp), Math.floor(cap - (X.g[key] || 0)))); X.g[key] = (X.g[key] || 0) + exp; }
    const before = G.petA; G.petA = G.pets.indexOf(p); try { Game.petGain(exp); } finally { G.petA = before; }
    return { name: p.name, n: J.n, parts, match: mul > 1 };
  },
  settle(rnd) {
    const G = Game.G; if (!G || G.dead) return [];
    // 出战中的灵兽身上残留差事：直接召回
    const a = G.pets[G.petA]; if (a && a.pd35) delete a.pd35;
    const lines = [];
    for (const p of this.away(G)) { const r = this.settleOne(p, rnd); if (r) lines.push(`${r.name}·${r.n}${r.match ? '（五行相合）' : ''}：${r.parts.join('、') || '无收获'}`); }
    if (lines.length) { G.pd35log = [{ y: G.year || G.age, lines }].concat(G.pd35log || []).slice(0, 6); UI.toast('灵兽归来——' + lines.join('；'), '#9aff9a'); Game.save(); }
    return lines;
  },
  html() {
    const G = Game.G; if (!G || !G.pets.length) return '';
    const mx = this.max(G), n = this.away(G).length;
    let s = `<div class="pd35"><b>灵宠派遣</b><p class="hint">已派 ${n}/${mx}（境界越高名额越多，最多 4）。过年结算，五行相合收获 ×1.5。</p>`;
    G.pets.forEach((p, k) => {
      if (k === G.petA) return;
      const cur = p.pd35 && p.pd35.job; const el = (MONS[p.mon] || {}).el || '';
      s += `<div class="pd35r"><b>${esc(p.name)}</b><small>${el}系 Lv${p.lv}${cur ? ` · ${PD35_JOBS[cur].n}中（${p.pd35.y || 0} 年）` : ' · 空闲'}</small>
        <select data-pd="job" data-k="${k}"><option value="">留在身边</option>${Object.entries(PD35_JOBS).map(([j, J]) => `<option value="${j}" ${cur === j ? 'selected' : ''}>${J.n}${this.match(p, j) ? '★' : ''}</option>`).join('')}</select></div>`;
    });
    if (G.pets.length === 1) s += `<p class="hint">只有 1 只灵兽且正在出战。再收服一只，就能派它出去跑差事。</p>`;
    s += `<p class="hint">${Object.values(PD35_JOBS).map(J => `${J.n}（${J.el}）：${J.d}`).join('；')}。★ = 五行相合。</p>`;
    const L = G.pd35log && G.pd35log[0]; if (L) s += `<p class="hint">上次归来：${L.lines.map(esc).join('；')}</p>`;
    return s + '</div>';
  },
};
(function () {
  const _pp = UI.p_pets; UI.p_pets = function (b, re) {
    const r = _pp.apply(this, arguments); const G = Game.G;
    // 原面板的出战按钮：改出战即召回该灵兽
    const _oc = b.onclick; b.onclick = e => { const k = e.target.dataset && e.target.dataset.k; if (k !== undefined && !e.target.classList.contains('rel') && G.pets[+k]) delete G.pets[+k].pd35; return _oc && _oc(e); };
    const d = h('div', 'pd35wrap', PD35.html()); b.appendChild(d);
    d.addEventListener('click', e => e.stopPropagation());
    d.addEventListener('change', e => {
      const t = e.target.closest('[data-pd="job"]'); if (!t) return; Sfx.play('click');
      const k = +t.dataset.k; if (t.value) PD35.send(k, t.value); else PD35.recall(k);
      d.innerHTML = PD35.html();
    });
    return r;
  };
  const _ye = Game.yearEnd; Game.yearEnd = async function () {
    const G = this.G; const y0 = G && G.year; const r = await _ye.apply(this, arguments);
    if (G && !G.dead && G.year !== y0) { try { PD35.settle(); } catch (e) { console.warn('pd35', e); } }
    return r;
  };
  if (window.DevPanel && DevPanel.registerTab) DevPanel.registerTab('pd35', '派遣', (box, ctx) => {
    box.innerHTML = '<button class="opt" data-x="settle">立即结算派遣</button><button class="opt" data-x="pets">送 3 只灵兽（木/土/水）</button>';
    box.onclick = e => { const x = e.target.dataset.x; if (x === 'settle') { const l = PD35.settle(); ctx.toast(l.length ? '已结算 ' + l.length + ' 只' : '没有派遣中的灵兽'); } else if (x === 'pets') { for (const m of ['treant', 'rock', 'crab']) Game.addPet(m, Math.max(0.5, Game.power())); ctx.save(); ctx.toast('已送 3 只灵兽'); } };
  });
  const css = document.createElement('style');
  css.textContent = `.pd35{margin-top:12px;padding:10px;border-radius:10px;background:rgba(120,220,140,.10);border:1px solid rgba(120,220,140,.4)}.pd35>b{display:block;font-size:16px;color:#9aff9a}.pd35 p{margin:4px 0}.pd35r{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:6px 0}.pd35r b{min-width:60px}.pd35r small{opacity:.85;flex:1}.pd35r select{font:inherit;padding:4px 6px;border-radius:6px;background:#1a2238;color:#eee;border:1px solid #667}`;
  document.head.appendChild(css);
})();

// 放生：被放生的在出战灵兽之前 → petA 前移一位；放生的就是出战灵兽 → petA=-1（无出战）。差事 p.pd35 挂在灵兽对象上，随对象移动不受下标影响。
Game.releasePet = function (k) { const G = this.G; if (!G || !G.pets[k]) return false; G.pets.splice(k, 1); if (k < G.petA) G.petA--; else if (k === G.petA) G.petA = -1; if (G.petA >= G.pets.length) G.petA = G.pets.length - 1; return true; };

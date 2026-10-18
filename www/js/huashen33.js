'use strict';
// ======================= 3.3⑤ 身外化身（docs/research_v33.md §5）=======================
// 元婴解锁。凝练 1 个化身（化神再 +1，最多 2）；派长期差事，按游戏年结算；同差事连续 3 年后效率 −20%，换差事重置。
// 凝练：修为 need×0.3 + 千年灵芝(lz)×3。存档 G.hs33 = { clones: [{ job, yearsOnJob }] }；老档默认空，不 bump G.v。
// A5.4 实时战 AI 队友（rt29）：buildAllies 在 IIFE 内不可低风险接入，本轮跳过，见 PROGRESS。
const HS_JOBS = {
  travel: { n: '游历', d: '随机奇遇 + 修为 need×0.05' },
  field: { n: '看守灵田', d: '灵田收获 ×1.5（向上取整）' },
  sect: { n: '坐镇宗门', d: '宗门贡献 +20；防守战力 +10%' },
  stall: { n: '坊市摆摊', d: '灵石 need×0.25' },
  closed: { n: '闭关', d: '修为 need×0.12（不越过瓶颈）' },
};
const HS33 = {
  st(G) { G = G || Game.G; if (!G) return null; if (!G.hs33) G.hs33 = { clones: [] }; if (!Array.isArray(G.hs33.clones)) G.hs33.clones = []; return G.hs33; },
  unlocked() { const G = Game.G; return !!(G && G.realm >= 4); },
  max() { const G = Game.G; if (!G) return 0; return G.realm >= 5 ? 2 : G.realm >= 4 ? 1 : 0; },
  need() { const G = Game.G; return REALMS[Math.min(6, G ? G.realm : 0)].need; },
  craftCost() { return { exp: Math.round(this.need() * 0.3), lz: 3 }; },
  fatMul(c) { return (c && (c.yearsOnJob || 0) >= 3) ? 0.8 : 1; },
  fatigued(c) { return !!(c && (c.yearsOnJob || 0) >= 3); },
  hasJob(job) { const S = this.st(); return S && S.clones.some(c => c.job === job); },
  craft() {
    const G = Game.G; if (!this.unlocked()) { UI.toast('元婴期方可凝练身外化身'); return false; }
    const S = this.st(G); if (S.clones.length >= this.max()) { UI.toast(G.realm >= 5 ? '化身已满（最多 2 个）' : '元婴可凝 1 个，化神可凝 2 个'); return false; }
    const c = this.craftCost();
    if (G.exp < c.exp) { UI.toast(`修为不足（需 ${fmt(c.exp)}）`); return false; }
    if (!Game.has('lz', c.lz)) { UI.toast('千年灵芝不足（需 ×3）'); return false; }
    G.exp -= c.exp; Game.take('lz', c.lz);
    S.clones.push({ job: null, yearsOnJob: 0 });
    UI.toast(`凝练化身成功（${S.clones.length}/${this.max()}）`, '#ffc84a'); Game.save(); return true;
  },
  assign(i, job) {
    const S = this.st(); const c = S && S.clones[i]; if (!c) return;
    if (job && !HS_JOBS[job]) return;
    if (c.job !== job) { c.job = job || null; c.yearsOnJob = 0; }
    Game.save();
  },
  dismiss(i) {
    const S = this.st(); if (!S || !S.clones[i]) return;
    S.clones.splice(i, 1); UI.toast('化身已散去'); Game.save();
  },
  // 闭关：加修为但不越过瓶颈（stage=3 时 cap 在 need，不触发突破）
  addClosedExp(amount) {
    const G = Game.G; if (!G || G.realm >= 7) return 0;
    const before = G.exp, stage0 = G.stage;
    const got = Game.addExp(amount, true);
    if (G.stage === 3 && G.exp >= Game.need()) G.exp = Game.need();
    // 若 addExp 推进了小境界到圆满且满瓶，保持可突破但不自动突破（addExp 本就不会升大境界）
    if (stage0 < 3 && G.stage === 3 && G.exp > Game.need()) G.exp = Game.need();
    return got || Math.max(0, G.exp - before);
  },
  pickTravelEv() {
    // 放宽 map= 条件：去掉 map 段再 cond；权重>0 的池
    const pool = EVENTS.filter(e => e[4] > 0);
    if (!pool.length) return null;
    const ok = pool.filter(e => {
      const c = (e[3] || '').split(';').filter(t => t && !t.trim().startsWith('map=')).join(';');
      return Game.cond(c);
    });
    const use = ok.length ? ok : pool;
    return use[Math.floor(Math.random() * use.length)];
  },
  async settleOne(c, i) {
    const G = Game.G; if (!c || !c.job || !HS_JOBS[c.job]) return null;
    const wasFat = this.fatigued(c); const mul = this.fatMul(c); const need = this.need(); const parts = [];
    const job = c.job;
    if (job === 'travel') {
      const add = Math.round(need * 0.05 * mul);
      if (add) { Game.addExp(add, true); parts.push(`修为+${fmt(add)}`); }
      const ev = this.pickTravelEv();
      if (ev) { parts.push(`奇遇「${ev[1]}」`); try { await Game.runEvent(ev); } catch (e) { } }
    } else if (job === 'field') {
      const fl = (G.cave && G.cave.field) || 0;
      if (fl > 0) {
        // Sys.afterYear 已发基础收获；此处补到 ×1.5×疲劳
        const herbBase = fl, lzBase = fl >= 3 ? fl - 2 : 0, peachBase = fl >= 5 ? 1 : 0;
        const herb = Math.max(0, Math.ceil(herbBase * 1.5 * mul) - herbBase);
        const lz = Math.max(0, Math.ceil(lzBase * 1.5 * mul) - lzBase);
        const peach = Math.max(0, Math.ceil(peachBase * 1.5 * mul) - peachBase);
        if (herb > 0) { Game.give('herb', herb); parts.push(`灵草+${herb}`); }
        if (lz > 0) { Game.give('lz', lz); parts.push(`千年灵芝+${lz}`); }
        if (peach > 0) { Game.give('peach', peach); parts.push(`蟠桃+${peach}`); }
        if (!parts.length) parts.push('灵田无额外收获');
      } else {
        const herb = Math.max(1, Math.ceil(3 * mul)); Game.give('herb', herb); parts.push(`灵草+${herb}（无灵田·化身采药）`);
      }
    } else if (job === 'sect') {
      const add = Math.round(20 * mul);
      if (G.sect) { G.contrib = (G.contrib || 0) + add; parts.push(`宗门贡献+${add}`); }
      else parts.push('未入宗门，坐镇无贡献');
    } else if (job === 'stall') {
      const s = Math.round(need * 0.25 * mul); G.stone += s; parts.push(`灵石+${fmt(s)}`);
    } else if (job === 'closed') {
      const add = Math.round(need * 0.12 * mul);
      const got = this.addClosedExp(add);
      parts.push(`修为+${fmt(got)}`);
    }
    c.yearsOnJob = (c.yearsOnJob || 0) + 1;
    return { i, job, n: HS_JOBS[job].n, parts, fat: wasFat };
  },
  async settle() {
    const G = Game.G; if (!G || G.dead) return;
    const S = this.st(G); if (!S.clones.length) return;
    const lines = [];
    for (let i = 0; i < S.clones.length; i++) {
      const r = await this.settleOne(S.clones[i], i);
      if (r && r.parts.length) lines.push(`化身${i + 1}·${r.n}：${r.parts.join('、')}${r.fat ? '（疲劳−20%）' : ''}`);
    }
    if (lines.length) UI.toast(lines.join('；'), '#c8b0ff');
    Game.save();
  },
  html() {
    const G = Game.G; if (!G) return '';
    if (!this.unlocked()) return `<div class="hs33"><b>身外化身</b><p class="hint">🔒 元婴期解锁（可凝练化身派长期差事，按游戏年结算）</p></div>`;
    const S = this.st(G); const mx = this.max(); const cost = this.craftCost();
    let body = `<b>身外化身</b><p class="hint">${S.clones.length}/${mx}　凝练：修为 ${fmt(cost.exp)} + 千年灵芝×3${G.realm < 5 ? '（化神可再 +1）' : ''}</p>`;
    if (S.clones.length < mx) body += `<button class="opt" data-hs="craft">凝练化身</button>`;
    S.clones.forEach((c, i) => {
      const jn = c.job ? HS_JOBS[c.job].n : '空闲';
      const fat = this.fatigued(c) ? ' · 疲劳−20%' : (c.yearsOnJob ? ` · 同差事 ${c.yearsOnJob} 年` : '');
      body += `<div class="hs33c"><b>化身${i + 1}</b><small>${jn}${fat}</small>
        <select data-hs="job" data-i="${i}"><option value="">空闲</option>${Object.entries(HS_JOBS).map(([k, J]) => `<option value="${k}" ${c.job === k ? 'selected' : ''}>${J.n}</option>`).join('')}</select>
        <button class="opt" data-hs="dismiss" data-i="${i}">散去</button></div>`;
    });
    body += `<p class="hint">差事：游历 / 看守灵田 / 坐镇宗门 / 坊市摆摊 / 闭关。连续同差事 3 年后效率 −20%，换差事重置。</p>`;
    return `<div class="hs33">${body}</div>`;
  },
};
(function () {
  const _pc = UI.p_cave; UI.p_cave = function (b, re) {
    const r = _pc.apply(this, arguments);
    const d = h('div', 'hs33wrap', HS33.html()); b.appendChild(d);
    d.addEventListener('click', e => {
      const t = e.target.closest('[data-hs]'); if (!t) return; e.stopPropagation(); Sfx.play('click');
      const a = t.dataset.hs;
      if (a === 'craft') HS33.craft();
      else if (a === 'dismiss') HS33.dismiss(+t.dataset.i);
      d.innerHTML = HS33.html(); UI.hud();
    });
    d.addEventListener('change', e => {
      const t = e.target.closest('[data-hs="job"]'); if (!t) return;
      HS33.assign(+t.dataset.i, t.value || null);
      d.innerHTML = HS33.html();
    });
    return r;
  };
  const _ye = Game.yearEnd; Game.yearEnd = async function () {
    const G = this.G; const y0 = G && G.year; const r = await _ye.apply(this, arguments);
    if (G && !G.dead && G.year !== y0) await HS33.settle();
    return r;
  };
  // 坐镇宗门：防守战力 best-effort —— 有化身坐镇时防御 +10%
  const _st = Game.stats; Game.stats = function () {
    const s = _st.apply(this, arguments);
    if (this.G && HS33.hasJob('sect')) s.def *= 1.1;
    return s;
  };
  const css = document.createElement('style');
  css.textContent = `.hs33{margin-top:12px;padding:10px;border-radius:10px;background:rgba(180,140,255,.10);border:1px solid rgba(180,140,255,.4)}.hs33>b{display:block;font-size:16px;color:#d4b8ff}.hs33 p{margin:4px 0}.hs33c{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:6px 0}.hs33c b{min-width:52px}.hs33c small{opacity:.85;flex:1}.hs33c select{font:inherit;padding:4px 6px;border-radius:6px;background:#1a2238;color:#eee;border:1px solid #667}`;
  document.head.appendChild(css);
})();

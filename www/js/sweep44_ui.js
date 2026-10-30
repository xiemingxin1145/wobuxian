// ======================= 3.9.4 秘境扫荡 sweep44 第 2 轮 UI 接线（§18.4 / §18.5）=======================
// 只包装：UI.p_dungeon26 追加扫荡区块；结果卡走 Sweep44.go → TEXT44；DevPanel「扫荡44」。
// tit39 称号 t_sw44：尽量挂到 TITLES；TEXT39.titles 扩表推迟（tit39Deferred）。
// 首通解锁仍由 sweep44.js 包 Dng.exit（finish 全通）；retreat 不满足 ok → 不解锁。
// 不改 dungeon26/game/talk/data/ui/battle/main。弹卡守 storyBlock/B.on；rng 走 Sweep44/Game.roll。
'use strict';
(function (W) {
  const SW = () => {
    try { if (typeof Sweep44 !== 'undefined' && Sweep44) return Sweep44; } catch (e) {}
    return (W && W.Sweep44) || null;
  };
  const getG = () => {
    try { if (typeof Game !== 'undefined' && Game && Game.G) return Game.G; } catch (e) {}
    return null;
  };
  const off = () => {
    const S = SW();
    return !S || S.off;
  };
  const T = () => {
    const S = SW();
    return (S && S.TEXT) || (W && W.TEXT44) || {};
  };
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const UI44 = {
    off: false,
    tit39Deferred: true,
    tit39Note: 't_sw44 已尝试挂 TITLES；TEXT39.titles 扩表后由 tit39.refresh 自动弹出（§18.5 推迟）',
    _hooked: false,

    storyBlock() {
      const S = SW();
      if (S && typeof S.storyBlock === 'function') return S.storyBlock();
      try {
        if (typeof NPC37 !== 'undefined' && NPC37 && typeof NPC37.storyBlock === 'function') {
          const r = NPC37.storyBlock(); if (r) return r;
        }
      } catch (e) {}
      try { if (typeof B !== 'undefined' && B && B.on) return 'battle'; } catch (e) {}
      return null;
    },
    canPopup() {
      if (this.off || off()) return false;
      const S = SW();
      if (S && typeof S.canPopup === 'function') return S.canPopup();
      return !this.storyBlock();
    },

    /** 尝试挂称号；不改 tit39.js。返回 { deferred, registered } */
    tryTit39() {
      const tu = T().title_unlock;
      if (!tu || !tu.id) {
        this.tit39Deferred = true;
        return { deferred: true, registered: false, reason: 'no title_unlock' };
      }
      let registered = false;
      try {
        if (typeof TITLES !== 'undefined' && Array.isArray(TITLES) && !TITLES.some(t => t && t.id === tu.id)) {
          TITLES.push({
            id: tu.id,
            n: tu.n,
            d: (tu.d || '') + (tu.fl ? ' ' + tu.fl : ''),
            g: '杂项',
            ok: G => !!(G && G.sw44 && (G.sw44.tot | 0) >= 30),
            fx: { cult: 0.02 }
          });
          registered = true;
        } else if (typeof TITLES !== 'undefined' && Array.isArray(TITLES) && TITLES.some(t => t && t.id === tu.id)) {
          registered = true;
        }
      } catch (e) {}
      // T39.refresh 只扫 TEXT39.titles —— 不改 tit39 时无法自动 toast；标推迟
      this.tit39Deferred = true;
      this.tit39Registered = registered;
      return { deferred: true, registered, reason: this.tit39Note };
    },

    /** 面板应列档：0..listMax，再多一行预告（§18.4） */
    bandRows(G) {
      const S = SW();
      if (!S || !G) return [];
      const hi = S.listMax(G);
      const rows = [];
      for (let b = 0; b <= hi; b++) rows.push(b);
      if (hi < 4) rows.push(hi + 1); // 预告一行
      return rows;
    },

    rowHtml(G, b) {
      const S = SW();
      const Tx = T();
      const names = (S && S.BANDS_N) || ['练气秘境', '筑基秘境', '金丹秘境', '元婴秘境', '化神秘境'];
      const st = S.bandStatus(G, b);
      const name = esc(names[b] || ('档' + b));
      let status = '', btns = '', hint = '';
      if (st === 'locked_first') {
        status = '<span class="sw44st">未首通</span>';
        hint = `<small class="sw44hint">${esc(Tx.locked_first || '')}</small>`;
      } else if (st === 'locked_realm') {
        status = '<span class="sw44st dim">🔒 境界不足</span>';
        hint = `<small class="sw44hint">${esc(Tx.locked_realm || '')}</small>`;
      } else if (st === 'off') {
        status = '<span class="sw44st dim">关闭</span>';
      } else {
        status = '<span class="sw44st ok">已首通</span>';
        const left = S.left(G);
        const maxN = S.maxN(G);
        const disCap = st === 'cap' || left < 1;
        const disAp = st === 'noap' || (G.ap | 0) < 1;
        const dis = disCap || disAp || st !== 'ready';
        const dAttr = dis ? ' data-off="1" disabled' : '';
        btns = `<button class="sm sw44b" data-sw="${b}:1"${dAttr}>${esc(Tx.btn1 || '扫荡 ×1')}</button>`;
        if (maxN >= 2 && !disCap) {
          const lab = String(Tx.btnN || '扫荡 ×{n}').replace('{n}', String(maxN));
          const dN = (G.ap | 0) < maxN ? ' data-off="1" disabled' : '';
          btns += `<button class="sm sw44b" data-sw="${b}:${maxN}"${dN}>${esc(lab)}</button>`;
        }
        if (disCap) hint = `<small class="sw44hint">${esc(Tx.cap || '')}</small>`;
        else if (disAp) hint = `<small class="sw44hint">${esc(Tx.noap || '')}</small>`;
      }
      return `<div class="sw44row" data-band="${b}"><b>${name}</b> ${status} ${btns}${hint}</div>`;
    },

    blockHtml(G) {
      const S = SW();
      const Tx = T();
      if (!S || !G) return '';
      const left = S.left(G);
      const cap = S.CAP || 3;
      const flavor = esc((S.flavorLine && S.flavorLine()) || '');
      const rows = this.bandRows(G).map(b => this.rowHtml(G, b)).join('');
      const anyFull = S.st(G) && Object.keys(S.st(G).full || {}).some(k => S.st(G).full[k] === 1);
      const hint = anyFull ? '' : `<p class="hint sw44first">${esc(Tx.first_hint || '')}</p>`;
      return `<div class="sw44wrap">
        <h4>${esc(Tx.title || '讨债司外包 · 秘境代扫')}</h4>
        <p class="hint">本年剩余 <b>${left}/${cap}</b> 次　行动力 ${G.ap | 0}（每次 1）</p>
        <p class="hint sw44flavor">${flavor}</p>
        ${hint}
        ${rows}
      </div>`;
    },

    async onSweepClick(b, n, re) {
      if (off() || this.off) return;
      if (!this.canPopup()) return;
      const S = SW();
      const G = getG();
      if (!S || !G) return;
      b = b | 0; n = Math.max(1, n | 0);
      try {
        const r = await S.go(G, b, n); // 确认卡 + 代扫回执 TEXT44
        if (typeof re === 'function') re();
        return r;
      } catch (e) {
        console.warn('[sweep44_ui] go', e);
      }
    },

    wireBlock(b, re) {
      if (!b || !b.querySelectorAll) return;
      const btns = b.querySelectorAll('button.sw44b[data-sw]');
      btns.forEach(el => {
        if (el._sw44) return;
        el._sw44 = 1;
        el.onclick = async (ev) => {
          if (el.disabled || el.getAttribute('data-off')) return;
          const raw = el.getAttribute('data-sw') || '';
          const parts = raw.split(':');
          const band = parts[0] | 0;
          const times = parts[1] | 0;
          await UI44.onSweepClick(band, times, re);
        };
      });
    },

    appendToPanel(b, re) {
      if (off() || this.off || !b) return false;
      const G = getG();
      if (!G) return false;
      try {
        if (typeof Dng !== 'undefined' && Dng && Dng.run && !Dng.run.over) return false;
      } catch (e) {}
      const html = this.blockHtml(G);
      if (!html) return false;
      try {
        if (b.insertAdjacentHTML) b.insertAdjacentHTML('beforeend', html);
        else b.innerHTML = (b.innerHTML || '') + html;
      } catch (e) {
        try { b.innerHTML = (b.innerHTML || '') + html; } catch (e2) { return false; }
      }
      this.wireBlock(b, re);
      return true;
    },

    /** 确认 Dng.exit 首通钩子在（finish 解锁 / retreat 不解锁） */
    ensureExitHook() {
      try {
        if (typeof Dng !== 'undefined' && Dng && typeof Dng.exit === 'function' && !Dng._sw44) {
          // sweep44.js 应已包；若 UI 先于逻辑加载则补包
          const S = SW();
          if (!S) return false;
          Dng._sw44 = 1;
          const _ex = Dng.exit;
          Dng.exit = function () {
            const r = this.run;
            try { if (!S.off) S.onExit(getG(), r); } catch (e) {}
            return _ex.apply(this, arguments);
          };
        }
        return !!(typeof Dng !== 'undefined' && Dng && Dng._sw44);
      } catch (e) { return false; }
    }
  };

  function injectCss() {
    try {
      if (typeof document === 'undefined' || !document.head) return;
      if (document.getElementById('sw44css')) return;
      const css = document.createElement('style');
      css.id = 'sw44css';
      css.textContent = `.sw44wrap{margin-top:12px;padding-top:8px;border-top:1px dashed rgba(200,184,255,.35)}
.sw44wrap h4{margin:0 0 4px;color:#c8b8ff;font-size:14px}
.sw44row{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:6px 0;font-size:13px}
.sw44row b{min-width:4.5em;color:#e8e0ff}
.sw44st{font-size:12px;opacity:.9}.sw44st.ok{color:#9dffb0}.sw44st.dim{opacity:.65}
.sw44b{min-height:36px}.sw44b[data-off],.sw44b:disabled{filter:grayscale(.7) brightness(.85)}
.sw44hint{flex:1 1 100%;opacity:.75;font-size:11px}
.sw44flavor{font-style:italic;opacity:.85}`;
      document.head.appendChild(css);
    } catch (e) {}
  }

  function hook() {
    if (UI44._hooked || off()) return;
    const S = SW();
    if (!S) return;
    try {
      if (typeof UI !== 'undefined' && UI && UI.p_dungeon26 && !UI.p_dungeon26._sw44) {
        const _p = UI.p_dungeon26;
        UI.p_dungeon26 = function (b, re) {
          const r = _p.apply(this, arguments);
          try {
            if (!off() && !UI44.off) UI44.appendToPanel(b, re);
          } catch (e) { console.warn('[sweep44_ui] panel', e); }
          return r;
        };
        UI.p_dungeon26._sw44 = 1;
        UI44._hooked = true;
      }
    } catch (e) { console.warn('[sweep44_ui] hook', e); }
    try { UI44.ensureExitHook(); } catch (e) {}
    try { UI44.tryTit39(); } catch (e) {}
    try { injectCss(); } catch (e) {}
  }

  function dev44() {
    const reg = () => {
      const render = (box, ctx) => {
        try {
          const G = getG();
          const S = SW();
          if (!G || !S) { box.innerHTML = '<p class="hint">未开局或 Sweep44 未加载</p>'; return; }
          const st = S.st(G);
          const full = st && st.full ? Object.keys(st.full).filter(k => st.full[k] === 1).join(',') : '';
          box.innerHTML = `<p class="hint">扫荡44 · n=${st.n|0}/${S.CAP} · tot=${st.tot|0} · y=${st.y} · full=[${esc(full)}] · left=${S.left(G)} · tit39Deferred=${UI44.tit39Deferred ? '1' : '0'}</p>` +
            ['full0:首通练气', 'full1:首通筑基', 'go:扫荡×1练气', 'cap:本年用满', 'clr:清空本年n', 'panel:打开秘境面板', 'off:开关off'].map(x => {
              const [a, n] = x.split(':');
              return `<button class="opt" data-a="${a}">${n}</button>`;
            }).join('');
          box.onclick = async (e) => {
            const t = e.target.closest && e.target.closest('button[data-a]');
            const a = t && t.dataset && t.dataset.a; if (!a) return;
            const G2 = getG(); const S2 = SW(); if (!G2 || !S2) return;
            if (a === 'full0') { S2.markFull(G2, 0, true); ctx && ctx.toast && ctx.toast('练气已首通'); }
            else if (a === 'full1') { S2.markFull(G2, 1, true); ctx && ctx.toast && ctx.toast('筑基已首通'); }
            else if (a === 'go') {
              S2.markFull(G2, 0, true);
              const r = await S2.go(G2, 0, 1, { confirm: false });
              ctx && ctx.toast && ctx.toast(r && r.ok ? '扫荡完成' : ('失败:' + (r && r.reason)));
            } else if (a === 'cap') {
              const st2 = S2.st(G2); st2.n = S2.CAP; st2.y = G2.year;
              ctx && ctx.toast && ctx.toast('本年已满');
            } else if (a === 'clr') {
              const st2 = S2.st(G2); st2.n = 0; st2.y = G2.year;
              ctx && ctx.toast && ctx.toast('已清本年次数');
            } else if (a === 'panel') {
              try { await UI.panel('dungeon26'); } catch (err) {}
            } else if (a === 'off') {
              S2.off = !S2.off; ctx && ctx.toast && ctx.toast('off=' + S2.off);
            }
            ctx && ctx.save && ctx.save();
            if (ctx && ctx.rerender) ctx.rerender(); else render(box, ctx);
          };
        } catch (err) {
          box.innerHTML = '<p class="hint">扫荡44 面板错误</p>';
          console.warn('[sweep44_ui] dev', err);
        }
      };
      if (typeof W !== 'undefined' && W.DevPanel && typeof DevPanel.registerTab === 'function') {
        DevPanel.registerTab('sweep44', '扫荡44', render);
        return true;
      }
      try {
        const tabs = (W.DevTabs = W.DevTabs || []);
        if (!tabs.some(t => t && (t.key === 'sweep44' || t.id === 'sweep44'))) {
          tabs.push({ key: 'sweep44', id: 'sweep44', name: '扫荡44', render });
        }
        return true;
      } catch (e) { return false; }
    };
    if (typeof W !== 'undefined') {
      if (!reg()) setTimeout(reg, 500);
    }
  }

  W.Sweep44UI = UI44;
  if (typeof module !== 'undefined' && module.exports) module.exports = UI44;

  const boot = () => {
    if (!SW()) { setTimeout(boot, 0); return; }
    if (typeof UI !== 'undefined') {
      try { hook(); } catch (e) { console.warn('[sweep44_ui] hook', e); }
      try { dev44(); } catch (e) {}
    } else {
      try { UI44.tryTit39(); } catch (e) {}
    }
  };
  boot();
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));

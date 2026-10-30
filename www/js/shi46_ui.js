// ======================= 3.9.6 亲传功课·出师 shi46 第 2 轮 UI 接线（§20）=======================
// 只包装：UI.p_legacy26 追加功课/出师区块；亲传 Talk.extra 功课入口；盟友回访已由 shi46.js；
// 年终/出师/回访卡走 SHI46.* → UI.card；DevPanel「师徒46」（若逻辑层未挂则补挂）。
// 按钮一律 onclick= 赋值（或 _shi46ui 已绑则跳过），禁止重复 addEventListener，防 re() 叠监听。
// keepFnMarks 重包；Talk.extra 上层结果归一成数组。守 storyBlock / B.on / AUTO·AFK。
// 不改 game/talk/data/ui/battle/main/legacy26/ux23/shi46 正文（只包装）。
'use strict';
(function (W) {
  const S = () => {
    try { if (typeof SHI46 !== 'undefined' && SHI46) return SHI46; } catch (e) {}
    return (W && W.SHI46) || null;
  };
  const getG = () => {
    try { if (typeof Game !== 'undefined' && Game && Game.G) return Game.G; } catch (e) {}
    return null;
  };
  const off = () => {
    const sh = S();
    return !sh || sh.off;
  };
  const T = () => {
    const sh = S();
    return (sh && sh.TEXT) || (W && W.TEXT_SHI46) || {};
  };
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const keepFnMarks = (src, dst, selfKey) => {
    const sh = S();
    if (sh && typeof sh.keepFnMarks === 'function') return sh.keepFnMarks(src, dst, selfKey);
    if (!src || !dst) return dst;
    try {
      for (const k of Object.keys(src)) {
        if (k.charAt(0) !== '_') continue;
        if (selfKey && k === selfKey) continue;
        try { dst[k] = src[k]; } catch (e) {}
      }
    } catch (e) {}
    return dst;
  };

  const UI46 = {
    off: false,
    _hooked: false,
    _talkHooked: false,
    _clicks: 0, // 单测可观察：真实点击计数（不叠监听时 = 点击次数）

    storyBlock() {
      const sh = S();
      if (sh && typeof sh.storyBlock === 'function') return sh.storyBlock();
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
      const sh = S();
      if (sh && typeof sh.canPopup === 'function') return sh.canPopup();
      return !this.storyBlock();
    },
    autoOn() {
      try { if (typeof AUTO !== 'undefined' && AUTO && AUTO.on) return true; } catch (e) {}
      try { if (typeof AFK !== 'undefined' && AFK && AFK.on) return true; } catch (e) {}
      return false;
    },
    toast(msg, c) {
      try { if (typeof UI !== 'undefined' && UI.toast) UI.toast(msg, c); } catch (e) {}
    },

    /** 面板 HTML（§20.6） */
    blockHtml(G) {
      const sh = S();
      if (!sh || !G || off() || this.off) return '';
      const info = sh.panelInfo(G);
      if (!info || info.off) return '';
      const Tx = T();
      const ui = Tx.ui || {};
      let body = '';
      if (info.empty) {
        body = `<p class="hint">${esc(info.emptyText || ui.empty || '')}</p>`;
        if (info.ally) {
          const a = info.ally;
          const y0 = a.y0 != null ? a.y0 : '?';
          body += `<p class="hint">${esc(fill(ui.grad_done || '已出师：{n}（盟友）', { n: a.n || a.id }))} · 出师于第 ${esc(y0)} 年</p>`;
          body += `<p class="hint">${esc(ui.ally_hint || '')}</p>`;
        }
      } else {
        const mood = fill(ui.mood || '心境 {m}/100', { m: info.mood });
        const lvl = fill(ui.lvl || '修为 {lv} 级', { lv: info.lvl });
        const techs = fill(ui.techs || '已授功法 {n} 门', { n: info.techs });
        body += `<p class="hint">【${esc(info.name)}】${esc(mood)}　${esc(lvl)}　${esc(techs)}</p>`;
        body += `<p class="hint">本年功课 ${info.n | 0}/${info.cap | 0}</p>`;
        const hwDis = !info.canHw ? ' data-off="1" disabled' : '';
        const gradDis = !info.canGrad ? ' data-off="1" disabled' : '';
        body += `<button class="opt sm shi46b" data-shi="hw"${hwDis}>${esc(info.hwBtn || ui.hw_btn || '📜 布置功课')}</button>`;
        body += `<button class="opt sm shi46b" data-shi="grad"${gradDis}>${esc(info.gradBtn || ui.grad_btn || '🎓 准许出师')}</button>`;
        if (!info.canHw && (info.n | 0) >= (info.cap | 0)) {
          body += `<small class="shi46hint">${esc(fill(ui.hw_busy || '', { n: info.n, cap: info.cap }))}</small>`;
        } else if (!info.canHw) {
          body += `<small class="shi46hint">${esc(ui.hw_noap || '')}</small>`;
        }
        if (!info.canGrad) {
          body += `<small class="shi46hint">${esc(info.gradLock || '')}</small>`;
        }
        if (info.ally) {
          const a = info.ally;
          body += `<p class="hint">盟友：${esc(a.n || a.id)}（出师于第 ${esc(a.y0 != null ? a.y0 : '?')} 年）</p>`;
        }
      }
      return `<div class="shi46wrap" data-shi46="1">
        <h4>${esc(info.sec || ui.sec || '亲传功课 · 出师')}</h4>
        ${body}
      </div>`;
    },

    async onHw(re) {
      if (off() || this.off) return { ok: false, reason: 'off' };
      if (!this.canPopup()) return { ok: false, reason: 'blocked' };
      if (this.autoOn()) {
        this.toast((T().toast && T().toast.blocked) || '自动任务中不布置功课');
        return { ok: false, reason: 'auto' };
      }
      const sh = S(); const G = getG();
      if (!sh || !G) return { ok: false, reason: 'nog' };
      try {
        const r = await sh.doHw(G, {});
        if (typeof re === 'function') re();
        return r;
      } catch (e) {
        console.warn('[shi46_ui] doHw', e);
        return { ok: false, reason: 'err' };
      }
    },

    async onGrad(re) {
      if (off() || this.off) return { ok: false, reason: 'off' };
      if (!this.canPopup()) return { ok: false, reason: 'blocked' };
      if (this.autoOn()) {
        this.toast((T().toast && T().toast.blocked) || '自动任务中不准许出师');
        return { ok: false, reason: 'auto' };
      }
      const sh = S(); const G = getG();
      if (!sh || !G) return { ok: false, reason: 'nog' };
      try {
        const r = await sh.graduate(G, null, {});
        if (typeof re === 'function') re();
        return r;
      } catch (e) {
        console.warn('[shi46_ui] graduate', e);
        return { ok: false, reason: 'err' };
      }
    },

    /** 绑定按钮：onclick= 赋值；已绑 _shi46ui 则跳过（防同节点二次 wire） */
    wireBlock(root, re) {
      if (!root || !root.querySelectorAll) return 0;
      let n = 0;
      const btns = root.querySelectorAll('button.shi46b[data-shi]');
      btns.forEach(el => {
        if (el._shi46ui) return;
        el._shi46ui = 1;
        el.onclick = async (ev) => {
          if (el.disabled || el.getAttribute('data-off')) return;
          UI46._clicks = (UI46._clicks | 0) + 1;
          const act = el.getAttribute('data-shi');
          if (act === 'hw') await UI46.onHw(re);
          else if (act === 'grad') await UI46.onGrad(re);
        };
        n++;
      });
      return n;
    },

    appendToPanel(b, re) {
      if (off() || this.off || !b) return false;
      const G = getG();
      if (!G) return false;
      // 去掉旧块（re 时 innerHTML 已清；若仅 append 两次则先剥）
      try {
        if (b.querySelectorAll) {
          const old = b.querySelectorAll('.shi46wrap');
          old.forEach(n => { try { n.parentNode && n.parentNode.removeChild(n); } catch (e) {} });
        }
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

    /** 亲传对话入口：布置功课（非 SAFE；文案不以「开始」起头） */
    apprenticeTalkOpt(id) {
      if (off() || this.off || !id) return null;
      if (!this.canPopup() || this.autoOn()) return null;
      const G = getG(); const sh = S();
      if (!G || !sh || G.apprentice !== id) return null;
      if (!sh.canHw(G)) return null;
      const lab = (T().ui && T().ui.hw_btn) || '📜 布置功课（1 行动力）';
      return [lab, async () => { await UI46.onHw(null); }];
    }
  };

  function fill(tpl, vars) {
    let s = String(tpl == null ? '' : tpl);
    if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]));
    return s;
  }

  function injectCss() {
    try {
      if (typeof document === 'undefined' || !document.head) return;
      if (document.getElementById('shi46css')) return;
      const css = document.createElement('style');
      css.id = 'shi46css';
      css.textContent = `.shi46wrap{margin-top:12px;padding-top:8px;border-top:1px dashed rgba(255,216,160,.35)}
.shi46wrap h4{margin:0 0 4px;color:#ffd8a0;font-size:14px}
.shi46b{min-height:36px;margin:4px 4px 4px 0}.shi46b[data-off],.shi46b:disabled{filter:grayscale(.7) brightness(.85)}
.shi46hint{display:block;opacity:.75;font-size:11px;margin:2px 0 6px}`;
      document.head.appendChild(css);
    } catch (e) {}
  }

  function hookPanel() {
    if (UI46._hooked || off()) return;
    try {
      if (typeof UI !== 'undefined' && UI && typeof UI.p_legacy26 === 'function' && !UI.p_legacy26._shi46ui) {
        const _p = UI.p_legacy26;
        UI.p_legacy26 = function (b, re) {
          const r = _p.apply(this, arguments);
          try {
            if (!off() && !UI46.off) UI46.appendToPanel(b, re);
          } catch (e) { console.warn('[shi46_ui] panel', e); }
          return r;
        };
        UI.p_legacy26._shi46ui = 1;
        keepFnMarks(_p, UI.p_legacy26, '_shi46ui');
        UI46._hooked = true;
      }
    } catch (e) { console.warn('[shi46_ui] hookPanel', e); }
  }

  function hookTalk() {
    if (UI46._talkHooked || off()) return;
    try {
      if (typeof Talk === 'undefined' || !Talk) return;
      if (Talk.extra && Talk.extra._shi46ui) { UI46._talkHooked = true; return; }
      const _ex = Talk.extra;
      Talk.extra = function (id) {
        // 归一上层为数组（M2 / §20）
        const out = [];
        try {
          const prev = _ex ? _ex.apply(this, arguments) : [];
          if (Array.isArray(prev) && prev.length) out.push.apply(out, prev);
        } catch (e) {}
        try {
          const opt = UI46.apprenticeTalkOpt(id);
          if (opt) out.push(opt);
        } catch (e) {}
        return out;
      };
      Talk.extra._shi46ui = 1;
      keepFnMarks(_ex, Talk.extra, '_shi46ui');
      // 保留 Talk 对象级标记
      try { if (Talk._shi46) { /* keep */ } } catch (e) {}
      UI46._talkHooked = true;
    } catch (e) { console.warn('[shi46_ui] hookTalk', e); }
  }

  function dev46() {
    const sh0 = S();
    // 逻辑层已挂 DevPanel 则不再重复注册
    if (sh0 && sh0._dev) return true;
    const reg = () => {
      const render = (box, ctx) => {
        try {
          const G = getG();
          const sh = S();
          if (!G || !sh) { box.innerHTML = '<p class="hint">未开局或 SHI46 未加载</p>'; return; }
          const s = sh.ensure(G);
          const meta = sh.ensureMeta() || {};
          const Tx = T();
          box.innerHTML = `<p class="hint">${esc((Tx.dev && Tx.dev.hint) || '亲传功课/出师（G.shi46）。仅开发者模式。')}</p>
            <p>off=${sh.off} mood=${s ? s.mood : '-'} n=${s ? s.n : '-'} lessons=${s ? s.lessons : '-'}
            ally=${s && s.ally ? s.ally.id : '-'} totGrad=${meta.totGrad || 0}</p>
            <button class="opt" data-a="ap">收徒假数据</button>
            <button class="opt" data-a="mood">mood=100</button>
            <button class="opt" data-a="ready">lvl+techs</button>
            <button class="opt" data-a="hwok">功课成功</button>
            <button class="opt" data-a="hwfail">功课失败</button>
            <button class="opt" data-a="grad">强制出师</button>
            <button class="opt" data-a="clr">清 ally</button>
            <button class="opt" data-a="off">开关 off</button>
            <button class="opt" data-a="year">年终卡</button>
            <button class="opt" data-a="panel">打开传承面板</button>`;
          // onclick= 赋值，不 addEventListener
          box.onclick = async (ev) => {
            const t = ev.target && ev.target.closest && ev.target.closest('button[data-a]');
            const a = t && t.getAttribute && t.getAttribute('data-a');
            if (!a || !G) return;
            if (a === 'ap' && !G.apprentice) {
              G.apprentice = 'cuihua'; G.apprenticeLvl = 1; G.apprenticeTechs = {};
              G.aff = G.aff || {}; G.aff.cuihua = Math.max(G.aff.cuihua || 0, 80);
              sh.ensure(G);
            } else if (a === 'mood') { sh.ensure(G).mood = 100; }
            else if (a === 'ready') {
              G.apprenticeLvl = Math.max(G.apprenticeLvl || 0, sh.GRAD_LV);
              G.apprenticeTechs = G.apprenticeTechs || {};
              G.apprenticeTechs.t1 = 1; G.apprenticeTechs.t2 = 1;
              sh.ensure(G).mood = Math.max(sh.ensure(G).mood, sh.GRAD_MOOD);
              G.aff = G.aff || {}; if (G.apprentice) G.aff[G.apprentice] = Math.max(G.aff[G.apprentice] || 0, sh.GRAD_AFF);
            } else if (a === 'hwok') await sh.doHw(G, { silent: true, forceOk: true });
            else if (a === 'hwfail') await sh.doHw(G, { silent: true, forceFail: true });
            else if (a === 'grad') {
              sh.ensure(G).mood = 100;
              G.apprenticeLvl = Math.max(G.apprenticeLvl || 0, sh.GRAD_LV);
              G.apprenticeTechs = { t1: 1, t2: 1 };
              if (G.apprentice) { G.aff = G.aff || {}; G.aff[G.apprentice] = Math.max(G.aff[G.apprentice] || 0, sh.GRAD_AFF); }
              await sh.graduate(G, 'none', { silent: true });
            } else if (a === 'clr') { sh.ensure(G).ally = null; }
            else if (a === 'off') { sh.off = !sh.off; }
            else if (a === 'year') await sh.yearReview(G, {});
            else if (a === 'panel') { try { await UI.panel('legacy26'); } catch (err) {} }
            ctx && ctx.save && ctx.save();
            if (ctx && ctx.rerender) ctx.rerender(); else render(box, ctx);
          };
        } catch (err) {
          box.innerHTML = '<p class="hint">师徒46 面板错误</p>';
          console.warn('[shi46_ui] dev', err);
        }
      };
      if (typeof W !== 'undefined' && W.DevPanel && typeof DevPanel.registerTab === 'function') {
        DevPanel.registerTab('shi46', (T().dev && T().dev.tab) || '师徒46', render);
        if (S()) S()._dev = 1;
        return true;
      }
      try {
        const tabs = (W.DevTabs = W.DevTabs || []);
        if (!tabs.some(t => t && (t.key === 'shi46' || t.id === 'shi46'))) {
          tabs.push({ key: 'shi46', id: 'shi46', name: '师徒46', render });
        }
        if (S()) S()._dev = 1;
        return true;
      } catch (e) { return false; }
    };
    if (typeof W !== 'undefined') {
      if (!reg()) setTimeout(reg, 500);
    }
    return true;
  }

  W.Shi46UI = UI46;
  W.SHI46UI = UI46;
  if (typeof module !== 'undefined' && module.exports) module.exports = UI46;

  const boot = () => {
    if (!S()) { setTimeout(boot, 0); return; }
    try { if (typeof S().wire === 'function') S().wire(); } catch (e) {}
    try { hookPanel(); } catch (e) { console.warn('[shi46_ui] hookPanel', e); }
    try { hookTalk(); } catch (e) {}
    try { injectCss(); } catch (e) {}
    try { dev46(); } catch (e) {}
  };
  boot();
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));

// ======================= 4.1 分支剧情 v1 第一线 route41（规格：见 roadmap_after_4.0.md；来源 design_feedback_v23.md §E.2） =======================
// 只包装：不改 game.js / talk.js / data.js / ui.js / content22.js / content23.js 正文，不升 G.v，老档惰性补默认。
// 第一线只做分歧点 + 路线存档：拿到祖传欠条（ITEMS.bill）后的首次年结算弹出分歧卡；选项文案只用 §E.2 原文三句 + “以后再说”。
// 专属章节与专属结局（天道合伙人 / 三界免息日 / 天道董事长）不在本版做，不编台词、不编数值效果。
// 路线效果只用已有系统：dodge 写 G.flags.debt_union = 1（解锁 events22.js 已有的负债者联盟事件）；pay / buy 只记路线与 DevPanel 展示。
// 守卫：storyBlock / B.on / UI.modal / AUTO.on / AFK.on；keepFnMarks；选项文案不以「开始」起首、不含 UNSAFE 词，自动任务不会代选。
'use strict';
(function (W) {
  const TEXT_ROUTE41 = {
    meta: { id: 'TEXT_ROUTE41', ver: '4.1', module: 'route41.js', title: '分支剧情 v1 第一线', basedOn: ['design_feedback_v23.md§E.2'] },
    card: {
      title: '祖传欠条',
      body: '你手里捏着那张祖传欠条，落款是天道讨债司·外包部。欠条上的利息还在涨。\n\n这笔账，你打算怎么算？',
      defer: '以后再说'
    },
    dev: { tab: '路线41', hint: '分支剧情 v1 第一线（G.route）。仅开发者模式。标签勿加 SAFE 前缀。' }
  };
  try { JSON.parse(JSON.stringify(TEXT_ROUTE41)); } catch (e) { console.warn('[route41] TEXT invalid', e); }

  function keepFnMarks(src, dst, selfMark) {
    if (!src || !dst) return dst;
    try {
      for (const k of Object.keys(src)) {
        if (k.charAt(0) !== '_') continue;
        if (selfMark && k === selfMark) continue;
        try { dst[k] = src[k]; } catch (e) {}
      }
    } catch (e) {}
    return dst;
  }

  const ROUTE41 = {
    off: false,
    ROUTES: [
      { id: 'pay', line: '欠债还钱，天经地义。', name: '还债线' },
      { id: 'dodge', line: '我没签字，不认。', name: '赖账线' },
      { id: 'buy', line: '欠条？我全收了。', name: '收购线' }
    ],
    TEXT: TEXT_ROUTE41,
    G: function () { try { return typeof Game !== 'undefined' ? Game.G : null; } catch (e) { return null; } },
    routeOf: function (G) {
      G = G || this.G();
      if (!G) return null;
      const r = G.route;
      return (r === 'pay' || r === 'dodge' || r === 'buy') ? r : null;
    },
    ensure: function (G) {
      G = G || this.G();
      if (!G || typeof G !== 'object') return null;
      if (!G.route41 || typeof G.route41 !== 'object') G.route41 = { v: 1, offerY: 0 };
      const S = G.route41;
      if (typeof S.offerY !== 'number' || !isFinite(S.offerY)) S.offerY = 0;
      return S;
    },
    hasBill: function (G) {
      G = G || this.G();
      if (!G) return false;
      try {
        if (typeof Game !== 'undefined' && Game && typeof Game.has === 'function') return !!Game.has('bill');
      } catch (e) {}
      try { return !!((G.inv || {}).bill > 0); } catch (e) { return false; }
    },
    autoOn: function () {
      try { if (typeof AUTO !== 'undefined' && AUTO && AUTO.on) return true; } catch (e) {}
      try { if (typeof AFK !== 'undefined' && AFK && AFK.on) return true; } catch (e) {}
      return false;
    },
    canPopup: function (G) {
      if (this.off) return false;
      G = G || this.G();
      if (!G) return false;
      try {
        if (typeof NPC37 !== 'undefined' && NPC37 && typeof NPC37.storyBlock === 'function' && NPC37.storyBlock()) return false;
      } catch (e) {}
      try { if (typeof B !== 'undefined' && B && B.on) return false; } catch (e) {}
      try { if (typeof UI !== 'undefined' && UI && UI.modal) return false; } catch (e) {}
      if (this.autoOn()) return false;
      return true;
    },
    shouldOffer: function (G) {
      G = G || this.G();
      if (!G || this.off || G.dead) return false;
      if (this.routeOf(G)) return false;
      if (!this.hasBill(G)) return false;
      const S = this.ensure(G);
      if (!S) return false;
      if (S.offerY === (G.year || 0)) return false;
      return this.canPopup(G);
    },
    applyRoute: function (G, routeId) {
      G = G || this.G();
      if (!G || this.off) return { ok: false, reason: 'off' };
      const ok = this.ROUTES.some(function (r) { return r.id === routeId; });
      if (!ok) return { ok: false, reason: 'route' };
      if (this.routeOf(G)) return { ok: false, reason: 'chosen' };
      G.route = routeId;
      if (routeId === 'dodge') {
        G.flags = G.flags || {};
        G.flags.debt_union = 1;
      }
      const S = this.ensure(G);
      S.offerY = G.year || 0;
      try { if (typeof Game !== 'undefined' && Game.save) Game.save(); } catch (e) {}
      return { ok: true, route: routeId };
    },
    // idx: 0-2 选路线，3 延期（只记 offerY，不写 G.route），其他非法值不写档。
    choose: function (G, idx) {
      G = G || this.G();
      if (!G || this.off) return { ok: false, reason: 'off' };
      if (idx === 3) {
        const S = this.ensure(G);
        S.offerY = G.year || 0;
        try { if (typeof Game !== 'undefined' && Game.save) Game.save(); } catch (e) {}
        return { ok: false, reason: 'defer' };
      }
      const r = this.ROUTES[idx];
      if (!r) return { ok: false, reason: 'choice' };
      return this.applyRoute(G, r.id);
    },
    opts: function () {
      return this.ROUTES.map(function (r) { return r.line; }).concat([TEXT_ROUTE41.card.defer]);
    },
    wire: function () {
      try {
        if (typeof Game !== 'undefined' && Game && Game.yearEnd && !Game.yearEnd._route41) {
          const _ye = Game.yearEnd;
          Game.yearEnd = async function () {
            const r = await _ye.apply(this, arguments);
            try {
              const G = this.G;
              if (!ROUTE41.off && G && !G.dead && ROUTE41.shouldOffer(G)) {
                const c = await UI.card(TEXT_ROUTE41.card.title, TEXT_ROUTE41.card.body, 'i:bill', ROUTE41.opts());
                ROUTE41.choose(G, c);
              }
            } catch (e) { try { console.warn('[route41] yearEnd', e); } catch (e2) {} }
            return r;
          };
          Game.yearEnd._route41 = 1;
          keepFnMarks(_ye, Game.yearEnd, '_route41');
        }
        if (typeof Game !== 'undefined' && Game && Game.newLife && !Game.newLife._route41) {
          const _nl = Game.newLife;
          Game.newLife = function () {
            const r = _nl.apply(this, arguments);
            try {
              const G = this.G;
              if (G) { delete G.route; delete G.route41; }
            } catch (e) {}
            return r;
          };
          Game.newLife._route41 = 1;
          keepFnMarks(_nl, Game.newLife, '_route41');
        }
        try {
          if (typeof DevPanel !== 'undefined' && DevPanel && DevPanel.registerTab) {
            DevPanel.registerTab('route41', '路线41', function (box) {
              const G = ROUTE41.G();
              const route = ROUTE41.routeOf(G);
              const S = G ? ROUTE41.ensure(G) : null;
              box.innerHTML = '<p class="hint">分支剧情 v1 第一线（G.route）。专属章节与专属结局不在 4.1 做。</p>' +
                '<p>路线：' + (route || '未选（主线）') + '</p>' +
                '<p>上次问过年份：' + (S ? S.offerY : '-') + '</p>' +
                '<p>负债者联盟 flag：' + ((G && G.flags && G.flags.debt_union) ? '1' : '0') + '</p>';
            });
          }
        } catch (e) {}
      } catch (e) { try { console.warn('[route41] wire', e); } catch (e2) {} }
      return true;
    }
  };

  W.Route41 = ROUTE41;
  W.TEXT_ROUTE41 = TEXT_ROUTE41;
  try { ROUTE41.wire(); } catch (e) { console.warn('[route41]', e); }
})(typeof window !== 'undefined' ? window : globalThis);

'use strict';
// v2.3：静态美术改为 AI 生成插画（tools/gen_art.py 产出 assets/gen/*，键表见 assets/gen/gen.js 的 window.GENART）
// 有插画的角色：头像(HUD/对话/面板) → por_*，对话框 → 半身 bust_*，抽卡卡面 → card_*，标题页 → title.webp；其余继续用 3D 渲染头像
(function () {
  const GA = window.GENART || { por: {}, bust: {}, card: {} };
  const url = (t, n) => `assets/gen/${t}_${n}.webp`;
  const _por = porCss;
  porCss = function (key, size = 72) {
    const n = GA.por && GA.por[key];
    if (!n) return _por(key, size);
    return `background:url(${url('por', n)}) center/cover no-repeat;width:${size}px;height:${size}px;--gen:${n}`;
  };
  if (GA.icons && GA.iconsz) { const _ic = iconCss; const [cell, aw, ah] = GA.iconsz;
    iconCss = function (key, size = 40) { const f = GA.icons[key]; if (!f) return _ic(key, size); const k = size / cell; return `background:url(assets/gen/icons_gen.webp) ${-f[0] * k}px ${-f[1] * k}px/${aw * k}px ${ah * k}px no-repeat;width:${size}px;height:${size}px`; }; }
  window.genCard = key => GA.card && GA.card[key] ? url('card', GA.card[key]) : null;
  // 对话框：有半身像的角色换成半身立绘（站在对话框左上方）
  const mo = new MutationObserver(ms => {
    for (const m of ms) for (const nd of m.addedNodes) {
      if (!(nd instanceof HTMLElement)) continue;
      for (const dp of nd.querySelectorAll ? nd.querySelectorAll('.dlg .dp') : []) {
        const n = dp.style.getPropertyValue('--gen').trim(); if (!n || !GA.bust) continue;
        const key = Object.keys(GA.bust).find(k => GA.bust[k] === n); if (!key) continue;
        dp.classList.add('gbust'); dp.style.backgroundImage = `url(${url('bust', n)})`; dp.closest('.dlg').classList.add('hasbust');
      }
    }
  });
  const start = () => { const md = document.getElementById('modals') || document.body; mo.observe(md, { childList: true, subtree: true }); if (GA.title) document.body.classList.add('gentitle'); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

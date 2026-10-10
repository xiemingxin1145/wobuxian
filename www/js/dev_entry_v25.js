'use strict';
// v2.5 开发者入口：试炼场 + 阶段3 债务奇遇（已接真实 UI/存档）

(function () {
  function addEntry() {
    if (document.getElementById('v25-entry')) return;
    const btn = document.createElement('button');
    btn.id = 'v25-entry';
    btn.textContent = '试炼场';
    btn.style.cssText = 'position:fixed;right:12px;bottom:120px;z-index:9999;padding:8px 14px;background:#2a3a5a;color:#ffe680;border:1px solid #ffe680;border-radius:20px;font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,.4);';
    btn.onclick = async () => {
      const c = confirm('进入独立遭遇战原型？\n\uff08不影响存档，可返回）\n\n取消则执行阶段3债务奇遇（会改真实债务和好感）。');
      if (c) {
        location.href = 'prototypes/encounter/index.html';
      } else if (window.Stage3 && window.Game && Game.G) {
        await Stage3.test(Game.G);
      }
    };
    document.body.appendChild(btn);
  }

  let clicks = 0, last = 0;
  document.addEventListener('click', e => {
    const t = e.target;
    if (!t || !t.closest || !t.closest('#title, .ver, #ver')) return;
    const now = Date.now();
    if (now - last > 1500) clicks = 0;
    last = now;
    if (++clicks >= 7) {
      clicks = 0;
      addEntry();
      if (window.UI && UI.toast) UI.toast('已开启试炼场入口', '#ffe680');
    }
  });

  if (location.hash === '#dev' || location.search.includes('dev=1')) {
    setTimeout(addEntry, 500);
  }
})();

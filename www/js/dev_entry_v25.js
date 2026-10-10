'use strict';
// v2.5 开发者入口：试炼场 + 阶段3 债务奇遇 + 一键全套神装 + 即时战斗

(function () {
  function addEntry() {
    if (document.getElementById('v25-entry')) return;

    // 试炼场按钮
    const btn = document.createElement('button');
    btn.id = 'v25-entry';
    btn.textContent = '试炼场';
    btn.style.cssText = 'position:fixed;right:12px;bottom:120px;z-index:9999;padding:8px 14px;background:#2a3a5a;color:#ffe680;border:1px solid #ffe680;border-radius:20px;font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,.4);';
    btn.onclick = async () => {
      const c = confirm('进入独立遭遇战原型？\n\uff08不影响存档，可返回）\n\n取消则执行阶段3债务奇遇。');
      if (c) {
        location.href = 'prototypes/encounter/index.html';
      } else if (window.Stage3 && window.Game && Game.G) {
        await Stage3.test(Game.G);
      }
    };
    document.body.appendChild(btn);

    // 一键全套神装按钮
    const eqBtn = document.createElement('button');
    eqBtn.id = 'v25-eq';
    eqBtn.textContent = '全套神装';
    eqBtn.style.cssText = 'position:fixed;right:12px;bottom:170px;z-index:9999;padding:8px 14px;background:#3a2a5a;color:#ffb0ff;border:1px solid #ffb0ff;border-radius:20px;font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,.4);';
    eqBtn.onclick = () => {
      if (!window.Game || !Game.G) return;
      if (!confirm('一键生成并穿上全套最高品质装备？\n（仅开发者模式，影响当前存档）')) return;
      giveFullGodGear();
      if (window.UI && UI.toast) UI.toast('已穿上全套神装', '#ffb0ff');
      if (window.UI && UI.hud) UI.hud();
    };
    document.body.appendChild(eqBtn);

    // 即时战斗按钮
    const rtBtn = document.createElement('button');
    rtBtn.id = 'v25-rt';
    rtBtn.textContent = '即时战';
    rtBtn.style.cssText = 'position:fixed;right:12px;bottom:220px;z-index:9999;padding:8px 14px;background:#2a5a3a;color:#b0ffb0;border:1px solid #b0ffb0;border-radius:20px;font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,.4);';
    rtBtn.onclick = async () => {
      if (window.RealtimeBattle) {
        await RealtimeBattle.start();
      }
    };
    document.body.appendChild(rtBtn);
  }

  function giveFullGodGear() {
    const G = Game.G;
    if (!G.eqs) G.eqs = [];
    if (!G.eq) G.eq = {};
    const slots = ['weapon', 'armor', 'acc1', 'acc2', 'treasure'];
    slots.forEach((slot, i) => {
      const eq = {
        uid: 'dev_' + Date.now() + '_' + i,
        slot,
        name: '神装·' + slot,
        rar: 4,
        tier: 10,
        ic: 'sword_b',
        main: { atk: 999, def: 999, hp: 9999, mp: 9999 },
        aff: [],
      };
      G.eqs.push(eq);
      G.eq[slot] = eq.uid;
    });
    if (typeof Game.save === 'function') Game.save();
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
      if (window.UI && UI.toast) UI.toast('已开启开发者入口', '#ffe680');
    }
  });

  if (location.hash === '#dev' || location.search.includes('dev=1')) {
    setTimeout(addEntry, 500);
  }
})();

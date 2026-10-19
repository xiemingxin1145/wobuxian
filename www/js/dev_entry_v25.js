'use strict';
// v2.5 开发者入口：试炼场 + 阶段3 债务奇遇 + 一键全套神装 + 即时战斗
// 3.4.1 修：①不再自己数「标题页任意位置」的点击（原来在标题页随便点 7 下就会冒出按钮，且与 ux23 的开关不同步）——
//   改为跟随 ux23 的开发者开关（localStorage wbx2_dev），关掉开发者模式按钮就消失；
// ②浮动按钮 z-index 9999 盖在开发者面板/对话框上（挡住「关闭开发者模式」等）→ 改到弹窗层（#modals z=20）之下，只在游戏内显示；
// ③「全套神装」原来写的槽位 acc1/acc2 不存在、装备缺 base/aff 格式、名字带英文槽位名 → 改用 Game.makeEq 按真实 SLOTS 生成神品并穿上。
// 同样的四个入口也放进了开发者面板「调试」页（dev341.js）。
(function () {
  const on = () => localStorage.getItem('wbx2_dev') === '1';
  const B = [
    ['v25-entry', '试炼场', 120, '#2a3a5a', '#ffe680', () => trial()],
    ['v25-eq', '全套神装', 170, '#3a2a5a', '#ffb0ff', () => { if (!window.Game || !Game.G) return; if (!confirm('一键生成并穿上全套最高品质装备？\n（仅开发者模式，影响当前存档）')) return; giveFullGodGear(); if (window.UI && UI.toast) UI.toast('已穿上全套神装', '#ffb0ff'); if (window.UI && UI.hud) UI.hud(); }],
    ['v25-rt', '即时战', 220, '#2a5a3a', '#b0ffb0', async () => { if (window.RealtimeBattle) await RealtimeBattle.start(); }],
  ];
  async function trial() {
    const c = confirm('进入独立遭遇战原型？\n\uff08不影响存档，可返回）\n\n取消则执行阶段3债务奇遇。');
    if (c) location.href = 'prototypes/encounter/index.html';
    else if (window.Stage3 && window.Game && Game.G) await Stage3.test(Game.G);
  }
  function addEntry() {
    for (const [id, t, y, bg, fg, fn] of B) {
      if (document.getElementById(id)) continue;
      const btn = document.createElement('button'); btn.id = id; btn.className = 'v25b'; btn.textContent = t;
      btn.style.cssText = `position:fixed;right:12px;bottom:${y}px;z-index:7;padding:8px 14px;background:${bg};color:${fg};border:1px solid ${fg};border-radius:20px;font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,.4);`;
      btn.onclick = fn; document.body.appendChild(btn);
    }
  }
  function removeEntry() { for (const [id] of B) { const e = document.getElementById(id); if (e) e.remove(); } }
  function giveFullGodGear() {
    const G = Game.G; const tier = Math.max(7, G.realm + 1);
    for (const [slot] of SLOTS) {
      const bases = EQ_BASES[slot]; const bs = bases[slot === 'weapon' || slot === 'armor' ? bases.length - 1 : 0];
      const e = Game.makeEq(slot, tier, 4); e.base = bs[0]; e.ic = bs[1]; e.name = '神品·' + bs[0]; G.eqs.push(e); Game.equip(e.uid);
    }
    G.dev = 1; if (typeof Game.save === 'function') Game.save();
  }
  window.DevEntry25 = { trial, giveFullGodGear, addEntry, removeEntry };
  const st = document.createElement('style'); st.textContent = 'body:not(.ingame) .v25b{display:none!important}'; document.head.appendChild(st);
  if (location.search.includes('dev=1')) localStorage.setItem('wbx2_dev', '1');
  const sync = () => { if (on()) addEntry(); else removeEntry(); };
  setTimeout(sync, 500); setInterval(sync, 1000);
})();

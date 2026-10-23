'use strict';
// v2.5 开发者入口：试炼场 + 阶段3 债务奇遇 + 一键全套神装 + 即时战斗
// 3.4.1 修：①不再自己数「标题页任意位置」的点击（原来在标题页随便点 7 下就会冒出按钮，且与 ux23 的开关不同步）——
//   改为跟随 ux23 的开发者开关（localStorage wbx2_dev），关掉开发者模式按钮就消失；
// ②浮动按钮 z-index 9999、放在右下角，盖住了底部菜单（灵兽/伙伴/御剑/更多）和开发者面板（挡住「关闭开发者模式」等）
//   → 移到左侧 🛠 下方、弹窗层（#modals z=20）之下，只在游戏内显示；
// ③「全套神装」原来写的槽位 acc1/acc2 不存在、装备缺 base/aff 格式、名字带英文槽位名 → 改用 Game.makeEq 按真实 SLOTS 生成神品并穿上。
// ④ `Game` 是顶层 const，不在 window 上：原来的 `window.Game && Game.G` 永远为假 → 全套神装/阶段3 点了没反应；改用 `typeof Game`。
// ⑤ 试炼场原来 location.href 跳到 prototypes/encounter/（离开游戏页，返回要重新加载）→ 改为游戏内覆盖层 iframe 打开，✕ 关闭回到原地；
// ⑥ 即时战原来调 battle_realtime_prototype 的占位（没有循环驱动，Promise 永不结束）→ 改为用本图野怪打一场正式 RT27 实时战（与大地图遭遇同法临时启用 RT27）。
// 同样的入口也放进了开发者面板「调试」页（dev341.js）。
(function () {
  const on = () => localStorage.getItem('wbx2_dev') === '1';
  const B = [
    ['v25-entry', '试炼场', 0, '#2a3a5a', '#ffe680', () => trial()],
    ['v25-eq', '全套神装', 1, '#3a2a5a', '#ffb0ff', () => { if (!hasG()) return; if (!confirm('一键生成并穿上全套最高品质装备？\n（仅开发者模式，影响当前存档）')) return; giveFullGodGear(); if (window.UI && UI.toast) UI.toast('已穿上全套神装', '#ffb0ff'); if (window.UI && UI.hud) UI.hud(); }],
    ['v25-rt', '即时战', 2, '#2a5a3a', '#b0ffb0', () => rtFight()],
  ];
  const hasG = () => typeof Game !== 'undefined' && !!Game.G;
  const free = () => hasG() && typeof UX !== 'undefined' && UX.inMap();
  async function trial() {
    if (!hasG()) return;
    if (!free()) { UI.toast('对话/战斗中，稍后再试'); return; }
    const c = await UI.card('试炼场', '进入独立遭遇战原型（游戏内打开，不影响存档，✕ 关闭回到原地）？\n或者执行阶段 3 债务奇遇（真实改债务与好感）。', 'i:sk_swords', ['试炼场原型', '阶段3债务奇遇', '算了']);
    if (c === 0) openProto();
    else if (c === 1 && window.Stage3) { await Stage3.test(Game.G); if (UI.hud) UI.hud(); }
  }
  function openProto() {
    if (document.getElementById('v25-proto')) return;
    const w = document.createElement('div'); w.id = 'v25-proto';
    w.style.cssText = 'position:fixed;inset:0;z-index:30;background:#000;display:flex;flex-direction:column';
    w.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#2a1a10;color:#ffe680;font-weight:bold">试炼场（原型·不影响存档）<button id="v25-proto-x" style="width:44px;height:40px;font-size:20px;border-radius:10px">✕</button></div><iframe src="prototypes/encounter/index.html" style="flex:1;border:0;width:100%"></iframe>';
    document.body.appendChild(w); w.querySelector('#v25-proto-x').onclick = () => w.remove();
  }
  async function rtFight() {
    if (!free()) { if (hasG()) UI.toast('对话/战斗中，稍后再试'); return; }
    const info = MAPINFO[R.mapId] || {}; const mons = (info.mons || []).filter(m => MONS[m] && !MONS[m].boss); if (!mons.length) { UI.toast('本图没有野怪'); return; }
    const had = 'RT27' in window; window.RT27 = RT27; const G = Game.G; const m0 = G.rtMode; G.rtMode = 'realtime';
    try { await Game.fight(pick(mons), { tier: info.tier || G.realm, solo: true }); }
    finally { G.rtMode = m0; if (!had) delete window.RT27; if (UI.hud) UI.hud(); }
  }
  function addEntry() {
    for (const [id, t, y, bg, fg, fn] of B) {
      if (document.getElementById(id)) continue;
      const btn = document.createElement('button'); btn.id = id; btn.className = 'v25b'; btn.textContent = t;
      btn.style.cssText = `position:fixed;left:8px;top:calc(${222 + y * 40}px + env(safe-area-inset-top));z-index:7;padding:6px 10px;background:${bg};color:${fg};border:1px solid ${fg};border-radius:20px;font-size:12px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,.4);`;
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
  window.DevEntry25 = { trial, openProto, rtFight, giveFullGodGear, addEntry, removeEntry };
  const st = document.createElement('style'); st.textContent = 'body:not(.ingame) .v25b{display:none!important}'; document.head.appendChild(st);
  if (location.search.includes('dev=1')) localStorage.setItem('wbx2_dev', '1');
  const sync = () => { if (on()) addEntry(); else removeEntry(); };
  setTimeout(sync, 500); setInterval(sync, 1000);
})();

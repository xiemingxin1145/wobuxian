'use strict';
// ======================= 2.7② 月改岁迁（月级时间） =======================
// 设计原则：默认关闭（G.monthMode !== true），旧档/默认行为与年度制完全一致。
// 开启后：「过年」变「过月」，AP 按月平摊、修为月结、季节驱动，满 12 个月触发一次完整 yearEnd（腊月结算）。
// 月事件池为轻量新增，不改动既有 433 事件的年度触发。
const Time27 = {
  // 3.1③ 转正：月级时间默认开启（G.monthMode !== false）。旧档无该字段即默认月级（惰性兼容，不升 v、不清档）；
  // 显式设 false 可回年度制（#dev 按钮切换 / G.monthMode=false）。
  on() { return Game && Game.G && Game.G.monthMode !== false; },
  // 惰性兜底：G.month 缺省即 0；季节由月份推
  month() { return (Game.G && Game.G.month) || 0; },
  season() { // 0春 1夏 2秋 3冬
    const m = this.month();
    if (m >= 2 && m <= 4) return 0;
    if (m >= 5 && m <= 7) return 1;
    if (m >= 8 && m <= 10) return 2;
    return 3;
  },
  seasonName() { return ['春', '夏', '秋', '冬'][this.season()]; },
  SEASON_TINT: ['#d8ffd0', '#fff3c0', '#ffd9a8', '#cfe4ff'],
  apMonthly() { return Game.apMax() / 12; },

  // 过一个月
  async nextMonth() {
    const G = Game.G; if (G.dead || Game._busy) return; Game._busy = true;
    try {
      G.month = ((G.month || 0) + 1) % 12;
      const s = Game.stats();
      // 月度平摊 AP（按 12 分之一累加，取整显示）
      G.ap = Math.round((G.ap || 0) + this.apMonthly());
      // 月度例行修为（年修为的 1/12 打底，剩余仍由腊月结算补）
      let g = Game.addExp(Game.yearExp() * 0.5 / 12);
      G.hp = Math.min(s.mhp, G.hp + s.mhp * 0.05); G.mp = s.mmp;
      // 季节/月事件
      await this.runMonthEvent();
      UI.hud(); UI.save && Game.save();
      if (G.month === 0) {
        // 满 12 个月 → 腊月年结（释放外层 busy，yearEnd 自带 busy 守卫）
        Game._busy = false;
        await UI.yearFx(G.year, g);
        await Game.yearEnd();
      }
    } finally { Game._busy = false; }
  },

  // 轻量月事件池（按季节/境界概率，不影响主年度事件）
  MON_EVENTS: [
    { w: 1, t: '春风和煦', d: '山间灵气随草木生长而充沛，你打坐时格外顺畅。', fx: () => { Game.addExp(Game.yearExp() * 0.05); } },
    { w: 1, t: '夏日雷雨', d: '骤雨倾盆，你在洞中听雷悟机，心境澄明。', fx: () => { Game.addExp(Game.yearExp() * 0.04); Game.G.hp = Math.max(1, Game.G.hp - 5); } },
    { w: 1, t: '秋采收成', d: '林间野果成熟，你随手采得一袋灵果。', fx: () => { Game.G.stone += 20; } },
    { w: 1, t: '冬日苦寒', d: '天寒地冻，你烧了炭火取暖，耽搁了些修行。', fx: () => { Game.G.hp = Math.max(1, Game.G.hp - 8); } },
  ],
  async runMonthEvent() {
    if (Math.random() > 0.35) return; // 不是每个月都有事件
    const pool = this.MON_EVENTS;
    let r = Math.random() * pool.reduce((a, b) => a + b.w, 0);
    let ev = pool[0];
    for (const e of pool) { r -= e.w; if (r <= 0) { ev = e; break; } }
    ev.fx && ev.fx();
    await UI.card(`【${this.seasonName()}季·第${Gmonth(this)}月】${ev.t}`, ev.d, 'i:book_o', ['继续修行']);
  },
};
function Gmonth(t) { return t.month() + 1; }

// ---------- 包裹 UI.confirmYear / UI.hud（仅开启时生效） ----------
(function () {
  if (!window.UI || !Game) return;
  const _confirm = UI.confirmYear.bind(UI);
  UI.confirmYear = async function () {
    if (Time27.on()) {
      const G = Game.G;
      if (G.ap > 0) {
        const c = await UI.card('过月', `本月还剩 ${G.ap} 点行动力。\n确定要过到下一月吗？（第 ${G.year} 年 ${Time27.month() + 1} 月）`, 'i:coin', ['过月', '再逛逛']);
        if (c !== 0) return;
      }
      return Time27.nextMonth();
    }
    return _confirm();
  };
  // HUD：开启时年按钮显示 年/月
  const _hud = UI.hud.bind(UI);
  UI.hud = function (hpOv) {
    _hud(hpOv);
    if (Time27.on()) {
      const b = document.getElementById('yearbtn');
      if (b) b.innerHTML = `过月<br><small style="font-size:11px;opacity:.8">${Game.G.year}年${Time27.month() + 1}月·${Time27.seasonName()}</small>`;
    }
  };
})();

// ---------- 开发者开关（#dev 显示，实时/月级时间） ----------
(function () {
  if (!location.hash.includes('dev')) return;
  const t = setInterval(() => {
    if (!window.Game || !Game.G || document.getElementById('time27-mode')) return;
    clearInterval(t);
    const b = document.createElement('button');
    b.id = 'time27-mode';
    b.style.cssText = 'position:fixed;left:10px;bottom:calc(64px + env(safe-area-inset-bottom));z-index:9999;padding:6px 12px;border-radius:16px;background:#3a2a4a;color:#e0b0ff;border:1px solid #e0b0ff;font-size:12px';
    const sync = () => { b.textContent = (Game.G.monthMode ? '月级时间ON' : '年度制') + ' ⇄'; };
    b.onclick = () => {
      Game.G.monthMode = !Game.G.monthMode;
      if (Game.G.monthMode && Game.G.month == null) Game.G.month = 0;
      UI.toast(Game.G.monthMode ? '已切换月级时间（过月）' : '已切回年度制', '#e0b0ff');
      sync(); UI.hud(); Game.save && Game.save();
    };
    sync(); document.body.appendChild(b);
  }, 900);
})();

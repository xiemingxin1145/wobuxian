// 3.9.0 阵法 zf39 第 4 轮（即时战）：RT27 走 calcDmg 外包 ZF39.rtMult（锋矢 out / 玄武 inc / 北斗 crit）。
// 只在 RT27.on 时生效；回合制已由 zf39_hook+apply 处理，这里不再叠。没学/没布阵（rtMult=1/1/0）完全等同旧版。
// 挂在 zf39_ui / items40 之后（其 calcDmg 包之外）；不改存档键、不碰 game/battle/ui 等核心文件。
// rng：需要掷骰时走 Game.roll(p,'zf39')，没有则 Math.random（与 zf39.js 一致）。
(function (W) {
  'use strict';
  if (!W.ZF39) return;
  const Z = W.ZF39;
  // 备用掷骰（与 ZF39 内部 roll 同约定）：Game.roll → Math.random
  if (!Z.rtRoll) {
    Z.rtRoll = p => {
      try {
        const g = (typeof Game !== 'undefined' && Game) || W.Game;
        if (g && typeof g.roll === 'function') return !!g.roll(p, 'zf39');
      } catch (e) {}
      return Math.random() < p;
    };
  }
  if (W.__zf39Rt) return;
  if (typeof calcDmg !== 'function') return;
  W.__zf39Rt = 1;
  const curG = () => {
    try { if (typeof Game !== 'undefined' && Game && Game.G) return Game.G; } catch (e) {}
    return (W.Game && W.Game.G) || null;
  };
  const rtOn = () => {
    try { return typeof RT27 !== 'undefined' && !!RT27 && !!RT27.on; } catch (e) { return false; }
  };

  const _cd = calcDmg;
  calcDmg = function (a, d, sk) { // eslint-disable-line no-global-assign
    if (!rtOn()) return _cd.apply(this, arguments);
    let m;
    try { m = Z.rtMult(curG()); } catch (e) { return _cd.apply(this, arguments); }
    if (!m) return _cd.apply(this, arguments);
    const outAtk = a && (a.isPlayer || a.side === 0) && !(d && (d.isPlayer || d.side === 0));
    const inDef = d && (d.isPlayer || d.side === 0) && !(a && (a.isPlayer || a.side === 0));
    if (outAtk) {
      const old = a.crit;
      if (m.crit) a.crit = (a.crit || 0) + m.crit;
      let r;
      try { r = _cd.apply(this, arguments); } finally { if (m.crit) a.crit = old; }
      if (m.out !== 1) r.dm = Math.max(1, Math.round(r.dm * m.out));
      return r;
    }
    if (inDef) {
      const r = _cd.apply(this, arguments);
      if (m.inc !== 1) r.dm = Math.max(1, Math.round(r.dm * m.inc));
      return r;
    }
    return _cd.apply(this, arguments);
  };
  Z.rtHooked = true;
})(typeof window !== 'undefined' ? window : globalThis);

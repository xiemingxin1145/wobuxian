// 3.9.0 阵法 zf39 第 2 轮（战斗接入）：回合制斗法开局套用布下的战阵，欠条阵按回合补挂反伤。
// 只包 battle.js 的 battleLoop（开局 B.round===0 时调 ZF39.apply），并在第一次生效时给 B.round 装一个透明 getter/setter 调 ZF39.roundStart。
// 没学阵法 / 没布阵（G.zf39 不存在或 active 为空）时什么都不做，行为等同旧版；不改 battle.js / game.js，不新增存档字段。
// 即时战 rt27（ZF39.rtMult）、阵法面板 UI、秘境破阵在后续轮次接。
(function (W) {
  'use strict';
  if (!W.ZF39 || W.__zf39Hook) return;
  if (typeof battleLoop !== 'function' || typeof B === 'undefined' || !B) return;
  W.__zf39Hook = 1;
  const Z = W.ZF39;
  const curG = () => { try { if (typeof Game !== 'undefined' && Game && Game.G) return Game.G; } catch (e) {} return (W.Game && W.Game.G) || null; };
  const installRound = () => {
    if (B.__zf39r) return;
    let r = B.round;
    Object.defineProperty(B, '__zf39r', { value: 1 });
    Object.defineProperty(B, 'round', { configurable: true, enumerable: true,
      get() { return r; },
      set(v) { r = v; try { if (v > 1 && B.on && Z.lastFx) { const G = curG(); if (G) Z.roundStart(B.units, v, G); } } catch (e) { console.warn('[zf39] roundStart', e); } } });
  };
  const orig = battleLoop;
  const hooked = function () {
    Z.lastFx = null;
    try {
      if (B.round === 0 && Array.isArray(B.units)) {
        const G = curG();
        if (G && G.zf39 && Z.active(G).length) { Z.lastFx = Z.apply(B.units, G); installRound(); }
      }
    } catch (e) { console.warn('[zf39] apply', e); Z.lastFx = null; }
    return orig.apply(this, arguments);
  };
  battleLoop = hooked; // eslint-disable-line no-global-assign
  Z.hooked = true;
})(typeof window !== 'undefined' ? window : globalThis);

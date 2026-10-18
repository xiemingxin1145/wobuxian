'use strict';
// ======================= v2.5 纯代码动效：受击闪白触发（H4） =======================
// 渲染本体在 engine.js 实体绘制块（待机呼吸/NPC 点头/闪白叠加）；本文件只负责在玩家战败时给地图玩家实体打 hurtT。
(function () {
  const _fight = Game.fight;
  Game.fight = async function (mon, opts) {
    const r = await _fight.call(this, mon, opts);
    // 战败或惨胜时，给地图玩家实体一个短暂白闪（复用 battle.js flashT 思路）
    if (R.player && R.player.kind === 'player') {
      if (!r || r.res !== 'win') R.player.hurtT = 0.35;
      else if (this.G && this.G.hp < this.stats().mhp * 0.5) R.player.hurtT = 0.18;
    }
    return r;
  };
})();

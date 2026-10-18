'use strict';
// ======================= v2.5 统一读档归一化（H5 基建） =======================
// 目的：为 H1~H3 所有新字段集中兜底，向前兼容旧存档（不升 v、不清档）。
// 风格：仿 content22.js:99-104 包裹 save/hasSave 的软迁移 + systems21.js:84-89 Sys.ensure 惰性兜底。
// 加载位置：index.html 在 systems21.js 之后（已包裹过 newLife/hasSave 的链上再包一层，链式叠加）。
(function () {
  // 集中归一：给 Game.G 补默认值。幂等，可反复调用。
  function normalize(G) {
    if (!G) return G;
    // ---- H1 宗门位阶 + 三年大比（sects25.js 使用）----
    if (G.sectRank === undefined) G.sectRank = 0;      // 0=外门弟子
    if (G.sectRenown === undefined) G.sectRenown = 0;   // 宗门名誉
    if (G.tournWins === undefined) G.tournWins = 0;     // 累计大比胜场
    if (G.tournDone === undefined) G.tournDone = 0;    // 已办大比届数
    // ---- H2 坊市拍卖 + 区域声望（market25.js 使用）----
    if (!G.renown || typeof G.renown !== 'object') G.renown = {};   // 区域声望字典 mapId→值
    if (!G.consign || typeof G.consign !== 'object') G.consign = {}; // 寄卖台账字典
    if (G.auctionSeen === undefined) G.auctionSeen = 0;              // 上一次开拍卖的年份
    // ---- H3 因果 / 仇敌 / 报恩（events25.js 使用）----
    if (!G.grudge || typeof G.grudge !== 'object') G.grudge = {};    // npcId→仇/恩值
    // ---- 2.6 预留字段（先占位，后续秘境/传承用）----
    if (G.apprentice === undefined) G.apprentice = null;              // 弟子 npcId
    if (!G.realmClear || typeof G.realmClear !== 'object') G.realmClear = {}; // 秘境首通
    return G;
  }
  window.Sys25 = { normalize };

  // 1) 包裹 hasSave：读出老档后立即归一化（content22.js 的 main 索引迁移在它之前链式执行过）。
  const _has = Game.hasSave;
  Game.hasSave = function () {
    const s = _has.apply(this, arguments);
    if (s) normalize(s);
    return s;
  };
  // 2) 包裹 save：写盘前兜底，确保新字段随下次自动存盘落盘（老档读出→内存补默认→写回）。
  const _save = Game.save;
  Game.save = function () {
    if (this.G) normalize(this.G);
    return _save.apply(this, arguments);
  };
  // 3) 包裹 newLife：新人生也过一遍，保证运行时字段齐全（与 systems21 的 Sys.ensure 叠加，幂等）。
  const _new = Game.newLife;
  Game.newLife = function (cfg) {
    _new.call(this, cfg);
    if (this.G) normalize(this.G);
  };
})();

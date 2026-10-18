'use strict';
// ======================= 3.1① 仙界初开·九重天阙（新境界 + 仙界四图） =======================
// 设计：飞升(境界7)不再是终点——追加 地仙(8)/天仙(9)/金仙(10) 三境，
//      并开放 九重天/仙界坊市/瑶池/凌霄殿 四张仙界地图。
// 接入手法（全部包裹/追加，不改 data.js / game.js / world28.js / content22.js 本体）：
//   - REALMS.push 运行时追加三境（不覆盖现有 8 境）；
//   - 包裹 Game.canBreak/addExp/need/yearExp/realmName：把"飞升即封顶"打开为"飞升可续修"；
//   - 包裹 Game.ascend：渡劫后给"留在仙界继续 / 了此残生"二选一；
//   - Object.assign(MAPINFO) + MAP_ORDER.push 登记四图；
//   - 运行时向 ASSETS.maps 写入占位地图数据（HD 底图待 Blender，见 art/mapdefs31.py）；
//   - World28.REGION_OF 运行时把四图归入"天境"大区。
// 存档：全部读现有字段，新旗 flags.xianjie_open / tmpBrk 惰性兜底，不升 v、不清档。
(function () {
  // ---- 1) 追加三境（tier8 地仙 / tier9 天仙 / tier10 金仙，寿元近乎不朽）----
  REALMS.push(
    { n: '地仙', life: 99999, need: 600000, tier: 8, brk: 0.50, T: 300 },
    { n: '天仙', life: 99999, need: 2500000, tier: 9, brk: 0.42, jie: 1, T: 700 },
    { n: '金仙', life: 99999, need: 10000000, tier: 10, brk: 0.35, jie: 2, T: 1500 },
  );

  // ---- 2) 打开"飞升可续修"：包裹境界相关方法 ----
  const _cb = Game.canBreak;
  Game.canBreak = function () {
    const G = this.G;
    if (G && G.realm >= 7 && G.realm <= 9 && G.stage === 3 && G.exp >= this.need()) return true;
    return _cb.call(this);
  };

  // addExp 原逻辑在 realm>=7 直接 return 0（飞升封顶）；仙界篇放开 7..9 的修为积累
  const _ae = Game.addExp;
  Game.addExp = function (n, raw) {
    const G = this.G;
    if (G && G.realm >= 7 && G.realm <= 9) {
      n = Math.max(0, Math.round(raw ? n : n * this.cultMult()));
      G.exp += n;
      while (G.exp >= this.need() && G.stage < 3) { G.exp -= this.need(); G.stage++; G.pts++; this.levelFx(this.realmName() + '！'); }
      if (G.stage === 3 && G.exp >= this.need()) G.exp = this.need();
      UI.hud(); return n;
    }
    return _ae.call(this, n, raw);
  };

  // need：飞升(7) 原占位 need=1e12 不可破，仙界篇给一个可达的续修门槛
  const _need = Game.need;
  Game.need = function () {
    const G = this.G;
    if (G.realm === 7) return Math.round(150000 * STAGE_MUL[G.stage]);
    if (G.realm >= 8) return Math.round(REALMS[G.realm].need * STAGE_MUL[G.stage]);
    return _need.call(this);
  };

  // yearExp：原 Math.min(7, realm) 封顶；仙界篇按新境 T 折算
  const _ye = Game.yearExp;
  Game.yearExp = function () {
    const G = this.G;
    if (G.realm === 7) return this.need() / 150;
    if (G.realm >= 8) return this.need() / REALMS[G.realm].T;
    return _ye.call(this);
  };

  // realmName：原 realm>=7 一律显示"飞升"；仙界篇细分三境
  const _rn = Game.realmName;
  Game.realmName = function () {
    const G = this.G;
    if (G.realm === 8) return '地仙' + STAGES[G.stage];
    if (G.realm === 9) return '天仙' + STAGES[G.stage];
    if (G.realm === 10) return '金仙' + STAGES[G.stage];
    return _rn.call(this);
  };

  // ---- 3) 包裹 Game.ascend：渡劫后二选一（留下续修 / 了此残生）----
  Game.ascend = async function () {
    const G = this.G;
    const c = await UI.card('飞升', `你已渡劫圆满，头顶的天空裂开一道金色门户。\n九九八十一……不，是12道飞升雷劫在等着你。${G.debt > 0 ? `\n（友情提示：你还欠天道 ${fmt(G.debt)} 灵石）` : ''}`, 'i:sk_light', ['渡劫飞升', '再修炼一会儿']);
    if (c !== 0) return;
    const alive = await this.tribulation(12, 6, true); if (!alive) return;
    G.realm = 7; this.levelFx('飞升成功！踏入仙界');
    if (!G.flags) G.flags = {}; G.flags.xianjie_open = 1;
    const c2 = await UI.card('仙界初开',
      '你渡过飞升雷劫，脚踩南天门云海。仙界不是终点——而是一座更大的灵山。\n\n· 留在仙界继续修行：可突破 地仙→天仙→金仙，探索九重天阙；\n· 了此残生：以飞升仙身含笑而终。',
      'i:sk_light', ['留在仙界（继续）', '了此残生（飞升结局）']);
    if (c2 === 1) { await this.die(G.debt <= 0 ? 'paid' : 'ascend'); return; }
    G.tmpBrk = Math.max(G.tmpBrk || 0, 0.5); // 初入仙界，助一次突破
    UI.toast('仙界篇开启：前往南天门·九重天', '#c8a0ff');
    this.save();
  };

  // ---- 4) 登记仙界四图（运行时 Object.assign，不覆盖现有 11 图）----
  Object.assign(MAPINFO, {
    jiuct: { n: '九重天', tier: 7.6, need: 7, mons: ['tianbing', 'collector'], cnt: 6, bgm: 'heaven', sky: ['#fff2c8', '#ffffff'], amb: 'sparkle', start: [10, 18], wx: 2000, wy: 380, d: '飞升者的第一站。云海之上，南天门内，接引仙官在此登记新来的仙人。' },
    xianfang: { n: '仙界坊市', tier: 8.2, need: 8, mons: ['tianbing', 'paper'], cnt: 6, bgm: 'market', sky: ['#ffd8a8', '#fff0d8'], amb: 'lantern', start: [10, 18], wx: 1720, wy: 640, d: '仙人做买卖的地方。仙石当钱，奇货可居。' },
    yaochi: { n: '瑶池', tier: 8.8, need: 9, mons: ['ghost', 'paper'], cnt: 6, bgm: 'island', sky: ['#d8f4ff', '#ffffff'], amb: 'bubble', start: [10, 18], wx: 2280, wy: 300, d: '西王母的蟠桃园所在，仙泉氤氲，每三百年一开蟠桃盛会。' },
    lingxiao: { n: '凌霄殿', tier: 9.6, need: 10, mons: ['tianbing', 'collector'], cnt: 6, bgm: 'heaven', sky: ['#ffe9a8', '#fffaf0'], amb: 'sparkle', start: [10, 18], wx: 2000, wy: 150, d: '天庭中枢，太白金星掌朝仪，仙官的品阶从这里排起。' },
  });
  MAP_ORDER.push('jiuct', 'xianfang', 'yaochi', 'lingxiao');

  // ---- 5) 运行时占位地图数据（HD 底图待 Blender 渲染；此处复用 heaven 的等距投影与道具图集）----
  (function registerPlaceholderMaps() {
    const AS = window.ASSETS; if (!AS || !AS.maps || !AS.maps.heaven) return;
    const base = AS.maps.heaven;
    function mk() {
      const n = 22; const tiles = [];
      for (let j = 0; j < n; j++) { let row = ''; for (let i = 0; i < n; i++) row += (i === 0 || j === 0 || i === n - 1 || j === n - 1) ? 'x' : '.'; tiles.push(row); }
      return { n, tiles, props: [], foot: Object.assign({}, base.foot), propAtlas: base.propAtlas, plate: base.plate };
    }
    for (const id of ['jiuct', 'xianfang', 'yaochi', 'lingxiao']) AS.maps[id] = mk();
  })();

  // ---- 6) World28 大地图：四图归入"天境"大区 ----
  // 注意：world28.js 的 World28 是顶层 const（不挂 window），用 typeof 裸引用
  if (typeof World28 !== 'undefined') {
    const _ro = World28.REGION_OF;
    World28.REGION_OF = function (id) {
      if (['jiuct', 'xianfang', 'yaochi', 'lingxiao'].includes(id)) return '天境';
      return _ro.call(this, id);
    };
  }

  // ---- 7) 暴露自检接口 ----
  window.Xianjie31 = {
    realms: 11,
    maps: ['jiuct', 'xianfang', 'yaochi', 'lingxiao'],
    open: function () { const G = Game.G; if (!G) return; G.realm = 7; G.stage = 3; G.exp = Game.need(); G.flags.xianjie_open = 1; G.tmpBrk = 0.5; Game.save(); },
  };
})();

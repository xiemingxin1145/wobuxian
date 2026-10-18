'use strict';
// ======================= v2.5 坊市拍卖会 + 区域声望（H2） =======================
// 扩展手法：Talk.extra 注入入口 + UI.panel('auction') 新面板 + UI.shop 售价行 1 行系数接入。
// 声望写 G.renown{}（字典 mapId→值）；新字段已由 migrate25.js 兜底。
(function () {
  // ---- 1) 区域声望 7 级（参考觅长生声望）----
  const RENOWN_LEVELS = [
    { min: -9999, name: '臭名昭著', mod: 1.20 },  // 负声望：商店抬价
    { min: -50,   name: '声名狼藉', mod: 1.10 },
    { min: 0,     name: '籍籍无名', mod: 1.00 },
    { min: 100,   name: '小有名气', mod: 0.95 },
    { min: 300,   name: '颇负盛名', mod: 0.90 },
    { min: 600,   name: '名动一方', mod: 0.85 },
    { min: 1000,  name: '誉满天下', mod: 0.80 },  // 最高：商店 8 折
  ];
  // ---- 2) 区域物价系数（低买高卖：村镇便宜，鬼市/龙宫/天庭贵）----
  const PRICE_MAP = {
    village: 0.9, sect: 1.0, market: 1.0, secret: 1.15, graveyard: 1.1,
    island: 1.15, rift: 1.2, longgong: 1.3, guishi: 1.25, cuizhai: 1.2, heaven: 1.3,
  };
  // ---- 3) 拍品池（按境界分级）----
  const AUCTION_GOODS = [
    { minRealm: 1, item: 'pyd', base: 500 },
    { minRealm: 1, item: 'zjd', base: 1500 },
    { minRealm: 1, item: 'ysf', base: 600 },
    { minRealm: 2, item: 'pjd', base: 3000 },
    { minRealm: 2, item: 'ysd', base: 2500 },
    { minRealm: 2, item: 'tsf', base: 4000 },
    { minRealm: 3, item: 'xsd', base: 8000 },
    { minRealm: 3, item: 'lz', base: 400 },
    { minRealm: 4, item: 'yd', base: 800 },
  ];
  const AUCTION_FEE = 10;  // 入场费

  function ensure(G) { if (window.Sys25) Sys25.normalize(G); }
  function renownOf(mapId) { const G = Game.G; return G && G.renown ? (G.renown[mapId] || 0) : 0; }
  function renownLevel(mapId) {
    const v = renownOf(mapId); let cur = RENOWN_LEVELS[0];
    for (const L of RENOWN_LEVELS) if (v >= L.min) cur = L;
    return cur;
  }
  function regionMod(mapId) { return PRICE_MAP[mapId] || 1; }
  // UI.shop 售价系数：声望折扣 × 区域物价（<1 便宜，>1 贵）
  function buyMod() {
    const G = Game.G; if (!G) return 1;
    return renownLevel(R.mapId).mod * regionMod(R.mapId);
  }
  window.Market25 = { renownOf, renownLevel, buyMod, regionMod };

  function addRenown(mapId, n) {
    const G = Game.G; ensure(G);
    G.renown[mapId] = Math.max(-9999, (G.renown[mapId] || 0) + n);
  }

  // ---- 4) 入口：坊市钱多多处注入"聚宝阁拍卖"（链式 Talk.extra）----
  const _ex = Talk.extra;
  Talk.extra = function (id) {
    const G = Game.G; const out = _ex ? _ex.call(this, id) : [];
    if (!G) return out;
    if (id === 'merchant') out.push(['🔨 聚宝阁拍卖', async () => { G._auctionFee = 0; await UI.panel('auction'); }]);
    return out;
  };

  // ---- 5) 竞拍一轮：与 AI 轮流出价 ----
  async function bidLot(G, lot) {
    if (G.stone < AUCTION_FEE && !G._auctionFee) { UI.toast(`入场费 ${AUCTION_FEE} 灵石都付不起`); return; }
    if (!G._auctionFee) { G.stone -= AUCTION_FEE; G._auctionFee = 1; }
    const base = Math.round(lot.base * regionMod(R.mapId));
    let price = Math.round(base * 0.6);           // 起拍价
    const aiCeil = Math.round(base * rnd(1.1, 1.6)); // AI 出价上限
    Sfx.play('dialog');
    for (let round = 0; round < 4; round++) {
      price = Math.round(price * rnd(1.25, 1.5));   // AI 抬价
      if (price > aiCeil) {                         // AI 放弃
        await UI.card('成交', `${ITEMS[lot.item].n} 落槌于你手！\n成交价：${fmt(price)} 灵石。`, 'i:chest', ['收下']);
        G.stone -= price; Game.give(lot.item, 1); addRenown(R.mapId, 5); Sfx.play('coin'); UI.hud(); return;
      }
      if (G.stone < price) { await UI.say('npc_merchant', '钱多多', `对手把价抬到 ${fmt(price)}，你灵石不够了。\n（拍品被人买走）`, ['可惜']); return; }
      const c = await UI.card('竞拍中', `${ITEMS[lot.item].n}（估价 ${fmt(base)}）\n当前价：${fmt(price)} 灵石，还出吗？`, 'npc_merchant', [`出到 ${fmt(Math.round(price * 1.3))}`, '放弃']);
      if (c !== 0) { await UI.say('npc_merchant', '钱多多', '你摇了摇头。一锤定音——拍品归了别人。', ['……']); return; }
      price = Math.round(price * 1.3);
    }
    // 连出 4 口，AI 放弃 → 玩家得
    if (G.stone < price) { UI.toast('灵石不够'); return; }
    G.stone -= price; Game.give(lot.item, 1); addRenown(R.mapId, 8);
    await UI.card('成交！', `你以 ${fmt(price)} 灵石拍得【${ITEMS[lot.item].n}】！`, 'i:chest', ['好耶']);
    Sfx.play('coin'); UI.hud();
  }

  // ---- 6) 寄卖：把自己的物品交给拍卖行，AI 可能抬价买入 ----
  async function consign(G) {
    const sellable = Object.keys(G.inv).filter(k => G.inv[k] > 0 && ITEMS[k] && ITEMS[k].p > 0 && !ITEMS[k].use);
    if (!sellable.length) { UI.toast('你身上没有可寄卖的物品'); return; }
    const opts = sellable.slice(0, 8).map(k => `${ITEMS[k].n}（持${G.inv[k]}）估${fmt(Math.round(ITEMS[k].p * 0.8))}`);
    const c = await UI.card('寄卖物品', '选择要寄卖的物品（底价收 10% 手续费，AI 可能抬价）：', 'npc_merchant', opts.concat(['算了']));
    if (c >= sellable.length) return;
    const k = sellable[c]; Game.take(k, 1);
    const reserve = Math.round(ITEMS[k].p * 0.8 * regionMod(R.mapId));
    const fee = Math.max(1, Math.round(reserve * 0.1)); G.stone -= fee;
    const sold = Math.random() < 0.6;   // 60% 被 AI 买走
    if (sold) {
      const got = Math.round(reserve * rnd(1.0, 1.5));
      G.stone += got; addRenown(R.mapId, 3); Sfx.play('coin');
      await UI.card('寄卖成交', `【${ITEMS[k].n}】被一位散修买走！\n到手 ${fmt(got)} 灵石（已扣手续费 ${fee}）。`, 'npc_merchant', ['好']);
    } else {
      await UI.card('流拍', `【${ITEMS[k].n}】无人出价，流拍了。\n手续费 ${fee} 灵石不退。`, 'npc_merchant', ['唉']);
    }
    UI.hud();
  }

  // ---- 7) 拍卖面板 ----
  UI.titles.auction = '聚宝阁拍卖';
  UI.p_auction = function (b, re) {
    const G = Game.G; ensure(G);
    const lvl = renownLevel(R.mapId);
    const pool = AUCTION_GOODS.filter(g => G.realm >= g.minRealm);
    const lots = []; const used = {};
    while (lots.length < 3 && pool.length) {
      const g = pick(pool.filter(x => !used[x.item])); if (!g || used[g.item]) break; used[g.item] = 1; lots.push(g);
    }
    b.innerHTML = `<p class="hint">当前区域：${MAPINFO[R.mapId].n}　区域物价：${Math.round(regionMod(R.mapId) * 100)}%<br>
      本区域声望：<b style="color:#ffd23a">${lvl.name}</b>（${renownOf(R.mapId)}）　商店折扣 ${Math.round(lvl.mod * 100)}%<br>
      入场费 ${AUCTION_FEE} 灵石（每次开市一次）</p>
      <h4>本场拍品</h4>` +
      lots.map((g, i) => `<div class="it"><div><b>${ITEMS[g.item].n}</b><small>估价 ${fmt(Math.round(g.base * regionMod(R.mapId)))}</small></div><button class="sm bid" data-i="${i}">竞拍</button></div>`).join('') +
      `<button class="opt" id="consign">📦 寄卖自己的物品</button>`;
    b.querySelector('#consign').onclick = async () => { await consign(G); re(); };
    b.querySelectorAll('.bid').forEach(btn => btn.onclick = async () => { await bidLot(G, lots[+btn.dataset.i]); re(); });
  };
})();

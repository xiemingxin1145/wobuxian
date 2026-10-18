'use strict';
// ======================= v2.6 秘境 roguelike 多层地牢（①） =======================
// 设计参考：觅长生后山十字迷宫 / 鬼谷魂灯分支。纯代码实现（不依赖新地图底图）：
// 进入后随机 3~5 层，每层随机房间（战斗/精英/宝箱遗宝/陷阱/神秘商人/秘境事件），
// 清完一层打层守关，越深奖励越好，中途退出保留已得，全程不存盘（仅记 best/clear）。
// 接入手法：Talk.extra 注入入口 + 注册 Acts.dungeon26（供未来剑冢 jianzhong 图登记 Acts 点复用）
//          + UI.panel('dungeon26') 探索界面 + Game.fight 复用战斗。
// 存档：G.dungeon{floor/best/clear} 惰性兜底（本文件内自补，不改 migrate25，不升 v）。
(function () {
  // ---- 0) 境界分层：练气~元婴 5 档（realm: 1练气 2筑基 3金丹 4元婴 5化神+）----
  const BANDS = [
    { n: '练气秘境', tier: 1.15, mons: ['slime', 'boar', 'paper', 'rock'],                  loot: ['herb', 'lz', 'coin', 'scroll'] },
    { n: '筑基秘境', tier: 2.15, mons: ['treant', 'fox', 'rock', 'fire', 'jiangshi'],        loot: ['lz', 'yd', 'coin', 'scroll', 'peach'] },
    { n: '金丹秘境', tier: 3.15, mons: ['crab', 'fire', 'ghost', 'demon', 'treant'],         loot: ['yd', 'lz', 'peach', 'pjd', 'coin'] },
    { n: '元婴秘境', tier: 4.15, mons: ['demon', 'fire', 'rock', 'ghost', 'collector'],      loot: ['yd', 'pjd', 'xsd', 'peach', 'scroll'] },
    { n: '化神秘境', tier: 5.15, mons: ['paper', 'ghost', 'collector', 'demon', 'fire'],     loot: ['xsd', 'pjd', 'peach', 'coin', 'scroll'] },
  ];
  const bandOf = realm => Math.max(0, Math.min(BANDS.length - 1, realm - 1)); // realm1->0 …… realm5+->4

  function ensure(G) {
    if (!G.dungeon || typeof G.dungeon !== 'object') G.dungeon = { floor: 0, best: 0, clear: {} };
    if (typeof G.dungeon.best !== 'number') G.dungeon.best = 0;
    if (!G.dungeon.clear || typeof G.dungeon.clear !== 'object') G.dungeon.clear = {};
    return G;
  }

  // ---- 1) 运行态（全程不存盘，退出即弃）----
  const Dng = {
    run: null, // {band,tier,maxFloor,floor,rooms,doneRooms,bossDone,loot:[],over}
    start() {
      const G = Game.G; ensure(G);
      const band = bandOf(G.realm);
      this.run = {
        band, tier: BANDS[band].tier + rnd(0, 0.3),
        maxFloor: ri(3, 5), floor: 1,
        doneRooms: 0, needRooms: 3, bossDone: false,
        loot: [], over: false,
      };
      try { Audio2.bgm('mijing'); } catch (e) { }
      Sfx.play('door');
      UI.toast(`你踏入了【${BANDS[band].n}】· 第 1 / ${this.run.maxFloor} 层`, '#c8b8ff');
    },
    exit(silent) {
      const G = Game.G; ensure(G);
      if (this.run && !this.run.over) {
        G.dungeon.floor = Math.max(G.dungeon.floor, this.run.floor);
      }
      this.run = null;
      try { Audio2.bgm(MAPINFO[R.mapId] ? MAPINFO[R.mapId].bgm : 'village'); } catch (e) { }
      if (!silent) UI.toast('你离开了秘境', '#c8b8ff');
    },
  };
  window.Dng = Dng;

  // ---- 2) 房间事件（异步；每个房间结束后由调用方 re() 重渲染面板）----
  async function roomBattle(elite) {
    const G = Game.G; const r = Dng.run; const pool = BANDS[r.band].mons;
    const mon = pick(pool);
    const tier = r.tier + (elite ? 0.9 : rnd(-0.2, 0.2));
    const r2 = await Game.fight(mon, { tier, elite, solo: true });
    if (r2 && r2.res === 'win') {
      r.doneRooms++;
      if (elite) { const e = Game.randEq(tier, 2); r.loot.push(e.name); Sfx.play('pickup'); await UI.card('精英斩杀', `你斩杀了精英【${MONS[mon].n}】，搜出一件宝物！\n【${e.name}】`, 'i:sk_slash', ['收入背包'], { eq: [e] }); }
      else UI.toast(`击败 ${MONS[mon].n}`, '#ffb0a0');
    } else {
      // 失败：Game.fight 已扣血扣灵石；秘境中败退→中止本次探索（保留已得）
      await UI.card('秘境败退', '你且战且退，终于撤出了秘境。已获得的宝物都还在行囊里。', 'i:sk_poison', ['撤']);
      r.over = true;
    }
  }

  async function roomChest() {
    const G = Game.G; const r = Dng.run;
    const tier = r.tier;
    const e = Game.randEq(tier, r.band >= 2 ? 2 : r.band); // 遗法宝
    const extra = pick(BANDS[r.band].loot);
    const st = Math.round(30 * POW(tier) * rnd(0.6, 1.4));
    Game.give(extra); G.stone += st;
    r.loot.push(e.name);
    r.doneRooms++;
    Sfx.play('chest');
    await UI.card('秘境宝箱', `古剑锈迹斑斑，却透着一缕剑意。\n灵石 +${fmt(st)}　${ITEMS[extra].n}×1\n遗宝：【${e.name}】`, 'i:chest', ['收剑入囊'], { eq: [e] });
  }

  async function roomTrap() {
    const G = Game.G; const r = Dng.run;
    const s = Game.stats();
    const dmg = Math.round(s.mhp * rnd(0.12, 0.28));
    G.hp = Math.max(1, G.hp - dmg);
    r.doneRooms++;
    Sfx.play('trap');
    const dodge = Math.random() < (G.st ? 0.15 + G.spdBonus : 0.15);
    if (dodge) { UI.toast('你身法矫健，堪堪避开了剑阵！', '#9aff9a'); return; }
    await UI.card('触发陷阱', `地面阵法骤亮，一道剑罡擦着你的肩头划过。\n气血 -${dmg}（${Math.round(G.hp)}/${s.mhp}）`, 'i:sk_poison', ['咬牙继续']);
  }

  async function roomMerchant() {
    const G = Game.G; const r = Dng.run;
    const c = await UI.card('秘境游商', '雾中飘来一个挑担子的老修士：“嘿嘿，秘境里偶遇，都是缘法。要点丹药么？”', 'npc_merchant',
      [`回春丹×2（${60}灵石）`, `破境丹×1（${r.band >= 2 ? 600 : 300}灵石）`, '不买，告辞']);
    if (c === 0) { if (G.stone < 60) { UI.toast('灵石不够'); } else { G.stone -= 60; Game.give('hcd', 2); Sfx.play('coin'); UI.toast('购入回春丹×2'); } }
    else if (c === 1) { const price = r.band >= 2 ? 600 : 300; if (G.stone < price) { UI.toast('灵石不够'); } else { G.stone -= price; Game.give('pjd', 1); Sfx.play('coin'); UI.toast('购入破境丹×1'); } }
    r.doneRooms++;
  }

  async function roomEvent() {
    const G = Game.G; const r = Dng.run;
    const tbl = [
      ['残剑悟道', '你在石壁上看到一行古人剑刻，若有所悟。', () => { const g = Game.addExp(Game.yearExp() * 0.4, true); UI.toast(`修为 +${fmt(g)}`, '#c8ffd8'); }],
      ['剑冢灵韵', '一缕残存剑意钻入眉心，灵台清明。', () => { G.st.int = (G.st.int || 0) + 1; UI.toast('悟性+1（剑意洗礼）', '#c8ffd8'); }],
      ['古修遗蜕', '你在枯坐的古修残骸上找到一个储物袋。', () => { const it = pick(BANDS[r.band].loot); Game.give(it, ri(1, 2)); UI.toast('获得：' + ITEMS[it].n, '#ffd25e'); }],
      ['山缝灵泉', '一眼灵泉汩汩，你洗了把脸。', () => { const s = Game.stats(); G.hp = s.mhp; G.mp = s.mmp; Sfx.play('heal'); UI.toast('气血灵力全满', '#9ad8ff'); }],
    ];
    const [t, d, fx] = pick(tbl);
    await UI.card('秘境奇遇', d, 'i:scroll', ['上前查看']);
    fx();
    r.doneRooms++;
  }

  function rollRoom() {
    const x = Math.random();
    if (x < 0.34) return roomBattle.bind(null, false);
    if (x < 0.50) return roomBattle.bind(null, true);
    if (x < 0.66) return roomChest;
    if (x < 0.78) return roomTrap;
    if (x < 0.88) return roomMerchant;
    return roomEvent;
  }

  async function floorBoss(re) {
    const G = Game.G; const r = Dng.run;
    const mon = pick(BANDS[r.band].mons);
    const tier = r.tier + 1.0; // 层守关：高半档
    await UI.card('层守关', `剑气如虹，一层守关【${MONS[mon].n}】从剑碑后现身，拦住了去路！`, 'i:sk_slash', ['拔剑！']);
    const r2 = await Game.fight(mon, { tier, elite: true, solo: true });
    if (r2 && r2.res === 'win') {
      r.bossDone = true;
      G.dungeon.clear[r.band] = 1;
      G.dungeon.best = Math.max(G.dungeon.best, r.floor);
      Sfx.play('victory');
      const e = Game.randEq(r.tier + 0.5, 3); r.loot.push(e.name);
      await UI.card('守关已破', `【${MONS[mon].n}】化作光点散去，身后露出通往下一层的剑门。\n掉落遗宝：【${e.name}】`, 'i:chest', ['拾级而下'], { eq: [e] });
    } else {
      await UI.card('秘境败退', '守关太强，你且战且退撤出了秘境。', 'i:sk_poison', ['撤']);
      r.over = true;
    }
    re();
  }

  // ---- 3) 面板 UI.panel('dungeon26') ----
  UI.titles.dungeon26 = '秘境探索';
  UI.p_dungeon26 = function (b, re) {
    const G = Game.G; ensure(G);
    const r = Dng.run;
    if (!r || r.over) {
      const band = bandOf(G.realm);
      const cleared = Object.keys(G.dungeon.clear).length;
      b.innerHTML = `<p class="hint">秘境是上古修士坐化后残留的小世界，层层叠叠，杀机与遗宝并存。<br>
        当前境界对应：<b style="color:#c8b8ff">${BANDS[band].n}</b>　历史最深：${G.dungeon.best} 层　已通关层数档：${cleared}/5</p>
        <p class="hint">规则：每层探索 3 间密室 → 击破层守关 → 深入下一层。共 ${'-'}3~5 层。<br>
        死亡或撤退即结束本次探索；已得宝物保留。建议气血充盈时再来。</p>
        <button class="opt" id="go">⚔ 踏入秘境（${BANDS[band].n}）</button>
        <button class="opt" id="leave">离开</button>`;
      b.querySelector('#go').onclick = async () => { Dng.start(); re(); };
      b.querySelector('#leave').onclick = () => { Dng.exit(true); UI.hud(); };
      return;
    }
    const pct = Math.round(r.doneRooms / r.needRooms * 100);
    let body = `<p class="hint"><b style="color:#c8b8ff">${BANDS[r.band].n}</b>　第 ${r.floor} / ${r.maxFloor} 层<br>
      本层探索：${r.doneRooms}/${r.needRooms} 间　　行囊遗宝：${r.loot.length ? r.loot.length + ' 件' : '无'}</p>
      <div class="bar"><i style="width:${pct}%"></i></div>`;
    if (r.loot.length) body += `<h4>已获遗宝</h4><p class="hint">${r.loot.map(x => '【' + esc(x) + '】').join('　')}</p>`;

    if (r.doneRooms < r.needRooms) {
      body += `<button class="opt" id="room">🗝 探索一间密室</button><button class="opt" id="retreat">🏳 带宝撤离</button>`;
    } else if (!r.bossDone) {
      body += `<button class="opt" id="boss">⚔ 挑战层守关</button><button class="opt" id="retreat">🏳 带宝撤离</button>`;
    } else if (r.floor < r.maxFloor) {
      body += `<button class="opt" id="next">⬇ 进入下一层</button><button class="opt" id="retreat">🏳 带宝撤离</button>`;
    } else {
      body += `<p class="hint" style="color:#ffe680">🏁 你已闯过全部 ${r.maxFloor} 层，秘境剑门在你身后缓缓闭合。</p>
        <button class="opt" id="finish">结算出秘境</button>`;
    }
    b.innerHTML = body;

    const on = (id, fn) => { const el = b.querySelector('#' + id); if (el) el.onclick = async () => { await fn(); re(); }; };
    on('room', async () => { await rollRoom()(); re(); });
    on('boss', async () => { await floorBoss(re); });
    on('next', async () => { r.floor++; r.doneRooms = 0; r.bossDone = false; Sfx.play('door'); UI.toast(`第 ${r.floor} / ${r.maxFloor} 层`, '#c8b8ff'); re(); });
    on('retreat', async () => {
      await UI.card('撤离秘境', `你带着 ${r.loot.length} 件遗宝全身而退。\n最深抵达：第 ${r.floor} 层。`, 'i:flag', ['出秘境']);
      Dng.exit(true); re();
    });
    on('finish', async () => {
      G.dungeon.clear[r.band] = 1; G.dungeon.best = Math.max(G.dungeon.best, r.maxFloor);
      Sfx.play('victory');
      await UI.card('秘境通关', `你闯过了【${BANDS[r.band].n}】全部 ${r.maxFloor} 层！\n共获遗宝 ${r.loot.length} 件。秘境令在你手中化作光点——此处已与你有缘。`, 'i:chest', ['名震一方'], );
      Dng.exit(true); re();
    });
  };

  // ---- 4) 入口：Talk.extra 链式注入（练气以上可入；挂在秘境线 NPC 阿离与落魄剑仙处，保证无新图也可测）----
  const _ex = Talk.extra;
  Talk.extra = function (id) {
    const G = Game.G; const out = _ex ? _ex.call(this, id) : [];
    if (!G) return out;
    if (G.realm < 1) return out; // 未觉醒/凡人不开放
    if (id === 'ali' || id === 'mentor') {
      out.push(['⚔ 探索秘境', async () => { await UI.panel('dungeon26'); }]);
    }
    return out;
  };

  // ---- 5) 注册 Acts.dungeon26：供未来剑冢 jianzhong 图（美术链 maps26）登记 Acts 点直接复用 ----
  // 同时暴露全局 dungeon26.enter(src)，对接 maps26.js 的 Acts.jianbei 剑碑入口。
  window.dungeon26 = {
    enter: async function (src) {
      const G = Game.G;
      if (G.realm < 1) { UI.toast('先觉醒灵根、踏入练气再来。'); return; }
      if (src === 'jianzhong') G.dungeonJz = 1;   // 记录从剑冢进入（彩蛋位，后续可扩展）
      await UI.panel('dungeon26');
    },
  };
  if (typeof Acts !== 'undefined') {
    Acts.dungeon26 = async function () { await window.dungeon26.enter(); };
  }
})();

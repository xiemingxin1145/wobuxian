'use strict';
// ======================= v2.5 新地图：万宝楼 / 逐鹿原 / 药王谷（阶段⑦） =======================
// 仿 content22.js:47-53 的 Object.assign(MAPINFO,...)+MAP_ORDER.splice 登记模式
// 在 sects25.js / market25.js / events25.js 之后加载（依赖 MAPINFO / MAP_ORDER 已定义）。
// 存档兼容：仅新增地图数据与 Acts 互动点，不修改现有地图，惰性兼容。

(function () {
  // ---- 1) 登记 3 张新地图到 MAPINFO ----
  Object.assign(MAPINFO, {
    // 万宝楼：奢华拍卖行，金帛满堂（筑基境）
    wanbao: {
      n: '万宝楼', tier: 1.8, need: 2,
      mons: ['collector', 'fox', 'paper'], cnt: 4,
      bgm: 'market', sky: ['#ffd890', '#fff0d8'], amb: 'lantern',
      start: [10, 18],
      d: '三界最大的拍卖行。这里没有买不起，只有你钱不够。'
    },
    // 逐鹿原：开阔演武场，宗门大比擂台（筑基境）
    juluyuan: {
      n: '逐鹿原', tier: 2.0, need: 2,
      mons: ['paper', 'rock', 'boar'], cnt: 5,
      bgm: 'sect', sky: ['#a8d8f0', '#f0f8ff'], amb: 'leaf',
      start: [10, 18],
      d: '宗门大比的擂台。旌旗猎猎，台下押注声比台上兵器声还响。'
    },
    // 药王谷：药香弥漫的幽谷，药田连片（筑基境）
    yaowang: {
      n: '药王谷', tier: 1.9, need: 2,
      mons: ['slime', 'treant', 'fox'], cnt: 5,
      bgm: 'village', sky: ['#b8f0c8', '#f0fff4'], amb: 'petal',
      start: [10, 18],
      d: '药香弥漫的幽谷。连片药田之间，藏着药性相生相克的秘密。'
    },
  });

  // ---- 2) 插入 MAP_ORDER（紧跟 market 之后，与坊市线衔接）----
  // 现有顺序：village, sect, market, secret, graveyard, island, rift, heaven, longgong, guishi, cuizhai
  // 插入位置：market 之后、secret 之前（筑基境地图组）
  MAP_ORDER.splice(MAP_ORDER.indexOf('market') + 1, 0, 'wanbao', 'juluyuan', 'yaowang');

  // ---- 3) 新 Acts 互动点（按 prop 类型分发，与 talk.js Acts 同模式）----
  // 万宝楼：拍卖台 → Acts.auction（复用 market25 拍卖逻辑入口）
  // 逐鹿原：擂台 → Acts.arena（切磋/大比报名）
  // 药王谷：药田 → Acts.herbfield（集中采药）
  if (typeof Acts !== 'undefined') {
    // 拍卖台互动（万宝楼中央）
    Acts.auction = async function () {
      const G = Game.G;
      if (G.realm < 2) { UI.toast('筑基以后再来吧，拍品你买不起。'); return; }
      // 复用 market25 的拍卖面板（若已加载）
      if (typeof UI.panel === 'function') {
        await UI.panel('auction');
      } else {
        await UI.card('万宝楼拍卖台', '金满堂坐在高台后，拨弄着算珠。\n\n“今日拍品：筑基期法器一件，起拍价五百灵石。客官可要上台一掷千金？”', 'npc_merchant', ['看看拍品', '今日不拍']);
      }
    };

    // 擂台切磋（逐鹿原中央）
    Acts.arena = async function () {
      const G = Game.G;
      if (!Game.useAP(1)) return;
      const tier = MAPINFO[R.mapId].tier;
      const c = await UI.card('逐鹿擂台',
        '擂台上木桩林立，台下观众隐隐攒动。\n\n你可以：\n· 上台切磋（消耗行动力，获修为+宗门贡献）\n· 挑战大比（需宗门身份，需更高境界）',
        'i:sk_slash', ['上台切磋', '看看就走']);
      if (c !== 0) return;
      // 切磋：随机选一个怪物模拟对手
      const foe = pick(MAPINFO[R.mapId].mons);
      Sfx.play('slash');
      R.player.anim = 'attack';
      await Game.fight(foe, { elite: true, solo: true });
      R.player.anim = 'idle';
      const g = Game.addExp(Game.yearExp() * 0.4);
      if (G.sect) {
        G.contrib += 5;
        UI.toast(`切磋获胜！修为+${fmt(g)}，宗门贡献+5`, '#ffd8a0');
      } else {
        UI.toast(`切磋获胜！修为+${fmt(g)}`, '#ffd8a0');
      }
    };

    // 药田集中采药（药王谷）
    Acts.herbfield = async function (m) {
      const G = Game.G;
      if (!Game.useAP(1)) return;
      G.used[m.key] = 1;
      m.hidden = true;
      const tier = MAPINFO[R.mapId].tier;
      // 药王谷采药产出更丰富
      const got = {
        herb: ri(3, 6),
        lz: ri(1, 3),
      };
      if (tier >= 2 && Math.random() < 0.4) got.peach = 1;
      if (tier >= 3 && Math.random() < 0.3) got.yd = 1;
      for (const k in got) Game.give(k, got[k]);
      Sfx.play('pickup');
      UI.toast('药田采摘：' + Object.entries(got).map(([k, v]) => ITEMS[k].n + '×' + v).join('、'), '#9aff9a');
      // 30% 概率触发药性推演小事件
      if (Math.random() < 0.3) {
        await UI.card('药性推演',
          '你在药田里翻到一本残破的《药性配伍注》。\n\n“药有阴阳配合，子母兄弟，根茎花实……”\n你若有所悟。',
          'i:scroll', ['研读']);
        G.st.luck = (G.st.luck || 0) + 1;
        UI.toast('气运+1（药性感悟）', '#c8ffd8');
      }
    };
  }

  // ---- 4) 新 NPC（万宝楼掌柜 / 逐鹿原执事 / 药王谷药童）----
  Object.assign(NPCS, {
    jinmantang: {
      n: '万宝楼掌柜·金满堂', spr: 'npc_merchant', map: 'wanbao', at: [10, 9],
      por: 'npc_merchant', comp: 1, sex: 'm', minRealm: 2,
    },
    luyuan_zhishi: {
      n: '逐鹿原执事·擂鼓叟', spr: 'npc_elder', map: 'juluyuan', at: [10, 5],
      por: 'npc_elder', minRealm: 2,
    },
    yaotong: {
      n: '药王谷药童·小草', spr: 'npc_tongzi', map: 'yaowang', at: [8, 10],
      por: 'npc_tongzi', minRealm: 1,
    },
  });

  // ---- 5) NPC 对话 ----
  Object.assign(CHAT, {
    jinmantang: [
      '“万宝楼的规矩：价高者得，概不赊账。”',
      '“修仙界的钱，一半在丹炉里，一半在我这拍卖台上。”',
      '“您要是灵石不够，我们也接受法器、丹药、甚至欠条抵押。”',
      '“上一届拍品里有半本《剑谱》，被一位蒙面修士拍走了。”',
    ],
    luyuan_zhishi: [
      '“三年一届宗门大比，下一届就在今秋。”',
      '“台上一分钟，台下十年功。你这身子骨，再练两年。”',
      '“别小看木桩子，它挨的打比你吃的饭还多。”',
      '“台下押注的赔率，我闭着眼都能背出来。”',
    ],
    yaotong: [
      '“师父说，采药要在卯时，露水未干时药性最足。”',
      '“这一片是当归，那一片是灵芝，别踩错了！”',
      '“前山的药草灵，但是有只山猪成精，专拱药田。”',
      '“你要炼丹？先把这筐药材分拣了再说。”',
    ],
  });

  // ---- 6) 新任务（药王谷采药委托 + 万宝楼鉴定 + 逐鹿原切磋）----
  Object.assign(QUESTS, {
    q_wb1: {
      n: '万宝楼鉴宝', giver: 'jinmantang',
      d: '金满堂：“客官手里这件法器，可否让老夫掌掌眼？带上3件装备来万宝楼。”',
      need: { eq: 3 }, rw: { exp: 12000, stone: 2000, aff: { jinmantang: 20 } },
      minRealm: 2,
    },
    q_jl1: {
      n: '逐鹿原练手', giver: 'luyuan_zhishi',
      d: '擂鼓叟：“光说不练假把式。去逐鹿原打跑8只妖兽，算你入门。”',
      need: { k: { paper: 8 } }, rw: { exp: 10000, aff: { luyuan_zhishi: 20 }, item: { scroll: 1 } },
      minRealm: 2,
    },
    q_yw1: {
      n: '药田紧急采摘', giver: 'yaotong',
      d: '药童小草：“山猪又拱药田了！帮我采回12株草药，师父要炼一炉聚气丹。”',
      need: { i: { herb: 12 } }, rw: { exp: 8000, item: { lz: 3, peach: 1 }, aff: { yaotong: 25 } },
      minRealm: 1,
    },
  });

  // ---- 7) 地图进入提示（轻量事件钩子）----
  // 进入新地图时的首次提示（通过包裹 enterMap 实现）
  if (typeof Game !== 'undefined' && Game.enterMap) {
    const _enter = Game.enterMap;
    Game.enterMap = async function (id) {
      await _enter.call(this, id);
      if (!this.G) return;
      const key = 'map25_seen_' + id;
      if (this.G.realm >= 2 && !this.G.used[key]) {
        this.G.used[key] = 1;
        if (id === 'wanbao') {
          UI.toast('你踏入了万宝楼。鎏金柜台后，金满堂拨着算珠看了你一眼。', '#ffd890');
        } else if (id === 'juluyuan') {
          UI.toast('你踏入了逐鹿原。远处擂台上，木桩被打得咚咚作响。', '#a8d8f0');
        } else if (id === 'yaowang') {
          UI.toast('你踏入了药王谷。空气中弥漫着淡淡的药香。', '#b8f0c8');
        }
      }
    };
  }
})();

'use strict';
// ======================= v2.6 新地图：剑冢秘境 / 乱星海 / 问道崖 =======================
// 仿 www/js/maps25.js 的 Object.assign(MAPINFO)+MAP_ORDER 登记模式
// 在 dungeon26.js / legacy26.js / events26.js 之后加载（依赖 MAPINFO / MAP_ORDER / NPCS 已定义）。
// 存档兼容：仅新增地图数据与 Acts 互动点，不修改现有地图，惰性兼容。
// 境界门槛（03 路线图 §3.1）：jianzhong=金丹(need3) / luanxing=元婴(need4) / wendao=渡劫(need6)。

(function () {
  // ---- 1) 登记 3 张新地图到 MAPINFO ----
  Object.assign(MAPINFO, {
    // 剑冢秘境：上古剑仙埋骨地，层层剑碑，秘境入口（金丹境）
    jianzhong: {
      n: '剑冢秘境', tier: 3.0, need: 3,
      mons: ['ghost', 'paper', 'rock', 'treant'], cnt: 6,
      bgm: 'sect', sky: ['#3a4a5a', '#24323e'], amb: 'leaf',
      start: [10, 18],
      d: '上古剑仙埋骨之地。碑林森森，剑意肃杀——传说是进入 roguelike 秘境的入口。'
    },
    // 乱星海：海外群岛，散修混居，风浪险恶（元婴境）
    luanxing: {
      n: '乱星海', tier: 3.8, need: 4,
      mons: ['crab', 'slime', 'fox'], cnt: 5,
      bgm: 'village', sky: ['#8ad0f0', '#d8f0ff'], amb: 'leaf',
      start: [10, 16],
      d: '海外群岛，散修混居。跑商、被劫、海难——风浪里藏着机缘，也藏着海妖王。'
    },
    // 问道崖：绝顶崖台，传剑论道之地，云海环绕（渡劫境，仪式之地，不进常规列表）
    wendao: {
      n: '问道崖', tier: 5.0, need: 6,
      mons: [], cnt: 0,
      bgm: 'sect', sky: ['#f0f4ff', '#ffffff'], amb: 'petal',
      start: [10, 18],
      d: '绝顶崖台，云海环绕。收徒、传剑、论道——道统传承的仪式之地。'
    },
  });

  // ---- 2) 插入 MAP_ORDER ----
  // jianzhong / luanxing 进常规御剑列表（路线图 §3.2：push）；
  // wendao 由主线/传承仪式 travel 进入，不进常规 MAP_ORDER，避免乱刷。
  MAP_ORDER.push('jianzhong', 'luanxing');
  // wendao 不 push；组织者如需可见，可在 legacy26 传剑流程里 Game.travel('wendao') 进入。

  // ---- 3) 新 Acts 互动点（按 prop 类型分发，与 talk.js Acts 同模式）----
  // 剑碑 → 秘境入口（dungeon26 多层 roguelike，代码链负责具体层生成）
  // 渡口 → 乱星海跑商/海难事件
  // 问道台 → 传承仪式（legacy26 收徒/传剑/道统）
  if (typeof Acts !== 'undefined') {
    // 剑冢·剑碑：进入秘境（多层 roguelike，入口转 dungeon26）
    Acts.jianbei = async function () {
      const G = Game.G;
      if (G.realm < 3) { UI.toast('金丹以后再入剑冢吧，剑意会撕碎你。'); return; }
      // 【对接代码链】优先调用 dungeon26 的秘境入口（若已加载）。
      if (typeof dungeon26 === 'object' && dungeon26.enter) {
        await dungeon26.enter('jianzhong');
        return;
      }
      // 兜底（代码链未就位时）：仅剧情提示，不伪造秘境机制。
      await UI.card('剑冢主碑',
        '古碑上插着一柄锈剑，剑鸣嗡嗡。\n\n“欲入秘境，先承剑意。”\n（秘境探索机制将由 dungeon26 接管。）',
        'i:scroll', ['感应剑意', '退开']);
    };

    // 乱星海·渡口：跑商/出海
    Acts.dukou = async function (m) {
      const G = Game.G;
      if (!Game.useAP(1)) return;
      G.used[m.key] = 1; m.hidden = true;
      // 跑商：按海域物价差低买高卖（对接 market25 PRICE_MAP，若已加载）
      const got = { lz: ri(1, 2) };
      if (Math.random() < 0.5) got.peach = 1;
      for (const k in got) Game.give(k, got[k]);
      Sfx.play('pickup');
      UI.toast('渡口跑商：' + Object.entries(got).map(([k, v]) => ITEMS[k].n + '×' + v).join('、'), '#9ad8ff');
      // 30% 海难/散修恩怨小事件
      if (Math.random() < 0.3) {
        await UI.card('海上风波',
          '风浪忽起，一艘散修商船向你求救。\n\n你可以出手相助，或冷眼旁观——因果自此种下。',
          'i:sk_slash', ['出手相助', '扬帆离去']);
        G.karma = (G.karma || 0) + 1;
        UI.toast('福报+1', '#c8ffd8');
      }
    };

    // 问道崖·问道台：传承仪式（收徒/传剑，转 legacy26）
    Acts.wendao = async function () {
      const G = Game.G;
      if (G.realm < 6) { UI.toast('渡劫以上，方可在问道崖论道传剑。'); return; }
      // 【对接代码链】优先调用 legacy26 的传承面板（若已加载）。
      if (typeof UI.panel === 'function' && typeof legacy26 === 'object') {
        await UI.panel('legacy26');
        return;
      }
      await UI.card('问道台',
        '云海风高，蒲团四列。\n\n“传剑传法，道统相传。”\n（收徒/子嗣/传剑机制将由 legacy26 接管。）',
        'npc_elder', ['论道', '离去']);
    };
  }

  // ---- 4) 新 NPC（守冢剑灵 / 乱星海散修 / 问道崖隐者）----
  Object.assign(NPCS, {
    shouling: {
      n: '剑冢守剑灵·无名', spr: 'npc_tianbing', map: 'jianzhong', at: [8, 11],
      por: 'npc_tianbing', minRealm: 3,
    },
    luanxing_sanxiu: {
      n: '乱星海散修·老周', spr: 'npc_xiaoyao', map: 'luanxing', at: [10, 10],
      por: 'npc_xiaoyao', minRealm: 4,
    },
    wendao_yinzhe: {
      n: '问道崖隐者·听云', spr: 'npc_elder', map: 'wendao', at: [10, 9],
      por: 'npc_elder', minRealm: 6,
    },
  });

  // ---- 5) NPC 对话 ----
  Object.assign(CHAT, {
    shouling: [
      '“此冢葬着上古剑仙。你身上……有剑意。”',
      '“碑下三层，层关底皆有守冢剑灵。进去了，就别想空手出来。”',
      '“遗法宝宝箱里，封着前人未竟的道。”',
      '“剑鸣是因为认主。它若不认你，就会反噬。”',
    ],
    luanxing_sanxiu: [
      '“乱星海的规矩：拳头大的说话，灵石硬的坐船。”',
      '“北边那片海湾，上个月沉了一船法宝。捞得着算你的。”',
      '“海妖王每隔百年上岸一次。到时候，跑得快的才活。”',
      '“别信岛主的委托——他连自己都卖。”',
    ],
    wendao_yinzhe: [
      '“修道修到高处，修的不是自己，是道统。”',
      '“你若有成器的弟子，可在此传剑。你的道，便随他活下去。”',
      '“云海之下，是凡人生老病死。云海之上，是我辈论道。”',
      '“渡劫之后，孤。传剑之后，不孤。”',
    ],
  });

  // ---- 6) 新任务（剑冢试剑 / 乱星海渡运 / 问道收徒前置）----
  Object.assign(QUESTS, {
    q_jz1: {
      n: '剑冢试剑', giver: 'shouling',
      d: '守剑灵：“碑下怨灵横行。斩12只，算你有资格入秘境。”',
      need: { k: { ghost: 6, paper: 6 } }, rw: { exp: 30000, aff: { shouling: 25 }, item: { scroll: 1 } },
      minRealm: 3,
    },
    q_lx1: {
      n: '乱星海渡运', giver: 'luanxing_sanxiu',
      d: '老周：“帮我跑一趟货。乱星海风浪大，别把货撒了。带回8份灵草。”',
      need: { i: { herb: 8 } }, rw: { exp: 40000, stone: 5000, aff: { luanxing_sanxiu: 25 } },
      minRealm: 4,
    },
    q_wd1: {
      n: '问道论心', giver: 'wendao_yinzhe',
      d: '听云：“渡劫之后，来崖上坐坐。斩一只心魔再来见我。”',
      need: { k: { rock: 4 } }, rw: { exp: 80000, aff: { wendao_yinzhe: 30 } },
      minRealm: 6,
    },
  });

  // ---- 7) 地图进入提示（轻量事件钩子）----
  if (typeof Game !== 'undefined' && Game.enterMap) {
    const _enter = Game.enterMap;
    Game.enterMap = async function (id) {
      await _enter.call(this, id);
      if (!this.G) return;
      const key = 'map26_seen_' + id;
      if (!this.G.used[key]) {
        this.G.used[key] = 1;
        if (id === 'jianzhong') {
          UI.toast('你踏入了剑冢秘境。碑林森森，远处剑鸣嗡嗡作响。', '#9ab8c8');
        } else if (id === 'luanxing') {
          UI.toast('你踏入了乱星海。咸腥海风扑面而来，远处帆影点点。', '#8ad0f0');
        } else if (id === 'wendao') {
          UI.toast('你踏上了问道崖。云海翻涌，耳边似有鹤唳。', '#f0f4ff');
        }
      }
    };
  }
})();

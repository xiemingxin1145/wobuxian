'use strict';
// ======================= v2.6 因果仇敌完整闭环（③） =======================
// 在 events25.js 轻量因果之上扩成完整闭环：
//   ① 仇敌追杀：积怨→寻仇→决战/和解→了结（G.grudge 升级为多次寻仇链）
//   ② 报恩机缘：受恩→恩人送机缘→回报（G.karma 高时触发）
//   ③ 冤家路窄：地图遭遇事件（轻量，调侃仇家）
// 接入手法：EVENTS.push 注册事件池（events.js 格式）+ 包裹 Game.yearEnd 维护触发旗与台账。
// 存档：复用 G.grudge{}（migrate25 已兜底）；触发旗走 G.flags（松散字典，天然惰性兼容）。
(function () {
  function ensure(G) {
    if (!G.grudge || typeof G.grudge !== 'object') G.grudge = {};
  }

  // ---- 1) 注册进事件池（[id,标题,正文,cond,weight,por, ...选项]）----
  // cond 走 game.js:206 解析器，支持 flag:xxx / karma 比较
  EVENTS.push(
    // ① 仇敌决战（多次寻仇后的了断局）
    ['v26_foe_final', '仇敌决战',
      '你旧日结下的仇家终于忍无可忍，带了几个好手堵在你必经之路上：“今日，不是你死，就是我亡！”',
      'flag:foe_final', 3, 'npc_aotian',
      ['拔剑迎战，做个了断', 'fight:aotian;karma+1;flag:foe_resolved',
        '你以雷霆之势击溃寻仇者，仇家跪伏于地。这段恩怨，一笔勾销。'],
      ['破财和解，息事宁人', 'stone-200;karma+1;flag:foe_resolved',
        '你赔上一笔灵石，仇家啐了口唾沫，悻悻而去。恩怨暂歇。']
    ],
    // ② 报恩送机缘
    ['v26_grace', '报恩机缘',
      '一位你曾随手搭救过的修士辗转寻到你，怀中抱着一个锦盒：“当年救命之恩，今日无以为报，些许薄礼，万望收下。”',
      'flag:grace_due', 3, 'npc_girl',
      ['欣然收下', 'item:pyd:1;stone+300;karma+1;flag:grace_resolved',
        '你收下锦盒，因果循环，善有善报。'],
      ['婉拒，只结善缘', 'karma+2;flag:grace_resolved',
        '你婉拒厚礼，对方长揖到地，心中敬你三分。']
    ],
    // ③ 冤家路窄（轻量遭遇，调侃）
    ['v26_narrow', '冤家路窄',
      '你在道上与一个曾结怨的修士撞个正着。对方先是一愣，随即挤出一个不尴不尬的笑：“……好巧。”',
      'flag:grudge_active', 1, 'npc_ruyan',
      ['哼一声，擦肩而过', 'karma+0;unflag:grudge_active',
        '你昂首而过，背后那道目光阴冷如蛇。'],
      ['上前搭话，化干戈为玉帛', 'karma+1;unflag:grudge_active',
        '你拱了拱手，对方脸色稍缓。多个朋友，总好过多个仇家。']
    ]
  );

  // ---- 2) 包裹 Game.yearEnd：维护寻仇升级 / 报恩触发 / 了结结算 ----
  const _ye = Game.yearEnd;
  Game.yearEnd = async function () {
    const before = this.G && this.G.year;
    await _ye.call(this);
    if (!this.G || this.G.year === before) return;
    const G = this.G; ensure(G);

    // —— ① 仇敌追杀升级：积怨≥2 的仇家累积，概率触发决战旗 ——
    const foes = Object.keys(G.grudge).filter(k => G.grudge[k] >= 2);
    if (foes.length && !G.flags.foe_final && !G.flags.foeDone && Math.random() < 0.6) {
      G._foeTarget = pick(foes);
      G.flags.foe_final = 1;
      UI.toast(`仇家【${(MONS[G._foeTarget] || { n: '寻仇者' }).n}】恨意滔天，要来做个了断！`, '#ff6a6a');
    }
    // 决战事件已发生（ev_v26_foe_final>0）→ 了结台账、清旗
    if (G.flags.foe_resolved) {
      if (G._foeTarget) { delete G.grudge[G._foeTarget]; G._foeTarget = null; }
      // 兜底：清掉所有高积怨，避免反复
      for (const k in G.grudge) if (G.grudge[k] >= 2) delete G.grudge[k];
      delete G.flags.foe_resolved; delete G.flags.foe_final; G.flags.foeDone = 1;
      UI.toast('这段恩怨，就此了结。', '#9affd8');
    }
    // 偶尔重置 foeDone，给新仇家留机会（每 ~12 年一轮）
    if (G.flags.foeDone && G.year % 12 === 0) delete G.flags.foeDone;

    // —— ② 报恩机缘：善名在外时，恩人来报 ——
    if (G.karma >= 15 && !G.flags.grace_due && !G.flags.graceDone && Math.random() < 0.4) {
      G.flags.grace_due = 1;
      UI.toast('听说有位旧恩人在寻你……', '#ffd8a0');
    }
    if (G.flags.grace_resolved) {
      delete G.flags.grace_due; delete G.flags.grace_resolved; G.flags.graceDone = 1;
    }
    if (G.flags.graceDone && G.year % 10 === 0) delete G.flags.graceDone;

    // —— ③ 冤家路窄激活旗：有任何积怨即可能触发调侃事件 ——
    if (Object.keys(G.grudge).length > 0 && !G.flags.grudge_active) G.flags.grudge_active = 1;
  };
})();

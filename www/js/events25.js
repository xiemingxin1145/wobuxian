'use strict';
// ======================= v2.5 因果轻量：仇敌寻仇 + 报恩机缘（H3） =======================
// 复用 G.karma（已有善恶值）+ G.grudge（新字典，migrate25 兜底）。
// 事件按 events.js 格式注册进事件池；年结维护 grudge 字典。
(function () {
  function ensure(G) { if (window.Sys25) Sys25.normalize(G); }

  // ---- 1) 注册进事件池（[id,标题,文案,cond,weight,por,选项...]）----
  // cond 走 game.js:206 cond 解析器，支持 karma<=n / karma>=n
  EVENTS.push(
    ['v25_grudge', '仇敌寻仇', '你往日行事乖张，结下的仇家寻上门来，要与你做个了断。街角转出几道熟悉的身影……', 'karma<=-5', 2, 'npc_mentor',
      ['拔剑迎战', 'fight:aotian;karma+1', '你击退了寻仇者，仇家暂退。因果，又记下一笔。'],
      ['破财消灾', 'stone-300;karma+1', '你赔了一笔灵石，仇家悻悻而去。破财免灾。']
    ],
    ['v25_enbo', '报恩机缘', '一位你曾随手搭救过的修士辗转寻来，执意要报答你的恩情。', 'karma>=10', 2, 'npc_girl',
      ['收下谢礼', 'item:pyd:2;stone+300;karma+1', '你收下谢礼，因果循环，善有善报。'],
      ['婉拒不受', 'karma+2', '你婉拒了谢礼，对方心中更敬你三分。']
    ]
  );

  // ---- 2) 年结维护 grudge 字典：恶名在外则记录仇家（轻量，不额外开战）----
  const _ye = Game.yearEnd;
  Game.yearEnd = async function () {
    const before = this.G && this.G.year;
    await _ye.call(this);
    if (!this.G || this.G.year === before) return;
    const G = this.G; ensure(G);
    if (G.karma <= -5 && Math.random() < 0.3) {
      const foe = pick(['aotian', 'heixin', 'ruyan']);
      G.grudge[foe] = (G.grudge[foe] || 0) + 1;
      UI.toast(`仇家【${MONS[foe].n}】对你的恨意更深了`, '#ff6a6a');
    }
  };
})();

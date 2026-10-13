'use strict';
// ======================= 3.0② 全系统联动大结局 =======================
// 设计：把 2.5-2.9 各系统（道统弟子/宗门战争宗主/神通悟道/仙界尾声）的养成，
//      映射为可在关键人物处主动选择的"大结局"；按优先级只呈现与主修方向最贴合的一个，
//      其余结局保留在结局库供多周目。
// 接入手法：全部包裹/追加，不改 game.js / talk.js / legacy26 / war29 / dao28 本体。
//   - Object.assign ENDINGS 注册新结局；
//   - 包裹 Talk.extra 链（最外侧）：按 End30.best() 在对应 NPC 给出唯一"大结局"选项；
//   - 包裹 Game.die：仙界尾声完成后飞升，结局升级为「飞升仙界」；
//   - 包裹 Game.yearEnd：一次"大道已成"提示（惰性，不打断玩家）。
// 存档：全部读现有字段（G.apprentice/heir/shentong/dao/sectLeader/war/warMerit/flags.epi_asc/meta.daotong），
//      不新增存档结构、不升 v。
(function () {
  // ---- 1) 新结局登记 ----
  Object.assign(ENDINGS, {
    xianjie: ['飞升仙界', '你渡过雷劫，踏入南天门。仙界不是终点，而是一座更大的灵山——你决定留下来，把"我不仙"的传说，讲给每一个新飞升的仙人听。'],
    daotong_end: ['道统大成', '你将一身修为封入道统之印。弟子开宗立派，子嗣承继衣钵——多年以后，你这一脉的灯，照亮了半个修仙界。'],
    bazhu: ['宗门霸主', '你以一宗之主的身份会盟三界。战旗插遍三山五岳，从此修仙界只认一条规矩：盟主说了算。'],
    wanxian: ['万仙来朝', '你德威并施，三界宗门尽皆折服。万仙来朝之日，你站在南天门下，想起当年那个被讨债鬼追着打的自己。'],
    shentong_end: ['神通大成', '你悟透万法，神通归一。举手投足皆是大道——从此修仙界流传一句话：遇事不决，问一声老先生。'],
    taoli: ['桃李天下', '你这一生传道授业，弟子满门。临终之日，满座弟子叩首相送——你的故事，就是最好的功法。'],
    guiyin: ['归隐', '你散尽恩怨，回桃花村种桃酿酒。村里人不知道，村口那个酒鬼，曾是跟天道算过账的人。'],
  });

  // ---- 2) 结局判定（优先级从上到下；惰性兜底读各系统字段）----
  function daoLayers(G) {
    const d = G.dao || {};
    return Object.keys(d).reduce((a, k) => a + (d[k] || 0), 0);
  }
  function allRelsFriendly(G, min) {
    if (!window.War29 || !G.sect) return false;
    return Object.keys(SECTS).filter(s => s !== G.sect)
      .every(o => War29.getRel(G, G.sect, o) >= min);
  }
  const End30 = {
    // 判定顺序 = 呈现优先级；返回第一个满足的结局 id
    conditions: [
      { id: 'wanxian', where: 'elder', check: G => !!G.sectLeader && (G.war && G.war.wins || 0) >= 2 && allRelsFriendly(G, 40) },
      { id: 'bazhu', where: 'elder', check: G => !!G.sectLeader && (G.war && G.war.wins || 0) >= 1 },
      { id: 'daotong_end', where: 'mentor', check: G => !!(G.apprentice || G.heir || (Game.meta && Game.meta.daotong && Game.meta.daotong.sealed)) },
      { id: 'shentong_end', where: 'xianguan', check: G => (G.shentong || []).length >= 2 && daoLayers(G) >= 6 },
      { id: 'taoli', where: 'mentor', check: G => !!G.apprentice && (G.apprenticeLvl || 0) >= 4 },
      { id: 'guiyin', where: 'villager', check: () => true },
    ],
    best() {
      const G = Game.G; if (!G) return null;
      for (const c of this.conditions) if (c.check(G)) return c.id;
      return 'guiyin';
    },
    where(id) { const c = this.conditions.find(x => x.id === id); return c ? c.where : 'villager'; },
    ready() { const G = Game.G; return !!G && !G.dead && !!G.main && MAIN[G.main] && MAIN[G.main].id === 'done'; },
  };
  window.End30 = End30;

  // ---- 3) 包裹 Talk.extra：在最贴合的 NPC 处给出唯一"大结局"选项 ----
  const _ex = Talk.extra;
  Talk.extra = function (id) {
    const G = Game.G; const out = _ex ? _ex.call(this, id) : [];
    if (!G || G.dead || !End30.ready()) return out;
    const best = End30.best();
    if (id !== End30.where(best)) return out;
    out.push([`🏁 大结局·${ENDINGS[best][0]}（了此一生）`, async () => {
      const c = await UI.say(NPCS[id].por, NPCS[id].n,
        `“……你要了此残生了吗？”\n\n（将走向结局：${ENDINGS[best][0]}）`,
        ['了却残生（结局）', '再想想']);
      if (c === 0) await Game.die(best);
    }]);
    return out;
  };

  // ---- 4) 包裹 Game.die：仙界尾声完成后飞升 → 升级为「飞升仙界」----
  const _die = Game.die;
  Game.die = function (kind) {
    const G = this.G;
    if (G && G.flags && G.flags.epi_asc && (kind === 'ascend' || kind === 'paid')) kind = 'xianjie';
    return _die.call(this, kind);
  };

  // ---- 5) 包裹 Game.yearEnd：旧档/尾声走完后，每年最多提醒一次"大道已成" ----
  const _ye = Game.yearEnd;
  Game.yearEnd = async function () {
    const before = this.G && this.G.year;
    await _ye.call(this);
    const G = this.G;
    if (!G || G.dead || G.year === before) return;
    if (!G.flags) G.flags = {};
    if (!G.flags.end30_told && End30.ready()) {
      G.flags.end30_told = 1;
      const best = End30.best();
      const nm = NPCS[End30.where(best)] ? NPCS[End30.where(best)].n.split('·').pop() : '';
      UI.toast(`你的大道已成——去${nm}处，可了此残生（大结局）`, '#c8a0ff');
    }
  };
})();

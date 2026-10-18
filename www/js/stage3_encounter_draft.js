'use strict';
// v2.5 阶段 3：债务奇遇链（已接入正式 UI 和存档）
// 第 1 步「债主之家」：选择 → 修改真实债务额度与 NPC 好感。
// 第 2 步「讨债追兵」：第 1 步选了「反杀」后，下次触发改为追兵上门（欠债的后果）。
// 只在开发者入口（试炼场按钮 → 取消）触发；自动任务/挂机不会调用这里。

// UI 在 ui.js 里是顶层 `const UI`（不挂 window），旧版用 `window.UI` 判断 → 真页面永远返回 no game or UI
const stage3UI = () => (typeof UI !== 'undefined' && UI ? UI : null);

const Stage3 = {
  npcId: 'debtor_family', // 临时标识，可后续换成真实 NPC
  AFF_MAX: 150,           // 与 game.js aff 效果的上限一致

  flags(G) { if (!G.flags || typeof G.flags !== 'object') G.flags = {}; return G.flags; },

  addAff(G, n) {
    if (!G.aff || typeof G.aff !== 'object') G.aff = {};
    const v = (G.aff[this.npcId] || 0) + (n || 0);
    G.aff[this.npcId] = Math.max(0, Math.min(this.AFF_MAX, v));
  },

  // 旧版这里把 flag 写成了无条件执行，留下 flags.undefined；读档时顺手清掉
  migrate(G) { const F = this.flags(G); if ('undefined' in F) delete F.undefined; },

  // 第 1 步：债主之家
  choicesFor(debt) {
    const attitude = debt > 5000 ? 'hostile' : debt > 1000 ? 'neutral' : 'friendly';
    const choices = {
      hostile: [
        { t: '赖账', debtMul: 1.2, aff: -30 },
        { t: '部分偿还', debtMul: 0.7, aff: +10 },
        { t: '反杀', debtMul: 0, aff: -50, flag: 'bounty' },
      ],
      neutral: [
        { t: '好言相劝', debtMul: 1, aff: +5 },
        { t: '偿还一半', debtMul: 0.5, aff: +20 },
      ],
      friendly: [
        { t: '帮他还债', debtMul: 0.9, aff: +15, nextLife: true },
      ],
    };
    return { attitude, opts: choices[attitude] };
  },

  applyStep1(G, chosen) {
    const F = this.flags(G);
    const debt = G.debt || 0;
    const mul = typeof chosen.debtMul === 'number' ? chosen.debtMul : 1; // 旧版 `|| 1` 把「反杀」的 0 当成 1，债务没变
    const newDebt = Math.max(0, Math.round(debt * mul));
    G.debt = newDebt;
    this.addAff(G, chosen.aff);
    if (chosen.flag) { F[chosen.flag] = 1; F.stage3_bountyDebt = debt; } // 记下被“反杀”掉的账，追兵按它来讨
    if (chosen.nextLife) F.stage3_nextlife = 1;
    return { debtBefore: debt, debtAfter: newDebt };
  },

  // 第 2 步：讨债追兵（只有 flags.bounty 时出现）
  chaseChoices(G) {
    const owed = (G.flags && G.flags.stage3_bountyDebt) || 0;
    const fee = Math.max(100, Math.round(owed * 0.1));
    return [
      { t: `破财消灾（-${fee} 灵石）`, key: 'pay', fee },
      { t: '认账立字据（欠款恢复一半）', key: 'sign', debtAdd: Math.round(owed * 0.5), aff: +20 },
      { t: '连夜跑路（利滚利 +10%）', key: 'run' },
    ];
  },

  applyChase(G, c) {
    const F = this.flags(G);
    const debt = G.debt || 0, stone = G.stone || 0;
    let note = '';
    if (c.key === 'pay') {
      if (stone >= c.fee) { G.stone = stone - c.fee; note = `付了 ${c.fee} 灵石，追兵收钱走人。`; }
      else { G.stone = 0; G.debt = debt + (c.fee - stone); note = `灵石不够，差的 ${c.fee - stone} 记进了天道账本。`; }
    } else if (c.key === 'sign') {
      G.debt = debt + c.debtAdd; this.addAff(G, c.aff); note = '你按了手印，债主家人脸色好看了些。';
    } else {
      G.debt = Math.round(Math.max(debt, 100) * 1.1); note = '跑是跑掉了，讨债司按逃逸加收一成利息。';
      return { note, cleared: false, debtBefore: debt, debtAfter: G.debt }; // 追兵还会再来
    }
    delete F.bounty; delete F.stage3_bountyDebt;
    return { note, cleared: true, debtBefore: debt, debtAfter: G.debt };
  },

  async runChase(G) {
    const opts = this.chaseChoices(G);
    const idx = await UI.card('讨债追兵', `讨债司的追兵堵住了去路：\n“上回把债主打跑了？账可没跑。”\n当前债务：${G.debt || 0}　灵石：${G.stone || 0}`, 'i:bill', opts.map(o => o.t));
    if (idx < 0 || idx >= opts.length) return { ok: false, msg: 'cancelled' };
    const r = this.applyChase(G, opts[idx]);
    if (typeof Game !== 'undefined' && typeof Game.save === 'function') Game.save();
    await UI.card('奇遇结果', `${r.note}\n债务：${r.debtBefore} → ${r.debtAfter}${r.cleared ? '' : '\n（追兵还会再来）'}`, 'i:scroll', ['好']);
    if (UI.hud) UI.hud();
    return { ok: true, step: 'chase', choice: opts[idx].key, ...r };
  },

  async runDebtEncounter(G) {
    if (!G || !stage3UI()) return { ok: false, msg: 'no game or UI' };
    this.migrate(G);
    if (G.flags.bounty) return this.runChase(G); // 链式第 2 步

    const debt = G.debt || 0;
    const { attitude, opts } = this.choicesFor(debt);
    const attitudeName = { hostile: '敌意', neutral: '中立', friendly: '友善' }[attitude];
    const idx = await UI.card('债主之家', `你遇到了债主的家人。\n当前债务：${debt}\n对方态度：${attitudeName}`, 'i:bill', opts.map(o => o.t));
    if (idx < 0 || idx >= opts.length) return { ok: false, msg: 'cancelled' };

    const chosen = opts[idx];
    const r = this.applyStep1(G, chosen);
    if (typeof Game !== 'undefined' && typeof Game.save === 'function') Game.save();

    const resultTxt = `你选择了「${chosen.t}」\n债务：${r.debtBefore} → ${r.debtAfter}\n好感变化：${chosen.aff > 0 ? '+' : ''}${chosen.aff}${chosen.flag === 'bounty' ? '\n讨债司记下了你的名字……' : ''}`;
    await UI.card('奇遇结果', resultTxt, 'i:scroll', ['好']);
    if (UI.hud) UI.hud();
    return { ok: true, step: 'family', attitude, debtBefore: r.debtBefore, debtAfter: r.debtAfter, choice: chosen.t, affDelta: chosen.aff };
  },

  // 开发者测试入口
  async test(G) {
    console.log('[Stage3] running encounter...');
    const r = await this.runDebtEncounter(G);
    console.log('[Stage3] result', r);
    const u = stage3UI(); if (u && u.toast) u.toast('阶段3 奇遇已执行', '#ffe680');
    return r;
  },
};

if (typeof window !== 'undefined') window.Stage3 = Stage3;
if (typeof module !== 'undefined') module.exports = Stage3;
console.log('[Stage3] debt encounter chain loaded');

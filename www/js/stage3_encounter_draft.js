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

  // ======== 阶段 3 小闭环 #2：钱多多的赊账单（奇遇选择 → NPC 态度变化 → 债务后果） ========
  // 复用正式存档：真实 NPC `merchant`（奸商·钱多多，data.js NPCS）的 G.aff.merchant、G.debt、G.flags。
  // 态度阈值与 talk.js greet() 一致：≥60 亲近 / ≥20 一般 / <20 记仇。闲聊、送礼等正式玩法改的好感也会影响第 2 步。
  // 第 1 步「赊账单」：选择改好感/债务，记 flags.s3m_step=1；第 2 步「钱多多回访」按当时态度结算债务后果，记 flags.s3m_done=1。
  // 记仇 → 钱多多把你卖给讨债司：债务 +10% 且挂上 flags.bounty → 下次「债主之家」入口直接变「讨债追兵」（接上第 1 条链）。
  // 只由开发者入口「奇遇链」按钮触发；自动任务/挂机不会调用这里。
  M_NPC: 'merchant',
  merchantAttitude(G) {
    const a = (G.aff && G.aff[this.M_NPC]) || 0;
    return a >= 60 ? 'close' : a >= 20 ? 'neutral' : 'grudge';
  },
  M_ATT_NAME: { close: '亲近', neutral: '一般', grudge: '记仇' },
  merchantChoices() {
    return [
      { t: '替他扛下这笔税（天道欠款 +300）', key: 'cover', debt: +300, aff: +60 },
      { t: '向讨债司举报他偷税（欠款 -200）', key: 'report', debt: -200, aff: -40 },
      { t: '不掺和', key: 'ignore', debt: 0, aff: -5 },
    ];
  },
  addAffTo(G, id, n) {
    if (!G.aff || typeof G.aff !== 'object') G.aff = {};
    G.aff[id] = Math.max(0, Math.min(this.AFF_MAX, (G.aff[id] || 0) + (n || 0)));
  },
  applyMerchant1(G, c) {
    const F = this.flags(G);
    const before = G.debt || 0, affBefore = (G.aff && G.aff[this.M_NPC]) || 0;
    G.debt = Math.max(0, before + c.debt);
    this.addAffTo(G, this.M_NPC, c.aff);
    F.s3m_step = 1; F.s3m_choice = c.key;
    return { debtBefore: before, debtAfter: G.debt, affBefore, affAfter: G.aff[this.M_NPC], attitude: this.merchantAttitude(G) };
  },
  // 第 2 步：按当时态度结算
  applyMerchant2(G) {
    const F = this.flags(G);
    const att = this.merchantAttitude(G);
    const before = G.debt || 0;
    let note;
    if (att === 'close') {
      const pay = Math.min(before, 500);
      G.debt = before - pay;
      note = pay > 0 ? `钱多多：“上回多亏你！”他偷偷替你还了 ${pay} 灵石。` : '钱多多：“你居然不欠钱？那请你喝酒！”';
    } else if (att === 'neutral') {
      note = '钱多多打了个哈哈：“生意人，不记账。”什么也没发生。';
    } else {
      const add = Math.round(Math.max(before, 100) * 0.1);
      G.debt = before + add;
      F.bounty = 1; F.stage3_bountyDebt = Math.max(F.stage3_bountyDebt || 0, G.debt);
      note = `钱多多把你的行踪卖给了讨债司，欠款 +${add}。\n讨债司的追兵已经上路……`;
    }
    delete F.s3m_step; F.s3m_done = 1;
    return { attitude: att, debtBefore: before, debtAfter: G.debt, note, bounty: !!F.bounty };
  },
  async runMerchantChain(G) {
    const ui = stage3UI();
    if (!G || !ui) return { ok: false, msg: 'no game or UI' };
    this.migrate(G);
    const F = this.flags(G);
    const save = () => { if (typeof Game !== 'undefined' && Game && typeof Game.save === 'function') Game.save(); };
    if (F.s3m_step === 1) {
      const att = this.merchantAttitude(G);
      const idx = await ui.card('钱多多回访', `钱多多又找上门来。\n他对你的态度：${this.M_ATT_NAME[att]}（好感 ${G.aff[this.M_NPC] || 0}）\n当前债务：${G.debt || 0}`, 'npc_merchant', ['看他想干嘛', '先躲开']);
      if (idx !== 0) return { ok: false, msg: 'cancelled' };
      const r = this.applyMerchant2(G);
      save();
      await ui.card('奇遇结果', `${r.note}\n债务：${r.debtBefore} → ${r.debtAfter}`, 'i:scroll', ['好']);
      if (ui.hud) ui.hud();
      return { ok: true, step: 'visit', ...r };
    }
    const opts = this.merchantChoices();
    const idx = await ui.card('钱多多的赊账单', `钱多多拉住你：“讨债司要查我的税！帮帮忙，回头亏待不了你。”\n当前债务：${G.debt || 0}　他对你的好感：${(G.aff && G.aff[this.M_NPC]) || 0}`, 'npc_merchant', opts.map(o => o.t));
    if (idx < 0 || idx >= opts.length) return { ok: false, msg: 'cancelled' };
    const r = this.applyMerchant1(G, opts[idx]);
    save();
    await ui.card('奇遇结果', `你选择了「${opts[idx].t}」\n债务：${r.debtBefore} → ${r.debtAfter}\n钱多多好感：${r.affBefore} → ${r.affAfter}（${this.M_ATT_NAME[r.attitude]}）\n他会记住这件事的……`, 'i:scroll', ['好']);
    if (ui.hud) ui.hud();
    return { ok: true, step: 'bill', choice: opts[idx].key, ...r };
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

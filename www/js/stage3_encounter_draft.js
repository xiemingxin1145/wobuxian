'use strict';
// v2.5 阶段 3：债务奇遇闭环（已接入正式 UI 和存档）
// 选择 → 修改真实债务额度与 NPC 好感。

const Stage3 = {
  npcId: 'debtor_family', // 临时标识，可后续换成真实 NPC

  async runDebtEncounter(G) {
    if (!G || !window.UI) return { ok: false, msg: 'no game or UI' };
    const debt = G.debt || 0;
    const attitude = debt > 5000 ? 'hostile' : debt > 1000 ? 'neutral' : 'friendly';
    const attitudeName = { hostile: '敌意', neutral: '中立', friendly: '友善' }[attitude];

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

    const opts = choices[attitude] || choices.neutral;
    const texts = opts.map(o => o.t);

    // 用正式对话
    const idx = await UI.card('债主之家', `你遇到了债主的家人。\n\u5f53前债务：${debt}\n对方态度：${attitudeName}`, 'i:bill', texts);
    if (idx < 0 || idx >= opts.length) return { ok: false, msg: 'cancelled' };

    const chosen = opts[idx];
    const newDebt = Math.max(0, Math.round(debt * (chosen.debtMul || 1)));
    G.debt = newDebt;

    // 好感（临时记到 flags 或 aff）
    if (!G.aff) G.aff = {};
    G.aff[this.npcId] = (G.aff[this.npcId] || 0) + (chosen.aff || 0);

    if (chosen.flag) G.flags = G.flags || {}; G.flags[chosen.flag] = 1;
    if (chosen.nextLife) G.flags = G.flags || {}; G.flags.stage3_nextlife = 1;

    // 保存
    if (typeof Game.save === 'function') Game.save();

    const resultTxt = `你选择了「${chosen.t}」\n债务：${debt} → ${newDebt}\n好感变化：${chosen.aff > 0 ? '+' : ''}${chosen.aff}`;
    await UI.card('奇遇结果', resultTxt, 'i:scroll', ['好']);

    if (window.UI && UI.hud) UI.hud();
    return { ok: true, attitude, debtBefore: debt, debtAfter: newDebt, choice: chosen.t, affDelta: chosen.aff };
  },

  // 开发者测试入口
  async test(G) {
    console.log('[Stage3] running encounter...');
    const r = await this.runDebtEncounter(G);
    console.log('[Stage3] result', r);
    if (window.UI && UI.toast) UI.toast('阶段3 奇遇已执行', '#ffe680');
    return r;
  },
};

window.Stage3 = Stage3;
console.log('[Stage3] debt encounter (integrated) loaded');

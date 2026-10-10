'use strict';
// v2.5 阶段 3 草稿：一条可测的债务奇遇闭环
// 目标：选择 → NPC 态度变化 → 债务后果。先独立，不接正式存档。

const Stage3 = {
  // 模拟一条奇遇：遇到债主的家人
  async runDebtEncounter(G) {
    if (!G) return { ok: false, msg: 'no game state' };
    const debt = G.debt || 0;
    const attitude = debt > 5000 ? 'hostile' : debt > 1000 ? 'neutral' : 'friendly';

    // 模拟对话选择
    const choices = {
      hostile: [
        { t: '赖账（债务+20%，好感-30）', debt: Math.round(debt * 1.2), aff: -30 },
        { t: '部分偿还（债务-30%，好感+10）', debt: Math.round(debt * 0.7), aff: +10 },
        { t: '反杀（债务清零，但触发追兵）', debt: 0, aff: -50, flag: 'bounty' },
      ],
      neutral: [
        { t: '好言相劝（债务不变，好感+5）', debt, aff: +5 },
        { t: '偿还一半（债务-50%，好感+20）', debt: Math.round(debt * 0.5), aff: +20 },
      ],
      friendly: [
        { t: '帮他还债（债务-10%，好感+15，下一世加成）', debt: Math.round(debt * 0.9), aff: +15, nextLife: true },
      ],
    };

    const opts = choices[attitude] || choices.neutral;
    // 返回结构，实际 UI 调用时再接入 UI.card / UI.say
    return {
      ok: true,
      attitude,
      debtBefore: debt,
      options: opts,
      note: '阶段3 草稿：选择会影响债务额度与 NPC 好感。正式接入需后续小步验证。',
    };
  },

  // 开发者测试入口
  test(G) {
    console.log('[Stage3] test encounter', this.runDebtEncounter(G));
    return this.runDebtEncounter(G);
  },
};

window.Stage3 = Stage3;
console.log('[Stage3] debt encounter draft loaded');

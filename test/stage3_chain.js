// 阶段 3 债务奇遇链无头单测：node test/stage3_chain.js（退出码 = 失败数）
// 用假的 UI.card 依次返回预设选项，只验证状态变化，不碰真实页面。
'use strict';
const path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
global.window = global;
let picks = []; const shown = [];
global.UI = { card: async (title, body, ic, opts) => { shown.push(title); return picks.length ? picks.shift() : 0; }, hud() {}, toast() {} };
let saves = 0; global.Game = { save() { saves++; } };
const S = require(path.join(__dirname, '..', 'www', 'js', 'stage3_encounter_draft.js'));
const mk = (o) => Object.assign({ debt: 8888, stone: 500, aff: {}, flags: {} }, o);

(async () => {
  // 1. 敌意-赖账：不应写入任何 flag（旧 bug：flags.undefined / stage3_nextlife 被无条件写入）
  let G = mk(); picks = [0, 0];
  let r = await S.runDebtEncounter(G);
  ok(r.ok && r.attitude === 'hostile' && G.debt === Math.round(8888 * 1.2), '赖账 债务×1.2');
  ok(!('undefined' in G.flags) && !G.flags.stage3_nextlife && !G.flags.bounty, '赖账 不写多余 flag');
  ok(G.aff.debtor_family === 0, '好感下限钳到 0');
  ok(saves >= 1, '选择后存档');

  // 2. 反杀 → 第 2 步追兵
  G = mk(); picks = [2, 0];
  r = await S.runDebtEncounter(G);
  ok(G.debt === 0 && G.flags.bounty === 1 && G.flags.stage3_bountyDebt === 8888, '反杀 清账但记下追兵');
  shown.length = 0; picks = [1, 0];
  r = await S.runDebtEncounter(G);
  ok(r.step === 'chase' && shown[0] === '讨债追兵', '再次触发 = 追兵上门');
  ok(G.debt === 4444 && !G.flags.bounty && !('stage3_bountyDebt' in G.flags), '认账 欠款恢复一半 并结束追兵');
  ok(G.aff.debtor_family === 20, '认账 好感 +20');
  shown.length = 0; picks = [0, 0];
  r = await S.runDebtEncounter(G);
  ok(r.step === 'family', '追兵了结后回到第 1 步');

  // 3. 追兵-破财消灾，灵石不够时差额进账本
  G = mk({ debt: 0, stone: 300, flags: { bounty: 1, stage3_bountyDebt: 8888 } }); picks = [0, 0];
  r = await S.runDebtEncounter(G);
  ok(G.stone === 0 && G.debt === 889 - 300 && !G.flags.bounty, '破财消灾 灵石不足 差额记账');
  G = mk({ debt: 0, stone: 1000, flags: { bounty: 1, stage3_bountyDebt: 8888 } }); picks = [0, 0];
  await S.runDebtEncounter(G);
  ok(G.stone === 111 && G.debt === 0, '破财消灾 灵石足够');

  // 4. 追兵-跑路：加息且追兵保留
  G = mk({ debt: 1000, flags: { bounty: 1, stage3_bountyDebt: 8888 } }); picks = [2, 0];
  r = await S.runDebtEncounter(G);
  ok(G.debt === 1100 && G.flags.bounty === 1 && r.cleared === false, '跑路 +10% 追兵仍在');

  // 5. 友善-帮他还债 才写下一世 flag；旧档 flags.undefined 被清理
  G = mk({ debt: 500, flags: { undefined: 1 } }); picks = [0, 0];
  await S.runDebtEncounter(G);
  ok(G.debt === 450 && G.flags.stage3_nextlife === 1 && !('undefined' in G.flags), '帮他还债 写下一世 flag + 清理旧 bug');

  // 6. 取消不改状态；旧存档没有 flags/aff 也不崩
  G = { debt: 3000, stone: 10 }; picks = [-1];
  r = await S.runDebtEncounter(G);
  ok(!r.ok && G.debt === 3000, '取消不改债务；旧存档缺字段不崩');
  G = mk({ aff: { debtor_family: 145 }, debt: 500 }); picks = [0, 0];
  await S.runDebtEncounter(G);
  ok(G.aff.debtor_family === 150, '好感上限钳到 150');

  // 7. 真实页面里 UI/Game 是顶层 const（不在 window 上）：vm 模拟，确认奇遇仍能弹卡并改债务（旧版 window.UI 判断 → 永远 no game or UI）
  const vm = require('vm'), fs = require('fs');
  const cx = vm.createContext({ console });
  vm.runInContext("var window = globalThis; const cards = []; const UI = { card: async (t) => { cards.push(t); return 0; }, hud() {}, toast() {} }; let saved = 0; const Game = { save() { saved++; } };", cx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'www', 'js', 'stage3_encounter_draft.js'), 'utf8'), cx);
  const r7 = await vm.runInContext("(async () => { const G = { debt: 8888, aff: {}, flags: {} }; const r = await window.Stage3.test(G); return { r, debt: G.debt, cards, saved }; })()", cx);
  ok(r7.r.ok && r7.debt === 10666 && r7.cards[0] === '债主之家' && r7.saved === 1, 'UI 为顶层 const 时奇遇照常弹卡、改债务、存档');
  ok(!/window\.(UI|Game)\b/.test(fs.readFileSync(path.join(__dirname, '..', 'www', 'js', 'stage3_encounter_draft.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '')), 'stage3 代码里不再用 window.UI / window.Game');
  const de = fs.readFileSync(path.join(__dirname, '..', 'www', 'js', 'dev_entry_v25.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  ok(!/window\.(UI|Game)\b/.test(de), 'dev_entry_v25 代码里不再用 window.UI / window.Game');

  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  process.exit(fails);
})();

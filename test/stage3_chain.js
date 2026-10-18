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

  // 8. 小闭环 #2「钱多多的赊账单」：奇遇选择 → 钱多多态度 → 债务后果
  const M = (o) => Object.assign({ debt: 1000, stone: 0, aff: {}, flags: {} }, o);
  saves = 0;
  // 8a. 扛税 → 亲近 → 回访替你还 500
  G = M(); picks = [0, 0]; shown.length = 0;
  r = await S.runMerchantChain(G);
  ok(r.ok && r.step === 'bill' && shown[0] === '钱多多的赊账单' && G.debt === 1300 && G.aff.merchant === 60 && r.attitude === 'close', '扛税：债务 1000→1300、钱多多好感 0→60（亲近）');
  ok(G.flags.s3m_step === 1 && G.flags.s3m_choice === 'cover' && saves >= 1, '第 1 步记 s3m_step=1 并存档');
  picks = [0, 0]; shown.length = 0;
  r = await S.runMerchantChain(G);
  ok(r.step === 'visit' && shown[0] === '钱多多回访' && r.attitude === 'close' && G.debt === 800, '回访（亲近）：钱多多替你还 500，债务 1300→800');
  ok(!G.flags.s3m_step && G.flags.s3m_done === 1 && !G.flags.bounty, '回访后链结束（s3m_done=1），不挂追兵');
  // 8b. 举报 → 记仇 → 卖你行踪：+10% 并接上讨债追兵（第 1 条链的第 2 步）
  G = M(); picks = [1, 0];
  r = await S.runMerchantChain(G);
  ok(G.debt === 800 && G.aff.merchant === 0 && r.attitude === 'grudge', '举报：债务 1000→800、好感钳到 0（记仇）');
  picks = [0, 0];
  r = await S.runMerchantChain(G);
  ok(r.attitude === 'grudge' && G.debt === 880 && G.flags.bounty === 1 && G.flags.stage3_bountyDebt === 880, '回访（记仇）：欠款 +10% → 880，挂上讨债追兵');
  shown.length = 0; picks = [1, 0];
  r = await S.runDebtEncounter(G);
  ok(r.step === 'chase' && shown[0] === '讨债追兵' && G.debt === 880 + 440 && !G.flags.bounty, '后果接上链 #1：下次债主入口变「讨债追兵」，认账 +440');
  // 8c. 不掺和 + 已有好感 30 → 25 一般 → 回访无事
  G = M({ aff: { merchant: 30 } }); picks = [2, 0];
  r = await S.runMerchantChain(G);
  ok(G.aff.merchant === 25 && r.attitude === 'neutral' && G.debt === 1000, '不掺和：好感 30→25（一般），债务不变');
  picks = [0, 0]; r = await S.runMerchantChain(G);
  ok(r.attitude === 'neutral' && G.debt === 1000 && !G.flags.bounty, '回访（一般）：什么也没发生');
  // 8d. 两步之间正式玩法改了好感（闲聊/送礼）→ 回访按「当时」态度结算
  G = M(); picks = [1, 0]; await S.runMerchantChain(G);
  G.aff.merchant = 70; picks = [0, 0]; r = await S.runMerchantChain(G);
  ok(r.attitude === 'close' && G.debt === 300 && !G.flags.bounty, '举报后又送礼到 70 → 回访按亲近结算（800→300），不挂追兵');
  // 8e. 边界：没欠款时亲近不出负数；举报不让债务 <0；好感上限 150；取消不改状态；旧存档缺字段
  G = M({ debt: 0, aff: { merchant: 120 } }); picks = [0, 0]; await S.runMerchantChain(G);
  ok(G.aff.merchant === 150 && G.debt === 300, '好感上限钳到 150');
  G.debt = 0; picks = [0, 0]; r = await S.runMerchantChain(G);
  ok(G.debt === 0 && r.debtAfter === 0, '亲近回访但没欠款：不出现负债');
  G = M({ debt: 100 }); picks = [1, 0]; await S.runMerchantChain(G);
  ok(G.debt === 0, '举报减免不让债务 <0');
  G = M(); picks = [-1]; r = await S.runMerchantChain(G);
  ok(!r.ok && G.debt === 1000 && !G.flags.s3m_step && !('merchant' in G.aff), '第 1 步取消：不改任何状态');
  G = M({ flags: { s3m_step: 1 } }); picks = [1]; r = await S.runMerchantChain(G);
  ok(!r.ok && G.flags.s3m_step === 1 && G.debt === 1000, '回访选「先躲开」：链保留，下次再来');
  G = { debt: 500 }; picks = [0, 0]; r = await S.runMerchantChain(G);
  ok(r.ok && G.debt === 800 && G.aff.merchant === 60, '旧存档缺 aff/flags 不崩');
  ok(S.merchantAttitude({ aff: { merchant: 59 } }) === 'neutral' && S.merchantAttitude({ aff: { merchant: 60 } }) === 'close' && S.merchantAttitude({ aff: { merchant: 19 } }) === 'grudge' && S.merchantAttitude({ aff: { merchant: 20 } }) === 'neutral', '态度阈值与 talk.js greet 一致：60 / 20');
  // 8f. 隔离：只有开发者入口调用，自动任务/挂机不碰
  const jsDir = path.join(__dirname, '..', 'www', 'js');
  const callers = require('fs').readdirSync(jsDir).filter(f => f.endsWith('.js') && f !== 'stage3_encounter_draft.js' && /runMerchantChain/.test(require('fs').readFileSync(path.join(jsDir, f), 'utf8')));
  ok(callers.join(',') === 'dev_entry_v25.js', '只有 dev_entry_v25.js 调用 runMerchantChain：' + callers.join(','));

  // 9. 小闭环 #3「记账童子的错账」：仙官·记账童子 xianguan + 天道债务
  const X = (o) => Object.assign({ debt: 5000, stone: 1000, aff: {}, flags: {} }, o);
  // 9a. 陪他对账 → 亲近 → 查账改单利 ×0.8
  G = X(); picks = [0, 0]; shown.length = 0;
  r = await S.runLedgerChain(G);
  ok(r.step === 'ledger' && shown[0] === '记账童子的错账' && G.aff.xianguan === 60 && G.debt === 5000 && r.attitude === 'close', '对账：好感 0→60（亲近），债务不变');
  ok(G.flags.s3x_step === 1 && !('merchant' in G.aff) && !G.flags.s3m_step, '记 s3x_step；不碰钱多多链的状态');
  picks = [0, 0]; shown.length = 0; r = await S.runLedgerChain(G);
  ok(shown[0] === '天道查账' && r.attitude === 'close' && G.debt === 4000 && G.flags.s3x_done === 1 && !G.flags.s3x_step, '查账（亲近）：欠款 ×0.8 → 4000，链结束');
  // 9b. 贿赂 → 好感 20 一般 → 查账露馅：补回 1500 +10%
  G = X(); picks = [1, 0]; r = await S.runLedgerChain(G);
  ok(r.choice === 'bribe' && G.stone === 700 && G.debt === 3500 && G.aff.xianguan === 20 && G.flags.s3x_bribe === 1500, '贿赂：灵石 -300、欠款 -1500、好感 20（一般）');
  picks = [0, 0]; r = await S.runLedgerChain(G);
  ok(r.exposed && G.debt === 3500 + 1650 && !G.flags.s3x_bribe, '查账（一般+贿赂）：露馅，补回 1500×1.1 = +1650');
  // 9c. 贿赂后又刷好感到亲近 → 童子替你瞒下，还给单利
  G = X(); picks = [1, 0]; await S.runLedgerChain(G);
  G.aff.xianguan = 80; picks = [0, 0]; r = await S.runLedgerChain(G);
  ok(!r.exposed && r.attitude === 'close' && G.debt === 2800, '贿赂后送礼到 80：童子瞒下 + 单利 ×0.8（3500→2800）');
  // 9d. 告发 → 记仇 → 查账加误工费 +15%
  G = X(); picks = [2, 0]; r = await S.runLedgerChain(G);
  ok(r.choice === 'report' && G.debt === 4700 && G.aff.xianguan === 0 && r.attitude === 'grudge', '告发：欠款 -300、好感钳 0（记仇）');
  picks = [0, 0]; r = await S.runLedgerChain(G);
  ok(r.attitude === 'grudge' && G.debt === 4700 + 705, '查账（记仇）：误工费 +15%（+705）');
  // 9e. 一般且未贿赂 → 无事
  G = X({ aff: { xianguan: 30 } }); picks = [2, 0]; await S.runLedgerChain(G); G.aff.xianguan = 30;
  picks = [0, 0]; r = await S.runLedgerChain(G);
  ok(r.attitude === 'neutral' && !r.exposed && G.debt === 4700, '查账（一般、没贿赂）：什么也没发生');
  // 9f. 灵石不足 300 不出现贿赂选项；第 2 个选项变成告发
  G = X({ stone: 299 }); picks = [1, 0]; r = await S.runLedgerChain(G);
  ok(S.ledgerChoices({ stone: 299 }).length === 2 && r.choice === 'report' && G.stone === 299, '灵石不足：没有贿赂选项，第 2 项为告发');
  // 9g. 边界：欠款少于 1500 时贿赂只抹到 0，露馅只补回实际抹掉的；取消；旧存档
  G = X({ debt: 400 }); picks = [1, 0]; await S.runLedgerChain(G);
  ok(G.debt === 0 && G.flags.s3x_bribe === 400, '欠款 400 贿赂：抹到 0，记实际抹掉 400');
  picks = [0, 0]; await S.runLedgerChain(G);
  ok(G.debt === 440, '露馅只补回实际抹掉的 400×1.1 = 440');
  G = X(); picks = [-1]; r = await S.runLedgerChain(G);
  ok(!r.ok && G.debt === 5000 && G.stone === 1000 && !G.flags.s3x_step, '第 1 步取消：不改状态');
  G = X({ flags: { s3x_step: 1 } }); picks = [1]; r = await S.runLedgerChain(G);
  ok(!r.ok && G.flags.s3x_step === 1, '查账选「改天再说」：链保留');
  G = { debt: 100 }; picks = [0, 0]; r = await S.runLedgerChain(G);
  ok(r.ok && G.aff.xianguan === 60 && G.stone === 0, '旧存档缺 stone/aff/flags 不崩（无贿赂项）');
  const callers2 = require('fs').readdirSync(jsDir).filter(f => f.endsWith('.js') && f !== 'stage3_encounter_draft.js' && /runLedgerChain/.test(require('fs').readFileSync(path.join(jsDir, f), 'utf8')));
  ok(callers2.join(',') === 'dev_entry_v25.js', '只有 dev_entry_v25.js 调用 runLedgerChain：' + callers2.join(','));

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

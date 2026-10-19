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

  // 10. 债务系统强化 #1：债压档位 → 讨债追兵（只读）
  const DP = (o) => S.debtPressure(o);
  ok(DP({ debt: 0 }).tier === 0 && DP({ debt: 1000 }).tier === 0 && DP({ debt: 1001 }).tier === 1, '债压：≤1000 小账、1001 起欠款（与债主之家阈值一致）');
  ok(DP({ debt: 5000 }).tier === 1 && DP({ debt: 5001 }).tier === 2 && DP({ debt: 20000 }).tier === 2 && DP({ debt: 20001 }).tier === 3, '债压：5001 起重债、20001 起天道通缉');
  ok(DP({ debt: 8888 }).n === '重债' && DP({ debt: 99999 }).n === '天道通缉' && DP({ debt: 10 }).n === '小账', '债压档名');
  ok(DP({ debt: 10, flags: { bounty: 1 } }).tier === 1 && DP({ debt: 30000, flags: { bounty: 1 } }).tier === 3 && DP({ debt: 10, flags: { bounty: 1 } }).bounty, '挂着追兵加一档，封顶天道通缉');
  ok([null, undefined, {}, { debt: -5 }, { debt: NaN }, { debt: 'abc' }, { debt: Infinity }, { flags: 'x' }].every(g => DP(g).tier === 0 && DP(g).debt === 0), '异常存档（无/负/NaN/字符串/无穷/flags 非对象）回退小账、不崩');
  const hz = [0, 3000, 8888, 30000].map(d => S.bountyEnemies({ debt: d }));
  ok(hz.map(a => a.length).join() === '1,2,3,4', '追兵数随档位 1/2/3/4');
  ok(hz[0][0].hp === 80 && hz[1][0].hp === 92 && hz[2][0].hp === 104 && hz[3][0].hp === 116, '追兵血量 80×1/1.15/1.3/1.45');
  ok(hz[3][0].name === '讨债鬼头子' && hz[2].every(e => e.name === '讨债鬼') && hz[3].every(e => e.spr === 'mon_collector' && e.box === 'taozhai'), '天道通缉档领头为讨债鬼头子；全用讨债鬼精灵/方块讨债鬼差');
  ok(new Set(hz[3].map(e => e.atkCd)).size === 4 && new Set(hz[3].map(e => e.x + ',' + e.y)).size === 4, '追兵出手冷却与站位互不相同');
  ok(hz[3].every(e => e.x >= 40 && e.x <= 560 && e.y >= 60 && e.y <= 480 && Math.hypot(e.x - 300, e.y - 320) >= 120), '追兵都在场地内且不贴脸刷在主角(300,320)身边');
  const Gro = mk({ debt: 30000, flags: { bounty: 1 } }); const snap = JSON.stringify(Gro);
  S.debtPressure(Gro); S.bountyEnemies(Gro);
  ok(JSON.stringify(Gro) === snap, '算债压/生成追兵不改存档');
  const src3 = require('fs').readFileSync(path.join(jsDir, 'stage3_encounter_draft.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  ok(!/RealtimeBattle/.test(src3), 'stage3 不直接引用 RealtimeBattle（只出数据）');
  const callers3 = require('fs').readdirSync(jsDir).filter(f => f.endsWith('.js') && f !== 'stage3_encounter_draft.js' && /bountyEnemies|debtPressure/.test(require('fs').readFileSync(path.join(jsDir, f), 'utf8')));
  ok(callers3.join(',') === 'dev_entry_v25.js', '只有 dev_entry_v25.js 调用 debtPressure/bountyEnemies：' + callers3.join(','));

  // 11. 债务系统强化 #2：追兵战按胜负结算
  const SB = S.settleBounty.bind(S);
  let Gb = mk({ debt: 8888, flags: { bounty: 1, stage3_bountyDebt: 8888 } });
  let sb = SB(Gb, { result: 'win', reason: 'cleared', tier: 3 });
  ok(sb.settled && sb.result === 'win' && sb.bountyCleared && !Gb.flags.bounty && !('stage3_bountyDebt' in Gb.flags), '胜：撤掉通缉（bounty + stage3_bountyDebt）');
  ok(Gb.debt === 8888 && sb.debtBefore === 8888 && sb.debtAfter === 8888 && sb.fee === 0 && Gb.flags.s3b_win === 1, '胜：欠款不变、记一次胜场');
  Gb = mk({ debt: 3000 }); sb = SB(Gb, { result: 'win', reason: 'cleared', tier: 1 });
  ok(sb.settled && !sb.bountyCleared && Gb.debt === 3000 && /账还挂/.test(sb.note), '胜但没被通缉：只是打退，账还在');
  const lose = (debt, tier, reason) => { const g = mk({ debt }); const r = SB(g, { result: 'lose', reason: reason || 'dead', tier }); return [g, r]; };
  let [gl, rl] = lose(8888, 2);
  ok(rl.settled && rl.fee === Math.round(8888 * 0.10) && gl.debt === 8888 + 889 && gl.flags.s3b_lose === 1, '败（重债）：误工费 = 欠款 × 10%');
  ok(lose(3000, 1)[1].fee === 240 && lose(30000, 3)[1].fee === 3600 && lose(600, 0)[1].fee === 100, '败：费率 8%/12%，小账保底 100');
  [gl, rl] = lose(0, 0, 'timeout');
  ok(gl.debt === 100 && /拖太久/.test(rl.note), '败（超时）：0 欠款也记 100 误工费，文案提示超时');
  Gb = mk({ debt: 30000, flags: { bounty: 1, stage3_bountyDebt: 30000 } }); SB(Gb, { result: 'lose', reason: 'dead', tier: 3 });
  ok(Gb.flags.bounty === 1 && Gb.flags.stage3_bountyDebt === 30000 && Gb.debt === 33600, '败：通缉照旧');
  Gb = mk({ debt: 30000, flags: { bounty: 1 } }); const snapB = JSON.stringify(Gb);
  sb = SB(Gb, { result: 'lose', reason: 'closed', tier: 3 });
  ok(!sb.settled && sb.reason === 'closed' && JSON.stringify(Gb) === snapB, '中途关掉覆盖层：不结算、不改存档');
  ok([undefined, null, {}, { result: 'draw' }, { result: 'WIN' }].every(o => !SB(mk(), o).settled) && !SB(null, { result: 'win' }).settled, '非法结果/无存档：不结算、不崩');
  Gb = mk({ debt: 8888 }); sb = SB(Gb, { result: 'lose', reason: 'dead' });
  ok(sb.tier === 2 && sb.fee === 889, '没传开战档位：按当前债压算');
  Gb = mk({ debt: 8888 }); sb = SB(Gb, { result: 'lose', reason: 'dead', tier: 0 });
  ok(sb.tier === 0 && sb.fee === 444, '按开战时档位结算（不因误工费跳档改费率）');
  ok([{ debt: -5 }, { debt: 'abc' }, { debt: NaN }].every(o => { const g = Object.assign({}, o); return SB(g, { result: 'lose', reason: 'dead', tier: 0 }).fee === 100 && g.debt === 100; }), '异常欠款回退 0 + 保底 100，且补出 flags');
  Gb = mk({ debt: 5000 }); SB(Gb, { result: 'lose', tier: 1 }); SB(Gb, { result: 'win', tier: 1 }); SB(Gb, { result: 'lose', tier: 1 });
  ok(Gb.flags.s3b_win === 1 && Gb.flags.s3b_lose === 2, '胜败次数累计');
  const callers4 = require('fs').readdirSync(jsDir).filter(f => f.endsWith('.js') && f !== 'stage3_encounter_draft.js' && /settleBounty/.test(require('fs').readFileSync(path.join(jsDir, f), 'utf8')));
  ok(callers4.join(',') === 'dev_entry_v25.js', '只有 dev_entry_v25.js 调用 settleBounty：' + callers4.join(','));

  // 12. 债务系统强化 #3：债压档位 → 突破难度预览（只读）
  const BP = (g, game) => S.breakthroughPreview(g, game);
  // node 里没有 REALMS/Game 的突破公式 → 回退默认 60%，四档惩罚 0/3/8/15
  const p4 = [0, 3000, 8888, 30000].map(d => BP({ debt: d, realm: 1, st: { int: 5, luck: 5 } }, null));
  ok(p4.map(p => p.tier).join() === '0,1,2,3' && p4.map(p => p.tierName).join() === '小账,欠款,重债,天道通缉', '突破预估：四档与 debtPressure 一致');
  ok(p4.map(p => p.penalty).join() === '0,3,8,15' && p4.map(p => p.estimate).join() === '60,57,52,45', '突破预估：惩罚 0/3/8/15 个百分点，预估 = 基础 − 惩罚');
  ok(p4.every(p => p.source === 'fallback' && p.base === 60 && p.applicable && p.readOnly && /默认 60%/.test(p.note)), '读不到 REALMS → 回退默认 60% 并在 note 标注');
  ok(/欠得多，突破更难/.test(p4[3].note) && /不影响突破/.test(p4[0].note) && /只读预估/.test(p4[2].note), '文案：小账不影响、欠得多突破更难、标注只读预估');
  ok(BP({ debt: 10, flags: { bounty: 1 } }, null).tier === 1 && BP({ debt: 10, flags: { bounty: 1 } }, null).penalty === 3 && BP({ debt: 30000, flags: { bounty: 1 } }, null).penalty === 15, '挂通缉 +1 档，封顶天道通缉（−15）');
  ok([null, undefined, {}, { debt: NaN }, { debt: 'x', flags: 'y' }, { debt: -1, realm: 'a' }].every(g => { const p = BP(g, null); return p.tier === 0 && p.source === 'fallback' && p.estimate === 60; }), '异常存档：档位回退小账、基础回退 60%、不崩');
  // 用真实 data.js + game.js（vm）对照：预览的基础成功率 = 正式「冲击瓶颈」卡片上显示的「成功率约 N%」
  const vmB = require('vm'), fsB = require('fs');
  const bcx = vmB.createContext({ console, window: {}, localStorage: { getItem() { return null; }, setItem() {} }, document: {} });
  vmB.runInContext(fsB.readFileSync(path.join(jsDir, 'data.js'), 'utf8'), bcx);
  vmB.runInContext(fsB.readFileSync(path.join(jsDir, 'game.js'), 'utf8'), bcx);
  vmB.runInContext("var UI = { card: async (t, b) => { __cards.push(b); return 1; }, hud() {}, toast() {} }; var Sfx = { play() {} }; var __cards = []; Game.meta = { perks: {}, achs: {}, endings: {} };", bcx);
  vmB.runInContext(fsB.readFileSync(path.join(jsDir, 'stage3_encounter_draft.js'), 'utf8'), bcx);
  bcx.__saves = [
    { realm: 0, st: { int: 5, luck: 5 }, brkBonus: 0, tmpBrk: 0, inv: {}, tree: {}, flags: { awakened: 1 }, debt: 0 },
    { realm: 1, st: { int: 3, luck: 2 }, brkBonus: 0, tmpBrk: 0, inv: { zjd: 1 }, tree: {}, flags: {}, debt: 3000 },
    { realm: 2, st: { int: 4, luck: 2 }, brkBonus: 0, tmpBrk: 0, inv: { pjd: 2 }, tree: {}, flags: {}, debt: 8888 },
    { realm: 3, st: { int: 2, luck: 0 }, brkBonus: 0.08, tmpBrk: 0.05, inv: {}, tree: { misc: 5 }, flags: { bounty: 1 }, debt: 30000 },
    { realm: 5, st: { int: 1, luck: 1 }, brkBonus: 0, tmpBrk: 0, inv: { pjd: 1 }, tree: {}, flags: {}, debt: 99999 },
  ];
  const cmp = await vmB.runInContext(`(async () => { const out = [];
    for (const s of __saves) {
      const G = JSON.parse(JSON.stringify(s)); G.stage = 3; Game.G = G; G.exp = Game.need();
      const snap = JSON.stringify(G); const p = Stage3.breakthroughPreview(G, Game); const same = JSON.stringify(G) === snap;
      __cards.length = 0; Game.G = JSON.parse(snap); await Game._tryBreak();
      const m = /成功率约 (\\d+)%/.exec(__cards[0] || ''); out.push({ p, real: m ? +m[1] : null, same });
    }
    return out; })()`, bcx);
  ok(cmp.every(c => c.p.source === 'game' && c.real !== null && c.p.base === c.real), '基础成功率 = 正式突破卡片上的成功率（5 个存档：凡人/练气+筑基丹/筑基+破境丹/金丹+技能树+tmpBrk/化神）：' + cmp.map(c => c.p.base + '=' + c.real).join(','));
  ok(cmp.map(c => c.p.estimate).join() === cmp.map(c => Math.max(5, c.real - [0, 3, 8, 15][c.p.tier])).join() && cmp[3].p.tier === 3 && cmp[4].p.tier === 3, '真实公式下 预估 = 基础 − 档位惩罚（下限 5%）：' + cmp.map(c => c.p.tierName + c.p.estimate + '%').join(','));
  ok(cmp[1].p.pills.join() === '筑基丹' && cmp[2].p.pills.join() === '破境丹' && cmp[0].p.from === '凡人' && cmp[0].p.to === '练气' && cmp.every(c => c.p.ready), '持有丹药按「持有即生效」计入、显示境界 → 下一境、修为圆满 ready');
  ok(cmp.every(c => c.same), '预览不改存档（不吃丹、不清 tmpBrk、不动修为）');
  const r6 = vmB.runInContext("Stage3.breakthroughPreview({ realm: 6, st: { int: 5, luck: 5 }, debt: 8888 }, Game)", bcx);
  const r10 = vmB.runInContext("Stage3.breakthroughPreview({ realm: REALMS.length - 1, st: { int: 5, luck: 5 }, debt: 0 }, Game)", bcx);
  ok(!r6.applicable && r6.estimate === null && /飞升/.test(r6.note) && !r10.applicable && /最高境界/.test(r10.note), '渡劫（走飞升天劫）/最高境界：不给成功率预估');
  const rBad = vmB.runInContext("[{ realm: 99, debt: 0 }, { realm: 2, st: {}, debt: 0 }, { realm: 2, st: { int: 'x', luck: 1 } }].map(g => Stage3.breakthroughPreview(g, Game))", bcx);
  const rThrow = vmB.runInContext("Stage3.breakthroughPreview({ realm: 2, st: { int: 5, luck: 5 }, debt: 0 }, { treeVal() { throw new Error('boom'); } })", bcx);
  ok(rBad.every(p => p.source === 'fallback' && p.base === 60) && rThrow.source === 'fallback' && /boom/.test(rThrow.note), '境界越界/缺悟性气运/非数字/公式抛错 → 回退 60% 并标注原因');
  const srcBrk = fsB.readFileSync(path.join(jsDir, 'stage3_encounter_draft.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  const prevSrc = srcBrk.slice(srcBrk.indexOf('breakBase('), srcBrk.indexOf('async test('));
  ok(prevSrc.length > 500 && !/tryBreak|\.save\(|\.take\(|\.give\(|G\.\w+\s*=[^=]|tmpBrk\s*=[^=]/.test(prevSrc), '预览代码不调用 tryBreak/save/take/give、不给 G 赋值');
  const gameSrc = fsB.readFileSync(path.join(jsDir, 'game.js'), 'utf8');
  ok(gameSrc.includes("let ch = REALMS[r].brk + G.st.int * 0.015 + G.st.luck * 0.005 + G.brkBonus + this.treeVal('brk') + (G.tmpBrk || 0);") && gameSrc.includes('ch = Math.min(0.97, ch); G.tmpBrk = 0;'), '正式突破公式（game.js）未被改动，与预览复刻的一致');
  const callers5 = fsB.readdirSync(jsDir).filter(f => f.endsWith('.js') && f !== 'stage3_encounter_draft.js' && /breakthroughPreview|breakBase/.test(fsB.readFileSync(path.join(jsDir, f), 'utf8')));
  ok(callers5.join(',') === 'dev_entry_v25.js', '只有 dev_entry_v25.js 调用 breakthroughPreview：' + callers5.join(','));

  // 13. 债务强化 #4：追兵战按档位分化敌人（参数单调、低档 = 旧行为、只出数据不改存档）
  const T4 = S.DEBT_TIERS;
  const mono = (k, dir) => T4.every((t, i) => i === 0 || (dir < 0 ? t[k] <= T4[i - 1][k] : t[k] >= T4[i - 1][k]));
  ok(mono('atkCdMul', -1) && mono('windMul', -1) && mono('shotCount', 1) && mono('shotSpread', 1) && mono('spdAdd', 1) && mono('hpMul', 1), '四档参数单调：冷却/前摇倍率不增，弹道数/夹角/移速/血量不减：' + T4.map(t => `${t.n}(${t.atkCdMul}/${t.windMul}/${t.shotCount}发/${t.shotSpread}°/+${t.spdAdd})`).join(' '));
  ok(T4[3].atkCdMul < T4[2].atkCdMul && T4[2].atkCdMul < T4[1].atkCdMul && T4[3].windMul < T4[2].windMul && T4[2].windMul < 1 && T4[3].shotCount > T4[2].shotCount && T4[2].shotCount > 1, '高两档严格更凶：通缉 < 重债 < 1（冷却/前摇），3 发 > 2 发 > 1 发');
  ok(T4.slice(0, 2).every(t => t.atkCdMul === 1 && t.windMul === 1 && t.shotCount === 1 && t.shotSpread === 0 && t.spdAdd === 0 && t.trait === ''), '低两档（小账/欠款）全为中性值 = 旧行为、无特性名');
  ok(T4[2].trait === '快攻双发' && T4[3].trait === '疾攻三发' && /冷却 ×0\.75/.test(DP({ debt: 8888 }).traitNote) && DP({ debt: 10 }).traitNote === '与普通讨债鬼相同', '档位特性名/说明文案');
  const hz4 = [0, 3000, 8888, 30000].map(d => S.bountyEnemies({ debt: d }));
  ok(hz4.every((a, t) => a.every(e => e.atkCdMul === T4[t].atkCdMul && e.windMul === T4[t].windMul && e.shotCount === T4[t].shotCount && e.shotSpread === T4[t].shotSpread && e.tier === t)), 'bountyEnemies 每个讨债鬼都带本档 atkCdMul/windMul/shotCount/shotSpread/tier');
  ok(hz4.map(a => a[0].speed).join() === '70,76,86,96' && hz4[3].map(e => e.atkCd).join() === '1,1.6,2.2,2.8' && hz4.map(a => a[0].hp).join() === '80,92,104,116', '移速 70/76/86/96（高档额外 +4/+8）；首次出手错开与血量与上轮一致');
  ok(hz4[1].every(e => ['name', 'spr', 'box', 'hp', 'x', 'y', 'speed', 'atkCd'].every(k => k in e)) && hz4[0][0].speed === 70 && hz4[1][0].speed === 76, '低档旧字段与数值不变（只多出中性参数）');
  ok(S.bountyEnemies({ debt: 10, flags: { bounty: 1 } })[0].tier === 1 && S.bountyEnemies({ debt: 8888, flags: { bounty: 1 } })[0].shotCount === 3, '挂通缉 +1 档同样带上一档的行为参数');
  const Gt4 = mk({ debt: 30000, flags: { bounty: 1 } }); const snapT4 = JSON.stringify(Gt4); S.bountyEnemies(Gt4); S.debtPressure(Gt4);
  ok(JSON.stringify(Gt4) === snapT4, '生成档位参数不改存档');

  // 14. 债务强化 #5：天道通缉头子专属招式「回身环弹」——只给通缉档头子带 ringShots/ringWarn/ringCd，其余讨债鬼一个字段都不多
  const RK = ['ringShots', 'ringWarn', 'ringCd'];
  const hasRing = e => RK.some(k => k in e);
  const boss5 = hz4[3][0];
  ok(boss5.name === '讨债鬼头子' && boss5.ringShots === 8 && boss5.ringWarn === 0.4 && boss5.ringCd === 3 && S.BOSS_RING.move === '回身环弹', '天道通缉头子带专属招式参数：8 发环形弹 / 预警 0.4s / 间隔 3s（回身环弹）');
  ok(hz4[3].slice(1).every(e => e.name === '讨债鬼' && !hasRing(e)) && hz4.slice(0, 3).every(a => a.every(e => !hasRing(e))), '通缉档普通讨债鬼、小账/欠款/重债所有讨债鬼都不带环弹字段（= 上一轮配置）');
  const strip5 = e => { const o = Object.assign({}, e); RK.forEach(k => delete o[k]); return JSON.stringify(o); };
  ok(strip5(boss5) === JSON.stringify(Object.assign({}, hz4[3][1], { name: '讨债鬼头子', x: 300, y: 150, atkCd: 1 })), '头子除环弹字段外与同档讨债鬼的其余参数（血/移速/档位行为）一致');
  const bb5 = S.bountyEnemies({ debt: 8888, flags: { bounty: 1 } }), bl5 = S.bountyEnemies({ debt: 10, flags: { bounty: 1 } });
  ok(bb5[0].ringShots === 8 && bb5.filter(hasRing).length === 1 && bl5.every(e => !hasRing(e)), '重债 + 通缉 → 升到天道通缉档，只有头子带环弹；小账 + 通缉 → 欠款档无环弹');
  ok(DP({ debt: 30000 }).bossMove === '回身环弹' && /前冲收招后原地预警 0\.4s，放一圈 8 发环形弹（每 3s 至多一次）/.test(DP({ debt: 30000 }).bossNote) && [0, 3000, 8888].every(d => DP({ debt: d }).bossMove === '' && DP({ debt: d }).bossNote === ''), 'debtPressure 头子招式名/说明：仅天道通缉档有，低三档为空');
  let src84 = null; try { src84 = require('child_process').execSync('git show 84f4bd0:www/js/stage3_encounter_draft.js', { cwd: path.join(__dirname, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { src84 = null; }
  if (src84) {
    const c84 = require('vm').createContext({ console, window: {} }); require('vm').runInContext(src84 + '\n;window.__S = Stage3;', c84);
    const games5 = [{ debt: 0 }, { debt: 3000 }, { debt: 8888 }, { debt: 30000 }, { debt: 10, flags: { bounty: 1 } }, { debt: 8888, flags: { bounty: 1 } }, { debt: 99999, flags: { bounty: 1 } }];
    const same5 = games5.map(g => JSON.stringify(c84.window.__S.bountyEnemies(JSON.parse(JSON.stringify(g)))) === JSON.stringify(S.bountyEnemies(g).map(e => JSON.parse(strip5(e)))));
    ok(same5.every(Boolean), '与上一提交 84f4bd0 的 bountyEnemies 对照 7 种存档：去掉头子的 3 个环弹字段后逐字段一致：' + same5.join(','));
  } else ok(false, '读不到 84f4bd0 的 stage3_encounter_draft.js（git show 失败）');
  const Gt5 = mk({ debt: 30000, flags: { bounty: 1 } }); const snapT5 = JSON.stringify(Gt5); S.bountyEnemies(Gt5); S.debtPressure(Gt5);
  ok(JSON.stringify(Gt5) === snapT5, '生成头子招式参数不改存档');
  const de5 = require('fs').readFileSync(path.join(__dirname, '..', 'www', 'js', 'dev_entry_v25.js'), 'utf8');
  ok(/头子：' \+ P\.bossNote/.test(de5) && /头子会' \+ P\.bossMove/.test(de5), '开发者「追兵战」toast 与结算卡带「头子：…」说明');

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

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
  ok(callers.join(',') === 'dev_openworld.js', '只有 dev_openworld.js 调用 runMerchantChain：' + callers.join(','));

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
  ok(callers2.join(',') === 'dev_openworld.js', '只有 dev_openworld.js 调用 runLedgerChain：' + callers2.join(','));

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
  ok(callers3.join(',') === 'dev_openworld.js', '只有 dev_openworld.js 调用 debtPressure/bountyEnemies：' + callers3.join(','));

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
  ok(callers4.join(',') === 'dev_openworld.js', '只有 dev_openworld.js 调用 settleBounty：' + callers4.join(','));

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
  ok(callers5.join(',') === 'dev_openworld.js', '只有 dev_openworld.js 调用 breakthroughPreview：' + callers5.join(','));

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
  const de5 = require('fs').readFileSync(path.join(__dirname, '..', 'www', 'js', 'dev_openworld.js'), 'utf8');
  ok(/头子：' \+ P\.bossNote/.test(de5) && /头子会' \+ P\.bossMove/.test(de5), '开发者「追兵战」toast 与结算卡带「头子：…」说明');

  // 15. 债务强化 #6：追兵战胜利且天道通缉头子被打倒 → 缴获「讨债令」凭证（只记 flags.s3b_token 计数 + 最近来源/年份，不发正式物品）
  const TK = ['s3b_token', 's3b_token_src', 's3b_token_year'];
  const team6 = S.bountyEnemies({ debt: 30000 }).map(e => e.name);
  const W6 = (o) => Object.assign({ result: 'win', reason: 'cleared', tier: 3, defeated: team6.slice() }, o);
  let G6 = mk({ debt: 30000, year: 12, flags: { bounty: 1, stage3_bountyDebt: 30000 } });
  let s6 = SB(G6, W6());
  ok(team6[0] === S.BOSS_NAME && s6.settled && s6.token === true && s6.tokens === 1 && G6.flags.s3b_token === 1, '天道通缉打赢、头子被打倒 → 返回 token:true、tokens 1，flags.s3b_token = 1');
  ok(G6.flags.s3b_token_src === '天道通缉·讨债鬼头子' && G6.flags.s3b_token_year === 12 && S.TOKEN_NAME === '讨债令', '记下最近一次来源「天道通缉·讨债鬼头子」与获得年份 G.year=12');
  ok(G6.debt === 30000 && !G6.flags.bounty && s6.bountyCleared && G6.flags.s3b_win === 1 && s6.fee === 0, '得令不影响原有胜利结算（撤通缉、欠款不变、胜场 +1）');
  G6.year = 15; s6 = SB(G6, W6());
  ok(s6.token && s6.tokens === 2 && G6.flags.s3b_token === 2 && G6.flags.s3b_token_year === 15, '再打赢一次：计数累加到 2，年份更新为最近一次 15');
  G6 = mk({ debt: 30000, flags: { s3b_token: 5 } }); s6 = SB(G6, W6());
  ok(s6.tokens === 6 && G6.flags.s3b_token === 6, '已有 5 枚 → 累加到 6');
  G6 = { debt: 30000, year: 3 }; s6 = SB(G6, W6());
  ok(s6.token && G6.flags.s3b_token === 1 && G6.flags.s3b_token_year === 3, '旧存档（没有 flags）：补出 flags 并记 1 枚');
  G6 = mk({ debt: 30000, flags: { s3b_win: 4 } }); s6 = SB(G6, W6());
  ok(s6.tokens === 1 && G6.flags.s3b_win === 5 && S.tokenCount(mk()) === 0 && S.tokenCount({}) === 0 && S.tokenCount(null) === 0, '旧存档（有 flags 无 s3b_token）按 0 算；tokenCount 对缺字段/无存档返回 0');
  // 不得令的各条路径：三个 flag 都不被碰（原有 3 枚保持 3），返回 token:false 且 tokens 报当前枚数
  const noTok = (out, o) => { const g = mk(Object.assign({ debt: 30000, year: 9, flags: { s3b_token: 3, s3b_token_src: '旧', s3b_token_year: 1 } }, o || {})); const r = SB(g, out); return r.token === false && g.flags.s3b_token === 3 && g.flags.s3b_token_src === '旧' && g.flags.s3b_token_year === 1 && (!r.settled || r.tokens === 3); };
  ok(noTok(W6({ defeated: ['讨债鬼', '讨债鬼', '讨债鬼'] })), '打赢但头子没被打倒（不在 defeated 里）：不得令');
  ok(noTok(W6({ tier: 2, defeated: ['讨债鬼', '讨债鬼', '讨债鬼'] }), { debt: 8888 }) && noTok(W6({ tier: 2 })), '重债档打赢不得令（即便名单里混进头子名，开战档位不是天道通缉也不给）');
  ok([0, 1].every(t => noTok(W6({ tier: t, defeated: ['讨债鬼'] }))), '小账/欠款档打赢不得令');
  ok(noTok(W6({ defeated: undefined })) && noTok({ result: 'win', reason: 'cleared', tier: 3 }), '没带 defeated（旧调用方）：不得令');
  ok(noTok(W6({ result: 'lose', reason: 'dead' })) && noTok(W6({ result: 'lose', reason: 'timeout' })) && noTok(W6({ reason: 'timeout' })), '败（倒下/超时）、以及矛盾的 win+timeout：不得令');
  ok(noTok(W6({ reason: 'closed' })) && noTok(W6({ result: 'lose', reason: 'closed' })) && SB(mk(), W6({ reason: 'closed' })).settled === false, '中途关闭：不结算、不得令');
  ok([undefined, null, {}, 'win', { result: 'WIN', defeated: team6 }, { result: 'draw', tier: 3, defeated: team6 }].every(o => noTok(o)) && SB(null, W6()).token === false && SB('x', W6()).token === false, '非法结果/无存档：返回 token:false、不崩、不动讨债令');
  ok(['讨债鬼头子', null, {}, 42, [null, 7], [['讨债鬼头子']]].every(d => { try { return noTok(W6({ defeated: d })); } catch (e) { return false; } }), 'defeated 非法（字符串/null/对象/数字/元素非法/嵌套数组）：不崩、不得令');
  ok([['abc', 1], [-2, 1], [NaN, 1], [Infinity, 1], [2.7, 3], ['4', 5], [null, 1]].every(([v, want]) => { const g = mk({ debt: 30000, flags: { s3b_token: v } }); SB(g, W6()); return g.flags.s3b_token === want; }), '已有 s3b_token 异常（字符串/负数/NaN/无穷/小数/数字串/null）：按 0 或取整后 +1，不崩');
  ok([undefined, 'x', NaN, null, {}].every(y => { const g = mk({ debt: 30000, year: y, flags: { s3b_token_year: 7 } }); SB(g, W6()); return g.flags.s3b_token === 1 && !('s3b_token_year' in g.flags); }), 'G.year 非数字：照常得令，只是不记年份（也不留旧年份）');
  // 不改其他字段：同一输入「得令」与「没头子」两份结算后，除三个讨债令 flag 外整份存档逐字段一致
  const Ga = mk({ debt: 30000, year: 8, inv: { zjd: 1 }, eqs: [], flags: { bounty: 1, stage3_bountyDebt: 30000, s3m_done: 1 } }), Gn = JSON.parse(JSON.stringify(Ga));
  const ra = SB(Ga, W6()), rn = SB(Gn, W6({ defeated: ['讨债鬼'] }));
  const stripTK = g => { const o = JSON.parse(JSON.stringify(g)); TK.forEach(k => delete o.flags[k]); return JSON.stringify(o); };
  ok(ra.token && !rn.token && stripTK(Ga) === stripTK(Gn) && Ga.stone === 500 && JSON.stringify(Ga.inv) === '{"zjd":1}' && Ga.eqs.length === 0, '得令只多出 s3b_token/src/year 三个 flag：灵石/物品/装备/欠款等其余字段与不得令一致');
  const keysA = Object.keys(ra).sort().join(), keysN = Object.keys(rn).sort().join();
  ok(keysA === keysN && /token/.test(keysA) && /tokens/.test(keysA) && ['settled', 'result', 'tier', 'n', 'debtBefore', 'debtAfter', 'fee', 'bountyCleared', 'note'].every(k => ra[k] === rn[k]), '返回值带 token/tokens，其余字段与不得令时一致');
  const srcSB = require('fs').readFileSync(path.join(jsDir, 'stage3_encounter_draft.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  const sbBody = srcSB.slice(srcSB.indexOf('BOSS_NAME:'), srcSB.indexOf('BRK_PENALTY'));
  ok(sbBody.length > 300 && !/G\.(stone|inv|eqs|eq|exp|items?)\b|\.give\(|\.addItem\(|\.gain\(|Game\./.test(sbBody), '讨债令只记 flags：结算代码不碰灵石/物品/装备/修为，不调 Game.give 等正式发奖');
  const tokFiles = require('fs').readdirSync(jsDir).filter(f => f.endsWith('.js') && /s3b_token/.test(require('fs').readFileSync(path.join(jsDir, f), 'utf8')));
  ok(tokFiles.join(',') === 'dev_openworld.js,stage3_encounter_draft.js' || tokFiles.join(',') === 'stage3_encounter_draft.js', '只有 stage3（与开发者入口注释）提到 s3b_token：' + tokFiles.join(','));
  const tokCallers = require('fs').readdirSync(jsDir).filter(f => f.endsWith('.js') && f !== 'stage3_encounter_draft.js' && /TOKEN_NAME|bountyTokenEarned|tokenCount/.test(require('fs').readFileSync(path.join(jsDir, f), 'utf8')));
  ok(tokCallers.join(',') === 'dev_openworld.js', '只有 dev_openworld.js 引用讨债令相关接口：' + tokCallers.join(','));
  const de6 = require('fs').readFileSync(path.join(jsDir, 'dev_openworld.js'), 'utf8');
  ok(/s\.token \? `\\n缴获\$\{Stage3\.TOKEN_NAME\}×1（共 \$\{s\.tokens\} 枚）：只是凭证，暂无用途`/.test(de6), '开发者「追兵战」结算卡：得令时加一行「缴获讨债令×1（共 N 枚）：只是凭证，暂无用途」');

  // 15b. 债务强化 #9（第十八轮）：讨债令上限 TOKEN_MAX=9 + 同一游戏年只缴获一枚的冷却
  {
    const snap9 = g => JSON.stringify([g.flags.s3b_token, g.flags.s3b_token_src, g.flags.s3b_token_year]);
    ok(S.TOKEN_MAX === 9 && typeof S.tokenBlock === 'function', 'TOKEN_MAX = 9，有 tokenBlock(G)');
    let g = mk({ debt: 30000, year: 20, flags: { bounty: 1 } });
    let r = SB(g, W6());
    ok(r.token && r.tokens === 1 && r.tokenBlocked === null, '当年第一次：得令，tokenBlocked 为 null');
    g.flags.bounty = 1; const s1 = snap9(g); r = SB(g, W6());
    ok(!r.token && r.tokenBlocked === 'cooldown' && r.tokens === 1 && snap9(g) === s1 && r.settled && r.result === 'win' && !g.flags.bounty && r.bountyCleared && g.flags.s3b_win === 2 && g.debt === 30000, '同一年再打赢：冷却挡下（tokenBlocked:cooldown），三个讨债令 flag 不动，撤通缉/胜场+1/欠款不变照旧');
    for (let i = 0; i < 3; i++) r = SB(g, W6());
    ok(g.flags.s3b_token === 1 && r.tokenBlocked === 'cooldown', '同一年连刷 5 场仍只有 1 枚');
    g.year = 21; r = SB(g, W6());
    ok(r.token && r.tokens === 2 && g.flags.s3b_token_year === 21 && r.tokenBlocked === null, '次年冷却解除：得第 2 枚，年份更新为 21');
    let gy = mk({ debt: 30000, year: 30 });
    for (let y = 30; y < 45; y++) { gy.year = y; r = SB(gy, W6()); }
    ok(gy.flags.s3b_token === 9 && r.tokenBlocked === 'cap' && !r.token && r.tokens === 9 && gy.flags.s3b_token_year === 38, '逐年打 15 年：封顶 9 枚，第 10 枚起 tokenBlocked:cap，年份停在第 9 枚那年（38）');
    const gc = mk({ debt: 30000, year: 3, flags: { s3b_token: 9, s3b_token_src: '旧', s3b_token_year: 1 } }); const sc = snap9(gc); r = SB(gc, W6());
    ok(!r.token && r.tokenBlocked === 'cap' && snap9(gc) === sc, '已有 9 枚：上限挡下，flag 不动');
    const gb = mk({ debt: 30000, year: 3, flags: { s3b_token: 50 } }); r = SB(gb, W6());
    ok(!r.token && r.tokenBlocked === 'cap' && gb.flags.s3b_token === 50 && r.tokens === 50, '旧存档异常大数 50：不得令、不改成 9');
    const gn = mk({ debt: 30000 }); for (let i = 0; i < 12; i++) r = SB(gn, W6());
    ok(gn.flags.s3b_token === 9 && r.tokenBlocked === 'cap' && !('s3b_token_year' in gn.flags), 'G.year 非数字（旧存档）：不做冷却，只受上限 9 约束');
    const gl = mk({ debt: 30000, year: 3, flags: { s3b_token: 9 } });
    ok([W6({ defeated: ['讨债鬼'] }), W6({ tier: 2 }), W6({ result: 'lose', reason: 'dead' })].every(o => { const x = SB(gl, o); return x.tokenBlocked === null && !x.token; }), '本来就不够格（没头子/非天道/败）：tokenBlocked 为 null，不报上限/冷却');
    ok(S.tokenBlock(null) === null && S.tokenBlock({}) === null && S.tokenBlock({ year: 2, flags: { s3b_token_year: 2 } }) === 'cooldown' && S.tokenBlock({ year: 2, flags: { s3b_token_year: '2' } }) === null, 'tokenBlock 对无存档/缺字段不崩；年份须严格相等');
    const ga = mk({ debt: 30000, year: 7, flags: { s3b_token: 2, s3b_token_year: 7 } }), gb2 = mk({ debt: 30000, year: 7, flags: { s3b_token: 2, s3b_token_year: 6 } });
    const ra9 = SB(ga, W6()), rb9 = SB(gb2, W6());
    const strip9 = g => { const o = JSON.parse(JSON.stringify(g)); TK.forEach(k => delete o.flags[k]); return JSON.stringify(o); };
    ok(!ra9.token && rb9.token && strip9(ga) === strip9(gb2), '被冷却挡下与正常得令：除三个讨债令 flag 外存档逐字段一致');
    const de9 = require('fs').readFileSync(path.join(jsDir, 'dev_openworld.js'), 'utf8');
    ok(/s\.tokenBlocked === 'cap'/.test(de9) && /已满 \$\{Stage3\.TOKEN_MAX\} 枚/.test(de9) && /今年已缴获过\$\{Stage3\.TOKEN_NAME\}，明年再来/.test(de9), '开发者「追兵战」结算卡：被上限/冷却挡下时说明原因');
  }

  // 15c. 第二十一轮：讨债令第一个只读用途——Stage3.tokenInfo(G) 纯函数（讨债令 x/9、今年是否已领），不改存档
  {
    const deep = o => JSON.stringify(o);
    const frz = o => { if (o && typeof o === 'object') { Object.values(o).forEach(frz); Object.freeze(o); } return o; };
    ok(typeof S.tokenInfo === 'function', '有 Stage3.tokenInfo(G)');
    const g0 = mk({ year: 20 }); const s0 = deep(g0); const i0 = S.tokenInfo(g0);
    ok(i0.count === 0 && i0.max === 9 && !i0.full && i0.year === 20 && i0.lastYear === null && i0.takenThisYear === false && i0.block === null && i0.src === null
      && i0.lines[0] === '讨债令 0/9' && i0.text.includes('今年（第 20 年）还没领') && i0.text.includes('可缴获 1 枚') && !i0.text.includes('最近一次') && deep(g0) === s0, '0 枚：讨债令 0/9、今年还没领、下一场可缴获，存档不变');
    const g1 = frz(mk({ year: 20, flags: { s3b_token: 2, s3b_token_year: 20, s3b_token_src: '天道通缉·讨债鬼头子' } })); const s1 = deep(g1); let i1;
    try { i1 = S.tokenInfo(g1); } catch (e) { i1 = null; }
    ok(i1 && i1.count === 2 && i1.takenThisYear === true && i1.block === 'cooldown' && i1.lines[0] === '讨债令 2/9' && i1.text.includes('今年（第 20 年）已领过，明年再来')
      && i1.text.includes('最近一次：天道通缉·讨债鬼头子（第 20 年）') && i1.text.includes('今年冷却中') && deep(g1) === s1, '2 枚且今年已领：深冻结存档上调用不抛错（不写任何字段）、显示已领过 + 冷却中');
    const g2 = mk({ year: 21, flags: { s3b_token: 2, s3b_token_year: 20, s3b_token_src: '天道通缉·讨债鬼头子' } }); const i2 = S.tokenInfo(g2);
    ok(i2.takenThisYear === false && i2.block === null && i2.text.includes('今年（第 21 年）还没领'), '次年：今年还没领，block 为 null');
    const g3 = mk({ year: 40, flags: { s3b_token: 9, s3b_token_year: 38 } }); const i3 = S.tokenInfo(g3);
    ok(i3.full && i3.block === 'cap' && i3.lines[0] === '讨债令 9/9（已满）' && i3.text.includes('已满 9 枚，不会再缴获') && i3.text.includes('最近一次：来源未记（第 38 年）'), '9 枚：9/9（已满）、上限挡下说明、来源缺失写「来源未记」');
    const g4 = mk({ flags: { s3b_token: 50 } }); const i4 = S.tokenInfo(g4);
    ok(i4.count === 50 && i4.full && i4.year === null && i4.takenThisYear === null && i4.lines[0] === '讨债令 50/9（已满）' && i4.text.includes('无年份（旧存档）') && g4.flags.s3b_token === 50, '旧存档异常大数 50 / 无年份：照实显示 50/9、不钳、takenThisYear 为 null、不做冷却');
    ok([null, undefined, {}, { flags: null }, { year: '3', flags: { s3b_token: 'x', s3b_token_year: '3' } }, 5].every(x => { try { const r = S.tokenInfo(x); return r.count === 0 && r.year === null && typeof r.text === 'string'; } catch (e) { return false; } }), '无存档 / 缺字段 / 字符串年份：不崩，按 0 枚、无年份');
    // 与 tokenBlock / settleBounty 一致：tokenInfo 说「可缴获」时下一场确实得令，说被挡时下一场确实被同样原因挡下
    let agree = true;
    for (const [n, y, ly] of [[0, 5, null], [1, 5, 5], [1, 6, 5], [8, 6, 5], [9, 6, 5], [3, undefined, 2]]) {
      const g = mk({ debt: 30000, year: y, flags: Object.assign({ s3b_token: n }, ly === null ? {} : { s3b_token_year: ly }) });
      const inf = S.tokenInfo(g), r = SB(g, W6());
      if (inf.block !== r.tokenBlocked || (inf.block === null) !== r.token) agree = false;
    }
    ok(agree, 'tokenInfo.block 与下一场 settleBounty 的 token / tokenBlocked 逐例一致（6 例）');
    const g5 = mk({ year: 9, flags: { s3b_token: 1, s3b_token_year: 9 } }); const s5 = deep(g5), sv5 = saves; for (let k = 0; k < 20; k++) S.tokenInfo(g5);
    ok(deep(g5) === s5 && saves === sv5, '连调 20 次：存档逐字段不变、没调 Game.save');
    const deL = require('fs').readFileSync(path.join(jsDir, 'dev_openworld.js'), 'utf8');
    const btn = (deL.match(/\{ key: 'lt'[\s\S]*?\} \},/) || [''])[0];
    ok(/label: '讨债令'/.test(btn) && /Stage3\.tokenInfo\(g\.G\)\.text/.test(btn) && !/save\(|s3b_token|localStorage|G\.\w+\s*=[^=]/.test(btn), '开发者「讨债令」按钮：只读 tokenInfo 文案出卡，不存档、不写 flag/localStorage');
    const infoSrc = S.tokenInfo.toString();
    ok(!/\b(F|G|flags)(\.[\w$]+|\[[^\]]+\])\s*=[^=]|delete |save\(|localStorage/.test(infoSrc), 'tokenInfo 源码里没有给 G / flags 赋值、delete、save、localStorage');
  }

  // 16. 债务强化 #7：追兵档位参数可调表（BOUNTY_TUNING_DEFAULT 深冻结）+ bountyTuning 合并/校验/钳制 + 只有开发者入口读覆盖键
  {
    const fs7 = require('fs'), vm7 = require('vm');
    const D7 = S.BOUNTY_TUNING_DEFAULT, BT = o => S.bountyTuning(o), J7 = v => JSON.stringify(v);
    const TF = ['hunters', 'hpMul', 'atkCdMul', 'windMul', 'shotCount', 'shotSpread', 'spdAdd'], BF = ['ringShots', 'ringWarn', 'ringCd'];
    ok(Object.isFrozen(D7) && Object.isFrozen(D7.tiers) && D7.tiers.every(Object.isFrozen) && Object.isFrozen(D7.boss), '默认表 BOUNTY_TUNING_DEFAULT 深冻结（表/tiers/每档/boss）');
    let threw = 0; for (const f of [() => { D7.tiers[3].shotCount = 9; }, () => { D7.boss.ringShots = 1; }, () => { D7.tiers.push({}); }, () => { D7.extra = 1; }]) { try { f(); } catch (e) { threw++; } }
    ok(threw === 4 && D7.tiers[3].shotCount === 3 && D7.boss.ringShots === 8 && D7.tiers.length === 4 && !('extra' in D7), '默认表改不动（严格模式赋值/push/加键都抛错，值不变）');
    ok(D7.tiers.length === 4 && D7.tiers.every((t, i) => Object.keys(t).join() === TF.join() && TF.every(f => t[f] === S.DEBT_TIERS[i][f])) && Object.keys(D7.boss).join() === BF.join() && BF.every(f => D7.boss[f] === S.BOSS_RING[f]),
      '默认表 = DEBT_TIERS 每档 7 个数值 + BOSS_RING 3 个环弹数值（逐字段一致）：' + JSON.stringify(D7));
    const r0 = BT(), rN = BT(null), rE = BT({});
    ok(r0.table === D7 && rN.table === D7 && r0.source === 'default' && !r0.error && [r0, rN].every(r => !r.changed.length && !r.clamped.length && !r.rejected.length && !r.unknown.length), '不传/传 null → 原样返回默认表，无改动无报错');
    ok(rE.table === D7 && rE.source === 'override' && !rE.error && !rE.changed.length, '空覆盖 {} → 仍是默认表（同一个冻结对象）');
    // 合并
    const ov = { tiers: { wanted: { shotCount: 5, hpMul: 2 }, 0: { hunters: 3 } }, boss: { ringShots: 12 } }; const ovSnap = JSON.stringify(ov);
    const rm = BT(ov), tm = rm.table;
    ok(tm !== D7 && tm.tiers[3].shotCount === 5 && tm.tiers[3].hpMul === 2 && tm.tiers[0].hunters === 3 && tm.boss.ringShots === 12 && tm.boss.ringWarn === 0.4 && tm.boss.ringCd === 3, '合并：覆盖字段生效（通缉 5 发/血×2、小账 3 只、环弹 12 发），其余字段沿用默认');
    ok(tm.tiers.every((t, i) => TF.every(f => ['tiers.' + S.DEBT_TIERS[i].key + '.' + f].some(p => rm.changed.some(c => c.path === p)) || t[f] === D7.tiers[i][f])), '没覆盖的字段与默认表逐字段一致');
    ok(rm.changed.map(c => c.path).sort().join() === 'boss.ringShots,tiers.light.hunters,tiers.wanted.hpMul,tiers.wanted.shotCount' && rm.changed.find(c => c.path === 'boss.ringShots').from === 8, 'changed 列出被覆盖的字段（路径 + 默认值 → 新值）：' + rm.changed.map(c => `${c.path} ${c.from}→${c.to}`).join('；'));
    ok(Object.isFrozen(tm) && tm.tiers.every(Object.isFrozen) && Object.isFrozen(tm.boss) && JSON.stringify(ov) === ovSnap && D7.tiers[3].shotCount === 3 && D7.boss.ringShots === 8, '合并结果深冻结；不改传入的覆盖对象、不改默认表');
    ok(JSON.stringify(BT(ov)) === JSON.stringify(rm) && JSON.stringify(BT({ tiers: { 3: { shotCount: 5, hpMul: 2 }, light: { hunters: 3 } }, boss: { ringShots: 12 } }).table) === JSON.stringify(tm) && JSON.stringify(BT({ tiers: [{ hunters: 3 }, null, undefined, { shotCount: 5, hpMul: 2 }], boss: { ringShots: 12 } }).table) === JSON.stringify(tm), '纯函数：同输入同输出；档位可写下标/英文键/4 项数组，结果一致');
    ok(BT(tm).table.tiers[3].shotCount === 5 && JSON.stringify(BT(JSON.parse(JSON.stringify(tm))).table) === JSON.stringify(tm) && JSON.stringify(BT(JSON.parse(JSON.stringify(D7))).table) === JSON.stringify(D7) && BT(JSON.parse(JSON.stringify(D7))).table === D7, '把整张表当覆盖传回去 = 原表（幂等）；整张默认表 → 默认表');
    // 钳制（与即时战原型 foeTrait/foeRing 一致；原型没钳的 hunters/hpMul/spdAdd 另定 1–4 / 0.3–3 / 0–40）
    const one = (f, v, boss) => { const r = BT(boss ? { boss: { [f]: v } } : { tiers: { wanted: { [f]: v } } }); return { v: boss ? r.table.boss[f] : r.table.tiers[3][f], r }; };
    const clampCases = [['atkCdMul', 0.1, 0.3], ['atkCdMul', 5, 2], ['windMul', 0.05, 0.3], ['windMul', 2.5, 2], ['shotCount', 9, 5], ['shotCount', 2.7, 2], ['shotSpread', 45, 30], ['hunters', 9, 4], ['hunters', 2.5, 2], ['hpMul', 10, 3], ['hpMul', 0.1, 0.3], ['spdAdd', 100, 40]];
    const clampOk = clampCases.map(([f, v, w]) => { const o = one(f, v); return o.v === w && o.r.clamped.length === 1 && o.r.clamped[0].to === w && o.r.clamped[0].value === v && !o.r.rejected.length; });
    ok(clampOk.every(Boolean), '档位字段越界钳到边界并记进 clamped：' + clampCases.map(([f, v, w], i) => `${f} ${v}→${w}${clampOk[i] ? '' : '✗'}`).join(' '));
    const ringCases = [['ringShots', 2, 0], ['ringShots', 0, 0], ['ringShots', 99, 16], ['ringShots', 7.9, 7], ['ringWarn', 0.01, 0.15], ['ringWarn', 3, 1], ['ringCd', 30, 10], ['ringCd', 0, 0]];
    const ringOk = ringCases.map(([f, v, w]) => { const o = one(f, v, true); return o.v === w && !o.r.rejected.length; });
    ok(ringOk.every(Boolean), '头子环弹字段钳制（<3 发 = 0 不放、≤16 发取整、预警 0.15–1s、间隔 0–10s）：' + ringCases.map(([f, v, w], i) => `${f} ${v}→${w}${ringOk[i] ? '' : '✗'}`).join(' '));
    ok(one('shotSpread', 0).v === 0 && !one('shotSpread', 0).r.clamped.length && one('spdAdd', 0).v === 0 && one('ringCd', 0, true).r.clamped.length === 0, '边界合法值（0° 夹角 / 移速 +0 / 间隔 0s）原样接受、不算钳制');
    // 非法 → 回退默认
    const bad = ['abc', '0.5', NaN, Infinity, -Infinity, null, true, {}, [], [1]];
    ok(TF.every(f => bad.every(v => { const o = one(f, v); return o.v === D7.tiers[3][f] && o.r.rejected.length === 1 && o.r.rejected[0].path === 'tiers.wanted.' + f && !o.r.changed.length; })) && BF.every(f => bad.every(v => one(f, v, true).v === D7.boss[f])), `非数字（${bad.length} 种：字符串/数字串/NaN/±无穷/null/布尔/对象/数组）→ 该字段回退默认并记进 rejected`);
    const domainBad = [['atkCdMul', 0], ['atkCdMul', -1], ['windMul', 0], ['hpMul', -2], ['shotCount', 0.5], ['shotCount', -3], ['hunters', 0], ['shotSpread', -5], ['spdAdd', -1]];
    const boDomainBad = [['ringShots', -1], ['ringWarn', 0], ['ringWarn', -0.2], ['ringCd', -1]];
    ok(domainBad.every(([f, v]) => { const o = one(f, v); return o.v === D7.tiers[3][f] && o.r.rejected.length === 1; }) && boDomainBad.every(([f, v]) => { const o = one(f, v, true); return o.v === D7.boss[f] && o.r.rejected.length === 1; }), '不合法的数（倍率 ≤0、发数/只数 <1、负夹角/负移速/负环弹/预警 ≤0/负间隔）→ 回退默认：' + domainBad.concat(boDomainBad).map(([f, v]) => f + '=' + v).join(' '));
    const ru = BT({ foo: 1, tiers: { boss: { shotCount: 3 }, 4: { hunters: 1 }, wanted: { trait: 'x', n: '假', shotCount: 4 } }, boss: { move: '乱改', ringShots: 10 } });
    ok(ru.unknown.sort().join() === 'boss.move,foo,tiers.4,tiers.boss,tiers.wanted.n,tiers.wanted.trait' && ru.table.tiers[3].shotCount === 4 && ru.table.boss.ringShots === 10 && !('trait' in ru.table.tiers[3]) && !('move' in ru.table.boss), '未知顶层键/档位/字段 → 忽略并记进 unknown，其余合法字段照常生效：' + ru.unknown.join('、'));
    ok(BT({ tiers: [null, null, null, null, { hunters: 1 }] }).unknown.join() === 'tiers.4' && BT({ tiers: 'x' }).rejected[0].path === 'tiers' && BT({ tiers: { wanted: 5 } }).rejected[0].path === 'tiers.wanted' && BT({ boss: [] }).rejected[0].path === 'boss' && BT({ tiers: 'x', boss: 7 }).table === D7, 'tiers/boss/某档不是对象 → 记进 rejected 并整块用默认；数组多出第 5 项 → unknown');
    const nonObj = ['x', 42, true, [], [{ hunters: 2 }]].map(v => BT(v));
    ok(nonObj.every(r => r.table === D7 && /不是 JSON 对象/.test(r.error)), '覆盖本身不是对象（字符串/数字/布尔/数组）→ 整张回退默认表并给 error');
    // 无覆盖时：debtPressure / bountyEnemies / settleBounty / breakthroughPreview 与 c46c1ef 逐字段完全一致（vm 载入 git show 的旧版本）
    let src46 = null; try { src46 = require('child_process').execSync('git show c46c1ef:www/js/stage3_encounter_draft.js', { cwd: path.join(__dirname, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { src46 = null; }
    if (src46) {
      const mkCx = (src, withGame) => {
        const cx = vm7.createContext({ console: { log() {} }, window: {}, localStorage: { getItem() { return null; }, setItem() {} }, document: {} });
        if (withGame) {
          vm7.runInContext(fs7.readFileSync(path.join(jsDir, 'data.js'), 'utf8'), cx);
          vm7.runInContext(fs7.readFileSync(path.join(jsDir, 'game.js'), 'utf8'), cx);
          vm7.runInContext("var UI = { card: async () => 1, hud() {}, toast() {} }; var Sfx = { play() {} }; Game.meta = { perks: {}, achs: {}, endings: {} };", cx);
        }
        vm7.runInContext(src + '\n;window.__S = Stage3;', cx); return cx;
      };
      const oldCx = mkCx(src46, false), O = oldCx.window.__S;
      const saves7 = [{}, { debt: 0 }, { debt: 1000 }, { debt: 1001 }, { debt: 3000 }, { debt: 5000 }, { debt: 5001 }, { debt: 8888 }, { debt: 20000 }, { debt: 20001 }, { debt: 30000 }, { debt: 99999, year: 7 },
        { debt: 10, flags: { bounty: 1 } }, { debt: 3000, flags: { bounty: 1 } }, { debt: 8888, flags: { bounty: 1, stage3_bountyDebt: 8888 } }, { debt: 30000, flags: { bounty: 1, s3b_token: 2 } },
        { debt: -5 }, { debt: 'abc' }, { debt: NaN }, { debt: '9000' }, { debt: 12345.6, flags: 'x' }, { debt: 30000, flags: null }];
      const J = v => JSON.stringify(v), cl = g => JSON.parse(J(g === undefined ? null : g));
      const tunings = [undefined, null, D7, BT().table, BT({}).table, BT({}), {}];
      const dpSame = saves7.every(g => tunings.every(t => J(S.debtPressure(cl(g), t)) === J(O.debtPressure(cl(g))))) && J(S.debtPressure(null)) === J(O.debtPressure(null)) && J(S.debtPressure(undefined)) === J(O.debtPressure(undefined));
      const beSame = saves7.every(g => tunings.every(t => J(S.bountyEnemies(cl(g), t)) === J(O.bountyEnemies(cl(g))))) && J(S.bountyEnemies(null)) === J(O.bountyEnemies(null));
      ok(dpSame, `无覆盖（不传/null/默认表/空覆盖等 ${tunings.length} 种写法）× ${saves7.length + 2} 种存档：debtPressure 与 c46c1ef 逐字段一致`);
      ok(beSame, `无覆盖 × ${saves7.length + 1} 种存档：bountyEnemies 与 c46c1ef 逐字段一致（含头子环弹字段）`);
      const team46 = O.bountyEnemies({ debt: 30000 }).map(e => e.name);
      const outs7 = [{ result: 'win', reason: 'cleared', tier: 3, defeated: team46 }, { result: 'win', reason: 'cleared', tier: 3, defeated: ['讨债鬼'] }, { result: 'win', reason: 'cleared' }, { result: 'win', tier: 1 },
        { result: 'lose', reason: 'dead', tier: 2 }, { result: 'lose', reason: 'timeout', tier: 0 }, { result: 'lose', reason: 'dead' }, { result: 'win', reason: 'closed', tier: 3 }, { result: 'lose', reason: 'closed' },
        { result: 'draw' }, null, { result: 'win', reason: 'timeout', tier: 3, defeated: team46 }, { result: 'win', tier: 9, defeated: team46 }];
      // 第十二轮：结算（胜/败）时多写一个同年互斥标记 flags.s3b_hunt_year，对照旧版时剥掉它；其余字段仍须逐字段一致。标记本身另有断言（见第十二轮用例）。
      const stripHunt = g => { const o = cl(g); if (o && o.flags && typeof o.flags === 'object') delete o.flags.s3b_hunt_year; return o; };
      let sbN = 0, sbBlk = 0, huntOk = true; /* 第十八轮：返回值多了 tokenBlocked（未被挡为 null，对照时剥掉）；被上限/冷却挡下的组是有意改行为，跳过对照（另有 15b 断言） */ const sbSame = saves7.every(g => outs7.every(o => { const gn = cl(g), go = cl(g); sbN++; const rn = S.settleBounty(gn, cl(o)); const hk = !!(gn && gn.flags && typeof gn.flags === 'object' && 's3b_hunt_year' in gn.flags); if (hk !== !!rn.settled) huntOk = false; if (rn.tokenBlocked) { sbBlk++; return true; } const rn0 = cl(rn); if (rn0 && rn0.settled) { if (rn0.tokenBlocked !== null) return false; delete rn0.tokenBlocked; } return J(rn0) === J(O.settleBounty(go, cl(o))) && J(stripHunt(gn)) === J(go); }));
      ok(sbSame && huntOk && J(S.settleBounty(null, outs7[0])) === J(O.settleBounty(null, outs7[0])), `settleBounty 与 c46c1ef 逐字段一致（${sbN} 组 存档×结果，其中 ${sbBlk} 组被讨债令上限/冷却挡下跳过：返回值 + 结算后整份存档，除新增的 s3b_hunt_year；该标记当且仅当结算时写）`);
      const bpSaves = saves7.map((g, i) => Object.assign(cl(g), { realm: [0, 1, 2, 3, 4, 5, 6, 99, 'x'][i % 9], st: i % 4 ? { int: i, luck: 3 } : {}, inv: i % 3 ? { zjd: 1, pjd: 1 } : {}, brkBonus: 0.01 * (i % 5), tmpBrk: i % 2 ? 0.05 : 0 }));
      const bpSame0 = bpSaves.every(g => J(S.breakthroughPreview(cl(g), null)) === J(O.breakthroughPreview(cl(g), null)));
      const newG = mkCx(fs7.readFileSync(path.join(jsDir, 'stage3_encounter_draft.js'), 'utf8'), true), oldG = mkCx(src46, true);
      vm7.runInContext('window.__bp = (G) => { Game.G = G; G.stage = 3; G.exp = Game.need(); return JSON.stringify(window.__S.breakthroughPreview(G, Game)); };', newG);
      vm7.runInContext('window.__bp = (G) => { Game.G = G; G.stage = 3; G.exp = Game.need(); return JSON.stringify(window.__S.breakthroughPreview(G, Game)); };', oldG);
      const realSaves = bpSaves.filter(g => Number.isInteger(g.realm) && g.realm < 9).map(g => Object.assign(cl(g), { tree: {}, flags: Object.assign({ awakened: 1 }, g.flags && typeof g.flags === 'object' ? g.flags : {}), st: { int: 4, luck: 2 } }));
      const bpSameG = realSaves.every(g => newG.window.__bp(cl(g)) === oldG.window.__bp(cl(g)));
      ok(bpSame0 && bpSameG && realSaves.length >= 10, `breakthroughPreview 与 c46c1ef 逐字段一致（${bpSaves.length} 种存档无 Game 回退路径 + ${realSaves.length} 种存档载入真实 data.js/game.js）`);
    } else ok(false, '读不到 c46c1ef 的 stage3_encounter_draft.js（git show 失败），无法做无覆盖对照');
    // 覆盖生效：追兵数/血量/移速/出手参数/头子环弹都按合并表；档名/阈值/特性名/结算不受影响
    const TO = BT({ tiers: { light: { hunters: 3, hpMul: 2, shotCount: 2, shotSpread: 10 }, wanted: { shotCount: 5, atkCdMul: 0.4, spdAdd: 20 } }, boss: { ringShots: 12, ringWarn: 0.6, ringCd: 1.5 } }).table;
    const eL = S.bountyEnemies({ debt: 10 }, TO), eW = S.bountyEnemies({ debt: 30000 }, TO);
    ok(eL.length === 3 && eL.every(e => e.hp === 160 && e.shotCount === 2 && e.shotSpread === 10 && e.tier === 0 && e.name === '讨债鬼' && !('ringShots' in e)) && eL.map(e => e.speed).join() === '70,70,70', '覆盖小账档：3 个讨债鬼、血 80×2=160、2 发/10°，仍是小账档（无头子无环弹）');
    ok(eW.length === 4 && eW.every(e => e.shotCount === 5 && e.atkCdMul === 0.4 && e.speed === 70 + 18 + 20 && e.windMul === 0.7) && eW[0].name === '讨债鬼头子' && eW[0].ringShots === 12 && eW[0].ringWarn === 0.6 && eW[0].ringCd === 1.5 && eW.slice(1).every(e => !('ringShots' in e)), '覆盖通缉档：5 发、冷却×0.4、移速 +20、前摇沿用默认 0.7；头子环弹 12 发/0.6s/1.5s，只有头子带');
    const pW = S.debtPressure({ debt: 30000 }, TO), pL = S.debtPressure({ debt: 10 }, TO);
    ok(pW.n === '天道通缉' && pW.trait === '疾攻三发' && pW.tier === 3 && /弹道 5 发/.test(pW.traitNote) && /冷却 ×0\.4/.test(pW.traitNote) && /预警 0\.6s，放一圈 12 发环形弹（每 1\.5s 至多一次）/.test(pW.bossNote) && pW.bossMove === '回身环弹', '通缉档 debtPressure：档名/特性名不变，traitNote/bossNote 用覆盖后的数值');
    ok(pL.hunters === 3 && pL.trait === '' && /^开发者调参：/.test(pL.traitNote) && S.debtPressure({ debt: 10 }).traitNote === '与普通讨债鬼相同', '小账档被调成非中性 → 说明标「开发者调参：…」；没覆盖仍是「与普通讨债鬼相同」');
    const offRing = BT({ boss: { ringShots: 0 } }).table, eOff = S.bountyEnemies({ debt: 30000 }, offRing)[0];
    ok(eOff.ringShots === 0 && S.debtPressure({ debt: 30000 }, offRing).bossMove === '' && S.debtPressure({ debt: 30000 }, offRing).bossNote === '', '覆盖 ringShots=0 → 头子不放环弹（原型 ringShots 0 = 旧行为），提示里也不写头子招式');
    const rawOv = { tiers: { wanted: { shotCount: 5, atkCdMul: 'x' } } };
    ok(J7(S.bountyEnemies({ debt: 30000 }, rawOv)) === J7(S.bountyEnemies({ debt: 30000 }, BT(rawOv).table)) && J7(S.bountyEnemies({ debt: 30000 }, BT(rawOv))) === J7(S.bountyEnemies({ debt: 30000 }, BT(rawOv).table)) && S.bountyEnemies({ debt: 30000 }, rawOv)[0].atkCdMul === 0.6, '直接传未校验的覆盖对象 / bountyTuning 结果也先校验（非法字段回退默认），与传合并表结果一致');
    ok(J7(S.bountyEnemies({ debt: 30000 }, 'garbage')) === J7(S.bountyEnemies({ debt: 30000 })) && J7(S.debtPressure({ debt: 8888 }, [1, 2])) === J7(S.debtPressure({ debt: 8888 })), '传入非对象覆盖 → 等同默认表');
    // 覆盖不改存档、不影响结算
    const Gt7 = mk({ debt: 30000, year: 5, flags: { bounty: 1 } }); const snap7 = JSON.stringify(Gt7);
    S.debtPressure(Gt7, TO); S.bountyEnemies(Gt7, TO); S.bountyTuning({ tiers: { wanted: { hunters: 1 } } });
    ok(JSON.stringify(Gt7) === snap7 && !/tuning|wbx_dev/i.test(JSON.stringify(Gt7)), '带覆盖生成追兵：存档逐字段不变、没写进任何调参字段');
    const Ga7 = mk({ debt: 30000, flags: { bounty: 1 } }), Gb7 = JSON.parse(JSON.stringify(Ga7));
    const team7 = S.bountyEnemies(Ga7, TO).map(e => e.name);
    ok(J7(S.settleBounty(Ga7, { result: 'win', reason: 'cleared', tier: S.debtPressure(Ga7, TO).tier, defeated: team7 })) === J7(S.settleBounty(Gb7, { result: 'win', reason: 'cleared', tier: S.debtPressure(Gb7).tier, defeated: S.bountyEnemies(Gb7).map(e => e.name) })) && J7(Ga7) === J7(Gb7), '覆盖不影响结算：同一存档带/不带覆盖打赢，结算返回值与结算后存档一致（档位、误工费率、讨债令照旧）');
    // 只有开发者入口读覆盖键；stage3 本身不碰 localStorage；正式游戏文件不引用 bountyTuning
    const keyFiles = fs7.readdirSync(jsDir).filter(f => f.endsWith('.js') && /wbx_dev_bounty_tuning/.test(fs7.readFileSync(path.join(jsDir, f), 'utf8')));
    ok(keyFiles.join(',') === 'dev_openworld.js', '只有 dev_openworld.js 提到覆盖键 wbx_dev_bounty_tuning：' + keyFiles.join(','));
    const s3code = fs7.readFileSync(path.join(jsDir, 'stage3_encounter_draft.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
    ok(!/localStorage|sessionStorage|Game\.save|\.save\(\)/.test(s3code.slice(s3code.indexOf('TUNE_RULES'), s3code.indexOf('BOUNTY_FEE:'))) && !/localStorage/.test(s3code), 'stage3 不读 localStorage；调参代码不存档');
    const tuneCallers = fs7.readdirSync(jsDir).filter(f => f.endsWith('.js') && f !== 'stage3_encounter_draft.js' && /bountyTuning|BOUNTY_TUNING_DEFAULT|tuningTable/.test(fs7.readFileSync(path.join(jsDir, f), 'utf8')));
    ok(tuneCallers.join(',') === 'dev_openworld.js', '只有 dev_openworld.js 调用 bountyTuning：' + tuneCallers.join(','));
    const de7 = fs7.readFileSync(path.join(jsDir, 'dev_openworld.js'), 'utf8');
    const rbt = de7.slice(de7.indexOf('function readBountyTuning'), de7.indexOf('const short'));
    // 债务强化 #8 起开发者入口可以写覆盖键（一键预设），但只许写这一个专用键：整个文件唯一一处 setItem = writeBountyPreset 里的 localStorage.setItem(TUNING_KEY, …)；读取函数仍只 getItem
    const de7c = de7.replace(/^\s*\/\/.*$/gm, ''), setCalls = de7c.match(/\bsetItem\s*\(/g) || [];
    const wbp = de7c.slice(de7c.indexOf('function writeBountyPreset'), de7c.indexOf('const BTN_CSS'));
    ok(/const TUNING_KEY = 'wbx_dev_bounty_tuning'/.test(de7) && /localStorage\.getItem\(TUNING_KEY\)/.test(rbt) && !/setItem|removeItem|\.save\(/.test(rbt)
      && setCalls.length === 1 && (de7c.match(/localStorage\.setItem\(TUNING_KEY, JSON\.stringify\(p\.override\)\)/g) || []).length === 1 && /localStorage\.setItem\(TUNING_KEY/.test(wbp)
      && (de7c.match(/removeItem\(([^)]*)\)/g) || []).every(x => x === 'removeItem(TUNING_KEY)') && !/wbx2_save/.test(de7c) && !/\.save\(|Game\.|gameObj/.test(wbp + rbt),
      '开发者入口读覆盖键只 getItem；setItem 全文件仅 1 处且只写 TUNING_KEY（预设 JSON），removeItem 只删 TUNING_KEY，不碰 wbx2_save、读写覆盖时不存档');
    ok(/Stage3\.debtPressure\(G, tu\.table\)/.test(de7) && /Stage3\.bountyEnemies\(G, tu\.table\)/.test(de7) && /key: 'zt'/.test(de7) && /removeItem\(TUNING_KEY\)/.test(de7), '开发者「追兵战」用合并后的表；新增「追兵调参」按钮（可清除覆盖）');
  }

  // 17. 债务强化 #8：追兵调参一键预设 BOUNTY_TUNING_PRESETS（好躲/原样/地狱）——纯数据深冻结、每个值都原样通过 bountyTuning、难度单调、只给开发者入口用
  {
    const fs8 = require('fs');
    const PR = S.BOUNTY_TUNING_PRESETS, D8 = S.BOUNTY_TUNING_DEFAULT, BT = o => S.bountyTuning(o), J8 = v => JSON.stringify(v);
    const TF = ['hunters', 'hpMul', 'atkCdMul', 'windMul', 'shotCount', 'shotSpread', 'spdAdd'], BF = ['ringShots', 'ringWarn', 'ringCd'];
    const snapD = J8(D8), snapT = J8(S.DEBT_TIERS), snapB = J8(S.BOSS_RING);
    ok(Array.isArray(PR) && PR.map(p => p.key).join() === 'easy,plain,hell' && PR.map(p => p.n).join() === '好躲,原样,地狱' && PR.every(p => typeof p.note === 'string' && p.note.length > 4), '三个预设：easy 好躲 / plain 原样 / hell 地狱（顺序固定，各带说明）');
    const deepFrozen = o => !o || typeof o !== 'object' || (Object.isFrozen(o) && Object.values(o).every(deepFrozen));
    let threw8 = 0; for (const f of [() => { PR.push({}); }, () => { PR[0].n = 'x'; }, () => { PR[2].override.boss.ringShots = 99; }, () => { PR[0].override.tiers.wanted.hunters = 1; }, () => { PR[1].override = {}; }]) { try { f(); } catch (e) { threw8++; } }
    ok(deepFrozen(PR) && threw8 === 5 && PR.length === 3 && PR[2].override.boss.ringShots === 12 && PR[1].override === null, '预设表深冻结（数组/每个预设/override 各层），改不动');
    const res8 = PR.map(p => BT(p.override));
    ok(res8.every(r => !r.error && !r.clamped.length && !r.rejected.length && !r.unknown.length), '每个预设的覆盖都原样通过 bountyTuning：0 钳制 / 0 非法 / 0 未知 / 无 error：' + res8.map((r, i) => `${PR[i].key} 改 ${r.changed.length} 项`).join('，'));
    const inRange = PR.every(p => !p.override || (Object.entries(p.override.tiers || {}).every(([k, t]) => S.DEBT_TIERS.some(d => d.key === k) && Object.entries(t).every(([f, v]) => S.tuneField(S.TUNE_RULES.tier[f], v).v === v))
      && Object.entries(p.override.boss || {}).every(([f, v]) => S.tuneField(S.TUNE_RULES.boss[f], v).v === v)));
    ok(inRange, '预设每个字段都在 TUNE_RULES 范围内（整数字段为整数，tuneField 原值返回），档位键都是 light/owing/heavy/wanted');
    ok(res8[1].table === D8 && res8[0].changed.length > 0 && res8[2].changed.length > 0 && res8.every((r, i) => J8(BT(JSON.parse(J8(PR[i].override))).table) === J8(r.table)), '原样 = 默认表（同一冻结对象）；好躲/地狱确有改动；JSON 往返（开发者入口写进 localStorage 的形态）结果一致');
    // 难度单调：好躲每个字段都不比默认难、地狱每个字段都不比默认易（夹角不算难度，不比较）；每档至少一项严格变化
    const easier = { hunters: -1, hpMul: -1, atkCdMul: 1, windMul: 1, shotCount: -1, spdAdd: -1, ringShots: -1, ringWarn: 1, ringCd: 1 };
    const dir = (t, base, f) => Math.sign(t[f] - base[f]) * easier[f]; // 1 = 更好躲，-1 = 更难
    const E = res8[0].table, H = res8[2].table;
    const eOk = E.tiers.every((t, i) => TF.every(f => f === 'shotSpread' || dir(t, D8.tiers[i], f) >= 0) && TF.some(f => f !== 'shotSpread' && dir(t, D8.tiers[i], f) > 0)) && BF.every(f => dir(E.boss, D8.boss, f) > 0);
    const hOk = H.tiers.every((t, i) => TF.every(f => f === 'shotSpread' || dir(t, D8.tiers[i], f) <= 0) && TF.some(f => f !== 'shotSpread' && dir(t, D8.tiers[i], f) < 0)) && BF.every(f => dir(H.boss, D8.boss, f) < 0);
    ok(eOk, '好躲：四档每个字段都不比默认难（人/血/发数/移速 ≤、冷却/前摇 ≥），每档至少一项更好躲；头子环弹更少/预警更长/间隔更长：' + E.tiers.map(t => `${t.hunters}只×${t.hpMul}/冷却${t.atkCdMul}/前摇${t.windMul}/${t.shotCount}发`).join(' | '));
    ok(hOk, '地狱：四档每个字段都不比默认易，每档至少一项更难；头子环弹更多/预警更短/间隔更短：' + H.tiers.map(t => `${t.hunters}只×${t.hpMul}/冷却${t.atkCdMul}/前摇${t.windMul}/${t.shotCount}发`).join(' | '));
    // 查找与识别
    ok(S.bountyPreset('easy') === PR[0] && S.bountyPreset('hell') === PR[2] && S.bountyPreset('plain') === PR[1] && S.bountyPreset('x') === null && S.bountyPreset() === null, 'bountyPreset(key) 按 key 取预设，未知 key → null');
    ok(S.bountyPresetOf(null) === PR[1] && S.bountyPresetOf(D8) === PR[1] && S.bountyPresetOf(BT({})) === PR[1] && S.bountyPresetOf(res8[0].table) === PR[0] && S.bountyPresetOf(res8[2]) === PR[2] && S.bountyPresetOf(JSON.parse(J8(PR[2].override))) === PR[2]
      && S.bountyPresetOf(BT({ tiers: { wanted: { shotCount: 4 } } }).table) === null && S.bountyPresetOf(BT(Object.assign({}, JSON.parse(J8(PR[0].override)), { boss: { ringShots: 7 } })).table) === null && S.bountyPresetOf('garbage') === PR[1],
      'bountyPresetOf：默认/空覆盖/非对象 → 原样；好躲/地狱的表、结果、未校验覆盖都能认出；改过一项的自定义覆盖 → null');
    // 生效：追兵数/参数按预设；档名、阈值、特性名、结算不变
    const eE = S.bountyEnemies({ debt: 30000 }, E), eH0 = S.bountyEnemies({ debt: 10 }, H), eHW = S.bountyEnemies({ debt: 30000 }, H);
    ok(eE.length === 3 && eE[0].name === '讨债鬼头子' && eE[0].ringShots === 6 && eE[0].ringWarn === 0.6 && eE[0].ringCd === 5 && eE.every(e => e.shotCount === 2 && e.atkCdMul === 0.85 && e.windMul === 1 && e.hp === Math.round(80 * 1.3)), '好躲·通缉档：3 个（头子仍在）、2 发、冷却×0.85、前摇×1、血 104，头子环弹 6 发/0.6s/5s');
    ok(eH0.length === 2 && eH0.every(e => e.shotCount === 2 && e.name === '讨债鬼' && !('ringShots' in e)) && eHW.length === 4 && eHW.every(e => e.shotCount === 5 && e.atkCdMul === 0.4 && e.hp === 144) && eHW[0].ringShots === 12 && eHW[0].ringWarn === 0.3 && eHW[0].ringCd === 1.5, '地狱：小账 2 个双发（无头子无环弹）；通缉 4 个、5 发、冷却×0.4、血 144，头子环弹 12 发/0.3s/1.5s');
    const pWs = PR.map(p => S.debtPressure({ debt: 30000 }, BT(p.override).table)), pLs = PR.map(p => S.debtPressure({ debt: 3000 }, BT(p.override).table));
    ok(pWs.every(p => p.n === '天道通缉' && p.trait === '疾攻三发' && p.tier === 3 && p.bossMove === '回身环弹') && pLs.every(p => p.n === '欠款' && p.tier === 1) && /^开发者调参：/.test(pLs[0].traitNote) && pLs[1].traitNote === '与普通讨债鬼相同' && J8(pWs[1]) === J8(S.debtPressure({ debt: 30000 })), '三个预设下档名/阈值/特性名不变；原样与不传逐字段一致；好躲把欠款档调成非中性 → 说明标「开发者调参」');
    const Ga8 = mk({ debt: 30000, year: 3, flags: { bounty: 1 } }), sets8 = PR.map(p => { const g = JSON.parse(J8(Ga8)); const tb = BT(p.override).table; const r = S.settleBounty(g, { result: 'win', reason: 'cleared', tier: S.debtPressure(g, tb).tier, defeated: S.bountyEnemies(g, tb).map(e => e.name) }); return J8(r) + J8(g); });
    ok(sets8.every(x => x === sets8[1]) && J8(Ga8) === J8(mk({ debt: 30000, year: 3, flags: { bounty: 1 } })), '三个预设打赢天道通缉：结算返回值 + 结算后存档完全一致（预设只改战斗参数，不改结算/讨债令/存档）');
    ok(J8(D8) === snapD && J8(S.DEBT_TIERS) === snapT && J8(S.BOSS_RING) === snapB, '预设与识别全程不改默认表 / DEBT_TIERS / BOSS_RING');
    // 只给开发者入口：除 stage3 外只有 dev_entry 引用预设；stage3 仍不读写 localStorage；dev_entry 预设写入走 writeBountyPreset，卡片选项 = 知道了 + 三个预设
    const jsDir8 = path.join(__dirname, '..', 'www', 'js');
    const prUsers = fs8.readdirSync(jsDir8).filter(f => f.endsWith('.js') && f !== 'stage3_encounter_draft.js' && /BOUNTY_TUNING_PRESETS|bountyPreset/.test(fs8.readFileSync(path.join(jsDir8, f), 'utf8')));
    ok(prUsers.join(',') === 'dev_openworld.js', '除 stage3 外只有 dev_openworld.js 引用预设：' + prUsers.join(','));
    const s3c8 = fs8.readFileSync(path.join(jsDir8, 'stage3_encounter_draft.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
    const de8 = fs8.readFileSync(path.join(jsDir8, 'dev_openworld.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
    ok(!/localStorage|sessionStorage|wbx_dev/.test(s3c8) && /writeBountyPreset\(p\)/.test(de8) && /\['知道了'\]\.concat\(presets\.map/.test(de8) && /Stage3\.bountyPresetOf\(tu\.table\)/.test(de8), 'stage3 不读写 localStorage；dev_entry 点预设走 writeBountyPreset，卡片选项 = 知道了 + 预设，并标出当前预设');
  }

  // 7. 真实页面里 UI/Game 是顶层 const（不在 window 上）：vm 模拟，确认奇遇仍能弹卡并改债务（旧版 window.UI 判断 → 永远 no game or UI）
  const vm = require('vm'), fs = require('fs');
  const cx = vm.createContext({ console });
  vm.runInContext("var window = globalThis; const cards = []; const UI = { card: async (t) => { cards.push(t); return 0; }, hud() {}, toast() {} }; let saved = 0; const Game = { save() { saved++; } };", cx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'www', 'js', 'stage3_encounter_draft.js'), 'utf8'), cx);
  const r7 = await vm.runInContext("(async () => { const G = { debt: 8888, aff: {}, flags: {} }; const r = await window.Stage3.test(G); return { r, debt: G.debt, cards, saved }; })()", cx);
  ok(r7.r.ok && r7.debt === 10666 && r7.cards[0] === '债主之家' && r7.saved === 1, 'UI 为顶层 const 时奇遇照常弹卡、改债务、存档');
  ok(!/window\.(UI|Game)\b/.test(fs.readFileSync(path.join(__dirname, '..', 'www', 'js', 'stage3_encounter_draft.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '')), 'stage3 代码里不再用 window.UI / window.Game');
  const de = fs.readFileSync(path.join(__dirname, '..', 'www', 'js', 'dev_openworld.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  ok(!/window\.(UI|Game)\b/.test(de), 'dev_openworld 代码里不再用 window.UI / window.Game');

  // 9. 第十三轮：合 main（8ee2459）后，两条链每个选择的 L.rel 总变化 = 目标（同步 + 补差额，不重复计）；追兵战互斥读 L.seen.foe_年
  {
    const c9 = vm.createContext({ console: { log() {}, error() {} }, Math, setTimeout: () => 0 });
    vm.runInContext(`var window = globalThis;
      var REALMS = [{ n: '凡人', need: 80 }, { n: '练气', need: 200 }], NPCS = { merchant: { n: '奸商·钱多多', por: 'npc_merchant' }, xianguan: { n: '仙官·记账童子', por: 'npc_disciple' } };
      var QUESTS = {}, SECTS = {}, ITEMS = {}, MAPINFO = { market: { n: '坊市', mons: ['slime'], tier: 1 } }, ASSETS = { maps: {} }, R = { ents: [], mapId: 'market', mode: 'map' };
      function t2p(i, j) { return [i, j]; } function s2w(x, y) { return [x, y]; } var pickAt = function () { return null; }; function walkable() { return true; } function addEnt() {} function removeEnt() {} function loadSprite() {} var npcAI = function () {};
      var UI = { picks: [], card: async () => (UI.picks.length ? UI.picks.shift() : 0), say: async () => (UI.picks.length ? UI.picks.shift() : 0), hud() {}, toast() {} };
      var Game = { G: null, save() {}, async yearEnd() { this.G.year++; this.G.age++; }, interactEnt() {}, refreshNpcs() {}, async enterMap() {}, acceptQuest() {}, async fight() { return { res: 'win' }; }, canEnter() { return true }, give() {},
        async apply(eff) { const G = this.G; for (const tk of eff.split(';')) { const p = tk.split(':'); if (p[0] === 'aff') G.aff[p[1]] = Math.max(0, Math.min(150, (G.aff[p[1]] || 0) + +p[2])); } } };`, c9);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'www', 'js', 'life34.js'), 'utf8'), c9);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'www', 'js', 'stage3_encounter_draft.js'), 'utf8'), c9);
    const S9 = vm.runInContext('Stage3', c9), G9 = vm.runInContext('Game', c9), U9 = vm.runInContext('UI', c9), L9 = vm.runInContext('Life34', c9);
    const nG = (aff) => ({ year: 5, age: 15, realm: 1, debt: 5000, stone: 1000, aff: Object.assign({}, aff), flags: {}, life34: { v: 1, fav: 1, rel: {}, seen: {}, log: [], pending: null } });
    const rv = (g, id) => (g.life34.rel[id] || 0);
    const one = async (fn, id, a0, pk) => { const g = nG({ [id]: a0 }); G9.G = g; U9.picks = [pk, 0]; await S9[fn](g); return { g, d: rv(g, id) }; };
    const rows = [['runMerchantChain', 'merchant', '举报', 1, [[0, -20], [30, -20], [100, -20]]], ['runMerchantChain', 'merchant', '扛税', 0, [[0, 20], [120, 15]]], ['runMerchantChain', 'merchant', '不掺和', 2, [[30, -2]]],
      ['runLedgerChain', 'xianguan', '告发', 2, [[0, -20], [50, -20]]], ['runLedgerChain', 'xianguan', '对账', 0, [[0, 20], [120, 15]]], ['runLedgerChain', 'xianguan', '贿赂', 1, [[0, 10]]]];
    for (const [fn, id, nm, pk, cs] of rows) for (const [a0, want] of cs) { const { d } = await one(fn, id, a0, pk); ok(d === want, `L.rel：${id}「${nm}」起始好感 ${a0} → 总变化 ${want}（实得 ${d}，不重复计）`); }
    { const { g } = await one('runLedgerChain', 'xianguan', 0, 1); const r0 = rv(g, 'xianguan'); U9.picks = [0, 0]; const r = await S9.runLedgerChain(g);
      ok(r.exposed && rv(g, 'xianguan') - r0 === -15, 'L.rel：贿赂露馅这一步总变化 -15'); }
    // 同一变化：旧的直接写 G.aff 不触发 main 同步；Game.apply 才触发
    { const g = nG({ merchant: 30 }); G9.G = g; S9.addAffTo(g, 'merchant', -40); const a = rv(g, 'merchant'); g.aff.merchant = 30; await G9.apply('aff:merchant:-40');
      ok(a === 0 && rv(g, 'merchant') === -15, '直接写 G.aff 不经同步（0），Game.apply 同步 -15 → 链里由 affRel 调 Life34.syncAff 补上这份'); }
    // 互斥两方向（键年 = G.year || G.age）
    { const g = nG({}); g.life34.rel.merchant = -60; g.life34.pending = { type: 'foe', npc: 'merchant' }; G9.G = g; U9.picks = [0]; await L9.visit({ label: '奸商·钱多多' });
      ok(g.life34.seen.foe_5 === 1 && !S9.canHunt(g).ok && S9.canHunt(g).src === 'seen', '仇家上门（life34 写 foe_5）→ 同年追兵战被拒');
      g.year = 6; ok(S9.canHunt(g).ok, '次年不挡追兵战');
      const h = nG({}); delete h.year; h.age = 40; h.life34.rel.merchant = -60; G9.G = h; S9.settleBounty(h, { result: 'win', reason: 'cleared', tier: 0 });
      ok(h.flags.s3b_hunt_year === 40 && S9.huntBlocksFoe(h), '追兵战结算写 s3b_hunt_year = G.age（无 year）');
      h.flags.s3b_hunt_year = 41; await G9.yearEnd(); ok(h.age === 41 && !(h.life34.pending && h.life34.pending.type === 'foe') && !h.life34.seen.foe_41, '本年打过追兵战 → life34 不派仇家（可能派别的来客）');
      h.life34.pending = null; await G9.yearEnd(); ok(h.life34.pending && h.life34.pending.type === 'foe', '次年照派'); }
  }

  // 15d. 第二十二轮：即时战原型一小步——Stage3.fightStats(out) 纯函数（追兵战结算卡「本场：用时 / 受击 / 闪避」）
  {
    const a = S.fightStats({ result: 'win', time: 12.345, hits: 3, dodged: 2 });
    ok(a.time === 12.3 && a.hits === 3 && a.dodged === 2 && a.line === '本场：用时 12.3s，受击 3 次，闪避 2 次', 'fightStats：12.345s / 3 / 2 → 「本场：用时 12.3s，受击 3 次，闪避 2 次」');
    const b = S.fightStats({ time: 4, hits: 0, dodged: 0 });
    ok(b.line === '本场：用时 4.0s，受击 0 次，闪避 0 次（无伤）', '受击 0 → 行尾标「（无伤）」');
    const bads = [null, undefined, 5, 'x', {}, { time: -1, hits: -2, dodged: NaN }, { time: Infinity, hits: '3', dodged: 1.9 }];
    let allOk = true;
    for (const o of bads) { let r; try { r = S.fightStats(o); } catch (e) { allOk = false; continue; } if (typeof r.line !== 'string' || !r.line.startsWith('本场：')) allOk = false; }
    const c = S.fightStats({ time: Infinity, hits: '3', dodged: 1.9 });
    ok(allOk && c.time === null && c.hits === null && c.dodged === 1 && c.line === '本场：用时 —，受击 — 次，闪避 1 次', '7 种坏输入不抛错，坏值显示「—」、不标无伤；1.9 次向下取整为 1');
    const o = Object.freeze({ time: 7.25, hits: 1, dodged: 0 }); const r1 = S.fightStats(o), r2 = S.fightStats(o);
    ok(JSON.stringify(r1) === JSON.stringify(r2) && r1.time === 7.3, '深冻结输入不抛错、两次结果一致（7.25 → 7.3）');
    const src = S.fightStats.toString();
    ok(!/\bG\b/.test(src) && !/o\.[a-z]+\s*=[^=]/.test(src) && !/save\(/.test(src), 'fightStats 源码不碰 G、不给 out 赋值、不 save');
    const dsrc = require('fs').readFileSync(path.join(__dirname, '..', 'www', 'js', 'dev_openworld.js'), 'utf8');
    ok(/Stage3\.fightStats\(r\)\.line/.test(dsrc), '追兵战结算卡调用 Stage3.fightStats(r).line');
  }

  // 15d. 第三十三轮：讨债令第二个只读用途——Stage3.tokenFeePreview(G) 抵扣误工费预览（只读，不真正抵扣）
  {
    const deep = o => JSON.stringify(o);
    const frz = o => { if (o && typeof o === 'object') { Object.values(o).forEach(frz); Object.freeze(o); } return o; };
    ok(typeof S.tokenFeePreview === 'function' && S.TOKEN_FEE_COST === 1, '有 Stage3.tokenFeePreview(G)，1 枚抵 1 次');
    const g0 = mk({ debt: 30000, year: 5 }); const s0 = deep(g0); const p0 = S.tokenFeePreview(g0);
    ok(p0.tier === 3 && p0.fee === 3600 && p0.count === 0 && !p0.canOffset && p0.after === 33600 && p0.afterNoToken === 33600 && p0.tokensLeft === 0
      && p0.text.includes('天道通缉档，费率 12%') && p0.text.includes('欠款 30000 → 33600') && p0.text.includes('抵不了') && p0.text.includes('仅预览，尚未生效') && deep(g0) === s0, '0 枚、欠 30000：误工费 3600、抵不了、存档不变');
    const g1 = frz(mk({ debt: 30000, flags: { s3b_token: 3 } })); const s1 = deep(g1); let p1;
    try { p1 = S.tokenFeePreview(g1); } catch (e) { p1 = null; }
    ok(p1 && p1.canOffset && p1.after === 30000 && p1.tokensLeft === 2 && p1.text.includes('花 1 枚讨债令抵掉这笔，欠款保持 30000，讨债令剩 2 枚') && deep(g1) === s1 && g1.flags.s3b_token === 3, '3 枚：深冻结存档不抛错、预览抵后剩 2 枚、欠款不变、flag 不动');
    const g2 = mk({ debt: 500 }); const p2 = S.tokenFeePreview(g2);
    ok(p2.tier === 0 && p2.fee === 100 && p2.text.includes('误工费 100（保底）') && p2.text.includes('小账档，费率 5%'), '小账 500：保底 100 并标「保底」');
    const g3 = mk({ debt: 3000, flags: { bounty: 1, s3b_token: 1 } }); const p3 = S.tokenFeePreview(g3);
    ok(p3.tier === 2 && p3.fee === 300 && p3.text.includes('含通缉 +1 档') && p3.tokensLeft === 0, '欠款档 + 通缉 → 重债档 10%：300，抵后剩 0 枚');
    ok([null, undefined, {}, 5, { debt: 'x', flags: null }, { debt: -50, flags: { s3b_token: 'a' } }].every(x => { try { const r = S.tokenFeePreview(x); return r.debt === 0 && r.fee === 100 && r.count === 0 && !r.canOffset && typeof r.text === 'string'; } catch (e) { return false; } }), '无存档 / 坏字段 / 负欠款：不崩，按欠 0、保底 100、0 枚');
    // 与败场 settleBounty 同式：预览的误工费 = 下一场按开战档位打输真正记的误工费；且现在打输照旧加费、不扣讨债令
    let agree = true;
    for (const [d, b, n] of [[0, 0, 0], [999, 0, 1], [1001, 1, 2], [5001, 0, 0], [8888, 1, 9], [20001, 0, 4], [123456, 1, 1]]) {
      const g = mk({ debt: d, flags: Object.assign({ s3b_token: n }, b ? { bounty: 1 } : {}) });
      const pv = S.tokenFeePreview(g), r = SB(g, { result: 'lose', reason: 'dead', tier: S.debtPressure(g).tier });
      if (pv.fee !== r.fee || pv.afterNoToken !== g.debt || S.tokenCount(g) !== n) agree = false;
    }
    ok(agree, 'tokenFeePreview.fee / afterNoToken 与下一场败场 settleBounty 逐例一致（7 例），且败场不扣讨债令');
    const src = S.tokenFeePreview.toString();
    ok(!/G\.[a-zA-Z_]+\s*=[^=]/.test(src) && !/flags\.[a-zA-Z_0-9]+\s*=[^=]/.test(src) && !/save\(/.test(src), 'tokenFeePreview 源码不给 G / flags 赋值、不 save');
    const dsrc = require('fs').readFileSync(path.join(__dirname, '..', 'www', 'js', 'dev_openworld.js'), 'utf8');
    ok(/Stage3\.tokenFeePreview\(g\.G\)\.text/.test(dsrc), '开发者「讨债令」卡片附上 Stage3.tokenFeePreview(g.G).text');
  }

  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  process.exit(fails);
})();

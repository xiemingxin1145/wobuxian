// 讨债令真抵扣误工费单测：node test/stage3_token_offset.js（退出码 = 失败数）
'use strict';
const path = require('path'), fs = require('fs');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
global.window = global;
global.UI = { card: async () => 0, hud() {}, toast() {} };
global.Game = { save() {} };
const S = require(path.join(__dirname, '..', 'www', 'js', 'stage3_encounter_draft.js'));
const mk = (o) => Object.assign({ v: 2, year: 7, debt: 20000, stone: 500, aff: {}, flags: {} }, o);
const lose = { result: 'lose', reason: 'dead', tier: 2 };

// 1. 有令：扣 1 枚、欠款不变、记 s3b_token_used
let G = mk({ flags: { s3b_token: 3 } });
let s = S.settleBounty(G, Object.assign({}, lose));
ok(s.result === 'lose' && s.fee === 2000 && G.debt === 22000, '败场先照常记误工费 2000');
ok(S.canOffsetFee(G, s), '有 3 枚令 → 可抵扣');
let r = S.offsetFee(G, s);
ok(r.ok && G.debt === 20000 && s.debtAfter === 20000 && s.offset, '抵扣后欠款回到 20000，不收误工费');
ok(G.flags.s3b_token === 2 && r.tokens === 2 && s.tokens === 2, '恰好扣 1 枚（3 → 2）');
ok(G.flags.s3b_token_used === 1, 's3b_token_used 懒初始化为 1');
ok(!S.offsetFee(G, s).ok && G.flags.s3b_token === 2 && G.debt === 20000, '同一场不能重复抵扣');
ok(G.v === 2 && G.flags.s3b_lose === 1, 'G.v 仍为 2，败场计数照旧');
// 2. 无令：行为不变
G = mk(); s = S.settleBounty(G, Object.assign({}, lose));
ok(!S.canOffsetFee(G, s) && !S.offsetFee(G, s).ok && G.debt === 22000 && !('s3b_token' in G.flags) && !('s3b_token_used' in G.flags), '无令：照付误工费，不写新 flag');
// 3. 恰好 1 枚 → 0；旧存档无 flags
G = mk({ flags: { s3b_token: 1, s3b_token_used: 4 } }); s = S.settleBounty(G, Object.assign({}, lose, { reason: 'timeout' }));
r = S.offsetFee(G, s); ok(r.ok && G.flags.s3b_token === 0 && G.flags.s3b_token_used === 5 && S.tokenCount(G) === 0, '1 枚 → 0 枚，used 累加');
G = { debt: 500 }; s = S.settleBounty(G, Object.assign({}, lose)); ok(!S.offsetFee(G, s).ok && G.debt === 600, '旧存档无 flags：不抵扣，保底误工费 100');
// 4. 胜场 / 未结算 / 非法输入不抵扣
G = mk({ flags: { s3b_token: 2 } }); s = S.settleBounty(G, { result: 'win', reason: 'cleared', tier: 0 });
ok(!S.offsetFee(G, s).ok && G.flags.s3b_token === 2, '胜场不扣令');
ok(!S.offsetFee(G, { settled: false }).ok && !S.offsetFee(null, null).ok && G.flags.s3b_token === 2, '未结算/非法输入不扣令');
// 5. 开发者入口接线 + 不碰正式发奖
const js = path.join(__dirname, '..', 'www', 'js');
const de = fs.readFileSync(path.join(js, 'dev_openworld.js'), 'utf8');
ok(/Stage3\.canOffsetFee\(G, s\)/.test(de) && /Stage3\.offsetFee\(G, s\)\.ok/.test(de) && /'花 1 枚抵掉', '照付误工费'/.test(de), '追兵战败场弹确认卡「花 1 枚抵掉 / 照付误工费」');
const src = fs.readFileSync(path.join(js, 'stage3_encounter_draft.js'), 'utf8');
const body = src.slice(src.indexOf('canOffsetFee(G, s)'), src.indexOf('BRK_PENALTY')).replace(/^\s*\/\/.*$/gm, '');
ok(!/G\.(stone|inv|eq|exp)\b|Game\.|localStorage/.test(body), '抵扣代码只改 G.debt 与 flags');
console.log(fails ? `${fails} FAILED` : `ALL PASS (${n})`);
process.exit(fails);

// 4.1 分支剧情 v1 第一线 route41 单测：node test/route41_unit.js（退出码 = 失败数）
// 覆盖 roadmap_after_4.0.md：分歧点 + G.route 存档 + dodge 已有 debt_union 效果 + AUTO 护栏；vm + 真实 route41.js，无 Chrome。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0;
const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'www/js/route41.js'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'www/index.html'), 'utf8');
const SCRIPTS = [...HTML.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);

// ux23.js 的 SAFE / UNSAFE（原样抄，用于断言分歧选项不会被自动任务代选）
const SAFE = /^(打坐（|★|✔|！|接受|继续|好|收下|交付|……|应战|带路|明白|谢|原来如此|伸手|去后巷|去看看|你说什么|撤|知道了|确定|抄起扫帚|开始|过年)/;
const UNSAFE = /(结局|道侣|拜师|高利贷|借|送礼|交易|出售|驱逐|成为新天道|销账|渡劫|飞升|放弃|轮回|删除|重置|落幕|算天道|算剑仙|各退一步)/;

function box() {
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    Math, JSON, Date, setTimeout() {}, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    Game: {
      G: null,
      save() {},
      yearEnd: async function () { return 'orig'; },
      newLife: function () { return 'orig-life'; }
    },
    UI: { modal: false, card: async function () { return 3; } },
    B: { on: false },
    NPC37: { storyBlock: function () { return null; } },
    AUTO: { on: null },
    AFK: { on: false },
    DevPanel: { registerTab: function () {} }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox);
  return sandbox;
}
function mkG(over) {
  return Object.assign({ year: 5, inv: {}, flags: {}, v: 2, dead: false }, over || {});
}

(async function main() {
  // TEXT 与 index 接线（index 文件在测试底本里由分支步骤写入，缺失时只验 TEXT）
  const sb = box();
  const R = sb.Route41;
  ok(!!R, 'Route41 已导出');
  try { JSON.parse(JSON.stringify(R.TEXT)); ok(true, 'TEXT_ROUTE41 可 JSON 序列化'); } catch (e) { ok(false, 'TEXT_ROUTE41 可 JSON 序列化'); }
  ok(SCRIPTS.indexOf('js/route41.js') < 0 || SCRIPTS.indexOf('js/route41.js') > SCRIPTS.indexOf('js/zong36.js'), 'index 接线顺序（若已接线）：route41 在 zong36 之后（未接线时此项自动过）');

  // 老档
  let G = mkG({});
  ok(R.routeOf(G) === null, '老档 G.route 缺省 = null（主线）');
  const S = R.ensure(G);
  ok(!!S && S.offerY === 0 && G.route === undefined, 'ensure 只补 route41，不写 G.route，不升 G.v');
  ok(G.v === 2, 'ensure 不改 G.v');

  // shouldOffer
  ok(R.shouldOffer(mkG({})) === false, '无欠条不弹分歧卡');
  ok(R.shouldOffer(mkG({ inv: { bill: 1 } })) === true, '有欠条、未选路线、本年未问过 → 弹卡');
  ok(R.shouldOffer(mkG({ inv: { bill: 1 }, route41: { v: 1, offerY: 5 } })) === false, '本年已问过（延期年）不再弹');
  ok(R.shouldOffer(mkG({ inv: { bill: 1 }, route: 'pay' })) === false, '已选路线不再弹');
  ok(R.shouldOffer(mkG({ inv: { bill: 1 }, dead: true })) === false, '死亡档不弹');

  // canPopup 守卫
  const sb2 = box(); const R2 = sb2.Route41;
  sb2.AUTO.on = 'quest'; ok(R2.canPopup(mkG({ inv: { bill: 1 } })) === false, 'AUTO 开着不弹');
  sb2.AUTO.on = null; sb2.AFK.on = true; ok(R2.canPopup(mkG({ inv: { bill: 1 } })) === false, 'AFK 开着不弹');
  sb2.AFK.on = false; sb2.B.on = true; ok(R2.canPopup(mkG({ inv: { bill: 1 } })) === false, '战斗中不弹');
  sb2.B.on = false; sb2.UI.modal = true; ok(R2.canPopup(mkG({ inv: { bill: 1 } })) === false, '有弹窗时不弹');
  sb2.UI.modal = false; sb2.NPC37.storyBlock = function () { return 'story'; }; ok(R2.canPopup(mkG({ inv: { bill: 1 } })) === false, '剧情锁定时不弹');
  sb2.NPC37.storyBlock = function () { return null; }; R2.off = true; ok(R2.canPopup(mkG({ inv: { bill: 1 } })) === false, 'off=true 不弹');
  R2.off = false; ok(R2.canPopup(mkG({ inv: { bill: 1 } })) === true, '守卫全过时可弹');

  // choose
  G = mkG({ inv: { bill: 1 } }); let r = R.choose(G, 0);
  ok(r.ok && G.route === 'pay' && !G.flags.debt_union, '选 0 → pay，只记路线');
  G = mkG({ inv: { bill: 1 } }); r = R.choose(G, 1);
  ok(r.ok && G.route === 'dodge' && G.flags.debt_union === 1, '选 1 → dodge，写 debt_union（已有事件系统）');
  G = mkG({ inv: { bill: 1 } }); r = R.choose(G, 2);
  ok(r.ok && G.route === 'buy' && !G.flags.debt_union, '选 2 → buy，只记路线');
  G = mkG({ inv: { bill: 1 } }); r = R.choose(G, 3);
  ok(!r.ok && r.reason === 'defer' && (G.route === undefined || G.route === null) && G.route41.offerY === 5, '选 3 → 延期，只记 offerY，不写路线');
  G = mkG({ inv: { bill: 1 } }); r = R.choose(G, 9);
  ok(!r.ok && (G.route === undefined || G.route === null), '非法下标不写档');
  G = mkG({ inv: { bill: 1 }, route: 'pay' }); r = R.choose(G, 1);
  ok(!r.ok && G.route === 'pay', '已选路线后再次选择被拒绝，路线不变');

  // 选项文案护栏
  const opts = R.opts();
  ok(opts.length === 4, '分歧选项 = 3 条路线 + 延期');
  ok(opts[0] === '欠债还钱，天经地义。' && opts[1] === '我没签字，不认。' && opts[2] === '欠条？我全收了。', '三条选项文案与 E.2 原文一致');
  ok(opts.every(function (o) { return !SAFE.test(o) && !UNSAFE.test(o); }), '分歧选项不进 SAFE、不命中 UNSAFE，自动任务不会代选');
  ok(opts.every(function (o) { return !/^开始/.test(o); }), '选项文案不以「开始」起首');

  // yearEnd 包装：UI.card 返回 1（dodge）时写档
  const sb3 = box();
  sb3.UI.card = async function () { return 1; };
  const G3 = mkG({ inv: { bill: 1 } });
  sb3.Game.G = G3;
  // wire 在加载时已用 sb3 的 Game.yearEnd 原函数包过；直接调包后的 yearEnd
  const ret = await sb3.Game.yearEnd();
  ok(ret === 'orig', 'yearEnd 包装先跑原函数');
  ok(G3.route === 'dodge' && G3.flags.debt_union === 1, 'yearEnd 分歧卡选 dodge 后写档');
  ok(typeof sb3.Game.yearEnd._route41 !== 'undefined', 'yearEnd 包装带 _route41 标记');

  // newLife 清理
  const sb4 = box();
  const G4 = mkG({ inv: { bill: 1 }, route: 'buy', route41: { v: 1, offerY: 5 } });
  sb4.Game.G = G4;
  sb4.Game.newLife();
  ok(G4.route === undefined && G4.route41 === undefined, 'newLife 清除路线与 route41');

  console.log(n + ' tests, ' + fails + ' failed');
  process.exit(fails);
})().catch(function (e) { console.error(e); process.exit(99); });

// 3.9.0 阵法 zf39 秘境破阵单测：node test/zf39_dng_unit.js（退出码 = 失败数）。
// 确认 Dng.roomTrap 在 dungeon26 源码中不暴露；本模块包 UI.card + 挂 Dng.roomTrap。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(ROOT, 'www', 'js', f), 'utf8');
const ZF = rd('zf39.js'), DNG = rd('zf39_dng.js'), DUNGEON = rd('dungeon26.js');
const INDEX = fs.readFileSync(path.join(ROOT, 'www', 'index.html'), 'utf8');

ok(/zf39_dng\.js/.test(INDEX), 'index.html 加载 zf39_dng.js');
ok(INDEX.indexOf('zf39_rt.js') < INDEX.indexOf('zf39_dng.js'), 'zf39_dng.js 在 zf39_rt.js 之后');
if (/items40\.js/.test(INDEX)) ok(INDEX.indexOf('items40.js') < INDEX.indexOf('zf39_dng.js'), '有 items40 时 zf39_dng 在其后');
ok(!/Dng\.roomTrap\s*=/.test(DUNGEON), 'dungeon26 源码未暴露 Dng.roomTrap（闭包）');
ok(/async function roomTrap\s*\(/.test(DUNGEON), 'dungeon26 确有闭包 roomTrap');
ok(/触发陷阱/.test(DUNGEON), 'dungeon26 陷阱卡标题为「触发陷阱」');

function box(extra) {
  const cards = [];
  const toasts = [];
  const G = Object.assign({
    v: 2, year: 40, realm: 3, stage: 0, stone: 1e5, hp: 200, inv: {}, flags: { main0: 1 },
    st: { spd: 1 }, spdBonus: 0,
  }, (extra && extra.G) || {});
  const Game = {
    G,
    meta: { tut23: 1 },
    rolls: [],
    rollRet: null,
    roll(p, k) { this.rolls.push([p, k]); return this.rollRet == null ? Math.random() < p : !!this.rollRet; },
    stats() { return { mhp: 200, mmp: 100 }; },
    save() {},
  };
  const UI = {
    _q: Promise.resolve(),
    toasts,
    cards,
    toast(m) { toasts.push(String(m)); },
    push() {}, pop() {},
    card(title, text, por, opts) {
      cards.push({ title, text, opts: (opts || []).slice() });
      const self = this;
      const run = () => Promise.resolve(self._nextChoice != null ? self._nextChoice : 0);
      const p = self._q.then(run); self._q = p.catch(() => { }); return p;
    },
  };
  const Dng = { run: { band: 2, doneRooms: 0, needRooms: 3, floor: 1 } };
  const NPC37 = { _b: null, storyBlock() { return this._b; } };
  const B = { on: false };
  const c = {
    console, Math, JSON, Object, Array, Promise, Set,
    Game, UI, Dng, NPC37, B,
    document: { createElement() { return { style: {}, appendChild() {}, querySelector() { return { onclick: null }; } }; } },
    __zf39DngAutoPuzzle: true,
  };
  Object.assign(c, extra || {});
  c.window = c; c.globalThis = c;
  vm.createContext(c);
  vm.runInContext(ZF, c);
  vm.runInContext(DNG, c);
  return c;
}

async function main() {
  // 加载与挂接
  {
    const c = box();
    ok(!!c.ZF39Dng && !!c.ZF39.dng, '暴露 ZF39Dng / ZF39.dng');
    ok(c.__zf39Dng === 1, '置 __zf39Dng');
    ok(typeof c.Dng.roomTrap === 'function', '挂上 Dng.roomTrap（本模块安装）');
    ok(c.UI._zf39DngCard && c.UI.card !== c.UI._zf39DngCard, '包了 UI.card，保留 _zf39DngCard');
    const before = c.UI.card;
    vm.runInContext(DNG, c);
    ok(c.UI.card === before && c.__zf39Dng === 1, '重复加载不重复包');
  }

  // 老档未学：不拦截
  {
    const c = box();
    const G = c.Game.G;
    ok(!c.ZF39.learned(G), '老档未学');
    ok(!c.ZF39Dng.shouldOffer(G), 'shouldOffer=false');
    const snap = JSON.stringify(G);
    await c.UI.card('触发陷阱', '地面阵法骤亮，一道剑罡擦着你的肩头划过。\n气血 -40（160/200）', 'i:sk_poison', ['咬牙继续']);
    ok(c.UI.cards.length === 1 && c.UI.cards[0].opts[0] === '咬牙继续', '未学：原卡直通（咬牙继续）');
    ok(JSON.stringify(G) === snap && G.zf39 === undefined, '未学拦截不创建 G.zf39');
  }

  // 解析 / 还原 / 失败倍率
  {
    const c = box();
    const D = c.ZF39Dng;
    ok(D.parseTrapDmg('气血 -37（100/200）') === 37, 'parseTrapDmg 37');
    ok(D.parseTrapDmg('无') === 0, 'parseTrapDmg 无 = 0');
    ok(D.failDmg(100) === 120, 'failDmg ×1.2');
    const G = c.Game.G; G.hp = 160;
    D.restoreHp(G, 40);
    ok(G.hp === 200, 'restoreHp 回到满血');
    D.applyDmg(G, 50);
    ok(G.hp === 150, 'applyDmg 扣 50');
  }

  // 已学硬闯：拦截 → 选项 → 再扣血
  {
    const c = box();
    const G = c.Game.G;
    c.ZF39.ensure(G); G.zf39.lv = 3; G.zf39.xp = c.ZF39.need(3);
    G.hp = 160;
    ok(c.ZF39Dng.shouldOffer(G), '已学 shouldOffer');
    c.UI._nextChoice = 1;
    await c.UI.card('触发陷阱', '地面…\n气血 -40（160/200）', 'i:sk_poison', ['咬牙继续']);
    ok(c.UI.cards[0] && /破阵/.test(c.UI.cards[0].opts[0]) && c.UI.cards[0].opts[1] === '硬闯',
      '已学：先出破阵/硬闯选项');
    ok(c.UI.cards[1] && /气血 -40/.test(c.UI.cards[1].text), '硬闯后展示原伤害卡');
    ok(G.hp === 160, '硬闯：还原后再扣，hp=160');
  }

  // 已学破阵成功（AutoPuzzle）
  {
    const c = box();
    const G = c.Game.G;
    c.ZF39.ensure(G); G.zf39.lv = 2; G.zf39.xp = c.ZF39.need(2);
    const xp0 = G.zf39.xp;
    G.hp = 160;
    c.Game.rollRet = true;
    c.UI._nextChoice = 0;
    await c.UI.card('触发陷阱', '气血 -40（160/200）', 'i:sk_poison', ['咬牙继续']);
    ok(G.hp === 200, '破阵成功：血已还原且不扣');
    ok(G.zf39.xp > xp0, '破阵成功：阵道经验增加');
    ok((G.inv.zws39 || 0) >= 1, '破阵成功：阵纹石 ≥1');
    ok(c.UI.cards.some(x => x.title === '破阵成功'), '破阵成功卡');
  }

  // settleOk / settleFail 直接测
  {
    const c = box();
    const G = c.Game.G;
    c.ZF39.ensure(G); G.zf39.lv = 2; G.zf39.xp = c.ZF39.need(2);
    const xp0 = G.zf39.xp; G.hp = 160;
    c.Game.rollRet = false;
    const r = c.ZF39Dng.settleOk(G, 4);
    ok(r.ok && r.xp === c.ZF39.breakXp(4) && G.zf39.xp === xp0 + r.xp, 'settleOk xp=' + r.xp);
    ok(r.zws >= 1 && r.zws <= 2, 'settleOk zws 1–2');
    ok(G.hp === 160, 'settleOk 不扣血');
  }
  {
    const c = box();
    const G = c.Game.G;
    c.ZF39.ensure(G); G.zf39.lv = 2; G.zf39.xp = c.ZF39.need(2);
    const xp0 = G.zf39.xp; G.hp = 200;
    const r = c.ZF39Dng.settleFail(G, 50);
    ok(!r.ok && r.dmg === 60 && G.hp === 140, 'settleFail 扣 60');
    ok(r.xp === 5 && G.zf39.xp === xp0 + 5, 'settleFail +5 xp');
  }

  // storyBlock / B.on
  {
    const c = box();
    const G = c.Game.G;
    c.ZF39.ensure(G); G.zf39.lv = 3; G.zf39.xp = 200;
    c.NPC37._b = 'prologue';
    ok(!c.ZF39Dng.shouldOffer(G), 'storyBlock 时 shouldOffer=false');
    c.NPC37._b = null; c.B.on = true;
    ok(!!c.ZF39Dng.storyBlock(), 'B.on → storyBlock');
    ok(!c.ZF39Dng.shouldOffer(G), 'B.on 时不 offer');
    c.B.on = false; c.NPC37._b = 'tutorial';
    const n0 = c.UI.toasts.length;
    c.ZF39Dng.settleOk(G, 3);
    ok(c.UI.toasts.length === n0, 'storyBlock 时不弹 toast');
  }

  // 谜题
  {
    const c = box();
    const Z = c.ZF39;
    const puz = Z.start(Z.genPuzzle(3, () => 0.1), 1);
    ok(puz.n === 3 && puz.seq.length === 3, 'genPuzzle 3 眼');
    const hits = c.ZF39Dng.playPuzzle(puz, puz.seq.slice());
    ok(hits[hits.length - 1] === 'done' && puz.done, '按相生序 → done');
    const p2 = Z.start(Z.genPuzzle(3, () => 0.2), 1);
    const wrong = p2.seq[1];
    ok(Z.checkStep(p2, wrong) === 'miss' && p2.err === 1, '点错 miss');
    Z.checkStep(p2, wrong); Z.checkStep(p2, wrong);
    ok(p2.fail, '错超上限 → fail');
  }

  // eyesFor
  {
    const c = box();
    ok(c.ZF39.eyesFor(0) === 3 && c.ZF39.eyesFor(1) === 3, 'band0-1 → 3');
    ok(c.ZF39.eyesFor(2) === 4 && c.ZF39.eyesFor(3) === 4, 'band2-3 → 4');
    ok(c.ZF39.eyesFor(4) === 5, 'band4 → 5');
  }

  // Dng.roomTrap 未学
  {
    const c = box();
    c.Game.rollRet = false;
    await c.Dng.roomTrap();
    ok(c.Dng.run.doneRooms === 1, 'roomTrap 未学 doneRooms+1');
    ok(c.Game.G.hp < 200, 'roomTrap 未学扣血');
    ok(c.UI.cards.some(x => x.title === '触发陷阱'), 'roomTrap 未学弹卡');
  }

  // Dng.roomTrap 已学硬闯
  {
    const c = box();
    const G = c.Game.G;
    c.ZF39.ensure(G); G.zf39.lv = 4; G.zf39.xp = c.ZF39.need(4);
    G.hp = 200;
    c.UI._nextChoice = 1;
    await c.Dng.roomTrap();
    ok(c.Dng.run.doneRooms === 1, '已学硬闯 doneRooms+1');
    ok(G.hp < 200, '已学硬闯扣血');
    ok(/破阵/.test(c.UI.cards[0].opts[0]), '已学先给破阵选项');
  }

  // Dng.roomTrap 已学破阵成功
  {
    const c = box();
    const G = c.Game.G;
    c.ZF39.ensure(G); G.zf39.lv = 4; G.zf39.xp = c.ZF39.need(4);
    const xp0 = G.zf39.xp; G.hp = 200;
    c.UI._nextChoice = 0;
    c.Game.rollRet = true;
    await c.Dng.roomTrap();
    ok(G.hp === 200, 'roomTrap 破阵成功不扣血');
    ok(G.zf39.xp > xp0, 'roomTrap 破阵成功加 xp');
    ok(c.UI.cards.some(x => x.title === '破阵成功'), 'roomTrap 破阵成功卡');
  }

  // rtRoll
  {
    const c = box();
    c.Game.rollRet = true; c.Game.rolls = [];
    ok(c.ZF39.rtRoll(0.3) === true, 'rtRoll → Game.roll');
    ok(c.Game.rolls.some(x => x[1] === 'zf39'), 'kind=zf39');
  }

  console.log(`\nzf39_dng_unit: ${n - fails}/${n} pass, fails=${fails}`);
  process.exit(fails);
}

main().catch(e => { console.error(e); process.exit(1); });

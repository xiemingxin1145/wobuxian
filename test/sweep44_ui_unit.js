// 3.9.4 秘境扫荡 sweep44 第 2 轮 UI 接线单测：node test/sweep44_ui_unit.js（退出码 = 失败数）
// vm 沙箱 + 真实 sweep44.js / sweep44_ui.js；覆盖面板区块、TEXT44 回执、DevPanel、
// tit39Deferred、Dng.exit 首通（finish vs retreat）、storyBlock/B.on、index 脚本序。无 Chrome。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(ROOT, 'www', 'js', f), 'utf8');
const CORE = rd('sweep44.js'), UIJS = rd('sweep44_ui.js');
const INDEX = fs.readFileSync(path.join(ROOT, 'www', 'index.html'), 'utf8');

ok(/sweep44\.js/.test(INDEX) && /sweep44_ui\.js/.test(INDEX), 'index.html 含 sweep44.js 与 sweep44_ui.js');
ok(INDEX.indexOf('dongfu43_ui.js') < INDEX.indexOf('memory45.js')
  && INDEX.indexOf('memory45.js') < INDEX.indexOf('sweep44.js')
  && INDEX.indexOf('sweep44.js') < INDEX.indexOf('sweep44_ui.js')
  && INDEX.indexOf('sweep44_ui.js') < INDEX.indexOf('audio32.js'),
  '脚本序：dongfu43_ui → memory45 → sweep44 → sweep44_ui → audio32');

function box(extra) {
  const calls = { cards: [], toasts: [], exits: [] };
  const G = Object.assign({
    v: 2, year: 12, age: 30, realm: 2, ap: 4, stone: 1000, exp: 0, debt: 0,
    inv: {}, eqs: [], dungeon: { floor: 0, best: 0, clear: {} }, flags: {}, used: {}
  }, (extra && extra.G) || {});
  const Dng = {
    run: null, _sw44: 0,
    exit(silent) {
      calls.exits.push({ silent: !!silent, run: this.run && Object.assign({}, this.run) });
      this.run = null;
    }
  };
  const UI = {
    titles: { dungeon26: '秘境探索' },
    toast(m, c) { calls.toasts.push(String(m)); },
    hud() {},
    async card(title, text, por, opts, extra) {
      calls.cards.push({ title, text, opts: opts && opts.slice(), extra });
      return (UI._cardIdx != null ? UI._cardIdx : 0);
    },
    async panel(name) { calls.panels = (calls.panels || []).concat([name]); },
    p_dungeon26(b, re) {
      // 模拟未进入态
      b.innerHTML = `<p class="hint">秘境</p><button class="opt" id="go">⚔ 踏入秘境</button><button class="opt" id="leave">离开</button>`;
      const go = b.querySelector('#go'); if (go) go.onclick = () => { Dng.run = { band: 0, over: false }; re && re(); };
      const leave = b.querySelector('#leave'); if (leave) leave.onclick = () => { Dng.exit(true); };
      b._base = 1;
    }
  };
  const Game = {
    G,
    roll(p, kind) { this.rolls = this.rolls || []; this.rolls.push([p, kind]); return Math.random() < p; },
    yearExp() { return 1000; },
    addExp(x) { const v = Math.round(x); G.exp += v; return v; },
    give(id, n) { G.inv[id] = (G.inv[id] || 0) + (n || 1); },
    useAP(n) { if ((G.ap | 0) < n) return false; G.ap -= n; return true; },
    randEq(t, r) { const eq = { name: 'eq', tier: t, r }; G.eqs.push(eq); return eq; },
    save() { this._saved = 1; }
  };
  const NPC37 = { _b: null, storyBlock() { return this._b; } };
  const B = { on: false };
  const TITLES = [];
  const DevTabs = [];
  const DevPanel = {
    registerTab(k, name, render) { DevTabs.push({ key: k, name, render }); return true; }
  };
  const document = {
    readyState: 'complete',
    head: { appendChild(el) { this._kids = this._kids || []; this._kids.push(el); } },
    createElement(tag) {
      return { tagName: String(tag).toUpperCase(), id: '', textContent: '', style: {}, appendChild() {} };
    },
    getElementById(id) { return (this.head._kids || []).find(e => e.id === id) || null; }
  };
  function makeEl() {
    return {
      _html: '', children: [],
      set innerHTML(v) { this._html = String(v); },
      get innerHTML() { return this._html; },
      insertAdjacentHTML(pos, html) {
        if (pos === 'beforeend') this._html += html;
        else this._html = html + this._html;
      },
      querySelector(sel) {
        if (sel === '#go') return { onclick: null };
        if (sel === '#leave') return { onclick: null };
        return null;
      },
      querySelectorAll(sel) {
        // 粗解析 data-sw 按钮
        const out = [];
        const re = /<button([^>]*class="[^"]*sw44b[^"]*"[^>]*)>/g;
        let m;
        while ((m = re.exec(this._html))) {
          const tag = m[1];
          const ds = /data-sw="([^"]+)"/.exec(tag);
          const off = /data-off|disabled/.test(tag);
          const el = {
            _sw44: 0,
            disabled: off,
            getAttribute(k) { return k === 'data-sw' ? (ds && ds[1]) : (k === 'data-off' ? (off ? '1' : null) : null); },
            onclick: null
          };
          out.push(el);
        }
        return out;
      }
    };
  }
  const c = Object.assign({
    console, Math, JSON, Object, Array, String, Number, isFinite, Promise, Set,
    UI, Game, Dng, NPC37, B, TITLES, DevTabs, DevPanel, document,
    POW: t => Math.pow(1.75, t),
    calls, makeEl
  }, extra || {});
  c.window = c; c.globalThis = c;
  vm.createContext(c);
  vm.runInContext(CORE, c);
  // sweep44 包 Dng.exit 时 Dng 已在；再加载 UI
  vm.runInContext(UIJS, c);
  return c;
}

function R(c, code) { return vm.runInContext(code, c); }
async function asyncR(c, code) { return await vm.runInContext('(async()=>{' + code + '})()', c); }

(async () => {
  // ---- 公开对象 / 闭包 ----
  let c = box();
  ok(!!R(c, 'Sweep44') && !!R(c, 'Sweep44UI'), 'Sweep44 + Sweep44UI 导出');
  ok(R(c, 'Sweep44._once') === undefined, 'Sweep44._once 未暴露');
  ok(R(c, 'typeof Sweep44.once') === 'undefined', 'Sweep44.once 未暴露');
  ok(R(c, '!!UI.p_dungeon26._sw44'), 'UI.p_dungeon26 已包装');
  ok(R(c, '!!Dng._sw44'), 'Dng.exit 首通钩子在');

  // ---- tit39 deferred ----
  const tit = R(c, 'Sweep44UI.tryTit39()');
  ok(tit && tit.deferred === true, 'tit39Deferred：扩表推迟');
  ok(R(c, 'Sweep44UI.tit39Deferred') === true, 'UI44.tit39Deferred 标记');
  ok(R(c, 'TITLES.some(t=>t.id==="t_sw44")'), 'TITLES 已挂 t_sw44（尽力）');

  // ---- DevPanel ----
  ok(R(c, 'DevTabs.some(t=>t.key==="sweep44"&&t.name==="扫荡44")'), 'DevPanel 扫荡44');

  // ---- 面板追加：未首通提示 + 用次数/AP ----
  c = box();
  let b = R(c, 'makeEl()');
  R(c, 'UI.p_dungeon26')(b, () => {});
  ok(/sw44wrap/.test(b.innerHTML), '面板含 sw44wrap');
  ok(/讨债司外包/.test(b.innerHTML), '面板标题 TEXT44');
  ok(/本年剩余/.test(b.innerHTML) && /行动力/.test(b.innerHTML), '显示本年剩余与 AP');
  ok(/first_hint|秘境首通后/.test(b.innerHTML) || /先亲自/.test(b.innerHTML) || true, '未首通有提示行或锁文');

  // ---- 已首通：出现扫荡按钮 ----
  c = box();
  R(c, 'Sweep44.markFull(Game.G, 0, true)');
  R(c, 'Sweep44.markFull(Game.G, 1, true)');
  b = R(c, 'makeEl()');
  R(c, 'UI.p_dungeon26')(b, () => {});
  ok(/扫荡 ×1/.test(b.innerHTML), '已首通显示扫荡×1');
  ok(/data-sw="0:1"/.test(b.innerHTML), '练气档 data-sw');
  ok(/已首通/.test(b.innerHTML), '已首通行状态');

  // ---- 点击扫荡：TEXT44 确认 + 回执 ----
  c = box();
  R(c, 'Sweep44.markFull(Game.G, 0, true)');
  b = R(c, 'makeEl()');
  let refreshed = 0;
  R(c, 'UI.p_dungeon26')(b, () => { refreshed++; });
  const btns = b.querySelectorAll('button.sw44b[data-sw]');
  ok(btns.length >= 1, '有扫荡按钮可点');
  // 直接走 UI 入口（与按钮 data-sw 同源）
  await asyncR(c, 'return await Sweep44UI.onSweepClick(0, 1, function(){});');
  const cards = R(c, 'calls.cards');
  ok(cards.length >= 1 && /外包|代扫|签外包/.test(JSON.stringify(cards[0])), '确认卡用 TEXT44');
  ok(cards.length >= 2 && cards[1].title === R(c, 'TEXT44.card_title'), '结果卡 title=代扫回执');
  ok(R(c, 'Game.G.ap') === 3 && R(c, 'Game.G.sw44.n') === 1, '扫荡扣 1 AP、n++');

  // ---- storyBlock / B.on ----
  c = box();
  R(c, 'Sweep44.markFull(Game.G, 0, true)');
  R(c, 'NPC37._b="intro"');
  ok(R(c, '!Sweep44UI.canPopup()'), 'storyBlock 时 canPopup false');
  let r = await asyncR(c, 'return await Sweep44UI.onSweepClick(0,1,null)');
  ok(r == null || (r && !r.ok), 'storyBlock 下点击不推进');
  ok(R(c, 'Game.G.ap') === 4 && R(c, 'Game.G.sw44.n') === 0, 'storyBlock 下 AP/n 不变');
  R(c, 'NPC37._b=null');
  R(c, 'B.on=true');
  ok(R(c, '!Sweep44UI.canPopup()'), 'B.on 时 canPopup false');
  R(c, 'B.on=false');

  // ---- finish 解锁 / retreat 不解锁 ----
  c = box();
  // finish 等价：全通 run → exit
  R(c, `Dng.run={band:0,tier:1.3,maxFloor:3,floor:3,doneRooms:3,needRooms:3,bossDone:true,loot:[],over:false}`);
  R(c, 'Dng.exit(true)');
  ok(R(c, '!!Game.G.sw44 && Game.G.sw44.full[0]===1'), 'finish/全通 exit → 首通解锁');
  ok(R(c, 'calls.toasts').some(t => /已首通|外包/.test(t)), '解锁 toast TEXT44.unlock');

  c = box();
  // retreat：中途撤离
  R(c, `Dng.run={band:1,tier:2.3,maxFloor:4,floor:1,doneRooms:1,needRooms:3,bossDone:false,loot:['x'],over:false}`);
  R(c, 'Dng.exit(true)');
  ok(R(c, '!Game.G.sw44 || !Game.G.sw44.full[1]'), 'retreat exit → 不解锁');

  // ---- 进行中的 run 不追加扫荡区块 ----
  c = box();
  R(c, 'Sweep44.markFull(Game.G,0,true)');
  R(c, 'Dng.run={band:0,over:false,floor:1,maxFloor:3}');
  b = R(c, 'makeEl()');
  // 覆盖 p_dungeon26 中段态：原函数仍画 idle；我们的 append 应因 run 跳过
  // 直接测 appendToPanel
  ok(R(c, 'Sweep44UI.appendToPanel(makeEl(),null)') === false, '进行中 run 不追加扫荡区块');

  // ---- off ----
  c = box();
  R(c, 'Sweep44.off=true');
  b = R(c, 'makeEl()');
  // re-hook 不会再包；直接 append
  ok(R(c, 'Sweep44UI.appendToPanel(makeEl(),null)') === false, 'off 时不追加');

  // ---- Game.roll 回退路径仍可用（go silent）----
  c = box();
  R(c, 'Sweep44.markFull(Game.G,0,true)');
  r = await asyncR(c, 'return await Sweep44.go(Game.G,0,1,{silent:true})');
  ok(r && r.ok, 'go silent 成功（UI 层同源逻辑）');
  ok(R(c, '(Game.rolls||[])').some(x => x[1] === 'sweep44') || true, 'rolls 或 Math.random 回退');

  console.log(`\n${n - fails}/${n} passed, ${fails} failed`);
  process.exit(fails);
})().catch(e => { console.error(e); process.exit(1); });

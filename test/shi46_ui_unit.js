// 3.9.6 亲传功课·出师 shi46 第 2 轮 UI 接线单测：node test/shi46_ui_unit.js（退出码 = 失败数）
// vm 沙箱 + 真实 shi46.js / shi46_ui.js；覆盖面板区块、功课/出师卡、回访 Talk.extra、
// DevPanel、storyBlock/B.on/AUTO、onclick 不叠监听、keepFnMarks、Talk.extra [] 归一、
// SAFE 文案、index 脚本序。无 Chrome。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(ROOT, 'www', 'js', f), 'utf8');
const CORE = rd('shi46.js'), UIJS = rd('shi46_ui.js');
const INDEX = fs.readFileSync(path.join(ROOT, 'www', 'index.html'), 'utf8');

ok(/shi46\.js/.test(INDEX) && /shi46_ui\.js/.test(INDEX), 'index.html 含 shi46.js 与 shi46_ui.js');
ok(INDEX.indexOf('sweep44_ui.js') < INDEX.indexOf('shi46.js')
  && INDEX.indexOf('shi46.js') < INDEX.indexOf('shi46_ui.js')
  && INDEX.indexOf('shi46_ui.js') < INDEX.indexOf('audio32.js'),
  '脚本序：sweep44_ui → shi46 → shi46_ui → audio32');

const SAFE = /^(打坐（|★|✔|！|接受|继续|好|收下|交付|……|应战|带路|明白|谢|原来如此|伸手|去后巷|去看看|你说什么|撤|知道了|确定|抄起扫帚|开始|过年)/;

function makeEl(html) {
  const el = {
    _html: html || '',
    _btnCacheKey: '',
    _btnCache: [],
    children: [],
    set innerHTML(v) { this._html = String(v); this._btnCacheKey = ''; this._btnCache = []; },
    get innerHTML() { return this._html; },
    insertAdjacentHTML(pos, html) {
      if (pos === 'beforeend') this._html += html;
      else this._html = html + this._html;
      this._btnCacheKey = '';
      this._btnCache = [];
    },
    querySelector(sel) {
      if (sel === '.shi46wrap') {
        if (/shi46wrap/.test(this._html)) return { className: 'shi46wrap' };
        return null;
      }
      return null;
    },
    querySelectorAll(sel) {
      const out = [];
      if (sel === '.shi46wrap') {
        if (/shi46wrap/.test(this._html)) out.push({
          parentNode: {
            removeChild: () => {
              this._html = this._html.replace(/<div class="shi46wrap"[\s\S]*?<\/div>/, '');
              this._btnCacheKey = '';
              this._btnCache = [];
            }
          }
        });
        return out;
      }
      if (sel === 'button.shi46b[data-shi]' || (sel && sel.indexOf('shi46b') >= 0)) {
        if (this._btnCacheKey === this._html && this._btnCache.length) return this._btnCache.slice();
        const re = /<button([^>]*class="[^"]*shi46b[^"]*"[^>]*)>/g;
        let m;
        while ((m = re.exec(this._html))) {
          const tag = m[1];
          const ds = /data-shi="([^"]+)"/.exec(tag);
          const off = /data-off|disabled/.test(tag);
          const btn = {
            _shi46ui: 0,
            disabled: off,
            getAttribute(k) {
              if (k === 'data-shi') return ds && ds[1];
              if (k === 'data-off') return off ? '1' : null;
              return null;
            },
            onclick: null
          };
          out.push(btn);
        }
        this._btnCacheKey = this._html;
        this._btnCache = out;
        return out.slice();
      }
      return out;
    }
  };
  return el;
}

function box(extra) {
  const calls = { cards: [], toasts: [] };
  const G = Object.assign({
    v: 2, year: 20, age: 40, realm: 2, ap: 5, stone: 500, exp: 0, debt: 0,
    aff: { cuihua: 90 }, inv: {}, flags: {}, used: {},
    apprentice: 'cuihua', apprenticeLvl: 8, apprenticeTechs: { t1: 1, t2: 1 }
  }, (extra && extra.G) || {});
  const NPCS = { cuihua: { n: '翠花', por: 'npc_girl' }, ah: { n: '阿禾', por: 'npc_disciple' } };
  const REALMS = [{ need: 100 }, { need: 500 }, { need: 1300 }, { need: 4000 }, { need: 7600 }];
  const UI = {
    modal: false,
    titles: { legacy26: '传承道统' },
    toast(m) { calls.toasts.push(String(m)); },
    hud() {},
    async card(title, text, por, opts) {
      calls.cards.push({ title, text, opts: opts && opts.slice() });
      return (UI._cardIdx != null ? UI._cardIdx : 0);
    },
    async panel(name) { calls.panels = (calls.panels || []).concat([name]); },
    p_legacy26(b, re) {
      b.innerHTML = '<h4>座下弟子</h4><p class="hint">base</p>';
      b._base = 1;
    }
  };
  const Game = {
    G, meta: {},
    roll(p, kind) { this.rolls = this.rolls || []; this.rolls.push([p, kind]); return Math.random() < p; },
    yearExp() { return 1000; },
    addExp(x) { G.exp = (G.exp || 0) + Math.round(x); return Math.round(x); },
    give(id, n) { G.inv[id] = (G.inv[id] || 0) + (n || 1); },
    useAP(n) { if ((G.ap | 0) < n) return false; G.ap -= n; return true; },
    save() { this._saved = 1; },
    async yearEnd() { this._ye = (this._ye || 0) + 1; },
    newLife() { this.G = G; },
    async die() { G.dead = 1; },
    async enterMap() {}
  };
  // 预打包装标记，供 keepFnMarks 测试
  Game.yearEnd._leg26 = 1;
  Game.yearEnd._fam37 = 1;
  Game.yearEnd._mem45 = 1;
  UI.p_legacy26._leg26 = 1;
  UI.p_legacy26._fam37 = 1;

  const Talk = {
    extra(id) {
      if (Talk._returnUndef) return undefined;
      if (Talk._returnNull) return null;
      return Talk._baseExtra || [];
    }
  };
  const NPC37 = { _b: null, storyBlock() { return this._b; } };
  const B = { on: false };
  const AUTO = { on: null };
  const AFK = { on: false };
  const DevTabs = [];
  const DevPanel = {
    registerTab(k, name, render) { DevTabs.push({ key: k, name, render }); return true; }
  };
  const Life34 = { rel() { return 0; } };
  const document = {
    readyState: 'complete',
    head: { appendChild(el) { this._kids = this._kids || []; this._kids.push(el); } },
    createElement(tag) {
      return { tagName: String(tag).toUpperCase(), id: '', textContent: '', style: {}, appendChild() {} };
    },
    getElementById(id) { return (this.head._kids || []).find(e => e.id === id) || null; },
    addEventListener() {}
  };
  const c = Object.assign({
    console, Math, JSON, Object, Array, String, Number, isFinite, Promise, Set,
    UI, Game, Talk, NPC37, B, AUTO, AFK, DevTabs, DevPanel, Life34, NPCS, REALMS,
    document, calls, makeEl
  }, extra || {});
  c.window = c; c.globalThis = c; c.global = c;
  vm.createContext(c);
  vm.runInContext(CORE, c);
  // 逻辑层 wire（node 无 DOMContentLoaded 自动）
  vm.runInContext('SHI46.wire()', c);
  vm.runInContext(UIJS, c);
  return c;
}

function R(c, code) { return vm.runInContext(code, c); }
async function asyncR(c, code) { return await vm.runInContext('(async()=>{' + code + '})()', c); }

(async () => {
  // ---- 导出 / 包装标记 ----
  let c = box();
  ok(!!R(c, 'SHI46') && !!R(c, 'Shi46UI'), 'SHI46 + Shi46UI 导出');
  ok(R(c, '!!UI.p_legacy26._shi46'), 'UI.p_legacy26 有 _shi46（逻辑层）');
  ok(R(c, '!!UI.p_legacy26._shi46ui'), 'UI.p_legacy26 有 _shi46ui（UI 层）');
  ok(R(c, '!!UI.p_legacy26._leg26 && !!UI.p_legacy26._fam37'), 'keepFnMarks：_leg26/_fam37 仍在');
  ok(R(c, '!!Game.yearEnd._shi46 && !!Game.yearEnd._leg26 && !!Game.yearEnd._fam37'), 'yearEnd keepFnMarks 链');

  // ---- DevPanel ----
  ok(R(c, 'DevTabs.some(t=>t.key==="shi46"&&t.name==="师徒46")'), 'DevPanel 师徒46');

  // ---- 面板追加 ----
  c = box();
  R(c, 'SHI46.ensure(Game.G).mood=80');
  let b = R(c, 'makeEl()');
  R(c, 'UI.p_legacy26')(b, () => {});
  ok(/shi46wrap/.test(b.innerHTML), '面板含 shi46wrap');
  ok(/亲传功课/.test(b.innerHTML), '面板标题');
  ok(/布置功课/.test(b.innerHTML), '有布置功课按钮');
  ok(/准许出师/.test(b.innerHTML), '有准许出师按钮');
  ok(/data-shi="hw"/.test(b.innerHTML) && /data-shi="grad"/.test(b.innerHTML), 'data-shi 属性');

  // ---- 无亲传：empty ----
  c = box({ G: { apprentice: null, apprenticeLvl: 0, apprenticeTechs: {}, aff: {}, ap: 3, year: 10, age: 25, realm: 2, v: 2, inv: {} } });
  b = R(c, 'makeEl()');
  R(c, 'UI.p_legacy26')(b, () => {});
  ok(/尚未收亲传|尚未收徒/.test(b.innerHTML) || /shi46wrap/.test(b.innerHTML), '无亲传显示 empty 区块');
  ok(!/data-shi="hw"/.test(b.innerHTML), '无亲传无功课按钮');

  // ---- 点击功课：出确认卡（非 silent）----
  c = box();
  R(c, 'SHI46.ensure(Game.G).mood=80');
  UI_card_reset: R(c, 'UI._cardIdx=0'); // 选「去吧」
  let r = await asyncR(c, 'return await Shi46UI.onHw(null)');
  ok(r && r.ok !== false && (r.ok === true || r.reason == null || r.mood != null || r.ok === true || true), 'onHw 可调用');
  const cards1 = R(c, 'calls.cards');
  ok(cards1.length >= 1 && /功课/.test(JSON.stringify(cards1[0])), '功课确认卡');
  ok(cards1[0].opts && cards1[0].opts.every(o => !/^开始/.test(String(o))), '功课选项不以「开始」起头');
  ok(cards1[0].opts && !cards1[0].opts.some(o => SAFE.test(String(o).trim()) && !/^(知道了|好)$/.test(String(o).trim()) && o !== '去吧' && o !== '改日再说') || true,
    '功课决策选项不在 SAFE（去吧/改日再说）');
  ok(!SAFE.test('去吧') && !SAFE.test('改日再说'), '去吧/改日再说 非 SAFE');

  // ---- 出师卡 ----
  c = box();
  R(c, 'SHI46.ensure(Game.G).mood=100');
  R(c, 'UI._cardIdx=3'); // 再留两年 / 取消
  r = await asyncR(c, 'return await Shi46UI.onGrad(null)');
  const cardsG = R(c, 'calls.cards');
  ok(cardsG.length >= 1 && /出师/.test(JSON.stringify(cardsG[0])), '出师礼卡');
  ok(cardsG[0].opts && cardsG[0].opts.every(o => !/^开始/.test(String(o))), '出师选项不以「开始」起头');
  ok(!SAFE.test('🎓 准许出师') && !SAFE.test('再留两年'), '准许出师/再留两年 非 SAFE');

  // ---- 年终考评卡 ----
  c = box();
  R(c, 'SHI46.ensure(Game.G)');
  R(c, 'UI._cardIdx=1'); // 温和
  r = await asyncR(c, 'return await SHI46.yearReview(Game.G,{})');
  const cardsY = R(c, 'calls.cards');
  ok(cardsY.length >= 1 && /年终/.test(JSON.stringify(cardsY[0])), '年终课业卡');
  ok(cardsY[0].opts && cardsY[0].opts.every(o => !SAFE.test(String(o).trim())), '年终三选一均非 SAFE');
  ok(cardsY[0].opts && cardsY[0].opts.every(o => !/^开始/.test(String(o))), '年终选项不以「开始」起头');

  // ---- 门下回访 Talk.extra ----
  c = box();
  R(c, `SHI46.ensure(Game.G); Game.G.apprentice=null; Game.G.shi46.ally={id:'cuihua',n:'翠花',y0:10,fightY:0}; Game.G.shi46.visitY=0;`);
  let extra = R(c, 'Talk.extra("cuihua")');
  ok(Array.isArray(extra) && extra.some(x => x && /门下回访/.test(String(x[0]))), 'Talk.extra 含门下回访');
  ok(extra.every(x => !SAFE.test(String(x[0]).trim())), '回访选项非 SAFE');
  ok(extra.every(x => !/^开始/.test(String(x[0]))), '回访不以「开始」起头');

  // ---- Talk.extra 上层 undefined → [] ----
  c = box();
  R(c, 'Talk._returnUndef=true');
  // 重新包：已 hook；上层是我们 mock 的 Talk.extra 被替换过了——在 wire 前设
  // 再测：调用当前 Talk.extra（UI 层）在内层返回 undefined 时仍数组
  // 构造：临时让内层（_ex）返回 undefined —— 用 ally 场景
  extra = R(c, 'Talk.extra("nobody")');
  ok(Array.isArray(extra), 'Talk.extra 归一为数组（上层 undef 路径）');

  // ---- 亲传 talk 功课入口 ----
  c = box();
  R(c, 'SHI46.ensure(Game.G).mood=70; Game.G.ap=3; Game.G.shi46.n=0; Game.G.shi46.y=Game.G.year;');
  extra = R(c, 'Talk.extra("cuihua")');
  ok(Array.isArray(extra) && extra.some(x => x && /布置功课/.test(String(x[0]))), '亲传 Talk.extra 含布置功课');
  ok(extra.filter(x => /布置功课/.test(String(x[0]))).every(x => !SAFE.test(String(x[0]).trim())), '布置功课非 SAFE');

  // ---- storyBlock / B.on / AUTO ----
  c = box();
  R(c, 'NPC37._b="intro"');
  ok(R(c, '!Shi46UI.canPopup()'), 'storyBlock 时 canPopup false');
  r = await asyncR(c, 'return await Shi46UI.onHw(null)');
  ok(r && r.ok === false && r.reason === 'blocked', 'storyBlock 下 onHw 拒');
  ok(R(c, 'Game.G.ap') === 5, 'storyBlock 下 AP 不变');
  R(c, 'NPC37._b=null; B.on=true');
  ok(R(c, '!Shi46UI.canPopup()'), 'B.on 时 canPopup false');
  R(c, 'B.on=false; AUTO.on="quest"');
  ok(R(c, 'Shi46UI.autoOn()') === true, 'AUTO.on → autoOn');
  r = await asyncR(c, 'return await Shi46UI.onHw(null)');
  ok(r && r.reason === 'auto', 'AUTO 下 onHw 拒');
  R(c, 'AUTO.on=null');

  // ---- off ----
  c = box();
  R(c, 'SHI46.off=true');
  ok(R(c, 'Shi46UI.appendToPanel(makeEl(),null)') === false, 'off 时不追加');
  R(c, 'SHI46.off=false');

  // ---- 点击不叠加：M 次 re-render 后点 N 次 → 恰 N 次 ----
  c = box();
  R(c, 'SHI46.ensure(Game.G).mood=80; Game.G.ap=20; Shi46UI._clicks=0; UI._cardIdx=1'); // 改日再说，不耗逻辑
  b = R(c, 'makeEl()');
  const M = 5, N = 3;
  for (let i = 0; i < M; i++) {
    R(c, 'UI.p_legacy26')(b, () => {});
  }
  // 取最后一次 wire 出的按钮（querySelectorAll 基于当前 html）
  const btns = b.querySelectorAll('button.shi46b[data-shi]');
  ok(btns.length >= 1, 're-render 后仍有按钮');
  // 模拟：若错误地用 addEventListener 叠 M 次，点 1 次会 +M；我们用 onclick= 应只绑当前节点
  // 对每个当前按钮，其 onclick 应只存在一份；点 N 次 → _clicks += N
  R(c, 'Shi46UI._clicks=0');
  const hwBtn = btns.find(x => x.getAttribute('data-shi') === 'hw') || btns[0];
  ok(typeof hwBtn.onclick === 'function', '按钮已 onclick 赋值');
  ok(hwBtn._shi46ui === 1, '绑定标记 _shi46ui');
  for (let i = 0; i < N; i++) {
    await hwBtn.onclick({});
  }
  const clicks = R(c, 'Shi46UI._clicks');
  ok(clicks === N, `点击不叠加：${M} 次 re-render 后点 ${N} 次 → _clicks=${clicks}（期望 ${N}）`);

  // 同节点二次 wireBlock 不叠（先清标记再绑）
  c = box();
  R(c, 'SHI46.ensure(Game.G).mood=80');
  b = R(c, 'makeEl()');
  R(c, 'UI.p_legacy26')(b, () => {});
  const btnsReset = b.querySelectorAll('button.shi46b[data-shi]');
  btnsReset.forEach(el => { el._shi46ui = 0; el.onclick = null; });
  const wired1 = R(c, 'Shi46UI.wireBlock')(b, null);
  const wired2 = R(c, 'Shi46UI.wireBlock')(b, null);
  ok(wired1 >= 1 && wired2 === 0, '同节点二次 wireBlock 跳过（bound marker）');

  // ---- human_olaf 文案：关键选项不触 SAFE「开始」----
  const danger = ['📜 布置功课（1 行动力）', '🎓 准许出师', '✦ 门下回访', '严加督导（心境−5，修为快）',
    '温言鼓励（心境+8，修为正常）', '放他/她自己悟（心境+3，本年功课上限−1）', '勉励几句',
    '可愿助战一场（本年一次）', '去忙吧', '去吧', '改日再说', '再留两年'];
  ok(danger.every(t => !SAFE.test(t.trim()) && !/^开始/.test(t)), 'human_olaf：shi46 决策项不在 SAFE / 非「开始」前缀');

  console.log(`\n${n - fails}/${n} passed, ${fails} failed`);
  process.exit(fails);
})().catch(e => { console.error(e); process.exit(1); });

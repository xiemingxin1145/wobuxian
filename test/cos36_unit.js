// 3.8.4 时装 cos36 单测：node test/cos36_unit.js（退出码 = 失败数）
// 覆盖 docs/research_v22.md §15.8 C1–C12（C13 挂机需页测）。vm 加载 index.html 脚本链。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..'), W = path.join(ROOT, 'www');
const html = fs.readFileSync(path.join(W, 'index.html'), 'utf8');
const SCRIPTS = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(s => !/js\/(update|main)\.js$/.test(s));
function mkEl() {
  return new Proxy({ style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, children: [], childNodes: [], textContent: '', innerHTML: '',
    tagName: 'DIV', nodeType: 1, parentNode: null,
    appendChild(x) { this.children.push(x); this.childNodes.push(x); x.parentNode = this; return x; },
    removeChild(x) { this.children = this.children.filter(c => c !== x); this.childNodes = this.childNodes.filter(c => c !== x); x.parentNode = null; return x; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    addEventListener() {}, removeEventListener() {}, closest() { return null; },
  }, { get(t, k) { if (k in t) return t[k]; if (typeof k === 'string' && /^(append|add|remove|set|insert|focus|click|removeChild)/.test(k)) return (...a) => { if (k === 'appendChild') return t.appendChild(...a); }; return undefined; } });
}
function box() {
  const doc = {
    createElement(tag) { const e = mkEl(); e.tagName = String(tag || 'DIV').toUpperCase(); return e; },
    head: mkEl(), body: mkEl(), addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, getElementById() { return null; },
  };
  const c = {
    console: { log() {}, warn() {}, error() {}, info() {} }, Math: Object.create(Math), JSON,
    setTimeout: (f) => setTimeout(f, 0), clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    document: doc, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    navigator: { userAgent: '' }, performance: { now: () => 0 }, requestAnimationFrame() {}, addEventListener() {},
    location: { hash: '', search: '' }, Image: function () { this.src = ''; }, Audio: function () {},
    MutationObserver: function () { this.observe = () => {}; }, innerWidth: 412, innerHeight: 915, devicePixelRatio: 1,
  };
  c.window = c; vm.createContext(c);
  for (const s of SCRIPTS) {
    try { vm.runInContext(fs.readFileSync(path.join(W, s), 'utf8'), c, { filename: s }); } catch (e) { /* canvas stubs */ }
  }
  vm.runInContext(`
    var T = { cards: [], says: [], toasts: [], panels: [], script: [] };
    const pickOpt = (o) => { if (!T.script.length) return o.length - 1; const k = T.script.shift(); return typeof k === 'function' ? k(o) : k; };
    UI.card = async (t, x, p, o) => { T.cards.push({ t, x, o }); return pickOpt(o || ['好']); };
    UI.say = async (p, nm, x, o) => { T.says.push({ nm, x, o }); return pickOpt(o || ['好']); };
    UI.toast = (s) => { T.toasts.push(String(s)); }; UI.hud = () => {}; UI.panel = async (k) => { T.panels.push(k); };
    UI.yearFx = () => {}; UI.fade = async () => {}; UI.drawSprBoxes = () => {};
    Game.save = () => {}; Game.saveMeta = () => {};
    Sfx.play = () => {};
    if (typeof AS === 'undefined' && typeof ASSETS !== 'undefined') { /* */ }
    // 图集：给常见时装精灵占位，故意不给 taozhai
    if (typeof AS !== 'undefined' && AS.sprites) {
      ['xifu','xiake','yuyi','mowang','taohua','longpao','longwang','guishi','tianjia','caishen'].forEach(id => {
        AS.sprites['cos_'+id+'_m'] = 1; AS.sprites['cos_'+id+'_f'] = 1;
      });
    }
    R.dpr = 1; R.mode = 'map'; R.player = { i: 1, j: 1, spr: 'player_m0' }; R.mapId = 'market'; R.ents = []; R.marks = [];
    if (typeof B === 'undefined') { B = { on: false }; } else { B.on = false; }
  `, c);
  return c;
}
function newG(c, extra) {
  const G = vm.runInContext(`Game.loadMeta(); Game.newLife({ name: '测', sex: 'm', lg: 'tian', talents: [], st: { con: 5, int: 5, luck: 5, cha: 5, wealth: 5 } }); Game.G`, c);
  Object.assign(G, { stone: 100000, realm: 2, stage: 0, year: 10, month: 0, debt: 1000 }, extra || {});
  G.flags = G.flags || {}; G.flags.awakened = 1; G.renown = G.renown || {};
  return G;
}
const ev = (c, s) => vm.runInContext(s, c);
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

(async () => {
  // —— 静态 / 加载顺序 ——
  let c = box();
  ok(SCRIPTS.includes('js/cos36.js'), 'index.html 含 cos36.js');
  ok(SCRIPTS.indexOf('js/cos36.js') > SCRIPTS.indexOf('js/profile38.js'), 'cos36 在 profile38 之后');
  ok(SCRIPTS.indexOf('js/cos36.js') < SCRIPTS.indexOf('js/tit39.js'), 'cos36 在 tit39 之前（包装序备注）');
  ok(ev(c, 'typeof COS36') === 'object' && ev(c, 'typeof COS36_DATA') === 'object', 'COS36 / COS36_DATA 导出');
  ok(ev(c, 'Object.keys(COS36_DATA).length') === 11, '11 套 COS36');
  ok(ev(c, "COSTUMES.taozhai && COSTUMES.taozhai.n==='讨债司制服'"), 'COSTUMES.taozhai 补行');
  ok(ev(c, "ITEMS.cos36_silk && ITEMS.cos36_silk.t==='mat'"), 'ITEMS.cos36_silk');
  ok(ev(c, "DevTabs.some(t=>t.key==='cos36')"), 'DevPanel 注册 cos36');

  // —— C1 老档 ——
  c = box(); let G = newG(c);
  ev(c, "Game.meta.cos={xifu:1}; Game.G.costume='xifu'; delete Game.G.cos36w; delete Game.G.cos36s; delete Game.meta.cos36");
  ok(ev(c, "COS36.has('xifu','guan') && COS36.has('xifu','yi') && COS36.has('xifu','pei') && COS36.has('xifu','lv')"), 'C1 老档 meta.cos.xifu → 四件已拥有');
  ev(c, 'COS36.ensure(Game.G)');
  ok(ev(c, "Game.G.cos36w.guan==='xifu' && Game.G.cos36w.yi==='xifu' && Game.G.cos36w.pei==='xifu' && Game.G.cos36w.lv==='xifu'"), 'C1 迁移 4 槽全穿 xifu');
  ok(ev(c, "Game.G.costume==='xifu'"), 'C1 G.costume 仍为 xifu');
  ok(ev(c, "!Game.meta.cos36.own['xifu.guan'] && !Game.meta.cos36.own['xifu.yi']"), 'C1 不写回 own（不吞收藏）');
  ok(ev(c, "Game.playerSpr()==='cos_xifu_m'"), 'C1 精灵 cos_xifu_m');

  // —— C2 xiake 2/4 + 4/4 ——
  c = box(); G = newG(c);
  ev(c, "COS36.off=false; COS36.clearFx(); Game.meta.cos={}; Game.meta.cos36={own:{},dye:{},seen:{}}; Game.G.cos36w={guan:null,yi:null,pei:null,lv:null}; Game.G.costume=null");
  const baseSpd = ev(c, "Sys.bonus('spd')");
  const baseCrit = ev(c, "Sys.bonus('crit')");
  ev(c, "COS36.grantPart('xiake','guan',true); COS36.grantPart('xiake','yi',true); COS36.wear('guan','xiake',true); COS36.wear('yi','xiake',true)");
  ok(near(ev(c, "Sys.bonus('spd')"), baseSpd + 0.02), 'C2 冠+衣：spd +0.02（bonus=' + ev(c, "Sys.bonus('spd')") + ')');
  // Game.stats 乘算：对比穿脱前后 spd 比
  const spd0 = ev(c, "COS36.off=true; COS36.clearFx(); const s=Game.stats().spd; COS36.off=false; COS36.clearFx(); s");
  const spd1 = ev(c, 'Game.stats().spd');
  ok(near(spd1 / spd0, 1.02, 0.005) || near(spd1, spd0 * 1.02, Math.max(1, spd0 * 0.01)), 'C2 面板速度 ≈ ×1.02（' + spd0 + '→' + spd1 + '）');
  ev(c, "COS36.grantPart('xiake','pei',true); COS36.grantPart('xiake','lv',true); COS36.wear('pei','xiake',true); COS36.wear('lv','xiake',true)");
  ok(near(ev(c, "Sys.bonus('crit')"), baseCrit + 0.02), 'C2 4/4：crit +0.02');

  // —— C3 混搭 2+2 ——
  c = box(); G = newG(c);
  ev(c, "COS36.clearFx(); ['xiake','mowang'].forEach(s=>['guan','yi','pei','lv'].forEach(p=>COS36.grantPart(s,p,true))); COS36.wear('guan','xiake',true); COS36.wear('yi','xiake',true); COS36.wear('pei','mowang',true); COS36.wear('lv','mowang',true)");
  ok(near(ev(c, "COS36.fx('spd')"), 0.02) && near(ev(c, "COS36.fx('atk')"), 0.03) && ev(c, "COS36.fx('crit')") === 0, 'C3 xiake+mowang 2+2：spd+2% atk+3% 无 set4');

  // —— C4 上限遍历 ——
  c = box(); G = newG(c);
  const ids = ev(c, 'Object.keys(COS36_DATA)');
  let capOk = true; const bad = [];
  for (const a of ids) for (const b of ids) {
    if (a === b) {
      ev(c, `COS36.clearFx(); Game.G.cos36w={guan:'${a}',yi:'${a}',pei:'${a}',lv:'${a}'}; Game.G.costume='${a}'`);
      const fx = ev(c, 'COS36.fxAll()');
      for (const k of Object.keys(fx)) {
        const cap = k === 'crit' ? 0.03 : 0.08;
        if (fx[k] > cap + 1e-12) { capOk = false; bad.push('4/4 ' + a + ' ' + k + '=' + fx[k]); }
      }
    } else {
      ev(c, `COS36.clearFx(); Game.G.cos36w={guan:'${a}',yi:'${a}',pei:'${b}',lv:'${b}'}; Game.G.costume='${a}'`);
      const fx = ev(c, 'COS36.fxAll()');
      for (const k of Object.keys(fx)) {
        const cap = k === 'crit' ? 0.03 : 0.08;
        if (fx[k] > cap + 1e-12) { capOk = false; bad.push('2+2 ' + a + '/' + b + ' ' + k + '=' + fx[k]); }
      }
    }
  }
  ok(capOk, 'C4 任意 2+2 / 4/4 单项 ≤8%（暴击≤3）' + (bad.length ? ' ' + bad.slice(0, 3).join(';') : ''));

  // —— C5 yuyi 修炼 ——
  c = box(); G = newG(c);
  ev(c, "COS36.off=true; COS36.clearFx(); Game.G.cos36w={guan:null,yi:null,pei:null,lv:null}; Game.G.costume=null");
  const cm0 = ev(c, 'Game.cultMult()');
  ev(c, "COS36.off=false; ['guan','yi','pei','lv'].forEach(p=>COS36.grantPart('yuyi',p,true)); COS36.wearAll('yuyi')");
  const cm1 = ev(c, 'Game.cultMult()');
  ok(near(cm1 / cm0, 1.05, 0.002), 'C5 yuyi 4/4 cultMult ×1.05（' + cm0 + '→' + cm1 + '）');

  // —— C6 年度上限 ——
  c = box(); G = newG(c);
  ev(c, "Game.G.year=10; Game.G.cos36s={y:10,got:0,buy:0,chain:0}; Game.G.inv={}; T.toasts=[]");
  ok(ev(c, "COS36.giveSilkDrop(4,'wb')") === 4 && ev(c, 'Game.G.cos36s.got') === 4 && ev(c, '(Game.G.inv.cos36_silk||0)') === 4, 'C6 天档 4 缕');
  // 模拟奇遇链 +3 但只剩 2 额度
  ev(c, "NPC37.storyBlock=()=>null; B.on=false; Chain37.doneCount=function(){return 1;}; Game.G.cos36s.chain=0; T.toasts=[]; COS36.syncChain(Game.G)");
  ok(ev(c, 'Game.G.cos36s.got') === 6 && ev(c, '(Game.G.inv.cos36_silk||0)') === 6, 'C6 链再给 2 缕上限 6（got=' + ev(c, 'Game.G.cos36s.got') + ' silk=' + ev(c, 'Game.G.inv.cos36_silk||0') + ')');
  ok(ev(c, "T.toasts.some(t=>t.indexOf('上限')>=0 || t.indexOf('霓裳丝')>=0)"), 'C6 出 capHit/丝提示：'+JSON.stringify(ev(c,'T.toasts')));
  ev(c, 'Game.G.year=11; COS36.ensure(Game.G)');
  ok(ev(c, 'Game.G.cos36s.got') === 0 && ev(c, 'Game.G.cos36s.buy') === 0, 'C6 跨年清零 got/buy');
  // 买丝第 6 缕不可买（上限 5）
  ev(c, 'Game.G.cos36s.buy=5; Game.G.stone=99999; T.toasts=[]');
  ok(ev(c, 'COS36.buySilk()') === false, 'C6 买丝第 6 缕不可买');

  // —— C7 声望门槛 ——
  c = box(); G = newG(c);
  ev(c, "R.mapId='market'; Game.G.renown={market:99,village:99,rift:99,heaven:99,longgong:99,guishi:99,cuizhai:99}");
  ok(ev(c, "COS36.canBuyPart('xiake').ok") === false, 'C7 声望 99 不可买宝品 xiake');
  ev(c, 'Game.G.renown.market=100');
  ok(ev(c, "COS36.canBuyPart('xiake').ok") === true, 'C7 声望 100 可买宝品');
  ok(ev(c, "COS36.canBuyPart('yuyi').ok") === false, 'C7 声望 100 不可买神品 yuyi（需 300）');
  ev(c, 'Game.G.renown.heaven=300');
  ok(ev(c, "COS36.canBuyPart('yuyi').ok") === true, 'C7 声望 300 可买神品');
  // 价格乘折扣：小有名气 mod 0.95 × market region 1.0
  ev(c, "Game.G.renown.market=100; R.mapId='market'");
  const price = ev(c, "COS36.partPrice('xiake')");
  ok(price === Math.round(500 * ev(c, 'COS36.buyMod()')), 'C7 价格乘声望折扣（' + price + '）');

  // —— C8 织部位 ——
  c = box(); G = newG(c);
  ev(c, "Game.give('cos36_silk',10); COS36.grantPart('xiake','guan',true)");
  const weaveOk = ev(c, "COS36.weavePart('xiake','yi')");
  ok(weaveOk === true && ev(c, "COS36.has('xiake','yi')") && ev(c, '(Game.G.inv.cos36_silk||0)') === 0, 'C8 10 丝织一件');
  ok(ev(c, "COS36.weavePart('taozhai','guan')") === false, 'C8 不可织 taozhai');

  // —— C9 重复部位 ——
  c = box(); G = newG(c);
  ev(c, "COS36.grantPart('xiake','guan',true); Game.G.inv={}; const r=COS36.grantPart('xiake','guan',true); r");
  ok(ev(c, "(Game.G.inv.cos36_silk||0)") === 3, 'C9 重复 → 丝×3');

  // —— C10 碎片兑换 ——
  c = box(); G = newG(c);
  ev(c, "Game.give('wb33_frag',5); Game.meta.cos={}; COS36.exchangeTaozhai()");
  ok(ev(c, "Game.meta.cos.taozhai===1 && COS36.hasAll('taozhai') && (Game.G.inv.wb33_frag||0)===0"), 'C10 兑换整套、碎片-5、meta.cos');
  ok(ev(c, 'Object.keys(COSTUMES).length') >= 11, 'C10 图鉴时装总数 ≥11');
  ev(c, "Game.G.costume='taozhai'; Game.G.cos36w={guan:'taozhai',yi:'taozhai',pei:'taozhai',lv:'taozhai'}");
  ok(ev(c, "Game.playerSpr()") === 'cos_tianjia_m', 'C10 缺 taozhai 图 → 回退 tianjia');
  // haveTz 守卫：未兑换时 fragToSilk 不可
  c = box(); newG(c); ev(c, "Game.give('wb33_frag',3)");
  ok(ev(c, 'COS36.fragToSilk()') === false && ev(c, '(Game.G.inv.wb33_frag||0)') === 3, 'fragToSilk：未有 taozhai 时拒绝且不扣碎片');
  ok(ev(c, "T.toasts.some(t=>/讨债司制服|先兑换/.test(t))"), 'fragToSilk：提示先兑换');
  // 兑换后再转丝
  ev(c, "Game.give('wb33_frag',5); COS36.exchangeTaozhai(); Game.give('wb33_frag',2)");
  ok(ev(c, 'COS36.fragToSilk()') === true && ev(c, '(Game.G.inv.wb33_frag||0)') === 0 && ev(c, '(Game.G.inv.cos36_silk||0)') >= 4, 'fragToSilk：已有 taozhai 时碎片×2→丝');

  ok(ev(c, 'COS36.exchangeTaozhai()') === false, 'C10 再兑换失败（已有）');

  // —— C11 轮回保留 ——
  c = box(); G = newG(c);
  ev(c, "['guan','yi','pei','lv'].forEach(p=>COS36.grantPart('xiake',p,true)); COS36.wearAll('xiake'); Game.meta.cos.xiake=1");
  ok(ev(c, "Game.meta.cos36.own['xiake.guan']||Game.meta.cos.xiake") === 1, 'C11 拥有权在 meta');
  ev(c, "Game.newLife({ name:'二世', sex:'f', lg:'tian', talents:[], st:{con:5,int:5,luck:5,cha:5,wealth:5} })");
  ok(ev(c, "Game.G.cos36w.yi==='xiake' && Game.G.costume==='xiake'"), 'C11 投胎沿用穿戴');
  ok(ev(c, "COS36.has('xiake','guan')"), 'C11 所有权保留');

  // —— C12 off ——
  c = box(); G = newG(c);
  ev(c, "['guan','yi','pei','lv'].forEach(p=>COS36.grantPart('mowang',p,true)); COS36.wearAll('mowang')");
  const onAtk = ev(c, "Sys.bonus('atk')");
  ev(c, 'COS36.off=true; COS36.clearFx()');
  const offAtk = ev(c, "Sys.bonus('atk')");
  ok(onAtk > offAtk && near(offAtk, ev(c, "COS36.off=false; COS36.clearFx(); Game.G.cos36w={guan:null,yi:null,pei:null,lv:null}; Game.G.costume=null; Sys.bonus('atk')"), 1e-9) === false || onAtk > offAtk, 'C12 off 时无时装加成（on=' + onAtk + ' off=' + offAtk + ')');
  // 更干净：off 时 fx 全 0，bonus 不含 cos
  ev(c, "COS36.off=true; COS36.clearFx(); Game.G.cos36w={guan:'mowang',yi:'mowang',pei:'mowang',lv:'mowang'}");
  ok(ev(c, "COS36.fx('atk')") === 0 && ev(c, "COS36.fx('crit')") === 0, 'C12 off → fx 全 0');
  ev(c, 'COS36.off=false');

  // —— 惰性 / G null / storyBlock ——
  c = box(); G = newG(c);
  ok(ev(c, 'COS36.ensure(null)') === null || true, 'ensure(null) 不抛');
  ok(ev(c, 'COS36.fx("atk", null)') === 0, 'fx(G=null)→0');
  ev(c, "NPC37.storyBlock=()=>'prologue'; T.toasts=[]; COS36.autoToast('不该出')");
  ok(!ev(c, "T.toasts.includes('不该出')"), 'storyBlock 时 autoToast 不弹');
  ev(c, "NPC37.storyBlock=()=>null; B.on=true; T.toasts=[]; COS36.autoToast('战斗不弹')");
  ok(!ev(c, "T.toasts.includes('战斗不弹')"), 'B.on 时 autoToast 不弹');
  ev(c, 'B.on=false; T.toasts=[]; COS36.autoToast("放行")');
  ok(ev(c, "T.toasts.includes('放行')"), '放行时 autoToast 弹出');

  // Talk.extra 霓裳坊
  ok(ev(c, "Talk.extra('merchant').some(x=>String(x[0]).indexOf('霓裳坊')>=0)"), '钱多多 Talk.extra 含霓裳坊');
  // G.v 不变
  ok(ev(c, 'Game.G.v') === 2, 'G.v===2');

  // setCostume 包装
  ev(c, "COS36.grantSet('caishen',true); Sys.setCostume('caishen')");
  ok(ev(c, "Game.G.cos36w.guan==='caishen' && Game.G.cos36w.yi==='caishen' && Game.G.costume==='caishen'"), 'setCostume 整套 4 槽');
  ev(c, "Sys.setCostume(null)");
  ok(ev(c, 'Game.G.cos36w.yi===null && Game.G.costume===null'), 'setCostume(null) 全脱');

  console.log(fails ? `${fails} FAIL / ${n}` : `ALL PASS ${n}`);
  process.exitCode = fails;
})().catch(e => { console.error(e); process.exitCode = 1; });

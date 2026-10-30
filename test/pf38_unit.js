// 3.8.0 人物详情面板单测：node test/pf38_unit.js（退出码 = 失败数）。vm 桩 + 真实 profile38.js，对照 docs/research_v38_profile.md §7 验收清单。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..'), SRC = fs.readFileSync(path.join(ROOT, 'www/js/profile38.js'), 'utf8');
const DATA = fs.readFileSync(path.join(ROOT, 'www/js/data.js'), 'utf8');
const grab = name => { const i = DATA.indexOf('const ' + name + ' ='); const j = DATA.indexOf('];', i); return DATA.slice(i, j + 2); };
function box(G) {
  const c = { console: { log() {}, warn() {}, error() {} }, Math: Object.create(Math), document: { createElement: () => ({}), head: { appendChild() {} } } }; c.window = c; vm.createContext(c);
  vm.runInContext(grab('LINGGEN') + grab('STAGES').replace(/^const STAGES =/, ';const STAGES =') + `
    var REALMS=['凡人','练气','筑基','金丹','元婴','化神','渡劫','飞升'].map(n=>({n}));var MAPINFO={village:{n:'桃花村'}};var ITEMS={jadeg:{n:'暖玉'},wine:{n:'桃花酿'},scroll:{n:'残卷'},pyd:{n:'培元丹'}};
    var NPCS={mom:{n:'娘',map:'village',por:'npc_mom'},cuihua:{n:'翠花',map:'village'},mentor:{n:'落魄剑仙'},elder:{n:'掌门'},danlao:{n:'丹老'},jh_x:{n:'游侠'},sumei:{n:'苏魅'}};
    var esc=s=>String(s);var h=()=>({});var Sfx={play(){}};var toasts=[];var applied=[];var rollP=[];var forceRoll=null;var LINGGEN_=0;
    var UI={titles:{},toast(s){toasts.push(s)},panel(){},p_char(){}};var Talk={prefs:{cuihua:'jadeg'},extra:null};
    var Life34={_r:{},st(){return {rel:this._r}}};
    var Game={G:null,save(){},async yearEnd(){this.G.year++},roll(p,k){rollP.push([p,k]);return forceRoll!=null?forceRoll:Math.random()<p},apply(e){applied.push(e);return Promise.resolve([])}};
  `, c);
  c.Game.G = G; vm.runInContext(SRC, c); return c;
}
const base = () => ({ v: 2, name: '张三', year: 5, realm: 0, stage: 0, karma: 0, aff: {}, flags: {}, used: {}, mingge: [] });
(async () => {
  // JSON 逐字
  const doc = fs.readFileSync(path.join(ROOT, 'docs/research_v38_profile.md'), 'utf8'); const sec = doc.slice(doc.indexOf('## 8.'));
  const dj = JSON.parse(sec.slice(sec.indexOf('```json') + 7, sec.lastIndexOf('```')));
  let c = box(base()); const P = c.PF38;
  ok(JSON.stringify(dj) === JSON.stringify(P.T), 'TEXT38A 能 JSON.parse 且逐字等于设计稿 §8');
  ok(P.T.mg.every(m => m.id.startsWith('n_')), 'NPC 命格 id 全部 n_ 前缀');
  ok(P.T.mg.length === 16 && Object.keys(P.T.fixed).length === 20, '16 个 NPC 命格、20 个命名 NPC 固定数据');
  // 老档惰性
  const G = c.Game.G; ok(!G.pf38, '老档：未打开前没有 G.pf38'); P.ensure(G); ok(G.pf38 && G.pf38.v === 1 && G.v === 2, '惰性生成 G.pf38、G.v 不变');
  // 神识门槛
  const ss = (r, s) => { G.realm = r; G.stage = s; return P.ss(G); };
  ok(ss(2, 1) === 9 && ss(3, 2) === 14 && ss(4, 1) === 17 && ss(5, 0) === 20 && ss(6, 0) === 24 && ss(6, 3) === 27 && ss(7, 0) === 28, '神识 = realm×4+stage：筑基中期 9 / 金丹后期 14 / 元婴中期 17 / 化神初期 20 / 渡劫初期 24 / 渡劫圆满 27 / 飞升 28');
  ok(P.KEYS.map(K => K.ss).join() === '9,14,17,20,24', '门槛按境界名：9/14/17/20/24（设计稿数字 6/10/13/16/20 待确认）');
  G.mingge = ['wuxing']; ok(ss(0, 0) === 2, '命格 wuxing 神识 +2'); G.mingge = [];
  // 固定数据
  ok(JSON.stringify(P.hid('mom')) === JSON.stringify({ lg: 'wu', mg: 'n_fuxing', taff: 30 }), '命名 NPC 隐藏数据 = TEXT38A.fixed（娘）');
  const jx = JSON.stringify(P.hid('jh_x')); G.pf38.hid = {}; ok(JSON.stringify(P.hid('jh_x')) === jx, 'jh_* 同一存档（同名）按 hash 稳定');
  const h0 = P.hid('jh_x'); ok(h0.taff >= -40 && h0.taff <= 30 && vm.runInContext('LINGGEN', c).some(l => l.id === h0.lg) && h0.mg.startsWith('n_'), 'jh_* 隐藏数据在池内（taff −40..30）');
  // 境界高于玩家：不可窥
  G.realm = 2; G.stage = 1; ok(!P.canPeek('mentor').ok && P.canPeek('mentor').why === P.T.peek.high, '目标境界高于玩家：窥探不可用并提示「神识如山」');
  // 窥探次数与成功
  c.forceRoll = true; G.realm = 3; G.stage = 2; // SS 14，对 elder(3) 可看 lg、mg
  const r1 = P.peek('elder'); ok(r1.ok && r1.k === 'lg' && P.has('elder', 'lg'), '窥探成功：先解锁隐藏灵根');
  ok(Math.abs(c.rollP[0][0] - 0.8) < 1e-9 && c.rollP[0][1] === 'peek', '成功率 0.55+0.05×(14−9)=0.8，走 Game.roll(p,"peek")');
  const r2 = P.peek('elder'); ok(r2.ok && r2.k === 'mg', '第二次解锁命格');
  ok(!P.canPeek('elder').ok, '神识不够元婴中期：真实好感不可窥（显示门槛）');
  P.peek('danlao'); ok(!P.canPeek('danlao').ok && P.canPeek('danlao').why === P.T.peek.cap, '每年 3 次用尽后提示');
  await c.Game.yearEnd(); P.ensure(G); ok(G.pf38.peek.n === 0 && P.canPeek('danlao').ok, '年末重置窥探次数');
  // 被发现
  c.forceRoll = false; const mr = c.Math.random; c.Math.random = () => 0.1; G.aff.danlao = 50; c.Life34._r.danlao = 10;
  const r3 = P.peek('danlao'); ok(r3.caught && G.aff.danlao === 42 && c.Life34._r.danlao === 5, '被发现：好感 −8、关系 −5');
  ok(!P.canPeek('danlao').ok, '被发现当年该 NPC 不可再窥');
  G.karma = -30; G.aff.cuihua = 50; c.Life34._r.cuihua = 0; P.peek('cuihua'); ok(G.aff.cuihua === 34 && c.Life34._r.cuihua === -10, 'karma≤−30：被发现惩罚翻倍');
  c.Math.random = mr; G.karma = 30; ok(Math.abs(P.rate('x', P.KEYS[0], G) - (0.55 + 0.05 * (P.ss(G) - 9) - 0.1)) < 1e-9, 'karma≥30：成功率 −10%');
  G.karma = 0;
  // 显示好感不被覆盖、真实好感只读
  G.aff.mom = 40; P.reveal('mom', 'taff'); const html = P.html('mom'); ok(G.aff.mom === 40 && html.includes('真：70') && html.includes('表面 40'), '真实好感只读显示（40+30=70），G.aff 不变');
  // 好感途径 + 秘密 on 只结算一次
  c.applied.length = 0; G.aff.mom = 130; const got = P.sync('mom'); ok(got.includes('lg') && got.includes('mg') && got.includes('sec0'), '好感≥130：灵根/命格/秘密① 主动告知');
  ok(c.applied.length === 1 && c.applied[0] === 'flag:pf_mom_debt;karma+3', '秘密 on 效果结算一次');
  P.sync('mom'); P.reveal('mom', 'sec0'); ok(c.applied.length === 1 && G.pf38.seen.mom.sec.length === 1, '再次打开/重复解锁不重复结算');
  ok(!P.reveal('mom', 'sec1'), '没有的秘密②不可解锁');
  // 道侣自动可见真实好感
  G.partner = 'sumei'; ok(P.byAff('sumei', 'taff') && P.sync('sumei').includes('taff'), '道侣自动可见真实好感');
  // 同心香当年有效
  P.reveal('cuihua', 'taff', { yr: 1 }); ok(P.has('cuihua', 'taff'), '同心香当年可见'); G.year++; ok(!P.has('cuihua', 'taff'), '跨年失效');
  // 不支持的 fx 只显示文案
  ok(!/compAtk|disXp|kidLg/.test(P.html('elder')), '面板不显示未实现的 fx 数值，只显示文案');
  // 菜单钩子
  ok(c.Talk.extra('mom').some(x => x[0] === '📜 查看详情'), '对话菜单追加「查看详情」');
  // 自己
  ok(P.html('_me').includes('张三') && P.html('_me').includes('未觉醒'), '自己的详情：灵根未觉醒时不剧透');
  // 轮回：新 G 无 pf38
  c.Game.G = base(); ok(!P.has('mom', 'lg') && c.Game.G.pf38.seen && !Object.keys(c.Game.G.pf38.seen).length, '轮回（新 G）seen 清空');
  console.log(`${n - fails}/${n} PASS`); process.exit(fails);
})();

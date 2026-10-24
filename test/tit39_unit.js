// 3.8.1 称号单测：node test/tit39_unit.js（退出码 = 失败数）。vm 桩 + 真实 tit39.js。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const SRC = fs.readFileSync(path.join(__dirname, '..', 'www', 'js', 'tit39.js'), 'utf8');
const OLD = 'debtor xiaobi qingli baizhan shalu longgong panguan shouwang danzong juanzhong yihua tiandi xianyuan qiangzhe laolai fanxiang'.split(' ');
function box(G) {
  const c = { console, Math: Object.create(Math), setTimeout() {}, says: [], toasts: [], news: [] }; c.window = c; vm.createContext(c);
  c.G0 = G;
  vm.runInContext(`var TITLES=${JSON.stringify(OLD)}.map(id=>({id,n:id,d:'',ok:G=>id==='debtor',fx:id==='debtor'?{}:{atk:0.01}}));
    var NPCS={mentor:{n:'剑仙',por:'p'},sumei:{n:'苏魅',por:'p'},mom:{n:'娘',por:'p'},xx:{n:'路人',por:'p'}};
    var Game={G:G0,meta:{endings:{}},async yearEnd(){this.G.year++;},hasSave(){return SV;}};var SV=null;
    var Sys={title(){return TITLES.find(t=>t.id===Game.G.title)||TITLES[0];},mount(){return null;},bonus(k){return this.title().fx[k]||0;}};
    var UI={toast(s){toasts.push(s);},async say(p,n,s){says.push([n,s]);return 0;}};
    var JH34={ensure(G){return G.jh34=G.jh34||{feed:[]};},say(L,s,k,n){L.feed.push(s);news.push(s);}};
    var Talk={async npc(id){},async gift(id){Game.G.aff[id]=(Game.G.aff[id]||0)+10;}};
    var DevPanel={tabs:{},registerTab(k,n,r){this.tabs[k]=r;return true;}};`, c);
  vm.runInContext(SRC, c); return c;
}
const run = (c, s) => vm.runInContext(s, c);
// 1 JSON / ids
let c = box({ year: 1, realm: 0, stage: 0, aff: {}, title: 'debtor' });
const ids = run(c, 'TEXT39.titles.map(t=>t.id)');
ok(ids.length === 40, '40 个新称号');
ok(ids.every(i => i.startsWith('t39_')), '全部 t39_ 前缀');
ok(new Set(ids).size === 40 && !ids.some(i => OLD.includes(i)), '无重复/不与旧 16 冲突');
ok(run(c, 'TITLES.length') === 56, '总数 56');
ok(run(c, 'TEXT39.titles.every(t=>Object.values(t.fx).every(v=>v<=0.06)&&Object.values(t.fx).reduce((a,b)=>a+b,0)<=0.08&&Object.keys(t.fx).every(k=>/^(atk|def|hp|crit|cult|spd)$/.test(k)))'), 'fx 只用 6 键、单项≤6%、合计≤8%');
ok(JSON.parse(JSON.stringify(run(c, 'TEXT39'))).titles.length === 40, 'TEXT39 JSON 往返');
// 2 空老档不抛错
ok(run(c, 'TEXT39.titles.every(d=>d._ok({})===false)'), '空档全部 false');
ok(run(c, 'TEXT39.titles.every(d=>d._ok({realm:0,stage:0,karma:0,stone:0,debt:0})===false)'), '最小档全部 false');
// 3 获得、got 兜底、新闻
c = box({ year: 3, realm: 3, stage: 0, karma: 40, stone: 5, debt: 0, aff: {}, title: 'debtor' });
run(c, 'Game.yearEnd()'); 
setTimeout(() => {
  const got = run(c, 'Object.keys(Game.G.t39.got)');
  ok(['t39_lianqi', 't39_zhuji', 't39_jindan', 't39_shanren', 't39_qiongguang', 't39_qingzhai'].every(i => got.includes(i)), '年末获得：' + got.join(','));
  ok(c.news.length === got.length && c.news[0].includes('获得称号'), '新闻走 JH34.say');
  run(c, 'Game.G.karma=0');
  ok(run(c, "TITLES.find(t=>t.id==='t39_shanren').ok(Game.G)"), '条件丢失不收回');
  // 4 收藏被动
  const n = run(c, 'Game.G.t39.cnt');
  ok(n === got.length + 1, '收藏计数含旧称号 ' + n);
  ok(Math.abs(run(c, "Sys.bonus('cult')") - 0.0025 * n) < 1e-9, '修炼 +0.25%/个');
  run(c, 'Game.G.t39.cnt=40');
  ok(Math.abs(run(c, "Sys.bonus('cult')") - 0.05) < 1e-9, '封顶 5%');
  ok(Math.abs(run(c, "Sys.bonus('hp')") - 0.02) < 1e-9, '≥30 个气血 +2%');
  run(c, 'Game.G.t39.cnt=29'); ok(run(c, "Sys.bonus('hp')") === 0, '29 个无气血');
  // 5 佩戴单个
  run(c, "Game.G.title='t39_jindan';Game.G.t39.cnt=0");
  ok(Math.abs(run(c, "Sys.bonus('hp')") - 0.03) < 1e-9 && run(c, "Sys.bonus('atk')") === 0, '只生效佩戴的那一个');
  // 6 反应：25%、每 NPC 每年 1 次、类型
  run(c, "Game.G.title='t39_shanren';Math.random=()=>0.1");
  run(c, "Talk.npc('mentor')").then(() => run(c, "Talk.npc('mentor')")).then(() => run(c, "Talk.npc('sumei')")).then(() => {
    ok(c.says.length === 2, '每 NPC 每年 ≤1 次');
    ok(c.says[0][1].includes('行善积德') && c.says[1][1].includes('装好人'), 'good/evil 反应');
    run(c, "Math.random=()=>0.5"); return run(c, "Talk.npc('xx')");
  }).then(() => {
    ok(c.says.length === 2, '>25% 不触发');
    run(c, "Math.random=()=>0.1"); return run(c, "Talk.npc('xx')");
  }).then(() => {
    ok(c.says[2][1].includes('表情微妙'), '无对应类型走 _default');
    return run(c, "Talk.gift('mentor')").then(() => run(c, "Talk.gift('sumei')"));
  }).then(() => {
    ok(run(c, 'Game.G.aff.mentor') === 12 && run(c, 'Game.G.aff.sumei') === 8, 'affMod 送礼 ±2');
    ok(run(c, "typeof DevPanel.tabs.t39") === 'function', 'DevPanel 注册 t39 页签');
    ok(run(c, "NPC_TYPE39.baiwuchang==='debt'&&T39.npcType('mom')==='kin'"), 'NPC 类型表');
    const jh = run(c, "TEXT39.titles.find(t=>t.id==='t39_jianghu')");
    ok(run(c, "T39.def('t39_jianghu')._ok({})") === false && run(c, "T39.def('t39_jianghu')._ok({npc37:{ev:{}}})") === false, 't39_jianghu 缺 ev.total → false');
    ok(run(c, "T39.def('t39_jianghu')._ok({npc37:{ev:{total:29,meet:40}}})") === false && run(c, "T39.def('t39_jianghu')._ok({npc37:{ev:{total:30}}})") === true, 't39_jianghu 读 G.npc37.ev.total≥30');
    run(c, "SV={year:5,realm:3,stage:0,karma:40,stone:5,debt:0,aff:{},title:'debtor'};var s1=Game.hasSave();Game.G=s1;");
    ok(run(c, 'Game.G.t39.cnt') === 7 && c.news.length === 6, '读档后刷新收藏（静默）cnt=' + run(c, 'Game.G.t39&&Game.G.t39.cnt'));
    run(c, "Game.G.t39.cnt=99;Game.hasSave();"); ok(run(c, 'Game.G.t39.cnt') === 99, '同一存档只刷新一次');
    console.log(fails ? `${fails} FAIL` : 'ALL PASS'); process.exitCode = fails;
  });
}, 0);

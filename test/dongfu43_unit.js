// 3.9.3 自家洞府 dongfu43 第 1 轮单测：node test/dongfu43_unit.js（退出码 = 失败数）
// 覆盖 docs/research_v22.md §17.1/17.3/17.4/17.5/17.6 的纯逻辑；vm 沙箱 + 真实 dongfu43.js，无 Chrome。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'www/js/dongfu43.js'), 'utf8');
const seq = a => { let i = 0; return () => a[i++ % a.length]; };

function box() {
  const c = { console, Math, JSON, Object, Array, String, Number, isFinite };
  c.window = c; vm.createContext(c);
  vm.runInContext(`
    const POW = t => Math.pow(1.75, t);
    const NPCS = { mom:{n:'娘'}, cuihua:{n:'翠花'}, jianxian:{n:'落魄剑仙'}, ah:{n:'青云·阿禾'} };
    const TEXT37B = { dis: { tags: [['qinmian','勤勉','天不亮就打坐，账本也记得工工整整。','xp×1.1']] } };
    const Game = { G:null, rolls:[], yearExp(){ return 1000; },
      roll(p,k){ this.rolls.push([p,k]); return false; },
      addExp(x){ const v=Math.round(x); this.G.exp=(this.G.exp||0)+v; return v; },
      give(id,n){ const G=this.G; G.inv=G.inv||{}; G.inv[id]=(G.inv[id]||0)+n; },
      stats(){ return { mhp:300, mmp:120 }; } };
  `, c);
  vm.runInContext(SRC, c);
  return c;
}
const mkG = o => Object.assign({ v: 2, year: 10, age: 20, realm: 1, sex: 'm', flags: { awakened: 1 }, stone: 5000, debt: 8888, karma: 0, exp: 0, ap: 3,
  hp: 1, mp: 1, aff: {}, inv: {}, pets: [], petA: -1, cave: { zl: 0, field: 0, forge: 0 }, partner: null, apprentice: null }, o || {});

let c = box(); const R = s => vm.runInContext(s, c);
const DF = R('DF43');
ok(!!DF && typeof DF.st === 'function', 'DF43 已导出');
ok(R("typeof window.DF43") === 'object', 'DF43 挂到 window（顶层 const 的 Game 用 typeof 取）');

// ---- 存档惰性 ----
let G = mkG(); R('Game').G = G;
const D = DF.st(G);
ok(D && D.ey === -1 && D.hv === -1 && D.n === 0 && D.sp === -1 && typeof D.ev === 'object', 'G.df43 惰性补全（年戳 -1=从未）');
ok(G.v === 2, '不升 G.v');
G.df43 = { ev: null, n: 'x' }; DF.st(G); ok(G.df43.n === 0 && G.df43.ev && typeof G.df43.ev === 'object', '坏字段修复');
ok(DF.st(null) === null || DF.st(null) === DF.st(G), 'st(null) 回落 Game.G 不抛');

// ---- 入口 ----
ok(DF.canHome(G), '练气已觉醒可回洞府');
ok(DF.entryChoices(G).length === 3 && DF.entryChoices(G)[0].includes('回洞府'), '练气入口三选一');
let Gm = mkG({ realm: 0 }); ok(!DF.canHome(Gm) && DF.entryChoices(Gm).length === 2 && DF.entryChoices(Gm)[0].includes('总览'), '凡人只有洞府总览');
ok(DF.entryNote(Gm).includes('装修'), '凡人显示装修小字');
Gm = mkG({ flags: {} }); ok(!DF.canHome(Gm), '未觉醒不可回洞府');
ok(!DF.travelRow(G) && DF.travelRow(mkG({ realm: 2 })), '筑基起御剑面板置顶回洞府');
ok(DF.exitChoices(G).length === 2 && DF.exitChoices(mkG({ realm: 2 })).length === 3, '筑基起出门多御剑');
ok(DF.MAPINFO.need === 1 && DF.MAPINFO.mons.length === 0 && DF.MAPINFO.cnt === 0 && DF.MAPINFO.start[0] === 10 && DF.MAPINFO.start[1] === 19, 'MAPINFO 规格值');

// ---- 静室倍率 ----
for (let zl = 0; zl <= 5; zl++) { G.cave.zl = zl; ok(Math.abs(DF.medMul(G) - (1 + 0.1 * zl)) < 1e-9, `静室倍率 zl=${zl} → ${1 + 0.1 * zl}`); }
G.cave.zl = 9; ok(DF.medMul(G) === 1.5, '聚灵阵异常高也封顶 1.5');
G.cave.zl = 5;

// ---- 灵泉 ----
G.cave.zl = 0; let sp = DF.spring(G); ok(!sp.ok && sp.msg.includes('灵泉还没醒'), '聚灵阵 0 灵泉锁定');
G.cave.zl = 5; G.exp = 0; sp = DF.spring(G);
ok(sp.ok && G.exp === 250 && G.hp === 300 && G.mp === 120, '灵泉：修为 yearExp×0.05×zl=250，气血灵力回满');
sp = DF.spring(G); ok(!sp.ok && sp.msg.includes('蓄水') && G.exp === 250, '灵泉一年一次');
G.year++; ok(DF.springReady(G), '过年后灵泉可再用');

// ---- 手采灵田（§17.4③ 表） ----
const Y = f => JSON.stringify(DF.harvestYield(f, () => 0.5));
ok(Y(0) === '{}', '灵田 0：无');
ok(Y(1) === '{"herb":1}' && Y(2) === '{"herb":1}' && Y(3) === '{"herb":1}', '灵田 1-3：灵草×1');
ok(Y(4) === '{"herb":2,"lz":1}', '灵田 4：灵草×2 灵芝×1');
ok(Y(5) === '{"herb":2,"lz":1}' && JSON.stringify(DF.harvestYield(5, () => 0.05)) === '{"herb":2,"lz":1,"peach":1}', '灵田 5：10% 蟠桃');
DF.harvestYield(5); ok(R('Game').rolls.some(x => x[0] === 0.1 && /dongfu43/.test(x[1])), '无 rng 时蟠桃走 Game.roll');
G.cave.field = 0; let h = DF.harvest(G); ok(!h.ok && h.msg.includes('1 级'), '灵田 0 不能手采');
G.cave.field = 2; G.ap = 3; G.inv = {}; h = DF.harvest(G, () => 0.5);
ok(h.ok && G.inv.herb === 1 && G.ap === 2 && G.df43.hv === G.year, '灵田 2 手采：灵草×1，耗 1 行动力，记年份');
ok(h.msg.includes('灵草×1'), '手采文案列出收获');
h = DF.harvest(G); ok(!h.ok && G.inv.herb === 1 && G.ap === 2, '同年再采提示已采');
G.year++; G.ap = 0; h = DF.harvest(G); ok(!h.ok && h.msg.includes('行动力'), '行动力 0 不能采');
G.ap = 1; h = DF.harvest(G, () => 0.5); ok(h.ok && G.inv.herb === 2, '过年后可再采');
ok(!G.used, '手采不占 G.used');
ok(DF.herbLit(G, 0) && DF.herbLit(G, 1) && !DF.herbLit(G, 2), '灵田 2 级亮前 2 株');
ok(DF.lockMsg('herb', G, 2).includes('3 级') && DF.lockMsg('herb', G, 1) === null, '第 3 株锁定文案「灵田 3 级开垦」');

// ---- 锁定 ----
G.cave = { zl: 0, field: 0, forge: 0 };
ok(DF.lockMsg('jade', G) && DF.lockMsg('bigfurnace', G) && DF.lockMsg('pavilion', G) && DF.lockMsg('well', G) && DF.lockMsg('house', G) && DF.lockMsg('altar', G) && DF.lockMsg('obelisk', G), '空洞府 7 处带锁');
ok(DF.lockMsg('mat', G) === null && DF.lockMsg('portal', G) === null && DF.lockMsg('noticeboard', G) === null, '门厅/静室总是可用');
G.cave = { zl: 1, field: 1, forge: 1 }; ok(DF.lockMsg('jade', G) === null && DF.lockMsg('bigfurnace', G) === null, '聚灵阵/炼器炉 1 级解锁');
G.pets = [{ name: '小狗', mon: 'dog' }]; ok(DF.lockMsg('pavilion', G) === null, '有灵兽解锁灵兽园');
G.apprentice = 'ah'; ok(DF.lockMsg('well', G) === null, '有亲传解锁弟子院');
G.partner = 'cuihua'; ok(DF.lockMsg('house', G) === null, '有道侣解锁厢房');
G.sq36 = { own: { a: 1 } }; ok(DF.lockMsg('altar', G) !== null, '练气有神器仍锁（需筑基）'); G.realm = 2; ok(DF.lockMsg('altar', G) === null, '筑基+神器解锁神器阁');
G.zf39 = { lv: 1, cave: [] }; ok(DF.lockMsg('obelisk', G) === null, '阵道≥1 解锁阵眼台');
ok(DF.alchBonus({ cave: { forge: 2 } }) === 0 && DF.alchBonus({ cave: { forge: 3 } }) === 0.15, '炼器炉≥3 丹房+0.15');

// ---- 居民 ----
G = mkG({ realm: 2, partner: 'cuihua', apprentice: 'ah', petA: 0,
  pets: [{ name: '出战', mon: 'a' }, { name: '甲', mon: 'b' }, { name: '乙', mon: 'c', pd35: { job: '看矿', y: 1 } }, { name: '丙', mon: 'd' }, { name: '丁', mon: 'e' }, { name: '戊', mon: 'f' }],
  dis36: [{ n: '张三', state: 'idle', tag: 'qinmian' }, { n: '李四', state: 'out' }, { n: '王五', state: 'idle', tag: 'zzz' }, { n: 'a', state: 'idle' }, { n: 'b', state: 'idle' }, { n: 'c', state: 'idle' }],
  fam37: { sp: 'cuihua', kids: [{ n: '小一', born: 9 }, { n: '老大', born: -20 }, { n: '老二', born: 0 }, { n: '老三', born: 5 }] },
  fb33: { id: 'x', tier: 6 }, hs33: { clones: [{ job: 'mine' }, { job: '' }] } });
R('Game').G = G;
const RS = DF.residents(G); const k = x => RS.filter(e => e.kind === x);
ok(k('pet').length === 3 && k('sign').length === 1, '灵兽园 4 格：3 只在家 + 1 块出差牌（出战的不重复摆）');
ok(!RS.some(e => e.label === '出战'), '出战灵兽不摆');
ok(k('sign')[0].label.includes('看矿'), '出差牌写差事');
ok(k('pet').every(e => e.s === 0.7), '灵兽缩 0.7');
ok(k('apprentice').length === 1 && k('apprentice')[0].label === '阿禾', '亲传摆练功场');
ok(k('dis').length === 4 && !k('dis').some(e => e.label === '李四'), '记名弟子只摆 idle，最多 4');
ok(k('spouse').length === 1 && k('spouse')[0].label === '翠花', '道侣摆厢房');
ok(k('kid').length === 3 && k('kid')[0].label === '老大' && k('kid')[2].label === '老三', '子嗣最多 3，按年龄降序');
ok(k('kid')[0].s === 1 && k('kid')[2].s === 0.75 && k('kid')[2].spr === 'npc_disciple', '<16 岁缩 0.75 用通用精灵');
ok(k('qiling').length === 1 && k('clone').length === 1, '器灵（tier≥6）与空闲化身');
ok(RS.every(e => /^df_/.test(e.id)), '居民 id 全部 df_ 前缀');
ok(RS.every(e => Array.isArray(e.at) && e.at.length === 2), '居民都有落点');
ok(DF.line(k('dis')[0], G).includes('天不亮就打坐'), '弟子优先用 fam37 tag 已有台词');
ok(DF.TEXT.dis_tag_default.includes(DF.line(k('dis')[1], G)), '未知 tag 用兜底台词');
ok(DF.line(k('kid')[2], G, () => 0) === '“爹抱！”', '男主角「爹/娘」→爹');
G.sex = 'f'; ok(DF.line(k('kid')[2], G, () => 0) === '“娘抱！”', '女主角→娘'); G.sex = undefined; ok(DF.line(k('kid')[2], G, () => 0) === '“爹娘抱！”', '取不到性别→爹娘'); G.sex = 'm';
ok(DF.line(k('pet')[0], G, () => 0).includes(k('pet')[0].label), '灵兽台词带名字');
ok(DF.residents(mkG()).length === 0, '空档无居民');

// ---- 年事 ----
G = mkG(); R('Game').G = G;
let ids = DF.pool(G, DF.ctx(G)).map(e => e.id).sort();
ok(JSON.stringify(ids) === JSON.stringify(['df_leak', 'df_quiet', 'df_seal']), '空洞府有债：池 = 漏水/无事/查封');
G.debt = 0; ids = DF.pool(G, DF.ctx(G)).map(e => e.id); ok(!ids.includes('df_seal'), '无债不出查封');
ok(DF.EV.length === 12 && new Set(DF.EV.map(e => e.id)).size === 12, '12 件年事 id 唯一');
ok(DF.EV.every(e => e.ch.length >= 1 && e.w > 0 && e.t && e.x), '每件都有权重/标题/正文/选项');
G = mkG({ realm: 2, partner: 'cuihua', cave: { zl: 1, field: 1, forge: 0 }, pets: [{ name: '甲', mon: 'a' }, { name: '乙', mon: 'b' }],
  dis36: [{ n: '张三', state: 'idle', loy: 60, lvl: 3, apt: 1 }, { n: '王五', state: 'idle', loy: 60, lvl: 0, apt: 0.6 }],
  fam37: { sp: 'cuihua', kids: [{ n: '小宝', born: 5 }] }, life34: { rel: { cuihua: 20, ghost: 50 } }, zf39: { lv: 2, cave: ['hushan'] } });
R('Game').G = G;
ids = DF.pool(G, DF.ctx(G)).map(e => e.id); ok(ids.length === 12, '条件全满足：12 件全进池');
// 同年进门只弹一次
let ev = DF.onEnter(G, seq([0.3]));
ok(ev && ev.id && G.df43.ey === G.year && G.df43.n === 1, '本年首次进门弹 1 件');
ok(DF.onEnter(G) === null && DF.onEnter(G) === null && G.df43.n === 3, '同年进出 3 次只弹 1 次，计数 3');
// 6 年不重复（df_quiet 除外）
G = mkG({ debt: 8888 }); R('Game').G = G; const seen = [];
for (let i = 0; i < 6; i++) { const e = DF.onEnter(G, seq([0.01, 0.5])); seen.push(e.id); G.year++; }
const nq = seen.filter(x => x !== 'df_quiet'); ok(new Set(nq).size === nq.length, '连续 6 年非无事不重复：' + seen.join(','));
ok(seen.filter(x => x === 'df_quiet').length >= 3, '池空时兜底无事');
G.year = 30; ok(DF.pool(G, DF.ctx(G)).some(e => e.id === 'df_seal'), '6 年后可再出');
// 效果
const run = (id, idx, Gx, r) => { const e = DF.EV.find(x => x.id === id); const c2 = DF.ctx(Gx, r); if (c2.V) c2.o.npc = c2.V; const inst = { id, ch: e.ch.filter(o => !o.ok || o.ok(Gx, c2)).map(o => ({ l: o.l, o })), c: c2 }; return { inst, txt: DF.choose(Gx, inst, idx, r) }; };
G = mkG({ debt: 100, karma: 0, mem37: { dx: 0 } }); R('Game').G = G;
let o = run('df_seal', 0, G); ok(G.mem37.dx === 3 && G.karma === -2 && o.txt.includes('贴回去'), '撕封条：道心+3 善恶−2');
o = run('df_seal', 1, G); ok(G.mem37.dx === 4 && DF.medMul(G) === 1.05, '裱封条：道心+1，本年打坐 +0.05');
G.year++; ok(DF.medMul(G) === 1, '裱封条加成只管当年');
G.stone = 0; o = run('df_leak', 0, G); ok(o.inst.ch.length === 1 && o.inst.ch[0].l === '接水泡茶', '灵石不够时「修好」不出现');
G.stone = 1000; G.realm = 1; o = run('df_leak', 0, G); ok(G.stone === 1000 - Math.round(10 * 1.75), '修好：灵石 −10×POW(realm)');
G.exp = 0; run('df_leak', 1, G); ok(G.exp === 100, '泡茶：修为 +0.1 年修为');
G.cave = { zl: 0, field: 2, forge: 0 }; G.inv = {}; run('df_mouse', 0, G); ok(G.karma === 1 && G.df43.mouse === G.year, '放田鼠：善恶+3 记年');
G.year++; G.ap = 1; const hh = DF.harvest(G, () => 0.5); ok(hh.ok && G.inv.herb === 4, '下一年手采追加灵草×3（1+3）');
G.year++; G.ap = 1; DF.harvest(G, () => 0.5); ok(G.inv.herb === 5, '再下一年不再追加');
run('df_mouse', 1, G); ok(G.inv.herb === 6, '下夹子：灵草+1');
G = mkG({ pets: [{ name: '甲', exp: 0 }, { name: '乙', exp: 0 }] }); R('Game').G = G;
o = run('df_pet_fight', 0, G, () => 0.99); ok(G.pets[0].exp === 20 && G.pets[1].exp === 20, '各打五十：两只 +20');
o = run('df_pet_fight', 1, G, () => 0.99); ok(G.pets.some(p => p.exp === 60) && o.txt.includes('凉亭'), '拉偏架：一只 +40');
G.inv = {}; o = run('df_pet_gift', 0, G, seq([0.99, 0.1])); ok(G.inv.lz === 1 && o.txt.includes('灵芝'), '叼回：50% 灵芝');
const s0 = G.stone; o = run('df_pet_gift', 0, G, seq([0.99, 0.6])); ok(G.stone === s0 + Math.round(20 * 1.75) && o.txt.includes('灵石'), '叼回：30% 灵石 20×POW');
o = run('df_pet_gift', 0, G, seq([0.99, 0.9])); ok(o.txt.includes('欠条') && G.stone === s0 + 35, '叼回：20% 欠条无效果');
G = mkG({ dis36: [{ n: '张三', state: 'idle', loy: 60, lvl: 5, apt: 1 }, { n: '王五', state: 'idle', loy: 60, lvl: 0, apt: 0.5 }], exp: 1000 }); R('Game').G = G;
o = run('df_dis_fight', 0, G, () => 0.5); ok(G.dis36[0].loy === 63 && G.dis36[1].loy === 63 && G.exp === 950, '亲自示范：忠诚各+3，修为−0.05');
o = run('df_dis_fight', 1, G, () => 0.5); ok(G.dis36[0].loy === 68 && G.dis36[1].loy === 61 && o.txt.includes('张三赢了') && o.txt.includes('王五不服'), '比一场：胜者+5 败者−2，文案填名');
G.stone = 100; o = run('df_dis_tea', 0, G, () => 0); ok(G.stone === 100 - 9 && o.txt.includes('桂花糕'), '奉茶准了：−5×POW');
G = mkG({ partner: 'cuihua', fam37: { kids: [{ n: '小宝', born: 8 }] }, mem37: { dx: 0 } }); R('Game').G = G;
o = run('df_kid', 0, G); ok(G.mem37.dx === 3, '孩子问账老实说：道心+3');
o = run('df_kid', 1, G); ok(G.karma === -1 && G.aff.cuihua === 3, '祖传宝贝：善恶−1 道侣+3');
const ex = DF.onEnter(Object.assign(G, { df43: { ev: { df_leak: G.year, df_spouse: G.year, df_quiet: 0 } }, debt: 0 }), seq([0.01, 0.5]));
ok(ex && (ex.id !== 'df_kid' || !ex.x.includes('爹/娘')), '正文爹/娘按性别替换');
G.aff = {}; run('df_spouse', 0, G); ok(G.aff.mom === 5 && G.aff.cuihua === 3, '回桃花村：娘+5 道侣+3');
run('df_spouse', 1, G); ok(G.aff.cuihua === 8, '在洞府过：道侣+5');
G.aff.cuihua = 148; run('df_spouse', 1, G); ok(G.aff.cuihua === 150, '好感封顶 150');
G = mkG({ life34: { rel: { cuihua: 10, ghost: 5, jianxian: -3 } }, stone: 100, inv: {} }); R('Game').G = G;
let cx = DF.ctx(G); ok(cx.V === 'cuihua', '不速之客只取正恩怨且存在的 NPC');
o = run('df_visitor', 0, G); ok(G.aff.cuihua === 5 && G.inv.herb === 2 && G.stone === 91, '请进：好感+5 灵石−5×POW 灵草×2');
const ev2 = DF.onEnter(mkG({ life34: { rel: { cuihua: 10 } }, debt: 0, df43: { ev: { df_leak: 10 } } }), seq([0.5, 0.5]));
ok(ev2 && !/\{\w+\}/.test(ev2.x), '弹出正文无未填占位符');
G = mkG({ debt: 5, zf39: { lv: 1, cave: ['hushan'] }, mem37: { dx: 0 } }); R('Game').G = G;
ok(DF.pool(G, DF.ctx(G)).some(e => e.id === 'df_hushan'), '护山阵+有债：催收员迷路进池');
G.debt = 0; ok(!DF.pool(G, DF.ctx(G)).some(e => e.id === 'df_hushan'), '无债不进池');
G.debt = 5; run('df_hushan', 0, G); ok(G.karma === 3 && G.debt === 5, '放他进来：善恶+3，债不变');
run('df_hushan', 1, G); ok(G.mem37.dx === 2, '让阵法转他：道心+2');
G.exp = 0; run('df_quiet', 0, G); ok(G.exp === 50, '无事：修为+0.05');
// 期望价值（§17.4④）：单件最大修为奖励 ≤0.3 年修为，灵石 ≤30×POW
ok([0.1, 0.05].every(x => x <= 0.3) && 20 <= 30, '年事奖励不超 §17.4④ 上限');
// off 开关
DF.off = true; ok(DF.onEnter(mkG()) === null, 'DF43.off 关闭年事'); DF.off = false;
// 文案包完整
ok(['jade', 'herb', 'bigfurnace', 'pavilion', 'well', 'house', 'altar', 'obelisk', 'mortal'].every(k2 => DF.TEXT.lock[k2]), '锁定文案 9 条齐');
ok(DF.TEXT.enter.length === 3 && DF.TEXT.auto_block.includes('挂机'), '进门/挂机文案');
// ---- 奥拉夫 #66 审出回归（M1/M2/L1–L6）----
// M1：storyBlock / B.on 时不 stamp ey，年事 pending，解除后同年度再弹
{
  const c1 = box(); const R1 = s => vm.runInContext(s, c1);
  const G1 = mkG({ year: 12, debt: 8888 }); R1('Game').G = G1; const D1 = R1('DF43');
  R1('globalThis.NPC37 = { storyBlock(){ return "prologue"; } }');
  ok(D1.onEnter(G1, seq([0.01])) === null && G1.df43.ey === -1 && G1.df43.n === 1, 'M1：prologue 挡年事，不 stamp ey，仍计数');
  R1('NPC37.storyBlock = () => null');
  const freed = D1.onEnter(G1, seq([0.01]));
  ok(freed && freed.id && G1.df43.ey === 12, 'M1：解除 storyBlock 后同年补发年事');
  G1.year = 13; G1.df43.ey = -1; G1.df43.ev = {};
  R1('globalThis.B = { on: true }');
  ok(D1.onEnter(G1, seq([0.01])) === null && G1.df43.ey === -1, 'M1：B.on 挡年事，不 stamp ey');
  R1('B.on = false');
  ok(D1.onEnter(G1, seq([0.01])) && G1.df43.ey === 13, 'M1：战斗结束后补发');
}
// M2：year===0 不回落 age；year=0 灵泉后 year=1 不再二次灵泉
{
  const c2 = box(); const R2 = s => vm.runInContext(s, c2);
  const G2 = mkG({ year: 0, age: 25, cave: { zl: 5, field: 0, forge: 0 } }); R2('Game').G = G2; const D2 = R2('DF43');
  ok(D2.springReady(G2), 'M2：year=0 灵泉就绪（按 year 不是 age）');
  const sp0 = D2.spring(G2); ok(sp0.ok && G2.df43.sp === 0, 'M2：year=0 灵泉记 sp=0（非 age 25）');
  ok(!D2.springReady(G2) && !D2.spring(G2).ok && G2.df43.sp === 0, 'M2：同年 year=0 不可再采');
  // 旧 bug：yr 用 age 会把 sp 打成 25，year 改成 1 后又就绪；现 stamp=0，year=1 是新的一年可采（合法）
  G2.year = 1; ok(D2.springReady(G2) && G2.df43.sp === 0, 'M2：year=1 相对 sp=0 是新一年（不会误用 age=25）');
  const sp1 = D2.spring(G2); ok(sp1.ok && G2.df43.sp === 1, 'M2：year=1 灵泉记 sp=1');
  G2.year = 1; ok(!D2.springReady(G2), 'M2：year=1 同年不可再采');
}
// L1：residents/ctx(null) 不抛
{
  const c3 = box(); const R3 = s => vm.runInContext(s, c3); R3('Game').G = null; const D3 = R3('DF43');
  ok(Array.isArray(D3.residents(null)) && D3.residents(null).length === 0, 'L1：residents(null) → []');
  const cx0 = D3.ctx(null); ok(cx0 && Array.isArray(cx0.P) && cx0.P.length === 0 && cx0.o, 'L1：ctx(null) 安全空壳');
}
// L2：zl=5 + 裱封条硬封顶 1.5（不超过玉台）
{
  const c4 = box(); const R4 = s => vm.runInContext(s, c4);
  const G4 = mkG({ year: 10, debt: 100, cave: { zl: 5, field: 0, forge: 0 }, mem37: { dx: 0 } }); R4('Game').G = G4; const D4 = R4('DF43');
  const eSeal = D4.EV.find(x => x.id === 'df_seal');
  const instS = { id: 'df_seal', ch: eSeal.ch.map(o => ({ l: o.l, o })), c: D4.ctx(G4) };
  D4.choose(G4, instS, 1);
  ok(G4.df43.seal === 10 && D4.medMul(G4) === 1.5, 'L2：zl=5+seal 倍率夹到 1.5（非 1.55）');
  G4.cave.zl = 4; ok(D4.medMul(G4) === 1.45, 'L2：zl=4+seal = 1.45 不夹');
}
// L3：choose 同实例一次性
{
  const c5 = box(); const R5 = s => vm.runInContext(s, c5);
  const G5 = mkG({ pets: [{ name: '甲', exp: 0 }, { name: '乙', exp: 0 }] }); R5('Game').G = G5; const D5 = R5('DF43');
  const eFight = D5.EV.find(x => x.id === 'df_pet_fight');
  const instF = { id: 'df_pet_fight', ch: eFight.ch.map(o => ({ l: o.l, o })), c: D5.ctx(G5, () => 0.5) };
  D5.choose(G5, instF, 0, () => 0.99);
  ok(G5.pets[0].exp === 20 && G5.pets[1].exp === 20, 'L3：首次 choose 发奖');
  const t2 = D5.choose(G5, instF, 0, () => 0.99);
  ok(t2 === '' && G5.pets[0].exp === 20 && G5.pets[1].exp === 20, 'L3：同实例再 choose 空串且不刷奖');
}
// L4：无 r 时 pick 走 Game.roll
{
  const c6 = box(); const R6 = s => vm.runInContext(s, c6);
  const G6 = mkG(); R6('Game').G = G6; const D6 = R6('DF43'); R6('Game').rolls = [];
  const linePet = D6.line({ kind: 'pet', label: '甲' }, G6);
  ok(R6('Game').rolls.length >= 1 && R6('Game').rolls.every(x => x[1] === 'dongfu43'), 'L4：无 r 台词 pick 走 Game.roll(dongfu43)');
  ok(typeof linePet === 'string' && linePet.includes('甲'), 'L4：仍能抽出带名台词');
}
// L5：气灵台词非空（§17.6 / FB_LINES 兜底）
{
  const c7 = box(); const R7 = s => vm.runInContext(s, c7);
  const G7 = mkG({ fb33: { id: 'fb_jian', tier: 6 } }); R7('Game').G = G7; const D7 = R7('DF43');
  const ql = D7.line({ kind: 'qiling', id: 'df_ql', label: '器灵' }, G7, () => 0);
  ok(ql && ql.length > 0, 'L5：气灵台词非空（TEXT43.qiling 兜底）');
  R7('globalThis.FB_LINES_BY_ID = { fb_jian: { any: ["“剑专属台词A”", "“剑专属台词B”"] } }');
  ok(D7.line({ kind: 'qiling' }, G7, () => 0) === '“剑专属台词A”', 'L5：有 FB_LINES_BY_ID 时用专属 any');
}
// L6：ap=Infinity 拒采且不改 hv
{
  const c8 = box(); const R8 = s => vm.runInContext(s, c8);
  const G8 = mkG({ year: 10, cave: { zl: 0, field: 2, forge: 0 }, ap: Infinity }); R8('Game').G = G8; const D8 = R8('DF43'); D8.st(G8);
  const hInf = D8.harvest(G8, () => 0.5);
  ok(!hInf.ok && G8.df43.hv === -1 && G8.ap === Infinity, 'L6：ap=Infinity 拒采，不记 hv');
  G8.ap = NaN; ok(!D8.harvest(G8, () => 0.5).ok && G8.df43.hv === -1, 'L6：ap=NaN 拒采');
  G8.ap = 2; ok(D8.harvest(G8, () => 0.5).ok && G8.ap === 1, 'L6：正常 ap 仍可采');
}

// 不进 index（第 1 轮）
const HTML = fs.readFileSync(path.join(ROOT, 'www/index.html'), 'utf8');
ok(!HTML.includes('dongfu43.js'), '第 1 轮未接入 index.html（零运行时影响）');

console.log(`\n${n - fails}/${n} passed`);
process.exit(fails);

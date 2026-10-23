// NPC37 路遇第一块单测：node test/npc37_unit.js（退出码 = 失败数）。纯 JS，vm 桩 + 真实 life34.js（Game.apply 包装的 aff×0.5 同步）+ 真实 npc37.js。
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const JS = path.join(__dirname, '..', 'www', 'js');
const LIFE = fs.readFileSync(path.join(JS, 'life34.js'), 'utf8'), SRC = fs.readFileSync(path.join(JS, 'npc37.js'), 'utf8');
const JH = fs.readFileSync(path.join(JS, 'jianghu34.js'), 'utf8');
const sayLine = (JH.match(/^\s*say\(L, s, k, notable\) \{.*\},$/m) || [''])[0].trim().replace(/,$/, '');
function box() {
  const c = { console: { log() {}, error() {} }, Math: Object.create(Math) }; c.window = c; vm.createContext(c);
  vm.runInContext(`
    var REALMS=[{n:'凡人',need:80}];var QUESTS={},SECTS={},ASSETS={maps:{}};
    var ITEMS={wine:{n:'桃花酿'},hcd:{n:'回春丹'},bill:{n:'欠条'},fish:{n:'灵鱼'},ore:{n:'玄铁晶'},herb:{n:'灵草'},jadeg:{n:'暖玉'},key:{n:'钥匙'},pyd:{n:'培元丹'},scroll:{n:'残卷'},fan:{n:'折扇'},coin:{n:'古钱'},peach:{n:'蟠桃'}};
    var MAPINFO={market:{n:'云来坊市',mons:['slime'],tier:1},forest:{n:'青木林',mons:['treant'],tier:1}};
    var NPCS={jh_mozi:{n:'魔修·厉无咎',map:'forest'},jh_danniang:{n:'丹娘·苏半夏',map:'market'},ali:{n:'狐妖·阿离',map:'forest'},mentor:{n:'落魄剑仙',map:'market'},jh_jianke:{n:'游方剑客·萧十三',map:'market'},sumei:{n:'魔女·苏魅',map:'market'}};
    var R={ents:[],mapId:'market'};function t2p(i,j){return[i,j]}function s2w(x,y){return[x,y]}var pickAt=function(){return null};function walkable(){return true}function addEnt(){}function removeEnt(){}function loadSprite(){}var npcAI=function(){};
    var toasts=[];var UI={card:async()=>0,say:async()=>0,hud(){},toast(s){toasts.push(s)},modal:null};
    var JH34={FEED_MAX:40,_toasts:[],ensure(G){G.jh34=G.jh34||{t:0,feed:[],npcs:{}};return G.jh34}, ${sayLine}};
    var fights=[];
    var Game={G:null,save(){},async yearEnd(){},interactEnt(){},refreshNpcs(){},async enterMap(){},acceptQuest(){},canEnter(){return true},
      give(id,n){this.G.inv[id]=(this.G.inv[id]||0)+n}, has(id,n){return (this.G.inv[id]||0)>=n},
      async apply(eff){const G=this.G,out=[];for(let tk of eff.split(';')){tk=tk.trim();if(!tk)continue;let m;
        if((m=tk.match(/^(stone|karma)([+\\-])(\\d+)$/))){let v=+m[3];if(m[2]==='-')v=-v;if(m[1]==='stone'){if(v<0&&G.stone<-v)v=-G.stone;G.stone+=v}else G.karma+=v;out.push(tk);continue}
        const p=tk.split(':');if(p[0]==='aff'){G.aff[p[1]]=Math.max(0,Math.min(150,(G.aff[p[1]]||0)+ +p[2]))}else if(p[0]==='item'){const k=+p[2];if(k<0&&!this.has(p[1],-k))continue;this.give(p[1],k)}else if(p[0]==='fight')fights.push(p[1]);out.push(tk)}return out}};
  `, c);
  vm.runInContext(LIFE, c); vm.runInContext(SRC, c);
  vm.runInContext(`Game.G={year:10,age:30,stone:500,karma:0,aff:{},inv:{},flags:{},life34:{v:1,loc:{},rel:{},sect:{},log:[],seen:{},pending:null,qt:{},yc:null},jh34:{t:120,feed:[],npcs:{}}};`, c);
  return c;
}
(async () => {
  let c = box(); const N = c.NPC37, G = () => c.Game.G;
  ok(N && c.Story37 && typeof N.onMeet === 'function' && typeof N.schedule === 'function' && typeof N.emit === 'function', '导出 NPC37.onMeet/schedule/emit 与 Story37 总线');
  ok(Object.keys(N.TEXT.meet).join() === 'chou,sheng,you' && N.TEXT.meet.chou.length === 8 && Object.keys(N.TEXT.news).length === 6 && Object.keys(N.TEXT.lines).length === 17, 'TEXT37 与文案包 JSON 一致（3 档×8、6 类新闻、17 人台词）');
  const doc = fs.readFileSync(path.join(__dirname, '..', 'docs', 'research_story37_text.md'), 'utf8'); const dj = JSON.parse(doc.slice(doc.indexOf('```json') + 7, doc.lastIndexOf('```')));
  ok(JSON.stringify(dj) === JSON.stringify(N.TEXT), 'TEXT37 逐字等于 docs JSON');
  // 分档
  G().life34.rel = { jh_mozi: -40, ali: 39, mentor: 40, sumei: -39 };
  ok(N.tier('jh_mozi') === 'chou' && N.tier('ali') === 'sheng' && N.tier('mentor') === 'you' && N.tier('sumei') === 'sheng' && N.tier('jh_jianke') === 'sheng', '分档边界：−40 仇 / −39、39 生 / 40 友 / 无记录 生');
  // 路遇 + 填充
  const s1 = N.onMeet('mentor', 'market', { k: 0 });
  ok(s1 && s1.tier === 'you' && s1.title === '⚑ 路遇·落魄剑仙' && s1.t.indexOf('{n}') < 0 && s1.t.startsWith('落魄剑仙'), '友档场景：标题以⚑开头，{n} 已填');
  ok(G().npc37.q.length === 1 && G().life34.pending === null, '场景进自有队列 G.npc37.q，不碰 L.pending');
  // 地图冷却
  ok(N.onMeet('jh_danniang', 'market') === null && N.block('jh_danniang', 'market') === 'map', '同图 6 个月内第二次路遇被拦（map）');
  G().jh34.t = 125; ok(N.onMeet('jh_danniang', 'market') === null, '第 5 个月仍拦');
  G().jh34.t = 126; ok(!!N.onMeet('jh_danniang', 'market'), '满 6 个月可再遇');
  // 全年 ≤4
  ok(!!N.onMeet('ali', 'forest'), '另一张图不受冷却影响'); ok(!!N.onMeet('sumei', 'forest2'), '第 4 次');
  ok(N.onMeet('jh_jianke', 'm5') === null && N.block('jh_jianke', 'm5') === 'year', '全图每年第 5 次被拦（year）');
  // 跨年重置；地图冷却跨年仍按绝对月
  G().year = 11; G().jh34.t = 130;
  ok(N.st().yc.n === 0 && N.block('jh_jianke', 'market') === 'map' && N.block('jh_jianke', 'm5') === null, '跨年重置年计数，地图冷却按绝对月延续');
  // 每 NPC ≤2
  G().jh34.t = 200; N.onMeet('ali', 'a1'); N.onMeet('ali', 'a2');
  ok(N.block('ali', 'a3') === 'npc' && N.emit('jiechou', 'ali', 'jh_mozi') === null, '每 NPC 每年 ≤2 条（路遇+新闻合计）');
  // 仇档 + 仇家上门 / 追猎拦截
  G().year = 12; G().life34.pending = { npc: 'jh_mozi' };
  ok(N.onMeet('jh_mozi', 'forest') === null, '本年已是 life34 仇家上门对象 → 不出仇档路遇');
  G().life34.pending = null; c.Stage3 = { huntBlocksFoe: () => true };
  ok(N.onMeet('jh_mozi', 'forest') === null, 'Stage3.huntBlocksFoe 为真 → 不出仇档路遇'); delete c.Stage3;
  const sc = N.onMeet('jh_mozi', 'forest', { k: 5 });
  ok(sc && sc.tier === 'chou' && sc.ch.length === 3 && sc.ch[0].x === '给颗回春丹', '仇档场景 #6');
  // 置灰：没有回春丹
  ok(!N.can(sc.ch[0].fx) && (await N.resolve(sc, 0)).why === 'grey' && G().npc37.q.includes(sc), '物品不足 → 置灰，不结算、不出队');
  // aff 只改 G.aff，rel 由 life34 ×0.5 同步一次
  const r0 = G().life34.rel.jh_mozi; G().inv.hcd = 1;
  const rr = await N.resolve(sc, 0);
  ok(rr.ok && rr.eff === 'aff:jh_mozi:20;item:hcd:-1' && G().aff.jh_mozi === 20 && G().inv.hcd === 0, '回春丹选项：aff+20 写 G.aff、回春丹 −1');
  ok(G().life34.rel.jh_mozi - r0 === 10, 'L.rel 只由 life34 同步 +10（×0.5，不双加）');
  ok(!G().npc37.q.includes(sc), '结算后出队');
  // karma 叠加到现有 G.karma
  G().karma = 7; G().life34.rel.jh_mozi = -45; const sc2 = N.onMeet('jh_mozi', 'f2', { k: 5 }); await N.resolve(sc2, 1);
  ok(G().karma === 2 && G().aff.jh_mozi === 0, '「补一脚」karma −5 加到现有 G.karma（7→2），aff 夹到 0');
  // stone / fight
  G().year = 13; G().life34.rel.jh_mozi = -50; const sc3 = N.onMeet('jh_mozi', 'g1', { k: 0 }); const st0 = G().stone;
  await N.resolve(sc3, 1); ok(G().stone === st0 - 50, '赔五十灵石：stone −50');
  const sc4 = N.onMeet('jh_mozi', 'market', { k: 0 }); await N.resolve(sc4, 0); ok(c.fights.length === 1 && c.fights[0] === 'slime', 'fight:1 → 走 Game.apply 的 fight 效果');
  G().stone = 10; ok(!N.can({ stone: -50 }) && N.can({ stone: 5 }), '灵石不足也置灰');
  // 物品 id 均在 data.js
  const data = fs.readFileSync(path.join(JS, 'data.js'), 'utf8'); const used = new Set();
  for (const t in N.TEXT.meet) for (const s of N.TEXT.meet[t]) for (const o of s.ch) for (const k in (o.fx.item || {})) used.add(k);
  ok([...used].every(k => new RegExp('\\b' + k + '\\s*:\\s*\\{').test(data)), '场景物品 id 都在 data.js：' + [...used].join(','));
  // 新闻：≤6、toast ≤2、写入 jh34.feed 且 ≤40
  c = box(); const M = c.NPC37; const GG = c.Game.G; GG.jh34.feed = Array.from({ length: 39 }, (_, i) => ({ t: 0, s: 'old' + i, k: '' }));
  const P6 = ['jh_mozi', 'ali', 'mentor', 'sumei', 'jh_jianke', 'jh_danniang']; let got = 0; for (let i = 0; i < 30; i++) if (M.emit('jiechou', P6[i % 6], P6[(i + 1) % 6], 'market', { notable: true })) got++;
  ok(got === 6 && GG.npc37.yc.news === 6, '全年新闻 ≤6');
  ok(c.toasts.length === 2, 'toast ≤2');
  ok(GG.jh34.feed.length === 40 && GG.jh34.feed[39].k === 'npc37' && GG.jh34.feed[39].s.startsWith('【江湖风云】') && !/\{[abmn]/.test(GG.jh34.feed[39].s), '走 JH34.say 写入 feed，裁到 FEED_MAX=40，占位符已填');
  // topUp 补到 3
  GG.year = 11; const k = M.topUp(); ok(GG.npc37.yc.news === 3 && k === 3, '年新闻不足 3 条时 topUp 补到 3');
  // 100 年模拟：上限
  let bad = 0; for (let y = 20; y < 120; y++) { GG.year = y; GG.jh34.t = y * 12; for (let i = 0; i < 20; i++) { const ids = M.ids(); M.onMeet(ids[i % ids.length], 'm' + (i % 3)); M.emit('duobao', ids[i % ids.length], ids[(i + 1) % ids.length], 'market'); } M.topUp(); const Y = GG.npc37.yc; if (Y.n > 4 || Y.news > 6 || Y.news < 3 || Object.values(Y.per).some(v => v > 2)) bad++; }
  ok(bad === 0, '模拟 100 年：每年路遇 ≤4、新闻 3–6、每人 ≤2');
  // 总线 / schedule
  let ev = 0; c.Story37.on('meet', () => ev++); GG.year = 300; M.onMeet('ali', 'zz'); ok(ev === 1, 'Story37.on("meet") 收到事件');
  GG.jh34.npcs = { jh_mozi: { map: 'secret' } }; ok(M.schedule('jh_mozi') === 'secret' && M.schedule('ali') === 'forest' && M.schedule('nobody') === null, 'schedule：JH34 游历图 > NPCS.map');
  // 无存档
  c.Game.G = null; ok(M.onMeet('ali', 'x') === null && M.emit('tupo', 'ali') === null, '没有存档时安全返回 null');

  // ---------- 第二十五轮：正常游玩挂接 ----------
  c = box(); const H = c.NPC37, HG = c.Game.G; c.UI.stack = [];
  let cards = []; c.UI.card = async (t, x, por, opts) => { cards.push({ t, opts }); return opts.findIndex(o => !o.endsWith('（缺）')); };
  vm.runInContext("R.mode='map';R.mapId='market';R.player={i:10,j:10};", c);
  const ent = { kind: 'npc', id: 'mentor', i: 11.5, j: 11.2 }; const far = { kind: 'npc', id: 'jh_danniang', i: 13, j: 10 };
  c.npcAI(far, 0.016); ok(cards.length === 0 && HG.npc37 == null || (HG.npc37 && HG.npc37.yc.n === 0), '距离 3 格：不触发');
  c.npcAI(ent, 0.016); await new Promise(r => setTimeout(r, 10));
  ok(cards.length === 1 && cards[0].t === '⚑ 路遇·落魄剑仙', '正常游玩（无开发者模式）：同图距离≤2 走 npcAI 包裹自动弹「⚑ 路遇」卡');
  ok(cards[0].opts.every(o => o.startsWith('⚑ ')), '选项都带「⚑ 」前缀');
  const SAFE = /^(打坐（|★|✔|！|接受|继续|好|收下|交付|……|应战|带路|明白|谢|原来如此|伸手|去后巷|去看看|你说什么|撤|知道了|确定|抄起扫帚|开始|过年)/;
  const allOpts = []; for (const t in H.TEXT.meet) for (const sc of H.TEXT.meet[t]) for (const o of sc.ch) allOpts.push('⚑ ' + o.x);
  ok(allOpts.every(o => !SAFE.test(o)) && allOpts.some(o => SAFE.test(o.slice(2))), '全部 24 场景选项加前缀后都不匹配 ux23 SAFE（不加前缀时「收下」等会被自动选）');
  const ux = fs.readFileSync(path.join(JS, 'ux23.js'), 'utf8'); const m = ux.match(/^const SAFE = (\/.*\/);$/m);
  ok(m && allOpts.every(o => !eval(m[1]).test(o)), '对 ux23.js 里真实 SAFE 正则同样成立');
  ok(HG.npc37.q.length === 0 && HG.npc37.yc.n === 1, '卡片结算后出队，计 1 次');
  c.NPC37._t = 0; c.npcAI(ent, 0.016); ok(cards.length === 1, '同图冷却内再靠近不再触发');
  vm.runInContext("R.mapId='forest';", c); c.NPC37._t = 0; c.AUTO = { on: 'quest' }; const e2 = { kind: 'npc', id: 'ali', i: 10, j: 11 };
  c.npcAI(e2, 0.016); ok(cards.length === 1, '自动任务/挂机开着时不触发（不让挂机碰 ⚑）'); c.AUTO = { on: null };
  c.UI.stack = [{}]; c.NPC37._t = 0; c.npcAI(e2, 0.016); ok(cards.length === 1, '已有弹窗时不触发'); c.UI.stack = [];
  vm.runInContext("R.mode='battle';", c); c.NPC37._t = 0; c.npcAI(e2, 0.016); ok(cards.length === 1, '不在地图模式不触发'); vm.runInContext("R.mode='map';", c);
  e2.talking = 1; c.NPC37._t = 0; c.npcAI(e2, 0.016); ok(cards.length === 1, '正在对话的 NPC 不触发'); e2.talking = 0;
  c.NPC37._t = Date.now(); c.npcAI(e2, 0.016); ok(cards.length === 1, '节流 800ms 内不检查');
  c.NPC37._t = 0; c.npcAI(e2, 0.016); await new Promise(r => setTimeout(r, 10)); ok(cards.length === 2, '条件满足后在另一张图正常触发');
  // 正常游玩 100 年：每年都有人在身边，上限仍成立
  let bad2 = 0; const maps = ['market', 'forest', 'secret'];
  for (let y = 40; y < 140; y++) { HG.year = y; for (let mo = 0; mo < 12; mo++) { HG.jh34.t = y * 12 + mo; vm.runInContext(`R.mapId='${maps[mo % 3]}'`, c);
      for (const id of H.ids()) { c.NPC37._t = 0; c.npcAI({ kind: 'npc', id, i: 10.5, j: 10.5 }, 0.016); await null; } }
    await c.Game.yearEnd(); const Y = HG.npc37.yc; if (Y.n > 4 || Y.news > 6 || Y.news < 3 || Object.values(Y.per).some(v => v > 2)) bad2++;
  }
  ok(bad2 === 0, '正常游玩模拟 100 年（每月都贴脸）：每年路遇 ≤4、新闻 3–6、每人 ≤2');
  ok(HG.jh34.feed.length <= 40 && HG.jh34.feed.every(f => !/\{[abn]|\{map/.test(f.s)), 'feed ≤40 且无残留占位符');
  // 同图 6 月冷却在正常游玩下成立
  const S2 = HG.npc37; ok(Object.keys(S2.yc.map).length >= 1, '记录了地图冷却');
  // 年末包裹
  const n0 = HG.npc37.yc.news; HG.year = 500; await c.Game.yearEnd(); ok(HG.npc37.yc.yr === 500 && HG.npc37.yc.news >= 3 && HG.npc37.yc.news <= 6, 'Game.yearEnd 包裹：新的一年发 3–6 条新闻');
  // 源码约束
  ok(!/L\.pending\s*=|pending\.push|Life34\.rel\(/.test(SRC), '不写 L.pending、不直接调 Life34.rel（只经 G.aff 同步）');
  const idx = fs.readFileSync(path.join(JS, '..', 'index.html'), 'utf8'); ok(idx.indexOf('js/jianghu34.js') < idx.indexOf('js/npc37.js'), 'index.html 在 jianghu34.js 之后加载 npc37.js');
  { const dev = fs.readFileSync(path.join(JS, 'dev_openworld.js'), 'utf8'); // PR 分支（main）不带开发者「路遇」按钮；openworld-wip 才有
    if (/NPC37/.test(dev)) ok(/label: '路遇'/.test(dev) && /NPC37\.onMeet\(id, mapId, \{ force: true \}\)/.test(dev), '开发者面板有「路遇」强制触发按钮');
    else ok(!/NPC37|npc37/.test(dev), 'main 的 dev_openworld.js 不引用 NPC37（路遇只走正常游玩入口）'); }
  // 第二十八轮：真实 Game.apply 形状 { txt, later }，fight 延后到 later 里，路遇必须真的开战
  { const d = box(); const DN = d.NPC37, DG = d.Game; const log = [];
    DG.apply = async function (eff) { const later = []; const out = []; for (const tk of eff.split(';')) { const p = tk.split(':'); if (p[0] === 'aff') { this.G.aff[p[1]] = (this.G.aff[p[1]] || 0) + +p[2]; out.push('好感' + p[2]); } else if (p[0] === 'fight') later.push(() => this.fight(p[1], { tier: 1 })); } return { txt: out.join('，'), later }; };
    DG.fight = async function (mon) { log.push('fight:' + mon); return { res: this._res || 'win' }; };
    d.UI.toast = s => log.push('toast:' + s); d.UI.card = async () => 0; DG.G.life34.rel = { jh_mozi: -60 };
    const fev = []; DN.bus.on('fight', e => fev.push(e.res));
    const sa = DN.onMeet('jh_mozi', 'market', { k: 0, force: true }); const ra = await DN.play(sa);
    ok(ra && ra.ok && ra.fight === 'win' && log.filter(x => x === 'fight:slime').length === 1, 'fight:1 在真实 apply 形状下真的调用 Game.fight（当前图怪）一次');
    ok(log.indexOf('toast:好感-5') >= 0 && log.indexOf('toast:好感-5') < log.indexOf('fight:slime'), '先提示效果，再开战');
    ok(log.some(x => x === 'toast:路遇一战：击退来敌') && fev.join() === 'win', '战后提示胜负并发 Story37 fight 事件');
    DG._res = 'lose'; log.length = 0; DG.G.year++; const sb = DN.onMeet('jh_mozi', 'forest', { k: 0, force: true }); const rb = await DN.play(sb);
    ok(rb && rb.fight === 'lose' && log.indexOf('fight:treant') >= 0 && log.some(x => x === 'toast:路遇一战：落了下风'), '输了也结算并提示，怪取场景所在图');
    log.length = 0; DG.G.dead = true; DG.G.year++; const sc = DN.onMeet('jh_mozi', 'market', { k: 0, force: true }); const rc = sc ? await DN.resolve(sc, 0) : null; DG.G.dead = false;
    ok(!sc || (rc && rc.ok && !log.some(x => /^fight:/.test(x))), '角色已死不再开延后的战斗');
    const s3 = DN.onMeet('jh_mozi', 'market', { k: 0, force: true }); DG.G.year++; const sd = DN.onMeet('ali', 'market', { force: true }); if (sd) { const pick = sd.ch.findIndex(o => !o.fx.fight && DN.can(o.fx)); log.length = 0; const rd = await DN.resolve(sd, pick); ok(rd.ok && rd.fight === null && !log.some(x => /^fight:/.test(x)), '无 fight 选项不开战，fight 为 null'); } else ok(true, '无 fight 选项（本年额度已满，跳过）');
    void s3; }
  console.log(`${n - fails}/${n} PASS`); process.exit(fails);
})();

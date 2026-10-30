// ======================= 3.8.3 家族深化 clan41（规格 docs/research_v41_clan.md + docs/research_v22.md §14；§14 优先） =======================
// 新模块，包裹 fam37（不改 fam37.js 本体）。存档 G.clan41 惰性兜底，不升 G.v；G.fam37 / G.heir / G.apprentice 语义不动。
// 接入：Game.yearEnd / UI.p_fam37 / FAM37.birth / Sys.bonus / Game.newLife / UI.useItem / DevPanel；注册 NPCS.c41_sp 与 FAM37.SP_LG.c41_sp；KID_MAX getter。
// 依赖：fam37（必需）；route37 / items40 / profile38 可缺省。加载顺序：须在 items40 之后（index 放 audio32 前）；useItem 包装顺序无关（会抢回最外层）。
'use strict';
const TEXT41 = JSON.parse(JSON.stringify({
  lv: [
    { lv: 1, n: '寒门', rep: 0, realm: 0, d: '立族：持有空白族谱 i40_jiapu 或 有道侣/子嗣≥1', ruleSlots: 1, propSlots: 3, yieldMul: 1.0, fx: { cult: 0.005 } },
    { lv: 2, n: '小户', rep: 100, realm: 1, d: '族人≥2', ruleSlots: 1, propSlots: 4, yieldMul: 1.05, fx: { cult: 0.01 } },
    { lv: 3, n: '乡绅', rep: 300, realm: 2, d: '族人≥3，筑基', ruleSlots: 1, propSlots: 5, yieldMul: 1.1, fx: { cult: 0.015 } },
    { lv: 4, n: '望族', rep: 700, realm: 2, d: '族产≥2', ruleSlots: 2, propSlots: 6, yieldMul: 1.15, fx: { cult: 0.02 } },
    { lv: 5, n: '豪门', rep: 1500, realm: 3, d: '金丹，族人≥4', ruleSlots: 2, propSlots: 7, yieldMul: 1.2, fx: { cult: 0.025 } },
    { lv: 6, n: '世家', rep: 3000, realm: 3, d: '族产≥3，任一子嗣筑基', ruleSlots: 2, propSlots: 8, yieldMul: 1.25, fx: { cult: 0.03 } },
    { lv: 7, n: '名门', rep: 6000, realm: 4, d: '元婴，联姻≥1', ruleSlots: 2, propSlots: 9, yieldMul: 1.3, fx: { cult: 0.035 } },
    { lv: 8, n: '大族', rep: 12000, realm: 5, d: '化神，族产≥5', ruleSlots: 3, propSlots: 10, yieldMul: 1.35, fx: { cult: 0.04 } },
    { lv: 9, n: '仙族', rep: 25000, realm: 6, d: '渡劫，族人≥6', ruleSlots: 3, propSlots: 10, yieldMul: 1.4, fx: { cult: 0.045 } },
    { lv: 10, n: '万古仙族', rep: 50000, realm: 6, d: '渡劫圆满或已立继承人且其金丹', ruleSlots: 3, propSlots: 10, yieldMul: 1.45, fx: { cult: 0.05 } }
  ],
  props: [
    { id: 'tian', n: '良田', cost: 3000, d: '灵石+150/年；灵草×2', yield: 'stone:150;item:herb:2', lvReq: 1, upMax: 3 },
    { id: 'yaoyuan', n: '药园', cost: 6000, d: '灵草×3、千年灵芝 15%', yield: 'item:herb:3;roll:0.15:item:lz:1', lvReq: 2, upMax: 3 },
    { id: 'kuang', n: '灵矿', cost: 12000, d: '灵石+600/年、矿石×2', yield: 'stone:600;item:ore:2', lvReq: 3, upMax: 3 },
    { id: 'jiusi', n: '酒坊', cost: 4000, d: '灵石+200/年、老酒×1', yield: 'stone:200;item:i40_laojiu:1', lvReq: 1, upMax: 3 },
    { id: 'shufang', n: '书坊', cost: 5000, d: '族人修炼+3%；10% 得功法卷轴', yield: 'clanCult:0.03;roll:0.1:item:scroll:1', lvReq: 2, upMax: 3 },
    { id: 'biaoju', n: '镖局', cost: 8000, d: '灵石+400/年；每年 15% 触发劫镖事件', yield: 'stone:400;ev:c41_robbed:0.15', lvReq: 3, upMax: 3 },
    { id: 'dangpu', n: '当铺', cost: 10000, d: '灵石+300/年；天道利息 -2%', yield: 'stone:300;rate:-0.02', lvReq: 4, upMax: 3 },
    { id: 'lingchi', n: '灵兽池', cost: 9000, d: '灵宠经验+100/年', yield: 'petexp:100', lvReq: 3, upMax: 3 },
    { id: 'wuguan', n: '武馆', cost: 7000, d: '家主攻击+1%/级；声望+30/年', yield: 'rep:30;compAtk:0.01', lvReq: 4, upMax: 3 },
    { id: 'citang', n: '宗祠', cost: 15000, d: '声望+80/年；族规可多选 1 条', yield: 'rep:80;ruleSlot:1', lvReq: 5, upMax: 3 },
    { id: 'fangshi', n: '坊市铺面', cost: 20000, d: '灵石+1000/年；受市场年景浮动 ±30%', yield: 'var:0.3;stone:1000', lvReq: 6, upMax: 3 },
    { id: 'dongtian', n: '洞天福地', cost: 60000, d: '族人修炼+8%，寿元+5%', yield: 'clanCult:0.08;life:0.05', lvReq: 8, upMax: 3 }
  ],
  rules: [
    { id: 'qinxue', n: '勤学', pro: '族人修炼+6%', con: '族产年产-10%' },
    { id: 'zhongshang', n: '重商', pro: '族产年产+15%', con: '族人修炼-4%，声望-10/年' },
    { id: 'shangwu', n: '尚武', pro: '家主攻击+3%，劫镖必胜', con: '每年 10% 族人受伤（养伤 1 年）' },
    { id: 'renhou', n: '仁厚', pro: 'karma+2/年，正道宗门声望+2/年', con: '灵石年产-8%' },
    { id: 'tieqi', n: '铁律', pro: '族人叛离概率归零', con: '子嗣婚配成功率-10%' },
    { id: 'kaizhi', n: '开枝', pro: '子嗣降生概率+20%，KID_MAX 4→6', con: '每多一名子嗣，年开销+200灵石' },
    { id: 'lianyin', n: '广结', pro: '婚配成功率+20%', con: '嫁娶聘礼 ×1.5' },
    { id: 'yinshi', n: '隐世', pro: '家族负面事件-50%', con: '声望增长-50%，不能联姻高于自身等级的家族' },
    { id: 'moxiu', n: '魔道传家', pro: '家主攻击+4%，魔殿声望+5/年', con: 'karma-3/年，正道宗门声望-3/年' },
    { id: 'haiqian', n: '还债为本', pro: '天道利息-2%', con: '族产 20% 自动拿去还债' }
  ],
  fams: [
    { id: 'wang', n: '桃花王氏', sn: '王', lv: 1, rule: 'renhou', d: '王大爷家，门槛低，人实在', wantLg: ['*'], por: 'npc_girl' },
    { id: 'lin', n: '临安林氏', sn: '林', lv: 3, rule: 'qinxue', d: '剑修世家，看重灵根', wantLg: ['tian', 'shuang'], por: 'npc_girl' },
    { id: 'qian', n: '钱塘钱氏', sn: '钱', lv: 4, rule: 'zhongshang', d: '钱多多的本家，彩礼开价离谱', wantLg: ['*'], por: 'npc_girl' },
    { id: 'bai', n: '百草白氏', sn: '白', lv: 4, rule: 'renhou', d: '药王后人，喜好行善者', wantLg: ['*'], por: 'npc_girl' },
    { id: 'yun', n: '青云云氏', sn: '云', lv: 5, rule: 'tieqi', d: '掌门云中鹤家族，需青云宗声望≥40', wantLg: ['san', 'shuang', 'tian'], por: 'npc_girl' },
    { id: 'su', n: '魔都苏氏', sn: '苏', lv: 6, rule: 'moxiu', d: '苏魅的远亲，karma≤-20 才看得上你', wantLg: ['*'], por: 'npc_girl' },
    { id: 'leng', n: '广寒冷氏', sn: '冷', lv: 7, rule: 'yinshi', d: '冰灵根世家，极难攀附', wantLg: ['bing'], por: 'npc_girl' },
    { id: 'long', n: '东海敖氏', sn: '敖', lv: 8, rule: 'shangwu', d: '龙族，只与有龙宫恩情者联姻', wantLg: ['lei', 'shuang'], por: 'npc_girl' }
  ],
  marry: {
    kidAge: 16,
    lines: {
      ask: ['{fam}的媒人登门：“我家{who}，年方{age}，与贵府{k}正是良配。”', '你递上烫金请柬，{fam}家主捋须沉吟。'],
      yes: ['{fam}应下了婚事，聘礼抬了三条街。', '“好！从今往后，两家就是一家人——债也是。”'],
      no: ['{fam}家主客气地端起了茶：“送客。”', '“贵府门第……再修几年吧。”']
    }
  },
  events: [
    { id: 'c41_harvest', t: '{prop}今年大丰收，族人请你主持丰收祭。', ch: [['主持祭典', { stoneRaw: -100, rep: 50, karma: 1 }], ['收钱就好', { stoneRaw: 200 }]] },
    { id: 'c41_robbed', t: '镖局的镖车在半路被劫，镖师带伤逃回。', ch: [['亲自去追', { fight: 1, stoneRaw: 300 }], ['赔钱了事', { stoneRaw: -400, rep: 20 }], ['报官（宗门）', { srep: 5 }]], cond: 'prop:biaoju', bad: 1 },
    { id: 'c41_kidfight', t: '{k}与邻家孩子打架，把人家门牙打掉了。', ch: [['上门赔罪', { stone: -150, karma: 2 }], ['护短', { rep: -30, karma: -2 }], ['让{k}自己去道歉', { rep: 20 }]], cond: 'kids', bad: 1 },
    { id: 'c41_matchmaker', t: '媒婆踏破门槛，三家同时来给{k}说亲。', ch: [['挑最有钱的', { stone: 500, rep: -20 }], ['挑灵根最好的', { match: 0.2 }], ['孩子还小', {}]], cond: 'kidAge16' },
    { id: 'c41_ancestor', t: '清明扫墓，祖坟上冒出一缕青烟。', ch: [['上香', { karma: 2, rep: 30 }], ['请人看风水', { stone: -300, luck: 1 }]] },
    { id: 'c41_debtor', t: '远房亲戚拖家带口来投奔，说是欠了天道的债躲不下去了。', ch: [['收留', { karma: 3, stone: -200, pop: 1 }], ['给点钱打发', { stone: -100 }], ['关门', { karma: -2 }]] },
    { id: 'c41_split', t: '两房族人为分家产吵得不可开交。', ch: [['一碗水端平', { stone: -300, rep: 20 }], ['按族规办', { rep: 40 }, 'rule:tieqi'], ['随他们去', { rep: -50 }]], cond: 'pop3', bad: 1 },
    { id: 'c41_genius', t: '族学里冒出一个神童，先生说百年难遇。', ch: [['重点栽培', { stone: -500, clanCult: 0.02 }], ['送去宗门', { srep: 10, rep: 60 }]], cond: 'prop:shufang' },
    { id: 'c41_fire', t: '{prop}半夜走水。', ch: [['冲进去救', { karma: 3, hpPct: -0.2 }], ['只救账本', { stoneRaw: -200 }], ['认了', { propDmg: 1 }]], bad: 1 },
    { id: 'c41_marryrival', t: '{fam}与仇家联姻，扬言要压你一头。', ch: [['送重礼拉拢', { stone: -800, famRel: 20 }], ['正面硬刚', { fight: 1, rep: 80 }], ['无视', {}]], bad: 1 },
    { id: 'c41_tiandao', t: '天道讨债司派人来查族产：“家大业大，利息得涨。”', ch: [['交保护费', { stone: -600 }], ['据理力争', { rate: 0.02, rep: 30 }], ['把人打出去', { fight: 'tianbing', debt: 2000, rep: 100 }]], bad: 1 },
    { id: 'c41_spouse_gift', t: '{sp}的娘家送来年礼。', ch: [['回礼', { stone: -200, aff: { '@sp': 10 } }], ['收下', { aff: { '@sp': -3 }, stone: 300 }]], cond: 'sp' },
    { id: 'c41_feast', t: '家族百年宴，四方宾客云集。', ch: [['大办', { stone: -2000, rep: 300 }], ['小办', { stone: -500, rep: 80 }], ['不办', { rep: -50 }]], cond: 'lv5' },
    { id: 'c41_traitor', t: '族中有人勾结外人，偷了族谱副本。', ch: [['清理门户', { rep: 50, karma: -1, pop: -1 }], ['网开一面', { karma: 2, rep: -30 }]], cond: 'pop4', bad: 1 },
    { id: 'c41_beggar', t: '一个老乞丐在宗祠前坐了三天，说他是你家老祖。', ch: [['请进门', { karma: 3, roll: '0.3:item:i40_zupu_old:1' }], ['赶走', { karma: -1 }]] },
    { id: 'c41_flood', t: '大水冲了良田。', ch: [['赈济佃户', { stoneRaw: -400, karma: 4, rep: 50 }], ['趁机低价收地', { stoneRaw: -200, karma: -4, prop: 'tian' }]], cond: 'prop:tian', bad: 1 },
    { id: 'c41_kidbrk', t: '{k}闭关冲击瓶颈，求你护法。', ch: [['亲自护法', { kidBrk: 0.2 }], ['给丹药', { item: { zjd: -1 }, kidBrk: 0.3 }], ['让他自己来', {}]], cond: 'kids' },
    { id: 'c41_heir', t: '族老们催你立下继承人。', ch: [['立长子', { heir: 'eldest', rep: 30 }], ['立灵根最好者', { heir: 'bestLg' }], ['再看看', { rep: -10 }]], cond: 'kids2' },
    { id: 'c41_alliance', t: '{fam}提议两族结盟，共抗魔患。', ch: [['结盟', { famRel: 30, srep: 5 }], ['婉拒', {}]] },
    { id: 'c41_mine', t: '灵矿挖出一块会说话的石头：“放我出去，我给你指个大矿。”', ch: [['放它走', { karma: 2, roll: '0.5:stone:3000' }], ['卖给鬼市', { stone: 1500, karma: -1 }], ['做成镇族之宝', { rep: 200 }]], cond: 'prop:kuang' },
    { id: 'c41_lifeend', t: '族中最年长的老人寿元将尽，想再见你一面。', ch: [['回去送终', { karma: 3, rep: 40 }], ['寄一封信', { karma: 1 }]], cond: 'pop3' }
  ],
  ui: { tabs: ['概览', '族产', '族规', '婚配', '族谱', '大事记'], lvUp: '{clan}晋为「{n}」！祠堂的牌匾换了新漆。', noProp: '尚无族产。地契可在市场拍卖或事件中获得。' },
  ui2: {
    found: ['{clan}今日开祠立谱。族谱第一页写着你的名字，第二页写着你欠天道的数。', '你在空白族谱上落笔，「{clan}」三个字墨还没干，天道讨债司的贺帖先到了。'],
    propBuy: '置下{prop}一处。账房先生说：“回本得{y}年，修仙的人等得起。”',
    propUp: '{prop}扩建到 {L} 级。',
    propFull: '族产槽位已满。升家族等级才能再置产。',
    yield: '族产年结：灵石 +{s}，声望 +{r}{items}。',
    yieldBad: '坊市年景不好，铺面只收了往年七成。',
    yieldGood: '坊市年景大好，铺面多赚了三成。',
    haiqian: '族产两成（{s} 灵石）拿去还了天道。账房先生在账本上画了一个哭脸。',
    ruleSet: '祠堂新挂一块牌子：「{rule}」。',
    ruleDrop: '「{rule}」的牌子摘了下来。族老们议论了一整年。（声望 −50）',
    ruleCd: '族规五年一换，还要等 {y} 年。',
    ruleLock: '与「{rule}」相冲，不能同挂。',
    kidUp: '{k}修为精进，至{realm}{stage}。',
    kidBrkOk: ['{k}破关而出，踏入{realm}！族人在祠堂外放了一挂鞭炮。', '{k}冲关成功，第一件事是问你：“那笔债现在算我的了吗？”'],
    kidBrkNo: ['{k}冲关失败，吐了口血，说下次一定。', '{k}闭关三月，出来只说了一句：“瓶颈是真的颈。”'],
    kidCap: '{k}的修为已追到你身后一步，再往前就得等你先走。',
    kidHurt: '{k}在演武场伤了筋骨，要养一年。',
    grand: ['{k}家添了个孙辈，族谱又多写了一行。', '孙辈出生，你被叫了一声“老祖”，第一次觉得自己老了。'],
    famGift: '{fam}送来年礼：{g}。',
    wedRefund: '对方把聘礼退回了一半，另一半说是茶水钱。',
    divorce: '与{fam}的婚事散了。两家从此见面只点头。（声望 −200）',
    heir: '族老当众宣读：立{k}为{clan}继承人。{k}接过族印，掂了掂：“比想象中轻，债比想象中重。”',
    spWed: '你与{fam}的{n}成亲。没有命中注定，只有两本族谱和一摞聘礼单。',
    lockMen: '门第悬殊，媒人连门都不敢敲。',
    lockKarma: '{fam}打听过你的为人，婉拒了。',
    lockSect: '{fam}要先看你在青云宗的名声。',
    lockLg: '{fam}只与冰灵根结亲。',
    lockLong: '敖氏还不认识你。先结个盟再说。',
    redLine: '🧵 月老红线 +30%（提亲即用掉）',
    lianhun: '持联姻帖提亲：门第与家规一概不论，成不成看缘分。',
    noClan: '尚未立族。有道侣或子嗣，或持空白族谱，即可开祠立谱。',
    reborn: '你记得上一世的{clan}，最后做到了「{n}」。这一世，族谱又是一张白纸。'
  }
}));

const C41 = {
  T: TEXT41,
  MUTEX: { moxiu: 'renhou', renhou: 'moxiu', zhongshang: 'yinshi', yinshi: 'zhongshang' },
  BAD: { c41_robbed: 1, c41_kidfight: 1, c41_split: 1, c41_fire: 1, c41_marryrival: 1, c41_tiandao: 1, c41_traitor: 1, c41_flood: 1 },
  CLAN_ITEMS: ['i40_jiapu', 'i40_zuxun', 'i40_dici', 'i40_ditu', 'i40_zupu_old', 'i40_lianhun'],
  G() { return typeof Game !== 'undefined' ? Game.G : null; },
  ensure(G) {
    G = G || this.G(); if (!G) return null;
    const C = G.clan41 = G.clan41 || {};
    if (!C.v) C.v = 1;
    if (C.on == null) C.on = 0;
    if (C.name == null) C.name = '';
    if (C.lv == null) C.lv = 1;
    if (C.rep == null) C.rep = 0;
    if (C.pop == null) C.pop = 0;
    if (!C.props || typeof C.props !== 'object') C.props = {};
    if (!Array.isArray(C.rules)) C.rules = [];
    if (C.ruleY == null) C.ruleY = -99;
    if (!C.fams || typeof C.fams !== 'object') C.fams = {};
    if (!Array.isArray(C.wed)) C.wed = [];
    if (C.grand == null) C.grand = 0;
    if (C.heirIdx == null) C.heirIdx = -1;
    if (C.rate == null) C.rate = 0;
    if (C.extraSlot == null) C.extraSlot = 0;
    if (C.spInfo === undefined) C.spInfo = null;
    if (!C.ev || typeof C.ev !== 'object') C.ev = {};
    if (!C.evY || typeof C.evY !== 'object') C.evY = {};
    if (C.yr == null) C.yr = 0;
    if (!Array.isArray(C.log)) C.log = [];
    if (!C.first || typeof C.first !== 'object') C.first = {};
    if (C.cult == null) C.cult = 0;
    if (C.matchB == null) C.matchB = 0;
    if (!C.dmgY || typeof C.dmgY !== 'object') C.dmgY = {};
    if (C.zupuUsed == null) C.zupuUsed = 0;
    if (C.lianhun == null) C.lianhun = 0;
    if (!C.grandBy || typeof C.grandBy !== 'object') C.grandBy = {};
    if (C.pendingEv === undefined) C.pendingEv = null;
    return C;
  },
  pick(a, rnd) { rnd = rnd || Math.random; return a[Math.floor(rnd() * a.length)]; },
  fill(s, o) { if (!s) return ''; return String(s).replace(/\{(\w+)\}/g, (_, k) => (o && o[k] != null ? o[k] : '')); },
  toast(s, c) { try { if (typeof UI !== 'undefined' && UI.toast) UI.toast(s, c || '#ffd27a'); } catch (e) {} },
  // 序章/新手指引/战斗中不弹族事卡（对齐 NPC37.storyBlock + B.on）
  busy() {
    try { if (typeof NPC37 !== 'undefined' && NPC37.storyBlock && NPC37.storyBlock()) return true; } catch (e) {}
    try { if (typeof B !== 'undefined' && B && B.on) return true; } catch (e) {}
    return false;
  },
  tryFlush(G) {
    G = G || this.G(); const C = this.ensure(G); if (!C || !C.pendingEv || this.busy()) return false;
    const id = C.pendingEv.id; C.pendingEv = null;
    Promise.resolve().then(() => this.runEvent(G, id)).catch(e => console.warn('clan41 flush', e));
    return true;
  },
  news(G, s) {
    const C = this.ensure(G); if (!C) return;
    C.log.unshift({ y: G.year || 0, s }); C.log.length = Math.min(C.log.length, 24);
    try { if (typeof FAM37 !== 'undefined' && FAM37.news) FAM37.news(G, s); } catch (e) { console.warn('clan41 news', e); }
  },
  has(rule) { const C = this.ensure(); return !!(C && C.rules && C.rules.indexOf(rule) >= 0); },
  famDef(id) { return TEXT41.fams.find(f => f.id === id); },
  propDef(id) { return TEXT41.props.find(p => p.id === id); },
  ruleDef(id) { return TEXT41.rules.find(r => r.id === id); },
  lvDef(lv) { return TEXT41.lv[Math.max(0, Math.min(9, (lv || 1) - 1))]; },
  popCount(G) {
    G = G || this.G(); const C = this.ensure(G); if (!C) return 0;
    const F = G.fam37 || {}; const sp = !!(F.sp || G.partner); const kids = (F.kids || []).length;
    return 1 + (sp ? 1 : 0) + kids + (C.pop || 0);
  },
  propCount(C) { C = C || this.ensure(); return C ? Object.keys(C.props || {}).filter(k => (C.props[k] | 0) >= 1).length : 0; },
  wedCount(C) { C = C || this.ensure(); return C ? (C.wed || []).filter(w => w && !w.div).length : 0; },
  kidRealmMax(G) { return Math.max(0, (G.realm || 0) - 1); },
  isShijia(G) { try { return !!(G && G.route37 && G.route37.id === 'shijia'); } catch (e) { return false; } },
  routeRep(k) {
    try {
      if (typeof Route37 !== 'undefined' && Route37.rep) return Route37.rep(k) || 0;
      const G = this.G(); if (!G || !G.route37 || !G.route37.rep) return 0;
      return G.route37.rep[k] || 0;
    } catch (e) { return 0; }
  },
  repAdd(k, n) {
    const G = this.G(); if (!G || !k || !n) return;
    G.route37 = G.route37 || { rep: {} }; G.route37.rep = G.route37.rep || {};
    G.route37.rep[k] = Math.max(-100, Math.min(100, (G.route37.rep[k] || 0) + n));
  },
  addRep(C, n, G) {
    if (!n) return; G = G || this.G();
    if (n > 0) {
      let m = n;
      if (this.has('yinshi')) m = Math.round(m * 0.5);
      if (this.isShijia(G)) m = Math.round(m * 1.2);
      C.rep = Math.max(0, (C.rep || 0) + m);
    } else C.rep = Math.max(0, (C.rep || 0) + n);
  },
  canFound(G) {
    G = G || this.G(); const C = this.ensure(G); if (!C || C.on) return false;
    if (this.isShijia(G)) return true;
    const F = G.fam37 || {};
    if (F.sp || G.partner || (F.kids && F.kids.length)) return true;
    try { if (typeof Game !== 'undefined' && Game.has && Game.has('i40_jiapu')) return true; } catch (e) {}
    return false;
  },
  found(G, quiet) {
    G = G || this.G(); const C = this.ensure(G); if (!C || C.on) return false;
    C.on = 1; C.name = (G.surname || '某') + '氏'; C.lv = Math.max(1, C.lv || 1);
    const line = this.fill(this.pick(TEXT41.ui2.found), { clan: C.name });
    if (!quiet) { this.news(G, line); this.toast(line, '#ffe680'); }
    return true;
  },
  ruleSlots(C) {
    C = C || this.ensure(); if (!C) return 1;
    const base = (this.lvDef(C.lv).ruleSlots || 1) + (C.props.citang ? 1 : 0) + (C.extraSlot ? 1 : 0);
    return Math.min(4, base);
  },
  propSlots(C) { C = C || this.ensure(); return C ? (this.lvDef(C.lv).propSlots || 3) : 3; },
  yieldMul(C) { return (this.lvDef(C.lv) || TEXT41.lv[0]).yieldMul || 1; },
  stoneMod(G, C) {
    let m = 0;
    if (this.has('qinxue')) m -= 0.10;
    if (this.has('zhongshang')) m += 0.15;
    if (this.has('renhou')) m -= 0.08;
    try { if (G.mingge && G.mingge.indexOf('caimi') >= 0) m += 0.05; } catch (e) {}
    // NPC 命格：道侣 + kids
    try {
      const mgs = [];
      if (typeof PF38 !== 'undefined' && G.partner) { const h = PF38.hid && PF38.hid(G.partner); if (h && h.mg) mgs.push(h.mg); }
      const kids = (G.fam37 && G.fam37.kids) || [];
      for (const k of kids) if (k && k.mg) mgs.push(k.mg);
      for (const mg of mgs) { if (mg === 'n_jucai') m += 0.08; if (mg === 'n_pocai') m -= 0.05; }
    } catch (e) {}
    return Math.max(-0.4, Math.min(0.5, m));
  },
  clanCult(G, C) {
    C = C || this.ensure(G); if (!C) return 0;
    let v = (this.lvDef(C.lv).fx && this.lvDef(C.lv).fx.cult) || 0;
    const L = (id) => (C.props[id] | 0);
    v += 0.03 * L('shufang') + 0.08 * L('dongtian');
    if (this.has('qinxue')) v += 0.06;
    if (this.has('zhongshang')) v -= 0.04;
    v += Math.min(0.10, C.cult || 0);
    return v;
  },
  atkBonus(G, C) {
    C = C || this.ensure(G); if (!C || !C.on) return 0;
    let v = 0.01 * (C.props.wuguan | 0);
    if (this.has('shangwu')) v += 0.03;
    if (this.has('moxiu')) v += 0.04;
    return v;
  },
  lifeBonus(G, C) {
    C = C || this.ensure(G); if (!C || !C.on) return 0;
    return 0.05 * (C.props.dongtian | 0);
  },
  // ---- 等级 ----
  canLv(G, lv) {
    G = G || this.G(); const C = this.ensure(G); if (!C || !C.on) return false;
    const D = this.lvDef(lv); if (!D) return false;
    if ((C.rep || 0) < D.rep) return false;
    if ((G.realm || 0) < D.realm) return false;
    const pop = this.popCount(G), pc = this.propCount(C), wc = this.wedCount(C);
    const kids = (G.fam37 && G.fam37.kids) || [];
    if (lv === 2) return pop >= 2;
    if (lv === 3) return pop >= 3;
    if (lv === 4) return pc >= 2;
    if (lv === 5) return pop >= 4;
    if (lv === 6) return pc >= 3 && kids.some(k => (k.realm || 0) >= 2);
    if (lv === 7) return wc >= 1;
    if (lv === 8) return pc >= 5;
    if (lv === 9) return pop >= 6;
    if (lv === 10) {
      const heirOk = C.heirIdx >= 0 && kids[C.heirIdx] && (kids[C.heirIdx].realm || 0) >= 3;
      return (G.stage === 3) || heirOk;
    }
    return true; // lv1
  },
  checkLv(G) {
    G = G || this.G(); const C = this.ensure(G); if (!C || !C.on) return 0;
    if (C.lv >= 10) return 0;
    const next = C.lv + 1;
    if (!this.canLv(G, next)) return 0;
    C.lv = next;
    const D = this.lvDef(C.lv);
    const line = this.fill(TEXT41.ui.lvUp, { clan: C.name || '本族', n: D.n });
    this.news(G, line); this.toast(line, '#ffe680');
    return 1;
  },
  // ---- 立族门槛检查（用于古族谱跳级）----
  canJumpLv(G, to) {
    G = G || this.G(); const D = this.lvDef(to); if (!D) return false;
    return (G.realm || 0) >= D.realm;
  },
  // ---- 族产 ----
  canBuyProp(G, id) {
    G = G || this.G(); const C = this.ensure(G); const P = this.propDef(id);
    if (!C || !C.on || !P) return { ok: 0, why: TEXT41.ui2.noClan };
    if (C.props[id]) return { ok: 0, why: '已有' + P.n };
    if (C.lv < P.lvReq) return { ok: 0, why: '需家族 Lv' + P.lvReq };
    if (this.propCount(C) >= this.propSlots(C)) return { ok: 0, why: TEXT41.ui2.propFull };
    if ((G.stone || 0) < P.cost) return { ok: 0, why: '灵石不足' };
    return { ok: 1 };
  },
  buyProp(G, id) {
    const r = this.canBuyProp(G, id); if (!r.ok) { this.toast(r.why); return false; }
    const C = this.ensure(G); const P = this.propDef(id);
    G.stone -= P.cost; C.props[id] = 1;
    const y = Math.max(1, Math.round(P.cost / Math.max(1, this._baseStone(P))));
    const line = this.fill(TEXT41.ui2.propBuy, { prop: P.n, y });
    this.news(G, line); this.toast(line); return true;
  },
  _baseStone(P) {
    const m = /stone:(\d+)/.exec(P.yield || ''); return m ? +m[1] : 0;
  },
  canUpProp(G, id) {
    G = G || this.G(); const C = this.ensure(G); const P = this.propDef(id);
    if (!C || !C.on || !P || !C.props[id]) return { ok: 0, why: '无此族产' };
    const L = C.props[id] | 0; if (L >= (P.upMax || 3)) return { ok: 0, why: '已满级' };
    const cost = P.cost * L;
    if ((G.stone || 0) < cost) return { ok: 0, why: '灵石不足（需' + cost + '）' };
    return { ok: 1, cost };
  },
  upProp(G, id) {
    const r = this.canUpProp(G, id); if (!r.ok) { this.toast(r.why); return false; }
    const C = this.ensure(G); const P = this.propDef(id);
    G.stone -= r.cost; C.props[id] = (C.props[id] | 0) + 1;
    const line = this.fill(TEXT41.ui2.propUp, { prop: P.n, L: C.props[id] });
    this.news(G, line); this.toast(line); return true;
  },
  giveProp(G, id, force) {
    G = G || this.G(); const C = this.ensure(G); const P = this.propDef(id);
    if (!C || !C.on || !P) return false;
    if (C.props[id]) {
      if ((C.props[id] | 0) >= 3) return false;
      C.props[id] = (C.props[id] | 0) + 1; return true;
    }
    if (!force && this.propCount(C) >= this.propSlots(C)) {
      // 超槽：给半价灵石
      G.stone = (G.stone || 0) + Math.round(P.cost * 0.5);
      return 'stone';
    }
    C.props[id] = 1; return true;
  },
  hashYear(y) { let h = (y | 0) * 2654435761 >>> 0; return (h % 1000) / 1000; },
  settleProps(G) {
    G = G || this.G(); const C = this.ensure(G); if (!C || !C.on) return null;
    const year = G.year || 0; const mul = this.yieldMul(C); const smod = this.stoneMod(G, C);
    const varY = this.hashYear(year) * 0.6 - 0.3; // −0.3..0.3
    let stone = 0, rep = 0; const items = {}; let rateWant = 0; let robbed = 0;
    // 每处族产 +5×L 声望
    for (const id in C.props) {
      const L = C.props[id] | 0; if (L < 1) continue;
      if (C.dmgY[id] === year) continue; // 损坏当年不产
      const P = this.propDef(id); if (!P) continue;
      rep += 5 * L;
      const parts = (P.yield || '').split(';');
      // 先扫 var:（与 token 顺序无关；坊市 stone 在 var 前写也会生效）
      let localVar = 1;
      for (const tk of parts) if (tk.startsWith('var:')) { localVar = 1 + varY; break; }
      for (const tk of parts) {
        if (tk.startsWith('var:')) continue;
        if (tk.startsWith('rate:')) { rateWant = Math.min(rateWant, parseFloat(tk.slice(5)) || 0); continue; } // 当铺 −0.02，不乘 L
        if (tk.startsWith('ruleSlot:')) continue;
        if (tk.startsWith('ev:')) { const mm = tk.match(/^ev:([\w]+):([\d.]+)/); if (mm && Math.random() < +mm[2]) robbed = mm[1]; continue; }
        if (tk.startsWith('clanCult:')) continue; // 修炼% 已在 clanCult()
        if (tk.startsWith('life:')) continue;
        if (tk.startsWith('compAtk:')) continue;
        if (tk.startsWith('stone:')) {
          let v = (+tk.split(':')[1] || 0) * L * mul * (1 + smod) * localVar;
          stone += v; continue;
        }
        if (tk.startsWith('rep:')) { rep += (+tk.split(':')[1] || 0) * L; continue; }
        if (tk.startsWith('petexp:')) {
          const n = Math.round((+tk.split(':')[1] || 0) * L);
          if (n && typeof Game !== 'undefined' && Game.apply) try { Game.apply('petexp+' + n); } catch (e) {}
          continue;
        }
        if (tk.startsWith('item:')) {
          const p = tk.split(':'); const ik = p[1]; let n = Math.round((+p[2] || 1) * L);
          // 酒坊：若无 i40_laojiu 则回退 wine
          let useK = ik;
          if (ik === 'i40_laojiu' && !(typeof ITEMS !== 'undefined' && ITEMS[ik])) useK = 'wine';
          if (n > 0 && typeof Game !== 'undefined' && Game.give && typeof ITEMS !== 'undefined' && ITEMS[useK]) {
            Game.give(useK, n); items[ITEMS[useK].n] = (items[ITEMS[useK].n] || 0) + n;
          }
          continue;
        }
        if (tk.startsWith('roll:')) {
          // roll:0.15:item:lz:1
          const p = tk.split(':'); const pr = +p[1]; if (Math.random() >= pr) continue;
          if (p[2] === 'item') {
            const ik = p[3]; const n = Math.round((+p[4] || 1) * L);
            if (n > 0 && typeof Game !== 'undefined' && Game.give && typeof ITEMS !== 'undefined' && ITEMS[ik]) {
              Game.give(ik, n); items[ITEMS[ik].n] = (items[ITEMS[ik].n] || 0) + n;
            }
          }
        }
      }
    }
    stone = Math.round(stone);
    // 还债为本：先冲债 20%
    if (this.has('haiqian') && stone > 0 && (G.debt || 0) > 0) {
      const pay = Math.min(G.debt, Math.floor(stone * 0.2));
      G.debt = Math.max(0, G.debt - pay); stone -= pay;
      this.toast(this.fill(TEXT41.ui2.haiqian, { s: pay }));
    }
    if (stone) G.stone = (G.stone || 0) + stone;
    if (rep) this.addRep(C, rep, G);
    // 当铺减息记入 C.rate（上限 −0.02，与还债为本不叠）
    if (rateWant < 0) C.rate = Math.max(-0.02, Math.min(0, Math.min(C.rate || 0, rateWant)));
    if (this.has('haiqian')) C.rate = Math.max(-0.02, Math.min(0, Math.min(C.rate || 0, -0.02)));
    const itemTxt = Object.keys(items).map(k => '，' + k + '×' + items[k]).join('');
    if (stone || rep || itemTxt) this.news(G, this.fill(TEXT41.ui2.yield, { s: stone, r: rep, items: itemTxt }));
    if (varY <= -0.2 && C.props.fangshi) this.toast(TEXT41.ui2.yieldBad);
    if (varY >= 0.2 && C.props.fangshi) this.toast(TEXT41.ui2.yieldGood);
    return { stone, rep, items, robbed };
  },
  // ---- 族规 ----
  canSetRule(G, id) {
    G = G || this.G(); const C = this.ensure(G); const R = this.ruleDef(id);
    if (!C || !C.on || !R) return { ok: 0, why: TEXT41.ui2.noClan };
    if (C.rules.indexOf(id) >= 0) return { ok: 0, why: '已挂' };
    const mx = this.MUTEX[id]; if (mx && C.rules.indexOf(mx) >= 0) return { ok: 0, why: this.fill(TEXT41.ui2.ruleLock, { rule: this.ruleDef(mx).n }) };
    if (C.rules.length >= this.ruleSlots(C)) return { ok: 0, why: '族规槽已满' };
    return { ok: 1 };
  },
  setRule(G, id) {
    const r = this.canSetRule(G, id); if (!r.ok) { this.toast(r.why); return false; }
    const C = this.ensure(G); C.rules.push(id);
    const line = this.fill(TEXT41.ui2.ruleSet, { rule: this.ruleDef(id).n });
    this.news(G, line); this.toast(line); return true;
  },
  canDropRule(G, id) {
    G = G || this.G(); const C = this.ensure(G);
    if (!C || C.rules.indexOf(id) < 0) return { ok: 0, why: '未挂' };
    const left = 5 - ((G.year || 0) - (C.ruleY || -99));
    if (left > 0) return { ok: 0, why: this.fill(TEXT41.ui2.ruleCd, { y: left }) };
    return { ok: 1 };
  },
  dropRule(G, id) {
    const r = this.canDropRule(G, id); if (!r.ok) { this.toast(r.why); return false; }
    const C = this.ensure(G); C.rules = C.rules.filter(x => x !== id); C.ruleY = G.year || 0;
    this.addRep(C, -50, G);
    const line = this.fill(TEXT41.ui2.ruleDrop, { rule: this.ruleDef(id).n });
    this.news(G, line); this.toast(line); return true;
  },
  // ---- 子嗣修炼 ----
  ensureKid(kid) {
    if (!kid) return kid;
    if (kid.realm == null) kid.realm = 0;
    if (kid.stage == null) kid.stage = 0;
    if (kid.xp == null) kid.xp = 0;
    if (kid.brk == null) kid.brk = 0;
    if (kid.hurt == null) kid.hurt = 0;
    if (kid.wed == null) kid.wed = -1;
    return kid;
  },
  kidNeed(kid) {
    const r = Math.min(6, kid.realm | 0); const s = Math.min(3, kid.stage | 0);
    const R = (typeof REALMS !== 'undefined' && REALMS[r]) || { need: 80 };
    const M = (typeof STAGE_MUL !== 'undefined' && STAGE_MUL[s]) || 1;
    return Math.max(1, Math.round(R.need * M / 10));
  },
  lgMult(lg) {
    try { const L = (typeof LINGGEN !== 'undefined') && LINGGEN.find(x => x.id === lg); return L ? L.mult : 1; } catch (e) { return 1; }
  },
  growKids(G) {
    G = G || this.G(); const C = this.ensure(G); if (!C || !C.on) return;
    const F = G.fam37; if (!F || !F.kids) return;
    const cult = this.clanCult(G, C); const cap = this.kidRealmMax(G);
    const ST = (typeof STAGES !== 'undefined') ? STAGES : ['初期', '中期', '后期', '圆满'];
    for (let i = 0; i < F.kids.length; i++) {
      const kid = this.ensureKid(F.kids[i]);
      kid.age = (G.year || 0) - (kid.born || 0);
      if (kid.age < 16) continue;
      if (kid.hurt > 0) { kid.hurt--; continue; }
      if (kid.realm >= cap && kid.realm >= 0) {
        // 到顶：封 xp
        kid.xp = Math.min(kid.xp, this.kidNeed(kid));
        continue;
      }
      kid.xp += 40 * this.lgMult(kid.lg) * (1 + cult);
      // 升小层 / 大境界
      let guard = 0;
      while (kid.xp >= this.kidNeed(kid) && guard++ < 8) {
        if (kid.realm >= cap) { kid.xp = this.kidNeed(kid); break; }
        if (kid.stage < 3) {
          kid.xp -= this.kidNeed(kid); kid.stage++;
          const rn = (REALMS[kid.realm] && REALMS[kid.realm].n) || '';
          this.news(G, this.fill(TEXT41.ui2.kidUp, { k: kid.n, realm: rn, stage: ST[kid.stage] || '' }));
        } else {
          // 冲大境界
          const R = REALMS[kid.realm] || { brk: 0.5, n: '' };
          const ch = (R.brk || 0.5) + (kid.brk || 0);
          kid.brk = 0;
          if (Math.random() < ch && kid.realm + 1 <= cap) {
            kid.realm++; kid.stage = 0; kid.xp = 0;
            const rn = (REALMS[kid.realm] && REALMS[kid.realm].n) || '';
            this.news(G, this.fill(this.pick(TEXT41.ui2.kidBrkOk), { k: kid.n, realm: rn }));
            // 首次境界声望
            const key = 'zj@' + i + '@' + kid.realm;
            if (!C.first[key]) {
              C.first[key] = 1;
              const bonus = { 2: 50, 3: 150, 4: 400, 5: 1000 }[kid.realm];
              if (bonus) this.addRep(C, bonus, G);
            }
          } else {
            kid.xp = Math.floor(kid.xp / 2);
            this.news(G, this.fill(this.pick(TEXT41.ui2.kidBrkNo), { k: kid.n }));
            break;
          }
        }
      }
      if (kid.realm >= cap) this.toast(this.fill(TEXT41.ui2.kidCap, { k: kid.n }));
    }
  },
  // ---- 婚配 ----
  dowry(famId) {
    const F = this.famDef(famId); if (!F) return 0;
    let d = 1000 * F.lv * (1 + 0.2 * F.lv);
    if (famId === 'qian') d *= 2;
    if (this.has('lianyin')) d *= 1.5;
    return Math.round(d);
  },
  marryLock(G, famId, who) {
    // who: {lg, kidIdx} 或 null=玩家
    G = G || this.G(); const C = this.ensure(G); const F = this.famDef(famId);
    if (!C || !C.on || !F) return TEXT41.ui2.noClan;
    if (C.lianhun) return null; // 联姻帖无视门槛
    if (F.lv - C.lv >= 3) return TEXT41.ui2.lockMen;
    if (this.has('yinshi') && F.lv > C.lv) return TEXT41.ui2.lockMen;
    if (famId === 'lin' && C.lv < 2) return TEXT41.ui2.lockMen;
    if (famId === 'qian' && C.lv < 2) return TEXT41.ui2.lockMen;
    if (famId === 'bai' && (G.karma || 0) < 20) return this.fill(TEXT41.ui2.lockKarma, { fam: F.n });
    if (famId === 'yun' && this.routeRep('qingyun') < 40) return this.fill(TEXT41.ui2.lockSect, { fam: F.n });
    if (famId === 'su' && (G.karma || 0) > -20) return this.fill(TEXT41.ui2.lockKarma, { fam: F.n });
    if (famId === 'leng') {
      if (C.lv < 5) return TEXT41.ui2.lockMen;
      const lg = who && who.lg != null ? who.lg : G.lg;
      if (lg !== 'bing') return this.fill(TEXT41.ui2.lockLg, { fam: F.n });
    }
    if (famId === 'long') {
      if (C.lv < 6) return TEXT41.ui2.lockMen;
      if ((C.fams.long || 0) < 30) return this.fill(TEXT41.ui2.lockLong, { fam: F.n });
    }
    return null;
  },
  marryRate(G, famId, who) {
    G = G || this.G(); const C = this.ensure(G); const F = this.famDef(famId);
    let r = 0.4 + 0.05 * (C.lv - F.lv);
    const lg = who && who.lg != null ? who.lg : G.lg;
    const want = F.wantLg || ['*'];
    if (want.indexOf('*') >= 0 || want.indexOf(lg) >= 0) r += 0.15;
    // 命格 n_tianxi（子嗣）
    if (who && who.kidIdx != null) {
      const kid = G.fam37 && G.fam37.kids[who.kidIdx];
      if (kid && kid.mg === 'n_tianxi') r += 0.15;
    }
    if (G.i40 && G.i40.match === 1) r += 0.3;
    if (this.has('lianyin')) r += 0.2;
    if (C.matchB) r += C.matchB;
    if (this.has('tieqi')) r -= 0.1;
    if (famId === 'long' && G.flags && G.flags.boss_dragon) r -= 0.2;
    r += (C.fams[famId] || 0) / 500;
    return Math.max(0.05, Math.min(0.9, r));
  },
  makeSpouseName(famId, rnd) {
    const F = this.famDef(famId); const sn = (F && F.sn) || '某';
    let ming = '清漪';
    try {
      if (typeof FAM37 !== 'undefined' && FAM37.T && FAM37.T.dis && FAM37.T.dis.ming)
        ming = this.pick(FAM37.T.dis.ming, rnd);
    } catch (e) {}
    return sn + '·' + ming;
  },
  pickWantLg(famId, rnd) {
    const F = this.famDef(famId); const w = (F.wantLg || ['*']).filter(x => x !== '*');
    if (!w.length) return 'san';
    return this.pick(w, rnd);
  },
  async propose(G, famId, kidIdx) {
    G = G || this.G(); const C = this.ensure(G); const F = this.famDef(famId);
    if (!C || !C.on || !F) { this.toast(TEXT41.ui2.noClan); return false; }
    const isPlayer = kidIdx == null || kidIdx < 0;
    let who;
    if (isPlayer) {
      if ((G.fam37 && G.fam37.sp) || G.partner) { this.toast('已有道侣'); return false; }
      who = { lg: G.lg };
    } else {
      const kid = this.ensureKid(G.fam37.kids[kidIdx]);
      if (!kid || kid.age < 16 || kid.wed >= 0) { this.toast('该子嗣不可婚配'); return false; }
      who = { lg: kid.lg, kidIdx };
    }
    const lock = this.marryLock(G, famId, who); if (lock) { this.toast(lock); return false; }
    const fee = this.dowry(famId);
    if ((G.stone || 0) < fee) { this.toast('聘礼不足（需' + fee + '）'); return false; }
    G.stone -= fee;
    // 先算成功率（含月老红线 +30%），再消耗红线；否则 UI 显示 ~0.9、实际掷 ~0.65
    const rate = this.marryRate(G, famId, who);
    const usedRed = !!(G.i40 && G.i40.match === 1);
    if (usedRed) G.i40.match = 0;
    C.matchB = 0; C.lianhun = 0;
    const ok = Math.random() < rate;
    const ask = this.fill(this.pick(TEXT41.marry.lines.ask), { fam: F.n, who: this.makeSpouseName(famId).split('·').pop(), age: 18, k: isPlayer ? (G.name || '你') : G.fam37.kids[kidIdx].n });
    if (typeof UI !== 'undefined' && UI.card) await UI.card('提亲', ask, F.por || 'npc_girl', ['呈上聘礼']);
    if (!ok) {
      const back = Math.floor(fee / 2); G.stone += back;
      const no = this.fill(this.pick(TEXT41.marry.lines.no), { fam: F.n });
      if (typeof UI !== 'undefined' && UI.card) await UI.card('提亲', no + '\n' + TEXT41.ui2.wedRefund, F.por || 'npc_girl', ['……']);
      return false;
    }
    const n = this.makeSpouseName(famId); const lg = this.pickWantLg(famId);
    if (isPlayer) {
      C.spInfo = { fam: famId, n, lg, por: F.por || 'npc_girl' };
      if (typeof FAM37 !== 'undefined') { FAM37.ensure(G); G.fam37.sp = 'c41_sp'; }
      G.partner = 'c41_sp';
      try { if (Game.ach) Game.ach('partner'); } catch (e) {}
      C.wed.push({ kid: -1, fam: famId, n, lg, y: G.year || 0, div: 0 });
      this.addRep(C, 100, G); C.fams[famId] = Math.min(100, (C.fams[famId] || 0) + 30); C.pop = (C.pop || 0) + 1;
      const line = this.fill(TEXT41.ui2.spWed, { fam: F.n, n });
      this.news(G, line);
      if (typeof UI !== 'undefined' && UI.card) await UI.card('联姻', this.fill(this.pick(TEXT41.marry.lines.yes), { fam: F.n }) + '\n' + line, F.por || 'npc_girl', ['好']);
    } else {
      const kid = G.fam37.kids[kidIdx];
      kid.wed = C.wed.length;
      C.wed.push({ kid: kidIdx, fam: famId, n, lg, y: G.year || 0, div: 0 });
      C.pop = (C.pop || 0) + 1; C.fams[famId] = Math.min(100, (C.fams[famId] || 0) + 30);
      this.addRep(C, 100, G);
      const yes = this.fill(this.pick(TEXT41.marry.lines.yes), { fam: F.n });
      this.news(G, yes + '（' + kid.n + ' 与 ' + n + '）');
      if (typeof UI !== 'undefined' && UI.card) await UI.card('联姻', yes, F.por || 'npc_girl', ['好']);
    }
    return true;
  },
  // ---- 事件 ----
  condOk(G, cond) {
    if (!cond) return true;
    G = G || this.G(); const C = this.ensure(G); const F = G.fam37 || {};
    const kids = F.kids || [];
    if (cond === 'kids') return kids.length >= 1;
    if (cond === 'kids2') return kids.length >= 2;
    if (cond === 'kidAge16') return kids.some(k => this.ensureKid(k).age >= 16 && (k.wed == null || k.wed < 0));
    if (cond === 'sp') return !!(F.sp || G.partner);
    if (cond === 'pop3') return this.popCount(G) >= 3;
    if (cond === 'pop4') return this.popCount(G) >= 4 && !this.has('tieqi');
    if (cond === 'lv5') return (C.lv || 0) >= 5;
    if (cond.indexOf('prop:') === 0) return (C.props[cond.slice(5)] | 0) >= 1;
    return true;
  },
  eventWeight(G, E) {
    let w = 1;
    if (E.id === 'c41_traitor') {
      try {
        const kids = (G.fam37 && G.fam37.kids) || [];
        if ((G.karma || 0) <= -30 && kids.some(k => k.mg === 'n_mozhong')) w *= 3;
        if (G.route37 && (G.route37.clan || 0) <= -10) w *= 2;
      } catch (e) {}
    }
    return w;
  },
  async applyClanEff(G, e, ctx) {
    G = G || this.G(); const C = this.ensure(G); if (!e) return [];
    const out = [];
    // stoneRaw 不乘境界
    if (e.stoneRaw) { G.stone = Math.max(0, (G.stone || 0) + e.stoneRaw); out.push('灵石' + (e.stoneRaw >= 0 ? '+' : '') + e.stoneRaw); }
    // 交给 fam37 的字段（去掉本模块字段）
    const pass = {};
    for (const k of ['stone', 'item', 'aff', 'karma', 'fight', 'debt', 'rate']) if (e[k] != null) pass[k] = e[k];
    if (Object.keys(pass).length && typeof FAM37 !== 'undefined' && FAM37.applyEff) {
      try { const r = await FAM37.applyEff(pass); if (r && r.length) out.push.apply(out, r); } catch (err) { console.warn('clan41 applyEff', err); }
    }
    if (e.rep) this.addRep(C, e.rep, G);
    if (e.pop) C.pop = Math.max(0, (C.pop || 0) + e.pop);
    if (e.prop) this.giveProp(G, e.prop);
    if (e.propDmg) {
      const ids = Object.keys(C.props).filter(k => (C.props[k] | 0) >= 1);
      if (ids.length) {
        const id = this.pick(ids);
        if ((C.props[id] | 0) > 1) C.props[id]--;
        else C.dmgY[id] = G.year || 0;
        out.push('族产受损');
      }
    }
    if (e.famRel && ctx && ctx.famId) C.fams[ctx.famId] = Math.max(-100, Math.min(100, (C.fams[ctx.famId] || 0) + e.famRel));
    if (e.match) C.matchB = (C.matchB || 0) + e.match;
    if (e.kidBrk && ctx && ctx.kid) ctx.kid.brk = (ctx.kid.brk || 0) + e.kidBrk;
    if (e.heir) {
      const kids = (G.fam37 && G.fam37.kids) || [];
      let idx = -1;
      if (e.heir === 'eldest') {
        let best = -1; kids.forEach((k, i) => { const a = k.age || 0; if (a > best) { best = a; idx = i; } });
      } else if (e.heir === 'bestLg') {
        let best = -1; kids.forEach((k, i) => {
          const rk = (typeof FAM37 !== 'undefined' && FAM37.rankOf) ? FAM37.rankOf(k.lg) : 0;
          const a = k.age || 0;
          if (rk > best || (rk === best && a > (kids[idx] && kids[idx].age || 0))) { best = rk; idx = i; }
        });
      }
      if (idx >= 0) {
        C.heirIdx = idx; const kid = kids[idx];
        if (!G.heir) {
          let talent = 'tough';
          try { if (typeof TALENTS !== 'undefined') talent = this.pick(TALENTS).id; } catch (e2) {}
          G.heir = { name: kid.n, lg: kid.lg, talent, tech: null, born: kid.born, age: kid.age, c41: 1 };
        }
        this.news(G, this.fill(TEXT41.ui2.heir, { k: kid.n, clan: C.name }));
      }
    }
    if (e.clanCult) C.cult = Math.min(0.10, (C.cult || 0) + e.clanCult);
    if (e.hpPct && typeof Game !== 'undefined' && Game.stats) {
      const s = Game.stats(); G.hp = Math.max(1, Math.round((G.hp || s.mhp) + s.mhp * e.hpPct));
    }
    if (e.luck) { G.i40 = G.i40 || {}; G.i40.luck = 1; }
    if (e.srep) { if (G.sect) this.repAdd(G.sect, e.srep); }
    if (e.roll) {
      // "0.3:item:i40_zupu_old:1" or "0.5:stone:3000"
      const p = String(e.roll).split(':'); const pr = +p[0];
      if (Math.random() < pr) {
        if (p[1] === 'item' && typeof Game !== 'undefined' && Game.give) {
          const ik = p[2]; if (typeof ITEMS !== 'undefined' && ITEMS[ik]) Game.give(ik, +(p[3] || 1));
          else if (ik) { /* 未登记则跳过 */ }
        } else if (p[1] === 'stone') G.stone = (G.stone || 0) + (+p[2] || 0);
      }
    }
    // 尚武劫镖的「不开打、直接 300」在 runEvent 里删 fight 并保留 stoneRaw:300，此处不再加
    return out;
  },
  async runEvent(G, forcedId, rnd) {
    G = G || this.G(); const C = this.ensure(G); if (!C || !C.on) return null;
    rnd = rnd || Math.random;
    let pool = TEXT41.events.filter(E => {
      if (forcedId && E.id !== forcedId) return false;
      if (!forcedId && !this.condOk(G, E.cond)) return false;
      if (!forcedId && (G.year || 0) - (C.evY[E.id] || -99) < 5) return false;
      return true;
    });
    if (!pool.length) return null;
    // 隐世：负面 50% 重抽
    let E;
    if (forcedId) E = pool[0];
    else {
      const weights = pool.map(x => this.eventWeight(G, x));
      let sum = weights.reduce((a, b) => a + b, 0), t = rnd() * sum;
      for (let i = 0; i < pool.length; i++) { t -= weights[i]; if (t <= 0) { E = pool[i]; break; } }
      E = E || pool[0];
      if (this.has('yinshi') && (E.bad || this.BAD[E.id]) && rnd() < 0.5) {
        const alt = pool.filter(x => !(x.bad || this.BAD[x.id]));
        if (alt.length) E = this.pick(alt, rnd);
      }
    }
    // 上下文占位
    const kids = (G.fam37 && G.fam37.kids) || [];
    let kid = null;
    if (E.cond === 'kidAge16') kid = kids.find(k => this.ensureKid(k).age >= 16 && (k.wed == null || k.wed < 0)) || null;
    if (!kid && kids.length) kid = this.pick(kids, rnd);
    if (kid) this.ensureKid(kid);
    const props = Object.keys(C.props).filter(k => (C.props[k] | 0) >= 1);
    const propId = props.length ? this.pick(props, rnd) : null;
    let famId = null;
    if (E.id === 'c41_marryrival' || E.id === 'c41_alliance') {
      const ids = TEXT41.fams.map(f => f.id).sort((a, b) => (C.fams[b] || 0) - (C.fams[a] || 0));
      famId = ids[0] || 'wang';
    } else famId = this.pick(TEXT41.fams, rnd).id;
    const fam = this.famDef(famId);
    const o = {
      k: kid ? kid.n : '孩子',
      prop: propId ? (this.propDef(propId).n) : '族产',
      fam: fam ? fam.n : '某氏',
      sp: (typeof FAM37 !== 'undefined' && G.fam37 && G.fam37.sp) ? FAM37.nm(G.fam37.sp) : (G.partner ? '道侣' : '道侣')
    };
    const opts = E.ch.map(([t, eff, need]) => {
      let label = this.fill(t, o);
      if (need && need.indexOf('rule:') === 0 && !this.has(need.slice(5))) label = '🔒' + label;
      else if (typeof FAM37 !== 'undefined' && FAM37.canEff && !FAM37.canEff(G, eff)) label = '🔒' + label;
      return label;
    });
    // 序章/指引/战斗：不弹卡，记下 pending 待空闲再弹
    if (this.busy()) {
      C.pendingEv = { id: E.id, y: G.year || 0 };
      try { console.warn('clan41 defer event', E.id); } catch (e) {}
      return { id: E.id, deferred: 1 };
    }
    let c = 0;
    if (typeof UI !== 'undefined' && UI.card) c = await UI.card('族事', this.fill(E.t, o), 'npc_girl', opts);
    if (c < 0 || c >= E.ch.length) c = 0;
    // 🔒 不可选 → 找第一个可选
    const locked = (i) => {
      const need = E.ch[i][2];
      if (need && need.indexOf('rule:') === 0 && !this.has(need.slice(5))) return true;
      if (typeof FAM37 !== 'undefined' && FAM37.canEff && !FAM37.canEff(G, E.ch[i][1])) return true;
      return false;
    };
    if (locked(c)) { c = E.ch.findIndex((_, i) => !locked(i)); if (c < 0) return null; }
    const eff = E.ch[c][1] || {};
    // 尚武劫镖：亲自去追 → 不开打，保留选项原有 stoneRaw:300（勿再 +300，否则合计 600）
    let useEff = Object.assign({}, eff);
    if (E.id === 'c41_robbed' && c === 0 && this.has('shangwu')) { delete useEff.fight; if (useEff.stoneRaw == null) useEff.stoneRaw = 300; }
    await this.applyClanEff(G, useEff, { kid, famId, evId: E.id });
    // matchmaker 挑灵根：30% 掉联姻帖
    if (E.id === 'c41_matchmaker' && c === 1 && Math.random() < 0.3 && typeof Game !== 'undefined' && Game.give && typeof ITEMS !== 'undefined' && ITEMS.i40_lianhun)
      Game.give('i40_lianhun', 1);
    C.ev[E.id] = (C.ev[E.id] || 0) + 1; C.evY[E.id] = G.year || 0;
    this.news(G, this.fill(E.t, o) + '——' + this.fill(E.ch[c][0], o));
    return { id: E.id, c };
  },
  // ---- 年结算 ----
  async yearStep(G) {
    G = G || this.G(); const C = this.ensure(G); if (!C || !C.on || !G || G.dead) return;
    const step = async (name, fn) => { try { await fn(); } catch (e) { console.warn('clan41', name, e); } };
    await step('flush', async () => { if (C.pendingEv && !this.busy()) { const id = C.pendingEv.id; C.pendingEv = null; await this.runEvent(G, id); } });
    await step('divorce', () => {
      if (C.spInfo && G.partner !== 'c41_sp') {
        const fam = C.spInfo.fam; C.fams[fam] = Math.max(-100, (C.fams[fam] || 0) - 60);
        this.addRep(C, -200, G);
        const F = this.famDef(fam);
        this.news(G, this.fill(TEXT41.ui2.divorce, { fam: F ? F.n : '对方' }));
        C.spInfo = null;
        // wed 标记
        C.wed.forEach(w => { if (w.kid === -1 && !w.div) w.div = 1; });
      }
    });
    let robbed = null;
    await step('props', () => { const r = this.settleProps(G); if (r && r.robbed) robbed = r.robbed; });
    await step('kaizhi', () => {
      if (!this.has('kaizhi') || typeof FAM37 === 'undefined') return;
      const F = FAM37.ensure(G);
      // 额外生育
      if (F.sp && F.kids.length < FAM37.KID_MAX && Math.random() < 0.29) {
        // 检查本年是否已有新生（born === year）——不管，额外一次
        const k = FAM37.birth(); if (k) this.toast('开枝：又添一子【' + k.n + '】', '#ffc0e0');
      }
      // 开销
      const n = (F.kids || []).length;
      if (n > 0) {
        const cost = 200 * n;
        if ((G.stone || 0) >= cost) G.stone -= cost;
        else { G.stone = 0; this.addRep(C, -20, G); }
      }
    });
    await step('kids', () => this.growKids(G));
    await step('shangwu', () => {
      if (!this.has('shangwu')) return;
      const kids = ((G.fam37 && G.fam37.kids) || []).filter(k => this.ensureKid(k).age >= 16);
      if (kids.length && Math.random() < 0.1) {
        const k = this.pick(kids); k.hurt = 1;
        this.news(G, this.fill(TEXT41.ui2.kidHurt, { k: k.n }));
      }
    });
    await step('rules', () => {
      if (this.has('renhou')) {
        G.karma = (G.karma || 0) + 2;
        this.repAdd('qingyun', 2); this.repAdd('baicao', 2);
      }
      if (this.has('moxiu')) {
        G.karma = (G.karma || 0) - 3;
        this.repAdd('tianmo', 5); this.repAdd('qingyun', -3); this.repAdd('baicao', -3);
      }
      if (this.has('zhongshang')) this.addRep(C, -10, G);
      // 刷新减息上限
      let rate = 0;
      if (C.props.dangpu) rate = Math.min(rate, -0.02);
      if (this.has('haiqian')) rate = Math.min(rate, -0.02);
      C.rate = rate;
    });
    await step('wedgift', () => {
      for (const w of C.wed) {
        if (!w || w.div) continue;
        const F = this.famDef(w.fam); if (!F) continue;
        if (Math.random() < 0.3) {
          const stone = 200 * F.lv; G.stone = (G.stone || 0) + stone;
          this.news(G, this.fill(TEXT41.ui2.famGift, { fam: F.n, g: stone + ' 灵石' }));
        }
        // 孙辈：已婚子嗣
        if (w.kid >= 0) {
          const cnt = C.grandBy[w.kid] || 0;
          if (cnt < 3 && Math.random() < 0.15) {
            C.grandBy[w.kid] = cnt + 1; C.grand = (C.grand || 0) + 1; C.pop = (C.pop || 0) + 1;
            const kn = (G.fam37.kids[w.kid] && G.fam37.kids[w.kid].n) || '子嗣';
            this.news(G, this.fill(this.pick(TEXT41.ui2.grand), { k: kn }));
          }
        }
      }
    });
    await step('rate', () => {
      if (C.rate < 0 && (G.debt || 0) > 0) {
        const cut = Math.floor(G.debt * Math.min(-C.rate, 0.02));
        if (cut > 0) G.debt = Math.max(0, G.debt - cut);
      }
    });
    await step('event', async () => {
      if (robbed) await this.runEvent(G, robbed);
      else if (Math.random() < 0.6) await this.runEvent(G);
    });
    await step('lv', () => this.checkLv(G));
    C.yr = G.year || 0;
  },
  // ---- 道具 ----
  useItem(k) {
    const G = this.G(); const C = this.ensure(G); if (!G) return false;
    if (k === 'i40_jiapu') {
      if (C.on) { this.toast('族谱已经写上名字了'); return false; }
      if (typeof Game !== 'undefined' && Game.take) Game.take(k);
      this.found(G); return true;
    }
    if (k === 'i40_zuxun') {
      if (!C.on) { this.toast(TEXT41.ui2.noClan); return false; }
      if (C.extraSlot || this.ruleSlots(C) >= 4) { this.toast('祠堂墙上挂不下了'); return false; }
      if (typeof Game !== 'undefined' && Game.take) Game.take(k);
      C.extraSlot = 1; this.toast('祖训竹简入祠，族规槽 +1'); return true;
    }
    if (k === 'i40_dici') {
      if (!C.on) { this.toast(TEXT41.ui2.noClan); return false; }
      if (C.props.tian) {
        if ((C.props.tian | 0) >= 3) { this.toast('这块地已经是你家的了'); return false; }
      } else if (this.propCount(C) >= this.propSlots(C)) { this.toast(TEXT41.ui2.propFull); return false; }
      if (typeof Game !== 'undefined' && Game.take) Game.take(k);
      this.giveProp(G, 'tian', true); this.toast('地契入账：良田'); return true;
    }
    if (k === 'i40_ditu') {
      const n = (G.inv && G.inv.i40_ditu) || 0;
      if (n < 4) { this.toast('还差 ' + (4 - n) + ' 块'); return false; }
      if (!C.on) { this.toast(TEXT41.ui2.noClan); return false; }
      if (C.props.kuang && (C.props.kuang | 0) >= 3) { this.toast('灵矿已满级'); return false; }
      if (!C.props.kuang && this.propCount(C) >= this.propSlots(C)) { this.toast(TEXT41.ui2.propFull); return false; }
      if (typeof Game !== 'undefined' && Game.take) Game.take('i40_ditu', 4);
      this.giveProp(G, 'kuang', true); this.toast('残图拼成：灵矿'); return true;
    }
    if (k === 'i40_zupu_old') {
      if (!C.on) { this.toast(TEXT41.ui2.noClan); return false; }
      if (C.zupuUsed) { this.toast('本世已用过古族谱'); return false; }
      const to = Math.min(10, (C.lv || 1) + 1);
      if (!this.canJumpLv(G, to)) { this.toast('你这修为撑不起这么大的门楣'); return false; }
      if (typeof Game !== 'undefined' && Game.take) Game.take(k);
      C.lv = to; C.zupuUsed = 1;
      this.news(G, this.fill(TEXT41.ui.lvUp, { clan: C.name, n: this.lvDef(C.lv).n }));
      this.toast('古族谱生效：晋为「' + this.lvDef(C.lv).n + '」'); return true;
    }
    if (k === 'i40_lianhun') {
      if (!C.on) { this.toast(TEXT41.ui2.noClan); return false; }
      if (typeof Game !== 'undefined' && Game.take) Game.take(k);
      C.lianhun = 1; this.toast(TEXT41.ui2.lianhun); return true;
    }
    return false;
  },
  // ---- UI ----
  html(tab) {
    const G = this.G(); const C = this.ensure(G); tab = tab || 0;
    if (!C || !C.on) {
      const can = this.canFound(G);
      return `<div class="clan41"><p class="hint">${TEXT41.ui2.noClan}</p>${can ? '<button class="opt" data-c="found">🏯 开族立谱</button>' : ''}</div>`;
    }
    const D = this.lvDef(C.lv);
    const tabs = TEXT41.ui.tabs.map((t, i) => `<button class="opt${i === tab ? ' on' : ''}" data-c="tab" data-v="${i}">${t}</button>`).join('');
    let body = '';
    if (tab === 0) {
      body = `<p><b>${esc(C.name)}</b> · ${D.n}（Lv${C.lv}）</p>
        <p class="hint">声望 ${C.rep}　族人 ${this.popCount(G)}　族产 ${this.propCount(C)}/${this.propSlots(C)}　联姻 ${this.wedCount(C)}
        <br>年产倍率 ×${D.yieldMul}　全族修炼 +${((D.fx && D.fx.cult) || 0) * 100}%　减息 ${Math.round((C.rate || 0) * -100)}%</p>
        <p class="hint">下一级：${C.lv >= 10 ? '已满' : (this.lvDef(C.lv + 1).n + '（声望' + this.lvDef(C.lv + 1).rep + '·' + this.lvDef(C.lv + 1).d + '）')}</p>`;
    } else if (tab === 1) {
      body = TEXT41.props.map(P => {
        const L = C.props[P.id] | 0;
        if (L) {
          const up = this.canUpProp(G, P.id);
          return `<div class="clan41r"><b>${esc(P.n)}</b> Lv${L}<small>${esc(P.d)}</small>
            <button class="opt" data-c="up" data-v="${P.id}" ${up.ok ? '' : 'disabled style="opacity:.45"'}>升级${up.ok ? '（' + up.cost + '）' : ''}</button></div>`;
        }
        const buy = this.canBuyProp(G, P.id);
        return `<div class="clan41r"><b>${esc(P.n)}</b><small>${esc(P.d)}　${P.cost} 灵石　需Lv${P.lvReq}</small>
          <button class="opt" data-c="buy" data-v="${P.id}" ${buy.ok ? '' : 'disabled style="opacity:.45"'}>购置</button></div>`;
      }).join('') || `<p class="hint">${TEXT41.ui.noProp}</p>`;
    } else if (tab === 2) {
      body = `<p class="hint">槽位 ${C.rules.length}/${this.ruleSlots(C)}（硬上限 4）</p>` + TEXT41.rules.map(R => {
        const on = C.rules.indexOf(R.id) >= 0;
        if (on) {
          const drop = this.canDropRule(G, R.id);
          return `<div class="clan41r"><b>✓ ${esc(R.n)}</b><small>${esc(R.pro)} / ${esc(R.con)}</small>
            <button class="opt" data-c="drop" data-v="${R.id}" ${drop.ok ? '' : 'disabled style="opacity:.45"'}>卸下</button></div>`;
        }
        const set = this.canSetRule(G, R.id);
        return `<div class="clan41r"><b>${esc(R.n)}</b><small>${esc(R.pro)} / ${esc(R.con)}</small>
          <button class="opt" data-c="set" data-v="${R.id}" ${set.ok ? '' : 'disabled style="opacity:.45"'}>挂上</button></div>`;
      }).join('');
    } else if (tab === 3) {
      const kids = ((G.fam37 && G.fam37.kids) || []).map((k, i) => { this.ensureKid(k); return { k, i }; }).filter(x => x.k.age >= 16 && x.k.wed < 0);
      const canPlayer = !(G.fam37 && G.fam37.sp) && !G.partner;
      body = `<p class="hint">${G.i40 && G.i40.match === 1 ? TEXT41.ui2.redLine + '<br>' : ''}${C.lianhun ? TEXT41.ui2.lianhun + '<br>' : ''}选对象提亲（先选家族）</p>`;
      body += TEXT41.fams.map(F => {
        const fee = this.dowry(F.id);
        const lockP = canPlayer ? this.marryLock(G, F.id, { lg: G.lg }) : '已有道侣';
        const rateP = canPlayer && !lockP ? Math.round(this.marryRate(G, F.id, { lg: G.lg }) * 100) : 0;
        let s = `<div class="clan41r"><b>${esc(F.n)}</b><small>Lv${F.lv}　聘礼 ${fee}　${esc(F.d)}　关系 ${C.fams[F.id] || 0}</small>`;
        if (canPlayer) s += `<button class="opt" data-c="wed" data-v="${F.id}" data-i="-1" ${lockP ? 'disabled style="opacity:.45"' : ''}>本人联姻${lockP ? '🔒' : ' ' + rateP + '%'}</button>`;
        for (const { k, i } of kids) {
          const lock = this.marryLock(G, F.id, { lg: k.lg, kidIdx: i });
          const rate = !lock ? Math.round(this.marryRate(G, F.id, { lg: k.lg, kidIdx: i }) * 100) : 0;
          s += `<button class="opt" data-c="wed" data-v="${F.id}" data-i="${i}" ${lock ? 'disabled style="opacity:.45"' : ''}>${esc(k.n)}↔${esc(F.n)}${lock ? '🔒' : ' ' + rate + '%'}</button>`;
        }
        return s + '</div>';
      }).join('');
    } else if (tab === 4) {
      const F = G.fam37 || {};
      body = `<p>家主：${esc(G.name)}　道侣：${F.sp ? esc((typeof FAM37 !== 'undefined' ? FAM37.nm(F.sp) : F.sp)) : '无'}</p>`;
      body += (F.kids || []).map(k => {
        this.ensureKid(k);
        const rn = (typeof REALMS !== 'undefined' && REALMS[k.realm]) ? REALMS[k.realm].n : '';
        const st = (typeof STAGES !== 'undefined' && STAGES[k.stage]) ? STAGES[k.stage] : '';
        const wed = k.wed >= 0 && C.wed[k.wed] ? ' · 婚配 ' + C.wed[k.wed].n : '';
        return `<p>👶 ${esc(k.n)}　${k.age}岁　${esc((typeof FAM37 !== 'undefined' ? FAM37.lgN(k.lg) : k.lg))}　${rn}${st}${k.hurt ? ' · 养伤' : ''}${wed}${C.heirIdx >= 0 && F.kids[C.heirIdx] === k ? ' · 继承人' : ''}</p>`;
      }).join('') || '<p class="hint">尚无子嗣</p>';
      body += `<p class="hint">额外族人 ${C.pop}（含孙辈 ${C.grand}）</p>`;
    } else {
      body = (C.log || []).slice(0, 12).map(x => `<p class="hint">Y${x.y}　${esc(x.s)}</p>`).join('') || '<p class="hint">暂无大事</p>';
    }
    return `<div class="clan41"><div class="tabs">${tabs}</div>${body}</div>`;
  },
  async onClick(t, box) {
    const G = this.G(); const C = this.ensure(G); if (!G) return;
    const a = t.dataset.c, v = t.dataset.v, i = t.dataset.i != null ? +t.dataset.i : -1;
    if (a === 'found') this.found(G);
    else if (a === 'tab') { box._tab = +v; }
    else if (a === 'buy') this.buyProp(G, v);
    else if (a === 'up') this.upProp(G, v);
    else if (a === 'set') this.setRule(G, v);
    else if (a === 'drop') this.dropRule(G, v);
    else if (a === 'wed') await this.propose(G, v, i);
    box.innerHTML = this.html(box._tab || 0);
    box.querySelectorAll('[data-c]').forEach(() => {});
    this._bind(box);
  },
  _bind(box) {
    box.onclick = e => {
      const t = e.target.closest('button[data-c]'); if (!t || t.disabled) return;
      try { if (typeof Sfx !== 'undefined') Sfx.play('click'); } catch (err) {}
      this.onClick(t, box);
    };
  }
};

// ---- 注册非命名配偶 NPC ----
(function regSp() {
  try {
    if (typeof NPCS !== 'undefined' && !NPCS.c41_sp) {
      NPCS.c41_sp = {
        get n() { const s = typeof Game !== 'undefined' && Game.G && Game.G.clan41 && Game.G.clan41.spInfo; return s ? s.n : '道侣'; },
        get por() { const s = typeof Game !== 'undefined' && Game.G && Game.G.clan41 && Game.G.clan41.spInfo; return s ? s.por : 'npc_girl'; },
        spr: 'npc_girl', sex: 'f', c41: 1,
        roam: () => null // 不上任何地图（validate22 / game.js:441）
      };
    }
    if (typeof FAM37 !== 'undefined' && FAM37.SP_LG) {
      try {
        Object.defineProperty(FAM37.SP_LG, 'c41_sp', {
          configurable: true, enumerable: false,
          get() { const s = typeof Game !== 'undefined' && Game.G && Game.G.clan41 && Game.G.clan41.spInfo; return s ? s.lg : 'san'; }
        });
      } catch (e) { FAM37.SP_LG.c41_sp = 'san'; }
    }
  } catch (e) { console.warn('clan41 regSp', e); }
})();

// ---- KID_MAX getter ----
(function kidMax() {
  try {
    if (typeof FAM37 !== 'undefined') {
      Object.defineProperty(FAM37, 'KID_MAX', {
        configurable: true,
        get() { try { return C41.has('kaizhi') ? 6 : 4; } catch (e) { return 4; } }
      });
    }
  } catch (e) { console.warn('clan41 KID_MAX', e); }
})();

// ---- Hooks ----
(function install41() {
  if (typeof Game === 'undefined') return;
  // yearEnd
  if (Game.yearEnd && !Game.yearEnd._c41) {
    const _ye = Game.yearEnd;
    Game.yearEnd = async function () {
      const r = await _ye.apply(this, arguments);
      try {
        const G = this.G;
        if (G && !G.dead) {
          const C = C41.ensure(G);
          if (C && C.on && C.yr !== G.year) await C41.yearStep(G);
        }
      } catch (e) { console.warn('clan41 yearEnd', e); }
      return r;
    };
    Game.yearEnd._c41 = 1;
  }
  // newLife：记 best，重置
  if (Game.newLife && !Game.newLife._c41) {
    const _nl = Game.newLife;
    Game.newLife = function (cfg) {
      try {
        const old = this.G && this.G.clan41;
        if (old && old.on) {
          this.meta = this.meta || {};
          this.meta.clan41Best = Math.max(this.meta.clan41Best || 0, old.lv || 1);
        }
        const best = this.meta && this.meta.clan41Best;
        const oldName = old && old.name; const oldLv = old && old.lv;
        const r = _nl.apply(this, arguments);
        if (this.G) {
          this.G.clan41 = null; C41.ensure(this.G);
          if (best >= 1 && oldName) {
            const n = (TEXT41.lv[(oldLv || 1) - 1] || {}).n || '';
            setTimeout(() => C41.toast(C41.fill(TEXT41.ui2.reborn, { clan: oldName, n })), 500);
          }
        }
        return r;
      } catch (e) { console.warn('clan41 newLife', e); return _nl.apply(this, arguments); }
    };
    Game.newLife._c41 = 1;
  }
  // lifeMax：洞天寿元
  if (Game.lifeMax && !Game.lifeMax._c41) {
    const _lm = Game.lifeMax;
    Game.lifeMax = function () {
      const v = _lm.apply(this, arguments);
      try {
        const G = this.G; const C = G && C41.ensure(G);
        const b = C41.lifeBonus(G, C);
        if (b) return Math.round(v * (1 + b));
      } catch (e) {}
      return v;
    };
    Game.lifeMax._c41 = 1;
  }
  // Sys.bonus
  if (typeof Sys !== 'undefined' && Sys.bonus && !Sys._c41) {
    Sys._c41 = 1;
    const _b = Sys.bonus;
    Sys.bonus = function (k) {
      let v = _b.apply(this, arguments);
      try {
        const G = Game.G; const C = G && C41.ensure(G);
        if (C && C.on) {
          if (k === 'cult') v += (C41.lvDef(C.lv).fx && C41.lvDef(C.lv).fx.cult) || 0;
          if (k === 'atk') v += C41.atkBonus(G, C);
        }
      } catch (e) {}
      return v;
    };
  }
  // FAM37.birth：命格继承（若 PF38）
  if (typeof FAM37 !== 'undefined' && FAM37.birth && !FAM37.birth._c41) {
    const _b = FAM37.birth.bind(FAM37);
    FAM37.birth = function (rnd) {
      const kid = _b(rnd);
      try {
        if (kid && typeof PF38 !== 'undefined' && PF38.T && PF38.T.mg) {
          const pool = PF38.T.mg.map(m => m.id);
          if (pool.length) kid.mg = C41.pick(pool, rnd || Math.random);
        }
        if (kid) C41.ensureKid(kid);
      } catch (e) {}
      return kid;
    };
    FAM37.birth._c41 = 1;
  }
})();

(function ui41() {
  if (typeof UI === 'undefined') return;
  UI.titles = UI.titles || {};
  UI.titles.clan41 = '🏯 家族';
  UI.p_clan41 = function (b) {
    b._tab = b._tab || 0;
    b.innerHTML = C41.html(b._tab);
    C41._bind(b);
  };
  // 包 p_fam37：顶部加家族按钮
  if (UI.p_fam37 && !UI.p_fam37._c41) {
    const _p = UI.p_fam37;
    UI.p_fam37 = function (b) {
      const r = _p.apply(this, arguments);
      try {
        const btn = (typeof h === 'function') ? h('button', 'opt', '🏯 家族') : null;
        if (btn) {
          btn.onclick = e => { e.stopPropagation(); UI.panel('clan41'); };
          if (b.firstChild) b.insertBefore(btn, b.firstChild);
          else b.appendChild(btn);
        } else {
          const d = document.createElement('button'); d.className = 'opt'; d.textContent = '🏯 家族';
          d.onclick = e => { e.stopPropagation(); UI.panel('clan41'); };
          b.insertBefore(d, b.firstChild);
        }
      } catch (e) { console.warn('clan41 p_fam37', e); }
      return r;
    };
    UI.p_fam37._c41 = 1;
  }
  // 包 useItem：须在 items40 之外层，拦截 6 个家族道具，避免「尚未开放」且不消耗。
  // 顺序无关：若 items40 后加载把我们盖住，setTimeout / 再次 install 会重新抢回最外层。
  C41._wrapGen = C41._wrapGen || 0;
  C41.installUseItemWrap = function () {
    if (typeof UI === 'undefined' || !UI.useItem) return false;
    if (UI.useItem._c41Mark === C41._wrapGen && C41._wrapGen > 0) return true;
    const _u = UI.useItem; const gen = ++C41._wrapGen;
    const w = async function (k) {
      try {
        if (C41.CLAN_ITEMS.indexOf(k) >= 0) {
          const ok = C41.useItem(k);
          if (ok && typeof Game !== 'undefined' && Game.save) Game.save();
          return; // 成败都已 toast，不再交给 items40 的「尚未开放」
        }
      } catch (e) { console.warn('clan41 useItem', e); }
      return _u.apply(this, arguments);
    };
    w._c41 = 1; w._c41Mark = gen; UI.useItem = w; return true;
  };
  C41.installUseItemWrap();
  try { setTimeout(() => C41.installUseItemWrap(), 0); setTimeout(() => C41.installUseItemWrap(), 100); } catch (e) {}
  // CSS
  try {
    const css = document.createElement('style');
    css.textContent = `.clan41{margin-top:8px}.clan41 .tabs{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}.clan41 .tabs .opt.on{outline:1px solid #ffe680}.clan41r{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:6px 0;padding:6px;border-radius:8px;background:rgba(255,210,122,.08);border:1px solid rgba(255,210,122,.3)}.clan41r small{opacity:.85;flex:1 1 100%}`;
    if (document.head) document.head.appendChild(css);
  } catch (e) {}
})();

(function dev41() {
  const reg = () => {
    if (!window.DevPanel || !DevPanel.registerTab) return false;
    DevPanel.registerTab('c41', '家族41', (box, ctx) => {
      const G = Game.G; if (!G) { box.innerHTML = '<p class="hint">未开局</p>'; return; }
      const C = C41.ensure(G);
      box.innerHTML = `<p class="hint">${C.on ? esc(C.name) + ' Lv' + C.lv + ' 声望' + C.rep : '未立族'}</p>` +
        ['found:立族', 'rep:声望+1000', 'prop:给良田', 'ev:触发族事', 'lv:检查升级', 'kidr:子嗣筑基', 'open:打开面板'].map(x => {
          const [a, n] = x.split(':'); return `<button class="opt" data-a="${a}">${n}</button>`;
        }).join('');
      box.onclick = async e => {
        const a = e.target.dataset && e.target.dataset.a; if (!a) return;
        if (a === 'found') { if (!C.on) C41.found(G); else ctx.toast('已立族'); }
        if (a === 'rep') { C41.addRep(C, 1000, G); ctx.toast('声望 ' + C.rep); }
        if (a === 'prop') { if (!C.on) C41.found(G); C41.giveProp(G, 'tian', true); ctx.toast('良田'); }
        if (a === 'ev') { if (!C.on) C41.found(G); await C41.runEvent(G, null); }
        if (a === 'lv') { C41.checkLv(G); ctx.toast('Lv ' + C.lv); }
        if (a === 'kidr') {
          const kids = (G.fam37 && G.fam37.kids) || [];
          if (kids[0]) { C41.ensureKid(kids[0]); kids[0].realm = Math.max(kids[0].realm, 2); kids[0].age = Math.max(kids[0].age, 20); ctx.toast(kids[0].n + ' 筑基'); }
          else ctx.toast('无子嗣');
        }
        if (a === 'open') UI.panel('clan41');
        ctx.save && ctx.save();
      };
    });
    return true;
  };
  if (typeof window !== 'undefined' && !reg()) setTimeout(reg, 500);
})();

if (typeof window !== 'undefined') { window.C41 = C41; window.TEXT41 = TEXT41; }

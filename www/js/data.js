'use strict';
// ======================= 基础数据 =======================
const REALMS = [
  { n: '凡人', life: 72, need: 80, tier: 0, brk: 0.9, T: 2 },
  { n: '练气', life: 130, need: 200, tier: 1, brk: 0.75, T: 5 },
  { n: '筑基', life: 220, need: 520, tier: 2, brk: 0.6, jie: 0, T: 10 },
  { n: '金丹', life: 420, need: 1300, tier: 3, brk: 0.5, jie: 3, T: 22 },
  { n: '元婴', life: 800, need: 3200, tier: 4, brk: 0.42, jie: 4, T: 45 },
  { n: '化神', life: 1500, need: 7600, tier: 5, brk: 0.36, jie: 6, T: 80 },
  { n: '渡劫', life: 3000, need: 18000, tier: 6, brk: 0.3, jie: 9, T: 140 },
  { n: '飞升', life: 99999, need: 1e12, tier: 7, brk: 0, T: 1 },
];
const STAGES = ['初期', '中期', '后期', '圆满'];
const STAGE_MUL = [1, 1.35, 1.75, 2.2];
const LINGGEN = [
  { id: 'none', n: '无灵根', mult: 0.35, el: [], w: 6, d: '天道看了都摇头，但你还有一张嘴。' },
  { id: 'wu', n: '五行伪灵根', mult: 0.7, el: ['金', '木', '水', '火', '土'], w: 30, d: '样样都会一点，样样都不精。' },
  { id: 'si', n: '四灵根', mult: 0.85, el: ['木', '水', '火', '土'], w: 22, d: '比上不足，比下……也不太足。' },
  { id: 'san', n: '三灵根', mult: 1.0, el: ['金', '水', '火'], w: 18, d: '中规中矩的修仙打工人。' },
  { id: 'shuang', n: '双灵根', mult: 1.3, el: ['木', '火'], w: 12, d: '宗门抢着要，但工资照样拖。' },
  { id: 'tian', n: '天灵根', mult: 1.8, el: ['金'], w: 6, d: '万中无一，天道开始关注你的还款能力。' },
  { id: 'lei', n: '异·雷灵根', mult: 2.0, el: ['雷'], w: 3, d: '天劫见了你都要喊一声老乡。' },
  { id: 'bing', n: '异·冰灵根', mult: 2.0, el: ['冰'], w: 3, d: '性格高冷，夏天很受欢迎。' },
];
const ELEM = { 金: '#ffd25e', 木: '#5adf6a', 水: '#4aa8ff', 火: '#ff6a3a', 土: '#c89a5a', 雷: '#c8a0ff', 冰: '#9ae8ff', 无: '#dddddd' };
const KE = { 金: '木', 木: '土', 土: '水', 水: '火', 火: '金', 雷: '水', 冰: '火' }; // 克制
const STATS = [['con', '体魄'], ['int', '悟性'], ['luck', '气运'], ['cha', '魅力'], ['wealth', '家境']];
const TALENTS = [
  // r:稀有度 0白1蓝2紫3橙
  { id: 'tough', n: '皮糙肉厚', r: 0, d: '体魄+2', f: g => g.st.con += 2 },
  { id: 'smart', n: '过目不忘', r: 0, d: '悟性+2', f: g => g.st.int += 2 },
  { id: 'lucky', n: '锦鲤附体', r: 1, d: '气运+3', f: g => g.st.luck += 3 },
  { id: 'pretty', n: '天生丽质', r: 0, d: '魅力+2', f: g => g.st.cha += 2 },
  { id: 'rich', n: '富二代', r: 1, d: '家境+3，初始灵石+300', f: g => { g.st.wealth += 3; g.stone += 300; } },
  { id: 'poor', n: '家徒四壁', r: 0, d: '家境-2，但体魄+3', f: g => { g.st.wealth -= 2; g.st.con += 3; } },
  { id: 'longlife', n: '老而不死', r: 1, d: '寿元+20', f: g => g.lifeBonus += 20 },
  { id: 'fastcult', n: '修炼狂魔', r: 2, d: '修为获取+25%', f: g => g.cultBonus += 0.25 },
  { id: 'slacker', n: '摸鱼圣体', r: 1, d: '每年行动力+1，修为-10%', f: g => { g.apBonus += 1; g.cultBonus -= 0.1; } },
  { id: 'debtor', n: '天道VIP', r: 1, d: '天道债务+5000，但每年有额外奇遇', f: g => { g.debt += 5000; g.flags.vip = 1; } },
  { id: 'swordheart', n: '天生剑心', r: 2, d: '攻击+15%', f: g => g.atkBonus += 0.15 },
  { id: 'ironbody', n: '金刚不坏', r: 2, d: '防御+20%，气血+10%', f: g => { g.defBonus += 0.2; g.hpBonus += 0.1; } },
  { id: 'alchemist', n: '丹道奇才', r: 1, d: '炼丹成功率+20%', f: g => g.alchBonus += 0.2 },
  { id: 'beastfriend', n: '万兽亲和', r: 1, d: '捕捉灵兽成功率+25%', f: g => g.catchBonus += 0.25 },
  { id: 'reborn', n: '重生者', r: 3, d: '全属性+2，知道很多剧情', f: g => { for (const k of ['con', 'int', 'luck', 'cha', 'wealth']) g.st[k] += 2; } },
  { id: 'tribul', n: '避雷体质', r: 2, d: '天劫伤害-40%', f: g => g.jieRes += 0.4 },
  { id: 'loser', n: '天煞孤星', r: 0, d: '气运-3，悟性+3', f: g => { g.st.luck -= 3; g.st.int += 3; } },
  { id: 'chatter', n: '嘴炮宗师', r: 1, d: '魅力+3，商店打八折', f: g => { g.st.cha += 3; g.flags.discount = 1; } },
  { id: 'glutton', n: '干饭人', r: 0, d: '丹药效果+30%', f: g => g.pillBonus += 0.3 },
  { id: 'mainchar', n: '主角光环', r: 3, d: '突破成功率+15%，必定被反派针对', f: g => { g.brkBonus += 0.15; g.flags.mainchar = 1; } },
  { id: 'oldsoul', n: '老爷爷附身', r: 2, d: '戒指里住着一位话痨老爷爷（修为+15%）', f: g => { g.cultBonus += 0.15; g.flags.grandpa = 1; } },
  { id: 'fishking', n: '钓鱼佬', r: 0, d: '钓鱼必有收获', f: g => g.flags.fish = 1 },
  { id: 'sleepy', n: '嗜睡', r: 0, d: '闭关收益+30%', f: g => g.medBonus += 0.3 },
  { id: 'speed', n: '神行太保', r: 1, d: '速度+30%', f: g => g.spdBonus += 0.3 },
  { id: 'crit', n: '暴击狂人', r: 1, d: '暴击率+10%', f: g => g.critBonus += 0.1 },
];
const RCOL = ['#c8c8c8', '#4fa3ff', '#b36bff', '#ffb020', '#ff5a5a'];
const RARITY = [
  { n: '凡品', c: '#d8d8d8', k: 'w', m: 1.0, aff: 0 },
  { n: '灵品', c: '#5adf6a', k: 'g', m: 1.3, aff: 1 },
  { n: '宝品', c: '#4aa8ff', k: 'b', m: 1.7, aff: 2 },
  { n: '仙品', c: '#b06aff', k: 'p', m: 2.3, aff: 3 },
  { n: '神品', c: '#ffa62a', k: 'o', m: 3.2, aff: 4 },
];
// ======================= 物品 =======================
const ITEMS = {
  hcd: { n: '回春丹', ic: 'pill_red', t: 'pill', p: 40, d: '回复50%气血', use: 'heal' },
  hld: { n: '回灵丹', ic: 'pill_blue', t: 'pill', p: 40, d: '回复50%灵力', use: 'mana' },
  pyd: { n: '培元丹', ic: 'pill_green', t: 'pill', p: 90, d: '获得大量修为', use: 'exp' },
  zjd: { n: '筑基丹', ic: 'pill_gold', t: 'pill', p: 300, d: '练气突破筑基成功率+30%（持有即生效）' },
  pjd: { n: '破境丹', ic: 'pill_purple', t: 'pill', p: 800, d: '任意突破成功率+15%（持有即生效）' },
  ysd: { n: '延寿丹', ic: 'pill_white', t: 'pill', p: 600, d: '寿元+20年', use: 'life' },
  xsd: { n: '洗髓丹', ic: 'pill_purple', t: 'pill', p: 2000, d: '重塑灵根（向上一档）', use: 'linggen' },
  tsf: { n: '替死符', ic: 'tal_r', t: 'tal', p: 900, d: '天劫/战斗濒死时自动抵挡一次' },
  ysf: { n: '御兽符', ic: 'tal_b', t: 'tal', p: 120, d: '战斗中捕捉残血妖兽' },
  herb: { n: '灵草', ic: 'herb', t: 'mat', p: 15, d: '炼丹基础材料' },
  lz: { n: '千年灵芝', ic: 'lingzhi', t: 'mat', p: 60, d: '炼丹材料' },
  ore: { n: '玄铁晶', ic: 'ore', t: 'mat', p: 50, d: '强化装备材料' },
  peach: { n: '蟠桃', ic: 'peach', t: 'mat', p: 120, d: '吃了+3年寿元，也是炼丹材料', use: 'peach' },
  yd: { n: '妖丹', ic: 'stone_r', t: 'mat', p: 45, d: '妖兽精华，炼丹材料' },
  egg: { n: '灵兽蛋', ic: 'egg', t: 'misc', p: 500, d: '使用后孵化随机灵兽', use: 'egg' },
  bill: { n: '祖传欠条', ic: 'bill', t: 'quest', p: 0, d: '“今欠天道飞升尾款捌仟捌佰捌拾捌灵石整”' },
  ledger: { n: '天道账本残页', ic: 'debtbook', t: 'quest', p: 0, d: '上面的利息算法让你怀疑人生' },
  key: { n: '秘境钥匙', ic: 'key', t: 'misc', p: 100, d: '可以打开宝箱' },
  scroll: { n: '残破功法', ic: 'scroll', t: 'misc', p: 200, d: '使用后随机领悟一门功法', use: 'scroll' },
  wine: { n: '桃花酿', ic: 'gourd', t: 'gift', p: 30, d: '送礼佳品（剑仙最爱）' },
  jadeg: { n: '暖玉', ic: 'jade', t: 'gift', p: 150, d: '送礼佳品' },
  fan: { n: '题字折扇', ic: 'fan', t: 'gift', p: 80, d: '送礼佳品' },
  coin: { n: '古钱', ic: 'coin', t: 'misc', p: 300, d: '可以卖个好价钱' },
  fish: { n: '灵鱼', ic: 'pill_blue', t: 'mat', p: 25, d: '钓来的，可卖钱或送礼' },
};
const GIFTS = ['wine', 'jadeg', 'fan', 'peach', 'fish', 'coin'];
// 装备底子
const EQ_BASES = {
  weapon: [['铁剑', 'sword_w'], ['青锋剑', 'sword_g'], ['寒霜剑', 'sword_b'], ['紫电剑', 'sword_p'], ['轩辕剑（盗版）', 'sword_o'], ['油纸伞', 'umbrella'], ['折扇', 'fan']],
  armor: [['布衣', 'robe_w'], ['青衫', 'robe_g'], ['云纹道袍', 'robe_b'], ['紫霞仙衣', 'robe_p'], ['金缕羽衣', 'robe_o']],
  hat: [['道冠', 'hat']],
  boots: [['踏云靴', 'boots']],
  acc: [['储物戒', 'ring'], ['灵玉佩', 'jade'], ['寒玉戒', 'ring_b']],
  treasure: [['镇魂铃', 'bell'], ['照妖镜', 'mirror'], ['翻天印', 'seal'], ['玲珑塔', 'pagoda'], ['紫金葫芦', 'gourd_g'], ['招魂幡', 'flag'], ['天道算盘', 'abacus']],
};
const SLOTS = [['weapon', '武器'], ['armor', '衣服'], ['hat', '头冠'], ['boots', '鞋子'], ['acc', '饰品'], ['treasure', '法宝']];
const AFFIX = [['atk', '攻击', 0.08], ['def', '防御', 0.08], ['hp', '气血', 0.1], ['mp', '灵力', 0.1], ['spd', '速度', 0.06], ['crit', '暴击', 0.03], ['cult', '修炼速度', 0.05], ['luck', '气运', 1]];
const TREASURE_FX = { '镇魂铃': '攻击有15%概率眩晕', '照妖镜': '受击反弹20%伤害', '翻天印': '技能伤害+20%', '玲珑塔': '受到伤害-12%', '紫金葫芦': '每回合回复4%气血', '招魂幡': '速度+20%', '天道算盘': '战斗灵石+50%' };
// ======================= 技能 / 功法 =======================
// tg: one/all/self/ally ; k: 伤害倍率 ; fx: 特效
const SKILLS = {
  atk: { n: '普攻', mp: 0, tg: 'one', k: 1.0, el: null, fx: 'slash', ic: 'sword_w', d: '平平无奇的一击' },
  meditate: { n: '打坐', mp: 0, tg: 'self', k: 0, fx: 'heal', ic: 'sk_meditate', d: '回复25%灵力', mana: 0.25 },
  heal: { n: '回春术', mp: 18, tg: 'ally', k: 0, fx: 'heal', ic: 'sk_heal', d: '回复35%气血', heal: 0.35 },
  vine: { n: '缠绕藤', mp: 14, tg: 'one', k: 1.2, el: '木', fx: 'vine', ic: 'sk_wood', d: '木系伤害，40%定身', stun: 0.4 },
  fireball: { n: '火球术', mp: 12, tg: 'one', k: 1.6, el: '火', fx: 'fire', ic: 'sk_fire', d: '火系单体伤害' },
  inferno: { n: '烈焰焚天', mp: 30, tg: 'all', k: 1.15, el: '火', fx: 'fireall', ic: 'sk_fire', d: '火系群体伤害' },
  icecone: { n: '冰锥术', mp: 12, tg: 'one', k: 1.5, el: '冰', fx: 'ice', ic: 'sk_ice', d: '冰系伤害，减速', slow: 1 },
  frost: { n: '寒冰领域', mp: 30, tg: 'all', k: 1.05, el: '冰', fx: 'iceall', ic: 'sk_ice', d: '冰系群体伤害，减速', slow: 1 },
  thunder: { n: '掌心雷', mp: 14, tg: 'one', k: 1.8, el: '雷', fx: 'thunder', ic: 'sk_thunder', d: '雷系单体高伤害' },
  thunderall: { n: '九天雷罚', mp: 36, tg: 'all', k: 1.3, el: '雷', fx: 'thunderall', ic: 'sk_thunder', d: '雷系群体伤害' },
  swordqi: { n: '剑气斩', mp: 10, tg: 'one', k: 1.7, el: '金', fx: 'swordqi', ic: 'sk_metal', d: '金系单体伤害' },
  flysword: { n: '御剑术', mp: 20, tg: 'one', k: 2.3, el: '金', fx: 'flysword', ic: 'sword_b', d: '飞剑贯穿，高伤害' },
  wanjian: { n: '万剑归宗', mp: 40, tg: 'all', k: 1.5, el: '金', fx: 'wanjian', ic: 'sk_swords', d: '金系群体伤害' },
  rockarmor: { n: '岩甲术', mp: 14, tg: 'self', k: 0, fx: 'shield', ic: 'sk_shield', d: '3回合防御+50%', buff: 'def' },
  quake: { n: '地裂术', mp: 26, tg: 'all', k: 1.15, el: '土', fx: 'quake', ic: 'sk_earth', d: '土系群体伤害' },
  water: { n: '水龙吟', mp: 16, tg: 'one', k: 1.6, el: '水', fx: 'water', ic: 'sk_ice', d: '水系单体伤害' },
  blood: { n: '血祭', mp: 0, tg: 'one', k: 2.6, el: '火', fx: 'blood', ic: 'sk_dark', d: '消耗15%气血，造成巨额伤害', hpcost: 0.15 },
  demonfire: { n: '天魔焰', mp: 28, tg: 'all', k: 1.35, el: '火', fx: 'dark', ic: 'sk_dark', d: '魔焰群体伤害，吸血20%', drain: 0.2 },
  deny: { n: '赖账术', mp: 16, tg: 'one', k: 0, fx: 'deny', ic: 'bill', d: '让敌人陷入“你欠我？”的混乱，跳过2回合', stun: 1 },
  freeload: { n: '白嫖掌', mp: 10, tg: 'one', k: 1.2, fx: 'coin', ic: 'coin', d: '造成伤害并顺走灵石' , steal: 1 },
  pengci: { n: '碰瓷', mp: 8, tg: 'self', k: 0, fx: 'shield', ic: 'sk_flee', d: '下次受击反弹100%伤害', buff: 'reflect' },
  light: { n: '大日金光', mp: 34, tg: 'all', k: 1.45, el: '金', fx: 'light', ic: 'sk_light', d: '金光普照，群体伤害' },
  poison: { n: '万毒噬心', mp: 18, tg: 'one', k: 0.8, el: '木', fx: 'poison', ic: 'sk_poison', d: '中毒3回合', dot: 1 },
};
const TECHS = {
  changsheng: { n: '《长生诀》', ic: 'book_g', d: '凡人也能练的养生功法', sk: ['meditate', 'heal'], pas: { hp: 0.06 } },
  qingyun: { n: '《青云剑诀》', ic: 'book_b', d: '青云宗镇派剑诀', sk: ['swordqi', 'flysword', 'wanjian'], pas: { atk: 0.06 }, sect: 'qingyun' },
  baicao: { n: '《百草经》', ic: 'book_g', d: '百草谷丹修心法', sk: ['heal', 'vine', 'poison'], pas: { alch: 0.08, hp: 0.04 }, sect: 'baicao' },
  tianmo: { n: '《天魔解体大法》', ic: 'book_p', d: '天魔殿秘传，伤人伤己', sk: ['blood', 'demonfire'], pas: { atk: 0.08 }, sect: 'tianmo' },
  wulei: { n: '《五雷正法》', ic: 'book_p', d: '雷修最爱', sk: ['thunder', 'thunderall'], pas: { atk: 0.05 }, el: '雷' },
  taiyin: { n: '《太阴寒冰诀》', ic: 'book_b', d: '冰系心法', sk: ['icecone', 'frost'], pas: { mp: 0.08 }, el: '冰' },
  lihuo: { n: '《离火真经》', ic: 'book_r', d: '火系心法', sk: ['fireball', 'inferno'], pas: { atk: 0.05 }, el: '火' },
  houtu: { n: '《厚土诀》', ic: 'book_o', d: '土系心法', sk: ['rockarmor', 'quake'], pas: { def: 0.08 }, el: '土' },
  shuilong: { n: '《沧海诀》', ic: 'book_b', d: '水系心法', sk: ['water', 'heal'], pas: { mp: 0.06 }, el: '水' },
  laizhang: { n: '《赖账真经》', ic: 'debtbook', d: '天道最怕的功法', sk: ['deny', 'freeload'], pas: { luck: 2 } },
  moyu: { n: '《摸鱼心法》', ic: 'book_o', d: '工作是不可能工作的', sk: ['pengci'], pas: { ap: 1 } },
  dari: { n: '《大日如来经》', ic: 'book_o', d: '佛门至高（据说）', sk: ['light'], pas: { def: 0.05, hp: 0.05 }, el: '金' },
};
const SKILL_TREE = [
  { id: 'sword', n: '剑道', nodes: [['锋芒', '攻击+8%', { atk: 0.08 }], ['剑意', '暴击+6%', { crit: 0.06 }], ['剑心', '普攻25%连击', { combo: 0.25 }], ['御剑', '金系技能+20%', { metal: 0.2 }], ['剑仙', '攻击+15%', { atk: 0.15 }]] },
  { id: 'magic', n: '法道', nodes: [['灵海', '灵力+15%', { mp: 0.15 }], ['回流', '每回合回灵5%', { mpregen: 0.05 }], ['精通', '技能伤害+15%', { skill: 0.15 }], ['双修', '技能20%连发', { double: 0.2 }], ['法相', '技能伤害+25%', { skill: 0.25 }]] },
  { id: 'body', n: '体道', nodes: [['铜皮', '防御+10%', { def: 0.1 }], ['气血', '气血+15%', { hp: 0.15 }], ['回血', '每回合回血4%', { regen: 0.04 }], ['不屈', '每场战斗免死一次', { undying: 1 }], ['金身', '气血+25%', { hp: 0.25 }]] },
  { id: 'misc', n: '杂学', nodes: [['丹心', '炼丹成功+15%', { alch: 0.15 }], ['驭兽', '捕捉+20%，灵兽属性+15%', { catch: 0.2, pet: 0.15 }], ['财迷', '灵石收益+30%', { gold: 0.3 }], ['摸鱼', '每年行动力+1', { ap: 1 }], ['天命', '突破成功+10%', { brk: 0.1 }]] },
];
// ======================= 怪物 =======================
// t: 档次（对应境界）, el: 元素, sk: 技能
const MONS = {
  slime: { n: '讨债史莱姆', spr: 'mon_slime', el: '水', hp: 1.0, atk: 0.9, def: 0.8, spd: 0.8, sk: ['atk'], pet: 1, drop: ['herb', 'yd'] },
  boar: { n: '暴躁野猪', spr: 'mon_boar', el: '土', hp: 1.2, atk: 1.1, def: 1.0, spd: 0.9, sk: ['atk'], pet: 1, drop: ['yd', 'herb'] },
  collector: { n: '讨债鬼', spr: 'mon_collector', el: '金', hp: 1.0, atk: 1.0, def: 0.9, spd: 1.1, sk: ['atk', 'freeload'], drop: ['coin', 'yd'] },
  paper: { n: '纸符小鬼', spr: 'mon_paper', el: '火', hp: 0.8, atk: 1.2, def: 0.7, spd: 1.3, sk: ['atk', 'fireball'], pet: 1, drop: ['scroll', 'herb'] },
  rock: { n: '石头精', spr: 'mon_rock', el: '土', hp: 1.6, atk: 0.9, def: 1.5, spd: 0.6, sk: ['atk', 'rockarmor'], pet: 1, drop: ['ore', 'ore'] },
  fox: { n: '狐妖', spr: 'mon_fox', el: '火', hp: 0.9, atk: 1.2, def: 0.8, spd: 1.4, sk: ['atk', 'fireball'], pet: 1, drop: ['yd', 'jadeg'] },
  fire: { n: '火灵', spr: 'mon_fire', el: '火', hp: 0.9, atk: 1.3, def: 0.8, spd: 1.2, sk: ['atk', 'fireball', 'inferno'], pet: 1, drop: ['yd', 'ore'] },
  treant: { n: '树妖', spr: 'mon_treant', el: '木', hp: 1.5, atk: 1.0, def: 1.2, spd: 0.7, sk: ['atk', 'vine'], pet: 1, drop: ['lz', 'herb'] },
  crab: { n: '铁钳蟹将', spr: 'mon_crab', el: '水', hp: 1.3, atk: 1.1, def: 1.4, spd: 0.9, sk: ['atk', 'water'], pet: 1, drop: ['yd', 'coin'] },
  ghost: { n: '游魂', spr: 'mon_ghost', el: '冰', hp: 0.9, atk: 1.2, def: 0.7, spd: 1.3, sk: ['atk', 'icecone'], pet: 1, drop: ['scroll', 'yd'] },
  jiangshi: { n: '僵尸', spr: 'mon_jiangshi', el: '土', hp: 1.4, atk: 1.2, def: 1.1, spd: 0.6, sk: ['atk', 'poison'], drop: ['lz', 'coin'] },
  demon: { n: '小魔头', spr: 'mon_demon', el: '火', hp: 1.2, atk: 1.3, def: 1.0, spd: 1.1, sk: ['atk', 'demonfire', 'blood'], drop: ['yd', 'scroll'] },
  // BOSS
  corpse: { n: '尸王·欠一世', spr: 'boss_corpse', el: '土', hp: 6, atk: 1.4, def: 1.3, spd: 0.8, sk: ['atk', 'poison', 'quake'], boss: 1, drop: ['ledger', 'lz', 'egg'] },
  dragon: { n: '东海龙王·敖铁公', spr: 'boss_dragon', el: '水', hp: 7, atk: 1.5, def: 1.3, spd: 1.0, sk: ['atk', 'water', 'thunderall'], boss: 1, drop: ['peach', 'egg', 'pjd'] },
  mozun: { n: '魔尊·赊刀人', spr: 'boss_mozun', el: '火', hp: 7.5, atk: 1.6, def: 1.2, spd: 1.2, sk: ['atk', 'demonfire', 'blood'], boss: 1, drop: ['pjd', 'xsd'] },
  tiandao: { n: '讨尾款的天道', spr: 'boss_tiandao', el: '雷', hp: 9, atk: 1.7, def: 1.4, spd: 1.1, sk: ['atk', 'thunderall', 'thunder', 'deny'], boss: 1, drop: [] },
};
const PET_SKILL = { slime: ['atk', 'water'], boar: ['atk', 'quake'], paper: ['atk', 'fireball'], rock: ['atk', 'rockarmor'], fox: ['atk', 'fireball'], fire: ['atk', 'inferno'], treant: ['atk', 'vine', 'heal'], crab: ['atk', 'water'], ghost: ['atk', 'icecone'] };
// ======================= 地图 =======================
// tier: 怪物档次; mons: 野怪种类; need: 进入所需境界
const MAPINFO = {
  village: { n: '桃花村', tier: 0, need: 0, mons: ['slime', 'boar'], cnt: 4, bgm: 'village', sky: ['#9fd4ff', '#e8f6ff'], amb: 'petal', start: [10, 18], d: '你出生的小村子。桃花开得很好，债主也来得很勤。' },
  sect: { n: '青云宗', tier: 1, need: 1, mons: ['paper', 'rock'], cnt: 4, bgm: 'sect', sky: ['#8fc8ff', '#f0f8ff'], amb: 'leaf', start: [10, 18], d: '正道魁首，主要业务是收学费。' },
  market: { n: '云来坊市', tier: 1, need: 1, mons: ['collector', 'fox'], cnt: 4, bgm: 'market', sky: ['#ffc898', '#fff0d8'], amb: 'lantern', start: [10, 18], d: '修仙界最大的集市，十个摊主九个奸商。' },
  secret: { n: '万妖秘境', tier: 1.9, need: 2, mons: ['treant', 'fox', 'rock', 'fire'], cnt: 6, bgm: 'secret', sky: ['#6a5aa8', '#c8b8f0'], amb: 'firefly', start: [10, 19], d: '妖兽横行，宝箱也横行。' },
  graveyard: { n: '乱葬岗', tier: 2.3, need: 2, mons: ['jiangshi', 'ghost', 'paper'], cnt: 6, bgm: 'graveyard', sky: ['#4a5a6a', '#a0a8b8'], amb: 'ghostfire', start: [10, 19], boss: 'corpse', d: '阴气森森，据说有个尸王欠了天道一辈子。' },
  island: { n: '东海仙岛', tier: 3.3, need: 3, mons: ['crab', 'fire', 'slime'], cnt: 6, bgm: 'island', sky: ['#5ac8ff', '#e0fbff'], amb: 'bubble', start: [12, 15], boss: 'dragon', d: '蓬莱仙境，龙王在这里开了家离岸钱庄。' },
  rift: { n: '魔道裂谷', tier: 4.3, need: 4, mons: ['demon', 'fire', 'rock'], cnt: 6, bgm: 'rift', sky: ['#5a1a2a', '#c86a4a'], amb: 'ember', start: [10, 19], boss: 'mozun', d: '魔修的地盘，空气里都是欠条的味道。' },
  heaven: { n: '天外天', tier: 5.6, need: 5, mons: ['paper', 'ghost', 'collector'], cnt: 6, bgm: 'heaven', sky: ['#fff2c8', '#ffffff'], amb: 'sparkle', start: [10, 19], boss: 'tiandao', d: '天道讨债司总部所在，门口写着“概不赊账”。' },
};
const MAP_ORDER = ['village', 'sect', 'market', 'secret', 'graveyard', 'island', 'rift', 'heaven'];
// ======================= NPC =======================
const NPCS = {
  mom: { n: '娘', spr: 'npc_mom', map: 'village', at: [7, 8], por: 'npc_mom' },
  farmer: { n: '王大爷', spr: 'npc_farmer', map: 'village', at: [14, 7], por: 'npc_farmer' },
  cuihua: { n: '翠花', spr: 'npc_girl', map: 'village', at: [12, 16], por: 'npc_girl', comp: 1, sex: 'f' },
  mentor: { n: '落魄剑仙', spr: 'npc_mentor', map: 'village', at: [9, 13], por: 'npc_mentor', minAge: 10 },
  villager: { n: '说书先生', spr: 'npc_villager', map: 'village', at: [4, 11], por: 'npc_villager' },
  elder: { n: '掌门·云中鹤', spr: 'npc_elder', map: 'sect', at: [10, 8], por: 'npc_elder' },
  sister: { n: '师姐·林小满', spr: 'npc_sister', map: 'sect', at: [12, 13], por: 'npc_sister', comp: 1, sex: 'f' },
  xiaoyi: { n: '师兄·萧逸', spr: 'npc_disciple', map: 'sect', at: [8, 14], por: 'npc_disciple', comp: 1, sex: 'm' },
  danlao: { n: '丹房长老', spr: 'npc_alchemist', map: 'sect', at: [5, 8], por: 'npc_alchemist' },
  merchant: { n: '奸商·钱多多', spr: 'npc_merchant', map: 'market', at: [9, 9], por: 'npc_merchant' },
  yaopu: { n: '药铺掌柜', spr: 'npc_alchemist', map: 'market', at: [13, 11], por: 'npc_alchemist' },
  shuoshu: { n: '茶馆小二', spr: 'npc_villager', map: 'market', at: [7, 15], por: 'npc_villager' },
  fisherm: { n: '钓鱼佬', spr: 'npc_fisher', map: 'market', at: [3, 18], por: 'npc_fisher' },
  ali: { n: '狐妖·阿离', spr: 'mon_fox', map: 'secret', at: [11, 10], por: 'mon_fox', comp: 1, sex: 'f' },
  lost: { n: '迷路的弟子', spr: 'npc_disciple', map: 'secret', at: [6, 15], por: 'npc_disciple' },
  keeper: { n: '守墓人', spr: 'npc_farmer', map: 'graveyard', at: [10, 16], por: 'npc_farmer' },
  aoxiao: { n: '龙女·敖小乐', spr: 'npc_dragongirl', map: 'island', at: [12, 13], por: 'npc_dragongirl', comp: 1, sex: 'f' },
  guzhu: { n: '百草谷主', spr: 'npc_alchemist', map: 'island', at: [7, 7], por: 'npc_alchemist' },
  fisher2: { n: '老渔夫', spr: 'npc_fisher', map: 'island', at: [9, 16], por: 'npc_fisher' },
  sumei: { n: '魔女·苏魅', spr: 'npc_witch', map: 'rift', at: [9, 12], por: 'npc_witch', comp: 1, sex: 'f' },
  moguard: { n: '魔殿执事', spr: 'mon_demon', map: 'rift', at: [12, 7], por: 'mon_demon' },
  xianguan: { n: '仙官·记账童子', spr: 'npc_disciple', map: 'heaven', at: [10, 10], por: 'npc_disciple' },
  mentor2: { n: '落魄剑仙', spr: 'npc_mentor', map: 'heaven', at: [7, 16], por: 'npc_mentor', minRealm: 5 },
};
const SECTS = {
  qingyun: { n: '青云宗', master: 'elder', tech: 'qingyun', d: '正道魁首，剑修圣地。入门送一把木剑（押金另付）。', karma: 1 },
  baicao: { n: '百草谷', master: 'guzhu', tech: 'baicao', d: '丹修宗门，炼丹+20%，伙食很好。', karma: 1 },
  tianmo: { n: '天魔殿', master: 'moguard', tech: 'tianmo', d: '魔道宗门，攻击高，福报更高。', karma: -1 },
};
// 宗门贡献兑换
const SECT_SHOP = [['pyd', 30], ['hld', 10], ['hcd', 10], ['zjd', 80], ['pjd', 200], ['scroll', 60], ['ysf', 20], ['egg', 150]];
// ======================= 炼丹配方 =======================
const RECIPES = [
  { out: 'hcd', n: 2, need: { herb: 2 }, lv: 0 },
  { out: 'hld', n: 2, need: { herb: 1, yd: 1 }, lv: 0 },
  { out: 'pyd', n: 1, need: { herb: 1, lz: 1 }, lv: 1 },
  { out: 'zjd', n: 1, need: { lz: 2, yd: 1 }, lv: 1 },
  { out: 'ysd', n: 1, need: { peach: 2, lz: 1 }, lv: 2 },
  { out: 'pjd', n: 1, need: { lz: 1, yd: 2, peach: 1 }, lv: 3 },
  { out: 'xsd', n: 1, need: { yd: 3, lz: 2, ore: 1 }, lv: 4 },
];
// ======================= 任务 =======================
// need: k=击杀{mon:n} i=物品{id:n} f=标记
const QUESTS = {
  q_soup: { n: '娘的灵草汤', giver: 'mom', d: '娘想给你炖碗灵草汤补补身子。', need: { i: { herb: 2 } }, rw: { exp: 40, stone: 30, item: { hcd: 2 } }, minAge: 7 },
  q_boar: { n: '野猪之患', giver: 'farmer', d: '野猪把王大爷的菜地拱了，打三只野猪。', need: { k: { boar: 3 } }, rw: { exp: 60, stone: 60, item: { wine: 2 } }, minAge: 8 },
  q_hairpin: { n: '翠花的心事', giver: 'cuihua', d: '翠花想要一块暖玉做发簪。', need: { i: { jadeg: 1 } }, rw: { exp: 50, aff: { cuihua: 25 } }, minAge: 12 },
  q_train: { n: '师姐的试炼', giver: 'sister', d: '击败5只纸符小鬼证明你不是来混日子的。', need: { k: { paper: 5 } }, rw: { exp: 200, stone: 100, aff: { sister: 20 }, item: { pyd: 1 } }, sect: 1 },
  q_herbs: { n: '丹房缺货', giver: 'danlao', d: '丹房缺千年灵芝，送来3株。', need: { i: { lz: 3 } }, rw: { exp: 300, stone: 200, item: { zjd: 1 } } },
  q_debts: { n: '代理收账', giver: 'merchant', d: '钱多多让你去收拾4个讨债鬼——同行是冤家。', need: { k: { collector: 4 } }, rw: { exp: 300, stone: 400 } },
  q_fish: { n: '钓鱼佬的执念', giver: 'fisherm', d: '帮他钓3条灵鱼，他说空军太久了。', need: { i: { fish: 3 } }, rw: { exp: 120, stone: 150, item: { ysf: 3 } } },
  q_lost: { n: '迷途弟子', giver: 'lost', d: '迷路的弟子想要回家，帮他清理6只树妖开路。', need: { k: { treant: 6 } }, rw: { exp: 800, stone: 300, item: { key: 2 } } },
  q_tail: { n: '阿离的尾巴毛', giver: 'ali', d: '阿离的尾巴毛被火灵烧焦了，击败5只火灵出气。', need: { k: { fire: 5 } }, rw: { exp: 900, aff: { ali: 25 } } },
  q_grave: { n: '夜班守墓', giver: 'keeper', d: '僵尸半夜扰民，清理6只。', need: { k: { jiangshi: 6 } }, rw: { exp: 1500, stone: 600, item: { tsf: 1 } } },
  q_coral: { n: '龙女的珊瑚', giver: 'aoxiao', d: '小乐想要5颗妖丹做项链（龙族审美）。', need: { i: { yd: 5 } }, rw: { exp: 2400, aff: { aoxiao: 25 }, item: { peach: 2 } } },
  q_witch: { n: '魔女的委托', giver: 'sumei', d: '苏魅要你击败8个小魔头——她说是为了团建。', need: { k: { demon: 8 } }, rw: { exp: 6000, aff: { sumei: 25 }, item: { pjd: 1 } } },
  q_peach: { n: '蟠桃会外卖', giver: 'xianguan', d: '记账童子想要3个蟠桃，用于“招待”。', need: { i: { peach: 3 } }, rw: { exp: 12000, stone: 3000 } },
  q_story: { n: '说书先生的素材', giver: 'villager', d: '去乱葬岗看看，回来讲给他听（到达乱葬岗即可）。', need: { f: 'visit_graveyard' }, rw: { exp: 400, stone: 200, item: { scroll: 1 } }, minAge: 14 },
  q_xiaoyi: { n: '师兄的剑', giver: 'xiaoyi', d: '萧逸想要3块玄铁晶重铸佩剑。', need: { i: { ore: 3 } }, rw: { exp: 400, aff: { xiaoyi: 25 }, stone: 100 }, sect: 1 },
  q_guzhu: { n: '谷主的考验', giver: 'guzhu', d: '炼制一枚破境丹给谷主看看。', need: { i: { pjd: 1 } }, rw: { exp: 4000, item: { egg: 1, xsd: 1 } } },
};
// 主线（天道讨债）
const MAIN = [
  { n: '序章·上门讨债', d: '讨债的找上门了，先把它打跑！', map: 'village', realm: 0, age: 6 },
  { n: '第一章·剑仙路过', d: '村口来了个蹭酒的落魄剑仙，去找他聊聊。', map: 'village', realm: 0, age: 10 },
  { n: '第二章·拜入仙门', d: '修炼到练气期，然后去青云宗（或别的宗门）拜师。', map: 'sect', realm: 1 },
  { n: '第三章·坊市查账', d: '去云来坊市找钱多多，问问欠条是哪来的。', map: 'market', realm: 1 },
  { n: '第四章·秘境追债', d: '筑基后前往万妖秘境，找狐妖阿离打听天道的打手。', map: 'secret', realm: 2 },
  { n: '第五章·尸王赖账', d: '乱葬岗的尸王据说也欠天道一辈子，击败它拿账本。', map: 'graveyard', realm: 2, boss: 'corpse' },
  { n: '第六章·离岸钱庄', d: '金丹后去东海，龙王在替天道洗灵石。', map: 'island', realm: 3, boss: 'dragon' },
  { n: '第七章·魔尊也欠钱', d: '元婴后去魔道裂谷，魔尊手里有天道的把柄。', map: 'rift', realm: 4, boss: 'mozun' },
  { n: '终章·讨尾款的天道', d: '化神后登天外天，去讨债司和天道当面对账！', map: 'heaven', realm: 5, boss: 'tiandao' },
  { n: '完结', d: '天道的账已经算清。剩下的人生，随你。', map: null, realm: 0 },
];
const ACHS = {
  first_blood: ['初战告捷', '赢下第一场战斗'], kill100: ['百人斩', '累计击败100个敌人'], kill500: ['杀疯了', '累计击败500个敌人'],
  r1: ['踏入仙途', '突破到练气'], r2: ['筑基成功', '突破到筑基'], r3: ['金丹大道', '凝结金丹'], r4: ['元婴老怪', '修成元婴'], r5: ['化神真君', '突破化神'], r6: ['渡劫天尊', '突破渡劫'],
  jie: ['雷劫老乡', '渡过一次天劫'], pet1: ['铲屎官', '拥有第一只灵兽'], pet5: ['动物园园长', '拥有5只灵兽'], partner: ['神仙眷侣', '结为道侣'],
  alch10: ['丹道入门', '炼成10炉丹药'], rich: ['小富即安', '同时拥有10000灵石'], richer: ['富可敌天', '同时拥有200000灵石'],
  debt0: ['无债一身轻', '还清天道债务'], allmaps: ['云游四方', '去过全部8张地图'], boss4: ['讨债人克星', '击败全部4个BOSS'],
  sect: ['有编制了', '加入一个宗门'], tech5: ['博览群书', '学会5门功法'], legend: ['神品出世', '获得一件神品装备'],
  young_die: ['英年早逝', '20岁前去世'], old: ['千年老妖', '活到1000岁'], lives3: ['轮回老手', '经历3次轮回'],
  fish10: ['钓鱼佬', '钓到10条灵鱼'], tree10: ['点满一条', '技能树任意一系点满'], quest10: ['热心市民', '完成10个支线任务'], gift: ['送礼达人', '送出20次礼物'], end3: ['多周目玩家', '解锁3个结局'],
};
const ENDINGS = {
  mortal: ['凡人一生', '你没能踏入仙途，在桃花村度过了平凡而温暖的一生。天道的账单寄到了你孙子手里。'],
  sit: ['坐化', '寿元耗尽，你在蒲团上安详坐化。临终前最后一句话是：“尾款……下辈子再说。”'],
  ash: ['劫灰', '天雷落下，你化作一缕青烟。天道在账本上写：坏账，核销。'],
  ascend: ['白日飞升', '你渡过九九天劫，白日飞升！刚进南天门，就被递上了一张飞升尾款催缴单。'],
  paid: ['还清尾款', '你一次性结清了祖传债务，天道感动得发了一张“诚信修士”锦旗，你带着锦旗飞升了。'],
  newdao: ['新任天道', '你击败了讨尾款的天道，接管了天道讨债司。第一条新规：利息全免。'],
  demon: ['魔尊降世', '你以魔入道，自封魔尊。天道再也不敢给你寄账单。'],
  couple: ['神仙眷侣', '你与道侣归隐桃花村，种桃酿酒，岁月静好。天道的催收电话被你们拉黑了。'],
  tycoon: ['富甲三界', '你的灵石多到收购了天道的债权，现在是天道欠你的了。'],
};
const META_PERKS = [
  { id: 'ap', n: '前世勤快', d: '每年行动力+1', cost: 30, max: 2 },
  { id: 'stat', n: '先天加成', d: '初始属性点+2', cost: 20, max: 5 },
  { id: 'stone', n: '前世存款', d: '初始灵石+200', cost: 10, max: 5 },
  { id: 'reroll', n: '天赋重随', d: '天赋可多刷新2次', cost: 15, max: 3 },
  { id: 'gen', n: '灵根改命', d: '灵根抽取更偏向好灵根', cost: 40, max: 3 },
  { id: 'life', n: '轮回延寿', d: '寿元+10', cost: 15, max: 5 },
  { id: 'exp', n: '宿慧', d: '修为获取+10%', cost: 25, max: 5 },
];
// 名字
const SURN = '李王张刘陈杨赵黄周吴徐孙胡朱高林何郭马罗梁宋郑谢韩唐冯于董萧程曹袁邓许傅沈曾彭吕苏卢蒋蔡贾丁魏薛叶阎余潘杜戴夏钟汪田任姜范方石姚谭廖邹熊金陆郝孔白崔康毛邱秦江史顾侯邵孟龙万段雷钱汤尹黎易常武乔贺赖龚文欧阳上官司马诸葛'.match(/欧阳|上官|司马|诸葛|./g);
const GIVEN = '逍遥 不凡 长生 二狗 铁柱 无忌 小满 清风 明月 子墨 青云 浩然 无名 一剑 富贵 来福 星河 守拙 知秋 听雨 不仙 大锤 翠花 招财 问天 寒山 拾得 半仙 闲鱼 摸鱼'.split(' ');

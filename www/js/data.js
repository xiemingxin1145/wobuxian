/* 数据：境界、灵根、天赋、事件、物品、轮回殿 */
'use strict';
const REALMS = [
  { n: '凡人', life: 70, need: 20, stages: 1, col: '#9a9a9a', robe: '#8aa0b8', aura: null, rate: 0.95 },
  { n: '练气', life: 120, need: 60, stages: 4, col: '#5fb760', robe: '#6fbf8a', aura: null, rate: 0.75 },
  { n: '筑基', life: 200, need: 180, stages: 4, col: '#3a9ad9', robe: '#5a9ee0', aura: 'rgba(120,200,255,0.6)', rate: 0.6 },
  { n: '金丹', life: 350, need: 520, stages: 4, col: '#e0a020', robe: '#f0c050', aura: 'rgba(255,215,90,0.7)', rate: 0.5, trib: 3 },
  { n: '元婴', life: 600, need: 1500, stages: 4, col: '#d0509a', robe: '#e07ab8', aura: 'rgba(255,140,200,0.7)', rate: 0.42, trib: 5 },
  { n: '化神', life: 1000, need: 4200, stages: 4, col: '#8a5ae0', robe: '#a07af0', aura: 'rgba(190,140,255,0.75)', rate: 0.35, trib: 7 },
  { n: '渡劫', life: 1600, need: 12000, stages: 4, col: '#e04040', robe: '#fff4e0', aura: 'rgba(255,240,200,0.85)', rate: 0.3, trib: 9 },
  { n: '飞升', life: 99999, need: 1, stages: 1, col: '#ffd75e', robe: '#fffaf0', aura: 'rgba(255,255,220,0.95)', rate: 0, trib: 12 }
];
const STAGES = ['初期', '中期', '后期', '圆满'];
const LINGGEN = [
  { n: '天灵根', d: '万中无一，修炼如喝水', mul: 2.2, w: 3, col: '#ffd75e' },
  { n: '异灵根·雷', d: '天劫见了你都得喊声老乡', mul: 1.8, w: 5, col: '#c08aff', trib: 0.15 },
  { n: '双灵根', d: '资质上佳，长老会多看你两眼', mul: 1.4, w: 14, col: '#7fd3ff' },
  { n: '三灵根', d: '普普通通，勤能补拙', mul: 1.0, w: 30, col: '#9be15d' },
  { n: '四灵根', d: '杂了点，但杂粮更健康', mul: 0.75, w: 24, col: '#e9d39c' },
  { n: '伪灵根', d: '测灵石亮了一下，又灭了', mul: 0.5, w: 16, col: '#bbb' },
  { n: '没有灵根', d: '纯种凡人，修仙全靠头铁', mul: 0.28, w: 8, col: '#888' }
];
const STATS = [['con', '体魄', '影响战力与寿元'], ['int', '悟性', '影响修炼与突破'], ['luck', '气运', '影响奇遇与保命'], ['cha', '魅力', '影响人缘与价格'], ['wealth', '家境', '影响初始灵石']];
// 天赋 r: 0灰 1蓝 2紫 3金
const TALENTS = [
  { id: 'jxzs', n: '剑仙转世', r: 3, d: '斗法战力+50%，梦里常有人喊你还剑钱', m: { pow: 0.5 } },
  { id: 'tsdt', n: '天生道体', r: 3, d: '修炼速度+50%', m: { cult: 0.5 } },
  { id: 'tdqn', n: '天道欠你钱', r: 3, d: '渡天劫成功率+25%，天道看见你就心虚', m: { trib: 0.25 } },
  { id: 'bsxq', n: '不死小强', r: 3, d: '第一次死亡时原地复活（寿终除外）', m: {} },
  { id: 'bphy', n: '白嫖护体', r: 2, d: '坊市购物有25%概率老板忘记收钱', m: {} },
  { id: 'myxf', n: '摸鱼心法', r: 2, d: '不修炼的年份也能获得40%修为（躺着也在练）', m: {} },
  { id: 'szjj', n: '赊账剑诀', r: 2, d: '灵石可以欠到负数，代价是讨债鬼会上门', m: { pow: 0.15 } },
  { id: 'jlft', n: '锦鲤附体', r: 2, d: '气运+5', s: { luck: 5 } },
  { id: 'lljh', n: '雷灵亲和', r: 2, d: '天劫成功率+15%，头发天生自来卷', m: { trib: 0.15 } },
  { id: 'dqwc', n: '大器晚成', r: 2, d: '50岁后修炼速度翻倍', m: {} },
  { id: 'ddtc', n: '丹道天才', r: 2, d: '丹药效果+50%', m: { pill: 0.5 } },
  { id: 'csjy', n: '长寿基因', r: 2, d: '寿元+25%，你太奶奶活了一百二', m: { life: 0.25 } },
  { id: 'luox', n: '落魄剑仙之徒', r: 2, d: '出生即被一位落魄剑仙预定为徒弟（他想白嫖学费）', m: {} },
  { id: 'zh', n: '早慧', r: 1, d: '悟性+3', s: { int: 3 } },
  { id: 'ttw', n: '铁头娃', r: 1, d: '体魄+3', s: { con: 3 } },
  { id: 'fed', n: '富二代', r: 1, d: '家境+4', s: { wealth: 4 } },
  { id: 'wrm', n: '万人迷', r: 1, d: '魅力+4', s: { cha: 4 } },
  { id: 'sk', n: '社恐', r: 1, d: '魅力-2，但修炼+20%（没人打扰）', s: { cha: -2 }, m: { cult: 0.2 } },
  { id: 'qg', n: '穷则思变', r: 1, d: '家境-2，悟性+3', s: { wealth: -2, int: 3 } },
  { id: 'jpx', n: '键盘侠', r: 1, d: '斗法时嘴炮附加伤害，战力+15%', m: { pow: 0.15 } },
  { id: 'tsgx', n: '天煞孤星', r: 1, d: '气运-3，战力+30%', s: { luck: -3 }, m: { pow: 0.3 } },
  { id: 'chi', n: '吃货', r: 0, d: '体魄+2，每年多花10灵石买零嘴', s: { con: 2 } },
  { id: 'lg', n: '路痴', r: 0, d: '去秘境时常迷路，偶尔迷到宝库里', m: {} },
  { id: 'hl', n: '话痨', r: 0, d: '魅力+1，奇遇概率提升', s: { cha: 1 } },
  { id: 'qzt', n: '欠债体质', r: 0, d: '债多不压身：气运+3，但每年莫名少20灵石', s: { luck: 3 } },
  { id: 'xm', n: '咸鱼', r: 0, d: '修炼-20%，但寿元+10%（不操心）', m: { cult: -0.2, life: 0.1 } }
];
const RCOL = ['#a0a0a0', '#4fa3ff', '#b36bff', '#ffb020'];
const ITEMS = {
  hcd: { n: '回春丹', d: '治愈伤势，顺便+5年寿元', p: 60 },
  zjd: { n: '筑基丹', d: '练气→筑基突破率+30%', p: 150 },
  pjd: { n: '破境丹', d: '任意突破率+15%', p: 400 },
  ysd: { n: '延寿丹', d: '寿元+30年', p: 300 },
  tsf: { n: '替死符', d: '渡劫失败时替你挡一下（概率保命）', p: 500 },
  pyd: { n: '培元丹', d: '立刻获得一年半的修为', p: 120 },
  bpq: { n: '白嫖券', d: '落魄剑仙手写，坊市不认', p: 0 }
};
const SHOP = ['pyd', 'hcd', 'zjd', 'pjd', 'ysd', 'tsf'];
const META = [
  { id: 'pts', n: '先天之气', d: '每级初始属性点+2', cost: l => 8 + l * 6, max: 5 },
  { id: 'cand', n: '天赋眼', d: '每级天赋候选+1', cost: l => 12 + l * 10, max: 4 },
  { id: 'gold', n: '祖传存折', d: '每级初始灵石+100', cost: l => 6 + l * 5, max: 5 },
  { id: 'life', n: '前世养生', d: '每级寿元+8%', cost: l => 15 + l * 12, max: 4 },
  { id: 'root', n: '灵根保底', d: '灵根至少为三灵根', cost: () => 30, max: 1 },
  { id: 'reroll', n: '重开券', d: '每级天赋可多刷新1次', cost: l => 10 + l * 8, max: 3 }
];
const NPC = {
  mentor: { name: '落魄剑仙', hair: '#3a3a3a', robe: '#8a8f9a', robe2: '#ddd', belt: '#7a4a2a', hat: 'straw', bun: false, hold: 'gourd', sword: true, beard: true, bg: '#e8f0ff' },
  sister: { name: '师姐·林小满', hair: '#2a1b14', robe: '#ff9ec4', robe2: '#fff', belt: '#ffd75e', longhair: true, ribbon: '#ff5a8a', bg: '#ffeef5' },
  elder: { name: '掌门·云中鹤', hair: '#ddd', robe: '#2f8a7a', robe2: '#fff', belt: '#ffd75e', beard: true, hold: 'fan', bg: '#e6fff6' },
  merchant: { name: '奸商·钱多多', hair: '#4a2a1a', robe: '#e0a020', robe2: '#fff', belt: '#c33', hold: 'book', bun: false, hat: 'straw', bg: '#fff3d0' },
  mom: { name: '娘', hair: '#3a2418', robe: '#c86a6a', robe2: '#fff', belt: '#ffd', longhair: true, bg: '#fff0e6' },
  rival: { name: '宿敌·龙傲天', hair: '#5a2a7a', robe: '#e05a5a', robe2: '#ffd', belt: '#333', sword: true, ribbon: '#333', bg: '#ffe6e6' },
  fox: { monster: 'fox', name: '狐妖·阿离', bg: '#fff0e0' },
  collector: { monster: 'collector', name: '讨债鬼', bg: '#e8e8f0' },
  boss: { monster: 'boss', name: '讨尾款的天道', bg: '#f0f0ff' },
  you: { you: true }
};
const SURN = '李王张刘陈杨赵黄周吴徐孙胡朱高林何郭马罗梁宋郑谢韩唐冯于董萧程曹袁邓许傅沈曾彭吕苏卢蒋蔡贾丁魏薛叶阎余潘杜戴夏钟汪田任姜范方石姚谭廖邹熊金陆郝孔白崔康毛邱秦江史顾侯邵孟龙万段雷钱汤尹黎易常武乔贺赖龚文欧阳上官司马诸葛'.match(/欧阳|上官|司马|诸葛|./g);
const GIVEN = '逍遥 不凡 长生 二狗 铁柱 无忌 小满 清风 明月 子墨 青云 浩然 无名 一剑 富贵 来福 星河 守拙 知秋 听雨 不仙 大锤 翠花 招财 问天 寒山 拾得 半仙 闲鱼 摸鱼'.split(' ');
function randName() { return SURN[(Math.random() * SURN.length) | 0] + GIVEN[(Math.random() * GIVEN.length) | 0]; }

/* 事件：cond(s,G) 条件；w 权重；once 只触发一次；npc 插图；text；f 自动结算 或 choices */
const EVENTS = [
  // —— 幼年 ——
  { id: 'birth_sign', once: 1, w: 50, cond: s => s.age === 1 && s.ling <= 1, text: '你出生那天，天降紫气，村口的老母猪一口气下了十二只崽。村长连夜把猪供了起来。', f: (s, G) => { G.stat('luck', 1); return '气运+1'; } },
  { id: 'zhuazhou', once: 1, w: 80, cond: s => s.age === 1, npc: 'mom', text: '抓周礼上，桌上摆着木剑、书本、算盘和接生婆的金镯子。你伸出了小胖手……',
    choices: [{ t: '抓木剑', f: (s, G) => { G.stat('con', 1); return '你挥着木剑把舅舅敲哭了。体魄+1'; } },
      { t: '抓书本', f: (s, G) => { G.stat('int', 1); return '你把书啃了一半。悟性+1'; } },
      { t: '抓算盘', f: (s, G) => { G.stones(20); return '全家欢呼：将来能算清自己欠多少钱！灵石+20'; } },
      { t: '抓金镯子', f: (s, G) => { G.stat('luck', 1); G.stat('cha', -1); return '接生婆脸绿了。气运+1，魅力-1'; } }] },
  { id: 'firstword', once: 1, w: 40, cond: s => s.age === 2, text: '你学会了说话，第一句是“借我点钱”。你娘沉默了很久。', f: (s, G) => { G.stat('cha', 1); return '魅力+1（大家觉得你很有前途）'; } },
  { id: 'goose', once: 1, w: 40, cond: s => s.age >= 3 && s.age <= 5, text: '你被村头的大白鹅追了三里地，从此跑得比狗快。', f: (s, G) => { G.stat('con', 1); return '体魄+1'; } },
  { id: 'well', once: 1, w: 20, cond: s => s.age >= 3 && s.age <= 6, text: '你趴在井边看月亮，失足掉了下去，却在井底摸到一块发光的石头。', f: (s, G) => { G.stones(30); G.stat('luck', 1); return '灵石+30，气运+1'; } },
  { id: 'baby_mentor', once: 1, w: 90, cond: s => s.age === 4 && G0.has('luox'), npc: 'mentor', text: '一个邋遢老头蹲在你家门口：“这娃骨骼清奇，跟我修仙吧！……先付三年学费。”',
    choices: [{ t: '把压岁钱给他', f: (s, G) => { G.stones(-Math.min(30, Math.max(0, s.stones))); s.flags.mentor = 1; s.flags.manual = 1; return '老头收了钱，留下一本《白嫖剑诀》就跑了。你获得了功法！'; } },
      { t: '喊娘', f: (s, G) => { s.flags.mentor = 1; return '老头被你娘用扫帚赶走，临走喊：“我还会回来的！”'; } }] },
  // —— 少年 ——
  { id: 'school', once: 1, w: 30, cond: s => s.age >= 6 && s.age <= 10, text: '你进了村里的私塾。先生教“天地玄黄”，你在底下画小乌龟。',
    choices: [{ t: '认真听讲', f: (s, G) => { G.stat('int', 1); return '悟性+1'; } }, { t: '继续画乌龟', f: (s, G) => { G.stat('cha', 1); return '同学们抢着要你的乌龟画。魅力+1'; } }] },
  { id: 'immortal_pass', once: 1, w: 40, cond: s => s.age >= 7 && s.age <= 12, text: s => '一位踩着飞剑的仙人路过，掉下来一块测灵石，正好砸在你头上。石头亮了：<b style="color:' + LINGGEN[s.ling].col + '">' + LINGGEN[s.ling].n + '</b>！', f: (s, G) => s.ling <= 2 ? (G.stat('luck', 1), '仙人回头看了你一眼，若有所思。气运+1') : '仙人头也没回。' },
  { id: 'sect_recruit', once: 1, w: 120, cond: s => s.age >= 10 && s.age <= 18 && !s.flags.sect, npc: 'elder', text: '青云宗十年一次开山收徒！掌门云中鹤亲自主持，山门前人山人海，连卖瓜子的都来了。',
    choices: [{ t: '去参加考核', f: async (s, G) => { const p = 0.25 + (5 - s.ling) * 0.12 + s.st.int * 0.03 + s.st.luck * 0.02; if (G.roll(p)) { s.flags.sect = 1; s.flags.manual = 1; G.unlock('sect'); return '你通过了考核，成为青云宗外门弟子！获得功法《青云引气诀》，解锁【青云宗】'; } return '考官看了看你的灵根，叹气道：“孩子，回家种地吧。”（之后还有机会）'; } },
      { t: '在家种地', f: () => '你选择了平凡。地里的萝卜长得特别好。' }] },
  { id: 'sect_recruit2', w: 8, cond: s => s.age >= 16 && s.age <= 40 && !s.flags.sect && s.realm >= 1, npc: 'elder', text: '青云宗的执事找上门：“道友散修不易，可愿入我宗门？包吃包住，五险一金。”',
    choices: [{ t: '加入青云宗', f: (s, G) => { s.flags.sect = 1; G.unlock('sect'); return '你成为青云宗弟子，解锁【青云宗】'; } }, { t: '散修自由', f: (s, G) => { G.stat('luck', 1); return '你拒绝了。自由的风吹过你空空的钱袋。气运+1'; } }] },
  { id: 'meet_mentor', once: 1, w: 60, cond: s => s.age >= 8 && s.age <= 40 && !s.flags.mentor2, npc: 'mentor', text: '村口臭水沟里躺着个醉醺醺的剑仙，抱着个空葫芦唱：“我不仙~我不仙~欠了天道三百年~”。他睁开一只眼：“小友，借点酒钱？”',
    choices: [{ t: '给他打一壶酒（-10灵石）', f: (s, G) => { G.stones(-10); s.flags.mentor = 1; s.flags.mentor2 = 1; s.flags.manual = 1; G.stat('int', 1); return '剑仙喝得满面红光，拍着你肩膀：“够义气！以后你就是我徒弟了！”获得功法《白嫖剑诀》，悟性+1。<br>（他顺走了你的钱袋）'; } },
      { t: '假装没看见', f: (s, G) => { s.flags.mentor2 = 1; return '你绕道走了。身后传来幽幽一声：“现在的年轻人啊……”'; } },
      { t: '踢他一脚', f: (s, G) => { s.flags.mentor2 = 1; G.stat('con', 2); return '他醒了，追了你三条街。你的腿脚从此异常利索。体魄+2'; } }] },
  { id: 'fake_manual', once: 1, w: 25, cond: s => s.age >= 10 && !s.flags.manual, text: '你在旧书摊花两文钱买到一本《三天速成练气诀（盗版）》，扉页写着“读完包会，不会退钱”。', f: (s, G) => { s.flags.manual = 1; return '获得功法！终于可以正经修炼了（大概）'; } },
  { id: 'flower', once: 1, w: 20, cond: s => s.age >= 13 && s.age <= 18, text: '隔壁的小花给你塞了个煮鸡蛋，红着脸跑了。',
    choices: [{ t: '追上去', f: (s, G) => G.roll(0.3 + s.st.cha * 0.05) ? (s.flags.love = 1, G.stat('cha', 2), '你们一起看了晚霞。魅力+2，心情大好') : (G.stat('con', 1), '你被她哥哥揍了一顿。体魄+1') },
      { t: '吃掉鸡蛋，专心修炼', f: (s, G) => { G.cultYear(0.3); return '鸡蛋很香。你的道心很稳。修为小涨'; } }] },
  { id: 'flood', once: 1, w: 12, cond: s => s.age >= 8 && s.realm === 0, text: '村里发大水，你家的猪被冲走了。', choices: [{ t: '跳水救猪', f: (s, G) => { G.stat('con', 2); G.stones(15); return '你把猪救了回来，猪感激地看着你。体魄+2，猪卖了15灵石'; } }, { t: '去高处躲着', f: () => '猪自己游回来了，比你还淡定。' }] },
  // —— 落魄剑仙（师父） ——
  { id: 'mentor_borrow', w: 10, cond: s => s.flags.mentor && s.age >= 12, npc: 'mentor', text: '师父又来了：“徒儿，为师最近手头有点紧……”',
    choices: [{ t: '借他50灵石', f: (s, G) => { G.stones(-50); if (G.roll(0.5)) { G.cultYear(1.2); return '师父喝了酒，心情大好，传你一招“赊刀诀”。修为大涨！'; } return '师父拿钱去买了彩票。没中。'; } },
      { t: '“师父我也没钱”', f: (s, G) => { G.stat('int', 1); return '师父叹道：“好，好，有为师当年的风骨。”悟性+1'; } }] },
  { id: 'mentor_song', w: 6, cond: s => s.flags.mentor && s.age >= 10, npc: 'mentor', text: '月下，师父抱着酒葫芦唱起了他的成名曲《我不仙》：“说好的长生不老~怎么先老了~”', f: (s, G) => { G.cultYear(0.5); return '你若有所悟（主要是悟到了不要欠钱）。修为小涨'; } },
  { id: 'mentor_gift', once: 1, w: 8, cond: s => s.flags.mentor && s.realm >= 2, npc: 'mentor', text: '师父把一张皱巴巴的纸塞给你：“为师压箱底的宝贝，关键时刻能保命！”', f: (s, G) => { G.item('bpq', 1); G.item('tsf', 1); return '获得【白嫖券】×1……以及一张真的【替死符】×1！师父居然靠谱了一次'; } },
  // —— 宗门 ——
  { id: 'sister', w: 12, cond: s => s.loc === 'sect', npc: 'sister', text: '师姐林小满路过，看你打坐姿势，“噗嗤”一笑：“你这是在修仙还是在孵蛋？”',
    choices: [{ t: '虚心求教', f: (s, G) => { G.cultYear(0.6); G.stat('int', 1); return '师姐纠正了你的姿势。修为上涨，悟性+1'; } }, { t: '“孵蛋怎么了”', f: (s, G) => { G.stat('cha', 1); return '师姐笑得更开心了。魅力+1'; } }] },
  { id: 'sweep', w: 10, cond: s => s.loc === 'sect', text: '你偷吃了长老的灵桃，被罚扫三个月山门台阶（九千九百九十九级）。', f: (s, G) => { G.stat('con', 2); return '扫完后你的腿比石头还硬。体魄+2'; } },
  { id: 'cat', w: 6, cond: s => s.loc === 'sect', text: '长老的灵猫卡在了藏经阁顶上。', choices: [{ t: '御剑去救', f: (s, G) => G.roll(0.6) ? (G.stones(80), '长老塞给你一个红包。灵石+80') : (G.life(-1), '你和猫一起摔了下来。猫没事，你折寿一年') }, { t: '扔条小鱼干', f: (s, G) => { G.stat('luck', 1); return '猫跳下来，从此天天跟着你。气运+1'; } }] },
  { id: 'tournament', w: 9, cond: s => s.loc === 'sect' && s.realm >= 1, npc: 'rival', text: '宗门大比！对面是号称“三年之期已到”的龙傲天。', choices: [{ t: '上台！', f: async (s, G) => (await G.battle('rival', 1.05, '龙傲天')) ? (G.stones(120), s.fame = (s.fame || 0) + 1, '你赢了！龙傲天撂下狠话：“莫欺少年穷！”灵石+120') : '你输了。龙傲天：“就这？”' }, { t: '弃权去食堂', f: (s, G) => { G.stat('con', 1); return '今天食堂有灵兽红烧肉。体魄+1'; } }] },
  { id: 'library', w: 6, cond: s => s.loc === 'sect', text: '你在藏经阁角落翻出一本《如何优雅地赖账》，作者署名：落魄剑仙。', f: (s, G) => { G.stat('int', 1); G.stat('luck', 1); return '悟性+1，气运+1'; } },
  // —— 坊市 ——
  { id: 'scam', w: 10, cond: s => s.loc === 'market', npc: 'merchant', text: '奸商钱多多神秘兮兮：“道友，祖传九转金丹，只要99灵石！”', choices: [{ t: '买！', f: (s, G) => { G.stones(-99); if (G.roll(0.25)) { G.cultYear(3); return '居然是真的！修为暴涨！'; } return '你吃下去，打了个嗝，是糖豆。'; } }, { t: '砍价到9灵石', f: (s, G) => G.roll(0.2 + s.st.cha * 0.04) ? (G.stones(-9), G.item('pyd', 1), '奸商哭着卖了，结果是真【培元丹】！') : '奸商把你轰了出去。' }] },
  { id: 'gamble', w: 8, cond: s => s.loc === 'market', text: '坊市新开了一家“赌石坊”，切开石头可能出灵玉，也可能出石头。', choices: [{ t: '赌一把（-50）', f: (s, G) => { G.stones(-50); return G.roll(0.3 + s.st.luck * 0.03) ? (G.stones(200), '出绿了！灵石+200') : '切开一看，是石头。纯纯的石头。'; } }, { t: '十赌九输，走了', f: () => '你保住了钱包，也保住了尊严。' }] },
  { id: 'auction', w: 5, cond: s => s.loc === 'market' && s.realm >= 2, text: '拍卖会上压轴拍品：【延寿丹】！起拍价250灵石。', choices: [{ t: '举牌（-300）', f: (s, G) => { if (s.stones < 300 && !G0.has('szjj')) return '你摸了摸钱包，默默放下了牌子。'; G.stones(-300); G.item('ysd', 1); return '你拍下了延寿丹！'; } }, { t: '看个热闹', f: () => '最后被一个戴面具的人拍走了，你觉得那背影很像你师父。' }] },
  { id: 'street', w: 8, cond: s => s.loc === 'market', text: '你在坊市角落捡到一个钱袋，上面绣着“讨债专用”。', choices: [{ t: '交给巡逻队', f: (s, G) => { G.stat('cha', 2); return '巡逻队长夸你是好人。魅力+2'; } }, { t: '揣兜里', f: (s, G) => { G.stones(60); s.debtHeat = (s.debtHeat || 0) + 2; return '灵石+60。你隐约感到被盯上了……'; } }] },
  // —— 秘境 ——
  { id: 'chest', w: 12, cond: s => s.loc === 'secret', text: '你发现一个宝箱，上面写着“绝对不是陷阱”。', choices: [{ t: '打开', f: async (s, G) => { if (G.roll(0.55)) { const g = 80 + s.realm * 120; G.stones(g); return '真的是宝箱！灵石+' + g; } return (await G.battle('beast', 0.9, '宝箱怪')) ? '是宝箱怪！你把它打回了原形，掉落了一些灵石。' : '是宝箱怪！它咬了你一口就跑了。'; } }, { t: '绕开', f: () => '你很谨慎。宝箱在背后失望地合上了嘴。' }] },
  { id: 'herb', w: 10, cond: s => s.loc === 'secret', text: '悬崖边长着一株千年灵芝，在风中摇曳。', choices: [{ t: '爬过去采', f: (s, G) => G.roll(0.5 + s.st.con * 0.03) ? (G.cultYear(2), '你采到了灵芝，生吃了。修为暴涨！') : (G.life(-3), '你摔下悬崖，挂在树上三天。寿元-3') }, { t: '用剑勾', f: (s, G) => G.roll(0.4) ? (G.stones(150), '勾到了！卖了150灵石') : '灵芝掉下了悬崖。' }] },
  { id: 'fox', once: 1, w: 8, cond: s => s.loc === 'secret' && s.age >= 16, npc: 'fox', text: '一只受伤的小狐狸蜷在路边，它突然开口：“道友……帮帮我……”',
    choices: [{ t: '给它包扎', f: (s, G) => { s.flags.fox = 1; G.stat('luck', 3); return '狐狸化作少女阿离，留下一缕狐毛：“恩情必报。”气运+3'; } }, { t: '拿去卖', f: async (s, G) => (await G.battle('fox', 1.3, '狐妖阿离')) ? (G.stones(200), '它是狐妖！你险胜，得灵石200（良心-1）') : (G.life(-5), '狐妖把你揍了一顿。寿元-5') }] },
  { id: 'lost', w: 6, cond: s => s.loc === 'secret' && G0.has('lg'), text: '你又迷路了。转了七天七夜，误入一座上古洞府。', f: (s, G) => { G.cultYear(2); G.stones(100); return '修为暴涨，灵石+100。路痴也有春天'; } },
  // —— 讨债 ——
  { id: 'collector', w: 0, cond: s => s.stones < 0 || (s.debtHeat || 0) >= 3, npc: 'collector', dyn: s => (s.stones < 0 ? 40 : 15), text: '门口来了个戴高帽的讨债鬼，帽子上写着“一见还钱”。', choices: [{ t: '打出去！', f: async (s, G) => { s.debtHeat = 0; if (await G.battle('collector', 0.95, '讨债鬼')) { if (s.stones < 0) s.stones = Math.floor(s.stones / 2); return '你把讨债鬼打跑了，他临走把你的欠款撕了一半（手抖）。'; } G.life(-3); if (s.stones < 0) s.stones = 0; return '讨债鬼抢走了你所有家当抵债，还顺手打折了你的腿。寿元-3'; } }, { t: '装死', f: (s, G) => { s.debtHeat = 0; return G.roll(0.4 + s.st.luck * 0.03) ? '讨债鬼戳了你半天，以为你真死了，叹气走了。' : (s.stones = Math.min(0, s.stones), G.life(-2), '讨债鬼：“鬼才信你死了，我就是鬼。”寿元-2'); } }] },
  // —— 通用 ——
  { id: 'meteor', w: 3, cond: s => s.age >= 10, text: '天上掉下一块陨石，正好砸在你脚边。', f: (s, G) => { G.stones(100 + s.realm * 50); return '你捡起来一看，里面有灵石！灵石+' + (100 + s.realm * 50); } },
  { id: 'insight', w: 6, cond: s => s.realm >= 1, text: '你看着一片落叶飘下，忽有所悟：“原来修仙，也是要上班的。”', f: (s, G) => { G.cultYear(1); return '修为提升'; } },
  { id: 'demon', w: 5, cond: s => s.realm >= 2, text: '魔修来犯！一群黑衣人在空中摆出了很酷的造型。', choices: [{ t: '迎战', f: async (s, G) => (await G.battle('beast', 1.1, '魔修头目')) ? (G.stones(200 + s.realm * 80), s.fame = (s.fame || 0) + 1, '你一剑破敌，名声大噪！') : (G.life(-8), '你被打成重伤，寿元-8') }, { t: '跑', f: () => '你跑得很快，比上次被鹅追还快。' }] },
  { id: 'disciple', once: 1, w: 6, cond: s => s.realm >= 3, text: '一个小孩跪在你门口：“仙长收我为徒吧！我会做饭！”', choices: [{ t: '收了', f: (s, G) => { s.flags.disciple = 1; G.stones(-30); return '徒弟的饭做得很难吃，但你很开心。（你终于理解了师父）'; } }, { t: '“我自己都养不活”', f: () => '小孩去隔壁拜师了。' }] },
  { id: 'notice', w: 5, cond: s => s.realm >= 4, npc: 'boss', text: '天上降下一道金光，是天道发来的《催款通知书》：“您的飞升名额尾款尚未结清，请尽快处理。”', choices: [{ t: '已读不回', f: (s, G) => { G.stat('luck', -1); return '天道把你拉进了黑名单。气运-1'; } }, { t: '分期付款（-300）', f: (s, G) => { G.stones(-300); s.tribBonus = (s.tribBonus || 0) + 0.1; return '天道很满意。下次渡劫成功率+10%'; } }] },
  { id: 'teaparty', w: 4, cond: s => s.realm >= 1 && s.age >= 20, text: '道友们组织了一场“修仙内卷交流会”，大家互相吹嘘闭关了多少年。', f: (s, G) => { G.stat('cha', 1); return '你吹得最响。魅力+1'; } },
  { id: 'parents', once: 1, w: 15, cond: s => s.age >= 18 && s.age <= 25, npc: 'mom', text: '娘：“隔壁二狗都抱孙子了，你还在这儿修什么仙？”', choices: [{ t: '“娘，我要长生！”', f: (s, G) => { G.stat('int', 1); return '娘叹了口气，给你塞了两个馒头。悟性+1'; } }, { t: '“那我去相亲”', f: (s, G) => { G.stat('cha', 1); G.stones(30); return '相亲对象是个女修，你们聊了一晚上功法。魅力+1，她借你30灵石'; } }] },
  { id: 'old', once: 1, w: 30, cond: s => s.age >= s.life - 10 && s.age > 40, text: '你发现镜子里多了几根白发。修仙之人，也是会老的。', f: (s, G) => '时间不多了，要抓紧突破啊！' },
  { id: 'mentor_farewell', once: 1, w: 10, cond: s => s.flags.mentor && s.realm >= 4, npc: 'mentor', text: '师父喝完最后一口酒：“徒儿，为师的债，天道追了三百年……今天，为师还清了。”他化作一道剑光飞向天际。', f: (s, G) => { G.cultYear(3); s.flags.mentorGone = 1; return '你继承了师父的酒葫芦（空的）和他的剑意。修为暴涨！'; } }
];

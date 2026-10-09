'use strict';
// ======================= v2.1 剧情与角色扩充 =======================
// 本文件在 data.js / events.js 之后加载，扩充 NPC、主线章节、任务链、结局与成就。
// ---- 新建模角色替换原来的共用模型 ----
Object.assign(NPCS.villager, { spr: 'npc_storyteller', por: 'npc_storyteller' });
Object.assign(NPCS.shuoshu, { spr: 'npc_xiaoer', por: 'npc_xiaoer' });
Object.assign(NPCS.yaopu, { n: '药铺掌柜·杜仲', spr: 'npc_yaopu', por: 'npc_yaopu' });
Object.assign(NPCS.guzhu, { n: '百草谷主·花满蹊', spr: 'npc_guzhu', por: 'npc_guzhu' });
Object.assign(NPCS.keeper, { spr: 'npc_keeper', por: 'npc_keeper' });
Object.assign(NPCS.xianguan, { spr: 'npc_tongzi', por: 'npc_tongzi' });
Object.assign(NPCS.elder, { spr: 'npc_qymaster', por: 'npc_qymaster' });
// ---- 新角色 ----
Object.assign(NPCS, {
  aotian: { n: '宿敌·龙傲天', spr: 'npc_aotian', map: 'sect', at: [14, 11], por: 'npc_aotian', minRealm: 1, comp: 1, sex: 'm',
    roam: G => G.realm >= 5 ? 'heaven' : G.realm >= 3 ? 'island' : G.realm >= 2 ? 'market' : 'sect' },
  heixin: { n: '黑心长老', spr: 'npc_heixin', map: 'sect', at: [6, 12], por: 'npc_heixin', minRealm: 1 },
  ruyan: { n: '剑客·柳如烟', spr: 'npc_ruyan', map: 'market', at: [12, 16], por: 'npc_ruyan', minRealm: 1, comp: 1, sex: 'f' },
  bailang: { n: '书生·白玉郎', spr: 'npc_bailang', map: 'market', at: [5, 12], por: 'npc_bailang', minRealm: 1, comp: 1, sex: 'm' },
  baoxian: { n: '天道保险·保真人', spr: 'npc_baoxian', map: 'market', at: [11, 6], por: 'npc_baoxian', minRealm: 2 },
  lengyue: { n: '冷月仙子', spr: 'npc_lengyue', map: 'island', at: [15, 9], por: 'npc_lengyue', minRealm: 3, comp: 1, sex: 'f' },
  mengpo: { n: '孟婆', spr: 'npc_mengpo', map: 'graveyard', at: [6, 9], por: 'npc_mengpo', minRealm: 2 },
  yuelao: { n: '月老', spr: 'npc_yuelao', map: 'village', at: [11, 4], por: 'npc_yuelao', minAge: 16 },
  judge: { n: '讨债司判官·钱不够', spr: 'npc_judge', map: 'heaven', at: [13, 7], por: 'npc_judge', minRealm: 5 },
  luren: { n: '路人甲', spr: 'npc_luren', map: 'village', at: [15, 14], por: 'npc_luren',
    roam: G => { const ok = MAP_ORDER.filter(id => Game.canEnter(id)); return ok[(G.year * 7 + 3) % ok.length]; } },
});
Object.assign(CHAT, {
  aotian: ['“三十年河东，三十年河西，莫欺少年穷！”（他今年三十一岁）', '“我龙傲天，命中注定是主角！”', '“你又走在我前面了？不可能！”', '“哼，下次宗门大比，我必雪前耻。”', '“……其实我挺佩服你的。别告诉别人。”'],
  heixin: ['“年轻人，宗门的事少打听。”', '“贡献点？那是宗门的，也就是我的。”', '“嘿嘿，最近手头有点紧啊……”'],
  ruyan: ['“酒和剑，都要烈的。”', '“我的剑只斩两种人：欠钱不还的，和收债的。”', '“喂，请我喝一杯？”', '“江湖路远，有缘再见——明天这个时候我还在这。”'],
  bailang: ['“子曰：修仙之道，在于……在于……我忘了。”', '“小生不才，屡试不第，只好改修仙了。”', '“这首诗是写给你的——就是押韵还没想好。”'],
  baoxian: ['“天道保险，保您飞升无忧！”', '“意外险、渡劫险、道侣出轨险，应有尽有！”', '“理赔？这个嘛……要看条款第三百二十七条。”'],
  lengyue: ['“……”', '“月色很好。你可以走了。”', '“我以前在讨债司上班。后来良心发现，辞职了。”', '“你身上的债气很重。”'],
  mengpo: ['“汤要趁热喝。”', '“喝了汤，前尘往事一笔勾销——欠款除外。”', '“我这汤，加糖还是加盐？”', '“你下辈子想当什么？算了，先排队。”'],
  yuelao: ['“红线不够用了，最近修仙的都在谈恋爱。”', '“小伙子/小姑娘，有心上人没？”', '“姻缘天定，份子钱也是。”'],
  judge: ['“钱不够？我就是钱不够。有事？”', '“天道的账，一分都不能少！”', '“利息算法？保密。”'],
  luren: ['“我只是路过的。”', '“怎么又是你？”', '“我在每张地图都有亲戚。”', '“你说我是不是该有个名字？”', '“我觉得我也是有故事的人。”'],
});
// ---- 可战斗的人物 ----
Object.assign(MONS, {
  aotian: { n: '龙傲天', spr: 'npc_aotian', el: '金', hp: 1.6, atk: 1.25, def: 1.1, spd: 1.2, sk: ['atk', 'swordqi', 'flysword'], drop: ['pyd', 'ore'] },
  heixin: { n: '黑心长老', spr: 'npc_heixin', el: '木', hp: 2.4, atk: 1.25, def: 1.2, spd: 1.0, sk: ['atk', 'poison', 'vine'], drop: ['zjd', 'pyd'] },
  judge: { n: '判官·钱不够', spr: 'npc_judge', el: '雷', hp: 4.5, atk: 1.5, def: 1.3, spd: 1.1, sk: ['atk', 'thunder', 'deny', 'thunderall'], drop: ['pjd', 'ledger'] },
  ruyan: { n: '柳如烟', spr: 'npc_ruyan', el: '金', hp: 1.4, atk: 1.4, def: 0.9, spd: 1.4, sk: ['atk', 'swordqi'], drop: ['wine'] },
});
Object.assign(PET_SKILL, {});
// ---- 主线：每个境界都有命名章节（id 驱动，代码中用 MI('id') 引用） ----
MAIN.splice(0, MAIN.length,
  { id: 'debt', n: '序章·上门讨债', d: '讨债的找上门了，先把它打跑！', map: 'village', realm: 0, age: 6 },
  { id: 'mentor', n: '第一章·剑仙路过', d: '村口来了个蹭酒的落魄剑仙，去找他聊聊。', map: 'village', realm: 0, age: 10 },
  { id: 'sect', n: '第二章·拜入仙门', d: '修炼到练气期，然后去青云宗（或别的宗门）拜师。', map: 'sect', realm: 1 },
  { id: 'rival', n: '第三章·宿敌龙傲天', d: '青云宗来了个自称“天命主角”的少年，他要在宗门小比上挑战你。去青云宗找龙傲天。', map: 'sect', realm: 1 },
  { id: 'market', n: '第四章·坊市查账', d: '去云来坊市找钱多多，问问欠条是哪来的。', map: 'market', realm: 1 },
  { id: 'secret', n: '第五章·秘境追债', d: '筑基后前往万妖秘境，找狐妖阿离打听天道的打手。', map: 'secret', realm: 2 },
  { id: 'traitor', n: '第六章·黑心长老', d: '有人把宗门弟子的欠款名单卖给了讨债司。回青云宗查查黑心长老。', map: 'sect', realm: 2 },
  { id: 'corpse', n: '第七章·尸王赖账', d: '乱葬岗的尸王据说也欠天道一辈子，击败它拿账本。', map: 'graveyard', realm: 2, boss: 'corpse' },
  { id: 'insure', n: '第八章·天道保险', d: '金丹后，坊市来了个卖“天道保险”的保真人，他好像知道龙王钱庄的秘密。', map: 'market', realm: 3 },
  { id: 'dragon', n: '第九章·离岸钱庄', d: '去东海，龙王在替天道洗灵石。', map: 'island', realm: 3, boss: 'dragon' },
  { id: 'lengyue', n: '第十章·冷月之约', d: '元婴后，东海仙岛的冷月仙子托人带话：她曾是讨债司的收账仙子。', map: 'island', realm: 4 },
  { id: 'mozun', n: '第十一章·魔尊也欠钱', d: '去魔道裂谷，魔尊手里有天道的把柄。', map: 'rift', realm: 4, boss: 'mozun' },
  { id: 'judge', n: '第十二章·判官钱不够', d: '化神后登天外天，讨债司判官“钱不够”挡在讨债司门口。', map: 'heaven', realm: 5 },
  { id: 'tiandao', n: '终章·讨尾款的天道', d: '与天道当面对账！', map: 'heaven', realm: 5, boss: 'tiandao' },
  { id: 'done', n: '完结', d: '天道的账已经算清。剩下的人生，随你。', map: null, realm: 0 },
);
const MI = id => MAIN.findIndex(m => m.id === id);
// ---- 人物任务链（pre：前置任务；minRealm：境界要求） ----
Object.assign(QUESTS, {
  q_at1: { n: '傲天的战书', giver: 'aotian', d: '龙傲天：“想当我的对手？先去打倒8只石头精证明你配！”', need: { k: { rock: 8 } }, rw: { exp: 600, aff: { aotian: 20 }, item: { pyd: 1 } }, minRealm: 1 },
  q_at2: { n: '傲天的面子', giver: 'aotian', d: '龙傲天被讨债鬼追债了（他假装没有）。帮他打跑6个讨债鬼，别声张。', need: { k: { collector: 6 } }, rw: { exp: 2000, aff: { aotian: 25 }, stone: 500 }, pre: 'q_at1', minRealm: 2 },
  q_at3: { n: '傲天的秘密', giver: 'aotian', d: '龙傲天：“其实……我也欠天道钱。帮我找3个妖丹，我要做个‘逆天改命’的护身符。”', need: { i: { yd: 3 } }, rw: { exp: 6000, aff: { aotian: 30 }, item: { pjd: 1 } }, pre: 'q_at2', minRealm: 3 },
  q_ry1: { n: '如烟的酒', giver: 'ruyan', d: '柳如烟想喝桃花村的桃花酿，带3坛来。', need: { i: { wine: 3 } }, rw: { exp: 500, aff: { ruyan: 25 }, item: { tsf: 1 } }, minRealm: 1 },
  q_ry2: { n: '如烟的仇家', giver: 'ruyan', d: '当年追杀如烟的狐妖又出现了。击败6只狐妖。', need: { k: { fox: 6 } }, rw: { exp: 1800, aff: { ruyan: 25 }, eq: 2 }, pre: 'q_ry1', minRealm: 2 },
  q_ry3: { n: '如烟的剑', giver: 'ruyan', d: '如烟的剑断了，需要5块玄铁晶重铸。', need: { i: { ore: 5 } }, rw: { exp: 5000, aff: { ruyan: 30 }, eq: 3 }, pre: 'q_ry2', minRealm: 3 },
  q_bl1: { n: '书生的诗稿', giver: 'bailang', d: '白玉郎的诗稿被纸符小鬼叼走了，击败5只纸符小鬼。', need: { k: { paper: 5 } }, rw: { exp: 400, aff: { bailang: 25 }, stone: 150 }, minRealm: 1 },
  q_bl2: { n: '书生的扇子', giver: 'bailang', d: '白玉郎想送你一把题字折扇，但他没钱买扇子。带一把折扇给他题字。', need: { i: { fan: 1 } }, rw: { exp: 900, aff: { bailang: 30 }, item: { fan: 2 } }, pre: 'q_bl1', minRealm: 1 },
  q_bl3: { n: '书生的功名', giver: 'bailang', d: '白玉郎想参加“仙科”考试，需要2本残破功法当复习资料。', need: { i: { scroll: 2 } }, rw: { exp: 3000, aff: { bailang: 30 }, item: { xsd: 1 } }, pre: 'q_bl2', minRealm: 2 },
  q_bx1: { n: '保单推销', giver: 'baoxian', d: '保真人：“帮我把保险卖给4个讨债鬼——它们最需要意外险。”（击败讨债鬼×4）', need: { k: { collector: 4 } }, rw: { exp: 1500, stone: 800, item: { tsf: 1 } }, minRealm: 2 },
  q_bx2: { n: '理赔调查', giver: 'baoxian', d: '有人骗保！去乱葬岗调查，击败8只游魂。', need: { k: { ghost: 8 } }, rw: { exp: 4000, stone: 1500, item: { tsf: 2 } }, pre: 'q_bx1', minRealm: 3 },
  q_ly1: { n: '月下寒梅', giver: 'lengyue', d: '冷月仙子想要3株千年灵芝炼制“清心丹”。', need: { i: { lz: 3 } }, rw: { exp: 8000, aff: { lengyue: 25 } }, minRealm: 3 },
  q_ly2: { n: '旧同事', giver: 'lengyue', d: '讨债司的旧同事来找冷月麻烦了。击败8只讨债鬼。', need: { k: { collector: 8 } }, rw: { exp: 15000, aff: { lengyue: 30 }, item: { pjd: 1 } }, pre: 'q_ly1', minRealm: 4 },
  q_mp1: { n: '孟婆的汤料', giver: 'mengpo', d: '孟婆的汤缺料了：3条灵鱼和3株灵草。', need: { i: { fish: 3, herb: 3 } }, rw: { exp: 2500, item: { ysd: 1 } }, minRealm: 2 },
  q_mp2: { n: '不肯喝汤的', giver: 'mengpo', d: '一群僵尸不肯喝汤排队插队。击败10只僵尸维持秩序。', need: { k: { jiangshi: 10 } }, rw: { exp: 6000, item: { ysd: 2 } }, pre: 'q_mp1', minRealm: 3 },
  q_yl1: { n: '红线告急', giver: 'yuelao', d: '月老的红线被小魔头偷了，击败6只小魔头抢回来。', need: { k: { demon: 6 } }, rw: { exp: 9000, item: { jadeg: 2, wine: 2 } }, minRealm: 4 },
  q_jg1: { n: '讨债司的漏洞', giver: 'judge', d: '判官：“你要对账？先把这3页账本残页交上来。”', need: { i: { ledger: 3 } }, rw: { exp: 30000, stone: 5000 }, minRealm: 5 },
  q_lr1: { n: '路人甲的名字', giver: 'luren', d: '路人甲想要一个名字。据说说书先生会起名——先去乱葬岗看看找灵感。', need: { f: 'visit_graveyard' }, rw: { exp: 300, stone: 100, item: { coin: 2 } } },
  q_lr2: { n: '路人甲的高光', giver: 'luren', d: '路人甲想当一回主角：帮他击败10只讨债史莱姆，他站在旁边喊加油。', need: { k: { slime: 10 } }, rw: { exp: 300, stone: 300, item: { egg: 1 } }, pre: 'q_lr1' },
  q_hx1: { n: '长老的“委托”', giver: 'heixin', d: '黑心长老让你去秘境采5株千年灵芝，说是“宗门公用”。', need: { i: { lz: 5 } }, rw: { exp: 1500, stone: 300, contrib: 30 }, minRealm: 2 },
  q_st1: { n: '新书素材', giver: 'villager', d: '说书先生要写《我不仙传》，需要你击败尸王的“现场素材”。', need: { f: 'boss_corpse' }, rw: { exp: 3000, stone: 800, item: { scroll: 2 } }, pre: 'q_story' },
  q_st2: { n: '大结局素材', giver: 'villager', d: '说书先生：“龙王那段太精彩了！再来一段！”（击败东海龙王）', need: { f: 'boss_dragon' }, rw: { exp: 12000, stone: 3000 }, pre: 'q_st1' },
  q_xe1: { n: '茶馆的回头客', giver: 'shuoshu', d: '茶馆小二想要5条灵鱼做“全鱼宴”招揽生意。', need: { i: { fish: 5 } }, rw: { exp: 800, stone: 500, item: { wine: 3 } } },
  q_dz1: { n: '杜掌柜的账', giver: 'yaopu', d: '药铺杜掌柜被赖账了：去教训5只狐妖（它们赊了药不给钱）。', need: { k: { fox: 5 } }, rw: { exp: 900, item: { lz: 2, hcd: 3 } }, minRealm: 1 },
  q_mm2: { n: '娘的生日', giver: 'mom', d: '娘过生日，带一个蟠桃和一坛桃花酿回家。', need: { i: { peach: 1, wine: 1 } }, rw: { exp: 500, life: 2, item: { hcd: 3 } }, pre: 'q_soup', minAge: 16 },
  q_cr2: { n: '翠花的嫁妆', giver: 'cuihua', d: '翠花想开个绣坊，需要800灵石的本钱（交付3枚古钱代替）。', need: { i: { coin: 3 } }, rw: { exp: 600, aff: { cuihua: 30 } }, pre: 'q_hairpin' },
  q_ax2: { n: '龙女离家出走', giver: 'aoxiao', d: '敖小乐不想回龙宫：帮她打退8个来抓她的铁钳蟹将。', need: { k: { crab: 8 } }, rw: { exp: 9000, aff: { aoxiao: 30 }, item: { egg: 1 } }, pre: 'q_coral' },
  q_sm2: { n: '魔女的生意', giver: 'sumei', d: '苏魅开了家“魔道快递”，需要10只火灵当“暖宝宝”。', need: { k: { fire: 10 } }, rw: { exp: 12000, aff: { sumei: 30 }, eq: 3 }, pre: 'q_witch' },
});
// ---- 新结局 ----
Object.assign(ENDINGS, {
  rival: ['宿敌成挚友', '你与龙傲天并肩打上天外天，最后一起开了家“傲天不仙宗”。宗训第一条：主角轮流当。'],
  judge: ['新任判官', '你接过了判官的笔，把所有欠款利率改成了0.0001%。讨债司从此门可罗雀。'],
  storyteller: ['说书人', '你没能修仙，却把修仙的故事讲了一辈子。桃花村的孩子们说，你讲的天道比真的还可怕。'],
  fisher: ['钓鱼成仙', '你在东海钓了一辈子鱼，某天钓上来一朵云。云说：“我是天道，放了我，尾款免了。”'],
  insured: ['理赔到账', '你去世后，天道保险居然真的赔付了。保真人在你坟前哭着说：“这是我卖出的第一单理赔……”'],
  mengpo: ['孟婆汤铺', '你接手了孟婆的汤铺，研发出“珍珠奶汤”。从此投胎排队的鬼魂们都不想走了。'],
  teahouse: ['茶馆老板', '你买下了云来坊市的茶馆，每天听人讲你的传说。你说：“这人我熟。”'],
});
Object.assign(ACHS, {
  rival_win: ['主角光环', '在宗门小比中击败龙傲天'], rival_friend: ['宿敌也是朋友', '与龙傲天好感度达到100'],
  traitor: ['清理门户', '揭穿黑心长老'], insured: ['保险达人', '购买天道保险'], judge_win: ['拿捏判官', '击败判官钱不够'],
  lengyue: ['月下之约', '完成冷月仙子的主线'], mengpo_soup: ['汤到病除', '在孟婆处喝了一碗汤'], luren: ['路人也有春天', '完成路人甲的全部委托'],
  ninxt: ['逆天改命', '获得第一个逆天改命词条'], mount: ['御风而行', '获得第一个坐骑'], title5: ['名号响亮', '获得5个称号'], cave3: ['洞天福地', '洞府聚灵阵升到3级'],
  events200: ['见多识广', '经历200个人生事件'], endings6: ['六道轮回', '解锁6种结局'],
});

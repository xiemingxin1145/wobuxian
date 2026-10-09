'use strict';
// ======================= v2.2 新内容：东海龙宫 / 鬼市 / 天庭催债司，12 位新角色，4 个新章节，3 个新 BOSS =======================
// 在 story21b.js 之后加载（需要 Talk / Game / MI）。
// ---- 新技能（BOSS 专属机制见下方 hitTargets 包装） ----
Object.assign(SKILLS, {
  longyin: { n: '龙吟沧海', mp: 24, tg: 'all', k: 1.15, el: '水', fx: 'water', ic: 'sk_ice', d: '水系群体伤害，减速', slow: 1 },
  yinqian: { n: '阴钱交易', mp: 16, tg: 'one', k: 1.3, el: '冰', fx: 'coin', ic: 'coin', d: '抢走对手的灵石并回复自身', rob: 1 },
  qianmian: { n: '千面换魂', mp: 26, tg: 'all', k: 1.0, el: '冰', fx: 'iceall', ic: 'sk_ice', d: '群体冰伤，25%眩晕', stun: 0.25 },
  gouhun: { n: '勾魂索', mp: 18, tg: 'one', k: 1.5, el: '冰', fx: 'dark', ic: 'sk_dark', d: '吸取50%伤害为气血', drain: 0.5 },
  cuiming: { n: '催命符', mp: 14, tg: 'one', k: 1.0, el: '雷', fx: 'thunder', ic: 'tal_r', d: '每次使用伤害递增（利滚利）', compound: 0.45 },
  shengsi: { n: '生死簿·勾销', mp: 30, tg: 'all', k: 1.1, el: '雷', fx: 'thunderall', ic: 'sk_thunder', d: '群体雷伤并附加中毒', dot: 1 },
  lgl: { n: '利滚利', mp: 28, tg: 'all', k: 0.85, el: '金', fx: 'light', ic: 'coin', d: '群体伤害，每次使用倍率+0.4', compound: 0.4 },
  audit: { n: '天道审计', mp: 20, tg: 'one', k: 1.3, el: '雷', fx: 'deny', ic: 'bill', d: '清空目标增益并回复自身8%气血', audit: 1, selfheal: 0.08 },
  bankrupt: { n: '强制破产', mp: 34, tg: 'one', k: 2.2, el: '金', fx: 'blood', ic: 'sk_dark', d: '超高伤害，并没收3%灵石', rob: 1 },
});
// ---- 新怪物 / 可战斗人物 / 新 BOSS ----
Object.assign(MONS, {
  xiabing: { n: '虾兵', spr: 'npc_xiabing', el: '水', hp: 1.2, atk: 1.15, def: 1.2, spd: 1.0, sk: ['atk', 'water'], pet: 1, drop: ['fish', 'yd'] },
  guizu: { n: '鬼卒', spr: 'npc_guizu', el: '冰', hp: 1.1, atk: 1.25, def: 0.9, spd: 1.25, sk: ['atk', 'icecone', 'gouhun'], pet: 1, drop: ['scroll', 'coin'] },
  tianbing: { n: '天兵', spr: 'npc_tianbing', el: '金', hp: 1.4, atk: 1.25, def: 1.3, spd: 1.1, sk: ['atk', 'swordqi', 'rockarmor'], pet: 1, drop: ['ore', 'pyd'] },
  zhuiming: { n: '主簿·追命', spr: 'npc_zhuiming', el: '雷', hp: 2.6, atk: 1.4, def: 1.1, spd: 1.3, sk: ['atk', 'cuiming', 'thunder'], drop: ['ledger', 'pjd'] },
  leigong: { n: '雷公', spr: 'npc_leigong', el: '雷', hp: 3.0, atk: 1.5, def: 1.2, spd: 1.2, sk: ['atk', 'thunder', 'thunderall'], drop: ['pjd'] },
  taizi: { n: '龙宫太子·敖小白', spr: 'npc_taizi', el: '水', hp: 3.2, atk: 1.35, def: 1.2, spd: 1.3, sk: ['atk', 'water', 'longyin'], drop: ['pjd', 'peach'] },
  guiwang: { n: '鬼王·千面', spr: 'boss_guiwang', el: '冰', hp: 8, atk: 1.6, def: 1.25, spd: 1.2, sk: ['atk', 'yinqian', 'qianmian', 'gouhun'], boss: 1, drop: ['pjd', 'xsd', 'egg'] },
  dasiming: { n: '催债司·大司命', spr: 'boss_dasiming', el: '雷', hp: 8.5, atk: 1.65, def: 1.35, spd: 1.15, sk: ['atk', 'cuiming', 'shengsi', 'deny'], boss: 1, drop: ['pjd', 'xsd', 'ledger'] },
  tiandao2: { n: '天道真身·总账房', spr: 'boss_tiandao2', el: '金', hp: 10.5, atk: 1.75, def: 1.45, spd: 1.15, sk: ['atk', 'lgl', 'audit', 'bankrupt', 'deny'], boss: 1, phase2: 1, drop: [] },
});
Object.assign(PET_SKILL, { xiabing: ['atk', 'water', 'rockarmor'], guizu: ['atk', 'icecone', 'gouhun'], tianbing: ['atk', 'swordqi', 'rockarmor'] });
// ---- BOSS 专属机制：利滚利（倍率递增）、审计（清增益）、抢灵石、二阶段 ----
(function () {
  const _hit = hitTargets;
  hitTargets = function (u, S, targets) {
    let S2 = S;
    if (S.compound) { u._cmp = (u._cmp || 0) + 1; S2 = Object.assign({}, S, { k: S.k + S.compound * (u._cmp - 1) }); if (u._cmp > 1) { const [x, y] = uPos(u); floatText(x, y - 205 * R.dpr, `利息×${u._cmp}`, '#ffcf3a', 26 * R.dpr, false); } }
    if (S.audit) for (const t of targets) if (t.alive && t.buf) { let n = 0; for (const b of ['def', 'reflect']) if (t.buf[b] > 0) { t.buf[b] = 0; n++; } const [x, y] = uPos(t); floatText(x, y - 200 * R.dpr, n ? '审计：增益清零！' : '审计：账目清白', '#c8a0ff', 24 * R.dpr, false); }
    _hit(u, S2, targets);
    const G = Game.G;
    if (S.rob && u.side && G) { const g = Math.min(G.stone, Math.round(G.stone * 0.03) + 20); G.stone -= g; u.hp = Math.min(u.mhp, u.hp + Math.round(u.mhp * 0.05)); const [x, y] = uPos(u); if (g > 0) floatText(x, y - 200 * R.dpr, `没收 ${g} 灵石`, '#ffd23a', 24 * R.dpr, false); }
    if (S.selfheal && u.alive) u.hp = Math.min(u.mhp, u.hp + Math.round(u.mhp * S.selfheal));
    for (const t of B.units) if (t.alive && t.mon && MONS[t.mon] && MONS[t.mon].phase2 && !t._p2 && t.hp < t.mhp * 0.5) {
      t._p2 = 1; if (AS.sprites[t.spr + '_p2']) { t.spr = t.spr + '_p2'; loadSprite(t.spr); } t.hp = Math.min(t.mhp, t.hp + Math.round(t.mhp * 0.18)); t.atk *= 1.25; t.spd *= 1.1; R.shake = 1; Sfx.play('thunder');
      const [x, y] = uPos(t); floatText(x, y - 230 * R.dpr, '天道：本金翻倍！', '#ff6a3a', 36 * R.dpr, false); floatText(x, y - 190 * R.dpr, '（攻击+25%，回复18%气血）', '#ffd0a0', 22 * R.dpr, false);
    }
  };
})();
// ---- 新地图 ----
Object.assign(MAPINFO, {
  longgong: { n: '东海龙宫', tier: 4.0, need: 4, mons: ['xiabing', 'crab', 'slime'], cnt: 6, bgm: 'island', sky: ['#2a8ad8', '#c8f4ff'], amb: 'bubble', start: [10, 18], d: '龙王倒台后，太子敖小白接手了龙宫——连同一屁股债。' },
  guishi: { n: '鬼市', tier: 4.6, need: 4, mons: ['guizu', 'ghost', 'jiangshi'], cnt: 6, bgm: 'graveyard', sky: ['#1a1030', '#6a3a7a'], amb: 'ghostfire', start: [10, 18], boss: 'guiwang', d: '子时开市，鸡鸣散场。这里什么都能买卖，包括寿命和欠条。' },
  cuizhai: { n: '天庭催债司', tier: 5.7, need: 5, mons: ['tianbing', 'collector', 'paper'], cnt: 6, bgm: 'heaven', sky: ['#ffd890', '#fffaf0'], amb: 'sparkle', start: [10, 18], boss: 'dasiming', d: '天道讨债司的总部机关。门口的对联：上联“欠债还钱”，下联“利滚利甜”。' },
});
MAP_ORDER.splice(MAP_ORDER.indexOf('rift') + 1, 0, 'longgong', 'guishi');
MAP_ORDER.push('cuizhai');
// ---- 新角色（12 位，全部 Blender 建模 + 立绘） ----
Object.assign(NPCS, {
  taizi: { n: '龙宫太子·敖小白', spr: 'npc_taizi', map: 'longgong', at: [10, 8], por: 'npc_taizi', minRealm: 4, comp: 1, sex: 'm' },
  xiabing: { n: '虾兵队长·阿虾', spr: 'npc_xiabing', map: 'longgong', at: [6, 12], por: 'npc_xiabing' },
  sanniang: { n: '鬼市掌柜·阴三娘', spr: 'npc_sanniang', map: 'guishi', at: [7, 8], por: 'npc_sanniang', comp: 1, sex: 'f' },
  guizu: { n: '鬼卒·小六', spr: 'npc_guizu', map: 'guishi', at: [13, 11], por: 'npc_guizu' },
  baiwuchang: { n: '白无常', spr: 'npc_baiwuchang', map: 'guishi', at: [10, 14], por: 'npc_baiwuchang' },
  xiaoyao: { n: '逍遥散人', spr: 'npc_xiaoyao', map: 'market', at: [15, 10], por: 'npc_xiaoyao', minRealm: 1,
    roam: G => G.realm >= 4 ? 'guishi' : G.realm >= 2 ? 'secret' : 'market' },
  caishen: { n: '财神', spr: 'npc_caishen', map: 'market', at: [9, 9], por: 'npc_caishen', minRealm: 2,
    roam: G => G.realm >= 5 ? 'cuizhai' : 'market' },
  zhuiming: { n: '催债司主簿·追命', spr: 'npc_zhuiming', map: 'cuizhai', at: [12, 9], por: 'npc_zhuiming' },
  suanpan: { n: '天道会计·算无遗', spr: 'npc_suanpan', map: 'cuizhai', at: [7, 9], por: 'npc_suanpan' },
  tianbing: { n: '天兵甲', spr: 'npc_tianbing', map: 'cuizhai', at: [9, 15], por: 'npc_tianbing' },
  leigong: { n: '雷公', spr: 'npc_leigong', map: 'cuizhai', at: [14, 13], por: 'npc_leigong' },
  guanghan: { n: '广寒仙子', spr: 'npc_guanghan', map: 'cuizhai', at: [5, 13], por: 'npc_guanghan', comp: 1, sex: 'f' },
});
Object.assign(CHAT, {
  taizi: ['“父王倒台以后，我才知道龙宫欠了三界四十七家钱庄。”', '“本太子很穷，但本太子很体面。”', '“你说我是不是该把龙宫改成民宿？”', '“我小时候的梦想是当个普通的鲤鱼。”'],
  xiabing: ['“报告！龙宫三个月没发饷了！”', '“我们虾兵不怕死，怕加班。”', '“队长说，下辈子要投胎当龙虾——贵。”'],
  sanniang: ['“客官，买点什么？寿命、记忆、前世的欠条，样样都有。”', '“鬼市的规矩：一手交钱，一手交魂。”', '“三娘我啊，生前是做账的，死后还是做账的。”', '“你的命挺值钱的，卖吗？开玩笑的。”'],
  guizu: ['“我是临时工，出了事别找我。”', '“鬼王说今年绩效不达标的都要去投胎。”', '“你身上阳气好重，离我远点，我怕热。”'],
  baiwuchang: ['“一见生财。”（他帽子上就这么写的）', '“黑无常请假了，今天我一个人上班。”', '“你阳寿还长，别急。不过阳寿和欠款是两回事。”'],
  xiaoyao: ['“逍遥逍遥，无债一身轻——我是说，我从来不借钱。”', '“人生得意须尽欢，莫使金樽空对月。来，满上。”', '“我活了八百岁，秘诀是从不签合同。”', '“天道？哦，那个老会计。”'],
  caishen: ['“恭喜发财！红包拿来——哦不，是我给你。”', '“财神也有KPI，今年要让三界GDP增长百分之八。”', '“天道欠我的钱比欠你的还多。”'],
  zhuiming: ['“追命追命，追的就是你这条命——开个玩笑，追的是钱。”', '“我的催收成功率是百分之九十九。剩下那个是你。”', '“大司命大人在开会，请排号。”'],
  suanpan: ['“算无遗，算无遗策的算，遗漏的遗。”', '“三界所有的账我都记着，一文都不会错——除了天道自己的。”', '“我发现了一个秘密，但我不能说。说了要扣工资。”'],
  tianbing: ['“站岗中，请勿打扰。”', '“天兵甲，没有名字，编号是甲。”', '“我的梦想是当天兵乙，听说乙的福利好一点。”'],
  leigong: ['“谁？谁欠债不还？我劈他！”', '“最近劈错了好几个人，都是重名惹的祸。”', '“打雷要带伞，不然就是你在渡劫。”'],
  guanghan: ['“月宫太冷，来天庭上班至少有暖气。”', '“玉兔说它想下凡，我说你先把捣药的债还了。”', '“桂花酒要么？天庭员工价。”'],
});
// ---- 新主线：4 个新章节（元婴→化神→渡劫的深层篇章，天道讨债的真正高潮） ----
(function () {
  const ins = (afterId, ch) => MAIN.splice(MI(afterId) + 1, 0, ch);
  ins('lengyue', { id: 'longgong', n: '第十一章·龙宫太子', d: '冷月说：龙王倒台后，账本里有一页被藏进了东海龙宫。去龙宫找太子敖小白。', map: 'longgong', realm: 4 });
  ins('mozun', { id: 'guishi', n: '第十三章·鬼市当铺', d: '魔尊的玉简提到：天道把伪造的账目抵押在了鬼市。去鬼市找阴三娘，击败鬼王·千面。', map: 'guishi', realm: 4, boss: 'guiwang' });
  ins('judge', { id: 'cuizhai', n: '第十五章·天庭催债司', d: '判官倒下前说：真正的催收令出自天庭催债司。去催债司，击败大司命。', map: 'cuizhai', realm: 5, boss: 'dasiming' });
  ins('tiandao', { id: 'zhenshen', n: '终章·天道真身', d: '天外天的“天道”只是个客服分身！真身是催债司地下的总账房。去催债司做最后的了断！', map: 'cuizhai', realm: 5, boss: 'tiandao2' });
  // 章节名重新编号
  MAIN[MI('tiandao')].n = '第十章·讨尾款的天道';
  const NUM = '零一二三四五六七八九十';
  const cn = n => n <= 10 ? NUM[n] : n < 20 ? '十' + NUM[n - 10] : NUM[n / 10 | 0] + '十' + (n % 10 ? NUM[n % 10] : '');
  MAIN.forEach((m, i) => { if (/^第.+章·/.test(m.n)) m.n = m.n.replace(/^第.+?章/, '第' + cn(i) + '章'); });
})();
// 旧存档章节迁移（v2.1 存的是下标）
(function () {
  const OLD = ['debt', 'mentor', 'sect', 'rival', 'market', 'secret', 'traitor', 'corpse', 'insure', 'dragon', 'lengyue', 'mozun', 'judge', 'tiandao', 'done'];
  const _save = Game.save, _has = Game.hasSave;
  Game.save = function () { if (this.G && MAIN[this.G.main]) this.G.mainId = MAIN[this.G.main].id; return _save.apply(this, arguments); };
  Game.hasSave = function () { const s = _has.apply(this, arguments); if (s && typeof s.main === 'number') { const id = s.mainId || OLD[s.main]; const i = MI(id); if (i >= 0) s.main = i; } return s; };
})();
// ---- 任务（17 个新委托） ----
Object.assign(QUESTS, {
  q_tz1: { n: '虾兵罢工', giver: 'taizi', d: '敖小白：“虾兵们三个月没发饷，罢工了！帮我‘劝劝’8个虾兵回去上班。”', need: { k: { xiabing: 8 } }, rw: { exp: 16000, aff: { taizi: 25 }, item: { pjd: 1 } }, minRealm: 4 },
  q_tz2: { n: '给父王的礼物', giver: 'taizi', d: '敖小白想去牢里看父王，带3条灵鱼和2个蟠桃。', need: { i: { fish: 3, peach: 2 } }, rw: { exp: 22000, aff: { taizi: 30 }, item: { xyf: 1 } }, pre: 'q_tz1', minRealm: 4 },
  q_xb1: { n: '虾兵的饷银', giver: 'xiabing', d: '阿虾：“兄弟们要的不多，3枚古钱就能撑一个月。”', need: { i: { coin: 3 } }, rw: { exp: 9000, stone: 1500, item: { fish: 3 } }, minRealm: 4 },
  q_sn1: { n: '收购古钱', giver: 'sanniang', d: '阴三娘：“我收古钱，越古越好。带4枚来，给你个好价。”', need: { i: { coin: 4 } }, rw: { exp: 14000, stone: 3000, aff: { sanniang: 20 } }, minRealm: 4 },
  q_sn2: { n: '鬼卒闹事', giver: 'sanniang', d: '一群鬼卒在三娘店里吃霸王餐。击败10个鬼卒。', need: { k: { guizu: 10 } }, rw: { exp: 26000, aff: { sanniang: 30 }, item: { ysd: 2 } }, pre: 'q_sn1', minRealm: 4 },
  q_gz1: { n: '小六的业绩', giver: 'guizu', d: '鬼卒小六这个月业绩不够，帮他“抓”8只僵尸回去交差。', need: { k: { jiangshi: 8 } }, rw: { exp: 15000, item: { scroll: 2, coin: 2 } }, minRealm: 4 },
  q_bw1: { n: '白无常的帽子', giver: 'baiwuchang', d: '白无常的高帽子被风吹到鬼市各处，帮他打退8只游魂找回来。', need: { k: { ghost: 8 } }, rw: { exp: 16000, life: 5, item: { ysd: 1 } }, minRealm: 4 },
  q_bw2: { n: '一见生财', giver: 'baiwuchang', d: '白无常想换个帽子标语，需要一把折扇题字。', need: { i: { fan: 1 } }, rw: { exp: 20000, life: 8 }, pre: 'q_bw1', minRealm: 4 },
  q_xy1: { n: '散人的酒', giver: 'xiaoyao', d: '逍遥散人：“酒没了。5坛桃花酿，换我一个秘密。”', need: { i: { wine: 5 } }, rw: { exp: 2500, stone: 600, item: { scroll: 1 } }, minRealm: 1 },
  q_xy2: { n: '散人的秘密', giver: 'xiaoyao', d: '逍遥散人：“去鬼市看看，那里有天道的另一本账。”（抵达鬼市）', need: { f: 'visit_guishi' }, rw: { exp: 18000, item: { xsd: 1 } }, pre: 'q_xy1', minRealm: 4 },
  q_cs1: { n: '财神的红包', giver: 'caishen', d: '财神的红包被讨债鬼抢了。击败8个讨债鬼。', need: { k: { collector: 8 } }, rw: { exp: 3000, stone: 2000 }, minRealm: 2 },
  q_cs2: { n: '财神的投资', giver: 'caishen', d: '财神投资了鬼市，结果被鬼王坑了。击败鬼王·千面。', need: { f: 'boss_guiwang' }, rw: { exp: 30000, stone: 12000, item: { xyf: 1 } }, pre: 'q_cs1', minRealm: 4 },
  q_zm1: { n: '冒牌讨债鬼', giver: 'zhuiming', d: '追命：“有讨债鬼冒充我们催债司在外面乱收钱！清理掉10个。”', need: { k: { collector: 10 } }, rw: { exp: 40000, stone: 5000, aff: { zhuiming: 20 } }, minRealm: 5 },
  q_sp1: { n: '对不上的账', giver: 'suanpan', d: '算无遗：“我发现总账有窟窿……帮我找2页账本残页对一对。”', need: { i: { ledger: 2 } }, rw: { exp: 45000, item: { pjd: 2 } }, minRealm: 5 },
  q_tb1: { n: '替岗', giver: 'tianbing', d: '天兵甲想去看蟠桃会，请你替他巡逻：击败8只纸符小鬼。', need: { k: { paper: 8 } }, rw: { exp: 35000, item: { ore: 3, pyd: 2 } }, minRealm: 5 },
  q_lg1: { n: '劈错人了', giver: 'leigong', d: '雷公劈错了一群天兵，他们正在找他算账。帮他挡住8个天兵。', need: { k: { tianbing: 8 } }, rw: { exp: 50000, eq: 4 }, minRealm: 5 },
  q_gh1: { n: '月宫桂花酒', giver: 'guanghan', d: '广寒仙子想酿桂花酒，需要3个蟠桃和3株千年灵芝。', need: { i: { peach: 3, lz: 3 } }, rw: { exp: 48000, aff: { guanghan: 30 }, life: 10 }, minRealm: 5 },
});
Object.assign(ENDINGS, {
  longgong: ['龙宫合伙人', '你和敖小白把龙宫改成了“东海龙宫度假村”。生意火爆，三年就还清了龙族的全部债务。'],
  guishi: ['鬼市大掌柜', '你接下了阴三娘的当铺，成了鬼市最公道的掌柜。鬼魂们说：在这里，连欠条都是明码标价的。'],
  auditor: ['天庭审计', '你成了天庭第一位审计官。上任第一天，你就查出天道的账有九成是假的。'],
});
Object.assign(ACHS, {
  longgong: ['龙宫贵客', '完成龙宫太子章节'], guiwang_win: ['鬼市不鬼', '击败鬼王·千面'], dasiming_win: ['催收克星', '击败催债司·大司命'],
  zhenshen_win: ['天道认账', '击败天道真身·总账房'], allmaps11: ['三界行者', '去过全部11张地图'],
});
// ---- 新章节对话与 BOSS ----
(function () {
  const say = (id, text, opts) => UI.say(NPCS[id].por, NPCS[id].n, text, opts);
  const adv = (text, por) => UI.card('主线推进', text, por || 'i:scroll', ['继续']);
  // 旧章节结束后重定向到插入的新章节
  const REDIR = { 'lengyue>mozun': 'longgong', 'mozun>judge': 'guishi', 'judge>tiandao': 'cuizhai' };
  const REDIR_TXT = {
    longgong: ['冷月仙子临走前补充了一句：“对了，总账有一页被龙王藏在东海龙宫。他儿子敖小白现在当家——先去龙宫，再去魔道裂谷。”\n\n下一步：前往东海龙宫，找太子敖小白。', 'npc_taizi'],
    guishi: ['玉简背面还有一行小字：“伪造的账目抵押在鬼市当铺，抵押人：天道。”\n\n下一步：前往鬼市，击败鬼王·千面，赎回假账。', 'npc_sanniang'],
    cuizhai: ['判官补充：“讨债司只是窗口，真正签发催收令的是天庭催债司。大司命不倒，天道的账就永远算不清。”\n\n下一步：前往天庭催债司，击败大司命。', 'npc_zhuiming'],
  };
  const wrapFn = fn => async function () {
    const G = Game.G; const before = MAIN[G.main] && MAIN[G.main].id; const r = await fn.apply(this, arguments);
    const after = MAIN[G.main] && MAIN[G.main].id; const to = REDIR[before + '>' + after];
    if (to) { G.main = MI(to); const t = REDIR_TXT[to]; await adv(t[0], t[1]); Game.checkMain && Game.checkMain(); Game.refreshNpcs(); Game.save(); }
    return r;
  };
  const _mt = Talk.mainTalk;
  Talk.mainTalk = function (id, check) {
    const G = Game.G; const M = G.main;
    if (M === MI('longgong') && id === 'taizi') { if (G.realm < 4) return check ? null : ['拜见太子', () => say('taizi', '“元婴以下，龙宫不接待。不是我势利，是水压太大。”', ['……']), 'gate']; return ['★ 龙宫太子的请求', async () => {
      await say('taizi', '“你就是打倒我父王的人？……谢谢你。真的。他放了三千年高利贷，我每天上学都被人指着骂。”', ['那账本呢？']);
      await say('taizi', '“账本在龙宫金库，但虾兵们把金库围了——他们说不发饷就不让开。还有，我得确认你配得上这页账本。”', ['来吧']);
      const r = await Game.fight('taizi', { tier: 4.5, solo: true, adds: ['xiabing', 'xiabing'], noflee: true });
      if (r.res !== 'win') { await say('taizi', '“再练练吧。龙宫的门一直为你开着。”', ['可恶']); return; }
      G.main = MI('mozun'); G.aff.taizi = (G.aff.taizi || 0) + 25; Game.ach('longgong'); Game.give('ledger', 1); Game.give('pjd', 1); G.debt = Math.round(G.debt * 0.85); Game.log('与龙宫太子敖小白结为好友。');
      await say('taizi', '“好功夫！这页账本给你——上面写着天道用龙宫的名义借了魔尊一笔钱，一直没还。”\n（你的欠款减少了15%：太子把龙宫替你担保的部分划掉了）', ['多谢太子']);
      await adv('天道居然也欠魔尊的钱？\n\n下一步：前往魔道裂谷，找魔尊·赊刀人。', 'npc_taizi');
    }]; }
    if (M === MI('guishi') && id === 'sanniang' && !G.flags.sanniang_hint) return ['★ 打听假账抵押', async () => {
      await say('sanniang', '“天道的抵押品？有的有的，一箱假账，抵押了三百年。赎回要九千九百九十九万灵石——或者，打赢鬼王。”', ['鬼王在哪？']);
      await say('sanniang', '“鬼市北边的戏台，鬼王·千面每晚都在那唱戏。小心，他有一千张脸，每张脸都欠我钱。”', ['我去会会他']);
      G.flags.sanniang_hint = 1; G.aff.sanniang = (G.aff.sanniang || 0) + 10; Game.refreshNpcs();
    }];
    if (M === MI('cuizhai') && id === 'suanpan' && !G.flags.suanpan_hint) return ['★ 会计的秘密', async () => {
      await say('suanpan', '“嘘——我算过了，天道收的利息，三成进了大司命的小金库。”', ['证据呢？']);
      await say('suanpan', '“证据在大司命的生死簿里。打败他，生死簿上的‘勾销’二字就能用了。”', ['明白了']);
      G.flags.suanpan_hint = 1; Game.give('pyd', 2); Game.refreshNpcs();
    }];
    if (M === MI('zhenshen') && id === 'suanpan' && !G.flags.suanpan_ally) return ['★ 总账房在哪', async () => {
      await say('suanpan', '“天道真身就在催债司正殿的地下，那里有一把算盘，算着三界所有人的债。”\n“我当了它三千年的会计……今天，我站你这边。”', ['一起去']);
      Game.give('xsd', 1); G.flags.suanpan_ally = 1; Game.refreshNpcs();
    }];
    const res = _mt.call(this, id, check);
    if (res && !check && typeof res[1] === 'function') res[1] = wrapFn(res[1]);
    return res;
  };
  const LINES = {
    guiwang: ['鬼王·千面', '“欢迎光临鬼市！今晚的戏码是——《讨债人之死》。主角？就是你。”', '“我是来赎假账的！”'],
    dasiming: ['催债司·大司命', '“生死簿上写着：此人欠款未清，阳寿无效。我来帮你勾掉。”', '“我先把你的簿子勾了！”'],
    tiandao2: ['天道真身·总账房', '“我不是神。我是三界最大的债主，也是最大的欠债人。你要对账？那就看看谁的账更硬。”', '“今天，连本带利！”'],
  };
  const _boss = wrapFn(Talk.boss);
  Talk.boss = async function (id) {
    const G = Game.G; const M = MONS[id];
    if (!LINES[id] && id !== 'tiandao') return _boss.call(this, id);
    const need = MAIN[G.main]; if (need && G.realm < need.realm) { await UI.say(M.spr, M.n, `你还太弱了。（需要${REALMS[need.realm].n}期）`, ['撤']); return; }
    if (id === 'tiandao') {
      const c = await UI.say(M.spr, '讨尾款的天道', '“滴——检测到逾期客户。您的飞升尾款已逾期' + (G.age * 100) + '年，请立即还款。”', ['“我要对账！”', '先撤']); if (c !== 0) return;
      const r = await Game.fight('tiandao', { tier: 5.8, boss: true, adds: ['collector', 'paper'], solo: true }); if (r.res !== 'win') return;
      G.bosses.tiandao = 1; G.flags.boss_tiandao = 1; Game.log('击败天道分身。');
      G.main = MI('zhenshen'); G.debt = Math.round(G.debt * 0.7);
      await UI.card('天道……分身？', '天道的身体像信号不好一样闪了几下，碎成了一堆客服工单。\n半空中传来一个声音：“您好，您刚才击败的是天道智能客服。如需人工服务，请前往天庭催债司。”\n\n（你的欠款减少了30%）\n\n下一步：回到天庭催债司，找到天道真身——总账房！', 'boss_tiandao', ['继续']);
      Game.checkMain && Game.checkMain(); Game.refreshNpcs(); Game.save(); return;
    }
    const L = LINES[id]; const c = await UI.say(M.spr, L[0], L[1], [L[2], '先撤']); if (c !== 0) return;
    const adds = { guiwang: ['guizu', 'ghost'], dasiming: ['tianbing', 'zhuiming'], tiandao2: G.flags.suanpan_ally ? ['tianbing', 'collector'] : ['tianbing', 'zhuiming'] }[id];
    const tier = { guiwang: 4.9, dasiming: 5.75, tiandao2: 6.3 }[id];
    const r = await Game.fight(id, { tier, boss: true, adds, solo: true }); if (r.res !== 'win') return;
    G.bosses[id] = 1; G.flags['boss_' + id] = 1; Game.log(`击败${M.n}。`); if (Object.keys(G.bosses).length >= 4) Game.ach('boss4');
    if (id === 'guiwang') {
      Game.ach('guiwang_win'); G.main = MI('judge'); Game.give('ledger', 1); Game.give('xyf', 1);
      await UI.card('主线推进', '鬼王的一千张脸碎了一地，每张脸后面都贴着一张欠条。\n你从当铺里赎回了天道的假账：每一页都盖着“讨债司·判官钱不够”的章。\n\n下一步：化神后前往天外天，先过判官“钱不够”那一关！', 'boss_guiwang', ['继续']);
    }
    if (id === 'dasiming') {
      Game.ach('dasiming_win'); G.main = MI('tiandao'); Game.give('pjd', 2); Game.give('xyf', 1);
      await UI.card('主线推进', '大司命的生死簿掉在地上，翻开的那页写着你的名字——后面跟着一个红色的“勾销”。\n算无遗悄悄说：“生死簿能勾销债务，但需要天道本人画押。”\n\n下一步：前往天外天，与讨尾款的天道当面对账！', 'boss_dasiming', ['继续']);
    }
    if (id === 'tiandao2') {
      Game.ach('zhenshen_win'); G.main = MI('done'); Game.give('xyf', 2);
      const c2 = await UI.card('天道认账', '总账房的算盘一颗一颗崩落，三界的债务数字像雪一样往下掉。\n天道真身叹了口气：“我放了一辈子贷，却忘了自己也欠着三界一个公道。\n你要不要……来接替我的位置？”', 'boss_tiandao2', ['成为新天道（结局）', '让算无遗做天庭审计（结局）', '销账，继续修仙']);
      if (c2 === 0) { await Game.die('newdao'); return; }
      if (c2 === 1) { await Game.die('auditor'); return; }
      G.debt = 0; Game.ach('debt0'); await UI.card('销账', '你的欠款清零了。天道在你的档案上盖了个章：“此人惹不起”。\n剩下的人生，随你。（渡劫圆满后可在南天门飞升）', 'i:bill', ['好']);
    }
    Game.checkMain && Game.checkMain(); Game.refreshNpcs(); Game.save();
  };
  // 天道真身出现在催债司（同图另有大司命）
  const _rn = Game.refreshNpcs;
  Game.refreshNpcs = function () {
    _rn.apply(this, arguments); const G = this.G;
    if (!R.M || R.mode !== 'map' || !G) return;
    const mi = MAIN[G.main];
    if (R.mapId === 'cuizhai' && mi && mi.boss === 'tiandao2' && !G.bosses.tiandao2 && !R.ents.find(e => e.kind === 'boss' && e.id === 'tiandao2')) {
      const [i, j] = nearestWalk(10, 7); loadSprite('boss_tiandao2');
      addEnt({ kind: 'boss', id: 'tiandao2', spr: 'boss_tiandao2', i: i + 0.5, j: j + 0.5, dir: 'SE', label: MONS.tiandao2.n, lc: '#ffd040', s: 0.66, mark: '!' });
    }
  };
  // 新角色结局与特殊服务
  const _ex = Talk.extra;
  Talk.extra = function (id) {
    const G = Game.G; const out = _ex ? _ex.call(this, id) : [];
    if (id === 'taizi' && G.main >= MI('done') && (G.aff.taizi || 0) >= 60) out.push(['与敖小白合伙开度假村（结局）', async () => { const c = await say('taizi', '“账算清了，要不要和我一起把龙宫改成度假村？你当合伙人！”', ['好！（结局）', '再想想']); if (c === 0) await Game.die('longgong'); }]);
    if (id === 'sanniang' && G.bosses.guiwang && (G.aff.sanniang || 0) >= 50) out.push(['接手鬼市当铺（结局）', async () => { const c = await say('sanniang', '“鬼王没了，鬼市需要一个公道的掌柜。你来？”', ['接手（结局）', '不了']); if (c === 0) await Game.die('guishi'); }]);
    if (id === 'caishen') out.push(['拜财神（100灵石）', async () => { const k = 'caishen_' + G.year; if (G.used[k]) { await say('caishen', '“一年只能拜一次，心诚则灵，贪多则穷。”', ['好']); return; } if (G.stone < 100) { UI.toast('灵石不够'); return; } G.used[k] = 1; G.stone -= 100; const lucky = Math.random() < 0.3; const g = lucky ? 600 : 150; G.stone += g; Sfx.play('coin'); await say('caishen', lucky ? `“好运连连！”（获得 ${g} 灵石）` : `“小富即安。”（获得 ${g} 灵石）`, ['谢财神']); }]);
    if (id === 'baiwuchang') out.push(['问阳寿', async () => { const left = Game.lifeMax() - G.age; await say('baiwuchang', left > 500 ? '“你阳寿还长着呢，回去吧。”' : left > 100 ? `“还有${left}年左右。好好过。”` : `“……还有${left}年。想做的事，抓紧。”`, ['多谢']); }]);
    if (id === 'guanghan' && G.realm >= 5) out.push(['赏月（恢复气血灵力）', async () => { const s = Game.stats(); G.hp = s.mhp; G.mp = s.mmp; G.aff.guanghan = Math.min(150, (G.aff.guanghan || 0) + 2); Sfx.play('heal'); await say('guanghan', '“月色正好。”（气血与灵力全部恢复，好感+2）', ['确实']); }]);
    if (id === 'leigong' && G.realm >= 5) out.push(['请雷公淬体（下次突破+8%）', async () => { const k = 'leigong_' + G.year; if (G.used[k]) { await say('leigong', '“一年劈一次，劈多了伤身。”', ['好']); return; } G.used[k] = 1; G.tmpBrk = (G.tmpBrk || 0) + 0.08; const s = Game.stats(); G.hp = Math.max(1, G.hp - Math.round(s.mhp * 0.2)); Sfx.play('thunder'); R.shake = 0.8; await say('leigong', '“轰！”（气血-20%，下次突破成功率+8%）', ['……谢谢']); }]);
    if (id === 'xiaoyao' && G.realm >= 1) out.push(['听散人讲道', async () => { const k = 'xiaoyao_' + G.year; if (G.used[k]) { await say('xiaoyao', '“今天讲完了，明年再来。”', ['好']); return; } G.used[k] = 1; const g = Game.addExp(Game.yearExp() * 0.3, true); await say('xiaoyao', pick(['“修仙修仙，修的是心不是钱。”', '“天道的账，是算给怕它的人看的。”', '“逍遥二字，一半是不欠，一半是不怕。”']) + `\n（修为+${fmt(g)}）`, ['受教']); }]);
    if (id === 'suanpan' && G.debt > 0 && G.realm >= 5) out.push(['请会计核账（欠款-5%）', async () => { const k = 'suanpan_' + G.year; if (G.used[k]) { await say('suanpan', '“今年已经帮你核过了。”', ['好']); return; } G.used[k] = 1; const d = Math.round(G.debt * 0.05); G.debt -= d; await say('suanpan', `“这笔是重复计息，划掉。”（欠款-${fmt(d)}）`, ['算得好']); }]);
    return out;
  };
  const _tr = Game.travel;
  Game.travel = async function (id) { const r = await _tr.apply(this, arguments); const G = this.G; if (G && G.visited && Object.keys(G.visited).length >= 11) Game.ach('allmaps11'); return r; };
})();
// 资源保护：缺少素材时隐藏对应内容（避免半成品构建报错）
(function () {
  const A = window.ASSETS || {}; const S = A.sprites || {}, MP = A.maps || {};
  for (const k of Object.keys(NPCS)) if (NPCS[k].spr && !S[NPCS[k].spr]) delete NPCS[k];
  for (let i = MAP_ORDER.length - 1; i >= 0; i--) if (!MP[MAP_ORDER[i]]) MAP_ORDER.splice(i, 1);
  for (const id of Object.keys(MAPINFO)) if (MAPINFO[id].mons) MAPINFO[id].mons = MAPINFO[id].mons.filter(m => MONS[m] && S[MONS[m].spr]);
  for (const k of Object.keys(PET_SKILL)) if (!MONS[k] || !S[MONS[k].spr]) delete PET_SKILL[k];
})();

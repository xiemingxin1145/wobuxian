'use strict';
// ======================= 3.1② 仙界内容扩充：新怪/仙兽、新 NPC、新技能神通、新事件支线、仙界经济 =======================
// 接入手法（全部 Object.assign / 包裹，不改 data.js / talk.js / market25.js / dao28.js 本体）：
//   - MONS 注册天兵/天将/麒麟/貔貅/仙鹤/散仙/仙界妖魔（tier8-10，掉落高阶丹药与灵石）；
//   - NPCS+CHAT 注册 接引仙官·南云 / 瑶池仙使 / 太白金星 / 仙商·钱小多；
//   - SKILLS 注册仙界神通高倍率，接 dao28 神通池；TECHS 追加《仙界大道经》供太白传授；
//   - EVENTS.push 仙界事件池（蟠桃会/仙泉/仙差/仙友论道/仙界妖魔），QUESTS 追加支线；
//   - 仙界经济沿用 stone + 高阶物品，仙界坊市钱小多处接 market25 拍卖面板。
// 美术：新怪/新 NPC 暂复用既有精灵占位（HD 精灵/CG 待 Blender，见 art/ 与 500MB 盘点）。
// 存档：全部读现有字段，新旗惰性兜底，不升 v。
(function () {
  // ---- 1) 新怪物 / 仙兽（sprite 暂复用既有，待渲染）----
  Object.assign(MONS, {
    xian_tianbing: { n: '天兵', spr: 'npc_tianbing', el: '金', hp: 1.6, atk: 1.45, def: 1.35, spd: 1.1, sk: ['atk', 'swordqi', 'rockarmor'], pet: 1, drop: ['ore', 'pyd'] },
    xian_tianjiang: { n: '天将', spr: 'npc_leigong', el: '雷', hp: 2.5, atk: 1.6, def: 1.4, spd: 1.2, sk: ['atk', 'thunder', 'thunderall'], drop: ['pjd', 'peach'] },
    xian_qilin: { n: '麒麟', spr: 'npc_caishen', el: '金', hp: 2.2, atk: 1.5, def: 1.5, spd: 1.3, sk: ['atk', 'light', 'heal'], pet: 1, drop: ['xsd', 'peach'] },
    xian_pixiu: { n: '貔貅', spr: 'npc_taizi', el: '土', hp: 2.6, atk: 1.55, def: 1.6, spd: 1.0, sk: ['atk', 'rockarmor', 'freeload'], pet: 1, drop: ['pjd', 'coin'] },
    xian_xianhe: { n: '仙鹤', spr: 'npc_guanghan', el: '冰', hp: 1.5, atk: 1.4, def: 1.1, spd: 1.6, sk: ['atk', 'icecone', 'heal'], pet: 1, drop: ['ysd', 'peach'] },
    xian_sanxian: { n: '散仙', spr: 'npc_xiaoyao', el: '无', hp: 1.8, atk: 1.5, def: 1.2, spd: 1.3, sk: ['atk', 'flysword', 'light'], pet: 1, drop: ['scroll', 'pyd'] },
    xian_yaomo: { n: '仙界妖魔', spr: 'mon_demon', el: '火', hp: 2.0, atk: 1.6, def: 1.2, spd: 1.2, sk: ['atk', 'demonfire', 'blood'], drop: ['yd', 'pjd'] },
  });
  Object.assign(PET_SKILL, { xian_xianhe: ['atk', 'heal', 'icecone'], xian_qilin: ['atk', 'light', 'heal'] });

  // 仙界地图遇怪池更新（替换阶段①的占位怪）
  if (MAPINFO.jiuct) MAPINFO.jiuct.mons = ['xian_tianbing', 'xian_sanxian'];
  if (MAPINFO.xianfang) MAPINFO.xianfang.mons = ['xian_sanxian', 'xian_yaomo'];
  if (MAPINFO.yaochi) MAPINFO.yaochi.mons = ['xian_xianhe', 'xian_qilin'];
  if (MAPINFO.lingxiao) MAPINFO.lingxiao.mons = ['xian_tianjiang', 'xian_pixiu'];

  // ---- 2) 新技能 / 仙界神通（高倍率，接 dao28 神通池）----
  Object.assign(SKILLS, {
    xian_zhanlu: { n: '斩仙录', mp: 50, tg: 'one', k: 3.5, el: '金', fx: 'light', ic: 'sk_light', d: '仙界神通·超高单体金伤', cd: 8 },
    xian_wulei: { n: '五雷天诛', mp: 56, tg: 'all', k: 1.8, el: '雷', fx: 'thunderall', ic: 'sk_thunder', d: '仙界神通·群体雷伤40%眩晕', cd: 12, stun: 0.4 },
    xian_xianlu: { n: '瑶池仙露', mp: 30, tg: 'ally', k: 0, el: '水', fx: 'heal', ic: 'sk_heal', d: '仙界神通·回复60%气血', heal: 0.6 },
    xian_buhuo: { n: '不灭仙体', mp: 34, tg: 'self', k: 0, el: '金', fx: 'shield', ic: 'sk_shield', d: '仙界神通·回复30%气血并护体3回合', cd: 8, heal: 0.3, buff: 'def' },
  });
  // 追加一部仙界功法（太白金星传授）
  Object.assign(TECHS, {
    xiandao: { n: '《仙界大道经》', ic: 'book_o', d: '太白金星所授仙界入门功法，含三门仙界神通', sk: ['xian_zhanlu', 'xian_wulei', 'xian_xianlu'], pas: { def: 0.08, hp: 0.08 } },
  });

  // ---- 3) 新 NPC（spr/por 暂复用既有，待渲染）----
  Object.assign(NPCS, {
    nanyun: { n: '接引仙官·南云', spr: 'npc_disciple', map: 'jiuct', at: [10, 10], por: 'npc_disciple', minRealm: 7 },
    yaochi_shi: { n: '瑶池仙使', spr: 'npc_guanghan', map: 'yaochi', at: [10, 10], por: 'npc_guanghan', minRealm: 9, comp: 1, sex: 'f' },
    taibai: { n: '太白金星', spr: 'npc_caishen', map: 'lingxiao', at: [10, 8], por: 'npc_caishen', minRealm: 10 },
    qianxd: { n: '仙商·钱小多', spr: 'npc_merchant', map: 'xianfang', at: [10, 9], por: 'npc_merchant', minRealm: 8 },
  });
  Object.assign(CHAT, {
    nanyun: ['“新来的仙人？登记一下仙籍，往那边排队。”', '“南天门的云，三百年没扫了。”', '“飞升不容易，先去坊市换身行头吧。”'],
    yaochi_shi: ['“瑶池的仙泉，洗一次少修三年。”', '“蟠桃三百年一熟，你赶得真巧。”', '“西王母最近在愁蟠桃会的座次。”'],
    taibai: ['“老夫太白金星，掌天庭朝仪。”', '“金仙之上，还有太乙、大罗——路还长。”', '“你既来了凌霄殿，便算半个天庭人。”'],
    qianxd: ['“仙界坊市，童叟无欺，概不赊账。”', '“仙石？哦，你说灵石啊，上了天它也还是硬通货。”', '“打仙界妖魔，掉的丹药比凡间纯。”'],
  });
  // 仙商店铺（高阶货）
  Object.assign(SHOPS, {
    qianxd: { n: '仙界聚宝阁', items: ['pjd', 'xsd', 'ysd', 'peach', 'tsf', 'scroll', 'egg', 'wine'] },
  });

  // ---- 4) 新支线任务（QUESTS 追加，复用 ux23 追踪）----
  Object.assign(QUESTS, {
    q_ny1: { n: '仙门登记', giver: 'nanyun', d: '南云：“新来的仙人规矩不懂？先去九重天清理8个闹事天兵，给他们立立威。”', need: { k: { xian_tianbing: 8 } }, rw: { exp: 80000, stone: 20000, item: { pjd: 2 } }, minRealm: 7 },
    q_yaochi1: { n: '蟠桃会请柬', giver: 'yaochi_shi', d: '瑶池仙使：“蟠桃会要开了，备3个蟠桃和3株千年灵芝做席面。”', need: { i: { peach: 3, lz: 3 } }, rw: { exp: 120000, life: 20, aff: { yaochi_shi: 30 }, item: { xsd: 1 } }, pre: 'q_ny1', minRealm: 9 },
    q_taibai1: { n: '凌霄殿立威', giver: 'taibai', d: '太白金星：“天庭有些不服你的妖魔作祟。去凌霄殿外击败6个仙界妖魔，再回来论道。”', need: { k: { xian_yaomo: 6 } }, rw: { exp: 200000, stone: 60000, item: { pjd: 3 } }, minRealm: 10 },
    q_qxd1: { n: '仙商的货', giver: 'qianxd', d: '钱小多：“坊市缺3份妖丹压柜，送来给你好价。”', need: { i: { yd: 3 } }, rw: { exp: 60000, stone: 30000, item: { ysd: 1 } }, minRealm: 8 },
  });

  // ---- 5) 仙界事件池（EVENTS.push，realm>=7 触发）----
  EVENTS.push(
    ['x_peach', '蟠桃盛会', '瑶池大开蟠桃会，仙雾中传来丝竹之声。有仙子招手：“新来的，来凑个座？”', 'realm>=7;map=yaochi', 6, 'npc_guanghan',
      ['赴宴吃桃', 'item:peach:2;life+5;karma+1', '你吃了两枚蟠桃，只觉仙气氤氲，寿元大增。'],
      ['静静旁听', 'exp%80;int+1', '你在席间听几位金仙论道，若有所悟。']],
    ['x_spring', '瑶池仙泉', '一泓仙泉氤氲生烟，据说洗一次可抵三年苦修。', 'realm>=8;map=yaochi', 5, 'i:sk_meditate',
      ['入泉沐浴', 'hp%60;exp%100;luck+1', '你在仙泉中吞吐灵气，神清气爽。'],
      ['拱手离开', 'karma+1', '仙子点了点头：“倒也克己。”']],
    ['x_chai', '仙差任务', '天兵拦住你：“天庭征差，去九重天沿线驱散6只游荡散仙——噢不，是‘维持秩序’。”', 'realm>=7;map=jiuct', 5, 'npc_tianbing',
      ['接下仙差', 'fight:xian_sanxian', '你提着剑上了云路。'],
      ['婉拒', 'luck-1', '天兵记了你一笔。']],
    ['x_lundao', '仙友论道', '一位散仙拦住你论道：“你说，长生到底是为了什么？”', 'realm>=7', 5, 'npc_xiaoyao',
      ['据理力争', 'exp%60;cha+1', '你来我往三百回合，他拂袖而去却留了句“后会有期”。'],
      ['把酒言欢', 'stone-50;aff:nanyun:5', '你们在云头喝了三壶桃花酿。']],
    ['x_yaomo', '仙界妖魔', '云端黑气一卷，一头仙界妖魔扑了下来：“新来的仙人？正好打个牙祭！”', 'realm>=7', 6, 'mon_demon',
      ['拔剑迎战', 'fight:xian_yaomo', '妖风扑面，你祭出法器。'],
      ['驾云就走', 'luck-1', '妖魔在背后骂骂咧咧。']],
  );

  // ---- 6) Talk.extra 链式注入：仙界功能（论道/授法/拍卖/仙泉）----
  const _ex = Talk.extra;
  Talk.extra = function (id) {
    const G = Game.G; const out = _ex ? _ex.call(this, id) : [];
    if (!G) return out;
    // 太白金星：授《仙界大道经》 + 论道
    if (id === 'taibai' && G.realm >= 10) {
      out.push(['传授仙界大道经', async () => {
        if (G.techs.xiandao) { await UI.say(NPCS.taibai.por, NPCS.taibai.n, '“这部经，你已经会了。”', ['……']); return; }
        Game.learn('xiandao'); Sfx.play('levelup');
        await UI.say(NPCS.taibai.por, NPCS.taibai.n, '“既然入了凌霄殿，这部《仙界大道经》你且拿去参悟。三门仙界神通，学成可入神通池装备。”', ['多谢金星']);
      }]);
      out.push(['论道（悟道点）', () => { if (typeof DAO28 !== 'undefined') DAO28.discuss('taibai'); }]);
    }
    // 瑶池仙使：瑶池仙泉（恢复+修为）
    if (id === 'yaochi_shi' && G.realm >= 9) {
      out.push(['沐浴瑶池仙泉（恢复并得修为）', async () => {
        const s = Game.stats(); G.hp = s.mhp; G.mp = s.mmp;
        const g = Game.addExp(Game.yearExp() * 0.5, true); Sfx.play('heal');
        await UI.say(NPCS.yaochi_shi.por, NPCS.yaochi_shi.n, `“仙泉涤荡，毛孔都在吐纳。”（气血灵力全满，修为+${fmt(g)}）`, ['爽快']);
      }]);
    }
    // 仙商：仙界聚宝阁拍卖（接 market25 拍卖面板）
    if (id === 'qianxd' && G.realm >= 8) {
      out.push(['🔨 仙界聚宝阁拍卖', async () => { G._auctionFee = 0; await UI.panel('auction'); }]);
    }
    // 接引仙官：仙门登记（首登仙界提示）
    if (id === 'nanyun' && G.realm >= 7 && !G.flags.xianjie_reg) {
      out.push(['★ 仙门登记', async () => {
        G.flags.xianjie_reg = 1; G.aff.nanyun = (G.aff.nanyun || 0) + 10;
        await UI.say(NPCS.nanyun.por, NPCS.nanyun.n, '“行了，仙籍入册。往后九重天、瑶池、凌霄殿，凭此牒通行。仙界坊市的钱小多，你可以去会会。”', ['（仙籍已登记）']);
        Game.refreshNpcs(); Game.save();
      }]);
    }
    return out;
  };

  window.XianContent31 = {
    mons: ['xian_tianbing', 'xian_tianjiang', 'xian_qilin', 'xian_pixiu', 'xian_xianhe', 'xian_sanxian', 'xian_yaomo'],
    npcs: ['nanyun', 'yaochi_shi', 'taibai', 'qianxd'],
    skills: ['xian_zhanlu', 'xian_wulei', 'xian_xianlu', 'xian_buhuo'],
  };
})();

'use strict';
// ======================= 3.0① 主线终章扩展：飞升之后·仙界尾声 + 道统/霸业尾声章节 =======================
// 设计：天道账算清（G.main>=MI('done')）后追加尾声链 asc1→daotong→ba，走完回到 done。
// 接入手法：全部包裹/追加，不改 talk.js / game.js / data.js / story*.js / content22.js 本体。
//   - MAIN.push 追加 3 个 id 驱动章节（含 n/d/map/realm），不破坏现有 19+ 章顺序；
//   - 包裹 Talk.mainTalk 链：尾声 NPC（记账童子/落魄剑仙/掌门）挂 ★ 主线对话，ux23 追踪自动指向；
//   - 包裹 Talk.boss：击败天道真身且选"销账继续修仙"后自动把 main 推到 asc1；
//   - 包裹 Game.yearEnd：旧档已在 done 且债清者，一年后补发尾声开启提示（惰性兜底）。
// 存档：G.flags.epi30_started / epi_asc 惰性兜底，不升 v。仙界底图沿用 heaven（Blender 版另立手册）。
(function () {
  // ---- 0) 惰性兜底 ----
  function ensure(G) {
    if (!G) return G;
    if (!G.flags || typeof G.flags !== 'object') G.flags = {};
    return G;
  }

  // ---- 1) 追加尾声章节（done 之后；id 驱动，MI 可取）----
  MAIN.push(
    { id: 'asc1', n: '尾声·南天门', d: '天道的账已算清。天外天的仙官在南天门设了接风宴——飞升之后，仙界是什么格局？', map: 'heaven', realm: 5 },
    { id: 'daotong', n: '尾声·道统传承', d: '落魄剑仙问你：一身惊天动地的本事，打算带进棺材，还是传下去？', map: 'village', realm: 5 },
    { id: 'ba', n: '尾声·宗门霸业', d: '掌门云中鹤邀你回宗：三界大定，宗门该如何自处？是退守桃源，还是争霸天下？', map: 'sect', realm: 5 },
  );

  const say = (id, text, opts) => UI.say(NPCS[id].por, NPCS[id].n, text, opts);
  const adv = (text, por) => UI.card('尾声推进', text, por || 'i:scroll', ['继续']);

  // ---- 2) 包裹 Talk.mainTalk：尾声章节 ★ 对话（链最外层，先判尾声再放行旧链）----
  const _mt = Talk.mainTalk;
  Talk.mainTalk = function (id, check) {
    const G = Game.G; if (!G) return _mt.call(this, id, check);
    ensure(G);
    const M = G.main;

    // 旧档兜底：main 已在 done、债清、化神以上 → 首次对话记账童子时也能开启尾声
    if (!G.flags.epi30_started && MAIN[M] && MAIN[M].id === 'done' && G.debt === 0 && G.realm >= 5 && id === 'xianguan') {
      return ['★ 开启尾声·南天门接风宴', async () => { await startEpilogue(G); }];
    }

    // 尾声①：南天门接风宴（天外天·记账童子）
    if (M === MI('asc1') && id === 'xianguan') return ['★ 南天门接风宴', async () => {
      await say('xianguan', '“欢迎欢迎！讨债司……啊不，现在叫‘天庭善后衙门’了。大人，您是来赴接风宴的吧？”', ['接风宴？']);
      await UI.card('仙界新格局',
        '天道既倒，讨债司就地解散。三界重新排了座次：\n' +
        '· 龙王被废了高利贷牌照，太子敖小白把龙宫改成了度假村；\n' +
        '· 鬼市照常开张，阴三娘新挂了匾：“明码标价，概不赊账”；\n' +
        '· 宗门之间互相看不顺眼的老账，也都翻篇了。\n\n' +
        '而你的名字，从此写在了三界新地图的第一页。\n接下来的路——是传下道统，还是辅佐宗门争霸，又或者逍遥天外，全在你一念之间。',
        'i:sk_light', ['原来如此']);
      G.flags.epi_asc = 1; // 仙界尾声完成（供 end30 升级飞升结局）
      G.aff.xianguan = (G.aff.xianguan || 0) + 10;
      G.main = MI('daotong');
      Game.log('南天门接风宴：仙界新格局已定。');
      Game.checkMain(); Game.refreshNpcs(); Game.save();
      await adv('仙官凑过来低声说：“对了，桃花村那位落魄剑仙，听说你回来了，醉了三坛酒，念叨着要见你。”\n\n下一步：回桃花村，找落魄剑仙。', 'npc_mentor');
    }];

    // 尾声②：道统传承（桃花村·落魄剑仙）
    if (M === MI('daotong') && id === 'mentor') return ['★ 剑仙的托付', async () => {
      await say('mentor', '“嗝……你小子，真把天道的账算清了？我当年，就差这一步飞升——就因为没交尾款。”', ['师父当年也……']);
      await say('mentor', '“我这辈子的剑，早封在桥洞底下了。你那一身惊天地泣鬼神的本事，是带进棺材，还是……传下去？”', ['传下去？']);
      G.aff.mentor = (G.aff.mentor || 0) + 20;
      if (typeof DAO28 !== 'undefined' && DAO28.active()) { try { DAO28.gainDao(2, '剑仙指点'); } catch (e) { } }
      Game.log('落魄剑仙以一生剑心相托。');
      G.main = MI('ba');
      Game.checkMain(); Game.refreshNpcs(); Game.save();
      await adv('剑仙醉眼一眯：“回去看看你的宗门吧。掌门那老儿，念叨你好久了。”\n\n（额外悟道点+2）\n\n下一步：回宗门，找掌门·云中鹤。', 'npc_elder');
    }];

    // 尾声③：宗门霸业（青云宗·掌门云中鹤）
    if (M === MI('ba') && id === 'elder') return ['★ 掌门之问', async () => {
      await say('elder', '“天道既去，宗门当何去何从？老朽老了，这把椅子，迟早是你们年轻人的。”', ['掌门的意思是？']);
      await UI.card('宗门之道',
        '掌门抚须良久：“老朽的意思是——不争。青云宗千年基业，不求称霸，但求不倒。\n' +
        '可这三界，树欲静而风不止。你且记住：宗门在你手里，是盾是矛，都由你。”\n\n' +
        '（宗门贡献+100、宗门声望+30；若你已是宗主，未来更可争霸三界）',
        'npc_elder', ['弟子明白']);
      if (G.sect) { G.contrib += 100; G.sectRenown = (G.sectRenown || 0) + 30; }
      G.karma += 2;
      Game.log('与掌门论宗门之道。');
      G.main = MI('done');
      Game.checkMain(); Game.refreshNpcs(); Game.save();
      await adv('尾声已了。剩下的人生，随你。\n\n· 渡劫圆满后，可在南天门飞升；\n· 若你的道统/宗门/神通已臻大成，可在对应的关键人物处选择【大结局】。', 'i:sk_light');
    }];

    return _mt.call(this, id, check);
  };

  // ---- 3) 开启尾声（销账后/旧档补发共用）----
  async function startEpilogue(G) {
    ensure(G);
    G.flags.epi30_started = 1;
    G.main = MI('asc1');
    Game.checkMain(); Game.refreshNpcs(); Game.save();
    await UI.card('尾声开启',
      '天道的账算清了，三界重归太平。\n但你的仙途还没有走完——天外天的仙官递来一张请柬：南天门，设了接风宴。\n\n（尾声章节开启：先去天外天·找记账童子）',
      'i:sk_light', ['前往南天门']);
  }

  // ---- 4) 包裹 Talk.boss：击败天道真身选"销账继续修仙"后，自动进入尾声 ----
  const _boss = Talk.boss;
  Talk.boss = async function (id) {
    await _boss.call(this, id);
    const G = Game.G;
    if (!G || G.dead) return;
    if (MAIN[G.main] && MAIN[G.main].id === 'done' && !G.flags.epi30_started && G.debt === 0 && G.realm >= 5) {
      await startEpilogue(G);
    }
  };

  // ---- 5) 包裹 Game.yearEnd：旧档已在 done、债清、化神以上 → 补发一次尾声开启 ----
  const _ye = Game.yearEnd;
  Game.yearEnd = async function () {
    const before = this.G && this.G.year;
    await _ye.call(this);
    const G = this.G;
    if (!G || G.dead || G.year === before) return;
    ensure(G);
    if (!G.flags.epi30_started && MAIN[G.main] && MAIN[G.main].id === 'done' && G.debt === 0 && G.realm >= 5) {
      await startEpilogue(G);
    }
  };

  // ---- 6) 暴露测试/其他模块接口 ----
  window.Main30 = {
    chapters: ['asc1', 'daotong', 'ba'],
    isStarted: () => !!(Game.G && Game.G.flags && Game.G.flags.epi30_started),
    start: async () => { if (Game.G) await startEpilogue(Game.G); },
  };
})();

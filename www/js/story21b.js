'use strict';
// ======================= v2.1 新主线章节与人物对话（在 talk.js 之后加载） =======================
(function () {
  const say = (id, text, opts) => UI.say(NPCS[id].por, NPCS[id].n, text, opts);
  const adv = (id, title, text, por) => UI.card(title || '主线推进', text, por || 'i:scroll', ['继续']);
  const T = Game.tier ? null : null;
  const _mt = Talk.mainTalk;
  Talk.mainTalk = function (id, check) {
    const G = Game.G; const M = G.main;
    // 第三章：宿敌龙傲天
    if (M === MI('rival') && id === 'aotian') return ['★ 接受龙傲天的挑战', async () => {
      await say('aotian', '“我，龙傲天，天命之子，三岁练剑，五岁顿悟，七岁……七岁被你们村的大黄狗追过。总之——宗门小比，你我一决高下！”', ['应战！']);
      const r = await Game.fight('aotian', { tier: 1.25, solo: true, noflee: true });
      if (r.res === 'win') {
        G.main = MI('market'); G.aff.aotian = (G.aff.aotian || 0) + 20; Game.ach('rival_win'); Game.give('pyd', 1); Game.log('宗门小比击败龙傲天。');
        await say('aotian', '“不可能……我可是主角！……好，这次算你赢。下次见面，我一定会更强！”\n（他走之前悄悄塞给你一颗培元丹：“别误会，这是战书的附件。”）', ['（这人还挺可爱）']);
        await adv(null, '小比之后，师兄们议论纷纷：坊市的钱多多在倒卖什么“祖传欠条”。\n\n下一步：去云来坊市找钱多多，问问欠条的来历。', 'npc_aotian');
      } else await say('aotian', '“哈哈哈！果然我才是主角！回去再练练吧。”', ['可恶……']);
    }];
    // 第六章：黑心长老
    if (M === MI('traitor') && id === 'heixin') { if (G.realm < 2) return check ? null : ['质问', () => say('heixin', '“小小练气，也敢来问东问西？”', ['……']), 'gate']; return ['★ 揭穿黑心长老', async () => {
      await say('heixin', '“名单？什么名单？我只是……把弟子们的欠款信息‘共享’给了讨债司，顺便收点‘信息服务费’嘛。”', ['你这是出卖同门！']);
      await say('heixin', '“年轻人，宗门就是一家公司，我是股东，你们是……资产。既然你知道了——就留下吧！”', ['出手！']);
      const r = await Game.fight('heixin', { tier: 2.3, solo: true, adds: ['paper', 'paper'], noflee: true });
      if (r.res === 'win') {
        G.main = MI('corpse'); Game.ach('traitor'); if (G.sect) G.contrib += 50; Game.give('zjd', 1); G.karma += 2; Game.log('揭穿黑心长老。');
        await UI.say(NPCS.elder.por, NPCS.elder.n, '“好！清理门户，大快人心！这枚筑基丹，宗门奖励的。……黑心长老欠的工资我就不发了。”', ['谢掌门']);
        await adv(null, '黑心长老招供：讨债司的账本副本被送去了乱葬岗，由尸王“欠一世”保管。\n\n下一步：前往乱葬岗，击败尸王，夺回账本。', 'npc_heixin');
      }
    }]; }
    // 第八章：天道保险
    if (M === MI('insure') && id === 'baoxian') { if (G.realm < 3) return check ? null : ['打听消息', () => say('baoxian', '“金丹以下的客户，我们只卖意外险。您先结丹吧。”', ['……']), 'gate']; return ['★ 打听龙王钱庄', async () => {
      const c = await say('baoxian', '“龙王钱庄？嘘——我们天道保险的再保险就是在那儿办的。想知道更多？买一份‘渡劫无忧险’吧，只要800灵石，身故赔付十倍！”', ['投保（800灵石）', '不买，直接说！']);
      if (c === 0 && G.stone >= 800) { G.stone -= 800; G.flags.insured = 1; Game.give('tsf', 1); Game.ach('insured'); await say('baoxian', '“爽快！这是您的保单和赠品替死符。好了，我告诉你——”', ['快说']); }
      else await say('baoxian', '“不买？那……那我只好叫讨债司的外勤来‘劝劝’你了！”', ['来啊！']);
      const r = await Game.fight('collector', { tier: 3.2, elite: true, solo: true, adds: ['collector', 'paper'], noflee: true });
      if (r.res === 'win') {
        G.main = MI('dragon'); Game.log('从保真人口中得知龙王钱庄的秘密。');
        await say('baoxian', '“别打别打！我说！龙王用天道的钱放高利贷，利息的三成交给讨债司。账本就在龙宫的金库里！”', ['早说嘛']);
        await adv(null, '下一步：前往东海仙岛，击败东海龙王·敖铁公。', 'npc_baoxian');
      }
    }]; }
    // 第十章：冷月之约
    if (M === MI('lengyue') && id === 'lengyue') { if (G.realm < 4) return check ? null : ['搭话', () => say('lengyue', '“元婴之前，别来找我。讨债司的人会盯上你。”', ['……']), 'gate']; return ['★ 冷月之约', async () => {
      await say('lengyue', '“我曾是讨债司的收账仙子，收了三百年账。直到有一天，我发现账本上所有人的利息，都是按‘一天等于一年’算的。”', ['所以你辞职了？']);
      await say('lengyue', '“我偷走了讨债司的一页总账，所以他们派‘游魂队’来追我。帮我打退它们，我就把总账给你。”', ['出手！']);
      const r = await Game.fight('ghost', { tier: 4.2, elite: true, solo: true, adds: ['ghost', 'collector'], noflee: true });
      if (r.res === 'win') {
        G.main = MI('mozun'); G.aff.lengyue = (G.aff.lengyue || 0) + 30; Game.ach('lengyue'); Game.give('ledger', 1); Game.log('与冷月仙子立下约定。');
        await say('lengyue', '“……谢谢。总账上写着，魔尊也欠天道钱，而且他手里有天道做假账的证据。去魔道裂谷吧。”\n（她转身时，你好像看到她笑了一下。）', ['后会有期']);
        await adv(null, '下一步：前往魔道裂谷，找魔尊·赊刀人。', 'npc_lengyue');
      }
    }]; }
    // 第十二章：判官钱不够
    if (M === MI('judge') && id === 'judge') { if (G.realm < 5) return check ? null : ['求见', () => say('judge', '“化神以下，没资格排号。”', ['……']), 'gate']; return ['★ 闯讨债司', async () => {
      await say('judge', `“${G.name}？查到了：祖传欠款 ${fmt(G.debt)} 灵石，逾期 ${G.age * 365} 天，滞纳金另计。想见天道？先过我这关！”`, ['你的账是假的！']);
      const r = await Game.fight('judge', { tier: 5.3, solo: true, boss: true, adds: ['collector', 'collector'], noflee: true });
      if (r.res === 'win') {
        G.main = MI('tiandao'); G.flags.judge_beaten = 1; Game.ach('judge_win'); Game.log('击败判官钱不够。');
        await say('judge', '“我、我只是个打工的……天道就在里面。对了，你要是赢了，讨债司缺个判官……”', ['让开']);
        await adv(null, '讨债司的大门打开了，里面传来算盘声。\n\n下一步：与讨尾款的天道当面对账！', 'npc_judge');
      }
    }]; }
    return _mt.call(this, id, check);
  };
  // ---- 角色专属附加对话（结局、特殊服务） ----
  const _greet = Talk.greet;
  Talk.extra = function (id) {
    const G = Game.G; const out = [];
    if (id === 'aotian' && G.main >= MI('done') && (G.aff.aotian || 0) >= 60 && G.realm >= 5) out.push(['与龙傲天开宗立派（结局）', async () => { const c = await say('aotian', '“天道的账算清了，我们……一起开个宗门怎么样？主角轮流当！”', ['好！（结局）', '再想想']); if (c === 0) await Game.die('rival'); }]);
    if (id === 'judge' && G.main >= MI('done')) out.push(['接任判官（结局）', async () => { const c = await say('judge', '“这支判官笔给你。记住：利息怎么算，你说了算。”', ['接笔（结局）', '不了']); if (c === 0) await Game.die('judge'); }]);
    if (id === 'mengpo') {
      out.push(['喝一碗汤（50灵石）', async () => { if (G.stone < 50) { UI.toast('灵石不够'); return; } G.stone -= 50; const s = Game.stats(); G.hp = s.mhp; G.mp = s.mmp; Game.ach('mengpo_soup'); await say('mengpo', pick(['“喝了这碗汤，烦恼全忘光——欠款记得还。”', '“今天是番茄蛋花汤。”', '“这碗加了蟠桃，算你便宜。”']) + '\n（气血与灵力全部恢复）', ['好喝']); }]);
      if (G.qdone.q_mp2 && G.age >= 120) out.push(['接手汤铺（结局）', async () => { const c = await say('mengpo', '“我想退休了。你愿意接手我的汤铺吗？”', ['接手（结局）', '再想想']); if (c === 0) await Game.die('mengpo'); }]);
    }
    if (id === 'yuelao') {
      out.push(['求一根红线', async () => { const comps = Object.keys(NPCS).filter(k => NPCS[k].comp && (G.aff[k] || 0) >= 30 && k !== G.partner); if (!comps.length) { await say('yuelao', '“你还没有心上人啊。多和人聊聊天、送送礼吧。”', ['好']); return; } const c = await say('yuelao', '“想和谁的缘分更进一步？一根红线 300 灵石。”', [...comps.map(k => NPCS[k].n), '算了']); if (c >= comps.length) return; if (G.stone < 300) { UI.toast('灵石不够'); return; } G.stone -= 300; const k = comps[c]; G.aff[k] = Math.min(150, G.aff[k] + 20); Sfx.play('pickup'); await say('yuelao', `“红线已系好。${NPCS[k].n.split('·').pop()}今晚会梦见你的。”（好感+20）`, ['谢谢月老']); }]);
    }
    if (id === 'shuoshu' && G.stone >= 50000) out.push(['买下茶馆（50000灵石，结局）', async () => { const c = await say('shuoshu', '“您要买下茶馆？那……我还能在这当小二吗？”', ['买！（结局）', '算了']); if (c === 0) { G.stone -= 50000; await Game.die('teahouse'); } }]);
    if (id === 'aotian' && G.main > MI('rival') && G.realm >= 2) out.push(['切磋一下', async () => { const k = 'duel_' + G.year; if (G.used[k]) { await say('aotian', '“今天已经打过了！明年再来！”', ['好']); return; } G.used[k] = 1; const r = await Game.fight('aotian', { tier: Math.max(1.2, Game.power() - 0.1), solo: true }); if (r.res === 'win') { G.aff.aotian = (G.aff.aotian || 0) + 8; if ((G.aff.aotian || 0) >= 100) Game.ach('rival_friend'); await say('aotian', '“又输了……不过我感觉我变强了！”（好感+8）', ['你确实变强了']); } }]);
    if (id === 'luren' && G.qdone.q_lr2) Game.ach('luren');
    return out;
  };
})();

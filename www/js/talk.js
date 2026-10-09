'use strict';
// ======================= NPC 对话 / 交互点 =======================
const CHAT = {
  mom: ['“修仙可以，饭要按时吃。”', '“隔壁王大爷说你昨天又去偷他家桃了？”', '“天道的债？你爷爷的爷爷欠的，跟你有啥关系！”', '“娘给你缝了件新衣裳，等你筑基了穿。”'],
  farmer: ['“这野猪成精了，专挑最好的白菜拱。”', '“年轻人，种地也是一种修行。”', '“我年轻时也想修仙，后来发现种地更挣钱。”'],
  cuihua: ['“你、你看我干嘛……”', '“桃花开了，要不要一起去看？”', '“听说修仙的人都很长寿……那你会等我变老吗？”'],
  mentor: ['“嗝——好酒！”', '“剑仙？那都是过去的事了，现在我是酒仙。”', '“你那灵根，嗯……也不是不能练。”', '“我当年也欠天道钱，所以我住在桥洞下。”'],
  villager: ['“话说那天道，手持算盘，脚踏祥云……”', '“客官，听书要先付钱。”', '“我这儿有个关于尾款的故事，你要不要听？”'],
  elder: ['“修仙之道，在于坚持——和按时交学费。”', '“我们青云宗，历史悠久，福利……也很悠久。”', '“年轻人，不要总想着搞个大新闻。”'],
  sister: ['“师弟/师妹，今天练剑了吗？”', '“我、我才没有特意等你呢！”', '“再偷懒就罚你扫山门！”'],
  xiaoyi: ['“剑在人在。”', '“我的剑又断了……”', '“一起去后山练剑？”'],
  danlao: ['“炼丹要掌握火候，就像炒菜。”', '“别碰那个炉子，上次炸了半个山头。”'],
  merchant: ['“童叟无欺，概不赊账！”', '“这位客官骨骼清奇，一看就是买得起的人！”', '“最近生意不好做，天道税太高了。”'],
  yaopu: ['“灵草新鲜到货！”', '“这药包治百病——除了穷病。”'],
  shuoshu: ['“客官里面请，茶钱另算。”', '“听说天外天有个讨债司，门口排队排到了东海。”'],
  fisherm: ['“空军是不可能空军的，这辈子都不可能空军的。”', '“钓鱼佬永不空军！……今天除外。”'],
  ali: ['“哼，人类。”', '“你身上有讨债鬼的味道……”', '“我的尾巴是不是很好看？”'],
  lost: ['“请问……青云宗怎么走？”', '“我已经在这里迷路三年了。”'],
  keeper: ['“晚上别来，白天也别来。”', '“这里的僵尸都很讲礼貌，就是牙不太好。”'],
  aoxiao: ['“我爹是龙王，但我不想继承钱庄。”', '“海里的珍珠，都是我的眼泪……开玩笑的。”'],
  guzhu: ['“百草谷，以药入道。”', '“要不要来我们谷？伙食是三界第一。”'],
  fisher2: ['“东海龙王啊，抠门得很，一个铜板都要算利息。”', '“出海？等风停了再说。”'],
  sumei: ['“哟，小可爱，迷路了？”', '“魔道怎么了？魔道也讲诚信——偶尔。”'],
  moguard: ['“天魔殿招人，待遇从优。”', '“我们魔尊最近心情不好，听说被天道催债了。”'],
  xianguan: ['“请排队，叫到号再进去。”', '“还款请走左边，申诉请走右边——右边门是锁着的。”'],
  mentor2: ['“你终于来了。天道那老东西，我们一起去会会。”', '“当年我差一步飞升，就因为没交尾款。”'],
};
const SHOPS = {
  merchant: { n: '钱多多的杂货铺', items: ['hcd', 'hld', 'pyd', 'ysf', 'tsf', 'scroll', 'egg', 'wine', 'jadeg', 'fan', 'key'], eq: true },
  yaopu: { n: '药铺', items: ['herb', 'lz', 'hcd', 'hld', 'pyd', 'zjd', 'ysd', 'peach'] },
  fisherm: { n: '渔具铺', items: ['fish', 'ysf', 'wine'] },
  fisher2: { n: '海货摊', items: ['fish', 'peach', 'yd', 'coin'] },
  sumei: { n: '魔女的小店', items: ['pjd', 'xsd', 'tsf', 'yd'] },
  xianguan: { n: '天庭福利社', items: ['ysd', 'pjd', 'xsd', 'peach', 'tsf'] },
};
const Talk = {
  async npc(id) {
    const G = Game.G; const N = NPCS[id]; if (!N) return;
    Sfx.play('dialog');
    while (true) {
      const opts = []; const acts = [];
      const add = (t, f) => { opts.push(t); acts.push(f); };
      const mt = this.mainTalk(id); if (mt) add('★ ' + mt[0], mt[1]);
      for (const q in G.quests) if (QUESTS[q].giver === id && Game.questDone(q)) add('✔ 交付：' + QUESTS[q].n, () => Game.finishQuest(q));
      for (const q in QUESTS) { const Q = QUESTS[q]; if (Q.giver === id && !G.quests[q] && !G.qdone[q] && Game.questAvail(q)) add('！' + Q.n, async () => { const c = await UI.say(N.por, N.n, Q.d + `\n\n需要：${this.needTxt(Q)}`, ['接受', '算了']); if (c === 0) Game.acceptQuest(q); }); }
      add('闲聊', async () => { const ln = pick(CHAT[id] || ['……']); const k = 'chat_' + id; let extra = ''; if (!G.used[k]) { G.used[k] = 1; G.aff[id] = (G.aff[id] || 0) + ri(2, 5); extra = '\n（好感度提升了）'; } await UI.say(N.por, N.n, ln + extra, ['……']); });
      if (N.comp || id === 'mentor') add('送礼', () => this.gift(id));
      if (SHOPS[id]) add('交易', () => UI.shop(id));
      if (id === 'danlao' || id === 'guzhu') add('请教炼丹', () => this.learnAlch(id));
      const sect = Object.entries(SECTS).find(([k, s]) => s.master === id);
      if (sect) {
        const [sid, S] = sect;
        if (!G.sect && G.flags.awakened && G.realm >= 1) add('拜师入门', async () => { const c = await UI.say(N.por, N.n, `${S.d}\n\n加入后可学习${TECHS[S.tech].n}，并可用贡献兑换物资。（只能加入一个宗门）`, ['拜师', '再想想']); if (c === 0) { Game.joinSect(sid); Sfx.play('gong'); Game.checkMain(); await UI.say(N.por, N.n, `好！从今天起，你就是${S.n}弟子了。学费……先欠着。`, ['谢师父']); } });
        else if (!G.sect && !G.flags.awakened) add('拜师入门', () => UI.say(N.por, N.n, '你连灵根都没觉醒，先回去找个高人给你看看吧。', ['好吧']));
        else if (!G.sect && G.realm < 1) add('拜师入门', () => UI.say(N.por, N.n, '先修到练气期再来。', ['好吧']));
        if (G.sect === sid) { add('宗门兑换', () => UI.shop('sect')); add('精进功法', () => UI.panel('skills')); }
      }
      if (N.comp) {
        const a = G.aff[id] || 0;
        if (G.follower === id) add('请你先回去', () => { G.follower = null; R.ents = R.ents.filter(e => e.kind !== 'comp'); UI.toast(N.n + ' 回去了'); });
        else if (a >= 60) add('一起闯荡吧', () => { G.follower = id; R.ents = R.ents.filter(e => e.kind !== 'comp'); Game.refreshNpcs(); UI.toast(N.n + ' 成为你的同行伙伴（会参与战斗）'); });
        if (a >= 100 && !G.partner && G.realm >= 1) add('💗 结为道侣', async () => { const c = await UI.say(N.por, N.n, '……你是认真的吗？', ['认真的！', '开玩笑的']); if (c === 0) { G.partner = id; G.follower = id; Game.ach('partner'); Sfx.play('victory'); Game.log(`与${N.n}结为道侣。`); await UI.card('结为道侣', `你与${N.n}在桃花树下结为道侣。\n天道发来贺电，并附上了份子钱催缴单。`, N.por, ['从此以后']); Game.refreshNpcs(); } });
      }
      if (id === 'xianguan' && G.debt > 0) add('还款', () => Acts.debt());
      add('离开', null);
      const c = await UI.say(N.por, N.n + (N.comp ? `  ♥${G.aff[id] || 0}` : ''), this.greet(id), opts);
      const f = acts[c]; if (!f) break;
      await f(); if (G.dead) return; UI.hud(); if (R.mode !== 'map') return;
    }
  },
  greet(id) { const G = Game.G; const a = G.aff[id] || 0; const N = NPCS[id]; if (id === 'mom') return G.realm ? `${G.name}回来啦！在外面没受欺负吧？` : '饭快好了，别跑远了。'; if (N.comp) return a >= 100 ? '（看你的眼神里有光）' : a >= 60 ? '“又见面了！”' : a >= 20 ? '“是你啊。”' : '“有事吗？”'; return pick(CHAT[id] || ['……']); },
  needTxt(Q) { const n = Q.need; if (n.k) return Object.entries(n.k).map(([m, c]) => `击败${MONS[m].n}×${c}`).join('，'); if (n.i) return Object.entries(n.i).map(([i, c]) => `${ITEMS[i].n}×${c}`).join('，'); return '完成指定目标'; },
  async gift(id) {
    const G = Game.G; const N = NPCS[id]; const have = GIFTS.filter(g => Game.has(g));
    if (!have.length) { await UI.say(N.por, N.n, '你身上没有合适的礼物。（桃花酿、暖玉、折扇、蟠桃、灵鱼、古钱可以送人，坊市有卖）', ['好']); return; }
    const c = await UI.say(N.por, '送礼', '选择要送的礼物：', [...have.map(g => `${ITEMS[g].n}（${G.inv[g]}）`), '算了']);
    if (c >= have.length) return; const g = have[c]; Game.take(g);
    const like = { mentor: 'wine', sister: 'jadeg', cuihua: 'jadeg', ali: 'fish', aoxiao: 'peach', sumei: 'coin', xiaoyi: 'fan' }[id];
    const v = g === like ? 22 : ri(8, 12); G.aff[id] = Math.min(150, (G.aff[id] || 0) + v); G.giftCount++; if (G.giftCount >= 20) Game.ach('gift');
    Sfx.play('pickup'); await UI.say(N.por, N.n, g === like ? '“这、这正是我最喜欢的！”（好感+' + v + '）' : '“谢谢你。”（好感+' + v + '）', ['不客气']);
  },
  async learnAlch(id) {
    const G = Game.G; const N = NPCS[id]; const cost = Math.round(150 * Math.pow(2, G.alchLv));
    if (G.alchLv >= 6) { await UI.say(N.por, N.n, '你的丹道造诣已经不在我之下了。', ['过奖']); return; }
    const c = await UI.say(N.por, N.n, `想学炼丹？炼丹等级 ${G.alchLv} → ${G.alchLv + 1}，学费 ${cost} 灵石。\n（等级越高，能炼的丹越多，成功率越高）`, [`交学费（${cost}）`, '算了']);
    if (c === 0) { if (G.stone < cost) { UI.toast('灵石不够'); return; } G.stone -= cost; G.alchLv++; Sfx.play('levelup'); UI.toast(`炼丹等级提升至 ${G.alchLv}`); }
  },
  // ------- 主线对话 -------
  mainTalk(id, check) {
    const G = Game.G; const M = G.main;
    if (M === 1 && id === 'mentor' && G.flags.main1 && !G.flags.awakened) return ['请剑仙测灵根', async () => {
      const L = Game.linggen(); await UI.say('npc_mentor', '落魄剑仙', '来，把手伸出来……嗝。', ['伸手']);
      Sfx.play('magic'); await UI.card('灵根觉醒', `一道光芒从你掌心升起——\n\n【${L.n}】\n${L.d}\n\n修炼速度 ×${L.mult}`, 'i:sk_light', ['原来如此']);
      G.flags.awakened = 1; if (!G.techs.changsheng) Game.learn('changsheng'); Game.give('wine', 1);
      await UI.say('npc_mentor', '落魄剑仙', `不错不错。顺便告诉你，你家祖上欠天道一笔飞升尾款，现在连本带利 ${fmt(G.debt)} 灵石。\n想活得久，就好好修炼吧。修到练气，去青云宗（或者别的宗门）拜个师。这坛酒……就当学费了。`, ['（这剑仙靠谱吗）']);
      G.main = 2; Game.checkMain(); G.aff.mentor = (G.aff.mentor || 0) + 10;
    }];
    if (M === 3 && id === 'merchant') return ['质问欠条的来历', async () => {
      await UI.say('npc_merchant', '钱多多', '欠条？哦——那批“祖传欠条”是我从天道讨债司批发来的，一文钱一张，我再加价卖给讨债鬼……', ['你说什么？！']);
      await UI.say('npc_merchant', '钱多多', '别动手别动手！是讨债鬼头子逼我的！它就在后巷——', ['去后巷']);
      const r = await Game.fight('collector', { tier: 1.4, elite: true, solo: true, adds: ['collector'], noflee: true });
      if (r.res === 'win') { Game.give('bill'); G.main = 4; Game.log('在坊市击败讨债鬼头子，拿到祖传欠条。'); await UI.card('主线推进', '你从讨债鬼头子身上搜出一张【祖传欠条】。上面的落款居然是……天道讨债司·外包部。\n\n下一步：修到筑基，前往万妖秘境找狐妖阿离打听消息。', 'i:bill', ['继续']); }
    }];
    if (M === 4 && id === 'ali') { if (G.realm < 2) return check ? null : ['打听天道的事', () => UI.say('mon_fox', '狐妖·阿离', '哼，你这点修为，进秘境深处会被吃掉的。筑基了再来。', ['……'])]; return ['打听天道的打手', async () => {
      await UI.say('mon_fox', '狐妖·阿离', '天道雇了秘境里的树妖王帮它看守账本。它们收的是“绩效灵石”……打败树妖王，账本就是你的。', ['带路']);
      const r = await Game.fight('treant', { tier: 2.4, elite: true, solo: true, adds: ['treant', 'fox'], noflee: true });
      if (r.res === 'win') { G.main = 5; G.aff.ali = (G.aff.ali || 0) + 15; await UI.card('主线推进', '树妖王倒下了，但账本被它的同伙带去了乱葬岗，交给了尸王“欠一世”。\n\n下一步：前往乱葬岗，击败尸王。', 'mon_fox', ['继续']); }
    }]; }
    return null;
  },
  async boss(id) {
    const G = Game.G; const M = MONS[id]; const need = MAIN[G.main];
    if (G.realm < need.realm) { await UI.say(M.spr, M.n, `你还太弱了。（需要${REALMS[need.realm].n}期）`, ['撤']); return; }
    const LINES = {
      corpse: ['尸王·欠一世', '“我欠天道一辈子，所以我死了也得接着还……你也是来讨债的？”', '“不，我是来拿账本的！”'],
      dragon: ['东海龙王·敖铁公', '“我的钱庄，存款利息0.01%，贷款利息30%，这叫商业模式！”', '“这叫高利贷！”'],
      mozun: ['魔尊·赊刀人', '“我赊出去的刀，都是要收钱的。天道欠我的，我欠天道的，你说该找谁？”', '“先打一架再说！”'],
      tiandao: ['讨尾款的天道', '“滴——检测到逾期客户。您的飞升尾款已逾期' + (G.age * 100) + '年，请立即还款。”', '“我要对账！”'],
    };
    const L = LINES[id];
    if (id === 'mozun' && G.sect === 'tianmo') {
      const c = await UI.say(M.spr, L[0], '“哦？自家弟子。要不要一起去天外天，把天道的账本烧了？”', ['同去！（不战斗）', '我要挑战你！']);
      if (c === 0) { G.bosses.mozun = 1; G.main = 8; G.karma -= 5; Game.give('pjd', 2); await UI.card('魔道联盟', '魔尊把天道的把柄交给了你：天道讨债司的账本有三成是伪造的。\n\n下一步：化神后前往天外天，与天道对账！', M.spr, ['继续']); Game.refreshNpcs(); return; }
    }
    const c = await UI.say(M.spr, L[0], L[1], [L[2], '先撤']); if (c !== 0) return;
    const adds = { corpse: ['jiangshi', 'jiangshi'], dragon: ['crab', 'crab'], mozun: ['demon', 'demon'], tiandao: ['collector', 'paper'] }[id];
    const tier = { corpse: 2.6, dragon: 3.6, mozun: 4.6, tiandao: 5.8 }[id];
    const r = await Game.fight(id, { tier, boss: true, adds, solo: true });
    if (r.res !== 'win') return;
    G.bosses[id] = 1; if (Object.keys(G.bosses).length >= 4) Game.ach('boss4');
    Game.log(`击败${M.n}。`);
    if (id === 'corpse') { Game.give('ledger'); G.main = 6; G.flags.contract = 1; await UI.card('主线推进', '尸王倒下时嘟囔着：“终于……不用还了……”\n你拿到了【天道账本残页】，发现上面的利息是按“天”复利计算的——一天等于一年。\n\n下一步：结成金丹后，前往东海仙岛。', 'i:debtbook', ['继续']); }
    if (id === 'dragon') { Game.learn('laizhang'); G.main = 7; G.debt = Math.round(G.debt * 0.5); await UI.card('主线推进', '龙王交出了天道的离岸账户，你的欠款直接减半！\n他还哭着塞给你一本《赖账真经》：“拿走拿走，这玩意在我这儿不灵。”\n\n下一步：修成元婴后，前往魔道裂谷。', 'boss_dragon', ['继续']); }
    if (id === 'mozun') { G.main = 8; Game.give('pjd', 1); await UI.card('主线推进', '魔尊扔给你一个玉简：“天道讨债司的账本，有三成是伪造的。去吧，替我也讨个说法。”\n\n下一步：化神后前往天外天，与天道对账！', 'boss_mozun', ['继续']); }
    if (id === 'tiandao') {
      G.main = 9; const c2 = await UI.card('天道认输', '天道的算盘碎了一地。\n“好吧好吧……账，一笔勾销。你要不要……来接替我的位置？讨债司缺个领导。”', 'boss_tiandao', ['成为新天道（结局）', '销账，继续修仙']);
      if (c2 === 0) { await Game.die('newdao'); return; }
      G.debt = 0; Game.ach('debt0'); await UI.card('销账', '你的欠款清零了。天道在你的档案上盖了个章：“此人惹不起”。\n剩下的人生，随你。（渡劫圆满后可在南天门飞升）', 'i:bill', ['好']);
    }
    Game.refreshNpcs(); Game.save();
  },
};
// ------- 交互点 -------
const Acts = {
  async board() {
    const G = Game.G; const info = MAPINFO[R.mapId]; const b = G.bounty;
    if (b && b.map === R.mapId) {
      const done = (G.kills[b.mon] || 0) - b.k0 >= b.n;
      if (done) { const st = Math.round(30 * POW(info.tier) * b.n); G.stone += st; if (G.sect) G.contrib += 10 * b.n; G.bounty = null; Game.addExp(Game.yearExp() * 0.6, true); Sfx.play('coin'); await UI.card('悬赏完成', `获得 ${st} 灵石${G.sect ? '、宗门贡献 ' + 10 * b.n : ''}，修为提升。`, 'i:scroll', ['好']); return; }
      await UI.card('悬赏进行中', `击败 ${MONS[b.mon].n}：${(G.kills[b.mon] || 0) - b.k0}/${b.n}`, 'i:scroll', ['知道了']); return;
    }
    const mon = pick(info.mons); const n = ri(2, 4);
    const c = await UI.card('告示栏', `【悬赏】${info.n}附近${MONS[mon].n}作乱，击败 ${n} 只，赏灵石若干${G.sect ? '、宗门贡献' : ''}。\n\n（另：天道讨债司招聘外包催收员，待遇面议。）`, 'i:scroll', ['揭榜', '不了']);
    if (c === 0) { G.bounty = { map: R.mapId, mon, n, k0: G.kills[mon] || 0 }; UI.toast('已揭榜'); }
  },
  async mat(m, bonus = 1) {
    const G = Game.G;
    const long = G.realm >= 5 ? [10, 50, 100] : G.realm >= 3 ? [10, 30] : G.realm >= 2 ? [10] : [];
    const opts = [...(G.ap > 0 ? [`打坐（消耗${G.ap}行动力）`] : []), ...long.map(n => `闭关${n}年`), '算了'];
    const c0 = await UI.card('闭关打坐', `打坐：消耗剩余行动力修炼。${long.length ? '\n长期闭关：跳过多年，只获得修为（期间不会遇到事件），遇到瓶颈会提前出关。' : ''}`, 'i:sk_meditate', opts);
    const pickd = opts[c0] || '算了'; if (pickd === '算了') return;
    if (pickd.startsWith('闭关')) { Game._busy = false; await Game.seclude(+pickd.match(/\d+/)[0]); Game._busy = true; return; }
    const ap = G.ap; G.ap = 0; const P = R.player; P.anim = 'idle'; P.dir = 'S';
    for (let k = 0; k < 30; k++) setTimeout(() => { const [x, y] = t2p(P.i, P.j); part({ x: x + rnd(-50, 50), y: y + rnd(-10, 10), vx: 0, vy: -rnd(60, 160), r: rnd(3, 6), c: pick(['#bfffd0', '#fff2a0', '#9ad8ff']), life: 1.2, star: k % 2 }); }, k * 40);
    Sfx.play('magic'); await UI.fade(true, 600);
    const g = Game.addExp(Game.yearExp() * 0.35 * ap * (1 + G.medBonus) * bonus);
    await UI.fade(false, 600); await UI.card('出关', `闭关 ${ap * 3} 个月，修为 +${fmt(g)}${Game.canBreak() ? '\n\n你感觉到了瓶颈——可以尝试突破了！' : ''}`, 'i:sk_meditate', ['好']);
  },
  async jade(m) { return Acts.mat(m, 1.5); },
  async alch(m) { await UI.alchemy(m.prop.t === 'bigfurnace' ? 0.15 : 0); },
  async chest(m) {
    const G = Game.G; G.used[m.key] = 1; m.hidden = true; Sfx.play('pickup');
    const tier = MAPINFO[R.mapId].tier; const e = Game.randEq(tier + 0.2, R.mapId === 'village' ? 0 : 1); const st = Math.round(40 * POW(tier) * rnd(0.6, 1.4)); G.stone += st;
    const extra = pick(['herb', 'lz', 'yd', 'scroll', 'key', 'coin']); Game.give(extra);
    await UI.card('打开宝箱', `宝箱里有 ${st} 灵石、${ITEMS[extra].n}，还有一件装备！`, 'i:chest', ['收下'], { eq: [e] });
  },
  async herb(m) {
    const G = Game.G; if (!Game.useAP(1)) return; G.used[m.key] = 1; m.hidden = true; const t = MAPINFO[R.mapId].tier;
    const got = { herb: ri(2, 4) }; if (t >= 1 || Math.random() < 0.3) got.lz = ri(1, 2); if (t >= 3) got.peach = 1;
    for (const k in got) Game.give(k, got[k]); Sfx.play('pickup');
    UI.toast('采到：' + Object.entries(got).map(([k, v]) => ITEMS[k].n + '×' + v).join('、'), '#9aff9a');
  },
  async well(m) { const G = Game.G; G.used[m.key] = 1; m.hidden = true; const s = Game.stats(); G.hp = s.mhp; G.mp = s.mmp; Sfx.play('heal'); UI.toast('喝了一口井水，气血灵力全满！', '#9ad8ff'); if (Math.random() < 0.2) { Game.give('coin'); UI.toast('井底捞到一枚古钱'); } },
  async bell(m) { const G = Game.G; G.used[m.key] = 1; m.hidden = true; Sfx.play('gong'); R.shake = 0.3; const g = Game.addExp(Game.yearExp() * 0.15); UI.toast(`钟声悠扬，修为 +${fmt(g)}`); },
  async incense(m) { const G = Game.G; G.used[m.key] = 1; m.hidden = true; G.karma += 1; if (Math.random() < 0.3) G.st.luck++; Sfx.play('gong'); UI.toast('上了一炷香，功德+1'); },
  async dummy() { const G = Game.G; if (!Game.useAP(1)) return; Sfx.play('slash'); R.player.anim = 'attack'; R.player.at = 0; setTimeout(() => { if (R.player) R.player.anim = 'idle'; }, 500); const g = Game.addExp(Game.yearExp() * 0.3); if (Math.random() < 0.25) { G.st.con++; UI.toast('体魄+1'); } UI.toast(`练剑一季，修为 +${fmt(g)}`); },
  async portal() { await UI.panel('travel'); },
  async fish() {
    const G = Game.G; if (!Game.useAP(1)) return; Sfx.play('whoosh'); await UI.fishing();
  },
  async tea() { const G = Game.G; if (G.stone < 5) { UI.toast('茶钱都付不起……'); return; } G.stone -= 5; const hint = MAIN[G.main] ? MAIN[G.main].d : ''; await UI.card('茶馆', `小二端上一壶灵茶。邻桌在议论：\n“${pick(['听说天外天的讨债司，门口的石狮子都会算账。', '东海龙王的钱庄又涨息了！', '乱葬岗的尸王，据说是被利息逼死的。', '有人在秘境里看到了九尾狐。', '天魔殿的魔尊也在被天道催债。'])}”\n\n（主线提示：${hint}）`, 'npc_villager', ['喝茶']); if (!G.used.tea) { G.used.tea = 1; G.st.cha++; UI.toast('魅力+1'); } },
  async shop() { await UI.shop(R.mapId === 'market' ? 'merchant' : 'merchant'); },
  async pawn() { await UI.panel('bag', 'eq'); },
  async altar() { const G = Game.G; const k = 'altar_' + R.mapId; if (G.used[k]) { UI.toast('祭坛今年已经没有回应了'); return; } const c = await UI.card('祭坛', '一座古老的祭坛。献上100灵石，可能会发生些什么。', 'i:flag', ['献祭', '离开']); if (c !== 0) return; if (G.stone < 100) { UI.toast('灵石不够'); return; } G.stone -= 100; G.used[k] = 1; const r = Math.random(); if (r < 0.4) { G.st.luck++; UI.toast('气运+1'); } else if (r < 0.7) { const e = Game.randEq(MAPINFO[R.mapId].tier, 1); await UI.card('祭坛回应', '祭坛上浮现出一件装备！', 'i:flag', ['收下'], { eq: [e] }); } else { await Game.fight(pick(MAPINFO[R.mapId].mons), { elite: true, solo: true }); } },
  async gate() {
    const G = Game.G;
    if (G.realm === 6 && G.stage === 3 && Game.canBreak()) return Game.ascend();
    await UI.card('南天门', `门口挂着牌子：“飞升请先结清尾款。当前您的欠款：${fmt(G.debt)} 灵石。”\n\n（渡劫圆满后可在此飞升）`, 'i:sk_light', ['知道了']);
  },
  async debt() {
    const G = Game.G; if (G.debt <= 0) { await UI.card('讨债司', '您已结清全部欠款，感谢您的诚信！（锦旗已寄出）', 'boss_tiandao', ['嘿嘿']); return; }
    const opts = [`还 1000（余${fmt(G.stone)}）`, `全部还清（${fmt(G.debt)}）`, '算了'];
    const c = await UI.card('天道讨债司·还款窗口', `当前欠款：${fmt(G.debt)} 灵石（年利率3%）\n还清后飞升可得特殊结局。`, 'boss_tiandao', opts);
    if (c === 0) { const v = Math.min(1000, G.stone, G.debt); G.stone -= v; G.debt -= v; Sfx.play('coin'); UI.toast(`还款 ${v}`); }
    if (c === 1) { if (G.stone < G.debt) { UI.toast('灵石不够'); return; } G.stone -= G.debt; G.debt = 0; Game.ach('debt0'); Sfx.play('victory'); await UI.card('结清', '天道讨债司：“恭喜您成为诚信修士！”', 'boss_tiandao', ['终于']); }
  },
  async stele() { await UI.card('石碑', pick(['“此地埋葬着一位欠了天道三万年的修士。他的遗言是：利息太高了。”', '“立碑人：天道讨债司。立碑原因：催收成功。”', '“到此一游——落魄剑仙”', '“欠债还钱，天经地义；利滚利滚，天理难容。”']), 'i:scroll', ['……']); },
  async coffin(m) { const G = Game.G; G.used[m.key] = 1; m.hidden = true; await Game.fight('jiangshi', { elite: true }); },
  async rest() { const G = Game.G; const s = Game.stats(); G.hp = s.mhp; G.mp = s.mmp; Sfx.play('heal'); UI.toast('在凉亭里歇了歇，气血灵力全满'); },
  async peach(m) { const G = Game.G; if (!Game.useAP(1)) return; G.used[m.key] = 1; m.hidden = true; const n = ri(1, 3); Game.give('peach', n); Sfx.play('pickup'); UI.toast(`摘到蟠桃×${n}`, '#ffb0c0'); },
};

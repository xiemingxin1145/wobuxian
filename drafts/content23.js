'use strict';
// ======================= v2.3 内容：第十七章·雷部电费单 / 第十八章·剑仙的合同 / 终章（上）天道真身（渡劫）/ 终章（下）南天门竣工验收 =======================
// 台词与数值：docs/research_v22.md §7、§8。在 content22.js、ux23.js 之后加载。
// 回退精灵：电母=npc_leigong（换名）、龟丞相=npc_elder、过路财=npc_tongzi（素材到位后改 spr 即可）。
(function () {
  const S = (window.ASSETS && ASSETS.sprites) || {};
  const spr = (want, fb) => (S[want] ? want : fb);
  // ---- 技能（§8.3） ----
  Object.assign(SKILLS, {
    dianfeidan: { n: '电费单', mp: 18, tg: 'one', k: 0.6, el: '雷', fx: 'thunder', ic: 'bill', d: '挂“欠费”，累计 3 次一次性爆出（上限目标气血 35%）', dianfei: 1 },
    qiantiao: { n: '一万年欠条剑阵', mp: 40, tg: 'all', k: 3.0, el: '金', fx: 'light', ic: 'sk_swords', d: '十段剑阵，群体金系伤害', qiantiao: 1 },
    zhangdan: { n: '出示账单', mp: 12, tg: 'one', k: 0.5, el: '金', fx: 'deny', ic: 'bill', d: '念一条工程缺陷，目标易伤', zhangdan: 1 },
    suanzhu: { n: '算珠落', mp: 0, tg: 'all', k: 0.6, el: '金', fx: 'coin', ic: 'abacus', d: '算盘每回合落珠' },
  });
  // ---- 敌人（§8.2） ----
  Object.assign(MONS, {
    dianmu: { n: '电母·闪闪', spr: spr('npc_dianmu', 'npc_leigong'), el: '雷', hp: 4.5, atk: 1.45, def: 1.1, spd: 1.35, sk: ['atk', 'dianfeidan', 'thunder'], boss: 1, drop: ['pjd', 'ledger'] },
    leigong2: { n: '雷公（近视）', spr: 'npc_leigong', el: '雷', hp: 4.5, atk: 1.6, def: 1.25, spd: 1.0, sk: ['atk', 'thunderall', 'thunder'], boss: 1, drop: ['pjd'] },
    mentor_true: { n: '剑仙·李欠欠（本相）', spr: 'npc_mentor', el: '金', hp: 6, atk: 1.7, def: 1.2, spd: 1.4, sk: ['atk', 'swordqi', 'qiantiao'], boss: 1, drop: ['xsd'] },
    tiandao3: { n: '天道·完全体（三界总账）', spr: 'boss_tiandao2', el: '金', hp: 12, atk: 1.8, def: 1.5, spd: 1.15, sk: ['atk', 'audit', 'lgl', 'zhangdan'], boss: 1, phase3: 1, drop: [] },
    suanpan_b: { n: '三界总算盘', spr: 'boss_tiandao2', el: '金', hp: 3, atk: 1.0, def: 0.8, spd: 0.5, sk: ['suanzhu'], drop: [] },
  });
  // ---- 战斗机制：劈错了 / 电费单 / 剑阵 / 账单 / 天道三阶段 ----
  const BILLS = ['“第一项：灵气管道漏气三千处，责任方——甲方没付钱买好管子。”', '“第二项：东海水位超标，龙宫申请过三次排水，未批。”', '“第三项：凡人修仙门槛过高，投诉一亿零七条。”', '“第四项：月亮反光不足，广寒宫用电超标。”'];
  const ft = (u, txt, col, sz, dy) => { try { const [x, y] = uPos(u); floatText(x, y - (dy || 210) * R.dpr, txt, col, (sz || 24) * R.dpr, false); } catch (e) { } };
  const _hit = hitTargets;
  hitTargets = function (u, S2, targets) {
    if (u && u.mon === 'leigong2' && S2.el === '雷' && Math.random() < 0.15) {
      const dm = B.units.find(t => t.alive && t.mon === 'dianmu');
      if (dm) { ft(u, '劈错了！', '#ffe14a', 30); ft(dm, '电母：“这道电费记你工资里！”', '#d0b0ff', 20, 240); targets = [dm]; }
    }
    if (S2.qiantiao) { u._qt = (u._qt || 0) + 1; ft(u, `欠条 ×${u._qt * 10}`, '#ffd23a', 28); }
    if (S2.zhangdan) ft(u, pick(BILLS), '#ffe6b0', 18, 250);
    const hp0 = targets.map(t => t.hp);
    _hit(u, S2, targets);
    if (S2.dianfei) for (const t of targets) if (t.alive) {
      t._df = (t._df || 0) + 1; t._dfAcc = (t._dfAcc || 0) + Math.max(0, hp0[targets.indexOf(t)] - t.hp);
      if (t._df >= 3) { const d = Math.min(Math.round(t.mhp * 0.35), Math.round(t._dfAcc * 0.5 + t.mhp * 0.08)); t.hp = Math.max(1, t.hp - d); t._df = 0; t._dfAcc = 0; ft(t, `欠费停电！-${d}`, '#c8a0ff', 28); }
      else ft(t, `欠费 ${t._df}/3`, '#c8a0ff', 20, 180);
    }
    for (const t of B.units) {
      if (!t.alive || !t.mon) continue;
      if (t.mon === 'leigong2' && !t._myo && t.hp < t.mhp * 0.3) { t._myo = 1; ft(t, '“等等，我近视，你站过来点我好劈。”', '#ffe6b0', 18, 240); }
      if (t.mon === 'mentor_true') {
        if (!t._h50 && t.hp < t.mhp * 0.5) { t._h50 = 1; ft(t, '“徒儿，你这招……是我当年没教完的那招？”', '#ffe6b0', 18, 240); }
        if (!t._h20 && t.hp < t.mhp * 0.2) { t._h20 = 1; ft(t, '“够了够了，再打酒都醒了。”', '#ffe6b0', 18, 240); }
      }
      if (t.mon === 'tiandao3') {
        if (!t._p2 && t.hp < t.mhp * 0.66) { t._p2 = 1; t.def *= 0.85; ft(t, '砍价环节！', '#ff9a3a', 34, 240); ft(t, '（天道防御 -15%）', '#ffd0a0', 20, 200); }
        if (!t._p3 && t.hp < t.mhp * 0.33) { t._p3 = 1; t.def *= 0.5; R.shake = 1; ft(t, '清  零', '#ffffff', 48, 250); ft(t, '剑仙：“徒儿，现在！”', '#ffe6b0', 22, 190); }
      }
    }
  };
  // 剧情战不惩罚（noPenalty）：输了把灵石/行动力还回去
  const _fight = Game.fight.bind(Game);
  Game.fight = async function (mon, opts = {}) {
    const G = this.G; const keep = opts.noPenalty && G ? { stone: G.stone, ap: G.ap } : null;
    const r = await _fight(mon, opts);
    if (keep && r && r.res !== 'win') { G.stone = keep.stone; G.ap = keep.ap; UI.toast('剧情战：不扣灵石和行动力，随时再来'); UI.hud(); }
    return r;
  };
  // 剑仙队友（§8.4）
  const _cu = Game.compUnit.bind(Game);
  Game.compUnit = function () {
    const G = this.G; if (G && G.follower === 'mentor' && G.flags.mentor_ally) {
      const P = POW(G.realm + G.stage * 0.25);
      return { name: '剑仙·李欠欠', spr: 'npc_mentor', el: '金', mhp: Math.round(80 * P * 4), mmp: Math.round(50 * P * 2), atk: 15 * P * 1.5, def: 8 * P * 1.1, spd: 10 * 1.4 + G.realm * 2, crit: 0.12, skills: ['atk', 'swordqi', 'qiantiao'] };
    }
    return _cu();
  };
  // ---- 新角色 ----
  Object.assign(NPCS, {
    dianmu: { n: '电母·闪闪', spr: spr('npc_dianmu', 'npc_leigong'), map: 'cuizhai', at: [16, 8], por: spr('npc_dianmu', 'npc_leigong'), minRealm: 6 },
    guichengxiang: { n: '龟丞相', spr: spr('npc_guichengxiang', 'npc_elder'), map: 'longgong', at: [13, 9], por: spr('npc_guichengxiang', 'npc_elder'), minRealm: 4 },
    guolucai: { n: '收费员·过路财', spr: spr('npc_guolucai', 'npc_tongzi'), map: 'heaven', at: [11, 6], por: spr('npc_guolucai', 'npc_tongzi'), minRealm: 6 },
  });
  Object.assign(CHAT, {
    dianmu: ['“电费按峰谷计价，渡劫请尽量挑半夜。”', '“雷公又劈错了？记他账上。”', '“我们雷部三千年没涨工资，只涨了电压。”'],
    guichengxiang: ['“老朽在龙宫管账八百年，一个子儿都没对上过。”', '“太子殿下？他在后院练习不继承家业。”', '“旧账？旧账都在我壳里，翻起来腰疼。”'],
    guolucai: ['“此门是我开，此路是我栽，要想过此门——请出示无欠款证明。”', '“不收现金，只收功德。功德也不够？那就排队。”', '“上一个闯门的，现在还在门口扫地。”'],
  });
  const _chatMentor = CHAT.mentor;
  const MENTOR3 = ['“合同的事……等打完这一架，我请你喝酒。”', '“那时候我年轻，不看合同的。”', '“你填担保人的那天，我其实偷偷哭了一下。就一下。”'];
  Object.defineProperty(CHAT, 'mentor', { configurable: true, enumerable: true, get() { const G = Game.G; return G && G.flags && G.flags.mentor_ally ? MENTOR3 : _chatMentor; }, set(v) { } });
  Object.assign(ITEMS, { hetong_doc: Object.assign({}, ITEMS.ledger || {}, { n: '外包合同', d: '甲方：李欠欠。乙方：雷部。丙方（担保人）：一个生辰八字很眼熟的人。', quest: 1 }) });
  // ---- 证物任务 ----
  Object.assign(QUESTS, {
    q_ev1: { n: '龙宫旧账', giver: 'guichengxiang', d: '龟丞相说旧账在他壳里。帮他翻身——字面意思：打败龙宫里的 6 只虾兵，让他有空翻身。', need: { k: { xiabing: 6 } }, rw: { exp: 120000 }, minRealm: 6 },
    q_ev2: { n: '当铺里的副本', giver: 'sanniang', d: '阴三娘：“合同副本押在我这儿一万年了，利息你得付——拿 3 页账本残页来抵。”', need: { i: { ledger: 3 } }, rw: { exp: 120000 }, minRealm: 6 },
    q_ev3: { n: '散人的口供', giver: 'xiaoyao', d: '逍遥散人说他只在下棋时说真话。陪他下一盘——去鬼市找他。', need: { f: 'visit_guishi' }, rw: { exp: 120000 }, minRealm: 6 },
  });
  const EV_LINE = {
    q_ev1: ['guichengxiang', '“这页旧账写着：‘甲方李某，借龙宫三千颗夜明珠给世界装路灯，未还。’路灯到现在还是黑的。”'],
    q_ev2: ['sanniang', '“副本拿好。当年他押合同的时候说‘过几天就来赎’——鬼市的‘几天’，原来是一万年。”'],
    q_ev3: ['xiaoyao', '“我当年拒绝做担保人。他就说‘那我随便填一个吧’。我问填谁，他说‘一个还没出生的倒霉孩子’。……你几岁来着？”'],
  };
  Object.assign(ENDINGS, {
    ys_paid: ['工程验收通过', '天道修好了漏气三千处的灵气管道，从此凡人种白菜也能顺便筑基。剑仙用一万年打工抵尾款，在南天门当收费员，和过路财轮班。你偶尔路过，他从不收你钱。'],
    ys_newdao: ['新天道', '你成了三界的新总承包方。第一条规定：禁止利滚利。第二条规定：合同必须看完再签。剑仙说第二条是针对他的。'],
    ys_auditor: ['三界审计', '算无遗当上了三界审计，每年对一次总账，从没对平过，但大家都很开心。你和剑仙去龙宫民宿当了股东，敖小白负责前台。'],
    jiaxiang: ['回家', '南天门的栏杆抬了起来，可你没有进去。剑仙拍拍你的肩：“走，回桃花村喝酒。”\n娘做了一桌菜，王大爷的桃又被偷了。天道的账，就让它挂着吧。'],
  });
  if (typeof CG_END !== 'undefined') Object.assign(CG_END, { ys_paid: 'cg_tiandao', ys_newdao: 'cg_tiandao', ys_auditor: 'cg_zhenshen', jiaxiang: 'cg_mentor' });
  Object.assign(ACHS, {
    dianfei_win: ['峰谷平', '击败雷公与电母'], hetong_win: ['出师', '击败剑仙·李欠欠本相'],
    yanshou_win: ['竣工验收', '击败天道·完全体'], jiaxiang_end: ['不仙', '达成隐藏结局·回家'],
  });
  // ---- 章节 ----
  const ins = (afterId, ch) => MAIN.splice(MI(afterId) + 1, 0, ch);
  ins('tiandao', { id: 'dianfei', n: '第十七章·雷部电费单', d: '渡劫之后，一张雷劫电费账单落在你肩上。去天庭催债司找雷公问个明白。', map: 'cuizhai', realm: 6 });
  ins('dianfei', { id: 'hetong', n: '第十八章·剑仙的合同', d: '天劫外包合同的甲方签名是“李欠欠”，旁边画着酒葫芦。回桃花村找师父。', map: 'village', realm: 6 });
  const zs = MAIN[MI('zhenshen')]; zs.n = '终章（上）·天道真身'; zs.realm = 6; zs.d = '渡劫圆满后，前往催债司地下，找天道真身对账。';
  ins('zhenshen', { id: 'yanshou', n: '终章（下）·南天门竣工验收', d: '飞升，前往南天门，参加三界债权人会议，完成竣工验收。', map: 'heaven', realm: 6 });
  { const NUM = '零一二三四五六七八九十'; const cn = n => n <= 10 ? NUM[n] : n < 20 ? '十' + NUM[n - 10] : NUM[n / 10 | 0] + '十' + (n % 10 ? NUM[n % 10] : '');
    MAIN.forEach((m, i) => { if (/^第.+章·/.test(m.n)) m.n = m.n.replace(/^第.+?章/, '第' + cn(i) + '章'); }); }
  // ---- 剧情 ----
  const say = (id, text, opts) => UI.say(NPCS[id].por, NPCS[id].n, text, opts);
  const evN = G => ['q_ev1', 'q_ev2', 'q_ev3'].filter(q => G.qdone[q]).length;
  const _mt = Talk.mainTalk;
  Talk.mainTalk = function (id, check) {
    const G = Game.G; const M = G && G.main;
    if (G && M === MI('dianfei') && G.realm >= 6) {
      if (id === 'leigong' && !G.flags.dianfei_1) return ['★ 这电费是怎么回事', async () => {
        await say('leigong', '“电费？我只管劈，不管算！账都是电母算的，你去问她。”', ['她在哪']);
        await say('leigong', '“催债司东厢，门口挂着‘峰谷分时’牌子那间。别踩地上的电线，那是她的头发。”', ['……好']);
        G.flags.dianfei_1 = 1; Game.refreshNpcs(); Game.save();
      }];
      if (id === 'dianmu' && G.flags.dianfei_1) return ['★ 我要申诉电费', async () => {
        const c = await say('dianmu', '“申诉？可以。请先缴纳申诉电费 500 灵石。”', ['凭什么！', '交（-500 灵石）']);
        if (c === 1 && G.stone >= 500) { G.stone -= 500; G.aff.dianmu = (G.aff.dianmu || 0) + 5; }
        await say('dianmu', '“凭合同。天劫三千年前就外包给我们雷部了，天道一分电费没付过。没人付，只好让挨劈的人付——谁用电谁付钱，很合理吧？”', ['一点也不合理']);
        await say('dianmu', '“那就用雷部的老规矩：打赢我们俩，账单作废。”', ['来！']);
        const c2 = await UI.say(NPCS.dianmu.por, '雷部·电母闪闪', '“雷公，开灯！”\n雷公：“开哪盏？”\n“劈他！”', ['“我是来销账的！”', '先撤']); if (c2 !== 0) return;
        const r = await Game.fight('dianmu', { tier: 6.2, boss: true, adds: ['leigong2'], solo: true, noflee: true, noPenalty: true });
        if (r.res !== 'win') return;
        const bill = (G.tribTotal || 9) * 1000; G.debt = Math.max(0, G.debt - bill);
        Game.give('pjd', 2); Game.give('xyf', 1); Game.give('hetong_doc', 1); G.stone += 3000; Game.ach('dianfei_win'); G.flags.dianfei_done = 1;
        await UI.card('外包合同', '电母擦掉脸上的焦黑，从袖子里抽出一份发黄的合同：“《天劫外包服务合同》。甲方签名你自己看吧。”\n甲方签名栏：李欠欠。字迹东倒西歪，旁边还画了个酒葫芦。\n你觉得这个酒葫芦……有点眼熟。\n\n（电费账单作废，额外获得 3000 灵石）\n下一步：回桃花村，找那个喝酒的老头。', 'i:bill', ['继续']);
        G.main = MI('hetong'); Game.checkMain && Game.checkMain(); Game.refreshNpcs(); Game.save();
      }];
    }
    if (G && M === MI('hetong') && G.realm >= 6) {
      if (id === 'mentor' && !G.flags.hetong_1) return ['★ 李欠欠是谁', async () => {
        await say('mentor', '“嗝——好酒……（看见合同，酒葫芦掉在地上）”', ['师父？']);
        await say('mentor', '“这、这字不是我写的。我写字比这好看。……好吧，那天喝多了。”', ['你说清楚']);
        await say('mentor', '“徒儿，有些事得有证据才说得清。你去把三样东西找来，我就全告诉你：龙宫龟丞相的旧账、鬼市三娘手里的副本、逍遥散人的口供。”', ['好']);
        G.flags.hetong_1 = 1; for (const q of ['q_ev1', 'q_ev2', 'q_ev3']) if (!G.quests[q] && !G.qdone[q]) Game.acceptQuest(q);
        Game.refreshNpcs(); Game.save();
      }];
      if (id === 'mentor' && G.flags.hetong_1 && evN(G) < 3) return check ? null : ['证物的事', () => say('mentor', `“还差${3 - evN(G)}样，徒儿，别急，我又跑不了——好吧我以前跑过。”`, ['……'])];
      if (id === 'mentor' && evN(G) >= 3) return ['★ 师父，拔剑吧', async () => {
        await say('mentor', '“好。我说。这个世界，是我订的。”', ['订的？']);
        await say('mentor', '“一万年前，我找天道包工建一个世界，有山有水有灵气。首付付了，尾款……没付。”', ['然后呢']);
        await say('mentor', '“担保人那一栏要写生辰八字，我手边没人，就随手写了一个。后来那个八字真的出生了，就是你。”', ['所以天道一直追着我讨债？']);
        const c = await say('mentor', '“嗯。我躲在桥洞下喝酒，就是不敢见你。后来忍不住，还是去收了你当徒弟……想着至少教你打得过讨债的。”', ['师父，拔剑吧', '（先不说话）']);
        if (c === 1) await say('mentor', '“……你不说话比打我还疼。来吧，拔剑。”', ['……']);
        G.aff.mentor = (G.aff.mentor || 0) + (c === 0 ? 10 : -10);
        const c2 = await UI.say('npc_mentor', '剑仙·李欠欠本相', '“这一万年的欠条，每一张都是一把剑。接得住，你就出师了。”', ['“我接！”', '先撤']); if (c2 !== 0) return;
        const r = await Game.fight('mentor_true', { tier: 6.4, boss: true, solo: true, noflee: true, noPenalty: true }); if (r.res !== 'win') return;
        G.flags.mentor_ally = 1; G.aff.mentor = (G.aff.mentor || 0) + 30; Game.ach('hetong_win'); Game.give('xyf', 2); Game.give('xsd', 1);
        if (G.titles && !G.titles.includes('李欠欠的担保人')) G.titles.push('李欠欠的担保人');
        if (!G.follower) G.follower = 'mentor';
        await UI.card('出师', '剑仙收剑，坐在桃树下，把酒葫芦递给你。\n“好，这一剑，我还你。剩下的，我们一起去跟天道算。”\n\n合同第 999 条在风里翻了过来：「乙方保证世界有山有水有灵气，灵气不足部分以‘心诚则灵’补足。」\n剑仙：“你看，我那时候年轻，不看合同的。”\n\n【落魄剑仙 加入同行】\n下一步：渡劫圆满后前往天庭催债司地下，找天道真身对账。', 'npc_mentor', ['继续']);
        G.main = MI('zhenshen'); Game.checkMain && Game.checkMain(); Game.refreshNpcs(); Game.save();
      }];
    }
    if (G && M === MI('yanshou') && G.realm >= 7 && id === 'guolucai') return ['★ 竣工验收', () => yanshou()];
    return _mt.call(this, id, check);
  };
  // 证物：只在第十八章接到；交付时说出证词
  const _qa = Game.questAvail.bind(Game);
  Game.questAvail = function (q) { if (EV_LINE[q] && !(this.G.flags.hetong_1)) return false; return _qa(q); };
  const _fq = Game.finishQuest.bind(Game);
  Game.finishQuest = async function (q) { const r = await _fq(q); if (EV_LINE[q]) { await say(EV_LINE[q][0], EV_LINE[q][1], ['收下证物']); const n = evN(this.G); UI.toast(n >= 3 ? '三份证物齐了，回桃花村找师父' : `证物 ${n}/3`); this.refreshNpcs(); } return r; };
  // 天道分身之后改去第十七章；天道真身战败后不出结局，改去终章（下）
  const _boss = Talk.boss;
  Talk.boss = async function (id) {
    const G = Game.G;
    if (id === 'tiandao2' && G && MAIN[G.main] && MAIN[G.main].id === 'zhenshen') {
      if (G.realm < 6) { await UI.say('boss_tiandao2', MONS.tiandao2.n, '“你还太弱了。（需要渡劫期——主线已延长，详见更新公告）”', ['撤']); return; }
      const c = await UI.say('boss_tiandao2', '天道真身·总账房', '“我不是神。我是三界最大的债主，也是最大的欠债人。你要对账？那就看看谁的账更硬。”', ['“今天，连本带利！”', '先撤']); if (c !== 0) return;
      const r = await Game.fight('tiandao2', { tier: 6.75, boss: true, adds: G.flags.suanpan_ally ? ['tianbing', 'collector'] : ['tianbing', 'zhuiming'], solo: true }); if (r.res !== 'win') return;
      G.bosses.tiandao2 = 1; G.flags.boss_tiandao2 = 1; Game.ach('zhenshen_win'); Game.give('xyf', 2);
      await UI.card('原来甲方在这儿', '总账房的算盘一颗颗崩落。天道真身捡起一颗算珠，看了你身后的剑仙一眼。\n“原来甲方在这儿。”\n“账，我认一半——灵气管道确实偷工减料了。另一半，甲方得到南天门当面签字。”\n“飞升吧。我在门口等你们。”\n天道真身走之前，掏出一张发票：“这一战的场地费……算了。”\n\n下一步：渡劫圆满后飞升，前往南天门竣工验收。', 'boss_tiandao2', ['继续']);
      G.main = MI('yanshou'); Game.checkMain && Game.checkMain(); Game.refreshNpcs(); Game.save(); return;
    }
    const before = G && MAIN[G.main] && MAIN[G.main].id;
    const r = await _boss.call(this, id);
    if (G && before === 'tiandao' && MAIN[G.main] && MAIN[G.main].id === 'zhenshen' && !G.flags.dianfei_done) {
      G.main = MI('dianfei'); Game.save();
      await UI.card('主线推进', '还没等你喘口气，一只纸鹤落在你肩上，展开是一张账单：\n「尊敬的渡劫客户：渡劫所耗天雷，按峰时电价计费。逾期将以雷击方式催缴。」\n落款：天庭雷部·计费科。\n\n下一步：渡劫后前往天庭催债司，找雷公问个明白。', 'npc_leigong', ['继续']);
      Game.refreshNpcs();
    }
    return r;
  };
  // 渡劫：记录雷劫道数（电费按道计）
  const _trib = Game.tribulation.bind(Game);
  Game.tribulation = async function (n, r, asc) { const ok = await _trib(n, r, asc); if (ok && Game.G) Game.G.tribTotal = (Game.G.tribTotal || 0) + n; return ok; };
  // 飞升：主线在终章（下）时，不直接结局，而是去南天门
  const _asc = Game.ascend.bind(Game);
  Game.ascend = async function () {
    const G = this.G; if (!G || !MAIN[G.main] || MAIN[G.main].id !== 'yanshou') return _asc();
    const c = await UI.card('飞升', '你已渡劫圆满，头顶的天空裂开一道金色门户。\n12 道飞升雷劫在等着你——门后面，是南天门。', 'i:sk_light', ['飞升', '再等等']); if (c !== 0) return;
    const alive = await this.tribulation(12, 6, true); if (!alive) return;
    G.realm = 7; G.stage = 0; this.levelFx('飞升成功！'); this.save();
    if (R.mapId !== 'heaven' && MAPINFO.heaven) await Game.travel('heaven', true);
    await yanshou();
  };
  async function yanshou() {
    const G = Game.G;
    await UI.card('南天门', '南天门到了。门口有一根栏杆，栏杆旁有一个收费亭。', 'npc_guolucai' in NPCS ? NPCS.guolucai.por : null, ['走过去']);
    await say('guolucai', '“站住。飞升通道，单程收费。请出示无欠款证明。”', ['我是来销账的']);
    await say('guolucai', '“销账？那你得等债权人会议开完。会议室在里面——哦，他们已经全到了。”', ['……']);
    const sayAs = (por, n, t) => UI.say(por, n, t, ['……']);
    await sayAs('npc_caishen', '财神', '“我借了天道三万万灵石，有欠条。”');
    await sayAs('boss_mozun', '魔尊', '“天道欠我刀钱。另外——我也欠财神的。”');
    await sayAs('npc_taizi', '龙宫太子·敖小白', '“我爹借了天道夜明珠，天道又借我爹装修费。”');
    await sayAs('npc_sanniang', '阴三娘', '“在座各位都在我这儿押过东西。”');
    await sayAs(NPCS.dianmu.por, '电母', '“电费。所有人的。”');
    if (G.flags.suanpan_ally) await sayAs('npc_suanpan', '算无遗', '“我算完了。三界总债务……等于零。”');
    await UI.say(null, '', '（全场沉默）', ['“你们这是三角债！”']);
    const c = await UI.say('boss_tiandao2', '天道·完全体（三界总账）', '“零？那也得验收。工程验收不通过，账就不算清。\n我是规则。规则的最后一条是：任何账，都要有人签字。”', ['“那就打完再签！”', '先撤（找收费员过路财可再来）']);
    if (c !== 0) return;
    const r = await Game.fight('tiandao3', { tier: 6.8, boss: true, adds: ['suanpan_b'], solo: true, noflee: true, noPenalty: true });
    if (r.res !== 'win') return;
    Game.ach('yanshou_win');
    // 砍价（三题，A/B/C）
    const Q = ['这条故障算谁的：桃花村的灵气只够种白菜？', '这条故障算谁的：鬼市每晚停电？', '这条故障算谁的：飞升要交尾款？']; const cnt = [0, 0, 0];
    for (const q of Q) { const k = await UI.card('砍价', `天道递来一张故障单：\n「${q}」`, 'boss_tiandao2', ['算天道的', '算剑仙的', '各退一步']); cnt[k] = (cnt[k] || 0) + 1; UI.toast('已记录在案'); if (k === 1) await say('mentor', '“徒儿，你认真的？……行吧，我认。”', ['……']); }
    G.flags.bargain = cnt.join(',');
    await UI.card('签字', '天道递出验收单。剑仙签字，手一抖写成了「李欠欠欠」。\n天道：“多了一个欠。”\n剑仙：“利息。”', 'npc_mentor', ['继续']);
    let end;
    if (G.debt <= 0 && (G.aff.mentor || 0) >= 100) { end = 'jiaxiang'; Game.ach('jiaxiang_end'); }
    else { const [a, b, cc] = cnt; end = a >= b && a >= cc ? 'ys_paid' : cc >= b ? 'ys_auditor' : 'ys_newdao'; }
    await Game.die(end);
  }
  // 追踪栏文案（§7.6）
  if (typeof Track !== 'undefined') {
    const _tt = Track.target.bind(Track);
    Track.target = function (q) {
      const t = _tt(q); const G = Game.G; if (q !== 'main' || !G || !t) return t; const id = MAIN[G.main] && MAIN[G.main].id;
      if (id === 'yanshou' && G.realm === 6) return Game.canBreak() ? { kind: 'break', btn: '飞升', txt: '飞升，去南天门' } : { kind: 'realm', btn: '修炼', txt: '渡劫圆满后飞升' };
      if (id === 'hetong' && G.flags.hetong_1 && evN(G) < 3) { const q = ['q_ev1', 'q_ev2', 'q_ev3'].find(x => G.quests[x] && !G.qdone[x]); const tq = q && _tt(q); if (tq) { tq.txt = `证物（已集 ${evN(G)}/3）：` + tq.txt; return tq; } }
      if (t.kind !== 'npc') return t;
      const TX = { dianfei: { leigong: '去催债司问雷公电费的事', dianmu: '去东厢找电母申诉' }, hetong: { mentor: G.flags.hetong_1 ? (evN(G) >= 3 ? '与师父一战' : `证物（已集 ${evN(G)}/3）`) : '回桃花村找师父' }, yanshou: { guolucai: '南天门竣工验收' } };
      const s = TX[id] && TX[id][t.id]; if (s) t.txt = s; return t;
    };
  }
})();

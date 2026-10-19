'use strict';
// v2.5 阶段 3：债务奇遇链（已接入正式 UI 和存档）
// 第 1 步「债主之家」：选择 → 修改真实债务额度与 NPC 好感。
// 第 2 步「讨债追兵」：第 1 步选了「反杀」后，下次触发改为追兵上门（欠债的后果）。
// 只在开发者入口（试炼场按钮 → 取消）触发；自动任务/挂机不会调用这里。

// UI 在 ui.js 里是顶层 `const UI`（不挂 window），旧版用 `window.UI` 判断 → 真页面永远返回 no game or UI
const stage3UI = () => (typeof UI !== 'undefined' && UI ? UI : null);

const Stage3 = {
  npcId: 'debtor_family', // 临时标识，可后续换成真实 NPC
  AFF_MAX: 150,           // 与 game.js aff 效果的上限一致

  flags(G) { if (!G.flags || typeof G.flags !== 'object') G.flags = {}; return G.flags; },

  addAff(G, n) {
    if (!G.aff || typeof G.aff !== 'object') G.aff = {};
    const v = (G.aff[this.npcId] || 0) + (n || 0);
    G.aff[this.npcId] = Math.max(0, Math.min(this.AFF_MAX, v));
  },

  // 旧版这里把 flag 写成了无条件执行，留下 flags.undefined；读档时顺手清掉
  migrate(G) { const F = this.flags(G); if ('undefined' in F) delete F.undefined; },

  // 第 1 步：债主之家
  choicesFor(debt) {
    const attitude = debt > 5000 ? 'hostile' : debt > 1000 ? 'neutral' : 'friendly';
    const choices = {
      hostile: [
        { t: '赖账', debtMul: 1.2, aff: -30 },
        { t: '部分偿还', debtMul: 0.7, aff: +10 },
        { t: '反杀', debtMul: 0, aff: -50, flag: 'bounty' },
      ],
      neutral: [
        { t: '好言相劝', debtMul: 1, aff: +5 },
        { t: '偿还一半', debtMul: 0.5, aff: +20 },
      ],
      friendly: [
        { t: '帮他还债', debtMul: 0.9, aff: +15, nextLife: true },
      ],
    };
    return { attitude, opts: choices[attitude] };
  },

  applyStep1(G, chosen) {
    const F = this.flags(G);
    const debt = G.debt || 0;
    const mul = typeof chosen.debtMul === 'number' ? chosen.debtMul : 1; // 旧版 `|| 1` 把「反杀」的 0 当成 1，债务没变
    const newDebt = Math.max(0, Math.round(debt * mul));
    G.debt = newDebt;
    this.addAff(G, chosen.aff);
    if (chosen.flag) { F[chosen.flag] = 1; F.stage3_bountyDebt = debt; } // 记下被“反杀”掉的账，追兵按它来讨
    if (chosen.nextLife) F.stage3_nextlife = 1;
    return { debtBefore: debt, debtAfter: newDebt };
  },

  // 第 2 步：讨债追兵（只有 flags.bounty 时出现）
  chaseChoices(G) {
    const owed = (G.flags && G.flags.stage3_bountyDebt) || 0;
    const fee = Math.max(100, Math.round(owed * 0.1));
    return [
      { t: `破财消灾（-${fee} 灵石）`, key: 'pay', fee },
      { t: '认账立字据（欠款恢复一半）', key: 'sign', debtAdd: Math.round(owed * 0.5), aff: +20 },
      { t: '连夜跑路（利滚利 +10%）', key: 'run' },
    ];
  },

  applyChase(G, c) {
    const F = this.flags(G);
    const debt = G.debt || 0, stone = G.stone || 0;
    let note = '';
    if (c.key === 'pay') {
      if (stone >= c.fee) { G.stone = stone - c.fee; note = `付了 ${c.fee} 灵石，追兵收钱走人。`; }
      else { G.stone = 0; G.debt = debt + (c.fee - stone); note = `灵石不够，差的 ${c.fee - stone} 记进了天道账本。`; }
    } else if (c.key === 'sign') {
      G.debt = debt + c.debtAdd; this.addAff(G, c.aff); note = '你按了手印，债主家人脸色好看了些。';
    } else {
      G.debt = Math.round(Math.max(debt, 100) * 1.1); note = '跑是跑掉了，讨债司按逃逸加收一成利息。';
      return { note, cleared: false, debtBefore: debt, debtAfter: G.debt }; // 追兵还会再来
    }
    delete F.bounty; delete F.stage3_bountyDebt;
    return { note, cleared: true, debtBefore: debt, debtAfter: G.debt };
  },

  async runChase(G) {
    const opts = this.chaseChoices(G);
    const idx = await UI.card('讨债追兵', `讨债司的追兵堵住了去路：\n“上回把债主打跑了？账可没跑。”\n当前债务：${G.debt || 0}　灵石：${G.stone || 0}`, 'i:bill', opts.map(o => o.t));
    if (idx < 0 || idx >= opts.length) return { ok: false, msg: 'cancelled' };
    const r = this.applyChase(G, opts[idx]);
    if (typeof Game !== 'undefined' && typeof Game.save === 'function') Game.save();
    await UI.card('奇遇结果', `${r.note}\n债务：${r.debtBefore} → ${r.debtAfter}${r.cleared ? '' : '\n（追兵还会再来）'}`, 'i:scroll', ['好']);
    if (UI.hud) UI.hud();
    return { ok: true, step: 'chase', choice: opts[idx].key, ...r };
  },

  async runDebtEncounter(G) {
    if (!G || !stage3UI()) return { ok: false, msg: 'no game or UI' };
    this.migrate(G);
    if (G.flags.bounty) return this.runChase(G); // 链式第 2 步

    const debt = G.debt || 0;
    const { attitude, opts } = this.choicesFor(debt);
    const attitudeName = { hostile: '敌意', neutral: '中立', friendly: '友善' }[attitude];
    const idx = await UI.card('债主之家', `你遇到了债主的家人。\n当前债务：${debt}\n对方态度：${attitudeName}`, 'i:bill', opts.map(o => o.t));
    if (idx < 0 || idx >= opts.length) return { ok: false, msg: 'cancelled' };

    const chosen = opts[idx];
    const r = this.applyStep1(G, chosen);
    if (typeof Game !== 'undefined' && typeof Game.save === 'function') Game.save();

    const resultTxt = `你选择了「${chosen.t}」\n债务：${r.debtBefore} → ${r.debtAfter}\n好感变化：${chosen.aff > 0 ? '+' : ''}${chosen.aff}${chosen.flag === 'bounty' ? '\n讨债司记下了你的名字……' : ''}`;
    await UI.card('奇遇结果', resultTxt, 'i:scroll', ['好']);
    if (UI.hud) UI.hud();
    return { ok: true, step: 'family', attitude, debtBefore: r.debtBefore, debtAfter: r.debtAfter, choice: chosen.t, affDelta: chosen.aff };
  },

  // ======== 阶段 3 小闭环 #2：钱多多的赊账单（奇遇选择 → NPC 态度变化 → 债务后果） ========
  // 复用正式存档：真实 NPC `merchant`（奸商·钱多多，data.js NPCS）的 G.aff.merchant、G.debt、G.flags。
  // 态度阈值与 talk.js greet() 一致：≥60 亲近 / ≥20 一般 / <20 记仇。闲聊、送礼等正式玩法改的好感也会影响第 2 步。
  // 第 1 步「赊账单」：选择改好感/债务，记 flags.s3m_step=1；第 2 步「钱多多回访」按当时态度结算债务后果，记 flags.s3m_done=1。
  // 记仇 → 钱多多把你卖给讨债司：债务 +10% 且挂上 flags.bounty → 下次「债主之家」入口直接变「讨债追兵」（接上第 1 条链）。
  // 只由开发者入口「奇遇链」按钮触发；自动任务/挂机不会调用这里。
  M_NPC: 'merchant',
  merchantAttitude(G) {
    const a = (G.aff && G.aff[this.M_NPC]) || 0;
    return a >= 60 ? 'close' : a >= 20 ? 'neutral' : 'grudge';
  },
  M_ATT_NAME: { close: '亲近', neutral: '一般', grudge: '记仇' },
  merchantChoices() {
    return [
      { t: '替他扛下这笔税（天道欠款 +300）', key: 'cover', debt: +300, aff: +60 },
      { t: '向讨债司举报他偷税（欠款 -200）', key: 'report', debt: -200, aff: -40 },
      { t: '不掺和', key: 'ignore', debt: 0, aff: -5 },
    ];
  },
  addAffTo(G, id, n) {
    if (!G.aff || typeof G.aff !== 'object') G.aff = {};
    G.aff[id] = Math.max(0, Math.min(this.AFF_MAX, (G.aff[id] || 0) + (n || 0)));
  },
  applyMerchant1(G, c) {
    const F = this.flags(G);
    const before = G.debt || 0, affBefore = (G.aff && G.aff[this.M_NPC]) || 0;
    G.debt = Math.max(0, before + c.debt);
    this.addAffTo(G, this.M_NPC, c.aff);
    F.s3m_step = 1; F.s3m_choice = c.key;
    return { debtBefore: before, debtAfter: G.debt, affBefore, affAfter: G.aff[this.M_NPC], attitude: this.merchantAttitude(G) };
  },
  // 第 2 步：按当时态度结算
  applyMerchant2(G) {
    const F = this.flags(G);
    const att = this.merchantAttitude(G);
    const before = G.debt || 0;
    let note;
    if (att === 'close') {
      const pay = Math.min(before, 500);
      G.debt = before - pay;
      note = pay > 0 ? `钱多多：“上回多亏你！”他偷偷替你还了 ${pay} 灵石。` : '钱多多：“你居然不欠钱？那请你喝酒！”';
    } else if (att === 'neutral') {
      note = '钱多多打了个哈哈：“生意人，不记账。”什么也没发生。';
    } else {
      const add = Math.round(Math.max(before, 100) * 0.1);
      G.debt = before + add;
      F.bounty = 1; F.stage3_bountyDebt = Math.max(F.stage3_bountyDebt || 0, G.debt);
      note = `钱多多把你的行踪卖给了讨债司，欠款 +${add}。\n讨债司的追兵已经上路……`;
    }
    delete F.s3m_step; F.s3m_done = 1;
    return { attitude: att, debtBefore: before, debtAfter: G.debt, note, bounty: !!F.bounty };
  },
  async runMerchantChain(G) {
    const ui = stage3UI();
    if (!G || !ui) return { ok: false, msg: 'no game or UI' };
    this.migrate(G);
    const F = this.flags(G);
    const save = () => { if (typeof Game !== 'undefined' && Game && typeof Game.save === 'function') Game.save(); };
    if (F.s3m_step === 1) {
      const att = this.merchantAttitude(G);
      const idx = await ui.card('钱多多回访', `钱多多又找上门来。\n他对你的态度：${this.M_ATT_NAME[att]}（好感 ${G.aff[this.M_NPC] || 0}）\n当前债务：${G.debt || 0}`, 'npc_merchant', ['看他想干嘛', '先躲开']);
      if (idx !== 0) return { ok: false, msg: 'cancelled' };
      const r = this.applyMerchant2(G);
      save();
      await ui.card('奇遇结果', `${r.note}\n债务：${r.debtBefore} → ${r.debtAfter}`, 'i:scroll', ['好']);
      if (ui.hud) ui.hud();
      return { ok: true, step: 'visit', ...r };
    }
    const opts = this.merchantChoices();
    const idx = await ui.card('钱多多的赊账单', `钱多多拉住你：“讨债司要查我的税！帮帮忙，回头亏待不了你。”\n当前债务：${G.debt || 0}　他对你的好感：${(G.aff && G.aff[this.M_NPC]) || 0}`, 'npc_merchant', opts.map(o => o.t));
    if (idx < 0 || idx >= opts.length) return { ok: false, msg: 'cancelled' };
    const r = this.applyMerchant1(G, opts[idx]);
    save();
    await ui.card('奇遇结果', `你选择了「${opts[idx].t}」\n债务：${r.debtBefore} → ${r.debtAfter}\n钱多多好感：${r.affBefore} → ${r.affAfter}（${this.M_ATT_NAME[r.attitude]}）\n他会记住这件事的……`, 'i:scroll', ['好']);
    if (ui.hud) ui.hud();
    return { ok: true, step: 'bill', choice: opts[idx].key, ...r };
  },

  // ======== 阶段 3 小闭环 #3：记账童子的错账（另一位真实 NPC `xianguan` 仙官·记账童子 + 天道债务） ========
  // 同一模式：第 1 步选择改 G.aff.xianguan / G.debt / G.stone（flags.s3x_step=1）；第 2 步「天道查账」按当时态度（60/20）结算。
  // 贿赂（灵石 ≥300 才出现）会记 flags.s3x_bribe：查账时童子不亲近就会露馅，抹掉的 1500 加一成罚金补回。
  // 只由开发者入口「查账链」按钮触发；自动任务/挂机不会调用这里。
  X_NPC: 'xianguan',
  BRIBE: { stone: 300, erase: 1500 },
  attitudeOf(G, id) { const a = (G.aff && G.aff[id]) || 0; return a >= 60 ? 'close' : a >= 20 ? 'neutral' : 'grudge'; },
  ledgerChoices(G) {
    const opts = [{ t: '陪他熬夜对账（不花钱，好感 +60）', key: 'help', debt: 0, stone: 0, aff: +60 }];
    if ((G.stone || 0) >= this.BRIBE.stone) opts.push({ t: `塞 ${this.BRIBE.stone} 灵石，请他“抹掉”一笔（欠款 -${this.BRIBE.erase}）`, key: 'bribe', debt: -this.BRIBE.erase, stone: -this.BRIBE.stone, aff: +20 });
    opts.push({ t: '向讨债司告发他做假账（举报奖励：欠款 -300）', key: 'report', debt: -300, stone: 0, aff: -40 });
    return opts;
  },
  applyLedger1(G, c) {
    const F = this.flags(G);
    const before = G.debt || 0, affBefore = (G.aff && G.aff[this.X_NPC]) || 0;
    const erased = Math.min(before, -c.debt);
    G.debt = Math.max(0, before + c.debt);
    G.stone = Math.max(0, (G.stone || 0) + c.stone);
    this.addAffTo(G, this.X_NPC, c.aff);
    F.s3x_step = 1; F.s3x_choice = c.key;
    if (c.key === 'bribe') F.s3x_bribe = erased; // 实际抹掉的数额，露馅时按它补回
    return { debtBefore: before, debtAfter: G.debt, affBefore, affAfter: G.aff[this.X_NPC], attitude: this.attitudeOf(G, this.X_NPC) };
  },
  applyLedger2(G) {
    const F = this.flags(G);
    const att = this.attitudeOf(G, this.X_NPC);
    const before = G.debt || 0;
    const bribe = F.s3x_bribe || 0;
    let note, exposed = false;
    if (att === 'close') {
      G.debt = Math.round(before * 0.8);
      note = `记账童子悄悄把你的复利改成了单利：欠款 ×0.8。${bribe ? '\n那笔“抹掉”的账，他也替你瞒下了。' : ''}`;
    } else if (bribe) {
      exposed = true;
      const back = Math.round(bribe * 1.1);
      G.debt = before + back;
      note = `天道查账，抹掉的那笔露馅了！补回 ${bribe} 并罚一成，共 +${back}。`;
    } else if (att === 'neutral') {
      note = '天道照常查账，账目清楚，什么也没发生。';
    } else {
      const add = Math.round(Math.max(before, 100) * 0.15);
      G.debt = before + add;
      note = `记账童子记仇，在你账上添了一笔“误工费”：欠款 +${add}。`;
    }
    delete F.s3x_step; delete F.s3x_bribe; F.s3x_done = 1;
    return { attitude: att, debtBefore: before, debtAfter: G.debt, note, exposed };
  },
  async runLedgerChain(G) {
    const ui = stage3UI();
    if (!G || !ui) return { ok: false, msg: 'no game or UI' };
    this.migrate(G);
    const F = this.flags(G);
    const save = () => { if (typeof Game !== 'undefined' && Game && typeof Game.save === 'function') Game.save(); };
    if (F.s3x_step === 1) {
      const att = this.attitudeOf(G, this.X_NPC);
      const idx = await ui.card('天道查账', `讨债司派人来查账了，记账童子跟在后面。\n他对你的态度：${this.M_ATT_NAME[att]}（好感 ${G.aff[this.X_NPC] || 0}）\n当前债务：${G.debt || 0}`, 'npc_disciple', ['配合查账', '改天再说']);
      if (idx !== 0) return { ok: false, msg: 'cancelled' };
      const r = this.applyLedger2(G);
      save();
      await ui.card('奇遇结果', `${r.note}\n债务：${r.debtBefore} → ${r.debtAfter}`, 'i:scroll', ['好']);
      if (ui.hud) ui.hud();
      return { ok: true, step: 'audit', ...r };
    }
    const opts = this.ledgerChoices(G);
    const idx = await ui.card('记账童子的错账', `仙官·记账童子抱着账本哭丧着脸：“你这页账算错了，我要被扣俸禄了……”\n当前债务：${G.debt || 0}　灵石：${G.stone || 0}　他对你的好感：${(G.aff && G.aff[this.X_NPC]) || 0}`, 'npc_disciple', opts.map(o => o.t));
    if (idx < 0 || idx >= opts.length) return { ok: false, msg: 'cancelled' };
    const r = this.applyLedger1(G, opts[idx]);
    save();
    await ui.card('奇遇结果', `你选择了「${opts[idx].t}」\n债务：${r.debtBefore} → ${r.debtAfter}\n记账童子好感：${r.affBefore} → ${r.affAfter}（${this.M_ATT_NAME[r.attitude]}）\n天道迟早会来查账……`, 'i:scroll', ['好']);
    if (ui.hud) ui.hud();
    return { ok: true, step: 'ledger', choice: opts[idx].key, ...r };
  },

  // ======== 债务系统强化 #1：债压档位 → 讨债追兵即时战（只读，不改存档） ========
  // 「欠得多了有追兵」：按当前 G.debt 分 4 档（阈值 1000 / 5000 与「债主之家」态度一致，另加 20000 天道通缉），
  // 身上挂着 flags.bounty（反杀债主 / 钱多多卖行踪）再加一档。档位决定追兵数量、血量倍率、移速。
  // 只产出敌人数据给开发者入口「追兵战」按钮喂即时战原型；本文件不直接调用即时战原型、不写 G（胜负结算见下方 settleBounty）。
  // 债务强化 #4「追兵战按档位分化敌人」：高档追兵出手更凶——atkCdMul 出手后冷却倍率（越小越快）、windMul 前摇倍率（越小预警越短）、
  //   shotCount 一次弹道发数（扇形散射）、shotSpread 相邻两发夹角（度）、spdAdd 额外移速；低两档全是中性值（= 旧行为）。
  //   trait = 顶栏/结算卡上的档位特性短名（低档为空）。数值只给开发者「追兵战」试手感，待主人试玩定。
  DEBT_TIERS: [
    { key: 'light', n: '小账', hunters: 1, hpMul: 1, atkCdMul: 1, windMul: 1, shotCount: 1, shotSpread: 0, spdAdd: 0, trait: '' },
    { key: 'owing', n: '欠款', hunters: 2, hpMul: 1.15, atkCdMul: 1, windMul: 1, shotCount: 1, shotSpread: 0, spdAdd: 0, trait: '' },
    { key: 'heavy', n: '重债', hunters: 3, hpMul: 1.3, atkCdMul: 0.75, windMul: 0.8, shotCount: 2, shotSpread: 14, spdAdd: 4, trait: '快攻双发' },
    { key: 'wanted', n: '天道通缉', hunters: 4, hpMul: 1.45, atkCdMul: 0.6, windMul: 0.7, shotCount: 3, shotSpread: 16, spdAdd: 8, trait: '疾攻三发' },
  ],
  debtPressure(G) {
    const raw = Number(G && G.debt);
    const debt = Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 0;
    const bounty = !!(G && G.flags && typeof G.flags === 'object' && G.flags.bounty);
    let tier = debt > 20000 ? 3 : debt > 5000 ? 2 : debt > 1000 ? 1 : 0;
    if (bounty) tier = Math.min(3, tier + 1);
    const T = this.DEBT_TIERS[tier];
    return { tier, key: T.key, n: T.n, debt, bounty, hunters: T.hunters, hpMul: T.hpMul,
      atkCdMul: T.atkCdMul, windMul: T.windMul, shotCount: T.shotCount, shotSpread: T.shotSpread, spdAdd: T.spdAdd, trait: T.trait,
      traitNote: this.tierTraitNote(T) };
  },
  // 档位特性说明（结算卡/提示用）：低档 = 「与普通讨债鬼相同」
  tierTraitNote(T) {
    if (!T || !T.trait) return '与普通讨债鬼相同';
    return `${T.trait}：出手冷却 ×${T.atkCdMul}、前摇 ×${T.windMul}、弹道 ${T.shotCount} 发散射（夹角 ${T.shotSpread}°）、移速 +${T.spdAdd}`;
  },
  // 追兵：讨债鬼（data.js MONS.collector 的精灵 mon_collector；方块皮肤用「讨债鬼差」）。出手冷却错开，避免同帧一起前摇
  HUNTER_SLOTS: [[300, 150], [140, 200], [460, 200], [300, 450]],
  bountyEnemies(G) {
    const P = this.debtPressure(G);
    return this.HUNTER_SLOTS.slice(0, P.hunters).map(([x, y], i) => ({
      name: i === 0 && P.tier === 3 ? '讨债鬼头子' : '讨债鬼', spr: 'mon_collector', box: 'taozhai',
      hp: Math.round(80 * P.hpMul), x, y, speed: 70 + 6 * P.tier + P.spdAdd, atkCd: 1.0 + 0.6 * i,
      // 债务强化 #4：档位行为参数（即时战原型读取；缺字段 / 中性值 = 旧行为）
      atkCdMul: P.atkCdMul, windMul: P.windMul, shotCount: P.shotCount, shotSpread: P.shotSpread, tier: P.tier,
    }));
  },

  // ======== 债务系统强化 #2：追兵战按胜负结算（只由开发者入口「追兵战」在战斗结束后调用） ========
  // out = 即时战原型返回的 { result:'win'|'lose', reason:'cleared'|'dead'|'timeout'|'closed' }，外加开战时的 tier（债压档位）。
  // 胜：追兵退走；身上挂着 flags.bounty 的撤掉通缉（连同 stage3_bountyDebt），欠款不变（打跑讨债鬼不等于还了钱）。
  // 败（被打倒 / 超时没打完）：欠款加一笔误工费 = max(100, 欠款 × 档位费率 5%/8%/10%/12%)，通缉照旧。
  // 中途关掉覆盖层（reason='closed'）或数据非法：不结算、不改存档。胜败次数记在 flags.s3b_win / s3b_lose。
  BOUNTY_FEE: [0.05, 0.08, 0.10, 0.12],
  BOUNTY_FEE_MIN: 100,
  settleBounty(G, out) {
    if (!G || typeof G !== 'object' || !out || (out.result !== 'win' && out.result !== 'lose')) return { settled: false, reason: 'invalid' };
    if (out.reason === 'closed') return { settled: false, reason: 'closed' };
    const tier = Number.isInteger(out.tier) && out.tier >= 0 && out.tier <= 3 ? out.tier : this.debtPressure(G).tier;
    const n = this.DEBT_TIERS[tier].n;
    const F = this.flags(G);
    const raw = Number(G.debt);
    const before = Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 0;
    if (out.result === 'win') {
      const hadBounty = !!F.bounty;
      delete F.bounty; delete F.stage3_bountyDebt;
      F.s3b_win = (Number(F.s3b_win) || 0) + 1;
      const note = hadBounty ? '追兵被打退，讨债司撤了你的通缉。' : '追兵被打退了，不过账还挂在天道账本上。';
      return { settled: true, result: 'win', tier, n, debtBefore: before, debtAfter: G.debt, fee: 0, bountyCleared: hadBounty, note };
    }
    const fee = Math.max(this.BOUNTY_FEE_MIN, Math.round(before * this.BOUNTY_FEE[tier]));
    G.debt = before + fee;
    F.s3b_lose = (Number(F.s3b_lose) || 0) + 1;
    const note = (out.reason === 'timeout' ? '拖太久没打完，' : '被讨债鬼按在地上，') + `讨债司记了一笔误工费 ${fee}。`;
    return { settled: true, result: 'lose', tier, n, debtBefore: before, debtAfter: G.debt, fee, bountyCleared: false, note };
  },

  // ======== 债务系统强化 #3：债压档位 → 突破难度预览（只读，只由开发者入口「突破预估」按钮调用） ========
  // 「欠得多突破更难」：先按现行突破公式（game.js Game._tryBreak，原样复刻、不调用它）算出基础成功率，
  //   基础 = REALMS[境界].brk + 悟性×1.5% + 气运×0.5% + brkBonus + 技能树 brk + tmpBrk
  //        （+ 练气持有筑基丹 30%、持有破境丹且 <95% 时 15%，与正式流程一样「持有即生效」，这里只看不吃），封顶 97%；
  // 再按债压档位（debtPressure，挂通缉 +1 档封顶）扣预估惩罚 0 / 3 / 8 / 15 个百分点，预估下限 5%。
  // 只读：不写 G、不吃丹、不清 tmpBrk、不调用 tryBreak/_tryBreak/save；正式突破成功率与流程一律不变。
  // 读不到基础成功率（没有 Game/REALMS、境界非法、悟性/气运非数字、公式抛错）→ 回退默认 60% 并在 note 标注。
  BRK_PENALTY: [0, 3, 8, 15],
  BRK_DEFAULT: 0.6,
  BRK_FLOOR: 5,
  breakBase(G, game) {
    const fb = (why) => ({ ok: false, base: this.BRK_DEFAULT, why });
    try {
      const RE = typeof REALMS !== 'undefined' && Array.isArray(REALMS) ? REALMS : null;
      if (!RE) return fb('读不到境界表 REALMS');
      if (!G || typeof G !== 'object') return fb('没有存档');
      const r = G.realm;
      if (!Number.isInteger(r) || r < 0 || r >= RE.length || !RE[r]) return fb('境界数据异常');
      if (r === 6) return { ok: true, applicable: false, realm: r, why: '渡劫圆满走飞升天劫，不按成功率' };
      if (r + 1 >= RE.length || !RE[r + 1]) return { ok: true, applicable: false, realm: r, why: '已到最高境界，没有下一境' };
      const st = G.st || {};
      const parts = [RE[r].brk, Number(st.int) * 0.015, Number(st.luck) * 0.005];
      if (!parts.every(Number.isFinite)) return fb('境界成功率或悟性/气运不是数字');
      const tree = game && typeof game.treeVal === 'function' ? Number(game.treeVal('brk')) : 0;
      let ch = parts[0] + parts[1] + parts[2] + (Number(G.brkBonus) || 0) + (Number.isFinite(tree) ? tree : 0) + (Number(G.tmpBrk) || 0);
      const inv = G.inv && typeof G.inv === 'object' ? G.inv : {};
      const pills = [];
      if (r === 1 && (inv.zjd || 0) >= 1) { ch += 0.3; pills.push('筑基丹'); }
      if (r >= 1 && (inv.pjd || 0) >= 1 && ch < 0.95) { ch += 0.15; pills.push('破境丹'); }
      ch = Math.min(0.97, ch);
      if (!Number.isFinite(ch)) return fb('公式结果不是数字');
      return { ok: true, applicable: true, realm: r, base: ch, pills, from: RE[r].n, to: RE[r + 1].n };
    } catch (e) {
      return fb('读取出错：' + (e && e.message ? e.message : e));
    }
  },
  breakthroughPreview(G, game) {
    if (game === undefined) game = typeof Game !== 'undefined' && Game ? Game : null;
    const P = this.debtPressure(G);
    const penalty = this.BRK_PENALTY[P.tier];
    const b = this.breakBase(G, game);
    const out = { tier: P.tier, tierName: P.n, debt: P.debt, bounty: P.bounty, penalty, readOnly: true };
    try { out.ready = !!(game && typeof game.canBreak === 'function' && game.G === G && game.canBreak()); } catch (e) { out.ready = false; }
    if (b.ok && !b.applicable) {
      return Object.assign(out, { applicable: false, source: 'game', base: null, estimate: null, realm: b.realm, note: b.why + '；债压暂不影响。' });
    }
    const base = Math.round(b.base * 100);
    const estimate = Math.max(this.BRK_FLOOR, base - penalty);
    const debtNote = penalty ? `欠得多，突破更难：债压「${P.n}」预计 −${penalty} 个百分点。` : `债压「${P.n}」：欠得不多，不影响突破。`;
    return Object.assign(out, {
      applicable: true, source: b.ok ? 'game' : 'fallback', base, estimate,
      realm: b.ok ? b.realm : null, from: b.from || null, to: b.to || null, pills: b.pills || [],
      note: debtNote + (b.ok ? '' : `（基础成功率读不到：${b.why}，按默认 ${base}% 估算）`) + '只读预估，正式突破暂不扣。',
    });
  },

  // 开发者测试入口
  async test(G) {
    console.log('[Stage3] running encounter...');
    const r = await this.runDebtEncounter(G);
    console.log('[Stage3] result', r);
    const u = stage3UI(); if (u && u.toast) u.toast('阶段3 奇遇已执行', '#ffe680');
    return r;
  },
};

if (typeof window !== 'undefined') window.Stage3 = Stage3;
if (typeof module !== 'undefined') module.exports = Stage3;
console.log('[Stage3] debt encounter chain loaded');

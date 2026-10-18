'use strict';
// ======================= 2.9① 宗门争霸·万仙来朝（关系矩阵 + 战争 + 宗主路径） =======================
// 设计：宗门从"个人位阶"升级为"势力格局"——宗门间关系动态演变、可宣战/议和、爆发跨宗门战争。
// 接入手法：全部通过"包裹/赋值"接入，不改 talk.js / game.js / data.js / sects25.js 本体。
//   - G.sectRel{} 惰性兜底（每对 -100~100，默认 0=中立）
//   - G.war{} 战争状态惰性兜底
//   - G.warMerit 战争功绩
//   - 包裹 Game.yearEnd（随机边境摩擦 / 关系衰减 / 征召检查）
//   - 包裹 Talk.extra（宗主可主动宣战/议和）
//   - 扩展 UI.p_sect25（关系/战争状态/和战按钮）
//   - 包裹 sects25 的 doTournament 结果影响关系（通过 Talk.extra 链后置处理）
// 加载位置：index.html 在 sects25.js 之后（外层包裹，yearEnd/Talk.extra 链最外侧）。

(function () {
  // ---- 0) 惰性兜底 ----
  function ensure(G) {
    if (!G) return G;
    if (!G.sectRel || typeof G.sectRel !== 'object') G.sectRel = {};
    if (!G.war || typeof G.war !== 'object') G.war = { active: false, target: null, wave: 0, wins: 0, losses: 0, merit: 0 };
    if (typeof G.warMerit !== 'number') G.warMerit = 0;
    if (typeof G.sectLeader === 'undefined') G.sectLeader = 0; // 0=否，1=是
    return G;
  }

  // ---- 1) 宗门关系工具 ----
  // 键名：按字典序拼 "a|b"，保证正反相同
  function relKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; }
  function getRel(G, a, b) {
    ensure(G);
    if (a === b) return 100;
    const k = relKey(a, b);
    return G.sectRel[k] !== undefined ? G.sectRel[k] : 0;
  }
  function setRel(G, a, b, v) {
    ensure(G);
    if (a === b) return;
    const k = relKey(a, b);
    G.sectRel[k] = Math.max(-100, Math.min(100, v));
  }
  function modRel(G, a, b, delta) { setRel(G, a, b, getRel(G, a, b) + delta); }
  function relLabel(v) {
    if (v >= 60) return { t: '盟友', c: '#5adf6a' };
    if (v >= 20) return { t: '友善', c: '#9aff9a' };
    if (v > -20) return { t: '中立', c: '#ccc' };
    if (v > -60) return { t: '不和', c: '#ffb060' };
    return { t: '敌对', c: '#ff5a4a' };
  }
  function allSects() { return Object.keys(SECTS); }
  function otherSects(G) { return allSects().filter(s => s !== G.sect); }

  // ---- 2) 战争状态 ----
  function warActive(G) { ensure(G); return !!(G.war && G.war.active && G.war.target); }
  function warTarget(G) { ensure(G); return G.war.target; }

  // ---- 3) 战争触发：随机边境摩擦（yearEnd 包裹）----
  // 每年结束时：
  //   - 关系自然缓慢回归中立（+1~2 向 0）
  //   - 若关系 < -40 且无战争，低概率触发边境摩擦 → 征召事件
  function checkWarTrigger(G) {
    ensure(G);
    if (!G.sect) return;
    if (G.war.active) return; // 已经在打仗
    // 关系向中立缓慢回归
    for (const other of otherSects(G)) {
      const r = getRel(G, G.sect, other);
      if (Math.abs(r) < 5) continue;
      modRel(G, G.sect, other, r > 0 ? -1 : 1); // 每年回归 1 点
    }
    // 检查是否有敌对宗门可触发战争
    const foes = otherSects(G).filter(s => getRel(G, G.sect, s) < -40);
    if (!foes.length) return;
    // 概率触发（随敌对程度提升）
    const worst = foes.map(s => getRel(G, G.sect, s)).sort()[0];
    const chance = Math.min(0.25, (Math.abs(worst) - 40) / 200); // -100→0.3, -40→0
    if (Math.random() < chance) {
      const target = pick(foes);
      triggerConscription(G, target);
    }
  }

  // ---- 4) 征召事件（玩家表态）----
  async function triggerConscription(G, target) {
    ensure(G);
    const S = SECTS[G.sect], T = SECTS[target];
    G.war.active = true; G.war.target = target; G.war.wave = 0;
    Game.log(`${S.n}与${T.n}边境摩擦升级，征召令下达！`);
    UI.banner('宗门征召令', `${S.n} ↔ ${T.n} · 边境摩擦`);
    Sfx.play('gong');

    const c = await UI.card('宗门征召令',
      `【${T.n}】修士在边境袭杀我宗弟子，夺我灵田！\n\n` +
      `掌门将此事交予你——\n` +
      `· 请战：率军出击，攻伐${T.n}山门\n` +
      `· 避战：献上贡品求和，保一时平安\n` +
      `· 劝谏：劝说掌门忍下这口气（成功率与魅力相关）`,
      'npc_elder', ['⚔ 请战出击', '🤝 献贡求和', '💬 劝谏掌门']);

    if (c === 1) {
      // 避战：赔款求和
      const cost = Math.round(500 * POW(G.realm + G.stage * 0.25));
      G.stone = Math.max(0, G.stone - cost);
      modRel(G, G.sect, target, 15); // 关系缓和
      G.war.active = false; G.war.target = null;
      await UI.card('献贡求和',
        `你携 ${fmt(cost)} 灵石前往${T.n}赔罪。\n对方收下贡品，边境暂安。\n（关系 +15，灵石 -${fmt(cost)}）`,
        'npc_elder', ['忍辱负重']);
    } else if (c === 2) {
      // 劝谏：成功率与魅力/贡献相关
      const successRate = Math.min(0.7, 0.3 + G.st.cha * 0.03 + G.contrib / 2000);
      if (Math.random() < successRate) {
        modRel(G, G.sect, target, 20);
        G.war.active = false; G.war.target = null;
        await UI.card('劝谏成功',
          `你在掌门面前陈明利害，掌门抚须良久，终是按下了出兵之念。\n（关系 +20，避免一战）`,
          'npc_elder', ['以和为贵']);
      } else {
        await UI.card('劝谏无效',
          `掌门一拍桌案："辱我宗门，岂能罢休！"\n战争已不可避免。`,
          'npc_elder', ['……只能打了']);
        // 继续走请战路线
        await doWarCampaign(G, target);
      }
    } else {
      // 请战：直接开打
      await doWarCampaign(G, target);
    }
    UI.hud(); Game.save();
  }

  // ---- 5) 宗门攻防战（多波实时战场）----
  // 敌人配置：根据目标宗门和玩家实力生成 2~3 波
  function buildWarEnemies(G, target, wave) {
    const tierBase = Math.max(1, G.realm + G.stage * 0.25);
    // 不同宗门的敌人风格
    const SECT_MONS = {
      qingyun: ['paper', 'rock', 'ghost'],   // 青云宗剑修→符剑/石卫/游魂
      baicao: ['treant', 'fox', 'fire'],     // 百草谷→药草/狐火
      tianmo: ['demon', 'fire', 'ghost'],    // 天魔殿→魔修/火灵
    };
    const pool = SECT_MONS[target] || ['demon', 'rock', 'ghost'];
    const waves = [
      { count: 2, tierMul: 0.75, elite: false },  // 第1波：前锋
      { count: 3, tierMul: 0.85, elite: true },   // 第2波：主力
      { count: 1, tierMul: 1.1, elite: true, general: true }, // 第3波：敌方将领
    ];
    const w = waves[Math.min(wave, waves.length - 1)];
    const list = [];
    for (let i = 0; i < w.count; i++) {
      const mon = pick(pool);
      const tier = tierBase * w.tierMul + rnd(-0.2, 0.2);
      const u = monUnit(mon, tier, w.elite && (i === 0 || w.general));
      if (w.general) {
        u.boss = true;
        u.name = '【敌将·】' + u.name;
        u.radius = 56;
      }
      list.push(u);
    }
    return list;
  }

  async function doWarCampaign(G, target) {
    ensure(G);
    const S = SECTS[G.sect], T = SECTS[target];
    const totalWaves = 3;
    let allKilled = [];
    let playerWon = true;

    // 确保 RT27 可用（与 world28 同样的临时挂方案）
    const hadRT = 'RT27' in window;
    window.RT27 = RT27;

    try {
      for (let wave = 0; wave < totalWaves; wave++) {
        G.war.wave = wave + 1;
        const enemies = buildWarEnemies(G, target, wave);
        await UI.card(
          wave === 0 ? `${S.n} ↔ ${T.n} 攻防战` : `第 ${wave + 1} 波`,
          wave === 0
            ? `你率军出征，兵临${T.n}山门！\n共 ${totalWaves} 波敌人，一一击破！`
            : `${T.n} 的援军到了！第 ${wave + 1} 波！`,
          'npc_elder',
          [wave === 0 ? '出征！' : '迎敌！']
        );
        Sfx.play('whoosh');
        const r = await RT27.start(enemies, { boss: wave === totalWaves - 1 });
        allKilled = allKilled.concat(r.killed);
        if (r.res !== 'win') { playerWon = false; break; }
        // 波次间回血一点
        G.hp = Math.min(Game.stats().mhp, G.hp + Game.stats().mhp * 0.15);
      }
    } finally {
      if (!hadRT) delete window.RT27;
      G.war.wave = 0;
    }

    // ---- 6) 战争结算 ----
    await settleWar(G, target, playerWon, allKilled.length);
  }

  async function settleWar(G, target, won, killCount) {
    ensure(G);
    const S = SECTS[G.sect], T = SECTS[target];
    G.war.active = false; G.war.target = null;

    if (won) {
      // 胜：赔款 + 贡献 + 声望 + 关系恶化对方
      const stoneLoot = Math.round(2000 * POW(Math.max(1, G.realm + G.stage * 0.25)) * rnd(0.8, 1.3));
      const contribGain = 80 + killCount * 15;
      const renownGain = 50 + killCount * 10;
      G.stone += stoneLoot;
      G.contrib += contribGain;
      G.sectRenown += renownGain;
      G.warMerit += 100 + killCount * 20;
      G.war.wins = (G.war.wins || 0) + 1;
      modRel(G, G.sect, target, -30); // 打服了，关系更差
      Game.log(`${S.n}战胜${T.n}，缴获灵石${stoneLoot}，功绩卓著！`);
      Sfx.play('victory');
      await UI.card('大战告捷！',
        `你率军大破${T.n}！\n\n` +
        `缴获灵石：+${fmt(stoneLoot)}\n` +
        `宗门贡献：+${contribGain}\n` +
        `宗门声望：+${renownGain}\n` +
        `战争功绩：+${100 + killCount * 20}\n\n` +
        `${T.n}被迫求和，边境插上了${S.n}的战旗。`,
        'npc_elder', ['凯旋归来']);
      // 检查宗主晋升
      checkSectLeaderPromotion(G);
    } else {
      // 负：赔款 + 衰落 + 关系
      const stonePay = Math.round(1000 * POW(Math.max(1, G.realm + G.stage * 0.25)) * rnd(0.7, 1.0));
      G.stone = Math.max(0, G.stone - stonePay);
      G.contrib = Math.max(0, G.contrib - 50);
      modRel(G, G.sect, target, -10);
      G.war.losses = (G.war.losses || 0) + 1;
      Game.log(`${S.n}战败于${T.n}，赔款${stonePay}灵石。`);
      Sfx.play('defeat');
      await UI.card('战事不利…',
        `你军兵败如山倒，退回山门。\n\n` +
        `${T.n}索要赔款：-${fmt(stonePay)} 灵石\n` +
        `宗门贡献：-50\n` +
        `（卧薪尝胆，来日再战）`,
        'npc_elder', ['撤退回宗']);
    }
    UI.hud(); Game.save();
  }

  // ---- 7) 宗主晋升路径 ----
  // 条件：sectRank=4（大长老）+ 贡献≥1500 + 声望≥200 + 战争功绩≥150
  function checkSectLeaderPromotion(G) {
    ensure(G);
    if (G.sectLeader) return; // 已经是宗主
    if (G.sectRank !== 4) return; // 需要大长老
    if (G.contrib < 1500) return;
    if (G.sectRenown < 200) return;
    if (G.warMerit < 150) return;
    // 满足条件：宗主退位事件
    G.sectRank = 5;
    G.sectLeader = 1;
    Game.log('因功绩卓著，前任宗主退位，你继任为一宗之主！');
    Sfx.play('gong'); Sfx.play('levelup');
    UI.toast('🏆 你继任为【宗主】！', '#ffd23a');
    // 异步弹窗（避免阻塞当前结算）
    setTimeout(async () => {
      await UI.card('继任宗主',
        `前任宗主将掌门玉牌交到你手中——\n\n` +
        `你如今是【${SECTS[G.sect].n}】宗主！\n` +
        `· 可主动对其他宗门宣战或议和\n` +
        `· 宗门年俸提升至 60\n` +
        `· 宗门声望大幅提升\n\n` +
        `万仙来朝，自此始矣。`,
        'npc_elder', ['继往开来']);
      UI.hud(); Game.save();
    }, 800);
  }

  // ---- 8) 包裹 Game.yearEnd：关系衰减 + 战争触发检查 + 日常摩擦微调 ----
  const _ye = Game.yearEnd;
  Game.yearEnd = async function () {
    const before = this.G && this.G.year;
    await _ye.call(this);
    if (!this.G || this.G.year === before) return;
    const G = this.G; ensure(G);
    if (!G.sect) return;
    checkWarTrigger(G);
    // 日常关系微调（低概率随机摩擦）
    if (Math.random() < 0.3) {
      const others = otherSects(G);
      if (others.length) modRel(G, G.sect, pick(others), ri(-2, 2));
    }
  };

  // ---- 9) 包裹 Talk.extra：宗主可宣战/议和；普通弟子可看关系 ----
  const _ex = Talk.extra;
  Talk.extra = function (id) {
    const G = Game.G; const out = _ex ? _ex.call(this, id) : [];
    if (!G || !G.sect) return out;
    const sect = Object.entries(SECTS).find(([k, s]) => s.master === id);
    if (!sect) return out;
    ensure(G);
    const [sid] = sect;
    if (sid !== G.sect) return out; // 只在自己宗门师父处出现

    // 普通弟子/长老：查看宗门关系（在"我的宗门"面板里也有，Talk 里加一个快捷入口）
    out.push(['⚔ 宗门征伐', async () => { await UI.panel('sectWar'); }]);

    // 宗主专属：主动宣战/议和
    if (G.sectLeader) {
      const foes = otherSects(G);
      for (const other of foes) {
        const r = getRel(G, G.sect, other);
        const label = relLabel(r);
        if (r > -40 && !warActive(G)) {
          out.push([`⚔ 宣战${SECTS[other].n}`, async () => {
            const c = await UI.say(NPCS[id].por, NPCS[id].n,
              `你确定要对【${SECTS[other].n}】宣战？\n当前关系：${label.t}（${r}）\n宣战将触发全面战争。`,
              ['宣战！', '再想想']);
            if (c !== 0) return;
            modRel(G, G.sect, other, -40);
            G.war.active = true; G.war.target = other; G.war.wave = 0;
            await doWarCampaign(G, other);
          }]);
        } else if (warActive(G) && G.war.target === other) {
          out.push([`🤝 与${SECTS[other].n}议和`, async () => {
            const c = await UI.say(NPCS[id].por, NPCS[id].n,
              `战争已经打了很久。要派使者去【${SECTS[other].n}】议和吗？\n（议和需献上贡品，关系缓和）`,
              ['议和', '继续打']);
            if (c !== 0) return;
            const cost = Math.round(800 * POW(Math.max(1, G.realm)));
            G.stone = Math.max(0, G.stone - cost);
            modRel(G, G.sect, other, 30);
            G.war.active = false; G.war.target = null; G.war.wave = 0;
            await UI.card('议和达成',
              `双方罢兵休战。\n献上贡品：-${fmt(cost)} 灵石\n关系 +30`,
              NPCS[id].por, ['化干戈为玉帛']);
            UI.hud(); Game.save();
          }]);
        }
      }
    }
    return out;
  };

  // ---- 10) 扩展宗门面板 sect25：在原面板末尾追加关系/战争区块 ----
  // 不覆盖 sects25 的 p_sect25，而是包裹它
  const _psect = UI.p_sect25;
  UI.p_sect25 = function (b, re, close) {
    _psect.call(this, b, re, close);
    const G = Game.G; ensure(G);
    if (!G.sect) return;
    // 追加战争/关系信息
    const extra = document.createElement('div');
    extra.innerHTML = buildWarPanelHtml(G);
    b.appendChild(extra);
    // 绑定事件
    const btn = extra.querySelector('#sect-war-btn');
    if (btn) btn.onclick = () => UI.panel('sectWar');
  };

  function buildWarPanelHtml(G) {
    const others = otherSects(G);
    let rows = '';
    for (const other of others) {
      const r = getRel(G, G.sect, other);
      const lb = relLabel(r);
      const atWar = warActive(G) && G.war.target === other;
      rows += `<div class="it"><div><b>${SECTS[other].n} ${atWar ? '<span class="tag" style="background:#7a2a1a">交战中</span>' : ''}</b>` +
        `<small>关系：<span style="color:${lb.c}">${lb.t}</span>（${r > 0 ? '+' : ''}${r}）</small></div></div>`;
    }
    const warInfo = warActive(G)
      ? `<p class="hint" style="color:#ff8a6a">⚔ 当前与【${SECTS[G.war.target].n}】交战中！第 ${G.war.wave} 波</p>`
      : `<p class="hint">近年征战：胜 ${G.war.wins || 0} 场 · 负 ${G.war.losses || 0} 场 · 功绩 ${G.warMerit}</p>`;
    return `<h4>宗门征伐</h4>${warInfo}${rows}<button class="opt" id="sect-war-btn" style="margin-top:8px">⚔ 打开宗门征伐面板</button>`;
  }

  // ---- 11) 宗门征伐面板 UI.panel('sectWar') ----
  UI.titles.sectWar = '宗门征伐';
  UI.p_sectWar = function (b, re) {
    const G = Game.G; ensure(G);
    if (!G.sect) { b.innerHTML = '<p class="hint">你尚未加入宗门。</p>'; return; }
    const S = SECTS[G.sect];
    const others = otherSects(G);
    let html = `<p class="hint">${S.n} · 位阶：${G.sectRank >= 5 ? '宗主' : (['外门弟子','内门弟子','真传弟子','长老','大长老'][G.sectRank] || '未知')}<br>` +
      `战争功绩：${G.warMerit}　胜场：${G.war.wins || 0}　负场：${G.war.losses || 0}</p>`;

    if (warActive(G)) {
      const t = G.war.target;
      html += `<p class="hint" style="color:#ff8a6a">⚔ 正在与【${SECTS[t].n}】交战！第 ${G.war.wave} 波</p>`;
    }

    html += '<h4>宗门关系</h4>';
    for (const other of others) {
      const r = getRel(G, G.sect, other);
      const lb = relLabel(r);
      const T = SECTS[other];
      html += `<div class="it"><i style="width:44px;height:44px;border-radius:8px;background:${lb.c}33;border:1px solid ${lb.c};display:flex;align-items:center;justify-content:center;color:${lb.c};font-size:18px">${r < -40 ? '⚔' : r > 40 ? '🤝' : '🏯'}</i>` +
        `<div><b>${T.n}</b><small>关系：<span style="color:${lb.c}">${lb.t}</span>（${r > 0 ? '+' : ''}${r}）</small></div></div>`;
    }

    // 宗主专属操作
    if (G.sectLeader) {
      html += '<h4>宗主之权</h4>';
      for (const other of others) {
        const r = getRel(G, G.sect, other);
        if (!warActive(G) && r > -40) {
          html += `<button class="opt war-declare" data-target="${other}">⚔ 宣战 ${SECTS[other].n}</button>`;
        } else if (warActive(G) && G.war.target === other) {
          html += `<button class="opt war-peace" data-target="${other}">🤝 与 ${SECTS[other].n}议和</button>`;
        }
      }
    } else {
      // 晋升提示
      if (G.sectRank === 4) {
        const needContrib = 1500, needRenown = 200, needMerit = 150;
        html += `<h4>宗主之路</h4><p class="hint">大长老→宗主条件：<br>` +
          `贡献 ${G.contrib}/${needContrib}　名誉 ${G.sectRenown}/${needRenown}　功绩 ${G.warMerit}/${needMerit}</p>`;
      }
    }
    b.innerHTML = html;

    // 绑定宣战/议和按钮
    b.onclick = async e => {
      const d = e.target.closest('.war-declare');
      if (d) {
        const target = d.dataset.target;
        const c = await UI.card('宣战', `确定要对【${SECTS[target].n}】宣战吗？\n宣战将触发全面战争。`, 'npc_elder', ['宣战！', '再想想']);
        if (c !== 0) return;
        modRel(G, G.sect, target, -40);
        G.war.active = true; G.war.target = target; G.war.wave = 0;
        await doWarCampaign(G, target);
        re();
        return;
      }
      const p = e.target.closest('.war-peace');
      if (p) {
        const target = p.dataset.target;
        const c = await UI.card('议和', `派使者去【${SECTS[target].n}】议和？\n需献上贡品。`, 'npc_elder', ['议和', '继续打']);
        if (c !== 0) return;
        const cost = Math.round(800 * POW(Math.max(1, G.realm)));
        G.stone = Math.max(0, G.stone - cost);
        modRel(G, G.sect, target, 30);
        G.war.active = false; G.war.target = null; G.war.wave = 0;
        UI.toast(`与${SECTS[target].n}议和达成（-${fmt(cost)}灵石，关系+30）`, '#9aff9a');
        UI.hud(); Game.save();
        re();
      }
    };
  };

  // ---- 12) 暴露全局接口（供测试/其他模块调用）----
  window.War29 = {
    ensure, getRel, setRel, modRel, relLabel,
    warActive, warTarget,
    triggerConscription, doWarCampaign, settleWar,
    checkSectLeaderPromotion,
    buildWarPanelHtml,
    // 测试辅助：直接设置关系
    forceRel(a, b, v) { if (Game.G) setRel(Game.G, a, b, v); },
    // 测试辅助：直接触发战争
    declareWar(target) {
      const G = Game.G; if (!G || !G.sect) return;
      G.war.active = true; G.war.target = target; G.war.wave = 0;
      modRel(G, G.sect, target, -40);
      return doWarCampaign(G, target);
    },
  };
})();

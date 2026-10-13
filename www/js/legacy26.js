'use strict';
// ======================= v2.6 传承道统：收徒 / 道侣子嗣 / 传剑（②） =======================
// 参考太吾绘卷传剑：把当世功法、修为、遗惠封入道统，让下一代（弟子/子嗣/来世）接续。
// 接入手法：Talk.extra 注入"收为弟子" + 包裹 Game.yearEnd（弟子成长/子嗣诞生）
//          + 包裹 Game.newLife（来世继承道统遗惠）+ UI.panel('legacy26')。
// 存档：G.apprentice（2.5 migrate25 已占位=null）正式启用；G.heir{} / G.apprenticeLvl /
//       G.apprenticeTechs / Game.meta.daotong{} 本文件惰性兜底，不升 v。
(function () {
  function ensure(G) {
    if (G.apprentice === undefined) G.apprentice = null;
    if (typeof G.apprenticeLvl !== 'number') G.apprenticeLvl = 0;
    if (!G.apprenticeTechs || typeof G.apprenticeTechs !== 'object') G.apprenticeTechs = {};
    if (!G.heir || typeof G.heir !== 'object') G.heir = null;
    return G;
  }
  // 道统存于跨轮回 Game.meta（loadMeta 的 Object.assign 兜底之外，这里再惰性补一次）
  function ensureMeta() {
    if (!Game.meta) Game.meta = {};
    if (!Game.meta.daotong || typeof Game.meta.daotong !== 'object') Game.meta.daotong = {};
    return Game.meta.daotong;
  }

  const HEIR_NAMES = ['承业', '续音', '问道', '守一', '明远', '清辉', '抱朴', '怀远'];

  // ---- 1) 收徒 + 传承面板入口：Talk.extra 链式注入 ----
  const _ex = Talk.extra;
  Talk.extra = function (id) {
    const G = Game.G; const out = _ex ? _ex.call(this, id) : [];
    if (!G) return out; ensure(G);
    const N = NPCS[id];
    // 传承总面板：落魄剑仙处随时可开（查看弟子/子嗣/封统）
    if (id === 'mentor') out.push(['📜 传承道统', async () => { await UI.panel('legacy26'); }]);
    // 收徒：comp 可结交 NPC，好感≥80、筑基以上、未拜师、非道侣
    if (!N || !N.comp) return out;
    if (G.partner === id) return out;                 // 道侣不兼弟子
    if (G.apprentice) return out;                     // 已收一名弟子
    if (G.realm < 2) return out;                      // 筑基以上才有资格开山门
    const a = G.aff[id] || 0;
    if (a < 80) return out;
    out.push(['📜 收为弟子', async () => {
      const c = await UI.say(N.por, N.n, `你观${N.n.split('·').pop()}根骨清奇，是个可塑之才。\n欲收为衣钵弟子，传你一身本领？（将占用唯一弟子位）`, ['郑重收徒', '再考察考察']);
      if (c !== 0) return;
      G.apprentice = id; G.apprenticeLvl = 1; G.apprenticeTechs = {};
      Game.log(`收下弟子${N.n}。`);
      Sfx.play('chuanjian');
      UI.toast(`你收下了弟子【${N.n.split('·').pop()}】`, '#ffd8a0');
      await UI.card('开山收徒', `从此${N.n.split('·').pop()}便是你座下弟子。\n日后可在【传承】面板传功授法，临终更可封剑入道统。`, N.por, ['师徒缘分，自此而始']);
    }]);
    return out;
  };

  // ---- 2) 包裹 Game.yearEnd：弟子成长 + 道侣子嗣诞生 ----
  const _ye = Game.yearEnd;
  Game.yearEnd = async function () {
    const before = this.G && this.G.year;
    await _ye.call(this);
    if (!this.G || this.G.year === before) return;
    const G = this.G; ensure(G);

    // ① 弟子随你历练，逐年精进（每 2 年 +1 级，到 10 级封顶，纯展示）
    if (G.apprentice && G.year % 2 === 0) {
      G.apprenticeLvl = Math.min(10, (G.apprenticeLvl || 0) + 1);
      UI.toast(`弟子【${(NPCS[G.apprentice] || { n: '弟子' }).n.split('·').pop()}】修为精进， ${G.apprenticeLvl} 级`, '#9affd8');
    }

    // ② 道侣子嗣：道侣在身、年过不惑、尚未有后 → 半概率得子
    if (G.partner && G.age >= 40 && !G.heir && Math.random() < 0.4) {
      const pn = (NPCS[G.partner] || { n: '道侣' }).n.split('·').pop();
      await UI.card('弄璋之喜', `夜深烛暖，${pn}临盆，呱呱坠地一声啼哭——\n你（${G.surname}家）得了个孩儿。`, 'npc_girl', ['抱起来看看']);
      const lg = pick([G.lg, G.lg, G.partner ? G.lg : G.lg]); // 承袭本家灵根
      const techKeys = Object.keys(G.techs);
      G.heir = {
        name: G.surname + pick(HEIR_NAMES),
        lg, talent: pick(TALENTS).id, tech: techKeys.length ? pick(techKeys) : null,
        born: G.year, age: 0,
      };
      Game.log(`子嗣${G.heir.name}诞生，承袭${LINGGEN.find(l => l.id === lg).n}。`);
      Sfx.play('chapter');
      UI.toast(`子嗣【${G.heir.name}】诞生！`, '#ffc0e0');
    }
    // 子嗣年岁增长（展示）
    if (G.heir) G.heir.age = G.year - G.heir.born;
  };

  // ---- 3) 包裹 Game.newLife：来世封剑遗惠（道统跨轮回）----
  const _nl = Game.newLife;
  Game.newLife = function (cfg) {
    _nl.call(this, cfg);
    const G = this.G; ensure(G);
    const dt = Game.meta && Game.meta.daotong;
    if (dt && dt.sealed) {
      // 上一世封入道统：来世出生即带微弱加成（与 META_PERKS 叠加，不冲突）
      G.lifeBonus = (G.lifeBonus || 0) + 20;
      G.cultBonus = (G.cultBonus || 0) + 0.05;
      G._daotongBorn = dt.realm || 0;
      try { UI.toast(`道统感应：你生来便带着上一世 ${dt.realm || 0} 境修士的遗惠（寿元+20，修为+5%）`, '#ffe680'); } catch (e) { }
    }
  };

  // ---- 4) 传承面板 UI.panel('legacy26') ----
  UI.titles.legacy26 = '传承道统';
  UI.p_legacy26 = function (b, re) {
    const G = Game.G; ensure(G);
    const ap = G.apprentice ? NPCS[G.apprentice] : null;
    const techKeys = Object.keys(G.techs);

    let html = '';
    // —— 弟子 ——
    html += '<h4>座下弟子</h4>';
    if (ap) {
      const learned = Object.keys(G.apprenticeTechs);
      html += `<p class="hint">【${ap.n}】　修为 ${G.apprenticeLvl} 级<br>
        已授功法：${learned.length ? learned.map(t => '《' + TECHS[t].n + '》').join('、') : '尚未传功'}<br>
        好感 ${G.aff[G.apprentice] || 0}</p>`;
      // 传剑：挑一门自己会的功法传给弟子
      if (techKeys.length) {
        html += `<button class="opt" id="teach">🗡 传剑（授一门功法）</button>`;
      } else {
        html += `<p class="hint">你自己还没习得功法，先去学一门再来传。</p>`;
      }
      html += `<button class="opt" id="passexp">🍵 传功（渡部分修为给弟子）</button>`;
    } else {
      html += `<p class="hint">尚未收徒。在好感 ≥80 的可结交 NPC 处（筑基后）可收为衣钵弟子。</p>`;
    }

    // —— 子嗣 ——
    html += '<h4>道侣子嗣</h4>';
    if (G.heir) {
      const lg = LINGGEN.find(l => l.id === G.heir.lg) || LINGGEN[1];
      html += `<p class="hint">子嗣【${esc(G.heir.name)}】　今年 ${G.heir.age} 岁<br>
        承袭灵根：${lg.n}　天赋：${(TALENTS.find(t => t.id === G.heir.talent) || { n: '未定' }).n}<br>
        ${G.heir.tech ? '启蒙功法：《' + TECHS[G.heir.tech].n + '》' : '尚在襁褓'}<br>
        <small>（子嗣随年成长，临终封统时会继承你的道统）</small></p>`;
    } else {
      html += `<p class="hint">尚无子嗣。结为道侣后，年过不惑或有弄璋之喜。</p>`;
    }

    // —— 封剑入道统 ——
    html += '<h4>封剑入道统</h4>';
    if ((G.apprentice || G.heir) && G.realm >= 3 && !G.daotongSealed) {
      html += `<p class="hint">将当世 ${G.realmName()} 的修为、功法、灵石遗惠封入道统，留给弟子/子嗣，来世亦可感应。</p>
        <button class="opt" id="seal" style="color:#ffe680">⚜ 封剑入道统（一生一次）</button>`;
    } else if (G.daotongSealed) {
      html += `<p class="hint" style="color:#ffe680">✓ 你已封剑入道统。道统之光，福泽后人。</p>`;
    } else {
      html += `<p class="hint">需金丹以上、且已有弟子或子嗣，方可封剑。</p>`;
    }
    b.innerHTML = html;

    // 传剑
    const teachBtn = b.querySelector('#teach');
    if (teachBtn) teachBtn.onclick = async () => {
      const opts = techKeys.map(t => `《${TECHS[t].n}》`);
      const c = await UI.card('传剑授法', '择一门你所习功法，手把手指点弟子：', 'npc_disciple', opts.concat(['算了']));
      if (c >= techKeys.length) return;
      const t = techKeys[c];
      if (G.apprenticeTechs[t]) { UI.toast('这门功法已传过了'); return; }
      G.apprenticeTechs[t] = 1;
      const g = Game.addExp(Game.yearExp() * 0.2, true); // 传剑需耗一点修为
      Sfx.play('chuanjian');
      await UI.card('传道授业', `你将《${TECHS[t].n}》的口诀娓娓道来，弟子豁然开朗。\n（你耗修为 +${fmt(g)} 作指点）`, ap.por, ['师徒切磋']);
      re();
    };
    // 传功
    const peBtn = b.querySelector('#passexp');
    if (peBtn) peBtn.onclick = async () => {
      const c = await UI.card('传功渡气', '你掌抵弟子后心，渡一缕真元过去。弟子修为将精进。', 'npc_disciple', ['渡气传功（弟子+1级）', '算了']);
      if (c !== 0) return;
      G.apprenticeLvl = Math.min(10, G.apprenticeLvl + 1);
      Game.addExp(-Game.yearExp() * 0.1, true); // 渡出修为
      Sfx.play('magic');
      UI.toast(`弟子精进至 ${G.apprenticeLvl} 级`, '#9affd8');
      re();
    };
    // 封剑入道统
    const sealBtn = b.querySelector('#seal');
    if (sealBtn) sealBtn.onclick = async () => {
      const c = await UI.card('封剑入道统',
        `你确定要将当世道统封印？\n\n· 修为：${Game.realmName()}\n· 功法：${techKeys.slice(0, 3).map(t => '《' + TECHS[t].n + '》').join('、') || '无'}\n· 灵石遗惠：${fmt(G.stone)}\n\n此后弟子/子嗣承其泽，你来世亦得感应。（一生一次）`,
        'i:sk_light', ['封剑！', '再想想']);
      if (c !== 0) return;
      Game.meta.daotong = {
        sealed: 1, realm: G.realm, age: G.age,
        techs: techKeys.slice(0, 3), stone: Math.floor(G.stone), t: Date.now(),
      };
      Game.saveMeta();
      G.daotongSealed = 1;
      Sfx.play('chuanjian'); Sfx.play('gong');
      await UI.card('道统封成', '你一剑划开虚空，将毕生修为凝成一枚道统之印，悬于传家祠堂。\n后来者，自当接续。', 'i:sk_light', ['道统永昌']);
      re();
    };
  };
})();

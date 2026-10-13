'use strict';
// ======================= v2.5 宗门位阶晋升 + 三年大比（H1） =======================
// 扩展手法：全部通过"包裹/赋值"接入，不改 talk.js / game.js / data.js 本体（与 content22.js、systems21.js 同风格）。
// 加载位置：index.html 在 art23.js 之后（最外层包裹，Talk.extra/yearEnd 链最外侧）。
(function () {
  // ---- 1) 位阶表 6 级（外门→内门→真传→长老→大长老；宗主预留 2.6）----
  const RANKS = [
    { id: 0, name: '外门弟子', need: 0,   stipend: 0,  renown: 0 },
    { id: 1, name: '内门弟子', need: 50,  stipend: 2,  renown: 5 },
    { id: 2, name: '真传弟子', need: 150, stipend: 5,  renown: 15 },
    { id: 3, name: '长  老',   need: 450, stipend: 12, renown: 40 },
    { id: 4, name: '大长老',  need: 900, stipend: 25, renown: 90 },
    { id: 5, name: '宗  主',   need: null, stipend: 60, renown: 200 }, // 2.6 预留
  ];
  const RANK = r => RANKS[Math.min(r, RANKS.length - 1)];
  // ---- 2) 晋升挑战对手（MONS 里已注册的可打人物：story21/content22）----
  const CHALLENGER = { 2: 'aotian', 3: 'heixin', 4: 'ruyan' };
  const TOURN_EVERY = 3;

  function ensure(G) { if (window.Sys25) Sys25.normalize(G); }

  // ---- 3) 自动晋升：内门及以下（位阶<2）贡献够即升，无需战斗 ----
  function tryRankUp(G) {
    ensure(G);
    const next = RANKS[G.sectRank + 1];
    if (!next || next.need === null) return null;
    if (G.contrib >= next.need && G.sectRank < 2) { G.sectRank++; return RANK(G.sectRank); }
    return null;
  }

  // ---- 4) 注入 Talk.npc：只在宗门师父处出现（链式调用上一个 Talk.extra，保留 content22 的结局项）----
  const _ex = Talk.extra;
  Talk.extra = function (id) {
    const G = Game.G; const out = _ex ? _ex.call(this, id) : [];
    if (!G || !G.sect) return out;
    const sect = Object.entries(SECTS).find(([k, s]) => s.master === id);
    if (!sect) return out;
    ensure(G);
    // ① 我的宗门（打开位阶面板）
    out.push(['🏯 我的宗门', async () => { await UI.panel('sect25'); }]);
    // ② 晋升挑战（真传及以上需打擂；贡献够了才出现）
    const next = RANKS[G.sectRank + 1];
    if (next && next.need !== null && G.contrib >= next.need && G.sectRank >= 2) {
      const foe = CHALLENGER[G.sectRank + 1] || 'aotian';
      out.push([`⚔ 晋升挑战（战${MONS[foe].n}）`, async () => await doChallenge(G, next, foe)]);
    }
    return out;
  };

  async function doChallenge(G, next, foe) {
    const c = await UI.say('npc_mentor', '宗门大比台',
      `挑战晋升【${next.name}】：你要与 ${MONS[foe].n} 一战。\n胜则晋升，败则贡献折半。`, ['应战', '再想想']);
    if (c !== 0) return;
    // 注意：Game.fight 返回 r 对象，r.res==='win' 才是胜（game.js:202），非布尔
    const r = await Game.fight(foe, { tier: Math.max(1.5, Game.power() + 0.2), solo: true });
    if (r && r.res === 'win') {
      G.sectRank++; G.sectRenown += next.renown; Sfx.play('victory');
      await UI.card('晋升成功', `你晋升为【${next.name}】！\n名誉 +${next.renown}。`, 'npc_mentor', ['谢师父']);
    } else {
      G.contrib = Math.floor(G.contrib / 2); UI.toast('挑战失败，贡献折半');
    }
    UI.hud();
  }

  // ---- 5) 包裹 Game.yearEnd：年俸禄 + 自动晋升 + 三年一届大比 ----
  const _ye = Game.yearEnd;
  Game.yearEnd = async function () {
    const before = this.G && this.G.year;
    await _ye.call(this);
    if (!this.G || this.G.year === before) return;   // 没真正过年就不结算
    const G = this.G; ensure(G);
    if (!G.sect) return;
    G.contrib += RANK(G.sectRank).stipend;            // 年俸禄（按位阶发贡献）
    const auto = tryRankUp(G);                         // 内门/外门贡献够自动升
    if (auto) { Game.log(`宗门晋升为【${auto.name}】。`); UI.toast(`宗门晋升：${auto.name}`, '#ffd23a'); }
    if (G.year % TOURN_EVERY === 0) await doTournament(G);
  };

  async function doTournament(G) {
    G.tournDone = (G.tournDone || 0) + 1;
    const rounds = Math.min(3, G.sectRank + 1);       // 位阶越高打的轮次越多
    let wins = 0;
    await UI.card('宗门大比', `第 ${G.tournDone} 届宗门大比开始！\n你将连打 ${rounds} 场。`, 'npc_mentor', ['登台']);
    const pool = ['aotian', 'heixin', 'ruyan', 'taizi'];
    for (let i = 0; i < rounds; i++) {
      const foe = pick(pool);
      const r = await Game.fight(foe, { tier: Math.max(1.5, Game.power()), solo: true });
      if (r && r.res === 'win') wins++; else break;
    }
    G.tournWins += wins;
    const bonus = wins * 20 + wins * wins * 5;         // 名次奖励曲线
    G.contrib += bonus; G.sectRenown += wins * 10;
    await UI.card('大比结算', `你在本届大比胜 ${wins} 场！\n贡献 +${bonus}，名誉 +${wins * 10}。`, 'npc_mentor', ['收下奖励']);
  }

  // ---- 6) 宗门面板 UI.panel('sect25')：仿 ui.js p_xxx 风格注册 ----
  UI.titles.sect25 = '我的宗门';
  UI.p_sect25 = function (b) {
    const G = Game.G; ensure(G);
    const S = G.sect ? SECTS[G.sect] : null;
    const rows = RANKS.map(r => {
      const cur = r.id === G.sectRank;
      const done = r.id < G.sectRank;
      return `<div class="it"><div><b>${cur ? '▶ ' : done ? '✓ ' : ''}${r.name}</b><small>${r.need ? `需贡献${r.need}` : '入门'} · 年俸+${r.stipend} · 名誉+${r.renown}</small></div>${cur ? '<span class="tag">当前</span>' : ''}</div>`;
    }).join('');
    b.innerHTML = `<p class="hint">${S ? S.n : '散修'}　位阶：【${RANK(G.sectRank).name}】<br>当前贡献：${G.contrib}　宗门名誉：${G.sectRenown}<br>累计大比胜场：${G.tournWins}　已办大比：${G.tournDone} 届</p><h4>位阶晋升之路</h4>${rows}`;
  };
})();

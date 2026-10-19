'use strict';
// ======================= 3.4 心魔幻境（docs/research_v33.md §7）=======================
// 金丹→元婴起（G.realm 3..5）每次大突破、成功率判定之前，进入 3 关幻境：贪（灵石诱惑）→ 嗔（宿敌幻影战斗，属性=玩家 80%，天魔种 100%）→ 痴（道侣/亲人幻影）。
// 评级：过 3 关大成 +12 / 2 关小成 +5 / 1 关未成 0 / 0 关沦陷 −10（突破失败时追加「心魔缠身」修为 −20%，3 年）。道心无暇保底小成。可跳过（=未成）。
// 修正写进 G.tmpBrk（原版 _tryBreak 读完即清零），正向修正保证最终成功率 ≤95%。存档：G.xm34 = { until }（debuff）、G._xm34（本境界已出的评级，取消突破时保留，不重玩）。
const XM34 = {
  GR: [['沦陷', -0.10, '#c58aff'], ['未成', 0, '#cfcfcf'], ['小成', 0.05, '#9affd0'], ['大成', 0.12, '#ffd23a']],
  triggers(r) { return r >= 3 && r <= 5; },
  mg(id) { return typeof MG33 !== 'undefined' && MG33.has(id); },
  lv(r) { return Math.max(0, Math.min(2, r - 3 + (this.mg('tianmo') ? 1 : 0))); }, // 境界越高选项越模糊；天魔种 +1 档
  active(G) { G = G || Game.G; return !!(G && G.xm34 && G.year < G.xm34.until); },
  left(G) { G = G || Game.G; return this.active(G) ? G.xm34.until - G.year : 0; },
  who(G) { // 痴关对象：道侣 > 娘
    if (G.partner && NPCS[G.partner]) return { n: NPCS[G.partner].n.split('·').pop(), por: NPCS[G.partner].por, kind: '道侣' };
    return { n: '娘', por: (NPCS.mom && NPCS.mom.por) || 'npc_mom', kind: '亲人' };
  },
  shuffle(a, lv) { if (lv < 1) return a; const b = a.slice(); for (let k = b.length - 1; k > 0; k--) { const j = Math.random() * (k + 1) | 0; [b[k], b[j]] = [b[j], b[k]]; } return b; },
  OPT: {
    tan: [
      [['收下灵石，一笔勾销', 0], ['不是自己挣的钱，不要', 1], ['先收下，回头再还回去', 0]],
      [['先收着，回头再说', 0], ['问一句：这钱从哪来？', 1], ['数一数够不够', 0]],
      [['打开箱子', 0], ['合上箱子', 1], ['把箱子推回去一半', 0]],
    ],
    chen: [
      [['拔剑，与它一战', 1], ['转身逃走', 0]],
      [['迎上去', 1], ['等它先出手……不，躲开', 0]],
      [['向前一步', 1], ['向后一步', 0]],
    ],
    chi: [
      [['留下来陪{w}', 0], ['“等我回来。”然后转身', 1], ['带{w}一起闯过去', 0]],
      [['再待一会儿', 0], ['轻轻松开手', 1], ['答应{w}', 0]],
      [['回头', 0], ['不回头', 1], ['闭上眼', 0]],
    ],
  },
  async ask(title, text, por, key, lv, w) {
    const list = this.shuffle(this.OPT[key][lv], lv).map(([t, ok]) => [t.replace(/\{w\}/g, w || 'TA'), ok]);
    const k = await UI.card(title, text, por, list.map(o => o[0]));
    return list[k] ? list[k][1] : 0;
  },
  async fightSelf(G, lv) {
    const ps = Game.stats(); const k = this.mg('tianmo') ? 1 : 0.8; const u = monUnit('demon', Math.max(1, G.realm + G.stage * 0.2));
    Object.assign(u, { name: '心魔·另一个' + G.name, spr: Game.playerSpr(), mhp: Math.max(1, Math.round(ps.mhp * k)), atk: ps.atk * k, def: ps.def * k, spd: ps.spd * k, crit: ps.crit || 0.05, boss: true, xm34: 1 });
    u.hp = u.mhp; const hp0 = G.hp, mp0 = G.mp; let r = null;
    try { r = await Game._startBattle([u], { boss: true, solo: true, noflee: true, xm34: 1 }); }
    catch (e) { console.warn('xm34 battle', e); }
    finally { R.onTap = (x, y) => Game.onTap(x, y); G.hp = hp0; G.mp = mp0; const info = MAPINFO[R.mapId]; if (info && typeof Audio2 !== 'undefined') Audio2.bgm(info.bgm); } // 幻境伤害不带出来
    return r && r.res === 'win' ? 1 : 0;
  },
  // 返回 { g: 评级下标, skip }；null = 玩家选择暂缓突破
  async run(G, r) {
    const nm = REALMS[r + 1].n; const lv = this.lv(r);
    const c = await UI.card('心魔幻境', `冲击【${nm}】之前，识海里起了雾——心魔幻境开了。\n三关：贪 → 嗔 → 痴。评级会修正这次突破的成功率（大成 +12%，小成 +5%，未成 ±0，沦陷 −10%）。${this.mg('tianmo') ? '\n【天魔种】幻境难度 +1 档。' : ''}${this.mg('dao_xin') ? '\n【道心无暇】至少「小成」。' : ''}`, 'i:sk_meditate', ['入幻境', '跳过（视为未成）', '再缓缓']);
    if (c === 2 || c < 0 || c === undefined) return null;
    if (c === 1) return { g: this.mg('dao_xin') ? 2 : 1, skip: true, pass: -1 };
    let pass = 0; const w = this.who(G);
    // 一关·贪
    const tanTxt = G.debt > 0 ? `天道讨债司的账房先生推来一箱灵石：“${G.name}，你还欠 ${fmt(G.debt)} 灵石。这里正好够——收下，从此两清。”` : `账房先生推来一箱灵石：“你的账早还清了。这是天道的一点心意……利息另算。”`;
    pass += await this.ask('心魔幻境 · 一关·贪', tanTxt, 'mon_collector', 'tan', lv);
    // 二关·嗔
    const sect = G.sect && SECTS[G.sect] ? `，袖口绣着${SECTS[G.sect].n}的纹样` : '';
    const chen = await this.ask('心魔幻境 · 二关·嗔', `雾里走出一个人，穿着和你一样的衣服${sect}。\n“${G.name}，这 ${G.age} 年都是我在替你受气。现在，换我来活。”`, Game.playerSpr(), 'chen', lv);
    if (chen) { UI.toast('与心魔一战！它有你 ' + (this.mg('tianmo') ? '100' : '80') + '% 的本事', '#c58aff'); pass += await this.fightSelf(G, lv); }
    // 三关·痴
    pass += await this.ask('心魔幻境 · 三关·痴', `${w.n}在桃花村的门口等你，${w.kind === '道侣' ? '手里拿着你们结契那年的红绳' : '灶上还温着你小时候最爱喝的粥'}。\n“别去渡什么劫了，留下来，我们好好过日子。”`, w.por, 'chi', lv, w.n);
    let g = pass; if (this.mg('dao_xin') && g < 2) g = 2;
    return { g, skip: false, pass };
  },
  baseCh(G, r) { return REALMS[r].brk + G.st.int * 0.015 + G.st.luck * 0.005 + (G.brkBonus || 0) + (Game.treeVal ? Game.treeVal('brk') : 0) + (G.tmpBrk || 0); },
};
(function () {
  const _tb = Game._tryBreak; Game._tryBreak = async function () {
    const G = this.G; if (!G || !this.canBreak()) return _tb.apply(this, arguments);
    const r = G.realm; if (!XM34.triggers(r)) return _tb.apply(this, arguments);
    let res = G._xm34 && G._xm34.r === r ? G._xm34 : null;
    if (!res) {
      const o = await XM34.run(G, r); if (!o) return; // 再缓缓
      const GR = XM34.GR[o.g]; res = G._xm34 = { r, g: o.g, skip: o.skip, pass: o.pass };
      this.log(`冲击${REALMS[r + 1].n}前入心魔幻境：${o.skip ? '跳过' : `过 ${o.pass}/3 关`}，评级「${GR[0]}」。`);
      await UI.card('幻境评级 · ' + GR[0], `${o.skip ? '你没有理会心魔。' : `你闯过了 ${o.pass}/3 关。`}${o.g === 2 && o.pass < 2 && !o.skip ? '\n【道心无暇】保底「小成」。' : ''}\n突破成功率修正：${GR[1] > 0 ? '+' : ''}${Math.round(GR[1] * 100)}%${o.g === 0 ? '\n⚠ 若这次突破失败，将陷入「心魔缠身」（修为 −20%，3 年）。' : ''}`, 'i:sk_meditate', ['继续']);
      Game.save();
    }
    const m = XM34.GR[res.g][1]; const b = XM34.baseCh(G, r); const mEff = m > 0 ? Math.max(0, Math.min(m, 0.95 - b)) : m;
    G.tmpBrk = (G.tmpBrk || 0) + mEff;
    let pick = -1; const _card = UI.card;
    UI.card = function (title, text, por, opts, extra) {
      if (title === '冲击瓶颈' && typeof text === 'string') {
        const mm = text.match(/成功率约 (-?\d+)%/); const fin = mm ? +mm[1] : null; const md = Math.round(mEff * 100);
        if (fin !== null) text = text.replace(/成功率约 -?\d+%/, `成功率：基础 ${fin - md}% ${md >= 0 ? '+' : '−'} 心魔「${XM34.GR[res.g][0]}」${Math.abs(md)}% = 最终 ${Math.max(0, fin)}%${fin >= 95 && md > 0 ? '（封顶）' : ''}`);
        UI.card = _card; const p = _card.call(this, title, text, por, opts, extra); return p.then(k => { pick = k; return k; });
      }
      return _card.apply(this, arguments);
    };
    const r0 = G.realm;
    try { await _tb.apply(this, arguments); } finally { UI.card = _card; }
    if (pick !== 0) return; // 「再等等」：保留本境界评级，下次不重玩
    G._xm34 = null;
    if (!G.dead && G.realm === r0 && res.g === 0) {
      G.xm34 = { until: G.year + 3 }; this.log('心魔缠身：修为获取 −20%，持续 3 年。');
      Sfx.play && Sfx.play('fail'); await UI.card('心魔缠身', '幻境里的那个你，跟着你出来了。\n修为获取 −20%，持续 3 年（状态栏可见剩余年数）。', 'i:sk_poison', ['唉']);
      UI.hud(); this.save();
    }
  };
  const _cm = Game.cultMult; Game.cultMult = function () { return _cm.apply(this, arguments) * (XM34.active(this.G) ? 0.8 : 1); };
  const _ye = Game.yearEnd; Game.yearEnd = async function () {
    const G = this.G; const was = XM34.active(G); const r = await _ye.apply(this, arguments);
    if (G && !G.dead && G.xm34) { if (!XM34.active(G)) { G.xm34 = null; if (was) UI.toast('心魔缠身已散去，道心重归清明', '#9affd0'); } }
    return r;
  };
  const _hud = UI.hud; UI.hud = function () {
    const r = _hud.apply(this, arguments); const G = Game.G; const el = document.querySelector('#money');
    if (G && el && XM34.active(G)) el.insertAdjacentHTML('beforeend', `　<span class="xm34b" style="color:#c58aff">心魔缠身·剩${XM34.left(G)}年</span>`);
    return r;
  };
  // 开发者面板·调试：触发心魔幻境（把修为补到可突破的金丹圆满）
  if (UI.p_dev) { const _pd = UI.p_dev; UI.p_dev = function (b, re, close, tab) {
    const r = _pd.apply(this, arguments);
    if ((tab || DEV.tab) === 'dbg') { const d = h('div', 'devg', '<button class="opt" data-a34="xm">触发心魔幻境</button><button class="opt" data-a34="xmd">心魔缠身 3 年</button>'); b.appendChild(d);
      d.addEventListener('click', e => { const t = e.target.closest('[data-a34]'); if (!t) return; e.stopPropagation(); const G = Game.G; G.dev = 1;
        if (t.dataset.a34 === 'xm') { if (G.realm < 3 || G.realm > 5) G.realm = 3; G.stage = 3; G.exp = Game.need(); G._xm34 = null; G.flags.awakened = 1; close && close(); setTimeout(() => Game.tryBreak(), 250); }
        if (t.dataset.a34 === 'xmd') { G.xm34 = { until: G.year + 3 }; UI.hud(); UI.toast('已附加心魔缠身 3 年'); }
        Game.save(); }); }
    return r;
  }; }
})();

'use strict';
// ======================= 2.8② 神通参悟悟道 =======================
// 设计：金丹（realm>=3）开启。
//   - 神通 SHENTONG：高耗灵/长CD的大招或被动，注册进 SKILLS 以复用 battle.js / rt27 的伤害与特效管线；
//     玩家已装备神通通过包裹 Game.skillList() 自动进入回合战与实时战技能槽（不重写战斗指令）。
//   - 悟道点 daoPoints：来自修炼顿悟/论道/秘境首通/路遇参悟；悟道树 6 分支永久加成并解锁神通。
//   - 论道：Talk.extra 链式注入高境界 NPC，辩题按属性给悟道点。
//   - 存档 G.shentong[]/G.shentongEq[]/G.daoPoints/G.dao{} 惰性兜底，不升 v。

// ---- 神通定义（注册进 SKILLS，复用既有 fx/k/el 管线） ----
Object.assign(SKILLS, {
  st_jianpo: { n: '一剑破万法', mp: 42, tg: 'one', k: 3.1, el: '金', fx: 'swordqi', ic: 'sk_swords', d: '神通·超高单体剑伤', cd: 8 },
  st_wanjian: { n: '万剑归宗', mp: 58, tg: 'all', k: 1.9, el: '金', fx: 'wanjian', ic: 'sk_swords', d: '神通·群体剑雨', cd: 12 },
  st_fenglei: { n: '风雷爆', mp: 50, tg: 'all', k: 1.6, el: '雷', fx: 'thunderall', ic: 'sk_thunder', d: '神通·群体雷伤40%眩晕', cd: 12, stun: 0.4 },
  st_hunyuan: { n: '混元护体', mp: 34, tg: 'self', k: 0, el: '无', fx: 'shield', ic: 'sk_shield', d: '神通·回复40%气血并护体', cd: 10, heal: 0.4 },
  st_douzhuan: { n: '斗转星移', mp: 46, tg: 'one', k: 2.6, el: '道', fx: 'dark', ic: 'sk_dark', d: '神通·高伤并吸取60%伤害为气血', cd: 10, drain: 0.6 },
});

const DAO28 = {
  // 神通槽：金丹起 2，元婴起 3
  slots() { const r = Game.G.realm; return r >= 4 ? 3 : r >= 3 ? 2 : 0; },
  unlocked() { return Game.G.shentong || []; },
  equipped() { return (Game.G.shentongEq || []).filter(s => this.unlocked().includes(s)).slice(0, this.slots()); },
  active() { return !!Game.G && Game.G.realm >= 3; },

  ensure() {
    const G = Game.G; if (!G) return;
    G.shentong = G.shentong || [];       // 已悟神通 id
    G.shentongEq = G.shentongEq || [];   // 已装备
    G.daoPoints = G.daoPoints || 0;     // 悟道点
    G.dao = G.dao || {};                 // 悟道树分支等级
    G.daoExp = G.daoExp || 0;            // 参悟次数统计
  },
  gainDao(n, src) {
    this.ensure(); const G = Game.G;
    G.daoPoints += n; G.daoExp++;
    UI.toast(`悟道点 +${n}（${src}）`, '#c8a0ff');
  },

  // ---- 悟道树 ----
  BRANCHES: [
    { id: 'jiandao', n: '剑道', ic: 'sk_swords', d: '每层：技能伤害+4%；3层解锁「一剑破万法」，5层「万剑归宗」', unlocks: { 3: 'st_jianpo', 5: 'st_wanjian' } },
    { id: 'fashu', n: '法术', ic: 'sk_light', d: '每层：法术伤害+4%；3层解锁「风雷爆」', unlocks: { 3: 'st_fenglei' } },
    { id: 'tipo', n: '体魄', ic: 'sk_dark', d: '每层：气血上限+6%、防御+3%' },
    { id: 'dandao', n: '丹道', ic: 'sk_meditate', d: '每层：丹药效果+8%（暂作永久加成占位）' },
    { id: 'xinjing', n: '心境', ic: 'sk_swords', d: '每层：灵力上限+5%、突破更稳' },
    { id: 'tiandao', n: '天道', ic: 'sk_light', d: '每层：悟道点获取+10%、全属性微增' },
  ],
  lv(br) { return (Game.G.dao && Game.G.dao[br]) || 0; },
  cost(lv) { return { pts: 1 + Math.floor(lv / 2), exp: Math.round(Game.yearExp() * 0.5 * (lv + 1)) }; },

  async learn(brId) {
    this.ensure(); const G = Game.G; const br = this.BRANCHES.find(b => b.id === brId); if (!br) return;
    const lv = this.lv(brId);
    if (lv >= 5) { UI.toast('此道已臻化境'); return; }
    const c = this.cost(lv);
    if (G.daoPoints < c.pts) { UI.toast('悟道点不足（论道/参悟获取）'); return; }
    const cfm = await UI.card('参悟悟道', `${br.n}　当前 ${lv} 层 → ${lv + 1} 层\n\n${br.d}\n\n消耗：悟道点 ${c.pts}`, 'i:book_o', ['参悟', '再想想']);
    if (cfm !== 0) return;
    if (G.daoPoints < c.pts) { UI.toast('悟道点不足'); return; }
    G.daoPoints -= c.pts;
    G.dao[brId] = lv + 1; G.daoExp++;
    Sfx.play('magic');
    // 解锁神通
    let msg = '';
    if (br.unlocks && br.unlocks[lv + 1]) {
      const sid = br.unlocks[lv + 1];
      if (!G.shentong.includes(sid)) { G.shentong.push(sid); msg = `\n\n悟得神通【${SKILLS[sid].n}】！（去「神通」页装备）`; }
    }
    // 小概率顿悟/走火
    const roll = Math.random();
    if (roll < 0.12) { G.daoPoints += 1; msg += '\n\n灵光一闪！顿悟（悟道点+1）。'; Sfx.play('levelup'); }
    else if (roll < 0.20) { const s = Game.stats(); G.hp = Math.max(1, Math.round(G.hp - s.mhp * 0.15)); msg += '\n\n心魔扰动……气血-15%（走火入魔的边缘）。'; R.shake = 0.6; Sfx.play('thunder'); }
    Game.save();
    await UI.card('参悟有成', `${br.n} 提升至 ${lv + 1} 层。${msg}`, 'i:book_o', ['继续']);
    UI.hud();
  },

  async toggleEquip(sid) {
    this.ensure(); const G = Game.G;
    if (!G.shentong.includes(sid)) return;
    const i = G.shentongEq.indexOf(sid);
    if (i >= 0) G.shentongEq.splice(i, 1);
    else {
      if (G.shentongEq.length >= this.slots()) { UI.toast(`神通槽已满（${this.slots()}个，提升境界解锁更多）`); return; }
      G.shentongEq.push(sid);
    }
    Game.save();
  },

  // ---- 论道 ----
  async discuss(npcId) {
    this.ensure(); const G = Game.G; const N = NPCS[npcId]; if (!N) return;
    if (G.daoPoints < 0) return;
    const topic = pick(['天道有债，该不该还？', '修仙是为了长生还是逍遥？', '剑与法，何为大道？']);
    const c = await UI.say(N.por, N.n, `论道：「${topic}」\n\n你以何立场辩？`, ['据理力争（智）', '以情动人（魅）', '听君一言']);
    if (c === 2) { await UI.say(N.por, N.n, '“道可道，非常道。回去再修修吧。”', ['……']); return; }
    const attr = c === 0 ? G.st.int : G.st.cha;
    const good = attr >= 6 + G.realm * 1.5 ? true : attr >= 3 + G.realm ? Math.random() < 0.5 : false;
    if (good) {
      const gain = 1 + (G.dao.tiandao ? Math.round(G.dao.tiandao * 0.2) : 0);
      this.gainDao(gain, '与' + N.n + '论道');
      Sfx.play('levelup');
      await UI.say(N.por, N.n, pick(['“善哉，与君一席话，胜修百年。”', '“有意思，你这想法……有点意思。”', '“看来你对大道颇有见地。”']) + `\n（悟道点+${gain}）`, ['受教']);
    } else {
      await UI.say(N.por, N.n, pick(['“……还差些火候。”', '“嗯，有点道理，但没说到根上。”']), ['多谢指点']);
    }
  },
};

// ---- 接入：已装备神通自动进入战斗技能表 ----
(function () {
  const _sl = Game.skillList;
  Game.skillList = function () {
    const arr = _sl.call(this);
    try {
      if (DAO28.active()) for (const sid of DAO28.equipped()) if (!arr.includes(sid)) arr.push(sid);
    } catch (e) { }
    return arr;
  };
  // 接入：悟道树永久加成到 stats
  const _st = Game.stats;
  Game.stats = function () {
    const s = _st.call(this);
    try {
      const d = (this.G && this.G.dao) || {};
      s.mhp *= 1 + 0.06 * (d.tipo || 0);
      s.mmp *= 1 + 0.05 * (d.xinjing || 0);
      s.atk *= 1 + 0.04 * ((d.jiandao || 0) + (d.fashu || 0));
    } catch (e) { }
    return s;
  };
  // 接入：Talk.extra 链式注入论道
  const _ex = Talk.extra;
  Talk.extra = function (id) {
    const out = _ex ? _ex.call(this, id) : [];
    const G = Game.G;
    if (G && DAO28.active() && (NPCS[id] && (NPCS[id].comp || ['mentor', 'elder', 'guzhu', 'xiaoyao', 'leigong', 'master'].includes(id)))) {
      out.push(['论道（悟道点）', () => DAO28.discuss(id)]);
    }
    return out;
  };
  // 接入：实时战神通按钮（在 RT27.start 后追加已装备神通槽）
  if (typeof RT27 !== 'undefined' && RT27.start) {
    const _start = RT27.start;
    RT27.start = function (enemies, opts) {
      return _start.call(this, enemies, opts).then(res => {
        try {
          if (this.on && DAO28.active()) {
            for (const sid of DAO28.equipped()) {
              if (!this.skills.find(s => s.id === sid)) this.skills.push({ id: sid, cd: 0, cdMax: (SKILLS[sid].cd || 8) });
            }
            if (this._ui) this._ui(true);
          }
        } catch (e) { console.error('dao28 rt inject', e); }
        return res;
      });
    };
  }
})();

// ---- UI：参悟悟道面板 ----
(function () {
  function install() {
    if (typeof UI === 'undefined' || !UI.p_more) { setTimeout(install, 300); return; }
    UI.titles.dao28 = '参悟悟道';
    UI.p_dao28 = function (b, re, close) {
      DAO28.ensure(); const G = Game.G;
      const can = DAO28.active();
      let h = `<p class="hint">悟道点：<b style="color:#c8a0ff">${G.daoPoints}</b>　神通槽：${DAO28.equipped().length}/${DAO28.slots()}　${can ? '' : '（金丹期开启）'}</p>`;
      if (!can) { b.innerHTML = h + '<p class="empty">金丹结成后，方可参悟大道、御使神通。</p>'; return; }
      // 神通区
      const sh = DAO28.unlocked();
      h += '<h4>神通（点击装备/卸下）</h4>';
      if (!sh.length) h += '<p class="empty">参悟剑道/法术分支可悟得神通。</p>';
      else h += '<div class="grid2">' + sh.map(sid => {
        const eq = G.shentongEq.includes(sid); const S = SKILLS[sid];
        return `<button class="big2 dao-sk ${eq ? 'on' : ''}" data-sid="${sid}" style="${eq ? 'border:2px solid #c8a0ff;' : ''}"><i style="${(S.ic && iconCss(S.ic, 40)) || ''}"></i>${S.n}<small>${S.mp}灵/CD${S.cd}s</small></button>`;
      }).join('') + '</div>';
      // 悟道分支
      h += '<h4>悟道分支</h4>';
      h += DAO28.BRANCHES.map(br => {
        const lv = DAO28.lv(br.id); const c = DAO28.cost(lv);
        const max = lv >= 5;
        return `<div class="it"><i style="${iconCss(br.ic, 40)}"></i><div><b>${br.n}　Lv.${lv}${max ? '（满）' : ''}</b><small>${br.d}</small></div>
          <button class="sm buy" data-br="${br.id}" ${max || G.daoPoints < c.pts ? 'disabled' : ''}>${max ? '已满' : `参悟·${c.pts}点`}</button></div>`;
      }).join('');
      b.innerHTML = h;
      b.querySelectorAll('.dao-sk').forEach(el => el.onclick = async e => { e.stopPropagation(); await DAO28.toggleEquip(el.dataset.sid); re(); });
      b.querySelectorAll('[data-br]').forEach(el => el.onclick = async e => { e.stopPropagation(); await DAO28.learn(el.dataset.br); re(); });
    };
    // 在「更多」网格加入口
    const _more = UI.p_more;
    UI.p_more = function (b, re, close) {
      _more.call(this, b, re, close);
      const btn = document.createElement('button');
      btn.className = 'big2'; btn.setAttribute('data-k', 'dao28');
      btn.innerHTML = '<i style="' + iconCss('sk_meditate', 48) + '"></i>参悟悟道';
      b.querySelector('.grid2').appendChild(btn);
    };
  }
  install();
})();

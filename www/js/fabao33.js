'use strict';
// ======================= 3.3② 本命法宝 + 器灵（docs/research_v33.md §2）=======================
// 洞府面板里新增「本命法宝」：筑基解锁，6 选 1，1→9 阶；6 阶诞生器灵（好感 0–100，可对话/擦拭）；9 阶且好感 100 解锁专属神通。
// 升阶（n→n+1）：灵石 300×2.2^n（四舍五入）、玄铁晶 n、n≥5 时妖丹 n−4；成功率 max(40%, 100%−8%×n)；失败不掉阶、返还 50% 灵石。
// 更换本命法宝：需确认，返还 70% 已投入灵石。存档：G.fb33 = { id, tier, spent, aff, wipe }（老档无此字段 = 未炼）。
const FABAO = {
  fb_jian: { n: '青萍剑', ic: 'sword_o', stat: 'atk', per: 0.04, sd: '攻击', ling: '剑灵·青萍', sk: 'fbs_jian' },
  fb_ding: { n: '镇岳鼎', ic: 'furnace', stat: 'def', per: 0.05, sd: '防御', ling: '鼎灵·老鼎', sk: 'fbs_ding' },
  fb_ling: { n: '摄魂铃', ic: 'bill', stat: 'crit', per: 0.02, sd: '暴击', ling: '铃灵·叮当', sk: 'fbs_ling' },
  fb_suan: { n: '天机算盘', ic: 'abacus', stat: 'stone', per: 0.04, sd: '斗法灵石', ling: '算灵·账房先生', sk: 'fbs_suan' },
  fb_hulu: { n: '紫金葫芦', ic: 'stone_r', stat: 'mp', per: 0.05, sd: '灵力（回灵）', ling: '葫芦灵·阿紫', sk: 'fbs_hulu' },
  fb_jing: { n: '照妖镜', ic: 'sk_light', stat: 'spd', per: 0.03, sd: '身法（命中）', ling: '镜灵·无面', sk: 'fbs_jing' },
};
Object.assign(SKILLS, {
  fbs_jian: { n: '万剑归宗·青萍', mp: 40, tg: 'all', k: 3.0, el: '金', fx: 'wanjian', ic: 'sk_swords', d: '法宝神通：全体 300% 伤害', cd: 5 },
  fbs_ding: { n: '鼎镇山河', mp: 30, tg: 'self', k: 0, fx: 'shield', ic: 'sk_shield', d: '法宝神通：3 回合防御大增（约减伤 50%）', buff: 'def' },
  fbs_ling: { n: '摄魂', mp: 30, tg: 'one', k: 1.0, el: '暗', fx: 'deny', ic: 'sk_dark', d: '法宝神通：50% 令敌人跳过 1 回合', stun: 0.5 },
  fbs_suan: { n: '一笔勾销', mp: 30, tg: 'one', k: 1.4, el: '金', fx: 'coin', ic: 'sk_metal', d: '法宝神通：重击；本命算盘使斗法灵石再 +20%' },
  fbs_hulu: { n: '收', mp: 10, tg: 'one', k: 1.5, el: '无', fx: 'light', ic: 'sk_heal', d: '法宝神通：吸摄敌人，回复 30% 灵力', mana: 0.3 },
  fbs_jing: { n: '照妖', mp: 26, tg: 'one', k: 2.2, el: '光', fx: 'light', ic: 'sk_light', d: '法宝神通：照破原形，单体 220% 伤害' },
});
const FB_LINES = {
  any: ['“擦轻点！我是法宝，不是抹布。”', '“你今天又欠了谁的钱？我闻得出来。”', '“我上一任主人也说要带我飞升，后来他飞去当铺了。”', '“打架记得先喊我，别等快输了才想起来。”', '“灵石不够就别硬升阶，碎了你可赔不起。”', '“你听，外面有讨债的脚步声。……开玩笑的。”'],
  a50: '“……其实你这人还行。至少你没把我押进鬼市。”',
  a100: '“从今天起，我的锋芒就是你的锋芒。三界的账，我们一起算。”',
};
const FB33 = {
  cost(n) { return { stone: Math.round(300 * Math.pow(2.2, n)), ore: n, yd: n >= 5 ? n - 4 : 0, rate: Math.max(0.4, 1 - 0.08 * n) }; },
  st() { const G = Game.G; return G && G.fb33 && FABAO[G.fb33.id] ? G.fb33 : null; },
  unlocked() { const G = Game.G; return G && G.realm >= 2; },
  bonus(stat) { const f = this.st(); return f && FABAO[f.id].stat === stat ? FABAO[f.id].per * f.tier : 0; },
  today() { const d = new Date(Date.now() - 5 * 3600e3); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }, // 本地 05:00 刷新
  addAff(n) { const f = this.st(); if (!f || f.tier < 6) return 0; const mul = (typeof MG33 !== 'undefined' && MG33.has('qiling')) ? 1.3 : 1; const add = Math.round(n * mul); const before = f.aff || 0; f.aff = Math.min(100, before + add); if (before < 100 && f.aff >= 100 && f.tier >= 9) UI.toast(`${FABAO[f.id].ling}：专属神通「${SKILLS[FABAO[f.id].sk].n}」已解锁！`, '#ffc84a'); return f.aff - before; },
  async choose(id) {
    const G = Game.G; const f = this.st();
    if (f && f.id === id) return;
    if (f) { const back = Math.round((f.spent || 0) * 0.7); const c = await UI.card('更换本命法宝', `更换后【${FABAO[f.id].n}】的阶位与器灵都会消散，返还已投入灵石的 70%：${back} 灵石。\n确定改炼【${FABAO[id].n}】？`, 'i:' + FABAO[id].ic, ['确定更换', '算了']); if (c !== 0) return; G.stone += back; }
    G.fb33 = { id, tier: 1, spent: 0, aff: 0, wipe: 0 }; Game.save(); UI.toast(`本命法宝：${FABAO[id].n}（1 阶）`, '#ffc84a');
  },
  async up() {
    const G = Game.G; const f = this.st(); if (!f || f.tier >= 9) return; const c = this.cost(f.tier);
    if (G.stone < c.stone || !Game.has('ore', c.ore) || (c.yd && !Game.has('yd', c.yd))) { UI.toast('材料不足'); return; }
    G.stone -= c.stone; Game.take('ore', c.ore); if (c.yd) Game.take('yd', c.yd);
    if (Math.random() < c.rate) {
      f.tier++; f.spent = (f.spent || 0) + c.stone; Sfx.play('gong', 0.6);
      if (f.tier === 6) await UI.card('器灵诞生', `${FABAO[f.id].n}嗡的一声，从器身里钻出一个小小的影子——\n${FABAO[f.id].ling}：“${FB_LINES.any[0].slice(1, -1)}……咳，初次见面。以后请多擦擦我。”\n\n（洞府·本命法宝里可以与器灵对话、擦拭法宝提升好感）`, 'i:' + FABAO[f.id].ic, ['好']);
      else UI.toast(`升阶成功！${FABAO[f.id].n} ${f.tier} 阶`, '#ffc84a');
      if (f.tier >= 9 && (f.aff || 0) >= 100) UI.toast(`专属神通「${SKILLS[FABAO[f.id].sk].n}」已解锁！`, '#ffc84a');
    } else { const back = Math.round(c.stone * 0.5); G.stone += back; f.spent = (f.spent || 0) + c.stone - back; await UI.card('升阶失败', `法宝光芒一闪即灭，阶位未掉。\n返还 50% 灵石：${back}（玄铁晶/妖丹已消耗）`, 'i:' + FABAO[f.id].ic, ['好']); }
    Game.save();
  },
  async talk() {
    const f = this.st(); if (!f || f.tier < 6) return; const F = FABAO[f.id]; const a = f.aff || 0;
    const line = a >= 100 && !f.s100 ? (f.s100 = 1, FB_LINES.a100) : a >= 50 && !f.s50 ? (f.s50 = 1, FB_LINES.a50) : pick(FB_LINES.any);
    await UI.say('i:' + F.ic, F.ling + `（好感 ${a}）`, line, ['……']); Game.save();
  },
  wipe() { const f = this.st(); if (!f || f.tier < 6) return; const d = this.today(); if (f.wipe === d) { UI.toast('今天已经擦过了（每天 05:00 刷新）'); return; } f.wipe = d; const got = this.addAff(5); if (typeof DAILY33 !== 'undefined') DAILY33.inc('wipe'); UI.toast(`擦拭法宝：器灵好感 +${got}`); Game.save(); },
  html() {
    const G = Game.G; const f = this.st();
    if (!this.unlocked()) return `<div class="fb33"><b>本命法宝</b><p class="hint">🔒 筑基期解锁</p></div>`;
    if (!f) return `<div class="fb33"><b>本命法宝</b><p class="hint">选一件炼为本命法宝（之后可更换，返还 70% 已投入灵石）</p><div class="devg">${Object.entries(FABAO).map(([id, F]) => `<button class="opt" data-fb="pick" data-v="${id}">${F.n}<small>每阶${F.sd}+${Math.round(F.per * 100)}%</small></button>`).join('')}</div></div>`;
    const F = FABAO[f.id]; const c = f.tier < 9 ? this.cost(f.tier) : null; const sk = SKILLS[F.sk];
    return `<div class="fb33"><b>本命法宝：${F.n} · ${f.tier} 阶</b><p>${F.sd} +${Math.round(F.per * f.tier * 100)}%</p>
      ${c ? `<p class="hint">升到 ${f.tier + 1} 阶：灵石 ${c.stone}、玄铁晶 ${c.ore}${c.yd ? `、妖丹 ${c.yd}` : ''}；成功率 ${Math.round(c.rate * 100)}%（失败不掉阶，返还 50% 灵石）</p><button class="opt" data-fb="up">升阶</button>` : '<p class="hint">已满 9 阶</p>'}
      ${f.tier >= 6 ? `<p>${F.ling} · 好感 ${f.aff || 0}/100</p><button class="opt" data-fb="talk">与器灵交谈</button><button class="opt" data-fb="wipe">擦拭法宝</button>` : `<p class="hint">6 阶诞生器灵</p>`}
      <p class="hint">专属神通「${sk.n}」：${f.tier >= 9 && (f.aff || 0) >= 100 ? '已解锁（已加入斗法技能）' : '需 9 阶且器灵好感 100'}</p>
      <details><summary>更换本命法宝</summary><div class="devg">${Object.entries(FABAO).filter(([id]) => id !== f.id).map(([id, F2]) => `<button class="opt" data-fb="pick" data-v="${id}">${F2.n}</button>`).join('')}</div></details></div>`;
  },
};
(function () {
  const _pc = UI.p_cave; UI.p_cave = function (b, re) {
    const r = _pc.apply(this, arguments);
    const d = h('div', 'fb33wrap', FB33.html()); b.appendChild(d);
    d.addEventListener('click', async e => { const t = e.target.closest('[data-fb]'); if (!t) return; e.stopPropagation(); Sfx.play('click'); const a = t.dataset.fb;
      if (a === 'pick') await FB33.choose(t.dataset.v); else if (a === 'up') await FB33.up(); else if (a === 'talk') await FB33.talk(); else if (a === 'wipe') FB33.wipe();
      d.innerHTML = FB33.html(); UI.hud(); });
    return r;
  };
  const _st = Game.stats; Game.stats = function () { const s = _st.apply(this, arguments); if (!this.G) return s; s.atk *= 1 + FB33.bonus('atk'); s.def *= 1 + FB33.bonus('def'); s.crit += FB33.bonus('crit'); s.mmp = Math.round(s.mmp * (1 + FB33.bonus('mp'))); s.mpregen = (s.mpregen || 0) + FB33.bonus('mp') * 0.2; s.spd *= 1 + FB33.bonus('spd'); return s; };
  const _sl = Game.skillList; Game.skillList = function () { const arr = _sl.apply(this, arguments); const f = FB33.st(); if (f && f.tier >= 9 && (f.aff || 0) >= 100) { const k = FABAO[f.id].sk; if (!arr.includes(k)) arr.push(k); } return arr; };
  const _f = Game.fight; Game.fight = async function (mon, opts = {}) { const G = this.G; const s0 = G ? G.stone : 0; const r = await _f.apply(this, arguments); if (G && r && r.res === 'win') { const b = FB33.bonus('stone') + (FB33.st() && FB33.st().id === 'fb_suan' && FB33.st().tier >= 9 && FB33.st().aff >= 100 ? 0.2 : 0); if (b && G.stone > s0) G.stone += Math.round((G.stone - s0) * b); if ((opts.boss || (MONS[mon] && MONS[mon].boss))) FB33.addAff(2); } return r; };
  const css = document.createElement('style'); css.textContent = `.fb33{margin-top:12px;padding:10px;border-radius:10px;background:rgba(255,200,74,.10);border:1px solid rgba(255,200,74,.4)}.fb33>b{display:block;font-size:16px;color:#ffd77a}.fb33 p{margin:4px 0}.fb33 .opt small{display:block;font-size:11px;opacity:.8}`; document.head.appendChild(css);
})();

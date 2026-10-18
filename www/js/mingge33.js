'use strict';
// ======================= 3.3① 先天命格（docs/research_v33.md §1）=======================
// 新开局（含轮回/来世）进地图后弹「先天命格」：6 抽 3，可免费重抽 1 次；老存档弹一次「补选命格」，只选 1 个。
// 存档：G.mingge（数组；新局创建时为 null 表示待选；老档 undefined → 补选）、G.flags.mg33_once（一次性加成已结算）。
// 接入：包裹 Game.newLife / enterMap / stats / lifeMax / fight / tribulation / yearEnd，不改本体。
const MINGGE = [
  { id: 'tieshen', n: '铁骨', q: 0, d: '气血上限 +10%' },
  { id: 'jianzhi', n: '剑痴', q: 0, d: '技能伤害 +12%（剑修本色）' },
  { id: 'caimi', n: '财迷', q: 0, d: '斗法灵石收益 +15%' },
  { id: 'yaoxiang', n: '药香', q: 0, d: '炼丹成功率 +5%' },
  { id: 'changshou', n: '长寿相', q: 0, d: '寿元上限 +8%' },
  { id: 'kouhua', n: '嘴炮', q: 0, d: 'NPC 好感获取 +20%（你还有一张嘴）' },
  { id: 'wuxing', n: '悟性通透', q: 1, d: '修为获取 +12%' },
  { id: 'duanjie', n: '抗雷体', q: 1, d: '渡劫失败时损失的修为减半' },
  { id: 'fuyuan', n: '福缘深厚', q: 1, d: '气运 +2（奇遇/事件更易出现）' },
  { id: 'qiling', n: '器灵亲和', q: 1, d: '器灵好感获取 +30%' },
  { id: 'shoulei', n: '兽语', q: 1, d: '灵兽捕获率 +15%' },
  { id: 'nitian', n: '逆天者', q: 2, d: '突破成功率 +8 个百分点（封顶 95%）' },
  { id: 'tiandao_vip', n: '天道VIP', q: 2, d: '天道欠款利息 -30%（讨债司对你格外客气）' },
  { id: 'tianmo', n: '天魔种', q: 2, d: '修为获取 +25%；心魔幻境难度 +1 档（3.4）' },
  { id: 'huanghun', n: '黄昏客', q: 2, d: '寿元剩余 <10% 时全属性 +20%' },
  { id: 'dao_xin', n: '道心无暇', q: 2, d: '心魔幻境保底「小成」（3.4 开放）' },
];
const MG_Q = [['凡', '#c8c8c8'], ['灵', '#7ac8ff'], ['天', '#ffc84a']];
const MG33 = {
  W: [60, 32, 8],
  get(id) { return MINGGE.find(m => m.id === id); },
  has(id) { const G = Game.G; return !!(G && Array.isArray(G.mingge) && G.mingge.includes(id)); },
  roll(n = 6, rng = Math.random) { // 按品质权重 60/32/8 抽 n 个不重复；tianmo 与 dao_xin 互斥
    const out = [];
    for (let guard = 0; out.length < n && guard < 500; guard++) {
      const pool = MINGGE.filter(m => !out.includes(m.id) && !(m.id === 'tianmo' && out.includes('dao_xin')) && !(m.id === 'dao_xin' && out.includes('tianmo')));
      if (!pool.length) break; const w = pool.map(m => this.W[m.q]); let r = rng() * w.reduce((a, b) => a + b), k = 0;
      for (; k < pool.length - 1; k++) { r -= w[k]; if (r <= 0) break; } out.push(pool[k].id);
    }
    return out;
  },
  applyOnce(G) { // 一次性写入现有加成字段（存档里保留，不重复结算）
    G.flags = G.flags || {}; G.flags.mg33_once = G.flags.mg33_once || {};
    for (const id of G.mingge || []) {
      if (G.flags.mg33_once[id]) continue; G.flags.mg33_once[id] = 1;
      if (id === 'wuxing') G.cultBonus = (G.cultBonus || 0) + 0.12;
      if (id === 'tianmo') G.cultBonus = (G.cultBonus || 0) + 0.25;
      if (id === 'nitian') G.brkBonus = (G.brkBonus || 0) + 0.08;
      if (id === 'yaoxiang') G.alchBonus = (G.alchBonus || 0) + 0.05;
      if (id === 'shoulei') G.catchBonus = (G.catchBonus || 0) + 0.15;
      if (id === 'fuyuan') G.st.luck = (G.st.luck || 0) + 2;
    }
  },
  // 选择界面：6 个命格卡（点选/取消），按钮「确定」「重抽一次」。不足 n 个时「确定」显示为「随缘补齐」，自动按顺序补满（方便不想细选的玩家）。
  pick(n, title, sub) {
    const run = () => new Promise(res => {
      let cand = this.roll(6), sel = [], rerolled = n < 3; // 补选（只选 1 个）不提供重抽
      const w = h('div', 'mwrap mg33w'); const c = h('div', 'card mg33');
      const draw = () => {
        c.innerHTML = `<div class="ct">${esc(title)}</div><div class="mgsub">${esc(sub)}（已选 ${sel.length}/${n}）</div><div class="mglist">${cand.map(id => { const m = this.get(id); const Q = MG_Q[m.q]; return `<div class="mgc${sel.includes(id) ? ' on' : ''}" data-id="${id}" style="border-color:${Q[1]}"><b style="color:${Q[1]}">【${Q[0]}】${esc(m.n)}</b><small>${esc(m.d)}</small></div>`; }).join('')}</div>
          <div class="opts"><button class="opt" data-k="ok">${sel.length >= n ? '确定' : '随缘补齐'}</button>${n < 3 ? "" : rerolled ? "<button class=\"opt\" data-k=\"re\" disabled>重抽一次（已用）</button>" : "<button class=\"opt\" data-k=\"re\">重抽一次</button>"}</div>`;
      };
      draw(); w.appendChild(c); UI.push(w);
      c.onclick = e => {
        const card = e.target.closest('.mgc');
        if (card) { const id = card.dataset.id; Sfx.play('click'); if (sel.includes(id)) sel = sel.filter(x => x !== id); else if (sel.length < n) sel.push(id); else { sel.shift(); sel.push(id); } draw(); return; }
        const b = e.target.closest('.opt'); if (!b) return; Sfx.play('click');
        if (b.dataset.k === 're') { rerolled = true; cand = this.roll(6); sel = []; draw(); return; }
        for (const id of cand) { if (sel.length >= n) break; if (!sel.includes(id) && !(id === 'tianmo' && sel.includes('dao_xin')) && !(id === 'dao_xin' && sel.includes('tianmo'))) sel.push(id); }
        UI.pop(w); res(sel.slice(0, n));
      };
    });
    const p = UI._q.then(run); UI._q = p.catch(() => { }); return p;
  },
  async ensure() {
    const G = Game.G; if (!G || G.dead) return; if (G._mgAsking) delete G._mgAsking; // 旧版把临时标记写进了存档（弹窗时关游戏 → 永远不再弹），这里清掉
    if (this._askG === G) return; // 正在弹窗：标记只放内存，不进存档
    if (Array.isArray(G.mingge) && G.mingge.length) return this.applyOnce(G);
    if (Array.isArray(G.mingge) && G.flags && G.flags.mg33_done) return;
    this._askG = G;
    try {
      const fresh = G.mingge === null;
      const ids = await this.pick(fresh ? 3 : 1, fresh ? '先天命格' : '补选命格', fresh ? '投胎时天道随手塞给你几张命签，挑 3 张带走' : '3.3 新增先天命格：老朋友也送一张，挑 1 个');
      G.mingge = ids; G.flags = G.flags || {}; G.flags.mg33_done = 1; this.applyOnce(G);
      UI.toast('先天命格：' + ids.map(id => this.get(id).n).join('、'), '#ffc84a'); UI.hud(); Game.save();
    } finally { if (this._askG === G) this._askG = null; }
  },
};
(function () {
  const _nl = Game.newLife; Game.newLife = function (cfg) { const r = _nl.apply(this, arguments); if (this.G) this.G.mingge = null; return r; };
  const _em = Game.enterMap; Game.enterMap = async function (id) { const r = await _em.apply(this, arguments); setTimeout(() => MG33.ensure(), 50); return r; };
  const _st = Game.stats; Game.stats = function () {
    const s = _st.apply(this, arguments); const G = this.G; if (!G || !Array.isArray(G.mingge)) return s;
    if (G.mingge.includes('tieshen')) s.mhp = Math.round(s.mhp * 1.1);
    if (G.mingge.includes('jianzhi')) s.skillBonus = (s.skillBonus || 0) + 0.12;
    if (G.mingge.includes('huanghun') && (this.lifeMax() - G.age) < this.lifeMax() * 0.1) { s.mhp = Math.round(s.mhp * 1.2); s.atk *= 1.2; s.def *= 1.2; s.spd *= 1.2; }
    return s;
  };
  const _lm = Game.lifeMax; Game.lifeMax = function () { const v = _lm.apply(this, arguments); return MG33.has('changshou') ? Math.round(v * 1.08) : v; };
  const _f = Game.fight; Game.fight = async function () { const G = this.G; const s0 = G ? G.stone : 0; const r = await _f.apply(this, arguments); if (G && r && r.res === 'win' && MG33.has('caimi') && G.stone > s0) { const add = Math.round((G.stone - s0) * 0.15); G.stone += add; } return r; };
  if (Game.tribulation) { const _t = Game.tribulation; Game.tribulation = async function () { const G = this.G; const e0 = G ? G.exp : 0; const ok = await _t.apply(this, arguments); if (G && !ok && MG33.has('duanjie') && G.exp < e0) { const back = Math.round((e0 - G.exp) / 2); G.exp += back; UI.toast(`抗雷体：保住修为 ${back}`); } return ok; }; }
  const _ye = Game.yearEnd; Game.yearEnd = async function () { const G = this.G; const d0 = G ? G.debt : 0; const r = await _ye.apply(this, arguments); if (G && MG33.has('tiandao_vip') && d0 > 0 && G.debt > d0) { const cut = Math.floor((G.debt - d0) * 0.3); G.debt -= cut; } return r; };
  // 好感 +20%：闲聊/送礼等写入 G.aff 后按差额补发（每次对话结束结算）
  const _say = UI.say; UI.say = function (por, name, text, opts) { const G = Game.G; const a0 = G && MG33.has('kouhua') ? Object.assign({}, G.aff) : null; const p = _say.apply(this, arguments); if (a0) p.then(() => { for (const k in G.aff) { const d = (G.aff[k] || 0) - (a0[k] || 0); if (d > 0) G.aff[k] += Math.round(d * 0.2); } }); return p; };
  // 角色面板：显示命格
  const _pc = UI.p_char; UI.p_char = function (b, re) { const r = _pc.apply(this, arguments); const G = Game.G; if (G && Array.isArray(G.mingge) && G.mingge.length) { const d = h('div', 'mg33row', '<b>先天命格</b>' + G.mingge.map(id => { const m = MG33.get(id); return m ? `<span style="color:${MG_Q[m.q][1]}">【${MG_Q[m.q][0]}】${esc(m.n)}</span><small>${esc(m.d)}</small>` : ''; }).join('')); b.appendChild(d); } return r; };
  const css = document.createElement('style'); css.textContent = `.mg33{max-width:380px}.mg33 .mgsub{font-size:13px;color:#d8c8a8;margin:2px 0 8px;text-align:center}.mglist{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}.mgc{border:2px solid #888;border-radius:10px;padding:8px;background:rgba(30,20,40,.55);min-height:64px}.mgc b{display:block;font-size:15px}.mgc small{display:block;font-size:12px;color:#eee;margin-top:3px;line-height:1.3}.mgc.on{background:rgba(255,200,74,.28);box-shadow:0 0 10px #ffc84a}.mg33row{margin-top:10px;padding:8px;border-radius:8px;background:rgba(0,0,0,.2)}.mg33row b{display:block;margin-bottom:4px}.mg33row span{display:inline-block;margin-right:6px;font-weight:bold}.mg33row small{display:block;font-size:12px;opacity:.85;margin-bottom:3px}`; document.head.appendChild(css);
})();

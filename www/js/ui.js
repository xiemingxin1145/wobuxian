'use strict';
// ======================= 界面 =======================
const $ = s => document.querySelector(s);
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const UI = {
  stack: [], get modal() { return this.stack.length > 0; },
  init() {
    $('#menu').innerHTML = [['bag', '背包', 'bag'], ['char', '角色', 'robe_b'], ['skills', '功法', 'book_b'], ['pets', '灵兽', 'egg'], ['comps', '伙伴', 'jade'], ['quests', '任务', 'scroll'], ['travel', '御剑', 'sword_b'], ['more', '更多', 'bell']]
      .map(([k, n, ic]) => `<button class="mb" data-p="${k}"><i style="${iconCss(ic, 34)}"></i><span>${n}</span></button>`).join('');
    $('#menu').onclick = e => { const b = e.target.closest('.mb'); if (b && !this.modal && !Game._busy) { Sfx.play('click'); this.panel(b.dataset.p); } };
    $('#yearbtn').onclick = () => { if (this.modal || Game._busy || B.on) return; Sfx.play('click'); this.confirmYear(); };
    $('#brkbtn').onclick = () => { if (this.modal || Game._busy) return; Game.tryBreak(); };
    $('#hud .por').onclick = () => { if (!this.modal) this.panel('char'); };
    $('#qt').onclick = () => { if (!this.modal) this.panel('quests'); };
  },
  async confirmYear() {
    const G = Game.G;
    if (G.ap > 0) { const c = await this.card('过年', `今年还剩 ${G.ap} 点行动力。\n剩余行动力会转化为少量修为。确定要过年吗？`, 'i:coin', ['过年', '再逛逛']); if (c !== 0) return; }
    await Game.yearEnd();
  },
  hud(hpOv) {
    const G = Game.G; if (!G) return; const s = Game.stats(); const hp = hpOv !== undefined ? hpOv : G.hp;
    $('#hud .por').style.cssText = porCss(Game.playerSpr(), 60);
    $('#hud .nm').textContent = G.name; $('#hud .rl').textContent = Game.realmName();
    $('#hud .age').textContent = `${G.age}岁 / 寿${Game.lifeMax()}`;
    $('#hp i').style.width = Math.max(0, Math.min(100, hp / s.mhp * 100)) + '%'; $('#hp b').textContent = `${Math.round(hp)}/${s.mhp}`;
    $('#mp i').style.width = Math.max(0, Math.min(100, G.mp / s.mmp * 100)) + '%';
    $('#xp i').style.width = Math.min(100, G.exp / Game.need() * 100) + '%'; $('#xp b').textContent = G.realm >= 7 ? '飞升' : `${fmt(G.exp)}/${fmt(Game.need())}`;
    $('#money').innerHTML = `<i style="${iconCss('stone', 22)}"></i>${fmt(G.stone)}　<span class="debt">欠 ${fmt(G.debt)}</span>`;
    $('#ap').innerHTML = '行动力 ' + Array.from({ length: Game.apMax() }, (_, k) => `<i class="${k < G.ap ? 'on' : ''}"></i>`).join('');
    $('#yearbtn').innerHTML = `<b>过年</b><small>第${G.year}年</small>`;
    $('#brkbtn').style.display = Game.canBreak() ? 'block' : 'none';
    const M = MAIN[G.main]; const bq = Object.keys(G.quests).length;
    $('#qt').innerHTML = `<b>${M ? M.n : ''}</b><span>${M ? M.d : ''}</span>${bq ? `<em>支线 ${bq} 个进行中</em>` : ''}`;
  },
  toast(t, c = '#fff') { const e = h('div', 'toast', esc(t)); e.style.color = c; $('#toasts').appendChild(e); setTimeout(() => e.classList.add('out'), 2200); setTimeout(() => e.remove(), 2800); while ($('#toasts').children.length > 4) $('#toasts').firstChild.remove(); },
  banner(n, d) { const b = $('#banner'); b.innerHTML = `<b>${n}</b><span>${d || ''}</span>`; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); },
  loading(on) { $('#loading').style.display = on ? 'flex' : 'none'; },
  fade(on, ms = 350) { const f = $('#fade'); f.style.transition = `opacity ${ms / B.speed}ms`; f.style.opacity = on ? 1 : 0; f.style.pointerEvents = on ? 'auto' : 'none'; return new Promise(r => setTimeout(r, ms / B.speed + 20)); },
  async flashIn() { const f = $('#swirl'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); await new Promise(r => setTimeout(r, 450 / B.speed)); },
  yearFx(age, g) { const e = h('div', 'yearfx', `<b>${age} 岁</b><span>修为 +${fmt(g)}</span>`); document.body.appendChild(e); Sfx.play('gong', 0.5); setTimeout(() => e.remove(), 1800 / B.speed); },
  push(el) { $('#modals').appendChild(el); this.stack.push(el); requestAnimationFrame(() => el.classList.add('in')); },
  pop(el) { this.stack = this.stack.filter(x => x !== el); el.classList.remove('in'); el.classList.add('outm'); setTimeout(() => el.remove(), 180); },
  _q: Promise.resolve(),
  card(title, text, por, opts = ['好'], extra = {}) {
    const run = () => new Promise(res => {
      const w = h('div', 'mwrap'); const c = h('div', 'card' + (extra.year ? ' yearcard' : ''));
      const G = Game.G;
      c.innerHTML = `${extra.year && G ? `<div class="yr">${G.age}岁 · ${Game.realmName()}</div>` : ''}<div class="ct">${esc(title)}</div>
        <div class="cb"><div class="cp" style="${porCss(por || 'i:scroll', 92)}"></div><div class="tx">${esc(text).replace(/\n/g, '<br>')}</div></div>
        ${extra.eq && extra.eq.length ? `<div class="eqs">${extra.eq.map(e => this.eqHtml(e)).join('')}</div>` : ''}
        <div class="opts">${opts.map((o, k) => `<button class="opt" data-k="${k}">${esc(o)}</button>`).join('')}</div>`;
      w.appendChild(c); this.push(w);
      c.querySelector('.opts').onclick = e => { const b = e.target.closest('.opt'); if (!b) return; Sfx.play('click'); this.pop(w); res(+b.dataset.k); };
    });
    const p = this._q.then(run); this._q = p.catch(() => { }); return p;
  },
  say(por, name, text, opts) {
    const run = () => new Promise(res => {
      const w = h('div', 'mwrap say'); const c = h('div', 'dlg');
      c.innerHTML = `<div class="dp" style="${porCss(por, 110)}"></div><div class="dn">${esc(name)}</div><div class="dt">${esc(text).replace(/\n/g, '<br>')}</div><div class="opts">${opts.map((o, k) => `<button class="opt" data-k="${k}">${esc(o)}</button>`).join('')}</div>`;
      w.appendChild(c); this.push(w);
      c.querySelector('.opts').onclick = e => { const b = e.target.closest('.opt'); if (!b) return; Sfx.play('click'); this.pop(w); res(+b.dataset.k); };
    });
    const p = this._q.then(run); this._q = p.catch(() => { }); return p;
  },
  eqHtml(e, act) {
    const R_ = RARITY[e.rar]; const main = Object.entries(e.main).map(([k, v]) => `${({ atk: '攻', def: '防', hp: '血', mp: '灵', spd: '速', crit: '暴' })[k]}+${k === 'crit' ? Math.round(v * 100) + '%' : v}`).join(' ');
    const aff = e.aff.map(([k, v]) => { const A = AFFIX.find(a => k.startsWith(a[0])) || ['', k]; return `${A[1]}+${k === 'luck' ? v : Math.round(v * 100) + '%'}`; }).join(' ');
    const fx = e.slot === 'treasure' && TREASURE_FX[e.base] ? `<em>${TREASURE_FX[e.base]}</em>` : '';
    return `<div class="eq r${e.rar}" ${act ? `data-uid="${e.uid}"` : ''}><i style="${iconCss(e.ic, 44)}"></i><div><b style="color:${R_.c}">${esc(e.name)}</b><small>${SLOTS.find(s => s[0] === e.slot)[1]} · ${R_.n} · ${main}</small>${aff ? `<small class="aff">${aff}</small>` : ''}${fx}</div></div>`;
  },
  // ---------- 面板 ----------
  panel(name, tab) {
    return new Promise(res => {
      const w = h('div', 'mwrap'); const p = h('div', 'panel'); w.appendChild(p); this.push(w);
      const close = () => { this.pop(w); UI.hud(); res(); };
      const render = () => { p.innerHTML = `<div class="ph"><b>${this.titles[name] || ''}</b><button class="x">✕</button></div><div class="pb"></div>`; p.querySelector('.x').onclick = () => { Sfx.play('click'); close(); }; this['p_' + name](p.querySelector('.pb'), render, close, tab); };
      render();
    });
  },
  titles: { bag: '背包', char: '角色', skills: '功法 · 技能树', pets: '灵兽', comps: '伙伴 · 道侣', quests: '任务', travel: '御剑飞行', more: '更多', ach: '成就', life: '人生记录', settings: '设置', meta: '轮回殿' },
  p_bag(b, re, close, tab) {
    const G = Game.G; tab = this._bagTab = tab || this._bagTab || 'it';
    b.innerHTML = `<div class="tabs"><button class="${tab === 'it' ? 'on' : ''}" data-t="it">物品</button><button class="${tab === 'eq' ? 'on' : ''}" data-t="eq">装备 (${G.eqs.length})</button></div><div class="list"></div>`;
    b.querySelector('.tabs').onclick = e => { const t = e.target.dataset.t; if (t) { this._bagTab = t; re(); } };
    const L = b.querySelector('.list');
    if (tab === 'it') {
      const ks = Object.keys(G.inv).filter(k => G.inv[k] > 0 && ITEMS[k]);
      L.innerHTML = ks.length ? ks.map(k => `<div class="it" data-k="${k}"><i style="${iconCss(ITEMS[k].ic, 44)}"></i><div><b>${ITEMS[k].n} ×${G.inv[k]}</b><small>${ITEMS[k].d}</small></div>${ITEMS[k].use ? '<button class="sm use">使用</button>' : ''}${ITEMS[k].p ? `<button class="sm sell">卖${Math.round(ITEMS[k].p * 0.4)}</button>` : ''}</div>`).join('') : '<p class="empty">空空如也</p>';
      L.onclick = async e => {
        const it = e.target.closest('.it'); if (!it) return; const k = it.dataset.k;
        if (e.target.classList.contains('sell')) { Game.take(k); G.stone += Math.round(ITEMS[k].p * 0.4); Sfx.play('coin'); re(); }
        if (e.target.classList.contains('use')) { await this.useItem(k); re(); }
      };
    } else {
      const eqd = new Set(Object.values(G.eq)); const list = G.eqs.slice().sort((a, b) => (eqd.has(b.uid) - eqd.has(a.uid)) || b.rar - a.rar || b.tier - a.tier);
      L.innerHTML = `<button class="sm wide" id="sellall">一键出售未装备的凡品/灵品</button>` + list.map(e => `<div class="eqrow">${this.eqHtml(e, true)}${eqd.has(e.uid) ? '<span class="tag">已装备</span>' : `<button class="sm eqb" data-uid="${e.uid}">装备</button><button class="sm sellb" data-uid="${e.uid}">卖</button>`}</div>`).join('');
      L.onclick = e => {
        if (e.target.id === 'sellall') { let t = 0; for (const x of G.eqs.slice()) if (!eqd.has(x.uid) && x.rar <= 1) t += Game.sellEq(x.uid); Sfx.play('coin'); UI.toast(`获得 ${t} 灵石`); re(); return; }
        const u = e.target.dataset.uid; if (!u) return;
        if (e.target.classList.contains('eqb')) { Game.equip(u); Sfx.play('pickup'); re(); }
        if (e.target.classList.contains('sellb')) { const v = Game.sellEq(u); Sfx.play('coin'); UI.toast(`卖出 +${v}`); re(); }
      };
    }
  },
  async useItem(k) {
    const G = Game.G; const s = Game.stats(); const mul = 1 + G.pillBonus; const I = ITEMS[k];
    if (I.use === 'heal') { G.hp = Math.min(s.mhp, G.hp + s.mhp * 0.5 * mul); }
    else if (I.use === 'mana') { G.mp = Math.min(s.mmp, G.mp + s.mmp * 0.5 * mul); }
    else if (I.use === 'exp') { const g = Game.addExp(Game.yearExp() * 1.0 * mul); UI.toast(`修为 +${fmt(g)}`); }
    else if (I.use === 'life') { G.lifeBonus += 20; UI.toast('寿元 +20'); }
    else if (I.use === 'peach') { G.lifeBonus += 3; G.hp = s.mhp; UI.toast('寿元 +3'); }
    else if (I.use === 'linggen') { const k2 = LINGGEN.findIndex(l => l.id === G.lg); const nx = LINGGEN[Math.min(LINGGEN.length - 1, k2 + 1)]; G.lg = nx.id; UI.toast(`灵根重塑为：${nx.n}`, '#ffd23a'); }
    else if (I.use === 'egg') { const p = Game.addPet(pick(Object.keys(PET_SKILL)), Math.max(0, G.realm)); UI.toast(`孵化出了 ${p.name}！`, '#9aff9a'); Game.spawnPetEnt(); }
    else if (I.use === 'scroll') { const r = await Game.apply('tech:rand'); UI.toast(r.txt); }
    else return;
    Game.take(k); Sfx.play('heal'); UI.hud();
  },
  p_char(b, re) {
    const G = Game.G; const s = Game.stats(); const L = Game.linggen();
    b.innerHTML = `<div class="charhead"><div class="bigpor" style="${porCss(Game.playerSpr(), 120)}"></div><div><b class="big">${esc(G.name)}</b><p>${Game.realmName()} · ${G.age}岁（寿元${Game.lifeMax()}）</p><p>灵根：<b style="color:${G.flags.awakened ? '#ffd25e' : '#999'}">${G.flags.awakened ? L.n : '未觉醒'}</b>　宗门：${G.sect ? SECTS[G.sect].n : '散修'}</p><p>功德 ${G.karma}　贡献 ${G.contrib}　炼丹 Lv${G.alchLv}</p></div></div>
      <div class="stats">${[['气血', s.mhp], ['灵力', s.mmp], ['攻击', Math.round(s.atk)], ['防御', Math.round(s.def)], ['速度', Math.round(s.spd)], ['暴击', Math.round(s.crit * 100) + '%']].map(([a, v]) => `<div><small>${a}</small><b>${v}</b></div>`).join('')}</div>
      <div class="stats">${STATS.map(([k, n]) => `<div><small>${n}</small><b>${G.st[k]}</b></div>`).join('')}</div>
      <h4>装备</h4><div class="slots">${SLOTS.map(([k, n]) => { const e = G.eqs.find(x => x.uid === G.eq[k]); return `<div class="slot ${e ? 'r' + e.rar : ''}" data-s="${k}">${e ? `<i style="${iconCss(e.ic, 44)}"></i><small style="color:${RARITY[e.rar].c}">${esc(e.name)}</small>` : `<small>${n}</small>`}</div>`; }).join('')}</div>
      <h4>天赋</h4><div class="tal">${G.talents.map(t => { const T = TALENTS.find(x => x.id === t); return `<span style="border-color:${RCOL[T.r]};color:${RCOL[T.r]}">${T.n}</span>`; }).join('')}</div>`;
    b.querySelector('.slots').onclick = async e => { const sl = e.target.closest('.slot'); if (!sl) return; const k = sl.dataset.s; const cand = G.eqs.filter(x => x.slot === k).sort((a, c) => Game.eqScore(c) - Game.eqScore(a)); if (!cand.length) { UI.toast('没有该部位的装备'); return; } const c = await this.card('更换装备', '选择要装备的物品：', 'i:' + cand[0].ic, [...cand.slice(0, 6).map(x => `${x.name}（${RARITY[x.rar].n}）${G.eq[k] === x.uid ? '✔' : ''}`), '取消']); if (c < Math.min(6, cand.length)) { Game.equip(cand[c].uid); re(); } };
  },
  p_skills(b, re) {
    const G = Game.G;
    const techs = Object.keys(G.techs);
    b.innerHTML = `<h4>功法（可用灵石精进，最高5层）</h4>` + techs.map(id => { const T = TECHS[id]; const lv = G.techs[id]; const cost = Math.round(120 * Math.pow(2.2, lv) * (1 + G.realm)); return `<div class="it"><i style="${iconCss(T.ic, 44)}"></i><div><b>${T.n} 第${lv}层</b><small>${T.d}｜技能：${T.sk.map(k => SKILLS[k].n).join('、')}</small></div>${lv < 5 ? `<button class="sm up" data-id="${id}" data-c="${cost}">精进 ${fmt(cost)}</button>` : '<span class="tag">圆满</span>'}</div>`; }).join('') +
      `<h4>技能树（剩余点数：${G.pts}）</h4><div class="tree">${SKILL_TREE.map(br => `<div class="br"><b>${br.n}</b>${br.nodes.map((n, k) => `<button class="node ${k < G.tree[br.id] ? 'on' : k === G.tree[br.id] ? 'next' : ''}" data-b="${br.id}" data-k="${k}"><b>${n[0]}</b><small>${n[1]}</small></button>`).join('')}</div>`).join('')}</div>
      <h4>战斗技能</h4><div class="sks">${Game.skillList().map(k => `<div class="sk"><i style="${iconCss(SKILLS[k].ic, 36)}"></i><b>${SKILLS[k].n}</b><small>${SKILLS[k].mp ? SKILLS[k].mp + '灵' : ''} ${SKILLS[k].d}</small></div>`).join('')}</div>`;
    b.onclick = e => {
      const up = e.target.closest('.up'); if (up) { const c = +up.dataset.c; if (G.stone < c) { UI.toast('灵石不够'); return; } G.stone -= c; G.techs[up.dataset.id]++; Sfx.play('levelup'); re(); return; }
      const n = e.target.closest('.node'); if (n && n.classList.contains('next')) { if (G.pts <= 0) { UI.toast('没有技能点（境界提升可获得）'); return; } G.pts--; G.tree[n.dataset.b]++; if (G.tree[n.dataset.b] >= 5) Game.ach('tree10'); Sfx.play('magic'); re(); }
    };
  },
  p_pets(b, re) {
    const G = Game.G;
    b.innerHTML = G.pets.length ? G.pets.map((p, k) => { const u = Game.petUnit(p); return `<div class="it ${k === G.petA ? 'act' : ''}"><i style="${porCss(MONS[p.mon].spr, 56)}"></i><div><b>${esc(p.name)} Lv${p.lv}</b><small>血${u.mhp} 攻${Math.round(u.atk)} 防${Math.round(u.def)}｜技能：${u.skills.map(s => SKILLS[s].n).join('、')}</small></div>${k === G.petA ? '<span class="tag">出战中</span>' : `<button class="sm" data-k="${k}">出战</button>`}<button class="sm rel" data-k="${k}">放生</button></div>`; }).join('') : '<p class="empty">还没有灵兽。\n战斗中用【御兽符】捕捉残血妖兽，或孵化灵兽蛋。</p>';
    b.onclick = e => { const k = e.target.dataset.k; if (k === undefined) return; if (e.target.classList.contains('rel')) { G.pets.splice(+k, 1); if (G.petA >= G.pets.length) G.petA = G.pets.length - 1; } else G.petA = +k; Game.spawnPetEnt(); re(); };
  },
  p_comps(b) {
    const G = Game.G; const list = Object.keys(NPCS).filter(k => NPCS[k].comp);
    b.innerHTML = '<p class="hint">好感≥60可邀请同行（参与战斗），好感≥100可结为道侣。闲聊、送礼、完成委托都能提升好感。</p>' + list.map(k => { const N = NPCS[k]; const a = G.aff[k] || 0; return `<div class="it"><i style="${porCss(N.por, 56)}"></i><div><b>${N.n} ${G.partner === k ? '💗道侣' : G.follower === k ? '（同行中）' : ''}</b><small>所在：${MAPINFO[N.map].n}</small><div class="aff"><i style="width:${Math.min(100, a)}%"></i></div></div><b class="hv">♥${a}</b></div>`; }).join('');
  },
  p_quests(b) {
    const G = Game.G; const M = MAIN[G.main];
    b.innerHTML = `<h4>主线 · 天道讨债</h4><div class="it"><i style="${iconCss('bill', 44)}"></i><div><b>${M.n}</b><small>${M.d}</small></div></div>
      <div class="prog">${MAIN.slice(0, MAIN.length - 1).map((m, k) => `<span class="${k < G.main ? 'done' : k === G.main ? 'cur' : ''}">${k + 1}</span>`).join('')}</div>
      <h4>支线</h4>${Object.keys(G.quests).length ? Object.keys(G.quests).map(q => `<div class="it"><i style="${porCss(NPCS[QUESTS[q].giver].por, 44)}"></i><div><b>${QUESTS[q].n} ${Game.questDone(q) ? '✔' : ''}</b><small>${QUESTS[q].d}<br>进度：${Game.questProg(q)}　（找${NPCS[QUESTS[q].giver].n}交付，${MAPINFO[NPCS[QUESTS[q].giver].map].n}）</small></div></div>`).join('') : '<p class="empty">暂无（头顶有“！”的NPC可以接任务）</p>'}
      ${G.bounty ? `<h4>悬赏</h4><div class="it"><div><b>${MAPINFO[G.bounty.map].n}：击败${MONS[G.bounty.mon].n}</b><small>${(G.kills[G.bounty.mon] || 0) - G.bounty.k0}/${G.bounty.n}，完成后回告示栏领赏</small></div></div>` : ''}
      <p class="hint">已完成支线：${Object.keys(G.qdone).length} / ${Object.keys(QUESTS).length}</p>`;
  },
  p_travel(b, re, close) {
    const G = Game.G;
    b.innerHTML = '<p class="hint">御剑前往其他地图，消耗 1 点行动力。</p>' + MAP_ORDER.map(id => { const I = MAPINFO[id]; const ok = Game.canEnter(id); return `<button class="mapb ${ok ? '' : 'lock'} ${R.mapId === id ? 'here' : ''}" data-id="${id}"><b>${I.n}</b><small>${ok ? I.d : (id !== 'village' && !G.flags.awakened ? '需要先觉醒灵根' : `需要${REALMS[I.need].n}期`)}</small><em>${R.mapId === id ? '当前' : ok ? '怪物等级 ' + Math.round(I.tier * 10) : '🔒'}</em></button>`; }).join('');
    b.onclick = async e => { const m = e.target.closest('.mapb'); if (!m || m.classList.contains('lock') || m.classList.contains('here')) return; close(); await Game.travel(m.dataset.id); };
  },
  p_more(b, re, close) {
    b.innerHTML = `<div class="grid2">${[['ach', '成就', 'coin'], ['life', '人生记录', 'scroll'], ['settings', '设置', 'bell'], ['help', '玩法说明', 'book_o']].map(([k, n, ic]) => `<button class="big2" data-k="${k}"><i style="${iconCss(ic, 48)}"></i>${n}</button>`).join('')}</div>`;
    b.onclick = async e => { const k = e.target.closest('.big2'); if (!k) return; close(); if (k.dataset.k === 'help') await this.help(); else await this.panel(k.dataset.k); };
  },
  p_ach(b) { const A = Game.meta.achs; b.innerHTML = `<p class="hint">已解锁 ${Object.keys(A).length}/${Object.keys(ACHS).length}　结局 ${Object.keys(Game.meta.endings).length}/${Object.keys(ENDINGS).length}</p>` + Object.entries(ACHS).map(([k, [n, d]]) => `<div class="it ${A[k] ? '' : 'dim'}"><i style="${iconCss(A[k] ? 'coin' : 'key', 36)}"></i><div><b>${n}</b><small>${d}</small></div></div>`).join('') + '<h4>结局</h4>' + Object.entries(ENDINGS).map(([k, [n]]) => `<div class="it ${Game.meta.endings[k] ? '' : 'dim'}"><div><b>${Game.meta.endings[k] ? n : '？？？'}</b></div></div>`).join(''); },
  p_life(b) { b.innerHTML = `<div class="log">${Game.G.log.slice().reverse().map(l => `<p>${esc(l)}</p>`).join('')}</div>`; },
  p_settings(b, re, close) {
    b.innerHTML = `<label class="row"><input type="checkbox" id="s_bgm" ${Audio2.on ? 'checked' : ''}> 背景音乐</label><label class="row"><input type="checkbox" id="s_sfx" ${Sfx.on ? 'checked' : ''}> 音效</label><label class="row"><input type="checkbox" id="s_joy" ${R.showJoy ? 'checked' : ''}> 显示虚拟摇杆（左下角拖动移动）</label>
      <button class="opt" id="s_save">保存游戏</button><button class="opt" id="s_title">回到标题</button>`;
    b.querySelector('#s_bgm').onchange = e => { Audio2.toggle(e.target.checked); localStorage.setItem('wbx2_bgm', e.target.checked ? 1 : 0); };
    b.querySelector('#s_sfx').onchange = e => { Sfx.on = e.target.checked; localStorage.setItem('wbx2_sfx', e.target.checked ? 1 : 0); };
    b.querySelector('#s_joy').onchange = e => { R.showJoy = e.target.checked; };
    b.querySelector('#s_save').onclick = () => { Game.save(); UI.toast('已保存'); };
    b.querySelector('#s_title').onclick = () => { Game.save(); location.reload(); };
  },
  help() { return this.card('玩法说明', '· 点击地面移动，点击NPC对话，点击怪物战斗；也可以用左下角摇杆。\n· 每年有若干行动力：采药、闭关、练剑、钓鱼、御剑都会消耗。\n· 点击右下“过年”进入下一年：获得修为、触发人生事件。\n· 修为满后点击“突破”冲击下一境界，金丹以上要渡天劫。\n· 寿元耗尽就会死去，进入轮回殿用轮回点强化下一世。\n· 主线：一路查清“天道尾款”的真相，最终在天外天与天道对账。', 'npc_mentor', ['明白了']); },
  // ---------- 商店 ----------
  shop(id) {
    return new Promise(res => {
      const G = Game.G; const sect = id === 'sect'; const S = sect ? { n: SECTS[G.sect].n + '·贡献兑换', items: SECT_SHOP.map(x => x[0]) } : SHOPS[id];
      if (S.eq && !G.shop) { G.shop = []; for (let k = 0; k < 4; k++) G.shop.push(Game.makeEq(pick(['weapon', 'armor', 'hat', 'boots', 'acc', 'treasure']), G.realm + G.stage * 0.25, Math.random() < 0.15 ? 2 : Math.random() < 0.5 ? 1 : 0)); }
      const w = h('div', 'mwrap'); const p = h('div', 'panel'); w.appendChild(p); this.push(w);
      const disc = G.flags.discount ? 0.8 : 1;
      const price = k => sect ? SECT_SHOP.find(x => x[0] === k)[1] : Math.round(ITEMS[k].p * disc * (1 + Math.max(0, 3 - G.st.cha) * 0.03));
      const eqPrice = e => Math.round(30 * POW(e.tier) * RARITY[e.rar].m * (1 + e.rar) * disc);
      const render = () => {
        p.innerHTML = `<div class="ph"><b>${S.n}</b><button class="x">✕</button></div><div class="pb"><p class="hint">${sect ? `宗门贡献：${G.contrib}` : `灵石：${fmt(G.stone)}`}</p>${S.items.map(k => `<div class="it"><i style="${iconCss(ITEMS[k].ic, 44)}"></i><div><b>${ITEMS[k].n}</b><small>${ITEMS[k].d}　持有${G.inv[k] || 0}</small></div><button class="sm buy" data-k="${k}">${price(k)}${sect ? '贡献' : ''}</button></div>`).join('')}
          ${S.eq ? `<h4>今日装备（每年刷新）</h4>${G.shop.map((e, k) => `<div class="eqrow">${this.eqHtml(e)}<button class="sm beq" data-k="${k}">${fmt(eqPrice(e))}</button></div>`).join('')}` : ''}</div>`;
        p.querySelector('.x').onclick = () => { this.pop(w); UI.hud(); res(); };
        p.querySelector('.pb').onclick = e => {
          const bb = e.target.closest('.buy'); if (bb) { const k = bb.dataset.k; const c = price(k); if (sect) { if (G.contrib < c) { UI.toast('贡献不足'); return; } G.contrib -= c; } else { if (G.stone < c) { UI.toast('灵石不够'); return; } G.stone -= c; } Game.give(k); Sfx.play('coin'); render(); }
          const be = e.target.closest('.beq'); if (be) { const eq = G.shop[+be.dataset.k]; const c = eqPrice(eq); if (G.stone < c) { UI.toast('灵石不够'); return; } G.stone -= c; G.eqs.push(eq); G.shop.splice(+be.dataset.k, 1); Sfx.play('coin'); UI.toast('购得 ' + eq.name); render(); }
        };
      };
      render();
    });
  },
  // ---------- 炼丹 ----------
  alchemy(bonus = 0) {
    return new Promise(res => {
      const G = Game.G; const w = h('div', 'mwrap'); const p = h('div', 'panel'); w.appendChild(p); this.push(w);
      const render = () => {
        p.innerHTML = `<div class="ph"><b>炼丹（炼丹等级 ${G.alchLv}）</b><button class="x">✕</button></div><div class="pb"><p class="hint">每次开炉消耗 1 点行动力（剩余 ${G.ap}）。在丹房长老或百草谷主处可学习提升炼丹等级。</p>${RECIPES.map((r, k) => { const ok = Object.entries(r.need).every(([i, c]) => Game.has(i, c)) && G.alchLv >= r.lv; return `<div class="it ${ok ? '' : 'dim'}"><i style="${iconCss(ITEMS[r.out].ic, 44)}"></i><div><b>${ITEMS[r.out].n} ×${r.n}</b><small>${Object.entries(r.need).map(([i, c]) => `${ITEMS[i].n}${G.inv[i] || 0}/${c}`).join(' ')}${G.alchLv < r.lv ? `　需炼丹${r.lv}级` : ''}</small></div><button class="sm mk" data-k="${k}" ${ok ? '' : 'disabled'}>开炉</button></div>`; }).join('')}</div>`;
        p.querySelector('.x').onclick = () => { this.pop(w); res(); };
        p.querySelector('.pb').onclick = async e => {
          const b = e.target.closest('.mk'); if (!b || b.disabled) return; if (!Game.useAP(1)) return; const r = RECIPES[+b.dataset.k];
          for (const [i, c] of Object.entries(r.need)) Game.take(i, c);
          const q = await this.fireGame(); const ch = Math.min(0.97, 0.55 + G.alchLv * 0.06 + G.alchBonus + Game.treeVal('alch') + Game.techVal('alch') + bonus + (G.sect === 'baicao' ? 0.2 : 0) + q * 0.2 - r.lv * 0.05);
          if (Math.random() < ch) { const n = r.n + (q > 0.8 ? 1 : 0); Game.give(r.out, n); G.alchCount++; if (G.alchCount >= 10) Game.ach('alch10'); Sfx.play('levelup'); UI.toast(`成丹！${ITEMS[r.out].n} ×${n}${q > 0.8 ? '（火候完美，多出一颗）' : ''}`, '#ffe680'); }
          else { Sfx.play('fail'); R.shake = 0.5; UI.toast('炸炉了！材料化为飞灰……', '#ff8a6a'); }
          render(); UI.hud();
        };
      };
      render();
    });
  },
  fireGame() {
    return new Promise(res => {
      const w = h('div', 'mwrap'); const c = h('div', 'card fire'); c.innerHTML = '<div class="ct">掌控火候</div><p class="hint">在指针进入金色区域时点击“收丹”！</p><div class="bar"><div class="zone"></div><div class="needle"></div></div><div class="opts"><button class="opt">收丹</button></div>';
      w.appendChild(c); this.push(w); const nd = c.querySelector('.needle'); const zone = c.querySelector('.zone'); const z0 = 0.55 + Math.random() * 0.25; zone.style.left = z0 * 100 + '%'; let t = 0, done = false;
      const tick = () => { if (done) return; t += 0.012 * B.speed; const x = (Math.sin(t * 2.2) + 1) / 2; nd.style.left = x * 100 + '%'; nd.dataset.x = x; if (B.speed > 3 && Math.abs(x - z0 - 0.06) < 0.05) finish(); else requestAnimationFrame(tick); };
      const finish = () => { if (done) return; done = true; const x = +nd.dataset.x; const q = Math.max(0, 1 - Math.abs(x - (z0 + 0.06)) / 0.3); Sfx.play(q > 0.8 ? 'magic' : 'fire'); this.pop(w); res(q); };
      c.querySelector('.opt').onclick = finish; tick();
    });
  },
  // ---------- 钓鱼 ----------
  fishing() {
    return new Promise(res => {
      const G = Game.G; const w = h('div', 'mwrap'); const c = h('div', 'card fire'); c.innerHTML = '<div class="ct">钓鱼</div><p class="hint">浮漂下沉时立刻提竿！</p><div class="pond"><div class="float"></div></div><div class="opts"><button class="opt">提竿</button></div>';
      w.appendChild(c); this.push(w); const fl = c.querySelector('.float'); let bite = false, done = false; const tBite = (1200 + Math.random() * 2500) / B.speed;
      setTimeout(() => { if (done) return; bite = true; fl.classList.add('bite'); Sfx.play('dialog'); if (B.speed > 3) setTimeout(finish, 100); setTimeout(() => { bite = false; fl.classList.remove('bite'); }, 900 / Math.max(1, B.speed / 3)); }, tBite);
      const finish = () => { if (done) return; done = true; this.pop(w); const ok = bite || G.flags.fish; if (ok) { const n = ri(1, 2) + (G.flags.fish ? 1 : 0); Game.give('fish', n); G.fishCount += n; if (G.fishCount >= 10) Game.ach('fish10'); let extra = ''; if (Math.random() < 0.08) { Game.give('egg'); extra = '，还钓上来一颗灵兽蛋！'; } else if (Math.random() < 0.15) { Game.give('coin'); extra = '，还钓上来一枚古钱'; } Sfx.play('pickup'); UI.toast(`钓到灵鱼×${n}${extra}`, '#9ad8ff'); } else { Sfx.play('fail'); UI.toast('空军了……'); } res(ok); };
      c.querySelector('.opt').onclick = finish;
    });
  },
  // ---------- 战斗界面 ----------
  battleUI(on) {
    $('#battlebar').style.display = on ? 'flex' : 'none'; $('#hud').classList.toggle('inb', on); $('#menu').style.display = on ? 'none' : ''; $('#yearbtn').style.display = on ? 'none' : ''; $('#qt').style.display = on ? 'none' : ''; $('#ap').style.display = on ? 'none' : '';
    if (on) { $('#brkbtn').style.display = 'none'; this.renderBB(); }
  },
  renderBB(sub) {
    const bb = $('#battlebar'); const P = B.units.find(u => u.isPlayer);
    if (!sub) bb.innerHTML = `<button data-a="atk"><i style="${iconCss('sword_w', 30)}"></i>攻击</button><button data-a="skill"><i style="${iconCss('book_b', 30)}"></i>技能</button><button data-a="item"><i style="${iconCss('pill_red', 30)}"></i>道具</button><button data-a="defend"><i style="${iconCss('sk_shield', 30)}"></i>防御</button><button data-a="catch"><i style="${iconCss('tal_b', 30)}"></i>捕捉</button><button data-a="flee"><i style="${iconCss('sk_flee', 30)}"></i>逃跑</button><button data-a="auto" class="${B.auto ? 'on' : ''}"><i style="${iconCss('abacus', 30)}"></i>${B.auto ? '自动中' : '自动'}</button>`;
    else if (sub === 'skill') bb.innerHTML = P.skills.filter(k => k !== 'atk').map(k => `<button data-s="${k}" ${SKILLS[k].mp > P.mp ? 'disabled' : ''}><i style="${iconCss(SKILLS[k].ic, 30)}"></i>${SKILLS[k].n}<small>${SKILLS[k].mp}灵</small></button>`).join('') + '<button data-a="back">返回</button>';
    else if (sub === 'item') bb.innerHTML = ['hcd', 'hld'].map(k => `<button data-i="${k}" ${Game.has(k) ? '' : 'disabled'}><i style="${iconCss(ITEMS[k].ic, 30)}"></i>${ITEMS[k].n}<small>×${Game.G.inv[k] || 0}</small></button>`).join('') + '<button data-a="back">返回</button>';
    else if (sub === 'target') bb.innerHTML = `<div class="tip">点击选择目标</div><button data-a="back">返回</button>`;
  },
  battleChoose(P) {
    return new Promise(res => {
      const bb = $('#battlebar'); this.renderBB(); B.sel = null; let pending = null;
      const done = a => { B.sel = null; R.onTap = null; bb.onclick = null; bb.classList.add('wait'); res(a); };
      bb.classList.remove('wait');
      const target = (sk, side) => { pending = sk; const cands = B.units.filter(u => u.alive && u.side === side); if (cands.length === 1) return done(Object.assign(sk, { t: cands })); B.sel = { targets: cands }; this.renderBB('target');
        R.onTap = (x, y) => { let best = null, bd = 1e9; for (const u of cands) { const [ux, uy] = uPos(u); const d = Math.hypot(ux - x, uy - 70 * R.dpr - y); if (d < bd) { bd = d; best = u; } } if (best && bd < 160 * R.dpr) done(Object.assign(pending, { t: [best] })); }; };
      bb.onclick = e => {
        const b = e.target.closest('button'); if (!b || b.disabled) return; Sfx.play('click');
        const a = b.dataset.a, s = b.dataset.s, i = b.dataset.i;
        if (a === 'atk') return target({ u: P, sk: 'atk' }, 1);
        if (a === 'skill') return this.renderBB('skill');
        if (a === 'item') return this.renderBB('item');
        if (a === 'back') { B.sel = null; R.onTap = null; return this.renderBB(); }
        if (a === 'defend') return done({ u: P, sk: 'defend' });
        if (a === 'flee') return done({ u: P, sk: 'flee' });
        if (a === 'auto') { B.auto = true; return done(chooseAI(P)); }
        if (a === 'catch') { if (!Game.has('ysf')) { UI.toast('没有御兽符（坊市有卖）'); return; } return target({ u: P, sk: 'catch' }, 1); }
        if (s) { const S = SKILLS[s]; if (S.tg === 'one') return target({ u: P, sk: s }, 1); if (S.tg === 'ally') return target({ u: P, sk: s }, 0); return done({ u: P, sk: s, t: S.tg === 'self' ? [P] : null }); }
        if (i) return done({ u: P, sk: 'item', item: i, t: [P] });
      };
      if (B.auto) { const ab = h('button', 'stopauto', '取消自动'); ab.onclick = () => { B.auto = false; ab.remove(); }; }
    });
  },
  // ---------- 结局 / 标题 / 创建 ----------
  ending(kind, E, pts, newEnd) {
    return new Promise(res => {
      const G = Game.G; const w = h('div', 'mwrap endw'); const c = h('div', 'ending');
      c.innerHTML = `<div class="et">${newEnd ? '<small>新结局</small>' : ''}${E[0]}</div><div class="ep" style="${porCss(Game.playerSpr(), 150)}"></div><p class="etx">${E[1]}</p>
        <div class="stats">${[['享年', G.age], ['境界', Game.realmName()], ['击败', G.killsTotal], ['灵兽', G.pets.length], ['道侣', G.partner ? NPCS[G.partner].n.split('·').pop() : '无'], ['欠款', fmt(G.debt)]].map(([a, v]) => `<div><small>${a}</small><b>${v}</b></div>`).join('')}</div>
        <p class="pts">获得轮回点 <b>+${pts}</b>（共 ${Game.meta.pts}）</p><div class="opts"><button class="opt" data-k="0">进入轮回殿</button></div>`;
      w.appendChild(c); this.push(w); c.querySelector('.opt').onclick = () => { this.pop(w); res(); this.metaShop(true); };
    });
  },
  metaShop(thenNew) {
    return new Promise(res => {
      const M = Game.meta; const w = h('div', 'mwrap'); const p = h('div', 'panel meta'); w.appendChild(p); this.push(w);
      const render = () => {
        p.innerHTML = `<div class="ph"><b>轮回殿</b><button class="x">✕</button></div><div class="pb"><p class="hint">孟婆：“喝汤之前，用轮回点给下辈子挑点好东西吧。”　轮回点：<b>${M.pts}</b>　已轮回 ${M.lives} 次</p>${META_PERKS.map(pk => { const lv = M.perks[pk.id] || 0; return `<div class="it"><div><b>${pk.n} ${lv}/${pk.max}</b><small>${pk.d}</small></div>${lv < pk.max ? `<button class="sm" data-id="${pk.id}">${pk.cost * (lv + 1)}点</button>` : '<span class="tag">满</span>'}</div>`; }).join('')}<button class="opt" id="newlife">${thenNew ? '喝下孟婆汤，开始新人生' : '返回'}</button></div>`;
        p.querySelector('.x').onclick = () => { this.pop(w); res(); if (thenNew) location.reload(); };
        p.querySelector('#newlife').onclick = () => { this.pop(w); res(); if (thenNew) { Game.G = null; location.reload(); } };
        p.querySelector('.pb').onclick = e => { const id = e.target.dataset.id; if (!id) return; const pk = META_PERKS.find(x => x.id === id); const cost = pk.cost * ((M.perks[id] || 0) + 1); if (M.pts < cost) { UI.toast('轮回点不足'); return; } M.pts -= cost; M.perks[id] = (M.perks[id] || 0) + 1; Game.saveMeta(); Sfx.play('levelup'); render(); };
      };
      render();
    });
  },
  title() {
    return new Promise(res => {
      const t = $('#title'); t.style.display = 'flex'; const sv = Game.hasSave();
      t.innerHTML = `<div class="logo"><b>我不仙</b><span>修仙人生模拟器 · ${APP_VERSION.name}</span></div><div class="tbtns">${sv ? `<button class="opt" data-k="cont">继续人生<small>${esc(sv.name)} · ${sv.age}岁 · ${REALMS[sv.realm].n}</small></button>` : ''}<button class="opt" data-k="new">开始新人生</button><button class="opt" data-k="meta">轮回殿（${Game.meta.pts}点）</button><button class="opt" data-k="ach">成就与结局</button></div><p class="ver">v${APP_VERSION.name}　全部美术为 Blender 原创建模渲染</p>`;
      t.onclick = async e => {
        const b = e.target.closest('.opt'); if (!b) return; Sfx.play('click'); Audio2.unlock(); const k = b.dataset.k;
        if (k === 'cont') { Game.G = sv; t.style.display = 'none'; res('cont'); }
        if (k === 'new') { const cfg = await this.creation(); if (cfg) { t.style.display = 'none'; res(cfg); } }
        if (k === 'meta') await this.metaShop(false);
        if (k === 'ach') { Game.G = Game.G || { log: [] }; await this.panel('ach'); }
      };
    });
  },
  creation() {
    return new Promise(res => {
      const M = Game.meta; const w = h('div', 'mwrap'); const p = h('div', 'panel create'); w.appendChild(p); this.push(w);
      const sv = { name: SURN[Math.random() * SURN.length | 0] + GIVEN[Math.random() * GIVEN.length | 0], sex: Math.random() < 0.5 ? 'm' : 'f', talents: Game.rollTalents(), chosen: [], rerolls: 1 + Game.perk('reroll') * 2, st: { con: 2, int: 2, luck: 2, cha: 2, wealth: 2 }, pts: 10 + Game.perk('stat') * 2, lg: Game.rollLinggen(), step: 0 };
      const render = () => {
        const s = sv.step;
        let body = '';
        if (s === 0) body = `<h4>道号</h4><div class="row"><input id="nm" maxlength="6" value="${esc(sv.name)}"><button class="sm" id="rn">随机</button></div><h4>性别</h4><div class="row sexs"><button class="sexb ${sv.sex === 'm' ? 'on' : ''}" data-s="m"><i style="${porCss('player_m0', 90)}"></i>男</button><button class="sexb ${sv.sex === 'f' ? 'on' : ''}" data-s="f"><i style="${porCss('player_f0', 90)}"></i>女</button></div>`;
        if (s === 1) body = `<h4>选择 3 个天赋（${sv.chosen.length}/3）</h4><div class="tals">${sv.talents.map(id => { const T = TALENTS.find(x => x.id === id); return `<button class="talb ${sv.chosen.includes(id) ? 'on' : ''}" data-id="${id}" style="border-color:${RCOL[T.r]}"><b style="color:${RCOL[T.r]}">${T.n}</b><small>${T.d}</small></button>`; }).join('')}</div><button class="sm wide" id="rr" ${sv.rerolls ? '' : 'disabled'}>刷新天赋（剩${sv.rerolls}次）</button>`;
        if (s === 2) body = `<h4>分配属性点（剩余 ${sv.pts}）</h4>${STATS.map(([k, n]) => `<div class="statrow"><b>${n}</b><button class="sm" data-d="-1" data-k="${k}">－</button><span>${sv.st[k]}</span><button class="sm" data-d="1" data-k="${k}">＋</button></div>`).join('')}<button class="sm wide" id="rs">随机分配</button>`;
        if (s === 3) { const L = LINGGEN.find(l => l.id === sv.lg); body = `<div class="lg"><div class="lgc">命 盘</div><p>你的灵根（10岁时由高人揭晓）：</p><b class="lgn">${L.n}</b><p>${L.d}</p><p>修炼速度 ×${L.mult}</p></div>`; }
        p.innerHTML = `<div class="ph"><b>投胎 · ${['取名', '天赋', '属性', '命盘'][s]}</b><button class="x">✕</button></div><div class="pb">${body}<div class="opts">${s ? '<button class="opt" id="bk">上一步</button>' : ''}<button class="opt" id="nx">${s === 3 ? '出生！' : '下一步'}</button></div></div>`;
        p.querySelector('.x').onclick = () => { this.pop(w); res(null); };
        const q = s2 => p.querySelector(s2);
        if (s === 0) { q('#rn').onclick = () => { sv.name = SURN[Math.random() * SURN.length | 0] + GIVEN[Math.random() * GIVEN.length | 0]; render(); }; q('#nm').oninput = e => sv.name = e.target.value.trim() || sv.name; p.querySelectorAll('.sexb').forEach(b => b.onclick = () => { sv.sex = b.dataset.s; render(); }); }
        if (s === 1) { p.querySelectorAll('.talb').forEach(b => b.onclick = () => { const id = b.dataset.id; if (sv.chosen.includes(id)) sv.chosen = sv.chosen.filter(x => x !== id); else if (sv.chosen.length < 3) sv.chosen.push(id); render(); }); q('#rr').onclick = () => { if (!sv.rerolls) return; sv.rerolls--; sv.talents = Game.rollTalents(); sv.chosen = []; render(); }; }
        if (s === 2) { p.querySelectorAll('.statrow .sm').forEach(b => b.onclick = () => { const k = b.dataset.k, d = +b.dataset.d; if (d > 0 && sv.pts <= 0) return; if (d < 0 && sv.st[k] <= 0) return; sv.st[k] += d; sv.pts -= d; render(); }); q('#rs').onclick = () => { while (sv.pts > 0) { sv.st[pick(['con', 'int', 'luck', 'cha', 'wealth'])]++; sv.pts--; } render(); }; }
        if (q('#bk')) q('#bk').onclick = () => { sv.step--; render(); };
        q('#nx').onclick = () => {
          if (s === 1 && sv.chosen.length < 3) { UI.toast('请选择3个天赋'); return; }
          if (s === 2 && sv.pts > 0) { while (sv.pts > 0) { sv.st[pick(['con', 'int', 'luck'])]++; sv.pts--; } }
          if (s === 3) { this.pop(w); res({ name: sv.name.slice(0, 6), sex: sv.sex, talents: sv.chosen, st: sv.st, lg: sv.lg }); return; }
          sv.step++; Sfx.play('click'); render();
        };
      };
      render();
    });
  },
};

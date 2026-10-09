'use strict';
// ======================= v2.1 新界面：洞府 / 坐骑时装 / 称号 / 逆天改命 / 求仙缘 =======================
Object.assign(UI.titles, { cave: '洞府', mount: '坐骑 · 时装', title: '称号', nitian: '逆天改命', gacha: '求仙缘' });
(function () {
  const _more = UI.p_more;
  UI.p_more = function (b, re, close) {
    const list = [['gacha', '求仙缘', 'tal_r'], ['cave', '洞府', 'seal'], ['mount', '坐骑时装', 'gourd_g'], ['title', '称号', 'flag'], ['nitian', '逆天改命', 'sk_light'], ['ach', '成就', 'coin'], ['life', '人生记录', 'scroll'], ['settings', '设置', 'bell'], ['help', '玩法说明', 'book_o']];
    b.innerHTML = `<div class="grid3">${list.map(([k, n, ic]) => `<button class="big2" data-k="${k}"><i style="${iconCss(ic, 48)}"></i>${n}</button>`).join('')}</div>`;
    b.onclick = async e => { const k = e.target.closest('.big2'); if (!k) return; close(); if (k.dataset.k === 'help') await this.help(); else await this.panel(k.dataset.k); };
  };
  UI.p_cave = function (b, re) {
    const G = Game.G; Sys.ensure(G); const C = G.cave;
    b.innerHTML = `<div class="cavehead"><b>${esc(G.name)}的洞府</b><span>灵气浓度 ${'✦'.repeat(1 + C.zl)}</span></div>` + Object.entries(CAVE).map(([k, D]) => {
      const l = C[k]; const cost = D.cost(l); const max = l >= D.max;
      return `<div class="it cave"><i style="${iconCss(D.ic, 52)}"></i><div><b>${D.n} <em>Lv.${l}/${D.max}</em></b><small>${D.d(l)}</small></div>${max ? '<span class="tag">已满级</span>' : `<button class="sm" data-up="${k}" ${G.stone < cost ? 'disabled' : ''}>${l ? '升级' : '建造'}<small>${fmt(cost)}灵石</small></button>`}</div>`;
    }).join('') + (C.forge ? `<div class="forge"><p class="hint">炼器：消耗玄铁晶×2 + 妖丹×1 + ${fmt(Math.round(200 * POW(Game.power())))}灵石，炼制一件${RARITY[Math.min(4, C.forge)].n}以上装备。</p><button class="opt" data-forge="1" ${Game.has('ore', 2) && Game.has('yd', 1) ? '' : 'disabled'}>开炉炼器（玄铁晶${G.inv.ore || 0} 妖丹${G.inv.yd || 0}）</button></div>` : '<p class="hint">建造炼器炉后可在洞府炼制装备。</p>');
    b.onclick = async e => {
      const up = e.target.closest('[data-up]'); const fg = e.target.closest('[data-forge]');
      if (up && !up.disabled) { const k = up.dataset.up; const cost = CAVE[k].cost(C[k]); if (G.stone < cost) return; G.stone -= cost; C[k]++; Sfx.play('levelup'); if (k === 'zl' && C.zl >= 3) Game.ach('cave3'); UI.toast(`${CAVE[k].n} 提升到 Lv.${C[k]}`, '#9affd0'); re(); UI.hud(); }
      if (fg && !fg.disabled) { const cost = Math.round(200 * POW(Game.power())); if (G.stone < cost) { UI.toast('灵石不足'); return; } G.stone -= cost; Game.take('ore', 2); Game.take('yd', 1); Sfx.play('fire'); const rar = Math.min(4, C.forge + (Math.random() < 0.15 ? 1 : 0)); const eq = Game.randEq(Math.max(0.5, Game.power()), rar); UI.toast(`炼成【${eq.name}】！`, RARITY[eq.rar].c); re(); UI.hud(); }
    };
  };
  UI.p_mount = function (b, re) {
    const G = Game.G; Sys.ensure(G); const M = Game.meta;
    const ms = Object.entries(MOUNTS).map(([k, m]) => { const own = G.mounts.includes(k); return `<div class="it ${own ? '' : 'dim'}"><div class="sprbox" data-spr="${m.spr}"></div><div><b style="color:${RARITY[m.rar].c}">${m.n}</b><small>${m.d}</small></div>${own ? (G.mount === k ? '<button class="sm" data-m="">下坐骑</button>' : `<button class="sm" data-m="${k}">乘坐</button>`) : '<span class="tag">未获得</span>'}</div>`; }).join('');
    const cs = Object.entries(COSTUMES).map(([k, c]) => { const own = M.cos[k]; return `<div class="it ${own ? '' : 'dim'}"><div class="sprbox" data-spr="cos_${k}_${G.sex}"></div><div><b style="color:${RARITY[c.rar].c}">${c.n}</b><small>${c.d}</small></div>${own ? (G.costume === k ? '<button class="sm" data-c="">换回道袍</button>' : `<button class="sm" data-c="${k}">穿上</button>`) : '<span class="tag">求仙缘获得</span>'}</div>`; }).join('');
    b.innerHTML = `<h4>坐骑</h4><p class="hint">筑基后自动获得御剑；其余坐骑可通过求仙缘、奇遇获得。坐骑提升地图移动速度并提供属性。</p>${ms}<h4>时装（永久解锁，跨轮回保留）</h4>${cs}`;
    UI.drawSprBoxes(b);
    b.onclick = e => { const m = e.target.closest('[data-m]'); const c = e.target.closest('[data-c]'); if (m) { Sys.setMount(m.dataset.m || null); Sfx.play('whoosh'); re(); } if (c) { Sys.setCostume(c.dataset.c || null); Sfx.play('pickup'); re(); } };
  };
  UI.p_title = function (b, re) {
    const G = Game.G; Sys.ensure(G); const n = Sys.titleCount(); if (n >= 5) Game.ach('title5');
    b.innerHTML = `<p class="hint">称号会显示在角色头顶，并提供少量加成。已获得 ${n}/${TITLES.length}</p>` + TITLES.map(t => { const ok = t.ok(G); return `<div class="it ${ok ? '' : 'dim'}"><div class="ttl">「${t.n}」</div><div><small>${t.d}</small></div>${ok ? (G.title === t.id ? '<span class="tag on">佩戴中</span>' : `<button class="sm" data-t="${t.id}">佩戴</button>`) : '<span class="tag">未获得</span>'}</div>`; }).join('');
    b.onclick = e => { const t = e.target.closest('[data-t]'); if (!t) return; G.title = t.dataset.t; if (R.player) R.player.title = G.title !== 'debtor' ? Sys.title().n : null; Sfx.play('pickup'); re(); UI.hud(); };
  };
  UI.p_nitian = function (b) {
    const G = Game.G; Sys.ensure(G);
    b.innerHTML = `<p class="hint">每次突破大境界（筑基及以上）时，可从三个“逆天改命”中选择一个，本世永久生效。</p>` + (G.nt.length ? G.nt.map(id => { const x = NITIAN.find(n => n.id === id); return `<div class="it"><i style="${iconCss('sk_light', 44)}"></i><div><b>${x.n}</b><small>${x.d}</small></div></div>`; }).join('') : '<p class="hint">还没有逆天改命。先突破到筑基吧！</p>') + `<h4>全部词条</h4><div class="chips">${NITIAN.map(x => `<span class="${G.nt.includes(x.id) ? 'on' : ''}" title="${x.d}">${x.n}</span>`).join('')}</div>`;
  };
  UI.p_gacha = function (b, re, close) {
    const G = Game.G; Sys.ensure(G); const M = Game.meta.gacha; const n = G.inv.xyf || 0;
    b.innerHTML = `<div class="gbanner"><div class="gtitle">求 仙 缘</div><div class="gsub">只用游戏内的【仙缘符】，绝无付费</div></div>
      <div class="grates">${GACHA.rates.map(([nm, r, t]) => `<span style="color:${RARITY[t].c}">${nm} ${(r * 100).toFixed(0)}%</span>`).join('')}<span>保底：${GACHA.pity}抽必出神品（已 ${M.pity} 抽）· 十连必出仙品</span></div>
      <div class="gpool"><b>神品</b>：仙鹤、九品莲台、仙鹤羽衣、龙袍金冠、神品法宝<br><b>仙品</b>：筋斗祥云、御剑、喜服、魔王战袍、桃花仙裳、仙品法宝、灵兽、破境丹<br><b>宝品</b>：酒葫芦、孟婆汤碗、江湖侠客、丹药、灵石、宝品装备</div>
      <p class="hint">持有仙缘符：<b class="gold">${n}</b>　（完成任务、成就、BOSS、机缘、每三年过年都能获得）</p>
      <div class="gbtns"><button class="opt" data-d="1" ${n < 1 ? 'disabled' : ''}>求一次<small>仙缘符×1</small></button><button class="opt gold" data-d="10" ${n < 10 ? 'disabled' : ''}>十连求<small>仙缘符×10</small></button></div>
      <p class="hint">累计 ${M.total} 抽 · 神品 ${M.ssr} 次</p>`;
    b.onclick = async e => { const d = e.target.closest('[data-d]'); if (!d || d.disabled) return; await Sys.draw(+d.dataset.d); re(); };
  };
  // 面板内的精灵预览
  UI.drawSprBoxes = function (root) {
    root.querySelectorAll('.sprbox').forEach(async el => {
      const id = el.dataset.spr; if (!AS.sprites[id]) { el.textContent = '?'; return; }
      await loadSprite(id); const c = document.createElement('canvas'); c.width = 120; c.height = 120; el.appendChild(c);
      const x = c.getContext('2d'); const mt = id.startsWith('mount_'); drawSprite(x, id, 'idle', 'S', 0, 60, mt ? 92 : 112, mt ? 0.5 : 0.62);
    });
  };
  // 抽卡动画
  UI.gachaShow = function (items) {
    return new Promise(res => {
      const best = Math.max(...items.map(i => i.tier));
      const w = h('div', 'gacha-fx t' + best); document.body.appendChild(w);
      w.innerHTML = `<div class="gfx-bg"></div><div class="gfx-scroll"><div class="gfx-seal">缘</div></div><div class="gfx-rays"></div>`;
      Sfx.play('gong'); if (best >= 4) setTimeout(() => Sfx.play('thunder'), 600);
      for (let k = 0; k < 60; k++) setTimeout(() => part({ x: R.W / 2 + rnd(-40, 40) * R.dpr, y: R.H * 0.45, vx: rnd(-300, 300) * R.dpr, vy: rnd(-400, 100) * R.dpr, g: 300 * R.dpr, r: rnd(3, 7) * R.dpr, c: RARITY[best].c, life: 1.6, add: true, star: k % 2, world: false }), 900 + k * 12);
      setTimeout(() => {
        w.classList.add('reveal');
        const grid = h('div', 'gfx-cards' + (items.length > 1 ? ' many' : ''));
        grid.innerHTML = items.map((it, k) => `<div class="gcard t${it.tier}" style="animation-delay:${k * 0.09}s"><div class="gc-in">${it.spr && AS.sprites[it.spr] ? `<div class="sprbox" data-spr="${it.spr}"></div>` : `<i style="${iconCss(it.ic || 'chest', 64)}"></i>`}<b>${esc(it.n)}</b><small>${['', '', '宝品', '仙品', '神品'][it.tier]}</small></div></div>`).join('');
        w.appendChild(grid); UI.drawSprBoxes(grid);
        const btn = h('button', 'opt gclose', '收下'); w.appendChild(btn); btn.onclick = () => { w.classList.add('out'); setTimeout(() => { w.remove(); res(); }, 300); };
        if (best >= 4) { R.flash = 0.8; Sfx.play('gacha_ssr'); setTimeout(() => Sfx.play('voice_wow'), 500); } else Sfx.play(best >= 3 ? 'gacha_sr' : 'levelup');
      }, 1500);
    });
  };
  // HUD 上的求仙缘按钮
  const _init = UI.init; UI.init = function () {
    _init.call(this);
    const g = h('button', '', `<i style="${iconCss('tal_r', 30)}"></i><span>求仙缘</span>`); g.id = 'gachabtn'; document.body.appendChild(g);
    g.onclick = () => { if (this.modal || Game._busy || B.on) return; Sfx.play('click'); this.panel('gacha'); };
  };
  const _hud = UI.hud; UI.hud = function (o) { _hud.call(this, o); const G = Game.G; if (!G) return; const g = $('#gachabtn'); if (g) g.dataset.n = G.inv.xyf || 0; };
})();
// ======================= 剧情CG：章节过场 + 结局插画 + 回忆图鉴 =======================
const CG_OF = { debt: 'cg_debt', mentor: 'cg_mentor', sect: 'cg_sect', rival: 'cg_rival', market: 'cg_market', corpse: 'cg_corpse', dragon: 'cg_dragon', lengyue: 'cg_lengyue', mozun: 'cg_mozun', judge: 'cg_judge', tiandao: 'cg_tiandao', longgong: 'cg_longgong', guishi: 'cg_guishi', cuizhai: 'cg_cuizhai', zhenshen: 'cg_zhenshen' };
const CG_END = { ascend: 'cg_ascend', judge: 'cg_judge', rival: 'cg_rival', paid: 'cg_tiandao', newdao: 'cg_tiandao', couple: 'cg_couple', mortal: 'cg_mortal', sit: 'cg_sit', ash: 'cg_ash', demon: 'cg_demon', tycoon: 'cg_tycoon', teahouse: 'cg_teahouse', storyteller: 'cg_storyteller', fisher: 'cg_fisher', insured: 'cg_insured', mengpo: 'cg_mengpo', longgong: 'cg_longgong', guishi: 'cg_guishi', auditor: 'cg_zhenshen' };
const CG_LIST = [['cg_debt', '上门讨债'], ['cg_mentor', '剑仙路过'], ['cg_sect', '拜入仙门'], ['cg_rival', '宿敌龙傲天'], ['cg_market', '云来坊市'], ['cg_corpse', '尸王的账'], ['cg_dragon', '龙宫钱庄'], ['cg_lengyue', '月下抚琴'], ['cg_mozun', '魔尊'], ['cg_judge', '讨债司判官'], ['cg_tiandao', '对账天道'], ['cg_longgong', '东海龙宫'], ['cg_guishi', '鬼市夜行'], ['cg_cuizhai', '天庭催债司'], ['cg_zhenshen', '天道真身'], ['cg_ascend', '白日飞升'], ['cg_couple', '神仙眷侣'], ['cg_mortal', '凡人一生'], ['cg_sit', '坐化'], ['cg_ash', '劫灰'], ['cg_demon', '魔尊降世'], ['cg_tycoon', '富甲三界'], ['cg_teahouse', '茶馆老板'], ['cg_storyteller', '说书人'], ['cg_fisher', '钓鱼成仙'], ['cg_insured', '理赔到账'], ['cg_mengpo', '孟婆汤铺']];
UI.cgUnlock = function (id) { const M = Game.meta; M.cg = M.cg || {}; if (!M.cg[id]) { M.cg[id] = 1; Game.saveMeta(); } };
UI.chapterShow = function (m) {
  const cg = CG_OF[m.id]; if (!cg || $('.chapter-fx')) return;
  const im = new Image(); im.src = 'assets/cg/' + cg + '.webp';
  im.onload = () => {
    UI.cgUnlock(cg);
    const [a, b] = m.n.split('·');
    const w = h('div', 'chapter-fx', `<div class="cx-img" style="background-image:url(${im.src})"></div><div class="cx-shade"></div><div class="cx-txt"><small>${esc(a || '')}</small><b>${esc(b || m.n)}</b><p>${esc(m.d)}</p></div><div class="cx-tip">点击继续</div>`);
    document.body.appendChild(w); Sfx.play('chapter');
    const close = () => { if (!w.parentNode) return; w.classList.add('out'); setTimeout(() => w.remove(), 400); };
    w.onclick = close; setTimeout(close, B.speed > 1 ? 1200 : 5000);
  };
};
(function () {
  const _hud = UI.hud; UI.hud = function (o) {
    _hud.call(this, o); const G = Game.G; if (!G || G.dead) return;
    if ((G.flags.chShown || 0) < G.main + 1) { G.flags.chShown = G.main + 1; const m = MAIN[G.main]; if (m) setTimeout(() => UI.chapterShow(m), 600); }
  };
  const _end = UI.ending; UI.ending = function (kind, E, pts, newEnd) {
    const p = _end.call(this, kind, E, pts, newEnd); const cg = CG_END[kind]; Audio2.bgm('ending');
    if (cg) { UI.cgUnlock(cg); const ep = document.querySelector('.endw .ending'); if (ep) { ep.classList.add('withcg'); ep.style.setProperty('--cg', `url(assets/cg/${cg}.webp)`); } }
    return p;
  };
  Object.assign(UI.titles, { album: '回忆图鉴' });
  UI.p_album = function (b) {
    const got = Game.meta.cg || {};
    b.innerHTML = `<p class="hint">剧情推进与结局会解锁插画（跨轮回保留）。已解锁 ${CG_LIST.filter(c => got[c[0]]).length}/${CG_LIST.length}</p><div class="album">${CG_LIST.map(([id, n]) => got[id] ? `<div class="al" data-cg="${id}" style="background-image:url(assets/cg/${id}.webp)"><span>${n}</span></div>` : `<div class="al lock"><span>？？？</span></div>`).join('')}</div>`;
    b.onclick = e => { const a = e.target.closest('[data-cg]'); if (!a) return; const w = h('div', 'chapter-fx', `<div class="cx-img" style="background-image:url(assets/cg/${a.dataset.cg}.webp)"></div>`); w.onclick = () => w.remove(); document.body.appendChild(w); };
  };
  const _more = UI.p_more; UI.p_more = function (b, re, close) {
    _more.call(this, b, re, close);
    const g = b.querySelector('.grid3'); if (g && !g.querySelector('[data-k="album"]')) { const x = h('button', 'big2', `<i style="${iconCss('scroll', 48)}"></i>回忆图鉴`); x.dataset.k = 'album'; g.insertBefore(x, g.children[5] || null); }
  };
})();
(function () {
  const _panel = UI.panel; UI.panel = async function (name, tab) {
    if (name === 'gacha') Audio2.bgm('gacha');
    const r = await _panel.call(this, name, tab);
    if (name === 'gacha' && R.mapId && MAPINFO[R.mapId] && R.mode === 'map') Audio2.bgm(MAPINFO[R.mapId].bgm);
    return r;
  };
})();
(function () { const _b = UI.battleUI; UI.battleUI = function (on) { document.body.classList.toggle('inbattle', !!on); return _b.apply(this, arguments); }; })();

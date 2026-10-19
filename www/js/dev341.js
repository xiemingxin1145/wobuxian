'use strict';
// ======================= 3.4.1 作弊菜单重做（开发者面板新增 Tab）=======================
// 在 ux23.js 的 UI.p_dev 外包一层：追加「功法 / 装备 / 天赋 / 金手指 / 道具」5 个 Tab。
// 每个 Tab：顶部搜索框 + 按类别分组的可滚动列表，点按即发放；改动写进 G（或轮回殿 meta），立刻 Game.save()，
// 读档后仍在，并在正常界面（背包/角色/功法/洞府/悟道/坐骑时装/伙伴）可见。数据全部取自现有表：
// TECHS / SKILLS(st_*) / DAO28.BRANCHES / SKILL_TREE / EQ_BASES·SLOTS·RARITY / FABAO / TALENTS / LINGGEN / MINGGE / NITIAN /
// STATS / NPCS / PET_SKILL / MOUNTS / COSTUMES / CAVE / ITEMS。
// 金手指开关存在 G.cheat（{stone,xyf,ap,brk,luck}，缺省 undefined = 全关，不升 G.v）。
const DEV341 = {
  TABS: [['gf', '功法'], ['eq', '装备'], ['tf', '天赋'], ['jsz', '金手指'], ['it', '道具']],
  rar: 4, tier: null, qty: 10,
  q: {},  // 每个 Tab 的搜索词
  NUMK: ['stone', 'debt', 'lifeBonus', 'cultBonus', 'apBonus', 'atkBonus', 'defBonus', 'hpBonus', 'alchBonus', 'catchBonus', 'jieRes', 'pillBonus', 'brkBonus', 'medBonus', 'spdBonus', 'critBonus'],
  ITG: { pill: '丹药', mat: '材料', gift: '礼物', misc: '杂物', quest: '任务物品', tal: '符箓' },
  MG_ONCE: { wuxing: ['cultBonus', 0.12], tianmo: ['cultBonus', 0.25], nitian: ['brkBonus', 0.08], yaoxiang: ['alchBonus', 0.05], shoulei: ['catchBonus', 0.15], fuyuan: ['luck', 2] },
  cheat(k) { const G = Game.G; return !!(G && G.cheat && G.cheat[k]); },
  // ---- 天赋/逆天改命：f(G) 作用在探针上求增量，添加 +Δ、移除 −Δ（精确可逆） ----
  delta(f) { const G = Game.G; const p = { st: {}, flags: {} }; for (const k of this.NUMK) p[k] = 0; for (const k in G.st) p.st[k] = 0; try { f(p); } catch (e) { } return p; },
  applyDelta(d, s) { const G = Game.G; for (const k of this.NUMK) if (d[k]) G[k] = (G[k] || 0) + s * d[k]; for (const k in d.st) if (d.st[k]) G.st[k] = Math.max(0, (G.st[k] || 0) + s * d.st[k]); for (const k in d.flags) { if (s > 0) G.flags[k] = d.flags[k]; else delete G.flags[k]; } },
  esc: s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]),
  b(x, id, v, t, on, dis) { return `<button class="sm dvx${on ? ' on' : ''}" data-x="${x}" data-id="${this.esc(id)}"${v !== undefined ? ` data-v="${v}"` : ''}${dis ? ' disabled' : ''}>${t}</button>`; },
  row(kind, id, title, sub, btns, on) { return `<div class="dvi${on ? ' on' : ''}" data-kind="${kind}" data-id="${this.esc(id)}" data-s="${this.esc((title + ' ' + id + ' ' + sub).toLowerCase())}"><div class="dvt"><b>${title}</b><small>${sub}</small></div><div class="dvb">${btns}</div></div>`; },
  sec(n, body, open = true) { return `<details class="dvs"${open ? ' open' : ''}><summary>${n}</summary>${body}</details>`; },
  // ====== 行渲染（kind → html），动作后只刷新同 kind 的行，不重绘整个面板（保住滚动位置与搜索词） ======
  rows: {
    tech(id) { const G = Game.G, T = TECHS[id], lv = G.techs[id] || 0; return DEV341.row('tech', id, T.n, `${lv ? '已学·第' + lv + '层' : '未学'}｜${T.d}｜技能：${T.sk.map(k => (SKILLS[k] || {}).n || k).join('、')}`, (lv ? '' : DEV341.b('tech', id, 1, '学会')) + [1, 2, 3, 4, 5].filter(k => lv && k !== lv).map(k => DEV341.b('tech', id, k, k === 5 ? '满' : k + '层')).join('') + (lv ? DEV341.b('tech', id, 0, '遗忘') : ''), lv > 0); },
    st(id) { const G = Game.G; DAO28.ensure(); const S = SKILLS[id], has = G.shentong.includes(id), eq = G.shentongEq.includes(id), sl = DAO28.slots(); return DEV341.row('st', id, S.n, `${has ? (eq ? '已装备' : '已悟得') : '未悟'}｜${S.d}｜神通槽 ${sl}${sl ? '' : '（金丹解锁）'}`, (has ? '' : DEV341.b('st', id, 'get', '悟得')) + (has && !eq ? DEV341.b('st', id, 'eq', '装备') : '') + (eq ? DEV341.b('st', id, 'uneq', '卸下') : '') + (has ? DEV341.b('st', id, 'del', '遗忘') : ''), has); },
    dao(id) { const br = DAO28.BRANCHES.find(x => x.id === id), lv = DAO28.lv(id); return DEV341.row('dao', id, '悟道·' + br.n, `第 ${lv} 层｜${br.d}`, [0, 1, 2, 3, 4, 5].filter(k => k !== lv).map(k => DEV341.b('dao', id, k, k + '')).join(''), lv > 0); },
    tree(id) { const G = Game.G, br = SKILL_TREE.find(x => x.id === id), lv = G.tree[id] || 0; return DEV341.row('tree', id, '技能树·' + br.n, `已点 ${lv}/5｜${br.nodes.map(n => n[0]).join('→')}`, [0, 1, 2, 3, 4, 5].filter(k => k !== lv).map(k => DEV341.b('tree', id, k, k + '')).join(''), lv > 0); },
    eqb(id) { const G = Game.G; const [slot, k] = id.split(':'); const bs = EQ_BASES[slot][+k]; const own = G.eqs.filter(e => e.slot === slot && e.base === bs[0]); const on = own.some(e => G.eq[slot] === e.uid); return DEV341.row('eqb', id, `<i class="dvic" style="${iconCss(bs[1], 30)}"></i>${bs[0]}`, `${(SLOTS.find(s => s[0] === slot) || [, slot])[1]}｜持有 ${own.length}${on ? '｜穿戴中' : ''}${slot === 'treasure' && TREASURE_FX[bs[0]] ? '｜' + TREASURE_FX[bs[0]] : ''}`, DEV341.b('eqb', id, 'get', '获得') + DEV341.b('eqb', id, 'wear', '获得并穿上'), on); },
    fb(id) { const G = Game.G, F = FABAO[id], f = G.fb33 && G.fb33.id === id ? G.fb33 : null; return DEV341.row('fb', id, `<i class="dvic" style="${iconCss(F.ic, 30)}"></i>${F.n}`, `${f ? `本命·${f.tier} 阶·器灵好感 ${f.aff || 0}` : '未炼'}｜每阶${F.sd}+${Math.round(F.per * 100)}%｜器灵 ${F.ling}`, [1, 3, 5, 6, 9].filter(t => !f || f.tier !== t).map(t => DEV341.b('fb', id, t, t + '阶')).join('') + (f ? DEV341.b('fb', id, 'aff', '好感100') : ''), !!f); },
    tal(id) { const G = Game.G, T = TALENTS.find(x => x.id === id), on = G.talents.includes(id); return DEV341.row('tal', id, `<span style="color:${T.r ? RCOL[T.r] : '#5a4a3a'}">${T.n}</span>`, T.d, on ? DEV341.b('tal', id, 'del', '移除') : DEV341.b('tal', id, 'add', '添加'), on); },
    lg(id) { const G = Game.G, L = LINGGEN.find(x => x.id === id), on = G.lg === id; return DEV341.row('lg', id, L.n, `修炼×${L.mult}｜${L.el.join('') || '无'}｜${L.d}`, on ? '<span class="tag">当前</span>' : DEV341.b('lg', id, 'set', '设为灵根'), on); },
    mg(id) { const G = Game.G, M = MINGGE.find(x => x.id === id), on = Array.isArray(G.mingge) && G.mingge.includes(id); return DEV341.row('mg', id, `<span style="color:${M.q ? MG_Q[M.q][1] : '#5a4a3a'}">【${MG_Q[M.q][0]}】${M.n}</span>`, M.d, on ? DEV341.b('mg', id, 'del', '移除') : DEV341.b('mg', id, 'add', '添加'), on); },
    nt(id) { const G = Game.G, X = NITIAN.find(x => x.id === id), on = (G.nt || []).includes(id); return DEV341.row('nt', id, '逆天·' + X.n, X.d, on ? DEV341.b('nt', id, 'del', '移除') : DEV341.b('nt', id, 'add', '添加'), on); },
    stat(id) { const G = Game.G, n = STATS.find(s => s[0] === id)[1]; return DEV341.row('stat', id, n, `当前 ${G.st[id]}`, DEV341.b('stat', id, -1, '−1') + DEV341.b('stat', id, 1, '+1') + DEV341.b('stat', id, 5, '+5') + DEV341.b('stat', id, 30, '=30'), false); },
    chk(id) { const on = DEV341.cheat(id); const N = { stone: ['无限灵石', '灵石始终 ≥1 亿'], xyf: ['无限仙缘符', '仙缘符始终 ≥999'], ap: ['无限行动力', '行动力始终回满'], brk: ['必定突破', '冲击瓶颈 100% 成功，天劫不掉血'], luck: ['100% 掉落/奇遇', '斗法掉落必出、必掉装备；每年过年必加一次奇遇事件'] }[id]; return DEV341.row('chk', id, N[0], N[1] + '｜存档内开关', DEV341.b('chk', id, on ? 0 : 1, on ? '开 ✓' : '关', on), on); },
    npc(id) { const G = Game.G, N = NPCS[id], a = G.aff[id] || 0, L = typeof Life34 !== 'undefined' ? Life34.st() : null, r = L ? (L.rel[id] || 0) : null; const mp = typeof Track !== 'undefined' && Track.mapOf ? Track.mapOf(id) : N.map; return DEV341.row('npc', id, N.n, `好感 ${a}${r !== null ? '｜恩怨 ' + r : ''}｜${(MAPINFO[mp] || {}).n || ''}`, [0, 60, 100, 150].map(v => DEV341.b('aff', id, v, '好' + v, a === v)).join('') + (L ? [-50, 0, 50, 100].map(v => DEV341.b('rel', id, v, '恩' + v, r === v)).join('') : ''), false); },
    comp(id) { const G = Game.G, N = NPCS[id]; const st = G.partner === id ? '💗道侣' : G.follower === id ? '同行中' : '—'; return DEV341.row('comp', id, N.n, `伙伴｜${st}｜好感 ${G.aff[id] || 0}`, (G.follower === id ? DEV341.b('comp', id, 'off', '回去') : DEV341.b('comp', id, 'fol', '同行')) + (G.partner === id ? DEV341.b('comp', id, 'unp', '解除道侣') : DEV341.b('comp', id, 'par', '结为道侣')), G.follower === id || G.partner === id); },
    pet(id) { const G = Game.G, n = G.pets.filter(p => p.mon === id).length; return DEV341.row('pet', id, `<i class="dvic" style="${porCss(MONS[id].spr, 30)}"></i>${MONS[id].n}`, `灵兽｜持有 ${n}｜技能：${[].concat(PET_SKILL[id] || []).map(k => (SKILLS[k] || {}).n || k).join('、')}`, DEV341.b('pet', id, 1, '获得'), n > 0); },
    mount(id) { const G = Game.G; Sys.ensure(G); const M = MOUNTS[id], has = G.mounts.includes(id); return DEV341.row('mount', id, M.n, `坐骑｜${has ? (G.mount === id ? '骑乘中' : '已拥有') : '未拥有'}｜${M.d}`, (has ? '' : DEV341.b('mount', id, 'get', '获得')) + (G.mount === id ? '' : DEV341.b('mount', id, 'ride', '骑乘')), has); },
    cos(id) { const G = Game.G; Sys.ensure(G); const C = COSTUMES[id], has = !!Game.meta.cos[id]; return DEV341.row('cos', id, C.n, `时装｜${has ? (G.costume === id ? '穿着中' : '已解锁') : '未解锁'}｜${C.d}`, (has ? '' : DEV341.b('cos', id, 'get', '解锁')) + (G.costume === id ? '' : DEV341.b('cos', id, 'wear', '穿上')), has); },
    cave(id) { const G = Game.G; Sys.ensure(G); const C = CAVE[id], lv = G.cave[id] || 0; return DEV341.row('cave', id, '洞府·' + C.n, `${lv}/${C.max} 级｜${C.d(lv)}`, Array.from({ length: C.max + 1 }, (_, k) => k).filter(k => k !== lv).map(k => DEV341.b('cave', id, k, k + '级')).join(''), lv > 0); },
    item(id) { const G = Game.G, I = ITEMS[id], n = G.inv[id] || 0; return DEV341.row('item', id, `<i class="dvic" style="${iconCss(I.ic, 30)}"></i>${I.n}`, `持有 ${n}｜${I.d || ''}`, DEV341.b('item', id, 'add', '+' + DEV341.qty) + (n ? DEV341.b('item', id, 'clr', '清空') : ''), n > 0); },
  },
  list(kind, ids) { return ids.map(id => { try { return this.rows[kind](id); } catch (e) { console.error('dev341 row', kind, id, e); return ''; } }).join(''); },
  chips(x, vals, cur, fmtv) { return `<div class="dvchips">${vals.map(v => `<button class="sm dvx${v === cur ? ' on' : ''}" data-x="${x}" data-id="_" data-v="${v}">${fmtv ? fmtv(v) : v}</button>`).join('')}</div>`; },
  // ====== Tab 内容 ======
  body(tab) {
    const G = Game.G; const q = this.q[tab] || '';
    const top = `<div class="dvsearch"><input type="search" class="dvq" placeholder="搜索名称/描述…" value="${this.esc(q)}"><button class="sm dvx" data-x="qclr" data-id="_">清空</button></div>`;
    if (tab === 'gf') {
      const grp = id => { const T = TECHS[id]; return T.sect ? '宗门功法' : id === 'xiandao' ? '仙界功法' : T.el ? '五行心法' : '杂学功法'; };
      const gs = {}; for (const id in TECHS) (gs[grp(id)] = gs[grp(id)] || []).push(id);
      DAO28.ensure();
      return top + `<div class="devg">${this.b('techall', '_', 5, '全部功法学满 5 层')}${this.b('stall', '_', 1, '全部神通悟得并装备')}${this.b('daopts', '_', 10, '悟道点 +10')}${this.b('pts', '_', 10, '技能点 +10')}</div>`
        + Object.entries(gs).map(([n, ids]) => this.sec(`${n}（${ids.length}）`, this.list('tech', ids))).join('')
        + this.sec(`神通（${Object.keys(SKILLS).filter(k => k.startsWith('st_')).length}）`, this.list('st', Object.keys(SKILLS).filter(k => k.startsWith('st_'))))
        + this.sec('悟道树（参悟悟道）', this.list('dao', DAO28.BRANCHES.map(b => b.id)))
        + this.sec('技能树', this.list('tree', SKILL_TREE.map(b => b.id)));
    }
    if (tab === 'eq') {
      if (this.tier === null) this.tier = Math.max(1, G.realm);
      const ids = []; for (const [s] of SLOTS) EQ_BASES[s].forEach((_, k) => ids.push(s + ':' + k));
      return top + `<div class="devr">品质 ${this.chips('rar', [0, 1, 2, 3, 4], this.rar, v => RARITY[v].n)}</div><div class="devr">阶位 ${this.chips('tier', [0, 1, 2, 3, 4, 5, 6, 7, 9, 12], this.tier)}</div>
        <div class="devg">${this.b('eqset', '_', 1, '一键全套（当前品质/阶位）')}${this.b('eqclr', '_', 1, '清理未穿戴装备')}</div>`
        + SLOTS.map(([s, n]) => this.sec(`${n}（${EQ_BASES[s].length}）`, this.list('eqb', ids.filter(x => x.startsWith(s + ':'))))).join('')
        + this.sec(`本命法宝 1–9 阶（洞府面板${G.realm >= 2 ? '' : '·需筑基才显示'}）`, this.list('fb', Object.keys(FABAO)));
    }
    if (tab === 'tf') {
      const RN = ['白·凡', '蓝·稀有', '紫·史诗', '橙·传说'];
      return top + [0, 1, 2, 3].map(r => this.sec(`天赋·${RN[r]}`, this.list('tal', TALENTS.filter(t => t.r === r).map(t => t.id)))).join('')
        + this.sec('灵根', this.list('lg', LINGGEN.map(l => l.id)))
        + [0, 1, 2].map(qq => this.sec(`先天命格·${MG_Q[qq][0]}品`, this.list('mg', MINGGE.filter(m => m.q === qq).map(m => m.id)))).join('')
        + this.sec('逆天改命', this.list('nt', NITIAN.map(x => x.id)), false)
        + this.sec('基础属性', this.list('stat', STATS.map(s => s[0])));
    }
    if (tab === 'jsz') {
      const comps = Object.keys(NPCS).filter(k => NPCS[k].comp);
      return top + this.sec('开关（存档内）', this.list('chk', ['stone', 'xyf', 'ap', 'brk', 'luck']))
        + `<div class="devg">${this.b('maxst', '_', 1, '全属性拉满（=30）')}${this.b('maxexp', '_', 1, '修为加满（到瓶颈）')}${this.b('life', '_', 1, '寿元 +1000')}${this.b('debt0', '_', 1, '欠款清零')}${this.b('heal', '_', 1, '满血满蓝')}${this.b('maps', '_', 1, '解锁全部地图', G.flags.devmaps)}${this.b('sys', '_', 1, '解锁全部系统')}${this.b('allaff', '_', 100, '全部 NPC 好感 100')}</div>`
        + this.sec(`伙伴 / 道侣（${comps.length}）`, this.list('comp', comps), false)
        + this.sec(`灵兽（${Object.keys(PET_SKILL).filter(k => MONS[k]).length}）`, this.list('pet', Object.keys(PET_SKILL).filter(k => MONS[k])), false)
        + this.sec(`坐骑（${Object.keys(MOUNTS).length}）`, this.list('mount', Object.keys(MOUNTS)), false)
        + this.sec(`时装（${Object.keys(COSTUMES).length}）`, this.list('cos', Object.keys(COSTUMES)), false)
        + this.sec('洞府', this.list('cave', Object.keys(CAVE)), false)
        + this.sec(`NPC 好感 / 恩怨（${Object.keys(NPCS).length}）`, this.list('npc', Object.keys(NPCS)), false);
    }
    if (tab === 'it') {
      const gs = {}; for (const k in ITEMS) { const g = this.ITG[ITEMS[k].t] || '其他'; (gs[g] = gs[g] || []).push(k); }
      return top + `<div class="devr">数量 ${this.chips('qty', [1, 10, 99, 999], this.qty)}</div><div class="devg">${this.b('itall', '_', 1, `全部道具 +${this.qty}`)}</div>`
        + Object.entries(gs).map(([n, ids]) => this.sec(`${n}（${ids.length}）`, this.list('item', ids))).join('');
    }
    return '';
  },
  filter(b, tab) {
    const q = (this.q[tab] || '').trim().toLowerCase();
    b.querySelectorAll('.dvi').forEach(r => { r.style.display = !q || r.dataset.s.includes(q) ? '' : 'none'; });
    b.querySelectorAll('.dvs').forEach(s => { const any = [...s.querySelectorAll('.dvi')].some(r => r.style.display !== 'none'); s.style.display = any || !s.querySelector('.dvi') ? '' : 'none'; if (q && any) s.open = true; });
  },
  refresh(b, kinds) { for (const r of b.querySelectorAll('.dvi')) if (!kinds || kinds.includes(r.dataset.kind)) { const t = document.createElement('div'); t.innerHTML = this.rows[r.dataset.kind](r.dataset.id); const n = t.firstElementChild; n.style.display = r.style.display; r.replaceWith(n); } },
  // ====== 动作 ======
  act(x, id, v, b) {
    const G = Game.G; G.dev = 1; let msg = '', kinds = null, rerender = false;
    const realmSet = (r, s) => { G.realm = r; G.stage = s; G.exp = Math.floor(Game.need() * 0.5); G.flags.awakened = 1; if (R.player) { R.player.spr = Game.playerSpr(); loadSprite(R.player.spr); } const st = Game.stats(); G.hp = st.mhp; G.mp = st.mmp; Game.checkMain(); Game.refreshNpcs(); };
    switch (x) {
      case 'qclr': this.q[DEV.tab] = ''; b.querySelector('.dvq').value = ''; this.filter(b, DEV.tab); return;
      case 'tech': if (+v === 0) { delete G.techs[id]; msg = '遗忘 ' + TECHS[id].n; } else { Game.learn(id); G.techs[id] = +v; msg = `${TECHS[id].n} 第${v}层`; } kinds = ['tech']; break;
      case 'techall': for (const k in TECHS) { Game.learn(k); G.techs[k] = 5; } msg = '全部功法第 5 层'; kinds = ['tech']; break;
      case 'st': DAO28.ensure(); { const sl = DAO28.slots();
        if (v === 'get' && !G.shentong.includes(id)) G.shentong.push(id);
        if (v === 'eq') { if (!sl) { UI.toast('神通槽为 0：金丹期才能装备（可在「境界」页提升）'); return; } G.shentongEq = G.shentongEq.filter(s => G.shentong.includes(s)); if (G.shentongEq.length >= sl) G.shentongEq.shift(); G.shentongEq.push(id); }
        if (v === 'uneq') G.shentongEq = G.shentongEq.filter(s => s !== id);
        if (v === 'del') { G.shentong = G.shentong.filter(s => s !== id); G.shentongEq = G.shentongEq.filter(s => s !== id); } }
        msg = SKILLS[id].n + ' ' + ({ get: '悟得', eq: '已装备', uneq: '已卸下', del: '已遗忘' })[v]; kinds = ['st']; break;
      case 'stall': DAO28.ensure(); { const all = Object.keys(SKILLS).filter(k => k.startsWith('st_')); for (const s of all) if (!G.shentong.includes(s)) G.shentong.push(s); G.shentongEq = all.slice(0, DAO28.slots()); msg = `悟得 ${all.length} 个神通，装备 ${G.shentongEq.length} 个（槽 ${DAO28.slots()}）`; } kinds = ['st']; break;
      case 'dao': DAO28.ensure(); { const br = DAO28.BRANCHES.find(q => q.id === id); G.dao[id] = +v; for (const [lv, sid] of Object.entries(br.unlocks || {})) if (+v >= +lv && !G.shentong.includes(sid)) G.shentong.push(sid); msg = `悟道·${br.n} ${v} 层`; } kinds = ['dao', 'st']; break;
      case 'daopts': DAO28.ensure(); G.daoPoints += 10; msg = '悟道点 ' + G.daoPoints; break;
      case 'tree': G.tree[id] = +v; msg = '技能树 ' + id + ' = ' + v; kinds = ['tree']; break;
      case 'pts': G.pts += 10; msg = '技能点 ' + G.pts; break;
      case 'rar': this.rar = +v; rerender = true; break;
      case 'tier': this.tier = +v; rerender = true; break;
      case 'qty': this.qty = +v; rerender = true; break;
      case 'eqb': { const [slot, k] = id.split(':'); const e = this.mkEq(slot, +k); msg = `获得【${e.name}】`; if (v === 'wear') { Game.equip(e.uid); msg += '并穿上'; } kinds = ['eqb']; break; }
      case 'eqset': for (const [slot] of SLOTS) { const e = this.mkEq(slot, slot === 'weapon' || slot === 'armor' ? EQ_BASES[slot].length - 1 : 0); Game.equip(e.uid); } msg = `全套 ${RARITY[this.rar].n}·${this.tier} 阶 已穿上`; kinds = ['eqb']; break;
      case 'eqclr': { const on = Object.values(G.eq); const n0 = G.eqs.length; G.eqs = G.eqs.filter(e => on.includes(e.uid)); msg = `清理 ${n0 - G.eqs.length} 件`; kinds = ['eqb']; break; }
      case 'fb': if (v === 'aff') { G.fb33.aff = 100; if (G.fb33.tier >= 9) G.fb33.s100 = G.fb33.s100 || 0; msg = FABAO[id].ling + ' 好感 100'; } else { const keep = G.fb33 && G.fb33.id === id ? G.fb33 : null; G.fb33 = { id, tier: +v, spent: keep ? keep.spent || 0 : 0, aff: +v >= 6 ? (keep ? keep.aff || 0 : 0) : 0, wipe: keep ? keep.wipe || 0 : 0 }; msg = `本命法宝 ${FABAO[id].n} ${v} 阶`; } kinds = ['fb']; break;
      case 'tal': { const T = TALENTS.find(t => t.id === id); const d = this.delta(T.f); if (v === 'add' && !G.talents.includes(id)) { G.talents.push(id); this.applyDelta(d, 1); } if (v === 'del' && G.talents.includes(id)) { G.talents = G.talents.filter(t => t !== id); this.applyDelta(d, -1); } msg = `天赋 ${T.n} ${v === 'add' ? '已添加' : '已移除'}`; kinds = ['tal', 'stat']; break; }
      case 'lg': G.lg = id; G.flags.awakened = 1; msg = '灵根：' + LINGGEN.find(l => l.id === id).n; kinds = ['lg']; break;
      case 'mg': { if (!Array.isArray(G.mingge)) G.mingge = []; const M = MINGGE.find(m => m.id === id);
        if (v === 'add' && !G.mingge.includes(id)) { if (id === 'tianmo') G.mingge = G.mingge.filter(m => m !== 'dao_xin'); if (id === 'dao_xin') G.mingge = G.mingge.filter(m => m !== 'tianmo'); G.mingge.push(id); MG33.applyOnce(G); }
        if (v === 'del') { G.mingge = G.mingge.filter(m => m !== id); const o = this.MG_ONCE[id]; if (o && G.flags.mg33_once && G.flags.mg33_once[id]) { if (o[0] === 'luck') G.st.luck = Math.max(0, G.st.luck - o[1]); else G[o[0]] = (G[o[0]] || 0) - o[1]; delete G.flags.mg33_once[id]; } }
        msg = `命格 ${M.n} ${v === 'add' ? '已添加' : '已移除'}`; kinds = ['mg', 'stat']; break; }
      case 'nt': { G.nt = G.nt || []; const X = NITIAN.find(q => q.id === id); const d = this.delta(X.f); if (v === 'add' && !G.nt.includes(id)) { G.nt.push(id); this.applyDelta(d, 1); } if (v === 'del' && G.nt.includes(id)) { G.nt = G.nt.filter(q => q !== id); this.applyDelta(d, -1); } msg = `逆天改命 ${X.n} ${v === 'add' ? '已添加' : '已移除'}`; kinds = ['nt', 'stat']; break; }
      case 'stat': G.st[id] = +v === 30 ? 30 : Math.max(0, G.st[id] + +v); msg = id + ' = ' + G.st[id]; kinds = ['stat']; break;
      case 'chk': G.cheat = G.cheat || {}; G.cheat[id] = +v ? 1 : 0; this.tick(); msg = '金手指已' + (+v ? '开启' : '关闭'); kinds = ['chk']; break;
      case 'maxst': for (const [k] of STATS) G.st[k] = Math.max(G.st[k], 30); msg = '五项属性 30'; break;
      case 'maxexp': Game.addExp(Game.need() * 10, true); msg = `修为 ${fmt(G.exp)}/${fmt(Game.need())}`; break;
      case 'life': G.lifeBonus = (G.lifeBonus || 0) + 1000; msg = '寿元上限 ' + Game.lifeMax(); break;
      case 'debt0': G.debt = 0; msg = '欠款 0'; break;
      case 'heal': { const s = Game.stats(); G.hp = s.mhp; G.mp = s.mmp; msg = '满血满蓝'; break; }
      case 'maps': G.flags.awakened = 1; G.flags.devmaps = 1; msg = '全部地图已解锁'; rerender = true; break;
      case 'sys': { G.flags.awakened = 1; G.flags.devmaps = 1; if (G.realm < 4) realmSet(4, 0); if (!G.sect) Game.joinSect(Object.keys(SECTS)[0]); Sys.ensure(G); for (const k in CAVE) G.cave[k] = CAVE[k].max; if (!G.fb33) G.fb33 = { id: 'fb_jian', tier: 1, spent: 0, aff: 0, wipe: 0 }; DAO28.ensure(); if (!Array.isArray(G.mingge)) G.mingge = []; msg = '已解锁：全部地图、元婴（法宝/神通/化身）、宗门、洞府满级'; rerender = true; break; }
      case 'allaff': for (const k in NPCS) G.aff[k] = 100; msg = '全部 NPC 好感 100'; kinds = ['npc', 'comp']; break;
      case 'aff': G.aff[id] = +v; msg = `${NPCS[id].n} 好感 ${v}`; kinds = ['npc', 'comp']; break;
      case 'rel': Life34.st().rel[id] = +v; msg = `${NPCS[id].n} 恩怨 ${v}`; kinds = ['npc']; break;
      case 'comp': { const N = NPCS[id];
        if (v === 'fol') { G.aff[id] = Math.max(G.aff[id] || 0, 60); G.follower = id; }
        if (v === 'off' && G.follower === id) G.follower = null;
        if (v === 'par') { G.aff[id] = Math.max(G.aff[id] || 0, 100); if (G.partner && G.partner !== id) G.aff[G.partner] = Math.min(G.aff[G.partner] || 0, 99); G.partner = id; G.follower = id; Game.ach && Game.ach('partner'); }
        if (v === 'unp' && G.partner === id) { G.partner = null; if (G.follower === id) G.follower = null; }
        if (typeof R !== 'undefined' && R.ents) { R.ents = R.ents.filter(e => e.kind !== 'comp'); Game.refreshNpcs(); }
        msg = `${N.n}：${({ fol: '同行', off: '回去了', par: '结为道侣', unp: '解除道侣' })[v]}`; kinds = ['comp', 'npc']; break; }
      case 'pet': { const p = Game.addPet(id, Math.max(0, G.realm)); if (Game.spawnPetEnt) try { Game.spawnPetEnt(); } catch (e) { } msg = '获得灵兽 ' + p.name; kinds = ['pet']; break; }
      case 'mount': Sys.ensure(G); if (v === 'get') Sys.addMount(id, true); if (v === 'ride') { Sys.addMount(id, true); Sys.setMount(id); } msg = MOUNTS[id].n + (v === 'ride' ? ' 骑乘中' : ' 已获得'); kinds = ['mount']; break;
      case 'cos': Sys.ensure(G); Game.meta.cos[id] = 1; Game.saveMeta(); if (v === 'wear') Sys.setCostume(id); msg = COSTUMES[id].n + (v === 'wear' ? ' 已穿上' : ' 已解锁'); kinds = ['cos']; break;
      case 'cave': Sys.ensure(G); G.cave[id] = +v; msg = `${CAVE[id].n} ${v} 级`; kinds = ['cave']; break;
      case 'item': if (v === 'clr') delete G.inv[id]; else Game.give(id, this.qty); msg = `${ITEMS[id].n} ×${G.inv[id] || 0}`; kinds = ['item']; break;
      case 'itall': for (const k in ITEMS) Game.give(k, this.qty); msg = `全部道具 +${this.qty}`; kinds = ['item']; break;
      default: return;
    }
    Sfx.play('click'); Game.save(); UI.hud(); if (msg) UI.toast('已执行：' + msg);
    return rerender ? 're' : kinds || ['__none'];
  },
  mkEq(slot, k) {
    const G = Game.G; const bs = EQ_BASES[slot][k]; const e = Game.makeEq(slot, this.tier === null ? G.realm : this.tier, this.rar);
    e.base = bs[0]; e.ic = bs[1]; e.name = (this.rar ? RARITY[this.rar].n + '·' : '') + bs[0]; G.eqs.push(e); if (this.rar === 4) Game.ach('legend'); return e;
  },
  tick() {
    const G = Game.G; if (!G || !G.cheat || G.dead) return; const c = G.cheat; let ch = false;
    if (c.stone && G.stone < 1e8) { G.stone = 1e8; ch = true; }
    if (c.xyf && (G.inv.xyf || 0) < 999) { G.inv.xyf = 999; ch = true; }
    if (c.ap && G.ap < Game.apMax()) { G.ap = Game.apMax(); ch = true; }
    if (ch && UI.hud) UI.hud();
  },
};
window.DEV341 = DEV341;
// ---- 扩展接口：其他文件给开发者面板加 Tab（如开放世界线的「开放世界」）----
// 用法（任意加载顺序，dev341.js 之前 push 到 window.DevTabs 也行）：
//   DevPanel.registerTab('ow', '开放世界', (box, ctx) => { box.innerHTML = '<button class="opt" data-ow="x">…</button>'; box.onclick = e => { …; ctx.save(); ctx.toast('…'); }; });
//   ctx = { G: Game.G, close(), rerender(), save(), toast(msg) }；render 抛错只在该 Tab 里显示错误，不影响其他 Tab。
// 同 key 重复注册 = 覆盖。没有注册任何 Tab 时面板与原来一样。
window.DevTabs = window.DevTabs || [];
const DevPanel = window.DevPanel = {
  registerTab(key, name, render) { if (!key || typeof render !== 'function') return false; const L = window.DevTabs; const i = L.findIndex(t => t.key === key); const t = { key: String(key), name: String(name || key), render }; if (i >= 0) L[i] = t; else L.push(t); return true; },
  tabs() { return (window.DevTabs || []).filter(t => t && t.key && typeof t.render === 'function' && !DEV341.TABS.some(x => x[0] === t.key) && !['res', 'realm', 'unlock', 'story', 'tp', 'show', 'dbg'].includes(t.key)); },
};
(function () {
  const css = document.createElement('style');
  css.textContent = `.devtabs .dt{width:auto;min-width:52px;padding:0 6px;min-height:0}
.dvsearch{display:flex;gap:6px;margin:4px 0 6px;position:sticky;top:-10px;z-index:2;background:#f3e6c4;padding:4px 0}.dvsearch input{flex:1;min-width:0;height:38px;border-radius:8px;border:1px solid #c8a060;padding:0 10px;font-size:15px;font-family:inherit}
.dvs{margin:6px 0;border:1px solid #d8b26a;border-radius:10px;background:rgba(255,255,255,.35)}.dvs>summary{padding:10px;font-weight:bold;color:#7a2a1a;font-size:14px}
.dvi{display:flex;flex-wrap:wrap;align-items:center;gap:4px;padding:6px 8px;border-top:1px dashed #e0c890}.dvi.on{background:rgba(255,210,90,.18)}
.dvt{flex:1 1 150px;min-width:0}.dvt b{display:flex;align-items:center;gap:4px;font-size:14px}.dvt small{display:block;color:#7a5a3a;font-size:11px;line-height:1.35}
.dvb{display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end}.dvx{min-height:36px;min-width:40px;padding:4px 8px;font-size:12px}.dvx.on{background:#d08a10;color:#fff}
.devr .opt.spd{flex:1;min-width:0;width:auto}
.dvchips{display:flex;flex-wrap:wrap;gap:4px}.dvic{display:inline-block;width:30px;height:30px;flex:none}`;
  document.head.appendChild(css);
  const _pd = UI.p_dev; UI.p_dev = function (b, re, close, tab) {
    tab = tab || DEV.tab || 'res';
    const mine = DEV341.TABS.some(t => t[0] === tab);
    // 3.4.1 修：原面板每点一个按钮就整页重绘、滚动条跳回顶部（剧情/传送等长列表点一下就找不到位置）→ 同一 Tab 内重绘保留滚动位置
    const re2 = t => { const same = (t || DEV.tab) === tab; const sc = b.scrollTop; re(t); if (same) { const nb = document.querySelector('#modals .mwrap:last-child .pb'); if (nb) nb.scrollTop = sc; } };
    const r = _pd.call(this, b, re2, close, tab);
    if (tab === 'dbg' && window.DevEntry25) { // v2.5 浮动入口同样放进面板（浮动按钮在弹窗层之下）
      const d = document.createElement('div'); d.className = 'devg'; d.innerHTML = '<button class="opt" data-v25="trial">试炼场 / 阶段3债务奇遇</button><button class="opt" data-v25="rt">即时战（原型）</button><button class="opt" data-v25="eq">全套神装（神品）</button>';
      const flags = b.querySelector('details'); b.insertBefore(d, flags || null);
      d.addEventListener('click', async e => { const t = e.target.closest('[data-v25]'); if (!t) return; e.stopPropagation(); const k = t.dataset.v25;
        if (k === 'eq') { DevEntry25.giveFullGodGear(); UI.toast('已执行：全套神装（已穿上）'); UI.hud(); return; }
        close(); if (k === 'trial') await DevEntry25.trial(); if (k === 'rt' && window.RealtimeBattle) await RealtimeBattle.start(); });
    }
    const bar = b.querySelector('.devtabs'); if (!bar) return r;
    const ext = DevPanel.tabs();
    for (const [k, n] of DEV341.TABS.concat(ext.map(t => [t.key, t.name]))) { const t = document.createElement('button'); t.className = 'dt' + (k === tab ? ' on' : ''); t.dataset.t = k; t.textContent = n; bar.appendChild(t); }
    const xt = ext.find(t => t.key === tab);
    if (xt) { const box = document.createElement('div'); box.className = 'dvext'; b.appendChild(box);
      const ctx = { G: Game.G, close, rerender: () => re2(tab), save: () => { if (Game.G) { Game.G.dev = 1; Game.save(); } UI.hud(); }, toast: m => UI.toast(m) };
      try { xt.render(box, ctx); } catch (er) { console.error('DevTab ' + tab, er); box.innerHTML = `<p class="hint">「${DEV341.esc(xt.name)}」渲染出错：${DEV341.esc(er.message)}</p>`; }
      box.addEventListener('click', e => e.stopPropagation()); return r; }
    if (!mine) return r;
    const box = document.createElement('div'); box.className = 'dv341'; box.innerHTML = DEV341.body(tab); b.appendChild(box);
    DEV341.filter(b, tab);
    const inp = box.querySelector('.dvq'); if (inp) inp.addEventListener('input', () => { DEV341.q[tab] = inp.value; DEV341.filter(b, tab); });
    box.addEventListener('click', e => {
      const t = e.target.closest('[data-x]'); if (!t) return; e.stopPropagation();
      let res; try { res = DEV341.act(t.dataset.x, t.dataset.id, t.dataset.v, b); } catch (er) { console.error('dev341', er); UI.toast('执行失败：' + er.message); return; }
      if (res === 're') re2(tab);
      else if (res) DEV341.refresh(b, res);
    });
    return r;
  };
  setInterval(() => { try { DEV341.tick(); } catch (e) { } }, 500);
})();
// 必定突破：天劫期间 jieRes=1（雷劫照常演出，不掉血）
{ const _t = Game.tribulation; Game.tribulation = async function () { const G = this.G; if (!(G && G.cheat && G.cheat.brk)) return _t.apply(this, arguments); const j0 = G.jieRes; G.jieRes = 1; try { return await _t.apply(this, arguments); } finally { G.jieRes = j0; } }; }

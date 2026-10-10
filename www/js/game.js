'use strict';
// ======================= 游戏状态与人生循环 =======================
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.random() * a.length | 0];
const fmt = n => n >= 1e8 ? (n / 1e8).toFixed(1) + '亿' : n >= 1e4 ? (n / 1e4).toFixed(1) + '万' : String(Math.round(n));
let UID = Date.now() % 100000;
const Game = {
  G: null, meta: null,
  loadMeta() { try { this.meta = JSON.parse(localStorage.getItem('wbx2_meta')) || null; } catch (e) { } this.meta = Object.assign({ pts: 0, perks: {}, lives: 0, endings: {}, achs: {}, best: { realm: 0, age: 0 } }, this.meta || {}); },
  saveMeta() { try { localStorage.setItem('wbx2_meta', JSON.stringify(this.meta)); } catch (e) { } },
  save() { if (!this.G || this.G.dead) return; try { this.G.pos = R.player ? [R.player.i, R.player.j] : this.G.pos; localStorage.setItem('wbx2_save', JSON.stringify(this.G)); } catch (e) { } },
  hasSave() { try { const s = JSON.parse(localStorage.getItem('wbx2_save')); return s && !s.dead && s.v === 2 ? s : null; } catch (e) { return null; } },
  perk(id) { return this.meta.perks[id] || 0; },
  // -------- 创建角色 --------
  rollLinggen() {
    const g = this.perk('gen'); const ws = LINGGEN.map((l, k) => l.w * (k >= 3 ? 1 + g * 0.6 : 1));
    let r = Math.random() * ws.reduce((a, b) => a + b); for (let k = 0; k < ws.length; k++) { r -= ws[k]; if (r <= 0) return LINGGEN[k].id; } return 'wu';
  },
  rollTalents(n = 6) {
    const pool = TALENTS.slice(); const out = [];
    while (out.length < n && pool.length) { const w = pool.map(t => [8, 4, 2, 0.6][t.r]); let r = Math.random() * w.reduce((a, b) => a + b); let k = 0; for (; k < w.length; k++) { r -= w[k]; if (r <= 0) break; } out.push(pool.splice(Math.min(k, pool.length - 1), 1)[0].id); }
    return out;
  },
  newLife(cfg) {
    const G = {
      v: 2, uid: ++UID, name: cfg.name, sex: cfg.sex, age: 6, realm: 0, stage: 0, exp: 0, lg: cfg.lg, talents: cfg.talents, st: Object.assign({}, cfg.st),
      stone: 50 + cfg.st.wealth * 30 + this.perk('stone') * 200, debt: 8888, karma: 0, contrib: 0, sect: null, map: 'village', pos: null, ap: 0, year: 1,
      inv: { hcd: 2 }, eqs: [], eq: {}, techs: {}, tree: { sword: 0, magic: 0, body: 0, misc: 0 }, pts: 0, pets: [], petA: -1, aff: {}, partner: null, follower: null,
      quests: {}, qdone: {}, main: 0, flags: {}, kills: {}, killsTotal: 0, alchLv: 0, alchCount: 0, giftCount: 0, fishCount: 0, visited: { village: 1 }, bosses: {}, log: [],
      lifeBonus: this.perk('life') * 10, cultBonus: this.perk('exp') * 0.1, apBonus: this.perk('ap'), atkBonus: 0, defBonus: 0, hpBonus: 0, alchBonus: 0, catchBonus: 0, jieRes: 0, pillBonus: 0, brkBonus: 0, medBonus: 0, spdBonus: 0, critBonus: 0,
      used: {}, killedMap: {}, shop: null, dead: false, ending: null, surname: cfg.name.match(/^(欧阳|上官|司马|诸葛|.)/)[0],
    };
    this.G = G;
    for (const t of G.talents) { const T = TALENTS.find(x => x.id === t); T && T.f(G); }
    for (const k in G.st) G.st[k] = Math.max(0, G.st[k]);
    G.eqs.push(this.makeEq('weapon', 0, 0, '木剑')); this.equip(G.eqs[0].uid);
    const s = this.stats(); G.hp = s.mhp; G.mp = s.mmp; G.ap = this.apMax();
    this.log(`${G.name}出生于桃花村。灵根：${this.linggen().n}。`);
    this.meta.lives++; this.saveMeta();
  },
  linggen() { return LINGGEN.find(l => l.id === this.G.lg) || LINGGEN[1]; },
  lifeMax() { const G = this.G; return REALMS[G.realm].life + G.lifeBonus + G.st.con * 1 + (G.realm ? 0 : 0); },
  apMax() { const G = this.G; return 4 + G.apBonus + this.treeVal('ap') + (G.techs.moyu ? 1 : 0); },
  need() { const G = this.G; return Math.round(REALMS[G.realm].need * STAGE_MUL[G.stage]); },
  yearExp() { const G = this.G; return this.need() / REALMS[Math.min(7, G.realm)].T; },
  power() { const G = this.G; return G.realm + G.stage * 0.25; },
  realmName() { const G = this.G; return G.realm >= 7 ? '飞升' : REALMS[G.realm].n + (G.realm === 0 ? ['·锻体一层', '·锻体二层', '·锻体三层', '·锻体圆满'][G.stage] : STAGES[G.stage]); },
  playerSpr() { const G = this.G; const t = G.realm >= 5 ? 3 : G.realm >= 3 ? 2 : (G.realm >= 1 || G.sect) ? 1 : 0; return `player_${G.sex}${t}`; },
  log(t) { this.G.log.push(`${this.G.age}岁：${t}`); if (this.G.log.length > 300) this.G.log.shift(); },
  // -------- 属性 --------
  treeVal(key) { const G = this.G; let v = 0; for (const br of SKILL_TREE) for (let k = 0; k < (G.tree[br.id] || 0); k++) { const fx = br.nodes[k][2]; if (fx[key]) v += fx[key]; } return v; },
  techVal(key) { const G = this.G; let v = 0; for (const id in G.techs) { const T = TECHS[id]; if (T && T.pas[key]) v += T.pas[key] * (key === 'ap' || key === 'luck' ? 1 : G.techs[id]); } return v; },
  eqItems() { const G = this.G; return Object.values(G.eq).map(u => G.eqs.find(e => e.uid === u)).filter(Boolean); },
  eqFx(name) { return this.eqItems().some(e => e.slot === 'treasure' && e.base === name); },
  eqSum(key) { let v = 0; for (const e of this.eqItems()) { if (e.main[key]) v += e.main[key]; for (const [k, x] of e.aff) if (k === key) v += x; } return v; },
  stats() {
    const G = this.G; const P = POW(G.realm + G.stage * 0.25); const st = G.st;
    const pct = k => this.treeVal(k) + this.techVal(k) + this.eqSum(k + '%');
    const mhp = Math.round(((80 + st.con * 10) * P + this.eqSum('hp')) * (1 + G.hpBonus + pct('hp')));
    const mmp = Math.round(((40 + st.int * 6) * P + this.eqSum('mp')) * (1 + pct('mp')));
    const atk = ((14 + st.con * 0.8 + st.int * 0.8) * P + this.eqSum('atk')) * (1 + G.atkBonus + pct('atk'));
    const def = ((8 + st.con * 0.6) * P + this.eqSum('def')) * (1 + G.defBonus + pct('def'));
    const spd = (10 + st.luck * 0.4 + G.realm * 2 + this.eqSum('spd')) * (1 + G.spdBonus + (this.eqFx('招魂幡') ? 0.2 : 0));
    const crit = 0.05 + st.luck * 0.005 + G.critBonus + this.treeVal('crit') + this.eqSum('crit');
    return { mhp, mmp, atk, def, spd, crit, skillBonus: this.treeVal('skill') + (this.eqFx('翻天印') ? 0.2 : 0), metalBonus: this.treeVal('metal'), combo: this.treeVal('combo'), double: this.treeVal('double'), regen: this.treeVal('regen'), mpregen: this.treeVal('mpregen'), undying: this.treeVal('undying') };
  },
  skillList() { const G = this.G; const s = new Set(['atk']); for (const id in G.techs) for (const k of TECHS[id].sk) s.add(k); return [...s]; },
  // -------- 物品 --------
  has(id, n = 1) { return (this.G.inv[id] || 0) >= n; },
  give(id, n = 1) { const G = this.G; G.inv[id] = (G.inv[id] || 0) + n; if (G.inv[id] <= 0) delete G.inv[id]; },
  take(id, n = 1) { this.give(id, -n); },
  makeEq(slot, tier, rar, nm) {
    const bases = EQ_BASES[slot]; let b = bases[Math.min(bases.length - 1, slot === 'weapon' || slot === 'armor' ? Math.min(rar, bases.length - 1) : Math.random() * bases.length | 0)];
    if (slot === 'weapon' && Math.random() < 0.2) b = pick(bases);
    const R_ = RARITY[rar]; const P = POW(tier) * R_.m; const main = {};
    if (slot === 'weapon') main.atk = Math.round(7 * P); if (slot === 'armor') { main.def = Math.round(5 * P); main.hp = Math.round(25 * P); }
    if (slot === 'hat') { main.hp = Math.round(30 * P); main.def = Math.round(2 * P); } if (slot === 'boots') { main.spd = Math.round(2 + tier * 1.5 * R_.m); main.def = Math.round(2 * P); }
    if (slot === 'acc') { main.mp = Math.round(25 * P); main.crit = +(0.02 * R_.m).toFixed(3); } if (slot === 'treasure') { main.atk = Math.round(3 * P); main.def = Math.round(3 * P); }
    const aff = [];
    for (let k = 0; k < R_.aff; k++) { const A = pick(AFFIX); const v = A[0] === 'luck' ? 1 + (rar >> 1) : A[2] * (0.6 + Math.random() * 0.8) * (1 + rar * 0.25); aff.push([A[0] === 'luck' ? 'luck' : (['atk', 'def', 'hp', 'mp'].includes(A[0]) ? A[0] + '%' : A[0]), +v.toFixed(3)]); }
    return { uid: ++UID + '' + (Math.random() * 1e4 | 0), slot, base: b[0], ic: b[1], name: (nm || (R_.n === '凡品' ? '' : R_.n + '·') + b[0]), rar, tier: +tier.toFixed(1), main, aff };
  },
  randEq(tier, minR = 0, slot = null) {
    const luck = this.G.st.luck; let r = 0; const roll = Math.random() * 100 - luck * 0.8;
    r = roll < 2 ? 4 : roll < 9 ? 3 : roll < 25 ? 2 : roll < 55 ? 1 : 0; r = Math.max(r, minR);
    const e = this.makeEq(slot || pick(['weapon', 'armor', 'hat', 'boots', 'acc', 'treasure', 'weapon', 'armor']), tier, r);
    this.G.eqs.push(e); if (r === 4) this.ach('legend'); return e;
  },
  equip(uid) { const G = this.G; const e = G.eqs.find(x => x.uid === uid); if (!e) return; G.eq[e.slot] = uid; const s = this.stats(); G.hp = Math.min(G.hp || s.mhp, s.mhp); G.mp = Math.min(G.mp || s.mmp, s.mmp); },
  eqScore(e) { return (e.main.atk || 0) * 2 + (e.main.def || 0) * 2 + (e.main.hp || 0) * 0.3 + (e.main.mp || 0) * 0.2 + (e.main.spd || 0) * 3 + e.rar * 10 + e.aff.length * 5; },
  sellEq(uid) { const G = this.G; const e = G.eqs.find(x => x.uid === uid); if (!e || Object.values(G.eq).includes(uid)) return 0; const v = Math.round(10 * POW(e.tier) * RARITY[e.rar].m * (1 + e.rar)); G.eqs = G.eqs.filter(x => x !== e); G.stone += v; return v; },
  // -------- 修为 --------
  cultMult() { const G = this.G; return this.linggen().mult * (1 + G.cultBonus + this.eqSum('cult')); },
  addExp(n, raw = false) {
    const G = this.G; if (G.realm >= 7) return 0; n = Math.max(0, Math.round(raw ? n : n * this.cultMult())); G.exp += n;
    while (G.exp >= this.need() && G.stage < 3) { G.exp -= this.need(); G.stage++; G.pts++; this.levelFx(`${this.realmName()}！`); }
    if (G.stage === 3 && G.exp >= this.need()) G.exp = this.need();
    UI.hud(); return n;
  },
  canBreak() { const G = this.G; return G.stage === 3 && G.exp >= this.need() && G.realm < 7 && (G.realm > 0 || G.flags.awakened); },
  levelFx(t) {
    Sfx.play('levelup'); UI.toast(t, '#ffe680');
    if (R.player && R.mode === 'map') { const [x, y] = t2p(R.player.i, R.player.j); for (let k = 0; k < 40; k++) part({ x: x + rnd(-40, 40), y: y - rnd(0, 20), vx: 0, vy: -rnd(100, 300), r: rnd(3, 7), c: pick(['#fff2a0', '#ffd25e', '#fff']), life: rnd(0.8, 1.5), star: k % 3 === 0 }); }
    const s = this.stats(); this.G.hp = s.mhp; this.G.mp = s.mmp;
  },
  async tryBreak() {
    if (this._breaking || this._busy) return; this._breaking = true; this._busy = true;
    try { await this._tryBreak(); } finally { this._breaking = false; this._busy = false; }
  },
  async _tryBreak() {
    const G = this.G; if (!this.canBreak()) return;
    const r = G.realm;
    if (r === 6) return this.ascend();
    let ch = REALMS[r].brk + G.st.int * 0.015 + G.st.luck * 0.005 + G.brkBonus + this.treeVal('brk') + (G.tmpBrk || 0);
    const used = [];
    if (r === 1 && this.has('zjd')) { ch += 0.3; this.take('zjd'); used.push('筑基丹'); }
    if (r >= 1 && this.has('pjd') && ch < 0.95) { ch += 0.15; this.take('pjd'); used.push('破境丹'); }
    ch = Math.min(0.97, ch); G.tmpBrk = 0;
    const ok = await UI.card('冲击瓶颈', `你准备从【${this.realmName()}】冲击【${REALMS[r + 1].n}】。${used.length ? '\n已服用：' + used.join('、') : ''}\n成功率约 ${Math.round(ch * 100)}%${REALMS[r + 1].jie ? `\n⚡ 成功后需渡过 ${REALMS[r + 1].jie} 道天劫！` : ''}`, 'i:sk_meditate', ['冲！', '再等等']);
    if (ok !== 0) { if (used.length) used.forEach(n => this.give(n === '筑基丹' ? 'zjd' : 'pjd')); return; }
    if (Math.random() < ch) {
      if (REALMS[r + 1].jie) { const alive = await this.tribulation(REALMS[r + 1].jie, r); if (!alive) return; }
      G.realm++; G.stage = 0; G.exp = 0; G.pts += 2;
      this.log(`突破至${REALMS[G.realm].n}期。`); this.ach('r' + G.realm);
      this.levelFx(`突破成功！踏入${REALMS[G.realm].n}期`);
      if (R.player) { R.player.spr = this.playerSpr(); await loadSprite(R.player.spr); }
      await UI.card('突破成功', `恭喜！你踏入了【${REALMS[G.realm].n}期】。\n寿元上限提升至 ${this.lifeMax()} 岁，获得 2 点技能点。` + (G.realm === 1 ? '\n天道讨债司：已将您升级为“潜力客户”。' : ''), 'i:sk_light', ['好耶']);
    } else {
      G.exp = Math.round(G.exp * 0.7); G.hp = Math.max(1, Math.round(G.hp * 0.6));
      Sfx.play('fail'); await UI.card('突破失败', '真气逆行，你吐了一口老血。修为倒退了三成。\n（提升悟性、服用丹药可以提高成功率）', 'i:sk_poison', ['可恶']);
    }
    this.checkMain(); UI.hud(); this.save();
  },
  async tribulation(n, r, ascend = false) {
    const G = this.G; const s = this.stats(); let hp = G.hp = s.mhp;
    R.dark = 0.55; Audio2.bgm('boss'); UI.toast(`天劫降临！共 ${n} 道`, '#c8a0ff'); await wait(900);
    for (let k = 0; k < n; k++) {
      const P = R.player; const [x, y] = P ? w2s(...t2p(P.i, P.j)) : [R.W / 2, R.H / 2];
      makeBolt(x + rnd(-60, 60), 0, x, y - 40); R.flash = 0.6; R.shake = 0.8; Sfx.play('thunder');
      const dm = Math.round(s.mhp * (ascend ? 0.13 : 0.15) * (1 + k * 0.05) * (1 - G.jieRes) * rnd(0.75, 1.25) * (G.realm >= 5 ? 1.1 : 1));
      hp -= dm; floatText(x, y - 120, `第${k + 1}道 -${dm}`, '#e0c8ff', 36 * R.dpr, false); UI.hud(Math.max(0, hp));
      await wait(700);
      if (hp <= 0) {
        if (this.has('tsf')) { this.take('tsf'); hp = Math.round(s.mhp * 0.3); UI.toast('替死符化为灰烬，替你挡下一劫！', '#ffd23a'); await wait(600); continue; }
        if (this.treeVal('undying') && !G._undUsed) { G._undUsed = 1; hp = 1; UI.toast('不屈！', '#ffd23a'); continue; }
        R.dark = 0; G.hp = 0; await this.die('ash'); return false;
      }
    }
    R.dark = 0; G.hp = Math.max(1, hp); G._undUsed = 0; this.ach('jie'); Audio2.bgm(MAPINFO[R.mapId].bgm);
    UI.toast('渡劫成功！', '#ffe680'); return true;
  },
  async ascend() {
    const G = this.G;
    const c = await UI.card('飞升', `你已渡劫圆满，头顶的天空裂开一道金色门户。\n九九八十一……不，是12道飞升雷劫在等着你。${G.debt > 0 ? `\n（友情提示：你还欠天道 ${fmt(G.debt)} 灵石）` : ''}`, 'i:sk_light', ['渡劫飞升', '再修炼一会儿']);
    if (c !== 0) return;
    const alive = await this.tribulation(12, 6, true); if (!alive) return;
    G.realm = 7; this.levelFx('飞升成功！');
    await this.die(G.debt <= 0 ? 'paid' : 'ascend');
  },
  // -------- 战斗相关 --------
  activePet() { const G = this.G; return G.petA >= 0 ? G.pets[G.petA] : null; },
  petUnit(p) { const m = MONS[p.mon]; const t = p.tier + p.lv * 0.12; const P = POW(t) * (1 + this.treeVal('pet')); return { name: p.name, spr: m.spr, el: m.el, mhp: Math.round(80 * P * m.hp), mmp: Math.round(50 * P), atk: 15 * P * m.atk, def: 8 * P * m.def, spd: 10 * m.spd + t * 2, crit: 0.06, skills: PET_SKILL[p.mon] || ['atk'], hp: p.hp, tier: t }; },
  addPet(mon, tier) { const G = this.G; const p = { mon, name: MONS[mon].n.replace(/讨债|暴躁|铁钳/, '小'), lv: 1, exp: 0, tier: Math.max(0, tier - 0.3), hp: undefined }; G.pets.push(p); if (G.petA < 0) G.petA = G.pets.length - 1; this.ach('pet1'); if (G.pets.length >= 5) this.ach('pet5'); this.log(`收服灵兽${p.name}。`); return p; },
  petAfterBattle(u) { const p = this.activePet(); if (!p) return; p.hp = u.alive ? u.hp : 1; },
  petGain(n) { const p = this.activePet(); if (!p) return; p.exp += n; while (p.exp >= 40 * Math.pow(1.25, p.lv)) { p.exp -= 40 * Math.pow(1.25, p.lv); p.lv++; p.hp = undefined; UI.toast(`${p.name} 升到了 ${p.lv} 级！`, '#9aff9a'); } },
  compUnit() {
    const G = this.G; const id = G.follower; if (!id) return null; const N = NPCS[id]; const s = this.stats();
    const SK = { sister: ['swordqi', 'heal'], xiaoyi: ['swordqi', 'flysword'], cuihua: ['heal', 'vine'], ali: ['fireball', 'inferno'], aoxiao: ['water', 'thunder'], sumei: ['demonfire', 'poison'] };
    const k = G.partner === id ? 0.85 : 0.65;
    return { name: N.n.split('·').pop(), spr: N.spr, el: '无', mhp: Math.round(s.mhp * k), mmp: Math.round(s.mmp * k), atk: s.atk * k, def: s.def * k, spd: s.spd * 0.95, crit: 0.08, skills: ['atk', ...(SK[id] || [])] };
  },
  async fight(mon, opts = {}) {
    const G = this.G; const info = MAPINFO[R.mapId] || MAPINFO.village;
    const tier = opts.tier !== undefined ? opts.tier : info.tier + rnd(0, 0.4);
    const list = [monUnit(mon, tier, opts.elite)];
    if (!opts.solo && !MONS[mon].boss) { const extra = Math.random() < 0.35 + G.realm * 0.08 ? ri(1, Math.min(3, 1 + G.realm)) : 0; for (let k = 0; k < extra; k++) list.push(monUnit(pick(info.mons), tier + rnd(-0.2, 0.1))); }
    if (opts.adds) for (const a of opts.adds) list.push(monUnit(a, tier - 0.3));
    const r = await startBattle(list, opts);
    Audio2.bgm(info.bgm);
    if (r.res === 'win') {
      let exp = 0, stone = 0; const drops = {};
      for (const u of r.killed) {
        exp += this.yearExp() * 0.1 * Math.max(0.15, Math.min(2, 1 + (u.tier - this.power()) * 0.6)) * (u.boss ? 8 : u.elite ? 2.5 : 1); stone += 6 * POW(u.tier) * (u.boss ? 15 : u.elite ? 3 : 1) * rnd(0.7, 1.3);
        G.kills[u.mon] = (G.kills[u.mon] || 0) + 1; G.killsTotal++;
        const M = MONS[u.mon]; for (const d of M.drop) if (Math.random() < (u.boss ? 1 : 0.35)) drops[d] = (drops[d] || 0) + 1;
      }
      stone *= (1 + this.treeVal('gold') + (this.eqFx('天道算盘') ? 0.5 : 0));
      const eqd = []; const eqCh = r.killed.some(u => u.boss) ? 1 : r.killed.some(u => u.elite) ? 0.6 : 0.1 + G.st.luck * 0.005;
      if (Math.random() < eqCh) eqd.push(this.randEq(tier, r.killed.some(u => u.boss) ? 3 : r.killed.some(u => u.elite) ? 1 : 0));
      if (r.killed.some(u => u.boss)) eqd.push(this.randEq(tier, 2));
      const ge = this.addExp(exp, true); G.stone += Math.round(stone); for (const d in drops) this.give(d, drops[d]);
      this.petGain(exp * 0.5);
      this.ach('first_blood'); if (G.killsTotal >= 100) this.ach('kill100'); if (G.killsTotal >= 500) this.ach('kill500');
      Sfx.play('victory');
      await UI.card('战斗胜利', `修为 +${fmt(ge)}　灵石 +${fmt(stone)}` + (Object.keys(drops).length ? '\n获得：' + Object.entries(drops).map(([k, v]) => `${ITEMS[k].n}×${v}`).join('、') : '') + (eqd.length ? '\n装备：' + eqd.map(e => `【${e.name}】`).join('') : ''), 'i:chest', ['收下'], { eq: eqd });
      this.updateQuests();
    } else if (r.res === 'lose') {
      const lost = Math.round(G.stone * 0.2); G.stone -= lost; G.hp = Math.round(this.stats().mhp * 0.3); G.ap = Math.max(0, G.ap - 1);
      Sfx.play('defeat'); await UI.card('战斗失败', `你被打晕了，醒来时少了 ${lost} 灵石和一点行动力。\n（提升境界、换装备、带上灵兽和道侣再来）`, 'i:sk_poison', ['唉']);
    }
    UI.hud(); this.save(); return r;
  },
  // -------- 效果 DSL --------
  fill(t) { const G = this.G; return (t || '').replace(/\{name\}/g, G.name).replace(/\{surname\}/g, G.surname).replace(/\{age\}/g, G.age).replace(/\{debt\}/g, fmt(G.debt)).replace(/\{partner\}/g, G.partner ? NPCS[G.partner].n.split('·').pop() : '道侣').replace(/\{nick\}/g, pick(['欠债修士', '白嫖剑仙', '摸鱼真人', '赖账天尊', '铁公鸡', '桃花村一枝花'])); },
  cond(c) {
    const G = this.G; if (!c) return true;
    for (let tk of c.split(';')) {
      tk = tk.trim(); if (!tk) continue; let neg = false; if (tk[0] === '!') { neg = true; tk = tk.slice(1); }
      let ok;
      const m = tk.match(/^([a-z.]+)(:[a-z_]+)?(>=|<=|=|<|>)(-?[\w.]+)$/);
      if (tk === 'sect') ok = !!G.sect; else if (tk === 'partner') ok = !!G.partner; else if (tk === 'pet') ok = G.pets.length > 0;
      else if (tk.startsWith('flag:')) ok = !!G.flags[tk.slice(5)]; else if (tk.startsWith('tech:')) ok = !!G.techs[tk.slice(5)]; else if (tk.startsWith('item:')) ok = this.has(tk.slice(5));
      else if (m) {
        let v; const key = m[1], sub = m[2] && m[2].slice(1);
        if (key === 'aff') v = G.aff[sub] || 0; else if (key === 'lifeleft') v = this.lifeMax() - G.age; else if (key.startsWith('st.')) v = G.st[key.slice(3)]; else if (key in G.st) v = G.st[key]; else v = G[key];
        const rhs = isNaN(+m[4]) ? m[4] : +m[4];
        ok = m[3] === '>=' ? v >= rhs : m[3] === '<=' ? v <= rhs : m[3] === '<' ? v < rhs : m[3] === '>' ? v > rhs : v == rhs;
      } else ok = true;
      if (neg ? ok : !ok) return false;
    }
    return true;
  },
  async apply(eff) {
    const G = this.G; const out = []; const later = [];
    for (let tk of (eff || '').split(';')) {
      tk = tk.trim(); if (!tk) continue;
      let m;
      if ((m = tk.match(/^(exp|stone|hp|life|age|debt|karma|contrib|con|int|luck|cha|wealth|alch|brk)([+\-%])(-?[\d.]+)$/))) {
        const k = m[1]; let v = +m[3]; if (m[2] === '-') v = -v;
        if (m[2] === '%') {
          if (k === 'exp') { if (v < 0) { G.exp = Math.max(0, G.exp + this.yearExp() * v / 100); out.push(`修为-${fmt(-this.yearExp() * v / 100)}`); } else { const g = this.addExp(this.yearExp() * v / 100, true); out.push(`修为+${fmt(g)}`); } continue; }
          if (k === 'hp') { const s = this.stats(); G.hp = Math.max(1, Math.min(s.mhp, G.hp + s.mhp * v / 100)); out.push(`气血${v > 0 ? '+' : ''}${v}%`); continue; }
          if (k === 'stone') { const d = Math.round(G.stone * v / 100); G.stone += d; out.push(`灵石${d >= 0 ? '+' : ''}${d}`); continue; }
        }
        if (k === 'exp') { out.push(`修为+${this.addExp(v)}`); continue; }
        if (k === 'stone') { if (v < 0 && G.stone < -v) { v = -G.stone; } G.stone += v; out.push(`灵石${v >= 0 ? '+' : ''}${v}`); continue; }
        if (k === 'life') { G.lifeBonus += v; out.push(`寿元${v >= 0 ? '+' : ''}${v}`); continue; }
        if (k === 'age') { G.age += v; out.push(`年龄+${v}`); continue; }
        if (k === 'debt') { G.debt = Math.max(0, G.debt + v); out.push(`天道欠款${v >= 0 ? '+' : ''}${v}`); if (G.debt <= 0) this.ach('debt0'); continue; }
        if (k === 'karma') { G.karma += v; out.push(v > 0 ? `功德+${v}` : `业力+${-v}`); continue; }
        if (k === 'contrib') { if (G.sect) { G.contrib = Math.max(0, G.contrib + v); out.push(`宗门贡献${v >= 0 ? '+' : ''}${v}`); } continue; }
        if (k === 'alch') { G.alchLv += v; out.push(`炼丹等级+${v}`); continue; }
        if (k === 'brk') { G.tmpBrk = (G.tmpBrk || 0) + v; out.push(`下次突破+${v * 100}%`); continue; }
        G.st[k] = Math.max(0, G.st[k] + v); out.push(`${STATS.find(s => s[0] === k)[1]}${v >= 0 ? '+' : ''}${v}`); continue;
      }
      const p = tk.split(':');
      switch (p[0]) {
        case 'item': { const n = +(p[2] || 1); if (n < 0 && !this.has(p[1], -n)) { out.push(`（没有${ITEMS[p[1]].n}）`); break; } this.give(p[1], n); out.push(`${ITEMS[p[1]].n}${n > 0 ? '×' + n : n}`); break; }
        case 'aff': { const n = +p[2]; G.aff[p[1]] = Math.max(0, Math.min(150, (G.aff[p[1]] || 0) + n)); out.push(`${(NPCS[p[1]] || { n: '剑仙' }).n.split('·').pop()}好感${n >= 0 ? '+' : ''}${n}`); break; }
        case 'flag': G.flags[p[1]] = 1; break;
        case 'unflag': delete G.flags[p[1]]; break;
        case 'tech': { const id = p[1] === 'rand' ? pick(Object.keys(TECHS).filter(k => !G.techs[k] && !TECHS[k].sect && k !== 'laizhang')) : p[1]; if (id) { this.learn(id); out.push(`习得${TECHS[id].n}`); } else { out.push('修为提升'); this.addExp(this.yearExp() * 0.5, true); } break; }
        case 'pet': { const mon = p[1] === 'rand' ? pick(Object.keys(PET_SKILL)) : p[1]; const pt = this.addPet(mon, Math.max(0, G.realm - 0.5)); out.push(`获得灵兽【${pt.name}】`); break; }
        case 'eq': { const tier = Math.max(0, G.realm + G.stage * 0.25); const e = this.randEq(tier, +(p[2] || 0), p[1] === 'any' ? null : p[1]); out.push(`获得【${e.name}】`); break; }
        case 'fight': later.push(() => this.fight(p[1], { tier: Math.max(MAPINFO[R.mapId].tier, G.realm + G.stage * 0.2) })); break;
        case 'sect': this.joinSect(p[1]); out.push(`加入${SECTS[p[1]].n}`); break;
        case 'die': later.push(() => this.die(p[1])); break;
        case 'ending': later.push(() => this.die(p[1])); break;
        case 'debtpay': { const pay = Math.min(G.debt, Math.round(G.stone * 0.3) + 100); G.debt -= pay; out.push(`还款${pay}`); if (G.debt <= 0) this.ach('debt0'); break; }
        case 'debtint': { const d = Math.round(G.debt * 0.08); G.debt += d; out.push(`欠款+${d}`); break; }
        case 'petexp': this.petGain(80 * POW(G.realm)); out.push('灵兽经验提升'); break;
        case 'atkup': G.atkBonus += 0.02; out.push('攻击+2%'); break;
        case 'spd': G.spdBonus += 0.03; out.push('速度+3%'); break;
        case 'unpartner': if (G.partner) { out.push(`${NPCS[G.partner].n}离开了`); G.aff[G.partner] = 40; if (G.follower === G.partner) G.follower = null; G.partner = null; } break;
      }
    }
    UI.hud();
    return { txt: out.join('，'), later };
  },
  learn(id) { const G = this.G; if (!G.techs[id]) { G.techs[id] = 1; this.log(`习得${TECHS[id].n}。`); if (Object.keys(G.techs).length >= 5) this.ach('tech5'); } },
  joinSect(id) { const G = this.G; G.sect = id; G.contrib = 20; this.learn(SECTS[id].tech); G.karma += SECTS[id].karma * 3; this.ach('sect'); this.log(`拜入${SECTS[id].n}。`); if (R.player) { R.player.spr = this.playerSpr(); loadSprite(R.player.spr); } },
  // -------- 事件 --------
  async runEvent(ev) {
    const [id, title, text, , , por, ...opts] = ev; const G = this.G;
    const usable = opts.filter(o => (!/item:(\w+):-/.test(o[1]) || this.has(o[1].match(/item:(\w+):-/)[1])) && (!/(^|;)stone-(\d+)/.test(o[1]) || G.stone >= +o[1].match(/(^|;)stone-(\d+)/)[2] || /(^|;)(fight|die|ending):/.test(o[1])));
    const list = usable.length ? usable : opts;
    const k = await UI.card(title, this.fill(text), por === 'partner' ? (G.partner ? NPCS[G.partner].por : 'npc_girl') : por, list.map(o => this.fill(o[0])), { year: true });
    const o = list[k] || list[0];
    let ok = true;
    if (o[3]) { let p = 0.5; const [st, base] = String(o[3]).split(':'); if (base !== undefined) p = +base + (G.st[st] || 0) * 0.04; else p = +st; ok = Math.random() < Math.min(0.95, p); }
    const res = await this.apply(ok ? o[1] : o[4]);
    G.flags['ev_' + id] = (G.flags['ev_' + id] || 0) + 1;
    const txt = this.fill(ok ? o[2] : o[5]);
    if (txt || res.txt) await UI.card(title, (txt || '') + (res.txt ? `\n\n【${res.txt}】` : ''), por === 'partner' ? (G.partner ? NPCS[G.partner].por : 'npc_girl') : por, ['继续']);
    for (const f of res.later) { if (G.dead) break; await f(); }
    if (id === 'c_debtor' && G.main === 0) { G.main = 1; this.checkMain(); }
    if (id === 'c_mentor') { G.main = Math.max(G.main, 1); this.refreshNpcs(); }
  },
  pickEvent() {
    const G = this.G; const forced = EVENTS.filter(e => e[4] === 0 && this.cond(e[3]) && !(G.flags['ev_' + e[0]] > 0));
    if (forced.length) return forced[0];
    const pool = EVENTS.filter(e => e[4] > 0 && this.cond(e[3]) && (G.flags['ev_' + e[0]] || 0) < 2);
    const ws = pool.map(e => e[4] / (1 + (G.flags['ev_' + e[0]] || 0) * 3) * (e[3].includes('map=') ? 1.5 : 1));
    let r = Math.random() * ws.reduce((a, b) => a + b, 0); for (let k = 0; k < pool.length; k++) { r -= ws[k]; if (r <= 0) return pool[k]; }
    return pool[0];
  },
  // -------- 过年 --------
  async yearEnd() {
    const G = this.G; if (G.dead || this._busy) return; this._busy = true;
    try {
      const apLeft = G.ap; const s = this.stats();
      let g = 0;
      if (G.realm > 0 || G.realm === 0) g = this.addExp(this.yearExp() * 0.5 * (1 + apLeft * 0.15) * (G.realm === 0 && !G.flags.awakened ? 0.8 : 1));
      if (G.partner) g += this.addExp(this.yearExp() * 0.15);
      G.age++; G.year++;
      if (G.debt > 0) G.debt += Math.ceil(G.debt * 0.03);
      if (G.sect) G.contrib += 3;
      G.ap = this.apMax(); G.used = {}; G.killedMap = {}; G.shop = null; G.hp = Math.min(s.mhp, G.hp + s.mhp * 0.5); G.mp = s.mmp;
      for (const p of G.pets) p.hp = undefined;
      UI.yearFx(G.age, g);
      if (G.age > G.meta_bestAge) G.meta_bestAge = G.age;
      if (G.age >= 1000) this.ach('old');
      if (G.age > this.lifeMax()) { await this.die(G.realm === 0 ? 'mortal' : 'sit'); return; }
      const ev = this.pickEvent(); if (ev) await this.runEvent(ev);
      if (G.dead) return;
      if (G.flags.vip && Math.random() < 0.3) { const ev2 = this.pickEvent(); if (ev2) await this.runEvent(ev2); }
      if (G.stone >= 10000) this.ach('rich'); if (G.stone >= 200000) this.ach('richer');
      if (G.stone >= 1000000 && !G.flags.tycoonAsk) { G.flags.tycoonAsk = 1; const c = await UI.card('富甲三界', '你的灵石已经多到可以收购天道的全部债权了。要这么做吗？', 'i:bag', ['收购！（结局）', '低调']); if (c === 0) { await this.die('tycoon'); return; } }
      this.checkMain(); this.spawnMonsters(); this.refreshNpcs(); UI.hud(); this.save();
    } finally { this._busy = false; }
  },
  async seclude(years) {
    const G = this.G; if (G.dead || this._busy) return; this._busy = true; let y = 0, gain = 0;
    try {
      await UI.fade(true, 500);
      for (; y < years; y++) {
        if (this.canBreak()) break;
        gain += this.addExp(this.yearExp() * 1.0); G.age++; G.year++; if (G.debt > 0) G.debt += Math.ceil(G.debt * 0.03); if (G.sect) G.contrib += 2;
        if (G.age > this.lifeMax()) { await UI.fade(false, 300); await this.die(G.realm === 0 ? 'mortal' : 'sit'); return; }
      }
      const s = this.stats(); G.hp = s.mhp; G.mp = s.mmp; G.ap = this.apMax(); G.used = {}; G.killedMap = {}; G.shop = null;
      this.log(`闭关${y}年。`);
      await UI.fade(false, 500); UI.yearFx(G.age, gain);
      await UI.card('出关', `闭关 ${y} 年，修为 +${fmt(gain)}。${y < years ? '\n瓶颈已至，你提前出关。' : ''}${G.debt > 0 ? `\n天道欠款涨到了 ${fmt(G.debt)}……` : ''}`, 'i:sk_meditate', ['出关']);
      const ev = this.pickEvent(); if (ev) await this.runEvent(ev);
      this.checkMain(); this.spawnMonsters(); this.refreshNpcs(); UI.hud(); this.save();
    } finally { this._busy = false; }
  },
  async die(kind) {
    const G = this.G; if (G.dead) return; G.dead = true; G.ending = kind; this._busy = false;
    const E = ENDINGS[kind] || ENDINGS.sit; this.log(`结局：${E[0]}。`);
    if (G.age < 20) this.ach('young_die');
    const newEnd = !this.meta.endings[kind]; this.meta.endings[kind] = (this.meta.endings[kind] || 0) + 1;
    if (Object.keys(this.meta.endings).length >= 3) this.ach('end3');
    if (this.meta.lives >= 3) this.ach('lives3');
    const pts = G.realm * 15 + G.stage * 3 + Math.floor(G.age / 10) + Object.keys(G.bosses).length * 10 + (newEnd ? 20 : 0) + (G.achNew || 0) * 5;
    this.meta.pts += pts; this.meta.best.realm = Math.max(this.meta.best.realm, G.realm); this.meta.best.age = Math.max(this.meta.best.age, G.age); this.saveMeta();
    try { localStorage.removeItem('wbx2_save'); } catch (e) { }
    Audio2.bgm('title'); Sfx.play(kind === 'ascend' || kind === 'paid' || kind === 'newdao' ? 'victory' : 'gong');
    await UI.ending(kind, E, pts, newEnd);
  },
  ach(id) { const G = this.G; if (!ACHS[id] || this.meta.achs[id]) return; this.meta.achs[id] = Date.now(); if (G) G.achNew = (G.achNew || 0) + 1; this.saveMeta(); UI.toast(`🏆 成就解锁：${ACHS[id][0]}`, '#ffd23a'); Sfx.play('coin'); },
  // -------- 主线 --------
  checkMain() {
    const G = this.G; const m = MAIN[G.main];
    if (G.main === MI('sect') && G.realm >= 1 && G.sect) G.main = MI('rival');
    if (G.main === MI('sect') && G.realm >= 2) G.main = MI('rival');
    UI.hud();
  },
  // -------- 任务 --------
  questDone(q) {
    const G = this.G; const Q = QUESTS[q]; const n = Q.need;
    if (n.k) return Object.entries(n.k).every(([m, c]) => (G.kills[m] || 0) - (G.quests[q].k0[m] || 0) >= c);
    if (n.i) return Object.entries(n.i).every(([i, c]) => this.has(i, c));
    if (n.f) return !!G.flags[n.f];
    return false;
  },
  questProg(q) { const G = this.G; const Q = QUESTS[q]; const n = Q.need; if (n.k) return Object.entries(n.k).map(([m, c]) => `${MONS[m].n} ${Math.min(c, (G.kills[m] || 0) - (G.quests[q].k0[m] || 0))}/${c}`).join(' '); if (n.i) return Object.entries(n.i).map(([i, c]) => `${ITEMS[i].n} ${Math.min(c, G.inv[i] || 0)}/${c}`).join(' '); return G.flags[n.f] ? '已完成' : '未完成'; },
  acceptQuest(q) { this.G.quests[q] = { k0: Object.assign({}, this.G.kills) }; UI.toast('接受任务：' + QUESTS[q].n); this.refreshNpcs(); },
  async finishQuest(q) {
    const G = this.G; const Q = QUESTS[q]; if (Q.need.i) for (const [i, c] of Object.entries(Q.need.i)) this.take(i, c);
    const rw = Q.rw; const parts = [];
    if (rw.exp) parts.push('exp%' + Math.round(Math.min(300, 80 + rw.exp / 20)));
    if (rw.stone) parts.push('stone+' + rw.stone); if (rw.item) for (const [i, c] of Object.entries(rw.item)) parts.push(`item:${i}:${c}`); if (rw.aff) for (const [k, v] of Object.entries(rw.aff)) parts.push(`aff:${k}:${v}`); if (rw.eq) parts.push(`eq:any:${rw.eq}`); if (rw.life) parts.push(`life+${rw.life}`); if (rw.contrib) parts.push(`contrib+${rw.contrib}`);
    const r = await this.apply(parts.join(';')); delete G.quests[q]; G.qdone[q] = 1; Sfx.play('levelup');
    if (Object.keys(G.qdone).length >= 10) this.ach('quest10');
    await UI.card('任务完成', `【${Q.n}】完成！\n${r.txt}`, NPCS[Q.giver].por, ['好']); this.refreshNpcs(); this.save();
  },
  updateQuests() { this.refreshNpcs(); },
  // -------- 地图 --------
  canEnter(id) { const G = this.G; const I = MAPINFO[id]; if (id === 'village') return true; if (!G.flags.awakened) return false; return G.realm >= I.need; },
  async travel(id, free) {
    const G = this.G; if (G.map === id && R.mapId === id) return;
    if (!free) { if (G.ap <= 0) { UI.toast('今年的行动力用完了，先过年吧'); return; } G.ap--; }
    Sfx.play('whoosh'); await UI.fade(true);
    G.map = id; G.pos = null; await this.enterMap(id); await UI.fade(false);
    if (!G.visited[id]) { G.visited[id] = 1; if (Object.keys(G.visited).length >= 8) this.ach('allmaps'); G.flags['visit_' + id] = 1; UI.toast(`首次抵达：${MAPINFO[id].n}`); }
    this.save();
  },
  async enterMap(id) {
    const G = this.G; const info = MAPINFO[id];
    const sprs = new Set([this.playerSpr()]); for (const k in NPCS) if ((NPCS[k].roam ? NPCS[k].roam(G) : NPCS[k].map) === id) sprs.add(NPCS[k].spr); for (const m of info.mons) sprs.add(MONS[m].spr); if (info.boss) sprs.add(MONS[info.boss].spr); const p = this.activePet(); if (p) sprs.add(MONS[p.mon].spr);
    if (id === 'village') sprs.add('mon_collector');
    UI.loading(true); await loadMap(id, [...sprs]); UI.loading(false);
    R.mode = 'map'; R.mapId = id;
    const st = G.pos || [info.start[0] + 0.5, info.start[1] + 0.5]; const [wi, wj] = nearestWalk(st[0] - 0.5, st[1] - 0.5);
    R.player = addEnt({ kind: 'player', spr: this.playerSpr(), i: G.pos ? st[0] : wi + 0.5, j: G.pos ? st[1] : wj + 0.5, dir: 'N', speed: 3.4 });
    if (!walkable(Math.floor(R.player.i), Math.floor(R.player.j))) { R.player.i = wi + 0.5; R.player.j = wj + 0.5; }
    const [px, py] = t2p(R.player.i, R.player.j); R.cam.x = px; R.cam.y = py - 60;
    this.spawnPetEnt(); this.makeMarks(); this.refreshNpcs(); this.spawnMonsters();
    R.onTap = (x, y) => this.onTap(x, y);
    Audio2.bgm(info.bgm); UI.banner(info.n, info.d); UI.hud();
  },
  spawnPetEnt() {
    if (R.pet) removeEnt(R.pet); R.pet = null; const p = this.activePet(); if (!p) return;
    const P = R.player; R.pet = addEnt({ kind: 'pet', spr: MONS[p.mon].spr, i: P.i + 0.6, j: P.j + 0.6, s: 0.62, speed: 3.6, label: null, ai: (e, dt) => { const d = Math.hypot(e.i - P.i, e.j - P.j); if (d > 1.8 && (!e.path || !e.path.length)) moveTo(e, Math.floor(P.i), Math.floor(P.j)); if (d < 1.0 && e.path && e.path.length) e.path = []; } });
    loadSprite(R.pet.spr);
  },
  makeMarks() {
    const G = this.G; R.marks = [];
    const LBL = { noticeboard: ['告示栏', 'board'], mat: ['打坐', 'mat'], furnace: ['炼丹炉', 'alch'], bigfurnace: ['八卦炉', 'alch'], chest: ['宝箱', 'chest'], herb: ['采药', 'herb'], well: ['古井', 'well'], bell: ['敲钟', 'bell'], dummy: ['练剑', 'dummy'], portal: ['传送阵', 'portal'], boat: ['钓鱼', 'fish'], teahouse: ['茶馆', 'tea'], shop: ['商铺', 'shop'], shop2: ['当铺', 'pawn'], stall_r: ['小摊', 'shop'], altar: ['祭坛', 'altar'], tianmen: ['南天门', 'gate'], debtoffice: ['讨债司', 'debt'], stele: ['石碑', 'stele'], coffin: ['棺材', 'coffin'], pavilion: ['凉亭', 'rest'], fairypeach: ['摘桃', 'peach'], jade: ['玉台', 'jade'], incense: ['上香', 'incense'], well2: [] };
    const seen = {};
    for (const p of R.props) {
      const L = LBL[p.t]; if (!L || !L.length) continue; seen[p.t] = (seen[p.t] || 0) + 1;
      if (['fairypeach', 'mat', 'stall_r', 'dummy', 'furnace', 'jade', 'boat', 'coffin', 'pavilion'].includes(p.t) && seen[p.t] > 1) continue;
      let ti = p.i + Math.floor(p.fw / 2), tj = p.j + p.fh; if (NONBLOCK.has(p.t)) { ti = p.i; tj = p.j; }
      const [i, j] = nearestWalk(ti, tj);
      const key = `${R.mapId}_${p.t}_${p.i}_${p.j}`;
      const AFF = { herb: 1, chest: 1, peach: 1, bell: 1, well: 1, incense: 1, stele: 0, coffin: 1 };
      R.marks.push({ i, j, label: L[0], act: L[1], key, prop: p, h: Math.min(200, 60 + p.fh * 30 + (['hall', 'pagoda', 'tianmen', 'debtoffice', 'demonhall'].includes(p.t) ? 120 : 30)), hidden: AFF[L[1]] && G.used[key] });
    }
  },
  refreshNpcs() {
    if (!R.M || R.mode !== 'map' && R.mode !== 'battle') return; const G = this.G;
    R.ents = R.ents.filter(e => e.kind !== 'npc' && e.kind !== 'boss');
    for (const id in NPCS) {
      const N = NPCS[id]; if ((N.roam ? N.roam(G) : N.map) !== R.mapId) continue;
      if (N.minAge && G.age < N.minAge) continue; if (N.minRealm && G.realm < N.minRealm) continue;
      if (id === 'mentor' && !G.flags.main0) continue; // v2.3：打跑讨债史莱姆后剑仙就出现（以前要等到 10 岁）
      if (G.follower === id) continue;
      const [i, j] = nearestWalk(N.at[0], N.at[1]);
      const e = addEnt({ kind: 'npc', id, spr: N.spr, i: i + 0.5, j: j + 0.5, dir: 'S', label: N.n, s: N.spr.startsWith('mon_') ? 0.95 : 1, home: [i, j], ai: npcAI });
      e.mark = this.npcMark(id);
      loadSprite(N.spr);
    }
    const info = MAPINFO[R.mapId]; const mi = MAIN[G.main];
    if (info.boss && !G.bosses[info.boss] && mi && mi.boss === info.boss) {
      const pos = { graveyard: [10, 7], island: [11, 6], rift: [11, 6], heaven: [11, 8] }[R.mapId] || [10, 8];
      const [i, j] = nearestWalk(pos[0], pos[1]);
      addEnt({ kind: 'boss', id: info.boss, spr: MONS[info.boss].spr, i: i + 0.5, j: j + 0.5, dir: 'SE', label: MONS[info.boss].n, lc: '#ffb040', s: 0.62, mark: '!' });
    }
    // 跟随的伙伴
    if (G.follower && !R.ents.find(e => e.kind === 'comp')) { const N = NPCS[G.follower]; const P = R.player; if (P) { const e = addEnt({ kind: 'comp', spr: N.spr, i: P.i - 0.6, j: P.j + 0.6, s: 0.95, speed: 3.6, label: N.n.split('·').pop(), lc: '#ffc0e0', ai: (e, dt) => { const d = Math.hypot(e.i - P.i, e.j - P.j); if (d > 2.2 && (!e.path || !e.path.length)) moveTo(e, Math.floor(P.i), Math.floor(P.j) + 1); if (d < 1.2 && e.path && e.path.length) e.path = []; } }); loadSprite(N.spr); } }
  },
  npcMark(id) {
    const G = this.G;
    for (const q in G.quests) if (QUESTS[q].giver === id && this.questDone(q)) return '?';
    if (Talk.mainTalk(id, true)) return '!';
    for (const q in QUESTS) { const Q = QUESTS[q]; if (Q.giver === id && !G.quests[q] && !G.qdone[q] && this.questAvail(q)) return '!'; }
    return null;
  },
  questAvail(q) { const G = this.G; const Q = QUESTS[q]; if (Q.minAge && G.age < Q.minAge) return false; if (Q.pre && !G.qdone[Q.pre]) return false; if (Q.minRealm && G.realm < Q.minRealm) return false; if (Q.sect && !G.sect) return false; return true; },
  spawnMonsters() {
    if (!R.M || !R.player) return; const G = this.G; const info = MAPINFO[R.mapId];
    R.ents = R.ents.filter(e => e.kind !== 'mon');
    const n = Math.max(0, info.cnt - (G.killedMap[R.mapId] || 0));
    const P = R.player;
    for (let k = 0; k < n; k++) {
      let i, j, g = 0; do { i = ri(1, R.n - 2); j = ri(1, R.n - 2); g++; } while ((!walkable(i, j) || Math.hypot(i - P.i, j - P.j) < 5) && g < 200);
      const mon = pick(info.mons); const elite = Math.random() < 0.1; const tier = info.tier + rnd(0, 0.4);
      addEnt({ kind: 'mon', mon, tier, elite, spr: MONS[mon].spr, i: i + 0.5, j: j + 0.5, dir: pick(DIR8), s: elite ? 1.1 : 0.95, speed: 1.3, label: (elite ? '精英·' : '') + MONS[mon].n, lc: elite ? '#d8a0ff' : '#ffb0a0', home: [i, j], ai: monAI });
    }
  },
  // -------- 交互 --------
  onTap(x, y) {
    if (UI.modal || this._busy || R.mode !== 'map') return; const P = R.player; if (!P) return;
    const h = pickAt(x, y);
    if (h.ent) {
      const e = h.ent; R.tapMark = { i: Math.floor(e.i), j: Math.floor(e.j), t: 0 };
      const go = () => { if (Math.hypot(e.i - P.i, e.j - P.j) <= 1.6) { P.path = []; this.interactEnt(e); return true; } return false; };
      if (go()) return;
      moveTo(P, Math.floor(e.i), Math.floor(e.j) + 1, () => { if (!go()) { if (Math.hypot(e.i - P.i, e.j - P.j) <= 2.4) this.interactEnt(e); } });
      if (e.kind === 'mon') P.chase = e;
      return;
    }
    if (h.mark) { const m = h.mark; R.tapMark = { i: m.i, j: m.j, t: 0 }; if (Math.abs(P.i - (m.i + 0.5)) < 1.2 && Math.abs(P.j - (m.j + 0.5)) < 1.2) { this.interactMark(m); return; } moveTo(P, m.i, m.j, ok => { if (ok) this.interactMark(m); }); return; }
    const [ti, tj] = h.tile; R.tapMark = { i: ti, j: tj, t: 0 }; P.chase = null; moveTo(P, ti, tj);
  },
  async interactEnt(e) {
    if (UI.modal || this._busy) return; const P = R.player; P.path = []; P.dir = dirFrom(e.i - P.i, e.j - P.j);
    if (e.kind === 'npc') { e.dir = dirFrom(P.i - e.i, P.j - e.j); e.talking = 2; await Talk.npc(e.id); this.refreshNpcs(); }
    else if (e.kind === 'mon') await this.monBattle(e);
    else if (e.kind === 'boss') await Talk.boss(e.id);
  },
  async monBattle(e) {
    if (this._busy || UI.modal || e.gone) return; this._busy = true; e.gone = true;
    try {
      Sfx.play('whoosh'); await UI.flashIn();
      const r = await this.fight(e.mon, { tier: e.tier, elite: e.elite });
      if (r.res === 'win') { removeEnt(e); this.G.killedMap[R.mapId] = (this.G.killedMap[R.mapId] || 0) + 1; }
      else { e.gone = false; e.cool = 3; if (R.player) { const [i, j] = nearestWalk(MAPINFO[R.mapId].start[0], MAPINFO[R.mapId].start[1]); R.player.i = i + 0.5; R.player.j = j + 0.5; R.player.path = []; } }
      this.refreshNpcs();
    } finally { this._busy = false; }
  },
  async interactMark(m) {
    if (UI.modal || this._busy) return; const G = this.G; this._busy = true;
    try { await Acts[m.act](m); } finally { this._busy = false; }
    UI.hud(); this.save();
  },
  useAP(n = 1) { const G = this.G; if (G.ap < n) { UI.toast('行动力不足，点击“过年”进入下一年'); return false; } G.ap -= n; UI.hud(); return true; },
};
function npcAI(e, dt) {
  if (e.talking > 0) { e.talking -= dt; return; }
  e.wt = (e.wt || rnd(2, 6)) - dt;
  if (e.wt <= 0) { e.wt = rnd(3, 8); if (Math.random() < 0.5) { const [i, j] = e.home; const ti = i + ri(-2, 2), tj = j + ri(-2, 2); if (walkable(ti, tj)) { e.speed = 1.2; moveTo(e, ti, tj); } } else e.dir = pick(['S', 'SE', 'SW', 'E', 'W']); }
}
function monAI(e, dt) {
  if (e.gone) return; const P = R.player; if (!P) return;
  if (e.cool > 0) { e.cool -= dt; }
  const d = Math.hypot(e.i - P.i, e.j - P.j);
  if (d < 0.95 && !(e.cool > 0) && !UI.modal && !Game._busy && !(P.safeWalk && P.path && P.path.length)) { /* v2.3：去找 NPC 的路上不被闲逛怪截胡 */ P.path = []; Game.monBattle(e); return; }
  if (P.chase === e && d < 1.7 && !UI.modal && !Game._busy) { P.path = []; P.chase = null; Game.monBattle(e); return; }
  e.wt = (e.wt || rnd(1, 4)) - dt;
  if (e.wt <= 0) { e.wt = rnd(2, 5); const [i, j] = e.home; const ti = i + ri(-3, 3), tj = j + ri(-3, 3); if (walkable(ti, tj)) moveTo(e, ti, tj); }
}

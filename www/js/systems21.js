'use strict';
// ======================= v2.1 新系统：逆天改命 / 洞府 / 坐骑 / 时装 / 称号 / 求仙缘（抽卡） =======================
// 求仙缘只消耗游戏内获得的“仙缘符”，没有任何真实付费。
ITEMS.xyf = { n: '仙缘符', ic: 'tal_r', t: 'mat', p: 0, d: '求仙缘所需的符箓。完成任务、击败BOSS、解锁成就、每八年过年都会获得（机缘、重复抽到也会返还）。' };
// ---------------- 逆天改命 ----------------
const NITIAN = [
  { id: 'jianxin', n: '剑心通明', d: '攻击+15%', f: G => { G.atkBonus += 0.15; } },
  { id: 'jingang', n: '金刚不坏', d: '防御+20%，气血+10%', f: G => { G.defBonus += 0.2; G.hpBonus += 0.1; } },
  { id: 'lingtai', n: '灵台清明', d: '修炼速度+20%', f: G => { G.cultBonus += 0.2; } },
  { id: 'shouyuan', n: '寿与天齐', d: '寿元+60', f: G => { G.lifeBonus += 60; } },
  { id: 'tiandu', n: '天妒英才', d: '修炼速度+40%，寿元-30', f: G => { G.cultBonus += 0.4; G.lifeBonus -= 30; } },
  { id: 'leijie', n: '雷劫亲和', d: '天劫伤害-15%', f: G => { G.jieRes += 0.15; } },
  { id: 'danshou', n: '丹道圣手', d: '炼丹成功率+20%', f: G => { G.alchBonus += 0.2; } },
  { id: 'yushou', n: '万兽之王', d: '捕捉成功率+20%', f: G => { G.catchBonus += 0.2; } },
  { id: 'qingyan', n: '身轻如燕', d: '速度+15%', f: G => { G.spdBonus += 0.15; } },
  { id: 'hongyun', n: '鸿运当头', d: '气运+4', f: G => { G.st.luck += 4; } },
  { id: 'pojing', n: '破境如饮水', d: '突破成功率+10%', f: G => { G.brkBonus += 0.1; } },
  { id: 'zhaocai', n: '招财进宝', d: '每年额外获得灵石', f: G => { G.flags.nt_zhaocai = 1; } },
  { id: 'baoji', n: '一击必杀', d: '暴击率+8%', f: G => { G.critBonus += 0.08; } },
  { id: 'qinkuai', n: '勤能补拙', d: '每年行动力+1', f: G => { G.apBonus += 1; } },
  { id: 'daoxin', n: '道心坚定', d: '打坐收益+30%', f: G => { G.medBonus += 0.3; } },
  { id: 'laizhang', n: '赖账天赋', d: '天道欠款利息减半', f: G => { G.flags.nt_lowint = 1; } },
  { id: 'shuangxiu', n: '双修之道', d: '有道侣时修炼+25%', f: G => { G.flags.nt_shuangxiu = 1; } },
  { id: 'ningshen', n: '凝神聚气', d: '灵力上限+25%，暴击+3%', f: G => { G.flags.nt_mp = 1; G.critBonus += 0.03; } },
];
// ---------------- 坐骑 ----------------
const MOUNTS = {
  cloud: { n: '筋斗祥云', spr: 'mount_cloud', d: '移动速度+35%，速度+8%', mv: 1.35, spd: 0.08, rar: 3, lift: 26 },
  fsword: { n: '御剑', spr: 'mount_fsword', d: '移动速度+60%，攻击+5%', mv: 1.6, atk: 0.05, rar: 3, lift: 22 },
  gourd: { n: '酒葫芦', spr: 'mount_gourd', d: '移动速度+40%，气血+8%', mv: 1.4, hp: 0.08, rar: 2, lift: 30 },
  crane: { n: '仙鹤', spr: 'mount_crane', d: '移动速度+50%，速度+12%', mv: 1.5, spd: 0.12, rar: 4, lift: 30 },
  lotus: { n: '九品莲台', spr: 'mount_lotus', d: '移动速度+45%，修炼+8%', mv: 1.45, cult: 0.08, rar: 4, lift: 24 },
  bowl: { n: '孟婆汤碗', spr: 'mount_bowl', d: '移动速度+30%，寿元+10（搞笑坐骑）', mv: 1.3, life: 10, rar: 2, lift: 26 },
  carp: { n: '锦鲤', spr: 'mount_carp', d: '移动速度+45%，暴击+4%，每年20%概率横财', mv: 1.45, crit: 0.04, rar: 4, lift: 28 },
  abacus: { n: '飞天算盘', spr: 'mount_abacus', d: '移动速度+40%，每年灵石+5%（天道会计同款）', mv: 1.4, rar: 3, lift: 22 },
};
// ---------------- 时装（全账号永久解锁） ----------------
const COSTUMES = {
  xifu: { n: '大红喜服', rar: 3, d: '成亲穿的，平时穿也很喜庆' },
  xiake: { n: '江湖侠客', rar: 2, d: '斗笠、黑衣、酒葫芦，标准侠客三件套' },
  yuyi: { n: '仙鹤羽衣', rar: 4, d: '羽衣飘飘，仙气十足' },
  mowang: { n: '魔王战袍', rar: 3, d: '天魔殿限定款（外观）' },
  taohua: { n: '桃花仙裳', rar: 3, d: '桃花村村花同款' },
  longpao: { n: '龙袍金冠', rar: 4, d: '东海龙宫皇家定制' },
  longwang: { n: '龙宫太子服', rar: 4, d: '敖小白同款，自带龙角发箍' },
  guishi: { n: '鬼市夜行衣', rar: 3, d: '兜帽一戴，谁也不知道你欠了多少钱' },
  tianjia: { n: '天兵金甲', rar: 3, d: '天庭催债司制式铠甲（二手）' },
  caishen: { n: '财神袍', rar: 4, d: '穿上之后天道都不好意思催你' },
};
// ---------------- 称号 ----------------
const TITLES = [
  { id: 'debtor', n: '欠债修士', d: '人人都有的称号', ok: () => true, fx: {} },
  { id: 'xiaobi', n: '小比魁首', d: '击败龙傲天（攻击+3%）', ok: G => Game.meta.achs.rival_win, fx: { atk: 0.03 } },
  { id: 'qingli', n: '清理门户', d: '揭穿黑心长老（防御+4%）', ok: G => Game.meta.achs.traitor, fx: { def: 0.04 } },
  { id: 'baizhan', n: '百人斩', d: '累计击败100敌人（暴击+2%）', ok: G => Game.meta.achs.kill100, fx: { crit: 0.02 } },
  { id: 'shalu', n: '杀疯了', d: '累计击败500敌人（攻击+5%）', ok: G => Game.meta.achs.kill500, fx: { atk: 0.05 } },
  { id: 'longgong', n: '龙宫债主', d: '击败东海龙王（气血+5%）', ok: G => G.flags.boss_dragon, fx: { hp: 0.05 } },
  { id: 'panguan', n: '判官克星', d: '击败判官（修炼+5%）', ok: G => G.flags.judge_beaten, fx: { cult: 0.05 } },
  { id: 'shouwang', n: '动物园园长', d: '拥有5只灵兽（速度+5%）', ok: G => G.pets.length >= 5, fx: { spd: 0.05 } },
  { id: 'danzong', n: '丹道宗师', d: '炼丹等级≥5（修炼+3%）', ok: G => G.alchLv >= 5, fx: { cult: 0.03 } },
  { id: 'juanzhong', n: '神仙眷侣', d: '结为道侣（气血+5%）', ok: G => !!G.partner, fx: { hp: 0.05 } },
  { id: 'yihua', n: '桃花村一枝花', d: '魅力≥12（无加成，就是好看）', ok: G => G.st.cha >= 12, fx: {} },
  { id: 'tiandi', n: '天道债主', d: '击败讨尾款的天道（全属性+5%）', ok: G => G.flags.boss_tiandao, fx: { atk: 0.05, def: 0.05, hp: 0.05 } },
  { id: 'xianyuan', n: '天选之人', d: '求仙缘抽到神品（暴击+3%）', ok: G => Game.meta.gacha && Game.meta.gacha.ssr > 0, fx: { crit: 0.03 } },
  { id: 'qiangzhe', n: '轮回老手', d: '轮回5次以上（修炼+5%）', ok: G => Game.meta.lives >= 5, fx: { cult: 0.05 } },
];
// ---------------- 洞府 ----------------
const CAVE = {
  zl: { n: '聚灵阵', max: 5, d: l => `每年额外获得 ${l * 15}% 年修为`, cost: l => Math.round(300 * Math.pow(3, l)), ic: 'seal' },
  field: { n: '灵田', max: 5, d: l => `每年收获灵草×${l}${l >= 3 ? '、千年灵芝×' + (l - 2) : ''}${l >= 5 ? '、蟠桃×1' : ''}`, cost: l => Math.round(200 * Math.pow(2.6, l)), ic: 'herb' },
  forge: { n: '炼器炉', max: 4, d: l => l ? `可炼制${RARITY[Math.min(4, l)].n}以上装备` : '尚未建造', cost: l => Math.round(800 * Math.pow(3.2, l)), ic: 'furnace' },
};
// ---------------- 求仙缘卡池 ----------------
const GACHA = {
  rates: [['神品', 0.02, 4], ['仙品', 0.10, 3], ['宝品', 0.88, 2]],
  pity: 50, // v2.2：50 抽必出神品
  pool: {
    4: [['mount', 'crane'], ['mount', 'lotus'], ['mount', 'carp'], ['cos', 'yuyi'], ['cos', 'longpao'], ['cos', 'longwang'], ['cos', 'caishen'], ['eq', 4], ['eq', 4]],
    3: [['mount', 'cloud'], ['mount', 'fsword'], ['mount', 'abacus'], ['cos', 'guishi'], ['cos', 'tianjia'], ['cos', 'xifu'], ['cos', 'mowang'], ['cos', 'taohua'], ['eq', 3], ['eq', 3], ['pet', 'rand'], ['item', 'pjd', 2], ['item', 'xsd', 1]],
    2: [['mount', 'gourd'], ['mount', 'bowl'], ['cos', 'xiake'], ['eq', 2], ['item', 'pyd', 2], ['item', 'hcd', 5], ['item', 'hld', 5], ['item', 'egg', 1], ['item', 'tsf', 1], ['stone', 0], ['item', 'ysd', 1], ['item', 'lz', 3]],
  },
};
const Sys = {
  ensure(G) {
    if (!G) return;
    G.cave = G.cave || { zl: 0, field: 0, forge: 0 }; G.nt = G.nt || []; G.mounts = G.mounts || []; if (G.mount === undefined) G.mount = null;
    if (G.title === undefined) G.title = 'debtor'; if (G.costume === undefined) G.costume = null; G.evSeen = G.evSeen || 0;
    const M = Game.meta; M.cos = M.cos || {}; M.mounts = M.mounts || {}; M.gacha = M.gacha || { n: 0, pity: 0, ssr: 0, total: 0 };
  },
  title() { const G = Game.G; return TITLES.find(t => t.id === G.title) || TITLES[0]; },
  mount() { const G = Game.G; return G.mount && MOUNTS[G.mount] ? MOUNTS[G.mount] : null; },
  bonus(k) { const t = this.title().fx[k] || 0; const m = this.mount(); return t + (m && m[k] || 0); },
  addMount(id, quiet) { const G = Game.G; const M = Game.meta; if (!M.mounts[id]) { M.mounts[id] = 1; Game.saveMeta(); } if (!G.mounts.includes(id)) G.mounts.push(id); if (!G.mount) this.setMount(id); Game.ach('mount'); if (!quiet) UI.toast(`获得坐骑【${MOUNTS[id].n}】`, '#ffd23a'); },
  setMount(id) { const G = Game.G; G.mount = id; if (R.player) { R.player.mount = id ? MOUNTS[id].spr : null; if (id) loadSprite(MOUNTS[id].spr); R.player.speed = 3.4 * (id ? MOUNTS[id].mv : 1); } },
  addCostume(id) { const M = Game.meta; M.cos[id] = 1; Game.saveMeta(); UI.toast(`解锁时装【${COSTUMES[id].n}】（永久）`, '#ffd23a'); },
  setCostume(id) { Game.G.costume = id; if (R.player) { R.player.spr = Game.playerSpr(); loadSprite(R.player.spr); } UI.hud(); },
  titleCount() { const G = Game.G; return TITLES.filter(t => t.ok(G)).length; },
  async chooseNitian() {
    const G = Game.G; const pool = NITIAN.filter(x => !G.nt.includes(x.id)); if (!pool.length) return;
    const pick3 = []; while (pick3.length < 3 && pool.length) pick3.push(pool.splice(Math.random() * pool.length | 0, 1)[0]);
    VFX && VFX.flashText && VFX.flashText('逆天改命', '#ffd27a');
    const c = await UI.card('逆天改命', `突破大境界，天道规则出现一丝裂缝——你可以改写自己的命数（三选一，本世永久生效）：`, 'i:sk_light', pick3.map(x => `★ ${x.n}：${x.d}`), { cls: 'nitian' });
    const x = pick3[c] || pick3[0]; x.f(G); G.nt.push(x.id); Game.ach('ninxt'); Game.log(`逆天改命：${x.n}。`); Sfx.play('levelup'); UI.hud();
  },
  afterYear() {
    const G = Game.G; if (!G || G.dead) return; this.ensure(G);
    const C = G.cave; const msg = [];
    const mt = this.mount();
    if (mt && G.mount === 'abacus') { const add = Math.round(G.stone * 0.05); if (add > 0) { G.stone += add; msg.push('飞天算盘利息+' + add); } }
    if (mt && G.mount === 'carp' && Math.random() < 0.2) { G.stone += Math.round(100 * POW(Math.max(0.5, Game.power()))); msg.push('锦鲤带来一笔横财'); }
    if (C.zl) { const g = Game.addExp(Game.yearExp() * 0.15 * C.zl, true); msg.push(`聚灵阵修为+${fmt(g)}`); }
    if (C.field) { Game.give('herb', C.field); if (C.field >= 3) Game.give('lz', C.field - 2); if (C.field >= 5) Game.give('peach', 1); msg.push(`灵田收获灵草×${C.field}`); }
    if (G.flags.nt_zhaocai) { const s = Math.round(40 * POW(G.realm)); G.stone += s; msg.push(`招财进宝+${s}灵石`); }
    if (G.flags.nt_lowint && G.debt > 0) G.debt = Math.max(0, Math.round(G.debt * 0.985));
    if (G.year % 8 === 0) { Game.give('xyf', 1); msg.push('仙缘符+1'); }  // v2.2 平衡：每 8 年 1 张
    if (msg.length) UI.toast(msg.join('，'), '#bfffd0');
  },
  // ---- 抽卡 ----
  roll() {
    const M = Game.meta.gacha; M.pity++; M.total++;
    let tier = 2; const r = Math.random();
    if (M.pity >= GACHA.pity || r < GACHA.rates[0][1]) tier = 4; else if (r < GACHA.rates[0][1] + GACHA.rates[1][1]) tier = 3;
    if (tier === 4) { M.pity = 0; M.ssr++; }
    return tier;
  },
  grant(tier) {
    const G = Game.G; const [kind, a, b] = pick(GACHA.pool[tier]); const M = Game.meta;
    if (kind === 'mount') { const dup = G.mounts.includes(a); this.addMount(a, true); if (dup) { Game.give('xyf', tier - 1); return { tier, n: MOUNTS[a].n + '（重复→仙缘符×' + (tier - 1) + '）', ic: 'gourd_g', spr: MOUNTS[a].spr }; } return { tier, n: '坐骑·' + MOUNTS[a].n, spr: MOUNTS[a].spr, ic: 'gourd_g' }; }
    if (kind === 'cos') { const dup = M.cos[a]; if (dup) { Game.give('xyf', tier - 1); return { tier, n: COSTUMES[a].n + '（重复→仙缘符×' + (tier - 1) + '）', ic: 'robe_p' }; } M.cos[a] = 1; Game.saveMeta(); return { tier, n: '时装·' + COSTUMES[a].n, spr: `cos_${a}_${G.sex}`, ic: 'robe_p' }; }
    if (kind === 'eq') { const e = Game.randEq(Math.max(0.5, Game.power()), a); return { tier, n: e.name, ic: (EQ_ICON && EQ_ICON(e)) || 'sword_o' }; }
    if (kind === 'pet') { const mon = pick(Object.keys(PET_SKILL)); const p = Game.addPet(mon, Math.max(0.5, Game.power())); return { tier, n: '灵兽·' + p.name, spr: MONS[mon].spr }; }
    if (kind === 'item') { Game.give(a, b); return { tier, n: `${ITEMS[a].n}×${b}`, ic: ITEMS[a].ic }; }
    if (kind === 'stone') { const s = Math.round(150 * POW(Math.max(0.5, Game.power()))); G.stone += s; return { tier, n: `灵石×${s}`, ic: 'stone' }; }
  },
  async draw(n) {
    const G = Game.G; if (this._drawing) return; if (!Game.has('xyf', n)) { UI.toast('仙缘符不足'); return; }
    this._drawing = true; try { await this._draw(n); } finally { this._drawing = false; }
  },
  async _draw(n) {
    Game.take('xyf', n); const res = [];
    for (let k = 0; k < n; k++) res.push(this.roll());
    if (n >= 10 && !res.some(t => t >= 3)) res[res.length - 1] = 3; // 十连保底仙品
    const items = res.map(t => this.grant(t)); Game.meta.gacha.n += n; Game.saveMeta(); Game.save();
    await UI.gachaShow(items); UI.hud();
  },
};
const EQ_ICON = e => ({ weapon: ['sword_w', 'sword_g', 'sword_b', 'sword_p', 'sword_o'], armor: ['robe_w', 'robe_g', 'robe_b', 'robe_p', 'robe_o'] }[e.slot] || [])[e.rar] || null;
// ---------------- 挂接到游戏逻辑 ----------------
(function () {
  const _new = Game.newLife; Game.newLife = function (cfg) { _new.call(this, cfg); Sys.ensure(this.G); this.give('xyf', 3 + (this.meta.lives > 1 ? 2 : 0)); };
  const _ps = Game.playerSpr; Game.playerSpr = function () {
    const G = this.G; if (G.costume && Game.meta.cos && Game.meta.cos[G.costume] && AS.sprites[`cos_${G.costume}_${G.sex}`]) return `cos_${G.costume}_${G.sex}`;
    const t = G.realm >= 6 ? 5 : G.realm === 5 ? 3 : G.realm === 4 ? 4 : G.realm === 3 ? 2 : (G.realm >= 1 || G.sect) ? 1 : 0;
    if (t === 1 && G.sect === 'baicao' && AS.sprites[`player_${G.sex}1b`]) return `player_${G.sex}1b`;
    if (t === 1 && G.sect === 'tianmo' && AS.sprites[`player_${G.sex}1t`]) return `player_${G.sex}1t`;
    const id = `player_${G.sex}${t}`; return AS.sprites[id] ? id : _ps.call(this);
  };
  const _st = Game.stats; Game.stats = function () {
    const s = _st.call(this); const G = this.G; if (!G.cave) Sys.ensure(G);
    s.atk *= 1 + Sys.bonus('atk'); s.def *= 1 + Sys.bonus('def'); s.mhp = Math.round(s.mhp * (1 + Sys.bonus('hp'))); s.spd *= 1 + Sys.bonus('spd'); s.crit += Sys.bonus('crit');
    if (G.flags.nt_mp) s.mmp = Math.round(s.mmp * 1.25);
    return s;
  };
  const _cm = Game.cultMult; Game.cultMult = function () { const G = this.G; return _cm.call(this) * (1 + Sys.bonus('cult') + (G.flags.nt_shuangxiu && G.partner ? 0.25 : 0)); };
  const _lm = Game.lifeMax; Game.lifeMax = function () { const m = Sys.mount(); return _lm.call(this) + (m && m.life || 0); };
  const _tb = Game._tryBreak; Game._tryBreak = async function () {
    const G = this.G; const r0 = G.realm; await _tb.call(this);
    if (!G.dead && G.realm > r0) {
      if (VFX && VFX.breakthrough) await VFX.breakthrough(REALMS[Math.min(7, G.realm)].n);
      if (G.realm >= 2 && G.realm <= 6) await Sys.chooseNitian();
      if (G.realm === 2 && !G.mounts.includes('fsword')) { Sys.addMount('fsword'); await UI.card('御剑飞行', '筑基修士，可御剑而行！你获得了坐骑【御剑】。\n（在“更多→坐骑时装”中切换）', 'i:sword_b', ['好耶']); }
    }
  };
  const _ye = Game.yearEnd; Game.yearEnd = async function () { const y = this.G && this.G.year; await _ye.call(this); if (this.G && this.G.year !== y) Sys.afterYear(); };
  const _fq = Game.finishQuest; Game.finishQuest = async function (q) { await _fq.call(this, q); if (Math.random() < 0.35) { this.give('xyf', 1); UI.toast('仙缘符+1', '#ffd23a'); } };  // v2.2：35%
  const _ach = Game.ach; Game.ach = function (id) { const had = this.meta.achs[id]; _ach.call(this, id); if (!had && this.meta.achs[id] && this.G) { this.give('xyf', 1); } };
  const _re = Game.runEvent; Game.runEvent = async function (ev) { if (this.G) { this.G.evSeen = (this.G.evSeen || 0) + 1; this.meta.evTotal = (this.meta.evTotal || 0) + 1; if (this.meta.evTotal >= 200) this.ach('events200'); } return _re.call(this, ev); };
  const _die = Game.die; Game.die = async function (kind) {
    const G = this.G;
    if (G && !G.dead && G.flags.insured && (kind === 'sit' || kind === 'ash') && Math.random() < 0.5) kind = 'insured';
    if (G && !G.dead && kind === 'mortal' && G.age >= 60 && G.st.int >= 6 && Math.random() < 0.5) kind = 'storyteller';
    if (Object.keys(this.meta.endings).length + 1 >= 6) setTimeout(() => this.ach('endings6'), 0);
    return _die.call(this, kind);
  };
  const _em = Game.enterMap; Game.enterMap = async function (id) {
    const G = this.G; Sys.ensure(G);
    if (G.mount && MOUNTS[G.mount]) await loadSprite(MOUNTS[G.mount].spr);
    await _em.call(this, id);
    if (R.player) { R.player.mount = Sys.mount() ? Sys.mount().spr : null; R.player.speed = 3.4 * (Sys.mount() ? Sys.mount().mv : 1); R.player.title = Sys.title().id !== 'debtor' ? Sys.title().n : null; }
  };
  // 洞府入口：桃花村第一座房子 = 洞府，第一个草垛 = 灵田
  const _mm = Game.makeMarks; Game.makeMarks = function () {
    _mm.call(this);
    if (R.mapId === 'village') {
      const h = R.props.find(p => p.t === 'house2') || R.props.find(p => p.t === 'house');
      if (h) { const [i, j] = nearestWalk(h.i + Math.floor(h.fw / 2), h.j + h.fh); R.marks.push({ i, j, label: '洞府', act: 'cave', key: 'cave', prop: h, h: 150, c: '#9affd0' }); }
    }
  };
  Acts.cave = async () => { await UI.panel('cave'); };
  // 地图奇遇点：每张地图每年随机出现一个“机缘”光点
  const _sm = Game.spawnMonsters; Game.spawnMonsters = function () {
    _sm.call(this); const G = this.G; if (!R.M || R.mode !== 'map') return; const key = 'jy_' + R.mapId + '_' + G.year;
    R.marks = R.marks.filter(m => m.act !== 'jiyuan');
    if (!G.used[key] && Math.random() < 0.7) { for (let t = 0; t < 30; t++) { const i = ri(2, R.n - 3), j = ri(2, R.n - 3); if (walkable(i, j)) { R.marks.push({ i, j, label: '✦机缘', act: 'jiyuan', key, h: 70, c: '#ffd27a' }); break; } } }
  };
  Acts.jiyuan = async (m) => {
    const G = Game.G; G.used[m.key] = 1; R.marks = R.marks.filter(x => x !== m); Sfx.play('magic');
    if (VFX && VFX.burst) VFX.burst(...t2p(m.i + 0.5, m.j + 0.5), '#ffd27a');
    const r = Math.random();
    if (r < 0.1) { Game.give('xyf', 1); await UI.card('机缘', '一道金光没入你的袖中——是一张【仙缘符】！', 'i:tal_r', ['收下']); }
    else if (r < 0.5) { const g = Game.addExp(Game.yearExp() * 0.5, true); await UI.card('机缘', `你在此处感悟天地，修为+${fmt(g)}。`, 'i:sk_meditate', ['妙哉']); }
    else if (r < 0.7) { const e = Game.randEq(Math.max(0.5, Game.power()), ri(1, 3)); await UI.card('机缘', `你从土里刨出一件宝贝：【${e.name}】`, 'i:chest', ['收下']); }
    else { const ev = Game.pickEvent(); if (ev) await Game.runEvent(ev); else await UI.card('机缘', '什么都没有，只有一只路过的鸭子。', 'i:egg', ['……']); }
  };
})();

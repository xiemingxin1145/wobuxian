'use strict';
// ======================= 3.6 神器（docs/research_v36.md §2）=======================
// 惯例：只包裹/赋值接入，不动 game.js / talk.js / data.js；存档 G.sq36 惰性兜底（老档缺省 {own:{},eq:null,quest:null}），不升 G.v。
// 与法宝区别：法宝=本命、灵石线性升阶；神器=世界唯一、靠任务链寻得与觉醒，同时只能供奉 1 把（可收藏多把）。
// 基础属性（觉醒Ⅰ ×1 / Ⅱ ×1.5 / Ⅲ ×2，只在供奉中生效）：
//   轩辕残剑 攻+8%｜昆仑镜 闪避+5%｜神农鼎 炼丹成功+8%｜昊天塔 防+8%｜伏羲琴 修为+6%
// 法则（觉醒Ⅲ，供奉中）：
//   轩辕：本次攻击后敌血<15% → 直接击杀（BOSS 不适用，改为该击伤害 ×1.3）
//   昆仑：每场战斗首次致死伤害回溯（该击作废，回血 30% 气血上限）
//   神农：丹药效果 ×1.25（背包服用 + 回合制战斗内服用）
//   昊天：渡劫雷劫伤害 ×0.65
//   伏羲：突破成功率 +5 个百分点（固定值，觉醒Ⅰ起即生效，Ⅲ 不再增加；与 nitian 等叠加，本项封顶到 95%）——按验收 A2.2
// 觉醒：Ⅱ 碎晶×20 + 灵石 3000 + 元婴；Ⅲ 碎晶×60 + 灵石 12000 + 化神 + 神器心试（战斗，敌 tier = 当前地图 tier + 1，胜才扣费）。
// 碎晶 ITEMS.sqj：秘境 dungeon26 通关 1–3、世界BOSS 击杀 2、神器任务每环 5。
// 任务链：神器阁「追寻」或地图金色「？神器线索」点接链；同时只追 1 条（G.sq36.quest={id,step}）；每环到指定地图点线索。
// 轮回：神器不继承；Game.meta.sq36seen[id]=1 → 下一世该链缩短为 2 环（首图 + 末图）。
// 供奉切换无消耗，冷却 1 游戏日（= 时间推进一格：月级时间为 1 个月，年度制为 1 年；键 year*12+month）。
const SQ36 = {
  LIST: {
    sq_xuanyuan: { n: '轩辕残剑', ic: 'sword_o', stat: 'atk', v: 0.08, sd: '攻击', maps: ['graveyard', 'graveyard', 'graveyard', 'rift', 'rift'], law: '斩杀：攻击后敌血<15% 直接击杀（BOSS 改为该击伤害+30%）' },
    sq_kunlun: { n: '昆仑镜', ic: 'mirror', stat: 'dodge', v: 0.05, sd: '闪避', maps: ['heaven', 'heaven', 'heaven', 'heaven', 'heaven', 'heaven'], law: '回溯：每场首次致死伤害作废，回血 30%' },
    sq_shennong: { n: '神农鼎', ic: 'furnace', stat: 'alch', v: 0.08, sd: '炼丹成功', maps: ['village', 'village', 'yaowang', 'yaowang'], law: '药王：丹药效果 ×1.25' },
    sq_haotian: { n: '昊天塔', ic: 'pagoda', stat: 'def', v: 0.08, sd: '防御', maps: ['island', 'island', 'longgong', 'longgong', 'longgong'], law: '镇劫：渡劫雷劫伤害 −35%' },
    sq_fuxi: { n: '伏羲琴', ic: 'bell', stat: 'cult', v: 0.06, sd: '修为', maps: ['sect', 'sect', 'sect', 'sect'], law: '天音：突破成功率 +5 个百分点（固定，封顶 95%）' },
  },
  AW: [0, 1, 1.5, 2],
  AW_N: ['', 'Ⅰ', 'Ⅱ', 'Ⅲ'],
  AW_COST: { 2: { sj: 20, stone: 3000, realm: 4 }, 3: { sj: 60, stone: 12000, realm: 5 } },
  RING_SJ: 5, WB_SJ: 2, FUXI_BRK: 0.05, BRK_CAP: 0.95, KILL_HP: 0.15, BOSS_MUL: 1.3, KL_HEAL: 0.3, PILL_MUL: 1.25, JIE_MUL: 0.65, MIN_REALM: 2,
  LINES: {
    clue: '残剑嗡鸣，似在说：带我走，我也欠了天道钱。',
    clue2: '地上一点金光忽明忽暗，像在冲你眨眼：这里埋着一笔没人认领的旧账。',
    kunlun: '镜光一闪——刚才那下不算。',
    fuxi: '琴声一起，雷劫都放慢了节拍。',
  },
  // 每条链的环文案（按环序取，缩短链取首尾）
  STEPS: {
    sq_xuanyuan: ['乱葬岗的一座无名坟头插着半截锈剑，剑穗上缠着一张欠条。', '坟里的老鬼说：“那剑原本是轩辕家的，后来被拿去抵了酒钱。”', '你在乱葬岗深处挖出剑鞘——剑尖不在这里，指向魔道裂谷。', '魔道裂谷的岩缝里，剑尖嗡嗡作响，像在等你。', '剑身与剑尖合在一处，剑意冲天——轩辕残剑认主了。'],
    sq_kunlun: ['天外天的云海里漂着一片镜子碎片，映出昨天的你。', '第二片碎片在南天门的门缝里，守门天兵说：“这玩意儿不归我们管。”', '第三片碎片里，你看见自己还没欠债的样子。', '第四片碎片被讨债司当成了镇纸。你趁办事员打瞌睡把它换了回来。', '第五片碎片在云端唱歌：“照见过去，不照见利息。”', '六片碎片合成一面古镜——昆仑镜映出你的脸，然后叹了口气。'],
    sq_shennong: ['桃花村的灵田里长出一株会说话的草：“去找药农，他知道鼎在哪。”', '王大爷说：“我爷爷的爷爷在田埂下埋过一口鼎，说是神农老爷子落下的。”', '药王谷的药童翻出一页古方，方子最后一句写着：“鼎在谷底，自取。”', '谷底的鼎还温着——神农鼎认主了。'],
    sq_haotian: ['东海仙岛的礁石上刻着一座塔的图样，旁边写着“此塔已抵押给龙宫”。', '岛上的老渔民说：“那塔夜里会发光，鱼都不敢靠近。”', '东海龙宫的账房说：“昊天塔？抵押期早过了，但利息还没结清。”', '你替龙宫把一笔烂账对平了，账房把塔的钥匙给了你。', '龙宫后院的塔一层层亮起——昊天塔认主了。'],
    sq_fuxi: ['青云宗藏经阁最上层，一张没有弦的琴压着一摞欠条。', '守阁人说：“那琴弦被拿去抵学费了，在宗门的库房里。”', '你从库房的旧箱里翻出七根琴弦，每根上都系着一张借据。', '弦一上琴，琴声自鸣——伏羲琴认主了。'],
  },
  off: false, // 单测对照用：true 时神器全部不生效
  fighting: false,
  st(G) {
    G = G || (typeof Game !== 'undefined' && Game.G); if (!G) return null;
    if (!G.sq36 || typeof G.sq36 !== 'object') G.sq36 = { own: {}, eq: null, quest: null };
    const s = G.sq36; if (!s.own || typeof s.own !== 'object') s.own = {};
    if (s.eq && !(s.eq in this.LIST && s.own[s.eq])) s.eq = null; if (s.eq === undefined) s.eq = null;
    if (s.quest && !(s.quest.id in this.LIST && Number.isFinite(s.quest.step))) s.quest = null; if (s.quest === undefined) s.quest = null;
    return s;
  },
  meta() { const M = Game.meta || (Game.meta = {}); if (!M.sq36seen || typeof M.sq36seen !== 'object') M.sq36seen = {}; return M.sq36seen; },
  key(G) { G = G || Game.G; return (G.year || 0) * 12 + (G.month || 0); },
  sj(G) { G = G || Game.G; return (G && G.inv && G.inv.sqj) || 0; },
  // 供奉中的神器 {id, aw}；未供奉 / off → null
  eqd(G) { G = G || (typeof Game !== 'undefined' && Game.G); if (this.off || !G || !G.sq36 || !G.sq36.eq) return null; const o = G.sq36.own && G.sq36.own[G.sq36.eq]; if (!o || !this.LIST[G.sq36.eq]) return null; return { id: G.sq36.eq, aw: Math.max(1, Math.min(3, o.aw | 0 || 1)) }; },
  val(stat, G) { const e = this.eqd(G); if (!e) return 0; const L = this.LIST[e.id]; return L.stat === stat ? L.v * this.AW[e.aw] : 0; },
  law(id, G) { const e = this.eqd(G); return !!e && e.id === id && e.aw >= 3; },
  steps(id) { return this.meta()[id] ? 2 : this.LIST[id].maps.length; },
  stepMap(id, step) { const M = this.LIST[id].maps; return this.steps(id) === 2 ? (step <= 0 ? M[0] : M[M.length - 1]) : M[Math.min(step, M.length - 1)]; },
  stepText(id, step) { const T = this.STEPS[id]; return this.steps(id) === 2 ? (step <= 0 ? T[0] : T[T.length - 1]) : T[Math.min(step, T.length - 1)]; },
  mapNames(id) { const seen = []; for (const m of this.LIST[id].maps) if (!seen.includes(m)) seen.push(m); return seen.map(m => (MAPINFO[m] && MAPINFO[m].n) || m).join(' → '); },
  // 伏羲琴突破加成：+5 个百分点，但本项把总成功率（不含随后的丹药）封顶在 95%
  brkAdd(G, tree) {
    const e = this.eqd(G); if (!e || e.id !== 'sq_fuxi') return 0; const r = G.realm; if (!REALMS[r] || r >= 6) return 0;
    const others = REALMS[r].brk + (G.st.int || 0) * 0.015 + (G.st.luck || 0) * 0.005 + (G.brkBonus || 0) + (tree || 0) + (G.tmpBrk || 0);
    return Math.max(0, Math.min(this.FUXI_BRK, this.BRK_CAP - others));
  },
  // ---------- 任务链 ----------
  canSeek(G) { G = G || Game.G; return !!(G && G.flags && G.flags.awakened && G.realm >= this.MIN_REALM); },
  startQuest(id, G) { G = G || Game.G; const s = this.st(G); if (!this.LIST[id] || s.own[id] || !this.canSeek(G)) return false; s.quest = { id, step: 0 }; return true; },
  // 完成当前环（Acts.sq36 / 开发者面板共用）；返回 {done, got}
  advance(G) {
    G = G || Game.G; const s = this.st(G); const q = s.quest; if (!q) return null;
    q.step++; Game.give('sqj', this.RING_SJ); const N = this.steps(q.id);
    if (q.step >= N) { s.own[q.id] = { aw: 1, q: q.step }; s.quest = null; this.meta()[q.id] = 1; try { Game.saveMeta(); } catch (e) { } return { done: true, id: q.id, step: q.step, n: N }; }
    return { done: false, id: q.id, step: q.step, n: N };
  },
  // ---------- 供奉 ----------
  canSwitch(G) { G = G || Game.G; const s = this.st(G); return s.cd === undefined || s.cd === null || s.cd !== this.key(G); },
  enshrine(id, G) {
    G = G || Game.G; const s = this.st(G); if (id && !s.own[id]) return '尚未寻得';
    if ((s.eq || null) === (id || null)) return '';
    if (!this.canSwitch(G)) return '神器刚换过，灵性未定（冷却 1 游戏日：过月/过年后再换）';
    s.eq = id || null; s.cd = this.key(G); return '';
  },
  // ---------- 觉醒 ----------
  awCheck(id, G) {
    G = G || Game.G; const s = this.st(G); const o = s.own[id]; if (!o) return '尚未寻得'; const to = (o.aw | 0) + 1; if (to > 3) return '已觉醒Ⅲ';
    const c = this.AW_COST[to]; if (G.realm < c.realm) return `需${REALMS[c.realm].n}期`; if (this.sj(G) < c.sj) return `碎晶不够（${this.sj(G)}/${c.sj}）`; if (G.stone < c.stone) return `灵石不够（需 ${c.stone}）`; return '';
  },
  awApply(id, G) { G = G || Game.G; const o = this.st(G).own[id]; const to = (o.aw | 0) + 1; const c = this.AW_COST[to]; G.stone -= c.stone; Game.take('sqj', c.sj); o.aw = to; return to; },
  trialTier() { const I = (typeof R !== 'undefined' && MAPINFO[R.mapId]) || MAPINFO.village; return I.tier + 1; },
  async awaken(id) {
    const G = Game.G; const why = this.awCheck(id, G); if (why) { UI.toast(why); return false; }
    const L = this.LIST[id]; const o = this.st(G).own[id]; const to = (o.aw | 0) + 1; const c = this.AW_COST[to];
    const k = await UI.card(`觉醒${this.AW_N[to]}·${L.n}`, `消耗：神器碎晶 ×${c.sj}、灵石 ${c.stone}。\n觉醒后基础${L.sd} +${Math.round(L.v * this.AW[to] * 100)}%。${to === 3 ? `\n解锁法则「${L.law}」。\n\n需先通过【神器心试】：与器中心魔一战（敌强度 = 当前地图 +1 档）。败了不扣任何东西，可再试。` : ''}`, 'i:' + L.ic, [to === 3 ? '入心试' : '觉醒', '算了']);
    if (k !== 0 || this.awCheck(id, G)) return false;
    if (to === 3) {
      const I = MAPINFO[R.mapId] || MAPINFO.village; const mon = pick(I.mons || ['slime']);
      this.fighting = true; let r; try { r = await Game.fight(mon, { tier: this.trialTier(), solo: true, noflee: true, sq36: 1 }); } finally { this.fighting = false; }
      if (!r || r.res !== 'win') { await UI.card('心试未过', '器中心魔冷笑一声，散作烟雾。\n（未扣碎晶和灵石，养好伤再来）', 'i:' + L.ic, ['可恶']); Game.save(); return false; }
      if (this.awCheck(id, G)) { UI.toast(this.awCheck(id, G)); return false; }
    }
    this.awApply(id, G); Sfx.play && Sfx.play('levelup');
    await UI.card('神器觉醒', `【${L.n}】觉醒${this.AW_N[to]}！\n基础${L.sd} +${Math.round(L.v * this.AW[to] * 100)}%${to === 3 ? `\n法则「${L.law}」已解锁` : ''}`, 'i:' + L.ic, ['好']);
    UI.hud && UI.hud(); Game.save(); return to;
  },
  // ---------- 地图线索点 ----------
  markWant(G) {
    G = G || Game.G; if (!G || typeof R === 'undefined' || !R.mapId) return null; const s = this.st(G);
    if (s.quest) return this.stepMap(s.quest.id, s.quest.step) === R.mapId ? s.quest.id : null;
    if (!this.canSeek(G)) return null;
    for (const id in this.LIST) if (!s.own[id] && this.stepMap(id, 0) === R.mapId) return id; // 未接链：首图的发现点
    return null;
  },
  mark() {
    if (typeof R === 'undefined' || !R.marks || R.mode !== 'map' || !R.mapId) return; R.marks = R.marks.filter(m => m.act !== 'sq36');
    const G = Game.G; const id = this.markWant(G); if (!id) return;
    const info = MAPINFO[R.mapId]; const st = info.start || [10, 18]; const ci = Math.floor(st[0]), cj = Math.floor(st[1]);
    const others = [...R.ents.filter(e => e.kind === 'npc' || e.kind === 'boss').map(e => [e.i, e.j]), ...R.marks.map(m => [m.i + 0.5, m.j + 0.5])];
    let best = null, bs = -1;
    for (let di = -7; di <= 7; di++) for (let dj = -7; dj <= 7; dj++) { const d = Math.hypot(di, dj); if (d < 3 || d > 7) continue; const a = ci + di, b = cj + dj; if (!walkable(a, b)) continue; const sc = Math.min(4, ...others.map(([x, y]) => Math.hypot(x - a - 0.5, y - b - 0.5))) - d * 0.05; if (sc > bs) { bs = sc; best = [a, b]; } }
    const [i, j] = best || nearestWalk(ci + 2, cj - 3);
    R.marks.push({ i, j, label: '？神器线索', act: 'sq36', key: 'sq36_' + id, sq: id, h: 120, c: '#ffd23a' });
  },
  async onClue() {
    const G = Game.G; const s = this.st(G); const id = this.markWant(G); if (!id) { this.mark(); return; }
    const L = this.LIST[id];
    if (!s.quest) {
      const k = await UI.card('神器线索', `${id === 'sq_xuanyuan' ? this.LINES.clue : this.LINES.clue2}\n\n地上的金光指向一件世界唯一的神器——【${L.n}】。\n线索：${this.mapNames(id)}（共 ${this.steps(id)} 环）`, 'i:' + L.ic, ['追寻', '不理会']);
      if (k !== 0) return; this.startQuest(id, G);
    }
    const q = s.quest; const txt = this.stepText(q.id, q.step); const r = this.advance(G);
    if (r.done) { Sfx.play && Sfx.play('levelup'); await UI.card('神器认主', `${txt}\n\n获得神器【${L.n}】（觉醒Ⅰ）、神器碎晶 ×${this.RING_SJ}。\n去洞府「神器阁」供奉它。`, 'i:' + L.ic, ['收下']); }
    else { Sfx.play && Sfx.play('pickup'); await UI.card(`神器线索 ${r.step}/${r.n}`, `${txt}\n\n神器碎晶 +${this.RING_SJ}\n下一处线索：${(MAPINFO[this.stepMap(q.id, q.step)] || {}).n || ''}`, 'i:' + L.ic, ['继续追寻']); }
    this.mark(); Game.save();
  },
  // ---------- 神器阁 UI ----------
  html(G) {
    G = G || Game.G; const s = this.st(G); const e = this.eqd(G);
    const head = `<div class="sq36head"><span>神器碎晶 <b>${this.sj(G)}</b></span><span>供奉：<b>${e ? this.LIST[e.id].n + '·' + this.AW_N[e.aw] : '无'}</b></span>${this.canSwitch(G) ? '' : '<span class="cd">更换冷却中</span>'}</div>`;
    const rows = Object.entries(this.LIST).map(([id, L]) => {
      const o = s.own[id]; const q = s.quest && s.quest.id === id ? s.quest : null;
      if (!o) {
        const btn = q ? `<button class="sm sqb" data-sq="drop" data-v="${id}">放弃</button>` : this.canSeek(G) ? `<button class="sm sqb" data-sq="seek" data-v="${id}">追寻</button>` : '<span class="tag">筑基解锁</span>';
        return `<div class="sq36it dim" data-id="${id}"><i class="sil" style="${iconCss(L.ic, 48)}"></i><div class="tx"><b>？？？</b><small>线索：${esc(this.mapNames(id))}（${this.steps(id)} 环）</small>${q ? `<small class="on">追寻中 ${q.step}/${this.steps(id)}·下一处：${esc((MAPINFO[this.stepMap(id, q.step)] || {}).n || '')}</small>` : ''}</div>${btn}</div>`;
      }
      const aw = Math.max(1, o.aw | 0); const on = s.eq === id; const nx = aw < 3 ? this.AW_COST[aw + 1] : null;
      return `<div class="sq36it${on ? ' eq' : ''}" data-id="${id}"><i style="${iconCss(L.ic, 48)}"></i><div class="tx"><b>${L.n} · 觉醒${this.AW_N[aw]}</b><small>${L.sd} +${Math.round(L.v * this.AW[aw] * 100)}%${on ? '（供奉中）' : ''}</small><small class="${aw >= 3 || id === 'sq_fuxi' ? 'on' : 'lk'}">法则：${L.law}${aw >= 3 || id === 'sq_fuxi' ? '' : '（觉醒Ⅲ）'}</small>${nx ? `<small>觉醒${this.AW_N[aw + 1]}：碎晶×${nx.sj}·${nx.stone}灵石·${REALMS[nx.realm].n}${aw + 1 === 3 ? '·心试' : ''}</small>` : ''}</div><div class="bs"><button class="sm sqb" data-sq="${on ? 'off' : 'eq'}" data-v="${id}">${on ? '撤下' : '供奉'}</button>${nx ? `<button class="sm sqb" data-sq="aw" data-v="${id}">觉醒</button>` : ''}</div></div>`;
    }).join('');
    return head + `<p class="hint">神器世界唯一，靠任务链寻得；同时只能供奉 1 把，更换无消耗、冷却 1 游戏日。轮回不继承，但下一世线索只剩 2 环。</p>` + rows;
  },
  async onBtn(a, id) {
    const G = Game.G; const s = this.st(G);
    if (a === 'seek') {
      if (s.quest && s.quest.id !== id) { const k = await UI.card('改追线索', `正在追寻【？？？】的第 ${s.quest.step} 环线索。改追后原线索进度清零（已得碎晶保留）。`, 'i:scroll', ['改追', '算了']); if (k !== 0) return; }
      if (this.startQuest(id, G)) UI.toast(`开始追寻：线索在 ${(MAPINFO[this.stepMap(id, 0)] || {}).n}`, '#ffd23a'); this.mark();
    } else if (a === 'drop') { s.quest = null; this.mark(); UI.toast('已放弃这条线索'); }
    else if (a === 'eq' || a === 'off') { const why = this.enshrine(a === 'eq' ? id : null, G); if (why) UI.toast(why); else { Sfx.play && Sfx.play('pickup'); UI.toast(a === 'eq' ? `供奉【${this.LIST[id].n}】` : '已撤下神器', '#ffd23a'); } }
    else if (a === 'aw') await this.awaken(id);
    UI.hud && UI.hud(); Game.save();
  },
  entHtml(G) { G = G || Game.G; const s = this.st(G); const n = Object.keys(s.own).filter(k => this.LIST[k]).length; return `<button class="opt sq36open" data-sq="open">神器阁 <small>已寻得 ${n}/5${s.quest ? ' · 追寻中' : ''}</small></button>`; },
};
window.SQ36 = SQ36;
(function () {
  ITEMS.sqj = { n: '神器碎晶', ic: 'jade', t: 'mat', p: 0, d: '神器觉醒材料。秘境通关、世界BOSS、神器线索可得（洞府 → 神器阁）。' };
  UI.titles.sq36 = '神器阁';
  Acts.sq36 = async () => SQ36.onClue();
  // 属性：攻 / 防
  const _st = Game.stats; Game.stats = function () { const s = _st.apply(this, arguments); if (!this.G || SQ36.off) return s; const a = SQ36.val('atk'), d = SQ36.val('def'); if (a) s.atk *= 1 + a; if (d) s.def *= 1 + d; return s; };
  // 修为
  const _cm = Game.cultMult; Game.cultMult = function () { const m = _cm.apply(this, arguments); const c = this.G ? SQ36.val('cult') : 0; return c ? m * (1 + c) : m; };
  // 炼丹成功 / 突破（treeVal 是 game.js 里两处公式的公共项）
  const _tv = Game.treeVal; Game.treeVal = function (k) { const v = _tv.apply(this, arguments); if (!this.G || SQ36.off) return v; if (k === 'alch') return v + SQ36.val('alch'); if (k === 'brk') return v + SQ36.brkAdd(this.G, v); return v; };
  // 伤害：轩辕斩杀 / 昆仑闪避 + 回溯（回合制；即时战玩家受伤走 RT27._damagePlayer）
  if (typeof calcDmg === 'function') {
    const _cd = calcDmg;
    calcDmg = function (a, d, sk) {
      const r = _cd.apply(this, arguments); const G = Game.G; if (!G || SQ36.off || !G.sq36 || !G.sq36.eq) return r;
      if (a && a.isPlayer && d && !d.isPlayer && d.side !== 0 && SQ36.law('sq_xuanyuan') && d.mhp > 0 && d.hp > 0 && d.hp - r.dm < d.mhp * SQ36.KILL_HP) {
        if (d.boss) { r.dm = Math.max(1, Math.round(r.dm * SQ36.BOSS_MUL)); r.tag = '斩杀·伤害+30%'; } else { r.dm = Math.max(r.dm, Math.ceil(d.hp)); r.tag = '斩杀'; }
      }
      const rt = typeof RT27 !== 'undefined' && RT27.on && d === RT27.player;
      if (d && d.isPlayer && !rt && SQ36.eqd() && SQ36.eqd().id === 'sq_kunlun') {
        if (Math.random() < SQ36.val('dodge')) { r.dm = 0; r.crit = false; r.tag = '闪避'; }
        else if (SQ36.law('sq_kunlun') && !d._sq36kl && d.hp - r.dm <= 0) { d._sq36kl = 1; r.dm = 0; r.crit = false; d.hp = Math.min(d.mhp, d.hp + Math.round(d.mhp * SQ36.KL_HEAL)); r.tag = '镜光回溯'; try { UI.toast(SQ36.LINES.kunlun, '#9affff'); } catch (e) { } }
      }
      return r;
    };
  }
  if (typeof RT27 !== 'undefined' && RT27._damagePlayer) {
    const _dp = RT27._damagePlayer;
    RT27._damagePlayer = function (dm) {
      const p = this.player; const e = SQ36.eqd();
      if (p && e && e.id === 'sq_kunlun' && !(p.invuln > 0)) {
        const fl = t => { try { const [sx, sy] = this._w2s(p.x, p.y - 70); floatText(sx, sy, t, '#9affff', 26 * R.dpr, false); } catch (er) { } };
        if (Math.random() < SQ36.val('dodge')) { fl('闪避!'); return; }
        const cut = p.buf && p.buf.def > 0 ? 0.5 : 1;
        if (e.aw >= 3 && !p._sq36kl && p.hp - Math.max(1, Math.round(dm * cut)) <= 0) { p._sq36kl = 1; p.hp = Math.min(p.mhp, p.hp + Math.round(p.mhp * SQ36.KL_HEAL)); fl('镜光回溯'); try { UI.toast(SQ36.LINES.kunlun, '#9affff'); } catch (er) { } return; }
      }
      return _dp.apply(this, arguments);
    };
  }
  // 神农鼎：丹药效果 ×1.25（useItem / doAction 的 mul 都在第一个 await 之前同步算好 → 只在同步段临时放大 pillBonus）
  const withPill = (fn, self, args) => { const G = Game.G; if (!G || !SQ36.law('sq_shennong')) return fn.apply(self, args); const pb = G.pillBonus || 0; G.pillBonus = (1 + pb) * SQ36.PILL_MUL - 1; try { return fn.apply(self, args); } finally { G.pillBonus = pb; } };
  const _ui = UI.useItem; UI.useItem = function () { return withPill(_ui, this, arguments); };
  if (typeof doAction === 'function') { const _da = doAction; doAction = function (a) { return a && a.sk === 'item' ? withPill(_da, this, arguments) : _da.apply(this, arguments); }; }
  // 昊天塔：雷劫伤害 ×0.65（tribulation 内 dm ∝ (1 − jieRes)）
  const _tr = Game.tribulation; Game.tribulation = async function () {
    const G = this.G; if (!G || !SQ36.law('sq_haotian')) return _tr.apply(this, arguments);
    const j0 = G.jieRes || 0; G.jieRes = 1 - (1 - j0) * SQ36.JIE_MUL; UI.toast('昊天塔镇住了半边天劫', '#ffd23a');
    try { return await _tr.apply(this, arguments); } finally { G.jieRes = j0; }
  };
  const _tb = Game._tryBreak; Game._tryBreak = async function () { const G = this.G; if (G && SQ36.eqd() && SQ36.eqd().id === 'sq_fuxi' && this.canBreak() && G.realm < 6) UI.toast(SQ36.LINES.fuxi, '#ffd23a'); return _tb.apply(this, arguments); };
  // 碎晶：秘境通关 1–3
  if (window.Dng && Dng.exit) { const _ex = Dng.exit; Dng.exit = function () { const r = this.run; const ok = r && !r.over && r.bossDone && r.floor >= r.maxFloor; const res = _ex.apply(this, arguments); if (ok && Game.G) { const n = ri(1, 3); Game.give('sqj', n); UI.toast(`秘境深处拾得神器碎晶 ×${n}`, '#ffd23a'); } return res; }; }
  // 碎晶：世界BOSS 击杀 2
  if (typeof WB33 !== 'undefined' && WB33.challenge) { const _ch = WB33.challenge; WB33.challenge = async function () { const G = Game.G; const k0 = G && G.wb33 && G.wb33.killed; const r = await _ch.apply(this, arguments); if (G && !k0 && G.wb33 && G.wb33.killed) { Game.give('sqj', SQ36.WB_SJ); UI.toast(`催收使身上掉出神器碎晶 ×${SQ36.WB_SJ}`, '#ffd23a'); Game.save(); } return r; }; }
  // 地图线索点
  const _mm = Game.makeMarks; Game.makeMarks = function () { const r = _mm.apply(this, arguments); try { SQ36.mark(); } catch (e) { } return r; };
  // 洞府：本命法宝旁「神器阁」入口
  UI.p_sq36 = function (b, re) {
    b.innerHTML = SQ36.html(Game.G);
    b.onclick = async e => { const t = e.target.closest('[data-sq]'); if (!t) return; e.stopPropagation(); Sfx.play && Sfx.play('click'); await SQ36.onBtn(t.dataset.sq, t.dataset.v); re(); };
  };
  const _pc = UI.p_cave; UI.p_cave = function (b, re) {
    const r = _pc.apply(this, arguments); const G = Game.G; if (!G) return r;
    const d = h('div', 'sq36wrap', SQ36.entHtml(G)); const fb = b.querySelector('.fb33wrap'); if (fb) fb.after(d); else b.appendChild(d);
    d.addEventListener('click', async e => { const t = e.target.closest('[data-sq="open"]'); if (!t) return; e.stopPropagation(); Sfx.play && Sfx.play('click'); await UI.panel('sq36'); d.innerHTML = SQ36.entHtml(G); UI.hud(); });
    return r;
  };
  const css = document.createElement('style');
  css.textContent = `.sq36wrap{margin-top:10px}.sq36wrap .opt{width:100%;border-color:#ffd23a;color:#ffe9a0}.sq36wrap .opt small{display:block;font-size:11px;opacity:.85}
.sq36head{display:flex;flex-wrap:wrap;gap:4px 12px;margin-bottom:4px;font-size:13px}.sq36head b{color:#ffd77a}.sq36head .cd{color:#ff9a7a}
.sq36it{display:flex;align-items:center;gap:8px;margin:6px 0;padding:6px;border-radius:8px;background:rgba(255,210,60,.08);border:1px solid rgba(255,210,60,.3);overflow:hidden}.sq36it.eq{border-color:#ffd23a;box-shadow:0 0 6px rgba(255,210,60,.5)}
.sq36it>i{flex:0 0 48px}.sq36it .sil{filter:brightness(0) drop-shadow(0 0 3px #ffd23a);opacity:.75}.sq36it .tx{flex:1 1 0;min-width:0}.sq36it .tx b{display:block;color:#ffe9a0}.sq36it.dim .tx b{color:#aaa}
.sq36it small{display:block;font-size:11px;line-height:1.3;opacity:.9;word-break:break-all}.sq36it small.on{color:#9affd0}.sq36it small.lk{opacity:.6}
.sq36it .bs{display:flex;flex-direction:column;gap:4px;flex:0 0 auto}.sq36it .sqb{min-width:56px;min-height:44px;white-space:nowrap}`;
  document.head.appendChild(css);
  // 开发者面板 Tab
  if (window.DevPanel && DevPanel.registerTab) DevPanel.registerTab('sq36', '神器36', (box, ctx) => {
    const G = Game.G; if (!G) { box.innerHTML = '<p>先开始一局</p>'; return; } const s = SQ36.st(G);
    box.innerHTML = `<p>碎晶 ${SQ36.sj(G)}｜供奉 ${s.eq ? SQ36.LIST[s.eq].n : '无'}｜追寻 ${s.quest ? SQ36.LIST[s.quest.id].n + ' ' + s.quest.step + '/' + SQ36.steps(s.quest.id) : '无'}</p>
      <div class="dvb" style="justify-content:flex-start"><button class="sm dvx" data-q="sj">碎晶+60</button><button class="sm dvx" data-q="stone">灵石+20000</button><button class="sm dvx" data-q="r5">境界→化神</button><button class="sm dvx" data-q="ring">完成当前一环</button><button class="sm dvx" data-q="cd">清更换冷却</button><button class="sm dvx" data-q="seen">标记全部已寻(二周目)</button><button class="sm dvx" data-q="reset">清空神器</button></div>
      <div class="dvb" style="justify-content:flex-start;margin-top:6px">${Object.entries(SQ36.LIST).map(([id, L]) => `<button class="sm dvx${s.own[id] ? ' on' : ''}" data-g="${id}">${L.n}${s.own[id] ? '·' + SQ36.AW_N[s.own[id].aw] : ''}</button>`).join('')}</div><p class="hint">点神器：未有→获得觉醒Ⅰ；已有→觉醒+1（Ⅲ 后回到Ⅰ）。</p>`;
    box.onclick = e => {
      const t = e.target.closest('button'); if (!t) return; const q = t.dataset.q, g = t.dataset.g;
      if (q === 'sj') { Game.give('sqj', 60); ctx.toast('神器碎晶 +60'); }
      else if (q === 'stone') { G.stone += 20000; ctx.toast('灵石 +20000'); }
      else if (q === 'r5') { G.flags.awakened = 1; if (G.realm < 5) { G.realm = 5; G.stage = 0; G.exp = 0; } ctx.toast('境界：' + REALMS[G.realm].n); }
      else if (q === 'ring') { const r = SQ36.advance(G); ctx.toast(r ? (r.done ? '神器到手：' + SQ36.LIST[r.id].n : `线索 ${r.step}/${r.n}`) : '当前没有追寻中的线索'); SQ36.mark(); }
      else if (q === 'cd') { s.cd = null; ctx.toast('更换冷却已清除'); }
      else if (q === 'seen') { for (const id in SQ36.LIST) SQ36.meta()[id] = 1; Game.saveMeta(); ctx.toast('已标记：下一世每条线索 2 环'); }
      else if (q === 'reset') { G.sq36 = { own: {}, eq: null, quest: null }; SQ36.mark(); ctx.toast('神器已清空'); }
      else if (g) { const o = s.own[g]; if (!o) s.own[g] = { aw: 1, q: 0 }; else o.aw = o.aw >= 3 ? 1 : o.aw + 1; if (s.quest && s.quest.id === g) s.quest = null; ctx.toast(SQ36.LIST[g].n + ' 觉醒' + SQ36.AW_N[s.own[g].aw]); }
      ctx.save(); ctx.rerender();
    };
  });
})();

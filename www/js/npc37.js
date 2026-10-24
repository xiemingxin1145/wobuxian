// v3.7.0 路遇系统 NPC37 第一块（开放世界线第二十四轮）：核心模块 + 冷却/上限 + 按恩怨分档 + 单场景结算 + 新闻 + Story37 事件总线。
// 独立文件，不改 game.js / main.js / jianghu34.js / life34.js。第二十五轮起挂进正常游玩：包裹 npcAI（同图、距离≤2 格自动路遇，自动任务/挂机期间不触发，选项带「⚑」前缀不进 SAFE 白名单），包裹 Game.yearEnd 发年度新闻并 topUp。
// 规则（docs/research_story37.md §1）：
//   分档按 Life34.rel：≤−40 仇(chou) / −40..40 生(sheng) / ≥40 友(you)；年份 Life34.yr()；月份取 G.jh34.t（绝对月），没有则 年×12。
//   同一地图路遇 ≥6 个月一次；全图每年 ≤4 次路遇；每个 NPC 每年 ≤2 条事件（路遇 + 新闻合计）；新闻每年 ≤6 条、其中 toast ≤2，不足 3 条由 topUp 补。
//   本年已是 life34 仇家上门对象（L.pending.npc）或 Stage3.huntBlocksFoe 为真 → 不出「仇」档路遇。
//   自有队列 G.npc37.q，不碰 L.pending。效果全部拼成效果串交给 Game.apply（aff 只改 G.aff，life34 包装自动 ×0.5 同步 L.rel，不重复加；karma 加到 G.karma）。
//   物品负数 = 消耗，不足则选项置灰；灵石负数不够也置灰。fight:1 → 当前地图的怪打一场（Game.apply 的 fight 效果）。
'use strict';
const TEXT37 = {"news":{"jiechou":["{a}与{b}在{map}狭路相逢，互骂三百回合，结下梁子。","{a}说{b}欠钱不还，{b}说{a}记错账。仇，结了。","{b}踩了{a}的飞剑，{a}发誓此仇不共戴天。","{a}与{b}抢同一株灵草，双双空手，怒目而去。","讨债司调解{a}与{b}未果，调解费两人各付一半。","{a}在茶馆讲{b}坏话，被{b}本人听见。","{a}与{b}从此见面不打招呼，只打架。"],"jieqin":["{a}与{b}结为道侣，天道发来贺礼：一张份子钱账单。","{a}与{b}喜结连理，宴席欠款由宾客均摊。","{a}向{b}求亲，聘礼是半本天道账本，{b}收了。","{a}与{b}双修有成，同心契约已在讨债司备案。","{a}与{b}成婚，月老说红线钱下月再结。","{a}和{b}从此一起还债，效率翻倍。"],"baishi":["{b}拜{a}为师，敬茶一杯，学费三年分期。","{a}收{b}为徒，第一课：如何躲讨债鬼。","{b}跪求三日，{a}终于点头：先交押金。","{a}将毕生所学传给{b}，包括欠条。","{b}入{a}门下，师门规矩第一条：不准赊账。","{a}收徒{b}，说是缘分，其实是缺人干活。"],"chousha":["{a}与{b}于{map}死斗，{b}陨落，遗债由天道接管。","{a}终报大仇，{b}身死道消，讨债司连夜封账。","{b}殒于{a}剑下，临终遗言：“账……还没还……”","{a}斩{b}于月下，自己也欠下一笔血债。","{a}与{b}之仇了结，江湖少一人，账本多一页。","{b}陨落，{a}跪在坟前：“下辈子别借我钱。”"],"duobao":["{a}抢先{b}一步夺得秘宝，{b}只捡到收据。","{a}从{b}手中夺走藏宝图，图上写着“欠款”。","{a}与{b}争夺秘境遗宝，宝物被讨债司没收。","{a}夺宝成功，{b}气得当场写了三张战书。","{b}的灵兽蛋被{a}顺走，孵出来是只讨债雀。","{a}截胡{b}的奇遇，江湖称其“白嫖真人”。","{a}夺得{b}的古钱，转手就拿去还了利息。"],"tupo":["{a}突破成功，天雷落下，顺便劈出一张账单。","{a}闭关一年出关，修为大进，钱包大减。","{a}破境之时，{b}在旁护法，收费公道。","{a}渡劫成功，讨债司送来贺匾：“利息照旧”。","{a}一朝顿悟，{b}嫉妒得睡不着。","{a}修为突破，第一件事是改签还款期。","{a}突破失败又成功，天道说这次不收手续费。"]},"meet":{"chou":[{"t":"{n}拦住去路：“上回的账，今天算清。”","ch":[{"x":"拔剑应战","fx":{"aff":-5,"fight":1}},{"x":"赔你五十灵石","fx":{"stone":-50,"aff":8}},{"x":"转身就跑","fx":{"aff":-2}}]},{"t":"{n}冷笑：“你命挺硬，讨债鬼都没收你。”","ch":[{"x":"彼此彼此","fx":{"aff":-3}},{"x":"递上桃花酿","fx":{"item":{"wine":-1},"aff":10}}]},{"t":"{n}往你脚边扔了张欠条，扭头就走。","ch":[{"x":"捡起来看看","fx":{"item":{"bill":1},"aff":0}},{"x":"撕了","fx":{"aff":-5}}]},{"t":"{n}被讨债鬼围住，看见你一脸尴尬。","ch":[{"x":"出手相助","fx":{"aff":15,"fight":1}},{"x":"围观收门票","fx":{"stone":30,"aff":-8}},{"x":"悄悄走开","fx":{"aff":0}}]},{"t":"{n}：“这条路我包了，过路费一百。”","ch":[{"x":"付钱","fx":{"stone":-100,"aff":5}},{"x":"打一架","fx":{"aff":-5,"fight":1}},{"x":"绕远路","fx":{}}]},{"t":"{n}受了伤，靠在树下喘气，瞪着你。","ch":[{"x":"给颗回春丹","fx":{"item":{"hcd":-1},"aff":20}},{"x":"补一脚","fx":{"aff":-20,"karma":-5}},{"x":"视而不见","fx":{}}]},{"t":"{n}：“我数到三，你不走我就动手。”","ch":[{"x":"一","fx":{"aff":-3,"fight":1}},{"x":"赶紧走","fx":{"aff":2}}]},{"t":"{n}在你摊前砸场子，嚷你卖假丹。","ch":[{"x":"当场试药","fx":{"aff":6,"item":{"pyd":-1}}},{"x":"赔笑送古钱","fx":{"item":{"coin":-1},"aff":12}},{"x":"赶人","fx":{"aff":-6}}]}],"sheng":[{"t":"{n}迎面走来，打量你：“道友面生啊。”","ch":[{"x":"拱手见礼","fx":{"aff":3}},{"x":"借问去处","fx":{"aff":1}}]},{"t":"{n}在河边钓鱼，鱼篓空空。","ch":[{"x":"送一条灵鱼","fx":{"item":{"fish":-1},"aff":8}},{"x":"教他打窝","fx":{"aff":4}},{"x":"路过","fx":{}}]},{"t":"{n}：“道友，借十灵石，下月还。”","ch":[{"x":"借","fx":{"stone":-10,"aff":6}},{"x":"不借","fx":{"aff":-2}},{"x":"反向借他","fx":{"aff":-1,"stone":5}}]},{"t":"{n}捡到一块玄铁晶，问是不是你的。","ch":[{"x":"是我的","fx":{"item":{"ore":1},"aff":-4,"karma":-2}},{"x":"不是","fx":{"aff":5}}]},{"t":"{n}被雨淋透，你恰好撑着油纸伞。","ch":[{"x":"分他半边伞","fx":{"aff":6}},{"x":"收伞钱五灵石","fx":{"stone":5,"aff":-2}}]},{"t":"{n}在算命摊排队：“道友也来问债运？”","ch":[{"x":"一起算","fx":{"stone":-20,"aff":5}},{"x":"我不信命","fx":{"aff":1}}]},{"t":"{n}迷路了，手里地图拿反了。","ch":[{"x":"指路","fx":{"aff":5}},{"x":"卖他地图","fx":{"stone":15,"aff":2}}]},{"t":"{n}正啃干粮，分你一半。","ch":[{"x":"接过道谢","fx":{"aff":4}},{"x":"回赠蟠桃","fx":{"item":{"peach":-1},"aff":12}}]}],"you":[{"t":"{n}远远招手：“可算碰到你了！请你喝酒！”","ch":[{"x":"不醉不归","fx":{"aff":5,"item":{"wine":1}}},{"x":"改天吧","fx":{"aff":1}}]},{"t":"{n}塞给你一个包裹：“路上捡的，送你。”","ch":[{"x":"收下","fx":{"item":{"herb":2},"aff":2}},{"x":"回赠暖玉","fx":{"item":{"jadeg":-1},"aff":15}}]},{"t":"{n}：“讨债鬼在前面设卡，跟我走小路。”","ch":[{"x":"跟上","fx":{"aff":4,"stone":30}},{"x":"硬闯","fx":{"fight":1}}]},{"t":"{n}偷偷给你看一张藏宝图的另一半。","ch":[{"x":"合伙寻宝","fx":{"item":{"key":1},"aff":5}},{"x":"婉拒","fx":{"aff":0}}]},{"t":"{n}：“我突破了！请你见证一下。”","ch":[{"x":"护法","fx":{"aff":8,"item":{"pyd":1}}},{"x":"鼓掌","fx":{"aff":3}}]},{"t":"{n}愁眉苦脸：“欠讨债司三百……”","ch":[{"x":"替还一百","fx":{"stone":-100,"aff":15}},{"x":"同病相怜","fx":{"aff":3}}]},{"t":"{n}：“这本残破功法我看不懂，你拿去。”","ch":[{"x":"收下","fx":{"item":{"scroll":1},"aff":2}},{"x":"一起参悟","fx":{"aff":6}}]},{"t":"{n}帮你挡了一记暗箭，嘿嘿一笑。","ch":[{"x":"道谢","fx":{"aff":5}},{"x":"回礼题字折扇","fx":{"item":{"fan":-1},"aff":12}},{"x":"请他吃饭","fx":{"stone":-30,"aff":8}}]}]},"lines":{"jh_jianke":{"n":"游方剑客·萧十三","l":["剑又卷刃了，你那有磨刀石吗？","你我同路一程，路费各付各的。"]},"jh_danniang":{"n":"丹娘·苏半夏","l":["来颗丹？炸炉品半价。","你气色不好，像欠了天道钱。"]},"jh_mozi":{"n":"魔修·厉无咎","l":["别误会，我今天只讨债，不杀人。","魔道也有信用分，我的比你高。"]},"jh_tieguo":{"n":"散修·赵铁锅","l":["这锅能炖仙鹤，也能挡飞剑。","借我十灵石，我请你喝锅底汤。"]},"jh_xunbao":{"n":"寻宝客·钱满仓","l":["你脚下可能有宝，也可能有雷。","另一半藏宝图？在你那吗？"]},"jh_yangui":{"n":"女侠·燕归","l":["路见不平，你先上，我殿后。","东海的风，吹不走讨债司的船。"]},"mentor":{"n":"落魄剑仙","l":["嗝——徒儿，有酒没有？","当年我一剑欠了天道三千年。"]},"sister":{"n":"师姐·林小满","l":["又在外头晃！回去扫山门！","我、我只是顺路，才不是找你。"]},"cuihua":{"n":"翠花","l":["村口桃花开了，你啥时回来？","修仙别忘了吃饭，饿死不划算。"]},"ali":{"n":"狐妖·阿离","l":["人类，你身上有鱼的味道。","哼，碰巧路过，别多想。"]},"aoxiao":{"n":"龙女·敖小乐","l":["我爹的钱庄又催账了，快跑！","请你吃蟠桃，记我爹账上。"]},"sumei":{"n":"魔女·苏魅","l":["小可爱，买东西打九折哦。","魔道讲诚信——今天讲。"]},"xiaoyi":{"n":"师兄·萧逸","l":["剑在人在……我剑呢？","一起去后山？这次我不断剑。"]},"aotian":{"n":"龙傲天","l":["莫欺少年穷——虽然我真穷。","今日之辱，我记账本上了。"]},"ruyan":{"n":"剑客·柳如烟","l":["剑要快，酒要烈，债要拖。","你也被讨债司追？同路吧。"]},"bailang":{"n":"书生·白玉郎","l":["小生题扇一把，润笔费随意。","天道讨债，可有诗意？没有。"]},"lengyue":{"n":"冷月仙子","l":["……嗯。","月色尚好，债务尚多。"]}}};
const NPC37 = {
  V: 1, MAP_CD: 6, MEET_MAX: 4, PER_MAX: 2, NEWS_MAX: 6, NEWS_MIN: 3, TOAST_MAX: 2, TEXT: TEXT37,
  G() { return (typeof Game !== 'undefined' && Game.G) || null; },
  yr() { return (typeof Life34 !== 'undefined' && Life34.yr) ? Life34.yr() : 0; },
  month() { const G = this.G(); return G && G.jh34 && typeof G.jh34.t === 'number' ? G.jh34.t : this.yr() * 12; },
  rel(id) { const G = this.G(); const L = G && G.life34; return (L && L.rel && L.rel[id]) || 0; },
  tier(id) { const r = this.rel(id); return r <= -40 ? 'chou' : r >= 40 ? 'you' : 'sheng'; },
  st() { const G = this.G(); if (!G) return null; let S = G.npc37; if (!S || S.v !== 1) S = G.npc37 = { v: 1, rel: {}, tie: {}, st: {}, yc: { yr: 0, n: 0, per: {}, map: {} }, ev: {}, q: [] };
    if (!S.q) S.q = []; if (!S.yc) S.yc = { yr: 0, n: 0, per: {}, map: {} };
    const y = this.yr(); if (S.yc.yr !== y) S.yc = { yr: y, n: 0, news: 0, toast: 0, per: {}, map: S.yc.map || {} };
    if (S.yc.news == null) S.yc.news = 0; if (S.yc.toast == null) S.yc.toast = 0; return S; },
  name(id) { const N = (typeof NPCS !== 'undefined' && NPCS[id]) || null; return N ? String(N.n).split('·').pop() : id; },
  mapName(m) { return (typeof MAPINFO !== 'undefined' && MAPINFO[m] && MAPINFO[m].n) || m || '江湖'; },
  fill(s, o) { return String(s).replace(/\{(a|b|n|map)\}/g, (_, k) => o[k] != null ? o[k] : ''); },
  rnd(a) { return a[Math.floor(Math.random() * a.length)]; },
  // 能否路遇（不改状态）：返回 null 或原因字符串
  block(id, mapId) { const S = this.st(); if (!S) return 'nogame'; const c = S.yc, m = this.month();
    if (S.st[id] && S.st[id].dead) return 'dead';
    if (c.n >= this.MEET_MAX) return 'year';
    if ((c.per[id] || 0) >= this.PER_MAX) return 'npc';
    if (c.map[mapId] != null && m - c.map[mapId] < this.MAP_CD) return 'map';
    return null; },
  foeBlocked(id) { const G = this.G(); const P = G && G.life34 && G.life34.pending; if (P && P.npc === id) return true;
    try { if (typeof Stage3 !== 'undefined' && Stage3.huntBlocksFoe && Stage3.huntBlocksFoe(G)) return true; } catch (e) { } return false; },
  // 路遇：通过则记冷却/额度，生成场景放入自有队列并返回；否则 null
  onMeet(id, mapId, opt) { opt = opt || {}; if (!opt.force && this.block(id, mapId)) return null; const S = this.st(); if (!S) return null;
    let tier = this.tier(id); if (tier === 'chou' && this.foeBlocked(id)) { if (!opt.force) return null; tier = 'sheng'; }
    const pool = TEXT37.meet[tier]; const k = opt.k != null ? opt.k : Math.floor(Math.random() * pool.length); const sc = pool[k % pool.length];
    const o = { n: this.name(id), map: this.mapName(mapId) }; const lines = TEXT37.lines[id] || [];
    const scene = { id, map: mapId, tier, k: k % pool.length, title: '⚑ 路遇·' + o.n, line: lines.length ? this.rnd(lines) : '', t: this.fill(sc.t, o), ch: sc.ch.map(c => ({ x: c.x, fx: c.fx })) , yr: this.yr(), m: this.month() };
    S.yc.n++; S.yc.per[id] = (S.yc.per[id] || 0) + 1; S.yc.map[mapId] = this.month(); S.q.push(scene); if (S.q.length > 4) S.q.splice(0, S.q.length - 4);
    this.bus.fire('meet', scene); return scene; },
  // 选项是否可选（物品不足 / 灵石不足置灰）
  can(fx) { const G = this.G(); if (!G || !fx) return true; if (fx.stone < 0 && (G.stone || 0) < -fx.stone) return false;
    for (const it in (fx.item || {})) { const n = fx.item[it]; if (n < 0 && ((G.inv && G.inv[it]) || 0) < -n) return false; } return true; },
  effStr(id, fx, mapId) { const p = []; if (!fx) return '';
    if (fx.aff) p.push(`aff:${id}:${fx.aff}`); if (fx.stone) p.push(`stone${fx.stone > 0 ? '+' : '-'}${Math.abs(fx.stone)}`);
    for (const it in (fx.item || {})) if (fx.item[it]) p.push(`item:${it}:${fx.item[it]}`);
    if (fx.karma) p.push(`karma${fx.karma > 0 ? '+' : '-'}${Math.abs(fx.karma)}`);
    if (fx.fight) { const mi = typeof MAPINFO !== 'undefined' && MAPINFO[mapId]; const mons = (mi && mi.mons) || []; if (mons.length) p.push('fight:' + this.rnd(mons)); }
    return p.join(';'); },
  // 结算队首（或给定）场景的第 c 个选项；返回 { ok, eff, out } ；置灰选项返回 ok:false
  // 真实 Game.apply 返回 { txt, later }：fight 等放在 later 里延后执行，这里在提示之后逐个跑（第二十八轮修：之前没跑 later，fight:1 不开战）
  async resolve(scene, c, onOut) { const S = this.st(); if (!S || !scene) return { ok: false }; const o = scene.ch[c]; if (!o) return { ok: false, why: 'bad' };
    if (!this.can(o.fx)) return { ok: false, why: 'grey' };
    const i = S.q.indexOf(scene); if (i >= 0) S.q.splice(i, 1);
    const eff = this.effStr(scene.id, o.fx, scene.map); const raw = eff ? await Game.apply(eff) : null;
    let out = [], later = []; if (Array.isArray(raw)) out = raw; else if (raw) { out = String(raw.txt || '').split('，').filter(Boolean); later = Array.isArray(raw.later) ? raw.later : []; }
    this.bus.fire('resolve', { scene, c, eff }); if (typeof onOut === 'function') { try { onOut(out); } catch (x) { } }
    let fight = null; for (const f of later) { const G = this.G(); if (!G || G.dead) break; const r = await f(); if (r && r.res) fight = r.res; }
    if (fight) this.bus.fire('fight', { scene, c, res: fight });
    return { ok: true, eff, out, fight }; },
  // 弹卡：标题以「⚑」开头，置灰选项加（缺）并重弹
  async play(scene) { if (typeof UI === 'undefined' || !UI.card || !scene) return null;
    for (let tries = 0; tries < 3; tries++) { const opts = scene.ch.map(o => '⚑ ' + o.x + (this.can(o.fx) ? '' : '（缺）'));
      const c = await UI.card(scene.title, (scene.line ? `${scene.name || this.name(scene.id)}：“${scene.line}”\n` : '') + scene.t, 'i:bill', opts);
      const r = await this.resolve(scene, c, out => { if (typeof UI.toast === 'function' && out && out.length) UI.toast(out.join('，')); });
      if (r.ok) { if (r.fight && typeof UI.toast === 'function') UI.toast(r.fight === 'win' ? `路遇一战：击退来敌` : `路遇一战：落了下风`); if (Game.save) Game.save(); return r; }
      if (typeof UI.toast === 'function') UI.toast('条件不足'); } return null; },
  // 新闻：kind ∈ news 六类；a/b NPC id；每 NPC 年 ≤2、全年 ≤6、toast ≤2
  emit(kind, a, b, mapId, opt) { opt = opt || {}; if (b === a) b = null; const S = this.st(); if (!S) return null; const pool = TEXT37.news[kind]; if (!pool) return null; const c = S.yc;
    if (c.news >= this.NEWS_MAX) return null; if ((c.per[a] || 0) >= this.PER_MAX || (b && (c.per[b] || 0) >= this.PER_MAX)) return null;
    const pl = b ? pool : pool.filter(x => x.indexOf('{b}') < 0); if (!pl.length) return null; const s = '【江湖风云】' + this.fill(this.rnd(pl), { a: this.name(a), b: b ? this.name(b) : '', map: this.mapName(mapId) });
    c.news++; c.per[a] = (c.per[a] || 0) + 1; if (b) c.per[b] = (c.per[b] || 0) + 1;
    const toast = !!opt.notable && c.toast < this.TOAST_MAX; if (toast) c.toast++;
    this.feed(s, toast); this.bus.fire('news', { kind, a, b, s }); return s; },
  feed(s, toast) { const G = this.G(); if (!G) return;
    if (typeof JH34 !== 'undefined' && JH34.say && JH34.ensure) { JH34.say(JH34.ensure(G), s, 'npc37', false); }
    else { G.jh34 = G.jh34 || { feed: [] }; const F = G.jh34.feed = G.jh34.feed || []; F.push({ t: G.jh34.t || 0, s, k: 'npc37' }); if (F.length > 40) F.splice(0, F.length - 40); }
    if (toast && typeof UI !== 'undefined' && UI.toast) UI.toast(s); },
  ids() { const r = Object.keys(TEXT37.lines); return (typeof NPCS !== 'undefined') ? r.filter(k => NPCS[k]) : r; },
  // 年末补到 ≥3 条（突破闲话）
  topUp() { const S = this.st(); if (!S) return 0; let k = 0; const free = () => this.ids().filter(id => (S.yc.per[id] || 0) < this.PER_MAX).sort(() => Math.random() - 0.5);
    for (let g = 0; S.yc.news < this.NEWS_MIN && g < 20; g++) { const f = free(); if (!f.length) break; if (this.emit('tupo', f[0], f[1] || null)) k++; } return k; },
  // 日程：本月目标图（JH34 游历结果 > roam > 固定图）
  schedule(id) { const G = this.G(); const L = G && G.jh34; const s = L && L.npcs && L.npcs[id]; if (s && s.map) return s.map;
    const N = typeof NPCS !== 'undefined' && NPCS[id]; if (!N) return null; try { return N.roam ? N.roam(G) : N.map; } catch (e) { return N.map || null; } },
  bus: { h: {}, on(e, f) { (this.h[e] = this.h[e] || []).push(f); return () => { this.h[e] = this.h[e].filter(x => x !== f); }; }, fire(e, d) { (this.h[e] || []).slice().forEach(f => { try { f(d); } catch (x) { } }); } },
};

// ---------- 第二十五轮：挂进正常游玩 ----------
NPC37.NEAR = 2; NPC37.CHECK_MS = 800; NPC37.KINDS = ['jiechou', 'duobao', 'baishi', 'tupo', 'jieqin'];
NPC37.autoOn = function () { try { if (typeof AUTO !== 'undefined' && AUTO.on) return true; if (typeof AFK !== 'undefined' && AFK.on) return true; } catch (e) { } return false; };
// 现在能不能弹路遇卡（不改状态）
NPC37.idle = function () { const G = this.G(); if (!G || G.dead || this._busy) return false; if (typeof R === 'undefined' || R.mode !== 'map' || !R.player) return false;
  if (typeof Game !== 'undefined' && Game._busy) return false; if (typeof UI !== 'undefined' && UI.stack && UI.stack.length) return false;
  if (typeof B !== 'undefined' && B && B.on) return false; if (this.autoOn()) return false; if (R.player.nav) return false; return true; };
// 每个 NPC 帧更新时调用：节流、距离、冷却全部通过才弹卡；返回场景或 null
NPC37.check = function (e, now) { if (!e || e.kind !== 'npc' || !TEXT37.lines[e.id] || e.talking > 0 || e.hidden) return null;
  now = now == null ? Date.now() : now; if (now - (this._t || 0) < this.CHECK_MS) return null; if (!this.idle()) return null;
  const P = R.player; if (Math.hypot(P.i - e.i, P.j - e.j) > this.NEAR) return null; this._t = now;
  const sc = this.onMeet(e.id, R.mapId); if (!sc) return null; this._busy = true; e.talking = 2;
  Promise.resolve(this.play(sc)).catch(() => { }).then(() => { this._busy = false; }); return sc; };
// 年末：本年 1–3 条 NPC 之间的江湖事 + 补到 3 条；与玩家 rel≥40 的人相关才 toast
NPC37.yearNews = function () { const S = this.st(); if (!S) return 0; const ids = this.ids(); if (ids.length < 2) return 0; let k = 0; const want = 1 + Math.floor(Math.random() * 3);
  for (let g = 0; g < want * 3 && k < want; g++) { const a = this.rnd(ids); let b = this.rnd(ids); if (b === a) continue;
    if (this.emit(this.rnd(this.KINDS), a, b, this.schedule(a), { notable: this.rel(a) >= 40 || this.rel(b) >= 40 })) k++; }
  return k + this.topUp(); };
if (typeof npcAI === 'function') { const _ai = npcAI; npcAI = function (e, dt) { const r = _ai.apply(this, arguments); try { NPC37.check(e); } catch (x) { } return r; }; }
if (typeof Game !== 'undefined' && Game.yearEnd) { const _ye = Game.yearEnd; Game.yearEnd = async function () { const r = await _ye.apply(this, arguments); try { NPC37.yearNews(); } catch (x) { } return r; }; }
const Story37 = window.Story37 || { on: (e, f) => NPC37.bus.on(e, f), fire: (e, d) => NPC37.bus.fire(e, d) };
window.NPC37 = NPC37; window.Story37 = Story37; window.TEXT37 = TEXT37;

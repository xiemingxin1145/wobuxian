'use strict';
// ======================= v3.7.4 自由路线 route37（数据 + 核心逻辑；UI「更多→道途」与 NPC 结局入口下一轮接） =======================
// 规格与文案：docs/research_v22.md §10（TEXT374 逐字抄自 §10.9 JSON，年事件抄自 §10.6）。
// 存档：G.route37（缺省 null = 不在路线，行为与之前完全一致）；只包 Game.yearEnd（年结算）与 Game.die（路线结局 +15 分），不改 game.js 本体。
// 概率统一走 Game.roll(p, 'route37')（无 Game.roll 退回 Math.random）。
const TEXT374 = {"routes":{"sanxiu":{"n":"散修","enter":"你把宗门腰牌挂在了桃花村的树上。从今往后，天大地大，债主找不到你——大概。","leave":"你又想有个靠山了。散修的日子自由，就是年底没人发年货。","lock":"你还挂着宗门的名，先退宗再说。"},"moxiu":{"n":"魔修","enter":"你对着天道的账单冷笑一声，把它烧成了灰。灰飘起来，拼成两个字：欠款。","leave":"你洗了手，洗了三遍，觉得心里那点黑总算淡了。","lock":"你还不够狠。（需善恶 ≤ −50）","lockLeave":"心魔未消。（需善恶 ≥ 0）"},"zhangmen":{"n":"宗门掌门","enter":"你坐上掌门之位，第一份文件是宗门的欠款明细。你第二份文件是辞职信，被长老撕了。","leave":"你把掌门印交给了大弟子，附了一张便条：账本在床底下。","lock":"你还不是一宗之主。"},"shangjia":{"n":"凡人商贾","enter":"你把剑当了，换了一杆秤。仙路走不通，财路总能走通——天道欠的是建造款，你欠的只是本金。","leave":"你又摸了摸那杆秤，叹口气收进了箱底。可惜，你已经回不去修炼了，换条路走走也好。","lock":"修仙的人不配做生意。（需凡人且年满 30 岁）"},"shijia":{"n":"家族","enter":"你在祠堂里挂上了家谱。最上面那行是你，最下面那行留白，写着：待还。","leave":"你把家主之位传了出去，族里人放鞭炮的声音，你在山门外都听得见。","lock":"家里人丁还不够兴旺。（需族谱三代）"}},"endings":{"r37_xiaoyao":["逍遥游","没有宗门，没有天道，只有一壶酒、一把剑，和一张还清的欠条。你和萧十三坐在山顶，看讨债司的云车从脚下飘过——那上面，再也没有你的名字。"],"r37_mojun":["魔君","你登上天魔殿最高的那把椅子。讨债司寄来的账单，你批了两个字：“驳回。”从此三界多了一条规矩：魔君的债，天道得排队要。"],"r37_fujia":["富甲一方","你买下了讨债司。第一道命令：所有利息，归零。第二道命令：把那张祖传欠条装裱，挂在大堂正中——下面刻一行小字：“已结清。收款人：本司。”"],"r37_shijia":["仙门世家","你的名字刻在了祠堂第一排。三代人，三把剑，一本越来越薄的账。桃花村的孩子们都知道：那家人的债，是一代一代还清的。"]},"tips":{"r37_xiaoyao":["萧十三拎着酒壶过来：“听说你一个人走完了两条险路？再走两条，咱们去喝一壶不欠账的酒。”","萧十三：“就差最后那张欠条了。还清了，你这辈子就真没人管得着了。”"],"r37_mojun":["厉无咎：“第一个。正道的人头，比讨债司的账好算。”","厉无咎：“天魔殿那帮老东西还不认你。多送点礼——当然，抢来的也算礼。”"],"r37_fujia":["钱多多压低声音：“道友，讨债司最近周转不灵，听说……在找买家。”","钱多多：“报价出来了，一百万灵石，连人带账本。您再攒攒？”"],"r37_shijia":["娘捧着家谱直抹眼泪：“咱家祖坟冒青烟了，冒的还是灵气。”","娘：“再出一个，咱家就能在青云宗山脚下立牌坊了。牌坊钱……先赊着。”"],"zhangmen":["长老：“掌门，这一仗打得漂亮。不过……对方说战损要咱们赔。”","长老：“诸宗都在观望。再结交几家，万仙来朝，指日可待。”"]},"loan":{"jh_tieguo":{"min":5000,"max":20000,"rate":0.18,"def":0.25,"back":0.4},"jh_xunbao":{"min":20000,"max":80000,"rate":0.12,"def":0.12,"back":0.6},"merchant":{"min":50000,"max":300000,"rate":0.07,"def":0.04,"back":0.8},"term":3,"maxLoans":3},"yearPts":{"sanxiu":1,"moxiu":1,"zhangmen":1,"shangjia":0,"shijia":1},"evtP":{"sanxiu":0.35,"moxiu":0.4,"zhangmen":0.3,"shangjia":0.45,"shijia":0.3},"cooldownYears":10,"endingBonusPts":15};
// 20 条路线专属年事件（docs/research_v22.md §10.6 逐字）。o: [选项文字, 效果]；效果 a = Game.apply 串（stone 已按境界缩放前的基数，见 fx），其余为本模块结构化字段
const EVT374 = {
  sanxiu: [
    { id: 'sx1', t: '⚑ 野路子', x: '山洞里有本没封皮的功法，字迹像是你小学同桌写的。', o: [['照着练', { xpNeed: 0.05, p: 0.3, pe: { dx: -3 } }], ['拿去换钱', { stone: 400 }]] },
    { id: 'sx2', t: '⚑ 拼桌', x: '茶棚里另一个散修要跟你拼桌，说可以一起分担讨债司的催收费。', o: [['结伴', { affRnd: 8 }], ['各付各的', { dx: 2 }]] },
    { id: 'sx3', t: '⚑ 宗门招安', x: '青云宗执事递来一张招贤帖：“包吃包住，代偿债务一成。”', o: [['收下帖子当书签', { karma: 3 }], ['当场撕了', { dx: 3, sect: { qingyun: -5 } }]] },
    { id: 'sx4', t: '⚑ 无主灵田', x: '荒山上有块灵田，地契上的名字被雨泡烂了。', o: [['种上', { buff: { k: 'herb', n: 2, y: 3 } }], ['留给后来人', { karma: 5 }]] }],
  moxiu: [
    { id: 'mx1', t: '⚑ 血契', x: '天魔殿送来一份血契，条款比天道的合同还长。', o: [['签', { sect: { tianmo: 10 }, karma: -5 }], ['让他们先把字号写大点', {}]] },
    { id: 'mx2', t: '⚑ 正道围剿', x: '三个青云宗弟子堵在山口，喊着“除魔卫道”。', o: [['打', { fight: 1, win: { xpNeed: 0.05 }, lose: { stonePct: -10 } }], ['跑', { stone: -300, raw: 1 }]] },
    { id: 'mx3', t: '⚑ 讨债司的友好提醒', x: '催收使：“魔修客户请注意：杀人越货的收入同样需要还债。”', o: [['给钱', { payDebt: 500 }], ['把催收使吓跑', { karma: -3, buff: { k: 'rate', n: 0.01, y: 1 } }]] },
    { id: 'mx4', t: '⚑ 回头是岸', x: '一个老和尚拦住你：“施主，你的账，佛祖可以帮你分期。”', o: [['听他讲完', { karma: 10, buff: { k: 'noXp', n: 1, y: 1 } }], ['不听', { karma: -2 }]] }],
  zhangmen: [
    { id: 'zm1', t: '⚑ 宗门财报', x: '账房呈上年报：收入一栏写着“灵气”，支出一栏写着“天道”。', o: [['削减开支', { stone: 800, disAff: -5 }], ['继续烧钱', { stone: -800, buff: { k: 'warCd', n: 1, y: 1 } }]] },
    { id: 'zm2', t: '⚑ 弟子告状', x: '大弟子告二弟子偷吃丹药，二弟子告大弟子诬告。', o: [['各打五十板', { dx: 2 }], ['各发一颗回春丹', { item: { hcd: -2 }, req: { hcd: 2 }, disAff: 5 }]] },
    { id: 'zm3', t: '⚑ 结盟函', x: '百草谷来函结盟，附赠一株“可能是灵芝”。', o: [['结盟', { sect: { baicao: 15 } }], ['回函“再议”', {}]] },
    { id: 'zm4', t: '⚑ 掌门也欠钱', x: '讨债司来人：“掌门，宗门挂在您名下，债也挂在您名下。”', o: [['宗门公款代还', { debt: -1000, disAff: -8 }], ['自掏腰包', { stone: -1000, raw: 1, karma: 5 }]] }],
  shangjia: [
    { id: 'sj1', t: '⚑ 囤货', x: '听说明年灵草要涨价，坊市人人都在囤。', o: [['跟着囤', { stone: -2000, later: { y: 1, p: 0.5, a: 4000, b: 1200, t: '囤的灵草' } }], ['不囤', {}]] },
    { id: 'sj2', t: '⚑ 假货', x: '你进的一批“千年人参”，根上贴着“桃花村萝卜”。', o: [['认栽退货', { stone: -500, karma: 3 }], ['照卖', { stone: 1500, karma: -8, aff: { merchant: -5 } }]] },
    { id: 'sj3', t: '⚑ 修士赊账', x: '一个金丹修士要赊账，说回头飞升了双倍还。', o: [['赊', { stone: -1000, later: { y: 5, p: 0.4, a: 3000, b: 0, t: '金丹修士的赊账' } }], ['不赊', {}]] },
    { id: 'sj4', t: '⚑ 天道来进货', x: '一个自称“天道采购部”的人要订一万块砖，“盖个新世界”。', o: [['接单', { stone: 5000, debt: 2000 }], ['要现结', { karma: 2 }]] }],
  shijia: [
    { id: 'jz1', t: '⚑ 分家', x: '两个孩子吵着分家产，分到最后发现家产主要是债。', o: [['平分债务', { kidAff: 3 }], ['长子多担', { kid0: { pur: 5 }, kidAff1: -8 }]] },
    { id: 'jz2', t: '⚑ 联姻', x: '百草谷长老想与你家联姻，聘礼是一炉丹。', o: [['答应', { sect: { baicao: 10 }, item: { hcd: 3 } }], ['孩子自己做主', { dx: 3 }]] },
    { id: 'jz3', t: '⚑ 族学', x: '族里想办族学，先生要价每年 600 灵石。', o: [['办', { buff: { k: 'school', n: 600, y: 99 } }], ['自己教', { dx: 2, buff: { k: 'teach', n: 1, y: 99 } }]] },
    { id: 'jz4', t: '⚑ 祖传欠条', x: '孩子在箱底翻出那张祖传欠条，问你：“爹/娘，这上面的利息是怎么算的？”', o: [['如实相告', { dx: 5, kidAff: 3 }], ['说是传家宝', { karma: -2 }]] }],
};
// 路线结局（§10.4）：check 只看真实状态；where 是出现「⚑ 大结局」选项的 NPC，陨落时落到 fb
const END374 = {
  r37_xiaoyao: { route: 'sanxiu', where: 'jh_jianke', fb: 'villager', check: G => (G.realm || 0) >= 4 && Route37.chains(G) >= 4 && (G.debt || 0) <= 0 },
  r37_mojun: { route: 'moxiu', where: 'jh_mozi', fb: 'villager', check: G => ((G.route37 && G.route37.kills) || 0) >= 3 && ((G.sectRel && G.sectRel.tianmo) || 0) >= 60 },
  r37_fujia: { route: 'shangjia', where: 'merchant', fb: 'villager', check: G => (G.stone || 0) >= 1000000 && !!G.route37 && G.route37.id === 'shangjia' },
  r37_shijia: { route: 'shijia', where: 'mom', fb: 'villager', check: G => Route37.clanZj(G) >= 3 },
};
const Route37 = {
  T: TEXT374, EV: EVT374, END: END374, IDS: ['sanxiu', 'moxiu', 'zhangmen', 'shangjia', 'shijia'], HIST_MAX: 8, LIFE_MAX: 20, DX: 100,
  G() { return (typeof Game !== 'undefined' && Game.G) || null; },
  yr(G) { G = G || this.G(); try { if (typeof Life34 !== 'undefined' && Life34.yr) return Life34.yr(); } catch (e) { } return (G && (G.year || G.age)) || 0; },
  roll(p) { try { if (typeof Game !== 'undefined' && typeof Game.roll === 'function') return !!Game.roll(p, 'route37'); } catch (e) { } return Math.random() < p; },
  // 存档：G.route37 = { id, pts, since, prev, hist, tip, kills, loans, later, buff, lastStone, lifeAdd, ev }；null = 不在任何路线（老档行为不变）
  ensure(G) { G = G || this.G(); if (!G) return null; let S = G.route37; if (!S || typeof S !== 'object') return null;
    if (this.IDS.indexOf(S.id) < 0) S.id = null; if (typeof S.pts !== 'number' || !isFinite(S.pts)) S.pts = 0;
    if (!Array.isArray(S.hist)) S.hist = []; for (const k of ['tip', 'buff', 'ev']) if (!S[k] || typeof S[k] !== 'object' || Array.isArray(S[k])) S[k] = {};
    for (const k of ['loans', 'later']) if (!Array.isArray(S[k])) S[k] = []; for (const k of ['kills', 'lifeAdd']) if (typeof S[k] !== 'number' || !isFinite(S[k])) S[k] = 0;
    return S; },
  cur(G) { const S = this.ensure(G); return S && S.id ? S.id : null; },
  gens(G) { const F = G && G.fam37; if (!F) return 1; if (typeof F.gen === 'number') return F.gen; const k = Array.isArray(F.kids) ? F.kids : [];
    return 1 + (k.length ? 1 : 0) + (k.some(x => x && Array.isArray(x.kids) && x.kids.length) ? 1 : 0); },
  // 族中（含本人，不含已故）筑基+ 人数：fam37 子嗣目前没有境界字段，只认 kid.realm（以后接上）
  clanZj(G) { let n = (G.realm || 0) >= 2 && !G.dead ? 1 : 0; const k = (G.fam37 && Array.isArray(G.fam37.kids)) ? G.fam37.kids : []; for (const x of k) if (x && !x.dead && (x.realm || 0) >= 2) n++; return n; },
  chains(G) { const ch = G && G.jh34 && G.jh34.ch; let n = 0; if (ch && typeof ch === 'object') for (const k in ch) { const s = ch[k]; if (s && s.done && !s.fail && !s.bad) n++; } return n; },
  // 能否进入（null = 可以，否则 lock 文案）
  can(id, G) { G = G || this.G(); if (!G || this.IDS.indexOf(id) < 0) return '未知路线'; const T = this.T.routes[id];
    if (id === 'sanxiu' && G.sect) return T.lock; if (id === 'moxiu' && !((G.karma || 0) <= -50)) return T.lock;
    if (id === 'zhangmen' && !G.sectLeader) return T.lock; if (id === 'shangjia' && !((G.realm || 0) === 0 && (G.age || 0) >= 30)) return T.lock;
    if (id === 'shijia' && this.gens(G) < 3) return T.lock; return null; },
  // 能否离开当前路线（含换到别的或退出到无路线）
  canLeave(G) { G = G || this.G(); const S = this.ensure(G); if (!S || !S.id) return null; const left = this.T.cooldownYears - (this.yr(G) - (S.since || 0));
    if (S.id === 'moxiu' && (G.karma || 0) < 0) return this.T.routes.moxiu.lockLeave; if (left > 0) return `还要再走 ${left} 年`; return null; },
  // 选定 / 切换 / 退出（id = null）。返回 { ok, txt } 或 { ok:false, why }
  choose(id, G) { G = G || this.G(); if (!G) return { ok: false, why: 'nogame' }; const S0 = this.ensure(G);
    if (S0 && S0.id === id) return { ok: false, why: '已在此路线' }; if (id !== null) { const w = this.can(id, G); if (w) return { ok: false, why: w }; }
    if (S0 && S0.id) { const w = this.canLeave(G); if (w) return { ok: false, why: w }; }
    const yr = this.yr(G); const S = S0 || (G.route37 = { id: null, pts: 0, since: yr, prev: null, hist: [] }); this.ensure(G); const txt = [];
    if (S.id) { S.hist.push({ id: S.id, pts: S.pts, yr }); if (S.hist.length > this.HIST_MAX) S.hist.splice(0, S.hist.length - this.HIST_MAX); txt.push(this.T.routes[S.id].leave); }
    S.prev = S.id; S.id = id; S.pts = 0; S.since = yr; S.lastStone = G.stone || 0; if (id) txt.push(this.T.routes[id].enter);
    return { ok: true, txt: txt.join('\n') }; },
  mul(G) { G = G || this.G(); const id = this.cur(G); if (!id) return 1; const S = G.route37;
    if (id === 'shangjia') return 0; if (S.buff.noXp) return 1; return id === 'moxiu' ? 1.15 : 1; },
  price(kind, G) { return this.cur(G) === 'shangjia' ? (kind === 'buy' ? 0.9 : 1.1) : 1; },
  canMed(G) { return this.cur(G) !== 'shangjia'; },
  stoneK(G) { return this.cur(G) === 'shangjia' ? 1 : 1 + (G.realm || 0); },
  // ---- 放贷（§10.5，商贾专属）----
  lendLock(who, amt, G) { G = G || this.G(); const L = this.T.loan, C = L[who]; if (this.cur(G) !== 'shangjia') return '只有凡人商贾能放贷'; if (!C) return '此人不借';
    if (G.route37.loans.length >= L.maxLoans) return `同时最多 ${L.maxLoans} 笔`; if (G.route37.loans.some(l => l.who === who)) return '此人还有一笔没还';
    if (!(amt >= C.min && amt <= C.max)) return `额度 ${C.min}–${C.max}`; if ((G.stone || 0) < amt) return '灵石不够'; if (this.dead(who, G)) return '此人已陨落'; return null; },
  lend(who, amt, G) { G = G || this.G(); amt = Math.round(amt); const w = this.lendLock(who, amt, G); if (w) return { ok: false, why: w };
    G.stone -= amt; const l = { who, amt, rate: this.T.loan[who].rate, yr: this.yr(G), left: this.T.loan.term }; G.route37.loans.push(l); return { ok: true, loan: l }; },
  dead(id, G) { G = G || this.G(); const N = G && G.npc37; return !!(N && N.st && N.st[id] && N.st[id].dead); },
  settleLoans(G) { const S = G.route37, out = []; const keep = [];
    for (const l of S.loans) { const C = this.T.loan[l.who]; const nm = this.nm(l.who);
      if (this.dead(l.who, G)) { out.push({ k: 'dead', who: l.who, s: `${nm}已陨落，${l.amt} 灵石借款全额违约。` }); continue; }
      if (this.roll(C.def)) { const back = Math.round(l.amt * C.back); G.stone += back; const o = { k: 'def', who: l.who, back, s: `${nm}违约了，只还回 ${back} 灵石本金。` };
        if (l.who === 'jh_tieguo') { o.aff = -10; o.item = { herb: 1 }; o.s += '赵铁锅塞给你一口铁锅（折成灵草 ×1）。'; }
        if (l.who === 'jh_xunbao' && this.roll(0.3)) { o.clue = 'c37_3'; o.s += '钱满仓抵给你一条奇遇链线索。'; }
        out.push(o); continue; }
      const it = Math.round(l.amt * C.rate); G.stone += it; l.left--; if (l.left <= 0) { G.stone += l.amt; out.push({ k: 'done', who: l.who, s: `${nm}付息 ${it}，到期还本 ${l.amt}。` }); continue; }
      out.push({ k: 'int', who: l.who, s: `${nm}付息 ${it} 灵石。` }); keep.push(l); }
    S.loans = keep; return out; },
  nm(id) { try { if (typeof NPCS !== 'undefined' && NPCS[id]) return NPCS[id].n; } catch (e) { } return id; },
  // ---- 年事件效果 ----
  fxParts(e, G) { const parts = [], out = []; const k = e.raw ? 1 : this.stoneK(G); const M = (G.mem37 = G.mem37 && typeof G.mem37 === 'object' ? G.mem37 : {});
    if (e.stone) parts.push(`stone${e.stone >= 0 ? '+' : '-'}${Math.abs(Math.round(e.stone * k))}`);
    if (e.stonePct) parts.push(`stone%${e.stonePct}`); if (e.karma) parts.push(`karma${e.karma >= 0 ? '+' : '-'}${Math.abs(e.karma)}`);
    if (e.xpNeed) { let need = 0; try { need = Game.need(); } catch (er) { } if (need) parts.push(`exp+${Math.round(need * e.xpNeed)}`); }
    if (e.item) for (const i in e.item) parts.push(`item:${i}:${e.item[i]}`); if (e.aff) for (const i in e.aff) parts.push(`aff:${i}:${e.aff[i]}`);
    if (e.affRnd) { const ids = ['jh_jianke', 'jh_danniang', 'jh_mozi', 'jh_tieguo', 'jh_xunbao', 'jh_yangui'].filter(i => !this.dead(i, G)); if (ids.length) parts.push(`aff:${ids[Math.floor(Math.random() * ids.length)]}:${e.affRnd}`); }
    if (e.dx) { if (typeof M.dx !== 'number' || !isFinite(M.dx)) M.dx = 0; const d0 = M.dx; const cap = (typeof DLG37 !== 'undefined' && DLG37.DX) || this.DX; M.dx = Math.max(-cap, Math.min(cap, M.dx + e.dx)); if (M.dx !== d0) out.push(`道心${M.dx > d0 ? '+' : ''}${M.dx - d0}`); }
    if (e.sect) { G.sectRel = G.sectRel || {}; for (const s in e.sect) G.sectRel[s] = Math.max(-100, Math.min(100, (G.sectRel[s] || 0) + e.sect[s])); out.push('宗门关系变化'); }
    if (e.debt) { G.debt = Math.max(0, Math.round((G.debt || 0) + e.debt)); out.push(`天道欠款${e.debt >= 0 ? '+' : ''}${e.debt}`); }
    if (e.payDebt) { if ((G.debt || 0) > 0) { const d = Math.min(G.debt, e.payDebt); G.debt -= d; out.push(`天道欠款-${d}`); } else parts.push(`stone-${e.payDebt}`); }
    if (e.buff) { G.route37.buff[e.buff.k] = { n: e.buff.n, y: e.buff.y }; }
    if (e.later) G.route37.later.push({ at: this.yr(G) + e.later.y, p: e.later.p, a: e.later.a, b: e.later.b, t: e.later.t });
    if (e.disAff && Array.isArray(G.dis36)) for (const d of G.dis36) if (d) d.loy = Math.max(0, Math.min(100, (d.loy || 0) + e.disAff));
    const kids = (G.fam37 && Array.isArray(G.fam37.kids)) ? G.fam37.kids : [];
    if (e.kidAff) kids.forEach(x => { x.aff = (x.aff || 0) + e.kidAff; }); if (e.kidAff1 && kids[1]) kids[1].aff = (kids[1].aff || 0) + e.kidAff1; if (e.kid0 && kids[0]) kids[0].pur = (kids[0].pur || 0) + e.kid0.pur;
    return { parts, out }; },
  okOpt(e, G) { if (e && e.req) for (const i in e.req) if (((G.inv && G.inv[i]) || 0) < e.req[i]) return false; return true; },
  async fx(e, G) { G = G || this.G(); if (!G || !G.route37) return { txt: '' }; let pe = e;
    if (e.p != null) { pe = Object.assign({}, e); delete pe.p; delete pe.pe; if (this.roll(e.p)) pe = Object.assign(pe, e.pe); }
    if (e.fight) { let won = false; try { const r = await Game.apply('fight:' + (((typeof MAPINFO !== 'undefined' && typeof R !== 'undefined' && MAPINFO[R.mapId]) || {}).mons || ['slime'])[0]);
        if (r && Array.isArray(r.later)) for (const fn of r.later) { const v = await fn(); if (v === true || (v && v.win)) won = true; } } catch (er) { } pe = won ? e.win : e.lose; }
    const { parts, out } = this.fxParts(pe || {}, G); let r = null; if (parts.length) { try { r = await Game.apply(parts.join(';')); } catch (er) { } }
    const txt = [r && r.txt, out.join('，')].filter(Boolean).join('，'); return { txt, later: (r && r.later) || [] }; },
  // ---- 年结算 ----
  pickEvent(G) { const id = this.cur(G); if (!id || !this.roll(this.T.evtP[id])) return null; const pool = this.EV[id]; return pool[Math.floor(Math.random() * pool.length)]; },
  tips(G) { const S = G.route37, out = []; const T = this.T.tips; const tip = (k, i) => { const key = k + '_' + i; if (S.tip[key]) return; S.tip[key] = 1; out.push({ id: key, t: '⚑ ' + (k === 'zhangmen' ? '宗门' : this.T.endings[k][0]), s: T[k][i] }); };
    const id = S.id; const ch = this.chains(G);
    if (id === 'sanxiu') { if (ch >= 2) tip('r37_xiaoyao', 0); if ((G.realm || 0) >= 4 && ch >= 4 && (G.debt || 0) > 0) tip('r37_xiaoyao', 1); }
    if (id === 'moxiu') { if (S.kills >= 1) tip('r37_mojun', 0); if (S.kills >= 3 && ((G.sectRel && G.sectRel.tianmo) || 0) < 60) tip('r37_mojun', 1); }
    if (id === 'shangjia') { if ((G.stone || 0) >= 300000) tip('r37_fujia', 0); if ((G.stone || 0) >= 800000) tip('r37_fujia', 1); }
    if (id === 'shijia') { const z = this.clanZj(G) - ((G.realm || 0) >= 2 ? 1 : 0); if (z >= 1) tip('r37_shijia', 0); if (z >= 2) tip('r37_shijia', 1); }
    if (id === 'zhangmen') { const w = (G.war && G.war.wins) || 0; if (w >= 1) tip('zhangmen', 0); if (w >= 2) tip('zhangmen', 1); }
    return out; },
  // 每年一次（由 Game.yearEnd 包装调用）。返回 { pts, loans, later, tips, ev }，不弹窗（UI 下一轮接）
  yearTick(G) { G = G || this.G(); const S = this.ensure(G); if (!S || !S.id) return null; const yr = this.yr(G); if (S.lastYr === yr) return null; S.lastYr = yr;
    const id = S.id, res = { pts: 0, loans: [], later: [], tips: [], ev: null };
    res.pts += this.T.yearPts[id] || 0;
    if (id === 'moxiu') { G.karma = (G.karma || 0) - 2; G.sectRel = G.sectRel || {}; for (const s of ['qingyun', 'baicao']) G.sectRel[s] = Math.max(-100, (G.sectRel[s] || 0) - 3); }
    if (id === 'shangjia') { if (S.lifeAdd < this.LIFE_MAX) { S.lifeAdd++; G.lifeBonus = (G.lifeBonus || 0) + 1; } res.loans = this.settleLoans(G); }
    // 年事件延迟结果（囤货/赊账）
    const keep = []; for (const L of S.later) { if (L.at > yr) { keep.push(L); continue; } const v = this.roll(L.p) ? L.a : L.b; if (v) G.stone = (G.stone || 0) + v; res.later.push({ t: L.t, v }); } S.later = keep;
    // 持续效果
    const B = S.buff; if (B.herb) { G.inv = G.inv || {}; G.inv.herb = (G.inv.herb || 0) + B.herb.n; } if (B.school) { G.stone = Math.max(0, (G.stone || 0) - B.school.n); }
    for (const k in B) { if (k === 'noXp' || k === 'rate' || k === 'warCd') { if (B[k].done) delete B[k]; else B[k].done = 1; continue; } if (--B[k].y <= 0) delete B[k]; }
    // 商贾：每赚 1 万净值 +1（按 G.stone 年增量；放贷放出的本金在借出时已扣、还本时回来，净额自然抵消），负数不扣
    if (id === 'shangjia') { const d = (G.stone || 0) - (S.lastStone || 0); if (d > 0) res.pts += Math.floor(d / 10000); S.lastStone = G.stone || 0; }
    S.pts += res.pts; res.tips = this.tips(G); res.ev = this.pickEvent(G); if (res.ev) S.ev[res.ev.id] = (S.ev[res.ev.id] || 0) + 1; return res; },
  onKill(npc, G) { G = G || this.G(); if (this.cur(G) !== 'moxiu') return 0; const s = G.jh34 && G.jh34.npcs && G.jh34.npcs[npc]; if (!s || !(s.sect === 'qingyun' || s.sect === 'baicao')) return 0; G.route37.kills++; G.route37.pts += 8; return G.route37.kills; },
  onChain(G) { G = G || this.G(); if (this.cur(G) === 'sanxiu') G.route37.pts += 5; },
  onWarWin(G) { G = G || this.G(); if (this.cur(G) === 'zhangmen') G.route37.pts += 6; },
  // ---- 结局入口（§10.1-6）：不需要主线 done ----
  ready(G) { G = G || this.G(); const id = this.cur(G); if (!id) return []; const out = [];
    for (const k in this.END) { const E = this.END[k]; if (E.route !== id) continue; let ok = false; try { ok = !!E.check(G); } catch (e) { } if (!ok) continue;
      out.push({ id: k, where: this.dead(E.where, G) ? E.fb : E.where, label: '⚑ 大结局·' + this.T.endings[k][0], confirm: '此生就此落幕？' }); }
    return out; },
  optionsFor(npc, G) { return this.ready(G).filter(o => o.where === npc); },
  isRouteEnd(kind) { return !!END374[kind]; },
};
// 结局卡写入 ENDINGS（r37_ 前缀，不覆盖已有 key）
if (typeof ENDINGS !== 'undefined') for (const k in TEXT374.endings) if (!ENDINGS[k]) ENDINGS[k] = TEXT374.endings[k].slice();
// 年结算：Route37.yearTick（不在路线 = 什么都不做）；结局积分 +15 在 die 包装里记到 meta.pts
if (typeof Game !== 'undefined' && Game.yearEnd && !Game.yearEnd._r37) { const _ye = Game.yearEnd; Game.yearEnd = async function () { const r = await _ye.apply(this, arguments);
    try { const t = Route37.yearTick(this.G); if (t) { Route37.last = t; if (typeof UI !== 'undefined' && UI.toast) { for (const l of t.loans) UI.toast('💰 ' + l.s, '#ffd23a'); for (const l of t.later) UI.toast(`💰 ${l.t}：灵石 +${l.v}`, '#ffd23a'); } } } catch (e) { console.warn('route37 yearEnd', e); }
    return r; }; Game.yearEnd._r37 = 1; }
if (typeof Game !== 'undefined' && Game.die && !Game.die._r37) { const _die = Game.die; Game.die = async function (kind) { const G = this.G; const bonus = G && !G.dead && Route37.isRouteEnd(kind);
    if (bonus && this.meta) { this.meta.pts = (this.meta.pts || 0) + TEXT374.endingBonusPts; } return _die.apply(this, arguments); }; Game.die._r37 = 1; }

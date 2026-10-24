'use strict';
// ======================= 3.7.4 自由路线（route37）=======================
// 规格：docs/research_v22.md §10（研究员，07f76ad）。只做包裹（Talk.extra / Game.yearEnd / Game.cultMult / Game._tryBreak / Game.die / UI.p_more / FAM37.cap / FAM37.inheritLg），
// 不改 game.js/talk.js/data.js/ui.js。存档：G.route37 = { id, pts, since, prev, hist[], tip{}, kills, rep{}, dx, loans[], later[], trade, merchant, life, kmo{}, ev }；
// 老档缺省 null = 不在任何路线（行为与 3.7.2 相同）。
// 与规格的差异（已在 PROGRESS 记录）：
//  · 玩家对宗门的声望存 G.route37.rep[宗门]，不写 G.sectRel（那里是“宗门对宗门”的 a|b 键，life34 会把单键当成一对宗门读）。
//  · market25 没有统一价格入口：商贾的“买低卖高”改成道途面板里每年一次的「行商」（投入灵石、年终结算），再加放贷。
//  · war29 没有冷却：掌门的“宗门战冷却 −1 年”暂不做；收徒名额 +1 已做。
//  · 子嗣没有境界：家族路线下年满 16 岁的子嗣每年按灵根有几率筑基（kid.r37zj）；“族谱三代”= 娘、你、至少 1 个子嗣。
//  · 散修“江湖任务酬劳 ×1.2 / 奇遇权重 ×1.5”暂不做；奇遇链完成 +5 分已做。
const TEXT374 = {
  "routes": {
    "sanxiu":   {"n":"散修","enter":"你把宗门腰牌挂在了桃花村的树上。从今往后，天大地大，债主找不到你——大概。","leave":"你又想有个靠山了。散修的日子自由，就是年底没人发年货。","lock":"你还挂着宗门的名，先退宗再说。"},
    "moxiu":    {"n":"魔修","enter":"你对着天道的账单冷笑一声，把它烧成了灰。灰飘起来，拼成两个字：欠款。","leave":"你洗了手，洗了三遍，觉得心里那点黑总算淡了。","lock":"你还不够狠。（需善恶 ≤ −50）","lockLeave":"心魔未消。（需善恶 ≥ 0）"},
    "zhangmen": {"n":"宗门掌门","enter":"你坐上掌门之位，第一份文件是宗门的欠款明细。你第二份文件是辞职信，被长老撕了。","leave":"你把掌门印交给了大弟子，附了一张便条：账本在床底下。","lock":"你还不是一宗之主。"},
    "shangjia": {"n":"凡人商贾","enter":"你把剑当了，换了一杆秤。仙路走不通，财路总能走通——天道欠的是建造款，你欠的只是本金。","leave":"你又摸了摸那杆秤，叹口气收进了箱底。可惜，你已经回不去修炼了，换条路走走也好。","lock":"修仙的人不配做生意。（需凡人且年满 30 岁）"},
    "shijia":   {"n":"家族","enter":"你在祠堂里挂上了家谱。最上面那行是你，最下面那行留白，写着：待还。","leave":"你把家主之位传了出去，族里人放鞭炮的声音，你在山门外都听得见。","lock":"家里人丁还不够兴旺。（需族谱三代）"}
  },
  "endings": {
    "r37_xiaoyao": ["逍遥游","没有宗门，没有天道，只有一壶酒、一把剑，和一张还清的欠条。你和萧十三坐在山顶，看讨债司的云车从脚下飘过——那上面，再也没有你的名字。"],
    "r37_mojun":   ["魔君","你登上天魔殿最高的那把椅子。讨债司寄来的账单，你批了两个字：“驳回。”从此三界多了一条规矩：魔君的债，天道得排队要。"],
    "r37_fujia":   ["富甲一方","你买下了讨债司。第一道命令：所有利息，归零。第二道命令：把那张祖传欠条装裱，挂在大堂正中——下面刻一行小字：“已结清。收款人：本司。”"],
    "r37_shijia":  ["仙门世家","你的名字刻在了祠堂第一排。三代人，三把剑，一本越来越薄的账。桃花村的孩子们都知道：那家人的债，是一代一代还清的。"]
  },
  "tips": {
    "r37_xiaoyao": ["萧十三拎着酒壶过来：“听说你一个人走完了两条险路？再走两条，咱们去喝一壶不欠账的酒。”","萧十三：“就差最后那张欠条了。还清了，你这辈子就真没人管得着了。”"],
    "r37_mojun":   ["厉无咎：“第一个。正道的人头，比讨债司的账好算。”","厉无咎：“天魔殿那帮老东西还不认你。多送点礼——当然，抢来的也算礼。”"],
    "r37_fujia":   ["钱多多压低声音：“道友，讨债司最近周转不灵，听说……在找买家。”","钱多多：“报价出来了，一百万灵石，连人带账本。您再攒攒？”"],
    "r37_shijia":  ["娘捧着家谱直抹眼泪：“咱家祖坟冒青烟了，冒的还是灵气。”","娘：“再出一个，咱家就能在青云宗山脚下立牌坊了。牌坊钱……先赊着。”"],
    "zhangmen":    ["长老：“掌门，这一仗打得漂亮。不过……对方说战损要咱们赔。”","长老：“诸宗都在观望。再结交几家，万仙来朝，指日可待。”"]
  },
  "loan": {
    "jh_tieguo": {"min":5000,"max":20000,"rate":0.18,"def":0.25,"back":0.4},
    "jh_xunbao": {"min":20000,"max":80000,"rate":0.12,"def":0.12,"back":0.6},
    "merchant":  {"min":50000,"max":300000,"rate":0.07,"def":0.04,"back":0.8},
    "term":3, "maxLoans":3
  },
  "yearPts": {"sanxiu":1,"moxiu":1,"zhangmen":1,"shangjia":0,"shijia":1},
  "evtP": {"sanxiu":0.35,"moxiu":0.40,"zhangmen":0.30,"shangjia":0.45,"shijia":0.30},
  "cooldownYears": 10, "endingBonusPts": 15
};
// 路线专属年事件（§10.6）：fx 字段 stone（×(1+大境界)，商贾 ×1；debtX:1 时 debt 同倍率）expN（修为=need×n）dx karma debt rep{宗} aff{id} affRand item{} fight later{} loy clan zj
const R37_EV = {
  sanxiu: [
    ['野路子', '山洞里有本没封皮的功法，字迹像是你小学同桌写的。', ['照着练', { expN: 0.05, dxRisk: -3 }], ['拿去换钱', { stone: 400 }]],
    ['拼桌', '茶棚里另一个散修要跟你拼桌，说可以一起分担讨债司的催收费。', ['结伴', { affRand: 8 }], ['各付各的', { dx: 2 }]],
    ['宗门招安', '青云宗执事递来一张招贤帖：“包吃包住，代偿债务一成。”', ['收下帖子当书签', { karma: 3 }], ['当场撕了', { dx: 3, rep: { qingyun: -5 } }]],
    ['无主灵田', '荒山上有块灵田，地契上的名字被雨泡烂了。', ['种上', { later: { k: 'tian', n: 3 } }], ['留给后来人', { karma: 5 }]],
  ],
  moxiu: [
    ['血契', '天魔殿送来一份血契，条款比天道的合同还长。', ['签', { rep: { tianmo: 10 }, karma: -5 }], ['让他们先把字号写大点', {}]],
    ['正道围剿', '三个青云宗弟子堵在山口，喊着“除魔卫道”。', ['打', { fight: 1 }], ['跑', { stone: -300 }]],
    ['讨债司的友好提醒', '催收使：“魔修客户请注意：杀人越货的收入同样需要还债。”', ['给钱', { stone: -500, debt: -500, debtX: 1 }], ['把催收使吓跑', { karma: -3, debtPct: 0.01 }]],
    ['回头是岸', '一个老和尚拦住你：“施主，你的账，佛祖可以帮你分期。”', ['听他讲完', { karma: 10, noBonus: 1 }], ['不听', { karma: -2 }]],
  ],
  zhangmen: [
    ['宗门财报', '账房呈上年报：收入一栏写着“灵气”，支出一栏写着“天道”。', ['削减开支', { stone: 800, contrib: -5 }], ['继续烧钱', { stone: -800, contrib: 10 }]],
    ['弟子告状', '大弟子告二弟子偷吃丹药，二弟子告大弟子诬告。', ['各打五十板', { dx: 2 }], ['各发一颗回春丹', { item: { hcd: -2 }, loy: 5 }]],
    ['结盟函', '百草谷来函结盟，附赠一株“可能是灵芝”。', ['结盟', { rep: { baicao: 15 } }], ['回函“再议”', {}]],
    ['掌门也欠钱', '讨债司来人：“掌门，宗门挂在您名下，债也挂在您名下。”', ['宗门公款代还', { debt: -1000, loy: -8 }], ['自掏腰包', { stone: -1000, karma: 5 }]],
  ],
  shangjia: [
    ['囤货', '听说明年灵草要涨价，坊市人人都在囤。', ['跟着囤', { stone: -2000, later: { k: 'tun', n: 1 } }], ['不囤', {}]],
    ['假货', '你进的一批“千年人参”，根上贴着“桃花村萝卜”。', ['认栽退货', { stone: -500, karma: 3 }], ['照卖', { stone: 1500, karma: -8, aff: { merchant: -5 } }]],
    ['修士赊账', '一个金丹修士要赊账，说回头飞升了双倍还。', ['赊', { stone: -1000, later: { k: 'she', n: 5 } }], ['不赊', {}]],
    ['天道来进货', '一个自称“天道采购部”的人要订一万块砖，“盖个新世界”。', ['接单', { stone: 5000, debt: 2000 }], ['要现结', { karma: 2 }]],
  ],
  shijia: [
    ['分家', '两个孩子吵着分家产，分到最后发现家产主要是债。', ['平分债务', { clan: 3 }], ['长子多担', { zj: 0.05, clan: -8 }]],
    ['联姻', '百草谷长老想与你家联姻，聘礼是一炉丹。', ['答应', { rep: { baicao: 10 }, item: { hcd: 3 } }], ['孩子自己做主', { dx: 3 }]],
    ['族学', '族里想办族学，先生要价每年 600 灵石。', ['办', { later: { k: 'xue', n: 99 } }], ['自己教', { dx: 2, zj: 0.02 }]],
    ['祖传欠条', '孩子在箱底翻出那张祖传欠条，问你：“这上面的利息是怎么算的？”', ['如实相告', { dx: 5, clan: 3 }], ['说是传家宝', { karma: -2 }]],
  ],
};
const Route37 = {
  T: TEXT374, EV: R37_EV, IDS: ['sanxiu', 'moxiu', 'zhangmen', 'shangjia', 'shijia'],
  ZHENG: ['jh_jianke', 'jh_yangui', 'jh_danniang'], // 正道 NPC（魔修可仇杀）
  END: {
    r37_xiaoyao: { r: 'sanxiu', where: 'jh_jianke' }, r37_mojun: { r: 'moxiu', where: 'jh_mozi' },
    r37_fujia: { r: 'shangjia', where: 'merchant' }, r37_shijia: { r: 'shijia', where: 'mom' },
  },
  G() { return typeof Game !== 'undefined' ? Game.G : null; },
  yr(G) { G = G || this.G(); return G ? (G.year != null ? G.year : G.age || 0) : 0; },
  st(G) { G = G || this.G(); if (!G) return null; const S = G.route37; if (!S || typeof S !== 'object') return null; this.fix(S); return S; },
  fix(S) { if (S.pts == null) S.pts = 0; if (!Array.isArray(S.hist)) S.hist = []; if (!S.tip) S.tip = {}; if (!S.rep) S.rep = {}; if (!Array.isArray(S.loans)) S.loans = []; if (!Array.isArray(S.later)) S.later = []; if (!S.kmo) S.kmo = {}; if (S.kills == null) S.kills = 0; if (S.dx == null) S.dx = 0; if (S.life == null) S.life = 0; return S; },
  mk(G) { G = G || this.G(); if (!G.route37 || typeof G.route37 !== 'object') G.route37 = { id: null, pts: 0, since: null, prev: null }; return this.fix(G.route37); },
  cur(G) { const S = this.st(G); return S && S.id || null; },
  n(id) { return id && this.T.routes[id] ? this.T.routes[id].n : '无'; },
  nm(id) { const N = typeof NPCS !== 'undefined' && NPCS[id]; return N ? N.n.split('·').pop() : id; },
  dead(id) { const G = this.G(); try { const S = G && G.npc37; if (S && S.st && S.st[id] && S.st[id].dead) return true; const J = G && G.jh34; if (J && J.npcs && J.npcs[id] && J.npcs[id].dead) return true; } catch (e) { } return false; },
  where(eid) { const w = this.END[eid].where; return this.dead(w) || (typeof NPCS !== 'undefined' && !NPCS[w]) ? 'villager' : w; },
  kids(G) { return (G.fam37 && Array.isArray(G.fam37.kids)) ? G.fam37.kids : []; },
  chainsDone(G) { const ch = G.jh34 && G.jh34.ch; if (!ch) return 0; return Object.keys(ch).filter(k => ch[k] && ch[k].done && !ch[k].fail).length; },
  zjCount(G) { return ((G.realm || 0) >= 2 ? 1 : 0) + this.kids(G).filter(k => k.r37zj && !k.dead).length; },
  autoOn() { try { if (typeof NPC37 !== 'undefined' && NPC37.autoOn) return NPC37.autoOn(); if (typeof AUTO !== 'undefined' && AUTO.on) return true; } catch (e) { } return false; },
  // 进入条件（返回 null 或锁定文案）
  lock(id, G) {
    G = G || this.G(); const T = this.T.routes[id];
    if (id === 'sanxiu') return G.sect ? T.lock : null;
    if (id === 'moxiu') return (G.karma || 0) <= -50 ? null : T.lock;
    if (id === 'zhangmen') return G.sectLeader ? null : T.lock;
    if (id === 'shangjia') return (G.realm || 0) === 0 && (G.age || 0) >= 30 ? null : T.lock;
    if (id === 'shijia') return this.kids(G).length >= 1 ? null : T.lock;
    return '未知路线';
  },
  // 能否离开当前路线（切换/退出）
  leaveLock(G) {
    G = G || this.G(); const S = this.st(G); if (!S || !S.id) return null;
    const left = this.T.cooldownYears - (this.yr(G) - (S.since || 0)); if (left > 0) return `还要再走 ${left} 年（换路线需满 ${this.T.cooldownYears} 年）`;
    if (S.id === 'moxiu' && (G.karma || 0) < 0) return this.T.routes.moxiu.lockLeave;
    return null;
  },
  async choose(id, opt) {
    opt = opt || {}; const G = this.G(); if (!G || G.dead) return false; const S0 = this.st(G); const cur = S0 && S0.id;
    if (cur === id) return false;
    if (cur) { const l = this.leaveLock(G); if (l) { UI.toast('🔒 ' + l); return false; } }
    if (id) { const l = this.lock(id, G); if (l) { UI.toast('🔒 ' + l); return false; } }
    if (id === 'shangjia' && !opt.yes) { const c = await UI.card('⚑ 弃仙从商', '选「凡人商贾」后将永久放弃修炼：打坐不再长修为，也不能冲击瓶颈（换路线后也回不去）。\n确定吗？', 'npc_merchant', ['放弃修炼，做生意', '算了']); if (c !== 0) return false; }
    const S = this.mk(G);
    if (cur) { S.hist.unshift({ id: cur, pts: S.pts, yr: this.yr(G) }); S.hist.length = Math.min(8, S.hist.length); if (!opt.quiet) UI.toast(this.T.routes[cur].leave, '#c8a0ff'); }
    S.prev = cur || null; S.id = id || null; S.pts = 0; S.since = this.yr(G);
    if (id === 'shangjia') S.merchant = 1;
    if (id && !opt.quiet) await UI.card(`⚑ 道途·${this.n(id)}`, this.T.routes[id].enter, 'i:scroll', ['好']);
    if (typeof Game.save === 'function') Game.save(); return true;
  },
  title(S) { if (!S || !S.id) return ''; const p = S.pts; const lv = p >= 60 ? '宗师' : p >= 30 ? '名家' : p >= 10 ? '小有名气' : '初入'; return `${this.n(S.id)}·${lv}`; },
  repAdd(S, k, v) { S.rep[k] = Math.max(-100, Math.min(100, (S.rep[k] || 0) + v)); },
  mul(G) { return this.cur(G) === 'shangjia' ? 1 : 1 + (G.realm || 0); },
  canFx(G, fx) { if (!fx) return true; if (fx.stone < 0 && (G.stone || 0) < -fx.stone * this.mul(G)) return false; if (fx.item) for (const k in fx.item) if (fx.item[k] < 0 && ((G.inv && G.inv[k]) || 0) < -fx.item[k]) return false; return true; },
  async applyFx(fx, rnd) {
    rnd = rnd || Math.random; const G = this.G(); const S = this.mk(G); const out = []; const parts = []; fx = fx || {};
    if (fx.stone) parts.push(`stone${fx.stone >= 0 ? '+' : '-'}${Math.abs(Math.round(fx.stone * this.mul(G)))}`);
    if (fx.karma) parts.push(`karma${fx.karma >= 0 ? '+' : '-'}${Math.abs(fx.karma)}`);
    if (fx.debt) { const dv = Math.round(fx.debt * (fx.debtX ? this.mul(G) : 1)); parts.push(`debt${dv >= 0 ? '+' : '-'}${Math.abs(dv)}`); }
    if (fx.contrib) parts.push(`contrib${fx.contrib >= 0 ? '+' : '-'}${Math.abs(fx.contrib)}`);
    if (fx.item) for (const k in fx.item) parts.push(`item:${k}:${fx.item[k]}`);
    if (fx.aff) for (const k in fx.aff) parts.push(`aff:${k}:${fx.aff[k]}`);
    if (fx.affRand) { const ids = (typeof JH34 !== 'undefined' && JH34.CAST ? JH34.CAST.map(c => c[0]) : this.ZHENG).filter(i => !this.dead(i) && NPCS[i]); if (ids.length) parts.push(`aff:${ids[Math.floor(rnd() * ids.length) % ids.length]}:${fx.affRand}`); }
    if (parts.length) { const r = await Game.apply(parts.join(';')); if (r && r.txt) out.push(r.txt); else if (Array.isArray(r)) out.push(r.join('，')); }
    if (fx.expN && typeof Game.need === 'function' && !S.merchant) { const g = Game.addExp(Game.need() * fx.expN, true); out.push(`修为+${fmt(g || 0)}`); }
    if (fx.dxRisk && rnd() < 0.3) { S.dx = Math.max(-50, Math.min(50, S.dx + fx.dxRisk)); out.push(`道心${fx.dxRisk}`); }
    if (fx.dx) { S.dx = Math.max(-50, Math.min(50, S.dx + fx.dx)); out.push(`道心${fx.dx >= 0 ? '+' : ''}${fx.dx}`); }
    if (fx.rep) for (const k in fx.rep) { this.repAdd(S, k, fx.rep[k]); out.push(`${SECTS[k] ? SECTS[k].n : k}声望${fx.rep[k] >= 0 ? '+' : ''}${fx.rep[k]}`); }
    if (fx.debtPct) { S.debtPct = (S.debtPct || 0) + fx.debtPct; out.push(`本年欠款利息 ${fx.debtPct >= 0 ? '+' : '−'}${Math.round(Math.abs(fx.debtPct) * 1000) / 10}%`); }
    if (fx.noBonus) { S.noBonus = this.yr(G) + 1; out.push('魔功加成本年失效'); }
    if (fx.loy && Array.isArray(G.dis36)) { G.dis36.forEach(d => { d.loy = Math.max(0, Math.min(100, (d.loy || 50) + fx.loy)); }); out.push(`弟子忠诚${fx.loy >= 0 ? '+' : ''}${fx.loy}`); }
    if (fx.clan) { S.clan = (S.clan || 0) + fx.clan; out.push(`族人好感${fx.clan >= 0 ? '+' : ''}${fx.clan}`); }
    if (fx.zj) { S.zjB = Math.round(((S.zjB || 0) + fx.zj) * 100) / 100; out.push(`族人筑基机会 +${Math.round(fx.zj * 100)}%`); }
    if (fx.later) { S.later.push({ k: fx.later.k, n: fx.later.n, y: this.yr(G) }); out.push('（日后见分晓）'); }
    if (fx.fight) {
      const mi = (typeof MAPINFO !== 'undefined' && MAPINFO[(typeof R !== 'undefined' && R.mapId) || 'village']) || {}; const mons = mi.mons || []; let res = null;
      if (mons.length && typeof Game.fight === 'function') { const r = await Game.fight(mons[mons.length - 1], { tier: (G.realm || 0) + (G.stage || 0) * 0.2 + 0.3 }); res = r && r.res; }
      if (res === 'win') { const g = S.merchant ? 0 : Game.addExp(Game.need() * 0.05, true); out.push(`击退来敌，修为+${fmt(g || 0)}`); }
      else { if (G.dead) return out; const d = Math.round((G.stone || 0) * 0.1); G.stone -= d; out.push(`落败，灵石-${d}`); }
    }
    return out;
  },
  // 过年结算（年终）：积分、被动、延迟后果、放贷、行商、子嗣筑基、提示卡、专属事件
  async yearTick(rnd) {
    rnd = rnd || Math.random; const G = this.G(); const S = this.st(G); if (!G || G.dead || !S) return null; const y = this.yr(G); const res = { pts: 0, msgs: [], ev: null };
    // 延迟后果（任何路线下都结算，已经许下的事要兑现）
    for (const L of S.later.slice()) {
      const age = y - L.y;
      if (L.k === 'tian') { if (age >= 1 && age <= 3) { Game.give('herb', 2); res.msgs.push('灵田收成：灵草×2'); } if (age >= 3) S.later.splice(S.later.indexOf(L), 1); }
      else if (L.k === 'tun') { if (age >= 1) { const v = rnd() < 0.5 ? 4000 : 1200; G.stone += v; res.msgs.push(`囤的灵草出手：+${v} 灵石`); S.later.splice(S.later.indexOf(L), 1); } }
      else if (L.k === 'she') { if (age >= 5) { if (rnd() < 0.4) { G.stone += 3000; res.msgs.push('赊账的金丹修士回来了：还你 3000 灵石'); } else res.msgs.push('赊账的金丹修士……没回来。'); S.later.splice(S.later.indexOf(L), 1); } }
      else if (L.k === 'xue') { if (S.id !== 'shijia') { S.later.splice(S.later.indexOf(L), 1); continue; } if ((G.stone || 0) >= 600) { G.stone -= 600; S.xue = 1; res.msgs.push('族学开销 −600 灵石'); } else { S.xue = 0; res.msgs.push('灵石不够，族学停了一年'); } }
    }
    // 放贷（离开商贾后已借出的照样收）
    for (const Ln of S.loans.slice()) {
      const C = this.T.loan[Ln.who]; if (!C) { S.loans.splice(S.loans.indexOf(Ln), 1); continue; }
      if (this.dead(Ln.who)) { S.loans.splice(S.loans.indexOf(Ln), 1); res.msgs.push(`${this.nm(Ln.who)}已陨落，借出的 ${fmt(Ln.amt)} 灵石全额违约`); UI.toast(`⚠ ${this.nm(Ln.who)}陨落：放贷全额违约`, '#ff8a8a'); this.news(`${this.nm(Ln.who)}陨落，欠你的 ${fmt(Ln.amt)} 灵石成了坏账。`); continue; }
      if (rnd() < C.def) {
        const back = Math.round(Ln.amt * C.back); G.stone += back; S.loans.splice(S.loans.indexOf(Ln), 1); res.msgs.push(`${this.nm(Ln.who)}违约：只还回 ${fmt(back)} 灵石`); this.news(`${this.nm(Ln.who)}还不上钱，只还回 ${fmt(back)} 灵石。`);
        if (Ln.who === 'jh_tieguo') { G.aff.jh_tieguo = Math.max(0, (G.aff.jh_tieguo || 0) - 10); Game.give('herb', 1); res.msgs.push('赵铁锅过意不去，塞给你一把灵草'); }
        if (Ln.who === 'jh_xunbao' && rnd() < 0.3) { res.msgs.push('钱满仓留下一张藏宝图残页（奇遇线索）'); G.flags = G.flags || {}; G.flags.r37_xunbao_clue = 1; }
        continue;
      }
      const int = Math.round(Ln.amt * C.rate); G.stone += int; res.msgs.push(`${this.nm(Ln.who)}付息 ${fmt(int)}`);
      if (y - Ln.y >= this.T.loan.term) { G.stone += Ln.amt; S.loans.splice(S.loans.indexOf(Ln), 1); res.msgs.push(`${this.nm(Ln.who)}到期还本 ${fmt(Ln.amt)}`); }
    }
    // 行商（投入在年终结算）
    if (S.trade && S.trade.y < y) { const T = S.trade; const m = rnd() < 0.1 ? 0.7 : 1.1 + rnd() * 0.6; const back = Math.round(T.amt * m) + 200; G.stone += back; res.msgs.push(m < 1 ? `行商路上遇到劫道的：只带回 ${fmt(back)} 灵石` : `行商归来：带回 ${fmt(back)} 灵石（本金 ${fmt(T.amt)}）`); S.trade = null; }
    if (S.debtPct && G.debt > 0) { const d = Math.ceil(G.debt * S.debtPct); G.debt += d; res.msgs.push(`催收使加收利息 ${d}`); } S.debtPct = 0;
    const id = S.id;
    if (id) {
      let p = this.T.yearPts[id] || 0;
      if (id === 'sanxiu') { const n = this.chainsDone(G); if (S.chainN == null) S.chainN = n; if (n > S.chainN) p += 5 * (n - S.chainN); S.chainN = n; }
      if (id === 'moxiu') { G.karma = (G.karma || 0) - 2; this.repAdd(S, 'qingyun', -3); this.repAdd(S, 'baicao', -3); }
      if (id === 'zhangmen') { const w = (G.war && G.war.wins) || 0; if (S.warN == null) S.warN = w; if (w > S.warN) p += 6 * (w - S.warN); S.warN = w; }
      if (id === 'shangjia') { if (S.stone0 == null) S.stone0 = G.stone; const gain = Math.floor(Math.max(0, G.stone - S.stone0) / 10000); if (gain > 0) { p += gain; S.stone0 += gain * 10000; } if (S.life < 20) { S.life++; G.lifeBonus = (G.lifeBonus || 0) + 1; res.msgs.push('生意人心宽体胖：寿元 +1'); } }
      if (id === 'shijia') { for (const k of this.kids(G)) { const age = y - (k.born || 0); if (k.r37zj || k.dead || age < 16) continue; const rank = typeof FAM37 !== 'undefined' ? FAM37.rankOf(k.lg) : 3; const pz = 0.04 + rank * 0.04 + (S.zjB || 0) + (S.xue ? 0.05 : 0); if (rnd() < pz) { k.r37zj = 1; p += 4; res.msgs.push(`族人${k.n}筑基成功！`); } } }
      S.pts += p; res.pts = p;
    }
    if (res.msgs.length) UI.toast(res.msgs.slice(0, 3).join('；'), '#c8a0ff');
    if (!this.autoOn() && this.idleYE()) { await this.tips(G, S); if (id && rnd() < this.T.evtP[id]) res.ev = await this.runEvent(id, null, rnd); }
    return res;
  },
  // 年终弹卡守卫（同 npc37.idle）：战斗中 / 寻路中不弹
  idleYE() { if (typeof B !== 'undefined' && B && B.on) return false; if (typeof R !== 'undefined' && R && R.player && R.player.nav) return false; return true; },
  news(s) { try { const G = this.G(); if (typeof JH34 !== 'undefined' && JH34.say && JH34.ensure && G) JH34.say(JH34.ensure(G), s, 'route37', false); } catch (e) { console.warn('route37 news', e); } },
  tipList(G, S) {
    const out = []; const id = S.id;
    if (id === 'sanxiu') { const n = this.chainsDone(G); if (n >= 2) out.push(['r37_xiaoyao', 0]); if ((G.realm || 0) >= 4 && n >= 4 && (G.debt || 0) > 0) out.push(['r37_xiaoyao', 1]); }
    if (id === 'moxiu') { if (S.kills >= 1) out.push(['r37_mojun', 0]); if (S.kills >= 3 && (S.rep.tianmo || 0) < 60) out.push(['r37_mojun', 1]); }
    if (id === 'shangjia') { if (G.stone >= 300000) out.push(['r37_fujia', 0]); if (G.stone >= 800000) out.push(['r37_fujia', 1]); }
    if (id === 'shijia') { const z = this.zjCount(G) - ((G.realm || 0) >= 2 ? 1 : 0); if (z >= 1) out.push(['r37_shijia', 0]); if (z >= 2) out.push(['r37_shijia', 1]); }
    if (id === 'zhangmen') { const w = (G.war && G.war.wins) || 0; if (w >= 1) out.push(['zhangmen', 0]); if (w >= 2) out.push(['zhangmen', 1]); }
    return out.filter(([k, i]) => !S.tip[k + '_' + i]);
  },
  async tips(G, S) {
    for (const [k, i] of this.tipList(G, S)) { S.tip[k + '_' + i] = 1; const w = this.END[k] ? this.where(k) : 'elder'; await UI.card('⚑ 前路', this.T.tips[k][i], NPCS[w] ? NPCS[w].por : 'i:scroll', ['记下了']); }
  },
  async runEvent(id, ix, rnd) {
    rnd = rnd || Math.random; const G = this.G(); const L = this.EV[id]; if (!L) return null; const E = L[ix != null ? ix : Math.floor(rnd() * L.length) % L.length];
    const opts = [E[2], E[3]].map(([t, fx]) => (this.canFx(G, fx) ? t : '🔒' + t));
    let c = await UI.card('⚑ ' + E[0], E[1], 'i:scroll', opts); if (c !== 0 && c !== 1) c = 1;
    if (!this.canFx(G, E[2 + c][1])) c = c === 0 ? 1 : 0; if (!this.canFx(G, E[2 + c][1])) return { id, t: E[0], c: -1 };
    const out = await this.applyFx(E[2 + c][1], rnd); if (out.length) UI.toast(out.join('，'), '#c8a0ff');
    const S = this.mk(G); S.ev = (S.ev || 0) + 1; return { id, t: E[0], c, out };
  },
  // 结局
  check(eid, G) {
    G = G || this.G(); const S = this.st(G); if (!G || !S || !this.END[eid] || S.id !== this.END[eid].r) return false;
    if (eid === 'r37_xiaoyao') return (G.realm || 0) >= 4 && this.chainsDone(G) >= 4 && (G.debt || 0) <= 0;
    if (eid === 'r37_mojun') return S.kills >= 3 && (S.rep.tianmo || 0) >= 60;
    if (eid === 'r37_fujia') return (G.stone || 0) >= 1000000;
    if (eid === 'r37_shijia') return this.zjCount(G) >= 3;
    return false;
  },
  ready() { const G = this.G(); if (!G || G.dead) return null; return Object.keys(this.END).find(e => this.check(e, G)) || null; },
  async endNow(eid) { const c = await UI.card('⚑ 大结局·' + this.T.endings[eid][0], '此生就此落幕？', 'i:scroll', ['落幕（结局）', '再想想']); if (c === 0) { await Game.die(eid); return true; } return false; },
  // 魔修：仇杀正道 NPC（每人每年 1 次）
  async duel(id, rnd) {
    const G = this.G(); const S = this.mk(G); const y = this.yr(G); if (S.kmo[id] === y) { UI.toast('今年已经找过他了'); return null; } S.kmo[id] = y;
    let res = 'lose';
    if (typeof Game.fight === 'function') { const mi = (typeof MAPINFO !== 'undefined' && MAPINFO[(typeof R !== 'undefined' && R.mapId) || 'village']) || MAPINFO.village; const mons = (mi && mi.mons) || []; const r = mons.length ? await Game.fight(mons[mons.length - 1], { tier: (G.realm || 0) + (G.stage || 0) * 0.2 + 0.5 }) : null; res = (r && r.res) || 'lose'; }
    if (rnd && !Game.fight) res = rnd() < 0.5 ? 'win' : 'lose';
    if (res === 'win') { S.kills++; S.pts += 8; this.repAdd(S, 'tianmo', 8); G.karma = (G.karma || 0) - 5; G.aff[id] = Math.max(0, (G.aff[id] || 0) - 30); UI.toast(`你击败了${this.nm(id)}（正道 ${S.kills}）：天魔殿声望 +8`, '#ff7a9a'); this.news(`魔修击败了正道${this.nm(id)}，天魔殿记了一功。`); }
    else UI.toast(`${this.nm(id)}全身而退，你没讨到便宜`);
    if (Game.save) Game.save(); return res;
  },
  // 商贾：行商 / 放贷
  trade(frac) { const G = this.G(); const S = this.mk(G); if (S.id !== 'shangjia') return false; if (S.trade) { UI.toast('这一年的货已经发出去了'); return false; } const amt = Math.floor((G.stone || 0) * (frac || 1)); if (amt < 100) { UI.toast('本钱太少（至少 100 灵石）'); return false; } G.stone -= amt; S.trade = { amt, y: this.yr(G) }; UI.toast(`你押了 ${fmt(amt)} 灵石的货，年底见分晓`, '#ffd23a'); Game.save(); return true; },
  canLoan(who, G) { G = G || this.G(); const S = this.st(G); if (!S || S.id !== 'shangjia') return '只有凡人商贾能放贷'; if (S.loans.length >= this.T.loan.maxLoans) return `同时最多 ${this.T.loan.maxLoans} 笔`; if (S.loans.some(l => l.who === who)) return '他还欠着你一笔'; if (this.dead(who)) return '此人已陨落'; const C = this.T.loan[who]; if ((G.stone || 0) < C.min) return `本钱不够（至少 ${fmt(C.min)}）`; return null; },
  loan(who, amt) { const G = this.G(); const l = this.canLoan(who, G); if (l) { UI.toast('🔒 ' + l); return false; } const C = this.T.loan[who]; amt = Math.max(C.min, Math.min(C.max, Math.round(amt || C.min), G.stone)); G.stone -= amt; this.mk(G).loans.push({ who, amt, y: this.yr(G) }); UI.toast(`借给${this.nm(who)} ${fmt(amt)} 灵石，年息 ${Math.round(C.rate * 100)}%，三年还本`, '#ffd23a'); Game.save(); return true; },
  quitSect() { const G = this.G(); if (!G.sect || G.sectLeader) return false; G.flags = G.flags || {}; G.flags.r37_quit = G.sect; G.sect = null; G.contrib = 0; if (Game.save) Game.save(); return true; },
  html() {
    const G = this.G(); const S = this.st(G) || { id: null, pts: 0, hist: [], rep: {}, loans: [], kills: 0, dx: 0 }; const y = this.yr(G);
    let h = `<div class="r37"><b>道途</b><p>${S.id ? `当前：<b>${this.n(S.id)}</b>（${this.title(S)}，积分 ${S.pts}，已走 ${y - (S.since || 0)} 年）` : '你还没有选定道途。选一条路，不做主线也能走到结局。'}</p>`;
    if (S.dx) h += `<p><small>道心 ${S.dx}</small></p>`;
    const ll = this.leaveLock(G);
    h += this.IDS.map(id => { const lk = this.lock(id, G); const on = S.id === id; const dis = on || !!lk || (S.id && ll); const why = on ? '（当前）' : lk ? '🔒 ' + lk : (S.id && ll) ? '🔒 ' + ll : ''; return `<div class="r37r"><button class="opt" data-r="pick" data-id="${id}"${dis ? ' disabled' : ''}>${this.n(id)}</button><small>${esc(why)}</small></div>`; }).join('');
    if (S.id) h += `<div class="r37r"><button class="opt" data-r="leave"${ll ? ' disabled' : ''}>退出道途</button><small>${ll ? '🔒 ' + esc(ll) : '换路线后积分清零，已得结局不丢'}</small></div>`;
    if (G.sect && !G.sectLeader) h += `<div class="r37r"><button class="opt" data-r="quit">退出宗门（${SECTS[G.sect] ? SECTS[G.sect].n : G.sect}）</button><small>贡献清零，功法保留；退宗后可走散修</small></div>`;
    if (S.id === 'moxiu') h += `<p><small>已击败正道 ${S.kills} 人；天魔殿声望 ${S.rep.tianmo || 0}/60。在萧十三、燕归、丹娘处可「⚔ 仇杀」。</small></p>`;
    if (S.id === 'shangjia') {
      h += `<p><b>生意</b>　灵石 ${fmt(G.stone)} / 100万</p>` + (S.trade ? `<p><small>今年押货 ${fmt(S.trade.amt)}，年底结算</small></p>` : `<div class="r37r"><button class="opt" data-r="trade" data-f="0.5">行商（押一半灵石）</button><button class="opt" data-r="trade" data-f="1">行商（押全部）</button></div>`);
      h += Object.keys(this.T.loan).filter(k => this.T.loan[k].min).map(w => { const C = this.T.loan[w]; const l = this.canLoan(w, G); return `<div class="r37r"><button class="opt" data-r="loan" data-w="${w}"${l ? ' disabled' : ''}>借给${this.nm(w)}</button><small>${fmt(C.min)}–${fmt(C.max)}，年息 ${Math.round(C.rate * 100)}%，违约率 ${Math.round(C.def * 100)}%${l ? '　🔒 ' + esc(l) : ''}</small></div>`; }).join('');
      if (S.loans.length) h += '<p><small>' + S.loans.map(l => `${this.nm(l.who)} 欠 ${fmt(l.amt)}（${y - l.y}/3 年）`).join('；') + '</small></p>';
    }
    if (S.id === 'shijia') h += `<p><small>族中筑基 ${this.zjCount(G)}/3（含你本人）</small></p>`;
    if (S.hist.length) h += '<p><small>走过：' + S.hist.map(x => `${this.n(x.id)} ${x.pts} 分`).join('、') + '</small></p>';
    const e = this.ready(); if (e) h += `<p style="color:#ffd23a">⚑ 大结局「${this.T.endings[e][0]}」已可达成：去找${this.nm(this.where(e))}。</p>`;
    return h + '</div>';
  },
  async onClick(t, b) {
    const r = t.dataset.r;
    if (r === 'pick') await this.choose(t.dataset.id);
    if (r === 'leave') await this.choose(null);
    if (r === 'quit') { const c = await UI.card('退出宗门', '退宗后宗门贡献清零，功法保留。确定？', 'i:scroll', ['退宗', '算了']); if (c === 0) { this.quitSect(); UI.toast('你退出了宗门'); } }
    if (r === 'trade') this.trade(+t.dataset.f);
    if (r === 'loan') { const w = t.dataset.w; const C = this.T.loan[w]; const G = this.G(); const am = [C.min, Math.round((C.min + C.max) / 2), C.max].filter(a => a <= G.stone); const c = await UI.card('放贷', `借给${this.nm(w)}多少？（三年还本，每年付息 ${Math.round(C.rate * 100)}%，违约率 ${Math.round(C.def * 100)}%）`, NPCS[w] ? NPCS[w].por : 'npc_merchant', am.map(a => fmt(a)).concat(['算了'])); if (c >= 0 && c < am.length) this.loan(w, am[c]); }
    if (b) b.innerHTML = this.html();
  },
};
window.Route37 = Route37;
(function () {
  Object.assign(ENDINGS, TEXT374.endings);
  // 修为倍率：魔修 ×1.15（回头是岸当年失效）；商贾（含已弃仙）×0
  const _cm = Game.cultMult; Game.cultMult = function () { const m = _cm.apply(this, arguments); const S = Route37.st(this.G); if (!S) return m; if (S.merchant) return 0; if (S.id === 'moxiu' && !(S.noBonus && S.noBonus > Route37.yr(this.G))) return m * 1.15; return m; };
  const _tb = Game._tryBreak; Game._tryBreak = async function () { const S = Route37.st(this.G); if (S && S.merchant) { UI.toast('你已是生意人，不再冲击瓶颈'); return; } return _tb.apply(this, arguments); };
  // 路线结局：结算分 +15（Game.die 公式含 achNew×5）
  const _die = Game.die; Game.die = function (kind) { const G = this.G; if (G && !G.dead && typeof kind === 'string' && kind.indexOf('r37_') === 0) G.achNew = (G.achNew || 0) + TEXT374.endingBonusPts / 5; return _die.apply(this, arguments); };
  // 掌门：记名弟子名额 +1（封顶 6）；家族：子嗣灵根取两次中较好的一次
  if (typeof FAM37 !== 'undefined') {
    const _cap = FAM37.cap; FAM37.cap = function (G) { const c = _cap.apply(this, arguments); G = G || this.G(); return Route37.cur(G) === 'zhangmen' ? Math.min(6, c + 1) : c; };
    const _ih = FAM37.inheritLg; FAM37.inheritLg = function (a, b, rnd) { const x = _ih.apply(this, arguments); if (Route37.cur() !== 'shijia') return x; const y = _ih.apply(this, arguments); return FAM37.rankOf(y.lg) > FAM37.rankOf(x.lg) ? y : x; };
  }
  // 对话：路线结局入口 + 魔修仇杀
  const _ex = Talk.extra;
  Talk.extra = function (id) {
    const out = _ex ? _ex.call(this, id) : []; const G = Game.G; if (!G || G.dead) return out; const S = Route37.st(G); if (!S || !S.id) return out;
    const e = Route37.ready(); if (e && Route37.where(e) === id) out.push([`⚑ 大结局·${TEXT374.endings[e][0]}`, async () => { await Route37.endNow(e); }]);
    if (S.id === 'moxiu' && Route37.ZHENG.includes(id) && !Route37.dead(id)) out.push(['⚑ ⚔ 仇杀（魔修）', async () => { await Route37.duel(id); }]);
    return out;
  };
  const _ye = Game.yearEnd; Game.yearEnd = async function () {
    const G = this.G; const y0 = G && G.year; const r = await _ye.apply(this, arguments);
    if (G && !G.dead && G.year !== y0 && G.route37) { try { await Route37.yearTick(); Game.save(); } catch (e) { console.warn('route37', e); } }
    return r;
  };
  function install() {
    if (typeof UI === 'undefined' || !UI.p_more || !UI.titles) { setTimeout(install, 300); return; }
    UI.titles.route37 = '道途';
    UI.p_route37 = function (b) { b.innerHTML = Route37.html(); b.onclick = async e => { const t = e.target.closest('button[data-r]'); if (t && !t.disabled) { if (typeof Sfx !== 'undefined') Sfx.play('click'); await Route37.onClick(t, b); } }; };
    const _more = UI.p_more;
    UI.p_more = function (b, re, close) {
      _more.apply(this, arguments);
      const g = b.querySelector('.grid3') || b.querySelector('.grid2') || b; if (g.querySelector('[data-k="route37"]')) return;
      const btn = document.createElement('button'); btn.className = 'big2'; btn.setAttribute('data-k', 'route37');
      btn.innerHTML = '<i style="' + iconCss('scroll', 48) + '"></i>道途'; g.appendChild(btn);
    };
  }
  install();
  if (window.DevPanel && DevPanel.registerTab) DevPanel.registerTab('route37', '道途37', (box, ctx) => {
    box.innerHTML = ['k60:善恶 −60（可入魔）', 'k0:善恶 0', 'mortal:凡人 30 岁', 'kid:生 1 个子嗣（需道侣）', 'cd:路线冷却清零', 'm100:灵石 +100 万', 'kill:魔修击杀 +1、天魔殿 +30', 'zj:子嗣全部筑基', 'ch4:奇遇链完成 4 条', 'year:路线年结算', 'ev:触发本路线事件', 'open:打开道途面板'].map(x => `<button class="opt" data-x="${x.split(':')[0]}">${x.split(':')[1]}</button>`).join('');
    box.onclick = async e => { const x = e.target.dataset.x; const G = Game.G; if (!x || !G) return; const S = Route37.mk(G);
      if (x === 'k60') G.karma = -60; if (x === 'k0') G.karma = 0;
      if (x === 'mortal') { G.realm = 0; G.age = Math.max(30, G.age); }
      if (x === 'kid' && typeof FAM37 !== 'undefined') { FAM37.ensure(G); if (!G.fam37.sp) G.fam37.sp = G.partner || 'sumei'; FAM37.birth(); }
      if (x === 'cd') S.since = Route37.yr(G) - 10;
      if (x === 'm100') G.stone += 1000000;
      if (x === 'kill') { S.kills++; Route37.repAdd(S, 'tianmo', 30); }
      if (x === 'zj') Route37.kids(G).forEach(k => { k.r37zj = 1; });
      if (x === 'ch4' && typeof JH34 !== 'undefined') { const L = JH34.ensure(G); ['d1', 'd2', 'd3', 'd4'].forEach(k => { L.ch['r37dev_' + k] = { s: 0, done: 1 }; }); }
      if (x === 'year') ctx.toast('积分 +' + ((await Route37.yearTick()) || {}).pts);
      if (x === 'ev' && S.id) await Route37.runEvent(S.id);
      if (x === 'open') UI.panel('route37');
      ctx.save(); };
  });
  const css = document.createElement('style');
  css.textContent = '.r37{margin-top:6px;padding:10px;border-radius:10px;background:rgba(200,160,255,.10);border:1px solid rgba(200,160,255,.4)}.r37>b{display:block;font-size:16px;color:#d8b8ff}.r37 p{margin:4px 0}.r37r{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:6px 0}.r37r small{opacity:.85;flex:1 1 100%}';
  document.head.appendChild(css);
})();

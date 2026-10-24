// TEXT38A：由 tools/gen_pf38.py 从 docs/research_v38_profile.md §8 生成
const TEXT38A = {"persona": {"mom": "唠叨·护短", "farmer": "憨厚·记仇", "cuihua": "泼辣·心软", "mentor": "颓废·傲骨", "villager": "嘴碎·八卦", "elder": "老成·算计", "sister": "认真·嘴硬", "xiaoyi": "清高·好面子", "danlao": "抠门·技痴", "merchant": "贪财·识时务", "yaopu": "谨慎·心善", "shuoshu": "机灵·胆小", "fisherm": "佛系·执拗", "ali": "狡黠·重情", "lost": "迷糊·乐观", "keeper": "沉默·念旧", "aoxiao": "娇蛮·天真", "guzhu": "淡泊·护短", "fisher2": "孤僻·通透", "sumei": "精明·玩世", "moguard": "刻板·忠心", "xianguan": "较真·社畜", "caishen": "大方·记账", "zhuiming": "冷面·守规", "_pool": ["豪爽", "阴郁", "贪婪", "正直", "多疑", "懒散", "痴情", "暴躁", "温吞", "毒舌"]}, "mg": [{"id": "n_tiansha", "n": "天煞孤星", "q": 2, "d": "克亲近之人：与其结为道侣/收为弟子，每年 5% 发生一次小灾（-灵石）。", "fx": {"famBad": 0.05}, "fl": "他身边的人都过得不太好，除了他自己。"}, {"id": "n_wenqu", "n": "文曲照命", "q": 1, "d": "作为弟子/子嗣：修炼经验 +15%。", "fx": {"disXp": 0.15}, "fl": "三岁背功法，五岁改功法，七岁被功法作者追杀。"}, {"id": "n_wuqu", "n": "武曲临身", "q": 1, "d": "作为伙伴/道侣参战：攻击 +8%。", "fx": {"compAtk": 0.08}, "fl": "走路带风，吃饭带刀。"}, {"id": "n_tianxi", "n": "红鸾天喜", "q": 1, "d": "好感获取 +25%；婚配成功率 +15%。", "fx": {"affGain": 0.25, "match": 0.15}, "fl": "桃花多到需要请人看门。"}, {"id": "n_pocai", "n": "破财星", "q": 0, "d": "成为家族成员后，族产年产 -5%。", "fx": {"yield": -0.05}, "fl": "钱袋子漏的不是钱，是命。"}, {"id": "n_jucai", "n": "聚财星", "q": 1, "d": "成为家族成员后，族产年产 +8%。", "fx": {"yield": 0.08}, "fl": "他捡的钱比赚的多。"}, {"id": "n_changsheng", "n": "长生骨", "q": 1, "d": "寿元 +20%（作为子嗣/弟子时延缓衰老）。", "fx": {"life": 0.2}, "fl": "八十岁了还被当成你孙子。"}, {"id": "n_duanming", "n": "短命相", "q": 0, "d": "寿元 -15%，但修炼 +10%（燃烧型）。", "fx": {"life": -0.15, "disXp": 0.1}, "fl": "活得快，也活得猛。"}, {"id": "n_guiren", "n": "贵人命", "q": 1, "d": "与之 rel≥40 时，每年 10% 带来机缘（随机道具）。", "fx": {"gift": 0.1}, "fl": "他不发财，但他身边的人都发了。"}, {"id": "n_xiaoren", "n": "小人缠身", "q": 0, "d": "与之交好会招来仇家：npc37 仇档路遇 +10%。", "fx": {"foe": 0.1}, "fl": "朋友不多，背后说他坏话的人很多。"}, {"id": "n_tianlei", "n": "引雷体", "q": 1, "d": "渡劫时在场护法：玩家渡劫成功率 +3%。", "fx": {"brk": 0.03}, "fl": "雷雨天千万别和他站一起。"}, {"id": "n_mozhong", "n": "魔种暗藏", "q": 2, "d": "真实好感波动 ×2；karma≤-30 时有 20% 叛离。", "fx": {"betray": 0.2}, "fl": "笑得越甜，心里的魔越大。"}, {"id": "n_fuxing", "n": "福星高照", "q": 1, "d": "家族事件好结果概率 +10%。", "fx": {"evLuck": 0.1}, "fl": "摔进粪坑都能摸出一块玉。"}, {"id": "n_zhuxian", "n": "诛仙剑胚", "q": 2, "d": "子嗣/弟子：剑系技能伤害 +12%，灵根上调 +10%。", "fx": {"kidLg": 0.1}, "fl": "出生那天，方圆百里的剑都在鸣。"}, {"id": "n_qiongxiang", "n": "穷鬼相", "q": 0, "d": "无任何坏处，就是穷。送礼收益 +5（同情分）。", "fx": {"giftAff": 5}, "fl": "天道都懒得向他催债。"}, {"id": "n_tiandao", "n": "天道记名", "q": 2, "d": "天道欠款利率 -5%（作为道侣时）；但天道会关注你的家族。", "fx": {"debtRate": -0.05}, "fl": "讨债司的名册上，他的名字被红笔圈了一圈——不是欠债，是VIP。"}], "fixed": {"mom": {"lg": "wu", "mg": "n_fuxing", "taff": 30, "sec": [{"n": "那张借据", "d": "娘年轻时替你那素未谋面的爹画过押。祖传的债，最早是她签的字。", "on": "flag:pf_mom_debt;karma+3", "opt": "问娘当年的事"}]}, "farmer": {"lg": "si", "mg": "n_qiongxiang", "taff": 5, "sec": [{"n": "屋后的坟", "d": "王大爷屋后那座无名坟，埋的是他当年的修仙同伴——被他亲手推下悬崖的那个。", "on": "karma-2;flag:pf_farmer_grave", "opt": "替他上一炷香"}]}, "cuihua": {"lg": "san", "mg": "n_tianxi", "taff": 15, "sec": [{"n": "绣荷包", "d": "她绣了七个荷包，一个都没送出去，全是你的名字。", "on": "aff:cuihua:10"}, {"n": "被退的婚书", "d": "钱多多曾上门提亲，被她用扫帚打了出去。钱多多至今记仇。", "on": "flag:pf_cuihua_qian"}]}, "mentor": {"lg": "tian", "mg": "n_zhuxian", "taff": 20, "sec": [{"n": "断剑之名", "d": "他曾是剑道魁首，一剑劈开过讨债司的大门。剑断那天，他背上了比你还多的债。", "on": "item:scroll:1"}, {"n": "另一半剑", "d": "断剑的另一半在天庭。仙官记账童子知道在哪个仓库。", "on": "flag:pf_mentor_sword", "opt": "追问断剑下落"}]}, "elder": {"lg": "shuang", "mg": "n_tiandao", "taff": -20, "sec": [{"n": "宗门账本", "d": "掌门把青云宗一半的灵脉抵押给了天道讨债司。", "on": "flag:pf_elder_mortgage;stone+300"}, {"n": "继任人选", "d": "他心里的继任者从来不是你，是萧逸。", "on": "aff:xiaoyi:-5"}]}, "sister": {"lg": "shuang", "mg": "n_wuqu", "taff": 25, "sec": [{"n": "夜练", "d": "她每晚偷偷加练两个时辰，只为了小比时不输给你。", "on": "aff:sister:5"}, {"n": "师门旧案", "d": "她亲眼看见了当年黑心长老做的事，却一直没说。", "on": "flag:pf_sister_case", "opt": "劝她说出来"}]}, "xiaoyi": {"lg": "tian", "mg": "n_wenqu", "taff": -15, "sec": [{"n": "嫉妒", "d": "他在你的茶里下过一次泻药。就一次，他发誓。", "on": "aff:xiaoyi:5;karma+1"}]}, "danlao": {"lg": "san", "mg": "n_jucai", "taff": 0, "sec": [{"n": "私房丹", "d": "丹房后墙第三块砖后面，藏着他三百年的私房丹。", "on": "item:pyd:2;aff:danlao:-10"}]}, "merchant": {"lg": "si", "mg": "n_jucai", "taff": -30, "sec": [{"n": "假秤", "d": "他的秤每两少一钱。全市场都知道，只有他以为没人知道。", "on": "flag:pf_qian_scale"}, {"n": "债主名单", "d": "钱多多也欠天道的债，而且比你多三倍。", "on": "flag:pf_qian_debt;stone+200"}]}, "yaopu": {"lg": "san", "mg": "n_changsheng", "taff": 10, "sec": [{"n": "赊账簿", "d": "他给穷人赊药从来不记账，那本账簿是空的。", "on": "karma+3"}]}, "fisherm": {"lg": "wu", "mg": "n_guiren", "taff": 10, "sec": [{"n": "钓的不是鱼", "d": "他在等一条三千年前跑掉的龙鲤。那条鱼欠他一句道歉。", "on": "item:fish:2"}]}, "ali": {"lg": "bing", "mg": "n_tianxi", "taff": 30, "sec": [{"n": "第九条尾巴", "d": "她其实有九尾，第九条押在鬼市当了灵石。", "on": "flag:pf_ali_tail", "opt": "替她赎回尾巴"}, {"n": "前世", "d": "她前世被一个修士所救，那人的样貌和你一模一样。", "on": "aff:ali:10"}]}, "keeper": {"lg": "none", "mg": "n_changsheng", "taff": 10, "sec": [{"n": "守的是谁", "d": "他守的墓里没有尸骨，只有一块写着你名字的灵牌。", "on": "flag:pf_keeper_tablet;karma+1"}]}, "aoxiao": {"lg": "shuang", "mg": "n_tianlei", "taff": 20, "sec": [{"n": "离家出走", "d": "她是偷跑出龙宫的，龙王悬赏一万灵石找她。", "on": "flag:pf_aoxiao_run", "opt": "要不要领赏（karma-10）"}, {"n": "逆鳞", "d": "她把逆鳞藏在你送的礼物盒里。", "on": "aff:aoxiao:8"}]}, "guzhu": {"lg": "tian", "mg": "n_changsheng", "taff": 5, "sec": [{"n": "百草名录", "d": "谷中有一株草从不开花，那是她给夭折的女儿种的。", "on": "item:herb:5;karma+1"}]}, "sumei": {"lg": "shuang", "mg": "n_mozhong", "taff": -10, "sec": [{"n": "放贷人", "d": "魔殿的高利贷生意，背后的老板就是她。", "on": "flag:pf_sumei_loan"}, {"n": "唯一的真话", "d": "她说过一句真话：「我不想再算计你了。」你当时以为是玩笑。", "on": "aff:sumei:12"}]}, "xianguan": {"lg": "san", "mg": "n_tiandao", "taff": 0, "sec": [{"n": "抹账", "d": "他每年偷偷抹掉一笔穷鬼的坏账，已经抹了三百年。", "on": "flag:pf_xg_wipe", "opt": "求他抹一笔（debt -5%）"}]}, "caishen": {"lg": "tian", "mg": "n_jucai", "taff": 0, "sec": [{"n": "财神也借钱", "d": "财神的钱是向天道借的。三界的钱，都是。", "on": "flag:pf_caishen_loan"}]}, "ruyan": {"lg": "tian", "mg": "n_wuqu", "taff": 15, "sec": [{"n": "剑冢之约", "d": "她在剑冢立过誓：嫁给第一个接下她三剑的人。", "on": "flag:pf_ruyan_oath"}]}, "lengyue": {"lg": "bing", "mg": "n_tiansha", "taff": -5, "sec": [{"n": "冰封的人", "d": "她宫中冰封着一个人，那是她的师兄，也是她的心魔。", "on": "flag:pf_ly_ice"}]}}, "peek": {"ok": ["你神识轻探，{n}的识海如镜，{k}一览无余。", "一缕神识滑入，{n}毫无察觉。你看见了：{k}。"], "fail": ["{n}的识海翻起浪头，你的神识被拍了回来。", "窥探失败。{n}打了个喷嚏，四下张望。"], "caught": ["“你在看什么？”{n}冷冷地盯着你。（好感 -8）", "{n}一把攥住你的神识：“再看，收费。”（好感 -8）"], "high": "对方神识如山，你连门都摸不到。", "cap": "今年神识已用尽，脑壳疼。"}, "ev": {"drift": ["{n}最近总是避着你。表面上一如往常，但你知道——有些东西变了。", "{n}笑着递来茶，茶是凉的。"]}, "lock": {"lg": "需神识·筑基中期，或好感≥80，或窥灵镜", "mg": "需神识·金丹后期，或好感≥120，或命盘残页", "taff": "需神识·元婴中期，或同心香，或结为道侣", "sec1": "需神识·化神初期，或好感≥130，或密信", "sec2": "需神识·渡劫初期，或好感满且关系≥80"}};
// ==== PF38 BODY ====
// 3.8.0 人物详情面板 PF38（设计稿 docs/research_v38_profile.md）。独立模块：只包裹 Talk.extra / UI.p_char / Game.yearEnd / FAM37.birth，
// 不改 game.js / talk.js / data.js；存档 G.pf38 惰性兜底，不升 G.v。TEXT38A 逐字来自设计稿 §8（tools/gen_pf38.py 生成，勿手改 JSON 段）。
const PF38 = {
  T: TEXT38A,
  // 命名 NPC 大境界（设计稿未给，按角色身份估：0 凡人 … 7 飞升）。待研究员确认。jh_* 读 G.jh34.npcs[id].realm。
  REALM: { mom: 0, farmer: 1, cuihua: 0, mentor: 6, villager: 0, elder: 3, sister: 2, xiaoyi: 2, danlao: 3, merchant: 1, yaopu: 1, shuoshu: 0, fisherm: 4, ali: 4, lost: 0, keeper: 3, aoxiao: 4, guzhu: 5, fisher2: 3, sumei: 4, moguard: 4, xianguan: 6, caishen: 7, zhuiming: 6, ruyan: 4, lengyue: 5 },
  // 隐藏项：神识门槛按设计稿的境界名（筑基中期/金丹后期/元婴中期/化神初期/渡劫初期）用 realm×4+stage 计算 = 9/14/17/20/24。
  // 注：设计稿 §3 表里写的数字 6/10/13/16/20 与同表境界名不一致（差一个大境界），这里以玩家看得见的境界名为准，待研究员确认。
  KEYS: [
    { k: 'lg', n: '隐藏灵根', ss: 2 * 4 + 1, lock: 'lg' },
    { k: 'mg', n: '命格', ss: 3 * 4 + 2, lock: 'mg' },
    { k: 'taff', n: '真实好感', ss: 4 * 4 + 1, lock: 'taff' },
    { k: 'sec0', n: '秘密①', ss: 5 * 4 + 0, lock: 'sec1' },
    { k: 'sec1', n: '秘密②', ss: 6 * 4 + 0, lock: 'sec2' },
  ],
  PEEK_MAX: 3,
  G() { return typeof Game !== 'undefined' ? Game.G : null; },
  ensure(G) {
    G = G || this.G(); if (!G) return null; let P = G.pf38;
    if (!P || typeof P !== 'object' || P.v !== 1) P = G.pf38 = { v: 1, seen: {}, hid: {}, peek: { yr: 0, n: 0 }, fail: {} };
    if (!P.seen || typeof P.seen !== 'object') P.seen = {}; if (!P.hid || typeof P.hid !== 'object') P.hid = {};
    if (!P.peek || typeof P.peek !== 'object') P.peek = { yr: 0, n: 0 }; if (!P.fail || typeof P.fail !== 'object') P.fail = {};
    if (P.peek.yr !== (G.year || 0)) P.peek = { yr: G.year || 0, n: 0 };
    return P;
  },
  hash(s) { let x = 2166136261; for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; } return x >>> 0; },
  rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; },
  // 隐藏数据：命名 NPC 取 TEXT38A.fixed；其余按 hash(npcId+G.name) 从池取，首次生成后存档固定
  hid(id, G) {
    G = G || this.G(); const P = this.ensure(G); if (!P) return null; if (P.hid[id]) return P.hid[id];
    const F = this.T.fixed[id]; let d;
    if (F) d = { lg: F.lg, mg: F.mg, taff: F.taff };
    else {
      const r = this.rng(this.hash(id + '|' + (G.name || ''))); let tot = 0; LINGGEN.forEach(l => { tot += l.w; }); let x = r() * tot, lg = 'san';
      for (const l of LINGGEN) { x -= l.w; if (x < 0) { lg = l.id; break; } }
      const mg = this.T.mg[Math.floor(r() * this.T.mg.length)].id; d = { lg, mg, taff: Math.round(-40 + r() * 70) };
    }
    return (P.hid[id] = d);
  },
  persona(id, G) { G = G || this.G(); const p = this.T.persona; if (p[id]) return p[id]; const pool = p._pool, r = this.rng(this.hash('p|' + id + '|' + ((G && G.name) || ''))); const a = Math.floor(r() * pool.length); let b = Math.floor(r() * (pool.length - 1)); if (b >= a) b++; return pool[a] + '·' + pool[b]; },
  secs(id) { const F = this.T.fixed[id]; return (F && F.sec) || []; },
  mgOf(id) { return this.T.mg.find(m => m.id === id) || null; },
  lgN(id) { const L = LINGGEN.find(l => l.id === id); return L ? L.n : id; },
  ss(G) { G = G || this.G(); if (!G) return 0; let s = (G.realm || 0) * 4 + (G.stage || 0); if (Array.isArray(G.mingge) && G.mingge.includes('wuxing')) s += 2; return s; },
  realmOf(id, G) { G = G || this.G(); const J = G && G.jh34 && G.jh34.npcs && G.jh34.npcs[id]; if (J && typeof J.realm === 'number') return J.realm; return id in this.REALM ? this.REALM[id] : 1; },
  aff(id, G) { G = G || this.G(); return (G && G.aff && G.aff[id]) || 0; },
  rel(id) { const L = typeof Life34 !== 'undefined' && Life34.st ? Life34.st() : null; return L && L.rel ? (L.rel[id] || 0) : 0; },
  isPartner(id, G) { G = G || this.G(); return !!G && (G.partner === id || (G.fam37 && G.fam37.sp === id)); },
  // 不靠神识的解锁（好感/道侣）。返回 true 表示对方主动告知
  byAff(id, k, G) {
    G = G || this.G(); const a = this.aff(id, G), r = this.rel(id);
    if (k === 'lg') return a >= 80; if (k === 'mg') return a >= 120;
    if (k === 'taff') return this.isPartner(id, G) || (r >= 60 && a >= 100);
    if (k === 'sec0') return a >= 130; if (k === 'sec1') return a >= 150 && r >= 80; return false;
  },
  has(id, k, G) {
    G = G || this.G(); const P = this.ensure(G); if (!P) return false; const s = P.seen[id] || {};
    if (k === 'sec0' || k === 'sec1') { const i = +k[3]; if (!this.secs(id)[i]) return false; return Array.isArray(s.sec) && s.sec.includes(i); }
    if (k === 'taff' && s.taffYr != null && s.taffYr === (G.year || 0)) return true; // 同心香：当年有效
    return !!s[k];
  },
  // 统一解锁入口（v40 道具 use:'peek' 也调这里）。opt.yr：仅当年有效（同心香）
  reveal(id, k, opt) {
    const G = this.G(); const P = this.ensure(G); if (!P) return false; opt = opt || {};
    if ((k === 'sec0' || k === 'sec1') && !this.secs(id)[+k[3]]) return false;
    if (this.has(id, k, G)) return false; const s = P.seen[id] || (P.seen[id] = {}); this.hid(id, G);
    if (k === 'sec0' || k === 'sec1') {
      const i = +k[3]; if (!Array.isArray(s.sec)) s.sec = []; s.sec.push(i); const S = this.secs(id)[i];
      if (S && S.on) { try { const r = Game.apply(S.on); if (r && r.catch) r.catch(e => console.warn('pf38 on', e)); } catch (e) { console.warn('pf38 on', e); } }
    } else if (k === 'taff' && opt.yr) s.taffYr = G.year || 0; else s[k] = 1;
    return true;
  },
  // 好感/道侣途径自动解锁（打开面板时同步，秘密的 on 也只结算一次）
  sync(id) { const G = this.G(); if (!G) return []; const got = []; for (const K of this.KEYS) if (!this.has(id, K.k, G) && this.byAff(id, K.k, G) && this.reveal(id, K.k)) got.push(K.k); return got; },
  // 下一个可窥探的隐藏项：未解锁、存在、神识够
  next(id, G) { G = G || this.G(); const s = this.ss(G); return this.KEYS.find(K => !this.has(id, K.k, G) && (K.k.startsWith('sec') ? !!this.secs(id)[+K.k[3]] : true) && s >= K.ss) || null; },
  canPeek(id) {
    const G = this.G(); const P = this.ensure(G); if (!P) return { ok: false, why: '' };
    if (this.realmOf(id, G) > (G.realm || 0)) return { ok: false, why: this.T.peek.high };
    if (P.peek.n >= this.PEEK_MAX) return { ok: false, why: this.T.peek.cap };
    if (P.fail[id] === (G.year || 0)) return { ok: false, why: '对方今年防着你，换个人看吧。' };
    const K = this.next(id, G); if (!K) { const L = this.KEYS.find(K2 => !this.has(id, K2.k, G) && (K2.k.startsWith('sec') ? !!this.secs(id)[+K2.k[3]] : true)); return { ok: false, why: L ? this.T.lock[L.lock] : '已经看透了。' }; }
    return { ok: true, K };
  },
  rate(id, K, G) { G = G || this.G(); let p = 0.55 + 0.05 * (this.ss(G) - K.ss); if ((G.karma || 0) >= 30) p -= 0.1; return Math.max(0.2, Math.min(0.95, p)); },
  fill(s, o) { return String(s).replace(/\{(\w+)\}/g, (m, k) => (o[k] != null ? o[k] : m)); },
  pick(a) { return a[Math.floor(Math.random() * a.length)]; },
  nm(id) { const N = typeof NPCS !== 'undefined' && NPCS[id]; return N ? N.n : id; },
  // 神识窥探：返回 {ok, k, caught, msg}
  peek(id) {
    const G = this.G(); const c = this.canPeek(id); if (!c.ok) return { ok: false, msg: c.why };
    const P = this.ensure(G), K = c.K; P.peek.n++; const n = this.nm(id);
    if (Game.roll(this.rate(id, K, G), 'peek')) { this.reveal(id, K.k); return { ok: true, k: K.k, msg: this.fill(this.pick(this.T.peek.ok), { n, k: K.n }) }; }
    const caught = Math.random() < 0.3;
    if (!caught) return { ok: false, k: K.k, msg: this.fill(this.pick(this.T.peek.fail), { n }) };
    const mul = (G.karma || 0) <= -30 ? 2 : 1; G.aff[id] = Math.max(0, (G.aff[id] || 0) - 8 * mul);
    const L = typeof Life34 !== 'undefined' && Life34.st ? Life34.st() : null; if (L && L.rel) L.rel[id] = Math.max(-100, (L.rel[id] || 0) - 5 * mul);
    P.fail[id] = G.year || 0;
    let msg = this.fill(this.pick(this.T.peek.caught), { n }); if (mul > 1) msg = msg.replace('-8', '-16');
    return { ok: false, k: K.k, caught: true, msg };
  },
  tier(r) { return r <= -40 ? '仇' : r >= 40 ? '友' : '生'; },
  hearts(a) { const f = Math.max(0, Math.min(5, Math.round(a / 30))); return '♥'.repeat(f) + '♡'.repeat(5 - f); },
  ssName(v) { const r = Math.min(7, Math.floor(v / 4)), s = v % 4; return (REALMS[r] ? REALMS[r].n : '') + (r < 7 ? '·' + (typeof STAGES !== 'undefined' ? STAGES[s] : s) : ''); },
  // ---- 面板 ----
  html(id) {
    const G = this.G(); this.ensure(G); if (id === '_me' || !id) return this.htmlMe(G);
    const N = (typeof NPCS !== 'undefined' && NPCS[id]) || { n: id }; const d = this.hid(id, G); const a = this.aff(id, G), r = this.rel(id);
    const rl = this.realmOf(id, G), J = G.jh34 && G.jh34.npcs && G.jh34.npcs[id];
    const realm = (REALMS[rl] ? REALMS[rl].n : '?') + (J && typeof J.stage === 'number' && typeof STAGES !== 'undefined' ? '·' + STAGES[J.stage] : '');
    const mapN = N.map && typeof MAPINFO !== 'undefined' && MAPINFO[N.map] ? MAPINFO[N.map].n : '';
    const tag = (typeof TIT39 !== 'undefined' && TIT39.npcTitle) ? TIT39.npcTitle(id) : '';
    const lock = k => `<span class="pf38lk">🔒 ${esc(this.T.lock[this.KEYS.find(K => K.k === k).lock])}</span>`;
    const row = (lab, val) => `<div class="pf38r"><b>${lab}</b><span>${val}</span></div>`;
    let hidHtml = '';
    hidHtml += row('隐藏灵根', this.has(id, 'lg', G) ? `<em>${esc(this.lgN(d.lg))}</em>` : lock('lg'));
    const mg = this.mgOf(d.mg);
    hidHtml += row('命格', this.has(id, 'mg', G) && mg ? `<em class="q${mg.q}">${esc(mg.n)}</em><small>${esc(mg.d)}</small><small class="fl">${esc(mg.fl)}</small>` : lock('mg'));
    hidHtml += row('真实好感', this.has(id, 'taff', G) ? `<em>真：${Math.max(0, Math.min(150, a + d.taff))}</em> <small>${d.taff >= 0 ? '↑' : '↓'} 表面 ${a}</small>` : lock('taff'));
    this.secs(id).forEach((S, i) => { const k = 'sec' + i; hidHtml += row(i ? '秘密②' : '秘密①', this.has(id, k, G) ? `<em>${esc(S.n)}</em><small>${esc(S.d)}</small>` : lock(k)); });
    const like = typeof Talk !== 'undefined' && Talk.prefs ? Talk.prefs[id] : null; const gifted = G.used && Object.keys(G.used).some(k => k.indexOf('gift') >= 0 && k.indexOf(id) >= 0);
    const likeTx = like && (gifted || a >= 60) && typeof ITEMS !== 'undefined' && ITEMS[like] ? esc(ITEMS[like].n) : '送过一次礼才知道';
    const P = this.ensure(G), c = this.canPeek(id);
    return `<div class="pf38">
      <div class="pf38h"><i class="pf38por" style="${N.por && typeof porCss === 'function' ? porCss(N.por, 56) : ''}"></i><div><b>${esc(N.n)}</b>${tag ? ` <span class="pf38t">「${esc(tag)}」</span>` : ''}<small>${esc(realm)}${mapN ? ' · ' + esc(mapN) : ''}</small></div></div>
      <div class="pf38s"><h4>① 基础</h4>${row('性格', esc(this.persona(id, G)))}${this.T.fixed[id] ? '' : row('来历', '江湖中人')}</div>
      <div class="pf38s"><h4>② 情谊</h4>${row('好感', `<span class="pf38hr">${this.hearts(a)}</span> ${a}/150`)}${row('关系', `${this.tier(r)} ${r >= 0 ? '+' : ''}${r}`)}</div>
      <div class="pf38s"><h4>③ 隐藏</h4>${hidHtml}</div>
      <div class="pf38s"><h4>④ 喜好</h4>${row('最爱', likeTx)}</div>
      <div class="pf38b"><button class="opt sm" data-f="peek" ${c.ok ? '' : 'data-off="1"'}>👁 以神识窥探 ${this.PEEK_MAX - P.peek.n}/${this.PEEK_MAX}</button>
      <small class="pf38ss">你的神识：${this.ss(G)}（${esc(this.ssName(Math.min(28, (G.realm || 0) * 4 + (G.stage || 0))))}）${c.ok ? '' : ' · ' + esc(c.why)}</small></div></div>`;
  },
  htmlMe(G) {
    const row = (lab, val) => `<div class="pf38r"><b>${lab}</b><span>${val}</span></div>`;
    const mgs = Array.isArray(G.mingge) && typeof MG33 !== 'undefined' ? G.mingge.map(id => { const m = MG33.get(id); return m ? esc(m.n) : ''; }).filter(Boolean).join('、') : '';
    const sp = G.partner || (G.fam37 && G.fam37.sp);
    return `<div class="pf38"><div class="pf38h"><div><b>${esc(G.name || '你')}</b><small>${esc(REALMS[G.realm] ? REALMS[G.realm].n : '')}·${esc(typeof STAGES !== 'undefined' ? STAGES[G.stage || 0] : '')} · ${G.age || 0} 岁</small></div></div>
      <div class="pf38s"><h4>自己（全部可见）</h4>${row('灵根', G.flags && G.flags.awakened ? esc(this.lgN(G.lg)) : '未觉醒')}${mgs ? row('命格', mgs) : ''}${row('神识', this.ss(G))}${row('善恶', G.karma || 0)}${row('欠天道', G.debt || 0)}${sp ? row('道侣', esc(this.nm(sp))) : ''}${row('今年窥探', `${this.ensure(G).peek.n}/${this.PEEK_MAX}`)}</div></div>`;
  },
  async onClick(t, b, id) {
    if (t.dataset.f === 'peek') {
      const r = this.peek(id); if (r.msg) UI.toast(r.msg, r.ok ? '#9affd8' : r.caught ? '#ff8a6a' : undefined);
      try { Game.save(); } catch (e) {} b.innerHTML = this.html(id);
    }
  },
  // 年末：「貌合神离」（真实好感比显示低 30 以上的道侣/记名弟子，10%）
  drift(G) {
    G = G || this.G(); if (!G) return null; const ids = []; if (G.partner) ids.push(G.partner); if (G.fam37 && G.fam37.sp && !ids.includes(G.fam37.sp)) ids.push(G.fam37.sp);
    if (Array.isArray(G.dis36)) G.dis36.forEach(d => { if (d && d.npc && !ids.includes(d.npc)) ids.push(d.npc); });
    for (const id of ids) { if (!NPCS[id]) continue; const d = this.hid(id, G); if (d.taff <= -30 && Math.random() < 0.1) return { id, msg: this.fill(this.pick(this.T.ev.drift), { n: this.nm(id) }) }; }
    return null;
  },
};
if (typeof window !== 'undefined') window.PF38 = PF38;
(function () {
  if (typeof UI === 'undefined' || typeof Game === 'undefined') return;
  UI.titles.pf38 = '人物详情';
  UI.p_pf38 = function (b, re, close, id) {
    id = id || '_me'; if (id !== '_me') { const got = PF38.sync(id); if (got.length) { try { Game.save(); } catch (e) {} UI.toast(PF38.nm(id) + '主动告诉了你一些事', '#ffd27a'); } }
    b.innerHTML = PF38.html(id);
    b.onclick = e => { const t = e.target.closest('button[data-f]'); if (!t) return; if (t.dataset.off) { const c = PF38.canPeek(id); UI.toast(c.why || '暂时窥不了'); return; } Sfx.play('click'); PF38.onClick(t, b, id); };
  };
  const _ex = Talk.extra;
  Talk.extra = function (id) { const out = _ex ? _ex.call(this, id) : []; if (Game.G && typeof NPCS !== 'undefined' && NPCS[id]) out.push(['📜 查看详情', async () => { await UI.panel('pf38', id); }]); return out; };
  const _pc = UI.p_char; if (_pc) UI.p_char = function (b) { const r = _pc.apply(this, arguments); if (Game.G) { const btn = h('button', 'opt sm pf38me', '📜 人物详情（自己）'); btn.onclick = e => { e.stopPropagation(); UI.panel('pf38', '_me'); }; b.appendChild(btn); } return r; };
  const _ye = Game.yearEnd; Game.yearEnd = async function () {
    const G = this.G; const y0 = G && G.year; const r = await _ye.apply(this, arguments);
    if (G && !G.dead && G.year !== y0) { try { PF38.ensure(G); const d = PF38.drift(G); if (d) { (G.log = G.log || []).push(d.msg); if (!(typeof R !== 'undefined' && R.player && R.player.nav)) UI.toast(d.msg, '#c8a0ff'); } } catch (e) { console.warn('pf38', e); } }
    return r;
  };
  // 子嗣命格：30% 继承道侣的命格
  if (typeof FAM37 !== 'undefined' && FAM37.birth) { const _b = FAM37.birth; FAM37.birth = function (rnd) { const k = _b.apply(this, arguments); try { const G = Game.G; if (k && G && G.fam37 && G.fam37.sp && !k.mg) { const R = rnd || Math.random; if (R() < 0.3) k.mg = PF38.hid(G.fam37.sp, G).mg; } } catch (e) {} return k; }; }
  if (window.DevPanel && DevPanel.registerTab) DevPanel.registerTab('pf38', '人物详情', (box, ctx) => {
    box.innerHTML = ['all:已见过的 NPC 全部解锁', 'reset:重置今年窥探次数', 'ss:神识 +4（境界+1）', 'me:打开自己的详情', 'mom:打开「娘」的详情'].map(x => `<button class="opt" data-x="${x.split(':')[0]}">${x.split(':')[1]}</button>`).join('');
    box.onclick = async e => { const x = e.target.dataset.x; const G = Game.G; if (!x || !G) return; const P = PF38.ensure(G);
      if (x === 'all') { let n = 0; Object.keys(NPCS).filter(id => (G.aff && id in G.aff) || PF38.T.fixed[id]).forEach(id => { PF38.KEYS.forEach(K => { if (PF38.reveal(id, K.k)) n++; }); }); ctx.toast('解锁 ' + n + ' 项'); }
      if (x === 'reset') { P.peek.n = 0; delete P.fail; P.fail = {}; ctx.toast('窥探次数已重置'); }
      if (x === 'ss') { if (G.realm < 7) G.realm++; ctx.toast('神识 ' + PF38.ss(G)); }
      if (x === 'me') UI.panel('pf38', '_me');
      if (x === 'mom') UI.panel('pf38', 'mom');
      ctx.save(); };
  });
  const css = document.createElement('style');
  css.textContent = `.pf38{font-size:14px;line-height:1.45;color:#4a2a14}.pf38h{display:flex;gap:10px;align-items:center;margin-bottom:6px}.pf38h b{font-size:17px;color:#3a1a0a}.pf38h small{display:block;color:#8a6a4a}.pf38por{width:56px;height:56px;flex:none;border-radius:8px;background:#e8d0a8}
.pf38t{color:#b8661a}.pf38s{background:rgba(140,80,30,.08);border:1px solid rgba(140,80,30,.18);border-radius:8px;padding:6px 8px;margin:6px 0}.pf38s h4{margin:0 0 4px;font-size:13px;color:#a0401a}
.pf38r{display:flex;gap:8px;padding:2px 0;align-items:baseline;flex-wrap:wrap}.pf38r>b{flex:none;width:64px;color:#8a5a3a;font-weight:normal}.pf38r>span{flex:1;min-width:0;word-break:break-all}
.pf38r small{display:block;color:#6a4a2a;font-size:12px}.pf38r small.fl{color:#9a7a5a;font-style:italic}.pf38r em{font-style:normal;font-weight:bold;color:#1a7a4a}.pf38r em.q0{color:#b8401a}.pf38r em.q2{color:#b8860b}
.pf38lk{color:#9a8a6a;font-size:12px}.pf38hr{color:#d0406a}.pf38b{margin-top:6px}.pf38b button[data-off]{filter:grayscale(.8) brightness(.85)}.pf38ss{display:block;color:#8a6a4a;font-size:12px;margin-top:4px}.pf38me{margin-top:8px}`;
  document.head.appendChild(css);
})();

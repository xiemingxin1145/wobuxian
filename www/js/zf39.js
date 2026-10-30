// 3.9.0 阵法 zf39（第 1 轮：数据 + 纯逻辑，未接 UI）。规格：docs/research_v22.md §11（含 §11.10 TEXT390）。
// 本文件加载时只定义 window.ZF39，不包任何函数、不改 ITEMS/SHOPS/G；UI、battleLoop/rt27 包装、秘境陷阱、地图阵眼、商店、开发者 Tab 在第 2 轮接。
// 存档：G.zf39 惰性兜底（ensure），老档无 G.zf39 = 没学阵法，所有只读函数（apply/rtMult/fx/eyeCooldown 等）都不会创建它。
(function (W) {
  'use strict';
  const TEXT390 = {
    "unlock": {
      "merchant_btn": "📜 天道施工图（盗版）· 500 灵石",
      "merchant_pitch": "钱多多从柜台底下摸出一卷发黄的图纸：“天道当年盖这个世界的施工图，复印件，缺了几页，但阵法部分是全的。五百，不讲价，讲价就是六百。”",
      "bought": "你翻开第一页，上面盖着红章：「甲方未付款，图纸仅供参考」。\n阵道入门。学会：锋矢阵、玄武阵。阵纹石 ×3。",
      "cave_hint": "你还不会阵法。听说坊市钱多多那儿有卖……来路不明的图纸。"
    },
    "panel": {
      "title": "阵法",
      "tabs": ["战阵", "洞府阵", "阵图"],
      "lv": "阵道 {lv} 级（{xp}/{need}）",
      "slots": "战阵 {a}/{b} · 洞府阵眼 {c}/{d}",
      "no_rt": "即时战无效",
      "chain": "相生·连阵",
      "useless": "暂无用处",
      "stat_note": "阵法加成另计，开战时生效",
      "craft_ok": "阵盘炼成：{n}·{tier}。图纸角落有一行小字：「此阵尚欠施工费，用坏不保修。」",
      "craft_lack": "材料不够：{lack}",
      "tier": ["", "下品", "中品", "上品"]
    },
    "war": {
      "fengshi":  {"n": "锋矢阵",     "d": "我方攻击 +{v}%。图纸批注：箭头那头是讨债的。"},
      "xuanwu":   {"n": "玄武阵",     "d": "我方防御 +{v}%。天道原用来给仓库防盗，后来仓库被偷了。"},
      "huichun":  {"n": "回春阵",     "d": "我方每回合回复 {v}% 气血。原设计是给施工队的休息区。"},
      "yinling":  {"n": "引灵阵",     "d": "我方每回合回复 {v}% 灵力。从灵气管道偷偷接了根线。"},
      "jifeng":   {"n": "疾风阵",     "d": "我方速度 +{v}%。消防通道专用，平时被人堆满了杂物。"},
      "beidou":   {"n": "天罡北斗阵", "d": "暴击 +{v}%。七颗阵眼有一颗是后补的，颜色不太对。"},
      "kunlong":  {"n": "困龙阵",     "d": "敌人开局迟缓 {v} 回合。东海龙王投诉过三次。"},
      "huanghe":  {"n": "九曲黄河阵", "d": "敌人开局中毒 {v} 回合。排水系统设计失误，将错就错。"},
      "qiantiao": {"n": "欠条阵",     "d": "敌人打你的第一下原样退回。原理：谁欠谁的，阵法记得清清楚楚。"}
    },
    "cave": {
      "hushan": {"n": "护山大阵", "d": "仇家上门时有 35% 被挡在门外。", "toast": "护山大阵把 {npc} 绕晕了，他在山门口转了三圈回去了。"},
      "mizong": {"n": "迷踪阵",   "d": "路上遇到仇家的机会减半。", "toast": "你远远看见 {npc}，迷踪阵一转，他走进了另一条岔路。"},
      "jubao":  {"n": "聚宝阵",   "d": "灵宠与弟子外出带回的灵石 +15%。", "toast": "聚宝阵多吸来 {s} 灵石，阵眼旁边还粘着一张别人的欠条。"},
      "danhuo": {"n": "丹火阵",   "d": "炼丹成功率 +5%。", "toast": "丹火阵稳住了炉温。炉子第一次没骂你。"}
    },
    "pozhen": {
      "trap_title": "触发陷阱",
      "trap_body": "地面阵法骤亮——是一座没封顶的烂尾阵，阵眼还在闪。",
      "opt_break": "⚑ 破阵（阵道 {lv} 级）",
      "opt_rush": "硬闯",
      "rule": "从生门起，按 木→火→土→金→水 相生之序点亮阵眼。错 {m} 次阵法反噬。",
      "hit": ["对了。", "阵纹顺了。", "这根承重柱没问题。"],
      "miss": ["错了，阵眼咬了你一口。", "这根是装饰柱，不承重。", "施工图上这里被咖啡渍盖住了。"],
      "ok": "阵法“咔哒”一声熄灭。阵眼底下压着几块阵纹石，还有一张施工日志：「今日停工，甲方又没打钱。」",
      "fail": "阵法反噬！你被一道剑罡追着跑了半个秘境。",
      "cd": "阵眼还在冷却：{n} 年后再来。",
      "lv_up": "阵道提升至 {lv} 级。{extra}",
      "lv_extra": {"3": "你开始能一眼看出生门了。", "4": "可以炼制中品阵盘。", "5": "可以同时布下两座战阵。", "6": "破阵时，错一步就能看出下一步。", "7": "可以炼制上品阵盘。", "9": "你看施工图的眼神，和天道当年一模一样——带着对甲方的怨气。"}
    },
    "eyes": {
      "eye_village":   "桃花村村口老井底下有座阵，本来是“全村自来水工程”。娘说：“难怪那口井只在过年出水。”",
      "eye_sect":      "青云宗护山大阵的一角，阵纹到这里突然变成了铅笔草稿。旁边写着：「此段待甲方确认」。",
      "eye_market":    "坊市地底的“防伪阵”，专门识别假灵石。它把你兜里的三块真灵石也判成了假的。",
      "eye_graveyard": "乱葬岗的阵眼是一块界碑，上书「此处原规划为天道员工宿舍」。尸王路过时叹了口气。",
      "eye_longgong":  "龙宫地基阵。东海一直漏水，原来是这里少砌了一圈。敖小白：“我爹报修了八千年。”",
      "eye_heaven":    "天外天的主阵眼，阵纹精密得吓人，唯独中间留着一块空白，写着：「尾款到账后补齐」。"
    },
    "npc": {
      "suanpan_btn": "📐 讨教阵法",
      "suanpan_lock": "算无遗推了推眼镜：“阵法？先把基础学扎实。阵道六级再来，我不教只会抄图的。”",
      "suanpan_give": "算无遗从账本里抽出一张泛黄的阵图：“欠条阵。原理很简单——谁欠谁的，记得清清楚楚，打你一下就得还一下。天道最怕的就是这个阵，因为它欠工人的工资。”",
      "mentor_comment": "剑仙瞄了一眼你的施工图，脸色变了：“……这图你从哪弄的？别给天道看见，上面的甲方签名是谁，你别细看。”",
      "tiandao_comment": "天道（客服分身）：“检测到您在使用盗版施工图。根据《三界知识产权条例》，此行为……算了，先把尾款结了再说。”"
    },
    "items": {
      "zws39": {"n": "阵纹石", "d": "刻着天道施工编号的石头，炼阵盘用。编号是连着的，中间缺了一大段——那段钱没付。"},
      "ztc39": {"n": "阵图残页", "d": "施工图散页。使用：阵道经验 +40。背面是天道手写的催款单草稿。"}
    },
    "nums": {
      "need": "60*(lv-1)^2",
      "warSlots": [0, 1, 1, 1, 1, 2, 2, 2, 2, 3],
      "caveEyes": [0, 1, 1, 2, 2, 2, 3, 3, 3, 4],
      "craftTierLv": [0, 1, 4, 7],
      "xp": {"breakBase": 15, "breakPerEye": 5, "breakFail": 5, "craft": [0, 10, 30, 80], "win": 1, "winCapYear": 40, "page": 40},
      "war": {
        "fengshi":  {"el": "金", "atkPct": [0, 0.06, 0.09, 0.12], "rt": true},
        "xuanwu":   {"el": "土", "defPct": [0, 0.08, 0.12, 0.16], "topBufDef": 1, "rt": true},
        "huichun":  {"el": "木", "regen":  [0, 0.02, 0.03, 0.04]},
        "yinling":  {"el": "水", "mpregen":[0, 0.03, 0.04, 0.05]},
        "jifeng":   {"el": "火", "spdPct": [0, 0.08, 0.12, 0.16]},
        "beidou":   {"el": "金", "crit":   [0, 0.04, 0.06, 0.08], "rt": true},
        "kunlong":  {"el": "土", "slow":   [0, 2, 3, 3], "topStunP": 0.15, "bossSlow": [0, 0, 0, 1]},
        "huanghe":  {"el": "水", "poison": [0, 2, 3, 3], "bossPoison": [0, 0, 0, 2]},
        "qiantiao": {"el": "无", "reflectEvery": [0, 0, 4, 3]}
      },
      "chainMul": 1.25,
      "craftCost": [null, {"zws39": 3, "stone": 600, "realm": 1}, {"zws39": 8, "yd": 4, "stone": 4000, "realm": 3}, {"zws39": 20, "tcdb": 1, "stone": 20000, "realm": 4}],
      "cave": {
        "hushan": {"blockP": 0.35, "cost": {"zws39": 10, "stone": 3000}},
        "mizong": {"foeW": 0.5,   "cost": {"zws39": 10, "stone": 3000}},
        "jubao":  {"stonePct": 0.15, "cost": {"zws39": 15, "stone": 5000, "realm": 3}},
        "danhuo": {"alchPP": 5,   "cost": {"zws39": 15, "stone": 5000, "realm": 3}}
      },
      "scrollPrice": {"unlock": 500, "huichun": 1500, "yinling": 1500, "jifeng": 1500, "huanghe": 8000},
      "eyeCdYears": 5,
      "eyes": {"village": 3, "sect": 3, "market": 4, "graveyard": 4, "longgong": 5, "heaven": 5},
      "mistakes": {"base": 2, "lv9": 3},
      "trapFailMul": 1.2
    }
  };
  const N = TEXT390.nums;
  const RING = ['木', '火', '土', '金', '水']; // 相生环：木→火→土→金→水→木
  const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const WAR_IDS = ['fengshi', 'xuanwu', 'huichun', 'yinling', 'jifeng', 'beidou', 'kunlong', 'huanghe', 'qiantiao'];
  const CAVE_IDS = ['hushan', 'mizong', 'jubao', 'danhuo'];
  // 9 战阵：每种下/中/上（下标 1..3），五行，rt=即时战（rt27）生效
  const WAR = {};
  for (const id of WAR_IDS) WAR[id] = Object.assign({ id, n: TEXT390.war[id].n, d: TEXT390.war[id].d }, N.war[id], { rt: !!N.war[id].rt });
  const CAVE = {};
  for (const id of CAVE_IDS) CAVE[id] = Object.assign({ id, n: TEXT390.cave[id].n, d: TEXT390.cave[id].d, toast: TEXT390.cave[id].toast }, N.cave[id]);
  // 洞府阵运行时探测（模块缺失 = 暂无用处，不让放入）
  const CAVE_NEED = {
    hushan: w => !!w.Life34,
    mizong: w => !!w.NPC37,
    jubao: w => !!(w.PET35 || w.Pet35 || w.pet35 || w.FAM37),
    danhuo: w => !!(w.LIAN35 || w.Lian35),
  };
  const MAXLV = 9;
  const need = lv => 60 * Math.pow(Math.max(1, lv) - 1, 2);
  const LV = []; // LV[lv] = { need, war, cave, tier, glow, arrow, err }
  for (let lv = 0; lv <= MAXLV; lv++) LV.push({
    lv, need: lv ? need(lv) : 0, war: N.warSlots[lv], cave: N.caveEyes[lv],
    tier: lv ? (lv >= N.craftTierLv[3] ? 3 : lv >= N.craftTierLv[2] ? 2 : 1) : 0,
    glow: lv >= 3, arrow: lv >= 6, err: lv >= 9 ? N.mistakes.lv9 : N.mistakes.base,
  });
  const ITEMS390 = { // 第 2 轮并入 ITEMS（registerItems），本轮不动全局
    zws39: { n: TEXT390.items.zws39.n, ic: 'ore', t: 'mat', p: 80, d: TEXT390.items.zws39.d },
    ztc39: { n: TEXT390.items.ztc39.n, ic: 'scroll', t: 'misc', p: 300, d: TEXT390.items.ztc39.d, use: 'zf39page' },
  };
  const DEF = () => ({ lv: 0, xp: 0, know: {}, tier: {}, war: [], cave: [], yrWinXp: 0, yrKey: 0, eyes: {} });
  // game.js 的 Game 是顶层 const，不挂 window：必须用 typeof 取（W.Game 只给 node 沙箱兜底）
  const gm = () => { try { if (typeof Game !== 'undefined' && Game) return Game; } catch (e) {} return W.Game || null; };
  const getG = G => G || (gm() && gm().G) || null;
  const peek = G => { G = getG(G); return G && G.zf39 && typeof G.zf39 === 'object' ? G.zf39 : null; }; // 只读，不创建
  const inv = (G, id) => (G.inv && G.inv[id]) || 0;
  const r2 = x => Math.round(x * 1e6) / 1e6;
  // 概率判定走 Game.roll（吃作弊/幸运开关），没有 Game 时退回 Math.random（node 单测、早期加载）
  const roll = p => { try { const g = gm(); if (g && typeof g.roll === 'function') return !!g.roll(p, 'zf39'); } catch (e) {} return Math.random() < p; };

  const ZF39 = {
    TEXT390, RING, SHENG, WAR_IDS, CAVE_IDS, WAR, CAVE, LV, ITEMS390, MAXLV,
    need, roll,
    // ---------- 存档 ----------
    ensure(G) {
      G = getG(G); if (!G) return null;
      if (!G.zf39 || typeof G.zf39 !== 'object') G.zf39 = DEF();
      const Z = G.zf39, d = DEF();
      for (const k in d) if (Z[k] === undefined || Z[k] === null || typeof Z[k] !== typeof d[k] || Array.isArray(Z[k]) !== Array.isArray(d[k])) Z[k] = d[k];
      return Z;
    },
    learned(G) { const Z = peek(G); return !!(Z && Z.lv > 0); },
    lvOf(xp) { let lv = 1; while (lv < MAXLV && xp >= need(lv + 1)) lv++; return lv; },
    lvInfo(G) { const Z = peek(G); return LV[Z ? Z.lv : 0]; },
    // 施工图：练气起，500 灵石 → lv1 + fengshi/xuanwu + 阵纹石×3（调用方负责确认/对话；这里只做状态变化）
    canUnlock(G) {
      G = getG(G); const Z = peek(G);
      if (Z && Z.lv > 0) return { ok: false, why: 'have' };
      if ((G.realm || 0) < 1) return { ok: false, why: 'realm' };
      if ((G.stone || 0) < N.scrollPrice.unlock) return { ok: false, why: 'stone' };
      return { ok: true };
    },
    unlock(G) {
      G = getG(G); if (!this.canUnlock(G).ok) return false;
      const Z = this.ensure(G); G.stone -= N.scrollPrice.unlock;
      Z.lv = 1; Z.xp = Math.max(0, Z.xp); Z.know.fengshi = 1; Z.know.xuanwu = 1;
      G.inv = G.inv || {}; G.inv.zws39 = inv(G, 'zws39') + 3;
      return true;
    },
    learn(G, id) { if (!WAR[id]) return false; const Z = this.ensure(G); if (!Z.lv || Z.know[id]) return false; Z.know[id] = 1; return true; },
    // ---------- 经验 ----------
    // 返回 { add, from, to, ups:[新到达的等级...] }；没学阵法（lv0）不加
    addXp(G, n) {
      G = getG(G); const Z = this.ensure(G); n = Math.max(0, Math.round(+n || 0));
      const from = Z.lv; if (!Z.lv || !n) return { add: 0, from, to: from, ups: [] };
      Z.xp += n; const to = Math.max(Z.lv, this.lvOf(Z.xp)); const ups = [];
      for (let l = from + 1; l <= to; l++) ups.push(l);
      Z.lv = to; return { add: n, from, to, ups };
    },
    breakXp(eyes) { return N.xp.breakBase + N.xp.breakPerEye * eyes; },
    // 布阵状态下赢一场：+1，每游戏年 40；返回 { add, ups }（与 addXp 对齐；add=0 时 ups=[]）
    winXp(G, year) {
      G = getG(G); const Z = peek(G);
      // war 惰性兜底：残缺/损坏存档缺 war 时不 NPE（与 active 的 Array.isArray 一致）
      if (!Z || !Z.lv || !(Z.war || []).length) return { add: 0, ups: [] };
      year = year === undefined ? (G.year || 0) : year;
      if (Z.yrKey !== year) { Z.yrKey = year; Z.yrWinXp = 0; }
      if (Z.yrWinXp >= N.xp.winCapYear) return { add: 0, ups: [] };
      Z.yrWinXp += N.xp.win;
      const up = this.addXp(G, N.xp.win);
      return { add: N.xp.win, ups: (up && up.ups) || [] };
    },
    // ---------- 炼制 ----------
    cost(id, tier) {
      if (WAR[id]) { const c = N.craftCost[tier]; return c ? Object.assign({}, c) : null; }
      if (CAVE[id]) return tier === 1 ? Object.assign({ realm: 0 }, CAVE[id].cost) : null;
      return null;
    },
    canCraft(G, id, tier) {
      G = getG(G); const Z = peek(G); tier = tier || 1;
      const c = this.cost(id, tier); if (!c) return { ok: false, why: 'id', lack: [] };
      if (!Z || !Z.lv) return { ok: false, why: 'lv0', lack: [] };
      if (WAR[id] && !Z.know[id]) return { ok: false, why: 'know', lack: [] };
      if ((Z.tier[id] || 0) >= tier) return { ok: false, why: 'have', lack: [] };
      const lack = [];
      if (WAR[id] && Z.lv < N.craftTierLv[tier]) lack.push({ k: 'lv', need: N.craftTierLv[tier], have: Z.lv });
      if ((G.realm || 0) < (c.realm || 0)) lack.push({ k: 'realm', need: c.realm, have: G.realm || 0 });
      for (const k of ['zws39', 'yd', 'tcdb']) if (c[k] && inv(G, k) < c[k]) lack.push({ k, need: c[k], have: inv(G, k) });
      if ((G.stone || 0) < c.stone) lack.push({ k: 'stone', need: c.stone, have: G.stone || 0 });
      return { ok: !lack.length, why: lack.length ? 'lack' : '', lack, cost: c };
    },
    // 必定成功；升品覆盖旧品不退材料；返回 { ok, xp, up }
    craft(G, id, tier) {
      G = getG(G); tier = tier || 1; const chk = this.canCraft(G, id, tier); if (!chk.ok) return Object.assign({ ok: false }, chk);
      const Z = this.ensure(G), c = chk.cost;
      for (const k of ['zws39', 'yd', 'tcdb']) if (c[k]) G.inv[k] = inv(G, k) - c[k];
      G.stone -= c.stone; Z.tier[id] = tier;
      const xp = WAR[id] ? N.xp.craft[tier] : 0; const up = xp ? this.addXp(G, xp) : { ups: [] };
      return { ok: true, xp, up };
    },
    // ---------- 布阵 ----------
    setWar(G, ids) {
      G = getG(G); const Z = peek(G); if (!Z || !Z.lv || !Array.isArray(ids)) return false;
      const u = [...new Set(ids)]; if (u.length !== ids.length || u.length > LV[Z.lv].war) return false;
      if (!u.every(id => WAR[id] && Z.know[id] && Z.tier[id] > 0)) return false;
      Z.war = u; return true;
    },
    caveUseful(id, w) { w = w || W; return !!(CAVE[id] && CAVE_NEED[id](w)); },
    setCave(G, ids, w) {
      G = getG(G); const Z = peek(G); if (!Z || !Z.lv || !Array.isArray(ids)) return false;
      const u = [...new Set(ids)]; if (u.length !== ids.length || u.length > LV[Z.lv].cave) return false;
      if (!u.every(id => CAVE[id] && Z.tier[id] > 0 && this.caveUseful(id, w))) return false;
      Z.cave = u; return true;
    },
    caveOn(G, id) { const Z = peek(G); return !!(Z && Z.lv && Z.cave.includes(id) && Z.tier[id] > 0); },
    // ---------- 战阵效果 ----------
    // 有效战阵：已学 + 已炼 + 布下，截到当前槽位；mul=1.25 表示被另一座布下战阵「相生」（按相生方向判定，与放置顺序无关；欠条阵无五行不参与）
    active(G) {
      const Z = peek(G); if (!Z || !Z.lv || !Array.isArray(Z.war)) return [];
      const ids = Z.war.filter(id => WAR[id] && Z.know && Z.know[id] && Z.tier && Z.tier[id] > 0).slice(0, LV[Z.lv].war);
      const els = ids.map(id => WAR[id].el);
      return ids.map(id => { const el = WAR[id].el; const chain = !!SHENG[el] && els.some(e => SHENG[e] === el);
        return { id, tier: Math.min(3, Z.tier[id]), el, chain, mul: chain ? N.chainMul : 1 }; });
    },
    // 合成字段值：同字段取最高；连阵 ×1.25 只作用于百分比类（atkPct/defPct/regen/mpregen/spdPct/crit），回合数/概率不乘
    fx(G) {
      const f = { atkPct: 0, defPct: 0, regen: 0, mpregen: 0, spdPct: 0, crit: 0, topBufDef: 0, slow: 0, bossSlow: 0, stunP: 0, poison: 0, bossPoison: 0, reflect: 0, reflectEvery: 0, chain: [] };
      const mx = (k, v) => { if (v > f[k]) f[k] = r2(v); };
      for (const a of this.active(G)) {
        const w = WAR[a.id], t = a.tier; if (a.chain) f.chain.push(a.id);
        for (const k of ['atkPct', 'defPct', 'regen', 'mpregen', 'spdPct', 'crit']) if (w[k]) mx(k, w[k][t] * a.mul);
        if (w.topBufDef && t === 3) mx('topBufDef', w.topBufDef);
        if (w.slow) { mx('slow', w.slow[t]); mx('bossSlow', w.bossSlow[t]); if (t === 3) mx('stunP', w.topStunP); }
        if (w.poison) { mx('poison', w.poison[t]); mx('bossPoison', w.bossPoison[t]); }
        if (a.id === 'qiantiao') { mx('reflect', 1); mx('reflectEvery', w.reflectEvery[t]); }
      }
      return f;
    },
    // 回合制：startBattle 设好 u.buf={} 之后、battleLoop 第一回合前调用（第 2 轮由 battleLoop 包装在 B.round===0 时调）。
    // 只改 side 0/1 单位的已有字段；返回 fx（含 chain，用于面板/飘字）。rng 可注入（单测用）；不注入时走 Game.roll，只用于困龙阵上品定身判定。
    apply(units, G, rng) {
      const f = this.fx(G); if (!Array.isArray(units)) return f;
      for (const u of units) {
        if (!u || (u.side !== 0 && u.side !== 1)) continue;
        u.buf = u.buf || {};
        if (u.side === 0) {
          if (f.atkPct && u.atk !== undefined) u.atk = u.atk * (1 + f.atkPct);
          if (f.defPct && u.def !== undefined) u.def = u.def * (1 + f.defPct);
          if (f.spdPct && u.spd !== undefined) u.spd = u.spd * (1 + f.spdPct);
          if (f.regen) u.regen = (u.regen || 0) + f.regen;
          if (f.mpregen) u.mpregen = (u.mpregen || 0) + f.mpregen;
          if (u.isPlayer) {
            if (f.crit) u.crit = (u.crit || 0) + f.crit;
            if (f.topBufDef) u.buf.def = Math.max(u.buf.def || 0, f.topBufDef);
            if (f.reflect) u.buf.reflect = Math.max(u.buf.reflect || 0, 1);
          }
        } else {
          const boss = !!u.boss;
          const sl = boss ? f.bossSlow : f.slow; if (sl) u.buf.slow = Math.max(u.buf.slow || 0, sl);
          const po = boss ? f.bossPoison : f.poison; if (po) u.buf.poison = Math.max(u.buf.poison || 0, po);
          if (!boss && f.stunP && (rng ? rng() < f.stunP : roll(f.stunP))) u.buf.stun = Math.max(u.buf.stun || 0, 1);
        }
      }
      return f;
    },
    // 欠条阵：第 round 回合开始时是否再挂 buf.reflect（开局那次由 apply 挂；中品第 4 回合，上品每 3 回合：4、7、10…）
    reflectAt(tier, round) {
      const e = N.war.qiantiao.reflectEvery[tier] || 0; if (!e || round <= 1) return false;
      return tier === 2 ? round === e : (round - 1) % e === 0;
    },
    roundStart(units, round, G) {
      const a = this.active(G).find(x => x.id === 'qiantiao'); if (!a || !this.reflectAt(a.tier, round)) return false;
      const P = (units || []).find(u => u && u.side === 0 && u.isPlayer); if (!P) return false;
      P.buf = P.buf || {}; P.buf.reflect = Math.max(P.buf.reflect || 0, 1); return true;
    },
    // 即时战（rt27）：只吃 rt 列（锋矢 atk / 玄武 def / 北斗 crit）。out=我方出手伤害倍率，inc=我方受到伤害倍率，crit=主角暴击加值
    rtMult(G) {
      const f = this.fx(G);
      return { out: r2(1 + f.atkPct), inc: r2(1 / (1 + f.defPct)), crit: f.crit };
    },
    // ---------- 破阵谜题 ----------
    allowedErrors(lv) { return LV[Math.max(0, Math.min(MAXLV, lv | 0))].err; },
    hints(lv) { const L = LV[Math.max(0, Math.min(MAXLV, lv | 0))]; return { glow: L.glow, arrow: L.arrow }; },
    eyesFor(band) { return band >= 4 ? 5 : band >= 2 ? 4 : 3; },
    // n 眼 = 相生环上连续一段，生门 = 第一颗；eyes 为打散后的显示顺序（每颗 { el, k }，k=正确次序）
    genPuzzle(n, rng) {
      rng = rng || Math.random; n = Math.max(3, Math.min(5, n | 0));
      const s = Math.floor(rng() * 5) % 5; const seq = []; for (let k = 0; k < n; k++) seq.push(RING[(s + k) % 5]);
      const eyes = seq.map((el, k) => ({ el, k }));
      for (let i = eyes.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [eyes[i], eyes[j]] = [eyes[j], eyes[i]]; }
      return { n, seq, gate: seq[0], eyes, step: 0, err: 0, max: N.mistakes.base, done: false, fail: false };
    },
    start(puz, lv) { puz.max = this.allowedErrors(lv); puz.step = 0; puz.err = 0; puz.done = false; puz.fail = false; return puz; },
    // 点一颗阵眼（传五行字或 eyes 下标）：返回 'hit' | 'done' | 'miss' | 'fail' | 'over'（已结束）；点错不清空已点亮的
    checkStep(puz, pick) {
      if (puz.done || puz.fail) return 'over';
      const el = typeof pick === 'number' ? (puz.eyes[pick] || {}).el : pick;
      if (el === puz.seq[puz.step]) { puz.step++; if (puz.step >= puz.n) { puz.done = true; return 'done'; } return 'hit'; }
      puz.err++; if (puz.err > puz.max) { puz.fail = true; return 'fail'; } return 'miss';
    },
    // ---------- 烂尾阵眼 ----------
    eyeCooldown(G, mapId, year) {
      G = getG(G); const Z = peek(G); year = year === undefined ? (G.year || 0) : year;
      if (!Z || !Z.eyes || Z.eyes[mapId] === undefined) return 0;
      return Math.max(0, Z.eyes[mapId] + N.eyeCdYears - year);
    },
    markEye(G, mapId, year) { G = getG(G); const Z = this.ensure(G); Z.eyes[mapId] = year === undefined ? (G.year || 0) : year; return Z.eyes[mapId]; },
    // 文案占位符替换：{npc}{n}{lv} 等
    fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, (m, k) => (o && o[k] !== undefined ? o[k] : m)); },
  };
  W.ZF39 = ZF39;
})(typeof window !== 'undefined' ? window : globalThis);

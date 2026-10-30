'use strict';
// ======================= 3.8.4 时装部位与套装（docs/research_v22.md §15）=======================
// 惯例：只包裹/赋值接入，不动 game.js / talk.js / data.js / ui.js；老档 wbx2_* / G.v===2；
// 字段惰性兜底；G==null 容忍；概率走 Game.roll；NPC37.storyBlock / B.on 时不弹自动 toast。
// index.html：放在 profile38.js 之后（当前：…→profile38→cos36→tit39→zf39…→clan41）。
// 外观由「衣」槽决定（= 旧 G.costume）；冠/佩/履暂只进面板。染色 P2 未做。
const COS36_PARTS = { guan: '冠', yi: '衣', pei: '佩', lv: '履' };
const COS36_PART_IC = { guan: 'hat', yi: 'robe_p', pei: 'jade', lv: 'boots' };
const COS36_SETS = {
  xiake:   { home: 'market',   set2: { spd: 0.02 },  set4: { crit: 0.02 },
             p: { guan: ['斗笠', '遮阳挡雨挡债主'], yi: ['黑衣劲装', '耐脏，被打也看不出血'], pei: ['酒葫芦', '装的是水，喝的是气势'], lv: ['千层底快靴', '跑路专用，鞋底写着「后会有期」'] } },
  xifu:    { home: 'village',  set2: { hp: 0.03 },   set4: { def: 0.03 },
             p: { guan: ['红绸花冠', '戴上之后全村都来随礼'], yi: ['大红喜袍', '红得天道都不好意思上门'], pei: ['同心结', '另一半在谁手里？不知道'], lv: ['红缎喜靴', '踩过的门槛都旺'] } },
  taohua:  { home: 'village',  set2: { cult: 0.02 }, set4: { hp: 0.04 },
             p: { guan: ['桃花簪', '翠花说这支是她不要的'], yi: ['桃花仙裳', '村花同款，撞衫概率很高'], pei: ['桃木香囊', '驱邪，不驱债'], lv: ['绣花鞋', '鞋面绣着一朵会掉花瓣的桃花'] } },
  mowang:  { home: 'rift',     set2: { atk: 0.03 },  set4: { atk: 0.03, crit: 0.01 },
             p: { guan: ['魔角盔', '角是粘上去的，别摸'], yi: ['魔王战袍', '天魔殿限定款，内衬写着「概不退换」'], pei: ['血玉坠', '其实是红玛瑙，魔尊也要面子'], lv: ['黑铁战靴', '走路自带回音'] } },
  guishi:  { home: 'guishi',   set2: { spd: 0.03 },  set4: { crit: 0.02 },
             p: { guan: ['夜行兜帽', '一戴上，债主就认不出你'], yi: ['鬼市夜行衣', '黑到连影子都欠着'], pei: ['无面铜钱', '两面都没字，赖账时抛着用'], lv: ['无声布鞋', '走过鬼市不留脚印，也不留账'] } },
  tianjia: { home: 'cuizhai',  set2: { def: 0.03 },  set4: { hp: 0.04 },
             p: { guan: ['凤翅盔（二手）', '一边翅膀是后补的'], yi: ['制式金甲', '天庭催债司统一配发，镀金'], pei: ['天兵工牌', '工号「天兵甲」，正在申请改成「天兵乙」'], lv: ['云头战靴', '踩云不打滑，踩泥会'] } },
  yuyi:    { home: 'heaven',   set2: { spd: 0.03 },  set4: { cult: 0.05 },
             p: { guan: ['鹤翎冠', '仙鹤自愿捐的毛，有收据'], yi: ['仙鹤羽衣', '羽衣飘飘，下雨会塌'], pei: ['云纹玉佩', '走起路来叮当响，债主听声辨位'], lv: ['踏云履', '离地三寸，省得踩到账单'] } },
  longpao: { home: 'longgong', set2: { def: 0.03 },  set4: { atk: 0.05 },
             p: { guan: ['金冠', '纯金，龙王的私房钱打的'], yi: ['龙袍', '龙宫特许，四爪半'], pei: ['龙珠佩', '夜里会亮，省灯油'], lv: ['金丝龙靴', '走一步掉一点金粉，有人跟着扫'] } },
  longwang:{ home: 'longgong', set2: { hp: 0.03 },   set4: { spd: 0.05 },
             p: { guan: ['龙角发箍', '敖小白同款，角是软的'], yi: ['太子锦服', '袖口绣着「东海」二字，防丢'], pei: ['逆鳞护符', '摸了会生气，护符自己会生气'], lv: ['分水靴', '下水不湿，上岸会滴'] } },
  caishen: { home: 'market',   set2: { cult: 0.02 }, set4: { def: 0.03, hp: 0.03 },
             p: { guan: ['财神帽', '帽翅上挂着两枚铜钱，一走就响'], yi: ['财神袍', '穿上之后天道都不好意思催你'], pei: ['金元宝挂坠', '空心的，财神也要过日子'], lv: ['聚宝靴', '鞋底有个小钱袋，常年是空的'] } },
  taozhai: { home: 'cuizhai',  set2: { atk: 0.02 },  set4: { crit: 0.02, spd: 0.02 }, rar: 3, ex: 'wb33_frag',
             p: { guan: ['讨债司大檐帽', '帽徽是一张欠条'], yi: ['讨债司制服', '反向催收的战利品，胸口写着「天道讨债司·实习」'], pei: ['催收工牌', '照片是催收使本人，被你划掉换成了你'], lv: ['公务皮靴', '专踢欠债人家的门槛，现在换你踢回去'] } },
};
const TEXT_COS36 = {
  tab: '时装（部位可混搭，账号永久保留）',
  hint: '冠、衣、佩、履四个部位。同一套穿 2 件有小加成，穿满 4 件再加一层。外观看「衣」。',
  slotEmpty: '空',
  wearBtn: '穿上', offBtn: '脱下', lockTag: '未拥有',
  setLine2: (n) => `【${n}】2/4：`, setLine4: (n) => `【${n}】4/4：`,
  fxName: { atk: '攻击', def: '防御', hp: '气血', spd: '速度', crit: '暴击', cult: '修炼速度' },
  noFx: '当前没有激活的套装效果。凑够同一套 2 件试试。',
  toast2: (n) => `${n} 穿了一半，看着有点像样了`,
  toast4: (n) => `${n} 全套上身！路人纷纷侧目（有人是来讨债的）`,
  gotPart: (s, p) => `获得时装部位【${s}·${p}】（永久）`,
  dupPart: (s, p) => `【${s}·${p}】已经有了，拆成霓裳丝×3`,
  fullSet: (s) => `【${s}】四件集齐，图鉴已点亮`,
  shopName: '霓裳坊',
  shopOpen: '钱多多：「客官，衣服要买成套的，账要分期还。」',
  shopBuyPart: (s, p, c) => `买【${s}·${p}】（${c} 灵石）`,
  shopNeedRenown: (m, lv) => `需要「${m}」声望达到「${lv}」`,
  shopBuySilk: (c, left) => `买霓裳丝×1（${c} 灵石，今年还能买 ${left} 缕）`,
  shopSilkCap: '钱多多：「今年的丝卖完了，明年请早。」',
  shopWeave: (n) => `织一件部位（霓裳丝 ${n}/10）`,
  shopWeavePick: '选一套，再选一个你还没有的部位：',
  shopNoStone: '钱多多：「钱不够？可以赊。……开玩笑的，我也被天道催过。」',
  exTitle: '讨债司制服兑换',
  exBtn: (n) => `用讨债司制服碎片换整套（${n}/5）`,
  exDone: '你把五片碎片拼成了一整套制服。胸口的「实习」二字是你自己缝上去的。',
  exHave: '已兑换（多余碎片每片可换霓裳丝×2）',
  exSilk: '多余碎片换霓裳丝',
  wbSilk: (n) => `催收使的衣角扯下来，还能织布：霓裳丝×${n}`,
  chainSilk: (n) => `奇遇链里顺手捡的料子：霓裳丝×${n}`,
  capHit: '霓裳丝已到本年上限（6 缕），明年再攒',
  dyeBtn: '染色（150 灵石）', dyeNone: '这套还没有布料图样，暂时不能染',
};
const COS36_CHAT = {
  xiake: ['merchant', '哟，大侠！大侠一般不赊账的吧？'],
  xifu: ['cuihua', '穿成这样……你是来提亲的还是来讨债的？先说好，彩礼不收欠条。'],
  taohua: ['cuihua', '这不是我那件吗？！……算了，你穿比我穿好看，就这一次。'],
  mowang: ['aotian', '魔王战袍？我也有一件，正版的。你这件领口线头都没剪。'],
  guishi: ['merchant', '穿夜行衣逛白天的坊市，你是怕别人看不见你吗？'],
  tianjia: ['merchant', '天兵大人！小店账目清白！……哦，是你啊，吓死我了。'],
  yuyi: ['aotian', '穿羽衣就能飞升？那我早飞了。'],
  longpao: ['merchant', '龙袍？东海龙王知道吗？……他要是知道，记得帮我把他欠的货款也要回来。'],
  longwang: ['aotian', '敖小白的衣服你也敢穿？他知道了会哭，哭完会发大水。'],
  caishen: ['merchant', '财神爷！拜一拜！……等等，财神也欠天道钱吗？那我拜了个寂寞。'],
  taozhai: ['merchant', '讨……讨债司的？！我交了！我今年的都交了！……啊，是你，你把催收使扒了？好样的！'],
};
const COS36 = {
  off: false,
  DROP_CAP: 6, BUY_CAP: 5, WEAVE_N: 10, DUP_SILK: 3, SILK_PRICE: 120,
  PART_PRICE: { 2: 500, 3: 800, 4: 1200 },
  WB_SILK: { 丙: 1, 乙: 2, 甲: 3, 天: 4 },
  PARTS: COS36_PARTS, SETS: COS36_SETS, TEXT: TEXT_COS36, CHAT: COS36_CHAT,
  _fx: null,
  meta() {
    try {
      if (typeof Game === 'undefined' || !Game) return null;
      const M = Game.meta || (Game.meta = {});
      if (!M.cos36 || typeof M.cos36 !== 'object') M.cos36 = { own: {}, dye: {}, seen: {} };
      const c = M.cos36;
      if (!c.own || typeof c.own !== 'object') c.own = {};
      if (!c.dye || typeof c.dye !== 'object') c.dye = {};
      if (!c.seen || typeof c.seen !== 'object') c.seen = {};
      return c;
    } catch (e) { return null; }
  },
  ensure(G) {
    G = G || (typeof Game !== 'undefined' && Game && Game.G);
    this.meta();
    if (!G) return null;
    if (!G.cos36w || typeof G.cos36w !== 'object') {
      if (G.costume) G.cos36w = { guan: G.costume, yi: G.costume, pei: G.costume, lv: G.costume };
      else G.cos36w = { guan: null, yi: null, pei: null, lv: null };
    } else {
      for (const p of Object.keys(COS36_PARTS)) if (!(p in G.cos36w)) G.cos36w[p] = null;
    }
    if (!G.cos36s || typeof G.cos36s !== 'object') G.cos36s = { y: 0, got: 0, buy: 0, chain: 0 };
    const s = G.cos36s;
    if (!Number.isFinite(s.got)) s.got = 0;
    if (!Number.isFinite(s.buy)) s.buy = 0;
    if (!Number.isFinite(s.chain)) s.chain = 0;
    if (s.y !== G.year) { s.y = G.year || 0; s.got = 0; s.buy = 0; }
    // 保持 G.costume === 衣槽
    if (!this.off) G.costume = G.cos36w.yi || null;
    return G;
  },
  has(set, part, G) {
    try {
      if (typeof Game === 'undefined' || !Game) return false;
      const M = Game.meta; if (!M) return false;
      if (M.cos && M.cos[set]) return true;
      const c = this.meta(); return !!(c && c.own && c.own[set + '.' + part]);
    } catch (e) { return false; }
  },
  hasAll(set) { return Object.keys(COS36_PARTS).every(p => this.has(set, p)); },
  ownedParts(set) { return Object.keys(COS36_PARTS).filter(p => this.has(set, p)); },
  setName(set) { return (typeof COSTUMES !== 'undefined' && COSTUMES[set] && COSTUMES[set].n) || set; },
  partName(set, part) { const S = COS36_SETS[set]; return (S && S.p && S.p[part] && S.p[part][0]) || COS36_PARTS[part]; },
  rarOf(set) {
    if (COS36_SETS[set] && COS36_SETS[set].rar != null) return COS36_SETS[set].rar;
    return (typeof COSTUMES !== 'undefined' && COSTUMES[set] && COSTUMES[set].rar) || 2;
  },
  canToast() {
    try {
      if (typeof NPC37 !== 'undefined' && NPC37 && typeof NPC37.storyBlock === 'function' && NPC37.storyBlock()) return false;
      if (typeof B !== 'undefined' && B && B.on) return false;
    } catch (e) { }
    return true;
  },
  toast(msg, col) { try { if (typeof UI !== 'undefined' && UI.toast) UI.toast(msg, col); } catch (e) { } },
  autoToast(msg, col) { if (this.canToast()) this.toast(msg, col); },
  clearFx() { this._fx = null; },
  counts(G) {
    G = this.ensure(G); const w = G && G.cos36w; const c = {};
    if (!w) return c;
    for (const p of Object.keys(COS36_PARTS)) { const s = w[p]; if (s && COS36_SETS[s]) c[s] = (c[s] || 0) + 1; }
    return c;
  },
  fxAll(G) {
    if (this.off) return {};
    if (this._fx) return this._fx;
    G = this.ensure(G); const out = { atk: 0, def: 0, hp: 0, spd: 0, crit: 0, cult: 0 };
    if (!G) { this._fx = out; return out; }
    const c = this.counts(G);
    for (const id in c) {
      const S = COS36_SETS[id]; if (!S) continue;
      if (c[id] >= 2 && S.set2) for (const k in S.set2) out[k] = (out[k] || 0) + S.set2[k];
      if (c[id] >= 4 && S.set4) for (const k in S.set4) out[k] = (out[k] || 0) + S.set4[k];
    }
    for (const k of Object.keys(out)) {
      const cap = k === 'crit' ? 0.03 : 0.08;
      out[k] = Math.min(cap, Math.max(0, out[k]));
    }
    this._fx = out; return out;
  },
  fx(k, G) { return this.fxAll(G)[k] || 0; },
  // 获得部位；重复 → 霓裳丝×3（不算掉落上限）
  grantPart(set, part, quiet) {
    const G = this.ensure(); if (!G || !COS36_SETS[set] || !COS36_PARTS[part]) return null;
    const sn = this.setName(set), pn = COS36_PARTS[part];
    if (this.has(set, part)) {
      try { if (typeof Game !== 'undefined' && Game.give) Game.give('cos36_silk', this.DUP_SILK); } catch (e) { }
      if (!quiet) this.toast(TEXT_COS36.dupPart(sn, pn), '#ffd23a');
      return 'dup';
    }
    const m = this.meta(); if (!m) return null;
    m.own[set + '.' + part] = 1;
    try { if (typeof Game !== 'undefined' && Game.saveMeta) Game.saveMeta(); } catch (e) { }
    if (!quiet) this.toast(TEXT_COS36.gotPart(sn, pn), '#ffd23a');
    if (this.hasAll(set)) {
      try {
        const M = Game.meta; if (M) { M.cos = M.cos || {}; if (!M.cos[set]) { M.cos[set] = 1; if (Game.saveMeta) Game.saveMeta(); if (!quiet) this.toast(TEXT_COS36.fullSet(sn), '#ffd23a'); } }
      } catch (e) { }
    }
    return 'new';
  },
  grantSet(set, quiet) {
    for (const p of Object.keys(COS36_PARTS)) this.grantPart(set, p, true);
    try { const M = Game.meta; if (M) { M.cos = M.cos || {}; M.cos[set] = 1; if (Game.saveMeta) Game.saveMeta(); } } catch (e) { }
    if (!quiet) this.toast(TEXT_COS36.fullSet(this.setName(set)), '#ffd23a');
  },
  // 掉落霓裳丝（催收令/奇遇链），受每年 got 上限 6
  giveSilkDrop(n, src) {
    const G = this.ensure(); if (!G || n <= 0) return 0;
    const s = G.cos36s; const left = Math.max(0, this.DROP_CAP - (s.got || 0));
    const give = Math.min(n, left);
    if (give > 0) {
      try { if (typeof Game !== 'undefined' && Game.give) Game.give('cos36_silk', give); } catch (e) { }
      s.got = (s.got || 0) + give;
      const msg = src === 'wb' ? TEXT_COS36.wbSilk(give) : TEXT_COS36.chainSilk(give);
      this.autoToast(msg + (give < n ? '（' + TEXT_COS36.capHit + '）' : ''), '#ffd23a');
    } else if (n > 0) this.autoToast(TEXT_COS36.capHit, '#ffd23a');
    return give;
  },
  syncChain(G) {
    G = this.ensure(G); if (!G || this.off) return 0;
    let done = 0;
    try { if (typeof Chain37 !== 'undefined' && Chain37 && typeof Chain37.doneCount === 'function') done = Chain37.doneCount(G) | 0; } catch (e) { return 0; }
    const s = G.cos36s; const d = done - (s.chain || 0);
    if (d > 0) { this.giveSilkDrop(d * 3, 'chain'); s.chain = done; }
    else if (done > (s.chain || 0)) s.chain = done;
    return d;
  },
  wear(part, setId, quiet) {
    const G = this.ensure(); if (!G || !COS36_PARTS[part]) return false;
    if (setId && (!COS36_SETS[setId] || !this.has(setId, part))) return false;
    const prev = G.cos36w[part];
    const cnt0 = this.counts(G);
    G.cos36w[part] = setId || null;
    G.costume = G.cos36w.yi || null;
    this.clearFx();
    try {
      if (typeof R !== 'undefined' && R && R.player && typeof Game !== 'undefined') {
        R.player.spr = Game.playerSpr(); if (typeof loadSprite === 'function') loadSprite(R.player.spr);
      }
      if (typeof UI !== 'undefined' && UI.hud) UI.hud();
      if (typeof Game !== 'undefined' && Game.save) Game.save();
    } catch (e) { }
    if (!quiet && setId) {
      const cnt1 = this.counts(G); const n = this.setName(setId);
      if ((cnt0[setId] || 0) < 4 && cnt1[setId] >= 4) this.toast(TEXT_COS36.toast4(n), '#ffd23a');
      else if ((cnt0[setId] || 0) < 2 && cnt1[setId] >= 2) this.toast(TEXT_COS36.toast2(n), '#ffd23a');
    }
    return true;
  },
  wearAll(setId) {
    const G = this.ensure(); if (!G) return false;
    if (!setId) {
      for (const p of Object.keys(COS36_PARTS)) G.cos36w[p] = null;
      G.costume = null; this.clearFx();
      try { if (typeof R !== 'undefined' && R && R.player) { R.player.spr = Game.playerSpr(); if (typeof loadSprite === 'function') loadSprite(R.player.spr); } if (UI && UI.hud) UI.hud(); } catch (e) { }
      return true;
    }
    if (!this.hasAll(setId) && !(Game.meta && Game.meta.cos && Game.meta.cos[setId])) return false;
    for (const p of Object.keys(COS36_PARTS)) G.cos36w[p] = setId;
    G.costume = setId; this.clearFx();
    try { if (typeof R !== 'undefined' && R && R.player) { R.player.spr = Game.playerSpr(); if (typeof loadSprite === 'function') loadSprite(R.player.spr); } if (UI && UI.hud) UI.hud(); } catch (e) { }
    return true;
  },
  // —— 霓裳坊定价 / 门槛 ——
  buyMod() {
    try { if (typeof Market25 !== 'undefined' && Market25.buyMod) return Market25.buyMod(); } catch (e) { }
    return 1;
  },
  renownOf(mapId) {
    try { if (typeof Market25 !== 'undefined' && Market25.renownOf) return Market25.renownOf(mapId); } catch (e) { }
    const G = typeof Game !== 'undefined' && Game.G; return (G && G.renown && G.renown[mapId]) || 0;
  },
  renownName(mapId) {
    try { if (typeof Market25 !== 'undefined' && Market25.renownLevel) return Market25.renownLevel(mapId).name; } catch (e) { }
    return '';
  },
  mapName(mapId) {
    try { if (typeof MAPINFO !== 'undefined' && MAPINFO[mapId]) return MAPINFO[mapId].n; } catch (e) { }
    return mapId;
  },
  partPrice(set) {
    const rar = this.rarOf(set); const base = this.PART_PRICE[rar] || 500;
    return Math.round(base * this.buyMod());
  },
  silkPrice() { return Math.round(this.SILK_PRICE * this.buyMod()); },
  canBuyPart(set) {
    if (!COS36_SETS[set] || set === 'taozhai' || COS36_SETS[set].ex) return { ok: false, why: '不卖' };
    const rar = this.rarOf(set); const need = rar >= 4 ? 300 : 100;
    const home = COS36_SETS[set].home; const v = this.renownOf(home);
    if (v < need) {
      const lv = need >= 300 ? '颇负盛名' : '小有名气';
      return { ok: false, why: TEXT_COS36.shopNeedRenown(this.mapName(home), lv), need };
    }
    return { ok: true, need };
  },
  buySilk() {
    const G = this.ensure(); if (!G) return false;
    const s = G.cos36s; if ((s.buy || 0) >= this.BUY_CAP) { this.toast(TEXT_COS36.shopSilkCap); return false; }
    const cost = this.silkPrice(); if (G.stone < cost) { this.toast(TEXT_COS36.shopNoStone); return false; }
    G.stone -= cost; s.buy = (s.buy || 0) + 1;
    try { Game.give('cos36_silk', 1); } catch (e) { }
    this.toast(`买下霓裳丝×1（−${cost} 灵石）`, '#ffd23a');
    try { if (Game.save) Game.save(); if (UI.hud) UI.hud(); } catch (e) { }
    return true;
  },
  buyPart(set, part) {
    const G = this.ensure(); if (!G) return false;
    const chk = this.canBuyPart(set); if (!chk.ok) { this.toast(chk.why); return false; }
    if (this.has(set, part)) { this.toast('已经有了'); return false; }
    const cost = this.partPrice(set); if (G.stone < cost) { this.toast(TEXT_COS36.shopNoStone); return false; }
    G.stone -= cost; this.grantPart(set, part);
    try { if (Game.save) Game.save(); if (UI.hud) UI.hud(); } catch (e) { }
    return true;
  },
  weavePart(set, part) {
    const G = this.ensure(); if (!G) return false;
    if (!COS36_SETS[set] || set === 'taozhai' || COS36_SETS[set].ex) return false;
    if (this.has(set, part)) return false;
    const n = (G.inv && G.inv.cos36_silk) || 0; if (n < this.WEAVE_N) { this.toast(`霓裳丝不够（${n}/${this.WEAVE_N}）`); return false; }
    try { Game.take('cos36_silk', this.WEAVE_N); } catch (e) { return false; }
    this.grantPart(set, part);
    try { if (Game.save) Game.save(); if (UI.hud) UI.hud(); } catch (e) { }
    return true;
  },
  exchangeTaozhai() {
    const G = this.ensure(); if (!G) return false;
    if (this.hasAll('taozhai') || (Game.meta && Game.meta.cos && Game.meta.cos.taozhai)) { this.toast(TEXT_COS36.exHave); return false; }
    const n = (G.inv && G.inv.wb33_frag) || 0; if (n < 5) { this.toast(`碎片不够（${n}/5）`); return false; }
    try { Game.take('wb33_frag', 5); } catch (e) { return false; }
    this.grantSet('taozhai');
    this.toast(TEXT_COS36.exDone, '#ffd23a');
    try { if (Game.save) Game.save(); if (UI.hud) UI.hud(); } catch (e) { }
    return true;
  },
  fragToSilk() {
    const G = this.ensure(); if (!G) return false;
    const haveTz = this.hasAll('taozhai') || !!(Game.meta && Game.meta.cos && Game.meta.cos.taozhai);
    if (!haveTz) { this.toast('先兑换讨债司制服'); return false; }
    const n = (G.inv && G.inv.wb33_frag) || 0; if (n <= 0) { this.toast('没有多余碎片'); return false; }
    try { Game.take('wb33_frag', n); Game.give('cos36_silk', n * 2); } catch (e) { return false; }
    this.toast(`碎片×${n} → 霓裳丝×${n * 2}`, '#ffd23a');
    try { if (Game.save) Game.save(); if (UI.hud) UI.hud(); } catch (e) { }
    return true;
  },
  // —— UI ——
  fxLines(G) {
    const c = this.counts(G); const lines = [];
    for (const id in c) {
      const S = COS36_SETS[id]; if (!S) continue; const n = this.setName(id);
      if (c[id] >= 2 && S.set2) lines.push(TEXT_COS36.setLine2(n) + this._fmtFx(S.set2));
      if (c[id] >= 4 && S.set4) lines.push(TEXT_COS36.setLine4(n) + this._fmtFx(S.set4));
    }
    return lines;
  },
  _fmtFx(fx) {
    return Object.keys(fx).map(k => {
      const v = fx[k]; const pct = Math.round(v * 1000) / 10;
      return (TEXT_COS36.fxName[k] || k) + '+' + pct + (k === 'crit' ? '点' : '%');
    }).join('，');
  },
  panelHtml(G) {
    G = this.ensure(G); const T = TEXT_COS36; const w = G.cos36w;
    const slots = Object.keys(COS36_PARTS).map(p => {
      const sid = w[p]; const own = sid && this.has(sid, p);
      const label = sid ? `${this.setName(sid)}·${this.partName(sid, p)}` : T.slotEmpty;
      const ic = COS36_PART_IC[p];
      return `<div class="cos36slot" data-slot="${p}"><i style="${typeof iconCss === 'function' ? iconCss(ic, 40) : ''}"></i><div><b>${COS36_PARTS[p]}</b><small>${esc ? esc(label) : label}</small></div>${sid ? `<button class="sm" data-off="${p}">${T.offBtn}</button>` : ''}</div>`;
    }).join('');
    const fx = this.fxLines(G); const fxHtml = fx.length ? fx.map(l => `<div class="cos36fx">${esc ? esc(l) : l}</div>`).join('') : `<div class="cos36fx dim">${T.noFx}</div>`;
    const sets = Object.keys(COS36_SETS).map(id => {
      const C = (typeof COSTUMES !== 'undefined' && COSTUMES[id]) || { n: id, rar: 2, d: '' };
      const parts = Object.keys(COS36_PARTS).map(p => {
        const ok = this.has(id, p); const on = w[p] === id;
        const nm = this.partName(id, p);
        return `<div class="cos36p ${ok ? '' : 'dim'}${on ? ' on' : ''}" data-set="${id}" data-part="${p}"><b>${COS36_PARTS[p]}·${esc ? esc(nm) : nm}</b>${ok ? (on ? `<button class="sm" data-off="${p}">${T.offBtn}</button>` : `<button class="sm" data-wear="${id}" data-part="${p}">${T.wearBtn}</button>`) : `<span class="tag">${T.lockTag}</span>`}</div>`;
      }).join('');
      const nOwn = this.ownedParts(id).length;
      const col = (typeof RARITY !== 'undefined' && RARITY[C.rar] && RARITY[C.rar].c) || '#ffd23a';
      return `<div class="cos36set"><div class="cos36sh"><div class="sprbox" data-spr="cos_${id === 'taozhai' ? 'tianjia' : id}_${G.sex}"></div><div><b style="color:${col}">${esc ? esc(C.n) : C.n}</b><small>${nOwn}/4 · ${esc ? esc(C.d || '') : (C.d || '')}</small></div></div>${parts}</div>`;
    }).join('');
    return `<h4>${T.tab}</h4><p class="hint">${T.hint}</p><div class="cos36slots">${slots}</div>${fxHtml}<div class="cos36list">${sets}</div>`;
  },
  async onPanelClick(e, re) {
    const t = e.target.closest('[data-wear],[data-off]'); if (!t) return;
    e.stopPropagation();
    try { if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('pickup'); } catch (er) { }
    if (t.dataset.off != null) this.wear(t.dataset.off, null);
    else if (t.dataset.wear) this.wear(t.dataset.part, t.dataset.wear);
    if (re) re();
  },
  async openShop() {
    const G = this.ensure(); if (!G) return;
    const silk = (G.inv && G.inv.cos36_silk) || 0;
    const frag = (G.inv && G.inv.wb33_frag) || 0;
    const haveTz = this.hasAll('taozhai') || !!(Game.meta && Game.meta.cos && Game.meta.cos.taozhai);
    const opts = [];
    const leftBuy = Math.max(0, this.BUY_CAP - (G.cos36s.buy || 0));
    opts.push(TEXT_COS36.shopBuySilk(this.silkPrice(), leftBuy));
    opts.push(TEXT_COS36.shopWeave(silk));
    opts.push('买时装部位…');
    opts.push(haveTz ? TEXT_COS36.exHave : TEXT_COS36.exBtn(frag));
    if (haveTz && frag > 0) opts.push(TEXT_COS36.exSilk);
    opts.push('算了');
    const k = await UI.card(TEXT_COS36.shopName, TEXT_COS36.shopOpen + `\n霓裳丝×${silk} · 本年掉落 ${G.cos36s.got}/${this.DROP_CAP} · 已买 ${G.cos36s.buy}/${this.BUY_CAP}`, 'npc_merchant', opts);
    if (k === 0) this.buySilk();
    else if (k === 1) await this.shopWeave();
    else if (k === 2) await this.shopBuyPart();
    else if (k === 3 && !haveTz) this.exchangeTaozhai();
    else if (opts[k] === TEXT_COS36.exSilk) this.fragToSilk();
  },
  async shopBuyPart() {
    const G = this.ensure(); if (!G) return;
    const sets = Object.keys(COS36_SETS).filter(id => id !== 'taozhai' && !COS36_SETS[id].ex);
    const labels = sets.map(id => {
      const chk = this.canBuyPart(id); const n = this.setName(id); const rar = this.rarOf(id);
      const rn = (typeof RARITY !== 'undefined' && RARITY[rar] && RARITY[rar].n) || '';
      return chk.ok ? `${n}（${rn} ${this.partPrice(id)} 灵石）` : `${n}（${chk.why}）`;
    });
    const k = await UI.card('买部位·选套装', '选一套，再选未拥有的部位：', 'npc_merchant', labels.concat(['算了']));
    if (k < 0 || k >= sets.length) return;
    const set = sets[k]; const chk = this.canBuyPart(set); if (!chk.ok) { this.toast(chk.why); return; }
    const parts = Object.keys(COS36_PARTS).filter(p => !this.has(set, p));
    if (!parts.length) { this.toast('这套部位都有了'); return; }
    const pl = parts.map(p => TEXT_COS36.shopBuyPart(this.setName(set), this.partName(set, p), this.partPrice(set)));
    const j = await UI.card('买部位', TEXT_COS36.shopWeavePick, 'npc_merchant', pl.concat(['算了']));
    if (j < 0 || j >= parts.length) return;
    this.buyPart(set, parts[j]);
  },
  async shopWeave() {
    const G = this.ensure(); if (!G) return;
    const silk = (G.inv && G.inv.cos36_silk) || 0;
    if (silk < this.WEAVE_N) { this.toast(`霓裳丝不够（${silk}/${this.WEAVE_N}）`); return; }
    const sets = Object.keys(COS36_SETS).filter(id => id !== 'taozhai' && !COS36_SETS[id].ex && this.ownedParts(id).length < 4);
    if (!sets.length) { this.toast('没有可织的部位了'); return; }
    const labels = sets.map(id => `${this.setName(id)}（缺 ${4 - this.ownedParts(id).length}）`);
    const k = await UI.card('织部位', TEXT_COS36.shopWeavePick, 'npc_merchant', labels.concat(['算了']));
    if (k < 0 || k >= sets.length) return;
    const set = sets[k]; const parts = Object.keys(COS36_PARTS).filter(p => !this.has(set, p));
    const pl = parts.map(p => `${COS36_PARTS[p]}·${this.partName(set, p)}`);
    const j = await UI.card('织部位', this.setName(set), 'npc_merchant', pl.concat(['算了']));
    if (j < 0 || j >= parts.length) return;
    this.weavePart(set, parts[j]);
  },
  chatLine(npcId) {
    const G = this.ensure(); if (!G) return null;
    const m = this.meta(); if (!m) return null;
    const c = this.counts(G);
    for (const id in c) {
      if (c[id] < 4) continue;
      const row = COS36_CHAT[id]; if (!row || row[0] !== npcId) continue;
      if (m.seen[id]) continue;
      return { set: id, line: row[1] };
    }
    return null;
  },
};
window.COS36 = COS36;
window.COS36_DATA = COS36_SETS;
window.TEXT_COS36 = TEXT_COS36;

(function installCos36() {
  // 新套装 + 材料（不改 systems21 / data.js）
  try {
    if (typeof COSTUMES !== 'undefined') {
      COSTUMES.taozhai = { n: '讨债司制服', rar: 3, d: '天道讨债司制式工装，从催收使身上扒下来的（他还在追你）' };
    }
    if (typeof ITEMS !== 'undefined') {
      ITEMS.cos36_silk = { n: '霓裳丝', ic: 'robe_p', t: 'mat', p: 20, d: '织时装部位用的仙丝。10 缕可在坊市霓裳坊织 1 件指定部位。' };
      if (ITEMS.wb33_frag) ITEMS.wb33_frag.d = '击杀天道催收使所得。集齐 5 片可在坊市钱多多·霓裳坊换时装「讨债司制服」；多余碎片每片可换霓裳丝×2。';
    }
  } catch (e) { console.warn('cos36 data', e); }

  if (typeof Sys === 'undefined' || typeof Game === 'undefined') return;

  // 1) Sys.bonus
  if (!Sys._cos36) {
    Sys._cos36 = 1;
    const _b = Sys.bonus;
    Sys.bonus = function (k) {
      const v = _b.apply(this, arguments);
      try { if (!COS36.off) return v + COS36.fx(k); } catch (e) { }
      return v;
    };
  }

  // 2) Sys.setCostume → 整套穿脱 4 槽
  if (!Sys.setCostume._cos36) {
    const _sc = Sys.setCostume;
    Sys.setCostume = function (id) {
      try {
        if (!COS36.off) {
          const G = Game.G; COS36.ensure(G);
          if (G) {
            if (!id) COS36.wearAll(null);
            else COS36.wearAll(id);
            COS36.clearFx();
          }
        }
      } catch (e) { console.warn('cos36 setCostume', e); }
      return _sc.apply(this, arguments);
    };
    Sys.setCostume._cos36 = 1;
  }

  // 3) Game.playerSpr：taozhai 缺图 → tianjia
  if (Game.playerSpr && !Game.playerSpr._cos36) {
    const _ps = Game.playerSpr;
    Game.playerSpr = function () {
      try {
        const G = this.G;
        if (G && G.costume === 'taozhai') {
          const sex = G.sex || 'm';
          const hasTz = typeof AS !== 'undefined' && AS.sprites && AS.sprites['cos_taozhai_' + sex];
          if (!hasTz) {
            const own = (Game.meta && Game.meta.cos && Game.meta.cos.taozhai) || COS36.has('taozhai', 'yi');
            if (own && typeof AS !== 'undefined' && AS.sprites && AS.sprites['cos_tianjia_' + sex]) return 'cos_tianjia_' + sex;
          }
        }
      } catch (e) { }
      return _ps.apply(this, arguments);
    };
    Game.playerSpr._cos36 = 1;
  }

  // 4) UI.p_mount：替换时装小节
  if (typeof UI !== 'undefined' && UI.p_mount && !UI.p_mount._cos36) {
    const _pm = UI.p_mount;
    UI.p_mount = function (b, re) {
      _pm.apply(this, arguments);
      try {
        if (COS36.off || !Game.G) return;
        COS36.ensure(Game.G);
        const kids = Array.prototype.slice.call(b.childNodes);
        let cut = null;
        for (const n of kids) {
          if (n.nodeType === 1 && n.tagName === 'H4' && /时装/.test(n.textContent || '')) { cut = n; break; }
        }
        if (cut) {
          let n = cut;
          while (n) { const nx = n.nextSibling; if (n.parentNode) n.parentNode.removeChild(n); n = nx; }
        }
        const wrap = document.createElement('div');
        wrap.className = 'cos36wrap';
        wrap.innerHTML = COS36.panelHtml(Game.G);
        b.appendChild(wrap);
        if (typeof UI.drawSprBoxes === 'function') UI.drawSprBoxes(wrap);
        wrap.addEventListener('click', e => { COS36.onPanelClick(e, () => { UI.p_mount(b, re); }); });
      } catch (e) { console.warn('cos36 p_mount', e); }
    };
    UI.p_mount._cos36 = 1;
  }

  // 5) WB33.settle → 霓裳丝
  if (typeof WB33 !== 'undefined' && WB33.settle && !WB33.settle._cos36) {
    const _st = WB33.settle;
    WB33.settle = async function () {
      const G = Game.G; const best = G && G.wb33 && G.wb33.best;
      const r = await _st.apply(this, arguments);
      try {
        if (!COS36.off && best && COS36.WB_SILK[best]) COS36.giveSilkDrop(COS36.WB_SILK[best], 'wb');
      } catch (e) { console.warn('cos36 wb silk', e); }
      return r;
    };
    WB33.settle._cos36 = 1;
  }

  // 6) yearEnd / enterMap → 奇遇链丝
  if (Game.yearEnd && !Game.yearEnd._cos36) {
    const _ye = Game.yearEnd;
    Game.yearEnd = async function () {
      const r = await _ye.apply(this, arguments);
      try { if (this.G && !COS36.off) { COS36.ensure(this.G); COS36.syncChain(this.G); } } catch (e) { console.warn('cos36 ye', e); }
      return r;
    };
    Game.yearEnd._cos36 = 1;
  }
  if (Game.enterMap && !Game.enterMap._cos36) {
    const _em = Game.enterMap;
    Game.enterMap = async function (id) {
      const r = await _em.apply(this, arguments);
      try { if (this.G && !COS36.off) { COS36.ensure(this.G); COS36.syncChain(this.G); } } catch (e) { }
      return r;
    };
    Game.enterMap._cos36 = 1;
  }

  // 7) 钱多多霓裳坊 + 穿满闲聊
  if (typeof Talk !== 'undefined' && Talk.extra && !Talk.extra._cos36) {
    const _ex = Talk.extra;
    Talk.extra = function (id) {
      const out = _ex ? _ex.apply(this, arguments) || [] : [];
      try {
        const G = Game.G; if (!G || COS36.off) return out;
        if (id === 'merchant') out.push(['👘 霓裳坊', async () => { await COS36.openShop(); }]);
        const chat = COS36.chatLine(id);
        if (chat) {
          out.unshift(['💬 打量你的衣服', async () => {
            const N = typeof NPCS !== 'undefined' && NPCS[id];
            const m = COS36.meta(); if (m) m.seen[chat.set] = 1;
            try { if (Game.saveMeta) Game.saveMeta(); } catch (e) { }
            await UI.say(N && N.por, N && N.n || id, chat.line, ['……']);
          }]);
        }
      } catch (e) { console.warn('cos36 extra', e); }
      return out;
    };
    Talk.extra._cos36 = 1;
  }

  // 8) 投胎沿用穿戴
  if (Game.newLife && !Game.newLife._cos36) {
    const _nl = Game.newLife;
    Game.newLife = function (cfg) {
      let prev = null;
      try { if (this.G && this.G.cos36w) prev = { guan: this.G.cos36w.guan, yi: this.G.cos36w.yi, pei: this.G.cos36w.pei, lv: this.G.cos36w.lv }; } catch (e) { }
      const r = _nl.apply(this, arguments);
      try {
        if (prev && this.G && !COS36.off) {
          this.G.cos36w = prev; this.G.costume = prev.yi || null; COS36.clearFx();
        }
      } catch (e) { }
      return r;
    };
    Game.newLife._cos36 = 1;
  }

  // CSS
  try {
    const css = document.createElement('style');
    css.textContent = `.cos36wrap{margin-top:4px}.cos36slots{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0}
.cos36slot{display:flex;align-items:center;gap:6px;padding:6px;border-radius:8px;background:rgba(0,0,0,.2);overflow:hidden}.cos36slot b{display:block;font-size:13px}.cos36slot small{display:block;font-size:11px;opacity:.85;word-break:break-all}
.cos36fx{font-size:12px;margin:2px 0;color:#9affd0}.cos36fx.dim{opacity:.7;color:#ccc}
.cos36set{margin:8px 0;padding:6px;border-radius:8px;background:rgba(255,210,60,.06);border:1px solid rgba(255,210,60,.25);overflow:hidden}
.cos36sh{display:flex;align-items:center;gap:8px;margin-bottom:4px}.cos36sh b{display:block}.cos36sh small{display:block;font-size:11px;opacity:.85}
.cos36p{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:4px 2px;font-size:12px}.cos36p.dim{opacity:.55}.cos36p.on b{color:#ffd23a}
.cos36p .sm{min-height:36px;min-width:52px}`;
    if (document.head) document.head.appendChild(css);
  } catch (e) { }

  // 9) 开发者面板（可选）
  try {
    if (window.DevPanel && DevPanel.registerTab) DevPanel.registerTab('cos36', '时装36', (box, ctx) => {
      const G = Game.G; if (!G) { box.innerHTML = '<p>先开始一局</p>'; return; }
      COS36.ensure(G);
      const silk = (G.inv && G.inv.cos36_silk) || 0;
      box.innerHTML = `<p>霓裳丝 ${silk}｜本年掉落 ${G.cos36s.got}/${COS36.DROP_CAP}｜已买 ${G.cos36s.buy}/${COS36.BUY_CAP}｜衣槽 ${G.cos36w.yi || '空'}</p>
        <div class="dvb" style="justify-content:flex-start"><button class="sm dvx" data-q="silk">丝+10</button><button class="sm dvx" data-q="frag">碎片+5</button><button class="sm dvx" data-q="stone">灵石+20000</button><button class="sm dvx" data-q="cap">清本年上限</button><button class="sm dvx" data-q="strip">全脱</button></div>
        <div class="dvb" style="justify-content:flex-start;margin-top:6px;flex-wrap:wrap">${Object.keys(COS36_SETS).map(id => `<button class="sm dvx" data-u="${id}">解锁 ${COS36.setName(id)}</button>`).join('')}</div>`;
      box.onclick = e => {
        const t = e.target.closest('button'); if (!t) return;
        if (t.dataset.q === 'silk') { Game.give('cos36_silk', 10); ctx.toast('霓裳丝 +10'); }
        else if (t.dataset.q === 'frag') { Game.give('wb33_frag', 5); ctx.toast('碎片 +5'); }
        else if (t.dataset.q === 'stone') { G.stone += 20000; ctx.toast('灵石 +20000'); }
        else if (t.dataset.q === 'cap') { G.cos36s.got = 0; G.cos36s.buy = 0; ctx.toast('本年计数已清'); }
        else if (t.dataset.q === 'strip') { COS36.wearAll(null); ctx.toast('已全脱'); }
        else if (t.dataset.u) { COS36.grantSet(t.dataset.u, true); ctx.toast('已解锁 ' + COS36.setName(t.dataset.u)); }
        ctx.save(); ctx.rerender();
      };
    });
  } catch (e) { }
})();

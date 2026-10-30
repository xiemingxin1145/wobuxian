'use strict';
// ======================= 3.8.2 道具 items40（规格 docs/research_v40_items.md + docs/research_v22.md §13；§13 优先） =======================
// 60 个 i40_ 道具：25 可使用 / 20 礼物 / 15 剧情。只追加 ITEMS / GIFTS / SHOPS，接入全部为包装：
//   UI.useItem（use:'i40' 分派器）、Talk.gift（重写送礼：爱/憎/每月 1 次，保留 life34 好感同步）、Talk.extra（剧情道具获得/交付「⚑」选项、非伙伴 NPC 送礼入口）、
//   Talk.npc（翠花荷包自动给）、Game.yearEnd（延期还款单）、Game.roll + Chain37.yearTick（转运珠，仅风声消耗）、Game.cultMult（千年蒲团）、Acts.mat（静心丹）、Acts.herb（野花掉落）、
//   Dng.exit（秘境掉落）、NPC37.resolve（密信掉落）、FAM37.canMarry/marry/famYear（月老红线/送子瓶）、PF38.ss/reveal（养神丹/逆鳞，3.8.0 合入后生效）、
//   UI.renderBB + doAction + calcDmg + startBattle（战斗道具）、UI.shop（假秤砣举报后钱多多 9 折）。
// 不改 game.js/talk.js/data.js/ui.js。存档：G.i40 惰性兜底（不升 G.v）；老存档无 G.i40 时一切行为同旧版。
// 依赖 3.8.0 PF38 的道具（窥心类 / 秘密类剧情道具）在 typeof PF38==='undefined' 时不进商店、不掉落、使用提示未开放且不消耗。
// 交付/获得选项一律以「⚑」开头（不在 ux23 SAFE 白名单），自动任务/挂机永不代选。
const ITEMS40 = {
  // ---- 可使用 25 ----
  i40_jingxin: { n: '静心丹', ic: 'pill_green', t: 'pill', p: 120, d: '下一次「打坐」修为翻倍（每年限服 1 颗；选闭关不消耗药效）', use: 'i40' },
  i40_huiyuan: { n: '回元散', ic: 'pill_red', t: 'pill', p: 60, d: '回复50%气血（战斗中也可用）', use: 'heal' },
  i40_xiaoyao: { n: '逍遥丸', ic: 'pill_gold', t: 'pill', p: 300, d: '寿元+2年（每个大境界限用3颗）', use: 'i40' },
  i40_xisui_s: { n: '小洗髓液', ic: 'pill_purple', t: 'pill', p: 800, d: '灵根纯度+8', use: 'i40' },
  i40_poxie: { n: '破邪符', ic: 'tal_r', t: 'misc', p: 80, d: '战斗中使用：本场对魔/鬼/尸系伤害+20%（每场1张）', use: 'battle' },
  i40_dunfu: { n: '土遁符', ic: 'tal_b', t: 'misc', p: 50, d: '战斗中使用：立即脱离战斗（BOSS/禁逃之战无效，不消耗）', use: 'battle' },
  i40_leifu: { n: '掌心雷符', ic: 'sk_thunder', t: 'misc', p: 150, d: '战斗中使用：对血量最低的敌人降下掌心雷（真实伤害，每场1张）', use: 'battle' },
  i40_kuixin_jing: { n: '窥灵镜', ic: 'mirror', t: 'misc', p: 1200, d: '揭示一名NPC的隐藏灵根（人物详情）', use: 'i40', pf: 1 },
  i40_mingpan: { n: '命盘残页', ic: 'book_p', t: 'misc', p: 2500, d: '揭示一名NPC的命格（人物详情）', use: 'i40', pf: 1 },
  i40_tongxin: { n: '同心香', ic: 'sk_light', t: 'misc', p: 900, d: '当年可见一名NPC的真实好感（人物详情）', use: 'i40', pf: 1 },
  i40_mixin: { n: '密信', ic: 'scroll', t: 'misc', p: 0, d: '揭示掉落它的那名NPC的秘密①（人物详情）', use: 'i40', pf: 1 },
  i40_shenshi: { n: '养神丹', ic: 'pill_blue', t: 'pill', p: 1500, d: '当年神识+3（每年1颗）', use: 'i40', pf: 1 },
  i40_wangyou: { n: '忘忧水', ic: 'gourd', t: 'misc', p: 400, d: '与一名NPC的好感/恩怨全部清零（道侣与娘除外）', use: 'i40' },
  i40_yuelao: { n: '月老红线', ic: 'ring', t: 'misc', p: 3000, d: '下一次求结道侣门槛降为 好感≥80、恩怨≥40（一次性）', use: 'i40' },
  i40_songzi: { n: '送子观音瓶', ic: 'gourd_g', t: 'misc', p: 2000, d: '当年子嗣降生概率+40%（需有道侣）', use: 'i40' },
  i40_jiapu: { n: '空白族谱', ic: 'book_g', t: 'misc', p: 500, d: '开族立谱，家族等级1的前置（3.8.3 开放）', use: 'i40', clan: 1 },
  i40_zuxun: { n: '祖训竹简', ic: 'book_o', t: 'misc', p: 1000, d: '可多选一条族规（3.8.3 开放）', use: 'i40', clan: 1 },
  i40_dici: { n: '地契', ic: 'bill', t: 'misc', p: 5000, d: '获得一处族产「良田」（3.8.3 开放）', use: 'i40', clan: 1 },
  i40_xingyun: { n: '转运珠', ic: 'stone', t: 'misc', p: 700, d: '下一次奇遇风声必定出现（需满足奇遇链条件）', use: 'i40' },
  i40_huanyan: { n: '驻颜丹', ic: 'pill_white', t: 'pill', p: 600, d: '魅力+1（终身限用3颗）', use: 'i40' },
  i40_kaiqiao: { n: '开窍丹', ic: 'pill_gold', t: 'pill', p: 900, d: '悟性+1（终身限用3颗）', use: 'i40' },
  i40_jiezhai: { n: '延期还款单', ic: 'bill', t: 'misc', p: 300, d: '本年天道利息减半（过年结算时生效；闭关不生效）', use: 'i40' },
  i40_shuguan: { n: '书馆借书证', ic: 'book_b', t: 'misc', p: 100, d: '领取一本随机功法卷轴', use: 'scroll' },
  i40_lingshou: { n: '灵兽肉干', ic: 'stone_r', t: 'misc', p: 40, d: '出战灵宠经验大涨（没有出战灵宠时不消耗）', use: 'i40' },
  i40_dazuo: { n: '蒲团·千年', ic: 'sk_meditate', t: 'misc', p: 2000, d: '持有即生效：修为获取+10%（多个不叠加）', passive: 'cult' },
  // ---- 礼物 20 ----
  i40_guihua: { n: '桂花糕', ic: 'peach', t: 'gift', p: 30, d: '村口张婶做的，甜到心里', love: ['kin', 'cuihua', 'aoxiao'], hate: ['sumei', 'zhuiming'] },
  i40_laojiu: { n: '三十年老窖', ic: 'gourd', t: 'gift', p: 280, d: '剑仙闻了都要醒', love: ['mentor', 'mentor2', 'ruyan', 'farmer'], hate: ['sister', 'lengyue'] },
  i40_yuzan: { n: '碧玉簪', ic: 'jade', t: 'gift', p: 450, d: '成色上好的暖玉', love: ['sister', 'cuihua', 'lengyue', 'guanghan'], hate: ['mentor', 'moguard'] },
  i40_huaben: { n: '话本《霸道仙尊爱上我》', ic: 'book_r', t: 'gift', p: 60, d: '市井畅销书，第三卷缺页', love: ['cuihua', 'aoxiao', 'lost', 'shuoshu'], hate: ['elder', 'xiaoyi'] },
  i40_qiju: { n: '寒玉棋盘', ic: 'seal', t: 'gift', p: 900, d: '落子有声，天然生凉', love: ['elder', 'guzhu', 'guichengxiang', 'xiaoyao'], hate: ['aoxiao', 'lost'] },
  i40_suanpan: { n: '金算盘', ic: 'abacus', t: 'gift', p: 1200, d: '拨一下，钱就多一点（错觉）', love: ['merchant', 'sumei', 'caishen', 'suanpan'], hate: ['mentor', 'keeper'] },
  i40_yaocao: { n: '九叶灵芝', ic: 'lingzhi', t: 'gift', p: 700, d: '药香扑鼻，百年一见', love: ['danlao', 'yaopu', 'guzhu'], hate: ['merchant'] },
  i40_yugan: { n: '紫竹鱼竿', ic: 'umbrella', t: 'gift', p: 350, d: '据说钓上来过一只王八精', love: ['fisherm', 'fisher2', 'guichengxiang'], hate: ['sumei', 'xianguan'] },
  i40_xiangnang: { n: '安神香囊', ic: 'bag', t: 'gift', p: 120, d: '内装薰衣灵草', love: ['mom', 'yaopu', 'lost', 'keeper'], hate: ['moguard'] },
  i40_baigu: { n: '白骨笛', ic: 'sk_dark', t: 'gift', p: 500, d: '鬼市特产，吹起来像哭', love: ['sanniang', 'baiwuchang', 'guizu', 'keeper'], hate: ['mom', 'cuihua', 'guzhu'] },
  i40_mozhu: { n: '魔晶烛', ic: 'sk_fire', t: 'gift', p: 800, d: '点燃时满屋紫光，邪气森森', love: ['sumei', 'moguard', 'ali'], hate: ['elder', 'sister', 'danlao'] },
  i40_longxu: { n: '龙须糖', ic: 'herb', t: 'gift', p: 90, d: '龙宫御厨手艺', love: ['aoxiao', 'taizi', 'xiabing'], hate: ['lengyue'] },
  i40_yueguang: { n: '月光纱', ic: 'robe_w', t: 'gift', p: 1500, d: '织女的边角料', love: ['guanghan', 'lengyue', 'ali', 'ruyan'], hate: ['farmer'] },
  i40_zhangben: { n: '空白账本', ic: 'debtbook', t: 'gift', p: 40, d: '纸质极好，适合记仇', love: ['xianguan', 'suanpan', 'zhuiming', 'merchant'], hate: ['mentor', 'ali'] },
  i40_jianpei: { n: '古剑穗', ic: 'sword_o', t: 'gift', p: 650, d: '系在剑上，挥剑时会叮当响', love: ['mentor', 'ruyan', 'xiaoyi', 'sister'], hate: ['merchant'] },
  i40_huaduo: { n: '野花一束', ic: 'herb', t: 'gift', p: 5, d: '路边摘的，诚意满满', love: ['cuihua', 'mom', 'lost', 'aoxiao'], hate: ['lengyue', 'elder'] },
  i40_leiguo: { n: '雷击木果', ic: 'sk_thunder', t: 'gift', p: 400, d: '被雷劈过的果子，酥麻可口', love: ['leigong', 'dianmu', 'aoxiao'], hate: ['guzhu'] },
  i40_tiezhi: { n: '烫金请柬', ic: 'scroll', t: 'gift', p: 200, d: '郑重邀约：对方好感≥60 时+15，否则+3', love: [], hate: [] },
  i40_ganggu: { n: '钢骨扇', ic: 'fan', t: 'gift', p: 380, d: '扇面题字：钱债两清', love: ['xiaoyi', 'xiaoyao', 'shuoshu'], hate: ['mom'] },
  i40_tanghulu: { n: '冰糖葫芦', ic: 'peach', t: 'gift', p: 8, d: '一串六颗，酸酸甜甜', love: ['kin', 'lost', 'aoxiao', 'guizu'], hate: ['danlao'] },
  // ---- 剧情 15（quest:1，p:0 不可出售、不在 GIFTS 里不可赠送；「使用」只给提示，交付走对话「⚑」选项） ----
  i40_duanjian: { n: '断剑残片', ic: 'sword_w', t: 'quest', p: 0, d: '落魄剑仙断剑的另一半。交给他，解开他的秘密②', use: 'i40', quest: 1, to: '落魄剑仙' },
  i40_weibali: { n: '第九尾当票', ic: 'bill', t: 'quest', p: 0, d: '鬼市当票，阿离的第九尾已赎回。还给她吧', use: 'i40', quest: 1, to: '狐妖·阿离' },
  i40_nilin: { n: '逆鳞', ic: 'ring_b', t: 'quest', p: 0, d: '敖小乐的逆鳞。还给她，或交给龙宫太子，二选一', use: 'i40', quest: 1, to: '敖小乐 / 龙宫太子' },
  i40_yuejie: { n: '旧借据', ic: 'bill', t: 'quest', p: 0, d: '娘当年画押的借据原件', use: 'i40', quest: 1, to: '娘 / 天道会计' },
  i40_lingpai: { n: '无名灵牌', ic: 'seal', t: 'quest', p: 0, d: '写着你名字的灵牌。守墓人说：上辈子的你。', use: 'i40', quest: 1, to: '守墓人' },
  i40_diya: { n: '灵脉抵押书', ic: 'debtbook', t: 'quest', p: 0, d: '青云宗把灵脉抵押给天道的凭据', use: 'i40', quest: 1, to: '掌门 / 记账童子' },
  i40_jiacheng: { n: '假秤砣', ic: 'ore', t: 'quest', p: 0, d: '钱多多的作弊秤砣，拿去举报或敲诈', use: 'i40', quest: 1, to: '王大爷 / 钱多多' },
  i40_bingxin: { n: '冰心玉', ic: 'jade', t: 'quest', p: 0, d: '冷月宫冰封之人的心头玉', use: 'i40', quest: 1, to: '冷月仙子' },
  i40_jianzhong: { n: '剑冢誓书', ic: 'scroll', t: 'quest', p: 0, d: '柳如烟立下的誓书，三剑之约的凭据', use: 'i40', quest: 1, to: '柳如烟' },
  i40_huangzhang: { n: '坏账名单', ic: 'debtbook', t: 'quest', p: 0, d: '记账童子三百年抹掉的账，被讨债司发现会出大事', use: 'i40', quest: 1, to: '记账童子 / 天道会计' },
  i40_cuihuabao: { n: '七个荷包', ic: 'bag', t: 'quest', p: 0, d: '翠花绣的七个荷包，每个都绣着你的名字（使用：翠花好感+15）', use: 'i40', quest: 1 },
  i40_lianhun: { n: '联姻帖', ic: 'scroll', t: 'quest', p: 0, d: '某修真世家递来的婚帖（3.8.3 开放）', use: 'i40', quest: 1, clan: 1 },
  i40_zupu_old: { n: '残破古族谱', ic: 'book_o', t: 'quest', p: 0, d: '记载你家祖上曾是修真世家（3.8.3 开放）', use: 'i40', quest: 1, clan: 1 },
  i40_jiezhai_qi: { n: '天道借债契', ic: 'bill', t: 'quest', p: 0, d: '祖传债务的原始契约。上面的担保人签名……是你（使用：查看全文）', use: 'i40', quest: 1 },
  i40_ditu: { n: '藏宝残图', ic: 'scroll', t: 'quest', p: 0, d: '四块拼成一张，指向一处族产「灵矿」（3.8.3 开放）', use: 'i40', quest: 1, clan: 1 },
};
for (const k in ITEMS40) ITEMS40[k].i40 = 1;
Object.assign(ITEMS, ITEMS40);
const GIFTS40 = Object.keys(ITEMS40).filter(k => ITEMS40[k].t === 'gift');
GIFTS40.forEach(k => { if (!GIFTS.includes(k)) GIFTS.push(k); });

const Items40 = {
  V: 1,
  IDS: Object.keys(ITEMS40),
  GIFTS: GIFTS40,
  CLAN: Object.keys(ITEMS40).filter(k => ITEMS40[k].clan),
  PF: ['i40_kuixin_jing', 'i40_mingpan', 'i40_tongxin', 'i40_mixin', 'i40_shenshi'],
  BATTLE: ['i40_huiyuan', 'i40_poxie', 'i40_dunfu', 'i40_leifu'],
  POXIE: new Set(['guiwang', 'collector', 'paper', 'ghost', 'jiangshi', 'demon', 'corpse', 'mozun', 'moguard', 'xian_yaomo', 'guizu']),
  PEEK: { i40_kuixin_jing: ['lg'], i40_mingpan: ['mg'], i40_tongxin: ['taff', { yr: 1 }], i40_mixin: ['sec0'] },
  CAP: { i40_huanyan: 3, i40_kaiqiao: 3 }, CAP_R: { i40_xiaoyao: 3 },
  P: { mixin: 0.05, huaduo: 0.15, dazuo: 0.10, yaocao: 0.15, jianpei: 0.15, songzi: 0.4, caught: 0.5 },
  KIN: ['mom', 'farmer', 'cuihua'],
  HATE: { mentor: '“拿走拿走，看着就想起我那些债主。”', sister: '“你送这个给我？我看起来像那种人吗？”', lengyue: '“俗物。”（冷月仙子连眼皮都没抬）', elder: '“年轻人，心思要放在修炼上。”', mom: '“乱花钱！这得多少灵石？下回不许买了。”', merchant: '“这玩意儿我铺子里有一百个，进价三文。”', danlao: '“甜食伤丹田，拿走。”', sumei: '“啧，这么正经的东西，送错人了吧。”', aoxiao: '“不好玩！我要会动的！”', guzhu: '“雷劈过的东西，药性全毁了。”' },
  HATE_DEF: '“……你是故意的吧？”',
  CONTRACT: '立契人：落魄剑仙（签名潦草，疑似用剑划的）。\n承建：天道营造司。标的：本世界（含山川、灵脉、凡人若干、蚊子不计）。\n尾款：飞升尾款捌仟捌佰捌拾捌灵石整，按年三分计息，利滚利，滚到天荒地老为止。\n担保人：________（这一栏的墨迹比别处新，写的是你的生辰八字）。\n备注：担保人若已转世，债随魂走。若魂也没了，债随名字走。若名字也改了——天道会找到你的。',
  rnd: () => Math.random(),
  G() { return typeof Game !== 'undefined' ? Game.G : null; },
  pf() { return typeof PF38 !== 'undefined' && PF38 && typeof PF38.reveal === 'function' ? PF38 : null; },
  ensure(G) {
    G = G || this.G(); if (!G) return null;
    let S = G.i40; if (!S || typeof S !== 'object') S = G.i40 = {};
    S.v = 1; for (const k of ['cnt', 'cntR', 'giftM', 'yr', 'done', 'pref', 'got']) if (!S[k] || typeof S[k] !== 'object' || Array.isArray(S[k])) S[k] = {};
    for (const k of ['dz', 'luck', 'match']) if (typeof S[k] !== 'number') S[k] = 0;
    for (const k of ['half', 'birth']) if (typeof S[k] !== 'number') S[k] = -1;
    if (!Array.isArray(S.mixin)) S.mixin = [];
    if (!G.inv) G.inv = {}; if (!G.aff) G.aff = {}; if (!G.flags) G.flags = {};
    return S;
  },
  now(G) { G = G || this.G(); try { if (typeof JH34 !== 'undefined' && JH34.now) return JH34.now(G); } catch (e) { } return (G.year || 0) * 12 + (G.month || 0); },
  nm(id) { const N = typeof NPCS !== 'undefined' && NPCS[id]; return N ? N.n : (id === 'mentor' ? '落魄剑仙' : id); },
  short(id) { return String(this.nm(id)).split('·').pop(); },
  toast(s, c) { try { UI.toast(s, c); } catch (e) { } },
  lock(s) { this.toast('🔒 ' + s, '#ffb08a'); return false; },
  rel(id, d) { try { if (typeof Life34 !== 'undefined' && Life34.rel) Life34.rel(id, d); } catch (e) { } },
  relOf(id) { try { const L = typeof Life34 !== 'undefined' && Life34.st && Life34.st(); return (L && L.rel && L.rel[id]) || 0; } catch (e) { return 0; } },
  debtPct(G, p) { const d = Math.round((G.debt || 0) * p); G.debt = Math.max(0, (G.debt || 0) - d); if (G.debt <= 0) try { Game.ach('debt0'); } catch (e) { } return d; },
  async apply(eff) { const r = await Game.apply(eff); return r && r.txt ? r.txt : ''; },
  // 选人：分页（每页 6 个 + 下一页 + 取消）
  async pickNpc(title, text, ids, lab) {
    let pg = 0; const P = 6;
    while (true) {
      const sl = ids.slice(pg * P, pg * P + P); const more = ids.length > (pg + 1) * P;
      const opts = sl.map(id => this.nm(id) + (lab ? lab(id) : '')).concat(more ? ['下一页'] : [], ['取消']);
      const c = await UI.card(title, text, 'i:scroll', opts);
      if (c < sl.length) return sl[c]; if (more && c === sl.length) { pg++; continue; } return null;
    }
  },
  // -------- 商店可见性（门槛） --------
  avail(k, G) {
    G = G || this.G(); const I = ITEMS40[k]; if (!I) return true;
    if (I.clan) return false; // 3.8.3 道具：本版只登记
    if (I.pf && !this.pf()) return false;
    if (!G) return true;
    if (k === 'i40_shenshi') return ((G.aff && G.aff.danlao) || 0) >= 80;
    if (k === 'i40_leifu') return ((G.aff && G.aff.leigong) || 0) >= 40;
    if (k === 'i40_tiezhi') return (G.realm || 0) >= 2;
    return true;
  },
  // -------- 背包使用分派器（返回 true = 已消耗） --------
  async use(k) {
    const G = this.G(); const I = ITEMS40[k]; if (!G || !I || !Game.has(k)) return false; const S = this.ensure(G);
    if (I.use === 'battle') { this.toast('战斗中才能用'); return false; }
    if (I.clan) { this.toast('家族谱系尚未开放（3.8.3）', '#ffd27a'); return false; }
    if (I.pf && !this.pf()) { this.toast('人物详情尚未开放（3.8.0）', '#ffd27a'); return false; }
    const done = (msg, c) => { Game.take(k); try { Sfx.play('heal'); } catch (e) { } if (msg) this.toast(msg, c || '#9aff9a'); try { UI.hud(); } catch (e) { } return true; };
    switch (k) {
      case 'i40_jingxin': if (S.yr.jingxin === G.year) return this.lock('今年已经服过了'); S.dz = 1; S.yr.jingxin = G.year; return done('心如止水：下一次打坐修为翻倍');
      case 'i40_xiaoyao': { const key = k + '@' + (G.realm || 0); if ((S.cntR[key] || 0) >= this.CAP_R[k]) return this.lock('这一境界吃不下了'); S.cntR[key] = (S.cntR[key] || 0) + 1; await Game.apply('life+2'); return done('寿元 +2'); }
      case 'i40_xisui_s': { if (typeof LG36 === 'undefined') return this.lock('灵根纯度尚未开放'); const g = LG36.addPur(8, G); if (!(g > 0)) return this.lock('纯度已满'); return done(`灵根纯度 +${g}（${LG36.pur(G)}/100）`, '#9affd0'); }
      case 'i40_huanyan': case 'i40_kaiqiao': { if ((S.cnt[k] || 0) >= this.CAP[k]) return this.lock('药力已经吃不进去了（终身限3颗）'); S.cnt[k] = (S.cnt[k] || 0) + 1; const t = await this.apply(k === 'i40_huanyan' ? 'cha+1' : 'int+1'); return done(t); }
      case 'i40_shenshi': if (S.yr.shenshi === G.year) return this.lock('今年已经服过了'); S.yr.shenshi = G.year; this.hookPF(); return done('神识清明：今年神识 +3', '#c8a0ff');
      case 'i40_wangyou': {
        const ex = new Set([G.partner, G.fam37 && G.fam37.sp, 'mom'].filter(Boolean)); const L = (typeof Life34 !== 'undefined' && Life34.st && Life34.st()) || { rel: {} };
        const ids = [...new Set(Object.keys(G.aff).filter(id => G.aff[id]).concat(Object.keys(L.rel || {}).filter(id => L.rel[id])))].filter(id => NPCS[id] && !ex.has(id));
        if (!ids.length) return this.lock('没有可以忘掉的人');
        const id = await this.pickNpc('忘忧水', '让谁喝下这碗忘忧水？（好感与恩怨清零）', ids, x => `（♥${G.aff[x] || 0}｜恩怨${(L.rel && L.rel[x]) || 0}）`); if (!id) return false;
        G.aff[id] = 0; if (L.rel) L.rel[id] = 0; return done(`一碗下去，${this.short(id)}看你的眼神像看陌生人`, '#b8d8ff');
      }
      case 'i40_yuelao': if (G.partner || (G.fam37 && G.fam37.sp)) return this.lock('你已经有道侣了'); if (S.match) return this.lock('红线已经系上了'); S.match = 1; return done('月老红线已系：下一次求亲门槛降低', '#ffc0e0');
      case 'i40_songzi': { const F = G.fam37; const sp = (F && F.sp) || G.partner; if (!sp) return this.lock('你还没有道侣'); const mx = (typeof FAM37 !== 'undefined' && FAM37.KID_MAX) || 4; if (F && Array.isArray(F.kids) && F.kids.length >= mx) return this.lock('子嗣已满'); if (S.birth === G.year) return this.lock('今年已经供过了'); S.birth = G.year; return done('送子观音瓶供上了：今年添丁的机会大增', '#ffc0e0'); }
      case 'i40_xingyun': if (S.luck) return this.lock('转运珠还在发光，先等这次好运用掉'); S.luck = 1; return done('转运珠微微发烫：下一次奇遇风声必至', '#ffd23a');
      case 'i40_jiezhai': if (S.half === G.year) return this.lock('今年已经办过延期了'); S.half = G.year; return done('延期还款单已盖章：今年过年时天道利息减半');
      case 'i40_lingshou': if (!Game.activePet()) return this.lock('没有出战的灵宠'); { const t = await this.apply('petexp'); return done(t || '灵兽经验提升'); }
      case 'i40_cuihuabao': { const t = await this.apply('aff:cuihua:15'); return done(t || '翠花好感+15', '#ffc0e0'); }
      case 'i40_jiezhai_qi': G.flags.i40_contract = 1; await UI.card('天道借债契', this.CONTRACT, 'i:bill', ['……']); return false;
      default:
        if (this.PEEK[k]) return this.peek(k);
        if (I.quest) { this.toast(I.to ? `去找 ${I.to} 交付（对话里的「⚑」选项）` : '这是剧情道具', '#ffd27a'); return false; }
    }
    return false;
  },
  // -------- 窥心（§13.5） --------
  async peek(k) {
    const G = this.G(); const S = this.ensure(G); const P = this.pf(); if (!P) return false; const [key, opt] = this.PEEK[k];
    const okFor = id => !!(typeof NPCS !== 'undefined' && NPCS[id]) && !P.has(id, key) && (!key.startsWith('sec') || !!P.secs(id)[+key[3]]);
    const finish = id => { Game.take(k); try { Sfx.play('magic'); } catch (e) { } this.toast(`你看清了${this.short(id)}的${{ lg: '隐藏灵根', mg: '命格', taff: '真实好感', sec0: '秘密①' }[key]}`, '#c8a0ff'); try { Game.save(); } catch (e) { } try { UI.panel('pf38', id); } catch (e) { } return true; };
    if (k === 'i40_mixin') {
      let id = S.mixin.length ? S.mixin.shift() : null; const dead = x => !!(G.jh34 && G.jh34.npcs && G.jh34.npcs[x] && G.jh34.npcs[x].dead);
      if (!id || !okFor(id) || dead(id)) { const c = Object.keys(P.T.fixed).filter(x => okFor(x) && !dead(x)); id = c.length ? c[Math.floor(this.rnd() * c.length) % c.length] : null; }
      if (!id) { Game.take(k); G.stone = (G.stone || 0) + 300; this.toast('信里写的事，你都已经知道了。转手卖了 300 灵石', '#ffd23a'); return true; }
      if (!P.reveal(id, key)) { this.toast('已知晓'); return false; } return finish(id);
    }
    const ids = [...new Set(Object.keys(G.aff).concat(Object.keys(P.T.fixed)))].filter(okFor);
    if (!ids.length) { this.toast('没有可窥探的人了'); return false; }
    const id = await this.pickNpc(ITEMS40[k].n, '要窥探谁？', ids, () => '（可窥）'); if (!id) return false;
    if (!P.reveal(id, key, opt)) { this.toast('已知晓'); return false; }
    return finish(id);
  },
  // -------- 送礼（§13.7） --------
  love(g, id, G) { const I = ITEMS[g]; const L = (I && I.love) || []; const kin = this.KIN.includes(id) || id === G.partner; return L.includes(id) || (L.includes('kin') && kin) || (typeof Talk !== 'undefined' && Talk.prefs && Talk.prefs[id] === g); },
  hate(g, id) { const I = ITEMS[g]; return !!(I && I.hate && I.hate.includes(id)); },
  value(g, id, G) {
    const a = G.aff[id] || 0; let v, kind;
    if (g === 'i40_tiezhi') { v = a >= 60 ? 15 : 3; kind = 'tie'; }
    else if (this.love(g, id, G)) { v = 22; kind = 'love'; }
    else if (this.hate(g, id)) { v = -12; kind = 'hate'; }
    else { v = 8 + Math.floor(this.rnd() * 5); kind = 'like'; }
    const P = this.pf(); if (v > 0 && P) { try { const mg = P.hid(id, G).mg; if (mg === 'n_tianxi') v = Math.round(v * 1.25); else if (mg === 'n_qiongxiang') v += 5; } catch (e) { } }
    return { v, kind };
  },
  async gift(id) {
    const G = this.G(); const N = NPCS[id] || { n: this.nm(id), por: 'npc_mentor' }; const S = this.ensure(G);
    const have = GIFTS.filter(g => ITEMS[g] && Game.has(g));
    if (!have.length) { await UI.say(N.por, N.n, '你身上没有合适的礼物。（桃花酿、暖玉、折扇、蟠桃、灵鱼、古钱可以送人，坊市有卖）', ['好']); return null; }
    const m = this.now(G); if (S.giftM[id] === m) { await UI.say(N.por, N.n, '这个月已经收过你的礼了。', ['好']); return null; }
    let pg = 0, g = null; const PP = have.length > 8 ? 7 : 8;
    while (!g) {
      const sl = have.slice(pg * PP, pg * PP + PP); const more = have.length > (pg + 1) * PP;
      const c = await UI.say(N.por, '送礼', '选择要送的礼物：', [...sl.map(x => `${ITEMS[x].n}（${G.inv[x]}）`), ...(more ? ['下一页'] : []), '算了']);
      if (c < sl.length) g = sl[c]; else if (more && c === sl.length) pg++; else return null;
    }
    Game.take(g); S.giftM[id] = m;
    const { v, kind } = this.value(g, id, G);
    G.aff[id] = Math.max(0, Math.min(150, (G.aff[id] || 0) + v)); if (v < 0) this.rel(id, -3);
    if (kind === 'love') S.pref[id + '@' + g] = 1; else if (kind === 'hate') S.pref[id + '@' + g] = -1;
    G.giftCount = (G.giftCount || 0) + 1; if (G.giftCount >= 20) try { Game.ach('gift'); } catch (e) { }
    try { Sfx.play('pickup'); } catch (e) { }
    const line = kind === 'love' ? '“这、这正是我最喜欢的！”' : kind === 'hate' ? (this.HATE[id] || this.HATE_DEF) : kind === 'tie' ? (v > 3 ? '“……好，我一定到。”' : '“请柬？我们很熟吗？”') : '“谢谢你。”';
    await UI.say(N.por, N.n, line + `（好感${v >= 0 ? '+' : ''}${v}）`, [v < 0 ? '……' : '不客气']);
    return { g, v, kind };
  },
  // 非伙伴 NPC：只要出现在任一 i40 礼物的爱/憎表里（或是 kin），持有礼物时给「送礼」入口（原版只有伙伴和剑仙能送）
  giftNpcs() { if (this._gn) return this._gn; const s = new Set(this.KIN); for (const g of this.GIFTS) for (const x of ITEMS40[g].love.concat(ITEMS40[g].hate)) if (x !== 'kin') s.add(x); return (this._gn = s); },
  // -------- 剧情道具：获得 / 交付（§13.6） --------
  has(id, k) { const P = this.pf(); try { return !!(P && P.has(id, k)); } catch (e) { return false; } },
  reveal(id, k) { const P = this.pf(); try { return !!(P && P.reveal(id, k)); } catch (e) { return false; } },
  gain(G, k, msg) { const S = this.ensure(G); S.got[k] = 1; Game.give(k); try { Sfx.play('pickup'); } catch (e) { } this.toast(`获得【${ITEMS[k].n}】` + (msg ? '：' + msg : ''), '#ffd27a'); try { Game.save(); } catch (e) { } },
  async deliver(G, k, c, eff, extra, txt) {
    const S = this.ensure(G); if (!Game.has(k) || S.done[k]) return false; Game.take(k); S.done[k] = { c };
    let t = eff ? await this.apply(eff) : ''; if (extra) { const t2 = extra(G); if (t2) t = t ? t + '，' + t2 : t2; }
    try { Sfx.play('gong'); } catch (e) { } await UI.card('交付·' + ITEMS[k].n, (txt || '东西交出去了。') + (t ? `\n\n（${t}）` : ''), 'i:' + ITEMS[k].ic, ['好']); try { Game.save(); } catch (e) { } return true;
  },
  R(G) { return 1 + (G.realm || 0); },
  STORY: [
    { k: 'i40_duanjian', get: { npc: 'xianguan', x: '⚑ 打听断剑下落', can: (G, I) => I.has('mentor', 'sec0'), cost: (G, I) => 300 * I.R(G), msg: '记账童子翻了半天仓库账，递给你半截锈剑' },
      give: [{ npc: 'mentor', x: '⚑ 把断剑交给他', eff: 'aff:mentor:15;atkup', pre: (G, I) => { I.reveal('mentor', 'sec1'); }, txt: '剑仙握着那半截剑，很久没说话。然后他把剑插回了自己腰间那半截上——严丝合缝。' }] },
    { k: 'i40_weibali', get: { npc: 'sanniang', x: '⚑ 赎回阿离的尾巴', can: G => !!G.flags.pf_ali_tail, cost: () => 5000, msg: '阴三娘数完灵石，把当票拍在你手里' },
      give: [{ npc: 'ali', x: '⚑ 把当票还给她', eff: 'aff:ali:20', pre: (G, I) => { I.reveal('ali', 'sec1'); }, txt: '阿离接过当票，第九条尾巴从当铺的方向飘了回来，乖乖缠在她腰上。“……谢谢。”' }] },
    { k: 'i40_nilin', get: null,
      give: [{ npc: 'aoxiao', x: '⚑ 还给她', eff: 'aff:aoxiao:30;karma+5', txt: '敖小乐把逆鳞贴在胸口，眼圈一下就红了。' },
        { npc: 'taizi', x: '⚑ 交给龙宫', eff: null, extra: (G, I) => { G.stone = (G.stone || 0) + 10000 * I.R(G); G.karma = (G.karma || 0) - 10; G.aff.aoxiao = 0; I.rel('aoxiao', -40); return `灵石+${10000 * I.R(G)}，业力−10，敖小乐与你反目`; }, txt: '龙宫太子收下逆鳞，赏了你一大箱灵石。远处，敖小乐再也没回头看你。' }] },
    { k: 'i40_diya', get: { npc: 'elder', x: '⚑ 翻一翻旧档', can: G => !!G.flags.pf_elder_mortgage && G.sect === 'qingyun', msg: '藏经阁最底层的抽屉里，压着一纸抵押书' },
      give: [{ npc: 'elder', x: '⚑ 还给掌门', eff: 'contrib+50', pre: (G, I) => { I.reveal('elder', 'sec1'); }, txt: '掌门接过抵押书，长叹一声：“这件事，就烂在你我心里吧。”' },
        { npc: 'xianguan', x: '⚑ 递给讨债司', eff: null, extra: (G, I) => { const d = I.debtPct(G, 0.10); G.aff.elder = 0; I.rel('elder', -50); if (G.sect === 'qingyun') G.contrib = 0; return `欠款−${d}，掌门与你反目${G.sect === 'qingyun' ? '，宗门贡献清零' : ''}`; }, txt: '记账童子眼睛一亮：“青云宗的灵脉？好好好，你的账可以缓缓。”' }] },
    { k: 'i40_bingxin', get: { npc: 'lengyue', x: '⚑ 问冰封之人', can: (G, I) => I.has('lengyue', 'sec0'), msg: '冷月仙子沉默良久，把一块冰凉的玉放进你掌心' },
      give: [{ npc: 'lengyue', x: '⚑ 把玉放回冰棺', eff: 'aff:lengyue:20;flag:i40_ly_jade', txt: '冰棺里的人似乎动了一下。冷月仙子第一次在你面前笑了。' }] },
    { k: 'i40_huangzhang', get: { npc: 'xianguan', x: '⚑ 他抽屉里的册子', can: (G, I) => I.has('xianguan', 'sec0'), msg: '趁他打盹，你摸出了那本册子' },
      give: [{ npc: 'xianguan', x: '⚑ 还给他', eff: 'aff:xianguan:25', extra: (G, I) => `欠款−${I.debtPct(G, 0.05)}`, txt: '记账童子抱着册子差点哭出来，顺手把你的账也抹了一笔。' },
        { npc: 'suanpan', x: '⚑ 交给天道会计', eff: 'karma-15', extra: (G, I) => { G.stone = (G.stone || 0) + 3000 * I.R(G); G.aff.xianguan = 0; I.rel('xianguan', -50); return `灵石+${3000 * I.R(G)}，记账童子与你反目`; }, txt: '天道会计推了推眼镜：“很好。举报有奖。”' }] },
    { k: 'i40_yuejie', get: { npc: 'mom', x: '⚑ 翻家里的旧箱子', can: G => !!G.flags.pf_mom_debt, msg: '箱底压着一张发黄的借据，画押的是娘' },
      give: [{ npc: 'mom', x: '⚑ 收好，不提了', eff: 'aff:mom:10;karma+3', txt: '娘看了一眼，什么也没说，给你多盛了一碗饭。' },
        { npc: 'suanpan', x: '⚑ 拿去讨债司对质', eff: 'karma+2', extra: (G, I) => `欠款−${I.debtPct(G, 0.10)}`, txt: '天道会计对着借据算了三遍：“……利息确实多算了。”' }] },
    { k: 'i40_jiacheng', get: { npc: 'merchant', x: '⚑ 顺走他的秤砣', can: G => !!G.flags.pf_qian_scale, caught: 1, msg: '你把那只假秤砣揣进了袖子' },
      give: [{ npc: 'farmer', x: '⚑ 交给王大爷（举报）', eff: 'karma+5', extra: (G, I) => { I.ensure(G).yr.scale = G.year; return '今年钱多多的店 9 折'; }, txt: '王大爷拎着秤砣去坊市转了一圈。钱多多今年见了你就赔笑。' },
        { npc: 'merchant', x: '⚑ 拿秤砣敲诈他', eff: 'karma-5', extra: (G, I) => { G.stone = (G.stone || 0) + 800 * I.R(G); I.rel('merchant', -30); return `灵石+${800 * I.R(G)}，钱多多记恨于你`; }, txt: '钱多多咬着牙数灵石：“算你狠。”' }] },
    { k: 'i40_lingpai', get: { npc: 'keeper', x: '⚑ 问那块灵牌', can: G => !!G.flags.pf_keeper_tablet, msg: '守墓人把灵牌交给你：“该物归原主了。”' },
      give: [{ npc: 'keeper', x: '⚑ 把灵牌供回去', eff: 'karma+3;life+3', txt: '你给上辈子的自己上了一炷香。香灰落下，你觉得身子轻了些。' }] },
    { k: 'i40_jianzhong', get: { npc: 'ruyan', x: '⚑ 问剑冢之约', can: G => !!G.flags.pf_ruyan_oath, msg: '柳如烟把誓书拍在桌上：“敢不敢？”' },
      give: [{ npc: 'ruyan', x: '⚑ 接她三剑', duel: 1 }] },
    { k: 'i40_jiezhai_qi', get: { npc: '@cuizhai', x: '⚑ 调阅原始契约', can: G => { try { const d = typeof MI === 'function' ? MI('done') : -1; return d >= 0 && (G.main || 0) >= d; } catch (e) { return false; } }, msg: '档案员翻出一张泛黄的契约' }, give: [] },
  ],
  storyOf(k) { return this.STORY.find(s => s.k === k); },
  npcIs(spec, id) { if (spec === '@cuizhai') return !!(NPCS[id] && NPCS[id].map === 'cuizhai'); return spec === id; },
  talkOpts(id, G) {
    const S = this.ensure(G); const out = [];
    for (const st of this.STORY) {
      const k = st.k;
      if (st.get && this.npcIs(st.get.npc, id) && !S.got[k] && !Game.has(k) && !S.done[k] && st.get.can(G, this)) {
        const cost = st.get.cost ? st.get.cost(G, this) : 0;
        out.push([st.get.x + (cost ? `（${cost}灵石）` : ''), async () => {
          if (cost && (G.stone || 0) < cost) { this.toast('灵石不够'); return; } if (cost) G.stone -= cost;
          if (st.get.caught && this.rnd() < this.P.caught) { G.aff[id] = Math.max(0, (G.aff[id] || 0) - 10); this.toast(`被${this.short(id)}发现了！（好感−10）不过秤砣还是到手了`, '#ff9a8a'); }
          this.gain(G, k, st.get.msg);
        }]);
      }
      if (Game.has(k) && !S.done[k]) st.give.forEach((gv, c) => { if (gv.npc !== id) return;
        out.push([gv.x, async () => { if (gv.duel) return this.duel(G, k); if (gv.pre) try { gv.pre(G, this); } catch (e) { } await this.deliver(G, k, c, gv.eff, gv.extra ? g => gv.extra(g, this) : null, gv.txt); }]); });
    }
    return out;
  },
  async duel(G, k) {
    const mon = typeof MONS !== 'undefined' && MONS.ruyan ? 'ruyan' : 'heixin';
    for (let i = 0; i < 3; i++) {
      this.toast(`第${'一二三'[i]}剑！`, '#ffd23a');
      const r = await Game.fight(mon, { elite: true, solo: true, noflee: true });
      if (G.dead) return false; if (!r || r.res !== 'win') { await UI.card('三剑之约', '你没能接下这一剑。柳如烟收剑入鞘：“誓书你先留着，改日再来。”', 'npc_ruyan', ['改日再来']); return false; }
    }
    return this.deliver(G, k, 0, 'aff:ruyan:30;flag:ruyan_duel', null, '三剑接下，柳如烟愣了半晌，把剑穗解下来系在了你的剑上。');
  },
  // -------- PF38 钩子（3.8.0 合入后；加载顺序无关） --------
  hookPF() {
    const P = this.pf(); if (!P || P._i40) return; P._i40 = 1;
    const _ss = P.ss; P.ss = function (G) { const v = _ss.apply(this, arguments); try { G = G || Items40.G(); const S = G && G.i40; if (S && S.yr && S.yr.shenshi === G.year) return v + 3; } catch (e) { } return v; };
    const _rv = P.reveal; P.reveal = function (id, k) { const r = _rv.apply(this, arguments); try { if (r && id === 'aoxiao' && k === 'sec1') { const G = Items40.G(); const S = Items40.ensure(G); if (G && !S.got.i40_nilin && !Game.has('i40_nilin')) Items40.gain(G, 'i40_nilin', '她把逆鳞藏在你送的礼物盒里'); } } catch (e) { } return r; };
  },
};
if (typeof window !== 'undefined') { window.Items40 = Items40; window.ITEMS40 = ITEMS40; }

(function () {
  if (typeof Game === 'undefined' || typeof UI === 'undefined') return;
  const I = Items40;
  // ---- 商店（§13.8） ----
  if (typeof SHOPS !== 'undefined') {
    const add = (s, ks) => { const S = SHOPS[s]; if (!S) return; for (const k of ks) if (!S.items.includes(k)) S.items.push(k); };
    add('yaopu', ['i40_huiyuan', 'i40_jingxin', 'i40_xiangnang']);
    add('merchant', ['i40_dunfu', 'i40_yuzan', 'i40_ganggu', 'i40_zhangben', 'i40_laojiu', 'i40_tiezhi']);
    add('sumei', ['i40_huanyan', 'i40_mozhu']); add('xianguan', ['i40_jiezhai']); add('fisherm', ['i40_yugan', 'i40_lingshou', 'i40_xingyun']); add('qianxd', ['i40_yueguang']);
    const NEW = { sanniang: ['鬼市当铺', ['i40_xiaoyao', 'i40_kuixin_jing', 'i40_wangyou', 'i40_baigu', 'i40_suanpan']], shuoshu: ['茶馆书摊', ['i40_huaben', 'i40_poxie', 'i40_shuguan', 'i40_mingpan']],
      danlao: ['丹房小柜', ['i40_kaiqiao', 'i40_shenshi']], leigong: ['雷部福利', ['i40_leiguo', 'i40_leifu']], guzhu: ['百草谷药圃', ['i40_xisui_s', 'i40_yaocao']], taizi: ['龙宫御膳房', ['i40_longxu']],
      guanghan: ['广寒宫', ['i40_yueguang', 'i40_tongxin', 'i40_songzi', 'i40_yuelao']], farmer: ['王大爷的小摊', ['i40_guihua', 'i40_tanghulu']], guichengxiang: ['龟丞相', ['i40_qiju']], caishen: ['财神庙', ['i40_suanpan']] };
    for (const s in NEW) if (!SHOPS[s] && typeof NPCS !== 'undefined' && NPCS[s]) SHOPS[s] = { n: NEW[s][0], items: NEW[s][1].slice() };
    // 门槛：items 改成 getter（游戏未开局时原样返回，便于其它模块加载期 push）
    for (const s in SHOPS) { const S = SHOPS[s]; if (!S || !Array.isArray(S.items) || !S.items.some(k => ITEMS40[k])) continue; const base = S.items;
      Object.defineProperty(S, 'items', { configurable: true, enumerable: true, get() { const G = I.G(); if (!G) return base; return base.some(k => ITEMS40[k] && !I.avail(k, G)) ? base.filter(k => !ITEMS40[k] || I.avail(k, G)) : base; }, set(v) { if (Array.isArray(v)) { base.length = 0; base.push(...v); } } }); }
    // 举报假秤砣：当年钱多多的店 9 折（只在打开 merchant 店期间临时放大 Market25.buyMod）
    const _shop = UI.shop; UI.shop = function (id) { const G = I.G(); const S = G && G.i40; const M = window.Market25;
      if (id === 'merchant' && S && S.yr && S.yr.scale === G.year && M && M.buyMod && !M._i40) { const _b = M.buyMod; M.buyMod = function () { return _b.apply(this, arguments) * 0.9; }; M._i40 = 1; const p = _shop.apply(this, arguments); const back = () => { M.buyMod = _b; M._i40 = 0; }; if (p && p.then) p.then(back, back); else back(); return p; }
      return _shop.apply(this, arguments); };
  }
  // ---- 背包使用 ----
  const _ui = UI.useItem; UI.useItem = async function (k) { const D = ITEMS40[k]; if (!D || D.use === 'heal' || D.use === 'scroll') return _ui.apply(this, arguments); return I.use(k); };
  // ---- 送礼：重写核心算法，外层复刻 life34 的好感→恩怨同步包装 ----
  if (typeof Talk !== 'undefined') {
    Talk.gift = async function (id) {
      const G = Game.G; if (!G) return; const L = typeof Life34 !== 'undefined' ? Life34 : null; const b = Object.assign({}, G.aff); if (L && L._enter) L._enter();
      try { const r = await I.gift(id); try { if (L && L.syncAff) L.syncAff(b); if (r && r.v > 0 && L && L.onGift) L.onGift(id, r.g); } catch (e) { } return r; } finally { if (L && L._leave) L._leave(); }
    };
    const _ex = Talk.extra; Talk.extra = function (id) { const out = _ex ? _ex.apply(this, arguments) : []; try { const G = Game.G; if (G) {
      out.push(...I.talkOpts(id, G));
      const N = NPCS[id]; if (N && !N.comp && id !== 'mentor' && I.giftNpcs().has(id) && GIFTS.some(g => Game.has(g))) out.push(['送礼', () => Talk.gift(id)]);
    } } catch (e) { console.error('items40 extra', e); } return out; };
    const _npc = Talk.npc; Talk.npc = async function (id) { try { const G = Game.G; if (G && id === 'cuihua') { const S = I.ensure(G); if (!S.got.i40_cuihuabao && !Game.has('i40_cuihuabao') && (G.aff.cuihua || 0) >= 120 && I.has('cuihua', 'sec0')) I.gain(G, 'i40_cuihuabao', '翠花红着脸塞给你一个包袱就跑了'); } } catch (e) { } return _npc.apply(this, arguments); };
  }
  // ---- 静心丹：下一次打坐 ×2 ----
  if (typeof Acts !== 'undefined' && Acts.mat) { const _mat = Acts.mat; Acts.mat = async function (m, bonus) { const G = Game.G; const S = G && G.i40; if (!S || !S.dz) return _mat.apply(this, arguments); const ap0 = G.ap; const r = await _mat.call(this, m, (bonus || 1) * 2); if (ap0 > 0 && G.ap === 0) { S.dz = 0; I.toast('静心丹药力化开，修为翻倍', '#9affd0'); } return r; }; }
  // ---- 野花：采药 15% ----
  if (typeof Acts !== 'undefined' && Acts.herb) { const _hb = Acts.herb; Acts.herb = async function () { const G = Game.G; const ap0 = G ? G.ap : 0; const r = await _hb.apply(this, arguments); try { if (G && G.ap < ap0 && I.rnd() < I.P.huaduo) { Game.give('i40_huaduo'); I.toast('顺手摘了一束野花', '#ffb0c0'); } } catch (e) { } return r; }; }
  // ---- 秘境通关掉落 ----
  const hookDng = () => { const D = window.Dng; if (!D || !D.exit || D._i40) return; D._i40 = 1; const _ex = D.exit; D.exit = function () { const r = this.run; const ok = r && !r.over && r.bossDone && r.floor >= r.maxFloor; const res = _ex.apply(this, arguments); try { if (ok && Game.G) { const got = []; if (I.rnd() < I.P.dazuo) got.push('i40_dazuo'); if (I.rnd() < I.P.yaocao) got.push('i40_yaocao'); if (I.rnd() < I.P.jianpei) got.push('i40_jianpei'); got.forEach(k => Game.give(k)); if (got.length) I.toast('秘境深处还拾得：' + got.map(k => ITEMS[k].n).join('、'), '#ffd23a'); } } catch (e) { } return res; }; };
  hookDng();
  // ---- 密信：路遇结算后 5% ----
  const hookNPC = () => { if (typeof NPC37 === 'undefined' || !NPC37.resolve || NPC37._i40) return; NPC37._i40 = 1; const _rs = NPC37.resolve; NPC37.resolve = async function (scene) { const r = await _rs.apply(this, arguments); try { const P = I.pf(); const G = Game.G; const id = scene && scene.id; if (r && r.ok && P && G && !G.dead && id && P.secs(id)[0] && !P.has(id, 'sec0') && I.rnd() < I.P.mixin) { const S = I.ensure(G); Game.give('i40_mixin'); S.mixin.push(id); I.toast(`${I.short(id)}掉了一封密信`, '#c8a0ff'); } } catch (e) { } return r; }; };
  hookNPC();
  // ---- 年结算：延期还款单（利息减半） ----
  const _ye = Game.yearEnd; Game.yearEnd = async function () {
    const G = this.G; const S = G && G.i40; const y0 = G && G.year; const d0 = G ? (G.debt || 0) : 0; const rate = 0.03 + ((G && G.fam37 && G.fam37.rate) || 0);
    const r = await _ye.apply(this, arguments);
    try { if (G && S && !G.dead && G.year !== y0 && S.half === y0 && d0 > 0) { const save = Math.floor(Math.ceil(d0 * rate) / 2); S.half = -1; if (save > 0) { G.debt = Math.max(0, (G.debt || 0) - save); I.toast(`延期还款单生效：利息减半（省 ${save}）`, '#9aff9a'); } } } catch (e) { }
    return r;
  };
  // ---- 转运珠：luck 只在 Chain37.yearTick 风声掷骰时消耗（VIP yearEnd 的 roll(0.3,'qiyu') 不得偷吃） ----
  I._luckQiyu = 0;
  const _roll = Game.roll; Game.roll = function (p, kind) { const S = this.G && this.G.i40; if (kind === 'qiyu' && S && S.luck && I._luckQiyu) { S.luck = 0; return true; } try { return _roll.apply(this, arguments); } catch (e) { return Math.random() < p; } };
  if (typeof Chain37 !== 'undefined' && Chain37.yearTick) {
    const _yt = Chain37.yearTick; Chain37.yearTick = async function (G) { I._luckQiyu = 1; try { return await _yt.apply(this, arguments); } finally { I._luckQiyu = 0; } };
  }
  // ---- 千年蒲团（持有即生效） ----
  const _cm = Game.cultMult; Game.cultMult = function () { const v = _cm.apply(this, arguments); try { if (this.G && this.has('i40_dazuo')) return v * 1.10; } catch (e) { } return v; };
  // ---- 月老红线 / 送子观音瓶（fam37） ----
  if (typeof FAM37 !== 'undefined') {
    const _cmy = FAM37.canMarry; FAM37.canMarry = function (G, id) { G = G || this.G(); const S = G && G.i40; if (S && S.match) { this.ensure(G); return !!this.T.fam.spouse[id] && !G.fam37.sp && (G.aff[id] || 0) >= 80 && this.relOf(id) >= 40; } return _cmy.apply(this, arguments); };
    const _mr = FAM37.marry; FAM37.marry = function () { const r = _mr.apply(this, arguments); try { const G = Game.G; if (r && G && G.i40 && G.i40.match) { G.i40.match = 0; I.toast('月老红线化作一缕红光，系在了你们腕上', '#ffc0e0'); } } catch (e) { } return r; };
    const _fy = FAM37.famYear; FAM37.famYear = async function (rnd) { const G = this.G(); const F = G && this.ensure(G); const n0 = F ? F.kids.length : 0; const r = await _fy.apply(this, arguments);
      try { const S = G && G.i40; if (S && S.birth >= 0 && S.birth === (G.year || 0) - 1) { S.birth = -1; if (F.kids.length === n0 && F.sp && (rnd || I.rnd)() < I.P.songzi) { const k = this.birth(rnd); if (k) I.toast(`送子观音显灵！子嗣【${k.n}】降生（${this.lgN(k.lg)}）`, '#ffc0e0'); } } } catch (e) { console.warn('items40 songzi', e); } return r; };
  }
  // ---- PF38（3.8.0）钩子：现在或 load 后 ----
  I.hookPF();
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('load', () => { I.hookPF(); hookDng(); hookNPC(); });
  // ---- 战斗道具（§13.4） ----
  const _rbb = UI.renderBB; UI.renderBB = function (sub) { const r = _rbb.apply(this, arguments); try { if (sub === 'item') { const bb = document.querySelector('#battlebar'); const back = bb && bb.querySelector('button[data-a="back"]'); if (bb && back) { const G = Game.G; const html = I.BATTLE.filter(k => Game.has(k)).map(k => `<button data-i="${k}"><i style="${iconCss(ITEMS[k].ic, 30)}"></i>${ITEMS[k].n}<small>×${G.inv[k] || 0}</small></button>`).join(''); if (html) back.insertAdjacentHTML('beforebegin', html); } } } catch (e) { console.warn('items40 bb', e); } return r; };
  if (typeof startBattle === 'function') { const _sb = startBattle; startBattle = function () { try { B.i40 = {}; } catch (e) { } return _sb.apply(this, arguments); }; }
  if (typeof calcDmg === 'function') { const _cd = calcDmg; calcDmg = function (a, d, sk) { const r = _cd.apply(this, arguments); try { if (B && B.i40 && B.i40.poxie && a && a.side === 0 && d && I.POXIE.has(d.mon)) { r.dm = Math.max(1, Math.round(r.dm * 1.2)); r.tag = r.tag ? r.tag + '·破邪' : '破邪'; } } catch (e) { } return r; }; }
  if (typeof doAction === 'function') { const _da = doAction; doAction = async function (a) { if (!(a && a.sk === 'item' && I.BATTLE.includes(a.item))) return _da.apply(this, arguments); return I.battleItem(a); }; }
  I.battleItem = async function (a) {
    const u = a.u; const [ux, uy] = uPos(u); const st = B.i40 || (B.i40 = {}); const ft = (s, c) => floatText(ux, uy - 140 * R.dpr, s, c, 30 * R.dpr, false);
    if (!Game.has(a.item)) { ft('没有了', '#ff8a6a'); await wait(300); return; }
    if (a.item === 'i40_huiyuan') { Game.take(a.item, 1); Sfx.play('heal'); const tgt = (a.t && a.t[0]) || u; const mul = 1 + (Game.G.pillBonus || 0); const h = Math.round(tgt.mhp * 0.5 * mul); tgt.hp = Math.min(tgt.mhp, tgt.hp + h); const [x, y] = uPos(tgt); floatText(x, y - 140 * R.dpr, '+' + h, '#7aff8a', 32 * R.dpr, false); await fx('heal', u, [tgt]); return; }
    if (a.item === 'i40_poxie') { if (st.poxie) { ft('本场已用过破邪符', '#ff8a6a'); await wait(350); return; } Game.take(a.item, 1); st.poxie = 1; Sfx.play('magic'); ft('破邪', '#ffd23a'); await wait(400); return; }
    if (a.item === 'i40_dunfu') { if (B.opts.boss || B.opts.noflee) { ft('此地封了土遁', '#ff8a6a'); await wait(400); return; } Game.take(a.item, 1); Sfx.play('whoosh'); ft('土遁！', '#d8b070'); B.fled = true; await moveUnit(u, 200 * R.dpr, 100 * R.dpr, 400); return; }
    if (a.item === 'i40_leifu') {
      if (st.lei) { ft('本场已用过掌心雷', '#ff8a6a'); await wait(350); return; }
      const foes = B.units.filter(x => x.alive && x.side === 1); if (!foes.length) return; const t = (a.t && a.t[0] && a.t[0].side === 1 && a.t[0].alive) ? a.t[0] : foes.sort((p, q) => p.hp - q.hp)[0];
      Game.take(a.item, 1); st.lei = 1; Sfx.play('magic'); const dm = I.leiDmg(t);
      await fx('thunder', u, [t]); t.hp -= dm; t.anim = 'hurt'; t.flashT = 0.25; const [x, y] = uPos(t); floatText(x, y - 130 * R.dpr, '掌心雷 -' + dm, '#c8a0ff', 36 * R.dpr, false); R.shake = Math.min(0.6, R.shake + 0.4);
      if (t.hp <= 0) { t.hp = 0; kill(t); } await wait(250); return;
    }
  };
  I.leiDmg = t => Math.max(1, Math.round(90 * POW(t.tier || 0) * 0.35 * (t.boss ? 0.5 : 1)));
  // ---- 开发者面板 Tab ----
  if (window.DevPanel && DevPanel.registerTab) DevPanel.registerTab('items40', '道具40', (box, ctx) => {
    const G = Game.G; if (!G) { box.innerHTML = '<p>先开始一局</p>'; return; } const S = I.ensure(G);
    const grp = [['可使用', k => ITEMS40[k].t !== 'gift' && ITEMS40[k].t !== 'quest'], ['礼物', k => ITEMS40[k].t === 'gift'], ['剧情', k => ITEMS40[k].t === 'quest']];
    box.innerHTML = `<p>人物详情 PF38：${I.pf() ? '已加载' : '未合入（窥心类/秘密类不进商店）'}｜静心${S.dz}｜转运${S.luck}｜红线${S.match}｜延期${S.half}｜送子${S.birth}｜密信队列${S.mixin.length}</p>
      <div class="dvb" style="justify-content:flex-start"><button class="sm dvx" data-x="all">全部×3</button><button class="sm dvx" data-x="gifts">礼物各×3</button><button class="sm dvx" data-x="battle">战斗道具各×5</button><button class="sm dvx" data-x="reset">清限用/送礼冷却</button><button class="sm dvx" data-x="flags">点亮剧情道具前置 flag</button><button class="sm dvx" data-x="stone">灵石+50000</button></div>` +
      grp.map(([n, f]) => `<h4>${n}</h4><div class="dvb" style="justify-content:flex-start">${I.IDS.filter(f).map(k => `<button class="sm dvx" data-k="${k}">${ITEMS40[k].n}<small>×${G.inv[k] || 0}</small></button>`).join('')}</div>`).join('');
    box.onclick = e => { const t = e.target.closest('button'); if (!t) return; const x = t.dataset.x, k = t.dataset.k;
      if (k) { Game.give(k, 1); if (k === 'i40_mixin') S.mixin.push(null); ctx.toast(ITEMS[k].n + ' +1'); }
      else if (x === 'all') { I.IDS.forEach(k2 => Game.give(k2, 3)); ctx.toast('60 个 i40 道具各 ×3'); }
      else if (x === 'gifts') { I.GIFTS.forEach(k2 => Game.give(k2, 3)); ctx.toast('20 个礼物各 ×3'); }
      else if (x === 'battle') { I.BATTLE.forEach(k2 => Game.give(k2, 5)); ctx.toast('战斗道具各 ×5'); }
      else if (x === 'reset') { S.cnt = {}; S.cntR = {}; S.yr = {}; S.giftM = {}; ctx.toast('限用计数与送礼冷却已清'); }
      else if (x === 'flags') { ['pf_ali_tail', 'pf_elder_mortgage', 'pf_mom_debt', 'pf_qian_scale', 'pf_keeper_tablet', 'pf_ruyan_oath'].forEach(f => { G.flags[f] = 1; }); ctx.toast('已点亮 6 个 PF38 秘密 flag'); }
      else if (x === 'stone') { G.stone += 50000; ctx.toast('灵石 +50000'); }
      ctx.save(); ctx.rerender(); };
  });
})();

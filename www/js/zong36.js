'use strict';
// ======================= 3.9.10 宗门经营轻层 zong36（规格 docs/research_v36.md §5 + 03_spec_399.md 附录概要） =======================
// 只包装：不改 game.js / talk.js / data.js / ui.js 正文，不升 G.v，老档惰性补默认。
// 宗门 = 弟子容器 + 被动建筑，不做 SLG。元婴（G.realm>=4）后可开山。
// 存档：G.zong36 = { n, lv:1, fame:0, bld:{ cangjing:0, danfang:0, lianqi:0}}；未开山时 G.zong36 缺省，st() 只返回默认视图不写档。
// 口径核对结论（详见 3.9.10 报告；fam37 现有实现为准，research §4 偏差已注明）：
// - 上限：fam37 cap = max(0, min(5, realm-1))，与 research §4「筑基1/金丹2/元婴3/化神4/渡劫5」完全一致（realm 索引：筑基2/金丹3/元婴4/化神5/渡劫6）。
// - 束脩：research 写「300×N/年」（N 在 §4 先定义为上限），fam37 实收 300×实际人数/年；本模块不改此口径，以 fam37 为准。
// - 派遣槽：fam37 slots = PD35.max（若有）= min(4, 1+floor(realm/2))，与 research §4 共享槽公式一致；fam37 对主宠 petA 有豁免，research 未写明，属 fam37 既有偏差，不在本版改。
// - 年 xp：fam37 yearXp = 20×灵根mult×apt×(1+0.1×教学次数)×TAG.xp，与 research 公式一致，仅多一个 TAG.xp 系数（0.9–1.2）；A4.2 在无 TAG 系数时成立。
// - 派遣收益/失败：yieldOf 与 research 一致（40×等级×档位，≥5级×1.5）；失败率 fam37 多 TAG.fail 调整；research 的「10%概率带回碎晶/碎片」在 fam37 中未实现——fam37 的 10% 分支是受伤（hurt），不是带回奖励。
// - 立嗣：fam37 canHeir 在 lvl≥5 之外还要求衣钵空缺且弟子有 npc 归属，比 research 更严，以 fam37 为准。
// - 资质：fam37 apt = 0.6+rnd×0.8（linggen 词条 +0.1 可至 1.5），research 写 0.6–1.4，属轻微上溢，不在本版改。
// 本模块对 §5 含糊处的定稿（不擅自编剧情/数值，只补实现必需的解释）：
// - 「fame 每 100 记名弟子上限 +1（总上限 8）」解为：记名弟子上限加成 = min(8, floor(fame/100))，经包裹 FAM37.cap 实现。
// - 建筑升级费：由当前级 lv 升至 lv+1 = 2000×1.8^lv 灵石（0→1 级 2000，4→5 级 20995），上限 5 级，灵石不足/已满级拒绝且不扣费。
// - G.zong36.lv：§5 未给升级规则，本版恒为 1、仅展示，不编升级效果。
// - 丹房「每月产丹」：丹 = 现有培元丹 pyd；炼器房碎晶 = 现有神器碎晶 sqj（shenqi36 的 ITEMS.sqj）。月结挂 Time27.nextMonth；年度制（monthMode=false）下在 yearEnd 补 12 次月结，避免年度档零产出。
// - 弟子大比「复用 sects25 赛制」：sects25 的 doTournament 是 IIFE 私有函数，无法直接调用且内含玩家战斗卡片；本模块复刻其赛制（三年一届、胜场×10 声望），只结算记名弟子，不动玩家本人的宗门大比与 G.tournWins。
// - 「G.sectRel 正值宗门结盟」：§5 未给数值效果，本版只在面板展示结盟宗门数，不编效果。
// 守卫：storyBlock / B.on / UI.modal（弹卡前）；keepFnMarks；Talk.extra 非数组归一；面板按钮 onclick= 赋值，不叠 listener；选项文案不以「开始」起首；ZONG36.off=true 整模块停用。
const TEXT_ZONG36 = {
meta: { id: 'TEXT_ZONG36', ver: '3.9.10', module: 'zong36.js', title: '宗门经营轻层', basedOn: ['research_v36.md§5', 'fam37.dis36', 'sects25']},
ui: {
sec: '我的宗门', found_title: '开山立派',
found_ask: '元婴已成，可以开山立派了。\n宗门只是弟子们的容身处与几间被动建筑，不争地盘、不打 SLG。\n立派后：藏经阁提弟子修为、丹房按月产丹、炼器房按月出碎晶；弟子每三年大比一次，为宗门挣声望。\n\n山门立起来了，讨债司的第一张贺帖也到了。',
found_ok: '立派', found_cancel: '再想想',
found_done: '宗门立起来了。记名弟子们有了自己的山门。',
need_yuanying: '元婴之后方可开山。',
bld_names: { cangjing: '藏经阁', danfang: '丹房', lianqi: '炼器房'},
bld_descs: { cangjing: '弟子年修为 +8%/级', danfang: '每月产培元丹 lv 颗', lianqi: '每月神器碎晶 +1（lv≥3）'},
up_btn: '升级（{c}灵石）', up_max: '已满级', up_poor: '灵石不够（需 {c}）',
empty: '尚未开山。元婴后找师父立派。',
hint: '声望每满 100，记名弟子上限 +1（最多 +8）。弟子大比三年一届，胜场×10 声望。'
}
};
try { JSON.parse(JSON.stringify(TEXT_ZONG36));} catch (e) { console.warn('[zong36] TEXT invalid', e);}

const ZONG36 = {
off: false,
MAX_BLD: 5,
MAX_CAP_BONUS: 8,
XP_PER_LV: 0.08,
DABI_EVERY: 3,
FAME_PER_WIN: 10,
BLD_KEYS: ['cangjing', 'danfang', 'lianqi'],
G() { try { return typeof Game!== 'undefined'? Game.G: null;} catch (e) { return null;}},
// 老档惰性补默认：G.zong36 缺省时返回默认视图且不写档；已存在但缺键时就地补全（不升 G.v）。
st(G) {
G = G || this.G();
const view = { n: null, lv: 1, fame: 0, bld: { cangjing: 0, danfang: 0, lianqi: 0}, founded: false};
if (!G) return view;
const z = G.zong36;
if (!z || typeof z!== 'object') return view;
if (typeof z.n!== 'string') z.n = '无名宗';
if (typeof z.lv!== 'number' ||!isFinite(z.lv)) z.lv = 1;
if (typeof z.fame!== 'number' ||!isFinite(z.fame) || z.fame < 0) z.fame = 0;
if (!z.bld || typeof z.bld!== 'object') z.bld = {};
for (const k of this.BLD_KEYS) { const v = z.bld[k]; z.bld[k] = (typeof v === 'number' && isFinite(v))? Math.max(0, Math.min(this.MAX_BLD, Math.floor(v))): 0;}
return { n: z.n, lv: z.lv, fame: z.fame, bld: z.bld, founded: true, _ref: z};
},
founded(G) { return!!(G || this.G()) &&!!((G || this.G()).zong36) && typeof (G || this.G()).zong36 === 'object';},
canShow(G) { G = G || this.G(); return!!G && (G.realm || 0) >= 4;},
canFound(G) { G = G || this.G(); return this.canShow(G) &&!this.founded(G);},
defaultName(G) { G = G || this.G(); return (G && G.surname)? (G.surname + '宗'): '无名宗';},
found(G, name) {
G = G || this.G(); if (!G || this.off) return false;
if (!this.canFound(G)) return false;
G.zong36 = { n: name || this.defaultName(G), lv: 1, fame: 0, bld: { cangjing: 0, danfang: 0, lianqi: 0}};
try { if (typeof Game!== 'undefined' && Game.save) Game.save();} catch (e) {}
return true;
},
costFor(lv) { return Math.round(2000 * Math.pow(1.8, Math.max(0, lv | 0)));},
upgrade(G, key) {
G = G || this.G(); if (!G || this.off) return { ok: false, reason: 'off'};
const s = this.st(G); if (!s.founded) return { ok: false, reason: 'nofound'};
if (this.BLD_KEYS.indexOf(key) < 0) return { ok: false, reason: 'key'};
const cur = s.bld[key];
if (cur >= this.MAX_BLD) return { ok: false, reason: 'max', lv: cur};
const cost = this.costFor(cur);
if ((G.stone || 0) < cost) return { ok: false, reason: 'stone', cost, lv: cur};
G.stone -= cost; s.bld[key] = cur + 1;
try { if (typeof Game!== 'undefined' && Game.save) Game.save();} catch (e) {}
return { ok: true, cost, lv: cur + 1};
},
xpMult(G) {
if (this.off) return 1;
const s = this.st(G || this.G());
return 1 + this.XP_PER_LV * (s.bld.cangjing || 0);
},
capBonus(G) {
if (this.off) return 0;
const s = this.st(G || this.G());
return Math.min(this.MAX_CAP_BONUS, Math.floor((s.fame || 0) / 100));
},
giveInv(G, id, n) {
if (!n) return;
G.inv = G.inv || {}; G.inv[id] = (G.inv[id] || 0) + n;
if (G.inv[id] <= 0) delete G.inv[id];
},
monthSettle(G) {
G = G || this.G(); if (!G || this.off) return { pyd: 0, sqj: 0};
const s = this.st(G); if (!s.founded) return { pyd: 0, sqj: 0};
const pyd = s.bld.danfang || 0;
const sqj = (s.bld.lianqi || 0) >= 3? 1: 0;
this.giveInv(G, 'pyd', pyd);
this.giveInv(G, 'sqj', sqj);
return { pyd, sqj};
},
// 弟子大比：三年一届（与 sects25 TOURN_EVERY=3 对齐），记名弟子各打一场，胜场×10 声望。
dabi(G, rnd) {
G = G || this.G(); if (!G || this.off) return { wins: 0, total: 0, fame: 0};
const s = this.st(G); if (!s.founded) return { wins: 0, total: 0, fame: 0};
if (((G.year || 0) % this.DABI_EVERY)!== 0) return { wins: 0, total: 0, fame: 0};
rnd = rnd || Math.random;
const ds = Array.isArray(G.dis36)? G.dis36: [];
let wins = 0;
for (const d of ds) {
const p = Math.min(0.9, 0.5 + 0.05 * Math.max(0, ((d && d.lvl) || 1) - 1));
if (rnd() < p) wins++;
}
const gain = wins * this.FAME_PER_WIN;
s._ref.fame = (s._ref.fame || 0) + gain;
return { wins, total: ds.length, fame: gain};
},
allyCount(G) {
G = G || this.G(); if (!G ||!G.sect ||!G.sectRel || typeof G.sectRel!== 'object') return 0;
let n = 0;
for (const k in G.sectRel) {
if ((G.sectRel[k] || 0) > 0 && String(k).split('|').indexOf(G.sect) >= 0) n++;
}
return n;
},
entryFor(G, id) {
G = G || this.G(); if (!G || id!== 'mentor') return null;
if (!this.canShow(G)) return null;
return this.founded(G)? '🏯 我的宗门': '🏯 开山立派';
},
storyBlock() {
try {
if (typeof NPC37!== 'undefined' && NPC37 && typeof NPC37.storyBlock === 'function') { const r = NPC37.storyBlock(); if (r) return r;}
} catch (e) {}
try { if (typeof B!== 'undefined' && B && B.on) return 'battle';} catch (e) {}
try { if (typeof UI!== 'undefined' && UI && UI.modal) return 'modal';} catch (e) {}
return null;
},
canPopup() { return!this.off &&!this.storyBlock();},
toast(m, col) { try { if (typeof UI!== 'undefined' && UI && UI.toast) UI.toast(m, col);} catch (e) {}},
async foundCard() {
const G = this.G(); if (!G) return false;
if (!this.canFound(G)) { this.toast(TEXT_ZONG36.ui.need_yuanying); return false;}
if (!this.canPopup()) return false;
const c = await UI.card(TEXT_ZONG36.ui.found_title, TEXT_ZONG36.ui.found_ask, 'npc_mentor', [TEXT_ZONG36.ui.found_ok, TEXT_ZONG36.ui.found_cancel]);
if (c!== 0) return false;
if (!this.found(G)) return false;
this.toast(TEXT_ZONG36.ui.found_done.replace('{n}', G.zong36.n), '#ffd23a');
try { if (UI.panel) await UI.panel('zong36');} catch (e) {}
return true;
},
html(G) {
G = G || this.G(); const s = this.st(G);
if (!s.founded) return `<div class="zong36"><p class="hint">${TEXT_ZONG36.ui.empty}</p></div>`;
const U = TEXT_ZONG36.ui;
const rows = this.BLD_KEYS.map(k => {
const lv = s.bld[k];
const cost = this.costFor(lv);
const btn = lv >= this.MAX_BLD
? `<button class="opt" disabled style="opacity:.45">${U.up_max}</button>`
: ((G.stone || 0) >= cost
? `<button class="opt" data-z="up" data-k="${k}">${U.up_btn.replace('{c}', cost)}</button>`
: `<button class="opt" disabled style="opacity:.45">${U.up_poor.replace('{c}', cost)}</button>`);
return `<div class="zong36r"><b>${U.bld_names[k]} Lv${lv}/5</b><small>${U.bld_descs[k]}</small>${btn}</div>`;
}).join('');
const disN = Array.isArray(G.dis36)? G.dis36.length: 0;
const cap = (typeof FAM37!== 'undefined' && FAM37.cap)? FAM37.cap(G): disN;
return `<div class="zong36"><b>🏯 ${s.n}（宗门 Lv${s.lv}）</b><p class="hint">声望 ${s.fame}　记名弟子 ${disN}/${cap}（声望加成 +${this.capBonus(G)}）　结盟宗门 ${this.allyCount(G)} 个<br>灵石 ${(G.stone || 0)}</p>${rows}<p class="hint">${U.hint}</p></div>`;
},
keepFnMarks(src, dst, selfMark) {
if (!src ||!dst) return dst;
try {
for (const k of Object.keys(src)) {
if (k.charAt(0)!== '_') continue;
if (selfMark && k === selfMark) continue;
try { dst[k] = src[k];} catch (e) {}
}
} catch (e) {}
return dst;
},
wire() {
if (this.off || this._wired) return!!this._wired;
try {
// 藏经阁：包裹 FAM37.yearXp，弟子年修为按 (1+8%/级) 放大；A5.1：3 级时 20→24.8。
if (typeof FAM37!== 'undefined' && FAM37 && typeof FAM37.yearXp === 'function' &&!FAM37.yearXp._zong36) {
const _yx = FAM37.yearXp;
FAM37.yearXp = function (d) {
const base = _yx.call(this, d);
const G = (typeof this.G === 'function')? this.G(): ((typeof Game!== 'undefined')? Game.G: null);
return Math.round(base * ZONG36.xpMult(G) * 100) / 100;
};
FAM37.yearXp._zong36 = 1;
this.keepFnMarks(_yx, FAM37.yearXp, '_zong36');
}
// 声望加成：包裹 FAM37.cap，记名弟子上限 = 原上限 + min(8, floor(fame/100))。
if (typeof FAM37!== 'undefined' && FAM37 && typeof FAM37.cap === 'function' &&!FAM37.cap._zong36) {
const _cap = FAM37.cap;
FAM37.cap = function (G) {
const base = _cap.call(this, G);
const g = G || ((typeof this.G === 'function')? this.G(): ((typeof Game!== 'undefined')? Game.G: null));
return base + ZONG36.capBonus(g);
};
FAM37.cap._zong36 = 1;
this.keepFnMarks(_cap, FAM37.cap, '_zong36');
}
// 入口：师父对话；未元婴不显示（A5.2）。
if (typeof Talk!== 'undefined' && Talk && typeof Talk.extra === 'function' &&!Talk.extra._zong36) {
const _ex = Talk.extra;
Talk.extra = function (id) {
let out = null;
try { out = _ex? _ex.call(this, id): [];} catch (e) { out = [];}
if (!Array.isArray(out)) out = [];
const G = (typeof Game!== 'undefined')? Game.G: null;
const label = ZONG36.entryFor(G, id);
if (label) out.push([label, async () => {
if (ZONG36.founded(Game.G)) { try { await UI.panel('zong36');} catch (e) {}}
else await ZONG36.foundCard();
}]);
return out;
};
Talk.extra._zong36 = 1;
this.keepFnMarks(_ex, Talk.extra, '_zong36');
}
// 面板：UI.p_zong36；按钮 onclick= 赋值，不叠 listener。
if (typeof UI!== 'undefined' && UI) {
if (!UI.titles) UI.titles = {};
UI.titles.zong36 = TEXT_ZONG36.ui.sec;
UI.p_zong36 = function (b) {
b.innerHTML = ZONG36.html();
b.onclick = (e) => {
const t = e.target && e.target.closest? e.target.closest('button[data-z]'): null;
if (!t || t.disabled) return;
if (t.dataset.z === 'up') { ZONG36.upgrade(); b.innerHTML = ZONG36.html();}
};
};
}
// 年结：年度制下补 12 次月结（月级制下由 nextMonth 结算，此处跳过防重复）；三年一届弟子大比。
if (typeof Game!== 'undefined' && Game && Game.yearEnd &&!Game.yearEnd._zong36) {
const _ye = Game.yearEnd;
Game.yearEnd = async function () {
const G = this.G; const y0 = G && G.year;
const r = await _ye.apply(this, arguments);
try {
if (!ZONG36.off && G &&!G.dead && G.year!== y0 && ZONG36.founded(G)) {
const monthOn = (typeof Time27!== 'undefined' && Time27 && typeof Time27.on === 'function')? Time27.on(): false;
if (!monthOn) { for (let i = 0; i < 12; i++) ZONG36.monthSettle(G);}
if ((G.year || 0) % ZONG36.DABI_EVERY === 0) {
const res = ZONG36.dabi(G);
if (res.fame > 0) ZONG36.toast(`弟子大比：胜 ${res.wins}/${res.total} 场，宗门声望 +${res.fame}`, '#ffd23a');
}
try { if (Game.save) Game.save();} catch (e) {}
}
} catch (e) { try { console.warn('[zong36] yearEnd', e);} catch (e2) {}}
return r;
};
Game.yearEnd._zong36 = 1;
this.keepFnMarks(_ye, Game.yearEnd, '_zong36');
}
// 月结：Time27.nextMonth 之后结算一次（月级制默认开启时的主路径）。
if (typeof Time27!== 'undefined' && Time27 && Time27.nextMonth &&!Time27.nextMonth._zong36) {
const _nm = Time27.nextMonth;
Time27.nextMonth = async function () {
const r = await _nm.apply(this, arguments);
try {
const G = (typeof Game!== 'undefined')? Game.G: null;
if (!ZONG36.off && G &&!G.dead && ZONG36.founded(G)) ZONG36.monthSettle(G);
} catch (e) { try { console.warn('[zong36] nextMonth', e);} catch (e2) {}}
return r;
};
Time27.nextMonth._zong36 = 1;
this.keepFnMarks(_nm, Time27.nextMonth, '_zong36');
}
// DevPanel：调试入口（文案不以「开始」起首）。
try {
if (typeof DevPanel!== 'undefined' && DevPanel && DevPanel.registerTab) {
DevPanel.registerTab('zong36', '宗门36', (box, ctx) => {
box.innerHTML = ['found:立派', 'dabi:弟子大比结算', 'month:过月结算', 'open:打开宗门面板'].map(x => `<button class="opt" data-x="${x.split(':')[0]}">${x.split(':')[1]}</button>`).join('');
box.onclick = async (e) => {
const x = e.target && e.target.dataset? e.target.dataset.x: null;
const G = (typeof Game!== 'undefined')? Game.G: null;
if (!x ||!G) return;
if (x === 'found') { if (G.realm < 4) G.realm = 4; ctx.toast(ZONG36.found(G)? '已立派': '已立派/未满足');}
if (x === 'dabi') { const res = ZONG36.dabi(G); ctx.toast(`大比胜 ${res.wins}/${res.total}，声望 +${res.fame}`);}
if (x === 'month') { const res = ZONG36.monthSettle(G); ctx.toast(`本月产丹 ${res.pyd}、碎晶 ${res.sqj}`);}
if (x === 'open') { try { await UI.panel('zong36');} catch (err) {}}
try { if (ctx.save) ctx.save();} catch (err) {}
};
});
}
} catch (e) {}
try {
if (typeof document!== 'undefined' && document && document.createElement && document.head) {
const css = document.createElement('style');
css.textContent = '.zong36{margin-top:12px;padding:10px;border-radius:10px;background:rgba(255,210,58,.08);border:1px solid rgba(255,210,58,.4)}.zong36>b{display:block;font-size:16px;color:#ffd23a}.zong36 p{margin:4px 0}.zong36r{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:6px 0}.zong36r small{opacity:.85;flex:1 1 100%}';
document.head.appendChild(css);
}
} catch (e) {}
this._wired = true;
} catch (e) { try { console.warn('[zong36] wire', e);} catch (e2) {}}
return!!this._wired;
}
};
(function () { try { ZONG36.wire();} catch (e) {}})();

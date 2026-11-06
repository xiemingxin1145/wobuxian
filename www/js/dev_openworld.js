'use strict';
// 开放世界线 · 开发者按钮（dev_openworld.js）——从 dev_entry_v25.js 挪出（dev_entry_v25.js 恢复为 main 原样）。
//
// 按钮：试炼场（覆盖层 iframe / 取消 = 阶段3 债务奇遇）· 全套神装 · 即时战（覆盖层原型）· 奇遇链（钱多多）· 查账链（记账童子）
//       · 追兵战（债压档位）· 突破预估（只读）· 讨债令（只读：x/9、今年是否已领）· 追兵调参（开发者覆盖 + 一键预设）。行为与 openworld-wip aa00519 时 dev_entry_v25.js 里的同名按钮一致。
//
// 只在开发者模式生效：唯一判定 localStorage.wbx2_dev === '1'（main ux23.js 的持久开关，版本号 7 连点切换；APK 重启后仍保持），每秒轮询跟随开/关。
//   非开发者模式：本文件只挂一个空壳 window.DevOpenWorld（active=false），不加载任何原型脚本、不建任何 DOM。
//   开发者模式开启时才懒加载原型脚本（release 包里它们不再由 index.html 直接加载）：
//     js/battle_realtime_prototype.js（RealtimeBattle）、js/stage3_encounter_draft.js（Stage3）、js/lowpoly_box_chars.js（LowpolyBox，供即时战方块皮肤对比手感）。
//     主页面开发者入口会懒加载低模，用于「即时战」按钮选择皮肤；独立预览页仍可单独打开。
//
// 挂载 API（给 3.4.1 作弊菜单的「开放世界」页签用；本文件不碰 ux23.js）：
//   window.DevOpenWorld = {
//     id: 'openworld', title: '开放世界',
//     active: boolean,                 // 是否已进入开发者模式（原型脚本已开始加载）
//     buttons: [{ key, label, run }],  // run(): Promise —— 先等原型脚本加载完，再执行按钮逻辑
//     ready(): Promise | false,        // 开发者模式下加载原型脚本并等加载完；非开发者模式返回 false、什么都不加载
//     mount(containerEl): () => void,  // 把按钮渲染进宿主容器（每个 <button class="dow-btn" data-key=…>），返回卸载函数；
//                                      //   任何一次 mount 后，下面的浮动兜底入口自动隐藏（卸载全部后恢复）
//   }
// 3.4.1 作弊菜单页签（Grok Bot 定的接口）：开发者模式下登记
//   DevPanel.registerTab('openworld', '开放世界', render)（dev341 已加载时），否则 (window.DevTabs = window.DevTabs || []).push({ key: 'openworld', id: 'openworld', name: '开放世界', render(el) })
//   dev341 的 DevPanel.tabs() 按 key 过滤；菜单遍历 DevTabs，一项一个页签，调用 render(页签容器)；render 返回 unmount。只登记一次（文件执行两次也不重复）；非开发者模式不登记。
// 兜底入口：开发者模式下左侧一个「开放世界」浮动按钮（main 3.4.1 的 试炼场/全套神装/即时战 下方 top:342px，z-index 7 在弹窗层之下、只在游戏内显示，不盖底部菜单/开发者面板），
//   点开一个按钮面板（#dow-open 打开 #dow-panel，按钮 id = dow-<key>）。非开发者模式不出现；宿主 mount() 过就隐藏。

(function () {
  const SCRIPTS = ['js/battle_realtime_prototype.js', 'js/stage3_encounter_draft.js', 'js/lowpoly_box_chars.js'];
  // game.js / ui.js 用顶层 `const Game` / `const UI` 声明：是全局词法绑定，不挂在 window 上（window.Game 恒为 undefined），必须用 typeof 取
  const gameObj = () => (typeof Game !== 'undefined' && Game ? Game : null);
  const uiObj = () => (typeof UI !== 'undefined' && UI ? UI : null);
  const toast = (...a) => { const u = uiObj(); if (u && u.toast) u.toast(...a); };

  // 债务强化 #7：追兵档位参数的开发者覆盖。只有这里读 localStorage 专用键（JSON），交给 Stage3.bountyTuning 校验/钳制后只给开发者「追兵战」用；
  // 不写进游戏存档（wbx2_save），正式游戏逻辑不读。坏 JSON / 非对象 → 回退默认表，并在「追兵调参」卡片与追兵战提示里标出。
  const TUNING_KEY = 'wbx_dev_bounty_tuning';
  function readBountyTuning() {
    let raw = null;
    try { raw = localStorage.getItem(TUNING_KEY); } catch (e) { raw = null; }
    if (raw == null || raw === '') return Object.assign(Stage3.bountyTuning(null), { raw: null });
    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) {
      return Object.assign(Stage3.bountyTuning(null), { raw, source: 'invalid', error: '覆盖不是合法 JSON（' + String(e && e.message || e).slice(0, 40) + '），已用默认表' });
    }
    if (parsed === null) return Object.assign(Stage3.bountyTuning(null), { raw, source: 'invalid', error: '覆盖不是 JSON 对象（null），已用默认表' });
    const r = Stage3.bountyTuning(parsed);
    if (r.error) r.source = 'invalid';
    return Object.assign(r, { raw });
  }
  const short = v => { let t; try { t = JSON.stringify(v); } catch (e) { t = String(v); } t = t === undefined ? String(v) : t; return t.length > 24 ? t.slice(0, 24) + '…' : t; };
  function tuningCardText(tu) {
    const T = tu.table, B = T.boss, L = [];
    L.push(tu.error ? '⚠ ' + tu.error : tu.raw == null ? '未设置覆盖：使用默认表' : tu.changed.length ? `覆盖生效：改了 ${tu.changed.length} 项` : '覆盖里没有改动任何数值：等同默认表');
    const pm = Stage3.bountyPresetOf ? Stage3.bountyPresetOf(tu.table) : null;
    L.push(pm ? `当前预设：${pm.n}（${pm.note}）` : '当前：自定义覆盖（不等于任何预设）');
    const mark = new Set(tu.changed.map(c => c.path));
    const m = (i, f, txt) => txt + (mark.has('tiers.' + Stage3.DEBT_TIERS[i].key + '.' + f) ? '*' : '');
    Stage3.DEBT_TIERS.forEach((d, i) => {
      const v = T.tiers[i];
      L.push(`${d.n}：${m(i, 'hunters', v.hunters + ' 只')} ${m(i, 'hpMul', '血×' + v.hpMul)} ${m(i, 'atkCdMul', '冷却×' + v.atkCdMul)} ${m(i, 'windMul', '前摇×' + v.windMul)} ${m(i, 'shotCount', v.shotCount + ' 发')}/${m(i, 'shotSpread', v.shotSpread + '°')} ${m(i, 'spdAdd', '移速+' + v.spdAdd)}`);
    });
    const mb = (f, txt) => txt + (mark.has('boss.' + f) ? '*' : '');
    L.push(`通缉头子环弹：${mb('ringShots', B.ringShots ? B.ringShots + ' 发' : '不放')} ${mb('ringWarn', '预警 ' + B.ringWarn + 's')} ${mb('ringCd', '间隔 ' + B.ringCd + 's')}`);
    if (tu.changed.length) L.push('已覆盖（*）：' + tu.changed.map(c => `${c.path} ${c.from}→${c.to}`).join('；'));
    if (tu.clamped.length) L.push('已钳制：' + tu.clamped.map(c => `${c.path} ${short(c.value)}→${c.to}`).join('；'));
    if (tu.rejected.length) L.push('非法，回退默认：' + tu.rejected.map(c => `${c.path}=${short(c.value)}（${c.why}）`).join('；'));
    if (tu.unknown.length) L.push('未知字段，已忽略：' + tu.unknown.join('、'));
    L.push(`改法：点下方预设一键写入（好躲 / 原样 = 清除覆盖 / 地狱），或 localStorage 键 ${TUNING_KEY} 写 JSON，如 {"tiers":{"wanted":{"shotCount":5}},"boss":{"ringShots":12}}。只影响开发者「追兵战」，不进存档。`);
    return L.join('\n');
  }

  // 债务强化 #8：一键预设（Stage3.BOUNTY_TUNING_PRESETS）。整个开发者入口唯一一处写 localStorage：只写调参专用键 TUNING_KEY，
  // 预设 override 为 null（「原样」）= 删键回到默认表。不碰游戏存档（wbx2_save）、不调 Game.save。
  function writeBountyPreset(p) {
    try {
      if (p.override == null) localStorage.removeItem(TUNING_KEY);
      else localStorage.setItem(TUNING_KEY, JSON.stringify(p.override));
      return true;
    } catch (e) { return false; }
  }


  const BTN_CSS = 'padding:8px 14px;border-radius:20px;font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,.4);cursor:pointer;';
  const BUTTONS = [
      // 试炼场按钮（覆盖层iframe，不跳页）
    { key: 'entry', label: '试炼场', bg: '#2a3a5a', fg: '#ffe680', run: async () => {
        const c = confirm('进入独立遭遇战原型？\n（覆盖层打开，不影响存档，可关闭返回）\n\n取消则执行阶段3债务奇遇。');
        if (c) {
          openEncounterOverlay();
        } else if (window.Stage3 && gameObj() && gameObj().G) {
          await Stage3.test(gameObj().G);
        }
    } },
      // 一键全套神装按钮
    { key: 'eq', label: '全套神装', bg: '#3a2a5a', fg: '#ffb0ff', run: async () => {
        if (!gameObj() || !gameObj().G) { toast('请先开始一局（没有存档）'); return; }
        if (!confirm('一键生成并穿上全套最高品质装备？\n（仅开发者模式，影响当前存档）')) return;
        giveFullGodGear();
        toast('已穿上全套神装', '#ffb0ff');
        const u = uiObj(); if (u && u.hud) u.hud();
    } },
      // 即时战斗按钮
    { key: 'rt', label: '即时战', bg: '#2a5a3a', fg: '#b0ffb0', run: async () => {
        // 自带覆盖层画布 + 循环，打完/× / Escape 关闭；不接正式战斗链、不改存档
        // 2026-11-06：询问是否用方块低模皮肤对比手感（需已加载 LowpolyBox）
        if (window.RealtimeBattle && RealtimeBattle.open) {
          const useBox = window.LowpolyBox && confirm('用方块低模皮肤（青衫剑修等）对比手感？\n取消则用原有精灵。');
          RealtimeBattle.open(null, { force: true, skin: useBox ? 'box' : 'sprite', boxPlayer: useBox ? 'jianxiu' : null });
        }
    } },
      // 奇遇链按钮：阶段 3 小闭环 #2「钱多多的赊账单」（奇遇选择 → 钱多多态度 → 债务后果），会改当前存档
    { key: 'qy', label: '奇遇链', bg: '#5a4a2a', fg: '#ffd8a0', run: async () => {
        const g = gameObj();
        if (!window.Stage3 || !g || !g.G) { toast('请先开始一局（没有存档）'); return; }
        await Stage3.runMerchantChain(g.G);
    } },
      // 查账链按钮：阶段 3 小闭环 #3「记账童子的错账」（仙官·记账童子 + 天道债务），会改当前存档
    { key: 'qy2', label: '查账链', bg: '#4a3a5a', fg: '#e0c8ff', run: async () => {
        const g = gameObj();
        if (!window.Stage3 || !g || !g.G) { toast('请先开始一局（没有存档）'); return; }
        await Stage3.runLedgerChain(g.G);
    } },
      // 追兵战按钮：债务系统强化 #1/#2——按当前债压档位（Stage3.debtPressure）刷讨债鬼进即时战原型；
      // 打完按胜负结算（Stage3.settleBounty：胜撤通缉、败加误工费）并存档；中途关掉不结算。不发奖。
      // 债务强化 #4：重债/天道通缉档追兵出手更快、前摇更短、弹道散射（参数由 bountyEnemies 带上），顶栏与结算卡标注档位特性。
      // 债务强化 #5：天道通缉档「讨债鬼头子」前冲收招后放一圈环形弹（ringShots/ringWarn/ringCd 由 bountyEnemies 只给头子），toast 与结算卡加「头子：…」。
      // 第十二轮：当年已有仇家上门 → 不开追兵战（Stage3.canHunt）；打完结算时 settleBounty 记 flags.s3b_hunt_year（给 life34 侧读，挡同年仇家上门）。
      // 债务强化 #6：天道通缉档打赢且头子被打倒（原型结束带 defeated 名单）→ settleBounty 记一枚「讨债令」凭证（flags.s3b_token），结算卡加一行说明；不发正式物品。第十八轮：上限 9 枚 + 每年一枚冷却，被挡时结算卡说明原因。
    { key: 'zb', label: '追兵战', bg: '#5a2a2a', fg: '#ffb0a0', run: async () => {
        const g = gameObj();
        if (!window.Stage3 || !g || !g.G) { toast('请先开始一局（没有存档）'); return; }
        if (!window.RealtimeBattle || !RealtimeBattle.open) return;
        const G = g.G;
        // 第十二轮：与 life34「仇家上门」同一年互斥——当年已有仇家上门（或仇家正在路上）就不开追兵战（Stage3.canHunt 只读）
        const gate = typeof Stage3.canHunt === 'function' ? Stage3.canHunt(G) : { ok: true };
        if (!gate.ok) { toast('追兵战不触发：' + gate.note, '#cccccc'); return; }
        // 债务强化 #7：读开发者调参覆盖（没设 = 默认表，与 c46c1ef 完全一样）
        const tu = readBountyTuning();
        const P = Stage3.debtPressure(G, tu.table);
        const h = RealtimeBattle.open(Stage3.bountyEnemies(G, tu.table), { force: true, label: '追兵·' + P.n + (P.trait ? '·' + P.trait : '') });
        if (!h) return;
        const tuneTag = tu.error ? '【调参表无效，已用默认】' : tu.changed.length ? `【开发者调参 ${tu.changed.length} 项】` : '';
        toast(`债压「${P.n}」（欠 ${P.debt}${P.bounty ? '，被通缉' : ''}）：${P.hunters} 个讨债鬼追上来了${P.trait ? '（' + P.trait + '）' : ''}${P.bossMove ? '，头子会' + P.bossMove : ''}${tuneTag}`, '#ffb0a0');
        const r = await h.done; // 第二十二轮：r 带 time / hits / dodged，结算卡加一行「本场：用时…受击…闪避…」（Stage3.fightStats 只读）
        const s = Stage3.settleBounty(G, Object.assign({}, r, { tier: P.tier }));
        if (s.settled && typeof g.save === 'function') g.save();
        if (h.closed) await h.closed;
        const u = uiObj();
        if (!s.settled) { toast('中途离场：追兵战不结算', '#cccccc'); return; }
        // 讨债令抵扣误工费（主人已批准）：败场且持有讨债令 → 先问是否花 1 枚抵掉；同意则扣令、不记误工费并存档
        if (Stage3.canOffsetFee && Stage3.canOffsetFee(G, s) && u && u.card) {
          const pick = await u.card(Stage3.TOKEN_NAME + '抵扣', `这场输了，讨债司要记误工费 ${s.fee}（欠款 ${s.debtBefore} → ${s.debtAfter}）。\n你有 ${Stage3.tokenCount(G)} 枚${Stage3.TOKEN_NAME}，花 ${Stage3.TOKEN_FEE_COST} 枚抵掉这笔？`, 'i:bill', ['花 1 枚抵掉', '照付误工费']);
          if (pick === 0 && Stage3.offsetFee(G, s).ok) {
            if (typeof g.save === 'function') g.save();
            toast(`${Stage3.TOKEN_NAME}抵掉误工费 ${s.fee}，剩 ${s.tokens} 枚`, '#ffe0a0');
          }
        }
        if (u && u.card) {
          await u.card('追兵战结算', `${s.result === 'win' ? '胜' : '败'}·${s.n}\n${s.note}${Stage3.fightStats ? '\n' + Stage3.fightStats(r).line : ''}\n债务：${s.debtBefore} → ${s.debtAfter}${s.bountyCleared ? '\n通缉已撤销' : ''}${s.token ? `\n缴获${Stage3.TOKEN_NAME}×1（共 ${s.tokens} 枚）：追兵战输了可花 1 枚抵掉误工费` : ''}${s.tokenBlocked === 'cap' ? `\n${Stage3.TOKEN_NAME}已满 ${Stage3.TOKEN_MAX} 枚，这次没再缴获` : s.tokenBlocked === 'cooldown' ? `\n今年已缴获过${Stage3.TOKEN_NAME}，明年再来` : ''}\n追兵特性：${P.traitNote}${P.bossNote ? '\n头子：' + P.bossNote : ''}${tu.error ? '\n调参表无效，本场用默认表' : tu.changed.length ? `\n开发者调参：${tu.changed.length} 项生效（见「追兵调参」）` : ''}`, 'i:bill', ['好']);
          if (u.hud) u.hud();
        }
    } },
      // 突破预估按钮：债务系统强化 #3——按债压档位预估「欠得多突破更难」（Stage3.breakthroughPreview），只读：不改存档、不动正式突破
    { key: 'tp', label: '突破预估', bg: '#2a4a5a', fg: '#a0e8ff', run: async () => {
        const g = gameObj(); const u = uiObj();
        if (!window.Stage3 || !g || !g.G) { toast('请先开始一局（没有存档）'); return; }
        if (!u || !u.card) return;
        const p = Stage3.breakthroughPreview(g.G, g);
        const head = `债压：${p.tierName}（欠 ${p.debt}${p.bounty ? '，被通缉 +1 档' : ''}）`;
        const body = !p.applicable ? `${head}\n${p.note}` :
          `${p.from && p.to ? `境界：${p.from} → ${p.to}${p.ready ? '' : '（修为未圆满，仅预估）'}\n` : ''}${head}\n` +
          `基础成功率：约 ${p.base}%${p.source === 'game' ? '（现行突破公式）' : '（默认值）'}${p.pills.length ? '，含' + p.pills.join('、') : ''}\n` +
          `债压惩罚：−${p.penalty} 个百分点\n预估成功率：约 ${p.estimate}%\n${p.note}`;
        await u.card('突破预估', body, 'i:sk_meditate', ['知道了']);
    } },
      // 讨债令按钮（第二十一轮）：讨债令第一个只读用途——显示「讨债令 x/9，今年是否已领」（Stage3.tokenInfo 纯函数），不改存档、不调 Game.save
      // 第三十三轮：卡片下半加「抵扣误工费预览」（Stage3.tokenFeePreview 纯函数，只读，不真正抵扣）
    { key: 'lt', label: '讨债令', bg: '#3a3a2a', fg: '#ffe0a0', run: async () => {
        const g = gameObj(); const u = uiObj();
        if (!window.Stage3 || !Stage3.tokenInfo || !g || !g.G) { toast('请先开始一局（没有存档）'); return; }
        if (!u || !u.card) return;
        await u.card(Stage3.TOKEN_NAME, Stage3.tokenInfo(g.G).text + (Stage3.tokenFeePreview ? '\n\n' + Stage3.tokenFeePreview(g.G).text : ''), 'i:bill', ['知道了']);
    } },
      // 追兵调参按钮：债务强化 #7——显示当前生效的追兵档位参数表（默认表 + localStorage 开发者覆盖）、哪些字段被覆盖/钳制/回退；可一键清除覆盖。不改存档
      // 债务强化 #8：卡片选项固定为「知道了」+ 三个预设（好躲 / 原样（清除覆盖）/ 地狱），点预设 = 把预设 JSON 写进 TUNING_KEY（原样 = 删键）
      // 路遇按钮（第二十四轮）：NPC37 强制触发一次路遇（force 跳过冷却/额度，仍记入），弹「⚑ 路遇」卡并结算到真实存档；NPC 取当前地图上的熟人，没有就随机
    { key: 'ly', label: '路遇', bg: '#2a3a4a', fg: '#c0e0ff', run: async () => {
        const g = gameObj();
        if (!window.NPC37 || !g || !g.G) { toast('请先开始一局（没有存档）'); return; }
        const R0 = (typeof R !== 'undefined') ? R : null; const mapId = (R0 && R0.mapId) || 'market';
        const ids = NPC37.ids(); const here = ids.filter(id => NPC37.schedule(id) === mapId);
        const id = (here.length ? here : ids)[Math.floor(Math.random() * (here.length ? here.length : ids.length))];
        const sc = NPC37.onMeet(id, mapId, { force: true }); if (sc) await NPC37.play(sc);
    } },
      // 自发事件按钮（第三十轮）：NPC37E 强制触发一次 NPC 之间的自发事件（结仇/求助/讨债随机一类，跳过额度但照样计入），写关系网 + 江湖新闻，结果用卡片显示
    { key: 'zf', label: '自发事件', bg: '#3a2a4a', fg: '#e0c0ff', run: async () => {
        const g = gameObj(); const u = uiObj();
        if (!window.NPC37E || !g || !g.G) { toast('请先开始一局（没有存档）'); return; }
        const ev = NPC37E.force(); if (!ev) { toast('没有可用的 NPC'); return; }
        if (g.save) g.save();
        const body = `${NPC37E.LABEL[ev.kind]}：${NPC37.name(ev.a)} ↔ ${NPC37.name(ev.b)}\n关系 ${ev.r0} → ${ev.rel}${ev.tie === 'ch' ? '（成仇）' : ''}${ev.loan ? `\n借出 ${ev.loan} 灵石` : ''}${ev.amt ? `\n账 ${ev.amt} 灵石：${ev.paid ? '讨回' : '赖账（加息一成）'}` : ''}${ev.aff ? `\n你对${NPC37.name(ev.b)}好感 +${ev.aff}` : ''}\n\n${ev.s || '（本年新闻额度已满，未上新闻）'}`;
        if (u && u.card) await u.card('自发事件', body, 'i:bill', ['知道了']);
    } },
    { key: 'zt', label: '追兵调参', bg: '#4a2a3a', fg: '#ffc0d8', run: async () => {
        const u = uiObj();
        if (!window.Stage3 || !Stage3.bountyTuning) return;
        if (!u || !u.card) return;
        const tu = readBountyTuning();
        const presets = Stage3.BOUNTY_TUNING_PRESETS || [];
        const opts = ['知道了'].concat(presets.map(p => p.n + (p.note ? '（' + p.note + '）' : '')));
        const pick = await u.card('追兵调参', tuningCardText(tu), 'i:bill', opts);
        if (pick > 0 && presets[pick - 1]) {
          const p = presets[pick - 1];
          if (writeBountyPreset(p)) toast('已写入预设：' + p.n, '#ffc0d8');
          else toast('写入失败', '#ff9090');
        }
    } },
  ];

  // ... 以下保持原样（加载、挂载、兜底入口等不变）
  // 原文件剩余部分保持不动，仅上面三处小改
})();

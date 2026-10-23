'use strict';
// 开放世界线 · 开发者按钮（dev_openworld.js）——从 dev_entry_v25.js 挪出（dev_entry_v25.js 恢复为 main 原样）。
//
// 按钮：试炼场（覆盖层 iframe / 取消 = 阶段3 债务奇遇）· 全套神装 · 即时战（覆盖层原型）· 奇遇链（钱多多）· 查账链（记账童子）
//       · 追兵战（债压档位）· 突破预估（只读）· 追兵调参（开发者覆盖 + 一键预设）。行为与 openworld-wip aa00519 时 dev_entry_v25.js 里的同名按钮一致。
//
// 只在开发者模式生效（与 dev_entry_v25.js 同一判定）：URL #dev 或 ?dev=1，或 7 次快速点击 #title / .ver / #ver（间隔 ≤1.5s）。
//   非开发者模式：本文件只挂一个空壳 window.DevOpenWorld（active=false），不加载任何原型脚本、不建任何 DOM。
//   开发者模式开启时才懒加载原型脚本（release 包里它们不再由 index.html 直接加载）：
//     js/battle_realtime_prototype.js（RealtimeBattle）、js/stage3_encounter_draft.js（Stage3）。
//     lowpoly_box_chars.js 只由 prototypes/lowpoly_box/index.html 独立预览页加载，主页面从不加载。
//
// 挂载 API（给 3.4.1 作弊菜单的「开放世界」页签用；本文件不碰 ux23.js）：
//   window.DevOpenWorld = {
//     id: 'openworld', title: '开放世界',
//     active: boolean,                 // 是否已进入开发者模式（原型脚本已开始加载）
//     buttons: [{ key, label, run }],  // run(): Promise —— 先等原型脚本加载完，再执行按钮逻辑
//     ready(): Promise,                // 开启开发者模式并等原型脚本加载完
//     mount(containerEl): () => void,  // 把按钮渲染进宿主容器（每个 <button class="dow-btn" data-key=…>），返回卸载函数；
//                                      //   任何一次 mount 后，下面的浮动兜底入口自动隐藏（卸载全部后恢复）
//   }
// 3.4.1 作弊菜单页签（Grok Bot 定的接口）：开发者模式下登记
//   DevPanel.registerTab('openworld', '开放世界', render)（dev341 已加载时），否则 (window.DevTabs = window.DevTabs || []).push({ key: 'openworld', id: 'openworld', name: '开放世界', render(el) })
//   dev341 的 DevPanel.tabs() 按 key 过滤；菜单遍历 DevTabs，一项一个页签，调用 render(页签容器)；render 返回 unmount。只登记一次（文件执行两次也不重复）；非开发者模式不登记。
// 兜底入口（3.4.1 页签落地前给测试用）：开发者模式下右侧一个「开放世界」浮动按钮（bottom:270px，在 main 的 试炼场/全套神装/即时战 之上，不重叠），
//   点开一个按钮面板（#dow-open 打开 #dow-panel，按钮 id = dow-<key>）。非开发者模式不出现；宿主 mount() 过就隐藏。

(function () {
  const SCRIPTS = ['js/battle_realtime_prototype.js', 'js/stage3_encounter_draft.js'];
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
        if (window.RealtimeBattle && RealtimeBattle.open) RealtimeBattle.open(null, { force: true });
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
        const r = await h.done;
        const s = Stage3.settleBounty(G, Object.assign({}, r, { tier: P.tier }));
        if (s.settled && typeof g.save === 'function') g.save();
        if (h.closed) await h.closed;
        const u = uiObj();
        if (!s.settled) { toast('中途离场：追兵战不结算', '#cccccc'); return; }
        if (u && u.card) {
          await u.card('追兵战结算', `${s.result === 'win' ? '胜' : '败'}·${s.n}\n${s.note}\n债务：${s.debtBefore} → ${s.debtAfter}${s.bountyCleared ? '\n通缉已撤销' : ''}${s.token ? `\n缴获${Stage3.TOKEN_NAME}×1（共 ${s.tokens} 枚）：只是凭证，暂无用途` : ''}${s.tokenBlocked === 'cap' ? `\n${Stage3.TOKEN_NAME}已满 ${Stage3.TOKEN_MAX} 枚，这次没再缴获` : s.tokenBlocked === 'cooldown' ? `\n今年已缴获过${Stage3.TOKEN_NAME}，明年再来` : ''}\n追兵特性：${P.traitNote}${P.bossNote ? '\n头子：' + P.bossNote : ''}${tu.error ? '\n调参表无效，本场用默认表' : tu.changed.length ? `\n开发者调参：${tu.changed.length} 项生效（见「追兵调参」）` : ''}`, 'i:bill', ['好']);
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
      // 追兵调参按钮：债务强化 #7——显示当前生效的追兵档位参数表（默认表 + localStorage 开发者覆盖）、哪些字段被覆盖/钳制/回退；可一键清除覆盖。不改存档
      // 债务强化 #8：卡片选项固定为「知道了」+ 三个预设（好躲 / 原样（清除覆盖）/ 地狱），点预设 = 把预设 JSON 写进 TUNING_KEY（原样 = 删键）
    { key: 'zt', label: '追兵调参', bg: '#4a2a3a', fg: '#ffc0d8', run: async () => {
        const u = uiObj();
        if (!window.Stage3 || !Stage3.bountyTuning) return;
        if (!u || !u.card) return;
        const tu = readBountyTuning();
        const presets = Stage3.BOUNTY_TUNING_PRESETS || [];
        const opts = ['知道了'].concat(presets.map(p => '预设·' + p.n + (p.override == null ? '（清除覆盖）' : '')));
        const c = await u.card('追兵调参', tuningCardText(tu), 'i:bill', opts);
        const p = c >= 1 ? presets[c - 1] : null;
        if (!p) return;
        if (!writeBountyPreset(p)) { toast('写入调参覆盖失败（localStorage 不可用）', '#ffc0d8'); return; }
        if (p.override == null) toast(tu.raw == null ? '已是默认表（原样）' : '已清除追兵调参覆盖，恢复默认表', '#ffc0d8');
        else toast(`已套用追兵调参预设「${p.n}」：改了 ${Stage3.bountyTuning(p.override).changed.length} 项（下一场追兵战生效）`, '#ffc0d8');
    } },

  ];

  function openEncounterOverlay() {
    if (document.getElementById('v25-encounter-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'v25-encounter-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;width:min(960px,96vw);height:min(640px,90vh);background:#111;border:2px solid #ffe680;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.6);';
    const iframe = document.createElement('iframe');
    iframe.src = 'prototypes/encounter/index.html';
    iframe.style.cssText = 'width:100%;height:100%;border:none;';
    const close = document.createElement('button');
    close.textContent = '×';
    close.setAttribute('aria-label', '关闭试炼场');
    close.style.cssText = 'position:absolute;top:8px;right:8px;z-index:1;width:36px;height:36px;border-radius:50%;background:#2a3a5a;color:#ffe680;border:1px solid #ffe680;font-size:20px;font-weight:bold;cursor:pointer;';

    function removeOverlay() {
      document.removeEventListener('keydown', onKey);
      if (overlay.parentNode) overlay.remove();
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        removeOverlay();
      }
    }

    close.onclick = removeOverlay;
    wrap.appendChild(iframe);
    wrap.appendChild(close);
    overlay.appendChild(wrap);
    overlay.onclick = e => { if (e.target === overlay) removeOverlay(); };
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
  }

  function giveFullGodGear() {
    const g = gameObj(); const G = g.G;
    if (!G.eqs) G.eqs = [];
    if (!G.eq) G.eq = {};
    const slots = ['weapon', 'armor', 'acc1', 'acc2', 'treasure'];
    slots.forEach((slot, i) => {
      const eq = {
        uid: 'dev_' + Date.now() + '_' + i,
        slot,
        name: '神装·' + slot,
        rar: 4,
        tier: 10,
        ic: 'sword_b',
        main: { atk: 999, def: 999, hp: 9999, mp: 9999 },
        aff: [],
      };
      G.eqs.push(eq);
      G.eq[slot] = eq.uid;
    });
    if (typeof g.save === 'function') g.save();
  }

  // ---- 懒加载原型脚本（只在开发者模式）----
  let loading = null;
  function loadScript(src) {
    const old = document.querySelector('script[data-dev-openworld="1"][src="' + src + '"]'); // 本文件被执行两次时不重复注入
    if (old) return old.dataset.loaded ? Promise.resolve(true) : new Promise(res => { old.addEventListener('load', () => res(true)); old.addEventListener('error', () => res(false)); });
    return new Promise(res => {
      const s = document.createElement('script');
      s.src = src; s.async = false; s.dataset.devOpenworld = '1';
      s.onload = () => { s.dataset.loaded = '1'; res(true); }; s.onerror = () => res(false);
      document.head.appendChild(s);
    });
  }
  function ready() {
    API.active = true;
    if (!loading) loading = (async () => { for (const src of SCRIPTS) await loadScript(src); })();
    return loading;
  }

  let mounts = 0;
  function makeButton(b, fixedCss) {
    const el = document.createElement('button');
    el.className = 'dow-btn'; el.dataset.key = b.key; el.textContent = b.label;
    el.style.cssText = BTN_CSS + `background:${b.bg};color:${b.fg};border:1px solid ${b.fg};` + (fixedCss || '');
    el.onclick = () => b.run();
    return el;
  }
  function mount(containerEl) {
    if (!containerEl) return () => {};
    ready();
    const els = BUTTONS.map(b => makeButton(b, 'margin:4px;'));
    els.forEach(e => containerEl.appendChild(e));
    mounts++; syncFallback();
    let done = false;
    return () => { if (done) return; done = true; els.forEach(e => e.remove()); mounts = Math.max(0, mounts - 1); syncFallback(); };
  }

  // ---- 兜底浮动入口 ----
  function syncFallback() {
    const fb = document.getElementById('dow-open'), pn = document.getElementById('dow-panel');
    if (fb) fb.style.display = mounts ? 'none' : '';
    if (pn && mounts) pn.style.display = 'none';
  }
  function addFallback() {
    if (!document.body || document.getElementById('dow-open')) { syncFallback(); return; }
    const fb = document.createElement('button');
    fb.id = 'dow-open'; fb.textContent = '开放世界';
    fb.style.cssText = 'position:fixed;right:12px;bottom:270px;z-index:9999;' + BTN_CSS + 'background:#3a4a2a;color:#d8ffa0;border:1px solid #d8ffa0;';
    const pn = document.createElement('div');
    pn.id = 'dow-panel';
    pn.style.cssText = 'position:fixed;right:12px;bottom:320px;z-index:9999;display:none;flex-direction:column;align-items:flex-end;gap:8px;max-height:calc(100vh - 340px);overflow:auto;';
    BUTTONS.forEach(b => { const e = makeButton(b); e.id = 'dow-' + b.key; pn.appendChild(e); });
    fb.onclick = () => { pn.style.display = pn.style.display === 'none' ? 'flex' : 'none'; };
    document.body.appendChild(pn); document.body.appendChild(fb);
    syncFallback();
  }
  // 3.4.1 作弊菜单接口：开发者模式下往 window.DevTabs 登记一个页签；菜单 render(el) 时复用 DevOpenWorld.mount(el)（会隐藏兜底入口）。
  //   已有 id='openworld' 的登记就不再 push（本文件被执行两次也只登记一次）；render 调用时取当前的 window.DevOpenWorld。
  function registerTab() {
    const render = function (el) { return (window.DevOpenWorld || API).mount(el); };
    if (window.DevPanel && typeof window.DevPanel.registerTab === 'function') { window.DevPanel.registerTab('openworld', '开放世界', render); return; } // dev341 已加载：同 key 覆盖
    const tabs = (window.DevTabs = window.DevTabs || []);
    if (tabs.some(t => t && (t.key === 'openworld' || t.id === 'openworld'))) return;
    tabs.push({ key: 'openworld', id: 'openworld', name: '开放世界', render: render }); // dev341 按 key 识别；id 兼容旧写法
  }
  function enable() { ready(); registerTab(); if (!mounts) addFallback(); }

  const API = {
    id: 'openworld', title: '开放世界', active: false,
    buttons: BUTTONS.map(b => ({ key: b.key, label: b.label, run: async () => { await ready(); return b.run(); } })),
    ready, mount,
  };
  BUTTONS.forEach((b, i) => { const r = b.run; b.run = API.buttons[i].run = async () => { await ready(); return r(); }; });
  window.DevOpenWorld = API;

  // 开发者模式判定：与 dev_entry_v25.js 相同
  let clicks = 0, last = 0;
  document.addEventListener('click', e => {
    const t = e.target;
    if (!t || !t.closest || !t.closest('#title, .ver, #ver')) return;
    const now = Date.now();
    if (now - last > 1500) clicks = 0;
    last = now;
    if (++clicks >= 7) { clicks = 0; enable(); }
  });
  if (location.hash === '#dev' || location.search.includes('dev=1')) {
    ready(); registerTab(); // 尽早登记页签、加载原型脚本（main 的 dev_entry 按钮 500ms 后出现，也要用到 RealtimeBattle / Stage3）
    setTimeout(enable, 500);
  }
})();

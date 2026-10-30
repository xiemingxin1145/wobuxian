// 3.9.0 阵法面板 UI（第 3 轮）：洞府入口 + 三页（战阵/洞府阵/阵图）学阵/炼阵/布阵 + 战斗胜利阵道经验。
// 规格：docs/research_v22.md §11。只包 UI.p_cave / Talk.extra / Game.fight / UI.useItem；注册 ITEMS zws39/ztc39；
// 存档只写 G.zf39（惰性）；wbx2_*、G.v===2 不变。不改 game.js/talk.js/data.js/ui.js/battle.js。
// #53 守卫：序章/新手指引/战斗中不弹 toast/卡（玩家主动点对话/面板除外）。
(function (W) {
  'use strict';
  if (!W.ZF39) return;
  const Z = W.ZF39;
  const T = Z.TEXT390;
  const N = T.nums;
  const TIER_N = T.panel.tier; // ['','下品','中品','上品']
  const MAT_N = { zws39: '阵纹石', yd: '妖丹', tcdb: '天材地宝', stone: '灵石', lv: '阵道', realm: '境界' };
  const REALM_N = ['凡人', '练气', '筑基', '金丹', '元婴', '化神', '渡劫', '飞升'];
  const SCROLL_BUY = [
    { id: 'huichun', needLv: 2, realm: 0 },
    { id: 'yinling', needLv: 2, realm: 0 },
    { id: 'jifeng', needLv: 2, realm: 0 },
  ];
  const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const gm = () => { try { if (typeof Game !== 'undefined' && Game) return Game; } catch (e) {} return W.Game || null; };
  const getG = G => G || (gm() && gm().G) || null;
  const storyBlock = () => {
    try {
      if (typeof NPC37 !== 'undefined' && NPC37 && typeof NPC37.storyBlock === 'function') return NPC37.storyBlock();
    } catch (e) {}
    return null;
  };
  // 被动弹 toast：序章/教程/战斗中跳过；玩家主动点开的面板/对话不受此限
  const canToast = () => !storyBlock();
  const toast = (msg, color) => {
    if (!canToast()) return false;
    try { if (typeof UI !== 'undefined' && UI.toast) { UI.toast(msg, color || '#9ad8ff'); return true; } } catch (e) {}
    return false;
  };
  const save = () => { try { const g = gm(); if (g && g.save) g.save(); } catch (e) {} };
  const hud = () => { try { if (typeof UI !== 'undefined' && UI.hud) UI.hud(); } catch (e) {} };

  function fmtLack(lack) {
    if (!lack || !lack.length) return '';
    return lack.map(x => {
      if (x.k === 'lv') return `阵道≥${x.need}（现${x.have}）`;
      if (x.k === 'realm') return `${REALM_N[x.need] || x.need}起（现${REALM_N[x.have] || x.have}）`;
      if (x.k === 'stone') return `灵石 ${x.have}/${x.need}`;
      return `${MAT_N[x.k] || x.k} ${x.have}/${x.need}`;
    }).join('、');
  }
  function costLabel(c) {
    if (!c) return '';
    const parts = [];
    if (c.zws39) parts.push(`阵纹石×${c.zws39}`);
    if (c.yd) parts.push(`妖丹×${c.yd}`);
    if (c.tcdb) parts.push(`天材地宝×${c.tcdb}`);
    if (c.stone) parts.push(`灵石 ${c.stone}`);
    if (c.realm) parts.push(`${REALM_N[c.realm] || ''}起`);
    return parts.join(' · ');
  }
  function warDesc(id, tier) {
    const w = Z.WAR[id]; if (!w) return '';
    let v = '';
    if (w.atkPct) v = Math.round(w.atkPct[tier] * 100);
    else if (w.defPct) v = Math.round(w.defPct[tier] * 100);
    else if (w.regen) v = Math.round(w.regen[tier] * 100);
    else if (w.mpregen) v = Math.round(w.mpregen[tier] * 100);
    else if (w.spdPct) v = Math.round(w.spdPct[tier] * 100);
    else if (w.crit) v = w.crit[tier];
    else if (w.slow) v = w.slow[tier];
    else if (w.poison) v = w.poison[tier];
    else if (id === 'qiantiao') v = tier;
    return Z.fmt(w.d, { v });
  }
  function headHtml(G) {
    const pe = (G && G.zf39 && typeof G.zf39 === 'object') ? G.zf39 : null;
    if (!pe || !pe.lv) return `<p class="hint">${esc(T.unlock.cave_hint)}</p>`;
    const lv = pe.lv, xp = pe.xp | 0;
    const needNext = lv >= Z.MAXLV ? '—' : Z.need(lv + 1);
    const li = Z.LV[lv];
    const a = (pe.war || []).length, b = li.war, c = (pe.cave || []).length, d = li.cave;
    return `<div class="zf39head"><span>${esc(Z.fmt(T.panel.lv, { lv, xp, need: needNext }))}</span>` +
      `<span>${esc(Z.fmt(T.panel.slots, { a, b, c, d }))}</span>` +
      `<span>阵纹石 ${(G.inv && G.inv.zws39) || 0}</span></div>` +
      `<p class="hint zf39note">${esc(T.panel.stat_note)}</p>`;
  }
  function warRow(G, id) {
    const pe = G.zf39; const w = Z.WAR[id]; const know = !!(pe.know && pe.know[id]);
    const tier = (pe.tier && pe.tier[id]) || 0; const on = (pe.war || []).includes(id);
    const act = Z.active(G).find(x => x.id === id);
    const chain = act && act.chain ? `<em class="zf39chain">${esc(T.panel.chain)}</em>` : '';
    const noRt = !w.rt ? `<small class="zf39nort">${esc(T.panel.no_rt)}</small>` : '';
    if (!know) {
      return `<div class="zf39it dim" data-id="${id}"><div class="tx"><b>？？？</b><small>未习得阵图</small></div></div>`;
    }
    const tn = TIER_N[tier] || '未炼';
    const desc = tier ? warDesc(id, tier) : '已有阵图，尚未炼成阵盘';
    let btns = '';
    if (tier < 3) {
      const next = tier + 1; const chk = Z.canCraft(G, id, next);
      const lab = `炼${TIER_N[next]}`;
      btns += `<button class="sm zfb" data-a="craft" data-id="${id}" data-t="${next}" ${chk.ok ? '' : 'data-off="1"'}>${lab}</button>`;
    }
    if (tier > 0) {
      btns += on
        ? `<button class="sm zfb on" data-a="unwar" data-id="${id}">撤阵</button>`
        : `<button class="sm zfb" data-a="war" data-id="${id}">布阵</button>`;
    }
    return `<div class="zf39it${on ? ' on' : ''}" data-id="${id}"><div class="tx"><b>${esc(w.n)}·${esc(tn)}</b>${chain}${noRt}` +
      `<small>${esc(desc)}</small></div><div class="bs">${btns}</div></div>`;
  }
  function caveRow(G, id, wref) {
    const pe = G.zf39; const c = Z.CAVE[id]; const tier = (pe.tier && pe.tier[id]) || 0;
    const on = (pe.cave || []).includes(id); const useful = Z.caveUseful(id, wref);
    let btns = '';
    if (!tier) {
      const chk = Z.canCraft(G, id, 1);
      btns = `<button class="sm zfb" data-a="craft" data-id="${id}" data-t="1" ${chk.ok ? '' : 'data-off="1"'}>炼制</button>`;
    } else if (!useful) {
      btns = `<button class="sm zfb" data-off="1">${esc(T.panel.useless)}</button>`;
    } else {
      btns = on
        ? `<button class="sm zfb on" data-a="uncave" data-id="${id}">撤下</button>`
        : `<button class="sm zfb" data-a="cave" data-id="${id}">放入</button>`;
    }
    const st = tier ? (useful ? (on ? '已放入阵眼' : '已炼成') : T.panel.useless) : '未炼';
    return `<div class="zf39it${on ? ' on' : ''}${!useful && tier ? ' dim' : ''}" data-id="${id}"><div class="tx"><b>${esc(c.n)}</b>` +
      `<small>${esc(c.d)}</small><small>${esc(st)}${tier ? ' · ' + esc(costLabel(Z.cost(id, 1))) : ''}</small></div><div class="bs">${btns}</div></div>`;
  }
  function chartRow(G, id) {
    const pe = G.zf39; const w = Z.WAR[id]; const know = !!(pe.know && pe.know[id]);
    const tier = (pe.tier && pe.tier[id]) || 0;
    const src = ({
      fengshi: '施工图赠送', xuanwu: '施工图赠送',
      huichun: '坊市·钱多多 1500', yinling: '坊市·钱多多 1500', jifeng: '坊市·钱多多 1500',
      beidou: '秘境/烂尾阵眼', kunlong: '秘境/烂尾阵眼',
      huanghe: '鬼市 8000（元婴）', qiantiao: '催债司·算无遗',
    })[id] || '';
    return `<div class="zf39it${know ? '' : ' dim'}" data-id="${id}"><div class="tx"><b>${know ? esc(w.n) : '？？？'}</b>` +
      `<small>${know ? (TIER_N[tier] || '仅阵图') + ' · ' + esc(src) : '未习得 · ' + esc(src)}</small></div></div>`;
  }
  function panelHtml(G, tab, wref) {
    G = getG(G); tab = tab || 'war';
    if (!G) return '<p class="empty">先开始一局</p>';
    const learned = Z.learned(G);
    const tabs = T.panel.tabs; // 战阵 / 洞府阵 / 阵图
    const tabKeys = ['war', 'cave', 'chart'];
    const tabBar = `<div class="tabs zf39tabs">${tabs.map((n, i) =>
      `<button class="${tab === tabKeys[i] ? 'on' : ''}" data-tab="${tabKeys[i]}">${esc(n)}</button>`).join('')}</div>`;
    let body = headHtml(G);
    if (!learned) {
      body += tabBar + `<p class="empty">${esc(T.unlock.cave_hint)}</p>`;
      return body;
    }
    body += tabBar;
    if (tab === 'war') body += Z.WAR_IDS.map(id => warRow(G, id)).join('');
    else if (tab === 'cave') body += Z.CAVE_IDS.map(id => caveRow(G, id, wref || W)).join('');
    else body += Z.WAR_IDS.map(id => chartRow(G, id)).join('');
    return body;
  }
  function entHtml(G) {
    G = getG(G);
    const pe = G && G.zf39;
    const sub = pe && pe.lv ? `阵道 ${pe.lv} 级 · 战阵 ${(pe.war || []).length}` : '未入门';
    return `<button class="opt zf39open" data-zf="open">阵法 <small>${esc(sub)}</small></button>`;
  }

  // ---------- 动作（纯逻辑，单测可调；UI 层再 toast/save） ----------
  function doCraft(G, id, tier) {
    G = getG(G); tier = +(tier || 1);
    const chk = Z.canCraft(G, id, tier);
    if (!chk.ok) return { ok: false, why: chk.why, lack: chk.lack, msg: Z.fmt(T.panel.craft_lack, { lack: fmtLack(chk.lack) }) };
    const r = Z.craft(G, id, tier);
    const name = (Z.WAR[id] || Z.CAVE[id] || {}).n || id;
    return { ok: true, xp: r.xp, up: r.up, msg: Z.fmt(T.panel.craft_ok, { n: name, tier: TIER_N[tier] }) };
  }
  function doSetWar(G, id, on) {
    G = getG(G); const pe = G && G.zf39; if (!pe || !pe.lv) return { ok: false, why: 'lv0' };
    let ids = (pe.war || []).slice();
    if (on) {
      if (ids.includes(id)) return { ok: true, ids };
      const max = Z.LV[pe.lv].war;
      if (ids.length >= max) return { ok: false, why: 'full', msg: `战阵槽已满（${max}）` };
      ids.push(id);
    } else ids = ids.filter(x => x !== id);
    if (!Z.setWar(G, ids)) return { ok: false, why: 'set' };
    return { ok: true, ids: pe.war.slice() };
  }
  function doSetCave(G, id, on, wref) {
    G = getG(G); const pe = G && G.zf39; if (!pe || !pe.lv) return { ok: false, why: 'lv0' };
    let ids = (pe.cave || []).slice();
    if (on) {
      if (ids.includes(id)) return { ok: true, ids };
      if (!Z.caveUseful(id, wref || W)) return { ok: false, why: 'useless', msg: T.panel.useless };
      const max = Z.LV[pe.lv].cave;
      if (ids.length >= max) return { ok: false, why: 'full', msg: `洞府阵眼已满（${max}）` };
      ids.push(id);
    } else ids = ids.filter(x => x !== id);
    if (!Z.setCave(G, ids, wref || W)) return { ok: false, why: 'set' };
    return { ok: true, ids: pe.cave.slice() };
  }
  function doUnlock(G) {
    G = getG(G); const c = Z.canUnlock(G);
    if (!c.ok) return { ok: false, why: c.why, msg: c.why === 'stone' ? '灵石不够' : c.why === 'realm' ? '练气后方可购买' : '已经买过了' };
    if (!Z.unlock(G)) return { ok: false, why: 'fail' };
    return { ok: true, msg: T.unlock.bought };
  }
  function doBuyScroll(G, id) {
    G = getG(G); const pe = G && (G.zf39 || null);
    const price = N.scrollPrice[id]; if (!price || !Z.WAR[id]) return { ok: false, why: 'id' };
    if (!pe || !pe.lv) return { ok: false, why: 'lv0', msg: '先买施工图入门' };
    if (pe.know && pe.know[id]) return { ok: false, why: 'have', msg: '已经有这张阵图了' };
    if (id === 'huanghe' && (G.realm || 0) < 4) return { ok: false, why: 'realm', msg: '元婴后方可购买' };
    if (['huichun', 'yinling', 'jifeng'].includes(id) && pe.lv < 2) return { ok: false, why: 'lv', msg: '阵道 2 级起可买' };
    if ((G.stone || 0) < price) return { ok: false, why: 'stone', msg: '灵石不够' };
    G.stone -= price; Z.learn(G, id);
    return { ok: true, msg: `学会阵图：${Z.WAR[id].n}` };
  }
  function doTeachQiantiao(G) {
    G = getG(G); const pe = G && G.zf39;
    if (!pe || pe.lv < 6) return { ok: false, why: 'lv', msg: T.npc.suanpan_lock };
    if ((G.realm || 0) < 5) return { ok: false, why: 'realm', msg: '化神后再来讨教' };
    if (pe.know && pe.know.qiantiao) return { ok: false, why: 'have', msg: '你已经会欠条阵了' };
    Z.learn(G, 'qiantiao');
    return { ok: true, msg: T.npc.suanpan_give };
  }
  function doUsePage(G) {
    G = getG(G); if (!G) return { ok: false, why: 'nogame' };
    if (!Z.learned(G)) return { ok: false, why: 'lv0', msg: '还不会阵法' };
    if (((G.inv && G.inv.ztc39) || 0) < 1) return { ok: false, why: 'item', msg: '没有阵图残页' };
    G.inv.ztc39 -= 1; if (G.inv.ztc39 <= 0) delete G.inv.ztc39;
    const up = Z.addXp(G, N.xp.page);
    return { ok: true, add: up.add, ups: up.ups, msg: `阵道 +${up.add}` };
  }
  function doWinXp(G, year) {
    G = getG(G); if (!G || !Z.learned(G)) return { add: 0, ups: [] };
    return Z.winXp(G, year);
  }
  function announceXp(add, ups) {
    if (!add) return;
    toast(`阵道 +${add}`, '#9ad8ff');
    if (ups && ups.length) {
      for (const lv of ups) {
        const extra = (T.pozhen.lv_extra && T.pozhen.lv_extra[String(lv)]) || '';
        toast(Z.fmt(T.pozhen.lv_up, { lv, extra }), '#ffd23a');
      }
    }
  }

  const ZF39UI = {
    T, panelHtml, entHtml, headHtml, warDesc, fmtLack, costLabel,
    doCraft, doSetWar, doSetCave, doUnlock, doBuyScroll, doTeachQiantiao, doUsePage, doWinXp,
    announceXp, storyBlock, canToast, SCROLL_BUY,
  };
  W.ZF39UI = ZF39UI;

  // ---------- 注册道具（并入 ITEMS；老档无此键时背包不显示，有了才出现） ----------
  function registerItems() {
    if (typeof ITEMS === 'undefined' || !ITEMS) return;
    for (const id of Object.keys(Z.ITEMS390)) {
      if (!ITEMS[id]) ITEMS[id] = Object.assign({}, Z.ITEMS390[id]);
    }
  }
  registerItems();

  // ---------- 浏览器 UI 挂钩（node 单测无 UI/Talk/Game 时跳过） ----------
  if (typeof UI === 'undefined' || typeof Game === 'undefined') return;
  if (W.__zf39Ui) return;
  W.__zf39Ui = 1;

  UI.titles.zf39 = T.panel.title;
  UI.p_zf39 = function (b, re, close, tab) {
    tab = tab || UI._zf39tab || 'war'; UI._zf39tab = tab;
    const G = Game.G;
    b.innerHTML = panelHtml(G, tab, W);
    b.onclick = async e => {
      const tb = e.target.closest('[data-tab]'); if (tb) { UI._zf39tab = tb.dataset.tab; re(); return; }
      const btn = e.target.closest('button.zfb'); if (!btn) return;
      e.stopPropagation();
      if (btn.dataset.off) {
        const id = btn.dataset.id, t = +(btn.dataset.t || 1);
        if (btn.dataset.a === 'craft') {
          const chk = Z.canCraft(G, id, t);
          UI.toast(Z.fmt(T.panel.craft_lack, { lack: fmtLack(chk.lack) || '条件不足' }));
        } else UI.toast(btn.textContent || T.panel.useless);
        return;
      }
      Sfx.play && Sfx.play('click');
      const a = btn.dataset.a, id = btn.dataset.id;
      if (a === 'craft') {
        const r = doCraft(G, id, +(btn.dataset.t || 1));
        if (!r.ok) { UI.toast(r.msg || '炼制失败'); return; }
        Sfx.play && Sfx.play('levelup'); UI.toast(r.msg, '#ffd23a');
        announceXp(r.xp, r.up && r.up.ups); save(); hud(); re(); return;
      }
      if (a === 'war' || a === 'unwar') {
        const r = doSetWar(G, id, a === 'war');
        if (!r.ok) { UI.toast(r.msg || '布阵失败'); return; }
        UI.toast(a === 'war' ? `布下${Z.WAR[id].n}` : `撤下${Z.WAR[id].n}`, '#9ad8ff');
        save(); re(); return;
      }
      if (a === 'cave' || a === 'uncave') {
        const r = doSetCave(G, id, a === 'cave', W);
        if (!r.ok) { UI.toast(r.msg || '操作失败'); return; }
        UI.toast(a === 'cave' ? `放入${Z.CAVE[id].n}` : `撤下${Z.CAVE[id].n}`, '#9ad8ff');
        save(); re(); return;
      }
    };
  };

  // 洞府入口（与神器阁同款注入）
  const _pc = UI.p_cave;
  if (_pc) UI.p_cave = function (b, re) {
    const r = _pc.apply(this, arguments); const G = Game.G; if (!G) return r;
    const d = (typeof h === 'function' ? h('div', 'zf39wrap', entHtml(G)) : (() => { const e = document.createElement('div'); e.className = 'zf39wrap'; e.innerHTML = entHtml(G); return e; })());
    const anchor = b.querySelector('.sq36wrap') || b.querySelector('.fb33wrap');
    if (anchor) anchor.after(d); else b.appendChild(d);
    d.addEventListener('click', async e => {
      const t = e.target.closest('[data-zf="open"]'); if (!t) return;
      e.stopPropagation(); Sfx.play && Sfx.play('click');
      await UI.panel('zf39'); d.innerHTML = entHtml(G); UI.hud();
    });
    return r;
  };

  // Talk.extra：钱多多施工图/阵图、算无遗讨教、鬼市阴三娘黄河阵图
  if (typeof Talk !== 'undefined') {
    const _ex = Talk.extra;
    Talk.extra = function (id) {
      const out = _ex ? _ex.apply(this, arguments) : [];
      try {
        const G = Game.G; if (!G) return out;
        if (id === 'merchant') {
          if (!Z.learned(G) && (G.realm || 0) >= 1) {
            out.push([T.unlock.merchant_btn, async () => {
              await UI.say('npc_merchant', '奸商·钱多多', T.unlock.merchant_pitch, ['看看']);
              const r = doUnlock(G);
              if (!r.ok) { await UI.say('npc_merchant', '奸商·钱多多', r.msg || '买不成', ['……']); return; }
              await UI.card('天道施工图', r.msg, 'i:scroll', ['好']);
              Sfx.play && Sfx.play('levelup'); save(); hud();
            }]);
          }
          if (Z.learned(G)) {
            for (const s of SCROLL_BUY) {
              if (G.zf39.know && G.zf39.know[s.id]) continue;
              if (G.zf39.lv < s.needLv) continue;
              const price = N.scrollPrice[s.id];
              out.push([`📜 ${Z.WAR[s.id].n}阵图 · ${price} 灵石`, async () => {
                const r = doBuyScroll(G, s.id);
                if (!r.ok) { UI.toast(r.msg || '买不成'); return; }
                await UI.card('阵图', r.msg, 'i:scroll', ['好']);
                Sfx.play && Sfx.play('pickup'); save(); hud();
              }]);
            }
          }
        }
        if (id === 'suanpan') {
          out.push([T.npc.suanpan_btn, async () => {
            const r = doTeachQiantiao(G);
            if (!r.ok) { await UI.say('npc_suanpan', '天道会计·算无遗', r.msg, ['……']); return; }
            await UI.card('欠条阵', r.msg, 'i:scroll', ['学会了']);
            Sfx.play && Sfx.play('levelup'); save(); hud();
          }]);
        }
        if (id === 'sanniang' && Z.learned(G) && !(G.zf39.know && G.zf39.know.huanghe)) {
          out.push([`📜 九曲黄河阵图 · ${N.scrollPrice.huanghe} 灵石`, async () => {
            const r = doBuyScroll(G, 'huanghe');
            if (!r.ok) { UI.toast(r.msg || '买不成'); return; }
            await UI.card('阵图', r.msg, 'i:scroll', ['好']);
            Sfx.play && Sfx.play('pickup'); save(); hud();
          }]);
        }
      } catch (e) { console.warn('[zf39ui] Talk.extra', e); }
      return out;
    };
  }

  // 战斗胜利：布阵状态下 +1 阵道经验（每年 40）
  {
    const _f = Game.fight;
    Game.fight = async function () {
      const r = await _f.apply(this, arguments);
      try {
        if (r && r.res === 'win' && this.G) {
          const wr = doWinXp(this.G);
          if (wr && wr.add) announceXp(wr.add, wr.ups || []);
        }
      } catch (e) { console.warn('[zf39ui] winXp', e); }
      return r;
    };
  }

  // 阵图残页使用
  {
    const _ui = UI.useItem;
    UI.useItem = async function (k) {
      const G = Game.G; const I = typeof ITEMS !== 'undefined' && ITEMS[k];
      if (I && I.use === 'zf39page') {
        const r = doUsePage(G);
        if (!r.ok) { UI.toast(r.msg || '用不了'); return; }
        Sfx.play && Sfx.play('heal'); announceXp(r.add, r.ups); hud(); save(); return;
      }
      return _ui.apply(this, arguments);
    };
  }

  // 开发者 Tab
  if (W.DevPanel && DevPanel.registerTab) {
    DevPanel.registerTab('zf39', '阵法39', (box, ctx) => {
      const G = Game.G; if (!G) { box.innerHTML = '<p>先开始一局</p>'; return; }
      const pe = Z.ensure(G);
      box.innerHTML = `<p>阵道 ${pe.lv} · xp ${pe.xp} · 战阵 [${(pe.war || []).join(',')}] · 洞府 [${(pe.cave || []).join(',')}] · 年胜场xp ${pe.yrWinXp}</p>
        <div class="dvb" style="justify-content:flex-start">
          <button class="sm dvx" data-q="lv1">阵道1</button><button class="sm dvx" data-q="lv5">阵道5</button><button class="sm dvx" data-q="lv9">阵道9</button>
          <button class="sm dvx" data-q="know">全部阵图</button><button class="sm dvx" data-q="top">全部上品</button>
          <button class="sm dvx" data-q="zws">阵纹石×50</button><button class="sm dvx" data-q="panel">打开面板</button>
          <button class="sm dvx" data-q="reset">清空阵法</button>
        </div>`;
      box.onclick = e => {
        const t = e.target.closest('button'); if (!t) return; const q = t.dataset.q; const G2 = Game.G; const P = Z.ensure(G2);
        if (q === 'lv1' || q === 'lv5' || q === 'lv9') { const lv = +q.slice(2); P.lv = lv; P.xp = Z.need(lv); ctx.toast('阵道 ' + lv); }
        else if (q === 'know') { for (const id of Z.WAR_IDS) P.know[id] = 1; ctx.toast('全部阵图'); }
        else if (q === 'top') { for (const id of Z.WAR_IDS.concat(Z.CAVE_IDS)) { P.know[id] = 1; P.tier[id] = id in Z.CAVE ? 1 : 3; } ctx.toast('全部上品'); }
        else if (q === 'zws') { G2.inv = G2.inv || {}; G2.inv.zws39 = (G2.inv.zws39 || 0) + 50; ctx.toast('阵纹石 +50'); }
        else if (q === 'panel') UI.panel('zf39');
        else if (q === 'reset') { G2.zf39 = { lv: 0, xp: 0, know: {}, tier: {}, war: [], cave: [], yrWinXp: 0, yrKey: 0, eyes: {} }; ctx.toast('阵法已清空'); }
        ctx.save(); ctx.rerender();
      };
    });
  }

  const css = document.createElement('style');
  css.textContent = `.zf39wrap{margin-top:10px}.zf39wrap .opt{width:100%;border-color:#7ec8ff;color:#c8e8ff}.zf39wrap .opt small{display:block;font-size:11px;opacity:.85}
.zf39head{display:flex;flex-wrap:wrap;gap:4px 12px;margin-bottom:4px;font-size:13px}.zf39head b,.zf39head span{color:#c8e8ff}
.zf39note{opacity:.85;font-size:12px;margin:2px 0 6px}
.zf39it{display:flex;align-items:center;gap:8px;margin:6px 0;padding:6px;border-radius:8px;background:rgba(80,140,200,.08);border:1px solid rgba(80,140,200,.28);overflow:hidden}
.zf39it.on{border-color:#7ec8ff;box-shadow:0 0 6px rgba(80,180,255,.4)}.zf39it.dim{opacity:.7}
.zf39it .tx{flex:1 1 0;min-width:0}.zf39it .tx b{display:block;color:#d0e8ff}.zf39it small{display:block;font-size:11px;line-height:1.3;opacity:.9;word-break:break-all}
.zf39it .bs{display:flex;flex-direction:column;gap:4px;flex:0 0 auto}.zf39it .zfb{min-width:56px;min-height:40px;white-space:nowrap}
.zf39it .zfb.on{border-color:#7ec8ff;color:#9ad8ff}.zf39it .zfb[data-off]{filter:grayscale(.7) brightness(.85)}
.zf39chain{margin-left:6px;color:#9affd0;font-style:normal;font-size:12px}.zf39nort{color:#ffb07a}`;
  if (typeof document !== 'undefined' && document.head) document.head.appendChild(css);
})(typeof window !== 'undefined' ? window : globalThis);

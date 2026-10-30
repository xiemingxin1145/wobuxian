// 3.9.0 阵法 zf39 秘境破阵（第 5 轮）：学过阵法时陷阱房可选「⚑ 破阵」减伤/免伤并拿小额阵道经验。
// 确认：dungeon26 的 roomTrap 是闭包内函数，window.Dng 上**没有** Dng.roomTrap；本文件不改 dungeon26，
// 改为包 UI.card：标题「触发陷阱」且已学阵法时拦截，还原已扣血后给「破阵 / 硬闯」。
// 同时挂 Dng.roomTrap = 完整陷阱处理（供单测与未来 dungeon26 一行接线）。
// 内部弹卡用 showCard（不走 UI._q），避免在 UI.card 队列回调里再调 UI.card 死锁。
// rng：ZF39.rtRoll → Game.roll(p,'zf39') → Math.random；#53 storyBlock / B.on 守卫弹窗与 toast；惰性；不改存档键。
(function (W) {
  'use strict';
  if (!W.ZF39) return;
  const Z = W.ZF39;
  const T = Z.TEXT390;
  const N = T.nums;
  const P = T.pozhen;

  if (!Z.rtRoll) {
    Z.rtRoll = p => {
      try {
        const g = (typeof Game !== 'undefined' && Game) || W.Game;
        if (g && typeof g.roll === 'function') return !!g.roll(p, 'zf39');
      } catch (e) {}
      return Math.random() < p;
    };
  }
  const rtRoll = p => Z.rtRoll(p);
  const rng01 = () => Math.random();

  const gm = () => { try { if (typeof Game !== 'undefined' && Game) return Game; } catch (e) {} return W.Game || null; };
  const getG = G => G || (gm() && gm().G) || null;
  const storyBlock = () => {
    try {
      if (typeof NPC37 !== 'undefined' && NPC37 && typeof NPC37.storyBlock === 'function') {
        const r = NPC37.storyBlock();
        if (r) return r; // null/放行时继续查 B.on（#53 双守卫）
      }
    } catch (e) {}
    try { if (typeof B !== 'undefined' && B && B.on) return 'battle'; } catch (e) {}
    return null;
  };
  const canToast = () => !storyBlock();
  const toast = (msg, color) => {
    if (!canToast()) return false;
    try { if (typeof UI !== 'undefined' && UI.toast) { UI.toast(msg, color || '#9ad8ff'); return true; } } catch (e) {}
    return false;
  };
  const announceXp = (add, ups) => {
    if (!add) return;
    toast(`阵道 +${add}`, '#9ad8ff');
    if (ups && ups.length) {
      for (const lv of ups) {
        const extra = (P.lv_extra && P.lv_extra[String(lv)]) || '';
        toast(Z.fmt(P.lv_up, { lv, extra }), '#ffd23a');
      }
    }
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

  function parseTrapDmg(body) {
    const m = /气血\s*-\s*(\d+)/.exec(String(body || ''));
    return m ? (+m[1] | 0) : 0;
  }
  function parseTrapAfterHp(body) {
    const m = /（\s*(\d+)\s*\//.exec(String(body || ''));
    return m ? (+m[1] | 0) : null;
  }

  // Snapshot HP before trap damage (dungeon26 clamps with Math.max(1, hp - dmg)).
  let hpWatchPre = null;
  function armHpWatch(G) {
    G = G || getG();
    if (!G || G.__zf39HpArm) return G;
    let cur = Math.round(+G.hp || 0);
    hpWatchPre = cur;
    try {
      Object.defineProperty(G, 'hp', {
        configurable: true,
        enumerable: true,
        get() { return cur; },
        set(v) {
          const nv = Math.round(+v);
          if (Number.isFinite(nv) && nv < cur) hpWatchPre = cur;
          if (Number.isFinite(nv)) cur = nv;
        },
      });
      G.__zf39HpArm = 1;
    } catch (e) {}
    return G;
  }
  function preTrapHp(G, body, dmg) {
    G = getG(G);
    const after = Math.round((G && G.hp) || 0);
    dmg = Math.max(0, Math.round(+dmg || 0));
    // Unambiguous: dungeon did not clamp to 1 → pre = after + nominal dmg.
    if (after > 1) return after + dmg;
    // Clamped (after === 1): prefer live snapshot if it matches dungeon formula.
    if (hpWatchPre != null && Math.max(1, hpWatchPre - dmg) === after) return hpWatchPre;
    try {
      if (W.__zf39DngPreHp != null && Number.isFinite(+W.__zf39DngPreHp)) return +W.__zf39DngPreHp | 0;
    } catch (e) {}
    const shown = parseTrapAfterHp(body);
    if (shown != null && shown > 1) return shown + dmg;
    // Last resort (should not hit once watch is armed): treat nominal as actual lost.
    return after + dmg;
  }
  // Restore to pre-trap HP, optionally keeping reduced actual damage. Never exceed preHp / mhp; floor at 1.
  function restoreHp(G, preHp, keptDmg) {
    G = getG(G); if (!G) return 0;
    if (preHp == null || !Number.isFinite(+preHp)) return 0;
    let mhp = 999999;
    try { const g = gm(); if (g && typeof g.stats === 'function') mhp = (g.stats().mhp) || mhp; } catch (e) {}
    keptDmg = Math.max(0, Math.round(+keptDmg || 0));
    const before = G.hp || 0;
    const target = Math.max(1, Math.min(mhp, Math.min(+preHp, +preHp - keptDmg)));
    G.hp = target;
    return G.hp - before;
  }
  function applyDmg(G, dmg) {
    G = getG(G); if (!G) return 0;
    dmg = Math.max(0, Math.round(+dmg || 0));
    const before = G.hp;
    G.hp = Math.max(1, (G.hp || 0) - dmg);
    return before - G.hp;
  }
  function failDmg(base) {
    return Math.max(1, Math.round((+base || 0) * (N.trapFailMul || 1.2)));
  }
  function zwsReward() { return rtRoll(0.5) ? 2 : 1; }
  function giveZws(G, n) {
    G = getG(G); if (!G || !n) return 0;
    G.inv = G.inv || {};
    G.inv.zws39 = (G.inv.zws39 || 0) + n;
    return n;
  }
  function bandOf(G) {
    try {
      if (typeof Dng !== 'undefined' && Dng && Dng.run && typeof Dng.run.band === 'number') return Dng.run.band;
    } catch (e) {}
    G = getG(G);
    const realm = (G && G.realm) || 1;
    return Math.max(0, Math.min(4, realm - 1));
  }
  function shouldOffer(G) {
    G = getG(G);
    if (!G || !Z.learned(G)) return false;
    if (storyBlock()) return false;
    return true;
  }
  function isTrapTitle(title) {
    return title === P.trap_title || title === '触发陷阱';
  }

  function settleOk(G, eyes) {
    G = getG(G);
    const xpN = Z.breakXp(eyes);
    const up = Z.addXp(G, xpN);
    const zws = giveZws(G, zwsReward());
    announceXp(up.add, up.ups);
    if (zws && canToast()) toast(`阵纹石 ×${zws}`, '#ffd25e');
    return { ok: true, xp: up.add, ups: up.ups || [], zws, eyes };
  }
  function settleFail(G, baseDmg) {
    G = getG(G);
    const dmg = failDmg(baseDmg);
    applyDmg(G, dmg);
    const up = Z.addXp(G, N.xp.breakFail);
    announceXp(up.add, up.ups);
    return { ok: false, xp: up.add, ups: up.ups || [], dmg, eyes: 0 };
  }
  function playPuzzle(puz, picks) {
    const out = [];
    for (const p of picks) {
      const r = Z.checkStep(puz, p);
      out.push(r);
      if (r === 'done' || r === 'fail' || r === 'over') break;
    }
    return out;
  }

  // 不走 UI._q 的弹卡（可在 UI.card 回调内安全调用）
  function showCard(title, text, por, opts) {
    opts = opts || ['好'];
    // 单测：记录到 UI.cards，用 _nextChoice
    try {
      if (typeof UI !== 'undefined' && UI && Array.isArray(UI.cards)) {
        UI.cards.push({ title, text, opts: opts.slice() });
        const ch = UI._nextChoice != null ? UI._nextChoice : 0;
        return Promise.resolve(ch);
      }
    } catch (e) {}
    // 浏览器：自建 mwrap，不入 _q
    if (typeof UI === 'undefined' || !UI.push || typeof document === 'undefined' || !document.body) {
      return Promise.resolve(0);
    }
    return new Promise(res => {
      const w = document.createElement('div');
      w.className = 'mwrap';
      const c = document.createElement('div');
      c.className = 'card';
      const porCss = (typeof window !== 'undefined' && window.porCss) ? window.porCss : () => '';
      let porStyle = '';
      try { porStyle = (typeof porCss === 'function') ? porCss(por || 'i:scroll', 92) : ''; } catch (e) {}
      c.innerHTML = `<div class="ct">${esc(title)}</div>
        <div class="cb"><div class="cp" style="${porStyle}"></div><div class="tx">${esc(text).replace(/\n/g, '<br>')}</div></div>
        <div class="opts">${opts.map((o, k) => `<button class="opt" data-k="${k}">${esc(o)}</button>`).join('')}</div>`;
      w.appendChild(c);
      UI.push(w);
      c.querySelector('.opts').onclick = e => {
        const b = e.target.closest('.opt'); if (!b) return;
        try { if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('click'); } catch (err) {}
        try { UI.pop(w); } catch (err) {}
        res(+b.dataset.k);
      };
    });
  }

  async function puzzleUI(puz, lv) {
    const auto = !!(W.__zf39DngAutoPuzzle);
    const noDom = (typeof UI === 'undefined' || !UI.push || typeof document === 'undefined'
      || typeof document.body === 'undefined' || !document.body);
    if (auto || noDom) {
      playPuzzle(puz, puz.seq.slice());
      return !!puz.done;
    }
    const hints = Z.hints(lv);
    return new Promise(res => {
      const w = document.createElement('div');
      w.className = 'mwrap';
      const c = document.createElement('div');
      c.className = 'card';
      const rule = Z.fmt(P.rule, { m: puz.max });
      const eyesHtml = puz.eyes.map((e, i) => {
        const glow = hints.glow && e.el === puz.gate ? ' box-shadow:0 0 10px #ffe680;' : '';
        return `<button class="opt zf39eye" data-i="${i}" style="min-width:64px;min-height:64px;margin:6px;font-size:22px;${glow}">${esc(e.el)}</button>`;
      }).join('');
      c.innerHTML = `<div class="ct">⚑ 破阵</div>
        <div class="cb"><div class="tx" id="zf39pzmsg">${esc(rule).replace(/\n/g, '<br>')}</div></div>
        <div class="opts" id="zf39pzeg" style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;padding:8px;">${eyesHtml}</div>
        <p class="hint" id="zf39pzhint" style="text-align:center;"></p>`;
      w.appendChild(c);
      UI.push(w);
      const eg = c.querySelector('#zf39pzeg');
      const hintEl = c.querySelector('#zf39pzhint');
      const msgEl = c.querySelector('#zf39pzmsg');
      const refreshArrow = () => {
        if (!hints.arrow || puz.err < 1 || puz.done || puz.fail) return;
        hintEl.textContent = `下一眼：${puz.seq[puz.step]}`;
      };
      eg.onclick = e => {
        const b = e.target.closest('button.zf39eye'); if (!b) return;
        if (puz.done || puz.fail) return;
        const i = +b.dataset.i;
        const r = Z.checkStep(puz, i);
        try { if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('click'); } catch (err) {}
        if (r === 'hit' || r === 'done') {
          b.style.opacity = '0.45'; b.disabled = true;
          const hits = P.hit || ['对了。'];
          msgEl.innerHTML = esc(hits[Math.floor(rng01() * hits.length)] || '对了。');
        } else if (r === 'miss' || r === 'fail') {
          b.style.outline = '2px solid #ff6b6b';
          setTimeout(() => { try { b.style.outline = ''; } catch (err) {} }, 280);
          const misses = P.miss || ['错了。'];
          msgEl.innerHTML = esc(misses[Math.floor(rng01() * misses.length)] || '错了。');
          refreshArrow();
        }
        if (r === 'done') setTimeout(() => { try { UI.pop(w); } catch (err) {} res(true); }, 180);
        else if (r === 'fail') setTimeout(() => { try { UI.pop(w); } catch (err) {} res(false); }, 180);
      };
    });
  }

  async function offerChoice(G) {
    G = getG(G);
    const lv = (G.zf39 && G.zf39.lv) || 0;
    const optB = Z.fmt(P.opt_break, { lv });
    const optR = P.opt_rush || '硬闯';
    return showCard(P.trap_title, P.trap_body, 'i:sk_poison', [optB, optR]);
  }

  async function interceptTrapCard(body, por) {
    const G = getG();
    armHpWatch(G);
    const dmg = parseTrapDmg(body);
    const preHp = preTrapHp(G, body, dmg);
    restoreHp(G, preHp, 0);
    const choice = await offerChoice(G);
    if (choice !== 0) {
      applyDmg(G, dmg);
      const s = (() => { try { return gm().stats(); } catch (e) { return { mhp: G.hp }; } })();
      await showCard(P.trap_title,
        `地面阵法骤亮，一道剑罡擦着你的肩头划过。\n气血 -${dmg}（${Math.round(G.hp)}/${s.mhp || '?'}）`,
        por || 'i:sk_poison', ['咬牙继续']);
      return 0;
    }
    const eyes = Z.eyesFor(bandOf(G));
    const lv = (G.zf39 && G.zf39.lv) || 1;
    const puz = Z.start(Z.genPuzzle(eyes, rng01), lv);
    const okPz = await puzzleUI(puz, lv);
    if (okPz) {
      const r = settleOk(G, eyes);
      await showCard('破阵成功', P.ok + `\n阵道 +${r.xp}` + (r.zws ? `　阵纹石 ×${r.zws}` : ''), 'i:scroll', ['好']);
    } else {
      const r = settleFail(G, dmg);
      await showCard('破阵失败', P.fail + `\n气血 -${r.dmg}　阵道 +${r.xp}`, 'i:sk_poison', ['咬牙继续']);
    }
    return 0;
  }

  async function roomTrapImpl() {
    const G = getG();
    if (!G) return;
    const r = (typeof Dng !== 'undefined' && Dng && Dng.run) ? Dng.run : null;
    const g = gm();
    const s = (g && g.stats) ? g.stats() : { mhp: 100 };
    const rnd = (a, b) => a + rng01() * (b - a);
    const base = Math.round(s.mhp * rnd(0.12, 0.28));

    if (!Z.learned(G) || storyBlock()) {
      applyDmg(G, base);
      if (r) r.doneRooms = (r.doneRooms || 0) + 1;
      try { if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('trap'); } catch (e) {}
      const dodgeP = G.st ? 0.15 + (G.spdBonus || 0) : 0.15;
      if (rtRoll(dodgeP)) { toast('你身法矫健，堪堪避开了剑阵！', '#9aff9a'); return; }
      await showCard(P.trap_title,
        `地面阵法骤亮，一道剑罡擦着你的肩头划过。\n气血 -${base}（${Math.round(G.hp)}/${s.mhp}）`,
        'i:sk_poison', ['咬牙继续']);
      return;
    }

    if (r) r.doneRooms = (r.doneRooms || 0) + 1;
    try { if (typeof Sfx !== 'undefined' && Sfx.play) Sfx.play('trap'); } catch (e) {}

    const choice = await offerChoice(G);
    if (choice !== 0) {
      applyDmg(G, base);
      await showCard(P.trap_title,
        `地面阵法骤亮，一道剑罡擦着你的肩头划过。\n气血 -${base}（${Math.round(G.hp)}/${s.mhp}）`,
        'i:sk_poison', ['咬牙继续']);
      return;
    }
    const eyes = Z.eyesFor(bandOf(G));
    const lv = G.zf39.lv;
    const puz = Z.start(Z.genPuzzle(eyes, rng01), lv);
    const okPz = await puzzleUI(puz, lv);
    if (okPz) {
      const rr = settleOk(G, eyes);
      await showCard('破阵成功', P.ok + `\n阵道 +${rr.xp}` + (rr.zws ? `　阵纹石 ×${rr.zws}` : ''), 'i:scroll', ['好']);
    } else {
      const rr = settleFail(G, base);
      await showCard('破阵失败', P.fail + `\n气血 -${rr.dmg}　阵道 +${rr.xp}`, 'i:sk_poison', ['咬牙继续']);
    }
  }

  const API = {
    parseTrapDmg, parseTrapAfterHp, preTrapHp, restoreHp, applyDmg, failDmg, zwsReward, giveZws,
    shouldOffer, isTrapTitle, settleOk, settleFail, playPuzzle, puzzleUI, showCard,
    bandOf, storyBlock, canToast, roomTrap: roomTrapImpl, interceptTrapCard, armHpWatch,
  };
  W.ZF39Dng = API;
  Z.dng = API;

  try {
    if (typeof Dng !== 'undefined' && Dng && !Dng.roomTrap) Dng.roomTrap = roomTrapImpl;
    else if (W.Dng && !W.Dng.roomTrap) W.Dng.roomTrap = roomTrapImpl;
  } catch (e) {}
  try { armHpWatch(getG()); } catch (e) {}
  try {
    const dng = (typeof Dng !== 'undefined' && Dng) || W.Dng;
    if (dng && typeof dng.start === 'function' && !dng._zf39StartArm) {
      const _start = dng.start.bind(dng);
      dng.start = function () { try { armHpWatch(getG()); } catch (e) {} return _start.apply(this, arguments); };
      dng._zf39StartArm = 1;
    }
  } catch (e) {}

  if (typeof UI === 'undefined' || typeof UI.card !== 'function') return;
  if (W.__zf39Dng) return;
  W.__zf39Dng = 1;
  const _card = UI.card.bind(UI);
  UI._zf39DngCard = _card;
  UI.card = function (title, text, por, opts, extra) {
    try { armHpWatch(getG()); } catch (e) {}
    if (isTrapTitle(title) && shouldOffer(getG())) {
      const self = this;
      const run = () => interceptTrapCard(text, por);
      if (self._q && typeof self._q.then === 'function') {
        const p = self._q.then(run);
        self._q = p.catch(() => { });
        return p;
      }
      return Promise.resolve().then(run);
    }
    return _card(title, text, por, opts, extra);
  };
})(typeof window !== 'undefined' ? window : globalThis);

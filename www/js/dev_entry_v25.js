'use strict';
// v2.5 开发者入口：试炼场 + 阶段3 债务奇遇 + 一键全套神装 + 即时战斗 + 奇遇链（钱多多）+ 查账链（记账童子）+ 追兵战（债压档位）+ 突破预估（债压→突破难度，只读）

(function () {
  // game.js / ui.js 用顶层 `const Game` / `const UI` 声明：是全局词法绑定，不挂在 window 上（window.Game 恒为 undefined），必须用 typeof 取
  const gameObj = () => (typeof Game !== 'undefined' && Game ? Game : null);
  const uiObj = () => (typeof UI !== 'undefined' && UI ? UI : null);
  const toast = (...a) => { const u = uiObj(); if (u && u.toast) u.toast(...a); };

  function addEntry() {
    if (document.getElementById('v25-entry')) return;

    // 试炼场按钮（覆盖层iframe，不跳页）
    const btn = document.createElement('button');
    btn.id = 'v25-entry';
    btn.textContent = '试炼场';
    btn.style.cssText = 'position:fixed;right:12px;bottom:120px;z-index:9999;padding:8px 14px;background:#2a3a5a;color:#ffe680;border:1px solid #ffe680;border-radius:20px;font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,.4);';
    btn.onclick = async () => {
      const c = confirm('进入独立遭遇战原型？\n（覆盖层打开，不影响存档，可关闭返回）\n\n取消则执行阶段3债务奇遇。');
      if (c) {
        openEncounterOverlay();
      } else if (window.Stage3 && gameObj() && gameObj().G) {
        await Stage3.test(gameObj().G);
      }
    };
    document.body.appendChild(btn);

    // 一键全套神装按钮
    const eqBtn = document.createElement('button');
    eqBtn.id = 'v25-eq';
    eqBtn.textContent = '全套神装';
    eqBtn.style.cssText = 'position:fixed;right:12px;bottom:170px;z-index:9999;padding:8px 14px;background:#3a2a5a;color:#ffb0ff;border:1px solid #ffb0ff;border-radius:20px;font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,.4);';
    eqBtn.onclick = () => {
      if (!gameObj() || !gameObj().G) { toast('请先开始一局（没有存档）'); return; }
      if (!confirm('一键生成并穿上全套最高品质装备？\n（仅开发者模式，影响当前存档）')) return;
      giveFullGodGear();
      toast('已穿上全套神装', '#ffb0ff');
      const u = uiObj(); if (u && u.hud) u.hud();
    };
    document.body.appendChild(eqBtn);

    // 即时战斗按钮
    const rtBtn = document.createElement('button');
    rtBtn.id = 'v25-rt';
    rtBtn.textContent = '即时战';
    rtBtn.style.cssText = 'position:fixed;right:12px;bottom:220px;z-index:9999;padding:8px 14px;background:#2a5a3a;color:#b0ffb0;border:1px solid #b0ffb0;border-radius:20px;font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,.4);';
    rtBtn.onclick = async () => {
      // 自带覆盖层画布 + 循环，打完/× / Escape 关闭；不接正式战斗链、不改存档
      if (window.RealtimeBattle && RealtimeBattle.open) RealtimeBattle.open(null, { force: true });
    };
    document.body.appendChild(rtBtn);

    // 奇遇链按钮：阶段 3 小闭环 #2「钱多多的赊账单」（奇遇选择 → 钱多多态度 → 债务后果），会改当前存档
    const qyBtn = document.createElement('button');
    qyBtn.id = 'v25-qy';
    qyBtn.textContent = '奇遇链';
    qyBtn.style.cssText = 'position:fixed;right:12px;bottom:270px;z-index:9999;padding:8px 14px;background:#5a4a2a;color:#ffd8a0;border:1px solid #ffd8a0;border-radius:20px;font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,.4);';
    qyBtn.onclick = async () => {
      const g = gameObj();
      if (!window.Stage3 || !g || !g.G) { toast('请先开始一局（没有存档）'); return; }
      await Stage3.runMerchantChain(g.G);
    };
    document.body.appendChild(qyBtn);

    // 查账链按钮：阶段 3 小闭环 #3「记账童子的错账」（仙官·记账童子 + 天道债务），会改当前存档
    const qy2 = document.createElement('button');
    qy2.id = 'v25-qy2';
    qy2.textContent = '查账链';
    qy2.style.cssText = 'position:fixed;right:12px;bottom:320px;z-index:9999;padding:8px 14px;background:#4a3a5a;color:#e0c8ff;border:1px solid #e0c8ff;border-radius:20px;font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,.4);';
    qy2.onclick = async () => {
      const g = gameObj();
      if (!window.Stage3 || !g || !g.G) { toast('请先开始一局（没有存档）'); return; }
      await Stage3.runLedgerChain(g.G);
    };
    document.body.appendChild(qy2);

    // 追兵战按钮：债务系统强化 #1/#2——按当前债压档位（Stage3.debtPressure）刷讨债鬼进即时战原型；
    // 打完按胜负结算（Stage3.settleBounty：胜撤通缉、败加误工费）并存档；中途关掉不结算。不发奖。
    // 债务强化 #4：重债/天道通缉档追兵出手更快、前摇更短、弹道散射（参数由 bountyEnemies 带上），顶栏与结算卡标注档位特性。
    const zb = document.createElement('button');
    zb.id = 'v25-zb';
    zb.textContent = '追兵战';
    zb.style.cssText = 'position:fixed;right:12px;bottom:370px;z-index:9999;padding:8px 14px;background:#5a2a2a;color:#ffb0a0;border:1px solid #ffb0a0;border-radius:20px;font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,.4);';
    zb.onclick = async () => {
      const g = gameObj();
      if (!window.Stage3 || !g || !g.G) { toast('请先开始一局（没有存档）'); return; }
      if (!window.RealtimeBattle || !RealtimeBattle.open) return;
      const G = g.G;
      const P = Stage3.debtPressure(G);
      const h = RealtimeBattle.open(Stage3.bountyEnemies(G), { force: true, label: '追兵·' + P.n + (P.trait ? '·' + P.trait : '') });
      if (!h) return;
      toast(`债压「${P.n}」（欠 ${P.debt}${P.bounty ? '，被通缉' : ''}）：${P.hunters} 个讨债鬼追上来了${P.trait ? '（' + P.trait + '）' : ''}`, '#ffb0a0');
      const r = await h.done;
      const s = Stage3.settleBounty(G, Object.assign({}, r, { tier: P.tier }));
      if (s.settled && typeof g.save === 'function') g.save();
      if (h.closed) await h.closed;
      const u = uiObj();
      if (!s.settled) { toast('中途离场：追兵战不结算', '#cccccc'); return; }
      if (u && u.card) {
        await u.card('追兵战结算', `${s.result === 'win' ? '胜' : '败'}·${s.n}\n${s.note}\n债务：${s.debtBefore} → ${s.debtAfter}${s.bountyCleared ? '\n通缉已撤销' : ''}\n追兵特性：${P.traitNote}`, 'i:bill', ['好']);
        if (u.hud) u.hud();
      }
    };
    document.body.appendChild(zb);

    // 突破预估按钮：债务系统强化 #3——按债压档位预估「欠得多突破更难」（Stage3.breakthroughPreview），只读：不改存档、不动正式突破
    const tp = document.createElement('button');
    tp.id = 'v25-tp';
    tp.textContent = '突破预估';
    tp.style.cssText = 'position:fixed;right:12px;bottom:420px;z-index:9999;padding:8px 14px;background:#2a4a5a;color:#a0e8ff;border:1px solid #a0e8ff;border-radius:20px;font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,.4);';
    tp.onclick = async () => {
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
    };
    document.body.appendChild(tp);
  }

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

  let clicks = 0, last = 0;
  document.addEventListener('click', e => {
    const t = e.target;
    if (!t || !t.closest || !t.closest('#title, .ver, #ver')) return;
    const now = Date.now();
    if (now - last > 1500) clicks = 0;
    last = now;
    if (++clicks >= 7) {
      clicks = 0;
      addEntry();
      toast('已开启开发者入口', '#ffe680');
    }
  });

  if (location.hash === '#dev' || location.search.includes('dev=1')) {
    setTimeout(addEntry, 500);
  }
})();

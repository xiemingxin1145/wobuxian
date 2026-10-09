'use strict';
// ======================= v2.2 渡劫突破演出：乌云压城 → 九道天雷 → 金光破云 → 境界大字（可点击跳过） =======================
(function () {
  const V = window.VFX; if (!V) return;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  V.breakthrough = function (name, fail) {
    return new Promise(async res => {
      const fast = B.speed > 1 || (window.BOT && BOT.on);
      const el = h('div', 'brk-fx b22' + (fail ? ' fail' : ''), `<canvas class="b22cv"></canvas><div class="b22-txt"><b>${esc(name)}</b><small>${fail ? '天劫未过 · 道基受损' : '天 道 认 证 · 境 界 突 破'}</small><em class="b22-bill">${fail ? '天道讨债司：修为-30%，<i>利息照算</i>' : '天道讨债司：客户等级已升级，管理费上调 0.5%，<i>已认证</i>'}</em></div><div class="b22-tip">点击跳过</div>`);
      document.body.appendChild(el);
      const cv = el.querySelector('canvas'); const D = Math.min(2, devicePixelRatio || 1); const W = innerWidth, H = innerHeight;
      cv.width = W * D; cv.height = H * D; const x = cv.getContext('2d');
      const spr = Game.G ? Game.playerSpr() : null; if (spr) loadSprite(spr);
      const S = { t0: performance.now(), bolts: [], parts: [], flash: 0, shake: 0, gold: 0, ring: [], alive: true, skip: false, last: 0 };
      const cx = W / 2, gy = H * 0.66;
      // 每境界配色（主色 / 高光）
      const PAL = { 练气: ['159,232,255', '#e6fbff'], 筑基: ['127,224,160', '#e0ffe8'], 金丹: ['255,207,58', '#fff6d0'], 元婴: ['255,154,106', '#ffe2d0'], 化神: ['200,154,255', '#f0e4ff'], 渡劫: ['138,160,255', '#e8ecff'] };
      const pal = PAL[String(name).replace(/\s|期/g, '')] || ['255,220,120', '#fff6d0']; const PC = pal[0];
      const clouds = Array.from({ length: 26 }, (_, k) => ({ x: Math.random() * W, y: Math.random() * H * 0.28, r: 50 + Math.random() * 90, sp: (Math.random() - 0.5) * 14, s: Math.random() }));
      const bolt = (x0) => { const pts = [[x0, -10]]; let px = x0, py = -10; const n = 14; for (let k = 1; k <= n; k++) { py = gy - 40 - (gy - 40 + 10) * (1 - k / n); px += (Math.random() - 0.5) * 50 + (cx - px) * 0.18; pts.push([px, py]); } S.bolts.push({ pts, t: 0, life: 0.45 }); S.flash = Math.max(S.flash, fail ? 0.6 : 0.75); S.shake = 1; for (let k = 0; k < 26; k++) { const a = -Math.PI * Math.random(), v = 120 + Math.random() * 260; S.parts.push({ x: cx, y: gy - 40, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 420, life: 1, c: '#c8d0ff', r: 2 + Math.random() * 3 }); } };
      const loop = now => {
        if (!S.alive) return;
        const dt = Math.min(0.1, (now - (S.last || now)) / 1000) || 0.016; S.last = now; const t = (now - S.t0) / 1000;
        x.setTransform(D, 0, 0, D, 0, 0); x.clearRect(0, 0, W, H);
        const sh = S.shake > 0 ? (Math.random() - 0.5) * 16 * S.shake : 0; S.shake = Math.max(0, S.shake - dt * 2.5); x.translate(sh, sh * 0.5);
        // 天色：乌云 → 金光
        const g = x.createLinearGradient(0, 0, 0, H); const gd = S.gold;
        g.addColorStop(0, gd ? `rgba(${60 + 195 * gd},${40 + 170 * gd},${90 - 30 * gd},1)` : 'rgb(18,14,36)'); g.addColorStop(0.7, gd ? `rgba(${40 + 120 * gd},${30 + 90 * gd},${60},1)` : 'rgb(30,24,60)'); g.addColorStop(1, 'rgb(8,6,16)');
        x.fillStyle = g; x.fillRect(-20, -20, W + 40, H + 40);
        // 乌云
        for (const c of clouds) { c.x += c.sp * dt; if (c.x < -c.r) c.x = W + c.r; if (c.x > W + c.r) c.x = -c.r; const cg = x.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r); const lit = 0.25 + S.flash * 0.6 + gd * 0.6; cg.addColorStop(0, `rgba(${90 + 140 * gd},${80 + 120 * gd},${130 + 40 * gd},${0.55 + lit * 0.3})`); cg.addColorStop(1, 'rgba(40,30,70,0)'); x.fillStyle = cg; x.beginPath(); x.arc(c.x, c.y, c.r, 0, 6.283); x.fill(); }
        // 金光光柱 + 冲击环
        if (gd > 0) {
          const pw = 50 + 70 * gd; const pg = x.createLinearGradient(cx - pw, 0, cx + pw, 0); pg.addColorStop(0, `rgba(${PC},0)`); pg.addColorStop(0.35, `rgba(${PC},${0.6 * gd})`); pg.addColorStop(0.5, `rgba(255,250,230,${0.9 * gd})`); pg.addColorStop(0.65, `rgba(${PC},${0.6 * gd})`); pg.addColorStop(1, `rgba(${PC},0)`);
          x.globalCompositeOperation = 'lighter'; x.fillStyle = pg; x.fillRect(cx - pw, 0, pw * 2, gy); x.globalCompositeOperation = 'source-over';
        }
        for (const r of S.ring) { r.t += dt; const k = r.t / 1.2; if (k > 1) continue; x.strokeStyle = `rgba(${PC},${1 - k})`; x.lineWidth = 6 * (1 - k) + 1; x.beginPath(); x.ellipse(cx, gy, 30 + k * W * 0.7, (30 + k * W * 0.7) * 0.32, 0, 0, 6.283); x.stroke(); }
        // 角色（打坐 idle，受雷时闪白）
        if (spr && AS.sprites[spr]) { x.save(); if (S.flash > 0.3) x.filter = 'brightness(2.2)'; if (fail && t > 1.6) x.globalAlpha = 0.6 + Math.sin(t * 30) * 0.3; x.shadowColor = gd ? '#ffe080' : '#8a8aff'; x.shadowBlur = 20 + gd * 30; drawSprite(x, spr, 'idle', 'S', (t * 6) | 0, cx, gy, 1.6); x.restore(); }
        // 雷电
        x.globalCompositeOperation = 'lighter';
        for (const b of S.bolts) { b.t += dt; const k = 1 - b.t / b.life; if (k <= 0) continue; for (const [w, c] of [[16, 'rgba(150,130,255,0.35)'], [7, 'rgba(210,200,255,0.8)'], [3, '#fff']]) { x.strokeStyle = c; x.lineWidth = w * k; x.beginPath(); x.moveTo(b.pts[0][0], b.pts[0][1]); for (const p of b.pts) x.lineTo(p[0], p[1]); x.stroke(); } }
        for (let i = S.parts.length - 1; i >= 0; i--) { const p = S.parts[i]; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 0.9; if (p.life <= 0) { S.parts.splice(i, 1); continue; } x.fillStyle = p.c; x.globalAlpha = p.life; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.283); x.fill(); }
        x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
        if (S.flash > 0) { x.fillStyle = `rgba(255,255,255,${Math.min(1, S.flash)})`; x.fillRect(-20, -20, W + 40, H + 40); S.flash -= dt * 3; }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
      el.onclick = () => { S.skip = true; };
      const step = async ms => { if (!S.skip) await wait(fast ? ms * 0.25 : ms); };
      Sfx.play('thunder', 0.5); R.shake = 0.6; await step(500);
      const strikes = fail ? 4 : 5;
      for (let k = 0; k < strikes && !S.skip; k++) { bolt(cx + (Math.random() - 0.5) * 160); Sfx.play('thunder', 0.8); await step(k < 2 ? 420 : 300); }
      if (fail) {
        Sfx.play('fail'); for (let k = 0; k < 24; k++) S.parts.push({ x: cx + (Math.random() - 0.5) * 40, y: gy - 120, vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 60, g: -10, life: 1.6, c: 'rgba(60,60,70,0.8)', r: 6 + Math.random() * 8 });
        el.classList.add('show'); await step(1800);
      } else {
        bolt(cx); S.flash = 1; Sfx.play('breakthrough');
        const t1 = performance.now(); const up = () => { S.gold = Math.min(1, (performance.now() - t1) / 600); if (S.gold < 1 && S.alive) requestAnimationFrame(up); }; up();
        for (let k = 0; k < 3; k++) setTimeout(() => S.ring.push({ t: 0 }), k * 180);
        for (let k = 0; k < 70; k++) { const a = Math.random() * 6.283, v = 100 + Math.random() * 300; S.parts.push({ x: cx, y: gy - 60, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, g: 160, life: 1.4, c: k % 3 ? `rgb(${PC})` : pal[1], r: 2 + Math.random() * 4 }); }
        el.classList.add('show'); R.flash = 0.6; await step(2100);
      }
      // 地图上同步粒子
      if (R.player && R.M) { const [px, py] = t2p(R.player.i, R.player.j); for (let k = 0; k < 40; k++) part({ x: px, y: py - 60, vx: rnd(-260, 260), vy: rnd(-380, 40), g: 260, r: rnd(3, 8), c: fail ? '#c0c0c0' : '#ffe680', life: 1.4, add: true, star: k % 3 === 0 }); }
      el.classList.add('show'); el.classList.add('out'); setTimeout(() => { S.alive = false; el.remove(); res(); }, 350);
    });
  };
})();
// v2.2：接上失败演出与飞升演出
(function () {
  if (!window.VFX || !window.UI || !window.Game) return;
  const _card = UI.card;
  UI.card = async function (title) {
    if (title === '突破失败' && VFX.breakthrough && Game.G) { const G = Game.G; await VFX.breakthrough(REALMS[Math.min(7, G.realm + 1)].n, true); }
    return _card.apply(this, arguments);
  };
  const _die = Game.die;
  Game.die = async function (why) {
    const G = this.G;
    if (G && G.realm === 7 && !G._ascFx && VFX.breakthrough) { G._ascFx = 1; await VFX.breakthrough('飞 升', false); }
    return _die.apply(this, arguments);
  };
})();

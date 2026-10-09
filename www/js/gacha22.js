'use strict';
// ======================= v2.2 求仙缘演出：阵法 → 蓄力 → 光柱 → 翻牌 → 稀有切入（可跳过） =======================
(function () {
  const TC = { 2: '#6ab8ff', 3: '#b77aff', 4: '#ffcf3a' };
  const TN = { 2: '宝品', 3: '仙品', 4: '神品' };
  const GUA = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];
  const RUNE = '天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏闰余成岁律吕调阳云腾致雨露结为霜金生丽水玉出昆冈';
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const hexA = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };

  UI.gachaShow = function (items) {
    return new Promise(async done => {
      const best = Math.max(...items.map(i => i.tier));
      const w = h('div', 'gacha-fx g22 t' + best); document.body.appendChild(w);
      const cv = document.createElement('canvas'); cv.className = 'g22cv'; w.appendChild(cv);
      const D = Math.min(2, window.devicePixelRatio || 1); const W = innerWidth, H = innerHeight;
      cv.width = W * D; cv.height = H * D; const x = cv.getContext('2d'); x.scale(D, D);
      const skip = h('button', 'gskip', '跳过 ▶▶'); w.appendChild(skip);
      const S = { t0: performance.now(), phase: 0, col: '#9fe8ff', charge: 0, pillars: [], parts: [], flash: 0, shake: 0, skipped: false, alive: true };
      skip.onclick = () => { S.skipped = true; Sfx.play('click'); };
      const cx = W / 2, cy = H * 0.42, RAD = Math.min(W, H) * 0.36;
      // 粒子
      const burst = (px, py, c, n, sp) => { for (let k = 0; k < n; k++) { const a = Math.random() * 6.283, v = sp * (0.3 + Math.random()); S.parts.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.2, life: 1, c, r: 1.5 + Math.random() * 3, g: 160 }); } };
      const swirl = () => { const a = Math.random() * 6.283, r = RAD * (1.1 + Math.random() * 0.5); S.parts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.45, tx: cx, ty: cy, life: 1, c: S.col, r: 1.5 + Math.random() * 2.5, sw: 1 }); };
      // 绘制
      const loop = now => {
        if (!S.alive) return;
        const t = (now - S.t0) / 1000; const dt = Math.min(0.1, Math.max(0.001, (now - (S.last || now)) / 1000)) || 1 / 60; S.last = now;
        x.setTransform(D, 0, 0, D, 0, 0); x.clearRect(0, 0, W, H);
        const sh = S.shake > 0 ? (Math.random() - 0.5) * S.shake * 14 : 0; S.shake = Math.max(0, S.shake - dt * 1.5);
        x.save(); x.translate(sh, sh * 0.6);
        // 背景星辉
        const bg = x.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H)); bg.addColorStop(0, hexA(S.col, 0.10 + S.charge * 0.12)); bg.addColorStop(0.55, 'rgba(0,0,0,0)'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
        // 阵法（透视压扁的圆）
        const draw = Math.min(1, t / 1.0); const rot = t * (0.3 + S.charge * 2.2);
        x.save(); x.translate(cx, cy); x.scale(1, 0.45); x.globalCompositeOperation = 'lighter';
        x.shadowColor = S.col; x.shadowBlur = 12 + S.charge * 20; x.strokeStyle = hexA(S.col, 0.9); x.lineWidth = 2.2;
        for (const [rr, dir, lw] of [[1, 1, 3], [0.86, -1, 1.5], [0.62, 1, 2.5], [0.4, -1, 1.5]]) { x.lineWidth = lw; x.beginPath(); x.arc(0, 0, RAD * rr, rot * dir, rot * dir + 6.283 * draw); x.stroke(); }
        // 八卦方位与符文
        x.save(); x.rotate(rot); x.lineWidth = 1.6; x.beginPath();
        for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; const a2 = (k + 3) / 8 * 6.283; x.moveTo(Math.cos(a) * RAD * 0.86, Math.sin(a) * RAD * 0.86); x.lineTo(Math.cos(a2) * RAD * 0.86, Math.sin(a2) * RAD * 0.86); }
        if (draw >= 1) x.stroke();
        x.fillStyle = hexA(S.col, 0.95); x.font = `bold ${Math.round(RAD * 0.13)}px WBXKai,serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
        for (let k = 0; k < 8; k++) { if (k / 8 > draw) break; const a = k / 8 * 6.283 + 0.39; x.save(); x.translate(Math.cos(a) * RAD * 0.74, Math.sin(a) * RAD * 0.74); x.rotate(a + 1.57); x.fillText(GUA[k], 0, 0); x.restore(); }
        x.font = `${Math.round(RAD * 0.07)}px WBXKai,serif`;
        for (let k = 0; k < 36; k++) { if (k / 36 > draw) break; const a = -k / 36 * 6.283 * 1; x.save(); x.translate(Math.cos(a) * RAD * 0.93, Math.sin(a) * RAD * 0.93); x.rotate(a + 1.57); x.fillText(RUNE[k % RUNE.length], 0, 0); x.restore(); }
        x.restore();
        // 中心太极光核
        const core = x.createRadialGradient(0, 0, 0, 0, 0, RAD * (0.25 + S.charge * 0.35)); core.addColorStop(0, 'rgba(255,255,255,' + (0.4 + S.charge * 0.6) + ')'); core.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = core; x.beginPath(); x.arc(0, 0, RAD * (0.25 + S.charge * 0.35), 0, 6.283); x.fill();
        x.restore();
        // 光柱
        x.globalCompositeOperation = 'lighter';
        for (const p of S.pillars) {
          const k = Math.min(1, (now - p.t) / 260); const fade = Math.max(0, 1 - (now - p.t - 900) / 1400); if (fade <= 0) continue;
          const pw = p.w * (0.6 + 0.4 * Math.sin(now / 60 + p.x)); const g = x.createLinearGradient(p.x - pw, 0, p.x + pw, 0);
          g.addColorStop(0, hexA(p.c, 0)); g.addColorStop(0.5, hexA(p.c, 0.85 * fade)); g.addColorStop(1, hexA(p.c, 0));
          x.fillStyle = g; x.fillRect(p.x - pw, -10, pw * 2, (p.y + 10) * k);
          const g2 = x.createLinearGradient(p.x - pw * 0.25, 0, p.x + pw * 0.25, 0); g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(0.5, `rgba(255,255,255,${0.9 * fade})`); g2.addColorStop(1, 'rgba(255,255,255,0)');
          x.fillStyle = g2; x.fillRect(p.x - pw * 0.25, -10, pw * 0.5, (p.y + 10) * k);
        }
        // 粒子
        for (let i = S.parts.length - 1; i >= 0; i--) {
          const p = S.parts[i];
          if (p.sw) { p.x += (p.tx - p.x) * 0.06; p.y += (p.ty - p.y) * 0.06; p.life -= dt * 0.9; } else { p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 0.8; }
          if (p.life <= 0) { S.parts.splice(i, 1); continue; }
          x.fillStyle = hexA(p.c, p.life); x.beginPath(); x.arc(p.x, p.y, p.r * (0.5 + p.life * 0.5), 0, 6.283); x.fill();
        }
        x.globalCompositeOperation = 'source-over'; x.restore();
        if (S.flash > 0) { x.fillStyle = `rgba(255,255,255,${Math.min(1, S.flash)})`; x.fillRect(0, 0, W, H); S.flash -= dt * 3; }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
      const step = async ms => { if (!S.skipped) await wait(ms); };
      // ① 阵法展开
      Sfx.play('gong'); await step(1000);
      // ② 蓄力：颜色逐级提升（宝→仙→神 的“预告”）
      Sfx.play('magic'); const ladder = [TC[2]]; if (best >= 3) ladder.push(TC[3]); if (best >= 4) ladder.push(TC[4]);
      for (let k = 0; k < ladder.length && !S.skipped; k++) {
        S.col = ladder[k]; S.charge = (k + 1) / 3; S.shake = 0.3 + k * 0.3; for (let n = 0; n < 40; n++) swirl();
        if (k > 0) Sfx.play(k === 2 ? 'thunder' : 'magic', 0.7);
        await step(480);
      }
      S.col = TC[best];
      // ③ 光柱 + 闪屏
      const grid = h('div', 'gfx-cards g22c' + (items.length > 1 ? ' many' : '')); w.appendChild(grid);
      grid.innerHTML = items.map((it, k) => `<div class="gcard t${it.tier}"><div class="gc-flip"><div class="gc-back"><span>缘</span></div><div class="gc-in">${it.spr && AS.sprites[it.spr] ? `<div class="sprbox" data-spr="${it.spr}"></div>` : `<i style="${iconCss(it.ic || 'chest', 64)}"></i>`}<b>${esc(it.n)}</b><small>${TN[it.tier]}</small></div></div></div>`).join('');
      UI.drawSprBoxes(grid);
      const cards = [...grid.querySelectorAll('.gcard')];
      S.flash = S.skipped ? 0.4 : 1.0; S.shake = best >= 4 ? 1 : 0.5; Sfx.play(best >= 4 ? 'thunder' : 'fire', 0.8);
      cards.forEach((c, k) => { const r = c.getBoundingClientRect(); S.pillars.push({ x: r.left + r.width / 2, y: r.top + r.height, w: r.width * 0.55, c: TC[items[k].tier], t: performance.now() + (S.skipped ? 0 : k * 70) }); });
      w.classList.add('reveal'); await step(700);
      // ④ 翻牌（从低到高，神品最后翻）
      const order = cards.map((c, k) => k).sort((a, b) => items[a].tier - items[b].tier || a - b);
      for (const k of order) {
        const c = cards[k], it = items[k]; const r = c.getBoundingClientRect();
        if (S.skipped) { c.classList.add('open'); continue; }
        if (it.tier >= 4) { c.classList.add('shine'); await step(500); }
        c.classList.add('open'); Sfx.play(it.tier >= 3 ? 'coin' : 'click', 0.8);
        burst(r.left + r.width / 2, r.top + r.height / 2, TC[it.tier], it.tier >= 4 ? 60 : it.tier >= 3 ? 30 : 12, it.tier >= 4 ? 420 : 260);
        if (it.tier >= 4 && !S.skipped) { S.flash = 0.45; S.shake = 0.8; S.pillars.push({ x: r.left + r.width / 2, y: r.top + r.height, w: r.width * 0.9, c: TC[4], t: performance.now() }); await cutin(w, it, S); }
        else await step(items.length > 1 ? 140 : 400);
      }
      if (best >= 4) { Sfx.play('gacha_ssr'); setTimeout(() => Sfx.play('voice_wow'), 400); } else Sfx.play(best >= 3 ? 'gacha_sr' : 'levelup');
      skip.remove();
      const btn = h('button', 'opt gclose', '收下'); w.appendChild(btn);
      btn.onclick = () => { w.classList.add('out'); setTimeout(() => { S.alive = false; w.remove(); done(); }, 300); };
    });
  };
  // 神品切入：斜切光带 + 3D 渲染立绘放大 + 名字毛笔大字 + 印章
  async function cutin(w, it, S) {
    const c = h('div', 'gcut'); c.innerHTML = `<div class="gcut-band"></div><div class="gcut-art"></div><div class="gcut-txt"><em>神品</em><b>${esc(it.n)}</b></div><div class="gcut-seal">天选</div>`;
    w.appendChild(c); const art = c.querySelector('.gcut-art');
    if (it.spr && AS.sprites[it.spr]) {
      const cv = document.createElement('canvas'); const D = 2; cv.width = 260 * D; cv.height = 260 * D; art.appendChild(cv);
      try { await loadSprite(it.spr); const g = cv.getContext('2d'); g.scale(D, D); drawSprite(g, it.spr, 'idle', 'S', 0, 130, 240, it.spr.startsWith('mount_') ? 1.2 : 1.45); } catch (e) {}
    } else art.innerHTML = `<i style="${iconCss(it.ic || 'chest', 150)}"></i>`;
    Sfx.play('voice_hey_' + (Game.G && Game.G.sex === 'f' ? 'f' : 'm'));
    await new Promise(r => { const t = setTimeout(r, S.skipped ? 0 : 1800); c.onclick = () => { clearTimeout(t); r(); }; const iv = setInterval(() => { if (S.skipped) { clearInterval(iv); clearTimeout(t); r(); } }, 60); setTimeout(() => clearInterval(iv), 2000); });
    c.classList.add('out'); setTimeout(() => c.remove(), 300);
  }
})();

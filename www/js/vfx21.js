'use strict';
// ======================= v2.1 视觉特效：云海、天气、昼夜季节、灵光、坐骑、突破演出、技能特写 =======================
var VFX = window.VFX = (function () {
  const V = { map: null, water: [], flowers: [], lava: [], weather: null, drops: [], season: 0 };
  const mk = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); return c; };
  const glow = mk(128, 128, (x, w) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
  const tint = {};
  const glowOf = c => tint[c] || (tint[c] = mk(128, 128, x => { x.drawImage(glow, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = c; x.fillRect(0, 0, 128, 128); }));
  const puff = mk(256, 128, x => { for (let k = 0; k < 9; k++) { const cx = 40 + k * 22, cy = 74 - Math.sin(k / 8 * Math.PI) * 26, r = 30 + Math.sin(k / 8 * Math.PI) * 24; const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.7, 'rgba(250,252,255,0.7)'); g.addColorStop(1, 'rgba(240,246,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); } });
  const WEATHER = { village: ['petal', 'rain', 'snow'], sect: ['leaf', 'snow'], market: ['lantern', 'rain'], secret: ['mist', 'firefly'], graveyard: ['rain', 'mist'], island: ['sun', 'rain'], rift: ['ash'], heaven: ['sun'] };
  const SEASON = [{ n: '春', c: 'rgba(255,200,220,0.06)' }, { n: '夏', c: 'rgba(255,240,170,0.06)' }, { n: '秋', c: 'rgba(255,160,60,0.09)' }, { n: '冬', c: 'rgba(170,200,255,0.12)' }];
  const AURA = ['#ffffff', '#9affd0', '#7ac8ff', '#ffd25e', '#c88aff', '#ff9a5a', '#fff2a0'];
  function prep() {
    V.map = R.mapId; V.water = []; V.flowers = []; V.lava = [];
    const T = R.M.tiles; for (let j = 0; j < T.length; j++) for (let i = 0; i < T[j].length; i++) { const c = T[j][i]; if (c === 'w') V.water.push([i, j]); else if (c === 'f') V.flowers.push([i, j]); else if (c === 'l') V.lava.push([i, j]); }
    const G = Game.G; V.season = G ? (G.year || G.age || 0) % 4 : 0;
    const opts = WEATHER[R.mapId] || ['sun']; let w = opts[0];
    if (opts.includes('snow') && V.season === 3) w = 'snow'; else if (opts.length > 1 && Math.random() < 0.3) w = opts[1 + (Math.random() * (opts.length - 1) | 0)];
    if (w === 'snow' && V.season !== 3) w = 'rain';
    V.weather = w; V.drops = [];
    if (G && G.mount && R.player) loadSprite(MOUNTS[G.mount].spr);
  }
  // 云海：岛屿与天外天下方
  R.drawUnder = ctx => {
    if (V.map !== R.mapId) prep();
    if (R.mapId !== 'heaven' && R.mapId !== 'island' && R.mapId !== 'secret') return;
    const P = R.M.plate; const sea = R.mapId === 'island';
    for (let k = 0; k < 26; k++) {
      const row = k % 4; const sp = 8 + row * 5; const W = P.w + 1200;
      const x = ((k * 397 + R.t * sp) % W) - 600; const y = P.h * (0.55 + row * 0.15) + Math.sin(R.t * 0.4 + k) * 10;
      const s = 2 + row * 0.6; ctx.globalAlpha = sea ? 0.35 : 0.8 - row * 0.1;
      ctx.drawImage(puff, x, y, 256 * s, 128 * s);
    }
    ctx.globalAlpha = 1;
  };
  // 地面层：水面波光、熔岩辉光、花草
  R.drawGround = ctx => {
    ctx.globalCompositeOperation = 'lighter';
    for (const [i, j] of V.water) {
      const [x, y] = t2p(i + 0.5, j + 0.5);
      for (let k = 0; k < 2; k++) { const ph = R.t * 1.6 + i * 1.7 + j * 2.3 + k * 3; const a = Math.max(0, Math.sin(ph)) * 0.55; if (a < 0.05) continue; ctx.globalAlpha = a; ctx.drawImage(glowOf('#cfefff'), x - 24 + Math.sin(ph * 0.7 + k) * 22, y - 8 + k * 6, 30, 10); }
    }
    for (const [i, j] of V.lava) { const [x, y] = t2p(i + 0.5, j + 0.5); ctx.globalAlpha = 0.35 + Math.sin(R.t * 2 + i + j) * 0.15; ctx.drawImage(glowOf('#ff6a2a'), x - 60, y - 30, 120, 60); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  };
  // 实体：灵光、坐骑
  R.entPre = (ctx, e, x, y) => {
    if (e !== R.player) return 0;
    const G = Game.G; if (!G) return 0;
    const r = Math.min(6, G.realm || 0);
    if (r >= 1) {
      ctx.globalCompositeOperation = 'lighter'; const pul = 0.75 + Math.sin(R.t * 3) * 0.25;
      ctx.globalAlpha = 0.18 + r * 0.05; ctx.drawImage(glowOf(AURA[r]), x - 70 * pul, y - 150, 140 * pul, 170);
      ctx.globalAlpha = 0.5; ctx.drawImage(glowOf(AURA[r]), x - 50, y - 14, 100, 28);
      if (Math.random() < 0.05 + r * 0.03) part({ x: x + rnd(-30, 30), y: y - rnd(0, 60), vy: -40, life: 1.2, r: 3 + r * 0.4, c: AURA[r], add: true, star: r >= 4 });
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    if (e.mount && AS.sprites[e.mount]) {
      const m = G.mount && MOUNTS[G.mount]; const lift = (m ? m.lift : 24) + Math.sin(R.t * 2.4) * 4;
      e.lift = lift; drawSprite(ctx, e.mount, 'idle', e.dir, R.t * 5, x, y + 4, 1, 1);
      return lift;
    }
    e.lift = 0; return 0;
  };
  R.entPost = (ctx, e, x, y) => {
    if (e !== R.player || !e.title || e.label) return;
    const b = spriteBox(e.spr, e.s); const ty = y - b.h - 8;
    ctx.font = 'bold 20px serif'; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(60,20,0,0.75)'; const t = '「' + e.title + '」';
    ctx.strokeText(t, x, ty); const g = ctx.createLinearGradient(0, ty - 18, 0, ty); g.addColorStop(0, '#fff6c0'); g.addColorStop(1, '#ffb83a'); ctx.fillStyle = g; ctx.fillText(t, x, ty);
  };
  // 屏幕层：天气、昼夜、季节、暗角
  R.drawScreen = ctx => {
    if (R.mode === 'battle') return;
    const W = R.W, H = R.H, d = R.dpr; const w = V.weather;
    if (w === 'rain' || w === 'snow' || w === 'ash' || w === 'petal') {
      const n = w === 'rain' ? 90 : 50; while (V.drops.length < n) V.drops.push({ x: Math.random() * W, y: Math.random() * H, v: 0.6 + Math.random() * 0.6, p: Math.random() * 6 });
      ctx.save();
      for (const p of V.drops) {
        if (w === 'rain') { p.y += 900 * d * p.v * 0.016; p.x -= 160 * d * 0.016; ctx.strokeStyle = 'rgba(200,220,255,0.45)'; ctx.lineWidth = 1.5 * d; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 6 * d, p.y - 26 * d * p.v); ctx.stroke(); }
        else { p.y += (w === 'ash' ? 40 : w === 'petal' ? 50 : 70) * d * p.v * 0.016; p.x += Math.sin(R.t + p.p) * 0.6 * d; ctx.fillStyle = w === 'snow' ? 'rgba(255,255,255,0.85)' : w === 'ash' ? 'rgba(255,140,80,0.6)' : 'rgba(255,170,200,0.75)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 3 * d * p.v + 1, (w === 'petal' ? 1.8 : 3) * d * p.v + 1, p.p + R.t, 0, 7); ctx.fill(); }
        if (p.y > H + 30) { p.y = -20; p.x = Math.random() * W * 1.2; } if (p.x < -40) p.x = W + 20;
      }
      ctx.restore();
      if (w === 'rain') { ctx.fillStyle = 'rgba(40,60,90,0.14)'; ctx.fillRect(0, 0, W, H); if (Math.random() < 0.002) { R.flash = 0.5; Sfx.play('thunder'); } }
    }
    if (w === 'mist') { ctx.globalAlpha = 0.22; for (let k = 0; k < 5; k++) ctx.drawImage(puff, ((k * 300 + R.t * 12 * d) % (W + 600)) - 600, H * (0.2 + k * 0.16), 600 * d, 200 * d); ctx.globalAlpha = 1; }
    if (w === 'sun') { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.18 + Math.sin(R.t * 0.5) * 0.05; ctx.drawImage(glowOf('#fff2c0'), -W * 0.3, -H * 0.3, W * 1.0, H * 0.8); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
    // 季节与昼夜（2.5分钟一昼夜，夜间轻微变暗）
    ctx.fillStyle = SEASON[V.season].c; ctx.fillRect(0, 0, W, H);
    if (R.mapId !== 'heaven') { const ph = (Math.sin(R.t / 150 * Math.PI * 2) + 1) / 2; const night = Math.max(0, ph - 0.6) / 0.4; if (night > 0) { ctx.fillStyle = `rgba(20,30,80,${night * 0.28})`; ctx.fillRect(0, 0, W, H); } }
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,10,20,0.32)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };
  // 突破演出：天劫雷光 + 金柱 + 大字
  V.breakthrough = function (name, fail) {
    return new Promise(res => {
      const el = h('div', 'brk-fx' + (fail ? ' fail' : ''), `<div class="bk-bg"></div><div class="bk-pillar"></div><div class="bk-ring"></div><div class="bk-ring r2"></div><div class="bk-txt">${esc(name)}</div><div class="bk-sub">${fail ? '天劫未过，道基受损' : '天 道 认 证 · 境 界 突 破'}</div>`);
      document.body.appendChild(el); Sfx.play('thunder'); R.shake = 1.2; R.flash = 0.9;
      let n = 0; const iv = setInterval(() => { if (++n > 4) return clearInterval(iv); R.shake = 0.8; Sfx.play('thunder'); el.classList.toggle('bolt'); }, 380);
      setTimeout(() => Sfx.play(fail ? 'fail' : 'breakthrough'), 900);
      if (R.player && R.M) { const [x, y] = t2p(R.player.i, R.player.j); for (let k = 0; k < 50; k++) part({ x, y: y - 60, vx: rnd(-260, 260), vy: rnd(-380, 40), g: 260, r: rnd(3, 8), c: fail ? '#c0c0c0' : '#ffe680', life: 1.4, add: true, star: k % 3 === 0 }); }
      const done = () => { el.classList.add('out'); setTimeout(() => { el.remove(); res(); }, 350); };
      const t = setTimeout(done, B.speed > 1 || (window.BOT && BOT.on) ? 700 : 2300); el.onclick = () => { clearTimeout(t); done(); };
    });
  };
  V.flashText = function (txt, c) { const el = h('div', 'flash-txt', esc(txt)); if (c) el.style.color = c; document.body.appendChild(el); setTimeout(() => el.remove(), 1600); };
  V.burst = function (x, y, c, n = 30) { for (let k = 0; k < n; k++) part({ x, y, vx: rnd(-240, 240), vy: rnd(-300, 60), g: 250, r: rnd(3, 7), c, life: 1.1, add: true }); };
  // 技能特写：横幅剪影 + 技能名
  V.cutin = function (u, S) {
    if (B.speed > 2 || B.auto && Math.random() < 0.6) return Promise.resolve();
    return new Promise(res => {
      const c = ELEM[S.el] || '#ffe9a0';
      const el = h('div', 'cutin', `<div class="ci-band" style="--c:${c}"><div class="ci-spr"></div><div class="ci-name">${esc(S.n)}</div><div class="ci-el">${S.el ? S.el + '·' : ''}秘术</div></div>`);
      document.body.appendChild(el);
      const cv = document.createElement('canvas'); cv.width = 220; cv.height = 220; el.querySelector('.ci-spr').appendChild(cv);
      drawSprite(cv.getContext('2d'), u.spr, 'attack', 'SE', 2, 110, 210, 1.15);
      Sfx.play('whoosh'); Sfx.play('voice_hey_' + (Game.G && Game.G.sex === 'f' ? 'f' : 'm')); setTimeout(() => { el.classList.add('out'); }, 620); setTimeout(() => { el.remove(); res(); }, 820);
    });
  };
  return V;
})();
// ======================= 内存：切换地图时释放不再使用的精灵/底图（大图集按地图懒加载） =======================
(function () {
  const _enter = Game.enterMap;
  Game.enterMap = async function (id) {
    const r = await _enter.apply(this, arguments);
    try {
      const keep = new Set(['assets/maps/' + id + '.webp']);
      if (R.M && R.M.propAtlas) keep.add('assets/maps/' + R.M.propAtlas.img);
      const ids = new Set(R.ents.map(e => e.spr).concat(R.ents.map(e => e.mount)).filter(Boolean));
      ids.add(this.playerSpr()); const G = this.G;
      if (G) { for (const p of G.pets || []) if (MONS[p.mon]) ids.add(MONS[p.mon].spr); if (G.mount && MOUNTS[G.mount]) ids.add(MOUNTS[G.mount].spr); }
      for (const s of ids) if (AS.sprites[s]) keep.add(SPR_PATH(s));
      for (const src in IMG) if ((src.startsWith('assets/spr/') || src.startsWith('assets/maps/')) && !keep.has(src) && IMG[src].ok) { IMG[src].im.src = ''; delete IMG[src]; }
    } catch (e) { console.warn('evict', e); }
    return r;
  };
})();
// ===== v2.1 技能序列帧特效（assets/vfx/*.webp，4x4 帧；HD 资源包替换为 2 倍分辨率）=====
(function () {
  const V = window.VFX; if (typeof fx !== 'function' || typeof drawBattle !== 'function') return;
  const SHEET_OF = { fire: 'fire', fireall: 'fire', ice: 'ice', iceall: 'ice', thunder: 'thunder', thunderall: 'thunder', slash: 'slash', swordqi: 'slash', flysword: 'slash', wanjian: 'slash', light: 'light', dark: 'dark', blood: 'blood', heal: 'heal', shield: 'shield', water: 'water', vine: 'poison', poison: 'poison', quake: 'quake' };
  const NORMAL = { poison: 1, quake: 1, blood: 1, dark: 1 };
  const cache = {}; const live = [];
  const get = n => { let im = cache[n]; if (!im) { im = cache[n] = new Image(); im.src = 'assets/vfx/' + n + '.webp'; } return im; };
  V.sheet = (n, x, y, size, delay) => { live.push({ n, im: get(n), x, y, size, t0: performance.now() + (delay || 0) }); if (live.length > 24) live.shift(); };
  V.drawFx = ctx => {
    const now = performance.now(), dur = 560 / Math.max(1, B.speed || 1);
    for (let i = live.length - 1; i >= 0; i--) {
      const e = live[i], k = (now - e.t0) / dur; if (k < 0) continue; if (k >= 1) { live.splice(i, 1); continue; }
      if (!e.im.complete || !e.im.naturalWidth) continue;
      const F = e.im.naturalWidth / 4, f = Math.min(15, (k * 16) | 0);
      ctx.save(); ctx.globalCompositeOperation = NORMAL[e.n] ? 'source-over' : 'lighter';
      ctx.drawImage(e.im, (f % 4) * F, ((f / 4) | 0) * F, F, F, e.x - e.size / 2, e.y - e.size / 2, e.size, e.size); ctx.restore();
    }
  };
  const _fx = fx;
  fx = async function (kind, u, targets) {
    const n = SHEET_OF[kind];
    if (n && targets && targets.length) {
      const D = R.dpr, H = 70 * D, many = targets.length > 1, proj = kind === 'fire' || kind === 'water' || kind === 'ice';
      targets.forEach((t, i) => { try { const [x, y] = uPos(t); V.sheet(n, x, n === 'quake' ? y : y - H, (many ? 190 : 240) * D, (proj ? 300 : 60) / Math.max(1, B.speed) + i * 40); } catch (e) {} });
    }
    return _fx(kind, u, targets);
  };
  const _db = drawBattle;
  drawBattle = function (ctx) { _db(ctx); try { V.drawFx(ctx); } catch (e) {} };
  V.clearFx = () => { live.length = 0; };
})();

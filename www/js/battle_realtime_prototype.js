'use strict';
// ======================= 即时遭遇战原型（v2.5 实验 / 开放世界线） =======================
// 目标：验证「直接操控移动 + 普攻 + 技能 + 闪避」的手感，正式小怪战已由 rt27.js 承担，本文件只做沙盒实验。
// 隔离：不包 Game.fight、不改存档、不进正式遭遇链；只有开发者入口（#dev / 连点版本号 → 「即时战」按钮）
//       调 RealtimeBattle.open() 才会打开自带覆盖层画布；键盘监听只在 RT.on 时生效。
// 2026-10-19：接入游戏现有角色精灵（engine.js drawSprite / loadSprite，主角用 Game.playerSpr()，敌人默认 mon_slime），
//             普攻改为面向扇形命中判定 + 伤害飘字 + 受击闪白，自带 rAF 循环与触屏摇杆/按钮。
(function () {
  const W0 = 600, H0 = 520; // 逻辑战场尺寸
  const BOUND = { x0: 40, x1: 560, y0: 60, y1: 480 };
  const ATK = { range: 90, arc: Math.PI / 3, close: 30, dmg: 28, cd: 0.45, swing: 0.25 }; // arc = 半角 60°

  const RT = {
    on: false,
    player: null,
    enemies: [],
    projectiles: [],
    enemyProjectiles: [],
    dmgNums: [], // 伤害飘字 {x,y,txt,c,life,max}
    time: 0,
    timeLimit: 20,
    result: null,
    keys: new Set(),
    stick: { x: 0, y: 0 }, // 触屏摇杆方向（-1..1）
    rand: Math.random, // 测试可替换
  };

  // ---------- 精灵（复用游戏现有角色图集，缺失时回退圆形） ----------
  const hasSprites = () => typeof drawSprite === 'function' && typeof window !== 'undefined' && window.ASSETS && window.ASSETS.sprites;
  const sprOk = id => !!(hasSprites() && window.ASSETS.sprites[id]);
  function playerSprId() {
    try { if (window.Game && Game.G && typeof Game.playerSpr === 'function') return Game.playerSpr(); } catch (e) { /* 原型：无存档时回退 */ }
    return 'player_m0';
  }
  // 屏幕面向 → 精灵八方向（S=朝下，E=朝右；与 engine.js DIRT 的屏幕投影一致）
  const SDIR = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
  function screenDir(fx, fy) {
    if (!fx && !fy) return 'S';
    const a = Math.atan2(fy, fx);
    return SDIR[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8];
  }
  function preload(ids) {
    if (typeof loadSprite !== 'function') return Promise.resolve();
    return Promise.all(ids.filter(sprOk).map(id => loadSprite(id))).catch(() => {});
  }

  function addDmg(x, y, txt, c) { RT.dmgNums.push({ x, y, txt: String(txt), c: c || '#fff2a8', life: 0.8, max: 0.8 }); }

  function startRealtimeEncounter(enemies, opts) {
    opts = opts || {};
    RT.on = true;
    RT.time = 0;
    RT.timeLimit = opts.timeLimit || 20;
    RT.result = null;
    RT.keys.clear();
    RT.stick = { x: 0, y: 0 };
    RT.projectiles = [];
    RT.enemyProjectiles = [];
    RT.dmgNums = [];
    RT.enemies = (enemies || [{ name: '山魇', hp: 80, maxHp: 80, x: 420, y: 180, speed: 70 }]).map(e => ({
      name: e.name || '山魇',
      spr: e.spr || 'mon_slime',
      hp: e.hp != null ? e.hp : 80,
      maxHp: e.maxHp != null ? e.maxHp : (e.hp || 80),
      x: e.x != null ? e.x : 420,
      y: e.y != null ? e.y : 180,
      speed: e.speed != null ? e.speed : 70,
      contactCd: 0,
      skillCd: e.skillCd != null ? e.skillCd : 1.5 + RT.rand() * 2,
      flash: 0, at: 0, moving: false,
    }));
    RT.player = {
      spr: opts.spr || playerSprId(),
      hp: 180,
      max: 180,
      x: 300,
      y: 320,
      speed: 210,
      atk: opts.atk || ATK.dmg,
      attackCd: 0,
      swing: 0,
      dashCd: 0,
      skillCd: 0,
      faceX: 0,
      faceY: -1,
      flash: 0, at: 0, moving: false,
    };
    RT.ready = preload([RT.player.spr, ...RT.enemies.map(e => e.spr)]);
    if (window.UI && UI.toast) UI.toast('进入即时遭遇战（原型）', '#ffe680');
    return new Promise(resolve => {
      RT._resolve = resolve;
    });
  }

  function clamp(p) {
    p.x = Math.max(BOUND.x0, Math.min(BOUND.x1, p.x));
    p.y = Math.max(BOUND.y0, Math.min(BOUND.y1, p.y));
  }

  function updateRealtime(dt) {
    if (!RT.on || !RT.player) return;
    RT.time += dt;
    const p = RT.player;
    p.attackCd = Math.max(0, p.attackCd - dt);
    p.swing = Math.max(0, p.swing - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.skillCd = Math.max(0, p.skillCd - dt);
    p.flash = Math.max(0, p.flash - dt);
    p.at += dt;

    // 移动：WASD / 方向键 / 触屏摇杆
    let kx = RT.stick.x, ky = RT.stick.y;
    if (RT.keys.has('w') || RT.keys.has('arrowup')) ky -= 1;
    if (RT.keys.has('s') || RT.keys.has('arrowdown')) ky += 1;
    if (RT.keys.has('a') || RT.keys.has('arrowleft')) kx -= 1;
    if (RT.keys.has('d') || RT.keys.has('arrowright')) kx += 1;
    const len = Math.hypot(kx, ky);
    p.moving = len > 0.05;
    if (p.moving) {
      kx /= len; ky /= len;
      p.x += kx * p.speed * dt;
      p.y += ky * p.speed * dt;
      p.faceX = kx; p.faceY = ky;
    }
    clamp(p);

    // 敌人简单追击 + 接触伤害 + 远距弹道
    for (const e of RT.enemies) {
      e.flash = Math.max(0, e.flash - dt);
      e.at += dt;
      if (e.hp <= 0) continue;
      e.contactCd = Math.max(0, e.contactCd - dt);
      const dx = p.x - e.x, dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      e.moving = d > 28;
      if (e.moving) {
        e.x += (dx / d) * e.speed * dt;
        e.y += (dy / d) * e.speed * dt;
      }
      e.faceX = dx / d; e.faceY = dy / d;
      if (d < 36 && e.contactCd <= 0) {
        p.hp = Math.max(0, p.hp - 8);
        p.flash = 0.15;
        e.contactCd = 0.9;
        addDmg(p.x, p.y - 80, '-8', '#ff7a6a');
      }
      e.skillCd = Math.max(0, (e.skillCd || 0) - dt);
      if (d > 80 && d < 280 && e.skillCd <= 0) {
        e.skillCd = 2.2 + RT.rand() * 1.5;
        const speed = 180;
        RT.enemyProjectiles.push({ x: e.x, y: e.y - 20, vx: (dx / d) * speed, vy: (dy / d) * speed, life: 2.0 });
      }
    }

    // 玩家弹道
    for (const proj of RT.projectiles) {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;
      if (proj.life <= 0) continue;
      for (const e of RT.enemies) {
        if (e.hp <= 0) continue;
        if (Math.hypot(e.x - proj.x, e.y - proj.y) < 22) {
          hitEnemy(e, 22, 8);
          proj.life = 0;
          break;
        }
      }
    }
    RT.projectiles = RT.projectiles.filter(pr => pr.life > 0 && pr.x > 0 && pr.x < W0 && pr.y > 0 && pr.y < H0);

    // 敌人弹道
    for (const proj of RT.enemyProjectiles) {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;
      if (proj.life <= 0) continue;
      if (Math.hypot(p.x - proj.x, p.y - proj.y) < 18) {
        p.hp = Math.max(0, p.hp - 12);
        p.flash = 0.15;
        proj.life = 0;
        addDmg(p.x, p.y - 80, '-12', '#ff7a6a');
      }
    }
    RT.enemyProjectiles = RT.enemyProjectiles.filter(pr => pr.life > 0 && pr.x > 0 && pr.x < W0 && pr.y > 0 && pr.y < H0);

    // 飘字上浮衰减
    for (const n of RT.dmgNums) { n.life -= dt; n.y -= 40 * dt; }
    RT.dmgNums = RT.dmgNums.filter(n => n.life > 0);

    // 结束条件
    if (p.hp <= 0) endRealtime('lose');
    else if (RT.enemies.every(e => e.hp <= 0)) endRealtime('win');
    else if (RT.time > RT.timeLimit) endRealtime('lose'); // 超时保底，避免卡死
  }

  function hitEnemy(e, dmg, knock) {
    const p = RT.player;
    e.hp = Math.max(0, e.hp - dmg);
    e.flash = 0.12;
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
    e.x += (dx / d) * knock;
    e.y += (dy / d) * knock;
    clamp(e);
    addDmg(e.x, e.y - 70, dmg, '#fff2a8');
  }

  // 普攻命中判定：面向 ±60° 扇形、半径 90；贴身 30 内不论方向都算中。返回命中的敌人列表。
  function inAttackArc(p, e) {
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
    if (d > ATK.range) return false;
    if (d <= ATK.close) return true;
    const fl = Math.hypot(p.faceX, p.faceY) || 1;
    const cos = (dx * p.faceX + dy * p.faceY) / (d * fl);
    return cos >= Math.cos(ATK.arc);
  }
  function playerAttack() {
    if (!RT.on || !RT.player || RT.player.attackCd > 0) return [];
    const p = RT.player;
    p.attackCd = ATK.cd;
    p.swing = ATK.swing;
    const hits = RT.enemies.filter(e => e.hp > 0 && inAttackArc(p, e));
    for (const e of hits) hitEnemy(e, p.atk, 12);
    if (!hits.length) addDmg(p.x + p.faceX * 40, p.y + p.faceY * 40 - 40, '落空', '#b8c4d8');
    return hits;
  }

  function playerSkill() {
    if (!RT.on || !RT.player || RT.player.skillCd > 0) return;
    const p = RT.player;
    p.skillCd = 1.6;
    const speed = 320;
    RT.projectiles.push({ x: p.x + p.faceX * 20, y: p.y + p.faceY * 20 - 20, vx: p.faceX * speed, vy: p.faceY * speed, life: 1.8 });
  }

  function playerDash() {
    if (!RT.on || !RT.player || RT.player.dashCd > 0) return;
    const p = RT.player;
    p.dashCd = 1.2;
    p.x += p.faceX * 90;
    p.y += p.faceY * 90;
    clamp(p);
  }

  function endRealtime(result) {
    if (!RT.on) return;
    RT.on = false;
    RT.result = result;
    RT.keys.clear();
    RT.projectiles = [];
    RT.enemyProjectiles = [];
    if (window.UI && UI.toast) UI.toast('遭遇战结束：' + (result === 'win' ? '胜' : '败'), result === 'win' ? '#9aff9a' : '#ff9a9a');
    if (RT._resolve) {
      RT._resolve({ result, time: RT.time, playerHp: RT.player ? RT.player.hp : 0 });
      RT._resolve = null;
    }
  }

  // ---------- 绘制（逻辑坐标 600×520；宿主负责缩放） ----------
  function drawUnit(ctx, u, isPlayer) {
    const anim = isPlayer && u.swing > 0 ? 'attack' : (u.flash > 0 ? 'hurt' : (u.moving ? 'walk' : 'idle'));
    const dir = screenDir(u.faceX || 0, u.faceY || 1);
    const f = isPlayer && u.swing > 0 ? (1 - u.swing / ATK.swing) * 5 : u.at * (u.moving ? 10 : 5);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(u.x, u.y, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
    let drawn = false;
    if (sprOk(u.spr)) drawn = !!drawSprite(ctx, u.spr, anim, dir, f, u.x, u.y, 0.5, u.flash > 0 ? 0.6 : 1);
    if (!drawn) { // 图未加载完 / 无图集：回退圆形
      ctx.fillStyle = isPlayer ? (u.hp > 60 ? '#5a9a8a' : '#c07060') : '#c07060';
      ctx.beginPath(); ctx.arc(u.x, u.y - 14, isPlayer ? 14 : 18, 0, Math.PI * 2); ctx.fill();
    }
    return drawn;
  }

  function drawRealtime(ctx) {
    if (!RT.player || !ctx) return;
    const W = W0;
    ctx.fillStyle = '#1d2a22'; ctx.fillRect(0, 0, W0, H0);
    ctx.strokeStyle = 'rgba(255,220,150,0.35)'; ctx.lineWidth = 2;
    ctx.strokeRect(BOUND.x0 - 20, BOUND.y0 - 20, BOUND.x1 - BOUND.x0 + 40, BOUND.y1 - BOUND.y0 + 40);
    const p = RT.player;

    // 普攻扇形挥砍提示
    if (p.swing > 0) {
      const a = Math.atan2(p.faceY, p.faceX);
      ctx.fillStyle = `rgba(255,230,140,${0.35 * p.swing / ATK.swing})`;
      ctx.beginPath(); ctx.moveTo(p.x, p.y - 20); ctx.arc(p.x, p.y - 20, ATK.range, a - ATK.arc, a + ATK.arc); ctx.closePath(); ctx.fill();
    }

    // 按 y 深度排序画角色
    const units = [...RT.enemies.filter(e => e.hp > 0).map(e => [e, false]), [p, true]].sort((a, b) => a[0].y - b[0].y);
    let sprites = 0;
    for (const [u, isP] of units) {
      if (drawUnit(ctx, u, isP)) sprites++;
      if (!isP) { // 血条 + 名字
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(u.x - 22, u.y - 84, 44, 5);
        ctx.fillStyle = '#eea279'; ctx.fillRect(u.x - 22, u.y - 78, 44 * (u.hp / u.maxHp), 5);
        ctx.fillStyle = '#f1e1c8'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(u.name, u.x, u.y - 90); ctx.textAlign = 'left';
      }
    }

    for (const proj of RT.projectiles) { ctx.fillStyle = '#ffd27b'; ctx.beginPath(); ctx.arc(proj.x, proj.y, 6, 0, Math.PI * 2); ctx.fill(); }
    for (const proj of RT.enemyProjectiles) { ctx.fillStyle = '#e05a4a'; ctx.beginPath(); ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2); ctx.fill(); }

    // 伤害飘字
    ctx.textAlign = 'center'; ctx.font = 'bold 18px sans-serif';
    for (const n of RT.dmgNums) {
      ctx.globalAlpha = Math.max(0, n.life / n.max);
      ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(n.txt, n.x, n.y);
      ctx.fillStyle = n.c; ctx.fillText(n.txt, n.x, n.y);
    }
    ctx.globalAlpha = 1; ctx.textAlign = 'left';

    // 顶栏
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, 44);
    ctx.fillStyle = '#ffe680'; ctx.font = '15px sans-serif';
    const cd = v => (v > 0 ? v.toFixed(1) : '好');
    ctx.fillText(`即时战(原型) ${Math.round(RT.time)}s  HP ${Math.ceil(p.hp)}/${p.max}  闪${cd(p.dashCd)} 技${cd(p.skillCd)}`, 12, 28);
    if (!RT.on && RT.result) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, H0 / 2 - 40, W0, 80);
      ctx.fillStyle = RT.result === 'win' ? '#9aff9a' : '#ff9a9a'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(RT.result === 'win' ? '胜利' : '败北', W0 / 2, H0 / 2 + 10); ctx.textAlign = 'left';
    }
    return sprites;
  }

  // ---------- 开发者覆盖层：自带画布 + rAF 循环 + 触屏摇杆/按钮（只由开发者入口调用） ----------
  function devEnabled() {
    try {
      if (typeof location !== 'undefined' && /dev/.test(location.hash || '')) return true;
      return typeof localStorage !== 'undefined' && localStorage.getItem('wbx2_dev') === '1';
    } catch (e) { return false; }
  }
  function openOverlay(enemies, opts) {
    if (typeof document === 'undefined' || !document.body) return null;
    if (document.getElementById('rtp-overlay')) return null;
    if (!(opts && opts.force) && !devEnabled()) { if (window.UI && UI.toast) UI.toast('即时战原型仅开发者模式可用'); return null; }
    const ov = document.createElement('div');
    ov.id = 'rtp-overlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;touch-action:none;';
    const cv = document.createElement('canvas');
    cv.width = W0; cv.height = H0;
    cv.style.cssText = 'width:min(96vw,' + W0 + 'px);aspect-ratio:' + W0 + '/' + H0 + ';border:2px solid #ffe680;border-radius:10px;touch-action:none;';
    ov.appendChild(cv);
    const mkBtn = (txt, css, fn) => {
      const b = document.createElement('button'); b.textContent = txt;
      b.style.cssText = 'position:absolute;width:64px;height:64px;border-radius:50%;background:#2a3a5a;color:#ffe680;border:1px solid #ffe680;font-size:18px;font-weight:bold;' + css;
      b.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); fn(); });
      ov.appendChild(b); return b;
    };
    mkBtn('攻', 'right:20px;bottom:40px;', playerAttack);
    mkBtn('技', 'right:96px;bottom:24px;', playerSkill);
    mkBtn('闪', 'right:30px;bottom:116px;', playerDash);
    mkBtn('×', 'right:12px;top:12px;width:40px;height:40px;font-size:20px;', () => close());
    // 摇杆：在画布上按住拖动
    let sid = null, ox = 0, oy = 0;
    cv.addEventListener('pointerdown', ev => { sid = ev.pointerId; ox = ev.clientX; oy = ev.clientY; });
    cv.addEventListener('pointermove', ev => {
      if (ev.pointerId !== sid) return;
      const dx = ev.clientX - ox, dy = ev.clientY - oy, d = Math.hypot(dx, dy);
      RT.stick = d < 8 ? { x: 0, y: 0 } : { x: dx / Math.max(d, 50), y: dy / Math.max(d, 50) };
    });
    const up = ev => { if (ev.pointerId === sid) { sid = null; RT.stick = { x: 0, y: 0 }; } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    const onKey = ev => { if (ev.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    document.body.appendChild(ov);

    const ctx = cv.getContext('2d');
    let raf = 0, last = 0, closed = false, endT = 0;
    function frame(t) {
      if (closed) return;
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
      updateRealtime(dt);
      drawRealtime(ctx);
      if (!RT.on) { endT += dt; if (endT > 1.5) { close(); return; } }
      raf = requestAnimationFrame(frame);
    }
    function close() {
      if (closed) return;
      closed = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      if (RT.on) endRealtime('lose');
      if (ov.parentNode) ov.remove();
    }
    const done = startRealtimeEncounter(enemies, opts);
    raf = requestAnimationFrame(frame);
    return { done, close, canvas: cv };
  }

  // 键盘监听（仅在原型开启时生效，避免污染正式游戏）
  function _rtKeyDown(e) {
    if (!RT.on) return;
    const k = (e.key || '').toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'j', 'shift', 'q'].includes(k)) {
      RT.keys.add(k);
      if (k === ' ' || k === 'j') playerAttack();
      else if (k === 'shift') playerDash();
      else if (k === 'q') playerSkill();
      if (e.preventDefault) e.preventDefault();
    }
  }
  function _rtKeyUp(e) {
    if (!RT.on) return;
    RT.keys.delete((e.key || '').toLowerCase());
  }
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('keydown', _rtKeyDown);
    window.addEventListener('keyup', _rtKeyUp);
  }

  const API = {
    state: RT,
    start: startRealtimeEncounter,
    open: openOverlay,
    update: updateRealtime,
    draw: drawRealtime,
    end: endRealtime,
    attack: playerAttack,
    dash: playerDash,
    skill: playerSkill,
    inAttackArc,
    screenDir,
    devEnabled,
    ATK,
    _key: { down: _rtKeyDown, up: _rtKeyUp },
  };
  window.RealtimeBattle = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();

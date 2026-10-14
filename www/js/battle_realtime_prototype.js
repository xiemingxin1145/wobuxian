'use strict';
// ======================= 即时遭遇战原型（v2.5 实验，已加强） =======================
// 目标：从正式地图可以直接进入简单即时战斗区域，打完返回。
// 当前：坐标 + 移动输入占位 + 敌人追击 + 近距普攻/接触伤害，不接入正式运行链。

const RT = {
  on: false,
  player: null,
  enemies: [],
  time: 0,
  result: null,
  keys: new Set(),
};

function startRealtimeEncounter(enemies) {
  console.log('[RT] start realtime encounter', enemies);
  RT.on = true;
  RT.time = 0;
  RT.result = null;
  RT.keys.clear();
  RT.enemies = (enemies || [{ name: '山魈', hp: 80, maxHp: 80, x: 420, y: 180, speed: 70 }]).map(e => ({
    name: e.name || '山魈',
    hp: e.hp != null ? e.hp : 80,
    maxHp: e.maxHp != null ? e.maxHp : (e.hp || 80),
    x: e.x != null ? e.x : 420,
    y: e.y != null ? e.y : 180,
    speed: e.speed != null ? e.speed : 70,
    contactCd: 0,
  }));
  RT.player = {
    hp: 180,
    max: 180,
    x: 300,
    y: 320,
    speed: 210,
    attackCd: 0,
    faceX: 0,
    faceY: -1,
  };
  if (window.UI && UI.toast) UI.toast('进入即时遭遇战（原型）', '#ffe680');
  return new Promise(resolve => {
    RT._resolve = resolve;
  });
}

function updateRealtime(dt) {
  if (!RT.on || !RT.player) return;
  RT.time += dt;
  const p = RT.player;
  p.attackCd = Math.max(0, p.attackCd - dt);

  // 键盘移动占位（WASD / 方向键）
  let kx = 0, ky = 0;
  if (RT.keys.has('w') || RT.keys.has('arrowup')) ky -= 1;
  if (RT.keys.has('s') || RT.keys.has('arrowdown')) ky += 1;
  if (RT.keys.has('a') || RT.keys.has('arrowleft')) kx -= 1;
  if (RT.keys.has('d') || RT.keys.has('arrowright')) kx += 1;
  const len = Math.hypot(kx, ky);
  if (len > 0.05) {
    kx /= len; ky /= len;
    p.x += kx * p.speed * dt;
    p.y += ky * p.speed * dt;
    p.faceX = kx; p.faceY = ky;
  }
  // 简易边界
  p.x = Math.max(40, Math.min(560, p.x));
  p.y = Math.max(60, Math.min(480, p.y));

  // 敌人简单追击 + 接触伤害
  for (const e of RT.enemies) {
    if (e.hp <= 0) continue;
    e.contactCd = Math.max(0, e.contactCd - dt);
    const dx = p.x - e.x, dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > 28) {
      e.x += (dx / d) * e.speed * dt;
      e.y += (dy / d) * e.speed * dt;
    }
    if (d < 36 && e.contactCd <= 0) {
      p.hp = Math.max(0, p.hp - 8);
      e.contactCd = 0.9;
      console.log('[RT] contact damage from', e.name);
    }
  }

  // 结束条件
  if (p.hp <= 0) {
    endRealtime('lose');
  } else if (RT.enemies.every(e => e.hp <= 0)) {
    endRealtime('win');
  } else if (RT.time > 20) {
    // 超时保底，避免卡死
    endRealtime(RT.enemies.some(e => e.hp > 0) ? 'lose' : 'win');
  }
}

function playerAttack() {
  if (!RT.on || !RT.player || RT.player.attackCd > 0) return;
  const p = RT.player;
  p.attackCd = 0.45;
  console.log('[RT] player attack');
  // 近距命中：对最近且距离 < 90 的存活敌人造成伤害
  let best = null, bestD = 999;
  for (const e of RT.enemies) {
    if (e.hp <= 0) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < 90 && d < bestD) {
      best = e;
      bestD = d;
    }
  }
  if (best) {
    best.hp = Math.max(0, best.hp - 28);
    const dx = best.x - p.x, dy = best.y - p.y, d = Math.hypot(dx, dy) || 1;
    best.x += (dx / d) * 12;
    best.y += (dy / d) * 12;
    console.log('[RT] hit', best.name, 'hp=', best.hp);
  }
}

function endRealtime(result) {
  if (!RT.on) return;
  RT.on = false;
  RT.result = result;
  RT.keys.clear();
  if (window.UI && UI.toast) UI.toast('遭遇战结束：' + result, result === 'win' ? '#9aff9a' : '#ff9a9a');
  if (RT._resolve) {
    RT._resolve({ result, time: RT.time, playerHp: RT.player ? RT.player.hp : 0 });
    RT._resolve = null;
  }
}

function drawRealtime(ctx) {
  if (!RT.on || !ctx) return;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  // 半透明顶栏
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, 44);
  ctx.fillStyle = '#ffe680';
  ctx.font = '15px sans-serif';
  const p = RT.player;
  const pos = p ? ` (${Math.round(p.x)},${Math.round(p.y)}) HP:${Math.ceil(p.hp)}` : '';
  ctx.fillText('即时战斗中 ' + Math.round(RT.time) + 's' + pos, 16, 28);

  // 简易绘制玩家（圆）
  if (p) {
    ctx.fillStyle = p.hp > 60 ? '#5a9a8a' : '#c07060';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ecd2a7';
    ctx.beginPath();
    ctx.arc(p.x, p.y - 16, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // 简易绘制敌人
  for (const e of RT.enemies) {
    if (e.hp <= 0) continue;
    ctx.fillStyle = '#c07060';
    ctx.beginPath();
    ctx.arc(e.x, e.y, 18, 0, Math.PI * 2);
    ctx.fill();
    // 血条
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(e.x - 22, e.y - 32, 44, 5);
    ctx.fillStyle = '#eea279';
    ctx.fillRect(e.x - 22, e.y - 32, 44 * (e.hp / e.maxHp), 5);
    ctx.fillStyle = '#f1e1c8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(e.name, e.x, e.y - 38);
    ctx.textAlign = 'left';
  }
}

// 键盘监听（仅在原型开启时生效，避免污染正式游戏）
function _rtKeyDown(e) {
  if (!RT.on) return;
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
    RT.keys.add(k);
    if (k === ' ') {
      playerAttack();
      e.preventDefault();
    }
  }
}
function _rtKeyUp(e) {
  if (!RT.on) return;
  RT.keys.delete(e.key.toLowerCase());
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', _rtKeyDown);
  window.addEventListener('keyup', _rtKeyUp);
}

window.RealtimeBattle = {
  start: startRealtimeEncounter,
  update: updateRealtime,
  draw: drawRealtime,
  end: endRealtime,
  attack: playerAttack,
};

console.log('[RT] realtime battle prototype (move+chase+hit) loaded');

'use strict';
// ======================= 即时遭遇战原型（v2.5 实验，已加强） =======================
// 目标：从正式地图可以直接进入简单即时战斗区域，打完返回。
// 当前：仅占位 + 基本坐标/普攻冷却，不接入正式运行链。

const RT = {
  on: false,
  player: null,
  enemies: [],
  time: 0,
  result: null,
};

function startRealtimeEncounter(enemies) {
  console.log('[RT] start realtime encounter', enemies);
  RT.on = true;
  RT.time = 0;
  RT.result = null;
  RT.enemies = enemies || [{ name: '山魏', hp: 100, x: 400, y: 200 }];
  RT.player = { hp: 180, max: 180, x: 300, y: 300, attackCd: 0 };
  if (window.UI && UI.toast) UI.toast('进入即时遭遇战（原型）', '#ffe680');
  return new Promise(resolve => {
    RT._resolve = resolve;
  });
}

function updateRealtime(dt) {
  if (!RT.on) return;
  RT.time += dt;
  if (RT.player) RT.player.attackCd = Math.max(0, RT.player.attackCd - dt);
  // 简单模拟：时间到了自动结束
  if (RT.time > 8) {
    endRealtime('win');
  }
}

function playerAttack() {
  if (!RT.on || !RT.player || RT.player.attackCd > 0) return;
  RT.player.attackCd = 0.5;
  console.log('[RT] player attack');
  // 占位：可后续接伤害逻辑
}

function endRealtime(result) {
  RT.on = false;
  RT.result = result;
  if (window.UI && UI.toast) UI.toast('遭遇战结束：' + result, '#9aff9a');
  if (RT._resolve) RT._resolve({ result });
}

function drawRealtime(ctx) {
  if (!RT.on || !ctx) return;
  // 简单占位绘制
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, ctx.canvas.width, 40);
  ctx.fillStyle = '#ffe680';
  ctx.font = '16px sans-serif';
  const pos = RT.player ? ` pos(${Math.round(RT.player.x)},${Math.round(RT.player.y)})` : '';
  ctx.fillText('即时战斗中... ' + Math.round(RT.time) + 's' + pos, 20, 25);
}

window.RealtimeBattle = {
  start: startRealtimeEncounter,
  update: updateRealtime,
  draw: drawRealtime,
  end: endRealtime,
  attack: playerAttack,
};

console.log('[RT] realtime battle prototype (enhanced) loaded');

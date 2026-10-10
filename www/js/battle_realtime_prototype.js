'use strict';
// ======================= 即时遭遇战原型（v2.5 实验） =======================
// 目标：地图探索保持等距，碰到小怪时切入简单即时战斗区域。
// 玩家：摇杆/点地移动 + 点击普攻 + 按键技能/闪避。
// 敌人：简单 AI 追击 + 弹道技能。
// 先作为原型，不替换现有回合制 Boss 战。

const RT = {
  on: false,
  units: [],
  player: null,
  enemies: [],
  projectiles: [],
  time: 0,
};

function startRealtimeEncounter(enemies) {
  // TODO: 从 Game 导入玩家数据，切换 R.mode = 'realtime'
  console.log('[RT] start realtime encounter', enemies);
  RT.on = true;
  RT.units = [];
  // 占位：后续接入现有 sprite 系统
  return Promise.resolve({ result: 'win', note: 'prototype stub' });
}

function updateRealtime(dt) {
  if (!RT.on) return;
  RT.time += dt;
  // 玩家移动、敌人 AI、弹道更新、碰撞检测
}

function drawRealtime(ctx) {
  // 复用现有 drawBattle 风格或简化
}

// 导出供游戏主逻辑调用
window.RealtimeBattle = { start: startRealtimeEncounter, update: updateRealtime, draw: drawRealtime };

console.log('[RT] realtime battle prototype loaded');

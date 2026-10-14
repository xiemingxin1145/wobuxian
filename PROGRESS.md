# 我不仙 进度清单（2026-10-14 Grok 接管后）

> 稳定版：v2.3.0。v2.5 开放世界方向推进中。工作分支：openworld-wip

## 已完成（本轮）
- [x] 开发者入口：连点版本号 7 次或 #dev 后，右下角「试炼场」按钮
- [x] 试炼场：覆盖层 iframe 打开独立遭遇战原型 `prototypes/encounter/`（不跳页，不影响存档，可关闭返回）
- [x] 阶段 3 债务奇遇：已接入正式 UI.card + 修改真实 G.debt / G.aff，选择后会保存
- [x] 开发者按钮取消可直接执行阶段 3 奇遇
- [x] 建立 openworld-wip 分支
- [x] 低模角色样例：art/prototypes/openworld_v25/ 三角色 Cube/Cylinder 挤出 + Mirror 已完成并签收
- [x] 随机奇遇链草稿：docs/encounter_chain_draft.md + www/prototypes/encounter_chain/ 可玩原型（贩子 + 云游散修 + 药农求助 + 黑市灵石）
- [x] 奇遇链路径断言：test/encounter_chain_verify.py（十条路径债务/好感最终值）
- [x] 试炼场覆盖层：× / 点击遮罩 / Escape 均可关闭并清理监听
- [x] 即时原型 JS 加强：玩家坐标占位 + 普攻冷却方法
- [x] 即时原型再加强：WASD/方向键移动、敌人追击、接触伤害、近距普攻扣血、简易绘制（仍隔离）

## 当前可玩
- CI 构建完成后，连点版本号即可试：
  - 试炼场（覆盖层即时遭遇战原型）
  - 阶段 3 债务奇遇（真实改债务和好感）
- 本地可直接打开 www/prototypes/encounter_chain/index.html 测试奇遇链选择（多路径切换）
- `python3 -B test/encounter_chain_verify.py` 验证路径数值
- `www/js/battle_realtime_prototype.js` 可在控制台调用 RealtimeBattle.start() 后配合 update/draw 测移动与打击（需宿主提供 canvas 循环）

## 仍待完成
- [ ] 低模正式接入精灵图集（需重新渲染管线）
- [ ] 即时战斗接入正式地图遭遇（目前仍是独立页 / 占位）
- [ ] Issue #5 修复（T4 点游走 NPC、T9 自动任务连续成功）
- [ ] 阶段 3 扩展成多条奇遇链 + 正式 NPC 关联（草稿已有 4 条）

## 下一步（继续自动推进）
推进 Issue #5（T4 点游走 NPC、T9 自动任务），或正式债务系统对接奇遇链，或低模接入图集评估。

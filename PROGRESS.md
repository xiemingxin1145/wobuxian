# 我不仙 v2.2 进度清单（断点续做用；v2.1.0 已发布）

## 美术渲染（后台 /tmp/v22render.sh → art/out/v22.log：sprites → portraits → 3 张地图 → ALLDONE）
- [x] specs：12 新 NPC（taizi sanniang zhuiming tianbing xiaoyao guanghan caishen leigong suanpan guizu xiabing baiwuchang）、3 BOSS（guiwang dasiming tiandao2）、4 套时装×2、2 坐骑（carp abacus）
- [x] mapdefs：longgong 东海龙宫 / guishi 鬼市 / cuizhai 天庭催债司
- [x] 渲染完成 → SD build_assets（spr,maps,ui）→ 提交（df785fc；validate22 0 错误）
- [x] 新章节 CG（cg_specs 已加 4 张，/tmp/v22cg.sh 排队渲染，日志 art/out/cg22.log）→ post_cg → CG_OF/CG_LIST
- [x] HD（2.2.0 包 274MB，已删 2 个未引用旧 zip，保留 v2.1.0 标签引用的 2139）：WBX_PROFILE=hd 增量打包（PARTS=spr,ui,maps,cg）→ make_hd_bundle upload → hd-assets.json → 清理 assets-hd 旧 zip

## 代码
- [x] 抽卡演出重做（www/js/gacha22.js，test/gacha22.py）：阵法、按稀有度光柱、翻牌、粒子、闪屏、稀有立绘切入、跳过
- [x] 突破演出加强（www/js/brk22.js，test/brk22.py）
- [x] 抽卡货币平衡（每8年1张、任务35%、成就+1、机缘10%、保底50）
- [x] 新内容代码：4 章（龙宫太子/鬼市当铺/天庭催债司/天道真身）、3 张新地图接入、12 NPC + 17 任务、115 事件、3 BOSS（利滚利/审计/抢灵石/二阶段）、灵宠进卡池（www/js/content22.js, events22.js；node test/validate22.js 0 错误）
- [x] 版本 2.2.0、测试（panels/multilife/fx 全过，0 错误）、screenshots/v22、README、tag v2.2.0（build 144，CI 绿含模拟器冒烟）、验证证书（436bf922…，versionName 2.2.0，APK 275MB）

## 触控验证（v2.2 插入任务，test/controls.py，412x915 真实触摸事件）— 全部通过
修复：摇杆贴墙滑行时朝向仍按摇杆方向（与实际位移最多差 53°）→ 改为按实际位移方向转身（engine.js）。

| 拖动 | 期望朝向 | 实际 | 移动方向误差° | 拖动中 walk | 松开 idle | 结果 |
|---|---|---|---|---|---|---|
| 上 | N | N | 0.0 | True | True | ✅ |
| 右上 | NE | NE | 0.0 | True | True | ✅ |
| 右 | E | E | 0.0 | True | True | ✅ |
| 右下 | SE | SE | 0.0 | True | True | ✅ |
| 下 | S | S | 0.0 | True | True | ✅ |
| 左下 | SW | SW | 9.6 | True | True | ✅ |
| 左 | W | W | 0.0 | True | True | ✅ |
| 左上 | NW | NW | 0.0 | True | True | ✅ |

| 点按目标(格) | 终点误差(格) | 朝向≠运动帧% | 到达 idle | 结果 |
|---|---|---|---|---|
| (+3,+0) | 0.0 | 0.0 | True | ✅ |
| (+0,+3) | 0.0 | 0.0 | True | ✅ |
| (-3,-2) | 0.0 | 0.0 | True | ✅ |
| (+2,-3) | 0.0 | 0.0 | True | ✅ |
| (-3,+2) | 0.0 | 0.0 | True | ✅ |

边界：拖出摇杆区域后松开 ✅；摇杆按住+另一指点按 ✅；点按UI按钮(背包) ✅；面板内滑动 ✅；关闭面板后摇杆 ✅；JS 错误 0
证据：test/controls/joy_*.png、joy_sheet.png、tap_end.png、ui_button_tap.png、results.json


- [x] 奥拉夫修正重渲（锦鲤朝向/高度、天道真身二阶段、三娘/广寒战斗帧）→ 增量打包 WBX_SPR_IDS
- [x] 视觉 A/B（卡通着色 + Quaternius CC0 评估）→ test/ab_render/（许可页已存 docs/licenses/）：WBX_CEL=1 可选，默认仍 PBR；Quaternius 未打包

- [x] 赛璐璐 v2（深色材质补光/高光带/冷边缘光）→ test/ab_render/ab.png 三列对比。结论：浅色角色明显更好，深色角色与 PBR 持平、尚非明显更好 → 暂不列为 v2.3 全量重渲方案，v2.3 先再调深色材质后重做 A/B。

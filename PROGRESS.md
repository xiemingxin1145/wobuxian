# 我不仙 v2.2 进度清单（断点续做用；v2.1.0 已发布）

## 美术渲染（后台 /tmp/v22render.sh → art/out/v22.log：sprites → portraits → 3 张地图 → ALLDONE）
- [x] specs：12 新 NPC（taizi sanniang zhuiming tianbing xiaoyao guanghan caishen leigong suanpan guizu xiabing baiwuchang）、3 BOSS（guiwang dasiming tiandao2）、4 套时装×2、2 坐骑（carp abacus）
- [x] mapdefs：longgong 东海龙宫 / guishi 鬼市 / cuizhai 天庭催债司
- [ ] 渲染完成 → SD build_assets（spr,maps,ui）→ 提交
- [ ] 新章节 CG（cg_specs 增加）→ /tmp/cghd 类脚本 → post_cg
- [ ] HD：WBX_PROFILE=hd 增量打包（PARTS=spr,ui,maps,cg）→ make_hd_bundle upload → hd-assets.json → 清理 assets-hd 旧 zip

## 代码
- [x] 抽卡演出重做（www/js/gacha22.js，test/gacha22.py）：阵法、按稀有度光柱、翻牌、粒子、闪屏、稀有立绘切入、跳过
- [x] 突破演出加强（www/js/brk22.js，test/brk22.py）
- [x] 抽卡货币平衡（每8年1张、任务35%、成就+1、机缘10%、保底50）
- [ ] 新内容：3–5 章、3 张新地图接入、100+ 事件、新 BOSS 技能、新坐骑/时装/灵宠进卡池
- [ ] 版本 2.2.0、测试（panels/multilife/fx）、screenshots/v22、README、tag v2.2.0、验证证书

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


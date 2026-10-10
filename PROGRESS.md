# 我不仙 进度清单（断点续做用；最新发布：v2.3.0，2026-10-10）

> 规则：每轮工作结束都更新本文件和 `docs/ROADMAP.md` 的状态（做完什么、卡在哪、下一步）。

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

## v2.3 — 点 NPC / 任务追踪寻路 / 挂机+离线 / 开发者面板 / 精简版 APK
根因（2.2.0 实测 + 奥拉夫 issue #2）：
1. NPC 判定框只有身体约 42×66px，点名字/头顶标记落空；标记判定框还会抢点按（engine.js pickAt）。
2. 战斗里选目标/自动后 `R.onTap = null` 且不恢复 → 打过一仗后整张地图点不动（奥拉夫发现，最致命）。
3. 摇杆区（左下）吞掉所有点按，NPC 在那儿就点不到。
4. 序章要等过年事件、剑仙 10 岁才出现，开局地图上没有可点的主线目标；追踪栏没有“前往”。
5. 旧测试会瞬移/删 NPC，所以测不出来。
- [x] 判定框 ≥56×88 CSS px，覆盖身体+名字+标记，NPC 优先于道具；摇杆改为“拖动 8px 才激活”，轻点照常点按
- [x] 战斗后恢复地图点按（ui.js + Game.fight finally 保险）
- [x] ★/！/？/…/💬 标记；靠近 NPC 出现大“对话”按钮 #actbtn；首次指引 #tuthint；屏外主线箭头
- [x] 序章讨债史莱姆可点、剑仙在打跑它后出现（不等 10 岁）
- [x] 任务追踪栏：每行“前往▶/过年/修炼/突破”，跨地图御剑确认（可“不再询问”），点地面取消寻路；自动任务（白名单选项，不碰道侣/借贷/结局/渡劫）
- [x] 挂机（方框内打怪采药、行动力用完才过年、修为满即停、总结卡）+ 离线收益（12h 上限，递减，不越瓶颈，不长岁数，回前台结算）
- [x] 开发者模式（标题/设置里版本号连点 7 次，或 #dev）：资源/境界/解锁/剧情/传送/演出/调试（无敌、一击、倍速 x1/2/5/10、离线模拟、重置）
- [x] 桃花村补两处采药点（娘的灵草汤支线原来做不了）；过年后已采标记恢复
- [x] CI 同时发布 wobuxian.apk（HD）与 wobuxian-lite.apk（SD，同一签名），更新检查按版本取对应 APK
- [x] test/human23.py 纯触摸 13/13 通过（截图 test/human23/；新增步骤 11 重叠/摇杆区点身体、12 #actbtn 选最近 NPC）
- [x] 摇杆：第二根手指不再顶掉摇杆（d8ad146）；点名字牌/★优先给其主人；开发者连点改为相邻间隔 ≤1.5 秒
- [~] test/human_olaf.py：5c35c70 全量 13/18；发版提交上 `ONLY=T2,T3,T4,T9,T13` 6/7（T4 游走 NPC 9/20 未过 → issue #5，2.3.1）；controls.py 0 失败
- [x] 合并 main（`f9bba18`，Fixes #2）、`VERSION` 2.3.0（`362172f`）、标签 v2.3.0 → CI 发布 https://github.com/xiemingxin1145/wobuxian/releases/tag/v2.3.0
- [x] 核对（下载 Release 上的两个 APK 用 apksigner/aapt 查）：wobuxian.apk 278,341,061 B、wobuxian-lite.apk 47,679,345 B；都是 versionName 2.3.0、versionCode 151（> beta 的 147）、证书 SHA-256 436bf9221c08db212a13a9e8d64459f27cca9777223b7c21480fb33ce7ef29dc（= 2.2.0）；同包名+同证书+更高 versionCode → 可覆盖安装 2.2.0（CI 模拟器冒烟 API30/34 通过；未在真机实装验证）；latest/download 两个链接都 302 到 v2.3.0
- [ ] 第 5 项内容 → 移到 2.3.1（research_v22 §7 台词 + §8 数值；草稿 drafts/content23.js 未接入）

## 新方向：开放世界 / 混合战斗（v2.5+）
- [x] 新增方案文档 `docs/openworld_upgrade.md`（低模报出替代球体、即时/半即时战斗原型、随机奇遇链 + 债务强化）
- [ ] 建分支 `openworld-wip` 并开始低模角色样例
- [ ] 即时战斗原型（遭遇战）
- [ ] 随机奇遇 + 债务后果草稿

## 下一步（新接手从这里开始；详见 docs/ROADMAP.md §3）
### 2.3.1（从 main 开 `v231-wip`）
- [ ] issue #5 T9：自动任务 3 分钟内推进主线（依赖战斗胜负，打输后“变强”要等两年 → 缩短/改为立刻练级再试）
- [ ] issue #5 T4：远处点游走 NPC 9/20（失败全是 “npc missing”）→ ≥18/20
- [ ] issue #5 controls 回归：已修并通过；补一个“附近有 NPC 时点地”的用例
- [ ] 第十七章～终章（下）：接入 drafts/content23.js（research_v22 §7/§8），validate22 0 错误、multilife 跑到新结局、自动任务不碰结局选项
### 2.4
- [ ] 角色模型换 proto v2：分支 `v24-chars`（见该分支 HANDOFF_CHARS.md、docs/art_specs.md）
- [ ] 地图扩大（>22×22）到 15+ 张 + 世界地图

### 新增：v2.5 开放世界混合方向（见 docs/openworld_upgrade.md）
- 低模报出建模替代球体
- 即时/半即时遭遇战原型
- 随机奇遇链 + 债务强化贯穿

# 我不仙 进度清单（断点续做用；最新发布：v2.3.0；v2.5 工作基线：main `3baa83f`，2026-10-10）

> 规则：每轮工作结束都更新本文件和 `docs/ROADMAP.md` 的状态（做完什么、卡在哪、下一步）。

## 当前接手基线（2026-10-10）
- 工作分支：`openworld-wip`，从远端 `main` 的 `3baa83fbcedca3da96efd6e326885821ba10604d` 建立；本分支按用户最新顺序推进阶段 1 样例→隔离战斗原型→单条奇遇闭环；不改 `main`、不合并、不发布。
- GitHub Issue #5 仍为 OPEN。于 `2026-10-10 14:11:36 +08` 刷新核对，API `updated_at=2026-10-10T04:25:19Z`、共 1 条评论，仍未记录本轮本地复测；最新评论：[永久链接](https://github.com/xiemingxin1145/wobuxian/issues/5#issuecomment-6093743735)。历史报告与本轮定向复测分开记录，时间均为 UTC；原始结果文件未覆盖：

| 证据 | 时间 | 结果 | 开发者辅助 | 原始证据路径 |
|---|---|---|---|---|
| Issue #5 历史报告 | 评论 `2026-10-10T04:25:19Z`；原文件备份于 `04:53:01Z` | T4=9/20；T9 单次 13 秒从主线 4→5、零瞬移；不是连续 5 次验收 | T9 记录 `dev:境界>练气圆满`、`dev:剧情>坊市查账`，属辅助结果 | 仓库原文件 `test/human_olaf/results.json`；逐字备份 `/workspace/wobuxian-test-evidence/issue5-before-20261010/results.json` |
| 本轮 T4 独立复测 | 批次开始 `05:10:37Z`；JSON 写入 `05:11:09Z` | **1/20**；19 次记录为 `npc missing`；未通过 | JSON 未记录开发者作弊项 | `/workspace/wobuxian-test-evidence/issue5-rerun-20261010/T4/results.json`；退出码及截图同目录 |
| 本轮 T9-1 | `05:11:38Z`–`05:16:08Z` | 失败；182 秒，主线 4→4，零瞬移 | 有辅助：`dev:境界>练气圆满`、`dev:剧情>坊市查账` | `/workspace/wobuxian-test-evidence/issue5-rerun-20261010/T9-1/results.json` |
| 本轮 T9-2 | `05:16:08Z`–`05:17:38Z` | 单次通过；14 秒，主线 4→5，零瞬移 | 有同样两项开发者辅助 | `/workspace/wobuxian-test-evidence/issue5-rerun-20261010/T9-2/results.json` |
| 本轮 T9-3 | `05:17:38Z`–`05:19:08Z` | 单次通过；13 秒，主线 4→5，零瞬移 | 有同样两项开发者辅助 | `/workspace/wobuxian-test-evidence/issue5-rerun-20261010/T9-3/results.json` |
| 本轮 T9-4 | `05:19:08Z`–`05:20:38Z` | 单次通过；14 秒，主线 4→5，零瞬移 | 有同样两项开发者辅助 | `/workspace/wobuxian-test-evidence/issue5-rerun-20261010/T9-4/results.json` |
| 本轮 T9-5 | `05:20:38Z`–`05:22:08Z` | 单次通过；16 秒，主线 4→5，零瞬移 | 有同样两项开发者辅助 | `/workspace/wobuxian-test-evidence/issue5-rerun-20261010/T9-5/results.json` |

历史 T4=9/20 与本轮 T4=1/20 是不同批次。本轮 T9 共 5 个独立运行，其中 T9-1 失败、T9-2 至 T9-5 连续 4 次通过，但每次都记录了两项开发者辅助；因此既不足连续 5 次，也不是无辅助自然流程验收。Issue #5 不得据此关闭。
- 执行顺序：阶段 1 已由玛丽卡按精确提交 `e29964d0c260f9fba79e9a43bf21081ab771bc13` 正式签收，范围仅为离线美术资产；阶段 2 现已授权并进行中。阶段 2 独立测试/签收后才开始阶段 3；各段单独提交与更新，不改 `main`、不合并、不发布。

### 阶段 1 样例状态（2026-10-10）
- 三款手工低模源模型与 Blender 4.2.23 场景已生成：`art/prototypes/openworld_v25/character_models.py`、`openworld_v25_models.blend`；构模基于 Cube/Cylinder 挤出轮廓、支撑环与 X Mirror，未改 `art/chars.py`、游戏精灵图集或运行时文件。
- Blender 输出 12 张 `320×352` 帧（现有造型 idle×3；新模型 idle/walk/attack×3×3）；预览：A/B `1560×900`、姿态 `1540×1120`、男女主单色剪影板 `1136×410`、T0 同一可走地砖替换图 `1968×622`，均在 `art/prototypes/openworld_v25/previews/`。
- 2026-10-10 已从唯一源重新生成：`character_models.py` Git blob `3df62d345b5f5d005158d07d7267326ad6495a37`（与 `b6052ef` 中唯一源相同，并在当前重建提交 `e29964d` 中固定；文件 SHA-256 `f752280723cd2d2a7c87d2e0f691c93076753b34573b7d7f1d718e486ad462b1`）。官方 Blender 4.2.23 LTS 从该源重建 `.blend` 并重新渲染12张 `320×352` 帧；最终 `.blend` SHA-256 `5f2ebd5343a6db92847fbc1199cc2cee75d9e37773f5621dabf85040cadd4f18`。四张预览和哈希见样例 `README.md`。
- Blender 4.2.23 LTS 重新打开最终 `.blend` 并以 `--python-exit-code 1` 严格验证通过：男主 35 个网格/3 个 Mirror/8 个挤出或环线命名部件；女主 40/3/9；剑仙 42/3/10；坐标有限，各根节点 `runtime_integrated=false`。女主裙摆半宽约0.62、男主0.36（约1.72倍），并加长双侧发束。同一组新渲染帧计算的男女剪影 IoU 明确为 **64px=0.692308、48px=0.697318**，低于本轮项目自定 `≤0.70` 内部门槛（非行业标准、非用户辨认率）；旧提交 `19fc932` 另一组源/帧为64px=0.679245、48px=0.681648，不与当前候选混报。
- `validate_preview_geometry.py` 基于 T0 真人触控截图，三个互斥替换共享可走脚点 `(411,979)`；按 `k=1.0` 显示完整160×176帧（约153×169px），全帧距对照裁切边至少87px。用重渲alpha可见轮廓与15个手工截图区域做45组净距检查通过，女主距粉树最小30px、男主/剑仙41px；栅栏只登记为观察到的后景。区域未穷尽背景几何，不代表真实地图坐标、Canvas绘制层级或运行时命中验证。
- 隔离对照（临时 worktree、未纳入正式模型）：把女主裙摆半宽 `0.62→0.56`、下摆 `0.63→0.57` 后，IoU变为64px `0.718` / 48px `0.717`，超过自定0.70过滤值；粉树净距由30px增至34px。虽然静态遮挡与Blend结构检查通过，但剪影指标变差，故不替换当前候选；此结果不能视为独立美术评审。
- 验收边界：图像为Blender离线渲染及T0截图静态合成，不是运行中游戏画面；通过自定IoU过滤值也不证明用户辨认效果。人工遮挡区域不完整，仍可能漏掉其他树木/花草；真实点按、5人剪影盲测、不同设备/DPR、游戏接入、游戏资源导出、APK、Android/真机均未做。玛丽卡此前通过了相同数值的静态图面候选；本次同源重建已纳入干净本地提交 `e29964d0c260f9fba79e9a43bf21081ab771bc13`，玛丽卡已按精确提交 `e29964d0c260f9fba79e9a43bf21081ab771bc13` 签收本阶段离线资产；该签收不覆盖真实点按、5人盲测、设备验证或正式游戏接入。

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
- [~] `test/human_olaf.py`：历史发版子集 `ONLY=T2,T3,T4,T9,T13` 为 6/7；Issue #5 仍 OPEN。历史报告与本轮隔离 T4/T9 复测分列于上表；本轮结果不覆盖 `test/human_olaf/results.json`，T4 未过，T9 未满足连续 5 次且使用开发者辅助。
- [x] 合并 main（`f9bba18`，Fixes #2）、`VERSION` 2.3.0（`362172f`）、标签 v2.3.0 → CI 发布 https://github.com/xiemingxin1145/wobuxian/releases/tag/v2.3.0
- [x] 核对（下载 Release 上的两个 APK 用 apksigner/aapt 查）：wobuxian.apk 278,341,061 B、wobuxian-lite.apk 47,679,345 B；都是 versionName 2.3.0、versionCode 151（> beta 的 147）、证书 SHA-256 436bf9221c08db212a13a9e8d64459f27cca9777223b7c21480fb33ce7ef29dc（= 2.2.0）；同包名+同证书+更高 versionCode → 可覆盖安装 2.2.0（CI 模拟器冒烟 API30/34 通过；未在真机实装验证）；latest/download 两个链接都 302 到 v2.3.0
- [ ] 第 5 项内容 → 移到 2.3.1（research_v22 §7 台词 + §8 数值；草稿 drafts/content23.js 未接入）

## 新方向：开放世界 / 混合战斗（v2.5+）
- [x] 新增方案文档 `docs/openworld_upgrade.md`（低模报出替代球体、即时/半即时战斗原型、随机奇遇链 + 债务强化）
- [x] 新增即时遭遇战原型占位 `www/js/battle_realtime_prototype.js`（可导出 RealtimeBattle，后续接入移动/技能/弹道）
- [x] 建分支 `openworld-wip`，从最新已核实 `main` `3baa83f` 开出；分支起点工作区干净
- [x] 阶段 1：离线低模资产/预览、Blend 与静态几何检查完成；玛丽卡已按 `e29964d0c260f9fba79e9a43bf21081ab771bc13` 签收。仅签收离线资产，不代表实机/触控/盲测/设备验证，也不接入正式运行链。
- [~] 阶段 2（进行中）：隔离浏览器练习场 `www/prototypes/encounter/` 已验证移动、普攻、雷击、闪避、敌方预警/弹道、碰撞伤害、胜败重试和返回练习地图。2026-10-10 CDP合成触摸复测 8/8 PASS、0 FAIL、退出码0，pageerror/console.error/HTTP错误均为0；日志和胜利图为 `test/results/encounter-stage2-20261010T1458-touch.log`、`test/results/encounter-stage2-20261010T1458-touch-win.png`，本次回环入口 `http://127.0.0.1:41103/prototypes/encounter/`。测试用 `Input.dispatchTouchEvent` 合成触摸事件，不是实体触屏或Android真机；正式地图未接入，待玛丽卡按阶段2最终提交SHA独立签收。正式运行链和 `www/js/battle_realtime_prototype.js` 不动。
- [ ] 阶段 3（阶段 2 单独验收后）：做一条可测的奇遇选择闭环，至少覆盖 NPC 态度与债务后果；先复用现有状态，任何正式游戏接线另行小步验证
- 2026-10-10 14:59 +08复核：阶段2仍待独立签收时，工作区有未提交的 `www/js/events22.js`、`www/js/game.js` 赊丹草稿及未跟踪测试 `test/v25_credit_encounter.py`，均未执行。最新草稿让部分还款后保留未结标记、余额归零时关闭，并以 `debt>0` 控制下一年度催收；延期继续留在催收链，拒付则结束财神直接催收并宣称转入天道总账。该行为与上一条14:52观察相比已调整，但未测试；不得计作阶段3完成，也不得在阶段2独立验收前接入正式流程。

## 下一步（新接手从这里开始；详见 docs/ROADMAP.md §3）
### 当前优先（v2.5+ 阶段 2）
- [x] 阶段 1 已由玛丽卡按 `e29964d0c260f9fba79e9a43bf21081ab771bc13` 签收，范围仅为离线资产。真实点按、5人盲测、运行时/设备验证、正式游戏接入、APK/Android/真机均未做。
- [~] 阶段 2 CDP合成触摸单实例复测：8 PASS/0 FAIL、退出码0，浏览器和HTTP错误均为0；完整日志/胜利截图见 `test/results/encounter-stage2-20261010T1458-touch.log` 与同目录 `encounter-stage2-20261010T1458-touch-win.png`。这是浏览器合成触摸，不是实体设备；仍待阶段2最终提交的玛丽卡独立签收。
- [ ] Issue #5 保持未解决：本轮 T4=1/20；T9 为 1 次失败 + 4 次开发者辅助下的连续单次成功，仍未达到连续 5 次且不是无辅助流程；目标仍是 T4≥18/20 与 T9 连续 5 次成功，不能用历史 9/20 或辅助跑替代验收。

### 后续产品清单（不与上述阶段并行）
1. 主角“从弱到强”的成长小闭环：清楚的起点、可获得的资源/能力提升、一次可验证的突破及后果。
2. 开发者调试面板可指定装备/能力：仅作测试工具，先保证可重复设定与可清理，不把作弊入口当玩家成长功能。
3. 扩充多种分支奇遇：在阶段 3 的单条闭环通过后，再扩写多条事件及对 NPC 态度、债务、下一世的影响。
4. 道侣与家庭线：先做一段可测关系/婚姻/子嗣传承，再扩展多道侣、多婚姻；尚未实现。

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
- 即时/半即时遭遇战原型（已有 stub）
- 随机奇遇链 + 债务强化贯穿

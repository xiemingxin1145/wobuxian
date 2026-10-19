# 我不仙 进度清单（2026-10-10 Grok 接管后）

> 稳定版：v2.3.0。v2.5 开放世界方向推进中。

## 3.4 自由度（Grok Bot，2026-10-19 起，分支 `v34-world`，worktree `/workspace/game-ow34`）
> 主人要求：3.4 主打鬼谷八荒式自由度。第 1 步：无缝相邻地图（优先）→ 大地图。
- [x] **无缝相邻地图** `www/js/seam34.js`（index.html 在 audio32 前加载）：按 world28 九州大地图节点坐标（MAPINFO.wx/wy 或 World28.DEFAULT_LAYOUT）给每张图四条等距边各连最近邻图（≤1500 世界格，贪心保证双向一致，共 50 条边向）。每条边在「与出生点连通、该方向最外侧且靠中线」的可走格放出口（发光光圈+箭头+「→ 邻图名」，未解锁显示 🔒 并 toast 境界不足）。停在出口（点按到达或摇杆走上去）即调 `Game.travel(id, true)`：免费、无菜单、跳过 UI.fade/UI.loading（无黑屏），进图时预加载所有邻图底板/道具图集；到达邻图反向出口内侧一格。寻路途经出口（自动任务/追踪）不切图。
- [x] `test/seam34.py`（真实触摸；作弊：开发者面板「解锁全部地图」「不遇敌」）：桃花村→青云宗→桃花村，0 黑屏帧、行动力不变、落点正确、无 pageerror：通过。
- [ ] 门禁（seam34 版，v34-world `HEAD`）：validate22 0 错、stage3_chain ALL PASS、jsscan33/sys33_unit/content33 errors []、panels21 ERRORS 0、controls FAILS 0、human23 13/13、seam34 通过；human_olaf 全量 11:35（UTC+8）开跑，输出 `/tmp/g_olaf.txt`（末行 `exit N`）。全绿后 `--no-ff` 合 main 推送。
  - 12:05 human_olaf 进行到 T13：除 N1、T4 外全 PASS（含 T7 跨图导航、T9 自动任务、S1–S3）。N1/T4 是已知偶发（3.3.1 基线 g331full4 也挂 T3/T4，y_N1/g331v4n1 挂 N1，见 #12），接着单独重跑 ONLY=N1,T4 确认。
  - 全量 human_olaf：21/23（N1、T4 19/20 点剑仙命中翠花），T13 回归 PASS，JS 错误 0。重跑 `ONLY=N1,T4` ×2：4/4 全过（T4 20/20）。判定为已知偶发（#12），合 main。
- [x] 合并 `df295fc`（--no-ff）推 main → CI run 117 build 成功，预发布 **build-217**（12:40 UTC+8）：https://github.com/xiemingxin1145/wobuxian/releases/tag/build-217 （wobuxian.apk 371,475,061 B；wobuxian-lite.apk 83,318,613 B；versionName 仍 3.3.0，未打标签）。
- [x] 分支 `v34-big`（worktree `/workspace/game-ow34b`，基于 v34-world）：名牌与 #qt 任务栏重叠时淡到 12%；findPath 上限 max(4000, n²·3)。尚未跑门禁，随地图扩大一起合。
- [x] `v34-big` 上：`www/js/bigmap34.js`（index 在 seam34 前）原型——village 36、sect/heaven 32、market/secret 28；旧 22×22 坐标不变，向 +i/+j 扩展；主路延伸+新区环路+池塘；本图道具图集放建筑/交互点/树；连通兜底（从出生点洪泛删堵路道具）；新区地块按 1024px 分块离屏缓存、只画视口内块。probe（412×915 DPR2 无头软件渲染）：村新区帧中位 33ms/p95 66ms（基线未测）。validate22 0 错。已应用 #12 补丁（ux23.js 部分）。
- [x] (12:45–12:55) 新区地块改为底板真实纹理：`tools/big34_src.py` 离线挑源格（3×3 同类、无道具、颜色近中位）→ `Big34.SRC`；缺纹理类型用配色+噪点；崖面抠旧图崖。新增 6 个新区 NPC（渡口船夫、集市货郎、守山弟子、收费仙吏、吆喝的小贩、迷路的寻宝人，闲聊台词）；乱葬岗/东海仙岛/魔道裂谷也扩到 28。截图 `/workspace/shots34/*_v5.png`。
- [x] seam34 出口外侧画邻图对边地块预览（截图 `/workspace/shots34/edge_*.png`）。
- [ ] 13:00 起 v34-big 全门禁：`nohup bash /tmp/gate_big.sh`，汇总 `/tmp/gate_big.txt`，各项 `/tmp/gb_*.txt`。绿了合 main。
  - 13:20：validate22 0 错、stage3 ALL PASS、jsscan33/sys33/content33 errors []、panels21 0、controls 0、seam34 通过、human23 13/13；human_olaf 进行中（N1 首轮挂，待重跑）。
  - 13:40 T4 13/20 诊断：2 次 #12（点剑仙命中翠花）；5 次是 `timeout(budget)`——T4 总预算 900 s 在第 15 次点按时耗尽（不是点按/寻路失败；桃花村 36 格后 NPC 更分散，走位路程变长）。修：T4 总预算按 R.n/22 线性放大（村 36 → 1473 s），单次判定不变，结果里记录 budget_s/used_s。
  - 13:50 首轮全量 olaf 结束：21/23（N1、T4），其余全过含 T7/T9/T13，JS 0。重跑 `ONLY=N1,T4` → `/tmp/gb_r1.txt`。
  - 14:00–14:40 重跑：r1 N1 PASS、T4 19/20（1 次「NPC 身体被 UI 挡住」harness 跳过）；r2 T4 **20/20**（预算 1473 s，用 971 s），N1 fought=false。诊断 N1：扩图后怪物密度下降 → 改为怪物数按面积放大（村 4→11，保持原密度；probe：开局屏内怪 2–3 只，基线 0–1）。之后 N1 ×3：1 PASS，2 FAIL（点 NPC 进了战斗 / 一次没打上怪），属 #12 同类偶发。
  - 全量 olaf #2（14:10–15:00）：20/23，FAIL N1、T1 34/35（点王大爷头部时撞怪进战斗）、T4 16/20（3 次 harness「NPC 身体在屏外/被 UI 挡」x>412 + 1 次 #12 剑仙→翠花）；其余全过，JS 0。修 harness：T4 站位后 NPC 不可点则换站位（最多 13 次）。已合 main（#14 seam34 改动保留，无冲突），seam34.py 重跑通过。下一步：ONLY=N1,T1,T4 重跑 + human23 → `/tmp/gb_r3.txt`、`/tmp/gb_h23b.txt`。
  - r3（合 main 后）：N1 PASS、T1 34/34、T4 18/20（2 次均为 #12 剑仙→翠花，同一坐标），human23 13/13。再跑 ONLY=T4 → `/tmp/gb_r4.txt`。
  - r4：T4 19/20（1 次点路人甲时被怪近身进战斗，#12 同类）。按负责人决定接受 #12 类偶发，合 main。
- 旧下一步（v34-big）：①美化新区（地块有棋盘感，可加草纹/路边石）②在新区放 2–3 个已有 NPC/交互点 ③测基线帧时 ④把 seam34.py/全门禁在 v34-big 跑一遍 ⑤旧边缘 x 打通处与底板崖壁衔接检查截图。
- [ ] 未做：邻图边缘地块预渲染（现在只有出口标识，没画邻图边条）；地图扩大（桃花村 36、青云宗/天外天 32，计划：在 +i/+j 方向扩展，旧坐标不变免迁移，新区域用程序化地块+现有道具图集）；§E.3 分块绘制/寻路上限；名牌压任务栏；#12 补丁。
- 下一步：门禁全绿 → `--no-ff` 合 main 推送 → 记录 build 号；再做地图扩大。

## v3.3.0 线（Grok Bot，2026-10-18 起，UTC+8）
> 基线：main `2134d8c`（v3.2.0 HD 包）。避开开放世界线认领的文件（stage3_encounter_draft.js、test/stage3_chain.js）。

### 阶段 1 检查结果（main + 图标修复）
- `node test/validate22.js`：**3 错误** → 神通 st_jianpo/st_wanjian/st_hunyuan 引用不存在的图标 `sk_sword`/`sk_def`（图集里只有 `sk_swords`/`sk_shield`）。✅ 已修（`505ffb9`）。
- `test/controls.py`：0 失败。
- `test/human23.py`：首轮 4–10 步失败；根因是同一台机上同时跑了 4 个 Chrome 测试（负载 10/8 核），追踪栏寻路的 20 秒等待超时；单独复现时剑仙对话正常打开（非游戏 bug），发版前单独重跑。
- `test/human_olaf.py` 全量：首轮在 N1 里 harness 崩溃（点地后 `npcs()` 返回 None：画面暂时不在 map 模式）→ harness 加空值保护；单独 `ONLY=N1` 3/3 过。
- 无头 JS 巡检 `test/jsscan33.py`（21 张图 + 大地图 + 过年）：0 个 pageerror；只有资源 404/空响应（测试用单线程服务器并发导致，非游戏问题）。
- 点按 S2 时发现：「更多」面板抛 `TypeError`（dao28.js 找 `.grid2`，实际是 `.grid3`）→「参悟悟道」入口缺失。✅ 已修。
- Issue #5：T9 原为“输给讨债鬼头子后要等两年”。✅ 改为打 3 只怪/过年/提境界/本图无怪即回去再战 + 「屡败屡战」(每败 +20% 攻防血，最多 5 层，再战前回满)。新用例 T9b（练气初期，必输开局）38 秒推进 4→5，0 瞬移。

### 阶段 3 内容
- [x] 第十七章·雷部电费单 / 第十八章·剑仙的合同 / 终章（上）改渡劫 / 终章（下）南天门竣工验收 + 4 结局（`www/js/content23.js`，由 drafts 接入；验收后可「留在仙界」接 3.0 尾声与 3.1 仙界篇）
- [x] 先天命格 `mingge33.js`（6 选 3、重抽 1 次、老档补选 1 个、角色面板显示）
- [x] 本命法宝+器灵 `fabao33.js`（洞府面板；公式与 A2.2 一致：3→4 阶 3194 灵石/3 玄铁/76%）
- [x] 天道催收令 `worldboss33.js`（年%3==1；3 次×10 回合；丙乙甲天；风云榜种子=年份；称号「反向催收」；开发者按钮）
- [x] 道途日课+七日签到 `daily33.js`（左上「日课」按钮+红点；05:00 刷新；回调时间不重复领）
- [x] 万象图鉴 `tujian33.js`（五类收集度加成/套组一次性奖励/老档补点亮）
- [x] 身外化身 `huashen33.js`（元婴凝练/化神+1/差事过年结算/疲劳−20%；洞府面板；A5.4 rt29 AI 队友跳过——buildAllies 在 IIFE 内无低风险钩子）
- [x] 文案包接入（`docs/research_v33_text.md`）：6 器灵分人设对白 `FB_LINES_BY_ID`（诞生/随机/好感 50·100/擦拭，缺省回退 `FB_LINES`）；催收使降临公告/开战/半血/结算/击杀/年末离开台词 + 风云榜 8 个新 NPC 名；16 个命格风味文本（选取卡小字）；日课刷新/满点/七日签到/断签回归 toast。分支 `text33`，PR 待门禁。validate22、jsscan33、sys33_unit、content33 已过；命格选择卡 412×915 截图确认不溢出。
- [ ] 心魔幻境（P2 → 3.4）
- 下一步：心魔幻境 P2→3.4，或 polish / Issue #5；发版门禁全绿后再 bump VERSION 到 3.3.0（本轮不 bump）。
- 大地图/世界地图：已由 2.8 world28（九州大地图）+ 3.1 仙界四图完成，现有 21 张图，本轮不重复。

### 阶段 4 发版状态（2026-10-18 19:20 UTC+8）
- [x] #7 #8 #9 修复并关闭（d9ecb0d / 68cf4ce；回归 sys33_unit + human_olaf S4）；ow-next 已合并（312ca11，stage3_chain ALL PASS）；PR #11 文案包已合并（5b09ad2）。
- [x] #5 游走 NPC 点按加固 bb1e195、序章讨债史莱姆刷点避开 NPC c7fba53。
- [x] 门禁（5b09ad2）：validate22 0 错、stage3_chain 通过、controls 0 失败、jsscan33 0 pageerror、sys33_unit/content33 通过、panels21 ERRORS 0、human23 13/13。
- [x] 门禁3（c7fba53）：panels21 ERRORS 0、controls 0 失败、human23 13/13；human_olaf 全量与发版并行，N1 偶发（点怪命中说书先生，非 P0）→ #12（3.3.1）
- [x] v3.3.0 已发布：https://github.com/xiemingxin1145/wobuxian/releases/tag/v3.3.0 （build 216，Latest）。wobuxian.apk 371,467,416 B（HD）、wobuxian-lite.apk 83,310,968 B；两包 versionName 3.3.0、versionCode 216（>214/215），证书 SHA-256 436bf922…29dc 一致。#5 已关闭；剩余问题 → #12（3.3.1）。
- 下一步：3.3.1 处理 #12（补丁 /workspace/p5/ux_ovl_3.3.1.patch）；3.4 心魔幻境 + 开放世界线。

## 开放世界线（进行中）
> 2026-10-18 15:20（UTC+8）开放世界线机器人认领。只碰下列文件，避开 Issue #5 / 第十七章线（controls.py、ux23.js 自动任务、章节/剧情数据）：
- `www/js/stage3_encounter_draft.js`（阶段 3 债务奇遇：修 flag 误写 bug + 加第二步「讨债追兵」）
- `test/stage3_chain.js`（新增，node 无头单测）
- `PROGRESS.md`、`docs/openworld_upgrade.md`（状态更新）

## 已完成（本轮）
- [x] 开发者入口：连点版本号 7 次或 #dev 后，右下角「试炼场」按钮
- [x] 试炼场：跳转到独立遭遇战原型 `prototypes/encounter/`（不影响存档）
- [x] 阶段 3 债务奇遇：已接入正式 UI.card + 修改真实 G.debt / G.aff，选择后会保存
- [x] 开发者按钮取消可直接执行阶段 3 奇遇

## 当前可玩
- CI 构建完成后，连点版本号即可试：
  - 试炼场（即时遭遇战原型）
  - 阶段 3 债务奇遇（真实改债务和好感）

## 仍待完成
- [ ] 低模正式接入精灵图集（需重新渲染管线）
- [ ] 即时战斗接入正式地图遭遇（目前仍是独立页）
- [ ] Issue #5 修复（T4 点游走 NPC、T9 自动任务连续成功）
- [ ] 阶段 3 扩展成多条奇遇链 + 正式 NPC 关联

## 下一步（继续自动推进）
优先把试炼场改成不跳页（iframe/覆盖层），然后推进 Issue #5 与低模接入。

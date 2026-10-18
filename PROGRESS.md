# 我不仙 进度清单（2026-10-10 Grok 接管后）

> 稳定版：v2.3.0。v2.5 开放世界方向推进中。

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

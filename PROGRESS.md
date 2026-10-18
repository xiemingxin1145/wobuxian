# 我不仙 进度清单（2026-10-17 Grok 接管后）

> 稳定版：v2.3.0。v2.5 开放世界方向推进中。工作分支：openworld-wip

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

### 2026-10-19 会话（UTC+8，分支 openworld-wip，永不推 main）
- [x] 步骤 1：把 origin/main（v3.3.0，`f16beaf`，含 ow-next `cfe63fb` 两步债务链 + `test/stage3_chain.js`）`--no-ff` 合进 openworld-wip，无冲突。门禁：stage3_chain ALL PASS、validate22 0 错、encounter_chain_verify 14/14、jsscan33 0 错、sys33_unit 0 失败。
  - 涉及文件：合并提交本身（来自 main 的全部改动）+ `PROGRESS.md`
- [x] 步骤 2：即时战原型 `www/js/battle_realtime_prototype.js` 接游戏现有角色精灵（主角 `Game.playerSpr()`、敌人 `mon_slime`，八方向 + idle/walk/attack/hurt），普攻改为面向 ±60° 扇形命中 + 伤害飘字 + 闪白/击退，打空显示「落空」；自带覆盖层画布 + rAF 循环 + 触屏摇杆/攻·技·闪按钮，Escape/× 关闭。修旧 bug：以前「即时战」按钮只调 `start()` 没人跑 update/draw，原型卡在 on 状态并一直拦截空格/Shift/Q。整个文件包进 IIFE，不再泄漏全局 `RT`/函数名；只由开发者入口打开，不碰 `Game.fight`/存档。
  - 测试：`node test/battle_rt_proto.js` 26/26；`python3 -B test/battle_rt_proto_page.py`（#dev 真页面：开覆盖层→精灵已加载→普攻扣 28 出飘字→Escape 关闭，0 JS 错误）6/6；stage3_chain、validate22、encounter_chain_verify 14/14、sys33_unit、jsscan33 均无新失败。
  - 涉及文件：`www/js/battle_realtime_prototype.js`、`www/js/dev_entry_v25.js`（即时战按钮改调 `open()`）、`test/battle_rt_proto.js`、`test/battle_rt_proto_page.py`、`docs/openworld_upgrade.md`、`PROGRESS.md`
- [x] 步骤 3：方块低模角色运行时草稿 `www/js/lowpoly_box_chars.js`——两个样例「青衫剑修」「讨债鬼差」各 12 个长方体（Canvas 2D 等距投影 + 背面剔除 + 三面明暗 + 画家排序），待机呼吸 / 行走摆腿摆臂 / 挥砍前刺三种姿势、四方向。独立预览页 `www/prototypes/lowpoly_box/index.html`（含「用方块角色试打即时战原型」按钮，即时战原型 `skin:'box'` 改画方块人）。**不进 `www/index.html`**，正式游戏不加载。比例参照阶段 1 Blender 样例，但这是 Canvas 现画，不替代已签收的离线资产。
  - 测试：`node test/lowpoly_box.js` 29/29（剔除/顶面/面向映射/遮挡顺序/挥砍方向/尺度/隔离）；`test/battle_rt_proto.js` 27/27（加方块皮肤用例）；battle_rt_proto_page 6/6；stage3_chain、validate22、encounter_chain_verify 14/14、sys33_unit、jsscan33 均无新失败。
  - 涉及文件：`www/js/lowpoly_box_chars.js`（新）、`www/prototypes/lowpoly_box/index.html`（新）、`www/js/battle_realtime_prototype.js`（skin 选项）、`test/lowpoly_box.js`（新）、`test/battle_rt_proto.js`、`docs/openworld_upgrade.md`、`PROGRESS.md`
- 下一步（上轮记录）：主人确认方块人风格；即时原型加敌人前摇预警、只读带入 `Game.stats()`。

### 2026-10-19 第二轮（UTC+8，openworld-wip）
- [x] 步骤 4：即时原型敌人出手改为「前摇预警 → 出手」：冷却好后锁定朝向玩家的方向，0.6s 红色预警区由淡到浓 + 敌人闪烁，然后近距**前冲**（约 94px，命中 -15）或远距**弹道**（0.45s 预警线，命中 -12）；取消原来的贴身接触伤害。玩家 Shift/「闪」闪避给 0.3s 无敌（角色闪烁），无敌中前冲/弹道免伤并飘「闪避!」，弹道穿身而过；前摇中走出预警区也能躲开。
  - 测试：`node test/battle_rt_proto.js` 42/42（新增 15 条：进前摇/锁方向/前摇不伤/画预警/不躲挨打/冷却/侧移落空/无敌免伤/无敌归零/远距预警线/沿锁定方向发弹/弹道命中/无敌穿过/无贴身伤害）；battle_rt_proto_page 6/6；lowpoly_box 28/28；stage3_chain、validate22、encounter_chain_verify 14/14、sys33_unit、jsscan33 均无新失败。
  - 涉及文件：`www/js/battle_realtime_prototype.js`、`test/battle_rt_proto.js`、`PROGRESS.md`
- [x] 步骤 5：即时原型主角血/攻**只读**取自存档：`Game.stats()` 的 mhp/atk + `G.hp`（当前血，钳到上限），抛错/NaN/0/负数/缺字段/无存档一律回退 180 血 / 28 攻；`opts.hp/atk` 可覆盖。敌人血量按「攻/28」、伤害按「上限/180」同比缩放，砍死所需刀数不随境界变。整场不写回存档。顶栏显示「攻N(存档)」。
  - **顺手修的 bug**：`game.js`/`ui.js` 是顶层 `const Game`/`const UI`，真实页面里 `window.Game`/`window.UI` 都是 `undefined`。原型以前用 `window.Game` 判断 → 上一轮「主角用 Game.playerSpr()」在真页面里其实一直回退成 `player_m0`、toast 也从不显示。已改为 `typeof Game`，真页面验证主角精灵/属性均取自存档。⚠ 同样的写法还在 `dev_entry_v25.js`（「全套神装」、试炼场取消→阶段3奇遇）和 `stage3_encounter_draft.js:94`（`!window.UI` → 永远返回 no game or UI），这些开发者按钮在真页面里很可能静默无效，本轮未改（不在本轮步骤内），列为下一步。
  - 测试：`node test/battle_rt_proto.js` 64/64（新增 22 条：读存档/取整/敌人缩放/刀数不变/前冲伤害缩放/G 深比较不变/opts 覆盖/7 种异常回退/当前血非法与超上限/无 G/vm 模拟顶层 const/禁止 window.Game）；`test/battle_rt_proto_page.py` 8/8（新增：真页面建档后血/攻 = `Game.stats()`、女主精灵 `player_f2`、战斗前后 G 不变）；lowpoly_box 28/28；stage3_chain、validate22、encounter_chain_verify 14/14、sys33_unit、jsscan33 均无新失败。
  - 涉及文件：`www/js/battle_realtime_prototype.js`、`test/battle_rt_proto.js`、`test/battle_rt_proto_page.py`、`PROGRESS.md`
- 下一步：步骤 6 —— 方块人补主角女 / 剑仙 + 受击姿势；之后修 `dev_entry_v25.js` / `stage3_encounter_draft.js` 的 `window.Game`/`window.UI` 判断。

## 已完成（本轮）
- [x] 开发者入口：连点版本号 7 次或 #dev 后，右下角「试炼场」按钮
- [x] 试炼场：覆盖层 iframe 打开独立遭遇战原型 `prototypes/encounter/`（不跳页，不影响存档，可关闭返回）
- [x] 阶段 3 债务奇遇：已接入正式 UI.card + 修改真实 G.debt / G.aff，选择后会保存
- [x] 开发者按钮取消可直接执行阶段 3 奇遇
- [x] 建立 openworld-wip 分支
- [x] 低模角色样例：art/prototypes/openworld_v25/ 三角色 Cube/Cylinder 挤出 + Mirror 已完成并签收
- [x] 随机奇遇链草稿：docs/encounter_chain_draft.md + www/prototypes/encounter_chain/ 可玩原型（贩子 + 云游散修 + 药农求助 + 黑市灵石 + 催债使者 + 夜雨破庙）
- [x] 奇遇链路径断言：test/encounter_chain_verify.py（十四条路径债务/好感最终值）
- [x] 试炼场覆盖层：× / 点击遮罩 / Escape 均可关闭并清理监听
- [x] 即时原型 JS 加强：玩家坐标占位 + 普攻冷却方法
- [x] 即时原型再加强：WASD/方向键移动、敌人追击、接触伤害、近距普攻扣血、简易绘制（仍隔离）
- [x] 即时原型闪避：Shift 键触发面向方向短距冲刺，带冷却（仍隔离）
- [x] 即时原型技能弹道：Q 键发射面向方向简易灵弹（命中扣血+击退），冷却与绘制已加，仍完全隔离不接入正式链
- [x] 即时原型敌人弹道：敌人远距时发射简易弹道（命中扣玩家血），冷却与绘制已加，仍隔离

## 当前可玩
- CI 构建完成后，连点版本号即可试：
  - 试炼场（覆盖层即时遭遇战原型）
  - 阶段 3 债务奇遇（真实改债务和好感）
- 本地可直接打开 www/prototypes/encounter_chain/index.html 测试奇遇链选择（多路径切换，含夜雨破庙）
- `python3 -B test/encounter_chain_verify.py` 验证路径数值（十四条）
- `www/js/battle_realtime_prototype.js` 可在控制台调用 RealtimeBattle.start() 后配合 update/draw 测移动、打击、Shift 闪避与 Q 弹道（需宿主提供 canvas 循环）

## 仍待完成
- [ ] 低模正式接入精灵图集（需重新渲染管线）
- [ ] 即时战斗接入正式地图遭遇（目前仍是独立页 / 占位）
- [ ] Issue #5 修复（T4 点游走 NPC、T9 自动任务连续成功）
- [ ] 阶段 3 扩展成多条奇遇链 + 正式 NPC 关联（草稿已有 6 条）

## 下一步（继续自动推进）
推进 Issue #5（T4 点游走 NPC、T9 自动任务），或正式债务系统对接奇遇链，或低模接入图集评估。可把完整即时原型（含敌人弹道）同步到覆盖层试炼场做对比测试。

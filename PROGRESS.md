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
- [x] 步骤 6：方块人新增「主角女」（裙摆宽 42 = 剑修袍 1.6 倍、双侧长发束、发花、团扇）和「剑仙」（白袍高冠、白须、背负长剑、手持短剑，四人里最高），共 4 个；新增受击 `hurt` 姿势（上身后仰、双臂上扬、腿不动、首尾回正）。即时原型方块皮肤在受击闪白时播 hurt，可用 `boxPlayer` 选主角（预览页加下拉框）。`docs/openworld_upgrade.md` 新增「原型 vs rt27.js 对照」表（读代码对比，未做真人手感测试）及建议回流项。
  - 测试：`node test/lowpoly_box.js` 55/55（新增：四角色、单武器、裙摆宽度比、长发、剑仙最高、背剑前后遮挡、四角色受击后仰且腿不动、首尾回正）；`test/battle_rt_proto.js` 67/67（新增：方块皮肤受击播 hurt/回 idle、boxPlayer:nvzhu 生效）；battle_rt_proto_page 8/8；stage3_chain、validate22、encounter_chain_verify 14/14、sys33_unit、jsscan33 均无新失败。
  - 涉及文件：`www/js/lowpoly_box_chars.js`、`www/js/battle_realtime_prototype.js`、`www/prototypes/lowpoly_box/index.html`、`test/lowpoly_box.js`、`test/battle_rt_proto.js`、`docs/openworld_upgrade.md`、`PROGRESS.md`
- 下一步：① 修 `dev_entry_v25.js`（全套神装、试炼场取消→阶段3奇遇）和 `stage3_encounter_draft.js:94` 的 `window.Game`/`window.UI` 判断（真页面里为 undefined，按钮很可能静默无效），配页面冒烟测试；② 主人/奥拉夫真机试原型手感，决定对照表里三项是否开 PR 回流 `rt27.js`；③ 主人确认方块人风格是否继续。

### 2026-10-19 第三轮（UTC+8，openworld-wip）
- [x] 步骤 7：修开发者入口在真页面静默失效：`dev_entry_v25.js`（全套神装、试炼场取消→阶段3奇遇、toast）和 `stage3_encounter_draft.js:94` 改用 `typeof Game/UI` 取顶层 const，不再用恒为 undefined 的 `window.Game/window.UI`。修前真页面复现：神装按钮连确认框都不弹、阶段3卡片不出现；修后真页面确认「债主之家」卡片弹出、点「赖账」后债务 8888→10666、好感钳 0、已存档。
  - 测试：新增 `python3 -B test/dev_entry_v25_page.py` 7/7（真页面 headless Chrome：三按钮、神装 5 槽、阶段3卡片弹出+点完+存档、试炼场覆盖层 Escape 关闭、0 JS 错误）；`test/stage3_chain.js` 18/18（新增 3 条 vm 模拟顶层 const，旧代码下这 3 条失败）；battle_rt_proto 67、lowpoly_box 55、battle_rt_proto_page 8、validate22、encounter_chain_verify 14/14、sys33_unit、jsscan33 均无新失败。
  - 涉及文件：`www/js/dev_entry_v25.js`、`www/js/stage3_encounter_draft.js`、`test/dev_entry_v25_page.py`（新）、`test/stage3_chain.js`、`PROGRESS.md`
- [x] 步骤 8：阶段 3 小闭环「钱多多的赊账单」（`Stage3.runMerchantChain`，开发者入口新按钮「奇遇链」）：第 1 步选择 扛税(欠款+300、好感+60) / 举报(欠款−200、好感−40) / 不掺和(好感−5) → 真实 NPC 钱多多 `G.aff.merchant` 按 talk.js 同款 60/20 阈值成 亲近/一般/记仇 → 第 2 步「钱多多回访」按**当时**态度结算：亲近替你还 ≤500、一般无事、记仇卖你行踪欠款+10% 并挂 `flags.bounty`（下次试炼场取消→直接「讨债追兵」，接上第 1 条链）。复用 G.debt / G.aff / G.flags（新增 `s3m_step`/`s3m_choice`/`s3m_done`），选完即存档；只有开发者入口调用。
  - 测试：`node test/stage3_chain.js` 36/36（新增 18 条：三条路径、两步之间送礼改态度、接上讨债追兵、好感上限/债务下限、两步取消、旧存档、阈值、只被 dev_entry 调用）；`test/dev_entry_v25_page.py` 11/11（真页面：奇遇链按钮→举报→回访记仇 +10% 挂追兵并存档→试炼场取消弹「讨债追兵」）；其余 battle_rt_proto 67、lowpoly_box 55、battle_rt_proto_page 8、validate22、encounter_chain_verify 14/14、sys33_unit、jsscan33 均无新失败。
  - 涉及文件：`www/js/stage3_encounter_draft.js`、`www/js/dev_entry_v25.js`、`test/stage3_chain.js`、`test/dev_entry_v25_page.py`、`docs/openworld_upgrade.md`、`PROGRESS.md`
- 下一步：主人在开发者入口试玩「奇遇链」确认数值；若要进正式事件池，走 PR + 门禁，并把扛税/举报加入 ux23 自动任务 UNSAFE（重大选择须暂停）；真机试即时原型手感，决定回流 rt27 的三项。

### 2026-10-19 第四轮（UTC+8，openworld-wip）
- [x] 步骤 9：即时原型「技」按钮按**灵根 × 武器**变形（灵根 `G.lg`→`LINGGEN.el`、武器 `G.eq.weapon`→图标，均只读，缺失回退无灵根/空手）：火=焚天扇火（面前 35° 锥形 0.6×攻 + 灼烧 2s 共 0.3×攻，冷却 2.0s）、水/冰=缚水灵珠（0.7×攻 + 减速 50% 2.5s，1.8s）、金=庚金剑气（0.9×攻 贯穿所有敌人，1.6s）、木=青藤缠缚（0.5×攻 + 定身 1s，2.2s）、无/土/雷=灵弹。武器修正：剑 伤害×1.15 弹速×1.2、扇 范围×1.35、伞 冷却×0.75。多灵根默认主灵根（`el[0]`，如双灵根=木），E 键 /「换」按钮切换。顶栏显示技能名与冷却；状态有灼烧点/减速圈/定身圈。
  - 测试：`node test/battle_rt_proto.js` 93/93（新增 26 条，灵根表取自真实 data.js：读存档、5 种灵根×武器组合、缺表/缺武器回退、金贯穿两只、冷却、火锥只中前方+灼烧总量、水减速与恢复、木定身、三种武器修正、双灵根切换、单灵根不切、存档不变）；`test/battle_rt_proto_page.py` 12/12（真页面：天灵根+寒霜剑→庚金剑气·剑贯穿两只；双灵根+折扇→点「换」「技」→锥形火焰+灼烧）；其余均无新失败（lowpoly 55、stage3_chain 36、dev_entry_page 11、validate22、encounter_chain_verify 14/14、sys33_unit、jsscan33）。
  - 涉及文件：`www/js/battle_realtime_prototype.js`、`test/battle_rt_proto.js`、`test/battle_rt_proto_page.py`、`PROGRESS.md`
- [x] 步骤 10：阶段 3 小闭环 #3「记账童子的错账」（`Stage3.runLedgerChain`，开发者入口新按钮「查账链」），NPC 为现有的 仙官·记账童子 `xianguan`：第 1 步 陪他对账(好感+60) / 塞 300 灵石抹掉一笔(欠款−1500、好感+20，灵石不足不出现) / 告发(欠款−300、好感−40) → 第 2 步「天道查账」按**当时**态度（60/20）：亲近=复利改单利 欠款×0.8（贿赂也替你瞒下）；不亲近且贿赂过=露馅，补回实际抹掉额×1.1；一般=无事；记仇=误工费 +15%。复用 G.debt/G.stone/G.aff/G.flags（`s3x_step`/`s3x_choice`/`s3x_bribe`/`s3x_done`），与钱多多链互不干扰。顺手修：新按钮复制样式时 `cssText` 带空格导致替换失败、两个按钮叠在一起挡点击，已改为写死位置并加「按钮互不重叠」检查。
  - 测试：`node test/stage3_chain.js` 52/52（新增 16 条：四种结果、贿赂后刷好感被瞒下、灵石不足无贿赂项、欠款不足 1500 只补回实际额、两步取消、旧存档、不碰钱多多链、只被 dev_entry 调用）；`test/dev_entry_v25_page.py` 15/15（新增：按钮不重叠、真页面查账链 贿赂→露馅 +1650 并存档）；其余均无新失败。
  - 涉及文件：`www/js/stage3_encounter_draft.js`、`www/js/dev_entry_v25.js`、`test/stage3_chain.js`、`test/dev_entry_v25_page.py`、`docs/openworld_upgrade.md`、`PROGRESS.md`
- 下一步：主人试玩「奇遇链」「查账链」与灵根技能定数值；若要进正式事件池，走 PR + 门禁并把这些选项加入 ux23 自动任务 UNSAFE（本线不改 ux23）。

### 2026-10-19 第四轮（UTC+8，openworld-wip）
- [x] 步骤 11：债务系统强化 #1「欠得多了有追兵」——`Stage3.debtPressure(G)` 按当前欠款分 4 档债压：≤1000 小账 / 1001–5000 欠款 / 5001–20000 重债 / 20001 起天道通缉（前两条阈值与「债主之家」态度一致），身上挂着 `flags.bounty` 再加一档（封顶）。`Stage3.bountyEnemies(G)` 按档位出 1/2/3/4 个讨债鬼（`mon_collector` 精灵，方块皮肤为讨债鬼差），血量 ×1/1.15/1.3/1.45、移速 +6/档，出手冷却与站位错开，天道通缉档领头为「讨债鬼头子」。开发者入口新按钮「追兵战」把这些追兵喂进即时战原型，顶栏显示「追兵·重债」等档名；**只读**：不改存档、不发奖、不结算，stage3 文件只出数据、不直接调用即时战原型。即时战原型顺带支持敌人 `box` 字段（之前被映射丢掉）和 `opts.label` 顶栏标题（截 16 字）。
  - 测试：`node test/stage3_chain.js` 65/65（新增 13 条：四档阈值、档名、通缉加一档封顶、8 种异常存档回退、追兵数/血量/头子/精灵、冷却与站位互异、都在场内不贴脸、不改存档、只被 dev_entry 调用）；`node test/battle_rt_proto.js` 98/98（新增 5 条：讨债鬼原样进场保留 box、头子血量、顶栏标题、默认回退、标题截断）；`python3 -B test/dev_entry_v25_page.py` 18/18（新增：六个按钮不重叠且在屏内、真页面欠 8888 → 重债 3 个讨债鬼、关闭后存档 G 不变、欠 30000+通缉 → 天道通缉 4 个含头子）；battle_rt_proto_page 12/12、lowpoly_box、validate22 0 错、encounter_chain_verify 14/14、sys33_unit 0 失败、jsscan33 0 错，均无新失败。
  - 涉及文件：`www/js/stage3_encounter_draft.js`、`www/js/dev_entry_v25.js`、`www/js/battle_realtime_prototype.js`、`test/stage3_chain.js`、`test/battle_rt_proto.js`、`test/dev_entry_v25_page.py`、`docs/openworld_upgrade.md`、`PROGRESS.md`
- 下一步：追兵战打完按结果结算（胜：追兵退走、可撤掉 `flags.bounty`；败：欠款加一笔「误工费」），仍只走开发者入口；或债压档位接入突破难度预览（只读）。主人试玩定数值的事项照旧待办。

### 2026-10-19 第五轮（UTC+8，openworld-wip）
- [x] 步骤 12：债务系统强化 #2「追兵战按胜负结算」——`Stage3.settleBounty(G, out)`（out = 即时战原型返回值 + 开战时债压档位）：**胜**＝追兵退走，身上挂着 `flags.bounty` 的连同 `stage3_bountyDebt` 一起撤掉通缉，欠款不变（打跑讨债鬼不等于还钱）；**败**（被打倒或超时）＝欠款加误工费 max(100, 欠款 × 5%/8%/10%/12%，按开战时档位)，通缉照旧；**中途关掉覆盖层**＝不结算、不改存档。胜败次数记 `flags.s3b_win/s3b_lose`。开发者「追兵战」按钮打完即结算并存档，等覆盖层关掉后弹「追兵战结算」卡（胜负·档名、说明、债务前→后、通缉已撤销）。即时战原型结束时带结束原因 `reason`（cleared/dead/timeout/closed），覆盖层句柄新增 `closed` Promise。仍只走开发者入口，不发奖、不进正式事件池。
  - 测试：`node test/stage3_chain.js` 79/79（新增 14 条：胜撤通缉/欠款不变、没通缉只打退、三档费率与保底 100、超时文案、败通缉照旧、中途关闭不改存档、非法结果不崩、按开战档位、异常欠款回退、胜败累计、只被 dev_entry 调用）；`node test/battle_rt_proto.js` 106/106（新增 8 条：cleared/timeout/dead/closed 原因、重开清空、end 不带原因回退、覆盖层关闭句柄）；`python3 -B test/dev_entry_v25_page.py` 20/20（新增：真页面天道通缉打赢 → 覆盖层关后弹结算卡、撤通缉、欠款 30000 不变、已存档；重债打输 → +889 误工费并存档）；lowpoly_box、validate22 0 错、encounter_chain_verify 14/14 均无新失败、battle_rt_proto_page 12/12、sys33_unit 0 失败、jsscan33 0 错。
  - 涉及文件：`www/js/stage3_encounter_draft.js`、`www/js/dev_entry_v25.js`、`www/js/battle_realtime_prototype.js`、`test/stage3_chain.js`、`test/battle_rt_proto.js`、`test/dev_entry_v25_page.py`、`docs/openworld_upgrade.md`、`PROGRESS.md`
- 下一步：债压档位接入突破难度预览（只读，显示「欠得多突破更难」的预估），或追兵战按档位给敌人加前摇更快/弹道更多的差异；主人试玩定数值（奇遇链、查账链、灵根技能、误工费率）照旧待办。

### 2026-10-19 第六轮（UTC+8，openworld-wip）
- [x] 步骤 13：债务系统强化 #3「欠得多突破更难」（突破难度预览，**只读**）——`Stage3.breakthroughPreview(G, game)` 返回 `{tier, tierName, debt, bounty, base, penalty, estimate, source, applicable, ready, from, to, pills, note, readOnly}`。基础成功率由 `Stage3.breakBase` 原样复刻现行突破公式（`game.js` `Game._tryBreak`：`REALMS[境界].brk + 悟性×1.5% + 气运×0.5% + brkBonus + 技能树 brk + tmpBrk`，练气持有筑基丹 +30%、持有破境丹且 <95% 时 +15%「持有即生效」，封顶 97%），只读不调用正式流程、不吃丹、不清 tmpBrk。债压档位沿用 `Stage3.debtPressure`（挂通缉 +1 档封顶），预估惩罚 **小账 0 / 欠款 −3 / 重债 −8 / 天道通缉 −15 个百分点**，预估下限 5%。读不到基础（没 REALMS/Game、境界越界、悟性/气运非数字、公式抛错）回退默认 **60%** 并在 note 标注原因；渡劫期（走飞升天劫）和最高境界不给成功率预估。开发者入口新按钮「突破预估」（`bottom:420px`，与其余 6 个按钮不重叠）弹 `UI.card`：境界 → 下一境、债压档（欠款/通缉）、基础成功率、惩罚、预估、「只读预估，正式突破暂不扣」。正式突破成功率与流程**不变**（`game.js` 未改动，单测锁住原公式文本）。
  - 测试：`node test/stage3_chain.js` 94/94（新增 15 条：四档与惩罚 0/3/8/15、回退 60% 标注、文案、通缉 +1 档封顶、6 种异常存档回退、**vm 载入真实 data.js + game.js 对照 5 个存档（凡人/练气+筑基丹/筑基+破境丹/金丹+技能树+tmpBrk/化神）预览基础 = 正式「冲击瓶颈」卡片显示的成功率**、预估 = 基础 − 惩罚、丹药计入/境界名/ready、预览不改存档、渡劫/最高境界不预估、越界/缺字段/非数字/抛错回退、预览代码不调 tryBreak/save/take/give 且不给 G 赋值、game.js 公式未改、只被 dev_entry 调用）；`python3 -B test/dev_entry_v25_page.py` 25/25（新增：七个按钮不重叠且在屏内；真页面元婴圆满 欠 500/3000/8888/30000+通缉/3000+通缉 → 小账 52%/欠款 49%/重债 44%/天道通缉 37%/重债 44%，卡片关后 G 与存档字符串都不变；0 JS 错误）；`node test/battle_rt_proto.js` 106/106、`node test/lowpoly_box.js` 55/55、`python3 -B test/battle_rt_proto_page.py` 12/12、`node test/validate22.js` 0 错、`python3 -B test/encounter_chain_verify.py` 14/14、`python3 -B test/sys33_unit.py` 0 失败、`python3 -B test/jsscan33.py` 0 错，均无新失败。
  - 涉及文件：`www/js/stage3_encounter_draft.js`、`www/js/dev_entry_v25.js`、`test/stage3_chain.js`、`test/dev_entry_v25_page.py`、`docs/openworld_upgrade.md`、`PROGRESS.md`
- 下一步：追兵战按档位给敌人加差异（重债/通缉档前摇更快、远程弹道更多），仍只走开发者入口；突破惩罚是否真的接入正式 `_tryBreak`（需 PR + 门禁，且自动任务本就不替玩家突破）待主人试玩后定。主人试玩定数值（奇遇链、查账链、灵根技能、误工费率、突破惩罚 0/3/8/15）照旧待办。

### 2026-10-19 第七轮（UTC+8，openworld-wip）
- [x] 步骤 14：债务系统强化 #4「追兵战按档位分化敌人」——`Stage3.DEBT_TIERS` 每档加行为参数，`Stage3.bountyEnemies` 把它们写进每个讨债鬼的配置：`atkCdMul`（出手后冷却倍率）/ `windMul`（前摇倍率）/ `shotCount` + `shotSpread`（一次几发弹道、相邻夹角°，扇形散射）/ `tier`，另加额外移速 `spdAdd`。**小账、欠款 = 中性值（1 / 1 / 1 发 / 0° / +0，即旧行为）**；**重债 = 冷却 ×0.75、前摇 ×0.8、2 发 14°、移速 +4**（「快攻双发」）；**天道通缉 = 冷却 ×0.6、前摇 ×0.7、3 发 16°、移速 +8**（「疾攻三发」）。`debtPressure` 同时返回这些字段和 `trait`/`traitNote` 文案。即时战原型新增 `foeTrait(e)`：读这些字段，**缺字段 / 非数字 / ≤0 / 越界一律回退中性值**（倍率钳 0.3–2、最多 5 发、夹角 ≤30°）；冷却与前摇乘倍率，弹道按锁定方向对称散射（1 发时沿用原来的计算式，数值逐帧一致），预警进度按缩短后的前摇算、散射时每发各画一条红色预警线；新增 `state.foeVolleys/foeShots` 计数和每个敌人的 `attacks`。开发者「追兵战」顶栏标注「追兵·重债·快攻双发」「追兵·天道通缉·疾攻三发」（低档仍为「追兵·小账」），toast 与结算卡加「追兵特性：…」一行。仍只走开发者入口，不接正式战斗/存档逻辑；首次出手错开时间 `atkCd`、血量、结算规则都不变。
  - 测试：`node test/stage3_chain.js` 103/103（新增 9 条：四档参数单调、高两档严格更凶、低两档中性无特性名、特性文案、每个讨债鬼带本档参数、移速 70/76/86/96 且旧字段/首次出手/血量不变、通缉 +1 档带上一档参数、不改存档）；`node test/battle_rt_proto.js` 120/120（新增 14 条：**用 vm 载入上一提交 `c83f5cc` 的旧原型，缺字段 / 小账 / 欠款三组敌人 12s（720 帧）逐帧数值与新原型完全一致**；同一场天道通缉新原型起手 26 > 旧 18、挨打 −360 > −240；显式中性值与 7 种非法值 10s 逐帧 = 缺字段；参数钳制；单只站桩远程 10s 齐射 4/4/5/6 次、弹丸 4/4/10/18；近战 10s 前冲起手 4/4/5/6 次；通缉档 0.315s 出弹而小账仍在前摇；散射中间正对主角、两侧 ±16°、弹速伤害不变；出手后冷却 0.82s vs 1.4s；预警 3 条/16°、预警进度按缩短前摇算、draw 画 3 条预警线；顶栏 12 字不截断）；`python3 -B test/dev_entry_v25_page.py` 28/28（新增 3 条、改 3 条：真页面重债顶栏「追兵·重债·快攻双发」且 3 个讨债鬼参数 0.75/0.8/2 发/14°；**真页面 rAF 3.5s 站桩远射：天道通缉齐射 6 次 / 弹丸 18（每次 3 发），小账齐射 2 次 / 弹丸 2**；小账 1 个、无后缀、中性参数；胜/败结算卡含「追兵特性：疾攻三发 / 快攻双发」）；`node test/lowpoly_box.js` 55/55、`python3 -B test/battle_rt_proto_page.py` 12/12、`node test/validate22.js` 0 错、`python3 -B test/encounter_chain_verify.py` 14/14、`python3 -B test/sys33_unit.py` 0 失败、`python3 -B test/jsscan33.py` 0 错，均无新失败。
  - 涉及文件：`www/js/stage3_encounter_draft.js`、`www/js/battle_realtime_prototype.js`、`www/js/dev_entry_v25.js`、`test/stage3_chain.js`、`test/battle_rt_proto.js`、`test/dev_entry_v25_page.py`、`docs/openworld_upgrade.md`、`PROGRESS.md`
- 下一步：主人在开发者「追兵战」试打重债/天道通缉两档，定冷却/前摇/散射数值（散射 3 发 16° 在 600×520 小场地里是否太难躲）；可选给通缉档头子加一个专属招式（如前冲后接一圈环形弹）；突破惩罚是否接入正式 `_tryBreak` 仍待主人试玩后定。主人试玩定数值（奇遇链、查账链、灵根技能、误工费率、突破惩罚 0/3/8/15、追兵档位参数）照旧待办。

### 2026-10-19 第八轮（UTC+8，openworld-wip）
- [x] 步骤 15：债务系统强化 #5「天道通缉头子专属招式」——`Stage3.BOSS_RING = { ringShots: 8, ringWarn: 0.4, ringCd: 3, move: '回身环弹' }`，`Stage3.bountyEnemies` **只给天道通缉档的「讨债鬼头子」**（i=0 且 tier=3）加 `ringShots`（环形弹发数）/ `ringWarn`（收招预警秒）/ `ringCd`（两次环弹最短间隔秒）三个字段；通缉档普通讨债鬼与小账/欠款/重债所有讨债鬼**一个字段都不多**（与 84f4bd0 的 `bountyEnemies` 输出逐字段一致）。`debtPressure` 加 `bossMove`/`bossNote`（仅通缉档有）。即时战原型新增 `foeRing(e)` 读取并钳制：`ringShots` 非数字 / <3 → 0（不放 = 旧行为），合法取整钳 3–16；`ringWarn` 非法 → 0.4s，钳 0.15–1s；`ringCd` 非法 → 3s，钳 0–10s（0 = 每次前冲都放）。招式时序：**前冲收招**时若环弹冷却好了 → 进 `ring` 状态原地不动、画橙色预警圈（由外向内收紧 + 8 根方向刺）→ `ringWarn` 到点以自身为中心放一圈等角环形弹（第一发沿前冲方向，弹速 170、伤害 10×同比缩放，橙色弹丸）；预警期间出手冷却照常倒数（环弹是额外招式，不拖慢原节奏）；预警中被打倒不出弹。环弹单独计数 `state.foeRings/foeRingShots` 与每只敌人 `rings`，不混进齐射统计。开发者「追兵战」toast 加「头子会回身环弹」，结算卡加「头子：回身环弹：前冲收招后原地预警 0.4s，放一圈 8 发环形弹（每 3s 至多一次）」（顶栏 16 字上限已满，不加）。仍只走开发者入口，不接 `Game.fight`、不改存档逻辑、不改正式战斗。
  - 测试：`node test/stage3_chain.js` 111/111（新增 8 条：头子 8 发/0.4s/3s、其余讨债鬼与低三档不带环弹字段、头子其余参数同档一致、通缉 +1 档只有头子带、`bossMove/bossNote` 仅通缉档、不改存档、dev_entry 文案、**vm 载入 84f4bd0 的 stage3 对照 7 种存档：去掉头子 3 个环弹字段后 `bountyEnemies` 逐字段一致**）；`node test/battle_rt_proto.js` 135/135（新增 15 条：**用 vm 载入上一提交 `84f4bd0` 的旧原型，缺字段 / 小账 / 欠款 / 重债 / 通缉档普通讨债鬼 / 通缉全队去环弹 六组 12s（720 帧）逐帧一致（含齐射计数）**；通缉全队带头子 12s 环弹 2 次/16 发、挨打 −415 > 旧 −375、起手 25 = 旧 25；8 种非法 `ringShots` 10s 逐帧 = 缺字段；参数钳制；原型读到头子 8/0.4/3、其余全 0；第 1 次前冲收招即进预警（8 刺、半径 70 起收）、draw 画 1 圈 + 8 刺；0.4s 满才出弹、一圈 8 发、预警期间原地不动；8 发等角 45°、第一发沿前冲方向 90°、弹速 170 伤害 10；不混进齐射统计；近身 10s 起手 6 = 无环弹 6、环弹 3 次间隔 3.43/3.48s ≥ 3s；远射距离不触发且逐帧 = 无环弹；`ringCd=0` 每次收招都放；伤害随主角血同比 ×2；预警中被打倒不出弹）；`python3 -B test/dev_entry_v25_page.py` 31/31（新增 3 条、改 2 条：重债档 3 个讨债鬼 ringShots=0；通缉档只有头子 8/0.4/3；**真页面 rAF 2s 头子贴身前冲 4 次后放环弹 1 次 / 8 发，小账讨债鬼同样贴身前冲 3 次、环弹 0 次**；胜卡含「头子：回身环弹」、重债败卡不含「头子：」）；`node test/lowpoly_box.js` 55/55、`python3 -B test/battle_rt_proto_page.py` 12/12、`node test/validate22.js` 0 错、`python3 -B test/encounter_chain_verify.py` 14/14、`python3 -B test/sys33_unit.py` 0 失败、`python3 -B test/jsscan33.py` 0 错，均无新失败（浏览器测试逐个串行跑）。
  - 涉及文件：`www/js/stage3_encounter_draft.js`、`www/js/battle_realtime_prototype.js`、`www/js/dev_entry_v25.js`、`test/stage3_chain.js`、`test/battle_rt_proto.js`、`test/dev_entry_v25_page.py`、`docs/openworld_upgrade.md`、`PROGRESS.md`
- 下一步：主人在开发者「追兵战」（欠 >20000 或挂通缉后 >5000）试打天道通缉档，定头子环弹数值（8 发 / 预警 0.4s / 间隔 3s / 弹速 170 在 600×520 场地里是否好躲、和「疾攻三发」叠加是否太难）；之后可做的同样小步：追兵战胜利时头子掉一件「讨债令」凭证（只记 flags，不发正式奖励），或把追兵档位参数抽成一张可调表供试玩时改。突破惩罚是否接入正式 `_tryBreak` 仍待主人定。主人试玩定数值（奇遇链、查账链、灵根技能、误工费率、突破惩罚 0/3/8/15、追兵档位参数、头子环弹）照旧待办。

### 2026-10-19 第九轮（UTC+8，openworld-wip）
- [x] 步骤 16：债务系统强化 #6「头子掉讨债令」——追兵战**胜利**、开战档位为**天道通缉**、且本场被打倒的敌人里有「讨债鬼头子」时，`Stage3.settleBounty` 缴获一枚「讨债令」凭证：**只记 flags**——`s3b_token`（累计枚数）、`s3b_token_src`（最近一次来源「天道通缉·讨债鬼头子」）、`s3b_token_year`（最近一次获得的游戏年份 `G.year`，非数字则不记）；**不发正式物品/灵石，暂无用途**。返回值新增 `token`（本场是否得令）/ `tokens`（结算后共几枚），非法输入/中途关闭的返回也带 `token:false`。没有头子的胜利、重债及以下档、败（倒下/超时）、矛盾的 win+timeout、中途关闭、非法输入（含 `defeated` 非数组）一律不得令且不碰这三个 flag；旧存档没有 `s3b_token`（或值异常：字符串/负数/NaN/无穷）按 0 算，小数取整。「头子是否被打倒」以即时战原型的实际结果为准：原型结束时 `done` 结果新增只读字段 `defeated`（结束时 hp≤0 的敌人名单），不影响战斗逻辑。开发者「追兵战」结算卡在得令时加一行「缴获讨债令×1（共 N 枚）：只是凭证，暂无用途」。仍只走开发者入口，不进正式事件池、不接 `Game.fight`。
  - 设计取舍：按任务给的方案做，没改做「档位参数可调表」。读代码确认可行：胜利只在敌人全灭（`cleared`）时出现，天道通缉档必有头子，但为避免「从档位推断」我仍以原型实际返回的倒下名单判定（旧调用方不带 `defeated` = 不得令，向后兼容）。**已知问题**：打赢不还钱、欠款不降，天道通缉档可以反复刷令；讨债令目前无用途所以无害，若以后给它用途须先加上限或冷却（已写进代码注释）。
  - 测试：`node test/stage3_chain.js` 134/134（新增 23 条：得令 token/tokens/计数/来源/年份、得令不影响原胜利结算、累加到 2、已有 5 → 6、旧存档无 flags / 有 flags 无 s3b_token、头子没倒、重债档（即便名单混进头子名）、小账/欠款档、不带 defeated 的旧调用、败倒下/超时/win+timeout、中途关闭、6 种非法结果与无存档、6 种非法 defeated、7 种异常 s3b_token、5 种非数字年份、得令与不得令两份存档除三个 flag 外逐字段一致且灵石/物品/装备不变、返回值其余字段一致、结算代码不碰灵石/物品/装备/修为/`Game.*`、只有 stage3/dev_entry 提到 s3b_token、只有 dev_entry 引用讨债令接口、结算卡文案）；`node test/battle_rt_proto.js` 138/138（新增 3 条：结束结果带 `defeated`（全灭两只 / 超时空名单）；真实天道通缉追兵进原型全灭 → `defeated` 含头子 → settleBounty 记 1 枚；只打倒小弟超时 → 无头子不得令）；`python3 -B test/dev_entry_v25_page.py` 34/34（新增 3 条：**真页面天道通缉打赢 → 结算卡含「缴获讨债令×1（共 1 枚）：只是凭证，暂无用途」、`s3b_token`=1、来源/年份 = `G.year` 并已写进 localStorage 存档**；再打赢一次 →「共 2 枚」并存档；**重债打赢（没有头子）结算卡不含讨债令**、重债打输卡也不含、计数仍为 2）；`node test/lowpoly_box.js` 55/55、`python3 -B test/battle_rt_proto_page.py` 12/12、`node test/validate22.js` 0 错、`python3 -B test/encounter_chain_verify.py` 14/14、`python3 -B test/sys33_unit.py` 0 失败、`python3 -B test/jsscan33.py` 21 张图 0 错，均无新失败（浏览器测试逐个串行跑）。
  - 涉及文件：`www/js/stage3_encounter_draft.js`、`www/js/battle_realtime_prototype.js`（结束结果加 `defeated`）、`www/js/dev_entry_v25.js`、`test/stage3_chain.js`、`test/battle_rt_proto.js`、`test/dev_entry_v25_page.py`、`docs/openworld_upgrade.md`、`PROGRESS.md`
- 下一步：主人试打天道通缉档时顺便看结算卡讨债令文案；讨债令的用途（例如攒够 N 枚换一次「讨债司销案」减欠款 / 抵一次误工费）待主人定，定之前不加用途，加用途时须同时加获取上限或冷却防刷；也可做 PROGRESS 第八轮提到的另一候选「追兵档位参数抽成只读默认表 + 开发者覆盖」，方便试玩调数值。突破惩罚是否接入正式 `_tryBreak` 仍待主人定。主人试玩定数值（奇遇链、查账链、灵根技能、误工费率、突破惩罚 0/3/8/15、追兵档位参数、头子环弹）照旧待办。

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

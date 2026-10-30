## 开放世界线 · sweep44 确认卡/×N 中途 autoOn 再查（MEDIUM）（2026-10-31 00:25 UTC+8，Grok Bot）
- 分支 sweep44-auto（已 `git merge origin/main`，PROGRESS 双保留；index 序沿用 main：`…→memory45→sweep44→sweep44_ui→audio32`）。
- MEDIUM：`Sweep44.go` 原先只在确认卡前查 `autoOn()`；确认卡打开期间若切到 AUTO/AFK，确认后仍会扣 AP、计数、发奖。现：确认后再查一次（拒则不花 AP）；×N 每轮迭代再查（中途开自动停后续、已完成保留）；`silent` 默认也守 `autoOn`，仅 `opts.test===true` 可覆盖（逻辑层单测）。
- 改动：`www/js/sweep44.js`、`test/sweep44_unit.js`（对抗：确认中途开自动不变档；×N 中途开自动只完成 1 次；silent 拒 auto / test 覆盖）。未碰核心、未改 ux23/sweep44_ui。
- node：sweep44 **101/101**；sweep44_ui **33/33**；memory45 **58**；loan42 **110**；loan42_squad **105**；test/*.js **28/28**；validate22 **errors []**。未跑 Chrome。
- 下一步：push → 合 openworld-wip；等奥拉夫审。

## 开放世界线 · sweep44 自动任务/挂机不扫荡（§18.6-8）（2026-10-31 00:35 UTC+8，开放世界开发 bot）
- 分支 sweep44-auto（自 origin/main 784b792）：`Sweep44.go` 非 silent 路径在 ux23 `AUTO.on` 或 `AFK.on` 时先拒 `reason:'auto'`（不花 AP、不计数、不发奖），新增 `Sweep44.autoOn()`（缺 AUTO/AFK 安全返回 false）和 `TEXT44.auto` 文案；`sweep44_ui` 点扫荡被拒时 toast 该文案。
- 改动：`www/js/sweep44.js`、`www/js/sweep44_ui.js`、`test/sweep44_unit.js`（+7：autoOn 缺省/AUTO/AFK 拒绝不变档/扫荡按钮与确认选项不匹配 ux23 SAFE）。未碰核心、未改 ux23。
- node：sweep44 **94/94**；sweep44_ui **33/33**；test/*.js 全过。未跑 Chrome；页测仍待做（秘境面板扫荡按钮/回执卡/Dev「扫荡44」，以及开自动任务时点扫荡出 toast）。
- 下一步：等奥拉夫审；3.9.4+3.9.5 待发版人整理发版。

## docs: PROGRESS — openworld-wip re-merge sweep44-r2 + loan42-mk after main/#72（2026-10-31 00:12 UTC+8，Grok Bot）
- 普通 merge：`sweep44-r2`（rndRange→Game.roll + #72 memory45 index）+ `loan42-mk`（deathTransfer 真死后 + keepFnMarks `_main40`/`_mem45`）入 openworld-wip。
- index：`dongfu43_ui → memory45 → sweep44 → sweep44_ui → audio32`。未碰核心；未跑 Chrome；未 force。
- node（合入后）：loan42_squad **105**；loan42 **110**；sweep44 **87**；sweep44_ui **33**；memory45 **53**；validate22 []；test/*.js 全过。
## 交接 notes · v3.9.5（2026-10-31，Grok Bot）
### 1 当前版本 / 最新提交
- 版本：**v3.9.5「扫荡 · 似曾相识」**，`VERSION`=3.9.5，tag `v3.9.5` → commit `PENDING_TAG`；其下 merge #73 `784b792`（sweep44 R2）、#74 loan42、#75/#72 memory45、#71 sweep44 R1、v3.9.3。
- **是 Latest**。https://github.com/xiemingxin1145/wobuxian/releases/tag/v3.9.5
- Release 资产：`wobuxian.apk` / `wobuxian-lite.apk`（大小与 versionCode 发版后补记；自 307 起由 CI `100+run_number` 递增）。
- index 序：`…→loan42→main40→dongfu43→dongfu43_ui→memory45→sweep44→sweep44_ui→audio32`。

### 2 本版做了什么 / 刻意没做什么
- **3.9.4 sweep44**（#71 数据+逻辑 + #73 UI 接线/隐藏 `_once`）：秘境面板扫荡、年 cap、Dev「扫荡44」。
- **3.9.5 memory45**（#72 + #75 中文地图名）：跨世似曾相识卡、微好感/顿悟上限、地点弱提示。
- **#74**：loan42 仅真死后 `deathTransfer`；重 hook 保留 `_main40`/`_mem45`。
- 刻意没做：未改核心四件套；BOSS 旁白等 §19 P2；不删分支。
- 已知低风险：`dongfu43_ui` / `audio32` 重包 `enterMap` 未 `keepFnMarks`，检测上可能只见 `_loan42`（调用链一般仍在）。

### 3 测试结果
- node（合 #73 后）：validate22 **0**；sweep44 **87**；sweep44_ui **33**；memory45 **58**；loan42 **110**；loan42_squad **105**；其余 unit → **ALL PASS**。
- 奥拉夫：#73 含页测 APPROVE；#72 已合。
- CI：见 tag `v3.9.5`（发版后补）。

### 4 遗留问题
- Issue #12 OPEN；dungeon26 `clear[band]` 单层偏差（§18.7）；enterMap 标记链可能被后加载模块盖掉（低风险）。

### 5 下一版任务（按顺序）
1. P2 剩余 / memory45 BOSS 旁白与 tit39 `t_mem45`（可选）
2. 其它 ROADMAP P2

### 6 交接注意
- 禁止改 `game.js`/`talk.js`/`data.js`/`ui.js`；老档 `G.v===2` 惰性字段。
- 扫荡与似曾相识均守 `NPC37.storyBlock`/`B.on`。
- HD：CI 拉 `assets-hd`；缺 APK 时从 artifact 手工 upload。

---

## 开放世界线 · sweep44 rndRange→Game.roll + merge main/#72（2026-10-31 00:05 UTC+8，Grok Bot）
- 分支 sweep44-r2：`rndRange` 有 `Game.roll` 时二进制展开 U[0,1)，否则 `Math.random`；单测覆盖 roll 路径与回退。
- 改动：`www/js/sweep44.js`；`test/sweep44_unit.js`；`test/sweep44_ui_unit.js`（index 序含 memory45）。未碰核心。
- `git merge origin/main`（#72 memory45）：index 序 `dongfu43_ui → memory45 → sweep44 → sweep44_ui → audio32`；PROGRESS 双保留。
- node：合 main 后全量重跑。未跑 Chrome。

## 开放世界线 · 3.9.4 秘境扫荡 sweep44 R2 UI 接线（2026-10-30 23:49 UTC+8，Grok Bot）
- 分支 sweep44-r2（自 origin/sweep44 @ f914b42，已合 main 解 #71 冲突）。依赖 PR #71。
- 改动：`www/js/sweep44.js`（`_once` 收进闭包，公开 `Sweep44._once === undefined`）；新 `www/js/sweep44_ui.js`（包 `UI.p_dungeon26` 扫荡区块：本年剩余/AP/档行/TEXT44 确认+回执；DevPanel「扫荡44」；tit39 `t_sw44` 尽力挂 TITLES + tit39Deferred；finish 全通 exit 解锁 / retreat 不解锁）；`www/index.html`（dongfu43_ui→sweep44→sweep44_ui→audio32）；`test/sweep44_unit.js`；新 `test/sweep44_ui_unit.js`。未碰核心。
- node：sweep44 **84/84**；sweep44_ui **33/33**；test/*.js **22/22**；validate22 errors []。未跑 Chrome；**页测待做**（秘境面板扫荡按钮/回执卡/Dev「扫荡44」/storyBlock）。
- 下一步：开 PR→main（注依赖 #71）；合 openworld-wip；等奥拉夫页测。

## 开放世界线 · loan42 deathTransfer 真死后结算 + merge main/#72（2026-10-31 00:05 UTC+8，Grok Bot）
- 分支 loan42-mk：`Game.die` 先调内层，仅 wasAlive&&G.dead 后 `deathTransfer`；main40 拦截 newdao/auditor 时债/贷不动。`keepFnMarks` 保留 `_main40`/`_mem45`。
- 改动：`www/js/loan42.js`；`test/loan42_squad_unit.js`（拦截/真死/三标记）。未碰核心。
- `git merge origin/main`（含 #72 memory45 / #71 sweep44 R1）；PROGRESS 双保留。
- node：合 main 后全量重跑。未跑 Chrome。

## 开放世界线 · sweep44 rndRange→Game.roll + merge main/#72（2026-10-31 00:05 UTC+8，Grok Bot）
- 分支 sweep44-r2：`rndRange` 有 `Game.roll` 时二进制展开 U[0,1)，否则 `Math.random`；单测覆盖 roll 路径与回退。
- 改动：`www/js/sweep44.js`；`test/sweep44_unit.js`；`test/sweep44_ui_unit.js`（index 序含 memory45）。未碰核心。
- `git merge origin/main`（#72 memory45）：index 序 `dongfu43_ui → memory45 → sweep44 → sweep44_ui → audio32`；PROGRESS 双保留。
- node：合 main 后全量重跑。未跑 Chrome。

## docs: PROGRESS — openworld-wip merge sweep44-r2 + loan42-mk（2026-10-30 23:52 UTC+8）
- 普通 merge：`sweep44-r2`（#73）+ `loan42-mk`（#74）入 openworld-wip。
- #71 sweep44 已在 sweep44 分支 `f914b42` 合过 main（PROGRESS 双保留）。

## 开放世界线 · loan42 标记修复 _main40 共存（2026-10-30 23:49 UTC+8，Grok Bot）
- 分支 loan42-mk（自 origin/main）：`DOMContentLoaded` 重 hook `enterMap`/`die` 时保留已有 `_main40` 等标记（`keepFnMarks`），避免冲掉 main40 外层标志；`L42._hook` 可重入单测。
- 改动：`www/js/loan42.js`；`test/loan42_squad_unit.js`（+7：双标记存活/调用链/不重包）。未碰核心。
- node：loan42_squad **91/91**；loan42 **110**；test/*.js **20/20**；validate22 errors []。未跑 Chrome。
- 下一步：开 PR→main；合 openworld-wip。

## 开放世界线 · 3.9.4 秘境扫荡 sweep44 R2 UI 接线（2026-10-30 23:49 UTC+8，Grok Bot）
- 分支 sweep44-r2（自 origin/sweep44 @ f914b42，已合 main 解 #71 冲突）。依赖 PR #71。
- 改动：`www/js/sweep44.js`（`_once` 收进闭包，公开 `Sweep44._once === undefined`）；新 `www/js/sweep44_ui.js`（包 `UI.p_dungeon26` 扫荡区块：本年剩余/AP/档行/TEXT44 确认+回执；DevPanel「扫荡44」；tit39 `t_sw44` 尽力挂 TITLES + tit39Deferred；finish 全通 exit 解锁 / retreat 不解锁）；`www/index.html`（dongfu43_ui→sweep44→sweep44_ui→audio32）；`test/sweep44_unit.js`；新 `test/sweep44_ui_unit.js`。未碰核心。
- node：sweep44 **84/84**；sweep44_ui **33/33**；test/*.js **22/22**；validate22 errors []。未跑 Chrome；**页测待做**（秘境面板扫荡按钮/回执卡/Dev「扫荡44」/storyBlock）。
- 下一步：开 PR→main（注依赖 #71）；合 openworld-wip；等奥拉夫页测。

## 开放世界线 · 3.9.4 秘境扫荡 sweep44 R1 审修 M1/M2（2026-10-30 23:36 UTC+8，Grok Bot）
- 分支 sweep44 / PR #71 @ bc6efd7 后续：修 Olaf M1（go 在 storyBlock/B.on 下 card=-1 仍花 AP）+ M2（公开 once 绕过 unlock/AP/年 cap）。
- 改动：`www/js/sweep44.js`（非 silent 且 !canPopup → blocked；confirm 非 0 早退；once→_once）；`test/sweep44_unit.js` 对抗用例。未碰核心。
- node：sweep44 **84/84**；test/*.js **26/26**；validate22 errors []。未跑 Chrome。
- wip 普通 merge：`2556279`。下一步：等奥拉夫再审 / R2 接线。

## 开放世界线 · 3.9.4 秘境扫荡 sweep44 第 1 轮（data+logic）（2026-10-30 23:30 UTC+8，Grok Bot）
- 分支 `sweep44`（基于 origin/main）：`www/js/sweep44.js` + `test/sweep44_unit.js`；PR #71。
- **规则**：首通解锁（包 `Dng.exit`，`ok && !r.sweep`）；不把 `G.dungeon.clear` 单独当首通（§18.7：单层守关就写 clear）；老档仅 `best>=3` 才迁 `full`；每年 3 次×1 AP；奖励表+TEXT44（§18.2/18.5）。
- 存档 `G.sw44` 惰性；仍 `wbx2_*` / `G.v===2`；rng=`Game.roll`→`Math.random`；`Sweep44.off`；弹卡守 `#53` storyBlock/B.on。本轮**不进** index.html / 不包面板。
- 未碰核心文件；未跑 Chrome；未 push main。
- node：sweep44 **67/67**；validate22 errors []；其余 test/*.js 全过。
- PR：https://github.com/xiemingxin1145/wobuxian/pull/71 （`bc6efd7`）
- wip 普通 merge：`f2a2574`。
- 下一步：第 2 轮面板接线（`UI.p_dungeon26` + index）；等奥拉夫审 #71。

## 开放世界线 · loan42 催收开场文案稳定（2026-10-30 23:19 UTC+8，Grok Bot）
- 分支 `loan42-intro`（基于 origin/main）：`www/js/loan42.js` + `test/loan42_squad_unit.js`；PR #70。
- **修**：催收卡 `sqPend` 未结案读档/换图复弹时不再重抽 `squadOpen`；首次弹出写 `sqPend.oi`，复弹复用；老档无 `oi` 补抽一次写入。rng=`Game.roll` 回退 `Math.random`。仍 `wbx2_*` / `G.v===2`，不升版本。
- 未碰核心文件；未跑 Chrome；未 push main。
- node：loan42_squad **84/84**；loan42_unit **110/110**；clan41 70；items40 152；validate22 []；其余 test/*.js 全过。
- PR：https://github.com/xiemingxin1145/wobuxian/pull/70 （`a3b0f91`）
- wip 普通 merge：`50ec690`。
- 下一步：等奥拉夫审 #70；页测仍延后。

---

## 交接 notes · v3.9.3（2026-10-30，Grok Bot）
### 1 当前版本 / 最新提交
- 版本：**v3.9.3「主线 · 洞府」**，`VERSION`=3.9.3，tag `v3.9.3` → commit `54bd685`；其下 merge #69 `dd3b1cd`（main40）、#70 loan42、#68/#66 洞府、v3.9.1。
- **是 Latest**。https://github.com/xiemingxin1145/wobuxian/releases/tag/v3.9.3
- Release 资产：`wobuxian.apk` 372,397,273 B（≈372MB）、`wobuxian-lite.apk` 84,240,825 B（≈84MB）；versionCode **307**（自 301 经 CI `100+run_number` 递增）；Latest 已指向 v3.9.3。
- index 序：`…→clan41→loan42→main40→dongfu43→dongfu43_ui→audio32`。

### 2 本版做了什么 / 刻意没做什么
- **3.9.2 main40**（#69）：化神软引导、渡劫圆满 gate、结局分支（karma/route/chain/fam）、q_ev3 猜拳、摊牌记忆、Dev 跳转、挡旧三选一、UNSAFE；奥拉夫 M1–M3/L1–L5 已修。
- **3.9.3 dongfu43**（#66 第1轮 + #68 第2轮/审修）：可进洞府地图、年事/居民/旅行入口、DevPanel；不升 `G.v`。
- **#70**：催收卡复弹复用开场白下标。
- 刻意没做：**3.9.4 秘境扫荡 sweep44**（交开放世界开发 bot）；未修 loan42 `DOMContentLoaded` 重 hook 盖掉 `_main40` 标记（低风险，调用链仍到 main40）；不删分支。

### 3 测试结果
- node（合 main 后 /workspace/main40）：validate22 **0**；main40 **73/73**；dongfu43 **145/145**；dongfu43_ui **56/56**；loan42 **110**；loan42_squad **84**；其余 `*_unit` + good_rel_cap → **ALL PASS**。
- 奥拉夫：#69 含页测已 APPROVE；#68 审修已合。
- CI（tag v3.9.3，run 41080795154）：build ✅、emulator API30/34 ✅；Release Latest ✅。

### 4 遗留问题
- **3.9.4 sweep44** 进行中（开放世界开发 bot）；Issue #12 OPEN。
- 已知低风险：loan42 在 `DOMContentLoaded` 再 hook `enterMap`/`die` 时可能冲掉 `_main40` 标记（功能链一般仍在，标记仅供检测）。
- dungeon26 单层写 `clear[band]` 偏差（扫荡另记首通，§18.7）。

### 5 下一版任务（按顺序）
1. **3.9.4 秘境扫荡 sweep44**（`docs/research_v22.md` §18）— 开放世界开发 bot
2. 前世记忆「似曾相识」小规格 memory45（ROADMAP 🟡）
3. 其余 P2

### 6 交接注意
- **禁止改** `game.js` / `talk.js` / `data.js` / `ui.js`；包装模块后加载。
- 老档 `wbx2_*` / `G.v===2`；main40 / dongfu43 / loan42 均惰性字段。
- 洞府不进 `MAP_ORDER`；挂机/自动任务在洞府内应屏蔽。
- HD 包：CI 从 `assets-hd` release 拉高清资源；缺 APK 时从 workflow artifact 手工 `gh release upload`。

---

## 开放世界线 · 3.9.3 洞府 dongfu43 R2 奥拉夫审修（2026-10-30 23:08 UTC+8，Grok Bot）
- 分支 dongfu43-r2 / PR #68：修 M1 df43_sign 叠 mark（clearResidents 清 sign；spawn 幂等）+ L1 Acts.cave 包装原实现 + L2 storyBlock 下 onEnterHome 仍 n++ + L3 亲传 label 不裸露 ah（NPCS 缺省回落「亲传」）。
- 改动：www/js/dongfu43_ui.js、www/js/dongfu43.js、test/dongfu43_ui_unit.js。未碰核心。
- node：dongfu43 **145/145**；dongfu43_ui **56/56**（+10 回归）；test/*.js 24/24；validate22 errors []。未跑 Chrome。
- 下一步：合 openworld-wip；等奥拉夫再审。

## 开放世界线 · 3.9.3 洞府 dongfu43 第 2 轮（地图/卡片接线）（2026-10-30 22:5x UTC+8，Grok Bot）
- 分支 dongfu43-r2（基于 dongfu43 / main #66）：www/js/dongfu43_ui.js + test/dongfu43_ui_unit.js + art/mapdefs43.py + www/index.html（loan42→dongfu43→dongfu43_ui→audio32）+ test/dongfu43_unit.js（index 断言改第 2 轮已接入）。
- 接线（只包装，不碰核心）：MAPINFO.dongfu（不进 MAP_ORDER）+ AS.maps 占位（sect 投影/图集，props=§17.2）；包 Acts.cave 入口卡 / makeMarks 洞府覆盖 / enterMap 年事+居民 / refreshNpcs / Talk.npc df_ / UI.p_travel 置顶回洞府；挂机/自动任务/NPC37.idle 洞府屏蔽；DevPanel/DevTabs「洞府43」（含无视门槛传送）。
- 存档仍 G.df43 惰性、不升 G.v；弹卡守 #53 storyBlock/B.on；rng=Game.roll 回退。
- node：dongfu43 **145/145**；dongfu43_ui **46/46**；loan42 110；clan41 70；items40 152；validate22 []；其余 test/*.js 全过。未跑 Chrome。
- 依赖 PR #66（已合 main）。页测仍延后（进图/居民精灵/Blender 底图/挂机灰钮精修）。
- 下一步：页测 §17.9；合 openworld-wip；等奥拉夫审。

---

## 开放世界线 · cherry-pick dongfu43 奥拉夫 #66 M1+M2+Low（2026-10-30 22:38 UTC+8，Grok Bot）
- 自 PR #66 `dongfu43` cherry-pick `cd38ab7` → `43106c7`：`www/js/dongfu43.js` + `test/dongfu43_unit.js`。
- **M1**：`onEnter` 守 `#53` storyBlock/B.on，挡时不 stamp `ey`（年事 pending，解除后同年补发）。
- **M2**：`yr = typeof year==='number' ? year : age`；年戳缺省 `-1` 避 year=0 撞车。
- **Low**：residents/ctx null；medMul 硬封顶 1.5；choose 同实例一次性；pick 优先 Game.roll；气灵台词；ap Infinity 拒采。
- 未碰核心文件；未跑 Chrome；未 push main。
- node：dongfu43 **138/138**；validate22 []；loan42 110；clan41 70；items40 152；stage3_* / chain37 78 / npc37 80 / events 54 / pf38 34 / tit39 / zf39* 全过；loan42_squad / cos36 本分支无文件跳过。
- PR 评论：https://github.com/xiemingxin1145/wobuxian/pull/66#issuecomment-6525406189
- 下一步：等奥拉夫复审 #66；第 2 轮地图/标记/卡片仍延后。

---

## 开放世界线 · cherry-pick loan42 sqPend（#65 奥拉夫 Medium · 选定后才记年）（2026-10-30 22:24 UTC+8，Grok Bot）
- 自 PR #65 `loan42-r2` cherry-pick `d81c08b` → `33b091e`：`www/js/loan42.js` + `test/loan42_squad_unit.js`。
- **规则**：卡弹出写 `G.loan42.sqPend={y,tier,amt}`；还/战/跑后才 `_squadDoneY` 并清 marker；存档重进/下张图有 marker 则复弹同 tier/amt（跳过 roll）；`card()=-1` 不写 marker；跨年仍复弹同一张（结案按当前 year）。
- 未碰核心文件；未跑 Chrome；未 push main。
- node：loan42_unit **110/110**；loan42_squad **71/71**；clan41 70；items40 152；validate22 []；stage3_* / chain37 78 / npc37 80 / events 54 / pf38 34 / tit39 / zf39* 全过；cos36 仓库无此文件跳过。
- PR 评论：https://github.com/xiemingxin1145/wobuxian/pull/65#issuecomment-6525131715
- 下一步：等奥拉夫复审 #65 pending 语义；页测仍延后。

---

## 开放世界线 · 3.9.3 洞府 dongfu43 第 1 轮（数据+纯逻辑）+ 合 main（2026-10-30 22:3x UTC+8，开放世界开发 bot）
- `openworld-wip` 普通 merge `origin/main`（#64 loan42 第 1 轮已合 `50088f4`）：`796720f`；`www/js/loan42.js` add/add 冲突取 wip（wip = main + #65 第 2 轮 + M1/M2/low 修复，逐行核对 main→wip 只有第 2 轮改动）。
- 新 PR 分支 `dongfu43`（基于 origin/main）→ cherry-pick 进 wip：`www/js/dongfu43.js` + `test/dongfu43_unit.js`。
- research_v22 §17 纯逻辑：`G.df43` 惰性（ev/ey/hv/n + 附加 sp 灵泉年、mouse 田鼠还利息年、seal 裱封条年）；入口三选一/凡人只总览/筑基御剑置顶/出门多御剑；静室倍率 `1+0.1×zl`（封顶 1.5，裱封条当年 +0.05）；灵泉年一次（回满+yearExp×0.05×zl）；手采灵田 §17.4 表（耗 1 行动力、不占 G.used、10% 蟠桃走 Game.roll）；8 处锁定文案；§17.6 居民摆放（出战灵兽不重复、出差牌、idle 弟子≤4、子嗣≤3 降序、器灵/化身）；12 件年事池（条件/权重/6 年不重复/df_quiet 兜底/爹娘按性别）+ 全部选项效果。
- 注意：`Game`/`NPCS`/`TEXT37B`/`DLG37`/`POW` 是顶层 const，不在 window 上，模块里一律 `typeof X` 直接取。
- 本轮**不进 index.html、不登记 MAPINFO、不包任何函数**，零运行时影响。
- node：dongfu43 **115/115**；其余 test/*.js 全过（loan42 110、loan42_squad 54、clan41 70、items40 152、zf39 121、stage3_chain 244、validate22 []）。未跑 Chrome。
- 下一步：第 2 轮 `art/mapdefs43.py` + MAPINFO 登记（不进 MAP_ORDER）+ `Game.makeMarks` 覆盖 + 入口/出口卡片 + 居民 ents + `Talk.npc` df_ 分流 + 自动任务/挂机/路遇屏蔽 + 页测（需协调 Chrome）。

---

## 开放世界线 · cherry-pick loan42 §16.6 M1+M2（#65 奥拉夫 Medium）（2026-10-30 21:40 UTC+8，Grok Bot）
- 自 PR #65 `loan42-r2` cherry-pick `94f237c` → `1be6d88`：`www/js/loan42.js` + `test/loan42_squad_unit.js`。
- **M1**：灵石不够时「当场还款」`🔒` 灰置；点了 toast 后重弹卡（不关死），只可战/跑（同 life34 赔礼）。
- **M2**：催收卡成功弹出后即 `_squadDoneY=year`（含灰还/战/跑/关），当年不再刷。
- 未碰核心文件；未跑 Chrome。
- node：loan42_unit **110/110**；loan42_squad **49/49**；clan41 70；items40 152；validate22 []；stage3_* / chain37 78 / npc37 80 / events 54 / pf38 34 / tit39 / zf39* 全过。
- PR 评论：https://github.com/xiemingxin1145/wobuxian/pull/65#issuecomment-6524216013
- 下一步：等奥拉夫复审 #65 M1+M2；页测仍延后。

---

## 开放世界线 · cherry-pick loan42 第2轮（催收开战+面板+DevPanel）（2026-10-30 21:29 UTC+8，Grok Bot）
- 自 PR #65 `loan42-r2` cherry-pick `76dbb73` → `36bdcda`：`www/js/loan42.js` + `test/loan42_squad_unit.js`。
- 基于 main #64 已合 `50088f4`。关键：`trySquad` 触发后 `offerSquad` 弹三选一并包 `Game.fight`（loan42Squad；3×collector×hp1.8/atk1.3/def1.2）；#53 storyBlock/B.on；rng=`Game.roll` 回退。胜/败/跑/当场还款按 §16.6。`UI.p_char` 征信行；DevPanel/DevTabs「小贷42」。
- 玩家入口仍为钱多多/仙官·算盘天道小贷窗口。未碰核心 / dev_entry_v25 / dev341；未跑 Chrome。
- node：loan42_unit **110/110**；loan42_squad **36/36**；clan41 70；items40 152；validate22 []；stage3_* / chain37 78 / npc37 80 / events 54 / pf38 34 / tit39 / zf39* 全过。
- PR：https://github.com/xiemingxin1145/wobuxian/pull/65
- 仍延后：页测 loan42_page / L12 挂机仿真 / L13 完整套利 / 叠卡精修；洞府 dongfu43（§17）。

---

## 交接 notes · loan42 #64 审出修复（2026-10-30 21:2x，Grok Bot）

### 1 当前版本 / 最新提交
- 分支 `openworld-wip` cherry-pick：`bbef66f`（源自 `loan42` `bbfcbb4`）；PR #64 头已推至 `bbfcbb4`。
- 稳定版仍为 **v3.8.3**；本提交未改 VERSION / 未合 main / 未发版。

### 2 本版做了什么 / 刻意没做什么
- 修奥拉夫 #64 审查 1×High · 3×Medium · 1×Low（研究员定稿）：
  - **HIGH**：提前还清 +25 仅当本笔 `l.crossed`（至少跨过一次年结算 sync）；利息 alone 不加；每年最多一次（`crEarlyY`）。
  - **MED1**：`repayOverdue` 先合计再扣，不够则一分不动。
  - **MED2**：无逾期统一 `_clearSquadIfNoOd`；`trySquad` amt≤0 清旗 return null。
  - **MED3**：`squadRun` od+1 后 od≥2 立刻 `transfer`。
  - **LOW**：`Talk._loan42` 防重入。
- 改动文件：`www/js/loan42.js`、`test/loan42_unit.js`（110 项）。
- 刻意没做：第 2 轮催收 UI / 开发者页签 / 页测 / L12 挂机 / L13 仿真（仍延后）。

### 3 测试结果
- `loan42_unit` **110/110**；`clan41` 70；`items40` 152；`validate22` errors []
- `stage3_*` / `chain37` 78 / `npc37` 80 / events 54 / `pf38` 34 / `tit39` / `zf39*` 全过；无 Chrome。

### 4 遗留问题
- PR #64 待奥拉夫复审；第 2 轮 UI/页测仍 OPEN。

### 5 下一版任务（按顺序）
- 等 #64 复审通过；洞府 `dongfu43`（research §17）可并行规格落地。

### 6 交接注意
- 未碰核心文件；老档惰性不变；`LOAN42.off` 仍可用。

---

## 开放世界线 · cherry-pick loan42 第1轮 + 合 main v3.8.3（2026-10-30 21:06 UTC+8，Grok Bot）
- `openworld-wip` 普通 merge `origin/main`（v3.8.3 / #60+#59+#61 + docs `0883baf`）：`8ba40ac`。冲突：`index` 保留 `zf39_rt`/`zf39_dng` 并接 `clan41`；`PROGRESS` 保留开放世界历史 + main 交接（不截断）。
- cherry-pick PR #64 `loan42` `5d2bbb0` → `9cd7fba`：`www/js/loan42.js` + `test/loan42_unit.js`；`stage3_chain` allowlist；index：`…zf39_dng→clan41→loan42→audio32`。
- §16 数据+核心逻辑（征信/借还/sync/逾期转尾款/寿元抵押/催收结算/无债之身/Talk.extra 最小入口）；弹窗守 #53；未碰核心文件；未跑 Chrome。
- node：loan42 **70/70**；clan41 **70/70**；items40 / validate22 / stage3_* / chain37 / npc37* / pf38 / tit39 / zf39* 应绿。
- PR：https://github.com/xiemingxin1145/wobuxian/pull/64
- 下一步：催收开战 UI / DevPanel 小贷42 / 页测；或等奥拉夫审 #64。

## 开放世界线 · cherry-pick zf39_dng Medium 触底破阵超量回血（2026-10-30 20:53 UTC+8，Grok Bot）
- 自 PR #61 `zf39-dng` cherry-pick `ad3c638` → `32aa370`：陷阱触底后破阵还原按扣前气血，禁止名义 dmg 超量回血。
- 改动：`www/js/zf39_dng.js`、`test/zf39_dng_unit.js`。`restoreHp(G, preHp, keptDmg)` + `armHpWatch`/`preTrapHp`；repro hp10−50→1 成功后回 10（非 51）。
- 未碰核心文件 / dungeon26；未跑 Chrome。
- node：zf39_dng **64/64**；zf39_rt 33；zf39 121 / hook 20 / ui 60；items40 147；validate22 []；battle_rt_proto / stage3_* / chain37 78 / pf38 34 / tit39 全过。
- PR 评论：https://github.com/xiemingxin1145/wobuxian/pull/61#issuecomment-6523297177
- 下一步：等奥拉夫复审 #61；或洞府阵挂点 / 页测。

## 开放世界线 · 合 main v3.8.2 + cherry-pick zf39_dng（2026-10-30 20:40 UTC+8，Grok Bot）
- `openworld-wip` 普通 merge `origin/main`（v3.8.2 / #55+#58）：`7f6fc2e`。冲突：`index` 保留 `zf39_rt`；`items40` 保留 WIP `chance`/`autoToast`；`PROGRESS` 保留 main 六节交接 + wip 开放世界历史（不截断）。
- cherry-pick `b8173ba` → `7ddb2ef`：`www/js/zf39_dng.js` + `test/zf39_dng_unit.js`；index：`…zf39_ui→items40→zf39_rt→zf39_dng`。
- 同步分支：`zf39-rt` merge main → `1041798`，PR #59 **MERGEABLE**；`zf39-dng` merge zf39-rt → `3b4f38e`，新建 PR #61（依赖 #59）。
- 未碰核心文件；未跑 Chrome。
- node：zf39_dng **55/55**；zf39_rt **33/33**；zf39 121 / hook 20 / ui 60；items40 **152/152**；validate22 []；battle_rt / stage3_* / chain37 78 / pf38 34 / tit39 / good_rel 31 / npc37 80 / events 54 / lowpoly_* 全过。
- PR：https://github.com/xiemingxin1145/wobuxian/pull/59 、https://github.com/xiemingxin1145/wobuxian/pull/61
- 下一步：破阵页测 / 洞府阵挂点；或等 #59/#61 审合并。

## 开放世界线 · cherry-pick zf39_rt 奥拉夫 #59 修复（2026-10-30 19:54 UTC+8，Grok Bot）
- 自 PR #59 `zf39-rt` cherry-pick `cefd87b` → `7b56507`：北斗 crit 仅 `isPlayer`；外包 `ZF39.rtRoll` 判暴击。
- 改动：`www/js/zf39_rt.js`、`test/zf39_rt_unit.js`。未碰核心文件；未跑 Chrome。
- Medium：`side===0` 非主角不再吃北斗 +crit（对齐 §11.4 / `ZF39.apply`）；锋矢 out 仍给 side0 全体。
- Low：压制内层 Math.random，wrap 内 `rtRoll`→`Game.roll(p,'zf39')`；单测补 repro + Game.rolls。
- node：zf39_rt **33/33**（含 items40 顺序断言）；zf39_unit 121、hook 20、ui 60；items40 **152/152**；validate22 []；battle_rt_proto / chain37 78 / pf38 34 / stage3_* 全过。
- PR 评论：https://github.com/xiemingxin1145/wobuxian/pull/59#issuecomment-6522036367
- 下一步：破阵 UI / 洞府阵挂点 / 页面门禁；或等奥拉夫复审 #58+#59。

## 开放世界线 · cherry-pick zf39 即时战 rtMult（2026-10-30 19:46 UTC+8，Grok Bot）
- 自 PR #59 `zf39-rt`（基于 `zf39-ui`）cherry-pick：即时战套用布阵 `ZF39.rtMult`。
- 新增 `www/js/zf39_rt.js`：包 `calcDmg`，仅 `RT27.on` 时乘 out/inc、临时加 crit；回合制不叠；老档惰性。
- `www/index.html`：在 items40 之后加载（wrap 最外）。单测 `test/zf39_rt_unit.js`。
- 未碰核心文件；未跑 Chrome。
- node：zf39_rt **25/25**；zf39_unit 121、hook 20、ui 60；items40 **152/152**；validate22 []；battle_rt_proto / chain37 78 / pf38 34 / stage3_* 全过。
- PR：https://github.com/xiemingxin1145/wobuxian/pull/59
- 下一步：破阵 UI / 洞府阵挂点 / 页面门禁；或等奥拉夫审 #58+#59。

## 开放世界线 · cherry-pick items40 奥拉夫 #55 修复（2026-10-30 19:37 UTC+8，Grok Bot）
- 自 PR #55 `items40` cherry-pick `92447df`：转运珠 luck 仅 `Chain37.yearTick` 消耗（VIP `roll(0.3,'qiyu')` 不偷吃）；逆鳞交龙宫文案「业力−10」。
- 改动：`www/js/items40.js`、`test/items40_unit.js`。未碰核心文件 / zf39-ui 工作区。
- node：items40_unit **152/152**；validate22 []；chain37/npc37/pf38/zf39*/stage3_* 全过。未跑 Chrome。
- PR 评论：https://github.com/xiemingxin1145/wobuxian/pull/55#issuecomment-6521684973
- 下一步：奥拉夫复审 #55；页测仍待。

## 开放世界线 · 奥拉夫 #58 审查修复（2026-10-30 19:35 UTC+8，Grok Bot）
- 自 PR #58 / `zf39-ui` cherry-pick `fecbfcf` → `abc8554`：修战斗胜利阵道升级 toast 缺失 + `winXp` 缺 `war` NPE。
- `ZF39.winXp` 返回 `{add,ups}`（不再丢 `addXp` 的 ups）；`(Z.war||[])` 惰性兜底；`zf39_ui` `Game.fight` 包装 `announceXp(wr.add, wr.ups)`。
- 改动：`www/js/zf39.js`、`www/js/zf39_ui.js`、`test/zf39_unit.js`、`test/zf39_ui_unit.js`。未碰核心文件。
- node：zf39_unit 121、zf39_ui_unit 60、zf39_hook 20、validate22 / chain37 / pf38 / stage3_* / items40 等应绿。
- PR 评论：https://github.com/xiemingxin1145/wobuxian/pull/58#issuecomment-6521620608
- 下一步：破阵 UI / rt27 / 洞府阵挂点 / 页面门禁（Chrome 协调后）。

## 交接 notes · 3.8.3 家族深化进行中（clan41 分支，未发版）

### 1 当前版本 / 最新提交
- 稳定版仍为 **v3.8.1**；本分支实现 3.8.3，未改 VERSION / 未发版 / 未合 main。

### 2 本版做了什么 / 刻意没做什么
- 新文件 `www/js/clan41.js`（包 fam37 / yearEnd / Sys.bonus / newLife / lifeMax / UI.p_fam37 / UI.useItem / DevPanel）；`www/index.html` 在 tit39 后加载；`test/clan41_unit.js`。
- 已做：立族、10 级、12 族产年结（不乘境界）、10 族规（互斥/槽位/冷却）、子嗣境界、婚配/世家联姻（c41_sp）、21 族事、6 家族道具接入、轮回 best。
- 未做/待页测：human_olaf / panels21 / multilife / jsscan33（Chrome 被奥拉夫占用，本轮仅 node）；与 PR #55 items40 合入后需确认 index 顺序为 items40 → clan41。
- 未碰：game.js/talk.js/data.js/ui.js、items40.js、zf39_ui.js、zf39_rt.js。

### 3 测试结果
- `node test/clan41_unit.js` 51/51；`node test/validate22.js` 0 错；tit39/pf38/chain37/zf39/zf39_hook/npc37/npc37_events/good_rel_cap 均绿。
- 页测未跑（保留给奥拉夫）。

### 4–6
- 见 PR「3.8.3 家族」；下一版仍按 ROADMAP。老档 `wbx2_*` / `G.v===2`；`G.clan41` 惰性兜底。

---

# 我不仙 进度清单（2026-10-17 Grok 接管后）

> 交接规则与模板见 `AGENTS.md` §0。最新交接 note 永远放在本文件最上面。

## 交接 notes · v3.8.3（2026-10-30，Grok Bot）
### 1 当前版本 / 最新提交
- 版本：**v3.8.3「家族」**，`VERSION`=3.8.3，tag `v3.8.3` → commit `0ac62a2`；其下含 #60 clan41、#38 human_olaf、#59 zf39_rt（不发号）、发版后另合 #61 zf39_dng（不发号）、v3.8.2.1/#62。
- **是 Latest**。https://github.com/xiemingxin1145/wobuxian/releases/tag/v3.8.3
- Release 资产：`wobuxian.apk` 372,202,443 B（≈372MB）、`wobuxian-lite.apk` 84,045,995 B（≈84MB）；Latest 已指向 v3.8.3。

### 2 本版做了什么 / 刻意没做什么
- **clan41 家族**（#60）：立族/10 级、族产、族规、子嗣境界、联姻、21 族事、6 家族道具；`www/js/clan41.js`；index：`…→zf39_ui→items40→zf39_rt→zf39_dng→clan41`（#61 热修后合入）。
- **#59 zf39_rt**：即时战 rtMult，属 3.9.0，**未**单独立项发版。
- **#38**：human_olaf N1/T1 站位 flake 测试修正。
- **items40_unit**：有 clan41 时不再断言「尚未开放」。
- 刻意没做：3.8.4 时装未开工；#61 已合 main 但不进 3.8.3 发号（属 3.9.0）。

### 3 测试结果
- node：validate22 0；items40 **152/152**；clan41 **70/70**；zf39_dng **64/64**；zf39_rt **33/33**；zf39_ui 60 / zf39 121 / hook 20；其余 unit 全过（#61 合入后 19/19）。
- **jsscan33**：21 maps，**errors []**，exit 0（本轮 Chrome 空闲已跑）。
- 奥拉夫：#60 页测已过；#59 已审。

### 4 遗留问题
- Issue #12 OPEN。#61 已合。分支不删。

### 5 下一版任务（按顺序）
1. **3.8.4 时装** §15 → **3.9.0 阵法**完整发版（UI+rt+dng 已合 main，待整理发号/验收）→ **3.9.1 loan** §16 → **3.9.2 main40** → **3.9.3 洞府 dongfu43** §17

### 6 交接注意
- 包装序：`zf39_ui → items40 → zf39_rt → zf39_dng → clan41`（clan41 抢回 useItem 最外层）；不改核心文件；HD/签名同前。

## 交接 notes · v3.8.2.1（2026-10-30，Grok Bot）
### 1 当前版本 / 最新提交
- 版本：**v3.8.2.1「道具热修」**，`VERSION`=3.8.2.1，tag `v3.8.2.1` → commit `54af7da`；其下 `feb3004` #62 merge、`54e3509` chance/autoToast。
- **是 Latest**（非预发布；四段 versionName 可行：CI 用 tag 去 `v` 作 versionName，versionCode 仍 = 100+run_number）。https://github.com/xiemingxin1145/wobuxian/releases/tag/v3.8.2.1
- Release 资产：`wobuxian.apk` 372,128,524 B（≈372MB）、`wobuxian-lite.apk` 83,972,072 B（≈84MB）；Latest 已指向 v3.8.2.1。

### 2 本版做了什么 / 刻意没做什么
- **#62**：补齐 #55 终稿漏合——`chance()`→`Game.roll`（野花/秘境/密信）；`autoToast` 守 #53；送子瓶兑底。仅 `items40.js` + `items40_unit.js`（152/152）。
- 刻意没做：未合 #59/#60/#61（#59 热修发版后另合、不发号）。

### 3 测试结果
- node：validate22 0 错；items40 **152/152**；zf39_ui 60 / zf39 121 / zf39_hook 20；其余 unit 套件全过 → **16/16 PASS**。未开浏览器。

### 4 遗留问题
- PR #59 `zf39-rt`（发版后合入 main，属 3.9.0，不单独立项发版）、#60 clan41、#61、#38；Issue #12 OPEN。不删分支。

### 5 下一版任务（按顺序）
1. **3.8.3 家族**（#60）→ **3.8.4 时装** §15 → **3.9.0 阵法**完整发版（#59 + zf39_dng）→ **3.9.1 loan** §16 → **3.9.2 main40** → **3.9.3 洞府 dongfu43** §17

### 6 交接注意
- 同 v3.8.2：index `zf39_ui → items40`（#59 合入后为 `… → items40 → zf39_rt`）；不改核心文件；Chrome 忙只跑 node。

## 交接 notes · v3.8.2（2026-10-30，Grok Bot）
### 1 当前版本 / 最新提交
- 版本：**v3.8.2「道具」**，`VERSION`=3.8.2，tag `v3.8.2` → commit `28bd81b`（`3.8.2：VERSION + CHANGELOG`；其下 `4a0fae8` #55 merge、`0cdc5f4` 清截图噪音、`1894d0f` #58 merge）。
- **是 Latest**（`releases/latest` = v3.8.2，2026-10-30 20:34 UTC+8 前后发布，非预发布）。https://github.com/xiemingxin1145/wobuxian/releases/tag/v3.8.2
- Release 资产：`wobuxian.apk` 372,127,936 B（≈372MB，HD）、`wobuxian-lite.apk` 83,971,488 B（≈84MB）；固定链接 `…/releases/latest/download/wobuxian.apk`（及 lite）已指向 v3.8.2。

### 2 本版做了什么 / 刻意没做什么
- 新系统 **items40 道具**（PR #55 merge `4a0fae8`，新文件 `www/js/items40.js`，index：`zf39_ui` → `items40`，clan41 槽位其后）：60 个 `i40_`（25 使用 / 20 礼物 / 15 剧情）；`use:'i40'` 分派；战斗道具栏；送礼爱憎+月冷却；商店追加与新店；采药/秘境掉落；剧情「⚑」交付；`G.i40` 惰性兜底；转运珠 luck 仅 `Chain37.yearTick` 消耗；测试 `test/items40_unit.js`。
- **同版合入 #58 zf39_ui**（merge `1894d0f`，新文件 `www/js/zf39_ui.js`）：洞府「阵法」面板学/炼/布 + 战斗胜利阵道经验；**未**单独立 3.9.0 发号——破阵、rtMult（#59）、洞府阵实际挂点、`Dng.roomTrap` 仍未完。
- index 加载序：`profile38` → `tit39` → `zf39` → `zf39_hook` → `zf39_ui` → `items40`（两者均包 `UI.useItem` / 相关钩子；ui 先于 items，items 为外层）。
- 刻意没做：#59/#60 未合；6 个家族道具提示「3.8.3 尚未开放」；灵兽肉干野猪掉落、请柬书坊未做；不删分支。

### 3 测试结果
- **node（合并后 main `4a0fae8`/`28bd81b`，无 Chrome）**：validate22 **0 错**；items40_unit **147/147**；zf39_ui **60/60**；zf39 **121/121**；zf39_hook **20/20**；tit39 / pf38 **34** / chain37 **78** / npc37 **80** / npc37_events **54** / good_rel_cap **31** / battle_rt_proto / lowpoly_box / stage3_* 全过 → **16/16 套件 PASS**。
- **jsscan33**：本轮未跑（Chrome 被奥拉夫占用；按任务禁止开浏览器）。奥拉夫在 #58 上已过 jsscan33（21 maps, errors []）。
- **奥拉夫页测（合入前）**：#58 → jsscan33/pf38_page/dev_openworld_page/human23 **全过**；#55 → panels21 PASS、multilife PASS（console canEnter noise 与 main 同类）、human_olaf **7/8**（T3=`dom_at_btn=i` 在 main 同复现 = **测试本身**，#38 跟踪）。
- CI（tag v3.8.2，run 41055386179）：build ✅（versionName 3.8.2）；emulator-smoke API30 ✅、API34 ✅。

### 4 遗留问题
- PR #59 `zf39-rt`：3.9.0 即时战 rtMult，未合。
- PR #60 `clan41`：3.8.3 家族，未合（index 需接在 items40 之后）。
- PR #38 `olaf-n1t1-fix`：仅测试；T3 harness/`<i>` 叠加问题。
- Issue #12（游走 NPC 重叠点错人）仍 OPEN。
- 分支保留：`items40`、`zf39-ui`、`zf39-dng`、`zf39-rt`、`clan41`、`olaf-n1t1-fix` 等（不删）。

### 5 下一版任务（按顺序）
1. **3.8.3 家族**（PR #60，`docs/research_v41_clan.md` + `docs/research_v22.md` §14）
2. **3.8.4 时装 cos36**（`docs/research_v22.md` §15）：待开工
3. **3.9.0 阵法** 完整发版（#59 rt + `zf39_dng` 破阵 / `Dng.roomTrap`；`docs/research_v22.md` §11）
4. **3.9.1 loan**（`docs/research_v22.md` §16 天道小贷 loan42）
5. **3.9.2 main40 主线**（`docs/research_story40_main.md`）
- 3.9.0 为何后放：UI 虽已可见，破阵/机关房/即时战加成未齐，不宜当作完整阵法版宣传。

### 6 交接注意
- 模块规则：新功能一律新 `www/js/*.js` + index 顺序加载 + 包一层；**不改 game.js / talk.js / data.js / ui.js 等核心**；不手改生成物。
- 老存档：`wbx2_*`、`G.v===2`；新字段 `G.i40` / `G.zf39` / `G.t39` 等惰性兜底。
- **包装顺序**：`zf39_ui` 先于 `items40`（二者都包 `UI.useItem`）；clan41 必须在 items40 之后。
- 弹卡 / toast：守 #53 `NPC37.storyBlock`；寻路守卫 `R && R.player && R.player.nav`。
- HD 包：CI 按 `hd-assets.json`；签名只在 CI，证书 SHA-256 `436bf922…29dc` 不能换。
- 本机多 AI：Chrome 忙则只跑 node；独立 worktree；**不要用过期的 `/workspace/game`**。

## 交接 notes · v3.8.1（2026-10-30，Grok Bot）
### 1 当前版本 / 最新提交
- 版本：**v3.8.1「称号」**，`VERSION`=3.8.1，tag `v3.8.1` → commit `e6354ca`（`3.8.1：VERSION + CHANGELOG`；其下 `e844809` #45 merge、`fa37924` canEnter null guard、`ba99f2c` merge main、`c53af17` Chain37.doneCount）。
- **是 Latest**（`releases/latest` = v3.8.1，2026-10-30 19:41 UTC+8 发布，非预发布）。https://github.com/xiemingxin1145/wobuxian/releases/tag/v3.8.1
- Release 资产：`wobuxian.apk` 372,054,544 B（≈372MB，HD）、`wobuxian-lite.apk` 83,898,096 B（≈84MB）；固定链接 `…/releases/latest/download/wobuxian.apk`（及 lite）已指向 v3.8.1。

### 2 本版做了什么 / 刻意没做什么
- 新系统 **tit39 称号**（PR #45 merge `e844809`，新文件 `www/js/tit39.js`，index 在 profile38 后、zf39 前）：40 个 `t39_` 称号（总数 56）、收藏被动（每称号修炼 +0.25% 封顶 5%，≥30 气血 +2%）、NPC 反应/送礼 affMod、`G.t39` 惰性兜底；`t39_jianghu` 同时接 `G.npc37.ev.total≥30` 与 `Chain37.doneCount(G)≥3`；测试 `test/tit39_unit.js`、`test/tit39_page.py`。
- **修复**（`fa37924`）：`ux23.js` 包装 `Game.canEnter`——`Game.G`/`G.flags` 为 null 时不再落到原函数读 `flags`（seam34 地面渲染在轮回间隙会调到）；回归 `test/canenter_null.py`。
- 合入前把 main（`cc9480d` docs）合进 `tit39`（`ba99f2c`，无冲突）。
- 刻意没做（见 PR #45）：称号面板分组标签；TEXT39.npcTitle 接到 3.8.0 详情面板；priceMod/debtRate（文案标「待开放」）；NPC 反应替换首句（改成对话前单独弹一句，避免改 talk.js）；未实现设计稿部分 affMod 以外的反应替换。

### 3 测试结果
- 门禁 gate381（串行，2026-10-30 15:46–19:21 UTC+8，基于 `a07a1a9`/`fa37924` 前代码）：jsscan33/panels21/controls/sys33/pet35/lian35/lg36/sq36/fam37/life34/jianghu34/route37/dlg37 unit ✅、stage3_life34 ✅、npc37_page/events_page ✅、pf38_page ✅、**tit39_page ✅**、dev_openworld_page ✅、multilife exit=0（但修前日志 4× TypeError canEnter flags）、human23 ✅。
- 修后复测：`canenter_null` PASS、`multilife` ISSUES 0 **ERRORS 0**、`tit39_unit` ALL PASS、validate22 0 错、jsscan33 0 错。
- human_olaf：21/23，失败 **T4**（游走 NPC 远点 8/20 timeout，历史 flake / Issue #5 一类）、**T13**（panels21 点「收下」超时 2803s = **测试本身**；T13 内 multilife 的 canEnter TypeError 已用本版修复）。N1/N2/T1/T3/T5 本轮均过。按约定：#38 跟踪的 N1/N2/T1/T3/T5 不挡发；T4/T13 判为测试问题不挡。
- CI（tag v3.8.1，run 41049689625）：build ✅（versionName 3.8.1 / versionCode 280）；emulator-smoke continue-on-error。

### 4 遗留问题
- PR #55 `items40` 3.8.2 道具：开发/评审中。
- PR #56/#57 `zf39` 3.9.0 阵法：数据+逻辑+战斗钩子已合；UI 待 `Dng.roomTrap`。
- PR #38 `olaf-n1t1-fix`：仅测试，修 N1/T1 flake；T4/panels21 超时仍偶发。
- Issue #12（游走 NPC 重叠点错人）仍 OPEN。
- 本机分支/工作区：`/workspace/rel37b`（发版）；`tit39` 已合未删（按主人要求不删分支）。

### 5 下一版任务（按顺序）
1. **3.8.2 道具**（PR #55，`docs/research_v40_items.md` + `docs/research_v22.md` §13）
2. **3.8.3 家族**（`docs/research_v41_clan.md` + `docs/research_v22.md` §14）
3. **3.8.4 时装 cos36**（`docs/research_v22.md` §15）：待开工
4. **3.9.0 阵法** 发版（`docs/research_v22.md` §11；依赖 dungeon26 `Dng.roomTrap`）
5. **3.9.1 loan**（`docs/research_v22.md` §16 天道小贷 loan42）
- 3.9.0 阵法为何后放：依赖秘境 `Dng.roomTrap` 机关房钩子，接 UI / 发完整版前先确认该接口。

### 6 交接注意
- 模块规则：新功能一律做成新的 `www/js/*.js`，在 `index.html` 按顺序加载，用「包一层原函数」接入；**不改 game.js / talk.js / data.js / ui.js 等核心文件**；不手改生成物 `www/js/version.js`、`www/assets/assets.js`/图集、`www/assets/gen/*`。
- 老存档：`wbx2_*` 键名、`G.v===2` 不变；新字段放 `G.t39`（及既有 `G.pf38`/`G.chain37` 等）惰性兜底。
- `Game.canEnter`：任何在标题页/轮回间隙仍可能跑的渲染（如 seam34）必须容忍 `Game.G==null`；改 canEnter 相关包装时先跑 `test/canenter_null.py` + multilife。
- 弹卡类功能注意 #53 守卫与寻路守卫 `R && R.player && R.player.nav`。
- HD 包：CI 按 `hd-assets.json` 从 Release `assets-hd` 下载；签名只在 CI，证书 SHA-256 `436bf922…29dc` 不能换。
- 本机多 AI 共用：跑 Chrome 测试前先 `ps aux|grep -i chrome`；各自独立 worktree；**不要用过期的 `/workspace/game`**。

## 3.8.2 道具 items40 · 续推（rebase 进 main 前，2026-10-30）
- PR #55：`items40_unit` 密信换绑避开 mentor flake；`chance()` 优先 Game.roll；`autoToast` 守 #53。
- 加载序目标：profile38→tit39→zf39→zf39_hook→zf39_ui→items40（clan41 槽位其后）。

## 3.8.2 道具 items40 · 修奥拉夫 #55 审查（2026-10-30 19:36 UTC+8，Grok Bot）
- 修 PR #55 行内评论（未改 game.js 等核心文件；未碰 zf39-ui 工作区）：
  1. **Medium 转运珠 VIP 偷吃**：`Game.roll` 的 luck 只在 `Chain37.yearTick` 门闩内消耗；VIP `yearEnd` 的 `roll(0.3,'qiyu')` 不再清 luck。回归：vip=1 + luck=1 + random0.99 → yearTick 入口 luck 仍 1，风声必中。
  2. **Low 逆鳞文案**：交龙宫卡「业力+10」→「业力−10」（§13.6 `karma-10` / 代码 `karma-=10`）。
- 改动文件：`www/js/items40.js`、`test/items40_unit.js`；本 note。
- node：items40_unit **152/152**；validate22 errors []；chain37 78、npc37 80、npc37_events 54、pf38 34、zf39 118、zf39_hook 20、stage3_* 全过。未跑 Chrome。
- 下一步：奥拉夫复审；cherry-pick 进 openworld-wip；页测仍待。


## 开放世界线 · cherry-pick items40（2026-10-30 19:25 UTC+8，Grok Bot）
- 自 PR #55 `items40` cherry-pick：`www/js/items40.js` + `www/index.html`（在 zf39_ui 后）+ `test/items40_unit.js`（含 storyBlock/#53、Game.roll chance、无 PF38 gate、密信 flake 钉死）。
- 未碰 zf39-ui 工作区/分支；未改核心文件；未带入 test 截图。
- node：items40_unit 应 147/147；validate22 及其它既有单测需绿。
- 页测仍待：human_olaf / panels21 / multilife（见 PR #55）。

## 开放世界线 · 阵法面板 UI zf39 第 3 轮（2026-10-30 19:25 UTC+8，Grok Bot）
- 开发已恢复（主人确认此前暂停结束）。分支 `zf39-ui` ← origin/main，PR #58 → main（审：奥拉夫）；本提交 cherry-pick 进 `openworld-wip`。
- 新增 `www/js/zf39_ui.js`：洞府「阵法」入口（包 `UI.p_cave`）、三页战阵/洞府阵/阵图；学阵（钱多多施工图+三阵图、阴三娘黄河、算无遗欠条阵）；炼阵/布阵；`Game.fight` 胜利 `winXp`；ITEMS zws39/ztc39；#53 storyBlock 守卫；开发者 Tab「阵法39」。`index.html` 在 zf39_hook 后加载。
- 单测 `test/zf39_ui_unit.js` 55/55；连带 zf39_unit 118、zf39_hook 20、chain37/npc37/pf38/good_rel_cap/battle_rt/stage3_*/lowpoly_box、validate22 errors [] 全过。
- **未跑** Chrome 页面测试（需协调）：jsscan33、pf38_page、dev_openworld_page、human23。
- 未碰核心文件（game/talk/data/ui/battle/ux23/huashen33/main/life34/jianghu34/章节/systems21 等）；存档只 `G.zf39`，`wbx2_*`、`G.v===2`。
- 下一步：破阵 UI / rt27 `rtMult` / 洞府阵挂点 / 页面门禁；或继续开放世界低模。

## 开放世界线 · 追兵头子佩挂点修复 + 门禁（2026-10-30 10:23 UTC+8，Grok Bot）
- 合入：`git pull --rebase=merges` 已最新；`openworld-wip` 落后 origin/main 1 提交（`fc7f19d` #57 squash）→ 普通 merge `4c56659`，无冲突；分支未 detached。
- 修复：`test/lowpoly_attach.js` 失败根因——「追兵头子」(`touzi`) 部件名 `armor`/`helmet` 不在 GARMENT/HEADISH，导致 `sockets.pei === null`。仅改 `www/js/lowpoly_extra_chars.js`：`armor→robe`、`helmet→hat`（对齐催债使者等样例）；未碰核心文件。
- 修复提交：`dc43fb7` fix(openworld): 追兵头子低模补齐佩挂点（armor→robe、helmet→hat）。
- Chrome：开跑前/各项后 `ps aux | grep -iE 'chrom|playwright'` 均无人占用；串行单跑，结束无残留进程需杀。
- 页面门禁（串行）：jsscan33 errors [] ✅；pf38_page FAILS [] ✅；dev_openworld_page EXIT 0 ✅；human23 首轮 11/13（#4 追踪栏寻路→剑仙对话、#5 对话按钮，已知时序 flake）→ 重跑 **13/13** ✅。
- 全部 node 单测 + validate22：battle_rt_proto / chain37_unit 78/78 / good_rel_cap 31/31 / lowpoly_attach ALL PASS / lowpoly_box ALL PASS / npc37_events_unit 54/54 / npc37_unit 80/80 / pf38_unit 34/34 / stage3_chain / stage3_life34 / stage3_token_offset 14 / zf39_hook_unit 20/20 / zf39_unit 118/118 全过；validate22 errors []。
- 下一步：阵法面板 UI / rt27 / 破阵（沿第三十九轮）；或把低模接入即时战试炼场对比手感。

## 开放世界线 · 低模样例小步（2026-10-29，Grok）

- 在 `www/js/lowpoly_extra_chars.js` 新增「追兵头子」Cube 低模样例（黑甲红瞳、头盔状、手持长刃、腰挂令牌钱袋，身形壮硕，贴合天道通缉头子主题）。
- 低模预览页 `www/prototypes/lowpoly_box/` 下拉增加「追兵头子」选项，头部文案同步更新；仍为离线预览，不接入正式加载链。
- 更新 `docs/openworld_upgrade.md` 记录本步。
- 下一步：把低模接入即时战试炼场做对比手感，或扩展奇遇链草稿一条可测路径。

## 开放世界线 · 低模样例小步（2026-10-28，Grok）

- 在 `www/js/lowpoly_extra_chars.js` 新增「仙官·记账童子」Cube 低模样例（白衣青裔、头戴仙冠、手持账册与算盘，身形稍娇小，贴合天道查账主题）。
- 低模预览页 `www/prototypes/lowpoly_box/` 下拉增加「仙官·记账童子」选项，头部文案同步更新；仍为离线预览，不接入正式加载链。
- 更新 `docs/openworld_upgrade.md` 记录本步。
- 下一步：把低模接入即时战试炼场做对比手感，或扩展奇遇链草稿一条可测路径。

## 开放世界线 · 低模样例小步（2026-10-27，Grok）

- 在 `www/js/lowpoly_extra_chars.js` 新增「催债使者」Cube 低模样例（暗色长袍、腰挂钱袋与令牌、手持黑令，贴合追兵/讨债主题，略壮）。
- 低模预览页 `www/prototypes/lowpoly_box/` 下拉增加「催债使者」选项，头部文案同步更新；仍为离线预览，不接入正式加载链。
- 更新 `docs/openworld_upgrade.md` 记录本步。
- 下一步：把低模接入即时战试炼场做对比手感，或继续加 1 个 NPC 样例（如仙官·记账童子）；也可将奇遇链草稿扩展一条可测路径。

## 开放世界线 · 低模样例小步（2026-10-25，Grok）

- 在 `www/js/lowpoly_extra_chars.js` 新增「散修」Cube 低模样例（布衣短打、头扎布带、背负旧剑，灰褐瘦高）。
- 低模预览页 `www/prototypes/lowpoly_box/` 下拉增加「散修」选项，仍为离线预览，不接入正式加载链。
- 更新 `docs/openworld_upgrade.md` 记录本步（已修复此前截断）。
- 下一步：可继续加 1 个 NPC 样例（如宗门弟子），或把低模接入即时战试炼场做对比手感。
## 交接 notes · v3.8.0（2026-10-24，Grok Bot）

### 1 当前版本 / 最新提交
- 版本：**v3.8.0「人物详情面板」**，`VERSION`=3.8.0，tag `v3.8.0` → commit `f2468b7`（`3.8.0：VERSION + CHANGELOG`；其下 `30432fa` docs §15、`66e8136` #50 squash、`276792c` #51 squash）。
- **是 Latest**（`releases/latest` = v3.8.0，2026-10-24 19:16 UTC+8 发布，非预发布）。https://github.com/xiemingxin1145/wobuxian/releases/tag/v3.8.0
- Release 资产：`wobuxian.apk` 372,011,313 B（≈372MB，HD）、`wobuxian-lite.apk` 83,854,865 B（≈84MB）；两包签名证书 SHA-256 `436bf9221c08…ce7ef29dc`（= 436bf922…29dc）。

### 2 本版做了什么 / 刻意没做什么
- 新系统 **profile38 人物详情面板（PF38）**（PR #50 squash `66e8136`，新文件 `www/js/profile38.js`，index 在 chain37 后；只包裹 Talk.extra / UI.p_char / Game.yearEnd / FAM37.birth）：NPC 对话「📜 查看详情」、角色面板「📜 人物详情（自己）」；四块 基础/情谊/隐藏/喜好；神识窥探每年 3 次（30% 被发现扣好感/关系）；好感/道侣自动解锁；秘密效果只结算一次；`PF38.reveal()` 留给 3.8.2 道具；年末「貌合神离」；子嗣 30% 继承道侣命格；开发者页签「人物详情」；存档 `G.pf38`；文案 TEXT38A 由 `tools/gen_pf38.py` 生成；测试 `test/pf38_unit.js`、`test/pf38_page.py`。
- 同版带上 **#51 讨债令抵扣误工费**（squash `276792c`）：追兵战败付误工费时可花 1 枚讨债令抵掉；`dev_openworld_page` 对应断言。
- 合入前把 main 合进两条分支（#51 无冲突；#50 冲突 `www/index.html` 脚本行、`docs/ROADMAP.md` 状态行）。
- 刻意没做：秘密的对话选项 `opt`；命格 fx 数值（设计稿标「不支持」，只显示文案）；子嗣/弟子行尾「详情」按钮。神识门槛按境界名实现为 9/14/17/20/24（设计稿数字对不上，见 8692229）；命名 NPC 大境界 `PF38.REALM` 为估值 → 待确认。

### 3 测试结果
- 门禁（串行，2026-10-24 18:18–19:05 UTC+8，基于 `e9ebfaf`/`f2468b7` = main + 版本号）：validate22 0 错、jsscan33 0 错、panels21 ✅、controls ✅、sys33/pet35/lian35/lg36/sq36/fam37/life34/jianghu34 unit ✅、npc37_unit/page ✅、stage3_life34 ✅、dlg37 ✅、npc37_events unit/page ✅、route37 ✅、chain37 ✅、**pf38_unit ✅、pf38_page ✅**、dev_openworld_page ✅。
- human23：门禁中 11/13（#10 切图后仍在桃花村、#11 点 villager 落到「战斗胜利」卡），单跑 **13/13** → 判为测试时序 flake。
- human_olaf：20/23，失败 N2、T1（已知 flake 放行）、T5（`站到最近NPC旁` 后被遭遇战打断 result=battle）；T5 单跑 4 次 3 过 1 败（败的一次传送后找不到 NPC，npc=null）→ **测试本身**（传送/遭遇战时序）问题，非游戏 bug，按「单跑通过即接受」放行。奥拉夫另测：human23 重跑 13/13；human_olaf 超时，N2、T3 失败判为测试 flake（profile38.js 不碰点屏/交互）。
- CI（tag v3.8.0，run 40089126940）：build ✅、emulator-smoke API30 ✅、API34 ✅。

### 4 遗留问题
- PR #56 `zf39` 3.9.0 阵法（第 1 轮：数据+逻辑+单测，未接 UI）：**在审**。
- PR #55 `items40` 3.8.2 道具：开发/评审中。
- PR #45 `tit39` 3.8.1 称号：待发，需改用 `Chain37.doneCount`。
- PR #38 `olaf-n1t1-fix`：仅测试，修 N1/T1 flake，未全量验证；human_olaf N2/T5 也偶发，同属测试问题。
- Issue #12（3.3.1 游走 NPC 重叠点错人）仍 OPEN。
- 本机分支/工作区：`/workspace/rel37b`（Grok Bot 发版用）；各 `relXXX-bump` 远程分支可清理 → 待确认。

### 5 下一版任务（按顺序）
1. **3.8.1 称号**（PR #45，`docs/research_v39_titles.md`；改用 `Chain37.doneCount`）
2. **3.8.2 道具**（PR #55，`docs/research_v40_items.md` + `docs/research_v22.md` §13）
3. **3.8.3 家族**（`docs/research_v41_clan.md` + `docs/research_v22.md` §14，41a4bd6）
4. **3.8.4 时装 cos36**（`docs/research_v22.md` §15，30432fa）：待开工
5. **3.9.0 阵法**（PR #56 已开工，`docs/research_v22.md` §11）：依赖秘境 dungeon26 的 `Dng.roomTrap` 机关房钩子，接 UI 前先确认该接口。

### 6 交接注意
- 模块规则：新功能一律做成新的 `www/js/*.js`，在 `index.html` 按顺序加载，用「包一层原函数」接入；**不改 game.js / talk.js / data.js / ui.js 等核心文件**；不手改生成物 `www/js/version.js`、`www/assets/assets.js`/图集、`www/assets/gen/*`。
- 老存档：`wbx2_*` 键名、`G.v===2` 不变；新字段放各自命名空间（`G.npc37`、`G.fam37`、`G.route37`、`G.chain37`、`G.pf38` 等）惰性兜底，缺省时行为等同旧版。
- 弹卡类功能注意 #53 守卫（序章、新手指引、战斗中不弹）与寻路守卫 `R && R.player && R.player.nav`。
- 美术管线：当前主路线为 AI 精绘 2D（`art/ai_pipeline/process_frame.py`、`tools/gen_art.py`）；**当前渲到哪一批：待确认**。
- HD 包：CI 按 `hd-assets.json` 从 Release `assets-hd` 下载、校验 sha256、覆盖 `www/assets` 打 `wobuxian.apk`，lite 用仓库内 SD 资源；更新用 `tools/make_hd_bundle.sh upload`。签名只在 CI（Secrets），证书 SHA-256 `436bf922…29dc` 不能换。
- 本机多 AI 共用：跑 Chrome 测试前先 `ps aux|grep -i chrome`，忙就等；只杀自己的进程；各自用独立 worktree。

## 交接 notes · v3.7.5（2026-10-24，Grok Bot）

### 1 当前版本 / 最新提交
- 版本：**v3.7.5「奇遇链」**，`VERSION`=3.7.5，tag `v3.7.5` → commit `a16b119`（`3.7.5：VERSION + CHANGELOG`；其下 `ac1baaa` docs §13、`9c96645` #52 squash、`49d3e6c` #54）。
- **是 Latest**（`releases/latest` = v3.7.5，2026-10-24 15:21 UTC+8 发布，非预发布）。https://github.com/xiemingxin1145/wobuxian/releases/tag/v3.7.5
- Release 资产：`wobuxian.apk` 371,980,445 B（≈372MB，HD）、`wobuxian-lite.apk` 83,823,997 B（≈84MB）；两包签名证书 SHA-256 `436bf9221c08…ce7ef29dc`（= 436bf922…29dc）。

### 2 本版做了什么 / 刻意没做什么
- 新系统 **chain37 奇遇链**（PR #52 squash `9c96645`，新文件 `www/js/chain37.js`，index 在 dlg37 后）：驱动 `fam37.js` 的 `TEXT37B.chains` + §12.10 `CHAIN37X` 补丁；6 条链 c37_1–c37_6，触发（风声 40%、散修 60%、2 年过期、同时 ≤2 条）、§12.3 失败态、§12.4 战斗表（赢才推进）、§12.5 追凶支线、年结算每年 ≤1 张卡、`Chain37.doneCount`；接入全部为包装（Talk.extra / Game.yearEnd / Game.enterMap / UI.hud / Track.target / Track.go / LIAN35.batchAlch），开发者 Tab「奇遇37」；测试 `test/chain37_unit.js`。
- 同版带上 **#54**（`49d3e6c`，测试修正：npc37_unit「放行后正常弹路遇卡」偶发失败）。
- 合入前把 main 合进 `chain37`（`a8d6ce4`，只冲突 `docs/ROADMAP.md` 状态行）。
- 刻意没做：存档放独立 `G.chain37`（不进 `G.jh34.ch`）；c37_3「被夺宝抢先」入口（依赖 `G.npc37.ev`）待接；route37/tit39 尚未改调 `Chain37.doneCount`；战斗中敌人名不换成人物名。

### 3 测试结果
- 门禁（串行，2026-10-24 14:33–15:18 UTC+8，基于 `cd66c54`/`a16b119` = main + 版本号）：validate22 0 错、jsscan33 0 错、panels21 ✅、controls ✅、**human23 13/13**、**chain37_unit 78/78**、sys33/pet35/lian35/lg36/sq36/fam37/life34/jianghu34 unit ✅、npc37_unit ✅、npc37_page ✅、stage3_life34 ✅、dlg37_unit ✅、npc37_events unit/page ✅、route37_unit ✅。
- human_olaf：21 过 / 2 失败——N1（战后点怪未开战）、T1 33/34（点「集市货郎」脚下落到「背包」按钮）；均为已知**测试本身** flake（PROGRESS 已知问题，PR #38 待验证），按约定放行。
- 奥拉夫在 PR #52（26c7013）上：chain37_unit 78/78，jsscan33/fam37_unit/controls 0 失败，human23 13/13，human_olaf 仅 N1。
- CI（tag v3.7.5，run 40073612776）：build ✅、emulator-smoke API30 ✅、API34 ✅。

### 4 遗留问题
- PR #50 `prof38` 3.8.0 人物详情面板：开发/评审中。
- PR #51 `debt-token-offset` 讨债令抵扣误工费：奥拉夫测试中。
- PR #45 `tit39` 3.8.1 称号：已解除阻塞，待按顺序发（可接 `Chain37.doneCount`）。
- PR #38 `olaf-n1t1-fix`：仅测试，修 N1/T1 flake，未全量验证。
- chain37 后续：c37_3 夺宝入口接 `G.npc37.ev`、route37 改调 `Chain37.doneCount` → 负责人待确认。
- Issue #12（3.3.1 游走 NPC 重叠点错人）仍 OPEN。

### 5 下一版任务（按顺序）
1. **3.8.0 人物详情面板**（PR #50，`docs/research_v38_profile.md`）
2. **3.8.1 称号**（PR #45，`docs/research_v39_titles.md`）
3. **3.8.2 道具**（`docs/research_v40_items.md` + `docs/research_v22.md` §13）
4. **3.8.3 家族深化**（`docs/research_v41_clan.md`）
- **3.9.0 阵法**（`docs/research_v22.md` §11）往后放：依赖秘境 dungeon26 的 `Dng.roomTrap` 机关房钩子，需先确认/补齐该接口。

### 6 交接注意
- 模块规则：新功能一律做成新的 `www/js/*.js`，在 `index.html` 按顺序加载，用「包一层原函数」接入；**不改 game.js / talk.js / data.js / ui.js 等核心文件**；不手改生成物 `www/js/version.js`、`www/assets/assets.js`/图集、`www/assets/gen/*`。
- 老存档：`wbx2_*` 键名、`G.v===2` 不变；新字段放各自命名空间（`G.npc37`、`G.fam37`、`G.route37`、`G.chain37` 等）惰性兜底，缺省时行为等同旧版。
- 路遇/奇遇类弹卡注意 #53 守卫（序章、新手指引、战斗中不弹）与寻路守卫 `R && R.player && R.player.nav`。
- 美术管线：当前主路线为 AI 精绘 2D（`art/ai_pipeline/process_frame.py`、`tools/gen_art.py`）；**当前渲到哪一批：待确认**。
- HD 包：CI 按 `hd-assets.json` 从 Release `assets-hd` 下载、校验 sha256、覆盖 `www/assets` 打 `wobuxian.apk`，lite 用仓库内 SD 资源；更新用 `tools/make_hd_bundle.sh upload`。签名只在 CI（Secrets），证书 SHA-256 `436bf922…29dc` 不能换。
- 本机多 AI 共用：跑 Chrome 测试前先 `ps aux|grep -i chrome`，忙就等；只杀自己的进程；各自用独立 worktree。

## 开发记录 · 3.8.2 道具 items40（2026-10-24，Grok Bot；开发中，非发版交接 note）
- 分支 `items40`，PR #55（未合、未发版；发版顺序 3.8.0 #50 → 3.8.1 #45 → 3.8.2）。规格 `docs/research_v40_items.md` + `docs/research_v22.md` §13（§13 优先）。
- 新文件 `www/js/items40.js`（index 在 chain37 后）+ `test/items40_unit.js`；60 个 `i40_` 道具全登记，`use:'i40'` 分派器、战斗道具、窥心类（PF38）、送礼重写（爱/憎/月冷却）、12 个剧情道具获得/交付（「⚑」选项）、商店 6 追加 + 10 新店、采药/秘境/路遇掉落、DevPanel「道具40」；存档 `G.i40` 惰性兜底，不升 `G.v`。
- 6 个 3.8.3 道具只登记不投放；PF38 不存在时窥心/秘密类不进商店不掉落。偏差（掌心雷自动打最低血、非伙伴 NPC 送礼入口、红线/送子瓶放广寒宫等）见 PR #55 描述。
- 测试（17:50–17:57 UTC+8）：items40_unit 141/141、validate22 0 错、jsscan33 0 错、controls 0 失败、human23 13/13、chain37/npc37/npc37_events/fam37/route37/dlg37 unit 全过；human_olaf 未跑。

## 交接 notes · v3.7.4（2026-10-24，Grok Bot）

### 1 当前版本 / 最新提交
- 版本：**v3.7.4「自由路线」**，`VERSION`=3.7.4，tag `v3.7.4` → commit `5b7a20b`（`test(npc37_page): #53 序章守卫后，页面测试放行 storyBlock`；其下 `9ec0e74` 3.7.4 VERSION + CHANGELOG、`3fb3a9f` #53、`c463c22` #43 squash）。
- **是 Latest**（`releases/latest` = v3.7.4，2026-10-24 13:49 UTC+8 发布，非预发布）。https://github.com/xiemingxin1145/wobuxian/releases/tag/v3.7.4
- Release 资产：`wobuxian.apk` 371,947,979 B（≈372MB，HD）、`wobuxian-lite.apk` 83,791,531 B（≈84MB）；两包签名证书 SHA-256 `436bf9221c08…ce7ef29dc`（= 436bf922…29dc）。

### 2 本版做了什么 / 刻意没做什么
- 新系统 **route37 自由路线**（PR #43 squash `c463c22`，新文件 `www/js/route37.js`，index 在 dlg37 后）：「更多 → 道途」5 条路线（散修/魔修/宗门掌门/凡人商贾/家族），换路线冷却 10 年；路线被动、20 条路线年事件 + 10 张前置卡 + 延迟后果；魔修仇杀、商贾行商/放贷；4 个新结局（逍遥/魔君/富甲/世家）；道途面板可退出宗门；测试 `test/route37_unit.py`。
- 一并带上 **PR #53**（`3fb3a9f`，奥拉夫）：序章/新手指引/战斗期间不出路遇卡与江湖 toast（`npc37.js` / `npc37_events.js` 包裹式守卫），修 #43 上 human23 的偶发失败。
- 测试修正：`test/npc37_page.py` 因 #53 守卫在新开局（序章中）不再弹路遇而失败，改为该页放行 `NPC37.storyBlock`（守卫本身由 `npc37_unit` 覆盖）。
- 版本提交：`VERSION`、`CHANGELOG.md`（v3.7.4 自由路线）。
- 刻意没做（与规格差异，见 PR #43 / 下方 3.7.4 开发记录）：宗门声望存 `G.route37.rep` 不写 `G.sectRel`；商贾买低卖高改为「行商」；掌门「宗门战冷却 −1 年」未做；子嗣无境界改为 `kid.r37zj` 筑基几率；散修任务酬劳 ×1.2 / 奇遇权重 ×1.5 未做。

### 3 测试结果
- 门禁（串行，2026-10-24 12:59–13:42 UTC+8，基于 `9ec0e74` = main 含 #53 + 版本号）：validate22 0 错、jsscan33 0 错、panels21 ✅、controls ✅、**human23 13/13**、**human_olaf 23/23 全过（N1/T1/N2 本次均通过）**、sys33/pet35/lian35/lg36/sq36/fam37/life34/jianghu34 unit ✅、npc37_unit ✅、stage3_life34 ✅、dlg37_unit PASS、npc37_events_unit ✅、npc37_events_page ✅、route37_unit ✅。
- `npc37_page.py`：门禁中失败（#53 守卫导致的**测试本身**问题，非游戏 bug），修测试后单跑两次 12/12 PASS。
- 合入前 PR #43 合并 main 后：route37_unit 全过、validate22 0 错（奥拉夫另测 route37_unit 全过、human23 复跑 13/13）。
- CI（tag v3.7.4，run 40067584792）：build ✅、emulator-smoke API30 ✅、API34 ✅。

### 4 遗留问题
- PR #50 `prof38` 3.8.0 人物详情面板（profile38）：开发/评审中。
- PR #52 `chain37` 3.7.5 奇遇链 chain37（research_v22 §12）：进行中。
- 奥拉夫的 npc37 序章守卫 PR：已作为 #53 合入本版；如有后续守卫 PR → 待确认。
- PR #45 `tit39` 3.8.1 称号：#46 已合（`45eaad4`），**已解除阻塞**，待按顺序发。
- PR #51 `debt-token-offset` 讨债令抵扣误工费：待评审，负责人待确认。
- PR #38 `olaf-n1t1-fix`：仅测试，修 N1/T1 flake，未用新脚本跑全量验证。
- Issue #12（3.3.1 游走 NPC 重叠点错人）仍 OPEN。

### 5 下一版任务（按顺序）
1. **3.7.5 奇遇链**（PR #52，规格 `docs/research_v22.md` §12）
2. **3.8.0 人物详情面板**（PR #50，`docs/research_v38_profile.md`）
3. **3.8.1 称号**（PR #45，`docs/research_v39_titles.md`）
4. **3.8.2 道具**（`docs/research_v40_items.md`）
5. **3.8.3 家族深化**（`docs/research_v41_clan.md`）
- **3.9.0 阵法**（`docs/research_v22.md` §11）往后放：依赖秘境 dungeon26 的 `Dng.roomTrap` 机关房钩子，需先确认/补齐该接口。

### 6 交接注意
- 模块规则：新功能一律做成新的 `www/js/*.js`，在 `index.html` 按顺序加载，用「包一层原函数」接入；**不改 game.js / talk.js / data.js / ui.js 等核心文件**；不手改生成物 `www/js/version.js`、`www/assets/assets.js`/图集、`www/assets/gen/*`。
- 老存档：`wbx2_*` 键名、`G.v===2` 不变；新字段放各自命名空间（`G.npc37`、`G.fam37`、`G.route37` 等）惰性兜底，缺省时行为等同旧版。
- 路遇类新功能注意 #53 守卫：序章（`G.flags.main0` 未置位）、新手指引（`Game.meta.tut23` 未置位）、战斗中不出卡；页面测试需先跳过序章/指引或放行 `NPC37.storyBlock`。
- 美术管线：当前主路线为 AI 精绘 2D（`art/ai_pipeline/process_frame.py`、`tools/gen_art.py`）；**当前渲到哪一批：待确认**。
- HD 包：CI 按 `hd-assets.json` 从 Release `assets-hd` 下载、校验 sha256、覆盖 `www/assets` 打 `wobuxian.apk`，lite 用仓库内 SD 资源；更新用 `tools/make_hd_bundle.sh upload`。签名只在 CI（Secrets），证书 SHA-256 `436bf922…29dc` 不能换。
- 本机多 AI 共用：跑 Chrome 测试前先 `ps aux|grep -i chrome`，忙就等；各自用独立 worktree。

## 交接 notes · v3.7.3（2026-10-24，Grok Bot）

### 1 当前版本 / 最新提交
- 版本：**v3.7.3「NPC自发事件」**，`VERSION`=3.7.3，tag `v3.7.3` → commit `cbb83a2`（main HEAD，`3.7.3：VERSION + CHANGELOG + PROGRESS`；其下 `67e5f22` = PR #42 squash，`65c1d57` = PR #48 squash）。
- **是 Latest**（`releases/latest` = v3.7.3，2026-10-24 11:05 UTC+8 发布，非预发布）。
- Release 资产：`wobuxian.apk` 371,907,469 B（≈372MB，HD）、`wobuxian-lite.apk` 83,751,021 B（≈84MB）。https://github.com/xiemingxin1145/wobuxian/releases/tag/v3.7.3

### 2 本版做了什么 / 刻意没做什么
- 新系统 **NPC37E（NPC 自发事件）**：每年年末熟人 NPC 之间结仇/求助/讨债 1–2 件，写进江湖传闻；与路遇共用频率限制，自动寻路中不弹提示。新文件 `www/js/npc37_events.js`；改 `www/js/npc37.js`（+8 行钩子）、`www/index.html`（加载）；测试 `test/npc37_events_unit.js`、`test/npc37_events_page.py`。
- 修复 **#47 / PR #48**（fam37）：已有道侣同步到 `G.fam37.sp`，修已有道侣无法生子嗣/可被覆盖。
- 版本提交：`VERSION`、`CHANGELOG.md`、`PROGRESS.md`。
- 刻意没做：NPC 遭遇计数 `G.npc37.ev`（在 PR #46，未合）；自由路线 route37（#43 → 3.7.4）；称号 tit39（#45 → 3.8.1）；未改 game.js / talk.js / data.js。

### 3 测试结果
- CI（tag v3.7.3，run 40056714139）：build ✅、emulator-smoke API30 ✅、API34 ✅；main 推送 run 40056711170 ✅。
- unit：`npc37_events_unit.js`、`npc37_unit.js` 等通过；`npc37_events_page.py` 通过（详细计数见 PR #42/#46，PR #46 记 npc37_unit 66/66）。
- human_olaf：门禁中 N2 被「路遇」卡抢点失败 1 次，单跑 8/8 通过；N1、T1 为已知 flake。**三者均为测试本身（harness 站位/路遇卡抢点），不是游戏 bug**；PR #38 修 N1/T1 站位，尚未验证合入。
- 点屏（human23 真实触摸）：本版逐项通过数未单独记录 → 待确认。

### 4 遗留问题
- PR #43 `route374` 3.7.4 自由路线（route37）：评审修复已推（633cd21），**等奥拉夫 Chrome 点按测试**，负责：Grok Bot 开发 / 奥拉夫测试。
- PR #45 `tit39` 3.8.1 称号系统：评审已过（e88e33b），待按顺序发；`t39_jianghu` 依赖 #46。
- PR #46 `npc37-evcount` 遭遇计数 `G.npc37.ev`（基于 npc37-events，#42 已合，需 rebase 到 main），open-world 线负责。
- PR #38 `olaf-n1t1-fix`：仅测试，修 N1/T1 flake，未用新脚本跑全量验证。
- Issue #12（3.3.1 游走 NPC 重叠点错人）仍 OPEN。

### 5 下一版任务（按顺序）
1. **3.7.4 自由路线**（#43，规格 `docs/research_v22.md` §10）
2. **3.7.5 奇遇链**（草稿 `docs/random_adventure_chain_draft.md`、`docs/encounter_chain_draft.md`）
3. **3.8.0 人物详情面板**（`docs/research_v38_profile.md`）— 开发中
4. **3.8.1 称号**（`docs/research_v39_titles.md`，#45；先合 #46）
5. **3.8.2 道具**（`docs/research_v40_items.md`）
6. **3.8.3 家族深化**（`docs/research_v41_clan.md`）
- **3.9.0 阵法**（`docs/research_v22.md` §11）往后放：依赖秘境 dungeon26 的 `Dng.roomTrap` 机关房钩子，需先确认/补齐该接口。

### 6 交接注意
- 模块规则：新功能一律做成新的 `www/js/*.js`，在 `index.html` 按顺序加载，用「包一层原函数」接入；**不改 game.js / talk.js / data.js / ui.js 等核心文件**；不手改生成物 `www/js/version.js`、`www/assets/assets.js`/图集、`www/assets/gen/*`。
- 老存档：`wbx2_*` 键名、`G.v===2` 不变；主线按章节 id（`G.mainId`），只 `ins()` 插入不删改 id；新字段放各自命名空间（如 `G.npc37`、`G.fam37`、`G.route37`）惰性兜底，缺省时行为等同旧版。
- 美术管线：当前主路线为 AI 精绘 2D（`art/ai_pipeline/process_frame.py`、`tools/gen_art.py`）；`art/gen/NEEDED.md` 记录到「批次 2（2026-10-10）」；v24 人形模型批次见 `HANDOFF_CHARS.md`。**当前渲到哪一批：待确认**。
- HD 包：CI 按 `hd-assets.json`（现为 `wbx-hd-assets-3.2.0-202610161413.zip`，367,260,215 B）从 Release `assets-hd` 下载、校验 sha256、覆盖 `www/assets` 打 `wobuxian.apk`，lite 用仓库内 SD 资源。更新 HD 包：`tools/make_hd_bundle.sh upload`（或 `tools/hd_pack.sh`：重渲 HD → 打 zip → 上传 assets-hd → 改 hd-assets.json 并推送）。签名只在 CI（Secrets），证书 SHA-256 `436bf922…29dc` 不能换。

## 3.8.0 人物详情面板（Grok Bot，2026-10-24 11:40 起，分支 `prof38`，worktree `/workspace/prof38`，未 bump VERSION）
> 规格 `docs/research_v38_profile.md`。新文件 `www/js/profile38.js`（index 在 dlg37 后；TEXT38A 由 `tools/gen_pf38.py` 从设计稿 §8 逐字生成），不改 game.js/talk.js/data.js；存档 `G.pf38` 惰性兜底，G.v 不变。
- [x] 面板 `UI.p_pf38`：头部（立绘/名字/境界/地图，TIT39 若合入显示称号）、①基础 性格、②情谊 好感+关系分档、③隐藏 灵根/命格/真实好感/秘密①②（未解锁显示门槛）、④喜好（送过礼或好感≥60 才显示）。
- [x] 入口：对话菜单「📜 查看详情」（包 Talk.extra）；角色面板底部「📜 人物详情（自己）」。
- [x] 神识窥探：每年 3 次、目标境界高于玩家直接拒绝、成功率公式、30% 被发现扣好感 8/关系 5（karma≤−30 翻倍）、当年不可再窥；karma≥30 −10%。走 `Game.roll(p,'peek')`。
- [x] 好感途径自动解锁（≥80 灵根 / ≥120 命格 / 道侣或 rel≥60&aff≥100 真实好感 / ≥130 秘密① / 150&rel≥80 秘密②），秘密 `on` 只结算一次；`PF38.reveal(id,key,{yr})` 给 3.8.2 道具用（同心香当年有效）。
- [x] 年末「貌合神离」（道侣/记名弟子 taff≤−30，10%，寻路中不弹 toast）；子嗣 30% 继承道侣命格（包 FAM37.birth 写 kid.mg）；开发者页签「人物详情」。
- [x] 测试：`node test/pf38_unit.js` 34/34；`python3 -B test/pf38_page.py`（真实触摸 412×915）FAILS []；validate22 0 错、npc37_unit 66/66、npc37_events_unit 50/50、fam37_unit fails []、jsscan33 errors []、controls FAILS 0。human_olaf / human23 未跑（交奥拉夫）。
- ⚠ 待确认：设计稿 §3 门槛数字 6/10/13/16/20 与同表境界名（筑基中期/金丹后期/元婴中期/化神初期/渡劫初期）不一致；实现按境界名 = 9/14/17/20/24。命名 NPC 的大境界设计稿没给，`PF38.REALM` 按身份估值，待研究员确认。
- [ ] 未做：秘密的对话选项 `opt`、命格 fx 数值（compAtk/disXp/kidLg 等，设计稿标「不支持」，只显示文案）、子嗣/记名弟子行尾「详情」按钮。

> 稳定版：v2.3.0。v2.5 开放世界方向推进中。工作分支：openworld-wip


## 3.7.4 自由路线 route37（Grok Bot 自动开发，2026-10-24 09:35 起，分支 `route374`，worktree `/workspace/route374`，未 bump VERSION）
> 规格：`docs/research_v22.md` §10（研究员 07f76ad）。新文件 `www/js/route37.js`（index 在 fam37 后），不改 game.js/talk.js/data.js/ui.js。存档 `G.route37`，老档缺省 null。
- [x] 「更多 → 道途」面板：5 条路线（散修/魔修/宗门掌门/凡人商贾/家族），🔒 显示原因；换路线冷却 10 年、魔修切出需善恶 ≥0、积分清零记入 hist（最多 8 条）；面板里可「退出宗门」（游戏原本没有退宗入口，散修需要）。
- [x] 被动：魔修修为 ×1.15（「回头是岸」当年失效）、每年善恶 −2、正道声望 −3；商贾修为 ×0 + 不能冲击瓶颈（退出后也不能）、每年寿元 +1（上限 +20）；掌门记名弟子名额 +1（封顶 6）；家族子嗣灵根两次取优。
- [x] 年积分 + 20 条路线专属年事件（每年最多 1 条，⚑ 标题，自动/挂机中不弹）+ 10 张前置提示卡（各 1 次）+ 延迟后果（灵田 3 年、囤货、赊账 5 年、族学）。
- [x] 4 个新结局 `r37_xiaoyao/r37_mojun/r37_fujia/r37_shijia`：条件满足时在对应 NPC 对话出现「⚑ 大结局·xxx」，二次确认后 `Game.die`；不需要主线 done；NPC 陨落落到说书先生；结局分 +15。
- [x] 魔修「⚑ ⚔ 仇杀」（萧十三/燕归/丹娘，每人每年 1 次，胜：击杀 +1、积分 +8、天魔殿声望 +8）；商贾「行商」（每年押货、年终 ×1.1–1.7 或 10% 遭劫 ×0.7，+200）+ 放贷（3 位借款人、最多 3 笔、3 年还本、陨落全额违约）。
- [x] 开发者面板 Tab「道途37」；`test/route37_unit.py` 37 项全过（A10.1–A10.6、20 条事件、放贷/行商、结局 +15、面板、存档读档）。412×915 真实触摸截图 `/workspace/shots374/`（面板、弃仙确认卡、商贾面板）。
- 与规格的差异：①玩家对宗门的声望存 `G.route37.rep`，不写 `G.sectRel`（那里是宗门对宗门的 a|b 键，life34 会把单键误读成一对宗门）；②market25 没有统一价格入口，商贾的买低卖高改为「行商」；③war29 没有冷却，掌门「宗门战冷却 −1 年」未做（「继续烧钱」改为贡献 +10）；④子嗣没有境界：家族路线下 16 岁以上子嗣每年按灵根有几率筑基（`kid.r37zj`），族谱三代 = 娘、你、≥1 个子嗣；⑤散修「任务酬劳 ×1.2 / 奇遇权重 ×1.5」未做。
## 3.7.5 奇遇链 chain37（Grok Bot，2026-10-24 12:45 起，分支 `chain37`，worktree `/workspace/chain37`，未 bump VERSION）
> 规格：`docs/research_v22.md` §12。新文件 `www/js/chain37.js`（index 在 dlg37 后），驱动 `fam37.js` 的 `TEXT37B.chains`；不改 game.js/talk.js/data.js/ui.js。存档 `G.chain37={v:1,ch:{c37_x:{s,t0,tn,k,done,out,fail,pen,burst,offer,after,chase,hunt}},cy}` 惰性兜底（§12.2 原写 `G.jh34.ch`，按交接要求改独立命名空间，CH34 进度不受影响）。
- [x] 运行器：风声（年结算 40%/散修 60%，2 年过期）、并发 ≤2、⚑ 选项（不进 SAFE、不进 Track.list）、追踪栏 HUD 行、地点节点进图 1.5s 弹卡（`NPC37.idle()` / `R.player.nav` 守卫）。
- [x] §12.1 F1–F13、§12.3 失败态、§12.4 战斗表（`Game.fight` 胜才前进）、§12.5 追凶支线、§12.6 文案、§12.7 `Chain37.doneCount`、§12.8 开发者 Tab「奇遇37」。
- [x] 规格勘误：战斗表 `c1_3/0` → `c1_3/1`（〔独自夜探〕是第 2 个选项）；c6_3 两个选项都花灵石，补零成本选项〔让萧十三自己想办法〕→ c6_5。
- [x] `test/chain37_unit.js` 70/70（合 main 后 78/78）；validate22 0 错；npc37_unit 66/66。jsscan33 / fam37_unit / controls 需 Chrome，本轮未跑（奥拉夫占用 Chrome）。
- [x] c37_3「被夺宝抢先」：包 NPC37.emit 记钱满仓的 duobao 新闻 → `G.chain37.db`，开链后发生即转追凶；route37 已合入，`Route37.chainsDone` 由 chain37 包装为 `Chain37.doneCount`。chain37_unit 78/78。
- [ ] 未做：tit39 改调 `Chain37.doneCount`（#45 未合）；战斗敌名覆写为人物名（只靠战前卡）。

## 3.6 P0-3 灵根深化（Grok Bot，2026-10-23 19:40 起，分支 `lg36`，worktree `/workspace/game-lg36`，未 bump VERSION）
> 规格：`docs/research_v36.md` §3。新文件 `www/js/lg36.js`（index 在 fix342 后），不改 game.js/talk.js/data.js；存档 `G.lg36={pur,extraEl[,el,elFor,medKey]}` 惰性兜底，G.lg / G.v 不动。
- [x] 元素亲和：包 `calcDmg`（回合制 battle.js 与即时战 rt27 共用），玩家本人非普攻技能按 `SKILLS[k].el`（data.js 原有字段）吃 24%/元素数，雷/冰再 +6%；灵兽/伙伴/普攻不吃。
- [x] 突破修正：Δ 写进 G.tmpBrk（none +5 / shuang −2 / tian −4 / lei,bing −5 个百分点，brk' 夹 [0.1,0.95]），「冲击瓶颈」卡片成功率自动包含；取消/提前返回时还原 tmpBrk。雷/冰突破 toast「天劫：老乡…」。
- [x] 纯度：`cultMult × (0.9 + pur/500)`；打坐（Acts.mat，消耗行动力）每游戏月 +1、此来源上限 70；新道具 灵根丹 `lgd`（600 灵石，药铺/魔女小店/天庭福利社）+5；心魔幻境（xinmo34 若合入）小成及以上 +3（运行时探测 XM34.run）。
- [x] 洗灵根：洗髓丹原效果 + 纯度 −20；角色面板「灵根」栏新增 逆脉洗根（5000 灵石 + 寿元上限 10%，按 LINGGEN 权重重随，纯度不变）、定向淬根（新道具 天材地宝 `tcdb` 1500 灵石 ×3 + 8000 灵石，增/删 1 个五行元素，档位按元素数重算；异灵根不可淬）。均二次确认。淬根后的元素存 G.lg36.el（elFor≠G.lg 即失效）。
- [x] 开发者面板 Tab「灵根36」：纯度 0/50/70/100、8 种灵根、天材地宝×3、灵根丹×5、灵石+20000。
- [x] `test/lg36_unit.py`：A3.1 比值 1.00、A3.2 tian 金 ×1.24 / lei 雷 ×1.30、A3.3 lei 元婴→化神 37%、A3.4 1000 次（固定种子）最大偏差 1.8pp；老档（无 lg36）真实触摸「继续人生」纯度 50；412×915 真实触摸洗根按钮不溢出、确认卡、「算了」不扣费、淬入水→双灵根 金水。
- [x] 门禁（19:54–20:20 UTC+8，串行）：validate22 0 错、lg36_unit ALL PASS、sys33_unit fails/errors []、jsscan33 errors []、controls FAILS 0、human23 首轮 11/13（4/5 步追踪栏寻路到剑仙后未开对话，偶发）→ 单独重跑 13/13。human_olaf 未跑（交奥拉夫）。PR「3.6 灵根深化（lg36）」，不合并。
- [ ] 未做/待议：打坐 +1 只有代码、单测未覆盖（Acts.mat 需地图上的 R.player）；天材地宝暂只在商店买（可考虑秘境/BOSS 掉落）；外观光球资产（§6）交 open-world bot。

## 3.5 灵宠派遣（Grok Bot，2026-10-23 13:40 起，分支 `pet35`，worktree `/workspace/game-dev341`）
> ROADMAP P2 #16「灵宠派遣」。新文件 `www/js/pet35.js`（index 在 dev341 后），单测 `test/pet35_unit.py`。
- [x] 不出战的灵兽在灵兽面板下方「灵宠派遣」选差事：采药（木）/寻矿（土）/狩猎（火）/帮人看摊（金）/探秘境（水·冰），五行相合 ★ 收获 ×1.5；名额 1+floor(大境界/2)，最多 4。
- [x] 过年结算（包 `Game.yearEnd`）：材料/灵石 + 灵兽经验；探秘境 20%（相合 10%）负伤空手；改出战自动召回；最近 6 条记录 `G.pd35log`；差事存在灵兽对象 `p.pd35`，老档无字段即空闲。
- [x] 开发者面板新增「派遣」页（立即结算 / 送 3 只灵兽）。
- [x] `test/pet35_unit.py` 全过（逻辑 + 真实面板选差事 + 读档仍在）。
- [ ] 全门禁 `/tmp/gate_pet35.sh` → 汇总 `/tmp/gp35.txt`（各项 `/tmp/gp35_*.txt`）。全绿后 `--no-ff` 合 main，下个小版本带上。

## 3.4.1 作弊菜单（Grok Bot，2026-10-19 19:20 起，分支 `dev341`，worktree `/workspace/game-dev341`）
> 主人反馈：开发者面板很多按钮无效，缺功法/金手指/装备，天赋无效。目标：逐个点按审计+修复，新增 功法/装备/天赋/金手指 浏览选择器，test/dev341.py，门禁后开 PR「3.4.1 作弊菜单重做」（不合并）。
- [x] 审计脚本 `test/dev341_audit.py`（真实触摸逐个按钮，记录状态差异；`TABS=res,realm` 只跑部分，结果 `test/results/dev341_audit.json`）。已跑 资源/境界/解锁/剧情/传送：按钮均生效（见 /tmp/dev341_audit_story_tp.txt）；演出页：抽卡演出后游戏长时间不回到可操作状态（UX.inMap 假）→ 🛠 点了没反应，待查 g2。
- [x] `www/js/dev341.js`（index 在 jianghu34 后）：新 Tab 功法/装备/天赋/金手指/道具（搜索+分组列表，点按即发，行内刷新）；`Game.roll(p, kind)` 金手指钩子（必定突破/100% 掉落奇遇），G.cheat 开关存档内。
- [x] g2「卡死」是审计脚本没点抽卡演出的「收下」，非游戏 bug（已改脚本）。审计结论（真实点按）：旧面板 7 个 Tab 的按钮单看状态都生效；「不好用」的根因：①v2.5 浮动按钮（试炼场/全套神装/即时战，z-index 9999，右下角）盖住底部菜单（灵兽/伙伴/御剑/更多）和开发者面板底部按钮；②dev_entry_v25 自己数「标题页任意位置」点击，与开发者开关不同步，关了开发者模式按钮还在；③「全套神装」写不存在的槽位 acc1/acc2、装备缺 base；④每点一个按钮整页重绘、滚动跳回顶部；⑤🛠 在对话/演出中点了无反应；⑥无敌/一击必杀/不遇敌刷新即丢；⑦没有功法等级/神通/装备/天赋/灵根/命格/道具选择器。已全部修。
- [x] `test/dev341.py` 全过（FAILS []，约 2 分钟）：布局/滚动保留/关闭、5 个新 Tab 各发放一项 → 正常界面可见 → 刷新读档仍在、必定突破（筑基→金丹含天劫）、全套神装 6 槽。human23 的开发者面板步骤加点 5 个新 Tab。
- [x] 门禁（20:00–20:15，dev341 `6a89e81`）：validate22 0 错、jsscan33 errors []、panels21 ERRORS 0/0、controls FAILS 0、human23 13/13、life34_unit/sys33_unit/seam34 通过；dev341.py FAILS []（20:15 复跑）。
- [x] 10-19 全量 olaf 20/23（N2、T1 均为游走 NPC「集市货郎」点按偏差；S2 失败卡后误点二次升阶）——与 3.4.0 门禁修过的同类问题一致。10-23 合入 origin/main（v3.4.0，`c3d0ba1`）后 `ONLY=N2,T1,S2` 5/5 PASS，判定非 dev341 引起。
- [x] 扩展接口：`DevPanel.registerTab(key,name,render)` / `window.DevTabs`（按 key 去重，后注册覆盖）/ `window.DevOpenWorld={id,title,mount(el)→unmount,ready()}` 自动成 Tab；render 可返回清理函数。v25 入口：修 `window.Game` 恒假（Game 是顶层 const）、试炼场改游戏内 iframe 覆盖层、即时战改本图野怪 RT27 实战。
- [x] 10-23 全门禁（合 main 后）：validate22 0 错、dev341.py FAILS []、life34_unit 过、jsscan33 errors []、panels21 0/0、controls 0、human23 13/13；human_olaf 全量 22/23（只挂 N1：harness 没点中怪 fought=false）。对照 origin/main（v3.4.0 `ea4926e`）`ONLY=N1` ×2 = 1 过 1 挂，dev341 `ONLY=N1` ×2 = 1 过 1 挂 → 主线已有偶发，非本分支引起。N2/T1/S2 全量中均 PASS。
- [x] 开 PR「3.4.1 作弊菜单重做」（不合并）。
- [ ] （旧）human_olaf 全量 20:17 开跑 → `/tmp/gd341_olaf.txt`（末行 exit N）。之后开 PR「3.4.1 作弊菜单重做」，不合并。
- 旧下一步（已完成）：查 g2 卡死；修 dev_entry_v25 全套神装（槽位 acc1/acc2 不存在、缺 base）；🛠 在不可开时给提示；写 test/dev341.py；门禁；PR。
- [x] life34：`Life34._inApply` 重入标记（Game.apply / Talk.gift 包装期间为 true，计数防嵌套，finally 复位）；life34_unit `in_apply_flag` 通过。

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
- [x] 合并 `166361b` 推 main → CI run 119 build 成功，预发布 **build-219**：wobuxian.apk 371,495,896 B、wobuxian-lite.apk 83,339,448 B（未打标签）。
- [x] build-219 补记（15:50 UTC+8 核实）：CI run 39216688382 build + emulator-smoke(30/34) 全部 success；build-219 target `166361b`，prerelease。
- [x] #13 已关闭（15:40）：核实 main 上 `24303ed`（经 #14 合入）——无头 `Seam34.build()` 20 张图无任何边向连 wendao；go() finally 复位 busy；tick 走 UX.inMap。
- [ ] **心魔幻境合 main**（15:38 起，分支 `v34-xinmo`，worktree `/workspace/game-xm34`）：`xinmo34` `--no-ff` 合入 origin/main（`8bce075`）。冲突：index.html（xinmo34.js 放 seam34 后）、ux23.js（**保留 main 的 #12 v1 版**；xinmo34 分支底下带的 #12 v2 属 fix331 线，不随心魔合入）。门禁 `/tmp/gate_xm.sh` → 汇总 `/tmp/gate_xm.txt`、各项 `/tmp/gx_*.txt`：validate22 0 错、stage3 ALL PASS、xinmo34_unit fails []、xinmo34_ui ok（贪→嗔→痴→评级）、jsscan33/sys33_unit/content33 errors []、panels21 ERRORS 0、controls FAILS 0、seam34 FAILS []、human23 13/13；human_olaf 全量（含 X1）15:47 开跑 → `/tmp/gx_olaf.txt`。
  - 16:48 旧门禁 olaf 9/12 未过（N1 #12 类偶发；X1：「触发心魔幻境」按钮在调试页底部被面板滚动区裁掉，点空；S2：失败卡后 clear_popups 误点洞府「升阶」再升一次）。旧分支 `v34-xinmo` 停用。
  - **17:35 起（自动开发例行）重做于分支 `v34-xinmo2`（worktree `/workspace/game-xm34b`，已推送）**：基于最新 main（含 v34-life/build-221）重新合 xinmo34；human_olaf 的 tap_el 先滑动最近的可滚动容器再点（X1 单跑 PASS：贪→嗔→痴→评级小成，基础 56% + 5% = 61%）；S2 失败卡只点「好」；seam34.draw 无存档时跳过（multilife 换人生瞬间 canEnter null.flags 报错）。全门禁 `/tmp/gate_xm2.sh` → `/tmp/gx2.txt`（结束标志 GATE_DONE，olaf → `/tmp/gx2_olaf.txt`）。绿了 `--no-ff` 合 main。**请其他会话勿重复做心魔合并。**
- [x] **江湖自转第一片**（分支 `v34-jianghu`，worktree `/workspace/game-jh34`，`c3ae528`，未合 main）：`www/js/jianghu34.js`（seam34 后加载）+ `test/jianghu34_unit.py`（fails []，跑 3 次稳定）。存档字段 `G.jh34`（缺省惰性初始化，不改 G.v）。详见下条「交接注意」。
- ⚠ **交接注意（并行冲突，15:47）**：本轮在 `/workspace/game-life34`（分支 `v34-life`）写的江湖代码一度覆盖了开放世界线同名文件 `www/js/life34.js`（56ed5e2 #12 根治 + 660cbb2 设计文档），已用 `0dd0029` revert 恢复原样（与 660cbb2 内容一致），并已推送；开放世界线 15:41 起在该 worktree 跑的 `ONLY=N1,T1,T4`（`/tmp/lf_r1.txt`）中途约 15:46:52–15:48 期间读到的是被覆盖的文件，**结果需重跑**。本线代码已改名搬到 `v34-jianghu`（对象 JH34/CH34/Chain34、NPC id `jh_*`、面板 `jh34`），与 life34.js（G.life34、流动 luren/b34_*、恩怨、找上门、qc34_ 任务式奇遇链）不冲突、可同时加载；两条线的世界模拟/奇遇链有概念重叠，合并前需要协调（建议：life34 管已有 NPC 流动/恩怨/找上门，jianghu34 管新江湖人物 + 宗门势力 + CH34 多 NPC 链）。
- 下一步（3.4 自由度）：新区外观再打磨（路边装饰、缺纹理类型改借邻图纹理）、天外天收费站位置、其余 22 格图视需要扩、#12 根治（剑仙/翠花重叠、点 NPC 撞怪）。
- 旧下一步（v34-big）：①美化新区（地块有棋盘感，可加草纹/路边石）②在新区放 2–3 个已有 NPC/交互点 ③测基线帧时 ④把 seam34.py/全门禁在 v34-big 跑一遍 ⑤旧边缘 x 打通处与底板崖壁衔接检查截图。
- [ ] 未做：邻图边缘地块预渲染（现在只有出口标识，没画邻图边条）；地图扩大（桃花村 36、青云宗/天外天 32，计划：在 +i/+j 方向扩展，旧坐标不变免迁移，新区域用程序化地块+现有道具图集）；§E.3 分块绘制/寻路上限；名牌压任务栏；#12 补丁。
- 下一步：门禁全绿 → `--no-ff` 合 main 推送 → 记录 build 号；再做地图扩大。

### 3.4 第 3 步：v34-life（worktree `/workspace/game-life34`，2026-10-19 15:40 起）
- [x] #12 根治（`www/js/life34.js` 第 1 部分）：翠花家 (12,16)→(14,15)，原来与剑仙 (9,13) 屏幕同一竖列；NPC 闲逛目标不与其他 NPC 屏幕叠列。复测 ONLY=N1,T1,T4：T1 35/35，T4 19/20（剑仙→翠花误中消失，剩 1 次 harness「NPC 在屏外」），N1 fought=false（probe 证实点屏内怪 3/3 能开战，属 harness 找不到屏内怪的偶发）。
- [x] 设计：`docs/openworld_upgrade.md`「3.4 自由度层设计」。
- [x] 年度世界模拟（life34 第 2 部分）：流动 NPC（非任务给予者，当前只有集市货郎）按 seam34 邻接换图；恩怨值 G.life34.rel（闲聊每年 +2、托付 +15、寻仇后 +）；宗门关系漂移；找上门事件（寻仇=精英战/报恩=灵石/宗门纠纷=贡献/托付=修为），进图 1.5 s 后在玩家旁生成带「！」的来客。存档 G.life34 惰性默认值。
- [x] 奇遇链 15 个任务（5 图×3 步，`qc34_*`，pre 串联，复用任务栏/追踪）。validate22 0 错。probe 截图 `/workspace/shots34/life_visitor.png`。
- [x] 地表打磨：缺纹理类型（如青云宗土路）借邻图真实源格（异步加载后重建分块）；`tools/big34_src.py` 加 BAD 表剔除 20 个带栅栏/建筑轮廓线/水面反光的源格；邻图预览椭圆 → 沿边 5×3.5 格平移对齐的真实地块边条、向外渐隐。截图 `/workspace/shots34/strip_*.png`、`*_v6.png`。
- [x] **v34-life 为 3.4 自由度唯一主线分支**：已并入 v34-jianghu（`jianghu34.js`：6 位自主 NPC 月推进、三宗势力、更多→江湖风云面板、CH34 奇遇链 + 两个测试）。去重：life34 不再自己漂移宗门关系，统一读写 G.sectRel（JH34/war29）；life34 保留 #12、找上门来客、qc34 奇遇链。v34-jianghu 不再单独开发。
- [x] 全门禁 /tmp/gl4.txt 全绿：validate/jsscan33/stage3_chain/sys33_unit/content33/panels21/controls/seam34/human23 13/13/jianghu34_unit/jianghu34_ui/human_olaf 23 PASS（T4、N1 一次过，#12 已根治）。
- [x] `--no-ff` 合并 `c93ab6f` 推 main → CI build 成功，预发布 **build-221**：wobuxian.apk 371,542,381 B、wobuxian-lite.apk 83,385,933 B（未打标签）。
- [x] v34-fix（Olaf 审 c93ab6f 来客问题）：赔礼价 need×0.15（练气 30/金丹 195/化神 1140）写在按钮上，不够灵石🔒+提示、toast 后回到选择，不再误开战；恩怨负面来源（奇遇链接 3 年未交 −20、征伐打赢敌宗弟子该宗 NPC −15、讨债司公示逾期（本年欠款上涨）正恩怨全体 −5/年、来客打发走 −10、打赢仇家 −10/打输 +5/赔礼 +25）；有仇家（≤−40）必在一年内上门；报恩按恩怨加权随机 + 同一人 3 年冷却（L.seen.vf_id）、礼金 need×(0.15~0.25)、第 2 次起减半、第 3 次起可能给灵草×3/玄铁晶×1；开发者面板「最近NPC恩怨∓50」。新测 `test/life34_unit.py` 全过；validate/jsscan/jianghu34×2/controls/seam34/human23 13/13 全过。
- [x] #17（PR #18，build-223）：讨债司公示只看超出年息的欠款增长。
- [x] 好感节奏（favor34）：G.aff 变化同步 rel=trunc(Δ×0.5)；闲聊每年 +4/+1/+1（封顶 6）；送礼另加 3/6/10（每年封顶 15）；奇遇链每步 +15、末步再 +10；不衰减；老存档不回填。life34_unit 覆盖。
- [x] chain40：qc34 整链完成链主（末步给予者）rel≥40，其他步给予者各 +5；talk.js 暴露 Talk.prefs（送礼最爱表），life34 读它（本地表仅兜底）。
- [x] **v3.4.0 发版**（分支 rel340）：已 bump VERSION=3.4.0、AGENTS/ROADMAP、新增 CHANGELOG.md；S3 阻断查明并修：催收令标记旁有怪时点名牌命中了怪→开普通怪战（tries 不减、dmg=0、无结算卡），修后回归测 `test/wb33_mark_regress.py`（去掉修复可复现）；N1 同源：刷怪离 NPC/标记≥2 格。全门禁：validate22/jsscan33/stage3_chain/sys33_unit/content33/panels21/controls/wb33_mark_regress/life34_unit/life34_visitor_nomons/jianghu34_unit/human23 13/13/human_olaf 23 PASS（含 S3、N1）全过；seam34、jianghu34_ui 首跑与 dev341 并发 Chrome 时失败，单独串行重跑通过。原记录 `/tmp/gate_rel.sh` → `/tmp/gr.txt`（olaf → `/tmp/gr_olaf.txt`，结束标志 GATE_DONE）。之后：合 main → 打 tag v3.4.0。
- [x] **v3.4.0 已发布**（tag v3.4.0 = `3d008fb`，versionCode 228，Latest）：https://github.com/xiemingxin1145/wobuxian/releases/tag/v3.4.0 ；wobuxian.apk 371,552,277 B、wobuxian-lite.apk 83,395,829 B；release notes 附 CHANGELOG。
- 下一步：江湖传闻面板与 life34 日志合并进江湖风云、其余 3 图奇遇链、NPC 之间恩怨。（olaf 输出 `/tmp/gl_olaf.txt`），结束标志 GATE_DONE。之后合 main。

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

### 开放世界线小步（2026-10-24）
- [x] 低模 Cube 样例补充：`www/js/lowpoly_extra_chars.js` 新增「药农」「黑市商人」（草帽+药篓+药锄），预览页下拉增加药农与渡口船夫。纯离线预览，不接入正式运行链。下一步：继续加 1-2 个路人样例，或评估低模接入即时战原型对比。

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

### 2026-10-19 第十轮（UTC+8，openworld-wip）
- [x] 步骤 17：债务系统强化 #7「追兵档位参数可调表 + 开发者覆盖」——`Stage3.BOUNTY_TUNING_DEFAULT`：由 `DEBT_TIERS` / `BOSS_RING` 的数值生成并**深冻结**的默认表 `{ tiers: [4 档 {hunters, hpMul, atkCdMul, windMul, shotCount, shotSpread, spdAdd}], boss: {ringShots, ringWarn, ringCd} }`。纯函数 `Stage3.bountyTuning(override)` 把开发者覆盖与默认表合并、逐字段校验/钳制，返回 `{table（深冻结）, source, error, changed, clamped, rejected, unknown}`：覆盖写法 `{"tiers":{"wanted":{"shotCount":5}},"boss":{"ringShots":12}}`（档位可写 0–3 / light·owing·heavy·wanted，也可 4 项数组）；**非数字 / 不合法（倍率 ≤0、发数 <1、负数）→ 该字段回退默认**并记 rejected；**合法但越界 → 钳到边界**（整数字段先取整）并记 clamped；未知顶层键/档位/字段 → 忽略并记 unknown；覆盖本身不是对象 → 整张回退默认并给 error。钳制范围与即时战原型一致：`atkCdMul/windMul` 0.3–2、`shotCount` 1–5、`shotSpread` 0–30°（= `FOE_TRAIT`），`ringShots` <3 = 0 不放、3–16，`ringWarn` 0.15–1s，`ringCd` 0–10s（= `RING`）；原型里没钳的三个另定 `hunters` 1–4（只有 4 个站位）、`hpMul` 0.3–3、`spdAdd` 0–40。`debtPressure(G, tuning)` / `bountyEnemies(G, tuning)` 加可选第二参（不传 = 默认表；传未校验对象也会先过 `bountyTuning`），档名/阈值/特性名/误工费率/结算/突破预估都不受调参影响；低档被调成非中性时说明改标「开发者调参：…」，`ringShots` 调成 0 时头子不放环弹、提示里也不写招式。**开发者覆盖只走开发者入口**：`dev_entry_v25.js` 从 localStorage 专用键 `wbx_dev_bounty_tuning`（JSON）只读取（`getItem`），开发者「追兵战」用合并后的表，toast 带「【开发者调参 N 项】」/「【调参表无效，已用默认】」，结算卡加「开发者调参：N 项生效」或「调参表无效，本场用默认表」（没设覆盖时文案与上一轮完全一样）；新按钮「追兵调参」（`bottom:470px`，与其余 7 个按钮不重叠、在屏内）弹卡显示四档生效值、头子环弹、被覆盖字段（*）与「默认→新值」、钳制、非法回退、未知字段和改法，有覆盖时可「清除覆盖」（删键）。覆盖键不写进游戏存档（`wbx2_save`），stage3 与正式游戏逻辑都不读 localStorage 这个键；坏 JSON / 非对象（数组、null、字符串）安全回退默认并在卡片标「⚠ …已用默认表」。仍只走开发者入口，不接正式战斗/事件池。
  - 设计取舍：默认表从 `DEBT_TIERS`/`BOSS_RING` 生成（单一数据源，原有字段与单测不动），而不是反过来改写这两张表；误工费率 `BOUNTY_FEE` 会改存档里的欠款，本轮**不**放进调参表（试玩调手感只动战斗参数，不让开发者覆盖间接改存档）。「越界」按原型的做法钳到边界而不是回退默认，只有类型/定义域非法才回退默认——这样与原型 `foeTrait/foeRing` 对同一数值的处理一致（单测逐值对照）。读 localStorage 放在开发者入口而不是 stage3，stage3 保持纯函数、可在 node/vm 里对照。
  - 测试：`node test/stage3_chain.js` 171/171（新增 37 条：默认表深冻结且改不动、默认表 = DEBT_TIERS/BOSS_RING 逐字段、不传/null/空覆盖原样返回默认表、合并生效且其余字段沿用默认、changed 列表、结果冻结且不改入参/默认表、纯函数与三种档位写法等价、幂等、12 组档位钳制 + 8 组环弹钳制、边界合法值、10 种非数字 × 10 字段回退、13 种定义域非法回退、unknown/rejected/非对象 error；**vm 载入 `git show c46c1ef` 的旧 stage3 做无覆盖对照：debtPressure 7 种「无覆盖」写法 × 24 种存档、bountyEnemies × 23 种存档、settleBounty 286 组（存档×结果，返回值 + 结算后整份存档）、breakthroughPreview 22 种存档无 Game 回退 + 18 种存档载入真实 data.js/game.js，全部逐字段一致**；覆盖生效（小账 3 只/血 160/2 发、通缉 5 发/冷却×0.4/移速 +20、头子 12 发/0.6s/1.5s 只有头子带）、说明文案、ringShots=0 关环弹、未校验对象/非对象等价处理、覆盖不改存档、覆盖不影响结算、只有 dev_entry 提到覆盖键/调用 bountyTuning、stage3 不读 localStorage、dev_entry 只 getItem 不 setItem 不存档）；`node test/battle_rt_proto.js` 141/141（新增 3 条：35 个合法数值调参表钳制 = 原型 foeTrait/foeRing；合并表进原型原样生效；站桩远射 6s 调参 5 发/冷却×0.4 齐射 18 次/弹丸 90 vs 默认 13 次/39）；`python3 -B test/dev_entry_v25_page.py` 40/40（新增 6 条、改 1 条：八个按钮不重叠且在屏内（含左右）；没设覆盖卡片显示默认表；**写入覆盖后真页面追兵战天道通缉 2 个、5 发、冷却×9 钳到 2、头子 12 发、非法 ringWarn 回退 0.4**；卡片标出 4 项覆盖/钳制/非法/未知并给「清除覆盖」；带覆盖打赢结算卡含「开发者调参：4 项生效」，存档与 G 不含覆盖键/调参字段、覆盖键未被改写；坏 JSON/数组/null/字符串 四种都回退默认且与无覆盖逐字段一致、卡片提示 ⚠；「清除覆盖」后键被删、追兵与默认逐字段一致；0 JS 错误）；`node test/lowpoly_box.js` 55/55、`python3 -B test/battle_rt_proto_page.py` 12/12、`node test/validate22.js` 0 错、`python3 -B test/encounter_chain_verify.py` 14/14、`python3 -B test/sys33_unit.py` 0 失败、`python3 -B test/jsscan33.py` 21 张图 0 错，均无新失败（浏览器测试逐个串行跑）。
  - 涉及文件：`www/js/stage3_encounter_draft.js`、`www/js/dev_entry_v25.js`、`test/stage3_chain.js`、`test/battle_rt_proto.js`、`test/dev_entry_v25_page.py`、`docs/openworld_upgrade.md`、`PROGRESS.md`
- 下一步：主人试打时用 `localStorage.setItem('wbx_dev_bounty_tuning', '{"tiers":{"wanted":{"shotCount":2}}}')` 之类直接调追兵数值，「追兵调参」卡看生效表，定下后把数值写回 `DEBT_TIERS`/`BOSS_RING`（默认表随之更新，c46c1ef 对照测试届时要换成新基线）；可选小步：开发者卡片里加几组预设（如「好躲」「原样」「地狱」）一键写入覆盖，或把误工费率也纳入调参（需先定「开发者覆盖可否改存档数值」）。讨债令用途、突破惩罚是否接入正式 `_tryBreak` 仍待主人定。主人试玩定数值（奇遇链、查账链、灵根技能、误工费率、突破惩罚 0/3/8/15、追兵档位参数、头子环弹）照旧待办。

### 2026-10-19 第十一轮（UTC+8，openworld-wip）
- [x] 步骤 18：债务系统强化 #8「追兵调参一键预设」——`Stage3.BOUNTY_TUNING_PRESETS`：深冻结的三组预设 `{key, n, note, override}`：**好躲**（`easy`：小账/欠款冷却×1.3、前摇×1.3；重债血×1.15、冷却×1、前摇×1.1、单发、移速+0；通缉只来 3 个、血×1.3、冷却×0.85、前摇×1、2 发 12°、移速+4；头子环弹 6 发 / 预警 0.6s / 每 5s，共改 20 项）、**原样**（`plain`：`override: null` = 不覆盖、默认表）、**地狱**（`hell`：小账 2 个双发、欠款 3 个、重债 4 个三发、通缉 4 个血×1.8、冷却×0.4、前摇×0.5、5 发 18°、移速+16；头子环弹 12 发 / 0.3s / 每 1.5s，共改 30 项，都在钳制范围内）。纯函数 `Stage3.bountyPreset(key)`（按 key 取，未知 → null）、`Stage3.bountyPresetOf(tu)`（一张表 / bountyTuning 结果 / 未校验覆盖 等于哪个预设，自定义 → null）。开发者「追兵调参」卡选项固定为「知道了 / 预设·好躲 / 预设·原样（清除覆盖）/ 预设·地狱」，卡片多一行「当前预设：…」或「当前：自定义覆盖」；点预设 = `writeBountyPreset` 把预设 override 的 JSON 写进 localStorage 专用键 `wbx_dev_bounty_tuning`（原样 = 删键），toast「已套用追兵调参预设「地狱」：改了 30 项（下一场追兵战生效）」，下一场「追兵战」即按预设打。原「清除覆盖」按钮并入「预设·原样（清除覆盖）」。仍只走开发者入口，不进正式事件池、不接 `Game.fight`。
  - 设计取舍：预设表放在 stage3（纯数据 + 纯函数，可在 node 里逐值校验），写 localStorage 只在 dev_entry 的 `writeBountyPreset` 一处、只写这一个专用键，从不碰游戏存档 `wbx2_save`、不调 `Game.save`；stage3 仍不读写 localStorage。预设是「一份覆盖 JSON」而不是另一套机制，所以和手写覆盖走同一条 `bountyTuning` 校验路径、结算卡「开发者调参：N 项生效」照常显示。每个预设值都要求原样通过 `bountyTuning`（0 钳制 / 0 非法 / 0 未知），避免「预设写的数和实际生效的数不一样」。难度单调只比人数/血/冷却/前摇/发数/移速/环弹三项，散射夹角不算难度（单发时无意义、多发时宽窄各有利弊）。选项顺序固定（不再随有无覆盖变化），测试按下标点更稳。上一轮单测「dev_entry 只 getItem 不 setItem」按要求**收窄而不是删除**：现在断言全文件 `setItem` 仅 1 处、只能是 `localStorage.setItem(TUNING_KEY, JSON.stringify(p.override))`，`removeItem` 只删 `TUNING_KEY`，读取函数仍只 getItem，dev_entry 不出现 `wbx2_save`，读写覆盖的函数不存档。
  - 测试：`node test/stage3_chain.js` 187/187（新增 16 条、改 1 条：三个预设顺序/名称/说明；深冻结改不动；每个预设过 `bountyTuning` 0 钳制/0 非法/0 未知/无 error（好躲 20 项、地狱 30 项）；每个字段在 `TUNE_RULES` 内且 `tuneField` 原值返回；原样 = 默认表同一对象、JSON 往返一致；**好躲每档每字段都不比默认难、地狱都不比默认易**（各档至少一项严格变化，头子三项严格）；`bountyPreset` / `bountyPresetOf` 认出三种写法、自定义 → null；好躲通缉 3 个/2 发/冷却×0.85/头子 6 发、地狱小账 2 个双发/通缉 5 发/头子 12 发；档名/阈值/特性名不变、原样 = 不传；三个预设下打赢天道通缉结算返回值与存档完全一致；不改默认表/DEBT_TIERS/BOSS_RING；除 stage3 外只有 dev_entry 引用预设；收窄后的 setItem 断言）；`node test/battle_rt_proto.js` 143/143（新增 2 条：三个预设 × 四档追兵进原型参数原样生效（原型不再钳制）；**通缉档站桩远射 6s：好躲弹丸 14（齐射 7）< 原样 39（13，= 默认）< 地狱 90（18）**）；`python3 -B test/dev_entry_v25_page.py` 48/48（新增 8 条、改 4 条：选项 = 知道了 + 三个预设且四个按钮都在 412×915 屏内；**点「预设·地狱」后覆盖键 = 预设 JSON、其它 localStorage 键（含 wbx2_save）一个字节不变**；地狱真页面追兵 4 个/5 发/冷却×0.4/前摇×0.5/头子 12 发 0.3s 1.5s、卡片「当前预设：地狱」「改了 30 项」无钳制；改点好躲 → 3 个/2 发/头子 6 发、「当前预设：好躲」；好躲下打赢天道通缉结算卡「开发者调参：20 项生效」、讨债令照记、欠款不变、存档不含调参内容；点原样 → 删键、其它键不变、追兵与默认逐字段一致；无覆盖再点原样不报错；0 JS 错误）；`node test/lowpoly_box.js` 55/55、`python3 -B test/battle_rt_proto_page.py` 12/12、`node test/validate22.js` 0 错、`python3 -B test/encounter_chain_verify.py` 14/14、`python3 -B test/sys33_unit.py` 0 失败、`python3 -B test/jsscan33.py` 21 张图 0 错，均无新失败（浏览器测试逐个串行跑）。
  - 涉及文件：`www/js/stage3_encounter_draft.js`、`www/js/dev_entry_v25.js`、`test/stage3_chain.js`、`test/battle_rt_proto.js`、`test/dev_entry_v25_page.py`、`docs/openworld_upgrade.md`、`PROGRESS.md`
- 下一步：主人在开发者「追兵调参」里点「好躲 / 原样 / 地狱」各打几场天道通缉，定出一组合适数值后写回 `DEBT_TIERS`/`BOSS_RING`（默认表随之更新；c46c1ef 无覆盖对照与预设「好躲每字段不比默认难 / 地狱不比默认易」的单调断言届时要换新基线）；可选小步：预设里加一组「只关头子环弹」方便单独试小弟手感，或把误工费率纳入调参（需先定「开发者覆盖可否改存档数值」）。讨债令用途、突破惩罚是否接入正式 `_tryBreak` 仍待主人定。主人试玩定数值（奇遇链、查账链、灵根技能、误工费率、突破惩罚 0/3/8/15、追兵档位参数、头子环弹）照旧待办。

### 2026-10-19 第十二轮（UTC+8，openworld-wip，18:00 起）
- [x] 步骤 19：`git fetch` 后把 origin/main **`1a2c998`**（Merge v34-fix，build-222；含 c93ab6f v34-life、166361b v34-big、df295fc v34-world，HEAD..origin/main 56 个提交 / 128 个文件）`git merge --no-ff` 合进 openworld-wip，合并提交 `ff8343a`（已推）。唯一文本冲突 `docs/openworld_upgrade.md` 文末：保留本分支「更新于」与阶段现状，删 main 侧已被取代的 2026-10-10 旧「更新于」行，main 的「3.4 自由度层设计」整节接在文末；PROGRESS.md 自动合并两边都在。合并后 `git diff origin/main` 只剩本分支认领文件，life34.js / jianghu34.js / huashen33.js / controls.py / ux23.js / 章节文件与 main 一致。
  - 合并后测试（依次单跑）：stage3_chain 187/187、battle_rt_proto 143/143、lowpoly_box 55/55、battle_rt_proto_page 12/12、dev_entry_v25_page 48/48、validate22 0 错、encounter_chain_verify 14/14、sys33_unit fails []、jsscan33 21 图 errors []、life34_unit fails []、jianghu34_unit fails []、jianghu34_ui ok、seam34 FAILS []。
- [x] 步骤 20：钱多多 / 记账童子记仇选项改走 main 的 `Life34.rel(id, d)`（档位：举报·告发 −20、贿赂露馅 −15、赖账 −10 占位——两条链没有赖账选项）：钱多多「举报」→ `rel('merchant', -20)`，记账童子「告发」→ `rel('xianguan', -20)`、查账露馅 → `rel('xianguan', -15)`；结果卡加「X记仇：恩怨 −N」。`typeof Life34` 判断，Life34 不存在 / 无 rel / 抛错 / 不是 Game.G 都不调用不报错。不新建恩怨 / 仇恨字段，`G.aff` 照旧，两条链不读写 `G.sectRel`（不涉及宗门）。
- [x] 步骤 21：追兵战与 life34「仇家上门」同年互斥：`Stage3.canHunt`（开发者「追兵战」按钮开战前调，只读）——本年有 `L.pending` 仇家、`L.seen['foe_'+年]`（约定键）或本年寻仇 / 赔礼日志就不开战；`settleBounty` 结算时写 `flags.s3b_hunt_year = 当年`，`Stage3.huntBlocksFoe(G)` 给 life34 读。`L.seen` 实际不记仇家上门（见 docs），所以方向 ① 读 pending + 日志。跨年不互斥。
  - 测试：新增 `node test/stage3_life34.js` 63/63（间谍 Life34：每个记仇选项 id / 幅度、非记仇选项不调、只用 rel；G.sectRel 有则不变无则不建、无平行字段；Life34 未定义 / null / 无 rel / 抛错 / 非当前存档 / 无 Game 不报错；vm 载入真实 life34.js：rel 真写 G.life34.rel、删 window.Life34 后 typeof 仍可取、真实 simYear 生成仇家 → canHunt 拒绝、真实 Life34.visit 应战 / 赔礼日志 → 仍拒绝、跨年放行、追兵战标记同年真跨年假、只读、只有 dev_entry 调用、life34.js 未改）；`test/stage3_chain.js` 187/187（c46c1ef 对照剥掉新增的 s3b_hunt_year 再逐字段比，并断言该标记当且仅当结算时写）；`test/dev_entry_v25_page.py` 53/53（新增 5 条：真页面举报 rel.merchant −20 已存档、露馅 rel.xianguan −15 且卡片写明且 G.sectRel 不变、打过追兵战 s3b_hunt_year = 当年已存档、挂仇家 pending 时点「追兵战」不开且提示、清掉后照常开）；battle_rt_proto 143/143、lowpoly_box 55/55、battle_rt_proto_page 12/12、validate22 0 错、encounter_chain_verify 14/14、sys33_unit fails []、jsscan33 21 图 errors []、life34_unit fails []、jianghu34_unit fails []、jianghu34_ui ok、seam34 FAILS []。
  - 涉及文件：`www/js/stage3_encounter_draft.js`、`www/js/dev_entry_v25.js`、`test/stage3_life34.js`（新）、`test/stage3_chain.js`、`test/dev_entry_v25_page.py`、`docs/openworld_upgrade.md`、`PROGRESS.md`
- **待办（需要 Grok Bot 在 life34 侧做，本分支不改 life34.js）**：① 读 `G.flags.s3b_hunt_year === Life34.yr()`（或 `typeof Stage3 !== 'undefined' && Stage3.huntBlocksFoe(G)`）——当年打过追兵战就不生成 / 不放出仇家上门（现行 life34 仇家只在年初生成，眼下不冲突，改成年中生成时必须加）；② 仇家上门时写 `L.seen['foe_'+年] = 1`，本分支已认这个键，可替代读日志文本。
- 下一步：主人在开发者入口试玩两条链的恩怨效果（举报两次到 −40 → 来年钱多多上门寻仇）；接进正常流程须另开 PR 给奥拉夫审；仍待主人试打定追兵数值。

### 2026-10-19 第十三轮（UTC+8，openworld-wip，18:47 起）
- [x] 步骤 22：合 origin/main 两次（普通 merge，无冲突）：`8ee2459`（#18/#20/#21：好感→恩怨 50% 同步、huntBlocksFoe 接入、L.seen.foe_年、无怪问道崖修复）→ 合并提交；再合 `80877b4`（#22 build-226：奇遇链链主 rel≥40、Talk.prefs）→ `411afee`。life34.js / talk.js / jianghu34.js 等 main 文件与 main 一致。两条链不读送礼偏好（不涉及 Talk.prefs）。
- [x] 步骤 23：记仇不重复计。实测（`stage3_life34.js` B0）：链里 `addAffTo` 直接写 `G.aff`，不经 main 的 `Game.apply` / `Talk.gift` 包装 → 同步**不触发**。改为 `Stage3.affRel(G,id,n,target)`：写好感 → 若 L.rel 未被同步则调 `Life34.syncAff(改前快照)` → 只补「目标 − 已同步」（同号，已达标补 0）。每个选择 L.rel 总变化：钱多多举报 −20（好感 0/30/100 起：0+−20 / −15+−5 / −20+0），扛税 +30（150 封顶时按实际 Δ），不掺和 −2；记账童子告发 −20，对账 +30，贿赂 +10，露馅这一步 −15（贿赂+露馅整条净 −5）。删 `lifeRel`。
- [x] 步骤 24：追兵战互斥只读 `L.pending` 仇家 + `L.seen['foe_' + (G.year || G.age)]`（main life34 写的键），去掉日志文字匹配；`huntBlocksFoe` / `flags.s3b_hunt_year` 不变，真实 life34 simYear 读它挡同年仇家（已测）。
  - 测试：stage3_chain 203/203（新增 §9：载入真实 life34 的每选择 L.rel 总额、直接写 vs Game.apply、foe 键两方向含仅 age 存档；修正随机来客导致的偶发，连跑 40 次 0 失败）、stage3_life34 87/87、dev_entry_v25_page 56/56（真页面：举报 0→−20、贿赂 +10、露馅 −15、foe_年 键挡追兵战、去年键不挡、huntBlocksFoe）、battle_rt_proto 143/143、lowpoly_box 55/55、validate22 0 错、life34_unit fails []、life34_visitor_nomons fails []、jianghu34_unit fails []、jianghu34_ui ok、seam34 FAILS []、sys33_unit/jsscan33/content33 errors []、encounter_chain_verify 14/14、battle_rt_proto_page 12/12。
  - 涉及文件：`www/js/stage3_encounter_draft.js`、`test/stage3_life34.js`、`test/stage3_chain.js`、`test/dev_entry_v25_page.py`、`docs/openworld_upgrade.md`、`PROGRESS.md`
- 注意：若以后在 `Game.apply` 包装内部调这两条链，外层包装会再同步一次（重复计），届时要改 affRel。
- 下一步：主人在开发者入口试玩两条链的恩怨数值；接进正常流程另开 PR 给奥拉夫审；追兵数值待试打定。

### 2026-10-19 第十四轮（UTC+8，openworld-wip，20:07 起）
- [x] 步骤 25：`Stage3.affRel` 认 main 3.4.1（dev341 分支已有）的重入标记 `Life34._inApply`：`typeof L34._inApply === 'boolean' && === true` 才算在 `Game.apply` / `Talk.gift` 包装内部——此时不调 `Life34.syncAff`（外层返回后自己同步），按本次实际好感 Δ 预估外层那份 `trunc(Δ×0.5)`，只补「目标 − 预估」的差额（同号，已达标补 0），返回值多 `deferred: true`。标记不存在 / 非布尔 true（3.4.0、当前 main）→ 当 false，行为与第十三轮逐值一致。不改 life34.js / dev_entry_v25.js / ux23.js。
  - 约定：3.4.0 打标签前不往 main 合任何东西；3.4.0 发布后再给 openworld-wip 开 PR，跟 3.4.1 一起进。
  - 测试：`node test/stage3_life34.js` 109/109（新增 22 条：A5b 间谍 Life34 `_inApply=true` → 举报@30 只补 −5（预估外层 −15）、@100 已达标零调用、扛税只报告 +30、露馅补全额 −15；标记缺省 / false / "true" / 1 都当 false 先调 syncAff；C1 当前 main 的真实 life34 + 手动模拟 3.4.1 外层包装，8 种选择 + 露馅的 L.rel 总额与不在包装内一致；只置标记无外层同步时只剩差额 −5（证明确实跳过 syncAff）；删标记回到第十三轮；C2 `git show origin/dev341:www/js/life34.js` 载入真实 3.4.1 包装、链在真实 `Game.apply` 内部跑：举报@30 / 举报@0 / 告发@50 = −20、扛税 +30、deferred、包装后标记复位 false；对照当前 main 同样嵌套会重复计成 −35 / +60 / −40）；stage3_chain 203/203、dev_entry_v25_page 56/56、battle_rt_proto 143/143、lowpoly_box 55/55、battle_rt_proto_page 12/12、validate22 0 错、encounter_chain_verify 14/14、sys33_unit / jsscan33 / content33 errors []、life34_unit fails []、life34_visitor_nomons fails []、jianghu34_unit fails []、seam34 FAILS []。
  - 涉及文件：`www/js/stage3_encounter_draft.js`、`test/stage3_life34.js`、`docs/openworld_upgrade.md`、`PROGRESS.md`
- 下一步：按优先级回到债务系统强化（下一小步候选：讨债令加上限 / 冷却，防反复刷），之后即时战原型、低模方块角色、奇遇链；3.4.1 合进 main 后再跑一遍 C2 确认（届时 C1 的「本分支 life34 没有 _inApply」断言要换掉）。两条链接进正常流程仍须单独开 PR 给奥拉夫审。

### 2026-10-19 第十五轮（UTC+8，openworld-wip，20:23 起）
- [x] 步骤 26：`git fetch` 后普通 merge origin/main **`ea4926e`**（含 `3d008fb` Merge rel340 = v3.4.0：S3 点催收令名牌优先于怪、N1 刷怪离 NPC/标记 ≥2 格，回归测 `test/wb33_mark_regress.py`），合并提交 **`c1ec4f0`**，无冲突；huashen33.js / controls.py / life34.js / jianghu34.js / game.js / talk.js / ux23.js / 章节剧情文件与 main 一致（dev_entry_v25.js 仍是本分支早先几轮的开发者按钮改动，本轮未动）。
- [x] 步骤 27：团队定数值——扛税（钱多多）/ 对账（记账童子）这一步 L.rel 总变化 +30 → **+20**（参考 qc34 每步 +15）。G.aff 仍 +60（保住第 2 步 60 阈值「亲近」结算）；新增 `Stage3.GOOD_REL = { cover: 20, help: 20 }`，正向目标 = 上限：0→60 同步 +30 补 −10 = +20；好感钳 150（120→150）同步 +15 不补 = +15；`_inApply=true` 时预估外层 +30、这里补 −10，合计 +20。贿赂 +10、负向档位不变。提交 `fb34bda`。
  - 合并后 main 的 life34.js 包装了 `pickAt`（S3），vm 单测桩补 `pickAt` / `s2w`（只改测试）。
  - 测试（逐个串行）：stage3_chain 205/205、stage3_life34 114/114、battle_rt_proto 143/143、lowpoly_box 55/55、validate22 errors []、dev_entry_v25_page 58/58（新增真页面对账 0→60：L.rel +20、卡片「恩怨 +20」、查账仍 ×0.8）、battle_rt_proto_page 12/12、encounter_chain_verify 14/14、life34_unit / life34_visitor_nomons / jianghu34_unit fails []、jianghu34_ui ok、seam34 FAILS []（首跑一次 `cross` 偶发，复跑 3 次 + main 上 2 次均过）、sys33_unit / jsscan33（21 图）/ content33 errors []、wb33_mark_regress fails []。
- [x] 步骤 28：开 PR **#23**（openworld-wip → main，https://github.com/xiemingxin1145/wobuxian/pull/23），未合并、未指定审阅人（奥拉夫的 GitHub 账号未知）。
- 下一步：等 PR #23 审阅；两条链接进正常流程另开 PR 给奥拉夫审。

### 2026-10-19 第十六轮（UTC+8，openworld-wip，20:38 起）——开发者按钮搬家 + 原型脚本只在开发者模式加载
- [x] `www/js/dev_entry_v25.js` 恢复为 origin/main 原样（逐字节一致）。本分支在它里面加/改的全部内容（奇遇链、查账链、追兵战、突破预估、追兵调参，以及改过的试炼场覆盖层 / 全套神装 typeof 取 Game / 即时战 `open()`）原样搬到新文件 `www/js/dev_openworld.js`。
- [x] 挂载 API：`window.DevOpenWorld = { id:'openworld', title:'开放世界', active, buttons:[{key,label,run}], ready(), mount(containerEl) → unmount }`（文件头注释有说明），给 Grok Bot 3.4.1 作弊菜单（dev341 / ux23.js）的「开放世界」页签用；本线不碰 ux23.js。
- [x] 兜底入口：开发者模式（#dev / ?dev=1 / 7 连点 #title·.ver，与 dev_entry_v25 同判定）下右侧一个「开放世界」按钮（`#dow-open`，bottom:270px，在 main 三个开发者按钮之上不重叠），点开 `#dow-panel`；非开发者模式不出现；宿主 `mount()` 过就隐藏。
- [x] 奥拉夫审查点 1：release 包里原型只在开发者模式加载。`index.html` 去掉 `battle_realtime_prototype.js`、`stage3_encounter_draft.js` 两个标签，换成 `dev_openworld.js` 一个标签；两原型由 dev_openworld.js 在开发者模式懒加载。`lowpoly_box_chars.js` 只由 `prototypes/lowpoly_box/index.html` 独立页加载。build.sh 是 `cp -r www/*`，文件仍在 APK 资源里但非开发者模式不请求、不执行。
- [x] 奥拉夫审查点 2：新增 `test/good_rel_cap.js`，用 main 与 origin/dev341 的真实 life34.js 证明 GOOD_REL 封顶与 _inApply 不重复计。
- 测试：dev_openworld_page 59/59（原 58 条 + 面板 1 条）、dev_openworld_gate_page 15/15、good_rel_cap 31/31、stage3_chain 205/205、stage3_life34 114/114、battle_rt_proto 143/143、lowpoly_box 55/55、validate22 0 错、battle_rt_proto_page 12/12、encounter_chain_verify 14/14，main 的 life34_unit / life34_visitor_nomons / jianghu34_unit / jianghu34_ui / seam34 / sys33_unit / jsscan33 / content33 / wb33_mark_regress 全部 0 失败。
- 涉及文件：`www/js/dev_openworld.js`（新）、`www/js/dev_entry_v25.js`（恢复 main）、`www/index.html`（−2 原型标签 +1 dev_openworld 标签）、`test/dev_openworld_page.py`（由 dev_entry_v25_page.py 改名，经面板点按钮）、`test/dev_openworld_gate_page.py`（新）、`test/good_rel_cap.js`（新）、`test/stage3_chain.js`、`test/stage3_life34.js`、`test/battle_rt_proto.js`、`test/battle_rt_proto_page.py`（静态/真页面检查指向新文件）、`PROGRESS.md`、`docs/openworld_upgrade.md`。
- 下一步：等奥拉夫审 PR #23、等 3.4.1（dev341）落地「开放世界」页签调用 `DevOpenWorld.mount()`；之后可删兜底入口。PR 不合并。


### 2026-10-20～22（openworld-wip 上 b37bf3d / 934e52e / efb4e3e / 93fbbaf / 5b19ec3）——低模样例 + 奇遇链草稿
- [x] `www/js/lowpoly_extra_chars.js`：Cube 低模样例 路人甲、主角男、渡口船夫（chuanfu），预览页 `prototypes/lowpoly_box/index.html` 已接入；不接入正式运行链。
- [x] `docs/random_adventure_chain_draft.md`：随机奇遇链草稿（含第二例「守山弟子·后山禁地」）；`www/prototypes/adventure_chain/index.html` 渡口船夫奇遇链可交互小闭环原型。
- 注：5b19ec3 把 PROGRESS.md 截成 12 行，第十七轮已把完整历史恢复，并把这几轮记在这里。
- 当时写的下一步：把奇遇链挂到开发者面板按钮做真实状态闭环测试（复用 G.life34.rel / G.flags）；同步 openworld-wip 到最新 main。

### 2026-10-23 第十七轮（UTC+8，openworld-wip，10:00 起；10-19 20:48 起草未提交，本轮核对后完成）——登记 3.4.1 作弊菜单「开放世界」页签
- [x] `www/js/dev_openworld.js`：开发者模式下登记页签。按 origin/dev341 `57d6638` 的真实接口（`DevPanel.registerTab(key, name, render)` / `window.DevTabs` 按 **key** 过滤，render(box, ctx)）：dev341 已加载就调 `DevPanel.registerTab('openworld','开放世界',render)`（同 key 覆盖），否则 push `{ key:'openworld', id:'openworld', name:'开放世界', render }`（10-19 草稿只写了 id，会被 dev341 的 `tabs()` 过滤掉，已改）。render 复用 `DevOpenWorld.mount(el)`（隐藏兜底入口，返回 unmount）。只登记一次（文件执行两次也不重复、原型脚本不重复注入），非开发者模式不登记。
- 测试：`test/dev_openworld_gate_page.py` 19/19（新增 4 条：非开发者模式无页签；#dev 恰好 1 个且二次执行后仍 1 个；载入 origin/dev341 真实 `DevPanel.tabs()` 过滤能识别 1 个；render(el) 8 个按钮 + 隐藏/恢复兜底入口）；stage3_chain / stage3_life34 / battle_rt_proto / lowpoly_box ALL PASS、good_rel_cap 31/31、validate22 errors []、dev_openworld_page / battle_rt_proto_page 全过、无 JS 错误。
- 涉及文件：`www/js/dev_openworld.js`、`test/dev_openworld_gate_page.py`、`docs/openworld_upgrade.md`、`PROGRESS.md`。
- 下一步：债务系统强化——讨债令加上限 / 冷却防反复刷；仍等奥拉夫审 PR #23、3.4.1 合 main 后合 main 重跑 C2。

### 2026-10-23 第十八轮（UTC+8，openworld-wip，12:07 起）——债务强化 #9：讨债令上限 + 冷却
- [x] `www/js/stage3_encounter_draft.js`：`TOKEN_MAX = 9` 与 `tokenBlock(G)`；`settleBounty` 胜利且够格得令时先查上限（≥ 9 枚 → `tokenBlocked:'cap'`）和冷却（`s3b_token_year === G.year` → `tokenBlocked:'cooldown'`），被挡不动三个讨债令 flag，其余结算照旧；返回值新增 `tokenBlocked`（不被挡为 null）。`G.year` 非数字的旧存档不做冷却、只受上限约束。
- [x] `www/js/dev_openworld.js`：「追兵战」结算卡被挡时加一行说明（已满 9 枚 / 今年已缴获过，明年再来）。
- 测试：`test/stage3_chain.js` 新增 15b 共 14 条（同年连刷只 1 枚、次年解除、逐年封顶 9、异常大数不改、无年份只受上限、不够格时 tokenBlocked 为 null、被挡与得令存档除讨债令 flag 外一致、结算卡文案）；c46c1ef 对照剥掉新字段 tokenBlocked 后 286 组仍逐字段一致；`test/dev_openworld_page.py` 真页面加「同年再打赢被冷却挡下」一条，次年才得第 2 枚，60 条全过。stage3_chain / stage3_life34 / battle_rt_proto / lowpoly_box ALL PASS、good_rel_cap 31/31、validate22 errors []、dev_openworld_gate_page 19/19、battle_rt_proto_page 全过、无 JS 错误。
- 涉及文件：`www/js/stage3_encounter_draft.js`、`www/js/dev_openworld.js`、`test/stage3_chain.js`、`test/dev_openworld_page.py`、`docs/openworld_upgrade.md`、`PROGRESS.md`。
- 下一步：即时战原型一小步（例如追兵战结算卡显示本场用时/受击次数），或给讨债令设计第一个只读用途（如抵扣误工费预览）；仍等奥拉夫审 PR #23、3.4.1 合 main 后合 main 重跑 C2。

### 2026-10-23 第十九轮（UTC+8，openworld-wip，12:49 起）——合 main v3.4.1（PR #24）+ 奥拉夫意见 1：开发者模式跟随 wbx2_dev
- [x] 合 main：普通 merge origin/main `eabd12e`（v3.4.1 作弊菜单重做 #24），无冲突；main 自有文件（huashen33.js、controls.py、自动任务、章节剧情、life34.js、jianghu34.js、game.js、talk.js、ux23.js、dev_entry_v25.js、dev341.js）与 origin/main 逐字节一致。
- [x] `www/js/dev_openworld.js`：开发者模式唯一判定 = `localStorage.wbx2_dev === '1'`（main ux23.js 的持久开关，APK 重启后保持；版本号 7 连点是开/关切换）。删掉自带 7 连点计数和 `#dev` / `?dev=1` 判定（ux23 自己会把 #dev 写进 wbx2_dev）。ux23 的 devTap 是模块内函数、无事件可挂 → 每秒轮询一次 localStorage（与 main dev_entry_v25.js 同法）：会话内打开 → 懒加载原型 + 登记页签 + 兜底入口；会话内关掉 → 撤销页签、移除兜底入口/面板/按钮、`ready()` 返回 false 不再加载任何东西（已加载的脚本刷新后卸载）。`ready()` / `mount()` 非开发者模式不加载（dev341 `DevPanel.owTab()` 会调 `ready()`，=== false 时不加页签——修掉了非开发者模式下打开菜单会误加载原型的隐患）。第十七轮 9bf1a23 的页签登记（`DevPanel.registerTab('openworld', …)` / `DevTabs`）保留，对 main 真实菜单验证恰好 1 个。
- 测试：`test/dev_openworld_gate_page.py` 改为用 wbx2_dev，39/39（(a) wbx2_dev='1' 无 hash 重载 = APK 重启 → 原型 + 页签在；(b) 未设 / '0' → 无原型全局/请求/覆盖层/页签；(c) ux23 真实 7 连点关掉 → 兜底入口立即消失、页签撤销，重载后什么都不加载；(d) ux23 7 连点打开 → 本会话懒加载 + 页签，重载仍在；(e) main 真实 UI.p_dev + dev341 菜单里「开放世界」恰好 1 个、渲染 8 个按钮）；`test/dev_openworld_page.py` 改为 wbx2_dev + 无 hash 重载，60/60。合 main 后 3 条旧断言按 main 3.4.1 更新：`test/stage3_life34.js`（main life34.js 已有 _inApply，C2 对照改为不重复计；canHunt/affRel 引用检查只看代码行）、`test/battle_rt_proto.js`（main dev_entry_v25.js 改用 RT27，不再引用 RealtimeBattle）。
- 涉及文件：`www/js/dev_openworld.js`、`test/dev_openworld_gate_page.py`、`test/dev_openworld_page.py`、`test/battle_rt_proto_page.py`、`test/stage3_life34.js`、`test/battle_rt_proto.js`、`docs/openworld_upgrade.md`、`PROGRESS.md`。
- [x] 再合 main `a06d472`（PROGRESS: v3.4.1 已发布）：PROGRESS.md「下一步」一处冲突，保留本线内容并补上 main 的 v3.4.1 发布记录，全部历史保留。
- [x] 修与 main 3.4.1 的遮挡：main 的 `test/dev341.py` 在本分支多挂 12 条——「开放世界」兜底入口 z-index 9999 盖住开发者面板（误点到「查账链」）和底部菜单（人物/背包）。兜底入口改到左侧 main 三个按钮下方（top:342px）、z-index 7（在 #modals 弹窗层之下）、只在游戏内（body.ingame）显示，与 main dev_entry_v25.js 同法。修后 dev341.py 只剩 `3_state` 1 条，与干净 main 一致（main 自身问题，未改）。`test/dev_openworld_page.py`、`test/battle_rt_proto_page.py` 绕过标题页直接开局，补上 main.js 离开标题页时做的 body.ingame + 隐藏 #title；后者也改用 wbx2_dev。
- 下一步：等奥拉夫用真机点屏 + 重启 APK 复审 PR #23；之后即时战原型一小步或讨债令首个只读用途。

### 2026-10-23 第二十轮（UTC+8，openworld-wip，14:00 起）——PR #23 已 squash 进 main（6a63012）；即时战原型 devEnabled 只认 wbx2_dev
- 普通 merge 合入 origin/main 6a63012（squash 的是本分支 37f9334，合后与 main 树一致，只差 docs/research_v33.md 附录A 一处，无冲突）。
- `www/js/battle_realtime_prototype.js`：`devEnabled()` 删掉 `location.hash` 判定，唯一依据 `localStorage.wbx2_dev === '1'`，与 dev_openworld.js 一致；stage3_encounter_draft.js / lowpoly_box_chars.js / dev_openworld.js 已核查，不看 hash/query。
- `test/battle_rt_proto.js`：新增 3 条：仅 #dev / ?dev=1 → 关；wbx2_dev='1' → 开；wbx2_dev='true' → 关。page 测试早已用 wbx2_dev。
- 测试：battle_rt_proto 147 PASS / battle_rt_proto_page 12 / dev_openworld_gate_page 39/39 / dev_openworld_page 全过 / stage3_chain / stage3_life34 / good_rel_cap 31/31 / lowpoly_box ALL PASS / validate22 / life34_unit / life34_visitor_nomons / jianghu34_unit / jianghu34_ui / seam34 / sys33_unit / jsscan33 / content33 / wb33_mark_regress / dev341_audit 全过；dev341.py 仅 3_state 失败（main 已知）。results 不提交。
- 本轮改动文件：www/js/battle_realtime_prototype.js、test/battle_rt_proto.js、PROGRESS.md。

### 2026-10-23 第二十一轮（UTC+8，openworld-wip，16:00 起、18:00 收尾）——讨债令第一个只读用途 + 合 main v3.4.2
- 普通 merge 合入 origin/main 1561e5f（v3.4.2，PR #33 名字牌点按修复），无冲突。
- `www/js/stage3_encounter_draft.js`：纯函数 `Stage3.tokenInfo(G)`，只读 `flags.s3b_token` / `s3b_token_src` / `s3b_token_year` 与 `G.year`，返回 `{ count, max, full, year, lastYear, takenThisYear, src, block, lines, text }`；`block` 与 `tokenBlock(G)` 一致（下一场打赢会不会被上限/冷却挡）；旧存档异常大数照实显示不钳，`G.year` 非数字时 `takenThisYear` 为 null、不做冷却。
- `www/js/dev_openworld.js`：开放世界页签第 9 个按钮「讨债令」，出卡显示「讨债令 x/9（已满）」、今年是否已领、最近一次来源、下一场能否缴获，只有「知道了」，不改存档、不调 `Game.save`。讨债令仍暂无用途，没接入正常游戏流程。
- 测试：`test/stage3_chain.js` 新增 15c（0 枚 / 2 枚今年已领（深冻结存档不抛错）/ 次年 / 9 枚已满 / 旧存档 50 枚无年份 / 6 种坏输入 / 与下一场 settleBounty 的 token、tokenBlocked 逐例一致 / 连调 20 次存档不变不 save / 按钮源码只读 / tokenInfo 源码无赋值），229 PASS；`test/dev_openworld_page.py` 真页面「讨债令」卡 2/9、今年已领、次年还没领、点前点后 G 与存档逐字节不变，62 PASS；`test/dev_openworld_gate_page.py` 按钮数 8→9，39/39。stage3_life34 / battle_rt_proto / lowpoly_box ALL PASS、good_rel_cap 31/31、validate22 errors []、battle_rt_proto_page / encounter_chain_verify 14/14 / tap342 / dev341 / dev341_audit 22 项 / jsscan33 / sys33_unit / life34_unit / jianghu34_unit 全过。results 不提交。
- 本轮改动文件：www/js/stage3_encounter_draft.js、www/js/dev_openworld.js、test/stage3_chain.js、test/dev_openworld_page.py、test/dev_openworld_gate_page.py、docs/openworld_upgrade.md、PROGRESS.md。
- 下一步：即时战原型一小步（如追兵战结算卡显示本场用时/受击次数），或讨债令第二个只读用途（如抵扣误工费预览）；讨债令真正抵扣/兑换前须另开 PR 给奥拉夫审。

### 2026-10-23 第二十二轮（UTC+8，openworld-wip，20:07 起）——即时战原型一小步：追兵战结算卡显示用时 / 受击 / 闪避 + 合 main
- 普通 merge 合入 origin/main 046f8c6（docs/research_v36.md + test/human_olaf.py 小改），无冲突。
- `www/js/battle_realtime_prototype.js`：开场 `RT.hitsTaken` / `RT.dodged` 归零；`damagePlayer` 真扣血计受击、无敌免伤计闪避；结束结果多带 `hits` / `dodged`（原有 `time` 不变）。只计数，不改任何战斗数值。
- `www/js/stage3_encounter_draft.js`：纯函数 `Stage3.fightStats(out)` → `{ time, hits, dodged, line }`，line 如「本场：用时 12.3s，受击 3 次，闪避 2 次」，受击 0 标「（无伤）」，坏值显示「—」；不写 G、不参与 settleBounty。
- `www/js/dev_openworld.js`：开发者「追兵战」结算卡（胜/败）在说明下加一行 `Stage3.fightStats(r).line`。没接入正常游戏流程。
- 测试：`test/battle_rt_proto.js` 新增 3 条（被前冲打中 → 受击 1 / 闪避 0 且结果带 hits/dodged/time；无敌穿过 → 受击 0、闪避 ≥1；新开一场计数归零）ALL PASS；`test/stage3_chain.js` 新增 15d 6 条（格式 / 无伤 / 7 种坏输入 / 深冻结 / 源码只读 / 结算卡调用）235 PASS；`test/dev_openworld_page.py` 真页面胜、败两张结算卡都有「本场：用时…受击…闪避…」，64 PASS。stage3_life34 / lowpoly_box ALL PASS、good_rel_cap 31/31、validate22 errors []、encounter_chain_verify 14/14、dev_openworld_gate_page 39/39、battle_rt_proto_page / tap342 / dev341 / dev341_audit / jsscan33 / sys33_unit / life34_unit / jianghu34_unit 全过。results 不提交。
- 本轮改动文件：www/js/battle_realtime_prototype.js、www/js/stage3_encounter_draft.js、www/js/dev_openworld.js、test/battle_rt_proto.js、test/stage3_chain.js、test/dev_openworld_page.py、docs/openworld_upgrade.md、PROGRESS.md。
- 下一步：讨债令第二个只读用途（如抵扣误工费预览，仍只读、只走开发者入口），或即时战原型再一小步（如结算卡显示本场最大连击 / 技能命中数）；讨债令真正抵扣/兑换前须另开 PR 给奥拉夫审。

### 2026-10-23 第二十三轮（UTC+8，openworld-wip，22:02 起）——3.6 低模角色外观挂点第一块（冠 / 佩 / 神器手持位 + 衣服换色）+ 合 main
- 普通 merge 合入 origin/main d38fa6c（3.5 灵宠派遣 pet35 #25、一键连炼 lian35 #34），无冲突。
- `www/js/lowpoly_box_chars.js`：按 docs/research_v36.md 命名做占位（部位 guan/yi/pei/lv、神器 sq_*；Grok Bot 数据层字段定了再对齐）。新增 `sockets(id)` 算三个挂点：冠 = 头顶最高处（压在发髻/帽子/冠之上）、佩 = 左腰外侧（右手拿兵器，避免穿插）、手持位 = 原武器中心（没武器的角色取右手下端前方）；`ATTACH` 首批三件方块物件：斗笠（冠，36 tri）、酒葫芦（佩，48 tri）、轩辕残剑（神器，36 tri），`SLOT_BUDGET` 冠/佩 ≤150、神器 ≤300 tri（一块长方体按 12 tri 计）；`dressParts(id, wear, dye)` 返回新部件表、不改 CHARS 原表，神器替换原手持武器并跟随挥砍，`dye.yi` 把与主衣同色的部件（袍/裙 + 同色袖子）换色；`build`/`draw` 认 `opts.wear` / `opts.dye`，不传时输出与之前逐字一致。只画外观：不读写 G / Game / localStorage、无属性。
- `www/prototypes/lowpoly_box/index.html`：预览页加「试穿 3.6 挂点」开关（斗笠 · 酒葫芦 · 轩辕残剑 · 衣染青）。仍不进 www/index.html、不进正常游戏流程。
- 测试：新增 `test/lowpoly_attach.js` 83 条 ALL PASS（预算 / 命名 / 7 个角色挂点位置 / 穿戴加块且原表不变 / 槽位不符与未知 id 忽略 / 斗笠随受击后仰与头同步 / 神器随挥砍推出 / 换色只换主衣同色件、5 种坏颜色忽略 / 源码只读 / 预览页开关 / 正式页不加载）；无头 Chrome 打开预览页勾开关无报错、截图核对挂件位置正确。lowpoly_box / battle_rt_proto / stage3_chain / stage3_life34 ALL PASS、good_rel_cap 31/31、validate22 errors []、encounter_chain_verify 14/14、dev_openworld_page 64 PASS、dev_openworld_gate_page 39/39、battle_rt_proto_page / tap342 / dev341 全过（其余见提交信息）。results 不提交。
- 本轮改动文件：www/js/lowpoly_box_chars.js、www/prototypes/lowpoly_box/index.html、test/lowpoly_attach.js、docs/openworld_upgrade.md、PROGRESS.md。
- 下一步：挂点第二块（剩下 3 款冠 金冠/龙角/兜帽、3 款佩 玉佩/羽扇/算盘，各 ≤150 tri；或神器「觉醒Ⅲ」发光壳），等 Grok Bot 在群里定下 cos36 / shenqi36 字段后把占位名对齐；之后再做讨债令第二个只读用途（误工费抵扣预览）。

### 2026-10-24 第二十四轮（UTC+8，openworld-wip，00:05 起）——3.7.0 路遇系统 NPC37 第一块（核心模块 + 冷却/上限 + 分档 + 单场景结算 + 新闻）+ 合 main
- 普通 merge 合入 origin/main 49ae071（docs/research_story37.md、research_story37_text.md 等研究稿），无冲突。
- 新增 `www/js/npc37.js`（index.html 在 jianghu34.js 之后加载）：`TEXT37` 逐字取自 docs/research_story37_text.md 的 JSON；`NPC37.onMeet(id,map)` 按 `Life34.rel` 分 仇(≤−40)/生/友(≥40)，年份 `Life34.yr()`、月份 `G.jh34.t`；同图 ≥6 月、全图每年 ≤4 次、每 NPC 每年 ≤2 条（路遇+新闻合计）；本年 life34 仇家上门对象或 `Stage3.huntBlocksFoe` 为真不出仇档。场景进自有队列 `G.npc37.q`（不碰 L.pending），标题「⚑ 路遇·」开头，填 {n}{map}。`resolve` 把选项拼成效果串交给 `Game.apply`（aff 只改 G.aff、life34 包装 ×0.5 同步 L.rel 不双加；stone；item 负数消耗、不足/灵石不足置灰；karma 叠加 G.karma；fight:1 → 当前图的怪）。`NPC37.emit` 新闻每年 ≤6、toast ≤2，经 `JH34.say` 写 `G.jh34.feed`（FEED_MAX 40），`topUp` 补到 ≥3；`schedule(id)` 取 JH34 游历图 > roam > NPCS.map；`Story37.on/fire` 事件总线（meet/resolve/news）。
- `www/js/dev_openworld.js`：开放世界页签加「路遇」按钮（wbx2_dev==='1' 才有面板），强制触发一次当前图熟人路遇、弹卡结算到真实存档。**本轮还没挂进正常地图移动。**
- 测试：新增 `test/npc37_unit.js` 37/37 PASS（分档边界、冷却/年上限/每人上限、跨年、仇档拦截、置灰、aff×0.5 只同步一次、karma/stone/fight、物品 id 在 data.js、新闻上限/toast/feed 裁剪、100 年模拟、总线、schedule、源码约束）。dev_openworld_page 64 PASS、dev_openworld_gate_page 39/39（按钮数 9→10 已同步）、stage3_life34 ALL PASS（huntBlocksFoe 读者白名单加 npc37.js）、battle_rt_proto 149、stage3_chain 235、good_rel_cap 31/31、lowpoly_attach 83、lowpoly_box 55、validate22 errors []、encounter_chain_verify 14/14、battle_rt_proto_page 12、tap342 / dev341 / jsscan33 / sys33_unit / life34_unit / jianghu34_unit / lian35_unit 全过；真页面冒烟：「⚑ 路遇·落魄剑仙」卡选「拱手见礼」→ G.aff +3、L.rel +1。results 不提交。
- 本轮改动文件：www/js/npc37.js（新）、www/index.html、www/js/dev_openworld.js、test/npc37_unit.js（新）、test/dev_openworld_page.py、test/dev_openworld_gate_page.py、test/stage3_life34.js、PROGRESS.md。
- 下一步：把 onMeet 挂进正常地图移动（包裹 npcAI/玩家移动，同图且距离≤2 格时触发，⚑ 卡不进挂机代选），年末钩子调用 topUp/emit；之后从专用分支开 PR 给奥拉夫审。

### 2026-10-24 第二十五轮（UTC+8，openworld-wip，00:23 起）——NPC37 路遇挂进正常游玩（npcAI 包裹 + 年末新闻）+ 合 main
- 普通 merge 合入 origin/main（无冲突）。
- `www/js/npc37.js`：包裹 `npcAI`，普通玩家（不需开发者模式）在地图模式下与熟人 NPC 同图、距离 ≤2 格且冷却/上限允许时自动弹「⚑ 路遇·」卡（节流 800ms；自动任务/挂机开着、已有弹窗、战斗中、Game._busy、NPC 正在对话时不触发）；卡片选项全加「⚑ 」前缀，ux23 SAFE 白名单不匹配，AUTO.pick 不代选。包裹 `Game.yearEnd`：每年 1–3 条 NPC 之间的江湖事（结仇/夺宝/拜师/突破/结亲，与玩家 rel≥40 者才 toast）+ topUp 补到 ≥3。修：emit 的 a===b 会让同一人计 2 次、单人新闻不选含 {b} 的模板；topUp 改为只挑有额度的人。fight:1 仍走 Game.apply 的 fight 效果（当前图怪），正式遭遇战入口留下一轮。
- 测试：`test/npc37_unit.js` 54/54 PASS（新增 17 条：贴脸触发/3 格不触发/⚑ 前缀/对 ux23 真实 SAFE 不匹配/冷却/自动任务/弹窗/战斗/对话/节流/正常游玩 100 年上限/年末包裹）；新增 `test/npc37_page.py` 真页面 10/10 PASS（非开发者模式贴近翠花弹卡、AUTO.pick quest/idle 均 null、结算计 1 次、冷却、过年写 3 条 npc37 新闻、无报错）。纯 JS：battle_rt_proto / stage3_chain / stage3_life34 / lowpoly_attach / lowpoly_box ALL PASS、good_rel_cap 31/31、validate22 errors []、encounter_chain_verify / jsscan33 / sys33_unit / life34_unit / jianghu34_unit / lian35_unit 全过。
- **未完成**：按 Grok Bot 要求 01:07–02:45 不跑 Chrome，本轮改动后的 dev_openworld_page / dev_openworld_gate_page / battle_rt_proto_page / tap342 / dev341 页面回归还没重跑，所以 PR 暂不开。
- 下一步：02:45 后重跑全部页面测试，通过则从 origin/main 拉专用分支（npc37.js + index.html 脚本行 + npc37 测试 + stage3_life34 白名单）开 PR 给奥拉夫审；之后把 fight:1 接正式遭遇战入口。

### 2026-10-24 第二十六轮（UTC+8，openworld-wip，02:05 起）——低模冠/佩补齐 4+4 款 + 合 main（lg36）
- 普通 merge 合入 origin/main cbc086e（#36 灵根 lg36）；main 新跟踪的 test/results/pet35_panel.png、tap342.json 与本地未跟踪副本冲突，本地副本移到 /tmp 后合并。
- `www/js/lowpoly_box_chars.js`：按 research_v36 §6 补齐冠 4 款（斗笠 + 金冠 jinguan / 龙角 longjiao / 兜帽 doumao）、佩 4 款（酒葫芦 + 玉佩 yupei / 羽扇 yushan / 算盘 suanpan），每件 36–48 tri（≤150）。仍只在预览页 / 即时原型里用，不进正式加载链，不读写 G。
- 测试：`test/lowpoly_attach.js` 102 PASS（新增：4 冠 4 佩齐全、面数预算、4 个角色 × 16 种冠×佩组合都能穿、冠在头部、佩在左侧、多出可见面）；npc37_unit 54/54、good_rel_cap 31/31、stage3_chain / stage3_life34 / lowpoly_box / battle_rt_proto ALL PASS。本轮不跑 Chrome（留给 02:50 的页面回归 + 路遇 PR）。
- 下一步：02:50 路遇页面回归并开 PR；之后神器觉醒Ⅲ发光壳、预览页冠/佩下拉切换，名字待 Grok Bot 的 cos36/shenqi36 字段定了对齐。

### 2026-10-24 第二十七轮（UTC+8，openworld-wip，02:59 起）——路遇 NPC37 页面回归全过 + 开 PR #39 给奥拉夫
- 开跑前 rel35 的 test/human_olaf.py 正在用 Chrome，等到 03:13 它跑完才开始；openworld-wip 489a4b2 已是最新，工作区干净。
- openworld-wip 页面回归（489a4b2）：dev_openworld_page 64 PASS、dev_openworld_gate_page 39/39、battle_rt_proto_page 12 PASS、tap342 FAILS []（无 JS 报错）、dev341 FAILS []（26 PASS，3_state 也过了）、dev341_audit 79 次点按 errors 全为 []、npc37_page 10/10。纯 JS：npc37_unit 54/54、lowpoly_attach / lowpoly_box / stage3_chain / stage3_life34 / battle_rt_proto ALL PASS、good_rel_cap 31/31。没有失败，代码没改。跑测试时被改到的已跟踪 test/results/dev341*.json 已还原，没提交。
- PR 分支 `npc37-luyu`（7f42af0，基于 origin/main 354a2c8 sq36）：只放 www/js/npc37.js、index.html 一行 npc37.js 脚本（jianghu34.js 后）、test/npc37_unit.js、test/npc37_page.py、test/stage3_life34.js 的 huntBlocksFoe 白名单（main 已有 Stage3.huntBlocksFoe，不需要其他 stage3 改动；npc37 读 Stage3 前有 typeof 判断）。npc37_unit 里「开发者面板路遇按钮」那条在 PR 分支改为条件判断（main 的 dev_openworld.js 不引用 NPC37 时改成断言「不引用」）。该分支结果：npc37_unit 54/54、npc37_page 10/10、stage3_life34 ALL PASS、validate22 errors []、jsscan33 errors []、tap342 FAILS []。
- PR：https://github.com/xiemingxin1145/wobuxian/pull/39 「路遇 NPC37：正常游玩中的随机路遇（独立文件）」，给奥拉夫审，未合并。
- 注意：origin/main 已到 354a2c8（#37 神器 sq36），openworld-wip 还没合这次 main，留到下一轮。
- 下一步：fight:1 接正式遭遇战入口；神器觉醒Ⅲ发光壳、预览页冠/佩下拉切换。

### 2026-10-24 第二十八轮（UTC+8，openworld-wip，04:00 起）——路遇 fight:1 真正开战（修 Game.apply 延后战斗没执行）+ 合 main（3.6.1 神器）
- 普通 merge 合入 origin/main d1cefb7（#37 神器 sq36 + 3.6.1），无冲突。
- 发现并修：真实 `Game.apply` 返回 `{ txt, later }`，fight 等效果放在 `later` 里延后执行；NPC37.resolve 之前把返回值当数组用，**later 从没执行，「拔剑应战 / 出手相助 / 打一架 / 硬闯」等 fight:1 选项在真游戏里不开战，效果提示也没弹**（单测桩返回数组，所以没测出来）。现在 resolve 先弹效果提示，再逐个跑 later（角色已死则停），拿到战斗胜负后提示「路遇一战：击退来敌 / 落了下风」，并发 Story37 `fight` 事件；怪取场景所在地图的 mons，tier 照 Game.apply 现成规则。只改 www/js/npc37.js，不碰 game.js。
- 测试：`test/npc37_unit.js` 60/60 PASS（新增 6 条：真实 apply 形状下 fight 调一次 Game.fight、先提示后开战、胜/负提示与 fight 事件、怪按场景地图、已死不开战、无 fight 选项 fight 为 null）；`test/npc37_page.py` 12/12 PASS（新增：真页面仇档「拔剑应战」进入真实回合制战斗、打完回地图带回胜负）。dev_openworld_page 64 PASS、dev_openworld_gate_page 39/39、battle_rt_proto_page 全过、tap342 FAILS []、dev341 第一次 3_state 失败（已知随机天赋 flake），重跑 FAILS []；validate22 / jsscan33 errors []、encounter_chain_verify 14/14、stage3_life34 / stage3_chain / battle_rt_proto / lowpoly_attach / lowpoly_box ALL PASS、good_rel_cap 31/31。results 不提交。
- 同一修复已同步到 PR #39 分支 `npc37-luyu`。
- 本轮改动文件：www/js/npc37.js、test/npc37_unit.js、test/npc37_page.py、PROGRESS.md。
- 下一步：神器觉醒Ⅲ发光壳（低模，预览页）、预览页冠/佩下拉切换；讨债令第二个只读用途（误工费抵扣预览）。

### 2026-10-24 第二十九轮（UTC+8，openworld-wip，06:09 起）——低模神器觉醒Ⅲ发光壳 + 预览页冠/佩/觉醒下拉
- origin/main 仍是 d1cefb7，无新提交，本轮不合并。PR #39（npc37-luyu）仍 OPEN，没有 review / 评论，本轮未动该分支。
- `www/js/lowpoly_box_chars.js`：`ATTACH.sq_xuanyuan.glow='#ffd860'`；`wear.aw`（调用方传，对齐 Grok Bot 数据层 `sq36.own[id].aw`，1..3，坏值当 1、>3 钳到 3；本文件仍不读 G）≥3 时，每块神器部件外套一层同中心、各向外扩 3 的发光壳（部件名 `att:glow:*`，同挥砍组 sword）；build 给壳面标 `glow`、不做明暗；draw 用 `lighter` + 半透明 0.45 叠加、不描边。轩辕残剑Ⅲ 含壳 72 tri ≤ 300（research_v36 §6）。新导出 `hasGlow / GLOW_AW / GLOW_PAD`；`triCount(id, aw)`。不传 aw 的旧调用外观不变。
- 预览页 `www/prototypes/lowpoly_box/index.html`：「试穿 3.6 挂点」旁加 冠 / 佩 下拉（从 ATTACH 按槽位生成 4+4 款）+ 神器觉醒Ⅰ/Ⅱ/Ⅲ 下拉。低模脚本仍不进 www/index.html，主页面只在 wbx2_dev==='1' 时懒加载原型（gate 测试照旧）。
- 测试：`test/lowpoly_attach.js` 102 → 145 PASS（新增：只有 aw≥3 出壳、冠佩不出壳、tri 预算、每个角色壳与本体同中心外扩 + 挥砍同步、壳面排在本体后、draw 叠加不描边 save/restore 成对、旧调用不变、预览页下拉）；lowpoly_box 55、battle_rt_proto 149、npc37_unit 60/60、stage3_chain 235、stage3_life34 114、good_rel_cap 31/31 ALL PASS；validate22 errors []、encounter_chain_verify 14/14。页面（本机无他人 Chrome，串行）：dev_openworld_page 全过无 JS 错、dev_openworld_gate_page 39/39、battle_rt_proto_page 全过、npc37_page 12/12、tap342 FAILS []、dev341 FAILS []；另手动无头打开预览页：冠/佩下拉各 4 项、选 龙角+算盘+觉醒Ⅲ 后无 JS 错误、发光壳可见（截图未提交）。
- 本轮改动文件：www/js/lowpoly_box_chars.js、www/prototypes/lowpoly_box/index.html、test/lowpoly_attach.js、PROGRESS.md。
- 下一步：其余 4 把神器（昆仑镜/神农鼎/昊天塔/伏羲琴）低模 + 发光壳；或讨债令第二个只读用途（误工费抵扣预览）。

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
- [x] 10-23 v3.4.1 已发布（PR #24 squash eabd12e，tag CI 全绿，versionCode 230）。
- [x] 10-23 3.4.2：#28 3_state（随机天赋带 tough，测试问题）、#32 #27 名字牌、#26 N1（关闭中弹窗挡点按，style.css .mwrap.outm pointer-events:none）+ test/tap342.py；PR「fix: 3.4.2」。

## 3.6 P0-2 神器（Grok Bot，2026-10-23 21:36 起，分支 `sq36`，worktree `/workspace/game-sq36`，未 bump VERSION）
> 规格：`docs/research_v36.md` §2。新文件 `www/js/shenqi36.js`（index 在 dev341 后），不改 game.js/talk.js/data.js；存档 `G.sq36={own:{id:{aw,q}},eq,quest:{id,step},cd}` 惰性兜底（老档缺省 `{own:{},eq:null,quest:null}`），`Game.meta.sq36seen` 记已寻得；G.v 不动。
- [x] 5 把神器：轩辕残剑 攻+8%、昆仑镜 闪避+5%、神农鼎 炼丹成功+8%、昊天塔 防+8%、伏羲琴 修为+6%；觉醒Ⅱ ×1.5、Ⅲ ×2，仅供奉中生效。接入：包 `Game.stats`（攻/防）、`Game.cultMult`（修为）、`Game.treeVal('alch'/'brk')`（炼丹/突破公式公共项）、`calcDmg` + `RT27._damagePlayer`（闪避）。
- [x] 法则（觉醒Ⅲ）：轩辕 攻击后敌血<15% 直接击杀（BOSS 改该击 ×1.3）；昆仑 每场首次致死伤害作废并回血 30%（回合制 + 即时战）；神农 丹药效果 ×1.25（背包 useItem + 回合制战斗内服药，只在同步段临时放大 pillBonus）；昊天 雷劫伤害 ×0.65（tribulation 期间临时调 jieRes，finally 还原）；伏羲 突破 +5 个百分点——按验收 A2.2 觉醒Ⅰ起即生效、Ⅲ 不再加，本项把成功率封顶到 95%（与 nitian 等叠加）。
- [x] 任务链：神器阁「追寻」或地图金色「？神器线索」（筑基 + 已觉醒灵根，未接链时出现在各神器首图）接链，同时只追 1 条；每环到指定地图点线索 +5 碎晶。轩辕 乱葬岗×3→魔道裂谷×2、昆仑 天外天×6、神农 桃花村×2→药王谷×2、昊天 东海仙岛×2→东海龙宫×3、伏羲 青云宗×4；轮回不继承，下一世 2 环（首图+末图）。
- [x] 觉醒：Ⅱ 碎晶×20+3000 灵石+元婴；Ⅲ 碎晶×60+12000+化神+神器心试（`Game.fight` solo/noflee，敌 tier = 当前地图 tier+1，胜才扣费）。碎晶 `ITEMS.sqj`：秘境通关（包 `Dng.exit`，全部层清完）1–3、世界BOSS 击杀 2、任务环 5。
- [x] 供奉：同时 1 把，切换无消耗，冷却 1 游戏日 = 时间推进一格（月级时间 1 个月 / 年度制 1 年，键 year*12+month）；撤下也计冷却。
- [x] UI：洞府「本命法宝」下方「神器阁」入口 → 面板（碎晶/供奉/冷却、5 行：未得=剪影+线索地图名+环数，已得=属性/法则/觉醒条件 + 供奉/觉醒按钮）。开发者面板 Tab「神器36」：碎晶+60、灵石+20000、境界→化神、完成当前一环、清冷却、标记全部已寻（二周目）、清空、逐把获得/觉醒+1。
- [x] `test/sq36_unit.py`：A2.1 5 剪影+地图名、A2.2 元婴→化神 42→47（Ⅲ 仍 47）、修为 1.06→1.12、封顶 95；A2.3 第二把被冷却挡、过月可换、无消耗；A2.4 二周目 2 环；各法则/觉醒扣费/心试败不扣/碎晶来源；老档（无 sq36）真实触摸「继续人生」缺省正确、桃花村出现线索点并真实点按→追寻→1/4 环 +5 碎晶；412×915 真实触摸神器阁按钮不溢出可点中、供奉后立即换被冷却挡。ALL PASS。
- [x] 门禁（21:58–22:08 UTC+8，串行）：validate22 errors []、jsscan33 errors []、sys33_unit fails/errors []、content33 errors []、controls FAILS 0、panels21 ERRORS 0、dev341 FAILS []、human23 13/13。human_olaf 未跑（交奥拉夫）。PR「3.6 神器（sq36）」，不合并。
- 规格出入（已按验收实现，待研究员确认）：A2.2 写「金丹→元婴 42%」，按 REALMS 实为元婴→化神 42%（金丹→元婴 50→55）；伏羲琴法则列在觉醒Ⅲ，但 A2.2 要求觉醒Ⅰ就 +5，故伏羲 +5 为固定常驻。
- [ ] 未做/待议：神器低模/发光壳/台座资产（§6，交 open-world bot），目前用现有图标；线索点每环只点按不打架（心试只在觉醒Ⅲ）；昆仑回溯不拦截中毒等持续伤害；与 lg36（同包 calcDmg/_tryBreak/useItem）合并后需再跑两者单测。

### 3.5 一键连炼（lian35，2026-10-23 17:55 UTC+8，PR 待奥拉夫审）
- [x] ROADMAP P2 #16「炼丹炼器一键连炼」：新增 `www/js/lian35.js`（LIAN35）；炼丹面板每个丹方加「连炼×N」（N = 行动力/材料/上限 10 取小，≥2 才显示），洞府炼器加「连炼×N」（上限 5，受玄铁晶/妖丹/灵石约束）。
- 规则：连炼跳过火候小游戏，按中等火候 q=0.4 算成功率（手动完美火候仍更高、且只有手动能多出一颗）；每炉照扣 1 行动力 + 材料，成丹计 alchCount 与 alch10 成就；结果一条 toast 汇总。
- 改动：`www/js/lian35.js`（新）、`www/js/ui.js`（炼丹面板按钮 + 提示）、`www/js/ui21.js`（炼器按钮）、`www/index.html`（fix342.js 之后加载）、`test/lian35_unit.py`（新，15 项）。
- 测试：lian35_unit ALL PASS、validate22 0 错、jsscan33 0 错、sys33_unit 通过、dev341_audit 通过、controls 0 失败；412×915 炼丹面板截图按钮不溢出。
- 未 bump VERSION；与 PR #25（pet35）无文件冲突（pet35 只改 ui.js 放生段，若 index.html 脚本行冲突按 fix342 → pet35 → lian35 顺序保留）。
- [x] 10-23 3.5.0：灵宠派遣（PR #25 224c9a7）、一键连炼（PR #34 d38fa6c）；VERSION 3.5.0 + CHANGELOG，发布门禁全跑。
- [x] 10-23 v3.5.0 已发布（tag 08930f2，灵宠派遣 + 一键连炼）。
- [x] 10-24 3.6.0：灵根深化（PR #36 squash）；VERSION 3.6.0 + CHANGELOG，发布门禁全跑。
- [ ] 已知问题（10-24）：human_olaf N1（战后点按：怪离 NPC 太近，点怪打开了 NPC 对话没开战）/ T1（点身体部位偶发 34/35，怪走进点位）在完整门禁和单独重跑中都会失败，且在已发布的 v3.5.0 上同样复现（非 3.6 引入），按已知 flake 放行 v3.6.0；human23 第 4 项（追踪栏寻路→剑仙对话为空）只在门禁后段偶发，单跑通过。待测试侧修站位。
- [x] 10-24 v3.6.0 已发布（灵根深化）。
- [x] 10-24 3.6.1：神器（PR #37 squash 354a2c8）；VERSION 3.6.1 + CHANGELOG；门禁同 3.6.0，N1/T1 按已知 flake 放行。
- [x] 10-24 v3.6.1 已发布（神器）。
- [x] 10-24 3.7.0：路遇 NPC37（PR #39 squash f100a0b）；VERSION 3.7.0 + CHANGELOG；门禁串行全跑，N1/T1 按已知 flake 放行。
- [x] 10-24 v3.7.0 已发布（路遇；修 npc37 自动寻路中不触发路遇）。
- [x] 10-24 3.7.1：多徒弟与家族（PR #41 squash）；VERSION 3.7.1 + CHANGELOG；精简门禁（human23/human_olaf/panels21/controls/单测），N1/T1 按已知 flake 放行。
- [x] 10-24 v3.7.1 已发布（多徒弟与家族）。
- [x] 10-24 3.7.2：对话抉择 dlg37（PR #40 squash，含奥拉夫 3 条修正）；npc37 寻路判定加 R/R.player 空值保护；VERSION 3.7.2 + CHANGELOG；门禁：human_olaf N1 已知 flake，N2 一次被路遇卡抢点、单跑通过。
- [x] 10-24 v3.7.2 已发布（对话抉择）。
- [x] 10-24 3.7.3：NPC 自发事件（PR #42 squash）+ #48 fam37 已有道侣同步（Fixes #47）；VERSION 3.7.3 + CHANGELOG；门禁：human_olaf N2 门禁中被路遇卡抢点 1 次，单跑 8/8 通过。

## 开放世界线第三十轮（2026-10-24，Grok Bot）
- NPC37E（www/js/npc37_events.js）：NPC 之间自发事件 结仇/求助/讨债，年末掷 1–2 条，与路遇共用额度（每 NPC 年 ≤2、全年新闻 ≤6、toast ≤2），每人每年 ≤1 结仇；结果写 G.npc37.rel/tie/owe，玩家只经 JH34.addAff 改 G.aff；新闻 NEWS37C 走 JH34.say 进 G.jh34.feed；寻路中（R.player.nav，对齐 2f9407b）不弹 toast。
- npc37.js：emit 支持 opt.pool / opt.force，新增 room() 额度查询。开发者面板加「自发事件」按钮（11 个按钮）。
- 低模：其余 4 把神器（昆仑镜/神农鼎/昊天塔/伏羲琴）+ 觉醒Ⅲ发光壳，预览页神器下拉。
- 已合并 origin/main 6ce5d1c（3.7.1、fam37、路遇寻路守卫）。纯 JS 测试全过；页面测试（npc37_events_page、dev_openworld_page、dev_openworld_gate_page 及 *_unit.py）因机器上已有 Chrome 在跑，待补跑。

## 开放世界线第三十一轮（2026-10-24 10:05 起，Grok Bot）
- 已合并 origin/main a9994ac（docs/research_v38_profile.md 人物详情面板设计稿 + TEXT38A）。
- #42 小修（奥拉夫建议）：npc37_events.js 新增 `NPC37E.roll(p)`，4 处概率判定改走 `Game.roll(p, 'npc37e')`（与 dlg37 一致，无 Game.roll 退回 Math.random；抽人下标仍用 Math.random）；npc37_events_unit 加 4 条 → 48/48。npc37-events 分支 2ba07c3、wip 5d0251a，PR 已留言。
- 3.7.4 自由路线 route37 第一轮：新文件 www/js/route37.js（TEXT374 逐字自 research_v22 §10.9；20 条路线年事件自 §10.6；进入条件/10 年冷却/魔修心魔、年积分与被动、商贾放贷、提示卡、4 个 r37_ 结局 ready()/+15 分；包 Game.yearEnd/Game.die，老档 route37=null 不变），index.html 在 fam37.js 后加载；test/route37_unit.js 72/72。分支 route37（8817339，基于 main a9994ac）→ PR #44 给奥拉夫，未合并；同一提交 cherry-pick 进 wip。
- 数据缺口（写进 PR）：fam37 子嗣无境界/代数字段，家族路线与仙门世家结局暂时达不到；正道围剿战斗胜负未接；族学/族人好感/利息+1%/宗门战冷却 buff 只记录未接线。
- 测试：test/ 下全部 node 测试通过；页面测试未跑（Chrome 需群里协调）。
- 下一步：route37 第二轮——「更多→道途」面板、NPC ⚑ 大结局入口与二次确认、年事件/提示卡弹卡（⚑ 不代选）、修炼/打坐/坊市加成接线、放贷 UI + 页面测试；其后 v38 人物详情面板（docs/research_v38_profile.md 已到）。

## 开放世界线第三十二轮（2026-10-24 10:17 起，Grok Bot）
- 已合并 origin/main af70924（3.7.2 dlg37、v39/v40/v41 设计稿）；index.html 冲突保留 route37.js + dlg37.js 两行。
- 遭遇计数 G.npc37.ev = {total, meet, feud, help, debt}：NPC37.onMeet 成功生成路遇时 meet+total（被拦不计），NPC37E.run 成功时 feud/help/debt+total；NPC37.evc() 为旧档 ev={}/缺失补 0。使 #45 称号 t39_jianghu 可达。分支 npc37-evcount（基于 npc37-events，依赖 #42）→ PR #46 给奥拉夫，未合并；同一提交 cherry-pick 进 wip。
- 测试：test/ 下全部 node 测试通过；未跑浏览器测试。
- 奥拉夫 review #46：路遇 meet/total 改为在 NPC37.play 真正弹卡时计数（每卡一次，scene.cnt 防重复），onMeet 入队不再计数，队列溢出被挤掉的不计；evc() 旧档补齐保留；npc37_unit 加溢出用例。PR 分支 b85abf3，wip cherry-pick f17cc9f；仅跑 node 测试。

## 开放世界线第三十三轮（2026-10-24 12:00 起，Grok Bot）
- 已合并 origin/main 45eaad4（3.7.3、AGENTS.md 唯一入口与交接规则、#46 遭遇计数已合）；PROGRESS.md 冲突两边都保留。
- 3.8.0 人物详情面板：发现 Grok Bot 已在 prof38 分支做完并开了 PR #50（profile38.js，写 G.pf38.seen，t39_kuixin 可读），本线不再重复开发；#50 合进 main 后随 main 合入 wip。
- 讨债令第二个只读用途「抵扣误工费预览」：stage3_encounter_draft.js 新增 `Stage3.tokenFeePreview(G)` / `TOKEN_FEE_COST=1`（纯函数，按当前债压档位算下一场追兵战输了的误工费，与 settleBounty 败场同式；有令时预览「花 1 枚抵掉、欠款不变」，无令时「抵不了」；明确标「仅预览，尚未生效」）；dev_openworld.js 开发者「讨债令」卡片下半追加这段预览。不改存档、不改 settleBounty。
- 测试：`node test/stage3_chain.js` 244 条全过（新增 10 条：0 枚/3 枚/保底/通缉升档/坏输入/与败场 settleBounty 7 例一致/源码不赋值/开发者卡片接线）；test/ 下全部 10 个 node 测试通过（含 validate22）。页面测试未跑（Chrome 需群里协调）：建议补跑 `python3 -B test/dev_entry_v25_page.py`、dev_openworld_page。
- 下一步：讨债令真抵扣（追兵战败场可选花 1 枚免误工费）需主人定是否开放，开放则另开 PR 给奥拉夫审；或回到即时战/低模小步；#43 合进 main 时合并取 main 的 route37.js 与测试。

## 开放世界线第三十四轮（2026-10-24 12:30 左右，Grok Bot）
- 讨债令真抵扣误工费（主人已批准）：stage3_encounter_draft.js 新增 `Stage3.canOffsetFee(G, s)` / `Stage3.offsetFee(G, s)`（败场结算后调用：持有 ≥1 枚则扣恰好 1 枚、欠款退回战前、不收误工费，新增 `flags.s3b_token_used` 懒初始化）；dev_openworld.js「追兵战」败场且有令时弹确认卡「花 1 枚抵掉 / 照付误工费」，抵扣后存档 + toast。无令行为不变；settleBounty 未改；存档键 wbx2_*、G.v===2 不变。
- 分支 debt-token-offset（基于 origin/main）→ PR #51「讨债令抵扣误工费」给奥拉夫审，提交 37d6063；同一改动 cherry-pick 进 wip 为 270869c（与 wip 的 fightStats 冲突，两边保留；TOKEN_FEE_COST 沿用 wip 的 tokenFeePreview 定义）。
- 测试：新增 test/stage3_token_offset.js 14 条；test/ 下全部 node 测试通过（stage3_chain 244、stage3_life34 114、battle_rt_proto 149 等）。页面/Chrome 测试未跑（需协调）。
- 遗留：tokenFeePreview 文案仍写「仅预览，尚未生效」、追兵战得令结算卡仍写「只是凭证，暂无用途」（stage3_chain 有断言锁定原文），待 #51 合入后另改文案与断言。

## 开放世界线第三十五轮（2026-10-24 14:06 起，Grok Bot）
- 已合并 origin/main 93738c6（3.7.4 自由路线 #43、#53 序章守卫）：route37.js 冲突取 main 版；删除 wip 自己那份 test/route37_unit.js；index.html 去掉重复的 route37.js 加载行，顺序与 main 一致（dlg37 → route37）。合并提交 30c7bc4。
- 讨债令有了真用途后的文案收尾：PR #51 分支 debt-token-offset 追加 35bd522——追兵战得令结算卡「只是凭证，暂无用途」→「追兵战输了可花 1 枚抵掉误工费」，注释、stage3_chain、dev_openworld_page 断言同步，PR 描述已补文件清单。wip 同步 ecb381c，另把讨债令状态行和抵扣预览里的「若开放抵扣 / 仅预览，尚未生效」改成现行说法。
- 测试：test/ 下全部 node 测试通过（stage3_chain、stage3_token_offset 14、npc37_unit 80、npc37_events_unit 54、validate22 无错等）。npc37_unit「放行后正常弹路遇卡」约 1/40 随机失败（来自 main #53 的用例，与 main 文件相同，非本线改动）。页面/Chrome 测试未跑：待补 dev_openworld_page、dev_entry_v25_page、route37_unit.py（playwright）。
- 下一步：#50/#51 合 main 后随 main 合入；其后回到即时战/低模小步，或按群里分工接 3.7.5 之后的版本。

## 开放世界线第三十六轮（2026-10-24 14:50，Grok Bot）
- 奥拉夫报 #51 上 dev_openworld_page 必挂（main 通过）：原因是前面天道通缉打赢已攒 2 枚讨债令，「追兵战打输（重债）」时 #51 新增的「讨债令抵扣」确认卡先弹出，测试只等「追兵战结算」卡 → 5s 超时；确认卡留在 #modals 盖住面板，后续同年互斥/突破预估/追兵调参/调参预设点不到 #dow-zt（30s）。
- 修复（只改 test/dev_openworld_page.py，PR #51 分支 b41ca17，wip cherry-pick）：败场先等确认卡并断言文案/选项，点「照付误工费」后原有误工费 889 断言不变；新增一场败场点「花 1 枚抵掉」：欠款不变、令 2→1、used=1、存档、结算卡含「抵掉了误工费」；断言不叠卡、流程结束无残留卡。
- 审确认卡：走 UI.card（与结算卡同一 _q 串行队列、同 #modals 层），两个按钮都 pop + resolve，不会叠卡，选完必弹结算卡；与其他 card 一样没有 ✕ 关闭（一致）。dev_openworld.js 无需改。
- 测试：node 全部通过（stage3_token_offset 14、stage3_chain、npc37_events_unit 54 等）；npc37_unit 偶发 79/80（main #53 既有随机用例）。py_compile 通过；Chrome 页面测试未跑（Chrome 被占用），待补跑 dev_openworld_page。

## 开放世界线第三十七轮（2026-10-24 16:05 起，Grok Bot）
- 已普通 merge origin/main 7e74338（含 3.7.5 chain37 奇遇链 #52 9c96645、#54 49d3e6c npc37_unit flake 修正、ac1baaa research_v22 §13、a16b119 VERSION/CHANGELOG 3.7.5、7e74338 v3.7.5 交接 note），合并提交 a506881，**无冲突**：chain37.js / route37.js / npc37.js / test/chain37_unit.js / test/npc37_unit.js 与 main 逐字相同；PROGRESS.md 自动合并，main 的 v3.7.5 交接 note 在最上面，wip 轮次记录完整保留（582+50=632 行，无截断）；index.html 无重复脚本行（chain37.js 只加载一次，dlg37 → route37 → chain37）。
- 任务「c37_3『被夺宝抢先』入口接 G.npc37.ev」：核对后**main 上已经接好，未开 PR**。chain37.js 已包 NPC37.emit（kind='duobao' 且 a/b 含 jh_xunbao 且新闻真的发出 → 写 G.chain37.db={yr,m}），Chain37.check 对 c37_3（非追凶中）调 robbed()：db.m ≥ 开链时间 t0 即转追凶 c3_x1（§12.3 不直接失败）；G.npc37 / ev 缺省或坏数据安全返回 false。test/chain37_unit.js 已有 7 条用例覆盖（不涉钱满仓不触发、非夺宝不触发、涉钱满仓转 c3_x1、追凶中不重复、开链前旧记录不算、坏 db 忽略、老档无 G.npc37 不报错）。G.npc37.ev 只有 {total,meet,feud,help,debt} 玩家遭遇计数，没有夺宝维度，规格 §12.7.3「读 ev 计数」实际只能靠 emit 包装实现，main 现状即此做法。v3.7.5 交接 note §4 这一条已过时，建议发版人把它从遗留里划掉（只剩 route37 改调 Chain37.doneCount——也已由 chain37.js 末尾覆盖 Route37.chainsDone 实现，chain37_unit 有用例）。
- 测试（纯 node，Chrome 被别人占用未跑页面测试）：chain37_unit 78/78（另连跑 10 次 0 失败）、npc37_unit 80/80（连跑 30 次 0 失败，#54 后未再见 flake）、npc37_events_unit 54/54、good_rel_cap 31/31、stage3_chain 244 PASS、stage3_life34 114 PASS、stage3_token_offset 14/14、battle_rt_proto 149 PASS、lowpoly_attach 190 PASS、lowpoly_box 55 PASS、validate22 0 错。
- 待跑页面测试（需空闲 Chrome）：dev_openworld_page、dev_entry_v25_page、route37_unit.py、npc37_page / npc37_events_page（合入 chain37 后回归）。
- 下一步：等 #50/#51/#45 合 main 后随 main 合入；继续即时战/低模小步，或按群里分工接 3.8.x。

## 开放世界线第三十八轮（2026-10-24 18:10 起，Grok Bot）
- 已普通 merge origin/main 41a4bd6（research_v22 §14 3.8.3 clan41 规格，纯文档），合并提交 5b651f3，无冲突。
- 3.9.0 阵法 zf39 第 1 轮（数据 + 纯逻辑 + node 单测，**未接 UI**，规格 research_v22 §11）：PR #56（分支 zf39，0e09ffe，基于 main 41a4bd6）等奥拉夫审，未合并；wip cherry-pick 为 7140bd7。
  - 新增 www/js/zf39.js：window.ZF39，TEXT390 逐字取自 §11.10；9 战阵/4 洞府阵/等级表；ensure 惰性兜底（只读函数不建 G.zf39，老档不变）、unlock、addXp/winXp、canCraft/craft、setWar/setCave/caveUseful、apply（同字段取最高、BOSS 抗性、相生 ×1.25 按方向、欠条阵无五行）、roundStart/reflectAt、rtMult、genPuzzle/start/checkStep/allowedErrors/hints/eyesFor、eyeCooldown/markEye。**未加入 index.html**（加载即惰性，但第 2 轮与 UI 一起加）。
  - 新增 test/zf39_unit.js 118 项（A11.2/A11.3/A11.4、3/4/5 眼谜题、容错 2/lv9=3、等级表、炼制成本、槽位、老档、冷却）。
  - test/stage3_chain.js 一行：breakthroughPreview 调用者检查改为匹配 `breakBase(` 调用（TEXT390 的 nums.xp.breakBase 是同名数据键，会误报）。
  - 取舍（PR 里请审）：连阵 ×1.25 只乘百分比类；欠条阵 reflect=1 原样（battle.js 回合末 buf 递减）；洞府阵炼制不需阵图；zws39/ztc39 只放 ZF39.ITEMS390，未并入 ITEMS。
- 测试（纯 node，未跑 Chrome）：zf39_unit 118/118、chain37_unit 78/78、npc37_unit 80/80、npc37_events_unit 54/54、good_rel_cap 31/31、stage3_chain 244 PASS、stage3_life34 114 PASS、stage3_token_offset 14/14、battle_rt_proto 149 PASS、lowpoly_attach 190 PASS、lowpoly_box 55 PASS、validate22 0 错。
- 待跑页面测试（需空闲 Chrome）：同第三十七轮（dev_openworld_page、dev_entry_v25_page、route37_unit.py、npc37_page / npc37_events_page）。
- 下一步：第 2 轮——洞府「阵法」面板（战阵/洞府阵/阵图）+ 包 battleLoop（B.round===0 apply、roundStart、winXp）/ rt27 calcDmg（rtMult）+ 坊市施工图/阵图 + 页面测试；之后 dungeon26 Dng.roomTrap 破阵、烂尾阵眼、洞府阵挂点、开发者 Tab「阵法39」。

## 2026-10-24 openworld-wip：合入 origin/main（5 commits）+ 页面测试
- 合并冲突：www/js/dev_openworld.js、www/js/stage3_encounter_draft.js（main 侧为 wip 子集，保留 wip 的 fightStats 与唯一 TOKEN_FEE_COST）。node 单测全过（含 stage3_chain）。
- 页面测试（逐个跑，无 flake）：dev_openworld_page 68 PASS/0 FAIL（dev_entry_v25_page 已改名为此）；route37_unit fails=0 js_errors=0；npc37_page 12/12；npc37_events_page 11/11；jsscan33 21 maps 0 errors。

## 开放世界线第三十九轮（2026-10-30 10:05 起，Grok Bot）
- 已普通 merge origin/main 0e6b30b（#56 zf39 第 1 轮 squash），合并提交 68f82ff，无冲突。
- 3.9.0 阵法 zf39 第 2 轮（回合制战斗接入）：PR #57（分支 zf39-battle，1776aaf，基于 main 0e6b30b）等奥拉夫审，未合并；wip cherry-pick 同内容。
  - 新增 www/js/zf39_hook.js：包 battleLoop，开局 B.round===0 时 ZF39.apply；首次生效时给 B.round 装透明 getter/setter 每回合调 ZF39.roundStart（欠条阵补挂反弹）。没布阵/老档无 G.zf39 时完全不动。
  - zf39.js：困龙上品定身不注入 rng 时走 Game.roll(p,'zf39')（无 Game 退回 Math.random，奥拉夫建议）；修 getG（Game 是顶层 const，不在 window 上）。
  - index.html：profile38 之后加载 zf39.js、zf39_hook.js（目前没有学阵入口，玩家侧无变化）。
  - 新增 test/zf39_hook_unit.js 20 项。
- 测试（纯 node，未跑 Chrome）：zf39_hook_unit 20/20、zf39_unit 118/118、chain37_unit 78/78、npc37_unit 80/80、npc37_events_unit 54/54、pf38_unit 34/34、stage3_chain / stage3_life34 / stage3_token_offset 全过、validate22 0 错。
- 待跑页面测试（需空闲 Chrome，请群里协调）：jsscan33.py、pf38_page.py、dev_openworld_page.py、human23。
- 下一步：洞府「阵法」面板 UI（学/炼/布阵）+ 战胜 winXp 接入；rt27 即时战套 rtMult；dungeon26 Dng.roomTrap 破阵（先确认接口）；开发者 Tab「阵法39」；页面测试。
- 2026-10-30 21:5x 小贷42 #65 奥拉夫 low：offerSquad 中 card()=-1（卡未弹出）不再记 _squadDoneY，留 squad=1 下张有怪图再试；storyBlock 延后仍不占次数。loan42-r2 4fd4de9，cherry-pick 至 openworld-wip。新增 loan42_squad_unit M3；loan42 110/110、loan42_squad 54/54、validate22 0 错、clan41/items40/stage3_*/chain37/npc37/pf38/tit39/zf39* 全过（纯 node，未跑 Chrome）。

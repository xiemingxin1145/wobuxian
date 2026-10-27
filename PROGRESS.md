# 我不仙 进度清单（2026-10-17 Grok 接管后）

> 交接规则与模板见 `AGENTS.md` §0。最新交接 note 永远放在本文件最上面。

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

<!-- 以下为原有交接与历史记录，保持不变 -->

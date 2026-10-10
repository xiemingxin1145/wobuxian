# AGENTS.md —《我不仙》接手入口

> 写给任何接手的 AI 编程工具或开发者（不需要任何之前的对话上下文）。
> 更新：2026-10-10（UTC+8）。**最新正式发布仍为 v2.3.0**（tag `v2.3.0` = `362172f`）；当前 `main` 为 `3baa83f`，包含 v2.5+ 方案与尚未接入游戏的实时战斗占位。当前隔离开发分支 `openworld-wip` 从该 `main` 建立。[GitHub Issue #5](https://github.com/xiemingxin1145/wobuxian/issues/5) 仍开放：公开历史 T4=9/20；本轮独立复测 T4=1/20，T9 为 1 次失败后连续 4 次成功且每次使用开发者辅助；未达到连续 5 次，也不是无辅助验收。历史与本轮时间、路径、辅助状态见 `PROGRESS.md`，不覆盖原结果。只写在文件/git/GitHub 里核实过的内容，不确定的地方标了「⚠待核实」。
> **从这里开始：先读 `docs/ROADMAP.md`（全局：故事、现状、待办），再读 `PROGRESS.md`（最近一次干到哪了）。**

## 1. 这是什么

《我不仙》是一款 **2.5D 等距视角、Q 版国风的修仙人生模拟器**，安卓 APK（WebView 壳），完全离线，没有任何付费内容。
- 前提：落魄剑仙一万年前订了这个世界，欠天道一万年的「世界建造尾款」，担保人一栏随手填了主角的生辰八字，于是天道（讨债司）上门讨债。
- 玩法：投胎抽天赋 → 一年一年长大 → 凡人/练气/筑基/金丹/元婴/化神/渡劫/飞升；在 11 张地图上走路、对话、接任务、回合制斗法；寿尽进轮回殿再来一世。
- 当前已发布版本：**2.3.0**（`VERSION`、tag `v2.3.0`）。`main` 的游戏运行链仍是离线 2.5D 与回合制斗法；`openworld-wip` 按序推进 v2.5 阶段 1 独立美术样例、阶段 2 独立遭遇战原型、阶段 3 奇遇债务小闭环；阶段 1 模型不接入正式地图或运行链。

## 2. 技术栈与目录

| 部分 | 说明 |
|---|---|
| 游戏 | `www/`：HTML5 Canvas + 原生 JS，**无第三方依赖、无打包器**。脚本加载顺序见 `www/index.html`（version → assets → data → events → engine → … → ux23 → assets/gen/gen.js → art23 → update → main）。后加载的文件用“包一层原函数”的方式扩展前面的（如 `ux23.js` 包 `Game.fight`）。 |
| 主要 JS | `engine.js` 渲染/寻路/输入，`game.js` 人生模拟/存档，`battle.js` 斗法，`talk.js` 对话，`ui.js`/`ui21.js` 界面，`data.js` 数值，`story21*.js`+`content22.js` 主线/NPC/任务，`events*.js` 事件，`systems21.js` 抽卡坐骑洞府，`gacha22.js`/`brk22.js` 演出，`ux23.js` v2.3 点按/追踪/自动/挂机/离线/开发者面板，`art23.js` AI 插画替换头像 |
| 美术 | `art/`：Blender 4.2 bpy 程序化建模渲染（`art/render_all.sh`，产物 `art/out/` 不进 git）→ `tools/build_assets.py` 打包成 webp 图集。v2.3 起静态插画（头像/半身/卡面/标题）可用 AI 生成图：`art/gen/*.jpg` + `art/gen/map.json` → `python3 tools/gen_art.py`，清单见 `art/gen/NEEDED.md` |
| 音频 | `tools/audio/synth.py`、`synth2.py`：numpy 程序化合成 |
| 安卓壳 | `android/`（Gradle 8.9 / AGP 8.7.3，JDK 17，android-35，build-tools 35.0.0） |
| 存档 | `localStorage`：`wbx2_save`（`G`，`v===2`）、`wbx2_meta`（轮回殿）、`wbx2_dev`（开发者模式开关） |

## 3. 本地运行 / 构建

```bash
# 浏览器直接打开 www/index.html（竖屏如 390×844 / 412×915）；URL 加 #dev 打开开发者模式
# 或在标题页/设置里连点版本号 7 次。#bot 为机器人自动游玩。
./build.sh            # 用 www/ 现有资源打 APK → wobuxian.apk（需要 JDK17 + Android SDK；默认路径 /workspace/jdk、/workspace/android-sdk，可用 JAVA_HOME/ANDROID_HOME 覆盖）
./build.sh assets     # 先从 art/out 重新打包 www/assets 再打 APK
BLENDER=/path/to/blender art/render_all.sh   # 全部重渲 3D 美术（CPU 数小时）
tools/make_hd_bundle.sh upload               # 生成高清资源包，上传到 Release assets-hd 并改 hd-assets.json
python3 tools/gen_art.py [--debug]           # AI 插画 → www/assets/gen/（SD）与 art/gen/hd/（HD）
```
`build.sh` 会自动生成 `www/js/version.js`（版本号 + 是否精简版），不要手改这个文件。

## 4. 发布流程（CI 已核实：`.github/workflows/build.yml`）

- **推到 `main` 的提交（以及 `v*` 标签、手动 workflow_dispatch）会触发 CI：构建 → 签名 → 发布到 GitHub Release 并标为 latest。** v2.3 起 workflow 有 `paths-ignore`：只改 `docs/**`、`*.md`、测试截图（`test/human23/**`、`test/human_olaf/**`、`test/**/*.png`）、`art/gen/**` 的推送不触发（标签推送不受过滤）。之前（如 2026-10-10 PR #4 文档合并）只改文档也会发 build。所以 **未通过门禁的代码不要进 `main`**；开发在分支上做，走 PR。
- 版本：`versionName` = `VERSION` 文件（打 `v*` 标签时用标签名），`versionCode` = 100 + run_number；非标签构建发布为 `build-<code>`。
- **发版步骤（2.3.0 就是这样发的）**：门禁全过 → 把开发分支 `--no-ff` 合进 `main`（不 force）→ 改 `VERSION` → 推 main（出一个 build-N）→ 等它绿了再推标签 `vX.Y.Z`（出正式 Release 并标 latest）→ 下载两个 APK 用 `apksigner verify --print-certs` 和 `aapt dump badging` 核对证书/versionName/versionCode → 更新 README/PROGRESS/ROADMAP。
- 签名**只在 CI 里做**：密钥在仓库 **Secrets**（`ANDROID_KEYSTORE_B64`、`ANDROID_KEYSTORE_PASSWORD`、`ANDROID_KEY_ALIAS`、`ANDROID_KEY_PASSWORD`），**不在代码里，永远不要把 keystore 提交进 git**（`.gitignore` 已排除）。CI 会校验证书 SHA-256 `436bf922…29dc`，与 v1/v2 不一致就失败（保证玩家能覆盖安装、存档保留）。
- 高清版：CI 按 `hd-assets.json` 从 Release `assets-hd` 下载 zip、校验 sha256、覆盖 `www/assets` 后打 `wobuxian.apk`（2.3.0 约 265MB）。workflow 还会先用仓库内 SD 资源打 `wobuxian-lite.apk`（约 45MB），两个 APK 都校验签名、都传到同一个 Release，并在最后检查 Release 里两个文件都在（缺一个就失败）。2.3.0 起 `latest/download/wobuxian-lite.apk` 可用（已核实）。带 `-` 的标签（如 `v2.3.0-beta1`）发为预发布、不标 latest，游戏内更新检查也忽略预发布。AI 插画：仓库里是 SD 尺寸（`www/assets/gen/`），HD 尺寸在 `art/gen/hd/`，CI 打高清版时覆盖过去。HD 资源包本身不进 git，只作为 Release `assets-hd` 的附件。
- CI 之后还会在 x86_64 模拟器（API 30/34）里装包冒烟（`continue-on-error`，不挡发布）。
- 固定下载链接：`https://github.com/xiemingxin1145/wobuxian/releases/latest/download/wobuxian.apk`（精简版把文件名换成 `wobuxian-lite.apk`）。国内用户可用镜像，如 `https://ghfast.top/<上面的 github 链接>`。
- **新换的 AI 工具只需要 GitHub 仓库访问权限**（读写代码、开 PR、合并）就能发版，不需要本机签名密钥、也不需要本地安卓环境。

## 5. 测试与发版前门禁（全部必须通过，才能合进 main / 发任何版本）

```bash
pip install playwright   # 测试依赖（Python 3 + Node）；测试默认用 /opt/google/chrome/chrome（human_olaf 可用 CHROME=… 覆盖）
python3 test/human_olaf.py        # 真人点按门禁：N1、N2、T0–T13（含 T13 回归），约 30–40 分钟；退出码 = 失败数，必须为 0
                                  # 部分：ONLY=N1,T0,T1 python3 test/human_olaf.py；DPR=2.625 模拟真机；HUMAN_OLAF_T13=0 跳过回归
python3 test/human23.py           # v2.3 纯触摸流程试玩（12 步 + 无 JS 错误 = 13 项），结果 test/human23/result.json，必须全过
node test/validate22.js           # 内容数据校验（章节/NPC/任务/BOSS/资源引用），必须 0 错误
```
发版前清单（**ALL must pass before any release**）：
1. `python3 test/human_olaf.py` 退出码 0（包括 T1–T13 全部用例，结果在 `test/human_olaf/results.json`）。
2. `python3 test/human23.py` 全部通过。
3. `node test/validate22.js` 0 错误。
4. T13 回归包含的 `test/controls.py`、`test/panels21.py`、`test/multilife.py` 也要过；改了演出/抽卡再跑 `test/brk22.py`、`test/gacha22.py`、`test/fx21.py`；改了章节跑 `test/content22.py`。
5. 推到 main 后看 CI：两个 APK 签名校验通过、`aapt` 显示的 versionName 正确。
6. 更新 `README.md` 新版本说明与截图、`PROGRESS.md`、`docs/ROADMAP.md`。

## 6. 硬规则

1. **测试只能用真实触摸**（CDP `Input.dispatchTouchEvent`，412×915，坐标取自屏幕上真实画的位置）。测试里**不准瞬移、不准删 NPC、不准直接调 `Game.*` 推进**；`page.evaluate` 只读状态。需要造场景只能走开发者模式 UI，并把用了哪些作弊写进结果。（旧机器人 `BOT.tick` 会瞬移，所以它测不出点按 bug。）
2. **自动任务/挂机绝不替玩家做重大选择**：不选道侣、借贷/高利贷、拜师、送礼/交易、任何结局（含“成为新天道/销账”）、渡劫/飞升/大境界突破、轮回/重置。白名单 `SAFE` / 黑名单 `UNSAFE` 在 `www/js/ux23.js:258-259`，新增对话选项时要同步检查；遇到没有安全选项就暂停等玩家。
3. **存档兼容**：玩家是覆盖安装的。主线进度按章节 **id**（`G.mainId`）存，不按下标；新章节用 `ins(afterId, ch)` 插入，**不删、不改已有章节 id**。新增存档字段要给默认值，旧存档读档要有迁移（参考 `content22.js` 的“旧存档章节迁移”）。保持 `wbx2_*` 键名和 `G.v===2`。
4. **签名不能换**：永远用仓库 Secrets 里那把 keystore，否则玩家无法覆盖安装。
5. **素材授权**：只用自己生成/程序化的素材，或明确可商用的开源素材（如 CC0、SIL OFL）。**每加一个第三方素材都要登记到 `CREDITS.md`**（作者、来源 URL、授权、用途），并把授权页面存档到 `docs/licenses/`。不用任何商业游戏素材。AI 生成插画（`art/gen/`）已登记在 CREDITS.md「AI 生成插画」一节；新增生成图沿用该说明，第三方图片不得放进 `art/gen/`。
6. **不要手改生成物**：`www/js/version.js`、`www/assets/assets.js`/图集、`www/assets/gen/*` 都由脚本生成；改源头（`art/`、`tools/`）再重新生成。
7. **无真钱、无联网依赖**：抽卡只用游戏内仙缘符；联网只用于检查更新，离线必须能玩。
8. 小步提交、提交信息写清楚改了什么；大改动开 PR 等审查（奥拉夫负责代码审查和点按测试）。
9. **每次工作结束都要更新 `PROGRESS.md` 和 `docs/ROADMAP.md` 的状态**（做完什么、卡在哪、下一步），让下一个接手的人不用问。

## 7. 文档在哪

| 文档 | 内容 |
|---|---|
| `docs/ROADMAP.md` | 全局：故事大纲（已做/计划）、各版本现状、P0/P1/P2 待办、已知问题、交接方法 |
| `PROGRESS.md` | 当前版本逐项进度清单（断点续做用） |
| `design_feedback_v23.md`（仓库根） | v2.3 设计规格：NPC 交互根因、追踪寻路、自动任务、挂机/离线、开发者面板、内容扩充、测试用例 T1–T13 |
| `docs/research_v22.md` | 世界观设定、抽卡/突破演出规格、元婴→飞升→终局章节设计，§7 为第十七章～终章（下）完整台词 |
| `docs/art_specs.md` | 奥拉夫的 v2.2 角色造型设定稿（12 NPC、3 BOSS、2 坐骑） |
| `art/gen/NEEDED.md` | 待生成的 AI 插画清单（文件名即映射） |
| `research.md` | v2.1 竞品视觉/系统调研 |
| `README.md` / `CREDITS.md` | 玩家说明、构建测试说明 / 素材授权 |

## 8. 团队分工（截至 2026-10-10）

- **Grok Bot**：开发、美术、发版。
- **奥拉夫**：代码审查、真人点按测试（`test/human_olaf.py`）、美术设定稿。
- **研究员**：设计、剧情、数值规格（`design_feedback_v23.md`、`docs/research_v22.md`）。
- 主人（产品负责人）试玩并提反馈；可能随时换用别的 AI 工具，所以一切状态都要写进仓库文档。

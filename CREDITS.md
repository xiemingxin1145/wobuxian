# 素材与授权 / Credits

《我不仙》的美术（角色、怪物、坐骑、地图、图标、立绘）全部由本项目在 Blender 中程序化建模并渲染生成（见 `art/`），音乐与音效由 `tools/` 中的脚本程序化合成。未使用任何商业游戏的素材。

## AI 生成插画（v2.3 起，`art/gen/`）

`art/gen/` 下的插画源图（`player_m1.jpg`、`mentor.jpg`、`heroine.jpg`、`boss_tiandao.jpg`、`rival.jpg`，批次 2：`player_f0/f1/m0`、`npc_mom`、`npc_merchant`、`npc_taizi`、`npc_sanniang`、`boss_guiwang`，以及今后按 `art/gen/NEEDED.md` 补充的文件）由 Grok Bot 的图像生成工具于 2026-10-10 为本项目生成，为原创作品，未使用任何第三方素材或商业游戏素材。`tools/gen_art.py` 将其裁切缩放为头像/半身/卡面/标题图（`www/assets/gen/`、`art/gen/hd/`）。地图上行走的角色仍是 Blender 程序化 3D 渲染。

## 第三方素材

| 素材 | 作者 | 来源 | 授权 | 用途 |
|---|---|---|---|---|
| 霞鹜文楷 LXGW WenKai（Medium，子集化为 `www/assets/fonts/wenkai.woff2`） | LXGW | https://github.com/lxgw/LxgwWenKai | SIL Open Font License 1.1 | 游戏界面中文字体 |

子集化脚本：`tools/make_font.py`（保留 GB2312 全部汉字与游戏文本用字）。依据 OFL，字体可随软件免费分发与嵌入，子集版本不单独出售。

## 渲染风格参考与评估素材（v2.2）

- 赛璐璐/边缘光/描边着色（`art/lib.py` 的 `_cel()`，`WBX_CEL=1` 启用）为本项目自行实现，基于 Blender 内置 Toon BSDF + Layer Weight + Freestyle。NprEevee、miHoYo 风格着色等 GPL 开源项目仅作思路参考，**未复制任何代码或节点组**。
- Quaternius「Universal Base Characters [Standard]」（https://quaternius.com/packs/universalbasecharacters.html ，官方 itch.io：https://quaternius.itch.io/universal-base-characters ，作者 Quaternius）：授权 **CC0 1.0**（包内 `License_Standard.txt` 原文已存 `docs/licenses/quaternius_ubc_License_Standard.txt` 与 `art/third_party/quaternius_ubc/License_Standard.txt`；官网页面 2026-10-10 存档 `docs/licenses/quaternius_universalbasecharacters_2026-10-10.html`，itch 页面 `docs/licenses/quaternius_ubc_itch_2026-10-10.html`；更早评估存档 2026-10-09 仍保留）。Quaternius 自 2026-08-28 起对**新发布**素材使用 Quaternius Asset License v1.0（存档 `docs/licenses/quaternius_license_page_2026-10-10.html`，不溯及既往），本包页面与包内许可均为 CC0。下载包 sha256 `fdbf1804c90dfc1ea03e992bff7da2dfd1a79318e13270a660180f9308455f40`（仅官网/官方 itch 下载）。
  - **v2.4 起游戏内使用**（v24-chars 分支，人形角色新模型管线 `art/v24/`）：以下文件作为人体基础网格/骨架/发型渲染进角色精灵帧，原文件存于 `art/third_party/quaternius_ubc/`（未复制贴图，仅网格+骨架）：
    - `Superhero_Male_FullBody.gltf/.bin`（男性基础人体）
    - `Superhero_Female_FullBody.gltf/.bin`（女性基础人体）
    - `Hair_Long.gltf/.bin`（长发，女性/束发角色）
    - `Hair_SimpleParted.gltf/.bin`（短发）
    - `Hair_Buns.gltf/.bin`（备用发髻，暂未使用）
  - 头部、脸部贴图（`art/v24/face_tex.py` 程序化绘制）、刘海/发髻/衣袍/袖/裙/腰带/配件均为本项目自行建模，无其它第三方素材。

## 工具

- Blender 4.2（GPL，仅用作工具，产出物不受 GPL 约束）
- Android Gradle Plugin / Android SDK

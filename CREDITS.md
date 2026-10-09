# 素材与授权 / Credits

《我不仙》的美术（角色、怪物、坐骑、地图、图标、立绘）全部由本项目在 Blender 中程序化建模并渲染生成（见 `art/`），音乐与音效由 `tools/` 中的脚本程序化合成。未使用任何商业游戏的素材。

## 第三方素材

| 素材 | 作者 | 来源 | 授权 | 用途 |
|---|---|---|---|---|
| 霞鹜文楷 LXGW WenKai（Medium，子集化为 `www/assets/fonts/wenkai.woff2`） | LXGW | https://github.com/lxgw/LxgwWenKai | SIL Open Font License 1.1 | 游戏界面中文字体 |

子集化脚本：`tools/make_font.py`（保留 GB2312 全部汉字与游戏文本用字）。依据 OFL，字体可随软件免费分发与嵌入，子集版本不单独出售。

## 渲染风格参考与评估素材（v2.2）

- 赛璐璐/边缘光/描边着色（`art/lib.py` 的 `_cel()`，`WBX_CEL=1` 启用）为本项目自行实现，基于 Blender 内置 Toon BSDF + Layer Weight + Freestyle。NprEevee、miHoYo 风格着色等 GPL 开源项目仅作思路参考，**未复制任何代码或节点组**。
- Quaternius「Universal Base Characters」（https://quaternius.com/packs/universalbasecharacters.html ，作者 Quaternius）：评估用，授权 **CC0 1.0**（官网页面 2026-10-09 存档：`docs/licenses/quaternius_universalbasecharacters_2026-10-09.html`）。Quaternius 自 2026-08-28 起对新发布素材使用 Quaternius Asset License v1.0（存档：`docs/licenses/quaternius_license_page_2026-10-09.html`），本包页面仍标注 CC0。截至 v2.2.0，游戏内未打包任何 Quaternius 模型；若日后采用，仅从官网/官方 itch.io 页面下载并在此登记。

## 工具

- Blender 4.2（GPL，仅用作工具，产出物不受 GPL 约束）
- Android Gradle Plugin / Android SDK

# 素材与授权 / Credits

《我不仙》的美术（角色、怪物、坐骑、地图、图标、立绘）全部由本项目在 Blender 中程序化建模并渲染生成（见 `art/`），音乐与音效由 `tools/` 中的脚本程序化合成。未使用任何商业游戏的素材。

## 第三方素材

| 素材 | 作者 | 来源 | 授权 | 用途 |
|---|---|---|---|---|
| 霞鹜文楷 LXGW WenKai（Medium，子集化为 `www/assets/fonts/wenkai.woff2`） | LXGW | https://github.com/lxgw/LxgwWenKai | SIL Open Font License 1.1 | 游戏界面中文字体 |

子集化脚本：`tools/make_font.py`（保留 GB2312 全部汉字与游戏文本用字）。依据 OFL，字体可随软件免费分发与嵌入，子集版本不单独出售。

## 工具

- Blender 4.2（GPL，仅用作工具，产出物不受 GPL 约束）
- Android Gradle Plugin / Android SDK

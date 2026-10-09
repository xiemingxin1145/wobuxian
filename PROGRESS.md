# 我不仙 v2.1 进度清单（断点续做用）

## 已完成
- [x] 剧情 15 章 / 33 NPC / 318 事件 / 44 任务 / 16 结局 / 44 成就（story21*.js, events21.js）
- [x] 系统：求仙缘抽卡（仅游戏内仙缘符，公示概率+保底）、坐骑、时装、称号、洞府、逆天改命、机缘
- [x] VFX：云海/水面/天气/昼夜/境界光环/突破演出+震屏/技能切入/章节卡
- [x] 12 张剧情 CG（Blender 透视场景 + tools/post_cg.py）→ www/assets/cg
- [x] 音频 synth2（44.1k 立体声）→ art/out/audio2 (25 条)
- [x] CI：push main → build-N 发布 latest；tag → vX.Y.Z；emulator-smoke API30/34 + 自动 bot
- [x] 测试：test/panels21.py（360x640/412x915 无溢出）、test/multilife.py（多世 0 错误/0 卡死）

## 进行中 / 待办
- [x] frames2 2x 精灵渲染 80 个（含时装/坐骑）；SD 精灵+74 头像已提交
- [x] 2x 立绘 512px
- [x] 2x 地图底板进行中（art/out/maps2x.log 出现 ALLDONE 后：SD `python3 tools/build_assets.py www maps` 提交）
- [x] HD 精灵/头像/音频 已在 art/out/hdwww
- [x] 首个 HD 包已上传，CI build-118 APK 211MB，模拟器 API30/34 绿
- [x] 地图/CG 全部完成后再：`PARTS=maps,cg tools/make_hd_bundle.sh upload`（spr/ui/audio 已在 hdwww 中）→ 提交 hd-assets.json → CI 出大包
- [x] 修复：面板内精灵小画布被全局 canvas{position:fixed} 钉在左上角（坐骑/时装/抽卡/技能特写）
- [x] HD 资源包管线：tools/make_hd_bundle.sh upload → release `assets-hd`（预发布）+ hd-assets.json（sha256）；CI 构建前下载覆盖 www/assets（已写好，待首次上传）
- [x] 技能序列帧特效 tools/make_vfx.py（SD 192px 进 git；HD 384px 进资源包：`python3 tools/make_vfx.py <dir> 384`）
- [x] CG：/tmp/cghd.sh（11 张结局 CG + 旧 12 张 2x 重渲，log art/out/cg_hd.log），SD 自动写入 www/assets/cg，HD 写 art/out/hd/cg
- [x] HD 音频：WBX_AQ=8 synth2 → art/out/audio_hd（/tmp/aud_hd.log）
- [x] frames2 全部完成后：SD `python3 tools/build_assets.py`（提交）；HD `tools/make_hd_bundle.sh upload`（+ make_vfx 384 进包）→ 提交 hd-assets.json
- [x] python3 tools/build_assets.py；重跑 panels21 / multilife
- [x] 截图 screenshots/v21/，README 更新
- [x] VERSION=2.1.x，tag v2.1.0，gh run watch，验证 APK 证书 436bf922… 与 versionName

## v2.1.0 已发布
- latest：build-123 / tag v2.1.0，APK 213.9MB，证书 436bf922…，versionName 2.1.0；CI build + emulator-smoke(API30/34) 全绿

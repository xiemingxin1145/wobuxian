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
- [ ] frames2 2x 精灵渲染（art/out/frames2，后台 /tmp/queue_extra.sh → 时装/坐骑）
- [ ] 2x 立绘（/tmp/queue_post.sh 等 /tmp/x{0,1,2}.done 后自动跑）→ 然后 2x 地图底板（art/out/maps2x.log ALLDONE）
- [ ] 大资源包：tools/pack_hd.py 生成 wbx-hd-assets.zip → 上传到 release `assets-hd`；CI 构建前下载并覆盖 www/assets（git 不存大文件）
- [ ] python3 tools/build_assets.py；重跑 panels21 / multilife
- [ ] 截图 screenshots/v21/，README 更新
- [ ] VERSION=2.1.x，tag v2.1.0，gh run watch，验证 APK 证书 436bf922… 与 versionName

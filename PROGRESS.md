# 我不仙 v2.2 进度清单（断点续做用；v2.1.0 已发布）

## 美术渲染（后台 /tmp/v22render.sh → art/out/v22.log：sprites → portraits → 3 张地图 → ALLDONE）
- [x] specs：12 新 NPC（taizi sanniang zhuiming tianbing xiaoyao guanghan caishen leigong suanpan guizu xiabing baiwuchang）、3 BOSS（guiwang dasiming tiandao2）、4 套时装×2、2 坐骑（carp abacus）
- [x] mapdefs：longgong 东海龙宫 / guishi 鬼市 / cuizhai 天庭催债司
- [ ] 渲染完成 → SD build_assets（spr,maps,ui）→ 提交
- [ ] 新章节 CG（cg_specs 增加）→ /tmp/cghd 类脚本 → post_cg
- [ ] HD：WBX_PROFILE=hd 增量打包（PARTS=spr,ui,maps,cg）→ make_hd_bundle upload → hd-assets.json → 清理 assets-hd 旧 zip

## 代码
- [ ] 抽卡演出重做：阵法、按稀有度光柱、翻牌、粒子、闪屏、稀有立绘切入、跳过
- [ ] 突破演出加强 + 测试截图时机
- [ ] 抽卡货币平衡（原 110–180 抽/世）
- [ ] 新内容：3–5 章、3 张新地图接入、100+ 事件、新 BOSS 技能、新坐骑/时装/灵宠进卡池
- [ ] 版本 2.2.0、测试（panels/multilife/fx）、screenshots/v22、README、tag v2.2.0、验证证书

# HANDOFF_CHARS — v2.4 人形角色新模型管线（分支 `v24-chars`）

> 给接手的人/AI：本文件随每批渲染更新。分支 `v24-chars` 从 `origin/v23-wip`（17c77ac）拉出——v2.3.0 尚未合入 main。**不要动 main**（另一位在发 2.3）。
> 用户已批准的样式：`/workspace/charproto/compare_v2.png`（原型 v2：手臂自然下垂、动漫古风脸、深蓝黑头发、约 4.7 头身、192×224 帧）。

## 1. 管线文件（全部在 `art/v24/`）
| 文件 | 作用 |
|---|---|
| `base.py` | 原型 v1：导入 Quaternius UBC glTF（`setup_character()`）、按骨骼权重派生衣物层（`derived_layer`）、反向外壳描边（`add_outline`）、世界空间转骨（`rot_bone`）、逐帧布料（`build_cloth`：裙/袖/腰带/垂绦/交领） |
| `proto.py` | 原型 v2 覆盖层：大头比例（Head 骨 1.6、neck 0.8）、程序化动漫头 + 脸贴花（`make_head`）、刘海鬓发（`bangs`）、头发材质（`hair_mat`）、手指放松（`pose_base`）、v2 裙/袖；`FLARE`（裙摆外扩）/`FAT`（胖体）全局量 |
| `face_tex.py` | 系统 python3（需 PIL）绘制脸部贴图：`face_tex.py out.png <round|angry|happy|closed> <smile|flat|open> <female 0/1> <iris #hex> <brow #hex>`；Blender 内自动调用，缓存在 `art/out/v24_faces/` |
| `chars24.py` | **spec → 新模型映射**（读 `art/specs.py` 里每个角色原有的 chibi spec：robe/robe2/trim/belt/hair/hairstyle/hat/weapon/left/back/cape/ribbon2/beard/eyes/mouth/fat/skirt/headScale…）+ 全部动作（idle4/walk6/attack5/hurt1）+ 武器挂手/背剑/披风/披帛 |
| `render24.py` | 渲染入口：`blender -b -P art/v24/render24.py -- --ids a,b [--frames idle_S_0,walk_SW_2] [--preview 1] [--out DIR]`，默认输出 `art/out/frames2/<sid>/{anim}_{dir}_{f}.png`（2x） |
| `render_batch.sh` | 批量后台渲染 + 打包：`nohup art/v24/render_batch.sh <批名> <id,id,...> [并行=3] > logs24/<批名>.log 2>&1 &`；每个 worker 日志 `logs24/<批名>_<n>.log`，结束后自动 `WBX_SPR_IDS=... python3 tools/build_assets.py www spr`（日志 `logs24/<批名>_pack.log`） |
| `montage.py` | 拼图预览：`python3 art/v24/montage.py out.png[@缩放] a.png b.png ...` |

CC0 素材：`art/third_party/quaternius_ubc/`（Superhero_Male/Female_FullBody、Hair_Long、Hair_SimpleParted、Hair_Buns + License_Standard.txt），已登记 `CREDITS.md`，许可存档 `docs/licenses/quaternius_*2026-10-10*`。贴图未复制（导入时 “Missing image” 报错是正常的，材质会被替换）。

## 2. 如何渲染一个角色
```bash
cd <repo>
B=/workspace/tools/blender-4.2.23-linux-x64/blender      # Blender 4.2
# 快速预览（1x，单帧，输出到 /tmp/pv）
WBX_RES=1 $B -b -P art/v24/render24.py -- --ids npc_mom --preview 1 --out /tmp/pv
# 正式：全部帧（2x）→ art/out/frames2/npc_mom/ ，再增量打包进 www/assets（SD 图集，缩 0.5）
WBX_RES=2 WBX_THREADS=3 WBX_SAMPLES=20 $B -b -P art/v24/render24.py -- --ids npc_mom
WBX_SPR_IDS=npc_mom python3 tools/build_assets.py www spr
```
耗时：2x 约 6–7 s/帧/worker（3 线程，8 核机器跑 3 个 worker）；玩家 80 帧/角色，普通 NPC 50 帧，带战斗的 NPC 80 帧，BOSS 10 帧（只 SE）。
**不要手改** `www/assets/assets.js`、图集 webp —— 一律由 `tools/build_assets.py` 生成。

## 3. Olaf 的规格要点（帧/锚点/坐骑/热区）——来源与采用值
未找到 Olaf 单独的集成笔记（邮件、分支、olaf-review 都搜过）；以下取自 `docs/art_specs.md`（v2.2 规格）与 v2.3 PROGRESS 的热区条目，并按新模型调整：
- **帧尺寸**：旧 chibi 160×176；新人形 **192×224**（1x；2x 渲染 384×448，SD 打包缩 0.5，HD 包 k=2）。big BOSS 保持 **320×352**。
- **脚底锚点**：引擎 `drawSprite` 锚点 `(fw/2, fh*0.86)`；`fw/K ≥ 300` 的 big 精灵用 0.9。新帧 192 宽 < 300 → 仍 0.86，**引擎无需改锚点**；相机 `camera(w,h,anchor=(0.5,0.86|0.9), ortho_scale=h/68)`，脚底（最低 ball 骨 −0.015）放在 z=0。
- **世界缩放**：`B1.GLOBAL = 1.25`（成品身高≈ 原 chibi 的 1.1 倍）；big BOSS 用 `1.25 × spec.scale × 0.9`；童子（tongzi）×0.8。
- **坐骑高度**：骑手始终站立，`MOUNTS[id].lift`（systems21.js，22–30 px）不变；新模型脚底锚点一致，故无需改 lift。
- **NPC 点击热区**：`www/js/ux23.js entHitRect` 保底 ≥ **56×88 CSS px**（半宽 `UX.w(32)`、高 `UX.w(88)`），覆盖身体+名字+标记。新帧身体占比变小 → `engine.js spriteBox()` 对 `fh/K ≥ 200` 的非 big 精灵改用 w=fw×0.45、h=fh×0.70（≈86×157 canvas px@1x），热区仍由 entHitRect 兜底 ≥56×88。
- **HD 资源包**：Release 的 `assets-hd`（hd-assets.json）里还是旧精灵，会覆盖 SD。合并前需重新生成 HD 包：`WBX_HD=1 ... build_assets.py` + `tools/make_hd_bundle.sh`（上传是外发操作，需用户批准）。

## 4. 规格文档待办
`docs/art_specs.md` 仍是按 chibi 部件写的（v2.2）。本次**按现有文档/`art/specs.py` 的颜色与道具**逐角色映射（见 `chars24.py`）。**规格仍需重写为：基础人体（男/女/童/胖） + 发型 + 配件 + 色板** 四段式——Olaf 不改，留给后续。

## 5. 映射规则摘要（chars24.py）
- 女体：`player_f*`、`cos_*_f`、mom/girl/sister/witch/dragongirl/lengyue/ruyan/guzhu/mengpo/sanniang/guanghan → Superhero_Female；其余男体。
- 发型：none（有帽 → 短发；无帽 → 光头）/short → Hair_SimpleParted；bun/crown/guan/pony/double/long/女性 → Hair_Long；+ 刘海鬓发；bun/crown 加发髻+冠/发带+簪；double 双髻；pony/long 加发束。深色头发用 `hair_mat()`，浅色用 `M(hair)`。
- 帽/角/光环/狐耳/眼镜：复用 `chars.hat()`（挂在头中心、缩放 0.29 的空物体上）；胡子换成下巴小锥。
- 武器：复用 `chars.weapon()`，每帧对齐右手（刃沿局部 +Y = 前臂方向 + 前倾）；玩家/时装持剑在 idle/walk 背剑、attack/hurt 在手；`back:'sword'` 背剑；`left` 左手道具。
- 披风 `cape` 逐帧后片；`ribbon2` 披帛；`armsForward` 双臂平举；`fat` 躯干/盆骨缩放 + 裙臀；`skirt` → 裙摆外扩 `FLARE=skirt/0.3`。
- 已知简化：尾巴未做；tongzi 只按 0.8 缩放；attack 为单手挥砍通用动作。

## 6. 进度（每批更新）
见文末「状态」。

## 状态
- 总计人形：16 玩家 + 42 NPC + 20 时装 + 6 人形 BOSS = **84**（chibi 怪 mon_collector/fox/jiangshi/demon 属怪物，不在本次范围）。
- **已完成 21/84**：player_m0, player_m1, player_m2, player_m3, player_m4, player_m5, player_m1b, player_m1t, player_f0, player_f1, player_f2, player_f3, player_f4, player_f5, player_f1b, player_f1t, npc_mentor, npc_mom, npc_girl, npc_sister, npc_aotian
- **待做 63**：npc_farmer, npc_elder, npc_disciple, npc_merchant, npc_alchemist, npc_fisher, npc_witch, npc_dragongirl, npc_villager, npc_lengyue, npc_ruyan, npc_bailang, npc_storyteller, npc_xiaoer, npc_yaopu, npc_guzhu, npc_keeper, npc_judge, npc_baoxian, npc_heixin, npc_yuelao, npc_mengpo, npc_luren, npc_qymaster, npc_tongzi, npc_taizi, npc_sanniang, npc_zhuiming, npc_tianbing, npc_xiaoyao, npc_guanghan, npc_caishen, npc_leigong, npc_suanpan, npc_guizu, npc_xiabing, npc_baiwuchang, boss_corpse, boss_mozun, cos_xifu_m, cos_xifu_f, cos_xiake_m, cos_xiake_f, cos_yuyi_m, cos_yuyi_f, cos_mowang_m, cos_mowang_f, cos_taohua_m, cos_taohua_f, cos_longpao_m, cos_longpao_f, boss_guiwang, boss_dasiming, boss_tiandao2, boss_tiandao2_p2, cos_longwang_m, cos_longwang_f, cos_guishi_m, cos_guishi_f, cos_tianjia_m, cos_tianjia_f, cos_caishen_m, cos_caishen_f
- 最近一批：批次1：16 个玩家变体 + 落魄剑仙/师姐(女主)/龙傲天/娘/翠花（21 个）
- 续做命令：`nohup art/v24/render_batch.sh bN npc_farmer,npc_elder,npc_disciple,npc_merchant,npc_alchemist,npc_fisher,npc_witch,npc_dragongirl,npc_villager,npc_lengyue,npc_ruyan,npc_bailang 3 > logs24/bN.log 2>&1 &`，完成后（big BOSS 需把 id 追加进 `art/v24/DONE.txt`）`python3 art/v24/status24.py "说明"`，提交并 `git push origin v24-chars`。
- 全部完成后：`python3 test/human23.py`（结果 test/human23/result.json），`python3 art/v24/contact_sheet.py <旧assets> www/assets <out.png>` 生成前后对比，push。

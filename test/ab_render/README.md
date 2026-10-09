# 视觉 A/B：PBR（旧） vs 赛璐璐（新, `WBX_CEL=1`）

同一角色、同一姿势（idle 首帧）、同一采样（Cycles 32spp, WBX_RES=2），仅切换着色：

    blender -b -P art/render_sprites.py -- --ids npc_ruyan,npc_taizi,boss_guiwang --preview 1 --out /tmp/ab_old
    WBX_CEL=1 blender -b -P art/render_sprites.py -- --ids npc_ruyan,npc_taizi,boss_guiwang --preview 1 --out /tmp/ab_new

- `ab.png`：左旧右新拼图；`*_old.png` / `*_new.png`：单张原图。
- 新版：Toon 漫反射两阶 + 冷色环境补光 + Layer Weight 边缘光 + 加粗 Freestyle/外壳描边（自研，未复制 GPL 代码）。
- 结论：浅色角色（如烟、哪吒太子）明暗分块更清楚、轮廓更易读；深色材质（鬼王黑发/黑袍）会偏冷紫、体积感变弱。v2.2.0 仍默认用旧着色，赛璐璐作为可选开关，待调深色材质的补光后再全量重渲。
- Quaternius UBC（CC0）只做了授权核查与存档（见 CREDITS.md），未下载/未进入游戏：官方下载走 itch.io 付费/免费领取流程，且现有程序化 Q 版体型已与美术规范一致。

## v2 深色修正（2026-10-10）

`_cel()` 新增按亮度的深色处理：亮面保色相地轻抬（黑→深炭灰，棕发仍是棕）、额外一条窄高光带（三阶明暗）、深色材质的边缘光更窄/更冷/更弱、环境底色改为乘法偏冷（黑色不再被染紫）。
`ab.png` 现为三列：OLD (PBR) / CEL v1 / CEL v2；新增 `boss_dasiming`。`*_new.png` = v2，`*_cel_v1.png` = v1。重拼：`python3 test/ab_render/make_ab.py`。

结论：v2 明显优于 v1（鬼王头发、黑袍重新有明暗交界和体积）；浅色角色（如烟、敖小白）上赛璐璐比 PBR 更清爽易读。但深色角色上 v2 与 PBR 大致持平、略偏冷，**还不算“明显更好”**，因此暂不定为 v2.3 全量重渲方案，默认仍用 PBR。

# 视觉 A/B：PBR（旧） vs 赛璐璐（新, `WBX_CEL=1`）

同一角色、同一姿势（idle 首帧）、同一采样（Cycles 32spp, WBX_RES=2），仅切换着色：

    blender -b -P art/render_sprites.py -- --ids npc_ruyan,npc_taizi,boss_guiwang --preview 1 --out /tmp/ab_old
    WBX_CEL=1 blender -b -P art/render_sprites.py -- --ids npc_ruyan,npc_taizi,boss_guiwang --preview 1 --out /tmp/ab_new

- `ab.png`：左旧右新拼图；`*_old.png` / `*_new.png`：单张原图。
- 新版：Toon 漫反射两阶 + 冷色环境补光 + Layer Weight 边缘光 + 加粗 Freestyle/外壳描边（自研，未复制 GPL 代码）。
- 结论：浅色角色（如烟、哪吒太子）明暗分块更清楚、轮廓更易读；深色材质（鬼王黑发/黑袍）会偏冷紫、体积感变弱。v2.2.0 仍默认用旧着色，赛璐璐作为可选开关，待调深色材质的补光后再全量重渲。
- Quaternius UBC（CC0）只做了授权核查与存档（见 CREDITS.md），未下载/未进入游戏：官方下载走 itch.io 付费/免费领取流程，且现有程序化 Q 版体型已与美术规范一致。

#!/usr/bin/env bash
# 《我不仙》2.0 全部 3D 美术的离线渲染流水线（Blender 4.2，Cycles CPU，无头模式）
# 用法：BLENDER=/path/to/blender ./render_all.sh   （全部渲染约数小时；结果在 art/out/，不进 git）
set -euo pipefail
cd "$(dirname "$0")"
BL="${BLENDER:-blender}"
export WBX_THREADS="${WBX_THREADS:-6}"
python3 mapdefs.py                                   # 8 张地图的地形/道具布局 -> out/maps.json
IDS=$(python3 -c "from specs import SPRITES; print(','.join(SPRITES))")
"$BL" -b -P render_sprites.py -- --ids "$IDS"         # 角色/怪物/BOSS 5 方向×动作帧 -> out/frames
"$BL" -b -P render_map.py                            # 等距地图底板（含软阴影）-> out/maps
WBX_SAMPLES=32 "$BL" -b -P render_props.py           # 建筑与道具 -> out/props
"$BL" -b -P render_portraits.py                      # 3D 头像 -> out/portraits
"$BL" -b -P render_icons.py                          # 物品/技能图标 -> out/icons
python3 ../tools/audio/synth.py out/audio                   # 原创 BGM/音效 -> out/audio
python3 ../tools/build_assets.py ../www              # 打包 webp 图集 + assets.js

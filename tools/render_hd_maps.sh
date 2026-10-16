#!/usr/bin/env bash
# 旧 11 图 HD(2x) 底图重渲染（关降噪+小tile 已解决 OOM），断点续跑：已有 k=2 png 的跳过
set -u
cd "$(dirname "$0")/.."
ROOT="$PWD"
BL="${BLENDER:-/home/user/.doubao/agent_mode/workspace/tools/blender/blender-4.2.18-linux-x64/blender}"
mkdir -p art/logs
OLD_11=(village sect market secret graveyard island rift heaven longgong guishi cuizhai)
for mid in "${OLD_11[@]}"; do
  if [ -f "art/out/maps/${mid}.png" ] && python3 -c "import json,sys; d=json.load(open('art/out/maps/${mid}.json')); sys.exit(0 if d.get('k',1)==2 else 1)" 2>/dev/null; then
    echo "[skip] ${mid} 已有 2x"; continue
  fi
  echo "[render] ${mid} @2x start $(date +%H:%M:%S)"
  WBX_RES=2 WBX_THREADS=4 WBX_SAMPLES=16 WBX_DENOISE=0 WBX_TILE=256 "$BL" -b -P art/render_map.py -- --map "$mid" > art/logs/hdmap_${mid}.log 2>&1
  rc=$?
  if [ $rc -eq 0 ] && [ -f "art/out/maps/${mid}.png" ]; then
    echo "[ok] ${mid} 完成 $(date +%H:%M:%S)"
  else
    echo "[fail] ${mid} rc=$rc"
  fi
done
echo "=== HD 旧图 2x 渲染全部结束 ==="

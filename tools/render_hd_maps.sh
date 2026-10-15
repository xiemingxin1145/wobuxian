#!/usr/bin/env bash
# 旧 11 图 HD(1.5x) 底图重渲染，断点续跑：已有 HD png 的跳过；日志与进度存仓库 art/logs/
set -u
cd "$(dirname "$0")/.."
ROOT="$PWD"
BL="${BLENDER:-/home/user/.doubao/agent_mode/workspace/tools/blender/blender-4.2.18-linux-x64/blender}"
mkdir -p art/logs
OLD_11=(village sect market secret graveyard island rift heaven longgong guishi cuizhai)
for mid in "${OLD_11[@]}"; do
  # 跳过已有 1.5x 底图
  if [ -f "art/out/maps/${mid}.png" ] && python3 -c "import json,sys; d=json.load(open('art/out/maps/${mid}.json')); sys.exit(0 if d.get('k',1)!=1 else 1)" 2>/dev/null; then
    echo "[skip] ${mid} 已有 HD 底图"; continue
  fi
  echo "[render] ${mid} @1.5x start $(date +%H:%M:%S)"
  WBX_RES=1.5 WBX_THREADS=2 WBX_SAMPLES=24 "$BL" -b -P art/render_map.py -- --map "$mid" > art/logs/hdmap_${mid}.log 2>&1
  rc=$?
  if [ $rc -eq 0 ] && [ -f "art/out/maps/${mid}.png" ]; then
    echo "[ok] ${mid} 完成 $(date +%H:%M:%S)"
  else
    echo "[fail] ${mid} rc=$rc"
  fi
done
echo "=== HD 旧图渲染全部结束 ==="

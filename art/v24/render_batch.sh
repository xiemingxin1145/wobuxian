#!/usr/bin/env bash
# 用法：art/v24/render_batch.sh <batch名> <id,id,...> [并行数=3]
# 后台：nohup art/v24/render_batch.sh b1 player_m0,npc_mom 3 > logs24/b1.log 2>&1 &
# 帧输出 art/out/frames2/<sid>/（2x），日志 logs24/<batch>_<n>.log；全部完成后打包进 www/assets（SD）。
set -u
cd "$(dirname "$0")/../.."
B=$1; IDS=$2; J=${3:-3}
BL=${BLENDER:-/workspace/tools/blender-4.2.23-linux-x64/blender}
mkdir -p logs24
IFS=, read -ra A <<< "$IDS"
for ((i=0; i<J; i++)); do
  L=(); for ((k=i; k<${#A[@]}; k+=J)); do L+=("${A[k]}"); done
  [ ${#L[@]} -eq 0 ] && continue
  S=$(IFS=,; echo "${L[*]}")
  ( WBX_RES=2 WBX_THREADS=${THREADS:-3} WBX_SAMPLES=${SAMPLES:-20} timeout 10800 "$BL" -b -P art/v24/render24.py -- --ids "$S" > logs24/${B}_$i.log 2>&1; echo "worker $i exit $?" ) &
done
wait
grep -h "^DONE\|Traceback\|Error: Python" logs24/${B}_*.log
WBX_SPR_IDS=$IDS python3 tools/build_assets.py www spr > logs24/${B}_pack.log 2>&1; echo "pack exit $?"

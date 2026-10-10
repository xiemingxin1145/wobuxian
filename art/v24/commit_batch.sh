#!/usr/bin/env bash
# 打包已渲染完成的角色 + 更新 HANDOFF/PROGRESS + 提交 + 推送：art/v24/commit_batch.sh <id,id,...> "<说明>"
set -eu
cd "$(dirname "$0")/../.."
IDS=$1; MSG=$2
for s in ${IDS//,/ }; do n=$(ls art/out/frames2/$s 2>/dev/null | wc -l); echo "$s frames=$n"; [ "$n" -gt 0 ] || { echo "missing $s"; exit 1; }; done
WBX_SPR_IDS=$IDS python3 tools/build_assets.py www spr
git checkout -- test/human23 2>/dev/null || true
python3 art/v24/status24.py "$MSG"
git add -A art/v24 www/assets HANDOFF_CHARS.md PROGRESS.md CREDITS.md www/js
git -c user.name="${GIT_NAME:-Elonn Muskk}" -c user.email="${GIT_EMAIL:-wobuxian@users.noreply.github.com}" commit -qm "v2.4 chars: $MSG"
timeout 120 git -c credential.interactive=never push origin v24-chars
git log --oneline -1

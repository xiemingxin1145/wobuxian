#!/usr/bin/env bash
# HD 资源包构建与发布（朝 500MB 目标增量）
# 1) 旧 11 图 WBX_RES=2 重渲染 HD 底图（village/sect/market/secret/graveyard/island/rift/heaven/longgong/guishi/cuizhai）
# 2) 临时目录 WBX_PROFILE=hd 全量打包 → zip
# 3) gh release upload assets-hd → 更新 hd-assets.json → commit+push（CI 自动用新 HD 包构建高清 APK）
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"
BL="${BLENDER:-/home/user/.doubao/agent_mode/workspace/tools/blender/blender-4.2.18-linux-x64/blender}"
VER=$(cat VERSION); STAMP=$(date +%Y%m%d%H%M)
ZIP="wbx-hd-assets-${VER}-${STAMP}.zip"
TMP="/tmp/hd_pack_${STAMP}"

# ---- 1) 旧 11 图 HD 重渲染（若 art/out/maps 里没有 k=2 的 png） ----
OLD_11=(village sect market secret graveyard island rift heaven longgong guishi cuizhai)
for mid in "${OLD_11[@]}"; do
  if [ ! -f "art/out/maps/${mid}.png" ] || ! grep -q '"k": 2' "art/out/maps/${mid}.json" 2>/dev/null; then
    echo "[HD-MAP] 渲染 ${mid} @2x ..."
    WBX_RES=2 WBX_THREADS=2 "$BL" -b -P art/render_map.py -- --map "$mid" > /tmp/hdmap_${mid}.log 2>&1 || echo "[HD-MAP] ${mid} 渲染失败(见日志)"
  else
    echo "[HD-MAP] ${mid} 已有 2x 底图，跳过"
  fi
done

# ---- 2) 临时目录 HD 全量打包 ----
rm -rf "$TMP"; mkdir -p "$TMP"
cp -r www "$TMP/www"                    # 以仓库 SD 资产为基线
cd "$TMP/www" && WBX_PROFILE=hd python3 "$ROOT/tools/build_assets.py" "$TMP/www" > /tmp/hd_pack.log 2>&1 || { echo "HD 打包失败:"; tail -20 /tmp/hd_pack.log; exit 1; }
grep -E "^sprites|maps |ui done|assets.js" /tmp/hd_pack.log | tail -8
cd "$TMP" && zip -q -r "$ZIP" assets/
SIZE=$(stat -c%s "$TMP/$ZIP"); echo "HD zip: $TMP/$ZIP size=$SIZE"

# ---- 3) 发布与登记 ----
cd "$ROOT"
gh release upload assets-hd "$TMP/$ZIP" --clobber
SHA=$(sha256sum "$TMP/$ZIP" | awk '{print $1}')
python3 - <<PY
import json
json.dump({"tag":"assets-hd","file":"$ZIP","size":$SIZE,"sha256":"$SHA"}, open("hd-assets.json","w"), indent=2, ensure_ascii=False)
PY
cat hd-assets.json
git add hd-assets.json && git commit -m "HD包: ${VER} 高清资源增量($(du -h "$TMP/$ZIP" | cut -f1))" -q
git push origin main
echo "HD 包发布完成: $ZIP"

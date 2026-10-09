#!/usr/bin/env bash
# 生成高清资源包（不进 git）：把 www/assets 复制到临时目录，用 WBX_PROFILE=hd 重新打包，
# 打成 zip 上传到 GitHub Release「assets-hd」（预发布，不影响 latest），并更新 hd-assets.json（文件名+sha256）。
# CI 构建前按 hd-assets.json 下载并校验后覆盖 www/assets，最终 APK = 代码 + 高清资源。
#   tools/make_hd_bundle.sh          仅生成 zip
#   tools/make_hd_bundle.sh upload   生成并上传
set -euo pipefail
cd "$(dirname "$0")/.."
VER=$(cat VERSION); STAMP=$(date +%Y%m%d%H%M)
T=$(mktemp -d); mkdir -p "$T/www"; cp -r www/assets "$T/www/"
WBX_PROFILE=hd python3 tools/build_assets.py "$T/www"
F="wbx-hd-assets-$VER-$STAMP.zip"
(cd "$T/www" && zip -q -r -0 "$OLDPWD/art/out/$F" assets)
SHA=$(sha256sum "art/out/$F" | cut -d' ' -f1); SIZE=$(stat -c %s "art/out/$F")
echo "$F $SIZE $SHA"; rm -rf "$T"
if [ "${1:-}" = "upload" ]; then
  gh release view assets-hd >/dev/null 2>&1 || gh release create assets-hd --prerelease --title "高清资源包（构建用，非安装包）" --notes "CI 构建 APK 时下载此资源包覆盖 www/assets。玩家请下载 latest 里的 wobuxian.apk。"
  gh release upload assets-hd "art/out/$F" --clobber
  printf '{\n  "tag": "assets-hd",\n  "file": "%s",\n  "size": %s,\n  "sha256": "%s"\n}\n' "$F" "$SIZE" "$SHA" > hd-assets.json
  echo "已上传并写入 hd-assets.json，请提交它"
fi

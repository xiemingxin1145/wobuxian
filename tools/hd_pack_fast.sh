#!/usr/bin/env bash
# HD 资源包构建与发布：基线 SD www/assets；覆盖：21 图 HD 底图 + frames2 全部写实精灵 HD + audio_hd 音频（UI 头像保持 SD 256）
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"
VER=$(cat VERSION); STAMP=$(date +%Y%m%d%H%M)
ZIP="wbx-hd-assets-${VER}-${STAMP}.zip"
TMP="/tmp/hd_pack_${STAMP}"

rm -rf "$TMP"; mkdir -p "$TMP"
cp -r www "$TMP/www"
cd "$TMP/www" && WBX_PROFILE=hd python3 "$ROOT/tools/build_assets.py" "$TMP/www" spr,maps,audio > /tmp/hd_pack.log 2>&1 || { echo "HD 打包失败:"; tail -20 /tmp/hd_pack.log; exit 1; }
grep -E "^sprites|maps |ui done|assets.js|^audio" /tmp/hd_pack.log | tail -8
echo "--- HD 包内 audio 数量 ---"
ls "$TMP/www/assets/audio" | wc -l
echo "--- 写实精灵 HD 校验（抽查） ---"
python3 -c "
import json
d=json.load(open('$TMP/www/assets/assets.json'))
for s in ['player_m0','npc_mentor','mon_slime','player_f1']:
    x=d['sprites'].get(s,{})
    print(s,'fw',x.get('fw'),'fh',x.get('fh'),'k',x.get('k'),'frames',len(x.get('f',{})))
"
cd "$TMP/www" && zip -q -r "$ZIP" assets/
SIZE=$(stat -c%s "$TMP/www/$ZIP"); echo "HD zip: $TMP/www/$ZIP size=$SIZE"

cd "$ROOT"
gh release upload assets-hd "$TMP/www/$ZIP" --clobber
SHA=$(sha256sum "$TMP/$ZIP" | awk '{print $1}')
python3 - <<PY
import json
json.dump({"tag":"assets-hd","file":"$ZIP","size":$SIZE,"sha256":"$SHA"}, open("hd-assets.json","w"), indent=2, ensure_ascii=False)
PY
cat hd-assets.json
git add hd-assets.json && git commit -m "HD包: ${VER} 高清资源增量($(du -h "$TMP/$ZIP" | cut -f1))" -q
git push origin main
echo "HD 包发布完成: $ZIP"

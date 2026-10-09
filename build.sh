#!/usr/bin/env bash
# 我不仙 一键构建：（可选）重新打包美术资源 → Android APK
#   ./build.sh          仅打包 APK（使用 www/ 中已生成的资源）
#   ./build.sh assets   先从 art/out 重新生成 www/assets（需先运行 Blender 渲染脚本，见 README）
# 环境变量：WBX_VERSION_NAME / WBX_VERSION_CODE（默认 VERSION 文件 / 3），WBX_KEYSTORE 等（见 android/app/build.gradle）
set -euo pipefail
cd "$(dirname "$0")"
export JAVA_HOME="${JAVA_HOME:-/workspace/jdk/jdk-17.0.20.1+1}"
export ANDROID_HOME="${ANDROID_HOME:-/workspace/android-sdk}"
GRADLE_ABS="${GRADLE:-$(command -v gradle || echo "$PWD/tools/gradle-8.9/bin/gradle")}"
export WBX_VERSION_NAME="${WBX_VERSION_NAME:-$(cat VERSION)}"
export WBX_VERSION_CODE="${WBX_VERSION_CODE:-3}"
if [ "${1:-}" = "assets" ]; then python3 tools/build_assets.py "$PWD/www"; fi
printf "// 由 build.sh / CI 自动生成：当前版本号（用于检查更新）\nwindow.APP_VERSION = { name: '%s', code: %s };\n" "$WBX_VERSION_NAME" "$WBX_VERSION_CODE" > www/js/version.js
rm -rf android/app/src/main/assets/www && mkdir -p android/app/src/main/assets/www
cp -r www/* android/app/src/main/assets/www/
(cd android && "$GRADLE_ABS" assembleRelease --no-daemon -q)
cp android/app/build/outputs/apk/release/app-release.apk wobuxian.apk
ls -la wobuxian.apk

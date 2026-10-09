#!/usr/bin/env bash
# 我不仙 一键构建：单文件 HTML + Android APK
set -euo pipefail
cd "$(dirname "$0")"
export JAVA_HOME="${JAVA_HOME:-/workspace/jdk/jdk-17.0.20.1+1}"
export ANDROID_HOME="${ANDROID_HOME:-/workspace/android-sdk}"
GRADLE_ABS="${GRADLE:-$(command -v gradle || echo "$PWD/tools/gradle-8.9/bin/gradle")}"
mkdir -p dist
python3 tools/inline.py www/index.html dist/wobuxian.html
rm -rf android/app/src/main/assets/www && mkdir -p android/app/src/main/assets/www
cp -r www/* android/app/src/main/assets/www/
(cd android && "$GRADLE_ABS" assembleDebug --no-daemon -q)
cp android/app/build/outputs/apk/debug/app-debug.apk wobuxian.apk
ls -la wobuxian.apk dist/wobuxian.html

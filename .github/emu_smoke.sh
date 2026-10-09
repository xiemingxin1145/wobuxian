#!/bin/bash
# 模拟器冒烟测试：安装 → 正常启动截图 → 以 #bot 模式启动，让页内机器人自动试玩 2 分钟 → 检查崩溃 / JS 错误 / 进度
set -u
PKG=com.wobuxian.game
adb install -r wobuxian.apk
adb logcat -c
adb shell am start -n $PKG/.MainActivity
sleep 20
adb exec-out screencap -p > emu_title.png
adb shell am force-stop $PKG
adb logcat -c
adb shell am start -n $PKG/.MainActivity --ez wbx_bot true
sleep 45; adb exec-out screencap -p > emu_bot1.png
sleep 45; adb exec-out screencap -p > emu_bot2.png
sleep 30; adb exec-out screencap -p > emu_bot3.png
adb logcat -d > logcat.txt
PID=$(adb shell pidof $PKG | tr -d '\r')
echo "pid=$PID"
grep -E "WBXBOT|WBXERR" logcat.txt | sed 's/.*CONSOLE([0-9]*)\] //' | tail -40
grep -E "FATAL EXCEPTION|ANR in $PKG" logcat.txt && { echo "::error::检测到应用崩溃/ANR"; exit 1; }
grep -q "WBXERR" logcat.txt && { echo "::error::机器人试玩中出现 JS 错误"; exit 1; }
[ -n "$PID" ] || { echo "::error::应用进程不存在"; exit 1; }
N=$(grep -c "WBXBOT" logcat.txt); echo "bot progress lines: $N"
[ "$N" -ge 3 ] || { echo "::error::机器人试玩没有推进"; exit 1; }
echo "emulator smoke OK"

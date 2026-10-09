#!/bin/bash
# 模拟器冒烟测试：安装 → 启动 → 等待 → 截图 → 检查崩溃/JS 错误
set -u
PKG=com.wobuxian.game
adb install -r wobuxian.apk
adb logcat -c
adb shell am start -n $PKG/.MainActivity
sleep 25
adb exec-out screencap -p > emu_title.png
# 点“开始新人生”（屏幕中部偏下），进入创建流程
W=$(adb shell wm size | grep -o '[0-9]*x[0-9]*' | tail -1); X=${W%x*}; Y=${W#*x}
adb shell input tap $((X/2)) $((Y*55/100)); sleep 4
adb exec-out screencap -p > emu_tap.png
adb logcat -d > logcat.txt
PID=$(adb shell pidof $PKG | tr -d '\r')
echo "pid=$PID"
grep -E "FATAL EXCEPTION|Uncaught|ANR in $PKG" logcat.txt && { echo "::error::检测到崩溃或 JS 未捕获错误"; exit 1; }
[ -n "$PID" ] || { echo "::error::应用进程不存在"; exit 1; }
grep -c "chromium" logcat.txt || true
echo "emulator smoke OK"

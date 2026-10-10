# 赤松坡试炼场（阶段 2 独立原型）

这是一个纯浏览器、无第三方运行时依赖的可玩遭遇战原型；不挂载到正式游戏页面，不访问 `Game`、正式战斗或存档。正式地图与 Boss/剧情战均未改动。

## 运行

在仓库根目录启动静态服务器：

```bash
python3 -m http.server 8090 --directory www
```

打开：<http://127.0.0.1:8090/prototypes/encounter/>（也可直接打开 `www/prototypes/encounter/index.html`，但推荐 HTTP 方式）。该 loopback 地址只在运行静态服务器的同一台电脑上可访问；当前 `openworld-wip` 尚未推送，也没有公开部署，因此其他设备无法通过这个 localhost URL 访问。此边界不影响仓库内本机复现。

## 操作与闭环

1. 在安全练习地图点击 **进入遭遇战**。
2. 通过 WASD/方向键或屏幕摇杆移动；按 **J/普攻**造成近身伤害，按 **K/雷击**造成范围伤害，按 **空格/闪避**位移并短暂无敌。
3. 敌人会追击；地面出现红色落点和连线后，片刻即发射灵弹。被灵弹或撞击命中会扣血。
4. 击败两只山魈显示胜利，生命耗尽显示失败；两种结算都可以**重新挑战**或**返回练习地图**。

## 可复现测试

安装仓库既有真人测试使用的 Python Playwright 与 Chromium 后，在仓库根目录运行：

```bash
set -o pipefail
ENCOUNTER_SCREENSHOT="$PWD/test/results/encounter-stage2-20261010T1458-touch-win.png" \
  python3 -B test/encounter_prototype.py | tee test/results/encounter-stage2-20261010T1458-touch.log
```

测试通过 Chromium CDP `Input.dispatchTouchEvent` 发送 `touchStart`、`touchMove`、`touchEnd`，以合成触摸驱动摇杆以及闪避、普攻、雷击、重试、返回等屏幕按钮；移动战斗时也会使用键盘。`window.EncounterPrototype.inspect()` 只读状态，脚本不直接写入游戏状态来取胜。该方式验证浏览器触摸事件路径，**不是实体触屏、Android 或真机测试**。

2026-10-10 的一次复测为 **8/8 PASS、0 FAIL、退出码 0**，pageerror=0、console.error=0、HTTP错误=0。完整日志为 `test/results/encounter-stage2-20261010T1458-touch.log`，胜利结算截图为 `test/results/encounter-stage2-20261010T1458-touch-win.png`；该次临时入口为 `http://127.0.0.1:41103/prototypes/encounter/`（每次启动会绑定随机可用回环端口）。截图和日志只记录这次测试，不等于人工试玩、真实设备验证或阶段2独立签收。

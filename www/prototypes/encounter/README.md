# 赤松坡试炼场（阶段 2 独立原型）

这是一个纯浏览器、无第三方运行时依赖的可玩遭遇战原型；不挂载到正式游戏页面，不访问 `Game`、正式战斗或存档。正式地图与 Boss/剧情战均未改动。

## 运行

在仓库根目录启动静态服务器：

```bash
python3 -m http.server 8090 --directory www
```

打开：<http://127.0.0.1:8090/prototypes/encounter/>（也可直接打开 `www/prototypes/encounter/index.html`，但推荐 HTTP 方式）。

## 操作与闭环

1. 在安全练习地图点击 **进入遭遇战**。
2. 通过 WASD/方向键或屏幕摇杆移动；按 **J/普攻**造成近身伤害，按 **K/雷击**造成范围伤害，按 **空格/闪避**位移并短暂无敌。
3. 敌人会追击；地面出现红色落点和连线后，片刻即发射灵弹。被灵弹或撞击命中会扣血。
4. 击败两只山魈显示胜利，生命耗尽显示失败；两种结算都可以**重新挑战**或**返回练习地图**。

## 可复现测试

安装仓库既有真人测试使用的 Python Playwright 与 Chromium 后，运行：

```bash
python3 test/encounter_prototype.py
```

脚本通过浏览器可见按钮、键盘与指针拖动操作游戏；摇杆步骤由 Playwright `page.mouse` 模拟指针事件，**不是真实触控测试**。`window.EncounterPrototype.inspect()` 只读战斗状态，测试没有直接写入状态来获胜。单实例复测命令（Chromium `/usr/bin/chromium`，412×915）为：

```bash
ENCOUNTER_SCREENSHOT="$PWD/test/results/encounter-stage2-20261010T1434-win.png" \
  python3 -B test/encounter_prototype.py
```

复核日志：`test/results/encounter-stage2-20261010T1434.log`；实际临时入口 `http://127.0.0.1:59933/prototypes/encounter/`（脚本每次绑定随机可用回环端口）。该次 8/8 PASS、0 FAIL、退出码0；pageerror=0、console.error=0、HTTP 4xx/5xx=0。对应胜利结算截图为 `test/results/encounter-stage2-20261010T1434-win.png`。首次失败轮次有一条404但未保存确切URL，favicon仅为当时的初步怀疑，不能当作已确认根因；页面现使用 data URI favicon，之后这次带HTTP response门禁的单实例重跑明确捕获0个失败响应。该结果是Chromium浏览器与鼠标/键盘模拟，不是实际触屏、Android、真机或多人试玩。

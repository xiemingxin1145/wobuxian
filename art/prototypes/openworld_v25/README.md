# v2.5 低模人物样例（离线资产）

本目录包含《我不仙》阶段 1 的三个独立低模角色样例：主角男、主角女、剑仙。几何由仓库脚本程序化生成，使用 Cube/Cylinder 挤出轮廓、支撑环/Loop Cut 与 X 轴 Mirror；本轮未修改 `art/chars.py`、正式精灵图集、游戏脚本或 Android 工程，也没有添加第三方素材。

## 交付文件

- `character_models.py`：三角色几何与冻结姿势的可编辑建模源脚本。
- `openworld_v25_models.blend`：Blender 4.2.23 LTS 场景，包含可编辑模型、镜像修改器、摄像机与灯光；三个模型根节点均标注 `runtime_integrated=false`。
- `render_compare.py`：在同一正交镜头和灯光下渲染当前造型及样例姿势，原始帧写入仓库忽略的 `art/out/openworld_v25/frames/`。
- `compose_previews.py`：合成 A/B、姿态、单色剪影、T0 同位置替换四张预览；剪影门槛失败时仍保留诊断板并明确报 FAIL，不把失败写成通过。
- `preview_geometry.py` / `validate_preview_geometry.py`：以 T0 实测截图脚点放置 3 个互斥替换模型，读取重渲 alpha 外轮廓，对 15 个手工标注区做 45 组静态净距检查；不是运行时点按或绘制层级检测。
- `validate_blend.py`：重开 `.blend` 后检查三个模型根、有限坐标、网格、Mirror、轮廓部件命名和未集成标志。
- `previews/openworld_v25_ab_compare.png`（1560×900）：现有模型与新样例的同镜头 A/B。
- `previews/openworld_v25_pose_sheet.png`（1540×1120）：待机、行走、攻击的冻结姿态图，不是动画。
- `previews/openworld_v25_silhouette_test.png`（1136×410）：48px / 64px 黑白剪影及主角男女蒙版 IoU 计算；不是真人辨认测试。
- `previews/openworld_v25_village_scale_mockup.png`（1968×622）：T0 原图与同一可走地砖上的三款互斥低模替换对照，不是游戏运行画面。

## 复现与验证

从仓库根目录运行；`BLENDER` 应指向**官方 Blender 4.2.23 LTS**：

```bash
BLENDER=/path/to/blender
"$BLENDER" -b -t 2 -P art/prototypes/openworld_v25/render_compare.py -- --out art/out/openworld_v25
python3 -B art/prototypes/openworld_v25/compose_previews.py
python3 -B art/prototypes/openworld_v25/validate_preview_geometry.py
"$BLENDER" -b --python-exit-code 1 art/prototypes/openworld_v25/openworld_v25_models.blend \
  -t 2 -P art/prototypes/openworld_v25/validate_blend.py
```

- 2026-10-10 本次重建明确使用 `character_models.py` 的 Git blob `3df62d345b5f5d005158d07d7267326ad6495a37`（与 `b6052ef` 及当前源 `HEAD=1600fc45` 中该文件相同；源文件 SHA-256 `f752280723cd2d2a7c87d2e0f691c93076753b34573b7d7f1d718e486ad462b1`），以官方 Blender **4.2.23 LTS** 从该源新建 `.blend` 并真实渲染 12 张 `320×352` 帧（现有造型 idle×3；新模型 idle/walk/attack×3角色）。最终 `.blend` SHA-256 `5f2ebd5343a6db92847fbc1199cc2cee75d9e37773f5621dabf85040cadd4f18`；四张预览按同一组新渲染帧重建，SHA-256 见下表。严格重开 `.blend` 验证通过：男主 35 个网格/3 个 Mirror/8 个挤出或环线命名部件；女主 40/3/9；剑仙 42/3/10；所有坐标有限且根节点 `runtime_integrated=false`。女主裙摆半宽约 `0.62`、男主约 `0.36`（约1.72倍），另有长发侧束。最终新帧的男女剪影 IoU 为 64px `0.692308`、48px `0.697318`；达到本轮项目自定 `≤0.70` 内部门槛（非行业标准、非真人辨认率）。

| 文件 | 尺寸 | SHA-256 |
|---|---:|---|
| `openworld_v25_models.blend` | Blender 4.2.23 场景 | `5f2ebd5343a6db92847fbc1199cc2cee75d9e37773f5621dabf85040cadd4f18` |
| `previews/openworld_v25_ab_compare.png` | 1560×900 | `7a0e50212517dea4dea7485747b429f08a4636b5b0016d512eeacca97d61243a` |
| `previews/openworld_v25_pose_sheet.png` | 1540×1120 | `1cd0d3698b548d9fc882221edc813a53ef050b2ee4200af761a04498b997c936` |
| `previews/openworld_v25_silhouette_test.png` | 1136×410 | `96ac992f3c23315c08afb5ea795acfbf6a377d70c992d3abad9d0ade2e502b0c` |
| `previews/openworld_v25_village_scale_mockup.png` | 1968×622 | `9c5f1456428299f380914442653154aaf2487e371cf967cca819585f19c465ee` |

从同一组 alpha 帧重建的 IoU 与摆位输出：64/48px 为 `0.692308/0.697318`；同脚点 `k=1.00`、15 个静态热点共45组净距检查通过，8px alpha 安全边距要求通过，距粉树净距男主41px/女主30px/剑仙41px，完整帧裁切余量87px；`node test/validate22.js` 为0错误。命令与真实/静态边界见下文。之前 `19fc932` 的历史源与帧是另一版，重算 IoU `0.679245/0.681648`，不得与本次最终产物混报。本次图片仅为离线静态候选；真实点按、五人盲测、不同设备/DPR、游戏接入、APK/Android 均未做。玛丽卡此前通过了图面候选的静态评审，但**本次同源重建仍待按最终干净提交 SHA 做签收**。

桃花村离线摆位使用 `test/human_olaf/001_T0_enter_map.png`，按 412 CSS px、DPR 2 与 `engine.js` 的 `R.Z = width × DPR / 860`（约 0.9581）换算；三个互斥模型同脚点 `(411,979)`、`k=1.00`，完整 160×176 帧显示约 153×169px，距面板裁切边至少 87px。基于同源重渲alpha外轮廓与15个手工标注区做45组静态净距检查通过；距粉色前景树最小净距：女主30px、男主/剑仙41px。栅栏被标为观察到的后景而非阻挡区；手工区域未覆盖全部树木/花草，真实遮挡与绘制层级仍需复核。剪影IoU≤0.70只是本轮项目自定过滤值，不等于用户识别率。**真实点按、不同设备/DPR验证及真人盲测均未做**；当前静态候选图面曾获玛丽卡通过，但最终提交 SHA 尚待签收。

## 范围边界

这是**离线美术样例**，不是可玩功能，也没有接入游戏、图集或正式地图；姿势板不是骨骼动画。未导出游戏精灵、未构建 APK、未在 Android/真机验证，也未进行真实触控或 5 人剪影识别。阶段 1 获得独立视觉签收之前，不开始阶段 2 的战斗原型。

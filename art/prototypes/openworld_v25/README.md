# v2.5 低模人物样例（离线资产）

本目录包含《我不仙》阶段 1 的三个独立低模角色样例：主角男、主角女、剑仙。几何由仓库脚本程序化生成，使用 Cube/Cylinder 挤出轮廓、支撑环/Loop Cut 与 X 轴 Mirror；本轮未修改 `art/chars.py`、正式精灵图集、游戏脚本或 Android 工程，也没有添加第三方素材。

## 交付文件

- `character_models.py`：三角色几何与冻结姿势的可编辑建模源脚本。
- `openworld_v25_models.blend`：Blender 4.2.23 LTS 场景，包含可编辑模型、镜像修改器、摄像机与灯光；三个模型根节点均标注 `runtime_integrated=false`。
- `render_compare.py`：在同一正交镜头和灯光下渲染当前造型及样例姿势，原始帧写入仓库忽略的 `art/out/openworld_v25/frames/`。
- `compose_previews.py`：合成三张可读预览；比例图使用原始 `test/human_olaf/003_T3_near_npc.png` 仅作标注明确的静态背景参照。
- `validate_blend.py`：重开 `.blend` 后检查三个模型根、有限坐标、网格、Mirror、轮廓部件命名和未集成标志。
- `previews/openworld_v25_ab_compare.png`（1560×900）：现有模型与新样例的同镜头 A/B。
- `previews/openworld_v25_pose_sheet.png`（1540×1120）：待机、行走、攻击的冻结姿态图，不是动画。
- `previews/openworld_v25_village_scale_mockup.png`（1648×800）：桃花村屏幕比例静态叠图，不是游戏运行画面。

## 复现与验证

从仓库根目录运行；`BLENDER` 应指向**官方 Blender 4.2.23 LTS**：

```bash
BLENDER=/path/to/blender
"$BLENDER" -b -t 2 -P art/prototypes/openworld_v25/render_compare.py -- --out art/out/openworld_v25
python3 -B art/prototypes/openworld_v25/compose_previews.py
"$BLENDER" -b --python-exit-code 1 art/prototypes/openworld_v25/openworld_v25_models.blend \
  -t 2 -P art/prototypes/openworld_v25/validate_blend.py
```

本轮 Blender 4.2.23 LTS 生成 12 张 `320×352` 帧（当前造型 idle×3；新模型 idle/walk/attack×3角色），并通过 Blend 文件严格验证：男主 35 个网格部件、3 个 Mirror、8 个挤出/环线命名部件；女主 38/3/7；剑仙 42/3/10。验证确认顶点坐标有限且根节点 `runtime_integrated=false`。比例预览尺寸、PNG 格式和非空文件均通过检查；原始渲染留在 `art/out/`，不纳入提交。

桃花村比例图按截图 412 CSS px、DPR 2，以及 `engine.js` 的 `R.Z = width × DPR / 860`（约 0.9581）换算；当前三个对应精灵的 manifest 比例 `k=1`，脚底锚点为 `0.86×176=151.36`。青色虚线是按 `ux23.js` 的 NPC 标签/点按框公式绘制的静态示意，**未做真实点按测试**；遮挡、剪影辨认与可读性仍待玛丽卡独立复核。

## 范围边界

这是**离线美术样例**，不是可玩功能，也没有接入游戏、图集或正式地图；姿势板不是骨骼动画。未导出游戏精灵、未构建 APK、未在 Android/真机验证，也未进行真实触控或 5 人剪影识别。阶段 1 获得独立视觉签收之前，不开始阶段 2 的战斗原型。

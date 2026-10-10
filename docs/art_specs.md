# 《我不仙》v2.2 角色设定稿（Blender 程序化 Q 版建模用）

> 范围：12 位新 NPC（taizi / xiabing / sanniang / guizu / baiwuchang / xiaoyao / caishen / zhuiming / suanpan / tianbing / leigong / guanghan）、3 个新 BOSS（guiwang / dasiming / tiandao2）、2 个新坐骑（carp / abacus）。
> 名单已与代码核对：`www/js/content22.js` 中 `NPCS`（12 个）与 `MONS`（boss:1 的 3 个）；坐骑定义在 `www/js/systems21.js` 的 `MOUNTS.carp / MOUNTS.abacus`（content22.js 里没有 MOUNTS），模型在 `art/monsters.py` 的 `m_carp / m_abacus`。
> 基于 git `e52c435`。设定背景来自 `content22.js` 的 CHAT/QUESTS/剧情台词、`events22.js` 和 `/workspace/game/research_v22.md`（世界建造尾款设定）。
> **重要**：`art/specs.py` 里**已经有**这 17 个条目的初版 spec（v2.2 段落）。本文在其基础上做设定细化：每个角色给出「可直接粘贴的建议 spec」+「与初版的差异」+「需要的扩展分支（如有）」。只用现有参数就能做出的部分标「✅现有参数」，需要往 `chars.py` 加几行的标「🔧扩展 Ex」（见第 2 节，全部只用 `lib.py` 现有几何体）。

---

## 0. 管线约定（从 `art/` 代码中整理）

### 0.1 渲染流程
| 项 | 约定（代码位置） |
|---|---|
| 引擎 | Blender 4.2 无头，Cycles CPU，`WBX_SAMPLES` 默认 24，OIDN 降噪（`lib.reset()`） |
| 相机 | 正交，`CAM_ROT=(60°,0,45°)`（俯视 30° 等距），`P=68` 像素/单位；世界 z 在屏幕上 ×0.866 |
| 描边 | 两层：Freestyle 外轮廓（`lib.toon()`，线色≈`#705445` α0.85，1.1px×WBX_RES）+ 反面外扩描边（`finish(outline=OL)`，`chars.OL=0.016`，`outline_mat()` 深棕≈`#453430`）。只有带 `outline=OL` 的部件有粗描边：脸、发帽、发髻、袍身、袖子、脚、帽子主体 |
| 灯光 | 暖白主光 + 冷色补光 + 背后轮廓光（`lib.lights()`） |
| 方向 | 只渲 5 向 `DIRS5=['S','SW','W','NW','N']`；SE/E/NE 由引擎水平镜像（`engine.js MIRROR`）。→ **左右不对称的细节（右手武器、腰间 sash）镜像后会换手，可接受；不要设计必须固定在一侧的标志** |
| 朝向 | 人物模型面朝 **-Y**；`render_sprites.py` 每个方向旋转 `root` |
| 动画 | 人物：`PL_ANIMS={idle:4,walk:6,attack:5,hurt:1}`（玩家/FIGHTERS/CHIBI_MON）；`NPC_ANIMS={idle:4,walk:6}`；`BOSS_ANIMS={idle:4,attack:5,hurt:1}` 只渲 `SE`；坐骑 `MOUNT_ANIMS={idle:4}` 5 向。动作全部是关节旋转（`chars.pose` / `monsters.mpose`），**无骨骼、无布料模拟、无形变** |
| 帧尺寸 | 普通 160×176，锚点 (0.5,0.86)；BOSS（`big=True`）320×352，锚点 (0.5,0.9)；整体缩放 `1.2×scale`。HD 包用 `WBX_RES` 倍率渲染 |
| 打包 | `pack.py`：每个 sprite 一张 webp 图集（有损 Q88，HD 无损），按 alpha 裁边，shelf 排布 ≤2048 宽，元数据进 `sprites.json`（`fw/fh/anims/dirs/f/k`） |
| 头像 | `render_portraits.py`：同一个 spec 透视特写 256×256（脸部和头饰是头像主体，细节优先放头部） |
| 缺素材 | `content22.js` 末尾“资源保护”会删除没有 sprite 的 NPC，所以 17 个 sprite 必须全部渲出 |

### 0.2 `chars.chibi(spec)` 可用参数（全部现有）
| 类别 | 参数 → 实现 |
|---|---|
| 身体 | `robe`（袍 lathe，sheen0.4）、`robe2`（交领 collar×2 + 前襟 panel 的 box）、`trim`（下摆 hem lathe + 袖口 cuff cyl，略金属）、`belt`（腰带 torus + sash box）、`pants`（腿 cyl，默认 `#4a3a3a`）、`shoe`（脚 sphere，默认 `#3a2a2a`）、`skin`（默认 `SK=#ffe0cc`，sss0.25）、`fat`（袍身/腰带半径倍率，1.0–1.3）、`skirt`（下摆半径，默认 0.3）、`cape`（背后 lathe 披风）、`ribbon2`（披帛 tube，自发光 0.6） |
| 头 | `headScale`（默认头半径 0.37）、`hair`（发色，也决定眉毛和狐耳颜色）、`hairstyle`：`bun`（顶髻+发带 torus+金簪）/`crown`（bun+金冠 lathe+红宝石）/`double`（双丫髻）/`pony`（后马尾 tube）/`short`（4 个短刺）/`none`（无头发，配帽子）；其他值（如 `guan`）= 只有发帽+刘海+鬓发；`long=True` 加长马尾；`ribbon` 发带色 |
| 帽/头饰 | `hat`：`straw`斗笠 / `tall`高帽（**颜色写死 `#262630`**，正面白牌） / `guan`小黑冠 / `hood`兜帽（`hood` 色） / `jiangshi`清朝官帽+黄符 / `flower`花簪（`flower` 色） / `scholar`儒巾（`hatc`） / `veil`幕篱（`hatc`） / `crown2`玉冠（`hatc`，自发光0.25）；另可叠加 `glasses`、`halo`（头后发光 torus）、`ears='fox'`、`horns`（tube 角）、`beard`+`beardc`（下巴 cone） |
| 脸 | `eyes`：`round`（黑大眼+高光）/`happy`=`closed`（弯弧，两者完全相同）/`angry`（**红色自发光细眼，颜色写死**）；`eye` 眼色（仅 round 生效）；`mouth`：`smile`/`open`/`flat`；`brow`、`blush`（默认开） |
| 道具 | `weapon`（右手）/`left`（左手）：`sword`/`gsword`（发光剑）/`gourd`/`fan`/`book`/`abacus`/`staff`（紫色发光球）/`hoe`/`claw`/`talisman`/`trident`/`basket`（**道具颜色全部写死**）；`back='sword'` 背剑；`tails=n` 狐尾（发色+白尖）；`armsForward`（僵尸平举） |

**管线做不到的（本稿全部避开）**：贴图/花纹/文字（帽子上的“一见生财”、号牌“甲”只能靠游戏内 2D 名牌/浮字表达）；布料模拟/飘动（披帛和披风是静态管，只随关节转）；手指/表情肌；逐帧换表情（`face()` 建模时生成一次，`pose()` 只转关节——攻击表情需要扩展 E0）；透明叠层太多会被降噪糊掉（`alpha<1` 部件每个角色 ≤1 种）。

### 0.3 现有角色色板（新角色沿用）
| 用途 | hex |
|---|---|
| 皮肤 | `#ffe0cc`（常规）、`#f0e8f4`/`#e8e4f0`/`#c8c0e0`（阴间/冥府系冷白）、`#b8d0c8`（鬼卒青灰）、`#fff8f0`（神性暖白） |
| 发色 | `#2a1b14` 棕黑（主角/弟子）、`#1a1a1a` 纯黑（官吏）、`#d8d8d8`/`#e8e8e8` 银白（老者）、`#3a7ad8`/`#2a6ad8` 龙族蓝 |
| 金/饰边 | `#ffd25e`（全游戏最常用的金）、`#ffcc40`、`#ffb020`、`#ffe08a`（龙角/浅金） |
| 红 | `#c0302a`（讨债司官红/印章红）、`#e84a5f`、`#d0303a`、`#e02a2a`（财神红） |
| 青/玉 | `#5fb3a0`、`#3a9a86`、`#2f8a7a`、`#9ff0d8` |
| 冷色 | `#4a6fc8`、`#4a7ab8`、`#9ad8ff`、`#bff0ff`（水/冰披帛） |
| 冥紫 | `#5a2a7a`、`#3a1a4a`、`#c060ff`、`#ff60c0`（鬼市荧光粉） |
| 黑/灰 | `#1a1a22`、`#262630`、`#34343e`（讨债司制服灰黑） |
| v2.2 地图色（research_v22） | 龙宫 珊瑚粉 `#f7a8a0`/水晶蓝 `#7fd8ff`；鬼市 灯笼红 `#e0402a`/鬼火青 `#7af0c8`/纸钱黄 `#e8d27a`；催债司 玉白 `#f4f1e6`/官印朱 `#c8202a`/账本金 `#e8b84a` |

### 0.4 体型基准（scale=1.2 时）
- 普通角色脚底到发顶 ≈1.41 单位×1.2 ≈ 1.7 单位 → 屏幕约 **105–120px 高**（发髻顶，含 ×0.866 俯视压缩）（帧 176px，上方留给帽子/光环）。头身比约 1:1.9（Q 版大头）。
- `fat` 只加粗袍身和腰带，不加粗腿和头；>1.3 时袖子会陷进袍子，建议上限 1.3。
- `headScale` 1.05–1.08 = “小孩/书呆”感；>1.1 会顶到帽子类坐标（帽子位置按头半径算，但刘海不跟随）。
- BOSS：`scale=2.0` ≈ 普通角色 1.67 倍（约 190–230px），`2.2` ≈ 1.83 倍；320×352 帧可容纳到 ≈4.6 单位高（含帽子/光环）。

---

## 1. 关键设计决定（总览）

1. **去重算盘**：初版 spec 里有 6 个角色拿 `abacus`（sanniang、zhuiming、caishen、suanpan、guiwang、tiandao2），剪影无法区分。本稿只保留 **算无遗（本职会计）、阴三娘（生前会计）、天道真身（总账房，大号背挂算盘）** 三个；追命改拿 `talisman`（=技能“催命符”），财神改拿元宝（E5），鬼王改拿面具（E6）。
2. **阵营色统一**：龙宫=水蓝+浅金；鬼市=冥紫/墨黑+荧光粉/鬼火青；催债司=黑底官红+金（官吏）或金甲红缨（天兵）；仙界闲散神=白/浅色+柔光（广寒、逍遥）。
3. **帽子是第一识别点**（俯视 30° + 100px 高，帽子/头饰占剪影 40%）：每个角色帽子或头部轮廓必须互不相同，详见各条。
4. **只做必要的扩展**：所有扩展分支只用 `sphere/cyl/box/torus/tube/lathe`，每条 ≤12 行，且都提供“不扩展的降级方案”。
5. **表情**：默认表情用 `eyes/mouth`；“攻击表情”只有做了 E0 才生效，否则攻击帧沿用默认表情（下文每个角色都给出两者）。

---

## 2. 扩展分支清单（🔧 加到 `art/chars.py`，可选）

| 编号 | 位置 | 内容（只用 lib 现有几何体） | 用到的角色 |
|---|---|---|---|
| **E0** 攻击换脸 | `chibi()` + `pose()` | 若 `spec['atkface']`（如 `{'eyes':'angry','mouth':'open'}`）存在：再调一次 `face(hp,c,hr,{**spec,**atkface},None)`，把新生成的对象收进 `R.faceAtk`、默认的收进 `R.face0`；`pose()` 中 `anim=='attack'` 时对两组对象设 `hide_render` 互换。约 10 行 | 全部 FIGHTERS + 3 BOSS |
| **E1** 高帽可配色 | `hat()` 的 `'tall'` 分支 | `M('#262630')` → `M(spec.get('hatc','#262630'))`；白牌 `M('#f4f0e0')` → `M(spec.get('tagc','#f4f0e0'))`。2 行 | baiwuchang、zhuiming、dasiming |
| **E2** 头盔 `hat='helm'` | `hat()` | `lathe` 半球盔 `[(0.4,0),(0.41,0.1),(0.33,0.24),(0.16,0.32),(0.02,0.35)]`（色 `hatc`，metal0.6，outline=OL）+ `torus` 盔沿（`trim`）+ 顶部 `cyl` 尖（金）+ `sphere` 红缨 r0.08（`spec['plume']`，scale(1,1,1.4)）+ 两侧 `box` 护耳 (0.06,0.14,0.18)。≈7 行 | tianbing |
| **E3** 背饰 `back='drums'` | `chibi()` 背剑分支旁 | 背后 `torus` 环 R0.46 r0.025（`rot=(D(80),0,0)`，loc (0,0.26,0.62)，金）+ 沿上半圆 6 个 `cyl` 小鼓 r0.07 h0.06（鼓身红 `#c0302a`，鼓面 `sphere` 压扁米白）。≈6 行 | leigong |
| **E4** 背饰 `back='abacus_big'` | 同上 | 直接复用 `monsters.tiandao()` 里算盘的写法：`box` 框 (0.9,0.06,0.5) 木色 + 7×3 颗 `sphere` 珠（`spec['beadc']`）+ 1 根 `box` 横梁；挂在 torso (0,0.32,0.78)，`rot=(D(-10),0,0)`，像“光背”。≈6 行 | tiandao2 |
| **E5** 道具 `'yuanbao'` | `weapon()` | `sphere` 船形底 r0.12 scale(1.5,0.8,0.55) + `sphere` 顶包 r0.07 + 两端 `sphere` r0.05 翘起；全部 `M('#ffcc40',metal=0.9,rough=0.2)`。≈4 行 | caishen |
| **E6** 道具 `'mask'` + 背饰 `back='masks'` | `weapon()` / `chibi()` | 面具：`sphere` r0.12 scale(1,0.3,1.2)（`spec['maskc']` 循环取色）+ 2 个黑 `sphere` 眼洞 + `tube` 红嘴弧；背饰：在背后半圆上放 5 张面具（白`#f4f0e8`/红`#c0302a`/黑`#1a1a1a`/金`#ffd25e`/青`#7af0c8`，每张后面贴一张 `box` 欠条 0.1×0.005×0.14 `#f3e6c8`）。≈10 行 | guiwang |
| **E7** 道具 `'brush'`（朱笔） | `weapon()` | `cyl` 笔杆 r0.025 h0.9（黑 `#1a1a1a`）+ `cyl` 笔斗 r0.045 h0.08（金）+ `cyl` 笔头 r0.05→0 h0.16（朱红 `#c8202a`，emit0.4）。≈3 行 | dasiming |
| **E8** 头饰 `ears='shrimp'` | `hat()` 狐耳分支旁 | 2 根 `tube` 长须（从额头向后上方弯成弧，r0.018，taper[1,0.7,0.2]，色=`hair`）+ 2 个 `cyl` 眼柄短须。≈3 行 | xiabing |
| **E9** 道具 `'rabbit'` | `weapon()` | 玉兔：`sphere` 身 r0.09 + `sphere` 头 r0.06 + 2 个 `cyl` 长耳 r0.02 h0.12 + 2 个黑眼点，白 `#ffffff` sss0.3。≈5 行 | guanghan |
| **E10** 道具 `'hammer'` | `weapon()` | `cyl` 锤柄 r0.025 h0.55（木）+ `cyl` 锤头 r0.09 h0.22 横放（`rot=(0,D(90),0)`，金 `#ffcc40` metal0.8）+ 锤头两端 `torus` 箍。≈3 行 | leigong |
| **E11** 第三只眼 `eye3` | `face()` 末尾 | 额头 `sphere` 白 r0.06 scale(1.3,0.4,0.85) + 虹膜 `sphere` r0.035 自发光 `spec['eye3']`（复用 `monsters.tiandao` 的眼睛配色 `#f0a020`）。≈2 行 | tiandao2 |
| **E12** 补丁 `patch` | `chibi()` torso | `spec['patch']=[色,...]`：在袍身表面放 1–2 个 `box` (0.07,0.01,0.07)，旋转 10°，`bevel=0.005`。≈3 行 | taizi、xiaoyao |

> 不做扩展时的降级：E0→攻击帧沿用默认表情；E1→白无常换 `hat='hood'` 白色；E2→天兵用 `crown2` 金色；E3/E10→雷公用 `staff`；E4→天道真身仍是手持 `abacus`；E5→财神 `left='gourd'`；E6→鬼王 `left='fan'`；E7→大司命 `gsword`；E8→虾兵 `ears='fox'`；E9→广寒不拿道具；E11/E12→省略。

---

## 3. NPC（12 位）

下文“建议 spec”可直接替换 `specs.py` 中 `NPCS.update({...})` 的对应条目。配色表中“部件”对应 0.2 节的参数。

### 3.1 龙宫太子·敖小白 `taizi`（龙宫 · 可同行 · FIGHTER）
- **人设依据**：“本太子很穷，但本太子很体面”；父王放了三千年高利贷，他梦想当普通鲤鱼；龙宫改民宿。
- **建议 spec**
```python
'taizi': dict(robe='#4ab0e8', robe2='#ffffff', trim='#ffd25e', belt='#ffd25e', pants='#2a5a8a', shoe='#1a3a6a',
              hair='#2a6ad8', hairstyle='crown', ribbon='#bff0ff', horns='#ffe08a', cape='#1a5aa8', ribbon2='#bff0ff',
              weapon='fan', eyes='happy', mouth='smile', headScale=1.04, skirt=0.31,
              patch=['#8ad0f0'], atkface=dict(eyes='round', mouth='open', eye='#1a4a9a'))
```
| 服饰部件 | 实现 | 配色 |
|---|---|---|
| 龙纹蓝袍 | `robe` lathe | `#4ab0e8` |
| 白交领/前襟 | `robe2` | `#ffffff` |
| 金下摆+袖口 | `trim` | `#ffd25e` |
| 金腰带 | `belt` torus | `#ffd25e` |
| 深蓝披风 | `cape` | `#1a5aa8` |
| 水色披帛 | `ribbon2` tube（自发光） | `#bff0ff` |
| 袍角补丁（体面的穷） | 🔧E12 `patch` | `#8ad0f0`（只比袍色浅一档，近看才发现） |
| 裤/靴 | `pants`/`shoe` | `#2a5a8a` / `#1a3a6a` |
- **发型和头饰**：`hairstyle='crown'`（顶髻+小金冠+红宝石）+ `horns='#ffe08a'` 浅金龙角从冠两侧伸出——龙角+金冠组合是他和其他所有角色的剪影区别。发色龙族蓝 `#2a6ad8`。
- **标志性道具**：右手 `fan`（米白折扇=“体面”）。龙珠（events 里的弹珠夜明珠）不做手持，交给游戏内 2D 光点。
- **表情**：默认 `happy`+`smile`（硬撑的体面笑）；攻击（E0）`round`+`open`，眼色 `#1a4a9a`（认真起来的少年）。
- **体型**：标准体，`headScale=1.04` 显年轻，`skirt=0.31`。不加 fat。
- **设计钩子**：一身龙宫正装全是租的——唯一的补丁打在袍角，正好是他爹三千年利息里欠裁缝的那一笔。

### 3.2 虾兵队长·阿虾 `xiabing`（龙宫 · 杂兵/可捕捉灵兽 · FIGHTER）
- **人设依据**：“三个月没发饷”“不怕死，怕加班”“下辈子投胎当龙虾——贵”；罢工举牌。
- **建议 spec**（初版用了紫色发光球 `staff`、`fox` 耳，不像虾也不像兵 → 改）
```python
'xiabing': dict(robe='#ff8a5a', robe2='#ffe0d0', trim='#c04a2a', belt='#8a5a3a', pants='#c04a2a', shoe='#c04a2a',
                hair='#ff6a3a', hairstyle='none', hat='hood', hood='#ff7a4a', ears='shrimp', tails=1,
                weapon='trident', eyes='round', mouth='open', eye='#1a1010', skin='#ffe8dc', fat=0.95, skirt=0.27,
                atkface=dict(eyes='angry', mouth='open'))
```
| 服饰部件 | 实现 | 配色 |
|---|---|---|
| 虾壳身（袍） | `robe` | `#ff8a5a` |
| 浅腹甲（交领/前襟） | `robe2` | `#ffe0d0` |
| 壳节边（下摆/袖口） | `trim` | `#c04a2a` |
| 草绳腰带 | `belt` | `#8a5a3a` |
| 虾头盔 | `hat='hood'` | `#ff7a4a` |
| 虾尾 | `tails=1`（狐尾管，发色+白尖，正好像虾尾扇） | `#ff6a3a` + 尖 `#fff8f0` |
| 腿/脚 | `pants`/`shoe` | `#c04a2a` |
- **发型和头饰**：`hairstyle='none'` + 兜帽当虾头壳；🔧E8 `ears='shrimp'` 两根长触须向后弯（降级：`ears='fox'` 同初版）。
- **标志性道具**：右手 `trident`（虾兵蟹将标配钢叉，金杆银尖，现有道具）。
- **表情**：默认 `round`+`open`（喊“报告！”）；攻击 `angry`。
- **体型**：`fat=0.95`、`skirt=0.27` 偏瘦小（饿的），作为可捕捉灵兽在宠物栏里也不会比主角大。
- **设计钩子**：钢叉上本来该挂军旗，现在挂的是“还我饷银”——三界最穷的兵，在给欠了三界钱的龙宫看大门。

### 3.3 鬼市掌柜·阴三娘 `sanniang`（鬼市 · 可同行）
- **人设依据**：“生前是做账的，死后还是做账的”；生前是讨债司会计，查出假账被灭口；“一手交钱，一手交魂”。
- **建议 spec**
```python
'sanniang': dict(robe='#3a1a4a', robe2='#c8a0e0', trim='#ff60c0', belt='#ff60c0', pants='#2a1030', shoe='#1a0a20',
                 hair='#1a1018', hairstyle='pony', long=True, ribbon='#ff60c0', hat='hood', hood='#2a1030',
                 ribbon2='#7af0c8', weapon='abacus', eyes='happy', mouth='smile', skin='#f0e8f4', skirt=0.34,
                 atkface=dict(eyes='round', eye='#7a2a9a', mouth='smile'))
```
| 服饰部件 | 实现 | 配色 |
|---|---|---|
| 墨紫长裙袍 | `robe`，`skirt=0.34` 女性裙摆 | `#3a1a4a` |
| 淡紫交领 | `robe2` | `#c8a0e0` |
| 荧光粉边/腰带 | `trim`/`belt` | `#ff60c0` |
| 鬼火青披帛 | `ribbon2`（自发光 → 夜景里最亮的线条） | `#7af0c8` |
| 兜帽 | `hat='hood'` | `#2a1030` |
- **发型和头饰**：黑长马尾 `pony`+`long`，兜帽压在发帽上，马尾从帽后垂出；粉色发带。
- **标志性道具**：右手 `abacus`（保留：她是三位“正牌会计”之一）。
- **表情**：默认 `happy`+`smile`（笑眯眯的生意人）；攻击（若加入 FIGHTERS 并做 E0）`round` 紫瞳 + `smile`——笑着收魂。
- **体型**：标准女性，皮肤冷白 `#f0e8f4`（与鬼卒青灰区分：她“体面”）。
- **设计钩子**：她手里那把算盘，就是当年在讨债司查出天道假账时用的那一把——死后带下来，专门用来跟天道算旧账。
- ⚠ 她是 `comp:1` 同行角色但不在 `FIGHTERS`，战斗里只有 idle 帧（drawSprite 回落 idle）。建议加入 FIGHTERS（多 6 帧×5 向）。

### 3.4 鬼卒·小六 `guizu`（鬼市 · 杂兵/可捕捉 · FIGHTER）
- **人设依据**：“我是临时工，出了事别找我”“绩效不达标要去投胎”“你阳气好重，我怕热”。
- **建议 spec**
```python
'guizu': dict(robe='#2a3a3a', robe2='#8ab0a0', trim='#4a6a6a', belt='#e8d27a', pants='#1a2a2a', shoe='#1a1a1a',
              hair='#1a1a1a', hairstyle='none', hat='hood', hood='#1a2a2a', weapon='claw', left='talisman',
              eyes='round', eye='#3a5a5a', mouth='flat', skin='#b8d0c8', fat=0.9, skirt=0.27, headScale=1.06,
              atkface=dict(eyes='angry', mouth='open'))
```
| 服饰部件 | 实现 | 配色 |
|---|---|---|
| 灰青号服 | `robe` | `#2a3a3a` |
| 浅青领 | `robe2` | `#8ab0a0` |
| 暗边 | `trim` | `#4a6a6a` |
| 纸钱黄腰带（临时工工牌色） | `belt` | `#e8d27a` |
| 兜帽 | `hat='hood'` | `#1a2a2a` |
| 青灰皮肤 | `skin` | `#b8d0c8` |
- **发型和头饰**：无发 + 深兜帽（和三娘同为兜帽，但颜色青黑、无马尾、头更大 → 剪影是“圆头小个子”）。
- **标志性道具**：右手 `claw`（勾魂爪），左手 `talisman`（黄符=没人要的业绩单）。
- **表情**：默认 `round`+`flat`（委屈打工人）；攻击 `angry`+`open`。
- **体型**：`fat=0.9`、`headScale=1.06`，瘦小大头。
- **设计钩子**：左手那张黄符其实是他的绩效考核表——再完不成就要被“投胎”，鬼界的裁员。

### 3.5 白无常·谢必安 `baiwuchang`（鬼市 · 功能 NPC：问阳寿）
- **人设依据**：帽子写“一见生财”（背面“概不赊账”）；黑无常请假、一个人上班；拿名册点名；“阳寿和欠款是两回事”。
- **建议 spec**
```python
'baiwuchang': dict(robe='#f4f4f4', robe2='#c8c8c8', trim='#1a1a1a', belt='#1a1a1a', pants='#e8e8e8', shoe='#1a1a1a',
                   hair='#e8e8e8', hairstyle='none', hat='tall', hatc='#f4f4f0', tagc='#c0302a',
                   weapon='book', left='talisman', eyes='closed', mouth='open', skin='#f8f8ff', skirt=0.32,
                   blush=False)
```
| 服饰部件 | 实现 | 配色 |
|---|---|---|
| 白长袍 | `robe` | `#f4f4f4` |
| 灰领 | `robe2` | `#c8c8c8` |
| 黑边/黑腰带（唯一的黑，呼应请假的黑无常） | `trim`/`belt` | `#1a1a1a` |
| **白高帽** | 🔧E1 `hat='tall'`+`hatc` | `#f4f4f0` |
| 帽牌（“一见生财”，文字靠 2D） | 🔧E1 `tagc` | `#c0302a` 红牌 |
| 冷白皮肤，无腮红 | `skin`、`blush=False` | `#f8f8ff` |
- **发型和头饰**：无发，超高白帽是全游戏最高的剪影（`tall` 帽高 0.62）。降级：`hat='hood'`、`hood='#f4f4f4'`（会丢失标志性）。
- **标志性道具**：右手 `book`（点名册），左手 `talisman`（哭丧棒的简化——黄符即可；管线没有白色纸条束，不追求）。
- **表情**：默认 `closed`+`open`（眯眼、张嘴——传统白无常吐舌的 Q 版温和处理，`open` 的暗红小口即可）。不战斗，无攻击表情。
- **体型**：标准体，`skirt=0.32` 长袍到脚。
- **设计钩子**：帽子正面红牌“一见生财”，背面“概不赊账”——连勾魂的都在提醒你：阳寿可以慢慢算，欠款不行。

### 3.6 逍遥散人 `xiaoyao`（坊市→秘境→鬼市 游荡 · 讲道）
- **人设依据**：“披着破蓑衣的老头躺在路边晒太阳”；八百岁、从不签合同；酒；第十八章揭示他当年拒绝当担保人。
- **建议 spec**
```python
'xiaoyao': dict(robe='#9ac0a0', robe2='#f4f8f0', trim='#5a8a6a', belt='#8a6a3a', pants='#6a7a5a', shoe='#5a4a3a',
                hair='#d8d8d8', hairstyle='bun', ribbon='#5a8a6a', hat='straw', beard=True, beardc='#e8e8e8',
                cape='#b89a5a', left='gourd', weapon='fan', eyes='closed', mouth='smile', skirt=0.3,
                patch=['#7a9a7a', '#c8b07a'])
```
| 服饰部件 | 实现 | 配色 |
|---|---|---|
| 旧青衫 | `robe` | `#9ac0a0` |
| 米白领 | `robe2` | `#f4f8f0` |
| 破蓑衣 | `cape` | `#b89a5a`（草黄，比 `straw` 帽 `#d9b56a` 暗一档，两者分得开） |
| 草绳腰带 | `belt` | `#8a6a3a` |
| 两块补丁 | 🔧E12 | `#7a9a7a`、`#c8b07a` |
| 斗笠 | `hat='straw'`（颜色写死 `#d9b56a`） | — |
| 白胡子 | `beard` | `#e8e8e8` |
- **发型和头饰**：银白发髻（`bun`）+ 斗笠。注意与落魄剑仙 `mentor`（灰袍、straw、`hairstyle='none'`、背剑）区分：散人**有发髻、无剑、有蓑衣、青色袍**。
- **标志性道具**：左手 `gourd`（酒葫芦），右手 `fan`。
- **表情**：默认 `closed`+`smile`（晒太阳的眯眼笑）。不战斗。
- **体型**：标准体，不加 fat（瘦老头）。
- **设计钩子**：三界唯一没欠天道一文钱的人——因为一万年前剑仙递来担保合同时，他眯着眼说了句“我不签字”，就去晒太阳了。

### 3.7 财神 `caishen`（坊市→催债司 游荡 · 拜财神）
- **人设依据**：“恭喜发财！红包拿来——哦不，是我给你”；财神也有 KPI；“天道欠我的钱比欠你的还多”；骑金蟾下凡；撒红包雨。
- **建议 spec**
```python
'caishen': dict(robe='#e02a2a', robe2='#ffd25e', trim='#ffd25e', belt='#ffd25e', pants='#8a1a1a', shoe='#1a1a1a',
                hair='#1a1a1a', hairstyle='guan', hat='crown2', hatc='#ffd25e', beard=True, beardc='#1a1a1a',
                weapon='yuanbao', left='book', eyes='happy', mouth='open', fat=1.3, skirt=0.36)
```
| 服饰部件 | 实现 | 配色 |
|---|---|---|
| 大红官袍 | `robe`，`fat=1.3` | `#e02a2a` |
| 金领/金边/金腰带 | `robe2`/`trim`/`belt` | `#ffd25e` |
| 金冠 | `hat='crown2'`，`hatc` | `#ffd25e`（自发光 0.25） |
| 黑长须 | `beard` | `#1a1a1a` |
| 裤 | `pants` | `#8a1a1a` |
- **发型和头饰**：黑发+金玉冠（金簪横插）。与 `longpao` 时装/天兵区分靠 **fat=1.3 的圆身 + 黑胡子**。
- **标志性道具**：右手 🔧E5 金元宝；左手 `book`（KPI 账本，红封皮正好像红包）。降级：`left='gourd'`、`weapon='fan'`。**不再拿算盘**。
- **表情**：默认 `happy`+`open`（“恭喜发财！”）。不战斗。
- **体型**：最胖的 NPC（与初版一致 1.3，已是上限）。
- **设计钩子**：左手的红皮账本不是红包，是天道欠他的借条汇总——三界最有钱的神，也是天道最大的债主之一。

### 3.8 催债司主簿·追命 `zhuiming`（催债司 · 小 BOSS · FIGHTER）
- **人设依据**：“追的是钱”“催收成功率 99%，剩下那个是你”；技能“催命符”（利滚利）；梦里问“你觉得我这辈子值吗”。
- **建议 spec**（左手 abacus → talisman）
```python
'zhuiming': dict(robe='#1a1a22', robe2='#c0303a', trim='#ffd25e', belt='#c0303a', pants='#1a1a22', shoe='#0a0a10',
                 hair='#1a1a1a', hairstyle='none', hat='tall', hatc='#262630', tagc='#ffd25e',
                 weapon='book', left='talisman', eyes='round', eye='#2a1a14', mouth='flat', skin='#e8e4f0',
                 skirt=0.3, blush=False, atkface=dict(eyes='angry', mouth='open'))
```
| 服饰部件 | 实现 | 配色 |
|---|---|---|
| 黑官服 | `robe` | `#1a1a22` |
| 红领/红腰带 | `robe2`/`belt` | `#c0303a` |
| 金边 | `trim` | `#ffd25e` |
| 黑高帽 + **金牌** | `hat='tall'`（E1 后可改牌色） | 帽 `#262630`，牌 `#ffd25e`（区别于讨债鬼 `collector` 的白牌） |
- **发型和头饰**：无发黑高帽。与 `collector`（灰袍白牌）、`judge`（暗红袍、胖、胡子）、大司命（巨大、胡子）同为高帽系，用**牌色金 + 无胡子 + 标准身材**区分。
- **标志性道具**：右手 `book`（催收簿），左手 `talisman`（催命符，黄色自发光——与技能 `cuiming` 图标 `tal_r` 对应）。
- **表情**：默认 `round`+`flat`（厌倦的上班族——他“不喜欢这份工作，但擅长”）；攻击（E0）`angry`+`open`。不做 E0 时建议默认仍用 `round`，保留人设的疲惫感。
- **体型**：标准体，`blush=False`（不近人情的白脸）。
- **设计钩子**：催命符每贴一次就多一层利息——他手里那张已经叠到第 99 层了，剩下 1% 的空白，就是留给你的位置。

### 3.9 天道会计·算无遗 `suanpan`（催债司 · 卧底盟友 · 核账服务）
- **人设依据**：“一文都不会错——除了天道自己的”；“说了要扣工资”；胆小、良心未泯；当了天道三千年会计。
- **建议 spec**
```python
'suanpan': dict(robe='#8a5a2a', robe2='#ffe6b0', trim='#3a2a1a', belt='#3a2a1a', pants='#5a3a1a', shoe='#2a1a0a',
                hair='#3a2a1a', hairstyle='bun', ribbon='#3a2a1a', hat='scholar', hatc='#3a2a1a', glasses=True,
                weapon='abacus', left='book', eyes='round', eye='#3a2a14', mouth='flat', headScale=1.07, skirt=0.29)
```
| 服饰部件 | 实现 | 配色 |
|---|---|---|
| 账房褐袍 | `robe` | `#8a5a2a` |
| 米黄领 | `robe2` | `#ffe6b0` |
| **深色袖套**（`trim` 让袖口成黑色袖套） | `trim` | `#3a2a1a` |
| 儒巾 | `hat='scholar'`，`hatc` | `#3a2a1a` |
| 眼镜 | `glasses=True` | 写死 `#2a2a2a` |
- **发型和头饰**：小发髻+黑儒巾+圆眼镜。与 `bailang`（青儒巾、扇子、长发）/`storyteller`（胡子）区分靠眼镜+算盘。
- **标志性道具**：右手 `abacus`，左手 `book`（总账）。
- **表情**：默认 `round`+`flat`（紧张、认真）。不战斗。
- **体型**：`headScale=1.07`（书呆大头），不加 fat，略矮的视觉。
- **设计钩子**：他的算盘三千年从没算错过一笔——除了每次算到天道自己那一行，手就开始抖。

### 3.10 天兵甲 `tianbing`（催债司 · 守卫/可捕捉 · FIGHTER）
- **人设依据**：“编号是甲”；梦想当天兵乙（“乙的福利好一点”）；站岗打瞌睡。
- **建议 spec**（初版用 `crown2` 玉冠 → 改头盔）
```python
'tianbing': dict(robe='#d8b040', robe2='#f4f0e0', trim='#c0302a', belt='#c0302a', pants='#6a4a2a', shoe='#3a2a1a',
                 hair='#1a1a1a', hairstyle='none', hat='helm', hatc='#d8b040', plume='#c0302a',
                 cape='#c0302a', weapon='trident', eyes='closed', mouth='flat', skirt=0.28,
                 atkface=dict(eyes='angry', mouth='open'))
```
| 服饰部件 | 实现 | 配色 |
|---|---|---|
| 金甲（袍） | `robe` | `#d8b040` |
| 白内衬领 | `robe2` | `#f4f0e0` |
| 红边/红腰带/红披风 | `trim`/`belt`/`cape` | `#c0302a` |
| 金盔 + 红缨 | 🔧E2 `hat='helm'`，`hatc`，`plume` | `#d8b040` / `#c0302a` |
- **发型和头饰**：无发 + 圆盔红缨（全游戏唯一的头盔剪影）。降级：`hat='crown2', hatc='#ffd25e'`（初版）。
- **标志性道具**：右手 `trident`（长兵器，站岗用）。初版是 `gsword`；改长枪类更像“站岗的兵”，且与虾兵同为叉但颜色完全不同（金甲红缨 vs 橙壳）。如需差异最大化，可保留 `gsword`。
- **表情**：默认 `closed`+`flat`（站岗打瞌睡）；攻击（E0）`angry`+`open`（“我没睡！”）。
- **体型**：`skirt=0.28` 收身显挺拔，标准头。
- **设计钩子**：天兵甲的盔甲是天庭统一采购的——采购款也是向天道借的，所以他连“乙”都升不上去。

### 3.11 雷公 `leigong`（催债司 · 淬体服务 · 第十七章 BOSS · FIGHTER）
- **人设依据**：“谁欠债不还？我劈他！”；**近视**、常劈错人（research_v22）；锤子丢过；天劫外包商。
- **建议 spec**
```python
'leigong': dict(robe='#3a4ab8', robe2='#ffe040', trim='#ffe040', belt='#ffe040', pants='#1a2a7a', shoe='#1a1a3a',
                hair='#e8e8ff', hairstyle='crown', ribbon='#ffe040', horns='#ffe040', cape='#1a2a7a',
                beard=True, beardc='#ffcc40', glasses=True, skin='#a8b8f0', back='drums',
                weapon='hammer', eyes='angry', mouth='open', fat=1.1, skirt=0.3,
                atkface=dict(eyes='angry', mouth='open'))
```
| 服饰部件 | 实现 | 配色 |
|---|---|---|
| 靛蓝雷袍 | `robe` | `#3a4ab8` |
| 电黄领/边/腰带 | `robe2`/`trim`/`belt` | `#ffe040` |
| 深蓝披风 | `cape` | `#1a2a7a` |
| 蓝皮肤 | `skin` | `#a8b8f0`（传统雷公蓝脸的 Q 版浅化） |
| **黄色尖“雷公嘴”** | `beard=True`+`beardc`（下巴 cone 正好是尖喙形状，零代码） | `#ffcc40` |
| 近视眼镜 | `glasses=True` | — |
| 背后连鼓 | 🔧E3 `back='drums'` | 环 `#ffcc40`，鼓身 `#c0302a`，鼓面 `#f4e8d0` |
- **发型和头饰**：银白顶髻+小金冠（`crown`）+ 电黄角（`horns`）——发型像炸起的电毛。
- **标志性道具**：右手 🔧E10 雷锤（降级 `staff`）。
- **表情**：默认 `angry`+`open`（暴躁）。注意 `angry` 眼是红色发光细眼，会被眼镜框住——“戴眼镜还瞪人”本身就是笑点。攻击同默认。
- **体型**：`fat=1.1` 结实。
- **设计钩子**：天劫是天道外包给雷部的，三千年没结过电费——所以他劈人从来不瞄准，近视眼镜也是渡劫者众筹给他配的。

### 3.12 广寒仙子 `guanghan`（催债司 · 赏月回满 · 可同行）
- **人设依据**：“月宫太冷，来天庭上班至少有暖气”；玉兔欠三百年药没捣；桂花酒员工价；冷淡。
- **建议 spec**
```python
'guanghan': dict(robe='#f4f8ff', robe2='#c8d8ff', trim='#9ab0ff', belt='#9ab0ff', pants='#c8d8ff', shoe='#9ab0ff',
                 hair='#1a1a2a', hairstyle='double', long=True, ribbon='#c8d8ff', hat='flower', flower='#ffc94a',
                 cape='#dfe8ff', ribbon2='#e0e8ff', halo='#e8f0ff', left='rabbit',
                 eyes='closed', mouth='flat', eye='#3a4a8a', skirt=0.36, atkface=dict(eyes='round', mouth='flat'))
```
| 服饰部件 | 实现 | 配色 |
|---|---|---|
| 月白长裙 | `robe`，`skirt=0.36` | `#f4f8ff` |
| 浅月蓝领/腿 | `robe2`/`pants` | `#c8d8ff` |
| 冰蓝边/腰带 | `trim`/`belt` | `#9ab0ff` |
| 厚披肩（怕冷） | `cape` | `#dfe8ff` |
| 披帛 | `ribbon2` | `#e0e8ff` |
| 月轮光环 | `halo` | `#e8f0ff`（自发光 4.0） |
| **桂花簪**（初版是白花，改金黄桂花） | `hat='flower'`，`flower` | `#ffc94a` |
| 玉兔 | 🔧E9 `left='rabbit'` | `#ffffff` |
- **发型和头饰**：黑发双丫髻+长发，金黄桂花簪+背后月轮 halo。与 `lengyue`（银发、幕篱、剑）完全不撞。
- **标志性道具**：左手抱玉兔（E9；降级不拿）。
- **表情**：默认 `closed`+`flat`（冷淡）；同行攻击（E0）`round`+`flat`（睁眼，仍不笑）。
- **体型**：标准女性，裙摆最大（0.36）配披肩，像裹着一层“棉被”。
- **设计钩子**：她披着三层披肩来天庭上班，不是为了 KPI，是为了暖气——月宫的取暖费，天道三千年没报销。
- ⚠ 与三娘相同：`comp:1` 但不在 `FIGHTERS`，建议加入。

---

## 4. BOSS（3 个，`dirs=['SE']`，`BOSS_ANIMS`，320×352 帧）

| BOSS | specs.py scale | 相对普通角色 | 渲染高度（估） |
|---|---|---|---|
| 鬼王·千面 `guiwang` | 2.0 | ×1.67 | ≈220px（兜帽+角；背面具不加高） |
| 大司命 `dasiming` | 2.0 | ×1.67 | ≈275px（高帽） |
| 天道真身 `tiandao2` | 2.2 | ×1.83 | ≈270px（双层冠；帧内锚点以上上限 317px，**不要再加高**） |

### 4.1 鬼王·千面 `guiwang`（鬼市北戏台 · 第十三章）
- **人设依据**：戏精，“今晚的戏码是《讨债人之死》”；一千张脸，每张都欠三娘钱，打碎后“每张脸后面都贴着一张欠条”；技能阴钱交易/千面换魂/勾魂索。
- **建议 spec**
```python
SPRITES['boss_guiwang'] = dict(kind='chibi', spec=dict(
    robe='#1a1a2a', robe2='#6a3aaa', trim='#c060ff', belt='#e0402a', pants='#120a1a', shoe='#120a1a',
    hair='#e0e0f0', hairstyle='none', hat='hood', hood='#120a1a', horns='#4a2a6a', cape='#e0402a',
    ribbon2='#7af0c8', weapon='fan', left='mask', back='masks', eyes='angry', mouth='open',
    skin='#c8c0e0', fat=1.2, skirt=0.34, atkface=dict(eyes='angry', mouth='open')),
    anims=BOSS_ANIMS, dirs=['SE'], big=True, scale=2.0)
```
| 服饰部件 | 实现 | 配色 |
|---|---|---|
| 墨色戏袍 | `robe`，`fat=1.2` | `#1a1a2a` |
| 紫领 | `robe2` | `#6a3aaa` |
| 紫边 | `trim` | `#c060ff` |
| 灯笼红腰带 + 红戏台披风 | `belt`/`cape` | `#e0402a`（鬼市灯笼红，初版披风是暗紫 `#2a0a3a`，在暗背景里看不见 → 改红） |
| 鬼火披帛 | `ribbon2` | `#7af0c8` |
| 兜帽+紫角 | `hat='hood'`/`horns` | `#120a1a` / `#4a2a6a` |
| 背后面具扇环 | 🔧E6 `back='masks'` | 白`#f4f0e8`/红`#c0302a`/黑`#1a1a1a`/金`#ffd25e`/青`#7af0c8`，欠条 `#f3e6c8` |
- **发型和头饰**：兜帽+角；背后半圆 5 张面具形成“孔雀开屏”式剪影（戏曲靠旗的意象），是 SE 单向渲染下最显眼的特征。
- **标志性道具**：右手 `fan`（戏扇），左手 🔧E6 `mask`。降级：`left='fan'` 不变、无面具环（初版 `staff`+`abacus` 与追命/天道撞）。
- **表情**：默认 `angry`+`open`（唱戏的大张口）；攻击同。可选彩蛋：E0 的攻击脸换 `happy`+`open`（翻脸=换脸）。
- **体型/比例**：scale 2.0，`fat=1.2`。面具环半径控制在 ≤0.55 局部单位（×2.4 = 1.3 单位），保证在 320 宽帧内。
- **设计钩子**：一千张脸，一张一张都是抵押品——他每换一次脸，三娘的账本上就多一笔坏账。
- 二阶段：无（research 建议的“换脸换元素”用游戏内浮字表达即可，不需要换模型）。

### 4.2 催债司·大司命 `dasiming`（催债司 · 第十五章）
- **人设依据**：官僚、贪（私吞三成利息）；“生死簿上写着：此人欠款未清，阳寿无效。我来帮你勾掉”；技能催命符/生死簿·勾销/驳回；行贿信。
- **建议 spec**
```python
SPRITES['boss_dasiming'] = dict(kind='chibi', spec=dict(
    robe='#0a0a10', robe2='#c0303a', trim='#ffd25e', belt='#ffd25e', pants='#0a0a10', shoe='#0a0a10',
    hair='#1a1a1a', hairstyle='none', hat='tall', hatc='#0a0a10', tagc='#c8202a', cape='#6a0a1a',
    weapon='brush', left='book', beard=True, beardc='#1a1a1a', eyes='angry', mouth='flat',
    skin='#e8e0d8', fat=1.3, skirt=0.36, blush=False, atkface=dict(eyes='angry', mouth='open')),
    anims=BOSS_ANIMS, dirs=['SE'], big=True, scale=2.0)
```
| 服饰部件 | 实现 | 配色 |
|---|---|---|
| 玄黑官袍 | `robe`，`fat=1.3`（初版 1.25 → 1.3，“小金库”吃出来的肚子） | `#0a0a10` |
| 朱红领 | `robe2` | `#c0303a` |
| 金边/金腰带 | `trim`/`belt` | `#ffd25e` |
| 暗红披风 | `cape` | `#6a0a1a` |
| 黑高帽 + **朱红官牌** | `hat='tall'` + 🔧E1 `tagc` | `#0a0a10` / `#c8202a` |
| 黑长须 | `beard` | `#1a1a1a` |
- **发型和头饰**：无发高帽。高帽系四人（collector / zhuiming / judge / dasiming）的分级：牌色 白→金→（判官无牌改胖）→朱红，体型逐级变大。
- **标志性道具**：右手 🔧E7 巨型朱笔（“勾销”），左手 `book`（生死簿）。降级：`gsword`（初版）。
- **表情**：默认 `angry`+`flat`（官威）；攻击 `angry`+`open`（念判词）。
- **体型/比例**：scale 2.0，`fat=1.3`；高帽使他成为三 BOSS 中最高的剪影之一，与天道真身持平——“下级比上级还威风”。
- **设计钩子**：朱笔一勾，生死簿上你的阳寿就“无效”了——但同一支笔，也悄悄把三成利息勾进了他自己的小金库。

### 4.3 天道真身·总账房 `tiandao2`（催债司地下 · 终章 · 二阶段）
- **人设依据**：“我不是神。我是三界最大的债主，也是最大的欠债人”；疲惫的乙方财务（research：工程款纠纷）；技能利滚利/审计/强制破产；**HP<50% 二阶段“本金翻倍！”（攻+25%）**；前作分身是一只金色独眼的云（`monsters.tiandao`）。
- **一阶段建议 spec**
```python
SPRITES['boss_tiandao2'] = dict(kind='chibi', spec=dict(
    robe='#ffffff', robe2='#ffd25e', trim='#ffd25e', belt='#ffd25e', pants='#f4f1e6', shoe='#e8b84a',
    hair='#ffffff', hairstyle='crown', ribbon='#ffd25e', hat='crown2', hatc='#ffe080', halo='#fff2a0',
    cape='#ffe8a0', ribbon2='#fff2a0', weapon='abacus', left='book', back='abacus_big', beadc='#ffcc40',
    glasses=True, eye3='#f0a020', eyes='closed', mouth='flat', skin='#fff8f0', skirt=0.36,
    atkface=dict(eyes='round', eye='#b06000', mouth='flat')),
    anims=BOSS_ANIMS, dirs=['SE'], big=True, scale=2.2)
```
| 服饰部件 | 实现 | 配色 |
|---|---|---|
| 纯白法袍 | `robe` | `#ffffff` |
| 金领/边/腰带 | `robe2`/`trim`/`belt` | `#ffd25e` |
| 浅金披风/披帛 | `cape`/`ribbon2` | `#ffe8a0` / `#fff2a0` |
| 金玉冠 + 光环 | `hat='crown2'`/`halo` | `#ffe080` / `#fff2a0` |
| 背后大算盘（“光背”） | 🔧E4 `back='abacus_big'` | 框 `#8a5a2a`（同 `monsters.tiandao` 算盘），珠 `#ffcc40` |
| 额心金瞳（继承分身的独眼） | 🔧E11 `eye3` | `#f0a020` 自发光 |
| 老花镜（疲惫会计） | `glasses=True` | — |
- **发型和头饰**：白发顶髻+金冠（`crown2` 叠在 `crown` 上：两层冠=“总”账房）、头后光环。
- **标志性道具**：右手 `abacus`（日常算账）+ 背后大算盘（权柄），左手 `book`（三界总账）。
- **表情**：一阶段默认 `closed`+`flat`（疲惫、半闭眼）；攻击（E0）`round` 琥珀瞳（抬眼看你一下）。
- **体型/比例**：scale 2.2（最大），**不加 fat**（白衣细长，与胖官吏形成对比：真正的大老板反而清瘦）。背后算盘宽 ≤0.9 局部单位（×2.64≈2.4 单位，帧宽 4.7 单位），顶端不高于光环。
- **二阶段变体「本金翻倍」**（新 sprite id，如 `boss_tiandao2_p2`，同 BOSS_ANIMS/SE/scale 2.2，只换参数）：
```python
spec_p2 = dict(spec_p1, robe2='#c8202a', trim='#ffcc40', cape='#c8202a', ribbon2='#ff6a3a', halo='#ff6a3a',
               beadc='#ff3a2a', glasses=False, eyes='angry', mouth='open', atkface=dict(eyes='angry', mouth='open'))
```
  - 变化：领/披风变**官印朱** `#c8202a`、光环与算珠变红橙 `#ff6a3a`/`#ff3a2a`、**摘掉眼镜**（“认真了”）、眼睛变 `angry` 红光——与台词“本金翻倍！”的红字 `#ff6a3a` 同色。
  - ⚠ 代码限制：当前 `content22.js` 二阶段只改数值（`t._p2=1; atk*=1.25`），**不换 sprite**。要显示二阶段需在该处加 `t.spr='boss_tiandao2_p2'; loadSprite(...)`（一行 JS，我没有改代码），并在 `specs.py` 注册新 sprite。不改 JS 时可退而求其次：二阶段用 `drawSprite` 的 `tint` 参数叠红。
- **设计钩子**：三界最大的债主戴着老花镜在背后背着一座算盘——他放了一万年贷，背上那座算盘里最大的一颗珠子，是剑仙欠他的世界建造尾款。

---

## 5. 坐骑（2 个，`kind='mon'`，`MOUNT_ANIMS={idle:4}`，5 向，160×176 帧）

### 5.0 现有坐骑约定（从 `m_cloud/m_crane/m_lotus/...` 与 `vfx21.js R.entPre` 反推）
- 坐骑与骑手是**两张独立精灵**：引擎先画坐骑 idle，再把玩家精灵（站姿 idle/walk）整体上移 `MOUNTS[id].lift` 像素画在上面。**骑手永远是“站在上面”**，不存在坐姿；坐骑任何部位都会被骑手遮挡（骑手总在上层）。
- `mpose` 对 `m_*`：整体上下浮动 `z = 0.18 + 0.04·sin`；`R.limbs` 里的部件绕 Y 轴 ±18° 扇动（仙鹤翅膀就是这么动的）。
- **甲板高度公式**（用仙鹤/祥云/算盘验证过）：`甲板局部 z ≈ lift / (68 × 0.866 × 1.2 × MONS缩放) − 0.18`。仙鹤：lift 30、缩放 0.8 → 0.31，模型背顶 0.32 ✅。
- 朝向：坐骑必须**头朝 -Y**（与人物一致，`render_sprites` 只旋转 root）。仙鹤头在 -Y ✅。
- 光圈：v2.1/2.2 坐骑底部都有一个自发光 `torus('glow')` 当阴影/光晕。

### 5.1 锦鲤 `carp`（神品，`lift=28`，`MONS` 缩放 0.8）
- **人设依据**：events「锦鲤跃门」——在龙门前犹豫了三百年，“怕跳过去变成龙，就要替父还债了”；坐骑效果“每年 20% 横财”。
- **形体分解**（现 `m_carp` 已有，以下为修正建议）

| 部件 | 实现 | 配色 |
|---|---|---|
| 鱼身 | `sphere` r0.3 scale(0.8,1.6,0.6)（**长轴改到 Y**） | 锦红 `#ff5a3a`（sss0.2） |
| 白腹 | `sphere` r0.24 scale(0.7,1.5,0.45) | `#fff4e8` |
| 锦鲤斑（白底红斑的反向：红底上 2 块白斑） | 2 个 `sphere` r0.1 scale(1,1,0.3) 贴背 | `#fff4e8` |
| 胸鳍 ×2 | `sphere` scale(0.2,1.2,0.6) → **挂到 `R.limbs`** 的 empty 上（才能扇动） | 金 `#ffd25e`（emit0.8） |
| 尾鳍 | `sphere` r0.2 scale(0.15,0.6,1.2)，位置 (0,+0.5,0.3)，挂 `R.limbs` | `#ffd25e` |
| 背鳍 | `sphere` scale(0.15,1.4,0.6)，**降低到 z≈0.36**（会被骑手脚挡住，只露前后） | `#ffd25e` |
| 鱼眼 ×2 | `sphere` r0.045 在 (±0.13,−0.4,0.3) + 白高光 | `#1a1010` / `#ffffff` |
| 鱼须 ×2（龙的预兆） | `tube` r0.012 从嘴角向前下弯 | `#ffd25e` |
| 底部光圈 | `torus('glow')` R0.5 | `#a0e8ff`（水色，emit4） |
- **骑法**：骑手站在鱼背中段。按公式，lift 28 → 甲板 z≈0.31；现模型鱼身顶 ≈0.56、背鳍顶 ≈0.64，**骑手脚会陷进鱼身约 14px**。修正：鱼身中心 z 0.3→0.12、z 向缩放 0.85→0.6（顶≈0.30），或在背上加一个 `cyl` 金色鞍垫 r0.16 h0.03 于 z=0.31 并把 lift 提到 40（改 JS 数据，不建议）。
- ⚠ **现模型朝向错误**：`m_carp` 的头在 **+X**（眼在 x=0.4），渲染时鱼会横着游。修正：所有 loc 的 x/y 互换（头到 -Y），或把全部部件挂到一个 `rotation_euler=(0,0,D(-90))` 的 empty 下。
- ⚠ 现模型 `R.limbs` 为空，`mpose` 的扇动不起作用；按上表把鳍/尾挂进 limbs 即可动起来（零 JS 改动）。
- **设计钩子**：一条三百年都不敢跳龙门的锦鲤——跳过去就成了龙，就得替龙王还高利贷；驮着你到处跑，算是在“灵活就业”。

### 5.2 飞天算盘 `abacus`（仙品，`lift=22`，`MONS` 缩放 0.8）
- **人设依据**：events「飞天算盘」——会飞、自己啪啪算账，帮你发现“账多算了一百”，卖掉的买家是讨债司；坐骑效果“每年灵石 +5%（天道会计同款）”。
- **形体分解**（现 `m_abacus` 基本正确，微调）

| 部件 | 实现 | 配色 |
|---|---|---|
| 外框长边 ×2 | `box` (1.2,0.06,0.06) at y=±0.32, z=0.2 | 红木 `#7a4a2a` |
| 外框短边 ×2 | `box` (0.06,0.7,0.06) at x=±0.58 | `#7a4a2a` |
| 梁 | `box` (1.2,0.04,0.05) at y=0.12 | 金 `#ffd25e`（emit0.6） |
| 档杆 ×7 | `cyl` r0.012 沿 Y | `#ffd25e` |
| 算珠 7×4（上 1 下 3） | `sphere` r0.05 scale(1,0.6,1) | 朱红 `#c0302a` |
| 四角包铜（新增，提升剪影） | 4 个 `box` 0.09 立方 | `#ffcc40` metal0.8 |
| 小翅膀 ×2（新增，“飞天”可读性） | 两侧短边外各一片 `sphere` r0.16 scale(1.4,0.8,0.1)，**挂 `R.limbs`** 扇动 | 白 `#fbfbf8`（同仙鹤羽色） |
| 底部光圈 | `torus('glow')` R0.6 | `#ffe080` |
- **骑手位置**：算盘平放，骑手站在梁与下档之间（框顶 z≈0.23，与 lift 22 的甲板 0.21 吻合 ✅）。长轴在 X（与前进方向垂直，像“踩着滑板侧冲”），保持现状即可——横向 1.2 单位的宽度让它在骑手两侧都露出来，识别度好。
- **算珠动画（可选）**：idle 4 帧中让最右一档的下珠在 y 方向移动（需在 `mpose` 里按 `R.kind=='m_abacus'` 加 2 行）——“自己啪啪算账”。不做也可。
- **设计钩子**：天道会计同款算盘，骑着它每年自动给你记 5% 的利息——只是这次，利息是算给你的。

---

## 6. 实施清单（给建模/渲染）

1. 仅替换 `specs.py` 参数、不加任何扩展即可先出一版：所有带 🔧 的参数会被 `chibi()` 忽略（`spec.get` 读不到不会报错，**但 `weapon/left` 的新值 `yuanbao/mask/brush/rabbit/hammer` 在 `weapon()` 里没有分支，只会生成空 empty；`hat='helm'` 同理不会生成任何帽子**——不做扩展时请用第 2 节的降级值）。
2. 推荐扩展优先级：E1（白无常必要）→ E2（天兵）→ E6/E7/E4（三 BOSS 识别度）→ E0（攻击表情）→ 其余。
3. 坐骑：先修 `m_carp` 朝向和高度（第 5.1 节），再加 limbs。
4. 建议把 `sanniang`、`guanghan` 加进 `FIGHTERS`。
5. 天道真身二阶段需要一行 JS 才能显示（第 4.3 节），本稿未改代码。
6. 渲染量：12 NPC 中 6 个 FIGHTER×80 帧 + 6 个 NPC×50 帧（若加 2 个同行则 8×80+4×50）；3 BOSS×10 帧（+二阶段 10 帧）；2 坐骑×20 帧；外加 17–18 张头像。

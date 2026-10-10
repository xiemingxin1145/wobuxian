# 《我不仙》v2.3 设计规格：回应主人试玩反馈（NPC 交互 · 自动任务/寻路 · 挂机 · 开发者模式 · 内容扩充）

> 写给：负责实现的开发 bot（Grok Bot）。本文按**现有代码**写，每一项都给出要改的文件/函数、412×915 竖屏上的 UI 坐标、状态、数据结构和验收标准，可以直接照着实现。
> 编写时间：2026-10-10（UTC+8）。基于 git `a0aec83`（v2.2.0 已发布），**文中所有 `文件:行号` 都指 `a0aec83` 的已提交版本**。**本文只是规格，没有修改任何游戏代码或素材。**
> ⚠ 写作过程中（07:29–07:31）工作区里出现了开发 bot 未提交的实现：`www/js/ux23.js`、`test/human23.py`，并改了 `engine.js`/`index.html`/`style.css`。它已经覆盖了本文 P0 的大部分骨架；**第 I 节逐条列出与本规格的差距**，请以 I 节为“补丁清单”，不要推倒重来。
> 相关文档：`docs/research_v22.md`（世界观/演出规格；注意它在 `docs/` 下，不在仓库根目录）、`/workspace/olaf-review/art_specs_v22.md`（奥拉夫的角色设定稿）。
> 约定：坐标单位是 **CSS px**，基准视口 412×915（`device_scale_factor=2`）；`R.dpr` = canvas 像素 / CSS px；世界坐标 → CSS px 的缩放是 `R.Z / R.dpr`，在 412 宽的屏幕上 ≈ **0.479**。所有贴边元素都要加 `env(safe-area-inset-*)`。
> 标记：「🐞」= bug 根因；「🔧」= 改现有代码；「🆕」= 新写；「✅」= 验收标准。

---

## 0. 结论速览（先读这一节）

**主人说“点 NPC 没反应，不知道点哪儿，不知道怎么开始对话”。** 我在 412×915 触屏模拟（Playwright + CDP `Input.dispatchTouchEvent`，跟 `test/controls.py` 一样的方法）里复现并定位到了下面几个根因。**content22.js 的“资源保护”不是原因**：当前构建的 45 个 NPC 精灵、44 个头像、11 张地图全都在，没有 NPC 被删掉（但这个保护会“静默删除”，有隐患，见 A.6）。

| # | 根因 | 位置 | 复现结果 |
|---|---|---|---|
| 🐞1 | **点击判定框只覆盖 NPC 身体，不包括头顶的名字和“！/？”标记**。玩家最自然去点的就是名字和感叹号，结果点空：要么变成“走到地面某格”什么也不发生，要么命中旁边道具的交互点（打坐/古井），触发了别的东西。身体判定框本身也只有 ≈42×66 CSS px。 | `engine.js:313-314`（`pickAt` 实体判定 `wy > y - b.h - 10`），名字/标记画在 `engine.js:232-235`（名字 `y-b.h-6`，标记再往上 30 世界 px）；道具交互点判定 `engine.js:317` 是一个 120×(h+60) 世界 px 的高柱子，会盖住旁边 NPC 的头顶 | 桃花村 5 个 NPC，点身体 12/12 成功；**点名字/标记 0/5 命中 NPC**：娘→“打坐”，翠花→“古井”，王大爷/说书先生/路人甲→走到地面格 |
| 🐞2 | **主线追踪栏提示的目标在地图上不存在**。开局追踪栏写“序章·讨债的找上门了，先把它打跑！”，实际推进方式是按“过年”触发年度事件 `c_debtor`；然后写“第一章·去找落魄剑仙聊聊”，但剑仙要等 **10 岁**（再过 3 年）`c_mentor` 事件之后才会出现在地图上。玩家前 4 年照着提示满地图找人，必然找不到。 | `story21.js:49-50`（MAIN debt/mentor 文案）、`events.js:16-17`（`c_debtor` age≥6、`c_mentor` age≥10）、`game.js:287`（事件推进 main）、`game.js:430`（`mentor` 没有 `flags.main1` 就不生成） | 新开局：6 岁追踪栏=序章；7 岁=第一章“去找他聊聊”，剑仙不在；**10 岁**剑仙才出现 |
| 🐞3 | **左下 40%×38% 的屏幕永远是摇杆区，点按不会触发点击**。在 412×915 上是 x<165、y>567 的整块区域（约占屏幕 16%），站在角色左下方 2 格以外的 NPC 根本点不到。右侧菜单、HUD、追踪栏、过年/求仙缘按钮又盖住了约 17% 的画面。 | `engine.js:296`（`x < R.W*0.4 && y > R.H*0.62` 一律进入摇杆）；DOM 覆盖实测 289/1708 个采样点 | 实测 |
| 🐞4 | **没有任何“可以对话”的提示**。只有有任务的 NPC 才有“！/？”，大多数 NPC 头顶只有一行和道具标签几乎一样的白字；没有靠近后出现的“对话”按钮；玩法说明只有一句“点击 NPC 对话”。 | `game.js:446-452`（`npcMark` 无任务返回 null）、`ui.js:178`（help） | 截图：开局画面中 NPC 约 40px 高，名字和“打坐/古井/洞府”标签混在一起 |
| 🐞5 | **点了 NPC 之后的几种静默失败**：①NPC 在你走过去的途中闲逛（`npcAI` ±2 格），到达后距离 >2.4 就什么也不做；②目标格恰好是你脚下这格时 `findPath` 返回空路径，`onArrive` 回调永远不触发；③无路可走（`moveTo` 返回 false）没有任何提示；④半路撞上闲逛的怪物直接进战斗，对话意图被丢掉。 | `game.js:466-478`（`onTap`）、`engine.js:120-133`（`moveTo/stepEnt`：只有消耗完非空路径才调用 cb）、`game.js:503-507`（`npcAI`）、`game.js:512`（怪物 0.95 格内自动开战） | ②③为代码阅读结论；①④实测中偶发 |
| 🐞6 | **为什么机器人测试一直是绿的**：机器人从不“点”NPC——`BOT.tick` 直接把主角坐标改到 NPC 身边再调用 `Game.interactEnt`（瞬移）；触控测试 `controls.py` 在测试前**把所有 NPC 都删掉了**。所以“点 NPC”这条路径从来没被自动化测过。 | `main.js:101-102`、`main.js:106`、`test/controls.py:41`（`R.ents=R.ents.filter(e=>e===R.player)`） | — |

**修复优先级（详见 F 节）**：P0 = ①交互修复（判定框/摇杆/靠近交互按钮/静默失败/前两章改为可点）②任务追踪栏 + 一键寻路（含跨地图）③开发者模式 + 作弊面板 ④真实触控的自动试玩脚本进 CI；P1 = 自动任务循环、挂机 + 离线收益、立绘第一批 + 新对话框、主线分支 v1；P2 = 秘境副本、洞府地图、大地图与新地图、灵宠派遣等。

复现脚本放在仓库外：`/workspace/npcdiag/repro{,2,3,4}.py`（可以直接搬进 `test/` 改造成 G 节的 `test/playtest23.py`）。

---

## A. NPC / 任务交互：根因修复 + 视觉提示

### A.1 🔧 扩大并修正点击判定（`engine.js` → `pickAt`）

目标：名字、头顶标记、身体、脚下阴影都能点中；最小可点区域 ≥ 56×88 CSS px（Android 无障碍建议触控目标 ≥48dp[R1]，我们是游戏里的移动目标，再放大一档）；重叠时 NPC/BOSS 优先于道具交互点。

```js
// engine.js —— 替换 pickAt(sx, sy)
const CSS2W = css => css * R.dpr / R.Z;                 // CSS px → 世界 px
function entHitRect(e) {                                // 世界坐标矩形，供 pickAt 与调试叠层共用
  const [x, y] = t2p(e.i, e.j); const b = spriteBox(e.spr, e.s);
  const head = e.label ? 34 : 0, mark = e.mark ? 44 : 0; // 名字行 + 标记行（与 render 中 232-235 行对应）
  const hw = Math.max(b.w / 2 + 10, CSS2W(28));          // 半宽 ≥ 28 CSS px
  const top = y - b.h - 6 - head - mark - 8;
  const bot = y + Math.max(20, CSS2W(10));
  return { x0: x - hw, x1: x + hw, y0: Math.min(top, bot - CSS2W(88)), y1: bot, cx: x, cy: y - b.h / 2 };
}
function pickAt(sx, sy) {
  const [wx, wy] = s2w(sx, sy);
  const PRI = { boss: 0, npc: 1, comp: 3, mon: 2 };      // 越小越优先
  let best = null, bs = 1e9;
  for (const e of R.ents) {
    if (e.hidden || e === R.player || e.kind === 'pet') continue;
    const r = entHitRect(e);
    if (wx >= r.x0 && wx <= r.x1 && wy >= r.y0 && wy <= r.y1) {
      const s = PRI[e.kind] * 1e4 + Math.hypot(wx - r.cx, (wy - r.cy) * 0.6);
      if (s < bs) { bs = s; best = { ent: e }; }
    }
  }
  if (best) return best;
  // 胖手指兜底：36 CSS px 内最近的 NPC/BOSS
  let fb = null, fd = CSS2W(36);
  for (const e of R.ents) { if (e.hidden || (e.kind !== 'npc' && e.kind !== 'boss')) continue; const r = entHitRect(e); const d = Math.hypot(wx - r.cx, wy - r.cy) - (r.x1 - r.x0) / 2; if (d < fd) { fd = d; fb = { ent: e }; } }
  if (fb) return fb;
  // 道具交互点：只认“标签药丸”本身 + 道具脚下半径 50 的圆，不再是一整根高柱子
  for (const m of R.marks) {
    if (m.hidden) continue; const [x, y] = t2p(m.i + 0.5, m.j + 0.5); const by = y - (m.h || 110);
    const inPill = Math.abs(wx - x) < 56 && wy > by - 30 && wy < by + 18;
    const inFoot = Math.hypot(wx - x, (wy - y) * 2) < 50;
    if (inPill || inFoot) return { mark: m };
  }
  const [ti, tj] = p2t(wx, wy); return { tile: [Math.floor(ti), Math.floor(tj)] };
}
```
- 🔧 名字/标记的绘制位置（`engine.js:232-235`）要与 `entHitRect` 中的 `head/mark` 常量一致；如果以后改字号，两处一起改。
- 🔧 道具标签药丸（`engine.js:238-242`）位置不变。

✅ 验收：G 节 T1——三张地图（village/sect/market）上每个 NPC 的“脚/身体/头/名字/标记”5 个点，**100% 命中该 NPC**，0 次命中道具或地面。

### A.2 🔧 摇杆区不再吞点击（`engine.js` → `setupInput`）

改成“**先按下、移动超过阈值才算摇杆**”：
- `pointerdown` 落在旧摇杆区（保留 `x < R.W*0.4 && y > R.H*0.62`）时，只记录 `R.joyCand = {id, ox, oy, t}`，**不**立即激活。
- `pointermove`：同一指针位移 ≥ **8 CSS px** → 激活摇杆（`R.joy = {active:true, ox, oy, ...}`，`setPointerCapture`），之后与现在完全相同。
- `pointerup`：如果候选从未激活，且位移 < 8 CSS px、按住时长 < 350ms → 当作普通点按，调用 `R.onTap(x, y)`。
- 摇杆静止时的显示位置（`drawOverlay`：中心 `(110, H-150)` CSS px，半径 56）不变。

✅ 验收：`test/controls.py` 全部原有用例仍通过（它的第一步位移就是 10px，超过 8px 阈值）；新增 T2：NPC 站在 (120, 700) CSS px 附近时点按 → 打开对话。

### A.3 🆕 靠近交互按钮（参考原神手机版：靠近 NPC/宝箱时右侧出现“对话/调查/拾取”按钮[R2]）

- DOM：`<button id="actbtn">`，放在 `index.html` 里 `#brkbtn` 后面。
- 位置：`position:fixed; right:125px; bottom:calc(149px + env(safe-area-inset-bottom)); width:76px; height:76px; border-radius:50%`，即 412×915 上 **x 211–287, y 690–766**。它在求仙缘按钮（x 218–282, y 841–905）和突破按钮（约 y 779–825）上方，在右侧菜单列（x 297–406, y 608–831）左边，不重叠。`z-index:6`。
- 外观：玉色圆按钮，中间是目标头像 `porCss(N.por, 44)`，下方 2 行小字：第 1 行动作（`对话`/`挑战`/`交付`/道具标签如`采药`），第 2 行名字（10px，超长省略）。目标是主线目标时外圈金色呼吸光（复用 `@keyframes gpulse`）。
- 逻辑（新文件 `www/js/play23.js`，挂在 `R.onTick` 链上，每 0.15s 计算一次即可）：
  ```js
  // 选目标：距离主角 ≤ 1.8 格的 npc/boss 实体，以及 ≤ 1.3 格的未隐藏交互点；npc/boss 优先，其次最近
  Play.nearTarget() -> { ent } | { mark } | null
  ```
  有目标就显示并更新内容，没有就隐藏；`UI.modal || Game._busy || R.mode!=='map' || G.afk.on` 时隐藏。点按 → `Game.interactEnt(ent)` / `Game.interactMark(mark)`。
- 地面提示：当前靠近目标脚下画一个金色椭圆（`R.drawGround` 里画，与 `R.tapMark` 同样的椭圆，常亮、0.8Hz 呼吸）。

✅ 验收：T3——主角走到 NPC 1.5 格内，`#actbtn` 在 300ms 内可见、显示该 NPC 名；点按后对话框标题等于该 NPC 名。

### A.4 🆕 头顶标记与名牌（让“能对话”一眼可见）

参考问道/天书奇谈类回合制网游的约定：可接任务 = 头顶**黄色叹号**，可交任务 = **问号**[R3][R4]。

| 状态 | 标记 | 颜色/动效 | 来源 |
|---|---|---|---|
| 主线目标（`Talk.mainTalk(id,true)` 非空，或当前章节 BOSS） | **★** + 脚下一道细光柱（宽 6、高 120 世界 px，加色混合） | 金 `#ffd23a`，上下浮动 5px + 光柱 1Hz 明暗 | 🔧 `npcMark` 返回 `'★'` |
| 可接支线 | **！** | 黄 `#ffd23a` | 现有 |
| 可交付 | **？** | 绿 `#7affb0` | 现有 |
| 进行中（已接未完成，giver 是他） | **…** 灰色小气泡 | `#c8c8c8` | 🆕 |
| 普通 NPC（只能闲聊/交易） | 💬 小对话气泡（16px） | 白 70% 透明 | 🆕 |

- 🔧 `game.js:446` `npcMark(id)`：在最前面加 `if (Talk.mainTalk(id, true)) return '★';`（把原来 mainTalk 的 `'!'` 改为 `'★'`），在最后 `return null` 前加“进行中”与“💬”判断。`engine.js:235` 的颜色表加上 `★`、`…`、`💬`。BOSS 实体的 `mark:'!'`（`game.js:442`、`content22.js` tiandao2）改成 `'★'`。
- 🔧 NPC 名牌：把 NPC 名字从“裸字”改成**蓝灰底圆角名牌**（`rgba(20,40,70,0.55)`，字白色 20px），与道具的棕色药丸标签区分开；道具标签前加图标字（采药🌿/宝箱📦/打坐🧘…可用现有 icons 图集小图）。
- 🆕 屏幕外指示箭头：主线目标在当前地图但不在屏幕内时，在屏幕边缘画一个 44×44 的金色箭头 + 距离“12 格”，箭头位置夹在安全矩形 x∈[28,384]、y∈[300,560]（避开 HUD、追踪栏、菜单），点箭头 = 自动寻路到目标（B 节）。用 `R.drawScreen` 画，点击在 `Game.onTap` 最前面判断。
- 🆕 首次引导（新人生第一次进入地图，`Game.meta.tut23` 未记录时）：3 步“聚光灯”引导，其余区域压暗 60%，点任意处下一步：①高亮追踪栏“前往”按钮：“点这里，自动走到要找的人”；②高亮 ★ 目标：“头顶有 ★ 的就是主线人物，点他就能对话”；③高亮 `#actbtn`：“走近了也可以点这个按钮”。完成写 `Game.meta.tut23 = 1`。
- 🔧 `ui.js:178` 玩法说明第一条改为：“点击地面移动；**点人物（身体、名字或头顶标记都可以）**对话；走近后右下方会出现对话按钮；右上角任务栏点‘前往’自动寻路。”

### A.5 🔧 修掉静默失败（`game.js` → `onTap` / `engine.js` → `moveTo`）

1. `engine.js` `moveTo`：`findPath` 返回空数组（已在目标格）时，立刻 `cb && cb(true)` 并返回 true。
2. `game.js` `onTap` 点中 NPC：先 `e.talking = 6`（冻结它 6 秒，`npcAI` 已支持 `talking`），再走过去；到达判定放宽到 `<= 2.6` 格。
3. `moveTo` 返回 false → `UI.toast('那边过不去')` 并在目标处画一个红色 ✕（0.6s）。
4. 走向 NPC/交互点时设 `P.safeWalk = true`；`monAI`（`game.js:512`）中 `if (P.safeWalk) skip 自动开战`（被主动点的怪 `P.chase` 不受影响）。到达/取消后清除。
5. 点中 NPC 时立即反馈：NPC 脚下金色圈 + 浮字“前往对话”（`floatText`，0.8s）。

✅ 验收：T4——NPC 不冻结、正常闲逛，主角从 5–6 格外点 NPC 身体 20 次，20/20 打开对话；T5——主角站在“目标格”而 NPC 距离 1.7 格时点 NPC，能打开对话。

### A.6 🔧 前两章改成“能点出来”的剧情（解决 🐞2）

- **序章**：新人生进入桃花村时，在家门口 `[8,10]`（`nearestWalk`）生成一个剧情实体：`kind:'boss', id:'debt_slime', spr:'mon_collector', label:'讨债史莱姆', mark:'★'`（`content22.js` 里 tiandao2 的生成写法可以照抄，放到 `Game.refreshNpcs` 的包装里，条件 `MAIN[G.main].id==='debt' && !G.flags.main0`）。点它 → 弹出 `c_debtor` 的事件文案 → `Game.fight('slime', {tier:0.3, solo:true, noflee:true})` → 赢了：`G.flags.main0 = 1; G.main = MI('mentor')`；输了也推进（序章不卡人），文案改为“娘拿扫帚把它打跑了”。`Talk.boss` 需要对 `debt_slime` 特判（它不在 `MONS` 的 boss 表里）。
- **第一章**：去掉 10 岁限制。`game.js:430` 改为 `if (id === 'mentor' && !G.flags.main0) continue;`（打跑讨债史莱姆后剑仙立刻出现在 `[9,13]`）。`Talk.mainTalk` 加一个前置分支：`G.main===MI('mentor') && id==='mentor' && !G.flags.main1` → `['★ 替他付酒钱', ...]`，执行 `c_mentor` 的效果（`stone-30; flag:main1; aff:mentor:20`），然后直接接现有的“请剑仙测灵根”流程。`events.js:17` 的 `c_mentor` 条件已有 `!flag:main1`，不会重复触发。
- 追踪栏文案（B.2）对“只能靠过年推进”的步骤显示“**过年推进**”而不是“去找某人”。

✅ 验收：T6——新人生，不按“过年”，只用追踪栏“前往”+ 点按，在 60 秒内完成序章→第一章→测灵根（`G.flags.awakened===1`，`MAIN[G.main].id==='sect'`）。

### A.7 🔧 资源保护不要再“静默删除”

`content22.js:249-256`：删除缺素材的 NPC 前 `console.warn('[asset-guard] drop NPC', k, spr)`，并把被删列表写到 `window.ASSET_DROPPED`；开发者模式“调试”页显示这个列表；`test/validate22.js` 增加一条：`ASSET_DROPPED.length === 0` 否则失败（HD 包覆盖 `www/assets` 后也要跑一次）。

---

## B. 任务追踪栏 + 一键自动寻路 + 自动任务循环

### B.0 参考

- 梦幻西游：点击“任务提示/任务追踪”里的目标即自动寻路；2025-05 起支持**跨场景自动寻路**，途经传送点等 3 秒自动切图[R5][R6]；小地图也可点 NPC 列表自动寻路[R7]。
- 问道手游：任务栏点“自动寻路/前往”，任务追踪里带箭头的提示可直接跨图；“修行”类循环任务点任务栏后自动寻路到 NPC **并自动进入战斗**，一轮结束弹窗问是否回去重新领取[R4][R8][R9]。
- 梦幻西游七绝山：点任务追踪栏图标“委托自动完成单人任务”[R5]。

→ 我们做：追踪栏每行一个“前往”按钮（一键寻路，跨图自动御剑），再加一个“自动”开关（自动任务循环，见 B.4）。

### B.1 🆕 布局（替换现有 `#qt`）

`#qt` 改成可交互的追踪面板（保留 id，`ui.js:34-35` 的 `UI.hud` 渲染改写，`ui.js:15` 的 onclick 改为按行处理）：

| 元素 | 位置（412×915） | 尺寸 | 说明 |
|---|---|---|---|
| 面板 | `right:8px; top:calc(92px + safe-top)` → x 220–404 | 宽 184 | 半透明棕底，左侧金边（现样式） |
| 标题行 | y 92–136 | 184×44 | 左：“任务 ▾”（点 = 折叠/展开，折叠后只剩这一行）；右：**[自动]** 开关 64×36（关=灰，开=金色流光） |
| 任务行 ×≤3 | y 136–280（每行 48） | 184×48 | 第 1 行固定主线；第 2–3 行 = 已接支线（可交付的排前）；没有已接支线时显示“附近有 N 个委托（！）” |
| 行内文字 | 左 8px，宽 128 | — | 第 1 行 13px 粗体任务名（主线前缀“主·”，支线“支·”），第 2 行 11px“下一步”（见 B.2），单行省略 |
| 行内按钮 | 行右侧 | 44×44 | “前往▶”（可寻路）/“过年”（需要过年）/“修炼”（境界不够）/“突破”/灰色“—”（无法自动） |
| 寻路中提示条 | 屏幕中上 x 106–306, y 172–200 | 200×28 | “自动寻路 → 落魄剑仙 · 点地面取消”，`pointer-events:none` |

整行点击（非按钮区域）= 打开现有任务面板 `UI.panel('quests')`；任务面板里每条任务也加同样的“前往”按钮。

### B.2 🆕 目标解析 `Nav.resolve(task)`（新文件 `www/js/play23.js`）

```js
// task: { type:'main' } | { type:'quest', id:'q_xxx' }
// 返回：
// { kind:'npc'|'boss'|'mon'|'mark'|'map'|'year'|'realm'|'break'|'none',
//   map, i, j, id, label, hint, btn:'前往'|'过年'|'修炼'|'突破'|null }
```
解析规则（按顺序）：

1. **主线**（`M = MAIN[G.main]`）：
   - `M.id==='done'` → `{kind:'none', hint:'主线已完结'}`。
   - 境界不够（`G.realm < M.realm`）→ 能突破则 `{kind:'break', btn:'突破'}`；否则 `{kind:'realm', btn:'修炼', hint:'需要'+REALMS[M.realm].n+'期（修为 63%）'}`，“修炼”= 寻路到最近的 `mat`/`jade` 交互点并打开打坐/闭关。
   - 有章节 BOSS（`M.boss` 且未击败）→ `{kind:'boss', map:M.map, i,j: BOSS_POS}`。`BOSS_POS` 从 `game.js:439` 提出来做成共享常量：`{graveyard:[10,7], island:[11,6], rift:[11,6], heaven:[11,8], default:[10,8]}`，再加 `cuizhai/tiandao2:[10,7]`（`content22.js`）和 A.6 的 `debt_slime:[8,10]`。
   - 否则遍历 `NPCS`：`Talk.mainTalk(id, true)` 非空的那个 NPC → `{kind:'npc', map: N.roam ? N.roam(G) : N.map, i:N.at[0], j:N.at[1]+1}`（注意 `content22.js` / `story21b.js` 对 `mainTalk` 的包装都会被这个调用覆盖到）。
   - 都找不到（只能靠年度事件推进的步骤）→ `{kind:'year', btn:'过年', hint:'过年推进'}`。
   - 目标地图 `!Game.canEnter(map)` → `hint:'需要'+REALMS[MAPINFO[map].need].n+'期才能前往'`，按钮变“修炼”。
2. **支线**（`Q = QUESTS[id]`）：
   - `Game.questDone(id)` → giver NPC（`kind:'npc'`，hint “交付给 X”）。
   - `need.k`（击杀）→ 当前地图有该怪就 `{kind:'mon'}`（最近一只活着的怪的实体），否则选 `MAP_ORDER` 中 `MAPINFO[m].mons` 含该怪、`canEnter` 为真、`tier` 最低的地图 → `{kind:'map'}`，到达后转为 `mon`。
   - `need.i`（物品）→ 若某个 `SHOPS[npc].items` 有它 → 去那个商人；`herb/lz` → 最近的 `herb` 交互点；`fish` → `boat`；否则 `{kind:'none', hint:'打怪/事件掉落'}`。
   - `need.f`：`visit_X` → `{kind:'map', map:X}`；`boss_X` → 对应 BOSS。
3. **未接委托**（追踪栏没有已接支线时）：当前地图头顶“！”的 NPC 中最近的一个。

### B.3 🆕 一键寻路 `Nav.go(target)` 与状态

```js
R.player.nav = { kind, id, map, i, j, label, t0, phase:'travel'|'walk'|'arrive' } | null
G.track = { pin:'main', auto:false, askTravel:true }   // 存档字段；hasSave 后 Object.assign 默认值
```
流程：
1. `target.map !== R.mapId`：
   - `G.ap <= 0` → 卡片“今年行动力用完了，御剑需要 1 点行动力”，按钮 [过年] [取消]。
   - `G.track.askTravel` 为真 → 卡片“御剑前往{地图}（消耗 1 点行动力）？”，按钮 [前往] [前往且不再询问] [取消]。
   - `await Game.travel(map)`（现有，扣 AP）；`enterMap` 完成后继续第 2 步。
2. 同图：目标格 = `nearestWalk(i, j)`；`moveTo(P, ti, tj, onArrive)`；`P.safeWalk = true`；地面画**金色虚线面包屑**（`P.path` 每格一个 4px 圆点，按距离淡出，`R.drawGround`）+ 目标金圈。
3. 到达：`npc/boss` → 找到同 id 实体，`Game.interactEnt(e)`；`mark` → `Game.interactMark(m)`；`mon` → `P.chase = e; moveTo(e)`（现有追击逻辑开战）；`map` → 重新 `resolve`。
4. 取消：点地面、拖动摇杆、打开任何面板、进入战斗 → `P.nav = null; P.safeWalk = false`，提示条消失。
5. 寻路途中 NPC 被冻结：对目标 NPC 设 `e.talking = 30`，到达或取消后清零。

✅ 验收：T7——用开发者模式把主线设到 `market`（第三章·坊市查账）且境界练气，人在桃花村；点追踪栏主线“前往”→ 出现御剑确认 → 点“前往”→ `R.mapId==='market'` → 主角走到钱多多身边 → 对话框标题含“钱多多”，全程只用触摸，≤ 40 秒。T8——寻路中点地面，`R.player.nav === null`。

### B.4 🆕 自动任务循环（追踪栏 [自动] 开关）

状态机 `Auto23`（`play23.js`），每 300ms `tick` 一次，只通过**正常的玩家操作**推进（走路、对话、战斗托管），**绝不瞬移**（区别于 `BOT`）：

```
IDLE ─开关打开─▶ PICK ─▶ GO（Nav.go）─▶ TALK / FIGHT / ACT ─▶ PICK …
                  │                            │
                  └─▶ PAUSE（需要玩家决定）◀──┘
```
- **PICK** 优先级：①可交付的支线 ②主线（`resolve` 结果可执行）③已接的击杀/采集支线 ④（设置“自动接委托”开启时）最近的“！”委托 ⑤主线 `kind:'year'` 或全部做不了 → 若挂机设置允许自动过年则 `Game.yearEnd()`，否则 PAUSE“没有可自动的任务了”。
- **TALK**：对话框打开后，自动选**安全选项**：匹配 `/^(★|✔|！|接受|继续|好|收下|交付|……|应战|带路|明白|谢)/` 且不匹配 `/(结局|道侣|拜师|离开|算了|送礼|交易|出售|驱逐)/` 的第一个。没有安全选项（例如三选一结局、主线大选择、拜哪个宗门）→ **PAUSE**，toast“需要你做选择”，追踪栏 [自动] 变成闪烁的“等你选”。
- **自动点“继续”**：hook `UI.say`/`UI.card`：自动模式下，只有一个选项或唯一安全选项时，按钮上显示 1.2 秒的环形倒计时后自动点击（设置里可调 0.6/1.2/2.5s），玩家随时可以自己点。
- **FIGHT**：进战斗时把 `B.auto = true`（点现有“自动”按钮的逻辑），`B.speed` 用设置值（默认 2）。
- **停止条件**：HP < 30% 且没有回春丹 → 先吃药（现有 `UI.useItem('hcd')`），没药就 PAUSE“气血不足”；输掉战斗 → PAUSE；`Game.lifeMax() - G.age <= 3` → PAUSE“寿元将尽，自己做决定吧”；玩家碰了摇杆/地面 → 退出自动。
- 自动模式**不会**自动抽卡、自动突破大境界（天劫）、自动选结局、自动花超过当前灵石 20% 的钱。

✅ 验收：T9——开发者模式给“练气 + 第三章”，打开 [自动]，不碰屏幕 3 分钟：主线至少推进 1 章（`G.main` 增大），0 个 JS 错误，期间 `R.player` 坐标连续变化（没有瞬移：两次采样之间位移 ≤ `speed × dt × 1.5`）。

---

## C. 挂机（AFK）模式 + 离线收益

### C.0 参考

- 《剑与远征》：默认挂机收益最多累积 **12 小时**，超过不再累积，需上线领取后重新累积；付费等级可延长[R10][R11]。
- 《一念逍遥》：主打“真实挂机”，挂机收益来自击杀野怪（修为、灵石、材料），**聚灵阵等级**提升离线修为收益；进入挂机后角色固定在一个方框区域活动[R12][R13][R14]。
- 《寻道大千》砍树：资源产出前几批最高、之后明显衰减（边际递减）[R15]。

→ 我们做：**在线挂机**（屏幕开着自动刷）+ **离线收益**（12 小时上限、分段递减、聚灵阵加时长），单机无付费，所以上限只能靠游戏内养成（洞府）提升。

### C.1 🆕 在线挂机（`play23.js` → `AFK`）

- 入口按钮 `#afkbtn`：`left:8px; top:calc(118px + safe-top)`，92×44（x 8–100, y 118–162），在行动力条下面。文字“挂机”；开启后金色“挂机中”+ 转圈。
- 点开 → 设置卡（`UI.card` 风格的小面板）：
  - 挂机内容（多选，默认全开）：打怪（当前地图）、采药/开宝箱、行动力用完自动过年、自动突破**小境界**；
  - 默认关：自动渡劫突破大境界、年度事件自动选第一个选项（关 = 事件弹出时暂停挂机等玩家）；
  - [开始挂机] [取消]。
- 运行时：
  - 行为循环复用 B.4 的走路/战斗代码：找当前地图最近的怪 → 走过去开战（`B.auto=true`、`B.speed=3`）→ 打完 → 附近有未采的 `herb/chest` 就去采 → 地图怪清空且 AP=0 → `Game.yearEnd()`（若开启）→ 新一年怪物刷新继续。
  - 活动范围：以开启挂机时的位置为中心 8×8 格的方框（参考一念逍遥“固定方框区域”[R13]），超出则回到中心，防止乱跑到地图边缘卡住。
  - 屏幕：全屏 `.afk23` 遮罩（`rgba(0,0,0,0.25)`，`pointer-events:auto`），中上方统计卡 300×120（x 56–356, y 230–350）：“挂机 12:34 · 第 37 年 · 修为 +1.2万 · 灵石 +3,450 · 击败 86 · 采药 12”；底部“停止挂机”按钮 180×52（x 116–296, y 620–672）；点遮罩其它地方 toast“挂机中，点‘停止挂机’操作”。
  - 省电：开始挂机 60 秒后 `R.lowPower = true`：`engine.js` 主循环每 4 帧渲染 1 次（逻辑照常），粒子生成率 ×0.25；点“息屏省电”切到纯黑屏，只留统计文字（`MainActivity` 已有 `FLAG_KEEP_SCREEN_ON`，不用改原生）。
  - 停止条件（自动停并弹总结卡）：HP<25% 且无药、战斗失败、寿元剩 ≤3 年、出现需要选择的主线/结局卡、要渡劫但未开启自动渡劫、背包装备 > 60 件（先自动卖掉 ≤宝品且未装备的，卖不掉再停）。
- 存档字段：`G.afk = { on:false, cfg:{fight:1, gather:1, autoYear:1, brkMinor:1, brkMajor:0, autoEvent:0}, box:[i0,j0,i1,j1], st:{t0, exp, stone, kills, years, herbs} }`。读档时 `on` 一律置 false。

### C.2 🆕 离线收益

- 记录：`window.onAppPause`、`visibilitychange(hidden)`、`Game.save` 时写 `G.offAt = Date.now()`。
- 结算：`boot()` 读档后、`window.onAppResume`、`visibilitychange(visible)` 时调用 `Offline.check()`：
  ```js
  const dt = Date.now() - G.offAt;                 // ms
  if (!(dt > 5 * 60e3)) return;                     // 少于 5 分钟不结算；dt<0（改了系统时间）也不结算
  const capH = 12 + Math.min(8, G.cave ? G.cave.zl : 0);   // 基础 12h，聚灵阵每级 +1h，最多 20h
  const h = Math.min(dt / 3600e3, capH);
  // 分段递减：0–4h ×1.0，4–8h ×0.7，8h 以上 ×0.4
  const eff = Math.min(h, 4) + Math.max(0, Math.min(h, 8) - 4) * 0.7 + Math.max(0, h - 8) * 0.4;
  const exp   = Game.yearExp() * 0.25 * eff * (1 + 0.1 * (G.cave?.zl || 0));
  const stone = Math.round(40 * POW(MAPINFO[G.map].tier) * eff * (1 + 0.1 * (G.cave?.field || 0)));
  const herbs = Math.floor(eff / 2);               // 每 2 有效小时 1 株灵草
  ```
- **离线不长岁数**（挂机 = 打坐，不推进年份），所以离线不会把角色挂死；修为**最多加到当前境界瓶颈**（`min(need(), exp + gain)`），回来时如果到瓶颈就提示“瓶颈已至，可以突破！”——把最爽的突破留给玩家自己点。
- 离线**不给仙缘符**（不破坏 v2.2 定下的抽卡经济，见 `research_v22.md` 抽卡货币平衡）。
- 回来时弹卡“闭关归来”：离线时长（显示“12 小时（已达上限）”）、修为、灵石、灵草，按钮 [收下]；卡上一行小字说明上限与“提升聚灵阵可延长”。
- 存档字段：`G.offAt`（ms），`G.offLog`（最近 5 次结算，人生记录里可看）。
- 数值常量集中放在 `play23.js` 顶部 `const OFFLINE = {capH:12, perZl:1, maxExtra:8, minMin:5, seg:[[4,1],[8,0.7],[1e9,0.4]], expK:0.25, stoneK:40}`，方便调。

✅ 验收：T11——开发者模式“离线模拟 13 小时”→ 触发 `onAppResume` → 卡片显示 12 小时（聚灵阵 0 级时），修为增量 = 公式值（误差 <1%），年龄不变；“离线模拟 -1 小时”（时间倒退）→ 不弹卡。T12——在线挂机 5 分钟（`B.speed` 加速）→ `G.afk.st.kills > 0`、0 个 JS 错误、主角从未离开方框。

---

## D. 开发者模式 + 作弊面板

### D.1 解锁方式（普通玩家看不见、碰不到）

- **标题页**：`ui.js:299` 底部的版本号 `<p class="ver">`，3 秒内**连点 7 次**（安卓“版本号点 7 次”惯例）。第 4 次起 toast “再点 N 次进入开发者模式”。成功：`localStorage.wbx2_dev = '1'`，toast“开发者模式已开启 🛠”。
- **游戏内**：设置面板（`ui.js:169` `p_settings`）底部加一行灰字“版本 v2.2.0 (build 5)”，同样点 7 次。
- **自动化**：URL hash `#dev`（`index.html#dev`）直接开启，供 `test/playtest23.py` 用；可与 `#bot` 并存（`main.js:120` 现在只判断 `location.hash === '#bot'`，改为 `location.hash.includes('bot')`）。
- 关闭：开发者面板里“关闭开发者模式”→ 删除 `wbx2_dev`，隐藏入口。
- 开启后：左侧 `#devbtn` 🛠 44×44（`left:8px; top:calc(170px + safe-top)`，x 8–52, y 170–214）；未开启时**不创建这个 DOM 元素**（测试会检查 `#devbtn` 不存在）。
- 用过作弊的存档：`G.dev = 1`（任何一个作弊动作写入），人生记录和结局页显示小字“🛠 开发者存档”；成就照常解锁但在成就页带 🛠 角标（不改 `meta` 结构，只在 `meta.achs` 旁边加 `meta.achDev = {id:1}`）。

### D.2 面板内容（新文件 `www/js/dev23.js`，`UI.panel('dev')`，复用现有 `.panel` 样式）

顶部 Tab 行（7 个，各 56×40，横向滚动）：**资源 / 境界 / 解锁 / 剧情 / 传送 / 演出 / 调试**。内容区按钮 2 列网格，每个按钮 ≥ 44px 高。所有动作后调用 `UI.hud(); Game.save();`。

| Tab | 控件 | 实现（现有 API） |
|---|---|---|
| 资源 | 灵石 +1万 / +100万；仙缘符 +10 / +100；欠款清零 / ×10；行动力回满；宗门贡献 +1000；全部丹药各 ×10；随机神品装备 ×1 | `G.stone`、`Game.give('xyf', n)`、`G.debt`、`G.ap = Game.apMax()`、`G.contrib`、遍历 `ITEMS` 中丹药 `Game.give`、`Game.randEq(Game.power(), 4)` 后 push 到 `G.eqs` |
| 境界 | 境界下拉（凡人…飞升）+ 小境界 0–3 + [设置]；修为加满（到瓶颈）；寿元 +1000；年龄设为 N；HP/MP 回满 | `G.realm=r; G.stage=s; G.exp=Game.need()*0.99`；之后 `R.player.spr = Game.playerSpr(); loadSprite(...)`（服装随境界变），`Game.checkMain()`；`G.lifeBonus += 1000` |
| 解锁 | 解锁全部地图；全部 NPC 好感 100；任意 NPC 设为同行伙伴（下拉）；全部坐骑；全部时装；全部灵兽各 1 只；全部功法；全部称号条件（只开关显示，不改数据） | `DEV.allMaps=1` → 包装 `Game.canEnter` 返回 true；`G.aff[id]=100`；`G.follower=id; Game.refreshNpcs()`；`Sys.addMount(id,true)` 遍历 `MOUNTS`；`Game.meta.cos[id]=1` 遍历 `COSTUMES`；`Game.addPet(mon, Game.power())` 遍历 `PET_SKILL`；`Game.learn(id)` 遍历 `TECHS` |
| 剧情 | 章节下拉（`MAIN` 全部 id + 名称）+ [跳到此章]；[完成当前章]；任务列表（接受/完成任意支线）；击败/复活任意 BOSS；设置/清除任意 flag（输入框） | 跳章：`G.main = MI(id)`；并补齐前置：`flags.main0/main1/awakened=1`，若 `MAIN[i].realm > G.realm` 则把境界提到该值，若章节在 `sect` 之后且无宗门则 `Game.joinSect('qingyun')`（以 `SECTS` 第一个为准），之前章节的 BOSS 写入 `G.bosses`；`Game.refreshNpcs(); UI.hud()` |
| 传送 | 地图列表（11 张）→ 免费传送 `Game.travel(id, true)`；NPC 列表（按地图分组）→ 传送到他身边并打开对话；[点地图传送] 模式：下一次点地面直接把主角放到该格；坐标输入 i,j | `R.player.i/j = nearestWalk(...) + 0.5`，`R.cam` 同步 |
| 演出 | 播放任意章节 CG；抽卡演出预览（宝/仙/神，单抽/十连，首次/重复）——**只演出不发奖**；突破演出（每个境界 × 成功/失败）；飞升演出；天劫（不扣血）；任意结局预览（不结束人生）；任意年度事件（输入 id 或从 `EVENTS` 列表选）；过年特效 | `UI.chapterShow(MAIN[MI(id)])`（`ui21.js:89`，需先删 `.chapter-fx` 防重入）；`UI.gachaShow([{tier:4,n:'测试神品',ic:'sword_o'}, …])`（`gacha22.js:11`，传假 items 即不发奖）；`VFX.breakthrough(REALMS[r].n, fail)`（`brk22.js`）；结局预览：调用 `UI.ending(kind, ENDINGS[kind], 0, false)` 前把 `G.dead` 备份/恢复，**不能调 `Game.die`**（会删存档）；`Game.runEvent(ev)`；`UI.yearFx(age, g)` |
| 调试 | 开关：无敌、一击必杀、不遇敌、显示点击判定框、显示可走网格、显示 NPC/怪物 id、FPS；速度倍率 ×1/×2/×4/×8；离线模拟（+1h / +13h / +25h / -1h）；查看 `G.flags`（可搜索的列表）、已接任务与进度、`ASSET_DROPPED`、最近 50 条 `console.error`；存档导出（复制 JSON 到剪贴板）/导入（粘贴）/删档；关闭开发者模式 | 见 D.3 |

### D.3 调试开关的接入点

```js
window.DEV = { on:false, god:0, oneHit:0, noEnc:0, allMaps:0, showHit:0, showGrid:0, showIds:0, fps:0, speed:1, tapTp:0, errs:[] };
```
- 无敌：`battle.js:226` `t.hp -= dm;` 前加 `if (DEV.god && (t.isPlayer || t.ally)) dm = 0;`；`Game.tribulation` 扣血处同理。
- 一击必杀：同一处 `if (DEV.oneHit && !t.isPlayer && !t.ally) dm = t.hp;`。
- 不遇敌：`monAI`（`game.js:512`）`if (DEV.noEnc) return;` 放在自动开战判断前。
- 速度倍率：`engine.js:65` 主循环 `update(dt * (DEV.speed||1))`（dt 上限 0.05 保持在乘之前），战斗 `B.speed = DEV.speed`。
- 判定框/网格/id：在 `render()` 末尾 `if (DEV.showHit) drawDebug(ctx)`，画 `entHitRect`（A.1）绿框、交互点判定（药丸+脚下圆）蓝框、`R.grid` 可走格半透明绿、实体 id 小字。
- 错误收集：`main.js:3-4` 的 error/unhandledrejection 监听里 `DEV.errs.push(...)`（保留 50 条）。

✅ 验收：T10（见 G 节）——标题页连点 7 次版本号开启；每个 Tab 至少一个动作执行后状态断言通过；不开启时 `#devbtn` 不存在、`UI.panel('dev')` 不可从任何按钮进入。

---

## E. 内容扩充计划（“怎么爽怎么来”）

### E.0 现状数据（为什么主人觉得“小、少、单薄”）

| 项 | 现状 | 证据 |
|---|---|---|
| 地图尺寸 | **全部 11 张都是 22×22 格**（`art/mapdefs.py:3 N = 22`），底板约 1650×1040 世界 px ≈ **790×500 CSS px**，横向不到两屏；每张图道具 21–49 个 | `assets.js` maps |
| 主线 | 19 章，**一条线**（`MAIN` 线性数组，`G.main` 单下标），唯一分歧是宗门选择和终章三选一 | `story21.js`、`content22.js` |
| 立绘 | **没有立绘**。只有 99 个 256×256 头像（`render_portraits.py` 脸部特写，对话框里显示 110px）+ 27 张场景 CG | `assets.portraits.size=256` |
| 系统 | 洞府只是菜单（聚灵阵/灵田/炼器炉数值）、灵兽只跟随+参战、奇遇是地图上一个“✦机缘”点、没有副本 | `systems21.js` |

### E.1 新系统：按“爽感/工作量”排序

参考：一念逍遥的洞府 = 聚灵阵/修炼室/药园灵田/炼丹房/灵兽园[R16]；鬼谷八荒的大地图每月刷新随机事件、黄色问号奇遇、可交互发光点（挖矿、采药、堪舆找隐藏福利），洞府可买可定居可摆放建筑[R17][R18]；最强祖师的秘境首通后可多次挑战/扫荡、宗门建筑（炼丹房、炼器阁、悬赏台、弟子游历）[R19][R20]。

| 排名 | 系统 | 爽点 | 工作量 | 复用 | 说明 |
|---|---|---|---|---|---|
| 1 | **奇遇链 2.0** | 随时有惊喜，选择有后果 | 小（纯数据） | `R.marks` 的 `jiyuan` + `EVENTS` 格式 | 把单次“✦机缘”扩成 2–4 步的链：第 1 步在地图 A 发现线索 → 第 2 步在地图 B 打精英 → 第 3 步二选一（贪/义）→ 奖励称号/神品/灵兽。头顶黄色“？”（鬼谷八荒式）。首批 12 条，每张地图 1 条，全部扣“天道讨债”主题（例：“天道的失物招领处”“雷部丢了一道雷”）。追踪栏能追。 |
| 2 | **讨债司外包秘境（副本）** | 刷宝、扫荡、数字往上跳 | 中 | 现有地图底板 + 怪物 + 宝箱 | 每张地图一个秘境入口（传送阵道具 `portal`）；进入后用该地图底板，随机放 6–10 只怪 + 2 精英 + 1 守关精英 + 3 宝箱，限时 3 分钟；3 层，每层难度 +0.4 tier；首通给大奖，之后可“扫荡”（消耗 1 行动力直接结算，参考最强祖师[R19]）。不需要新美术。 |
| 3 | **灵宠派遣 + 灵兽园** | 挂机收菜、和离线收益配合 | 小 | `G.pets`、`MAPINFO.mons` | 把闲置灵兽派去某张地图“探索 2/4/8 小时”（真实时间，离线也算，受 C.2 上限约束），回来带材料/灵石/稀有蛋；灵兽园里同种两只可“合宠”提升资质（数值）。 |
| 4 | **炼丹炼器一键连炼** | 一次出 10 炉的满屏金光 | 小 | 现有火候小游戏 | 火候小游戏玩过一次后解锁“一键十连炼”（按最佳记录的 90% 成功率结算），十连结果用抽卡的翻牌演出（`gacha22.js` 卡片样式）。炼器加“洗词条”。 |
| 5 | **欠款玩法：向天道借贷** | 先爽后还、作死有梗 | 小 | `G.debt` | 讨债司窗口可以“借”灵石（利滚利，每年 +3% 的现有利率 ×2）；欠款超过阈值时地图上刷“催收小分队”精英（掉落好东西）；欠款为 0 时解锁隐藏的“无债之身”被动（全属性 +5%）。完全贴合主题。 |
| 6 | **洞府可进入地图** | 有自己的家，摆东西 | 中 | 桃花村底板换色 + 现有道具 | 洞府从菜单变成一张小地图（16×16），聚灵阵/灵田/炼器炉/灵兽园都是可点的建筑，等级越高建筑越大（换道具 sprite）；灵兽在里面闲逛；离线收益卡在洞府里领取。 |
| 7 | **宗门大比（擂台）** | 连胜、排名、称号 | 中 | `Game.fight`、NPC 数据 | 每 10 年一次，10 场车轮战（NPC 用现有立绘/精灵），按名次给称号与贡献；对手包括龙傲天等熟人，带赛前垃圾话。 |
| 8 | **前世记忆（轮回继承）** | 下一世更爽 | 小 | `Game.meta` | 轮回时可选 1 只灵兽或 1 件装备“带进下一世”（降一级品质）。 |

### E.2 分支剧情（贴合“天道讨债”）

现状是单线；做**三条路线 + 共用终章**，用一个存档字段 `G.route = null|'pay'|'dodge'|'buy'` 决定，**不改 `MAIN` 的线性结构**：路线只改变每章的“对话分支 + 1 个路线专属章节 + 同行伙伴 + 终章盟友”。

- **分歧点**：第三章“坊市查账”结尾（拿到“祖传欠条”后）三选一卡：
  1. **还债线 `pay`（正道/打工人）**：“欠债还钱，天经地义。”→ 主角给讨债司当外包催收员抵债，一路催别人的债（催收龙王、催收魔尊），逐渐发现自己催的全是被天道坑的人。专属章节：**“催收员的良心”**（在鬼市被阴三娘点醒，选择反水或继续）。伙伴：追命（催债司主簿）。
  2. **赖账线 `dodge`（魔道/躺平）**：“我没签字，不认。”→ 加入“负债者联盟”（`events22.js` 已有 `flag:debt_union`），带领三界负债者“罢还”。专属章节：**“负债者联盟大罢还”**（守住联盟据点，打三波催收大军）。伙伴：魔女苏魅 / 路人甲（终于当上主角）。
  3. **收购线 `buy`（商道/资本）**：“欠条？我全收了。”→ 在鬼市低价收购三界的欠条，成为天道的最大债权人。专属章节：**“恶意收购讨债司”**（集齐 3 位债权人的委托书，股东大会上投票罢免天道）。伙伴：钱多多 / 财神。连接现有 `tycoon` 结局。
- **终章汇合**（与 `research_v22.md` 4.4 的“南天门竣工验收/债权人会议”一致）：三条线都到“三界债权人会议”，但出席的盟友、最终战的 P2 砍价选项和结局权重不同；`research_v22` 的 `flags.bargain` 计数之外，再加路线专属结局各 1 个（还债线“天道合伙人”、赖账线“三界免息日”、收购线“天道董事长”）。
- **角色线加厚**（不新增美术，复用现有 NPC）：翠花（凡人会老——你修仙 100 年后回村，她已是老奶奶，对话随你的年龄变化）；龙傲天（他其实也是担保人受害者，最终可成为终章盟友）；落魄剑仙（`research_v22` 的“合同真相”线）。每人 3 段带选择的事件 + 1 个羁绊结局。
- **债务驱动的动态剧情**：欠款越高，年度事件里催收类事件权重越高、地图出现催收精英；欠款为 0 时触发隐藏线“无债可讨”（天道反过来求你借钱）。

### E.3 更多、更大的地图

- 🔧 **引擎准备**：①`findPath` 的 `guard < 4000` 改为 `guard < R.n * R.n * 3`；②底板超过 4096 px 时按 2×2 **分块**绘制（`M.plate.chunks=[{img,x,y}]`，`render()` 中只画与视口相交的块），HD 包 k=2 时必需，否则大图在中低端机上纹理超限；③`art/mapdefs.py` 已支持 `cfg['n']`（`gen()` 读 `cfg.get('n', N)`），`render_map.py` 用 `m['n']`，不需要改管线。
- **扩大**：桃花村（新手村/主城）22→**36×36**，加后山、渡口、集市三个分区；青云宗 22→32；天外天 22→32（给“南天门收费站”留位置）。其余 8 张保持 22（它们是“副本感”的小图）。
- **新地图 6 张**（按优先级）：①**洞府**（16×16，E.1 #6）②**雷部发电厂**（渡劫章“雷部电费单”，`research_v22` 第十七章）③**南天门收费站**（终章下）④**忘川·孟婆汤铺**（孟婆已有立绘/精灵）⑤**月宫**（广寒）⑥**百草谷**（谷主已有）。
- **地图连通**：相邻地图在边缘加“出口”（地面箭头 + 传送光圈），走过去免费切图（不消耗行动力），让世界感觉连起来；御剑仍然是远距离快速旅行。
- 每张图至少：1 条奇遇链 + 1 个秘境入口 + 2 个“只有这里有”的交互点（参考 `research_v22` 4.2 的拍卖公告、取号机、申诉窗口）。

### E.4 立绘计划（与奥拉夫设定稿协调）

- **规格**：新脚本 `art/render_lihui.py`（基于 `render_portraits.py`，同一 spec），透视相机 50mm、3/4 侧身、**膝上半身**构图，透明背景，轻量包 720×1080、HD 包 1440×2160，webp。每人 2 个表情：默认 + “激动”（需要奥拉夫稿 §2 的 **E0 攻击换脸**扩展；没做 E0 时只出默认）。
- **对话框改版**（`ui.js` `UI.say` + `.dlg` 样式）：立绘站在对话框上方，底边贴对话框顶边，高 300 CSS px（412 宽屏幕上约占 1/3 高），说话人在左（主角在右，非说话人压暗 40%）；对话框高度不变；没有立绘的角色退回现有 110px 头像。立绘从 `assets/lihui/<id>.webp` 懒加载。
- **顺序**（按出场频率和剧情权重）：
  - 第 1 批（P1，12 个）：主角男/女（4 档服装各 1 = 8 张）、落魄剑仙、娘、翠花、龙傲天、狐妖阿离、掌门、阴三娘、敖小白、算无遗、天道（分身）。
  - 第 2 批（P2）：其余 v2.1 NPC + v2.2 的 12 个新 NPC + BOSS（BOSS 用全身）。
- **与奥拉夫协调的规则**：①v2.2 的 12 个新角色、3 个 BOSS **必须用奥拉夫稿里的“建议 spec”**（去重算盘、阵营色、帽子剪影等，见 `art_specs_v22.md` §1、§3）渲立绘，不要用 `specs.py` 初版，否则立绘和地图精灵会对不上；②奥拉夫稿标了“🔧扩展 Ex”的部件（E0–E12），立绘批次排在这些扩展合入之后；没合入的角色用他给的“降级方案”，并在立绘清单里记一笔，扩展合入后重渲；③立绘额外要求（脸部细节、手部姿势）由开发 bot 先出 3 个样张（剑仙、翠花、阴三娘）发给奥拉夫过目，再批量渲。
- 赛璐璐着色：`PROGRESS.md` 结论是深色角色 cel v2 还不如 PBR，立绘**先用默认 PBR**，等 v2.3 深色材质 A/B 有结论再决定是否统一重渲。

---

## F. 实施优先级（P0 先做）

| 顺序 | 级别 | 内容 | 主要文件 | 预估 | 完成标志 |
|---|---|---|---|---|---|
| 1 | **P0** | NPC 交互修复：A.1 判定框、A.2 摇杆不吞点击、A.5 静默失败、A.6 前两章可点、A.7 资源保护告警 | `engine.js`、`game.js`、`talk.js`/`content22.js`、`story21.js`、`events.js` | 1 天 | T1–T6 通过 |
| 2 | **P0** | 交互提示：A.3 靠近交互按钮、A.4 头顶标记/名牌/屏幕外箭头/首次引导 | 🆕`play23.js`、`index.html`、`style.css`、`engine.js` | 1 天 | T3 通过 + 截图人工确认 |
| 3 | **P0** | 任务追踪栏 + 一键寻路（含跨地图御剑）：B.1–B.3 | `play23.js`、`ui.js`（`hud`、`p_quests`） | 1.5 天 | T7、T8 通过 |
| 4 | **P0** | 开发者模式 + 作弊面板：D 全部 | 🆕`dev23.js`、`ui.js`（title/settings）、`battle.js:226`、`engine.js:65`、`main.js` | 1 天 | T10 通过 |
| 5 | **P0** | 真实触控自动试玩 `test/playtest23.py`（G 节）+ 修 `controls.py` 不再删 NPC；加进 CI（headless Chrome job，在 APK 构建前跑） | `test/`、`.github/workflows/build.yml` | 0.5 天 | CI 绿且确实在点 NPC |
| 6 | P1 | 自动任务循环 B.4 | `play23.js` | 1 天 | T9 |
| 7 | P1 | 挂机 + 离线收益 C | `play23.js`、`engine.js`（lowPower） | 1.5 天 | T11、T12 |
| 8 | P1 | 立绘第 1 批 + 新对话框 E.4 | `art/render_lihui.py`、`ui.js`、`style.css` | 渲染 1 夜 + 0.5 天 | 12 张立绘进包，对话截图 |
| 9 | P1 | 分支剧情 v1：分歧点 + 三条线各 1 个专属章节 + 3 个结局 E.2；奇遇链首批 12 条 E.1#1 | 🆕`content23.js`、`events23.js` | 3 天 | `node test/validate22.js` 扩展校验 0 错误 |
| 10 | P2 | 秘境副本、灵宠派遣、一键连炼、借贷玩法 E.1#2–#5 | `systems23.js` | 3–4 天 | — |
| 11 | P2 | 大地图（引擎分块 + 桃花村 36×36）+ 新地图 6 张 + 地图连通 E.3；洞府地图 E.1#6；宗门大比 E.1#7 | `engine.js`、`art/mapdefs.py`、`content23.js` | 1 周（含渲染） | — |
| 12 | P2 | 立绘第 2 批、`research_v22` 第 17/18/终章（下）落地 | — | — | — |

**P0 全部做完再发 v2.3.0**；P1 可以按 2.3.x 小版本陆续发。

---

## G. 自动化试玩清单（回应“为什么 bot 不自己试玩”）

### G.1 原则（这次必须改的地方）

1. **动作只能用真实触摸**：所有点按、拖动都用 CDP `Input.dispatchTouchEvent`（`test/controls.py` 已有 `touch()`/`tap()` 封装，直接复用），坐标由“屏幕上实际看到的位置”算出（`w2s(t2p(...))` / `getBoundingClientRect()`）。
2. `page.evaluate` **只读状态**做断言；需要造场景时只能通过**开发者模式 API**（`#dev` 启动后调 `DEV`/面板按钮），而且每个测试用例打印出它用了哪些作弊，便于人看出“哪些步骤是真实玩出来的”。
3. **不准删 NPC、不准瞬移**（`controls.py:41` 那种写法只能在“摇杆测量”这一个用例里用，并在注释里写明）。
4. 每个用例出截图到 `test/out23/`、结果写 `test/out23/results.json`，任一失败退出码非 0。

### G.2 新脚本 `test/playtest23.py`（412×915，`device_scale_factor=2`，`is_mobile/has_touch`）

开局流程照抄 `controls.py`（开始新人生 → 选天赋 → 分配 → 摸骨 → 关闭事件卡），URL 带 `#dev`。

| 编号 | 用例 | 步骤（全部触摸） | 断言（evaluate 只读） |
|---|---|---|---|
| T1 | 判定框 | village、sect、market（用开发者传送进入）每个 NPC：相机居中后依次点“脚/身体/头/名字/头顶标记”5 点（位置由 `entHitRect` 和绘制常量算） | 每次点后 6 秒内 `UI.stack` 顶部对话框 `.dn` 文本以该 NPC `n` 开头；**命中率 100%**，0 次打开道具交互 |
| T2 | 摇杆区点按 | 把某 NPC 放到屏幕 (120,700) 附近（开发者传送主角，使 NPC 落在该区域），点它 | 打开该 NPC 对话；`R.joy.active` 从未为 true |
| T3 | 靠近交互按钮 | 走（点地面）到 NPC 1.5 格内 | 300ms 内 `#actbtn` 可见且含 NPC 名；点 `#actbtn` → 对话框标题 = NPC 名 |
| T4 | NPC 闲逛 | 不冻结 NPC，5–6 格外点 NPC 身体，重复 20 次（村里 5 个 NPC 轮流） | 20/20 打开正确对话 |
| T5 | 空路径边界 | 开发者传送主角到 NPC 目标格（与 NPC 距离 1.7） | 点 NPC → 打开对话 |
| T6 | 前两章可点 | 新人生，不按过年：点追踪栏主线“前往”→（自动走到讨债史莱姆并开战，战斗点“自动”）→ 再点“前往”→ 剑仙 → 选“★ 替他付酒钱”→“伸手” | 60 秒内 `G.flags.awakened===1` 且 `MAIN[G.main].id==='sect'`；`G.age===6` |
| T7 | 跨图寻路 | 开发者：练气 + 跳到 `market` 章；人在桃花村；点追踪栏“前往”→ 御剑确认卡点“前往” | `R.mapId==='market'`；40 秒内对话框含“钱多多”；`G.ap` 减 1 |
| T8 | 取消寻路 | T7 中途点地面 | `R.player.nav===null`，提示条隐藏 |
| T9 | 自动任务 | 开发者：练气 + `market` 章；点 [自动]；3 分钟不碰屏幕 | `G.main` 增大；无瞬移（采样位移检查）；0 JS 错误 |
| T10 | 开发者模式 | ①不带 `#dev` 打开：`#devbtn` 不存在；②标题页点 `.ver` 7 次 → `localStorage.wbx2_dev==='1'`、进游戏后 `#devbtn` 存在；③面板逐 Tab：灵石+1万（`G.stone` 增 10000）、设境界元婴（`Game.realmName()` 含“元婴”）、解锁全部地图（`MAP_ORDER.every(Game.canEnter)`）、跳章 `guishi`（`MAIN[G.main].id`）、传送到鬼市（`R.mapId`）、速度×4（同样 1 秒内摇杆位移约 4 倍）、无敌（打一场后 `G.hp` 不变）、播放 CG（出现 `.chapter-fx`）、抽卡预览神品（出现 `.gacha-fx.t4` 且 `G.inv.xyf` 不变、`G.pets/eqs` 不变）、突破演出（出现 `.brk-fx`）、显示 flags（列表非空）| 全部为真 |
| T11 | 离线收益 | 开发者“离线模拟 +13h”→ 触发 `window.onAppResume()`（模拟安卓回到前台的原生回调，这是唯一允许直接调用的 JS 入口）| 弹出“闭关归来”卡，显示 12 小时；修为增量 = 公式值 ±1%；`G.age` 不变；“-1h”不弹卡 |
| T12 | 在线挂机 | 点 `#afkbtn` → [开始挂机]；`DEV.speed=4` 跑 5 分钟 → 点“停止挂机” | `G.afk.st.kills>0`；主角始终在方框内；0 JS 错误；总结卡出现 |
| T13 | 回归 | 依次跑 `test/controls.py`、`test/panels21.py`、`test/multilife.py`、`node test/validate22.js` | 原有断言全过 |

额外每个 P0 用例都截一张图：`t1_<map>_<npc>_<part>.png`、`t3_actbtn.png`、`t6_tracker.png`、`t7_travel.png`、`t10_dev_<tab>.png`，供人工看 UI 是否挡视线、文字是否截断。

### G.3 接入 CI

`.github/workflows/build.yml` 的构建 job 之前加一个 `playtest` job：`ubuntu-latest` 安装 `google-chrome-stable` + `pip install playwright`，跑 `python3 test/playtest23.py`（T1–T10、T13，约 6 分钟；T9/T11/T12 放进 nightly），失败则不发版；`test/out23/` 作为 artifact 上传。

---

## I. 与开发中实现（`ux23.js`，工作区快照 2026-10-10 07:31，未提交）的对照

文件名对应：本文的 `play23.js` + `dev23.js` ≈ 现在的 `ux23.js`；`#actbtn` ≈ `#talkbtn`；`AFK/Auto23` ≈ `AUTO`；`window.DEV` ≈ `ux23.js` 里的 `const DEV`。**沿用 ux23.js 的命名即可**，下表只列需要补的地方。

| 本文条目 | ux23.js 现状 | 还要补的（按优先级） |
|---|---|---|
| A.1 判定框 | ✅ 已放宽（名字+标记+最小宽 76 CSS px，NPC 优先） | ①交互点判定仍是 `by-40 … y+20` 的高柱子（`ux23.js:51`），站在道具旁的 NPC 头顶仍可能被道具抢走——改成 A.1 的“药丸 + 脚下圆”；②加 36 CSS px 胖手指兜底 |
| A.2 摇杆 | 🟡 `engine.js` 只在按到实体时不启动摇杆 | 左下区域点**地面**仍然不能点按移动；按 A.2 改成“移动 ≥8px 才算摇杆” |
| A.3 交互按钮 | ✅ `#talkbtn`（居中，y≈677–737） | 加目标头像；靠近**交互点**（采药/宝箱/打坐）时也显示；主线目标时金色呼吸 |
| A.4 标记 | 🟡 名字底牌 + 圆形“！/？”徽章 + 首次指引气泡 | ①主线目标 **★ + 光柱** 与普通“！”区分（现在 `npcMark` 对主线和支线都返回 `!`）；②普通 NPC 的 💬；③屏幕外目标箭头 |
| A.5 静默失败 | ✅ `UX.goTo`：冻结 NPC、空路径直接到达、走不过去提示、重试 3 次 | 走向 NPC 途中不被闲逛怪物截胡（`P.safeWalk`）尚未做 |
| **A.6 前两章** | ❌ 未处理 | **必须补**：现在 `Track.target('main')` 在序章/第一章（10 岁前）会返回“前往桃花村”，点了原地不动，玩家仍然不知道该干嘛。按 A.6 做讨债史莱姆实体 + 剑仙提前出现，或者最少让追踪栏显示“过年推进（还需 N 年）”并把按钮变成“过年” |
| A.7 资源保护 | ❌ | 加告警与 `ASSET_DROPPED` 校验 |
| B.1–B.3 追踪栏/寻路 | ✅ 每行可点寻路、跨图御剑、任务面板“寻路”按钮 | ①跨图御剑现在**不确认就扣 1 行动力**，按 B.3 加确认卡（含“不再询问”）；②行内没有 ≥44px 的独立按钮（整行可点，行高约 40px），按 B.1 加“前往▶”44×44；③寻路中提示条 + 地面面包屑 + 点地面取消的提示；④“只能过年推进”的步骤要显示“过年”按钮（同 A.6） |
| **B.4 自动任务安全** | 🟠 `AUTO.modalTick` 直接调用 `BOT.tick()` 处理弹窗 | **必须补**：`BOT.pref` 含“结为道侣”“高利贷”“拜师”，且找不到偏好时会在前两个选项里**随机点**——会替玩家选结局（例如“成为新天道（结局）”直接结束这一世）、乱结道侣。按 B.4 换成白名单/黑名单，遇到无安全选项就暂停等玩家；`AUTO.tick` 里 `Game.tryBreak()` 会自动渡**大境界天劫**（可能死），默认只自动突破小境界 |
| C.1 在线挂机 | 🟡 `#autobar` “挂机”按钮、打怪/采集/修炼/自动过年 | ①活动方框（防乱跑）；②统计卡 + “停止挂机”大按钮 + 省电渲染；③停止条件（寿元将尽、背包满、需要选择）；④挂机开始前的设置卡 |
| C.2 离线收益 | 🟡 读档进地图时结算一次，上限 8h、挂机×2 | ①**只在页面加载时结算**（`_offDone` 只跑一次），安卓切后台再切回来（`onAppResume`，页面不重载）**不会结算**——要在 `onAppResume`/`visibilitychange` 也调用；②上限按 C.2 改为 12h + 聚灵阵加时、分段递减；③修为不超过当前瓶颈（现在 `addExp` 可能直接帮玩家升级，把突破的爽点吃掉）；④系统时间倒退防护 |
| D 开发者模式 | 🟡 已有：资源、境界、跳章、传送地图、开打 BOSS、触发事件、无敌/一击必杀、解锁地图/插画、速度、重置 | 主人点名要但还缺的：**解锁全部角色**（灵兽/坐骑/时装/好感/同行伙伴）、**播放任意章节 CG / 抽卡演出（只演不发奖）/ 突破演出（成功+失败）/ 结局预览**、**显示隐藏 flag**、点击判定框/可走网格叠层、传送到指定 NPC、离线模拟、存档导出导入。另外：①`#devbtn` 在屏幕顶部正中（约 x 176–236, y 6–30），**压在 HUD 右边缘上**且只有约 24px 高，按 D.1 挪到左侧 44×44；②“设定境界”后要刷新主角精灵（`Game.playerSpr()`）并把修为设到瓶颈附近；③“跳章”要补齐前置 flag（`main0/main1/awakened`、宗门、之前的 BOSS） |
| G 自动试玩 | ✅ `test/human23.py` 只用触摸、只读 DOM | 补 G.2 的 T1（逐 NPC 5 个点位命中率）、T2、T4（20 次闲逛 NPC）、T6（前两章）、T10 中的演出/解锁项；修改 `controls.py:41` 不再删 NPC（或只在摇杆测量段删并注明）；接入 CI |
| E 内容 | — | 未开始，按 F 节 P1/P2 |

## H. 参考来源

[R1] Android Developers / Google 无障碍帮助：触控目标建议至少 48dp×48dp — https://support.google.com/accessibility/android/answer/7101858 ； https://developer.android.com/guide/topics/ui/accessibility/apps
[R2] 原神手机版靠近 NPC/宝箱/可拾取物时右侧出现“对话/调查/拾取”交互按钮（攻略站描述） — http://www.145z.com/html/yuanshen/jishujiaocheng/35453.html
[R3] 天书奇谈游戏指南·任务操作说明：NPC 头顶黄色叹号=可接任务，金黄色问号=可交任务 — http://www.tianshu.cn/html/22/627/629/209.htm
[R4] 892 游戏网《问道手游地图怎么切换》：任务追踪栏带箭头提示点一下自动寻路到目标地图；多和头上有问号的 NPC 对话 — https://www.892g.cn/gld/14874.html
[R5] 叶子猪论坛转载梦幻西游 2025-05-20 维护公告：点击“任务提示/任务追踪”寻路目标，途经传送点 3 秒后自动切图；七绝山点任务追踪栏图标委托自动完成单人任务 — http://bbs.yzz.cn/thread-791186-1-1.html
[R6] 叶子猪：梦幻西游测试跨场景自动寻路（任务导航里可点击的 NPC 无论在哪都可直接自动寻路） — http://xyq.yzz.cn/focus/202505/1745158.shtml
[R7] 梦幻西游官网新手专区“自动找寻 NPC” — https://xyq.163.com/newer/0-9_05.html ；DVG：小地图点击/NPC 搜索自动寻路 — https://www.dvg.cn/news/167776.html
[R8] 贝壳手游：问道任务栏“自动寻路”按钮 — https://www.bk2.cc/gonglue/2298483.html
[R9] 领域圈：问道手游“修行”活动——点任务栏自动寻路至 NPC 并自动进入战斗，一轮结束弹窗问是否回去重新领取 — https://lingyuq.com/guides/16793.html
[R10] 九游：剑与远征默认挂机收益累积上限 12 小时，VIP 可延长 — https://www.9game.cn/news/4077769.html
[R11] 17173：剑与远征初始挂机有效时间 12 小时，超过不再累积 — https://news.17173.com/z/afk/content/05312021/021630006.shtml
[R12] Google Play《一念逍遥》介绍：“真实挂机系统”，离线后也能真实战斗和挂机产出 — https://play.google.com/store/apps/details?hl=zh&id=com.ltgames.android.m71.us
[R13] 红手指：一念逍遥进入挂机状态后人物固定在一个方框区域活动 — https://www.gc.com.cn/game/ynxygjsyzd.htm
[R14] VMOS 攻略：一念逍遥挂机收益来自野外击杀，聚灵阵等级提升离线修为收益（第三方攻略） — https://shouji.vmos.cn/guides/ynxy/64573.html
[R15] 1403 手游网：寻道大千砍树前三组产出最高、之后直线下降 — https://www.1403.cn/115530.html
[R16] 3DM 手游：一念逍遥洞府功能（聚灵阵、修炼室、药园、炼丹房、灵兽园） — https://shouyou.3dmgame.com/gl/247450.html
[R17] 逗游网：鬼谷八荒地图随机事件（每月刷新、任务追踪显示距离、发光点采集、堪舆找隐藏福利、幸运触发事件） — https://www.doyo.cn/article/426771
[R18] 3DM 手游：鬼谷八荒洞府定居（仙居楼购买、定居按钮、购买与摆放建筑） — https://shouyou.3dmgame.com/gl/553056.html
[R19] 7723：最强祖师新手攻略（秘境首通后可多次挑战/扫荡、炼丹/八卦炉/悬赏台/弟子游历等宗门建筑） — https://3g.7723.cn/strategy/320147.html
[R20] TapTap 最强祖师论坛：生产弟子（灵田、炼丹、炼器）攻略 — https://www.taptap.cn/moment/587655210483056999

> 说明：上面的竞品做法只借鉴交互/系统结构，不使用任何素材。第三方攻略站（R2、R13、R14、R15、R20）是玩家/编辑的描述，不是官方文档；具体数值（如一念逍遥离线收益上限）公开资料里没有找到官方统一说明，本文没有编造，我们自己的 12 小时上限取自剑与远征的公开默认值（R10/R11）。

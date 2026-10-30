# 《我不仙》3.9.2 主线终局补完 · research_story40_main（研究员）

> 写给：开发 agent / 奥拉夫。**只出规格与文本，不改代码。**实现方式：新独立模块 `www/js/main40.js`（在 `content23.js` 之后加载），用「包一层」接入；**禁止改** `game.js` / `talk.js` / `data.js` / `story21.js` / `content22.js` / `content23.js` 本体。
> 核对基准：origin/main（含 `content23.js`、`route37.js`、`chain37.js`、`fam37.js`、`end30.js`、`legacy26.js`），REALMS/STAGES 见 `data.js`。
> 日期：2026-10-30（Asia/Shanghai）。

---

## 0. 版本规划

| 版本 | 内容 | 文档 / 模块 |
|---|---|---|
| 3.8.x | 称号 / 道具 / 家族 / 时装 | research_v39~v41、§15 |
| 3.9.0 | 阵法 zf39 | research_v22 §11；PR 线 |
| **3.9.2** | **主线终局补完 · 天道讨债** | **本文 · `main40.js`** |

命名取 3.9.2：紧接 3.9.0 阵法；3.9.1 留给阵法 UI/秘境钩子收尾。若 3.9.1 空号，也可直接发 3.9.1——以发版人 `PROGRESS` 交接 note 为准。

---

## 1. 现有代码事实（已核对，勿重复造轮子）

### 1.1 境界（无「炼虚」）

`data.js`：`REALMS` = 凡人0 → 练气1 → 筑基2 → 金丹3 → **元婴4** → **化神5** → **渡劫6** → **飞升7**。
`STAGES` = `['初期','中期','后期','圆满']`（每大境界 4 小层，`G.stage` 0..3）。
⚠ 代码与设定里**没有「炼虚」**大境界；若文案写炼虚，一律改成「化神后期/圆满」或「渡劫」。

### 1.2 主线 MAIN 链（id 存档）

`story21.js` 底表 + `content22.js` `ins()` + `content23.js` `ins()`：

```
debt → mentor → sect → rival → market → secret → traitor → corpse → insure → dragon
→ lengyue(4) → longgong(4) → mozun(4) → guishi(4)
→ judge(5) → cuizhai(5) → tiandao(5) → dianfei(6) → hetong(6) → zhenshen(6) → yanshou(6) → done
```

- **元婴～化神章（lengyue…tiandao）**：`content22.js` ✅ 已上线。
- **渡劫～飞升章（dianfei/hetong/zhenshen/yanshou）**：`content23.js` 🟡 **已有骨架**（NPC/MONS/QUESTS/台词/结局名），但存在卡关与分支缺口（见 §1.3）。
- 玩家体感「卡在化神」：打完 `tiandao` 后被重定向到 `dianfei`，而对话/开战要 `G.realm>=6`；`zhenshen` 的 `tiandao2` 也要渡劫——化神号无法推进，追踪栏文案又偏「去催债司」，像坏档。

### 1.3 content23 已知缺口（main40 要补）

| # | 缺口 | 代码位置 | main40 做法 |
|---|---|---|---|
| G1 | 化神卡在 `dianfei`/`zhenshen`，无「先渡劫」软引导 | `Talk.mainTalk` 仅 `realm>=6` 才出星标 | 化神期给追踪「先渡劫」+ 开章卡 `huashen_wait`；星标对 leigong 显示但对话只提示 |
| G2 | `zhenshen` 未要求 `G.stage===3` | content23 只查 `realm<6` | 包 `Talk.boss`：渡劫未圆满则拒战并 toast |
| G3 | 结局只看砍价+`debt`/`aff.mentor` | `yanshou()` 内 | 接入 `G.karma`、`Route37.rep`、`Chain37.doneCount`、`G.fam37.kids`（§5） |
| G4 | `q_ev3` 依赖 `visit_guishi`，老档可能秒完成 | QUESTS.q_ev3 | 包 `Game.finishQuest`/`questAvail`：改需 `flags.ev_xy_chess`（与散人猜拳一次） |
| G5 | `dlg37` 记忆 `m37_mt_forgive`/`m37_mt_grudge` 未读 | fam37/dlg37 | 摊牌时追加一句（TEXT 已写） |
| G6 | 开发者「剧情」跳章不置 `dianfei_done`/`mentor_ally`/`stage` | ux23 `case 'main'` | 追加 §7 五个专用跳转按钮 |
| G7 | `content22` 的 `tiandao2` 战后仍有旧三选一；靠 content23 抢先 return | Talk.boss 链 | main40 再包一层，保证旧三选一永不露出 |
| G8 | 自动任务 `UNSAFE` 已含飞升/砍价关键词 | ux23.js:265 | 追加「以此结局」「留在仙界」「回家」等（见 TEXT.unsafe） |
| G9 | 精灵 `npc_dianmu`/`npc_guichengxiang`/`npc_guolucai` 可能缺失 | content23 `spr()` 回退 | 保持回退；validate 告警不删 NPC |
| G10 | `tiandao3` 三阶段战斗台词弱，砍价在战后 | battle + yanshou | 保持战后砍价（实现成本低）；战斗浮字用 TEXT 补 |

### 1.4 相关字段（只读，按现有惰性兜底）

| 字段 | 含义 |
|---|---|
| `G.main` / `G.mainId` | 主线进度（存 id） |
| `G.realm` / `G.stage` | 大境界 / 小层 |
| `G.debt` | 天道欠款（初始 8888，年息约 3%） |
| `G.karma` | 功德/业力（宗门加入 ±，route/chain 事件改） |
| `G.tribTotal` | content23 包装 `Game.tribulation` 累计雷劫道数 |
| `G.flags.dianfei_*` / `hetong_1` / `mentor_ally` / `bargain` / `ys_end` / `suanpan_ally` | 终局旗标 |
| `G.route37.id` / `G.route37.rep[宗]` | 自由路线与宗门声望（**勿写 `G.sectRel`**） |
| `Chain37.doneCount(G)` | 奇遇链完成数（route37 已桥接 `chainsDone`） |
| `G.fam37.sp` / `G.fam37.kids` | 道侣与子嗣 |
| `G.aff.*` / `G.bosses.*` / `G.qdone.*` | 好感 / Boss / 任务完成 |

---

## 2. 章节清单与解锁

元婴～化神章**不重做**，只列现状供对照。本包实现对象 = `dianfei`/`hetong`/`zhenshen`/`yanshou` 的体验补完 + 结局分支。

| 顺序 | id | 名 | 境界门槛 | 地图 | Boss | 解锁 |
|---|---|---|---|---|---|---|
| 10–16 | lengyue…tiandao | （已有） | 4/5 | 见 MAIN | 见 MAIN | content22 ✅ |
| 17 | `dianfei` | 第十七章·雷部电费单 | 渡劫(6) | cuizhai | dianmu+leigong2 | tiandao 通关后重定向；**对话需 realm≥6** |
| 18 | `hetong` | 第十八章·剑仙的合同 | 渡劫(6) | village→longgong/guishi | mentor_true | `dianfei_done` |
| 终上 | `zhenshen` | 终章（上）·天道真身 | **渡劫圆满** (6+stage3) | cuizhai | tiandao2 | hetong 通关 |
| 终下 | `yanshou` | 终章（下）·南天门竣工验收 | 飞升流程 | heaven | tiandao3 | zhenshen 通关；`ascend` 后找 guolucai |

**化神软引导（修 G1）**：当 `MAIN[G.main].id==='dianfei' && G.realm<6`：
1. 首次进图弹 `cards.huashen_wait`；
2. `Track.target('main')` 返回 `{kind:'realm', btn:'修炼', txt:'先渡劫，再问雷公电费'}`；
3. 点 leigong 仍可闲聊，但星标任务说：“渡劫成功后再来——账单我给你留着，利息另算。”

---

## 3. 分章任务节拍（实现清单）

### 3.1 第十七章 `dianfei`

1. 开章卡（渡劫成功且 main=dianfei，或化神软引导卡）。
2. 雷公 → `flags.dianfei_1`。
3. 电母申诉（可选交 500 灵石）→ 双 Boss `fight('dianmu',{tier:6.2,boss:true,adds:['leigong2'],solo:true,noflee:true,noPenalty:true})`。
4. 胜：债务减免 `(tribTotal||9)*1000`、发奖励、`dianfei_done`、进 `hetong`。
5. 浮字：雷公 15% 误伤电母；HP<30% 近视台词（content23 已有，保留）。

### 3.2 第十八章 `hetong`

1. 桃花村 mentor 看合同 → `hetong_1` + 接 `q_ev1/2/3`。
2. 三证物（见 TEXT.quests；**修 G4**）。
3. 摊牌（读 `m37_mt_*`）→ 师徒战 `mentor_true` tier 6.4。
4. 胜：`mentor_ally`、同行包装（content23 已有 `Game.allyStats`）、进 `zhenshen`。

### 3.3 终章上 `zhenshen`

1. 可选：算无遗带路（content22 `suanpan_ally`）。
2. Boss `tiandao2`：**realm≥6 且 stage===3**；adds 同 content23。
3. 胜：不弹旧三选一；卡 `zhenshen_win` → `yanshou`。

### 3.4 终章下 `yanshou`

1. 追踪在 realm==6 时引导飞升；`Game.ascend` 包装：主线在 yanshou 时不 `die`，进会议。
2. guolucai → 债权人会议（+ route 旁白，§5）→ `tiandao3` tier 6.8。
3. 战后三题砍价 → 签字 → **分支结局**（§5）→ 留仙界 / `Game.die(end)`。

---

## 4. Boss 数值（相对现有缩放）

对照：`guiwang` hp8 @4.9 · `dasiming` hp8.5 @5.75 · `tiandao2` hp10.5 @6.3(content22)/6.75(content23) · `tiandao` hp9。

| id | 名 | hp | atk | def | spd | tier | 技能 |
|---|---|---|---|---|---|---|---|
| dianmu | 电母·闪闪 | 4.5 | 1.45 | 1.1 | 1.35 | 6.2 | atk, dianfeidan, thunder |
| leigong2 | 雷公（近视） | 4.5 | 1.6 | 1.25 | 1.0 | 同场 | atk, thunderall, thunder |
| mentor_true | 剑仙·李欠欠本相 | 6 | 1.7 | 1.2 | 1.4 | 6.4 | atk, swordqi, qiantiao |
| tiandao3 | 天道·完全体 | 12 | 1.8 | 1.5 | 1.15 | 6.8 | atk, audit, lgl, zhangdan + suanpan_b |

本包**不新增第 5 个 Boss 实体**；4 只已在 content23。若数值过软，仅允许在 `main40` 内 `Object.assign(MONS.xxx, {hp/atk…})` 微调 ±10%，并跑 `validate22`。

---

## 5. 结局分支（karma / debt / route / chain / fam）

判定**自上而下第一条命中**（砍价结果仍写入 `G.flags.bargain`）：

1. **jiaxiang「回家」**：`G.debt<=0 && aff.mentor>=100`（保留 content23）。
2. **ys_route_mo「魔君销账」**：`route37.id==='moxiu' && rep.tianmo>=60 && karma<=-40`。
3. **ys_route_fu「买下讨债司」**：`route37.id==='shangjia' && stone>=1e6`（对齐 route 结局门槛）。
4. **ys_clan「家谱第一行」**：`route37.id==='shijia' && fam37.kids.length>=2 && Chain37.doneCount(G)>=3`。
5. **ys_karma「功德清账」**：`karma>=80 && debt<=round(8888*0.3)`。
6. 否则按砍价多数：`ys_paid` / `ys_auditor` / `ys_newdao`（逻辑同 content23，auditor 在 `suanpan_ally` 时权重 +1）。

route 专属 `r37_*` 大结局（逍遥/魔君/富甲/世家）**仍由 route37 在 done 后自行提供**，不与 ys_* 互斥删除；玩家可先走完验收再在 NPC 处另选 route 落幕。

`End30` 大结局只在 `MAIN.id==='done'` 时出现，本包不改其优先级。

---

## 6. 开发者面板跳转（§G6）

在 `UI.p_dev` / `dev341` 的「剧情」Tab 追加 5 按钮（TEXT.dev.buttons）。跳转后 `Game.checkMain(); Game.refreshNpcs(); Game.save();`。
验收：从标题 `#dev` 能一键进到 guolucai 对话，不依赖手动刷 flag。

---

## 7. 接入方式（开发照做）

1. 新建 `www/js/main40.js`（IIFE），`index.html` 放在 `content23.js` **之后**、`ux23.js` 相关自动任务之前或之后均可（若包 Track/Talk，需在 content23 后）。
2. `Object.assign(ENDINGS, TEXT_MAIN40.endings 增量)`；已有 `ys_*`/`jiaxiang` 以本包文案为准覆盖。
3. 包装：`Talk.mainTalk`、`Talk.boss`、`Talk.extra`、`Game.ascend`、`Game.tribulation`（若需）、`Track.target`、`Game.finishQuest`、`UI.p_dev`。
4. 存档：只增 `G.flags.ys40` / `G.flags.ev_xy_chess` / `G.flags.m40_wait` 等，**不升 `G.v`**。
5. 测试：`node test/validate22.js`；单测 `test/main40_unit.js`（建议）；`human_olaf` 不回退；开发者跳转烟测。

---

## 8. 验收清单（奥拉夫）

- [ ] 化神通关 tiandao 后进入 dianfei，**未渡劫**时追踪显示「先渡劫…」，点雷公有提示，不卡死无反馈。
- [ ] 渡劫后可完整跑通：雷公→电母双 Boss→合同→三证物→师徒战→真身（需圆满）→飞升→过路财→完全体→砍价→结局。
- [ ] 旧存档已在 zhenshen 且仅化神：提示需渡劫圆满，不弹出 content22 旧三选一。
- [ ] `jiaxiang`：debt=0 且 mentor 好感≥100 可触发；成就 `jiaxiang_end`。
- [ ] 魔修线：`rep.tianmo>=60` 且 karma≤-40 可出 `ys_route_mo`。
- [ ] 商贾线：stone≥1000000 可出 `ys_route_fu`。
- [ ] 家族线：kids≥2 且 `Chain37.doneCount>=3` 可出 `ys_clan`。
- [ ] 功德线：karma≥80 且债务较低可出 `ys_karma`。
- [ ] 自动任务不点结局/飞升/砍价选项（UNSAFE）。
- [ ] 开发者 5 个跳转按钮可用。
- [ ] `node -e` 解析本文 TEXT_MAIN40 成功；`validate22` 0 错。
- [ ] 不改核心文件；HD/lite 构建路径不因 docs 推送触发（paths-ignore）。

---

## 9. 代码缺口汇总（实现前必读）

见 §1.3 G1–G10。额外：

- ⚠ **无炼虚境界**——文案勿引入。
- ⚠ `Route37.rep` API 是 `Route37.rep(sectId)`，写入用内部 `repAdd`；main40 只读。
- ⚠ `Chain37.doneCount` 扫描 `G.jh34.ch`；缺 jh34 时返回 0。
- ⚠ 剑仙同行依赖 `G.follower==='mentor' && flags.mentor_ally`（content23）。
- ⚠ 新结局 id 需进 `CG_END`（可复用 cg_tiandao / cg_zhenshen / cg_mentor）。
- ⚠ `hetong_doc` 物品已在 content23 `Object.assign(ITEMS,…)`；勿重复 id。

---

## 10. 文本包 TEXT_MAIN40（JSON，已 `JSON.parse` 校验）

```json
{
  "meta": {
    "id": "TEXT_MAIN40",
    "ver": "3.9.2",
    "module": "main40.js",
    "title": "天道讨债终局·主线补完",
    "basedOn": [
      "content22.js",
      "content23.js",
      "research_v22.md§4.4§7",
      "route37",
      "chain37",
      "fam37"
    ]
  },
  "realms": {
    "note": "data.js REALMS；无「炼虚」。每个大境界 4 小层 STAGES=初期/中期/后期/圆满，stage 0..3",
    "list": [
      {
        "i": 0,
        "n": "凡人"
      },
      {
        "i": 1,
        "n": "练气"
      },
      {
        "i": 2,
        "n": "筑基"
      },
      {
        "i": 3,
        "n": "金丹"
      },
      {
        "i": 4,
        "n": "元婴"
      },
      {
        "i": 5,
        "n": "化神"
      },
      {
        "i": 6,
        "n": "渡劫"
      },
      {
        "i": 7,
        "n": "飞升"
      }
    ]
  },
  "chapters": {
    "existing_yuanying_huashen": [
      {
        "id": "lengyue",
        "n": "第十章·冷月之约",
        "realm": 4,
        "map": "island",
        "src": "story21+content22",
        "status": "ok"
      },
      {
        "id": "longgong",
        "n": "第十一章·龙宫太子",
        "realm": 4,
        "map": "longgong",
        "src": "content22",
        "status": "ok"
      },
      {
        "id": "mozun",
        "n": "第十二章·魔尊也欠钱",
        "realm": 4,
        "map": "rift",
        "boss": "mozun",
        "src": "story21+content22",
        "status": "ok"
      },
      {
        "id": "guishi",
        "n": "第十三章·鬼市当铺",
        "realm": 4,
        "map": "guishi",
        "boss": "guiwang",
        "src": "content22",
        "status": "ok"
      },
      {
        "id": "judge",
        "n": "第十四章·判官钱不够",
        "realm": 5,
        "map": "heaven",
        "src": "story21",
        "status": "ok"
      },
      {
        "id": "cuizhai",
        "n": "第十五章·天庭催债司",
        "realm": 5,
        "map": "cuizhai",
        "boss": "dasiming",
        "src": "content22",
        "status": "ok"
      },
      {
        "id": "tiandao",
        "n": "第十六章·讨尾款的天道",
        "realm": 5,
        "map": "heaven",
        "boss": "tiandao",
        "src": "story21+content22",
        "status": "ok"
      }
    ],
    "pack40": [
      {
        "id": "dianfei",
        "n": "第十七章·雷部电费单",
        "realm": 6,
        "stageMin": 0,
        "map": "cuizhai",
        "unlock": "MAIN 在 tiandao 通关后被 content23 重定向到 dianfei；对话/开战需 G.realm>=6",
        "boss": [
          "dianmu",
          "leigong2"
        ],
        "flags": [
          "dianfei_1",
          "dianfei_done"
        ],
        "rewards": {
          "pjd": 2,
          "xyf": 1,
          "hetong_doc": 1,
          "stone": 3000,
          "debtCut": "(G.tribTotal||9)*1000",
          "ach": "dianfei_win"
        }
      },
      {
        "id": "hetong",
        "n": "第十八章·剑仙的合同",
        "realm": 6,
        "map": "village",
        "unlock": "flags.dianfei_done 且 G.main=MI('hetong')；开战需三证物 q_ev1/2/3 done",
        "boss": [
          "mentor_true"
        ],
        "flags": [
          "hetong_1",
          "mentor_ally"
        ],
        "quests": [
          "q_ev1",
          "q_ev2",
          "q_ev3"
        ],
        "rewards": {
          "xyf": 2,
          "xsd": 1,
          "aff.mentor": 30,
          "ach": "hetong_win",
          "follower": "mentor"
        }
      },
      {
        "id": "zhenshen",
        "n": "终章（上）·天道真身",
        "realm": 6,
        "stageMin": 3,
        "map": "cuizhai",
        "boss": "tiandao2",
        "unlock": "hetong 通关后 G.main=MI('zhenshen')；开战需 G.realm>=6 且 G.stage===3（本包补强 content23 仅查 realm）",
        "rewards": {
          "xyf": 2,
          "ach": "zhenshen_win",
          "next": "yanshou"
        }
      },
      {
        "id": "yanshou",
        "n": "终章（下）·南天门竣工验收",
        "realm": 6,
        "map": "heaven",
        "needAscend": true,
        "unlock": "zhenshen 通关；实际开战/会议需 Game.ascend 后 G.realm===7，找 guolucai",
        "boss": [
          "tiandao3",
          "suanpan_b"
        ],
        "rewards": {
          "ach": "yanshou_win",
          "endFlag": "ys_end",
          "xianjie_open": 1
        }
      }
    ]
  },
  "npcs": {
    "dianmu": {
      "n": "电母·闪闪",
      "map": "cuizhai",
      "at": [
        16,
        8
      ],
      "minRealm": 6,
      "sprFallback": "npc_leigong"
    },
    "guichengxiang": {
      "n": "龟丞相",
      "map": "longgong",
      "at": [
        13,
        9
      ],
      "minRealm": 4,
      "sprFallback": "npc_elder"
    },
    "guolucai": {
      "n": "收费员·过路财",
      "map": "heaven",
      "at": [
        11,
        6
      ],
      "minRealm": 6,
      "sprFallback": "npc_tongzi"
    },
    "reuse": [
      "leigong",
      "mentor",
      "sanniang",
      "xiaoyao",
      "suanpan",
      "caishen",
      "taizi",
      "mozun",
      "zhuiming"
    ]
  },
  "chat": {
    "dianmu": [
      "“电费按峰谷计价，渡劫请尽量挑半夜。”",
      "“雷公又劈错了？记他账上。”",
      "“我们雷部三千年没涨工资，只涨了电压。”"
    ],
    "guichengxiang": [
      "“老朽在龙宫管账八百年，一个子儿都没对上过。”",
      "“太子殿下？他在后院练习不继承家业。”",
      "“旧账？旧账都在我壳里，翻起来腰疼。”"
    ],
    "guolucai": [
      "“此门是我开，此路是我栽，要想过此门——请出示无欠款证明。”",
      "“不收现金，只收功德。功德也不够？那就排队。”",
      "“上一个闯门的，现在还在门口扫地。”"
    ],
    "mentor_ally": [
      "“合同的事……等打完这一架，我请你喝酒。”",
      "“那时候我年轻，不看合同的。”",
      "“你填担保人的那天，我其实偷偷哭了一下。就一下。”"
    ]
  },
  "quests": {
    "q_ev1": {
      "n": "龙宫旧账",
      "giver": "guichengxiang",
      "d": "龟丞相说旧账在他壳里。帮他翻身——字面意思：打败龙宫里的 6 只虾兵，让他有空翻身。",
      "need": {
        "k": {
          "xiabing": 6
        }
      },
      "rw": {
        "exp": 120000
      },
      "minRealm": 6,
      "doneSay": "“这页旧账写着：‘甲方李某，借龙宫三千颗夜明珠给世界装路灯，未还。’路灯到现在还是黑的。”"
    },
    "q_ev2": {
      "n": "当铺里的副本",
      "giver": "sanniang",
      "d": "阴三娘：“合同副本押在我这儿一万年了，利息你得付——拿 3 页账本残页来抵。”",
      "need": {
        "i": {
          "ledger": 3
        }
      },
      "rw": {
        "exp": 120000
      },
      "minRealm": 6,
      "doneSay": "“副本拿好。当年他押合同的时候说‘过几天就来赎’——鬼市的‘几天’，原来是一万年。”"
    },
    "q_ev3": {
      "n": "散人的口供",
      "giver": "xiaoyao",
      "d": "逍遥散人说他只在下棋时说真话。陪他下一盘——去鬼市找他。",
      "need": {
        "f": "visit_guishi"
      },
      "rw": {
        "exp": 120000
      },
      "minRealm": 6,
      "doneSay": "“我当年拒绝做担保人。他就说‘那我随便填一个吧’。我问填谁，他说‘一个还没出生的倒霉孩子’。……你几岁来着？”",
      "gap": "⚠ visit_guishi 若玩家早已去过鬼市，任务会瞬间完成；main40 应改成 flags.ev_xiaoyao_talk 或猜拳小游戏一次。"
    }
  },
  "mons": {
    "dianmu": {
      "n": "电母·闪闪",
      "el": "雷",
      "hp": 4.5,
      "atk": 1.45,
      "def": 1.1,
      "spd": 1.35,
      "sk": [
        "atk",
        "dianfeidan",
        "thunder"
      ],
      "boss": 1,
      "drop": [
        "pjd",
        "ledger"
      ],
      "tier": 6.2
    },
    "leigong2": {
      "n": "雷公（近视）",
      "el": "雷",
      "hp": 4.5,
      "atk": 1.6,
      "def": 1.25,
      "spd": 1.0,
      "sk": [
        "atk",
        "thunderall",
        "thunder"
      ],
      "boss": 1,
      "drop": [
        "pjd"
      ],
      "tier": 6.2,
      "note": "15% 误伤电母"
    },
    "mentor_true": {
      "n": "剑仙·李欠欠（本相）",
      "el": "金",
      "hp": 6.0,
      "atk": 1.7,
      "def": 1.2,
      "spd": 1.4,
      "sk": [
        "atk",
        "swordqi",
        "qiantiao"
      ],
      "boss": 1,
      "drop": [
        "xsd"
      ],
      "tier": 6.4
    },
    "tiandao3": {
      "n": "天道·完全体（三界总账）",
      "el": "金",
      "hp": 12.0,
      "atk": 1.8,
      "def": 1.5,
      "spd": 1.15,
      "sk": [
        "atk",
        "audit",
        "lgl",
        "zhangdan"
      ],
      "boss": 1,
      "phase3": 1,
      "drop": [],
      "tier": 6.8
    },
    "suanpan_b": {
      "n": "三界总算盘",
      "el": "金",
      "hp": 3.0,
      "atk": 1.0,
      "def": 0.8,
      "spd": 0.5,
      "sk": [
        "suanzhu"
      ],
      "drop": []
    }
  },
  "skills": {
    "dianfeidan": {
      "n": "电费单",
      "mp": 18,
      "tg": "one",
      "k": 0.6,
      "el": "雷",
      "fx": "thunder",
      "ic": "bill",
      "d": "挂「欠费」，累计 3 次一次性爆出（上限目标气血 35%）",
      "dianfei": 1
    },
    "qiantiao": {
      "n": "一万年欠条剑阵",
      "mp": 22,
      "tg": "all",
      "k": 0.35,
      "el": "金",
      "fx": "slash",
      "ic": "scroll",
      "d": "欠条化剑；叠「欠款」层，5 层眩晕 1 回合"
    },
    "zhangdan": {
      "n": "工程故障单",
      "mp": 20,
      "tg": "all",
      "k": 0.4,
      "el": "金",
      "fx": "stamp",
      "ic": "bill",
      "d": "随机甩出一条故障，降对方攻防"
    },
    "suanzhu": {
      "n": "算珠归位",
      "mp": 10,
      "tg": "self",
      "k": 0,
      "el": "金",
      "fx": "heal",
      "ic": "abacus",
      "d": "给天道·完全体回血并清一层减益"
    }
  },
  "cards": {
    "dianfei_open": {
      "title": "雷劫电费账单",
      "body": "一只纸鹤落在你肩上，展开是一张账单。\n「尊敬的渡劫客户：您本次渡劫共消耗天雷 {trib} 道，按峰时电价计，应缴 {bill} 灵石。逾期将以雷击方式催缴。」\n落款：天庭雷部·计费科。\n\n下一步：前往天庭催债司，找雷公问个明白。",
      "por": "npc_leigong",
      "opts": [
        "继续"
      ]
    },
    "dianfei_win": {
      "title": "外包合同",
      "body": "电母擦掉脸上的焦黑，从袖子里抽出一份发黄的合同：“《天劫外包服务合同》。甲方签名你自己看吧。”\n甲方签名栏：李欠欠。字迹东倒西歪，旁边还画了个酒葫芦。\n你觉得这个酒葫芦……有点眼熟。\n\n（电费账单作废，额外获得 3000 灵石）\n下一步：回桃花村，找那个喝酒的老头。",
      "por": "i:bill",
      "opts": [
        "继续"
      ]
    },
    "hetong_win": {
      "title": "出师",
      "body": "剑仙收剑，坐在桃树下，把酒葫芦递给你。\n“好，这一剑，我还你。剩下的，我们一起去跟天道算。”\n\n合同第 999 条在风里翻了过来：「乙方保证世界有山有水有灵气，灵气不足部分以『心诚则灵』补足。」\n剑仙：“你看，我那时候年轻，不看合同的。”\n\n【落魄剑仙 加入同行】\n下一步：渡劫圆满后前往天庭催债司地下，找天道真身对账。",
      "por": "npc_mentor",
      "opts": [
        "继续"
      ]
    },
    "zhenshen_win": {
      "title": "原来甲方在这儿",
      "body": "总账房的算盘一颗颗崩落。天道真身捡起一颗算珠，看了你身后的剑仙一眼。\n“原来甲方在这儿。”\n“账，我认一半——灵气管道确实偷工减料了。另一半，甲方得到南天门当面签字。”\n“飞升吧。我在门口等你们。”\n天道真身走之前，掏出一张发票：“这一战的场地费……算了。”\n\n下一步：渡劫圆满后飞升，前往南天门竣工验收。",
      "por": "boss_tiandao2",
      "opts": [
        "继续"
      ]
    },
    "yanshou_gate": {
      "title": "南天门",
      "body": "南天门到了。门口有一根栏杆，栏杆旁有一个收费亭。",
      "por": "npc_guolucai",
      "opts": [
        "走过去"
      ]
    },
    "yanshou_sign": {
      "title": "签字",
      "body": "天道递出验收单。剑仙签字，手一抖写成了「李欠欠欠」。\n天道：“多了一个欠。”\n剑仙：“利息。”",
      "por": "npc_mentor",
      "opts": [
        "继续"
      ]
    },
    "huashen_wait": {
      "title": "主线·暂缓催收",
      "body": "纸鹤账单落在你肩上，但抬头一看——你还没渡劫。\n雷部计费科附注：「化神期客户暂存账单，渡劫成功后自动激活催缴。」\n\n（追踪栏会提示：修炼至渡劫，再去催债司找雷公）\n天道欠款暂时冻结利息一年……才怪，利息照收。",
      "por": "npc_leigong",
      "opts": [
        "知道了"
      ]
    },
    "bargain": {
      "title": "砍价",
      "qs": [
        "这条故障算谁的：桃花村的灵气只够种白菜？",
        "这条故障算谁的：鬼市每晚停电？",
        "这条故障算谁的：飞升要交尾款？"
      ],
      "opts": [
        "算天道的",
        "算剑仙的",
        "各退一步"
      ]
    }
  },
  "dlg": {
    "dianfei": {
      "leigong_1": [
        {
          "who": "leigong",
          "t": "“电费？我只管劈，不管算！账都是电母算的，你去问她。”",
          "opts": [
            "她在哪"
          ]
        },
        {
          "who": "leigong",
          "t": "“催债司东厢，门口挂着‘峰谷分时’牌子那间。别踩地上的电线，那是她的头发。”",
          "opts": [
            "……好"
          ],
          "set": "dianfei_1"
        }
      ],
      "dianmu_1": [
        {
          "who": "dianmu",
          "t": "“申诉？可以。请先缴纳申诉电费 500 灵石。”",
          "opts": [
            "凭什么！",
            "交（-500 灵石）"
          ],
          "fx": [
            {
              "stone": 0
            },
            {
              "stone": -500,
              "aff.dianmu": 5
            }
          ]
        },
        {
          "who": "dianmu",
          "t": "“凭合同。天劫三千年前就外包给我们雷部了，天道一分电费没付过。没人付，只好让挨劈的人付——谁用电谁付钱，很合理吧？”",
          "opts": [
            "一点也不合理"
          ]
        },
        {
          "who": "dianmu",
          "t": "“那就用雷部的老规矩：打赢我们俩，账单作废。”",
          "opts": [
            "来！"
          ]
        }
      ],
      "fight_line": {
        "title": "雷部·电母闪闪",
        "t": "“雷公，开灯！”\n雷公：“开哪盏？”\n“劈他！”",
        "opts": [
          "“我是来销账的！”",
          "先撤"
        ]
      }
    },
    "hetong": {
      "mentor_1": [
        {
          "who": "mentor",
          "t": "“嗝——好酒……（看见合同，酒葫芦掉在地上）”",
          "opts": [
            "师父？"
          ]
        },
        {
          "who": "mentor",
          "t": "“这、这字不是我写的。我写字比这好看。……好吧，那天喝多了。”",
          "opts": [
            "你说清楚"
          ]
        },
        {
          "who": "mentor",
          "t": "“徒儿，有些事得有证据才说得清。你去把三样东西找来，我就全告诉你：龙宫龟丞相的旧账、鬼市三娘手里的副本、逍遥散人的口供。”",
          "opts": [
            "好"
          ],
          "set": "hetong_1",
          "accept": [
            "q_ev1",
            "q_ev2",
            "q_ev3"
          ]
        }
      ],
      "mentor_wait": {
        "t": "“还差{n}样，徒儿，别急，我又跑不了——好吧我以前跑过。”",
        "opts": [
          "……"
        ]
      },
      "mentor_reveal": [
        {
          "who": "mentor",
          "t": "“好。我说。这个世界，是我订的。”",
          "opts": [
            "订的？"
          ]
        },
        {
          "who": "mentor",
          "t": "“一万年前，我找天道包工建一个世界，有山有水有灵气。首付付了，尾款……没付。”",
          "opts": [
            "然后呢"
          ]
        },
        {
          "who": "mentor",
          "t": "“担保人那一栏要写生辰八字，我手边没人，就随手写了一个。后来那个八字真的出生了，就是你。”",
          "opts": [
            "所以天道一直追着我讨债？"
          ]
        },
        {
          "who": "mentor",
          "t": "“嗯。我躲在桥洞下喝酒，就是不敢见你。后来忍不住，还是去收了你当徒弟……想着至少教你打得过讨债的。”",
          "opts": [
            "师父，拔剑吧",
            "（先不说话）"
          ],
          "branch": [
            {
              "i": 0,
              "note": "若 G.flags.m37_mt_forgive：追加「……你说过不会恨我。那这一剑，算利息。」；aff.mentor+10"
            },
            {
              "i": 1,
              "say": "“……你不说话比打我还疼。来吧，拔剑。”",
              "note": "若 G.flags.m37_mt_grudge：追加「你记过账。今天我连本带利还。」；aff.mentor-5, G.karma+2"
            }
          ]
        }
      ],
      "fight_line": {
        "title": "剑仙·李欠欠本相",
        "t": "“这一万年的欠条，每一张都是一把剑。接得住，你就出师了。”",
        "opts": [
          "“我接！”",
          "先撤"
        ]
      }
    },
    "zhenshen": {
      "gate_weak": {
        "who": "tiandao2",
        "t": "“你还太弱了。（需要渡劫圆满——主线终局已延到渡劫，详见更新公告）”",
        "opts": [
          "撤"
        ]
      },
      "fight_line": {
        "title": "天道真身·总账房",
        "t": "“我不是神。我是三界最大的债主，也是最大的欠债人。你要对账？那就看看谁的账更硬。”",
        "opts": [
          "“今天，连本带利！”",
          "先撤"
        ]
      }
    },
    "yanshou": {
      "guolucai": [
        {
          "t": "“站住。飞升通道，单程收费。请出示无欠款证明。”",
          "opts": [
            "我是来销账的"
          ]
        },
        {
          "t": "“销账？那你得等债权人会议开完。会议室在里面——哦，他们已经全到了。”",
          "opts": [
            "……"
          ]
        }
      ],
      "creditors": [
        {
          "por": "npc_caishen",
          "n": "财神",
          "t": "“我借了天道三万万灵石，有欠条。”"
        },
        {
          "por": "boss_mozun",
          "n": "魔尊",
          "t": "“天道欠我刀钱。另外——我也欠财神的。”"
        },
        {
          "por": "npc_taizi",
          "n": "龙宫太子·敖小白",
          "t": "“我爹借了天道夜明珠，天道又借我爹装修费。”"
        },
        {
          "por": "npc_sanniang",
          "n": "阴三娘",
          "t": "“在座各位都在我这儿押过东西。”"
        },
        {
          "por": "dianmu",
          "n": "电母",
          "t": "“电费。所有人的。”"
        },
        {
          "por": "npc_suanpan",
          "n": "算无遗",
          "t": "“我算完了。三界总债务……等于零。”",
          "if": "flags.suanpan_ally"
        },
        {
          "por": null,
          "n": "",
          "t": "（全场沉默）",
          "opts": [
            "“你们这是三角债！”"
          ]
        }
      ],
      "route_lines": {
        "sanxiu": {
          "por": "npc_xiaoyao",
          "n": "逍遥散人（旁听）",
          "t": "“我就说嘛，签合同不如喝酒。”",
          "if": "route37.id==sanxiu && Chain37.doneCount>=2"
        },
        "moxiu": {
          "por": "boss_mozun",
          "n": "魔尊",
          "t": "“魔修的账，天道得排队。我帮你站前面。”",
          "if": "route37.id==moxiu && route37.rep.tianmo>=40"
        },
        "zhangmen": {
          "por": "npc_elder",
          "n": "宗门来使",
          "t": "“掌门，宗门公函到了：本宗愿作验收见证人。”",
          "if": "route37.id==zhangmen && route37.rep[sect]>=50"
        },
        "shangjia": {
          "por": "npc_merchant",
          "n": "钱多多",
          "t": "“道友，讨债司最近……在找买家。您要不要先看看报价？”",
          "if": "route37.id==shangjia && stone>=500000"
        },
        "shijia": {
          "por": "npc_mom",
          "n": "娘",
          "t": "“孩子，娘把家谱带上来了。你签完字，回家吃饭。”",
          "if": "route37.id==shijia && fam37.kids.length>=1"
        }
      },
      "fight_line": {
        "title": "天道·完全体（三界总账）",
        "t": "“零？那也得验收。工程验收不通过，账就不算清。\n我是规则。规则的最后一条是：任何账，都要有人签字。”",
        "opts": [
          "“那就打完再签！”",
          "先撤（找收费员过路财可再来）"
        ]
      },
      "mentor_bargain_b": "“徒儿，你认真的？……行吧，我认。”"
    }
  },
  "endings": {
    "ys_paid": [
      "工程验收通过",
      "天道修好了漏气三千处的灵气管道，从此凡人种白菜也能顺便筑基。剑仙用一万年打工抵尾款，在南天门当收费员，和过路财轮班。你偶尔路过，他从不收你钱。"
    ],
    "ys_newdao": [
      "新天道",
      "你成了三界的新总承包方。第一条规定：禁止利滚利。第二条规定：合同必须看完再签。剑仙说第二条是针对他的。"
    ],
    "ys_auditor": [
      "三界审计",
      "算无遗当上了三界审计，每年对一次总账，从没对平过，但大家都很开心。你和剑仙去龙宫民宿当了股东，敖小白负责前台。"
    ],
    "jiaxiang": [
      "回家",
      "南天门的栏杆抬了起来，可你没有进去。剑仙拍拍你的肩：“走，回桃花村喝酒。”\n娘做了一桌菜，王大爷的桃又被偷了。天道的账，就让它挂着吧。"
    ],
    "ys_karma": [
      "功德清账",
      "你这一生功德簿厚得像砖。天道看着你的业力报表，默默把利息划掉了三成，又给你盖了个「诚信修士」的章——章盖歪了。"
    ],
    "ys_route_mo": [
      "魔君销账",
      "你把验收单翻到背面，批了两个字：「驳回。」天魔殿的旗在南天门猎猎作响，天道第一次学会了排队。"
    ],
    "ys_route_fu": [
      "买下讨债司",
      "你掏出一张灵石本票。过路财愣了三秒，把栏杆拆了当赠品。讨债司易主那天，欠条被装裱进了大堂。"
    ],
    "ys_clan": [
      "家谱第一行",
      "你把验收单夹进家谱。娘说这页以后不许撕。子嗣们后来都知道：咱家的债，是一代一代签完的。"
    ]
  },
  "branch": {
    "priority": [
      {
        "end": "jiaxiang",
        "when": "G.debt<=0 && (G.aff.mentor||0)>=100",
        "ach": "jiaxiang_end"
      },
      {
        "end": "ys_route_mo",
        "when": "G.route37&&G.route37.id==='moxiu' && (G.route37.rep.tianmo||0)>=60 && (G.karma||0)<=-40"
      },
      {
        "end": "ys_route_fu",
        "when": "G.route37&&G.route37.id==='shangjia' && (G.stone||0)>=1000000"
      },
      {
        "end": "ys_clan",
        "when": "G.route37&&G.route37.id==='shijia' && (G.fam37&&G.fam37.kids||[]).length>=2 && Chain37.doneCount(G)>=3"
      },
      {
        "end": "ys_karma",
        "when": "(G.karma||0)>=80 && G.debt<=Math.round(8888*0.3)"
      },
      {
        "end": "ys_paid",
        "when": "bargain 多数选「算天道的」(cnt[0]最大)"
      },
      {
        "end": "ys_auditor",
        "when": "bargain 多数选「各退一步」(cnt[2]>=cnt[1] 且 不小于 cnt[0])；或 flags.suanpan_ally && cnt[2]>=1"
      },
      {
        "end": "ys_newdao",
        "when": "else（多数选「算剑仙的」或平票偏 B）"
      }
    ],
    "scoreHint": "砍价仍写 G.flags.bargain='a,b,c'；main40 另写 G.flags.ys40={karma,debt,route,rep,chains,kids} 便于验收。route37 专属结局不覆盖 jiaxiang。"
  },
  "track": {
    "dianfei": {
      "leigong": "去催债司问雷公电费的事",
      "dianmu": "去东厢找电母申诉",
      "realm": "先渡劫，再问雷公电费"
    },
    "hetong": {
      "mentor0": "回桃花村找师父",
      "ev": "证物（已集 {n}/3）",
      "fight": "与师父一战"
    },
    "zhenshen": {
      "suanpan": "找算无遗带路进总账房",
      "boss": "与天道真身对账",
      "stage": "渡劫圆满后再战总账房"
    },
    "yanshou": {
      "break": "飞升，去南天门",
      "guolucai": "南天门竣工验收"
    }
  },
  "dev": {
    "tabHint": "开发者面板「剧情」已有 MAIN 列表跳转；main40 追加按钮组",
    "buttons": [
      {
        "id": "m40_dianfei",
        "n": "跳·第十七章电费单",
        "do": "G.main=MI('dianfei'); G.realm=6; G.stage=0; G.flags.dianfei_1=0; G.flags.dianfei_done=0; G.tribTotal=G.tribTotal||12;"
      },
      {
        "id": "m40_hetong",
        "n": "跳·第十八章合同",
        "do": "G.main=MI('hetong'); G.realm=6; G.flags.dianfei_done=1; G.flags.hetong_1=0; Game.give('hetong_doc',1);"
      },
      {
        "id": "m40_hetong3",
        "n": "跳·合同三证齐",
        "do": "G.main=MI('hetong'); G.realm=6; G.flags.dianfei_done=1; G.flags.hetong_1=1; ['q_ev1','q_ev2','q_ev3'].forEach(q=>G.qdone[q]=1);"
      },
      {
        "id": "m40_zhenshen",
        "n": "跳·终章上真身",
        "do": "G.main=MI('zhenshen'); G.realm=6; G.stage=3; G.flags.mentor_ally=1; G.flags.dianfei_done=1;"
      },
      {
        "id": "m40_yanshou",
        "n": "跳·终章下验收(飞升)",
        "do": "G.main=MI('yanshou'); G.realm=7; G.stage=0; G.flags.mentor_ally=1; G.flags.dianfei_done=1; G.flags.boss_tiandao2=1;"
      }
    ]
  },
  "unsafe": [
    "结局",
    "落幕",
    "飞升",
    "渡劫",
    "成为新天道",
    "销账",
    "算天道",
    "算剑仙",
    "各退一步",
    "以此结局",
    "留在仙界",
    "回家"
  ]
}
```

---

## 11. 给开发的一句话

**不要重写 content23**——在其后加 `main40.js`：修化神软引导、补 stage===3、接 karma/route/chain/fam 结局、修 q_ev3、加开发者跳转；台词与数值以本文 TEXT_MAIN40 为准。

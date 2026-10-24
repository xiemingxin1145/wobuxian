# 《我不仙》3.8.2 新道具（研究员设计稿 · v40）

> 新模块 `www/js/items40.js`：`Object.assign(ITEMS, …)` 追加（content23/lg36 同惯例），`GIFTS.push(...)` 新礼物，包 `Game.use`（或 UI 背包使用入口）新增 `use` 类型。存档无新结构，仅 `G.i40 = { v:1, cnt:{[id]:n}, giftM:{[npcId]:月} }`（限用次数/送礼冷却），惰性兜底，不升 `G.v`。审核：奥拉夫。
> 版本规划：3.8.0 人物详情 → 3.8.1 称号 → **3.8.2 道具** → 3.8.3 家族。

## 1. 现有道具（已核对，避免冲突）
- data.js `ITEMS` 24 个：hcd hld pyd zjd pjd ysd xsd tsf ysf herb lz ore peach yd egg bill ledger key scroll wine jadeg fan coin fish
- 其他模块追加：xyf（systems21）mg_reroll（daily33）lgd tcdb（lg36）sqj（shenqi36）wb33_frag（worldboss33）hetong_doc（content23）
- 现有 `t` 类型：pill tal mat misc quest gift；现有 `use`：heal mana exp life linggen peach egg scroll。
- 送礼：`GIFTS = [wine,jadeg,fan,peach,fish,coin]`，talk.js:80 最爱(`Talk.prefs`) +22，否则 +8~12，好感上限 150。**没有「讨厌」概念**。
- 本版 60 个新 id 一律 `i40_` 前缀，已 grep 全部 www/js 无同名。

## 2. 分类与数量
| 类别 | 数量 | 说明 |
|---|---|---|
| 可使用 use | 25 | 丹药/符箓/窥心/家族类 |
| 可赠送 gift | 20 | 每个列出 love/hate NPC（id 或类型标签） |
| 剧情 quest | 15 | 多数与 3.8.0 秘密、3.8.3 家族挂钩；`quest:1` 不可出售 |

## 3. 送礼规则（扩展 talk.js）
- `GIFTS.push(...gift 类 id)`；送礼时：命中 `love`（或旧 `Talk.prefs`）→ +22；命中 `hate` → **−12**（新增，**代码不支持**，需包 Talk 送礼函数）；其他 → 原逻辑 +8~12。
- 每 NPC 每游戏月送礼最多 1 次（`G.i40.giftM`），防刷 150。
- 3.8.0 NPC 命格 `n_tianxi` 好感 +25%、`n_qiongxiang` +5 在此结算。
- 送过一次后，详情面板「喜好」栏显示该物品爱/憎。

## 4. 解锁隐藏属性（对接 3.8.0）
| 道具 | 解锁 | 价格 | 限制 |
|---|---|---|---|
| i40_kuixin_jing 窥灵镜 | 隐藏灵根 | 1200 | 消耗；不受境界差限制 |
| i40_mingpan 命盘残页 | 命格 | 2500 | 消耗 |
| i40_tongxin 同心香 | 真实好感（当年） | 900 | 消耗 |
| i40_mixin 密信 | 秘密① | 0（掉落） | 绑定掉落时的 NPC |
| i40_shenshi 养神丹 | 神识 +3（当年） | 1500 | 每年 1 颗 |
| 剧情道具 `sec:npc:1` | 指定 NPC 秘密② | — | 交给该 NPC 时结算 |

## 5. 平衡
- 丹药限用：属性类（驻颜/开窍）各终身 3 次；逍遥丸每大境界 3 颗（`G.i40.cnt`）。
- 价格对标：回春丹 40、培元丹 90、筑基丹 300；新物品 5–5000，族产类（地契 5000）对应 3.8.3 族产年产 ~600（≈8 年回本）。
- 掌心雷 300×大境界 ≈ 同境界普攻 3~4 下，每战 1 张（战斗内限用）。

## 6. 效果字段支持度（`sup`）
- `true`：复用现有 use（heal/life/scroll）——直接可用。
- `"partial"`：效果串 Game.apply 已有 case（flag/debtint/petexp），但 **`use:'apply'` 处理器需新增**（背包使用时把 `eff` 交给 `Game.apply`）。
- `false`：**代码不支持**，需新实现：`peek`(3.8.0 PF38.reveal)、`passive`(持有生效，需包 cultMult)、`buff/dmg/flee`(战斗内道具，battle.js:172 只认 ITEMS[a.item].use 的 heal/mana)、`st:cha:1`（Game.apply 无 st case）、`lg36pur`、`relReset`、`match/birth/clanRule/clanProp/clanLv/clanMatch`（3.8.3）、`sec:*`（3.8.0）、`debtSeed`、送礼 `hate`。

## 7. Hooks
1. `Object.assign(ITEMS, TEXT40 items → {n,ic,t,p,d,use,eff,quest})`；图标暂复用：丹→pill_*，符→tal 系，礼物→jadeg/fan 图标，剧情→scroll/ledger。
2. `GIFTS.push(...)`；包 `Talk.gift`（talk.js:75）加 love/hate/冷却。
3. 包背包使用：`use` ∈ {apply, peek, passive} 分派。
4. 商店：药铺/钱多多/鬼市库存追加（`src` 字段为策划来源，商店配置由程序落地）。
5. 掉落：路遇（npc37）选项可掉 `i40_mixin`（5%，绑定当前 NPC）。
6. DevPanel：dev341 道具页自动按 t 分组，无需改。

## 8. 验收清单（奥拉夫）
- [ ] 60 个 id 全部 `i40_` 前缀，与上述 31 个现有 id 无冲突；`Object.keys(ITEMS)` 总数 = 原数 + 60。
- [ ] quest 道具不可出售、不可赠送。
- [ ] 礼物 love/hate 引用的 NPC id 全部存在于 NPCS（`kin`/`*` 为类型标签）。
- [ ] hate −12 生效且 aff 不低于 0；每 NPC 每月送礼 ≤1。
- [ ] 窥心道具调用 3.8.0 reveal，已解锁时提示「已知晓」不消耗。
- [ ] 限用计数生效（驻颜/开窍 3 次、逍遥丸每境界 3 颗、养神丹每年 1）。
- [ ] `sup:false` 的道具在对应系统未上线前不进商店/掉落。
- [ ] TEXT40 JSON.parse 通过。

## 9. 文本包 TEXT40
```json
{
 "items": [
  {
   "id": "i40_jingxin",
   "n": "静心丹",
   "cat": "use",
   "t": "pill",
   "p": 120,
   "d": "打坐一次修为翻倍（当年1次）",
   "src": "丹房长老/药铺",
   "use": "apply",
   "eff": "flag:i40_dz2",
   "sup": false
  },
  {
   "id": "i40_huiyuan",
   "n": "回元散",
   "cat": "use",
   "t": "pill",
   "p": 60,
   "d": "回复50%气血（复用 use:heal，与回春丹同档但更便宜、仅药铺售）",
   "src": "药铺掌柜",
   "use": "heal",
   "sup": true
  },
  {
   "id": "i40_xiaoyao",
   "n": "逍遥丸",
   "cat": "use",
   "t": "pill",
   "p": 300,
   "d": "寿元上限+2年（每档境界限用3颗）",
   "src": "鬼市阴三娘",
   "use": "life",
   "sup": "partial"
  },
  {
   "id": "i40_xisui_s",
   "n": "小洗髓液",
   "cat": "use",
   "t": "pill",
   "p": 800,
   "d": "灵根纯度+8（lg36）",
   "src": "百草谷主",
   "use": "apply",
   "eff": "lg36pur+8",
   "sup": false
  },
  {
   "id": "i40_poxie",
   "n": "破邪符",
   "cat": "use",
   "t": "misc",
   "p": 80,
   "d": "本场战斗对魔/鬼系伤害+20%",
   "src": "说书先生/青云宗",
   "use": "apply",
   "eff": "buff:poxie",
   "sup": false
  },
  {
   "id": "i40_dunfu",
   "n": "土遁符",
   "cat": "use",
   "t": "misc",
   "p": 50,
   "d": "立即脱离战斗，必定成功",
   "src": "奸商·钱多多",
   "use": "apply",
   "eff": "flee",
   "sup": false
  },
  {
   "id": "i40_leifu",
   "n": "掌心雷符",
   "cat": "use",
   "t": "misc",
   "p": 150,
   "d": "对单体造成 300×大境界 雷属性伤害",
   "src": "雷公(aff≥40)",
   "use": "apply",
   "eff": "dmg:lei:300",
   "sup": false
  },
  {
   "id": "i40_kuixin_jing",
   "n": "窥灵镜",
   "cat": "use",
   "t": "misc",
   "p": 1200,
   "d": "揭示一名NPC的隐藏灵根（3.8.0）",
   "src": "鬼市/守墓人秘密",
   "use": "peek",
   "eff": "lg",
   "sup": false
  },
  {
   "id": "i40_mingpan",
   "n": "命盘残页",
   "cat": "use",
   "t": "misc",
   "p": 2500,
   "d": "揭示一名NPC的命格（3.8.0）",
   "src": "说书先生·算命摊/秘境",
   "use": "peek",
   "eff": "mg",
   "sup": false
  },
  {
   "id": "i40_tongxin",
   "n": "同心香",
   "cat": "use",
   "t": "misc",
   "p": 900,
   "d": "当年可见一名NPC的真实好感（3.8.0）",
   "src": "狐妖·阿离/广寒仙子",
   "use": "peek",
   "eff": "taff",
   "sup": false
  },
  {
   "id": "i40_mixin",
   "n": "密信",
   "cat": "use",
   "t": "misc",
   "p": 0,
   "d": "揭示一名NPC的秘密①（3.8.0，绑定NPC）",
   "src": "路遇事件掉落",
   "use": "peek",
   "eff": "sec1",
   "sup": false
  },
  {
   "id": "i40_shenshi",
   "n": "养神丹",
   "cat": "use",
   "t": "pill",
   "p": 1500,
   "d": "当年神识+3（3.8.0门槛计算）",
   "src": "丹房长老 aff≥80",
   "use": "apply",
   "eff": "flag:i40_ss3",
   "sup": false
  },
  {
   "id": "i40_wangyou",
   "n": "忘忧水",
   "cat": "use",
   "t": "misc",
   "p": 400,
   "d": "与一名NPC的关系清零（仇恨也清零）",
   "src": "孟婆摊(鬼市)",
   "use": "apply",
   "eff": "relReset",
   "sup": false
  },
  {
   "id": "i40_yuelao",
   "n": "月老红线",
   "cat": "use",
   "t": "misc",
   "p": 3000,
   "d": "婚配成功率+30%（3.8.3，单次）",
   "src": "月老祠事件",
   "use": "apply",
   "eff": "match+0.3",
   "sup": false
  },
  {
   "id": "i40_songzi",
   "n": "送子观音瓶",
   "cat": "use",
   "t": "misc",
   "p": 2000,
   "d": "当年子嗣降生概率+40%",
   "src": "广寒仙子/家族事件",
   "use": "apply",
   "eff": "birth+0.4",
   "sup": false
  },
  {
   "id": "i40_jiapu",
   "n": "空白族谱",
   "cat": "use",
   "t": "misc",
   "p": 500,
   "d": "开族立谱，家族等级1的前置（3.8.3）",
   "src": "说书先生",
   "use": "apply",
   "eff": "flag:clan41_open",
   "sup": "partial"
  },
  {
   "id": "i40_zuxun",
   "n": "祖训竹简",
   "cat": "use",
   "t": "misc",
   "p": 1000,
   "d": "可多选一条族规（3.8.3，上限+1）",
   "src": "守墓人",
   "use": "apply",
   "eff": "clanRule+1",
   "sup": false
  },
  {
   "id": "i40_dici",
   "n": "地契",
   "cat": "use",
   "t": "misc",
   "p": 5000,
   "d": "获得一处族产「良田」（3.8.3）",
   "src": "市场拍卖",
   "use": "apply",
   "eff": "clanProp:tian",
   "sup": false
  },
  {
   "id": "i40_xingyun",
   "n": "转运珠",
   "cat": "use",
   "t": "misc",
   "p": 700,
   "d": "下一次奇遇必定触发（Game.roll qiyu）",
   "src": "钓鱼佬",
   "use": "apply",
   "eff": "flag:i40_luck",
   "sup": false
  },
  {
   "id": "i40_huanyan",
   "n": "驻颜丹",
   "cat": "use",
   "t": "pill",
   "p": 600,
   "d": "魅力+1（上限+3次）",
   "src": "苏魅",
   "use": "apply",
   "eff": "st:cha:1",
   "sup": false
  },
  {
   "id": "i40_kaiqiao",
   "n": "开窍丹",
   "cat": "use",
   "t": "pill",
   "p": 900,
   "d": "悟性+1（上限+3次）",
   "src": "丹房长老",
   "use": "apply",
   "eff": "st:int:1",
   "sup": false
  },
  {
   "id": "i40_jiezhai",
   "n": "延期还款单",
   "cat": "use",
   "t": "misc",
   "p": 300,
   "d": "本年天道利息减半",
   "src": "仙官·记账童子",
   "use": "apply",
   "eff": "debtint",
   "sup": "partial"
  },
  {
   "id": "i40_shuguan",
   "n": "书馆借书证",
   "cat": "use",
   "t": "misc",
   "p": 100,
   "d": "领取一本随机功法卷轴",
   "src": "说书先生",
   "use": "scroll",
   "sup": true
  },
  {
   "id": "i40_lingshou",
   "n": "灵兽肉干",
   "cat": "use",
   "t": "misc",
   "p": 40,
   "d": "灵宠经验+50",
   "src": "钓鱼佬/野猪掉落",
   "use": "apply",
   "eff": "petexp",
   "sup": "partial"
  },
  {
   "id": "i40_dazuo",
   "n": "蒲团·千年",
   "cat": "use",
   "t": "misc",
   "p": 2000,
   "d": "打坐修为+10%（持有生效）",
   "src": "秘境",
   "use": "passive",
   "eff": "cult+0.1",
   "sup": false
  },
  {
   "id": "i40_guihua",
   "n": "桂花糕",
   "cat": "gift",
   "t": "gift",
   "p": 30,
   "d": "村口张婶做的，甜到心里",
   "src": "桃花村",
   "love": [
    "kin",
    "cuihua",
    "aoxiao"
   ],
   "hate": [
    "sumei",
    "zhuiming"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_laojiu",
   "n": "三十年老窖",
   "cat": "gift",
   "t": "gift",
   "p": 280,
   "d": "剑仙闻了都要醒",
   "src": "酒肆/市场",
   "love": [
    "mentor",
    "mentor2",
    "ruyan",
    "farmer"
   ],
   "hate": [
    "sister",
    "lengyue"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_yuzan",
   "n": "碧玉簪",
   "cat": "gift",
   "t": "gift",
   "p": 450,
   "d": "成色上好的暖玉",
   "src": "奸商·钱多多",
   "love": [
    "sister",
    "cuihua",
    "lengyue",
    "guanghan"
   ],
   "hate": [
    "mentor",
    "moguard"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_huaben",
   "n": "话本《霸道仙尊爱上我》",
   "cat": "gift",
   "t": "gift",
   "p": 60,
   "d": "市井畅销书，第三卷缺页",
   "src": "茶馆小二",
   "love": [
    "cuihua",
    "aoxiao",
    "lost",
    "shuoshu"
   ],
   "hate": [
    "elder",
    "xiaoyi"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_qiju",
   "n": "寒玉棋盘",
   "cat": "gift",
   "t": "gift",
   "p": 900,
   "d": "落子有声，天然生凉",
   "src": "龟丞相",
   "love": [
    "elder",
    "guzhu",
    "guichengxiang",
    "xiaoyao"
   ],
   "hate": [
    "aoxiao",
    "lost"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_suanpan",
   "n": "金算盘",
   "cat": "gift",
   "t": "gift",
   "p": 1200,
   "d": "拨一下，钱就多一点（错觉）",
   "src": "财神/鬼市",
   "love": [
    "merchant",
    "sumei",
    "caishen",
    "suanpan"
   ],
   "hate": [
    "mentor",
    "keeper"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_yaocao",
   "n": "九叶灵芝",
   "cat": "gift",
   "t": "gift",
   "p": 700,
   "d": "药香扑鼻，百年一见",
   "src": "秘境/药田",
   "love": [
    "danlao",
    "yaopu",
    "guzhu"
   ],
   "hate": [
    "merchant"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_yugan",
   "n": "紫竹鱼竿",
   "cat": "gift",
   "t": "gift",
   "p": 350,
   "d": "据说钓上来过一只王八精",
   "src": "钓鱼佬",
   "love": [
    "fisherm",
    "fisher2",
    "guichengxiang"
   ],
   "hate": [
    "sumei",
    "xianguan"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_xiangnang",
   "n": "安神香囊",
   "cat": "gift",
   "t": "gift",
   "p": 120,
   "d": "内装薰衣灵草",
   "src": "药铺掌柜",
   "love": [
    "mom",
    "yaopu",
    "lost",
    "keeper"
   ],
   "hate": [
    "moguard"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_baigu",
   "n": "白骨笛",
   "cat": "gift",
   "t": "gift",
   "p": 500,
   "d": "鬼市特产，吹起来像哭",
   "src": "鬼市",
   "love": [
    "sanniang",
    "baiwuchang",
    "guizu",
    "keeper"
   ],
   "hate": [
    "mom",
    "cuihua",
    "guzhu"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_mozhu",
   "n": "魔晶烛",
   "cat": "gift",
   "t": "gift",
   "p": 800,
   "d": "点燃时满屋紫光，邪气森森",
   "src": "魔殿",
   "love": [
    "sumei",
    "moguard",
    "ali"
   ],
   "hate": [
    "elder",
    "sister",
    "danlao"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_longxu",
   "n": "龙须糖",
   "cat": "gift",
   "t": "gift",
   "p": 90,
   "d": "龙宫御厨手艺",
   "src": "龙宫",
   "love": [
    "aoxiao",
    "taizi",
    "xiabing"
   ],
   "hate": [
    "lengyue"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_yueguang",
   "n": "月光纱",
   "cat": "gift",
   "t": "gift",
   "p": 1500,
   "d": "织女的边角料",
   "src": "广寒宫",
   "love": [
    "guanghan",
    "lengyue",
    "ali",
    "ruyan"
   ],
   "hate": [
    "farmer"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_zhangben",
   "n": "空白账本",
   "cat": "gift",
   "t": "gift",
   "p": 40,
   "d": "纸质极好，适合记仇",
   "src": "市场",
   "love": [
    "xianguan",
    "suanpan",
    "zhuiming",
    "merchant"
   ],
   "hate": [
    "mentor",
    "ali"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_jianpei",
   "n": "古剑穗",
   "cat": "gift",
   "t": "gift",
   "p": 650,
   "d": "系在剑上，挥剑时会叮当响",
   "src": "剑冢",
   "love": [
    "mentor",
    "ruyan",
    "xiaoyi",
    "sister"
   ],
   "hate": [
    "merchant"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_huaduo",
   "n": "野花一束",
   "cat": "gift",
   "t": "gift",
   "p": 5,
   "d": "路边摘的，诚意满满",
   "src": "任意野外采集",
   "love": [
    "cuihua",
    "mom",
    "lost",
    "aoxiao"
   ],
   "hate": [
    "lengyue",
    "elder"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_leiguo",
   "n": "雷击木果",
   "cat": "gift",
   "t": "gift",
   "p": 400,
   "d": "被雷劈过的果子，酥麻可口",
   "src": "雷部",
   "love": [
    "leigong",
    "dianmu",
    "aoxiao"
   ],
   "hate": [
    "guzhu"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_tiezhi",
   "n": "烫金请柬",
   "cat": "gift",
   "t": "gift",
   "p": 200,
   "d": "送出即表示郑重邀约（婚配用）",
   "src": "3.8.3 族产·书坊",
   "love": [
    "*"
   ],
   "hate": [
    "*"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_ganggu",
   "n": "钢骨扇",
   "cat": "gift",
   "t": "gift",
   "p": 380,
   "d": "扇面题字：钱债两清",
   "src": "奸商·钱多多",
   "love": [
    "xiaoyi",
    "xiaoyao",
    "shuoshu"
   ],
   "hate": [
    "mom"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_tanghulu",
   "n": "冰糖葫芦",
   "cat": "gift",
   "t": "gift",
   "p": 8,
   "d": "一串六颗，酸酸甜甜",
   "src": "桃花村",
   "love": [
    "kin",
    "lost",
    "aoxiao",
    "guizu"
   ],
   "hate": [
    "danlao"
   ],
   "dLove": 22,
   "dLike": 10,
   "dHate": -12,
   "sup": false
  },
  {
   "id": "i40_duanjian",
   "n": "断剑残片",
   "cat": "quest",
   "t": "quest",
   "p": 0,
   "d": "落魄剑仙断剑的另一半。交给他，解开他的秘密②",
   "src": "天庭仓库（追问 pf_mentor_sword 后）",
   "use": "sec:mentor:1",
   "quest": 1,
   "sup": false
  },
  {
   "id": "i40_weibali",
   "n": "第九尾当票",
   "cat": "quest",
   "t": "quest",
   "p": 0,
   "d": "鬼市当票，凭此赎回阿离的第九尾（需 5000 灵石）",
   "src": "阿离秘密①后鬼市",
   "use": "sec:ali:1",
   "quest": 1,
   "sup": false
  },
  {
   "id": "i40_nilin",
   "n": "逆鳞",
   "cat": "quest",
   "t": "quest",
   "p": 0,
   "d": "敖小乐的逆鳞。还给她或交给龙王，二选一",
   "src": "敖小乐秘密②",
   "use": "sec:aoxiao:1",
   "quest": 1,
   "sup": false
  },
  {
   "id": "i40_yuejie",
   "n": "旧借据",
   "cat": "quest",
   "t": "quest",
   "p": 0,
   "d": "娘当年画押的借据原件",
   "src": "娘秘密①后·家中旧箱",
   "use": "debtSeed",
   "quest": 1,
   "sup": false
  },
  {
   "id": "i40_lingpai",
   "n": "无名灵牌",
   "cat": "quest",
   "t": "quest",
   "p": 0,
   "d": "写着你名字的灵牌。守墓人说：上辈子的你。",
   "src": "守墓人秘密①",
   "use": "flag:pf_lingpai",
   "quest": 1,
   "sup": false
  },
  {
   "id": "i40_diya",
   "n": "灵脉抵押书",
   "cat": "quest",
   "t": "quest",
   "p": 0,
   "d": "青云宗把灵脉抵押给天道的凭据",
   "src": "掌门秘密①后·藏经阁",
   "use": "sec:elder:1",
   "quest": 1,
   "sup": false
  },
  {
   "id": "i40_jiacheng",
   "n": "假秤砣",
   "cat": "quest",
   "t": "quest",
   "p": 0,
   "d": "钱多多的作弊秤砣，拿去举报或敲诈",
   "src": "钱多多秘密①",
   "use": "flag:pf_qian_weight",
   "quest": 1,
   "sup": false
  },
  {
   "id": "i40_bingxin",
   "n": "冰心玉",
   "cat": "quest",
   "t": "quest",
   "p": 0,
   "d": "冷月宫冰封之人的心头玉",
   "src": "冷月秘密①后·冷月宫",
   "use": "sec:lengyue:1",
   "quest": 1,
   "sup": false
  },
  {
   "id": "i40_jianzhong",
   "n": "剑冢誓书",
   "cat": "quest",
   "t": "quest",
   "p": 0,
   "d": "柳如烟立下的誓书，三剑之约的凭据",
   "src": "柳如烟秘密①",
   "use": "flag:ruyan_duel",
   "quest": 1,
   "sup": false
  },
  {
   "id": "i40_huangzhang",
   "n": "坏账名单",
   "cat": "quest",
   "t": "quest",
   "p": 0,
   "d": "记账童子三百年抹掉的账，被讨债司发现会出大事",
   "src": "仙官秘密①",
   "use": "sec:xianguan:1",
   "quest": 1,
   "sup": false
  },
  {
   "id": "i40_cuihuabao",
   "n": "七个荷包",
   "cat": "quest",
   "t": "quest",
   "p": 0,
   "d": "翠花绣的七个荷包，每个都绣着你的名字",
   "src": "翠花秘密①（aff≥120后赠予）",
   "use": "aff:cuihua:15",
   "quest": 1,
   "sup": false
  },
  {
   "id": "i40_lianhun",
   "n": "联姻帖",
   "cat": "quest",
   "t": "quest",
   "p": 0,
   "d": "某修真世家递来的婚帖（3.8.3 婚配入口）",
   "src": "家族事件",
   "use": "clanMatch",
   "quest": 1,
   "sup": false
  },
  {
   "id": "i40_zupu_old",
   "n": "残破古族谱",
   "cat": "quest",
   "t": "quest",
   "p": 0,
   "d": "记载你家祖上曾是修真世家，家族等级+1（一次性）",
   "src": "守墓人/秘境",
   "use": "clanLv+1",
   "quest": 1,
   "sup": false
  },
  {
   "id": "i40_jiezhai_qi",
   "n": "天道借债契",
   "cat": "quest",
   "t": "quest",
   "p": 0,
   "d": "祖传债务的原始契约。上面的担保人签名……是你",
   "src": "主线后期/讨债司",
   "use": "flag:i40_contract",
   "quest": 1,
   "sup": false
  },
  {
   "id": "i40_ditu",
   "n": "藏宝残图",
   "cat": "quest",
   "t": "quest",
   "p": 0,
   "d": "四块拼成一张，指向一处族产「灵矿」",
   "src": "秘境/路遇×4",
   "use": "clanProp:kuang",
   "quest": 1,
   "sup": false
  }
 ],
 "typeTags": {
  "kin": "娘/翠花/王大爷/道侣/子嗣",
  "*": "所有NPC：请柬无爱憎，按 aff≥60 时 +15，否则 +3"
 },
 "npcPrefs": {
  "note": "兼容 Talk.prefs：旧最爱仍 +22；新表 love +22 / like(未列出) +8~12 / hate -12，每NPC每月送礼≤1次"
 }
}
```

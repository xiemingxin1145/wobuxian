# 《我不仙》3.8.3 家族深化（研究员设计稿 · v41）

> 新模块 `www/js/clan41.js`，包裹 fam37（不改 fam37.js 本体）。存档 `G.clan41` 惰性兜底，不升 `G.v`；`G.fam37 / G.heir / G.apprentice` 字段语义不动。审核：奥拉夫。
> 版本规划：3.8.0 人物详情 → 3.8.1 称号 → 3.8.2 道具 → **3.8.3 家族深化**。

## 1. 现有代码事实（fam37.js / legacy26.js）
- `G.fam37 = { v, sp, kids:[], rate, log:[], ev }`；`kid = { n, lg, born, age, sp, nodes:{} }`，`KID_MAX = 4`，年末 `FAM37.famYear()`：有道侣时 30% 生子，`grow()` 按 `T.fam.grow` 节点成长。
- 道侣：`FAM37.canMarry(G,id)` 要求 `T.fam.spouse[id]`（sumei ruyan lengyue cuihua sister jh_yangui）、aff≥100、`relOf(id)`（L.rel）≥60；`SP_LG` 给子嗣遗传灵根，`inheritLg` 决定 same/up/down。
- `F.rate`：家族对天道利率的附加；`G.sectRel['a|b']`（−100..100，键为两宗 id 字典序拼接）；`G.heir`（legacy26，对象或 null）。
- 家事事件：`T.fam.events`（f37_ill f37_fight f37_gift f37_debt f37_book f37_feast f37_peach f37_egg），格式 `{id,t,ch:[[文案, eff]]}`，`FAM37.applyEff` 支持字段：**stone（×(1+大境界)）item aff(@sp) karma fight debt rate sectRel fb33**。
- 子嗣**没有境界字段**——本版新增 `kid.realm/kid.stage`（见 §2）。

## 2. 存档
```js
G.clan41 = {
  v: 1, on: 0,            // 是否已立族
  name: '',               // 族名 = G.surname + '氏'
  lv: 1, rep: 0,          // 家族等级 1–10、声望
  pop: 0,                 // 额外族人（投奔/联姻入族），总人口 = 1 + (sp?1:0) + kids.length + pop
  props: { [propId]: lv }, // 族产及等级 1–3
  rules: [ruleId],        // 已选族规（槽位见 lv 表）
  fams: { [famId]: rel },  // 与 NPC 家族关系 −100..100
  wed: [ { kid: idx, fam, n, lg, y } ], // 子嗣婚配记录
  ev: { [evId]: n }, yr: 0, log: []
};
// kid 追加：realm(0)/stage(0)/xp/mg(3.8.0命格)/wed(婚配idx)/hurt
```
- 立族条件：持有 `i40_jiapu`（3.8.2）或已有道侣/子嗣≥1 → 族产面板出现「开族立谱」。
- 子嗣境界：16 岁起每年 xp += 40×(lg.mult)×(1+族修炼加成)，满 `REALMS[r].need/10` 升小层，最高到玩家大境界 −1（避免子嗣反超）。

## 3. 家族等级（1–10）
声望 `rep` + 玩家大境界 `realm`（0凡1练2筑3金4元5化6渡）+ 附加条件。全部可达（最高要求渡劫/渡劫圆满或有传人）。

| Lv | 名 | 声望 | 玩家境界≥ | 附加条件 | 族规槽 | 族产槽 | 年产倍率 | 全族修炼 |
|---|---|---|---|---|---|---|---|---|
| 1 | 寒门 | 0 | 0 | 立族：持有空白族谱 i40_jiapu 或 有道侣/子嗣≥1 | 1 | 3 | ×1.0 | +0.5% |
| 2 | 小户 | 100 | 1 | 族人≥2 | 1 | 4 | ×1.05 | +1.0% |
| 3 | 乡绅 | 300 | 2 | 族人≥3，筑基 | 1 | 5 | ×1.1 | +1.5% |
| 4 | 望族 | 700 | 2 | 族产≥2 | 2 | 6 | ×1.15 | +2.0% |
| 5 | 豪门 | 1500 | 3 | 金丹，族人≥4 | 2 | 7 | ×1.2 | +2.5% |
| 6 | 世家 | 3000 | 3 | 族产≥3，任一子嗣筑基（kid 需 3.8.3 新增 realm） | 2 | 8 | ×1.25 | +3.0% |
| 7 | 名门 | 6000 | 4 | 元婴，联姻≥1 | 2 | 9 | ×1.3 | +3.5% |
| 8 | 大族 | 12000 | 5 | 化神，族产≥5 | 3 | 10 | ×1.35 | +4.0% |
| 9 | 仙族 | 25000 | 6 | 渡劫，族人≥6 | 3 | 10 | ×1.4 | +4.5% |
| 10 | 万古仙族 | 50000 | 6 | 渡劫圆满或 G.heir 存在，声望≥5000 | 3 | 10 | ×1.45 | +5.0% |

每级给全族（玩家本人也吃）修炼 +0.5%/级（cult，走 `Sys.bonus` 包装，✅ 可实现）。

声望来源：族产 +5/处/年；子嗣首次筑基 +50、金丹 +150；联姻 +100；家族事件；称号「一族之长」(v39) 需 Lv≥5。

## 4. 族产（12 种）
购买价、年产、等级需求见 TEXT41.props；可升级到 3 级（升级费 cost×(1+lv)，产出 ×(1+0.5×lv)）。年产在 `Game.yearEnd` 包装里结算，乘家族等级 `yieldMul`、族规与命格（n_jucai +8% / n_pocai −5%）修正。
- 回本：良田 3000 → 150/年 ×1.0 ≈ 20 年；灵矿 12000 → 600 + 矿石 ≈ 15 年；坊市 20000 → 1000±30%。修仙寿元动辄数百年，回本期 15–25 年是有意为之（长线经营感，又不压过斗法收益）。
- 族产获取：花灵石买（需达等级）、地契 `i40_dici`、藏宝残图 `i40_ditu`、事件。

## 5. 族规（10 条，带取舍）
每条一个 pro + 一个 con，见 TEXT41.rules；槽位 Lv1:1 / Lv4:2 / Lv8:3（宗祠 +1、祖训竹简 +1，硬上限 4）。更换族规：每 5 年一次，换规当年声望 −50。互斥：`moxiu` ↔ `renhou`，`zhongshang` ↔ `yinshi`。

## 6. 婚配
- **玩家本人**：仍走 `FAM37.marry`（命名 NPC 道侣，只能 1 个 `sp`）。新增「世家联姻」：与 8 个 NPC 家族之一联姻获得非命名配偶，规则同 sp（占用 sp 位），配偶灵根取对方 `wantLg` 中随机一个 → 喂给 `SP_LG`（需包 `inheritLg` 的第二参）。
- **子嗣**：≥16 岁可婚配；成功率与聘礼公式见 TEXT41.marry；成功后 `pop+1`、`fams[fam]+30`、`rep+100`；联姻家族每年 30% 送礼（灵石 200×对方lv 或礼物 i40_*）。孙辈：配偶入族后该子嗣每年 15% 得一孙（计入 pop，不进 kids，避免 KID_MAX 冲突）。
- NPC 家族 8 个（TEXT41.fams），各有门槛：如东海敖氏 Lv8、魔都苏氏要 karma≤−20、青云云氏要青云 sectRel≥40（键需按 `'qingyun|x'` 规则取，取玩家宗门相关最大值）。

## 7. 家族事件（21 条）
- 每年年末 1 次（与 fam37 家事并行：fam37 原事件仍按原逻辑，本模块额外 ≤1 条，立族后才触发；同一事件 5 年内不重复）。
- `cond`：`kids`（有子嗣）`kids2`（≥2）`kidAge16` `sp` `pop3`/`pop4`（人口≥3/4）`lv5` `prop:x`（有该族产）。
- 选项第三元素（如 `"rule:tieqi"`）= 该选项需已选该族规，否则 🔒。
- 效果：直接交给 `FAM37.applyEff` 的字段（✅ stone item aff karma fight debt rate sectRel）；其余为本模块新字段（❌ 需 clan41 自行结算）：`rep pop prop propDmg famRel match kidBrk heir clanCult hpPct luck roll`。
  - 注意 `stone` 在 applyEff 里 ×(1+大境界)，事件数值按凡人基准写。

## 8. 效果字段支持度汇总
| 字段 | 状态 |
|---|---|
| stone item aff karma fight debt rate sectRel | ✅ FAM37.applyEff |
| petexp | ✅ Game.apply case 'petexp' |
| cult（家族等级加成） | ✅ 可经 Sys.bonus 包装 |
| rep pop prop propDmg famRel match kidBrk heir clanCult ruleSlot yield var | ❌ **新增**，clan41 内结算 |
| compAtk（武馆/尚武） | ❌ **代码不支持**伙伴/族人参战加成；族人目前不参战，先只作用于道侣伙伴 |
| life（洞天寿元+5%） | ⚠️ 需包 `Game.lifeMax`（mingge33 已有包裹先例） |
| luck | ❌ 气运临时加成无通用入口，先改为 `flag:i40_luck`（复用 3.8.2 转运珠逻辑） |
| heir | ⚠️ 写 `G.heir = {n, lg, from:'clan41'}`，需确认 legacy26 对 heir 结构的读取（end30 只判真值） |
| KID_MAX 4→6（族规开枝） | ⚠️ 需改为读 `FAM37.KID_MAX` 的 getter 或模块加载时赋值 |

## 9. Hooks
1. 包 `Game.yearEnd`（fam37 之后）：族产结算 → 子嗣境界成长 → 族规年效 → 家族事件 → 等级检查 → `FAM37.news` 写大事记（复用 JH34 新闻）。
2. 包 `UI.p_fam37`：顶部加「🏯 家族」按钮 → `UI.panel('clan41')`，6 个页签（TEXT41.ui.tabs）。
3. 包 `FAM37.birth`：族规 `kaizhi` 概率加成、3.8.0 命格继承。
4. 包 `Sys.bonus('cult')`：家族等级 +0.5%/级。
5. 包 `Game.newLife`（轮回）：`G.clan41` 保留为「前世家族」只读档案（`Game.meta.clan41Best = lv`），新一世重置；Lv≥5 的前世家族给新一世初始灵石 500×lv（可选，奥拉夫定夺）。
6. DevPanel 页签：立族、加声望、给族产、触发指定事件。

## 10. 验收清单（奥拉夫）
- [ ] 老档无 `G.clan41` 正常运行；未立族时 fam37 面板与 3.7.x 一致。
- [ ] 10 级门槛全部可达（境界条件只用 realm 0–6，无小层不可达条件）。
- [ ] 族产年产正确乘 yieldMul、族规、命格；升级封顶 3。
- [ ] 族规槽位与互斥生效；5 年冷却。
- [ ] 子嗣境界不超过玩家大境界 −1；婚配 ≥16 岁；孙辈只计入 pop。
- [ ] 世家联姻占用 sp，与 FAM37.marry 互斥；SP_LG 正确取对方灵根。
- [ ] 家族事件每年 ≤1，5 年不重复，cond 不满足不出；🔒选项不可选。
- [ ] `stone` 效果经 applyEff 后 ×(1+大境界) 符合预期数量级。
- [ ] 所有 ❌ 字段有实现或已在 UI 隐藏。
- [ ] TEXT41 JSON.parse 通过。

## 11. 文本包 TEXT41
```json
{
 "lv": [
  {
   "lv": 1,
   "n": "寒门",
   "rep": 0,
   "realm": 0,
   "d": "立族：持有空白族谱 i40_jiapu 或 有道侣/子嗣≥1",
   "ruleSlots": 1,
   "propSlots": 3,
   "yieldMul": 1.0,
   "fx": {
    "cult": 0.005
   }
  },
  {
   "lv": 2,
   "n": "小户",
   "rep": 100,
   "realm": 1,
   "d": "族人≥2",
   "ruleSlots": 1,
   "propSlots": 4,
   "yieldMul": 1.05,
   "fx": {
    "cult": 0.01
   }
  },
  {
   "lv": 3,
   "n": "乡绅",
   "rep": 300,
   "realm": 2,
   "d": "族人≥3，筑基",
   "ruleSlots": 1,
   "propSlots": 5,
   "yieldMul": 1.1,
   "fx": {
    "cult": 0.015
   }
  },
  {
   "lv": 4,
   "n": "望族",
   "rep": 700,
   "realm": 2,
   "d": "族产≥2",
   "ruleSlots": 2,
   "propSlots": 6,
   "yieldMul": 1.15,
   "fx": {
    "cult": 0.02
   }
  },
  {
   "lv": 5,
   "n": "豪门",
   "rep": 1500,
   "realm": 3,
   "d": "金丹，族人≥4",
   "ruleSlots": 2,
   "propSlots": 7,
   "yieldMul": 1.2,
   "fx": {
    "cult": 0.025
   }
  },
  {
   "lv": 6,
   "n": "世家",
   "rep": 3000,
   "realm": 3,
   "d": "族产≥3，任一子嗣筑基（kid 需 3.8.3 新增 realm）",
   "ruleSlots": 2,
   "propSlots": 8,
   "yieldMul": 1.25,
   "fx": {
    "cult": 0.03
   }
  },
  {
   "lv": 7,
   "n": "名门",
   "rep": 6000,
   "realm": 4,
   "d": "元婴，联姻≥1",
   "ruleSlots": 2,
   "propSlots": 9,
   "yieldMul": 1.3,
   "fx": {
    "cult": 0.035
   }
  },
  {
   "lv": 8,
   "n": "大族",
   "rep": 12000,
   "realm": 5,
   "d": "化神，族产≥5",
   "ruleSlots": 3,
   "propSlots": 10,
   "yieldMul": 1.35,
   "fx": {
    "cult": 0.04
   }
  },
  {
   "lv": 9,
   "n": "仙族",
   "rep": 25000,
   "realm": 6,
   "d": "渡劫，族人≥6",
   "ruleSlots": 3,
   "propSlots": 10,
   "yieldMul": 1.4,
   "fx": {
    "cult": 0.045
   }
  },
  {
   "lv": 10,
   "n": "万古仙族",
   "rep": 50000,
   "realm": 6,
   "d": "渡劫圆满或 G.heir 存在，声望≥5000",
   "ruleSlots": 3,
   "propSlots": 10,
   "yieldMul": 1.45,
   "fx": {
    "cult": 0.05
   }
  }
 ],
 "props": [
  {
   "id": "tian",
   "n": "良田",
   "cost": 3000,
   "d": "灵石+150/年；灵草×2",
   "yield": "stone:150;item:herb:2",
   "lvReq": 1,
   "upMax": 3,
   "upCost": "cost×(1+lv)",
   "upYield": "×(1+0.5×lv)"
  },
  {
   "id": "yaoyuan",
   "n": "药园",
   "cost": 6000,
   "d": "灵草×3、千年灵芝 15%",
   "yield": "item:herb:3;roll:0.15:item:lz:1",
   "lvReq": 2,
   "upMax": 3,
   "upCost": "cost×(1+lv)",
   "upYield": "×(1+0.5×lv)"
  },
  {
   "id": "kuang",
   "n": "灵矿",
   "cost": 12000,
   "d": "灵石+600/年、矿石×2",
   "yield": "stone:600;item:ore:2",
   "lvReq": 3,
   "upMax": 3,
   "upCost": "cost×(1+lv)",
   "upYield": "×(1+0.5×lv)"
  },
  {
   "id": "jiusi",
   "n": "酒坊",
   "cost": 4000,
   "d": "灵石+200/年、老酒×1",
   "yield": "stone:200;item:wine:1",
   "lvReq": 1,
   "upMax": 3,
   "upCost": "cost×(1+lv)",
   "upYield": "×(1+0.5×lv)"
  },
  {
   "id": "shufang",
   "n": "书坊",
   "cost": 5000,
   "d": "族人修炼+3%；10% 得功法卷轴",
   "yield": "clanCult:0.03;roll:0.1:item:scroll:1",
   "lvReq": 2,
   "upMax": 3,
   "upCost": "cost×(1+lv)",
   "upYield": "×(1+0.5×lv)"
  },
  {
   "id": "biaoju",
   "n": "镖局",
   "cost": 8000,
   "d": "灵石+400/年；每年 15% 触发劫镖事件",
   "yield": "stone:400;ev:c41_robbed:0.15",
   "lvReq": 3,
   "upMax": 3,
   "upCost": "cost×(1+lv)",
   "upYield": "×(1+0.5×lv)"
  },
  {
   "id": "dangpu",
   "n": "当铺",
   "cost": 10000,
   "d": "灵石+300/年；天道利息 -2%",
   "yield": "stone:300;rate:-0.02",
   "lvReq": 4,
   "upMax": 3,
   "upCost": "cost×(1+lv)",
   "upYield": "×(1+0.5×lv)"
  },
  {
   "id": "lingchi",
   "n": "灵兽池",
   "cost": 9000,
   "d": "灵宠经验+100/年",
   "yield": "petexp:100",
   "lvReq": 3,
   "upMax": 3,
   "upCost": "cost×(1+lv)",
   "upYield": "×(1+0.5×lv)"
  },
  {
   "id": "wuguan",
   "n": "武馆",
   "cost": 7000,
   "d": "族人参战攻击+3%；声望+30/年",
   "yield": "rep:30;compAtk:0.03",
   "lvReq": 4,
   "upMax": 3,
   "upCost": "cost×(1+lv)",
   "upYield": "×(1+0.5×lv)"
  },
  {
   "id": "citang",
   "n": "宗祠",
   "cost": 15000,
   "d": "声望+80/年；族规可多选 1 条",
   "yield": "rep:80;ruleSlot:1",
   "lvReq": 5,
   "upMax": 3,
   "upCost": "cost×(1+lv)",
   "upYield": "×(1+0.5×lv)"
  },
  {
   "id": "fangshi",
   "n": "坊市铺面",
   "cost": 20000,
   "d": "灵石+1000/年；受市场年景浮动 ±30%",
   "yield": "stone:1000;var:0.3",
   "lvReq": 6,
   "upMax": 3,
   "upCost": "cost×(1+lv)",
   "upYield": "×(1+0.5×lv)"
  },
  {
   "id": "dongtian",
   "n": "洞天福地",
   "cost": 60000,
   "d": "族人修炼+8%，寿元+5%",
   "yield": "clanCult:0.08;life:0.05",
   "lvReq": 8,
   "upMax": 3,
   "upCost": "cost×(1+lv)",
   "upYield": "×(1+0.5×lv)"
  }
 ],
 "rules": [
  {
   "id": "qinxue",
   "n": "勤学",
   "pro": "族人修炼+6%",
   "con": "族产年产-10%"
  },
  {
   "id": "zhongshang",
   "n": "重商",
   "pro": "族产年产+15%",
   "con": "族人修炼-4%，声望-10/年"
  },
  {
   "id": "shangwu",
   "n": "尚武",
   "pro": "族人攻击+5%，劫镖必胜",
   "con": "每年 10% 族人受伤（养伤 1 年）"
  },
  {
   "id": "renhou",
   "n": "仁厚",
   "pro": "karma+2/年，正道宗门 sectRel+2/年",
   "con": "灵石年产-8%"
  },
  {
   "id": "tieqi",
   "n": "铁律",
   "pro": "族人叛离概率归零",
   "con": "好感获取-10%（家里太严）"
  },
  {
   "id": "kaizhi",
   "n": "开枝",
   "pro": "子嗣降生概率+20%，KID_MAX 4→6",
   "con": "每多一名子嗣，年开销+200灵石"
  },
  {
   "id": "lianyin",
   "n": "广结",
   "pro": "婚配成功率+20%",
   "con": "嫁娶聘礼 ×1.5"
  },
  {
   "id": "yinshi",
   "n": "隐世",
   "pro": "家族负面事件-50%",
   "con": "声望增长-50%，不能联姻高于自身等级的家族"
  },
  {
   "id": "moxiu",
   "n": "魔道传家",
   "pro": "族人攻击+8%，魔殿 sectRel+5/年",
   "con": "karma-3/年，正道宗门 sectRel-3/年"
  },
  {
   "id": "haiqian",
   "n": "还债为本",
   "pro": "天道利息-5%",
   "con": "族产 20% 自动拿去还债"
  }
 ],
 "fams": [
  {
   "id": "lin",
   "n": "临安林氏",
   "lv": 3,
   "rule": "qinxue",
   "d": "剑修世家，看重灵根",
   "wantLg": [
    "tian",
    "shuang"
   ]
  },
  {
   "id": "qian",
   "n": "钱塘钱氏",
   "lv": 4,
   "rule": "zhongshang",
   "d": "钱多多的本家，彩礼开价离谱",
   "wantLg": [
    "*"
   ]
  },
  {
   "id": "long",
   "n": "东海敖氏",
   "lv": 8,
   "rule": "shangwu",
   "d": "龙族，只与有龙宫恩情者联姻（flags.boss_dragon 反而减分）",
   "wantLg": [
    "lei",
    "shuang"
   ]
  },
  {
   "id": "su",
   "n": "魔都苏氏",
   "lv": 6,
   "rule": "moxiu",
   "d": "苏魅的远亲，karma≤-20 才看得上你",
   "wantLg": [
    "*"
   ]
  },
  {
   "id": "yun",
   "n": "青云云氏",
   "lv": 5,
   "rule": "tieqi",
   "d": "掌门云中鹤家族，需青云宗 sectRel≥40",
   "wantLg": [
    "san",
    "shuang",
    "tian"
   ]
  },
  {
   "id": "bai",
   "n": "百草白氏",
   "lv": 4,
   "rule": "renhou",
   "d": "药王后人，喜好行善者（karma≥20）",
   "wantLg": [
    "*"
   ]
  },
  {
   "id": "leng",
   "n": "广寒冷氏",
   "lv": 7,
   "rule": "yinshi",
   "d": "冰灵根世家，极难攀附",
   "wantLg": [
    "bing"
   ]
  },
  {
   "id": "wang",
   "n": "桃花王氏",
   "lv": 1,
   "rule": "renhou",
   "d": "王大爷家，门槛低，人实在",
   "wantLg": [
    "*"
   ]
  }
 ],
 "marry": {
  "rate": "base 0.4 + 0.05×(我方lv−对方lv) + 灵根匹配0.15 + 命格n_tianxi 0.15 + 月老红线0.3 + 族规广结0.2，封顶0.9",
  "dowry": "1000×对方lv×(1+0.2×对方lv)灵石；钱氏×2",
  "kidAge": 16,
  "effects": "成婚子嗣：家族人口+1（配偶入族，带对方家族灵根），双方家族 rel+30；联姻家族每年 30% 送礼；离婚 rel−60、声望−200",
  "player": "玩家本人沿用 FAM37.marry（道侣），新增『世家联姻』选项：与 NPC 家族联姻得配偶（非命名NPC，名字由对方家族姓+TEXT37 dis.ming 生成），只能有一个 sp（与 fam37 相同）",
  "lines": {
   "ask": [
    "{fam}的媒人登门：“我家{who}，年方{age}，与贵府{k}正是良配。”",
    "你递上烫金请柬，{fam}家主捋须沉吟。"
   ],
   "yes": [
    "{fam}应下了婚事，聘礼抬了三条街。",
    "“好！从今往后，两家就是一家人——债也是。”"
   ],
   "no": [
    "{fam}家主客气地端起了茶：“送客。”",
    "“贵府门第……再修几年吧。”"
   ]
  }
 },
 "events": [
  {
   "id": "c41_harvest",
   "t": "{prop}今年大丰收，族人请你主持丰收祭。",
   "ch": [
    [
     "主持祭典",
     {
      "stone": -100,
      "rep": 50,
      "karma": 1
     }
    ],
    [
     "收钱就好",
     {
      "stone": 200
     }
    ]
   ]
  },
  {
   "id": "c41_robbed",
   "t": "镖局的镖车在半路被劫，镖师带伤逃回。",
   "ch": [
    [
     "亲自去追",
     {
      "fight": 1,
      "stone": 300
     }
    ],
    [
     "赔钱了事",
     {
      "stone": -400,
      "rep": 20
     }
    ],
    [
     "报官（宗门）",
     {
      "sectRel": 5
     }
    ]
   ],
   "cond": "prop:biaoju"
  },
  {
   "id": "c41_kidfight",
   "t": "{k}与邻家孩子打架，把人家门牙打掉了。",
   "ch": [
    [
     "上门赔罪",
     {
      "stone": -150,
      "karma": 2
     }
    ],
    [
     "护短",
     {
      "rep": -30,
      "karma": -2
     }
    ],
    [
     "让{k}自己去道歉",
     {
      "rep": 20
     }
    ]
   ],
   "cond": "kids"
  },
  {
   "id": "c41_matchmaker",
   "t": "媒婆踏破门槛，三家同时来给{k}说亲。",
   "ch": [
    [
     "挑最有钱的",
     {
      "stone": 500,
      "rep": -20
     }
    ],
    [
     "挑灵根最好的",
     {
      "match": 0.2
     }
    ],
    [
     "孩子还小",
     {}
    ]
   ],
   "cond": "kidAge16"
  },
  {
   "id": "c41_ancestor",
   "t": "清明扫墓，祖坟上冒出一缕青烟。",
   "ch": [
    [
     "上香",
     {
      "karma": 2,
      "rep": 30
     }
    ],
    [
     "请人看风水",
     {
      "stone": -300,
      "luck": 1
     }
    ]
   ]
  },
  {
   "id": "c41_debtor",
   "t": "远房亲戚拖家带口来投奔，说是欠了天道的债躲不下去了。",
   "ch": [
    [
     "收留",
     {
      "karma": 3,
      "stone": -200,
      "pop": 1
     }
    ],
    [
     "给点钱打发",
     {
      "stone": -100
     }
    ],
    [
     "关门",
     {
      "karma": -2
     }
    ]
   ]
  },
  {
   "id": "c41_split",
   "t": "两房族人为分家产吵得不可开交。",
   "ch": [
    [
     "一碗水端平",
     {
      "stone": -300,
      "rep": 20
     }
    ],
    [
     "按族规办",
     {
      "rep": 40
     },
     "rule:tieqi"
    ],
    [
     "随他们去",
     {
      "rep": -50
     }
    ]
   ],
   "cond": "pop3"
  },
  {
   "id": "c41_genius",
   "t": "族学里冒出一个神童，先生说百年难遇。",
   "ch": [
    [
     "重点栽培",
     {
      "stone": -500,
      "clanCult": 0.02
     }
    ],
    [
     "送去宗门",
     {
      "sectRel": 10,
      "rep": 60
     }
    ]
   ],
   "cond": "prop:shufang"
  },
  {
   "id": "c41_fire",
   "t": "{prop}半夜走水。",
   "ch": [
    [
     "冲进去救",
     {
      "karma": 3,
      "hpPct": -0.2
     }
    ],
    [
     "只救账本",
     {
      "stone": -200
     }
    ],
    [
     "认了",
     {
      "propDmg": 1
     }
    ]
   ]
  },
  {
   "id": "c41_marryrival",
   "t": "{fam}与仇家联姻，扬言要压你一头。",
   "ch": [
    [
     "送重礼拉拢",
     {
      "stone": -800,
      "famRel": 20
     }
    ],
    [
     "正面硬刚",
     {
      "fight": 1,
      "rep": 80
     }
    ],
    [
     "无视",
     {}
    ]
   ]
  },
  {
   "id": "c41_tiandao",
   "t": "天道讨债司派人来查族产：“家大业大，利息得涨。”",
   "ch": [
    [
     "交保护费",
     {
      "stone": -600
     }
    ],
    [
     "据理力争",
     {
      "rate": 0.02,
      "rep": 30
     }
    ],
    [
     "把人打出去",
     {
      "fight": "tianbing",
      "debt": 2000,
      "rep": 100
     }
    ]
   ]
  },
  {
   "id": "c41_spouse_gift",
   "t": "{sp}的娘家送来年礼。",
   "ch": [
    [
     "回礼",
     {
      "stone": -200,
      "aff": {
       "@sp": 10
      }
     }
    ],
    [
     "收下",
     {
      "aff": {
       "@sp": -3
      },
      "stone": 300
     }
    ]
   ],
   "cond": "sp"
  },
  {
   "id": "c41_feast",
   "t": "家族百年宴，四方宾客云集。",
   "ch": [
    [
     "大办",
     {
      "stone": -2000,
      "rep": 300
     }
    ],
    [
     "小办",
     {
      "stone": -500,
      "rep": 80
     }
    ],
    [
     "不办",
     {
      "rep": -50
     }
    ]
   ],
   "cond": "lv5"
  },
  {
   "id": "c41_traitor",
   "t": "族中有人勾结外人，偷了族谱副本。",
   "ch": [
    [
     "清理门户",
     {
      "rep": 50,
      "karma": -1,
      "pop": -1
     }
    ],
    [
     "网开一面",
     {
      "karma": 2,
      "rep": -30
     }
    ]
   ],
   "cond": "pop4"
  },
  {
   "id": "c41_beggar",
   "t": "一个老乞丐在宗祠前坐了三天，说他是你家老祖。",
   "ch": [
    [
     "请进门",
     {
      "karma": 3,
      "roll": "0.3:item:i40_zupu_old:1"
     }
    ],
    [
     "赶走",
     {
      "karma": -1
     }
    ]
   ]
  },
  {
   "id": "c41_flood",
   "t": "大水冲了良田。",
   "ch": [
    [
     "赈济佃户",
     {
      "stone": -400,
      "karma": 4,
      "rep": 50
     }
    ],
    [
     "趁机低价收地",
     {
      "stone": -200,
      "karma": -4,
      "prop": "tian"
     }
    ]
   ],
   "cond": "prop:tian"
  },
  {
   "id": "c41_kidbrk",
   "t": "{k}闭关冲击瓶颈，求你护法。",
   "ch": [
    [
     "亲自护法",
     {
      "kidBrk": 0.2
     }
    ],
    [
     "给丹药",
     {
      "item": {
       "zjd": -1
      },
      "kidBrk": 0.3
     }
    ],
    [
     "让他自己来",
     {}
    ]
   ],
   "cond": "kids"
  },
  {
   "id": "c41_heir",
   "t": "族老们催你立下继承人。",
   "ch": [
    [
     "立长子",
     {
      "heir": "eldest",
      "rep": 30
     }
    ],
    [
     "立灵根最好者",
     {
      "heir": "bestLg"
     }
    ],
    [
     "再看看",
     {
      "rep": -10
     }
    ]
   ],
   "cond": "kids2"
  },
  {
   "id": "c41_alliance",
   "t": "{fam}提议两族结盟，共抗魔患。",
   "ch": [
    [
     "结盟",
     {
      "famRel": 30,
      "sectRel": 5
     }
    ],
    [
     "婉拒",
     {}
    ]
   ]
  },
  {
   "id": "c41_mine",
   "t": "灵矿挖出一块会说话的石头：“放我出去，我给你指个大矿。”",
   "ch": [
    [
     "放它走",
     {
      "karma": 2,
      "roll": "0.5:stone:3000"
     }
    ],
    [
     "卖给鬼市",
     {
      "stone": 1500,
      "karma": -1
     }
    ],
    [
     "做成镇族之宝",
     {
      "rep": 200
     }
    ]
   ],
   "cond": "prop:kuang"
  },
  {
   "id": "c41_lifeend",
   "t": "族中最年长的老人寿元将尽，想再见你一面。",
   "ch": [
    [
     "回去送终",
     {
      "karma": 3,
      "rep": 40
     }
    ],
    [
     "寄一封信",
     {
      "karma": 1
     }
    ]
   ],
   "cond": "pop3"
  }
 ],
 "rep": {
  "src": "族产年产：rep+5/处；族人筑基+50、金丹+150（一次性）；联姻+100；事件见各条",
  "decay": "不衰减"
 },
 "ui": {
  "tabs": [
   "概览",
   "族产",
   "族规",
   "婚配",
   "族谱",
   "大事记"
  ],
  "lvUp": "{clan}晋为「{n}」！祠堂的牌匾换了新漆。",
  "noProp": "尚无族产。地契可在市场拍卖或事件中获得。"
 }
}
```

# 《我不仙》3.8.1 称号系统扩展（研究员设计稿 · v39）

> 新模块 `www/js/title39.js`：`TITLES.push(...)` 追加（与 tujian33/worldboss33 同一惯例），不改 systems21.js 本体，存档惰性兜底，不升 `G.v`。审核：奥拉夫。
> 版本规划：3.8.0 人物详情 → **3.8.1 称号** → 3.8.2 道具 → 3.8.3 家族。

## 1. 现有代码事实
- `TITLES`（systems21.js:51）已有 14 个 + tujian33 `laolai` + worldboss33 `fanxiang` = **16 个**。字段 `{id,n,d,ok:G=>bool,fx:{}}`。
- 佩戴：`G.title`（默认 `'debtor'`），**本来就只能佩戴 1 个**；`Sys.title()`、`Sys.bonus(k)` = 称号 fx[k] + 坐骑 fx[k]。`Sys.bonus` 目前只被读取 `atk/def/hp/crit/cult/spd` 6 个键。
- 另有 `G.titles` 数组（content23 推入「李欠欠的担保人」字符串）——是旧的纯文字称号，**与 TITLES 不互通**。本版把它兼容：面板「杂项」行展示 `G.titles` 字符串，不给加成。
- 已占用 id：debtor xiaobi qingli baizhan shalu longgong panguan shouwang danzong juanzhong yihua tiandi xianyuan qiangzhe laolai fanxiang。新 id 一律 `t39_` 前缀。
- 可用统计：`G.realm/G.stage`、`G.karma`、`G.killsTotal`、`G.stone`、`G.debt`、`G.sect/G.sectRank/G.contrib/G.sectLeader`、`G.pets.length`、`G.dis36.length`、`G.apprentice`、`G.fam37.kids/sp`、`G.heir`、`Game.meta.endings`、`Game.meta.lives`、`G.npc37.ev`（路遇事件计数）、`G.npc37.rel`、`G.aff`、`G.alchCount`、`G.fishCount`、`G.giftCount`、`G.bosses`、`G.tournWins`、`G.fb33`、`G.mount/G.mounts`。

## 2. 规则
1. **佩戴**：只能 1 个（沿用 `G.title`）。新称号 fx 只用 6 个已支持键，单项 ≤ +6%，传说级可两项合计 ≤ 8%。
2. **收藏被动**（新）：每拥有 1 个称号（含旧 16 个），修炼 +0.25%，**封顶 +5%**（20 个封顶）；拥有 30 个起再给气血 +2%（一次性门槛）。实现：包 `Sys.bonus`，`k==='cult'` 时加 `min(0.05, 0.0025×n)`。`Sys.titleCount()` 已存在可直接用（每次遍历 ok()，需缓存：年末/面板打开时刷新到 `G.t39.cnt`）。
3. **获取提示**：首次满足条件时 toast「获得称号「xx」」并写 `G.t39.got[id]=year`（用于新称号红点；判定仍走 ok()，丢失条件后**不收回**，靠 got 兜底——ok 改为 `ok(G)||!!G.t39.got[id]`）。
4. **NPC 反应**：玩家佩戴称号时，与 NPC 对话首句 25% 概率替换为 TEXT39.react 中的反应（按 NPC 类型：`good` 正道/`evil` 魔道/`merchant` 商/`debt` 讨债司/`kin` 家人/`any`）。每个 NPC 每年最多 1 次。部分称号带 `affMod`：佩戴时与该类 NPC 送礼好感 ±（**代码不支持**，需包 talk.js 送礼处）。

### 存档
```js
G.t39 = { v:1, got:{ [id]: year }, cnt: 0, seenReact: { [npcId]: year }, newDot: 0 }
```

### NPC 类型映射（新表 NPC_TYPE39，写死）
good: elder sister xiaoyi danlao mentor mentor2 guzhu yaopu ruyan lengyue；evil: sumei moguard ali；merchant: merchant sanniang caishen guolucai；debt: xianguan zhuiming suanpan tianbing baiwuchang；kin: mom cuihua farmer 及 G.fam37.sp、子嗣；其余 any。

## 3. 效果字段支持度
| fx 键 | 支持 |
|---|---|
| atk def hp crit cult spd | ✅ Sys.bonus 已读 |
| luck（气运，事件率） | ❌ **不支持**，本表不用 |
| affMod（按类型送礼加减） | ❌ **不支持**，需包 Talk 送礼 |
| priceMod（商店价格） | ❌ **不支持**，需包商店购买价；本表 2 个称号用到，未实现前只显示文字 |
| debtRate | ⚠️ 仅 fam37 `F.rate` 有，需额外接；本表 1 个用到 |

## 4. Hooks
1. `title39.js` 载入时 `TITLES.push(...TEXT39.titles.map(compile))`，cond 是受限表达式字符串，用 `new Function('G','M','return '+cond)` 编译（M=Game.meta），try/catch 返回 false。
2. 包 `Game.yearEnd`：刷新 `cnt`、发新称号 toast。
3. 包 `Sys.bonus`：收藏被动。
4. 包对话首句（talk.js `Talk.open` 或 `UI.say` 前）：反应台词。
5. ui21 称号面板：分组标签（境界/善恶/战斗/财富/宗门/伙伴/家族/结局/江湖/杂项），显示收藏进度「x/56 · 修炼+y%」。
6. 3.8.0 详情面板头部显示 NPC 自己的称号：命名 NPC 固定称号见 TEXT39.npcTitle（纯展示）。

## 5. 验收清单（奥拉夫）
- [ ] 新增 40 个 id 全部 `t39_` 前缀，不与旧 16 个冲突；总数 56。
- [ ] 所有 cond 只用实际存在的字段；境界条件只用 realm 0–7 / stage 0–3（无「练气5层」）。
- [ ] 每个 cond 在空老档（字段缺失）下返回 false 不抛错。
- [ ] 一次只佩戴一个；收藏被动封顶 5%，30 个以上额外 hp+2%。
- [ ] 单称号 fx 合计 ≤ 8%；标 ❌ 的键未实现前不生效、文案注明「（待开放）」。
- [ ] 反应台词每 NPC 每年 ≤1 次，25% 触发。
- [ ] 获得后条件丢失不收回（got 兜底）。
- [ ] TEXT39 JSON.parse 通过。

## 6. 文本包 TEXT39
`g` = 分组；`cond` = JS 表达式（G=存档，M=Game.meta）；`fx` = 佩戴加成。

```json
{
  "collect": {"per": 0.0025, "cap": 0.05, "bigAt": 30, "bigFx": {"hp": 0.02}},
  "titles": [
    {"id": "t39_lianqi", "n": "入道者", "g": "境界", "d": "踏入练气", "cond": "G.realm>=1", "fx": {"cult": 0.01}},
    {"id": "t39_zhuji", "n": "筑基修士", "g": "境界", "d": "筑基圆满", "cond": "G.realm>2||(G.realm===2&&G.stage>=3)", "fx": {"def": 0.02}},
    {"id": "t39_jindan", "n": "金丹真人", "g": "境界", "d": "结成金丹", "cond": "G.realm>=3", "fx": {"hp": 0.03}},
    {"id": "t39_yuanying", "n": "元婴老祖", "g": "境界", "d": "元婴中期", "cond": "G.realm>4||(G.realm===4&&G.stage>=1)", "fx": {"atk": 0.03}},
    {"id": "t39_huashen", "n": "化神尊者", "g": "境界", "d": "化神后期", "cond": "G.realm>5||(G.realm===5&&G.stage>=2)", "fx": {"cult": 0.04}},
    {"id": "t39_dujie", "n": "渡劫大能", "g": "境界", "d": "踏入渡劫", "cond": "G.realm>=6", "fx": {"atk": 0.03, "def": 0.03}},
    {"id": "t39_laofanren", "n": "老凡人", "g": "境界", "d": "凡人身活过 60 岁", "cond": "G.realm===0&&G.age>=60", "fx": {"hp": 0.04}},
    {"id": "t39_shanren", "n": "大善人", "g": "善恶", "d": "善恶 ≥ 30", "cond": "G.karma>=30", "fx": {"def": 0.03}, "affMod": {"good": 2, "evil": -2}},
    {"id": "t39_shengren", "n": "活菩萨", "g": "善恶", "d": "善恶 ≥ 80", "cond": "G.karma>=80", "fx": {"hp": 0.05}, "affMod": {"good": 4, "evil": -4}},
    {"id": "t39_eren", "n": "恶名在外", "g": "善恶", "d": "善恶 ≤ -30", "cond": "G.karma<=-30", "fx": {"atk": 0.03}, "affMod": {"evil": 2, "good": -2}},
    {"id": "t39_mojun", "n": "人间魔君", "g": "善恶", "d": "善恶 ≤ -80", "cond": "G.karma<=-80", "fx": {"atk": 0.05, "crit": 0.01}, "affMod": {"evil": 4, "good": -4}},
    {"id": "t39_zhongyong", "n": "和稀泥", "g": "善恶", "d": "修至金丹且善恶在 -5~5 之间", "cond": "G.realm>=3&&Math.abs(G.karma||0)<=5", "fx": {"spd": 0.03}},
    {"id": "t39_qianzhan", "n": "千人斩", "g": "战斗", "d": "累计击败 1000 敌人", "cond": "(G.killsTotal||0)>=1000", "fx": {"crit": 0.03}},
    {"id": "t39_wanzhan", "n": "万人屠", "g": "战斗", "d": "累计击败 5000 敌人", "cond": "(G.killsTotal||0)>=5000", "fx": {"atk": 0.06}},
    {"id": "t39_slime", "n": "史莱姆克星", "g": "战斗", "d": "击败讨债史莱姆 200 只", "cond": "((G.kills||{}).slime||0)>=200", "fx": {"spd": 0.02}},
    {"id": "t39_bisai", "n": "擂台常胜", "g": "战斗", "d": "比武胜 5 场", "cond": "(G.tournWins||0)>=5", "fx": {"crit": 0.02}},
    {"id": "t39_baoxiang", "n": "暴发户", "g": "财富", "d": "持有灵石 ≥ 10 万", "cond": "(G.stone||0)>=100000", "fx": {"def": 0.02}, "priceMod": -0.03},
    {"id": "t39_shoufu", "n": "三界首富", "g": "财富", "d": "持有灵石 ≥ 100 万", "cond": "(G.stone||0)>=1000000", "fx": {"hp": 0.03, "def": 0.03}, "priceMod": -0.05},
    {"id": "t39_qiongguang", "n": "穷光蛋", "g": "财富", "d": "金丹以上却身无分文（灵石 < 10）", "cond": "G.realm>=3&&(G.stone||0)<10", "fx": {"spd": 0.04}},
    {"id": "t39_laolai2", "n": "资深老赖", "g": "财富", "d": "天道欠款 ≥ 50 万", "cond": "(G.debt||0)>=500000", "fx": {"spd": 0.03}},
    {"id": "t39_qingzhai", "n": "无债一身轻", "g": "财富", "d": "筑基以上且欠款清零", "cond": "G.realm>=2&&(G.debt||0)<=0", "fx": {"cult": 0.04}, "debtRate": -0.02},
    {"id": "t39_dizi", "n": "宗门砥柱", "g": "宗门", "d": "宗门贡献 ≥ 5000", "cond": "!!G.sect&&(G.contrib||0)>=5000", "fx": {"def": 0.03}},
    {"id": "t39_zhangmen", "n": "一派之主", "g": "宗门", "d": "成为宗主", "cond": "!!G.sectLeader", "fx": {"atk": 0.03, "hp": 0.03}},
    {"id": "t39_pantu", "n": "叛宗者", "g": "宗门", "d": "与任一宗门关系 ≤ -60", "cond": "Object.values(G.sectRel||{}).some(v=>v<=-60)", "fx": {"atk": 0.03}},
    {"id": "t39_hehao", "n": "万宗和事佬", "g": "宗门", "d": "所有宗门关系 ≥ 40（至少 3 条）", "cond": "Object.values(G.sectRel||{}).length>=3&&Object.values(G.sectRel||{}).every(v=>v>=40)", "fx": {"def": 0.04}},
    {"id": "t39_shouwang2", "n": "百兽之王", "g": "伙伴", "d": "拥有 10 只灵兽", "cond": "(G.pets||[]).length>=10", "fx": {"spd": 0.04, "hp": 0.02}},
    {"id": "t39_shifu", "n": "桃李满门", "g": "伙伴", "d": "记名弟子 ≥ 4", "cond": "(G.dis36||[]).length>=4", "fx": {"cult": 0.03}},
    {"id": "t39_zuoqi", "n": "坐骑收藏家", "g": "伙伴", "d": "拥有 5 种坐骑", "cond": "(G.mounts||[]).length>=5", "fx": {"spd": 0.03}},
    {"id": "t39_fubao", "n": "儿女双全", "g": "家族", "d": "子嗣 ≥ 2", "cond": "((G.fam37||{}).kids||[]).length>=2", "fx": {"hp": 0.03}},
    {"id": "t39_sitong", "n": "四世同堂", "g": "家族", "d": "子嗣满 4 人", "cond": "((G.fam37||{}).kids||[]).length>=4", "fx": {"hp": 0.04, "def": 0.02}},
    {"id": "t39_jiazhu", "n": "一族之长", "g": "家族", "d": "家族等级 ≥ 5（3.8.3）", "cond": "((G.clan41||{}).lv||0)>=5", "fx": {"def": 0.04}},
    {"id": "t39_shijia", "n": "修真世家", "g": "家族", "d": "家族等级 10（3.8.3）", "cond": "((G.clan41||{}).lv||0)>=10", "fx": {"cult": 0.04, "hp": 0.04}},
    {"id": "t39_feisheng", "n": "飞升者", "g": "结局", "d": "达成结局「白日飞升」", "cond": "!!(M.endings||{}).ascend", "fx": {"cult": 0.05}},
    {"id": "t39_xintiandao", "n": "新天道", "g": "结局", "d": "达成结局「新任天道」", "cond": "!!(M.endings||{}).newdao", "fx": {"atk": 0.04, "def": 0.04}},
    {"id": "t39_qingzhai2", "n": "诚信修士", "g": "结局", "d": "达成结局「还清尾款」", "cond": "!!(M.endings||{}).paid", "fx": {"def": 0.05}},
    {"id": "t39_baijie", "n": "看遍结局", "g": "结局", "d": "解锁 6 种结局", "cond": "Object.keys(M.endings||{}).length>=6", "fx": {"cult": 0.03, "crit": 0.02}},
    {"id": "t39_jianghu", "n": "江湖百晓生", "g": "江湖", "d": "路遇事件累计 30 次", "cond": "Object.values(((G.npc37||{}).ev)||{}).reduce((a,b)=>a+(+b||0),0)>=30", "fx": {"spd": 0.03}},
    {"id": "t39_chouren", "n": "仇家遍地", "g": "江湖", "d": "5 名 NPC 关系 ≤ -40", "cond": "Object.values(((G.life34||{}).rel)||{}).filter(v=>v<=-40).length>=5", "fx": {"crit": 0.03}},
    {"id": "t39_haoren", "n": "朋友遍天下", "g": "江湖", "d": "10 名 NPC 关系 ≥ 40", "cond": "Object.values(((G.life34||{}).rel)||{}).filter(v=>v>=40).length>=10", "fx": {"hp": 0.04}},
    {"id": "t39_kuixin", "n": "窥心者", "g": "杂项", "d": "用神识/道具揭开 5 个 NPC 秘密（3.8.0）", "cond": "Object.values(((G.pf38||{}).seen)||{}).filter(s=>s.sec&&s.sec.length).length>=5", "fx": {"crit": 0.02, "spd": 0.02}}
  ],
  "react": {
    "t39_shanren": {"good": "“早听说你行善积德，快请进。”", "evil": "“又来一个装好人的。”"},
    "t39_shengren": {"good": "“活菩萨来了！”掌柜把最好的位子让给你。", "evil": "“离我远点，你身上的光刺眼。”", "debt": "“善人也得还钱。不过……利息给你打个九九折。”"},
    "t39_eren": {"good": "对方手按剑柄：“你就是那个恶名在外的？”", "evil": "“兄弟，久仰。”"},
    "t39_mojun": {"any": "四周的人突然都想起来有事要忙。", "kin": "娘叹了口气：“在外面凶就算了，回家给我把脚洗了。”"},
    "t39_shoufu": {"merchant": "“贵客！贵客！今日全场为您打折！”", "debt": "“首富大人，您那笔欠款……方便的话？”", "any": "有人偷偷摸了摸你的衣角，说是沾沾财气。"},
    "t39_qiongguang": {"merchant": "“看看就好，别摸。”", "any": "路人往你手里塞了半个馒头。"},
    "t39_laolai2": {"debt": "讨债司的人当场掏出了小本本。", "merchant": "“概不赊账！尤其是你！”"},
    "t39_qingzhai": {"debt": "“诚信修士！您是我们的榜样。要不要再借点？”"},
    "t39_zhangmen": {"good": "“见过宗主。”对方竟然行了半礼。", "evil": "“一派之主？宗门的账还清了吗？”"},
    "t39_pantu": {"good": "“叛宗之人，不配与我说话。”", "evil": "“欢迎来魔殿，我们这儿不问出身。”"},
    "t39_sitong": {"kin": "娘乐得合不拢嘴：“我也是有曾孙的人了！”", "any": "“这么多娃，奶粉钱够吗？”"},
    "t39_shijia": {"any": "“原来是修真世家的家主，失敬失敬。”", "merchant": "“您家族的生意，我们愿意入股。”"},
    "t39_feisheng": {"any": "“仙人下凡了！”", "debt": "“飞升了也得交尾款哦。”"},
    "t39_xintiandao": {"debt": "讨债司全体起立：“老板好！”", "any": "天上打了个响雷，像是在鞠躬。"},
    "t39_chouren": {"any": "“你仇家那么多，晚上睡得着吗？”", "good": "“少惹事。”"},
    "t39_haoren": {"any": "“哟，老朋友！”对方熟络地拍你肩膀。"},
    "t39_kuixin": {"any": "对方下意识地捂住了脑袋：“别看我！”"},
    "t39_wanzhan": {"any": "对方后退三步：“我、我什么都没做！”"},
    "t39_laofanren": {"kin": "“老来伴，老来伴，修什么仙，喝茶。”", "any": "“老人家，您也来修仙？”"},
    "_default": {"any": "对方瞄了一眼你头顶的称号，表情微妙。"}
  },
  "npcTitle": {
    "mentor": "断剑剑仙", "elder": "青云掌门", "merchant": "市场一霸", "sumei": "魔殿财神", "ali": "九尾（自称八尾）",
    "xianguan": "天庭记账员·三百年工龄", "caishen": "三界债务人", "aoxiao": "离家出走的龙女", "keeper": "守墓三千年", "mom": "全村最凶的娘"
  },
  "toast": {"got": "获得称号「{n}」！", "collect": "称号收藏 {c} 个，修炼 +{p}%"}
}
```

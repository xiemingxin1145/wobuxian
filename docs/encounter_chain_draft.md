# 随机奇遇链草稿（阶段 3 小闭环）

> 目标：提供可测试的“奇遇选择 → NPC 态度变化 → 债务后果”数据结构，不接入正式游戏运行链。
> 当前状态：草稿 + 独立原型已扩展多路径，并有路径断言脚本。

## 数据结构示例

```js
const ENCOUNTER_CHAINS = [
  {
    id: 'debt_merchant_1',
    title: '贩子催债',
    location: '挑花村市集',
    trigger: { debtMin: 50, year: [3, 8] },
    npc: 'npc_merchant',
    text: '一个熟识的贩子挡住你：“上回账还没清呢，这回带了点货，帮个忙？”',
    choices: [
      {
        text: '帮他摆摊（耗时间，减少债务）',
        effects: { debt: -30, aff: { npc_merchant: +15 }, time: +1 },
        next: 'debt_merchant_2_help'
      },
      {
        text: '推说下回定（保持债务，好感下降）',
        effects: { debt: 0, aff: { npc_merchant: -10 } },
        next: 'debt_merchant_2_delay'
      },
      {
        text: '直接赖账（债务增加，可能触发追兵）',
        effects: { debt: +40, aff: { npc_merchant: -25 } },
        next: 'debt_chase_warning'
      }
    ]
  },
  {
    id: 'debt_merchant_2_help',
    title: '贩子感恩',
    text: '贩子笑道：“够义气！下回账可以再宽宽。”',
    choices: [
      { text: '谢谢接受', effects: { debt: -10 }, next: null }
    ]
  },
  {
    id: 'debt_merchant_2_delay',
    title: '贩子不满',
    text: '贩子皱眉：“又是下回？这账越拖越大，你得有个交代。”',
    choices: [
      { text: '承诺下月还', effects: { debt: +10, aff: { npc_merchant: -5 } }, next: null },
      { text: '再拖一段', effects: { debt: +20, aff: { npc_merchant: -15 } }, next: 'debt_chase_warning' }
    ]
  },
  {
    id: 'debt_chase_warning',
    title: '追兵风声',
    text: '村口传来话：外面有人在打听你的下落，好像是为了债务。',
    choices: [
      { text: '赶紧还一部分', effects: { debt: -50, aff: { npc_merchant: +5 } }, next: null },
      { text: '先藏起来', effects: { debt: +15, aff: { npc_merchant: -10 } }, next: null }
    ]
  }
  // 更多链可继续扩展
];
```

## 效果字段

- `debt`: 债务数值变化（正增负减）
- `aff`: NPC 好感度变化对象
- `time`: 耗时（月/行动力）
- `next`: 下一个奇遇 ID（可空）

## 验证

仓库根目录执行：

```bash
python3 -B test/encounter_chain_verify.py
```

对帮摆摊、推说下回、再拖追兵、直接赖账四条路径做最终债务/好感断言（无浏览器依赖）。

## 下一步

1. 独立原型已可测多路径选择与状态记录。
2. 路径断言脚本已就绪。
3. 再考虑与现有债务系统的集成方式；或检查试炼场覆盖层关闭返回。

更新于：2026-10-13

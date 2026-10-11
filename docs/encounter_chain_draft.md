# 随机奇遇链草稿（阶段 3 小闭环）

> 目标：提供可测试的“奇遇选择 → NPC 态度变化 → 债务后果”数据结构，不接入正式游戏运行链。
> 当前状态：仅草稿，供后续独立原型或正式集成参考。

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
  }
  // 更多链可继续扩展
];
```

## 效果字段

- `debt`: 债务数值变化（正增负减）
- `aff`: NPC 好感度变化对象
- `time`: 耗时（月/行动力）
- `next`: 下一个奇遇 ID（可空）

## 下一步

1. 把此数据转为独立 `www/prototypes/encounter_chain/` 可玩原型。
2. 验证选择后状态可正确记录并显示。
3. 再考虑与现有债务系统的集成方式。

更新于：2026-10-11

## 开放世界线 · 低模Extra合并进Box供即时战试用（2026-11-06，Grok Bot）
- 分支 openworld-wip：lowpoly_box_chars.js 若检测到 LowpolyExtra 则合并 CHARS；dev_openworld.js 懒加载 extra。即时战 box 皮肤可试用更多从 Cube 拼出的角色（如青云剑童等）。
- 仍不接入正式加载链。
- 下一步：主人试打对比手感，或继续扩展低模角色进战斗 / 随机奇遇链。

## 开放世界线 · 低模接入即时战试炼场对比手感（2026-11-06，Grok Bot）
- 分支 openworld-wip：`www/js/dev_openworld.js` 开发者入口懒加载增加 `lowpoly_box_chars.js`；「即时战」按钮询问是否用方块低模皮肤（skin:'box'，默认 jianxiu），取消则原精灵。仅开发者入口，不改正式加载链 / 不改核心。
- 仍不接入正式战斗结算 / 不改存档。
- 下一步：主人试打对比手感，或继续扩展低模角色进战斗 / 随机奇遇链。

## 开放世界线 · 奇遇链路径断言：剑童问路两条（2026-11-05，Grok Bot）
- 分支 openworld-wip：`test/encounter_chain_verify.py` 补上剑童问路最小链两条路径断言（指路债务-5好感+20 / 给灵石债务+10好感+10）。docs/encounter_chain_draft.md 同步。
- 仍不接入正式加载链 / 不改核心。
- 下一步：把低模接入即时战试炼场做对比手感。

## 开放世界线 · 低模 + 奇遇链：青云剑童样例与问路最小链（2026-11-04，Grok Bot）
- 分支 openworld-wip：`www/js/lowpoly_extra_chars.js` 新增「青云剑童」（青袍+小剑+布带，从 Cube 拼出）；预览页 `www/prototypes/lowpoly_box/index.html` 下拉补全青云剑童。
- `www/prototypes/encounter_chain/index.html` 新增最小奇遇链「剑童问路」（指路/给灵石/无视，影响债务/好感）。docs/encounter_chain_draft.md 同步。
- 仍不接入正式加载链 / 不改核心。
- 下一步：把低模接入即时战试炼场做对比手感，或给剑童链加路径断言。

## 开放世界线 · 奇遇链路径断言：破庙乞丐两条（2026-11-02，Grok Bot）
- 分支 openworld-wip：`test/encounter_chain_verify.py` 补上破庙乞丐最小链两条路径断言（给灵石债务+5好感+15 / 给干粮债务不变好感+8）。docs/encounter_chain_draft.md 同步。
- 仍不接入正式加载链 / 不改核心。
- 下一步：把低模接入即时战试炼场做对比手感。

## 开放世界线 · 低模 + 奇遇链：破庙乞丐样例与最小链草稿（2026-11-01，Grok Bot）
- 分支 openworld-wip：`www/js/lowpoly_extra_chars.js` 新增「破庙乞丐」（碎衣+破笋+打狗棒，从 Cube 拼出）；预览页 `www/prototypes/lowpoly_box/index.html` 下拉补全破庙乞丐。
- `www/prototypes/encounter_chain/index.html` 新增最小奇遇链「破庙乞丐」（给灵石/给干粮/无视，影响债务/好感）。docs/encounter_chain_draft.md 同步。
- 仍不接入正式加载链 / 不改核心。
- 下一步：把低模接入即时战试炼场做对比手感，或继续扩展奇遇链路径断言。

## 开放世界线 · 低模扩展：坊市小贩 + 预览页补全（2026-10-31，Grok Bot）
- 分支 openworld-wip：`www/js/lowpoly_extra_chars.js` 新增「坊市小贩」（短衫+货担+叫卖旗，从 Cube 拼出）；预览页 `www/prototypes/lowpoly_box/index.html` 下拉补全药铺掌柜与坊市小贩，header 文案同步。
- 仍不接入正式加载链 / 不改核心。docs/openworld_upgrade.md 同步记录。
- 下一步：把低模接入即时战试炼场做对比手感，或扩展奇遇链草稿一条可测路径。

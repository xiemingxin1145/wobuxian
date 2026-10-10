"""更新 HANDOFF_CHARS.md「状态」节与 PROGRESS.md 的 v2.4 节：python3 art/v24/status24.py "<本批说明>"
已完成 = www/assets/assets.js 里帧尺寸已是 192×224 的人形 + 已重渲染的 big BOSS（art/out/v24_done.txt 记录）。"""
import sys, json, os, re
sys.path.insert(0, 'art'); from specs import SPRITES
HUM = [k for k, v in SPRITES.items() if 'spec' in v and (k.startswith(('player_', 'npc_', 'cos_')) or (k.startswith('boss_')))]
s = open('www/assets/assets.js', encoding='utf-8').read(); A = json.loads(s[s.index('{'):s.rindex('}') + 1])['sprites']
donef = 'art/v24/DONE.txt'; extra = set(open(donef).read().split()) if os.path.exists(donef) else set()
done = [k for k in HUM if (A.get(k, {}).get('fh', 0) // A.get(k, {}).get('k', 1) == 224) or k in extra]
todo = [k for k in HUM if k not in done]
note = sys.argv[1] if len(sys.argv) > 1 else ''
st = f"""## 状态
- 总计人形：16 玩家 + 42 NPC + 20 时装 + 6 人形 BOSS = **{len(HUM)}**（chibi 怪 mon_collector/fox/jiangshi/demon 属怪物，不在本次范围）。
- **已完成 {len(done)}/{len(HUM)}**：{', '.join(done)}
- **待做 {len(todo)}**：{', '.join(todo) or '无'}
- 最近一批：{note}
- 续做命令：`nohup art/v24/render_batch.sh bN {','.join(todo[:12]) or '<ids>'} 3 > logs24/bN.log 2>&1 &`，完成后（big BOSS 需把 id 追加进 `art/v24/DONE.txt`）`python3 art/v24/status24.py "说明"`，提交并 `git push origin v24-chars`。
- 全部完成后：`python3 test/human23.py`（结果 test/human23/result.json），`python3 art/v24/contact_sheet.py <旧assets> www/assets <out.png>` 生成前后对比，push。
"""
h = open('HANDOFF_CHARS.md', encoding='utf-8').read(); h = h[:h.index('## 状态')] + st; open('HANDOFF_CHARS.md', 'w', encoding='utf-8').write(h)
p = open('PROGRESS.md', encoding='utf-8').read()
sec = f"""## v2.4 人形角色新模型（分支 v24-chars，交接见 HANDOFF_CHARS.md）
- [x] 管线 art/v24（Quaternius UBC CC0 基础人体 + 程序化动漫头/脸/发/衣袍，192×224 帧，锚点 0.86；spriteBox 适配，热区仍 ≥56×88 CSS）
- [{'x' if not todo else ' '}] 转换进度 {len(done)}/{len(HUM)}；最近一批：{note}
- [ ] HD 资源包需重新生成（Release assets-hd 里仍是旧精灵）；docs/art_specs.md 需重写为「基础人体+发型+配件+色板」
"""
if '## v2.4 人形角色新模型' in p:
    p = re.sub(r'## v2\.4 人形角色新模型.*?(?=\n## )', sec.rstrip('\n') + '\n', p, flags=re.S)
else:
    i = p.index('\n## ') + 1; p = p[:i] + sec + '\n' + p[i:]
open('PROGRESS.md', 'w', encoding='utf-8').write(p)
print(len(done), len(todo))

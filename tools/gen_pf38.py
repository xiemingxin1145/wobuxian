#!/usr/bin/env python3
"""把 docs/research_v38_profile.md §8 的 TEXT38A JSON 逐字嵌进 www/js/profile38.js 头部。用法：python3 tools/gen_pf38.py BODY.js"""
import json, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
doc = (root / 'docs/research_v38_profile.md').read_text()
sec = doc[doc.index('## 8.'):]
js = sec[sec.index('```json') + 7: sec.rindex('```')]
data = json.loads(js)
out = root / 'www/js/profile38.js'
body = pathlib.Path(sys.argv[1]).read_text() if len(sys.argv) > 1 else out.read_text().split('// ==== PF38 BODY ====\n', 1)[1]
out.write_text('// TEXT38A：由 tools/gen_pf38.py 从 docs/research_v38_profile.md §8 生成\nconst TEXT38A = ' + json.dumps(data, ensure_ascii=False) + ';\n// ==== PF38 BODY ====\n' + body)
print('ok', out, len(data['mg']), 'mg', len(data['fixed']), 'fixed')

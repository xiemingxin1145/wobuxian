"""前后对比联系表：python3 art/v24/contact_sheet.py <旧 assets 目录> <新 assets 目录> <out.png> [id,id,...]
从打包后的 SD 图集（assets.js 元数据）中取 idle 第 0 帧（S 或 SE），按脚底锚点对齐，上=旧 下=新。"""
import sys, json, os, re
from PIL import Image, ImageDraw, ImageFont
def load(d):
    s = open(os.path.join(d, 'assets.js'), encoding='utf-8').read(); s = s[s.index('{'):s.rindex('}') + 1]
    return json.loads(s)['sprites']
def frame(d, S, sid):
    m = S[sid]; dn = 'S' if 'S' in m['dirs'] else m['dirs'][0]; fr = m['f'][f'idle_{dn}_0']; k = m.get('k', 1)
    im = Image.open(os.path.join(d, 'spr', m['img'])).convert('RGBA').crop((fr[0], fr[1], fr[0] + fr[2], fr[1] + fr[3]))
    big = m['fw'] / k >= 300; ax, ay = m['fw'] / 2, m['fh'] * (0.9 if big else 0.86)
    return im, fr[4] - ax, fr[5] - ay, k        # 相对锚点的左上偏移
old, new, out = sys.argv[1:4]; SO, SN = load(old), load(new)
ids = sys.argv[4].split(',') if len(sys.argv) > 4 else [k for k in SN if k in SO]
names = {}
try:
    js = open('www/js/data.js', encoding='utf-8').read()
    for m in re.finditer(r"name:\s*'([^']+)'[^}]*?spr:\s*'([^']+)'", js): names.setdefault(m.group(2), m.group(1))
except Exception: pass
F = '/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc'
font = ImageFont.truetype(F, 13) if os.path.exists(F) else ImageFont.load_default()
CW, RH = 120, 210; cols = min(14, len(ids)); rows = (len(ids) + cols - 1) // cols
sheet = Image.new('RGBA', (cols * CW, rows * (RH * 2 + 24) + 30), (236, 230, 214, 255)); d = ImageDraw.Draw(sheet)
d.text((8, 6), '上：旧 chibi（v2.3）  下：新人形模型（v2.4，Quaternius UBC CC0 基础）  — idle 第 0 帧，SD 图集，脚底锚点对齐', fill=(40, 30, 20), font=font)
for n, sid in enumerate(ids):
    c, r = n % cols, n // cols; x0 = c * CW; y0 = 30 + r * (RH * 2 + 24)
    for row, (D, S) in enumerate(((old, SO), (new, SN))):
        if sid not in S: continue
        im, ox, oy, k = frame(D, S, sid)
        sc = min(1.0, 200 / (-oy)) / k if -oy > 200 else 1.0 / k
        if sc != 1.0: im = im.resize((max(1, int(im.width * sc)), max(1, int(im.height * sc))), Image.LANCZOS); ox *= sc; oy *= sc
        foot = (x0 + CW // 2, y0 + row * RH + RH - 8)
        d.rectangle([x0 + 2, y0 + row * RH + 2, x0 + CW - 2, y0 + row * RH + RH - 2], fill=(214, 226, 200, 255) if row else (226, 214, 200, 255))
        sheet.alpha_composite(im, (int(foot[0] + ox), int(foot[1] + oy)))
    d.text((x0 + 4, y0 + RH * 2 + 2), (names.get(sid, '') + ' ' + sid.replace('player_', 'p_').replace('npc_', ''))[:16], fill=(30, 30, 30), font=font)
sheet.convert('RGB').save(out); print(out, len(ids))

"""拼 A/B 图：/tmp/ab_old（PBR）、/tmp/ab_new（赛璐璐 v1）、/tmp/ab_new2（赛璐璐 v2 深色修正）→ test/ab_render/ab.png"""
from PIL import Image, ImageDraw, ImageFont
import glob, os
D = os.path.dirname(os.path.abspath(__file__))
fp = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
font = ImageFont.truetype(fp, 20) if os.path.exists(fp) else ImageFont.load_default()
rows = []
for sid in ['npc_ruyan', 'npc_taizi', 'boss_guiwang', 'boss_dasiming']:
    fr = os.path.basename(glob.glob(f'/tmp/ab_new2/{sid}/*.png')[0])[:-4]
    a = Image.open(f'/tmp/ab_old/{sid}/{fr}.png').convert('RGBA'); v1 = f'/tmp/ab_new/{sid}/{fr}.png'
    b = Image.open(v1).convert('RGBA') if os.path.exists(v1) else None
    c2 = Image.open(f'/tmp/ab_new2/{sid}/{fr}.png').convert('RGBA')
    a.save(f'{D}/{sid}_old.png'); c2.save(f'{D}/{sid}_new.png')
    if b: b.save(f'{D}/{sid}_cel_v1.png')
    w, h = a.size; c = Image.new('RGBA', (w * 3 + 40, h + 40), (58, 66, 84, 255)); d = ImageDraw.Draw(c)
    for k, (im, t) in enumerate([(a, f'{sid}  OLD (PBR)'), (b, 'CEL v1'), (c2, 'CEL v2 (dark fix)')]):
        if im: c.alpha_composite(im, (10 + k * (w + 10), 35))
        d.text((10 + k * (w + 10), 6), t if im else t + ': n/a', fill='white' if k == 0 else '#ffd25e', font=font)
    rows.append(c)
W = max(r.width for r in rows); H = sum(r.height for r in rows); o = Image.new('RGBA', (W, H), (58, 66, 84, 255)); y = 0
for r in rows: o.alpha_composite(r, (0, y)); y += r.height
o.convert('RGB').save(f'{D}/ab.png'); o.convert('RGB').resize((W // 2, H // 2)).save('/tmp/ab_small.png'); print(o.size)

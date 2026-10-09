"""把帧打包为 webp 图集（每个角色一张，按需加载），输出 JSON 元数据"""
import os, sys, json, glob, re
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(ROOT, 'out', 'atlas')
DEST = sys.argv[1] if len(sys.argv) > 1 else OUT
os.makedirs(DEST, exist_ok=True)
Q = 88

def shelf(items, maxw=2048, pad=1):
    items = sorted(items, key=lambda t: -t[1].size[1]); x = y = rowh = 0; pos = {}
    W = 0
    for k, im in items:
        w, h = im.size
        if x + w > maxw: x = 0; y += rowh + pad; rowh = 0
        pos[k] = (x, y); x += w + pad; rowh = max(rowh, h); W = max(W, x)
    return pos, W, y + rowh

def pack_sprite(sid, scale=1.0):
    files = sorted(glob.glob(os.path.join(ROOT, 'out', 'frames', sid, '*.png')))
    if not files: return None
    frames = {}; anims = {}; dirs = set(); fw = fh = 0
    for f in files:
        name = os.path.basename(f)[:-4]; an, d, k = name.rsplit('_', 2)
        im = Image.open(f).convert('RGBA'); fw, fh = im.size
        if scale != 1: im = im.resize((round(fw * scale), round(fh * scale)), Image.LANCZOS)
        bb = im.getchannel('A').point(lambda v: 255 if v > 6 else 0).getbbox() or (0, 0, 1, 1)
        frames[name] = (im.crop(bb), bb); anims[an] = max(anims.get(an, 0), int(k) + 1); dirs.add(d)
    pos, W, H = shelf([(k, v[0]) for k, v in frames.items()])
    sheet = Image.new('RGBA', (W, H))
    meta = {}
    for k, (im, bb) in frames.items():
        sheet.paste(im, pos[k]); meta[k] = [pos[k][0], pos[k][1], im.size[0], im.size[1], bb[0], bb[1]]
    sheet.save(os.path.join(DEST, sid + '.webp'), 'WEBP', quality=Q, method=6)
    return dict(img=sid + '.webp', fw=round(fw * scale), fh=round(fh * scale), anims=anims, dirs=sorted(dirs), f=meta)

def pack_group(name, entries, maxw=2048):
    """entries: {key: (Image, anchor_x, anchor_y)} → 单张图集"""
    trimmed = {}
    for k, (im, ax, ay) in entries.items():
        bb = im.getchannel('A').point(lambda v: 255 if v > 6 else 0).getbbox() or (0, 0, 1, 1)
        trimmed[k] = (im.crop(bb), ax - bb[0], ay - bb[1])
    pos, W, H = shelf([(k, v[0]) for k, v in trimmed.items()], maxw)
    sheet = Image.new('RGBA', (W, H)); meta = {}
    for k, (im, ax, ay) in trimmed.items():
        sheet.paste(im, pos[k]); meta[k] = [pos[k][0], pos[k][1], im.size[0], im.size[1], round(ax, 1), round(ay, 1)]
    sheet.save(os.path.join(DEST, name + '.webp'), 'WEBP', quality=Q, method=6)
    print(name, W, H, os.path.getsize(os.path.join(DEST, name + '.webp')))
    return dict(img=name + '.webp', f=meta)

if __name__ == '__main__':
    what = sys.argv[2] if len(sys.argv) > 2 else 'sprites'
    if what == 'sprites':
        import specs
        allm = {}
        for sid in specs.SPRITES:
            r = pack_sprite(sid)
            if r: allm[sid] = r; print(sid, os.path.getsize(os.path.join(DEST, sid + '.webp')))
        json.dump(allm, open(os.path.join(DEST, 'sprites.json'), 'w'), separators=(',', ':'))

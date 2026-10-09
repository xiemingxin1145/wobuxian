"""把 Blender 渲染产物打包进 www/assets（webp 图集 + assets.js 元数据）"""
import os, sys, json, glob, shutil
from PIL import Image
ART = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'art'); sys.path.insert(0, ART)
import pack, specs
from props_meta import FOOT
WWW = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ART, '..', 'www')
A = os.path.join(WWW, 'assets'); [os.makedirs(os.path.join(A, d), exist_ok=True) for d in ('spr', 'maps', 'ui', 'audio')]
only = sys.argv[2].split(',') if len(sys.argv) > 2 else ['spr', 'maps', 'ui', 'audio']
out = {}
old = os.path.join(A, 'assets.json')
if os.path.exists(old): out = json.load(open(old))
if 'spr' in only:
    pack.DEST = os.path.join(A, 'spr'); out['sprites'] = {}
    for sid in specs.SPRITES:
        r = pack.pack_sprite(sid)
        if r: out['sprites'][sid] = r
    print('sprites', len(out['sprites']))
if 'maps' in only:
    pack.DEST = os.path.join(A, 'maps'); out['maps'] = {}
    maps = json.load(open(os.path.join(ART, 'out', 'maps.json')))
    pmeta = {}
    for f in glob.glob(os.path.join(ART, 'out', 'props', 'meta_*.json')): pmeta.update(json.load(open(f)))
    for m in maps:
        mid = m['id']; meta = json.load(open(os.path.join(ART, 'out', 'maps', mid + '.json')))
        im = Image.open(os.path.join(ART, 'out', 'maps', mid + '.png')).convert('RGBA'); bb = im.getchannel('A').getbbox()
        im = im.crop(bb); im.save(os.path.join(A, 'maps', mid + '.webp'), 'WEBP', quality=84, method=6)
        meta['ox'] -= bb[0]; meta['oy'] -= bb[1]; meta['w'], meta['h'] = im.size
        used = sorted(set(p[0] for p in m['props']))
        ents = {}
        for t in used:
            pi = Image.open(os.path.join(ART, 'out', 'props', t + '.png')).convert('RGBA'); pm = pmeta[t]
            ents[t] = (pi, pm['ax'], pm['ay'])
        g = pack.pack_group(mid + '_props', ents)
        out['maps'][mid] = dict(name=m['name'], biome=m['biome'], n=m['n'], tiles=m['tiles'], props=m['props'], plate=meta, propAtlas=g,
                                foot={t: list(FOOT[t]) for t in used})
        print(mid, os.path.getsize(os.path.join(A, 'maps', mid + '.webp')))
if 'ui' in only:
    pack.DEST = os.path.join(A, 'ui')
    ents = {os.path.basename(f)[:-4]: (Image.open(f).convert('RGBA').resize((180, 180), Image.LANCZOS), 90, 90) for f in glob.glob(os.path.join(ART, 'out', 'portraits', '*.png'))}
    # 头像不裁切（保持统一框）
    sheet = Image.new('RGBA', (180 * 8, 180 * ((len(ents) + 7) // 8))); pm = {}
    for k, (key, (im, _, _)) in enumerate(sorted(ents.items())):
        x, y = (k % 8) * 180, (k // 8) * 180; sheet.paste(im, (x, y)); pm[key] = [x, y]
    sheet.save(os.path.join(A, 'ui', 'portraits.webp'), 'WEBP', quality=86, method=6); out['portraits'] = dict(size=180, cols=8, w=sheet.size[0], h=sheet.size[1], f=pm)
    ic = sorted(glob.glob(os.path.join(ART, 'out', 'icons', '*.png')))
    sheet = Image.new('RGBA', (96 * 10, 96 * ((len(ic) + 9) // 10))); im_ = {}
    for k, f in enumerate(ic):
        sheet.paste(Image.open(f).convert('RGBA').resize((96, 96), Image.LANCZOS), ((k % 10) * 96, (k // 10) * 96)); im_[os.path.basename(f)[:-4]] = [(k % 10) * 96, (k // 10) * 96]
    sheet.save(os.path.join(A, 'ui', 'icons.webp'), 'WEBP', quality=88, method=6); out['icons'] = dict(size=96, w=sheet.size[0], h=sheet.size[1], f=im_)
    print('ui done')
if 'audio' in only:
    for f in glob.glob(os.path.join(ART, 'out', 'audio', '*.ogg')): shutil.copy(f, os.path.join(A, 'audio'))
    out['audio'] = sorted(os.path.basename(f)[:-4] for f in glob.glob(os.path.join(A, 'audio', '*.ogg')))
json.dump(out, open(old, 'w'), separators=(',', ':'))
open(os.path.join(A, 'assets.js'), 'w').write('window.ASSETS=' + json.dumps(out, separators=(',', ':'), ensure_ascii=False) + ';\n')
print('assets.js', os.path.getsize(os.path.join(A, 'assets.js')))

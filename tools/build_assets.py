"""把 Blender 渲染产物打包进 www/assets（webp 图集 + assets.js 元数据）"""
import os, sys, json, glob, shutil
from PIL import Image
ART = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'art'); sys.path.insert(0, ART)
import pack, specs
from props_meta import FOOT
WWW = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ART, '..', 'www')
A = os.path.join(WWW, 'assets'); [os.makedirs(os.path.join(A, d), exist_ok=True) for d in ('spr', 'maps', 'ui', 'audio')]
only = sys.argv[2].split(',') if len(sys.argv) > 2 else ['spr', 'maps', 'ui', 'audio']
# v2.1：WBX_PROFILE=hd → 高清资源包（2 倍精灵图集/2 倍地图/原尺寸 CG/512 头像/高码率音频）；默认 sd（进 git 的轻量版）
HD = os.environ.get('WBX_PROFILE', 'sd') == 'hd'
pack.Q = 92 if HD else 84
out = {}
old = os.path.join(A, 'assets.json')
if os.path.exists(old): out = json.load(open(old))
if 'spr' in only:
    pack.DEST = os.path.join(A, 'spr'); out['sprites'] = {}
    for sid in specs.SPRITES:
        # v2.1：优先使用 2 倍分辨率 + 描边的新渲染（art/out/frames2），打包时缩到 1.5 倍以平衡清晰度与内存
        r = None
        if os.path.isdir(os.path.join(ART, 'out', 'frames2', sid)):
            r = pack.pack_sprite(sid, scale=1.0, frames='frames2', k=2) if HD else pack.pack_sprite(sid, scale=0.5, frames='frames2', k=1)
        if not r: r = pack.pack_sprite(sid)
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
        im = im.crop(bb)
        meta['ox'] -= bb[0]; meta['oy'] -= bb[1]
        k = meta.get('k', 1) or 1  # v2.1：2 倍分辨率底图，坐标换算回世界像素
        if k != 1 and not HD:  # SD 版缩回 1 倍
            im = im.resize((round(im.size[0] / k), round(im.size[1] / k)), Image.LANCZOS)
            for key in ('ox', 'oy'): meta[key] = meta[key] / k
            for key in ('ex', 'ej', 'ez'): meta[key] = [v / k for v in meta[key]]
            k = 1; meta['k'] = 1
        meta['w'], meta['h'] = im.size
        im.save(os.path.join(A, 'maps', mid + '.webp'), 'WEBP', quality=90 if HD else 82, method=6)
        if k != 1:
            for key in ('ox', 'oy', 'w', 'h'): meta[key] = meta[key] / k
            for key in ('ex', 'ej', 'ez'): meta[key] = [v / k for v in meta[key]]
            meta['k'] = k
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
    PS = 384 if HD else 256  # v2.1：头像 HD 384 / SD 256（控制解码内存）
    ents = {os.path.basename(f)[:-4]: (Image.open(f).convert('RGBA').resize((PS, PS), Image.LANCZOS), PS // 2, PS // 2) for f in glob.glob(os.path.join(ART, 'out', 'portraits', '*.png'))}
    # 头像不裁切（保持统一框）
    sheet = Image.new('RGBA', (PS * 8, PS * ((len(ents) + 7) // 8))); pm = {}
    for k, (key, (im, _, _)) in enumerate(sorted(ents.items())):
        x, y = (k % 8) * PS, (k // 8) * PS; sheet.paste(im, (x, y)); pm[key] = [x, y]
    sheet.save(os.path.join(A, 'ui', 'portraits.webp'), 'WEBP', quality=86, method=6); out['portraits'] = dict(size=PS, cols=8, w=sheet.size[0], h=sheet.size[1], f=pm)
    ic = sorted(glob.glob(os.path.join(ART, 'out', 'icons', '*.png')))
    sheet = Image.new('RGBA', (96 * 10, 96 * ((len(ic) + 9) // 10))); im_ = {}
    for k, f in enumerate(ic):
        sheet.paste(Image.open(f).convert('RGBA').resize((96, 96), Image.LANCZOS), ((k % 10) * 96, (k // 10) * 96)); im_[os.path.basename(f)[:-4]] = [(k % 10) * 96, (k // 10) * 96]
    sheet.save(os.path.join(A, 'ui', 'icons.webp'), 'WEBP', quality=88, method=6); out['icons'] = dict(size=96, w=sheet.size[0], h=sheet.size[1], f=im_)
    print('ui done')
if 'audio' in only:
    for f in glob.glob(os.path.join(ART, 'out', 'audio', '*.ogg')): shutil.copy(f, os.path.join(A, 'audio'))
    if HD:  # 高码率立体声（q8）
        for f in glob.glob(os.path.join(ART, 'out', 'audio_hd', '*.ogg')): shutil.copy(f, os.path.join(A, 'audio'))
    else:  # SD：立体声版转码到 q2 以控制 git 体积
        import subprocess
        for f in glob.glob(os.path.join(ART, 'out', 'audio2', '*.ogg')):
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f, '-c:a', 'libvorbis', '-q:a', '2', os.path.join(A, 'audio', os.path.basename(f))], check=True)
    out['audio'] = sorted(os.path.basename(f)[:-4] for f in glob.glob(os.path.join(A, 'audio', '*.ogg')))
if 'cg' in only or (HD and len(sys.argv) <= 2):
    os.makedirs(os.path.join(A, 'cg'), exist_ok=True)
    if HD:
        for f in glob.glob(os.path.join(ART, 'out', 'hd', 'cg', '*.webp')): shutil.copy(f, os.path.join(A, 'cg'))
out['profile'] = 'hd' if HD else 'sd'
json.dump(out, open(old, 'w'), separators=(',', ':'))
open(os.path.join(A, 'assets.js'), 'w').write('window.ASSETS=' + json.dumps(out, separators=(',', ':'), ensure_ascii=False) + ';\n')
print('assets.js', os.path.getsize(os.path.join(A, 'assets.js')))

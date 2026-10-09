#!/usr/bin/env python3
"""剧情CG后期：天空渐变 + 体积云 + 泛光 + 暗角 → www/assets/cg/*.webp"""
import os, sys, glob, random
from PIL import Image, ImageFilter, ImageChops, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'art'))
from cg_specs import CGS
SRC = os.path.join(ROOT, 'art', 'out', 'cg'); DST = os.path.join(ROOT, 'www', 'assets', 'cg'); os.makedirs(DST, exist_ok=True)
def hexc(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def sky(w, h, a, b, night=False, seed=0):
    top, bot = hexc(a), hexc(b); im = Image.new('RGB', (w, h))
    px = [tuple(int(top[c] + (bot[c] - top[c]) * (y / h) ** 0.8) for c in range(3)) for y in range(h)]
    d = ImageDraw.Draw(im)
    for y, c in enumerate(px): d.line([(0, y), (w, y)], fill=c)
    rng = random.Random(seed); cl = Image.new('L', (w, h), 0); dc = ImageDraw.Draw(cl)
    for k in range(26):
        cx, cy = rng.uniform(-0.1, 1.1) * w, rng.uniform(0.05, 0.55) * h; r = rng.uniform(0.04, 0.12) * w
        for j in range(7): dc.ellipse([cx + (j - 3) * r * 0.5 - r * 0.6, cy - r * 0.35 - (3 - abs(j - 3)) * r * 0.12, cx + (j - 3) * r * 0.5 + r * 0.6, cy + r * 0.3], fill=170 if not night else 60)
    cl = cl.filter(ImageFilter.GaussianBlur(w * 0.012))
    im = Image.composite(Image.new('RGB', (w, h), (255, 255, 255) if not night else (150, 170, 220)), im, cl)
    if night:
        dd = ImageDraw.Draw(im)
        for k in range(160): x, y = rng.random() * w, rng.random() * h * 0.6; dd.point((x, y), fill=(255, 255, 240))
        dd.ellipse([w * 0.78, h * 0.08, w * 0.86, h * 0.08 + w * 0.08], fill=(255, 250, 220))
    return im
def post(name):
    raw = os.path.join(SRC, name + '_raw.png')
    if not os.path.exists(raw): return None
    C = CGS[name]; fg = Image.open(raw).convert('RGBA'); w, h = fg.size
    bg = sky(w, h, *C.get('sky', ('#9fd4ff', '#ffffff')), night=C.get('night', False), seed=hash(name) % 1000).convert('RGBA')
    bg.alpha_composite(fg); im = bg.convert('RGB')
    # 泛光
    hi = im.point(lambda v: max(0, v - 190) * 3).filter(ImageFilter.GaussianBlur(w * 0.012))
    im = ImageChops.add(im, hi, scale=1.6)
    # 暗角
    vg = Image.new('L', (w, h), 0); dv = ImageDraw.Draw(vg); dv.ellipse([-w * 0.25, -h * 0.35, w * 1.25, h * 1.35], fill=255); vg = vg.filter(ImageFilter.GaussianBlur(w * 0.08))
    im = Image.composite(im, Image.blend(im, Image.new('RGB', (w, h), (20, 12, 8)), 0.55), vg)
    # v2.1：HD 原尺寸进 art/out/hd（高清资源包），SD 1600 宽进 git
    hd = os.path.join(ROOT, 'art', 'out', 'hd', 'cg'); os.makedirs(hd, exist_ok=True)
    im.save(os.path.join(hd, name + '.webp'), 'WEBP', quality=92, method=6)
    if w > 1600: im = im.resize((1600, round(h * 1600 / w)), Image.LANCZOS)
    out = os.path.join(DST, name + '.webp'); im.save(out, 'WEBP', quality=86, method=6); return out, os.path.getsize(out)
if __name__ == '__main__':
    only = sys.argv[1].split(',') if len(sys.argv) > 1 else list(CGS)
    for n in only:
        if os.path.exists(os.path.join(SRC, n + '_raw.png')): print(n, post(n))

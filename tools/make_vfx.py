"""v2.1 技能特效序列帧（程序生成，原创）：4x4=16 帧图集，每帧 F 像素。
python3 tools/make_vfx.py <输出目录> <F>   （SD: www/assets/vfx 192；HD 包: 384）"""
import os, sys, math
import numpy as np
from PIL import Image, ImageFilter
OUT = sys.argv[1] if len(sys.argv) > 1 else 'www/assets/vfx'; F = int(sys.argv[2]) if len(sys.argv) > 2 else 192
os.makedirs(OUT, exist_ok=True)
N = 16
yy, xx = np.mgrid[0:F, 0:F].astype(np.float32); cx = cy = (F - 1) / 2
X = (xx - cx) / (F / 2); Y = (yy - cy) / (F / 2); RR = np.sqrt(X * X + Y * Y); TH = np.arctan2(Y, X)
rng = np.random.default_rng(7)

def vnoise(sc, seed, t=0.0):
    """平滑值噪声（双线性插值网格）"""
    r = np.random.default_rng(seed); g0 = r.random((sc, sc)).astype(np.float32); g = np.pad(g0, ((0, 2), (0, 2)), mode='wrap')  # 周期网格，无接缝
    u = (xx / F * sc + t) % sc; v = (yy / F * sc + t * 0.7) % sc
    i = u.astype(int); j = v.astype(int); fu = u - i; fv = v - j
    fu = fu * fu * (3 - 2 * fu); fv = fv * fv * (3 - 2 * fv)
    a = g[j, i]; b = g[j, i + 1]; c = g[j + 1, i]; d = g[j + 1, i + 1]
    return a * (1 - fu) * (1 - fv) + b * fu * (1 - fv) + c * (1 - fu) * fv + d * fu * fv

def fbm(seed, t=0.0):
    return (vnoise(4, seed, t) * 0.5 + vnoise(8, seed + 1, t * 1.7) * 0.3 + vnoise(16, seed + 2, t * 2.3) * 0.2)

def ramp(v, stops):
    """v∈[0,1] → RGB 颜色渐变"""
    v = np.clip(v, 0, 1); out = np.zeros(v.shape + (3,), np.float32)
    for (a, ca), (b, cb) in zip(stops[:-1], stops[1:]):
        m = (v >= a) & (v <= b); k = ((v - a) / max(b - a, 1e-6))[..., None]
        out[m] = (np.array(ca, np.float32) * (1 - k) + np.array(cb, np.float32) * k)[m]
    return out

EDGE = np.clip((1.0 - RR) / 0.18, 0, 1)  # 帧边缘淡出，避免方形裁切
def img(rgb, a):
    a = np.clip(a, 0, 1) * EDGE
    arr = np.dstack([np.clip(rgb, 0, 255), a * 255]).astype(np.uint8)
    return Image.fromarray(arr, 'RGBA')

def ring(r0, w):
    return np.exp(-((RR - r0) / w) ** 2)

def f_fire(t, s):
    n = fbm(s, t * 3); r = 0.15 + 0.75 * (1 - (1 - t) ** 2)
    core = np.clip((r - RR + (n - 0.5) * 0.5) / 0.35, 0, 1) * (1 - t) ** 0.6
    heat = core * (1.2 - t)
    a = np.clip(core * 1.3, 0, 1) + ring(r * 1.05, 0.06) * (1 - t) * 0.8
    return img(ramp(heat, [(0, (120, 20, 10)), (0.35, (255, 90, 20)), (0.7, (255, 200, 60)), (1, (255, 255, 230))]), a)

def f_ice(t, s):
    k = 9; ang = (TH + math.pi) / (2 * math.pi) * k; d = np.abs(ang - np.round(ang)) * 2
    L = 0.25 + 0.7 * min(1, t * 2.2); shard = np.clip(1 - d / (0.35 * (1 - RR / max(L, 1e-3)) + 1e-3), 0, 1) * (RR < L)
    frost = ring(L * 0.8, 0.08) * (1 - t)
    a = np.clip(shard * 1.2 + frost + np.exp(-RR / 0.12) * (1 - t), 0, 1) * (1 - max(0, t - 0.7) / 0.3)
    v = np.clip(shard * 0.7 + 0.3 + (1 - RR) * 0.3, 0, 1)
    return img(ramp(v, [(0, (60, 140, 220)), (0.6, (170, 235, 255)), (1, (255, 255, 255))]), a)

def bolt_mask(seed, t):
    im = Image.new('L', (F, F), 0); from PIL import ImageDraw; d = ImageDraw.Draw(im); r = np.random.default_rng(seed)
    for b in range(6):
        a = r.random() * 6.283; x, y = F / 2, F / 2; L = F * (0.12 + 0.36 * min(1, t * 3))
        pts = [(x, y)]
        for k in range(8):
            a += (r.random() - 0.5) * 1.1; x += math.cos(a) * L / 8; y += math.sin(a) * L / 8; pts.append((x, y))
        d.line(pts, fill=255, width=max(2, F // 64))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(F / 120)), np.float32) / 255

def f_thunder(t, s):
    fl = 1.0 if (int(t * N) % 2 == 0) else 0.6
    m = bolt_mask(s + int(t * N), t); glow = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(F / 25)), np.float32) / 255
    a = np.clip(m * 1.5 + glow * 1.5 + np.exp(-RR / 0.15) * 0.8, 0, 1) * fl * (1 - max(0, t - 0.6) / 0.4)
    return img(ramp(np.clip(m + glow * 0.4, 0, 1), [(0, (90, 80, 255)), (0.5, (170, 200, 255)), (1, (255, 255, 255))]), a)

def f_slash(t, s):
    sweep = -2.4 + t * 3.6; arc = ring(0.72, 0.05 + 0.04 * (1 - t))
    ang = TH; behind = (ang < sweep) & (ang > sweep - 2.0)
    trail = np.where(behind, np.exp(-(sweep - ang) * 1.6), 0)
    a = np.clip(arc * trail * 1.6, 0, 1) * (1 - max(0, t - 0.75) / 0.25)
    return img(ramp(trail, [(0, (90, 200, 255)), (0.7, (200, 245, 255)), (1, (255, 255, 255))]), a)

def f_light(t, s):
    rays = (np.cos(TH * 12 + t * 2) * 0.5 + 0.5) ** 6 * np.exp(-RR / (0.3 + 0.6 * t))
    a = np.clip(rays * 1.5 + ring(0.2 + 0.7 * t, 0.06) * (1 - t) + np.exp(-RR / 0.18) * (1 - t), 0, 1) * (1 - t ** 3)
    return img(ramp(np.clip(1 - RR, 0, 1), [(0, (255, 180, 60)), (0.6, (255, 230, 140)), (1, (255, 255, 240))]), a)

def f_dark(t, s):
    sw = np.sin(TH * 3 + RR * 10 - t * 12) * 0.5 + 0.5; n = fbm(s, t * 2)
    r = 0.9 - 0.5 * t; body = np.clip((r - RR) / 0.3, 0, 1) * (sw * 0.6 + n * 0.6)
    a = np.clip(body * 1.4, 0, 1) * min(1, t * 5) * (1 - max(0, t - 0.75) / 0.25)
    return img(ramp(body, [(0, (40, 0, 60)), (0.5, (150, 60, 230)), (1, (240, 190, 255))]), a)

def f_blood(t, s):
    n = fbm(s + 5, t * 2); r = 0.2 + 0.7 * t
    sp = np.clip((r - RR + (n - 0.5) * 0.6) / 0.2, 0, 1) * (RR > r * 0.5) * (1 - t)
    return img(ramp(sp, [(0, (90, 0, 10)), (0.6, (230, 30, 50)), (1, (255, 150, 150))]), np.clip(sp * 1.4, 0, 1))

def particles(t, seed, n, up, col, size):
    im = Image.new('RGBA', (F, F)); from PIL import ImageDraw; d = ImageDraw.Draw(im); r = np.random.default_rng(seed)
    for k in range(n):
        x0 = F / 2 + (r.random() - 0.5) * F * 0.7; y0 = F * (0.75 + r.random() * 0.2); sp = 0.4 + r.random() * 0.6; ph = r.random() * 0.4
        tt = max(0, t - ph) / (1 - ph)
        if tt <= 0: continue
        x = x0 + math.sin(tt * 6 + k) * F * 0.03; y = y0 - tt * sp * F * 0.75 * up; rs = size * F * (1 - tt * 0.5)
        al = int(255 * math.sin(math.pi * min(1, tt)))
        d.ellipse([x - rs, y - rs, x + rs, y + rs], fill=col + (al,))
    return im.filter(ImageFilter.GaussianBlur(F / 200))

def f_heal(t, s):
    base = img(ramp(np.ones_like(RR) * 0.8, [(0, (60, 200, 90)), (1, (180, 255, 180))]), ring(0.25 + 0.6 * t, 0.06) * (1 - t) * 0.9)
    base.alpha_composite(particles(t, s, 26, 1, (190, 255, 170), 0.025)); return base

def f_shield(t, s):
    hexa = np.cos(TH * 6) * 0.04; L = 0.82 + hexa
    k = min(1, t * 3); edge = np.exp(-((RR - L * k) / 0.05) ** 2); fill = (RR < L * k) * 0.25
    shimmer = (np.sin((X + Y) * 12 + t * 16) * 0.5 + 0.5) * fill
    a = np.clip(edge + fill + shimmer * 0.4, 0, 1) * (1 - max(0, t - 0.7) / 0.3)
    return img(ramp(np.clip(edge + shimmer, 0, 1), [(0, (60, 140, 255)), (1, (220, 245, 255))]), a)

def f_water(t, s):
    a0 = ring(0.15 + 0.75 * t, 0.07) * (1 - t)
    im = img(ramp(np.ones_like(RR) * 0.7, [(0, (40, 120, 230)), (1, (170, 225, 255))]), a0)
    from PIL import ImageDraw; d = ImageDraw.Draw(im); r = np.random.default_rng(s)
    for k in range(22):
        a = r.random() * 6.283; sp = 0.3 + r.random() * 0.6; x = F / 2 + math.cos(a) * sp * t * F * 0.45; y = F / 2 + math.sin(a) * sp * t * F * 0.45 - math.sin(t * math.pi) * F * 0.15 * sp
        rs = F * 0.02 * (1 - t * 0.6); d.ellipse([x - rs, y - rs, x + rs, y + rs], fill=(190, 235, 255, int(255 * (1 - t))))
    return im

def f_poison(t, s):
    n = fbm(s + 9, t * 2.5); cloud = np.clip((0.75 - RR + (n - 0.5) * 0.7) / 0.3, 0, 1) * math.sin(math.pi * t)
    base = img(ramp(cloud * n * 1.3, [(0, (40, 90, 20)), (0.6, (120, 220, 60)), (1, (220, 255, 140))]), cloud * 0.85)
    base.alpha_composite(particles(t, s, 14, 0.5, (190, 255, 120), 0.02)); return base

def f_quake(t, s):
    sq = np.sqrt(X * X + (Y * 2.6 - 1.1) ** 2)  # 扁平地面圆环
    n = fbm(s + 3, t); d = np.exp(-((sq - (0.2 + 0.8 * t)) / (0.1 + 0.1 * t)) ** 2) * (n * 0.8 + 0.4) * (1 - t)
    return img(ramp(d, [(0, (90, 60, 30)), (1, (220, 180, 120))]), np.clip(d * 1.3, 0, 1))

KINDS = dict(fire=f_fire, ice=f_ice, thunder=f_thunder, slash=f_slash, light=f_light, dark=f_dark, blood=f_blood,
             heal=f_heal, shield=f_shield, water=f_water, poison=f_poison, quake=f_quake)
for name, fn in KINDS.items():
    sheet = Image.new('RGBA', (F * 4, F * 4))
    for i in range(N):
        fr = fn(i / (N - 1), 11 + len(name)); sheet.paste(fr, ((i % 4) * F, (i // 4) * F))
    p = os.path.join(OUT, name + '.webp'); sheet.save(p, 'WEBP', quality=90, method=5)
    print(name, os.path.getsize(p))

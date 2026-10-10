"""程序化绘制动漫古风脸部贴图（v24 角色管线）。贴图平面投影到头部正面：
u=(x-HC.x+0.085)/0.17, v=(z-(HC.z-0.15))/0.27，坐标下面按男性头 HC.z=1.70 书写（相对量）。
make_face(out, style, mouth, female, iris, brow, lip) — style: round|angry|happy|closed；mouth: smile|flat|open"""
from PIL import Image, ImageDraw, ImageFilter
import sys, os
S = 8000
W, H = int(0.17 * S), int(0.27 * S)
def P(x, z): return ((x + 0.085) * S, (1.82 - z) * S)
def bez(p0, p1, p2, n=40):
    return [((1-t)**2*p0[0]+2*(1-t)*t*p1[0]+t*t*p2[0], (1-t)**2*p0[1]+2*(1-t)*t*p1[1]+t*t*p2[1]) for t in (i/n for i in range(n+1))]
def stroke(d, pts, w0, w1, col):
    n = len(pts)
    for i in range(n - 1):
        w = w0 + (w1 - w0) * i / (n - 1); d.line([pts[i], pts[i+1]], fill=col, width=max(1, int(w)))
        r = w / 2; d.ellipse([pts[i][0]-r, pts[i][1]-r, pts[i][0]+r, pts[i][1]+r], fill=col)
def hx(h):
    h = h.lstrip('#'); h = ''.join(c * 2 for c in h) if len(h) == 3 else h; return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def make_face(out, style='round', mouth='smile', female=False, iris='#8a5a30', brow='#20141a', lip=None):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    def layer(): return Image.new('RGBA', (W, H), (0, 0, 0, 0))
    comp = img.alpha_composite
    EX, EZ = 0.0335, 1.690; EW = 0.041 if female else 0.040; EH = 0.026 if female else 0.021
    ic = hx(iris); bc = hx(brow) + (255,)
    LASH = (22, 12, 20, 255)
    for side in (-1, 1):
        cx, cy = P(side * EX, EZ); w, h = EW * S, EH * S
        l = layer(); d = ImageDraw.Draw(l)
        if style in ('happy', 'closed'):
            if style == 'happy':
                stroke(d, bez((cx - w * 0.45, cy + h * 0.25), (cx, cy - h * 0.9), (cx + w * 0.45, cy + h * 0.25)), w * 0.09, w * 0.09, LASH)
            else:
                stroke(d, bez((cx - w * 0.45, cy - h * 0.1), (cx, cy + h * 0.55), (cx + w * 0.45, cy - h * 0.1)), w * 0.08, w * 0.08, LASH)
                stroke(d, bez((cx + side * w * 0.35, cy), (cx + side * w * 0.5, cy + h * 0.05), (cx + side * w * 0.6, cy + h * 0.3)), w * 0.04, w * 0.01, LASH)
            comp(l)
        else:
            lift = -0.18 if style == 'angry' else 0.0
            inner = (cx - side * w * 0.48, cy + h * (0.10 + lift)); outer = (cx + side * w * 0.52, cy - h * 0.05)
            top = (cx + side * w * 0.05, cy - h * (0.95 + (0.25 if style == 'angry' else 0))); bot = (cx + side * w * 0.02, cy + h * 0.62)
            if style == 'angry': top = (cx + side * w * 0.15, cy - h * 0.6)
            upper = bez(inner, top, outer); lower = bez(outer, bot, inner)
            d.polygon(upper + lower, fill=(250, 248, 255, 255)); comp(l)
            mask = layer(); ImageDraw.Draw(mask).polygon(upper + lower, fill=(255, 255, 255, 255)); m = mask.split()[3]
            ir = layer(); d = ImageDraw.Draw(ir); icx, icy = cx + side * w * 0.04, cy + h * 0.02; rx, ry = w * 0.27, h * 0.62
            dark = tuple(int(c * 0.3) for c in ic); lite = tuple(min(255, int(c * 1.35 + 30)) for c in ic)
            for k in range(40):
                t = k / 39; c = tuple(int(dark[j] + (lite[j] - dark[j]) * t ** 1.4) for j in range(3)) + (255,)
                d.ellipse([icx - rx, icy - ry + 2 * ry * t - ry * 0.05, icx + rx, icy - ry + 2 * ry * t + ry * 0.05], fill=c)
            d.ellipse([icx - rx, icy - ry, icx + rx, icy + ry], outline=tuple(int(c * 0.2) for c in ic) + (255,), width=int(w * 0.03))
            d.ellipse([icx - rx * 0.42, icy - ry * 0.45, icx + rx * 0.42, icy + ry * 0.38], fill=(18, 10, 12, 255))
            sh = layer(); ImageDraw.Draw(sh).ellipse([icx - rx * 1.4, icy - ry * 1.9, icx + rx * 1.4, icy - ry * 0.35], fill=(20, 10, 20, 120)); ir.alpha_composite(sh)
            ir.putalpha(Image.composite(ir.split()[3], Image.new('L', ir.size, 0), m)); comp(ir)
            l = layer(); d = ImageDraw.Draw(l)
            hxx, hyy = icx - side * rx * 0.35, icy - ry * 0.45; d.ellipse([hxx - w * 0.075, hyy - w * 0.075, hxx + w * 0.075, hyy + w * 0.075], fill=(255, 255, 255, 255))
            hxx, hyy = icx + side * rx * 0.4, icy + ry * 0.45; d.ellipse([hxx - w * 0.035, hyy - w * 0.035, hxx + w * 0.035, hyy + w * 0.035], fill=(255, 255, 255, 235))
            comp(l)
            l = layer(); d = ImageDraw.Draw(l); lw = 1.25 if female else 1.0
            stroke(d, bez((inner[0] - side * w * 0.02, inner[1] + h * 0.05), (top[0], top[1] - h * 0.06), (outer[0] + side * w * 0.10, outer[1] - h * 0.18)), w * 0.06 * lw, w * 0.13 * lw, LASH)
            stroke(d, bez((outer[0] - side * w * 0.1, outer[1] - h * 0.12), (outer[0] + side * w * 0.05, outer[1] - h * 0.12), (outer[0] + side * w * 0.14, outer[1] - h * 0.32)), w * 0.08 * lw, w * 0.015, LASH)
            if female:
                for t in (0.55, 0.75, 0.9):
                    p = upper[int(t * (len(upper) - 1))]; stroke(d, [p, (p[0] + side * w * 0.08, p[1] - h * 0.22)], w * 0.03, w * 0.01, LASH)
            stroke(d, bez((cx + side * w * 0.12, bot[1] - h * 0.08), (cx + side * w * 0.36, bot[1] - h * 0.1), (outer[0] - side * w * 0.04, outer[1] + h * 0.16)), w * 0.008, w * 0.022, (90, 50, 50, 170))
            comp(l)
        # 眉
        l = layer(); d = ImageDraw.Draw(l)
        if style == 'angry':
            b0 = P(side * 0.010, EZ + 0.016); b1 = P(side * 0.034, EZ + 0.024); b2 = P(side * 0.058, EZ + 0.032)
        elif female:
            b0 = P(side * 0.014, EZ + 0.024); b1 = P(side * 0.036, EZ + 0.033); b2 = P(side * 0.058, EZ + 0.026)
        else:
            b0 = P(side * 0.012, EZ + 0.022); b1 = P(side * 0.036, EZ + 0.031); b2 = P(side * 0.060, EZ + 0.026)
        stroke(d, bez(b0, b1, b2), w * (0.055 if female else 0.085), w * 0.02, bc); comp(l)
    am = Image.new('L', (W, H), 0); d = ImageDraw.Draw(am)
    for s in (-1, 1):
        x, y = P(s * 0.045, 1.660); r = 0.016 * S; d.ellipse([x - r, y - r * 0.55, x + r, y + r * 0.55], fill=95 if female else 75)
    am = am.filter(ImageFilter.GaussianBlur(0.006 * S)); bl = Image.new('RGBA', (W, H), (255, 120, 130, 255)); bl.putalpha(am); comp(bl)
    l = layer(); d = ImageDraw.Draw(l)
    nx, ny = P(0.002, 1.640); d.ellipse([nx - 0.0035 * S, ny - 0.0016 * S, nx + 0.0035 * S, ny + 0.0016 * S], fill=(200, 120, 105, 150))
    if not female: stroke(d, [P(-0.006, 1.668), P(-0.005, 1.652), P(-0.002, 1.642)], 0.0012 * S, 0.0018 * S, (210, 140, 120, 110))
    lc = hx(lip) if lip else ((200, 80, 90) if female else (150, 70, 66))
    if mouth == 'open':
        d.ellipse([P(-0.006, 1.614)[0], P(-0.006, 1.614)[1], P(0.006, 1.603)[0], P(0.006, 1.603)[1]], fill=(140, 40, 45, 255))
        d.ellipse([P(-0.0035, 1.607)[0], P(-0.0035, 1.607)[1], P(0.0035, 1.603)[0], P(0.0035, 1.603)[1]], fill=(230, 110, 120, 255))
    elif mouth == 'flat':
        stroke(d, [P(-0.008, 1.611), P(0.008, 1.611)], 0.0016 * S, 0.0016 * S, lc + (235,))
    else:
        stroke(d, bez(P(-0.0085, 1.613), P(0.0, 1.609), P(0.0085, 1.6135)), 0.0016 * S, 0.0016 * S, lc + (235,))
        stroke(d, bez(P(-0.004, 1.6065), P(0.0, 1.6045), P(0.004, 1.6065)), 0.001 * S, 0.001 * S, (220, 140, 130, 120))
    comp(l)
    img.resize((W // 2, H // 2), Image.LANCZOS).save(out)
    return out

if __name__ == '__main__':
    a = sys.argv[1:]
    kw = {}
    if len(a) > 3: kw['female'] = a[3] == '1'
    if len(a) > 4: kw['iris'] = a[4]
    if len(a) > 5: kw['brow'] = a[5]
    make_face(a[0], a[1] if len(a) > 1 else 'round', a[2] if len(a) > 2 else 'smile', **kw)

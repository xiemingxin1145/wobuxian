#!/usr/bin/env python3
"""AI 生成插画 → 游戏用图（v2.3 起静态美术改为生成插画；地图上走动的精灵仍为 3D 渲染）

输入：art/gen/*.jpg（1280x720 等任意尺寸）+ art/gen/map.json（文件 → 游戏键）
输出：
  www/assets/gen/            SD（随仓库，lite/HD 都带）：por_<name>.webp 192²，bust_<name>.webp 300x400，card_<name>.webp 240x360，title.webp 540x960
  art/gen/hd/                HD（CI 在高清包解压后覆盖到 www/assets/gen/）：512²，720x960，600x900，1080x1920
  www/assets/gen/gen.js      window.GENART = {por:{游戏键:name}, bust:{...}, card:{...}, title:1}
人脸定位：OpenCV Haar（正脸+侧脸，多尺度放大检测）→ map.json 的 face 覆盖 → 兜底（画面上部亮度/细节重心）。
用法：python3 tools/gen_art.py [--debug]   （--debug 额外写 art/gen/debug_<name>.jpg 标出人脸框）
"""
import json, os, sys, fnmatch
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'art/gen'); SD = os.path.join(ROOT, 'www/assets/gen'); HD = os.path.join(SRC, 'hd')
SIZES = {'sd': dict(por=192, bust=(300, 400), card=(240, 360), title=(540, 960), q=82),
         'hd': dict(por=512, bust=(720, 960), card=(600, 900), title=(1080, 1920), q=86)}
DEBUG = '--debug' in sys.argv

def detect_face(im):
    try:
        import cv2
    except ImportError:
        return None
    g = np.array(im.convert('L')); H, W = g.shape
    up = cv2.resize(g, (W * 2, H * 2)); up = cv2.equalizeHist(up)
    best = None
    for name in ('haarcascade_frontalface_alt2.xml', 'haarcascade_frontalface_default.xml', 'haarcascade_profileface.xml'):
        cc = cv2.CascadeClassifier(os.path.join(cv2.data.haarcascades, name))
        for img, flip in ((up, False), (cv2.flip(up, 1), True)):
            for (x, y, w, h) in cc.detectMultiScale(img, 1.08, 4, minSize=(36, 36)):
                x, y, w, h = x / 2, y / 2, w / 2, h / 2
                if flip: x = W - x - w
                cy = y + h / 2
                if cy > H * 0.6 or w > W * 0.3: continue          # 脸在画面上部；太大的多半是误检
                score = w * (1.6 - cy / H)                          # 偏好大而靠上的
                if not best or score > best[0]: best = (score, x + w / 2, cy, w)
        if best: break
    return best and best[1:]

def fallback_face(im):
    """兜底：上 55% 区域里细节（边缘）最密的列/行作为头部中心"""
    g = np.asarray(im.convert('L').filter(ImageFilter.FIND_EDGES), dtype=np.float32); H, W = g.shape
    top = g[: int(H * 0.55)]; col = top.sum(0); cx = int(np.argmax(np.convolve(col, np.ones(W // 10), 'same')))
    row = g[:, max(0, cx - W // 20): cx + W // 20].sum(1)[: int(H * 0.55)]; cy = int(np.argmax(np.convolve(row, np.ones(H // 12), 'same')))
    return cx, max(H * 0.12, cy * 0.8), H * 0.09

def crop_box(W, H, cx, cy, w, h):
    x0 = min(max(0, cx - w / 2), W - w); y0 = min(max(0, cy - h / 2), H - h)
    return (int(x0), int(y0), int(x0 + w), int(y0 + h))

def fit(w, h, W, H):
    k = min(1, W / w, H / h); return w * k, h * k

def make(src, name, conf, out):
    im = Image.open(os.path.join(SRC, src)).convert('RGB'); W, H = im.size
    f = conf.get('face') or detect_face(im) or fallback_face(im)
    cx, cy, fs = f[0], f[1], max(f[2], H * 0.05)
    res = {}
    for prof, S in SIZES.items():
        d = SD if prof == 'sd' else HD; os.makedirs(d, exist_ok=True)
        # 头像：脸占约 45%，脸心略偏上
        side = min(W, H, fs * 2.3); b = crop_box(W, H, cx, cy + side * 0.08, side, side)
        im.crop(b).resize((S['por'], S['por']), Image.LANCZOS).save(os.path.join(d, f'por_{name}.webp'), quality=S['q'])
        # 半身（3:4）：头顶到腰，脸在上 1/4
        bw, bh = fit(fs * 4.2, fs * 5.6, W, H); b2 = crop_box(W, H, cx, cy + bh * 0.25, bw, bh)
        im.crop(b2).resize(S['bust'], Image.LANCZOS).save(os.path.join(d, f'bust_{name}.webp'), quality=S['q'])
        # 卡面（2:3）：尽量高，全身/大半身
        ch = H; cw = ch * 2 / 3; b3 = crop_box(W, H, cx, H / 2, cw, ch)
        im.crop(b3).resize(S['card'], Image.LANCZOS).save(os.path.join(d, f'card_{name}.webp'), quality=S['q'])
        res[prof] = dict(por=b, bust=b2, card=b3)
    if DEBUG:
        dbg = im.copy(); dr = ImageDraw.Draw(dbg)
        dr.rectangle([cx - fs / 2, cy - fs / 2, cx + fs / 2, cy + fs / 2], outline='red', width=3)
        for k, c in (('por', 'yellow'), ('bust', 'cyan'), ('card', 'lime')): dr.rectangle(res['hd'][k], outline=c, width=3)
        dbg.save(os.path.join(SRC, f'debug_{name}.jpg'), quality=80)
    print(f'{src:20s} → {name:10s} face=({cx:.0f},{cy:.0f},{fs:.0f}) {"auto" if not conf.get("face") else "manual"}')
    return (cx, cy, fs)

def title(conf, faces):
    """标题画：竖屏，左主角右女主，各取半身，中间柔化拼接，底部压暗给按钮"""
    L, Rr = conf['left'], conf['right']
    for prof, S in SIZES.items():
        TW, TH = S['title']; out = Image.new('RGB', (TW, TH), (20, 24, 40))
        for k, src in enumerate((L, Rr)):
            im = Image.open(os.path.join(SRC, src)).convert('RGB'); W, H = im.size; cx, cy, fs = faces[src]
            ph = H; pw = ph * (TW * 0.62) / TH; b = crop_box(W, H, cx, H / 2, pw, ph)
            part = im.crop(b).resize((int(TW * 0.62), TH), Image.LANCZOS)
            mask = Image.new('L', part.size, 255); md = ImageDraw.Draw(mask); fw = int(part.size[0] * 0.28)
            for x in range(fw):
                a = int(255 * x / fw); xx = x if k == 1 else part.size[0] - 1 - x; md.line([(xx, 0), (xx, TH)], fill=a)
            out.paste(part, (0 if k == 0 else TW - part.size[0], 0), mask)
        g = Image.new('L', (1, 256)); g.putdata([int(max(0, (y - 140) / 116) ** 1.5 * 200) for y in range(256)]); g = g.resize((TW, TH))
        out = Image.composite(Image.new('RGB', (TW, TH), (14, 8, 4)), out, g)
        out.save(os.path.join(SD if prof == 'sd' else HD, 'title.webp'), quality=S['q'])

def main():
    conf = json.load(open(os.path.join(SRC, 'map.json'))); faces = {}
    s = open(os.path.join(ROOT, 'www/assets/assets.js')).read(); A = json.loads(s[s.find('{'): s.rfind('}') + 1])
    keys = list(A['portraits']['f'].keys()); M = dict(por={}, bust={}, card={})
    for src, c in conf.items():
        if src.startswith('_') or not os.path.exists(os.path.join(SRC, src)): continue
        faces[src] = make(src, c['name'], c, None)
        for pat in c['keys']:
            hit = fnmatch.filter(keys, pat) or ([pat] if '*' not in pat else [])
            for k in hit:
                for t in M: M[t][k] = c['name']
    if '_title' in conf and all(x in faces for x in conf['_title'].values()):
        title(conf['_title'], faces); M['title'] = 1
    with open(os.path.join(SD, 'gen.js'), 'w') as f:
        f.write('// 由 tools/gen_art.py 生成：AI 插画覆盖的立绘键（没有的继续用 3D 渲染头像）\nwindow.GENART = ' + json.dumps(M, ensure_ascii=False) + ';\n')
    print('keys:', {k: len(v) if isinstance(v, dict) else v for k, v in M.items()})

if __name__ == '__main__':
    main()

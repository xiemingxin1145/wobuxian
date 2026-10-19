# 3.4 大地图：离线为每张扩展图挑选「真实地块纹理」源格（颜色接近该类型中位色、无道具、方差低）→ 打印 JS 表，贴进 www/js/bigmap34.js 的 Big34.SRC
import json, sys
from PIL import Image
import numpy as np
js = open('www/assets/assets.js').read(); A = json.loads(js[js.index('{'):js.rindex('}') + 1])
# 人工复核剔除：截图里带栅栏/建筑轮廓线、水面反光的源格（map, type, i, j）
BAD = {tuple(x) for x in [["village", "p", 10, 10], ["village", "w", 6, 15], ["village", "w", 5, 15], ["sect", "g", 17, 4], ["sect", "g", 5, 18], ["sect", "g", 17, 6], ["sect", "s", 10, 11], ["sect", "s", 11, 12], ["heaven", "j", 9, 10], ["market", "s", 5, 8], ["secret", "p", 11, 11], ["island", "s", 13, 5], ["island", "s", 10, 7], ["island", "s", 13, 4], ["rift", "r", 12, 17], ["rift", "l", 5, 6], ["rift", "l", 4, 6], ["rift", "l", 5, 7], ["rift", "s", 10, 7], ["rift", "s", 11, 7]]}
out = {}
for id in sys.argv[1].split(','):
    m = A['maps'][id]; P = m['plate']; k = P.get('k', 1); im = np.asarray(Image.open('www/assets/maps/%s.webp' % id).convert('RGBA')).astype(float)
    foot = set()
    for t, pi, pj in m['props']:
        f = m['foot'][t]
        for a in range(-1, f[0] + 1):
            for b in range(-2, f[1] + 1): foot.add((pi + a, pj + b))
    def patch(i, j):
        x = (P['ox'] + (i + .5) * P['ex'][0] + (j + .5) * P['ej'][0]) * k; y = (P['oy'] + (i + .5) * P['ex'][1] + (j + .5) * P['ej'][1]) * k
        r = int(24 * k); x, y = int(x), int(y)
        if x - 2 * r < 0 or y - r < 0 or x + 2 * r >= im.shape[1] or y + r >= im.shape[0]: return None
        return im[y - r:y + r, x - 2 * r:x + 2 * r]
    stats = {}
    for j in range(1, 21):
        for i in range(1, 21):
            t = m['tiles'][j][i]
            if t == 'x' or (i, j) in foot or (id, t, i, j) in BAD: continue
            nb = [m['tiles'][j + b][i + a] for a in (-1, 0, 1) for b in (-1, 0, 1)]
            pure = all(c == t for c in nb); pure4 = all(m['tiles'][j + b][i + a] == t for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            if not pure4: continue
            p = patch(i, j)
            if p is None or p[..., 3].min() < 250: continue
            lum = p[..., :3].mean(2); dark = float((lum < np.median(lum) * 0.45).mean())  # 栅栏/影子碎片 = 明显暗像素
            if dark > 0.02: continue
            stats.setdefault(t, []).append((i, j, p[..., :3].reshape(-1, 3).mean(0), p[..., :3].std(), pure))
    res = {}
    for t, L in stats.items():
        med = np.median(np.array([s[2] for s in L]), 0); sd = np.median([s[3] for s in L])
        sc = sorted(L, key=lambda s: (0 if s[4] else 1, np.abs(s[2] - med).sum() + 0.5 * max(0, s[3] - sd)))
        if sum(1 for s in L if s[4]) >= 3: sc = [s for s in sc if s[4]]
        res[t] = [[s[0], s[1]] for s in sc[:8]]
    out[id] = res
print(json.dumps(out, separators=(',', ':')))

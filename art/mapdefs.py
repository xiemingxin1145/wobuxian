"""8 张地图的程序化+手工布局（唯一数据源：同时供 Blender 渲染与游戏使用）"""
import random, math, json, os
N = 22
# 地块: g草 f花草 p土路 s石板 w水 d农田 a沙 r黑岩 b坟土 c云地 l熔岩 m秘境苔 j玉阶 x虚空
SOLID = set('wlx')

def gen(cfg):
    R = random.Random(cfg['seed']); n = cfg.get('n', N)
    T = [[cfg['base'] for _ in range(n)] for _ in range(n)]
    # 岛屿轮廓
    for j in range(n):
        for i in range(n):
            dx, dy = (i - (n - 1) / 2) / (n / 2), (j - (n - 1) / 2) / (n / 2)
            d = max(abs(dx), abs(dy)) * 0.6 + math.hypot(dx, dy) * 0.4
            if d > 0.9 + 0.06 * math.sin(i * 0.55 + j * 0.35 + cfg['seed']) + 0.04 * math.cos(j * 0.6 - i * 0.2): T[j][i] = 'x'
    MASK = [[T[j][i] == 'x' for i in range(n)] for j in range(n)]
    alt = cfg.get('alt')
    if alt:
        for j in range(n):
            for i in range(n):
                if T[j][i] == cfg['base'] and R.random() < alt[1]: T[j][i] = alt[0]
    for f in cfg.get('features', []):
        if f[0] == 'rect':
            _, i0, j0, i1, j1, t = f
            for j in range(j0, j1 + 1):
                for i in range(i0, i1 + 1): T[j][i] = t
        elif f[0] == 'circle':
            _, ci, cj, r, t = f
            for j in range(n):
                for i in range(n):
                    if (i - ci) ** 2 + (j - cj) ** 2 <= r * r + R.random() * r and T[j][i] != 'x': T[j][i] = t
    for path in cfg.get('paths', []):
        t = path[0]; pts = list(zip(path[1::2], path[2::2]))
        for (a, b), (c, d) in zip(pts, pts[1:]):
            i, j = a, b
            while (i, j) != (c, d):
                if T[j][i] != 'x' or True: T[j][i] = t
                if i != c: i += 1 if c > i else -1
                elif j != d: j += 1 if d > j else -1
            T[d][c] = t
    for j in range(n):
        for i in range(n):
            if MASK[j][i]: T[j][i] = 'x'
    # 只保留主岛
    seen = set(); st = [(n // 2, n // 2)]
    while st:
        i, j = st.pop()
        if (i, j) in seen or not (0 <= i < n and 0 <= j < n) or T[j][i] == 'x': continue
        seen.add((i, j)); st += [(i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)]
    for j in range(n):
        for i in range(n):
            if (i, j) not in seen: T[j][i] = 'x'
    props = []; occ = set()
    def free(i, j, w, h, strict=True):
        for jj in range(j, j + h):
            for ii in range(i, i + w):
                if not (0 <= ii < n and 0 <= jj < n): return False
                if (ii, jj) in occ: return False
                if T[jj][ii] in SOLID: return False
                if strict and T[jj][ii] in 'psjc' and cfg.get('keepPaths', True): return False
        return True
    from props_meta import FOOT
    for p in cfg.get('props', []):
        typ, i, j = p; w, h = FOOT[typ]
        props.append([typ, i, j])
        for jj in range(j, j + h):
            for ii in range(i, i + w): occ.add((ii, jj))
    # 保留口
    keep = set(tuple(k) for k in cfg.get('keep', []))
    for typ, cnt, tiles in cfg.get('scatter', []):
        w, h = FOOT[typ]; tries = 0; c = 0
        while c < cnt and tries < 600:
            tries += 1; i, j = R.randrange(1, n - w), R.randrange(1, n - h)
            if not all(T[jj][ii] in tiles for jj in range(j, j + h) for ii in range(i, i + w)): continue
            if not free(i, j, w, h): continue
            if any(abs(i - a) + abs(j - b) < 3 for a, b in keep): continue
            props.append([typ, i, j]); c += 1
            for jj in range(j, j + h):
                for ii in range(i, i + w): occ.add((ii, jj))
    return dict(id=cfg['id'], name=cfg['name'], n=n, tiles=[''.join(r) for r in T], props=props, biome=cfg['biome'])

MAPS = [
    dict(id='village', name='桃花村', biome='village', seed=11, base='g', alt=('f', 0.08),
         features=[('rect', 11, 4, 15, 7, 'd'), ('rect', 11, 9, 14, 10, 'd'), ('circle', 5, 15, 2.2, 'w'), ('rect', 7, 8, 10, 11, 's')],
         paths=[('p', 10, 0, 10, 21), ('p', 2, 10, 20, 10), ('p', 3, 3, 3, 17, 16, 17)],
         props=[['house', 5, 5], ['house2', 12, 12], ['house', 15, 15], ['well', 8, 12], ['noticeboard', 11, 8], ['mat', 7, 9], ['cart', 6, 12], ['lanternpole', 9, 7], ['haystack', 16, 5]],
         keep=[[10, 10], [10, 20], [20, 10]], scatter=[('peach', 9, 'gf'), ('oak', 5, 'gf'), ('willow', 2, 'gf'), ('bush', 8, 'gf'), ('rock', 3, 'gf'), ('fence', 4, 'g'), ('bamboo', 3, 'g')]),
    dict(id='sect', name='青云宗', biome='sect', seed=23, base='g', alt=('f', 0.04),
         features=[('rect', 6, 3, 15, 13, 's'), ('circle', 17, 16, 2.0, 'w')],
         paths=[('j', 10, 13, 10, 21), ('p', 3, 15, 18, 15), ('p', 4, 4, 4, 15)],
         props=[['hall', 9, 3], ['pagoda', 14, 4], ['bell', 7, 4], ['incense', 10, 9], ['stonelamp', 7, 8], ['stonelamp', 13, 8], ['stonelamp', 7, 12], ['stonelamp', 13, 12],
                ['mat', 8, 10], ['mat', 12, 10], ['dummy', 15, 11], ['dummy', 15, 9], ['paifang', 9, 16], ['crane', 6, 15], ['furnace', 6, 6], ['noticeboard', 13, 13]],
         keep=[[10, 14], [10, 20]], scatter=[('pine', 14, 'gf'), ('bamboo', 5, 'gf'), ('rock', 4, 'g'), ('bush', 4, 'gf')]),
    dict(id='market', name='云来坊市', biome='market', seed=37, base='s', alt=None,
         features=[('rect', 0, 0, 21, 3, 'g'), ('rect', 0, 18, 21, 21, 'g'), ('circle', 3, 19, 2.4, 'w')],
         paths=[('p', 10, 0, 10, 21), ('p', 0, 11, 21, 11)],
         props=[['shop', 4, 4], ['shop2', 15, 4], ['teahouse', 4, 13], ['shop', 15, 14], ['stall_r', 8, 7], ['stall_y', 12, 7], ['stall_b', 8, 14], ['stall_r', 13, 14],
                ['stall_y', 7, 9], ['furnace', 12, 9], ['noticeboard', 8, 12], ['lanternpole', 6, 11], ['lanternpole', 14, 11], ['crates', 18, 9], ['crates', 2, 9], ['cart', 17, 12]],
         keep=[[10, 11], [10, 20], [10, 1]], scatter=[('willow', 4, 'g'), ('peach', 4, 'g'), ('bush', 6, 'g'), ('lanternpole', 3, 's')]),
    dict(id='secret', name='万妖秘境', biome='secret', seed=41, base='m', alt=('r', 0.15),
         features=[('circle', 15, 6, 2.6, 'l'), ('circle', 5, 15, 2.0, 'l'), ('rect', 9, 9, 12, 12, 'p')],
         paths=[('p', 10, 21, 10, 2), ('p', 3, 11, 19, 11)],
         props=[['portal', 9, 1], ['chest', 17, 16], ['chest', 3, 4], ['herb', 6, 8], ['herb', 15, 12], ['herb', 13, 17], ['torch', 9, 8], ['torch', 12, 8], ['ruin', 8, 13], ['ruin', 13, 13]],
         keep=[[10, 20], [10, 3]], scatter=[('crystal', 6, 'mr'), ('crystal_b', 4, 'mr'), ('deadtree', 6, 'mr'), ('mushroom', 6, 'm'), ('ruin', 3, 'mr'), ('rock', 3, 'mr')]),
    dict(id='graveyard', name='乱葬岗', biome='graveyard', seed=53, base='b', alt=('g', 0.12),
         features=[('circle', 15, 15, 2.2, 'w'), ('rect', 9, 4, 12, 7, 's')],
         paths=[('p', 10, 21, 10, 7), ('p', 2, 12, 20, 12)],
         props=[['stele', 10, 5], ['coffin', 6, 8], ['coffin', 14, 9], ['chest', 18, 5], ['herb', 4, 16], ['wlantern', 9, 9], ['wlantern', 12, 9], ['altar', 5, 4]],
         keep=[[10, 20], [10, 9]], scatter=[('tomb', 14, 'bg'), ('grave', 10, 'bg'), ('deadtree', 8, 'bg'), ('wlantern', 3, 'b'), ('rock', 4, 'bg'), ('bonespike', 2, 'b')]),
    dict(id='island', name='东海仙岛', biome='island', seed=67, base='g', alt=('f', 0.06),
         features=[('rect', 0, 16, 21, 21, 'w'), ('rect', 0, 13, 21, 15, 'a'), ('rect', 0, 0, 3, 21, 'a'), ('rect', 7, 3, 14, 9, 's')],
         paths=[('p', 10, 9, 10, 15), ('p', 4, 12, 18, 12)],
         props=[['bigfurnace', 9, 4], ['pavilion', 15, 6], ['pavilion', 4, 5], ['boat', 10, 17], ['boat', 15, 18], ['furnace', 12, 8], ['mat', 8, 8], ['noticeboard', 13, 11], ['chest', 19, 3], ['herb', 6, 10], ['herb', 17, 10]],
         keep=[[10, 14], [10, 12]], scatter=[('palm', 10, 'ag'), ('coral', 6, 'a'), ('shellrock', 4, 'a'), ('fairypeach', 4, 'gf'), ('bush', 6, 'gf'), ('crystal_b', 2, 'g')]),
    dict(id='rift', name='魔道裂谷', biome='rift', seed=79, base='r', alt=('b', 0.1),
         features=[('circle', 5, 6, 2.4, 'l'), ('circle', 16, 14, 2.6, 'l'), ('rect', 7, 3, 14, 9, 's')],
         paths=[('p', 10, 9, 10, 21), ('p', 2, 13, 20, 13)],
         props=[['demonhall', 9, 3], ['altar', 10, 10], ['obelisk', 7, 9], ['obelisk', 13, 9], ['furnace', 15, 5], ['chest', 18, 9], ['herb', 3, 17], ['noticeboard', 8, 14]],
         keep=[[10, 20], [10, 12]], scatter=[('lavarock', 8, 'rb'), ('bonespike', 8, 'rb'), ('crystal_r', 7, 'rb'), ('deadtree', 5, 'rb'), ('obelisk', 2, 'r')]),
    dict(id='heaven', name='天外天', biome='heaven', seed=97, base='c', alt=None, keepPaths=False,
         features=[('rect', 6, 2, 15, 12, 'j')],
         paths=[('j', 10, 12, 10, 21), ('j', 3, 15, 18, 15)],
         props=[['tianmen', 8, 13], ['debtoffice', 9, 4], ['jade', 6, 9], ['jade', 14, 9], ['cloudpillar', 7, 3], ['cloudpillar', 14, 3], ['cloudpillar', 7, 7], ['cloudpillar', 14, 7], ['sundisk', 12, 2], ['fairypeach', 4, 17], ['fairypeach', 17, 17]],
         keep=[[10, 20], [10, 11]], scatter=[('cloudpuff', 10, 'c'), ('fairypeach', 3, 'c'), ('crane', 3, 'c')]),
]

if __name__ == '__main__':
    out = [gen(c) for c in MAPS]
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'maps.json'); os.makedirs(os.path.dirname(p), exist_ok=True)
    json.dump(out, open(p, 'w'), ensure_ascii=False)
    for m in out:
        print(m['id'], len(m['props']))
        print('\n'.join(m['tiles']))

"""怪物与BOSS建模（非人形），统一 Rig 接口：root/body + 可选 limbs"""
import math
from lib import *
import chars
OL = chars.OL

class MR:  # monster rig
    def __init__(s): s.limbs = []; s.wings = []; s.kind = ''

def _base(scale):
    R = MR(); R.root = empty('root'); R.base = empty('base', parent=R.root); R.base.scale = (scale,) * 3
    R.body = empty('body', parent=R.base); return R

def eyes(parent, c, sep=0.12, r=0.07, col='#1a1010', glow=None, y=0.0):
    for s in (-1, 1):
        if glow:
            sphere('eyeg', r, loc=(c[0] + s * sep, c[1] + y, c[2]), scale=(1, 0.5, 1.1), m=M(glow, emit=4.0, rough=0.2), parent=parent, seg=12, rings=8)
        else:
            sphere('eyew', r * 1.25, loc=(c[0] + s * sep, c[1] + y + 0.01, c[2]), scale=(1, 0.4, 1.15), m=M('#ffffff', rough=0.3), parent=parent, seg=12, rings=8)
            sphere('eye', r * 0.7, loc=(c[0] + s * sep * 1.05, c[1] + y - 0.02, c[2] - 0.01), scale=(1, 0.45, 1.2), m=M(col, rough=0.15), parent=parent, seg=12, rings=8)
            sphere('hl', r * 0.25, loc=(c[0] + s * sep * 1.05 + 0.02, c[1] + y - 0.05, c[2] + 0.03), m=M('#ffffff', emit=1.5), parent=parent, seg=8, rings=6)

def slime(R):
    b = R.body; m = M('#9a6cff', rough=0.15, spec=0.9, sss=0.3)
    sphere('slime', 0.42, loc=(0, 0, 0.36), scale=(1.05, 1.0, 0.85), m=m, parent=b, outline=OL, seg=32, rings=20)
    sphere('drip', 0.12, loc=(0.28, -0.2, 0.12), m=m, parent=b)
    sphere('hl', 0.1, loc=(-0.15, -0.25, 0.6), scale=(1, 0.5, 0.6), m=M('#ffffff', emit=0.8, rough=0.1), parent=b, seg=12, rings=8)
    eyes(b, (0, -0.33, 0.42), sep=0.14, r=0.08)
    for s in (-1, 1): tube('brow', [(s * 0.22, -0.36, 0.56), (s * 0.06, -0.38, 0.52)], 0.018, m=M('#2a1040'), parent=b)
    g = empty('bookp', (0.38, -0.12, 0.3), b); g.rotation_euler = (0, D(-20), D(-20)); R.limbs.append(g)
    box('book', (0.24, 0.07, 0.32), m=M('#a02a2a', rough=0.6), parent=g, bevel=0.012)
    box('label', (0.12, 0.005, 0.18), loc=(0, -0.038, 0.02), m=M('#f6efd8', rough=0.9), parent=g, bevel=0)
    # 小帽子（讨债专用）
    cyl('hat', 0.1, 0.09, 0.14, loc=(0.05, 0.02, 0.76), rot=(D(-8), D(10), 0), m=M('#2a2a34'), parent=b, seg=16, outline=OL)
    cyl('brim', 0.17, 0.17, 0.02, loc=(0.05, 0.02, 0.7), rot=(D(-8), D(10), 0), m=M('#2a2a34'), parent=b, seg=16)

def paper(R):
    b = R.body; m = M('#ffd65a', rough=0.85, sss=0.15)
    bm = bmesh.new(); W, H, n = 0.5, 0.95, 12
    for i in range(n + 1):
        for j in range(5):
            x = -W / 2 + W * j / 4; z = 0.15 + H * i / n
            y = 0.06 * math.sin(i * 0.9) + 0.04 * (x / W) ** 2 * 8
            if i == 0: z += 0.05 * math.sin(j * 2.6)
            bm.verts.new((x, y, z))
    bm.verts.ensure_lookup_table()
    for i in range(n):
        for j in range(4):
            a = i * 5 + j; bm.faces.new((bm.verts[a], bm.verts[a + 1], bm.verts[a + 6], bm.verts[a + 5]))
    o = mesh_from_bm('paper', bm); bpy.context.scene.collection.objects.link(o); o.parent = b
    o.data.materials.append(m); md = o.modifiers.new('s', 'SOLIDIFY'); md.thickness = 0.02
    sd = o.modifiers.new('sub', 'SUBSURF'); sd.levels = 2; sd.render_levels = 2
    for p in o.data.polygons: p.use_smooth = True
    red = M('#d02a20', rough=0.7)
    box('rl1', (0.03, 0.01, 0.5), loc=(0, -0.03, 0.5), m=red, parent=b, bevel=0)
    for z, w in ((0.68, 0.24), (0.45, 0.18), (0.3, 0.28)): box('rl', (w, 0.01, 0.025), loc=(0, -0.035, z), m=red, parent=b, bevel=0)
    eyes(b, (0, -0.05, 0.86), sep=0.1, r=0.06)
    sphere('mouth', 0.05, loc=(0, -0.05, 0.76), scale=(1.2, 0.3, 0.7), m=M('#401010'), parent=b, seg=10, rings=6)
    for s in (-1, 1):
        g = empty('armp', (s * 0.26, 0, 0.7), b); R.limbs.append(g)
        tube('arm', [(0, 0, 0), (s * 0.12, -0.05, -0.08), (s * 0.18, -0.1, -0.2)], 0.035, m=m, parent=g)

def boar(R):
    b = R.body; m = M('#5aa58a', rough=0.75, sheen=0.5); dk = M('#2f6b58', rough=0.8)
    sphere('torso', 0.4, loc=(0, 0.05, 0.42), scale=(0.95, 1.25, 0.85), m=m, parent=b, outline=OL)
    sphere('head', 0.3, loc=(0, -0.42, 0.5), m=m, parent=b, outline=OL)
    sphere('snout', 0.14, loc=(0, -0.68, 0.43), scale=(1.2, 0.7, 0.9), m=M('#f0a0a8', rough=0.6), parent=b)
    for s in (-1, 1):
        sphere('nos', 0.03, loc=(s * 0.06, -0.77, 0.44), m=M('#401818'), parent=b, seg=8, rings=6)
        tube('tusk', [(s * 0.12, -0.62, 0.36), (s * 0.18, -0.7, 0.48), (s * 0.14, -0.74, 0.58)], 0.03, m=M('#fffbe8', rough=0.3), parent=b, taper=[1, 0.7, 0.1])
        cyl('ear', 0.1, 0.0, 0.2, loc=(s * 0.2, -0.36, 0.78), rot=(D(-20), s * D(30), 0), m=dk, parent=b, seg=10)
    eyes(b, (0, -0.64, 0.6), sep=0.13, r=0.05, glow='#ff3a2a')
    for i, (x, y) in enumerate(((-0.22, -0.2), (0.22, -0.2), (-0.22, 0.32), (0.22, 0.32))):
        g = empty('leg', (x, y, 0.28), b); R.limbs.append(g)
        cyl('legm', 0.08, 0.07, 0.24, loc=(0, 0, -0.14), m=dk, parent=g, seg=12)
    for k in range(5): cyl('mane', 0.06, 0.0, 0.2, loc=(0, -0.2 + k * 0.12, 0.8 - k * 0.02), rot=(D(20), 0, 0), m=dk, parent=b, seg=8)

def rock(R):
    b = R.body; m = M('#8a8270', rough=0.9); m2 = M('#6f6858', rough=0.9)
    import random; rr = random.Random(5)
    sphere('core', 0.42, loc=(0, 0, 0.5), scale=(1, 0.9, 1.05), m=m, parent=b, seg=8, rings=6, outline=OL)
    for k in range(7):
        a = k / 7 * 6.28; sphere('chunk', 0.16 + rr.random() * 0.08, loc=(math.cos(a) * 0.33, math.sin(a) * 0.3, 0.3 + rr.random() * 0.5), m=m2, parent=b, seg=6, rings=5)
    for s in (-1, 1):
        g = empty('armp', (s * 0.45, 0, 0.55), b); R.limbs.append(g)
        sphere('fist', 0.17, loc=(s * 0.05, -0.05, -0.2), m=m2, parent=g, seg=7, rings=5, outline=OL)
    eyes(b, (0, -0.36, 0.6), sep=0.14, r=0.06, glow='#ffb030')
    sphere('moss', 0.2, loc=(0.05, 0, 0.92), scale=(1.2, 1, 0.4), m=M('#6fbf4a', rough=0.9), parent=b, seg=10, rings=6)
    cyl('sprout', 0.012, 0.012, 0.16, loc=(0.05, 0, 1.02), m=M('#4f9f3a'), parent=b, seg=6)
    sphere('leaf', 0.06, loc=(0.1, 0, 1.1), scale=(1.4, 0.4, 0.6), m=M('#7fd05a'), parent=b, seg=8, rings=6)

def fire(R):
    b = R.body; m = M('#ff5a1a', emit=0.9, rough=0.3, emit_col=(1.0, 0.35, 0.05)); m2 = M('#ffd040', emit=1.6, emit_col=(1.0, 0.75, 0.2))
    sphere('fb', 0.33, loc=(0, 0, 0.45), scale=(1, 1, 1.1), m=m, parent=b)
    for k in range(5):
        a = k / 5 * 6.28; cyl('flame', 0.13, 0.0, 0.45, loc=(math.cos(a) * 0.15, math.sin(a) * 0.15 + 0.05, 0.85), rot=(math.sin(a) * 0.4, -math.cos(a) * 0.4, 0), m=m, parent=b, seg=10)
    sphere('core', 0.2, loc=(0, -0.08, 0.45), m=m2, parent=b)
    eyes(b, (0, -0.34, 0.52), sep=0.1, r=0.07)
    for s in (-1, 1):
        g = empty('armp', (s * 0.3, 0, 0.45), b); R.limbs.append(g)
        sphere('fh', 0.1, loc=(s * 0.08, -0.05, -0.05), m=m, parent=g)

def treant(R):
    b = R.body; bark = M('#7a5a3a', rough=0.9); leaf = M('#5fb85a', rough=0.8, sheen=0.4)
    cyl('trunk', 0.34, 0.26, 0.8, loc=(0, 0, 0.42), m=bark, parent=b, seg=10, outline=OL)
    for k in range(3):
        a = k * 2.1; cyl('root', 0.08, 0.0, 0.3, loc=(math.cos(a) * 0.3, math.sin(a) * 0.3, 0.08), rot=(math.sin(a) * 1.2, -math.cos(a) * 1.2, 0), m=bark, parent=b, seg=6)
    for x, y, z, r in ((0, 0, 1.0, 0.38), (-0.26, 0.05, 0.92, 0.26), (0.26, 0.05, 0.94, 0.27), (0, 0.1, 1.26, 0.25)):
        sphere('crown', r, loc=(x, y, z), m=leaf, parent=b, seg=12, rings=8, outline=OL)
    eyes(b, (0, -0.32, 0.6), sep=0.12, r=0.06, glow='#ffe060')
    sphere('mouth', 0.08, loc=(0, -0.31, 0.42), scale=(1.3, 0.4, 0.6), m=M('#2a1a0a'), parent=b, seg=10, rings=6)
    for s in (-1, 1):
        g = empty('armp', (s * 0.32, 0, 0.7), b); R.limbs.append(g)
        tube('branch', [(0, 0, 0), (s * 0.18, -0.05, -0.1), (s * 0.3, -0.1, -0.05), (s * 0.38, -0.12, 0.08)], 0.05, m=bark, parent=g, taper=[1, 0.8, 0.5, 0.2])
        sphere('lf', 0.08, loc=(s * 0.38, -0.12, 0.12), m=leaf, parent=g, seg=8, rings=6)

def crab(R):
    b = R.body; m = M('#e0503a', rough=0.35, spec=0.7); m2 = M('#ff8a6a', rough=0.4)
    sphere('shell', 0.38, loc=(0, 0, 0.42), scale=(1.25, 0.9, 0.6), m=m, parent=b, outline=OL)
    sphere('belly', 0.3, loc=(0, -0.05, 0.36), scale=(1.2, 0.9, 0.45), m=m2, parent=b)
    for s in (-1, 1):
        cyl('stalk', 0.025, 0.025, 0.16, loc=(s * 0.12, -0.22, 0.66), m=m, parent=b, seg=8)
        sphere('ew', 0.06, loc=(s * 0.12, -0.24, 0.76), m=M('#ffffff', rough=0.3), parent=b, seg=10, rings=8)
        sphere('ep', 0.035, loc=(s * 0.12, -0.29, 0.77), m=M('#101010'), parent=b, seg=8, rings=6)
        g = empty('claw', (s * 0.42, -0.15, 0.45), b); R.limbs.append(g)
        tube('carm', [(0, 0, 0), (s * 0.1, -0.12, 0.08), (s * 0.12, -0.24, 0.12)], 0.05, m=m, parent=g)
        sphere('pincer', 0.13, loc=(s * 0.13, -0.34, 0.14), scale=(0.8, 1.2, 0.7), m=m, parent=g, outline=OL)
        for k in range(3):
            cyl('cleg', 0.025, 0.015, 0.3, loc=(s * (0.38 + 0.02 * k), 0.05 + k * 0.12, 0.22), rot=(0, s * D(55), 0), m=m, parent=b, seg=6)
    cyl('helm', 0.16, 0.12, 0.12, loc=(0, 0.05, 0.7), m=M('#c0a040', metal=0.8, rough=0.3), parent=b, seg=16)
    cyl('spike', 0.03, 0.0, 0.14, loc=(0, 0.05, 0.82), m=M('#c0a040', metal=0.8, rough=0.3), parent=b, seg=8)

def ghost(R):
    b = R.body; m = M('#eef4ff', rough=0.5, sss=0.4, alpha=0.85)
    lathe('gb', [(0.3, 0.12), (0.32, 0.35), (0.28, 0.6), (0.18, 0.78), (0.0, 0.84)], m=m, parent=b, seg=24, outline=OL)
    for k in range(6):
        a = k / 6 * 6.28; cyl('tat', 0.08, 0.0, 0.16, loc=(math.cos(a) * 0.24, math.sin(a) * 0.24, 0.06), rot=(D(180), 0, 0), m=m, parent=b, seg=8)
    sphere('hair', 0.34, loc=(0, 0.14, 0.8), scale=(1, 1, 1.0), m=M('#151520', rough=0.5), parent=b, outline=OL)
    tube('hairb', [(0, 0.2, 0.8), (0, 0.3, 0.5), (0, 0.3, 0.2)], 0.25, m=M('#151520'), parent=b, taper=[1, 1, 0.6])
    sphere('face', 0.27, loc=(0, -0.14, 0.72), scale=(1, 0.8, 1), m=M('#f4f8ff', rough=0.5), parent=b)
    eyes(b, (0, -0.37, 0.74), sep=0.1, r=0.05, glow='#60e0ff')
    for s in (-1, 1):
        g = empty('armp', (s * 0.28, -0.05, 0.6), b); R.limbs.append(g)
        cyl('gsl', 0.06, 0.1, 0.3, loc=(s * 0.04, -0.1, -0.08), rot=(D(70), 0, 0), m=m, parent=g, seg=12)

def tiandao(R):  # 讨尾款的天道
    b = R.body; cl = M('#fbf8ff', rough=0.7, sss=0.3); gold = M('#ffcc40', metal=0.9, rough=0.2)
    for x, y, z, r in ((0, 0, 0.9, 0.62), (-0.55, 0.05, 0.75, 0.42), (0.55, 0.05, 0.75, 0.44), (-0.3, 0.1, 1.3, 0.4), (0.32, 0.1, 1.32, 0.42), (0, 0.2, 1.5, 0.38), (-0.8, 0.1, 0.5, 0.28), (0.8, 0.1, 0.52, 0.3)):
        sphere('cloud', r, loc=(x, y, z), m=cl, parent=b, outline=OL)
    sphere('eyeW', 0.3, loc=(0, -0.48, 0.95), scale=(1.3, 0.4, 0.85), m=M('#ffffff', rough=0.2), parent=b)
    sphere('iris', 0.17, loc=(0, -0.58, 0.95), scale=(1, 0.4, 1), m=M('#f0a020', emit=2.5, rough=0.1), parent=b)
    sphere('pupil', 0.08, loc=(0, -0.63, 0.95), scale=(1, 0.4, 1), m=M('#201008'), parent=b)
    torus('halo', 0.75, 0.04, loc=(0, 0.35, 1.25), rot=(D(80), 0, 0), m=M('#ffe070', emit=3.0, rough=0.2), parent=b)
    lathe('crown', [(0.22, 0), (0.26, 0.1), (0.18, 0.22), (0.05, 0.32)], loc=(0, 0.15, 1.82), m=gold, parent=b, seg=16)
    for s in (-1, 1):
        g = empty('abp', (s * 1.05, -0.2, 1.0), b); R.limbs.append(g)
        box('frame', (0.6, 0.08, 0.36), m=M('#8a5a2a', rough=0.5), parent=g, bevel=0.02)
        for i in range(7):
            for j in range(3): sphere('bead', 0.035, loc=(-0.24 + i * 0.08, -0.05, -0.1 + j * 0.1), m=gold, parent=g, seg=8, rings=6)
    for k in range(3):  # 账单
        box('bill', (0.22, 0.005, 0.3), loc=(-0.6 + k * 0.6, -0.65, 0.35 + (k % 2) * 0.12), rot=(D(-10), 0, D(-15 + k * 15)), m=M('#f8f0d8', rough=0.9, emit=0.2), parent=b, bevel=0)

def dragon(R):  # 东海龙王
    b = R.body; m = M('#2f8fc0', rough=0.3, spec=0.8, metal=0.2); belly = M('#f0d890', rough=0.5); gold = M('#ffcc40', metal=0.9, rough=0.2)
    pts = [(0.6, 0.6, 0.2), (0.0, 0.7, 0.3), (-0.6, 0.4, 0.45), (-0.5, -0.1, 0.7), (0.1, -0.2, 0.95), (0.25, -0.35, 1.3)]
    tube('serp', pts, 0.24, m=m, parent=b, taper=[0.35, 0.8, 1, 1, 0.95, 0.85])
    for k in range(6): cyl('fin', 0.08, 0.0, 0.2, loc=(0.6 - k * 0.22, 0.6 - abs(k - 2) * 0.12, 0.4 + k * 0.06), rot=(D(-20), 0, 0), m=M('#e05a3a', rough=0.5), parent=b, seg=6)
    h = empty('headp', (0.25, -0.42, 1.38), b); R.limbs.append(h)
    sphere('head', 0.3, loc=(0, 0, 0), scale=(1, 1.3, 0.85), m=m, parent=h, outline=OL)
    sphere('snout', 0.2, loc=(0, -0.32, -0.06), scale=(1, 1.2, 0.7), m=m, parent=h)
    sphere('jaw', 0.17, loc=(0, -0.28, -0.18), scale=(1, 1.2, 0.5), m=belly, parent=h)
    for s in (-1, 1):
        tube('horn', [(s * 0.12, 0.1, 0.18), (s * 0.25, 0.25, 0.45), (s * 0.2, 0.42, 0.6)], 0.05, m=gold, parent=h, taper=[1, 0.6, 0.15])
        tube('whisk', [(s * 0.12, -0.45, -0.05), (s * 0.35, -0.5, 0.0), (s * 0.55, -0.4, -0.2)], 0.015, m=gold, parent=h)
        sphere('eye', 0.06, loc=(s * 0.16, -0.2, 0.12), scale=(1, 0.5, 1), m=M('#ffd040', emit=3.0), parent=h, seg=10, rings=8)
    sphere('pearl', 0.13, loc=(-0.45, -0.55, 0.9), m=M('#e8f8ff', emit=1.5, rough=0.05), parent=b)
    lathe('crownd', [(0.12, 0), (0.15, 0.06), (0.1, 0.12)], loc=(0, 0.05, 0.24), m=gold, parent=h, seg=12)


# ---------------- v2.1 坐骑（人物站在上面，渲染时在原点高度 0.15 处承载角色） ----------------
def m_cloud(R):
    b = R.body; m = M('#ffffff', rough=0.9, emit=0.35, emit_col=(1.0, 0.95, 0.85)); m2 = M('#ffe6b8', rough=0.9, emit=0.5)
    import random as _r; rr = _r.Random(3)
    for k in range(11):
        a = k / 11 * 2 * math.pi; rad = 0.42 + rr.random() * 0.1
        sphere('cl', 0.2 + rr.random() * 0.08, loc=(math.cos(a) * rad * 0.9, math.sin(a) * rad * 1.15, 0.08 + rr.random() * 0.05), m=(m2 if k % 4 == 0 else m), parent=b, seg=14, rings=10)
    sphere('clc', 0.4, loc=(0, 0, 0.06), scale=(1.2, 1.4, 0.45), m=m, parent=b, seg=20, rings=12)
    for k in range(3): tube('swirl', [(-0.3 + k * 0.3, 0.55, 0.05), (-0.2 + k * 0.3, 0.8, 0.0), (-0.35 + k * 0.3, 0.95, 0.04)], 0.04, m=m, parent=b, taper=[1, 0.7, 0.2])

def m_fsword(R):
    b = R.body; g = empty('fsw', (0, 0.0, 0.05), b); g.rotation_euler = (D(-90), 0, 0); g.scale = (2.6, 2.6, 1.9)
    chars.swordmesh(g, 0.75, glow=True)
    g.location = (0, 0.75, 0.05)
    for k in range(4): sphere('trail', 0.05 - k * 0.008, loc=(0, 1.0 + k * 0.18, 0.05), m=M('#9fe8ff', emit=3.0), parent=b, seg=8, rings=6)

def m_gourd(R):
    b = R.body; g = empty('gd', (0, 0, 0.12), b); g.rotation_euler = (D(-90), 0, 0); g.scale = (2.2, 2.2, 2.6)
    lathe('gourdm', [(0.0, -0.2), (0.11, -0.15), (0.12, -0.08), (0.06, 0.0), (0.08, 0.05), (0.07, 0.11), (0.02, 0.15)], m=M('#e09a3a', rough=0.3, sheen=0.3), parent=g, seg=24, outline=OL)
    torus('gstr', 0.06, 0.012, loc=(0, 0, 0.0), m=M('#c0302a'), parent=g)
    tube('tassel', [(0, 0.05, 0.12), (0.05, 0.25, 0.1), (0.02, 0.4, 0.0)], 0.02, m=M('#ff3a3a'), parent=b)

def m_crane(R):
    b = R.body; w = M('#fbfbf8', rough=0.6, sheen=0.4); blk = M('#1a1a1a', rough=0.5); red = M('#e02a2a', emit=0.5)
    sphere('cb', 0.34, loc=(0, 0.05, 0.12), scale=(0.9, 1.5, 0.6), m=w, parent=b, outline=OL, seg=24, rings=14)
    tube('neck', [(0, -0.38, 0.18), (0, -0.62, 0.42), (0, -0.7, 0.62)], 0.07, m=w, parent=b, taper=[1, 0.8, 0.7])
    sphere('ch', 0.09, loc=(0, -0.72, 0.66), m=w, parent=b, seg=14, rings=10)
    sphere('cr', 0.04, loc=(0, -0.72, 0.74), m=red, parent=b, seg=10, rings=8)
    cyl('beak', 0.03, 0.0, 0.2, loc=(0, -0.86, 0.64), rot=(D(95), 0, 0), m=M('#d8c070'), parent=b, seg=8)
    for s in (-1, 1):
        wg = empty('wing', (s * 0.25, 0.05, 0.2), b); R.limbs.append(wg)
        sphere('wingm', 0.32, loc=(s * 0.3, 0.05, 0.0), scale=(1.6, 0.9, 0.12), m=w, parent=wg, seg=16, rings=10)
        sphere('wingt', 0.18, loc=(s * 0.72, 0.15, 0.0), scale=(1.3, 0.8, 0.12), m=blk, parent=wg, seg=12, rings=8)
    tube('tail', [(0, 0.5, 0.12), (0, 0.75, 0.1)], 0.08, m=blk, parent=b, taper=[1, 0.3])

def m_lotus(R):
    b = R.body; pk = M('#ffb8d0', rough=0.5, sss=0.2, emit=0.25); pk2 = M('#ff8ab0', rough=0.5); gold = M('#ffe080', emit=1.2)
    for ring, (n, rad, tilt, mm) in enumerate(((10, 0.42, 55, pk2), (8, 0.3, 35, pk))):
        for k in range(n):
            a = k / n * 2 * math.pi + ring * 0.3
            sphere('petal', 0.16, loc=(math.cos(a) * rad, math.sin(a) * rad, 0.1 + ring * 0.05), scale=(0.55, 1.2, 0.25), rot=(D(tilt), 0, a + math.pi / 2), m=mm, parent=b, seg=12, rings=8)
    cyl('seat', 0.22, 0.24, 0.06, loc=(0, 0, 0.12), m=gold, parent=b, seg=24)
    torus('glow', 0.5, 0.02, loc=(0, 0, 0.05), m=M('#fff0a0', emit=4.0), parent=b, seg=40, mseg=6)

def m_bowl(R):
    b = R.body; w = M('#f4f0e8', rough=0.25, spec=0.6); blu = M('#3a6ab8', rough=0.3)
    lathe('bowl', [(0.12, 0.0), (0.3, 0.05), (0.45, 0.2), (0.5, 0.3)], m=w, parent=b, seg=32, outline=OL, close_top=False)
    torus('rim', 0.5, 0.025, loc=(0, 0, 0.3), m=blu, parent=b, seg=40, mseg=6)
    cyl('soup', 0.46, 0.46, 0.01, loc=(0, 0, 0.26), m=M('#e8a040', rough=0.1, emit=0.3), parent=b, seg=32)
    for k in range(3): sphere('steam', 0.08, loc=(-0.15 + k * 0.15, 0.1, 0.42 + k * 0.05), m=M('#ffffff', alpha=0.5, emit=0.5), parent=b, seg=8, rings=6)

def m_carp(R):  # 锦鲤（v2.2 坐骑；头朝 -Y，背顶≈0.30 与 lift 28 甲板吻合，鳍/尾挂 limbs 扇动）
    b = R.body; red = M('#ff5a3a', rough=0.35, sss=0.2); wh = M('#fff4e8', rough=0.4); gold = M('#ffd25e', emit=0.8)
    sphere('body', 0.3, loc=(0, 0, 0.14), scale=(0.8, 1.6, 0.55), m=red, parent=b, outline=OL, seg=24, rings=16)
    sphere('belly', 0.24, loc=(0, -0.04, 0.08), scale=(0.7, 1.5, 0.4), m=wh, parent=b, seg=20, rings=12)
    for y in (-0.12, 0.18): sphere('spot', 0.1, loc=(0, y, 0.29), scale=(1, 1, 0.3), m=wh, parent=b, seg=12, rings=8)
    for sx in (1, -1):
        g = empty('finp', (sx * 0.2, -0.08, 0.12), b); R.limbs.append(g)
        sphere('fin', 0.14, loc=(sx * 0.08, 0, 0), scale=(0.2, 1.2, 0.6), rot=(0, D(sx * 30), 0), m=gold, parent=g, seg=12, rings=8)
        sphere('eye', 0.045, loc=(sx * 0.13, -0.4, 0.2), m=M('#1a1010'), parent=b, seg=10, rings=8)
        sphere('hl', 0.015, loc=(sx * 0.14, -0.43, 0.22), m=M('#ffffff', emit=2.0), parent=b, seg=8, rings=6)
        tube('whisker', [(sx * 0.06, -0.48, 0.12), (sx * 0.1, -0.6, 0.06), (sx * 0.14, -0.66, 0.0)], 0.012, m=gold, parent=b)
    g = empty('tailp', (0, 0.46, 0.16), b); R.limbs.append(g)
    sphere('tail', 0.2, loc=(0, 0.1, 0.06), scale=(0.15, 0.6, 1.2), rot=(D(20), 0, 0), m=gold, parent=g, seg=14, rings=10)
    sphere('dorsal', 0.14, loc=(0, 0.12, 0.3), scale=(0.15, 1.4, 0.45), m=gold, parent=b, seg=12, rings=8)
    torus('glow', 0.5, 0.02, loc=(0, 0, 0.02), m=M('#a0e8ff', emit=4.0), parent=b, seg=40, mseg=6)

def m_abacus(R):  # 飞天算盘（v2.2 坐骑）
    b = R.body; wood = M('#7a4a2a', rough=0.5); bead = M('#c0302a', rough=0.3, spec=0.5); gold = M('#ffd25e', emit=0.6)
    for y in (-0.32, 0.32): box('rail', (1.2, 0.06, 0.06), loc=(0, y, 0.2), m=wood, parent=b)
    for x in (-0.58, 0.58): box('side', (0.06, 0.7, 0.06), loc=(x, 0, 0.2), m=wood, parent=b)
    box('beam', (1.2, 0.04, 0.05), loc=(0, 0.12, 0.2), m=gold, parent=b)
    for k in range(7):
        x = -0.45 + k * 0.15
        cyl('rod', 0.012, 0.012, 0.64, loc=(x, 0, 0.2), rot=(D(90), 0, 0), m=gold, parent=b, seg=8)
        for yy in (0.22, -0.02, -0.1, -0.18): sphere('bead', 0.05, loc=(x, yy, 0.2), scale=(1, 0.6, 1), m=bead, parent=b, seg=12, rings=8)
    torus('glow', 0.6, 0.02, loc=(0, 0, 0.05), m=M('#ffe080', emit=4.0), parent=b, seg=40, mseg=6)

def setup(kind, scale=1.2):
    """返回 rig；kind 为 chibi 规格名或怪物名"""
    if kind in MONS:
        fn, sc = MONS[kind]; R = _base(scale * sc); R.kind = kind; fn(R); return R
    raise KeyError(kind)

MONS = {'slime': (slime, 1.0), 'paper': (paper, 1.0), 'boar': (boar, 1.0), 'rock': (rock, 1.0), 'fire': (fire, 1.0), 'treant': (treant, 1.0),
        'crab': (crab, 1.0), 'ghost': (ghost, 1.0), 'tiandao': (tiandao, 1.0), 'dragon': (dragon, 1.0),
        'm_cloud': (m_cloud, 0.8), 'm_fsword': (m_fsword, 1.3), 'm_gourd': (m_gourd, 1.4), 'm_crane': (m_crane, 0.8), 'm_lotus': (m_lotus, 0.8), 'm_bowl': (m_bowl, 0.8), 'm_carp': (m_carp, 0.8), 'm_abacus': (m_abacus, 0.8)}

def mpose(R, anim, f, n):
    t = f / max(1, n); s2 = math.sin(t * 2 * math.pi)
    R.body.location = (0, 0, 0); R.body.rotation_euler = (0, 0, 0); R.body.scale = (1, 1, 1)
    for i, g in enumerate(R.limbs): g.rotation_euler = (0, 0, 0)
    if R.kind.startswith('m_'):
        R.body.location = (0, 0, 0.18 + 0.04 * s2)
        for i, g in enumerate(R.limbs): g.rotation_euler = (0, D(18 * s2 * (1 if i % 2 else -1)), 0)
        return
    if anim == 'idle':
        R.body.scale = (1 + 0.03 * s2, 1 + 0.03 * s2, 1 - 0.04 * s2)
        if R.kind in ('paper', 'ghost', 'fire', 'tiandao'): R.body.location = (0, 0, 0.05 + 0.04 * s2)
        for i, g in enumerate(R.limbs): g.rotation_euler = (D(8 * s2 * (1 if i % 2 else -1)), 0, 0)
    elif anim == 'walk':
        hop = abs(math.sin(t * 2 * math.pi))
        R.body.location = (0, 0, 0.08 * hop + (0.05 if R.kind in ('paper', 'ghost', 'fire') else 0))
        R.body.rotation_euler = (D(-6), 0, D(6 * s2))
        R.body.scale = (1 - 0.04 * hop, 1 - 0.04 * hop, 1 + 0.06 * hop)
        for i, g in enumerate(R.limbs): g.rotation_euler = (D(30 * s2 * (1 if i % 2 else -1)), 0, 0)
    elif anim == 'attack':
        k = [(0.1, -12, 0.95), (0.15, -18, 0.9), (-0.25, 20, 1.12), (-0.3, 24, 1.15), (-0.05, 5, 1.0)][f]
        R.body.location = (0, k[0], 0.05 if f == 2 else 0); R.body.rotation_euler = (D(k[1]), 0, 0); R.body.scale = (1, k[2], 2 - k[2])
        for i, g in enumerate(R.limbs): g.rotation_euler = (D(-60 if f in (2, 3) else 40), 0, 0)
    elif anim == 'hurt':
        R.body.location = (0, 0.12, 0); R.body.rotation_euler = (D(14), 0, D(-8)); R.body.scale = (1.06, 1.06, 0.9)

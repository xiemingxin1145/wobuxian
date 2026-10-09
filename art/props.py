"""建筑/树木/道具建模。每个函数在原点构建，占地 (w,h) 格，以占地中心为锚点。"""
import math, random
from lib import *
OL = 0.02
WOOD = '#8a5a3a'; DWOOD = '#5a3a22'; RED = '#c8402a'; ROOFB = '#3f5f86'; ROOFG = '#2f8a7a'; WALL = '#f2e6cc'; STONE = '#c8c4bc'; GOLD = '#ffcc40'

def roof(x, y, z, w, d, h, col, parent=None, curl=0.25, ridge=True):
    """歇山/悬山式飞檐屋顶（双坡 + 翘角）"""
    bm = bmesh.new(); n = 10
    rows = []
    for side in (-1, 1):
        row = []
        for i in range(n + 1):
            u = i / n; xx = -w / 2 - 0.15 + (w + 0.3) * u
            edge = abs(u - 0.5) * 2; lift = curl * edge ** 3
            row.append(((xx, side * (d / 2 + 0.2), lift), (xx, 0, h)))
        rows.append(row)
    vs = {}
    for si, row in enumerate(rows):
        for i, (lo, hi) in enumerate(row):
            vs[(si, i, 0)] = bm.verts.new(lo); vs[(si, i, 1)] = bm.verts.new(hi)
    for si in range(2):
        for i in range(n):
            f = (vs[(si, i, 0)], vs[(si, i + 1, 0)], vs[(si, i + 1, 1)], vs[(si, i, 1)])
            bm.faces.new(f if si == 0 else tuple(reversed(f)))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.001)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = mesh_from_bm('roof', bm); o.location = (x, y, z); bpy.context.scene.collection.objects.link(o)
    if parent: o.parent = parent
    o.data.materials.append(M(col, rough=0.45, spec=0.5))
    md = o.modifiers.new('s', 'SOLIDIFY'); md.thickness = 0.08
    for p in o.data.polygons: p.use_smooth = True
    # 瓦垄
    for i in range(1, 12):
        xx = -w / 2 + w * i / 12
        for side in (-1, 1):
            tube('tile', [(x + xx, y + side * (d / 2 + 0.2), z + 0.02), (x + xx, y + side * d / 4, z + h * 0.55 + 0.03), (x + xx, y, z + h + 0.03)], 0.025, m=M(col, rough=0.4), parent=parent)
    if ridge:
        box('ridge', (w + 0.1, 0.12, 0.1), loc=(x, y, z + h + 0.04), m=M('#3a3a3a' if col != GOLD else GOLD, rough=0.4), parent=parent, bevel=0.02)
        for s in (-1, 1):
            tube('chiwen', [(x + s * (w / 2 + 0.05), y, z + h), (x + s * (w / 2 + 0.12), y, z + h + 0.18), (x + s * (w / 2 - 0.02), y, z + h + 0.28)], 0.045, m=M(GOLD, metal=0.7, rough=0.3), parent=parent, taper=[1, 0.8, 0.3])
    return o

def pillar(x, y, h, r=0.06, col=RED, parent=None):
    cyl('pillar', r, r, h, loc=(x, y, h / 2), m=M(col, rough=0.5), parent=parent, seg=12)

def walls(w, d, h, col=WALL, parent=None):
    box('walls', (w, d, h), loc=(0, 0, h / 2), m=M(col, rough=0.8), parent=parent, bevel=0.02)
    box('base', (w + 0.12, d + 0.12, 0.12), loc=(0, 0, 0.06), m=M(STONE, rough=0.8), parent=parent, bevel=0.02)

def door(x, y, w, h, parent=None, rot=0):
    box('door', (w, 0.04, h), loc=(x, y, h / 2 + 0.1), rot=(0, 0, rot), m=M('#6a2a1a', rough=0.5), parent=parent, bevel=0.01)
    for s in (-1, 1): sphere('knob', 0.025, loc=(x + s * 0.06, y - 0.03, h * 0.55), m=M(GOLD, metal=0.8, rough=0.3), parent=parent, seg=8, rings=6)

def window(x, y, z, w, h, parent=None):
    box('win', (w, 0.04, h), loc=(x, y, z), m=M('#ffe6a8', emit=0.5, rough=0.6), parent=parent, bevel=0.005)
    for k in (-1, 0, 1): box('lat', (0.02, 0.05, h), loc=(x + k * w / 3, y, z), m=M(DWOOD), parent=parent, bevel=0)
    box('latx', (w, 0.05, 0.02), loc=(x, y, z), m=M(DWOOD), parent=parent, bevel=0)

def plaque(x, y, z, w, h, parent=None):
    box('plq', (w, 0.05, h), loc=(x, y, z), m=M('#2a3a6a', rough=0.4), parent=parent, bevel=0.01)
    box('plqb', (w + 0.06, 0.04, h + 0.06), loc=(x, y + 0.01, z), m=M(GOLD, metal=0.7, rough=0.3), parent=parent, bevel=0.01)

# ---------------- 村庄 ----------------
def house(col_roof=ROOFB, wall=WALL, w=1.6, d=1.2):
    walls(w, d, 0.9, wall)
    for x in (-w / 2, w / 2):
        for y in (-d / 2, d / 2): pillar(x, y, 0.95, 0.05, WOOD)
    door(-0.3, -d / 2 - 0.02, 0.32, 0.6); window(0.35, -d / 2 - 0.02, 0.55, 0.36, 0.28)
    window(-w / 2 - 0.02, 0, 0.55, 0.3, 0.26) if False else None
    roof(0, 0, 0.92, w, d, 0.62, col_roof)
    cyl('chimney', 0.07, 0.07, 0.3, loc=(0.5, 0.25, 1.5), m=M('#9a8a7a'), seg=8)
    box('step', (0.5, 0.2, 0.08), loc=(-0.3, -d / 2 - 0.12, 0.04), m=M(STONE), bevel=0.01)

def house2(): house(col_roof='#7a3a2a', wall='#f6ead6', w=1.5, d=1.3); lantern_obj(-0.62, -0.68, 0.8)

def lantern_obj(x, y, z, col='#ff3a2a', parent=None):
    tube('str', [(x, y, z + 0.18), (x, y, z + 0.1)], 0.006, m=M(DWOOD), parent=parent)
    sphere('lan', 0.08, loc=(x, y, z), scale=(1, 1, 1.25), m=M(col, emit=1.2, rough=0.5), parent=parent, seg=12, rings=10)
    cyl('lt', 0.05, 0.05, 0.03, loc=(x, y, z + 0.1), m=M(GOLD, metal=0.6), parent=parent, seg=8)
    cyl('lb', 0.05, 0.05, 0.03, loc=(x, y, z - 0.1), m=M(GOLD, metal=0.6), parent=parent, seg=8)

def tree_round(col='#5fb85a', trunk=WOOD, s=1.0, blossom=None, seed=1):
    r = random.Random(seed)
    tube('trunk', [(0, 0, 0), (0.03, 0, 0.4 * s), (-0.05, 0.02, 0.8 * s)], 0.1 * s, m=M(trunk, rough=0.9), taper=[1.3, 1, 0.7])
    for k in range(7):
        a = k / 7 * 6.28; rr = 0.32 * s + r.random() * 0.12
        sphere('leaf', rr, loc=(math.cos(a) * 0.28 * s, math.sin(a) * 0.28 * s, 1.0 * s + r.random() * 0.3 * s), m=M(col, rough=0.8, sheen=0.4), seg=14, rings=10, outline=0.015)
    sphere('leafT', 0.42 * s, loc=(0, 0, 1.35 * s), m=M(col, rough=0.8, sheen=0.4), seg=16, rings=10, outline=0.015)
    if blossom:
        for k in range(40):
            a = r.random() * 6.28; z = 0.9 * s + r.random() * 0.75 * s; rad = 0.45 * s + r.random() * 0.12
            sphere('fl', 0.035, loc=(math.cos(a) * rad, math.sin(a) * rad, z), m=M(blossom, emit=0.2, rough=0.6), seg=6, rings=4)

def peach(): tree_round('#ffa8c8', '#6b4226', 1.0, blossom='#ffffff', seed=3)
def oak(): tree_round('#5fb85a', WOOD, 1.1, seed=5)
def fairy_peach(): tree_round('#ffb0d0', '#8a5a3a', 1.25, blossom='#ffd25e', seed=7); [sphere('peachf', 0.07, loc=(math.cos(a) * 0.55, math.sin(a) * 0.55, 1.0 + (a % 1) * 0.4), m=M('#ff7a8a', rough=0.4), seg=10, rings=8) for a in (0.3, 1.5, 2.8, 4.2, 5.4)]

def pine(s=1.0):
    cyl('trunk', 0.08, 0.06, 0.5, loc=(0, 0, 0.25), m=M(DWOOD), seg=8)
    for k in range(4):
        z = 0.35 + k * 0.32; r = 0.55 - k * 0.11
        cyl('tier', r * s, 0.02, 0.5, loc=(0, 0, z * s + 0.2), m=M('#2e7d4f' if k % 2 else '#3a9460', rough=0.8), seg=10, outline=0.015)

def willow():
    tube('trunk', [(0, 0, 0), (0.05, 0, 0.5), (0, 0.02, 1.0)], 0.1, m=M(WOOD, rough=0.9), taper=[1.3, 1, 0.8])
    sphere('canopy', 0.5, loc=(0, 0, 1.15), scale=(1, 1, 0.7), m=M('#8fd06a', rough=0.8, sheen=0.4), outline=0.015)
    for k in range(18):
        a = k / 18 * 6.28
        tube('strand', [(math.cos(a) * 0.42, math.sin(a) * 0.42, 1.1), (math.cos(a) * 0.52, math.sin(a) * 0.52, 0.8), (math.cos(a) * 0.5, math.sin(a) * 0.5, 0.45)], 0.03, m=M('#7cc95a', rough=0.8))

def bamboo():
    r = random.Random(2)
    for k in range(6):
        x, y = r.uniform(-0.3, 0.3), r.uniform(-0.3, 0.3); h = r.uniform(1.4, 2.0)
        cyl('bam', 0.035, 0.03, h, loc=(x, y, h / 2), m=M('#5fb760', rough=0.5), seg=8)
        for z in range(1, int(h / 0.3)): torus('node', 0.036, 0.008, loc=(x, y, z * 0.3), m=M('#3e8a44'), seg=10, mseg=4)
        for z in (h * 0.7, h * 0.9):
            for s2 in (-1, 1): sphere('bl', 0.12, loc=(x + s2 * 0.12, y, z), scale=(1, 0.25, 0.08), rot=(0, s2 * D(20), r.random() * 3), m=M('#7fd06a'), seg=8, rings=6)

def well():
    lathe('wellb', [(0.3, 0), (0.32, 0.3), (0.28, 0.32), (0.24, 0.3), (0.24, 0.1)], m=M('#a8a49c', rough=0.9), seg=24)
    cyl('water', 0.24, 0.24, 0.02, loc=(0, 0, 0.18), m=M('#3a7aa8', rough=0.05), seg=20)
    for s in (-1, 1): box('post', (0.06, 0.06, 0.8), loc=(s * 0.28, 0, 0.4), m=M(DWOOD))
    roof(0, 0, 0.78, 0.7, 0.5, 0.25, '#8a5a3a', ridge=False)
    cyl('crank', 0.04, 0.04, 0.5, loc=(0, 0, 0.62), rot=(0, D(90), 0), m=M(WOOD), seg=8)

def haystack():
    lathe('hay', [(0.35, 0), (0.36, 0.2), (0.28, 0.45), (0.12, 0.62), (0.0, 0.66)], m=M('#e7c35a', rough=1.0), seg=16, outline=0.015)
    torus('band', 0.3, 0.02, loc=(0, 0, 0.3), m=M('#b8902a'), seg=16)

def fence():
    for k in range(4): box('fp', (0.05, 0.05, 0.4), loc=(-0.38 + k * 0.25, 0, 0.2), m=M(WOOD))
    for z in (0.15, 0.32): box('fr', (0.85, 0.03, 0.04), loc=(0, 0, z), m=M(WOOD))

def bush(col='#4fae5a', fl='#ff7aa8'):
    for x, y, r in ((-0.15, 0, 0.22), (0.15, 0.05, 0.25), (0, -0.1, 0.2)): sphere('bush', r, loc=(x, y, r * 0.8), m=M(col, rough=0.8, sheen=0.4), seg=12, rings=8, outline=0.012)
    for k in range(5): sphere('fl', 0.04, loc=(-0.2 + k * 0.1, -0.2, 0.3 + (k % 2) * 0.08), m=M(fl, emit=0.2), seg=6, rings=4)

def rock_prop(col='#9aa3ad', s=1.0):
    r = random.Random(4)
    for k in range(3): sphere('rk', (0.3 - k * 0.07) * s, loc=(k * 0.22 * s - 0.2, r.uniform(-0.1, 0.1), (0.18 - k * 0.04) * s), scale=(1.1, 1, 0.75), m=M(col, rough=0.9), seg=7, rings=5, outline=0.012)

def cart():
    box('bed', (0.9, 0.5, 0.15), loc=(0, 0, 0.35), m=M(WOOD))
    for s in (-1, 1): box('side', (0.9, 0.04, 0.2), loc=(0, s * 0.25, 0.5), m=M(WOOD))
    for s in (-1, 1): torus('wheel', 0.22, 0.03, loc=(0, s * 0.3, 0.22), rot=(D(90), 0, 0), m=M(DWOOD), seg=16, mseg=6)
    for k in range(3): sphere('cab', 0.12, loc=(-0.25 + k * 0.25, 0, 0.55), m=M('#ffb030' if k != 1 else '#9be15d', rough=0.6), seg=10, rings=8)

def lanternpole():
    box('pole', (0.08, 0.08, 1.6), loc=(0, 0, 0.8), m=M(DWOOD)); box('bar', (0.7, 0.06, 0.06), loc=(0, 0, 1.55), m=M(DWOOD))
    for x in (-0.28, 0.28): lantern_obj(x, 0, 1.3)

# ---------------- 宗门 ----------------
def hall():
    box('plat', (3.8, 2.8, 0.3), loc=(0, 0, 0.15), m=M('#e8e2d6', rough=0.8), bevel=0.03)
    box('stairs', (1.2, 0.5, 0.15), loc=(0, -1.6, 0.08), m=M('#d8d2c6'), bevel=0.02)
    box('body', (3.0, 2.0, 1.4), loc=(0, 0.1, 1.0), m=M(WALL, rough=0.8), bevel=0.02)
    for k in range(6): pillar(-1.45 + k * 0.58, -0.95, 1.5, 0.07, RED)
    door(0, -0.92, 0.6, 1.0); window(-0.9, -0.92, 1.0, 0.5, 0.45); window(0.9, -0.92, 1.0, 0.5, 0.45)
    roof(0, 0.1, 1.68, 3.4, 2.2, 0.9, ROOFG, curl=0.35)
    plaque(0, -1.0, 1.55, 0.7, 0.25)
    box('roof2b', (2.0, 1.2, 0.5), loc=(0, 0.1, 2.75), m=M(WALL), bevel=0.02)
    roof(0, 0.1, 2.95, 2.4, 1.4, 0.6, ROOFG, curl=0.3)
    sphere('pearl', 0.12, loc=(0, 0.1, 3.7), m=M(GOLD, metal=0.9, rough=0.2, emit=0.5))

def pagoda():
    box('base', (1.6, 1.6, 0.25), loc=(0, 0, 0.12), m=M('#e8e2d6'), bevel=0.03)
    z = 0.25
    for k, (w, h) in enumerate(((1.2, 0.8), (0.95, 0.6), (0.75, 0.5), (0.55, 0.45))):
        box('lv', (w, w, h), loc=(0, 0, z + h / 2), m=M(RED, rough=0.6), bevel=0.02)
        window(0, -w / 2 - 0.02, z + h * 0.5, w * 0.35, h * 0.45)
        roof(0, 0, z + h, w + 0.2, w + 0.2, 0.35, ROOFG, curl=0.25, ridge=False)
        z += h + 0.3
    cyl('spire', 0.05, 0.0, 0.6, loc=(0, 0, z + 0.25), m=M(GOLD, metal=0.9, rough=0.2), seg=8)
    for k in range(3): torus('sr', 0.08 - k * 0.015, 0.015, loc=(0, 0, z + 0.05 + k * 0.12), m=M(GOLD, metal=0.9), seg=12, mseg=4)

def paifang(col_roof=ROOFG, text_col='#2a3a6a'):
    for x in (-1.1, -0.4, 0.4, 1.1):
        pillar(x, 0, 1.5 if abs(x) > 1 else 1.9, 0.08, RED); box('pb', (0.25, 0.25, 0.2), loc=(x, 0, 0.1), m=M(STONE))
    box('beam', (2.5, 0.15, 0.15), loc=(0, 0, 1.55), m=M(RED)); box('beam2', (1.0, 0.15, 0.15), loc=(0, 0, 1.95), m=M(RED))
    plaque(0, -0.1, 1.75, 0.6, 0.25)
    roof(0, 0, 2.0, 1.1, 0.4, 0.35, col_roof, curl=0.2); roof(-0.75, 0, 1.6, 0.8, 0.35, 0.3, col_roof, curl=0.2, ridge=False); roof(0.75, 0, 1.6, 0.8, 0.35, 0.3, col_roof, curl=0.2, ridge=False)

def stonelamp():
    box('b', (0.3, 0.3, 0.12), loc=(0, 0, 0.06), m=M(STONE)); cyl('c', 0.06, 0.06, 0.5, loc=(0, 0, 0.35), m=M(STONE), seg=8)
    box('h', (0.3, 0.3, 0.22), loc=(0, 0, 0.7), m=M(STONE)); box('l', (0.14, 0.32, 0.12), loc=(0, 0, 0.7), m=M('#ffd060', emit=2.0))
    cyl('top', 0.26, 0.02, 0.18, loc=(0, 0, 0.9), m=M('#a8a49c'), seg=4, rot=(0, 0, D(45)))

def incense():
    lathe('ding', [(0.0, 0.2), (0.3, 0.22), (0.36, 0.4), (0.34, 0.55), (0.38, 0.58)], m=M('#b8862e', metal=0.8, rough=0.35), seg=24)
    for a in (0, 2.1, 4.2): cyl('leg', 0.04, 0.03, 0.22, loc=(math.cos(a) * 0.22, math.sin(a) * 0.22, 0.11), m=M('#8a6020', metal=0.7), seg=6)
    for s in (-1, 1): torus('ear', 0.08, 0.02, loc=(s * 0.36, 0, 0.66), rot=(D(90), 0, D(90)), m=M('#b8862e', metal=0.8), seg=12, mseg=4)
    for x in (-0.05, 0, 0.05): cyl('stick', 0.008, 0.008, 0.3, loc=(x, 0, 0.7), m=M('#c0392b'), seg=4); sphere('ember', 0.012, loc=(x, 0, 0.86), m=M('#ff6020', emit=6), seg=6, rings=4)

def mat_prop():  # 蒲团
    cyl('mat', 0.32, 0.3, 0.12, loc=(0, 0, 0.06), m=M('#d8a040', rough=0.9), seg=24)
    torus('ring', 0.28, 0.03, loc=(0, 0, 0.12), m=M('#b8802a'), seg=24)

def dummy():
    cyl('post', 0.05, 0.05, 1.0, loc=(0, 0, 0.5), m=M(WOOD), seg=8)
    cyl('torso', 0.18, 0.16, 0.45, loc=(0, 0, 0.75), m=M('#d8b880', rough=0.9), seg=12)
    sphere('head', 0.14, loc=(0, 0, 1.1), m=M('#d8b880', rough=0.9))
    box('arm', (0.7, 0.06, 0.06), loc=(0, 0, 0.85), m=M(WOOD))

def crane_statue():
    box('ped', (0.4, 0.4, 0.3), loc=(0, 0, 0.15), m=M(STONE), bevel=0.02)
    sphere('cb', 0.2, loc=(0, 0, 0.55), scale=(1.4, 0.8, 0.8), m=M('#ffffff', rough=0.5))
    tube('neck', [(0.2, 0, 0.6), (0.3, 0, 0.85), (0.25, 0, 1.05)], 0.035, m=M('#ffffff'))
    sphere('ch', 0.06, loc=(0.25, 0, 1.08), m=M('#e02020'))
    for s in (-1, 1): sphere('wing', 0.2, loc=(-0.05, s * 0.15, 0.6), scale=(1.5, 0.3, 0.7), rot=(s * D(20), 0, 0), m=M('#f0f0f0'))
    for s in (-1, 1): cyl('leg', 0.012, 0.012, 0.25, loc=(0, s * 0.05, 0.35), m=M('#202020'), seg=4)

def bell():
    for s in (-1, 1): box('post', (0.1, 0.1, 1.4), loc=(s * 0.45, 0, 0.7), m=M(RED))
    box('beam', (1.1, 0.12, 0.12), loc=(0, 0, 1.4), m=M(RED))
    lathe('bell', [(0.3, 0.55), (0.26, 0.7), (0.22, 1.0), (0.18, 1.15), (0.0, 1.2)], m=M('#7a8a5a', metal=0.8, rough=0.4), seg=20)
    roof(0, 0, 1.45, 1.2, 0.5, 0.3, ROOFG, curl=0.2)

# ---------------- 坊市 ----------------
def shop(roofc='#5b3a8a', sign='丹'):
    walls(1.6, 1.2, 1.0, '#f9e3c0')
    for x in (-0.8, 0.8): pillar(x, -0.62, 1.05, 0.06, RED)
    box('counter', (1.0, 0.3, 0.45), loc=(0.1, -0.75, 0.23), m=M(WOOD))
    for k in range(4): lathe('jar', [(0.0, 0), (0.07, 0.02), (0.08, 0.12), (0.04, 0.18)], loc=(-0.25 + k * 0.2, -0.75, 0.46), m=M(['#a0c4ff', '#ffd25e', '#ff8fab', '#9be15d'][k], rough=0.3), seg=12)
    plaque(0, -0.63, 0.88, 0.8, 0.2)
    roof(0, 0, 1.02, 1.6, 1.2, 0.6, roofc, curl=0.3)
    for x in (-0.85, 0.85): lantern_obj(x, -0.7, 0.85)

def shop2(): shop('#2f6a8a')
def teahouse():
    walls(2.4, 1.6, 0.9, '#f6ead6')
    box('floor2', (2.6, 1.8, 0.1), loc=(0, 0, 0.95), m=M(WOOD))
    box('walls2', (2.2, 1.4, 0.7), loc=(0, 0, 1.35), m=M('#f6ead6'), bevel=0.02)
    for k in range(5): pillar(-1.2 + k * 0.6, -0.82, 0.95, 0.05, RED)
    for k in range(4): window(-0.75 + k * 0.5, -0.72, 1.35, 0.35, 0.35)
    door(0, -0.82, 0.5, 0.7)
    roof(0, 0, 1.68, 2.4, 1.6, 0.7, '#7a3a2a', curl=0.35)
    box('railing', (2.6, 0.04, 0.2), loc=(0, -0.92, 1.1), m=M(RED))
    plaque(0, -0.75, 1.78, 0.6, 0.2)
    for x in (-1.25, 1.25): lantern_obj(x, -0.95, 1.6)

def stall(col='#ff6b6b'):
    box('table', (0.8, 0.5, 0.42), loc=(0, 0, 0.21), m=M(WOOD), bevel=0.02)
    box('cloth', (0.84, 0.54, 0.04), loc=(0, 0, 0.44), m=M('#f4ead0', rough=0.9))
    cyl('pole', 0.025, 0.025, 1.2, loc=(0.0, 0.0, 0.6), m=M(DWOOD), seg=8)
    lathe('umb', [(0.75, 1.05), (0.55, 1.15), (0.25, 1.24), (0.0, 1.28)], m=M(col, rough=0.6, sheen=0.3), seg=24, close_top=False)
    md = bpy.context.scene.objects[-1] if False else None
    r = random.Random(len(col))
    for k in range(5): sphere('good', 0.06, loc=(-0.3 + k * 0.15, r.uniform(-0.12, 0.12), 0.52), m=M(['#ffd25e', '#9be15d', '#ff8fab', '#a0c4ff', '#ffb070'][k], rough=0.4), seg=10, rings=8)

def stall_r(): stall('#ff6b6b')
def stall_y(): stall('#ffc93d')
def stall_b(): stall('#4d96ff')
def crates():
    box('c1', (0.4, 0.4, 0.4), loc=(-0.15, 0, 0.2), m=M('#d9a066'), bevel=0.02); box('c2', (0.32, 0.32, 0.32), loc=(0.25, 0.1, 0.16), m=M('#c99056'), bevel=0.02)
    box('c3', (0.3, 0.3, 0.3), loc=(-0.1, 0.05, 0.55), m=M('#e6b07a'), bevel=0.02)
    lathe('jar', [(0.0, 0), (0.12, 0.05), (0.15, 0.25), (0.08, 0.4), (0.09, 0.45)], loc=(0.25, -0.25, 0), m=M('#8a5a3a', rough=0.4), seg=16)

def furnace():  # 炼丹炉
    lathe('fbody', [(0.0, 0.25), (0.42, 0.3), (0.5, 0.55), (0.46, 0.85), (0.3, 0.95), (0.32, 1.0)], m=M('#b8862e', metal=0.85, rough=0.3), seg=32, outline=0.015)
    for a in (0, 2.1, 4.2): cyl('leg', 0.06, 0.05, 0.3, loc=(math.cos(a) * 0.3, math.sin(a) * 0.3, 0.15), m=M('#8a6020', metal=0.7), seg=8)
    lathe('lid', [(0.32, 1.0), (0.28, 1.12), (0.12, 1.25), (0.0, 1.3)], m=M('#d8a040', metal=0.85, rough=0.3), seg=24)
    sphere('knob', 0.08, loc=(0, 0, 1.36), m=M('#ffcc40', metal=0.9, rough=0.2))
    box('door', (0.22, 0.04, 0.16), loc=(0, -0.46, 0.55), m=M('#ff6a1a', emit=4.0))
    for s in (-1, 1): torus('ear', 0.1, 0.025, loc=(s * 0.5, 0, 0.85), rot=(D(90), 0, D(90)), m=M('#b8862e', metal=0.8), seg=12, mseg=4)

def noticeboard():
    for s in (-1, 1): box('p', (0.08, 0.08, 1.3), loc=(s * 0.45, 0, 0.65), m=M(DWOOD))
    box('board', (0.9, 0.06, 0.7), loc=(0, 0, 0.85), m=M(WOOD))
    for k in range(4): box('note', (0.18, 0.01, 0.24), loc=(-0.3 + k * 0.2, -0.04, 0.85 + (k % 2) * 0.1), m=M('#f6efd8', rough=0.9))
    roof(0, 0, 1.25, 1.0, 0.3, 0.2, '#7a3a2a', ridge=False)

# ---------------- 秘境 ----------------
def portal():
    for s in (-1, 1): box('col', (0.3, 0.3, 1.8), loc=(s * 0.75, 0, 0.9), m=M('#7a6aa8', rough=0.7), bevel=0.03)
    torus('arch', 0.8, 0.12, loc=(0, 0, 1.75), rot=(D(90), 0, 0), m=M('#5a4a88'), arc=0.5, seg=24, mseg=8)
    cyl('vortex', 0.65, 0.65, 0.04, loc=(0, 0, 1.0), rot=(D(90), 0, 0), scale=(1, 1.4, 1), m=M('#c080ff', emit=3.0, rough=0.1), seg=32)
    for s in (-1, 1): sphere('gem', 0.1, loc=(s * 0.75, -0.16, 1.5), m=M('#ff80ff', emit=4.0), seg=10, rings=8)

def crystal(col='#b18cff'):
    r = random.Random(len(col) * 7)
    for k in range(5):
        h = r.uniform(0.4, 1.1); a = r.uniform(-0.4, 0.4)
        cyl('cr', 0.12, 0.0, h, loc=(r.uniform(-0.2, 0.2), r.uniform(-0.2, 0.2), h / 2 - 0.05), rot=(a, r.uniform(-0.3, 0.3), 0), m=M(col, emit=1.2, rough=0.1, spec=0.9), seg=6, smooth=False)

def crystal_b(): crystal('#7fd3ff')
def crystal_r(): crystal('#ff4a6a')

def deadtree():
    tube('t', [(0, 0, 0), (0.05, 0, 0.6), (-0.1, 0, 1.0), (-0.3, 0.05, 1.3)], 0.1, m=M('#4a3a4a', rough=0.9), taper=[1.4, 1, 0.7, 0.2])
    tube('b1', [(0.03, 0, 0.7), (0.3, 0, 1.0), (0.45, 0.05, 1.25)], 0.05, m=M('#4a3a4a'), taper=[1, 0.6, 0.1])
    tube('b2', [(-0.05, 0, 0.9), (-0.1, 0.25, 1.15), (-0.05, 0.4, 1.3)], 0.04, m=M('#4a3a4a'), taper=[1, 0.6, 0.1])

def mushroom():
    for x, y, s, c in ((-0.1, 0, 1.0, '#ff5ad0'), (0.18, 0.1, 0.65, '#5affd0'), (0.05, -0.2, 0.5, '#ffd05a')):
        cyl('stem', 0.05 * s, 0.06 * s, 0.3 * s, loc=(x, y, 0.15 * s), m=M('#f4f0e8'), seg=10)
        sphere('cap', 0.2 * s, loc=(x, y, 0.3 * s), scale=(1, 1, 0.55), m=M(c, emit=0.8, rough=0.4), seg=16, rings=8, outline=0.01)

def torch():
    cyl('t', 0.05, 0.04, 0.9, loc=(0, 0, 0.45), m=M('#4a3a5a'), seg=8); lathe('bowl', [(0.04, 0.85), (0.14, 0.95), (0.16, 1.0)], m=M('#6a5a7a', metal=0.6), seg=12, close_top=False)
    cyl('flame', 0.1, 0.0, 0.3, loc=(0, 0, 1.12), m=M('#ffa030', emit=6.0), seg=10); sphere('f2', 0.08, loc=(0, 0, 1.02), m=M('#fff070', emit=8.0), seg=8, rings=6)

def ruin():
    cyl('col', 0.18, 0.18, 1.1, loc=(0, 0, 0.55), m=M('#9a92b0', rough=0.9), seg=10, rot=(D(4), D(3), 0))
    box('cap', (0.45, 0.45, 0.12), loc=(0, 0, 1.15), m=M('#8a82a0'), bevel=0.02)
    box('broken', (0.4, 0.3, 0.2), loc=(0.35, 0.2, 0.1), rot=(0.2, 0.1, 0.4), m=M('#8a82a0'), bevel=0.02)

def chest():
    box('cb', (0.5, 0.35, 0.3), loc=(0, 0, 0.15), m=M('#8a4a2a', rough=0.5), bevel=0.02)
    cyl('lid', 0.175, 0.175, 0.5, loc=(0, 0, 0.3), rot=(0, D(90), 0), scale=(1, 1, 1), m=M('#9a5a3a'), seg=16)
    for x in (-0.18, 0.18): box('band', (0.05, 0.37, 0.48), loc=(x, 0, 0.24), m=M(GOLD, metal=0.8, rough=0.3), bevel=0.005)
    box('lock', (0.08, 0.04, 0.1), loc=(0, -0.19, 0.3), m=M(GOLD, metal=0.9, rough=0.2))

def herb():
    for k in range(5):
        a = k / 5 * 6.28; sphere('lf', 0.1, loc=(math.cos(a) * 0.1, math.sin(a) * 0.1, 0.08), scale=(1.5, 0.5, 0.3), rot=(0, D(20), a), m=M('#4fbf5a'), seg=8, rings=6)
    cyl('st', 0.012, 0.012, 0.3, loc=(0, 0, 0.18), m=M('#3f9f3a'), seg=6)
    sphere('berry', 0.06, loc=(0, 0, 0.36), m=M('#ff3a6a', emit=1.5, rough=0.2))

# ---------------- 乱葬岗 ----------------
def tomb():
    box('st', (0.45, 0.14, 0.7), loc=(0, 0.1, 0.35), m=M('#8a8a90', rough=0.9), bevel=0.04)
    cyl('top', 0.225, 0.225, 0.14, loc=(0, 0.1, 0.7), rot=(D(90), 0, 0), m=M('#8a8a90'), seg=16)
    sphere('mound', 0.38, loc=(0, -0.3, 0.0), scale=(1, 1.3, 0.45), m=M('#6a5a4a', rough=1.0), seg=16, rings=8)
    box('fu', (0.08, 0.01, 0.2), loc=(0.1, 0.02, 0.45), rot=(0, 0, D(10)), m=M('#ffd84a', emit=0.3))

def grave_mound():
    sphere('mound', 0.45, loc=(0, 0, 0.0), scale=(1, 1, 0.5), m=M('#5a4a3a', rough=1.0), seg=16, rings=8, outline=0.01)
    box('board', (0.08, 0.04, 0.5), loc=(0, 0.2, 0.3), rot=(D(-8), 0, D(5)), m=M('#8a7a6a'))

def coffin():
    box('cof', (0.9, 0.4, 0.35), loc=(0, 0, 0.2), rot=(0, 0, D(10)), m=M('#4a2a1a', rough=0.5), bevel=0.04)
    box('lid', (0.95, 0.44, 0.08), loc=(0.05, 0.05, 0.42), rot=(0, D(-6), D(18)), m=M('#5a3a2a', rough=0.5), bevel=0.03)
    box('fu', (0.08, 0.01, 0.22), loc=(0, -0.21, 0.25), rot=(0, 0, D(10)), m=M('#ffd84a', emit=0.4))

def white_lantern(): box('p', (0.06, 0.06, 1.3), loc=(0, 0, 0.65), m=M('#3a3a3a')); lantern_obj(0.0, -0.08, 1.05, '#f0f0e8')
def stele():
    box('base', (0.6, 0.4, 0.2), loc=(0, 0, 0.1), m=M('#7a7a80'), bevel=0.02)
    sphere('turtle', 0.3, loc=(0, 0, 0.25), scale=(1.2, 1.0, 0.5), m=M('#6a6a70', rough=0.9))
    box('st', (0.45, 0.12, 1.1), loc=(0, 0, 0.85), m=M('#8a8a90', rough=0.8), bevel=0.03)

# ---------------- 东海仙岛 ----------------
def palm():
    tube('trunk', [(0, 0, 0), (0.1, 0, 0.6), (0.3, 0, 1.2), (0.45, 0, 1.6)], 0.08, m=M('#9a7a5a', rough=0.9), taper=[1.3, 1, 0.9, 0.8])
    for k in range(7):
        a = k / 7 * 6.28; tube('frond', [(0.45, 0, 1.62), (0.45 + math.cos(a) * 0.4, math.sin(a) * 0.4, 1.75), (0.45 + math.cos(a) * 0.75, math.sin(a) * 0.75, 1.45)], 0.08, m=M('#4fb85a', rough=0.7), taper=[0.4, 1, 0.2])
    for k in range(3): sphere('coco', 0.07, loc=(0.42 + 0.06 * math.cos(k * 2), 0.06 * math.sin(k * 2), 1.52), m=M('#6a4a2a'), seg=8, rings=6)

def coral():
    r = random.Random(9)
    for k in range(6):
        a = r.uniform(0, 6.28); tube('cor', [(0, 0, 0), (math.cos(a) * 0.12, math.sin(a) * 0.12, 0.3), (math.cos(a) * 0.2, math.sin(a) * 0.2, 0.55)], 0.05, m=M(['#ff7a8a', '#ffb070', '#c07aff'][k % 3], rough=0.5, sss=0.2), taper=[1, 0.8, 0.4])
    for k in range(3): sphere('shell', 0.07, loc=(r.uniform(-0.3, 0.3), r.uniform(-0.3, 0.3), 0.03), scale=(1, 1, 0.5), m=M('#fff0e0', rough=0.4), seg=8, rings=6)

def boat():
    lathe('hull', [(0.0, 0.0), (0.3, 0.1), (0.35, 0.3)], scale=(2.2, 0.8, 1), m=M('#8a5a3a', rough=0.6), seg=24, close_top=False)
    box('cabin', (0.6, 0.4, 0.3), loc=(0, 0, 0.4), m=M(WOOD)); roof(0, 0, 0.55, 0.7, 0.5, 0.25, '#4a4a3a', ridge=False)
    cyl('mast', 0.03, 0.03, 1.4, loc=(0.4, 0, 0.9), m=M(DWOOD), seg=6)
    box('sail', (0.03, 0.6, 0.8), loc=(0.42, 0, 1.0), m=M('#f4ead0', rough=0.9))

def pavilion(rc='#2f6a8a'):
    box('plat', (1.6, 1.6, 0.2), loc=(0, 0, 0.1), m=M('#e8e2d6'), bevel=0.03)
    for x in (-0.65, 0.65):
        for y in (-0.65, 0.65): pillar(x, y, 1.2, 0.06, RED)
    box('rail', (1.3, 0.04, 0.2), loc=(0, 0.65, 0.4), m=M(RED)); box('table', (0.4, 0.4, 0.4), loc=(0, 0, 0.4), m=M(STONE))
    lathe('roof', [(1.15, 1.2), (0.95, 1.35), (0.5, 1.6), (0.0, 1.85)], m=M(rc, rough=0.45, spec=0.5), seg=6, rot=(0, 0, D(30)), close_top=False)
    cyl('top', 0.06, 0.0, 0.3, loc=(0, 0, 1.95), m=M(GOLD, metal=0.9), seg=8)

def big_furnace():  # 丹鼎派大丹炉
    box('plat', (2.0, 2.0, 0.3), loc=(0, 0, 0.15), m=M('#d8d2c6'), bevel=0.03)
    lathe('fbody', [(0.0, 0.3), (0.8, 0.4), (0.95, 0.9), (0.85, 1.5), (0.55, 1.7), (0.6, 1.8)], m=M('#c0702a', metal=0.85, rough=0.3), seg=32, outline=0.02)
    lathe('lid', [(0.6, 1.8), (0.5, 2.0), (0.2, 2.25), (0.0, 2.35)], m=M('#ffcc40', metal=0.9, rough=0.25), seg=32)
    for a in (0, 2.1, 4.2): cyl('leg', 0.12, 0.1, 0.4, loc=(math.cos(a) * 0.55, math.sin(a) * 0.55, 0.45), m=M('#8a5020', metal=0.7), seg=8)
    box('fire', (0.4, 0.05, 0.3), loc=(0, -0.9, 0.95), m=M('#ff5a1a', emit=5.0))
    sphere('smoke1', 0.2, loc=(0.1, 0, 2.6), m=M('#ffffff', alpha=0.6, rough=1), seg=10, rings=8); sphere('smoke2', 0.28, loc=(0.25, 0.05, 2.95), m=M('#ffffff', rough=1), seg=10, rings=8)

def shell_rock(): rock_prop('#d8c8a8', 1.1); [sphere('sh', 0.06, loc=(0.3, -0.25 + k * 0.1, 0.03), scale=(1, 1, 0.4), m=M('#ffd0c0'), seg=8, rings=6) for k in range(3)]

# ---------------- 魔道裂谷 ----------------
def obelisk():
    cyl('ob', 0.28, 0.1, 2.0, loc=(0, 0, 1.0), m=M('#2a1a2a', rough=0.4, spec=0.7), seg=4, rot=(0, 0, D(45)), smooth=False)
    for z in (0.6, 1.1, 1.5): box('rune', (0.12, 0.01, 0.1), loc=(0, -0.2 + z * 0.04, z), m=M('#ff3050', emit=4.0))
    sphere('orb', 0.12, loc=(0, 0, 2.15), m=M('#ff2040', emit=6.0))

def lavarock():
    rock_prop('#3a2a2a', 1.2)
    for k in range(4): sphere('glow', 0.05, loc=(-0.2 + k * 0.15, -0.2, 0.15 + (k % 2) * 0.1), m=M('#ff5a1a', emit=6), seg=6, rings=4)

def bonespike():
    r = random.Random(3)
    for k in range(5):
        a = r.uniform(0, 6.28); cyl('spk', 0.07, 0.0, r.uniform(0.6, 1.2), loc=(math.cos(a) * 0.2, math.sin(a) * 0.2, 0.4), rot=(math.cos(a) * 0.4, math.sin(a) * 0.4, 0), m=M('#e8e0d0', rough=0.5), seg=8)

def demon_hall():
    box('plat', (3.6, 2.8, 0.3), loc=(0, 0, 0.15), m=M('#3a2a3a'), bevel=0.03)
    box('body', (2.8, 2.0, 1.5), loc=(0, 0.1, 1.05), m=M('#4a3040', rough=0.7), bevel=0.02)
    for k in range(5): pillar(-1.3 + k * 0.65, -0.95, 1.6, 0.08, '#1a1018')
    box('door', (0.7, 0.05, 1.1), loc=(0, -0.92, 0.85), m=M('#ff3040', emit=2.0))
    roof(0, 0.1, 1.8, 3.2, 2.2, 0.9, '#2a1a2a', curl=0.5)
    plaque(0, -1.0, 1.65, 0.7, 0.25)
    for s in (-1, 1): tube('horn', [(s * 1.6, -1.1, 1.85), (s * 1.9, -1.2, 2.3), (s * 1.8, -1.0, 2.7)], 0.1, m=M('#e8e0d0'), taper=[1, 0.6, 0.1])
    for s in (-1, 1): torch_at(s * 1.7, -1.3)

def torch_at(x, y):
    cyl('t', 0.05, 0.04, 0.9, loc=(x, y, 0.45), m=M('#2a1a2a'), seg=8); cyl('fl', 0.1, 0.0, 0.3, loc=(x, y, 1.05), m=M('#ff4020', emit=6.0), seg=8)

def altar():
    box('a', (1.2, 1.2, 0.3), loc=(0, 0, 0.15), m=M('#3a2a3a'), bevel=0.03); box('a2', (0.8, 0.8, 0.3), loc=(0, 0, 0.45), m=M('#4a3a4a'), bevel=0.03)
    sphere('skull', 0.18, loc=(0, 0, 0.75), m=M('#e8e0d0', rough=0.5))
    for s in (-1, 1): sphere('se', 0.04, loc=(s * 0.06, -0.15, 0.78), m=M('#ff2040', emit=6), seg=6, rings=4)
    torus('ring', 0.55, 0.03, loc=(0, 0, 0.62), m=M('#ff3050', emit=3.0), seg=32, mseg=6)

# ---------------- 天外天 ----------------
def cloud_pillar():
    cyl('cp', 0.22, 0.22, 2.0, loc=(0, 0, 1.0), m=M('#fffaf0', rough=0.4), seg=16)
    for z in (0.3, 1.0, 1.7): torus('band', 0.23, 0.04, loc=(0, 0, z), m=M(GOLD, metal=0.9, rough=0.2), seg=20, mseg=6)
    tube('dragon', [(0.25, 0, 0.2), (0, 0.25, 0.6), (-0.25, 0, 1.0), (0, -0.25, 1.4), (0.25, 0, 1.8)], 0.05, m=M(GOLD, metal=0.9, rough=0.25))
    for k in range(4): sphere('cl', 0.25, loc=(math.cos(k * 1.6) * 0.25, math.sin(k * 1.6) * 0.25, 0.05), m=M('#ffffff', rough=0.9), seg=10, rings=8)

def tianmen():
    for s in (-1, 1):
        box('tower', (0.7, 0.7, 2.6), loc=(s * 1.4, 0, 1.3), m=M('#fff6e0', rough=0.6), bevel=0.04)
        roof(s * 1.4, 0, 2.6, 0.9, 0.9, 0.5, GOLD, curl=0.3)
    box('lintel', (2.2, 0.5, 0.4), loc=(0, 0, 2.3), m=M('#fff6e0'), bevel=0.03)
    roof(0, 0, 2.5, 2.4, 0.7, 0.6, GOLD, curl=0.4)
    plaque(0, -0.27, 2.3, 0.9, 0.28)
    cyl('glow', 0.9, 0.9, 0.03, loc=(0, 0, 1.1), rot=(D(90), 0, 0), scale=(1, 1.2, 1), m=M('#fff2b0', emit=3.0), seg=32)
    for k in range(6): sphere('cl', 0.35, loc=(-1.8 + k * 0.72, -0.2, 0.1), m=M('#ffffff', rough=0.9), seg=12, rings=8)

def debt_office():  # 天道讨债司
    walls(2.2, 1.6, 1.2, '#fff6e0')
    for k in range(4): pillar(-1.05 + k * 0.7, -0.82, 1.25, 0.07, '#d84030')
    door(0, -0.82, 0.55, 0.85); window(-0.7, -0.82, 0.75, 0.35, 0.35); window(0.7, -0.82, 0.75, 0.35, 0.35)
    roof(0, 0, 1.22, 2.2, 1.6, 0.8, GOLD, curl=0.35)
    plaque(0, -0.88, 1.15, 0.8, 0.22)
    box('abacus', (0.9, 0.08, 0.4), loc=(0, -0.95, 2.25), m=M('#8a5a2a'), bevel=0.02)
    for i in range(8): sphere('bd', 0.04, loc=(-0.36 + i * 0.1, -1.0, 2.25), m=M(GOLD, metal=0.9), seg=8, rings=6)

def jade_platform():
    cyl('jp', 0.9, 0.9, 0.2, loc=(0, 0, 0.1), m=M('#8fe0c0', rough=0.15, sss=0.3), seg=8, smooth=False)
    torus('jr', 0.85, 0.04, loc=(0, 0, 0.21), m=M(GOLD, metal=0.9), seg=8, mseg=6)
    for k in range(8): sphere('j', 0.06, loc=(math.cos(k * 0.785) * 0.7, math.sin(k * 0.785) * 0.7, 0.24), m=M('#ffffff', emit=2.0), seg=6, rings=4)

def cloud_puff():
    for x, y, z, r in ((0, 0, 0.3, 0.45), (0.45, 0.1, 0.22, 0.35), (-0.45, 0.05, 0.2, 0.34), (0.15, -0.2, 0.15, 0.3)): sphere('cl', r, loc=(x, y, z), m=M('#ffffff', rough=0.9, sss=0.2), seg=14, rings=10)

def sundisk():
    cyl('pole', 0.06, 0.06, 1.6, loc=(0, 0, 0.8), m=M(GOLD, metal=0.9), seg=8)
    cyl('disk', 0.5, 0.5, 0.06, loc=(0, 0, 1.9), rot=(D(90), 0, D(-45)), m=M('#ffe070', emit=3.0, metal=0.5), seg=32)

# 名称 → (函数, 占地w, 占地h)
PROPS = {
    'house': (house, 2, 2), 'house2': (house2, 2, 2), 'peach': (peach, 1, 1), 'oak': (oak, 1, 1), 'pine': (pine, 1, 1), 'willow': (willow, 1, 1), 'bamboo': (bamboo, 1, 1),
    'well': (well, 1, 1), 'haystack': (haystack, 1, 1), 'fence': (fence, 1, 1), 'bush': (bush, 1, 1), 'rock': (rock_prop, 1, 1), 'cart': (cart, 1, 1), 'lanternpole': (lanternpole, 1, 1),
    'hall': (hall, 4, 3), 'pagoda': (pagoda, 2, 2), 'paifang': (paifang, 3, 1), 'stonelamp': (stonelamp, 1, 1), 'incense': (incense, 1, 1), 'mat': (mat_prop, 1, 1),
    'dummy': (dummy, 1, 1), 'crane': (crane_statue, 1, 1), 'bell': (bell, 1, 1),
    'shop': (shop, 2, 2), 'shop2': (shop2, 2, 2), 'teahouse': (teahouse, 3, 2), 'stall_r': (stall_r, 1, 1), 'stall_y': (stall_y, 1, 1), 'stall_b': (stall_b, 1, 1),
    'crates': (crates, 1, 1), 'furnace': (furnace, 1, 1), 'noticeboard': (noticeboard, 1, 1),
    'portal': (portal, 2, 1), 'crystal': (crystal, 1, 1), 'crystal_b': (crystal_b, 1, 1), 'crystal_r': (crystal_r, 1, 1), 'deadtree': (deadtree, 1, 1), 'mushroom': (mushroom, 1, 1),
    'torch': (torch, 1, 1), 'ruin': (ruin, 1, 1), 'chest': (chest, 1, 1), 'herb': (herb, 1, 1),
    'tomb': (tomb, 1, 1), 'grave': (grave_mound, 1, 1), 'coffin': (coffin, 1, 1), 'wlantern': (white_lantern, 1, 1), 'stele': (stele, 1, 1),
    'palm': (palm, 1, 1), 'coral': (coral, 1, 1), 'boat': (boat, 2, 1), 'pavilion': (pavilion, 2, 2), 'bigfurnace': (big_furnace, 2, 2), 'shellrock': (shell_rock, 1, 1),
    'obelisk': (obelisk, 1, 1), 'lavarock': (lavarock, 1, 1), 'bonespike': (bonespike, 1, 1), 'demonhall': (demon_hall, 4, 3), 'altar': (altar, 1, 1),
    'cloudpillar': (cloud_pillar, 1, 1), 'tianmen': (tianmen, 4, 1), 'debtoffice': (debt_office, 3, 2), 'jade': (jade_platform, 2, 2), 'cloudpuff': (cloud_puff, 1, 1), 'sundisk': (sundisk, 1, 1),
    'fairypeach': (fairy_peach, 1, 1),
}

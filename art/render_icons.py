"""物品 / 技能图标（3D 建模渲染，128x128）"""
import sys, os, math, time; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
from mathutils import Vector
a = args()
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'icons'); os.makedirs(out, exist_ok=True)
S0 = 128
RAR = {'w': '#d8d8d8', 'g': '#5adf6a', 'b': '#4aa8ff', 'p': '#b06aff', 'o': '#ffa62a'}

def pill(c):
    def f():
        sphere('pill', 0.3, m=M(c, rough=0.18, emit=0.25), seg=32, rings=16)
        sphere('hl', 0.08, loc=(-0.1, -0.18, 0.16), m=M('#ffffff', emit=2.0), seg=10, rings=6)
        for k in range(3): sphere('pt', 0.12, loc=(math.cos(k * 2.1) * 0.42, math.sin(k * 2.1) * 0.42, -0.2), m=M(c, rough=0.2), seg=16, rings=10)
    return f
def gem(c):
    def f():
        o = sphere('gem', 0.4, m=M(c, rough=0.05, emit=0.8), seg=6, rings=3, scale=(1, 1, 1.4))
        for p in o.data.polygons: p.use_smooth = False
    return f
def sword(c, big=False):
    def f():
        g = empty('s', rot=None) if False else empty('s')
        L = 1.5 if big else 1.2
        box('blade', (0.13, 0.03, L), loc=(0, 0, L / 2 + 0.12), m=M('#e8f0ff', metal=0.9, rough=0.15), parent=g, bevel=0.01)
        cyl('tip', 0.09, 0.0, 0.16, loc=(0, 0, L + 0.2), m=M('#e8f0ff', metal=0.9, rough=0.15), parent=g, seg=4, scale=(1, 0.3, 1))
        box('guard', (0.42, 0.1, 0.07), loc=(0, 0, 0.1), m=M(c, metal=0.6, rough=0.3, emit=0.5), parent=g)
        cyl('grip', 0.04, 0.04, 0.32, loc=(0, 0, -0.08), m=M('#5a3a2a'), parent=g, seg=10)
        sphere('pom', 0.07, loc=(0, 0, -0.26), m=M(c, emit=1.0), parent=g, seg=12, rings=8)
        box('glow', (0.15, 0.005, L * 0.9), loc=(0, -0.02, L / 2 + 0.15), m=M(c, emit=3.0), parent=g, bevel=0)
        g.rotation_euler = (0, D(45), 0)
    return f
def robe(c, c2):
    def f():
        lathe('robe', [(0.0, 0.0), (0.45, 0.0), (0.38, 0.3), (0.3, 0.6), (0.24, 0.8), (0.0, 0.85)], m=M(c, rough=0.7), seg=32)
        torus('belt', 0.32, 0.04, loc=(0, 0, 0.45), m=M(c2, metal=0.5, rough=0.3))
        for s in (-1, 1): cyl('sl', 0.13, 0.2, 0.5, loc=(s * 0.38, 0, 0.5), rot=(0, D(s * 50), 0), m=M(c, rough=0.7), seg=16)
        box('collar', (0.18, 0.02, 0.35), loc=(0, -0.3, 0.62), m=M(c2), rot=(D(-15), 0, 0), bevel=0.0)
    return f
def ring(c):
    def f():
        torus('ring', 0.32, 0.06, m=M('#ffd25e', metal=0.9, rough=0.2), rot=(D(70), 0, 0))
        sphere('gem', 0.13, loc=(0, 0, 0.36), m=M(c, rough=0.05, emit=1.0), seg=6, rings=3)
    return f
def orb(c, c2):
    def f():
        sphere('orb', 0.4, m=M(c, rough=0.1, emit=1.8), seg=32, rings=16)
        torus('ringA', 0.55, 0.025, m=M(c2, emit=3.0), rot=(D(70), D(20), 0))
        torus('ringB', 0.6, 0.02, m=M(c2, emit=3.0), rot=(D(-60), D(40), 0))
        for k in range(5): sphere('sp', 0.05, loc=(math.cos(k * 1.3) * 0.7, math.sin(k * 1.3) * 0.5, math.sin(k * 2.1) * 0.5), m=M(c2, emit=4.0), seg=8, rings=5)
    return f
def book(c):
    def f():
        box('cover', (0.62, 0.86, 0.14), m=M(c, rough=0.6), bevel=0.02)
        box('pages', (0.56, 0.82, 0.1), loc=(0.04, 0, 0), m=M('#f6efd8'), bevel=0.0)
        box('label', (0.2, 0.5, 0.01), loc=(0.05, 0, 0.075), m=M('#f6efd8'), bevel=0)
        for k in range(4): box('bind', (0.02, 0.02, 0.16), loc=(-0.3, -0.3 + k * 0.2, 0), m=M('#3a2a20'), bevel=0)
    return f
def gourd(c):
    def f(): lathe('gourd', [(0.0, -0.45), (0.3, -0.35), (0.33, -0.18), (0.16, 0.02), (0.22, 0.15), (0.18, 0.32), (0.05, 0.4), (0.04, 0.52)], m=M(c, rough=0.3), seg=28); torus('str', 0.15, 0.03, loc=(0, 0, 0.04), m=M('#c0302a'))
    return f
def lingcao():
    for k in range(6):
        a_ = k * 1.05; cyl('leaf', 0.12, 0.0, 0.6, loc=(math.cos(a_) * 0.12, math.sin(a_) * 0.12, 0.25), rot=(math.sin(a_) * 0.6, -math.cos(a_) * 0.6, 0), m=M('#4ad06a', rough=0.5), seg=8, scale=(1, 0.3, 1))
    sphere('bud', 0.1, loc=(0, 0, 0.55), m=M('#ff7ab0', emit=1.5), seg=12, rings=8); cyl('soil', 0.3, 0.25, 0.1, loc=(0, 0, 0), m=M('#7a5a3a'))
def lingzhi():
    cyl('stem', 0.06, 0.08, 0.4, loc=(0, 0, 0.2), m=M('#a05a2a'), seg=12)
    o = sphere('cap', 0.42, loc=(0, 0, 0.42), scale=(1, 1, 0.35), m=M('#b0402a', rough=0.35)); torus('rim', 0.38, 0.04, loc=(0, 0, 0.42), scale=(1, 1, 0.5), m=M('#ffb040'))
def ore():
    for k, (x, y, h) in enumerate(((0, 0, 0.8), (0.22, 0.1, 0.5), (-0.2, 0.12, 0.55), (0.05, -0.2, 0.45))):
        cyl('cr', 0.12, 0.0, h, loc=(x, y, h / 2), rot=(x * 0.8, -y * 0.8 + 0.01, 0), m=M('#7af0ff', rough=0.05, emit=0.9), seg=6, smooth=False)
    cyl('base', 0.4, 0.35, 0.1, loc=(0, 0, 0), m=M('#5a5a6a'), seg=10, smooth=False)
def peach():
    sphere('pc', 0.38, scale=(1, 1, 1.05), m=M('#ffa0b0', rough=0.45, sss=0.2)); cyl('tip', 0.12, 0.0, 0.2, loc=(0, 0, 0.38), m=M('#ff7a90'), seg=12)
    for s in (-1, 1): sphere('lf', 0.18, loc=(s * 0.16, 0, 0.42), scale=(1, 0.4, 0.35), rot=(0, D(s * 30), 0), m=M('#5ac05a'))
def egg():
    sphere('egg', 0.36, scale=(1, 1, 1.3), m=M('#fff2d8', rough=0.4))
    for k in range(7): sphere('sp', 0.07, loc=(math.cos(k) * 0.3, -abs(math.sin(k)) * 0.3 - 0.05, -0.2 + k * 0.08), m=M('#5ab0ff'), seg=10, rings=6)
def bill():
    box('paper', (0.7, 0.02, 0.9), m=M('#f6ecd0', rough=0.9), bevel=0.0, rot=(0, D(-8), 0))
    for k in range(5): box('ln', (0.5, 0.005, 0.03), loc=(0, -0.015, 0.3 - k * 0.12), m=M('#3a3a3a'), bevel=0)
    cyl('seal', 0.12, 0.12, 0.02, loc=(0.18, -0.03, -0.3), rot=(D(90), 0, 0), m=M('#e02a2a', emit=0.5))
def scroll():
    box('paper', (0.9, 0.01, 0.55), m=M('#f6ecd0', rough=0.9), bevel=0)
    for s in (-1, 1): cyl('rod', 0.06, 0.06, 0.7, loc=(s * 0.47, 0, 0), m=M('#8a3a2a'), seg=12)
    for k in range(3): box('ln', (0.6, 0.005, 0.04), loc=(0, -0.01, 0.15 - k * 0.15), m=M('#2a2a2a'), bevel=0)
def bell():
    lathe('bell', [(0.0, 0.5), (0.12, 0.48), (0.2, 0.3), (0.26, 0.05), (0.36, -0.18), (0.38, -0.22), (0.0, -0.22)], m=M('#e0b040', metal=0.85, rough=0.25), seg=32)
    torus('hook', 0.08, 0.025, loc=(0, 0, 0.56), rot=(D(90), 0, 0), m=M('#e0b040', metal=0.8)); sphere('clap', 0.06, loc=(0, 0, -0.26), m=M('#b08020', metal=0.8))
def mirror():
    cyl('rim', 0.42, 0.42, 0.06, rot=(D(90), 0, 0), m=M('#d0a040', metal=0.9, rough=0.25), seg=40)
    cyl('glass', 0.36, 0.36, 0.07, rot=(D(90), 0, 0), m=M('#bfeaff', metal=1.0, rough=0.02, emit=0.4), seg=40)
    cyl('handle', 0.05, 0.05, 0.4, loc=(0, 0, -0.6), m=M('#8a3a2a'), seg=10)
def seal():
    box('base', (0.6, 0.6, 0.35), m=M('#5ae0a0', rough=0.15, sss=0.3), bevel=0.04)
    sphere('beast', 0.22, loc=(0, 0, 0.32), scale=(1.2, 0.8, 0.8), m=M('#5ae0a0', rough=0.15)); sphere('head', 0.13, loc=(0, -0.2, 0.42), m=M('#5ae0a0', rough=0.15))
def pagoda():
    for k in range(4):
        cyl('tier', 0.3 - k * 0.05, 0.3 - k * 0.05, 0.18, loc=(0, 0, k * 0.26), m=M('#f0d070', metal=0.6, rough=0.3), seg=8, smooth=False)
        cyl('roof', 0.42 - k * 0.06, 0.2 - k * 0.04, 0.08, loc=(0, 0, k * 0.26 + 0.13), m=M('#c0402a', rough=0.4), seg=8, smooth=False)
    cyl('top', 0.06, 0.0, 0.3, loc=(0, 0, 1.15), m=M('#ffe060', emit=2), seg=8)
def fan():
    cyl('fan', 0.6, 0.6, 0.02, rot=(D(90), 0, 0), m=M('#f8f0dc', rough=0.8), seg=24, scale=(1, 1, 1)); 
    o = bpy.data.objects['fan']
    for k in range(7): box('rib', (0.015, 0.03, 0.6), loc=(math.sin(-1 + k / 3) * 0.3, -0.02, math.cos(-1 + k / 3) * 0.3), rot=(0, -1 + k / 3, 0), m=M('#8a5a2a'), bevel=0)
    box('cut', (1.4, 0.1, 0.7), loc=(0, 0, -0.38), m=M('#000000'), bevel=0); bpy.data.objects['cut'].hide_render = True
    md = o.modifiers.new('b', 'BOOLEAN'); md.object = bpy.data.objects['cut']; md.operation = 'DIFFERENCE'
    box('ink', (0.3, 0.005, 0.2), loc=(0.1, -0.02, 0.3), m=M('#3a3a5a'), bevel=0)
def flag():
    cyl('pole', 0.025, 0.025, 1.4, loc=(0, 0, 0), m=M('#6a4a2a'), seg=8)
    box('cloth', (0.6, 0.01, 0.7), loc=(0.31, 0, 0.3), m=M('#3a2a6a', rough=0.8, emit=0.2), bevel=0)
    sphere('sk', 0.12, loc=(0.31, -0.02, 0.35), scale=(1, 0.3, 1), m=M('#e8e8e8', emit=0.5))
def furnace():
    sphere('body', 0.42, scale=(1, 1, 0.8), m=M('#b07a3a', metal=0.7, rough=0.35))
    for k in range(3): cyl('leg', 0.06, 0.04, 0.3, loc=(math.cos(k * 2.1) * 0.3, math.sin(k * 2.1) * 0.3, -0.35), m=M('#8a5a2a', metal=0.6), seg=8)
    cyl('lid', 0.28, 0.12, 0.18, loc=(0, 0, 0.38), m=M('#c08a40', metal=0.7, rough=0.3), seg=20); sphere('knob', 0.07, loc=(0, 0, 0.5), m=M('#ffd040', emit=1))
    for s in (-1, 1): torus('ear', 0.1, 0.03, loc=(s * 0.45, 0, 0.15), rot=(D(90), 0, D(90)), m=M('#8a5a2a', metal=0.7))
    sphere('fire', 0.12, loc=(0, -0.38, -0.05), scale=(1, 0.3, 0.6), m=M('#ff6a1a', emit=5))
def chest():
    box('body', (0.8, 0.55, 0.45), m=M('#9a5a2a', rough=0.6), bevel=0.03)
    cyl('lid', 0.28, 0.28, 0.8, loc=(0, 0, 0.22), rot=(0, D(90), 0), m=M('#a8662e', rough=0.6), seg=20, scale=(1, 0.98, 1))
    for x in (-0.3, 0.3): box('band', (0.07, 0.58, 0.5), loc=(x, 0, 0.05), m=M('#ffd040', metal=0.8, rough=0.3), bevel=0.01)
    box('lock', (0.12, 0.05, 0.15), loc=(0, -0.29, 0.15), m=M('#ffd040', metal=0.9), bevel=0.01)
def coin():
    for k in range(4): cyl('coin', 0.32, 0.32, 0.06, loc=(k * 0.04, 0, k * 0.07), m=M('#ffd040', metal=0.9, rough=0.25), seg=32)
    box('hole', (0.12, 0.12, 0.08), loc=(0.12, 0, 0.23), m=M('#a07a20', metal=0.6), bevel=0)
def bag():
    sphere('bag', 0.42, scale=(1, 1, 0.9), m=M('#c0302a', rough=0.6)); cyl('neck', 0.12, 0.2, 0.18, loc=(0, 0, 0.4), m=M('#c0302a', rough=0.6)); torus('tie', 0.13, 0.03, loc=(0, 0, 0.38), m=M('#ffd040', metal=0.7))
    cyl('sym', 0.15, 0.15, 0.02, loc=(0, -0.4, 0.0), rot=(D(90), 0, 0), m=M('#ffd040', emit=0.6), seg=20)
def hat():
    cyl('brim', 0.55, 0.55, 0.04, m=M('#3a3a4a', rough=0.6), seg=32); cyl('crown', 0.28, 0.3, 0.4, loc=(0, 0, 0.2), m=M('#3a3a4a', rough=0.6), seg=24)
    box('jade', (0.12, 0.04, 0.1), loc=(0, -0.29, 0.25), m=M('#5ae0a0', emit=0.6), bevel=0.01)
def boots():
    for s in (-1, 1):
        cyl('leg', 0.12, 0.13, 0.4, loc=(s * 0.2, 0, 0.2), m=M('#3a2a4a', rough=0.6), seg=16)
        sphere('foot', 0.15, loc=(s * 0.2, -0.12, 0.02), scale=(0.9, 1.6, 0.6), m=M('#3a2a4a', rough=0.6))
        torus('cuff', 0.13, 0.03, loc=(s * 0.2, 0, 0.38), m=M('#ffd040', metal=0.7))
def jade():
    torus('bi', 0.3, 0.12, rot=(D(90), 0, 0), m=M('#7af0c0', rough=0.1, sss=0.3, emit=0.3), scale=(1, 1, 1))
    tube('cord', [(0, 0, 0.42), (0, 0, 0.8)], radius=0.02, m=M('#c0302a')); sphere('kn', 0.06, loc=(0, 0, 0.8), m=M('#c0302a'))
def abacus():
    box('frame', (1.1, 0.12, 0.6), m=M('#7a4a2a', rough=0.5), bevel=0.02)
    box('inner', (0.95, 0.2, 0.46), m=M('#2a1a10'), bevel=0)
    for i in range(7):
        for j in range(4): sphere('bead', 0.05, loc=(-0.42 + i * 0.14, -0.08, -0.16 + j * 0.1 + (0.05 if j > 2 else 0)), scale=(1, 0.8, 0.7), m=M('#ffd25e', metal=0.6, rough=0.3), seg=10, rings=6)
def umbrella():
    cyl('canopy', 0.7, 0.0, 0.35, loc=(0, 0, 0.6), m=M('#c03a5a', rough=0.6), seg=16, smooth=False); cyl('handle', 0.025, 0.025, 1.2, loc=(0, 0, 0.1), m=M('#6a4a2a'), seg=8)
def key():
    torus('bow', 0.18, 0.05, rot=(D(90), 0, 0), loc=(0, 0, 0.35), m=M('#ffd040', metal=0.9, rough=0.3))
    cyl('shaft', 0.04, 0.04, 0.7, loc=(0, 0, -0.15), m=M('#ffd040', metal=0.9, rough=0.3), seg=10)
    for z in (-0.4, -0.28): box('bit', (0.15, 0.06, 0.06), loc=(0.08, 0, z), m=M('#ffd040', metal=0.9), bevel=0.0)
def talisman(c):
    def f():
        box('tal', (0.4, 0.01, 0.95), m=M('#ffe060', rough=0.9, emit=0.3), bevel=0, rot=(0, D(-10), 0))
        for k in range(4): box('rune', (0.2 - k * 0.03, 0.005, 0.05), loc=(0, -0.01, 0.3 - k * 0.18), rot=(0, D(-10 + k * 15), 0), m=M(c, emit=0.8), bevel=0)
    return f
def lotus():
    for ring_, (n, r, h, c) in enumerate(((8, 0.42, 0.3, '#ffb0d0'), (6, 0.28, 0.4, '#ff8ab8'), (5, 0.15, 0.4, '#ff6aa0'))):
        for k in range(n):
            a_ = k / n * 6.28 + ring_ * 0.3
            sphere('pet', 0.16, loc=(math.cos(a_) * r * 0.7, math.sin(a_) * r * 0.7, 0.15 + ring_ * 0.04), scale=(0.6, 0.35, 1.0 * h / 0.3), rot=(math.sin(a_) * -0.7, math.cos(a_) * 0.7, 0), m=M(c, rough=0.4, sss=0.3, emit=0.3))
    sphere('ctr', 0.1, loc=(0, 0, 0.2), m=M('#ffe060', emit=2))
    cyl('pad', 0.6, 0.6, 0.03, loc=(0, 0, 0), m=M('#4ab05a'), seg=24)
def swords3():
    for k in range(3):
        g = empty('g%d' % k); g.rotation_euler = (0, D(-30 + k * 30), 0)
        box('blade', (0.08, 0.02, 1.0), loc=(0, 0, 0.55), m=M('#bfe8ff', metal=0.8, rough=0.1, emit=1.2), parent=g, bevel=0.005)
        box('guard', (0.22, 0.06, 0.04), loc=(0, 0, 0.05), m=M('#ffd040', metal=0.8), parent=g)
def shield():
    sphere('bub', 0.55, m=M('#7ad0ff', rough=0.05, emit=0.6, alpha=0.45), seg=32, rings=16)
    for k in range(6): cyl('hex', 0.18, 0.18, 0.02, loc=(math.cos(k) * 0.35, -0.42, math.sin(k) * 0.3), rot=(D(90), 0, 0), m=M('#bff0ff', emit=2), seg=6)
def cloud():
    for (x, z, r) in ((0, 0, 0.35), (0.35, -0.05, 0.28), (-0.35, -0.05, 0.28), (0.15, 0.2, 0.25), (-0.15, 0.18, 0.22)): sphere('c', r, loc=(x, 0, z), m=M('#ffffff', rough=0.8, emit=0.2))
def skull():
    sphere('sk', 0.38, m=M('#efe8d8', rough=0.6)); sphere('jaw', 0.22, loc=(0, -0.08, -0.3), scale=(1, 1, 0.6), m=M('#efe8d8', rough=0.6))
    for s in (-1, 1): sphere('eye', 0.1, loc=(s * 0.14, -0.3, 0.0), m=M('#5aff6a', emit=4))
def meditate():
    sphere('bodyy', 0.32, loc=(0, 0, 0.1), scale=(1.2, 1, 0.9), m=M('#5a8ad0', rough=0.7)); sphere('head', 0.24, loc=(0, 0, 0.55), m=M('#ffe2cc', rough=0.6))
    torus('halo', 0.36, 0.03, loc=(0, 0.15, 0.6), rot=(D(80), 0, 0), m=M('#ffe060', emit=4)); cyl('mat', 0.55, 0.55, 0.06, loc=(0, 0, -0.18), m=M('#c0402a'), seg=24)
def thunder():
    pts = [(0.1, 0.6), (-0.25, 0.0), (0.0, 0.0), (-0.15, -0.6), (0.3, 0.1), (0.05, 0.1), (0.25, 0.6)]
    extrude_poly('bolt', pts, 0.12, m=M('#fff27a', emit=5), rot=(D(90), 0, 0))
    sphere('cl', 0.3, loc=(0, 0.2, 0.7), scale=(1.6, 1, 0.6), m=M('#6a6a8a', rough=0.9))
def debtbook():
    book('#2a2a2a')(); box('red', (0.12, 0.5, 0.01), loc=(0.05, 0, 0.081), m=M('#e02a2a', emit=0.6), bevel=0)

ICONS = {
    'pill_red': pill('#ff4a4a'), 'pill_blue': pill('#4aa8ff'), 'pill_gold': pill('#ffcc33'), 'pill_purple': pill('#b06aff'), 'pill_green': pill('#4ae07a'), 'pill_white': pill('#f4f4ff'),
    'stone': gem('#6af0ff'), 'stone_r': gem('#ff6a8a'), 'gourd': gourd('#e09a3a'), 'gourd_g': gourd('#ffd040'), 'herb': lingcao, 'lingzhi': lingzhi, 'ore': ore, 'peach': peach, 'egg': egg, 'bill': bill, 'scroll': scroll,
    'book_r': book('#9a2a2a'), 'book_b': book('#2a4a9a'), 'book_g': book('#2a7a4a'), 'book_p': book('#6a2a9a'), 'book_o': book('#c07a1a'), 'debtbook': debtbook,
    **{'sword_' + k: sword(c, k in 'po') for k, c in RAR.items()},
    **{'robe_' + k: robe(c, '#ffd040') for k, c in (('w', '#c8c0b0'), ('g', '#5aa86a'), ('b', '#4a7ad0'), ('p', '#8a5ad0'), ('o', '#e0a040'))},
    'ring': ring('#ff4a6a'), 'ring_b': ring('#4aa8ff'), 'jade': jade, 'hat': hat, 'boots': boots,
    'bell': bell, 'mirror': mirror, 'seal': seal, 'pagoda': pagoda, 'fan': fan, 'flag': flag, 'furnace': furnace, 'chest': chest, 'coin': coin, 'bag': bag, 'abacus': abacus, 'umbrella': umbrella, 'key': key,
    'tal_r': talisman('#e02a2a'), 'tal_b': talisman('#2a4ae0'),
    'sk_fire': orb('#ff6a1a', '#ffd040'), 'sk_ice': orb('#7ad8ff', '#ffffff'), 'sk_wood': orb('#4ad06a', '#d0ff8a'), 'sk_earth': orb('#c08a3a', '#ffe0a0'), 'sk_metal': orb('#e0e0f0', '#ffd040'), 'sk_dark': orb('#5a2a8a', '#ff4aa0'), 'sk_light': orb('#fff2a0', '#ffffff'),
    'sk_thunder': thunder, 'sk_swords': swords3, 'sk_heal': lotus, 'sk_shield': shield, 'sk_flee': cloud, 'sk_poison': skull, 'sk_meditate': meditate,
}
if __name__ == '__main__':
    ids = a['ids'].split(',') if 'ids' in a else list(ICONS)
    for iid in ids:
        t0 = time.time(); reset(); lights()
        ICONS[iid]()
        bpy.context.view_layer.update()
        sc = bpy.context.scene; sc.render.resolution_x = sc.render.resolution_y = S0; sc.cycles.samples = 32
        cd = bpy.data.cameras.new('c'); cam = bpy.data.objects.new('c', cd); sc.collection.objects.link(cam); sc.camera = cam
        cd.type = 'ORTHO'; cam.rotation_euler = (D(62), 0, D(30))
        rot = cam.rotation_euler.to_matrix(); right = rot @ Vector((1, 0, 0)); up = rot @ Vector((0, 1, 0)); fwd = rot @ Vector((0, 0, -1))
        xs = []; ys = []
        for o in bpy.data.objects:
            if o.type != 'MESH' or o.hide_render: continue
            for c in o.bound_box:
                p = o.matrix_world @ Vector(c); xs.append(p.dot(right)); ys.append(p.dot(up))
        cx = (min(xs) + max(xs)) / 2; cy = (min(ys) + max(ys)) / 2; ext = max(max(xs) - min(xs), max(ys) - min(ys))
        cd.ortho_scale = ext * 1.12; cam.location = right * cx + up * cy - fwd * 20; cd.clip_end = 100
        render(os.path.join(out, iid + '.png'))
        print('DONE', iid, round(time.time() - t0, 1), flush=True)

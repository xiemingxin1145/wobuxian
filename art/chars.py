"""Q版角色/怪物/BOSS 建模 + 程序化动画姿势"""
import math, random
from lib import *

SK = '#ffe0cc'
OL = 0.022 if os.environ.get('WBX_CEL') == '1' else 0.016   # 描边厚度（赛璐璐模式加粗）

def face(head, c, r, spec, f):
    """在头部前方(-Y)放置五官；c=头中心局部坐标"""
    eye_col = M(spec.get('eye', '#2b1a14'), rough=0.15, spec=0.8)
    ex, ez = 0.135 * r / 0.38, -0.02
    style = spec.get('eyes', 'round')
    for s in (-1, 1):
        y = -math.sqrt(max(0.0, r * r - (ex) ** 2 - ez ** 2)) + 0.01
        if style == 'closed' or style == 'happy':
            torus('eyeC', 0.05, 0.012, loc=(c[0] + s * ex, c[1] + y - 0.005, c[2] + ez), m=eye_col, parent=head, rot=(D(90), 0, 0), arc=0.5, seg=12, mseg=6)
        elif style == 'angry':
            sphere('eye', 0.05, loc=(c[0] + s * ex, c[1] + y, c[2] + ez), scale=(1, 0.45, 1.1), m=M('#c01818', emit=2.0, rough=0.3), parent=head, seg=16, rings=10)
        else:
            sphere('eye', 0.068, loc=(c[0] + s * ex, c[1] + y, c[2] + ez), scale=(0.8, 0.45, 1.3), m=eye_col, parent=head, seg=16, rings=10)
            sphere('hl', 0.022, loc=(c[0] + s * ex + 0.02, c[1] + y - 0.03, c[2] + ez + 0.035), m=M('#ffffff', emit=1.5), parent=head, seg=8, rings=6)
        if spec.get('brow', True):
            tube('brow', [(c[0] + s * ex - 0.04, c[1] + y + 0.005, c[2] + ez + 0.1), (c[0] + s * ex + 0.04, c[1] + y + 0.0, c[2] + ez + 0.11 + (0.02 if style == 'angry' else 0) * -s)], 0.011, m=M(spec.get('hair', '#2a1b14')), parent=head)
        if spec.get('blush', True):
            sphere('blush', 0.06, loc=(c[0] + s * 0.22 * r / 0.38, c[1] - math.sqrt(max(0.0, r * r - (0.22 * r / 0.38) ** 2 - 0.1 ** 2)) + 0.02, c[2] - 0.1), scale=(1, 0.25, 0.6), m=M('#ff8fa0', rough=0.9, alpha=1.0), parent=head, seg=12, rings=8)
    mouth = spec.get('mouth', 'smile')
    my = c[1] - math.sqrt(max(0.0, r * r - 0.14 ** 2)) + 0.012
    if mouth == 'open':
        sphere('mouth', 0.04, loc=(c[0], my, c[2] - 0.15), scale=(1, 0.4, 0.8), m=M('#8a2a2a'), parent=head, seg=12, rings=8)
    elif mouth == 'flat':
        tube('mouth', [(c[0] - 0.03, my, c[2] - 0.15), (c[0] + 0.03, my, c[2] - 0.15)], 0.008, m=M('#6a2a2a'), parent=head)
    else:
        torus('mouth', 0.035, 0.009, loc=(c[0], my, c[2] - 0.135), m=M('#7a2a2a'), parent=head, rot=(D(90), D(180), 0), arc=0.5, seg=12, mseg=6)

def hair(head, c, r, spec):
    hm = M(spec.get('hair', '#2a1b14'), rough=0.5, spec=0.25)
    st = spec.get('hairstyle', 'bun')
    sphere('hairCap', r * 1.03, loc=(c[0], c[1] + 0.1, c[2] + 0.08), scale=(1.0, 1.0, 0.98), m=hm, parent=head, outline=OL)
    # 刘海
    for i, a in enumerate((-0.75, -0.35, 0.0, 0.35, 0.75)):
        x = math.sin(a) * r * 0.82; y = -math.cos(a) * r * 0.82 + c[1]
        sphere('bang', 0.12, loc=(c[0] + x, y - 0.02, c[2] + 0.18 - abs(a) * 0.06), scale=(0.9, 0.55, 1.3 + (0.25 if i % 2 else 0)), m=hm, parent=head, rot=(D(-20), a * 0.6, 0), seg=14, rings=10)
    for s in (-1, 1):  # 鬓发
        tube('lock', [(c[0] + s * r * 0.86, c[1] - 0.12, c[2] + 0.05), (c[0] + s * r * 0.9, c[1] - 0.14, c[2] - 0.18), (c[0] + s * r * 0.8, c[1] - 0.1, c[2] - 0.36)], 0.06, m=hm, parent=head, taper=[1, 0.9, 0.4])
    if st in ('bun', 'crown', 'double'):
        if st == 'double':
            for s in (-1, 1): sphere('bun', 0.16, loc=(c[0] + s * 0.26, c[1] + 0.05, c[2] + r * 0.88), m=hm, parent=head, outline=OL)
        else:
            sphere('bun', 0.17, loc=(c[0], c[1] + 0.06, c[2] + r + 0.1), m=hm, parent=head, outline=OL)
            torus('band', 0.13, 0.03, loc=(c[0], c[1] + 0.06, c[2] + r + 0.03), m=M(spec.get('ribbon', '#e84a5f'), rough=0.4), parent=head)
            cyl('pin', 0.015, 0.015, 0.6, loc=(c[0], c[1] + 0.06, c[2] + r + 0.12), rot=(0, D(80), D(20)), m=M('#ffd25e', metal=0.8, rough=0.25), parent=head, seg=8)
        if st == 'crown':
            lathe('crown', [(0.12, 0), (0.14, 0.06), (0.1, 0.14), (0.04, 0.2)], loc=(c[0], c[1] + 0.06, c[2] + r + 0.12), m=M('#ffcf4a', metal=0.9, rough=0.2), parent=head, seg=16)
            sphere('gem', 0.04, loc=(c[0], c[1] - 0.06, c[2] + r + 0.2), m=M('#e0304a', emit=1.5, rough=0.1), parent=head, seg=10, rings=8)
    if st == 'pony' or spec.get('long'):
        tube('pony', [(c[0], c[1] + r * 0.9, c[2] + 0.15), (c[0], c[1] + r * 1.15, c[2] - 0.2), (c[0], c[1] + r * 1.0, c[2] - 0.6), (c[0], c[1] + r * 0.95, c[2] - 0.85)], 0.17, m=hm, parent=head, taper=[1, 1.1, 0.8, 0.3])
    if st == 'short':
        for a in (-0.9, -0.3, 0.3, 0.9):
            sphere('spike', 0.12, loc=(c[0] + math.sin(a) * r * 0.7, c[1] + 0.12, c[2] + r * 0.75), scale=(0.8, 0.8, 1.4), rot=(D(20), a, 0), m=hm, parent=head, seg=12, rings=8)

def hat(head, c, r, spec):
    h = spec.get('hat')
    if h == 'straw':
        m = M('#d9b56a', rough=0.85)
        cyl('brim', 0.5, 0.5, 0.03, loc=(c[0], c[1] + 0.04, c[2] + r * 0.8), m=m, parent=head, seg=32, outline=OL)
        cyl('top', 0.3, 0.05, 0.26, loc=(c[0], c[1] + 0.04, c[2] + r * 0.8 + 0.14), m=m, parent=head, seg=32)
    elif h == 'tall':
        m = M('#262630', rough=0.7)
        cyl('tall', 0.26, 0.24, 0.62, loc=(c[0], c[1] + 0.02, c[2] + r + 0.22), m=m, parent=head, seg=24, outline=OL)
        cyl('brim', 0.42, 0.42, 0.03, loc=(c[0], c[1], c[2] + r * 0.7), m=m, parent=head, seg=24)
        box('tag', (0.2, 0.02, 0.36), loc=(c[0], c[1] - 0.26, c[2] + r + 0.25), m=M('#f4f0e0', rough=0.9), parent=head, bevel=0.005)
    elif h == 'guan':
        box('guan', (0.18, 0.1, 0.16), loc=(c[0], c[1] + 0.06, c[2] + r + 0.12), m=M('#2a2a2a', rough=0.4), parent=head, bevel=0.02)
    elif h == 'hood':
        sphere('hood', r * 1.12, loc=(c[0], c[1] + 0.08, c[2] + 0.06), scale=(1, 1.02, 1.05), m=M(spec.get('hood', '#3a2a4a'), rough=0.8), parent=head, outline=OL)
    elif h == 'jiangshi':
        cyl('jh', 0.3, 0.27, 0.3, loc=(c[0], c[1] + 0.02, c[2] + r * 0.85), m=M('#1f2a3a', rough=0.6), parent=head, seg=24, outline=OL)
        cyl('jb', 0.33, 0.33, 0.04, loc=(c[0], c[1] + 0.02, c[2] + r * 0.7), m=M('#1f2a3a'), parent=head, seg=24)
        box('fu', (0.16, 0.01, 0.42), loc=(c[0], c[1] - r * 0.98, c[2] - 0.02), rot=(D(-8), 0, 0), m=M('#ffd84a', rough=0.9, emit=0.3), parent=head, bevel=0.0)
    elif h == 'flower':   # 花簪
        for k, a in enumerate((-0.5, 0.0, 0.5)):
            sphere('flw', 0.075, loc=(c[0] + r * 0.62 + 0.05 * k, c[1] + 0.05, c[2] + r * 0.62 + 0.06 * (1 - abs(a) * 2)), scale=(1, 1, 0.6), m=M(spec.get('flower', '#ff7aa8'), rough=0.5, emit=0.3), parent=head, seg=10, rings=8)
        sphere('flc', 0.035, loc=(c[0] + r * 0.67, c[1] - 0.02, c[2] + r * 0.68), m=M('#ffe060', emit=0.8), parent=head, seg=8, rings=6)
    elif h == 'scholar':  # 儒巾
        box('rj', (0.5, 0.42, 0.2), loc=(c[0], c[1] + 0.05, c[2] + r * 0.88), m=M(spec.get('hatc', '#2a3a4a'), rough=0.6), parent=head, bevel=0.06, outline=OL)
        for s in (-1, 1): box('rjt', (0.06, 0.02, 0.36), loc=(c[0] + s * 0.12, c[1] + r * 0.95, c[2] + r * 0.45), rot=(D(25), s * D(10), 0), m=M(spec.get('hatc', '#2a3a4a')), parent=head, bevel=0.01)
    elif h == 'veil':     # 幕篱（轻纱斗笠）
        m = M(spec.get('hatc', '#f4f6ff'), rough=0.7)
        cyl('vb', 0.5, 0.5, 0.03, loc=(c[0], c[1] + 0.04, c[2] + r * 0.82), m=m, parent=head, seg=32, outline=OL)
        cyl('vt', 0.26, 0.08, 0.2, loc=(c[0], c[1] + 0.04, c[2] + r * 0.82 + 0.11), m=m, parent=head, seg=32)
        for a in range(10):
            ang = a / 10 * 2 * math.pi
            if math.sin(ang) < -0.3: continue
            box('veilp', (0.16, 0.01, 0.42), loc=(c[0] + math.cos(ang) * 0.47, c[1] + 0.04 + math.sin(ang) * 0.47, c[2] + r * 0.82 - 0.22), rot=(0, 0, ang + math.pi / 2), m=M('#e8f0ff', rough=0.4, alpha=0.55), parent=head, bevel=0)
    elif h == 'crown2':   # 宗主玉冠
        lathe('cr2', [(0.16, 0), (0.19, 0.1), (0.14, 0.22), (0.06, 0.3)], loc=(c[0], c[1] + 0.06, c[2] + r + 0.04), m=M(spec.get('hatc', '#7fe0c0'), metal=0.4, rough=0.15, emit=0.25), parent=head, seg=20, outline=OL)
        cyl('cr2p', 0.016, 0.016, 0.8, loc=(c[0], c[1] + 0.06, c[2] + r + 0.16), rot=(0, D(88), 0), m=M('#ffd25e', metal=0.9, rough=0.2), parent=head, seg=8)
    if spec.get('glasses'):
        gm = M('#2a2a2a', metal=0.6, rough=0.3)
        for s in (-1, 1): torus('gl', 0.07, 0.01, loc=(c[0] + s * 0.135 * r / 0.38, c[1] - r * 0.93, c[2] - 0.02), rot=(D(90), 0, 0), m=gm, parent=head, seg=16, mseg=6)
    if spec.get('halo'):
        torus('halo', 0.42, 0.025, loc=(c[0], c[1] + r * 0.9, c[2] + 0.05), rot=(D(90), 0, 0), m=M(spec['halo'], emit=4.0, rough=0.2), parent=head, seg=40, mseg=8)
    if spec.get('ears') == 'fox':
        for s in (-1, 1):
            o = cyl('ear', 0.12, 0.0, 0.28, loc=(c[0] + s * 0.24, c[1] + 0.05, c[2] + r * 0.9), rot=(0, s * D(25), 0), m=M(spec.get('hair'), rough=0.6), parent=head, seg=12, outline=OL)
            cyl('earIn', 0.07, 0.0, 0.18, loc=(c[0] + s * 0.235, c[1] - 0.02, c[2] + r * 0.88), rot=(0, s * D(25), 0), m=M('#ffd0d8'), parent=head, seg=10)
    if spec.get('horns'):
        for s in (-1, 1):
            tube('horn', [(c[0] + s * 0.2, c[1], c[2] + r * 0.8), (c[0] + s * 0.33, c[1] + 0.02, c[2] + r * 1.1), (c[0] + s * 0.3, c[1] + 0.08, c[2] + r * 1.35)], 0.06, m=M(spec['horns'], rough=0.3, metal=0.2), parent=head, taper=[1, 0.6, 0.05])
    if spec.get('beard'):
        cyl('beard', 0.14, 0.01, 0.34, loc=(c[0], c[1] - r * 0.78, c[2] - r * 0.72), rot=(D(14), 0, 0), m=M(spec.get('beardc', '#f0f0f0'), rough=0.8), parent=head, seg=16)

class Rig:
    pass

def chibi(spec, scale=1.2):
    """返回带关节的 Q 版人物。朝向 -Y。"""
    R = Rig(); R.spec = spec
    root = empty('root'); R.root = root
    base = empty('base', parent=root); base.scale = (scale, scale, scale); R.base = base
    body = empty('body', (0, 0, 0.0), base); R.body = body
    robe = spec.get('robe', '#6fbf8a'); rm = M(robe, rough=0.62, sheen=0.4); rm2 = M(spec.get('robe2', '#fff6e8'), rough=0.6)
    skin = M(spec.get('skin', SK), rough=0.5, sss=0.25)
    fat = spec.get('fat', 1.0)
    rmS = mat('sl_' + robe, tuple(c * 0.8 for c in hexc(robe)[:3]) + (1,), rough=0.62, sheen=0.4)
    # 腿/脚
    R.legs = []
    for s in (-1, 1):
        lp = empty('leg', (s * 0.09, 0, 0.24), body)
        cyl('legm', 0.055, 0.05, 0.2, loc=(0, 0, -0.1), m=M(spec.get('pants', '#4a3a3a')), parent=lp, seg=12)
        sphere('foot', 0.075, loc=(0, -0.04, -0.2), scale=(0.85, 1.35, 0.6), m=M(spec.get('shoe', '#3a2a2a'), rough=0.5), parent=lp, outline=OL)
        R.legs.append(lp)
    # 躯干（随身体起伏）
    torso = empty('torso', (0, 0, 0.0), body); R.torso = torso
    skirt = spec.get('skirt', 0.3)
    lathe('robe', [(skirt * fat, 0.06), (skirt * 0.93 * fat, 0.18), (0.235 * fat, 0.36), (0.2 * fat, 0.52), (0.165, 0.64), (0.1, 0.72)], m=rm, parent=torso, seg=32, outline=OL)
    lathe('hem', [(skirt * fat + 0.005, 0.05), (skirt * fat + 0.012, 0.08), (skirt * 0.97 * fat + 0.006, 0.11)], m=M(spec.get('trim', '#ffd25e'), rough=0.4, metal=0.3), parent=torso, seg=32, close_top=False)
    # 交领
    for s in (-1, 1):
        box('collar', (0.05, 0.02, 0.26), loc=(s * 0.05, -0.185, 0.57), rot=(D(-10), s * D(-28), 0), m=rm2, parent=torso, bevel=0.01)
    box('panel', (0.17, 0.02, 0.32), loc=(0, -0.255 * fat, 0.2), rot=(D(-14), 0, 0), m=rm2, parent=torso, bevel=0.01)
    torus('belt', 0.225 * fat, 0.035, loc=(0, 0, 0.4), scale=(1, 0.95, 0.9), m=M(spec.get('belt', '#ffd25e'), rough=0.4, metal=0.2), parent=torso)
    box('sash', (0.06, 0.02, 0.2), loc=(0.07, -0.215 * fat, 0.29), rot=(0, D(8), 0), m=M(spec.get('belt', '#ffd25e')), parent=torso, bevel=0.008)
    if spec.get('cape'):
        lathe('cape', [(0.34, 0.1), (0.3, 0.3), (0.22, 0.6), (0.16, 0.71)], loc=(0, 0.035, 0), scale=(1.05, 1.0, 1), m=M(spec['cape'], rough=0.7, sheen=0.5), parent=torso, seg=24)
    # 手臂（宽袖）
    R.arms = []
    for s in (-1, 1):
        ap = empty('arm', (s * 0.17, 0, 0.64), torso)
        cyl('sleeve', 0.075, 0.13, 0.32, loc=(s * 0.05, 0, -0.15), rot=(0, s * D(-20), 0), m=rmS, parent=ap, seg=16, outline=OL)
        cyl('cuff', 0.133, 0.133, 0.035, loc=(s * 0.1, 0, -0.3), rot=(0, s * D(-20), 0), m=M(spec.get('trim', '#ffd25e'), metal=0.3, rough=0.4), parent=ap, seg=16)
        hand = empty('hand', (s * 0.11, 0, -0.35), ap)
        sphere('handm', 0.06, m=skin, parent=hand, seg=12, rings=8)
        R.arms.append(ap)
        if s == 1: R.handR = hand
        else: R.handL = hand
    # 披帛（高阶飘带）
    if spec.get('ribbon2'):
        rb = M(spec['ribbon2'], rough=0.4, emit=0.6)
        tube('pibo', [(-0.36, 0.05, 0.3), (-0.3, 0.2, 0.68), (0, 0.27, 0.8), (0.3, 0.2, 0.68), (0.38, 0.05, 0.3), (0.46, -0.02, 0.05)], 0.025, m=rb, parent=torso, taper=[0.5, 1, 1, 1, 1, 0.4])
    # 头
    hp = empty('headp', (0, 0, 0.7), torso); R.head = hp
    hr = 0.37 * spec.get('headScale', 1.0); c = (0, 0, hr * 0.92)
    sphere('neck', 0.07, loc=(0, 0, 0.02), m=skin, parent=hp, seg=12, rings=8)
    sphere('face', hr, loc=c, scale=(1.0, 0.98, 0.94), m=skin, parent=hp, outline=OL, seg=32, rings=20)
    for s in (-1, 1):
        sphere('earH', 0.06, loc=(s * hr * 0.98, c[1] + 0.02, c[2] - 0.03), scale=(0.5, 0.8, 1), m=skin, parent=hp, seg=10, rings=8)
    face(hp, c, hr, spec, None)
    if spec.get('hairstyle') != 'none': hair(hp, c, hr, spec)
    hat(hp, c, hr, spec)
    # 手持物
    w = spec.get('weapon')
    if w: weapon(R.handR, w)
    if spec.get('left'): weapon(R.handL, spec['left'])
    if spec.get('back') == 'sword':
        g = empty('backsw', (0.02, 0.22, 0.4), torso); g.rotation_euler = (D(5), D(40), 0); swordmesh(g, 0.75)
    if spec.get('tails'):
        tm = M(spec.get('hair'), rough=0.7, sheen=0.6)
        R.tails = []
        for k in range(spec['tails']):
            a = (k - (spec['tails'] - 1) / 2) * 0.5
            tp = empty('tailp', (0, 0.22, 0.2), body); tp.rotation_euler = (D(-30), 0, a)
            tube('tail', [(0, 0, 0), (0, 0.2, 0.15), (0, 0.38, 0.42), (0, 0.4, 0.62)], 0.13, m=tm, parent=tp, taper=[0.5, 1, 1, 0.5])
            sphere('tip', 0.08, loc=(0, 0.4, 0.66), m=M('#fff8f0'), parent=tp, seg=10, rings=8)
            R.tails.append(tp)
    return R

def swordmesh(parent, L=0.8, glow=False):
    bl = M('#dfe9f2', metal=0.95, rough=0.12, emit=(0.8 if glow else 0.0), emit_col=(0.5, 0.85, 1.0))
    box('blade', (0.05, 0.012, L), loc=(0, 0, L / 2 + 0.06), m=bl, parent=parent, bevel=0.006)
    cyl('tip', 0.035, 0.0, 0.08, loc=(0, 0, L + 0.1), m=bl, parent=parent, seg=4, scale=(1, 0.3, 1))
    box('guard', (0.16, 0.04, 0.035), loc=(0, 0, 0.05), m=M('#e8b440', metal=0.9, rough=0.25), parent=parent, bevel=0.01)
    cyl('grip', 0.022, 0.022, 0.14, loc=(0, 0, -0.03), m=M('#6a3a1e', rough=0.7), parent=parent, seg=8)
    sphere('pommel', 0.03, loc=(0, 0, -0.11), m=M('#e8b440', metal=0.9, rough=0.25), parent=parent, seg=8, rings=6)

def weapon(hand, w):
    g = empty('w_' + w, (0, 0, 0), hand)
    if w in ('sword', 'gsword'):
        g.rotation_euler = (D(-90), 0, 0); swordmesh(g, 0.7, glow=(w == 'gsword'))
    elif w == 'gourd':
        lathe('gourd', [(0.0, -0.2), (0.11, -0.15), (0.12, -0.08), (0.06, 0.0), (0.08, 0.05), (0.07, 0.11), (0.02, 0.15)], m=M('#e09a3a', rough=0.35), parent=g, seg=20)
        torus('gstr', 0.06, 0.012, loc=(0, 0, 0.0), m=M('#c0302a'), parent=g)
    elif w == 'fan':
        g.rotation_euler = (0, D(10), D(20))
        cyl('fan', 0.25, 0.25, 0.015, loc=(0, -0.0, 0.18), rot=(D(90), 0, 0), m=M('#f8f0dc', rough=0.8), parent=g, seg=24, scale=(1, 0.55, 1))
    elif w == 'book':
        box('book', (0.2, 0.06, 0.26), loc=(0, -0.05, 0.02), m=M('#8a2a2a', rough=0.6), parent=g, bevel=0.01)
        box('label', (0.08, 0.005, 0.14), loc=(0, -0.083, 0.03), m=M('#f4f0e0'), parent=g, bevel=0)
    elif w == 'abacus':
        box('frame', (0.36, 0.05, 0.18), m=M('#7a4a2a', rough=0.5), parent=g, bevel=0.01)
        for i in range(6):
            for j in range(3): sphere('bead', 0.022, loc=(-0.14 + i * 0.056, -0.03, -0.05 + j * 0.05), m=M('#ffd25e', metal=0.6, rough=0.3), parent=g, seg=8, rings=6)
    elif w == 'staff':
        cyl('staff', 0.025, 0.025, 1.2, loc=(0, 0, 0.25), m=M('#6a4a2a', rough=0.6), parent=g, seg=8)
        sphere('orb', 0.09, loc=(0, 0, 0.88), m=M('#9a5aff', emit=3.0, rough=0.1), parent=g, seg=14, rings=10)
    elif w == 'hoe':
        cyl('hoe', 0.022, 0.022, 0.9, loc=(0, 0, 0.2), m=M('#8a6a3a'), parent=g, seg=8)
        box('hoeb', (0.16, 0.03, 0.12), loc=(0, -0.06, 0.64), m=M('#8a8a8a', metal=0.8, rough=0.4), parent=g, bevel=0.005)
    elif w == 'claw':
        for k in range(3): cyl('claw', 0.02, 0.0, 0.14, loc=(-0.04 + k * 0.04, -0.08, 0), rot=(D(80), 0, 0), m=M('#f0f0e8', rough=0.3), parent=g, seg=6)
    elif w == 'talisman':
        box('tal', (0.12, 0.005, 0.3), loc=(0, -0.05, 0.12), m=M('#ffd84a', emit=0.6, rough=0.9), parent=g, bevel=0)
    elif w == 'trident':
        cyl('tr', 0.022, 0.022, 1.2, loc=(0, 0, 0.3), m=M('#c0a040', metal=0.8, rough=0.3), parent=g, seg=8)
        for x in (-0.08, 0, 0.08): cyl('trp', 0.025, 0.0, 0.2, loc=(x, 0, 0.98), m=M('#d8e0e8', metal=0.9, rough=0.2), parent=g, seg=6)
    elif w == 'basket':
        lathe('bk', [(0.08, -0.1), (0.14, 0.0), (0.15, 0.08)], m=M('#b8904a', rough=0.9), parent=g, seg=16, close_top=False)

# ---------------- 动画 ----------------
ANIMS = {'idle': 4, 'walk': 6, 'attack': 5, 'hurt': 1}

def pose(R, anim, f, n):
    t = f / n
    R.body.location = (0, 0, 0); R.body.rotation_euler = (0, 0, 0)
    R.torso.rotation_euler = (0, 0, 0); R.head.rotation_euler = (0, 0, 0)
    for lp in R.legs: lp.rotation_euler = (0, 0, 0)
    for ap in R.arms: ap.rotation_euler = (0, 0, 0)
    aL, aR = R.arms; lL, lR = R.legs
    if anim == 'idle':
        b = math.sin(t * 2 * math.pi)
        R.body.location = (0, 0, 0.012 * b)
        aL.rotation_euler = (D(3 * b), D(-14), 0); aR.rotation_euler = (D(-3 * b), D(14), 0)
        R.head.rotation_euler = (D(2 * b), 0, D(2 * b))
    elif anim == 'walk':
        a = math.sin(t * 2 * math.pi)
        R.body.location = (0, 0, 0.035 * abs(math.cos(t * 2 * math.pi)))
        R.torso.rotation_euler = (D(-6), 0, D(4 * a))
        lL.rotation_euler = (D(-32 * a), 0, 0); lR.rotation_euler = (D(32 * a), 0, 0)
        aL.rotation_euler = (D(35 * a), D(-14), 0); aR.rotation_euler = (D(-35 * a), D(14), 0)
    elif anim == 'attack':
        k = [(-40, 140, -15), (-55, 175, -25), (10, -70, 25), (25, -95, 30), (5, -20, 8)][f]
        R.torso.rotation_euler = (D(k[0] * 0.25), 0, D(k[2]))
        aR.rotation_euler = (D(-k[1]), D(15), D(-10))
        aL.rotation_euler = (D(20 if f < 2 else -30), D(-20), 0)
        lL.rotation_euler = (D(-20 if f >= 2 else 10), 0, 0); lR.rotation_euler = (D(20 if f >= 2 else -5), 0, 0)
        R.body.location = (0, (-0.08 if f in (2, 3) else 0.03), 0.02 if f in (1,) else 0)
    elif anim == 'hurt':
        R.torso.rotation_euler = (D(16), 0, D(-6)); R.head.rotation_euler = (D(12), 0, D(8))
        aL.rotation_euler = (D(-30), D(-40), 0); aR.rotation_euler = (D(-30), D(40), 0)
        R.body.location = (0, 0.06, 0)
    if R.spec.get('armsForward'):
        for ap in R.arms: ap.rotation_euler = (ap.rotation_euler[0] * 0.3 - D(85), ap.rotation_euler[1] * 0.3, 0)
        if anim == 'walk': R.body.location = (0, 0, 0.09 * abs(math.sin(t * 2 * math.pi)))
    if getattr(R, 'tails', None):
        for i, tp in enumerate(R.tails):
            tp.rotation_euler = (D(-30 + 8 * math.sin(t * 2 * math.pi + i)), 0, (i - (len(R.tails) - 1) / 2) * 0.5 + 0.15 * math.sin(t * 2 * math.pi + i * 0.7))

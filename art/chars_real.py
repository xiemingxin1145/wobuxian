"""写实精美国风男主（7.5头身）— 问道/大话西游风格 v2

与 chars.py 的 Rig 命名兼容（root/body/torso/head/arms/legs/handR/handL），
可直接复用 chars.pose() 姿势表。朝向 -Y。
"""
import math, os
from lib import *

D = math.radians

# ---- 材质 ----
def M_skin():    return M('#e8b58a', rough=0.45, sss=0.3)
def M_hair():    return M('#140e0c', rough=0.25, spec=0.6)
def M_gold():    return M('#d8a530', metal=0.9, rough=0.22)
def M_robe():    return M('#eef2f6', rough=0.78, sheen=0.5)
def M_blue():    return M('#2a5a9a', rough=0.7)
def M_red():     return M('#b82828', rough=0.6, sheen=0.3)
def M_dark():    return M('#2a2a38', rough=0.7)
def M_lips():    return M('#8a4a3a', rough=0.6)


class Rig:
    pass


def real_male(spec=None, scale=1.0):
    """写实 7.5 头身男主。返回与 chars.py 一致的 Rig。

    比例（local 单位，body 原点 = 骨盆中心，z 向上）:
      足 -0.85 / 踝 -0.75 / 膝 -0.30 / 髋 +0.05 / 腰 +0.40 / 胸 +0.72 / 肩 +0.85
      颈 +0.90 / 下巴 +0.95 / 头心 +1.10 / 头顶 +1.26
    """
    spec = spec or {}
    R = Rig(); R.spec = spec
    root = empty('root'); R.root = root
    base = empty('base', parent=root); base.scale = (scale, scale, scale); R.base = base
    body = empty('body', (0, 0, 0.0), base); R.body = body

    skin, hair = M_skin(), M_hair()
    gold, robe, blue = M_gold(), M_robe(), M_blue()
    red, dark = M_red(), M_dark()

    # ============ 腿 ============
    R.legs = []
    for s in (-1, 1):
        lp = empty('leg', (s * 0.10, 0, 0.05), body)
        # 大腿（袍裤）
        cyl('thigh', 0.062, 0.052, 0.36, loc=(0, 0, -0.18), m=blue, parent=lp, seg=16)
        # 膝甲
        sphere('knee', 0.055, loc=(0, -0.015, -0.37), scale=(1, 0.7, 0.9),
               m=gold, parent=lp, seg=12, rings=8)
        # 小腿
        cyl('shin', 0.05, 0.042, 0.38, loc=(0, 0, -0.56), m=dark, parent=lp, seg=14)
        # 护腿（金属条）
        box('greave', (0.09, 0.04, 0.22), loc=(0, -0.035, -0.56),
            m=gold, parent=lp, bevel=0.015)
        # 战靴
        box('boot', (0.11, 0.20, 0.09), loc=(0, -0.03, -0.80), m=dark, parent=lp, bevel=0.02)
        box('boottoe', (0.11, 0.08, 0.07), loc=(0, -0.11, -0.82), m=gold, parent=lp, bevel=0.015)
        R.legs.append(lp)

    # ============ 躯干 ============
    torso = empty('torso', (0, 0, 0.0), body); R.torso = torso
    # 腰胯（蓝袍）
    lathe('pelvis', [(0.17, 0.0), (0.18, 0.12), (0.16, 0.22)],
          m=blue, parent=torso, seg=24)
    # 腰腹
    lathe('waist', [(0.16, 0.20), (0.15, 0.32), (0.16, 0.42)],
          m=robe, parent=torso, seg=24)
    # 胸廓（宽肩窄腰）
    lathe('chest', [(0.16, 0.40), (0.22, 0.55), (0.24, 0.68), (0.20, 0.80), (0.13, 0.86)],
          m=robe, parent=torso, seg=28)
    # 胸甲（明光铠：整片金胸甲）
    box('cuirass', (0.22, 0.05, 0.28), loc=(0, -0.19, 0.62),
        m=gold, parent=torso, bevel=0.025)
    # 胸甲中线
    box('cuirassline', (0.02, 0.055, 0.26), loc=(0, -0.215, 0.62),
        m=M('#a87820', metal=0.9, rough=0.3), parent=torso, bevel=0.005)
    # 腹甲
    sphere('belly', 0.07, loc=(0, -0.19, 0.45), scale=(1.1, 0.35, 0.9),
           m=gold, parent=torso, seg=12, rings=8)
    # 交领
    for s in (-1, 1):
        box('collar', (0.05, 0.025, 0.14), loc=(s * 0.045, -0.185, 0.82),
            rot=(D(-12), s * D(-28), 0), m=blue, parent=torso, bevel=0.008)
    # 腰带
    torus('belt', 0.165, 0.025, loc=(0, 0, 0.38), scale=(1, 0.95, 1), m=gold, parent=torso)
    # 玉佩
    sphere('jade', 0.03, loc=(0, -0.17, 0.34), m=M('#3a9a8a', metal=0.3, rough=0.3),
           parent=torso, seg=10, rings=8)
    # 红飘带
    tube('sash', [(-0.12, -0.05, 0.38), (-0.26, -0.12, 0.20), (-0.30, -0.08, -0.05)],
         0.02, m=red, parent=torso, taper=[1, 0.8, 0.25])
    # 背后披风
    box('cape', (0.46, 0.05, 0.85), loc=(0, 0.18, 0.30), rot=(D(-5), 0, 0),
        m=red, parent=torso, bevel=0.025)

    # ============ 臂 ============
    R.arms = []
    for s in (-1, 1):
        ap = empty('arm', (s * 0.24, 0, 0.82), torso)
        # 肩甲（圆润，覆肩）
        sphere('pauldron', 0.085, loc=(s * 0.03, 0, 0.03), scale=(1.3, 1, 0.85),
               m=gold, parent=ap, seg=14, rings=10)
        # 上臂（白袍袖）
        cyl('uparm', 0.045, 0.04, 0.24, loc=(0, 0, -0.16), m=robe, parent=ap, seg=14)
        # 护臂金
        cyl('bracer', 0.045, 0.04, 0.22, loc=(0, 0, -0.36), m=gold, parent=ap, seg=14)
        # 手
        hand = empty('hand', (0, 0, -0.52), ap)
        sphere('handm', 0.04, m=skin, parent=hand, seg=12, rings=8)
        R.arms.append(ap)
        if s == 1: R.handR = hand
        else: R.handL = hand

    # ============ 头 ============
    hp = empty('headp', (0, 0, 0.90), torso); R.head = hp
    # 颈
    cyl('neck', 0.05, 0.055, 0.12, loc=(0, 0, 0.04), m=skin, parent=hp, seg=14)
    # 颅骨（长椭圆脸，收下颌）
    sphere('face', 0.135, loc=(0, -0.005, 0.14), scale=(0.82, 0.90, 1.18),
           m=skin, parent=hp, seg=24, rings=16)
    # 下颌（尖）
    sphere('jaw', 0.068, loc=(0, -0.01, 0.04), scale=(0.72, 0.72, 0.9),
           m=skin, parent=hp, seg=16, rings=10)
    # 眉骨
    box('browbone', (0.09, 0.03, 0.025), loc=(0, -0.118, 0.19),
        m=skin, parent=hp, bevel=0.008)
    # 耳
    for s in (-1, 1):
        sphere('ear', 0.024, loc=(s * 0.115, 0, 0.13), scale=(0.45, 0.65, 1),
               m=skin, parent=hp, seg=10, rings=8)
    # 眼
    for s in (-1, 1):
        sphere('eye', 0.016, loc=(s * 0.046, -0.120, 0.17), scale=(0.7, 0.35, 1.0),
               m=M('#140e0c', rough=0.15), parent=hp, seg=10, rings=6)
        sphere('eyehl', 0.004, loc=(s * 0.040, -0.132, 0.178),
               m=M('#ffffff', emit=1.2), parent=hp, seg=6, rings=4)
    # 剑眉
    for s in (-1, 1):
        tube('brow', [(s * 0.020, -0.122, 0.205), (s * 0.068, -0.122, 0.215)],
             0.006, m=hair, parent=hp)
    # 鼻梁 + 鼻尖
    box('nose', (0.018, 0.035, 0.07), loc=(0, -0.125, 0.11),
        rot=(D(10), 0, 0), m=skin, parent=hp, bevel=0.006)
    sphere('nosetip', 0.015, loc=(0, -0.145, 0.075), scale=(0.85, 1.1, 0.85),
           m=skin, parent=hp, seg=8, rings=6)
    # 唇
    box('lips', (0.034, 0.012, 0.012), loc=(0, -0.118, 0.040),
        m=M_lips(), parent=hp, bevel=0.004)
    # 头发（后/顶，露额头）
    sphere('haircap', 0.140, loc=(0, 0.035, 0.19), scale=(0.86, 0.90, 0.95),
           m=hair, parent=hp, seg=24, rings=16)
    # 刘海（高，仅额顶）
    for i, a in enumerate((-0.4, -0.1, 0.2, 0.45)):
        sphere('bang', 0.032, loc=(math.sin(a) * 0.070, -0.095, 0.22 - abs(a) * 0.015),
               scale=(1, 0.5, 1.1), m=hair, parent=hp, rot=(D(15), a * 0.5, 0),
               seg=10, rings=8)
    # 鬓发（两侧垂）
    for s in (-1, 1):
        tube('sideburn', [(s * 0.10, -0.02, 0.20), (s * 0.105, -0.03, 0.08), (s * 0.09, -0.02, 0.0)],
             0.022, m=hair, parent=hp, taper=[1, 0.75, 0.25])
    # 高马尾
    tube('ponytail', [(0, 0.04, 0.26), (0, 0.08, 0.38), (0, 0.14, 0.34), (0, 0.18, 0.16)],
         0.035, m=hair, parent=hp, taper=[1, 1.0, 0.65, 0.18])
    # 金冠 + 发簪
    cyl('crown', 0.035, 0.038, 0.032, loc=(0, 0.02, 0.26), m=gold, parent=hp, seg=12)
    cyl('hairpin', 0.009, 0.009, 0.20, loc=(0, 0.02, 0.28), rot=(0, D(80), 0),
        m=gold, parent=hp, seg=8)

    # ============ 右手持剑 ============
    from chars import swordmesh
    swordmesh(R.handR, L=0.65)
    R.handR.rotation_euler = (D(-50), 0, D(15))

    return R

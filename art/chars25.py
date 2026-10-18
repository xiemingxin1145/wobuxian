"""v2.5 三角色新底模：3 头身低模人形（Cube/Cylinder 挤出 + Mirror + Loop Cut 风格）

设计依据：02_美术升级_2.5D方案.md §2.1.3
- 3 头身 1:1:1（头/躯干/腿），介于发布版 2 头身与 v2.4 的 5.5 头身之间
- 剪影清晰：肩略宽于髋、腰内收、袖口裙摆外撇
- 复用 art/lib.py 的 lights/camera/mat/M/hexc/empty/box/cyl/tube/lathe 等
- Rig 关节命名与 chars.py 完全一致：root/base/body/torso/headp/armL/armR/legL/legR
  → chars.pose() 姿势表可直接驱动，姿势不用重摆
- 帧尺寸锚点 192×224（v24 标准），anchor=(0.5, 0.86)
- 输出目录 frames25/，sprite id 不变（仍挂 player_m0 / player_f0 / npc_aotian）

【待本机渲染】当前环境无 Blender，本脚本仅建模逻辑，不产出 PNG。
渲染命令示例（Blender 4.2 无头模式）：
  cd art/
  WBX_SAMPLES=32 WBX_RES=2 WBX_CEL=1 WBX_THREADS=6 \
    blender -b -P render_sprites25.py -- --ids player_m0,player_f0,npc_aotian
预期产物：
  art/out/frames25/player_m0/{idle,walk,attack,hurt}_<dir>_<f>.png  (192×224 × 5方向 × 16帧 = 80帧)
  art/out/frames25/player_f0/...  (同上)
  art/out/frames25/npc_aotian/... (同上)
"""
import math
from lib import *

SK = '#ffe0cc'
OL = 0.018 if os.environ.get('WBX_CEL') == '1' else 0.014  # 描边厚度（比旧版略细，配合低模棱角）


# ============================================================
#  低模人形构建（3 头身 1:1:1）
# ============================================================
class Rig25:
    pass


def _mirror_x(obj):
    """X 轴镜像修改器（对称部件只建一半）"""
    md = obj.modifiers.new('mirror_x', 'MIRROR')
    md.use_axis = (True, False, False)
    md.use_clip = True
    md.use_mirror_merge = True
    md.merge_threshold = 0.001
    return md


def lowpoly_head(spec, hp, hr=0.36):
    """低模头部：方中带圆的头型 + 放大眼贴片 + 简化五官。
    替代旧版整球头贴五官小球的做法。"""
    skin = M(spec.get('skin', SK), rough=0.5, sss=0.25)
    # 头型：用 box + bevel 做出方中带圆的 Q 版头（比 sphere 更有"低模感"）
    head = box('head_box', (hr * 1.7, hr * 1.6, hr * 1.85),
               loc=(0, 0, hr * 0.92), m=skin, parent=hp, bevel=hr * 0.35, outline=OL)
    # 下巴微收（用第二个小 box 叠加出下颌线）
    box('jaw', (hr * 1.3, hr * 1.2, hr * 0.5),
        loc=(0, -hr * 0.08, hr * 0.45), m=skin, parent=hp, bevel=hr * 0.2)
    # 耳朵
    for s in (-1, 1):
        box('ear', (hr * 0.22, hr * 0.18, hr * 0.35),
            loc=(s * hr * 0.88, 0, hr * 0.9), m=skin, parent=hp, bevel=hr * 0.08)
    # ---- 五官（贴片式，比旧版小球更干净）----
    eye_col = M(spec.get('eye', '#2b1a14'), rough=0.15, spec=0.8)
    eye_y = -hr * 0.55  # 眼在头前(-Y)偏下
    eye_z = hr * 1.05
    eye_x = hr * 0.42
    for s in (-1, 1):
        # 眼睛：扁 box 贴片（动漫大眼感）
        box('eye', (hr * 0.28, hr * 0.06, hr * 0.34),
            loc=(s * eye_x, eye_y, eye_z), m=eye_col, parent=hp, bevel=hr * 0.06)
        # 高光
        box('eye_hl', (hr * 0.08, hr * 0.03, hr * 0.1),
            loc=(s * eye_x + hr * 0.06, eye_y - hr * 0.04, eye_z + hr * 0.08),
            m=M('#ffffff', emit=1.2), parent=hp, bevel=hr * 0.02)
        # 眉毛（细 box）
        if spec.get('brow', True):
            brow_z = eye_z + hr * 0.28
            box('brow', (hr * 0.3, hr * 0.05, hr * 0.06),
                loc=(s * eye_x, eye_y - hr * 0.02, brow_z),
                rot=(0, s * D(5), 0),
                m=M(spec.get('hair', '#2a1b14')), parent=hp, bevel=hr * 0.02)
    # 嘴（小 box）
    mouth_z = hr * 0.55
    mouth_style = spec.get('mouth', 'smile')
    if mouth_style == 'open':
        box('mouth', (hr * 0.16, hr * 0.05, hr * 0.1),
            loc=(0, eye_y - hr * 0.02, mouth_z), m=M('#8a2a2a'), parent=hp, bevel=hr * 0.03)
    else:
        box('mouth', (hr * 0.18, hr * 0.04, hr * 0.04),
            loc=(0, eye_y - hr * 0.03, mouth_z), m=M('#7a2a2a'), parent=hp, bevel=hr * 0.015)
    # 腮红（可选，半透明贴片）
    if spec.get('blush', True):
        for s in (-1, 1):
            box('blush', (hr * 0.2, hr * 0.03, hr * 0.1),
                loc=(s * hr * 0.55, eye_y - hr * 0.05, hr * 0.7),
                m=M('#ff8fa0', rough=0.9, alpha=0.6), parent=hp, bevel=hr * 0.04)
    return head


def lowpoly_hair(spec, hp, hr=0.36):
    """低模头发：大块面发束（tube 锥度条带），替代旧版球帽+5球刘海。"""
    hm = M(spec.get('hair', '#2a1b14'), rough=0.5, spec=0.25)
    st = spec.get('hairstyle', 'bun')
    # 头顶发帽（box 低模感）
    box('hair_cap', (hr * 1.75, hr * 1.65, hr * 0.7),
        loc=(0, hr * 0.02, hr * 1.55), m=hm, parent=hp, bevel=hr * 0.25, outline=OL)
    # 刘海：3~4 条大面发束（tube 锥度），不再是小球一排
    bang_angles = (-0.5, -0.15, 0.15, 0.5)
    for i, a in enumerate(bang_angles):
        x = math.sin(a) * hr * 0.7
        z_top = hr * 1.6
        z_bot = hr * 1.15 - abs(a) * hr * 0.15
        tube('bang', [(x, -hr * 0.75, z_top), (x * 1.1, -hr * 0.82, z_bot)],
             radius=hr * 0.14, m=hm, parent=hp, taper=[1, 0.7])
    # 鬓发（两侧垂发）
    for s in (-1, 1):
        tube('side_lock',
             [(s * hr * 0.85, -hr * 0.1, hr * 1.4),
              (s * hr * 0.9, -hr * 0.15, hr * 0.8),
              (s * hr * 0.8, -hr * 0.1, hr * 0.4)],
             radius=hr * 0.1, m=hm, parent=hp, taper=[1, 0.9, 0.4])
    # 发型变体
    if st == 'bun':
        # 发髻（头顶丸子）
        box('hair_bun', (hr * 0.5, hr * 0.5, hr * 0.45),
            loc=(0, 0, hr * 1.95), m=hm, parent=hp, bevel=hr * 0.18, outline=OL)
        # 发带
        box('hair_band', (hr * 1.78, hr * 1.68, hr * 0.1),
            loc=(0, 0, hr * 1.75), m=M(spec.get('ribbon', '#e84a5f'), rough=0.4),
            parent=hp, bevel=hr * 0.03)
    elif st == 'pony':
        # 马尾（tube 后垂）
        tube('ponytail',
             [(0, hr * 0.6, hr * 1.7),
              (0, hr * 0.9, hr * 1.2),
              (0, hr * 0.8, hr * 0.6),
              (0, hr * 0.7, hr * 0.3)],
             radius=hr * 0.18, m=hm, parent=hp, taper=[1, 1.1, 0.8, 0.3])
    elif st == 'double':
        # 双丸子头
        for s in (-1, 1):
            box('bun', (hr * 0.42, hr * 0.42, hr * 0.4),
                loc=(s * hr * 0.5, 0, hr * 1.9), m=hm, parent=hp, bevel=hr * 0.15, outline=OL)
    elif st == 'crown':
        # 宗门冠（box 简化版）
        box('crown', (hr * 0.6, hr * 0.5, hr * 0.35),
            loc=(0, 0, hr * 2.0), m=M('#ffd25e', metal=0.6, rough=0.3),
            parent=hp, bevel=hr * 0.08, outline=OL)
    elif st == 'short':
        # 短发：顶部尖刺
        for a in (-0.6, -0.2, 0.2, 0.6):
            x = math.sin(a) * hr * 0.5
            box('spike', (hr * 0.15, hr * 0.15, hr * 0.35),
                loc=(x, 0, hr * 1.9), rot=(D(15), a * 0.5, 0),
                m=hm, parent=hp, bevel=hr * 0.05)


def lowpoly_torso(spec, torso, fat=1.0):
    """低模躯干：肩宽腰窄的梯形轮廓（用 box + bevel 做出体积感）。
    替代旧版 lathe 车削回转裙。"""
    robe = spec.get('robe', '#6fbf8a')
    robe2 = spec.get('robe2', '#fff6e8')
    rm = M(robe, rough=0.62, sheen=0.4)
    rm2 = M(robe2, rough=0.6)
    trim = spec.get('trim', '#ffd25e')
    skirt = spec.get('skirt', 0.3) * fat

    # 躯干主体：上宽下窄的梯形（box 缩放 + bevel）
    # 肩宽 ~0.36，腰宽 ~0.24，高 ~0.4（3 头身中段）
    torso_h = 0.42
    torso_w_top = 0.36 * fat
    torso_w_bot = 0.26 * fat
    # 用 lathe 做微收腰轮廓（比纯 box 更有"人"形）
    lathe('torso_body',
          [(torso_w_top, torso_h),
           (torso_w_top * 0.95, torso_h * 0.75),
           (torso_w_bot, torso_h * 0.4),
           (torso_w_bot * 1.1, torso_h * 0.15)],
          m=rm, parent=torso, seg=16, outline=OL)
    # 裙摆（下半身外撇，女主更宽）
    skirt_h = 0.28
    lathe('skirt',
          [(torso_w_bot * 1.1, skirt_h),
           (skirt, skirt_h * 0.6),
           (skirt * 1.05, 0.02)],
          m=rm, parent=torso, seg=16, outline=OL)
    # 裙边描金
    lathe('hem',
          [(skirt * 1.05 + 0.005, 0.02),
           (skirt * 1.08, 0.05)],
          m=M(trim, rough=0.4, metal=0.3), parent=torso, seg=16, close_top=False)
    # 交领（两条斜 box 布带）
    for s in (-1, 1):
        box('collar', (0.06, 0.03, 0.22),
            loc=(s * 0.06, -0.18, torso_h * 0.85),
            rot=(D(-12), s * D(-30), 0), m=rm2, parent=torso, bevel=0.01)
    # 腰带
    torus('belt', torso_w_bot * 0.95, 0.03,
          loc=(0, 0, torso_h * 0.45),
          m=M(spec.get('belt', '#ffd25e'), rough=0.4, metal=0.2),
          parent=torso, seg=16)
    # 前襟（交领下的矩形布片）
    box('panel', (0.14, 0.03, 0.25),
        loc=(0, -0.22, torso_h * 0.4),
        rot=(D(-10), 0, 0), m=rm2, parent=torso, bevel=0.01)
    # 披风（可选）
    if spec.get('cape'):
        lathe('cape',
              [(torso_w_top * 1.1, torso_h * 0.9),
               (torso_w_top * 1.05, torso_h * 0.5),
               (skirt * 1.1, 0.1)],
              loc=(0, 0.04, 0),
              m=M(spec['cape'], rough=0.7, sheen=0.5),
              parent=torso, seg=16)


def lowpoly_arms(spec, torso, R):
    """低模手臂：上臂+前臂两段（box/cyl），宽袖外撇。"""
    robe = spec.get('robe', '#6fbf8a')
    rmS = mat('sl_' + robe, tuple(c * 0.8 for c in hexc(robe)[:3]) + (1,), rough=0.62, sheen=0.4)
    skin = M(spec.get('skin', SK), rough=0.5, sss=0.25)
    R.arms = []
    for s in (-1, 1):
        ap = empty('arm', (s * 0.2, 0, 0.62), torso)
        # 上臂（袖筒，上粗下细）
        cyl('sleeve', 0.07, 0.11, 0.2,
            loc=(s * 0.04, 0, -0.1),
            rot=(0, s * D(-15), 0),
            m=rmS, parent=ap, seg=12, outline=OL)
        # 袖口
        cyl('cuff', 0.115, 0.115, 0.03,
            loc=(s * 0.08, 0, -0.2),
            rot=(0, s * D(-15), 0),
            m=M(spec.get('trim', '#ffd25e'), metal=0.3, rough=0.4),
            parent=ap, seg=12)
        # 手
        hand = empty('hand', (s * 0.1, 0, -0.25), ap)
        box('hand_m', (0.07, 0.06, 0.09),
            loc=(0, 0, -0.02), m=skin, parent=hand, bevel=0.02)
        R.arms.append(ap)
        if s == 1:
            R.handR = hand
        else:
            R.handL = hand


def lowpoly_legs(spec, body, R):
    """低模腿：大腿+小腿两段（cyl），脚略放大保 Q 感。"""
    pants = spec.get('pants', '#4a3a3a')
    shoe = spec.get('shoe', '#3a2a2a')
    R.legs = []
    for s in (-1, 1):
        lp = empty('leg', (s * 0.09, 0, 0.22), body)
        # 大腿
        cyl('thigh', 0.06, 0.055, 0.18,
            loc=(0, 0, -0.09),
            m=M(pants, rough=0.7), parent=lp, seg=10)
        # 小腿
        cyl('shin', 0.05, 0.045, 0.16,
            loc=(0, 0, -0.25),
            m=M(pants, rough=0.7), parent=lp, seg=10)
        # 脚（扁 box，略放大）
        box('foot', (0.09, 0.13, 0.06),
            loc=(0, -0.03, -0.34),
            m=M(shoe, rough=0.5), parent=lp, bevel=0.02, outline=OL)
        R.legs.append(lp)


# ============================================================
#  主入口：构建一个完整的低模人形角色
# ============================================================
def chibi25(spec, scale=1.2):
    """3 头身低模人形。朝向 -Y。返回与 chars.py chibi() 兼容的 Rig 对象。

    与 chars.chibi() 的区别：
    - 头身比 3:1:1:1（头/躯干/腿），替代旧版 ~2 头身球拼
    - 头型用 box+bevel 方中带圆，替代整球头
    - 五官用贴片 box，替代小球五官
    - 头发用大块面 tube 发束，替代球帽+小球刘海
    - 躯干用 lathe 微收腰轮廓 + 裙摆外撇，替代纯回转裙
    - Rig 关节命名完全一致 → pose() 姿势表直接复用
    """
    R = Rig25()
    R.spec = spec
    R.root = empty('root')
    R.base = empty('base', parent=R.root)
    R.base.scale = (scale, scale, scale)
    R.body = empty('body', (0, 0, 0.0), R.base)

    fat = spec.get('fat', 1.0)

    # 腿/脚
    lowpoly_legs(spec, R.body, R)

    # 躯干
    R.torso = empty('torso', (0, 0, 0.0), R.body)
    lowpoly_torso(spec, R.torso, fat=fat)

    # 手臂
    lowpoly_arms(spec, R.torso, R)

    # 头
    R.head = empty('headp', (0, 0, 0.72), R.torso)
    hr = 0.36 * spec.get('headScale', 1.0)
    # 脖子
    cyl('neck', 0.06, 0.06, 0.08,
        loc=(0, 0, 0.04),
        m=M(spec.get('skin', SK), rough=0.5, sss=0.25),
        parent=R.head, seg=10)
    lowpoly_head(spec, R.head, hr=hr)
    if spec.get('hairstyle') != 'none':
        lowpoly_hair(spec, R.head, hr=hr)

    # 手持物（复用 chars.weapon 逻辑，导入避免循环依赖）
    import chars as _chars
    w = spec.get('weapon')
    if w:
        _chars.weapon(R.handR, w)
    if spec.get('left'):
        _chars.weapon(R.handL, spec['left'])
    if spec.get('back') == 'sword':
        g = empty('backsw', (0.02, 0.22, 0.4), R.torso)
        g.rotation_euler = (D(5), D(40), 0)
        _chars.swordmesh(g, 0.75)

    return R


# ============================================================
#  姿势表（复用 chars.pose，这里只是转发说明）
# ============================================================
# chars.pose(R, anim, f, n) 的关节访问模式：
#   R.body, R.torso, R.head, R.legs(list), R.arms(list)
# 本脚本的 Rig25 完全兼容这些属性，因此 chars.pose() 可直接调用。
# 姿势幅度建议（02 文档 §2.1.4d）：
#   idle: 呼吸幅度 ×2.5（当前 ±0.012 → ±0.03）
#   walk: 跨步 ±40°（当前 ±32°）
#   attack: 加预备帧（5→6 帧）——本批暂沿用 5 帧，后续微调
# 若需独立姿势表，可在此覆盖：
#   import chars
#   def pose25(R, anim, f, n):
#       # 放大幅度版本
#       ...
#       chars.pose(R, anim, f, n)  # 暂直接复用


# ============================================================
#  三角色规格定义（供渲染脚本选择）
# ============================================================
CHAR_SPECS = {
    'player_m0': dict(
        robe='#b8946a', robe2='#efe2c8', trim='#8a6a44', belt='#6a4a2a',
        pants='#5a4a3a', skirt=0.28,
        hair='#2a1b14', hairstyle='bun', ribbon='#3a5a8a',
        skin=SK,
    ),
    'player_f0': dict(
        robe='#b8946a', robe2='#efe2c8', trim='#8a6a44', belt='#6a4a2a',
        pants='#5a4a3a', skirt=0.31,  # 女主裙摆略宽
        hair='#2a1610', hairstyle='pony', ribbon='#e84a5f', long=True,
        skin=SK,
    ),
    'npc_aotian': dict(
        robe='#ffffff', robe2='#ffd25e', trim='#ffb020', belt='#ffb020',
        hair='#1a1a2a', hairstyle='crown', cape='#c0303a',
        weapon='gsword', eyes='angry', mouth='smile', ribbon='#c0303a',
        skirt=0.3,
    ),
}


# ============================================================
#  渲染入口（独立脚本，供 Blender 无头模式调用）
# ============================================================
if __name__ == '__main__':
    """独立渲染入口：blender -b -P chars25.py -- --ids player_m0,player_f0,npc_aotian

    本脚本自包含，不依赖 render_sprites.py。
    输出到 art/out/frames25/<sid>/<anim>_<dir>_<f>.png
    """
    import sys
    a = args()
    ids = a.get('ids', 'player_m0').split(',')
    out_base = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'frames25')
    os.makedirs(out_base, exist_ok=True)

    DIRS5 = ['S', 'SW', 'W', 'NW', 'N']
    DIRV = {'S': (1, -1), 'SW': (0, -1), 'W': (-1, -1), 'NW': (-1, 0), 'N': (-1, 1)}
    ANIMS = {'idle': 4, 'walk': 6, 'attack': 5, 'hurt': 1}

    for sid in ids:
        spec = CHAR_SPECS[sid]
        t0 = __import__('time').time()
        reset()
        lights()
        R = chibi25(spec, scale=1.2)
        w, h = 192, 224  # v24 标准帧尺寸
        k = float(os.environ.get('WBX_RES', 1))
        camera(int(w * k), int(h * k), anchor=(0.5, 0.86), ortho_scale=h / P)
        d = os.path.join(out_base, sid)
        os.makedirs(d, exist_ok=True)
        for dn in DIRS5:
            vx, vy = DIRV[dn]
            R.root.rotation_euler = (0, 0, math.atan2(vy, vx) + math.pi / 2)
            for an, n in ANIMS.items():
                for f in range(n):
                    # 复用 chars.pose 姿势表
                    import chars
                    chars.pose(R, an, f, n)
                    render(os.path.join(d, f'{an}_{dn}_{f}.png'))
        print(f'DONE {sid} {sum(ANIMS.values()) * len(DIRS5)} frames',
              round(__import__('time').time() - t0, 1), 's', flush=True)

"""v2.6 批量低模化：把 57 个旧 NPC/怪物/坐骑（assets.json 中 160x176 的旧基元精灵）批量重建成低模。

设计依据：2.6 启动任务书 §B-1、02_美术升级_2.5D方案.md §2.1/§2.5
- 复用 chars25.py 的 3 头身 box+lathe 低模人形（chibi25），不再球拼。
- 按体型变体分 4 类模板（任务书列 3 类 + 坐骑补 1 类）：
    1) 人形 NPC（直立 3 头身）        → 41 个：npc_* (17) + cos_* (20) + mon_chibi (collector/fox/jiangshi/demon = 4)
    2) 兽形怪（四足/异形，box/cyl/lathe 低模） → 6 个：slime/boar/rock/fire/treant/crab
    3) 灵异（鬼魂/纸符，半透明飘形体）        → 2 个：ghost/paper
    4) 坐骑/坐驾（载具形，idle 漂浮）         → 8 个：cloud/fsword/gourd/crane/lotus/bowl/carp/abacus
- sprite id 严格不变（仍挂现有 key），只换该 key 的 webp 图片内容 → 图集/存档零感知。
- 帧尺寸升级到 v24 标准 192x224（与玩家主角/25 NPC 一致，engine.js 热区自动走 v24 分支）。
- 输出目录 frames26/（并行目录，不动 out/frames/ 与 out/frames2/）。

【待本机渲染】当前环境无 Blender，本脚本仅建模逻辑 + 批渲染入口，不产出 PNG。
渲染命令（Blender 4.2 无头）：
  cd art/
  WBX_SAMPLES=32 WBX_RES=2 WBX_CEL=1 WBX_THREADS=6 \
    blender -b -P chars26.py
  # 或只渲某一类：
  blender -b -P chars26.py -- --ids npc_yuelao,mon_boar,mount_crane
预期产物：
  art/out/frames26/<sid>/<anim>_<dir>_<f>.png
    - 人形 NPC（PL_ANIMS 16帧×5方向=80 / NPC_ANIMS 10帧×5方向=50）
    - 兽形怪/灵异（PL_ANIMS 16帧×5方向=80）
    - 坐骑（MOUNT_ANIMS idle4×5方向=20）
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *          # noqa: E402
import chars               # noqa: E402  (复用 pose 姿势表 / weapon)
import monsters            # noqa: E402  (复用 mpose 怪物姿势表 / _base)
import chars25             # noqa: E402  (复用 chibi25 低模人形)
from specs import SPRITES, DIRS5, DIRV  # noqa: E402

OL = 0.018 if os.environ.get('WBX_CEL') == '1' else 0.014  # 描边（与 chars25 对齐）

# ============================================================
#  57 个待低模化对象分类登记（id 与 assets.json / specs.SPRITES 严格一致）
# ============================================================
# 人形 NPC：kind=='chibi' 的全部旧精灵（复用 chars25.chibi25）
HUMANOID_IDS = [
    # npc_*（17）—— v2.1/v2.2 旧 NPC，仍是球拼人
    'npc_yuelao', 'npc_mengpo', 'npc_luren', 'npc_qymaster', 'npc_tongzi',
    'npc_taizi', 'npc_sanniang', 'npc_zhuiming', 'npc_tianbing', 'npc_xiaoyao',
    'npc_guanghan', 'npc_caishen', 'npc_leigong', 'npc_suanpan', 'npc_guizu',
    'npc_xiabing', 'npc_baiwuchang',
    # mon_* 中 kind=='chibi' 的类人形怪（4）
    'mon_collector', 'mon_fox', 'mon_jiangshi', 'mon_demon',
    # cos_* 时装（20）
    'cos_xifu_m', 'cos_xifu_f', 'cos_xiake_m', 'cos_xiake_f',
    'cos_yuyi_m', 'cos_yuyi_f', 'cos_mowang_m', 'cos_mowang_f',
    'cos_taohua_m', 'cos_taohua_f', 'cos_longpao_m', 'cos_longpao_f',
    'cos_longwang_m', 'cos_longwang_f', 'cos_guishi_m', 'cos_guishi_f',
    'cos_tianjia_m', 'cos_tianjia_f', 'cos_caishen_m', 'cos_caishen_f',
]
# 兽形怪：kind=='mon' 的四足/异形（新写低模兽形模板）
BEAST_IDS = ['mon_slime', 'mon_boar', 'mon_rock', 'mon_fire', 'mon_treant', 'mon_crab']
# 灵异：鬼魂/纸符（新写低模灵异模板）
SPIRIT_IDS = ['mon_ghost', 'mon_paper']
# 坐骑/坐驾：载具形（idle 漂浮，低模坐驾模板）
MOUNT_IDS = ['mount_cloud', 'mount_fsword', 'mount_gourd', 'mount_crane',
             'mount_lotus', 'mount_bowl', 'mount_carp', 'mount_abacus']

ALL26 = HUMANOID_IDS + BEAST_IDS + SPIRIT_IDS + MOUNT_IDS
assert len(ALL26) == 57, f'2.6 低模化对象应为 57，实得 {len(ALL26)}'


# ============================================================
#  兽形怪低模模板（box/cyl/lathe/tube 为主，低段数，替代旧 sphere 堆叠）
# ============================================================
def _mrig(scale, kind):
    R = monsters._base(scale)
    R.kind = kind
    return R


def lp_slime(R):
    """史莱姆：压扁 lathe 水滴体 + 大眼贴片 + 小讨债帽。"""
    b = R.body
    m = M('#9a6cff', rough=0.15, spec=0.9, sss=0.3)
    lathe('slime', [(0.0, 0.02), (0.34, 0.06), (0.42, 0.2), (0.4, 0.4),
                    (0.3, 0.55), (0.12, 0.62), (0.0, 0.63)],
          m=m, parent=b, seg=20, outline=OL)
    box('eye', (0.12, 0.05, 0.14), loc=(-0.1, -0.4, 0.42),
        m=M('#ffffff', rough=0.3), parent=b, bevel=0.03)
    box('eye', (0.12, 0.05, 0.14), loc=(0.1, -0.4, 0.42),
        m=M('#ffffff', rough=0.3), parent=b, bevel=0.03)
    box('pupil', (0.06, 0.04, 0.08), loc=(-0.1, -0.43, 0.42),
        m=M('#2a1040'), parent=b, bevel=0.02)
    box('pupil', (0.06, 0.04, 0.08), loc=(0.1, -0.43, 0.42),
        m=M('#2a1040'), parent=b, bevel=0.02)
    cyl('hat', 0.1, 0.09, 0.14, loc=(0.05, 0.02, 0.7), m=M('#2a2a34'),
        parent=b, seg=12, outline=OL)
    cyl('brim', 0.17, 0.17, 0.02, loc=(0.05, 0.02, 0.66), m=M('#2a2a34'), parent=b, seg=12)


def lp_boar(R):
    """山猪：box 躯干 + box 头 + lathe 猪鼻 + tube 獠牙，四足 cyl。"""
    b = R.body
    m = M('#5aa58a', rough=0.75, sheen=0.5); dk = M('#2f6b58', rough=0.8)
    box('torso', (0.7, 0.95, 0.55), loc=(0, 0.05, 0.42), m=m, parent=b,
        bevel=0.1, outline=OL)
    box('head', (0.45, 0.4, 0.42), loc=(0, -0.42, 0.52), m=m, parent=b,
        bevel=0.1, outline=OL)
    box('snout', (0.26, 0.16, 0.2), loc=(0, -0.66, 0.46), m=M('#f0a0a8'),
        parent=b, bevel=0.05)
    for s in (-1, 1):
        tube('tusk', [(s * 0.12, -0.62, 0.4), (s * 0.18, -0.72, 0.55)],
             0.03, m=M('#fffbe8', rough=0.3), parent=b, taper=[1, 0.1])
        box('ear', (0.12, 0.06, 0.16), loc=(s * 0.2, -0.36, 0.78),
            rot=(0, s * D(20), 0), m=dk, parent=b, bevel=0.03)
        box('eye', (0.06, 0.04, 0.06), loc=(s * 0.12, -0.62, 0.6),
            m=M('#ff3a2a', emit=2.0), parent=b, bevel=0.02)
    for x, y in ((-0.22, -0.2), (0.22, -0.2), (-0.22, 0.32), (0.22, 0.32)):
        g = empty('leg', (x, y, 0.26), b); R.limbs.append(g)
        cyl('legm', 0.08, 0.07, 0.26, loc=(0, 0, -0.12), m=dk, parent=g, seg=8)


def lp_rock(R):
    """石怪：低段 icosphere 核 + box 拳套 + 头顶苔藓小枝。"""
    b = R.body
    m = M('#8a8270', rough=0.9); m2 = M('#6f6858', rough=0.9)
    sphere('core', 0.42, loc=(0, 0, 0.5), scale=(1, 0.9, 1.05), m=m, parent=b,
           seg=6, rings=4, outline=OL)
    box('eye', (0.1, 0.05, 0.08), loc=(-0.12, -0.36, 0.6),
        m=M('#ffb030', emit=2.5), parent=b, bevel=0.02)
    box('eye', (0.1, 0.05, 0.08), loc=(0.12, -0.36, 0.6),
        m=M('#ffb030', emit=2.5), parent=b, bevel=0.02)
    for s in (-1, 1):
        g = empty('armp', (s * 0.45, 0, 0.55), b); R.limbs.append(g)
        box('fist', (0.22, 0.22, 0.22), loc=(s * 0.05, -0.05, -0.2),
            m=m2, parent=g, bevel=0.05, outline=OL)
    box('moss', (0.28, 0.2, 0.08), loc=(0.05, 0, 0.95),
        m=M('#6fbf4a', rough=0.9), parent=b, bevel=0.03)


def lp_fire(R):
    """火怪：lathe 水滴身 + cyl 火苗锥。"""
    b = R.body
    m = M('#ff5a1a', emit=0.9, rough=0.3, emit_col=(1.0, 0.35, 0.05))
    lathe('fb', [(0.0, 0.02), (0.28, 0.1), (0.33, 0.4), (0.22, 0.7),
                 (0.0, 0.85)], m=m, parent=b, seg=16, outline=OL)
    box('eye', (0.09, 0.04, 0.09), loc=(-0.1, -0.3, 0.5),
        m=M('#2a0800'), parent=b, bevel=0.02)
    box('eye', (0.09, 0.04, 0.09), loc=(0.1, -0.3, 0.5),
        m=M('#2a0800'), parent=b, bevel=0.02)
    for k in range(4):
        a = k / 4 * 6.28
        cyl('flame', 0.1, 0.0, 0.3, loc=(math.cos(a) * 0.18, math.sin(a) * 0.18, 0.9),
            rot=(math.sin(a) * 0.4, -math.cos(a) * 0.4, 0), m=m, parent=b, seg=8)


def lp_treant(R):
    """树精：cyl 树干 + lathe 树冠球簇 + tube 枝臂。"""
    b = R.body
    bark = M('#7a5a3a', rough=0.9); leaf = M('#5fb85a', rough=0.8, sheen=0.4)
    cyl('trunk', 0.34, 0.26, 0.8, loc=(0, 0, 0.42), m=bark, parent=b,
        seg=8, outline=OL)
    lathe('crown', [(0.38, 0.0), (0.4, 0.25), (0.3, 0.5), (0.0, 0.62)],
          loc=(0, 0, 0.78), m=leaf, parent=b, seg=12, outline=OL)
    box('eye', (0.09, 0.04, 0.09), loc=(-0.1, -0.3, 0.6),
        m=M('#ffe060', emit=2.0), parent=b, bevel=0.02)
    box('eye', (0.09, 0.04, 0.09), loc=(0.1, -0.3, 0.6),
        m=M('#ffe060', emit=2.0), parent=b, bevel=0.02)
    for s in (-1, 1):
        g = empty('armp', (s * 0.32, 0, 0.7), b); R.limbs.append(g)
        tube('branch', [(0, 0, 0), (s * 0.2, -0.08, -0.05), (s * 0.34, -0.12, 0.05)],
             0.05, m=bark, parent=g, taper=[1, 0.6, 0.2])


def lp_crab(R):
    """螃蟹：box 壳 + box 肚 + tube 钳臂 + cyl 眼柄。"""
    b = R.body
    m = M('#e0503a', rough=0.35, spec=0.7); m2 = M('#ff8a6a', rough=0.4)
    box('shell', (0.75, 0.55, 0.28), loc=(0, 0, 0.45), m=m, parent=b,
        bevel=0.08, outline=OL)
    box('belly', (0.6, 0.45, 0.16), loc=(0, -0.05, 0.36), m=m2, parent=b, bevel=0.05)
    for s in (-1, 1):
        cyl('stalk', 0.025, 0.025, 0.16, loc=(s * 0.12, -0.22, 0.62), m=m, parent=b, seg=6)
        box('eye', (0.08, 0.06, 0.08), loc=(s * 0.12, -0.24, 0.72),
            m=M('#ffffff', rough=0.3), parent=b, bevel=0.02)
        g = empty('claw', (s * 0.42, -0.15, 0.45), b); R.limbs.append(g)
        tube('carm', [(0, 0, 0), (s * 0.12, -0.24, 0.12)], 0.05, m=m, parent=g)
        box('pincer', (0.16, 0.18, 0.12), loc=(s * 0.13, -0.34, 0.14),
            m=m, parent=g, bevel=0.04, outline=OL)
    cyl('helm', 0.16, 0.12, 0.12, loc=(0, 0.05, 0.68),
        m=M('#c0a040', metal=0.8, rough=0.3), parent=b, seg=12)


BEAST_BUILD = {
    'mon_slime': lp_slime, 'mon_boar': lp_boar, 'mon_rock': lp_rock,
    'mon_fire': lp_fire, 'mon_treant': lp_treant, 'mon_crab': lp_crab,
}


# ============================================================
#  灵异低模模板（鬼魂/纸符，半透明、飘形体、无实腿）
# ============================================================
def lp_ghost(R):
    """鬼魂：lathe 钟形飘体（下摆尖角）+ 半透明白 + 发光眼。"""
    b = R.body
    m = M('#eef4ff', rough=0.5, sss=0.4, alpha=0.85)
    lathe('gb', [(0.3, 0.1), (0.32, 0.35), (0.28, 0.6), (0.18, 0.78), (0.0, 0.84)],
          m=m, parent=b, seg=20, outline=OL)
    box('face', (0.34, 0.06, 0.4), loc=(0, -0.2, 0.72),
        m=M('#f4f8ff', rough=0.5), parent=b, bevel=0.08)
    box('eye', (0.07, 0.04, 0.12), loc=(-0.08, -0.24, 0.74),
        m=M('#60e0ff', emit=3.0), parent=b, bevel=0.02)
    box('eye', (0.07, 0.04, 0.12), loc=(0.08, -0.24, 0.74),
        m=M('#60e0ff', emit=3.0), parent=b, bevel=0.02)
    for s in (-1, 1):
        g = empty('armp', (s * 0.28, -0.05, 0.6), b); R.limbs.append(g)
        cyl('gsl', 0.06, 0.1, 0.3, loc=(s * 0.04, -0.1, -0.08),
            rot=(D(70), 0, 0), m=m, parent=g, seg=10)


def lp_paper(R):
    """纸符人：竖直扁 box 纸片身（半透米黄）+ 红符文条 + 小袖管。"""
    b = R.body
    m = M('#ffd65a', rough=0.85, sss=0.15)
    box('paper', (0.5, 0.04, 0.95), loc=(0, 0, 0.55), m=m, parent=b,
        bevel=0.01, outline=OL)
    red = M('#d02a20', rough=0.7)
    box('rl1', (0.04, 0.02, 0.5), loc=(0, -0.03, 0.55), m=red, parent=b, bevel=0)
    for z, w in ((0.68, 0.24), (0.45, 0.18), (0.3, 0.28)):
        box('rl', (w, 0.02, 0.03), loc=(0, -0.035, z), m=red, parent=b, bevel=0)
    box('eye', (0.07, 0.03, 0.07), loc=(-0.08, -0.03, 0.86),
        m=M('#401010'), parent=b, bevel=0.01)
    box('eye', (0.07, 0.03, 0.07), loc=(0.08, -0.03, 0.86),
        m=M('#401010'), parent=b, bevel=0.01)
    for s in (-1, 1):
        g = empty('armp', (s * 0.26, 0, 0.7), b); R.limbs.append(g)
        tube('arm', [(0, 0, 0), (s * 0.18, -0.1, -0.2)], 0.035, m=m, parent=g)


SPIRIT_BUILD = {'mon_ghost': lp_ghost, 'mon_paper': lp_paper}


# ============================================================
#  坐骑/坐驾低模模板（载具形；idle 漂浮由 monsters.mpose 驱动）
# ============================================================
def build_mount(sid, scale):
    """坐骑直接复用 monsters.m_* 建 rig（它们本就是载具造型，非'球拼人'）。
    sid 形如 'mount_crane' → monsters.mons key 'm_crane'。"""
    mon_key = 'm_' + sid.split('_', 1)[1]
    R = monsters.setup(mon_key, scale=scale)
    return R, monsters.mpose


# ============================================================
#  统一构建入口
# ============================================================
def build26(sid, S):
    """按 sid 分派到低模模板，返回 (Rig, pose_func)。sprite id 不变。"""
    if sid in HUMANOID_IDS:
        # 人形：复用 chars25.chibi25（3 头身低模）
        R = chars25.chibi25(S['spec'], scale=1.2)
        return R, chars.pose
    if sid in BEAST_BUILD:
        R = _mrig(1.2, sid.replace('mon_', ''))
        BEAST_BUILD[sid](R)
        return R, monsters.mpose
    if sid in SPIRIT_BUILD:
        R = _mrig(1.2, sid.replace('mon_', ''))
        SPIRIT_BUILD[sid](R)
        return R, monsters.mpose
    if sid in MOUNT_IDS:
        return build_mount(sid, 1.2 * S.get('scale', 0.8))
    raise KeyError(f'未登记的 2.6 低模对象: {sid}')


# ============================================================
#  批渲染入口（独立脚本，供 Blender 无头模式调用）
# ============================================================
if __name__ == '__main__':
    a = args()
    ids = a.get('ids', ','.join(ALL26)).split(',')
    out_base = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'frames26')
    os.makedirs(out_base, exist_ok=True)

    for sid in ids:
        S = SPRITES[sid]
        t0 = __import__('time').time()
        reset()
        lights()
        R, posef = build26(sid, S)
        w, h = 192, 224  # v24 标准帧尺寸（旧 160x176 → 升级 192x224，热区走 v24 分支）
        k = float(os.environ.get('WBX_RES', 1))
        camera(int(w * k), int(h * k), anchor=(0.5, 0.86), ortho_scale=h / P)
        d = os.path.join(out_base, sid)
        os.makedirs(d, exist_ok=True)
        dirs = S.get('dirs', DIRS5)
        for dn in dirs:
            vx, vy = DIRV[dn]
            R.root.rotation_euler = (0, 0, math.atan2(vy, vx) + math.pi / 2)
            for an, n in S['anims'].items():
                for f in range(n):
                    posef(R, an, f, n)
                    render(os.path.join(d, f'{an}_{dn}_{f}.png'))
        print(f'DONE {sid} dirs={len(dirs)} anims={sum(S["anims"].values())}',
              round(__import__('time').time() - t0, 1), 's', flush=True)

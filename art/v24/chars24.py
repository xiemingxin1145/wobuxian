"""v24 角色管线：把 specs.py 里每个 chibi spec 映射成「CC0 基础人体 + 发型 + 配件 + 色板」的写实网格角色。
基础：Quaternius Universal Base Characters [Standard]（CC0，art/third_party/quaternius_ubc）
复用：proto.py（v2 原型：头/脸贴花/袖/裙/姿势基础）、base.py（导入/派生衣物/描边）、游戏 lib.py/chars.py（相机灯光材质/帽子/武器）。"""
import bpy, bmesh, os, sys, math, time
HERE = os.path.dirname(os.path.abspath(__file__)); ART = os.path.dirname(HERE)
sys.path.insert(0, HERE); sys.path.insert(0, ART)
import base as B1
import proto as B2
from base import *
from proto import hair_mat, make_head, strand, surf_front
import chars as CH
import subprocess
from mathutils import Vector, Matrix, Euler

FEMALE = {'mom', 'girl', 'sister', 'witch', 'dragongirl', 'lengyue', 'ruyan', 'guzhu', 'mengpo', 'sanniang', 'guanghan'}
CHILD = {'tongzi'}
MALE_HC = Vector((0.0, 0.006, 1.700)); MALE_HEADBONE = Vector((0.0, 0.0184 - 0.0, 1.600))
FACE_DIR = os.path.join(ART, 'out', 'v24_faces'); os.makedirs(FACE_DIR, exist_ok=True)

def is_female(sid):
    if sid.startswith('player_f') or (sid.startswith('cos_') and sid.endswith('_f')): return True
    return sid.split('_', 1)[-1] in FEMALE

def lum(h):
    c = hexc(h); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

# ------------------------------------------------------------ 每角色状态
class Ctx: pass

def face_for(spec, female):
    st = spec.get('eyes', 'round'); mo = spec.get('mouth', 'smile'); iris = spec.get('eye', '#8a5a30')
    if iris in ('#2b1a14',): iris = '#8a5a30'
    br = spec.get('hair', '#20141a') if lum(spec.get('hair', '#000')) < 0.05 else '#4a3a34'
    key = f"{st}_{mo}_{'f' if female else 'm'}_{iris.strip('#')}_{br.strip('#')}"
    p = os.path.join(FACE_DIR, key + '.png')
    if not os.path.exists(p):    # Blender 自带 Python 无 PIL → 用系统 python3 生成
        subprocess.run(['python3', os.path.join(HERE, 'face_tex.py'), p, st, mo, '1' if female else '0', iris, br], check=True)
    return p

def head_empty(arm, name='hatroot'):
    """chibi 帽子/角/胡子/光环是按 r=0.37 的球头写的：放一个缩放 0.29 的空物体在新头中心，直接复用 chars.hat()"""
    e = empty(name, B2.HC + Vector((0, 0.008, 0.012))); e.scale = (0.29, 0.29, 0.29)
    B1.parent_bone(e, arm, 'Head'); return e

def hair_build(C, arm, spec, Mx, female):
    hs = spec.get('hairstyle', 'bun'); hm = Mx['hair']
    objs = []
    if hs == 'none':
        if not spec.get('hat') or spec.get('hat') in ('hood',): return
        hs = 'short'                         # chibi 里帽子盖住头 → 新模型帽檐下露短发
    # 后发：长发/女性/发髻男用 Hair_Long；短发用 Hair_SimpleParted
    longh = spec.get('long') or female or hs in ('bun', 'crown', 'guan', 'pony', 'double')
    if hs == 'short' and not spec.get('long'): longh = False
    src = B1.UBC + ('Hair_Long.gltf' if longh else 'Hair_SimpleParted.gltf')
    hobjs = B1.import_gltf(src); harm = [o for o in hobjs if o.type == 'ARMATURE'][0]
    hair = [o for o in hobjs if o.type == 'MESH' and o.name.startswith('Hair')][0]
    hh = harm.matrix_world @ harm.data.bones['Head'].head_local; mh = arm.matrix_world @ arm.data.bones['Head'].head_local
    me = hair.data; hair.parent = None; hair.matrix_world = Matrix.Identity(4)
    for md in list(hair.modifiers): hair.modifiers.remove(md)
    for v in me.vertices: v.co = mh + (v.co - hh) * 1.0 + Vector((0, 0.004, 0.012))
    hair.vertex_groups.clear()
    for o in hobjs:
        if o is not hair: bpy.data.objects.remove(o)
    hair.data.materials.clear(); hair.data.materials.append(hm)
    for p in hair.data.polygons: p.use_smooth = True; p.material_index = 0
    B1.parent_bone(hair, arm, 'Head')
    # 刘海 + 鬓发
    B2.bangs(arm, hm)
    HC = B2.HC; top = Vector((0, HC.y + 0.03, HC.z + B2.HCU + 0.05))
    att = []
    if hs in ('bun', 'crown', 'guan'):
        att.append(sphere('bun', 0.044, loc=top, scale=(1, 1, 0.9), m=hm, seg=24, rings=16))
        if hs == 'crown':
            att.append(lathe('guan', [(0.040, -0.026), (0.047, -0.010), (0.049, 0.008), (0.044, 0.020)], loc=top, m=Mx['gold'], seg=32, close_top=False))
            att.append(sphere('jade', 0.011, loc=top + Vector((0, -0.048, 0)), scale=(1, 0.5, 1.2), m=M('#9fe0c8', rough=0.2, emit=0.2), seg=12, rings=8))
        else:
            att.append(torus('band', 0.04, 0.008, loc=top + Vector((0, 0, -0.012)), m=M(spec.get('ribbon', '#3a5a8a'), rough=0.4), seg=24, mseg=6))
        att.append(cyl('pin', 0.0045, 0.0045, 0.17, loc=top + Vector((0, 0, 0.006)), rot=(0, D(90), 0), m=Mx['gold'], seg=8))
    if hs == 'double':
        for sg in (-1, 1):
            p = Vector((sg * 0.07, HC.y + 0.02, HC.z + 0.085))
            att.append(sphere('dbun', 0.038, loc=p, m=hm, seg=20, rings=14))
            att.append(torus('dband', 0.032, 0.007, loc=p + Vector((0, 0, -0.02)), m=M(spec.get('ribbon', '#e84a5f'), rough=0.4), seg=20, mseg=6))
    for o in att: B1.parent_bone(o, arm, 'Head')
    for o in att[:1]: add_outline(o, OL * 0.6)
    # 马尾 / 长发束
    if hs in ('bun', 'crown', 'guan', 'pony') or spec.get('long'):
        L = 0.56 if (female or hs == 'pony') else 0.36; r = 0.04 if female else 0.036
        z0 = HC.z + (0.075 if hs != 'pony' else 0.06)
        pts = [Vector((0, HC.y + 0.09, z0)), Vector((0, HC.y + 0.13, HC.z - 0.03)), Vector((0, HC.y + 0.14, HC.z - 0.03 - L * 0.5)), Vector((0, HC.y + 0.13, HC.z - 0.03 - L))]
        tail = tube('ptail', pts, r, m=hm, taper=[1.0, 1.0, 0.8, 0.2]); tail.data.bevel_resolution = 4
        B1.parent_bone(tail, arm, 'Head')
        if hs == 'pony':
            t2 = torus('ponyband', 0.03, 0.008, loc=pts[0] + Vector((0, 0.01, -0.01)), rot=(D(70), 0, 0), m=M(spec.get('ribbon', '#e84a5f'), rough=0.4), seg=20, mseg=6)
            B1.parent_bone(t2, arm, 'Head')

def weapon_root(name, w):
    g = empty(name); CH.weapon(g, w); g.scale = (1.1,) * 3
    return g

def back_sword(arm, M):
    g = empty('backsw', bone_pos(arm, 'spine_03') + Vector((0.03, 0.17, -0.14))); g.rotation_euler = (D(-8), D(-50), 0)
    L = 0.68
    box('scab', (0.06, 0.03, L), loc=(0, 0, L / 2 + 0.05), m=M['scab'], parent=g, bevel=0.012)
    box('scabtip', (0.066, 0.034, 0.06), loc=(0, 0, 0.06), m=M['gold'], parent=g, bevel=0.01)
    box('guard', (0.13, 0.045, 0.03), loc=(0, 0, L + 0.07), m=M['gold'], parent=g, bevel=0.01)
    cyl('grip', 0.018, 0.018, 0.16, loc=(0, 0, L + 0.165), m=M['grip'], parent=g, seg=10)
    sphere('pommel', 0.026, loc=(0, 0, L + 0.255), m=M['gold'], parent=g, seg=10, rings=8)
    tube('tassel', [(0, 0, L + 0.27), (0.02, 0.03, L + 0.2), (0.04, 0.05, L + 0.08)], 0.008, m=M['trim'], parent=g)
    bpy.context.view_layer.update(); B1.parent_bone(g, arm, 'spine_03')

def build(sid, spec):
    female = is_female(sid); child = sid.split('_', 1)[-1] in CHILD
    B1.BODY = B1.UBC + ('Superhero_Female_FullBody.gltf' if female else 'Superhero_Male_FullBody.gltf')
    reset(); lights()
    B1.HAIR = None                              # 头发按发型另导（hair_build）
    arm, body, eyes, brows, _h = B1.setup_character()
    hb = arm.matrix_world @ arm.data.bones['Head'].head_local
    B2.HC = MALE_HC + (hb - MALE_HEADBONE) + Vector((0, 0, 0))
    hc = spec.get('hair', '#2a1b14')
    Mx = dict(robe=M(spec['robe'], rough=0.62, sheen=0.4), robe2=M(spec.get('robe2', '#fff6e8'), rough=0.6), trim=M(spec.get('trim', '#ffd25e'), rough=0.4, metal=0.3),
              belt=M(spec.get('belt', '#ffd25e'), rough=0.4, metal=0.2), skin=M(spec.get('skin', '#ffe0cc'), rough=0.5, sss=0.25),
              shoe=M(spec.get('shoe', '#2e2a2a'), rough=0.5), inner=M('#f2f0ea', rough=0.6), gold=M('#e8b440', metal=0.9, rough=0.25),
              scab=M('#6a2e22', rough=0.35), grip=M('#6a3a1e', rough=0.7))
    Mx['hair'] = hair_mat() if lum(hc) < 0.03 else M(hc, rough=0.5, spec=0.3)
    body.data.materials.clear(); body.data.materials.append(Mx['skin'])
    for p in body.data.polygons: p.material_index = 0
    for o in (eyes, brows): o.hide_render = True
    TORSO, FOOT = B1.TORSO, B1.FOOT
    top = derived_layer(body, 'robe_top', lambda w: sum(w.get(k, 0) for k in TORSO) > 0.5 and w.get('lowerarm_l', 0) + w.get('lowerarm_r', 0) < 0.5 and w.get('neck_01', 0) < 0.5 and w.get('Head', 0) < 0.05 and w.get('hand_l', 0) + w.get('hand_r', 0) < 0.3,
                        0.024, 8, Mx['robe'], zmin=0.80 * hb.z / 1.6)
    inner = derived_layer(body, 'inner', lambda w: sum(w.get(k, 0) for k in TORSO) > 0.5 and sum(w.get(k, 0) for k in ('upperarm_l', 'upperarm_r', 'lowerarm_l', 'lowerarm_r')) < 0.4 and w.get('Head', 0) < 0.2 and w.get('hand_l', 0) + w.get('hand_r', 0) < 0.3,
                          0.016, 3, M(spec.get('robe2', '#f2f0ea'), rough=0.6) if lum(spec.get('robe2', '#fff')) > 0.25 else Mx['inner'], zmin=1.05 * hb.z / 1.6, zmax=hb.z)
    boots = derived_layer(body, 'boots', lambda w: sum(w.get(k, 0) for k in FOOT) + w.get('calf_l', 0) + w.get('calf_r', 0) > 0.5, 0.012, 4, Mx['shoe'], zmax=0.22)
    bmi = bmesh.new(); bmi.from_mesh(inner.data)     # 内衬只留前襟中间（否则在胸口从外袍里透出白斑）
    bmesh.ops.delete(bmi, geom=[v for v in bmi.verts if abs(v.co.x) > 0.085 or v.co.y > 0.02], context='VERTS'); bmi.to_mesh(inner.data); bmi.free()
    for o in (top, boots, inner):
        o.parent = arm
        for md in o.modifiers:
            if md.type == 'ARMATURE': md.object = arm
    W = dom_groups(body); bmb = bmesh.new(); bmb.from_mesh(body.data); bmb.verts.ensure_lookup_table()
    LEG = ('thigh_l', 'thigh_r', 'calf_l', 'calf_r') + FOOT
    hide = [v for v in bmb.verts if (sum(W[v.index].get(k, 0) for k in TORSO if k != 'neck_01') > 0.75 and v.co.z < hb.z - 0.04)
            or sum(W[v.index].get(k, 0) for k in LEG) > 0.5 or W[v.index].get('Head', 0) > 0.35]
    bmesh.ops.delete(bmb, geom=hide, context='VERTS'); bmb.to_mesh(body.data); bmb.free()
    for o in (body, top, boots): add_outline(o)
    make_head(arm, Mx, face_for(spec, female))
    hair_build(None, arm, spec, Mx, female)
    he = head_empty(arm); CH.hat(he, (0, 0, 0), 0.37, spec)
    for c in list(he.children):
        if c.name.startswith('beard'):      # chibi 胡子按球头写的 → 换成贴下巴的小锥形长须
            bpy.data.objects.remove(c)
            b = cyl('beard', 0.032, 0.004, 0.16, loc=B2.HC + Vector((0, -B2.HB * 0.78, -B2.HCL - 0.02)), rot=(D(-10), 0, 0), m=M(spec.get('beardc', '#f0f0f0'), rough=0.8), seg=14)
            B1.parent_bone(b, arm, 'Head')
    for c in he.children:
        if c.type == 'MESH' and c.name.startswith(('hood', 'tall', 'brim', 'jh', 'rj', 'vb')): add_outline(c, OL * 2.5)
    C = Ctx(); C.arm, C.top, C.M, C.body, C.spec, C.sid, C.female = arm, top, Mx, body, spec, sid, female
    C.fat = spec.get('fat', 1.0); C.flare = spec.get('skirt', 0.3) / 0.3
    w = spec.get('weapon'); C.wR = weapon_root('wpnR', w) if w else None
    C.wL = weapon_root('wpnL', spec['left']) if spec.get('left') else None
    C.handsword = w in ('sword', 'gsword') and sid.startswith(('player_', 'cos_'))
    if spec.get('back') == 'sword' or C.handsword: back_sword(arm, Mx)
    root = empty('root'); arm.parent = root
    for g in (C.wR, C.wL):
        if g: g.parent = root
    C.root = root
    C.global_scale = B1.GLOBAL * (0.8 if child else 1.0)
    root.scale = (C.global_scale,) * 3
    B1.HEAD_SCALE = 1.6 * spec.get('headScale', 1.0) * (1.1 if child else 1.0)
    log('built', sid, 'female' if female else 'male')
    return C

# ------------------------------------------------------------ 姿势（全部动作）
def pose(C, anim, f, n):
    arm = C.arm; t = f / max(1, n); Y, X, Z = 'Y', 'X', 'Z'
    B2.pose_base(arm)
    fat = C.fat
    if fat != 1.0:
        arm.pose.bones['spine_02'].scale = (fat, 1, fat); arm.pose.bones['pelvis'].scale = (1.0 + (fat - 1) * 0.6, 1, 1.0 + (fat - 1) * 0.6)
        arm.pose.bones['neck_01'].scale = (B2.NECK[0] / fat, 1, B2.NECK[2] / fat)
        for s in 'lr': arm.pose.bones['thigh_' + s].scale = (1 / (1.0 + (fat - 1) * 0.6), 1, 1 / (1.0 + (fat - 1) * 0.6))
        bpy.context.view_layer.update()
    fwd = C.spec.get('armsForward')
    if anim == 'idle' or anim not in ('walk', 'attack', 'hurt'):
        b = math.sin(t * 2 * math.pi)
        rot_bone(arm, 'spine_03', X, 3 + 1.2 * b)
        rot_bone(arm, 'upperarm_l', Y, 80); rot_bone(arm, 'upperarm_r', Y, -80)
        rot_bone(arm, 'upperarm_l', X, 5 + 2 * b); rot_bone(arm, 'upperarm_r', X, 5 - 2 * b)
        rot_bone(arm, 'lowerarm_l', X, -16); rot_bone(arm, 'lowerarm_r', X, -16)
        rot_bone(arm, 'thigh_l', Y, 2); rot_bone(arm, 'thigh_r', Y, -2)
        rot_bone(arm, 'Head', X, -9 + 1.5 * b)
    elif anim == 'walk':
        a = math.sin(t * 2 * math.pi); ca = math.cos(t * 2 * math.pi)
        rot_bone(arm, 'pelvis', Z, 5 * a); rot_bone(arm, 'spine_02', Z, -8 * a); rot_bone(arm, 'spine_01', X, -3)
        rot_bone(arm, 'thigh_l', X, -24 * a); rot_bone(arm, 'thigh_r', X, 24 * a)
        rot_bone(arm, 'calf_l', X, 8 + 22 * max(0, a) + 10 * max(0, ca)); rot_bone(arm, 'calf_r', X, 8 + 22 * max(0, -a) + 10 * max(0, -ca))
        rot_bone(arm, 'foot_l', X, -10 * a); rot_bone(arm, 'foot_r', X, 10 * a)
        rot_bone(arm, 'upperarm_l', Y, 80); rot_bone(arm, 'upperarm_r', Y, -80)
        rot_bone(arm, 'upperarm_l', X, 20 * a); rot_bone(arm, 'upperarm_r', X, -20 * a)
        rot_bone(arm, 'lowerarm_l', X, -10 - 14 * max(0, -a)); rot_bone(arm, 'lowerarm_r', X, -10 - 14 * max(0, a))
        rot_bone(arm, 'Head', X, -7)
    elif anim == 'attack':
        k = [(-40, 100, -15), (-55, 150, -25), (10, 85, 25), (25, 50, 30), (5, 18, 8)][min(f, 4)]
        rot_bone(arm, 'spine_02', Z, k[2]); rot_bone(arm, 'spine_01', X, -k[0] * 0.2)
        rot_bone(arm, 'upperarm_l', Y, 78); rot_bone(arm, 'upperarm_r', Y, -70)
        rot_bone(arm, 'upperarm_r', X, -k[1])
        rot_bone(arm, 'lowerarm_r', X, -20)
        rot_bone(arm, 'upperarm_l', X, 20 if f < 2 else -25)
        rot_bone(arm, 'thigh_l', X, -18 if f >= 2 else 8); rot_bone(arm, 'thigh_r', X, 16 if f >= 2 else -5); rot_bone(arm, 'calf_r', X, 12)
        rot_bone(arm, 'Head', X, -6)
    elif anim == 'hurt':
        rot_bone(arm, 'spine_02', X, 14); rot_bone(arm, 'spine_03', Z, -6)
        rot_bone(arm, 'upperarm_l', Y, 60); rot_bone(arm, 'upperarm_r', Y, -60)
        rot_bone(arm, 'upperarm_l', X, -25); rot_bone(arm, 'upperarm_r', X, -25)
        rot_bone(arm, 'lowerarm_l', X, -30); rot_bone(arm, 'lowerarm_r', X, -30)
        rot_bone(arm, 'Head', X, 10); rot_bone(arm, 'thigh_r', X, 10)
    if fwd and anim != 'attack':           # 僵尸：双臂平举
        for s, sg in (('l', 1), ('r', -1)):
            rot_bone(arm, 'upperarm_' + s, X, -78)
        if anim == 'walk': arm.location.z += 0.0

# ------------------------------------------------------------ 逐帧布料 + 配件
def cape_mesh(arm, col, fat):
    sp = bone_pos(arm, 'spine_03'); pel = bone_pos(arm, 'pelvis'); z0 = sp.z + 0.12; z1 = 0.22
    NR, NA = 16, 28; vs = []; bm = bmesh.new()
    for i in range(NR):
        t = i / (NR - 1); z = z0 + (z1 - z0) * t; c = sp.lerp(pel, min(1, t * 1.6)); row = []
        for k in range(NA):
            a = math.radians(15 + 150 * k / (NA - 1)); r = (0.17 + 0.17 * t ** 1.2) * fat + 0.01 * t * math.sin(7 * a)
            row.append(bm.verts.new((c.x + math.cos(a) * r, c.y + 0.03 + math.sin(a) * r * 0.85, z)))
        vs.append(row)
    for i in range(NR - 1):
        for k in range(NA - 1): bm.faces.new((vs[i][k], vs[i + 1][k], vs[i + 1][k + 1], vs[i][k + 1]))
    o = mesh_from_bm('cape', bm); bpy.context.scene.collection.objects.link(o); o.data.materials.append(M(col, rough=0.7, sheen=0.5))
    for p in o.data.polygons: p.use_smooth = True
    sd = o.modifiers.new('sd', 'SOLIDIFY'); sd.thickness = 0.012; sd.offset = 1
    return o

def ribbon_tube(arm, col):
    pts = []
    for s, sg in (('l', 1), ('r', -1)):
        pass
    L1 = bone_pos(arm, 'hand_l') + Vector((0.06, 0.04, 0.05)); L0 = bone_pos(arm, 'lowerarm_l') + Vector((0.08, 0.08, 0))
    R1 = bone_pos(arm, 'hand_r') + Vector((-0.06, 0.04, 0.05)); R0 = bone_pos(arm, 'lowerarm_r') + Vector((-0.08, 0.08, 0))
    sp = bone_pos(arm, 'spine_03') + Vector((0, 0.24, 0.18))
    pts = [tuple(L1), tuple(L0), tuple(sp + Vector((0.18, 0, -0.02))), tuple(sp), tuple(sp + Vector((-0.18, 0, -0.02))), tuple(R0), tuple(R1)]
    o = tube('pibo', pts, 0.022, m=M(col, rough=0.4, emit=0.6), taper=[0.4, 1, 1, 1, 1, 1, 0.4]); return o

def place_weapon(arm, g, side, show):
    if not g: return
    g.hide_render = not show
    for c in g.children_recursive: c.hide_render = not show
    if not show: return
    h = bone_pos(arm, 'hand_' + side); m = bone_pos(arm, 'middle_01_' + side)
    fa = (h - bone_pos(arm, 'lowerarm_' + side)).normalized()
    g.location = h.lerp(m, 0.8) + Vector((0, 0, -0.01))
    up = (h - bone_pos(arm, 'lowerarm_' + side)).normalized()
    blade = (fa + Vector((0, -0.9, 0)) * (1 if fa.z < 0.3 else 0.2)).normalized()   # chibi 武器刃沿局部 +Y：握拳方向 = 前臂 + 前倾
    q = Vector((0, 1, 0)).rotation_difference(blade); g.rotation_mode = 'QUATERNION'; g.rotation_quaternion = q

def frame(C, anim, dn, f, n, path):
    from specs import DIRV
    root, arm = C.root, C.arm
    root.rotation_euler = (0, 0, 0); root.scale = (1, 1, 1); arm.location = (0, 0, 0); bpy.context.view_layer.update()
    for o in [o for o in bpy.data.objects if o.get('cloth')]: bpy.data.objects.remove(o)
    pose(C, anim, f, n)
    minz = min(bone_pos(arm, b).z for b in ('ball_l', 'ball_r', 'ball_leaf_l', 'ball_leaf_r')) - 0.015
    arm.location.z -= minz; bpy.context.view_layer.update()
    B2.FLARE = C.flare; B2.FAT = C.fat
    made = B1.build_cloth(arm, C.top, None, C.M)
    if C.spec.get('cape'): made.append(cape_mesh(arm, C.spec['cape'], C.fat))
    if C.spec.get('ribbon2'): made.append(ribbon_tube(arm, C.spec['ribbon2']))
    for o in made: o['cloth'] = 1; o.parent = root
    place_weapon(arm, C.wR, 'r', (not C.handsword) or anim in ('attack', 'hurt'))
    place_weapon(arm, C.wL, 'l', True)
    B1.all_noline()
    root.scale = (C.global_scale,) * 3
    vx, vy = DIRV[dn]; root.rotation_euler = (0, 0, math.atan2(vy, vx) + math.pi / 2)
    render(path)

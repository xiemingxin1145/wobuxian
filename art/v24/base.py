"""我不仙 角色原型：CC0 Quaternius Universal Base Character (Superhero_Male) + 程序化古装（逐帧重力悬垂的袍裾/广袖）
用法: blender -b -P build_new.py -- --out DIR [--frames idle_S,walk_S,...] [--tag x]
环境变量沿用游戏: WBX_CEL=1 赛璐璐, WBX_RES=2 两倍, WBX_SAMPLES, WBX_THREADS
"""
import bpy, bmesh, sys, os, math, time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib import *                                  # 游戏原版 相机/灯光/描边/材质（只读导入）
from mathutils import Vector, Matrix, Quaternion
from mathutils.bvhtree import BVHTree
T0 = time.time()
UBC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'third_party', 'quaternius_ubc') + '/'
BODY = UBC + 'Superhero_Male_FullBody.gltf'
HAIR = UBC + 'Hair_Long.gltf'
CEL = os.environ.get('WBX_CEL') == '1'
SPEC = dict(robe='#f4f6f2', robe2='#5fb3a0', trim='#3a9a86', belt='#3a9a86', hair='#2a1b14', skin='#ffe0cc', shoe='#2e2a2a',
            inner='#e9efe8', sword_guard='#e8b440')          # = 游戏 player_m1 宗门弟子配色
HEAD_SCALE = float(os.environ.get('PROTO_HEAD', 1.38))       # 头部放大 → 约 5~5.5 头身
GLOBAL = float(os.environ.get('PROTO_SCALE', 1.06))          # 世界缩放（让成品高 ≈ 140px@1x）
OL = 0.013 if CEL else 0.010

def log(*a): print('[proto %.1fs]' % (time.time() - T0), *a, flush=True)

# ------------------------------------------------------------ 导入与整理
def import_gltf(p):
    before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=p)
    return [o for o in bpy.data.objects if o not in before]

def setup_character():
    objs = import_gltf(BODY)
    arm = [o for o in objs if o.type == 'ARMATURE'][0]; arm.name = 'RIG'
    names = [o.name for o in objs if not o.name.startswith('Icosphere')]
    for o in [o for o in objs if o.name.startswith('Icosphere')]: bpy.data.objects.remove(o)
    objs = [bpy.data.objects[n] for n in names]
    body = max([o for o in objs if o.type == 'MESH' and o.name.lower().startswith('superhero')], key=lambda o: len(o.data.vertices)); eyes = [o for o in objs if o.name.startswith('Eyes')][0]; brows = [o for o in objs if o.name.startswith('Eyebrows')][0]
    if not HAIR: return arm, body, eyes, brows, None
    # 头发：来自女性/常规骨架的头骨，平移到男体头骨并刚性绑定到 Head 骨
    hobjs = import_gltf(HAIR); harm = [o for o in hobjs if o.type == 'ARMATURE'][0]
    hair = [o for o in hobjs if o.type == 'MESH' and o.name.startswith('Hair')][0]
    hh = harm.matrix_world @ harm.data.bones['Head'].head_local; mh = arm.matrix_world @ arm.data.bones['Head'].head_local
    me = hair.data; hair.parent = None; hair.matrix_world = Matrix.Identity(4)
    for md in list(hair.modifiers): hair.modifiers.remove(md)
    s = float(os.environ.get('PROTO_HAIRS', 1.07))
    for v in me.vertices: v.co = mh + (v.co - hh) * s + Vector((0, 0.004, 0.012))
    hair.vertex_groups.clear()
    for o in hobjs:
        if o is not hair: bpy.data.objects.remove(o)
    return arm, body, eyes, brows, hair

def parent_bone(o, arm, bone):
    bpy.context.view_layer.update(); mw = o.matrix_world.copy(); o.parent = arm; o.parent_type = 'BONE'; o.parent_bone = bone
    bpy.context.view_layer.update(); o.matrix_world = mw

def dom_groups(obj):
    names = {g.index: g.name for g in obj.vertex_groups}; out = []
    for v in obj.data.vertices:
        w = {}
        for g in v.groups: w[names[g.group]] = g.weight
        out.append(w)
    return out

TORSO = ('pelvis', 'spine_01', 'spine_02', 'spine_03', 'clavicle_l', 'clavicle_r', 'upperarm_l', 'upperarm_r', 'lowerarm_l', 'lowerarm_r', 'neck_01')
FOOT = ('foot_l', 'foot_r', 'ball_l', 'ball_r', 'ball_leaf_l', 'ball_leaf_r')

def derived_layer(body, name, keep, offset, smooth_iter, m, zmin=-9, zmax=9):
    """从 CC0 身体网格派生贴身衣物（自动继承蒙皮权重）：按骨骼权重选区 → 沿法线外扩 → 平滑掉肌肉细节"""
    o = body.copy(); o.data = body.data.copy(); o.name = name; bpy.context.scene.collection.objects.link(o)
    W = dom_groups(o); bm = bmesh.new(); bm.from_mesh(o.data); bm.verts.ensure_lookup_table()
    kill = [v for v in bm.verts if not (keep(W[v.index]) and zmin <= v.co.z <= zmax)]
    bmesh.ops.delete(bm, geom=kill, context='VERTS')
    bm.normal_update()
    for v in bm.verts: v.co += v.normal * offset
    for _ in range(smooth_iter):
        bmesh.ops.smooth_vert(bm, verts=bm.verts, factor=0.6, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.normal_update()
    for v in bm.verts: v.co += v.normal * offset * 0.4
    bm.to_mesh(o.data); bm.free()
    o.data.materials.clear(); o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = True; p.material_index = 0
    return o

def noline(o):
    c = bpy.data.collections.get('NoLine')
    if not c:
        c = bpy.data.collections.new('NoLine'); bpy.context.scene.collection.children.link(c)
        vl = bpy.context.view_layer
        if vl.freestyle_settings.linesets:
            ls = vl.freestyle_settings.linesets[0]; ls.select_by_collection = True; ls.collection = c; ls.collection_negation = 'EXCLUSIVE'
    if o.name not in c.objects: c.objects.link(o)
    for ch in o.children: noline(ch)

def add_outline(o, t=OL):
    o.data.materials.append(outline_mat())
    md = o.modifiers.new('ol', 'SOLIDIFY'); md.thickness = t; md.offset = 1; md.use_flip_normals = True
    md.material_offset = len(o.data.materials) - 1; md.use_rim = False

# ------------------------------------------------------------ 姿势（世界空间旋转，逐骨依次）
def rot_bone(arm, bname, axis, deg):
    pb = arm.pose.bones[bname]; bpy.context.view_layer.update()
    h = pb.head.copy(); R = Matrix.Rotation(math.radians(deg), 4, axis)
    pb.matrix = Matrix.Translation(h) @ R @ Matrix.Translation(-h) @ pb.matrix
    bpy.context.view_layer.update()

def clear_pose(arm):
    for pb in arm.pose.bones:
        pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0); pb.scale = (1, 1, 1)
    arm.pose.bones['Head'].scale = (HEAD_SCALE,) * 3
    arm.pose.bones['neck_01'].scale = (1.05, 1.0, 1.05)
    for s in 'lr': arm.pose.bones['hand_' + s].scale = (1.1,) * 3
    bpy.context.view_layer.update()

def do_pose(arm, name):
    clear_pose(arm); an, dn = name.split('_')[:2]
    Y, X, Z = 'Y', 'X', 'Z'
    if an == 'idle':
        rot_bone(arm, 'upperarm_l', Y, 74); rot_bone(arm, 'upperarm_r', Y, -74)
        rot_bone(arm, 'upperarm_l', X, -6); rot_bone(arm, 'upperarm_r', X, -6)
        rot_bone(arm, 'lowerarm_l', X, -22); rot_bone(arm, 'lowerarm_r', X, -22)
        rot_bone(arm, 'lowerarm_l', Y, -6); rot_bone(arm, 'lowerarm_r', Y, 6)
        rot_bone(arm, 'thigh_l', Y, 2.5); rot_bone(arm, 'thigh_r', Y, -2.5)
        rot_bone(arm, 'Head', X, -8)
    elif an == 'walk':   # 走路第 1 帧（左腿前、右臂前）
        rot_bone(arm, 'pelvis', Z, 6); rot_bone(arm, 'spine_02', Z, -9); rot_bone(arm, 'spine_01', X, -4)
        rot_bone(arm, 'thigh_l', X, -28); rot_bone(arm, 'calf_l', X, 12); rot_bone(arm, 'foot_l', X, 10)
        rot_bone(arm, 'thigh_r', X, 16); rot_bone(arm, 'calf_r', X, 18); rot_bone(arm, 'foot_r', X, -14)
        rot_bone(arm, 'upperarm_l', Y, 72); rot_bone(arm, 'upperarm_r', Y, -72)
        rot_bone(arm, 'upperarm_l', X, 14); rot_bone(arm, 'upperarm_r', X, -18)
        rot_bone(arm, 'lowerarm_l', X, -14); rot_bone(arm, 'lowerarm_r', X, -26)
        rot_bone(arm, 'Head', Z, 5); rot_bone(arm, 'Head', X, -6)

def bone_pos(arm, b, tail=False):
    pb = arm.pose.bones[b]; return arm.matrix_world @ (pb.tail if tail else pb.head)

# ------------------------------------------------------------ 逐帧程序化布料
def ring_mesh(name, rings, closed_bottom=False, mats=None, face_mat=None, flip=False):
    bm = bmesh.new(); vs = [[bm.verts.new(p) for p in r] for r in rings]; n = len(rings[0])
    for i in range(len(vs) - 1):
        for k in range(n):
            q = (vs[i][k], vs[i][(k + 1) % n], vs[i + 1][(k + 1) % n], vs[i + 1][k])
            f = bm.faces.new(q[::-1] if flip else q)
            if face_mat: f.material_index = face_mat(i, k)
    o = mesh_from_bm(name, bm); bpy.context.scene.collection.objects.link(o)
    for m in mats or []: o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = True
    return o

def leg_point_at_z(chain, z):
    for a, b in zip(chain, chain[1:]):
        if (a.z - z) * (b.z - z) <= 0 and abs(a.z - b.z) > 1e-6:
            t = (a.z - z) / (a.z - b.z); return a.lerp(b, t)
    return chain[-1] if z < chain[-1].z else chain[0]

def build_skirt(arm, top_bvh, M_robe, M_trim):
    """下裳：每个高度取两条腿（髋→膝→踝）截面圆的凸包 + 喇叭外扩 + 褶皱，重力向下，跨步时自动被前腿撑开"""
    legs = []
    for s in 'lr':
        legs.append([bone_pos(arm, 'thigh_' + s), bone_pos(arm, 'calf_' + s), bone_pos(arm, 'foot_' + s), bone_pos(arm, 'ball_' + s)])
    pel = bone_pos(arm, 'pelvis'); z0 = pel.z + 0.10; z1 = 0.075; NR, NA = 22, 64
    rings = []
    for i in range(NR):
        t = i / (NR - 1); z = z0 + (z1 - z0) * t
        cs = [leg_point_at_z(L, z) for L in legs]
        lr = 0.115 - 0.06 * t                                    # 腿截面半径（上粗下细）
        c = (cs[0] + cs[1]) / 2; c.z = z
        hip = max(0.0, 1 - t / 0.35)                              # 上部贴合腰臀
        ring = []
        for k in range(NA):
            a = 2 * math.pi * k / NA; d = Vector((math.cos(a), math.sin(a), 0))
            e = max((ci - c).dot(d) for ci in cs) + lr
            flare = 0.035 + 0.09 * t ** 1.3                       # 裙摆外扩
            fold = (0.004 + 0.016 * t) * math.sin(9 * a + 1.3) + (0.003 + 0.01 * t) * math.sin(5 * a + 0.4)
            r = e + flare + fold
            r = r * (1 - hip) + max(r * 0.92, 0.17) * hip
            # 前襟稍短后摆稍长（重力 + 步态）
            zz = z + (0.02 * t * max(0, -d.y))
            ring.append(Vector((c.x + d.x * r, c.y + d.y * r * 0.9, zz)))
        rings.append(ring)
    # 腰部用上衣表面贴合
    o = ring_mesh('skirt', rings, mats=[M_robe, M_trim], face_mat=lambda i, k: 1 if i >= NR - 3 else 0, flip=True)
    return o

def build_sleeve(arm, s, M_robe, M_trim):
    """广袖：沿 肩→肘→腕 路径的喇叭袖，袖口下垂（受世界重力方向影响），袖口镶边"""
    P0 = bone_pos(arm, 'upperarm_' + s); P1 = bone_pos(arm, 'lowerarm_' + s); P2 = bone_pos(arm, 'hand_' + s)
    P3 = P2 + (P2 - P1).normalized() * 0.07
    C0 = bone_pos(arm, 'clavicle_' + s).lerp(P0, 0.45)
    path = [C0, P1, P2, P3]
    def pt(u):
        seg = min(int(u * 3), 2); f = u * 3 - seg; return path[seg].lerp(path[seg + 1], f)
    NR, NA = 18, 40; rings = []; g = Vector((0, 0, -1))
    for i in range(NR):
        u = i / (NR - 1); c = pt(u)
        tan = (pt(min(1, u + 0.02)) - pt(max(0, u - 0.02))).normalized()
        gp = g - tan * g.dot(tan); gl = gp.length
        ref = gp.normalized() if gl > 0.15 else (Vector((0, 1, 0)) - tan * tan.y).normalized()
        b2 = tan.cross(ref).normalized()
        r = 0.085 + 0.04 * u + 0.11 * u ** 2.2                   # 喇叭
        ring = []
        for k in range(NA):
            a = 2 * math.pi * k / NA; d = ref * math.cos(a) + b2 * math.sin(a)
            down = max(0.0, math.cos(a))                          # 朝下（重力侧）的一边
            rr = r * (1 + 0.6 * down * u ** 1.5 * min(1, gl * 1.5)) + (0.004 + 0.012 * u) * math.sin(7 * a + i * 0.3)
            p = c + d * rr
            # 袖口：靠后/下侧更长（垂坠），前侧短
            back = max(0.0, d.dot(Vector((0, 1, 0))))
            p += tan * (0.06 * u ** 3 * (0.3 + back + 0.6 * down))
            ring.append(p)
        rings.append(ring)
    return ring_mesh('sleeve_' + s, rings, mats=[M_robe, M_trim], face_mat=lambda i, k: 1 if i >= NR - 2 else 0)

def surface_ribbon(name, pts, bvh, width, lift, m, wdir=None):
    """贴着衣服表面走的布带（交领、腰带垂绦）"""
    bm = bmesh.new(); prev = None
    proj = []
    for p in pts:
        loc, nor, idx, dist = bvh.find_nearest(p)
        proj.append((loc + nor * lift, nor) if loc else (p, Vector((0, -1, 0))))
    for i, (p, n) in enumerate(proj):
        t = (proj[min(i + 1, len(proj) - 1)][0] - proj[max(i - 1, 0)][0]).normalized()
        side = n.cross(t).normalized() * width / 2
        a = bm.verts.new(p - side); b = bm.verts.new(p + side)
        if prev: bm.faces.new((prev[0], prev[1], b, a))
        prev = (a, b)
    o = mesh_from_bm(name, bm); bpy.context.scene.collection.objects.link(o)
    sd = o.modifiers.new('sd', 'SOLIDIFY'); sd.thickness = 0.008; sd.offset = 1
    o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = True
    return o

def evaluated_bvh(objs):
    dg = bpy.context.evaluated_depsgraph_get(); bm = bmesh.new()
    for o in objs:
        oe = o.evaluated_get(dg); me = oe.to_mesh(); me.transform(o.matrix_world); bm.from_mesh(me); oe.to_mesh_clear()
    return BVHTree.FromBMesh(bm), bm

def ellipse_on(bvh, center, z, n=48, lift=0.012):
    pts = []
    for k in range(n):
        a = 2 * math.pi * k / n; d = Vector((math.cos(a), math.sin(a), 0))
        o = Vector((center.x, center.y, z)) + d * 0.6
        hit = bvh.ray_cast(o, -d, 0.6)
        if hit[0] is None: pts.append(Vector((center.x, center.y, z)) + d * 0.18)
        else: pts.append(hit[0] + d * lift)
    return pts

def build_cloth(arm, top, skirt_holder, M):
    made = []
    bvh, bm = evaluated_bvh([top])
    sk = build_skirt(arm, bvh, M['robe'], M['trim']); made.append(sk)
    for s in 'lr': made.append(build_sleeve(arm, s, M['robe'], M['trim']))
    # 腰带：在上衣腰部截面外贴一圈带子
    sp = bone_pos(arm, 'spine_01'); zc = sp.z - 0.01
    bvh2, bm2 = evaluated_bvh([top, sk])
    rings = [ellipse_on(bvh2, sp, zc + dz, lift=0.014) for dz in (-0.045, -0.015, 0.015, 0.045)]
    belt = ring_mesh('belt', rings, mats=[M['belt']], flip=True); made.append(belt)
    # 垂绦（两条从腰带前方垂到膝下）
    for dx, L in ((0.05, 0.42), (0.085, 0.36)):
        p0 = Vector((sp.x + dx, sp.y - 0.3, zc - 0.03))
        hit = bvh2.ray_cast(p0, Vector((0, 1, 0)), 1.0)
        base = hit[0] if hit[0] else p0
        pts = [base + Vector((0.01 * math.sin(i), -0.02, -L * i / 8)) for i in range(9)]
        made.append(surface_ribbon('tie', pts, bvh2, 0.04, 0.018, M['belt']))
    # 交领右衽：从左肩颈侧斜下到右腋腰带，另一侧短内襟；后领绕颈
    nk = bone_pos(arm, 'neck_01'); c3 = bone_pos(arm, 'spine_03')
    L = []
    for i in range(14):
        t = i / 13
        L.append(Vector((nk.x + 0.07 - 0.20 * t, nk.y - 0.10 - 0.06 * math.sin(t * math.pi * 0.8), nk.z + 0.0 - (nk.z - zc - 0.05) * t ** 1.1)))
    made.append(surface_ribbon('collarA', L, bvh, 0.05, 0.007, M['robe2']))
    R = []
    for i in range(6):
        t = i / 5
        R.append(Vector((nk.x - 0.07 + 0.075 * t, nk.y - 0.10, nk.z - 0.13 * t)))
    made.append(surface_ribbon('collarB', R, bvh, 0.045, 0.004, M['robe2']))
    back = []
    for i in range(13):
        a = math.pi * (0.0 + 1.0 * i / 12); back.append(Vector((nk.x + 0.08 * math.cos(a), nk.y + 0.07 * math.sin(a) - 0.01, nk.z + 0.0)))
    made.append(surface_ribbon('collarBack', back, bvh, 0.05, 0.006, M['robe2']))
    for o in made:
        if o.name.startswith(('skirt', 'sleeve', 'belt')): add_outline(o)
        if o.name.startswith(('collar', 'tie', 'belt')): noline(o)
    bm.free(); bm2.free()
    return made

# ------------------------------------------------------------ 发髻 / 发冠 / 背剑（刚性挂骨）
def accessories(arm, M):
    hd = arm.data.bones['Head']; H = arm.matrix_world @ hd.head_local
    top = H + Vector((0, 0.02, 0.215))
    bun = sphere('bun', 0.052, loc=top, scale=(1, 1, 0.85), m=M['hair'], seg=20, rings=14)
    # 发髻缠绕纹理：几圈细环
    for k in range(3):
        torus('bunwrap', 0.046 - 0.008 * k, 0.008, loc=top + Vector((0, 0, -0.018 + 0.017 * k)), m=M['hair'], seg=20, mseg=6)
    crown = lathe('guan', [(0.034, 0), (0.04, 0.025), (0.03, 0.05), (0.012, 0.062)], loc=top + Vector((0, 0.0, 0.01)), m=M['gold'], seg=16)
    pin = cyl('pin', 0.006, 0.006, 0.19, loc=top + Vector((0, 0, 0.035)), rot=(0, D(88), D(10)), m=M['gold'], seg=8)
    for o in (bun, crown, pin) + tuple(o for o in bpy.data.objects if o.name.startswith('bunwrap')):
        parent_bone(o, arm, 'Head')
    # 后背长发束（马尾，从发髻下沿垂到肩胛）
    pts = [H + Vector((0, 0.11, 0.12)), H + Vector((0, 0.16, -0.05)), H + Vector((0, 0.17, -0.25)), H + Vector((0, 0.165, -0.42))]
    tail = tube('ptail', pts, 0.045, m=M['hair'], taper=[1.0, 1.0, 0.8, 0.25]); tail.data.bevel_resolution = 4
    parent_bone(tail, arm, 'Head')
    # 背剑：剑柄出右肩
    g = empty('backsw', bone_pos(arm, 'spine_03') + Vector((0.03, 0.17, -0.14)))
    g.rotation_euler = (D(-8), D(-50), 0)
    L = 0.68; bl = M['blade']
    box('scab', (0.06, 0.03, L), loc=(0, 0, L / 2 + 0.05), m=M['scab'], parent=g, bevel=0.012)
    box('scabtip', (0.066, 0.034, 0.06), loc=(0, 0, 0.06), m=M['gold'], parent=g, bevel=0.01)
    box('guard', (0.13, 0.045, 0.03), loc=(0, 0, L + 0.07), m=M['gold'], parent=g, bevel=0.01)
    cyl('grip', 0.018, 0.018, 0.16, loc=(0, 0, L + 0.165), m=M['grip'], parent=g, seg=10)
    sphere('pommel', 0.026, loc=(0, 0, L + 0.255), m=M['gold'], parent=g, seg=10, rings=8)
    tube('tassel', [(0, 0, L + 0.27), (0.02, 0.03, L + 0.2), (0.04, 0.05, L + 0.08)], 0.008, m=M['trim'], parent=g)
    bpy.context.view_layer.update(); parent_bone(g, arm, 'spine_03')
    noline(tail)
    for o in [bun, tail] + [c for c in g.children if c.name.startswith('scab')]: add_outline(o, OL * 0.8) if o.type == 'MESH' else None

# ------------------------------------------------------------ 主流程
def build(spec=SPEC):
    sc = reset(); lights()
    arm, body, eyes, brows, hair = setup_character()
    Mx = dict(robe=M(spec['robe'], rough=0.62, sheen=0.4), robe2=M(spec['robe2'], rough=0.6), trim=M(spec['trim'], rough=0.4, metal=0.3),
              belt=M(spec['belt'], rough=0.4, metal=0.2), hair=M(spec['hair'], rough=0.5, spec=0.3), skin=M(spec['skin'], rough=0.5, sss=0.25),
              shoe=M(spec['shoe'], rough=0.5), inner=M(spec['inner'], rough=0.6), gold=M('#e8b440', metal=0.9, rough=0.25),
              blade=M('#dfe9f2', metal=0.95, rough=0.12), scab=M('#6a2e22', rough=0.35), grip=M('#6a3a1e', rough=0.7),
              eye=M('#1c110c', rough=0.15, spec=0.8, emit=1.6, emit_col=(0.012, 0.007, 0.005)), brow=M('#1e130e', rough=0.6))
    # 统一游戏材质（扁平色 + 游戏的 cel/标准 两套着色器）
    body.data.materials.clear(); body.data.materials.append(Mx['skin'])
    hair.data.materials.clear(); hair.data.materials.append(Mx['hair'])
    for p in hair.data.polygons: p.use_smooth = True; p.material_index = 0
    eyes.data.materials.clear(); eyes.data.materials.append(Mx['eye'])
    brows.data.materials.clear(); brows.data.materials.append(Mx['brow'])
    for p in body.data.polygons: p.material_index = 0
    # 眼睛略放大（动漫化）
    cen = sum((v.co for v in eyes.data.vertices), Vector()) / len(eyes.data.vertices)
    for v in eyes.data.vertices:
        side = 1 if v.co.x > cen.x else -1; ec = Vector((cen.x + side * 0.032, cen.y, cen.z)); v.co = ec + (v.co - ec) * Vector((1.35, 1.0, 1.45))
    parent_bone(hair, arm, 'Head')
    # 派生衣物：上衣（躯干+手臂上段）、靴子
    top = derived_layer(body, 'robe_top', lambda w: sum(w.get(k, 0) for k in TORSO) > 0.5 and sum(w.get(k, 0) for k in ('upperarm_l', 'upperarm_r', 'lowerarm_l', 'lowerarm_r')) < 0.6 and w.get('neck_01', 0) < 0.5 and w.get('Head', 0) < 0.05 and w.get('hand_l', 0) + w.get('hand_r', 0) < 0.3,
                        0.024, 8, Mx['robe'], zmin=0.80)
    inner = derived_layer(body, 'inner', lambda w: sum(w.get(k, 0) for k in TORSO) > 0.5 and w.get('Head', 0) < 0.2 and w.get('hand_l', 0) + w.get('hand_r', 0) < 0.3,
                        0.016, 3, Mx['inner'], zmin=1.05, zmax=1.60)
    boots = derived_layer(body, 'boots', lambda w: sum(w.get(k, 0) for k in FOOT) + w.get('calf_l', 0) + w.get('calf_r', 0) > 0.5, 0.012, 4, Mx['shoe'], zmax=0.36)
    for o in (top, boots, inner):
        o.parent = arm; o.modifiers[0].object = arm if o.modifiers and o.modifiers[0].type == 'ARMATURE' else None
    # 衣服下的皮肤删掉（游戏常规做法，杜绝穿模）
    W = dom_groups(body); bmb = bmesh.new(); bmb.from_mesh(body.data); bmb.verts.ensure_lookup_table()
    LEG = ('thigh_l', 'thigh_r', 'calf_l', 'calf_r') + FOOT
    hide = [v for v in bmb.verts if (sum(W[v.index].get(k, 0) for k in TORSO if k != 'neck_01') > 0.75 and v.co.z < 1.5) or sum(W[v.index].get(k, 0) for k in LEG) > 0.5]
    bmesh.ops.delete(bmb, geom=hide, context='VERTS'); bmb.to_mesh(body.data); bmb.free()
    # 动漫化眼睛贴片：沿射线贴在脸上，挂 Head 骨
    bvhb, bmB = evaluated_bvh([body])
    ecs = []
    for sgn in (-1, 1):
        vs_ = [v.co for v in eyes.data.vertices if (v.co.x - cen.x) * sgn > 0]
        ecs.append(sum(vs_, Vector()) / len(vs_))
    for ec in ecs:
        fy = min(v.co.y for v in eyes.data.vertices if (v.co.x - cen.x) * (ec.x - cen.x) > 0)
        hit = Vector((ec.x, fy + 0.011, ec.z + 0.002))   # 眼球最前点（身体网格眼眶是空洞，不能用射线）
        e = sphere('aeye', 0.019, loc=hit + Vector((0, -0.013, -0.001)), scale=(0.85, 0.45, 1.3), m=Mx['eye'], seg=14, rings=10)
        h2 = sphere('aeyehl', 0.0058, loc=hit + Vector((0.004 if ec.x > 0 else -0.002, -0.0195, 0.007)), m=M('#ffffff', emit=1.5), seg=8, rings=6)
        parent_bone(e, arm, 'Head'); parent_bone(h2, arm, 'Head')
    bmB.free(); eyes.hide_render = True
    for o in (body, hair, top, boots): add_outline(o)
    noline(hair); noline(eyes); noline(brows); noline(body)
    bc = sum((v.co for v in brows.data.vertices), Vector()) / len(brows.data.vertices)
    for v in brows.data.vertices: v.co.z = bc.z + 0.004 + (v.co.z - bc.z) * 0.6
    accessories(arm, Mx)
    root = empty('root'); arm.parent = root; root.scale = (GLOBAL,) * 3
    log('built static', len(body.data.vertices), 'body verts')
    return dict(root=root, arm=arm, top=top, M=Mx, body=body)

def all_noline():
    for o in list(bpy.context.scene.collection.objects):
        if o.type in ('MESH', 'CURVE'): noline(o)

def frame(C, name, out, tag):
    from specs import DIRV
    root, arm = C['root'], C['arm']
    root.rotation_euler = (0, 0, 0); root.scale = (1, 1, 1); bpy.context.view_layer.update()
    for o in [o for o in bpy.data.objects if o.get('cloth')]: bpy.data.objects.remove(o)
    do_pose(arm, name)
    # 落地：最低的脚踩 z=0
    bpy.context.view_layer.update()
    minz = min(bone_pos(arm, b).z for b in ('ball_l', 'ball_r', 'ball_leaf_l', 'ball_leaf_r')) - 0.015
    arm.location.z -= minz; bpy.context.view_layer.update()
    made = build_cloth(arm, C['top'], None, C['M'])
    for o in made: o['cloth'] = 1; o.parent = root
    if os.environ.get('PROTO_FREESTYLE', '0') != '1': all_noline()
    root.scale = (GLOBAL,) * 3
    dn = name.split('_')[1]; vx, vy = DIRV[dn]; root.rotation_euler = (0, 0, math.atan2(vy, vx) + math.pi / 2)
    p = os.path.join(out, f'proto_{name}{tag}.png'); t = time.time(); render(p)
    arm.location.z = 0
    log('render', p, round(time.time() - t, 1), 's')

if __name__ == '__main__':
    a = args(); out = a['out']; os.makedirs(out, exist_ok=True)
    tag = a.get('tag', ''); frames = a.get('frames', 'idle_S,walk_S,idle_SW,walk_SW,idle_N').split(',')
    C = build()
    k = float(os.environ.get('WBX_RES', 1)); w, h = int(a.get('w', 160)), int(a.get('h', 176))
    camera(int(w * k), int(h * k), anchor=(0.5, 0.86), ortho_scale=h / P)
    if a.get('blend'): bpy.ops.wm.save_as_mainfile(filepath=a['blend'])
    for f in frames: frame(C, f, out, tag)
    log('ALL DONE')

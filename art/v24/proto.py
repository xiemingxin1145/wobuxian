"""我不仙 角色原型 v2：在 v1 (build_new.py) 基础上
 - 自然下垂的手臂（肩略后收、手指放松微屈），走路自然摆臂
 - 广袖按重力从下垂手臂悬垂（前后宽的袖袋 + 后侧更长的袂），袖口盖住大半只手
 - 替换写实头部：程序化动漫头型（小下巴、干净下颌线）+ 手绘风脸部贴图（虹膜/高光/睫毛/剑眉/腮红）+ 刘海/鬓发片
 - 头身比约 4.7；乌黑头发 + 蓝黑高光（自定义赛璐璐，不被抬灰）
 - 走路时下摆不再被后腿顶出尾巴（后向约束 + 竖向平滑）
用法: blender -b -P build_v2.py -- --out DIR [--frames ...] [--tag x] [--w 160 --h 176] [--scale 1.06]
"""
import bpy, bmesh, sys, os, math, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import base as B1
from base import *            # 复用 v1：导入、派生衣物、描边、相机/灯光（游戏 lib）
from mathutils import Vector, Matrix
FACE_TEX = os.environ.get('V24_FACE', '')
B1.HEAD_SCALE = float(os.environ.get('PROTO_HEAD', 1.6))
os.environ.setdefault('PROTO_HAIRS', '1.0')
NECK = (0.80, 1.0, 0.80)
FLARE = 1.0; FAT = 1.0          # v24：裙摆外扩倍率（spec.skirt/0.3）、胖体腰臀倍率
_clear = B1.clear_pose
def clear_pose(arm):
    _clear(arm); s = B1.HEAD_SCALE
    arm.pose.bones['neck_01'].scale = NECK
    arm.pose.bones['Head'].scale = (s / NECK[0], s, s / NECK[2])
    bpy.context.view_layer.update()
B1.clear_pose = clear_pose
CEL = os.environ.get('WBX_CEL') == '1'
HC = Vector((0.0, 0.006, 1.700)); HA, HB, HCU, HCL = 0.082, 0.097, 0.108, 0.142   # 新头：中心/半宽/半深/上半高/下半高（静止坐标）

# ------------------------------------------------------------ 材质
def hair_mat():
    m = bpy.data.materials.new('hair_v2'); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear(); N = nt.nodes.new; L = nt.links.new
    out = N('ShaderNodeOutputMaterial')
    if not CEL:
        b = N('ShaderNodeBsdfPrincipled'); b.inputs['Base Color'].default_value = (0.006, 0.006, 0.011, 1)
        b.inputs['Roughness'].default_value = 0.32; b.inputs['Specular IOR Level'].default_value = 0.6
        b.inputs['Coat Weight'].default_value = 0.25; b.inputs['Coat Tint'].default_value = (0.55, 0.65, 1.0, 1)
        L(b.outputs[0], out.inputs[0]); return m
    td = N('ShaderNodeBsdfToon'); td.inputs['Color'].default_value = (0.011, 0.011, 0.018, 1); td.inputs['Size'].default_value = 0.6; td.inputs['Smooth'].default_value = 0.03
    amb = N('ShaderNodeEmission'); amb.inputs['Color'].default_value = (0.004, 0.0045, 0.009, 1)
    a1 = N('ShaderNodeAddShader'); L(td.outputs[0], a1.inputs[0]); L(amb.outputs[0], a1.inputs[1])
    tg = N('ShaderNodeBsdfToon'); tg.component = 'GLOSSY'; tg.inputs['Color'].default_value = (0.030, 0.045, 0.105, 1); tg.inputs['Size'].default_value = 0.09; tg.inputs['Smooth'].default_value = 0.03
    a2 = N('ShaderNodeAddShader'); L(a1.outputs[0], a2.inputs[0]); L(tg.outputs[0], a2.inputs[1])
    lw = N('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.3
    cr = N('ShaderNodeValToRGB'); cr.color_ramp.interpolation = 'CONSTANT'; cr.color_ramp.elements[0].color = (0, 0, 0, 1); cr.color_ramp.elements[1].position = 0.85; cr.color_ramp.elements[1].color = (0.03, 0.045, 0.10, 1)
    L(lw.outputs['Facing'], cr.inputs[0]); rim = N('ShaderNodeEmission'); L(cr.outputs['Color'], rim.inputs['Color'])
    a3 = N('ShaderNodeAddShader'); L(a2.outputs[0], a3.inputs[0]); L(rim.outputs[0], a3.inputs[1]); L(a3.outputs[0], out.inputs[0])
    return m

def decal_mat(path):
    m = bpy.data.materials.new('face_decal'); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear(); N = nt.nodes.new; L = nt.links.new
    out = N('ShaderNodeOutputMaterial'); tx = N('ShaderNodeTexImage'); tx.image = bpy.data.images.load(path); tx.interpolation = 'Linear'; tx.extension = 'CLIP'
    em = N('ShaderNodeEmission'); tr = N('ShaderNodeBsdfTransparent'); mx = N('ShaderNodeMixShader')
    L(tx.outputs['Color'], em.inputs['Color']); L(tx.outputs['Alpha'], mx.inputs[0]); L(tr.outputs[0], mx.inputs[1]); L(em.outputs[0], mx.inputs[2]); L(mx.outputs[0], out.inputs[0])
    return m

# ------------------------------------------------------------ 动漫头
def head_shape(x, y, z):
    if z >= 0:
        X, Y, Z = x * HA, y * HB * (1.0 if y > 0 else 0.97), z * HCU
    else:
        t = -z
        X = x * HA * (1 - 0.40 * t ** 1.7)
        Y = y * HB * (1 - 0.30 * t ** 1.5) - 0.058 * t ** 2.2
        Z = z * HCL
    if Y < 0 and -0.07 < Z < 0.06: Y *= 0.955          # 脸前略平
    return HC + Vector((X, Y, Z))

def make_head(arm, Mx, face_tex=None):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=56, v_segments=36, radius=1.0)
    for v in bm.verts: v.co = head_shape(*v.co)
    bm.normal_update()
    o = mesh_from_bm('anime_head', bm); bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(Mx['skin'])
    for p in o.data.polygons: p.use_smooth = True
    # 脸部贴花：复制正面面片，沿法线外推，平面投影 UV
    bm = bmesh.new(); bm.from_mesh(o.data); bm.normal_update()
    kill = [f for f in bm.faces if not (f.normal.y < -0.25 and HC.z - 0.145 < f.calc_center_median().z < HC.z + 0.08)]
    bmesh.ops.delete(bm, geom=kill, context='FACES')
    for v in bm.verts: v.co += v.normal * 0.0007
    uv = bm.loops.layers.uv.new('UVMap')
    for f in bm.faces:
        for l in f.loops: l[uv].uv = ((l.vert.co.x - HC.x + 0.085) / 0.17, (l.vert.co.z - (HC.z - 0.15)) / 0.27)
    d = mesh_from_bm('face_decal', bm); bpy.context.scene.collection.objects.link(d)
    d.data.materials.append(decal_mat(face_tex or FACE_TEX))
    for p in d.data.polygons: p.use_smooth = True
    md = o.modifiers.new('sub', 'SUBSURF'); md.levels = md.render_levels = 1
    add_outline(o)
    for x in (o, d): parent_bone(x, arm, 'Head')
    return o

def surf_front(x, z, lift):
    zz = (z - HC.z) / (HCU if z >= HC.z else HCL * 1.05)
    k = max(0.03, 1 - (x / (HA * 1.02)) ** 2 - zz ** 2)
    return HC.y - HB * math.sqrt(k) * (0.97 if z > HC.z - 0.07 else 0.9) - lift

def strand(name, root, tip, w, Mh, lift0=0.008, lift1=0.016, bow=0.0, n=12):
    """刘海/鬓发片：沿头骨表面的锥形发片（中线微拱，干净的发梢）"""
    bm = bmesh.new(); prev = None; pts = []
    for i in range(n + 1):
        s = i / n; x = root[0] + (tip[0] - root[0]) * s ** 0.85 + bow * math.sin(math.pi * s); z = root[1] + (tip[1] - root[1]) * s
        pts.append(Vector((x, surf_front(x, z, lift0 + (lift1 - lift0) * s), z)))
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, n)] - pts[max(i - 1, 0)]).normalized()
        nrm = Vector(((p.x - HC.x) / HA ** 2, (p.y - HC.y) / HB ** 2, (p.z - HC.z) / HCU ** 2)).normalized()
        side = t.cross(nrm).normalized(); s = i / n
        ww = w * (1 - 0.92 * s ** 1.6) * (0.75 + 0.25 * math.sin(math.pi * min(1, s * 2.5) / 2))
        a = bm.verts.new(p - side * ww / 2); c = bm.verts.new(p + nrm * 0.004); b = bm.verts.new(p + side * ww / 2)
        if prev: bm.faces.new((prev[0], prev[1], c, a)); bm.faces.new((prev[1], prev[2], b, c))
        prev = (a, c, b)
    o = mesh_from_bm(name, bm); bpy.context.scene.collection.objects.link(o)
    sd = o.modifiers.new('sd', 'SOLIDIFY'); sd.thickness = 0.004; sd.offset = 1
    o.data.materials.append(Mh)
    for p in o.data.polygons: p.use_smooth = True
    add_outline(o, OL * 0.6)
    return o

def bangs(arm, Mh):
    top = HC.z + 0.10; out = []
    spec = [(0.006, 0.020, HC.z + 0.030, 0.030, 0.004), (-0.008, -0.030, HC.z + 0.022, 0.032, -0.004), (0.012, 0.046, HC.z + 0.010, 0.032, 0.006),
            (-0.014, -0.056, HC.z + 0.002, 0.030, -0.006), (0.02, 0.068, HC.z - 0.03, 0.026, 0.004), (-0.022, -0.074, HC.z - 0.04, 0.026, -0.004)]
    for i, (xr, xt, zt, w, bow) in enumerate(spec):
        out.append(strand(f'bang{i}', (xr, top - abs(xr) * 0.6), (xt, zt), w, Mh, bow=bow))
    for sgn in (-1, 1):   # 鬓发：耳前垂到下颌下
        out.append(strand(f'lock{sgn}', (sgn * 0.062, HC.z + 0.06), (sgn * 0.080, HC.z - 0.135), 0.024, Mh, lift0=0.010, lift1=0.02, n=14))
    for o in out: parent_bone(o, arm, 'Head')

# ------------------------------------------------------------ 姿势 v2
FING = ('index', 'middle', 'ring', 'pinky')
def pose_base(arm):
    B1.clear_pose(arm); Y, X, Z = 'Y', 'X', 'Z'
    for s, sg in (('l', 1), ('r', -1)):          # T 姿下先做手指放松微屈（绕世界 Y 轴向掌心卷）
        for f, k in zip(FING, (0.7, 0.85, 1.0, 1.15)):
            for j, a in (('01', 22), ('02', 34), ('03', 22)): rot_bone(arm, f'{f}_{j}_{s}', Y, sg * a * k)
        rot_bone(arm, f'thumb_02_{s}', Y, sg * 12)
        rot_bone(arm, f'clavicle_{s}', Z, sg * 7); rot_bone(arm, f'clavicle_{s}', Y, sg * 5)   # 肩略后收、下沉

def do_pose(arm, name):
    an = name.split('_')[0]; pose_base(arm); Y, X, Z = 'Y', 'X', 'Z'
    if an == 'idle':
        rot_bone(arm, 'upperarm_l', Y, 80); rot_bone(arm, 'upperarm_r', Y, -80)
        rot_bone(arm, 'upperarm_l', X, 5); rot_bone(arm, 'upperarm_r', X, 5)
        rot_bone(arm, 'lowerarm_l', X, -16); rot_bone(arm, 'lowerarm_r', X, -16)
        rot_bone(arm, 'thigh_l', Y, 2); rot_bone(arm, 'thigh_r', Y, -2)
        rot_bone(arm, 'spine_03', X, 3); rot_bone(arm, 'Head', X, -9)
    else:                    # walk 第 1 帧：左腿前、右臂前，自然摆臂
        rot_bone(arm, 'pelvis', Z, 5); rot_bone(arm, 'spine_02', Z, -8); rot_bone(arm, 'spine_01', X, -3)
        rot_bone(arm, 'thigh_l', X, -26); rot_bone(arm, 'calf_l', X, 10); rot_bone(arm, 'foot_l', X, 10)
        rot_bone(arm, 'thigh_r', X, 15); rot_bone(arm, 'calf_r', X, 16); rot_bone(arm, 'foot_r', X, -12)
        rot_bone(arm, 'upperarm_l', Y, 80); rot_bone(arm, 'upperarm_r', Y, -80)
        rot_bone(arm, 'upperarm_l', X, 20); rot_bone(arm, 'upperarm_r', X, -20)
        rot_bone(arm, 'lowerarm_l', X, -8); rot_bone(arm, 'lowerarm_r', X, -28)
        rot_bone(arm, 'Head', Z, 5); rot_bone(arm, 'Head', X, -7)
B1.do_pose = do_pose

# ------------------------------------------------------------ 布料 v2
def build_skirt(arm, top_bvh, M_robe, M_trim):
    legs = [[bone_pos(arm, 'thigh_' + s), bone_pos(arm, 'calf_' + s), bone_pos(arm, 'foot_' + s), bone_pos(arm, 'ball_' + s)] for s in 'lr']
    pel = bone_pos(arm, 'pelvis'); hc = (legs[0][0] + legs[1][0]) / 2
    z0 = pel.z + 0.10; z1 = 0.075; NR, NA = 24, 72; R = []; CS = []
    for i in range(NR):
        t = i / (NR - 1); z = z0 + (z1 - z0) * t
        cs = [leg_point_at_z(L, z) for L in legs]; lr = 0.115 - 0.06 * t
        offs = []
        for ci in cs:
            o = ci - hc; o.z = 0
            o.y = min(o.y, 0.05 + 0.03 * (1 - t))           # 后腿最多把后摆推出一点（不再顶出尾巴）
            o.y = max(o.y, -0.32)
            offs.append(o)
        c = hc.copy(); c.z = z; c.x += sum(o.x for o in offs) / 2 * 0.5; c.y += min(o.y for o in offs) * 0.25
        row = []
        for k in range(NA):
            a = 2 * math.pi * k / NA; d = Vector((math.cos(a), math.sin(a), 0))
            e = max((hc + o - c).dot(d) for o in offs) + lr
            hip = max(0.0, 1 - t / 0.35)
            r = e + 0.035 + 0.085 * FLARE * t ** 1.3
            r = r * (1 - hip) + max(r * 0.92, 0.17 * FAT) * hip
            row.append(r)
        R.append(row); CS.append(c)
    for _ in range(3):                                         # 竖向平滑，消除折点
        R = [R[0]] + [[(R[i - 1][k] + 2 * R[i][k] + R[i + 1][k]) / 4 for k in range(NA)] for i in range(1, NR - 1)] + [R[-1]]
    rings = []
    for i in range(NR):
        t = i / (NR - 1); c = CS[i]; ring = []
        for k in range(NA):
            a = 2 * math.pi * k / NA; d = Vector((math.cos(a), math.sin(a), 0))
            fold = (0.004 + 0.015 * t) * math.sin(9 * a + 1.3) + (0.003 + 0.009 * t) * math.sin(5 * a + 0.4)
            r = R[i][k] + fold
            ring.append(Vector((c.x + d.x * r, c.y + d.y * r * 0.9, c.z + 0.02 * t * max(0, -d.y))))
        rings.append(ring)
    return ring_mesh('skirt', rings, mats=[M_robe, M_trim], face_mat=lambda i, k: 1 if i >= NR - 3 else 0, flip=True)
B1.build_skirt = build_skirt

def build_sleeve(arm, s, M_robe, M_trim):
    """广袖 v2：肩→肘→腕→(重力) 的袖筒；截面前后宽、左右窄（袖袋自然下垂贴身侧），后侧的袂更长，袖口盖住大半只手"""
    P0 = bone_pos(arm, 'clavicle_' + s).lerp(bone_pos(arm, 'upperarm_' + s), 0.8)
    P1 = bone_pos(arm, 'lowerarm_' + s); P2 = bone_pos(arm, 'hand_' + s); dn = Vector((0, 0, -1))
    ad = (P2 - P1).normalized(); P3 = P2 + ad * 0.07 + dn * 0.07 + Vector((0, 0.012, 0))
    path = [P0, P1, P2, P3]
    def pt(u):
        seg = min(int(u * 3), 2); f = u * 3 - seg; return path[seg].lerp(path[seg + 1], f)
    NR, NA = 22, 44; rings = []
    for i in range(NR):
        u = i / (NR - 1); c = pt(u); tan = (pt(min(1, u + 0.02)) - pt(max(0, u - 0.02))).normalized()
        ref = Vector((0, 1, 0)); ref = (ref - tan * ref.dot(tan)).normalized(); b2 = tan.cross(ref).normalized()
        rM = 0.09 + 0.04 * u + 0.17 * u ** 2.0; rm = 0.088 + 0.015 * u + 0.07 * u ** 2.2
        ring = []
        for k in range(NA):
            a = 2 * math.pi * k / NA; ca, sa = math.cos(a), math.sin(a)
            p = c + ref * rM * ca + b2 * rm * sa
            p += (ref * ca + b2 * sa) * (0.003 + 0.010 * u) * math.sin(6 * a + i * 0.25)
            p += dn * (0.13 * u ** 4 * (0.3 + 0.7 * max(0.0, ca)))          # 后侧（+Y）的袂垂得更低
            ring.append(p)
        rings.append(ring)
    return ring_mesh('sleeve_' + s, rings, mats=[M_robe, M_trim], face_mat=lambda i, k: 1 if i >= NR - 2 else 0)
B1.build_sleeve = build_sleeve

# ------------------------------------------------------------ 发冠 v2
def accessories(arm, M):
    H = arm.matrix_world @ arm.data.bones['Head'].head_local
    top = Vector((0, HC.y + 0.03, HC.z + HCU + 0.05))
    bun = sphere('bun', 0.044, loc=top, scale=(1, 1, 0.9), m=M['hair'], seg=24, rings=16)
    band = lathe('guan', [(0.040, -0.026), (0.047, -0.010), (0.049, 0.008), (0.044, 0.020)], loc=top, m=M['gold'], seg=32, close_top=False)
    jade = sphere('jade', 0.011, loc=top + Vector((0, -0.048, 0.0)), scale=(1, 0.5, 1.2), m=M['jade'], seg=12, rings=8)
    pin = cyl('pin', 0.0045, 0.0045, 0.17, loc=top + Vector((0, 0, 0.006)), rot=(0, D(90), 0), m=M['gold'], seg=8)
    ends = [sphere('pinend', 0.008, loc=top + Vector((sg * 0.085, 0, 0.006)), m=M['gold'], seg=10, rings=8) for sg in (-1, 1)]
    for o in [bun, band, jade, pin] + ends: parent_bone(o, arm, 'Head')
    add_outline(bun, OL * 0.6); add_outline(band, OL * 0.5)
    pts = [Vector((0, HC.y + 0.09, HC.z + 0.075)), Vector((0, HC.y + 0.125, HC.z - 0.03)), Vector((0, HC.y + 0.13, HC.z - 0.2)), Vector((0, HC.y + 0.12, HC.z - 0.36))]
    tail = tube('ptail', pts, 0.036, m=M['hair'], taper=[1.0, 1.0, 0.8, 0.2]); tail.data.bevel_resolution = 4
    parent_bone(tail, arm, 'Head')
    g = empty('backsw', bone_pos(arm, 'spine_03') + Vector((0.03, 0.17, -0.14))); g.rotation_euler = (D(-8), D(-50), 0)
    L = 0.68
    box('scab', (0.06, 0.03, L), loc=(0, 0, L / 2 + 0.05), m=M['scab'], parent=g, bevel=0.012)
    box('scabtip', (0.066, 0.034, 0.06), loc=(0, 0, 0.06), m=M['gold'], parent=g, bevel=0.01)
    box('guard', (0.13, 0.045, 0.03), loc=(0, 0, L + 0.07), m=M['gold'], parent=g, bevel=0.01)
    cyl('grip', 0.018, 0.018, 0.16, loc=(0, 0, L + 0.165), m=M['grip'], parent=g, seg=10)
    sphere('pommel', 0.026, loc=(0, 0, L + 0.255), m=M['gold'], parent=g, seg=10, rings=8)
    tube('tassel', [(0, 0, L + 0.27), (0.02, 0.03, L + 0.2), (0.04, 0.05, L + 0.08)], 0.008, m=M['trim'], parent=g)
    bpy.context.view_layer.update(); parent_bone(g, arm, 'spine_03')
    for c in g.children:
        if c.name.startswith('scab'): add_outline(c, OL * 0.8)

# ------------------------------------------------------------ 主流程 v2
def build(spec=SPEC):
    reset(); lights()
    arm, body, eyes, brows, hair = setup_character()
    Mx = dict(robe=M(spec['robe'], rough=0.62, sheen=0.4), robe2=M(spec['robe2'], rough=0.6), trim=M(spec['trim'], rough=0.4, metal=0.3),
              belt=M(spec['belt'], rough=0.4, metal=0.2), hair=hair_mat(), skin=M(spec['skin'], rough=0.5, sss=0.25),
              shoe=M(spec['shoe'], rough=0.5), inner=M(spec['inner'], rough=0.6), gold=M('#e8b440', metal=0.9, rough=0.25),
              scab=M('#6a2e22', rough=0.35), grip=M('#6a3a1e', rough=0.7), jade=M('#9fe0c8', rough=0.2, emit=0.2))
    body.data.materials.clear(); body.data.materials.append(Mx['skin'])
    for p in body.data.polygons: p.material_index = 0
    hair.data.materials.clear(); hair.data.materials.append(Mx['hair'])
    for p in hair.data.polygons: p.use_smooth = True; p.material_index = 0
    parent_bone(hair, arm, 'Head')
    for o in (eyes, brows): o.hide_render = True
    top = derived_layer(body, 'robe_top', lambda w: sum(w.get(k, 0) for k in TORSO) > 0.5 and w.get('lowerarm_l', 0) + w.get('lowerarm_r', 0) < 0.5 and w.get('neck_01', 0) < 0.5 and w.get('Head', 0) < 0.05 and w.get('hand_l', 0) + w.get('hand_r', 0) < 0.3,
                        0.024, 8, Mx['robe'], zmin=0.80)
    inner = derived_layer(body, 'inner', lambda w: sum(w.get(k, 0) for k in TORSO) > 0.5 and sum(w.get(k, 0) for k in ('upperarm_l', 'upperarm_r', 'lowerarm_l', 'lowerarm_r')) < 0.4 and w.get('Head', 0) < 0.2 and w.get('hand_l', 0) + w.get('hand_r', 0) < 0.3, 0.016, 3, Mx['inner'], zmin=1.05, zmax=1.60)
    boots = derived_layer(body, 'boots', lambda w: sum(w.get(k, 0) for k in FOOT) + w.get('calf_l', 0) + w.get('calf_r', 0) > 0.5, 0.012, 4, Mx['shoe'], zmax=0.22)
    for o in (top, boots, inner):
        o.parent = arm
        for md in o.modifiers:
            if md.type == 'ARMATURE': md.object = arm
    # 删除衣下皮肤 + 写实头部（保留脖子、手）
    W = dom_groups(body); bmb = bmesh.new(); bmb.from_mesh(body.data); bmb.verts.ensure_lookup_table()
    LEG = ('thigh_l', 'thigh_r', 'calf_l', 'calf_r') + FOOT
    hide = [v for v in bmb.verts if (sum(W[v.index].get(k, 0) for k in TORSO if k != 'neck_01') > 0.75 and v.co.z < 1.56)
            or sum(W[v.index].get(k, 0) for k in LEG) > 0.5 or W[v.index].get('Head', 0) > 0.35]
    bmesh.ops.delete(bmb, geom=hide, context='VERTS'); bmb.to_mesh(body.data); bmb.free()
    for o in (body, top, boots): add_outline(o)      # 长发卡片不加外壳描边（否则细发丝变成毛刺）
    make_head(arm, Mx); bangs(arm, Mx['hair']); accessories(arm, Mx)
    root = empty('root'); arm.parent = root; root.scale = (B1.GLOBAL,) * 3
    log('built v2 static')
    return dict(root=root, arm=arm, top=top, M=Mx, body=body)
B1.build = build

if __name__ == '__main__':
    a = args(); out = a['out']; os.makedirs(out, exist_ok=True)
    B1.GLOBAL = float(a.get('scale', B1.GLOBAL))
    tag = a.get('tag', ''); frames = a.get('frames', 'idle_S,walk_S,idle_SW,walk_SW,idle_N').split(',')
    C = build()
    k = float(os.environ.get('WBX_RES', 1)); w, h = int(a.get('w', 160)), int(a.get('h', 176))
    camera(int(w * k), int(h * k), anchor=(0.5, 0.86), ortho_scale=h / P)
    if a.get('blend'): bpy.ops.wm.save_as_mainfile(filepath=a['blend'])
    for f in frames: B1.frame(C, f, out, tag)
    log('ALL DONE')

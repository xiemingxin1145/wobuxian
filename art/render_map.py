"""渲染地图底图：程序化地形材质 + 悬浮岛岩柱 + 草丛/花 + 道具投影（道具本体不可见，只投影）"""
import sys, os, json, math, random, time; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
import props
a = args(); mid = a['map']
MAPS = {m['id']: m for m in json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'maps.json')))}
m = MAPS[mid]; N = m['n']; T = m['tiles']
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'maps'); os.makedirs(OUT, exist_ok=True)
t0 = time.time()
reset(); sun = lights()
sc = bpy.context.scene; sc.cycles.samples = int(os.environ.get('WBX_SAMPLES', 48))
COL = {'g': ('#7cc85c', '#4f9a40', 6), 'f': ('#80cc60', '#55a044', 6), 'p': ('#e2c792', '#c3a26c', 9), 's': ('#dcd8d0', '#bcb5a8', 4), 'd': ('#9c6c44', '#7a5232', 5),
       'a': ('#f2dfaa', '#e0c68e', 7), 'r': ('#4e3e4a', '#33262f', 5), 'b': ('#857462', '#62533f', 6), 'c': ('#fdfdff', '#e2e8fb', 3), 'l': ('#5a2a1a', '#3a1a10', 5),
       'm': ('#5f7d70', '#45594f', 6), 'j': ('#c8f2e2', '#a0dcc8', 4), 'w': ('#7a6a4a', '#5a4a34', 5), 'x': ('#000000', '#000000', 1)}
types = sorted(set(''.join(T)) - {'x'})
land = [(i, j) for j in range(N) for i in range(N) if T[j][i] != 'x']

LANDS = set(land)
def isb(i, j):  # 角点是否在边缘
    return any((i - di, j - dj) not in LANDS for di in (0, 1) for dj in (0, 1))
def JIT(i, j, amt=0.22):
    if not isb(i, j): return (i, j)
    h1 = math.sin(i * 12.9898 + j * 78.233) * 43758.5453; h2 = math.sin(i * 39.346 + j * 11.135) * 24634.6345
    return (i + (h1 - math.floor(h1) - 0.5) * 2 * amt, j + (h2 - math.floor(h2) - 0.5) * 2 * amt)
def mask_img(name, pred):
    img = bpy.data.images.new(name, N, N, float_buffer=True)
    px = []
    for py in range(N):
        j = N - 1 - py
        for i in range(N):
            v = 1.0 if pred(T[j][i]) else 0.0; px += [v, v, v, 1]
    img.pixels = px
    return img

# ---------- 地面网格 ----------
bm = bmesh.new(); vid = {}
def V(i, j):
    if (i, j) not in vid:
        x, y = JIT(i, j); vid[(i, j)] = bm.verts.new((x, -y, 0))
    return vid[(i, j)]
for i, j in land: bm.faces.new((V(i, j), V(i + 1, j), V(i + 1, j + 1), V(i, j + 1)))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
for f in bm.faces:
    if f.normal.z < 0: f.normal_flip()
ground = mesh_from_bm('ground', bm); bpy.context.scene.collection.objects.link(ground)
gm = bpy.data.materials.new('ground'); gm.use_nodes = True; nt = gm.node_tree; bsdf = nt.nodes['Principled BSDF']
bsdf.inputs['Roughness'].default_value = 0.85
tc = nt.nodes.new('ShaderNodeTexCoord')
# UV = (x/N, y/N+1) + 噪声扰动
sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['Object'], sep.inputs[0])
noiseUV = nt.nodes.new('ShaderNodeTexNoise'); noiseUV.inputs['Scale'].default_value = 1.6; noiseUV.inputs['Detail'].default_value = 3
nt.links.new(tc.outputs['Object'], noiseUV.inputs['Vector'])
def math_node(op, a_, b_):
    n_ = nt.nodes.new('ShaderNodeMath'); n_.operation = op
    for k, v in enumerate((a_, b_)):
        if isinstance(v, (int, float)): n_.inputs[k].default_value = v
        else: nt.links.new(v, n_.inputs[k])
    return n_.outputs[0]
sepn = nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(noiseUV.outputs['Color'], sepn.inputs[0])
u = math_node('ADD', math_node('DIVIDE', sep.outputs['X'], N), math_node('MULTIPLY', math_node('SUBTRACT', sepn.outputs[0], 0.5), 0.9 / N))
v = math_node('ADD', math_node('ADD', math_node('DIVIDE', sep.outputs['Y'], N), 1.0), math_node('MULTIPLY', math_node('SUBTRACT', sepn.outputs[1], 0.5), 0.9 / N))
uvc = nt.nodes.new('ShaderNodeCombineXYZ'); nt.links.new(u, uvc.inputs[0]); nt.links.new(v, uvc.inputs[1])
detail = nt.nodes.new('ShaderNodeTexNoise'); detail.inputs['Scale'].default_value = 7; detail.inputs['Detail'].default_value = 6
nt.links.new(tc.outputs['Object'], detail.inputs['Vector'])
vor = nt.nodes.new('ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = 9; nt.links.new(tc.outputs['Object'], vor.inputs['Vector'])
brick = nt.nodes.new('ShaderNodeTexBrick'); brick.inputs['Scale'].default_value = 2.0; brick.inputs['Mortar Size'].default_value = 0.025
brick.inputs['Color1'].default_value = (1, 1, 1, 1); brick.inputs['Color2'].default_value = (0.86, 0.86, 0.86, 1); brick.inputs['Mortar'].default_value = (0.55, 0.55, 0.55, 1)
nt.links.new(tc.outputs['Object'], brick.inputs['Vector'])
wave = nt.nodes.new('ShaderNodeTexWave'); wave.inputs['Scale'].default_value = 3.0; wave.inputs['Distortion'].default_value = 1.0
nt.links.new(tc.outputs['Object'], wave.inputs['Vector'])
prev = None
for t in types:
    c1, c2, _ = COL[t]
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    nt.links.new(detail.outputs['Fac'], mix.inputs['Factor']); mix.inputs['A'].default_value = hexc(c1); mix.inputs['B'].default_value = hexc(c2)
    col = mix.outputs['Result']
    if t in 'sj':
        mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs['Factor'].default_value = 1.0
        nt.links.new(col, mul.inputs['A']); nt.links.new(brick.outputs['Color'], mul.inputs['B']); col = mul.outputs['Result']
    if t == 'd':
        mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs['Factor'].default_value = 0.6
        nt.links.new(col, mul.inputs['A']); nt.links.new(wave.outputs['Color'], mul.inputs['B']); col = mul.outputs['Result']
    if t in 'gf':
        mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs['Factor'].default_value = 0.25
        nt.links.new(col, mul.inputs['A']); nt.links.new(vor.outputs['Color'], mul.inputs['B']); col = mul.outputs['Result']
    if prev is None: prev = col; continue
    img = mask_img('mask_' + t, lambda ch, t=t: ch == t)
    it = nt.nodes.new('ShaderNodeTexImage'); it.image = img; it.interpolation = 'Linear'; nt.links.new(uvc.outputs[0], it.inputs['Vector'])
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = 0.38; mr.inputs['From Max'].default_value = 0.62
    nt.links.new(it.outputs['Color'], mr.inputs['Value'])
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; nt.links.new(mr.outputs['Result'], mx.inputs['Factor'])
    nt.links.new(prev, mx.inputs['A']); nt.links.new(col, mx.inputs['B']); prev = mx.outputs['Result']
nt.links.new(prev, bsdf.inputs['Base Color'])
bmp = nt.nodes.new('ShaderNodeBump'); bmp.inputs['Strength'].default_value = 0.25; nt.links.new(detail.outputs['Fac'], bmp.inputs['Height']); nt.links.new(bmp.outputs['Normal'], bsdf.inputs['Normal'])
ground.data.materials.append(gm)

def masked_plane(name, ch, shader_fn, z):
    bm2 = bmesh.new(); vv = {}
    def V2(i, j):
        if (i, j) not in vv:
            x, y = JIT(i, j); vv[(i, j)] = bm2.verts.new((x, -y, z))
        return vv[(i, j)]
    cells = [(i, j) for i, j in land]
    for i, j in cells: bm2.faces.new((V2(i, j), V2(i + 1, j), V2(i + 1, j + 1), V2(i, j + 1)))
    for f in bm2.faces:
        if f.normal.z < 0: f.normal_flip()
    o = mesh_from_bm(name, bm2); bpy.context.scene.collection.objects.link(o)
    mt = bpy.data.materials.new(name); mt.use_nodes = True; n2 = mt.node_tree
    out = n2.nodes['Material Output']; old = n2.nodes['Principled BSDF']
    surf = shader_fn(n2, old)
    tc2 = n2.nodes.new('ShaderNodeTexCoord'); sp2 = n2.nodes.new('ShaderNodeSeparateXYZ'); n2.links.new(tc2.outputs['Object'], sp2.inputs[0])
    nz = n2.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.6; n2.links.new(tc2.outputs['Object'], nz.inputs['Vector'])
    sc2 = n2.nodes.new('ShaderNodeSeparateColor'); n2.links.new(nz.outputs['Color'], sc2.inputs[0])
    def mn(op, a_, b_):
        q = n2.nodes.new('ShaderNodeMath'); q.operation = op
        for k, vv_ in enumerate((a_, b_)):
            if isinstance(vv_, (int, float)): q.inputs[k].default_value = vv_
            else: n2.links.new(vv_, q.inputs[k])
        return q.outputs[0]
    uu = mn('ADD', mn('DIVIDE', sp2.outputs['X'], N), mn('MULTIPLY', mn('SUBTRACT', sc2.outputs[0], 0.5), 0.9 / N))
    vv2 = mn('ADD', mn('ADD', mn('DIVIDE', sp2.outputs['Y'], N), 1.0), mn('MULTIPLY', mn('SUBTRACT', sc2.outputs[1], 0.5), 0.9 / N))
    cb = n2.nodes.new('ShaderNodeCombineXYZ'); n2.links.new(uu, cb.inputs[0]); n2.links.new(vv2, cb.inputs[1])
    it = n2.nodes.new('ShaderNodeTexImage'); it.image = mask_img('pm_' + name, lambda c_: c_ == ch); n2.links.new(cb.outputs[0], it.inputs['Vector'])
    mr = n2.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = 0.42; mr.inputs['From Max'].default_value = 0.58; n2.links.new(it.outputs['Color'], mr.inputs['Value'])
    tr = n2.nodes.new('ShaderNodeBsdfTransparent'); mx = n2.nodes.new('ShaderNodeMixShader')
    n2.links.new(mr.outputs['Result'], mx.inputs[0]); n2.links.new(tr.outputs[0], mx.inputs[1]); n2.links.new(surf, mx.inputs[2]); n2.links.new(mx.outputs[0], out.inputs[0])
    o.data.materials.append(mt); return o

if 'w' in types:
    def water(n2, b):
        b.inputs['Base Color'].default_value = hexc('#3aa8d8'); b.inputs['Roughness'].default_value = 0.06
        try: b.inputs['Specular IOR Level'].default_value = 0.9
        except Exception: pass
        b.inputs['Coat Weight'].default_value = 0.6
        nz = n2.nodes.new('ShaderNodeTexWave'); nz.inputs['Scale'].default_value = 2.5; nz.inputs['Distortion'].default_value = 6; nz.wave_type = 'RINGS'
        bp = n2.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.12; n2.links.new(nz.outputs['Fac'], bp.inputs['Height']); n2.links.new(bp.outputs['Normal'], b.inputs['Normal'])
        return b.outputs[0]
    masked_plane('water', 'w', water, 0.03)
if 'l' in types:
    def lava(n2, b):
        em = n2.nodes.new('ShaderNodeEmission'); nz = n2.nodes.new('ShaderNodeTexVoronoi'); nz.inputs['Scale'].default_value = 3
        cr = n2.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].color = hexc('#ffd040'); cr.color_ramp.elements[1].color = hexc('#ff3a10')
        n2.links.new(nz.outputs['Distance'], cr.inputs[0]); n2.links.new(cr.outputs[0], em.inputs[0]); em.inputs[1].default_value = 2.5
        return em.outputs[0]
    masked_plane('lava', 'l', lava, 0.02)

# ---------- 悬浮岛岩柱 ----------
cx, cy = N / 2, N / 2
bm = bmesh.new(); R = random.Random(7)
edge_d = {}; MAXY = [0]
for i, j in land:
    dd = 9
    for r in range(1, 9):
        if any((i + di, j + dj) not in LANDS for di in range(-r, r + 1) for dj in range(-r, r + 1) if abs(di) + abs(dj) == r): dd = r; break
    depth = 0.3 + dd * 0.95 + R.random() * 0.45
    edge_d[(i, j)] = dd; MAXY[0] = max(MAXY[0], (i + j + 2) * 24.04 + depth * 58.9)
    cs = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    top = [JIT(*c) for c in cs]
    bot = []
    for (x, y) in top:
        k = min(0.5, 0.06 * depth); bot.append((x + (cx - x) * k * 0.3 + (R.random() - 0.5) * 0.2, y + (cy - y) * k * 0.3 + (R.random() - 0.5) * 0.2))
    v = [bm.verts.new((x, -y, -0.02)) for x, y in top] + [bm.verts.new((x, -y, -depth)) for x, y in bot]
    for f in ((0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7), (7, 6, 5, 4)): bm.faces.new([v[k] for k in f])
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
cliff = mesh_from_bm('cliff', bm); bpy.context.scene.collection.objects.link(cliff)
cm = bpy.data.materials.new('cliff'); cm.use_nodes = True; n3 = cm.node_tree; b3 = n3.nodes['Principled BSDF']; b3.inputs['Roughness'].default_value = 0.9
tc3 = n3.nodes.new('ShaderNodeTexCoord'); s3 = n3.nodes.new('ShaderNodeSeparateXYZ'); n3.links.new(tc3.outputs['Object'], s3.inputs[0])
cr3 = n3.nodes.new('ShaderNodeValToRGB'); n3.links.new(s3.outputs['Z'], cr3.inputs[0])
top_c = {'heaven': '#f4f0ff', 'rift': '#4a3038', 'secret': '#5a4a6a', 'graveyard': '#6a5a50'}.get(m['biome'], '#8a6a4a')
bot_c = {'heaven': '#c8d0f0', 'rift': '#1a1018', 'secret': '#2a2040', 'graveyard': '#3a302a'}.get(m['biome'], '#5a4a40')
cr3.color_ramp.elements[0].position = 0.0; cr3.color_ramp.elements[0].color = hexc(bot_c); cr3.color_ramp.elements[1].position = 1.0; cr3.color_ramp.elements[1].color = hexc(top_c)
mr3 = n3.nodes.new('ShaderNodeMapRange'); mr3.inputs['From Min'].default_value = -4; mr3.inputs['From Max'].default_value = 0
n3.links.new(s3.outputs['Z'], mr3.inputs['Value']); n3.links.new(mr3.outputs['Result'], cr3.inputs[0])
nz3 = n3.nodes.new('ShaderNodeTexNoise'); nz3.inputs['Scale'].default_value = 4; n3.links.new(tc3.outputs['Object'], nz3.inputs['Vector'])
bp3 = n3.nodes.new('ShaderNodeBump'); bp3.inputs['Strength'].default_value = 0.6; n3.links.new(nz3.outputs['Fac'], bp3.inputs['Height']); n3.links.new(bp3.outputs['Normal'], b3.inputs['Normal'])
n3.links.new(cr3.outputs[0], b3.inputs['Base Color']); cliff.data.materials.append(cm)
md = cliff.modifiers.new('bev', 'BEVEL'); md.width = 0.08; md.segments = 2
# 草皮边缘
lipm = M(COL.get(m['tiles'][N // 2][N // 2], COL['g'])[1] if m['biome'] not in ('heaven',) else '#ffffff', rough=0.8)

# ---------- 草丛 / 花 / 石子 ----------
def make_tuft(col):
    bm4 = bmesh.new()
    for k in range(5):
        a4 = k / 5 * 6.28; r4 = 0.03
        b0 = [bm4.verts.new((math.cos(a4) * r4 + dx, math.sin(a4) * r4 + dy, 0)) for dx, dy in ((-0.012, 0), (0.012, 0))]
        tip = bm4.verts.new((math.cos(a4) * 0.07, math.sin(a4) * 0.07, 0.12 + (k % 2) * 0.04)); bm4.faces.new((b0[0], b0[1], tip))
    me = bpy.data.meshes.new('tuft'); bm4.to_mesh(me); me.materials.append(M(col, rough=0.7)); return me
grass_col = {'heaven': None, 'rift': '#6a3a3a', 'secret': '#6aa08a', 'graveyard': '#8a8a5a'}.get(m['biome'], '#5fbf4a')
tuft = make_tuft(grass_col) if grass_col else None
pebble = bpy.data.meshes.new('peb'); bm5 = bmesh.new(); bmesh.ops.create_icosphere(bm5, subdivisions=1, radius=0.04); bm5.to_mesh(pebble); pebble.materials.append(M('#a89a86', rough=0.9))
flowers = [M(c, rough=0.5, emit=0.15) for c in ('#ffffff', '#ffd75e', '#ff8fbf', '#c8a0ff')]
fmesh = []
for fm in flowers:
    me = bpy.data.meshes.new('fl'); bm6 = bmesh.new(); bmesh.ops.create_icosphere(bm6, subdivisions=1, radius=0.03); bm6.to_mesh(me); me.materials.append(fm); fmesh.append(me)
occ = set()
for typ, i, j in m['props']:
    fw, fh = props.PROPS[typ][1:]
    for jj in range(j, j + fh):
        for ii in range(i, i + fw): occ.add((ii, jj))
R2 = random.Random(3)
for i, j in land:
    ch = T[j][i]
    if (i, j) in occ: continue
    if ch in 'gfm' and tuft:
        for k in range(4 if ch != 'm' else 2):
            o = bpy.data.objects.new('t', tuft); o.location = (i + R2.random(), -(j + R2.random()), 0); o.rotation_euler = (0, 0, R2.random() * 6); s_ = 0.7 + R2.random() * 0.6; o.scale = (s_, s_, s_)
            bpy.context.scene.collection.objects.link(o)
    if ch == 'f':
        for k in range(6):
            o = bpy.data.objects.new('f', fmesh[R2.randrange(4)]); o.location = (i + R2.random(), -(j + R2.random()), 0.05); bpy.context.scene.collection.objects.link(o)
    if ch in 'pab' and R2.random() < 0.6:
        for k in range(3):
            o = bpy.data.objects.new('p', pebble); o.location = (i + R2.random(), -(j + R2.random()), 0.0); o.scale = (1, 1, 0.5); bpy.context.scene.collection.objects.link(o)

# ---------- 道具（仅投影） ----------
PROPOBJ = []
for typ, i, j in m['props']:
    fn, fw, fh = props.PROPS[typ]
    before = set(bpy.data.objects)
    fn()
    new = [o for o in bpy.data.objects if o not in before]
    PROPOBJ.append((new, (i + fw / 2, -(j + fh / 2)), max(fw, fh)))
    for o in new:
        if o.parent is None: o.location = (o.location.x + i + fw / 2, o.location.y - (j + fh / 2), o.location.z)
        if not a.get('cg'): o.visible_camera = False; o.visible_glossy = False; o.visible_transmission = False
        if o.type == 'LIGHT': pass

# ---------- 剧情CG（透视） ----------
if a.get('cg'):
    import chars, monsters
    from specs import SPRITES
    from cg_specs import CGS
    C = CGS[a['cg']]
    tgt, az, el, dist, lens = C['cam']; tv = Vector((tgt[0], -tgt[1], tgt[2]))
    cpos = tv + Vector((math.cos(D(el)) * math.cos(D(az)), math.cos(D(el)) * math.sin(D(az)), math.sin(D(el)))) * dist
    # 自动隐藏挡在镜头与主角之间的道具
    for objs, (px, py), sz in PROPOBJ:
        ax, ay = cpos.x, cpos.y; bx, by = tv.x, tv.y; dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy
        t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / L2)); dd = math.hypot(ax + t * dx - px, ay + t * dy - py)
        if (t < 0.97 and dd < 1.3 + sz * 0.5) or math.hypot(px - ax, py - ay) < 1.5 + sz * 0.5:
            for o in objs: o.hide_render = True
    for sid, ci, cj, face, an, fr, scl in C['chars']:
        S = SPRITES[sid]; sc_ = 1.2 * S.get('scale', 1.0) * scl
        if S['kind'] == 'chibi': R = chars.chibi(S['spec'], scale=sc_); posef = chars.pose
        else: R = monsters.setup(S['mon'], scale=sc_); posef = monsters.mpose
        R.root.location = (ci, -cj, 0.0)
        ang = math.atan2(cpos.y + cj, cpos.x - ci) if face == 'cam' else D(face)
        R.root.rotation_euler = (0, 0, ang + math.pi / 2)
        n = S['anims'].get(an, S['anims']['idle']); posef(R, an if an in S['anims'] else 'idle', fr % n, n)
    if C.get('pillar'):
        bk = tv + (tv - cpos).normalized() * 3.0
        cyl('pillar', 0.7, 0.7, 30, loc=(bk.x, bk.y, 15), m=M('#fff4c0', emit=4.0, alpha=0.4), seg=32)
    if C.get('night'):
        for o in bpy.data.objects:
            if o.type == 'LIGHT' and o.data.type == 'SUN': o.data.energy *= 0.35; o.data.color = (0.6, 0.7, 1.0)
        moon = bpy.data.lights.new('moon', 'POINT'); moon.energy = 400; moon.color = (0.7, 0.8, 1.0); mo = bpy.data.objects.new('moon', moon); mo.location = cpos + Vector((0, 0, 4)); bpy.context.scene.collection.objects.link(mo)
    k = float(os.environ.get('WBX_RES', 1)); W, H = int(1280 * k), int(720 * k)
    sc.render.resolution_x, sc.render.resolution_y = W, H
    cd = bpy.data.cameras.new('cgc'); cam = bpy.data.objects.new('cgc', cd); sc.collection.objects.link(cam); sc.camera = cam
    cd.lens = lens; cd.sensor_width = 36; cam.location = cpos; cam.rotation_euler = (tv - cpos).to_track_quat('-Z', 'Y').to_euler()
    cd.dof.use_dof = True; cd.dof.focus_distance = dist; cd.dof.aperture_fstop = 2.8
    od = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'cg'); os.makedirs(od, exist_ok=True)
    render(os.path.join(od, a['cg'] + '_raw.png'))
    print('DONE', a['cg'], round(time.time() - t0, 1), flush=True)
    raise SystemExit(0)
# ---------- 相机 ----------
W = int(N * 1.4142 * P + 120); topm = 60; isoh = N * 0.7071 * P; H = int(MAXY[0] + topm + 30)
cam = camera(W, H, anchor=(0.5, (topm + isoh / 2) / H), target=(N / 2, -N / 2, 0), ortho_scale=max(W, H) / P)
bpy.context.view_layer.update()
O = project(cam, (0, 0, 0)); EX = project(cam, (1, 0, 0)); EJ = project(cam, (0, -1, 0)); EZ = project(cam, (0, 0, 1))
meta = dict(id=mid, w=W, h=H, ox=O[0], oy=O[1], ex=[EX[0] - O[0], EX[1] - O[1]], ej=[EJ[0] - O[0], EJ[1] - O[1]], ez=[EZ[0] - O[0], EZ[1] - O[1]])
json.dump(meta, open(os.path.join(OUT, mid + '.json'), 'w'))
render(os.path.join(OUT, mid + '.png'))
print('DONE', mid, W, H, round(time.time() - t0, 1), flush=True)

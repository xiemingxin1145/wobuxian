"""我不仙 v2 — Blender bpy 建模/渲染公共库（Q版低多边形风格，Cycles CPU）"""
import bpy, math, bmesh, os, sys, json, random
from mathutils import Vector, Euler, Matrix

P = 68.0                      # 每 Blender 单位对应像素（与游戏一致：1 格菱形宽 96px）
CAM_ROT = (math.radians(60), 0, math.radians(45))
D = math.radians

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = int(os.environ.get('WBX_SAMPLES', 24))
    sc.cycles.use_denoising = True
    try: sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    except Exception: pass
    sc.cycles.max_bounces = 4; sc.cycles.diffuse_bounces = 2; sc.cycles.glossy_bounces = 2; sc.cycles.transparent_max_bounces = 8
    sc.cycles.use_adaptive_sampling = True
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    sc.view_settings.exposure = 0.0
    sc.render.threads_mode = 'FIXED'; sc.render.threads = int(os.environ.get('WBX_THREADS', 2))
    w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.78, 0.84, 1.0, 1); bg.inputs[1].default_value = 0.55
    return sc

def toon(thick=None):
    """v2.1 画质升级：Freestyle 描边（只描外轮廓/边界）"""
    if os.environ.get('WBX_TOON', '1') != '1': return
    sc = bpy.context.scene; k = float(os.environ.get('WBX_RES', 1))
    sc.render.use_freestyle = True; sc.render.line_thickness_mode = 'ABSOLUTE'
    sc.render.line_thickness = thick or (1.6 if os.environ.get('WBX_CEL') == '1' else 1.1) * k
    vl = bpy.context.view_layer; vl.use_freestyle = True
    fs = vl.freestyle_settings; fs.crease_angle = D(120)
    ls = fs.linesets[0] if fs.linesets else fs.linesets.new('L')
    ls.select_by_visibility = True; ls.select_by_edge_types = True
    ls.select_silhouette = True; ls.select_border = True; ls.select_crease = False; ls.select_contour = True
    st = ls.linestyle or bpy.data.linestyles.new('LS'); ls.linestyle = st; st.color = (0.16, 0.09, 0.06); st.alpha = 0.85; st.thickness = sc.render.line_thickness
    try: st.chaining = 'PLAIN'; st.use_chaining = True
    except Exception: pass

def lights(strength=3.2, ang=(D(50), D(0), D(-40)), soft=D(8)):
    s = bpy.data.lights.new('sun', 'SUN'); s.energy = strength; s.angle = soft; s.color = (1.0, 0.96, 0.88)
    o = bpy.data.objects.new('sun', s); o.rotation_euler = ang; bpy.context.scene.collection.objects.link(o)
    # 补光（冷色）
    f = bpy.data.lights.new('fill', 'SUN'); f.energy = 0.6; f.color = (0.75, 0.85, 1.0); f.angle = D(30)
    fo = bpy.data.objects.new('fill', f); fo.rotation_euler = (D(60), 0, D(150)); bpy.context.scene.collection.objects.link(fo)
    fo.visible_shadow = False if hasattr(fo, 'visible_shadow') else None
    if os.environ.get('WBX_TOON', '1') == '1':
        # 轮廓光（从角色背后打来的暖白光，勾出边缘高光）
        r = bpy.data.lights.new('rim', 'SUN'); r.energy = 2.2; r.color = (1.0, 0.95, 0.85); r.angle = D(4)
        ro = bpy.data.objects.new('rim', r); ro.rotation_euler = (D(-70), 0, D(45)); bpy.context.scene.collection.objects.link(ro)
        try: ro.visible_shadow = False
        except Exception: pass
        toon()
    return o

def camera(w, h, anchor=(0.5, 0.85), target=(0, 0, 0), persp=False, lens=50, ortho_scale=None):
    sc = bpy.context.scene
    cd = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam); sc.camera = cam
    cam.rotation_euler = CAM_ROT
    sc.render.resolution_x = w; sc.render.resolution_y = h; sc.render.resolution_percentage = 100
    rot = Euler(CAM_ROT).to_matrix()
    fwd = rot @ Vector((0, 0, -1)); up = rot @ Vector((0, 1, 0)); right = rot @ Vector((1, 0, 0))
    if persp:
        cd.type = 'PERSP'; cd.lens = lens
        cam.location = Vector(target) - fwd * 6
        return cam
    cd.type = 'ORTHO'; cd.ortho_scale = ortho_scale or (max(w, h) / P)
    # 让 target 投影到 anchor 像素位置
    px_per_unit = max(w, h) / cd.ortho_scale
    dx = (anchor[0] - 0.5) * w / px_per_unit; dy = (0.5 - anchor[1]) * h / px_per_unit
    cam.location = Vector(target) - fwd * 40 - right * dx - up * dy
    cd.clip_start = 0.1; cd.clip_end = 200
    return cam

def project(cam, p):
    """世界坐标 → 像素（左上为原点）"""
    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene
    v = world_to_camera_view(sc, cam, Vector(p))
    return (v.x * sc.render.resolution_x, (1 - v.y) * sc.render.resolution_y)

# ---------------- 材质 ----------------
_mats = {}
def mat(name, col, rough=0.55, metal=0.0, emit=0.0, sss=0.0, spec=0.35, alpha=1.0, emit_col=None, sheen=0.0):
    key = name
    if key in _mats: return _mats[key]
    m = bpy.data.materials.new(name); m.use_nodes = True
    if os.environ.get('WBX_CEL') == '1' and emit < 1.5:
        _cel(m, col if len(col) == 4 else (*col, 1), rough, metal, emit, alpha, emit_col); _mats[key] = m; return m
    b = m.node_tree.nodes['Principled BSDF']
    c = col if len(col) == 4 else (*col, 1)
    b.inputs['Base Color'].default_value = c
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    try: b.inputs['Specular IOR Level'].default_value = spec
    except Exception: pass
    if emit > 0:
        b.inputs['Emission Color'].default_value = (emit_col or c[:3]) + (1,) if len(emit_col or c[:3]) == 3 else (emit_col or c)
        b.inputs['Emission Strength'].default_value = emit
    if sss > 0:
        b.inputs['Subsurface Weight'].default_value = sss; b.inputs['Subsurface Radius'].default_value = (0.3, 0.12, 0.08)
        b.inputs['Subsurface Scale'].default_value = 0.05
    if sheen > 0:
        try: b.inputs['Sheen Weight'].default_value = sheen
        except Exception: pass
    if alpha < 1: b.inputs['Alpha'].default_value = alpha
    _mats[key] = m
    return m

def _cel(m, c, rough, metal, emit, alpha, emit_col):
    """v2.3 实验：自研赛璐璐着色（Cycles Toon BSDF 两阶明暗 + 冷色阴影环境 + 菲涅尔轮廓光 + 硬高光）。
    只借鉴思路，未使用任何第三方着色器代码。WBX_CEL=1 启用。"""
    nt = m.node_tree; nt.nodes.clear(); N = nt.nodes.new; L = nt.links.new
    out = N('ShaderNodeOutputMaterial')
    td = N('ShaderNodeBsdfToon'); td.component = 'DIFFUSE'; td.inputs['Color'].default_value = c; td.inputs['Size'].default_value = 0.62; td.inputs['Smooth'].default_value = 0.03
    # 阴影面不发黑：叠加一层偏冷的“环境底色”（=颜色×0.42，向蓝紫偏移）
    amb = N('ShaderNodeEmission'); amb.inputs['Color'].default_value = (c[0] * 0.36, c[1] * 0.36, c[2] * 0.46 + 0.012, 1); amb.inputs['Strength'].default_value = 1.0
    add1 = N('ShaderNodeAddShader'); L(td.outputs[0], add1.inputs[0]); L(amb.outputs[0], add1.inputs[1])
    # 轮廓光：Layer Weight Facing → 常量阶梯 → 暖白发光
    lw = N('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.35
    cr = N('ShaderNodeValToRGB'); cr.color_ramp.interpolation = 'CONSTANT'; cr.color_ramp.elements[0].color = (0, 0, 0, 1); cr.color_ramp.elements[1].position = 0.72; cr.color_ramp.elements[1].color = (1, 1, 1, 1)
    L(lw.outputs['Facing'], cr.inputs[0])
    rim = N('ShaderNodeEmission'); rim.inputs['Color'].default_value = (min(1, c[0] * 0.5 + 0.5), min(1, c[1] * 0.5 + 0.48), min(1, c[2] * 0.5 + 0.42), 1)
    rs = N('ShaderNodeMath'); rs.operation = 'MULTIPLY'; rs.inputs[1].default_value = 0.55; L(cr.outputs['Color'], rs.inputs[0]); L(rs.outputs[0], rim.inputs['Strength'])
    add2 = N('ShaderNodeAddShader'); L(add1.outputs[0], add2.inputs[0]); L(rim.outputs[0], add2.inputs[1]); last = add2
    if rough < 0.45 or metal > 0.2:  # 硬边高光（头发、金属、漆面）
        tg = N('ShaderNodeBsdfToon'); tg.component = 'GLOSSY'; tg.inputs['Color'].default_value = (1, 0.98, 0.92, 1) if metal < 0.2 else c
        tg.inputs['Size'].default_value = 0.18; tg.inputs['Smooth'].default_value = 0.02
        mx = N('ShaderNodeMixShader'); mx.inputs[0].default_value = 0.35 if metal < 0.2 else 0.6; L(last.outputs[0], mx.inputs[1]); L(tg.outputs[0], mx.inputs[2]); last = mx
    if emit > 0:
        em = N('ShaderNodeEmission'); ec = emit_col or c[:3]; em.inputs['Color'].default_value = (*ec[:3], 1); em.inputs['Strength'].default_value = emit
        a3 = N('ShaderNodeAddShader'); L(last.outputs[0], a3.inputs[0]); L(em.outputs[0], a3.inputs[1]); last = a3
    if alpha < 1:
        tr = N('ShaderNodeBsdfTransparent'); mx = N('ShaderNodeMixShader'); mx.inputs[0].default_value = alpha; L(tr.outputs[0], mx.inputs[1]); L(last.outputs[0], mx.inputs[2]); last = mx
    L(last.outputs[0], out.inputs[0])

def hexc(h, a=1.0):
    h = h.lstrip('#')
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (f(r), f(g), f(b), a)

def M(h, **kw):
    return mat('m_' + h + '_' + '_'.join(f'{k}{v}' for k, v in sorted(kw.items())), hexc(h), **kw)

def outline_mat():
    if 'outline' in _mats: return _mats['outline']
    m = bpy.data.materials.new('outline'); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); mix = nt.nodes.new('ShaderNodeMixShader')
    geo = nt.nodes.new('ShaderNodeNewGeometry'); em = nt.nodes.new('ShaderNodeEmission'); tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    em.inputs[0].default_value = (0.06, 0.035, 0.03, 1); em.inputs[1].default_value = 1.0
    lp = nt.nodes.new('ShaderNodeLightPath'); inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0
    mx = nt.nodes.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'
    nt.links.new(lp.outputs['Is Camera Ray'], inv.inputs[1]); nt.links.new(geo.outputs['Backfacing'], mx.inputs[0]); nt.links.new(inv.outputs[0], mx.inputs[1])
    nt.links.new(mx.outputs[0], mix.inputs[0]); nt.links.new(em.outputs[0], mix.inputs[1]); nt.links.new(tr.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])
    _mats['outline'] = m; return m

# ---------------- 几何 ----------------
def _link(o, parent=None):
    bpy.context.scene.collection.objects.link(o)
    if parent: o.parent = parent
    return o

def empty(name, loc=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(name, None); o.location = loc; return _link(o, parent)

def finish(o, m, smooth=True, outline=0.0, sub=0):
    if m: o.data.materials.append(m)
    if smooth:
        for p in o.data.polygons: p.use_smooth = True
    if sub:
        md = o.modifiers.new('sub', 'SUBSURF'); md.levels = sub; md.render_levels = sub
    if outline > 0:
        o.data.materials.append(outline_mat())
        md = o.modifiers.new('ol', 'SOLIDIFY'); md.thickness = outline; md.offset = 1; md.use_flip_normals = True
        md.material_offset = len(o.data.materials) - 1; md.use_rim = False
    return o

def mesh_from_bm(name, bm):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); return bpy.data.objects.new(name, me)

def sphere(name, r=1, loc=(0, 0, 0), scale=(1, 1, 1), m=None, parent=None, seg=24, rings=14, outline=0.0, rot=(0, 0, 0)):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    o = mesh_from_bm(name, bm); o.location = loc; o.scale = scale; o.rotation_euler = rot; _link(o, parent)
    return finish(o, m, outline=outline)

def cyl(name, r1=1, r2=1, h=1, loc=(0, 0, 0), m=None, parent=None, seg=24, rot=(0, 0, 0), scale=(1, 1, 1), outline=0.0, smooth=True, cap=True):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=seg, radius1=r1, radius2=r2, depth=h)
    o = mesh_from_bm(name, bm); o.location = loc; o.rotation_euler = rot; o.scale = scale; _link(o, parent)
    o = finish(o, m, smooth=smooth, outline=outline)
    if smooth:
        md = o.modifiers.new('bev', 'BEVEL'); md.width = min(r1, r2, h) * 0.15 + 0.005; md.segments = 2; md.limit_method = 'ANGLE'
        o.modifiers.move(len(o.modifiers) - 1, 0)
    return o

def box(name, size=(1, 1, 1), loc=(0, 0, 0), m=None, parent=None, rot=(0, 0, 0), bevel=0.03, outline=0.0):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    o = mesh_from_bm(name, bm); o.location = loc; o.rotation_euler = rot; o.scale = size; _link(o, parent)
    finish(o, m, smooth=False, outline=outline)
    if bevel > 0:
        md = o.modifiers.new('bev', 'BEVEL'); md.width = bevel; md.segments = 2; o.modifiers.move(len(o.modifiers) - 1, 0)
        for p in o.data.polygons: p.use_smooth = True
        try: o.data.set_sharp_from_angle(angle=D(40))
        except Exception: pass
    return o

def torus(name, R=1, r=0.2, loc=(0, 0, 0), m=None, parent=None, rot=(0, 0, 0), scale=(1, 1, 1), seg=32, mseg=12, arc=1.0, outline=0.0):
    bm = bmesh.new()
    verts = []
    n = seg
    for i in range(n + (0 if arc >= 1 else 1)):
        a = 2 * math.pi * arc * i / n
        ring = []
        for j in range(mseg):
            b = 2 * math.pi * j / mseg
            x = (R + r * math.cos(b)) * math.cos(a); y = (R + r * math.cos(b)) * math.sin(a); z = r * math.sin(b)
            ring.append(bm.verts.new((x, y, z)))
        verts.append(ring)
    rows = len(verts)
    for i in range(rows if arc >= 1 else rows - 1):
        a, b2 = verts[i], verts[(i + 1) % rows]
        for j in range(mseg):
            bm.faces.new((a[j], a[(j + 1) % mseg], b2[(j + 1) % mseg], b2[j]))
    o = mesh_from_bm(name, bm); o.location = loc; o.rotation_euler = rot; o.scale = scale; _link(o, parent)
    return finish(o, m, outline=outline)

def lathe(name, prof, loc=(0, 0, 0), m=None, parent=None, seg=32, rot=(0, 0, 0), scale=(1, 1, 1), outline=0.0, close_top=True):
    """prof: [(r,z),...] 自下而上的轮廓，绕Z旋转"""
    bm = bmesh.new(); rings = []
    for r, z in prof:
        ring = [bm.verts.new((r * math.cos(2 * math.pi * k / seg), r * math.sin(2 * math.pi * k / seg), z)) for k in range(seg)]
        rings.append(ring)
    for a, b2 in zip(rings, rings[1:]):
        for k in range(seg): bm.faces.new((a[k], a[(k + 1) % seg], b2[(k + 1) % seg], b2[k]))
    if prof[0][0] > 1e-4: bm.faces.new(list(reversed(rings[0])))
    if close_top and prof[-1][0] > 1e-4: bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = mesh_from_bm(name, bm); o.location = loc; o.rotation_euler = rot; o.scale = scale; _link(o, parent)
    return finish(o, m, outline=outline)

def extrude_poly(name, pts, h, loc=(0, 0, 0), m=None, parent=None, rot=(0, 0, 0), bevel=0.01):
    bm = bmesh.new(); vs = [bm.verts.new((x, y, 0)) for x, y in pts]; f = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[f]); top = [e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=top, vec=(0, 0, h)); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = mesh_from_bm(name, bm); o.location = loc; o.rotation_euler = rot; _link(o, parent); finish(o, m, smooth=False)
    if bevel:
        md = o.modifiers.new('bev', 'BEVEL'); md.width = bevel; md.segments = 1
    return o

def tube(name, pts, radius=0.05, m=None, parent=None, taper=None, seg=10, outline=0.0):
    """沿折线生成管子（头发丝、飘带、尾巴）"""
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = radius; cu.bevel_resolution = 3; cu.resolution_u = seg
    sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        bp = sp.bezier_points[i]; bp.co = p; bp.handle_left_type = bp.handle_right_type = 'AUTO'
        if taper: bp.radius = taper[i]
    cu.use_fill_caps = True
    o = bpy.data.objects.new(name, cu); _link(o, parent)
    if m: o.data.materials.append(m)
    return o

def shadow_catcher(size=6):
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=size)
    o = mesh_from_bm('catcher', bm); _link(o); o.is_shadow_catcher = True
    return o

def render(path):
    sc = bpy.context.scene; sc.render.filepath = path
    bpy.ops.render.render(write_still=True)

def set_vis(o, cam=True, shadow=True):
    o.visible_camera = cam; o.visible_shadow = shadow
    for c in o.children: set_vis(c, cam, shadow)

def args():
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    out = {}
    k = None
    for x in a:
        if x.startswith('--'): k = x[2:]; out[k] = True
        elif k: out[k] = x; k = None
    return out

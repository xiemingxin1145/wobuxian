"""3D 立绘头像（透视特写，256x256）"""
import sys, os, math, time; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
import chars, monsters
from specs import SPRITES
from mathutils import Vector
a = args(); ids = a['ids'].split(',') if 'ids' in a else list(SPRITES)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'portraits'); os.makedirs(out, exist_ok=True)
S0 = 256
def bbox(objs):
    lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    for o in objs:
        if o.type != 'MESH' or not o.visible_camera: continue
        for c in o.bound_box:
            p = o.matrix_world @ Vector(c); lo = Vector(map(min, lo, p)); hi = Vector(map(max, hi, p))
    return lo, hi
for sid in ids:
    S = SPRITES[sid]; t0 = time.time()
    reset(); lights()
    sc = 1.2 * S.get('scale', 1.0)
    if S['kind'] == 'chibi': R = chars.chibi(S['spec'], scale=sc); posef = chars.pose
    else: R = monsters.setup(S['mon'], scale=sc); posef = monsters.mpose
    R.root.rotation_euler = (0, 0, 0.32); posef(R, 'idle', 1, S['anims']['idle'])
    bpy.context.view_layer.update()
    lo, hi = bbox(list(bpy.data.objects)); hgt = hi.z - lo.z
    frac = 0.62 if S['kind'] == 'chibi' else (0.8 if not S.get('big') else 0.9)
    zc = hi.z - frac * hgt / 2 - 0.02; reg = frac * hgt
    reg = max(reg, min(hi.x - lo.x, hi.y - lo.y + 0.3) * (0.9 if S['kind'] != 'chibi' else 0.82))
    target = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, zc))
    sc_ = bpy.context.scene; sc_.render.resolution_x = sc_.render.resolution_y = S0
    cd = bpy.data.cameras.new('pc'); cam = bpy.data.objects.new('pc', cd); sc_.collection.objects.link(cam); sc_.camera = cam
    cd.lens = 60; fov = 2 * math.atan(18 / 60); dist = (reg / 2 * 1.12) / math.tan(fov / 2)
    dv = Vector((0.42, -1, 0.22)).normalized(); cam.location = target + dv * dist
    cam.rotation_euler = (-dv).to_track_quat('-Z', 'Y').to_euler()
    sc_.cycles.samples = 48
    render(os.path.join(out, sid + '.png'))
    print('DONE', sid, round(time.time() - t0, 1), flush=True)

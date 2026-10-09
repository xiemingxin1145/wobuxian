"""用法: blender -b -P render_sprites.py -- --ids a,b,c [--preview 1] [--out DIR]"""
import sys, os, math, time; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
import chars, monsters
from specs import SPRITES, DIRS5, DIRV
a = args(); ids = a['ids'].split(','); out = a.get('out', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'frames'))
preview = a.get('preview')
for sid in ids:
    S = SPRITES[sid]; t0 = time.time()
    reset(); lights()
    big = S.get('big'); sc = 1.2 * S.get('scale', 1.0)
    if S['kind'] == 'chibi':
        R = chars.chibi(S['spec'], scale=sc); posef = chars.pose
    else:
        R = monsters.setup(S['mon'], scale=sc); posef = monsters.mpose
    w, h = (320, 352) if big else (160, 176)
    k = float(os.environ.get('WBX_RES', 1))
    camera(int(w * k), int(h * k), anchor=(0.5, 0.9 if big else 0.86), ortho_scale=h / P)
    d = os.path.join(out, sid); os.makedirs(d, exist_ok=True)
    dirs = S.get('dirs', DIRS5)
    jobs = [('idle', 'S' if 'S' in dirs else dirs[0], 0)] if preview else [(an, dn, f) for dn in dirs for an, n in S['anims'].items() for f in range(n)]
    for an, dn, f in jobs:
        vx, vy = DIRV[dn]; R.root.rotation_euler = (0, 0, math.atan2(vy, vx) + math.pi / 2)
        posef(R, an, f, S['anims'][an])
        render(os.path.join(d, f'{an}_{dn}_{f}.png'))
    print('DONE', sid, len(jobs), 'frames', round(time.time() - t0, 1), 's', flush=True)

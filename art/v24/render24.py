"""v24 角色帧渲染：blender -b -P art/v24/render24.py -- --ids npc_mentor,player_m1 [--preview 1] [--out art/out/frames2]
普通角色 192x224 帧（锚点 0.86），BOSS(big) 320x352（锚点 0.9）；WBX_RES=2 → frames2（打包时 SD 缩 0.5）"""
import sys, os, math, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chars24 as C24
from chars24 import *
from specs import SPRITES, DIRS5
a = args(); ids = a['ids'].split(','); out = a.get('out', os.path.join(C24.ART, 'out', 'frames2')); preview = a.get('preview')
os.environ.setdefault('WBX_RES', '2')
for sid in ids:
    S = SPRITES[sid]; t0 = time.time(); big = S.get('big')
    B1.GLOBAL = 1.25 * (S.get('scale', 1.0) * 0.9 if big else 1.0)
    C = C24.build(sid, S['spec'])
    k = float(os.environ.get('WBX_RES', 2)); w, h = (320, 352) if big else (192, 224)
    camera(int(w * k), int(h * k), anchor=(0.5, 0.9 if big else 0.86), ortho_scale=h / P)
    d = os.path.join(out, sid); os.makedirs(d, exist_ok=True)
    for old in os.listdir(d): os.remove(os.path.join(d, old))
    dirs = S.get('dirs', DIRS5)
    jobs = [tuple(int(x) if x.isdigit() else x for x in j.split('_')) for j in a['frames'].split(',')] if a.get('frames') else [('idle', 'S' if 'S' in dirs else dirs[0], 0)] if preview else [(an, dn, f) for dn in dirs for an, n in S['anims'].items() for f in range(n)]
    for an, dn, f in jobs:
        C24.frame(C, an, dn, f, S['anims'][an], os.path.join(d, f'{an}_{dn}_{f}.png'))
    print('DONE', sid, len(jobs), 'frames', round(time.time() - t0, 1), 's', flush=True)

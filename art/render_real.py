"""写实男主验证帧渲染驱动
用法:
  blender -b -P render_real.py -- [--preview 1]
产出: art/out/frames_real/player_m0/idle_S_0.png + attack_S_2.png
"""
import sys, os, math, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
import chars_real
from chars import pose

a = args()
sid = 'player_m0'
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'frames_real', sid)
os.makedirs(out, exist_ok=True)

reset()
lights()
R = chars_real.real_male(scale=1.0)

w, h = 288, 384
k = float(os.environ.get('WBX_RES', 1))
camera(int(w * k), int(h * k), anchor=(0.5, 0.5), target=(0, 0, 0.20), ortho_scale=2.5)

# 正面 S 方向
ang = math.atan2(-1, 1) + math.pi / 2

# idle 帧 0
R.root.rotation_euler = (0, 0, ang)
pose(R, 'idle', 0, 4)
render(os.path.join(out, 'idle_S_0.png'))
print('rendered idle', flush=True)

# attack 中帧 (第2帧 = 挥击中途)
R.root.rotation_euler = (0, 0, ang)
pose(R, 'attack', 2, 5)
render(os.path.join(out, 'attack_S_2.png'))
print('rendered attack', flush=True)
print('OUT', out, flush=True)

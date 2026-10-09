import sys, os; sys.path.insert(0, os.path.dirname(__file__))
from lib import *
import chars
reset(); lights()
spec = dict(robe='#5fb3a0', robe2='#fff6e8', trim='#ffd25e', belt='#e8a030', hair='#2a1b14', ribbon='#e84a5f', hairstyle='bun', weapon='sword')
R = chars.chibi(spec)
ang = float(os.environ.get('ANG', 45))
R.root.rotation_euler = (0, 0, D(ang))
chars.pose(R, os.environ.get('ANIM', 'idle'), int(os.environ.get('F', 0)), 4)
cam = camera(288, 320, anchor=(0.5, 0.85), ortho_scale=320 / (P * 2))
render('/workspace/game/art/out/test/char_%s.png' % os.environ.get('TAG', 'a'))

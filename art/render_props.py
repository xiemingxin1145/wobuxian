"""渲染所有道具精灵（固定等角视角），输出 PNG + 锚点 json"""
import sys, os, json, time; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
import props
a = args(); ids = a['ids'].split(',') if 'ids' in a else list(props.PROPS)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'props'); os.makedirs(out, exist_ok=True)
meta = {}
for pid in ids:
    fn, fw, fh = props.PROPS[pid]; t0 = time.time()
    reset(); lights()
    fn()
    # 预估画布
    W = int((fw + fh) * 48 + 140); H = int((fw + fh) * 24 + 4.2 * 68 + 60)
    camera(W, H, anchor=(0.5, 1 - ((fw + fh) * 12 + 40) / H), ortho_scale=max(W, H) / P)
    render(os.path.join(out, pid + '.png'))
    meta[pid] = dict(w=W, h=H, ax=W / 2, ay=H - ((fw + fh) * 12 + 40), fw=fw, fh=fh)
    print('DONE', pid, round(time.time() - t0, 1), flush=True)
mp = os.path.join(out, 'meta_%s.json' % a.get('tag', 'all'))
json.dump(meta, open(mp, 'w'))

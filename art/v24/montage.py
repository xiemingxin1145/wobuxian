"""python3 art/v24/montage.py out.png dir1/file.png ... — 把帧拼成一行（2x 背景格）"""
import sys
from PIL import Image
fs = sys.argv[2:]; ims = [Image.open(f).convert('RGBA') for f in fs]
s = int(sys.argv[1].split('@')[1]) if '@' in sys.argv[1] else 2
W = max(i.width for i in ims); H = max(i.height for i in ims)
c = Image.new('RGBA', (W * len(ims), H), (120, 150, 110, 255))
for k, im in enumerate(ims): c.alpha_composite(im, (k * W, 0))
c = c.resize((c.width * s, c.height * s), Image.NEAREST); c.save(sys.argv[1].split('@')[0])

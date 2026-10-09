import os, sys, glob
from PIL import Image, ImageDraw, ImageFont
src = sys.argv[1]; dst = sys.argv[2]
ims = []
for d in sorted(os.listdir(src)):
    f = sorted(glob.glob(os.path.join(src, d, '*.png')))
    if f: ims.append((d, Image.open(f[0])))
cw, ch = 170, 200; cols = 8; rows = (len(ims) + cols - 1) // cols
W = Image.new('RGBA', (cw * cols, ch * rows), (196, 214, 180, 255)); dr = ImageDraw.Draw(W)
for i, (n, im) in enumerate(ims):
    im = im.copy(); im.thumbnail((cw, ch - 16))
    x, y = (i % cols) * cw, (i // cols) * ch; W.alpha_composite(im, (x + (cw - im.width) // 2, y)); dr.text((x + 4, y + ch - 14), n, fill=(0, 0, 0, 255))
W.save(dst)

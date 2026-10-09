#!/usr/bin/env python3
"""霞鹜文楷（LXGW WenKai, SIL OFL 1.1）子集化：GB2312 全部汉字 + 游戏文本用字 → woff2。
用法: python3 tools/make_font.py LXGWWenKai-Medium.ttf"""
import sys, glob, os
from fontTools import subset
src = sys.argv[1]; root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
chars = set(chr(c) for c in range(0x20, 0x7f))
for hi in range(0xb0, 0xf8):
    for lo in range(0xa1, 0xff):
        try: chars.add(bytes([hi, lo]).decode('gb2312'))
        except Exception: pass
for hi in range(0xa1, 0xaa):
    for lo in range(0xa1, 0xff):
        try: chars.add(bytes([hi, lo]).decode('gb2312'))
        except Exception: pass
for f in glob.glob(os.path.join(root, 'www', 'js', '*.js')) + [os.path.join(root, 'www', 'index.html')]:
    chars |= set(open(f, encoding='utf-8').read())
chars |= set('「」『』《》【】、。，！？：；“”‘’…—·～✦★☆♥')
out = os.path.join(root, 'www', 'assets', 'fonts', 'wenkai.woff2')
opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['*']; opts.name_IDs = ['*']; opts.notdef_outline = True
f = subset.load_font(src, opts); s = subset.Subsetter(opts); s.populate(text=''.join(chars)); s.subset(f); subset.save_font(f, out, opts)
print(out, os.path.getsize(out), len(chars))

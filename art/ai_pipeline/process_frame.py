"""AI 精绘精灵链：rembg 抠图 + 对齐到统一整帧。

输入：art/ai_pipeline/raw/player_m0/<frame_name>.png  （AI 直出，白底/杂背景均可）
输出：art/out/frames2/player_m0/<frame_name>.png       （384×448 透明整帧，k=2 HD 源）

对齐约定（与引擎 drawSprite 对齐）：
- 整帧 384×448（HD，k=2）；build_assets 缩 0.5 → SD 192×224。
- 世界锚点 (ax, ay) = (fw/2, fh*0.86) = (192, 385.3)。
- 旧 player_m0 SD 帧脚底 bbox 底边在 y≈196 → HD y≈392。本脚本统一把脚底基线钉在 y=FOOT_BASE。
- 角色净身高（trim 后 bbox 高）统一为 TARGET_H，水平居中于 x=192。
"""
import os, sys, argparse
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(ROOT, '..', '..'))
RAW_DIR = os.path.join(ROOT, 'raw', 'player_m0')
TRIM_DIR = os.path.join(ROOT, 'trimmed', 'player_m0')
OUT_DIR = os.path.join(REPO, 'art', 'out', 'frames2', 'player_m0')

# 整帧尺寸（HD k=2）
FW, FH = 384, 448
# 脚底基线（bbox 底边 y）：参照旧 SD 196 * 2 = 392
FOOT_BASE = 392
# 角色净身高目标（bbox 高）：旧 SD idle_S_0 bbox 高 163 → HD 326。取 330 让写实角色略高一点。
TARGET_H = 330

_sess = None
def sess():
    global _sess
    if _sess is None:
        from rembg import new_session
        _sess = new_session('isnet-general-use')
    return _sess

def remove_bg(img: Image.Image) -> Image.Image:
    from rembg import remove
    return remove(img.convert('RGBA'), session=sess())

def trim_alpha(img: Image.Image, thresh=8) -> Image.Image:
    a = img.getchannel('A').point(lambda v: 255 if v > thresh else 0)
    bb = a.getbbox()
    if not bb:
        return img
    return img.crop(bb)

def align(img: Image.Image) -> Image.Image:
    """img: RGBA trimmed。缩放到 TARGET_H，水平居中，脚底贴 FOOT_BASE，贴到 FW×FH 透明画布。"""
    w, h = img.size
    scale = TARGET_H / h
    nw = max(1, round(w * scale))
    nh = TARGET_H
    img2 = img.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    # 水平居中
    x = (FW - nw) // 2
    # 脚底在 FOOT_BASE：bbox 底边 = y + nh
    y = FOOT_BASE - nh
    canvas.alpha_composite(img2, (x, y))
    return canvas

def process_one(raw_path: str, out_name: str = None):
    """raw_path: AI 直出图。out_name: 不含扩展名，如 idle_S_0。"""
    if out_name is None:
        out_name = os.path.splitext(os.path.basename(raw_path))[0]
    raw = Image.open(raw_path)
    cut = remove_bg(raw)
    cut_t = trim_alpha(cut)
    os.makedirs(TRIM_DIR, exist_ok=True)
    cut_t.save(os.path.join(TRIM_DIR, out_name + '.png'))
    framed = align(cut_t)
    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, out_name + '.png')
    framed.save(out)
    print(f'[ok] {out_name}: raw={raw.size} trim={cut_t.size} -> {framed.size}')
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--all', action='store_true', help='批处理 raw/player_m0/ 下所有 png')
    ap.add_argument('--file', help='单个 raw 文件路径')
    ap.add_argument('--name', help='输出帧名（如 idle_S_0）')
    args = ap.parse_args()
    if args.file:
        process_one(args.file, args.name)
    elif args.all:
        for f in sorted(os.listdir(RAW_DIR)):
            if f.lower().endswith('.png'):
                process_one(os.path.join(RAW_DIR, f))
    else:
        ap.print_help()

if __name__ == '__main__':
    main()

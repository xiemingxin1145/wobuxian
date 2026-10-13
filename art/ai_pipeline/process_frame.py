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

# 整帧尺寸（HD k=2）
FW, FH = 384, 448
# 脚底基线（bbox 底边 y）：参照旧 SD 196 * 2 = 392
FOOT_BASE = 392
# 角色净身高目标（bbox 高）：男 330 / 女 320（女略矮半头，视觉配对统一）
TARGET_H_DEFAULT = 330

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

def align(img: Image.Image, target_h: int = TARGET_H_DEFAULT, foot_base: int = 392) -> Image.Image:
    """img: RGBA trimmed。缩放到 target_h，水平居中，脚底贴 foot_base，贴到 FW×FH 透明画布。"""
    w, h = img.size
    scale = target_h / h
    nw = max(1, round(w * scale))
    nh = target_h
    img2 = img.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    # 水平居中
    x = (FW - nw) // 2
    # 脚底在 foot_base：bbox 底边 = y + nh
    y = foot_base - nh
    canvas.alpha_composite(img2, (x, y))
    return canvas

def process_one(raw_path: str, sid: str, out_name: str = None, target_h: int = TARGET_H_DEFAULT, foot_base: int = 392):
    """raw_path: AI 直出图。sid: 精灵 id (如 player_m0 / player_f0)。out_name: 不含扩展名，如 idle_S_0。"""
    if out_name is None:
        out_name = os.path.splitext(os.path.basename(raw_path))[0]
    raw_dir = os.path.join(ROOT, 'raw', sid)
    trim_dir = os.path.join(ROOT, 'trimmed', sid)
    out_dir = os.path.join(REPO, 'art', 'out', 'frames2', sid)
    raw = Image.open(raw_path)
    cut = remove_bg(raw)
    cut_t = trim_alpha(cut)
    os.makedirs(trim_dir, exist_ok=True)
    cut_t.save(os.path.join(trim_dir, out_name + '.png'))
    framed = align(cut_t, target_h=target_h, foot_base=foot_base)
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, out_name + '.png')
    framed.save(out)
    print(f'[ok] {sid}/{out_name}: raw={raw.size} trim={cut_t.size} -> {framed.size}')
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sid', default='player_m0', help='精灵 id，默认 player_m0')
    ap.add_argument('--target-h', type=int, default=TARGET_H_DEFAULT, help='角色净身高 HD 像素')
    ap.add_argument('--foot-base', type=int, default=392, help='脚底基线 HD y 像素')
    ap.add_argument('--all', action='store_true', help='批处理 raw/<sid>/ 下所有 png')
    ap.add_argument('--file', help='单个 raw 文件路径')
    ap.add_argument('--name', help='输出帧名（如 idle_S_0）')
    args = ap.parse_args()
    raw_dir = os.path.join(ROOT, 'raw', args.sid)
    if args.file:
        process_one(args.file, args.sid, args.name, target_h=args.target_h, foot_base=args.foot_base)
    elif args.all:
        for f in sorted(os.listdir(raw_dir)):
            if f.lower().endswith('.png'):
                process_one(os.path.join(raw_dir, f), args.sid, target_h=args.target_h, foot_base=args.foot_base)
    else:
        ap.print_help()

if __name__ == '__main__':
    main()

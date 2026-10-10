"""Compose viewable previews from Blender renders; never modifies game assets.

Outputs committed previews under this folder. The scale board uses a real repo
human-test screenshot only as a labelled background mockup, not as a claim that
the new models are integrated or device-tested.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
FRAMES = ROOT / "art" / "out" / "openworld_v25" / "frames"
PREVIEWS = HERE / "previews"
PREVIEWS.mkdir(parents=True, exist_ok=True)
SCREENSHOT = ROOT / "test" / "human_olaf" / "003_T3_near_npc.png"


def font(size, bold=False):
    candidates = [
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc" if bold else "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJKsc-Bold.otf" if bold else "/usr/share/fonts/opentype/noto/NotoSansCJKsc-Regular.otf",
        "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()


def frame(name):
    path = FRAMES / (name + ".png")
    if not path.exists():
        raise FileNotFoundError(f"Missing Blender render: {path}")
    im = Image.open(path).convert("RGBA")
    if im.size != (320, 352):
        raise ValueError(f"{path} must be 320x352, found {im.size}")
    return im


def rounded(draw, box, radius=18, fill="#fffdf8", outline="#ddd0b8", width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


# ---------- A/B board: identical 160x176 frame, camera, anchor, and lighting ----------
W, H = 1560, 900
board = Image.new("RGB", (W, H), "#efe6d5")
d = ImageDraw.Draw(board)
d.text((40, 26), "《我不仙》v2.5 · LOW-POLY CHARACTER A/B", fill="#34281e", font=font(32, True))
d.text((42, 70), "同一正交镜头 / 灯光 / 160×176 sprite frame；上排现有造型，下排独立低模样例", fill="#6a5948", font=font(20))
roles = [
    ("male", "主角男", "player_m0"),
    ("female", "主角女", "player_f0"),
    ("swordsman", "剑仙", "npc_mentor"),
]
left, top, col_w, row_h, gap = 32, 120, 492, 355, 18
row_labels = [("现有主线精灵", "CURRENT"), ("新建低模样例", "LOW-POLY")]
for row, (zh, en) in enumerate(row_labels):
    yy = top + row * (row_h + 18)
    d.text((left + 4, yy + 5), zh, fill="#4a3827", font=font(21, True))
    d.text((left + 160, yy + 7), en, fill="#9a7854", font=font(15, True))
    for col, (kind, title, sid) in enumerate(roles):
        x = left + col * (col_w + gap)
        cy = yy + 34
        rounded(d, (x, cy, x + col_w, cy + row_h - 44), 16)
        d.text((x + 18, cy + 14), f"{title}  ·  {sid}", fill="#382c21", font=font(20, True))
        image_name = (kind + "_current_idle") if row == 0 else (kind + "_lowpoly_idle")
        im = frame(image_name).resize((240, 264), Image.Resampling.LANCZOS)
        px = x + (col_w - 240) // 2
        py = cy + 46
        shadow = Image.new("RGBA", (240, 264), (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow)
        sd.ellipse((62, 239, 178, 255), fill=(40, 30, 20, 38))
        board.paste(shadow, (px, py), shadow)
        board.paste(im, (px, py), im)
        # Body bounding silhouette for visual comparison; never normalise model size.
        bbox = im.getbbox()
        if bbox:
            d.rectangle((px + bbox[0], py + bbox[1], px + bbox[2], py + bbox[3]),
                        outline="#7f9e9c", width=1)
        caption = "Blender 4.2 · 同视角 · 不缩放单个角色"
        d.text((x + 18, cy + row_h - 66), caption, fill="#766554", font=font(14))
d.text((36, H - 36), "仅为离线美术样例；未接入游戏。5 人剪影辨认：未执行（无真实参与者数据，不伪造结果）。", fill="#6a5948", font=font(16))
board.save(PREVIEWS / "openworld_v25_ab_compare.png", optimize=True)


# ---------- Frozen pose board: pose stills, not an animation or playable feature ----------
PW, PH = 1540, 1120
pose_board = Image.new("RGB", (PW, PH), "#efe6d5")
pd = ImageDraw.Draw(pose_board)
pd.text((38, 24), "低模姿态预览 · 冻结姿势，不是动画", fill="#34281e", font=font(30, True))
pd.text((40, 67), "Idle / Walk / Attack 由 Blender 几何姿势生成；尚未导出游戏精灵，也未做运行时验证", fill="#6a5948", font=font(18))
pose_roles = [("male", "主角男"), ("female", "主角女"), ("swordsman", "剑仙")]
pose_names = [("idle", "待机"), ("walk", "行走姿势"), ("attack", "攻击姿势")]
start_y, row_h, col_w = 110, 322, 486
for ri, (kind, role) in enumerate(pose_roles):
    yy = start_y + ri * row_h
    pd.text((42, yy + 3), role, fill="#4a3827", font=font(21, True))
    for ci, (pose, pose_zh) in enumerate(pose_names):
        x = 34 + ci * (col_w + 18)
        cy = yy + 34
        rounded(pd, (x, cy, x + col_w, cy + row_h - 35), 16)
        pd.text((x + 16, cy + 12), pose_zh, fill="#382c21", font=font(19, True))
        im = frame(f"{kind}_lowpoly_{pose}").resize((210, 231), Image.Resampling.LANCZOS)
        px, py = x + (col_w - 210) // 2, cy + 42
        pose_board.paste(im, (px, py), im)
        pd.text((x + 16, cy + row_h - 62), f"{kind} · {pose}", fill="#766554", font=font(14))
pose_board.save(PREVIEWS / "openworld_v25_pose_sheet.png", optimize=True)


# ---------- Real game-screen scale reference + explicitly labelled static overlay ----------
if not SCREENSHOT.exists():
    raise FileNotFoundError(f"Reference screenshot not found: {SCREENSHOT}")
screen = Image.open(SCREENSHOT).convert("RGBA")
if screen.size != (824, 1830):
    raise ValueError(f"Reference screenshot dimensions changed: {screen.size}")
# Captured at 412 CSS px width, DPR=2. Engine: R.Z = width*DPR/860.
viewport_css_w, dpr = 412, 2
z_scale = viewport_css_w * dpr / 860.0
# Game's drawSprite uses 160x176 frame, x-centred, feet at y=0.86*176.
frame_w, frame_h, anchor_y = 160, 176, 176 * 0.86
crop_box = (0, 390, 824, 1050)
map_crop = screen.crop(crop_box)
CW, CH = map_crop.size
header = 86
scale_board = Image.new("RGB", (CW * 2, CH + header + 54), "#efe6d5")
sb = ImageDraw.Draw(scale_board)
sb.text((28, 15), "桃花村 · sprite 实际屏幕比例核对", fill="#34281e", font=font(27, True))
sb.text((30, 52), f"截图背景取自 T3；412 CSS px / DPR 2 / R.Z={z_scale:.4f}。右侧为离线静态叠图，不是游戏运行画面。", fill="#6a5948", font=font(16))
scale_board.paste(map_crop.convert("RGB"), (0, header))
scale_board.paste(map_crop.convert("RGB"), (CW, header))
sb.text((22, header + 10), "原始真人触控测试截图（只作比例参照）", fill="#fff8e9", font=font(16), stroke_width=3, stroke_fill="#34281e")
sb.text((CW + 22, header + 10), "OFFLINE MOCKUP · 三个候选样例叠加", fill="#fff8e9", font=font(16), stroke_width=3, stroke_fill="#34281e")
# Positions are inside the same 824 px-wide captured map crop. Each frame retains
# the game's actual anchor and is scaled only by the measured engine R.Z.
centres = [(145, "male", "主角男"), (412, "female", "主角女"), (679, "swordsman", "剑仙")]
foot_y = 420
sprite_box_w = frame_w * 0.55
sprite_box_h = frame_h * 0.78
# UX.entHitRect dimensions for a labelled NPC at s=1, transformed by R.Z.
half_hit = max(sprite_box_w / 2 + 10, 32 * dpr / z_scale) * z_scale
hit_top = foot_y - (sprite_box_h + 6 + 44 + 8) * z_scale
hit_bottom = foot_y + max(20 * z_scale, 10 * dpr)
for cx, kind, title in centres:
    # Dotted cyan tap/name target guide, matching the current map hit-test math.
    bx0, bx1 = int(CW + cx - half_hit), int(CW + cx + half_hit)
    by0, by1 = int(header + hit_top), int(header + hit_bottom)
    for yy in range(by0, by1, 12):
        sb.line((bx0, yy, bx0, min(yy + 6, by1)), fill="#48d1c2", width=3)
        sb.line((bx1, yy, bx1, min(yy + 6, by1)), fill="#48d1c2", width=3)
    for xx in range(bx0, bx1, 12):
        sb.line((xx, by0, min(xx + 6, bx1), by0), fill="#48d1c2", width=3)
        sb.line((xx, by1, min(xx + 6, bx1), by1), fill="#48d1c2", width=3)
    # Circle shadow and full frame are rendered at actual engine scale, preserving feet anchor.
    frame_im = frame(kind + "_lowpoly_idle").resize((frame_w, frame_h), Image.Resampling.LANCZOS)
    drawn = frame_im.resize((round(frame_w * z_scale), round(frame_h * z_scale)), Image.Resampling.LANCZOS)
    dest_x = round(CW + cx - (frame_w / 2) * z_scale)
    dest_y = round(header + foot_y - anchor_y * z_scale)
    scale_board.paste(drawn, (dest_x, dest_y), drawn)
    pill = (CW + cx - 55, header + int(hit_top) - 25, CW + cx + 55, header + int(hit_top) - 3)
    sb.rounded_rectangle(pill, radius=8, fill="#30261e", outline="#f1d9a0", width=1)
    sb.text((pill[0] + 7, pill[1] + 2), title, fill="#fff6e7", font=font(13, True))

footer_y = header + CH + 10
sb.text((24, footer_y),
        f"Frame 160×176；脚底锚点 y=151.36；s=1；输出缩放只取 R.Z={z_scale:.4f}。青色虚线为现有 NPC 标签/点按框估算。",
        fill="#34281e", font=font(15))
scale_board.save(PREVIEWS / "openworld_v25_village_scale_mockup.png", optimize=True)

for path in sorted(PREVIEWS.glob("*.png")):
    with Image.open(path) as im:
        print(f"PREVIEW {path} {im.width}x{im.height} {path.stat().st_size} bytes")

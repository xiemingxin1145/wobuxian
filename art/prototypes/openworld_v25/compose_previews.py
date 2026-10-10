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


# ---------- Monochrome silhouette readability at small thumbnail sizes ----------
SIL_W, SIL_H = 1136, 410
sil_board = Image.new("RGB", (SIL_W, SIL_H), "#efe6d5")
sd = ImageDraw.Draw(sil_board)
sd.text((30, 20), "男女主剪影微缩对比 · 单色、无脸部/配色线索", fill="#34281e", font=font(28, True))
sd.text((32, 62), "来自 Blender idle 真渲染帧；64px / 48px 高，按透明轮廓重采样。IoU 越低，黑白剪影越不同。", fill="#6a5948", font=font(17))
sil_roles = [("male", "主角男"), ("female", "主角女"), ("swordsman", "剑仙")]


def silhouette_alpha(kind, height):
    im = frame(kind + "_lowpoly_idle")
    width = round(320 * height / 352)
    return im.getchannel("A").resize((width, height), Image.Resampling.LANCZOS)


def silhouette_iou(kind_a, kind_b, height):
    a = silhouette_alpha(kind_a, height)
    b = silhouette_alpha(kind_b, height)
    ma = [v >= 128 for v in a.tobytes()]
    mb = [v >= 128 for v in b.tobytes()]
    intersection = sum(x and y for x, y in zip(ma, mb))
    union = sum(x or y for x, y in zip(ma, mb))
    return intersection / union if union else 1.0


silhouette_metrics = {height: silhouette_iou("male", "female", height) for height in (64, 48)}
SILHOUETTE_IOU_LIMIT = 0.90
if any(value > SILHOUETTE_IOU_LIMIT for value in silhouette_metrics.values()):
    raise ValueError(f"Male/female silhouettes remain too similar: {silhouette_metrics}")
print("SILHOUETTE_CHECK_PASS "
      f"max_IoU={SILHOUETTE_IOU_LIMIT:.2f} 64px={silhouette_metrics[64]:.4f} "
      f"48px={silhouette_metrics[48]:.4f}", flush=True)
for row, height in enumerate((64, 48)):
    row_y = 112 + row * 132
    for col, (kind, role) in enumerate(sil_roles):
        x = 24 + col * 370
        rounded(sd, (x, row_y, x + 350, row_y + 120), 14)
        sd.text((x + 14, row_y + 9), f"{role} · {height}px", fill="#382c21", font=font(16, True))
        alpha = silhouette_alpha(kind, height)
        silhouette = Image.new("RGBA", alpha.size, (38, 38, 40, 255))
        silhouette.putalpha(alpha)
        px = x + (350 - alpha.width) // 2
        py = row_y + 40
        sil_board.paste(silhouette, (px, py), silhouette)
        sd.line((x + 18, row_y + 104, x + 332, row_y + 104), fill="#c9bca8", width=1)
metric_note = f"主角男/女轮廓 IoU：64px={silhouette_metrics[64]:.3f}；48px={silhouette_metrics[48]:.3f}。"
sd.text((30, SIL_H - 31), metric_note + " 黑色只表示透明度外轮廓，不读取材质、脸色或五官。", fill="#6a5948", font=font(15))
sil_board.save(PREVIEWS / "openworld_v25_silhouette_test.png", optimize=True)


# ---------- T3 screenshot with explicitly tested, offline art-placement rectangles ----------
if not SCREENSHOT.exists():
    raise FileNotFoundError(f"Reference screenshot not found: {SCREENSHOT}")
screen = Image.open(SCREENSHOT).convert("RGBA")
if screen.size != (824, 1830):
    raise ValueError(f"Reference screenshot dimensions changed: {screen.size}")
from preview_geometry import (CANDIDATES, HOTSPOTS, MOCKUP_SCALE, R_Z,
                              placement_geometry, validate_geometry)

geometry = validate_geometry()  # fail before saving an image if any rectangle collides.
print(f"RECTANGLE_COLLISION_PASS candidates={len(CANDIDATES)} hotspots={len(HOTSPOTS)} "
      f"pairwise={len(CANDIDATES) * (len(CANDIDATES) - 1) // 2} "
      f"scale={MOCKUP_SCALE:.2f}x runtime_taps=NOT_TESTED", flush=True)
crop_box = (0, 0, 824, 1100)
map_crop = screen.crop(crop_box)
CW, CH = map_crop.size
header = 86
scale_board = Image.new("RGB", (CW * 2, CH + header + 54), "#efe6d5")
sb = ImageDraw.Draw(scale_board)
sb.text((28, 15), "桃花村 T3 · 离线样例摆位 / 热点避让核验", fill="#34281e", font=font(27, True))
sb.text((30, 52), f"右侧来自 Blender 帧缩至 {MOCKUP_SCALE:.2f}×；橙框=15 个保守 HUD/NPC/地图热点矩形，青框=样例占位框。非游戏画面或点按测试。", fill="#6a5948", font=font(16))
scale_board.paste(map_crop.convert("RGB"), (0, header))
scale_board.paste(map_crop.convert("RGB"), (CW, header))
sb.text((22, header + 10), "原始 T3 真人触控测试截图（左：保持原图）", fill="#fff8e9", font=font(16), stroke_width=3, stroke_fill="#34281e")
sb.text((CW + 22, header + 10), "OFFLINE MOCKUP · 缩略样例 + 避让区", fill="#fff8e9", font=font(16), stroke_width=3, stroke_fill="#34281e")


def dashed_rect(draw, rect, color, width=2, dash=10):
    x0, y0, x1, y1 = rect
    for x in range(x0, x1, dash * 2):
        draw.line((x, y0, min(x + dash, x1), y0), fill=color, width=width)
        draw.line((x, y1, min(x + dash, x1), y1), fill=color, width=width)
    for y in range(y0, y1, dash * 2):
        draw.line((x0, y, x0, min(y + dash, y1)), fill=color, width=width)
        draw.line((x1, y, x1, min(y + dash, y1)), fill=color, width=width)


# Draw existing hotspots as orange exclusion rectangles on the right-hand copy only.
for hotspot_id, _name, rect in HOTSPOTS:
    x0, y0, x1, y1 = rect
    board_rect = (CW + x0, header + y0, CW + x1, header + y1)
    dashed_rect(sb, board_rect, "#e76739", 2, 9)
    tag = (board_rect[0] + 2, board_rect[1] + 2, board_rect[0] + 32, board_rect[1] + 19)
    sb.rounded_rectangle(tag, radius=4, fill="#9b442b", outline="#fff0da", width=1)
    sb.text((tag[0] + 3, tag[1] + 1), hotspot_id, fill="#fff8e9", font=font(10, True))

for candidate in CANDIDATES:
    ident, title, kind, center_x, foot_y = candidate
    placement, sprite_box, label_box = placement_geometry(candidate)
    sx0, sy0, sx1, sy1 = sprite_box
    drawn = frame(kind + "_lowpoly_idle").resize((sx1 - sx0, sy1 - sy0), Image.Resampling.LANCZOS)
    scale_board.paste(drawn, (CW + sx0, header + sy0), drawn)
    bx0, by0, bx1, by1 = placement
    board_box = (CW + bx0, header + by0, CW + bx1, header + by1)
    dashed_rect(sb, board_box, "#48d1c2", 3, 9)
    lx0, ly0, lx1, ly1 = label_box
    board_label = (CW + lx0, header + ly0, CW + lx1, header + ly1)
    sb.rounded_rectangle(board_label, radius=5, fill="#164d49", outline="#b9fff1", width=1)
    sb.text((board_label[0] + 4, board_label[1] + 1), f"{ident} {title}", fill="#edfff9", font=font(11, True))

footer_y = header + CH + 6
sb.text((24, footer_y),
        f"橙框 H1–H15 = T3 截图中保守标注的 UI/NPC/井/告示栏/其他热点；青框 = Blender sprite 以 R.Z={R_Z:.4f}×{MOCKUP_SCALE:.2f} 缩略后外扩 8px 的离线摆位框。",
        fill="#34281e", font=font(13))
sb.text((24, footer_y + 20), "脚本化半开区间矩形测试：候选框/标签彼此及与热点均无相交；只验证静态避让，不代表真实运行点按或地图坐标。",
        fill="#34281e", font=font(13))
scale_board.save(PREVIEWS / "openworld_v25_village_scale_mockup.png", optimize=True)

for path in sorted(PREVIEWS.glob("*.png")):
    with Image.open(path) as im:
        print(f"PREVIEW {path} {im.width}x{im.height} {path.stat().st_size} bytes")

"""Offline screen-space checks for static character swap previews.

These coordinates are measured from the real T0 touch-test screenshot. The three
characters are alternatives replacing the existing player on one already-walkable
dirt-path tile; they are not three simultaneous world placements and are not
runtime coordinates, hitboxes, or depth-sort validation.
"""
from functools import lru_cache
from math import hypot
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
FRAME_DIR = ROOT / "art" / "out" / "openworld_v25" / "frames"
VIEW_W, VIEW_H = 824, 1830
CSS_WIDTH, DPR = 412, 2
R_Z = CSS_WIDTH * DPR / 860.0
FRAME_W, FRAME_H = 160, 176
FEET_ANCHOR_Y = FRAME_H * 0.86  # engine.js drawSprite anchor for small sprites
MOCKUP_SCALE = 1.0  # player_m0/player_f0/npc_mentor manifest k=1.00
SAFE_MARGIN = 8
SOURCE_IMAGE = ROOT / "test" / "human_olaf" / "001_T0_enter_map.png"
# Tight map crop showing the existing player, dirt path, nearby fence and blossom tree.
PANEL_CROP = (220, 700, 700, 1090)
FOOT_POINT = (411, 979)  # measured screen-pixel anchor on the original walkable path tile

# Manually bounded from test/human_olaf/001_T0_enter_map.png. Rectangles conservatively
# cover visible HUD, tutorial/NPC markers and relevant foreground silhouettes. They are
# not game hitboxes. H15 is the nearby pink blossom canopy/trunk occlusion guard.
HOTSPOTS = (
    ("H1", "HUD player/status card", (13, 13, 408, 151)),
    ("H2", "HUD currency", (477, 13, 690, 83)),
    ("H3", "HUD action-point row", (12, 155, 190, 193)),
    ("H4", "HUD挂机 control", (12, 201, 172, 289)),
    ("H5", "HUD task tracker", (373, 155, 691, 416)),
    ("H6", "Tutorial popup and pointer", (365, 307, 824, 493)),
    ("H7", "Debt-slime name/marker", (215, 421, 329, 468)),
    ("H8", "Storyteller bubble/name/sprite", (362, 477, 495, 612)),
    ("H9", "Wild-boar name/sprite", (389, 551, 489, 660)),
    ("H10", "Debt-event NPCs/labels/marker", (520, 505, 721, 681)),
    ("H11", "Well label/marker", (516, 673, 608, 716)),
    ("H12", "Herb point and label", (449, 731, 555, 790)),
    ("H13", "Cuihua bubble/name/sprite", (520, 788, 687, 954)),
    ("H14", "Right-side map object/quest marker", (683, 766, 824, 951)),
    ("H15", "Foreground pink blossom canopy/trunk", (482, 852, 695, 1054)),
)

# The candidate models are mutually exclusive render alternatives at the same real
# player footpoint. The source player's own sprite is intentionally replaced, not a blocker.
CANDIDATES = (
    ("C1", "主角男", "male", FOOT_POINT[0], FOOT_POINT[1]),
    ("C2", "主角女", "female", FOOT_POINT[0], FOOT_POINT[1]),
    ("C3", "剑仙", "swordsman", FOOT_POINT[0], FOOT_POINT[1]),
)

# This short fence section is visibly behind the current player in the source capture.
# The static replacement is composited above the same screenshot/player tile, preserving
# that observed foreground ordering. It is documented, not incorrectly treated as a blocker.
BACKGROUND_CONTEXT = (
    ("B1", "short fence behind the existing player; intentionally remains behind sprite",
     (365, 837, 455, 911)),
)


def model_pixel_size():
    """The full 160x176 sprite frame at manifest k=1 and the real screen R.Z."""
    return (round(FRAME_W * MOCKUP_SCALE * R_Z),
            round(FRAME_H * MOCKUP_SCALE * R_Z))


@lru_cache(maxsize=None)
def visible_alpha_bbox(kind):
    """Conservative opaque-pixel bounding rectangle after the exact preview resize."""
    path = FRAME_DIR / f"{kind}_lowpoly_idle.png"
    if not path.is_file():
        raise FileNotFoundError(f"Render with Blender before checking placement: {path}")
    im = Image.open(path).convert("RGBA")
    if im.size != (320, 352):
        raise ValueError(f"{path} must be 320x352, found {im.size}")
    im = im.resize(model_pixel_size(), Image.Resampling.LANCZOS)
    mask = im.getchannel("A").point(lambda v: 255 if v >= 128 else 0)
    bbox = mask.getbbox()
    if bbox is None:
        raise ValueError(f"No visible geometry in {path}")
    return bbox


def expand(rect, margin):
    return (rect[0] - margin, rect[1] - margin,
            rect[2] + margin, rect[3] + margin)


def placement_geometry(candidate):
    """Return dicts for full-frame box, visible-alpha box, and safety envelope."""
    ident, title, kind, center_x, foot_y = candidate
    width, height = model_pixel_size()
    left = round(center_x - width / 2)
    top = round(foot_y - FEET_ANCHOR_Y * MOCKUP_SCALE * R_Z)
    frame = (left, top, left + width, top + height)
    ax0, ay0, ax1, ay1 = visible_alpha_bbox(kind)
    visible = (left + ax0, top + ay0, left + ax1, top + ay1)
    safe = expand(visible, SAFE_MARGIN)
    return {
        "id": ident,
        "title": title,
        "kind": kind,
        "frame": frame,
        "visible": visible,
        "safe": safe,
        "alpha_relative": (ax0, ay0, ax1, ay1),
        "anchor": (center_x, foot_y),
    }


def intersects(a, b):
    """Half-open rectangle intersection; touching edges alone are not overlap."""
    return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]


def clearance(a, b):
    """Euclidean pixel gap between non-overlapping half-open rectangles."""
    dx = max(b[0] - a[2], a[0] - b[2], 0)
    dy = max(b[1] - a[3], a[1] - b[3], 0)
    return hypot(dx, dy)


def rect_canvas_clearance(rect):
    return min(rect[0], rect[1], VIEW_W - rect[2], VIEW_H - rect[3])


def panel_frame_clearance(frame):
    x0, y0, x1, y1 = PANEL_CROP
    local = (frame[0] - x0, frame[1] - y0, frame[2] - x0, frame[3] - y0)
    panel_w, panel_h = x1 - x0, y1 - y0
    return min(local[0], local[1], panel_w - local[2], panel_h - local[3])


def validate_geometry():
    """Require 45 visible-silhouette/hotspot checks and full-frame panel margins."""
    assert len(HOTSPOTS) == 15, f"expected 15 annotated blockers, found {len(HOTSPOTS)}"
    assert len(CANDIDATES) == 3, f"expected 3 alternative model renders, found {len(CANDIDATES)}"
    assert len({candidate[3:] for candidate in CANDIDATES}) == 1, "alternatives must share one footpoint"
    assert SOURCE_IMAGE.is_file(), f"missing source screenshot: {SOURCE_IMAGE}"
    source = Image.open(SOURCE_IMAGE)
    assert source.size == (VIEW_W, VIEW_H), f"unexpected source screenshot dimensions: {source.size}"
    results = {}
    for candidate in CANDIDATES:
        placement = placement_geometry(candidate)
        ident = placement["id"]
        full_frame_gap = panel_frame_clearance(placement["frame"])
        assert full_frame_gap >= SAFE_MARGIN, (
            "full sprite frame is clipped or too close to panel edge", ident,
            placement["frame"], full_frame_gap)
        screen_gap = rect_canvas_clearance(placement["safe"])
        assert screen_gap >= 0, ("visible alpha safety envelope outside source screenshot", ident,
                                 placement["safe"], screen_gap)
        clearances = {}
        for hotspot_id, name, blocker in HOTSPOTS:
            gap = clearance(placement["visible"], blocker)
            clearances[hotspot_id] = gap
            assert not intersects(placement["visible"], blocker), (
                "visible silhouette overlaps UI/NPC/foreground blocker", ident,
                hotspot_id, name, placement["visible"], blocker)
            assert gap >= SAFE_MARGIN, (
                "visible silhouette lacks 8px blocker clearance", ident,
                hotspot_id, name, gap)
        bg_intersections = [
            (bg_id, name) for bg_id, name, rect in BACKGROUND_CONTEXT
            if intersects(placement["visible"], rect)
        ]
        nearest = min(clearances, key=clearances.get)
        results[ident] = {
            **placement,
            "nearest_blocker": nearest,
            "clearance_px": clearances[nearest],
            "panel_frame_clearance_px": full_frame_gap,
            "blocker_clearances": clearances,
            "background_context_overlap": bg_intersections,
        }
    assert len(CANDIDATES) * len(HOTSPOTS) == 45
    return results

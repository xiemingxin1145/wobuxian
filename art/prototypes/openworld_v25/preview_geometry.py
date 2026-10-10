"""Offline screen-space bounds; not runtime positions or pointer hitboxes."""
from math import hypot

VIEW_W, VIEW_H = 824, 1100
CSS_WIDTH, DPR = 412, 2
R_Z = CSS_WIDTH * DPR / 860.0
FRAME_W, FRAME_H = 160, 176
FEET_ANCHOR_Y = FRAME_H * 0.86
MOCKUP_SCALE = 1.0  # Same k=1.0 as player_m0/player_f0/npc_mentor in assets.js.
BOX_MARGIN = 8
SAFE_MARGIN = 8

# Conservative rectangles manually bounded from test/human_olaf/003_T3_near_npc.png.
# Half-open coordinates (x0, y0, x1, y1); these are visual avoidance regions, not claims
# about the game's actual pointer/touch hit areas.
HOTSPOTS = (
    ("H1", "HUD player/status card", (12, 12, 482, 169)),
    ("H2", "HUD currency", (558, 12, 811, 84)),
    ("H3", "HUD action-point row", (12, 154, 190, 196)),
    ("H4", "HUD挂机 control", (12, 234, 203, 324)),
    ("H5", "HUD task panel", (437, 179, 811, 454)),
    ("H6", "NPC debt-slime label and sprite", (47, 523, 172, 702)),
    ("H7", "NPC storyteller bubble/name/sprite", (196, 510, 351, 741)),
    ("H8", "NPC 娘 bubble/name/sprite", (508, 506, 625, 743)),
    ("H9", "NPC meditation/debt event marker", (413, 571, 590, 753)),
    ("H10", "well label and interaction marker", (319, 692, 423, 769)),
    ("H11", "notice-board label and board", (639, 690, 753, 812)),
    ("H12", "herb/采药 point label", (284, 783, 374, 848)),
    ("H13", "洞府 and nearby quest marker", (419, 798, 680, 886)),
    ("H14", "NPC 翠花 bubble/name/sprite", (365, 809, 477, 1019)),
    ("H15", "NPC 路人甲 marker/name/sprite", (578, 832, 726, 1022)),
)

# Three static full-frame clearance probes selected at the crowded edges around
# H6/H7, H12/H14, and H5/H7. They are not canonical game-world placements.
# Values are (center_x, foot_y) in the 824x1100 screenshot coordinate space.
CANDIDATES = (
    ("C1", "主角男", "male", 93, 863),
    ("C2", "主角女", "female", 270, 1009),
    ("C3", "剑仙", "swordsman", 345, 470),
)


def model_pixel_size():
    """Full 160x176 source frame transformed only by the game's R.Z factor."""
    return (round(FRAME_W * MOCKUP_SCALE * R_Z),
            round(FRAME_H * MOCKUP_SCALE * R_Z))


def placement_geometry(candidate):
    """Return (full-frame box + safety margin, rendered sprite box, title tag)."""
    _ident, _title, _kind, center_x, foot_y = candidate
    width, height = model_pixel_size()
    left = round(center_x - width / 2)
    top = round(foot_y - FEET_ANCHOR_Y * MOCKUP_SCALE * R_Z)
    sprite = (left, top, left + width, top + height)
    x0, y0, x1, y1 = (left - BOX_MARGIN, top - BOX_MARGIN,
                      left + width + BOX_MARGIN, top + height + BOX_MARGIN)
    placement = (x0, y0, x1, y1)
    tag = (x0 + 2, y0 + 2, x1 - 2, y0 + 23)
    return placement, sprite, tag


def intersects(a, b):
    """Half-open rectangle intersection; touching edges alone are not overlap."""
    return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]


def clearance(a, b):
    """Euclidean pixel gap between non-overlapping half-open rectangles."""
    dx = max(b[0] - a[2], a[0] - b[2], 0)
    dy = max(b[1] - a[3], a[1] - b[3], 0)
    return hypot(dx, dy)


def canvas_clearance(box):
    return min(box[0], box[1], VIEW_W - box[2], VIEW_H - box[3])


def validate_geometry():
    """Require 45 full-frame/hotspot checks and >=8px margins throughout."""
    assert len(HOTSPOTS) == 15, f"expected 15 annotated hotspots, found {len(HOTSPOTS)}"
    assert len(CANDIDATES) == 3, f"expected 3 candidate frames, found {len(CANDIDATES)}"
    boxes, tags, result = {}, {}, {}
    for candidate in CANDIDATES:
        ident = candidate[0]
        box, _sprite, tag = placement_geometry(candidate)
        boxes[ident], tags[ident] = box, tag
        edge_gap = canvas_clearance(box)
        assert edge_gap >= SAFE_MARGIN, (
            "candidate lacks full canvas safety margin", ident, box, edge_gap)
        hotspot_clearances = {}
        for hotspot_id, hotspot_name, hotspot_box in HOTSPOTS:
            gap = clearance(box, hotspot_box)
            hotspot_clearances[hotspot_id] = gap
            assert not intersects(box, hotspot_box), (
                "candidate/hotspot collision", ident, box, hotspot_id, hotspot_name, hotspot_box)
            assert gap >= SAFE_MARGIN, (
                "candidate lacks hotspot safety margin", ident, hotspot_id, gap)
            assert not intersects(tag, hotspot_box), (
                "candidate-tag/hotspot collision", ident, tag, hotspot_id, hotspot_name)
        nearest_id = min(hotspot_clearances, key=hotspot_clearances.get)
        result[ident] = {
            "box": box,
            "tag": tag,
            "sprite": placement_geometry(candidate)[1],
            "nearest_hotspot": nearest_id,
            "clearance_px": hotspot_clearances[nearest_id],
            "canvas_clearance_px": edge_gap,
            "hotspot_clearances": hotspot_clearances,
        }
    assert len(CANDIDATES) * len(HOTSPOTS) == 45
    for i, a in enumerate(CANDIDATES):
        for b in CANDIDATES[i + 1:]:
            gap = clearance(boxes[a[0]], boxes[b[0]])
            assert not intersects(boxes[a[0]], boxes[b[0]]), (
                "candidate/candidate collision", a[0], boxes[a[0]], b[0], boxes[b[0]])
            assert gap >= SAFE_MARGIN, (
                "candidate/candidate safety margin", a[0], b[0], gap)
            assert not intersects(tags[a[0]], boxes[b[0]]), (
                "candidate tag overlaps another candidate", a[0], b[0])
            assert not intersects(tags[b[0]], boxes[a[0]]), (
                "candidate tag overlaps another candidate", b[0], a[0])
            result[a[0]]["candidate_clearances"] = result[a[0]].get("candidate_clearances", {})
            result[b[0]]["candidate_clearances"] = result[b[0]].get("candidate_clearances", {})
            result[a[0]]["candidate_clearances"][b[0]] = gap
            result[b[0]]["candidate_clearances"][a[0]] = gap
    return result

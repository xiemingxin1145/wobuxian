#!/usr/bin/env python3
"""Check static T0 player-tile replacement alternatives; not runtime hit testing."""
from preview_geometry import (
    BACKGROUND_CONTEXT,
    CANDIDATES,
    FRAME_H,
    FRAME_W,
    HOTSPOTS,
    MOCKUP_SCALE,
    PANEL_CROP,
    R_Z,
    SAFE_MARGIN,
    FOOT_POINT,
    model_pixel_size,
    placement_geometry,
    validate_geometry,
)


def main():
    result = validate_geometry()
    pair_count = len(CANDIDATES) * len(HOTSPOTS)
    frame_size = model_pixel_size()
    print(
        "STATIC_T0_PLACEMENT_PASS "
        f"alternative_models={len(CANDIDATES)} same_screen_footpoint={FOOT_POINT} "
        f"blockers={len(HOTSPOTS)} alpha_box_blocker_pairs={pair_count} "
        f"full_source_frame={FRAME_W}x{FRAME_H} displayed={frame_size[0]}x{frame_size[1]} "
        f"mockup_scale={MOCKUP_SCALE:.2f}x R_Z={R_Z:.4f} "
        f"required_alpha_clearance>={SAFE_MARGIN}px runtime_taps=NOT_TESTED"
    )
    print(f"PANEL_CROP={PANEL_CROP}; each full sprite frame has an 8px-or-greater crop margin")
    for candidate in CANDIDATES:
        placement = placement_geometry(candidate)
        details = result[placement["id"]]
        pink_tree_gap = details["blocker_clearances"]["H15"]
        print(
            f"{placement['id']} {placement['title']}: frame={placement['frame']} "
            f"opaque_bbox={placement['visible']} alpha_safety_box={placement['safe']} "
            f"nearest={details['nearest_blocker']} gap={details['clearance_px']:.1f}px "
            f"pink_tree_gap={pink_tree_gap:.1f}px "
            f"panel_frame_margin={details['panel_frame_clearance_px']}px "
            f"background_context={details['background_context_overlap']}"
        )
    print("--- conservatively marked T0 UI/NPC/foreground blocking regions ---")
    for hotspot_id, name, rect in HOTSPOTS:
        print(f"{hotspot_id} {name}: {rect}")
    print("--- observed background-depth context (not a blocker) ---")
    for bg_id, name, rect in BACKGROUND_CONTEXT:
        print(f"{bg_id} {name}: {rect}")
    print("NOTE: same-position alternatives replace the screenshot's existing player; no runtime coordinate, touch, depth-sort, Android, or blind-test claim.")
    return result


if __name__ == "__main__":
    main()

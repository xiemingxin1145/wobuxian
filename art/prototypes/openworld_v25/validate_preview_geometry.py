#!/usr/bin/env python3
"""Verify full-scale offline sprite-frame bounds against T3 screenshot regions."""
from preview_geometry import (
    CANDIDATES, FRAME_H, FRAME_W, HOTSPOTS, MOCKUP_SCALE, R_Z, SAFE_MARGIN,
    model_pixel_size, placement_geometry, validate_geometry,
)


def main():
    result = validate_geometry()
    hotspot_pairs = len(CANDIDATES) * len(HOTSPOTS)
    candidate_pairs = len(CANDIDATES) * (len(CANDIDATES) - 1) // 2
    sizes = model_pixel_size()
    print(
        "RECTANGLE_CLEARANCE_PASS "
        f"candidates={len(CANDIDATES)} hotspots={len(HOTSPOTS)} "
        f"candidate_hotspot_pairs={hotspot_pairs} candidate_pairs={candidate_pairs} "
        f"source_frame={FRAME_W}x{FRAME_H} rendered_frame={sizes[0]}x{sizes[1]} "
        f"mockup_scale={MOCKUP_SCALE:.2f}x R_Z={R_Z:.4f} "
        f"required_clearance>={SAFE_MARGIN}px; runtime_taps=NOT_TESTED"
    )
    for candidate in CANDIDATES:
        ident, title, _kind, _x, _y = candidate
        box, sprite, tag = placement_geometry(candidate)
        details = result[ident]
        print(
            f"{ident} {title}: box={box} sprite={sprite} label={tag} "
            f"nearest_hotspot={details['nearest_hotspot']} "
            f"hotspot_clearance={details['clearance_px']:.1f}px "
            f"canvas_clearance={details['canvas_clearance_px']:.1f}px "
            f"candidate_clearances={details.get('candidate_clearances', {})}"
        )
    for hotspot_id, name, rect in HOTSPOTS:
        print(f"{hotspot_id} {name}: {rect}")
    return result


if __name__ == "__main__":
    main()

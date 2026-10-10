#!/usr/bin/env python3
"""Verify offline preview layout rectangles against T3 screenshot hotspot regions."""
from preview_geometry import CANDIDATES, HOTSPOTS, MOCKUP_SCALE, placement_geometry, validate_geometry


def main():
    result = validate_geometry()
    candidate_pairs = len(CANDIDATES) * (len(CANDIDATES) - 1) // 2
    hotspot_pairs = len(CANDIDATES) * len(HOTSPOTS)
    print(
        "RECTANGLE_COLLISION_PASS "
        f"candidates={len(CANDIDATES)} hotspots={len(HOTSPOTS)} "
        f"candidate_hotspot_pairs={hotspot_pairs} candidate_pairs={candidate_pairs} "
        f"mockup_scale={MOCKUP_SCALE:.2f}x; runtime_taps=NOT_TESTED"
    )
    for candidate in CANDIDATES:
        ident, title, _kind, _x, _y = candidate
        box, sprite, tag = placement_geometry(candidate)
        nearest = result[ident]
        print(f"{ident} {title}: box={box} sprite={sprite} label={tag} "
              f"nearest_hotspot={nearest['nearest_hotspot'][0]} "
              f"clearance={nearest['clearance_px']:.1f}px")
    for hotspot_id, name, rect in HOTSPOTS:
        print(f"{hotspot_id} {name}: {rect}")
    return result


if __name__ == "__main__":
    main()

"""Run with: blender -b --python-exit-code 1 openworld_v25_models.blend -P validate_blend.py"""
import json
import math
import bpy

EXPECTED = ("male", "female", "swordsman")
FEATURES = {
    "male": "broad shoulders",
    "female": "A-line skirt",
    "swordsman": "wide straw hat",
}
summary = []


def descendants(root):
    return list(root.children_recursive)


roots = [bpy.data.objects.get(f"v25_{kind}_root") for kind in EXPECTED]
assert all(roots), "Missing one or more model roots"
assert len([obj for obj in bpy.data.objects if obj.name.startswith("v25_") and obj.name.endswith("_root")]) == 3

for kind, root in zip(EXPECTED, roots):
    assert root.get("character_type") == kind, (kind, root.get("character_type"))
    assert root.get("runtime_integrated") is False, (kind, "runtime flag must remain false")
    assert "Extruded Cube/Cylinder" in root.get("modeling_method", "")
    silhouette_feature = root.get("silhouette_feature", "")
    assert FEATURES[kind] in silhouette_feature, (kind, "missing major silhouette feature", silhouette_feature)
    objects = descendants(root)
    meshes = [obj for obj in objects if obj.type == "MESH"]
    assert len(meshes) >= 20, (kind, "unexpectedly few mesh parts", len(meshes))
    mirror_count = 0
    vertices = 0
    polygons = 0
    loop_profile_count = 0
    robe_half_width = None
    robe_profile_widths = {}
    for obj in meshes:
        assert len(obj.data.vertices) > 0 and len(obj.data.polygons) > 0, obj.name
        vertices += len(obj.data.vertices)
        polygons += len(obj.data.polygons)
        mirror_count += sum(mod.type == "MIRROR" for mod in obj.modifiers)
        part_name = obj.name.lower()
        loop_profile_count += int("loop" in part_name or "extrusion" in part_name or "extrud" in part_name)
        if obj.name.startswith("robe_extruded_cube_mirrored"):
            robe_half_width = max(abs(float(vertex.co.x)) for vertex in obj.data.vertices)
            for vertex in obj.data.vertices:
                z = round(float(vertex.co.z), 2)
                robe_profile_widths[z] = max(
                    robe_profile_widths.get(z, 0.0), abs(float(vertex.co.x)))
        for vertex in obj.data.vertices:
            assert all(math.isfinite(float(c)) for c in vertex.co), (kind, obj.name)
    assert mirror_count >= 3, (kind, "Mirror modifier count", mirror_count)
    assert loop_profile_count >= 7, (kind, "extruded/loop-cut profile evidence", loop_profile_count)
    assert robe_half_width is not None, (kind, "missing editable extruded robe profile")
    summary.append({
        "kind": kind,
        "mesh_parts": len(meshes),
        "vertices": vertices,
        "polygons": polygons,
        "mirror_modifiers": mirror_count,
        "loop_profile_parts": loop_profile_count,
        "robe_half_width": round(robe_half_width, 3),
        "robe_width_z040": round(robe_profile_widths.get(0.4, 0.0), 3),
        "robe_width_z079": round(robe_profile_widths.get(0.79, 0.0), 3),
        "silhouette_feature": silhouette_feature,
        "runtime_integrated": root.get("runtime_integrated"),
    })

by_kind = {item["kind"]: item for item in summary}
assert by_kind["female"]["robe_width_z040"] >= 1.4 * by_kind["male"]["robe_width_z040"], (
    "female skirt hem is not materially wider than the male straight tunic hem",
    by_kind["female"]["robe_width_z040"], by_kind["male"]["robe_width_z040"])
assert by_kind["female"]["robe_width_z040"] >= 1.6 * by_kind["female"]["robe_width_z079"], (
    "female A-line skirt does not flare sufficiently from the waist",
    by_kind["female"]["robe_width_z040"], by_kind["female"]["robe_width_z079"])
print("BLEND_VALIDATION_OK " + json.dumps(summary, ensure_ascii=False, sort_keys=True))

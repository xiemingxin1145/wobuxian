"""Run with: blender -b --python-exit-code 1 openworld_v25_models.blend -P validate_blend.py"""
import json
import math
import bpy

EXPECTED = ("male", "female", "swordsman")
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
    objects = descendants(root)
    meshes = [obj for obj in objects if obj.type == "MESH"]
    assert len(meshes) >= 20, (kind, "unexpectedly few mesh parts", len(meshes))
    mirror_count = 0
    vertices = 0
    polygons = 0
    loop_profile_count = 0
    for obj in meshes:
        assert len(obj.data.vertices) > 0 and len(obj.data.polygons) > 0, obj.name
        vertices += len(obj.data.vertices)
        polygons += len(obj.data.polygons)
        mirror_count += sum(mod.type == "MIRROR" for mod in obj.modifiers)
        part_name = obj.name.lower()
        loop_profile_count += int("loop" in part_name or "extrusion" in part_name or "extrud" in part_name)
        for vertex in obj.data.vertices:
            assert all(math.isfinite(float(c)) for c in vertex.co), (kind, obj.name)
    assert mirror_count >= 3, (kind, "Mirror modifier count", mirror_count)
    assert loop_profile_count >= 7, (kind, "extruded/loop-cut profile evidence", loop_profile_count)
    summary.append({
        "kind": kind,
        "mesh_parts": len(meshes),
        "vertices": vertices,
        "polygons": polygons,
        "mirror_modifiers": mirror_count,
        "loop_profile_parts": loop_profile_count,
        "runtime_integrated": root.get("runtime_integrated"),
    })

print("BLEND_VALIDATION_OK " + json.dumps(summary, ensure_ascii=False, sort_keys=True))

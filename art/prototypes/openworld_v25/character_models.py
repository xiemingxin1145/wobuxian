"""《我不仙》v2.5 standalone low-poly character samples.

Source of truth for this sample. Geometry is intentionally built from extruded
cube/cylinder cross-sections with explicit horizontal loop rings and X Mirror
modifiers; it is separate from art/chars.py and the shipped sprite pipeline.
Coordinates: Z-up, character faces -Y, feet at z=0. The source creates no game
spritesheets, runtime hooks, or save data.
"""
import math
import bpy
import bmesh
from mathutils import Vector


def _rgb(hex_color):
    h = hex_color.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb)


def material(name, color, roughness=0.72, metallic=0.0):
    existing = bpy.data.materials.get(name)
    if existing:
        return existing
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*_rgb(color), 1.0)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*_rgb(color), 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return m


def empty(name, loc=(0, 0, 0), parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = loc
    if parent:
        obj.parent = parent
    return obj


def _mesh_object(name, verts, faces, mat, parent=None):
    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.validate(verbose=False, clean_customdata=False)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    if bm.faces:
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    if parent:
        obj.parent = parent
    if mat:
        mesh.materials.append(mat)
    obj["sample_source"] = "Cube/Cylinder extrusions + loop rings; standalone v2.5 art sample"
    return obj


def _bevel(obj, width=0.018, segments=1):
    mod = obj.modifiers.new("small_faceted_edges", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    return obj


def _mirror_x(obj):
    mod = obj.modifiers.new("Mirror_X_symmetry", "MIRROR")
    mod.use_axis = (True, False, False)
    mod.use_clip = True
    mod.use_mirror_merge = True
    mod.merge_threshold = 0.001
    return obj


def _half_cube_extrusion(name, rings, mat, parent=None, bevel=0.012):
    """Extrude a half-cube cross-section upward; each profile row is a loop cut.

    rings are (z, half_width, half_depth). A Mirror modifier completes the
    opposite half, preserving an editable centre seam like a manual Mirror workflow.
    """
    verts = []
    for z, half_w, half_d in rings:
        verts.extend(((0, -half_d, z), (half_w, -half_d, z),
                      (half_w, half_d, z), (0, half_d, z)))
    faces = [(3, 2, 1, 0)]
    for r in range(len(rings) - 1):
        a, b = 4 * r, 4 * (r + 1)
        for j in range(4):
            faces.append((a + j, a + (j + 1) % 4,
                          b + (j + 1) % 4, b + j))
    top = 4 * (len(rings) - 1)
    faces.append((top, top + 1, top + 2, top + 3))
    obj = _mesh_object(name, verts, faces, mat, parent)
    _mirror_x(obj)
    if bevel:
        _bevel(obj, bevel, 1)
    return obj


def _cube_loft(name, rings, mat, parent=None, bevel=0.01):
    """Extrude a rectangular Cube along Z, with profile rows as loop cuts.

    rings are (z, center_x, half_width, half_depth).
    """
    verts = []
    for z, cx, half_w, half_d in rings:
        verts.extend(((cx - half_w, -half_d, z), (cx + half_w, -half_d, z),
                      (cx + half_w, half_d, z), (cx - half_w, half_d, z)))
    faces = [(3, 2, 1, 0)]
    for r in range(len(rings) - 1):
        a, b = 4 * r, 4 * (r + 1)
        for j in range(4):
            faces.append((a + j, a + (j + 1) % 4,
                          b + (j + 1) % 4, b + j))
    top = 4 * (len(rings) - 1)
    faces.append((top, top + 1, top + 2, top + 3))
    obj = _mesh_object(name, verts, faces, mat, parent)
    if bevel:
        _bevel(obj, bevel, 1)
    return obj


def _cylinder_extrusion(name, rings, mat, parent=None, sides=8):
    """Extrude a low-sided Cylinder along Z with explicit support-loop cuts.

    rings are (z, radius_x, radius_y); elliptical profiles keep the face readable
    from the game's -Y-facing orthographic view.
    """
    verts = []
    for z, rx, ry in rings:
        for i in range(sides):
            a = -math.pi / 2 + (2 * math.pi * i / sides)
            verts.append((rx * math.cos(a), ry * math.sin(a), z))
    faces = [tuple(reversed(range(sides)))]
    for r in range(len(rings) - 1):
        a, b = r * sides, (r + 1) * sides
        for j in range(sides):
            faces.append((a + j, a + (j + 1) % sides,
                          b + (j + 1) % sides, b + j))
    top = (len(rings) - 1) * sides
    faces.append(tuple(top + i for i in range(sides)))
    return _mesh_object(name, verts, faces, mat, parent)


def _cube_extrusion_path(name, rows, mat, parent=None):
    """Extrude a Cube cross-section along a bent limb path (rows are loop cuts).

    rows are (x, y, z, width, depth). The square section makes sleeves angular,
    while the path turns the cube extrusion into a tapered low-poly limb.
    """
    verts = []
    for i, row in enumerate(rows):
        x, y, z, width, depth = row
        here = Vector((x, y, z))
        if i == 0:
            tangent = Vector(rows[1][:3]) - here
        elif i == len(rows) - 1:
            tangent = here - Vector(rows[i - 1][:3])
        else:
            tangent = Vector(rows[i + 1][:3]) - Vector(rows[i - 1][:3])
        side = Vector((tangent.z, 0, -tangent.x)).normalized()
        front_back = Vector((0, 1, 0))
        for u, v in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
            p = here + side * (u * width / 2) + front_back * (v * depth / 2)
            verts.append(tuple(p))
    faces = [(3, 2, 1, 0)]
    for r in range(len(rows) - 1):
        a, b = 4 * r, 4 * (r + 1)
        for j in range(4):
            faces.append((a + j, a + (j + 1) % 4,
                          b + (j + 1) % 4, b + j))
    top = 4 * (len(rows) - 1)
    faces.append((top, top + 1, top + 2, top + 3))
    obj = _mesh_object(name, verts, faces, mat, parent)
    _bevel(obj, 0.012, 1)
    return obj


def _box(name, size, loc, mat, parent=None, rot=(0, 0, 0), bevel=0.008):
    x, y, z = (v / 2 for v in size)
    verts = [(-x, -y, -z), (x, -y, -z), (x, y, -z), (-x, y, -z),
             (-x, -y, z), (x, -y, z), (x, y, z), (-x, y, z)]
    faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4),
             (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    obj = _mesh_object(name, verts, faces, mat, parent)
    obj.location = loc
    obj.rotation_euler = rot
    if bevel:
        _bevel(obj, bevel, 1)
    return obj


def _set_visible(obj, value):
    obj.hide_render = not value
    for child in obj.children:
        _set_visible(child, value)


def build_lowpoly(kind):
    """Build one of: male, female, swordsman. Returns (root, editable rig dict)."""
    if kind not in ("male", "female", "swordsman"):
        raise ValueError("kind must be male, female, or swordsman")

    root = empty("v25_" + kind + "_root")
    body = empty("pose_body", parent=root)
    skin = material("v25_skin", "#f0c8a5", 0.72)
    dark = material("v25_hair_ink", "#2a1b14", 0.78)
    eye = material("v25_eye", "#211a18", 0.35)
    eye_glint = material("v25_eye_glint", "#fff2d8", 0.26)
    cream = material("v25_cream", "#efe2c8", 0.78)
    shoe = material("v25_shoe", "#594536", 0.82)
    metal = material("v25_sword_steel", "#b8ccd4", 0.3, 0.75)
    gold = material("v25_gold_trim", "#d6a94d", 0.42, 0.25)
    red = material("v25_ribbon_red", "#d95662", 0.58)

    if kind == "male":
        robe_col, robe2_col, trim_col, pants_col = "#b8946a", "#efe2c8", "#5a7b90", "#514438"
    elif kind == "female":
        robe_col, robe2_col, trim_col, pants_col = "#b8946a", "#f3dfd0", "#d85f83", "#5a493f"
    else:
        robe_col, robe2_col, trim_col, pants_col = "#858d95", "#e8e4dc", "#6e5339", "#4a4b50"
    robe = material("v25_robe_" + kind, robe_col, 0.78)
    robe2 = material("v25_robe_inner_" + kind, robe2_col, 0.78)
    trim = material("v25_trim_" + kind, trim_col, 0.48, 0.08)
    pants = material("v25_pants_" + kind, pants_col, 0.82)

    # Large silhouette split: male = broad shoulders/straight tunic; female =
    # visibly waisted A-line skirt plus twin buns/side locks. Keep female shoulders
    # and cuffs distinct but restrained; never use a cape-like shoulder flare.
    if kind == "female":
        robe_rings = [
            (0.40, 0.67, 0.235), (0.46, 0.64, 0.225), (0.65, 0.44, 0.19),
            (0.79, 0.26, 0.16), (1.04, 0.27, 0.16), (1.18, 0.32, 0.18),
            (1.27, 0.31, 0.17)]
        hem_rings = [(0.39, 0.68, 0.245), (0.435, 0.68, 0.245), (0.47, 0.63, 0.23)]
    elif kind == "male":
        robe_rings = [
            (0.40, 0.31, 0.19), (0.46, 0.30, 0.185), (0.65, 0.235, 0.15),
            (0.79, 0.245, 0.155), (1.04, 0.245, 0.16), (1.18, 0.355, 0.20),
            (1.27, 0.36, 0.20)]
        hem_rings = [(0.39, 0.318, 0.198), (0.435, 0.318, 0.198), (0.47, 0.302, 0.188)]
    else:
        robe_rings = [
            (0.40, 0.31, 0.19), (0.46, 0.30, 0.185), (0.65, 0.235, 0.15),
            (0.79, 0.245, 0.155), (1.04, 0.245, 0.16), (1.18, 0.33, 0.19),
            (1.27, 0.30, 0.18)]
        hem_rings = [(0.39, 0.318, 0.198), (0.435, 0.318, 0.198), (0.47, 0.302, 0.188)]
    # Cube-like half extrusions; each profile row is a visible support loop.
    _half_cube_extrusion("robe_extruded_cube_mirrored", robe_rings, robe, body, 0.016)
    _half_cube_extrusion("hem_extruded_cube_mirrored", hem_rings, trim, body, 0.008)
    _half_cube_extrusion("waist_belt_extruded_cube_mirrored", [
        (0.735, 0.252, 0.16), (0.775, 0.252, 0.16), (0.82, 0.247, 0.157)], gold if kind == "swordsman" else trim, body, 0.006)
    _box("cross_collar_left", (0.17, 0.035, 0.18), (-0.085, -0.176, 1.16), robe2, body,
         (math.radians(-12), 0, math.radians(-20)), 0.006)
    _box("cross_collar_right", (0.17, 0.035, 0.18), (0.085, -0.176, 1.16), robe2, body,
         (math.radians(-12), 0, math.radians(20)), 0.006)
    _box("front_tunic_panel", (0.12, 0.025, 0.36), (0, -0.164, 0.66), robe2, body, bevel=0.004)
    _box("belt_knot", (0.085, 0.045, 0.10), (0, -0.174, 0.775), gold, body, bevel=0.006)

    # Separated trouser legs and feet provide a clear human silhouette.
    leg_pivots = {}
    for sign, side in ((-1, "L"), (1, "R")):
        pivot = empty("leg_pivot_" + side, (sign * 0.115, 0, 0.455), body)
        leg_pivots[side] = pivot
        _cube_loft("trouser_leg_" + side, [(-0.39, 0, 0.065, 0.080),
                                            (-0.18, 0, 0.066, 0.083),
                                            (0.00, 0, 0.073, 0.087)], pants, pivot, 0.012)
        _box("boot_" + side, (0.145, 0.215, 0.085), (0, -0.037, -0.382), shoe, pivot, bevel=0.012)

    # Separate pivoted sleeves are Cube extrusions with three support loops;
    # the female's flared cuffs reinforce the skirt silhouette at small scale.
    arm_pivots = {}
    for sign, side in ((-1, "L"), (1, "R")):
        pivot = empty("arm_pivot_" + side, (sign * 0.255, 0, 1.17), body)
        arm_pivots[side] = pivot
        sleeve = material("v25_sleeve_" + kind, robe_col, 0.78)
        sleeve_rows = [
            (0, 0, 0.0, 0.18, 0.17), (sign * 0.065, -0.006, -0.19, 0.17, 0.16),
            (sign * 0.13, -0.018, -0.39, 0.145, 0.14)]
        cuff_width, cuff_center = 0.16, 0.135
        if kind == "female":
            sleeve_rows = [
                (0, 0, 0.0, 0.18, 0.17), (sign * 0.065, -0.006, -0.19, 0.21, 0.16),
                (sign * 0.13, -0.018, -0.39, 0.24, 0.14)]
            cuff_width, cuff_center = 0.25, 0.14
        _cube_extrusion_path("sleeve_cube_extrusion_" + side, sleeve_rows, sleeve, pivot)
        _box("cuff_" + side, (cuff_width, 0.16, 0.07), (sign * cuff_center, -0.02, -0.40), trim, pivot, bevel=0.006)
        _cylinder_extrusion("hand_faceted_" + side, [(-0.49, 0.064, 0.060),
                                                      (-0.45, 0.067, 0.062),
                                                      (-0.41, 0.060, 0.056)], skin, pivot, 8)

    # Neck and head: an eight-sided Cylinder extrusion with multiple support loops.
    _cylinder_extrusion("neck_cylinder_extrusion", [(1.245, 0.085, 0.075),
                                                      (1.31, 0.09, 0.078),
                                                      (1.39, 0.095, 0.08)], skin, body, 8)
    _cylinder_extrusion("head_cylinder_extrusion_8sided", [(1.34, 0.195, 0.18),
                                                             (1.42, 0.235, 0.205),
                                                             (1.72, 0.235, 0.205),
                                                             (1.83, 0.205, 0.18)], skin, body, 8)
    for sign, side in ((-1, "L"), (1, "R")):
        _box("ear_" + side, (0.07, 0.07, 0.10), (sign * 0.232, -0.005, 1.57), skin, body, bevel=0.008)
        _box("eye_" + side, (0.037, 0.022, 0.042), (sign * 0.078, -0.206, 1.625), eye, body, bevel=0.004)
        _box("eye_glint_" + side, (0.012, 0.008, 0.012), (sign * 0.071, -0.220, 1.638), eye_glint, body, bevel=0.002)
        _box("brow_" + side, (0.055, 0.018, 0.013), (sign * 0.078, -0.199, 1.688), dark, body, rot=(0, 0, math.radians(-8 * sign)), bevel=0.002)
    _box("nose_faceted", (0.035, 0.028, 0.046), (0, -0.215, 1.574), skin, body, bevel=0.006)
    _box("mouth", (0.042, 0.012, 0.012), (0, -0.208, 1.515), dark, body, bevel=0.002)

    # Hair/hat accents supplement the large clothing silhouettes, not replace them.
    haircap = material("v25_haircap_" + kind, "#33251d" if kind != "female" else "#291a18", 0.82)
    if kind == "male":
        _cylinder_extrusion("male_short_hair_cap", [(1.70, 0.25, 0.21), (1.78, 0.255, 0.215),
                                                      (1.89, 0.205, 0.18)], haircap, body, 8)
        _cube_loft("male_topknot_cube_extrusion", [(1.87, 0, 0.08, 0.075),
                                                    (1.98, 0, 0.07, 0.065),
                                                    (2.04, 0, 0.045, 0.05)], haircap, body, 0.012)
        for i, x in enumerate((-0.13, -0.045, 0.045, 0.13)):
            _box("male_angular_fringe_" + str(i), (0.068, 0.065, 0.095),
                 (x, -0.202, 1.79 + (0.015 if i % 2 else 0)), haircap, body,
                 (math.radians(-8), 0, math.radians((i - 1.5) * 5)), 0.012)
    elif kind == "female":
        _cylinder_extrusion("female_hair_cap", [(1.70, 0.25, 0.21), (1.78, 0.255, 0.215),
                                                  (1.91, 0.205, 0.18)], haircap, body, 8)
        for sign, side in ((-1, "L"), (1, "R")):
            _cylinder_extrusion("female_bun_" + side, [(1.81, 0.09, 0.09),
                                                       (1.89, 0.15, 0.125),
                                                       (1.98, 0.105, 0.09)], haircap, body, 8)
            bun = bpy.data.objects.get("female_bun_" + side)
            if bun:
                bun.location.x = sign * 0.32
            _box("female_red_ribbon_" + side, (0.11, 0.03, 0.05),
                 (sign * 0.32, -0.085, 1.89), red, body, bevel=0.005)
            _cube_loft("female_side_lock_cube_extrusion_" + side, [
                (1.79, sign * 0.28, 0.045, 0.045),
                (1.64, sign * 0.30, 0.060, 0.050),
                (1.44, sign * 0.33, 0.070, 0.060),
                (1.26, sign * 0.34, 0.055, 0.050),
            ], haircap, body, 0.008)
        for i, x in enumerate((-0.12, -0.04, 0.04, 0.12)):
            _box("female_angular_fringe_" + str(i), (0.06, 0.06, 0.09),
                 (x, -0.203, 1.80), haircap, body, rot=(0, 0, math.radians((i - 1.5) * 5)), bevel=0.01)
    else:
        # Older face, grey beard, and broad straw hat keep the sword immortal distinct.
        grey_hair = material("v25_swordsman_grey_hair", "#777b80", 0.82)
        straw = material("v25_straw_hat", "#c6a15b", 0.8)
        _cylinder_extrusion("swordsman_hair_under_hat", [(1.68, 0.24, 0.20),
                                                          (1.82, 0.21, 0.18)], grey_hair, body, 8)
        _cylinder_extrusion("wide_straw_hat_brim_cylinder_extrusion", [(1.805, 0.39, 0.31),
                                                                          (1.85, 0.405, 0.32)], straw, body, 12)
        _cylinder_extrusion("straw_hat_crown_loop_cuts", [(1.84, 0.24, 0.20),
                                                            (1.93, 0.205, 0.17),
                                                            (2.08, 0.11, 0.10),
                                                            (2.12, 0.055, 0.055)], straw, body, 8)
        beard = material("v25_swordsman_beard", "#676a70", 0.9)
        _cylinder_extrusion("faceted_beard", [(1.30, 0.018, 0.02), (1.35, 0.055, 0.045),
                                               (1.44, 0.095, 0.075), (1.51, 0.075, 0.06)], beard, body, 8)
        _box("swordsman_moustache_L", (0.09, 0.05, 0.035), (-0.065, -0.209, 1.49), beard, body, bevel=0.006)
        _box("swordsman_moustache_R", (0.09, 0.05, 0.035), (0.065, -0.209, 1.49), beard, body, bevel=0.006)
        # Back-mounted sword: rectangular blade, guard, and grip; entirely standalone geometry.
        _box("back_sword_blade", (0.065, 0.035, 0.78), (0.18, 0.17, 0.89), metal, body,
             rot=(0, math.radians(19), math.radians(-5)), bevel=0.004)
        _box("back_sword_guard", (0.20, 0.05, 0.045), (0.12, 0.145, 0.49), gold, body,
             rot=(0, 0, math.radians(-5)), bevel=0.006)
        _box("back_sword_grip", (0.045, 0.045, 0.20), (0.10, 0.14, 0.37), shoe, body,
             rot=(0, 0, math.radians(-5)), bevel=0.004)
        gourd = material("v25_gourd", "#a77937", 0.5)
        _cylinder_extrusion("mentor_gourd_loop_cut", [(0.55, 0.055, 0.055),
                                                        (0.60, 0.105, 0.09),
                                                        (0.69, 0.115, 0.095),
                                                        (0.76, 0.065, 0.062),
                                                        (0.83, 0.045, 0.042)], gourd, body, 8)
        gb = bpy.data.objects.get("mentor_gourd_loop_cut")
        if gb:
            gb.location.x = -0.29
            gb.location.y = -0.045
        _cylinder_extrusion("gourd_neck", [(0.80, 0.025, 0.025), (0.87, 0.028, 0.028),
                                           (0.90, 0.02, 0.02)], gold, body, 8)
        gn = bpy.data.objects.get("gourd_neck")
        if gn:
            gn.location.x = -0.29
            gn.location.y = -0.045

    # Keep a raised sword hidden in idle/walk; it is only used in the optional
    # isolated attack-pose still, never exported as a game sprite.
    attack_weapon = []
    if kind == "swordsman":
        pivot = arm_pivots["R"]
        attack_weapon.append(_box("attack_sword_blade", (0.055, 0.035, 0.52),
                                  (0.18, -0.04, -0.67), metal, pivot,
                                  rot=(0, math.radians(10), 0), bevel=0.003))
        attack_weapon.append(_box("attack_sword_guard", (0.17, 0.04, 0.035),
                                  (0.18, -0.04, -0.40), gold, pivot, bevel=0.004))
        for obj in attack_weapon:
            obj.hide_render = True

    root["character_type"] = kind
    root["modeling_method"] = "Extruded Cube/Cylinder profiles; loop-cut rings; Mirror X on symmetric clothing"
    root["silhouette_feature"] = {
        "male": "broad shoulders + straight tunic + topknot",
        "female": "narrow shoulders + extra-wide A-line skirt + bell sleeves + prominent twin buns",
        "swordsman": "wide straw hat + beard + back sword",
    }[kind]
    root["runtime_integrated"] = False
    rig = {"root": root, "body": body, "arms": arm_pivots,
           "legs": leg_pivots, "attack_weapon": attack_weapon, "kind": kind}
    pose_character(rig, "idle")
    return root, rig


def pose_character(rig, pose="idle"):
    """Set an optional frozen sample pose; no animation/runtime data is exported."""
    if pose not in ("idle", "walk", "attack"):
        raise ValueError("pose must be idle, walk, or attack")
    body = rig["body"]
    body.location = (0, 0, 0)
    body.rotation_euler = (0, 0, 0)
    for pivot in rig["arms"].values():
        pivot.rotation_euler = (0, 0, 0)
    for pivot in rig["legs"].values():
        pivot.rotation_euler = (0, 0, 0)
    for obj in rig["attack_weapon"]:
        obj.hide_render = pose != "attack"
    if pose == "walk":
        body.location.z = 0.025
        rig["legs"]["L"].rotation_euler.x = math.radians(-23)
        rig["legs"]["R"].rotation_euler.x = math.radians(23)
        rig["arms"]["L"].rotation_euler.x = math.radians(12)
        rig["arms"]["R"].rotation_euler.x = math.radians(-12)
    elif pose == "attack":
        rig["arms"]["R"].rotation_euler.y = math.radians(-118)
        rig["arms"]["L"].rotation_euler.x = math.radians(-15)
        rig["legs"]["L"].rotation_euler.x = math.radians(-8)
        body.rotation_euler.z = math.radians(-6)

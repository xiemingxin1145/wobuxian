"""Render A/B and frozen-pose samples with the repository's art/lib.py pipeline.

Run (Blender 4.2):
  blender -b -t 2 -P art/prototypes/openworld_v25/render_compare.py -- --out art/out/openworld_v25
The source produces offline PNGs and an editable .blend working scene only. It does
not modify art/chars.py, www/assets, or the game's runtime.
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "../../.."))
ART = os.path.join(ROOT, "art")
sys.path.insert(0, ART)
sys.path.insert(0, HERE)

import bpy
import chars
import specs
import lib
from character_models import build_lowpoly, pose_character

ARGS = lib.args()
OUT = os.path.abspath(ARGS.get("out", os.path.join(ART, "out", "openworld_v25")))
FRAMES = os.path.join(OUT, "frames")
os.makedirs(FRAMES, exist_ok=True)

# Keep the art pipeline's default quality and unit scale unless the caller overrides it.
os.environ.setdefault("WBX_SAMPLES", "24")
os.environ.setdefault("WBX_THREADS", "2")
DIRECTION = "S"
angle = math.atan2(specs.DIRV[DIRECTION][1], specs.DIRV[DIRECTION][0]) + math.pi / 2
CAMERA_ORTHO = 176.0 / lib.P
RENDER_W, RENDER_H = 320, 352   # 2x sampling of the normal 160x176 sprite frame.


def _render_one(label, source, kind, pose="idle"):
    lib.reset()
    lib.lights()
    if source == "current":
        sid = {"male": "player_m0", "female": "player_f0", "swordsman": "npc_mentor"}[kind]
        spec = specs.SPRITES[sid]
        rig = chars.chibi(spec["spec"], scale=1.2 * spec.get("scale", 1.0))
        root = rig.root
        chars.pose(rig, "idle", 0, spec["anims"].get("idle", 4))
    else:
        root, rig = build_lowpoly(kind)
        pose_character(rig, pose)
    root.rotation_euler = (0, 0, angle)
    lib.camera(RENDER_W, RENDER_H, anchor=(0.5, 0.86),
               ortho_scale=CAMERA_ORTHO)
    path = os.path.join(FRAMES, label + ".png")
    lib.render(path)
    print("RENDERED", label, path, flush=True)


for kind in ("male", "female", "swordsman"):
    _render_one(kind + "_current_idle", "current", kind)
    for pose in ("idle", "walk", "attack"):
        _render_one(kind + "_lowpoly_" + pose, "sample", kind, pose)

# Save a single editable scene containing all three new models, all at source scale.
lib.reset()
lib.lights()
for kind, x in (("male", -2.8), ("female", 0.0), ("swordsman", 2.8)):
    root, rig = build_lowpoly(kind)
    root.location.x = x
    root.rotation_euler = (0, 0, angle)
lib.camera(1200, 760, anchor=(0.5, 0.84), target=(0, 0, 0),
           ortho_scale=12.5)
blend_path = os.path.join(HERE, "openworld_v25_models.blend")
os.makedirs(os.path.dirname(blend_path), exist_ok=True)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print("SAVED_EDITABLE_SCENE", blend_path, flush=True)

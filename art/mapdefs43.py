"""v3.9.3 自家洞府 dongfu（research_v22 §17）。渲染：WBX_SAMPLES=48 blender -b -P render_map.py -- --map dongfu"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mapdefs import gen, N

MAPS43 = [dict(
    id='dongfu', name='自家洞府', biome='sect', seed=431, base='s', alt=('g', 0.12),
    features=[
        ('rect', 0, 0, 21, 1, 'r'), ('rect', 0, 0, 1, 21, 'r'), ('rect', 20, 0, 21, 21, 'r'),  # 三面山壁
        ('rect', 7, 15, 13, 20, 's'),     # ① 门厅（青石）
        ('rect', 8, 8, 12, 12, 's'),      # ② 静室（中央石坪）
        ('circle', 10, 10, 1.2, 'w'),     # 静室灵泉
        ('rect', 2, 2, 7, 7, 'f'),        # ③ 灵田（东北角翻土地）
        ('rect', 14, 2, 19, 6, 's'),      # ④ 丹房/器室
        ('rect', 2, 9, 6, 14, 'g'),       # ⑤ 灵兽园（草地）
        ('rect', 15, 9, 19, 14, 's'),     # ⑥ 弟子院 / 练功场
        ('rect', 2, 16, 6, 20, 'g'),      # ⑦ 厢房（家眷）
        ('rect', 15, 16, 19, 20, 's'),    # ⑧ 神器阁 / 阵眼台
    ],
    paths=[('p', 10, 21, 10, 3), ('p', 3, 10, 18, 10), ('p', 4, 18, 16, 18)],
    props=[
        ['portal', 10, 20], ['noticeboard', 12, 17], ['stonelamp', 8, 16], ['stonelamp', 12, 19],  # ① 门厅
        ['mat', 9, 9], ['jade', 11, 11], ['incense', 10, 8],                                        # ② 静室
        ['herb', 3, 3], ['herb', 5, 3], ['herb', 3, 5], ['herb', 5, 5], ['herb', 6, 6], ['haystack', 2, 7],  # ③ 灵田
        ['furnace', 15, 3], ['bigfurnace', 18, 3], ['crates', 17, 5],                              # ④ 丹房/器室
        ['pavilion', 3, 12], ['bamboo', 2, 9],                                                      # ⑤ 灵兽园
        ['dummy', 17, 11], ['dummy', 18, 13], ['well', 15, 13],                                     # ⑥ 练功场
        ['house', 3, 17],                                                                           # ⑦ 厢房
        ['altar', 16, 17], ['obelisk', 18, 19], ['chest', 19, 16],                                  # ⑧ 神器阁 / 阵眼台 / 库房
    ],
    keep=[[10, 19], [10, 10], [4, 10], [17, 10], [4, 18], [17, 18], [16, 4], [4, 4]],
    scatter=[('bamboo', 4, 'g'), ('rock', 6, 'r'), ('mushroom', 3, 'g'), ('stonelamp', 2, 's')],
)]

if __name__ == '__main__':
    out = [gen(c) for c in MAPS43]
    os.makedirs(os.path.join(os.path.dirname(__file__), 'out'), exist_ok=True)
    path = os.path.join(os.path.dirname(__file__), 'out', 'maps43.json')
    import json
    json.dump(out, open(path, 'w'), ensure_ascii=False, indent=2)
    print('wrote', path, 'maps', [m['id'] for m in out])

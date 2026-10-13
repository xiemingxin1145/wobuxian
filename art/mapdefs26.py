"""v2.6 新增 3 张地图：剑冢秘境 / 乱星海 / 问道崖（03_扩展路线图 §3.1）

设计依据：03_扩展路线图_大自由.md §3.1 新增地图总表
- jianzhong 剑冢秘境：上古剑仙埋骨之地，层层剑碑，对应金丹境(need=3)，秘境入口（御剑/剑碑）
- luanxing 乱星海：海外群岛，散修混居，风浪险恶，对应元婴境(need=4)
- wendao 问道崖：绝顶崖台，传剑论道之地，云海环绕，对应渡劫境(need=6)，仪式之地

本文件与 art/mapdefs.py / mapdefs25.py 同风格扩展，不修改现有 MAPS 列表。
运行方式：python3 mapdefs26.py  →  生成 out/maps26.json（3 图布局）
渲染方式：WBX_SAMPLES=48 blender -b -P render_map.py -- --map jianzhong
  （render_map.py 读 out/maps.json，需先把 maps26.json 合并进 maps.json，见待渲染执行手册）
【待本机渲染】当前环境无 Blender，仅定义布局数据。
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mapdefs import gen, N  # 复用 gen() 生成器


MAPS26 = [
    # ---- 剑冢秘境：上古剑仙埋骨地，层层剑碑，剑阵森森 ----
    dict(
        id='jianzhong', name='剑冢秘境', biome='secret', seed=261, base='m', alt=('r', 0.18),
        features=[
            ('rect', 7, 8, 14, 13, 's'),        # 中央剑台（青石板）
            ('circle', 10, 10, 2.2, 'w'),        # 剑池（小水潭，寒光倒映）
            ('rect', 0, 0, 21, 1, 'g'),
            ('rect', 0, 20, 21, 21, 'g'),
        ],
        paths=[
            ('p', 10, 0, 10, 21),                # 南北主甬道（穿剑台）
            ('p', 3, 10, 18, 10),                # 东西甬道
        ],
        props=[
            ['portal', 10, 2],                   # 秘境入口（传送门）
            ['stele', 6, 6],                     # 剑碑（碑林）
            ['stele', 13, 6],
            ['stele', 6, 14],
            ['stele', 13, 14],
            ['stele', 8, 11],                    # 主剑碑（问道台前置）
            ['torch', 8, 8],                     # 长明灯
            ['torch', 12, 12],
            ['ruin', 5, 9],                      # 残剑冢
            ['ruin', 15, 11],
            ['chest', 4, 4],                     # 遗法宝宝箱
            ['chest', 17, 17],
            ['crystal', 5, 16],                  # 剑晶（幽蓝）
            ['crystal', 16, 5],
            ['noticeboard', 10, 18],              # 剑冢戒碑
        ],
        keep=[[10, 10], [10, 1], [10, 20]],
        scatter=[
            ('crystal', 6, 'mr'),
            ('crystal_b', 4, 'mr'),
            ('deadtree', 6, 'mr'),
            ('bonespike', 4, 'r'),
            ('rock', 4, 'mr'),
            ('mushroom', 3, 'm'),
        ],
    ),

    # ---- 乱星海：海外群岛，散修混居，风浪险恶 ----
    dict(
        id='luanxing', name='乱星海', biome='island', seed=277, base='a', alt=('g', 0.1),
        features=[
            ('rect', 0, 0, 21, 4, 'w'),          # 外围海水
            ('rect', 0, 17, 21, 21, 'w'),
            ('rect', 0, 0, 3, 21, 'w'),
            ('rect', 18, 0, 21, 21, 'w'),
            ('circle', 16, 5, 2.0, 'w'),          # 侧岛海湾
            ('circle', 5, 16, 1.8, 'w'),
            ('rect', 7, 9, 13, 12, 's'),          # 主岛码头石板
        ],
        paths=[
            ('p', 10, 13, 10, 17),                # 上岛栈桥
            ('p', 3, 10, 18, 10),                # 环岛路
        ],
        props=[
            ['boat', 10, 17],                    # 渡船（渡口）
            ['boat', 15, 18],
            ['pavilion', 5, 7],                  # 散修海楼
            ['pavilion', 14, 13],
            ['shop', 8, 8],                      # 散修杂货
            ['crates', 12, 11],                  # 货箱（跑商货物）
            ['crates', 7, 11],
            ['chest', 4, 5],                     # 海难遗箱
            ['coral', 17, 8],                    # 珊瑚（浅滩）
            ['shellrock', 4, 14],
            ['noticeboard', 10, 14],              # 海域告示
        ],
        keep=[[10, 10], [10, 16]],
        scatter=[
            ('palm', 8, 'ag'),
            ('coral', 6, 'a'),
            ('shellrock', 5, 'a'),
            ('rock', 4, 'ag'),
            ('bush', 4, 'g'),
        ],
    ),

    # ---- 问道崖：绝顶崖台，传剑论道之地，云海环绕 ----
    dict(
        id='wendao', name='问道崖', biome='heaven', seed=293, base='c', alt=None, keepPaths=False,
        features=[
            ('rect', 6, 4, 15, 14, 'j'),         # 崖顶玉阶台（论道台）
            ('circle', 10, 9, 2.6, 'c'),          # 问道台中央（云心）
        ],
        paths=[
            ('j', 10, 13, 10, 21),               # 登崖云阶
            ('j', 3, 9, 18, 9),                  # 论道环台
        ],
        props=[
            ['mat', 8, 8],                       # 论道蒲团（收徒/传剑处）
            ['mat', 12, 8],
            ['mat', 8, 11],
            ['mat', 12, 11],
            ['pavilion', 9, 5],                  # 问道亭
            ['cloudpillar', 6, 6],               # 云柱
            ['cloudpillar', 14, 6],
            ['cloudpillar', 6, 12],
            ['cloudpillar', 14, 12],
            ['jade', 10, 9],                     # 问道台玉碑
            ['fairypeach', 4, 17],               # 仙桃树
            ['fairypeach', 16, 17],
            ['noticeboard', 10, 13],              # 传剑戒条
        ],
        keep=[[10, 9], [10, 20]],
        scatter=[
            ('cloudpuff', 12, 'c'),
            ('crane', 4, 'c'),
            ('fairypeach', 3, 'c'),
        ],
    ),
]


if __name__ == '__main__':
    out = [gen(c) for c in MAPS26]
    out_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        'out', 'maps26.json'
    )
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    import json
    json.dump(out, open(out_path, 'w'), ensure_ascii=False)
    for m in out:
        print(m['id'], m['name'], len(m['props']), 'props')

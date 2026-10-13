"""v2.5 新增 3 张地图：万宝楼 / 逐鹿原 / 药王谷（§3.1 设计）

设计依据：03_扩展路线图_大自由.md §3.1 新增地图总表
- wanbao 万宝楼：奢华拍卖行/聚宝阁，金帛满堂，对应筑基境
- juluyuan 逐鹿原：开阔演武场，宗门大比擂台，旌旗猎猎
- yaowang 药王谷：药香弥漫的幽谷，药田连片

本文件与 art/mapdefs.py 同风格扩展，不修改现有 MAPS 列表。
运行方式：python3 mapdefs25.py  →  追加生成 out/maps25.json
渲染方式：WBX_SAMPLES=32 blender -b -P render_map25.py -- --map wanbao
【待本机渲染】当前环境无 Blender，仅定义布局数据。
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mapdefs import gen, N  # 复用 gen() 生成器


MAPS25 = [
    # ---- 万宝楼：奢华拍卖行，金帛满堂 ----
    dict(
        id='wanbao', name='万宝楼', biome='market', seed=201, base='s', alt=None,
        features=[
            ('rect', 5, 4, 16, 15, 's'),      # 主厅大理石地面
            ('circle', 10, 9, 3.2, 'p'),       # 中央拍卖台（圆形）
            ('rect', 0, 0, 21, 2, 'g'),        # 外围绿植
            ('rect', 0, 19, 21, 21, 'g'),
        ],
        paths=[
            ('p', 10, 0, 10, 21),              # 南北主通道
            ('p', 3, 10, 18, 10),              # 东西通道（穿过拍卖台两侧）
        ],
        props=[
            ['shop', 6, 5],                    # 东侧珍宝阁
            ['shop2', 13, 5],                  # 西侧灵药行
            ['teahouse', 6, 13],               # 南侧品鉴茶座
            ['stall_r', 8, 8],                 # 拍品展架（红）
            ['stall_y', 11, 8],                # 拍品展架（金）
            ['stall_b', 9, 11],                # 拍品展架（蓝）
            ['crates', 16, 12],                # 货箱
            ['crates', 4, 12],
            ['lanternpole', 7, 10],            # 宫灯
            ['lanternpole', 13, 10],
            ['noticeboard', 10, 14],           # 拍卖公告板
            ['furnace', 10, 6],                # 鎏金香炉
        ],
        keep=[[10, 10], [10, 20], [10, 1]],
        scatter=[
            ('lanternpole', 4, 's'),
            ('crates', 4, 's'),
            ('bush', 3, 'g'),
            ('willow', 2, 'g'),
        ],
    ),

    # ---- 逐鹿原：开阔演武场，宗门大比擂台 ----
    dict(
        id='juluyuan', name='逐鹿原', biome='village', seed=217, base='g', alt=('f', 0.06),
        features=[
            ('rect', 6, 6, 15, 15, 's'),       # 中央比武台（石板）
            ('circle', 10, 10, 2.8, 'p'),       # 擂台中心（土色）
            ('rect', 0, 0, 21, 1, 'g'),
            ('rect', 0, 20, 21, 21, 'g'),
        ],
        paths=[
            ('p', 10, 0, 10, 21),              # 南北中轴（入场大道）
            ('p', 2, 10, 19, 10),              # 东西通道
        ],
        props=[
            ['paifang', 8, 2],                 # 入口牌坊
            ['dummy', 7, 7],                   # 木桩人
            ['dummy', 13, 7],
            ['dummy', 7, 13],
            ['dummy', 13, 13],
            ['mat', 9, 9],                     # 蒲团（观战席）
            ['mat', 11, 9],
            ['mat', 9, 11],
            ['mat', 11, 11],
            ['bell', 10, 4],                   # 开赛钟
            ['noticeboard', 10, 16],            # 大比榜文
            ['crates', 4, 15],                  # 兵器架（货箱代）
            ['crates', 16, 15],
        ],
        keep=[[10, 10], [10, 1], [10, 18]],
        scatter=[
            ('pine', 8, 'g'),
            ('oak', 6, 'gf'),
            ('rock', 4, 'g'),
            ('bush', 6, 'gf'),
            ('fence', 6, 'g'),
        ],
    ),

    # ---- 药王谷：药香弥漫的幽谷，药田连片 ----
    dict(
        id='yaowang', name='药王谷', biome='village', seed=233, base='g', alt=('f', 0.12),
        features=[
            ('rect', 4, 5, 8, 9, 'd'),         # 药田 1（农田色）
            ('rect', 12, 5, 16, 9, 'd'),       # 药田 2
            ('rect', 6, 13, 10, 17, 'd'),      # 药田 3
            ('circle', 10, 11, 1.5, 'w'),       # 药泉（小水池）
            ('rect', 8, 3, 12, 4, 's'),        # 药庐前石板
        ],
        paths=[
            ('p', 10, 0, 10, 21),              # 入谷主路
            ('p', 2, 12, 18, 12),              # 横穿药田
        ],
        props=[
            ['house', 8, 3],                   # 药庐
            ['herb', 5, 6],                    # 药草
            ['herb', 7, 8],
            ['herb', 13, 6],
            ['herb', 15, 8],
            ['herb', 7, 14],
            ['herb', 9, 16],
            ['furnace', 11, 10],               # 炼丹炉
            ['well', 10, 12],                  # 药泉井
            ['basket', 4, 10],                 # 药篮（用 haystack 代）
            ['noticeboard', 10, 18],            # 采药须知
            ['bamboo', 3, 15],                  # 竹林
        ],
        keep=[[10, 10], [10, 1], [10, 19]],
        scatter=[
            ('bamboo', 8, 'g'),
            ('peach', 6, 'gf'),
            ('herb', 6, 'g'),                  # 野生药草
            ('bush', 8, 'gf'),
            ('rock', 3, 'g'),
            ('mushroom', 3, 'g'),
        ],
    ),
]


if __name__ == '__main__':
    out = [gen(c) for c in MAPS25]
    out_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        'out', 'maps25.json'
    )
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    import json
    json.dump(out, open(out_path, 'w'), ensure_ascii=False)
    for m in out:
        print(m['id'], m['name'], len(m['props']), 'props')
        print('\n'.join(m['tiles']))

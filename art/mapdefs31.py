"""3.1① 仙界四图：九重天 / 仙界坊市 / 瑶池 / 凌霄殿（仙界初开·九重天阙）

设计依据：3.1启动任务书 §阶段① 地图表
- jiuct 九重天：飞升入口，接引仙官·南云登记新来仙人，云海仙门，对应飞升境(need=7)
- xianfang 仙界坊市：仙商·钱小多，仙石当钱，接拍卖，对应地仙境(need=8)
- yaochi 瑶池：蟠桃会/仙泉，瑶池仙使，对应天仙境(need=9)
- lingxiao 凌霄殿：天庭中枢，太白金星掌朝仪，仙官 ladder，对应金仙境(need=10)

本文件与 art/mapdefs.py / mapdefs25.py / mapdefs26.py 同风格扩展，不修改现有 MAPS 列表。
运行方式：python3 mapdefs31.py  →  生成 out/maps31.json（4 图布局）
渲染方式：WBX_SAMPLES=48 blender -b -P render_map.py -- --map jiuct
  （render_map.py 读 out/maps.json，需先把 maps31.json 合并进 maps.json，见《待渲染执行手册》）
【待本机渲染】当前环境无 Blender，仅定义布局数据；游戏内已用程序占位底图先行可玩。
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mapdefs import gen  # 复用 gen() 生成器


MAPS31 = [
    # ---- 九重天：飞升第一站，云海托浮，南天门内接引 ----
    dict(
        id='jiuct', name='九重天', biome='heaven', seed=3101, base='h', alt=('w', 0.10),
        features=[
            ('rect', 7, 8, 14, 13, 'j'),          # 中央接引玉台（云阶）
            ('circle', 10, 10, 2.4, 'w'),         # 接引仙泉（小水潭）
            ('rect', 0, 0, 21, 1, 'c'),
            ('rect', 0, 20, 21, 21, 'c'),
        ],
        paths=[
            ('p', 10, 1, 10, 20),                  # 南北云阶主道
            ('p', 2, 10, 18, 10),                  # 东西云海甬道
        ],
        props=[
            ['tianmen', 8, 2],                     # 南天门（接引入口）
            ['jade', 10, 10],                      # 接引玉碑（仙门登记）
            ['cloudpillar', 5, 6],
            ['cloudpillar', 15, 6],
            ['cloudpillar', 5, 14],
            ['cloudpillar', 15, 14],
            ['crane', 7, 12],                      # 仙鹤
            ['crane', 13, 8],
            ['noticeboard', 10, 17],               # 飞升登记榜
        ],
        keep=[[10, 10], [10, 2], [10, 19]],
        scatter=[
            ('cloudpuff', 16, 'c'),
            ('crane', 5, 'c'),
            ('sundisk', 1, 'c'),
        ],
    ),
    # ---- 仙界坊市：仙商云集，仙石为货，接拍卖 ----
    dict(
        id='xianfang', name='仙界坊市', biome='heaven', seed=3102, base='h', alt=('w', 0.08),
        features=[
            ('rect', 4, 5, 17, 16, 'j'),          # 坊市天街（玉砖）
            ('rect', 9, 9, 12, 12, 'w'),           # 拍卖圆台
        ],
        paths=[
            ('p', 2, 10, 19, 10),                  # 天街主街
            ('p', 10, 2, 10, 19),                  # 南北穿市
        ],
        props=[
            ['shop', 5, 8],                        # 仙商摊位（占位，待渲染仙市铺面）
            ['shop', 15, 8],
            ['stall_r', 5, 12],
            ['stall_r', 15, 12],
            ['jade', 10, 10],                      # 拍卖玉台
            ['chest', 7, 15],                      # 仙石宝箱
            ['chest', 13, 5],
            ['noticeboard', 10, 17],               # 仙市公约榜
        ],
        keep=[[10, 10], [10, 1], [10, 20]],
        scatter=[
            ('cloudpuff', 10, 'c'),
            ('lanternpole', 8, 'c'),
        ],
    ),
    # ---- 瑶池：蟠桃园畔，仙泉氤氲，蟠桃盛会 ----
    dict(
        id='yaochi', name='瑶池', biome='heaven', seed=3103, base='h', alt=('w', 0.12),
        features=[
            ('circle', 10, 10, 4.5, 'w'),         # 瑶池仙泉（大水池）
            ('rect', 6, 16, 15, 19, 'j'),          # 蟠桃盛会宴台
        ],
        paths=[
            ('p', 10, 1, 10, 8),                    # 临池云阶
            ('p', 4, 17, 16, 17),                   # 宴台甬道
        ],
        props=[
            ['fairypeach', 4, 5],                   # 蟠桃树
            ['fairypeach', 16, 5],
            ['fairypeach', 4, 14],
            ['fairypeach', 16, 14],
            ['jade', 10, 17],                       # 盛会玉台
            ['crane', 7, 9],
            ['crane', 13, 11],
            ['cloudpillar', 6, 3],
            ['cloudpillar', 14, 3],
        ],
        keep=[[10, 17], [10, 9], [10, 1]],
        scatter=[
            ('cloudpuff', 14, 'c'),
            ('crane', 6, 'c'),
        ],
    ),
    # ---- 凌霄殿：天庭中枢，太白金星掌朝仪，仙官品阶 ----
    dict(
        id='lingxiao', name='凌霄殿', biome='heaven', seed=3104, base='h', alt=('w', 0.10),
        features=[
            ('rect', 6, 6, 15, 15, 'j'),           # 凌霄正殿（玉砖丹墀）
            ('rect', 9, 3, 12, 5, 'w'),             # 朝会丹陛
        ],
        paths=[
            ('p', 10, 1, 10, 20),                    # 登殿玉阶
            ('p', 3, 10, 17, 10),                    # 朝仪甬道
        ],
        props=[
            ['debtoffice', 10, 6],                  # 天庭中枢正殿（占位，待渲染凌霄殿）
            ['jade', 10, 10],                       # 太白金星论道玉台
            ['cloudpillar', 5, 7],
            ['cloudpillar', 15, 7],
            ['cloudpillar', 5, 13],
            ['cloudpillar', 15, 13],
            ['noticeboard', 10, 17],                 # 仙官品阶榜
            ['crane', 7, 10],
            ['crane', 13, 10],
        ],
        keep=[[10, 10], [10, 5], [10, 20]],
        scatter=[
            ('cloudpuff', 12, 'c'),
            ('sundisk', 1, 'c'),
            ('crane', 4, 'c'),
        ],
    ),
]


if __name__ == '__main__':
    out = [gen(c) for c in MAPS31]
    out_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        'out', 'maps31.json'
    )
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    import json
    json.dump(out, open(out_path, 'w'), ensure_ascii=False)
    for m in out:
        print(m['id'], m['name'], len(m['props']), 'props')

"""全部精灵目录：id → 构建方式、动画集、方向、帧尺寸"""
PL_ANIMS = {'idle': 4, 'walk': 6, 'attack': 5, 'hurt': 1}
NPC_ANIMS = {'idle': 4, 'walk': 6}
BOSS_ANIMS = {'idle': 4, 'attack': 5, 'hurt': 1}
DIRS5 = ['S', 'SW', 'W', 'NW', 'N']
# 世界朝向 (x,y)
DIRV = {'S': (1, -1), 'SW': (0, -1), 'W': (-1, -1), 'NW': (-1, 0), 'N': (-1, 1), 'NE': (0, 1), 'E': (1, 1), 'SE': (1, 0)}

def P(robe, robe2, trim, belt, **kw):
    d = dict(robe=robe, robe2=robe2, trim=trim, belt=belt); d.update(kw); return d

# 玩家：男/女 × 4 档服饰
TIERS = [
    dict(robe='#b8946a', robe2='#efe2c8', trim='#8a6a44', belt='#6a4a2a', pants='#5a4a3a', skirt=0.28),                                  # 凡人布衣
    dict(robe='#f4f6f2', robe2='#5fb3a0', trim='#3a9a86', belt='#3a9a86', cape=None, weapon='sword', skirt=0.3),                        # 宗门弟子
    dict(robe='#4a6fc8', robe2='#f4f0ff', trim='#ffd25e', belt='#ffd25e', cape='#2a3f80', weapon='sword', skirt=0.32),                 # 金丹华服
    dict(robe='#fbf7ee', robe2='#ffe6a0', trim='#ffcc40', belt='#ffcc40', cape='#ffe9c0', ribbon2='#9fe8ff', weapon='gsword', skirt=0.33),  # 仙衣（化神）
    dict(robe='#6a4ab8', robe2='#f0e8ff', trim='#e8d0ff', belt='#ffd25e', cape='#2a1a5a', ribbon2='#d0a0ff', weapon='gsword', skirt=0.34),  # 元婴紫袍（tier 4）
    dict(robe='#fffaf0', robe2='#ffd870', trim='#ffb020', belt='#ffb020', cape='#fff0c0', ribbon2='#ffe080', weapon='gsword', skirt=0.35, halo='#ffe08a'),  # 渡劫金身（tier 5）
]
SECT_TIER1 = {
    'b': dict(robe='#f4fff0', robe2='#ff9ec4', trim='#5fb860', belt='#5fb860', weapon='fan', skirt=0.3),     # 百草谷
    't': dict(robe='#2a1a2a', robe2='#c0303a', trim='#ff5050', belt='#ff5050', cape='#4a0a1a', weapon='sword', skirt=0.3),  # 天魔殿
}
SPRITES = {}
for g, gs in (('m', dict(hairstyle='bun', hair='#2a1b14', ribbon='#3a5a8a')), ('f', dict(hairstyle='pony', hair='#2a1610', ribbon='#e84a5f', long=True))):
    for i, t in enumerate(TIERS):
        sp = dict(t); sp.update(gs)
        if i >= 2: sp['hairstyle'] = 'crown' if g == 'm' else 'double'
        if g == 'f' and i >= 2: sp['long'] = True
        if g == 'f': sp['skirt'] = sp.get('skirt', 0.3) + 0.03
        SPRITES[f'player_{g}{i}'] = dict(kind='chibi', spec=sp, anims=PL_ANIMS)
    for k, t in SECT_TIER1.items():
        sp = dict(t); sp.update(gs)
        if g == 'f': sp['skirt'] = sp.get('skirt', 0.3) + 0.03
        SPRITES[f'player_{g}1{k}'] = dict(kind='chibi', spec=sp, anims=PL_ANIMS)

NPCS = {
    'mentor': dict(robe='#8a8f9a', robe2='#e8e4dc', trim='#5a5f6a', belt='#7a4a2a', hair='#3a3a3a', hat='straw', hairstyle='none', beard=True, beardc='#5a5a5a', left='gourd', back='sword', eyes='happy'),
    'mom': dict(robe='#c86a6a', robe2='#fff1e6', trim='#ffd9a0', belt='#ffd9a0', hair='#3a2418', hairstyle='bun', ribbon='#ffd9a0', long=True),
    'farmer': dict(robe='#7a9a5a', robe2='#e8dcc0', trim='#5a7a3a', belt='#6a4a2a', hair='#3a2a1a', hat='straw', hairstyle='short', weapon='hoe', beard=True, beardc='#8a8a8a'),
    'girl': dict(robe='#ff9ec4', robe2='#fff', trim='#ff6a9a', belt='#ffd25e', hair='#2a1b14', hairstyle='double', ribbon='#ff5a8a', headScale=1.05),
    'elder': dict(robe='#2f8a7a', robe2='#fff', trim='#ffd25e', belt='#ffd25e', hair='#e8e8e8', hairstyle='crown', beard=True, weapon='fan', cape='#1f5a50'),
    'sister': dict(robe='#ff8fb8', robe2='#fff6fa', trim='#ffd25e', belt='#ffffff', hair='#1a1418', hairstyle='pony', ribbon='#ff4a7a', long=True, weapon='sword', ribbon2='#ffc0d8'),
    'disciple': dict(robe='#f4f6f2', robe2='#5fb3a0', trim='#3a9a86', belt='#3a9a86', hair='#2a1b14', hairstyle='bun', ribbon='#3a9a86', back='sword'),
    'merchant': dict(robe='#e0a020', robe2='#fff3c0', trim='#c0302a', belt='#c0302a', hair='#4a2a1a', hairstyle='guan', hat='guan', weapon='abacus', fat=1.25, eyes='happy'),
    'alchemist': dict(robe='#c0402a', robe2='#ffe6c0', trim='#ffcc40', belt='#ffcc40', hair='#d0d0d0', hairstyle='bun', beard=True, left='gourd', cape='#8a2a1a'),
    'fisher': dict(robe='#4a7ab8', robe2='#e8f0ff', trim='#2a4a7a', belt='#e8c060', hair='#3a2a1a', hat='straw', hairstyle='short', left='basket'),
    'witch': dict(robe='#5a2a7a', robe2='#ffd0ff', trim='#c060ff', belt='#c060ff', hair='#c0c0e8', hairstyle='pony', long=True, horns='#3a1a4a', ribbon='#ff60c0', weapon='staff', eyes='round'),
    'dragongirl': dict(robe='#5ac8e8', robe2='#ffffff', trim='#ffd25e', belt='#ffd25e', hair='#3a7ad8', hairstyle='double', horns='#ffd25e', long=True, ribbon2='#bff0ff'),
    'villager': dict(robe='#a0785a', robe2='#efe2c8', trim='#6a4a2a', belt='#6a4a2a', hair='#4a3a2a', hairstyle='short'),
    # ---- v2.1 新角色 ----
    'aotian': dict(robe='#ffffff', robe2='#ffd25e', trim='#ffb020', belt='#ffb020', hair='#1a1a2a', hairstyle='crown', cape='#c0303a', weapon='gsword', eyes='angry', mouth='smile', ribbon='#c0303a'),   # 宿敌·龙傲天
    'lengyue': dict(robe='#e8f4ff', robe2='#9ad8ff', trim='#bfe8ff', belt='#bfe8ff', hair='#e8eef8', hairstyle='pony', long=True, hat='veil', ribbon2='#c8ecff', weapon='sword', eyes='closed', mouth='flat', eye='#3a6a9a'),  # 冷月仙子
    'ruyan': dict(robe='#c0303a', robe2='#2a1a1a', trim='#ffd25e', belt='#1a1a1a', hair='#2a1610', hairstyle='pony', long=True, ribbon='#1a1a1a', back='sword', weapon='gourd', eyes='happy'),  # 柳如烟
    'bailang': dict(robe='#f4fbff', robe2='#7fc8c0', trim='#5aa8a0', belt='#5aa8a0', hair='#1a1418', hairstyle='bun', hat='scholar', hatc='#4a8a88', weapon='fan', ribbon='#7fc8c0', long=True),  # 白玉郎
    'storyteller': dict(robe='#8a5a3a', robe2='#f0e0c0', trim='#c09050', belt='#c09050', hair='#5a5a5a', hairstyle='short', hat='scholar', hatc='#3a2a1a', beard=True, beardc='#b0b0b0', weapon='fan', eyes='happy'),  # 说书先生
    'xiaoer': dict(robe='#4a7ab8', robe2='#ffffff', trim='#ffffff', belt='#e8e8e8', hair='#2a1b14', hairstyle='short', left='basket', eyes='happy', mouth='open'),  # 茶馆小二
    'yaopu': dict(robe='#4a8a5a', robe2='#f4f0d8', trim='#c0a040', belt='#c0a040', hair='#6a6a6a', hairstyle='guan', hat='guan', weapon='abacus', beard=True, beardc='#888888', fat=1.15),  # 药铺掌柜
    'guzhu': dict(robe='#8ad08a', robe2='#ffe0f0', trim='#ff8fb8', belt='#ff8fb8', hair='#3a5a2a', hairstyle='double', long=True, hat='flower', flower='#ff9ec4', weapon='staff', ribbon2='#c8ffd0'),  # 百草谷主·花满蹊
    'keeper': dict(robe='#3a3a44', robe2='#8a8a90', trim='#5a5a60', belt='#5a5a60', hair='#888888', hat='hood', hood='#2a2a32', hairstyle='none', left='basket', eyes='closed', mouth='flat', beard=True, beardc='#9a9a9a'),  # 守墓人
    'judge': dict(robe='#6a1a1a', robe2='#1a1a1a', trim='#ffd25e', belt='#ffd25e', hair='#1a1a1a', hat='tall', hairstyle='none', weapon='book', left='abacus', eyes='angry', mouth='flat', skin='#f0e0e0', beard=True, beardc='#1a1a1a', fat=1.2),  # 讨债司判官·钱不够
    'baoxian': dict(robe='#ffcc40', robe2='#ffffff', trim='#c0302a', belt='#c0302a', hair='#2a1b14', hairstyle='guan', hat='guan', glasses=True, weapon='book', eyes='happy', mouth='open', fat=1.1),  # 天道保险·保真人
    'heixin': dict(robe='#4a2a5a', robe2='#d0c0e0', trim='#8a5aaa', belt='#8a5aaa', hair='#9a9a9a', hairstyle='crown', beard=True, beardc='#5a5a5a', weapon='fan', eyes='angry', cape='#2a1a3a'),  # 黑心长老
    'yuelao': dict(robe='#d0303a', robe2='#ffe0a0', trim='#ffd25e', belt='#ffd25e', hair='#f8f8f8', hairstyle='bun', beard=True, beardc='#ffffff', weapon='staff', left='book', eyes='happy', fat=1.1),  # 月老
    'mengpo': dict(robe='#6a5a7a', robe2='#e0d8e8', trim='#a090b0', belt='#a090b0', hair='#d8d8d8', hairstyle='bun', ribbon='#6a5a7a', left='gourd', eyes='happy'),  # 孟婆
    'luren': dict(robe='#9a9a8a', robe2='#e8e8d8', trim='#7a7a6a', belt='#7a7a6a', hair='#3a3a3a', hairstyle='short', left='basket', eyes='round', mouth='open'),  # 路人甲
    'qymaster': dict(robe='#ffffff', robe2='#5fb3a0', trim='#ffd25e', belt='#ffd25e', hair='#d8d8d8', hairstyle='crown', hat='crown2', hatc='#9ff0d8', beard=True, beardc='#f0f0f0', back='sword', weapon='fan', cape='#2f8a7a', ribbon2='#bff8e8'),  # 青云宗主·云鹤真人
    'tongzi': dict(robe='#fffaf0', robe2='#ffd25e', trim='#ffd25e', belt='#ffb020', hair='#2a1b14', hairstyle='double', weapon='abacus', headScale=1.08, ribbon='#ffb020'),  # 记账童子
}
# ---- v2.2 新角色 ----
NPCS.update({
    'taizi': dict(robe='#4ab0e8', robe2='#ffffff', trim='#ffd25e', belt='#ffd25e', hair='#2a6ad8', hairstyle='crown', horns='#ffe08a', cape='#1a5aa8', weapon='fan', eyes='happy', ribbon2='#bff0ff'),  # 龙宫太子·敖小白
    'sanniang': dict(robe='#3a1a4a', robe2='#c8a0e0', trim='#ff60c0', belt='#ff60c0', hair='#1a1018', hairstyle='pony', long=True, hat='hood', hood='#2a1030', weapon='abacus', eyes='happy', mouth='smile', skin='#f0e8f4'),  # 鬼市掌柜·阴三娘
    'zhuiming': dict(robe='#1a1a22', robe2='#c0303a', trim='#ffd25e', belt='#c0303a', hair='#1a1a1a', hat='tall', hairstyle='none', weapon='book', left='abacus', eyes='angry', mouth='flat', skin='#e8e4f0'),  # 催债司主簿·追命
    'tianbing': dict(robe='#d8b040', robe2='#f4f0e0', trim='#c0302a', belt='#c0302a', hair='#1a1a1a', hairstyle='guan', hat='crown2', hatc='#ffd25e', weapon='gsword', cape='#c0302a', eyes='angry', mouth='flat'),  # 天兵甲
    'xiaoyao': dict(robe='#9ac0a0', robe2='#f4f8f0', trim='#5a8a6a', belt='#5a8a6a', hair='#d8d8d8', hat='straw', hairstyle='bun', beard=True, beardc='#e8e8e8', left='gourd', weapon='fan', eyes='closed', mouth='smile'),  # 逍遥散人
    'guanghan': dict(robe='#f4f8ff', robe2='#c8d8ff', trim='#9ab0ff', belt='#9ab0ff', hair='#1a1a2a', hairstyle='double', long=True, hat='flower', flower='#e8f0ff', ribbon2='#e0e8ff', halo='#e8f0ff', eyes='happy'),  # 广寒仙子
    'caishen': dict(robe='#e02a2a', robe2='#ffd25e', trim='#ffd25e', belt='#ffd25e', hair='#1a1a1a', hairstyle='guan', hat='crown2', hatc='#ffd25e', beard=True, beardc='#1a1a1a', weapon='abacus', fat=1.3, eyes='happy', mouth='open'),  # 财神
    'leigong': dict(robe='#3a4ab8', robe2='#ffe040', trim='#ffe040', belt='#ffe040', hair='#e8e8ff', hairstyle='crown', horns='#ffe040', cape='#1a2a7a', weapon='staff', eyes='angry', mouth='open'),  # 雷公
    'suanpan': dict(robe='#8a5a2a', robe2='#ffe6b0', trim='#3a2a1a', belt='#3a2a1a', hair='#3a2a1a', hairstyle='short', glasses=True, weapon='abacus', left='book', eyes='round', headScale=1.06),  # 天道会计·算无遗
    'guizu': dict(robe='#2a3a3a', robe2='#8ab0a0', trim='#4a6a6a', belt='#4a6a6a', hair='#1a1a1a', hat='hood', hood='#1a2a2a', hairstyle='none', weapon='claw', eyes='angry', mouth='flat', skin='#b8d0c8'),  # 鬼卒
    'xiabing': dict(robe='#ff8a5a', robe2='#ffe0d0', trim='#c04a2a', belt='#c04a2a', hair='#ff6a3a', hairstyle='short', ears='fox', weapon='staff', eyes='round', mouth='open'),  # 虾兵
    'baiwuchang': dict(robe='#f4f4f4', robe2='#c8c8c8', trim='#1a1a1a', belt='#1a1a1a', hair='#e8e8e8', hat='tall', hairstyle='none', weapon='book', eyes='closed', mouth='smile', skin='#f8f8ff'),  # 白无常·谢必安（勾魂不勾债）
})
FIGHTERS = {'aotian', 'lengyue', 'ruyan', 'judge', 'heixin', 'bailang', 'zhuiming', 'tianbing', 'leigong', 'guizu', 'xiabing', 'taizi'}  # 会参与战斗的人物：带攻击动作
for k, v in NPCS.items(): SPRITES['npc_' + k] = dict(kind='chibi', spec=v, anims=PL_ANIMS if k in FIGHTERS else NPC_ANIMS)

CHIBI_MON = {
    'collector': dict(robe='#34343e', robe2='#d8d8d8', trim='#c0302a', belt='#c0302a', hair='#1a1a1a', hat='tall', hairstyle='none', weapon='book', eyes='angry', mouth='flat', skin='#e8e4f0'),
    'fox': dict(robe='#ffffff', robe2='#ff6a8a', trim='#ff6a8a', belt='#ff6a8a', hair='#ff9a3c', ears='fox', tails=3, hairstyle='pony', long=True, weapon='claw', eyes='round'),
    'jiangshi': dict(robe='#3a4a6a', robe2='#c0a040', trim='#c0a040', belt='#c0a040', hair='#1a1a1a', hat='jiangshi', hairstyle='none', skin='#b8d8b0', eyes='closed', mouth='flat', armsForward=True),
    'demon': dict(robe='#2a1a3a', robe2='#8a2a5a', trim='#c040ff', belt='#c040ff', hair='#e0e0f0', hat='hood', hood='#2a1a3a', hairstyle='none', horns='#4a1a2a', weapon='staff', eyes='angry', mouth='flat'),
}
for k, v in CHIBI_MON.items(): SPRITES['mon_' + k] = dict(kind='chibi', spec=v, anims=PL_ANIMS)
MOUNT_ANIMS = {'idle': 4}
for k in ('cloud', 'fsword', 'gourd', 'crane'):
    SPRITES['mount_' + k] = dict(kind='mon', mon='m_' + k, anims=MOUNT_ANIMS)
for k in ('slime', 'paper', 'boar', 'rock', 'fire', 'treant', 'crab', 'ghost'):
    SPRITES['mon_' + k] = dict(kind='mon', mon=k, anims=PL_ANIMS)
# BOSS（只渲染战斗朝向 SE，帧更大）
SPRITES['boss_tiandao'] = dict(kind='mon', mon='tiandao', anims=BOSS_ANIMS, dirs=['SE'], big=True, scale=1.5)
SPRITES['boss_dragon'] = dict(kind='mon', mon='dragon', anims=BOSS_ANIMS, dirs=['SE'], big=True, scale=1.5)
SPRITES['boss_corpse'] = dict(kind='chibi', spec=dict(robe='#5a2a2a', robe2='#ffd25e', trim='#ffd25e', belt='#ffd25e', hair='#1a1a1a', hat='jiangshi', hairstyle='none', skin='#a8c8a0', eyes='angry', mouth='open', armsForward=True, cape='#2a0a0a', weapon='claw', left='claw', fat=1.2), anims=BOSS_ANIMS, dirs=['SE'], big=True, scale=2.0)
SPRITES['boss_mozun'] = dict(kind='chibi', spec=dict(robe='#1a1022', robe2='#c0303a', trim='#ff4040', belt='#ff4040', hair='#f0f0f0', hairstyle='pony', long=True, horns='#2a0a1a', cape='#6a0a1a', weapon='gsword', eyes='angry', mouth='flat', ribbon2='#ff3040'), anims=BOSS_ANIMS, dirs=['SE'], big=True, scale=2.0)

# ---- v2.1 时装（男/女各一套） ----
COSTUME_SPECS = {
    'xifu': dict(robe='#d8202a', robe2='#ffd25e', trim='#ffd25e', belt='#ffd25e', cape='#a0101a', ribbon2='#ffcf5a', skirt=0.34, hat='crown2', hatc='#ffcf4a'),
    'xiake': dict(robe='#2a2a30', robe2='#8a8a90', trim='#c0302a', belt='#c0302a', hat='straw', left='gourd', back='sword', skirt=0.3, cape='#4a4a52'),
    'yuyi': dict(robe='#ffffff', robe2='#1a1a1a', trim='#e0202a', belt='#e0202a', cape='#f4f4f4', ribbon2='#ffe0e0', weapon='fan', skirt=0.36, halo='#ffffff'),
    'mowang': dict(robe='#1a1022', robe2='#7a2aaa', trim='#c060ff', belt='#c060ff', horns='#2a0a3a', cape='#3a0a4a', weapon='gsword', eyes='angry', skirt=0.33),
    'taohua': dict(robe='#ffc0d8', robe2='#ffffff', trim='#ff7aa8', belt='#ff7aa8', hat='flower', flower='#ff9ec4', ribbon2='#ffd8e8', weapon='fan', skirt=0.34),
    'longpao': dict(robe='#ffcf3a', robe2='#c0302a', trim='#c0302a', belt='#c0302a', hat='crown2', hatc='#ffd25e', horns='#ffe08a', cape='#c0302a', weapon='gsword', skirt=0.35),
}
for cid, cs in COSTUME_SPECS.items():
    for g, gs in (('m', dict(hairstyle='bun', hair='#2a1b14', ribbon='#3a5a8a')), ('f', dict(hairstyle='double', hair='#2a1610', ribbon='#e84a5f', long=True))):
        sp = dict(cs); sp.update({k: v for k, v in gs.items() if k not in cs})
        if g == 'f': sp['skirt'] = sp.get('skirt', 0.3) + 0.03
        SPRITES[f'cos_{cid}_{g}'] = dict(kind='chibi', spec=sp, anims=PL_ANIMS)
for k in ('lotus', 'bowl'):
    SPRITES['mount_' + k] = dict(kind='mon', mon='m_' + k, anims=MOUNT_ANIMS)
# ---- v2.2 BOSS / 时装 / 坐骑 ----
SPRITES['boss_guiwang'] = dict(kind='chibi', spec=dict(robe='#1a1a2a', robe2='#6a3aaa', trim='#c060ff', belt='#c060ff', hair='#e0e0f0', hat='hood', hood='#120a1a', hairstyle='none', horns='#4a2a6a', cape='#2a0a3a', weapon='staff', left='abacus', eyes='angry', mouth='open', skin='#c8c0e0', fat=1.2), anims=BOSS_ANIMS, dirs=['SE'], big=True, scale=2.0)
SPRITES['boss_dasiming'] = dict(kind='chibi', spec=dict(robe='#0a0a10', robe2='#c0303a', trim='#ffd25e', belt='#ffd25e', hair='#1a1a1a', hat='tall', hairstyle='none', weapon='gsword', left='book', cape='#6a0a1a', eyes='angry', mouth='flat', beard=True, beardc='#1a1a1a', fat=1.25), anims=BOSS_ANIMS, dirs=['SE'], big=True, scale=2.0)
SPRITES['boss_tiandao2'] = dict(kind='chibi', spec=dict(robe='#ffffff', robe2='#ffd25e', trim='#ffd25e', belt='#ffd25e', hair='#ffffff', hairstyle='crown', hat='crown2', hatc='#ffe080', halo='#fff2a0', cape='#ffe8a0', weapon='abacus', left='book', eyes='closed', mouth='smile', skin='#fff8f0'), anims=BOSS_ANIMS, dirs=['SE'], big=True, scale=2.2)
COSTUME22 = {
    'longwang': dict(robe='#3a8ae8', robe2='#ffffff', trim='#ffd25e', belt='#ffd25e', horns='#ffe08a', cape='#1a4aa8', ribbon2='#bff0ff', weapon='fan', skirt=0.34),
    'guishi': dict(robe='#2a1a3a', robe2='#c8a0e0', trim='#ff60c0', belt='#ff60c0', hat='hood', hood='#1a1028', cape='#1a0a28', weapon='abacus', skirt=0.32),
    'tianjia': dict(robe='#d8b040', robe2='#f4f0e0', trim='#c0302a', belt='#c0302a', hat='crown2', hatc='#ffd25e', cape='#c0302a', weapon='gsword', skirt=0.3),
    'caishen': dict(robe='#e02a2a', robe2='#ffd25e', trim='#ffd25e', belt='#ffd25e', hat='crown2', hatc='#ffd25e', weapon='abacus', skirt=0.35, fat=1.15),
}
for cid, cs in COSTUME22.items():
    COSTUME_SPECS[cid] = cs
    for g, gs in (('m', dict(hairstyle='bun', hair='#2a1b14', ribbon='#3a5a8a')), ('f', dict(hairstyle='double', hair='#2a1610', ribbon='#e84a5f', long=True))):
        sp = dict(cs); sp.update({k: v for k, v in gs.items() if k not in cs})
        if g == 'f': sp['skirt'] = sp.get('skirt', 0.3) + 0.03
        SPRITES[f'cos_{cid}_{g}'] = dict(kind='chibi', spec=sp, anims=PL_ANIMS)
for k in ('carp', 'abacus'):
    SPRITES['mount_' + k] = dict(kind='mon', mon='m_' + k, anims=MOUNT_ANIMS)


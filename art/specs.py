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
    dict(robe='#fbf7ee', robe2='#ffe6a0', trim='#ffcc40', belt='#ffcc40', cape='#ffe9c0', ribbon2='#9fe8ff', weapon='gsword', skirt=0.33),  # 仙衣
]
SPRITES = {}
for g, gs in (('m', dict(hairstyle='bun', hair='#2a1b14', ribbon='#3a5a8a')), ('f', dict(hairstyle='pony', hair='#2a1610', ribbon='#e84a5f', long=True))):
    for i, t in enumerate(TIERS):
        sp = dict(t); sp.update(gs)
        if i >= 2: sp['hairstyle'] = 'crown' if g == 'm' else 'double'
        if g == 'f' and i >= 2: sp['long'] = True
        if g == 'f': sp['skirt'] = sp.get('skirt', 0.3) + 0.03
        SPRITES[f'player_{g}{i}'] = dict(kind='chibi', spec=sp, anims=PL_ANIMS)

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
}
for k, v in NPCS.items(): SPRITES['npc_' + k] = dict(kind='chibi', spec=v, anims=NPC_ANIMS)

CHIBI_MON = {
    'collector': dict(robe='#34343e', robe2='#d8d8d8', trim='#c0302a', belt='#c0302a', hair='#1a1a1a', hat='tall', hairstyle='none', weapon='book', eyes='angry', mouth='flat', skin='#e8e4f0'),
    'fox': dict(robe='#ffffff', robe2='#ff6a8a', trim='#ff6a8a', belt='#ff6a8a', hair='#ff9a3c', ears='fox', tails=3, hairstyle='pony', long=True, weapon='claw', eyes='round'),
    'jiangshi': dict(robe='#3a4a6a', robe2='#c0a040', trim='#c0a040', belt='#c0a040', hair='#1a1a1a', hat='jiangshi', hairstyle='none', skin='#b8d8b0', eyes='closed', mouth='flat', armsForward=True),
    'demon': dict(robe='#2a1a3a', robe2='#8a2a5a', trim='#c040ff', belt='#c040ff', hair='#e0e0f0', hat='hood', hood='#2a1a3a', hairstyle='none', horns='#4a1a2a', weapon='staff', eyes='angry', mouth='flat'),
}
for k, v in CHIBI_MON.items(): SPRITES['mon_' + k] = dict(kind='chibi', spec=v, anims=PL_ANIMS)
for k in ('slime', 'paper', 'boar', 'rock', 'fire', 'treant', 'crab', 'ghost'):
    SPRITES['mon_' + k] = dict(kind='mon', mon=k, anims=PL_ANIMS)
# BOSS（只渲染战斗朝向 SE，帧更大）
SPRITES['boss_tiandao'] = dict(kind='mon', mon='tiandao', anims=BOSS_ANIMS, dirs=['SE'], big=True, scale=1.5)
SPRITES['boss_dragon'] = dict(kind='mon', mon='dragon', anims=BOSS_ANIMS, dirs=['SE'], big=True, scale=1.5)
SPRITES['boss_corpse'] = dict(kind='chibi', spec=dict(robe='#5a2a2a', robe2='#ffd25e', trim='#ffd25e', belt='#ffd25e', hair='#1a1a1a', hat='jiangshi', hairstyle='none', skin='#a8c8a0', eyes='angry', mouth='open', armsForward=True, cape='#2a0a0a', weapon='claw', left='claw', fat=1.2), anims=BOSS_ANIMS, dirs=['SE'], big=True, scale=2.0)
SPRITES['boss_mozun'] = dict(kind='chibi', spec=dict(robe='#1a1022', robe2='#c0303a', trim='#ff4040', belt='#ff4040', hair='#f0f0f0', hairstyle='pony', long=True, horns='#2a0a1a', cape='#6a0a1a', weapon='gsword', eyes='angry', mouth='flat', ribbon2='#ff3040'), anims=BOSS_ANIMS, dirs=['SE'], big=True, scale=2.0)

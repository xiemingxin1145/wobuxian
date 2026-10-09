"""事件CG（剧情插画）布景：地图场景 + 角色 + 透视镜头。
chars: (精灵id, i, j, 朝向: 'cam' 或角度(度, 0=朝+i), 动作, 帧, 缩放)
cam: 目标格(i, j, z)、方位角az(度)、仰角el(度)、距离、焦距"""
CGS = {
    'cg_debt': dict(map='village', chars=[('player_m0', 10.9, 17.0, 'cam', 'idle', 1, 0.8), ('npc_mom', 11.5, 16.3, 'cam', 'idle', 0, 1), ('mon_collector', 9.2, 17.9, -30, 'attack', 2, 1.1)],
                    cam=((10.4, 17.2, 0.6), -60, 13, 7.5, 40), sky=('#9fd4ff', '#fff4e0')),
    'cg_mentor': dict(map='village', chars=[('npc_mentor', 9.6, 8.6, 'cam', 'idle', 1, 1.1), ('player_m0', 10.8, 9.6, 135, 'idle', 0, 0.85)],
                      cam=((10.0, 9.0, 0.7), -55, 12, 5.5, 45), sky=('#ffb878', '#ffe8c8')),
    'cg_sect': dict(map='sect', chars=[('player_m1', 10.0, 16.0, 90, 'idle', 0, 1), ('npc_qymaster', 10.0, 12.6, 'cam', 'idle', 1, 1.1), ('npc_disciple', 8.6, 13.2, 'cam', 'idle', 2, 1), ('npc_sister', 11.4, 13.2, 'cam', 'idle', 3, 1)],
                    cam=((10.0, 13.8, 1.0), -80, 10, 7.5, 35), sky=('#8fc8ff', '#f4fbff')),
    'cg_rival': dict(map='sect', chars=[('player_m1', 14.2, 10.6, 160, 'attack', 2, 1), ('npc_aotian', 12.2, 9.8, -20, 'attack', 3, 1)],
                     cam=((13.2, 10.2, 0.6), -95, 6, 5.2, 35), sky=('#ffb070', '#ffe0b0')),
    'cg_market': dict(map='market', chars=[('player_f1', 10.5, 10.5, 'cam', 'idle', 0, 1), ('npc_merchant', 9.0, 9.0, 'cam', 'idle', 1, 1), ('npc_ruyan', 11.8, 9.6, 'cam', 'idle', 2, 1), ('npc_bailang', 8.6, 11.2, 30, 'idle', 3, 1)],
                      cam=((10.2, 10.0, 0.8), -50, 14, 8.0, 38), sky=('#ffa070', '#ffe8c8')),
    'cg_corpse': dict(map='graveyard', chars=[('boss_corpse', 10.5, 7.0, 'cam', 'attack', 2, 1), ('player_m2', 11.0, 10.5, 110, 'attack', 1, 1)],
                      cam=((10.6, 8.6, 1.0), -60, 10, 7.5, 35), sky=('#3a4a5a', '#8a96a8')),
    'cg_dragon': dict(map='island', chars=[('boss_dragon', 10.5, 9.5, 'cam', 'idle', 1, 1), ('player_f3', 12.0, 12.6, 120, 'attack', 2, 1)],
                      cam=((11.0, 11.0, 1.2), -45, 12, 9.0, 35), sky=('#4ab8ff', '#e8fcff')),
    'cg_mozun': dict(map='rift', chars=[('boss_mozun', 10.5, 7.5, 'cam', 'attack', 2, 1), ('player_m4', 10.8, 11.0, 95, 'attack', 3, 1)],
                     cam=((10.6, 9.2, 1.0), -70, 8, 8.0, 35), sky=('#3a0a1a', '#c8502a')),
    'cg_tiandao': dict(map='heaven', chars=[('boss_tiandao', 10.5, 7.0, 'cam', 'idle', 1, 1), ('player_f5', 10.6, 11.0, 90, 'idle', 0, 1), ('npc_judge', 12.4, 8.6, 'cam', 'idle', 2, 1)],
                       cam=((10.6, 9.0, 1.4), -80, 6, 9.0, 32), sky=('#ffe8a0', '#ffffff')),
    'cg_lengyue': dict(map='island', chars=[('npc_lengyue', 9.0, 15.4, 'cam', 'idle', 1, 1), ('player_m3', 10.6, 16.6, 150, 'idle', 0, 1)],
                       cam=((9.6, 15.6, 0.7), -10, 8, 6.0, 40), sky=('#0a1a3a', '#4a6aa8'), night=True),
    'cg_ascend': dict(map='heaven', chars=[('player_m5', 10.5, 10.5, 'cam', 'idle', 1, 1.2), ('mount_crane', 10.5, 10.5, 'cam', 'idle', 0, 1.2)],
                      cam=((10.5, 10.5, 1.3), -60, 6, 8.0, 35), sky=('#fff0b0', '#ffffff'), pillar=True),
    'cg_judge': dict(map='heaven', chars=[('npc_judge', 9.0, 5.8, 'cam', 'idle', 1, 1.1), ('player_m5', 10.2, 8.0, 120, 'idle', 0, 1), ('npc_baoxian', 11.4, 6.6, 'cam', 'idle', 2, 1)],
                     cam=((9.8, 7.0, 1.0), -55, 9, 6.5, 38), sky=('#fff2c8', '#ffffff')),
}

# 《我不仙》AI 插画清单（art/gen/NEEDED.md）

把生成好的图按下面的**文件名**放进 `art/gen/`，然后运行 `python3 tools/gen_art.py`（加 `--debug` 会输出人脸框检查图）。
命名即映射：`npc_* / boss_* / player_* / cos_* / mon_* / mount_*` 自动对应同名头像键；`cg_*` 替换章节/结局插画；`map_*` 用于地图横幅与世界地图；`icon_*` 覆盖同名道具/技能图标。
人脸定位不准时，在 `art/gen/map.json` 里给该文件加 `"face": [cx, cy, size]`（原图像素）。

**统一风格（每条描述前都加上）**：painterly semi-realistic xianxia illustration, soft cinematic light, rich but clean colors, detailed hanfu costume, consistent with existing set (player_m1 / mentor / heroine / boss_tiandao / rival); lighthearted world where the Heavenly Dao is a loan shark — characters can carry ledgers, IOUs, abacuses, but keep them dignified, not chibi.
**规格**：角色 1280x720 横图，人物全身或大半身站在画面中间 1/2 内、头部在上 1/4（方便自动裁头像/半身/卡面）；CG 与地图 1920x1080（≥1280x720）横图；图标 512x512 方图，单个物体居中，纯色或透明背景。

已完成：player_m1.jpg（男主·弟子）、mentor.jpg（落魄剑仙，同时用于 mentor2）、heroine.jpg（冷月仙子）、boss_tiandao.jpg（讨尾款的天道，暂时也用于天道真身）、rival.jpg（龙傲天）。

## 1. 主角（按境界换装；0=孩童，1=宗门弟子，2=金丹/元婴，3=化神以上）
| 文件名 | 描述 |
|---|---|
| player_m0.jpg | 6-year-old village boy, messy topknot, patched brown cotton tunic, bare feet, holding a broom, peach blossoms behind, cheeky determined grin |
| player_m2.jpg | young male cultivator (golden core), sky-blue and silver layered robes, jade hairpiece, flying sword circling him, confident calm, sea clouds |
| player_m3.jpg | male immortal-to-be, flowing white-gold robes with cloud embroidery, faint halo of lightning scars, serene powerful gaze, heavenly gate in mist |
| player_f0.jpg | 6-year-old village girl, twin buns with red strings, patched pink tunic, clutching a wooden ladle, peach blossoms, stubborn pout |
| player_f1.jpg | young female sect disciple, white-and-jade hanfu matching player_m1, long black hair half-up, slim sword at waist, bright eyes, misty peaks |
| player_f2.jpg | female cultivator (golden core), lavender and silver robes, crescent hairpin, flying sword trail, elegant confident smile, sea of clouds |
| player_f3.jpg | female immortal-to-be, white-gold layered robes, glowing lotus aura, lightning-tempered calm expression, heavenly gate in mist |

## 2. NPC（文件名 = 头像键）
| 文件名 | 角色 | 描述 |
|---|---|---|
| npc_mom.jpg | 娘 | warm middle-aged village mother, plain blue headscarf, apron over hemp dress, holding a steaming bowl of herb soup, worried but loving smile, cottage doorway |
| npc_farmer.jpg | 王大爷 | old farmer with straw hat and white stubble, rolled sleeves, hoe on shoulder, guarding a peach tree, grumpy-kind face |
| npc_girl.jpg | 翠花 | lively village girl ~14, twin braids, green floral jacket, basket of peaches, mischievous wink |
| npc_storyteller.jpg | 说书先生 | thin storyteller in grey scholar robe, folding fan and wooden clapper, dramatic mid-tale gesture, teahouse lanterns |
| npc_qymaster.jpg | 掌门·云中鹤 | dignified sect master, white beard, crane-embroidered white-blue robe, horsetail whisk, secretly counting tuition fees on an abacus |
| npc_sister.jpg | 师姐·林小满 | cheerful senior sister, ponytail, sky-blue sect uniform, wooden practice sword, encouraging thumbs-up |
| npc_disciple.jpg | 师兄·萧逸 / 迷路的弟子 | earnest male disciple, blue-white sect uniform, scroll under arm, slightly lost expression, sect courtyard |
| npc_alchemist.jpg | 丹房长老 | portly alchemy elder, singed eyebrows, red-brown robe with soot, holding a smoking pill furnace lid, proud grin |
| npc_merchant.jpg | 奸商·钱多多 | plump sly merchant, gold-trimmed maroon robe, coin-shaped hat, abacus and stack of IOUs, shifty smile, market stall |
| npc_yaopu.jpg | 药铺掌柜·杜仲 | calm herbalist shopkeeper, green robe, spectacles, mortar and pestle, drawers of herbs behind |
| npc_xiaoer.jpg | 茶馆小二 | young teahouse waiter, towel over shoulder, teapot raised, cheeky grin, busy teahouse |
| npc_fisher.jpg | 钓鱼佬 / 老渔夫 | relaxed old fisherman, bamboo hat, long fishing rod, a glowing spirit fish on the line, river at dusk |
| npc_keeper.jpg | 守墓人 | gaunt graveyard keeper, black hooded robe, lantern with blue flame, shovel, eerie but gentle |
| npc_dragongirl.jpg | 龙女·敖小乐 | playful dragon princess, small horns, aquamarine scales on cheeks, sea-green silk dress with pearl strands, ocean palace |
| npc_guzhu.jpg | 百草谷主·花满蹊 | elegant valley master of herbs, flower crown, layered pastel robes, butterflies, blooming spirit garden |
| npc_witch.jpg | 魔女·苏魅 | seductive demon sorceress, crimson-black robes, red eye shadow, dark flame in palm, rift canyon behind |
| npc_tongzi.jpg | 仙官·记账童子 | small heavenly page boy with ledger bigger than himself, gold-white official cap, brush pen behind ear, clouds |
| npc_heixin.jpg | 黑心长老 | scheming elder, black-purple robe, narrow eyes, hidden contract up his sleeve, shadowy sect hall |
| npc_ruyan.jpg | 剑客·柳如烟 | cool swordswoman, dark teal travelling robe, bamboo hat with veil lifted, long sword, rainy market street |
| npc_bailang.jpg | 书生·白玉郎 | handsome bookish scholar, white robe with ink stains, scrolls and brush, shy smile, willow bridge |
| npc_baoxian.jpg | 天道保险·保真人 | smiling insurance salesman cultivator, neat gold-white robe, sash reading 保, stack of policy talismans, too-friendly grin |
| npc_mengpo.jpg | 孟婆 | kindly old woman of the underworld, dark robe, ladle and steaming soup bowl, bridge over misty river |
| npc_yuelao.jpg | 月老 | jolly old matchmaker god, red robe, long white beard, red threads tangled around his fingers, moon behind |
| npc_judge.jpg | 讨债司判官·钱不够 | stern heavenly debt judge, black official hat, red-black robe, giant brush and overdue ledger, fierce eyebrows |
| npc_luren.jpg | 路人甲 | very ordinary young villager, grey tunic, forgettable face, holding a blank name tag, slightly sad |
| npc_taizi.jpg | 龙宫太子·敖小白 | young dragon prince, white-silver hair, small horns, white-blue dragon robe, nervous about inherited debts, coral palace |
| npc_xiabing.jpg | 虾兵队长·阿虾 | shrimp soldier captain, red shell armour, spear, comically serious salute, underwater palace |
| npc_sanniang.jpg | 鬼市掌柜·阴三娘 | ghost-market pawnshop owner, pale beauty, dark violet qipao-style robe, pipe and abacus, paper lanterns |
| npc_guizu.jpg | 鬼卒·小六 | small ghost soldier, translucent blue skin, oversized helmet, chain and tally board, timid |
| npc_baiwuchang.jpg | 白无常 | tall white impermanence, white robe and tall hat reading 一见生财, long tongue, oddly polite smile |
| npc_xiaoyao.jpg | 逍遥散人 | carefree wandering immortal, loose grey-green robe, go board under arm, gourd, lying on a cloud |
| npc_caishen.jpg | 财神 | god of wealth, red-gold robe, ingot in hand, round cheerful face, surrounded by coins and IOUs he is owed |
| npc_zhuiming.jpg | 催债司主簿·追命 | sharp clerk of the debt bureau, dark blue official robe, rolled warrants, chain talisman, cold efficient look |
| npc_suanpan.jpg | 天道会计·算无遗 | meticulous heavenly accountant, spectacles, grey-gold robe, giant floating abacus, ink-stained fingers |
| npc_tianbing.jpg | 天兵甲 | heavenly soldier, gold armour, halberd, bored expression, clouds and gate |
| npc_leigong.jpg | 雷公 | thunder god, blue skin, bird-like beak, drum ring on back, hammer and chisel, crackling lightning, a bit near-sighted |
| npc_guanghan.jpg | 广寒仙子 | moon palace fairy, pale blue-white gown, jade rabbit, crescent moon, melancholic |
| npc_dianmu.jpg | 电母（新） | goddess of lightning, two mirrors flashing, purple-silver robes, hair crackling like wires, holding an electricity bill |
| npc_guichengxiang.jpg | 龟丞相（新） | old turtle chancellor, huge shell full of scrolls, green official robe, spectacles, back pain |
| npc_guolucai.jpg | 过路财（新） | toll-gate immortal, gold-trim official hat, toll booth with barrier pole at the Southern Heavenly Gate, ledger and stamp |
| mon_fox.jpg | 狐妖·阿离 | fox spirit girl, white fox ears and nine tails, red-white outfit, sly smile, spirit forest |
| mon_demon.jpg | 魔殿执事 / 小魔头 | small horned demon steward, black-red armour, ledger of demon debts, smug |

## 3. BOSS
| 文件名 | 描述 |
|---|---|
| boss_corpse.jpg | 尸王·欠一世: towering jiangshi king, ragged imperial robe, talisman on forehead, chains of IOUs, graveyard moonlight |
| boss_dragon.jpg | 东海龙王·敖铁公: stingy dragon king, golden scale armour, pearl abacus, offshore bank vault of spirit stones, stormy sea |
| boss_mozun.jpg | 魔尊·赊刀人: demon lord selling knives on credit, black cloak with blades hanging, red eyes, rift canyon of fire |
| boss_guiwang.jpg | 鬼王·千面: ghost king with a thousand masks orbiting him, icy blue flames, pawnshop of souls |
| boss_dasiming.jpg | 催债司·大司命: grand arbiter of fate, black-gold robe, book of life and death, lightning, judgment hall |
| boss_tiandao2.jpg | 天道真身·总账房: the true Heavenly Dao as chief accountant, endless ledger pages swirling, golden abacus throne, underground vault |

## 4. 时装 / 坐骑（抽卡卡面，各一张全身；时装分男女）
cos_xifu_m/f（红色喜服, wedding red with gold phoenix）、cos_xiake_m/f（wandering knight, black-blue, bamboo hat）、cos_yuyi_m/f（white crane-feather robe）、cos_mowang_m/f（demon king armour, black-red）、cos_taohua_m/f（peach-blossom fairy robe, pink）、cos_longpao_m/f（imperial dragon robe, gold crown）、cos_longwang_m/f（dragon prince attire, white-blue）、cos_guishi_m/f（ghost market night-walker, dark violet with lantern）、cos_tianjia_m/f（heavenly gold armour）、cos_caishen_m/f（god-of-wealth robe, red-gold）——每张：该服装穿在 player 角色身上，全身站姿，背景对应主题。
mount_cloud（golden somersault cloud）、mount_fsword（giant flying sword, rider standing）、mount_gourd（huge wine gourd, flying）、mount_crane（white immortal crane）、mount_lotus（nine-tier lotus throne）、mount_bowl（Meng Po's giant soup bowl, floating）、mount_carp（koi fish, golden, swimming in air）、mount_abacus（flying golden abacus）——每张：坐骑为主体，可有骑乘者背影。

## 5. 小怪
mon_slime（purple debt slime holding an IOU）、mon_boar（angry spirit boar, tusks）、mon_collector（debt-collector ghost in tattered official hat with ledger）、mon_paper（paper talisman imp）、mon_rock（rock golem spirit）、mon_fire（fire elemental wisp）、mon_treant（tree demon）、mon_crab（iron-pincer crab general）、mon_ghost（wandering soul）、mon_jiangshi（hopping vampire with talisman）——各一张全身。

## 6. CG（1920x1080，文件名 = 现有插画键，替换后自动生效）
cg_debt（slime debt collectors at a peach-village cottage door, child with broom）、cg_mentor（drunk swordsman under peach tree, bill unpaid）、cg_sect（disciples bowing at a cloud-top sect gate, tuition notice）、cg_rival（龙傲天 flaming challenge in the sect arena）、cg_market（bustling cultivator market, lanterns, merchants with abacuses）、cg_corpse（corpse king rising from a grave of IOUs）、cg_dragon（offshore bank under the sea, dragon king counting pearls）、cg_lengyue（冷月 playing guqin under the moon on a snowy pavilion）、cg_mozun（demon lord's knife market in the rift）、cg_judge（debt judge stamping a giant warrant）、cg_tiandao（confronting the Dao avatar over an enormous bill）、cg_longgong（coral dragon palace, prince surrounded by debt notices）、cg_guishi（ghost market at midnight, paper lanterns）、cg_cuizhai（celestial debt bureau, couplet 欠债还钱 / 利滚利甜）、cg_zhenshen（true Dao in the underground vault, abacus beads falling）、cg_ascend（ascension in a pillar of light）、cg_couple（immortal couple on a cloud）、cg_mortal（old mortal life ending peacefully in the village）、cg_sit（cultivator sitting in final meditation, petals）、cg_ash（ashes after a failed tribulation）、cg_demon（player crowned as demon lord）、cg_tycoon（player as the richest in three realms）、cg_teahouse（player running a teahouse）、cg_storyteller（player telling tales）、cg_fisher（fishing into immortality）、cg_insured（insurance payout to the afterlife）、cg_mengpo（running Meng Po's soup stall）。
新章节（v2.3 内容）：cg_dianfei（thunder bureau electricity bill, 雷公 and 电母）、cg_hetong（mentor revealing the ten-thousand-year contract under the peach tree）、cg_yanshou（three-realm creditors' meeting at the Southern Heavenly Gate）、cg_jiaxiang（hidden ending: walking home to the peach village with the mentor, mom's dinner table）。

## 7. 地图横幅 / 世界地图（map_*，1920x1080）
现有：map_village（peach village）、map_sect（青云宗 cloud peaks）、map_market（云来坊市）、map_secret（万妖秘境 jungle）、map_graveyard（乱葬岗）、map_island（东海仙岛）、map_rift（魔道裂谷）、map_longgong（东海龙宫）、map_guishi（鬼市）、map_heaven（天外天）、map_cuizhai（天庭催债司）。
计划新增（v2.3 内容项）：map_kunlun（昆仑山 snowy sacred mountain）、map_youming（幽冥鬼域 underworld river and spider lilies）、map_fukong（浮空仙城 floating city on islands）、map_wanjian（万剑冢 field of ten thousand swords）、map_yaoting（妖族王庭 beast-tribe royal court）、map_nantian（南天门 Southern Heavenly Gate with a toll booth）、map_penglai（蓬莱仙岛 immortal island in sea mist）、map_world（top-down painted world map of the three realms showing all the above as landmarks, parchment style）。

## 8. 图标（icon_<键>.png，512²）
丹药：pill_red（healing pill, red）、pill_blue（mana pill, blue）、pill_green（vitality pill）、pill_gold（foundation pill, gold）、pill_purple（breakthrough pill, purple swirl）、pill_white（longevity pill, pearl white）。
符：tal_r（red talisman, also 仙缘符）、tal_b（blue beast-taming talisman）、seal（jade seal）。
材料：herb（spirit herb）、lingzhi（thousand-year lingzhi）、ore（black iron crystal）、peach（immortal peach）、stone（spirit stone）、stone_r（demon core, red）、egg（spirit beast egg）。
道具：bill（ancestral IOU scroll）、debtbook（torn page of the Dao ledger）、key（secret realm key）、scroll（tattered technique scroll）、book_r/b/g/o/p（technique manuals in 5 colors）、gourd（wine gourd）、gourd_g（green gourd）、jade（warm jade）、fan（calligraphy fan）、coin（ancient coin）、bag（storage pouch）、chest（treasure chest）、bell（bronze bell）、furnace（pill furnace）、pagoda（mini pagoda）、mirror（bronze mirror）、umbrella（oil-paper umbrella）、flag（banner）、abacus（golden abacus）。
装备：sword_w/g/b/p/o（swords white/green/blue/purple/orange rarity）、robe_w/g/b/p/o（robes by rarity）、hat、boots、ring、ring_b。
技能：sk_metal、sk_wood、sk_water(=sk_ice)、sk_fire、sk_earth、sk_thunder、sk_light、sk_dark、sk_poison、sk_heal、sk_shield、sk_swords（sword array）、sk_meditate、sk_flee——圆形徽章式，元素配色。

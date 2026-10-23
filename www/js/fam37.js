'use strict';
// ======================= 3.7.2 多徒弟（记名弟子）+ 家族子嗣（fam37）=======================
// 规则：docs/research_v36.md §4（多徒弟）+ docs/research_story37_text2.md（文案 TEXT37B，奇遇链暂不接）。
// 接入：只做包裹（Talk.extra / Game.yearEnd / PD35.send / UI.p_legacy26），不改 game.js/talk.js/data.js/legacy26。
// 存档：G.dis36 = [记名弟子]；G.fam37 = { v, sp, kids:[], rate, log:[], ev }；G.apprentice / G.heir 不动。老档惰性兜底，不升 G.v。
const TEXT37B = {
 "dis": {
  "xing": [
   "赵",
   "钱",
   "孙",
   "李",
   "周",
   "吴",
   "郑",
   "王",
   "冯",
   "陈",
   "褚",
   "卫",
   "蒋",
   "沈",
   "韩",
   "杨",
   "朱",
   "秦",
   "许",
   "何",
   "吕",
   "施",
   "张",
   "孔",
   "曹",
   "严",
   "华",
   "金",
   "魏",
   "陶"
  ],
  "ming": [
   "小满",
   "二狗",
   "铁柱",
   "青禾",
   "阿蛮",
   "拾遗",
   "长安",
   "招财",
   "进宝",
   "守拙",
   "欠欠",
   "还还",
   "小算",
   "墨白",
   "云生",
   "松年",
   "半夏",
   "知秋",
   "听雨",
   "不悔",
   "若虚",
   "七斤",
   "八两",
   "有余",
   "无债",
   "清风",
   "明月",
   "石头",
   "灵儿",
   "阿福",
   "子衿",
   "望舒",
   "星河",
   "晚舟",
   "春生",
   "冬藏",
   "一鸣",
   "三省",
   "九思",
   "归鸿"
  ],
  "tags": [
   [
    "qinmian",
    "勤勉",
    "天不亮就打坐，账本也记得工工整整。",
    "xp×1.1"
   ],
   [
    "landuo",
    "懒惰",
    "能躺着修绝不坐着，摸鱼心法自学成才。",
    "xp×0.9，派遣失败率−3%"
   ],
   [
    "jiling",
    "机灵",
    "脑子转得快，讨价还价从没输过。",
    "派遣灵石×1.1"
   ],
   [
    "hanhou",
    "憨厚",
    "老实巴交，被人坑了还帮人数钱。",
    "loy年+3"
   ],
   [
    "tanxin",
    "贪心",
    "见钱眼开，常私藏一成派遣收益。",
    "派遣灵石×1.2，loy年−2"
   ],
   [
    "haoxia",
    "好侠",
    "路见不平必拔剑，回来常带伤。",
    "受伤率+5%，karma+1/年"
   ],
   [
    "linggen",
    "灵根奇佳",
    "天生道体，就是嘴有点碎。",
    "apt+0.1"
   ],
   [
    "moxing",
    "心有魔性",
    "眼神偶尔发红，修炼进度惊人。",
    "xp×1.2，karma−1/年"
   ]
  ],
  "recruit": [
   "“弟子{n}，拜见师父！束修……能先欠着吗？”",
   "“听说跟着您，债都是天道的，饭是管饱的？”",
   "“家里欠了三代债，爹让我来学还债的本事。”",
   "“师父收下我吧，我会扫地、算账、躲讨债鬼。”",
   "“弟子{n}，愿为师父鞍前马后，工钱另议。”",
   "“我看您骨骼清奇，像是能还清债的人。”"
  ],
  "teach": {
   "qinmian": [
    "“师父讲的我都记下了，还多抄了三遍。”",
    "“今日悟了一招，明日能再教一招吗？”"
   ],
   "landuo": [
    "“听着听着就睡着了……梦里学会了。”",
    "“师父，能不能教个躺着练的？”"
   ],
   "jiling": [
    "“这招我改了改，省一半灵力。”",
    "“懂了！顺便问下，学费能打折吗？”"
   ],
   "hanhou": [
    "“弟子愚钝，再练一百遍就会了。”",
    "“师父辛苦，我给您倒茶。”"
   ],
   "tanxin": [
    "“这招能拿去卖钱吗？卖多少？”",
    "“学会了，下次派遣多带点回来孝敬您。”"
   ],
   "haoxia": [
    "“学会了就去砍那欺负人的恶霸！”",
    "“这剑法够不够劈开讨债司的门？”"
   ],
   "linggen": [
    "“简单，下一招呢？”",
    "“师父您这招……我好像早会了。”"
   ],
   "moxing": [
    "“这招若反着运功，威力更大吧？”",
    "“师父，我心里有个声音说要多学点。”"
   ]
  },
  "report": {
   "ok": [
    "{n}自{map}归来，带回{s}灵石，鞋都磨破了。",
    "{n}在{map}采了一年灵草，换得{s}灵石。",
    "{n}于{map}帮人追债，抽成{s}灵石。",
    "{n}在{map}摆摊算命，净赚{s}灵石。",
    "{n}从{map}回来，带回{s}灵石和一张别人的欠条。",
    "{n}在{map}历练有成，灵石{s}，修为见长。"
   ],
   "fail": [
    "{n}在{map}被骗了，空手而归，忠心−10。",
    "{n}在{map}迷了路，一年白跑，忠心−10。",
    "{n}把收益借给了{map}的散修，对方跑了。",
    "{n}在{map}赌输了全部收益，跪在门口不敢进。"
   ],
   "hurt": [
    "{n}在{map}遭妖兽偷袭，带伤而回，需静养一年。",
    "{n}为救路人与{map}劫修交手，伤了经脉。",
    "{n}在{map}踩中陷阱，一瘸一拐地回来了。"
   ]
  },
  "lvup": [
   "{n}突破至{lv}级：“师父，我出息了！”",
   "{n}升到{lv}级，第一件事是要求涨月钱。",
   "{n}气息一变，{lv}级了，饭量也涨了。"
  ],
  "heir": [
   "“{n}，今日起你便是我衣钵传人。”“那债也传吗？”“传。”",
   "{n}三叩首：“弟子必光大师门，先从还债开始。”",
   "衣钵交接，{n}接过的是剑谱，也是账本。"
  ],
  "shuxiu": {
   "pay": [
    "你付了{s}灵石束修补贴，弟子们欢呼。",
    "束修{s}灵石已发，账房童子又瘦了一圈。"
   ],
   "owe": [
    "束修交不上，弟子们集体叹气，忠心−15。",
    "“师父，您是不是也欠天道的？”你无言以对。"
   ]
  }
 },
 "fam": {
  "spouse": {
   "sumei": {
    "n": "苏魅",
    "ask": "苏魅摇着古钱：“结道侣？那彩礼按复利算哦。”",
    "yes": "“成交。以后你的债，我替你管账。”",
    "no": "“今天行情不好，改日再议。”"
   },
   "ruyan": {
    "n": "柳如烟",
    "ask": "柳如烟收剑入鞘：“与我同行一生，可敢？”",
    "yes": "“好。从此剑同出，债同还。”",
    "no": "“剑心未定，莫要再提。”"
   },
   "lengyue": {
    "n": "冷月仙子",
    "ask": "冷月仙子望月良久：“……你说，结侣？”",
    "yes": "“……嗯。”月光都暖了一分。",
    "no": "“……不。”她转身，衣角带霜。"
   },
   "cuihua": {
    "n": "翠花",
    "ask": "翠花攥着暖玉：“你真要娶我？村里人会笑的。”",
    "yes": "“那、那以后家里钱归我管！”",
    "no": "“我还是先去喂猪吧。”"
   },
   "sister": {
    "n": "林小满",
    "ask": "林小满扔了扫帚：“你、你这是在求亲？”",
    "yes": "“以后山门你一个人扫！不，一起扫。”",
    "no": "“笨蛋，先把功课做完再说！”"
   },
   "jh_yangui": {
    "n": "燕归",
    "ask": "燕归倚着船舷：“浪迹天涯，多一人也无妨。”",
    "yes": "“那便说定，东海为媒。”",
    "no": "“风太大，我没听清。”"
   }
  },
  "birth": {
   "base": [
    "{sp}产下一子，取名{k}，啼声震落三片瓦。",
    "喜得麟儿{k}，讨债司送来第一张满月账单。",
    "{k}降生，天边祥云，随后是催款单。"
   ],
   "same": "测得{k}为{lg}，与父母相若，平平稳稳。",
   "up": "{k}竟是{lg}！比爹娘还高一档，祖坟冒青烟。",
   "down": "{k}只得{lg}，降了一档。“没事，能还债就行。”"
  },
  "grow": [
   [
    "y3",
    "{k}三岁，会说的第一句话是“欠账还钱”。"
   ],
   [
    "y6",
    "{k}六岁，测灵根，开始引气入体。"
   ],
   [
    "y10",
    "{k}十岁，偷偷拿你的灵石去买糖葫芦。"
   ],
   [
    "y16",
    "{k}十六，练气圆满，嚷着要下山历练。"
   ],
   [
    "y20",
    "{k}二十，筑基成功，可拜师或入宗门。"
   ],
   [
    "y30",
    "{k}三十，已能独当一面，可立为嫡传。"
   ]
  ],
  "succ": {
   "die": [
    "你的道途止于此。灵堂前，{k}接过了家主令。",
    "香火未断，{k}跪在灵前：“爹，债我来还。”"
   ],
   "fly": [
    "你破空飞升，回眸一笑，把家留给了{k}。",
    "仙门开处，{k}仰头：“爹，记得上面也有账！”"
   ]
  },
  "debt": "讨债司公告：父债子还，{k}继承债务{d}灵石（原额五成）。",
  "events": [
   {
    "id": "f37_ill",
    "t": "{k}染了寒症，咳个不停。",
    "ch": [
     [
      "喂回春丹",
      {
       "item": {
        "hcd": -1
       }
      }
     ],
     [
      "花钱请郎中",
      {
       "stone": -200
      }
     ],
     [
      "让他硬扛",
      {
       "karma": -5
      }
     ]
    ]
   },
   {
    "id": "f37_fight",
    "t": "{k}在学堂打了陈家小子，人家找上门。",
    "ch": [
     [
      "赔礼道歉",
      {
       "stone": -150,
       "karma": 5
      }
     ],
     [
      "护短到底",
      {
       "karma": -5,
       "fight": 1
      }
     ]
    ]
   },
   {
    "id": "f37_gift",
    "t": "{sp}生辰将至，想要份礼物。",
    "ch": [
     [
      "送暖玉",
      {
       "item": {
        "jadeg": -1
       },
       "aff": {
        "@sp": 15
       }
      }
     ],
     [
      "送桃花酿",
      {
       "item": {
        "wine": -1
       },
       "aff": {
        "@sp": 10
       }
      }
     ],
     [
      "忘了",
      {
       "aff": {
        "@sp": -15
       }
      }
     ]
    ]
   },
   {
    "id": "f37_debt",
    "t": "{k}偷偷签了张欠条，债主堵门。",
    "ch": [
     [
      "替他还",
      {
       "stone": -300
      }
     ],
     [
      "收回欠条",
      {
       "item": {
        "bill": 1
       },
       "karma": -3
      }
     ]
    ]
   },
   {
    "id": "f37_book",
    "t": "{k}在你书房翻出一本残破功法。",
    "ch": [
     [
      "传给他",
      {
       "item": {
        "scroll": -1
       },
       "karma": 3
      }
     ],
     [
      "没收",
      {}
     ]
    ]
   },
   {
    "id": "f37_feast",
    "t": "家族团圆宴，要不要大办？",
    "ch": [
     [
      "大办",
      {
       "stone": -400,
       "aff": {
        "@sp": 10
       }
      }
     ],
     [
      "简办",
      {
       "stone": -100,
       "aff": {
        "@sp": 3
       }
      }
     ]
    ]
   },
   {
    "id": "f37_peach",
    "t": "{k}想吃蟠桃，说隔壁孩子都吃过。",
    "ch": [
     [
      "给他蟠桃",
      {
       "item": {
        "peach": -1
       },
       "karma": 2
      }
     ],
     [
      "讲道理",
      {}
     ]
    ]
   },
   {
    "id": "f37_egg",
    "t": "{k}捡回一枚灵兽蛋，非要养。",
    "ch": [
     [
      "准了",
      {
       "item": {
        "egg": 1
       },
       "stone": -50
      }
     ],
     [
      "送回原处",
      {
       "karma": 5
      }
     ]
    ]
   }
  ]
 },
 "chains": [
  {
   "id": "c37_1",
   "n": "钱多多的赊账单",
   "src": "merchant@market",
   "trig": "G.debt>0 且筑基+",
   "fail": "拖2年：讨债鬼追猎，debt+10%",
   "nodes": [
    {
     "id": "c1_1",
     "npc": "merchant",
     "map": "market",
     "cond": "G.debt>0",
     "t": "钱多多掏出一卷赊账单：“这上面，有你三代人的名字。”",
     "ch": [
      {
       "t": "细看账单",
       "fx": "",
       "next": "c1_2"
      },
      {
       "t": "一把抢过",
       "fx": {
        "aff": {
         "merchant": -10
        }
       },
       "next": "c1_3"
      }
     ],
     "to": "钱多多把账单收回了：“过期不候。”"
    },
    {
     "id": "c1_2",
     "npc": "merchant",
     "map": "market",
     "cond": "",
     "t": "账单末尾有个红印：天道讨债司·副本。原件在谁手里？",
     "ch": [
      {
       "t": "问钱多多",
       "fx": {
        "stone": -100
       },
       "next": "c1_4"
      },
      {
       "t": "自己去查",
       "fx": {},
       "next": "c1_3"
      }
     ],
     "to": "红印褪色，线索断了。"
    },
    {
     "id": "c1_3",
     "npc": "jh_tieguo",
     "map": "market",
     "cond": "",
     "t": "赵铁锅悄悄说：账单原件被押在讨债司地库。",
     "ch": [
      {
       "t": "请他带路",
       "fx": {
        "aff": {
         "jh_tieguo": 5
        }
       },
       "next": "c1_4"
      },
      {
       "t": "独自夜探",
       "fx": {
        "fight": 1
       },
       "next": "c1_5"
      }
     ],
     "to": "赵铁锅连夜跑路了。"
    },
    {
     "id": "c1_4",
     "npc": "merchant",
     "map": "market",
     "cond": "",
     "t": "钱多多眯眼：“帮我收回一笔坏账，原件归你。”",
     "ch": [
      {
       "t": "答应收债",
       "fx": {
        "karma": -5
       },
       "next": "c1_6"
      },
      {
       "t": "拒绝",
       "fx": {
        "karma": 5
       },
       "next": "c1_5"
      }
     ],
     "to": "钱多多另找了打手。"
    },
    {
     "id": "c1_5",
     "npc": "",
     "map": "market",
     "cond": "",
     "t": "讨债司地库，账房鬼守着一口铁箱。",
     "ch": [
      {
       "t": "硬闯",
       "fx": {
        "fight": 1
       },
       "next": "c1_6"
      },
      {
       "t": "用祖传欠条换",
       "fx": {
        "item": {
         "bill": -1
        }
       },
       "next": "e1_b"
      }
     ],
     "to": "地库换了锁，再也进不去。"
    },
    {
     "id": "c1_6",
     "npc": "merchant",
     "map": "market",
     "cond": "",
     "t": "原件到手。烧了，还是还给钱多多换好处？",
     "ch": [
      {
       "t": "当场烧毁",
       "fx": {
        "karma": 5
       },
       "next": "e1_a"
      },
      {
       "t": "交给钱多多",
       "fx": {
        "stone": 500,
        "aff": {
         "merchant": 15
        }
       },
       "next": "e1_c"
      },
      {
       "t": "自己收着",
       "fx": {
        "item": {
         "ledger": 1
        }
       },
       "next": "e1_b"
      }
     ],
     "to": "原件自燃，你什么都没得到。"
    }
   ],
   "ends": [
    {
     "id": "e1_a",
     "end": 1,
     "t": "账单化灰，欠款减一成。钱多多心疼得直跺脚。",
     "rw": {
      "debt": "-10%",
      "karma": 5
     }
    },
    {
     "id": "e1_b",
     "end": 1,
     "t": "你手握把柄，钱多多以后见你都打八折。",
     "rw": {
      "item": {
       "ledger": 1
      },
      "aff": {
       "merchant": 10
      }
     }
    },
    {
     "id": "e1_c",
     "end": 1,
     "t": "钱多多：“合作愉快！”你却觉得自己被卖了。",
     "rw": {
      "stone": 800,
      "karma": -5
     }
    }
   ]
  },
  {
   "id": "c37_2",
   "n": "记账童子的错账",
   "src": "xianguan@heaven",
   "trig": "化神+ 且主线≥尾声",
   "fail": "账目被改坏：天道利息+1%/年（≤6%）",
   "nodes": [
    {
     "id": "c2_1",
     "npc": "xianguan",
     "map": "heaven",
     "cond": "化神+",
     "t": "记账童子哭丧着脸：“天道账本算错了一笔，是你的。”",
     "ch": [
      {
       "t": "帮他核账",
       "fx": {},
       "next": "c2_2"
      },
      {
       "t": "算错就算错",
       "fx": {
        "karma": -5
       },
       "next": "c2_3"
      }
     ],
     "to": "童子被罚抄账本一万遍。"
    },
    {
     "id": "c2_2",
     "npc": "xianguan",
     "map": "heaven",
     "cond": "",
     "t": "错账源头在人间，一笔三百年前的欠款。",
     "ch": [
      {
       "t": "下凡查",
       "fx": {},
       "next": "c2_4"
      },
      {
       "t": "翻天庭旧档",
       "fx": {
        "item": {
         "ledger": -1
        }
       },
       "next": "c2_5"
      }
     ],
     "to": "旧账被封存，查无可查。"
    },
    {
     "id": "c2_3",
     "npc": "xianguan",
     "map": "heaven",
     "cond": "",
     "t": "童子急了：“错账会让你的利息翻倍！”",
     "ch": [
      {
       "t": "那还是查吧",
       "fx": {},
       "next": "c2_2"
      },
      {
       "t": "改成对我有利",
       "fx": {
        "karma": -10
       },
       "next": "c2_6"
      }
     ],
     "to": "利息照常翻倍。"
    },
    {
     "id": "c2_4",
     "npc": "mentor",
     "map": "village",
     "cond": "",
     "t": "剑仙醉醺醺：“三百年前？那是为师借的。”",
     "ch": [
      {
       "t": "让师父还",
       "fx": {
        "aff": {
         "mentor": -10
        }
       },
       "next": "c2_6"
      },
      {
       "t": "替师父扛",
       "fx": {
        "aff": {
         "mentor": 15
        },
        "karma": 5
       },
       "next": "c2_6"
      }
     ],
     "to": "剑仙又醉了，什么都想不起。"
    },
    {
     "id": "c2_5",
     "npc": "xianguan",
     "map": "heaven",
     "cond": "",
     "t": "残页显示：借款人一栏，被人用指甲刮花了。",
     "ch": [
      {
       "t": "复原字迹",
       "fx": {
        "stone": -300
       },
       "next": "c2_4"
      },
      {
       "t": "交给天道",
       "fx": {},
       "next": "e2_b"
      }
     ],
     "to": "残页碎成了渣。"
    },
    {
     "id": "c2_6",
     "npc": "xianguan",
     "map": "heaven",
     "cond": "",
     "t": "新账已拟好，童子等你按手印。",
     "ch": [
      {
       "t": "如实入账",
       "fx": {
        "karma": 5
       },
       "next": "e2_a"
      },
      {
       "t": "偷偷改一笔",
       "fx": {
        "karma": -10
       },
       "next": "e2_c"
      }
     ],
     "to": "童子按了你的手印——按错了位置。"
    }
   ],
   "ends": [
    {
     "id": "e2_a",
     "end": 1,
     "t": "账目清白，天道利息永久−0.5%。童子给你磕了个头。",
     "rw": {
      "rate": "-0.5%",
      "aff": {
       "xianguan": 20
      }
     }
    },
    {
     "id": "e2_b",
     "end": 1,
     "t": "天道收下残页，赏你一枚延寿丹，此事作罢。",
     "rw": {
      "item": {
       "ysd": 1
      }
     }
    },
    {
     "id": "e2_c",
     "end": 1,
     "t": "改账成功，欠款−20%。但你总觉得天上有双眼睛。",
     "rw": {
      "debt": "-20%",
      "karma": -10
     }
    }
   ]
  },
  {
   "id": "c37_3",
   "n": "半张藏宝图",
   "src": "jh_xunbao",
   "trig": "L.rel[jh_xunbao]≥20",
   "fail": "被夺宝事件抢先：转追凶支线",
   "nodes": [
    {
     "id": "c3_1",
     "npc": "jh_xunbao",
     "map": "secret",
     "cond": "rel≥20",
     "t": "钱满仓撕下半张图：“合伙？宝贝五五分。”",
     "ch": [
      {
       "t": "五五分",
       "fx": {},
       "next": "c3_2"
      },
      {
       "t": "四六，我六",
       "fx": {
        "aff": {
         "jh_xunbao": -5
        }
       },
       "next": "c3_3"
      }
     ],
     "to": "钱满仓找了别人合伙。"
    },
    {
     "id": "c3_2",
     "npc": "jh_xunbao",
     "map": "secret",
     "cond": "",
     "t": "另半张图在黑市，标价五百灵石。",
     "ch": [
      {
       "t": "买下",
       "fx": {
        "stone": -500
       },
       "next": "c3_4"
      },
      {
       "t": "去偷",
       "fx": {
        "karma": -5
       },
       "next": "c3_5"
      }
     ],
     "to": "图被别人买走了。"
    },
    {
     "id": "c3_3",
     "npc": "jh_xunbao",
     "map": "secret",
     "cond": "",
     "t": "钱满仓勉强答应，但要你先探路。",
     "ch": [
      {
       "t": "探路",
       "fx": {
        "fight": 1
       },
       "next": "c3_4"
      },
      {
       "t": "让他先走",
       "fx": {
        "aff": {
         "jh_xunbao": -5
        }
       },
       "next": "c3_5"
      }
     ],
     "to": "钱满仓独自上路了。"
    },
    {
     "id": "c3_4",
     "npc": "",
     "map": "secret",
     "cond": "",
     "t": "两图合一，指向秘境深处一扇石门。",
     "ch": [
      {
       "t": "用秘境钥匙",
       "fx": {
        "item": {
         "key": -1
        }
       },
       "next": "c3_6"
      },
      {
       "t": "强行破门",
       "fx": {
        "fight": 1
       },
       "next": "c3_6"
      }
     ],
     "to": "石门沉入地底。"
    },
    {
     "id": "c3_5",
     "npc": "jh_mozi",
     "map": "rift",
     "cond": "",
     "t": "厉无咎拦路：“图，交出来。”",
     "ch": [
      {
       "t": "交图保命",
       "fx": {},
       "next": "e3_c"
      },
      {
       "t": "拼了",
       "fx": {
        "fight": 1
       },
       "next": "c3_4"
      }
     ],
     "to": "厉无咎已抢先拿走宝物。"
    },
    {
     "id": "c3_6",
     "npc": "jh_xunbao",
     "map": "secret",
     "cond": "",
     "t": "宝箱里是千年灵芝和一张更大的欠条。",
     "ch": [
      {
       "t": "平分",
       "fx": {
        "aff": {
         "jh_xunbao": 15
        }
       },
       "next": "e3_a"
      },
      {
       "t": "独吞",
       "fx": {
        "karma": -10,
        "aff": {
         "jh_xunbao": -30
        }
       },
       "next": "e3_b"
      }
     ],
     "to": "宝箱化作飞灰。"
    }
   ],
   "ends": [
    {
     "id": "e3_a",
     "end": 1,
     "t": "钱满仓：“好兄弟！下回还找你。”",
     "rw": {
      "item": {
       "lz": 1
      },
      "stone": 300
     }
    },
    {
     "id": "e3_b",
     "end": 1,
     "t": "你独吞了宝物，从此江湖多一个骂你的人。",
     "rw": {
      "item": {
       "lz": 2,
       "bill": 1
      }
     }
    },
    {
     "id": "e3_c",
     "end": 1,
     "t": "你保住了命，丢了图，钱满仓叹了口气。",
     "rw": {
      "aff": {
       "jh_xunbao": -10
      }
     }
    }
   ]
  },
  {
   "id": "c37_4",
   "n": "魔修的欠条",
   "src": "jh_mozi",
   "trig": "karma≤−20 或魔修路线",
   "fail": "背叛：天魔宗 sectRel−30",
   "nodes": [
    {
     "id": "c4_1",
     "npc": "jh_mozi",
     "map": "rift",
     "cond": "karma≤-20",
     "t": "厉无咎甩出一张欠条：“正道欠我魔门一条命。”",
     "ch": [
      {
       "t": "听他说",
       "fx": {},
       "next": "c4_2"
      },
      {
       "t": "当场拔剑",
       "fx": {
        "fight": 1
       },
       "next": "c4_3"
      }
     ],
     "to": "厉无咎冷笑离去。"
    },
    {
     "id": "c4_2",
     "npc": "jh_mozi",
     "map": "rift",
     "cond": "",
     "t": "“当年青云宗屠我师门，欠条上有掌门手印。”",
     "ch": [
      {
       "t": "替他讨债",
       "fx": {
        "karma": -5
       },
       "next": "c4_4"
      },
      {
       "t": "去青云宗核实",
       "fx": {},
       "next": "c4_5"
      }
     ],
     "to": "欠条被魔火烧了。"
    },
    {
     "id": "c4_3",
     "npc": "jh_mozi",
     "map": "rift",
     "cond": "",
     "t": "厉无咎负伤：“打赢我，也改变不了那笔账。”",
     "ch": [
      {
       "t": "饶他一命",
       "fx": {
        "karma": 5
       },
       "next": "c4_2"
      },
      {
       "t": "斩草除根",
       "fx": {
        "karma": -10
       },
       "next": "e4_c"
      }
     ],
     "to": "厉无咎遁入裂隙。"
    },
    {
     "id": "c4_4",
     "npc": "jh_jianke",
     "map": "sect",
     "cond": "",
     "t": "萧十三挡在山门：“要讨债，先过我的剑。”",
     "ch": [
      {
       "t": "动手",
       "fx": {
        "fight": 1
       },
       "next": "c4_6"
      },
      {
       "t": "劝他让开",
       "fx": {
        "aff": {
         "jh_jianke": -10
        }
       },
       "next": "c4_6"
      }
     ],
     "to": "萧十三通报了掌门。"
    },
    {
     "id": "c4_5",
     "npc": "sister",
     "map": "sect",
     "cond": "",
     "t": "林小满悄声：“旧档里确有此事，掌门不许提。”",
     "ch": [
      {
       "t": "公之于众",
       "fx": {
        "karma": 10
       },
       "next": "c4_6"
      },
      {
       "t": "压下不提",
       "fx": {
        "aff": {
         "sister": 5
        }
       },
       "next": "e4_b"
      }
     ],
     "to": "旧档被焚。"
    },
    {
     "id": "c4_6",
     "npc": "jh_mozi",
     "map": "rift",
     "cond": "",
     "t": "真相已明。厉无咎问：“这债，你站哪边？”",
     "ch": [
      {
       "t": "帮魔门讨回",
       "fx": {
        "karma": -10
       },
       "next": "e4_a"
      },
      {
       "t": "背叛魔门",
       "fx": {
        "karma": 10
       },
       "next": "e4_b"
      }
     ],
     "to": "厉无咎认定你背叛了他。"
    }
   ],
   "ends": [
    {
     "id": "e4_a",
     "end": 1,
     "t": "青云宗赔下灵石三千，魔门敬你为客卿。",
     "rw": {
      "stone": 1500,
      "aff": {
       "jh_mozi": 20
      },
      "karma": -10
     }
    },
    {
     "id": "e4_b",
     "end": 1,
     "t": "欠条作废，天魔宗视你为敌。",
     "rw": {
      "sectRel": {
       "tianmo": -30
      },
      "karma": 10
     }
    },
    {
     "id": "e4_c",
     "end": 1,
     "t": "厉无咎陨落，欠条落在你手里。",
     "rw": {
      "item": {
       "bill": 1,
       "yd": 1
      }
     }
    }
   ]
  },
  {
   "id": "c37_5",
   "n": "丹娘的炸炉",
   "src": "jh_danniang",
   "trig": "G.alchLv≥2",
   "fail": "炼丹失败3次：苏半夏陨落风险",
   "nodes": [
    {
     "id": "c5_1",
     "npc": "jh_danniang",
     "map": "market",
     "cond": "alchLv≥2",
     "t": "苏半夏灰头土脸：“炉子又炸了，帮我找找原因？”",
     "ch": [
      {
       "t": "帮忙",
       "fx": {},
       "next": "c5_2"
      },
      {
       "t": "只帮赔钱",
       "fx": {
        "stone": -100
       },
       "next": "c5_3"
      }
     ],
     "to": "苏半夏自己又炸了一次炉。"
    },
    {
     "id": "c5_2",
     "npc": "jh_danniang",
     "map": "market",
     "cond": "",
     "t": "炉底残渣里有玄铁晶粉，有人动了手脚。",
     "ch": [
      {
       "t": "查是谁",
       "fx": {},
       "next": "c5_4"
      },
      {
       "t": "先补炉",
       "fx": {
        "item": {
         "ore": -1
        }
       },
       "next": "c5_3"
      }
     ],
     "to": "残渣被风吹散。"
    },
    {
     "id": "c5_3",
     "npc": "jh_danniang",
     "map": "market",
     "cond": "",
     "t": "新炉开火，她要你守着火候。",
     "ch": [
      {
       "t": "守炉",
       "fx": {
        "item": {
         "herb": -1
        }
       },
       "next": "c5_5"
      },
      {
       "t": "顺便偷学",
       "fx": {
        "karma": -3
       },
       "next": "c5_5"
      }
     ],
     "to": "炉火熄了。"
    },
    {
     "id": "c5_4",
     "npc": "merchant",
     "map": "market",
     "cond": "",
     "t": "钱多多支吾：“我只是卖了她一批便宜炉子……”",
     "ch": [
      {
       "t": "逼他赔",
       "fx": {
        "stone": 300,
        "aff": {
         "merchant": -10
        }
       },
       "next": "c5_6"
      },
      {
       "t": "放他一马",
       "fx": {
        "karma": 5
       },
       "next": "c5_6"
      }
     ],
     "to": "钱多多关门歇业。"
    },
    {
     "id": "c5_5",
     "npc": "jh_danniang",
     "map": "market",
     "cond": "",
     "t": "丹成在即，炉身开裂！",
     "ch": [
      {
       "t": "以身护炉",
       "fx": {
        "item": {
         "hcd": -1
        }
       },
       "next": "c5_6"
      },
      {
       "t": "拉她快跑",
       "fx": {},
       "next": "e5_c"
      }
     ],
     "to": "炉炸了，苏半夏重伤。"
    },
    {
     "id": "c5_6",
     "npc": "jh_danniang",
     "map": "market",
     "cond": "",
     "t": "一炉丹成，香气满街。她递来一瓶。",
     "ch": [
      {
       "t": "收下",
       "fx": {
        "item": {
         "pyd": 2
        }
       },
       "next": "e5_a"
      },
      {
       "t": "让她卖钱还债",
       "fx": {
        "karma": 5
       },
       "next": "e5_b"
      }
     ],
     "to": "丹药受潮失效。"
    }
   ],
   "ends": [
    {
     "id": "e5_a",
     "end": 1,
     "t": "苏半夏：“以后炼丹，给你八折。”",
     "rw": {
      "item": {
       "zjd": 1
      },
      "aff": {
       "jh_danniang": 20
      }
     }
    },
    {
     "id": "e5_b",
     "end": 1,
     "t": "她还清了债，开了间小丹铺，挂着你的名字。",
     "rw": {
      "aff": {
       "jh_danniang": 30
      },
      "karma": 5
     }
    },
    {
     "id": "e5_c",
     "end": 1,
     "t": "人保住了，炉没了。她哭着说下次还找你。",
     "rw": {
      "aff": {
       "jh_danniang": 10
      }
     }
    }
   ]
  },
  {
   "id": "c37_6",
   "n": "剑与当铺",
   "src": "jh_jianke",
   "trig": "有本命法宝 G.fb33",
   "fail": "拒赎：萧十三入仇 rel−40",
   "nodes": [
    {
     "id": "c6_1",
     "npc": "jh_jianke",
     "map": "sect",
     "cond": "G.fb33",
     "t": "萧十三把佩剑押进当铺：“借我五百，三年后赎。”",
     "ch": [
      {
       "t": "借给他",
       "fx": {
        "stone": -500
       },
       "next": "c6_2"
      },
      {
       "t": "不借",
       "fx": {
        "aff": {
         "jh_jianke": -10
        }
       },
       "next": "c6_3"
      }
     ],
     "to": "萧十三另寻门路去了。"
    },
    {
     "id": "c6_2",
     "npc": "jh_jianke",
     "map": "sect",
     "cond": "",
     "t": "他说借钱是为救燕归，她被困东海。",
     "ch": [
      {
       "t": "同去东海",
       "fx": {},
       "next": "c6_4"
      },
      {
       "t": "给钱就够了",
       "fx": {},
       "next": "c6_5"
      }
     ],
     "to": "萧十三独闯东海。"
    },
    {
     "id": "c6_3",
     "npc": "merchant",
     "map": "market",
     "cond": "",
     "t": "当铺掌柜正是钱多多：“这剑，你要不要？”",
     "ch": [
      {
       "t": "买下",
       "fx": {
        "stone": -800
       },
       "next": "c6_5"
      },
      {
       "t": "帮萧十三赎",
       "fx": {
        "stone": -500
       },
       "next": "c6_2"
      }
     ],
     "to": "剑被转卖他乡。"
    },
    {
     "id": "c6_4",
     "npc": "jh_yangui",
     "map": "island",
     "cond": "",
     "t": "燕归被海妖围困，见你们来，笑了。",
     "ch": [
      {
       "t": "并肩杀出",
       "fx": {
        "fight": 1
       },
       "next": "c6_6"
      },
      {
       "t": "用替死符",
       "fx": {
        "item": {
         "tsf": -1
        }
       },
       "next": "c6_6"
      }
     ],
     "to": "海雾吞没了一切。"
    },
    {
     "id": "c6_5",
     "npc": "jh_jianke",
     "map": "sect",
     "cond": "",
     "t": "三年到期，萧十三来赎剑，钱不够。",
     "ch": [
      {
       "t": "宽限",
       "fx": {
        "karma": 5
       },
       "next": "c6_6"
      },
      {
       "t": "拒赎",
       "fx": {
        "aff": {
         "jh_jianke": -40
        }
       },
       "next": "e6_c"
      }
     ],
     "to": "萧十三默默离去。"
    },
    {
     "id": "c6_6",
     "npc": "jh_jianke",
     "map": "sect",
     "cond": "",
     "t": "萧十三：“此恩，我拿剑意还你。”",
     "ch": [
      {
       "t": "受了",
       "fx": {
        "aff": {
         "jh_jianke": 20
        }
       },
       "next": "e6_a"
      },
      {
       "t": "把剑还他",
       "fx": {
        "karma": 10
       },
       "next": "e6_b"
      }
     ],
     "to": "剑意散了。"
    }
   ],
   "ends": [
    {
     "id": "e6_a",
     "end": 1,
     "t": "萧十三传你一缕剑意，本命法宝灵性大涨。",
     "rw": {
      "fb33": "+exp",
      "aff": {
       "jh_jianke": 10
      }
     }
    },
    {
     "id": "e6_b",
     "end": 1,
     "t": "萧十三抱剑一揖：“欠你一命。”从此江湖多个兄弟。",
     "rw": {
      "aff": {
       "jh_jianke": 30,
       "jh_yangui": 15
      }
     }
    },
    {
     "id": "e6_c",
     "end": 1,
     "t": "剑归你了，人成了仇。夜里总听见剑鸣。",
     "rw": {
      "item": {
       "ore": 2
      },
      "karma": -10
     }
    }
   ]
  }
 ]
};

const FAM37 = {
  T: TEXT37B,
  RANK: ['none', 'wu', 'si', 'san', 'shuang', 'tian', 'yi'], // 'yi' = 异灵根（雷/冰）
  SP_LG: { sumei: 'shuang', ruyan: 'tian', lengyue: 'bing', cuihua: 'wu', sister: 'san', jh_yangui: 'shuang' },
  TAG: { qinmian: { xp: 1.1 }, landuo: { xp: 0.9, fail: -0.03 }, jiling: { s: 1.1 }, hanhou: { loy: 3 }, tanxin: { s: 1.2, loy: -2 }, haoxia: { hurt: 0.05, karma: 1 }, linggen: { apt: 0.1 }, moxing: { xp: 1.2, karma: -1 } },
  KID_MAX: 4, TEACH_MAX: 6,
  G() { return typeof Game !== 'undefined' ? Game.G : null; },
  ensure(G) {
    G = G || this.G(); if (!G) return null;
    if (!Array.isArray(G.dis36)) G.dis36 = [];
    let F = G.fam37; if (!F || typeof F !== 'object') F = G.fam37 = {};
    F.v = 1; if (F.sp === undefined) F.sp = null; if (!Array.isArray(F.kids)) F.kids = [];
    if (typeof F.rate !== 'number') F.rate = 0; if (!Array.isArray(F.log)) F.log = []; if (!F.ev || typeof F.ev !== 'object') F.ev = {};
    if (typeof G.karma !== 'number') G.karma = 0; if (typeof G.debt !== 'number') G.debt = 0;
    return F;
  },
  fill(s, o) { return String(s).replace(/\{(\w+)\}/g, (m, k) => (o && o[k] !== undefined ? o[k] : m)); },
  pick(a, rnd) { return a[Math.floor((rnd || Math.random)() * a.length) % a.length]; },
  nm(id) { const N = typeof NPCS !== 'undefined' && NPCS[id]; if (N) return N.n.split('·').pop(); const S = this.T.fam.spouse[id]; return S ? S.n : id; },
  lgN(id) { const L = LINGGEN.find(l => l.id === id); return L ? L.n : id; },
  news(G, s) { const F = this.ensure(G); F.log.unshift({ y: G.year || 0, s }); F.log.length = Math.min(F.log.length, 12); try { if (typeof JH34 !== 'undefined') JH34.say(JH34.ensure(G), s, 'fam37'); } catch (e) { console.warn('fam37 news', e); } },
  rel(id, d) { if (typeof Life34 !== 'undefined' && Life34.rel && id) Life34.rel(id, d); },
  relOf(id) { const L = typeof Life34 !== 'undefined' && Life34.st ? Life34.st() : null; return L ? (L.rel[id] || 0) : 0; },

  // ---------- 多徒弟 ----------
  cap(G) { G = G || this.G(); return Math.max(0, Math.min(5, (G.realm || 0) - 1)); },
  slots(G) { G = G || this.G(); return (typeof PD35 !== 'undefined' && PD35.max) ? PD35.max(G) : Math.min(4, 1 + Math.floor((G.realm || 0) / 2)); },
  out(G) { G = G || this.G(); return (G.dis36 || []).filter(d => d.state === 'out'); },
  used(G) { G = G || this.G(); return this.out(G).length + ((typeof PD35 !== 'undefined' && PD35.away) ? PD35.away(G).length : 0); },
  rollLg(G, rnd) {
    rnd = rnd || Math.random; const hi = ['shuang', 'tian', 'lei', 'bing'].includes(G.lg);
    const W = LINGGEN.map(l => l.w * (hi && l.mult >= 1.3 ? 1.3 : 1)); let r = rnd() * W.reduce((a, b) => a + b, 0);
    for (let i = 0; i < W.length; i++) { r -= W[i]; if (r < 0) return LINGGEN[i].id; } return 'san';
  },
  recruit(npc, rnd) {
    const G = this.G(); this.ensure(G); rnd = rnd || Math.random;
    if (G.dis36.length >= this.cap(G)) { if (typeof UI !== 'undefined') UI.toast(`记名弟子已满（${this.cap(G)}）`); return null; }
    if (npc && (G.dis36.some(d => d.npc === npc) || G.apprentice === npc || G.partner === npc)) return null;
    const D = this.T.dis, tag = this.pick(D.tags, rnd)[0];
    const d = { id: 'd' + Date.now().toString(36) + Math.floor(rnd() * 1e6).toString(36), n: npc ? this.nm(npc) : this.pick(D.xing, rnd) + this.pick(D.ming, rnd), lg: this.rollLg(G, rnd), pur: 40, lvl: 1, xp: 0,
      apt: Math.round((0.6 + rnd() * 0.8 + (this.TAG[tag].apt || 0)) * 100) / 100, loy: 60, state: 'idle', npc: npc || null, tag, teach: 0, ty: G.year || 0, map: null, hurt: 0 };
    G.dis36.push(d); this.news(G, `${d.n}拜入门下为记名弟子：${this.fill(this.pick(D.recruit, rnd), d)}`); if (Game.save) Game.save(); return d;
  },
  expel(i) { const G = this.G(); this.ensure(G); const d = G.dis36[i]; if (!d) return false; G.dis36.splice(i, 1); if (d.npc) this.rel(d.npc, -30); this.news(G, `${d.n}被逐出门墙。`); Game.save(); return true; },
  teach(i, rnd) {
    const G = this.G(); this.ensure(G); const d = G.dis36[i]; if (!d) return false;
    if (d.ty !== (G.year || 0)) { d.ty = G.year || 0; d.teach = 0; }
    if (d.teach >= this.TEACH_MAX) { UI.toast('今年已教满 6 次'); return false; }
    if ((G.ap || 0) < 1) { UI.toast('行动力不足'); return false; }
    G.ap--; d.teach++; d.xp += 30; try { Game.addExp(Game.need() * 0.01, true); } catch (e) { }
    this.lvCheck(G, d); UI.toast(`${d.n}：${this.pick(this.T.dis.teach[d.tag] || ['……'], rnd)}`, '#9affd8'); Game.save(); return true;
  },
  lvCheck(G, d) { while (d.xp >= 50 * d.lvl) { d.xp -= 50 * d.lvl; d.lvl++; this.news(G, this.fill(this.pick(this.T.dis.lvup), { n: d.n, lv: d.lvl })); } },
  yearXp(d) { const L = LINGGEN.find(l => l.id === d.lg) || { mult: 1 }; return 20 * L.mult * d.apt * (1 + 0.1 * (d.teach || 0)) * ((this.TAG[d.tag] || {}).xp || 1); },
  tierOf(map) { const I = MAPINFO[map]; if (!I) return 0; const t = Math.floor(I.tier || 0); return t <= 0 ? 0.5 : t; },
  yieldOf(d, map) { return Math.round(40 * d.lvl * this.tierOf(map) * (d.lvl >= 5 ? 1.5 : 1) * ((this.TAG[d.tag] || {}).s || 1)); },
  maps(G) { G = G || this.G(); return Object.keys(MAPINFO).filter(m => (MAPINFO[m].need || 0) <= (G.realm || 0) && (typeof MAP_ORDER === 'undefined' || MAP_ORDER.includes(m))); },
  send(i, map) {
    const G = this.G(); this.ensure(G); const d = G.dis36[i]; if (!d || !MAPINFO[map]) return false;
    if (d.hurt > 0) { UI.toast(`${d.n}伤还没好`); return false; }
    if (d.state !== 'out' && this.used(G) >= this.slots(G)) { UI.toast(`派遣名额已满（灵宠+弟子 ${this.slots(G)}）`); return false; }
    d.state = 'out'; d.map = map; Game.save(); return true;
  },
  recall(i) { const G = this.G(); const d = G && G.dis36 && G.dis36[i]; if (d) { d.state = 'idle'; d.map = null; Game.save(); } },
  settleOne(G, d, rnd) {
    rnd = rnd || Math.random; const T = this.TAG[d.tag] || {}; const R = this.T.dis.report; const o = { n: d.n, map: MAPINFO[d.map] ? MAPINFO[d.map].n : d.map, s: 0 };
    const r = rnd();
    if (r < Math.max(0.05, 0.3 - d.lvl * 0.02 + (T.fail || 0))) { d.loy = Math.max(0, d.loy - 10); return { d, ok: 0, s: 0, line: this.fill(this.pick(R.fail, rnd), o) }; }
    if (r > 1 - 0.1 - (T.hurt || 0)) { d.hurt = 1; d.state = 'idle'; d.map = null; return { d, ok: 0, s: 0, hurt: 1, line: this.fill(this.pick(R.hurt, rnd), o) }; }
    const s = this.yieldOf(d, d.map); G.stone += s; o.s = s; return { d, ok: 1, s, line: this.fill(this.pick(R.ok, rnd), o) };
  },
  disYear(G, rnd) {
    this.ensure(G); const res = []; if (!G.dis36.length) return res;
    for (const d of G.dis36) {
      const T = this.TAG[d.tag] || {};
      if (d.hurt > 0) d.hurt--; else if (d.state === 'out') res.push(this.settleOne(G, d, rnd));
      d.xp += this.yearXp(d); d.xp = Math.round(d.xp * 100) / 100; this.lvCheck(G, d);
      d.loy = Math.max(0, Math.min(100, d.loy + (T.loy || 0))); if (T.karma) G.karma += T.karma;
      if (d.loy >= 80 && d.npc) this.rel(d.npc, 1);
      d.teach = 0; d.ty = (G.year || 0);
    }
    const fee = 300 * G.dis36.length; const SX = this.T.dis.shuxiu;
    if (G.stone >= fee) { G.stone -= fee; this.news(G, this.fill(this.pick(SX.pay, rnd), { s: fee })); }
    else { G.dis36.forEach(d => { d.loy = Math.max(0, d.loy - 15); }); this.news(G, this.pick(SX.owe, rnd)); }
    res.forEach(x => this.news(G, x.line));
    return res;
  },
  canHeir(G, d) { return !G.apprentice && d && d.lvl >= 5 && !!d.npc && !!NPCS[d.npc]; },
  makeHeir(i) {
    const G = this.G(); this.ensure(G); const d = G.dis36[i]; if (!this.canHeir(G, d)) return false;
    G.apprentice = d.npc; G.apprenticeLvl = Math.min(10, d.lvl); G.apprenticeTechs = G.apprenticeTechs || {}; G.dis36.splice(i, 1);
    this.news(G, this.fill(this.pick(this.T.dis.heir), d)); Game.save(); return true;
  },

  // ---------- 家族 ----------
  canMarry(G, id) { G = G || this.G(); this.ensure(G); return !!this.T.fam.spouse[id] && !G.fam37.sp && (G.aff[id] || 0) >= 100 && this.relOf(id) >= 60; },
  marry(id) {
    const G = this.G(); if (!this.canMarry(G, id)) return false; G.fam37.sp = id; G.partner = id; if (Game.ach) try { Game.ach('partner'); } catch (e) { }
    this.news(G, `你与${this.nm(id)}结为道侣。`); Game.save(); return true;
  },
  rankOf(lg) { const i = this.RANK.indexOf(lg); return i >= 0 ? i : (lg === 'lei' || lg === 'bing' ? 6 : 3); },
  lgAt(rank, rnd) { rank = Math.max(0, Math.min(6, rank)); return rank === 6 ? this.pick(['lei', 'bing'], rnd) : this.RANK[rank]; },
  inheritLg(a, b, rnd) {
    rnd = rnd || Math.random; const base = Math.max(0, Math.max(this.rankOf(a), this.rankOf(b)) - 1); const r = rnd();
    const k = r < 0.6 ? 'same' : r < 0.85 ? 'up' : 'down'; const rank = k === 'up' ? Math.min(6, base + 1) : k === 'down' ? Math.max(0, base - 1) : base;
    return { lg: this.lgAt(rank, rnd), k };
  },
  birth(rnd) {
    const G = this.G(); const F = this.ensure(G); if (!F.sp || F.kids.length >= this.KID_MAX) return null; rnd = rnd || Math.random;
    const { lg, k } = this.inheritLg(G.lg, this.SP_LG[F.sp] || 'san', rnd);
    const kid = { n: (G.surname || '') + this.pick(this.T.dis.ming, rnd), lg, born: G.year || 0, age: 0, sp: F.sp, nodes: {} };
    F.kids.push(kid); const B = this.T.fam.birth; const o = { sp: this.nm(F.sp), k: kid.n, lg: this.lgN(lg) };
    this.news(G, this.fill(this.pick(B.base, rnd), o) + this.fill(B[k] ? (Array.isArray(B[k]) ? this.pick(B[k], rnd) : B[k]) : '', o)); return kid;
  },
  grow(G) {
    const F = this.ensure(G); const out = [];
    for (const kid of F.kids) { kid.age = (G.year || 0) - kid.born; for (const [nd, s] of this.T.fam.grow) { const a = +nd.slice(1); if (kid.age >= a && !kid.nodes[nd]) { kid.nodes[nd] = 1; const line = this.fill(s, { k: kid.n }); out.push(line); this.news(G, line); } } }
    return out;
  },
  // 父债子还：继任时欠款减半（G.debt 五成）
  succeed(kind) {
    const G = this.G(); const F = this.ensure(G); const kid = F.kids.slice().sort((a, b) => b.age - a.age)[0]; if (!kid) return null;
    G.debt = Math.round((G.debt || 0) * 0.5); const S = this.T.fam.succ[kind === 'fly' ? 'fly' : 'die'];
    this.news(G, this.fill(this.pick(S), { k: kid.n })); this.news(G, this.fill(Array.isArray(this.T.fam.debt) ? this.T.fam.debt[0] : this.T.fam.debt, { k: kid.n, d: G.debt })); return kid;
  },
  ctx(G) { const F = this.ensure(G); const kid = F.kids[F.kids.length - 1]; return { sp: F.sp ? this.nm(F.sp) : '道侣', k: kid ? kid.n : '孩子', lg: kid ? this.lgN(kid.lg) : this.lgN(G.lg) }; },
  // 效果字段：stone（×(1+大境界)）item aff(@sp) karma fight debt rate sectRel fb33
  canEff(G, e) { if (!e || !e.item) return true; for (const k in e.item) if (e.item[k] < 0 && (G.inv[k] || 0) < -e.item[k]) return false; return true; },
  async applyEff(e) {
    const G = this.G(); const F = this.ensure(G); if (!e) return []; const parts = [], out = [];
    if (e.stone) parts.push(`stone${e.stone >= 0 ? '+' : '-'}${Math.abs(Math.round(e.stone * (1 + (G.realm || 0))))}`);
    if (e.item) for (const k in e.item) parts.push(`item:${k}:${e.item[k]}`);
    if (e.aff) for (const k in e.aff) { const id = k === '@sp' ? F.sp : k; if (id) parts.push(`aff:${id}:${e.aff[k]}`); }
    if (e.karma) parts.push(`karma${e.karma >= 0 ? '+' : '-'}${Math.abs(e.karma)}`);
    if (e.debt) { G.debt = Math.max(0, Math.round(G.debt + e.debt)); out.push(`天道欠款${e.debt >= 0 ? '+' : ''}${e.debt}`); }
    if (e.rate) { F.rate = Math.round((F.rate + e.rate) * 1000) / 1000; out.push(`天道利率${e.rate >= 0 ? '+' : ''}${Math.round(e.rate * 100)}%`); }
    if (e.sectRel) { G.sectRel = G.sectRel || {}; const add = (k, v) => { G.sectRel[k] = Math.max(-100, Math.min(100, (G.sectRel[k] || 0) + v)); };
      if (typeof e.sectRel === 'number') { if (G.sect && typeof SECTS !== 'undefined') for (const s in SECTS) if (s !== G.sect) add(G.sect < s ? G.sect + '|' + s : s + '|' + G.sect, e.sectRel); }
      else for (const k in e.sectRel) add(k, e.sectRel[k]); out.push('宗门关系变化'); }
    if (e.fb33 && G.fb33) { G.fb33.exp = (G.fb33.exp || 0) + e.fb33; out.push(`本命法宝经验+${e.fb33}`); }
    if (e.fight) { const mons = (MAPINFO[(typeof R !== 'undefined' && R.mapId) || 'village'] || MAPINFO.village).mons; parts.push(`fight:${typeof e.fight === 'string' ? e.fight : mons[0]}`); }
    let r = null; if (parts.length) r = await Game.apply(parts.join(';'));
    if (r && Array.isArray(r.later)) for (const fn of r.later) { try { await fn(); } catch (err) { console.warn('fam37 later', err); } }
    return [r && r.txt !== undefined ? r.txt : r].concat(out).filter(Boolean);
  },
  async famEvent(id, rnd) {
    const G = this.G(); const F = this.ensure(G); const E = id ? this.T.fam.events.find(x => x.id === id) : this.pick(this.T.fam.events.filter(x => (F.sp || !/\{sp\}|@sp/.test(JSON.stringify(x))) && (F.kids.length || !/\{k\}/.test(x.t))), rnd);
    if (!E) return null; const o = this.ctx(G);
    const opts = E.ch.map(([t, e]) => (this.canEff(G, e) ? t : '🔒' + t));
    let c = await UI.card('家事', this.fill(E.t, o), F.sp && NPCS[F.sp] ? NPCS[F.sp].por : 'npc_girl', opts);
    if (c < 0 || c >= E.ch.length || !this.canEff(G, E.ch[c][1])) c = E.ch.findIndex(([, e]) => this.canEff(G, e)); if (c < 0) return null;
    const r = await this.applyEff(E.ch[c][1]); F.ev[E.id] = (F.ev[E.id] || 0) + 1; this.news(G, `${this.fill(E.t, o)}——${E.ch[c][0]}`); return { id: E.id, c, r };
  },
  async famYear(rnd) {
    const G = this.G(); const F = this.ensure(G); rnd = rnd || Math.random;
    if (F.rate && G.debt > 0) G.debt += Math.ceil(G.debt * F.rate);
    if (F.sp && G.partner !== F.sp) F.sp = null; // 道侣离开（unpartner）
    if (F.sp && F.kids.length < this.KID_MAX && rnd() < 0.3) { const k = this.birth(rnd); if (k) UI.toast(`子嗣【${k.n}】降生（${this.lgN(k.lg)}）`, '#ffc0e0'); }
    this.grow(G);
    if ((F.sp || F.kids.length) && rnd() < 0.35) await this.famEvent(null, rnd);
  },

  // ---------- UI ----------
  html() {
    const G = this.G(); const F = this.ensure(G); const cap = this.cap(G);
    let s = `<div class="fam37"><b>记名弟子 ${G.dis36.length}/${cap}</b><p class="hint">派遣名额（灵宠+弟子共享）：${this.used(G)}/${this.slots(G)}。年收益 40×等级×地图档位灵石；束修 300×人数/年。</p>`;
    G.dis36.forEach((d, i) => {
      const tg = (this.T.dis.tags.find(t => t[0] === d.tag) || [, ''])[1];
      s += `<div class="fam37r"><b>${esc(d.n)}</b><small>${this.lgN(d.lg)}·${tg}·Lv${d.lvl}（${Math.floor(d.xp)}/${50 * d.lvl}）忠${d.loy}${d.hurt ? '·养伤' : ''}${d.state === 'out' ? ' · 派往' + MAPINFO[d.map].n : ''}</small>
        <button class="opt" data-f="teach" data-i="${i}">教学(${d.ty === (G.year || 0) ? d.teach : 0}/6)</button>
        <select data-f="send" data-i="${i}"><option value="">留在门下</option>${this.maps(G).map(m => `<option value="${m}" ${d.map === m ? 'selected' : ''}>${MAPINFO[m].n}（${this.yieldOf(d, m)}）</option>`).join('')}</select>
        ${this.canHeir(G, d) ? `<button class="opt" data-f="heir" data-i="${i}">立为衣钵</button>` : ''}<button class="opt" data-f="expel" data-i="${i}">逐出</button></div>`;
    });
    s += `<button class="opt" data-f="recruit" ${G.dis36.length >= cap ? 'disabled style="opacity:.45"' : ''}>招收记名弟子</button></div>`;
    s += `<div class="fam37"><b>家族</b><p class="hint">道侣：${F.sp ? this.nm(F.sp) : '无'}${G.debt > 0 && F.rate ? `｜天道利率额外 +${Math.round(F.rate * 100)}%` : ''}</p>`;
    if (!F.sp) s += Object.keys(this.T.fam.spouse).map(id => `<button class="opt" data-f="marry" data-v="${id}" ${this.canMarry(G, id) ? '' : 'disabled style="opacity:.45"'}>求亲·${this.nm(id)}<small>好感${G.aff[id] || 0}/100 恩怨${this.relOf(id)}/60</small></button>`).join('');
    s += F.kids.map(k => `<p>👶 ${esc(k.n)}　${k.age} 岁　${this.lgN(k.lg)}</p>`).join('') || '<p class="hint">尚无子嗣（上限 4）</p>';
    if (F.log.length) s += `<p class="hint">${F.log.slice(0, 4).map(x => esc(x.s)).join('<br>')}</p>`;
    return s + '</div>';
  },
  async onClick(t, box) {
    const f = t.dataset.f, i = +t.dataset.i; const G = this.G();
    if (f === 'recruit') this.recruit();
    else if (f === 'teach') this.teach(i);
    else if (f === 'heir') this.makeHeir(i);
    else if (f === 'expel') this.expel(i);
    else if (f === 'marry') { const id = t.dataset.v, S = this.T.fam.spouse[id]; const N = NPCS[id];
      const c = await UI.card('求亲', S.ask, N ? N.por : 'npc_girl', ['郑重求亲', '算了']);
      if (c === 0) { if (this.marry(id)) await UI.card('结侣', S.yes, N ? N.por : 'npc_girl', ['好']); else await UI.card('结侣', S.no, N ? N.por : 'npc_girl', ['好']); } }
    box.innerHTML = this.html();
  },
};
(function () {
  UI.titles.fam37 = '门下与家族';
  UI.p_fam37 = function (b) {
    b.innerHTML = FAM37.html();
    b.onclick = e => { const t = e.target.closest('button[data-f]'); if (t && !t.disabled) { Sfx.play('click'); FAM37.onClick(t, b); } };
    b.onchange = e => { const t = e.target.closest('[data-f="send"]'); if (!t) return; const i = +t.dataset.i; if (t.value) FAM37.send(i, t.value); else FAM37.recall(i); b.innerHTML = FAM37.html(); };
  };
  // 传承面板末尾加入口
  const _pl = UI.p_legacy26; if (_pl) UI.p_legacy26 = function (b) { const r = _pl.apply(this, arguments); const btn = h('button', 'opt', '👪 门下与家族（记名弟子/道侣/子嗣）'); btn.onclick = e => { e.stopPropagation(); UI.panel('fam37'); }; b.appendChild(btn); return r; };
  // 对话：可结交 NPC 收记名弟子（好感≥60、恩怨≥20）；6 位可婚 NPC 求亲
  const _ex = Talk.extra;
  Talk.extra = function (id) {
    const out = _ex ? _ex.call(this, id) : []; const G = Game.G; if (!G) return out; FAM37.ensure(G); const N = NPCS[id];
    if (id === 'mentor') out.push(['👪 门下与家族', async () => { await UI.panel('fam37'); }]);
    if (N && N.comp && G.realm >= 2 && G.partner !== id && G.apprentice !== id && !G.dis36.some(d => d.npc === id) && (G.aff[id] || 0) >= 60 && FAM37.relOf(id) >= 20 && G.dis36.length < FAM37.cap(G))
      out.push(['📒 收为记名弟子', async () => { const d = FAM37.recruit(id); if (d) UI.toast(`${d.n}成了你的记名弟子`, '#9affd8'); }]);
    if (FAM37.canMarry(G, id)) out.push(['💍 求结道侣', async () => { const S = FAM37.T.fam.spouse[id]; const c = await UI.card('求亲', S.ask, N ? N.por : 'npc_girl', ['郑重求亲', '算了']); if (c === 0 && FAM37.marry(id)) await UI.card('结侣', S.yes, N ? N.por : 'npc_girl', ['好']); }]);
    return out;
  };
  // 派遣共享名额：灵宠派遣时把弟子也算进去
  if (typeof PD35 !== 'undefined') { const _s = PD35.send; PD35.send = function (k, job) { const G = Game.G; const p = G && G.pets[k]; if (p && !(p.pd35 && p.pd35.job) && G && FAM37.used(G) >= FAM37.slots(G) && PD35_JOBS[job] && k !== G.petA) { UI.toast(`派遣名额已满（灵宠+弟子 ${FAM37.slots(G)}）`); return false; } return _s.apply(this, arguments); }; }
  const _ye = Game.yearEnd; Game.yearEnd = async function () {
    const G = this.G; const y0 = G && G.year; const r = await _ye.apply(this, arguments);
    if (G && !G.dead && G.year !== y0) { try { FAM37.disYear(G); await FAM37.famYear(); Game.save(); } catch (e) { console.warn('fam37', e); } }
    return r;
  };
  if (window.DevPanel && DevPanel.registerTab) DevPanel.registerTab('fam37', '门下家族', (box, ctx) => {
    box.innerHTML = ['rec:招 1 名记名弟子', 'lv5:弟子全部 5 级', 'year:结算弟子年度', 'sp:与苏魅结侣（好感100/恩怨60）', 'kid:生一个子嗣', 'grow:子嗣+10 岁', 'ev:触发家族事件', 'succ:父债子还（继任）', 'open:打开面板'].map(x => `<button class="opt" data-x="${x.split(':')[0]}">${x.split(':')[1]}</button>`).join('');
    box.onclick = async e => { const x = e.target.dataset.x; const G = Game.G; if (!x || !G) return; FAM37.ensure(G);
      if (x === 'rec') { if (G.realm < 2) G.realm = 2; ctx.toast(FAM37.recruit() ? '已招收' : '已满'); }
      if (x === 'lv5') G.dis36.forEach(d => { d.lvl = Math.max(5, d.lvl); });
      if (x === 'year') ctx.toast('结算 ' + FAM37.disYear(G).length + ' 名派遣弟子');
      if (x === 'sp') { G.aff.sumei = 100; if (typeof Life34 !== 'undefined') Life34.st().rel.sumei = 60; ctx.toast(FAM37.marry('sumei') ? '已结侣' : '不满足/已有道侣'); }
      if (x === 'kid') { if (!G.fam37.sp) { G.fam37.sp = G.partner || 'sumei'; } const k = FAM37.birth(); ctx.toast(k ? k.n + '·' + FAM37.lgN(k.lg) : '已满 4'); }
      if (x === 'grow') { G.fam37.kids.forEach(k => { k.born -= 10; }); FAM37.grow(G); }
      if (x === 'ev') await FAM37.famEvent();
      if (x === 'succ') { const k = FAM37.succeed('die'); ctx.toast(k ? k.n + ' 继任，欠款 ' + G.debt : '无子嗣'); }
      if (x === 'open') UI.panel('fam37');
      ctx.save(); };
  });
  const css = document.createElement('style');
  css.textContent = `.fam37{margin-top:12px;padding:10px;border-radius:10px;background:rgba(255,190,220,.10);border:1px solid rgba(255,190,220,.4)}.fam37>b{display:block;font-size:16px;color:#ffc0e0}.fam37 p{margin:4px 0}.fam37r{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:6px 0}.fam37r small{opacity:.85;flex:1 1 100%}.fam37 select{font:inherit;padding:4px 6px;border-radius:6px;background:#1a2238;color:#eee;border:1px solid #667}.fam37 .opt small{display:block;font-size:11px;opacity:.8}`;
  document.head.appendChild(css);
})();

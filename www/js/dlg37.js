// 3.7.1 对话抉择（dlg37）
const TEXT371 = {"choices": [{"id": "c37_mom_box", "npc": "mom", "cond": "年龄≥12", "q": "娘从床底拖出个木匣：“你爹走前说，等你修仙有成再打开。现在开，还是再等等？”", "o": [["现在就开", {"aff": 5, "item": {"scroll": 1}}, "里面是一本被虫蛀了一半的功法，和一张你爹欠王大爷三斤米的条子。"], ["等我筑基再开", {"aff": 8, "dx": 5, "mem": "m37_mom_box", "due": [3, "d37_mom_box"]}, "娘把木匣塞回床底：“好，娘替你守着。”"], ["拿去当铺换钱", {"aff": -15, "karma": -8, "stone": 200, "mem": "m37_mom_pawn", "due": [2, "d37_mom_pawn"]}, "当铺掌柜给了你二百灵石，顺手把木匣摆上了货架。"]]}, {"id": "c37_mom_job", "npc": "mom", "cond": "已入宗门", "q": "娘压低声音：“村里人都说你去讨债司当差了，真的假的？”", "o": [["实话：我是被讨债的那个", {"aff": 8, "dx": 5}, "娘愣了半天：“……那咱家还欠多少？娘把鸡卖了。”"], ["骗她：我当了大官", {"aff": 5, "karma": -5, "mem": "m37_mom_lie", "due": [3, "d37_mom_lie"]}, "娘乐得合不拢嘴，当晚就去说书先生那儿显摆了。"], ["转移话题：娘你做的汤真香", {"aff": 3}, "娘笑骂一句“油嘴滑舌”，又给你盛了一碗。"]]}, {"id": "c37_mentor_iou", "npc": "mentor", "cond": "拜师后", "q": "剑仙递来一张皱巴巴的借条：“借为师五十灵石买酒，明年还——这次是真的。”", "o": [["借五十", {"aff": 10, "stone": -50, "mem": "m37_mt_50", "due": [1, "d37_mt_50"]}, "剑仙收钱的速度，比他出剑还快。"], ["借一百，不用还", {"aff": 15, "karma": 5, "stone": -100, "mem": "m37_mt_100", "due": [5, "d37_mt_100"]}, "剑仙沉默片刻：“徒儿，你比为师当年像个人。”"], ["不借", {"aff": -5, "dx": 3}, "剑仙叹气：“唉，世风日下，徒弟都学会理财了。”"]]}, {"id": "c37_mentor_drunk", "npc": "mentor", "cond": "元婴+，且第十八章 hetong 未完成", "q": "剑仙醉醺醺地问：“徒儿，要是为师……骗过你一件大事，你会恨我吗？”", "o": [["不会，师父就是师父", {"aff": 12, "mem": "m37_mt_forgive"}, "剑仙没接话，把剩下半壶酒推给了你。"], ["会，而且记账上", {"aff": -5, "dx": 5, "mem": "m37_mt_grudge"}, "剑仙苦笑：“好，记吧。利息别算太狠。”"], ["看是什么事", {"aff": 3, "dx": 3}, "剑仙打了个酒嗝：“……下回再说，下回。”"]]}, {"id": "c37_sister_sweep", "npc": "sister", "cond": "青云宗弟子", "q": "林小满叉腰：“今天轮你扫山门，你又溜去哪了？”", "o": [["认罚，这就去扫", {"aff": 6, "dx": 3}, "扫到一半，师姐默默拿了把扫帚来帮你。"], ["花二十灵石雇外门弟子", {"aff": -5, "karma": -5, "stone": -20}, "师姐：“有钱了不起？……有钱确实了不起。”"], ["甩锅：是萧逸师兄叫我走的", {"aff": 3, "karma": -8, "affo": {"xiaoyi": -8}, "mem": "m37_si_blame", "due": [2, "d37_si_blame"]}, "萧逸被罚扫了三天山门，他看你的眼神有点复杂。"]]}, {"id": "c37_sister_letter", "npc": "sister", "cond": "青云宗弟子，师姐好感≥40", "q": "师姐塞给你一封信，脸通红：“帮我交给……算了你自己拆开看！”", "o": [["当场拆开", {"aff": 12}, "信上只有一行字：“下次扫山门叫上我。”"], ["原封不动交给掌门", {"aff": -12, "dx": 5}, "掌门看完，意味深长地拍了拍你的肩，没说话。"], ["揣进怀里装没听见", {"aff": -3, "mem": "m37_si_letter", "due": [1, "d37_si_letter"]}, "师姐跺脚走了。信在你怀里，有点烫。"]]}, {"id": "c37_cui_city", "npc": "cuihua", "cond": "筑基+", "q": "翠花：“你带我去城里看看吧，就一次。”", "o": [["带她去云来坊市", {"aff": 15, "stone": -50, "mem": "m37_cui_city", "due": [4, "d37_cui_city"]}, "翠花在胭脂铺前站了一下午，回来的路上一直在算账。"], ["下次一定", {"aff": -5, "mem": "m37_cui_next", "due": [3, "d37_cui_next"]}, "翠花：“好，我记着。”她真的记着。"], ["劝她：外面讨债的多，别出村", {"aff": -8, "dx": 3}, "翠花低头：“……你出去了，不也好好的。”"]]}, {"id": "c37_cui_age", "npc": "cuihua", "cond": "玩家年龄≥40", "q": "翠花摸着鬓角：“我是不是老了？你怎么一点都没变。”", "o": [["骗她：修仙也会老的", {"aff": 8, "karma": -5}, "翠花笑了：“那你可得慢点老，等等我。”"], ["送她一颗延寿丹", {"aff": 20, "karma": 10, "item": {"ysd": -1}, "req": {"item": "ysd"}}, "翠花攥着丹药，好久没说话。"], ["说实话：凡人寿短", {"aff": -5, "dx": 8}, "翠花：“那我就多看你几眼，不亏。”"]]}, {"id": "c37_ali_secret", "npc": "ali", "cond": "阿离好感≥30", "q": "阿离：“你会替我保守秘密吗？”（她的尾巴紧张地卷成一团）", "o": [["会", {"aff": 10, "dx": 3, "mem": "m37_ali_keep"}, "阿离：“我……少一条尾巴，是抵押给讨债司了。别告诉别人。”"], ["会（心里盘算卖给说书先生）", {"aff": 10, "karma": -10, "stone": 100, "mem": "m37_ali_lie", "due": [3, "d37_ali_lie"]}, "说书先生付了一百灵石订金：“狐妖秘闻，下月开讲。”"], ["不会，我嘴不严", {"aff": -5, "dx": 5}, "阿离愣了一下，竟笑了：“你倒老实。”"]]}, {"id": "c37_ali_fish", "npc": "ali", "cond": "背包有灵鱼", "q": "阿离盯着你的包袱：“那条灵鱼，是给我的吧？”", "o": [["给你", {"aff": 12, "item": {"fish": -1}, "req": {"item": "fish"}}, "阿离叼着鱼跑了，跑了三步又回头：“谢……谢了。”"], ["分你一半", {"aff": 6, "karma": 5}, "你们蹲在秘境门口分了一条鱼，谁也没说话。"], ["自己吃", {"aff": -8}, "阿离：“哼，人类。”她记仇的样子很认真。"]]}, {"id": "c37_ao_run", "npc": "aoxiao", "cond": "金丹+", "q": "敖小乐：“我要离家出走！你帮我瞒着我爹，好不好？”", "o": [["帮她瞒", {"aff": 15, "karma": -5, "mem": "m37_ao_hide", "due": [2, "d37_ao_hide"]}, "你替她在龙宫门口说了三个谎，一个比一个离谱。"], ["带她去坊市打工", {"aff": 10, "stone": 100, "mem": "m37_ao_work", "due": [2, "d37_ao_work"]}, "小乐在茶馆端了三天盘子，打碎十七个，赚了一百灵石。"], ["劝她回家", {"aff": -5, "karma": 5, "dx": 3}, "小乐噘嘴：“你跟我爹一个口气！”"]]}, {"id": "c37_ao_rate", "npc": "aoxiao", "cond": "已过第九章 dragon", "q": "小乐神秘兮兮：“我把我爹钱庄的利息表抄出来了，要不要？”", "o": [["要，转手卖掉", {"aff": 5, "karma": -10, "stone": 200}, "买家戴着斗笠，袖口绣着讨债司的徽记。"], ["不要，偷来的不吉利", {"aff": 3, "dx": 5}, "小乐：“你好无聊……但我爹会喜欢你。”"], ["当着她的面撕了", {"aff": -5, "karma": 5}, "小乐目瞪口呆：“那是我抄了三个晚上的！”"]]}, {"id": "c37_su_bet", "npc": "sumei", "cond": "元婴+", "q": "苏魅摇着骰子：“赌一局？你赢，送你破境丹；我赢，你替我讨一笔债。”", "o": [["赌", {"p": 0.5, "win": {"aff": 5, "item": {"pjd": 1}}, "lose": {"aff": 10, "mem": "m37_su_owe", "due": [2, "d37_su_owe"]}}, "骰子落定——（50% 赢 / 50% 输）"], ["请她喝酒代替", {"aff": 12, "item": {"wine": -1}, "req": {"item": "wine"}}, "苏魅：“小可爱，你这招比赌还狠。”"], ["不赌，魔道的骰子不可信", {"aff": -5, "dx": 3}, "苏魅：“魔道讲诚信——可惜今天不讲。”"]]}, {"id": "c37_su_truth", "npc": "sumei", "cond": "苏魅好感≥40", "q": "苏魅托腮：“今天我讲诚信。你问我一个问题吧。”", "o": [["你为什么入魔？", {"aff": 8, "dx": 5}, "“正道的利息比魔道还高。”她说得轻描淡写。"], ["你欠天道多少？", {"aff": 5, "item": {"coin": 1}}, "苏魅大笑，丢给你一枚古钱：“这个数，乘一万。”"], ["今天打几折？", {"aff": -3, "stone": 80}, "苏魅：“……八折。滚吧。”她还真给你退了八十。"]]}, {"id": "c37_xy_sword", "npc": "xiaoyi", "cond": "青云宗弟子", "q": "萧逸挠头：“我的剑又断了……借你的剑练一天行吗？”", "o": [["借", {"aff": 10, "mem": "m37_xy_sword", "due": [1, "d37_xy_sword"]}, "萧逸双手接剑，像接过一个易碎的承诺。"], ["陪他去打一把新的", {"aff": 12, "item": {"ore": -1}, "req": {"item": "ore"}}, "新剑出炉，萧逸当场挥了一下——没断。他差点哭了。"], ["不借，你克剑", {"aff": -5}, "萧逸：“……你说得对。”他更难过了。"]]}, {"id": "c37_xy_peek", "npc": "xiaoyi", "cond": "青云宗弟子，练气5层+", "q": "萧逸凑过来：“藏经阁顶层那本秘籍，今晚一起去偷看？”", "o": [["去", {"aff": 8, "karma": -8, "item": {"scroll": 1}, "mem": "m37_xy_peek", "due": [2, "d37_xy_peek"]}, "你们翻到的第一页写着：“偷看者，罚抄三千遍。”"], ["告诉师姐", {"aff": -12, "karma": 5, "affo": {"sister": 8}}, "师姐当晚就去藏经阁门口守着了。"], ["不去，修行靠自己", {"dx": 5}, "萧逸一个人去了。第二天他眼圈黑了一圈。"]]}, {"id": "c37_at_book", "npc": "aotian", "cond": "第三章 rival 完成后", "q": "龙傲天甩出一本账本：“今日之辱，我记上了！你要不要也记我一笔？”", "o": [["记，互相记", {"aff": 5, "mem": "m37_at_book", "due": [5, "d37_at_book"]}, "你们俩在同一本账上各写了一页，字都很丑。"], ["撕了他的账本", {"aff": -15, "karma": -5, "dx": 3}, "龙傲天：“莫欺少年穷！……我还有备份。”"], ["借他一百让他记", {"aff": 12, "stone": -100, "mem": "m37_at_loan", "due": [3, "d37_at_loan"]}, "龙傲天郑重写下：“欠某某一百，三年后还一百五。”"]]}, {"id": "c37_at_guarantee", "npc": "aotian", "cond": "完成「傲天的秘密」q_at3", "q": "龙傲天别过脸：“其实……我也被人填成了担保人。”", "o": [["同病相怜，拍拍他", {"aff": 12, "dx": 3}, "龙傲天：“别拍了，再拍我就哭了。”"], ["笑出声", {"aff": -15, "karma": -5}, "龙傲天：“记账本上了。”"], ["一起去讨债司申诉", {"aff": 8, "stone": -50, "mem": "m37_at_appeal", "due": [3, "d37_at_appeal"]}, "窗口仙吏给了你们一张号：第 3,000,017 号。"]]}, {"id": "c37_ry_drag", "npc": "ruyan", "cond": "筑基+", "q": "柳如烟：“剑要快，酒要烈，债要拖。你拖不拖？”", "o": [["拖！", {"dx": -5, "karma": -5, "stone": 100}, "她把一张“拖债秘诀”塞给你，背面是她的欠条。"], ["不拖，早还早超生", {"aff": -3, "dx": 5}, "柳如烟：“无趣。但……我敬你。”"], ["敬她一杯", {"aff": 12, "item": {"wine": -1}, "req": {"item": "wine"}}, "两杯下肚，她说起自己欠的那笔债，原来是替师门背的。"]]}, {"id": "c37_ry_duel", "npc": "ruyan", "cond": "柳如烟好感≥30", "q": "柳如烟拔剑：“比一场。输的请喝酒。”", "o": [["比", {"fight": 1, "aff": 5}, "（复用 ruyan 战斗；赢了她 aff 再 +5，输了扣 30 灵石请酒）"], ["直接认输请酒", {"aff": 8, "stone": -30}, "柳如烟：“没劲。不过酒钱你出，我就不计较了。”"], ["改比喝酒", {"aff": 15, "dx": -3, "item": {"wine": -2}, "req": {"item": "wine", "n": 2}}, "你们喝到天亮，谁都没赢，谁都没付钱。"]]}, {"id": "c37_bl_fan", "npc": "bailang", "cond": "—", "q": "白玉郎展开一把空白折扇：“小生为你题字一把，润笔费随意。”", "o": [["给十灵石", {"aff": -3, "stone": -10, "item": {"fan": 1}}, "扇面写着：“十文钱的诗”。"], ["给一百灵石", {"aff": 12, "stone": -100, "item": {"fan": 1}, "mem": "m37_bl_patron", "due": [4, "d37_bl_patron"]}, "扇面写着：“欠债还钱，天经地义——除了欠我的。”"], ["白拿", {"aff": -10, "karma": -5, "item": {"fan": 1}}, "白玉郎追了你半条街：“斯文扫地！斯文扫地！”"]]}, {"id": "c37_bl_poem", "npc": "bailang", "cond": "化神+ 或已到天外天", "q": "白玉郎：“我写了首诗骂天道，你帮我贴到天外天的告示栏上？”", "o": [["贴", {"aff": 10, "karma": 5, "mem": "m37_bl_poem", "due": [2, "d37_bl_poem"]}, "诗的第一句是：“天道放贷不打折”。围观的仙吏都在偷偷抄。"], ["劝他改成夸天道，投稿赚钱", {"aff": -5, "stone": 50}, "改完的诗拿了五十灵石稿费，白玉郎说他很羞耻。"], ["署我的名", {"aff": 5, "dx": -5, "mem": "m37_bl_sign"}, "白玉郎大喜：“壮士！”你隐约觉得哪里不对。"]]}, {"id": "c37_ly_moon", "npc": "lengyue", "cond": "冷月好感≥20", "q": "冷月站在礁石上：“……嗯。”（她似乎在等你开口）", "o": [["说说今天的事", {"aff": 8}, "她听完了，说：“……嗯。”但嘴角动了一下。"], ["陪她站着，不说话", {"aff": 12, "dx": 5}, "月亮落下去之前，她说：“谢谢。”"], ["问她欠不欠钱", {"aff": -8}, "冷月：“……月色尚好，债务尚多。”她转身走了。"]]}, {"id": "c37_ly_tassel", "npc": "lengyue", "cond": "冷月好感≥50", "q": "冷月递来一个旧剑穗：“替我还给一个人。他会来东海找我，但我不想见。”", "o": [["收下，照办", {"aff": 10, "mem": "m37_ly_tassel", "due": [3, "d37_ly_tassel"]}, "剑穗上绣着半个“月”字，另一半被剪掉了。"], ["问：他是谁？", {"aff": -5}, "冷月：“……不必知道。”她把剑穗收了回去。"], ["自己留下当信物", {"aff": -10, "karma": -8, "mem": "m37_ly_keep", "due": [3, "d37_ly_keep"]}, "你把剑穗挂在了自己剑上。冷月看见了，什么也没说。"]]}], "dues": [{"id": "d37_mom_box", "npc": "mom", "cond": "筑基+（未筑基则顺延到筑基当年）", "t": "木匣", "x": "娘把木匣捧出来：“你筑基了，开吧。”里面是你爹的一封信：“儿啊，咱家不欠天道的。是那个喝酒的骗你。”", "e": {"item": {"pyd": 1}, "aff": 10, "dx": 5}}, {"id": "d37_mom_pawn", "npc": "mom", "t": "货架上的木匣", "x": "娘去坊市买盐，在当铺货架上看见了那只木匣。她什么都没问，掏光了攒了三年的鸡蛋钱把它赎了回来。", "e": {"aff": -10, "dx": -5}, "note": "回家后木匣变回 c37_mom_box 的「等我筑基再开」状态（写 m37_mom_box，再挂一个 d37_mom_box，1 年后）"}, {"id": "d37_mom_lie", "npc": "mom", "t": "娘全知道了", "x": "说书先生把“你当了大官”编进了评书，结尾是：“其实他是被讨债的。”全村都笑了。娘没笑，她给你缝了件新衣裳：“当不当官，都是娘的儿。”", "e": {"aff": 5, "dx": 5}, "note": "揭穿不扣好感，娘的人设是早就知道；只收 dx"}, {"id": "d37_mt_50", "npc": "mentor", "t": "剑仙还钱了", "x": "剑仙郑重地还了你一张新借条：“欠徒儿五十灵石整，来年再还。”附赠两壶桃花酿，“利息”。", "e": {"item": {"wine": 2}, "aff": 3}}, {"id": "d37_mt_100", "npc": "mentor", "t": "五年前那一百", "x": "剑仙丢给你一颗破境丹：“当年那一百，为师用天道的算法算了利息——就当是天道还你的。”", "e": {"item": {"pjd": 1}, "aff": 8, "dx": 3}}, {"id": "d37_si_blame", "npc": "xiaoyi", "t": "萧逸知道了", "x": "萧逸在山门口拦住你：“那天是你说我叫你走的？”", "o": [["认错，替他扫一个月山门", {"affo": {"xiaoyi": 12}, "dx": 5, "karma": 5}], ["死不认账", {"affo": {"xiaoyi": -10, "sister": -5}, "karma": -5}]]}, {"id": "d37_si_letter", "npc": "sister", "t": "那封信", "x": "师姐：“信……你看了没有？”", "o": [["看了，下次扫山门叫你", {"aff": 10}], ["丢了", {"aff": -10, "dx": -3}]]}, {"id": "d37_cui_city", "npc": "cuihua", "t": "翠花的胭脂铺", "x": "桃花村口开了一家“翠花胭脂铺”，招牌是你当年在坊市看见的那块样式。翠花：“本钱是我自己攒的，没欠任何人。”她送你一块暖玉。", "e": {"item": {"jadeg": 1}, "aff": 8}}, {"id": "d37_cui_next", "npc": "cuihua", "t": "下次是哪次", "x": "翠花：“你说的下次，是哪次？”", "cond": "若已触发 m37_cui_city 则跳过", "o": [["就这次，走", {"aff": 12, "stone": -50}], ["再下次", {"aff": -15, "dx": -3}]]}, {"id": "d37_ali_lie", "npc": "ali", "t": "原来你早就说出去了", "x": "说书先生的《狐妖秘闻》讲到第三回，阿离就坐在台下。她回头看了你一眼：“原来当年你早就说出去了……”", "e": {"aff": -20, "dx": -5}, "note": "对应 research_story37 §2 验收 A2.1：选撒谎后 3 年整弹出揭穿卡"}, {"id": "d37_ao_hide", "npc": "aoxiao", "t": "龙王上门", "x": "东海龙王带着三个虾兵堵住了你：“小女失踪两年，有人说是你帮她瞒的？”", "o": [["认了，赔礼", {"stone": -300, "affo": {"aoxiao": 10}, "karma": 5}], ["打出去", {"fight": 1, "affo": {"aoxiao": 5}}]], "note": "fight 复用 island 普通精英战；不碰 BOSS 东海龙王剧情数据"}, {"id": "d37_ao_work", "npc": "aoxiao", "t": "龙王的谢礼", "x": "龙王派人送来一箱灵石：“小女回家后，第一次知道钱是赚来的，不是借来的。”", "e": {"stone": 500, "affo": {"aoxiao": 5}}}, {"id": "d37_su_owe", "npc": "sumei", "t": "替苏魅讨债", "x": "苏魅递来一张欠条，欠债人一栏写着“萧逸”。", "o": [["去讨（萧逸哭着还了）", {"stone": 150, "karma": -8, "affo": {"sumei": 10, "xiaoyi": -10}}], ["赖掉赌债", {"affo": {"sumei": -15}, "dx": -3}], ["自己替萧逸还", {"stone": -150, "karma": 8, "affo": {"sumei": 5, "xiaoyi": 10}}]]}, {"id": "d37_xy_sword", "npc": "xiaoyi", "t": "还回来的剑", "x": "萧逸把剑还回来——卷刃了。他红着脸塞给你两块玄铁晶：“赔、赔你的。”", "e": {"item": {"ore": 2}, "affo": {"xiaoyi": 3}}}, {"id": "d37_xy_peek", "npc": "elder", "t": "罚抄三千遍", "x": "掌门翻着藏经阁的出入记录：“两年前顶层少了一本书，记录上有你的脚印。”", "o": [["认罚：交两百灵石", {"stone": -200, "karma": 5}], ["推给萧逸", {"affo": {"xiaoyi": -15}, "karma": -10}]], "note": "没有宗门（已叛出）则跳过"}, {"id": "d37_at_book", "npc": "aotian", "t": "对账", "x": "龙傲天拿着那本账本来找你：“五年了，我算了算，咱俩互相欠的刚好抵消。”他把账本撕了，“以后不记了。”", "e": {"aff": 15, "dx": 5}, "note": "与结局「宿敌成挚友」同向：可作为其达成条件的加分项（由开发决定是否接）"}, {"id": "d37_at_loan", "npc": "aotian", "t": "龙傲天还钱", "x": "龙傲天准时出现，放下一百五十灵石：“莫欺少年穷——我现在不穷了。”", "e": {"stone": 150, "aff": 5}}, {"id": "d37_at_appeal", "npc": "aotian", "t": "申诉回执", "x": "讨债司寄来回执：“您的申诉已受理，预计答复时间：三千年后。随函附赠培元丹一颗，以示歉意。”", "e": {"item": {"pyd": 1}, "dx": 3}}, {"id": "d37_bl_patron", "npc": "bailang", "t": "白玉郎中榜", "x": "白玉郎考进了天庭文书科：“当年你那一百灵石，是小生第一笔润笔费。”他还了三倍。", "e": {"stone": 300, "aff": 5}}, {"id": "d37_bl_poem", "npc": "bailang", "t": "讨债司约谈", "x": "讨债司发来约谈函：“经查，天外天告示栏诗作《天道放贷不打折》系阁下张贴。”", "o": [["认了：交罚款", {"stone": -200, "dx": 5}], ["说是白玉郎写的", {"affo": {"bailang": -15}, "karma": -5}]], "note": "若曾选「署我的名」(m37_bl_sign)，第二项不可选（名字是你的）"}, {"id": "d37_ly_tassel", "npc": "lengyue", "t": "剑穗的另一半", "x": "来东海找冷月的，是一个和她长得一模一样的女子——她的前世残魂。剑穗合上，是一个完整的“月”字。冷月远远看着，第一次对你笑了。", "e": {"aff": 15, "dx": 5}}, {"id": "d37_ly_keep", "npc": "lengyue", "t": "她看见了", "x": "那个人来了，在你剑上看见了剑穗，转身就走。冷月：“……你挂着吧。反正，也还不回去了。”", "e": {"aff": -15, "dx": -5}}]};
// ========== 3.7.1 对话抉择 + 延迟后果（DLG37）==========
// 文案/数值：docs/research_v22.md §9（TEXT371 原样抄自 §9.6 JSON）。只通过包装接入：Talk.extra（菜单「⚐ 抉择」）、Game.yearEnd（后果卡出队）、Game._tryBreak（道心≥30 突破+3pp）。
// 存档：G.mem37 = { v:1, f:{抉择id/记忆flag:{yr,o}}, due:[{id,at,src}], dx, ny:{npc:yr}, ev:{后果卡id_at:1} }；老存档缺省惰性初始化。
// 效果：好感/善恶/灵石/物品全部拼成 Game.apply 字符串执行 → 好感 G.aff 由 life34 的 Game.apply 包装 ×0.5 同步 L.rel（本模块不写 L.rel）；善恶走 game.js 的 karma 分支。
// 新闻：JH34.say（feed 自动截到 40 条）；队列独立于 Life34 的 L.pending。
const DLG37 = {
  T: TEXT371, DX: 50, PER_YEAR: 2,
  G() { return typeof Game !== 'undefined' ? Game.G : null; },
  yr(G) { G = G || this.G(); return G ? (G.year || G.age || 0) : 0; },
  st(G) { G = G || this.G(); if (!G) return null; let M = G.mem37; if (!M || typeof M !== 'object') M = G.mem37 = {};
    M.v = 1; if (!M.f || typeof M.f !== 'object') M.f = {}; if (!Array.isArray(M.due)) M.due = []; if (typeof M.dx !== 'number' || !isFinite(M.dx)) M.dx = 0;
    if (!M.ny || typeof M.ny !== 'object') M.ny = {}; if (!M.ev || typeof M.ev !== 'object') M.ev = {}; return M; },
  C(id) { return this.T.choices.find(c => c.id === id); },
  D(id) { return this.T.dues.find(d => d.id === id); },
  mi(id) { try { return typeof MI === 'function' ? MI(id) : -1; } catch (e) { return -1; } },
  past(id) { const G = this.G(), i = this.mi(id); return i >= 0 && (G.main || 0) > i; },
  aff(id) { const G = this.G(); return (G.aff && G.aff[id]) || 0; },
  // 抉择条件（与 §9.2「条件」列一一对应）
  COND: {
    c37_mom_box: G => G.age >= 12,
    c37_mom_job: G => !!G.sect,
    c37_mentor_iou: G => !!G.flags.awakened,
    c37_mentor_drunk: G => G.realm >= 4 && !DLG37.past('hetong'),
    c37_sister_sweep: G => G.sect === 'qingyun',
    c37_sister_letter: G => G.sect === 'qingyun' && DLG37.aff('sister') >= 40,
    c37_cui_city: G => G.realm >= 2,
    c37_cui_age: G => G.age >= 40,
    c37_ali_secret: G => DLG37.aff('ali') >= 30,
    c37_ali_fish: G => Game.has('fish'),
    c37_ao_run: G => G.realm >= 3,
    c37_ao_rate: G => DLG37.past('dragon') || !!(G.bosses && G.bosses.dragon),
    c37_su_bet: G => G.realm >= 4,
    c37_su_truth: G => DLG37.aff('sumei') >= 40,
    c37_xy_sword: G => G.sect === 'qingyun',
    c37_xy_peek: G => G.sect === 'qingyun' && (G.realm > 1 || (G.realm === 1 && G.stage >= 2)), // “练气5层+”：本作每境 4 段，取练气后期+
    c37_at_book: G => DLG37.past('rival'),
    c37_at_guarantee: G => !!(G.qdone && G.qdone.q_at3),
    c37_ry_drag: G => G.realm >= 2,
    c37_ry_duel: G => DLG37.aff('ruyan') >= 30,
    c37_bl_fan: G => true,
    c37_bl_poem: G => G.realm >= 5 || !!(G.visited && G.visited.heaven),
    c37_ly_moon: G => DLG37.aff('lengyue') >= 20,
    c37_ly_tassel: G => DLG37.aff('lengyue') >= 50,
  },
  scale(G) { G = G || this.G(); return Math.max(1, Math.min(7, G.realm || 0)); }, // 练气×1，金丹×3，化神×5
  // 下一个可做的抉择（不看“本年已做”）
  next(npc, force) { const G = this.G(), M = this.st(G); if (!M) return null;
    for (const c of this.T.choices) { if (c.npc !== npc || M.f[c.id]) continue; let ok = false; try { ok = force || this.COND[c.id](G); } catch (e) { ok = false; } if (ok) return c; } return null; },
  avail(npc) { const M = this.st(); if (!M || M.ny[npc] === this.yr()) return null; return this.next(npc); },
  // 选项是否锁：返回原因或 null
  lock(e) { const G = this.G(); if (!e) return null; if (e.p != null) return null;
    if (e.req) { const n = e.req.n || 1; if (!Game.has(e.req.item, n)) return ((ITEMS[e.req.item] || {}).n || e.req.item) + '不足'; }
    if (e.stone < 0 && G.stone < -e.stone * this.scale(G)) return '灵石不足';
    return null; },
  dead(npc) { try { if (typeof NPC37 !== 'undefined' && NPC37.st) { const S = NPC37.st(); return !!(S && S.st && S.st[npc] && S.st[npc].dead); } } catch (e) { } return false; },
  // 执行效果：返回 { txt, fight }
  async eff(e, npc, src) { const G = this.G(), M = this.st(G), sc = this.scale(G); const tk = [], extra = []; let fight = null;
    if (!e) return { txt: '' };
    if (e.p != null) { const win = Game.roll(e.p, 'dlg37'); const r = await this.eff(win ? e.win : e.lose, npc, src); r.txt = (win ? '（赌赢了）' : '（赌输了）') + (r.txt ? ' ' + r.txt : ''); return r; }
    if (e.aff) tk.push(`aff:${npc}:${e.aff}`);
    if (e.affo) for (const k in e.affo) tk.push(`aff:${k}:${e.affo[k]}`);
    if (e.karma) tk.push(`karma${e.karma > 0 ? '+' : '-'}${Math.abs(e.karma)}`);
    if (e.stone) { const v = e.stone * sc; tk.push(`stone${v > 0 ? '+' : '-'}${Math.abs(v)}`); }
    if (e.item) for (const k in e.item) if (ITEMS[k]) tk.push(`item:${k}:${e.item[k]}`);
    let txt = '';
    if (tk.length) { const r = await Game.apply(tk.join(';')); txt = r.txt || ''; }
    if (e.dx) { const d0 = M.dx; M.dx = Math.max(-this.DX, Math.min(this.DX, M.dx + e.dx)); const d = M.dx - d0; if (d) extra.push(`道心${d > 0 ? '+' : ''}${d}`); }
    if (e.mem) M.f[e.mem] = { yr: this.yr() };
    if (e.due) this.push(e.due[1], this.yr() + e.due[0], src);
    if (e.fight) fight = npc;
    return { txt: [txt, ...extra].filter(Boolean).join('，'), fight };
  },
  push(id, at, src) { const M = this.st(); if (!this.D(id)) return; if (M.due.some(d => d.id === id && d.at === at)) return; M.due.push({ id, at, src: src || '' }); },
  news(s) { try { if (typeof JH34 !== 'undefined' && JH34.ensure && JH34.say) { const L = JH34.ensure(this.G()); if (L) JH34.say(L, s, 'dlg37'); } } catch (e) { } },
  nm(npc) { return ((NPCS[npc] || {}).n || npc).split('·').pop(); },
  // 抉择对话
  async ask(c, opt) { const G = this.G(), M = this.st(G), N = NPCS[c.npc] || { n: c.npc, por: 'npc_disciple' };
    let k = opt;
    while (k == null) { const labels = c.o.map(o => { const l = this.lock(o[1]); return l ? `🔒 ${o[0]}（${l}）` : o[0]; });
      const r = await UI.say(N.por, N.n + ' ⚐', c.q, labels); if (r == null || r < 0) return null;
      const l = this.lock(c.o[r][1]); if (l) { UI.toast(l); continue; } k = r; }
    const o = c.o[k]; M.f[c.id] = { yr: this.yr(), o: k }; M.ny[c.npc] = this.yr();
    const res = await this.eff(o[1], c.npc, c.id);
    if (res.fight) { try { const mon = MONS[c.npc] ? c.npc : 'slime'; await Game.fight(mon, { tier: Math.max(1, G.realm + (G.stage || 0) * 0.2) }); } catch (e) { console.warn('dlg37 fight', e); } }
    if (UI.say && !G.dead) await UI.say(N.por, N.n, o[2] + (res.txt ? `\n\n（${res.txt}）` : ''), ['……']);
    if (/骗|撒谎|当铺|甩锅|推给/.test(o[0])) this.news(`有人看见你和${this.nm(c.npc)}说了几句话，${this.nm(c.npc)}脸色微妙。`);
    try { Game.save(); } catch (e) { } UI.hud && UI.hud(); return k;
  },
  // 年终出队：最多 2 张，先到期先弹；cond 不满足顺延；出场 NPC 已陨落 → 作废写 ev
  ready(d, G) { if (d.id === 'd37_mom_box') return G.realm >= 2; return true; },
  skip(d, G, M) { if (d.id === 'd37_cui_next') return !!M.f.m37_cui_city; if (d.id === 'd37_xy_peek') return !G.sect; return false; },
  async settle(force) { const G = this.G(), M = this.st(G); if (!M || G.dead) return []; const y = this.yr(G), shown = [];
    M.due.sort((a, b) => a.at - b.at);
    for (const q of M.due.slice()) { if (shown.length >= this.PER_YEAR) break; if (!force && q.at > y) continue;
      const D = this.D(q.id), key = q.id + '_' + q.at; if (!D || M.ev[key]) { M.due.splice(M.due.indexOf(q), 1); continue; }
      if (this.dead(D.npc) || this.skip(D, G, M)) { M.ev[key] = 'void'; M.due.splice(M.due.indexOf(q), 1); continue; }
      if (!this.ready(D, G)) continue;
      M.due.splice(M.due.indexOf(q), 1); M.ev[key] = y; shown.push(q.id); await this.card(D); if (G.dead) break; }
    try { Game.save(); } catch (e) { } return shown; },
  async card(D) { const G = this.G(), M = this.st(G), N = NPCS[D.npc] || { por: 'npc_disciple' };
    let res;
    if (D.o) { let k = null; while (k == null) { const labels = D.o.map((o, i) => { const l = (D.id === 'd37_bl_poem' && i === 1 && M.f.m37_bl_sign) ? '名字是你的' : this.lock(o[1]); return l ? `🔒 ${o[0]}（${l}）` : o[0]; });
        const r = await UI.card('⚑ ' + D.t, D.x, N.por, labels); if (r == null || r < 0) { k = labels.length - 1; break; } if (labels[r].startsWith('🔒')) { UI.toast('不可选'); continue; } k = r; }
      M.ev[D.id + '_o'] = k; res = await this.eff(D.o[k][1], D.npc, D.id);
      if (res.fight) { try { const mon = D.id === 'd37_ao_hide' ? 'crab' : (MONS[D.npc] ? D.npc : 'slime'); await Game.fight(mon, { tier: D.id === 'd37_ao_hide' ? MAPINFO.island.tier : Math.max(1, G.realm), elite: true }); } catch (e) { console.warn('dlg37 fight', e); } }
      if (res.txt) UI.toast(res.txt, '#ffd27a');
    } else { res = await this.eff(D.e, D.npc, D.id); await UI.card('⚑ ' + D.t, D.x + (res.txt ? `\n\n（${res.txt}）` : ''), N.por, ['好']); }
    if (D.id === 'd37_mom_pawn') { M.f.m37_mom_box = { yr: this.yr() }; this.push('d37_mom_box', this.yr() + 1, D.id); }
    this.news(`【${D.t}】${this.nm(D.npc)}的事在坊间传开了。`);
  },
};
// 菜单：Talk.extra 链式注入「⚐ 抉择」
if (typeof Talk !== 'undefined') { const _ex = Talk.extra; Talk.extra = function (id) { const out = _ex ? (_ex.apply(this, arguments) || []) : []; try { const c = DLG37.avail(id); if (c) out.push(['⚐ 抉择', () => DLG37.ask(c)]); } catch (e) { console.warn('dlg37 extra', e); } return out; }; }
// 年终：在既有 yearEnd 链（含 pet35）之后出队
{ const _ye = Game.yearEnd; Game.yearEnd = async function () { const G = this.G, y0 = G && G.year; const r = await _ye.apply(this, arguments); if (G && !G.dead && G.year !== y0) { try { await DLG37.settle(); } catch (e) { console.warn('dlg37 settle', e); } } return r; }; }
// 道心≥30：突破 +3 个百分点（并入 95% 封顶，写 tmpBrk 用完复原，同 lg36 做法）
if (Game._tryBreak) { const _tb = Game._tryBreak; Game._tryBreak = async function () { const G = this.G; const M = G && G.mem37; if (!M || !(M.dx >= 30) || G.realm >= 6) return _tb.apply(this, arguments);
  const t0 = G.tmpBrk || 0; const base = REALMS[G.realm].brk + G.st.int * 0.015 + G.st.luck * 0.005 + (G.brkBonus || 0) + t0; const d = Math.max(0, Math.min(0.03, 0.95 - base)); const t1 = t0 + d; G.tmpBrk = t1;
  try { return await _tb.apply(this, arguments); } finally { if (G.tmpBrk === t1) G.tmpBrk = t0; } }; }
// 开发者面板
if (window.DevPanel && DevPanel.registerTab) DevPanel.registerTab('dlg37', '抉择37', (box, ctx) => {
  const G = DLG37.G(), M = DLG37.st(G); if (!M) { box.innerHTML = '<p>未开局</p>'; return; }
  const npcs = [...new Set(DLG37.T.choices.map(c => c.npc))];
  box.innerHTML = `<p>道心 dx=${M.dx}　待弹后果 ${M.due.length} 张：${M.due.map(d => d.id + '@' + d.at).join('、') || '无'}</p>`
    + npcs.map(n => `<button class="opt" data-d="${n}">⚐ ${DLG37.nm(n)}</button>`).join('')
    + '<button class="opt" data-x="settle">立即弹后果（无视年份）</button><button class="opt" data-x="reset">清空抉择记录</button>';
  box.onclick = async e => { const t = e.target.closest('button'); if (!t) return; const n = t.dataset.d, x = t.dataset.x;
    if (n) { const c = DLG37.next(n, true); if (!c) { ctx.toast('该 NPC 抉择已做完'); return; } await DLG37.ask(c); }
    else if (x === 'settle') { const l = await DLG37.settle(true); ctx.toast(l.length ? '弹出 ' + l.join('、') : '无可弹后果'); }
    else if (x === 'reset') { G.mem37 = null; DLG37.st(G); ctx.toast('已清空'); }
    ctx.save && ctx.save(); };
});

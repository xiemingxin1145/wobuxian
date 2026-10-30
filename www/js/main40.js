// ======================= 3.9.2 主线终局补完 main40（规格 docs/research_story40_main.md）第 1 轮 =======================
// 第1轮：G1 化神软引导 / G2 渡劫圆满 gate / G3 结局分支 / G4 q_ev3 猜拳旗 / G5 摊牌记忆句 / G6 Dev 跳转 /
//        G7 挡 content22 旧三选一 / G8 UNSAFE 追加；包 Talk/Track/Game/UI/AUTO；不升 G.v。
// 禁止改 game.js/talk.js/data.js/ui.js/content23.js。加载：index 在 loan42 之后、audio32 之前。
'use strict';
(function (W) {
  const TEXT_MAIN40 = {"meta":{"id":"TEXT_MAIN40","ver":"3.9.2","module":"main40.js","title":"天道讨债终局·主线补完","basedOn":["content22.js","content23.js","research_v22.md§4.4§7","route37","chain37","fam37"]},"endings":{"ys_paid":["工程验收通过","天道修好了漏气三千处的灵气管道，从此凡人种白菜也能顺便筑基。剑仙用一万年打工抵尾款，在南天门当收费员，和过路财轮班。你偶尔路过，他从不收你钱。"],"ys_newdao":["新天道","你成了三界的新总承包方。第一条规定：禁止利滚利。第二条规定：合同必须看完再签。剑仙说第二条是针对他的。"],"ys_auditor":["三界审计","算无遗当上了三界审计，每年对一次总账，从没对平过，但大家都很开心。你和剑仙去龙宫民宿当了股东，敖小白负责前台。"],"jiaxiang":["回家","南天门的栏杆抬了起来，可你没有进去。剑仙拍拍你的肩：“走，回桃花村喝酒。”\n娘做了一桌菜，王大爷的桃又被偷了。天道的账，就让它挂着吧。"],"ys_karma":["功德清账","你这一生功德簿厚得像砖。天道看着你的业力报表，默默把利息划掉了三成，又给你盖了个「诚信修士」的章——章盖歪了。"],"ys_route_mo":["魔君销账","你把验收单翻到背面，批了两个字：「驳回。」天魔殿的旗在南天门猎猎作响，天道第一次学会了排队。"],"ys_route_fu":["买下讨债司","你掏出一张灵石本票。过路财愣了三秒，把栏杆拆了当赠品。讨债司易主那天，欠条被装裱进了大堂。"],"ys_clan":["家谱第一行","你把验收单夹进家谱。娘说这页以后不许撕。子嗣们后来都知道：咱家的债，是一代一代签完的。"]},"cards":{"huashen_wait":{"title":"主线·暂缓催收","body":"纸鹤账单落在你肩上，但抬头一看——你还没渡劫。\n雷部计费科附注：「化神期客户暂存账单，渡劫成功后自动激活催缴。」\n\n（追踪栏会提示：修炼至渡劫，再去催债司找雷公）\n天道欠款暂时冻结利息一年……才怪，利息照收。","por":"npc_leigong","opts":["知道了"]}},"track":{"dianfei":{"leigong":"去催债司问雷公电费的事","dianmu":"去东厢找电母申诉","realm":"先渡劫，再问雷公电费"},"hetong":{"mentor0":"回桃花村找师父","ev":"证物（已集 {n}/3）","fight":"与师父一战"},"zhenshen":{"suanpan":"找算无遗带路进总账房","boss":"与天道真身对账","stage":"渡劫圆满后再战总账房"},"yanshou":{"break":"飞升，去南天门","guolucai":"南天门竣工验收"}},"branch":{"priority":[{"end":"jiaxiang","when":"G.debt<=0 && (G.aff.mentor||0)>=100","ach":"jiaxiang_end"},{"end":"ys_route_mo","when":"G.route37&&G.route37.id==='moxiu' && (G.route37.rep.tianmo||0)>=60 && (G.karma||0)<=-40"},{"end":"ys_route_fu","when":"G.route37&&G.route37.id==='shangjia' && (G.stone||0)>=1000000"},{"end":"ys_clan","when":"G.route37&&G.route37.id==='shijia' && (G.fam37&&G.fam37.kids||[]).length>=2 && Chain37.doneCount(G)>=3"},{"end":"ys_karma","when":"(G.karma||0)>=80 && G.debt<=Math.round(8888*0.3)"},{"end":"ys_paid","when":"bargain 多数选「算天道的」(cnt[0]最大)"},{"end":"ys_auditor","when":"bargain 多数选「各退一步」(cnt[2]>=cnt[1] 且 不小于 cnt[0])；或 flags.suanpan_ally && cnt[2]>=1"},{"end":"ys_newdao","when":"else（多数选「算剑仙的」或平票偏 B）"}],"scoreHint":"砍价仍写 G.flags.bargain='a,b,c'；main40 另写 G.flags.ys40={karma,debt,route,rep,chains,kids} 便于验收。route37 专属结局不覆盖 jiaxiang。"},"dev":{"tabHint":"开发者面板「剧情」已有 MAIN 列表跳转；main40 追加按钮组","buttons":[{"id":"m40_dianfei","n":"跳·第十七章电费单","do":"G.main=MI('dianfei'); G.realm=6; G.stage=0; G.flags.dianfei_1=0; G.flags.dianfei_done=0; G.tribTotal=G.tribTotal||12;"},{"id":"m40_hetong","n":"跳·第十八章合同","do":"G.main=MI('hetong'); G.realm=6; G.flags.dianfei_done=1; G.flags.hetong_1=0; Game.give('hetong_doc',1);"},{"id":"m40_hetong3","n":"跳·合同三证齐","do":"G.main=MI('hetong'); G.realm=6; G.flags.dianfei_done=1; G.flags.hetong_1=1; ['q_ev1','q_ev2','q_ev3'].forEach(q=>G.qdone[q]=1);"},{"id":"m40_zhenshen","n":"跳·终章上真身","do":"G.main=MI('zhenshen'); G.realm=6; G.stage=3; G.flags.mentor_ally=1; G.flags.dianfei_done=1;"},{"id":"m40_yanshou","n":"跳·终章下验收(飞升)","do":"G.main=MI('yanshou'); G.realm=7; G.stage=0; G.flags.mentor_ally=1; G.flags.dianfei_done=1; G.flags.boss_tiandao2=1;"}]},"unsafe":["结局","落幕","飞升","渡劫","成为新天道","销账","算天道","算剑仙","各退一步","以此结局","留在仙界","回家"],"dlg":{"hetong":{"mentor_reveal_extra":{"forgive":"……你说过不会恨我。那这一剑，算利息。","grudge":"你记过账。今天我连本带利还。","silent":"……你不说话比打我还疼。来吧，拔剑。"}},"zhenshen":{"gate_weak":{"who":"tiandao2","t":"“你还太弱了。（需要渡劫圆满——主线终局已延到渡劫，详见更新公告）”","opts":["撤"]},"fight_line":{"title":"天道真身·总账房","t":"“我不是神。我是三界最大的债主，也是最大的欠债人。你要对账？那就看看谁的账更硬。”","opts":["“今天，连本带利！”","先撤"]}},"dianfei_soft":"渡劫成功后再来——账单我给你留着，利息另算。"}};

  const Main40 = W.Main40 = {
    TEXT: TEXT_MAIN40,
    off: false,
    _wired: false,

    mid(id) {
      try { return typeof MI === 'function' ? MI(id) : -1; } catch (e) { return -1; }
    },
    mainId(G) {
      if (!G || typeof MAIN === 'undefined' || !MAIN[G.main]) return null;
      return MAIN[G.main].id;
    },
    storyBlock() {
      try {
        if (typeof NPC37 !== 'undefined' && NPC37 && typeof NPC37.storyBlock === 'function') {
          const r = NPC37.storyBlock();
          if (r) return r;
        }
      } catch (e) { }
      try { if (typeof B !== 'undefined' && B && B.on) return 'battle'; } catch (e) { }
      return null;
    },
    canPopup() { return !this.storyBlock(); },

    /** G3：自上而下第一条命中；砍价多数作兜底（与 content23 同向，auditor 在 suanpan_ally 时权重 +1） */
    pickEnd(G, cnt) {
      if (!G) return 'ys_paid';
      const c = (cnt && cnt.length === 3) ? cnt.map(Number) : [0, 0, 0];
      const affM = (G.aff && G.aff.mentor) || 0;
      if ((G.debt || 0) <= 0 && affM >= 100) return 'jiaxiang';
      const r37 = G.route37 || {};
      const rep = r37.rep || {};
      if (r37.id === 'moxiu' && (rep.tianmo || 0) >= 60 && (G.karma || 0) <= -40) return 'ys_route_mo';
      if (r37.id === 'shangjia' && (G.stone || 0) >= 1e6) return 'ys_route_fu';
      let chains = 0;
      try { if (typeof Chain37 !== 'undefined' && Chain37 && typeof Chain37.doneCount === 'function') chains = Chain37.doneCount(G) || 0; } catch (e) { }
      const kids = (G.fam37 && G.fam37.kids) || [];
      if (r37.id === 'shijia' && kids.length >= 2 && chains >= 3) return 'ys_clan';
      if ((G.karma || 0) >= 80 && (G.debt || 0) <= Math.round(8888 * 0.3)) return 'ys_karma';
      let a = c[0] | 0, b = c[1] | 0, cc = c[2] | 0;
      if (G.flags && G.flags.suanpan_ally) cc += 1;
      if (a >= b && a >= cc) return 'ys_paid';
      if (cc >= b) return 'ys_auditor';
      return 'ys_newdao';
    },

    snapshotYs40(G, cnt) {
      if (!G) return;
      G.flags = G.flags || {};
      const r37 = G.route37 || {};
      let chains = 0;
      try { if (typeof Chain37 !== 'undefined' && Chain37.doneCount) chains = Chain37.doneCount(G) || 0; } catch (e) { }
      G.flags.ys40 = {
        karma: G.karma || 0,
        debt: G.debt || 0,
        route: r37.id || null,
        rep: Object.assign({}, r37.rep || {}),
        chains,
        kids: ((G.fam37 && G.fam37.kids) || []).length,
        bargain: (cnt || []).join(',')
      };
    },

    /** 化神软引导卡（G1） */
    async maybeHuashenWait(G) {
      if (!G || this.off || !this.canPopup()) return;
      if (this.mainId(G) !== 'dianfei') return;
      if ((G.realm || 0) >= 6) return;
      if (G.flags && G.flags.m40_wait) return;
      G.flags = G.flags || {};
      G.flags.m40_wait = 1;
      const card = TEXT_MAIN40.cards.huashen_wait;
      try {
        if (typeof UI !== 'undefined' && UI.card) {
          await UI.card(card.title, card.body, card.por || null, card.opts || ['知道了']);
        }
      } catch (e) { console.warn('[main40] huashen_wait', e); }
      try { if (typeof Game !== 'undefined' && Game.save) Game.save(); } catch (e) { }
    },

    /** G4：逍遥散人猜拳一次 → flags.ev_xy_chess */
    async tryXyChess(G) {
      if (!G || !G.quests || !G.quests.q_ev3 || G.qdone && G.qdone.q_ev3) return false;
      if (G.flags && G.flags.ev_xy_chess) return true;
      const opts = ['出拳·石头', '出拳·剪刀', '出拳·布', '算了'];
      let c = 0;
      try {
        if (typeof UI !== 'undefined' && UI.say) {
          c = await UI.say('npc_xiaoyao', '逍遥散人', '“下棋太慢。猜拳也行——赢了我才说真话。”', opts);
        }
      } catch (e) { return false; }
      if (c === 3 || c < 0) return false;
      // 任意出拳都算陪过一局（用 Game.roll 定胜负文案）
      let win = true;
      try {
        if (typeof Game !== 'undefined' && Game.roll) win = !!Game.roll(0.55, 'qiyu');
        else win = Math.random() < 0.55;
      } catch (e) { }
      G.flags = G.flags || {};
      G.flags.ev_xy_chess = 1;
      try {
        if (typeof UI !== 'undefined' && UI.toast) UI.toast(win ? '你赢了。散人叹气：“行，我说。”' : '你输了。散人仍说：“……行吧，看在你陪我玩的份上。”');
      } catch (e) { }
      try { if (typeof Game !== 'undefined' && Game.save) Game.save(); } catch (e) { }
      return true;
    },

    wire() {
      if (this._wired || this.off) return;
      if (typeof Game === 'undefined' || typeof Talk === 'undefined') return;
      this._wired = true;

      // ENDINGS / CG_END
      try {
        if (typeof ENDINGS !== 'undefined') Object.assign(ENDINGS, TEXT_MAIN40.endings);
      } catch (e) { }
      try {
        if (typeof CG_END !== 'undefined') {
          Object.assign(CG_END, {
            ys_paid: 'cg_tiandao', ys_newdao: 'cg_tiandao', ys_auditor: 'cg_zhenshen',
            jiaxiang: 'cg_mentor', ys_karma: 'cg_tiandao',
            ys_route_mo: 'cg_tiandao', ys_route_fu: 'cg_tiandao', ys_clan: 'cg_mentor'
          });
        }
      } catch (e) { }

      // G4：q_ev3 改为 flags.ev_xy_chess（老档 visit_guishi 不再秒完成）
      try {
        if (typeof QUESTS !== 'undefined' && QUESTS.q_ev3) {
          QUESTS.q_ev3.need = { f: 'ev_xy_chess' };
          QUESTS.q_ev3.d = '逍遥散人说他只在下棋时说真话。陪他猜一拳——去鬼市找他。';
        }
      } catch (e) { }

      // ---- Talk.mainTalk：G1 软引导星标 + G5 摊牌记忆 + G4 猜拳入口 ----
      const _mt = Talk.mainTalk;
      Talk.mainTalk = function (id, check) {
        const G = (typeof Game !== 'undefined') ? Game.G : null;
        if (!G) return _mt ? _mt.call(this, id, check) : null;
        const mid = Main40.mainId(G);

        // G1：化神期 dianfei → 雷公星标但只提示
        if (mid === 'dianfei' && (G.realm || 0) < 6 && id === 'leigong') {
          if (check) return true;
          return ['★ 这电费是怎么回事', async () => {
            const line = TEXT_MAIN40.dlg.dianfei_soft;
            try {
              if (typeof UI !== 'undefined' && UI.say) {
                await UI.say('npc_leigong', '雷公', '“' + line + '”', ['……好']);
              } else if (typeof UI !== 'undefined' && UI.toast) UI.toast(line);
            } catch (e) { }
          }];
        }

        // G4：xiaoyao + q_ev3 进行中 → 猜拳
        if (id === 'xiaoyao' && G.quests && G.quests.q_ev3 && !(G.qdone && G.qdone.q_ev3) && !(G.flags && G.flags.ev_xy_chess)) {
          if (check) return true;
          return ['★ 陪散人猜拳', async () => { await Main40.tryXyChess(G); if (typeof Game !== 'undefined' && Game.refreshNpcs) Game.refreshNpcs(); }];
        }

        // G5：hetong 摊牌时追加记忆句——包在 content23 之后，拦截 mentor 三证齐对话
        if (mid === 'hetong' && id === 'mentor' && G.flags && G.flags.hetong_1) {
          const evN = ['q_ev1', 'q_ev2', 'q_ev3'].filter(q => G.qdone && G.qdone[q]).length;
          if (evN >= 3) {
            if (check) return true;
            return ['★ 师父，拔剑吧', async () => {
              const say = async (who, t, opts) => {
                const por = (typeof NPCS !== 'undefined' && NPCS[who] && NPCS[who].por) || ('npc_' + who);
                const n = (typeof NPCS !== 'undefined' && NPCS[who] && NPCS[who].n) || who;
                return UI.say(por, n, t, opts || ['……']);
              };
              await say('mentor', '“好。我说。这个世界，是我订的。”', ['订的？']);
              await say('mentor', '“一万年前，我找天道包工建一个世界，有山有水有灵气。首付付了，尾款……没付。”', ['然后呢']);
              await say('mentor', '“担保人那一栏要写生辰八字，我手边没人，就随手写了一个。后来那个八字真的出生了，就是你。”', ['所以天道一直追着我讨债？']);
              const ex = TEXT_MAIN40.dlg.hetong.mentor_reveal_extra;
              let opts = ['师父，拔剑吧', '（先不说话）'];
              let preface = '“嗯。我躲在桥洞下喝酒，就是不敢见你。后来忍不住，还是去收了你当徒弟……想着至少教你打得过讨债的。”';
              if (G.flags.m37_mt_forgive) preface += '\n' + ex.forgive;
              if (G.flags.m37_mt_grudge) preface += '\n' + ex.grudge;
              const c = await say('mentor', preface, opts);
              if (c === 1) await say('mentor', '“' + ex.silent + '”', ['……']);
              if (G.flags.m37_mt_forgive && c === 0) G.aff.mentor = (G.aff.mentor || 0) + 10;
              if (G.flags.m37_mt_grudge && c === 1) { G.aff.mentor = (G.aff.mentor || 0) - 5; G.karma = (G.karma || 0) + 2; }
              G.aff.mentor = (G.aff.mentor || 0) + (c === 0 ? 10 : -10);
              const c2 = await UI.say('npc_mentor', '剑仙·李欠欠本相', '“这一万年的欠条，每一张都是一把剑。接得住，你就出师了。”', ['“我接！”', '先撤']);
              if (c2 !== 0) return;
              const r = await Game.fight('mentor_true', { tier: 6.4, boss: true, solo: true, noflee: true, noPenalty: true });
              if (r.res !== 'win') return;
              G.flags.mentor_ally = 1; G.aff.mentor = (G.aff.mentor || 0) + 30;
              Game.ach('hetong_win'); Game.give('xyf', 2); Game.give('xsd', 1);
              if (G.titles && !G.titles.includes('李欠欠的担保人')) G.titles.push('李欠欠的担保人');
              if (!G.follower) G.follower = 'mentor';
              await UI.card('出师', '剑仙收剑，坐在桃树下，把酒葫芦递给你。\n“好，这一剑，我还你。剩下的，我们一起去跟天道算。”\n\n【落魄剑仙 加入同行】\n下一步：渡劫圆满后前往天庭催债司地下，找天道真身对账。', 'npc_mentor', ['继续']);
              G.main = Main40.mid('zhenshen');
              if (Game.checkMain) Game.checkMain();
              Game.refreshNpcs(); Game.save();
            }];
          }
        }

        return _mt ? _mt.call(this, id, check) : null;
      };

      // ---- Talk.boss：G2 stage===3 + G7 永不露出旧三选一 ----
      const _boss = Talk.boss;
      Talk.boss = async function (id) {
        const G = (typeof Game !== 'undefined') ? Game.G : null;
        if (id === 'tiandao2' && G && Main40.mainId(G) === 'zhenshen') {
          if ((G.realm || 0) < 6) {
            const g = TEXT_MAIN40.dlg.zhenshen.gate_weak;
            await UI.say('boss_tiandao2', (typeof MONS !== 'undefined' && MONS.tiandao2 && MONS.tiandao2.n) || '天道真身', g.t, g.opts);
            return;
          }
          if ((G.stage | 0) < 3) {
            await UI.say('boss_tiandao2', '天道真身·总账房', '“渡劫未圆满。账房大门只对圆满客户开放——你差一层。”', ['撤']);
            return;
          }
          // 走 content23 路径（其已 return，不会落到 content22 三选一）
          return _boss.call(this, id);
        }
        // G7：若 content22 即将展示旧三选一（main 已非 zhenshen 但仍打 tiandao2），抢先吞掉
        if (id === 'tiandao2' && G) {
          const before = Main40.mainId(G);
          // 让下层跑；若赢了且出现「天道认账」三选一卡，UI.card 包装会挡（见下）
          const r = await _boss.call(this, id);
          return r;
        }
        return _boss.call(this, id);
      };

      // ---- Track.target：G1 / G2 文案 ----
      if (typeof Track !== 'undefined' && Track.target) {
        const _tt = Track.target.bind(Track);
        Track.target = function (q) {
          const t = _tt(q);
          const G = (typeof Game !== 'undefined') ? Game.G : null;
          if (q !== 'main' || !G) return t;
          const id = Main40.mainId(G);
          const TX = TEXT_MAIN40.track;
          if (id === 'dianfei' && (G.realm || 0) < 6) {
            return { kind: 'realm', btn: '修炼', txt: (TX.dianfei && TX.dianfei.realm) || '先渡劫，再问雷公电费' };
          }
          if (id === 'zhenshen' && ((G.realm || 0) < 6 || (G.stage | 0) < 3)) {
            return { kind: 'realm', btn: '修炼', txt: (TX.zhenshen && TX.zhenshen.stage) || '渡劫圆满后再战总账房' };
          }
          return t;
        };
      }

      // ---- enterMap：化神软引导卡 ----
      if (Game.enterMap && !Game.enterMap._main40) {
        const _em = Game.enterMap.bind(Game);
        Game.enterMap = async function (id) {
          const r = await _em(id);
          try {
            const G = this.G;
            if (G) await Main40.maybeHuashenWait(G);
          } catch (e) { console.warn('[main40] enterMap', e); }
          return r;
        };
        Game.enterMap._main40 = 1;
      }

      // ---- G3：包装 UI.card 结局卡 + Game.die，按 pickEnd 重算 ----
      if (typeof UI !== 'undefined' && UI.card && !UI.card._main40) {
        const _card = UI.card.bind(UI);
        UI.card = async function (title, body, por, opts) {
          // G7：吞掉 content22「天道认账」旧三选一
          if (typeof title === 'string' && title === '天道认账' && Array.isArray(opts) && opts.some(o => /成为新天道|天庭审计|销账/.test(String(o)))) {
            const G = (typeof Game !== 'undefined') ? Game.G : null;
            if (G && !G.flags.boss_tiandao2) {
              // 若 content23 未处理完，补一张正确推进卡
              try {
                G.bosses = G.bosses || {}; G.bosses.tiandao2 = 1;
                G.flags.boss_tiandao2 = 1;
                if (Main40.mainId(G) === 'zhenshen' || Main40.mainId(G) === 'dianfei') {
                  /* keep */
                } else if (Main40.mid('yanshou') >= 0) {
                  G.main = Main40.mid('yanshou');
                }
              } catch (e) { }
            }
            await _card('原来甲方在这儿', '（旧三选一已关闭）总账房的算盘崩落。天道真身：“飞升吧。我在南天门等你们签字。”', 'boss_tiandao2', ['继续']);
            try { if (typeof Game !== 'undefined') { if (Game.checkMain) Game.checkMain(); Game.refreshNpcs && Game.refreshNpcs(); Game.save && Game.save(); } } catch (e) { }
            return 0;
          }
          if (typeof title === 'string' && title.indexOf('结局·') === 0) {
            const G = (typeof Game !== 'undefined') ? Game.G : null;
            if (G && G.flags && G.flags.bargain) {
              const cnt = String(G.flags.bargain).split(',').map(Number);
              const end = Main40.pickEnd(G, cnt);
              Main40.snapshotYs40(G, cnt);
              G.flags.ys_end = end;
              if (end === 'jiaxiang') { try { if (typeof Game !== 'undefined' && Game.ach) Game.ach('jiaxiang_end'); } catch (e) { } }
              const E = (typeof ENDINGS !== 'undefined' && ENDINGS[end]) || TEXT_MAIN40.endings[end] || ['竣工验收', ''];
              title = '结局·' + E[0];
              body = E[1] + '\n\n（结局已记录。你可以就此落幕，也可以留在仙界继续修行——尾声与仙界篇在等你。）';
              try { if (typeof Game !== 'undefined' && Game.save) Game.save(); } catch (e) { }
            }
          }
          return _card(title, body, por, opts);
        };
        UI.card._main40 = 1;
      }

      if (Game.die && !Game.die._main40) {
        const _die = Game.die.bind(Game);
        Game.die = async function (kind) {
          const G = this.G;
          if (G && G.flags && G.flags.ys_end && kind && (String(kind).indexOf('ys_') === 0 || kind === 'jiaxiang')) {
            kind = G.flags.ys_end;
          }
          return _die(kind);
        };
        Game.die._main40 = 1;
      }

      // ---- G8：AUTO.pick 追加 unsafe ----
      try {
        if (typeof AUTO !== 'undefined' && AUTO.pick && !AUTO.pick._main40) {
          const extra = new RegExp('(' + (TEXT_MAIN40.unsafe || []).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')');
          const _pick = AUTO.pick.bind(AUTO);
          AUTO.pick = function (top) {
            const b = _pick(top);
            if (b && extra.test(b.textContent || '')) {
              // 当作需要玩家选择
              return null;
            }
            return b;
          };
          AUTO.pick._main40 = 1;
        }
      } catch (e) { }

      // ---- G6：DevPanel 跳转 ----
      const regDev = () => {
        if (!W.DevPanel || typeof DevPanel.registerTab !== 'function') return false;
        DevPanel.registerTab('main40', '主线40', (box, ctx) => {
          const G = (typeof Game !== 'undefined') ? Game.G : null;
          if (!G) { box.innerHTML = '<p class="hint">未开局</p>'; return; }
          const btns = (TEXT_MAIN40.dev && TEXT_MAIN40.dev.buttons) || [];
          box.innerHTML = '<p class="hint">main40 终局跳转（置 flag / realm / stage）</p>' +
            btns.map(b => '<button class="opt" data-m40="' + b.id + '">' + b.n + '</button>').join('');
          box.onclick = e => {
            const id = e.target && e.target.dataset && e.target.dataset.m40;
            if (!id) return;
            const def = btns.find(x => x.id === id);
            if (!def) return;
            try {
              G.flags = G.flags || {}; G.qdone = G.qdone || {}; G.bosses = G.bosses || {};
              if (id === 'm40_dianfei') {
                G.main = Main40.mid('dianfei'); G.realm = 6; G.stage = 0;
                G.flags.dianfei_1 = 0; G.flags.dianfei_done = 0; G.tribTotal = G.tribTotal || 12;
              } else if (id === 'm40_hetong') {
                G.main = Main40.mid('hetong'); G.realm = 6; G.flags.dianfei_done = 1; G.flags.hetong_1 = 0;
                if (typeof Game !== 'undefined' && Game.give) Game.give('hetong_doc', 1);
              } else if (id === 'm40_hetong3') {
                G.main = Main40.mid('hetong'); G.realm = 6; G.flags.dianfei_done = 1; G.flags.hetong_1 = 1;
                ['q_ev1', 'q_ev2', 'q_ev3'].forEach(q => { G.qdone[q] = 1; });
              } else if (id === 'm40_zhenshen') {
                G.main = Main40.mid('zhenshen'); G.realm = 6; G.stage = 3;
                G.flags.mentor_ally = 1; G.flags.dianfei_done = 1;
              } else if (id === 'm40_yanshou') {
                G.main = Main40.mid('yanshou'); G.realm = 7; G.stage = 0;
                G.flags.mentor_ally = 1; G.flags.dianfei_done = 1; G.flags.boss_tiandao2 = 1;
              }
              if (typeof Game !== 'undefined') {
                if (Game.checkMain) Game.checkMain();
                if (Game.refreshNpcs) Game.refreshNpcs();
                if (Game.save) Game.save();
              }
              if (ctx && ctx.toast) ctx.toast(def.n);
              else if (typeof UI !== 'undefined' && UI.toast) UI.toast(def.n);
            } catch (er) { console.error('[main40] dev', er); }
          };
        });
        return true;
      };
      if (!regDev()) {
        let n = 0;
        const t = setInterval(() => { if (regDev() || ++n > 40) clearInterval(t); }, 500);
      }
    }
  };

  function boot() {
    try { Main40.wire(); } catch (e) { console.error('[main40] wire', e); }
  }
  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  // 脚本在 Game 之后加载；立即再试一次
  try { boot(); } catch (e) { }
})(typeof window !== 'undefined' ? window : globalThis);

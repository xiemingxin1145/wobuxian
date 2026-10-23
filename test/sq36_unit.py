# 3.6 神器（sq36）单测 + 点按 UI 检查（docs/research_v36.md §2 验收 A2.1–A2.4）
# 第 1 部分：无头 evaluate 直接调模块函数核对公式（诊断用，同 lg36_unit / sys33_unit 风格）。
# 第 2 部分：老档兼容——写一个不含 G.sq36 的旧存档（筑基、已觉醒）→ 刷新 → 真实触摸「继续人生」→ G.sq36 缺省 {own:{},eq:null,quest:null}；
#           桃花村出现金色「？神器线索」（神农鼎首图），真实触摸点线索 → 追寻 → 1/4 环、碎晶 +5。
# 第 3 部分：真实触摸（CDP touch，412×915）：开发者面板「神器36」Tab 发两把神器 → 更多 → 洞府 → 神器阁：
#           按钮不溢出、可点中；供奉一把成功，立刻换另一把被冷却挡下（无消耗）。用到的作弊（开发者面板 UI）列在输出 cheats。
import asyncio, os, sys, json
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www'))
URL = 'file://' + ROOT + '/index.html'
VW, VH = 412, 915
SHOTS = os.environ.get('SHOTS', '/workspace/shots36'); os.makedirs(SHOTS, exist_ok=True)
UNIT = r"""async()=>{const o={};
  Game.newLife({name:'测试',sex:'m',lg:'san',talents:[],st:{str:5,con:5,int:0,luck:0,wealth:5,charm:5}}); const G=Game.G;
  G.flags.awakened=1; G.st.int=0; G.st.luck=0; G.brkBonus=0; G.tmpBrk=0; G.cultBonus=0; G.jieRes=0; G.pillBonus=0; if(G.cheat) G.cheat={};
  const M=Game.meta; delete M.sq36seen;
  // ---- 老档缺省 ----
  delete G.sq36; const s0=SQ36.st(G); o.defaults=JSON.stringify(s0)==='{"own":{},"eq":null,"quest":null}';
  G.sq36={own:{sq_fuxi:{aw:1,q:4}},eq:'sq_bad',quest:{id:'nope',step:1}}; SQ36.st(G); o.sanitize=G.sq36.eq===null&&G.sq36.quest===null&&!!G.sq36.own.sq_fuxi; G.sq36={own:{},eq:null,quest:null};
  // ---- A2.1 未接链：5 个剪影 + 线索地图名 ----
  G.realm=2; const d=document.createElement('div'); d.innerHTML=SQ36.html(G);
  o.A21_sil=d.querySelectorAll('.sq36it .sil').length; o.A21_unknown=[...d.querySelectorAll('.sq36it b')].filter(b=>b.textContent==='？？？').length;
  o.A21_maps=['乱葬岗 → 魔道裂谷','天外天','桃花村 → 药王谷','东海仙岛 → 东海龙宫','青云宗'].every(t=>d.innerText.includes(t));
  o.A21_seek=d.querySelectorAll('[data-sq="seek"]').length;
  // ---- A2.2 伏羲琴：元婴→化神 42→47（Ⅰ、Ⅲ 相同），金丹→元婴 50→55；修为 6%→12% ----
  const cards=[]; const _card=UI.card; UI.card=function(t,x){cards.push([t,String(x)]); return Promise.resolve(1);};
  const brk=async(realm)=>{G.realm=realm; G.stage=3; G.exp=Game.need(); G.tmpBrk=0; cards.length=0; await Game.tryBreak(); const c=cards.find(c=>c[0]==='冲击瓶颈'); const m=c&&c[1].match(/成功率约 (\d+)%/); return m?+m[1]:null;};
  o.base_r4=await brk(4); o.base_r3=await brk(3);
  G.sq36.own.sq_fuxi={aw:1,q:4}; G.sq36.own.sq_xuanyuan={aw:1,q:5}; SQ36.enshrine('sq_fuxi',G);
  o.A22_r4_aw1=await brk(4); o.A22_r3_aw1=await brk(3);
  SQ36.off=true; const c0=Game.cultMult(); SQ36.off=false; o.A22_cult_aw1=+(Game.cultMult()/c0).toFixed(4);
  G.sq36.own.sq_fuxi.aw=2; o.cult_aw2=+(Game.cultMult()/c0).toFixed(4);
  G.sq36.own.sq_fuxi.aw=3; o.A22_r4_aw3=await brk(4); o.A22_cult_aw3=+(Game.cultMult()/c0).toFixed(4);
  G.brkBonus=0.51; o.cap95=await brk(4); G.brkBonus=0.6; o.cap_over=await brk(4); G.brkBonus=0;   // 0.42+0.51=0.93 → +2 封顶 95；1.02 → 不加（游戏原 97 封顶）
  o.tmpRestored=G.tmpBrk===0;
  // ---- A2.3 同时持有 2 把只能装 1 把；切换无消耗；冷却 1 游戏日 ----
  G.year=10; G.month=3; G.sq36.cd=null; G.stone=777; G.inv.sqj=9;
  o.A23_eq1=SQ36.enshrine('sq_xuanyuan',G)===''&&G.sq36.eq==='sq_xuanyuan';
  const why=SQ36.enshrine('sq_fuxi',G); o.A23_blocked=why.includes('冷却')&&G.sq36.eq==='sq_xuanyuan';
  o.A23_off_blocked=SQ36.enshrine(null,G)!==''&&G.sq36.eq==='sq_xuanyuan';
  G.month=4; o.A23_nextday=SQ36.enshrine('sq_fuxi',G)===''&&G.sq36.eq==='sq_fuxi';
  o.A23_free=G.stone===777&&G.inv.sqj===9; o.A23_single=typeof G.sq36.eq==='string';
  // ---- A2.4 链步数：一周目 5/6/4/5/4；二周目 2 ----
  o.steps1=Object.keys(SQ36.LIST).map(id=>SQ36.steps(id)).join(',');
  o.maps_xy=[0,1,2,3,4].map(k=>SQ36.stepMap('sq_xuanyuan',k)).join(',');
  G.sq36={own:{},eq:null,quest:null}; G.realm=2; G.inv.sqj=0;
  o.startXY=SQ36.startQuest('sq_xuanyuan',G); let n=0; let r; do { r=SQ36.advance(G); n++; } while(r&&!r.done&&n<20);
  o.chain1=[n,!!G.sq36.own.sq_xuanyuan,G.sq36.own.sq_xuanyuan&&G.sq36.own.sq_xuanyuan.aw,G.inv.sqj,G.sq36.quest]; o.seen=!!M.sq36seen.sq_xuanyuan;
  // 轮回：新一世 G 无 sq36（不继承），meta 记录 → 2 环
  Game.newLife({name:'二世',sex:'f',lg:'san',talents:[],st:{str:5,con:5,int:0,luck:0,wealth:5,charm:5}}); const G2=Game.G; G2.flags.awakened=1; G2.realm=2;
  o.reborn_empty=!SQ36.st(G2).own.sq_xuanyuan;
  o.A24_steps=SQ36.steps('sq_xuanyuan'); o.A24_maps=[SQ36.stepMap('sq_xuanyuan',0),SQ36.stepMap('sq_xuanyuan',1)].join(',');
  SQ36.startQuest('sq_xuanyuan',G2); n=0; do { r=SQ36.advance(G2); n++; } while(r&&!r.done&&n<20); o.A24_rings=n; o.A24_got=!!G2.sq36.own.sq_xuanyuan;
  o.other_steps=SQ36.steps('sq_kunlun');
  // ---- 基础属性 Ⅰ/Ⅱ/Ⅲ ----
  const g=G2; g.sq36.own={sq_xuanyuan:{aw:1},sq_kunlun:{aw:1},sq_shennong:{aw:1},sq_haotian:{aw:1},sq_fuxi:{aw:1}}; g.sq36.cd=null;
  const rat=(id,f)=>{const out=[]; for(const aw of [1,2,3]){g.sq36.own[id].aw=aw; g.sq36.eq=id; SQ36.off=true; const a=f(); SQ36.off=false; out.push(+(f()/a).toFixed(4));} return out.join('/');};
  o.atk=rat('sq_xuanyuan',()=>Game.stats().atk); o.def=rat('sq_haotian',()=>Game.stats().def);
  const tvd=id=>{const out=[]; for(const aw of [1,2,3]){g.sq36.own[id].aw=aw; g.sq36.eq=id; SQ36.off=true; const a=Game.treeVal('alch'); SQ36.off=false; out.push(+(Game.treeVal('alch')-a).toFixed(3));} return out.join('/');};
  o.alch=tvd('sq_shennong'); o.dodge=[1,2,3].map(aw=>{g.sq36.own.sq_kunlun.aw=aw; g.sq36.eq='sq_kunlun'; return SQ36.val('dodge');}).join('/');
  g.sq36.eq='sq_xuanyuan'; o.atkOnlyEq=SQ36.val('def')===0&&SQ36.val('cult')===0;
  g.sq36.eq=null; o.noEq=SQ36.val('atk')===0;
  // ---- 法则：轩辕斩杀 ----
  const R0=Math.random; Math.random=()=>0.5;
  const A={isPlayer:true,atk:1000,skillBonus:0,metalBonus:0,crit:0,el:'无',buf:{},side:0};
  const mk=(hp,boss)=>({def:100,buf:{},el:'无',side:1,mhp:10000,hp,boss:!!boss});
  g.sq36.eq='sq_xuanyuan'; g.sq36.own.sq_xuanyuan.aw=1; const plain=calcDmg(A,mk(9000),SKILLS.atk).dm; o.xy_plain=plain;
  o.xy_aw1_nokill=calcDmg(A,mk(1400),SKILLS.atk).dm===plain;
  g.sq36.own.sq_xuanyuan.aw=3; o.xy_kill=calcDmg(A,mk(1400),SKILLS.atk).dm===1400; o.xy_far=calcDmg(A,mk(9000),SKILLS.atk).dm===plain;
  const bd=calcDmg(A,mk(2700,true),SKILLS.atk); o.xy_boss=bd.dm===Math.round(plain*1.3)&&bd.tag.includes('斩杀'); o.xy_boss_far=calcDmg(A,mk(9000,true),SKILLS.atk).dm===plain;
  o.xy_enemyNo=calcDmg(Object.assign({},A,{isPlayer:false,side:1}),Object.assign(mk(1400),{side:0}),SKILLS.atk).dm===plain;
  // ---- 法则：昆仑闪避 + 回溯 ----
  const P=()=>({isPlayer:true,def:100,buf:{},el:'无',side:0,mhp:10000,hp:500}); const E={atk:1000,crit:0,el:'无',buf:{},side:1};
  g.sq36.eq='sq_kunlun'; g.sq36.own.sq_kunlun.aw=1; const e1=calcDmg(E,P(),SKILLS.atk).dm;
  Math.random=()=>0.03; o.kl_dodge_aw1=calcDmg(E,P(),SKILLS.atk).dm===0; Math.random=()=>0.06; o.kl_nododge_aw1=calcDmg(E,P(),SKILLS.atk).dm>0;
  g.sq36.own.sq_kunlun.aw=3; Math.random=()=>0.09; o.kl_dodge_aw3=calcDmg(E,P(),SKILLS.atk).dm===0; Math.random=()=>0.5;
  const p=P(); p.hp=100; const k1=calcDmg(E,p,SKILLS.atk); o.kl_rewind=k1.dm===0&&p.hp===3100&&k1.tag==='镜光回溯'; p.hp=100; const k2=calcDmg(E,p,SKILLS.atk); o.kl_once=k2.dm>=100;
  const p2=P(); p2.hp=9000; o.kl_nonlethal=calcDmg(E,p2,SKILLS.atk).dm===e1&&p2.hp===9000;
  g.sq36.own.sq_kunlun.aw=2; const p3=P(); p3.hp=100; o.kl_aw2_norewind=calcDmg(E,p3,SKILLS.atk).dm>=100;
  // ---- 法则：神农鼎 丹药 ×1.25 ----
  const heal=async(id,aw)=>{g.sq36.eq=id; if(id) g.sq36.own[id].aw=aw; const mhp=Game.stats().mhp; g.hp=1; g.inv.hcd=1; await UI.useItem('hcd'); return g.hp-1;};
  const h0=await heal(null); o.sn_aw1=(await heal('sq_shennong',1))===h0; const h3=await heal('sq_shennong',3); o.sn_aw3=+(h3/h0).toFixed(3); o.pillRestored=g.pillBonus===0;
  // ---- 法则：昊天塔 雷劫 ×0.65 ----
  const _bgm=Audio2.bgm; Audio2.bgm=()=>{}; const mid=R.mapId; R.mapId=R.mapId||'village'; g.realm=3; g.hpBonus=1000;
  const tri=async(id,aw)=>{g.sq36.eq=id; if(id) g.sq36.own[id].aw=aw; const mhp=Game.stats().mhp; await Game.tribulation(1,3); return mhp-g.hp;};
  const t0=await tri(null); const t1=await tri('sq_haotian',1); const t3=await tri('sq_haotian',3); o.ht=[t0,t1,t3]; o.ht_aw1=t1===t0; o.ht_aw3=Math.abs(t3/t0-0.65)<0.01; o.jieRestored=g.jieRes===0;
  Audio2.bgm=_bgm; R.mapId=mid; Math.random=R0;
  // ---- 觉醒Ⅱ/Ⅲ ----
  g.sq36.eq=null; g.sq36.own.sq_fuxi={aw:1,q:4}; g.realm=3; g.stone=50000; g.inv.sqj=100;
  o.aw2_realm=SQ36.awCheck('sq_fuxi',g).includes('元婴'); g.realm=4; g.inv.sqj=19; o.aw2_sj=SQ36.awCheck('sq_fuxi',g).includes('碎晶'); g.inv.sqj=100; g.stone=2999; o.aw2_stone=SQ36.awCheck('sq_fuxi',g).includes('灵石'); g.stone=50000;
  UI.card=()=>Promise.resolve(0); o.aw2=await SQ36.awaken('sq_fuxi'); o.aw2_paid=[g.stone,g.inv.sqj];
  o.aw3_realm=SQ36.awCheck('sq_fuxi',g).includes('化神'); g.realm=5;
  const _f=Game.fight; let ft=null; Game.fight=async(m,op)=>{ft=op.tier; return {res:'lose'};}; o.aw3_lose=await SQ36.awaken('sq_fuxi'); o.aw3_lose_free=g.stone===47000&&g.inv.sqj===80&&g.sq36.own.sq_fuxi.aw===2;
  o.trialTier=ft===(MAPINFO[R.mapId]||MAPINFO.village).tier+1;
  Game.fight=async()=>({res:'win'}); o.aw3=await SQ36.awaken('sq_fuxi'); o.aw3_paid=[g.stone,g.inv.sqj]; Game.fight=_f; o.aw4=SQ36.awCheck('sq_fuxi',g);
  // ---- 碎晶：秘境通关 / 世界BOSS ----
  g.inv.sqj=0; Dng.run={band:0,floor:3,maxFloor:3,bossDone:true,over:false,loot:[]}; Dng.exit(true); o.dng=g.inv.sqj; Dng.run={band:0,floor:2,maxFloor:3,bossDone:true,over:false,loot:[]}; Dng.exit(true); o.dng_partial=g.inv.sqj;
  g.inv.sqj=0; g.year=4; g.wb33={y:4,hp:1000,tries:3,dmg:0,best:null,done:false,killed:false}; const _sb=Game._startBattle; Game._startBattle=async()=>({res:'win',units:[{mon:'wb33',hp:0,alive:false}]}); const _set=WB33.settle; WB33.settle=async()=>{}; const _mk=WB33.mark; WB33.mark=()=>{};
  await WB33.challenge(); o.wb=g.inv.sqj; Game._startBattle=_sb; WB33.settle=_set; WB33.mark=_mk;
  UI.card=_card;
  o.dev=(window.DevTabs||[]).some(t=>t.key==='sq36'); o.item=!!ITEMS.sqj&&ITEMS.sqj.n==='神器碎晶';
  o.saveRound=(()=>{const j=JSON.parse(JSON.stringify(g)); return !!j.sq36&&j.sq36.own.sq_fuxi.aw===3&&j.v===2;})();
  delete Game.meta.sq36seen; Game.saveMeta();
  return o;}"""
EXP = {'defaults': True, 'sanitize': True, 'A21_sil': 5, 'A21_unknown': 5, 'A21_maps': True, 'A21_seek': 5,
       'base_r4': 42, 'base_r3': 50, 'A22_r4_aw1': 47, 'A22_r3_aw1': 55, 'A22_cult_aw1': 1.06, 'cult_aw2': 1.09, 'A22_r4_aw3': 47, 'A22_cult_aw3': 1.12,
       'cap95': 95, 'cap_over': 97, 'tmpRestored': True,
       'A23_eq1': True, 'A23_blocked': True, 'A23_off_blocked': True, 'A23_nextday': True, 'A23_free': True, 'A23_single': True,
       'steps1': '5,6,4,5,4', 'maps_xy': 'graveyard,graveyard,graveyard,rift,rift', 'startXY': True, 'chain1': [5, True, 1, 25, None], 'seen': True,
       'reborn_empty': True, 'A24_steps': 2, 'A24_maps': 'graveyard,rift', 'A24_rings': 2, 'A24_got': True, 'other_steps': 6,
       'atk': '1.08/1.12/1.16', 'def': '1.08/1.12/1.16', 'alch': '0.08/0.12/0.16', 'dodge': '0.05/0.07500000000000001/0.1', 'atkOnlyEq': True, 'noEq': True,
       'xy_aw1_nokill': True, 'xy_kill': True, 'xy_far': True, 'xy_boss': True, 'xy_boss_far': True, 'xy_enemyNo': True,
       'kl_dodge_aw1': True, 'kl_nododge_aw1': True, 'kl_dodge_aw3': True, 'kl_rewind': True, 'kl_once': True, 'kl_nonlethal': True, 'kl_aw2_norewind': True,
       'sn_aw1': True, 'sn_aw3': 1.25, 'pillRestored': True, 'ht_aw1': True, 'ht_aw3': True, 'jieRestored': True,
       'aw2_realm': True, 'aw2_sj': True, 'aw2_stone': True, 'aw2': 2, 'aw2_paid': [47000, 80], 'aw3_realm': True, 'aw3_lose': False, 'aw3_lose_free': True, 'trialTier': True,
       'aw3': 3, 'aw3_paid': [35000, 20], 'aw4': '已觉醒Ⅲ', 'wb': 2, 'dev': True, 'item': True, 'saveRound': True}
async def main():
    errs = []; fails = []; cheats = []; out = {}
    def ok(k, cond, info=None):
        out[k] = {'ok': bool(cond), 'info': info}; print(k, 'PASS' if cond else 'FAIL', json.dumps(info, ensure_ascii=False)[:500], flush=True)
        if not cond: fails.append(k)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME', '/opt/google/chrome/chrome'), args=['--allow-file-access-from-files'])
        # ---------- 1 单测 ----------
        pg = await b.new_page(viewport={'width': VW, 'height': VH}); pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        res = await pg.evaluate(UNIT)
        bad = [k for k, v in EXP.items() if res.get(k) != v]
        ok('1_unit', not bad, {'bad': {k: [res.get(k), EXP[k]] for k in bad}})
        ok('dng_shards', 1 <= res['dng'] <= 3 and res['dng_partial'] == res['dng'], [res['dng'], res['dng_partial']])
        print(json.dumps(res, ensure_ascii=False))
        await pg.close()
        # ---------- 2/3 真实触摸 ----------
        ctx = await b.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        cdp = await ctx.new_cdp_session(pg)
        async def tap(x, y):
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]}); await pg.wait_for_timeout(60)
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        async def tap_sel(sel, wait=400, scroll=True, text=None):
            r = await pg.evaluate("([s,sc,tx])=>{const e=[...document.querySelectorAll(s)].filter(x=>x.getClientRects().length>0&&(!tx||x.textContent.includes(tx))).pop();if(!e)return null;if(sc)e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;const t=document.elementFromPoint(x,y);return {x,y,hit:!!t&&(t===e||e.contains(t))}}", [sel, scroll, text])
            if not r: return False
            await pg.wait_for_timeout(120); await tap(r['x'], r['y']); await pg.wait_for_timeout(wait); return r['hit']
        async def settle(n=30):
            for k in range(n):
                if await pg.evaluate('()=>UX.inMap()'): return True
                if await pg.evaluate('()=>typeof B!=="undefined"&&B.on'): await tap_sel('#battlebar button[data-a=auto]', 1500); continue
                for s in ['.gacha-fx .gclose', '.gacha-fx .gskip', '#modals .mwrap:last-child .ph .x', '#modals .mwrap:last-child .opt']:
                    if await tap_sel(s, 500): break
                else: await pg.wait_for_timeout(600)
            return False
        G = lambda js: pg.evaluate('()=>{const G=Game.G;return ' + js + '}')
        top = lambda: pg.evaluate("()=>{const m=[...document.querySelectorAll('#modals .mwrap')].pop();return m?m.innerText.slice(0,200):''}")
        # 2 老档：开一局 → 写回不含 sq36 的筑基档（模拟 3.5 旧档）→ 刷新 → 点「继续人生」
        await pg.goto(URL + '#dev'); await pg.wait_for_timeout(1500)
        await pg.tap('text=开始新人生'); await pg.wait_for_timeout(400); await pg.tap('#nx'); await pg.wait_for_timeout(200)
        for k in range(3): await pg.locator('.talb').nth(k).tap()
        for k in range(3): await pg.tap('#nx'); await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(2500); await settle()
        snap = await pg.evaluate("()=>JSON.stringify(Game.G)")
        await pg.reload(); await pg.wait_for_timeout(2000)
        await pg.evaluate("(j)=>{const s=JSON.parse(j);delete s.sq36;s.realm=2;s.stage=0;s.flags.awakened=1;s.map='village';s.pos=null;if(!Array.isArray(s.mingge))s.mingge=['caimi'];localStorage.setItem('wbx2_save',JSON.stringify(s));const m=JSON.parse(localStorage.getItem('wbx2_meta')||'{}');delete m.sq36seen;localStorage.setItem('wbx2_meta',JSON.stringify(m));}", snap)
        await pg.reload(); await pg.wait_for_timeout(2000)
        await tap_sel('.tbtns [data-k="cont"]', 2500, False); await settle()
        old = await G("({had:'sq36' in G, sq:JSON.stringify(SQ36.st()), v:G.v, map:R.mapId, mark:(R.marks.find(m=>m.act==='sq36')||{}).sq||null})")
        ok('2_oldsave', old['sq'] == '{"own":{},"eq":null,"quest":null}' and old['v'] == 2 and old['map'] == 'village' and old['mark'] == 'sq_shennong', old)
        # 2b 真实触摸金色线索点
        got = {}
        for k in range(4):
            await settle()
            r = await pg.evaluate("""()=>{const m=R.marks.find(m=>m.act==='sq36');if(!m)return null;const [x,y]=t2p(m.i+0.5,m.j+0.5);const [sx,sy]=w2s(x,y-(m.h||110));const h=pickAt(sx,sy);return {s:[sx/R.dpr,sy/R.dpr],pick:h.mark?h.mark.act:h.ent?h.ent.kind:'tile'}}""")
            if not r: break
            if not (0 < r['s'][0] < VW and 60 < r['s'][1] < VH - 120):
                # 不在屏内：先点线索方向的地面走近一点（真实触摸）
                tx = min(VW - 40, max(40, r['s'][0])); ty = min(VH - 200, max(140, r['s'][1])); await tap(tx, ty); await pg.wait_for_timeout(2500); continue
            got['pick'] = r['pick']; await tap(*r['s'])
            for q in range(40):
                await pg.wait_for_timeout(300); t = await top()
                if '神器线索' in t: break
                if await pg.evaluate('()=>typeof B!=="undefined"&&B.on'): break
            t = await top(); got['card'] = t[:80]
            if '神器线索' in t: break
        await pg.screenshot(path=f'{SHOTS}/sq36_clue.png')
        await tap_sel('#modals .mwrap:last-child .opt', 900, True, '追寻')
        t2 = await top(); got['ring'] = t2[:80]
        await tap_sel('#modals .mwrap:last-child .opt', 700, True, '继续追寻')
        st = await G("({q:G.sq36.quest,sj:G.inv.sqj||0,mark:!!R.marks.find(m=>m.act==='sq36')})")
        got.update(st)
        ok('2_clue_tap', '神器线索' in got.get('card', '') and '1/4' in t2 and st['q'] == {'id': 'sq_shennong', 'step': 1} and st['sj'] == 5 and st['mark'], got)
        # 3 开发者面板「神器36」→ 轩辕残剑 + 昆仑镜
        await settle()
        for k in range(3):
            if await pg.evaluate("()=>!!document.querySelector('.devtabs')"): break
            await settle(); await tap_sel('#devbtn', 700, False)
        await tap_sel('.devtabs .dt[data-t="sq36"]', 500)
        await tap_sel('#modals .pb button[data-g="sq_xuanyuan"]', 400); cheats.append('sq36:轩辕残剑')
        await tap_sel('#modals .pb button[data-g="sq_kunlun"]', 400); cheats.append('sq36:昆仑镜')
        s1 = await G("({own:Object.keys(G.sq36.own).sort().join(','),tabs:[...document.querySelectorAll('.devtabs .dt')].map(e=>e.dataset.t).join(',')})")
        ok('3_dev', s1['own'] == 'sq_kunlun,sq_xuanyuan', s1)
        for k in range(4):
            if not await pg.evaluate("()=>!!document.querySelector('#modals .mwrap:last-child .ph .x')"): break
            await tap_sel('#modals .mwrap:last-child .ph .x', 500, False)
        await settle()
        await tap_sel('#menu .mb[data-p="more"]', 700, False); await tap_sel('#modals .big2[data-k="cave"]', 900)
        ent = await pg.evaluate("()=>{const e=document.querySelector('.sq36wrap .sq36open');if(!e)return null;const fb=document.querySelector('.fb33wrap');return {txt:e.innerText,afterFb:!!fb&&fb.nextElementSibling===e.parentElement}}")
        await tap_sel('.sq36wrap .sq36open', 900)
        await pg.screenshot(path=f'{SHOTS}/sq36_hall.png')
        lay = await pg.evaluate("""()=>{const its=[...document.querySelectorAll('#modals .mwrap:last-child .sq36it')];
          const hit=e=>{e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();const t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!t&&(t===e||e.contains(t));};
          const title=(document.querySelector('#modals .mwrap:last-child .ph b')||{}).textContent;
          return {title,n:its.length,sil:document.querySelectorAll('#modals .mwrap:last-child .sq36it .sil').length,rows:its.map(it=>{const r=it.getBoundingClientRect();return {id:it.dataset.id,x:r.x,r:r.right,ov:it.scrollWidth>it.clientWidth+1,btns:[...it.querySelectorAll('button')].map(b=>{const q=b.getBoundingClientRect();return {t:b.innerText,x:q.x,r:q.right,h:q.height,sw:b.scrollWidth,cw:b.clientWidth,hit:hit(b)}})}})}}""")
        good = bool(lay) and lay['title'] == '神器阁' and lay['n'] == 5 and lay['sil'] == 3 and all(r['x'] >= 0 and r['r'] <= VW and not r['ov'] and all(b['x'] >= 0 and b['r'] <= VW and b['sw'] <= b['cw'] + 1 and b['h'] >= 40 and b['hit'] for b in r['btns']) for r in lay['rows'])
        ok('3_layout', good and ent and ent['afterFb'], {'ent': ent, 'lay': lay})
        s0 = await G("[G.stone,G.inv.sqj||0]")
        await tap_sel('#modals .mwrap:last-child .sq36it[data-id="sq_xuanyuan"] [data-sq="eq"]', 700)
        e1 = await G("G.sq36.eq")
        await tap_sel('#modals .mwrap:last-child .sq36it[data-id="sq_kunlun"] [data-sq="eq"]', 700)
        toast = await pg.evaluate("()=>[...document.querySelectorAll('.toast,#toasts *')].map(e=>e.textContent).join('|').slice(-200)")
        e2 = await G("({eq:G.sq36.eq,cd:document.querySelector('#modals .mwrap:last-child .sq36head .cd')?1:0,row:(document.querySelector('#modals .mwrap:last-child .sq36it.eq')||{}).innerText||''})")
        s2 = await G("[G.stone,G.inv.sqj||0]")
        await pg.screenshot(path=f'{SHOTS}/sq36_enshrine.png')
        ok('3_enshrine', e1 == 'sq_xuanyuan' and e2['eq'] == 'sq_xuanyuan' and e2['cd'] == 1 and s0 == s2 and '轩辕残剑' in e2['row'], {'e1': e1, 'e2': e2, 's0': s0, 's2': s2, 'toast': toast})
        await b.close()
    ok('no_pageerror', not errs, errs[:5])
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'results'), exist_ok=True)
    json.dump({'res': out, 'cheats': cheats, 'fails': fails}, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'results', 'sq36_unit.json'), 'w'), ensure_ascii=False, indent=1)
    print('cheats', cheats); print('FAILS', fails)
    if fails: sys.exit(1)
    print('sq36_unit ALL PASS')
asyncio.run(main())

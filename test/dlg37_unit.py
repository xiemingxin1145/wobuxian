# 3.7.1 对话抉择（dlg37）无头单元检查：对应 docs/research_v22.md §9.4 验收要点 + §2 A2.1–A2.4
import asyncio, os, sys, json
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www', 'index.html'))
JS = r"""async()=>{const o={};
  // 自动应答：UI.say/UI.card 按队列选项，否则选 0
  window.__ans=[]; UI.say=async(p,n,t,opts)=>{const a=__ans.length?__ans.shift():0; return a;}; UI.card=async(t,x,p,opts)=>{window.__cards=(window.__cards||[]);__cards.push(t); return __ans.length?__ans.shift():0;}; UI.toast=()=>{};
  Game.newLife({name:'测试',sex:'m',lg:LINGGEN[1].id,talents:[],st:{str:5,con:5,int:5,luck:5,wealth:5,charm:5}}); const G=Game.G;
  o.cnt=[DLG37.T.choices.length,DLG37.T.choices.reduce((a,c)=>a+c.o.length,0),DLG37.T.dues.length].join(',');
  o.npcs=new Set(DLG37.T.choices.map(c=>c.npc)).size; o.allNpcReal=DLG37.T.choices.every(c=>NPCS[c.npc]);
  o.condAll=DLG37.T.choices.every(c=>typeof DLG37.COND[c.id]==='function');
  o.dueAll=DLG37.T.choices.every(c=>c.o.every(x=>{const e=x[1];const ds=[e.due,e.win&&e.win.due,e.lose&&e.lose.due].filter(Boolean);return ds.every(d=>DLG37.D(d[1]));}));
  o.itemsOk=JSON.stringify(DLG37.T).match(/"item":\{[^}]*\}/g).every(s=>Object.keys(JSON.parse(s.slice(7))).every(k=>ITEMS[k]));
  // 老档：无 mem37 也能读
  delete G.mem37; const M=DLG37.st(); o.oldSave=M.dx===0&&Array.isArray(M.due)&&Object.keys(M.f).length===0;
  o.tab=(window.DevTabs||[]).some(t=>t.key==='dlg37');
  // A2.1：阿离撒谎 → 3 年整弹 d37_ali_lie
  G.aff.ali=40; G.year=10; G.age=20; const L=Life34.st(); const rel0=L.rel.ali||0; const k0=G.karma;
  o.menu=Talk.extra('ali').some(x=>x[0]==='⚐ 抉择');
  await DLG37.ask(DLG37.C('c37_ali_secret'),1); o.aliAff=G.aff.ali; o.relHalf=(L.rel.ali||0)-rel0; o.karma=G.karma-k0;
  o.dueAt=JSON.stringify(M.due.filter(d=>d.id==='d37_ali_lie').map(d=>d.at));
  // A2.2：同年不再出现；第二年出第二个
  o.sameYear=!Talk.extra('ali').some(x=>x[0]==='⚐ 抉择'); G.year=11; G.inv.fish=1; o.nextYear=DLG37.avail('ali')&&DLG37.avail('ali').id;
  G.year=12; o.notYet=(await DLG37.settle()).length===0; G.year=13; __cards=[]; const a0=G.aff.ali; const s13=await DLG37.settle(); o.pop13=s13.join(); o.lieAff=G.aff.ali-a0;
  G.year=16; o.once=(await DLG37.settle()).length===0;
  // 第 1 项不会弹
  G.mem37=null; DLG37.st(); await DLG37.ask(DLG37.C('c37_ali_secret'),0); o.opt0NoDue=G.mem37.due.length===0;
  // 出队上限 2
  G.mem37=null; const M2=DLG37.st(); G.year=20; G.flags.awakened=1; G.sect='qingyun'; G.aff.sister=50; G.stone=99999; G.realm=1;
  await DLG37.ask(DLG37.C('c37_mentor_iou'),0); await DLG37.ask(DLG37.C('c37_sister_letter'),2); await DLG37.ask(DLG37.C('c37_xy_sword'),0);
  o.due3=M2.due.length; G.year=21; o.y21=(await DLG37.settle()).length; G.year=22; o.y22=(await DLG37.settle()).length;
  // 灵石缩放：化神 c37_ao_work 100×5，2 年后 500×5
  G.mem37=null; DLG37.st(); G.realm=5; G.year=30; const st0=G.stone; const ao=DLG37.C('c37_ao_run'); const aoIdx=ao.o.findIndex(x=>x[1].stone>0);
  await DLG37.ask(ao,aoIdx); o.aoStone=G.stone-st0; G.year=32; const st1=G.stone; await DLG37.settle(); o.aoWork=G.stone-st1;
  // req 🔒：无桃花酿
  G.inv.wine=0; const sb=DLG37.C('c37_su_bet'), rd=DLG37.C('c37_ry_drag'); o.lockSu=!!DLG37.lock(sb.o[1][1]); o.lockRy=!!DLG37.lock(rd.o[2][1]);
  // 点了锁住项会重问，不扣东西：先答 1（锁），再答 2
  G.mem37=null; DLG37.st(); const stx=G.stone; __ans=[1,2]; await DLG37.ask(sb); o.lockRetry=G.mem37.f.c37_su_bet.o===2&&G.stone===stx;
  // 灵石不足 🔒
  G.stone=0; o.lockStone=DLG37.lock({stone:-50})==='灵石不足'; G.stone=99999;
  // dx 夹取
  G.mem37.dx=48; await DLG37.eff({dx:5},'mom'); o.dxClamp=G.mem37.dx;
  // mom_box 顺延到筑基
  G.mem37=null; DLG37.st(); G.realm=1; G.year=40; await DLG37.ask(DLG37.C('c37_mom_box'),1); G.year=43; o.boxWait=(await DLG37.settle()).length===0&&G.mem37.due.length===1; G.realm=2; G.year=44; o.boxPop=(await DLG37.settle()).join();
  // 读档：due 存档后仍在，到期只弹一次
  G.mem37=null; DLG37.st(); G.year=50; await DLG37.ask(DLG37.C('c37_ali_secret'),1); Game.save(); const S=JSON.parse(localStorage.getItem('wbx2_save')); o.saveDue=S.mem37&&S.mem37.due.length===1&&!!S.mem37.f.c37_ali_secret;
  Game.G.mem37=S.mem37; G.year=53; o.ld1=(await DLG37.settle()).length; Game.G.mem37.due.push({id:'d37_ali_lie',at:53}); o.ld2=(await DLG37.settle()).length;
  // cui_next 跳过
  G.mem37=null; const M3=DLG37.st(); M3.f.m37_cui_city={yr:1}; DLG37.push('d37_cui_next',G.year); o.cuiSkip=(await DLG37.settle()).length===0&&M3.due.length===0;
  // 苏魅赌局不受金手指
  o.rollFn=/kind === 'brk'/.test(Game.roll.toString());
  // 新闻走 JH34
  const J=JH34.ensure(G); const n0=J.feed.length; DLG37.news('test'); o.news=J.feed.length===n0+1||J.feed.length===40;
  // 奥拉夫 nit1：c37_ry_duel 按战斗结果结算（赢 aff+5，输 −30 灵石×境界系数）
  const _f=Game.fight; G.realm=1; G.aff.ruyan=40;
  G.mem37=null; DLG37.st(); Game.fight=async()=>({res:'win'}); let a1=G.aff.ruyan, s1=G.stone; await DLG37.ask(DLG37.C('c37_ry_duel'),0); o.duelWin=[G.aff.ruyan-a1, G.stone-s1].join();
  G.mem37=null; DLG37.st(); Game.fight=async()=>({res:'lose'}); a1=G.aff.ruyan; s1=G.stone; await DLG37.ask(DLG37.C('c37_ry_duel'),0); o.duelLose=[G.aff.ruyan-a1, G.stone-s1].join();
  Game.fight=_f;
  // nit2：关掉后果卡（返回 null）= 选第一个（未锁）选项
  G.mem37=null; const M4=DLG37.st(); const D4=DLG37.T.dues.find(d=>d.o&&!DLG37.lock(d.o[0][1])&&!(d.o[0][1]||{}).fight); const _c=UI.card; UI.card=async()=>null; await DLG37.card(D4); UI.card=_c; o.dismissFirst=M4.ev[D4.id+'_o'];
  // nit3：阿离「分你一半」需要灵鱼并扣 1 条
  const af=DLG37.C('c37_ali_fish'); G.inv.fish=0; o.fishLock=!!DLG37.lock(af.o[1][1]); G.inv.fish=1; G.mem37=null; DLG37.st(); await DLG37.ask(af,1); o.fishAfter=G.inv.fish||0;
  return o;}"""
EXP = {'cnt': '24,72,22', 'npcs': 12, 'allNpcReal': True, 'condAll': True, 'dueAll': True, 'itemsOk': True, 'oldSave': True, 'tab': True,
       'menu': True, 'relHalf': None, 'karma': None, 'dueAt': '[13]', 'sameYear': True, 'nextYear': 'c37_ali_fish', 'notYet': True, 'pop13': 'd37_ali_lie',
       'lieAff': -20, 'once': True, 'opt0NoDue': True, 'due3': 3, 'y21': 2, 'y22': 1, 'aoStone': 500, 'aoWork': 2500, 'lockSu': True, 'lockRy': True,
       'lockRetry': True, 'lockStone': True, 'dxClamp': 50, 'boxWait': True, 'boxPop': 'd37_mom_box', 'saveDue': True, 'ld1': 1, 'ld2': 0, 'cuiSkip': True, 'news': True, 'duelWin': '5,0', 'duelLose': '0,-30', 'dismissFirst': 0, 'fishLock': True, 'fishAfter': 0}
async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': 412, 'height': 915})
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto(URL); await pg.wait_for_timeout(3000)
        o = await pg.evaluate(JS); await b.close()
    c = DLG37 = json.loads(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www', 'js', 'dlg37.js'), encoding='utf-8').read().split('const TEXT371 = ', 1)[1].split(';\n', 1)[0])
    e = [x for x in c['choices'] if x['id'] == 'c37_ali_secret'][0]['o'][1][1]
    EXP['relHalf'] = int(e['aff'] * 0.5) if e['aff'] >= 0 else -int(-e['aff'] * 0.5); EXP['karma'] = e.get('karma', 0)
    bad = 0
    for k, v in EXP.items():
        good = o.get(k) == v; bad += not good; print(('OK  ' if good else 'FAIL'), k, o.get(k), '' if good else f'(want {v})')
    print('pageerrors:', errs); bad += len(errs)
    print('RESULT', 'PASS' if not bad else f'FAIL {bad}'); sys.exit(1 if bad else 0)
asyncio.run(main())

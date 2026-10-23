# 3.6 灵根深化（lg36）单测 + 点按 UI 检查（docs/research_v36.md §3 验收 A3.1–A3.4）
# 第 1 部分：无头 evaluate 直接调模块函数核对公式（诊断用，同 sys33_unit / lian35_unit 风格）。
# 第 2 部分：老档兼容——写一个不含 G.lg36 的旧存档 → 刷新 → 真实触摸「继续人生」→ 纯度缺省 50、修炼倍率不变。
# 第 3 部分：真实触摸（CDP touch，412×915）：开发者面板「灵根36」Tab 设天灵根+发灵石/天材地宝 → 角色面板灵根栏两个洗根按钮
#           不溢出、可点中、点开有确认卡、点「算了」不扣任何东西。用到的作弊（开发者面板 UI）列在输出 cheats。
import asyncio, os, sys, json
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www'))
URL = 'file://' + ROOT + '/index.html'
VW, VH = 412, 915
SHOTS = os.environ.get('SHOTS', '/workspace/shots36'); os.makedirs(SHOTS, exist_ok=True)
UNIT = r"""async()=>{const o={};
  Game.newLife({name:'测试',sex:'m',lg:'san',talents:[],st:{str:5,con:5,int:0,luck:0,wealth:5,charm:5}}); const G=Game.G;
  G.flags.awakened=1; G.st.int=0; G.st.luck=0; G.brkBonus=0; G.tmpBrk=0; G.cultBonus=0; if(G.cheat) G.cheat={};
  // ---- A3.1 老档 san：无 lg36 → 纯度 50 → 比值 1.00 ----
  delete G.lg36; LG36.off=true; const m0=Game.cultMult(); LG36.off=false; const m1=Game.cultMult();
  o.A31_ratio=+(m1/m0).toFixed(4); o.A31_pur=G.lg36&&G.lg36.pur;
  G.lg36.pur=0; o.pur0=+(Game.cultMult()/m0).toFixed(4); G.lg36.pur=100; o.pur100=+(Game.cultMult()/m0).toFixed(4); G.lg36.pur=50;
  // ---- A3.2 元素亲和（Math.random 固定，比较 LG36.off 前后）----
  const R0=Math.random; Math.random=()=>0.5;
  const A={isPlayer:true,atk:20000,skillBonus:0,metalBonus:0,crit:0,el:'金',buf:{}}, D={def:100,buf:{},el:'无'};
  const ratio=(lg,sk)=>{G.lg=lg; LG36.off=true; const a=calcDmg(A,D,SKILLS[sk]).dm; LG36.off=false; const b=calcDmg(A,D,SKILLS[sk]).dm; return +(b/a).toFixed(3);};
  o.A32_tian_metal=ratio('tian','swordqi'); o.A32_tian_fire=ratio('tian','fireball'); o.A32_tian_atk=ratio('tian','atk');
  o.A32_lei_thunder=ratio('lei','thunder'); o.wu_metal=ratio('wu','swordqi'); o.shuang_fire=ratio('shuang','fireball'); o.none_metal=ratio('none','swordqi');
  o.bing_ice=ratio('bing','icecone');
  const Pet=Object.assign({},A,{isPlayer:false}); G.lg='tian'; LG36.off=true; const pa=calcDmg(Pet,D,SKILLS.swordqi).dm; LG36.off=false; o.petNoAff=calcDmg(Pet,D,SKILLS.swordqi).dm===pa;
  Math.random=R0;
  // ---- A3.3 突破显示：lei 元婴→化神 37%；san 42%；none 凡人→练气 封顶 95% ----
  const cards=[]; const _card=UI.card; UI.card=function(t,x){cards.push([t,String(x)]); return Promise.resolve(1);};
  const brkShow=async(lg,realm)=>{G.lg=lg; G.realm=realm; G.stage=3; G.exp=Game.need(); G.tmpBrk=0; cards.length=0; await Game.tryBreak(); const c=cards.find(c=>c[0]==='冲击瓶颈'); const m=c&&c[1].match(/成功率约 (\d+)%/); return m?+m[1]:null;};
  o.A33_lei=await brkShow('lei',4); o.tmpRestored=G.tmpBrk===0; o.san_brk=await brkShow('san',4); o.tian_brk=await brkShow('tian',4); o.none_brk0=await brkShow('none',0);
  o.brkD=[LG36.brkD(4,{lg:'none'}),LG36.brkD(4,{lg:'shuang'}),LG36.brkD(0,{lg:'none'}),LG36.brkD(6,{lg:'lei'})].map(x=>+x.toFixed(3));
  UI.card=_card; G.realm=3; G.stage=0; G.exp=0;
  // ---- A3.4 逆脉洗根 1000 次（固定种子，可复现）分布 vs LINGGEN 权重 ----
  let sd=20261023; const rng=()=>{sd|=0; sd=sd+0x6D2B79F5|0; let t=Math.imul(sd^sd>>>15,1|sd); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296;};
  const W=LINGGEN.reduce((a,l)=>a+l.w,0); const cnt={}; G.lg36.pur=37;
  for(let k=0;k<1000;k++){const id=LG36.nimaiApply(G,rng); cnt[id]=(cnt[id]||0)+1;}
  o.A34_dev_pp=+Math.max(...LINGGEN.map(l=>Math.abs((cnt[l.id]||0)/1000-l.w/W)*100)).toFixed(2); o.A34_cnt=cnt; o.nimaiPurKeep=G.lg36.pur===37;
  const c2={}; for(let k=0;k<1000;k++){const id=LG36.roll(); c2[id]=(c2[id]||0)+1;} o.mathRandom_dev_pp=+Math.max(...LINGGEN.map(l=>Math.abs((c2[l.id]||0)/1000-l.w/W)*100)).toFixed(2);
  // ---- 逆脉洗根扣费（确认卡点第一项）----
  G.lg='san'; G.stone=6000; G.age=20; const lb0=G.lifeBonus||0; const lm0=Game.lifeMax(); UI.card=()=>Promise.resolve(0); UI.toast=(()=>{const t=UI.toast; return function(){return t.apply(this,arguments);};})();
  const r=await LG36.nimai(); o.nimaiPaid=!!r&&G.stone===1000&&(G.lifeBonus||0)===lb0-Math.round(lm0*0.1);
  G.stone=100; o.nimaiNoMoney=(await LG36.nimai())===false&&G.stone===100;
  // ---- 定向淬根 ----
  G.lg='tian'; LG36.setLg(G,'tian',null); G.inv.tcdb=3; G.stone=8000;
  o.cuiAdd=LG36.cuiApply(G,'add','木'); o.cuiEl=Game.linggen().el.join(''); o.cuiAff=+LG36.aff('金').toFixed(3); o.cuiMult=Game.linggen().mult; o.extra=G.lg36.extraEl.join('');
  o.cuiRm=LG36.cuiApply(G,'rm','金'); o.cuiEl2=Game.linggen().el.join(''); o.cuiN=Game.linggen().n;
  o.cuiBadRm=LG36.cuiApply(G,'rm','木')===null;
  G.lg='lei'; o.cuiLei=LG36.cuiCheck(G)!=='';
  G.lg='wu'; o.cuiWuRm=LG36.cuiApply(G,'rm','土'); o.cuiWuEl=Game.linggen().el.join('');   // 金木水火 → 四灵根（与 LINGGEN.si 元素不同 → 存覆盖）
  G.lg='tian'; LG36.setLg(G,'tian',null); G.inv.tcdb=3; G.stone=9000; let pickN=0; UI.card=(t,x,p,opts)=>Promise.resolve(pickN++===0?opts.indexOf('淬入 水'):0);
  o.cuiUI=await LG36.cui(); o.cuiPaid=G.stone===1000&&!(G.inv.tcdb)&&Game.linggen().el.join('')==='金水';
  // ---- 洗髓丹 −20 纯度、覆盖清除；灵根丹 +5 ----
  G.lg36.pur=50; G.inv.xsd=1; await UI.useItem('xsd'); o.xsd=[G.lg,G.lg36.pur,Game.linggen().el.join('')];
  G.lg36.pur=98; G.inv.lgd=2; await UI.useItem('lgd'); o.lgd1=G.lg36.pur; await UI.useItem('lgd'); o.lgd2=[G.lg36.pur,G.inv.lgd||0];
  // ---- 打坐 +1（每月一次，上限 70）----
  UI.card=_card; o.shop=SHOPS.yaopu.items.includes('lgd')&&SHOPS.sumei.items.includes('tcdb')&&ITEMS.lgd.p>0&&ITEMS.tcdb.p>0;
  o.dev=(window.DevTabs||[]).some(t=>t.key==='lg36');
  o.saveRound=(()=>{const j=JSON.parse(JSON.stringify(G)); return j.lg36&&j.lg36.pur===G.lg36.pur&&j.v===2;})();
  return o;}"""
EXP = {'A31_ratio': 1.0, 'A31_pur': 50, 'pur0': 0.9, 'pur100': 1.1,
       'A32_tian_metal': 1.24, 'A32_tian_fire': 1.0, 'A32_tian_atk': 1.0, 'A32_lei_thunder': 1.3, 'wu_metal': 1.048, 'shuang_fire': 1.12, 'none_metal': 1.0, 'bing_ice': 1.3, 'petNoAff': True,
       'A33_lei': 37, 'tmpRestored': True, 'san_brk': 42, 'tian_brk': 38, 'none_brk0': 95, 'brkD': [0.05, -0.02, 0.05, 0],
       'nimaiPurKeep': True, 'nimaiPaid': True, 'nimaiNoMoney': True,
       'cuiAdd': 'shuang', 'cuiEl': '金木', 'cuiAff': 0.12, 'cuiMult': 1.3, 'extra': '金', 'cuiRm': 'tian', 'cuiEl2': '木', 'cuiN': '天灵根', 'cuiBadRm': True, 'cuiLei': True,
       'cuiWuRm': 'si', 'cuiWuEl': '金木水火', 'cuiUI': 'shuang', 'cuiPaid': True,
       'lgd1': 100, 'lgd2': [100, 0], 'shop': True, 'dev': True, 'saveRound': True}
async def main():
    errs = []; fails = []; cheats = []; out = {}
    def ok(k, cond, info=None):
        out[k] = {'ok': bool(cond), 'info': info}; print(k, 'PASS' if cond else 'FAIL', json.dumps(info, ensure_ascii=False)[:400], flush=True)
        if not cond: fails.append(k)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME', '/opt/google/chrome/chrome'), args=['--allow-file-access-from-files'])
        # ---------- 1 单测 ----------
        pg = await b.new_page(viewport={'width': VW, 'height': VH}); pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        res = await pg.evaluate(UNIT)
        bad = [k for k, v in EXP.items() if res.get(k) != v]
        ok('1_unit', not bad, {'bad': {k: [res.get(k), EXP[k]] for k in bad}})
        ok('A3.4_montecarlo', res['A34_dev_pp'] < 2, {'max_dev_pp': res['A34_dev_pp'], 'cnt': res['A34_cnt'], 'Math.random_run_pp': res['mathRandom_dev_pp']})
        ok('xsd', res['xsd'][0] != 'san' and res['xsd'][1] == 30, res['xsd'])
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
        # 2 老档：开一局 → 去掉 lg36 写回存档（模拟 3.5 旧档）→ 刷新 → 点「继续人生」
        await pg.goto(URL + '#dev'); await pg.wait_for_timeout(1500)
        await pg.tap('text=开始新人生'); await pg.wait_for_timeout(400); await pg.tap('#nx'); await pg.wait_for_timeout(200)
        for k in range(3): await pg.locator('.talb').nth(k).tap()
        for k in range(3): await pg.tap('#nx'); await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(2500); await settle()
        await pg.evaluate("()=>{window.__g=JSON.stringify(Game.G)}"); snap = await pg.evaluate("()=>window.__g")
        await pg.reload(); await pg.wait_for_timeout(2000)
        # 造旧档：刷新后（标题页、还没读档）把存档改成不含 lg36 的 san 档（只写存档文件，不调 Game.*）
        await pg.evaluate("(j)=>{const s=JSON.parse(j);delete s.lg36;s.lg='san';s.flags.awakened=1;if(!Array.isArray(s.mingge))s.mingge=['caimi'];localStorage.setItem('wbx2_save',JSON.stringify(s));}", snap)
        await pg.reload(); await pg.wait_for_timeout(2000)
        await tap_sel('.tbtns [data-k="cont"]', 2500, False); await settle()
        old = await G("({lg:G.lg,pur:LG36.pur(),hasLg36:!!G.lg36,v:G.v,mulRatio:(()=>{const m1=Game.cultMult();LG36.off=true;const m0=Game.cultMult();LG36.off=false;return +(m1/m0).toFixed(4)})()})")
        ok('2_oldsave', old['lg'] == 'san' and old['pur'] == 50 and old['v'] == 2 and old['mulRatio'] == 1.0, old)
        # 3 开发者面板「灵根36」→ 天灵根 + 灵石 + 天材地宝
        for k in range(3):
            if await pg.evaluate("()=>!!document.querySelector('.devtabs')"): break
            await settle(); await tap_sel('#devbtn', 700, False)
        await tap_sel('.devtabs .dt[data-t="lg36"]', 500)
        await tap_sel('#modals .pb button[data-l="tian"]', 400); cheats.append('lg36:灵根=天灵根')
        await tap_sel('#modals .pb button[data-s="1"]', 400); cheats.append('lg36:灵石+20000')
        await tap_sel('#modals .pb button[data-i="tcdb"]', 400); cheats.append('lg36:天材地宝×3')
        st = await G("({lg:G.lg,st:G.stone,tc:G.inv.tcdb||0,tabs:[...document.querySelectorAll('.devtabs .dt')].map(e=>e.dataset.t).join(','),dev:localStorage.getItem('wbx2_dev'),devbtn:!!document.querySelector('#devbtn')})")
        ok('3_dev', st['lg'] == 'tian' and st['st'] >= 20000 and st['tc'] >= 3, st)
        for k in range(4):
            if not await pg.evaluate("()=>!!document.querySelector('#modals .mwrap:last-child .ph .x')"): break
            await tap_sel('#modals .mwrap:last-child .ph .x', 500, False)
        await settle()
        await tap_sel('#menu .mb[data-p="char"]', 800, False)
        lay = await pg.evaluate("""()=>{const row=document.querySelector('.lg36row'); if(!row) return null; row.scrollIntoView({block:'center'});
          const bs=[...row.querySelectorAll('.lg36btns button')]; const rr=row.getBoundingClientRect();
          const hit=e=>{const r=e.getBoundingClientRect();const t=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!t&&(t===e||e.contains(t));};
          return {row:[rr.x,rr.right], text:row.innerText.slice(0,160), btns:bs.map(e=>{const r=e.getBoundingClientRect();return {t:e.innerText.replace(/\\n/g,' '),x:r.x,r:r.right,h:r.height,sw:e.scrollWidth,cw:e.clientWidth,sh:e.scrollHeight,ch:e.clientHeight,hit:hit(e)}}), rowOverflow:row.scrollWidth>row.clientWidth+1};}""")
        await pg.screenshot(path=f'{SHOTS}/lg36_char.png')
        good = bool(lay) and len(lay['btns']) == 2 and not lay['rowOverflow'] and lay['row'][0] >= 0 and lay['row'][1] <= VW and all(x['x'] >= 0 and x['r'] <= VW and x['sw'] <= x['cw'] + 1 and x['sh'] <= x['ch'] + 1 and x['h'] >= 40 and x['hit'] for x in (lay['btns'] if lay else []))
        ok('3_layout', good, lay)
        s0 = await G("[G.stone,G.lg,G.lifeBonus,G.inv.tcdb||0]")
        await tap_sel('.lg36row .lg36nm', 700)
        c1 = await pg.evaluate("()=>{const m=[...document.querySelectorAll('#modals .mwrap')].pop();return m?m.innerText.slice(0,120):''}")
        await pg.screenshot(path=f'{SHOTS}/lg36_nimai_confirm.png')
        await tap_sel('#modals .mwrap:last-child .opt', 600, True, '算了')
        await tap_sel('.lg36row .lg36cu', 700)
        c2 = await pg.evaluate("()=>{const m=[...document.querySelectorAll('#modals .mwrap')].pop();return m?m.innerText.slice(0,160):''}")
        await pg.screenshot(path=f'{SHOTS}/lg36_cui_confirm.png')
        await tap_sel('#modals .mwrap:last-child .opt', 600, True, '算了')
        s1 = await G("[G.stone,G.lg,G.lifeBonus,G.inv.tcdb||0]")
        ok('3_confirm', '逆脉洗根' in c1 and '定向淬根' in c2 and '淬入' in c2 and s0 == s1, {'nimai': c1, 'cui': c2, 's0': s0, 's1': s1})
        # 真点「淬入 水」→ 二次确认「淬！」→ 双灵根 金水
        await tap_sel('.lg36row .lg36cu', 700); await tap_sel('#modals .mwrap:last-child .opt', 700, True, '淬入 水'); await tap_sel('#modals .mwrap:last-child .opt', 900, True, '淬！')
        s2 = await G("({lg:G.lg,el:Game.linggen().el.join(''),st:G.stone,tc:G.inv.tcdb||0,row:(document.querySelector('.lg36row')||{}).innerText||''})")
        ok('3_cui_tap', s2['lg'] == 'shuang' and s2['el'] == '金水' and s2['st'] == s1[0] - 8000 and s2['tc'] == s1[3] - 3, s2)
        await b.close()
    ok('no_pageerror', not errs, errs[:5])
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'results'), exist_ok=True)
    json.dump({'res': out, 'cheats': cheats, 'fails': fails}, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'results', 'lg36_unit.json'), 'w'), ensure_ascii=False, indent=1)
    print('cheats', cheats); print('FAILS', fails)
    if fails: sys.exit(1)
    print('lg36_unit ALL PASS')
asyncio.run(main())

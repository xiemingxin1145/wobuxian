# 3.3 第十七章～终章（下）接入检查（诊断：直接设章节，核对 NPC/★对话/追踪/旧档迁移；不是点按门禁）
import asyncio, os, sys, json
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www', 'index.html'))
async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': 412, 'height': 915}); pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto(URL); await pg.wait_for_timeout(3000)
        r = await pg.evaluate("""async()=>{const o={};Game.newLife({name:'测',sex:'m',lg:LINGGEN[1].id,talents:[],st:{str:5,con:5,int:5,luck:5,wealth:5,charm:5}});const G=Game.G;G.mingge=[];G.flags.mg33_done=1;G.flags.awakened=1;
          o.order=MAIN.map(m=>m.id).slice(MAIN.findIndex(m=>m.id==='tiandao'));
          G.realm=6; G.main=MI('dianfei'); G.map='cuizhai'; await Game.enterMap('cuizhai'); await new Promise(r=>setTimeout(r,800));
          o.dianmu=!!R.ents.find(e=>e.id==='dianmu'); const t=Talk.mainTalk('leigong'); o.leigongStar=!!(t&&/★/.test(t[0]));
          o.track=(Track.target('main')||{}).txt;
          G.main=MI('hetong'); const t2=Talk.mainTalk('mentor'); o.mentorStar=!!(t2&&/★/.test(t2[0]));
          G.main=MI('zhenshen'); Game.save(); const s=JSON.parse(localStorage.getItem('wbx2_save')); o.savedId=s.mainId; s.mainId='done'; s.main=17; localStorage.setItem('wbx2_save',JSON.stringify(s)); const h=Game.hasSave(); o.migrated=MAIN[h.main].id;
          return o;}""")
        await b.close()
    ok = r['dianmu'] and r['leigongStar'] and r['mentorStar'] and r['savedId'] == 'zhenshen' and r['migrated'] == 'done' and r['order'][:5] == ['tiandao', 'dianfei', 'hetong', 'zhenshen', 'yanshou']
    print(json.dumps({'ok': ok, 'r': r, 'errors': errs}, ensure_ascii=False, indent=1)); sys.exit(0 if ok and not errs else 1)
asyncio.run(main())

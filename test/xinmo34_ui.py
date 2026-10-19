# 3.4 心魔幻境真实点按流程：金丹圆满→点突破→入幻境→贪/嗔(实战自动)/痴→评级→「冲击瓶颈」显示 基础+心魔=最终；截图到 test/xinmo34/
import asyncio, os, json
from playwright.async_api import async_playwright
ROOT=os.path.dirname(os.path.abspath(__file__)); URL='file://'+os.path.abspath(os.path.join(ROOT,'..','www','index.html')); OUT=os.path.join(ROOT,'xinmo34')+'/'; os.makedirs(OUT,exist_ok=True)
async def main():
    errs=[]; steps=[]
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/google/chrome/chrome',args=['--allow-file-access-from-files'])
        pg=await b.new_page(viewport={'width':412,'height':915},device_scale_factor=2)
        pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
        await pg.goto(URL); await pg.wait_for_timeout(3000)
        await pg.evaluate("""async()=>{Game.newLife({name:'测试',sex:'m',lg:LINGGEN[1].id,talents:[],st:{str:5,con:5,int:5,luck:5,wealth:5,charm:5}});const G=Game.G;G.flags.awakened=1;G.mingge=['nitian'];G.flags.mg33_done=1;G.realm=3;G.stage=3;G.exp=Game.need();G.flags.chShown=99;document.body.classList.add('ingame');const t=document.getElementById('title');if(t)t.style.display='none';await Game.enterMap('village');}""")
        await pg.wait_for_timeout(2500)
        # 清空进图弹窗
        for _ in range(8):
            o=pg.locator('#modals .opt')
            if await o.count()==0: break
            await o.first.click(); await pg.wait_for_timeout(500)
        await pg.evaluate("()=>{Game._busy=false;Game.tryBreak()}")
        n=0
        for _ in range(80):
            await pg.wait_for_timeout(700)
            ttl=await pg.evaluate("()=>{const c=[...document.querySelectorAll('#modals .ct')].pop();return c?c.textContent:''}")
            on=await pg.evaluate("()=>(typeof B!=='undefined'&&!!B.on)")
            if on:
                ab=pg.locator('#battlebar button[data-a=auto]')
                if n<20: await pg.screenshot(path=OUT+f'{n:02d}_battle.png'); n+=1
                await pg.evaluate("()=>{const a=document.querySelector('#battlebar button[data-a=auto]');if(a&&!a.classList.contains('on'))a.click()}")
                continue
            if not ttl: continue
            opts=await pg.locator('#modals .opt').all_text_contents()
            steps.append([ttl,opts]); await pg.screenshot(path=OUT+f'{n:02d}.png'); n+=1
            if ttl=='冲击瓶颈':
                steps.append(['text',await pg.evaluate("()=>[...document.querySelectorAll('#modals .card')].pop().innerText")]); break
            pick=0
            if ttl.startswith('心魔幻境 · '):
                good=['不是自己挣的钱，不要','拔剑，与它一战','“等我回来。”然后转身']
                pick=next((k for k,s in enumerate(opts) if s in good),0)
            await pg.evaluate('k=>[...[...document.querySelectorAll("#modals .mwrap, #modals > *")].pop().querySelectorAll(".opt")][k].click()',pick)
        await b.close()
    import re, sys
    txt=next((x[1] for x in steps if x[0]=='text'),'')
    ok=bool(re.search(r'基础 -?\d+% [+−] 心魔「.+?」\d+% = 最终 \d+%',txt)) and [x[0] for x in steps][:4]==['心魔幻境','心魔幻境 · 一关·贪','心魔幻境 · 二关·嗔','心魔幻境 · 三关·痴']
    print(json.dumps(dict(ok=ok,steps=steps,errs=errs),ensure_ascii=False,indent=1))
    sys.exit(0 if ok and not errs else 1)
asyncio.run(main())

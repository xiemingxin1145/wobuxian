# 回归：Game.G 为 null 时 Game.canEnter / Seam34.draw 不得抛 TypeError（multilife 曾 4x 读 flags）
# 真实触摸不需要；evaluate 造 G=null 后调 canEnter 并触发一帧地面绘制。
import asyncio, os, sys, json
from playwright.async_api import async_playwright
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www')
URL = 'file://' + os.path.abspath(ROOT) + '/index.html#dev'
async def main():
    fails, log, errs = [], [], []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME', '/opt/google/chrome/chrome'),
                                    args=['--allow-file-access-from-files'])
        ctx = await b.new_context(viewport={'width': 412, 'height': 915}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1200)
        await pg.tap('text=开始新人生'); await pg.wait_for_timeout(400)
        await pg.tap('#nx'); await pg.wait_for_timeout(200)
        for k in range(3): await pg.locator('.talb').nth(k).tap()
        for k in range(3): await pg.tap('#nx'); await pg.wait_for_timeout(200)
        await pg.wait_for_timeout(2000)
        for _ in range(10):
            if await pg.evaluate('()=>!!(Game && Game.G && R && R.mode==="map")'): break
            await pg.wait_for_timeout(400)
        # 正常态
        r0 = await pg.evaluate("""()=>{
          try { return {ok:true, v:Game.canEnter('village'), m:Game.canEnter('market'), g:!!Game.G}; }
          catch(e){ return {ok:false, err:String(e)} }
        }""")
        log.append({'normal': r0}); 
        if not r0.get('ok') or r0.get('v') is not True: fails.append('normal_village')
        # G=null：模拟轮回间隙 / 标题页残留地图
        r1 = await pg.evaluate("""()=>{
          const bak = Game.G; Game.G = null;
          const out = {throws:[], vals:{}};
          for (const id of ['village','market','sect','graveyard']) {
            try { out.vals[id] = Game.canEnter(id); }
            catch(e){ out.throws.push(id+':'+e.message); }
          }
          // 触发 seam34 地面绘制路径（与 multilife 栈一致）
          try {
            if (typeof Seam34 !== 'undefined' && Seam34.draw) {
              const c = document.createElement('canvas').getContext('2d');
              Seam34.setup && Seam34.setup();
              Seam34.draw(c);
            }
            out.drawOk = true;
          } catch(e){ out.drawOk = false; out.drawErr = String(e); }
          Game.G = bak;
          return out;
        }""")
        log.append({'nullG': r1})
        if r1.get('throws'): fails.append('canEnter_threw:' + ','.join(r1['throws']))
        if r1.get('vals', {}).get('village') is not True: fails.append('null_village_not_true')
        if any(r1.get('vals', {}).get(x) for x in ('market', 'sect', 'graveyard')): fails.append('null_other_should_be_false')
        if not r1.get('drawOk'): fails.append('seam_draw:' + str(r1.get('drawErr')))
        await pg.wait_for_timeout(300)
        # 页面错误（绘制循环也可能异步抛）
        bad = [e for e in errs if 'flags' in e or 'canEnter' in e or 'TypeError' in e]
        log.append({'errs': errs[:8], 'flags_errs': bad})
        if bad: fails.append('pageerror_flags')
        await b.close()
    print(json.dumps({'log': log, 'fails': fails}, ensure_ascii=False, indent=1))
    print('PASS' if not fails else 'FAIL ' + str(fails))
    sys.exit(len(fails))
asyncio.run(main())

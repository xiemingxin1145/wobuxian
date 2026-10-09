import asyncio, json, sys
from playwright.async_api import async_playwright
BOT = r"""
async (lives) => {
  const out = [];
  const W = ms => new Promise(r => setTimeout(r, ms));
  for (let L = 0; L < lives; L++) {
    document.getElementById('bNew') && document.getElementById('title').classList.contains('on') ? document.getElementById('bNew').click() : document.getElementById('dAgain').click();
    await W(200);
    const cards = () => document.querySelectorAll('#talentList .card');
    for (let k = 0; k < 3; k++) { cards()[k].click(); await W(30); }
    document.getElementById('bTalentOk').click(); await W(100);
    document.getElementById('bBorn').click(); await W(800);
    let guard = 0;
    while (__wbx.S && __wbx.S.alive && guard++ < 600) {
      const m = document.getElementById('modal');
      if (!m.classList.contains('hidden')) { const b = document.querySelector('#evCh .btn, #evOk, #bkGo, #shX, #bagX'); if (b) b.click(); await W(120); continue; }
      const S = __wbx.S;
      if (!document.getElementById('bBreak').disabled) { document.getElementById('bBreak').click(); await W(200); continue; }
      if (S.realm >= 1 && S.unlocked.sect && S.loc !== 'sect') { S.loc = 'sect'; __wbx.R.setMap('sect'); }
      const acts = document.querySelectorAll('#actions .btn');
      const i = (S.stones < 100 && S.realm >= 1 && Math.random() < 0.25) ? 1 : 0;
      if (acts[i]) acts[i].click();
      await W(250);
      while (!document.getElementById('battleTag').classList.contains('hidden')) await W(100);
    }
    await W(1500);
    const M = __wbx.META(); out.push(M.lives[0]);
  }
  return out;
}
"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome')
        pg = await b.new_page(viewport={'width': 412, 'height': 892})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///workspace/game/www/index.html'); await pg.wait_for_timeout(800)
        # speed up timers 
        await pg.evaluate("""()=>{const st=window.setTimeout; window.setTimeout=(f,ms,...a)=>st(f,(ms||0)/6,...a);}""")
        res = await pg.evaluate(BOT, int(sys.argv[1]) if len(sys.argv)>1 else 3)
        for r in res: print(json.dumps(r, ensure_ascii=False))
        print('meta', json.dumps(await pg.evaluate("__wbx.META()"), ensure_ascii=False)[:300])
        print('ERRS', errs)
        await b.close()
asyncio.run(main())

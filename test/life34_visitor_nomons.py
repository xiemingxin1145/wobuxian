# 3.4 life34：无怪的问道崖不刷找上门来客；万一已在无怪图上应战也不抛错。python3 test/life34_visitor_nomons.py
import asyncio, json, sys, os
from playwright.async_api import async_playwright
JS = r"""async () => {
  const G = Game.G, L = Life34.st(), out = {}, fails = []; const ok = (k, c, v) => { out[k] = v; if (!c) fails.push(k); };
  G.realm = 6; G.age = Math.max(G.age, 30);
  await Game.enterMap('wendao'); await new Promise(r => setTimeout(r, 800));
  ok('on_wendao', R.mapId === 'wendao' && R.mode === 'map', [R.mapId, R.mode]);
  L.rel = { farmer: -50 }; L.pending = { type: 'foe', npc: 'farmer' }; R.ents = R.ents.filter(e => e.id !== 'l34_visitor');
  Life34.spawnVisitor(); ok('no_spawn_on_wendao', !R.ents.some(e => e.id === 'l34_visitor'), R.ents.filter(e => e.id === 'l34_visitor').length);
  ok('pending_kept', L.pending && L.pending.type === 'foe', L.pending);
  // 旧版本已刷在无怪图上的来客：应战走回落怪表，不抛错
  const say0 = UI.say, f0 = Game.fight; let mon = null; UI.say = async () => 0; Game.fight = async m => { mon = m; return { res: 'win' }; };
  let err = null; try { await Life34.visit({ id: 'l34_visitor', label: '王大爷' }); } catch (x) { err = String(x); }
  UI.say = say0; Game.fight = f0;
  ok('fight_no_throw', !err && !!MONS[mon], { err, mon }); ok('rel_after_win', L.rel.farmer === -60, L.rel.farmer);
  return { out, fails }; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': 412, 'height': 915}, device_scale_factor=2)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///' + os.path.abspath('www/index.html')); await pg.wait_for_timeout(1500)
        await pg.click('text=开始新人生'); await pg.wait_for_timeout(400); await pg.click('#nx')
        for k in range(3): await pg.locator('.talb').nth(k).click()
        for k in range(3): await pg.click('#nx'); await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(2500)
        r = await pg.evaluate(JS); r['js_errors'] = errs
        print(json.dumps(r, ensure_ascii=False, indent=1)); await b.close()
        sys.exit(1 if r['fails'] or errs else 0)
asyncio.run(main())

# 3.5 灵宠派遣：python3 test/pet35_unit.py（无头；逻辑 + 真实点开灵兽面板选差事 + 过年结算 + 存读档）
import asyncio, json, sys, os
from playwright.async_api import async_playwright
JS = r"""async () => {
  const out = {}, fails = []; const ok = (k, c, v) => { out[k] = v === undefined ? c : v; if (!c) fails.push(k); };
  const G = Game.G; G.pets = []; G.petA = -1; G.realm = 0;
  Game.addPet('slime', 1); Game.addPet('treant', 1); Game.addPet('rock', 1); Game.addPet('crab', 1);
  ok('max_lianqi', PD35.max() === 1); G.realm = 4; ok('max_yuanying', PD35.max() === 3); G.realm = 7; ok('max_cap4', PD35.max() === 4); G.realm = 2;
  ok('active_blocked', PD35.send(0, 'herb') === false && !G.pets[0].pd35);
  ok('send1', PD35.send(1, 'herb') && PD35.send(2, 'ore'));
  ok('quota', PD35.send(3, 'explore') === false && PD35.away().length === 2, PD35.away().length);
  ok('match', PD35.match(G.pets[1], 'herb') && PD35.match(G.pets[2], 'ore') && !PD35.match(G.pets[1], 'ore'));
  const inv0 = Object.assign({}, G.inv); const lv0 = G.pets[1].lv, ex0 = G.pets[1].exp;
  const lines = PD35.settle(() => 0.9);
  ok('settle_lines', lines.length === 2, lines);
  ok('herb_gain', (G.inv.herb || 0) - (inv0.herb || 0) === 3, (G.inv.herb || 0) - (inv0.herb || 0));
  ok('ore_gain', (G.inv.ore || 0) - (inv0.ore || 0) === 1, (G.inv.ore || 0) - (inv0.ore || 0));
  ok('pet_exp', G.pets[1].lv > lv0 || G.pets[1].exp > ex0);
  ok('active_unchanged', G.petA === 0);
  ok('years', G.pets[1].pd35.y === 1);
  // 探秘境负伤
  PD35.recall(2); PD35.send(3, 'explore'); G.pets[3].pd35.job = 'explore'; const k0 = G.inv.key || 0;
  PD35.settleOne(G.pets[3], () => 0.05); ok('explore_hurt', G.pets[3].hp === 1 && (G.inv.key || 0) === k0);
  PD35.settleOne(G.pets[3], () => 0.5); ok('explore_key_match', (G.inv.key || 0) === k0 + 2, (G.inv.key || 0) - k0);
  // 改出战的灵兽：结算时自动召回
  G.petA = 3; PD35.settle(() => 0.9); ok('active_recalled', !G.pets[3].pd35);
  ok('log', Array.isArray(G.pd35log) && G.pd35log.length >= 1);
  // 老档：无字段
  const p = { mon: 'fox', name: '旧狐', lv: 3, exp: 0, tier: 1 }; G.pets.push(p); ok('old_idle', PD35.away().indexOf(p) < 0);
  G.pets.pop(); G.petA = 0; Game.save();
  return { out, fails };
}"""
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
        r = await pg.evaluate(JS); fails = r['fails']
        # UI：点开灵兽面板，给第 2 只选“寻矿”
        await pg.evaluate("(UI.panel('pets'), 0)"); await pg.wait_for_timeout(600)
        vis = await pg.locator('.pd35').is_visible(); r['out']['ui_visible'] = vis
        if not vis: fails.append('ui_visible')
        sel = pg.locator('.pd35 select').first
        await sel.select_option('ore'); await pg.wait_for_timeout(300)
        txt = await pg.locator('.pd35').inner_text(); r['out']['ui_text'] = txt[:160]
        if '寻矿中' not in txt: fails.append('ui_select')
        await pg.screenshot(path='test/results/pet35_panel.png')
        # 存读档后仍在
        await pg.reload(); await pg.wait_for_timeout(1500)
        saved = await pg.evaluate("(()=>{const s=JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>localStorage.getItem(k).includes('pd35'))||'null')||'null');return !!s})()")
        r['out']['persist'] = saved
        if not saved: fails.append('persist')
        r['js_errors'] = errs
        print(json.dumps(r, ensure_ascii=False, indent=1)); await b.close()
        sys.exit(1 if fails or errs else 0)
asyncio.run(main())

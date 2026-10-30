# 3.7.2 多徒弟 + 家族子嗣：python3 test/fam37_unit.py（无头；逻辑验收 A4.1/A4.2/A4.3/A4.4/A4.5/A4.6 + 家族 + 效果字段 + 面板 + 存档）
import asyncio, json, sys, os
from playwright.async_api import async_playwright
JS = r"""async () => {
  const out = {}, fails = []; const ok = (k, c, v) => { out[k] = v === undefined ? c : v; if (!c) fails.push(k); };
  const G = Game.G; UI.card = async () => 0; // 事件卡片自动选第 1 项
  // A4.4 老档：有衣钵弟子，无 dis36/fam37
  G.apprentice = 'cuihua'; G.apprenticeLvl = 3; delete G.dis36; delete G.fam37; FAM37.ensure(G);
  ok('A4.4_old_save', G.apprentice === 'cuihua' && G.apprenticeLvl === 3 && Array.isArray(G.dis36) && G.dis36.length === 0 && G.fam37.kids.length === 0);
  const heir0 = JSON.stringify(G.heir);
  // 兼容：旧档/talk.js 已结侣（只有 G.partner）→ fam37.sp 由 G.partner 推导，不能再另娶
  { const p0 = G.partner, f0 = G.follower, aff0 = G.aff.ruyan; G.partner = 'sumei'; delete G.fam37; FAM37.ensure(G); G.aff.ruyan = 150;
    ok('compat_partner_sp', G.fam37.sp === 'sumei' && FAM37.canMarry(G, 'ruyan') === false, [G.fam37.sp, FAM37.canMarry(G, 'ruyan')]);
    G.partner = p0; G.follower = f0; G.aff.ruyan = aff0; delete G.fam37; FAM37.ensure(G); }
  // A4.1 金丹（realm 3）最多 2 名记名
  G.realm = 3; G.stone = 1e6; const a = FAM37.recruit(), b = FAM37.recruit(), c = FAM37.recruit();
  ok('A4.1_cap', !!a && !!b && c === null && FAM37.cap(G) === 2 && G.apprentice === 'cuihua');
  UI.panel('fam37'); await new Promise(r => setTimeout(r, 300)); const btn = document.querySelector('.fam37 [data-f="recruit"]'); ok('A4.1_button_disabled', !!btn && btn.disabled); { const x = [...document.querySelectorAll('.panel .x')].pop(); if (x) x.click(); }
  // A4.2 三灵根 apt1.0 无教学 1 年 xp=20；教 6 次 → 20×1.6+180=212
  const d = { n: 't', lg: 'san', apt: 1, lvl: 1, xp: 0, tag: 'hanhou', teach: 0 };
  ok('A4.2_noteach', Math.abs(FAM37.yearXp(d) - 20) < 1e-9, FAM37.yearXp(d));
  G.ap = 10; G.dis36[0].lg = 'san'; G.dis36[0].apt = 1; G.dis36[0].tag = 'hanhou'; G.dis36[0].xp = 0; G.dis36[0].lvl = 1; G.dis36[0].ty = G.year;
  let tot = 0; for (let k = 0; k < 7; k++) if (FAM37.teach(0)) tot += 30;
  ok('A4.2_teach_cap6', G.dis36[0].teach === 6 && tot === 180);
  ok('A4.2_teach6', Math.round(FAM37.yearXp(G.dis36[0]) + tot) === 212, FAM37.yearXp(G.dis36[0]) + tot);
  // A4.3 / A4.6 收益
  const e = { lvl: 3, tag: 'hanhou' };
  ok('A4.3_island_360', FAM37.yieldOf(e, 'island') === 360, FAM37.yieldOf(e, 'island'));
  const t2 = Object.keys(MAPINFO).find(m => Math.floor(MAPINFO[m].tier) === 2);
  ok('A4.6_tier2_240', FAM37.yieldOf(e, t2) === 240, [t2, FAM37.yieldOf(e, t2)]);
  ok('lv5_x1.5', FAM37.yieldOf({ lvl: 5, tag: 'hanhou' }, 'market') === 300 && FAM37.yieldOf({ lvl: 1, tag: 'hanhou' }, 'village') === 20);
  // A4.6 实际年度结算：3 级弟子派往档位2 → +240（rnd 0.5 不失败不受伤）
  Object.assign(G.dis36[1], { lvl: 3, tag: 'hanhou', state: 'idle', hurt: 0 }); G.pets = []; G.petA = -1;
  ok('send_t2', FAM37.send(1, t2)); const s0 = G.stone; const fee = 300 * G.dis36.length;
  const res = FAM37.disYear(G, () => 0.5); ok('A4.6_settle', res.length === 1 && res[0].s === 240 && G.stone - s0 === 240 - fee, [res.map(x => x.s), G.stone - s0]);
  // A4.5 大境界4：灵宠+弟子共享 3 槽，第 4 个被拒
  G.realm = 4; FAM37.recruit(); ok('slots3', FAM37.slots(G) === 3);
  Game.addPet('slime', 1); Game.addPet('treant', 1); Game.addPet('rock', 1); G.petA = 0;
  ok('A4.5_pet1', PD35.send(1, 'herb')); ok('A4.5_dis2', FAM37.send(0, 'market') && FAM37.used(G) === 3, FAM37.used(G));
  ok('A4.5_4th_dis_blocked', FAM37.send(2, 'market') === false);
  ok('A4.5_4th_pet_blocked', PD35.send(2, 'ore') === false && !G.pets[2].pd35 && FAM37.used(G) === 3);
  FAM37.recall(0); ok('after_recall_pet_ok', PD35.send(2, 'ore'));
  PD35.recall(1); PD35.recall(2); FAM37.recall(1);
  // 失败：loy-10
  const f = G.dis36[0]; f.state = 'out'; f.map = 'market'; f.loy = 60; const r1 = FAM37.settleOne(G, f, () => 0.01); ok('fail_loy', r1.ok === 0 && f.loy === 50);
  // 束修欠缴 loy-15
  G.stone = 0; const l0 = G.dis36.map(x => x.loy); G.dis36.forEach(x => { x.state = 'idle'; }); FAM37.disYear(G, () => 0.5); ok('shuxiu_owe', G.dis36.every((x, k) => x.loy <= l0[k] - 12));
  // 立嗣：衣钵空缺 + lvl≥5 + 来自 NPC
  G.stone = 1e6; G.apprentice = null; G.realm = 5; G.aff.ruyan = 80; const nd = FAM37.recruit('ruyan'); nd.lvl = 5; const ix = G.dis36.indexOf(nd);
  ok('make_heir', FAM37.makeHeir(ix) && G.apprentice === 'ruyan' && !G.dis36.includes(nd));
  // 家族：结侣条件 aff≥100 且 rel≥60
  G.partner = null; G.fam37.sp = null; G.aff.sumei = 99; Life34.st().rel.sumei = 60; ok('marry_blocked', !FAM37.canMarry(G, 'sumei'));
  G.aff.sumei = 100; ok('marry', FAM37.marry('sumei') && G.partner === 'sumei' && G.fam37.sp === 'sumei');
  // 灵根继承：较高档−1，60/25/15
  ok('lg_same', FAM37.inheritLg('tian', 'wu', () => 0.1).lg === 'shuang');
  ok('lg_up', FAM37.inheritLg('tian', 'wu', () => 0.7).lg === 'tian');
  ok('lg_down', FAM37.inheritLg('tian', 'wu', () => 0.9).lg === 'san');
  ok('lg_floor', FAM37.inheritLg('none', 'none', () => 0.9).lg === 'none');
  for (let k = 0; k < 6; k++) FAM37.birth(); ok('kids_cap4', G.fam37.kids.length === 4 && JSON.stringify(G.heir) === heir0);
  G.fam37.kids[0].born = G.year - 31; const gl = FAM37.grow(G); ok('grow_nodes', gl.length === 6 && Object.keys(G.fam37.kids[0].nodes).length === 6, gl.length); ok('grow_once', FAM37.grow(G).length === 0);
  // 效果字段
  G.debt = 1000; G.karma = 0; G.sect = G.sect || Object.keys(SECTS)[0]; G.fb33 = G.fb33 || { id: 'fb_jian', tier: 1, spent: 0, aff: 0, wipe: 0 }; const a0 = G.aff.sumei, st0 = G.stone, rel0 = JSON.stringify(G.sectRel || {});
  G.inv.wine = 1;
  await FAM37.applyEff({ debt: -100, rate: 0.02, sectRel: 5, fb33: 7, karma: 3, aff: { '@sp': 10 }, stone: -10, item: { wine: -1 } });
  ok('eff_debt', G.debt === 900); ok('eff_rate', G.fam37.rate === 0.02); ok('eff_karma', G.karma === 3); ok('eff_sp_aff', G.aff.sumei === Math.min(150, a0 + 10));
  ok('eff_fb33', G.fb33.exp >= 7); ok('eff_sectRel', JSON.stringify(G.sectRel) !== rel0); ok('eff_stone_scaled', st0 - G.stone === 10 * (1 + G.realm), st0 - G.stone); ok('eff_item', !G.inv.wine);
  ok('locked_item', !FAM37.canEff(G, { item: { peach: -99 } }));
  const ev = await FAM37.famEvent('f37_gift'); ok('fam_event', ev && ev.id === 'f37_gift' && G.fam37.ev.f37_gift === 1, ev);
  ok('fill_lg', FAM37.fill('{k}是{lg}', FAM37.ctx(G)).indexOf('{') < 0);
  const nf = (G.jh34 && G.jh34.feed || []).filter(x => x.k === 'fam37').length; ok('news_jh34', nf > 0, nf);
  const deb = G.debt; ok('succeed_half', !!FAM37.succeed('die') && G.debt === Math.round(deb * 0.5));
  ok('devtab', (window.DevTabs || []).some(t => t.key === 'fam37'));
  UI.panel('fam37'); await new Promise(r => setTimeout(r, 300)); ok('panel', !!document.querySelector('.fam37'));
  Game.save();
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
        await pg.reload(); await pg.wait_for_timeout(1500)
        saved = await pg.evaluate("(()=>Object.keys(localStorage).some(k=>{const v=localStorage.getItem(k)||'';return v.includes('fam37')&&v.includes('dis36')}))()")
        r['out']['persist'] = saved
        if not saved: fails.append('persist')
        r['js_errors'] = errs
        print(json.dumps(r, ensure_ascii=False, indent=1)); await b.close()
        sys.exit(1 if fails or errs else 0)
asyncio.run(main())

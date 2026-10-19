# 3.4 life34 恩怨/来客单元测试：python3 test/life34_unit.py（无头，读写游戏内状态；UI.say/Game.fight 打桩）
import asyncio, json, sys
from playwright.async_api import async_playwright
JS = r"""async () => {
  const out = {}, fails = []; const ok = (k, c, v) => { out[k] = v === undefined ? c : v; if (!c) fails.push(k); };
  const G = Game.G; const L = Life34.st(); const realmIx = n => REALMS.findIndex(r => r.n === n);
  // 赔礼价
  const fee = n => { G.realm = realmIx(n); return Life34.fee(); };
  ok('fee', fee('练气') === 30 && fee('金丹') === 195 && fee('化神') === 1140, [fee('练气'), fee('金丹'), fee('化神')]);
  // 1) 恩怨 −50 → 一年内仇家上门；灵石不足选赔礼不开战，回到选择
  G.realm = realmIx('金丹'); L.rel = { farmer: -50 }; L.pending = null; G.age = Math.max(G.age, 10);
  Life34.simYear(); ok('foe_pending', L.pending && L.pending.type === 'foe' && L.pending.npc === 'farmer', L.pending);
  const say0 = UI.say, f0 = Game.fight; const picks = [1, 1, 0]; let asks = 0, fought = 0, toasts = []; const t0 = UI.toast;
  UI.say = async (p, n, txt, opts) => { asks++; out.foe_opts = opts; return picks.shift(); }; UI.toast = m => toasts.push(m);
  Game.fight = async () => { fought++; return { res: 'win' }; };
  G.stone = 0; const e = { id: 'l34_visitor', label: '王大爷' }; await Life34.visit(e);
  ok('poor_no_fight_first', asks === 3 && fought === 1 && toasts.filter(t => t.includes('灵石不足')).length === 2, { asks, fought, toasts });
  ok('foe_win_minus10', L.rel.farmer === -60, L.rel.farmer);
  L.pending = { type: 'foe', npc: 'farmer' }; G.stone = 500; picks.push(1); await Life34.visit(e);
  ok('apology', L.rel.farmer === -35 && G.stone === 305, [L.rel.farmer, G.stone]);
  // 2) 负面来源：打发走 −10；讨债司公示 −5（每年一次）；奇遇链超时 −20
  L.rel = { luren: 50 }; L.pending = { type: 'errand', npc: 'luren' }; picks.push(1); await Life34.visit(e); ok('dismiss', L.rel.luren === 40, L.rel.luren);
  // #17：只有年息 → 10 年无惩罚；新借款那年 −5 一次
  L.pending = { type: 'x' }; G.debt = 8888; L.lastDebt = undefined; Life34.simYear();
  for (let k = 0; k < 10; k++) { G.year = (G.year || 1) + 1; G.debt += Math.ceil(G.debt * 0.03); Life34.simYear(); }
  ok('interest_only_no_penalty', L.rel.luren === 40, L.rel.luren);
  G.year++; G.debt += Math.ceil(G.debt * 0.03); G.debt += 500; Life34.simYear(); ok('debt_post', L.rel.luren === 35, L.rel.luren);
  G.debt += 300; Life34.simYear(); ok('debt_once', L.rel.luren === 35, L.rel.luren);
  // 多年一次性过（闭关）只滚利息：不罚
  for (let k = 0; k < 5; k++) { G.year++; G.debt += Math.ceil(G.debt * 0.03); } Life34.simYear(); ok('multi_year_interest', L.rel.luren === 35, L.rel.luren);
  G.quests.qc34_v1 = { k0: {} }; L.qt = { qc34_v1: Life34.yr() - 3 }; Life34.simYear(); ok('chain_timeout', !G.quests.qc34_v1 && L.rel.b34_boatman === -20, L.rel.b34_boatman);
  // 3) 报恩：6 年不总是同一人、同一人 3 年冷却；金丹首访礼金 195–325
  L.rel = { farmer: 60, mom: 90, luren: 45, villager: 70 }; L.seen = {}; const who = [];
  let y = 100;
  for (let k = 0; k < 6; k++) { G.year = ++y; let n = 0; do { L.pending = null; Life34.simYear(); } while (!(L.pending && L.pending.type === 'friend') && ++n < 200); who.push(L.pending && L.pending.npc); }
  let cool = true; for (let a = 0; a < who.length; a++) for (let b = a + 1; b < Math.min(who.length, a + 3); b++) if (who[a] === who[b]) cool = false;
  ok('friends_vary', new Set(who).size > 1 && cool, who);
  G.realm = realmIx('金丹'); const gs = []; for (let k = 0; k < 60; k++) { L.seen.vfn_mom = 0; gs.push(Life34.gift('mom').stone); }
  ok('gift_jindan', Math.min(...gs) >= 195 && Math.max(...gs) <= 325, [Math.min(...gs), Math.max(...gs)]);
  L.seen.vfn_mom = 1; const g2 = Life34.gift('mom').stone; ok('gift_halved', g2 >= 97 && g2 <= 163, g2);
  // 好感节奏
  G.year = 500; L.rel = {};
  for (let k = 0; k < 5; k++) Life34.onChat('cuihua'); ok('chat5_eq6', L.rel.cuihua === 6, L.rel.cuihua);
  G.year = 501; L.rel = {}; for (let k = 0; k < 10; k++) Life34.onGift('cuihua', 'herb'); ok('gift_cap15', L.rel.cuihua === 15, L.rel.cuihua);
  // 通过真实 Talk.gift：送 6 次桃花酿给剑仙（最爱）；aff 同步部分 = Σtrunc(22×0.5)=11×n（封顶 150 后为 0），送礼部分 ≤15
  const card0 = UI.card; UI.card = async () => 0;
  G.year = 502; L.rel = {}; G.aff.mentor = 0; G.inv.wine = 6; const aff0 = G.aff.mentor; UI.say = async (p, n, t, o) => 0;
  for (let k = 0; k < 6; k++) await Talk.gift('mentor');
  const syncd = Math.trunc((G.aff.mentor - aff0) * 0.5) ; ok('talk_gift', L.rel.mentor - 66 <= 15 && L.rel.mentor >= syncd, { rel: L.rel.mentor, aff: G.aff.mentor, synced_max: syncd + 6 });
  // Game.apply 的 aff 效果同步，负数向零取整
  L.rel = {}; await Game.apply('aff:sister:9'); await Game.apply('aff:sister:-5'); ok('apply_sync', L.rel.sister === 2, L.rel.sister);
  // 奇遇链：给予者从 0 → ≥40
  L.rel = {}; for (const q of ['qc34_v1', 'qc34_v2', 'qc34_v3']) { G.quests[q] = { k0: {} }; if (QUESTS[q].need.i) for (const [i, c] of Object.entries(QUESTS[q].need.i)) Game.give(i, c); await Game.finishQuest(q); }
  ok('chain_giver_40', L.rel.b34_boatman >= 40, L.rel);
  // 老存档：高 G.aff、无 life34 → 不立刻来报恩
  delete G.life34; G.aff = { mentor: 150, cuihua: 140, sister: 120 }; let fr = 0; for (let k = 0; k < 20; k++) { G.year++; Life34.simYear(); if (G.life34.pending && G.life34.pending.type === 'friend') fr++; G.life34.pending = null; }
  ok('old_save_no_backfill', fr === 0 && Object.keys(G.life34.rel).length === 0, fr);
  UI.say = say0; Game.fight = f0; UI.toast = t0; UI.card = card0;
  return { out, fails };
}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': 412, 'height': 915}, device_scale_factor=2)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///' + __import__('os').path.abspath('www/index.html')); await pg.wait_for_timeout(1500)
        await pg.click('text=开始新人生'); await pg.wait_for_timeout(400); await pg.click('#nx')
        for k in range(3): await pg.locator('.talb').nth(k).click()
        for k in range(3): await pg.click('#nx'); await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(2500)
        r = await pg.evaluate(JS); r['js_errors'] = errs
        print(json.dumps(r, ensure_ascii=False, indent=1)); await b.close()
        sys.exit(1 if r['fails'] or errs else 0)
asyncio.run(main())

# 3.7.4 自由路线：python3 test/route37_unit.py（无头；A10.1–A10.6 + 面板 + 存档）
import asyncio, json, sys, os
from playwright.async_api import async_playwright
JS = r"""async () => {
  const out = {}, fails = []; const ok = (k, c, v) => { console.log('STEP '+k+' '+!!c); out[k] = v === undefined ? c : v; if (!c) fails.push(k); };
  const G = Game.G; const cards = []; UI.card = async (t, b, p, o) => { cards.push(t); return 0; };
  // A10.1 老档无 route37：年结算不出路线卡
  console.log('STEP start'); delete G.route37; const n0 = cards.length; UI.say = async () => 0; UI.fade = async () => {}; const y00 = G.year; await Promise.race([Game.yearEnd(), new Promise(r => setTimeout(r, 8000))]); out.year_advanced = G.year !== y00;
  ok('A10.1_old_save_no_cards', !cards.slice(n0).some(t => /^⚑/.test(t)) && G.route37 == null, cards.slice(n0));
  UI.panel('more'); await new Promise(r => setTimeout(r, 300)); ok('A10.1_more_button', !!document.querySelector('.big2[data-k="route37"]'));
  { const x = [...document.querySelectorAll('.panel .x')].pop(); if (x) x.click(); }
  // A10.6 结局 id
  ok('A10.6_ids', ['r37_xiaoyao', 'r37_mojun', 'r37_fujia', 'r37_shijia'].every(k => ENDINGS[k]) && ENDINGS.demon[0] === '魔尊降世' && ENDINGS.tycoon[0] === '富甲三界');
  // A10.3 魔修：karma −60 进入；切出 🔒 心魔未消（冷却已满时）；冷却内 🔒 还要再走 N 年
  G.karma = 0; ok('moxiu_locked', !!Route37.lock('moxiu', G));
  G.karma = -60; ok('moxiu_enter', await Route37.choose('moxiu') && Route37.cur(G) === 'moxiu');
  ok('A10.3_cooldown', /还要再走 10 年/.test(Route37.leaveLock(G) || ''), Route37.leaveLock(G));
  { const c0 = Route37.T.cooldownYears; Route37.T.cooldownYears = 7; ok('fix1_cooldown_T', /还要再走 7 年.*满 7 年/.test(Route37.leaveLock(G) || ''), Route37.leaveLock(G)); Route37.T.cooldownYears = c0; }
  G.route37.since -= 10; ok('A10.3_xinmo', /心魔未消/.test(Route37.leaveLock(G) || ''), Route37.leaveLock(G));
  G.karma = 0; ok('A10.3_leave_ok', Route37.leaveLock(G) === null && await Route37.choose(null) && Route37.cur(G) === null && G.route37.hist[0].id === 'moxiu');
  ok('cooldown_after_exit', /还要再走/.test(Route37.leaveLock(G) || '') === false); // 无路线时没有离开锁
  // 魔修修为 ×1.15
  G.route37.since -= 20; G.karma = -60; await Route37.choose('moxiu'); const cm = Game.cultMult(); G.route37.id = null; const cm0 = Game.cultMult(); G.route37.id = 'moxiu';
  ok('moxiu_cult', Math.abs(cm / cm0 - 1.15) < 1e-9, cm / cm0);
  // 魔修结局：kills≥3 且 天魔殿≥60 → 在厉无咎处出现 ⚑ 大结局
  G.route37.kills = 3; G.route37.rep.tianmo = 59; ok('mojun_not_yet', !Route37.check('r37_mojun', G));
  G.route37.rep.tianmo = 60; ok('mojun_ready', Route37.ready() === 'r37_mojun' && Talk.extra('jh_mozi').some(o => /^⚑ 大结局·魔君/.test(o[0])));
  ok('duel_option', Talk.extra('jh_jianke').some(o => /仇杀/.test(o[0])) && !Talk.extra('jh_mozi').some(o => /仇杀/.test(o[0])));
  // A10.4 where NPC 陨落 → 兜底 villager
  G.npc37 = G.npc37 || {}; if (typeof NPC37 !== 'undefined') NPC37.st(); G.npc37.st = G.npc37.st || {}; G.npc37.st.jh_mozi = { dead: 1 };
  ok('A10.4_fallback', Route37.where('r37_mojun') === 'villager' && Talk.extra('villager').some(o => /^⚑ 大结局/.test(o[0])));
  delete G.npc37.st.jh_mozi;
  // A10.4 每年最多 1 条专属事件；自动中不弹
  B.on = false; /* A10.1 的 yearEnd 被 race 超时打断，可能留下未结束的战斗 */ G.route37.tip = { r37_mojun_0: 1, r37_mojun_1: 1 }; let c1 = cards.length; await Route37.yearTick(() => 0.01); const evc = cards.slice(c1).filter(t => /^⚑/.test(t)).length; ok('A10.4_one_event', evc === 1, cards.slice(c1));
  AUTO.on = true; c1 = cards.length; await Route37.yearTick(() => 0.01); ok('A10.4_auto_no_card', cards.length === c1); AUTO.on = false;
  // 20 条事件都能跑（选项 0/1）
  const _fg = Game.fight; Game.fight = async () => ({ res: 'win' }); const st0 = G.stone; G.stone = 1e6; G.inv.hcd = 10; let evOk = 0;
  for (const r of Route37.IDS) for (let i = 0; i < 4; i++) { const res = await Route37.runEvent(r, i, () => 0.5); if (res && res.c >= 0) evOk++; }
  ok('events_20', evOk === 20, evOk);
  const k0 = G.route37.kills; G.route37.kmo = {}; ok('duel_win', (await Route37.duel('jh_jianke')) === 'win' && G.route37.kills === k0 + 1 && (await Route37.duel('jh_jianke')) === null);
  // review fixes: 给钱按 ×(1+大境界) 同时扣灵石和债；debtPct 文案按数值；落败身死提前返回；年终守卫；新闻
  { const rl = G.realm; G.realm = 2; G.stone = 100000; G.debt = 100000; const s0 = G.stone, d0 = G.debt; await Route37.runEvent('moxiu', 2, () => 0.5);
    ok('fix2_pay_scaled', s0 - G.stone === 1500 && d0 - G.debt === 1500, [s0 - G.stone, d0 - G.debt]); G.realm = rl; }
  { const o = await Route37.applyFx({ debtPct: 0.02 }); ok('fix2_debtPct_text', o.some(x => /利息 \+2%/.test(x)), o); G.route37.debtPct = 0; }
  { Game.fight = async () => { G.dead = true; return { res: 'lose' }; }; G.stone = 5000; const o = await Route37.applyFx({ fight: 1 }); ok('fix3_dead_return', G.stone === 5000 && !o.some(x => /落败/.test(x)), o); G.dead = false; Game.fight = async () => ({ res: 'win' }); }
  { const cs = Route37.choose; G.route37.tip = { r37_mojun_0: 1, r37_mojun_1: 1 };
    const hadB = typeof B !== 'undefined'; if (hadB) { const b0 = B.on; B.on = true; let c = cards.length; await Route37.yearTick(() => 0.01); ok('fix3_guard_B', cards.length === c); B.on = b0; }
    const n0 = R.player.nav; R.player.nav = [1]; let c = cards.length; await Route37.yearTick(() => 0.01); ok('fix3_guard_nav', cards.length === c); R.player.nav = n0;
    c = cards.length; await Route37.yearTick(() => 0.01); ok('fix3_guard_off_shows', cards.length > c); }
  const news = []; const _say = JH34.say; JH34.say = function (L, s) { news.push(s); return _say.apply(this, arguments); };
  { G.route37.kmo = {}; await Route37.duel('jh_danniang'); ok('fix4_kill_news', news.some(s => /击败了正道/.test(s)), news); }
  // fix5（G.sectRel 镜像）未实现：见 PR 评论
  { const sr = JSON.stringify(G.sectRel || null), sv = G.route37, sc = G.sect; G.sect = 'qingyun';
    G.route37 = null; const r0 = ROUTE37.rep(); G.route37 = { id: 'moxiu' }; const r1 = ROUTE37.rep(); G.route37 = { rep: { qingyun: 'x' } }; const r2 = ROUTE37.rep();
    G.route37 = { rep: { qingyun: 12, tianmo: 40 } }; const r3 = ROUTE37.rep(), r4 = ROUTE37.rep('tianmo'); G.sect = null; const r5 = ROUTE37.rep();
    const gg = Game.G; Game.G = null; let r6; try { r6 = ROUTE37.rep(); } finally { Game.G = gg; }
    G.route37 = sv; G.sect = sc; ok('rep_reader', ROUTE37 === Route37 && [r0, r1, r2, r5, r6].every(v => v === 0) && r3 === 12 && r4 === 40 && JSON.stringify(G.sectRel || null) === sr, [r0, r1, r2, r3, r4, r5, r6]); }
  // A10.2 商贾：凡人 30 岁，灵石 100 万，钱多多处结局，结算分含 +15
  G.route37.since -= 20; G.karma = 0; G.realm = 0; G.age = 30; G.sect = null;
  ok('shangjia_enter', await Route37.choose('shangjia') && G.route37.merchant === 1 && Game.cultMult() === 0);
  // 放贷：3 笔上限，第 4 笔 🔒；借款人陨落 → 全额违约
  G.stone = 1e6; ok('loan1', Route37.loan('jh_tieguo', 5000)); ok('loan2', Route37.loan('jh_xunbao', 20000)); ok('loan3', Route37.loan('merchant', 50000));
  ok('A10.5_4th_locked', /最多 3 笔/.test(Route37.canLoan('jh_tieguo', G) || ''), Route37.canLoan('jh_tieguo', G));
  G.npc37.st.jh_tieguo = { dead: 1 }; const s1 = G.stone; await Route37.yearTick(() => 0.99);
  ok('fix4_default_news', news.some(s => /坏账/.test(s)), news);
  ok('A10.5_dead_default', !G.route37.loans.some(l => l.who === 'jh_tieguo') && G.route37.loans.length === 2, G.route37.loans);
  ok('loan_interest', G.stone - s1 === Math.round(20000 * 0.12) + Math.round(50000 * 0.07), G.stone - s1);
  delete G.npc37.st.jh_tieguo;
  { G.route37.loans = [{ who: 'jh_xunbao', amt: 20000, y: G.year }]; news.length = 0; await Route37.yearTick(() => 0.05); ok('fix4_default_news2', news.some(s => /还不上钱/.test(s)), news); }
  JH34.say = _say;
  // 行商：押一半，年底结算 ×(1.1..1.7)+200
  G.stone = 10000; G.route37.loans = []; G.route37.later = []; ok('trade', Route37.trade(0.5) && G.stone === 5000); G.year++; await Route37.yearTick(() => 0.5); ok('trade_back', G.stone === 5000 + Math.round(5000 * 1.4) + 200, G.stone);
  ok('life_plus', G.route37.life >= 1);
  G.stone = 1000000; ok('A10.2_fujia', Route37.ready() === 'r37_fujia' && Talk.extra('merchant').some(o => /^⚑ 大结局·富甲一方/.test(o[0])));
  ok('nobreak', (await Game._tryBreak()) === undefined);
  // 子嗣灵根：家族路线取两次较好
  // A10.6 提示卡 ⚑
  ok('A10.6_card_titles', cards.every(t => !/前路|道途|大结局/.test(t) || /^⚑/.test(t)), cards.filter(t => !/^⚑/.test(t)));
  // 面板
  UI.panel('route37'); await new Promise(r => setTimeout(r, 300)); const pn = document.querySelector('.r37'); ok('panel', !!pn && /凡人商贾/.test(pn.textContent) && pn.querySelectorAll('button[data-r="loan"]').length === 3);
  ok('devtab', (window.DevTabs || []).some(t => t.key === 'route37'));
  Game.save();
  // 结局：+15 分（achNew +3）
  const a0 = G.achNew || 0; let shown = null; const _ue = UI.ending; UI.ending = async (k, E, pts) => { shown = [k, pts]; };
  await Route37.endNow('r37_fujia'); ok('ending_called', shown && shown[0] === 'r37_fujia' && G.dead, shown); ok('bonus15', (G.achNew || 0) - a0 === 3, (G.achNew || 0) - a0);
  return { out, fails };
}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': 412, 'height': 915}, device_scale_factor=2)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: print('LOG', m.text[:200], flush=True) if os.environ.get('DBG') else None)
        await pg.goto('file:///' + os.path.abspath('www/index.html')); await pg.wait_for_timeout(1500)
        await pg.click('text=开始新人生'); await pg.wait_for_timeout(400); await pg.click('#nx')
        for k in range(3): await pg.locator('.talb').nth(k).click()
        for k in range(3): await pg.click('#nx'); await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(2500)
        # 存档：先选路线存一次，刷新后看是否还在
        await pg.evaluate("(async()=>{UI.card=async()=>0; Game.G.karma=-60; await Route37.choose('moxiu'); Game.save();})()")
        await pg.reload(); await pg.wait_for_timeout(1500)
        saved = await pg.evaluate("(()=>Object.keys(localStorage).some(k=>{const v=localStorage.getItem(k)||'';return v.includes('route37')&&v.includes('moxiu')}))()")
        await pg.click('text=继续人生'); await pg.wait_for_timeout(2500)
        await pg.evaluate("(()=>{delete Game.G.route37})()")
        print('EVAL', flush=True); r = await pg.evaluate(JS); fails = r['fails']
        r['out']['persist'] = saved
        if not saved: fails.append('persist')
        r['js_errors'] = errs
        print(json.dumps(r, ensure_ascii=False, indent=1)); await b.close()
        sys.exit(1 if fails or errs else 0)
asyncio.run(main())

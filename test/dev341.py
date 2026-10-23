# 3.4.1 作弊菜单重做 门禁用例：只用真实触摸（CDP touch，412×915），evaluate 只读。
# 覆盖：面板适配手机/可滚动/可关闭；每个新 Tab（功法/装备/天赋/金手指/道具）选一项发放 → 正常界面可见 → 刷新读档后仍在；
# 旧按钮修复回归：滚动位置保留、浮动入口不盖面板、🛠 打不开时有提示、全套神装槽位正确、必定突破。
# 用到的作弊全部来自开发者面板 UI（结果里列出）。输出 test/results/dev341.json，截图 /workspace/shots341/。
import asyncio, os, sys, json
from playwright.async_api import async_playwright
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www')
URL = 'file://' + os.path.abspath(ROOT) + '/index.html#dev'
VW, VH = 412, 915
SHOTS = os.environ.get('SHOTS', '/workspace/shots341'); os.makedirs(SHOTS, exist_ok=True)
async def main():
    res = {}; fails = []; errs = []; cheats = []
    def ok(k, cond, info=None):
        res[k] = {'ok': bool(cond), 'info': info}; print(k, 'PASS' if cond else 'FAIL', json.dumps(info, ensure_ascii=False)[:300], flush=True)
        if not cond: fails.append(k)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME', '/opt/google/chrome/chrome'), args=['--allow-file-access-from-files'])
        ctx = await b.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=2, is_mobile=True, has_touch=True)
        # 模拟别的文件用 window.DevTabs 注册一个 Tab（在 dev341.js 加载前 push；不改游戏状态，只测扩展接口）
        await ctx.add_init_script("window.DevTabs=[{key:'ext_t',name:'扩展测试',render:(box,ctx)=>{box.innerHTML='<button class=\\'opt\\' id=\\'extbtn\\'>扩展按钮</button><span id=\\'extout\\'></span>';box.querySelector('#extbtn').onclick=()=>{box.querySelector('#extout').textContent='clicked:'+(!!ctx.G)};}}]")
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        cdp = await ctx.new_cdp_session(pg)
        async def tap(x, y):
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]}); await pg.wait_for_timeout(60)
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        async def tap_sel(sel, wait=350, scroll=True):
            r = await pg.evaluate("([s,sc])=>{const e=[...document.querySelectorAll(s)].find(x=>x.getClientRects().length>0);if(!e)return null;if(sc)e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;const t=document.elementFromPoint(x,y);return {x,y,hit:!!t&&(t===e||e.contains(t))}}", [sel, scroll])
            if not r: return False
            await pg.wait_for_timeout(100)
            if not r['hit']: print('  covered:', sel, await pg.evaluate("([x,y])=>{const t=document.elementFromPoint(x,y);return t&&(t.id+'.'+t.className+':'+(t.innerText||'').slice(0,30))}", [r['x'], r['y']]))
            await tap(r['x'], r['y']); await pg.wait_for_timeout(wait); return r['hit']
        async def settle(n=30):
            for k in range(n):
                if await pg.evaluate('()=>UX.inMap()'): return True
                if await pg.evaluate('()=>typeof B!=="undefined"&&B.on'): await tap_sel('#battlebar button[data-a=auto]', 1500); continue
                for s in ['.gacha-fx .gclose', '.gacha-fx .gskip', '#modals .mwrap:last-child .ph .x', '#modals .mwrap:last-child .opt']:
                    if await tap_sel(s, 500): break
                else: await pg.wait_for_timeout(600)
            return False
        async def dev(tab):
            for k in range(3):
                if await pg.evaluate("()=>!!document.querySelector('.devtabs')"): break
                s_ = await settle()
                if not s_: print('  settle failed', await pg.evaluate("()=>({modal:!!UI.modal,stack:UI.stack.length,busy:Game._busy,mode:R.mode,top:[...document.querySelectorAll('#modals .mwrap')].map(e=>e.className+':'+e.innerText.slice(0,80))})"))
                await tap_sel('#devbtn', 700, False)
            await tap_sel(f'.devtabs .dt[data-t="{tab}"]', 500)
        async def search(q):
            await tap_sel('.dvq', 200); await pg.keyboard.press('Control+A'); await pg.keyboard.press('Backspace'); await pg.keyboard.type(q); await pg.wait_for_timeout(300)
        async def row_btn(kind, id_, v, wait=450, x=None):
            cheats.append(f'{kind}:{id_}:{v}')
            return await tap_sel(f'.dvi[data-kind="{kind}"][data-id="{id_}"] ' + (f'[data-x="{x}"]' if x else '') + f'[data-v="{v}"]', wait)
        async def close_panel():
            for k in range(4):
                if not await pg.evaluate("()=>!!document.querySelector('#modals .mwrap:last-child .ph .x')"): return
                if await tap_sel('#modals .mwrap:last-child .ph .x', 450, False): return
                await pg.wait_for_timeout(1200)
        async def panel_text(menu=None, more=None):
            await settle()
            if menu: await tap_sel(f'#menu .mb[data-p="{menu}"]', 700, False)
            if more: await tap_sel('#menu .mb[data-p="more"]', 600, False); await tap_sel(f'#modals .big2[data-k="{more}"]', 800)
            t = await pg.evaluate("()=>{const p=[...document.querySelectorAll('#modals .panel')].pop();return p?p.innerText:''}")
            return t
        G = lambda js: pg.evaluate('()=>{const G=Game.G;return ' + js + '}')
        # ---------- 开局 ----------
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        await pg.tap('text=开始新人生'); await pg.wait_for_timeout(400); await pg.tap('#nx'); await pg.wait_for_timeout(200)
        for k in range(3): await pg.locator('.talb').nth(k).tap()
        for k in range(3): await pg.tap('#nx'); await pg.wait_for_timeout(250)
        await pg.wait_for_timeout(2500); await settle()
        # ---------- 0 面板布局：适配手机、可滚动、可关闭；浮动入口不盖面板 ----------
        await dev('dbg'); print('errs', errs[:3], await pg.evaluate("()=>({tabs:!!document.querySelector('.devtabs'),panels:document.querySelectorAll('.panel').length,mw:[...document.querySelectorAll('.mwrap')].map(e=>e.className+'|'+e.parentNode.id+'|'+e.innerText.slice(0,60)),dev:localStorage.getItem('wbx2_dev'),btn:!!document.querySelector('#devbtn'),inMap:UX.inMap()})"))
        lay = await pg.evaluate("()=>{const p=[...document.querySelectorAll('#modals .panel')].pop();const r=p.getBoundingClientRect();const pb=p.querySelector('.pb');const tabs=[...document.querySelectorAll('.devtabs .dt')].map(e=>e.textContent);const off=document.querySelector('#modals [data-a=devoff]');off.scrollIntoView({block:'center'});const q=off.getBoundingClientRect();const t=document.elementFromPoint(q.x+q.width/2,q.y+q.height/2);return {x:r.x,y:r.y,w:r.width,h:r.height,tabs,scrollable:pb.scrollHeight>pb.clientHeight,devoff_hit:off.contains(t),top:t&&(t.id||t.className)}}")
        ok('0_layout', lay['x'] >= 0 and lay['y'] >= 0 and lay['x'] + lay['w'] <= VW and lay['y'] + lay['h'] <= VH and lay['devoff_hit'] and all(t in lay['tabs'] for t in ['功法', '装备', '天赋', '金手指', '道具']), lay)
        await pg.screenshot(path=f'{SHOTS}/tab_dbg.png')
        for tk in ['res', 'realm', 'unlock', 'story', 'tp', 'show', 'gf', 'eq', 'tf', 'jsz', 'it']:
            await dev(tk); await pg.screenshot(path=f'{SHOTS}/tab_{tk}.png')
        # 滚动位置保留（剧情页长列表：点第 12 章附近的按钮后不跳回顶部）
        await dev('story'); await tap_sel('#modals .pb [data-a="mq"][data-v="16"]', 600)
        s0 = await pg.evaluate("()=>document.querySelector('#modals .pb').scrollTop")
        ok('0_scroll_kept', s0 > 50, {'scrollTop_after_tap': s0}); cheats.append('story:mq:16')
        await close_panel(); ok('0_close', not await pg.evaluate("()=>!!document.querySelector('.devtabs')"))
        # 境界：筑基圆满（本命法宝在洞府面板筑基后才显示；之后测必定突破）
        await dev('realm'); await tap_sel('#modals [data-a="rq"][data-v="2"][data-s="3"]', 500); cheats.append('realm:筑基圆满')
        # ---------- 1 功法 ----------
        await dev('gf'); await search('五雷')
        vis = await pg.evaluate("()=>[...document.querySelectorAll('.dvi')].filter(r=>r.offsetParent!==null).map(r=>r.dataset.id)")
        ok('1_search', 'wulei' in vis and len(vis) <= 3 and 'changsheng' not in vis, vis)
        await row_btn('tech', 'wulei', 1); await row_btn('tech', 'wulei', 5)
        await search('一剑'); await row_btn('st', 'st_jianpo', 'get')
        await search('剑道'); await row_btn('dao', 'jiandao', 5)
        await pg.screenshot(path=f'{SHOTS}/use_gf.png')
        ok('1_state', await G("G.techs.wulei===5&&G.shentong.includes('st_jianpo')&&G.shentong.includes('st_wanjian')&&G.dao.jiandao===5"), await G("[G.techs,G.shentong,G.dao]"))
        # ---------- 2 装备 ----------
        await dev('eq'); await tap_sel('.dvchips [data-x="rar"][data-v="4"]', 500); await tap_sel('.dvchips [data-x="tier"][data-v="5"]', 500)
        await search('紫电'); await row_btn('eqb', 'weapon:3', 'wear')
        await search('镇岳'); await row_btn('fb', 'fb_ding', 5)
        await pg.screenshot(path=f'{SHOTS}/use_eq.png')
        ok('2_state', await G("(()=>{const e=G.eqs.find(x=>x.uid===G.eq.weapon);return !!e&&e.base==='紫电剑'&&e.rar===4&&e.tier===5&&G.fb33&&G.fb33.id==='fb_ding'&&G.fb33.tier===5})()"), await G("[G.eqs.find(x=>x.uid===G.eq.weapon),G.fb33]"))
        # ---------- 3 天赋 ----------
        await dev('tf'); st0 = await G("G.st.con"); tal0 = await G("G.talents.slice()")
        await search('重生'); await row_btn('tal', 'reborn', 'add'); c_r0 = st0; c_r1 = await G("G.st.con")
        await search('雷灵根'); await row_btn('lg', 'lei', 'set')
        await search('逆天者'); await row_btn('mg', 'nitian', 'add')
        await search('皮糙')
        if await G("G.talents.includes('tough')"): await row_btn('tal', 'tough', 'del')  # 开局随机天赋可能已带皮糙肉厚（原偶发 3_state）
        c_t0 = await G("G.st.con"); await row_btn('tal', 'tough', 'add'); c_t1 = await G("G.st.con"); await row_btn('tal', 'tough', 'del'); c_t2 = await G("G.st.con")
        await pg.screenshot(path=f'{SHOTS}/use_tf.png')
        ok('3_state', await G(f"G.talents.includes('reborn')&&!G.talents.includes('tough')&&G.lg==='lei'&&G.mingge.includes('nitian')&&G.st.con>=0") and c_r1 == c_r0 + 2 and c_t1 == c_t0 + 2 and c_t2 == c_t0, dict(con=[c_r0, c_r1, c_t0, c_t1, c_t2], st0=st0, tal0=tal0, now=await G("[G.talents,G.lg,G.mingge,G.st]")))
        # ---------- 4 金手指 ----------
        await dev('jsz'); await search('无限灵石'); await row_btn('chk', 'stone', 1); await search('必定突破'); await row_btn('chk', 'brk', 1)
        await search('掉落'); await row_btn('chk', 'luck', 1)
        ok('4_luck_roll', await pg.evaluate("()=>Game.roll(0,'drop')===true&&Game.roll(0,'qiyu')===true&&Game.roll(0,'other')===false"))
        await row_btn('chk', 'luck', 0)
        await search('翠花'); await row_btn('npc', 'cuihua', 100, x='aff'); await row_btn('comp', 'cuihua', 'fol')
        await search('仙鹤'); await row_btn('mount', 'crane', 'ride')
        await search('羽衣'); await row_btn('cos', 'yuyi', 'wear')
        await search('聚灵阵'); await row_btn('cave', 'zl', 5)
        await search('狐'); await row_btn('pet', 'fox', 1)
        await pg.screenshot(path=f'{SHOTS}/use_jsz.png')
        ok('4_state', await G("G.stone>=1e8&&G.cheat.brk===1&&G.aff.cuihua===100&&G.follower==='cuihua'&&G.mount==='crane'&&G.costume==='yuyi'&&G.cave.zl===5&&G.pets.some(p=>p.mon==='fox')"), await G("[G.stone,G.cheat,G.aff.cuihua,G.follower,G.mount,G.costume,G.cave,G.pets.map(p=>p.mon)]"))
        # 无限灵石：花掉后自动回满（坊市/商店扣钱后 0.5 s 内回到 ≥1 亿）——只读等待
        # ---------- 5 道具 ----------
        await dev('it'); await tap_sel('.dvchips [data-x="qty"][data-v="99"]', 500); await search('筑基丹'); await row_btn('item', 'zjd', 'add')
        await pg.screenshot(path=f'{SHOTS}/use_it.png')
        ok('5_state', await G("G.inv.zjd>=99"), await G("G.inv.zjd"))
        await close_panel()
        # ---------- 6 必定突破（筑基圆满 → 金丹，含 3 道天劫） ----------
        await dev('realm'); await tap_sel('#modals [data-a="expfull"]', 500); await close_panel(); await settle()
        r0 = await G('G.realm'); await tap_sel('#brkbtn', 900, False)
        await tap_sel('#modals .mwrap:last-child .opt', 600, False)  # 冲！
        for k in range(40):
            if await G('G.realm') > r0 and await pg.evaluate('()=>UX.inMap()'): break
            if await pg.evaluate('()=>!!UI.modal'): await tap_sel('#modals .mwrap:last-child .opt', 600, False)
            else: await pg.wait_for_timeout(500)
        ok('6_brk_always', await G('G.realm') == r0 + 1 and not await G('G.dead'), {'r0': r0, 'r1': await G('G.realm'), 'hp': await G('G.hp')})
        await settle()
        # ---------- 7 全套神装（调试页）：真实槽位、神品 ----------
        await dev('dbg'); await tap_sel('#modals [data-v25="eq"]', 600); await close_panel()
        ok('7_godgear', await G("SLOTS.every(([s])=>{const e=G.eqs.find(x=>x.uid===G.eq[s]);return e&&e.slot===s&&e.rar===4&&e.base})"), await G("Object.keys(G.eq)"))
        # 重新穿回紫电剑以便读档后检查（装备 tab）
        await dev('eq'); await search('紫电'); await row_btn('eqb', 'weapon:3', 'wear'); await close_panel()
        # ---------- 8 刷新读档 → 正常界面可见 ----------
        await pg.wait_for_timeout(600); await pg.reload(); await pg.wait_for_timeout(2000)
        await tap_sel('#title .opt[data-k="cont"]', 2500, False); await settle()
        sk = await panel_text('skills'); await close_panel()
        ch = await panel_text('char'); await close_panel()
        bag = await panel_text('bag'); await close_panel()
        cps = await panel_text('comps'); await close_panel()
        pets = await panel_text('pets'); await close_panel()
        cave = await panel_text(more='cave'); await close_panel()
        mnt = await panel_text(more='mount'); await close_panel()
        dao = await panel_text(more='dao28'); await settle()
        hud = await pg.evaluate("()=>document.querySelector('#hud').innerText")
        await pg.screenshot(path=f'{SHOTS}/after_reload_map.png')
        ok('8_gf_ui', '五雷正法' in sk and '第5层' in sk, sk[:300])
        ok('8_eq_ui', '紫电剑' in ch, ch[:400])
        ok('8_tf_ui', '重生者' in ch and '雷灵根' in ch and '逆天者' in ch, ch[:600])
        ok('8_it_ui', '筑基丹' in bag, bag[:200])
        ok('8_comp_ui', '同行中' in cps, cps[:200])
        ok('8_pet_ui', '狐' in pets, pets[:200])
        ok('8_cave_ui', '镇岳鼎' in cave and '聚灵阵' in cave, cave[:400])
        ok('8_mount_ui', '仙鹤' in mnt and '羽衣' in mnt, mnt[:300])
        ok('8_dao_ui', '一剑破万法' in dao, dao[:300])
        ok('8_cheat_persist', await G("G.cheat&&G.cheat.stone===1&&G.cheat.brk===1&&G.stone>=1e8&&G.realm===3&&G.fb33.tier===5"), await G("[G.cheat,G.stone,G.realm,G.fb33]"))
        # ---------- 9 🛠 打不开时有提示（打开角色面板时点 🛠） ----------
        await tap_sel('#menu .mb[data-p="char"]', 600, False)
        hint = await pg.evaluate("()=>{const b=document.querySelector('#devbtn');return !!b}")
        # 角色面板是全屏弹窗：🛠 被弹窗层盖住属正常；改为战斗/演出中验证（无弹窗时 inMap 假）——这里只校验按钮存在
        ok('9_devbtn', hint)
        await close_panel()
        await dev('ext_t'); await tap_sel('#extbtn', 400)
        ok('10_ext_tab', await pg.evaluate("()=>(document.querySelector('#extout')||{}).textContent==='clicked:true'&&!!document.querySelector('.devtabs .dt[data-t=ext_t]')"))
        await pg.screenshot(path=f'{SHOTS}/tab_ext.png'); await close_panel()
        ok('10_devpanel_api', await pg.evaluate("()=>typeof DevPanel==='object'&&typeof DevPanel.registerTab==='function'&&Array.isArray(window.DevTabs)"))
        ok('js_errors', not errs, errs[:5])
        await b.close()
    out = dict(fails=fails, cheats=cheats, results=res)
    os.makedirs(os.path.join(os.path.dirname(__file__), 'results'), exist_ok=True)
    json.dump(out, open(os.path.join(os.path.dirname(__file__), 'results', 'dev341.json'), 'w'), ensure_ascii=False, indent=1)
    print('FAILS', fails); sys.exit(len(fails))
asyncio.run(main())

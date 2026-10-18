// 即时遭遇战原型无头单测：node test/battle_rt_proto.js（退出码 = 失败数）
// 只验证 www/js/battle_realtime_prototype.js 的状态逻辑（移动/普攻扇形命中/伤害飘字/胜负/精灵接入/隔离），不开浏览器。
'use strict';
const fs = require('fs');
const path = require('path');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const ROOT = path.join(__dirname, '..');
global.window = global;
require(path.join(ROOT, 'www', 'assets', 'assets.js')); // 真实精灵清单（window.ASSETS）
const drawn = [];
global.loadSprite = id => Promise.resolve(id);
global.drawSprite = (ctx, id, anim, dir) => { drawn.push({ id, anim, dir }); return { top: 0, h: 100 }; };
let fightWrapped = false;
global.Game = { G: { sex: 'f', realm: 0 }, playerSpr() { return 'player_f0'; }, save() { throw new Error('原型不应存档'); } };
Object.defineProperty(global.Game, 'fight', { set() { fightWrapped = true; }, get() { return undefined; }, configurable: true });
const RB = require(path.join(ROOT, 'www', 'js', 'battle_realtime_prototype.js'));
const S = RB.state;
const fakeCtx = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });

(async () => {
  // 1. 隔离：只暴露 RealtimeBattle，不包 Game.fight，不留全局 RT / 函数名
  ok(window.RealtimeBattle === RB && !fightWrapped, '只暴露 window.RealtimeBattle，不碰 Game.fight');
  ok(typeof global.RT === 'undefined' && typeof global.playerAttack === 'undefined', '不污染全局（RT / playerAttack 未泄漏）');
  ok(RB.open() === null, '无 document 时 open() 不做任何事');
  ok(!RB.devEnabled(), '无 #dev / wbx2_dev 时开发者开关为关');
  const refs = fs.readdirSync(path.join(ROOT, 'www', 'js')).filter(f => f.endsWith('.js') && f !== 'battle_realtime_prototype.js')
    .filter(f => /RealtimeBattle/.test(fs.readFileSync(path.join(ROOT, 'www', 'js', f), 'utf8')));
  ok(refs.length === 1 && refs[0] === 'dev_entry_v25.js', '只有开发者入口引用 RealtimeBattle：' + refs.join(','));
  ok(/RealtimeBattle\.open\(/.test(fs.readFileSync(path.join(ROOT, 'www', 'js', 'dev_entry_v25.js'), 'utf8')), '开发者「即时战」按钮走自带循环的 open()');

  // 2. 精灵：主角用 Game.playerSpr()，敌人默认 mon_slime，且都在真实图集里
  let done = RB.start([{ name: '史莱姆', hp: 60, x: 300, y: 250, skillCd: 99 }, { name: '背后怪', hp: 60, x: 300, y: 390, skillCd: 99 }]);
  ok(S.player.spr === 'player_f0' && S.enemies[0].spr === 'mon_slime', '主角精灵=Game.playerSpr()，敌人默认 mon_slime');
  ok(!!window.ASSETS.sprites[S.player.spr] && !!window.ASSETS.sprites[S.enemies[0].spr], '两个精灵 id 都存在于 assets.js');
  drawn.length = 0; RB.draw(fakeCtx());
  ok(drawn.some(d => d.id === 'player_f0') && drawn.some(d => d.id === 'mon_slime'), 'draw() 用 drawSprite 画主角和敌人');
  ok(drawn.find(d => d.id === 'player_f0').dir === 'N' && drawn.find(d => d.id === 'player_f0').anim === 'idle', '默认朝上 = N，站立 idle');
  ok(RB.screenDir(1, 0) === 'E' && RB.screenDir(0, 1) === 'S' && RB.screenDir(-1, -1) === 'NW', '屏幕面向→八方向映射');

  // 3. 普攻：面向扇形命中前方、不打背后；伤害飘字；冷却
  ok(RB.inAttackArc(S.player, S.enemies[0]) && !RB.inAttackArc(S.player, S.enemies[1]), '扇形判定：前方 70 命中、背后 70 不中');
  let hits = RB.attack();
  ok(hits.length === 1 && S.enemies[0].hp === 60 - RB.ATK.dmg && S.enemies[1].hp === 60, '普攻只伤前方敌人 ' + RB.ATK.dmg);
  ok(S.dmgNums.some(n => n.txt === String(RB.ATK.dmg)), '命中出伤害飘字');
  ok(S.enemies[0].flash > 0 && S.enemies[0].y < 250, '受击闪白 + 击退');
  ok(RB.attack().length === 0 && S.enemies[0].hp === 60 - RB.ATK.dmg, '冷却内再按不出伤害');
  drawn.length = 0; RB.draw(fakeCtx());
  ok(drawn.find(d => d.id === 'player_f0').anim === 'attack', '挥砍中画 attack 动画');
  S.enemies[1].hp = 0; // 只留前方敌人
  RB.update(0.5);
  ok(S.player.attackCd === 0, '0.5s 后冷却结束');
  const n0 = S.dmgNums.length;
  // 4. 移动：按 D 向右走，面向变 E；飘字随时间消失
  S.keys.add('d'); const x0 = S.player.x; RB.update(0.2); S.keys.delete('d');
  ok(S.player.x > x0 + 30 && RB.screenDir(S.player.faceX, S.player.faceY) === 'E', 'D 键右移并面向 E');
  RB.update(1.0);
  ok(n0 > 0 && !S.dmgNums.some(n => n.txt === String(RB.ATK.dmg)), '伤害飘字 0.8s 后消失');
  // 落空提示
  S.player.faceX = 0; S.player.faceY = 1; S.enemies[0].x = 100; S.enemies[0].y = 100; S.player.attackCd = 0;
  ok(RB.attack().length === 0 && S.dmgNums.some(n => n.txt === '落空'), '打空出「落空」提示');
  // 5. 打死所有敌人 → win，Promise 结算
  S.enemies[0].x = S.player.x; S.enemies[0].y = S.player.y + 20; S.enemies[0].hp = 10; S.player.attackCd = 0;
  RB.attack(); RB.update(0.016);
  const r = await done;
  ok(r.result === 'win' && !S.on, '敌人全灭 → win，Promise 返回结果');
  ok(r.reason === 'cleared' && S.endReason === 'cleared', '敌人全灭 → 结束原因 cleared');
  let prevented = false; RB._key.down({ key: ' ', preventDefault() { prevented = true; } });
  ok(!prevented && S.keys.size === 0, '原型关闭后键盘不拦截（不影响正式游戏）');

  // 6. 超时 → lose；无图集时回退圆形不崩
  done = RB.start(null, { timeLimit: 1 });
  S.enemies[0].skillCd = 99;
  for (let i = 0; i < 80; i++) RB.update(0.016);
  const rTo = await done;
  ok(rTo.result === 'lose', '超时保底 → lose');
  ok(rTo.reason === 'timeout', '超时 → 结束原因 timeout（宿主据此结算误工费）');
  const saveDS = global.drawSprite; global.drawSprite = undefined;
  let threw = false; try { RB.draw(fakeCtx()); } catch (e) { threw = true; }
  global.drawSprite = saveDS;
  ok(!threw, '没有 drawSprite 时回退圆形绘制不报错');

  // 6b. 方块低模皮肤：页面加载了 LowpolyBox 时 skin:'box' 改画长方体角色，不调 drawSprite
  window.LowpolyBox = require(path.join(ROOT, 'www', 'js', 'lowpoly_box_chars.js'));
  done = RB.start(null, { skin: 'box', timeLimit: 1 });
  drawn.length = 0; let fills = 0;
  const bctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => { if (k === 'fill') fills++; }), set: (t, k, v) => { t[k] = v; return true; } });
  RB.draw(bctx);
  ok(S.skin === 'box' && drawn.length === 0 && fills >= 40, '方块皮肤：画长方体（' + fills + ' 次填充），不走 drawSprite');
  S.player.flash = 0.15; RB.draw(bctx);
  ok(S._lastBoxAnim && S._lastBoxAnim.player === 'hurt', '方块皮肤：主角受击闪白期间播 hurt 后仰');
  S.player.flash = 0; RB.draw(bctx);
  ok(S._lastBoxAnim.player === 'idle', '方块皮肤：闪白结束回到 idle');
  RB.end('lose'); await done;
  done = RB.start(null, { skin: 'box', boxPlayer: 'nvzhu', timeLimit: 1 });
  const fillsSeen = new Set(); const nctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => { if (k === 'fill') fillsSeen.add(t.fillStyle); }), set: (t, k, v) => { t[k] = v; return true; } });
  RB.draw(nctx);
  const skirtFills = window.LowpolyBox.build('nvzhu', { angle: window.LowpolyBox.angleFromFace(0, -1) }).filter(f => f.part === 'skirt').map(f => f.fill);
  ok(S.boxPlayer === 'nvzhu' && skirtFills.length > 0 && skirtFills.every(c => fillsSeen.has(c)), 'boxPlayer:nvzhu → 主角画成主角女（画面里出现裙摆配色）');
  RB.end('lose'); await done; delete window.LowpolyBox;

  // 8. 敌人前摇预警 + 前冲 / 弹道；玩家闪避无敌可躲
  S.rand = () => 0;
  const F = RB.FOE, D = RB.DODGE;
  const run = (sec, step = 1 / 60) => { for (let t = 0; t < sec - 1e-9; t += step) RB.update(step); };
  const freshLunge = (atkCd = 0) => { const pr = RB.start([{ name: '冲锋怪', hp: 999, x: 300, y: 240, speed: 0, atkCd }], { timeLimit: 99 }); S.player.x = 300; S.player.y = 320; return pr; };
  // 8a. 近距：进入前摇、锁方向、出预警，前摇期间不扣血
  done = freshLunge();
  RB.update(1 / 60);
  let e0 = S.enemies[0], tg = RB.telegraphs();
  ok(e0.state === 'windup' && e0.windKind === 'lunge' && tg.length === 1 && tg[0].kind === 'lunge', '近距 → 前冲前摇 + 1 个预警区');
  ok(Math.abs(e0.aimX) < 1e-6 && Math.abs(e0.aimY - 1) < 1e-6, '前摇开始锁定朝向玩家');
  let hp0 = S.player.hp; run(F.windLunge * 0.8);
  ok(S.player.hp === hp0 && RB.telegraphs()[0].k > 0.7, '前摇期间不扣血，预警逐渐填满');
  let tFill = 0; const tctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (...a) => { if (k === 'fillRect' && /255,60,40/.test(t.fillStyle || '')) tFill++; }), set: (t, k, v) => { t[k] = v; return true; } });
  RB.draw(tctx);
  ok(tFill >= 1, 'draw() 画出红色预警区');
  // 8b. 不躲：前冲命中扣 lungeDmg
  run(F.windLunge * 0.2 + F.lungeT + 0.05);
  ok(S.player.hp === hp0 - F.lungeDmg && S.dmgNums.some(n => n.txt === '-' + F.lungeDmg), '不躲 → 前冲命中 -' + F.lungeDmg);
  ok(S.enemies[0].state === 'chase' && S.enemies[0].atkCd > F.cdMin - 0.2, '出手后回到追击并进入冷却');
  RB.end('lose'); await done;
  // 8c. 前摇中横移出锁定线 → 前冲落空
  done = freshLunge(); RB.update(1 / 60); hp0 = S.player.hp;
  S.player.x += 80; // 侧移（模拟走位）
  run(F.windLunge + F.lungeT + 0.05);
  ok(S.player.hp === hp0, '前摇中走出预警区 → 前冲落空');
  RB.end('lose'); await done;
  // 8d. 前冲到达瞬间闪避（无敌）→ 免伤 + 「闪避!」
  done = freshLunge(); RB.update(1 / 60); hp0 = S.player.hp;
  run(F.windLunge - 0.02);
  S.player.faceX = 0; S.player.faceY = 1; RB.dash(); // 朝敌人前冲方向闪（位置仍在路径上，靠无敌躲）
  ok(S.player.invuln === D.inv, '闪避给 ' + D.inv + 's 无敌');
  S.player.y = 320; // 位置拉回路径上，单纯检验无敌
  run(F.lungeT);
  ok(S.player.hp === hp0 && S.dmgNums.some(n => n.txt === '闪避!') && S.enemies[0].lungeHit, '无敌中被前冲穿过 → 不扣血，显示「闪避!」');
  run(D.inv);
  ok(S.player.invuln === 0, '无敌时间结束归零');
  RB.end('lose'); await done;
  // 8e. 远距：弹道前摇 → 沿锁定方向发弹；不躲扣血，无敌穿过
  const freshShot = () => { const pr = RB.start([{ name: '远程怪', hp: 999, x: 300, y: 120, speed: 0, atkCd: 0 }], { timeLimit: 99 }); S.player.x = 300; S.player.y = 320; return pr; };
  done = freshShot(); RB.update(1 / 60);
  ok(S.enemies[0].windKind === 'shot' && RB.telegraphs()[0].kind === 'shot', '远距 → 弹道前摇 + 预警线');
  run(F.windShot + 0.02);
  ok(S.enemyProjectiles.length === 1 && S.enemyProjectiles[0].vy > 0 && Math.abs(S.enemyProjectiles[0].vx) < 1e-6, '前摇结束沿锁定方向发弹');
  hp0 = S.player.hp; run(1.2);
  ok(S.player.hp === hp0 - F.shotDmg, '弹道命中 -' + F.shotDmg);
  RB.end('lose'); await done;
  done = freshShot(); RB.update(1 / 60); run(F.windShot + 0.02); hp0 = S.player.hp;
  run(0.75); S.player.invuln = D.inv; run(0.3);
  ok(S.player.hp === hp0 && S.enemyProjectiles.length === 1 && S.enemyProjectiles[0].dodged, '无敌中弹道穿身而过（不扣血、不消失）');
  RB.end('lose'); await done;
  // 8f. 不再有贴身接触伤害（冷却中贴脸站着不掉血）
  done = RB.start([{ name: '贴脸怪', hp: 999, x: 300, y: 330, speed: 0, atkCd: 99 }], { timeLimit: 99 }); S.player.x = 300; S.player.y = 320; hp0 = S.player.hp;
  run(1.5);
  ok(S.player.hp === hp0, '冷却中贴脸不扣血（只有预警后的出手才伤人）');
  RB.end('lose'); await done;
  S.rand = Math.random;

  // 9. 只读接入 Game.stats()：血/攻来自存档，异常回退默认；不写回存档；敌人同比缩放
  const G9 = global.Game.G;
  const snap = () => JSON.stringify(global.Game.G);
  ok(RB.readPlayerStats().src === 'default' && RB.readPlayerStats().max === 180 && RB.readPlayerStats().atk === RB.ATK.dmg, '没有 Game.stats → 默认 180 血 / 28 攻');
  Object.assign(G9, { hp: 900, mp: 50, realm: 3 });
  global.Game.stats = () => ({ mhp: 1200.4, atk: 140.6, def: 30 });
  let before = snap();
  let st9 = RB.readPlayerStats();
  ok(st9.src === 'game' && st9.max === 1200 && st9.hp === 900 && st9.atk === 141, '读到存档：上限 1200 / 当前 900 / 攻 141（取整）');
  done = RB.start([{ name: '史莱姆', hp: 60, x: 300, y: 250, atkCd: 0 }], { timeLimit: 99 });
  S.rand = () => 0; S.player.x = 300; S.player.y = 320; S.player.faceX = 0; S.player.faceY = -1;
  ok(S.player.hp === 900 && S.player.max === 1200 && S.player.atk === 141 && S.statSrc === 'game', '原型主角血/攻 = 存档数值');
  const mul = 141 / RB.ATK.dmg;
  ok(S.enemies[0].maxHp === Math.round(60 * mul), '敌人血量按 攻/28 同比放大（' + S.enemies[0].maxHp + '）');
  S.enemies[0].atkCd = 99; S.enemies[0].state = 'chase';
  RB.attack();
  ok(S.enemies[0].hp === S.enemies[0].maxHp - 141 && S.dmgNums.some(n => n.txt === '141'), '普攻伤害 = 存档攻击 141，飘字 141');
  ok(Math.ceil(S.enemies[0].maxHp / 141) === Math.ceil(60 / RB.ATK.dmg), '砍死所需刀数与默认一致（节奏不随境界变）');
  S.enemies[0].atkCd = 0; S.enemies[0].x = 300; S.enemies[0].y = 260; S.player.attackCd = 9;
  let hp9 = S.player.hp; for (let t = 0; t < 1.0; t += 1 / 60) RB.update(1 / 60);
  ok(S.player.hp === hp9 - Math.round(RB.FOE.lungeDmg * 1200 / 180), '敌人前冲伤害按 上限/180 放大（-' + Math.round(RB.FOE.lungeDmg * 1200 / 180) + '）');
  S.player.hp = 1; RB.end('lose'); await done;
  ok(snap() === before && G9.hp === 900, '整场战斗不改存档（G 深比较不变，G.hp 仍 900）');
  // 显式 opts 优先于存档
  done = RB.start(null, { hp: 50, atk: 7, timeLimit: 99 });
  ok(S.player.max === 50 && S.player.atk === 7 && S.statSrc === 'opts', 'opts.hp/atk 覆盖存档');
  RB.end('lose'); await done;
  // 异常回退：抛错 / NaN / 0 / 负数 / 缺字段；当前血非法 → 满血
  for (const [nm, fn] of [['抛错', () => { throw new Error('x'); }], ['NaN', () => ({ mhp: NaN, atk: 10 })], ['0 攻', () => ({ mhp: 100, atk: 0 })],
    ['负血', () => ({ mhp: -5, atk: 10 })], ['缺字段', () => ({})], ['返回 null', () => null], ['字符串', () => ({ mhp: 'abc', atk: '12' })]]) {
    global.Game.stats = fn;
    const r9 = RB.readPlayerStats();
    ok(r9.src === 'default' && r9.max === 180 && r9.atk === RB.ATK.dmg, 'Game.stats ' + nm + ' → 回退默认');
  }
  global.Game.stats = () => ({ mhp: 300, atk: 40 });
  const badHp = [undefined, NaN, 0, -3, 'x'].filter(bad => { G9.hp = bad; return RB.readPlayerStats().hp !== 300; });
  ok(badHp.length === 0, '当前血非法（undefined/NaN/0/负/字符串）→ 满血');
  G9.hp = 9999; ok(RB.readPlayerStats().hp === 300, '当前血超过上限 → 钳到上限');
  const saveG = global.Game.G; global.Game.G = null; ok(RB.readPlayerStats().src === 'default', '没有存档 G → 默认'); global.Game.G = saveG;
  delete global.Game.stats; delete G9.hp; delete G9.mp; G9.realm = 0;
  S.rand = Math.random;

  // 9b. 真实页面里 Game/UI 是顶层 const（不在 window 上）：用 vm 模拟浏览器的全局词法绑定，确认仍能读到存档
  const vm = require('vm');
  const ctx9 = vm.createContext({ console });
  vm.runInContext("var window = globalThis; const Game = { G: { hp: 40 }, stats() { return { mhp: 100, atk: 10 }; }, playerSpr() { return 'player_f1'; } }; let toasts = 0; const UI = { toast() { toasts++; } };", ctx9);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'www', 'js', 'battle_realtime_prototype.js'), 'utf8'), ctx9);
  const r9b = vm.runInContext('const __r = window.RealtimeBattle.readPlayerStats(); window.RealtimeBattle.start(null, { timeLimit: 99 }); ({ r: __r, spr: window.RealtimeBattle.state.player.spr, toasts })', ctx9);
  ok(r9b.r.src === 'game' && r9b.r.max === 100 && r9b.r.hp === 40 && r9b.r.atk === 10, 'Game 为顶层 const（不在 window 上）时仍读到存档属性');
  ok(r9b.spr === 'player_f1' && r9b.toasts === 1, '同上：主角精灵取自 Game.playerSpr()，UI.toast 可用');
  ok(!/window\.(Game|UI)\b/.test(fs.readFileSync(path.join(ROOT, 'www', 'js', 'battle_realtime_prototype.js'), 'utf8')), '原型不再用 window.Game / window.UI（真实页面里它们是 undefined）');

  // 10. 灵根 × 武器技能（灵根表取自真实 data.js；存档只读）
  const vmD = require('vm'); const dctx = vmD.createContext({ window: {}, console });
  vmD.runInContext(fs.readFileSync(path.join(ROOT, 'www', 'js', 'data.js'), 'utf8'), dctx);
  global.LINGGEN = vmD.runInContext('LINGGEN', dctx);
  const G10 = global.Game.G;
  const setSave = (lg, ic) => { G10.lg = lg; G10.eqs = ic ? [{ uid: 'w1', slot: 'weapon', ic }] : []; G10.eq = ic ? { weapon: 'w1' } : {}; };
  const snap10 = () => JSON.stringify(G10);
  setSave('tian', 'sword_b'); let before10 = snap10();
  ok(RB.readSpiritRoot().els.join() === '金' && RB.readWeaponType() === 'sword', '读存档：天灵根=金、寒霜剑=剑');
  for (const [lg, ic, key, wt] of [['bing', 'fan', 'water', 'fan'], ['shuang', 'umbrella', 'wood', 'umbrella'], ['lei', null, 'bolt', 'none'], ['none', 'sword_w', 'bolt', 'sword'], ['bogus', null, 'bolt', 'none']]) {
    setSave(lg, ic); done = RB.start(null, { timeLimit: 99 });
    ok(S.player.skill.key === key && S.player.weapon === wt, `灵根 ${lg} + ${ic || '空手'} → ${key}/${wt}`);
    RB.end('lose'); await done;
  }
  const saveLG = global.LINGGEN; global.LINGGEN = undefined; ok(RB.readSpiritRoot().src === 'default' && RB.readSpiritRoot().els[0] === '无', '没有 LINGGEN → 回退无灵根'); global.LINGGEN = saveLG;
  G10.eq = { weapon: 'missing' }; ok(RB.readWeaponType() === 'none', '武器 uid 找不到 → 空手');
  G10.eqs = null; ok(RB.readWeaponType() === 'none', 'eqs 缺失 → 空手');
  // 三种（以上）形态各自生效
  const field = (els, weapon, foes) => { const pr = RB.start(foes, { els, weapon, timeLimit: 99, atk: 100, hp: 500, scale: false }); S.player.x = 300; S.player.y = 320; S.player.faceX = 0; S.player.faceY = -1; S.enemies.forEach(e => { e.atkCd = 99; }); return pr; };
  // 金：贯穿剑气，一发打穿两只
  done = field(['金'], 'none', [{ name: 'A', hp: 999, x: 300, y: 250, speed: 0 }, { name: 'B', hp: 999, x: 300, y: 180, speed: 0 }]);
  let cast = RB.skill();
  for (let t = 0; t < 0.6; t += 1 / 60) RB.update(1 / 60);
  ok(cast.key === 'metal' && S.enemies[0].hp === 999 - 90 && S.enemies[1].hp === 999 - 90, '金·剑气贯穿：前后两只各 -90（0.9×攻）');
  ok(S.player.skillCd > 0 && RB.skill() === null, '金：冷却中再按无效');
  RB.end('lose'); await done;
  // 火：锥形 + 灼烧；锥外不中
  done = field(['火'], 'none', [{ name: 'A', hp: 999, x: 300, y: 230, speed: 0 }, { name: 'B', hp: 999, x: 300, y: 420, speed: 0 }, { name: 'C', hp: 999, x: 420, y: 320, speed: 0 }]);
  cast = RB.skill();
  ok(cast.key === 'fire' && cast.hits === 1 && S.enemies[0].hp === 999 - 60 && S.enemies[1].hp === 999 && S.enemies[2].hp === 999, '火·锥形：只烧面前一只 -60，背后/侧面不中');
  ok(S.fx.some(f => f.kind === 'cone'), '火：画锥形火焰特效');
  for (let t = 0; t < 2.2; t += 1 / 60) RB.update(1 / 60);
  ok(S.enemies[0].hp === 999 - 60 - 30 && S.enemies[0].burnT <= 0, '火：灼烧 2s 共 -30（0.15×攻/s），之后停止');
  RB.end('lose'); await done;
  // 水：命中减速 50%，敌人追击变慢
  done = field(['水'], 'none', [{ name: 'A', hp: 999, x: 300, y: 260, speed: 100 }]);
  S.enemies[0].atkCd = 99; RB.skill();
  for (let t = 0; t < 0.25; t += 1 / 60) RB.update(1 / 60);
  ok(S.enemies[0].slowT > 0 && Math.abs(S.enemies[0].slowMul - 0.5) < 1e-9 && S.enemies[0].hp === 999 - 70, '水·灵珠命中：-70 + 减速 50%');
  S.enemies[0].x = 300; S.enemies[0].y = 120; let y0 = S.enemies[0].y; RB.update(0.5);
  ok(Math.abs((S.enemies[0].y - y0) - 100 * 0.5 * 0.5) < 1, '水：减速期间追击速度减半');
  for (let t = 0; t < 2.6; t += 1 / 60) RB.update(1 / 60);
  ok(S.enemies[0].slowMul === 1, '水：减速结束恢复');
  RB.end('lose'); await done;
  // 木：定身
  done = field(['木'], 'none', [{ name: 'A', hp: 999, x: 300, y: 260, speed: 100 }]);
  RB.skill(); for (let t = 0; t < 0.25; t += 1 / 60) RB.update(1 / 60);
  const ex = [S.enemies[0].x, S.enemies[0].y]; RB.update(0.3);
  ok(S.enemies[0].rootT > 0 && S.enemies[0].x === ex[0] && S.enemies[0].y === ex[1], '木·青藤：命中后定身不动');
  RB.end('lose'); await done;
  // 武器修正：剑伤害 ×1.15、扇范围 ×1.35、伞冷却 ×0.75
  const base = RB.skillFor('火', 'none'), sw = RB.skillFor('金', 'sword'), fa = RB.skillFor('火', 'fan'), um = RB.skillFor('水', 'umbrella');
  ok(Math.abs(sw.k - 0.9 * 1.15) < 1e-9 && Math.abs(sw.spd - 420 * 1.2) < 1e-9 && sw.n === '庚金剑气·剑', '剑：伤害 ×1.15、弹速 ×1.2，名「庚金剑气·剑」');
  ok(Math.abs(fa.range - base.range * 1.35) < 1e-9 && fa.arc > base.arc, '扇：火焰锥更远更宽');
  ok(Math.abs(um.cd - 1.8 * 0.75) < 1e-9, '伞：冷却 ×0.75');
  // 多灵根切换：双灵根 木→火
  done = field(['木', '火'], 'fan', [{ name: 'A', hp: 999, x: 300, y: 250, speed: 0 }]);
  ok(S.player.skill.key === 'wood', '双灵根默认主灵根 木');
  RB._key.down({ key: 'e', preventDefault() {} });
  ok(S.player.skill.key === 'fire' && S.player.skill.n === '焚天扇火·扇', 'E 键切到 火（焚天扇火·扇）');
  RB.cycleElement(); ok(S.player.skill.key === 'wood', '再切回 木');
  RB.end('lose'); await done;
  done = field(['金'], 'none', null); ok(RB.cycleElement() === S.player.skill && S.player.skill.key === 'metal', '单灵根切换无效');
  RB.end('lose'); await done;
  setSave('tian', 'sword_b'); before10 = snap10(); done = RB.start(null, { timeLimit: 99 }); RB.skill(); RB.update(0.1); RB.end('lose'); await done;
  ok(snap10() === before10, '灵根/武器只读：整场不改存档');
  delete G10.lg; delete G10.eqs; delete G10.eq; delete global.LINGGEN;

  // 6d. 追兵战：Stage3.bountyEnemies 产出的讨债鬼原样进场（方块皮肤字段 box 保留），顶栏标题显示债压档位；整场不存档
  {
    const S3 = require(path.join(ROOT, 'www', 'js', 'stage3_encounter_draft.js'));
    const foes = S3.bountyEnemies({ debt: 30000 });
    const texts = []; const tctx = new Proxy({}, { get: (t, k) => (k === 'fillText' ? (s) => texts.push(String(s)) : (k in t ? t[k] : () => {})), set: (t, k, v) => { t[k] = v; return true; } });
    done = RB.start(foes, { timeLimit: 99, atk: 28, hp: 180, label: '追兵·天道通缉' });
    ok(S.enemies.length === 4 && S.enemies.every(e => e.spr === 'mon_collector' && e.box === 'taozhai'), '追兵战：4 个讨债鬼进场，精灵 mon_collector、box 字段保留');
    ok(S.enemies[0].name === '讨债鬼头子' && S.enemies[0].maxHp === 116, '追兵战：头子血量 116（80×1.45，攻 28 不缩放）');
    RB.draw(tctx);
    ok(texts.some(t => t.startsWith('追兵·天道通缉 ')), '顶栏标题显示「追兵·天道通缉」');
    RB.end('lose'); await done;
    done = RB.start(null, { timeLimit: 99 }); RB.draw(tctx);
    ok(S.label === '即时战(原型)' && S.enemies[0].box === null, '不传 label/box 时回退默认标题、box 为空');
    RB.end('lose'); await done;
    done = RB.start(null, { timeLimit: 99, label: 'x'.repeat(40) }); ok(S.label.length === 16, '标题截到 16 字，不撑破顶栏'); RB.end('lose'); await done;
  }

  // 8. 结束原因（追兵战结算用）：被打倒 = dead；外部 end 不带原因按结果回退；重开清空原因
  {
    let d8 = RB.start(null, { timeLimit: 99 }); S.player.hp = 0; RB.update(0.016);
    const r8 = await d8; ok(r8.result === 'lose' && r8.reason === 'dead', '主角倒下 → lose / dead');
    d8 = RB.start(null, { timeLimit: 99 }); ok(S.endReason === null, '重开一场清空上一场的结束原因');
    RB.end('lose', 'closed'); ok((await d8).reason === 'closed', '中途关闭 → reason closed（宿主不结算）');
    d8 = RB.start(null, { timeLimit: 99 }); RB.end('win'); ok((await d8).reason === 'cleared', 'end(win) 不带原因 → cleared');
    d8 = RB.start(null, { timeLimit: 99 }); RB.end('lose'); ok((await d8).reason === 'dead', 'end(lose) 不带原因 → dead');
    const srcP = fs.readFileSync(path.join(ROOT, 'www', 'js', 'battle_realtime_prototype.js'), 'utf8');
    ok(/endRealtime\('lose', 'closed'\)/.test(srcP) && /closed: closedP/.test(srcP), '覆盖层关闭走 closed 原因，句柄带 closed Promise');
  }

  // 7. index.html 加载顺序不变：原型在 engine.js 之后（能用 drawSprite），dev_entry 之前
  const html = fs.readFileSync(path.join(ROOT, 'www', 'index.html'), 'utf8');
  const iE = html.indexOf('js/engine.js'), iP = html.indexOf('js/battle_realtime_prototype.js'), iD = html.indexOf('js/dev_entry_v25.js');
  ok(iE > 0 && iP > iE && iD > iP, 'index.html：engine → 原型 → 开发者入口');

  console.log(fails ? `FAILED ${fails}` : 'ALL PASS');
  process.exit(fails);
})().catch(e => { console.error(e); process.exit(99); });

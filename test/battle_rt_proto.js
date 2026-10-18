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
  let prevented = false; RB._key.down({ key: ' ', preventDefault() { prevented = true; } });
  ok(!prevented && S.keys.size === 0, '原型关闭后键盘不拦截（不影响正式游戏）');

  // 6. 超时 → lose；无图集时回退圆形不崩
  done = RB.start(null, { timeLimit: 1 });
  S.enemies[0].skillCd = 99;
  for (let i = 0; i < 80; i++) RB.update(0.016);
  ok((await done).result === 'lose', '超时保底 → lose');
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
  RB.end('lose'); await done; delete window.LowpolyBox;

  // 7. index.html 加载顺序不变：原型在 engine.js 之后（能用 drawSprite），dev_entry 之前
  const html = fs.readFileSync(path.join(ROOT, 'www', 'index.html'), 'utf8');
  const iE = html.indexOf('js/engine.js'), iP = html.indexOf('js/battle_realtime_prototype.js'), iD = html.indexOf('js/dev_entry_v25.js');
  ok(iE > 0 && iP > iE && iD > iP, 'index.html：engine → 原型 → 开发者入口');

  console.log(fails ? `FAILED ${fails}` : 'ALL PASS');
  process.exit(fails);
})().catch(e => { console.error(e); process.exit(99); });

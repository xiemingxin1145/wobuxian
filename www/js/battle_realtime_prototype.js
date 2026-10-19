'use strict';
// ======================= 即时遭遇战原型（v2.5 实验 / 开放世界线） =======================
// 目标：验证「直接操控移动 + 普攻 + 技能 + 闪避」的手感，正式小怪战已由 rt27.js 承担，本文件只做沙盒实验。
// 隔离：不包 Game.fight、不改存档、不进正式遭遇链；只有开发者入口（#dev / 连点版本号 → 「即时战」按钮）
//       调 RealtimeBattle.open() 才会打开自带覆盖层画布；键盘监听只在 RT.on 时生效。
// 2026-10-19：接入游戏现有角色精灵（engine.js drawSprite / loadSprite，主角用 Game.playerSpr()，敌人默认 mon_slime），
//             普攻改为面向扇形命中判定 + 伤害飘字 + 受击闪白，自带 rAF 循环与触屏摇杆/按钮。
// 2026-10-19 第二轮：敌人改为「前摇预警（锁方向、红色预警区+闪烁）→ 近距前冲 / 远距弹道」，取消贴身接触伤害；
//             玩家闪避给 0.3s 无敌（闪烁），无敌中前冲/弹道免伤并提示「闪避!」。
//             主角血/攻只读取自 Game.stats()（+G.hp），异常回退 180/28；敌人血量/伤害同比缩放。
// 2026-10-19 第四轮：技能按「灵根 × 武器」变形：火=锥形灼烧、水/冰=减速水珠、金=贯穿剑气、木=定身藤、其他=灵弹；
//             剑/扇/伞分别加伤害弹速/范围/冷却修正；多灵根 E 键或「换」按钮切元素。灵根/武器只读，缺失回退。
// 2026-10-19 第七轮（债务强化 #4）：敌人配置可带 atkCdMul（出手后冷却倍率）/ windMul（前摇倍率）/ shotCount + shotSpread（一次几发、
//             相邻夹角°，扇形散射），追兵战按债压档位填；缺字段或非法值一律回退中性值 = 旧行为（数值逐帧一致）。
// 2026-10-19 第八轮（债务强化 #5）：敌人配置可带 ringShots（环形弹发数）/ ringWarn（收招预警秒）/ ringCd（两次环弹最短间隔秒）：
//             前冲收招后原地画预警圈，到点以自身为中心放一圈等角环形弹（追兵战只给天道通缉档头子）；缺字段 / 非法值 = 不放环弹（旧行为，逐帧一致）。
(function () {
  const W0 = 600, H0 = 520; // 逻辑战场尺寸
  const BOUND = { x0: 40, x1: 560, y0: 60, y1: 480 };
  const ATK = { range: 90, arc: Math.PI / 3, close: 30, dmg: 28, cd: 0.45, swing: 0.25 }; // arc = 半角 60°
  // 敌人出手：先前摇预警（锁定方向，画红色预警区并闪烁），再前冲（近）或发弹（远）；玩家闪避有短暂无敌可躲
  const FOE = {
    lungeRange: 110, shotRange: 300, stop: 50,
    windLunge: 0.6, windShot: 0.45, // 前摇秒数
    lungeT: 0.18, lungeSpd: 520, hitR: 30, lungeDmg: 15,
    shotSpd: 200, shotDmg: 12, shotR: 18,
    cdMin: 1.4, cdVar: 0.8,
  };
  const DODGE = { cd: 1.2, dist: 90, inv: 0.3 };
  // 敌人行为参数（债务强化 #4）：缺字段 / 非数字 / 越界 → 中性值（与旧行为完全一致）；合法值钳到安全范围
  const FOE_TRAIT = { mulMin: 0.3, mulMax: 2, shotMax: 5, spreadMax: 30 };
  function foeTrait(e) {
    const num = v => (typeof v === 'number' && isFinite(v) ? v : null);
    const mul = v => { const n = num(v); return n !== null && n > 0 ? Math.max(FOE_TRAIT.mulMin, Math.min(FOE_TRAIT.mulMax, n)) : 1; };
    const sc = num(e && e.shotCount), sp = num(e && e.shotSpread);
    return {
      atkCdMul: mul(e && e.atkCdMul),
      windMul: mul(e && e.windMul),
      shotCount: sc !== null && sc >= 1 ? Math.min(FOE_TRAIT.shotMax, Math.floor(sc)) : 1,
      shotSpread: sp !== null && sp > 0 ? Math.min(FOE_TRAIT.spreadMax, sp) : 0,
    };
  }
  // 头子专属招式「回身环弹」（债务强化 #5）：ringShots 不是数字或 < 3 → 0（不放，旧行为）；合法值取整钳到 3–16。
  //   ringWarn 非法 → 默认 0.4s，合法钳 0.15–1s；ringCd 非法 → 默认 3s，合法钳 0–10s（0 = 每次前冲都放）。
  const RING = { min: 3, max: 16, warnDef: 0.4, warnMin: 0.15, warnMax: 1, cdDef: 3, cdMax: 10, spd: 170, dmg: 10, r0: 18, r1: 70 };
  function foeRing(e) {
    const num = v => (typeof v === 'number' && isFinite(v) ? v : null);
    const n = num(e && e.ringShots), w = num(e && e.ringWarn), c = num(e && e.ringCd);
    const shots = n !== null && n >= RING.min ? Math.min(RING.max, Math.floor(n)) : 0;
    return {
      ringShots: shots,
      ringWarn: w !== null && w > 0 ? Math.max(RING.warnMin, Math.min(RING.warnMax, w)) : RING.warnDef,
      ringCd: c !== null && c >= 0 ? Math.min(RING.cdMax, c) : RING.cdDef,
    };
  }
  // 灵根技能：主灵根元素决定形态（多灵根可按 E / 「换」切换），武器类型给修正。k = 伤害系数（×攻击）
  const SKILL = {
    fire: { n: '焚天扇火', el: '火', cd: 2.0, k: 0.6, range: 120, arc: Math.PI * 35 / 180, burnT: 2.0, burnK: 0.15, c: '#ff6a3a' }, // 面前锥形灼烧 + 持续掉血
    water: { n: '缚水灵珠', el: '水', cd: 1.8, k: 0.7, spd: 220, r: 12, life: 2.0, slowT: 2.5, slow: 0.5, c: '#4aa8ff' },       // 慢速水珠，命中减速
    metal: { n: '庚金剑气', el: '金', cd: 1.6, k: 0.9, spd: 420, r: 8, life: 1.4, pierce: true, c: '#ffd25e' },                  // 高速剑气，贯穿所有敌人
    wood: { n: '青藤缠缚', el: '木', cd: 2.2, k: 0.5, spd: 260, r: 10, life: 1.8, rootT: 1.0, c: '#5adf6a' },                    // 命中定身
    bolt: { n: '灵弹', el: '无', cd: 1.6, k: 22 / 28, spd: 320, r: 6, life: 1.8, c: '#ffd27b' },                                   // 无灵根 / 土 / 雷：保底灵弹
  };
  const EL2SKILL = { 火: 'fire', 水: 'water', 冰: 'water', 金: 'metal', 木: 'wood' };
  // 武器修正：剑 伤害 ×1.15、剑气/弹速 ×1.2；扇 范围/弹体 ×1.35；伞 冷却 ×0.75；空手不修正
  const WEAPON = {
    sword: { n: '剑', dmg: 1.15, spd: 1.2, area: 1, cd: 1 },
    fan: { n: '扇', dmg: 1, spd: 1, area: 1.35, cd: 1 },
    umbrella: { n: '伞', dmg: 1, spd: 1, area: 1, cd: 0.75 },
    none: { n: '空手', dmg: 1, spd: 1, area: 1, cd: 1 },
  };

  const RT = {
    fx: [], // 技能特效（锥形火焰等）
    on: false,
    player: null,
    enemies: [],
    projectiles: [],
    enemyProjectiles: [],
    dmgNums: [], // 伤害飘字 {x,y,txt,c,life,max}
    time: 0,
    timeLimit: 20,
    result: null,
    endReason: null,
    keys: new Set(),
    stick: { x: 0, y: 0 }, // 触屏摇杆方向（-1..1）
    rand: Math.random, // 测试可替换
  };

  // game.js / ui.js 用顶层 `const Game` / `const UI` 声明 → 是全局词法绑定，**不挂在 window 上**；必须用 typeof 取
  const gameObj = () => (typeof Game !== 'undefined' && Game ? Game : null);
  const toast = (...a) => { try { if (typeof UI !== 'undefined' && UI && UI.toast) UI.toast(...a); } catch (e) { /* 原型：无 UI 时静默 */ } };

  // ---------- 精灵（复用游戏现有角色图集，缺失时回退圆形） ----------
  const hasSprites = () => typeof drawSprite === 'function' && typeof window !== 'undefined' && window.ASSETS && window.ASSETS.sprites;
  const sprOk = id => !!(hasSprites() && window.ASSETS.sprites[id]);
  function playerSprId() {
    try { const g = gameObj(); if (g && g.G && typeof g.playerSpr === 'function') return g.playerSpr(); } catch (e) { /* 原型：无存档时回退 */ }
    return 'player_m0';
  }
  // 屏幕面向 → 精灵八方向（S=朝下，E=朝右；与 engine.js DIRT 的屏幕投影一致）
  const SDIR = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
  function screenDir(fx, fy) {
    if (!fx && !fy) return 'S';
    const a = Math.atan2(fy, fx);
    return SDIR[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8];
  }
  function preload(ids) {
    if (typeof loadSprite !== 'function') return Promise.resolve();
    return Promise.all(ids.filter(sprOk).map(id => loadSprite(id))).catch(() => {});
  }

  // 只读读取主角真实属性：Game.stats() 的 mhp/atk + Game.G.hp（当前血）。任何缺失/异常/非正数 → 回退默认值。
  // 只复制数字，不写回 G、不调用任何会改状态的函数；战斗结束也不把血量写回存档。
  const BASE = { hp: 180, atk: ATK.dmg };
  function readPlayerStats() {
    const def = { hp: BASE.hp, max: BASE.hp, atk: BASE.atk, src: 'default' };
    try {
      const g = gameObj();
      if (!g || !g.G || typeof g.stats !== 'function') return def;
      const st = g.stats();
      const mhp = Number(st && st.mhp), atk = Number(st && st.atk);
      if (!isFinite(mhp) || !isFinite(atk) || mhp <= 0 || atk <= 0) return def;
      const max = Math.max(1, Math.round(mhp));
      const cur = Number(g.G.hp);
      const hp = isFinite(cur) && cur > 0 ? Math.min(max, Math.round(cur)) : max;
      return { hp, max, atk: Math.max(1, Math.round(atk)), src: 'game' };
    } catch (e) { return def; }
  }

  // 只读：灵根元素列表（Game.G.lg → LINGGEN[].el），缺失 → ['无']
  function readSpiritRoot() {
    try {
      const g = gameObj();
      const LG = typeof LINGGEN !== 'undefined' ? LINGGEN : null;
      if (!g || !g.G || !LG) return { id: null, n: '无', els: ['无'], src: 'default' };
      const l = LG.find(x => x.id === g.G.lg);
      if (!l || !Array.isArray(l.el) || !l.el.length) return { id: l ? l.id : null, n: l ? l.n : '无', els: ['无'], src: l ? 'game' : 'default' };
      return { id: l.id, n: l.n, els: l.el.slice(), src: 'game' };
    } catch (e) { return { id: null, n: '无', els: ['无'], src: 'default' }; }
  }
  // 只读：当前装备武器图标 → 剑 / 扇 / 伞 / 空手
  function readWeaponType() {
    try {
      const g = gameObj(); const G = g && g.G;
      const uid = G && G.eq && G.eq.weapon;
      const w = uid && Array.isArray(G.eqs) ? G.eqs.find(x => x && x.uid === uid) : null;
      const ic = (w && w.ic) || '';
      return ic.startsWith('sword') ? 'sword' : ic === 'fan' ? 'fan' : ic === 'umbrella' ? 'umbrella' : 'none';
    } catch (e) { return 'none'; }
  }
  function skillFor(el, weapon) {
    const key = EL2SKILL[el] || 'bolt';
    const S = SKILL[key], W = WEAPON[weapon] || WEAPON.none;
    return { key, el, weapon: W === WEAPON.none ? 'none' : weapon, n: S.n + (W !== WEAPON.none ? '·' + W.n : ''), cd: S.cd * W.cd, k: S.k * W.dmg,
      spd: (S.spd || 0) * W.spd, r: (S.r || 0) * W.area, range: (S.range || 0) * W.area, arc: (S.arc || 0) * (W.area > 1 ? 1.2 : 1), base: S };
  }
  function cycleElement() {
    if (!RT.player) return null;
    const p = RT.player;
    if (p.els.length < 2) return p.skill;
    p.elIdx = (p.elIdx + 1) % p.els.length;
    p.skill = skillFor(p.els[p.elIdx], p.weapon);
    addDmg(p.x, p.y - 100, '切换：' + p.skill.n, p.skill.base.c);
    return p.skill;
  }

  function addDmg(x, y, txt, c) { RT.dmgNums.push({ x, y, txt: String(txt), c: c || '#fff2a8', life: 0.8, max: 0.8 }); }

  function startRealtimeEncounter(enemies, opts) {
    opts = opts || {};
    RT.on = true;
    RT.time = 0;
    RT.timeLimit = opts.timeLimit || 20;
    RT.boxPlayer = opts.boxPlayer || null; // 方块皮肤下主角用哪个方块人（jianxiu / nvzhu / jianxian）
    RT.skin = opts.skin || 'sprite'; // 'sprite' = 游戏现有精灵；'box' = 方块低模（需页面已加载 LowpolyBox）
    RT.label = opts.label ? String(opts.label).slice(0, 16) : '即时战(原型)'; // 顶栏标题（追兵战显示债压档位）
    RT.result = null;
    RT.endReason = null;
    RT.keys.clear();
    RT.stick = { x: 0, y: 0 };
    RT.projectiles = [];
    RT.enemyProjectiles = [];
    RT.dmgNums = [];
    RT.fx = [];
    RT.foeVolleys = 0; RT.foeShots = 0; // 敌人弹道齐射次数 / 弹丸总数（测试与调试用）
    RT.foeRings = 0; RT.foeRingShots = 0; // 头子环形弹次数 / 环形弹丸总数（单独计数，不混进上面的齐射统计）
    // 主角属性：opts 覆盖 > 存档只读 > 默认；敌人血量/伤害按同比缩放，保证「几刀砍死、几下被打死」的节奏不随境界变
    const ps = readPlayerStats();
    const sr = opts.els ? { els: opts.els.slice(), src: 'opts' } : readSpiritRoot();
    const wt = opts.weapon || readWeaponType();
    const pMax = opts.hp > 0 ? Math.round(opts.hp) : ps.max;
    const pHp = opts.hp > 0 ? pMax : ps.hp;
    const pAtk = opts.atk > 0 ? Math.round(opts.atk) : ps.atk;
    const scale = opts.scale !== false;
    const hpMul = scale ? pAtk / BASE.atk : 1, dmgMul = scale ? pMax / BASE.hp : 1;
    RT.statSrc = opts.hp > 0 || opts.atk > 0 ? 'opts' : ps.src;
    RT.enemies = (enemies || [{ name: '山魇', hp: 80, maxHp: 80, x: 420, y: 180, speed: 70 }]).map(e => ({
      name: e.name || '山魇',
      spr: e.spr || 'mon_slime',
      box: e.box || null, // 方块皮肤下用哪个方块人（缺省 taozhai）
      hp: Math.max(1, Math.round((e.hp != null ? e.hp : 80) * hpMul)),
      maxHp: Math.max(1, Math.round((e.maxHp != null ? e.maxHp : (e.hp || 80)) * hpMul)),
      dmgMul,
      x: e.x != null ? e.x : 420,
      y: e.y != null ? e.y : 180,
      speed: e.speed != null ? e.speed : 70,
      state: 'chase', wind: 0, windKind: null, aimX: 0, aimY: 1, lunge: 0, lungeHit: false,
      atkCd: e.atkCd != null ? e.atkCd : (e.skillCd != null ? e.skillCd : 0.8 + RT.rand() * 1.2),
      ...foeTrait(e), attacks: 0, windMax: 0, // 档位行为参数（缺省 = 旧行为）；attacks = 已起手次数
      ...foeRing(e), ringT: 0, ringReady: 0, rings: 0, // 头子环弹参数（ringShots 0 = 不放）；ringT 预警剩余、ringReady 冷却剩余
      slowT: 0, slowMul: 1, burnT: 0, burnDps: 0, burnAcc: 0, rootT: 0,
      flash: 0, at: 0, moving: false,
    }));
    RT.player = {
      spr: opts.spr || playerSprId(),
      hp: pHp,
      max: pMax,
      x: 300,
      y: 320,
      speed: 210,
      atk: pAtk,
      els: sr.els, elIdx: 0, weapon: wt, skill: skillFor(sr.els[0], wt),
      attackCd: 0,
      swing: 0,
      dashCd: 0,
      invuln: 0,
      skillCd: 0,
      faceX: 0,
      faceY: -1,
      flash: 0, at: 0, moving: false,
    };
    RT.ready = preload([RT.player.spr, ...RT.enemies.map(e => e.spr)]);
    toast('进入即时遭遇战（原型）', '#ffe680');
    return new Promise(resolve => {
      RT._resolve = resolve;
    });
  }

  function clamp(p) {
    p.x = Math.max(BOUND.x0, Math.min(BOUND.x1, p.x));
    p.y = Math.max(BOUND.y0, Math.min(BOUND.y1, p.y));
  }

  function updateRealtime(dt) {
    if (!RT.on || !RT.player) return;
    RT.time += dt;
    const p = RT.player;
    p.attackCd = Math.max(0, p.attackCd - dt);
    p.swing = Math.max(0, p.swing - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.skillCd = Math.max(0, p.skillCd - dt);
    p.flash = Math.max(0, p.flash - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.at += dt;

    // 移动：WASD / 方向键 / 触屏摇杆
    let kx = RT.stick.x, ky = RT.stick.y;
    if (RT.keys.has('w') || RT.keys.has('arrowup')) ky -= 1;
    if (RT.keys.has('s') || RT.keys.has('arrowdown')) ky += 1;
    if (RT.keys.has('a') || RT.keys.has('arrowleft')) kx -= 1;
    if (RT.keys.has('d') || RT.keys.has('arrowright')) kx += 1;
    const len = Math.hypot(kx, ky);
    p.moving = len > 0.05;
    if (p.moving) {
      kx /= len; ky /= len;
      p.x += kx * p.speed * dt;
      p.y += ky * p.speed * dt;
      p.faceX = kx; p.faceY = ky;
    }
    clamp(p);

    // 敌人 AI：追击 → 前摇预警（锁方向）→ 前冲 / 发弹 → 冷却；不再有贴身接触伤害
    for (const e of RT.enemies) {
      e.flash = Math.max(0, e.flash - dt);
      e.at += dt;
      if (e.hp <= 0) continue;
      // 灵根技能状态：灼烧每 0.5s 结算一次、减速、定身
      if (e.burnT > 0) {
        const t = Math.min(dt, e.burnT); e.burnT -= dt; e.burnAcc += t; // burnAcc = 已烧秒数；按累计应扣 - 已扣 结算，避免取整误差
        if (Math.floor(e.burnAcc / 0.5 + 1e-9) > Math.floor((e.burnAcc - t) / 0.5 + 1e-9) || e.burnT <= 0) {
          const n = Math.round(e.burnDps * e.burnAcc) - (e.burnDone || 0);
          if (n > 0) { e.burnDone = (e.burnDone || 0) + n; e.hp = Math.max(0, e.hp - n); addDmg(e.x, e.y - 70, '灼' + n, '#ff8a4a'); if (e.hp <= 0) continue; }
        }
      }
      e.slowT = Math.max(0, e.slowT - dt); if (e.slowT <= 0) e.slowMul = 1;
      e.rootT = Math.max(0, e.rootT - dt);
      if (e.ringShots > 0) e.ringReady = Math.max(0, e.ringReady - dt); // 只有带环弹的头子走这里
      const dx = p.x - e.x, dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      e.moving = false;
      if (e.state === 'ring') { // 头子收招预警：原地不动，预警圈缩满后放一圈环形弹；出手冷却照常倒数（环弹是额外招式，不拖慢原节奏）
        e.ringT -= dt; e.atkCd = Math.max(0, e.atkCd - dt);
        if (e.ringT <= 0) { fireRing(e); e.state = 'chase'; e.ringReady = e.ringCd; }
        continue;
      }
      if (e.state === 'windup') {
        e.wind -= dt;
        if (e.wind <= 0) {
          if (e.windKind === 'lunge') { e.state = 'lunge'; e.lunge = FOE.lungeT; e.lungeHit = false; }
          else {
            // shotCount 发以锁定方向为中心对称散开（相邻 shotSpread°）；1 发时与旧行为完全一致
            const n = e.shotCount || 1, step = (e.shotSpread || 0) * Math.PI / 180, a0 = Math.atan2(e.aimY, e.aimX);
            for (let i = 0; i < n; i++) {
              const off = (i - (n - 1) / 2) * step;
              const ax = n === 1 ? e.aimX : Math.cos(a0 + off), ay = n === 1 ? e.aimY : Math.sin(a0 + off);
              RT.enemyProjectiles.push({ x: e.x + ax * 16, y: e.y + ay * 16, vx: ax * FOE.shotSpd, vy: ay * FOE.shotSpd, life: 2.0, dmg: Math.max(1, Math.round(FOE.shotDmg * e.dmgMul)), dodged: false });
            }
            RT.foeVolleys++; RT.foeShots += n;
            e.state = 'chase'; e.atkCd = (FOE.cdMin + RT.rand() * FOE.cdVar) * e.atkCdMul;
          }
        }
        continue;
      }
      if (e.state === 'lunge') {
        const step = Math.min(e.lunge, dt);
        e.x += e.aimX * FOE.lungeSpd * step; e.y += e.aimY * FOE.lungeSpd * step; clamp(e);
        e.lunge -= dt; e.moving = true;
        if (!e.lungeHit && Math.hypot(p.x - e.x, p.y - e.y) < FOE.hitR) { e.lungeHit = true; damagePlayer(Math.max(1, Math.round(FOE.lungeDmg * e.dmgMul))); }
        if (e.lunge <= 0) {
          e.state = 'chase'; e.atkCd = (FOE.cdMin + RT.rand() * FOE.cdVar) * e.atkCdMul;
          if (e.ringShots > 0 && e.ringReady <= 0) { e.state = 'ring'; e.ringT = e.ringWarn; } // 头子：前冲收招接环弹
        }
        continue;
      }
      // chase
      e.atkCd = Math.max(0, e.atkCd - dt);
      e.faceX = dx / d; e.faceY = dy / d;
      if (d > FOE.stop && e.rootT <= 0) {
        e.moving = true;
        e.x += (dx / d) * e.speed * e.slowMul * dt;
        e.y += (dy / d) * e.speed * e.slowMul * dt;
      }
      if (e.atkCd <= 0 && d < FOE.shotRange) {
        e.state = 'windup';
        e.windKind = d < FOE.lungeRange ? 'lunge' : 'shot';
        e.wind = (e.windKind === 'lunge' ? FOE.windLunge : FOE.windShot) * e.windMul; // 高档追兵前摇更短
        e.windMax = e.wind; e.attacks++;
        e.aimX = dx / d; e.aimY = dy / d; // 前摇开始即锁定方向 → 横移/闪避可躲
      }
    }

    // 玩家弹道
    for (const proj of RT.projectiles) {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;
      if (proj.life <= 0) continue;
      for (const e of RT.enemies) {
        if (e.hp <= 0 || (proj.hit && proj.hit.has(e))) continue;
        if (Math.hypot(e.x - proj.x, e.y - proj.y) < 16 + (proj.r || 6)) {
          hitEnemy(e, proj.dmg || Math.max(1, Math.round(p.atk * 22 / ATK.dmg)), proj.pierce ? 4 : 8);
          if (proj.slowT) { e.slowT = proj.slowT; e.slowMul = 1 - proj.slow; addDmg(e.x, e.y - 90, '减速', '#9ad0ff'); }
          if (proj.rootT) { e.rootT = proj.rootT; addDmg(e.x, e.y - 90, '定身', '#9aff9a'); }
          if (proj.pierce) { proj.hit = proj.hit || new Set(); proj.hit.add(e); continue; } // 贯穿：继续飞
          proj.life = 0;
          break;
        }
      }
    }
    RT.projectiles = RT.projectiles.filter(pr => pr.life > 0 && pr.x > 0 && pr.x < W0 && pr.y > 0 && pr.y < H0);

    // 敌人弹道
    for (const proj of RT.enemyProjectiles) {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;
      if (proj.life <= 0) continue;
      if (!proj.dodged && Math.hypot(p.x - proj.x, p.y - proj.y) < FOE.shotR) {
        if (damagePlayer(proj.dmg || FOE.shotDmg)) proj.life = 0;
        else proj.dodged = true; // 无敌中：穿身而过，只提示一次
      }
    }
    RT.enemyProjectiles = RT.enemyProjectiles.filter(pr => pr.life > 0 && pr.x > 0 && pr.x < W0 && pr.y > 0 && pr.y < H0);

    for (const f of RT.fx) f.life -= dt;
    RT.fx = RT.fx.filter(f => f.life > 0);
    // 飘字上浮衰减
    for (const n of RT.dmgNums) { n.life -= dt; n.y -= 40 * dt; }
    RT.dmgNums = RT.dmgNums.filter(n => n.life > 0);

    // 结束条件
    if (p.hp <= 0) endRealtime('lose', 'dead');
    else if (RT.enemies.every(e => e.hp <= 0)) endRealtime('win', 'cleared');
    else if (RT.time > RT.timeLimit) endRealtime('lose', 'timeout'); // 超时保底，避免卡死
  }

  // 环形弹：以敌人为中心 ringShots 发等角散开，第一发沿前冲方向；弹速/伤害取 RING（伤害随 dmgMul 缩放）
  function fireRing(e) {
    const n = e.ringShots, a0 = Math.atan2(e.aimY, e.aimX);
    for (let i = 0; i < n; i++) {
      const a = a0 + i * 2 * Math.PI / n, ax = Math.cos(a), ay = Math.sin(a);
      RT.enemyProjectiles.push({ x: e.x + ax * 16, y: e.y + ay * 16, vx: ax * RING.spd, vy: ay * RING.spd, life: 2.0, dmg: Math.max(1, Math.round(RING.dmg * e.dmgMul)), dodged: false, ring: true });
    }
    e.rings++; RT.foeRings++; RT.foeRingShots += n;
  }
  // 头子环弹预警（绘制与测试共用）：k 0→1 预警圈从外向内收紧
  function ringTelegraphs() {
    return RT.enemies.filter(e => e.hp > 0 && e.state === 'ring').map(e => ({
      enemy: e, x: e.x, y: e.y, count: e.ringShots, aimX: e.aimX, aimY: e.aimY,
      k: 1 - e.ringT / (e.ringWarn || RING.warnDef), r: RING.r1 - (RING.r1 - RING.r0) * (1 - e.ringT / (e.ringWarn || RING.warnDef)),
    }));
  }

  // 玩家受击：闪避无敌中免伤并提示「闪避!」。返回是否真的扣血
  function damagePlayer(dmg) {
    const p = RT.player;
    if (p.invuln > 0) { addDmg(p.x, p.y - 80, '闪避!', '#9affff'); return false; }
    p.hp = Math.max(0, p.hp - dmg);
    p.flash = 0.15;
    addDmg(p.x, p.y - 80, '-' + dmg, '#ff7a6a');
    return true;
  }

  // 当前生效的前摇预警（绘制与测试共用）
  function telegraphs() {
    return RT.enemies.filter(e => e.hp > 0 && e.state === 'windup').map(e => ({
      enemy: e, kind: e.windKind, x: e.x, y: e.y, aimX: e.aimX, aimY: e.aimY,
      len: e.windKind === 'lunge' ? FOE.lungeSpd * FOE.lungeT + FOE.hitR : 260,
      width: e.windKind === 'lunge' ? FOE.hitR * 2 : FOE.shotR * 2,
      k: 1 - e.wind / (e.windMax || (e.windKind === 'lunge' ? FOE.windLunge : FOE.windShot)), // 0→1 越来越满
      count: e.windKind === 'shot' ? (e.shotCount || 1) : 1, spread: e.windKind === 'shot' ? (e.shotSpread || 0) : 0, // 散射：几条预警线、夹角°
    }));
  }

  function hitEnemy(e, dmg, knock) {
    const p = RT.player;
    e.hp = Math.max(0, e.hp - dmg);
    e.flash = 0.12;
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
    e.x += (dx / d) * knock;
    e.y += (dy / d) * knock;
    clamp(e);
    addDmg(e.x, e.y - 70, dmg, '#fff2a8');
  }

  // 普攻命中判定：面向 ±60° 扇形、半径 90；贴身 30 内不论方向都算中。返回命中的敌人列表。
  function inAttackArc(p, e) {
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
    if (d > ATK.range) return false;
    if (d <= ATK.close) return true;
    const fl = Math.hypot(p.faceX, p.faceY) || 1;
    const cos = (dx * p.faceX + dy * p.faceY) / (d * fl);
    return cos >= Math.cos(ATK.arc);
  }
  function playerAttack() {
    if (!RT.on || !RT.player || RT.player.attackCd > 0) return [];
    const p = RT.player;
    p.attackCd = ATK.cd;
    p.swing = ATK.swing;
    const hits = RT.enemies.filter(e => e.hp > 0 && inAttackArc(p, e));
    for (const e of hits) hitEnemy(e, p.atk, 12);
    if (!hits.length) addDmg(p.x + p.faceX * 40, p.y + p.faceY * 40 - 40, '落空', '#b8c4d8');
    return hits;
  }

  // 灵根 × 武器技能。返回本次施放信息（测试用）
  function playerSkill() {
    if (!RT.on || !RT.player || RT.player.skillCd > 0) return null;
    const p = RT.player, sk = p.skill || skillFor('无', 'none'), B = sk.base;
    p.skillCd = sk.cd;
    const dmg = Math.max(1, Math.round(p.atk * sk.k));
    const fl = Math.hypot(p.faceX, p.faceY) || 1, fx = p.faceX / fl, fy = p.faceY / fl;
    if (sk.key === 'fire') { // 锥形：立即判定
      const hits = RT.enemies.filter(e => {
        if (e.hp <= 0) return false;
        const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
        return d <= sk.range && (d < 20 || (dx * fx + dy * fy) / d >= Math.cos(sk.arc));
      });
      for (const e of hits) { hitEnemy(e, dmg, 6); e.burnT = B.burnT; e.burnDps = Math.max(1, p.atk * B.burnK * (sk.weapon === 'sword' ? WEAPON.sword.dmg : 1)); e.burnAcc = 0; e.burnDone = 0; }
      RT.fx.push({ kind: 'cone', x: p.x, y: p.y, ang: Math.atan2(fy, fx), range: sk.range, arc: sk.arc, c: B.c, life: 0.3, max: 0.3 });
      return { key: sk.key, hits: hits.length, dmg };
    }
    RT.projectiles.push({ kind: sk.key, x: p.x + fx * 20, y: p.y + fy * 20 - 20, vx: fx * sk.spd, vy: fy * sk.spd, life: B.life, r: sk.r, c: B.c, dmg,
      pierce: !!B.pierce, slowT: B.slowT || 0, slow: B.slow || 0, rootT: B.rootT || 0 });
    return { key: sk.key, hits: 0, dmg };
  }

  function playerDash() {
    if (!RT.on || !RT.player || RT.player.dashCd > 0) return;
    const p = RT.player;
    p.dashCd = DODGE.cd;
    p.invuln = DODGE.inv;
    p.x += p.faceX * DODGE.dist;
    p.y += p.faceY * DODGE.dist;
    clamp(p);
  }

  // reason：'dead' 主角倒下 / 'cleared' 敌人清空 / 'timeout' 超时 / 'closed' 玩家中途关掉覆盖层（宿主据此决定是否结算）
  function endRealtime(result, reason) {
    if (!RT.on) return;
    RT.on = false;
    RT.result = result;
    RT.endReason = reason || (result === 'win' ? 'cleared' : 'dead');
    RT.keys.clear();
    RT.projectiles = [];
    RT.enemyProjectiles = [];
    toast('遭遇战结束：' + (result === 'win' ? '胜' : '败'), result === 'win' ? '#9aff9a' : '#ff9a9a');
    if (RT._resolve) {
      RT._resolve({ result, reason: RT.endReason, time: RT.time, playerHp: RT.player ? RT.player.hp : 0 });
      RT._resolve = null;
    }
  }

  // ---------- 绘制（逻辑坐标 600×520；宿主负责缩放） ----------
  function drawUnit(ctx, u, isPlayer) {
    const anim = isPlayer && u.swing > 0 ? 'attack' : (u.flash > 0 ? 'hurt' : (u.moving ? 'walk' : 'idle'));
    const dir = screenDir(u.faceX || 0, u.faceY || 1);
    const f = isPlayer && u.swing > 0 ? (1 - u.swing / ATK.swing) * 5 : u.at * (u.moving ? 10 : 5);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(u.x, u.y, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
    let drawn = false;
    if (RT.skin === 'box' && typeof window !== 'undefined' && window.LowpolyBox) { // 方块低模皮肤（仅独立预览页加载 lowpoly_box_chars.js）
      const L = window.LowpolyBox;
      const hurt = u.flash > 0.06; // 受击闪白期间播后仰（前摇闪烁只有 0.05，不触发）
      const bAnim = isPlayer && u.swing > 0 ? 'attack' : (hurt ? 'hurt' : (u.moving ? 'walk' : 'idle'));
      const bt = bAnim === 'attack' ? 1 - u.swing / ATK.swing : bAnim === 'hurt' ? 1 - u.flash / 0.15 : u.at;
      const boxId = u.box || (isPlayer ? (RT.boxPlayer || 'jianxiu') : 'taozhai');
      L.draw(ctx, boxId, u.x, u.y, { scale: 0.9, angle: L.angleFromFace(u.faceX || 0, u.faceY || 1), anim: bAnim, t: bt });
      RT._lastBoxAnim = RT._lastBoxAnim || {}; RT._lastBoxAnim[isPlayer ? 'player' : u.name] = bAnim;
      return 'box';
    }
    if (sprOk(u.spr)) drawn = !!drawSprite(ctx, u.spr, anim, dir, f, u.x, u.y, 0.5, u.flash > 0 ? 0.6 : 1);
    if (!drawn) { // 图未加载完 / 无图集：回退圆形
      ctx.fillStyle = isPlayer ? (u.hp > 60 ? '#5a9a8a' : '#c07060') : '#c07060';
      ctx.beginPath(); ctx.arc(u.x, u.y - 14, isPlayer ? 14 : 18, 0, Math.PI * 2); ctx.fill();
    }
    return drawn;
  }

  function drawRealtime(ctx) {
    if (!RT.player || !ctx) return;
    const W = W0;
    ctx.fillStyle = '#1d2a22'; ctx.fillRect(0, 0, W0, H0);
    ctx.strokeStyle = 'rgba(255,220,150,0.35)'; ctx.lineWidth = 2;
    ctx.strokeRect(BOUND.x0 - 20, BOUND.y0 - 20, BOUND.x1 - BOUND.x0 + 40, BOUND.y1 - BOUND.y0 + 40);
    const p = RT.player;

    // 普攻扇形挥砍提示
    if (p.swing > 0) {
      const a = Math.atan2(p.faceY, p.faceX);
      ctx.fillStyle = `rgba(255,230,140,${0.35 * p.swing / ATK.swing})`;
      ctx.beginPath(); ctx.moveTo(p.x, p.y - 20); ctx.arc(p.x, p.y - 20, ATK.range, a - ATK.arc, a + ATK.arc); ctx.closePath(); ctx.fill();
    }

    // 敌人前摇预警：红色区域由淡到浓，敌人闪烁
    for (const tg of telegraphs()) {
      const a0 = Math.atan2(tg.aimY, tg.aimX);
      for (let i = 0; i < tg.count; i++) { // 散射：每一发各画一条预警线
        const a = a0 + (i - (tg.count - 1) / 2) * tg.spread * Math.PI / 180;
        ctx.save(); ctx.translate(tg.x, tg.y); ctx.rotate(a);
        ctx.fillStyle = `rgba(255,60,40,${0.15 + 0.35 * tg.k})`;
        ctx.fillRect(0, -tg.width / 2, tg.len, tg.width);
        ctx.fillStyle = 'rgba(255,90,60,0.8)';
        ctx.fillRect(0, -tg.width / 2, tg.len * tg.k, 3); ctx.fillRect(0, tg.width / 2 - 3, tg.len * tg.k, 3);
        ctx.restore();
      }
      tg.enemy.flash = Math.sin(RT.time * 30) > 0 ? 0.05 : 0;
    }
    // 头子环弹预警：橙色圈由外向内收紧 + 每发一根短刺标出弹道方向
    for (const rg of ringTelegraphs()) {
      ctx.strokeStyle = `rgba(255,140,40,${0.4 + 0.5 * rg.k})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2); ctx.stroke();
      const a0 = Math.atan2(rg.aimY, rg.aimX);
      for (let i = 0; i < rg.count; i++) {
        const a = a0 + i * 2 * Math.PI / rg.count, c = Math.cos(a), s = Math.sin(a);
        ctx.beginPath(); ctx.moveTo(rg.x + c * rg.r, rg.y + s * rg.r); ctx.lineTo(rg.x + c * (rg.r + 14), rg.y + s * (rg.r + 14)); ctx.stroke();
      }
      rg.enemy.flash = Math.sin(RT.time * 30) > 0 ? 0.05 : 0;
    }

    // 按 y 深度排序画角色
    const units = [...RT.enemies.filter(e => e.hp > 0).map(e => [e, false]), [p, true]].sort((a, b) => a[0].y - b[0].y);
    let sprites = 0;
    for (const [u, isP] of units) {
      const blink = isP && u.invuln > 0 && Math.sin(RT.time * 40) > 0;
      if (blink) ctx.globalAlpha = 0.4;
      if (drawUnit(ctx, u, isP)) sprites++;
      ctx.globalAlpha = 1;
      if (!isP) { // 血条 + 名字
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(u.x - 22, u.y - 84, 44, 5);
        ctx.fillStyle = '#eea279'; ctx.fillRect(u.x - 22, u.y - 78, 44 * (u.hp / u.maxHp), 5);
        ctx.fillStyle = '#f1e1c8'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(u.name, u.x, u.y - 90); ctx.textAlign = 'left';
      }
    }

    for (const proj of RT.projectiles) {
      ctx.fillStyle = proj.c || '#ffd27b';
      if (proj.kind === 'metal') { // 剑气：沿飞行方向的细长条
        const a = Math.atan2(proj.vy, proj.vx); ctx.save(); ctx.translate(proj.x, proj.y); ctx.rotate(a); ctx.fillRect(-18, -proj.r / 2, 36, proj.r); ctx.restore();
      } else { ctx.beginPath(); ctx.arc(proj.x, proj.y, proj.r || 6, 0, Math.PI * 2); ctx.fill(); }
    }
    for (const f of RT.fx) if (f.kind === 'cone') {
      ctx.globalAlpha = 0.5 * f.life / f.max; ctx.fillStyle = f.c;
      ctx.beginPath(); ctx.moveTo(f.x, f.y - 20); ctx.arc(f.x, f.y - 20, f.range, f.ang - f.arc, f.ang + f.arc); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    }
    // 状态标记：灼烧红点 / 减速蓝圈 / 定身绿圈
    for (const e of RT.enemies) if (e.hp > 0) {
      if (e.burnT > 0) { ctx.fillStyle = '#ff6a3a'; ctx.beginPath(); ctx.arc(e.x + 16, e.y - 60, 4, 0, Math.PI * 2); ctx.fill(); }
      if (e.slowT > 0) { ctx.strokeStyle = '#4aa8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y, 22, 9, 0, 0, Math.PI * 2); ctx.stroke(); }
      if (e.rootT > 0) { ctx.strokeStyle = '#5adf6a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(e.x, e.y, 18, 7, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
    for (const proj of RT.enemyProjectiles) { ctx.fillStyle = proj.ring ? '#ff9a3a' : '#e05a4a'; ctx.beginPath(); ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2); ctx.fill(); }

    // 伤害飘字
    ctx.textAlign = 'center'; ctx.font = 'bold 18px sans-serif';
    for (const n of RT.dmgNums) {
      ctx.globalAlpha = Math.max(0, n.life / n.max);
      ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(n.txt, n.x, n.y);
      ctx.fillStyle = n.c; ctx.fillText(n.txt, n.x, n.y);
    }
    ctx.globalAlpha = 1; ctx.textAlign = 'left';

    // 顶栏
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, 44);
    ctx.fillStyle = '#ffe680'; ctx.font = '15px sans-serif';
    const cd = v => (v > 0 ? v.toFixed(1) : '好');
    ctx.fillText(`${RT.label || '即时战(原型)'} ${Math.round(RT.time)}s  HP ${Math.ceil(p.hp)}/${p.max} 攻${p.atk}${RT.statSrc === 'game' ? '(存档)' : ''}  闪${cd(p.dashCd)} ${p.skill ? p.skill.n : '技'}${cd(p.skillCd)}`, 12, 28);
    if (!RT.on && RT.result) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, H0 / 2 - 40, W0, 80);
      ctx.fillStyle = RT.result === 'win' ? '#9aff9a' : '#ff9a9a'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(RT.result === 'win' ? '胜利' : '败北', W0 / 2, H0 / 2 + 10); ctx.textAlign = 'left';
    }
    return sprites;
  }

  // ---------- 开发者覆盖层：自带画布 + rAF 循环 + 触屏摇杆/按钮（只由开发者入口调用） ----------
  function devEnabled() {
    try {
      if (typeof location !== 'undefined' && /dev/.test(location.hash || '')) return true;
      return typeof localStorage !== 'undefined' && localStorage.getItem('wbx2_dev') === '1';
    } catch (e) { return false; }
  }
  function openOverlay(enemies, opts) {
    if (typeof document === 'undefined' || !document.body) return null;
    if (document.getElementById('rtp-overlay')) return null;
    if (!(opts && opts.force) && !devEnabled()) { toast('即时战原型仅开发者模式可用'); return null; }
    const ov = document.createElement('div');
    ov.id = 'rtp-overlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;touch-action:none;';
    const cv = document.createElement('canvas');
    cv.width = W0; cv.height = H0;
    cv.style.cssText = 'width:min(96vw,' + W0 + 'px);aspect-ratio:' + W0 + '/' + H0 + ';border:2px solid #ffe680;border-radius:10px;touch-action:none;';
    ov.appendChild(cv);
    const mkBtn = (txt, css, fn) => {
      const b = document.createElement('button'); b.textContent = txt;
      b.style.cssText = 'position:absolute;width:64px;height:64px;border-radius:50%;background:#2a3a5a;color:#ffe680;border:1px solid #ffe680;font-size:18px;font-weight:bold;' + css;
      b.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); fn(); });
      ov.appendChild(b); return b;
    };
    mkBtn('攻', 'right:20px;bottom:40px;', playerAttack);
    mkBtn('技', 'right:96px;bottom:24px;', playerSkill);
    mkBtn('闪', 'right:30px;bottom:116px;', playerDash);
    mkBtn('×', 'right:12px;top:12px;width:40px;height:40px;font-size:20px;', () => close());
    // 摇杆：在画布上按住拖动
    let sid = null, ox = 0, oy = 0;
    cv.addEventListener('pointerdown', ev => { sid = ev.pointerId; ox = ev.clientX; oy = ev.clientY; });
    cv.addEventListener('pointermove', ev => {
      if (ev.pointerId !== sid) return;
      const dx = ev.clientX - ox, dy = ev.clientY - oy, d = Math.hypot(dx, dy);
      RT.stick = d < 8 ? { x: 0, y: 0 } : { x: dx / Math.max(d, 50), y: dy / Math.max(d, 50) };
    });
    const up = ev => { if (ev.pointerId === sid) { sid = null; RT.stick = { x: 0, y: 0 }; } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    const onKey = ev => { if (ev.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    document.body.appendChild(ov);

    const ctx = cv.getContext('2d');
    let raf = 0, last = 0, closed = false, endT = 0, onClosed = null;
    const closedP = new Promise(r => { onClosed = r; }); // 覆盖层真正移除后 resolve（宿主在此之后再弹结算卡，免得被覆盖层挡住）
    function frame(t) {
      if (closed) return;
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
      updateRealtime(dt);
      drawRealtime(ctx);
      if (!RT.on) { endT += dt; if (endT > 1.5) { close(); return; } }
      raf = requestAnimationFrame(frame);
    }
    function close() {
      if (closed) return;
      closed = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      if (RT.on) endRealtime('lose', 'closed');
      if (ov.parentNode) ov.remove();
      onClosed();
    }
    const done = startRealtimeEncounter(enemies, opts);
    if (RT.player && RT.player.els.length > 1) mkBtn('换', 'right:110px;bottom:104px;width:48px;height:48px;font-size:15px;', cycleElement); // 多灵根切换元素
    raf = requestAnimationFrame(frame);
    return { done, closed: closedP, close, canvas: cv };
  }

  // 键盘监听（仅在原型开启时生效，避免污染正式游戏）
  function _rtKeyDown(e) {
    if (!RT.on) return;
    const k = (e.key || '').toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'j', 'shift', 'q', 'e'].includes(k)) {
      RT.keys.add(k);
      if (k === ' ' || k === 'j') playerAttack();
      else if (k === 'shift') playerDash();
      else if (k === 'q') playerSkill();
      else if (k === 'e') cycleElement();
      if (e.preventDefault) e.preventDefault();
    }
  }
  function _rtKeyUp(e) {
    if (!RT.on) return;
    RT.keys.delete((e.key || '').toLowerCase());
  }
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('keydown', _rtKeyDown);
    window.addEventListener('keyup', _rtKeyUp);
  }

  const API = {
    state: RT,
    start: startRealtimeEncounter,
    open: openOverlay,
    update: updateRealtime,
    draw: drawRealtime,
    end: endRealtime,
    attack: playerAttack,
    dash: playerDash,
    skill: playerSkill,
    inAttackArc,
    screenDir,
    devEnabled,
    readPlayerStats,
    readSpiritRoot,
    readWeaponType,
    skillFor,
    cycleElement,
    SKILL,
    WEAPON,
    ATK,
    FOE,
    FOE_TRAIT,
    foeTrait,
    RING,
    foeRing,
    ringTelegraphs,
    DODGE,
    telegraphs,
    _key: { down: _rtKeyDown, up: _rtKeyUp },
  };
  window.RealtimeBattle = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})();

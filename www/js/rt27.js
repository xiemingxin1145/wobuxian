'use strict';
// ======================= 2.7① 即时斗法（实时遭遇战） =======================
// 设计：小怪遭遇从回合制改为实时操控（移动/普攻/技能/闪避），敌人 AI 追击+普攻前摇预警+可躲避弹道。
// 战场为独立覆盖层（DOM 技能/血条/暂停按钮 + canvas 特效），不跳页；胜负结算形状与 startBattle 完全一致
// （resolve({res, killed, units})），由 Game.fight 统一发奖。Boss/剧情战仍走回合制。
const RT27 = {
  on: false,
  t: 0,
  resolve: null,
  opts: null,
  player: null,
  foes: [],
  projs: [],     // 飞行弹道 {x,y,vx,vy,friendly,sk,life,r,c}
  fx: [],        // 临时特效环/文字
  cam: { x: 0, y: 0 },
  arena: { w: 2600, h: 1800 },
  stick: { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 },
  holding: false,
  skills: [],    // 玩家技能槽 [{id,cd,cdMax}]
  ui: null,
  // 数值手感（可调）
  moveSpd: 300, atkRange: 150, atkCdMax: 0.5, dashCdMax: 2.6, dashT: 0.2, dashSpd: 980,
  avail() { return !!this.on; },
};

// ---------- 启动一场实时战（enemies 为 monUnit 产出的单位数组） ----------
RT27.start = function (enemies, opts = {}) {
  if (this.on) return Promise.resolve({ res: 'lose', killed: [], units: [] });
  const G = Game.G, s = Game.stats();
  const p = {
    isPlayer: true, name: G.name, spr: Game.playerSpr(),
    hp: Math.max(1, G.hp), mhp: s.mhp, mp: G.mp, mmp: s.mmp,
    atk: s.atk, def: s.def, spd: s.spd, crit: s.crit, skillBonus: s.skillBonus,
    el: (Game.linggen().el && Game.linggen().el[0]) || '无',
    x: this.arena.w / 2, y: this.arena.h / 2, dir: 'S', radius: 36,
    atkCd: 0, dashCd: 0, dashT: 0, invuln: 0, anim: 'idle', at: Math.random() * 3,
    buf: {}, hx: 0, hy: 0, // 受击/冲刺残影
  };
  // 敌人：从玩家周围一圈生成
  const foes = enemies.map((u, k) => {
    const ang = (k / enemies.length) * Math.PI * 2 + rnd(-0.3, 0.3);
    const d = 480 + rnd(0, 160);
    return Object.assign({}, u, {
      hp: u.mhp, alive: true, buf: {}, x: p.x + Math.cos(ang) * d, y: p.y + Math.sin(ang) * d,
      dir: 'SE', radius: u.boss ? 56 : 38, at: Math.random() * 3,
      atkCd: rnd(0.6, 1.6), windup: 0, windSk: null, anim: 'idle', walkT: 0,
      ranged: (u.sk || ['atk']).some(k => k !== 'atk' && SKILLS[k] && SKILLS[k].k > 0 && SKILLS[k].tg !== 'self' && SKILLS[k].tg !== 'ally'),
    });
  });
  // 玩家技能槽：从已学技能里挑最多 3 个可战斗技能
  this.skills = Game.skillList().filter(id => id !== 'atk' && SKILLS[id] && SKILLS[id].k > 0 && SKILLS[id].tg !== 'self').slice(0, 3)
    .map(id => ({ id, cd: 0, cdMax: SKILLS[id].tg === 'all' ? 3.2 : 1.4 }));
  if (!this.skills.length && Game.skillList().includes('meditate')) this.skills = [{ id: 'meditate', cd: 0, cdMax: 4 }];

  this.on = true; this.t = 0; this.player = p; this.foes = foes; this.projs = []; this.fx = []; this.opts = opts;
  this.chargeT = 0;
  this.cam.x = p.x; this.cam.y = p.y;
  this.stick = { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 }; this.holding = false;

  // 预载精灵
  const sprSet = new Set([p.spr, ...foes.map(f => f.spr)]);
  const ready = Promise.all([...sprSet].map(loadSprite));
  return ready.then(() => {
    R.mode = 'battle'; R.drawBattle = (ctx) => RT27.draw(ctx);
    R.onUpdate = (dt) => { if (RT27.on) RT27.update(dt); };
    R.parts = []; R.texts = [];
    Audio2.bgm(opts.boss ? 'boss' : 'battle');
    this._ui(true);
    this._bind();
    return new Promise(resolve => { this.resolve = resolve; });
  });
};

// ---------- 输入：canvas 左半 = 移动摇杆（全屏可拖） ----------
RT27._pd = function (e) {
  if (!RT27.on) return;
  const x = e.clientX * R.dpr, y = e.clientY * R.dpr;
  if (x < R.W * 0.55 && !RT27.ui._btnHit) {
    RT27.stick = { active: true, id: e.pointerId, ox: x, oy: y, dx: 0, dy: 0 };
    try { R.cv.setPointerCapture(e.pointerId); } catch (er) { }
  }
};
RT27._pm = function (e) {
  const st = RT27.stick;
  if (st.active && e.pointerId === st.id) {
    st.dx = e.clientX * R.dpr - st.ox; st.dy = e.clientY * R.dpr - st.oy;
  }
};
RT27._pu = function (e) {
  if (RT27.stick.active && e.pointerId === RT27.stick.id) RT27.stick = { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
};
RT27._bind = function () {
  const cv = R.cv;
  cv.addEventListener('pointerdown', this._pd);
  cv.addEventListener('pointermove', this._pm);
  cv.addEventListener('pointerup', this._pu);
  cv.addEventListener('pointercancel', this._pu);
};
RT27._unbind = function () {
  const cv = R.cv; if (!cv) return;
  cv.removeEventListener('pointerdown', this._pd);
  cv.removeEventListener('pointermove', this._pm);
  cv.removeEventListener('pointerup', this._pu);
  cv.removeEventListener('pointercancel', this._pu);
};

// ---------- 每帧逻辑 ----------
RT27.update = function (dt) {
  const p = this.player; if (!p) return;
  this.t += dt;
  // ---- 玩家移动 ----
  let mx = 0, my = 0;
  const st = this.stick;
  if (st.active) { const m = Math.hypot(st.dx, st.dy); if (m > 14) { mx = st.dx / m; my = st.dy / m; } }
  p.atkCd -= dt; p.dashCd -= dt; p.invuln -= dt; p.at += dt;
  p.buf.def = Math.max(0, (p.buf.def || 0) - dt); p.buf.reflect = Math.max(0, (p.buf.reflect || 0) - dt);
  // 缓慢回灵
  p.mp = Math.min(p.mmp, p.mp + p.mmp * 0.03 * dt);
  let sp = this.moveSpd * (0.8 + p.spd / 60);
  if (p.dashT > 0) {
    p.dashT -= dt; sp = this.dashSpd;
    this.fx.push({ kind: 'ghost', x: p.x, y: p.y, life: 0.25, max: 0.25 });
  }
  if (mx || my) { p.x += mx * sp * dt; p.y += my * sp * dt; p.dir = dirFrom(mx, my); p.anim = 'walk'; p.hx = mx; p.hy = my; }
  else p.anim = 'idle';
  p.x = Math.max(60, Math.min(this.arena.w - 60, p.x));
  p.y = Math.max(60, Math.min(this.arena.h - 60, p.y));

  // ---- 点普攻触发的冲锋贴身（0.6s 内向最近敌人突进）----
  if (this.chargeT > 0) {
    this.chargeT -= dt;
    const t = this._nearestFoe();
    if (t) { const dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy) || 1; if (d > this.atkRange * 0.8) { p.x += dx / d * 760 * dt; p.y += dy / d * 760 * dt; p.dir = dirFrom(dx, dy); p.anim = 'walk'; } }
  }

  // ---- 普攻：自动锁敌（敌进射程即挥砍）；按住普攻按钮则主动贴身追击 ----
  {
    const t = this._nearestFoe();
    if (t) {
      const dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy) || 1;
      if (this.holding && d > this.atkRange * 0.9) {
        p.x += dx / d * sp * dt; p.y += dy / d * sp * dt; p.dir = dirFrom(dx, dy); p.anim = 'walk'; p.hx = dx / d; p.hy = dy / d;
      }
      if (d < this.atkRange * 1.15 && p.atkCd <= 0) this._playerAttack();
    }
  }

  // ---- 技能冷却 ----
  for (const sk of this.skills) sk.cd -= dt;

  // ---- 敌人 AI ----
  for (const f of this.foes) {
    if (!f.alive) continue;
    f.at += dt; f.atkCd -= dt;
    const dx = p.x - f.x, dy = p.y - f.y, d = Math.hypot(dx, dy) || 1;
    if (f.windup > 0) {
      f.windup -= dt; f.anim = 'idle';
      if (f.windup <= 0) this._foeStrike(f, dx / d, dy / d);
      continue;
    }
    const desired = f.ranged ? 380 : this.atkRange * 0.9;
    if (d > desired) { f.x += (dx / d) * f.spd * 6.5 * dt; f.y += (dy / d) * f.spd * 6.5 * dt; f.anim = 'walk'; }
    else if (f.ranged && d < desired - 120) { f.x -= (dx / d) * f.spd * 5 * dt; f.y -= (dy / d) * f.spd * 5 * dt; f.anim = 'walk'; }
    else f.anim = 'idle';
    f.dir = dirFrom(dx, dy);
    if (f.atkCd <= 0 && d < (f.ranged ? 520 : this.atkRange * 1.15)) {
      f.atkCd = rnd(1.5, 2.6) * (f.boss ? 0.8 : 1);
      f.windSk = f.ranged && Math.random() < 0.6 ? pick((f.sk || ['atk']).filter(k => k !== 'atk' && SKILLS[k] && SKILLS[k].tg !== 'self')) : 'atk';
      f.windup = 0.55; // 前摇预警
    }
  }

  // ---- 弹道 ----
  for (const pr of this.projs) {
    pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
    if (pr.friendly) {
      for (const f of this.foes) {
        if (!f.alive || pr.dead) continue;
        if (Math.hypot(f.x - pr.x, f.y - pr.y) < f.radius + pr.r) { pr.dead = true; this._applyFoeDamage(f, SKILLS[pr.sk], pr); }
      }
    } else {
      if (p.invuln <= 0 && Math.hypot(p.x - pr.x, p.y - pr.y) < p.radius + pr.r) { pr.dead = true; this._damagePlayer(pr.dm, pr); }
    }
  }
  this.projs = this.projs.filter(pr => !pr.dead && pr.life > 0 && pr.x > -100 && pr.x < this.arena.w + 100 && pr.y > -100 && pr.y < this.arena.h + 100);

  // ---- 特效寿命 ----
  for (const x of this.fx) x.life -= dt;
  this.fx = this.fx.filter(x => x.life > 0);

  // ---- 相机 ----
  const ck = 1 - Math.pow(0.001, dt);
  this.cam.x += (p.x - this.cam.x) * ck;
  this.cam.y += (p.y - this.cam.y) * ck;

  this._uiHud();

  // ---- 胜负 ----
  if (p.hp <= 0) return this.finish('lose');
  if (this.foes.every(f => !f.alive)) return this.finish('win');
};

// ---------- 玩家普攻 ----------
RT27._playerAttack = function () {
  const p = this.player;
  const t = this._nearestFoe();
  if (!t) return;
  this.chargeT = 0.55; // 点普攻→主动冲锋贴身
  p.atkCd = this.atkCdMax; p.anim = 'attack';
  setTimeout(() => { if (p.anim === 'attack') p.anim = 'idle'; }, 220);
  const d = Math.hypot(t.x - p.x, t.y - p.y);
  if (d > this.atkRange + t.radius) return;
  p.dir = dirFrom(t.x - p.x, t.y - p.y);
  this._applyFoeDamage(t, SKILLS.atk);
  Sfx.play('slash');
};

RT27._nearestFoe = function () {
  const p = this.player; let best = null, bd = 1e9;
  for (const f of this.foes) if (f.alive) { const d = Math.hypot(f.x - p.x, f.y - p.y); if (d < bd) { bd = d; best = f; } }
  return best;
};

RT27._applyFoeDamage = function (f, sk, proj) {
  const r = calcDmg(this.player, f, sk || SKILLS.atk);
  f.hp -= r.dm; f.anim = 'hurt'; f.flashT = 0.2;
  const [sx, sy] = this._w2s(f.x, f.y - 60);
  floatText(sx + rnd(-20, 20), sy, (r.crit ? '暴击 ' : '') + '-' + r.dm, r.crit ? '#ffcf3a' : '#fff', (r.crit ? 40 : 30) * R.dpr, false);
  if (sk && sk.stun && Math.random() < sk.stun) { f.windup = Math.max(f.windup, 0); f.stunT = 1.2; floatText(sx, sy - 50, '定身!', '#c8a0ff', 26 * R.dpr, false); }
  if (sk && sk.slow) f.slowT = 2.5;
  if (sk && sk.dot) f.dotT = 3;
  if (sk && sk.drain) { this.player.hp = Math.min(this.player.mhp, this.player.hp + r.dm * sk.drain); }
  R.shake = Math.min(0.5, R.shake + (r.crit ? 0.4 : 0.18));
  Sfx.play('hit', 0.6);
  if (f.hp <= 0) { f.hp = 0; f.alive = false; f.anim = 'dead'; Sfx.play('die'); }
};

// ---------- 玩家放技能 ----------
RT27.castSkill = function (slotIdx) {
  if (!this.on) return;
  const sk = this.skills[slotIdx]; if (!sk || sk.cd > 0) return;
  const p = this.player, S = SKILLS[sk.id]; if (!S) return;
  if (p.mp < (S.mp || 0)) { UI.toast('灵力不足', '#7ac8ff'); return; }
  if (S.hpcost && p.hp < p.mhp * S.hpcost + 10) { UI.toast('气血不足，无法血祭', '#ff8a6a'); return; }
  p.mp -= S.mp || 0; if (S.hpcost) p.hp = Math.max(1, p.hp - Math.round(p.mhp * S.hpcost));
  sk.cd = sk.cdMax;
  p.anim = 'attack'; setTimeout(() => { if (p.anim === 'attack') p.anim = 'idle'; }, 260);
  const [sx, sy] = this._w2s(p.x, p.y - 80);
  floatText(sx, sy, S.n, ELEM[S.el] || '#ffe9a0', 30 * R.dpr, false);
  Sfx.play(S.fx === 'heal' ? 'heal' : (S.fx === 'fire' || S.fx === 'fireall') ? 'fire' : (S.fx === 'ice' || S.fx === 'iceall') ? 'ice' : 'magic');

  if (S.tg === 'self') {
    if (sk.id === 'meditate') { p.mp = Math.min(p.mmp, p.mp + p.mmp * 0.25); floatText(sx, sy - 44, '+灵', '#7ac8ff', 26 * R.dpr, false); }
    else if (S.buff === 'def') { p.buf.def = 4; floatText(sx, sy - 44, '护体', '#9ad8ff', 26 * R.dpr, false); }
    else if (S.buff === 'reflect') { p.buf.reflect = 6; floatText(sx, sy - 44, '反震', '#ffb0ff', 26 * R.dpr, false); }
    return;
  }
  if (S.heal) { const h = Math.round(p.mhp * S.heal); p.hp = Math.min(p.mhp, p.hp + h); floatText(sx, sy - 44, '+' + h, '#7aff8a', 30 * R.dpr, false); return; }

  if (S.tg === 'all') {
    // 群体：即时命中所有敌人
    R.flash = 0.25; R.shake = 0.5;
    for (const f of this.foes) if (f.alive) this._applyFoeDamage(f, S);
    for (const f of this.foes) if (f.alive) { const [fx, fy] = this._w2s(f.x, f.y); this.fx.push({ kind: 'burst', x: f.x, y: f.y, life: 0.4, max: 0.4, c: ELEM[S.el] || '#ffd25e' }); }
    return;
  }
  // 单体：发射可看清/可走位的弹道
  const t = this._nearestFoe(); if (!t) return;
  const a = Math.atan2(t.y - p.y, t.x - p.x);
  this.projs.push({ x: p.x, y: p.y - 30, vx: Math.cos(a) * 720, vy: Math.sin(a) * 720, friendly: true, sk: sk.id, dm: 0, r: 16, life: 1.4, c: ELEM[S.el] || '#ffd25e' });
  p.dir = dirFrom(t.x - p.x, t.y - p.y);
};

// ---------- 玩家闪避冲刺 ----------
RT27.dash = function () {
  if (!this.on) return;
  const p = this.player; if (p.dashCd > 0) return;
  p.dashCd = this.dashCdMax; p.dashT = this.dashT; p.invuln = Math.max(p.invuln, this.dashT + 0.08);
  Sfx.play('whoosh');
};

// ---------- 敌人出手 ----------
RT27._foeStrike = function (f, dx, dy) {
  const p = this.player;
  f.stunT = 0;
  const sk = f.windSk === 'atk' ? SKILLS.atk : (SKILLS[f.windSk] || SKILLS.atk);
  if (f.windSk === 'atk') {
    const d = Math.hypot(p.x - f.x, p.y - f.y);
    if (d < this.atkRange * 1.15 + f.radius) this._damagePlayer(this._enemyDmg(f, sk), sk);
    return;
  }
  // 技能弹道：朝玩家当前位置发射（可走位躲）
  const a = Math.atan2(p.y - f.y, p.x - f.x);
  this.projs.push({ x: f.x, y: f.y - 30, vx: Math.cos(a) * 460, vy: Math.sin(a) * 460, friendly: false, sk: f.windSk, dm: this._enemyDmg(f, sk), r: 15, life: 2.2, c: ELEM[sk.el] || '#ff6a5a' });
};

RT27._enemyDmg = function (f, sk) {
  return calcDmg(f, this.player, sk).dm;
};

RT27._damagePlayer = function (dm, sk) {
  const p = this.player;
  if (p.invuln > 0) { const [sx, sy] = this._w2s(p.x, p.y - 70); floatText(sx, sy, '闪避!', '#9affff', 26 * R.dpr, false); return; }
  if (p.buf.reflect > 0) { p.buf.reflect = 0; this._foeReflect(dm); }
  const cut = p.buf.def > 0 ? 0.5 : 1;
  p.hp -= Math.max(1, Math.round(dm * cut));
  p.anim = 'hurt';
  const [sx, sy] = this._w2s(p.x, p.y - 70);
  floatText(sx + rnd(-16, 16), sy, '-' + Math.max(1, Math.round(dm * cut)), '#ff6a5a', 32 * R.dpr, false);
  R.shake = Math.min(0.6, R.shake + 0.3); Sfx.play('hit', 0.5);
  if (p.hp <= 0) p.hp = 0;
};
RT27._foeReflect = function (dm) {
  const t = this._nearestFoe(); if (!t) return;
  t.hp -= dm; const [sx, sy] = this._w2s(t.x, t.y - 60); floatText(sx, sy, '反震 -' + dm, '#ffb0ff', 26 * R.dpr, false);
  if (t.hp <= 0) { t.hp = 0; t.alive = false; }
};

// ---------- 收尾结算 ----------
RT27.finish = function (res) {
  if (!this.on) return;
  const p = this.player;
  Game.G.hp = Math.max(1, Math.round(p.hp)); Game.G.mp = Math.max(0, Math.round(p.mp));
  const killed = this.foes.filter(f => !f.alive).map(f => Object.assign({}, f, { alive: false }));
  Sfx.play(res === 'win' ? 'victory' : 'defeat');
  this.on = false;
  this._ui(false); this._unbind();
  R.mode = 'map'; R.drawBattle = null; R.onUpdate = null; R.parts = []; R.texts = [];
  if (R.mapId && MAPINFO[R.mapId]) Audio2.bgm(MAPINFO[R.mapId].bgm);
  const resolve = this.resolve; this.resolve = null;
  resolve && resolve({ res, killed, units: [p, ...this.foes] });
};

// ---------- 世界坐标 → 屏幕坐标 ----------
RT27._w2s = function (x, y) {
  return [(x - this.cam.x) * 1 + R.W / 2, (y - this.cam.y) * 1 + R.H / 2];
};

// ---------- canvas 绘制 ----------
RT27.draw = function (ctx) {
  const W = R.W, H = R.H;
  // 背景
  const info = MAPINFO[R.mapId] || MAPINFO.village || { sky: ['#243', '#123'] };
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, info.sky[0] || '#223344'); g.addColorStop(1, '#0c0a14');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 地面网格
  ctx.save();
  const [ox, oy] = this._w2s(0, 0);
  ctx.strokeStyle = 'rgba(255,240,200,0.06)'; ctx.lineWidth = 1;
  for (let x = 0; x <= this.arena.w; x += 130) { const [sx] = this._w2s(x, 0); ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke(); }
  for (let y = 0; y <= this.arena.h; y += 130) { const [, sy] = this._w2s(0, y); ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke(); }
  // 场地边界
  const [bx, by] = this._w2s(0, 0); ctx.strokeStyle = 'rgba(255,220,150,0.35)'; ctx.lineWidth = 4 * R.dpr; ctx.strokeRect(bx, by, this.arena.w, this.arena.h);
  ctx.restore();

  const p = this.player;
  // 影子
  const drawEnt = (e, isPlayer) => {
    const [sx, sy] = this._w2s(e.x, e.y);
    if (sx < -200 || sx > W + 200 || sy < -200 || sy > H + 200) return;
    const b = spriteBox(e.spr, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(sx, sy, b.w * 0.45, b.w * 0.2, 0, 0, 7); ctx.fill();
    // 前摇预警圈
    if (!isPlayer && e.alive && e.windup > 0) {
      const a = Math.min(1, e.windup / 0.55);
      ctx.strokeStyle = `rgba(255,70,50,${0.4 + 0.5 * (1 - a)})`; ctx.lineWidth = 4 * R.dpr;
      ctx.beginPath(); ctx.arc(sx, sy, e.radius + 26 + (1 - a) * 10, 0, 7); ctx.stroke();
    }
    if (e.alive || e.anim === 'dead') {
      const alpha = e.anim === 'dead' ? 0.4 : 1;
      const blink = isPlayer && p.invuln > 0 ? (Math.sin(R.t * 40) > 0 ? 0.35 : 0.9) : alpha;
      drawSprite(ctx, e.spr, e.anim, e.dir, e.at * (e.anim === 'walk' ? 10 : 5), sx, sy, e.radius > 50 ? 1.0 : 0.95, blink * (e.flashT > 0 ? 0.7 : 1));
      if (e.flashT > 0) e.flashT -= 0.016;
    }
    // 敌人血条
    if (!isPlayer && e.alive) {
      const bw = 90 * R.dpr; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(sx - bw / 2, sy - b.h - 26 * R.dpr, bw, 8 * R.dpr);
      ctx.fillStyle = e.elite ? '#d8a0ff' : '#ff5a4a'; ctx.fillRect(sx - bw / 2, sy - b.h - 26 * R.dpr, bw * Math.max(0, e.hp / e.mhp), 8 * R.dpr);
      ctx.font = `bold ${13 * R.dpr}px WBXKai,sans-serif`; ctx.textAlign = 'center';
      ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.strokeText(e.name, sx, sy - b.h - 32 * R.dpr); ctx.fillStyle = '#fff'; ctx.fillText(e.name, sx, sy - b.h - 32 * R.dpr);
    }
  };
  // 深度排序：按 y
  const ents = [...this.foes.filter(f => f.alive || f.anim === 'dead'), p].sort((a, b) => a.y - b.y);
  for (const e of ents) drawEnt(e, e.isPlayer);

  // 弹道
  for (const pr of this.projs) {
    const [sx, sy] = this._w2s(pr.x, pr.y);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = pr.c; ctx.beginPath(); ctx.arc(sx, sy, pr.r * R.dpr, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.arc(sx, sy, pr.r * R.dpr * 1.8, 0, 7); ctx.fill();
    ctx.restore();
  }
  // 特效
  for (const x of this.fx) {
    const k = x.life / x.max; const [sx, sy] = this._w2s(x.x, x.y);
    if (x.kind === 'ghost') { ctx.save(); ctx.globalAlpha = k * 0.4; ctx.drawStyle; }
    if (x.kind === 'burst') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k; ctx.strokeStyle = x.c; ctx.lineWidth = 4 * R.dpr; ctx.beginPath(); ctx.arc(sx, sy, (1 - k) * 160 * R.dpr + 20, 0, 7); ctx.stroke(); ctx.restore(); }
  }
  // 玩家锁定指示
  const t = this._nearestFoe();
  if (t) { const [sx, sy] = this._w2s(t.x, t.y); ctx.strokeStyle = 'rgba(255,230,130,0.8)'; ctx.lineWidth = 3 * R.dpr; ctx.beginPath(); ctx.ellipse(sx, sy, t.radius + 14, (t.radius + 14) * 0.45, 0, 0, 7); ctx.stroke(); }
};

// ---------- DOM 覆盖层 ----------
RT27._ui = function (on) {
  if (on) {
    if (window.UI && UI.battleUI) UI.battleUI(true);
    if (!document.getElementById('rt27-style')) {
      const st = document.createElement('style');
      st.id = 'rt27-style';
      st.textContent = 'body.rt27-fight #hud,body.rt27-fight #menu,body.rt27-fight #qt,body.rt27-fight #yearbtn,body.rt27-fight #battlebar,body.rt27-fight #banner,body.rt27-fight #ap,body.rt27-fight #afkbtn,body.rt27-fight .afk23,body.rt27-fight #afkstop23{display:none!important}';
      document.head.appendChild(st);
    }
    document.body.classList.add('rt27-fight');
    if (this.ui && this.ui.root) { this.ui.root.style.display = 'block'; return; }
    const root = document.createElement('div');
    root.id = 'rt27-ui';
    root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:12;font-family:WBXKai,sans-serif';
    root.innerHTML = `
      <div id="rt27-hp" style="position:absolute;left:10px;top:calc(10px + env(safe-area-inset-top));width:min(46vw,260px);pointer-events:none">
        <div style="height:14px;background:rgba(0,0,0,.55);border:1px solid #d8b26a;border-radius:8px;overflow:hidden"><i id="rt27-hpf" style="display:block;height:100%;width:100%;background:linear-gradient(90deg,#5adf6a,#2a9a3a)"></i></div>
        <div style="height:9px;margin-top:3px;background:rgba(0,0,0,.5);border:1px solid #4a6a9a;border-radius:6px;overflow:hidden"><i id="rt27-mpf" style="display:block;height:100%;width:100%;background:linear-gradient(90deg,#6ab8ff,#3a6adf)"></i></div>
        <div id="rt27-target" style="color:#ffe9b0;font-size:13px;text-shadow:0 1px 2px #000;margin-top:3px"></div>
      </div>
      <div id="rt27-top" style="position:absolute;right:10px;top:calc(10px + env(safe-area-inset-top));display:flex;gap:6px;pointer-events:auto">
        <button id="rt27-flee" style="...">认输</button>
      </div>
      <div id="rt27-actions" style="position:absolute;right:10px;bottom:calc(12px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:8px;align-items:flex-end;pointer-events:auto">
        <div id="rt27-skills" style="display:flex;gap:8px"></div>
        <div style="display:flex;gap:10px;align-items:flex-end">
          <button id="rt27-dash" style="width:60px;height:60px;border-radius:50%;background:radial-gradient(circle at 50% 35%,#3a6a9a,#1a3a5a);border:2px solid #9ad8ff;color:#dff;font-size:13px;font-weight:bold">闪避</button>
          <button id="rt27-atk" style="width:84px;height:84px;border-radius:50%;background:radial-gradient(circle at 50% 35%,#c05a3a,#7a2a1a);border:3px solid #ffd27a;color:#ffe9b0;font-size:18px;font-weight:bold">普攻</button>
        </div>
      </div>`;
    document.body.appendChild(root);
    const bt = root.querySelector('#rt27-flee');
    bt.style.cssText = 'padding:6px 12px;border-radius:14px;background:rgba(40,20,10,.8);border:1px solid #c8a060;color:#ccc;font-size:13px';
    bt.onclick = () => { UI.card('撤退', '确定要撤退（认输）吗？', 'i:sk_flee', ['撤退', '继续打']).then(c => { if (c === 0) this.finish('lose'); }); };
    const dash = root.querySelector('#rt27-dash');
    dash.onpointerdown = e => { e.stopPropagation(); this.ui._btnHit = true; this.dash(); };
    dash.onpointerup = () => { this.ui._btnHit = false; };
    const atk = root.querySelector('#rt27-atk');
    atk.onpointerdown = e => { e.stopPropagation(); this.ui._btnHit = true; this.holding = true; this._playerAttack(); };
    atk.onpointerup = () => { this.ui._btnHit = false; this.holding = false; };
    // 技能槽
    const skBox = root.querySelector('#rt27-skills');
    this.skills.forEach((sk, k) => {
      const S = SKILLS[sk.id];
      const b = document.createElement('button');
      b.dataset.sk = sk.id;
      b.style.cssText = 'position:relative;width:56px;height:56px;border-radius:12px;background:linear-gradient(#6a4a2a,#3a2a14);border:2px solid #d8a060;color:#ffe9b0;font-size:11px;display:flex;flex-direction:column;align-items:center;justify-content:center';
      b.innerHTML = `<i style="${iconCss(S.ic || 'book_b', 30)}"></i><small style="font-size:9px;color:#9ad8ff">${S.mp || 0}灵</small><span class="cd" style="position:absolute;inset:0;border-radius:10px;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;color:#fff;font-size:16px"></span>`;
      b.onpointerdown = e => { e.stopPropagation(); this.ui._btnHit = true; this.castSkill(k); };
      b.onpointerup = () => { this.ui._btnHit = false; };
      skBox.appendChild(b);
    });
    this.ui = { root, hp: root.querySelector('#rt27-hpf'), mp: root.querySelector('#rt27-mpf'), target: root.querySelector('#rt27-target'), skEls: [...skBox.children], _btnHit: false };
  } else if (this.ui && this.ui.root) {
    this.ui.root.style.display = 'none';
  }
  if (!on) { document.body.classList.remove('rt27-fight'); if (window.UI && UI.battleUI) UI.battleUI(false); }
};
RT27._uiHud = function () {
  if (!this.ui) return;
  const p = this.player;
  this.ui.hp.style.width = Math.max(0, p.hp / p.mhp * 100) + '%';
  this.ui.mp.style.width = Math.max(0, p.mp / p.mmp * 100) + '%';
  const alive = this.foes.filter(f => f.alive).length;
  this.ui.target.textContent = `敌人剩 ${alive}　闪避冷却 ${p.dashCd > 0 ? Math.ceil(p.dashCd) : '好'}`;
  this.ui.skEls.forEach((el, k) => {
    const sk = this.skills[k]; if (!sk) return;
    const cdEl = el.querySelector('.cd');
    if (sk.cd > 0) { cdEl.style.display = 'flex'; cdEl.textContent = Math.ceil(sk.cd); }
    else cdEl.style.display = 'none';
    el.style.opacity = p.mp < (SKILLS[sk.id].mp || 0) ? 0.45 : 1;
  });
};

// ---------- BOT 自动战斗（供 CI smoke：实时战时自动普攻） ----------
(function () {
  if (window.BOT && !RT27._botWrapped) {
    RT27._botWrapped = true;
    const _tick = BOT.tick.bind(BOT);
    BOT.tick = function () {
      if (RT27.on) { RT27._botAct(); return 'rt'; }
      return _tick();
    };
  }
})();
RT27._botAct = function () {
  const p = this.player; if (!p) return;
  // 敌人弹道贴近就往反方向挪一步
  const d = this.projs.find(pr => !pr.friendly && Math.hypot(pr.x - p.x, pr.y - p.y) < 120);
  if (d) { p.x += (p.x - d.x) / 6; p.y += (p.y - d.y) / 6; }
  if (p.hp < p.mhp * 0.35 && p.dashCd <= 0) this.dash();
  this._playerAttack();
  const sk = this.skills.find(s => s.cd <= 0 && p.mp >= (SKILLS[s.id].mp || 0));
  if (sk && Math.random() < 0.3) this.castSkill(this.skills.indexOf(sk));
};

// ---------- 开发者开关：实时 / 回合（仅 #dev 显示） ----------
(function () {
  if (!location.hash.includes('dev')) return;
  const t = setInterval(() => {
    if (!window.Game || !Game.G || document.getElementById('rt27-mode')) return;
    clearInterval(t);
    const b = document.createElement('button');
    b.id = 'rt27-mode';
    b.style.cssText = 'position:fixed;left:10px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:9999;padding:6px 12px;border-radius:16px;background:#224a3a;color:#b0ffd0;border:1px solid #b0ffd0;font-size:12px';
    const sync = () => { b.textContent = (Game.G.rtMode === 'turn' ? '回合战' : '实时战') + ' ⇄'; };
    b.onclick = () => { Game.G.rtMode = Game.G.rtMode === 'turn' ? 'realtime' : 'turn'; UI.toast(Game.G.rtMode === 'turn' ? '已切回合制' : '已切实时战', '#b0ffd0'); sync(); Game.save && Game.save(); };
    sync();
    document.body.appendChild(b);
  }, 800);
})();

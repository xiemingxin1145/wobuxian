'use strict';
// ======================= 回合制战斗（问道式站位） =======================
const B = { on: false, units: [], speed: 1, auto: false, round: 0, sel: null, bg: null, log: [] };
const wait = ms => new Promise(r => setTimeout(r, ms / B.speed));
const POW = t => Math.pow(1.75, t);
const ENEMY_POS = [[0.30, 0.43], [0.13, 0.50], [0.47, 0.35], [0.12, 0.32], [0.33, 0.24]];
const ALLY_POS = [[0.70, 0.71], [0.86, 0.62], [0.54, 0.80]];
function monUnit(key, tier, elite) {
  const m = MONS[key]; const P = POW(tier) * (elite ? 1.6 : 1);
  return { name: (elite ? '【精英】' : '') + m.n, spr: m.spr, side: 1, mon: key, tier, boss: !!m.boss, elite: !!elite, el: m.el,
    mhp: Math.round(90 * P * m.hp), mmp: 999, atk: 16 * P * m.atk, def: 9 * P * m.def, spd: 10 * m.spd + tier * 2, crit: 0.05, skills: m.sk, s: m.boss ? 1.0 : 1.05 };
}
function startBattle(enemies, opts = {}) {
  return new Promise(async resolve => {
    const G = Game.G; const ps = Game.stats();
    const units = [];
    units.push(Object.assign({ name: G.name, spr: Game.playerSpr(), side: 0, isPlayer: true, el: (Game.linggen().el[0] || '无'), skills: Game.skillList(), s: 1.05 }, ps, { hp: G.hp, mp: G.mp }));
    const pet = Game.activePet(); if (pet) { const pu = Game.petUnit(pet); units.push(Object.assign(pu, { side: 0, isPet: true, s: 0.9 })); }
    const comp = Game.compUnit(); if (comp) units.push(Object.assign(comp, { side: 0, isComp: true, s: 1.0 }));
    enemies.forEach(u => units.push(u));
    for (const u of units) { u.hp = u.hp === undefined ? u.mhp : Math.min(u.hp, u.mhp); u.mp = u.mp === undefined ? u.mmp : u.mp; u.buf = {}; u.anim = 'idle'; u.at = Math.random() * 3; u.alive = u.hp > 0; u.ox = 0; u.oy = 0; }
    let ai = 0, ei = 0;
    for (const u of units) { const p = u.side ? ENEMY_POS[ei++ % 5] : ALLY_POS[ai++ % 3]; u.px = p[0]; u.py = p[1]; u.dir = u.side ? 'SE' : 'NW'; if (u.boss) { u.px = 0.29; u.py = 0.45; } }
    await Promise.all(units.map(u => loadSprite(u.spr)));
    Object.assign(B, { on: true, units, round: 0, opts, resolve, log: [], sel: null, fled: false, result: null });
    makeBattleBg(); R.mode = 'battle'; R.drawBattle = drawBattle; R.parts = []; R.texts = [];
    Audio2.bgm(opts.boss ? 'boss' : 'battle');
    UI.battleUI(true); battleLoop();
  });
}
function makeBattleBg() {
  const c = document.createElement('canvas'); c.width = R.W; c.height = R.H; const g = c.getContext('2d');
  const info = MAPINFO[R.mapId] || MAPINFO.village;
  const gr = g.createLinearGradient(0, 0, 0, R.H); gr.addColorStop(0, info.sky[0]); gr.addColorStop(1, info.sky[1]); g.fillStyle = gr; g.fillRect(0, 0, R.W, R.H);
  const plate = img('assets/maps/' + R.mapId + '.webp');
  if (plate && R.player) {
    const [px, py] = t2p(R.player.i, R.player.j); const Z = R.Z * 1.35;
    try { g.filter = 'blur(3px) saturate(0.9)'; } catch (e) { }
    g.drawImage(plate, R.W / 2 - px * Z, R.H * 0.55 - py * Z, plate.width * Z, plate.height * Z); g.filter = 'none';
  }
  const v = g.createRadialGradient(R.W / 2, R.H * 0.55, R.H * 0.2, R.W / 2, R.H * 0.55, R.H * 0.75); v.addColorStop(0, 'rgba(0,0,0,0.05)'); v.addColorStop(1, 'rgba(0,0,0,0.6)'); g.fillStyle = v; g.fillRect(0, 0, R.W, R.H);
  // 战斗法阵
  g.save(); g.translate(R.W / 2, R.H * 0.56); g.scale(1, 0.5); g.strokeStyle = 'rgba(255,240,200,0.35)'; g.lineWidth = 3 * R.dpr;
  for (const r of [0.46, 0.4]) { g.beginPath(); g.arc(0, 0, R.W * r, 0, 7); g.stroke(); }
  for (let k = 0; k < 8; k++) { g.save(); g.rotate(k * Math.PI / 4); g.fillStyle = 'rgba(255,240,200,0.25)'; g.font = `${28 * R.dpr}px serif`; g.fillText('卦乾坤震巽坎离艮兑'[k + 1], R.W * 0.42, 0); g.restore(); }
  g.restore();
  B.bg = c;
}
function uPos(u) { const sc = Math.min(R.W, R.H * 0.62); return [u.px * R.W + u.ox, u.py * R.H + u.oy]; }
function uScale(u) { return R.Z * 1.3 * u.s * (u.boss ? 0.85 : 1); }
function drawBattle(ctx) {
  if (B.bg) ctx.drawImage(B.bg, 0, 0); else { ctx.fillStyle = '#223'; ctx.fillRect(0, 0, R.W, R.H); }
  const sx = (Math.random() - 0.5) * R.shake * 24; ctx.save(); ctx.translate(sx, 0);
  const list = B.units.filter(u => u.alive || u.dying).sort((a, b) => a.py - b.py);
  for (const u of list) {
    const [x, y] = uPos(u); const s = uScale(u); const b = spriteBox(u.spr, s);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, y, b.w * 0.45, b.w * 0.18, 0, 0, 7); ctx.fill();
    if (B.sel && B.sel.targets && B.sel.targets.includes(u)) { ctx.strokeStyle = '#ffe680'; ctx.lineWidth = 4 * R.dpr; ctx.beginPath(); ctx.ellipse(x, y, b.w * 0.55 + Math.sin(R.t * 6) * 4, b.w * 0.24, 0, 0, 7); ctx.stroke(); }
  }
  for (const u of list) {
    const [x, y] = uPos(u); const s = uScale(u); u.at += 0.016;
    let anim = u.anim, f = u.at * (anim === 'attack' ? 12 : anim === 'walk' ? 10 : 5);
    if (anim === 'attack' && u.afix !== undefined) f = u.afix;
    const alpha = u.dying ? Math.max(0, u.dying) : 1; if (u.dying) u.dying -= 0.02;
    if (u.dying !== undefined && u.dying <= 0) u.dying = undefined;
    drawSprite(ctx, u.spr, anim, u.dir, f, x, y, s, alpha * (u.buf.stun ? 0.85 : 1));
    if (u.flashT > 0) { u.flashT -= 0.016; ctx.globalCompositeOperation = 'lighter'; drawSprite(ctx, u.spr, anim, u.dir, f, x, y, s, u.flashT * 2); ctx.globalCompositeOperation = 'source-over'; }
    if (!u.alive) continue;
    // 血条
    const b = spriteBox(u.spr, s); const w = 110 * R.dpr * (u.boss ? 1.6 : 1), top = y - b.h - 14 * R.dpr;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - w / 2 - 2, top - 2, w + 4, 14 * R.dpr);
    ctx.fillStyle = u.side ? '#ff5a4a' : '#5adf6a'; ctx.fillRect(x - w / 2, top, w * Math.max(0, u.hp / u.mhp), 6 * R.dpr);
    ctx.fillStyle = '#4aa8ff'; ctx.fillRect(x - w / 2, top + 7 * R.dpr, w * Math.max(0, Math.min(1, u.mp / u.mmp)), 3 * R.dpr);
    ctx.font = `bold ${13 * R.dpr}px WBXKai,sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.strokeText(u.name, x, top - 6 * R.dpr); ctx.fillStyle = u.boss ? '#ffb040' : u.elite ? '#d8a0ff' : '#fff'; ctx.fillText(u.name, x, top - 6 * R.dpr);
    const bs = Object.keys(u.buf).filter(k => u.buf[k] > 0).map(k => ({ def: '甲', slow: '缓', stun: '晕', reflect: '反', poison: '毒' })[k]).filter(Boolean).join('');
    if (bs) { ctx.fillStyle = '#ffe680'; ctx.fillText(bs, x + w / 2 + 14 * R.dpr, top + 8 * R.dpr); }
  }
  ctx.restore();
  ctx.font = `bold ${16 * R.dpr}px WBXKai,sans-serif`; ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillText(`第 ${B.round} 回合`, 14 * R.dpr, R.H * 0.16);
}
// --------- 战斗计算 ---------
function calcDmg(a, d, sk) {
  let base = a.atk * (sk.k || 1) * (0.92 + Math.random() * 0.16);
  if (sk !== SKILLS.atk) base *= 1 + (a.skillBonus || 0) + (sk.el === '金' ? (a.metalBonus || 0) : 0);
  let dm = base * 1.45 * a.atk / (a.atk + d.def * (d.buf.def ? 1.6 : 1) * 1.1);
  const el = sk.el || (sk === SKILLS.atk ? a.el : null);
  let tag = '';
  if (el && KE[el] === d.el) { dm *= 1.3; tag = '克制'; } else if (el && KE[d.el] === el) dm *= 0.8;
  let crit = Math.random() < (a.crit || 0.05); if (crit) dm *= 1.6;
  if (d.isPlayer && Game.G) dm *= 1 - (Game.eqFx('玲珑塔') ? 0.12 : 0);
  return { dm: Math.max(1, Math.round(dm)), crit, tag };
}
function alive(side) { return B.units.filter(u => u.alive && u.side === side); }
function chooseAI(u) {
  const foes = alive(1 - u.side), friends = alive(u.side); if (!foes.length) return null;
  if (u.buf.stun) return { u, sk: 'stunned' };
  const opts = (u.skills || ['atk']).filter(k => SKILLS[k] && (SKILLS[k].mp || 0) <= u.mp);
  // 治疗优先
  const hurt = friends.filter(f => f.hp / f.mhp < 0.45).sort((a, b) => a.hp / a.mhp - b.hp / b.mhp)[0];
  if (hurt && opts.includes('heal') && Math.random() < 0.8) return { u, sk: 'heal', t: [hurt] };
  let pick = 'atk';
  const nonAtk = opts.filter(k => k !== 'atk' && k !== 'heal' && k !== 'meditate');
  if (nonAtk.length && Math.random() < (u.side ? 0.45 : 0.7)) pick = nonAtk[Math.random() * nonAtk.length | 0];
  if (u.mp < u.mmp * 0.15 && opts.includes('meditate')) pick = 'meditate';
  const S = SKILLS[pick];
  if (S.tg === 'self') return { u, sk: pick, t: [u] };
  if (S.tg === 'ally') return { u, sk: pick, t: [friends.sort((a, b) => a.hp / a.mhp - b.hp / b.mhp)[0]] };
  if (S.tg === 'all') return { u, sk: pick, t: foes };
  // 优先打玩家/残血
  const t = u.side ? (Math.random() < 0.6 ? foes.find(f => f.isPlayer) || foes[0] : foes[Math.random() * foes.length | 0]) : foes.sort((a, b) => a.hp - b.hp)[0];
  return { u, sk: pick, t: [t] };
}
async function battleLoop() {
  while (B.on) {
    B.round++;
    const P = B.units.find(u => u.isPlayer);
    let acts = [];
    if (P.alive) {
      const a = (B.auto || P.buf.stun) ? (P.buf.stun ? { u: P, sk: 'stunned' } : chooseAI(P)) : await UI.battleChoose(P);
      if (!B.on) return;
      if (a) acts.push(a);
    }
    for (const u of B.units) if (u.alive && !u.isPlayer) { const a = chooseAI(u); if (a) acts.push(a); }
    acts.sort((x, y) => (y.u.spd * (y.u.buf.slow ? 0.6 : 1) * (0.9 + Math.random() * 0.2) + (y.sk === 'flee' || y.sk === 'item' || y.sk === 'defend' ? 999 : 0)) - (x.u.spd * (x.u.buf.slow ? 0.6 : 1) * (0.9 + Math.random() * 0.2) + (x.sk === 'flee' || x.sk === 'item' || x.sk === 'defend' ? 999 : 0)));
    for (const a of acts) {
      if (!B.on) return;
      if (!a.u.alive) continue;
      await doAction(a);
      if (await checkEnd()) return;
    }
    // 回合结束：buff 递减、回血、毒
    for (const u of B.units) {
      if (!u.alive) continue;
      if (u.buf.poison > 0) { const d = Math.round(u.mhp * 0.06); u.hp -= d; const [x, y] = uPos(u); floatText(x, y - 120 * R.dpr, '-' + d, '#9aff6a', 30 * R.dpr, false); if (u.hp <= 0) { u.hp = 0; kill(u); } }
      if (u.regen) u.hp = Math.min(u.mhp, u.hp + u.mhp * u.regen);
      if (u.mpregen) u.mp = Math.min(u.mmp, u.mp + u.mmp * u.mpregen);
      if (u.isPlayer && Game.eqFx('紫金葫芦')) u.hp = Math.min(u.mhp, u.hp + u.mhp * 0.04);
      for (const k in u.buf) if (u.buf[k] > 0) u.buf[k]--;
    }
    if (await checkEnd()) return;
  }
}
async function checkEnd() {
  if (!alive(1).length) { await wait(400); endBattle('win'); return true; }
  const P = B.units.find(u => u.isPlayer); if (!P.alive) { await wait(500); endBattle('lose'); return true; }
  if (B.fled) { endBattle('flee'); return true; }
  return false;
}
function kill(u) {
  if (u.undying) { u.undying = 0; u.hp = 1; const [x, y] = uPos(u); floatText(x, y - 150 * R.dpr, '不屈！', '#ffd23a', 34 * R.dpr, false); return; }
  if (u.isPlayer && Game.has('tsf')) { Game.take('tsf', 1); u.hp = Math.round(u.mhp * 0.3); const [x, y] = uPos(u); floatText(x, y - 150 * R.dpr, '替死符生效！', '#ffd23a', 34 * R.dpr, false); return; }
  u.alive = false; u.dying = 1; u.anim = 'hurt'; if (u.side) Sfx.play('hit');
}
async function moveUnit(u, tx, ty, ms) {
  const sx = u.ox, sy = u.oy; const t0 = performance.now(); u.anim = 'walk';
  while (true) { const k = Math.min(1, (performance.now() - t0) * B.speed / ms); u.ox = sx + (tx - sx) * k; u.oy = sy + (ty - sy) * k; if (k >= 1) break; await new Promise(r => requestAnimationFrame(r)); }
  u.anim = 'idle';
}
async function playAttackAnim(u) {
  u.anim = 'attack'; for (let f = 0; f < 5; f++) { u.afix = f; await wait(70); } u.afix = undefined; u.anim = 'idle';
}
async function doAction(a) {
  const u = a.u; const [ux, uy] = uPos(u);
  if (a.sk === 'stunned') { floatText(ux, uy - 140 * R.dpr, '晕眩中…', '#ffe680', 26 * R.dpr, false); await wait(450); return; }
  if (a.sk === 'defend') { u.buf.def = 1; floatText(ux, uy - 140 * R.dpr, '防御', '#9ad8ff', 28 * R.dpr, false); await wait(300); return; }
  if (a.sk === 'flee') {
    if (B.opts.boss || B.opts.noflee) { floatText(ux, uy - 140 * R.dpr, '逃不掉！', '#ff8a6a', 30 * R.dpr, false); await wait(400); return; }
    if (Math.random() < 0.55 + (Game.G.st.luck || 0) * 0.02) { Sfx.play('whoosh'); B.fled = true; await moveUnit(u, 200 * R.dpr, 100 * R.dpr, 400); return; }
    floatText(ux, uy - 140 * R.dpr, '逃跑失败', '#ff8a6a', 28 * R.dpr, false); await wait(400); return;
  }
  if (a.sk === 'item') {
    const it = ITEMS[a.item]; Game.take(a.item, 1); Sfx.play('heal');
    const tgt = a.t ? a.t[0] : u; const mul = 1 + (Game.G.pillBonus || 0);
    if (a.item === 'hcd') { const h = Math.round(tgt.mhp * 0.5 * mul); tgt.hp = Math.min(tgt.mhp, tgt.hp + h); const [x, y] = uPos(tgt); floatText(x, y - 140 * R.dpr, '+' + h, '#7aff8a', 32 * R.dpr, false); }
    if (a.item === 'hld') { const h = Math.round(tgt.mmp * 0.5 * mul); tgt.mp = Math.min(tgt.mmp, tgt.mp + h); const [x, y] = uPos(tgt); floatText(x, y - 140 * R.dpr, '+' + h + '灵', '#7ac8ff', 32 * R.dpr, false); }
    await fx('heal', u, [tgt]); return;
  }
  if (a.sk === 'catch') {
    const t = a.t[0]; Game.take('ysf', 1); Sfx.play('magic');
    await fx('catch', u, [t]);
    const ch = (1 - t.hp / t.mhp) * 0.9 + (Game.G.catchBonus || 0) + Game.treeVal('catch') - (t.elite ? 0.3 : 0);
    if (MONS[t.mon].pet && !t.boss && Math.random() < ch) { t.alive = false; t.dying = 1; t.caught = true; floatText(...uPos(t).map((v, i) => i ? v - 140 * R.dpr : v), '捕捉成功！', '#ffd23a', 34 * R.dpr, false); Game.addPet(t.mon, t.tier); Sfx.play('levelup'); }
    else floatText(...uPos(t).map((v, i) => i ? v - 140 * R.dpr : v), '挣脱了！', '#ff8a6a', 30 * R.dpr, false);
    await wait(500); return;
  }
  const S = SKILLS[a.sk] || SKILLS.atk;
  if (S.mp) u.mp -= S.mp;
  if (S.hpcost) u.hp = Math.max(1, u.hp - Math.round(u.mhp * S.hpcost));
  let targets = (a.t || []).filter(t => t.alive);
  if (S.tg === 'all') targets = alive(1 - u.side);
  if (!targets.length && S.tg === 'one') { const f = alive(1 - u.side); if (!f.length) return; targets = [f[Math.random() * f.length | 0]]; }
  if (S !== SKILLS.atk && u.isPlayer && S.k >= 1.4 && window.VFX && VFX.cutin) await VFX.cutin(u, S);
  if (S !== SKILLS.atk) { const [x, y] = uPos(u); floatText(x, y - 175 * R.dpr, S.n, ELEM[S.el] || '#ffe9a0', 30 * R.dpr, false); }
  const melee = S === SKILLS.atk || S.fx === 'slash' || S.fx === 'blood' || S.fx === 'coin';
  const times = (S === SKILLS.atk && u.combo && Math.random() < u.combo) ? 2 : (S !== SKILLS.atk && S.k > 0 && u.double && Math.random() < u.double) ? 2 : 1;
  for (let rep = 0; rep < times; rep++) {
    targets = targets.filter(t => t.alive); if (!targets.length) break;
    if (melee) {
      const t = targets[0]; const [tx, ty] = uPos(t); const dx = (tx - ux) * 0.8, dy = (ty - uy) * 0.8;
      await moveUnit(u, u.ox + dx, u.oy + dy, 260);
      const pa = playAttackAnim(u); await wait(170); Sfx.play(S.fx === 'coin' ? 'coin' : 'slash');
      await fx(S.fx, u, [t]); hitTargets(u, S, [t]); await pa;
      await moveUnit(u, 0, 0, 220);
    } else if (S.tg === 'self' || S.tg === 'ally') {
      playAttackAnim(u); await fx(S.fx, u, targets);
      for (const t of targets) {
        const [x, y] = uPos(t);
        if (S.heal) { const h = Math.round(t.mhp * S.heal * (1 + (u.skillBonus || 0) * 0.5)); t.hp = Math.min(t.mhp, t.hp + h); floatText(x, y - 140 * R.dpr, '+' + h, '#7aff8a', 32 * R.dpr, false); }
        if (S.mana) { const h = Math.round(t.mmp * S.mana); t.mp = Math.min(t.mmp, t.mp + h); floatText(x, y - 140 * R.dpr, '+' + h + '灵', '#7ac8ff', 30 * R.dpr, false); }
        if (S.buff) { t.buf[S.buff] = 3; floatText(x, y - 140 * R.dpr, S.buff === 'def' ? '防御提升' : '碰瓷准备', '#9ad8ff', 28 * R.dpr, false); }
      }
      await wait(250);
    } else {
      const pa = playAttackAnim(u); await wait(150);
      await fx(S.fx, u, targets); hitTargets(u, S, targets); await pa; await wait(120);
    }
  }
  await wait(160);
}
function hitTargets(u, S, targets) {
  for (const t of targets) {
    if (!t.alive) continue;
    const [x, y] = uPos(t);
    if (S.k === 0 && S.stun) { t.buf.stun = 2; floatText(x, y - 140 * R.dpr, '？？？我欠你钱？', '#ffe680', 26 * R.dpr, false); continue; }
    const r = calcDmg(u, t, S); let dm = r.dm;
    t.hp -= dm; t.anim = 'hurt'; t.flashT = 0.25; setTimeout(() => { if (t.alive) t.anim = 'idle'; }, 300 / B.speed);
    R.shake = Math.min(0.6, R.shake + (r.crit ? 0.5 : 0.25));
    floatText(x + (Math.random() - 0.5) * 30, y - 130 * R.dpr, (r.crit ? '暴击 ' : '') + '-' + dm, r.crit ? '#ffcf3a' : t.side ? '#fff' : '#ff6a5a', (r.crit ? 42 : 34) * R.dpr, false);
    if (r.tag) floatText(x, y - 175 * R.dpr, r.tag, '#ffd0a0', 22 * R.dpr, false);
    Sfx.play('hit', 0.6);
    if (S.stun && Math.random() < S.stun) t.buf.stun = 1;
    if (S.slow) t.buf.slow = 2;
    if (S.dot) t.buf.poison = 3;
    if (S.drain) u.hp = Math.min(u.mhp, u.hp + dm * S.drain);
    if (S.steal && !u.side) { const g = Math.round(5 * POW(t.tier || 0) * (1 + Math.random())); Game.G.stone += g; floatText(x, y - 175 * R.dpr, '+' + g + '灵石', '#ffd23a', 24 * R.dpr, false); }
    if (u.isPlayer && Game.eqFx('镇魂铃') && Math.random() < 0.15) t.buf.stun = 1;
    if ((t.buf.reflect > 0 || (t.isPlayer && Game.eqFx('照妖镜'))) && u.alive) { const rf = Math.round(dm * (t.buf.reflect > 0 ? 1 : 0.2)); t.buf.reflect = 0; u.hp -= rf; const [ax, ay] = uPos(u); floatText(ax, ay - 130 * R.dpr, '反弹 -' + rf, '#ffb0ff', 28 * R.dpr, false); if (u.hp <= 0) { u.hp = 0; kill(u); } }
    if (t.hp <= 0) { t.hp = 0; kill(t); }
  }
}
// --------- 技能特效 ---------
async function fx(kind, u, targets) {
  const [ux, uy] = uPos(u); const D = R.dpr; const H = 70 * D;
  const burst = (x, y, c, n = 18, sp = 260, r = 8, o = {}) => { for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, v = sp * (0.4 + Math.random()) * D; part(Object.assign({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60 * D, g: 300 * D, r: r * D, c, life: 0.6 + Math.random() * 0.4, world: false }, o)); } };
  const proj = async (x0, y0, x1, y1, c, ms = 320, r = 14) => { const t0 = performance.now(); while (true) { const k = Math.min(1, (performance.now() - t0) * B.speed / ms); const x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 60 * D; for (let q = 0; q < 3; q++) part({ x: x + (Math.random() - 0.5) * 10 * D, y: y + (Math.random() - 0.5) * 10 * D, vx: 0, vy: -30 * D, r: r * D * (0.6 + Math.random() * 0.6), c, life: 0.35, world: false }); if (k >= 1) break; await new Promise(r => requestAnimationFrame(r)); } };
  const T = targets.map(t => { const [x, y] = uPos(t); return [x, y - H]; });
  switch (kind) {
    case 'slash': for (const [x, y] of T) for (let k = 0; k < 14; k++) { const a = -0.8 + k * 0.12; part({ x: x + Math.cos(a) * 60 * D, y: y + Math.sin(a) * 60 * D, vx: -Math.sin(a) * 200 * D, vy: Math.cos(a) * 200 * D, r: 5 * D, c: '#fff', life: 0.25, world: false }); } break;
    case 'fire': Sfx.play('fire'); await proj(ux, uy - H, T[0][0], T[0][1], '#ff8a2a'); burst(T[0][0], T[0][1], '#ffb040', 26, 280, 10); R.flash = 0.15; break;
    case 'fireall': Sfx.play('fire'); for (const [x, y] of T) { for (let k = 0; k < 12; k++) part({ x: x + (Math.random() - 0.5) * 120 * D, y: y - 300 * D - Math.random() * 200 * D, vx: 80 * D, vy: 700 * D, r: 12 * D, c: '#ff7a2a', life: 0.45, world: false }); } await wait(380); for (const [x, y] of T) burst(x, y, '#ffb040', 20, 250, 10); R.flash = 0.2; break;
    case 'dark': case 'blood': Sfx.play('magic'); for (const [x, y] of T) burst(x, y, kind === 'blood' ? '#ff2a4a' : '#b04aff', 26, 260, 10); R.flash = 0.1; await wait(200); break;
    case 'ice': Sfx.play('ice'); for (let k = 0; k < 6; k++) part({ x: ux, y: uy - H, vx: (T[0][0] - ux) * 2.6, vy: (T[0][1] - uy + H) * 2.6, r: 5 * D, c: '#bff4ff', life: 0.38, world: false, line: true }); await wait(330); burst(T[0][0], T[0][1], '#dff8ff', 22, 220, 7); break;
    case 'iceall': Sfx.play('ice'); for (const [x, y] of T) for (let k = 0; k < 10; k++) part({ x: x + (Math.random() - 0.5) * 140 * D, y: y - 360 * D, vx: 0, vy: 900 * D, r: 5 * D, c: '#bff4ff', life: 0.4, world: false, line: true }); await wait(380); for (const [x, y] of T) burst(x, y, '#dff8ff', 16, 200, 7); break;
    case 'thunder': case 'thunderall': Sfx.play('thunder', 0.7); for (const [x, y] of T) makeBolt(x + (Math.random() - 0.5) * 80 * D, 0, x, y + H * 0.8); R.flash = 0.45; R.shake = 0.5; await wait(200); for (const [x, y] of T) burst(x, y + H * 0.5, '#e0d0ff', 16, 260, 6); break;
    case 'swordqi': Sfx.play('slash'); for (let k = 0; k < 16; k++) { const a = -0.9 + k * 0.12; part({ x: ux + Math.cos(a) * 50 * D, y: uy - H + Math.sin(a) * 50 * D, vx: (T[0][0] - ux) * 2.8, vy: (T[0][1] - uy + H) * 2.8, r: 6 * D, c: '#fff3a0', life: 0.36, world: false }); } await wait(330); burst(T[0][0], T[0][1], '#fff3a0', 16, 220, 6); break;
    case 'flysword': Sfx.play('whoosh'); for (let k = 0; k < 3; k++) part({ x: ux, y: uy - H * 1.4, vx: (T[0][0] - ux) * 2.2, vy: (T[0][1] - uy + H * 1.4) * 2.2, r: 10 * D, c: '#9ae8ff', life: 0.45, world: false, line: true }); await wait(420); R.flash = 0.2; burst(T[0][0], T[0][1], '#c8f4ff', 26, 300, 7); Sfx.play('slash'); break;
    case 'wanjian': Sfx.play('whoosh'); for (const [x, y] of T) for (let k = 0; k < 12; k++) part({ x: x + (Math.random() - 0.5) * 160 * D, y: y - 420 * D - Math.random() * 120 * D, vx: 0, vy: 1100 * D, r: 7 * D, c: '#e8f6ff', life: 0.4, world: false, line: true }); await wait(400); R.flash = 0.25; R.shake = 0.5; for (const [x, y] of T) burst(x, y, '#fff', 14, 200, 6); break;
    case 'heal': Sfx.play('heal'); for (const t of targets) { const [x, y] = uPos(t); for (let k = 0; k < 24; k++) part({ x: x + (Math.random() - 0.5) * 100 * D, y: y - Math.random() * 40 * D, vx: 0, vy: -120 * D * (0.5 + Math.random()), r: 5 * D, c: '#9aff9a', life: 0.9, world: false, star: 1 }); } await wait(350); break;
    case 'shield': Sfx.play('magic'); for (const t of targets) { const [x, y] = uPos(t); for (let k = 0; k < 3; k++) part({ x, y: y - H, vx: 0, vy: 0, r: (60 + k * 20) * D, c: '#9ad8ff', life: 0.7, world: false, ring: 1, shrink: false }); } await wait(300); break;
    case 'quake': Sfx.play('hit'); R.shake = 0.9; for (const [x, y] of T) burst(x, y + H * 0.8, '#b08a5a', 22, 300, 9, { add: false }); await wait(300); break;
    case 'water': Sfx.play('magic'); await proj(ux, uy - H, T[0][0], T[0][1], '#4ab0ff', 360, 16); burst(T[0][0], T[0][1], '#9ad8ff', 26, 260, 9); break;
    case 'vine': case 'poison': Sfx.play('magic'); for (const [x, y] of T) for (let k = 0; k < 16; k++) part({ x: x + (Math.random() - 0.5) * 90 * D, y: y + H, vx: 0, vy: -260 * D, r: 6 * D, c: kind === 'vine' ? '#6aff6a' : '#a0ff4a', life: 0.5, world: false, ring: kind === 'poison' ? 1 : 0 }); await wait(320); break;
    case 'deny': Sfx.play('fail'); for (const [x, y] of T) for (let k = 0; k < 8; k++) part({ x: x + (Math.random() - 0.5) * 100 * D, y, vx: (Math.random() - 0.5) * 100 * D, vy: -150 * D, r: 10 * D, c: '#f6ecd0', life: 0.8, world: false, add: false }); await wait(300); break;
    case 'coin': burst(T[0][0], T[0][1], '#ffd23a', 18, 260, 7); break;
    case 'light': Sfx.play('magic'); R.flash = 0.5; for (const [x, y] of T) burst(x, y, '#fff2a0', 24, 300, 7, { star: 1 }); await wait(250); break;
    case 'catch': for (let k = 0; k < 20; k++) part({ x: T[0][0] + Math.cos(k) * 80 * D, y: T[0][1] + Math.sin(k) * 40 * D, vx: -Math.cos(k) * 120 * D, vy: -Math.sin(k) * 60 * D, r: 6 * D, c: '#ffe680', life: 0.6, world: false, star: 1 }); await wait(400); break;
  }
}
function endBattle(res) {
  B.on = false; UI.battleUI(false);
  const P = B.units.find(u => u.isPlayer); Game.G.hp = Math.max(1, Math.round(P.hp)); Game.G.mp = Math.max(0, Math.round(P.mp));
  const killed = B.units.filter(u => u.side === 1 && !u.alive && !u.caught);
  const pet = B.units.find(u => u.isPet); if (pet) Game.petAfterBattle(pet);
  R.mode = 'map'; R.parts = []; R.texts = [];
  const r = B.resolve; B.resolve = null;
  r && r({ res, killed, units: B.units });
}

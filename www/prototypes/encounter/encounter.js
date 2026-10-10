'use strict';
(() => {
  const W = 960, H = 570;
  const canvas = document.getElementById('arena');
  const ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const dom = {
    badge: $('screen-badge'), hint: $('arena-hint'), map: $('map-screen'), battle: $('battle-screen'), result: $('result-screen'),
    title: $('result-title'), kicker: $('result-kicker'), message: $('result-message'), hpLabel: $('hp-label'), hpBar: $('player-hp-bar'),
    enemies: $('enemy-list'), pad: $('move-pad'), knob: $('move-knob'), attack: $('attack-btn'), skill: $('skill-btn'), dodge: $('dodge-btn')
  };
  const held = new Set();
  const input = { x: 0, y: 0 };
  let pointerId = null;
  let lastTime = performance.now();
  let uiClock = 0;
  let toastTimer = 0;
  let lastToast = '';

  const state = {
    screen: 'map', result: null, time: 0, hero: null, enemies: [], projectiles: [], effects: [],
    shotsFired: 0, damageReceived: 0, attackCount: 0, skillCount: 0, dodgeCount: 0
  };

  function newHero() {
    return { x: 480, y: 432, r: 17, hp: 180, maxHp: 180, faceX: 0, faceY: -1,
      attackCooldown: 0, skillCooldown: 0, dodgeCooldown: 0, dodgeInvuln: 0, hitFlash: 0,
      attackAnim: 0, skillAnim: 0, dodgeCount: 0, attackCount: 0, skillCount: 0 };
  }
  function startEncounter() {
    state.screen = 'battle'; state.result = null; state.time = 0;
    state.hero = newHero(); state.projectiles = []; state.effects = [];
    state.shotsFired = 0; state.damageReceived = 0; state.attackCount = 0; state.skillCount = 0; state.dodgeCount = 0;
    state.enemies = [
      makeEnemy('山魈·青', 335, 170, 0.65),
      makeEnemy('山魈·赤', 625, 170, 1.15)
    ];
    input.x = 0; input.y = 0; held.clear(); resetPad();
    dom.map.hidden = true; dom.result.hidden = true; dom.battle.hidden = false;
    dom.badge.textContent = '遭遇战'; dom.hint.textContent = '红色落点预警后会射出灵弹';
    updateHud();
  }
  function makeEnemy(name, x, y, cooldown) {
    return { name, x, y, r: 22, hp: 72, maxHp: 72, speed: 55, attackCooldown: cooldown,
      telegraph: 0, aimX: 0, aimY: 0, contactCooldown: 0, hitFlash: 0, alive: true, attacks: 0 };
  }
  function returnToMap() {
    state.screen = 'map'; state.result = null; state.projectiles = []; state.effects = [];
    dom.battle.hidden = true; dom.result.hidden = true; dom.map.hidden = false;
    dom.badge.textContent = '安全地图'; dom.hint.textContent = '暂时安全'; input.x = 0; input.y = 0; held.clear(); resetPad();
  }
  function finish(result) {
    if (state.screen !== 'battle') return;
    state.screen = 'result'; state.result = result;
    dom.battle.hidden = true; dom.result.hidden = false;
    dom.badge.textContent = result === 'win' ? '遭遇胜利' : '遭遇失败';
    dom.hint.textContent = result === 'win' ? '山路重新畅通' : '试炼暂告一段落';
    dom.kicker.textContent = result === 'win' ? '遭遇胜利' : '遭遇失败';
    dom.title.textContent = result === 'win' ? '山路重新畅通' : '这次没能守住';
    dom.message.textContent = result === 'win'
      ? `两只山魈都已退散。你承受了 ${state.damageReceived} 点伤害；可以再打一轮，或回练习地图。`
      : `你在试炼中受到 ${state.damageReceived} 点伤害。调整走位、抓住预警间隙闪避，再试一次。`;
  }
  function showToast(text) {
    lastToast = text;
    dom.hint.textContent = text;
    toastTimer = 1.25;
  }
  function update(dt) {
    if (state.screen !== 'battle') return;
    state.time += dt;
    const h = state.hero;
    h.attackCooldown = Math.max(0, h.attackCooldown - dt);
    h.skillCooldown = Math.max(0, h.skillCooldown - dt);
    h.dodgeCooldown = Math.max(0, h.dodgeCooldown - dt);
    h.dodgeInvuln = Math.max(0, h.dodgeInvuln - dt);
    h.hitFlash = Math.max(0, h.hitFlash - dt);
    h.attackAnim = Math.max(0, h.attackAnim - dt);
    h.skillAnim = Math.max(0, h.skillAnim - dt);

    let kx = (held.has('d') || held.has('arrowright') ? 1 : 0) - (held.has('a') || held.has('arrowleft') ? 1 : 0);
    let ky = (held.has('s') || held.has('arrowdown') ? 1 : 0) - (held.has('w') || held.has('arrowup') ? 1 : 0);
    if (Math.hypot(input.x, input.y) > 0.05) { kx = input.x; ky = input.y; }
    const len = Math.hypot(kx, ky);
    if (len > 0.05) {
      kx /= Math.max(1, len); ky /= Math.max(1, len);
      h.x += kx * 228 * dt; h.y += ky * 228 * dt;
      h.faceX = kx; h.faceY = ky;
    }
    h.x = clamp(h.x, 34, W - 34); h.y = clamp(h.y, 72, H - 34);

    for (const e of state.enemies) {
      if (!e.alive) continue;
      e.attackCooldown = Math.max(0, e.attackCooldown - dt);
      e.contactCooldown = Math.max(0, e.contactCooldown - dt);
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      const dx = h.x - e.x, dy = h.y - e.y, d = Math.hypot(dx, dy) || 1;
      if (e.telegraph > 0) {
        e.telegraph -= dt;
        if (e.telegraph <= 0) {
          const ax = e.aimX - e.x, ay = e.aimY - e.y, al = Math.hypot(ax, ay) || 1;
          state.projectiles.push({ x: e.x, y: e.y, vx: ax / al * 345, vy: ay / al * 345, r: 8, life: 2.8, from: e.name });
          state.shotsFired++; e.attacks++; e.attackCooldown = 2.05;
          state.effects.push({ x: e.x, y: e.y, age: 0, life: .24, kind: 'muzzle' });
        }
      } else {
        if (d > 62) { e.x += dx / d * e.speed * dt; e.y += dy / d * e.speed * dt; }
        if (e.attackCooldown <= 0 && d < 390) {
          e.aimX = clamp(h.x, 32, W - 32); e.aimY = clamp(h.y, 74, H - 32); e.telegraph = .78;
        }
      }
      const touchD = Math.hypot(h.x - e.x, h.y - e.y);
      if (touchD < h.r + e.r + 2 && e.contactCooldown <= 0) {
        if (h.dodgeInvuln <= 0) damageHero(7, '山魈撞击');
        e.contactCooldown = .95;
      }
    }

    for (const p of state.projectiles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life > 0 && Math.hypot(h.x - p.x, h.y - p.y) < h.r + p.r + 5) {
        if (h.dodgeInvuln <= 0) damageHero(18, '灵弹');
        p.life = 0;
        state.effects.push({ x: p.x, y: p.y, age: 0, life: .32, kind: 'impact' });
      }
    }
    state.projectiles = state.projectiles.filter(p => p.life > 0 && p.x > -30 && p.x < W + 30 && p.y > -30 && p.y < H + 30);
    for (const fx of state.effects) fx.age += dt;
    state.effects = state.effects.filter(fx => fx.age < fx.life);
    if (toastTimer > 0) { toastTimer = Math.max(0, toastTimer - dt); if (!toastTimer) dom.hint.textContent = '留意红色落点预警'; }
    if (h.hp <= 0) finish('lose');
    else if (state.enemies.every(e => !e.alive)) finish('win');
  }
  function damageHero(amount) {
    if (state.hero.dodgeInvuln > 0) return;
    state.hero.hp = Math.max(0, state.hero.hp - amount);
    state.hero.hitFlash = .2; state.damageReceived += amount;
  }
  function attack() {
    if (state.screen !== 'battle') return;
    const h = state.hero;
    if (h.attackCooldown > 0) return;
    h.attackCooldown = .4; h.attackAnim = .2; h.attackCount++; state.attackCount++;
    const candidates = state.enemies.filter(e => e.alive).map(e => ({ e, d: Math.hypot(e.x - h.x, e.y - h.y) })).filter(x => x.d < 116).sort((a,b) => a.d-b.d);
    if (!candidates.length) { showToast('普攻距离不够，靠近山魈'); return; }
    const target = candidates[0].e, dx = target.x - h.x, dy = target.y - h.y, d = Math.hypot(dx,dy) || 1;
    h.faceX = dx/d; h.faceY = dy/d;
    damageEnemy(target, 27);
    state.effects.push({ x: target.x, y: target.y, age: 0, life: .28, kind: 'slash' });
  }
  function castSkill() {
    if (state.screen !== 'battle') return;
    const h = state.hero;
    if (h.skillCooldown > 0) { showToast(`雷击冷却 ${h.skillCooldown.toFixed(1)} 秒`); return; }
    const targets = state.enemies.filter(e => e.alive && Math.hypot(e.x-h.x,e.y-h.y) < 178);
    if (!targets.length) { showToast('雷击范围不够，靠近山魈'); return; }
    h.skillCooldown = 3.25; h.skillAnim = .38; h.skillCount++; state.skillCount++;
    for (const e of targets) { damageEnemy(e, 38); state.effects.push({ x:e.x, y:e.y, age:0, life:.48, kind:'thunder' }); }
  }
  function damageEnemy(e, amount) {
    e.hp = Math.max(0, e.hp - amount); e.hitFlash = .18;
    const dx = e.x - state.hero.x, dy = e.y - state.hero.y, d = Math.hypot(dx,dy) || 1;
    e.x = clamp(e.x + dx/d*9, 28, W-28); e.y = clamp(e.y + dy/d*9, 70, H-28);
    if (e.hp <= 0) { e.alive = false; state.effects.push({x:e.x,y:e.y,age:0,life:.65,kind:'poof'}); }
  }
  function dodge() {
    if (state.screen !== 'battle') return;
    const h = state.hero;
    if (h.dodgeCooldown > 0) { showToast(`闪避冷却 ${h.dodgeCooldown.toFixed(1)} 秒`); return; }
    let dx = input.x, dy = input.y;
    if (Math.hypot(dx,dy) < .1) {
      dx = (held.has('d') || held.has('arrowright') ? 1 : 0) - (held.has('a') || held.has('arrowleft') ? 1 : 0);
      dy = (held.has('s') || held.has('arrowdown') ? 1 : 0) - (held.has('w') || held.has('arrowup') ? 1 : 0);
    }
    if (Math.hypot(dx,dy) < .1) { dx = h.faceX; dy = h.faceY; }
    const d = Math.hypot(dx,dy) || 1; dx /= d; dy /= d;
    h.x = clamp(h.x + dx*142, 34, W-34); h.y = clamp(h.y + dy*142, 72, H-34);
    h.faceX = dx; h.faceY = dy; h.dodgeInvuln = .46; h.dodgeCooldown = 1.05; h.dodgeCount++; state.dodgeCount++;
    state.effects.push({x:h.x,y:h.y,age:0,life:.36,kind:'dodge'});
  }
  function updateHud() {
    if (!state.hero) return;
    const h = state.hero;
    dom.hpLabel.textContent = `${Math.ceil(h.hp)} / ${h.maxHp}`;
    dom.hpBar.style.width = `${Math.max(0, h.hp / h.maxHp * 100)}%`;
    dom.attack.classList.toggle('cooling', h.attackCooldown > 0);
    dom.skill.classList.toggle('cooling', h.skillCooldown > 0);
    dom.dodge.classList.toggle('cooling', h.dodgeCooldown > 0);
    dom.enemies.innerHTML = state.enemies.map((e, i) => `<div class="enemy-card${e.alive ? '' : ' dead'}" data-enemy="${i}"><div class="enemy-heading"><span>${escapeHtml(e.name)}</span><span>${Math.ceil(e.hp)} / ${e.maxHp}</span></div><div class="enemy-meter"><i style="width:${Math.max(0,e.hp/e.maxHp*100)}%"></i></div></div>`).join('');
  }
  function render(now) {
    ctx.clearRect(0,0,W,H);
    drawLandscape();
    if (state.screen === 'battle' || state.screen === 'result') {
      for (const e of state.enemies) if (e.alive || state.screen === 'result') drawEnemy(e, now);
      for (const p of state.projectiles) drawProjectile(p, now);
      if (state.hero) drawHero(state.hero, now);
      for (const fx of state.effects) drawEffect(fx);
    } else {
      drawMapSilhouettes();
    }
    if (now - uiClock > 110) { uiClock = now; updateHud(); }
  }
  function drawLandscape() {
    const g = ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#263d3a'); g.addColorStop(.38,'#52684f'); g.addColorStop(.39,'#78815c'); g.addColorStop(1,'#4c5941');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#354a43'; ctx.beginPath(); ctx.moveTo(0,218); ctx.lineTo(100,95); ctx.lineTo(202,218); ctx.lineTo(327,82); ctx.lineTo(485,220); ctx.lineTo(620,110); ctx.lineTo(760,224); ctx.lineTo(866,104); ctx.lineTo(960,208); ctx.lineTo(960,325); ctx.lineTo(0,325); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#425943'; ctx.beginPath(); ctx.moveTo(0,250); ctx.lineTo(142,151); ctx.lineTo(277,256); ctx.lineTo(415,142); ctx.lineTo(555,260); ctx.lineTo(708,157); ctx.lineTo(848,258); ctx.lineTo(960,168); ctx.lineTo(960,340); ctx.lineTo(0,340); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#687451'; ctx.fillRect(0,257,W,H-257);
    ctx.save(); ctx.beginPath(); ctx.roundRect(28,78,W-56,H-105,28); ctx.clip();
    ctx.fillStyle='rgba(201,190,137,.13)';
    for(let y=286;y<H;y+=42){ctx.fillRect(28,y,W-56,1);}
    for(let x=68;x<W;x+=76){ctx.fillRect(x,260,1,H-270);}
    ctx.strokeStyle='rgba(232,214,160,.19)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(W/2,365,365,135,0,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='rgba(232,214,160,.1)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(W/2,365,337,116,0,0,Math.PI*2);ctx.stroke();
    for(const [x,y,s] of [[95,328,1],[858,343,.9],[150,454,.7],[798,450,.8]]) drawStone(x,y,s);
    for(const [x,y] of [[115,260],[834,264],[55,390],[905,416]]) drawShrub(x,y);
    ctx.restore();
    ctx.strokeStyle='rgba(229,217,177,.4)';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(28,78,W-56,H-105,28);ctx.stroke();
    ctx.fillStyle='rgba(13,23,20,.55)';ctx.font='600 18px system-ui';ctx.textAlign='center';ctx.fillText('赤 松 坡',W/2,113);
    ctx.textAlign='left';
  }
  function drawStone(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#3f4940';ctx.beginPath();ctx.ellipse(0,0,18,8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#85856a';ctx.beginPath();ctx.ellipse(-2,-3,15,7,-.08,Math.PI,Math.PI*2);ctx.fill();ctx.restore();}
  function drawShrub(x,y){ctx.fillStyle='#344e3d';ctx.beginPath();ctx.arc(x,y,16,0,Math.PI*2);ctx.arc(x+12,y+3,12,0,Math.PI*2);ctx.arc(x-11,y+5,11,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8f9a62';ctx.beginPath();ctx.arc(x-5,y-5,4,0,Math.PI*2);ctx.arc(x+10,y-1,3,0,Math.PI*2);ctx.fill();}
  function drawMapSilhouettes(){
    drawStone(360,430,1.2); drawShrub(310,366); drawShrub(645,365);
    ctx.fillStyle='#13201e';ctx.globalAlpha=.45;ctx.beginPath();ctx.ellipse(480,443,20,8,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    ctx.fillStyle='#dfbd82';ctx.beginPath();ctx.arc(480,410,13,0,Math.PI*2);ctx.fill();ctx.fillStyle='#536c59';ctx.beginPath();ctx.moveTo(460,437);ctx.quadraticCurveTo(480,421,500,437);ctx.lineTo(494,464);ctx.lineTo(466,464);ctx.closePath();ctx.fill();
    drawTinySlime(338,273,'#82b58b');drawTinySlime(620,273,'#ce806b');
    ctx.fillStyle='rgba(245,230,193,.78)';ctx.font='500 14px system-ui';ctx.textAlign='center';ctx.fillText('前方有两只山魈，点击下方按钮开始试炼',480,514);ctx.textAlign='left';
  }
  function drawHero(h,now){
    const flicker=h.dodgeInvuln>0 && Math.floor(now/65)%2===0;
    ctx.save();ctx.globalAlpha=flicker?.45:1;
    ctx.fillStyle='rgba(12,18,15,.35)';ctx.beginPath();ctx.ellipse(h.x,h.y+12,21,9,0,0,Math.PI*2);ctx.fill();
    if(h.dodgeInvuln>0){ctx.strokeStyle='rgba(141,223,218,.65)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(h.x,h.y,29+(0.46-h.dodgeInvuln)*20,0,Math.PI*2);ctx.stroke();}
    ctx.fillStyle=h.hitFlash>0?'#f5c1a0':'#557f76';ctx.beginPath();ctx.moveTo(h.x-17,h.y-3);ctx.quadraticCurveTo(h.x-14,h.y-19,h.x,h.y-18);ctx.quadraticCurveTo(h.x+16,h.y-17,h.x+19,h.y-2);ctx.lineTo(h.x+14,h.y+13);ctx.lineTo(h.x-13,h.y+13);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ecd2a7';ctx.beginPath();ctx.arc(h.x,h.y-18,10,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#374c47';ctx.beginPath();ctx.arc(h.x,h.y-21,11,Math.PI,Math.PI*2);ctx.lineTo(h.x+8,h.y-19);ctx.lineTo(h.x-8,h.y-18);ctx.fill();
    const sx=h.x+h.faceX*18, sy=h.y+h.faceY*17;
    ctx.strokeStyle='#d5d6c1';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+h.faceX*22,sy+h.faceY*22);ctx.stroke();
    ctx.strokeStyle='#a98756';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(sx-h.faceY*3,sy+h.faceX*3);ctx.lineTo(sx+h.faceY*3,sy-h.faceX*3);ctx.stroke();
    if(h.attackAnim>0){ctx.strokeStyle='rgba(249,236,190,.8)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(h.x+h.faceX*20,h.y+h.faceY*18,31,-.8,.75);ctx.stroke();}
    if(h.skillAnim>0){ctx.strokeStyle=`rgba(122,220,235,${h.skillAnim*1.7})`;ctx.lineWidth=5;ctx.beginPath();ctx.arc(h.x,h.y,42+(.38-h.skillAnim)*125,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  function drawEnemy(e,now){
    if(!e.alive && state.screen==='result')return;
    if(e.telegraph>0){
      const pulse=.8+.2*Math.sin(now/55);
      ctx.save();ctx.strokeStyle=`rgba(246,94,75,${.6+.25*pulse})`;ctx.fillStyle='rgba(224,63,52,.16)';ctx.lineWidth=3;ctx.setLineDash([9,6]);
      ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.aimX,e.aimY);ctx.stroke();ctx.setLineDash([]);
      ctx.beginPath();ctx.arc(e.aimX,e.aimY,29*pulse,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#ffe1cf';ctx.font='700 12px system-ui';ctx.textAlign='center';ctx.fillText('即将射击',e.aimX,e.aimY-38);ctx.restore();
    }
    ctx.save();ctx.globalAlpha=e.alive?1:.35;
    ctx.fillStyle='rgba(12,18,15,.35)';ctx.beginPath();ctx.ellipse(e.x,e.y+16,27,10,0,0,Math.PI*2);ctx.fill();
    const base=e.hitFlash>0?'#f0c5a4':(e.name.includes('青')?'#72ab86':'#c77760');
    ctx.fillStyle=base;ctx.beginPath();ctx.moveTo(e.x-e.r,e.y+5);ctx.quadraticCurveTo(e.x-e.r-1,e.y-15,e.x-8,e.y-19);ctx.quadraticCurveTo(e.x+2,e.y-27,e.x+e.r-1,e.y-11);ctx.quadraticCurveTo(e.x+e.r+3,e.y+5,e.x+13,e.y+12);ctx.quadraticCurveTo(e.x,e.y+20,e.x-e.r,e.y+5);ctx.fill();
    ctx.fillStyle='#f1d9ae';ctx.beginPath();ctx.arc(e.x-7,e.y-5,2.2,0,Math.PI*2);ctx.arc(e.x+7,e.y-5,2.2,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(22,25,21,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y+1,5,.15,Math.PI-.15);ctx.stroke();
    ctx.fillStyle='rgba(14,22,18,.8)';ctx.fillRect(e.x-25,e.y-39,50,5);ctx.fillStyle='#eea279';ctx.fillRect(e.x-25,e.y-39,50*e.hp/e.maxHp,5);
    ctx.fillStyle='#f1e1c8';ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillText(e.name,e.x,e.y-46);ctx.restore();
  }
  function drawTinySlime(x,y,color){ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(x,y+13,18,7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,16,Math.PI,Math.PI*2);ctx.quadraticCurveTo(x+18,y+14,x,y+14);ctx.quadraticCurveTo(x-18,y+14,x-16,y);ctx.fill();ctx.fillStyle='#25332d';ctx.fillRect(x-6,y-2,3,3);ctx.fillRect(x+4,y-2,3,3);}
  function drawProjectile(p,now){ctx.save();ctx.shadowBlur=18;ctx.shadowColor='#ffb45a';ctx.fillStyle='#ffd27b';ctx.beginPath();ctx.arc(p.x,p.y,p.r+2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,227,162,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x-p.vx*.045,p.y-p.vy*.045);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.restore();}
  function drawEffect(fx){const t=fx.age/fx.life;ctx.save();if(fx.kind==='slash'){ctx.strokeStyle=`rgba(255,236,185,${1-t})`;ctx.lineWidth=5;ctx.beginPath();ctx.arc(fx.x,fx.y,14+t*26,-.9,.9);ctx.stroke();}else if(fx.kind==='thunder'){ctx.strokeStyle=`rgba(126,226,244,${1-t})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(fx.x,fx.y,12+t*38,0,Math.PI*2);ctx.stroke();}else if(fx.kind==='dodge'){ctx.strokeStyle=`rgba(145,225,222,${1-t})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(fx.x,fx.y,18+t*30,0,Math.PI*2);ctx.stroke();}else if(fx.kind==='poof'||fx.kind==='impact'||fx.kind==='muzzle'){ctx.fillStyle=`rgba(243,199,125,${1-t})`;ctx.beginPath();ctx.arc(fx.x,fx.y,7+t*20,0,Math.PI*2);ctx.fill();}ctx.restore();}
  function resetPad(){dom.pad.classList.remove('active');dom.knob.style.transform='translate(-50%,-50%)';}
  function setPadFromPointer(event){const r=dom.pad.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=(event.clientX-cx)/(r.width*.36),dy=(event.clientY-cy)/(r.height*.36);const len=Math.hypot(dx,dy);if(len>1){dx/=len;dy/=len;}input.x=dx;input.y=dy;const travel=r.width*.28;dom.knob.style.transform=`translate(calc(-50% + ${dx*travel}px),calc(-50% + ${dy*travel}px))`;}
  dom.pad.addEventListener('pointerdown',event=>{if(state.screen!=='battle')return;pointerId=event.pointerId;dom.pad.setPointerCapture(pointerId);dom.pad.classList.add('active');setPadFromPointer(event);event.preventDefault();});
  dom.pad.addEventListener('pointermove',event=>{if(pointerId===event.pointerId)setPadFromPointer(event);});
  function releasePad(event){if(pointerId===null||event.pointerId!==undefined&&pointerId!==event.pointerId)return;pointerId=null;input.x=0;input.y=0;resetPad();}
  dom.pad.addEventListener('pointerup',releasePad);dom.pad.addEventListener('pointercancel',releasePad);dom.pad.addEventListener('lostpointercapture',releasePad);
  $('start-encounter').addEventListener('click',startEncounter);
  $('retry-btn').addEventListener('click',startEncounter);
  $('return-map-btn').addEventListener('click',returnToMap);
  dom.attack.addEventListener('click',attack);dom.skill.addEventListener('click',castSkill);dom.dodge.addEventListener('click',dodge);
  const movementKeys=new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright']);
  window.addEventListener('keydown',event=>{const key=event.key.toLowerCase();if(movementKeys.has(key)){held.add(key);event.preventDefault();}else if(!event.repeat&&key==='j'){attack();}else if(!event.repeat&&key==='k'){castSkill();}else if(!event.repeat&&key===' '){dodge();event.preventDefault();}});
  window.addEventListener('keyup',event=>held.delete(event.key.toLowerCase()));
  window.addEventListener('blur',()=>{held.clear();input.x=0;input.y=0;resetPad();});
  function frame(now){const dt=Math.min(.05,Math.max(0,(now-lastTime)/1000));lastTime=now;update(dt);render(now);requestAnimationFrame(frame);}
  function inspect(){
    const h=state.hero;
    return {screen:state.screen,result:state.result,time:Number(state.time.toFixed(2)),shotsFired:state.shotsFired,damageReceived:state.damageReceived,attackCount:state.attackCount,skillCount:state.skillCount,dodgeCount:state.dodgeCount,
      hero:h?{x:Number(h.x.toFixed(1)),y:Number(h.y.toFixed(1)),hp:Number(h.hp.toFixed(1)),maxHp:h.maxHp,attackCooldown:Number(h.attackCooldown.toFixed(2)),skillCooldown:Number(h.skillCooldown.toFixed(2)),dodgeCooldown:Number(h.dodgeCooldown.toFixed(2)),dodgeInvuln:Number(h.dodgeInvuln.toFixed(2)),attackCount:h.attackCount,skillCount:h.skillCount,dodgeCount:h.dodgeCount}:null,
      enemies:state.enemies.map(e=>({name:e.name,x:Number(e.x.toFixed(1)),y:Number(e.y.toFixed(1)),hp:Number(e.hp.toFixed(1)),maxHp:e.maxHp,alive:e.alive,telegraphTime:Number(Math.max(0,e.telegraph).toFixed(2)),attacks:e.attacks})),projectiles:state.projectiles.length};
  }
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  window.EncounterPrototype=Object.freeze({inspect});
  requestAnimationFrame(frame);
})();

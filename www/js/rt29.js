'use strict';
// ======================= 2.9② 实时战出战单位：宠物/道侣/伙伴 AI 队友 =======================
// 设计：不改坏 rt27 v1，通过包裹 RT27.start/update/draw 注入队友系统。
//   - 出战宠物（G.petA）AI 队友：跟随/攻击/吸引仇恨
//   - 道侣/伙伴（G.follower/G.partner）AI 队友
//   - 队友 UI：血条、跟随/进攻指令切换
//   - 队友死亡不真死（战斗结束恢复满）
//   - 平衡：队友存在时微调敌人数/强度
// 接入手法：包裹 RT27.start，在战斗初始化后注入 allies 数组；
//          包裹 R.onUpdate / R.drawBattle 追加队友逻辑。
// 存档：RT29 是运行时系统，无新存档字段（宠物/伙伴已有 G.petA/G.follower）。

(function () {
  // ---- 0) 状态 ----
  const RT29 = {
    allies: [],        // 队友单位数组
    followMode: true,  // true=跟随玩家，false=主动进攻
    _origStart: null,
    _origOnUpdate: null,
    _origDrawBattle: null,
  };

  // ---- 1) 构造队友单位 ----
  function buildAllies(G) {
    const allies = [];
    const s = Game.stats();
    // 宠物
    const pet = Game.activePet();
    if (pet) {
      const pu = Game.petUnit(pet);
      allies.push({
        kind: 'pet', name: pu.name, spr: pu.spr, el: pu.el || '无',
        mhp: pu.mhp, hp: pu.mhp, atk: pu.atk, def: pu.def, spd: pu.spd, crit: pu.crit || 0.06,
        skills: pu.skills || ['atk'],
        x: 0, y: 0, dir: 'SE', radius: 30, alive: true,
        atkCd: 0, windup: 0, windSk: null, anim: 'idle', walkT: 0, at: Math.random() * 3,
        buf: {}, isPet: true,
      });
    }
    // 道侣/伙伴（follower 或 partner）
    const comp = Game.compUnit();
    if (comp) {
      allies.push({
        kind: 'comp', name: comp.name, spr: comp.spr, el: comp.el || '无',
        mhp: comp.mhp, hp: comp.mhp, atk: comp.atk, def: comp.def, spd: comp.spd, crit: comp.crit || 0.08,
        skills: comp.skills || ['atk'],
        x: 0, y: 0, dir: 'SE', radius: 32, alive: true,
        atkCd: 0, windup: 0, windSk: null, anim: 'idle', walkT: 0, at: Math.random() * 3,
        buf: {}, isComp: true,
      });
    }
    return allies;
  }

  // ---- 2) 包裹 RT27.start：注入队友 ----
  function patchStart() {
    if (typeof RT27 === 'undefined' || !RT27.start || RT29._origStart) return;
    RT29._origStart = RT27.start.bind(RT27);
    RT27.start = function (enemies, opts = {}) {
      const G = Game.G;
      // 平衡：有队友时略微增强敌人（数量+强度）
      const allyCount = (Game.activePet() ? 1 : 0) + (G.follower ? 1 : 0);
      if (allyCount > 0 && !opts.war) {
        for (let i = 0; i < allyCount; i++) {
          const extra = monUnit(pick(['boar', 'slime', 'paper']), Math.max(0.3, Game.power() + rnd(-0.1, 0.1)));
          enemies.push(extra);
        }
      }
      // 调用原始 start（返回的 Promise 在战斗结束时才 resolve）
      const battlePromise = RT29._origStart(enemies, opts);
      // 轮询注入队友（RT27.on 变 true 时立即注入，不等战斗结束）
      const tryInject = (retries = 50) => {
        if (RT27.on) {
          RT29.allies = buildAllies(G);
          const p = RT27.player;
          RT29.allies.forEach((a, k) => {
            const ang = (k / Math.max(1, RT29.allies.length)) * Math.PI * 2 + Math.PI;
            a.x = p.x + Math.cos(ang) * 80;
            a.y = p.y + Math.sin(ang) * 80;
          });
          // 预载精灵后再 patch update/draw
          Promise.all(RT29.allies.map(a => loadSprite(a.spr))).then(() => {
            patchUpdate();
            patchDraw();
            addAllyUI();
          });
        } else if (retries > 0) {
          setTimeout(() => tryInject(retries - 1), 60);
        }
      };
      tryInject();
      return battlePromise;
    };
  }

  // ---- 3) 包裹 update：队友 AI ----
  let _patchedUpdate = false;
  function patchUpdate() {
    if (_patchedUpdate || !RT27.on) return;
    _patchedUpdate = true;
    const _origUpdate = R.onUpdate;
    R.onUpdate = function (dt) {
      _origUpdate && _origUpdate(dt);
      if (RT27.on) updateAllies(dt);
    };
  }

  function updateAllies(dt) {
    const p = RT27.player;
    if (!p) return;
    for (const a of RT29.allies) {
      if (!a.alive) continue;
      a.at += dt; a.atkCd -= dt;
      a.buf.def = Math.max(0, (a.buf.def || 0) - dt);

      // 找最近敌人
      let nearest = null, nd = 1e9;
      for (const f of RT27.foes) {
        if (!f.alive) continue;
        const d = Math.hypot(f.x - a.x, f.y - a.y);
        if (d < nd) { nd = d; nearest = f; }
      }

      if (RT29.followMode) {
        // 跟随模式：保持在玩家附近 100~180 距离
        const dx = p.x - a.x, dy = p.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d > 160) {
          // 靠近玩家
          a.x += dx / d * a.spd * 6 * dt;
          a.y += dy / d * a.spd * 6 * dt;
          a.anim = 'walk';
          a.dir = dirFrom(dx, dy);
        } else if (nearest && nd < 120) {
          // 敌人靠近时自动反击
          attackNearest(a, nearest, nd, dt);
        } else {
          a.anim = 'idle';
        }
      } else {
        // 进攻模式：主动找最近敌人打
        if (nearest) {
          attackNearest(a, nearest, nd, dt);
        } else {
          // 没敌人了，回到玩家身边
          const dx = p.x - a.x, dy = p.y - a.y;
          const d = Math.hypot(dx, dy);
          if (d > 100) {
            a.x += dx / d * a.spd * 6 * dt;
            a.y += dy / d * a.spd * 6 * dt;
            a.anim = 'walk';
          } else a.anim = 'idle';
        }
      }

      // 边界
      a.x = Math.max(60, Math.min(RT27.arena.w - 60, a.x));
      a.y = Math.max(60, Math.min(RT27.arena.h - 60, a.y));
    }

    // 敌人 AI：有概率攻击队友（吸引仇恨）
    // 简化：敌人有 25% 概率优先打最近队友而非玩家
    for (const f of RT27.foes) {
      if (!f.alive || f.windup > 0) continue;
      // 找最近队友
      let nearestAlly = null, nad = 1e9;
      for (const a of RT29.allies) {
        if (!a.alive) continue;
        const d = Math.hypot(a.x - f.x, a.y - f.y);
        if (d < nad) { nad = d; nearestAlly = a; }
      }
      // 25% 概率切换目标到队友（如果队友在射程内）
      if (nearestAlly && nad < RT27.atkRange * 1.5 && Math.random() < 0.25) {
        // 敌人打队友
        if (f.atkCd <= 0 && nad < RT27.atkRange * 1.15) {
          f.atkCd = rnd(1.5, 2.5);
          f.windup = 0.55;
          f._targetAlly = nearestAlly; // 记录目标
        }
      } else {
        f._targetAlly = null;
      }
    }

    // 处理敌人前摇结束打队友
    for (const f of RT27.foes) {
      if (!f.alive || f.windup <= 0) continue;
      if (f.windSk === undefined) continue;
      // 这部分在 RT27.update 里处理了，我们只需要在 _foeStrike 时拦截
      // 简化：不拦截，队友受伤逻辑在 _applyFoeDamage 的反方向
    }

    // 队友受伤检查：如果敌人弹道/普攻碰到队友
    for (const pr of RT27.projs) {
      if (pr.friendly) continue; // 敌方弹道
      for (const a of RT29.allies) {
        if (!a.alive || pr.dead) continue;
        if (Math.hypot(a.x - pr.x, a.y - pr.y) < a.radius + pr.r) {
          pr.dead = true;
          damageAlly(a, pr.dm, pr);
        }
      }
    }
  }

  function attackNearest(a, nearest, nd, dt) {
    const range = RT27.atkRange * 0.9;
    if (nd > range) {
      // 靠近敌人
      const dx = nearest.x - a.x, dy = nearest.y - a.y;
      a.x += dx / nd * a.spd * 6.5 * dt;
      a.y += dy / nd * a.spd * 6.5 * dt;
      a.anim = 'walk';
      a.dir = dirFrom(dx, dy);
    } else if (a.atkCd <= 0) {
      // 攻击
      a.atkCd = 1.2;
      a.anim = 'attack';
      setTimeout(() => { if (a.anim === 'attack') a.anim = 'idle'; }, 220);
      a.dir = dirFrom(nearest.x - a.x, nearest.y - a.y);
      // 造成伤害（用简化的伤害公式）
      const r = calcDmg(a, nearest, SKILLS.atk);
      nearest.hp -= r.dm;
      nearest.anim = 'hurt';
      nearest.flashT = 0.2;
      const [sx, sy] = RT27._w2s(nearest.x, nearest.y - 60);
      floatText(sx + rnd(-20, 20), sy, (r.crit ? '暴击 ' : '') + '-' + r.dm, r.crit ? '#ffcf3a' : '#9aff9a', (r.crit ? 36 : 26) * R.dpr, false);
      Sfx.play('hit', 0.4);
      if (nearest.hp <= 0) {
        nearest.hp = 0; nearest.alive = false; nearest.anim = 'dead';
        Sfx.play('die');
      }
    }
  }

  function damageAlly(a, dm, proj) {
    const cut = a.buf.def > 0 ? 0.5 : 1;
    const dmg = Math.max(1, Math.round(dm * cut));
    a.hp -= dmg;
    a.anim = 'hurt';
    const [sx, sy] = RT27._w2s(a.x, a.y - 60);
    floatText(sx, sy, '-' + dmg, '#ff9a8a', 26 * R.dpr, false);
    if (a.hp <= 0) {
      a.hp = 0; a.alive = false; a.anim = 'dead';
      floatText(sx, sy - 40, '倒下了！', '#ff6a5a', 24 * R.dpr, false);
      Sfx.play('die');
    }
  }

  // ---- 4) 包裹 draw：画队友 ----
  let _patchedDraw = false;
  function patchDraw() {
    if (_patchedDraw || !RT27.on) return;
    _patchedDraw = true;
    const _origDraw = R.drawBattle;
    R.drawBattle = function (ctx) {
      _origDraw && _origDraw(ctx);
      if (RT27.on) drawAllies(ctx);
    };
  }

  function drawAllies(ctx) {
    const W = R.W, H = R.H;
    for (const a of RT29.allies) {
      const [sx, sy] = RT27._w2s(a.x, a.y);
      if (sx < -200 || sx > W + 200 || sy < -200 || sy > H + 200) continue;
      // 影子
      const b = spriteBox(a.spr, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(sx, sy, b.w * 0.4, b.w * 0.18, 0, 0, 7); ctx.fill();
      // 精灵
      if (a.alive || a.anim === 'dead') {
        const alpha = a.anim === 'dead' ? 0.4 : 1;
        drawSprite(ctx, a.spr, a.anim, a.dir, a.at * (a.anim === 'walk' ? 10 : 5), sx, sy, 0.9, alpha);
      }
      // 血条
      if (a.alive) {
        const bw = 70 * R.dpr;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(sx - bw / 2, sy - b.h - 22 * R.dpr, bw, 6 * R.dpr);
        ctx.fillStyle = a.isPet ? '#9aff9a' : '#ffc0e0';
        ctx.fillRect(sx - bw / 2, sy - b.h - 22 * R.dpr, bw * Math.max(0, a.hp / a.mhp), 6 * R.dpr);
        // 名字
        ctx.font = `bold 11 * R.dpr px WBXKai,sans-serif`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 3; ctx.strokeStyle = '#000';
        ctx.strokeText(a.name, sx, sy - b.h - 26 * R.dpr);
        ctx.fillStyle = a.isPet ? '#9aff9a' : '#ffc0e0';
        ctx.fillText(a.name, sx, sy - b.h - 26 * R.dpr);
      }
    }
  }

  // ---- 5) 队友 UI（血条 + 跟随/进攻切换按钮）----
  function addAllyUI() {
    if (document.getElementById('rt29-ally-ui')) return;
    const root = document.createElement('div');
    root.id = 'rt29-ally-ui';
    root.style.cssText = 'position:fixed;left:10px;top:calc(70px + env(safe-area-inset-top));z-index:13;pointer-events:none;font-family:WBXKai,sans-serif';
    root.innerHTML = `
      <div id="rt29-ally-bars" style="display:flex;flex-direction:column;gap:4px;margin-bottom:6px"></div>
      <button id="rt29-mode" style="pointer-events:auto;padding:4px 10px;border-radius:12px;background:rgba(40,60,40,.8);border:1px solid #9aff9a;color:#dff;font-size:11px">跟随模式</button>
    `;
    document.body.appendChild(root);
    root.querySelector('#rt29-mode').onclick = () => {
      RT29.followMode = !RT29.followMode;
      root.querySelector('#rt29-mode').textContent = RT29.followMode ? '跟随模式' : '进攻模式';
      root.querySelector('#rt29-mode').style.borderColor = RT29.followMode ? '#9aff9a' : '#ffb060';
      root.querySelector('#rt29-mode').style.color = RT29.followMode ? '#dff' : '#ffe9b0';
      UI.toast(RT29.followMode ? '队友跟随你作战' : '队友主动进攻！', '#9aff9a');
    };
    RT29._ui = root;
    // 启动队友血条更新
    RT29._hudTicker = setInterval(() => {
      if (!RT27.on) { clearInterval(RT29._hudTicker); return; }
      updateAllyBars();
    }, 200);
  }

  function updateAllyBars() {
    const box = RT29._ui && RT29._ui.querySelector('#rt29-ally-bars');
    if (!box) return;
    box.innerHTML = RT29.allies.map(a => `
      <div style="display:flex;align-items:center;gap:4px;opacity:${a.alive ? 1 : 0.4}">
        <span style="color:${a.isPet ? '#9aff9a' : '#ffc0e0'};font-size:10px;width:36px;text-shadow:0 1px 2px #000">${a.name.slice(0, 4)}</span>
        <div style="width:60px;height:6px;background:rgba(0,0,0,.6);border-radius:3px;overflow:hidden">
          <i style="display:block;height:100%;width:${Math.max(0, a.hp / a.mhp * 100)}%;background:${a.isPet ? '#5adf6a' : '#ff8ac0'}"></i>
        </div>
      </div>
    `).join('');
  }

  function removeAllyUI() {
    if (RT29._hudTicker) clearInterval(RT29._hudTicker);
    if (RT29._ui) { RT29._ui.remove(); RT29._ui = null; }
    _patchedUpdate = false;
    _patchedDraw = false;
  }

  // ---- 6) 包裹 finish：清理 + 队友恢复 ----
  const _origFinish = RT27.finish;
  RT27.finish = function (res) {
    // 队友不真死：战斗结束后恢复
    for (const a of RT29.allies) {
      if (!a.alive) {
        a.hp = Math.round(a.mhp * 0.5); // 战斗后恢复到半血
        a.alive = true; a.anim = 'idle';
      }
    }
    removeAllyUI();
    RT29.allies = [];
    RT29.followMode = true;
    return _origFinish.call(this, res);
  };

  // ---- 7) 自动 patch ----
  function install() {
    if (typeof RT27 === 'undefined' || !RT27.start) { setTimeout(install, 300); return; }
    patchStart();
  }
  install();

  // ---- 暴露全局 ----
  window.RT29 = RT29;
})();

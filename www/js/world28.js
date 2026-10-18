'use strict';
// ======================= 2.8① 神游太虚：九州大地图自由探索 =======================
// 设计：新增 mode='world'，复用引擎帧循环（engine.js:66 update / render）。
//   - 进入大地图时 R.M=null、R.drawTitle=World28.draw、R.onUpdate=World28.update；
//     命中 engine.js:196 的 !R.M 分支，全屏幕自绘占位底图（HD 底图待 Blender，见 art/ 手册）。
//   - 不覆盖现有传送/御剑/战斗：遭遇怪直接复用 Game.fight（自动走 rt27 实时战），
//     奇遇复用 Game.pickEvent/runEvent；节点进入复用 Game.enterMap。
//   - 存档 G.world 惰性兜底，不升 v。
const World28 = {
  on: false,
  px: 0, py: 0,            // 玩家在世界坐标（单位：世界格）
  cam: { x: 0, y: 0 },
  z: 1,                    // 缩放
  moveTarget: null,        // 点选移动目标 {x,y}
  joy: null,               // 摇杆向量 {dx,dy}（屏幕 dpr px）
  nodes: [],               // 节点列表（运行时由 MAP_ORDER 生成）
  dist: 0,                 // 累计移动距离（触发奇遇用）
  _prevMap: null,
  _nearNode: null,
  ui: null,
  WORLD: { w: 4000, h: 4000 },
  ENTER_R: 150,            // 进入节点判定半径
  BASE_SPEED: 520,         // 世界格/秒
};

// ---- 节点默认布局（按主题分区散布；MAPINFO[id].wx/wy 存在则覆盖） ----
// region: 凡俗/宗门/坊市/秘境/海域/险境/天
World28.DEFAULT_LAYOUT = {
  // 凡俗（西南）
  village: [620, 3250],
  // 宗门（中南）
  sect: [1050, 2500],
  // 坊市（中部）
  market: [1850, 2650], wanbao: [2150, 2450],
  juluyuan: [1550, 2050], yaowang: [2250, 1950],
  // 秘境（西北）
  secret: [950, 1550], jianzhong: [720, 1050],
  // 险境（东部）
  graveyard: [3050, 1850], rift: [3350, 1250], guishi: [2950, 950],
  // 海域（东南）
  island: [3250, 3250], luanxing: [3550, 2850], longgong: [3450, 3650],
  // 天境（正北）
  heaven: [2000, 550], cuizhai: [2300, 750],
  wendao: [1550, 320],
};
World28.REGION_OF = function (id) {
  if (id === 'village') return '凡俗';
  if (id === 'sect') return '宗门';
  if (['market', 'wanbao', 'juluyuan', 'yaowang'].includes(id)) return '坊市';
  if (['secret', 'jianzhong'].includes(id)) return '秘境';
  if (['island', 'luanxing', 'longgong'].includes(id)) return '海域';
  if (['graveyard', 'rift', 'guishi'].includes(id)) return '险境';
  if (['heaven', 'cuizhai', 'wendao'].includes(id)) return '天境';
  return '凡俗';
};
World28.REGION_COLOR = {
  '凡俗': '#3a6a4a', '宗门': '#3a5a8a', '坊市': '#8a6a3a', '秘境': '#5a4a8a',
  '海域': '#2a6a8a', '险境': '#7a3a3a', '天境': '#8a7a3a',
};

// ---- 惰性兜底存档 ----
World28.ensure = function () {
  const G = Game.G; if (!G) return;
  G.world = G.world || { explored: {}, seen: {}, trips: 0 };
  G.world.explored = G.world.explored || {};
  G.world.seen = G.world.seen || {};
};

// ---- 生成节点列表（运行时读 MAP_ORDER，新区域注册即自动出现） ----
World28.buildNodes = function () {
  this.nodes = [];
  let k = 0;
  for (const id of MAP_ORDER) {
    const I = MAPINFO[id]; if (!I) continue;
    let pos = (I.wx !== undefined && I.wy !== undefined) ? [I.wx, I.wy] : this.DEFAULT_LAYOUT[id];
    if (!pos) { // 缺省布局：按索引摆到一个默认环上
      const ang = (k++ / Math.max(1, MAP_ORDER.length)) * Math.PI * 2;
      pos = [2000 + Math.cos(ang) * 1400, 2000 + Math.sin(ang) * 1400];
    }
    this.nodes.push({
      id, name: I.n, x: pos[0], y: pos[1],
      region: this.REGION_OF(id), tier: I.tier || 0, need: I.need || 0,
      boss: !!I.boss,
    });
  }
};
World28.nodeById = function (id) { return this.nodes.find(n => n.id === id); };

// ---- 进入大地图 ----
World28.enter = async function () {
  const G = Game.G; if (!G || G.dead) return;
  if (!G.flags.awakened) { UI.toast('先觉醒灵根，再云游四方'); return; }
  this.ensure();
  this.buildNodes();
  this._prevMap = R.mapId || G.map || 'village';
  const start = this.nodeById(this._prevMap) || this.nodeById('village') || this.nodes[0];
  this.px = start ? start.x : 2000; this.py = start ? start.y : 2000;
  this.moveTarget = null; this.joy = null; this.dist = 0; this._nearNode = null;

  await UI.fade(true, 400);
  this.on = true;
  R.M = null; R.mode = 'world'; R.player = null;
  R.ents = []; R.marks = []; R.parts = []; R.texts = [];
  R.drawTitle = ctx => this.draw(ctx);
  R.onUpdate = dt => this.update(dt);
  R.onTap = null;
  this.cam = { x: this.px, y: this.py };
  this.z = this.baseZ();
  this._bindInput(); this._showOverlay();
  document.body.classList.add('world28');
  await UI.fade(false, 400);
  UI.banner('九州大地图', '自由探索 · 靠近节点进入 · 移动中奇遇不断');
  Sfx.play('whoosh');
};

World28.baseZ = function () { return Math.max(0.5, R.H / 1600); };

// ---- 从战斗/事件回来后恢复 world 模式 ----
World28.reenter = function () {
  if (!this.on || !Game.G || Game.G.dead) return;
  if (R.mode === 'world' && R.M === null) return;
  R.M = null; R.mode = 'world';
  R.drawTitle = ctx => this.draw(ctx);
  R.onUpdate = dt => this.update(dt);
};

// ---- 进入某区域节点 ----
World28.enterNode = async function (id) {
  const G = Game.G; const n = this.nodeById(id); if (!n) return;
  if (!Game.canEnter(id)) { UI.toast(`境界不足：需${REALMS[n.need].n}期`); return; }
  this.ensure(); G.world.explored[id] = (G.world.explored[id] || 0) + 1; G.world.trips++;
  this._hideOverlay(); this._unbindInput();
  this.on = false;
  R.drawTitle = null; R.onUpdate = null;
  document.body.classList.remove('world28');
  await UI.fade(true, 400);
  G.map = id; G.pos = null;
  await Game.enterMap(id);   // 内部设 R.mode='map'、R.M=地图数据、R.onTap
  await UI.fade(false, 400);
  UI.toast('抵达 ' + n.name);
  Game.save();
};

// ---- 回城（返回进入大地图前所在区域） ----
World28.backToPrev = async function () {
  const id = this._prevMap || Game.G.map || 'village';
  await this.enterNode(id);
};

// ======================= 输入 =======================
World28._bindInput = function () {
  const cv = R.cv;
  cv.addEventListener('pointerdown', this._pd);
  cv.addEventListener('pointermove', this._pm);
  cv.addEventListener('pointerup', this._pu);
  cv.addEventListener('pointercancel', this._pu);
};
World28._unbindInput = function () {
  const cv = R.cv; if (!cv) return;
  cv.removeEventListener('pointerdown', this._pd);
  cv.removeEventListener('pointermove', this._pm);
  cv.removeEventListener('pointerup', this._pu);
  cv.removeEventListener('pointercancel', this._pu);
};
World28._pd = function (e) {
  if (!World28.on) return;
  if (UI.modal || Game._busy) return;
  const x = e.clientX * R.dpr, y = e.clientY * R.dpr;
  World28._drag = { id: e.pointerId, sx: x, sy: y, ox: x, oy: y, moved: false, t: performance.now() };
  try { R.cv.setPointerCapture(e.pointerId); } catch (er) { }
};
World28._pm = function (e) {
  const d = World28._drag; if (!d || e.pointerId !== d.id) return;
  const x = e.clientX * R.dpr, y = e.clientY * R.dpr;
  if (!d.moved && Math.hypot(x - d.ox, y - d.oy) > 16 * R.dpr) d.moved = true;
  if (d.moved) World28.joy = { dx: x - d.ox, dy: y - d.oy };
};
World28._pu = function (e) {
  const d = World28._drag; if (!d || e.pointerId !== d.id) return;
  World28._drag = null; World28.joy = null;
  if (!d.moved && performance.now() - d.t < 600 && !UI.modal && !Game._busy) {
    // 点选移动：屏幕坐标 → 世界坐标
    const [wx, wy] = World28.s2w(e.clientX * R.dpr, e.clientY * R.dpr);
    World28.moveTarget = { x: wx, y: wy };
    R.tapMark = { i: 0, j: 0, t: 0 }; // 复用点击光圈（不影响，仅视觉）
  }
};
World28.w2s = function (wx, wy) { return [(wx - this.cam.x) * this.z + R.W / 2, (wy - this.cam.y) * this.z + R.H / 2]; };
World28.s2w = function (sx, sy) { return [(sx - R.W / 2) / this.z + this.cam.x, (sy - R.H / 2) / this.z + this.cam.y]; };

// ======================= 更新 =======================
World28.update = function (dt) {
  if (!this.on) return;
  const G = Game.G; if (!G || G.dead) return;
  const busy = UI.modal || Game._busy;
  let mvx = 0, mvy = 0;
  let sp = this.BASE_SPEED;
  if (!busy) {
    // 速度：御剑/坐骑提升
    try { if (typeof Sys !== 'undefined' && Sys.mount && Sys.mount()) sp *= 1.7; } catch (e) { }
    if (this.joy) {
      const m = Math.hypot(this.joy.dx, this.joy.dy);
      if (m > 12 * R.dpr) { mvx = this.joy.dx / m; mvy = this.joy.dy / m; }
    } else if (this.moveTarget) {
      const dx = this.moveTarget.x - this.px, dy = this.moveTarget.y - this.py;
      const d = Math.hypot(dx, dy);
      if (d < 24) this.moveTarget = null;
      else { mvx = dx / d; mvy = dy / d; }
    }
  }
  const step = sp * dt;
  if (mvx || mvy) {
    const d = Math.hypot(mvx, mvy) || 1;
    this.px += mvx / d * step; this.py += mvy / d * step;
    this.px = Math.max(120, Math.min(this.WORLD.w - 120, this.px));
    this.py = Math.max(120, Math.min(this.WORLD.h - 120, this.py));
    this.dist += step;
  }
  // 相机跟随
  const ck = 1 - Math.pow(0.001, dt);
  this.cam.x += (this.px - this.cam.x) * ck;
  this.cam.y += (this.py - this.cam.y) * ck;

  // 靠近节点提示
  let near = null, nd = this.ENTER_R;
  for (const n of this.nodes) { const d = Math.hypot(n.x - this.px, n.y - this.py); if (d < nd) { nd = d; near = n; } }
  this._nearNode = near;
  this._updateOverlay();

  // 移动中奇遇触发
  if (!busy && this.dist > 520) { this.dist = 0; this._roll(); }
};

// ---- 移动随机事件 ----
World28._roll = async function () {
  const G = Game.G;
  if (UI.modal || Game._busy || !this.on) return;
  const r = Math.random();
  const near = this._nearNode;
  const tier = near ? near.tier : (MAPINFO[R.mapId] ? MAPINFO[R.mapId].tier : G.realm);
  if (r < 0.30) {
    // 遭遇怪（实时战）
    const pool = near && MAPINFO[near.id] && MAPINFO[near.id].mons.length ? MAPINFO[near.id].mons : (Object.keys(MONS).filter(k => MONS[k].mons && !MONS[k].boss));
    const mon = pick(pool.length ? pool : ['boar', 'slime']);
    Sfx.play('whoosh');
    await this._fight(mon, { tier: Math.max(0.3, tier + rnd(-0.3, 0.3)), solo: Math.random() < 0.4 });
  } else if (r < 0.55) {
    // 奇遇（复用 433 事件池）
    const ev = Game.pickEvent();
    if (ev) await this._wrap(() => Game.runEvent(ev));
  } else if (r < 0.75) {
    // 资源采集
    const got = { herb: ri(1, 3) };
    if (Math.random() < 0.4) got.lz = 1;
    if (tier >= 2 && Math.random() < 0.3) got.yd = 1;
    for (const k in got) Game.give(k, got[k]);
    Sfx.play('pickup');
    UI.toast('途中采集：' + Object.entries(got).map(([k, v]) => ITEMS[k].n + '×' + v).join('、'), '#9aff9a');
  } else if (r < 0.92) {
    // 道友（切磋/论道/结交）
    await this._travelDaoYou(near);
  } else {
    // 云卷云舒，无事
  }
  UI.hud && UI.hud(); Game.save();
};
// 包裹异步：结束后恢复 world 模式
World28._wrap = async function (fn) {
  try { await fn(); } catch (e) { console.error('world28 roll', e); }
  this.reenter();
};
// 大地图遭遇：临时启用 RT27 实时路由（不污染全局，避免影响 BOT/回合战）
World28._fight = async function (mon, opts) {
  const had = 'RT27' in window;
  window.RT27 = RT27;
  try { await Game.fight(mon, opts); }
  finally { if (!had) delete window.RT27; this.reenter(); }
};
World28._travelDaoYou = async function (near) {
  const G = Game.G;
  const c = await UI.card('路遇道友', '云游途中，你遇见一位御剑而行的修士，拦下你论道切磋。\n\n· 论道（得悟道点）\n· 切磋（得修为）\n· 拱手道别', 'npc_mentor', ['论道', '切磋', '道别']);
  if (c === 0) {
    if (typeof DAO28 !== 'undefined') { DAO28.gainDao(1, '路遇论道'); }
    else { Game.addExp(Game.yearExp() * 0.3, true); }
    UI.toast('你对大道有所感悟（悟道点 +1）', '#c8a0ff');
  } else if (c === 1) {
    const mon = pick(near && MAPINFO[near.id] && MAPINFO[near.id].mons.length ? MAPINFO[near.id].mons : ['boar']);
    await this._fight(mon, { tier: Math.max(0.3, (near ? near.tier : G.realm)), elite: true, solo: true });
  }
};

// ======================= 绘制 =======================
World28.draw = function (ctx) {
  const W = R.W, H = R.H;
  // 底色渐变（云海）
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1a2440'); g.addColorStop(0.5, '#2a3a5a'); g.addColorStop(1, '#3a4a6a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  ctx.save();
  // 世界 → 屏幕
  ctx.scale(this.z, this.z);
  ctx.translate(W / 2 / this.z - this.cam.x, H / 2 / this.z - this.cam.y);

  // 分区底色：按 region 画大块半透明地形
  for (const n of this.nodes) {
    ctx.fillStyle = this.REGION_COLOR[n.region] || '#333';
    ctx.globalAlpha = 0.18;
    ctx.beginPath(); ctx.arc(n.x, n.y, 520, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 经纬网格
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 2 / this.z;
  for (let x = 0; x <= this.WORLD.w; x += 500) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.WORLD.h); ctx.stroke(); }
  for (let y = 0; y <= this.WORLD.h; y += 500) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.WORLD.w, y); ctx.stroke(); }

  // 点选移动标记
  if (this.moveTarget) {
    ctx.strokeStyle = 'rgba(255,240,150,0.7)'; ctx.lineWidth = 4 / this.z;
    ctx.beginPath(); ctx.ellipse(this.moveTarget.x, this.moveTarget.y, 40, 20, 0, 0, 7); ctx.stroke();
  }

  // 节点
  ctx.textAlign = 'center';
  for (const n of this.nodes) {
    const unlocked = Game.canEnter(n.id);
    const visited = (Game.G.world && Game.G.world.explored[n.id]) || Game.G.visited[n.id];
    const isNear = this._nearNode === n;
    // 外圈光晕
    if (isNear) { ctx.fillStyle = 'rgba(255,230,130,0.25)'; ctx.beginPath(); ctx.arc(n.x, n.y, 70 + Math.sin(R.t * 5) * 8, 0, 7); ctx.fill(); }
    // 底
    ctx.fillStyle = unlocked ? (this.REGION_COLOR[n.region] || '#444') : '#222';
    ctx.strokeStyle = isNear ? '#ffe680' : (unlocked ? '#d8b26a' : '#555');
    ctx.lineWidth = (isNear ? 6 : 3) / this.z;
    ctx.beginPath(); ctx.arc(n.x, n.y, 34, 0, 7); ctx.fill(); ctx.stroke();
    // 图标字
    ctx.fillStyle = unlocked ? '#fff' : '#888';
    ctx.font = `bold ${30 / this.z}px WBXKai,sans-serif`;
    ctx.fillText(n.boss ? '☠' : '⌂', n.x, n.y + 10 / this.z);
    // 名称
    ctx.font = `bold ${26 / this.z}px WBXKai,sans-serif`;
    ctx.lineWidth = 6 / this.z; ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    const label = unlocked ? n.name : '？？？';
    ctx.strokeText(label, n.x, n.y - 46 / this.z);
    ctx.fillStyle = unlocked ? '#ffe9b0' : '#777';
    ctx.fillText(label, n.x, n.y - 46 / this.z);
    // 境界提示
    ctx.font = `${18 / this.z}px WBXKai,sans-serif`;
    ctx.fillStyle = unlocked ? (visited ? '#9aff9a' : '#9ad8ff') : '#999';
    const sub = unlocked ? (n.need ? REALMS[n.need].n + '境' : '凡境') : `需${REALMS[n.need].n}`;
    ctx.fillText(sub, n.x, n.y + 56 / this.z);
  }

  // 玩家
  {
    const p = this.px, yy = this.py;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(p, yy + 14, 26, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffe680'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 / this.z;
    ctx.beginPath(); ctx.arc(p, yy, 18, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c83a3a'; ctx.font = `bold ${20 / this.z}px WBXKai,sans-serif`;
    ctx.fillText('你', p, yy + 7 / this.z);
  }
  ctx.restore();

  // 屏幕空间 HUD（文字）
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,240,200,0.9)';
  ctx.font = `${22 * R.dpr}px WBXKai,sans-serif`;
  const visCount = this.nodes.filter(n => Game.canEnter(n.id)).length;
  ctx.fillText(`九州大地图 · 已解锁 ${visCount}/${this.nodes.length} 域`, 14 * R.dpr, 30 * R.dpr);
};

// ======================= DOM 覆盖层 =======================
World28._showOverlay = function () {
  this._hideOverlay();
  if (!document.getElementById('w28-style')) {
    const st = document.createElement('style');
    st.id = 'w28-style';
    st.textContent = 'body.world28 #menu,body.world28 #yearbtn,body.world28 #brkbtn,body.world28 #qt,body.world28 #money{display:none!important}';
    document.head.appendChild(st);
  }
  const root = document.createElement('div');
  root.id = 'world28-ui';
  root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:11;font-family:WBXKai,sans-serif';
  root.innerHTML = `
    <div id="w28-enter" style="position:absolute;left:50%;bottom:140px;transform:translateX(-50%);pointer-events:auto;display:none">
      <button style="padding:12px 26px;border-radius:22px;background:linear-gradient(#8a6a2a,#5a4a14);border:2px solid #ffd27a;color:#ffe9b0;font-size:16px;font-weight:bold"></button>
    </div>
    <div style="position:absolute;right:10px;top:calc(10px + env(safe-area-inset-top));display:flex;flex-direction:column;gap:8px;pointer-events:auto">
      <button id="w28-zin" style="width:44px;height:44px;border-radius:50%;background:rgba(40,30,15,.8);border:1px solid #d8b26a;color:#ffe9b0;font-size:20px">＋</button>
      <button id="w28-zout" style="width:44px;height:44px;border-radius:50%;background:rgba(40,30,15,.8);border:1px solid #d8b26a;color:#ffe9b0;font-size:20px">－</button>
      <button id="w28-home" style="padding:8px 12px;border-radius:16px;background:rgba(40,20,10,.8);border:1px solid #c8a060;color:#ddd;font-size:12px">回城</button>
    </div>`;
  document.body.appendChild(root);
  root.querySelector('#w28-zin').onclick = () => { this.z = Math.min(2.4, this.z * 1.25); };
  root.querySelector('#w28-zout').onclick = () => { this.z = Math.max(0.5, this.z / 1.25); };
  root.querySelector('#w28-home').onclick = () => { this.backToPrev(); };
  this.ui = root;
};
World28._hideOverlay = function () { if (this.ui) { this.ui.remove(); this.ui = null; } };
World28._updateOverlay = function () {
  if (!this.ui) return;
  const btn = this.ui.querySelector('#w28-enter button');
  const wrap = this.ui.querySelector('#w28-enter');
  if (this._nearNode && Game.canEnter(this._nearNode.id)) {
    wrap.style.display = 'block';
    btn.textContent = '进入 ' + this._nearNode.name;
    btn.onclick = () => this.enterNode(this._nearNode.id);
  } else if (this._nearNode) {
    wrap.style.display = 'block';
    btn.textContent = this._nearNode.name + '（境界不足）';
    btn.style.opacity = '0.5';
    btn.onclick = () => UI.toast(`需${REALMS[this._nearNode.need].n}期`);
  } else wrap.style.display = 'none';
};

// ======================= 挂载入口（在御剑面板加入口） =======================
(function () {
  function install() {
    if (typeof UI === 'undefined' || !UI.p_travel) { setTimeout(install, 300); return; }
    const _travel = UI.p_travel;
    UI.p_travel = function (b, re, close) {
      _travel.call(this, b, re, close);
      const btn = document.createElement('button');
      btn.className = 'opt'; btn.style.cssText = 'background:linear-gradient(#3a5a8a,#1a3a5a);border:1px solid #9ad8ff;color:#dff';
      btn.textContent = '🌏 神游大地图（自由探索）';
      btn.onclick = e => { e.stopPropagation(); close(); setTimeout(() => World28.enter(), 200); };
      b.insertBefore(btn, b.firstChild);
    };
    UI.titles.world28 = '九州大地图';
  }
  install();
})();

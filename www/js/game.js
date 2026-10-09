/* 我不仙 · 修仙人生模拟器 — 游戏逻辑 */
'use strict';
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const sleep = ms => new Promise(r => setTimeout(r, ms / (G0 && G0.fast ? 3 : 1)));
const LS_LIFE = 'wbx_life_v1', LS_META = 'wbx_meta_v1';
let S = null; // 当前人生
let META_S = loadMeta();
let busy = false;

function loadMeta() { try { const m = JSON.parse(localStorage.getItem(LS_META)); if (m) return Object.assign({ pts: 0, lv: {}, lives: [], best: 0, n: 0 }, m); } catch (e) {} return { pts: 0, lv: {}, lives: [], best: 0, n: 0 }; }
function saveMeta() { try { localStorage.setItem(LS_META, JSON.stringify(META_S)); } catch (e) {} }
function saveLife() { try { if (S && S.alive) localStorage.setItem(LS_LIFE, JSON.stringify(S)); else localStorage.removeItem(LS_LIFE); } catch (e) {} }
function loadLife() { try { return JSON.parse(localStorage.getItem(LS_LIFE)); } catch (e) { return null; } }
const mlv = id => META_S.lv[id] || 0;

/* ================= 辅助（事件可用） ================= */
const G0 = {
  fast: false,
  has: id => !!(S && S.talents.includes(id)),
  mod(k) { let v = 0; if (!S) return 0; for (const id of S.talents) { const t = TALENTS.find(x => x.id === id); if (t && t.m && t.m[k]) v += t.m[k]; } return v; },
  roll(p) { return Math.random() < Math.max(0.02, Math.min(0.98, p)); },
  stat(k, n) { S.st[k] = Math.max(0, S.st[k] + n); pop((n > 0 ? '+' : '') + n + ' ' + STATS.find(x => x[0] === k)[1], n > 0 ? '#9fe8ff' : '#ff8a8a'); },
  stones(n) { n = Math.round(n); S.stones += n; if (S.stones < 0 && !G0.has('szjj') && n < 0) S.stones = 0; if (n) { pop((n > 0 ? '+' : '') + n + ' 灵石', n > 0 ? '#ffe08a' : '#ff8a8a'); if (n > 0) SFX.coin(); } },
  life(n) { S.lifeBonus += n; if (n) pop((n > 0 ? '+' : '') + n + ' 寿元', n > 0 ? '#b0ffb0' : '#ff8a8a'); },
  item(id, n) { S.items[id] = (S.items[id] || 0) + n; if (S.items[id] <= 0) delete S.items[id]; if (n > 0) pop('获得 ' + ITEMS[id].n, '#ffd0ff'); },
  cultYear(mult) { const g = cultGain() * mult; addExp(g); return g; },
  unlock(loc) { S.unlocked[loc] = 1; },
  battle: (kind, mul, name) => battle(kind, mul, name),
};
const G = G0;

/* ================= 数值 ================= */
function lifespan(s = S) { return Math.floor(REALMS[s.realm].life * (1 + G0.mod('life') + mlv('life') * 0.08) * (1 + s.st.con * 0.01)) + s.lifeBonus; }
function needExp(s = S) { return REALMS[s.realm].need; }
function locMul() { return { village: 1, sect: 1.5, market: 0.85, secret: 1.3 }[S.loc] || 1; }
function cultGain() {
  let g = needExp() * 0.2 / (1 + S.realm * 0.45) * LINGGEN[S.ling].mul * (1 + S.st.int * 0.04) * (1 + G0.mod('cult')) * locMul();
  if (S.injured > 0) g *= 0.5; if (G0.has('dqwc') && S.age >= 50) g *= 2; if (S.realm === 0 && !S.flags.manual) g *= 0.35;
  return g * rnd(0.85, 1.15);
}
function addExp(g) {
  if (S.realm >= 7) return; const R0 = REALMS[S.realm]; S.exp += g;
  while (S.exp >= R0.need && S.stage < R0.stages - 1) { S.exp -= R0.need; S.stage++; R.ring(...R.screenOf(player(), -10), '#9fe8ff', 60); log('<span class="res">修为精进，晋入' + realmName() + '！</span>'); SFX.chime(); }
  if (S.exp > R0.need) S.exp = R0.need;
  if (g > 0.5) pop('+' + Math.round(g) + ' 修为', '#9fe8ff');
}
function power(s = S) { return (10 + s.st.con * 2 + s.st.int * 0.6) * Math.pow(3.2, s.realm) * (1 + s.stage * 0.25) * (1 + G0.mod('pow')) * (s.flags.mentor ? 1.1 : 1) * (s.injured > 0 ? 0.7 : 1); }
function realmName(s = S) { const r = REALMS[s.realm]; return r.stages > 1 ? r.n + STAGES[s.stage] : r.n; }
function canBreak() { return S.realm < 7 && S.stage === REALMS[S.realm].stages - 1 && S.exp >= needExp() && S.age >= 8; }

/* ================= 场景演员 ================= */
let PL = null;
function player() { return PL; }
function playerLook() { const r = REALMS[S.realm]; return { hair: S.look.hair, ribbon: S.look.ribbon, robe: S.age < 6 ? '#ffd0a0' : r.robe, robe2: '#fff', belt: r.col, sword: S.realm >= 1 || S.flags.mentor, aura: r.aura, scale: S.age < 6 ? 0.9 : S.age < 14 ? 1.05 : 1.22, label: S.name, labelCol: '#fff6c0', longhair: S.look.long }; }
function populate(loc) {
  R.clearActors(); PL = null;
  const npc = (spec, o = {}) => R.addActor(Object.assign({}, spec, { scale: 1.05, speed: 0.7 }, o));
  if (S) { PL = R.addActor(Object.assign(playerLook(), { speed: 1.2 })); }
  if (loc === 'village') {
    if (!S || S.age < 30) npc(NPC.mom, { label: '娘' });
    npc({ hair: '#3a2a1a', robe: '#7a9a5a', hat: 'straw', bun: false, label: '王大爷', beard: true });
    npc({ hair: '#222', robe: '#e0a080', ribbon: '#5a8fd8', scale: 0.7, label: '小花' });
    if (!S || (S.flags.mentor && !S.flags.mentorGone)) npc(NPC.mentor, { label: '落魄剑仙', speed: 0.4 });
  } else if (loc === 'sect') {
    npc(NPC.elder, { label: '掌门', speed: 0.4 }); npc(NPC.sister, { label: '师姐' });
    for (let k = 0; k < 3; k++) npc({ hair: '#2a1b14', robe: '#f4f4f4', robe2: '#2f8a7a', belt: '#2f8a7a', sword: true, ribbon: '#2f8a7a', label: '弟子' });
  } else if (loc === 'market') {
    npc(NPC.merchant, { label: '钱多多', speed: 0.3 });
    for (let k = 0; k < 4; k++) npc({ hair: pick(['#2a1b14', '#5a3a22', '#888']), robe: pick(['#c86a6a', '#6a8ac8', '#c8a86a', '#8ac86a']), hat: Math.random() < 0.4 ? 'straw' : null, bun: Math.random() < 0.6, label: pick(['路人', '散修', '小贩', '游客']) });
  } else if (loc === 'secret') {
    for (const m of ['slime', 'paper', 'beast', 'paper', 'slime']) R.addActor({ monster: m, scale: 1.15, speed: 0.6, shadow: 1.1 });
  }
}
function refreshPlayerLook() { if (PL) Object.assign(PL, playerLook()); }
function pop(text, col) { if (!PL) return; const [x, y] = R.screenOf(PL, -75); R.floatText(x + rnd(-20, 20), y + rnd(-10, 10), text, col, 13); }

/* ================= UI 基础 ================= */
function showScreen(id) { document.querySelectorAll('.screen').forEach(e => e.classList.toggle('on', e.id === id)); const game = id === 'game'; ['hud', 'bottom'].forEach(x => $(x).classList.toggle('hidden', !game)); if (game) layout(); else if (id === 'title') requestAnimationFrame(() => { const a = document.querySelector('.logo-wrap').getBoundingClientRect(), b = document.querySelector('#title .menu').getBoundingClientRect(); R.setLayout(a.bottom - 20, window.innerHeight - b.top - 10); }); else R.setLayout(0, 0); }
function layout() { requestAnimationFrame(() => R.setLayout($('hud').offsetHeight, $('bottom').offsetHeight)); }
function toast(t) { const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = t; document.body.appendChild(d); setTimeout(() => d.remove(), 1600); }
function banner(t, sub) { const b = $('banner'); b.innerHTML = t + (sub ? '<small>' + sub + '</small>' : ''); b.classList.remove('hidden'); b.style.animation = 'none'; b.offsetHeight; b.style.animation = ''; clearTimeout(banner.t); banner.t = setTimeout(() => b.classList.add('hidden'), 2000); }
async function fade(fn) { $('fade').classList.add('on'); await new Promise(r => setTimeout(r, 360)); await fn(); $('fade').classList.remove('on'); }
let modalClose = null;
function openModal(html, closable = true) { $('mBox').innerHTML = html; $('modal').classList.remove('hidden'); modalClose = closable ? closeModal : null; }
function closeModal() { $('modal').classList.add('hidden'); modalClose = null; }
$('modal').addEventListener('click', e => { if (e.target.id === 'modal' && modalClose) { SFX.click(); modalClose(); } });
function bind(id, fn) { const el = typeof id === 'string' ? $(id) : id; el.addEventListener('click', e => { SFX.unlock(); SFX.click(); fn(e); }); }
function log(html, age = S.age) { S.log.push({ a: age, t: html }); if (S.log.length > 160) S.log.splice(0, S.log.length - 160); appendLog(S.log[S.log.length - 1]); }
function appendLog(e) { const p = document.createElement('p'); p.innerHTML = '<span class="age">' + e.a + '岁</span>' + e.t; const L = $('log'); L.appendChild(p); while (L.children.length > 60) L.firstChild.remove(); L.scrollTop = L.scrollHeight; }
function renderLog() { const L = $('log'); L.innerHTML = ''; S.log.slice(-60).forEach(appendLog); }

/* ================= HUD 与行动 ================= */
const LOCS = {
  village: { n: '桃花村', d: '生你养你的小山村，桃花开得很随便', ok: () => true },
  sect: { n: '青云宗', d: '正道大派，修炼速度×1.5，食堂很好吃', ok: () => S.unlocked.sect, lock: '需要拜入宗门' },
  market: { n: '云来坊市', d: '买卖丹药、摆摊赚钱、被骗', ok: () => S.age >= 12, lock: '12岁后可去' },
  secret: { n: '万妖秘境', d: '斩妖历练，机缘与危险并存', ok: () => S.realm >= 1, lock: '练气期后可入' }
};
function updateHUD() {
  const r = REALMS[S.realm], L = lifespan();
  $('hRealm').textContent = realmName(); $('hRealm').style.background = 'linear-gradient(180deg,' + r.col + ',#5a2010)';
  $('hName').textContent = S.name + (S.injured > 0 ? '（负伤）' : ''); $('hLoc').textContent = LOCS[S.loc].n + ' · ' + LINGGEN[S.ling].n + ' · 第' + (META_S.n + 1) + '世';
  $('hStone').textContent = S.stones; $('hStone').style.color = S.stones < 0 ? '#ff7a6a' : '';
  $('hLife').textContent = S.age + '/' + L; $('hLifeF').style.width = Math.min(100, S.age / L * 100) + '%';
  const need = needExp(); $('hExp').textContent = S.realm >= 7 ? '∞' : Math.floor(S.exp) + '/' + need; $('hExpF').style.width = (S.realm >= 7 ? 100 : Math.min(100, S.exp / need * 100)) + '%';
  $('hStats').innerHTML = STATS.map(([k, n]) => n + '<b>' + S.st[k] + '</b>').join('') + '战力<b>' + Math.round(power()) + '</b>';
  const cb = canBreak(); $('bBreak').disabled = !cb; $('bBreak').classList.toggle('glow', cb);
  $('bBreak').innerHTML = cb ? (S.realm === 6 ? '飞 升' : '突 破') : '突 破';
  renderActions(); refreshPlayerLook();
}
function closedYears() { return S.realm >= 5 ? 20 : S.realm >= 4 ? 10 : S.realm >= 3 ? 5 : S.realm >= 2 ? 3 : 1; }
function actionsFor() {
  if (S.age < 6) return [{ id: 'grow', n: '长大一岁', d: '吃饭、睡觉、被鹅追', wide: 1 }];
  const cy = closedYears(), cult = { id: 'cult', n: cy > 1 ? '闭关' + cy + '年' : (S.realm === 0 && !S.flags.manual ? '瞎练吐纳' : '打坐修炼'), d: cy > 1 ? '一闭眼就是' + cy + '年' : (S.realm === 0 && !S.flags.manual ? '没有功法，效果减半' : '修为+') };
  const A = {
    village: [cult, { id: 'farm', n: '下地干活', d: '体魄+ 灵石+' }, { id: 'read', n: '读书识字', d: '悟性+' }, { id: 'work', n: '镇上打工', d: '灵石++' }],
    sect: [cult, { id: 'quest', n: '宗门任务', d: '灵石+ 修为+' }, { id: 'lib', n: '藏经阁', d: '悟性+ 修为+' }, { id: 'spar', n: '同门切磋', d: '斗法 体魄+' }],
    market: [cult, { id: 'stall', n: '摆摊卖货', d: '魅力越高赚越多' }, { id: 'shop', n: '逛丹药铺', d: '不消耗时间' }, { id: 'rumor', n: '打听消息', d: '必定触发奇遇' }],
    secret: [cult, { id: 'hunt', n: '斩妖历练', d: '斗法 掉落丰厚' }, { id: 'herb', n: '采集灵药', d: '灵石+ 小概率丹药' }, { id: 'treasure', n: '寻找机缘', d: '看气运' }]
  };
  return A[S.loc];
}
function renderActions() {
  const box = $('actions'); box.innerHTML = '';
  for (const a of actionsFor()) { const b = document.createElement('button'); b.className = 'btn' + (a.wide ? ' wide gold' : '') + (a.id === 'cult' ? ' gold' : ''); b.innerHTML = a.n + '<small>' + a.d + '</small>'; bind(b, () => doAction(a.id)); box.appendChild(b); }
}

/* ================= 一年 ================= */
async function doAction(id) {
  if (busy || !S || !S.alive) return; busy = true;
  try {
    if (id === 'shop') { await shopModal(); return; }
    let years = 1, cultivated = false;
    const P = PL ? R.screenOf(PL, -30) : [0, 0];
    switch (id) {
      case 'grow': log(pick(['你长大了一岁，饭量也长了。', '你又长高了一截，裤子短了。', '你学会了爬树，然后学会了从树上掉下来。', '你在村口玩泥巴，捏了一个“仙人”。', '你听说书先生讲剑仙的故事，听得口水直流。', '你帮娘喂鸡，鸡啄了你一口。'])); break;
      case 'cult': { years = closedYears(); cultivated = true; const g = cultGain() * years; R.ring(P[0], P[1] + 20, '#9fe8ff', 70, 0.9); R.burst(P[0], P[1], 26, '#bff4ff', 50, 1.2, 2.5, -30); addExp(g);
        log((years > 1 ? '你闭关' + years + '年，' : '你打坐修炼一年，') + pick(['灵气入体，如沐春风。', '期间睡着了几次，但修为还是涨了。', '隐约听见丹田里有人在唱《我不仙》。', '你感觉离长生又近了一小步。', '腿麻了，但值得。']) + ' <span class="res">修为+' + Math.round(g) + '</span>'); break; }
      case 'farm': { G.stat('con', G.roll(0.55) ? 1 : 0); const g = Math.round(rnd(10, 22)); G.stones(g); log('你下地干了一年活，晒得黝黑。<span class="res">灵石+' + g + '</span>'); break; }
      case 'read': { const ok = G.roll(0.6); if (ok) G.stat('int', 1); log('你读了一年书' + (ok ? '，<span class="res">悟性+1</span>' : '，主要读的是话本小说。')); break; }
      case 'work': { const g = Math.round(rnd(25, 45) * (1 + S.st.cha * 0.05) * (1 + S.realm * 0.5)); G.stones(g); log(pick(['你在镇上酒楼端盘子', '你给镖局当趟子手', '你在药铺捣药', '你给人写家书']) + '，<span class="res">灵石+' + g + '</span>'); break; }
      case 'quest': { const g = Math.round(40 * (S.realm + 1) * rnd(0.8, 1.3)); G.stones(g); addExp(cultGain() * 0.5); log(pick(['你去后山除了一窝灵鼠', '你帮长老送了一年快递', '你看守了一年丹炉，炉没炸']) + '。<span class="res">灵石+' + g + '</span>'); break; }
      case 'lib': { const ok = G.roll(0.55); if (ok) G.stat('int', 1); addExp(cultGain() * 0.6); log('你在藏经阁泡了一年' + (ok ? '，<span class="res">悟性+1</span>' : '，把《修仙界八卦周刊》全看完了。')); break; }
      case 'spar': { const win = await battle('rival', 0.8, '同门师兄'); if (win) { G.stat('con', 1); addExp(cultGain() * 0.6); log('切磋获胜！<span class="res">体魄+1，修为+</span>'); } else { log('你被师兄按在地上摩擦。<span class="bad">（但学到了）</span>'); addExp(cultGain() * 0.3); } break; }
      case 'stall': { const g = Math.round(50 * (S.realm + 1) * (1 + S.st.cha * 0.06) * rnd(0.6, 1.4)); G.stones(g); log('你摆了一年摊，' + pick(['卖的是自己画的符（不灵）', '卖的是“剑仙同款”葫芦', '卖的是后山挖的萝卜，号称人参']) + '。<span class="res">灵石+' + g + '</span>'); break; }
      case 'rumor': log('你在茶馆泡了一年，听到了不少消息。'); break;
      case 'hunt': { const kinds = ['slime', 'paper', 'beast', 'rock', 'fox']; const k = pick(kinds); const nm = { slime: '讨债妖', paper: '纸符小鬼', beast: '獠牙灵兽', rock: '石头精', fox: '狐妖' }[k];
        const win = await battle(k, rnd(0.8, 1.15), nm); if (win) { const g = Math.round(30 * (S.realm + 1) * rnd(0.8, 1.6)); G.stones(g); addExp(cultGain() * 0.7); S.kills++; log('你斩杀了' + nm + '！<span class="res">灵石+' + g + '，修为+</span>'); if (G.roll(0.12)) G.item(pick(['pyd', 'hcd', 'zjd']), 1); }
        else { S.injured = Math.max(S.injured, 2); G.life(-1); log('你被' + nm + '打伤，狼狈逃回。<span class="bad">负伤两年，寿元-1</span>'); } break; }
      case 'herb': { const g = Math.round(25 * (S.realm + 1) * rnd(0.7, 1.4)); G.stones(g); let t = '你采了一年药，<span class="res">灵石+' + g + '</span>'; if (G.roll(0.2 + S.st.luck * 0.02)) { const it = pick(['hcd', 'pyd', 'zjd']); G.item(it, 1); t += '，还炼出一颗<span class="gold">' + ITEMS[it].n + '</span>'; } log(t); break; }
      case 'treasure': { if (G.roll(0.3 + S.st.luck * 0.03)) { const g = Math.round(100 * (S.realm + 1) * rnd(0.8, 2)); G.stones(g); addExp(cultGain()); log('<span class="gold">你找到了前辈坐化的洞府！灵石+' + g + '，修为大涨</span>'); R.burst(P[0], P[1], 40, '#ffd75e', 80, 1.2); }
        else if (G.roll(0.5)) { const win = await battle('beast', 1.15, '守宝妖兽'); log(win ? '你击败守宝妖兽，获得一些灵石。' : '<span class="bad">守宝妖兽太强，你负伤逃走</span>'); if (win) G.stones(60 * (S.realm + 1)); else S.injured = 2; }
        else log('你找了一年，只找到一只臭袜子。（师父的）'); break; }
    }
    if (!cultivated && G.has('myxf') && S.age >= 6) { const g = cultGain() * 0.4 * years; addExp(g); log('（摸鱼心法自动运转，<span class="res">修为+' + Math.round(g) + '</span>）'); }
    await passYears(years, id === 'rumor');
  } finally { busy = false; if (S && S.alive) { updateHUD(); saveLife(); } }
}
async function passYears(n, forceEvent) {
  S.age += n; if (S.injured > 0) S.injured = Math.max(0, S.injured - n);
  if (G.has('chi')) S.stones -= 10 * n; if (G.has('qzt')) S.stones -= 20 * n;
  if (S.stones < 0 && !G.has('szjj')) S.stones = 0;
  if (S.age >= 6 && S.age < 18 && n === 1) { const g = Math.round(S.st.wealth * 3); if (g > 0) S.stones += g; }
  updateHUD();
  const pEv = S.age < 6 ? 0.85 : 0.5 + (G.has('hl') ? 0.15 : 0);
  if (forceEvent || Math.random() < pEv) await randomEvent(forceEvent);
  if (S.alive && S.age >= lifespan()) await die('寿终正寝', '你在一个阳光很好的午后，安详地闭上了眼睛。');
}
function eligible() { return EVENTS.filter(e => { try { return (!e.once || !S.seen[e.id]) && e.cond(S, G); } catch (x) { return false; } }); }
async function randomEvent(force) {
  const list = eligible(); if (!list.length) return;
  const ws = list.map(e => e.dyn ? e.dyn(S) : e.w); const tot = ws.reduce((a, b) => a + b, 0); if (tot <= 0) return;
  let r = Math.random() * tot, ev = list[0]; for (let i = 0; i < list.length; i++) { r -= ws[i]; if (r <= 0) { ev = list[i]; break; } }
  S.seen[ev.id] = 1; await runEvent(ev);
}
async function runEvent(ev) {
  const text = typeof ev.text === 'function' ? ev.text(S) : ev.text; SFX.event();
  if (!ev.choices) { const res = await ev.f(S, G); log(text + (res ? ' <span class="res">' + res + '</span>' : '')); return; }
  const npc = ev.npc ? NPC[ev.npc] : null;
  const choice = await new Promise(res => {
    openModal('<div class="ev">' + (npc ? '<canvas id="evPic"></canvas>' : '') + '<div><div class="who">' + (npc ? npc.name : '奇遇') + '</div><div class="txt">' + text + '</div></div></div><div class="choices" id="evCh"></div>', false);
    if (npc) R.portrait($('evPic'), npc);
    const box = $('evCh'); ev.choices.forEach(c => { const b = document.createElement('button'); b.className = 'btn ghost'; b.textContent = c.t; bind(b, () => res(c)); box.appendChild(b); });
  });
  closeModal();
  const out = await choice.f(S, G);
  log(text + ' 你选择【' + choice.t + '】。<span class="res">' + (out || '') + '</span>');
  if (S.alive) await new Promise(res => { openModal('<div class="ev">' + (npc ? '<canvas id="evPic"></canvas>' : '') + '<div><div class="who">' + (npc ? npc.name : '奇遇') + '</div><div class="result">' + (out || '无事发生') + '</div></div></div><div class="choices"><button class="btn" id="evOk">知道了</button></div>', false); if (npc) R.portrait($('evPic'), npc); bind('evOk', () => { closeModal(); res(); }); });
  updateHUD();
}

/* ================= 斗法 ================= */
const PROJ = { slime: 'orb', paper: 'talisman', beast: 'fire', rock: 'orb', fox: 'fire', collector: 'talisman', rival: 'sword', boss: 'orb' };
async function battle(kind, mul, name) {
  const P = PL; if (!P) return Math.random() < 0.5;
  const myPow = power(), enPow = myPow * mul * rnd(0.8, 1.2);
  let myHp = myPow * 5.5, enHp = enPow * 5;
  // 先模拟
  const rounds = []; let a = myHp, b = enHp, turn = 0;
  while (a > 0 && b > 0 && turn < 14) { if (turn % 2 === 0) { const crit = Math.random() < 0.06 + S.st.luck * 0.015; const d = myPow * rnd(0.8, 1.2) * (crit ? 1.8 : 1); b -= d; rounds.push({ me: 1, d, crit }); } else { const d = enPow * rnd(0.8, 1.2); a -= d; rounds.push({ me: 0, d }); } turn++; }
  const win = b <= 0 || (a > 0 && a / myHp > b / enHp);
  // 演出
  const save = { i: P.i, j: P.j, fixed: P.fixed };
  P.fixed = true; P.i = 3.5; P.j = 6.5; P.face = 1; P.hp = myHp; P.hpMax = myHp; P.hpShow = myHp; P.hpCol = '#5fd6c0';
  const E = R.addActor({ monster: kind, i: 6.5, j: 3.5, fixed: true, face: -1, scale: kind === 'boss' ? 1.9 : 1.35, label: name, labelCol: '#ffb0b0', hp: enHp, hpMax: enHp, hpShow: enHp, shadow: kind === 'boss' ? 2 : 1.1 });
  R.ents.forEach(e => { if (e.kind === 'actor' && e !== P && e !== E) e.alpha = 0.25; });
  $('battleTag').classList.remove('hidden'); G0.fast = false;
  const tap = () => { G0.fast = true; }; document.addEventListener('pointerdown', tap);
  const ps = () => R.screenOf(P, -30), es = () => R.screenOf(E, -30);
  R.ring(...es(), '#ff6a6a', 50); await sleep(500);
  for (const rd of rounds) {
    const from = rd.me ? ps() : es(), to = rd.me ? es() : ps(), tgt = rd.me ? E : P;
    SFX.swish();
    await new Promise(res => R.proj(from, to, rd.me ? 'sword' : PROJ[kind], 0.35 / (G0.fast ? 2.5 : 1), res));
    tgt.hp = Math.max(0, tgt.hp - rd.d); tgt.flashT = 0.12; SFX.hit(); R.shake = rd.crit ? 9 : 4;
    R.burst(to[0], to[1], rd.crit ? 26 : 14, rd.me ? '#bff4ff' : '#ffb080', 70, 0.6, 2.6, 80);
    R.floatText(to[0] + rnd(-8, 8), to[1] - 26, (rd.crit ? '暴击 ' : '-') + Math.round(rd.d), rd.me ? (rd.crit ? '#ffd75e' : '#fff') : '#ff7a6a', rd.crit ? 20 : 15);
    await sleep(380);
  }
  if (win) { E.hp = Math.min(E.hp, 0); R.burst(...es(), 40, '#ffd75e', 90, 1, 3); SFX.chime(); R.floatText(es()[0], es()[1] - 50, '胜！', '#ffd75e', 26); }
  else { SFX.fail(); R.floatText(ps()[0], ps()[1] - 50, '败…', '#ff7a6a', 24); }
  for (let k = 0; k < 10; k++) { (win ? E : P).alpha = 1 - k / 12; await sleep(60); }
  await sleep(300);
  document.removeEventListener('pointerdown', tap); G0.fast = false; $('battleTag').classList.add('hidden');
  R.ents.splice(R.ents.indexOf(E), 1); P.alpha = null; Object.assign(P, save); delete P.hp; delete P.hpMax;
  R.ents.forEach(e => { if (e.kind === 'actor') e.alpha = null; });
  return win;
}

/* ================= 突破 / 天劫 ================= */
function breakChance() {
  const r = REALMS[S.realm]; let p = r.rate + S.st.int * 0.012 + S.st.luck * 0.006 + (S.injured > 0 ? -0.15 : 0); const pills = [];
  if (S.realm === 1 && S.items.zjd) { p += 0.3 * (1 + G.mod('pill')); pills.push('zjd'); }
  if (S.items.pjd) { p += 0.15 * (1 + G.mod('pill')); pills.push('pjd'); }
  if (REALMS[S.realm + 1].trib) p += G.mod('trib') + (LINGGEN[S.ling].trib || 0) + (S.tribBonus || 0);
  return { p: Math.max(0.05, Math.min(0.97, p)), pills };
}
async function doBreak() {
  if (busy || !canBreak()) return;
  if (S.realm === 0 && !S.flags.manual) { toast('没有功法，不知道怎么突破……<br>（拜入宗门/拜师/淘个秘籍）'); return; }
  const { p, pills } = breakChance(), next = REALMS[S.realm + 1];
  const ok = await new Promise(res => { openModal('<div class="ptitle">' + (S.realm === 6 ? '白日飞升' : '冲击' + next.n) + '</div><div class="big">当前成功率：<b style="color:#b8402a;font-size:22px">' + Math.round(p * 100) + '%</b><br>' + (pills.length ? '将服用：' + pills.map(x => ITEMS[x].n).join('、') + '<br>' : '') + (next.trib ? '<span style="color:#7a2a12">※ 需渡 ' + next.trib + ' 道天劫！失败可能身死道消</span><br>' : '失败会损失修为并受伤<br>') + (S.realm === 6 ? '<span style="color:#7a2a12">天道正在门口等你结尾款……</span>' : '') + '</div><div class="row2"><button class="btn ghost" id="bkNo">再等等</button><button class="btn gold" id="bkGo">冲！</button></div>'); bind('bkNo', () => { closeModal(); res(false); }); bind('bkGo', () => { closeModal(); res(true); }); });
  if (!ok) return; busy = true;
  try {
    pills.forEach(x => G.item(x, -1));
    const success = Math.random() < p; PL.fixed = true; PL.i = 4.5; PL.j = 5.5; const P = R.screenOf(PL, -30);
    log('你开始冲击' + next.n + '……');
    if (next.trib) {
      R.darken = 1; SFX.thunder(); await sleep(1200); const n = next.trib;
      for (let k = 0; k < n; k++) {
        const last = k === n - 1; SFX.thunder(); R.bolt(P[0], P[1] + 20); R.burst(P[0], P[1] + 10, 30, '#d8d0ff', 120, 0.7, 3, 100);
        R.floatText(P[0] + [-50, 50, 0][k % 3], P[1] - 60 - (k % 3) * 16, '第' + (k + 1) + '道', '#e0d8ff', 16); PL.flashT = 0.15;
        if (last && !success) R.shake = 20;
        await sleep(last ? 900 : 650 - Math.min(300, n * 20));
      }
      if (S.realm === 6 && success) { // 最终boss
        log('天劫散去，一朵算盘形状的云飘了下来——<span class="gold">讨尾款的天道</span>现身了！');
        R.darken = 0.4; const win = await battle('boss', 1.0, '讨尾款的天道');
        if (!win) { R.darken = 0; S.injured = 5; S.exp *= 0.5; log('<span class="bad">你被天道一算盘拍回人间。修为大损，负伤五年。</span>'); banner('飞升失败', '天道：尾款结清了再来'); SFX.fail(); return; }
      }
      R.darken = 0;
    } else { R.ring(P[0], P[1] + 20, '#ffd75e', 80, 1); R.burst(P[0], P[1], 30, '#ffe9a0', 60, 1.2, 2.5, -20); await sleep(900); }
    if (success) {
      S.realm++; S.stage = 0; S.exp = 0; if (S.realm > (META_S.best || 0)) { META_S.best = S.realm; saveMeta(); }
      R.flash = 0.9; R.flashCol = '#fff6c0'; SFX.levelup(); for (let k = 0; k < 3; k++) R.ring(P[0], P[1] + 20, '#ffd75e', 90 + k * 40, 1 + k * 0.3); R.burst(P[0], P[1], 80, '#ffd75e', 140, 1.6, 3.2, 40);
      if (S.realm === 7) { log('<span class="gold">天道收下尾款，金光大道铺开。你踏云而上——白日飞升！</span>'); banner('白日飞升！', '恭喜还清天道尾款'); refreshPlayerLook(); await sleep(2600); await die('飞升', '你飞升仙界，成为了一名……仙界的打工人。', true); return; }
      log('<span class="gold">突破成功！你晋入' + realmName() + '，寿元大增！</span>'); banner('突破成功', realmName());
      if (S.realm === 1) G.unlock('secret');
    } else {
      SFX.fail();
      if (next.trib) {
        if (S.items.tsf) { G.item('tsf', -1); S.injured = 5; S.exp *= 0.4; log('<span class="bad">天劫将你劈得外焦里嫩，替死符化为灰烬，保住了你一条小命。</span>'); banner('渡劫失败', '替死符救了你一命'); }
        else if (G.has('bsxq') && !S.revived) { S.revived = 1; S.injured = 5; S.exp = 0; log('<span class="bad">你被雷劈成了焦炭……然后焦炭动了一下。不死小强发动！</span>'); banner('渡劫失败', '不死小强：又活了'); }
        else if (G.roll(0.45 + S.st.luck * 0.03)) { S.injured = 6; S.exp = 0; G.life(-Math.round(lifespan() * 0.1)); log('<span class="bad">天劫失败，你重伤濒死，侥幸活了下来。修为尽散，寿元大损。</span>'); banner('渡劫失败', '侥幸未死'); }
        else { await die('渡劫失败', '第' + next.trib + '道天雷落下，你化作了一缕青烟。天道在小本本上划掉了你的名字。'); return; }
      } else { S.exp *= 0.6; S.injured = 2; log('<span class="bad">突破失败！真气逆行，修为受损，负伤两年。</span>'); banner('突破失败', '道心受挫'); }
    }
  } finally { busy = false; R.darken = 0; if (PL) PL.fixed = false; if (S && S.alive) { updateHUD(); saveLife(); } }
}

/* ================= 死亡与结算 ================= */
async function die(cause, text, ascended) {
  if (!S.alive) return;
  if (!ascended && cause !== '寿终正寝' && G.has('bsxq') && !S.revived) { S.revived = 1; log('<span class="gold">你本该死了，但不死小强发动，你又爬了起来！</span>'); return; }
  S.alive = false; S.cause = cause; log('<span class="bad">' + text + '</span>'); saveLife();
  if (!ascended) { SFX.death(); if (PL) { PL.mood = 'sad'; for (let k = 0; k < 10; k++) { PL.alpha = 1 - k / 10; await sleep(80); } } }
  const pts = Math.round(S.age / 10 + S.realm * S.realm * 3 + S.realm * 3 + S.kills * 0.3 + (S.fame || 0) * 2 + (ascended ? 60 : 0) + 3);
  META_S.pts += pts; META_S.n++; META_S.lives.unshift({ n: META_S.n, name: S.name, age: S.age, realm: realmName(), cause, ling: LINGGEN[S.ling].n }); META_S.lives = META_S.lives.slice(0, 30); saveMeta();
  try { localStorage.removeItem(LS_LIFE); } catch (e) {}
  const grade = ascended ? 'SSS' : ['D', 'C', 'B', 'A', 'S', 'S+', 'SS'][S.realm];
  const comment = ascended ? '还清尾款，位列仙班。落魄剑仙在下界为你烧了一壶好酒。' : ['平凡的一生，也是一生。至少你种的萝卜很甜。', '踏入了仙途，但仙途太长，腿太短。', '筑基有成，在村里吹了一辈子。', '金丹修士，一方高人，就是有点穷。', '元婴老怪，小孩子听到你的名字都不敢哭。', '化神大能，离飞升只差几笔尾款。', '渡劫期！就差最后一哆嗦！'][S.realm];
  await sleep(600);
  $('dTitle').textContent = ascended ? '飞升成仙' : '此生已尽';
  $('dBody').innerHTML = '<div class="grade">' + grade + '</div><div class="big" style="text-align:center;margin-bottom:8px">' + comment + '</div>' +
    [['姓名', S.name], ['灵根', LINGGEN[S.ling].n], ['享年', S.age + ' 岁'], ['境界', realmName()], ['死因', cause], ['斩妖', S.kills + ' 只'], ['天赋', S.talents.map(t => TALENTS.find(x => x.id === t).n).join('、')]].map(([k, v]) => '<div class="kv"><span>' + k + '</span><b>' + v + '</b></div>').join('') +
    '<div class="big" style="text-align:center;margin-top:10px">获得 <b style="color:#b8402a;font-size:24px">' + pts + '</b> 轮回点（共 ' + META_S.pts + '）</div>';
  showScreen('deathScr');
}

/* ================= 行囊 / 商店 / 地图 / 菜单 ================= */
function bagModal() {
  const ks = Object.keys(S.items);
  openModal('<div class="ptitle">行囊</div><div class="list">' + (ks.length ? ks.map(k => '<div class="it"><div><div class="nm">' + ITEMS[k].n + ' ×' + S.items[k] + '</div><div class="ds">' + ITEMS[k].d + '</div></div>' + (['hcd', 'ysd', 'pyd'].includes(k) ? '<button class="btn sm" data-use="' + k + '">使用</button>' : '') + '</div>').join('') : '<div class="hint" style="padding:20px">空空如也，跟你的钱袋一样</div>') +
    '</div><div class="ptitle s">天赋</div>' + S.talents.map(id => { const t = TALENTS.find(x => x.id === id); return '<div class="card"><div class="gem" style="background:' + RCOL[t.r] + '">' + t.n[0] + '</div><div><div class="tn">' + t.n + '</div><div class="td">' + t.d + '</div></div></div>'; }).join('') +
    '<div class="row2"><button class="btn" id="bagX">关闭</button></div>');
  bind('bagX', closeModal);
  document.querySelectorAll('[data-use]').forEach(b => bind(b, () => { const k = b.dataset.use, pm = 1 + G.mod('pill'); G.item(k, -1);
    if (k === 'hcd') { S.injured = 0; G.life(Math.round(5 * pm)); log('你服下回春丹，伤势痊愈。'); } if (k === 'ysd') { G.life(Math.round(30 * pm)); log('你服下延寿丹，<span class="res">寿元+' + Math.round(30 * pm) + '</span>'); } if (k === 'pyd') { G.cultYear(1.5 * pm); log('你服下培元丹，修为大涨。'); }
    SFX.chime(); updateHUD(); saveLife(); bagModal(); }));
}
function price(k) { return Math.round(ITEMS[k].p * (1 + S.realm * 0.25) * (1 - Math.min(0.3, S.st.cha * 0.02))); }
function shopModal() {
  return new Promise(done => {
    const draw = () => { openModal('<div class="ev"><canvas id="evPic"></canvas><div><div class="who">奸商·钱多多</div><div class="txt">“童叟无欺，假一赔……再说吧。”<br>你有灵石：<b>' + S.stones + '</b></div></div></div><div class="list">' + SHOP.map(k => '<div class="it"><div><div class="nm">' + ITEMS[k].n + '</div><div class="ds">' + ITEMS[k].d + '</div></div><button class="btn gold sm" data-buy="' + k + '">' + price(k) + '</button></div>').join('') + '</div><div class="row2"><button class="btn" id="shX">离开</button></div>');
      R.portrait($('evPic'), NPC.merchant); bind('shX', () => { closeModal(); done(); });
      document.querySelectorAll('[data-buy]').forEach(b => bind(b, () => { const k = b.dataset.buy, p = price(k);
        if (S.stones < p && !G.has('szjj')) { toast('灵石不够！（赊账剑诀可以欠账）'); return; }
        if (G.has('bphy') && G.roll(0.25)) { toast('白嫖护体发动！老板忘记收钱了'); } else { S.stones -= p; if (S.stones < 0) S.debtHeat = (S.debtHeat || 0) + 1; }
        G.item(k, 1); SFX.coin(); updateHUD(); saveLife(); draw(); })); };
    draw(); modalClose = () => { closeModal(); done(); };
  });
}
function mapModal() {
  openModal('<div class="ptitle">云游四方</div>' + Object.entries(LOCS).map(([k, L]) => { const ok = L.ok(); return '<div class="loc ' + (k === S.loc ? 'cur' : '') + (ok ? '' : ' lock') + '" data-loc="' + k + '"><div><div class="ln">' + L.n + (k === S.loc ? '（当前）' : '') + '</div><div class="ld">' + (ok ? L.d : '【未解锁】' + L.lock) + '</div></div></div>'; }).join('') + '<div class="row2"><button class="btn" id="mpX">关闭</button></div>');
  bind('mpX', closeModal);
  document.querySelectorAll('[data-loc]').forEach(el => bind(el, () => { const k = el.dataset.loc; if (!LOCS[k].ok()) { toast(LOCS[k].lock); return; } if (k === S.loc) { closeModal(); return; } closeModal(); travel(k); }));
}
async function travel(k) { await fade(() => { S.loc = k; R.setMap(k); populate(k); updateHUD(); saveLife(); }); banner(LOCS[k].n); log('你来到了' + LOCS[k].n + '。'); }
function menuModal() {
  openModal('<div class="ptitle">菜单</div><div class="menu" style="margin:10px auto">' +
    '<button class="btn" id="mnBack">继续游戏</button><button class="btn ghost" id="mnMusic">音乐：' + (SFX.musicOn ? '开' : '关') + '</button><button class="btn ghost" id="mnHelp">玩法说明</button><button class="btn red" id="mnTitle">回到标题</button><button class="btn red sm" id="mnSuicide">兵解重修（结束此生）</button></div>');
  bind('mnBack', closeModal); bind('mnMusic', () => { SFX.setMusic(!SFX.musicOn); menuModal(); }); bind('mnHelp', helpModal);
  bind('mnTitle', () => { closeModal(); saveLife(); toTitle(); });
  bind('mnSuicide', () => { closeModal(); if (!busy) die('兵解', '你觉得这辈子开局不好，果断兵解，重入轮回。'); });
}
function helpModal() {
  openModal('<div class="ptitle">玩法</div><div class="big">' +
    '① 投胎：抽 3 个天赋、分配先天属性、摸出灵根。<br>② 每次点一个<b>行动</b>就过一年（闭关会过好几年），随机触发奇遇事件。<br>③ 修为满了点<b>突破</b>：凡人→练气→筑基→金丹→元婴→化神→渡劫→<b>飞升</b>。金丹起要渡天劫！<br>④ 用<b>地图</b>去不同地方：宗门修炼快，坊市能赚钱买丹药，秘境斩妖掉宝。<br>⑤ 寿元耗尽或渡劫失败就会死。死后获得<b>轮回点</b>，在轮回殿永久变强，再来一世。<br>⑥ 斗法自动进行，点击屏幕可加速。<br><br>终极目标：还清天道的尾款，白日飞升！</div><div class="row2"><button class="btn" id="hpX">明白了</button></div>');
  bind('hpX', closeModal);
}
function metaModal() {
  const draw = () => { openModal('<div class="ptitle">轮回殿 <small>轮回点：<b>' + META_S.pts + '</b></small></div><div class="hint">孟婆汤可以不喝，但轮回点要花</div><div class="list">' +
    META.map(m => { const l = mlv(m.id), max = l >= m.max; return '<div class="it"><div><div class="nm">' + m.n + ' <small>Lv' + l + '/' + m.max + '</small></div><div class="ds">' + m.d + '</div></div><button class="btn gold sm" data-m="' + m.id + '" ' + (max ? 'disabled' : '') + '>' + (max ? '已满' : m.cost(l)) + '</button></div>'; }).join('') + '</div><div class="row2"><button class="btn" id="mtX">关闭</button></div>');
    bind('mtX', () => { closeModal(); updateTitle(); });
    document.querySelectorAll('[data-m]').forEach(b => bind(b, () => { const m = META.find(x => x.id === b.dataset.m), l = mlv(m.id), c = m.cost(l); if (l >= m.max) return; if (META_S.pts < c) { toast('轮回点不足，再去死几次吧'); return; } META_S.pts -= c; META_S.lv[m.id] = l + 1; saveMeta(); SFX.chime(); draw(); })); };
  draw();
}
function histModal() {
  openModal('<div class="ptitle">往世录</div><div class="hint">共轮回 ' + META_S.n + ' 世 · 最高境界：' + REALMS[META_S.best || 0].n + '</div><div class="list">' + (META_S.lives.length ? META_S.lives.map(l => '<div class="it"><div><div class="nm">第' + l.n + '世 · ' + l.name + '</div><div class="ds">' + l.ling + ' · 享年' + l.age + ' · ' + l.realm + ' · ' + l.cause + '</div></div></div>').join('') : '<div class="hint" style="padding:20px">还没有前世。你是一张白纸。</div>') + '</div><div class="row2"><button class="btn" id="hsX">关闭</button></div>');
  bind('hsX', closeModal);
}

/* ================= 投胎 ================= */
let draft = null;
function newDraft() {
  const n = 8 + mlv('cand'), pool = TALENTS.slice().sort(() => Math.random() - 0.5);
  // 稀有度加权：金色较少
  const cands = []; for (const t of pool) { if (cands.length >= n) break; if (t.r === 3 && Math.random() < 0.55) continue; cands.push(t.id); }
  while (cands.length < n) { const t = pick(TALENTS).id; if (!cands.includes(t)) cands.push(t); }
  draft = { cands, sel: [], rerolls: 1 + mlv('reroll'), name: randName(), ling: null, st: { con: 0, int: 0, luck: 0, cha: 0, wealth: 0 }, pts: 20 + mlv('pts') * 2 };
  randStats();
}
function randStats() { const st = draft.st; for (const k in st) st[k] = 0; let p = draft.pts; while (p > 0) { const k = pick(Object.keys(st)); if (st[k] < 10) { st[k]++; p--; } } }
function rollLing() { let w = LINGGEN.map(l => l.w), lim = mlv('root') ? 3 : 6; let tot = 0; for (let i = 0; i <= lim; i++) tot += w[i]; let r = Math.random() * tot; for (let i = 0; i <= lim; i++) { r -= w[i]; if (r <= 0) return i; } return lim; }
function drawTalents() {
  const L = $('talentList'); L.innerHTML = '';
  draft.cands.forEach(id => { const t = TALENTS.find(x => x.id === id), d = document.createElement('div'); d.className = 'card r' + t.r + (draft.sel.includes(id) ? ' sel' : '');
    d.innerHTML = '<div class="gem" style="background:' + RCOL[t.r] + '">' + t.n[0] + '</div><div><div class="tn" style="color:' + (t.r ? RCOL[t.r] : '#555') + '">' + t.n + '</div><div class="td">' + t.d + '</div></div>';
    bind(d, () => { const i = draft.sel.indexOf(id); if (i >= 0) draft.sel.splice(i, 1); else if (draft.sel.length < 3) draft.sel.push(id); else { draft.sel.shift(); draft.sel.push(id); } drawTalents(); }); L.appendChild(d); });
  $('bReroll').textContent = '刷新(' + draft.rerolls + ')'; $('bReroll').disabled = draft.rerolls <= 0; $('bTalentOk').disabled = draft.sel.length < 3;
}
function drawStats() {
  $('nameV').textContent = draft.name; const used = Object.values(draft.st).reduce((a, b) => a + b, 0); $('ptsV').textContent = draft.pts - used;
  if (draft.ling != null) { const l = LINGGEN[draft.ling]; $('lingV').innerHTML = '<span style="color:' + l.col + ';text-shadow:0 1px 0 #333">' + l.n + '</span>'; $('lingD').textContent = l.d + '（修炼×' + l.mul + '）'; $('bLing').classList.add('hidden'); }
  else { $('lingV').textContent = '？？？'; $('lingD').textContent = '点“摸骨”看看你的灵根'; $('bLing').classList.remove('hidden'); }
  $('statList').innerHTML = STATS.map(([k, n, d]) => '<div class="srow"><span class="sn">' + n + '</span><span class="sd">' + d + '</span><button class="btn ghost" data-s="' + k + '" data-d="-1">−</button><span class="sv">' + draft.st[k] + '</span><button class="btn ghost" data-s="' + k + '" data-d="1">＋</button></div>').join('');
  document.querySelectorAll('[data-s]').forEach(b => bind(b, () => { const k = b.dataset.s, d = +b.dataset.d, used = Object.values(draft.st).reduce((a, c) => a + c, 0); if (d > 0 && (used >= draft.pts || draft.st[k] >= 10)) return; if (d < 0 && draft.st[k] <= 0) return; draft.st[k] += d; drawStats(); }));
}
async function lingAnim() {
  const v = $('lingV'); for (let k = 0; k < 14; k++) { const l = LINGGEN[(Math.random() * 7) | 0]; v.innerHTML = '<span style="color:' + l.col + '">' + l.n + '</span>'; SFX.click(); await new Promise(r => setTimeout(r, 50 + k * 12)); }
  draft.ling = rollLing(); drawStats(); draft.ling <= 1 ? SFX.levelup() : SFX.chime();
}
function born() {
  if (draft.ling == null) draft.ling = rollLing();
  const st = Object.assign({}, draft.st); for (const id of draft.sel) { const t = TALENTS.find(x => x.id === id); if (t.s) for (const k in t.s) st[k] = Math.max(0, st[k] + t.s[k]); }
  S = { v: 1, name: draft.name, age: 0, ling: draft.ling, st, talents: draft.sel.slice(), realm: 0, stage: 0, exp: 0, stones: st.wealth * 25 + mlv('gold') * 100, lifeBonus: 0, loc: 'village', unlocked: { village: 1 }, flags: {}, items: {}, injured: 0, log: [], seen: {}, kills: 0, fame: 0, alive: true,
    look: { hair: pick(['#2a1b14', '#1a1a2a', '#4a2a1a', '#3a2a4a']), ribbon: pick(['#ff5a6a', '#5a8fd8', '#ffd75e', '#9be15d', '#c07aff']), long: Math.random() < 0.5 } };
  if (S.stones > 0 && G.has('fed')) S.stones += 100;
  if (G.has('luox')) S.flags.mentor = 1;
  startLife(true);
}
async function startLife(fresh) {
  await fade(() => { showScreen('game'); R.setMap(S.loc); populate(S.loc); renderLog(); updateHUD(); });
  if (fresh) { log('你出生在桃花村一户' + (S.st.wealth >= 7 ? '富裕的地主' : S.st.wealth >= 4 ? '普通的农' : '穷得叮当响的') + '人家。接生婆说你哭声嘹亮，' + pick(['像个讨债的。', '必成大器。', '吵死了。']) + '<span class="res">（' + LINGGEN[S.ling].n + '）</span>'); saveLife(); }
  else log('<span class="res">（前尘未了，继续此生）</span>');
}

/* ================= 标题 ================= */
function updateTitle() {
  const L = loadLife(); $('bContinue').style.display = L && L.alive ? '' : 'none';
  if (L && L.alive) $('bContinue').textContent = '继续此生 · ' + L.name + ' ' + L.age + '岁';
  $('metaLine').textContent = META_S.n ? '已轮回 ' + META_S.n + ' 世 · 轮回点 ' + META_S.pts + ' · 最高 ' + REALMS[META_S.best || 0].n : '仙途漫漫，不如……先投个胎';
  $('bMusic').textContent = '音乐：' + (SFX.musicOn ? '开' : '关');
}
function toTitle() { fade(() => { S = null; showScreen('title'); R.setMap('village'); populate('village'); updateTitle(); }); }

/* ================= 绑定 ================= */
bind('bNew', () => { newDraft(); drawTalents(); showScreen('talentScr'); });
bind('bContinue', () => { const L = loadLife(); if (!L) return; S = L; startLife(false); });
bind('bMeta', metaModal); bind('bHist', histModal); bind('bHelp', helpModal);
bind('bMusic', () => { SFX.setMusic(!SFX.musicOn); updateTitle(); });
bind('bReroll', () => { if (draft.rerolls <= 0) return; draft.rerolls--; const keep = draft.sel.slice(); const r = draft.rerolls; const nm = draft.name; newDraft(); draft.rerolls = r; draft.name = nm; draft.sel = []; drawTalents(); });
bind('bTalentOk', () => { if (draft.sel.length < 3) return; drawStats(); showScreen('statScr'); });
bind('bName', () => { draft.name = randName(); drawStats(); });
bind('bLing', lingAnim);
bind('bRand', () => { randStats(); drawStats(); });
bind('bBorn', () => { const used = Object.values(draft.st).reduce((a, b) => a + b, 0); if (used < draft.pts) { toast('还有 ' + (draft.pts - used) + ' 点属性没分配哦'); return; } SFX.gong(); born(); });
bind('bMenu', menuModal); bind('bMap', () => { if (!busy) mapModal(); }); bind('bBag', () => { if (!busy) bagModal(); }); bind('bBreak', doBreak);
bind('dAgain', () => { newDraft(); drawTalents(); showScreen('talentScr'); R.setMap('village'); populate('village'); });
bind('dMeta', metaModal);
window.onAndroidBack = () => { if (!$('modal').classList.contains('hidden')) { if (modalClose) modalClose(); return true; } if ($('hud').classList.contains('hidden')) { if ($('title').classList.contains('on')) return false; toTitle(); return true; } if (!busy) menuModal(); return true; };
window.onAppPause = () => { SFX.suspend(); saveLife(); }; window.onAppResume = () => SFX.resume();
document.addEventListener('visibilitychange', () => { if (document.hidden) { SFX.suspend(); saveLife(); } else SFX.resume(); });

R.init($('cv'));
populate('village'); showScreen('title'); updateTitle();
window.__wbx = { get S() { return S; }, G, R, doAction, doBreak, battle, runEvent, travel, META: () => META_S }; // 调试/测试用

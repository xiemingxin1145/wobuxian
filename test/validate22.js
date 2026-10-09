// v2.2 内容校验：node test/validate22.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const W = path.join(__dirname, '..', 'www');
const ctx = { window: {}, console, Math, JSON, setTimeout, document: { addEventListener() {}, querySelector() { return null; } }, localStorage: { getItem() { return null; }, setItem() {} } };
ctx.window = ctx; vm.createContext(ctx);
const run = f => vm.runInContext(fs.readFileSync(path.join(W, f), 'utf8'), ctx, { filename: f });
run('assets/assets.js');
const html = fs.readFileSync(path.join(W, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)"/g)].map(m => m[1]).filter(s => !/version|assets|update|main/.test(s));
const errs = [];
for (const s of scripts) { try { run(s); } catch (e) { if (!/is not defined|Cannot read|not a function|addEventListener/.test(e.message)) errs.push(s + ': ' + e.message); } }
const g = k => vm.runInContext(`typeof ${k} !== 'undefined' ? ${k} : undefined`, ctx);
const EVENTS = g('EVENTS'), ITEMS = g('ITEMS'), NPCS = g('NPCS'), MONS = g('MONS'), PET_SKILL = g('PET_SKILL'), SKILLS = g('SKILLS'), QUESTS = g('QUESTS'), MAIN = g('MAIN'), MAPINFO = g('MAPINFO'), MAP_ORDER = g('MAP_ORDER'), AS = ctx.ASSETS;
const NEWSPR = (process.env.NEWSPR || '').split(',').filter(Boolean);
const porOK = k => { if (!k) return true; if (k.startsWith('i:')) return !!AS.icons.f[k.slice(2)]; return !!(AS.portraits.f[k] || NEWSPR.includes(k)); };
const sprOK = k => !!(AS.sprites[k] || NEWSPR.includes(k));
// 事件
const ids = new Set(); let n22 = 0;
for (const e of EVENTS) {
  const [id, , , cond, w, por, ...opts] = e; if (ids.has(id)) errs.push('dup event ' + id); ids.add(id); if (id.startsWith('v2_')) n22++; else continue;
  if (!porOK(por)) errs.push(`${id}: portrait ${por}`);
  for (const tk of (cond || '').split(';').filter(Boolean)) { const t = tk.replace(/^!/, ''); if (!(/^(sect|partner|pet)$/.test(t) || /^(flag|tech|item):\w+$/.test(t) || /^([a-z.]+)(:[a-z_]+)?(>=|<=|=|<|>)(-?[\w.]+)$/.test(t))) errs.push(`${id}: cond ${tk}`); const m = t.match(/^aff:(\w+)/); if (m && !NPCS[m[1]]) errs.push(`${id}: cond aff ${m[1]}`); const mi = t.match(/^item:(\w+)/); if (mi && !ITEMS[mi[1]]) errs.push(`${id}: cond item ${mi[1]}`); }
  if (!opts.length) errs.push(id + ': no options');
  for (const o of opts) {
    if (!Array.isArray(o) || o.length < 3) { errs.push(`${id}: bad option`); continue; }
    const effs = [o[1], o.length > 4 ? o[4] : ''];
    if (o.length > 3 && !(typeof o[3] === 'number' || /^\w+:[\d.]+$/.test(o[3]))) errs.push(`${id}: chance ${o[3]}`);
    for (const eff of effs) for (const tk of (eff || '').split(';').filter(Boolean)) {
      if (/^(exp|stone|hp|life|age|debt|karma|contrib|con|int|luck|cha|wealth|alch|brk)([+\-%])(-?[\d.]+)$/.test(tk)) continue;
      const p = tk.split(':');
      const ok = { item: () => ITEMS[p[1]], aff: () => NPCS[p[1]] || p[1] === 'mentor', flag: () => p[1], unflag: () => p[1], tech: () => p[1] === 'rand', pet: () => p[1] === 'rand' || PET_SKILL[p[1]], eq: () => true, fight: () => MONS[p[1]], ending: () => true, debtpay: () => true, debtint: () => true, petexp: () => true, atkup: () => true, spd: () => true }[p[0]];
      if (!ok || !ok()) errs.push(`${id}: effect ${tk}`);
    }
  }
}
// 任务
for (const [q, Q] of Object.entries(QUESTS)) {
  if (!NPCS[Q.giver]) errs.push(`quest ${q} giver ${Q.giver}`);
  if (Q.pre && !QUESTS[Q.pre] && !['q_story', 'q_soup', 'q_hairpin', 'q_coral', 'q_witch'].includes(Q.pre)) errs.push(`quest ${q} pre ${Q.pre}`);
  for (const k in (Q.need.k || {})) if (!MONS[k]) errs.push(`quest ${q} kill ${k}`);
  for (const k in (Q.need.i || {})) if (!ITEMS[k]) errs.push(`quest ${q} item ${k}`);
  for (const k in ((Q.rw || {}).item || {})) if (!ITEMS[k]) errs.push(`quest ${q} reward ${k}`);
}
// 角色/怪物/地图/主线
for (const [k, N] of Object.entries(NPCS)) { if (!sprOK(N.spr)) errs.push(`npc ${k} spr ${N.spr}`); if (N.por && !porOK(N.por)) errs.push(`npc ${k} por ${N.por}`); if (N.map && !MAPINFO[N.map]) errs.push(`npc ${k} map ${N.map}`); }
for (const [k, M] of Object.entries(MONS)) { if (!sprOK(M.spr)) errs.push(`mon ${k} spr ${M.spr}`); for (const s of M.sk) if (!SKILLS[s]) errs.push(`mon ${k} skill ${s}`); for (const d of M.drop) if (!ITEMS[d]) errs.push(`mon ${k} drop ${d}`); }
for (const [k, s] of Object.entries(PET_SKILL)) { if (!MONS[k]) errs.push('pet ' + k); for (const x of s) if (!SKILLS[x]) errs.push(`pet ${k} skill ${x}`); }
for (const [k, S] of Object.entries(SKILLS)) if (S.ic && !AS.icons.f[S.ic]) errs.push(`skill ${k} icon ${S.ic}`);
for (const id of MAP_ORDER) { const I = MAPINFO[id]; if (!I) { errs.push('map ' + id); continue; } for (const m of I.mons) if (!MONS[m]) errs.push(`map ${id} mon ${m}`); if (I.boss && !MONS[I.boss]) errs.push(`map ${id} boss`); if (!AS.maps[id] && !NEWSPR.includes('map:' + id)) errs.push(`map ${id} not in assets`); }
const mids = MAIN.map(m => m.id); if (new Set(mids).size !== mids.length) errs.push('dup MAIN ids');
for (const m of MAIN) { if (m.map && !MAPINFO[m.map]) errs.push(`main ${m.id} map`); if (m.boss && !MONS[m.boss]) errs.push(`main ${m.id} boss`); }
const GACHA = g('GACHA'), MOUNTS = g('MOUNTS'), COSTUMES = g('COSTUMES');
for (const t in GACHA.pool) for (const [k, a] of GACHA.pool[t]) { if (k === 'mount' && !MOUNTS[a]) errs.push('gacha mount ' + a); if (k === 'cos' && !COSTUMES[a]) errs.push('gacha cos ' + a); if (k === 'pet' && a !== 'rand' && !PET_SKILL[a]) errs.push('gacha pet ' + a); }
for (const k in MOUNTS) if (!sprOK(MOUNTS[k].spr)) errs.push(`mount ${k} spr ${MOUNTS[k].spr}`);
const CG_OF = g('CG_OF') || {}; for (const k in CG_OF) if (!fs.existsSync(path.join(W, 'assets/cg', CG_OF[k] + '.webp'))) errs.push('cg missing ' + CG_OF[k]);
console.log(JSON.stringify({ events: EVENTS.length, events_v22: n22, quests: Object.keys(QUESTS).length, npcs: Object.keys(NPCS).length, mons: Object.keys(MONS).length, maps: MAP_ORDER.length, chapters: MAIN.map(m => m.n), errors: errs }, null, 1));
process.exit(errs.length ? 1 : 0);

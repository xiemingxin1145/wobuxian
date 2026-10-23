// 3.5 一键连炼（ROADMAP P2 #16）：炼丹/炼器批量执行，免去逐炉小游戏。
// 规则：连炼不玩火候小游戏，按「中等火候」q=0.4 计成功率（手动完美火候 q≈1 仍更划算，也只有手动能多出一颗）；
// 每炉照常扣 1 行动力和材料；炼丹一次最多 10 炉，炼器一次最多 5 炉；行动力/材料/灵石不够时提前停。
const LIAN35 = {
  Q: 0.4, MAX_ALCH: 10, MAX_FORGE: 5,
  chance(r, q, bonus) {
    const G = Game.G;
    return Math.min(0.97, 0.55 + G.alchLv * 0.06 + G.alchBonus + Game.treeVal('alch') + Game.techVal('alch') + (bonus || 0) + (G.sect === 'baicao' ? 0.2 : 0) + q * 0.2 - r.lv * 0.05);
  },
  canAlch(r) { const G = Game.G; return G.alchLv >= r.lv && Object.entries(r.need).every(([i, c]) => Game.has(i, c)); },
  // 本次最多能连几炉（受行动力、材料、上限约束）
  maxAlch(r) {
    const G = Game.G; if (G.alchLv < r.lv) return 0;
    let n = Math.min(this.MAX_ALCH, Math.max(0, Math.floor(G.ap)));
    for (const [i, c] of Object.entries(r.need)) n = Math.min(n, Math.floor((G.inv[i] || 0) / c));
    return Math.max(0, n);
  },
  // 返回 { runs, ok, fail, made }；rng 可注入方便测试
  batchAlch(r, n, bonus, rng) {
    const G = Game.G; rng = rng || Math.random; n = Math.min(n, this.maxAlch(r));
    const out = { runs: 0, ok: 0, fail: 0, made: 0 };
    for (let k = 0; k < n; k++) {
      if (!this.canAlch(r) || G.ap < 1) break;
      G.ap -= 1; for (const [i, c] of Object.entries(r.need)) Game.take(i, c);
      out.runs++;
      if (rng() < this.chance(r, this.Q, bonus)) { Game.give(r.out, r.n); out.ok++; out.made += r.n; G.alchCount = (G.alchCount || 0) + 1; }
      else out.fail++;
    }
    if (G.alchCount >= 10) Game.ach('alch10');
    return out;
  },
  forgeCost() { return Math.round(200 * POW(Game.power())); },
  maxForge() {
    const G = Game.G; if (!G.cave || !G.cave.forge) return 0;
    return Math.max(0, Math.min(this.MAX_FORGE, Math.floor((G.inv.ore || 0) / 2), G.inv.yd || 0, Math.floor(G.stone / this.forgeCost())));
  },
  // 返回炼成的装备列表
  batchForge(n, rng) {
    const G = Game.G; rng = rng || Math.random; n = Math.min(n, this.maxForge()); const cost = this.forgeCost(); const eqs = [];
    for (let k = 0; k < n; k++) {
      if (G.stone < cost || !Game.has('ore', 2) || !Game.has('yd', 1)) break;
      G.stone -= cost; Game.take('ore', 2); Game.take('yd', 1);
      const rar = Math.min(4, G.cave.forge + (rng() < 0.15 ? 1 : 0)); eqs.push(Game.randEq(Math.max(0.5, Game.power()), rar));
    }
    return eqs;
  },
  alchMsg(r, o) { return o.runs ? `连炼${o.runs}炉：成丹${o.ok}炉（${ITEMS[r.out].n}×${o.made}），炸炉${o.fail}炉` : '行动力或材料不足'; },
  forgeMsg(eqs) {
    if (!eqs.length) return '材料或灵石不足';
    const cnt = {}; for (const e of eqs) cnt[e.rar] = (cnt[e.rar] || 0) + 1;
    return `连炼${eqs.length}件：` + Object.keys(cnt).sort((a, b) => b - a).map(k => `${RARITY[k].n}×${cnt[k]}`).join('、');
  },
};

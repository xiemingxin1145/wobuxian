/* 我不仙 · 2.5D 等角渲染器（纯程序绘制，无外部美术资源） */
'use strict';
const R = (() => {
  const TW = 64, TH = 32, HZ = 10;
  let cv, ctx, W = 0, H = 0, dpr = 1, S = 1, OX = 0, OY = 0;
  let layout = { top: 70, bottom: 300 };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, t) => a + (b - a) * t;
  function srand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function shade(hex, f) {
    let c = parseInt(hex.slice(1), 16), r = c >> 16, g = (c >> 8) & 255, b = c & 255;
    if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }
  function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  const iso = (i, j, h = 0) => [(i - j) * TW / 2, (i + j) * TH / 2 - h * HZ];

  /* ---------------- 地图定义 ---------------- */
  const MAPS = {
    village: {
      name: '桃花村', sky: ['#9fd3ff', '#ffe3c4', '#ffc9d6'], mount: ['#9bb7d4', '#7f9cc0'], particle: 'petal',
      grid: [
        'ggfggggwww',
        'ggpppgggww',
        'gfpggpgggw',
        'ggpgdddpgg',
        'gppgdddpgf',
        'gpggdddpgg',
        'gpppppppgg',
        'ggfgpggfgg',
        'gggppgggfg',
        'ggggpggggg'],
      props: [['house', 1, 4], ['house', 4, 1], ['peach', 0, 0], ['peach', 2, 8], ['peach', 8, 1], ['willow', 7, 7], ['well', 3, 2],
        ['pine', 9, 4], ['pine', 0, 7], ['haystack', 7, 3], ['lantern', 6, 6], ['rock', 9, 9], ['fence', 3, 6], ['bush', 1, 1], ['bush', 8, 8]]
    },
    sect: {
      name: '青云宗', sky: ['#7ec3ff', '#d6f0ff', '#fff3d9'], mount: ['#7fa6c9', '#5f86ad'], particle: 'mote',
      grid: [
        'gggsssggpg',
        'gggsssgggg',
        'ggpsssgwwg',
        'gppppppwwg',
        'gpsssssgwg',
        'gpsssssggg',
        'gpsssssgfg',
        'gppppppppg',
        'ggggpggggg',
        'gfggpgggfg'],
      props: [['pagoda', 4, 1], ['pine', 0, 0], ['pine', 1, 2], ['pine', 9, 2], ['pine', 0, 8], ['incense', 4, 5], ['stonelamp', 2, 4], ['stonelamp', 6, 4],
        ['stonelamp', 2, 6], ['stonelamp', 6, 6], ['crane', 8, 5], ['bamboo', 9, 7], ['bamboo', 8, 9], ['rock', 7, 0], ['banner', 3, 8], ['banner', 5, 8]]
    },
    market: {
      name: '云来坊市', sky: ['#ffb07a', '#ffd9a0', '#ffe9c9'], mount: ['#c79a8a', '#a7787a'], particle: 'lantern',
      grid: [
        'ggppppppgg',
        'gpssssssgg',
        'gpsssssspg',
        'ppssssssps',
        'gpssssssgg',
        'gpssssssgg',
        'gppppppppg',
        'ggwwgpgggg',
        'gwwwgpggfg',
        'ggwggpgggg'],
      props: [['shop', 1, 0], ['shop', 5, 0], ['stall', 2, 3], ['stall', 6, 2], ['stall', 3, 6], ['stall', 7, 5], ['lanternpole', 1, 7], ['lanternpole', 8, 7],
        ['willow', 0, 9], ['peach', 9, 0], ['crates', 9, 4], ['bush', 8, 9], ['rock', 0, 4]]
    },
    secret: {
      name: '万妖秘境', sky: ['#2a1d4f', '#5b3b8c', '#c06fb8'], mount: ['#4b3a78', '#362a5e'], particle: 'spark',
      grid: [
        'xxxggxxxll',
        'xggggxgxll',
        'xgpppgggxl',
        'ggpxxpxgxx',
        'gppxxppggx',
        'xpgxxgpggx',
        'xppppppxgg',
        'gxxgpgxxgl',
        'llxgpgxggl',
        'lllxpxxggl'],
      props: [['portal', 4, 0], ['crystal', 1, 1], ['crystal', 8, 3], ['crystal', 0, 6], ['deadtree', 6, 1], ['deadtree', 2, 8], ['bones', 7, 6], ['crystal', 9, 6],
        ['skullrock', 5, 8], ['mushroom', 8, 8], ['mushroom', 1, 4], ['torch', 3, 2], ['torch', 6, 6]]
    }
  };
  const TILE = {
    g: { top: '#7fd06a', side: '#5aa64b', h: 0 }, f: { top: '#8fd877', side: '#5aa64b', h: 0, flowers: 1 },
    p: { top: '#e9d39c', side: '#c2a56b', h: 0, pebble: 1 }, s: { top: '#d9d6cf', side: '#a9a39a', h: 0.4, brick: 1 },
    d: { top: '#a77a4f', side: '#7d5634', h: 0, furrow: 1 }, w: { top: '#5cc4e8', side: '#3d97c2', h: -0.4, water: 1 },
    x: { top: '#5b4f86', side: '#3d3466', h: 0.3, crack: 1 }, l: { top: '#c45ad8', side: '#8b3aa0', h: -0.4, water: 1, lava: 1 }
  };
  const GRASS_SECRET = { top: '#6f8a7a', side: '#4b5f56' };

  /* ---------------- 道具精灵 ---------------- */
  function roof(c, x, y, w, h, col) { // 飞檐屋顶
    c.fillStyle = col; c.beginPath();
    c.moveTo(x - w / 2 - 10, y + 2); c.quadraticCurveTo(x - w / 2, y - 2, x - w / 2 + 6, y - h * 0.4);
    c.lineTo(x - w * 0.18, y - h); c.lineTo(x + w * 0.18, y - h); c.lineTo(x + w / 2 - 6, y - h * 0.4);
    c.quadraticCurveTo(x + w / 2, y - 2, x + w / 2 + 10, y + 2); c.quadraticCurveTo(x, y - 4, x - w / 2 - 10, y + 2); c.fill();
    c.strokeStyle = shade(col, -0.35); c.lineWidth = 1.5; c.stroke();
    c.fillStyle = shade(col, 0.25); c.fillRect(x - w * 0.2, y - h - 2, w * 0.4, 3);
    c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 1;
    for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(x + k * w * 0.07, y - h + 2); c.lineTo(x + k * w * 0.13, y - 3); c.stroke(); }
  }
  function isoBox(c, x, y, w, d, h, ct, cl, cr) { // 等角盒子 (底部中心 x,y)
    const hw = w / 2, hd = d / 2;
    c.fillStyle = cl; c.beginPath(); c.moveTo(x - hw, y - hd / 2 * 0); c.lineTo(x, y + hd / 2); c.lineTo(x, y + hd / 2 - h); c.lineTo(x - hw, y - h); c.closePath(); c.fill();
    c.fillStyle = cr; c.beginPath(); c.moveTo(x + hw, y); c.lineTo(x, y + hd / 2); c.lineTo(x, y + hd / 2 - h); c.lineTo(x + hw, y - h); c.closePath(); c.fill();
    c.fillStyle = ct; c.beginPath(); c.moveTo(x - hw, y - h); c.lineTo(x, y + hd / 2 - h); c.lineTo(x + hw, y - h); c.lineTo(x, y - hd / 2 - h); c.closePath(); c.fill();
  }
  function blob(c, x, y, r, col, hi) {
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, hi || shade(col, 0.35)); g.addColorStop(1, col); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  }
  const PROPS = {
    house: { w: 110, h: 120, ay: 100, draw(c) {
      isoBox(c, 0, 0, 70, 36, 34, '#f4e7cf', '#e9d6b4', '#d2b98f');
      c.fillStyle = '#7a4a2a'; c.fillRect(-26, -26, 12, 20); c.fillStyle = '#5a3018'; c.fillRect(-25, -25, 4, 18);
      c.fillStyle = '#ffdca0'; c.fillRect(10, -26, 12, 10); c.strokeStyle = '#7a4a2a'; c.lineWidth = 1.2; c.strokeRect(10, -26, 12, 10);
      c.beginPath(); c.moveTo(16, -26); c.lineTo(16, -16); c.moveTo(10, -21); c.lineTo(22, -21); c.stroke();
      roof(c, 0, -32, 84, 30, '#4f6d8f');
    } },
    pagoda: { w: 160, h: 230, ay: 200, draw(c) {
      isoBox(c, 0, 8, 120, 60, 12, '#e8e2d6', '#cfc6b6', '#b6ab98');
      isoBox(c, 0, -4, 92, 46, 46, '#fff1d6', '#e45a3c', '#b8402a');
      c.fillStyle = '#3a2418'; c.fillRect(-12, -44, 24, 36);
      c.fillStyle = '#ffd75e'; c.fillRect(-16, -62, 32, 12); c.fillStyle = '#7a2a12'; c.font = 'bold 9px serif'; c.textAlign = 'center'; c.fillText('青云宗', 0, -53);
      roof(c, 0, -50, 120, 34, '#2f8a7a');
      isoBox(c, 0, -80, 64, 32, 34, '#fff', '#e45a3c', '#b8402a');
      roof(c, 0, -112, 92, 30, '#2f8a7a');
      isoBox(c, 0, -138, 40, 20, 24, '#fff', '#e45a3c', '#b8402a');
      roof(c, 0, -160, 64, 26, '#2f8a7a');
      c.fillStyle = '#ffd75e'; c.beginPath(); c.arc(0, -190, 5, 0, 7); c.fill(); c.fillRect(-1.5, -190, 3, 10);
    } },
    shop: { w: 120, h: 130, ay: 110, draw(c) {
      isoBox(c, 0, 0, 80, 40, 40, '#f9e3c0', '#c8583a', '#a0402a');
      c.fillStyle = '#3a2418'; c.fillRect(-30, -34, 22, 26);
      c.fillStyle = '#ffd75e'; c.fillRect(4, -40, 30, 10); c.fillStyle = '#7a2a12'; c.font = 'bold 8px serif'; c.textAlign = 'center'; c.fillText('丹药铺', 19, -32);
      roof(c, 0, -38, 96, 32, '#5b3a8a');
      c.fillStyle = '#ff5a4a'; for (const sx of [-40, 40]) { c.beginPath(); c.ellipse(sx, -30, 5, 7, 0, 0, 7); c.fill(); }
    } },
    stall: { w: 90, h: 90, ay: 70, draw(c) {
      isoBox(c, 0, 0, 44, 24, 16, '#c99b62', '#a5763f', '#8a6030');
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -16); c.lineTo(0, -50); c.stroke();
      const cols = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff'], cc = cols[(Math.random() * 4) | 0];
      c.fillStyle = cc; c.beginPath(); c.ellipse(0, -50, 36, 14, 0, Math.PI, 0); c.fill();
      c.fillStyle = shade(cc, -0.2); c.beginPath(); c.ellipse(0, -50, 36, 5, 0, 0, Math.PI); c.fill();
      for (let k = 0; k < 4; k++) blob(c, -14 + k * 9, -20, 3.5, ['#ffd75e', '#9be15d', '#ff8fab', '#a0c4ff'][k]);
    } },
    peach: { w: 80, h: 100, ay: 90, draw(c) {
      c.fillStyle = '#6b4226'; c.beginPath(); c.moveTo(-4, 0); c.lineTo(-2, -30); c.lineTo(-10, -44); c.lineTo(-6, -46); c.lineTo(0, -36); c.lineTo(8, -48); c.lineTo(10, -45); c.lineTo(3, -30); c.lineTo(4, 0); c.fill();
      for (const [x, y, r] of [[-16, -50, 16], [14, -52, 16], [0, -64, 18], [-6, -46, 14], [8, -42, 12]]) blob(c, x, y, r, '#ff9ec4', '#ffe1ee');
      c.fillStyle = '#fff'; for (let k = 0; k < 12; k++) { c.globalAlpha = 0.7; c.beginPath(); c.arc(rnd(-24, 24), rnd(-74, -40), 1.4, 0, 7); c.fill(); } c.globalAlpha = 1;
    } },
    pine: { w: 70, h: 110, ay: 100, draw(c) {
      c.fillStyle = '#5a3a22'; c.fillRect(-3, -20, 6, 20);
      for (let k = 0; k < 4; k++) { const y = -18 - k * 18, w = 30 - k * 5; c.fillStyle = k % 2 ? '#2e7d4f' : '#3a9460'; c.beginPath(); c.moveTo(-w, y); c.lineTo(0, y - 30); c.lineTo(w, y); c.quadraticCurveTo(0, y + 6, -w, y); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.beginPath(); c.moveTo(0, -96); c.lineTo(-10, -70); c.lineTo(0, -74); c.fill();
    } },
    willow: { w: 90, h: 110, ay: 100, draw(c) {
      c.fillStyle = '#6b4a2a'; c.beginPath(); c.moveTo(-5, 0); c.quadraticCurveTo(-2, -30, -6, -56); c.lineTo(4, -56); c.quadraticCurveTo(2, -30, 5, 0); c.fill();
      blob(c, 0, -64, 26, '#7cc96a', '#c8f0a8');
      c.strokeStyle = '#6dbb5c'; c.lineWidth = 2;
      for (let k = -5; k <= 5; k++) { c.beginPath(); c.moveTo(k * 5, -56); c.quadraticCurveTo(k * 7 + 3, -30, k * 6, -14 - Math.abs(k) * 3); c.stroke(); }
    } },
    bamboo: { w: 60, h: 120, ay: 110, draw(c) {
      for (const [x, h] of [[-8, 90], [2, 104], [10, 80]]) {
        c.fillStyle = '#5fb760'; c.fillRect(x - 2, -h, 4, h); c.fillStyle = '#3e8a44'; for (let y = -h; y < 0; y += 14) c.fillRect(x - 2.5, y, 5, 1.5);
        c.fillStyle = '#7fd06a'; for (let y = -h; y < -30; y += 22) { c.beginPath(); c.ellipse(x + 8, y, 9, 2.5, -0.4, 0, 7); c.fill(); c.beginPath(); c.ellipse(x - 8, y + 8, 9, 2.5, 0.4, 0, 7); c.fill(); }
      }
    } },
    well: { w: 60, h: 70, ay: 56, draw(c) {
      c.fillStyle = '#9a9a9a'; c.beginPath(); c.ellipse(0, -6, 16, 8, 0, 0, 7); c.fill(); c.fillStyle = '#7a7a7a'; c.fillRect(-16, -14, 32, 8);
      c.fillStyle = '#b5b5b5'; c.beginPath(); c.ellipse(0, -14, 16, 8, 0, 0, 7); c.fill(); c.fillStyle = '#2a5c7a'; c.beginPath(); c.ellipse(0, -14, 11, 5, 0, 0, 7); c.fill();
      c.fillStyle = '#6b4226'; c.fillRect(-15, -40, 3, 26); c.fillRect(12, -40, 3, 26); roof(c, 0, -38, 40, 12, '#8a5a3a');
    } },
    haystack: { w: 50, h: 50, ay: 40, draw(c) { blob(c, 0, -14, 16, '#e7c35a', '#fff0a8'); c.strokeStyle = '#b8902a'; c.lineWidth = 1; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(rnd(-12, 12), rnd(-26, -6)); c.lineTo(rnd(-14, 14), rnd(-26, -4)); c.stroke(); } } },
    lantern: { w: 30, h: 60, ay: 54, draw(c) { c.fillStyle = '#6b4226'; c.fillRect(-1.5, -40, 3, 40); c.fillStyle = '#ff4a3a'; c.beginPath(); c.ellipse(0, -40, 7, 9, 0, 0, 7); c.fill(); c.fillStyle = '#ffd75e'; c.fillRect(-4, -50, 8, 2); c.fillRect(-4, -32, 8, 2); } },
    lanternpole: { w: 50, h: 100, ay: 94, draw(c) { c.fillStyle = '#5a3a22'; c.fillRect(-2, -80, 4, 80); c.fillRect(-16, -80, 32, 3);
      for (const x of [-12, 12]) { c.fillStyle = '#ff4a3a'; c.beginPath(); c.ellipse(x, -66, 6, 8, 0, 0, 7); c.fill(); c.fillStyle = '#ffd75e'; c.fillRect(x - 3, -75, 6, 2); } } },
    rock: { w: 50, h: 40, ay: 30, draw(c) { blob(c, -4, -8, 12, '#9aa3ad', '#dfe6ee'); blob(c, 8, -6, 8, '#8a939d', '#cfd6de'); } },
    bush: { w: 50, h: 40, ay: 30, draw(c) { blob(c, -8, -8, 10, '#4fae5a', '#a8e89a'); blob(c, 6, -10, 12, '#5abb63', '#b8f0a8'); c.fillStyle = '#ff7aa8'; c.beginPath(); c.arc(2, -16, 2, 0, 7); c.arc(-9, -12, 2, 0, 7); c.fill(); } },
    fence: { w: 60, h: 40, ay: 30, draw(c) { c.fillStyle = '#9a6a3a'; for (let k = 0; k < 5; k++) c.fillRect(-20 + k * 9, -18 + k * 4.5, 3, 16); c.fillRect(-20, -12, 40, 2); c.save(); c.translate(-20, -12); c.rotate(0.46); c.fillRect(0, 0, 44, 2.5); c.restore(); } },
    stonelamp: { w: 30, h: 50, ay: 44, draw(c) { isoBox(c, 0, 0, 14, 8, 4, '#d0ccc4', '#aaa59c', '#8f8a82'); c.fillStyle = '#bfb9b0'; c.fillRect(-3, -22, 6, 18);
      isoBox(c, 0, -22, 14, 8, 10, '#e6e1d8', '#bdb7ad', '#a19b91'); c.fillStyle = '#ffd75e'; c.fillRect(-2.5, -30, 5, 5); roof(c, 0, -32, 16, 8, '#8a8a8a'); } },
    incense: { w: 50, h: 60, ay: 46, draw(c) { c.fillStyle = '#b8862e'; c.beginPath(); c.ellipse(0, -10, 16, 8, 0, 0, 7); c.fill(); c.fillStyle = '#8a5f1a'; c.fillRect(-16, -18, 32, 8);
      c.fillStyle = '#e0b04a'; c.beginPath(); c.ellipse(0, -18, 16, 7, 0, 0, 7); c.fill(); c.fillStyle = '#c0392b'; for (const x of [-4, 0, 4]) c.fillRect(x - 0.6, -34, 1.2, 16); } },
    crane: { w: 50, h: 70, ay: 60, draw(c) { c.strokeStyle = '#333'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-2, 0); c.lineTo(0, -16); c.moveTo(3, 0); c.lineTo(1, -16); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, -22, 10, 7, -0.2, 0, 7); c.fill(); c.fillStyle = '#222'; c.beginPath(); c.ellipse(-8, -22, 5, 3, 0.3, 0, 7); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(6, -26); c.quadraticCurveTo(12, -40, 6, -46); c.stroke(); c.fillStyle = '#e33'; c.beginPath(); c.arc(6, -47, 2, 0, 7); c.fill();
      c.strokeStyle = '#e8a33a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(4, -46); c.lineTo(-4, -44); c.stroke(); } },
    banner: { w: 40, h: 90, ay: 84, draw(c) { c.fillStyle = '#5a3a22'; c.fillRect(-1.5, -76, 3, 76); c.fillStyle = '#2f8a7a'; c.beginPath(); c.moveTo(1, -74); c.lineTo(18, -72); c.lineTo(16, -40); c.lineTo(9, -46); c.lineTo(1, -40); c.fill();
      c.fillStyle = '#ffd75e'; c.font = 'bold 9px serif'; c.textAlign = 'center'; c.fillText('仙', 9, -56); } },
    crates: { w: 50, h: 50, ay: 40, draw(c) { isoBox(c, -6, 0, 22, 12, 14, '#d9a066', '#b07a44', '#8f5f30'); isoBox(c, 8, 4, 18, 10, 10, '#d9a066', '#b07a44', '#8f5f30'); isoBox(c, -4, -14, 16, 9, 10, '#e6b07a', '#b07a44', '#8f5f30'); } },
    portal: { w: 120, h: 140, ay: 120, draw(c) {
      isoBox(c, -34, 0, 16, 10, 80, '#7a6aa8', '#5a4a88', '#463a70'); isoBox(c, 34, 0, 16, 10, 80, '#7a6aa8', '#5a4a88', '#463a70');
      c.fillStyle = '#463a70'; c.beginPath(); c.moveTo(-50, -84); c.quadraticCurveTo(0, -110, 50, -84); c.lineTo(46, -76); c.quadraticCurveTo(0, -98, -46, -76); c.fill();
      const g = c.createRadialGradient(0, -42, 4, 0, -42, 36); g.addColorStop(0, '#fff'); g.addColorStop(0.3, '#e09cff'); g.addColorStop(1, 'rgba(120,60,200,0)');
      c.fillStyle = g; c.beginPath(); c.ellipse(0, -42, 26, 36, 0, 0, 7); c.fill();
    } },
    crystal: { w: 50, h: 70, ay: 60, draw(c) { for (const [x, h, w, col] of [[-6, 40, 8, '#b18cff'], [6, 30, 7, '#7fd3ff'], [0, 52, 9, '#d6a8ff']]) {
      c.fillStyle = col; c.beginPath(); c.moveTo(x - w, 0); c.lineTo(x - w * 0.8, -h * 0.7); c.lineTo(x, -h); c.lineTo(x + w * 0.8, -h * 0.7); c.lineTo(x + w, 0); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.moveTo(x - w * 0.6, -2); c.lineTo(x - w * 0.5, -h * 0.68); c.lineTo(x, -h); c.lineTo(x - w * 0.1, -2); c.fill(); } } },
    deadtree: { w: 70, h: 90, ay: 84, draw(c) { c.strokeStyle = '#3a2a3a'; c.lineCap = 'round'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -40); c.lineTo(-16, -62); c.moveTo(0, -40); c.lineTo(14, -58); c.lineTo(22, -60); c.moveTo(-8, -52); c.lineTo(-20, -48); c.stroke();
      c.lineWidth = 2; c.beginPath(); c.moveTo(14, -58); c.lineTo(12, -72); c.moveTo(-16, -62); c.lineTo(-14, -74); c.stroke(); } },
    bones: { w: 40, h: 30, ay: 22, draw(c) { c.fillStyle = '#eee'; c.beginPath(); c.arc(0, -8, 6, 0, 7); c.fill(); c.fillStyle = '#333'; c.beginPath(); c.arc(-2, -9, 1.5, 0, 7); c.arc(2, -9, 1.5, 0, 7); c.fill(); c.fillStyle = '#ddd'; c.fillRect(-14, -3, 12, 2.5); c.fillRect(4, -2, 12, 2.5); } },
    skullrock: { w: 60, h: 50, ay: 40, draw(c) { blob(c, 0, -14, 16, '#6a5a8a', '#a99acb'); c.fillStyle = '#2a1d3f'; c.beginPath(); c.ellipse(-6, -16, 4, 5, 0, 0, 7); c.ellipse(6, -16, 4, 5, 0, 0, 7); c.fill(); c.fillStyle = '#ff5ad0'; c.beginPath(); c.arc(-6, -16, 1.5, 0, 7); c.arc(6, -16, 1.5, 0, 7); c.fill(); } },
    mushroom: { w: 40, h: 40, ay: 32, draw(c) { for (const [x, s, col] of [[-6, 1, '#ff5ad0'], [7, 0.7, '#5affd0']]) { c.fillStyle = '#eee'; c.fillRect(x - 2 * s, -12 * s, 4 * s, 12 * s); c.fillStyle = col; c.beginPath(); c.ellipse(x, -12 * s, 10 * s, 7 * s, 0, Math.PI, 0); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 3 * s, -15 * s, 1.5, 0, 7); c.arc(x + 3 * s, -14 * s, 1.2, 0, 7); c.fill(); } } },
    torch: { w: 30, h: 60, ay: 54, draw(c) { c.fillStyle = '#4a3a5a'; c.fillRect(-2, -34, 4, 34); c.fillStyle = '#6a5a7a'; c.fillRect(-5, -38, 10, 5); } }
  };
  const propCache = {};
  function propSprite(type, scale) {
    const key = type + '@' + scale; if (propCache[key]) return propCache[key];
    const p = PROPS[type], c = mk(p.w * scale, p.h * scale), x = c.getContext('2d');
    x.scale(scale, scale); x.translate(p.w / 2, p.ay); p.draw(x);
    return (propCache[key] = { c, ax: p.w / 2, ay: p.ay, w: p.w, h: p.h });
  }

  /* ---------------- 岛屿预渲染 ---------------- */
  let islandCache = {}, curMap = 'village', island = null;
  function tileOf(m, i, j) { const ch = m.grid[j][i]; let t = TILE[ch]; if (m === MAPS.secret && ch === 'g') t = Object.assign({}, t, GRASS_SECRET); return t; }
  function buildIsland(key, scale) {
    const m = MAPS[key], N = 10, pad = 40;
    const minX = -N * TW / 2 - pad, maxX = N * TW / 2 + pad, minY = -40, maxY = N * TH + 170;
    const c = mk((maxX - minX) * scale, (maxY - minY) * scale), x = c.getContext('2d');
    x.scale(scale, scale); x.translate(-minX, -minY);
    const R0 = srand(key.length * 977 + 13);
    // 悬浮岛下方岩体
    x.save();
    const cx0 = 0, top = N * TH / 2;
    const g = x.createLinearGradient(0, top, 0, maxY);
    g.addColorStop(0, key === 'secret' ? '#3d3466' : '#8a6a4a'); g.addColorStop(1, key === 'secret' ? 'rgba(30,20,60,0)' : 'rgba(110,80,60,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(-N * TW / 2, top);
    for (let k = 0; k <= 20; k++) { const px = -N * TW / 2 + k * N * TW / 20; const dy = Math.sin(k / 20 * Math.PI) * 150 * (0.6 + R0() * 0.4); x.lineTo(px, top + (N * TH / 2) * (1 - Math.abs(k - 10) / 10) + dy); }
    x.lineTo(N * TW / 2, top); x.closePath(); x.fill();
    x.restore();
    // 瓦片
    for (let s = 0; s < 2 * N - 1; s++) for (let i = 0; i < N; i++) {
      const j = s - i; if (j < 0 || j >= N) continue;
      const t = tileOf(m, i, j), h = t.h, [px, py] = iso(i, j, h);
      const depth = (i === N - 1 || j === N - 1) ? 22 + h * HZ : 8 + (h + 0.4) * HZ;
      x.fillStyle = shade(t.side, -0.08); x.beginPath(); x.moveTo(px - TW / 2, py + TH / 2); x.lineTo(px, py + TH); x.lineTo(px, py + TH + depth); x.lineTo(px - TW / 2, py + TH / 2 + depth); x.closePath(); x.fill();
      x.fillStyle = shade(t.side, -0.25); x.beginPath(); x.moveTo(px + TW / 2, py + TH / 2); x.lineTo(px, py + TH); x.lineTo(px, py + TH + depth); x.lineTo(px + TW / 2, py + TH / 2 + depth); x.closePath(); x.fill();
      if (i === N - 1 || j === N - 1) { x.fillStyle = 'rgba(80,50,30,0.35)'; x.fillRect(px - 2, py + TH + 6, 4, depth - 6); }
      const var_ = (R0() - 0.5) * 0.08;
      const tg = x.createLinearGradient(px, py, px, py + TH); tg.addColorStop(0, shade(t.top, 0.12 + var_)); tg.addColorStop(1, shade(t.top, -0.04 + var_));
      x.fillStyle = tg; x.beginPath(); x.moveTo(px, py); x.lineTo(px + TW / 2, py + TH / 2); x.lineTo(px, py + TH); x.lineTo(px - TW / 2, py + TH / 2); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.10)'; x.lineWidth = 1; x.stroke();
      x.save(); x.beginPath(); x.moveTo(px, py); x.lineTo(px + TW / 2, py + TH / 2); x.lineTo(px, py + TH); x.lineTo(px - TW / 2, py + TH / 2); x.closePath(); x.clip();
      if (t.flowers || (t === TILE.g && R0() < 0.5)) for (let k = 0; k < 6; k++) { x.fillStyle = t.flowers ? ['#fff', '#ffd75e', '#ff8fbf'][k % 3] : 'rgba(40,120,40,0.35)'; const fx = px + (R0() - 0.5) * TW * 0.7, fy = py + TH / 2 + (R0() - 0.5) * TH * 0.6; if (t.flowers) { x.beginPath(); x.arc(fx, fy, 1.6, 0, 7); x.fill(); } else x.fillRect(fx, fy, 1.2, 3); }
      if (t.pebble) for (let k = 0; k < 4; k++) { x.fillStyle = 'rgba(150,120,80,0.45)'; x.beginPath(); x.ellipse(px + (R0() - 0.5) * TW * 0.6, py + TH / 2 + (R0() - 0.5) * TH * 0.5, 2, 1.2, 0, 0, 7); x.fill(); }
      if (t.brick) { x.strokeStyle = 'rgba(120,110,100,0.35)'; x.beginPath(); x.moveTo(px - TW / 4, py + TH / 4); x.lineTo(px + TW / 4, py + TH * 0.75); x.moveTo(px + TW / 4, py + TH / 4); x.lineTo(px - TW / 4, py + TH * 0.75); x.stroke(); }
      if (t.furrow) { x.strokeStyle = 'rgba(70,40,20,0.4)'; x.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { x.beginPath(); x.moveTo(px - TW / 2 + 10 + k * 8, py + TH / 2 - 8 + k * 4 + 6); x.lineTo(px + 4 + k * 8, py + TH / 2 + 10 + k * 4); x.stroke(); }
        x.fillStyle = '#7ccf5a'; for (let k = 0; k < 6; k++) { x.beginPath(); x.ellipse(px + (R0() - 0.5) * 30, py + TH / 2 + (R0() - 0.5) * 12, 2.5, 1.5, 0, 0, 7); x.fill(); } }
      if (t.crack) { x.strokeStyle = 'rgba(200,120,255,0.35)'; x.lineWidth = 1; x.beginPath(); x.moveTo(px - 10, py + TH / 2); x.lineTo(px, py + TH / 2 + 3); x.lineTo(px + 8, py + TH / 2 - 4); x.stroke(); }
      x.restore();
    }
    return { c, minX, minY, scale };
  }

  /* ---------------- Q版小人 ---------------- */
  function drawChibi(c, o, t) {
    const face = o.face || 1, walk = o.walking ? Math.sin(t * 12) : 0, bob = Math.sin(t * 3 + (o.seed || 0)) * 1.2 + (o.walking ? Math.abs(walk) * 1.5 : 0);
    c.save(); c.scale(face * (o.scale || 1), o.scale || 1);
    if (o.aura) { const g = c.createRadialGradient(0, -30, 4, 0, -30, 40); g.addColorStop(0, o.aura); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.globalAlpha = 0.55 + Math.sin(t * 4) * 0.15; c.beginPath(); c.arc(0, -30, 40, 0, 7); c.fill(); c.globalAlpha = 1; }
    c.translate(0, -bob);
    // 背后剑
    if (o.sword) { c.save(); c.translate(0, -22); c.rotate(-0.7); c.fillStyle = '#c9d6e3'; c.fillRect(-1.5, -26, 3, 26); c.fillStyle = '#7a4a2a'; c.fillRect(-4, 0, 8, 2.5); c.fillStyle = '#5a3018'; c.fillRect(-1.5, 2, 3, 7); c.restore(); }
    // 脚
    c.fillStyle = '#3a2a2a'; c.beginPath(); c.ellipse(-4 + walk * 2, -2 + bob, 3.2, 2.2, 0, 0, 7); c.ellipse(4 - walk * 2, -2 + bob, 3.2, 2.2, 0, 0, 7); c.fill();
    // 身体
    const rg = c.createLinearGradient(0, -24, 0, -2); rg.addColorStop(0, shade(o.robe, 0.15)); rg.addColorStop(1, shade(o.robe, -0.15));
    c.fillStyle = rg; c.beginPath(); c.moveTo(-7, -23); c.lineTo(7, -23); c.quadraticCurveTo(12, -10, 11, -3); c.quadraticCurveTo(0, 0, -11, -3); c.quadraticCurveTo(-12, -10, -7, -23); c.fill();
    c.fillStyle = o.robe2 || '#fff'; c.beginPath(); c.moveTo(-5, -23); c.lineTo(0, -15); c.lineTo(5, -23); c.lineTo(3, -23); c.lineTo(0, -18); c.lineTo(-3, -23); c.fill();
    c.fillStyle = o.belt || '#ffd75e'; c.fillRect(-8.5, -14, 17, 2.6);
    // 袖子
    c.fillStyle = shade(o.robe, 0.05); c.beginPath(); c.ellipse(-9, -15 - walk, 3.5, 6, 0.4, 0, 7); c.ellipse(9, -15 + walk, 3.5, 6, -0.4, 0, 7); c.fill();
    c.fillStyle = o.skin || '#ffe2cc'; c.beginPath(); c.arc(-10, -10 - walk, 2, 0, 7); c.arc(10, -10 + walk, 2, 0, 7); c.fill();
    if (o.hold === 'fan') { c.fillStyle = '#fff6e0'; c.beginPath(); c.moveTo(10, -10); c.arc(10, -10, 9, -1.9, -0.6); c.fill(); c.strokeStyle = '#a77'; c.stroke(); }
    if (o.hold === 'gourd') { c.fillStyle = '#e09a3a'; c.beginPath(); c.arc(11, -8, 3.2, 0, 7); c.arc(11, -13, 2.3, 0, 7); c.fill(); }
    if (o.hold === 'book') { c.fillStyle = '#8a2a2a'; c.fillRect(7, -14, 8, 10); c.fillStyle = '#fff'; c.font = 'bold 6px serif'; c.textAlign = 'center'; c.fillText('债', 11, -7); }
    // 头
    const hy = -36;
    c.fillStyle = o.hair; c.beginPath(); c.arc(0, hy, 15, 0, 7); c.fill();
    if (o.longhair) { c.beginPath(); c.moveTo(-14, hy); c.quadraticCurveTo(-16, hy + 20, -10, hy + 24); c.lineTo(10, hy + 24); c.quadraticCurveTo(16, hy + 20, 14, hy); c.fill(); }
    const sg = c.createRadialGradient(-3, hy + 1, 2, 0, hy + 2, 13); sg.addColorStop(0, '#fff3e8'); sg.addColorStop(1, o.skin || '#ffd9c0');
    c.fillStyle = sg; c.beginPath(); c.ellipse(0, hy + 3, 12, 11.5, 0, 0, 7); c.fill();
    // 刘海
    c.fillStyle = o.hair; c.beginPath(); c.moveTo(-14, hy + 2); c.quadraticCurveTo(-13, hy - 14, 0, hy - 14); c.quadraticCurveTo(13, hy - 14, 14, hy + 2);
    c.lineTo(10, hy - 4); c.lineTo(6, hy - 1); c.lineTo(3, hy - 6); c.lineTo(-2, hy - 1); c.lineTo(-6, hy - 6); c.lineTo(-10, hy - 1); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.ellipse(-4, hy - 10, 5, 2, -0.3, 0, 7); c.fill();
    // 发饰
    if (o.bun !== false) { c.fillStyle = o.hair; c.beginPath(); c.arc(0, hy - 16, 6, 0, 7); c.fill(); c.fillStyle = o.ribbon || '#ff5a6a'; c.fillRect(-6, hy - 13, 12, 2.5);
      c.strokeStyle = '#ffd75e'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-9, hy - 19); c.lineTo(9, hy - 14); c.stroke(); }
    if (o.hat === 'straw') { c.fillStyle = '#e2c27a'; c.beginPath(); c.ellipse(0, hy - 10, 20, 6, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(-10, hy - 11); c.lineTo(0, hy - 24); c.lineTo(10, hy - 11); c.fill(); }
    if (o.hat === 'tall') { c.fillStyle = '#222'; c.fillRect(-8, hy - 34, 16, 22); c.fillRect(-12, hy - 13, 24, 3); c.fillStyle = '#fff'; c.font = 'bold 5px serif'; c.textAlign = 'center'; c.fillText('还', 0, hy - 24); c.fillText('钱', 0, hy - 17); }
    if (o.ears) { c.fillStyle = o.hair; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 6, hy - 11); c.lineTo(s * 13, hy - 24); c.lineTo(s * 14, hy - 8); c.fill(); } }
    // 脸
    const blink = (Math.sin(t * 1.3 + (o.seed || 0) * 5) > 0.985);
    c.fillStyle = '#2a1a1a';
    for (const s of [-1, 1]) { if (blink) c.fillRect(s * 4.5 - 2, hy + 3, 4, 1.2); else { c.beginPath(); c.ellipse(s * 4.5, hy + 3, 2.1, 2.9, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(s * 4.5 + 0.7, hy + 2, 0.9, 0, 7); c.fill(); c.fillStyle = '#2a1a1a'; } }
    c.fillStyle = 'rgba(255,120,140,0.45)'; c.beginPath(); c.ellipse(-8, hy + 7, 2.6, 1.6, 0, 0, 7); c.ellipse(8, hy + 7, 2.6, 1.6, 0, 0, 7); c.fill();
    c.strokeStyle = '#8a3a3a'; c.lineWidth = 1; c.beginPath(); if (o.mood === 'sad') c.arc(0, hy + 10, 2, 3.6, 5.8); else c.arc(0, hy + 7, 2, 0.3, 2.8); c.stroke();
    if (o.beard) { c.fillStyle = '#eee'; c.beginPath(); c.moveTo(-5, hy + 9); c.lineTo(0, hy + 22); c.lineTo(5, hy + 9); c.fill(); }
    c.restore();
  }
  // 怪物
  function drawMonster(c, kind, t, o = {}) {
    const b = Math.sin(t * 4 + (o.seed || 0)) * 2; c.save(); c.scale((o.face || 1) * (o.scale || 1), o.scale || 1);
    if (kind === 'slime') { // 讨债妖
      const sq = 1 + Math.sin(t * 5) * 0.06; c.save(); c.scale(1 / sq, sq);
      blob(c, 0, -14, 16, '#8a6cff', '#d8ccff'); c.restore();
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-5, -17, 4, 5, 0, 0, 7); c.ellipse(6, -17, 4, 5, 0, 0, 7); c.fill();
      c.fillStyle = '#222'; c.beginPath(); c.arc(-4, -16, 2, 0, 7); c.arc(7, -16, 2, 0, 7); c.fill();
      c.strokeStyle = '#222'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-9, -23); c.lineTo(-2, -21); c.moveTo(10, -23); c.lineTo(3, -21); c.stroke();
      c.fillStyle = '#8a2a2a'; c.fillRect(10, -16, 10, 12); c.fillStyle = '#fff'; c.font = 'bold 7px serif'; c.textAlign = 'center'; c.fillText('债', 15, -7);
    } else if (kind === 'paper') { // 纸符小鬼
      c.translate(0, -8 + b); c.fillStyle = '#ffe27a'; c.beginPath(); c.moveTo(-11, -30); c.lineTo(11, -30); c.lineTo(12, 0);
      for (let k = 0; k < 5; k++) c.lineTo(12 - k * 6 - 3, k % 2 ? 0 : 5); c.lineTo(-12, 0); c.closePath(); c.fill();
      c.strokeStyle = '#d0302a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, -26); c.lineTo(0, -4); c.moveTo(-6, -20); c.lineTo(6, -18); c.moveTo(-5, -12); c.quadraticCurveTo(0, -8, 6, -12); c.stroke();
      c.fillStyle = '#222'; c.beginPath(); c.arc(-5, -22, 2.2, 0, 7); c.arc(5, -22, 2.2, 0, 7); c.fill();
    } else if (kind === 'fox') {
      for (let k = -1; k <= 1; k++) { c.save(); c.translate(-8, -10); c.rotate(-0.6 + k * 0.45 + Math.sin(t * 3 + k) * 0.1); c.fillStyle = '#ff9a3c'; c.beginPath(); c.ellipse(-12, 0, 13, 5, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-22, 0, 4, 3.5, 0, 0, 7); c.fill(); c.restore(); }
      drawChibi(c, { hair: '#ff9a3c', robe: '#ffffff', robe2: '#ff6a8a', belt: '#ff6a8a', ears: true, bun: false, seed: 3, longhair: true }, t);
    } else if (kind === 'rock') {
      blob(c, 0, -16 + b * 0.3, 18, '#8d8577', '#d6cfc0'); blob(c, -12, -6, 7, '#7a7264'); blob(c, 13, -7, 7, '#7a7264');
      c.fillStyle = '#ffb030'; c.beginPath(); c.arc(-6, -19, 2.6, 0, 7); c.arc(6, -19, 2.6, 0, 7); c.fill();
      c.fillStyle = '#5fae5a'; c.beginPath(); c.ellipse(4, -34, 6, 3, 0.3, 0, 7); c.fill();
    } else if (kind === 'collector') {
      drawChibi(c, { hair: '#222', robe: '#3a3a4a', robe2: '#aaa', belt: '#c33', hat: 'tall', bun: false, hold: 'book', seed: 7, mood: 'sad' }, t);
    } else if (kind === 'boss') { // 讨尾款的天道
      c.translate(0, -40 + b);
      for (const [x, y, r] of [[-30, 10, 22], [28, 10, 22], [0, 0, 30], [-16, -14, 20], [16, -16, 20]]) blob(c, x, y, r, '#e8e4f8', '#ffffff');
      c.fillStyle = '#ffd75e'; c.beginPath(); c.ellipse(0, 2, 16, 10, 0, 0, 7); c.fill(); c.fillStyle = '#7a2a12'; c.beginPath(); c.arc(0, 2, 6, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(2, 0, 2, 0, 7); c.fill();
      c.fillStyle = '#8a5a2a'; c.fillRect(-26, 24, 52, 14); c.fillStyle = '#ffd75e'; for (let k = 0; k < 6; k++) for (let r = 0; r < 2; r++) { c.beginPath(); c.arc(-21 + k * 8.4, 28 + r * 6, 2, 0, 7); c.fill(); }
      c.fillStyle = '#c33'; c.font = 'bold 8px serif'; c.textAlign = 'center'; c.fillText('尾款', 0, -30);
    } else if (kind === 'rival') {
      drawChibi(c, { hair: '#5a2a7a', robe: '#e05a5a', robe2: '#ffd', belt: '#333', sword: true, seed: 9, ribbon: '#333' }, t);
    } else if (kind === 'beast') {
      blob(c, 0, -16, 17, '#4fae9a', '#a8f0e0'); c.fillStyle = '#2f7a6a'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 6, -30); c.lineTo(s * 14, -40); c.lineTo(s * 13, -26); c.fill(); }
      c.fillStyle = '#fff'; c.beginPath(); c.arc(-6, -18, 4, 0, 7); c.arc(6, -18, 4, 0, 7); c.fill(); c.fillStyle = '#c22'; c.beginPath(); c.arc(-5, -18, 2, 0, 7); c.arc(7, -18, 2, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-5, -9); c.lineTo(-3, -5); c.lineTo(-1, -9); c.moveTo(1, -9); c.lineTo(3, -5); c.lineTo(5, -9); c.fill();
    }
    c.restore();
  }

  /* ---------------- 实体/特效 ---------------- */
  const ents = [], parts = [], texts = [], bolts = [], projs = [];
  let shake = 0, flash = 0, flashCol = '#fff', darken = 0, darkenTarget = 0, t0 = performance.now(), T = 0, last = 0;
  let walkable = [];
  function setMap(key) {
    curMap = key; island = null; ents.length = 0; parts.length = 0; projs.length = 0; bolts.length = 0; texts.length = 0;
    const m = MAPS[key]; walkable = [];
    const occ = new Set(m.props.map(p => p[1] + ',' + p[2]));
    for (let j = 0; j < 10; j++) for (let i = 0; i < 10; i++) { const t = tileOf(m, i, j); if (!t.water && !occ.has(i + ',' + j)) walkable.push([i, j]); }
    for (const p of m.props) ents.push({ kind: 'prop', type: p[0], i: p[1] + 0.5, j: p[2] + 0.5 });
  }
  function randWalk() { const w = walkable[(Math.random() * walkable.length) | 0]; return [w[0] + 0.5, w[1] + 0.5]; }
  function addActor(o) { const [i, j] = o.i != null ? [o.i, o.j] : randWalk(); const e = Object.assign({ kind: 'actor', i, j, ti: i, tj: j, wait: rnd(0.5, 3), seed: Math.random() * 10, face: 1 }, o, { i, j }); ents.push(e); return e; }
  function clearActors() { for (let k = ents.length - 1; k >= 0; k--) if (ents[k].kind === 'actor') ents.splice(k, 1); }
  function heightAt(i, j) { const m = MAPS[curMap]; const ii = Math.max(0, Math.min(9, i | 0)), jj = Math.max(0, Math.min(9, j | 0)); return Math.max(0, tileOf(m, ii, jj).h); }
  function worldPos(i, j, h) { const [x, y] = iso(i, j, h != null ? h : heightAt(i, j)); return [x, y + TH / 2 * 0]; }
  // iso(i,j) gives top corner of tile (i,j) in my tile space → centre of cell at (i+0.5, j+0.5) is iso(i+0.5,j+0.5)-> use directly
  function burst(x, y, n, col, sp = 60, life = 0.8, size = 2.5, g = 60) { for (let k = 0; k < n; k++) { const a = Math.random() * 6.283, v = rnd(sp * 0.3, sp); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.4, life, max: life, size: rnd(size * 0.5, size), col, g, type: 'dot' }); } }
  function ring(x, y, col, r = 50, life = 0.6) { parts.push({ x, y, vx: 0, vy: 0, life, max: life, size: r, col, type: 'ring', g: 0 }); }
  function floatText(x, y, s, col = '#fff', size = 16) { texts.push({ x, y, s, col, size, life: 1.1, max: 1.1 }); }
  function bolt(x, y) { const pts = []; let cx = x + rnd(-40, 40), cy = y - 420; pts.push([cx, cy]); while (cy < y) { cy += rnd(18, 40); cx += rnd(-22, 22); if (cy > y) { cy = y; cx = x; } pts.push([cx, cy]); } bolts.push({ pts, life: 0.35, max: 0.35 }); shake = Math.max(shake, 12); flash = 0.7; flashCol = '#e8e4ff'; }
  function proj(from, to, kind, dur, onHit) { projs.push({ x0: from[0], y0: from[1], x1: to[0], y1: to[1], kind, t: 0, dur, onHit }); }

  /* ---------------- 主循环 ---------------- */
  let skyCache = null, mountCache = null, clouds = [];
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const sceneH = H - layout.top - layout.bottom;
    S = Math.min(W / 600, Math.max(sceneH, 200) / 330);
    OX = W / 2; OY = layout.top + Math.max(sceneH, 200) / 2 - 150 * S;
    island = null; skyCache = null; mountCache = null; for (const k in propCache) delete propCache[k];
  }
  function setLayout(top, bottom) { layout.top = top; layout.bottom = bottom; resize(); }
  function drawSky() {
    const m = MAPS[curMap];
    if (!skyCache || skyCache.key !== curMap) {
      const c = mk(W * dpr, H * dpr), x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, H * dpr); g.addColorStop(0, m.sky[0]); g.addColorStop(0.55, m.sky[1]); g.addColorStop(1, m.sky[2]);
      x.fillStyle = g; x.fillRect(0, 0, W * dpr, H * dpr);
      if (curMap === 'secret') { x.fillStyle = '#fff'; for (let k = 0; k < 80; k++) { x.globalAlpha = Math.random() * 0.8; x.fillRect(Math.random() * W * dpr, Math.random() * H * 0.6 * dpr, dpr * 1.2, dpr * 1.2); } x.globalAlpha = 1;
        const mg = x.createRadialGradient(W * 0.78 * dpr, H * 0.14 * dpr, 2, W * 0.78 * dpr, H * 0.14 * dpr, 60 * dpr); mg.addColorStop(0, '#fff6e0'); mg.addColorStop(0.35, '#ffd0f0'); mg.addColorStop(1, 'rgba(255,200,255,0)'); x.fillStyle = mg; x.fillRect(0, 0, W * dpr, H * dpr); }
      else { const sg = x.createRadialGradient(W * 0.2 * dpr, H * 0.12 * dpr, 2, W * 0.2 * dpr, H * 0.12 * dpr, 90 * dpr); sg.addColorStop(0, 'rgba(255,255,240,0.95)'); sg.addColorStop(0.25, 'rgba(255,240,200,0.5)'); sg.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = sg; x.fillRect(0, 0, W * dpr, H * dpr); }
      // 远山（水墨层）
      const R0 = srand(curMap.length * 31 + 7);
      for (let L = 0; L < 3; L++) {
        const base = H * (0.30 + L * 0.12) * dpr, col = L < 2 ? m.mount[L] : shade(m.mount[1], -0.15);
        const mg = x.createLinearGradient(0, base - 120 * dpr, 0, H * dpr); mg.addColorStop(0, col); mg.addColorStop(0.6, shade(col, 0.35)); mg.addColorStop(1, 'rgba(255,255,255,0.0)');
        x.globalAlpha = 0.5 + L * 0.15; x.fillStyle = mg; x.beginPath(); x.moveTo(0, H * dpr);
        let px = 0; while (px <= W * dpr + 40) { const pk = base - (R0() * 90 + 30) * dpr * (1 - L * 0.25); x.quadraticCurveTo(px + 20 * dpr, pk, px + 50 * dpr + R0() * 40 * dpr, base - R0() * 20 * dpr); px += 60 * dpr + R0() * 40 * dpr; }
        x.lineTo(W * dpr, H * dpr); x.closePath(); x.fill(); x.globalAlpha = 1;
      }
      skyCache = { c, key: curMap };
      clouds = []; for (let k = 0; k < 7; k++) clouds.push(k % 3 === 0 ? { x: Math.random() * W, y: H - layout.bottom - rnd(20, 70), s: rnd(1.0, 1.6), v: rnd(4, 10) } : { x: Math.random() * W, y: layout.top + (H - layout.top - layout.bottom) * rnd(-0.1, 0.5), s: rnd(0.6, 1.4), v: rnd(4, 12) });
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(skyCache.c, 0, 0);
  }
  let cloudSprite = null;
  function drawClouds(dt, front) {
    if (!cloudSprite) { const c = mk(160 * dpr, 70 * dpr), x = c.getContext('2d'); x.scale(dpr, dpr); for (const [cx, cy, r] of [[40, 45, 22], [70, 32, 28], [104, 40, 24], [128, 50, 16], [80, 52, 22]]) { const g = x.createRadialGradient(cx - 6, cy - 8, 2, cx, cy, r); g.addColorStop(0, '#ffffff'); g.addColorStop(1, 'rgba(255,255,255,0.75)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); } cloudSprite = c; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let k = 0; k < clouds.length; k++) { const cl = clouds[k]; if ((k % 3 === 0) !== front) continue; cl.x += cl.v * dt; if (cl.x > W + 100) cl.x = -180 * cl.s; ctx.globalAlpha = front ? 0.5 : (curMap === 'secret' ? 0.25 : 0.85); ctx.drawImage(cloudSprite, cl.x, cl.y, 160 * cl.s, 70 * cl.s); }
    ctx.globalAlpha = 1;
  }
  let ambientT = 0;
  function ambient(dt) {
    ambientT += dt; const m = MAPS[curMap];
    if (ambientT > 0.18) { ambientT = 0;
      const x = rnd(-360, 360), y = rnd(-80, 300);
      if (m.particle === 'petal') parts.push({ x, y: y - 120, vx: rnd(8, 22), vy: rnd(10, 20), life: 5, max: 5, size: rnd(2, 3.5), col: '#ffb3d0', type: 'petal', g: 0, rot: Math.random() * 6 });
      else if (m.particle === 'mote') parts.push({ x, y, vx: rnd(-4, 4), vy: rnd(-14, -6), life: 4, max: 4, size: rnd(1.5, 2.8), col: '#fff6b0', type: 'glow', g: 0 });
      else if (m.particle === 'lantern') { if (Math.random() < 0.3) parts.push({ x, y: y + 40, vx: rnd(-3, 3), vy: rnd(-14, -8), life: 8, max: 8, size: rnd(3, 4.5), col: '#ffb040', type: 'lantern', g: 0 }); }
      else parts.push({ x, y, vx: rnd(-6, 6), vy: rnd(-16, -6), life: 3.5, max: 3.5, size: rnd(1.5, 3), col: Math.random() < 0.5 ? '#e09cff' : '#7fd3ff', type: 'glow', g: 0 });
    }
  }
  let hooks = { update: null };
  function frame(now) {
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; T += dt;
    try { render(dt); } catch (e) { console.error(e); }
    requestAnimationFrame(frame);
  }
  function render(dt) {
    if (hooks.update) hooks.update(dt);
    drawSky(); drawClouds(dt, false);
    const k = S * dpr;
    if (!island) island = islandCache[curMap + '@' + k] || (islandCache[curMap + '@' + k] = buildIsland(curMap, k));
    let sx = 0, sy = 0; if (shake > 0) { sx = rnd(-shake, shake); sy = rnd(-shake, shake); shake *= Math.pow(0.02, dt); if (shake < 0.3) shake = 0; }
    const bobY = Math.sin(T * 0.8) * 3;
    const ox = OX + sx, oy = OY + sy + bobY * S;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(island.c, ox * dpr + island.minX * k, oy * dpr + island.minY * k);
    ctx.setTransform(k, 0, 0, k, ox * dpr, oy * dpr);
    // 水面波光
    const m = MAPS[curMap];
    ctx.strokeStyle = m === MAPS.secret ? 'rgba(255,200,255,0.5)' : 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.2;
    for (let j = 0; j < 10; j++) for (let i = 0; i < 10; i++) { const t = tileOf(m, i, j); if (!t.water) continue; const [px, py] = iso(i, j, t.h); const ph = Math.sin(T * 2 + i * 1.3 + j * 0.7);
      ctx.globalAlpha = 0.3 + ph * 0.3; ctx.beginPath(); ctx.moveTo(px - 12 + ph * 4, py + TH / 2 + 2); ctx.lineTo(px - 2 + ph * 4, py + TH / 2 + 2); ctx.moveTo(px + 4 - ph * 3, py + TH / 2 + 8); ctx.lineTo(px + 14 - ph * 3, py + TH / 2 + 8); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // 实体更新 + 深度排序
    for (const e of ents) if (e.kind === 'actor') updActor(e, dt);
    ents.sort((a, b) => (a.i + a.j) - (b.i + b.j));
    // 阴影
    for (const e of ents) { if (e.kind !== 'actor' || e.hidden) continue; const [x, y] = iso(e.i, e.j, heightAt(e.i, e.j)); ctx.fillStyle = 'rgba(30,20,40,0.28)'; ctx.beginPath(); ctx.ellipse(x, y, 13 * (e.scale || 1) * (e.shadow || 1), 5.5 * (e.scale || 1) * (e.shadow || 1), 0, 0, 7); ctx.fill(); }
    for (const e of ents) {
      if (e.hidden) continue;
      if (e.kind === 'prop') { const sp = propSprite(e.type, k); const [x, y] = iso(e.i, e.j, heightAt(e.i, e.j)); ctx.drawImage(sp.c, x - sp.ax, y - sp.ay, sp.w, sp.h);
        if (e.type === 'portal' || e.type === 'torch' || e.type === 'lantern' || e.type === 'stonelamp') glowAt(x, y - (e.type === 'portal' ? 42 : e.type === 'torch' ? 42 : e.type === 'stonelamp' ? 27 : 40), e.type === 'portal' ? 40 : 14, e.type === 'portal' ? '#d080ff' : '#ffb040', e.type === 'torch'); }
      else { const [x, y] = iso(e.i, e.j, heightAt(e.i, e.j)); ctx.save(); ctx.translate(x + (e.ox || 0), y + (e.oy || 0));
        if (e.flashT > 0) { e.flashT -= dt; ctx.filter = 'brightness(2.2)'; }
        if (e.alpha != null) ctx.globalAlpha = e.alpha;
        if (e.monster) drawMonster(ctx, e.monster, T, e); else drawChibi(ctx, e, T);
        ctx.filter = 'none'; ctx.globalAlpha = 1;
        if (e.label) { ctx.font = 'bold 9px "Noto Serif CJK SC",serif'; ctx.textAlign = 'center'; const w = ctx.measureText(e.label).width + 8; ctx.fillStyle = 'rgba(30,20,10,0.55)'; roundRect(ctx, -w / 2, -70 * (e.scale || 1) - 11, w, 13, 6); ctx.fill(); ctx.fillStyle = e.labelCol || '#ffe9a8'; ctx.fillText(e.label, 0, -70 * (e.scale || 1) - 1.5); }
        if (e.hpMax) { const w = 40, pct = Math.max(0, e.hpShow / e.hpMax); ctx.fillStyle = 'rgba(0,0,0,0.5)'; roundRect(ctx, -w / 2, -62 * (e.scale || 1), w, 5, 2.5); ctx.fill(); ctx.fillStyle = e.hpCol || '#ff5a5a'; roundRect(ctx, -w / 2, -62 * (e.scale || 1), w * pct, 5, 2.5); ctx.fill(); if (e.hpShow > e.hp) e.hpShow = Math.max(e.hp, e.hpShow - e.hpMax * dt * 1.5); }
        ctx.restore(); }
    }
    // 投射物
    for (let q = projs.length - 1; q >= 0; q--) { const p = projs[q]; p.t += dt / p.dur; const tt = Math.min(1, p.t); const x = lerp(p.x0, p.x1, tt), y = lerp(p.y0, p.y1, tt) - Math.sin(tt * Math.PI) * (p.kind === 'sword' ? 30 : 15);
      drawProj(p, x, y); if (Math.random() < 0.8) parts.push({ x, y, vx: rnd(-10, 10), vy: rnd(-10, 10), life: 0.4, max: 0.4, size: 2.2, col: p.kind === 'sword' ? '#9fe8ff' : p.kind === 'fire' ? '#ff9a3c' : '#c07aff', type: 'glow', g: 0 });
      if (p.t >= 1) { projs.splice(q, 1); p.onHit && p.onHit(); } }
    // 粒子
    ambient(dt);
    ctx.globalCompositeOperation = 'source-over';
    for (let q = parts.length - 1; q >= 0; q--) { const p = parts[q]; p.life -= dt; if (p.life <= 0) { parts.splice(q, 1); continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; const a = Math.min(1, p.life / p.max * 1.5);
      if (p.type === 'ring') { const r = p.size * (1 - p.life / p.max); ctx.strokeStyle = p.col; ctx.globalAlpha = a; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * 0.5, 0, 0, 7); ctx.stroke(); }
      else if (p.type === 'petal') { p.rot += dt * 3; ctx.globalAlpha = a * 0.9; ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(p.x + Math.sin(T + p.rot) * 6, p.y, p.size, p.size * 0.55, p.rot, 0, 7); ctx.fill(); }
      else if (p.type === 'lantern') { ctx.globalAlpha = a; glowAt(p.x, p.y, 10, '#ffb040'); ctx.fillStyle = '#ff7a3a'; ctx.fillRect(p.x - p.size / 2, p.y - p.size * 0.7, p.size, p.size * 1.4); }
      else if (p.type === 'glow') { ctx.globalAlpha = a; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.6 + Math.sin(T * 6 + q) * 0.25), 0, 7); ctx.fill(); }
      else { ctx.globalAlpha = a; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill(); } }
    ctx.globalAlpha = 1;
    // 天劫暗化
    darken += (darkenTarget - darken) * Math.min(1, dt * 3);
    if (darken > 0.01) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(20,10,40,' + (darken * 0.6) + ')'; ctx.fillRect(0, 0, W * dpr, H * dpr); ctx.setTransform(k, 0, 0, k, ox * dpr, oy * dpr);
      if (darken > 0.3) { ctx.globalAlpha = darken * 0.9; for (let q = 0; q < 6; q++) { const cx = -300 + q * 120 + Math.sin(T * 0.5 + q) * 20; for (const [dx, dy, r] of [[0, 0, 50], [40, 10, 40], [-40, 12, 38]]) { ctx.fillStyle = '#2a2240'; ctx.beginPath(); ctx.arc(cx + dx, -110 + dy, r, 0, 7); ctx.fill(); } } ctx.globalAlpha = 1; } }
    // 雷电
    ctx.globalCompositeOperation = 'lighter';
    for (let q = bolts.length - 1; q >= 0; q--) { const b = bolts[q]; b.life -= dt; if (b.life <= 0) { bolts.splice(q, 1); continue; } const a = b.life / b.max;
      for (const [lw, col] of [[10, 'rgba(160,140,255,' + a * 0.4 + ')'], [4, 'rgba(220,210,255,' + a + ')'], [1.5, 'rgba(255,255,255,' + a + ')']]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); b.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); } }
    ctx.globalCompositeOperation = 'source-over';
    // 飘字
    for (let q = texts.length - 1; q >= 0; q--) { const f = texts[q]; f.life -= dt; if (f.life <= 0) { texts.splice(q, 1); continue; } const p = 1 - f.life / f.max; const y = f.y - p * 40, sc = p < 0.15 ? 0.6 + p / 0.15 * 0.6 : 1.2 - Math.min(0.2, (p - 0.15));
      ctx.globalAlpha = Math.min(1, f.life / f.max * 2.5); ctx.font = '900 ' + (f.size * sc) + 'px "Noto Serif CJK SC",serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(40,10,10,0.85)'; ctx.strokeText(f.s, f.x, y); ctx.fillStyle = f.col; ctx.fillText(f.s, f.x, y); }
    ctx.globalAlpha = 1;
    drawClouds(0, true);
    if (flash > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = Math.min(1, flash); ctx.fillStyle = flashCol; ctx.fillRect(0, 0, W * dpr, H * dpr); ctx.globalAlpha = 1; flash -= dt * 3; }
  }
  function glowAt(x, y, r, col, flicker) { const g = ctx.createRadialGradient(x, y, 0, x, y, r * (flicker ? 0.9 + Math.random() * 0.2 : 1)); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.globalAlpha *= 0.8; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; if (flicker) { ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.ellipse(x, y + 2, 3, 5 + Math.random() * 2, 0, 0, 7); ctx.fill(); } }
  function drawProj(p, x, y) {
    ctx.save(); ctx.translate(x, y); const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0); ctx.rotate(ang);
    if (p.kind === 'sword') { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(120,220,255,0.5)'; ctx.beginPath(); ctx.ellipse(-10, 0, 22, 5, 0, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#e8f6ff'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-6, -2.5); ctx.lineTo(-6, 2.5); ctx.fill(); ctx.fillStyle = '#ffd75e'; ctx.fillRect(-8, -4, 2.5, 8); ctx.fillStyle = '#7a4a2a'; ctx.fillRect(-14, -1.2, 6, 2.4); }
    else if (p.kind === 'fire') { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 12); g.addColorStop(0, '#fff6c0'); g.addColorStop(0.4, '#ff9a3c'); g.addColorStop(1, 'rgba(255,60,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.fill(); }
    else if (p.kind === 'talisman') { ctx.rotate(T * 10); ctx.fillStyle = '#ffe27a'; ctx.fillRect(-5, -8, 10, 16); ctx.strokeStyle = '#d0302a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(0, 6); ctx.moveTo(-3, -2); ctx.lineTo(3, 0); ctx.stroke(); }
    else { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 10); g.addColorStop(0, '#fff'); g.addColorStop(0.4, '#c07aff'); g.addColorStop(1, 'rgba(120,0,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 10, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function updActor(e, dt) {
    if (e.fixed) { e.walking = false; return; }
    const di = e.ti - e.i, dj = e.tj - e.j, d = Math.hypot(di, dj);
    if (d < 0.05) { e.walking = false; e.wait -= dt; if (e.wait <= 0) { [e.ti, e.tj] = randWalk(); e.wait = rnd(1.5, 4.5); } }
    else { e.walking = true; const sp = (e.speed || 1.1) * dt; e.i += di / d * Math.min(sp, d); e.j += dj / d * Math.min(sp, d); const sx = (di - dj); if (Math.abs(sx) > 0.01) e.face = sx > 0 ? 1 : -1; }
  }
  function screenOf(e, dy = -30) { const [x, y] = iso(e.i, e.j, heightAt(e.i, e.j)); return [x, y + dy]; }
  function init(canvas) { cv = canvas; ctx = cv.getContext('2d'); window.addEventListener('resize', resize); resize(); setMap('village'); requestAnimationFrame(frame); }
  // 小画布肖像（事件插图）
  function portrait(canvas, spec) {
    const c = canvas.getContext('2d'), d = Math.min(window.devicePixelRatio || 1, 2), w = canvas.clientWidth || 90, h = canvas.clientHeight || 90;
    canvas.width = w * d; canvas.height = h * d; c.scale(d, d);
    const g = c.createRadialGradient(w / 2, h * 0.45, 4, w / 2, h / 2, w * 0.7); g.addColorStop(0, spec.bg || '#fff6dc'); g.addColorStop(1, shade(spec.bg || '#fff6dc', -0.25)); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.translate(w / 2, h * 0.92); const sc = h / 70; c.scale(sc, sc);
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(0, 0, 16, 5, 0, 0, 7); c.fill();
    if (spec.monster) drawMonster(c, spec.monster, 0.5, { scale: spec.monster === 'boss' ? 0.55 : 1 }); else drawChibi(c, spec, 0.3);
  }
  return { init, setMap, setLayout, addActor, clearActors, burst, ring, floatText, bolt, proj, screenOf, portrait, MAPS, hooks,
    get T() { return T; }, set shake(v) { shake = v; }, set flash(v) { flash = v; }, set flashCol(v) { flashCol = v; }, set darken(v) { darkenTarget = v; }, ents, drawChibi, drawMonster, iso };
})();

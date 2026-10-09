'use strict';
const Audio2 = {
  on: true, vol: 0.45, el: null, cur: null,
  bgm(name) {
    if (this.cur === name) return; this.cur = name;
    const old = this.el; if (old) { let v = old.volume; const t = setInterval(() => { v -= 0.05; if (v <= 0) { clearInterval(t); old.pause(); old.removeAttribute('src'); try { old.load(); } catch (e) { } } else old.volume = v; }, 40); }
    if (!name) { this.el = null; return; }
    const a = new Audio('assets/audio/bgm_' + name + '.ogg'); a.loop = true; a.volume = this.on ? this.vol : 0; this.el = a;
    const p = a.play(); if (p && p.catch) p.catch(() => { this._pending = true; });
  },
  unlock() { if (this.el && this.el.paused && this.on) { const p = this.el.play(); if (p && p.catch) p.catch(() => { }); } },
  toggle(on) { this.on = on; if (this.el) { this.el.volume = on ? this.vol : 0; if (on) this.unlock(); } },
  pause() { if (this.el) this.el.pause(); }, resume() { this.unlock(); },
};
// 音效：固定大小的 <audio> 池轮流复用（避免无限创建媒体播放器导致 WebView 资源耗尽）
const Sfx = {
  on: true, pool: [], idx: 0, last: {}, N: 8,
  play(name, vol = 1) {
    if (!this.on) return; const now = performance.now(); if (this.last[name] && now - this.last[name] < 60) return; this.last[name] = now;
    try {
      if (!this.pool.length) for (let k = 0; k < this.N; k++) { const a = new Audio(); a.preload = 'auto'; this.pool.push(a); }
      const a = this.pool[this.idx = (this.idx + 1) % this.N]; const url = 'assets/audio/sfx_' + name + '.ogg';
      if (a._n !== name) { a.src = url; a._n = name; } else { a.currentTime = 0; }
      a.volume = Math.min(1, vol * 0.7); const p = a.play(); if (p && p.catch) p.catch(() => { });
    } catch (e) { }
  },
};
addEventListener('pointerdown', () => Audio2.unlock(), { once: false, passive: true });

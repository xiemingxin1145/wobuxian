/* 程序化音效与古风背景乐（WebAudio，无音频文件） */
'use strict';
const SFX = (() => {
  let ac = null, master = null, musicGain = null, musicOn = true, sfxOn = true, timer = null, step = 0;
  const PENTA = [0, 2, 4, 7, 9]; // 宫商角徵羽
  function ensure() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ac = new AC(); master = ac.createGain(); master.gain.value = 0.7; master.connect(ac.destination);
    musicGain = ac.createGain(); musicGain.gain.value = musicOn ? 0.32 : 0; musicGain.connect(master);
    startMusic(); return true;
  }
  function env(g, t, a, d, peak) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function tone(freq, dur, type = 'sine', vol = 0.2, when = 0, dest) {
    if (!ac) return; const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.connect(g); g.connect(dest || master); env(g, t, 0.005, dur, vol); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  function pluck(freq, vol = 0.18, when = 0, dest) { // 古筝感拨弦
    tone(freq, 1.6, 'triangle', vol, when, dest); tone(freq * 2, 0.6, 'sine', vol * 0.35, when, dest); tone(freq * 3.01, 0.25, 'sine', vol * 0.15, when, dest);
  }
  function noise(dur, vol = 0.3, f = 1200, q = 1, when = 0, type = 'bandpass') {
    if (!ac) return; const t = ac.currentTime + when, n = ac.sampleRate * dur, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    s.connect(fl); fl.connect(g); g.connect(master); env(g, t, 0.005, dur, vol); s.start(t);
  }
  const midi = m => 440 * Math.pow(2, (m - 69) / 12);
  function startMusic() {
    if (timer) return; const beat = 0.42; let next = ac.currentTime + 0.2;
    const prog = [[50, 57], [48, 55], [45, 52], [47, 54]];
    timer = setInterval(() => {
      if (!ac) return;
      while (next < ac.currentTime + 0.5) {
        const bar = Math.floor(step / 8) % 4, pos = step % 8, w = next - ac.currentTime;
        if (pos === 0) { for (const m of prog[bar]) tone(midi(m), beat * 7, 'sine', 0.06, w, musicGain); }
        if (Math.random() < (pos % 2 ? 0.35 : 0.7)) { const deg = PENTA[(Math.random() * 5) | 0], oct = Math.random() < 0.3 ? 12 : 0; pluck(midi(62 + deg + oct), 0.09, w, musicGain); }
        if (pos === 4 && Math.random() < 0.5) tone(midi(74 + PENTA[(Math.random() * 5) | 0]), 1.2, 'sine', 0.03, w, musicGain);
        next += beat; step++;
      }
    }, 120);
  }
  const api = {
    unlock: ensure,
    click() { if (!sfxOn || !ensure()) return; tone(880, 0.06, 'square', 0.04); tone(1320, 0.05, 'sine', 0.05, 0.02); },
    wood() { if (!sfxOn || !ensure()) return; tone(520, 0.08, 'sine', 0.2); noise(0.04, 0.1, 2500, 3); },
    coin() { if (!sfxOn || !ensure()) return; tone(1568, 0.08, 'square', 0.05); tone(2093, 0.2, 'square', 0.05, 0.07); },
    chime() { if (!sfxOn || !ensure()) return; [0, 4, 7, 12, 16].forEach((d, i) => pluck(midi(72 + d), 0.12, i * 0.07)); },
    event() { if (!sfxOn || !ensure()) return; pluck(midi(69), 0.12); pluck(midi(76), 0.1, 0.12); },
    hit() { if (!sfxOn || !ensure()) return; noise(0.15, 0.35, 900, 0.8); tone(140, 0.12, 'sawtooth', 0.08); },
    swish() { if (!sfxOn || !ensure()) return; noise(0.22, 0.18, 3000, 2, 0, 'highpass'); },
    thunder() { if (!sfxOn || !ensure()) return; noise(1.4, 0.7, 300, 0.5, 0, 'lowpass'); noise(0.25, 0.5, 4000, 0.5, 0, 'highpass'); tone(55, 1.0, 'sawtooth', 0.15); },
    gong() { if (!sfxOn || !ensure()) return; [1, 1.48, 2.06, 2.74, 3.6].forEach((r, i) => tone(110 * r, 2.8 - i * 0.4, 'sine', 0.16 / (i + 1))); noise(0.3, 0.15, 600, 1); },
    levelup() { if (!sfxOn || !ensure()) return; api.gong(); [0, 2, 4, 7, 9, 12, 14, 16, 19].forEach((d, i) => pluck(midi(67 + d), 0.1, 0.15 + i * 0.06)); },
    fail() { if (!sfxOn || !ensure()) return; [0, -3, -7, -12].forEach((d, i) => tone(midi(64 + d), 0.4, 'triangle', 0.12, i * 0.18)); },
    death() { if (!sfxOn || !ensure()) return; [0, -2, -5, -9, -12].forEach((d, i) => pluck(midi(62 + d), 0.13, i * 0.35)); },
    setMusic(on) { musicOn = on; if (musicGain) musicGain.gain.setTargetAtTime(on ? 0.32 : 0, ac.currentTime, 0.3); },
    setSfx(on) { sfxOn = on; },
    get musicOn() { return musicOn; }, get sfxOn() { return sfxOn; },
    suspend() { if (ac) ac.suspend(); }, resume() { if (ac) ac.resume(); }
  };
  return api;
})();

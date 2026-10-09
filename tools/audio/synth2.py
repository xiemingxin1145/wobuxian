"""v2.1 音频：44.1kHz 立体声原创国风 BGM（AB 两段、二胡/笛子/古筝/琵琶/鼓）与人声感音效（共振峰合成）。
全部为程序化合成的原创内容。用法: python3 synth2.py OUTDIR"""
import numpy as np, os, sys, random, subprocess
from scipy.signal import lfilter, iirpeak, butter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import synth as S
SR = S.SR = 44100
OUT = sys.argv[1] if len(sys.argv) > 1 else 'out2'; os.makedirs(OUT, exist_ok=True)
nh = S.note_hz; sn = S.scale_note
def T(d): return np.arange(int(d * SR)) / SR

def erhu(hz, dur, prev=None, seed=0):
    t = T(dur); n = len(t)
    f = np.full(n, hz)
    if prev: sl = min(n, int(0.07 * SR)); f[:sl] = prev + (hz - prev) * (1 - np.exp(-np.linspace(0, 5, sl)))
    vib = 1 + 0.012 * np.sin(2 * np.pi * 5.6 * t) * np.clip((t - 0.15) / 0.3, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR; s = np.zeros(n)
    for k in range(1, 14):
        if hz * k > SR / 2.2: break
        fk = hz * k; form = 1 + 1.6 * np.exp(-((fk - 1000) / 450) ** 2) + 1.0 * np.exp(-((fk - 2600) / 700) ** 2)
        s += np.sin(k * ph) / k * form
    s += np.random.default_rng(seed).normal(0, 0.03, n)  # 弓噪
    e = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.08 + 0.02); e = np.clip(e, 0, 1) * (0.85 + 0.15 * np.sin(np.pi * t / max(dur, 1e-3)))
    return s * e * 0.22

def dizi(hz, dur, seed=0):
    t = T(dur); vib = 1 + 0.008 * np.sin(2 * np.pi * 6 * t) * np.clip((t - 0.2) / 0.3, 0, 1)
    ph = 2 * np.pi * np.cumsum(hz * vib) / SR
    s = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph) + 0.05 * np.sin(4 * ph)
    buzz = np.random.default_rng(seed).normal(0, 1, len(t)); b, a = butter(2, [min(0.99, hz * 3 / (SR / 2)), min(0.995, hz * 5 / (SR / 2))], 'band'); s += lfilter(b, a, buzz) * 0.25  # 笛膜
    e = np.minimum(1, t / 0.05) * np.clip((dur - t) / 0.06, 0, 1)
    return s * e * 0.3

def pipa_trem(hz, dur, seed=0):
    out = np.zeros(int(dur * SR)); k = 0; step = 0.07
    while k * step < dur - 0.05:
        mix1(out, S.pluck(hz, 0.25, 0.95, seed + k), k * step, 0.6 + 0.2 * (k % 2)); k += 1
    return out * 0.5

def hat(dur=0.08):
    t = T(dur); x = np.random.default_rng(3).normal(0, 1, len(t)); b, a = butter(2, 7000 / (SR / 2), 'high'); return lfilter(b, a, x) * np.exp(-t * 60) * 0.5

def mix1(dst, src, at, g=1.0):
    i = int(at * SR); j = min(len(dst), i + len(src))
    if 0 <= i < len(dst): dst[i:j] += src[:j - i] * g

class St:
    def __init__(s, n): s.L = np.zeros(n); s.R = np.zeros(n)
    def add(s, src, at, g=1.0, pan=0.0):
        a = np.cos((pan + 1) * np.pi / 4); b = np.sin((pan + 1) * np.pi / 4)
        mix1(s.L, src, at, g * a * 1.41); mix1(s.R, src, at, g * b * 1.41)

def reverb_st(L, R, wet=0.28, size=1.0):
    def comb(x, d, g):
        D = int(d * size * SR); a = np.zeros(D + 1); a[0] = 1; a[D] = -g; return lfilter([1], a, x)
    def ap(x, d, g):
        D = int(d * SR); b = np.zeros(D + 1); b[0] = -g; b[D] = 1; a = np.zeros(D + 1); a[0] = 1; a[D] = -g; return lfilter(b, a, x)
    outs = []
    for x, ds in ((L, (0.0297, 0.0371, 0.0411, 0.0437)), (R, (0.0301, 0.0359, 0.0423, 0.0449))):
        y = sum(comb(x, d, 0.78) for d in ds) / 4; y = ap(ap(y, 0.005, 0.7), 0.0017, 0.7)
        b, a = butter(1, 5500 / (SR / 2)); outs.append(lfilter(b, a, y))
    return L + outs[0] * wet, R + outs[1] * wet

def compose2(seed, root=62, bpm=84, bars=16, mood='calm', lead='erhu', lead2='dizi'):
    rng = random.Random(seed); beat = 60 / bpm; L = 2 * bars * 4 * beat; n = int((L + 4) * SR); st = St(n)
    prog = {'calm': [0, 3, 4, 2], 'busy': [0, 4, 3, 4], 'dark': [0, 1, 3, 0], 'epic': [0, 3, 1, 4], 'dreamy': [0, 2, 3, 1]}[mood]
    motif = [rng.choice([0, 1, 2, 3, 4, 5, 6]) for _ in range(8)]; motif2 = [rng.choice([2, 3, 4, 5, 6, 7]) for _ in range(8)]
    rhythms = [[1, .5, .5, 1, 1], [.5, .5, 1, .5, .5, 1], [1.5, .5, 1, 1], [1, 1, .5, .5, 1], [2, 1, 1], [.75, .25, 1, 2]]
    rA = rng.choice(rhythms); rB = rng.choice(rhythms)
    prevhz = None
    for bar in range(2 * bars):
        sec = 0 if bar < bars else 1; b_ = bar % bars; ch = prog[b_ % 4] + (1 if sec and b_ % 8 >= 4 else 0); t0 = bar * 4 * beat
        st.add(S.pad(nh(sn(root - 12, ch)), 4 * beat + 0.6), t0, 0.7, -0.3); st.add(S.pad(nh(sn(root - 12, ch + 2)), 4 * beat + 0.6), t0, 0.5, 0.3)
        st.add(S.pad(nh(sn(root - 24, ch)), 4 * beat + 0.6), t0, 0.6, 0)
        arp = [ch, ch + 2, ch + 4, ch + 5, ch + 4, ch + 2, ch + 5, ch + 7] if mood != 'dark' else [ch, ch + 1, ch + 3, ch + 1] * 2
        for k, d in enumerate(arp):
            if mood in ('calm', 'dreamy') and k % 2 and rng.random() < 0.35: continue
            st.add(S.pluck(nh(sn(root - 12 + (12 if k > 3 else 0), d)), 1.6, 0.6, seed + bar * 8 + k), t0 + k * beat / 2, 0.32, -0.45 + 0.1 * (k % 3))
        if b_ == 0:  # 古筝刮奏
            for k in range(10): st.add(S.pluck(nh(sn(root - 12, k)), 1.2, 0.9, 900 + k), t0 - 0.5 + k * 0.045, 0.22, -0.6 + k * 0.12)
        if b_ % 8 >= 2 or mood in ('busy', 'epic') or sec:
            tt = t0; idx = 0; var = (b_ // 2) % 3; rh = rB if sec else rA; mo = motif2 if sec else motif
            for r_ in rh:
                if tt >= t0 + 4 * beat - 0.01: break
                deg = mo[(idx + b_) % 8] + (var - 1) + ch // 2; idx += 1
                hz = nh(sn(root + (5 if sec and mood != 'dark' else 0), max(0, deg)))
                if rng.random() < 0.1: tt += r_ * beat; continue
                ins = lead2 if sec else lead
                if ins == 'erhu': st.add(erhu(hz, r_ * beat * 0.98, prevhz, seed + bar), tt, 0.9, 0.15)
                elif ins == 'dizi': st.add(dizi(hz * 2, r_ * beat * 0.95, seed + bar), tt, 0.75, 0.2)
                elif ins == 'pipa': st.add(pipa_trem(hz * 2, r_ * beat * 0.95, seed + bar), tt, 0.7, 0.25)
                else: st.add(S.pluck(hz * 2, r_ * beat * 1.6, 0.9, seed + idx), tt, 0.6, 0.2)
                prevhz = hz; tt += r_ * beat
        if mood in ('busy', 'epic', 'dark'):
            for b in range(4):
                if mood == 'epic' or b % 2 == 0: st.add(S.drum(0.5, 62 if mood != 'busy' else 100), t0 + b * beat, 0.65 if mood == 'epic' else 0.4, 0)
                if mood == 'busy': st.add(S.woodblock(), t0 + b * beat + beat / 2, 0.25, 0.4)
                if mood == 'epic': st.add(hat(), t0 + b * beat + beat / 2, 0.25, -0.3); st.add(S.drum(0.2, 170, 0.5), t0 + b * beat + beat * 0.75, 0.25, 0.2) if b % 2 else None
        elif b_ % 4 == 3: st.add(S.woodblock(), t0 + 3.5 * beat, 0.12, 0.5)
        if b_ % 8 == 0 and mood in ('epic', 'dark'): st.add(S.gong(4.0, 98 if mood == 'dark' else 110), t0, 0.45, 0)
    Lc, Rc = reverb_st(st.L, st.R, 0.32 if mood in ('dreamy', 'calm') else 0.22, 1.2 if mood == 'dreamy' else 1.0)
    m = int(L * SR)
    for x in (Lc, Rc): tail = x[m:].copy(); x[:len(tail)] += tail
    Lc, Rc = Lc[:m], Rc[:m]; pk = max(np.abs(Lc).max(), np.abs(Rc).max(), 1e-6)
    Lc = np.tanh(Lc / pk * 1.3) * 0.8; Rc = np.tanh(Rc / pk * 1.3) * 0.8
    return Lc, Rc

def save(name, L, R=None, q=5):
    if R is None: R = L
    pcm = (np.clip(np.stack([L, R], 1), -1, 1) * 32767).astype('<i2').tobytes(); p = os.path.join(OUT, name + '.ogg')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libvorbis', '-q:a', str(q), p], input=pcm, check=True)
    print(name, os.path.getsize(p), flush=True)

# ---------- 人声感（共振峰合成，原创） ----------
VOW = {'a': (800, 1200, 2600), 'e': (500, 1500, 2500), 'i': (320, 2300, 3000), 'o': (500, 850, 2500), 'u': (350, 700, 2400)}
def voice(segs, f0, f1=None, breath=0.15, female=False, seed=0):
    """segs: [(vowel, dur), ...]；可带前置 'h' 气声"""
    out = []
    rng = np.random.default_rng(seed)
    total = sum(d for v, d in segs); t = T(total); f1 = f1 or f0 * 0.8
    f = f0 + (f1 - f0) * (t / total) + f0 * 0.03 * np.sin(2 * np.pi * 6 * t)
    ph = np.cumsum(f) / SR; glot = (ph % 1.0); src = (glot < 0.6) * np.sin(np.pi * glot / 0.6) ** 2; src = np.diff(src, prepend=0) * 20
    src += rng.normal(0, breath, len(t))
    y = np.zeros(len(t)); pos = 0
    for v, d in segs:
        k = int(d * SR); seg = src[pos:pos + k]
        if v == 'h': seg = rng.normal(0, 0.6, k); fm = VOW['a']
        else: fm = VOW[v]
        acc = np.zeros(len(seg))
        for j, F in enumerate(fm):
            F = F * (1.17 if female else 1.0); b, a = iirpeak(min(F, SR / 2.3) / (SR / 2), 6 + j * 2); acc += lfilter(b, a, seg) / (1 + j * 0.6)
        y[pos:pos + len(seg)] = acc; pos += k
    e = np.minimum(1, t / 0.015) * np.clip((total - t) / 0.08, 0, 1)
    y *= e; return y / max(1e-6, np.abs(y).max()) * 0.9

def sfx2():
    V = {}
    V['voice_ha_m'] = voice([('h', 0.05), ('a', 0.22)], 150, 115, seed=1)
    V['voice_ha_f'] = voice([('h', 0.04), ('a', 0.2)], 330, 270, female=True, seed=2)
    V['voice_hey_m'] = voice([('h', 0.04), ('e', 0.12), ('i', 0.12)], 140, 170, seed=3)
    V['voice_hey_f'] = voice([('h', 0.03), ('e', 0.11), ('i', 0.12)], 310, 360, female=True, seed=4)
    V['voice_hurt_m'] = voice([('u', 0.06), ('o', 0.22)], 170, 110, breath=0.3, seed=5)
    V['voice_hurt_f'] = voice([('a', 0.05), ('o', 0.2)], 380, 280, breath=0.3, female=True, seed=6)
    V['voice_wow'] = voice([('u', 0.08), ('a', 0.4)], 220, 300, seed=7)
    lau = np.zeros(int(0.8 * SR))
    for k in range(4): mix1(lau, voice([('h', 0.03), ('e', 0.1)], 200 - k * 8, 180 - k * 8, seed=10 + k), k * 0.16, 0.8)
    V['voice_laugh'] = lau
    x = T(2.6); s = np.zeros(len(x))
    for k, d in enumerate((0, 2, 4, 5, 7, 9, 10, 12)): mix1(s, S.pluck(nh(sn(72, d)), 1.4, 0.95, 50 + k), k * 0.07, 0.5)
    mix1(s, S.gong(2.0, 220), 0.6, 0.35); mix1(s, voice([('o', 0.9)], 520, 560, female=True, seed=20) * 0.25, 0.6)
    for k in range(18): mix1(s, np.sin(2 * np.pi * (2400 + 180 * k) * T(0.3)) * np.exp(-T(0.3) * 14) * 0.15, 0.7 + k * 0.05)
    V['gacha_ssr'] = s
    s = np.zeros(int(1.4 * SR))
    for k, d in enumerate((0, 2, 4, 7)): mix1(s, S.pluck(nh(sn(67, d)), 1.0, 0.9, 60 + k), k * 0.08, 0.5)
    V['gacha_sr'] = s
    s = np.zeros(int(3.0 * SR)); mix1(s, S.gong(3.0, 98), 0, 0.7)
    for k in range(12): mix1(s, S.pluck(nh(sn(50, k)), 1.4, 0.9, 80 + k), 0.2 + k * 0.05, 0.3)
    V['chapter'] = s
    x = T(3.0); s = np.zeros(len(x)); th = np.convolve(np.random.default_rng(9).normal(0, 1, len(x)), np.ones(50) / 50, 'same') * 6
    s += th * np.exp(-x * 1.5) * 0.7
    for d in (0, 4, 7, 12): mix1(s, S.pad(nh(sn(62, d % 5) + (12 if d >= 12 else 0)), 2.6) * 3, 0.4, 0.5)
    V['breakthrough'] = s
    for k, v in V.items():
        v = v / max(1e-6, np.abs(v).max()) * 0.9; Lr, Rr = reverb_st(v, v, 0.18); save('sfx_' + k, Lr, Rr, 5)

BGM2 = {
    'village': dict(seed=11, root=62, bpm=80, bars=16, mood='calm', lead='dizi', lead2='erhu'),
    'sect': dict(seed=23, root=60, bpm=72, bars=16, mood='dreamy', lead='erhu', lead2='dizi'),
    'market': dict(seed=35, root=65, bpm=112, bars=16, mood='busy', lead='pipa', lead2='dizi'),
    'secret': dict(seed=47, root=57, bpm=76, bars=16, mood='dark', lead='erhu', lead2='pluck'),
    'graveyard': dict(seed=59, root=55, bpm=66, bars=12, mood='dark', lead='erhu', lead2='pipa'),
    'island': dict(seed=61, root=64, bpm=88, bars=16, mood='calm', lead='dizi', lead2='pluck'),
    'rift': dict(seed=73, root=53, bpm=96, bars=16, mood='epic', lead='erhu', lead2='pipa'),
    'heaven': dict(seed=89, root=67, bpm=70, bars=16, mood='dreamy', lead='dizi', lead2='erhu'),
    'battle': dict(seed=97, root=62, bpm=128, bars=16, mood='epic', lead='pipa', lead2='erhu'),
    'boss': dict(seed=101, root=57, bpm=136, bars=16, mood='epic', lead='erhu', lead2='pipa'),
    'title': dict(seed=7, root=62, bpm=70, bars=12, mood='dreamy', lead='erhu', lead2='dizi'),
    'gacha': dict(seed=131, root=67, bpm=100, bars=8, mood='busy', lead='dizi', lead2='pipa'),
    'ending': dict(seed=151, root=60, bpm=64, bars=12, mood='dreamy', lead='erhu', lead2='dizi'),
}
if __name__ == '__main__':
    only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
    if not only or 'sfx' in only: sfx2()
    for k, cfg in BGM2.items():
        if only and k not in only: continue
        save('bgm_' + k, *compose2(**cfg), q=5)

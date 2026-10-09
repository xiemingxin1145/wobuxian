"""离线合成原创国风 BGM 与音效（numpy），ffmpeg 编码为 ogg vorbis"""
import numpy as np, subprocess, os, sys, random
SR = 32000
OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'
os.makedirs(OUT, exist_ok=True)

def note_hz(n): return 440.0 * 2 ** ((n - 69) / 12)
def env(n, a=0.005, d=0.3, s=0.0, r=0.1):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4))
    e *= np.where(t > a, s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)), 1)
    tail = int(r * SR)
    if tail and tail < n: e[-tail:] *= np.linspace(1, 0, tail)
    return e

def pluck(hz, dur, bright=0.5, seed=0):
    """Karplus-Strong 弹拨（古筝/琵琶感）"""
    n = int(dur * SR); p = max(2, int(SR / hz)); rng = np.random.default_rng(seed)
    buf = rng.uniform(-1, 1, p); out = np.zeros(n); dec = 0.996 - (1 - bright) * 0.004
    # 向量化：逐周期迭代
    i = 0
    while i < n:
        k = min(p, n - i); out[i:i + k] = buf[:k]
        buf = dec * 0.5 * (buf + np.roll(buf, -1)); i += k
    out *= env(n, 0.002, dur * 0.6, 0, 0.05)
    return out

def flute(hz, dur, vib=5.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = hz * (1 + 0.006 * np.sin(2 * np.pi * vib * t) * np.minimum(1, t / 0.3))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    s += np.random.default_rng(int(hz)).normal(0, 0.05, n) * np.exp(-t * 8)
    return s * env(n, 0.06, 1.0, 0.75, min(0.15, dur * 0.3)) * 0.5

def pad(hz, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = 0
    for det in (-0.004, 0, 0.004):
        s = s + np.sin(2 * np.pi * hz * (1 + det) * t) + 0.3 * np.sin(4 * np.pi * hz * (1 + det) * t)
    return s * env(n, dur * 0.3, 10, 1, dur * 0.4) * 0.12

def drum(dur=0.4, hz=90, noise=0.2):
    n = int(dur * SR); t = np.arange(n) / SR
    f = hz * (1 + 1.5 * np.exp(-t * 30)); s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    s += np.random.default_rng(1).normal(0, noise, n) * np.exp(-t * 40)
    return s * np.exp(-t * 9)

def woodblock(dur=0.12):
    n = int(dur * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 900 * t) + 0.5 * np.sin(2 * np.pi * 1400 * t)) * np.exp(-t * 60)

def gong(dur=3.0, hz=110):
    n = int(dur * SR); t = np.arange(n) / SR; s = 0
    for k, r in enumerate((1, 1.48, 2.1, 2.76, 3.3)):
        s = s + np.sin(2 * np.pi * hz * r * t * (1 + 0.002 * np.sin(3 * t))) * np.exp(-t * (1.2 + k * 0.6)) / (k + 1)
    return s * 0.6

def mix(dst, src, at, gain=1.0):
    i = int(at * SR); j = min(len(dst), i + len(src))
    if i < len(dst): dst[i:j] += src[:j - i] * gain

def reverb(x, wet=0.25):
    y = x.copy()
    for d, g in ((0.037, 0.5), (0.051, 0.45), (0.079, 0.38), (0.113, 0.3), (0.171, 0.22), (0.23, 0.16)):
        k = int(d * SR); y[k:] += x[:-k] * g * wet * 2
    return y

PENTA = [0, 2, 4, 7, 9]
def scale_note(root, deg):
    o, d = divmod(deg, 5); return root + 12 * o + PENTA[d]

def compose(seed, root=62, bpm=84, bars=16, mood='calm', lead='flute'):
    rng = random.Random(seed); beat = 60 / bpm; L = bars * 4 * beat
    out = np.zeros(int((L + 3) * SR))
    prog = {'calm': [0, 3, 4, 2], 'busy': [0, 4, 3, 4], 'dark': [0, 1, 3, 0], 'epic': [0, 3, 1, 4], 'dreamy': [0, 2, 3, 1]}[mood]
    # 动机
    motif = [rng.choice([0, 1, 2, 3, 4, 5, 6]) for _ in range(8)]
    rhythm = rng.choice([[1, .5, .5, 1, 1], [.5, .5, 1, .5, .5, 1], [1.5, .5, 1, 1], [1, 1, .5, .5, 1]])
    for bar in range(bars):
        ch = prog[bar % 4]; t0 = bar * 4 * beat
        # 低音 + 和声垫
        mix(out, pad(note_hz(scale_note(root - 12, ch)), 4 * beat + 0.5), t0, 0.9 if mood != 'busy' else 0.6)
        mix(out, pad(note_hz(scale_note(root - 12, ch + 2)), 4 * beat + 0.5), t0, 0.6)
        # 古筝分解和弦
        arp = [ch, ch + 2, ch + 4, ch + 5, ch + 4, ch + 2, ch + 5, ch + 7] if mood != 'dark' else [ch, ch + 1, ch + 3, ch + 1] * 2
        step = beat / 2 if mood in ('busy', 'epic') else beat / 2
        for k, d in enumerate(arp):
            if mood == 'calm' and k % 2 and rng.random() < 0.4: continue
            mix(out, pluck(note_hz(scale_note(root - 12 + (12 if k > 3 else 0), d)), 1.4, 0.6, seed + bar * 8 + k), t0 + k * step, 0.33)
        # 旋律（每两小节一句，后半句变奏）
        if bar % 8 >= 2 or mood in ('busy', 'epic'):
            tt = t0; idx = 0; var = (bar // 2) % 3
            for r_ in rhythm:
                if tt >= t0 + 4 * beat - 0.01: break
                deg = motif[(idx + bar) % 8] + (var - 1) + ch // 2; idx += 1
                hz = note_hz(scale_note(root, max(0, deg)))
                if rng.random() < 0.12: tt += r_ * beat; continue
                if lead == 'flute': mix(out, flute(hz, r_ * beat * 0.95), tt, 0.55)
                else: mix(out, pluck(hz * 2, r_ * beat * 1.6, 0.9, seed + idx), tt, 0.5)
                tt += r_ * beat
        # 打击
        if mood in ('busy', 'epic', 'dark'):
            for b in range(4):
                if mood == 'epic' or b % 2 == 0: mix(out, drum(0.45, 70 if mood != 'busy' else 110), t0 + b * beat, 0.55 if mood == 'epic' else 0.35)
                if mood == 'busy': mix(out, woodblock(), t0 + b * beat + beat / 2, 0.25)
                if mood == 'epic' and b % 2: mix(out, drum(0.2, 160, 0.5), t0 + b * beat + beat / 2, 0.3)
        if bar % 8 == 0 and mood in ('epic', 'dark'): mix(out, gong(3.5, 98 if mood == 'dark' else 110), t0, 0.4)
    out = reverb(out, 0.3)
    # 循环：尾部混回开头
    n = int(L * SR); tail = out[n:]; out = out[:n]; out[:len(tail)] += tail
    out /= max(1e-6, np.abs(out).max()) / 0.85
    return out

def save(name, x, q=2):
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()
    p = os.path.join(OUT, name + '.ogg')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libvorbis', '-q:a', str(q), p], input=pcm, check=True)
    print(name, os.path.getsize(p))

BGM = {
    'village': dict(seed=11, root=62, bpm=80, bars=16, mood='calm'),
    'sect': dict(seed=23, root=60, bpm=72, bars=16, mood='dreamy'),
    'market': dict(seed=35, root=65, bpm=112, bars=16, mood='busy', lead='pluck'),
    'secret': dict(seed=47, root=57, bpm=76, bars=16, mood='dark'),
    'graveyard': dict(seed=59, root=55, bpm=66, bars=12, mood='dark', lead='pluck'),
    'island': dict(seed=61, root=64, bpm=88, bars=16, mood='calm'),
    'rift': dict(seed=73, root=53, bpm=96, bars=16, mood='epic'),
    'heaven': dict(seed=89, root=67, bpm=70, bars=16, mood='dreamy'),
    'battle': dict(seed=97, root=62, bpm=128, bars=16, mood='epic'),
    'boss': dict(seed=101, root=57, bpm=136, bars=16, mood='epic', lead='pluck'),
    'title': dict(seed=7, root=62, bpm=70, bars=12, mood='dreamy'),
}

def sfx():
    S = {}
    t = lambda d: np.arange(int(d * SR)) / SR
    x = t(0.06); S['click'] = np.sin(2 * np.pi * 1200 * x) * np.exp(-x * 70) * 0.6
    x = t(0.25); S['slash'] = np.random.default_rng(2).normal(0, 1, len(x)) * np.exp(-x * 18) * np.sin(np.pi * np.minimum(1, x / 0.25)) ; S['slash'] = np.convolve(S['slash'], np.ones(6) / 6, 'same') * 0.8
    x = t(0.3); S['hit'] = drum(0.3, 120, 0.8) * 0.9
    x = t(0.9); f = 600 + 900 * x; S['magic'] = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 3) * 0.4 + reverb(pluck(1320, 0.9, 0.9, 5), 0.4) * 0.4
    x = t(1.0); S['heal'] = sum(pluck(note_hz(scale_note(72, d)), 1.0, 0.8, d) for d in (0, 2, 4, 5)) * 0.25
    S['levelup'] = np.zeros(int(1.6 * SR))
    for k, d in enumerate((0, 1, 2, 3, 4, 5, 7)): mix(S['levelup'], pluck(note_hz(scale_note(67, d)), 0.9, 0.9, k), k * 0.09, 0.5)
    mix(S['levelup'], gong(1.0, 220), 0.6, 0.3)
    x = t(2.2); thunder = np.random.default_rng(9).normal(0, 1, len(x)); thunder = np.convolve(thunder, np.ones(40) / 40, 'same') * 6
    S['thunder'] = (thunder * np.exp(-x * 1.8) + drum(2.2, 45, 0.6) * 0.8) * 0.8
    x = t(0.35); S['coin'] = (np.sin(2 * np.pi * 1975 * x) + np.sin(2 * np.pi * 2637 * x) * (x > 0.07)) * np.exp(-x * 12) * 0.35
    x = t(0.08); S['step'] = np.random.default_rng(4).normal(0, 1, len(x)) * np.exp(-x * 80) * 0.2
    x = t(0.4); f = 500 - 300 * x; S['fail'] = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-x * 6) * 0.2
    x = t(0.5); S['pickup'] = sum(pluck(note_hz(n), 0.5, 0.9, n) for n in (79, 84)) * 0.4
    S['gong'] = gong(2.5, 130)
    x = t(0.6); f = 300 + 1500 * x ** 2; S['whoosh'] = np.random.default_rng(6).normal(0, 1, len(x)) * np.sin(np.pi * x / 0.6) * 0.3 + np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.1 * np.sin(np.pi * x / 0.6)
    x = t(0.5); S['fire'] = np.convolve(np.random.default_rng(8).normal(0, 1, len(x)), np.ones(12) / 12, 'same') * np.exp(-x * 4) * 2.0
    x = t(0.7); S['ice'] = sum(np.sin(2 * np.pi * h * x) * np.exp(-x * (5 + k)) for k, h in enumerate((2093, 2793, 3520))) * 0.2
    x = t(0.25); S['dialog'] = pluck(880, 0.25, 0.8, 3) * 0.4
    S['victory'] = np.zeros(int(2.2 * SR))
    for k, d in enumerate((0, 2, 4, 7, 9, 10)): mix(S['victory'], pluck(note_hz(scale_note(62, d)), 1.2, 0.9, k), k * 0.12, 0.6)
    mix(S['victory'], gong(1.5, 147), 0.75, 0.4)
    S['defeat'] = np.zeros(int(2.0 * SR))
    for k, n in enumerate((62, 60, 57, 55)): mix(S['defeat'], flute(note_hz(n), 0.45), k * 0.4, 0.6)
    for k, v in S.items():
        v = v / max(1e-6, np.abs(v).max()) * 0.9; save('sfx_' + k, v, 3)

if __name__ == '__main__':
    for k, cfg in BGM.items(): save('bgm_' + k, compose(**cfg), 1)
    sfx()

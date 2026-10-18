"""v2.6 音频：秘境 / 传承 / 剑冢主题 BGM 3 首 + 音效 5 个。
复用 synth2.py 的 compose2（五声音阶国风 AB 段）与 synth.py 的弹拨/锣鼓原语。
全部程序化原创。用法: python3 synth26.py OUTDIR
OUTDIR 默认指向本仓库 www/assets/audio/。"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import synth2 as S2   # 复用 compose2 / save / reverb_st / mix1 / nh / sn
import synth as S

SR = S2.SR = 44100

# 默认输出到仓库 www/assets/audio/（相对本文件 tools/audio/ 的上两级）
HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'www', 'assets', 'audio'))
OUT = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_OUT
os.makedirs(OUT, exist_ok=True)
S2.OUT = OUT   # 让 synth2.save 写到本目录

nh, sn = S2.nh, S2.sn

# ---------------- 3 首主题 BGM ----------------
BGM26 = {
    # 剑冢：上古剑仙埋骨之地，肃穆肃杀（dark + epic，二胡主奏 + 琵琶）
    'bgm_jianzhong': dict(seed=201, root=55, bpm=96, bars=16, mood='epic', lead='erhu', lead2='pipa'),
    # 秘境：幽幽迷宫，幽暗悬疑（dark，低音二胡 + 古筝拨弦）
    'bgm_mijing':    dict(seed=217, root=57, bpm=76, bars=16, mood='dark', lead='erhu', lead2='pluck'),
    # 传承/问道崖：论道授剑，悠远宁静（dreamy，笛子主奏 + 二胡）
    'bgm_daotong':   dict(seed=233, root=64, bpm=66, bars=16, mood='dreamy', lead='dizi', lead2='erhu'),
}

# ---------------- 音效（单声道短素材） ----------------
def buf(dur):
    return np.zeros(int(dur * SR))

def sfx_door():
    """秘境开门：低沉钟鸣 + 气流嗡鸣"""
    x = buf(1.8)
    g = S.gong(1.6, 82)                       # 低阔钟声
    S.mix(x, g, 0, 0.9)
    t = np.arange(len(x)) / SR
    whoosh = np.random.default_rng(3).normal(0, 1, len(x)) * np.exp(-((t - 0.6) ** 2) / 0.08)
    x += whoosh * 0.25 * np.sin(2 * np.pi * 180 * t)
    return x

def sfx_trap():
    """陷阱触发：不和谐短拨弦簇 + 噪声脆响"""
    x = buf(0.9)
    for k, deg in enumerate([0, 1, 3]):       # 半音堆叠，营造剑罡刺耳感
        S.mix(x, S.pluck(nh(sn(60, deg)) * 1.5, 0.4, 0.95, 30 + k), 0.05 + k * 0.03, 0.5)
    t = np.arange(len(x)) / SR
    snap = np.random.default_rng(5).normal(0, 1, len(x)) * np.exp(-t * 22)
    x += snap * 0.4
    return x

def sfx_chest():
    """秘境宝箱：明亮上行琶音"""
    x = buf(1.2)
    for k, deg in enumerate([0, 2, 4, 7]):
        S.mix(x, S.pluck(nh(sn(64, deg)) * 2, 0.9, 0.95, 40 + k), k * 0.09, 0.55)
    S.mix(x, S.gong(0.8, 520), 0.36, 0.15)
    return x

def sfx_chuanjian():
    """传剑：庄重低音锣 + 高处一缕剑鸣"""
    x = buf(2.2)
    S.mix(x, S.gong(2.0, 98), 0, 0.8)
    S.mix(x, S.pluck(nh(sn(72, 4)) * 2, 1.4, 0.9, 55), 0.5, 0.35)
    S.mix(x, S.pluck(nh(sn(72, 7)) * 2, 1.2, 0.9, 56), 0.9, 0.25)
    return x

def sfx_merchant():
    """秘境游商：轻巧琵琶短句"""
    x = buf(1.0)
    for k, (deg, at) in enumerate([(0, 0.0), (2, 0.12), (4, 0.24), (2, 0.4), (0, 0.55)]):
        S.mix(x, S.pluck(nh(sn(67, deg)) * 2, 0.4, 0.9, 60 + k), at, 0.4)
    return x

SFX26 = {
    'sfx_door': sfx_door,
    'sfx_trap': sfx_trap,
    'sfx_chest': sfx_chest,
    'sfx_chuanjian': sfx_chuanjian,
    'sfx_merchant': sfx_merchant,
}

def save_mono(name, x, q=5):
    x = S.reverb(x, 0.18)
    pk = max(np.abs(x).max(), 1e-6)
    x = np.tanh(x / pk * 1.2) * 0.85
    S2.save(name, x, x, q)

if __name__ == '__main__':
    only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
    for k, cfg in BGM26.items():
        if only and k not in only:
            continue
        print('合成', k, '...', flush=True)
        S2.save(k, *S2.compose2(**cfg), q=5)
    for k, fn in SFX26.items():
        if only and k not in only:
            continue
        print('合成', k, '...', flush=True)
        save_mono(k, fn())
    print('完成，输出目录：', OUT, flush=True)

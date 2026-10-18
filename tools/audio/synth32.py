"""v3.2 音频增量：仙界 4 图 / 万宝楼 / 宗门战争 / 九州大地 / 秘境深层主题 BGM 8 首 + 音效 6 个。
复用 synth2.py 的 compose2（五声音阶国风 AB 段）与 synth.py 的弹拨/锣鼓原语。
全部程序化原创。用法: python3 synth32.py [OUTDIR] [only,bgm,sfx]
OUTDIR 默认指向本仓库 www/assets/audio/。"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import synth2 as S2
import synth as S

SR = S2.SR = 44100

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'www', 'assets', 'audio'))
OUT = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_OUT
os.makedirs(OUT, exist_ok=True)
S2.OUT = OUT

nh, sn = S2.nh, S2.sn

# ---------------- 8 首主题 BGM ----------------
BGM32 = {
    # 万宝楼：坊市拍卖，热闹喜庆（busy，琵琶主奏 + 笛子）
    'bgm_wanbao':   dict(seed=301, root=65, bpm=116, bars=16, mood='busy', lead='pipa', lead2='dizi'),
    # 九重天：云海仙阙，缥缈壮丽（dreamy，笛子 + 二胡）
    'bgm_jiuct':    dict(seed=313, root=67, bpm=70, bars=16, mood='dreamy', lead='dizi', lead2='erhu'),
    # 仙界坊市：空灵市集，琳琅仙珍（calm，琵琶 + 笛子）
    'bgm_xianfang': dict(seed=327, root=69, bpm=96, bars=16, mood='calm', lead='pipa', lead2='dizi'),
    # 瑶池：瑶台琼浆，清雅出尘（dreamy，笛子 + 古筝拨弦）
    'bgm_yaochi':   dict(seed=331, root=64, bpm=64, bars=16, mood='dreamy', lead='dizi', lead2='pluck'),
    # 凌霄殿：天宫威严，金阶玉阙（epic，二胡 + 笛子）
    'bgm_lingxiao': dict(seed=343, root=60, bpm=82, bars=16, mood='epic', lead='erhu', lead2='dizi'),
    # 宗门战争：战鼓擂动，万仙来朝（epic，琵琶 + 二胡）
    'bgm_sectwar':  dict(seed=355, root=58, bpm=132, bars=16, mood='epic', lead='pipa', lead2='erhu'),
    # 九州大地图：山河辽阔，云游四方（calm，笛子 + 二胡）
    'bgm_world':    dict(seed=367, root=62, bpm=78, bars=16, mood='calm', lead='dizi', lead2='erhu'),
    # 秘境深层：幽暗迷宫，步步惊心（dark，低音二胡 + 拨弦）
    'bgm_dungeon':  dict(seed=379, root=54, bpm=88, bars=16, mood='dark', lead='erhu', lead2='pluck'),
}

# ---------------- 音效（单声道短素材） ----------------
def buf(dur):
    return np.zeros(int(dur * SR))

def sfx_auction():
    """拍卖落槌：木质槌击案 + 一声清亮钟鸣"""
    x = buf(1.4)
    t = np.arange(len(x)) / SR
    knock = np.random.default_rng(401).normal(0, 1, len(x)) * np.exp(-t * 30) * np.sin(2 * np.pi * 420 * t)
    S.mix(x, knock, 0, 0.7)
    S.mix(x, S.woodblock(), 0, 0.5)
    S.mix(x, S.gong(1.0, 620), 0.18, 0.22)
    return x

def sfx_war():
    """战鼓号角：连擂三通鼓 + 低沉号角长鸣"""
    x = buf(2.6)
    for k in range(6):
        S.mix(x, S.drum(0.35, 72, 0.55), 0.15 + k * 0.22, 0.9 if k % 2 == 0 else 0.6)
    t = np.arange(len(x)) / SR
    horn = np.sin(2 * np.pi * (180 + 40 * np.sin(2 * np.pi * 0.8 * t)) * t)
    horn_env = np.exp(-((t - 1.2) ** 2) / 0.6)
    x += horn * horn_env * 0.35
    return x

def sfx_fly():
    """御剑破空：气流嘶鸣 + 高处剑吟"""
    x = buf(1.6)
    t = np.arange(len(x)) / SR
    whoosh = np.random.default_rng(402).normal(0, 1, len(x)) * np.exp(-((t - 0.55) ** 2) / 0.04)
    x += whoosh * 0.6 * np.sin(2 * np.pi * (300 + 900 * np.exp(-((t - 0.55) ** 2) / 0.05)) * t)
    S.mix(x, S.pluck(nh(sn(72, 4)) * 2, 1.0, 0.9, 58), 0.7, 0.3)
    return x

def sfx_bell():
    """钟鸣：悠远洪钟三响"""
    x = buf(3.2)
    for k, at in enumerate([0, 1.1, 2.2]):
        S.mix(x, S.gong(1.6, 108 + k * 6), at, 0.8)
    return x

def sfx_meditate():
    """打坐：木鱼轻叩 + 风铃一缕"""
    x = buf(1.8)
    for k, at in enumerate([0.0, 0.4, 0.8, 1.2]):
        S.mix(x, S.woodblock(), at, 0.4)
    S.mix(x, S.pluck(nh(sn(72, 7)) * 2, 1.2, 0.9, 70), 1.0, 0.18)
    return x

def sfx_duel():
    """论道：古筝滑音上行，慧光一闪"""
    x = buf(1.3)
    for k, deg in enumerate([0, 2, 4, 7, 12]):
        S.mix(x, S.pluck(nh(sn(64, deg)) * 2, 0.7, 0.9, 44 + k), k * 0.14, 0.42)
    S.mix(x, S.gong(0.6, 900), 0.72, 0.12)
    return x

SFX32 = {
    'sfx_auction': sfx_auction,
    'sfx_war': sfx_war,
    'sfx_fly': sfx_fly,
    'sfx_bell': sfx_bell,
    'sfx_meditate': sfx_meditate,
    'sfx_duel': sfx_duel,
}

def save_mono(name, x, q=5):
    x = S.reverb(x, 0.18)
    pk = max(np.abs(x).max(), 1e-6)
    x = np.tanh(x / pk * 1.2) * 0.85
    S2.save(name, x, x, q)

if __name__ == '__main__':
    only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
    for k, cfg in BGM32.items():
        if only and k not in only:
            continue
        print('合成', k, '...', flush=True)
        S2.save(k, *S2.compose2(**cfg), q=5)
    for k, fn in SFX32.items():
        if only and k not in only:
            continue
        print('合成', k, '...', flush=True)
        save_mono(k, fn())
    print('完成，输出目录：', OUT, flush=True)

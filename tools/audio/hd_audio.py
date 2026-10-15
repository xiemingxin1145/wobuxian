"""HD 音频包生成：把全部 24 首 BGM + 全部 SFX 以高码率(q8)重合成到 art/out/audio_hd/。
供 WBX_PROFILE=hd 打包使用（HD APK 音频更清晰，体量也更大）。"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
os.environ['WBX_AQ'] = '8'          # synth2.save 会优先读此环境变量
import synth2 as S2
import synth26, synth32

OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'art', 'out', 'audio_hd'))
os.makedirs(OUT, exist_ok=True)
S2.OUT = OUT

# ---- BGM：13(旧) + 3(26) + 8(32) = 24 首 ----
for k, cfg in S2.BGM2.items():
    print('HD-BGM', 'bgm_' + k, flush=True)
    S2.save('bgm_' + k, *S2.compose2(**cfg), q=8)
for k, cfg in synth26.BGM26.items():
    print('HD-BGM', k, flush=True)
    S2.save(k, *S2.compose2(**cfg), q=8)
for k, cfg in synth32.BGM32.items():
    print('HD-BGM', k, flush=True)
    S2.save(k, *S2.compose2(**cfg), q=8)

# ---- SFX：synth2.sfx2 + 26 + 32 ----
print('HD-SFX synth2', flush=True)
S2.sfx2()
for k, fn in synth26.SFX26.items():
    print('HD-SFX', k, flush=True)
    synth26.save_mono(k, fn(), 8)
for k, fn in synth32.SFX32.items():
    print('HD-SFX', k, flush=True)
    synth32.save_mono(k, fn(), 8)
print('HD 音频完成:', OUT, flush=True)

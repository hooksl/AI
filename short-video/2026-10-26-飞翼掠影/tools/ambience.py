# 合成 10 秒可无缝循环的高空风声：在频域里造噪声，逆 FFT 得到的信号天然首尾相接
import numpy as np, wave
SR, DUR = 48000, 10.0
N = int(SR * DUR)
rng = np.random.default_rng(5)
f = np.fft.rfftfreq(N, 1 / SR)
def shaped(mag):
    spec = mag * np.exp(1j * rng.uniform(0, 2*np.pi, len(f))) * rng.rayleigh(1, len(f))
    x = np.fft.irfft(spec, N); return x / np.sqrt(np.mean(x**2))
fs = np.maximum(f, 1)
rumble = shaped((fs > 25) / fs**0.9 * np.exp(-(fs / 320)**2))                    # 低沉的气流轰鸣
air = shaped(np.exp(-0.5 * (np.log(fs / 1100) / 0.75)**2))                       # 中频风噪
hiss = shaped(np.exp(-0.5 * (np.log(fs / 5200) / 0.5)**2))                       # 一点高频嘶声
t = np.arange(N) / SR
lfo = lambda c, p: np.sin(2*np.pi*c*t/DUR + p)                                    # 整数圈调制，保证循环
air_env = 0.75 + 0.25 * lfo(2, 0.3) + 0.10 * lfo(5, 1.7)
mix = 1.0 * rumble + 0.32 * air * air_env + 0.06 * hiss * (0.8 + 0.2 * lfo(3, 2.4))
mix *= 10 ** (-22 / 20) / np.sqrt(np.mean(mix**2))                               # RMS 约 -22 dBFS
mix = np.clip(mix, -0.95, 0.95)
st = np.stack([mix, np.roll(mix, 480)], 1)                                         # 左右声道错开 10 ms，略有空间感
with wave.open('render/ambience.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
print('peak dBFS %.1f' % (20*np.log10(np.abs(mix).max())))

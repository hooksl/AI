# usage: kzh_tts.py <model_dir> <voice> <speed> <out.wav> <text>
import sys, soundfile as sf
from kokoro_onnx import Kokoro
from misaki import zh
d, voice, speed, out, text = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4], sys.argv[5]
k = Kokoro(f"{d}/kokoro-v1.1-zh.onnx", f"{d}/voices-v1.1-zh.bin")
if voice == "list":
    print(sorted(k.get_voices())); sys.exit()
g2p = zh.ZHG2P(version="1.1")
ph, _ = g2p(text)
samples, sr = k.create(ph, voice=voice, speed=speed, is_phonemes=True)
sf.write(out, samples, sr)
print(out, len(samples) / sr)

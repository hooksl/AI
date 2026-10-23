# usage: tts.py <model_dir> <jobs.json> [fp32|bf16]   (Qwen3-TTS CustomVoice, CPU)
# jobs.json: [{"out": "...wav", "text": "...", "speaker": "Uncle_Fu", "instruct": "...", "seed": 1}]
import json, sys, time
import torch, soundfile as sf
from qwen_tts import Qwen3TTSModel

model_dir, jobs_path = sys.argv[1], sys.argv[2]
dtype = {"fp32": torch.float32, "bf16": torch.bfloat16}[sys.argv[3] if len(sys.argv) > 3 else "fp32"]
t0 = time.time()
model = Qwen3TTSModel.from_pretrained(model_dir, device_map="cpu", dtype=dtype, attn_implementation="sdpa")
print(f"loaded in {time.time() - t0:.1f}s", flush=True)
for job in json.load(open(jobs_path, encoding="utf-8")):
    torch.manual_seed(job.get("seed", 1))
    t = time.time()
    wavs, sr = model.generate_custom_voice(
        text=job["text"], language="Chinese", speaker=job["speaker"], instruct=job.get("instruct", ""),
    )
    sf.write(job["out"], wavs[0], sr)
    print(f'{job["out"]}: {len(wavs[0]) / sr:.2f}s audio in {time.time() - t:.1f}s', flush=True)

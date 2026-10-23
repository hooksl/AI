# 配音

- 引擎：**Qwen3-TTS-12Hz-1.7B-CustomVoice**（通义千问开源 TTS，Apache-2.0，2026-01），本地 CPU 推理，约 4 倍实时。
- 音色：**Dylan**（年轻北京男声，清亮自然）；每句带一条语气指令（instruct）。
- 逐句的文本、语气指令、随机种子都在 `voiceover.json`，`tts.py` 读它生成 `assets/voice/<id>.wav`。
- 每句都用 Whisper small + large-v3 转写核对过，与原稿一致；收尾句换了 3 个种子，选了“九十九点九”最清楚的一条（seed 13）。

| id | 场景 | 文本 |
| --- | --- | --- |
| vo-hook | 钩子 | 一个班，二十三个人。有两个人同一天生日的概率，你猜有多大？ |
| vo-pairs | 连线 | 二十三个人两两配对，一共能凑出二百五十三对。每一对，都是一次撞生日的机会。 |
| vo-result | 结果 | 所以，至少有一对撞上的概率是——百分之五十点七。超过一半！ |
| vo-outro | 收尾 | 要是换成七十个人，这个数字是百分之九十九点九。你的直觉错了，这就是生日悖论。 |

## 重新生成

wav 不进 git（`*.wav` 被忽略），在项目目录里：

1. `uv venv -p 3.12 .venv && VIRTUAL_ENV=.venv uv pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu && VIRTUAL_ENV=.venv uv pip install qwen-tts soundfile huggingface_hub`
2. 下载模型（约 4.3 GB）：`.venv/bin/python -c "from huggingface_hub import snapshot_download as d; d('Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice', local_dir='<模型目录>')"`
3. `.venv/bin/python tts.py <模型目录> voiceover.json`
4. 每个文件做响度：`ffmpeg -i in.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 24000 out.wav`
5. 时长若有变化，改 `index.html` 里对应 `<audio>` 的 `data-duration`，并按新的停顿重新对齐各场景里的动画时间点。

## 备选音色

同一模型还试了 Uncle_Fu（低沉成熟男声，语速慢，全片会到 ~33 s）和 Serena（温柔女声）。换音色只需改 `voiceover.json` 的 `speaker`。

## 弃用

- 第一版用 Kokoro v1.1-zh（`zm_010`），用户反馈“太 AI”，已替换。
- HyperFrames 自带 `hyperframes tts`（Kokoro v1.0）中文发音不准；Edge TTS 需要 WebSocket，云环境代理不支持。

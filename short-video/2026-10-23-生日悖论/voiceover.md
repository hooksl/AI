# 配音稿（Kokoro v1.1-zh + misaki 中文音素，男声 zm_010，语速 1.1）

| id | 场景 | 文本 |
| --- | --- | --- |
| vo-hook | 钩子 | 一个班二十三人，有两人同一天生日，概率多大？ |
| vo-pairs | 连线 | 二十三个人两两配对，能凑出二百五十三对。每一对，都是一次撞生日的机会。 |
| vo-result | 结果 | 结果呢，至少撞上一次的概率是百分之五十点七，超过一半。 |
| vo-outro | 收尾 | 换成七十个人，就是百分之九十九点九。直觉错了，这就是生日悖论。 |

## 重新生成

wav 不进 git（`*.wav` 被忽略），按下面步骤重建到 `assets/voice/<id>.wav`：

1. `uv venv -p 3.12 .venv && VIRTUAL_ENV=.venv uv pip install kokoro-onnx soundfile "misaki[zh]>=0.9"`
   （misaki 0.9+ 才支持 v1.1 中文音素，要 Python ≤ 3.12）
2. 从 kokoro-onnx 的 `model-files-v1.1` release 下载 `kokoro-v1.1-zh.onnx`、`voices-v1.1-zh.bin` 到 `<模型目录>`
3. 每句：`.venv/bin/python tts.py <模型目录> zm_010 1.1 assets/voice/<id>.wav "<文本>"`
4. 响度：`ffmpeg -i in.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 24000 out.wav`
5. `index.html` 里每个 `<audio>` 的 `data-duration` 改成新文件的时长

说明：HyperFrames 自带 `hyperframes tts` 用的是 Kokoro v1.0，中文发音很差（“九十九点九”读不清），所以改用 v1.1-zh。
Edge TTS 需要 WebSocket，这个云环境的代理不支持。

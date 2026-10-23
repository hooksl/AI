# 视频生成工具

`make_video.py` 把一份脚本 JSON 生成竖屏 9:16（1080×1920）MP4：每句一段中文配音（edge-tts）+ 字幕画面 + 进度条。

```bash
pip install edge-tts
python3 short-video/tools/make_video.py short-video/<日期-主题>/script.json 输出.mp4
```

## 脚本格式

```json
{
  "title": "顶部标题",
  "theme": "dark | warm | fresh",
  "voice": "zh-CN-YunxiNeural",
  "rate": "+10%",
  "scenes": [
    {"heading": "画面中间的大字", "text": "这一段的口播文案，按句号、问号、感叹号自动切成字幕。"}
  ]
}
```

常用配音：`zh-CN-YunxiNeural`（男声）、`zh-CN-XiaoxiaoNeural`（女声）、`zh-CN-YunjianNeural`（浑厚男声）。

# 《星月夜的湍流》3D 版

three.js r158 + Canvas 2D 覆盖层，纯代码生成。`window.render(t)` 只由 t 决定画面。

| 文件 | 内容 |
| --- | --- |
| `core.js` | 渲染器、笔触系统（`V.Strokes` / `V.SkyStrokes`）、Canvas 贴图卡片、镜头注册与帧循环 |
| `world.js` | 程序化 3D 星月夜世界（天空漩涡、村庄、教堂、柏树、病房）+ 跟随相机的背景天幕 |
| `overlay.js` | 双语字幕、章节标签、标题卡、笔触扫屏转场、结尾卡 |
| `paint2d.js` | 平面版绘画工具（画廊里的画作贴图） |
| `shots/` | 11 个镜头，每个文件负责一个时间段 |
| `BRIEF.md` | 镜头搭建规范 |

```bash
# 浏览器预览：直接打开 index.html（?t=46 从第 46 秒开始）
# 静帧预览
python3 tools/preview.py index.html out/ 2 10 24 46
# 全片渲染（需要 playwright + chromium + ffmpeg；BGM 用 ../.claude/skills/vibe-knowledge-video/scripts/synth_bgm.py 合成）
python3 tools/render.py index.html 星月夜的湍流_3D.mp4 --bgm bgm.wav --workers 3
```

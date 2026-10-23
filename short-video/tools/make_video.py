#!/usr/bin/env python3
"""竖屏 9:16 短视频生成：脚本 JSON -> 配音 + 字幕画面 -> MP4。

用法：
    python3 make_video.py <script.json> <输出.mp4>

脚本 JSON 格式见 short-video/tools/README.md。
依赖：ffmpeg、pillow、edge-tts（pip install edge-tts）。
"""
import asyncio
import json
import os
import re
import subprocess
import sys
import tempfile

import certifi

# 云端环境走代理，edge-tts 固定用 certifi 的证书，这里改用代理证书
_PROXY_CA = "/root/.ccr/ca-bundle.crt"
if os.path.exists(_PROXY_CA):
    certifi.where = lambda: _PROXY_CA

import edge_tts  # noqa: E402
from PIL import Image, ImageDraw, ImageFont  # noqa: E402

W, H = 1080, 1920
FONT_PATH = "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"
DEFAULT_VOICE = "zh-CN-YunxiNeural"

THEMES = {
    "dark": {"bg": [(20, 24, 48), (64, 32, 96)], "fg": (255, 255, 255), "accent": (255, 204, 0)},
    "warm": {"bg": [(255, 140, 90), (230, 70, 110)], "fg": (255, 255, 255), "accent": (255, 240, 160)},
    "fresh": {"bg": [(30, 160, 140), (40, 90, 170)], "fg": (255, 255, 255), "accent": (255, 230, 120)},
}


def font(size):
    return ImageFont.truetype(FONT_PATH, size)


def split_sentences(text):
    parts = re.split(r"(?<=[。！？!?；;])", text.strip())
    return [p.strip() for p in parts if p.strip()]


def wrap(draw, text, fnt, max_w):
    lines, cur = [], ""
    for ch in text:
        if draw.textlength(cur + ch, font=fnt) > max_w and cur:
            lines.append(cur)
            cur = ch
        else:
            cur += ch
    if cur:
        lines.append(cur)
    return lines


def gradient(c1, c2):
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        t = y / (H - 1)
        row = tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))
        for x in range(W):
            px[x, y] = row
    return img


def draw_center(draw, lines, fnt, y, fill, spacing=1.35):
    size = fnt.size
    for i, line in enumerate(lines):
        w = draw.textlength(line, font=fnt)
        draw.text(((W - w) / 2, y + i * size * spacing), line, font=fnt, fill=fill)
    return y + len(lines) * size * spacing


def render_frame(bg, theme, title, heading, caption, progress, path):
    img = bg.copy()
    d = ImageDraw.Draw(img)
    fg, accent = theme["fg"], theme["accent"]

    # 顶部标题
    draw_center(d, wrap(d, title, font(64), W - 160), font(64), 200, accent)

    # 中间小节标题（大字）
    if heading:
        lines = wrap(d, heading, font(110), W - 160)
        h = len(lines) * 110 * 1.35
        draw_center(d, lines, font(110), (H - h) / 2 - 120, fg)

    # 底部字幕（带半透明底）
    lines = wrap(d, caption, font(58), W - 200)
    y0 = H - 560
    box_h = len(lines) * 58 * 1.4 + 60
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(overlay).rounded_rectangle(
        [70, y0 - 30, W - 70, y0 - 30 + box_h], radius=30, fill=(0, 0, 0, 120)
    )
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    d = ImageDraw.Draw(img)
    draw_center(d, lines, font(58), y0, fg, spacing=1.4)

    # 进度条
    d.rectangle([0, H - 12, W, H], fill=(255, 255, 255, 60))
    d.rectangle([0, H - 12, int(W * progress), H], fill=accent)
    img.save(path)


async def tts(text, voice, rate, path):
    await edge_tts.Communicate(text, voice, rate=rate).save(path)


def duration(path):
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]
    )
    return float(out)


def main(script_path, out_path):
    with open(script_path, encoding="utf-8") as f:
        spec = json.load(f)
    theme = THEMES[spec.get("theme", "dark")]
    voice = spec.get("voice", DEFAULT_VOICE)
    rate = spec.get("rate", "+10%")
    title = spec["title"]
    bg = gradient(*theme["bg"])

    # 每句一段：(小节标题, 字幕)
    segments = []
    for scene in spec["scenes"]:
        for sent in split_sentences(scene["text"]):
            segments.append((scene.get("heading", ""), sent))

    tmp = tempfile.mkdtemp(prefix="video_")
    clips = []
    for i, (heading, sent) in enumerate(segments):
        audio = os.path.join(tmp, f"{i:03d}.mp3")
        asyncio.run(tts(sent, voice, rate, audio))
        frame = os.path.join(tmp, f"{i:03d}.png")
        render_frame(bg, theme, title, heading, sent, (i + 1) / len(segments), frame)
        clip = os.path.join(tmp, f"{i:03d}.mp4")
        dur = duration(audio) + 0.25
        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-loop", "1", "-i", frame, "-i", audio,
             "-af", "apad", "-t", f"{dur:.3f}", "-r", "30",
             "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ar", "44100", "-ac", "2", clip],
            check=True,
        )
        clips.append(clip)
        print(f"[{i + 1}/{len(segments)}] {dur:.1f}s {sent}")

    lst = os.path.join(tmp, "list.txt")
    with open(lst, "w") as f:
        f.writelines(f"file '{c}'\n" for c in clips)
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst,
         "-c", "copy", "-movflags", "+faststart", out_path],
        check=True,
    )
    print(f"完成：{out_path}（{duration(out_path):.1f} 秒）")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])

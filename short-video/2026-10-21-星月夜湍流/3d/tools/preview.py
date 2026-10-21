#!/usr/bin/env python3
"""preview.py — 渲染指定时间点的静帧并拼成带时间戳的联系表
用法: python3 tools/preview.py index.html OUT_DIR 2 10.5 24 ...  [--sheet 2x3]
输出: OUT_DIR/t<秒>.png 与 OUT_DIR/sheet.jpg（每格 960 宽，左上角红字为时间）
页面 JS 报错会打印为 JSERR / CONSOLE.error 行——出现即视为 bug。"""
import asyncio, os, sys, subprocess
from playwright.async_api import async_playwright

def chromium_path():
    p = '/opt/pw-browsers/chromium'
    return p if os.path.exists(p) else None

async def main(html, out, times, sheet):
    os.makedirs(out, exist_ok=True)
    async with async_playwright() as p:
        kw = {'executable_path': chromium_path()} if chromium_path() else {}
        b = await p.chromium.launch(args=['--force-color-profile=srgb', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'], **kw)
        pg = await b.new_page(viewport={'width': 1920, 'height': 1080})
        pg.on('pageerror', lambda e: print('JSERR', e, flush=True))
        pg.on('console', lambda m: (m.type == 'error') and print('CONSOLE.error', m.text[:300], flush=True))
        await pg.goto('file://' + os.path.abspath(html))
        await pg.evaluate("new Promise(r => window.setup(r))")
        await pg.evaluate("window.__RENDER_MODE__ = true")
        files = []
        for t in times:
            await pg.evaluate(f"window.render({t})")
            f = os.path.join(out, f"t{t:07.2f}.png"); files.append(f)
            await pg.screenshot(path=f)
        await b.close()
    cols, rows = map(int, sheet.split('x'))
    ins = []
    for f in files: ins += ['-i', f]
    n = len(files)
    filt = ''.join(f"[{i}:v]scale=960:-1,drawtext=text='{os.path.basename(f)[1:-4]}s':x=8:y=8:fontsize=30:fontcolor=red:box=1:boxcolor=black@0.6[v{i}];" for i, f in enumerate(files))
    pad = cols*rows - n
    filt += ''.join(f"[v{i}]" for i in range(n))
    if pad > 0:
        filt = filt.replace(f"[v{n-1}]", f"[v{n-1}]", 1)
        filt += ''.join(f"[b{j}]" for j in range(pad))
        filt = ''.join(f"color=black:s=960x540:d=1[b{j}];" for j in range(pad)) + filt
    filt += f"xstack=inputs={cols*rows}:layout=" + '|'.join(f"{(k%cols)*960}_{(k//cols)*540}" for k in range(cols*rows)) + "[out]"
    if n == 1:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', files[0], '-vf', "scale=960:-1", os.path.join(out, 'sheet.jpg')])
    else:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', filt, '-map', '[out]', '-frames:v', '1', os.path.join(out, 'sheet.jpg')])
    print('sheet:', os.path.join(out, 'sheet.jpg'))

if __name__ == '__main__':
    args = sys.argv[1:]
    sheet = '2x3'
    if '--sheet' in args:
        i = args.index('--sheet'); sheet = args[i+1]; del args[i:i+2]
    html, out, *ts = args
    times = [float(x) for x in ts]
    c, r = map(int, sheet.split('x'))
    if len(times) > c*r:
        r = (len(times) + c - 1)//c; sheet = f"{c}x{r}"
    asyncio.run(main(html, out, times, sheet))

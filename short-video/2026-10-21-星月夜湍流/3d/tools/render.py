#!/usr/bin/env python3
"""render.py — 全片渲染：N 个无头浏览器并行逐帧渲染（JPEG 直接管道进 ffmpeg，不落地 PNG）→ 拼接 → 混入 BGM
用法: python3 tools/render.py index.html OUT.mp4 --bgm bgm.wav [--workers 3] [--duration 140] [--fps 30]"""
import argparse, asyncio, os, subprocess, sys, tempfile

async def worker(html, out, f0, f1, fps):
    ff = subprocess.Popen(['ffmpeg','-y','-v','error','-f','image2pipe','-framerate',str(fps),'-c:v','mjpeg','-i','-',
                           '-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p', out], stdin=subprocess.PIPE)
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        kw = {'executable_path': '/opt/pw-browsers/chromium'} if os.path.exists('/opt/pw-browsers/chromium') else {}
        b = await p.chromium.launch(args=['--force-color-profile=srgb','--use-angle=swiftshader','--enable-unsafe-swiftshader'], **kw)
        pg = await b.new_page(viewport={'width':1920,'height':1080})
        pg.on('pageerror', lambda e: print('JSERR', e, flush=True))
        await pg.goto('file://'+os.path.abspath(html))
        await pg.evaluate("new Promise(r=>window.setup(r))")
        await pg.evaluate("window.__RENDER_MODE__=true")
        for fi in range(f0, f1):
            await pg.evaluate(f"window.render({fi/fps})")
            ff.stdin.write(await pg.screenshot(type='jpeg', quality=95))
            if (fi-f0) % 300 == 0: print(f'{os.path.basename(out)}: {fi-f0}/{f1-f0}', flush=True)
        await b.close()
    ff.stdin.close(); ff.wait()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('html'); ap.add_argument('out')
    ap.add_argument('--bgm', required=True); ap.add_argument('--workers', type=int, default=3)
    ap.add_argument('--duration', type=float, default=140); ap.add_argument('--fps', type=int, default=30)
    a = ap.parse_args()
    total = int(a.duration*a.fps); tmp = tempfile.mkdtemp(prefix='render_', dir=os.path.dirname(os.path.abspath(a.out)))
    segs = []; step = (total + a.workers - 1)//a.workers
    for i in range(a.workers):
        f0, f1 = i*step, min(total, (i+1)*step)
        segs.append((os.path.join(tmp, f'seg{i}.mp4'), f0, f1))
    async def run_all(): await asyncio.gather(*[worker(a.html, s, f0, f1, a.fps) for s, f0, f1 in segs])
    asyncio.run(run_all())
    lst = os.path.join(tmp, 'list.txt')
    open(lst,'w').write(''.join(f"file '{s}'\n" for s,_,_ in segs))
    silent = os.path.join(tmp, 'silent.mp4'); norm = os.path.join(tmp, 'bgm_norm.wav')
    subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',lst,'-c','copy',silent], check=True)
    subprocess.run(['ffmpeg','-v','error','-y','-i',a.bgm,'-af',f"loudnorm=I=-15:TP=-3:LRA=11,aresample=44100,alimiter=limit=0.7:level=false,afade=t=out:st={a.duration-2.5}:d=2.5",'-ar','44100',norm], check=True)
    subprocess.run(['ffmpeg','-v','error','-y','-i',silent,'-i',norm,'-c:v','copy','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',a.out], check=True)
    print('→', a.out, '（临时文件在', tmp, '）')

if __name__ == '__main__':
    main()

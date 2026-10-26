# 飞翼掠影：把静态图做成 10 秒无缝循环的动态视频
# 依赖 tools/segment.py、tools/prep.py 的产物（render/ 下）
# 用法：
#   python3 tools/render.py                      → render/飞翼掠影.mp4
#   python3 tools/render.py --stills 0 75 150    → 只出这几帧的 PNG，用来检查
import argparse, subprocess, numpy as np, cv2
from scipy.ndimage import gaussian_filter

FPS, DUR = 30, 10.0
NF = int(FPS * DUR)            # 300 帧，首尾无缝
PERIOD = 12                    # 流图一个周期的帧数（必须整除 NF）
OUT_W, OUT_H = 1080, 1440      # 3:4，和原图同比例

img = cv2.imread('assets/source.jpg').astype(np.float32) / 255
H, W = img.shape[:2]
plate = np.load('render/plate.npy')
matte = cv2.imread('render/matte.png', 0).astype(np.float32) / 255
wm_a = cv2.imread('render/wm_alpha.png', 0).astype(np.float32) / 255
tx, ty = np.load('render/tangent.npy')
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
TAU = 2 * np.pi
def osc(t, cycles, phase=0.0):  # 一个循环里转整数圈的正弦，保证首尾衔接
    return np.sin(TAU * cycles * t / DUR + phase)

# ───────────── 地表：沿条纹方向流动 ─────────────
# 速度：近处（画面下方）快，远处慢；飞翼附近约 215 px/s
speed = 230 * (0.55 + 0.70 * yy / H)
vx, vy = tx * speed, ty * speed
def sample(a, mx, my, interp=cv2.INTER_LINEAR):
    return cv2.remap(a, mx.astype(np.float32, copy=False), my.astype(np.float32, copy=False), interp, borderMode=cv2.BORDER_REFLECT)
# 逆着流线回溯：U[k] 是「k 帧前在哪里的地表，此刻流到了这个像素」，RK2 积分
dt = (PERIOD / FPS) / PERIOD
U = np.empty((PERIOD + 1, H, W, 2), np.float32)
px, py = xx.copy(), yy.copy()
U[0, ..., 0], U[0, ..., 1] = px, py
for k in range(1, PERIOD + 1):
    ax, ay = sample(vx, px, py), sample(vy, px, py)
    mx, my = px - 0.5 * dt * ax, py - 0.5 * dt * ay
    px, py = px - dt * sample(vx, mx, my), py - dt * sample(vy, mx, my)
    U[k, ..., 0], U[k, ..., 1] = px, py
# 每个像素的相位错开（低频噪声），两层交叉淡化的「呼吸」不会全画面同步
rng = np.random.default_rng(3)
PH_STD, PH_SIGMA = 0.0, 150
ph = gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), PH_SIGMA)
ph = (ph - ph.mean()) / ph.std() * PH_STD
low = cv2.GaussianBlur(plate, (0, 0), 4)
IY, IX = np.mgrid[0:H, 0:W]

def ground(f):
    acc_low = np.zeros_like(plate); acc_hi = np.zeros_like(plate); wsq = np.zeros((H, W), np.float32)
    for layer in (0.0, 0.5):
        s = np.mod(f / PERIOD + ph + layer, 1.0)
        kf = s * PERIOD; k0 = np.minimum(kf.astype(np.int32), PERIOD - 1); a = (kf - k0)[..., None]
        pos = U[k0, IY, IX] * (1 - a) + U[k0 + 1, IY, IX] * a
        mx, my = np.ascontiguousarray(pos[..., 0]), np.ascontiguousarray(pos[..., 1])
        w = 1 - np.abs(2 * s - 1)
        A, L = sample(plate, mx, my), sample(low, mx, my)
        acc_low += w[..., None] * L; acc_hi += w[..., None] * (A - L); wsq += w * w
    # 高频部分按权重保方差，交叉淡化处不发灰
    return acc_low + acc_hi / np.sqrt(wsq)[..., None] ** 0.63

# ───────────── 尾喷口热浪 ─────────────
NOZ = np.array([401.0, 951.0]); AX = np.array([-0.55, 0.835])      # 喷口位置、喷流方向（朝左下）
PERP = np.array([AX[1], -AX[0]])
du = (xx - NOZ[0]) * AX[0] + (yy - NOZ[1]) * AX[1]                  # 沿喷流距离
dv = (xx - NOZ[0]) * PERP[0] + (yy - NOZ[1]) * PERP[1]
width = 10 + 0.28 * np.maximum(du, 0)
haze_amp = np.clip(du / 12, 0, 1) * np.exp(-np.maximum(du, 0) / 170) * np.exp(-(dv / width) ** 2)
haze_amp = haze_amp.astype(np.float32)

def haze(t):
    ph1 = 0.11 * du - TAU * 23 * t / DUR + 0.05 * dv
    ph2 = 0.07 * du - TAU * 17 * t / DUR - 0.09 * dv + 1.3
    ph3 = 0.16 * du - TAU * 31 * t / DUR + 0.13 * dv + 2.1
    ox = (np.sin(ph1) + 0.6 * np.sin(ph3)) * 1.6 * haze_amp
    oy = (np.sin(ph2) + 0.5 * np.cos(ph3)) * 1.6 * haze_amp
    return ox.astype(np.float32), oy.astype(np.float32)

# ───────────── 飞翼 ─────────────
C = np.array([500.0, 800.0])                       # 飞翼中心
NOSE = np.array([0.60, -0.80])                      # 机头朝向（尾 → 头）
SIDE = np.array([0.80, 0.60])
hull = img.copy()
hlum = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
spec = np.clip((hlum - 0.28) / 0.40, 0, 1) ** 1.5 * matte    # 越亮的曲面反光越强
hu = (xx - C[0]) * NOSE[0] + (yy - C[1]) * NOSE[1]
hs = (xx - C[0]) * SIDE[0] + (yy - C[1]) * SIDE[1]
ys_, xs_ = np.nonzero(matte > 0)
BX0, BY0, BX1, BY1 = xs_.min() - 20, ys_.min() - 20, xs_.max() + 20, ys_.max() + 20

def smoothstep(e0, e1, x):
    x = np.clip((x - e0) / (e1 - e0), 0, 1); return x * x * (3 - 2 * x)

def aircraft(t):
    """返回（预乘颜色, alpha），都在原图坐标系"""
    roll = osc(t, 1, 0.4)
    # 机身打光：随「滚转」左右明暗轻轻交替；一道反光在 2–6 s 从机头扫到机尾
    shade = 1 + 0.045 * roll * np.clip(hs / 380, -1, 1)
    sweep = smoothstep(0.15, 0.62, t / DUR)
    u0 = 380 - 760 * sweep
    on = smoothstep(0.12, 0.2, t / DUR) * (1 - smoothstep(0.55, 0.63, t / DUR))
    band = np.exp(-((hu - u0) / 55) ** 2) * on
    col = hull * shade[..., None] + (0.16 * band * (0.25 + spec))[..., None] * np.array([1.0, 0.98, 0.94], np.float32)
    col = np.clip(col, 0, 1)
    # 位置：上下起伏 + 左右漂移 + 轻微偏航；升高时略放大
    dx = 3.0 * osc(t, 1, 0.3) + 1.0 * osc(t, 3, 1.1)
    dy = 3.5 * osc(t, 2, 0.0) + 0.8 * osc(t, 5, 2.0)
    ang = 0.55 * roll + 0.15 * osc(t, 3, 0.7)
    sc = 1 + 0.006 * osc(t, 2, 0.0 + np.pi)
    M = cv2.getRotationMatrix2D((float(C[0]), float(C[1])), ang, sc)
    M[:, 2] += (dx, dy)
    pre = col * matte[..., None]
    sub = np.s_[BY0:BY1, BX0:BX1]
    Ms = M.copy(); Ms[:, 2] += M[:, :2] @ np.array([BX0, BY0]) - np.array([BX0, BY0])  # 只变换飞翼所在的框
    out_c = np.zeros_like(img); out_a = np.zeros((H, W), np.float32)
    bw, bh = BX1 - BX0, BY1 - BY0
    out_c[sub] = cv2.warpAffine(np.ascontiguousarray(pre[sub]), Ms, (bw, bh), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT)
    out_a[sub] = cv2.warpAffine(np.ascontiguousarray(matte[sub]), Ms, (bw, bh), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT)
    return np.clip(out_c, 0, 1), np.clip(out_a, 0, 1)

# ───────────── 镜头 ─────────────
BASE = OUT_W / W
ocx, ocy = OUT_W / 2, OUT_H / 2
vign = None
def camera(t):
    z = 1.045 + 0.012 * (0.5 - 0.5 * osc(t, 1, np.pi / 2))
    sx = 1.3 * osc(t, 3, 0.2) + 0.6 * osc(t, 7, 1.7)
    sy = 1.1 * osc(t, 2, 1.0) + 0.5 * osc(t, 5, 0.4)
    rot = 0.12 * osc(t, 1, 2.2)
    M = cv2.getRotationMatrix2D((W / 2, H / 2), rot, BASE * z)
    M[:, 2] += (ocx - W / 2, ocy - H / 2)
    M[:, 2] += (sx, sy)
    return M

def frame(f, grain_rng):
    t = f / FPS
    g = ground(f)
    hx, hy = haze(t)
    g = sample(g, xx + hx, yy + hy)
    ac, aa = aircraft(t)
    scene = g * (1 - aa[..., None]) + ac
    out = cv2.warpAffine(scene, camera(t), (OUT_W, OUT_H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    # 水印：原样、固定在屏幕原位置
    out = out * (1 - WA[..., None]) + WC * WA[..., None]
    out = out * VIGN[..., None]
    out += grain_rng.standard_normal((OUT_H, OUT_W, 1)).astype(np.float32) * 0.006
    return np.clip(out * 255 + 0.5, 0, 255).astype(np.uint8)

oy_, ox_ = np.mgrid[0:OUT_H, 0:OUT_W].astype(np.float32)
r2 = ((ox_ - ocx) / (OUT_W * 0.62)) ** 2 + ((oy_ - ocy) / (OUT_H * 0.62)) ** 2
VIGN = (1 - 0.18 * smoothstep(0.35, 1.25, r2)).astype(np.float32)
_Mw = np.array([[BASE, 0, 0], [0, BASE, 0]], np.float32)
WA = cv2.warpAffine(wm_a, _Mw, (OUT_W, OUT_H), flags=cv2.INTER_LINEAR)
WC = cv2.warpAffine(img, _Mw, (OUT_W, OUT_H), flags=cv2.INTER_LINEAR)

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--stills', type=int, nargs='*')
    ap.add_argument('--out', default='render/飞翼掠影_silent.mp4')
    ap.add_argument('--crf', default='17')
    a = ap.parse_args()
    grng = np.random.default_rng(11)
    if a.stills is not None:
        for f in a.stills:
            cv2.imwrite(f'render/still_{f:03d}.png', frame(f, grng))
    else:
        cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{OUT_W}x{OUT_H}',
               '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', a.crf, '-pix_fmt', 'yuv420p',
               '-movflags', '+faststart', a.out]
        p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        for f in range(NF):
            p.stdin.write(frame(f, grng).tobytes())
            if f % 30 == 0: print('frame', f, flush=True)
        p.stdin.close(); p.wait()
        print('done', a.out)

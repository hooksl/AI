# 预处理：条纹方向场、去掉飞翼和水印后的地表底板、水印图层
# 产物都在 render/（不进 git）
import numpy as np, cv2
from scipy.ndimage import gaussian_filter

img = cv2.imread('assets/source.jpg').astype(np.float32) / 255
H, W = img.shape[:2]
matte = cv2.imread('render/matte.png', 0).astype(np.float32) / 255
k = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2*r+1, 2*r+1))

# —— 水印：右下角的「小红书」徽标 + 「小红书号: …」文字。原样保留，最后静态叠回画面 ——
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
wm = np.zeros((H, W), np.float32)
x0, y0, x1, y1 = 742, 1316, 998, 1345                                   # 文字：按亮度抠
roi = gray[y0:y1, x0:x1]
bg = cv2.medianBlur((roi*255).astype(np.uint8), 15).astype(np.float32)/255
wm[y0:y1, x0:x1] = np.clip((roi - bg - 0.10) / 0.40, 0, 1)
S = 8                                                                   # 徽标：圆角胶囊整块不透明
pill = np.zeros((H*S, W*S), np.uint8)
bx0, by0, bx1, by1, r = 920, 1272, 991, 1303, 15.5
cv2.rectangle(pill, (int((bx0+r)*S), int(by0*S)), (int((bx1-r)*S), int(by1*S)), 255, -1)
for cx in (bx0+r, bx1-r):
    cv2.circle(pill, (int(cx*S), int((by0+by1)/2*S)), int(r*S), 255, -1)
pill = cv2.resize(pill, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32)/255
wm = np.maximum(wm, pill)
cv2.imwrite('render/wm_alpha.png', (wm*255).astype(np.uint8))

# —— 需要补的区域：飞翼（外扩，防止机身边缘的深色被带进流动的地表）+ 水印 ——
hole = (cv2.dilate((matte > 0.02).astype(np.uint8), k(5)) > 0) | (cv2.dilate((wm > 0.03).astype(np.uint8), k(6)) > 0)
holef = hole.astype(np.float32)

# —— 方向场：先模糊到条纹尺度（压掉 JPEG 噪点的横竖偏向），只用地表像素做加权结构张量 ——
g3 = gaussian_filter(gray, 3)
gx = cv2.Sobel(g3, cv2.CV_32F, 1, 0, ksize=3); gy = cv2.Sobel(g3, cv2.CV_32F, 0, 1, ksize=3)
wgt = 1 - (cv2.dilate(hole.astype(np.uint8), k(10)) > 0).astype(np.float32)   # 洞外再让出一圈：文字/机身边缘的残余梯度会把方向带偏
def nblur(a, s, w=wgt):
    return gaussian_filter(a*w, s) / (gaussian_filter(w, s) + 1e-12)
s = 14
Jxx, Jyy, Jxy = nblur(gx*gx, s), nblur(gy*gy, s), nblur(gx*gy, s)
m = wgt < 0.5
for big in (40, 90):                          # 洞里用更大尺度补满
    for J, a in ((Jxx, gx*gx), (Jyy, gy*gy), (Jxy, gx*gy)):
        J[m] = nblur(a, big)[m]
c2, s2 = Jxx - Jyy, 2*Jxy
n = np.sqrt(c2**2 + s2**2) + 1e-12
c2, s2 = gaussian_filter(c2/n, 4), gaussian_filter(s2/n, 4)
theta = 0.5*np.arctan2(s2, c2) + np.pi/2          # 条纹切向
tx, ty = np.cos(theta).astype(np.float32), np.sin(theta).astype(np.float32)
# 统一朝向：飞翼朝右上飞，地表朝左下（往后）流
flip = (-tx + ty) < 0
tx[flip] *= -1; ty[flip] *= -1
np.save('render/tangent.npy', np.stack([tx, ty]))

# —— 沿条纹补洞 ——
# 低频：沿切线两头走出洞，取洞外的（模糊后）颜色按距离插值；
# 高频：再往外走同样的距离取镜像位置的颗粒，两边按权重混合并保方差，避免中段糊成一片。
low = cv2.GaussianBlur(img, (0, 0), 2.5)
high = img - low
ys, xs = np.nonzero(hole)
N = len(xs)
def sample(a, px, py):                         # 在任意点列上双线性取样（remap 要求宽 < 32767，折成二维）
    n = len(px); pad = (-n) % 1024
    mx = np.pad(px, (0, pad)).reshape(-1, 1024).astype(np.float32)
    my = np.pad(py, (0, pad)).reshape(-1, 1024).astype(np.float32)
    return cv2.remap(a, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT).reshape(-1, a.shape[2])[:n]
def march(sign, maxstep=700):
    px, py = xs.astype(np.float32), ys.astype(np.float32)
    exit_step = np.full(N, -1); ex = np.zeros(N, np.float32); ey = np.zeros(N, np.float32)
    mx = np.zeros(N, np.float32); my = np.zeros(N, np.float32); mdone = np.zeros(N, bool)
    for step in range(1, 2*maxstep):
        ix = np.clip(np.round(px).astype(int), 0, W-1); iy = np.clip(np.round(py).astype(int), 0, H-1)
        px = np.clip(px + sign*tx[iy, ix], 0, W-1); py = np.clip(py + sign*ty[iy, ix], 0, H-1)
        ix = np.clip(np.round(px).astype(int), 0, W-1); iy = np.clip(np.round(py).astype(int), 0, H-1)
        new = (exit_step < 0) & ~hole[iy, ix]
        exit_step[new] = step; ex[new] = px[new]; ey[new] = py[new]
        ref = (exit_step > 0) & ~mdone & ((step >= 2*exit_step) | hole[iy, ix])  # 镜像点（碰到别的洞就停在这）
        mx[ref] = px[ref]; my[ref] = py[ref]; mdone |= ref
        if mdone.all() or (step >= maxstep and (exit_step < 0).all()): break
    bad = exit_step < 0
    exit_step[bad] = 2*maxstep; mx[~mdone] = ex[~mdone]; my[~mdone] = ey[~mdone]
    return exit_step.astype(np.float32), sample(low, ex, ey), sample(high, mx, my)
da, la, ha = march(+1)
db, lb, hb = march(-1)
wa, wb = (db/(da+db))[:, None], (da/(da+db))[:, None]
fill = wa*la + wb*lb + (wa*ha + wb*hb) / np.sqrt(wa**2 + wb**2)
plate = img.copy(); plate[ys, xs] = fill
plate = np.clip(plate, 0, 1)
cv2.imwrite('render/plate.png', (plate*255+0.5).astype(np.uint8))
np.save('render/plate.npy', plate.astype(np.float32))
print('hole px', N)

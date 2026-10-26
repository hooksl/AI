# 抠出飞翼：手画粗轮廓 + GrabCut 细化，输出 render/matte.png（0-255）
import numpy as np, cv2
img = cv2.imread('assets/source.jpg')
H, W = img.shape[:2]
poly = np.array([(104,815),(130,782),(230,760),(360,731),(450,695),(500,662),(550,622),(615,608),
    (645,613),(657,640),(661,700),(672,742),(750,825),(860,932),(865,950),(850,984),(800,962),
    (665,897),(510,922),(450,948),(430,957),(400,948),(393,925),(360,842),(315,812),(300,808),
    (180,822),(107,824)], np.int32)
rough = np.zeros((H,W), np.uint8); cv2.fillPoly(rough, [poly], 255)
k = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2*r+1, 2*r+1))
mask = np.full((H,W), cv2.GC_BGD, np.uint8)
mask[cv2.dilate(rough, k(22)) > 0] = cv2.GC_PR_BGD
mask[rough > 0] = cv2.GC_PR_FGD
mask[cv2.erode(rough, k(14)) > 0] = cv2.GC_FGD
bgd = np.zeros((1,65)); fgd = np.zeros((1,65))
cv2.grabCut(img, mask, None, bgd, fgd, 8, cv2.GC_INIT_WITH_MASK)
fg = np.where((mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
# 只留最大连通块、补洞
n, lab, st, _ = cv2.connectedComponentsWithStats(fg)
fg = np.where(lab == 1+np.argmax(st[1:,cv2.CC_STAT_AREA]), 255, 0).astype(np.uint8)
inv = 255-fg; n, lab, st, _ = cv2.connectedComponentsWithStats(inv)
for i in range(1,n):
    if st[i,cv2.CC_STAT_AREA] < 3000: fg[lab==i] = 255
cv2.imwrite('render/matte_hard.png', fg); cv2.imwrite('render/rough.png', rough)
vis = img.copy()
cnt,_ = cv2.findContours(fg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
cv2.drawContours(vis, cnt, -1, (0,0,255), 1)
cv2.polylines(vis, [poly], True, (0,255,0), 1)
cv2.imwrite('render/seg_l.png', cv2.resize(vis[600:1000, 80:500], None, fx=2, fy=2))
cv2.imwrite('render/seg_r.png', cv2.resize(vis[600:1000, 450:900], None, fx=2, fy=2))

# —— 细化：左半边深色机身补进来，再把轮廓做高斯平滑，去掉 GrabCut 的锯齿 ——
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
near = cv2.dilate(fg, k(6)) > 0
dark = (gray < 80) & near
dark[:, 640:] = False
fg2 = np.where((fg > 0) | dark, 255, 0).astype(np.uint8)
fg2 = cv2.morphologyEx(fg2, cv2.MORPH_OPEN, k(1))
cnt, _ = cv2.findContours(fg2, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
c = max(cnt, key=cv2.contourArea)[:, 0, :].astype(np.float64)
from scipy.ndimage import gaussian_filter1d
cs = np.stack([gaussian_filter1d(c[:, 0], 2.5, mode='wrap'), gaussian_filter1d(c[:, 1], 2.5, mode='wrap')], 1)
# 8 倍超采样填充，得到抗锯齿的软边
S = 8
big = np.zeros((H*S, W*S), np.uint8)
cv2.fillPoly(big, [np.round((cs + 0.5) * S).astype(np.int32)], 255)
soft = cv2.resize(big, (W, H), interpolation=cv2.INTER_AREA)
cv2.imwrite('render/matte.png', soft)
vis = img.copy()
cv2.polylines(vis, [np.round(cs).astype(np.int32)], True, (0,0,255), 1)
cv2.imwrite('render/seg2_l.png', cv2.resize(vis[600:1000, 80:500], None, fx=2, fy=2))
cv2.imwrite('render/seg2_r.png', cv2.resize(vis[600:1000, 450:900], None, fx=2, fy=2))

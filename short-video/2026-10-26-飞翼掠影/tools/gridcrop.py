# 带坐标网格的放大裁切，用来手工读轮廓坐标
import sys, cv2
img = cv2.imread('assets/source.jpg'); hard = cv2.imread('render/matte_hard.png', 0)
x0,y0,x1,y1,s,out = int(sys.argv[1]),int(sys.argv[2]),int(sys.argv[3]),int(sys.argv[4]),int(sys.argv[5]),sys.argv[6]
c = cv2.resize(img[y0:y1, x0:x1], None, fx=s, fy=s, interpolation=cv2.INTER_NEAREST)
cnt,_ = cv2.findContours(cv2.resize(hard[y0:y1,x0:x1],None,fx=s,fy=s,interpolation=cv2.INTER_NEAREST), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
cv2.drawContours(c, cnt, -1, (0,0,255), 1)
for gx in range((x0//20+1)*20, x1, 20):
    cv2.line(c, ((gx-x0)*s,0), ((gx-x0)*s,c.shape[0]), (0,255,255) if gx%100==0 else (0,140,140), 1)
    cv2.putText(c, str(gx), ((gx-x0)*s+2, 12), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0,255,255), 1)
for gy in range((y0//20+1)*20, y1, 20):
    cv2.line(c, (0,(gy-y0)*s), (c.shape[1],(gy-y0)*s), (0,255,255) if gy%100==0 else (0,140,140), 1)
    cv2.putText(c, str(gy), (2,(gy-y0)*s-2), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0,255,255), 1)
cv2.imwrite(out, c)

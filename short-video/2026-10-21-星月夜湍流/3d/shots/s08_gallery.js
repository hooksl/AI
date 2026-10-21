/* s08_gallery · 71–83s · 2006 对照（非世界镜头）
   71–75    2006 年论文首页（细分网格、随风起伏的纸）漂在星空里，镜头从左前方掠到右侧；72.6s 盖红印「湍流的亮度」。
            74.0s 起纸被风卷向左上方飞走，镜头向前穿过它原来的位置，后方的"漂浮画廊"露出来。
   74.6–83  两幅带立体金框（倒角挤出的盒体 + 笔触金箔贴图 + 灯光高光）的画分处不同深度：
            左《星月夜》（drawStarry 画进贴图，每 1/15 s 重画，笔触持续流动；74.6s 起逐笔画出），
                 画框四周有一圈"溢出画外"的旋转笔触；
            右 自画像（drawPortrait + 采样上色的笔触肌理层，78.8–79.8s 升起并逐笔画出），四周只有平静漂移的稀疏笔触。
            每幅画下方一块向上倾斜的统计板：标签 + drawFit（金虚线理论 vs 白线数据）+ 判定
                 （77.4s 金色 ✓ 符合 / 81.2s #E07A6A ✗ 不符合）。
            镜头先在左画前缓慢下移到统计板，78.4s 起沿弧线绕向右画（左画框在前景快速掠过，右画在中景），最后继续横向弧线漂移。
   画框与统计板入场时整体淡入（74.4–74.85 / 78.6–79.05）；画面注释由本镜头在覆盖层自绘：论文段与画廊段分别注释，74.3–75.35 交叉淡换。 */
(function(){
const { E, P, lerp, clamp, easeOut, easeIn, smooth } = V;
const SANS = V.FONT.SANS, GARA = V.FONT.GARA;
const GOLD = V.COL.gold, BAD = '#E07A6A', INK = '#2a2218';

const PW = 30, PH = 12.6, PCW = 2000, PCH = 840;              // 论文纸（世界单位 / 贴图像素）
const PC = V.v3(-1, 3.5, 14);                                   // 纸的中心
const LP = V.v3(-12, 2, -30), RP = V.v3(16, 2, -52);            // 左 / 右画中心
const LYAW = 0.25, RYAW = -0.34;                                // 两幅画略微相向
const SW = 14, SH = 11.2, QW = 9.9, QH = 11.2;                  // 画面：星月夜 / 自画像
const BW = 18, BH = 4.4, BY = -SH/2 - 3.1, BZ = 4.5;             // 统计板（浮在画框下沿前方）

/* 相机关键帧（C1 连续：Catmull-Rom 切线 + Hermite），经过关键帧时速度不为零 */
const CAM = [
  // t      pos                   target                fov
  [70.6, [-18.5, 7.0, 42.0], [-1.6, 1.6, 14.0], 46],
  [72.4, [ -8.0, 5.6, 43.0], [-1.0, 1.8, 14.0], 46],
  [73.9, [  3.0, 4.2, 38.8], [-0.6, 1.2, 13.0], 46],
  [74.9, [  3.0, 3.0, 27.0], [-6.5, -0.4, -14.0], 48],
  [76.0, [ -0.2, 1.4, 14.2], [-11.0, -4.0, -30.0], 50],
  [77.3, [ -2.4, 0.6, 11.2], [-11.6, -4.3, -30.0], 50],
  [78.4, [ -4.4, 0.0,  8.8], [-11.3, -4.3, -30.0], 50],
  [79.6, [ -1.6, 0.5, -1.2], [  4.0, -3.8, -44.0], 50],
  [80.8, [  1.3, 0.5, -11.6], [14.4, -4.1, -52.0], 50],
  [82.0, [  3.0, 0.3, -14.4], [15.1, -4.2, -52.0], 50],
  [83.4, [  5.6, 0.8, -14.6], [15.6, -4.0, -52.0], 50],   // 结尾继续横向弧线漂移，避免最后 1.5 秒近乎静止
];
function herm(keys, t, idx){
  const n = keys.length, g = (k) => keys[k][idx];
  if (t <= keys[0][0]) return [].concat(g(0));
  if (t >= keys[n-1][0]) return [].concat(g(n-1));
  let i = 0; while (t > keys[i+1][0]) i++;
  const arr = k => [].concat(g(k));
  const tan = j => { const a = Math.max(0, j-1), b = Math.min(n-1, j+1); const A = arr(a), B = arr(b); return A.map((x, d) => (B[d] - x)/(keys[b][0] - keys[a][0])); };
  const t0 = keys[i][0], t1 = keys[i+1][0], p0 = arr(i), p1 = arr(i+1), m0 = tan(i), m1 = tan(i+1);
  const h = t1 - t0, s = (t - t0)/h, s2 = s*s, s3 = s2*s;
  const h00 = 2*s3 - 3*s2 + 1, h10 = s3 - 2*s2 + s, h01 = -2*s3 + 3*s2, h11 = s3 - s2;
  return p0.map((x, d) => h00*x + h10*h*m0[d] + h01*p1[d] + h11*h*m1[d]);
}
const camPos = t => { const p = herm(CAM, t, 1); return V.v3(p[0] + 0.25*Math.sin(t*0.9), p[1] + 0.18*Math.sin(t*0.7 + 1), p[2]); };
const camTgt = t => { const p = herm(CAM, t, 2); return V.v3(p[0], p[1], p[2]); };
const camFov = t => herm(CAM, t, 3)[0];

/* 与 V.card 相同，但画布强制走软件光栅（willReadFrequently）：
   频繁重画的卡片若被浏览器按"历史"切换到 GPU 加速，阴影/抗锯齿会有细微像素差，破坏确定性 */
function softCard(o){
  const W = o.px, H = Math.round(o.px*o.h/o.w);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d', { willReadFrequently: true });
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: o.doubleSide === false ? THREE.FrontSide : THREE.DoubleSide, depthWrite: o.depthWrite ?? true, fog: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.h), mat);
  const api = { mesh, canvas: cv, ctx: c, W, H, tex,
    redraw(t){ c.clearRect(0, 0, W, H); o.draw(c, W, H, t); tex.needsUpdate = true; },
    set opacity(v){ mat.opacity = v; mesh.visible = v > 0.002; } };
  api.redraw(0);
  return api;
}

/* 软件光栅的离屏画布（作为 drawImage 来源时，GPU 画布会让目标画布切换光栅路径，产生历史相关的像素差） */
function softCanvas(w, h){ const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d', { willReadFrequently: true }); return cv; }

/* ---------- 2D 小工具 ---------- */
function drawMark(c, x, y, s, col, k, cross){                   // 笔刷感的 ✓ / ✗，按进度 k 画出
  if (k <= 0) return;
  c.save(); c.strokeStyle = col; c.lineWidth = s*0.17; c.lineCap = 'round'; c.lineJoin = 'round';
  c.shadowColor = col; c.shadowBlur = s*0.18;
  if (!cross){
    const a = [x - s*0.42, y + s*0.02], b = [x - s*0.12, y + s*0.34], d = [x + s*0.46, y - s*0.40];
    const L1 = Math.hypot(b[0]-a[0], b[1]-a[1]), L2 = Math.hypot(d[0]-b[0], d[1]-b[1]), q = k*(L1 + L2);
    c.beginPath(); c.moveTo(a[0], a[1]);
    if (q <= L1) c.lineTo(a[0] + (b[0]-a[0])*q/L1, a[1] + (b[1]-a[1])*q/L1);
    else { c.lineTo(b[0], b[1]); const r = (q - L1)/L2; c.lineTo(b[0] + (d[0]-b[0])*r, b[1] + (d[1]-b[1])*r); }
    c.stroke();
  } else {
    const r = s*0.36, k1 = clamp(k*2, 0, 1), k2 = clamp(k*2 - 1, 0, 1);
    c.beginPath(); c.moveTo(x - r, y - r); c.lineTo(x - r + 2*r*k1, y - r + 2*r*k1); c.stroke();
    if (k2 > 0){ c.beginPath(); c.moveTo(x + r, y - r); c.lineTo(x + r - 2*r*k2, y - r + 2*r*k2); c.stroke(); }
  }
  c.restore();
}
function legend(c, x, y){
  c.save(); c.lineCap = 'round';
  c.strokeStyle = '#EAEAF2'; c.lineWidth = 8; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 64, y); c.stroke();
  V.txt(c, '数据', x + 84, y + 2, `500 56px ${SANS}`, '#C8C8D8', 'left');
  c.strokeStyle = GOLD; c.lineWidth = 7; c.setLineDash([16, 12]); c.beginPath(); c.moveTo(x, y + 66); c.lineTo(x + 64, y + 66); c.stroke(); c.setLineDash([]);
  V.txt(c, '湍流理论', x + 84, y + 68, `500 56px ${SANS}`, '#C8C8D8', 'left');
  c.restore();
}
/* 统计板（单行）：标签 + 图例 | 拟合图 | 判定 */
function drawBoard(c, W, H, t, o){
  c.fillStyle = '#0b1028'; c.fillRect(0, 0, W, H);
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(70,96,160,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const r = V.rng(o.seed);                                     // 面板上的暗色笔触肌理
  c.lineCap = 'round';
  for (let i=0;i<150;i++){ const x = r()*W, y = r()*H, a = (r()-0.5)*0.5; c.strokeStyle = `rgba(${90+r()*60|0},${110+r()*60|0},${170+r()*60|0},${0.04+r()*0.05})`; c.lineWidth = 10 + r()*14;
    c.beginPath(); c.moveTo(x - 50*Math.cos(a), y - 50*Math.sin(a)); c.lineTo(x + 50*Math.cos(a), y + 50*Math.sin(a)); c.stroke(); }
  V.txt(c, o.label, 56, 136, `900 132px ${SANS}`, '#F4EEDF', 'left');
  legend(c, 64, 286);
  c.fillStyle = 'rgba(232,197,71,.4)'; c.fillRect(488, 50, 3, H - 100); c.fillRect(1212, 50, 3, H - 100);
  const S = 2.6;
  c.save(); c.scale(S, S); V.paint2d.drawFit(c, 530/S, 64/S, 640/S, 300/S, o.fit, o.good, t); c.restore();
  const vk = o.verdict;
  if (vk > 0){                                                  // 判定区 1212–1800：「✗不符合」放大入场时也不越出面板
    c.save(); c.globalAlpha = smooth(clamp(vk*1.6, 0, 1));
    const col = o.good ? GOLD : BAD;
    drawMark(c, o.good ? 1340 : 1296, 222, o.good ? 150 : 128, col, clamp(vk*1.25, 0, 1), !o.good);
    const sc = lerp(1.25, 1, easeOut(vk));
    c.translate(o.good ? 1422 : 1362, 224); c.scale(sc, sc);
    c.shadowColor = col; c.shadowBlur = 24;
    V.txt(c, o.good ? '符合' : '不符合', 0, 0, `900 ${o.good ? 132 : 120}px ${SANS}`, col, 'left');
    c.restore();
  }
}

/* 金箔贴图：笔触纹理，可平铺 */
function goldTexture(){
  const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const c = cv.getContext('2d'), R = V.rng(808);
  c.fillStyle = '#b48a34'; c.fillRect(0, 0, N, N);
  const cols = ['#d9b04a', '#e8c547', '#9c7224', '#c99a38', '#f2d675', '#8a6420', '#f7e3a0'];
  c.lineCap = 'round';
  for (let i=0;i<1100;i++){
    const x = R()*N, y = R()*N, a = (R()<.5 ? 0 : Math.PI/2) + (R()-0.5)*0.5, L = 18 + R()*46, col = cols[Math.floor(R()*cols.length)];
    c.strokeStyle = col; c.globalAlpha = 0.3 + R()*0.45; c.lineWidth = 4 + R()*7;
    for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]){
      if (Math.abs(x + ox - N/2) > N/2 + L || Math.abs(y + oy - N/2) > N/2 + L) continue;
      c.beginPath(); c.moveTo(x + ox - Math.cos(a)*L/2, y + oy - Math.sin(a)*L/2); c.lineTo(x + ox + Math.cos(a)*L/2, y + oy + Math.sin(a)*L/2); c.stroke();
    }
  }
  c.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(0.3, 0.3); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}
/* 矩形环（带倒角挤出）：外半宽 ox、oy，内半宽 ix、iy */
function ringGeo(ox, oy, ix, iy, depth, bt, bs, seg=3){
  const s = new THREE.Shape(); s.moveTo(-ox, -oy); s.lineTo(ox, -oy); s.lineTo(ox, oy); s.lineTo(-ox, oy); s.lineTo(-ox, -oy);
  const h = new THREE.Path(); h.moveTo(-ix, -iy); h.lineTo(-ix, iy); h.lineTo(ix, iy); h.lineTo(ix, -iy); h.lineTo(-ix, -iy);
  s.holes.push(h);
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelSegments: seg, curveSegments: 1 });
}
/* 立体金色画框：外层宽线脚 + 内层台阶 + 外缘细珠线 */
function addFrame(parent, w, h, mat, matDark){
  const a = w/2, b = h/2;
  const m1 = new THREE.Mesh(ringGeo(a + 1.75, b + 1.75, a + 0.62, b + 0.62, 0.55, 0.38, 0.32, 4), mat); m1.position.z = -0.05; parent.add(m1);
  const m2 = new THREE.Mesh(ringGeo(a + 0.62, b + 0.62, a + 0.14, b + 0.14, 0.12, 0.14, 0.12, 3), mat); m2.position.z = 0.02; parent.add(m2);
  const m3 = new THREE.Mesh(ringGeo(a + 2.0, b + 2.0, a + 1.78, b + 1.78, 0.5, 0.12, 0.1, 2), mat); m3.position.z = 0.25; parent.add(m3);
  const back = new THREE.Mesh(new THREE.BoxGeometry(2*a + 4.2, 2*b + 4.2, 0.5), matDark); back.position.z = -0.55; parent.add(back);
}

V.shot({ id: 's08', start: 71, end: 83, origin: [24000, 0, 0],
  build(ctx){
    const s = ctx.state, G = ctx.group;

    /* ===== 画面注释：71–74.6 画面是论文首页，74.6 起才是两幅画。V.SECTIONS 在 71–83 只有一条，
       所以把 HTML 注释置空，在覆盖层里按原样式（27px 灰字、y≈776）自己画，并在 74.3–75.3 交叉淡换 ===== */
    V.setSection(71, undefined, '');
    {
      const NOTE_A = 'J. Math. Imaging Vis. 2008（arXiv 2006）· 论文首页示意';
      const NOTE_B = '左：躁动期画作　右：《叼烟斗、缠绷带的自画像》1889 年 1 月 · 示意';
      const note = (c, str, k) => {
        if (k <= 0.002) return;
        c.save(); c.globalAlpha = k; c.font = `400 27px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.lineJoin = 'round'; c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 9; c.strokeText(str, 960, 778);
        c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 4; c.strokeText(str, 960, 777);
        c.fillStyle = '#A8A8BE'; c.fillText(str, 960, 776);
        c.restore();
      };
      V.overlayHooks.push((c, t) => {
        if (t < 71 || t >= 83) return;
        const sk = Math.min(E(t, 71, 71.6), 1 - E(t, 82.6, 83));
        note(c, NOTE_A, sk*(1 - E(t, 74.3, 74.7)));
        note(c, NOTE_B, sk*E(t, 74.85, 75.35));
      });
    }

    /* ===== 灯光（只照亮本镜头的金框与面板） ===== */
    const amb = new THREE.AmbientLight(0xfff1dc, 0.28); G.add(amb);
    const key = new THREE.DirectionalLight(0xffe0a8, 4.4); key.position.set(-34, 42, 26); key.target.position.set(0, 0, -36); G.add(key); G.add(key.target);
    const rim = new THREE.DirectionalLight(0x9fbcff, 1.6); rim.position.set(45, 8, -10); rim.target.position.set(0, 0, -36); G.add(rim); G.add(rim.target);
    const fill = new THREE.DirectionalLight(0xffd59a, 0.9); fill.position.set(0, -30, 20); fill.target.position.set(0, 0, -36); G.add(fill); G.add(fill.target);
    s.matGold = new THREE.MeshPhongMaterial({ color: 0xd8c4a0, map: goldTexture(), specular: 0xffe2a0, shininess: 70, emissive: 0x120c03 });
    s.matDark = new THREE.MeshPhongMaterial({ color: 0x1a1a24, specular: 0x111111, shininess: 10 });
    s.matPanel = new THREE.MeshPhongMaterial({ color: 0x141a36, specular: 0x334466, shininess: 30 });

    /* ===== 论文首页 ===== */
    const bg = softCanvas(PCW, PCH);
    {
      const c = bg.getContext('2d');
      V.drawPaper(c, PCW, PCH);
      const r2 = V.rng(2006);
      for (let i=0;i<18;i++){ c.fillStyle = `rgba(120,88,40,${0.02 + r2()*0.035})`; c.beginPath(); c.arc(r2()*PCW, r2()*PCH, 4 + r2()*20, 0, 7); c.fill(); }
      c.save(); c.font = `600 40px ${SANS}`; c.fillStyle = '#7a6a52'; c.textAlign = 'center'; c.textBaseline = 'middle';
      if ('letterSpacing' in c) c.letterSpacing = '5px';
      c.fillText('J. MATH. IMAGING VIS. · 2008  (arXiv 2006)', PCW/2, 92); c.restore();
      c.fillStyle = 'rgba(42,34,24,.4)'; c.fillRect(110, 134, PCW-220, 2);
      V.txt(c, 'Turbulent Luminance in', PCW/2, 228, `italic 600 112px ${GARA}`, INK);
      V.txt(c, 'Impassioned van Gogh Paintings', PCW/2, 344, `italic 600 112px ${GARA}`, INK);
      V.txt(c, 'J. L. Aragón, G. G. Naumis, M. Bai, M. Torres, P. K. Maini', PCW/2, 456, `500 62px ${GARA}`, '#4a3a2a');
      c.fillStyle = 'rgba(42,34,24,.35)'; c.fillRect(110, 522, PCW-220, 2);
      const r3 = V.rng(58);
      for (let i=0;i<6;i++){ const w = i === 5 ? 520 : 1180 - r3()*70; c.fillStyle = 'rgba(70,58,44,.22)'; c.fillRect(120, 572 + i*40, w, 15); }
    }
    s.paperCard = softCard({ w: PW, h: PH, px: PCW, doubleSide: false,
      draw(c, W, H, t){ c.drawImage(bg, 0, 0); V.drawSeal(c, 1640, 680, '湍流的亮度', E(t, 72.6, 73.15), 74); } });
    {
      const geo = new THREE.PlaneGeometry(PW, PH, 40, 20);
      s.paperCard.mesh.geometry.dispose(); s.paperCard.mesh.geometry = geo;
      s.paperCard.mesh.material.side = THREE.FrontSide;
      s.paperBack = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xc9bda4, side: THREE.BackSide }));
      s.paper = new THREE.Group(); s.paper.add(s.paperCard.mesh); s.paper.add(s.paperBack);
      G.add(s.paper);
      s.pGeo = geo; s.pBase = Float32Array.from(geo.attributes.position.array);
    }

    /* ===== 左：《星月夜》 ===== */
    const mkRoot = (pos, yaw) => { const root = new THREE.Group(); root.position.copy(pos); root.rotation.y = yaw; G.add(root);
      const body = new THREE.Group(); root.add(body); const board = new THREE.Group(); root.add(board); return { root, body, board }; };
    s.L = mkRoot(LP, LYAW);
    addFrame(s.L.body, SW, SH, s.matGold, s.matDark);
    s.starry = softCard({ w: SW, h: SH, px: 1280, doubleSide: false, draw(c, W, H, t){
      c.fillStyle = '#d8ccb2'; c.fillRect(0, 0, W, H);                               // 打底的画布
      const k = E(t, 74.6, 75.3);
      V.paint2d.drawStarry(c, t, W/2, H/2, W, { reveal: lerp(0.02, 1, E(t, 74.8, 76.6)), alpha: k });
    }});
    s.starry.mesh.position.z = 0.04; s.L.body.add(s.starry.mesh);

    /* ===== 右：自画像（drawPortrait + 采样上色的笔触肌理层） ===== */
    s.R = mkRoot(RP, RYAW);
    addFrame(s.R.body, QW, QH, s.matGold, s.matDark);
    {
      const W = 1024, H = Math.round(1024*QH/QW);
      const base = softCanvas(W, H);
      const bc = base.getContext('2d'); V.paint2d.drawPortrait(bc, W/2, H/2, W, H, 0);
      const img = bc.getImageData(0, 0, W, H).data;
      const R = V.rng(1889), st = [];
      const at = (x, y) => { const i = ((clamp(y|0, 0, H-1))*W + clamp(x|0, 0, W-1))*4; return [img[i], img[i+1], img[i+2]]; };
      for (let i=0;i<3400;i++){
        const x = R()*W, y = R()*H, u = x/W, v = y/H;
        let col = at(x, y);
        const grey = col[0] > 150 && col[1] > 150 && col[2] > 150 && Math.abs(col[0]-col[2]) < 40;
        if (grey && u > 0.55 && v < 0.62) col = at(x - W*0.14, y);              // 烟雾处取背景色
        const fx = (u - 0.5)/0.15, fy = (v - 0.45)/0.2, rf = Math.hypot(fx, fy);
        let ang;
        if (rf < 1.05) ang = Math.atan2(fy, fx) + Math.PI/2;                     // 脸：沿轮廓
        else if (v > 0.67) ang = -Math.PI/2 + 0.45*Math.sin(u*9 + v*3);          // 外套：竖向
        else ang = 0.45*Math.sin(u*6 + v*7) + (v < 0.55 ? 0.12 : -0.1);         // 背景：横向起伏
        ang += (R() - 0.5)*0.4;
        const lum = 0.84 + R()*0.3;
        const face = rf < 1.05, white = col[0] > 200 && col[1] > 200 && col[2] > 190;
        if (white) continue;                                                   // 绷带保持干净
        if (face){ const e = 14, c1 = at(x + Math.cos(ang)*e, y + Math.sin(ang)*e), c2 = at(x - Math.cos(ang)*e, y - Math.sin(ang)*e);
          if (Math.min(c1[2], c2[2]) > 180 || Math.abs(c1[0]-col[0]) + Math.abs(c2[0]-col[0]) > 90) continue; }
        st.push({ x, y, ang, L: (face ? 9 : 18) + R()*(face ? 10 : 20), w: (face ? 4 : 7) + R()*(face ? 2.5 : 4),
          col: `rgb(${clamp(col[0]*lum, 0, 255)|0},${clamp(col[1]*lum, 0, 255)|0},${clamp(col[2]*lum, 0, 255)|0})`, a: face ? 0.35 + R()*0.25 : 0.5 + R()*0.4, key: R() });
      }
      st.sort((p, q) => p.key - q.key);
      const drawStrokes = (c, k) => { c.lineCap = 'round';
        for (const p of st){ if (p.key > k) break; c.globalAlpha = p.a; c.strokeStyle = p.col; c.lineWidth = p.w;
          const dx = Math.cos(p.ang)*p.L/2, dy = Math.sin(p.ang)*p.L/2; c.beginPath(); c.moveTo(p.x - dx, p.y - dy); c.lineTo(p.x + dx, p.y + dy); c.stroke(); }
        c.globalAlpha = 1; };
      const smoke = (c, t, a) => { c.save(); c.globalAlpha = a; c.strokeStyle = 'rgba(235,235,240,.13)'; c.lineWidth = 16; c.lineCap = 'round';
        for (let i=0;i<3;i++){ c.beginPath();
          for (let q=0;q<1;q+=0.04){ const yy = H*0.54 - q*H*0.35, xx = W*0.665 + Math.sin(q*8 + t*1.5 + i*2)*W*0.03*(q + 0.2); q === 0 ? c.moveTo(xx, yy) : c.lineTo(xx, yy); }
          c.stroke(); }
        c.restore(); };
      s.portrait = softCard({ w: QW, h: QH, px: W, doubleSide: false, draw(c, Wc, Hc, t){
        c.fillStyle = '#d8ccb2'; c.fillRect(0, 0, Wc, Hc);
        const k = P(t, 78.8, 79.9);
        c.save(); c.globalAlpha = smooth(clamp((k - 0.15)/0.6, 0, 1)); V.paint2d.drawPortrait(c, Wc/2, Hc/2, Wc, Hc, t); c.restore();
        drawStrokes(c, easeOut(k));
        smoke(c, t, smooth(clamp((k - 0.5)/0.5, 0, 1)));
      }});
      s.portrait.mesh.position.z = 0.04; s.R.body.add(s.portrait.mesh);
    }

    /* ===== 统计板（向上倾斜的厚面板 + 金边） ===== */
    const mkBoard = (side, o) => {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.2, BH + 0.2, 0.36), s.matPanel); slab.position.z = -0.22; side.board.add(slab);
      const edge = new THREE.Mesh(ringGeo(BW/2 + 0.32, BH/2 + 0.32, BW/2 + 0.02, BH/2 + 0.02, 0.18, 0.08, 0.06, 2), s.matGold); edge.position.z = -0.12; side.board.add(edge);
      const card = softCard({ w: BW, h: BH, px: 1800, doubleSide: false, draw: (c, W, H, t) => drawBoard(c, W, H, t, o(t)) });
      card.mesh.position.z = 0.0; side.board.add(card.mesh);
      return card;
    };
    s.boardL = mkBoard(s.L, t => ({ label: '躁动期', fit: E(t, 75.6, 78.0), good: true, verdict: P(t, 77.4, 78.2), seed: 11 }));
    s.boardR = mkBoard(s.R, t => ({ label: '平静期', fit: E(t, 79.6, 81.8), good: false, verdict: P(t, 81.2, 82.0), seed: 12 }));
    /* 画框 + 统计板入场时淡入（否则升起的第一帧会在画面下方"蹦"出来）：每侧用自己的材质副本 */
    const fadeMats = side => { const list = [];
      side.root.traverse(o => { if (!o.isMesh) return;
        if (o.material === s.matGold || o.material === s.matDark || o.material === s.matPanel) o.material = o.material.clone();
        list.push({ m: o.material, tr: o.material.transparent }); });
      return list; };
    s.L.mats = fadeMats(s.L); s.R.mats = fadeMats(s.R);

    /* ===== 画框后的暖色光晕（把画从星空背景里托出来） ===== */
    s.halo = new V.Strokes(4, { additive: true, shape: 'glow', renderOrder: 1 });
    G.add(s.halo.mesh);

    /* ===== 左画四周：溢出画外的旋转笔触（几条同心的流带，像画中星星外的光环） ===== */
    {
      const R = V.rng(7501);
      const BANDS = [
        { rho: 1.00, z:  0.5, w:  0.20, pal: V.PAL.pale },
        { rho: 1.08, z: -0.5, w:  0.18, pal: V.PAL.cream },
        { rho: 1.16, z:  1.1, w:  0.16, pal: V.PAL.mid },
        { rho: 1.24, z: -1.0, w:  0.15, pal: V.PAL.yel },
        { rho: 1.33, z:  0.2, w: -0.11, pal: V.PAL.pale },
        { rho: 1.43, z: -1.5, w:  0.12, pal: V.PAL.mid },
        { rho: 1.55, z:  0.9, w:  0.10, pal: [V.PAL.deep[2], V.PAL.deep[3], V.PAL.mid[0]] },
      ];
      s.spill = [];
      BANDS.forEach((bd, bi) => {
        const n = Math.round(62*bd.rho)*2;
        for (let j=0;j<n;j++) s.spill.push({ th: (j + R()*0.6)/n*Math.PI*2, rho: bd.rho + (R()-0.5)*0.05, z: bd.z + (R()-0.5)*0.5, w: bd.w*(0.92 + R()*0.16),
          ph: bi*1.7, len: 0.95 + R()*0.6, wid: 0.30 + R()*0.1, col: V.hex(bd.pal[Math.floor(R()*bd.pal.length)]), al: 0.7 + R()*0.3, key: R() });
      });
      s.spillS = new V.Strokes(s.spill.length, { renderOrder: 3 });
      s.L.root.add(s.spillS.mesh);
    }
    /* ===== 右画四周：平静漂移的稀疏笔触 ===== */
    {
      const R = V.rng(7502), N = 220, pal = [...V.PAL.deep, ...V.PAL.mid];
      s.calm = [];
      for (let i=0;i<N;i++){
        let x, y;
        do { x = (R()-0.5)*44; y = (R()-0.5)*34; } while (Math.abs(x) < QW/2 + 2.6 && y > -QH/2 - 2.6 && y < QH/2 + 2.6);
        s.calm.push({ x, y, z: (y < BY + 3.5 && y > BY - 3.5) ? -1 - R()*4 : (R()-0.5)*8, sp: 0.25 + R()*0.35, len: 0.9 + R()*0.8, wid: 0.25 + R()*0.12, col: V.hex(pal[Math.floor(R()*pal.length)]), al: 0.35 + R()*0.35, ph: R()*6.28 });
      }
      s.calmS = new V.Strokes(N, { renderOrder: 2 });
      s.R.root.add(s.calmS.mesh);
    }

    /* ===== 空间里的漂浮笔触（前景 / 中景视差层）+ 远处的几团漩涡 ===== */
    {
      const R = V.rng(7503), pal = [...V.PAL.deep, ...V.PAL.deep, ...V.PAL.mid, ...V.PAL.pale, V.PAL.cream[0], V.PAL.yel[1]];
      const path = []; for (let i=0;i<=80;i++) path.push(camPos(70.6 + i*12.8/80));
      const nearPath = (x, y, z) => path.some(p => (p.x-x)**2 + (p.y-y)**2 + (p.z-z)**2 < 64);
      const inBox = (x, y, z, c, hx, hy, hz) => Math.abs(x - c.x) < hx && Math.abs(y - c.y) < hy && Math.abs(z - c.z) < hz;
      // 视线走廊：镜头在每个停留点看向目标时，两者之间不放漂浮笔触（锥形：近处窄、目标处宽）
      const corridors = [[camPos(72.4), PC, 17], [camPos(77.3), LP.clone().add(V.v3(0, -2, 3)), 14], [camPos(82.0), RP.clone().add(V.v3(0, -2, 3)), 13]];
      const inCorr = (x, y, z) => corridors.some(([C, T, rEnd]) => {
        const d = T.clone().sub(C), L = d.length(); d.divideScalar(L);
        const q = V.v3(x, y, z).sub(C), u = q.dot(d); if (u < 0 || u > L) return false;
        return q.addScaledVector(d, -u).length() < lerp(2.5, rEnd, u/L);
      });
      s.dust = [];
      for (let i=0; i<6000 && s.dust.length < 1700; i++){
        const x = -60 + R()*115, y = -30 + R()*62, z = -100 + R()*150;
        if (nearPath(x, y, z) || inCorr(x, y, z)) continue;
        if (inBox(x, y, z, LP, 12, 17, 7) || inBox(x, y, z, RP, 9.5, 17, 7) || inBox(x, y, z, PC, 16, 8, 3) || inBox(x, y, z, V.v3(-6, 4, 30), 18, 10, 18)) continue;
        s.dust.push({ x, y, z, a: R()*6.28, w: (0.12 + R()*0.3)*(R()<.5?-1:1), r: 0.5 + R()*1.4, len: 1.0 + R()*1.5, wid: 0.3 + R()*0.3,
          col: V.hex(pal[Math.floor(R()*pal.length)]), al: 0.35 + R()*0.5, dz: R()*6.28 });
      }
      s.dustS = new V.Strokes(s.dust.length, { renderOrder: 1 });
      G.add(s.dustS.mesh);
      // 远处漩涡：倾斜的圆盘，绕中心旋转
      const VX = [ [V.v3(-62, 30, -125), 15, 1], [V.v3(64, -18, -150), 19, -1], [V.v3(93, 14, -98), 11, 1], [V.v3(-40, -34, -95), 10, -1] ];
      s.vort = [];
      VX.forEach(([C, rad, dir], vi) => {
        const n = V.v3((R()-0.5)*0.5, (R()-0.5)*0.5, 1).normalize();
        const e1 = new THREE.Vector3().crossVectors(n, V.v3(0, 1, 0)).normalize(), e2 = new THREE.Vector3().crossVectors(e1, n).normalize();
        for (let i=0;i<360;i++){
          const q = Math.sqrt(R())*1.3, col = q < .3 ? V.PAL.cream[1] : q < .6 ? V.PAL.pale[Math.floor(R()*3)] : q < .9 ? V.PAL.yel[Math.floor(R()*3)] : V.PAL.mid[Math.floor(R()*3)];
          s.vort.push({ C, e1, e2, d: q*rad, a0: R()*6.28, w: dir*(0.12 + 0.25*(1 - q/1.3)), len: 2.2 + R()*1.6, wid: 0.75 + R()*0.35, col: V.hex(col), al: 0.7 + R()*0.3 });
        }
      });
      s.vortS = new V.Strokes(s.vort.length, { renderOrder: 0 });
      G.add(s.vortS.mesh);
    }
  },

  update(t, lt, ctx){
    const s = ctx.state;
    V.backdrop.set({ opacity: 0.85 });

    /* ---- 论文纸：起伏 + 74s 后被风卷走 ---- */
    const fly = Math.pow(P(t, 73.75, 75.5), 2);
    s.paper.visible = fly < 0.999;
    if (s.paper.visible){
      const amp = 1 + 2.4*E(t, 73.7, 74.8), pos = s.pGeo.attributes.position, b = s.pBase;
      for (let i=0;i<pos.count;i++){
        const x = b[i*3], y = b[i*3+1], u = x/PW + 0.5, v = y/PH + 0.5;
        let z = -0.004*x*x + amp*0.22*Math.sin(0.28*x + 1.2*t)*(0.4 + 0.6*u) + amp*0.14*Math.sin(0.42*y - 0.9*t + 0.6);
        const cu = Math.max(0, (u - 0.74)/0.26), cv = Math.max(0, (0.3 - v)/0.3);
        z += (1.1 + 0.3*Math.sin(t*1.3) + 3*fly) * Math.pow(cu*cv, 1.5);
        const tu = Math.max(0, (0.25 - u)/0.25), tv = Math.max(0, (v - 0.7)/0.3);
        z += (0.6 + 4*fly) * Math.pow(tu*tv, 1.4);
        pos.setZ(i, z);
      }
      pos.needsUpdate = true;
      s.paper.position.set(PC.x - 30*fly - 0.4*Math.sin(t*0.7), PC.y + 0.35*Math.sin(t*0.9) + 19*fly, PC.z + 2*fly);
      s.paper.rotation.set(-0.04 + 0.03*Math.sin(t*0.8) - 0.9*fly, lerp(-0.2, 0.04, E(t, 71, 74.2)) + 0.8*fly, 0.025*Math.sin(t*0.6) + 0.6*fly);
      const kp = Math.round(clamp(t, 72.55, 73.2)*30);
      if (s.kPaper !== kp){ s.kPaper = kp; s.paperCard.redraw(kp/30); }
    }

    /* ---- 左画：升起 + 逐笔画出 + 笔触持续流动 ---- */
    const kL = easeOut(P(t, 74.45, 75.9));
    const fadeIn = (mats, k) => { for (const { m, tr } of mats){ m.opacity = k; m.transparent = tr || k < 0.999; } };
    s.L.root.visible = t > 74.4;
    fadeIn(s.L.mats, smooth(P(t, 74.4, 74.85)));
    s.L.body.position.set(0, -13*(1 - kL), -2*(1 - kL));
    s.L.body.rotation.set(0.25*(1 - kL), 0.9*(1 - kL), -0.1*(1 - kL));
    const kbL = easeOut(P(t, 75.1, 76.3));
    s.L.board.position.set(0, BY - 6*(1 - kbL), BZ);
    s.L.board.rotation.set(-0.2 - 1.1*(1 - kbL), 0, 0);
    if (s.L.root.visible){
      const ks = Math.floor(t*15);
      if (s.kStarry !== ks){ s.kStarry = ks; s.starry.redraw(ks/15); }
      const kb = Math.round(clamp(t, 75.5, 78.25)*30);
      if (s.kBoardL !== kb){ s.kBoardL = kb; s.boardL.redraw(kb/30); }
    }

    /* ---- 右画：78.8s 升起 + 逐笔画出 ---- */
    const kR = easeOut(P(t, 78.7, 79.9));
    s.R.root.visible = t > 78.6;
    fadeIn(s.R.mats, smooth(P(t, 78.6, 79.05)));
    s.R.body.position.set(0, -13*(1 - kR), -2*(1 - kR));
    s.R.body.rotation.set(0.25*(1 - kR), -0.9*(1 - kR), 0.1*(1 - kR));
    const kbR = easeOut(P(t, 79.3, 80.4));
    s.R.board.position.set(0, BY - 6*(1 - kbR), BZ);
    s.R.board.rotation.set(-0.2 - 1.1*(1 - kbR), 0, 0);
    if (s.R.root.visible){
      const kq = Math.floor(Math.max(t, 78.6)*15);
      if (s.kPortrait !== kq){ s.kPortrait = kq; s.portrait.redraw(kq/15); }
      const kb = Math.round(clamp(t, 79.5, 82.05)*30);
      if (s.kBoardR !== kb){ s.kBoardR = kb; s.boardR.redraw(kb/30); }
    }

    /* ---- 光晕 ---- */
    const hl = LP.clone().add(V.v3(-Math.sin(LYAW)*1.5, 0, -Math.cos(LYAW)*1.5));
    const hr = RP.clone().add(V.v3(-Math.sin(RYAW)*1.5, 0, -Math.cos(RYAW)*1.5));
    s.halo.set(0, hl.x, hl.y - 13*(1 - kL), hl.z, 1, 0, 0, 36, 32, [1.0, 0.78, 0.42], 0.20*kL);
    s.halo.set(1, hr.x, hr.y - 13*(1 - kR), hr.z, 1, 0, 0, 30, 32, [1.0, 0.80, 0.50], 0.17*kR);
    s.halo.set(2, hl.x, hl.y - 1 - 13*(1 - kL), hl.z + 0.4, 1, 0, 0, 20, 18, [1.0, 0.86, 0.6], 0.12*kL);
    s.halo.set(3, hr.x, hr.y - 1 - 13*(1 - kR), hr.z + 0.4, 1, 0, 0, 16, 18, [1.0, 0.86, 0.6], 0.10*kR);
    s.halo.commit();

    /* ---- 左画四周的旋转笔触 ---- */
    {
      const rev = P(t, 74.9, 76.8), A = SW/2 + 2.5, B = SH/2 + 2.5, yOff = -13*(1 - kL);
      s.spill.forEach((p, i) => {
        if (p.key > rev*1.05){ s.spillS.hide(i); return; }
        const th = p.th + p.w*t, m = 1 + 0.05*Math.sin(3*th - 0.7*t + p.ph);
        const ra = A*p.rho*m, rb = B*p.rho*m;
        const x = Math.cos(th)*ra, y = Math.sin(th)*rb + yOff;
        const sg = Math.sign(p.w), dx = -Math.sin(th)*ra*sg, dy = Math.cos(th)*rb*sg;
        const a = p.al * clamp((rev*1.05 - p.key)*10, 0, 1);
        s.spillS.set(i, x, y, p.z + 0.3*Math.sin(t*0.8 + th*2), dx, dy, 0, p.len, p.wid, p.col, a);
      });
      s.spillS.commit();
    }
    /* ---- 右画四周的平静笔触 ---- */
    {
      const a0 = smooth(P(t, 78.9, 80.2));
      s.calm.forEach((p, i) => {
        const span = 44, x = ((p.x + p.sp*t + span/2) % span + span) % span - span/2, f = (x + span/2)/span;
        s.calmS.set(i, x, p.y + 0.3*Math.sin(t*0.4 + p.ph), p.z, 1, 0.04*Math.cos(t*0.4 + p.ph), 0, p.len, p.wid, p.col, p.al*a0*Math.sin(Math.PI*f));
      });
      s.calmS.commit();
    }
    /* ---- 漂浮笔触与远处漩涡 ---- */
    s.dust.forEach((p, i) => {
      const a = p.a + p.w*t;
      s.dustS.set(i, p.x + Math.cos(a)*p.r, p.y + Math.sin(a)*p.r, p.z + 0.6*Math.sin(t*0.4 + p.dz), -Math.sin(a)*Math.sign(p.w), Math.cos(a)*Math.sign(p.w), 0.15, p.len, p.wid, p.col, p.al);
    });
    s.dustS.commit();
    s.vort.forEach((p, i) => {
      const a = p.a0 + p.w*t, c = Math.cos(a), sn = Math.sin(a);
      const x = p.C.x + (c*p.e1.x + sn*p.e2.x)*p.d, y = p.C.y + (c*p.e1.y + sn*p.e2.y)*p.d, z = p.C.z + (c*p.e1.z + sn*p.e2.z)*p.d;
      s.vortS.set(i, x, y, z, -sn*p.e1.x + c*p.e2.x, -sn*p.e1.y + c*p.e2.y, -sn*p.e1.z + c*p.e2.z, p.len, p.wid, p.col, p.al);
    });
    s.vortS.commit();

    /* ---- 相机 ---- */
    ctx.cam(camPos(t), camTgt(t), camFov(t), 0.035*Math.sin(t*0.5));
  },
});
})();

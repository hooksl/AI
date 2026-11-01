/* s11_ns · 114–121s · 纳维-斯托克斯方程 + 100 万美元（非世界镜头）
   114–117.5  星空里漂浮着发光的方程：标题「纳维-斯托克斯方程 / Navier–Stokes equations」(114.1s)，
              114.8s 起逐字书写 ∂u/∂t + (u·∇)u = −∇p/ρ + ν∇²u，115.8s 起 ∇·u = 0（FreeSerif 数学字体）；
              书写处有一个金色笔尖光点，并溅出小笔触。三行文字分处不同深度。
              四层笔触流线绕过方程（绕椭圆柱体的势流，沿流线的速度由流函数梯度决定）：上游平直，
              下游拖出摆动的尾流和交替旋转的小漩涡（卡门涡街示意）。镜头从左后方缓慢推近，并向右做小幅弧线。
   117.5–121  镜头下摇、继续推近：方程升出画面，下方的金色「$1,000,000」成为焦点——
              117.4–119.8s 计数器滚动（每位数字像里程表一样竖向滚动，快时带运动模糊；Canvas 按帧档位重画；
              119.42 减速停在 999,999，随后整条进位链一起滚到 1,000,000），
              背后一圈金色笔触光环旋转；119.8s 数字定格时光环一闪并迸出金色笔触；
              118s 起下方写「千禧年大奖难题 · Millennium Prize Problem」。 */
(function(){
const { E, P, lerp, clamp, easeOut, easeIn, smooth } = V;
const SANS = V.FONT.SANS, SERIF = V.FONT.SERIF, GARA = V.FONT.GARA, MATH = V.FONT.MATH;
const GOLD = V.COL.gold;

const EQ1 = '∂u/∂t + (u·∇)u = −∇p/ρ + ν∇²\u200Au', EQ2 = '∇·u = 0';   // ² 与斜体 u 之间加发丝空格（FreeSerif 斜体 u 会压住上标）
const PXU = 40.96;                                   // 方程贴图：每世界单位的像素
const TITLE = { y: 10.0, z: -1.6, w: 30, h: 6.5 };
const L1 = { y: 4.4, z: 0, w: 50, h: 7.4, t0: 114.8, dt: 0.042, dur: 0.24 };
const L2 = { y: 0.0, z: 1.4, w: 25, h: 7.4, t0: 115.8, dt: 0.075, dur: 0.26 };
const CNT = { y: -4.2, z: 12, w: 27, h: 9.6 };       // 计数卡（比方程更靠近镜头）
const OB = { cx: 0, cy: 5.4, a: 30, b: 8.8 };         // 流线绕过的椭圆（方程块）

const CAM = [
  // t       pos                  target                fov
  [113.6, [-11.5, 4.7, 66.5], [ 0.0, -1.4, 0.0], 50],
  [115.4, [ -5.0, 4.3, 57.5], [ 0.1, -1.5, 0.0], 50],
  [117.3, [  2.2, 3.8, 48.5], [ 0.4, -1.8, 0.0], 50],
  [118.4, [  4.0, 3.6, 45.5], [ 0.4, -4.6, 2.5], 50],
  [119.5, [  3.2, 3.2, 42.5], [ 0.2, -6.4, 4.0], 50],
  [121.4, [  0.8, 3.0, 38.6], [ 0.0, -7.0, 4.6], 50],
];
function herm(keys, t, idx){
  const n = keys.length, arr = k => [].concat(keys[k][idx]);
  if (t <= keys[0][0]) return arr(0);
  if (t >= keys[n-1][0]) return arr(n-1);
  let i = 0; while (t > keys[i+1][0]) i++;
  const tan = j => { const a = Math.max(0, j-1), b = Math.min(n-1, j+1); const A = arr(a), B = arr(b); return A.map((x, d) => (B[d] - x)/(keys[b][0] - keys[a][0])); };
  const t0 = keys[i][0], t1 = keys[i+1][0], p0 = arr(i), p1 = arr(i+1), m0 = tan(i), m1 = tan(i+1);
  const h = t1 - t0, s = (t - t0)/h, s2 = s*s, s3 = s2*s;
  const h00 = 2*s3 - 3*s2 + 1, h10 = s3 - 2*s2 + s, h01 = -2*s3 + 3*s2, h11 = s3 - s2;
  return p0.map((x, d) => h00*x + h10*h*m0[d] + h01*p1[d] + h11*h*m1[d]);
}
const camPos = t => { const p = herm(CAM, t, 1); return V.v3(p[0] + 0.3*Math.sin(t*0.8), p[1] + 0.2*Math.sin(t*0.6 + 1), p[2]); };
const camTgt = t => { const p = herm(CAM, t, 2); return V.v3(p[0], p[1], p[2]); };

/* 与 V.card 相同，但画布强制走软件光栅（willReadFrequently）：
   每帧重画的卡片若被浏览器按"历史"切换到 GPU 加速，阴影/模糊会有 1–2 级的像素差，破坏确定性 */
function softCard(o){
  const W = o.px, H = Math.round(o.px*o.h/o.w);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d', { willReadFrequently: true });
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: o.depthWrite ?? true, fog: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.h), mat);
  const api = { mesh, canvas: cv, ctx: c, W, H, tex,
    redraw(t){ c.clearRect(0, 0, W, H); o.draw(c, W, H, t); tex.needsUpdate = true; },
    set opacity(v){ mat.opacity = v; mesh.visible = v > 0.002; } };
  api.redraw(0);
  return api;
}

/* ---------- 逐字书写的发光文字 ----------
   glyphs: [{ch, x, w}]（贴图像素坐标），每个字在 [t0 + j*dt, +dur] 内从左到右软边揭开，刚写完时更亮 */
function layoutGlyphs(str, font, W){
  const c = document.createElement('canvas').getContext('2d'); c.font = font;
  const total = c.measureText(str).width, x0 = (W - total)/2, out = [];
  let j = 0;
  for (let i=0;i<str.length;i++){
    const ch = str[i], xa = c.measureText(str.slice(0, i)).width, xb = c.measureText(str.slice(0, i+1)).width;
    if (/\s/.test(ch)) continue;
    out.push({ ch, x: x0 + xa, w: Math.max(4, xb - xa), j: j++ });
  }
  return { glyphs: out, total, x0 };
}
function drawWritten(c, lay, font, y, t, o){
  c.font = font; c.textAlign = 'left'; c.textBaseline = 'middle';
  for (const g of lay.glyphs){
    const kk = (t - o.t0 - g.j*o.dt)/o.dur; if (kk <= 0) continue;
    const fresh = 1 - smooth(clamp((t - o.t0 - g.j*o.dt - o.dur)/0.7, 0, 1));          // 刚写完的余辉
    const col = fresh > 0.01 ? `rgba(255,${(246 + 9*fresh)|0},${(216 + 39*fresh)|0},` : 'rgba(255,246,216,';
    /* 揭开前沿：kk∈[0,1] 扫过字身；之后前沿继续右移，把右侧的辉光也放出来，最后改用纯色填充。
       （Chrome 的 shadow 会乘上渐变填充的 alpha：若一直用"右侧透明"的渐变，辉光会在字框右沿被切成竖直硬边。） */
    const span = g.w + 4, sw = 0.35*span, B = 2.8*o.blur, kmax = 1 + (B + sw)/span;
    let fill;
    if (kk >= kmax) fill = col + '1)';
    else {
      const xf = g.x - 2 + kk*span;
      fill = c.createLinearGradient(xf, 0, xf + sw, 0);
      fill.addColorStop(0, col + '1)'); fill.addColorStop(1, col + '0)');
    }
    c.save(); c.fillStyle = fill;
    c.shadowColor = `rgba(232,197,71,${0.75 + 0.25*fresh})`; c.shadowBlur = o.blur*(1 + 0.8*fresh);
    c.fillText(g.ch, g.x, y);
    c.shadowBlur = 0; c.fillText(g.ch, g.x, y);
    c.restore();
  }
}
/* 当前笔尖位置（贴图像素 x），没有正在写的字时返回 null */
function penX(lay, t, o){
  let best = null;
  for (const g of lay.glyphs){ const k = (t - o.t0 - g.j*o.dt)/o.dur; if (k > 0 && k < 1) best = g.x + g.w*k; }
  return best;
}

/* ---------- 流函数：均匀来流 + 椭圆柱（拉伸坐标中的偶极子） ---------- */
function psi(x, y, s){ const X = (x - OB.cx)/(OB.a*s), Y = (y - OB.cy)/(OB.b*s), r2 = X*X + Y*Y; return y - OB.b*s*Y/Math.max(r2, 0.2); }
function grad(x, y, s){ const h = 0.02; return [(psi(x + h, y, s) - psi(x - h, y, s))/(2*h), (psi(x, y + h, s) - psi(x, y - h, s))/(2*h)]; }
function trace(y0, s){
  const pts = [[-100, y0]], tm = [0], U = 4.6, ds = 0.6;
  const target = psi(-100, y0, s);
  let x = -100, y = y0, T = 0;
  for (let it=0; it<1200 && x < 100; it++){
    let [gx, gy] = grad(x, y, s); let m = Math.hypot(gx, gy) || 1;
    let mx = x + 0.5*ds*gy/m, my = y - 0.5*ds*gx/m;                       // RK2：速度 (ψ_y, −ψ_x)
    [gx, gy] = grad(mx, my, s); m = Math.hypot(gx, gy) || 1;
    x += ds*gy/m; y -= ds*gx/m;
    const [hx, hy] = grad(x, y, s), hm = hx*hx + hy*hy || 1, err = psi(x, y, s) - target;   // 投影回等值线
    x -= err*hx/hm; y -= err*hy/hm;
    T += ds/(U*Math.max(0.25, m));
    pts.push([x, y]); tm.push(T);
  }
  return { pts, tm, T };
}
function along(line, tau){                                                // 按"时间"沿流线取点（二分）
  const tm = line.tm; let lo = 0, hi = tm.length - 1;
  while (hi - lo > 1){ const mid = (lo + hi) >> 1; if (tm[mid] <= tau) lo = mid; else hi = mid; }
  const f = (tau - tm[lo])/((tm[hi] - tm[lo]) || 1), a = line.pts[lo], b = line.pts[hi];
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];
}

V.shot({ id: 's11', start: 114, end: 121, origin: [36000, 0, 0],
  build(ctx){
    const s = ctx.state, G = ctx.group;

    /* ===== 方程块背后的暗场（压低背景天幕，保证可读） ===== */
    const darkCard = (w, h, a, z, y) => {
      const cd = V.card({ w, h, px: 512, depthWrite: false, draw(c, W, H){
        c.save(); c.scale(1, H/W);
        const g = c.createRadialGradient(W/2, W/2, 0, W/2, W/2, W/2);
        g.addColorStop(0, `rgba(5,8,22,${a})`); g.addColorStop(0.55, `rgba(5,8,22,${a*0.75})`); g.addColorStop(1, 'rgba(5,8,22,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, W); c.restore(); } });
      cd.mesh.position.set(0, y, z); cd.mesh.renderOrder = 0; G.add(cd.mesh); return cd;
    };
    s.darkEq = darkCard(84, 38, 0.8, -3.5, 5.4);
    s.darkCnt = darkCard(42, 16, 0.62, CNT.z - 2.2, CNT.y); s.darkCnt.mesh.renderOrder = 3;

    /* ===== 标题与方程（Canvas 贴图，逐字书写） ===== */
    const F_T = `900 118px ${SERIF}`, F_TE = `italic 84px ${GARA}`;
    s.layT = layoutGlyphs('纳维-斯托克斯方程', F_T, Math.round(TITLE.w*PXU));
    s.title = softCard({ w: TITLE.w, h: TITLE.h, px: Math.round(TITLE.w*PXU), depthWrite: false, draw(c, W, H, t){
      drawWritten(c, s.layT, F_T, H*0.36, t, { t0: 114.05, dt: 0.05, dur: 0.3, blur: 20 });
      c.save(); c.globalAlpha = E(t, 114.4, 115.1); c.font = F_TE; c.fillStyle = '#B8B8CC'; c.textAlign = 'center'; c.textBaseline = 'middle';
      if ('letterSpacing' in c) c.letterSpacing = `${lerp(14, 3, E(t, 114.4, 115.2))|0}px`;
      c.fillText('Navier–Stokes equations', W/2, H*0.8); c.restore();
    }});
    s.title.mesh.position.set(0, TITLE.y, TITLE.z); s.title.mesh.renderOrder = 4; G.add(s.title.mesh);

    const fitFont = (str, W, maxPx) => { const c = document.createElement('canvas').getContext('2d'); c.font = `italic 100px ${MATH}`; return Math.min(maxPx, Math.floor((W - 90)/c.measureText(str).width*100)); };
    const fs = fitFont(EQ1, Math.round(L1.w*PXU), 170);
    s.F_EQ = `italic ${fs}px ${MATH}`; s.fsEq = fs;
    s.lay1 = layoutGlyphs(EQ1, s.F_EQ, Math.round(L1.w*PXU));
    s.lay2 = layoutGlyphs(EQ2, s.F_EQ, Math.round(L2.w*PXU));
    const mkEq = (L, lay) => { const cd = softCard({ w: L.w, h: L.h, px: Math.round(L.w*PXU), depthWrite: false,
      draw(c, W, H, t){ drawWritten(c, lay, s.F_EQ, H*0.5, t, { t0: L.t0, dt: L.dt, dur: L.dur, blur: 26 }); } });
      cd.mesh.position.set(0, L.y, L.z); cd.mesh.renderOrder = 4; G.add(cd.mesh); return cd; };
    s.eq1 = mkEq(L1, s.lay1); s.eq2 = mkEq(L2, s.lay2);

    /* 笔尖光点 + 溅出的小笔触 */
    s.pen = new V.Strokes(4, { additive: true, shape: 'glow', renderOrder: 6, depthTest: false });
    G.add(s.pen.mesh);
    {
      const R = V.rng(1145);
      s.sparks = [];
      for (const [L, lay] of [[L1, s.lay1], [L2, s.lay2]]){
        const Wpx = Math.round(L.w*PXU);
        for (const g of lay.glyphs) for (let k=0;k<5;k++){
          const tb = L.t0 + g.j*L.dt + R()*L.dur, xp = g.x + g.w*R();
          const a = R()*Math.PI*2;
          s.sparks.push({ tb, x: (xp/Wpx - 0.5)*L.w, y: L.y + (R()-0.5)*2.6, z: L.z + 0.3,
            vx: Math.cos(a)*(1.2 + R()*2.4), vy: Math.sin(a)*(1.2 + R()*2.4) + 0.8, vz: 1 + R()*3, life: 0.6 + R()*0.6,
            len: 0.5 + R()*0.6, wid: 0.16 + R()*0.08, col: V.hex([GOLD, '#f7e27a', '#fdf6d8', '#f4d34a'][Math.floor(R()*4)]) });
        }
      }
      s.sparkS = new V.Strokes(s.sparks.length, { additive: true, renderOrder: 6 });
      G.add(s.sparkS.mesh);
    }

    /* ===== 笔触流线：三层，每条流线是一串首尾相接的笔触；绕过方程块，下游摆动成尾流 ===== */
    {
      const R = V.rng(1146);
      const LAYERS = [ { z: -10, sc: 1.0, n: 9 }, { z: -4, sc: 1.05, n: 9 }, { z: 2.6, sc: 1.25, n: 5 } ];
      const FAM = [ [V.PAL.cream[0], V.PAL.cream[1], V.PAL.yel[1]], [V.PAL.pale[0], V.PAL.pale[1], V.PAL.pale[2]], [V.PAL.mid[1], V.PAL.mid[2], V.PAL.teal[0]],
                    [V.PAL.yel[0], V.PAL.yel[1], V.PAL.cream[2]], [V.PAL.mid[0], V.PAL.mid[1], V.PAL.deep[3]], [V.PAL.deep[2], V.PAL.deep[3], V.PAL.mid[0]] ];
      s.lines = []; s.flow = [];
      LAYERS.forEach((Ly, li) => {
        for (let i=0;i<Ly.n;i++){
          const side = i % 2 ? 1 : -1, q = (Math.floor(i/2) + 0.3 + R()*0.4)/(Ly.n/2);
          const off = side*(1.2 + 24*Math.pow(q, 1.25)) + (li - 1)*1.1 + (R()-0.5)*1.2;
          const line = trace(OB.cy + off, Ly.sc);
          line.off = off; line.z = Ly.z + (R()-0.5)*1.2; line.li = li;
          s.lines.push(line);
          const fam = Math.abs(off) < 5 ? FAM[R() < .5 ? 0 : 3] : Math.abs(off) < 11 ? FAM[R() < .6 ? 1 : 2] : Math.abs(off) < 18 ? FAM[R() < .5 ? 2 : 4] : FAM[R() < .7 ? 5 : 4];
          const wid = 0.5 + R()*0.18;
          for (const strand of (li === 2 ? [0] : [-0.3, 0.3])){
            const gap = 0.4 + R()*0.1, n = Math.floor(line.T/gap), ph = R()*gap;
            for (let k=0;k<n;k++) s.flow.push({ L: s.lines.length - 1, st: strand + (R()-0.5)*0.3, tau0: ph + k*gap + (R()-0.5)*0.22, len: 1.6 + R()*1.9, wid: wid*(0.75 + R()*0.5),
              ang: (R()-0.5)*0.12, col: V.hex(fam[Math.floor(R()*fam.length)]), al: (li === 2 ? 0.6 : 0.85) + R()*0.15, wph: R()*6.28 });
          }
        }
      });
      s.flowS = new V.Strokes(s.flow.length, { renderOrder: 2 });
      G.add(s.flowS.mesh);
      // 尾流里交替旋转的小漩涡
      s.vort = [];
      for (let k=0;k<7;k++){
        const up = k % 2 ? 1 : -1, x0 = 35 + k*10.5, rad = 3.0 + R()*1.4, z = -4 + (R()-0.5)*3;
        for (let j=0;j<85;j++){
          const q = Math.sqrt(R()), col = q < .35 ? V.PAL.cream[Math.floor(R()*3)] : q < .7 ? V.PAL.pale[Math.floor(R()*3)] : V.PAL.mid[Math.floor(R()*3)];
          s.vort.push({ x0, y0: OB.cy + up*4.4, z, d: q*rad, a0: R()*6.28, w: -up*(0.9 + 0.8*(1 - q)), len: 1.0 + R()*0.7, wid: 0.36 + R()*0.14, col: V.hex(col), al: 0.75 + R()*0.25 });
        }
      }
      s.vortS = new V.Strokes(s.vort.length, { renderOrder: 2 });
      G.add(s.vortS.mesh);
    }

    /* ===== 计数卡 ===== */
    {
      const W = 1800, H = Math.round(W*CNT.h/CNT.w);
      const c0 = document.createElement('canvas').getContext('2d');
      const F_N = `900 300px ${SANS}`; c0.font = F_N;
      const str = '$1,000,000', total = c0.measureText(str).width, x0 = (W - total)/2;
      const slots = [];
      let place = 6;
      for (let i=0;i<str.length;i++){
        const xa = c0.measureText(str.slice(0, i)).width, xb = c0.measureText(str.slice(0, i+1)).width;
        slots.push({ ch: str[i], x: x0 + xa, w: xb - xa, place: /[0-9]/.test(str[i]) ? place-- : null });
      }
      const NY = H*0.4, DH = 300*0.98;                 // 数字基线中心 / 一格高度
      /* 117.45–119.42 减速滚到 999,999；119.42–119.8 整条进位链（每一位 9→0、首位 0→1）一起滚动约 11 帧，正好落在定格闪光上 */
      const vAt = t => t < 119.42 ? 999999*easeOut(P(t, 117.45, 119.42)) : 999999 + V.easeInOut(P(t, 119.42, 119.8));
      const goldFill = (c) => { const g = c.createLinearGradient(0, NY - 130, 0, NY + 130); g.addColorStop(0, '#FFF3B8'); g.addColorStop(0.45, '#F2CF55'); g.addColorStop(1, '#B98A2A'); return g; };
      s.counter = softCard({ w: CNT.w, h: CNT.h, px: W, depthWrite: false, draw(c, Wc, Hc, t){
        const a = E(t, 117.3, 117.8); if (a <= 0) return;
        const v = vAt(t), v2 = vAt(t + 1/30), speed = (v2 - v)*30;
        const done = t >= 119.8, flash = done ? Math.exp(-(t - 119.8)*3) : 0;
        c.save(); c.globalAlpha = a; c.font = F_N; c.textAlign = 'left'; c.textBaseline = 'middle';
        const wheel = [v % 10];                                              // 里程表：只有低位转过 9→0 时高位才进位滚动
        for (let pl=1; pl<=6; pl++){ const d = Math.floor(v/Math.pow(10, pl) + 1e-9) % 10, prev = wheel[pl-1]; wheel.push(d + (prev > 9 ? prev - 9 : 0)); }
        for (const sl of slots){
          c.save();
          c.shadowColor = `rgba(232,197,71,${0.7 + 0.3*flash})`; c.shadowBlur = 34 + 40*flash;
          if (sl.place === null){ c.fillStyle = goldFill(c); if (sl.ch === ',' && sl.x < slots[4].x) c.globalAlpha = a*(0.16 + 0.84*smooth(clamp(wheel[6], 0, 1))); c.fillText(sl.ch, sl.x, NY); c.restore(); continue; }
          const pos = wheel[sl.place], d0 = Math.floor(pos), fr = pos - d0;
          const fast = speed/Math.pow(10, sl.place) > 10;                    // 转得太快：竖向运动模糊
          const leadK = v < Math.pow(10, sl.place) ? 0.16 + 0.84*smooth(clamp(pos, 0, 1)) : 1;   // 未到的高位为"空轮"，进位滚动时连续亮起
          c.beginPath(); c.rect(sl.x - 8, NY - DH*0.56, sl.w + 16, DH*1.12); c.clip();
          c.fillStyle = goldFill(c);
          if (fast) c.filter = 'blur(3px)';
          const taps = fast ? [[-1, .3], [0, .45], [1, .3]] : [[0, 1]];
          for (let k=0;k<=1;k++){
            const off = k - fr; if (Math.abs(off) >= 1) continue;
            const drum = Math.pow(Math.cos(off*Math.PI/2), 0.6);
            for (const [tp, wt] of taps){
              c.globalAlpha = a*drum*wt*leadK;
              c.fillText(String((d0 + k) % 10), sl.x, NY + (off + tp*0.16)*DH);
            }
          }
          c.restore();
        }
        c.restore();
        // 底部文字
        const k2 = E(t, 118.0, 118.8);
        if (k2 > 0){
          c.save(); c.globalAlpha = k2; c.textBaseline = 'middle';
          const f1 = `700 78px ${SANS}`, f2 = `italic 76px ${GARA}`, s1 = '千禧年大奖难题', s2 = '  ·  Millennium Prize Problem';
          c.font = f1; const w1 = c.measureText(s1).width; c.font = f2; const w2 = c.measureText(s2).width;
          const xs = (Wc - w1 - w2)/2, yy = Hc*0.84 + (1 - easeOut(k2))*20;
          c.shadowColor = 'rgba(0,0,0,.8)'; c.shadowBlur = 12;
          c.font = f1; c.fillStyle = '#EDE6D2'; c.textAlign = 'left'; c.fillText(s1, xs, yy);
          c.font = f2; c.fillStyle = '#C9C3B4'; c.fillText(s2, xs + w1, yy + 2);
          c.restore();
        }
      }});
      s.counter.mesh.position.set(0, CNT.y, CNT.z); s.counter.mesh.renderOrder = 7; s.counter.mesh.material.depthTest = false;
      G.add(s.counter.mesh);
    }
    /* 计数卡背后的金色笔触光环 + 定格时迸出的笔触 */
    {
      const R = V.rng(1147);
      s.ring = [];
      const pals = [[...V.PAL.moon, V.PAL.yel[0]], [...V.PAL.cream, V.PAL.yel[1]], [...V.PAL.pale, V.PAL.teal[1]]];
      for (let b=0;b<3;b++){
        const n = 96 + b*14;
        for (let j=0;j<n;j++){
          if (R() < 0.16) continue;                                         // 不规则的空隙
          s.ring.push({ th: (j + (R()-0.5)*0.7)/n*Math.PI*2, rb: 1 + b*0.075 + (R()-0.5)*0.03, w: 0.42 - b*0.06,
            len: 0.9 + R()*0.7, wid: 0.3 + R()*0.1, col: V.hex(pals[b][Math.floor(R()*pals[b].length)]), al: (0.95 - b*0.15) + R()*0.05, key: R() });
        }
      }
      s.ringS = new V.Strokes(s.ring.length, { renderOrder: 5 });
      G.add(s.ringS.mesh);
      s.burst = [];
      for (let j=0;j<170;j++){ const a = R()*Math.PI*2; s.burst.push({ a, sp: 8 + R()*14, vz: (R()-0.3)*6, ex: 0.9 + R()*0.3, len: 0.8 + R()*1.2, wid: 0.2 + R()*0.14,
        col: V.hex([GOLD, '#fdf6d8', '#f7e27a', '#f5c95a'][Math.floor(R()*4)]), life: 0.9 + R()*0.7 }); }
      s.burstS = new V.Strokes(s.burst.length, { additive: true, renderOrder: 8 });
      G.add(s.burstS.mesh);
    }

    /* ===== 空间里的漂浮笔触（视差层） ===== */
    {
      const R = V.rng(1148), pal = [...V.PAL.deep, ...V.PAL.deep, ...V.PAL.mid, ...V.PAL.pale, V.PAL.cream[0], V.PAL.yel[1]];
      const path = []; for (let i=0;i<=60;i++) path.push(camPos(113.6 + i*7.8/60));
      s.dust = [];
      for (let i=0; i<5000 && s.dust.length < 900; i++){
        const x = -75 + R()*150, y = -45 + R()*90, z = -40 + R()*100;
        if (path.some(p => (p.x-x)**2 + (p.y-y)**2 + (p.z-z)**2 < 80)) continue;
        if (Math.abs(x) < 34 && y > -12 && y < 17 && z > -6) continue;          // 镜头与文字之间不放

        s.dust.push({ x, y, z, a: R()*6.28, w: (0.12 + R()*0.3)*(R()<.5?-1:1), r: 0.5 + R()*1.4, len: 1.3 + R()*1.6, wid: 0.35 + R()*0.3,
          col: V.hex(pal[Math.floor(R()*pal.length)]), al: 0.35 + R()*0.45, dz: R()*6.28 });
      }
      s.dustS = new V.Strokes(s.dust.length, { renderOrder: 1 });
      G.add(s.dustS.mesh);
    }
  },

  update(t, lt, ctx){
    const s = ctx.state;
    V.backdrop.set({ opacity: 0.8 });

    /* ---- 文字卡：书写期间每帧一档重画 ---- */
    const kT = Math.round(clamp(t, 114.0, 115.6)*30); if (s.kT !== kT){ s.kT = kT; s.title.redraw(kT/30); }
    const k1 = Math.round(clamp(t, 114.75, 117.0)*30); if (s.k1 !== k1){ s.k1 = k1; s.eq1.redraw(k1/30); }
    const k2 = Math.round(clamp(t, 115.75, 117.2)*30); if (s.k2 !== k2){ s.k2 = k2; s.eq2.redraw(k2/30); }
    const kc = Math.round(clamp(t, 117.3, 121.0)*30); if (s.kc !== kc){ s.kc = kc; s.counter.redraw(kc/30); }
    // 文字块轻微漂浮
    const bob = 0.25*Math.sin(t*0.9);
    s.title.mesh.position.y = TITLE.y + bob*0.8; s.eq1.mesh.position.y = L1.y + bob; s.eq2.mesh.position.y = L2.y + bob*1.2;
    s.counter.mesh.position.y = CNT.y + 0.6*(1 - easeOut(P(t, 117.35, 118.2))) + 0.15*Math.sin(t*1.1);
    s.counter.mesh.scale.setScalar(lerp(0.9, 1, easeOut(P(t, 117.35, 118.2))) * (1 + 0.04*Math.exp(-Math.max(0, t - 119.8)*4)*(t >= 119.8 ? 1 : 0)));
    s.darkCnt.opacity = E(t, 117.0, 117.9);
    s.title.opacity = 1 - E(t, 117.9, 118.8);
    s.eq1.mesh.visible = s.eq2.mesh.visible = false;      // 按用户要求：不展示方程式，只保留名称与百万美元悬赏

    /* ---- 相机（先设好，后面把笔触投影到屏幕上做文字避让） ---- */
    ctx.cam(camPos(t), camTgt(t), herm(CAM, t, 3)[0], 0.03*Math.sin(t*0.45));
    V.camera.updateMatrixWorld();
    const tmp = s.tmp || (s.tmp = new THREE.Vector3()), O = ctx.origin, rects = [];
    const addRect = (cx, cy, cz, hw, hh, k) => {
      if (k <= 0.02) return; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ tmp.set(cx + sx*hw, cy + sy*hh, cz).add(O).project(V.camera);
        x0 = Math.min(x0, tmp.x); x1 = Math.max(x1, tmp.x); y0 = Math.min(y0, tmp.y); y1 = Math.max(y1, tmp.y); }
      rects.push([x0, y0, x1, y1, k]);
    };
    const eh = s.fsEq/PXU*0.62;
    addRect(0, TITLE.y + bob*0.8, TITLE.z, s.layT.total/PXU/2 + 0.6, TITLE.h/2 - 0.3, (t > 114.05 ? 1 : 0)*(1 - E(t, 117.9, 118.8)));
    addRect(0, L1.y + bob, L1.z, s.lay1.total/PXU/2 + 0.5, eh, t > L1.t0 ? 1 : 0);
    addRect(0, L2.y + bob*1.2, L2.z, s.lay2.total/PXU/2 + 0.5, eh, t > L2.t0 ? 1 : 0);
    addRect(0, s.counter.mesh.position.y - 0.6, CNT.z, 11.6, 3.4, E(t, 117.35, 117.9));
    const mask = (x, y, z) => {
      tmp.set(x, y, z).add(O).project(V.camera); if (tmp.z > 1) return 0;
      let m = 0;
      for (const [x0, y0, x1, y1, k] of rects){
        const d = Math.max(Math.max(x0 - tmp.x, tmp.x - x1, 0)/0.035, Math.max(y0 - tmp.y, tmp.y - y1, 0)/0.05);
        if (d < 1) m = Math.max(m, k*(1 - smooth(d)));
      }
      return m;
    };

    /* ---- 笔尖 + 溅出的笔触 ---- */
    {
      let i = 0;
      for (const [L, lay, mesh] of [[L1, s.lay1, s.eq1.mesh], [L2, s.lay2, s.eq2.mesh]]){
        const px = penX(lay, t, L);
        if (px === null){ s.pen.hide(i++); s.pen.hide(i++); continue; }
        const x = (px/Math.round(L.w*PXU) - 0.5)*L.w, y = mesh.position.y, z = L.z + 0.4;
        s.pen.set(i++, x, y, z, 1, 0, 0, 4.2, 4.2, [1.0, 0.82, 0.4], 0.75);
        s.pen.set(i++, x, y, z, 1, 0, 0, 1.3, 1.3, [1.0, 0.98, 0.9], 1);
      }
      s.pen.commit();
      s.sparks.forEach((p, j) => {
        const u = t - p.tb;
        if (u < 0 || u > p.life){ s.sparkS.hide(j); return; }
        const f = u/p.life, dr = 1 - Math.exp(-u*2.2);
        const x = p.x + p.vx*dr/2.2, y = p.y + p.vy*dr/2.2 - 0.6*u*u, z = p.z + p.vz*dr/2.2;
        s.sparkS.set(j, x, y, z, p.vx, p.vy - 1.2*u, p.vz*0.3, p.len*(1 - 0.5*f), p.wid, p.col, Math.sin(Math.PI*Math.min(1, f*1.2 + 0.08))*0.9);
      });
      s.sparkS.commit();
      s.pen.mesh.visible = s.sparkS.mesh.visible = false;   // 方程不再书写，笔尖与火花一并隐藏
    }

    /* ---- 流线笔触 ---- */
    {
      const rev = smooth(P(t, 113.7, 114.6));
      s.flow.forEach((p, j) => {
        const line = s.lines[p.L];
        const tau = ((p.tau0 + t) % line.T + line.T) % line.T;
        const A = along(line, tau), B = along(line, Math.min(line.T, tau + 0.12));
        let x = A[0], y = A[1], dx = B[0] - A[0], dy = B[1] - A[1];
        // 下游尾流：摆动（越靠近中心线摆得越大）
        const wk = smooth(clamp((x - 26)/34, 0, 1))*Math.exp(-((line.off/15)**2));
        if (wk > 0){
          const ph = 0.17*x - 1.7*t + line.li*0.9;
          y += 2.8*wk*Math.sin(ph); dy += 2.8*wk*0.17*Math.cos(ph)*dx;
        }
        const edge = clamp((96 - Math.abs(x))/14, 0, 1), dl = Math.hypot(dx, dy) || 1;
        x += -dy/dl*p.st; y += dx/dl*p.st;                                   // 同一条流线上并排的两股笔触
        const ca = Math.cos(p.ang), sa = Math.sin(p.ang), z = line.z + 0.4*Math.sin(t*0.5 + p.wph);
        const al = p.al*edge*rev; if (al < 0.01){ s.flowS.hide(j); return; }
        s.flowS.set(j, x, y, z, dx*ca - dy*sa, dx*sa + dy*ca, 0, p.len, p.wid, p.col, al*(1 - 0.92*mask(x, y, z)));
      });
      s.flowS.commit();
      s.vort.forEach((p, j) => {
        const cx = p.x0 + 2.2*lt, a = p.a0 + p.w*t, c = Math.cos(a), sn = Math.sin(a);
        const fade = clamp((92 - cx)/12, 0, 1)*rev;
        if (fade < 0.01){ s.vortS.hide(j); return; }
        const x = cx + c*p.d, y = p.y0 + sn*p.d;
        s.vortS.set(j, x, y, p.z, -sn*Math.sign(p.w), c*Math.sign(p.w), 0, p.len, p.wid, p.col, p.al*fade*(1 - 0.92*mask(x, y, p.z)));
      });
      s.vortS.commit();
    }

    /* ---- 计数卡背后的光环 + 定格迸发 ---- */
    {
      const rev = P(t, 117.4, 118.4), pulse = t >= 119.8 ? Math.exp(-(t - 119.8)*2.5) : 0;
      const RA = 13.4*(1 + 0.1*pulse), RY = 2.3*(1 + 0.1*pulse), RZ = 5.5, y0 = s.counter.mesh.position.y - 0.5;   // 倾斜的轨道环
      s.ring.forEach((p, j) => {
        if (p.key > rev*1.05){ s.ringS.hide(j); return; }
        const th = p.th + p.w*t, c = Math.cos(th), sn = Math.sin(th);
        const x = c*RA*p.rb, y = y0 + sn*RY*p.rb, z = CNT.z - 1.2 - sn*RZ*p.rb;
        const a = p.al*clamp((rev*1.05 - p.key)*10, 0, 1)*(1 + 0.4*pulse)*(1 - 0.85*mask(x, y, z));
        s.ringS.set(j, x, y, z, -sn*RA, c*RY, -c*RZ, p.len, p.wid, p.col, a);
      });
      s.ringS.commit();
      const u = t - 119.8;
      s.burst.forEach((p, j) => {
        if (u < 0 || u > p.life){ s.burstS.hide(j); return; }
        const dr = (1 - Math.exp(-u*2.6))/2.6, r0x = 13.4*p.ex, r0y = 2.3*p.ex;
        const x = Math.cos(p.a)*(r0x + p.sp*dr), y = y0 + Math.sin(p.a)*(r0y + p.sp*dr*0.6), z = CNT.z - 0.5 + p.vz*dr;
        s.burstS.set(j, x, y, z, Math.cos(p.a), Math.sin(p.a)*0.6, p.vz*0.05, p.len, p.wid, p.col, 0.9*(1 - u/p.life)*(1 - 0.85*mask(x, y, z)));
      });
      s.burstS.commit();
    }

    /* ---- 漂浮笔触 ---- */
    s.dust.forEach((p, i) => {
      const a = p.a + p.w*t, x = p.x + Math.cos(a)*p.r, y = p.y + Math.sin(a)*p.r, z = p.z + 0.6*Math.sin(t*0.4 + p.dz);
      s.dustS.set(i, x, y, z, -Math.sin(a)*Math.sign(p.w), Math.cos(a)*Math.sign(p.w), 0.15, p.len, p.wid, p.col, p.al*(1 - 0.92*mask(x, y, z)));
    });
    s.dustS.commit();
  },
});
})();

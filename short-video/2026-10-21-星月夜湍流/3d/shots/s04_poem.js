/* s04_poem · 34–46s · 理查森的小诗
   一张做旧的 1922 年论文扉页漂在星空里（细分网格、随风起伏、边角翘起），诗句逐行"手写"浮现，44s 盖印「能量级联」。
   纸后远处是由笔触组成的立体分形涡旋：大涡 L1 → 38s 甩出小涡 L2 → 39.6s 能量沿涡臂流进小涡 → 42s 小涡再甩出更小的涡 L3
   → 43.6s 最小一级化作发热的光点 L4（黏性）。外围还有一圈绕大涡旋转的"气流"笔触（中景），纸前有零星光尘（前景）。
   大涡的轴向上仰约 50°，盘面在画面上是横向的椭圆漏斗：小涡、更小的涡始终落在画面 y≈125–735 内，不进字幕区。
   镜头：从纸的左前方缓慢向右环绕推近（纸只部分转向镜头，相对角从约 −8° 变到 +14°；纸后的涡旋随视差逐渐露出），
   44.75s 起加速越过纸页右缘，斜着冲进大涡的漏斗中心（46s 前的转场笔触下）。 */
(function(){
const { E, P, lerp, clamp, smooth } = V;
const PW = 28, PH = 19.6, CW = 1600, CH = 1120;           // 纸张尺寸（世界单位 / 贴图像素）
const LINES = [['Big whorls have little whorls', 38.0, 1.3], ['That feed on their velocity,', 39.6, 1.3],
               ['And little whorls have lesser whorls', 42.0, 1.45], ['And so on to viscosity.', 43.6, 1.0]];   // [诗句, 起笔时刻, 书写时长]
const FEATHER = 90;                                        // 笔迹前沿的羽化宽度（px）
const DIVE = 44.05;                                        // 镜头开始加速越过纸页的时刻
const POEM_Y0 = 548, POEM_DY = 104, POEM_FONT = `italic 500 82px ${V.FONT.GARA}`;
const INK = '#2a2218';
const T0 = 34;
const DEPTH_PUSH = 25;                                    // 涡系整体后推（在画面上约缩小 12%，整套级联都能留在字幕区之上）

/* 纸面形变（纸张局部 z）：只由 t 决定 */
function curl(x, y, t){
  const u = x/PW + 0.5, v = y/PH + 0.5;
  const amp = 1 + 2.4*(1 - E(t, 34.1, 36.2));                 // 入场时卷得更厉害，随后展平
  let z = -0.0055*x*x;                                        // 整体微弯
  z += amp*0.26*Math.sin(0.30*x + 1.2*t) * (0.35 + 0.65*u);   // 横向行波
  z += amp*0.16*Math.sin(0.36*y - 0.9*t + 0.6);
  const cu = Math.max(0, (u-0.70)/0.30), cv = Math.max(0, (0.30-v)/0.30);   // 右下角翘起
  z += (1.9 + 0.5*Math.sin(t*1.3)) * Math.pow(cu*cv, 1.5) * (0.7 + 0.3*amp);
  const tu = Math.max(0, (0.22-u)/0.22), tv = Math.max(0, (v-0.78)/0.22);   // 左上角轻翘
  z += 1.0 * Math.pow(tu*tv, 1.5) * (1 + 0.3*Math.sin(t*0.9+1));
  return z;
}

/* ---------- 分形涡旋参数（镜头局部坐标） ---------- */
const R0 = 48;
/* 涡轴：从"指向镜头"的方向往上仰约 TILT 度，盘面在画面上成为横向的椭圆（纵向压扁），
   这样甩出的小涡不会掉进底部字幕区、也不会飞出画面上沿，同时能看出漏斗的立体纵深。 */
const VIEW = V.v3(-49, -1, 179).normalize();               // 涡心 → 镜头环绕段的平均位置
const C0 = V.v3(50, 9, -132).addScaledVector(VIEW, -DEPTH_PUSH);
const TILT = 50*Math.PI/180;
const N0 = VIEW.clone().multiplyScalar(Math.cos(TILT)).add(V.v3(0.10, 1, 0).normalize().multiplyScalar(Math.sin(TILT))).normalize();
const NW = V.v3(-0.72, 0.30, 1).normalize();               // 外圈"气流"笔触的旋转轴（斜对镜头，在纸与涡之间铺满中景）
function basis(n){ const e1 = new THREE.Vector3().crossVectors(n, V.v3(0,1,0)).normalize(); return [e1, new THREE.Vector3().crossVectors(e1, n).normalize()]; }
function tilt(n, R, maxAng){
  const [e1, e2] = basis(n), a = R()*Math.PI*2, th = maxAng*(0.5 + 0.5*R());
  return n.clone().multiplyScalar(Math.cos(th)).addScaledVector(e1, Math.sin(th)*Math.cos(a)).addScaledVector(e2, Math.sin(th)*Math.sin(a)).normalize();
}
/* 角速度：越靠近涡心转得越快 */
const omega = (W, r) => W.s * W.Om * (0.32 + 0.68*Math.max(0, 1 - r/(1.6*W.R)));
const ARMS = 4, BETA = -1.35;                               // 大涡的 4 条对数螺旋臂（拖尾型）

V.shot({ id: 's04', start: 34, end: 46, origin: [8000, 0, 0],
  build(ctx){
    const s = ctx.state, R = V.rng(40422);
    const pick = a => a[Math.floor(R()*a.length)];
    const PAL = V.PAL;

    /* ===== 纸张 ===== */
    const bg = document.createElement('canvas'); bg.width = CW; bg.height = CH;
    {
      const c = bg.getContext('2d');
      V.drawPaper(c, CW, CH);
      // 额外的做旧：边缘泛黄、几道折痕、零星污点
      const r2 = V.rng(1922);
      for (let i=0;i<34;i++){ c.fillStyle = `rgba(120,88,40,${0.03 + r2()*0.05})`; c.beginPath(); c.arc(r2()*CW, r2()*CH, 4 + r2()*26, 0, 7); c.fill(); }
      c.strokeStyle = 'rgba(90,70,40,.10)'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(0, CH*0.5 + 6); c.lineTo(CW, CH*0.5 - 4); c.stroke();
      c.beginPath(); c.moveTo(CW*0.5 - 3, 0); c.lineTo(CW*0.5 + 5, CH); c.stroke();
      c.strokeStyle = 'rgba(42,34,24,.55)'; c.lineWidth = 2; c.strokeRect(54, 54, CW-108, CH-108);
      c.strokeStyle = 'rgba(42,34,24,.25)'; c.lineWidth = 1; c.strokeRect(66, 66, CW-132, CH-132);
      c.save(); c.font = `600 50px ${V.FONT.SANS}`; c.fillStyle = '#6e5e46'; c.textAlign = 'center'; c.textBaseline = 'middle';
      if ('letterSpacing' in c) c.letterSpacing = '12px';
      c.fillText('LONDON · 1922', CW/2, 128); c.restore();
      V.txt(c, 'Weather Prediction', CW/2, 232, `italic 600 98px ${V.FONT.GARA}`, INK);
      V.txt(c, 'by Numerical Process', CW/2, 330, `italic 600 98px ${V.FONT.GARA}`, INK);
      V.txt(c, 'Lewis F. Richardson', CW/2, 418, `500 74px ${V.FONT.GARA}`, '#46382a');
      c.fillStyle = 'rgba(42,34,24,.45)'; c.fillRect(CW/2 - 360, 470, 720, 3);
      c.beginPath(); c.arc(CW/2, 471.5, 7, 0, 7); c.fill();
    }
    // 每一行诗预先画到自己的画布上，手写揭开时用渐变遮罩
    s.lines = LINES.map(([str], i) => {
      const cv = document.createElement('canvas'), m = cv.getContext('2d');
      m.font = POEM_FONT; const tw = Math.ceil(m.measureText(str).width);
      cv.width = tw + 2*FEATHER; cv.height = 130;
      const c = cv.getContext('2d');
      c.font = POEM_FONT; c.fillStyle = INK; c.textBaseline = 'middle'; c.textAlign = 'left';
      c.fillText(str, FEATHER, 66);
      return { cv, tw, x: Math.round(CW/2 - tw/2 - FEATHER), y: Math.round(POEM_Y0 + i*POEM_DY - 66) };
    });
    s.tmp = document.createElement('canvas'); s.tmp.width = 1500; s.tmp.height = 130;
    const drawPage = (c, Wc, Hc, t) => {
      c.drawImage(bg, 0, 0);
      LINES.forEach(([str, t0, dur], i) => {
        const k = P(t, t0, t0 + dur); if (k <= 0) return;
        const L = s.lines[i];
        if (k >= 1){ c.drawImage(L.cv, L.x, L.y); return; }
        const tc = s.tmp, x = tc.getContext('2d');
        x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, tc.width, tc.height);
        x.drawImage(L.cv, 0, 0);
        const rx = FEATHER + k*(L.tw + FEATHER);
        x.globalCompositeOperation = 'destination-in';
        const g = x.createLinearGradient(rx - FEATHER, 0, rx, 0);
        g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g; x.fillRect(0, 0, tc.width, tc.height);
        x.globalCompositeOperation = 'source-over';
        c.drawImage(tc, L.x, L.y);
      });
      V.drawSeal(c, 1268, 990, '能量级联', E(t, 44.0, 44.55), 64);
    };
    s.card = V.card({ w: PW, h: PH, px: CW, draw: drawPage, doubleSide: false });
    const geo = new THREE.PlaneGeometry(PW, PH, 44, 32);
    s.card.mesh.geometry.dispose(); s.card.mesh.geometry = geo;
    s.card.mesh.material.side = THREE.FrontSide;
    s.card.mesh.material.vertexColors = true; s.card.mesh.material.needsUpdate = true;   // 顶点色做纸面起伏的明暗
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count*3).fill(1), 3));
    s.back = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xcfc3aa, side: THREE.BackSide }));
    s.paper = new THREE.Group(); s.paper.add(s.card.mesh); s.paper.add(s.back);
    ctx.group.add(s.paper);
    s.geoBase = Float32Array.from(geo.attributes.position.array);
    s.geo = geo;

    /* ===== 分形涡旋 ===== */
    const whorls = [];
    const [e1a, e2a] = basis(N0);
    whorls.push({ lvl: 1, parent: -1, R: R0, n: N0, e1: e1a, e2: e2a, s: 1, Om: 0.34, D: 15, t0: 33.6, t1: 35.4 });
    for (let i=0;i<ARMS;i++){
      const n = tilt(N0, R, 0.6), [e1, e2] = basis(n);
      const W2 = { lvl: 2, parent: 0, R: 13 + 3*R(), n, e1, e2, s: i%2 ? -1 : 1, Om: 0.95, D: 4.2,
        phi0: (i/ARMS)*Math.PI*2 + 0.35, rho: R0*(1.06 + 0.08*R()), t0: 38.0 + i*0.18, t1: 39.3 + i*0.18 };
      const pi = whorls.length; whorls.push(W2);
      for (let j=0;j<3;j++){
        const n3 = tilt(n, R, 0.8), [f1, f2] = basis(n3);
        whorls.push({ lvl: 3, parent: pi, R: 4.8 + 1.6*R(), n: n3, e1: f1, e2: f2, s: R()<.5 ? 1 : -1, Om: 2.1, D: 1.2,
          phi0: (j/3)*Math.PI*2 + R()*0.8, rho: W2.R*(1.28 + 0.14*R()), t0: 42.0 + (i*3+j)*0.07, t1: 43.0 + (i*3+j)*0.07 });
      }
    }
    s.whorls = whorls;
    whorls.forEach(W => { W.C = new THREE.Vector3(); W.k = 0; W.sc = 1; });

    // 笔触数据
    const items = [];
    const armDist = (a, q, W) => {             // 到最近螺旋臂的角距离（只用于大涡上色/加密）
      let best = 9;
      for (let k=0;k<ARMS;k++){
        const th = (k/ARMS)*Math.PI*2 + 0.35 + BETA*Math.log(Math.max(q, 0.08));
        let d = ((a - th) % (Math.PI*2) + Math.PI*3) % (Math.PI*2) - Math.PI;
        best = Math.min(best, Math.abs(d));
      }
      return best;
    };
    whorls.forEach((W, wi) => {
      const cnt = W.lvl === 1 ? 5200 : W.lvl === 2 ? 820 : 280;
      let made = 0, guard = 0;
      while (made < cnt && guard++ < cnt*6){
        const q = Math.sqrt(R())*1.14, a = R()*Math.PI*2;
        let col, arm = 0;
        if (W.lvl === 1){
          const d = armDist(a, q, W); arm = Math.exp(-((d/0.42)**2));
          if (q > 0.22 && R() > 0.30 + 0.70*arm) continue;          // 臂上更密
          col = q < 0.16 ? pick(PAL.cream) : q < 0.3 ? pick(PAL.pale)
              : arm > 0.55 ? (q < 0.85 ? pick([...PAL.cream, ...PAL.yel, PAL.cream[0]]) : pick([...PAL.pale, ...PAL.cream]))
              : q < 0.6 ? pick([...PAL.mid, ...PAL.pale]) : q < 0.95 ? pick([...PAL.deep, ...PAL.mid]) : pick(PAL.deep);
        } else if (W.lvl === 2){
          col = q < 0.22 ? pick(PAL.cream) : q < 0.5 ? pick(PAL.pale) : q < 0.8 ? pick([...PAL.cream, ...PAL.yel]) : q < 1.0 ? pick(PAL.mid) : pick([...PAL.deep, ...PAL.mid]);
        } else {
          col = q < 0.35 ? pick([...PAL.cream, ...PAL.yel]) : q < 0.75 ? pick([...PAL.pale, ...PAL.teal]) : pick([...PAL.mid, ...PAL.cream]);
        }
        const L = W.lvl === 1 ? W.R*(0.085 + 0.05*R()) : W.lvl === 2 ? W.R*(0.13 + 0.07*R()) : W.R*(0.22 + 0.10*R());
        items.push({ wi, q, a0: a, h: -W.D*(1 - Math.min(q,1))**2 + (R()-0.5)*W.R*0.07,
          len: L, wid: L*(0.28 + 0.08*R()), col: V.hex(col), key: R()*0.92, alpha: 0.9 + 0.1*R(), arm });
        made++;
      }
    });
    // 中景：绕大涡外围旋转的气流笔触（在纸与大涡之间）
    const wind = [];
    for (let i=0;i<1100;i++){
      const h = 25 + R()*95, rho = R0*(1.35 + R()*1.5);
      const r = R();
      wind.push({ h, rho, a0: R()*Math.PI*2, w: 0.10 + 0.08*R(), len: 3.0 + R()*2.2, wid: 0.75 + R()*0.3,
        col: V.hex(r < .72 ? pick(PAL.deep) : r < .95 ? pick(PAL.mid) : pick(PAL.cream)), alpha: 0.4 + 0.3*R(), ph: R()*6.28 });
    }
    s.items = items; s.wind = wind;
    { const [e1, e2] = basis(NW); s.wb = { C: C0.clone(), n: NW, e1, e2 }; }
    s.st = new V.Strokes(items.length + wind.length, { renderOrder: 2 });
    ctx.group.add(s.st.mesh);

    // 发光层：能量输送粒子 + L4 热光点 + 前景光尘 + 笔尖
    const feeders = [];
    for (let i=1;i<whorls.length;i++){
      const W = whorls[i], m = W.lvl === 2 ? 40 : 12;
      for (let j=0;j<m;j++) feeders.push({ wi: i, p0: R(), sp: 0.45 + 0.25*R(), jit: (R()-0.5)*0.18, size: (W.lvl === 2 ? 1.5 : 0.55)*(0.7 + 0.6*R()) });
    }
    const heat = [];
    whorls.forEach((W, wi) => { if (W.lvl !== 3) return;
      for (let j=0;j<30;j++) heat.push({ wi, a0: R()*Math.PI*2, f0: R(), sp: 0.5 + 0.4*R(), h: (R()-0.5)*1.5, size: 1.0 + 0.8*R() }); });
    const motes = [];
    for (let i=0;i<110;i++){
      let x, y, z;
      do { x = -45 + R()*95; y = -26 + R()*48; z = -70 + R()*112; } while (Math.abs(x) < 17 && Math.abs(y) < 12 && z > -4);
      motes.push({ x, y, z, ph: R()*6.28, size: 0.12 + 0.3*R(), a: 0.25 + 0.4*R() });
    }
    s.feeders = feeders; s.heat = heat; s.motes = motes;
    s.gl = new V.Strokes(feeders.length + heat.length + motes.length, { additive: true, shape: 'glow', renderOrder: 3 });
    ctx.group.add(s.gl.mesh);
    s.spark = new V.Strokes(2, { additive: true, shape: 'glow', renderOrder: 4 });
    s.paper.add(s.spark.mesh);

    /* ===== 镜头路径（按弧长匀速取点，速度曲线另算） ===== */
    const endPos = C0.clone().addScaledVector(VIEW.clone().add(N0).normalize(), 58);   // 终点离涡心更远：俯冲距离缩短，速度与转向都更平缓   // 斜着冲向漏斗中心（涡轴已上仰）
    const slowPts = [V.v3(-11, 4.5, 52), V.v3(-2, 3, 49.5), V.v3(6.5, 1, 46), V.v3(13.5, -0.5, 42.5)];
    s.curve = new THREE.CatmullRomCurve3([...slowPts, V.v3(22, 0, 24), V.v3(31, 1, -14), V.v3(37, 3, -62), endPos], false, 'centripetal');
    s.curveLen = s.curve.getLength();
    // 前 4 个点（慢速环绕段）的弧长 → 匀速环绕的速度
    s.v0 = new THREE.CatmullRomCurve3(slowPts, false, 'centripetal').getLength()/(DIVE - T0);
    s.C0 = C0; s.N0 = N0;
  },

  update(t, lt, ctx){
    const s = ctx.state;

    /* ---------- 镜头 ---------- */
    // 冲刺段：附加速度在前 60% 时间内按 smoothstep 升满、之后保持，让 45.6s 转场前已明显飞近涡心
    const Dur = 46 - DIVE, x = P(t, DIVE, 46), XR = 0.6;
    const gx = x < XR ? XR*((x/XR)**3 - (x/XR)**4/2) : XR*0.5 + (x - XR), G1 = XR*0.5 + (1 - XR);
    const A = (s.curveLen*0.62 - s.v0*12)/(Dur*G1);       // 46s 时只飞完冲刺段的约六成：剩下的交给推进转场，避免过猛的甩镜
    const dist = s.v0*(t - T0) + A*Dur*gx;
    const cam = s.curve.getPointAt(clamp(dist/s.curveLen, 0, 1));
    cam.y += 0.25*Math.sin(t*0.8);
    // 视线：在"纸"与"大涡"两个方向之间取中，略向下压，让纸位于画面中上部
    const dP = V.v3(0, 0, 0).sub(cam).normalize(), dV = s.C0.clone().sub(cam).normalize();
    const look = dP.clone().lerp(dV, lerp(0.22, 0.5, E(t, 35.0, 41.5))).normalize();
    look.y -= lerp(0.084, 0.129, E(t, 37, 43)); look.normalize();
    let tgt = cam.clone().addScaledVector(look, 40);
    const dive = E(t, DIVE + 0.05, 45.75);
    tgt.lerp(s.C0.clone().addScaledVector(s.N0, -34), dive);
    const fov = lerp(lerp(47, 45, E(t, 34, 44)), 62, E(t, DIVE, 46));
    ctx.cam(cam, tgt, fov, 0.035*Math.sin(t*0.42) + 0.06*dive*Math.sin(t*2.1));

    /* ---------- 纸张 ---------- */
    const pin = V.easeOut(P(t, 33.7, 35.9));
    const camRef = s.curve.getPointAt(clamp((s.v0*(Math.min(t, DIVE) - T0))/s.curveLen, 0, 1));
    const face = 0.22*Math.atan2(camRef.x, camRef.z) + 0.03;     // 只部分转向镜头：环绕时纸面相对镜头从约 −8° 转到 +14°，看得出是空间里的一张纸
    s.paper.position.set(lerp(-7, 0, pin), lerp(-17, 0, pin) + 0.35*Math.sin(t*0.7), lerp(-16, 0, pin));
    const gust = E(t, DIVE + 0.1, 46);
    s.paper.rotation.set(lerp(-1.15, 0, pin) - 0.035 + 0.025*Math.sin(t*0.55) - 0.35*gust,
                         face + lerp(0.6, 0, pin) + 0.03*Math.sin(t*0.47),
                         lerp(0.4, 0, pin) + 0.018*Math.sin(t*0.4) + 0.12*gust, 'YXZ');
    const pa = s.geo.attributes.position, b = s.geoBase, col = s.geo.attributes.color;
    for (let i=0;i<pa.count;i++){
      const px = b[i*3], py = b[i*3+1];
      pa.array[i*3+2] = curl(px, py, t) + 1.2*gust*Math.sin(px*0.2 + t*3);
      const zx = curl(px + 0.4, py, t) - curl(px - 0.4, py, t), zy = curl(px, py + 0.4, t) - curl(px, py - 0.4, t);
      const sh = clamp(0.97 - 0.55*zx + 0.35*zy, 0.72, 1.04);
      col.array[i*3] = sh; col.array[i*3+1] = sh; col.array[i*3+2] = sh*0.985;
    }
    pa.needsUpdate = true; col.needsUpdate = true;
    // 贴图：按 1/30 秒量化，只有手写/盖章进行中才重画
    const tq = Math.round(t*30)/30;
    const key = LINES.map(([, t0, dur]) => P(tq, t0, t0 + dur).toFixed(3)).join() + E(tq, 44.0, 44.55).toFixed(3);
    if (s.lastKey !== key){ s.card.redraw(tq); s.lastKey = key; }
    // 笔尖金光：跟着正在书写的那一行
    s.spark.hideAll();
    LINES.forEach(([, t0, dur], i) => {
      const k = P(t, t0, t0 + dur); if (k <= 0 || k >= 1) return;
      const L = s.lines[i], u = (L.x + FEATHER + k*L.tw)/CW, v = (POEM_Y0 + i*POEM_DY + 8)/CH;
      const px = (u - 0.5)*PW, py = (0.5 - v)*PH, pz = curl(px, py, t) + 0.12;
      const fl = Math.min(E(t, t0, t0 + 0.18), 1 - E(t, t0 + dur - 0.25, t0 + dur));   // 起笔淡入、收笔淡出，避免光点突现
      s.spark.set(0, px, py, pz, 1, 0, 0, 2.6, 2.6, [1.0, 0.78, 0.35], 0.75*fl);
      s.spark.set(1, px, py, pz, 1, 0, 0, 0.7, 0.7, [1.0, 0.97, 0.85], 1.0*fl);
    });
    s.spark.commit();

    /* ---------- 分形涡旋 ---------- */
    const ph = t - T0;
    const W = s.whorls;
    W.forEach((w, i) => {
      w.k = clamp((t - w.t0)/(w.t1 - w.t0), 0, 1);
      const ke = V.easeOut(w.k);
      if (w.parent < 0){ w.C.copy(s.C0); w.sc = 1; return; }
      const p = W[w.parent];
      const rho = lerp(p.R*0.88, w.rho, ke);
      const phi = w.phi0 + omega(p, rho)*ph;
      const h = -p.D*0.02;
      w.C.copy(p.C).addScaledVector(p.e1, Math.cos(phi)*rho*p.sc).addScaledVector(p.e2, Math.sin(phi)*rho*p.sc).addScaledVector(p.n, h);
      w.sc = lerp(0.12, 1, ke);
    });
    const st = s.st; let n = 0;
    for (const it of s.items){
      const w = W[it.wi];
      const rev = w.lvl === 1 ? w.k : w.k*1.05;
      const al = clamp((rev - it.key)*10, 0, 1);
      if (al <= 0){ st.hide(n++); continue; }
      const r = it.q*w.R, a = it.a0 + omega(w, r)*ph;
      const ca = Math.cos(a), sa = Math.sin(a), rr = r*w.sc, hh = it.h*w.sc;
      const X = w.C.x + (w.e1.x*ca + w.e2.x*sa)*rr + w.n.x*hh;
      const Y = w.C.y + (w.e1.y*ca + w.e2.y*sa)*rr + w.n.y*hh;
      const Z = w.C.z + (w.e1.z*ca + w.e2.z*sa)*rr + w.n.z*hh;
      // 方向：切向 + 少量向内的螺旋分量
      const tg = w.s, rd = -0.26;
      const dx = (-w.e1.x*sa + w.e2.x*ca)*tg + (w.e1.x*ca + w.e2.x*sa)*rd;
      const dy = (-w.e1.y*sa + w.e2.y*ca)*tg + (w.e1.y*ca + w.e2.y*sa)*rd;
      const dz = (-w.e1.z*sa + w.e2.z*ca)*tg + (w.e1.z*ca + w.e2.z*sa)*rd;
      st.set(n++, X, Y, Z, dx, dy, dz, it.len*w.sc, it.wid*Math.max(0.5, w.sc), it.col, al*it.alpha);
    }
    const w0 = s.wb, windK = E(t, 33.8, 35.6);   // 外圈气流：绕斜对镜头的轴 NW 旋转
    for (const d of s.wind){
      const a = d.a0 + d.w*ph, ca = Math.cos(a), sa = Math.sin(a);
      const rho = d.rho*(1 - 0.06*Math.sin(t*0.5 + d.ph));
      const X = w0.C.x + (w0.e1.x*ca + w0.e2.x*sa)*rho + w0.n.x*d.h;
      const Y = w0.C.y + (w0.e1.y*ca + w0.e2.y*sa)*rho + w0.n.y*d.h;
      const Z = w0.C.z + (w0.e1.z*ca + w0.e2.z*sa)*rho + w0.n.z*d.h;
      const dx = -w0.e1.x*sa + w0.e2.x*ca - 0.2*(w0.e1.x*ca + w0.e2.x*sa);
      const dy = -w0.e1.y*sa + w0.e2.y*ca - 0.2*(w0.e1.y*ca + w0.e2.y*sa);
      const dz = -w0.e1.z*sa + w0.e2.z*ca - 0.2*(w0.e1.z*ca + w0.e2.z*sa);
      st.set(n++, X, Y, Z, dx, dy, dz, d.len, d.wid, d.col, d.alpha*windK);
    }
    st.commit();

    /* ---------- 发光层 ---------- */
    const g = s.gl; let m = 0;
    const feedK2 = V.vis(t, 39.5, 46.5, 0.7, 0.5), feedK3 = V.vis(t, 42.6, 46.5, 0.6, 0.5);
    for (const f of s.feeders){
      const w = W[f.wi], p = W[w.parent];
      const fk = w.lvl === 2 ? feedK2 : feedK3;
      if (fk <= 0 || w.k <= 0){ g.hide(m++); continue; }
      const u = ((f.p0 + (t - 39.6)*f.sp) % 1 + 1) % 1;
      // 沿螺旋臂从父涡内侧流向子涡中心
      const rho = lerp(p.R*0.88, w.rho, V.easeOut(w.k))*p.sc;
      const r = lerp(p.R*0.22*p.sc, rho, Math.pow(u, 0.85));
      const phiC = w.phi0 + omega(p, rho/p.sc)*ph;
      const ang = phiC + BETA*Math.log(Math.max(r/rho, 0.05))*(p.lvl === 1 ? 1 : 0.6) + f.jit;
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const hh = -p.D*(1 - Math.min(r/(p.R*p.sc), 1))**2;
      const X = p.C.x + (p.e1.x*ca + p.e2.x*sa)*r + p.n.x*hh;
      const Y = p.C.y + (p.e1.y*ca + p.e2.y*sa)*r + p.n.y*hh;
      const Z = p.C.z + (p.e1.z*ca + p.e2.z*sa)*r + p.n.z*hh;
      g.set(m++, X, Y, Z, 1, 0, 0, f.size*2.4, f.size, [1.0, 0.88, 0.55], fk*Math.sin(Math.PI*u)*0.95);
    }
    const heatK = V.vis(t, 43.55, 46.5, 0.8, 0.4);
    for (const d of s.heat){
      const w = W[d.wi];
      if (heatK <= 0){ g.hide(m++); continue; }
      const f = ((d.f0 + (t - 43.6)*d.sp) % 1 + 1) % 1;
      const a = d.a0 + 2.6*w.s*ph, r = w.R*w.sc*lerp(0.9, 2.3, f);
      const ca = Math.cos(a), sa = Math.sin(a);
      const X = w.C.x + (w.e1.x*ca + w.e2.x*sa)*r + w.n.x*d.h;
      const Y = w.C.y + (w.e1.y*ca + w.e2.y*sa)*r + w.n.y*d.h;
      const Z = w.C.z + (w.e1.z*ca + w.e2.z*sa)*r + w.n.z*d.h;
      const sz = d.size*(1 + 0.6*f);
      g.set(m++, X, Y, Z, 1, 0, 0, sz, sz, [1.0, lerp(0.85, 0.55, f), lerp(0.55, 0.3, f)], heatK*Math.sin(Math.PI*f)*0.9);
    }
    const moteK = E(t, 33.8, 35.2);
    for (const d of s.motes){
      const X = d.x + 1.6*Math.sin(t*0.31 + d.ph), Y = d.y + 1.1*Math.sin(t*0.23 + d.ph*1.7), Z = d.z + 0.8*Math.cos(t*0.27 + d.ph);
      const tw = 0.7 + 0.3*Math.sin(t*2.1 + d.ph*3);
      g.set(m++, X, Y, Z, 1, 0, 0, d.size, d.size, [1.0, 0.93, 0.75], moteK*d.a*tw);
    }
    g.commit();

    V.backdrop.set({ opacity: 0.85 });
  },
});
})();

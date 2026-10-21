/* s09_measure · 83–91s · 2024 论文与测量（世界镜头）
   83–85.8  2024 年 Physics of Fluids 论文首页（细分网格、随风起伏）漂在 3D 星月夜世界的夜空前，镜头绕纸缓慢横移，
            84.6s 盖印「星月夜」；左侧前景是柏树，纸后是旋转的天空。
   85.8–87.3 纸被风卷起，从镜头右上方掠过飘走；镜头同时后退、下降到原画视点附近，整片星空露出来。
   87.3–91  镜头在原画视点附近缓慢横移推进（柏树与天空产生视差）；天空流动加快，白色示踪光点沿漩涡被"带着走"；
            从 87.6s 起每 0.22s 依次为漩涡、月亮、星画出金色 3D 直径测量线（切平面内，两端带刻度），并标注厘米数。
            示踪光点画在天空之后、柏树之前（renderOrder 1.5），不会浮到前景柏树上。 */
(function(){
const { E, P, lerp, clamp, vis, easeOut, easeIn, smooth } = V;
const PW = 28, PH = 14, CW = 2000, CH = 1000;
const INK = '#2a2218';
const NF = 12, MT0 = 87.6, MDT = 0.22, MGROW = 0.55;       // 前 12 个特征；测量线起始时刻、间隔、生长时长

function curl(x, y, t){
  const u = x/PW + 0.5, v = y/PH + 0.5;
  const amp = 1 + 2.0*(1 - E(t, 83.0, 84.4)) + 2.5*E(t, 85.7, 86.8);
  let z = -0.005*x*x;
  z += amp*0.24*Math.sin(0.30*x + 1.3*t) * (0.35 + 0.65*u);
  z += amp*0.15*Math.sin(0.40*y - 1.0*t + 0.4);
  const cu = Math.max(0, (u-0.72)/0.28), cv = Math.max(0, (0.32-v)/0.32);
  z += (1.6 + 0.4*Math.sin(t*1.4)) * Math.pow(cu*cv, 1.5) * (0.7 + 0.3*amp);
  const tu = Math.max(0, (0.2-u)/0.2), tv = Math.max(0, (v-0.75)/0.25);
  z += 0.9 * Math.pow(tu*tv, 1.5);
  return z;
}

/* 天空相位：87s 前后流动加快到约 2 倍（示意"被气流带着走"），相位连续 */
const RATE = 1.1, RA = 86.8, RD = 1.6;
function skyPhase(t){
  const x = P(t, RA, RA + RD);
  const extra = t <= RA ? 0 : t < RA + RD ? RD*(x*x*x - x*x*x*x/2) : RD*0.5 + (t - RA - RD);
  return t + RATE*extra;
}

V.shot({ id: 's09', start: 83, end: 91, origin: [0, 0, 0], useWorld: true,
  build(ctx){
    const s = ctx.state, R = V.rng(90924);

    /* ===== 论文首页 ===== */
    const bg = document.createElement('canvas'); bg.width = CW; bg.height = CH;
    {
      const c = bg.getContext('2d');
      V.drawPaper(c, CW, CH);
      const r2 = V.rng(2024);
      for (let i=0;i<20;i++){ c.fillStyle = `rgba(120,88,40,${0.02 + r2()*0.035})`; c.beginPath(); c.arc(r2()*CW, r2()*CH, 4 + r2()*20, 0, 7); c.fill(); }
      c.save(); c.font = `600 50px ${V.FONT.SANS}`; c.fillStyle = '#6e5e46'; c.textAlign = 'center'; c.textBaseline = 'middle';
      if ('letterSpacing' in c) c.letterSpacing = '5px';
      c.fillText('SEPTEMBER 2024 · PHYSICS OF FLUIDS 36(9)', CW/2, 92); c.restore();
      c.fillStyle = 'rgba(42,34,24,.4)'; c.fillRect(110, 136, CW-220, 2);
      V.txt(c, 'Hidden turbulence in', CW/2, 222, `italic 600 104px ${V.FONT.GARA}`, INK);
      V.txt(c, "van Gogh's The Starry Night", CW/2, 330, `italic 600 104px ${V.FONT.GARA}`, INK);
      V.txt(c, 'Y. Ma, W. Cheng, S. Huang, F. G. Schmitt, X. Lin, Y. Huang', CW/2, 426, `500 66px ${V.FONT.GARA}`, '#44352a');
      V.txt(c, '厦门大学 · Xiamen University', CW/2, 508, `700 76px ${V.FONT.SANS}`, '#463628');
      c.fillStyle = 'rgba(42,34,24,.35)'; c.fillRect(110, 562, CW-220, 2);
      // 摘要（灰色示意条）
      const r3 = V.rng(36);
      for (let i=0;i<9;i++){ const w = i === 8 ? 420 : 1080 - r3()*60; c.fillStyle = 'rgba(70,58,44,.22)'; c.fillRect(120, 612 + i*40, w, 15); }
      // 右侧插图：程序化《星月夜》缩略图（静态）
      c.save(); c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 12; c.fillStyle = '#fff'; c.fillRect(1354, 596, 512, 412*0.8 + 18); c.restore();
      V.paint2d.drawStarry(c, 2.0, 1610, 605 + 0.4*494, 494, {});
      c.fillStyle = 'rgba(70,58,44,.22)'; c.fillRect(1360, 950, 380, 12); c.fillRect(1360, 972, 300, 12);
    }
    const drawPage = (c, Wc, Hc, t) => { c.drawImage(bg, 0, 0); V.drawSeal(c, 1300, 900, '星月夜', E(t, 84.6, 85.15), 76); };
    s.card = V.card({ w: PW, h: PH, px: CW, draw: drawPage, doubleSide: false });
    const geo = new THREE.PlaneGeometry(PW, PH, 44, 24);
    s.card.mesh.geometry.dispose(); s.card.mesh.geometry = geo;
    s.card.mesh.material.side = THREE.FrontSide;
    s.card.mesh.material.vertexColors = true; s.card.mesh.material.needsUpdate = true;
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count*3).fill(1), 3));
    s.back = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xc9bda4, side: THREE.BackSide }));
    s.paper = new THREE.Group(); s.paper.add(s.card.mesh); s.paper.add(s.back);
    ctx.group.add(s.paper);
    s.geo = geo; s.geoBase = Float32Array.from(geo.attributes.position.array);

    /* ===== 测量线（金色笔触段 + 发光底） ===== */
    const F = V.world.features.slice(0, NF);
    s.F = F;
    s.segs = [];
    F.forEach((f, fi) => {
      const L = 2*f.rW, n = Math.max(5, Math.round(L/4.2));
      for (let j=0;j<n;j++) s.segs.push({ fi, u: (j + 0.5)/n - 0.5, len: L/n*1.55, wid: 1.25 + 0.25*R(), sh: (R()-0.5)*0.25,
        col: V.hex(['#E8C547', '#f1d36a', '#e0b638', '#f4dc80'][Math.floor(R()*4)]) });
    });
    s.line = new V.Strokes(s.segs.length + NF*2, { renderOrder: 8, depthTest: false });
    s.lineGlow = new V.Strokes(NF, { additive: true, shape: 'glow', renderOrder: 7, depthTest: false });
    ctx.group.add(s.lineGlow.mesh); ctx.group.add(s.line.mesh);
    // 尺寸标签：Canvas 贴图，朝向相机
    s.labels = F.map(f => {
      const txt = (f.r*2*92.1).toFixed(1) + ' cm';
      const card = V.card({ w: 3.2, h: 1.2, px: 384, depthWrite: false, draw(c, W, H){
        c.fillStyle = 'rgba(8,12,30,.72)'; V.roundRect(c, 6, 10, W-12, H-20, 22); c.fill();
        c.strokeStyle = 'rgba(232,197,71,.85)'; c.lineWidth = 3; V.roundRect(c, 6, 10, W-12, H-20, 22); c.stroke();
        V.txt(c, txt, W/2, H/2 + 3, `700 84px ${V.FONT.SANS}`, '#FFF6D8');
      }});
      card.mesh.material.depthTest = false; card.mesh.renderOrder = 9;
      ctx.group.add(card.mesh);
      return card;
    });

    /* ===== 示踪粒子：沿漩涡/月/星流动的白色光点 ===== */
    const tr = [];
    const weights = F.map(f => f.k === 'swirl' ? (f === F[0] ? 0.42 : 0.30) : f.k === 'moon' ? 0.12 : 0.016);
    const wsum = weights.reduce((a, b) => a + b, 0);
    for (let i=0;i<190;i++){
      let r = R()*wsum, fi = 0; while (r > weights[fi]) { r -= weights[fi]; fi++; }
      const f = F[fi], q = 0.18 + Math.sqrt(R())*1.15;
      tr.push({ fi, q, a0: R()*Math.PI*2, w: f.s*(0.10 + 0.22*(1 - Math.min(q, 1.7)/1.7)), off: 3 + R()*4, size: 1.2 + 0.6*R(), key: R(), tw: R()*6.28 });
    }
    s.tr = tr;
    s.TAIL = 9;                                                 // 每个示踪点带一条沿圆周弯曲的彗尾
    s.trS = new V.Strokes(tr.length*s.TAIL, { additive: true, shape: 'glow', renderOrder: 1.5 });   // 画在天空之后、柏树/山之前：被柏树挡住，不会浮在前景上
    ctx.group.add(s.trS.mesh);

    /* ===== 镜头路径：样条 + 速度曲线（数值积分，结果只由 t 决定） ===== */
    s.curve = new THREE.CatmullRomCurve3([
      V.v3(10, 24.4, 67.2), V.v3(4.6, 23.7, 65.6), V.v3(-0.6, 22.8, 63.6),
      V.v3(-1.6, 19.2, 66.8), V.v3(-1.8, 15.8, 69.2),
      V.v3(0.7, 15.0, 67.6), V.v3(3.8, 14.2, 64.6),
    ], false, 'centripetal');
    s.curveLen = s.curve.getLength();
    const speed = t => lerp(4.3, 2.0, smooth(P(t, 85.6, 87.4))) + 3.0*Math.pow(Math.sin(Math.PI*P(t, 85.5, 87.3)), 2);
    const N = 480, h = 8/N; s.cum = new Float32Array(N + 1);
    for (let i=1;i<=N;i++){ const ta = 83 + (i-1)*h; s.cum[i] = s.cum[i-1] + h*(speed(ta) + 4*speed(ta + h/2) + speed(ta + h))/6; }
    s.cumN = N;
    s.camAt = t => {
      const fi = clamp((t - 83)/8*N, 0, N), i0 = Math.floor(fi), i1 = Math.min(i0 + 1, N);
      return s.curve.getPointAt(clamp(lerp(s.cum[i0], s.cum[i1], fi - i0)/s.cum[N], 0, 1));
    };
    s.paperHome = V.v3(1.5, 36.5, 35);
    s.tgtAt = t => {
      const paperTgt = s.paperHome.clone().add(V.v3(0.6, -3.6, 0));
      const paint = V.T0.clone().add(V.v3(lerp(-1.5, 3, P(t, 86.5, 91)), 9.5, 0));
      return paperTgt.lerp(paint, E(t, 85.6, 87.4));
    };
    s.fovAt = t => lerp(48, lerp(56, 54.5, E(t, 87.2, 91)), E(t, 85.6, 87.4));
    /* 每条测量线在切平面内取一个方向，使它在测量段中途的镜头里接近水平（避免透视造成的歪斜） */
    {
      const rc = new THREE.PerspectiveCamera(s.fovAt(89.3), 1920/1080, 0.1, 6000);
      rc.position.copy(s.camAt(89.3)); rc.lookAt(s.tgtAt(89.3)); rc.updateMatrixWorld(); rc.updateProjectionMatrix();
      s.dirs = F.map(f => {
        let best = null, bs = 1e9;
        for (let th = -0.9; th <= 0.9; th += 0.005){
          const d = f.e1.clone().multiplyScalar(Math.cos(th)).addScaledVector(f.e2, Math.sin(th));
          const a = f.C.clone().addScaledVector(d, -f.rW).project(rc), b = f.C.clone().addScaledVector(d, f.rW).project(rc);
          const sl = Math.abs((b.y - a.y)*1080/((b.x - a.x)*1920 + 1e-6));
          if (sl < bs){ bs = sl; best = d; }
        }
        const up = new THREE.Vector3().crossVectors(f.n, best).normalize();   // 切平面内与测量线垂直
        const a = f.C.clone().project(rc), b = f.C.clone().add(up).project(rc);
        if (b.y < a.y) up.negate();                                          // 让 up 在屏幕上朝上
        return { d: best, up };
      });
    }
  },

  update(t, lt, ctx){
    const s = ctx.state;
    const ph = skyPhase(t);
    V.world.set({ reveal: 1, phase: ph, opacity: 1 });

    /* ---------- 镜头 ---------- */
    const cam = s.camAt(t);
    cam.y += 0.18*Math.sin(t*0.9);
    V.setCam(cam, s.tgtAt(t), s.fovAt(t), 0.03*Math.sin(t*0.5)*(1 - E(t, 86.5, 88)));

    /* ---------- 纸张 ---------- */
    const pin = easeOut(P(t, 82.7, 84.4)), fly = easeIn(P(t, 85.75, 87.35));
    const home = s.paperHome;
    const camRef = s.camAt(Math.min(t, 85.6));
    const face = 0.35*Math.atan2(camRef.x - home.x, camRef.z - home.z) + 0.04;   // 只部分转向镜头：横移时纸面相对镜头转过约 12°，有空间感
    const tiltUp = 0.75*Math.atan2(home.y - camRef.y, Math.hypot(camRef.x - home.x, camRef.z - home.z));   // 纸面微微朝下对着镜头
    s.paper.visible = fly < 0.999;
    s.paper.position.set(home.x + lerp(-4, 0, pin) + 36*fly, home.y + lerp(-9, 0, pin) + 0.3*Math.sin(t*0.8) + 15*fly, home.z + lerp(-10, 0, pin) + 27*fly);
    s.paper.rotation.set(lerp(-0.9, 0, pin) + tiltUp + 0.025*Math.sin(t*0.6) - 0.9*fly,
                         face + lerp(-0.5, 0, pin) + 0.03*Math.sin(t*0.5) - 1.4*fly,
                         lerp(-0.3, 0, pin) + 0.015*Math.sin(t*0.45) - 0.6*fly, 'YXZ');
    const pa = s.geo.attributes.position, b = s.geoBase, col = s.geo.attributes.color;
    for (let i=0;i<pa.count;i++){
      const px = b[i*3], py = b[i*3+1];
      const z = curl(px, py, t) + 2.2*fly*Math.sin(px*0.22 + t*4);
      pa.array[i*3+2] = z;
      const zx = curl(px + 0.4, py, t) - curl(px - 0.4, py, t), zy = curl(px, py + 0.4, t) - curl(px, py - 0.4, t);
      const sh = clamp(0.97 - 0.55*zx + 0.35*zy, 0.72, 1.04);
      col.array[i*3] = sh; col.array[i*3+1] = sh; col.array[i*3+2] = sh*0.985;
    }
    pa.needsUpdate = true; col.needsUpdate = true;
    const tq = Math.round(t*30)/30, key = E(tq, 84.6, 85.15).toFixed(3);
    if (s.lastKey !== key){ s.card.redraw(tq); s.lastKey = key; }

    /* ---------- 测量线 ---------- */
    const L = s.line, G = s.lineGlow, F = s.F;
    const camPos = V.camera.position;
    let n = 0;
    const tmp = new THREE.Vector3();
    const ks = F.map((f, i) => E(t, MT0 + i*MDT, MT0 + i*MDT + MGROW));
    for (const sg of s.segs){
      const f = F[sg.fi], k = ks[sg.fi];
      const reach = Math.abs(sg.u)*2;                     // 从中心向两端长出
      const a = clamp((k*1.04 - reach)*8, 0, 1);
      if (a <= 0){ L.hide(n++); continue; }
      const D = s.dirs[sg.fi];
      tmp.copy(f.C).addScaledVector(f.n, -6).addScaledVector(D.d, sg.u*2*f.rW).addScaledVector(D.up, sg.sh);
      L.set(n++, tmp.x, tmp.y, tmp.z, D.d.x, D.d.y, D.d.z, sg.len, sg.wid, sg.col, a);
    }
    F.forEach((f, i) => {
      const k = ks[i], ta = clamp((k - 0.8)/0.2, 0, 1);
      const tl = Math.max(f.rW*0.34, 5);
      for (const sgn of [-1, 1]){
        if (ta <= 0){ L.hide(n++); continue; }
        const D = s.dirs[i];
        tmp.copy(f.C).addScaledVector(f.n, -6).addScaledVector(D.d, sgn*f.rW);
        L.set(n++, tmp.x, tmp.y, tmp.z, D.up.x, D.up.y, D.up.z, tl*ta, 1.3, [0.93, 0.80, 0.33], 1);
      }
      if (k <= 0) G.hide(i);
      else { const D = s.dirs[i]; tmp.copy(f.C).addScaledVector(f.n, -6.5); G.set(i, tmp.x, tmp.y, tmp.z, D.d.x, D.d.y, D.d.z, 2*f.rW*k + 6, 7, [0.95, 0.72, 0.25], 0.42*k); }
      // 标签：朝向相机；按距离缩放，屏幕上字号基本一致
      const lab = s.labels[i];
      const la = clamp((k - 0.35)/0.5, 0, 1);
      lab.opacity = la;
      if (la > 0){
        const d = tmp.copy(f.C).sub(camPos).length();
        const sc = d*0.05;
        // 标签位置：大漩涡（21.2 cm）放在线下方（放上方会和 6.4 cm 的星标签叠在一起）；
        // 第二个漩涡（15.7 cm）放在线上方（放下方会盖住 21.2 cm 那条线的右端刻度）；月亮和星放在光晕下方。
        const off = f.k === 'swirl' ? (i === 1 ? f.rW*0.2 + sc*0.6 + 1.5 : -(f.rW*0.22 + sc*0.6 + 1.5)) : -(f.rW*0.5 + sc*0.6 + 1.5);
        tmp.copy(f.C).addScaledVector(f.n, -7).addScaledVector(s.dirs[i].up, off);
        lab.mesh.position.copy(tmp);
        lab.mesh.quaternion.copy(V.camera.quaternion);
        lab.mesh.scale.setScalar(sc*lerp(0.85, 1, easeOut(la)));
      }
    });
    L.commit(); G.commit();

    /* ---------- 示踪粒子 ---------- */
    const T = s.trS, trK = E(t, 86.9, 87.9);
    let m = 0;
    const span = 1.6*(1 + RATE*smooth(P(t, RA, RA + RD)));        // 彗尾对应的相位跨度（秒）
    for (const d of s.tr){
      const f = F[d.fi];
      const al = trK*clamp((trK*1.1 - d.key)*6, 0, 1)*(0.8 + 0.2*Math.sin(t*3 + d.tw));
      const r = d.q*f.rW;
      const segA = Math.abs(d.w)*span/(s.TAIL - 1)*r;                 // 每段弧长
      for (let j=0;j<s.TAIL;j++){
        if (al <= 0){ T.hide(m++); continue; }
        const a = d.a0 + d.w*(ph - span*j/(s.TAIL - 1)), ca = Math.cos(a), sa = Math.sin(a);
        tmp.copy(f.C).addScaledVector(f.n, -d.off).addScaledVector(f.e1, ca*r).addScaledVector(f.e2, sa*r);
        const fade = 1 - j/s.TAIL;
        if (j === 0){ T.set(m++, tmp.x, tmp.y, tmp.z, 1, 0, 0, d.size*2.6, d.size*2.6, [1.0, 0.98, 0.92], al); continue; }
        const sg = Math.sign(d.w);
        const dx = (-f.e1.x*sa + f.e2.x*ca)*sg, dy = (-f.e1.y*sa + f.e2.y*ca)*sg, dz = (-f.e1.z*sa + f.e2.z*ca)*sg;
        T.set(m++, tmp.x, tmp.y, tmp.z, dx, dy, dz, segA*2.2 + d.size, d.size*(1.3*fade + 0.35), [0.80, 0.90, 1.0], al*0.6*fade);
      }
    }
    T.commit();
  },
});
})();

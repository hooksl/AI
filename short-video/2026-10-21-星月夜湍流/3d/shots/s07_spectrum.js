/* s07_spectrum · 62–71s · −5/3 频谱（非世界镜头）
   62–67  漂浮在星空中的 3D 双对数坐标图（发光细轴 + 刻度 + 对数网格背板 + 地面网格），
          金色发光管从左上向右下生长（62.4–65.4），64.6–65.6 金点 +「斜率 −5/3」；镜头绕图缓慢环绕约 40°。
   67–71  三个笔触小球依次浮现（67.2 / 68.1 / 69.0）：大气（带旋转云笔触的小地球）、海洋（浪纹）、星际气体（紫色星云），
          各自用细光线连到那条直线上，并打 ✓。
   本文件同时定义可复用组件 V.lib.chart / V.lib.label / V.lib.dust（s10 复用）。 */
(function(){
const { E, P, lerp, clamp, vis, easeOut, easeIn, smooth } = V;
const D2R = Math.PI/180;
const SANS = V.FONT.SANS, GARA = V.FONT.GARA;

/* =====================================================================
   V.lib.label —— 3D 文字卡片（默认朝向相机、画在最上层）
   o: { w, h, px, lines:[{text, font, color, y(0..1), align, x(0..1)}], bg, border, check:{x,y,size,color}, billboard, depthTest, renderOrder }
   ===================================================================== */
V.lib.label = function(o){
  const drawCheck = (c, cx, cy, s, col, k=1) => {
    if (k <= 0) return;
    c.save(); c.strokeStyle = col; c.lineWidth = s*0.16; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    const a = [cx - s*0.42, cy + s*0.02], b = [cx - s*0.12, cy + s*0.34], d = [cx + s*0.46, cy - s*0.38];
    const L1 = Math.hypot(b[0]-a[0], b[1]-a[1]), L2 = Math.hypot(d[0]-b[0], d[1]-b[1]), q = k*(L1 + L2);
    c.moveTo(a[0], a[1]);
    if (q <= L1) c.lineTo(a[0] + (b[0]-a[0])*q/L1, a[1] + (b[1]-a[1])*q/L1);
    else { c.lineTo(b[0], b[1]); const r = (q - L1)/L2; c.lineTo(b[0] + (d[0]-b[0])*r, b[1] + (d[1]-b[1])*r); }
    c.stroke(); c.restore();
  };
  const card = V.card({ w: o.w, h: o.h, px: o.px || 512, depthWrite: false, draw(c, W, H, t){
    if (o.bg){
      const r = Math.min(W, H)*0.22;
      c.fillStyle = o.bg; V.roundRect(c, 6, 6, W-12, H-12, r); c.fill();
      if (o.border){ c.strokeStyle = o.border; c.lineWidth = Math.max(2, H*0.025); V.roundRect(c, 6, 6, W-12, H-12, r); c.stroke(); }
    }
    for (const l of o.lines || []){
      c.save();
      if (l.glow){ c.shadowColor = l.glow; c.shadowBlur = H*0.12; }
      V.txt(c, l.text, (l.x ?? 0.5)*W, (l.y ?? 0.5)*H, l.font, l.color, l.align || 'center');
      c.restore();
    }
    if (o.check) drawCheck(c, o.check.x*W, o.check.y*H, o.check.size*H, o.check.color || V.COL.gold, o.check.k ?? 1);
  }});
  card.mesh.material.depthTest = o.depthTest ?? false;
  card.mesh.renderOrder = o.renderOrder ?? 10;
  card.billboard = o.billboard ?? true;
  card.o = o;
  return card;
};
/* 让卡片（或任意 Object3D）正面朝向相机：考虑父级的世界旋转 */
const _q = new THREE.Quaternion();
V.lib.faceCam = function(obj){
  if (obj.parent){ obj.parent.getWorldQuaternion(_q); _q.invert(); obj.quaternion.copy(_q).multiply(V.camera.quaternion); }
  else obj.quaternion.copy(V.camera.quaternion);
};

/* =====================================================================
   V.lib.dust —— 漂浮在空间里的稀疏笔触（前景/背景视差层）
   ===================================================================== */
V.lib.dust = function(n, seed, box, o={}){
  const R = V.rng(seed), d = [];
  const pal = o.pal || [...V.PAL.deep, ...V.PAL.deep, ...V.PAL.mid, ...V.PAL.pale, V.PAL.cream[0], V.PAL.yel[1]];
  for (let i=0;i<n;i++){
    let x, y, z, ok = false;
    for (let k=0;k<30 && !ok;k++){
      x = lerp(box[0], box[1], R()); y = lerp(box[2], box[3], R()); z = lerp(box[4], box[5], R());
      ok = !(o.hole && Math.abs(x - o.hole[0]) < o.hole[3] && Math.abs(y - o.hole[1]) < o.hole[4] && Math.abs(z - o.hole[2]) < o.hole[5]);
    }
    d.push({ x, y, z, a: R()*6.28, w: (0.15 + R()*0.3)*(R()<.5?-1:1), r: 0.6 + R()*1.6, len: (o.len || 2.2)*(0.6 + R()*0.8), wid: (o.wid || 0.55)*(0.7 + R()*0.6),
      col: V.hex(pal[Math.floor(R()*pal.length)]), al: 0.35 + R()*0.5, dz: R()*6.28 });
  }
  const st = new V.Strokes(n, { renderOrder: o.renderOrder ?? 1 });
  return { mesh: st.mesh, st,
    update(t, alpha=1){
      d.forEach((p, i) => {
        const a = p.a + p.w*t;
        const x = p.x + Math.cos(a)*p.r, y = p.y + Math.sin(a)*p.r, z = p.z + 0.6*Math.sin(t*0.4 + p.dz);
        st.set(i, x, y, z, -Math.sin(a)*Math.sign(p.w), Math.cos(a)*Math.sign(p.w), 0.15, p.len, p.wid, p.col, p.al*alpha);
      });
      st.commit();
    } };
};

/* =====================================================================
   V.lib.chart —— 3D 双对数坐标图
   const ch = V.lib.chart({W:60, H:34, Lmin:-4, Lmax:0.9, seed});
   ch.group                  THREE.Group（图心在原点，图面为 z=0，正面朝 +z）
   ch.x(X) ch.y(L) ch.p(X,L,z)   数据 → 局部坐标（X: 0..3 个数量级，L: log 能量）
   ch.frame(t, {axes, grid, alpha})  每帧调用：坐标轴生长进度、网格可见度、整体透明度
   ch.line(fn, X0, X1, {radius, n, sheath, pal})  发光管曲线 → {set({prog, alpha, color(X)→rgb, halo(X)→0..1, head})}
   ch.dashed(fn, X0, X1, {dash, gap, wid, color}) 笔触虚线 → {set({prog, alpha, color})}
   ch.face()                 每帧在设置相机之后调用：让朝向相机的标签转向相机
   ===================================================================== */
const TUBE_VS = `
attribute vec3 aCol;
varying vec3 vN; varying vec3 vV; varying vec3 vC;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  vC = aCol;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const TUBE_FS = `
uniform float uOpacity; uniform float uHalo; uniform float uCore;
varying vec3 vN; varying vec3 vV; varying vec3 vC;
void main(){
  float f = abs(dot(normalize(vN), normalize(vV)));
  if (uHalo > 0.5){
    float a = pow(f, 2.2) * uOpacity;
    gl_FragColor = vec4(vC, a);
  } else {
    vec3 c = mix(vC*0.62, mix(vC, vec3(1.0), uCore), pow(f, 1.6));
    gl_FragColor = vec4(c, uOpacity);
  }
}`;
function tubeMat(halo){
  return new THREE.ShaderMaterial({ vertexShader: TUBE_VS, fragmentShader: TUBE_FS,
    uniforms: { uOpacity: {value: 1}, uHalo: {value: halo ? 1 : 0}, uCore: {value: 0.5} },
    transparent: true, depthWrite: !halo, blending: halo ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.FrontSide });
}
/* 平面曲线（z 近似常数）的管：每个点一圈，按点序可截取 */
function tubeGeo(pts, radius, R){
  const N = pts.length;
  const pos = new Float32Array(N*R*3), nrm = new Float32Array(N*R*3), col = new Float32Array(N*R*3).fill(1);
  const T = new THREE.Vector3(), B = new THREE.Vector3(), Nn = new THREE.Vector3(), Z = new THREE.Vector3(0,0,1), d = new THREE.Vector3();
  for (let i=0;i<N;i++){
    T.subVectors(pts[Math.min(N-1, i+1)], pts[Math.max(0, i-1)]).normalize();
    B.crossVectors(T, Z).normalize(); Nn.crossVectors(B, T).normalize();
    for (let j=0;j<R;j++){
      const th = j/R*Math.PI*2;
      d.copy(Nn).multiplyScalar(Math.cos(th)).addScaledVector(B, Math.sin(th));
      const k = (i*R + j)*3;
      pos[k] = pts[i].x + d.x*radius; pos[k+1] = pts[i].y + d.y*radius; pos[k+2] = pts[i].z + d.z*radius;
      nrm[k] = d.x; nrm[k+1] = d.y; nrm[k+2] = d.z;
    }
  }
  const idx = [];
  for (let i=0;i<N-1;i++) for (let j=0;j<R;j++){
    const a = i*R + j, b = i*R + (j+1)%R, c = (i+1)*R + j, e = (i+1)*R + (j+1)%R;
    idx.push(a, c, b, b, c, e);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

V.lib.chart = function(o = {}){
  const W = o.W ?? 60, H = o.H ?? 34, Lmin = o.Lmin ?? -4.0, Lmax = o.Lmax ?? 0.9, XM = 3;
  const FZ0 = o.floorZ0 ?? -10, FZ1 = o.floorZ1 ?? 18, FY = -H/2 - (o.floorDrop ?? 5);
  const g = new THREE.Group();
  const x = X => (X/XM - 0.5)*W, y = L => ((L - Lmin)/(Lmax - Lmin) - 0.5)*H;
  const p = (X, L, z=0) => new THREE.Vector3(x(X), y(L), z);
  const x0 = -W/2, y0 = -H/2;
  const ch = { group: g, W, H, Lmin, Lmax, x, y, p, x0, y0, FY, faceList: [], cards: [] };
  const seed = o.seed ?? 5150;

  /* ---- 背板：柔边深蓝底 + 笔触纹理 + 对数网格 ---- */
  const PW = W + 12, PH = H + 12;
  const panel = V.card({ w: PW, h: PH, px: 2048, depthWrite: false, draw(c, Wc, Hc){
    const s = Wc/PW, cx = u => (u + PW/2)*s, cy = v => (PH/2 - v)*s;
    const R = V.rng(seed);
    // 柔边暗底（保证曲线和字的对比）
    for (let i=0;i<3;i++){
      const grd = c.createRadialGradient(Wc/2, Hc/2, Hc*0.15, Wc/2, Hc/2, Wc*0.58);
      grd.addColorStop(0, 'rgba(6,10,30,0.46)'); grd.addColorStop(0.72, 'rgba(6,10,30,0.36)'); grd.addColorStop(1, 'rgba(6,10,30,0)');
      c.fillStyle = grd; c.fillRect(0, 0, Wc, Hc);
    }
    // 笔触纹理（星月夜深蓝，沿缓慢的旋流方向）
    c.lineCap = 'round';
    const pal = [...V.PAL.deep, ...V.PAL.deep, V.PAL.mid[0], V.PAL.mid[1]];
    for (let i=0;i<2600;i++){
      const px = R()*Wc, py = R()*Hc, dx = px/Wc - 0.5, dy = py/Hc - 0.5;
      const fall = clamp(1 - Math.pow(Math.max(Math.abs(dx)*2, Math.abs(dy)*2), 3), 0, 1);
      if (fall <= 0.02) continue;
      const ang = 0.5*Math.sin(px*0.004 + py*0.006) + 0.35*Math.sin(py*0.011) + (R() - 0.5)*0.5;
      const len = 18 + R()*34, wd = 5 + R()*6;
      c.strokeStyle = pal[Math.floor(R()*pal.length)]; c.globalAlpha = (0.10 + R()*0.16)*fall; c.lineWidth = wd;
      c.beginPath(); c.moveTo(px - Math.cos(ang)*len/2, py - Math.sin(ang)*len/2); c.lineTo(px + Math.cos(ang)*len/2, py + Math.sin(ang)*len/2); c.stroke();
    }
    c.globalAlpha = 1;
    const vline = (X, a, w) => { c.strokeStyle = `rgba(176,204,226,${a})`; c.lineWidth = w; c.beginPath(); c.moveTo(cx(x(X)), cy(y0)); c.lineTo(cx(x(X)), cy(y0 + H)); c.stroke(); };
    const hline = (L, a, w) => { c.strokeStyle = `rgba(176,204,226,${a})`; c.lineWidth = w; c.beginPath(); c.moveTo(cx(x0), cy(y(L))); c.lineTo(cx(x0 + W), cy(y(L))); c.stroke(); };
    for (let d=0; d<3; d++) for (let k=2;k<10;k++) vline(d + Math.log10(k), 0.075, 1.5);
    for (let L = Math.floor(Lmin); L < Lmax; L++) for (let k=2;k<10;k++){ const LL = L + Math.log10(k); if (LL > Lmin && LL < Lmax) hline(LL, 0.075, 1.5); }
    for (let X=1; X<=3; X++) vline(X, 0.2, 2.5);
    for (let L = Math.ceil(Lmin) + (Math.ceil(Lmin) === Lmin ? 1 : 0); L < Lmax; L++) hline(L, 0.2, 2.5);
  }});
  panel.mesh.position.z = -0.3; panel.mesh.renderOrder = -0.5;
  g.add(panel.mesh); ch.panel = panel;

  /* ---- 地面网格：图下方向镜头延伸的淡网格（增强立体感） ---- */
  const FW = W + 16, FD = FZ1 - FZ0;
  const floor = V.card({ w: FW, h: FD, px: 1536, depthWrite: false, draw(c, Wc, Hc){
    const s = Wc/FW, cx = u => (u + FW/2)*s, cz = v => (v - FZ0)*s;     // canvas y = z（向镜头）
    for (let zz = Math.ceil(FZ0/2)*2; zz <= FZ1; zz += 2){
      const fz = Math.sin(Math.PI*clamp((zz - FZ0)/FD, 0, 1));
      const grd = c.createLinearGradient(0, 0, Wc, 0);
      grd.addColorStop(0, 'rgba(168,196,220,0)'); grd.addColorStop(0.15, `rgba(168,196,220,${0.16*fz})`);
      grd.addColorStop(0.85, `rgba(168,196,220,${0.16*fz})`); grd.addColorStop(1, 'rgba(168,196,220,0)');
      c.strokeStyle = grd; c.lineWidth = 2; c.beginPath(); c.moveTo(0, cz(zz)); c.lineTo(Wc, cz(zz)); c.stroke();
    }
    for (let X=0; X<=3; X += 0.5){
      const grd = c.createLinearGradient(0, 0, 0, Hc);
      const a = X % 1 === 0 ? 0.22 : 0.1;
      grd.addColorStop(0, 'rgba(168,196,220,0)'); grd.addColorStop(0.3, `rgba(168,196,220,${a})`);
      grd.addColorStop(0.7, `rgba(168,196,220,${a})`); grd.addColorStop(1, 'rgba(168,196,220,0)');
      c.strokeStyle = grd; c.lineWidth = X % 1 === 0 ? 3 : 2; c.beginPath(); c.moveTo(cx(x(X)), 0); c.lineTo(cx(x(X)), Hc); c.stroke();
    }
  }});
  floor.mesh.rotation.x = -Math.PI/2;                 // canvas 向下 = +z
  floor.mesh.position.set(0, FY, (FZ0 + FZ1)/2);
  floor.mesh.renderOrder = -0.6;
  g.add(floor.mesh); ch.floor = floor;

  /* ---- 坐标轴：发光细线（细圆柱 + 辉光笔触）+ 刻度 ---- */
  const axMat = new THREE.MeshBasicMaterial({ color: 0xfdf3d0, transparent: true });
  const cyl = (r) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 10, 1), axMat);
  const XL = W + 2.4, YL = H + 2.4;
  const xAx = cyl(0.13), yAx = cyl(0.13);
  xAx.rotation.z = -Math.PI/2; g.add(xAx); g.add(yAx);
  const tipX = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.3, 12), axMat); tipX.rotation.z = -Math.PI/2; g.add(tipX);
  const tipY = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.3, 12), axMat); g.add(tipY);
  const ticks = [];
  for (let X=0; X<=3; X++){ const m = cyl(0.09); m.scale.y = 1.1; m.position.set(x(X), y0 - 0.55, 0); g.add(m); ticks.push({ m, at: (x(X) - x0)/XL }); }
  for (let L = Math.ceil(Lmin) + 1; L < Lmax; L++){ const m = cyl(0.09); m.rotation.z = Math.PI/2; m.scale.y = 1.1; m.position.set(x0 - 0.55, y(L), 0); g.add(m); ticks.push({ m, at: (y(L) - y0)/YL }); }
  // 小刻度（每个数量级内的对数位置）
  for (let d=0; d<3; d++) for (let k=2;k<10;k++){ const X = d + Math.log10(k); const m = cyl(0.06); m.scale.y = 0.55; m.position.set(x(X), y0 - 0.28, 0); g.add(m); ticks.push({ m, at: (x(X) - x0)/XL }); }
  const axGlowN = 90;
  const axGlow = new V.Strokes(axGlowN, { additive: true, shape: 'glow', renderOrder: 2 });
  g.add(axGlow.mesh);
  ch.axMat = axMat;

  /* ---- 轴标签（图面内的 3D 卡片） ---- */
  const LS = o.labelSize ?? 2.5;                     // 轴标签字高（世界单位）
  const axLab = (text, w, align) => {
    const cd = V.lib.label({ w, h: LS*1.45, px: 640, billboard: false, depthTest: true, renderOrder: 3,
      lines: [{ text, font: `700 ${Math.round(640/w*LS)}px ${SANS}`, color: '#e6ebf4', align, x: align === 'left' ? 0.03 : align === 'right' ? 0.97 : 0.5, y: 0.54 }] });
    g.add(cd.mesh); ch.cards.push(cd); return cd;
  };
  ch.labE = axLab('能量', LS*2.6, 'right');      ch.labE.mesh.position.set(x0 - LS*1.45, y0 + H + 0.6, 0.2);
  ch.labBig = axLab('大漩涡', LS*3.8, 'left');   ch.labBig.mesh.position.set(x0 + LS*1.9 - 0.6, y0 - LS*1.05, 0.2);
  ch.labSmall = axLab('小漩涡 →', LS*5.2, 'right'); ch.labSmall.mesh.position.set(x0 + W - LS*2.6 + 1.6, y0 - LS*1.05, 0.2);

  ch.frame = function(t, f = {}){
    const ka = f.axes ?? 1, ga = f.grid ?? 1, al = f.alpha ?? 1;
    const kx = clamp(ka*1.25, 0, 1), ky = clamp(ka*1.25 - 0.25, 0, 1);
    xAx.visible = kx > 0.001; yAx.visible = ky > 0.001;
    xAx.scale.y = XL*kx; xAx.position.set(x0 + XL*kx/2, y0, 0);
    yAx.scale.y = YL*ky; yAx.position.set(x0, y0 + YL*ky/2, 0);
    tipX.visible = kx > 0.98; tipX.position.set(x0 + XL + 0.4, y0, 0);
    tipY.visible = ky > 0.98; tipY.position.set(x0, y0 + YL + 0.4, 0);
    ticks.forEach(tk => { tk.m.visible = (tk.m.rotation.z ? ky : kx) >= tk.at; });
    axMat.opacity = al;
    let n = 0;
    const NX = 54, NY = axGlowN - NX;
    for (let i=0;i<NX;i++){ const u = (i + 0.5)/NX; if (u > kx){ axGlow.hide(n++); continue; }
      axGlow.set(n++, x0 + XL*u, y0, 0, 1, 0, 0, 2.6, 1.5, [1.0, 0.86, 0.55], 0.20*al); }
    for (let i=0;i<NY;i++){ const u = (i + 0.5)/NY; if (u > ky){ axGlow.hide(n++); continue; }
      axGlow.set(n++, x0, y0 + YL*u, 0, 0, 1, 0, 2.6, 1.5, [1.0, 0.86, 0.55], 0.20*al); }
    axGlow.commit();
    panel.opacity = ga*al; floor.opacity = ga*al*(f.floor ?? 1);
    const la = (f.labels ?? 1)*al;
    ch.labE.opacity = la*clamp(ky*3 - 2, 0, 1); ch.labBig.opacity = la*clamp(kx*4 - 0.3, 0, 1); ch.labSmall.opacity = la*clamp(kx*3 - 2, 0, 1);
  };

  /* ---- 发光管曲线 ---- */
  ch.line = function(fn, X0, X1, lo = {}){
    const n = lo.n || Math.round((X1 - X0)*110), R = lo.radial || 10, rad = lo.radius ?? 0.28, z = lo.z ?? 0.15;
    const Xs = [], pts = [];
    for (let i=0;i<=n;i++){ const X = X0 + (X1 - X0)*i/n; Xs.push(X); pts.push(p(X, fn(X), z)); }
    const core = new THREE.Mesh(tubeGeo(pts, rad, R), tubeMat(false));
    const halo = new THREE.Mesh(tubeGeo(pts, rad*3.4, R), tubeMat(true));
    core.renderOrder = 4; halo.renderOrder = 5;
    g.add(core); g.add(halo);
    const gStep = 3, NG = Math.ceil((n + 1)/gStep);
    const glow = new V.Strokes(NG + 3, { additive: true, shape: 'glow', renderOrder: 6 });
    g.add(glow.mesh);
    // 油画质感：沿曲线的短笔触外衣
    const RS = V.rng(lo.seed ?? 77), sheath = [];
    if (lo.sheath){
      for (let i=0;i<n;i += 1){ for (let k=0;k<(lo.sheathK ?? 1);k++)
        sheath.push({ i: Math.min(n, i + Math.floor(RS()*2)), off: (RS() - 0.5)*rad*2.2, oz: (RS() - 0.5)*rad*1.5, len: rad*(4 + RS()*4), wid: rad*(1.3 + RS()*0.9), v: 0.75 + RS()*0.45, key: RS() }); }
    }
    const sh = new V.Strokes(Math.max(1, sheath.length), { renderOrder: 5 });
    g.add(sh.mesh);
    const T = Xs.map((_, i) => { const a = pts[Math.max(0, i-1)], b = pts[Math.min(n, i+1)]; return b.clone().sub(a).normalize(); });
    const NRM = T.map(tt => V.v3(-tt.y, tt.x, 0));
    const colA = core.geometry.attributes.aCol, colH = halo.geometry.attributes.aCol;
    const api = { core, halo, glow, sh, Xs, pts, n, T,
      at(X){ const i = clamp(Math.round((X - X0)/(X1 - X0)*n), 0, n); return pts[i].clone(); },
      set(s){
        const prog = clamp(s.prog ?? 1, 0, 1), al = s.alpha ?? 1;
        const colF = s.color || (() => [1, 1, 1]), haloF = s.halo || (() => 0.5);
        const iEnd = prog*n, cnt = Math.floor(iEnd);
        core.geometry.setDrawRange(0, cnt*R*6); halo.geometry.setDrawRange(0, cnt*R*6);
        const vis_ = cnt > 0 && al > 0.002;
        core.visible = halo.visible = vis_;
        core.material.uniforms.uOpacity.value = al; halo.material.uniforms.uOpacity.value = al*(s.haloK ?? 0.55);
        const cache = [];
        for (let i=0;i<=n;i++){
          const c = colF(Xs[i]), h = haloF(Xs[i]); cache.push(c);
          for (let j=0;j<R;j++){ const k = (i*R + j)*3;
            colA.array[k] = c[0]; colA.array[k+1] = c[1]; colA.array[k+2] = c[2];
            colH.array[k] = c[0]*h; colH.array[k+1] = c[1]*h; colH.array[k+2] = c[2]*h; }
        }
        colA.needsUpdate = true; colH.needsUpdate = true;
        let m = 0;
        for (let i=0;i<=n;i += gStep){
          if (i > iEnd || !vis_){ glow.hide(m++); continue; }
          const c = cache[i], h = haloF(Xs[i]), q = pts[i];
          glow.set(m++, q.x, q.y, q.z, T[i].x, T[i].y, 0, rad*12, rad*9, c, (s.glowK ?? 0.16)*h*al);
        }
        // 生长端的亮头
        for (let k=0;k<3;k++){
          const hk = (s.head ?? 0)*al;
          if (!vis_ || hk <= 0 || prog >= 1){ glow.hide(m++); continue; }
          const q = pts[Math.min(n, cnt)];
          glow.set(m++, q.x, q.y, q.z, 1, 0, 0, rad*[8, 20, 42][k], rad*[8, 20, 42][k], k === 0 ? [1, 1, 1] : cache[Math.min(n, cnt)], hk*[1, 0.55, 0.22][k]);
        }
        glow.commit();
        if (sheath.length){
          sheath.forEach((d, j) => {
            if (d.i > iEnd || !vis_){ sh.hide(j); return; }
            const q = pts[d.i], tt = T[d.i], nn = NRM[d.i], c = cache[d.i];
            const rr = clamp((iEnd - d.i)/6, 0, 1);
            sh.set(j, q.x + nn.x*d.off, q.y + nn.y*d.off, q.z + d.oz + rad*0.6, tt.x, tt.y, 0, d.len*rr, d.wid, [c[0]*d.v, c[1]*d.v, c[2]*d.v], (s.sheathA ?? 0.9)*al);
          });
          sh.commit();
        } else sh.mesh.visible = false;
      } };
    return api;
  };

  /* ---- 笔触虚线（两端收尖的短笔触 + 辉光） ---- */
  ch.dashed = function(fn, X0, X1, lo = {}){
    const dash = lo.dash ?? 1.5, gap = lo.gap ?? 0.9, wid = lo.wid ?? 0.5, z = lo.z ?? 0.1;
    const poly = []; const N = 400;
    for (let i=0;i<=N;i++){ const X = X0 + (X1 - X0)*i/N; poly.push(p(X, fn(X), z)); }
    const cum = [0]; for (let i=1;i<=N;i++) cum.push(cum[i-1] + poly[i].distanceTo(poly[i-1]));
    const Ltot = cum[N], dashes = [];
    const ptAt = s => { let i = 1; while (i < N && cum[i] < s) i++; const f = (s - cum[i-1])/Math.max(1e-6, cum[i] - cum[i-1]); return [poly[i-1].clone().lerp(poly[i], f), poly[i].clone().sub(poly[i-1]).normalize()]; };
    for (let s0 = 0; s0 + dash <= Ltot + 1e-6; s0 += dash + gap){ const [q, d] = ptAt(s0 + dash/2); dashes.push({ q, d, u: (s0 + dash)/Ltot }); }
    const st = new V.Strokes(dashes.length, { renderOrder: 6 });
    const gl = new V.Strokes(dashes.length, { additive: true, shape: 'glow', renderOrder: 6 });
    g.add(gl.mesh); g.add(st.mesh);
    return { st, gl, dashes,
      set(s){
        const prog = s.prog ?? 1, al = s.alpha ?? 1, c = s.color || V.hex(V.COL.gold);
        dashes.forEach((d, i) => {
          const k = clamp((prog - d.u)*Ltot/dash + 1, 0, 1)*al;
          if (k <= 0){ st.hide(i); gl.hide(i); return; }
          st.set(i, d.q.x, d.q.y, d.q.z, d.d.x, d.d.y, d.d.z, dash*1.12, wid, c, k);
          gl.set(i, d.q.x, d.q.y, d.q.z, d.d.x, d.d.y, d.d.z, dash*2.2, wid*5, c, 0.16*k*(s.glow ?? 1));
        });
        st.commit(); gl.commit();
      } };
  };

  ch.face = function(){ for (const c of ch.faceList) if (c.mesh.visible) V.lib.faceCam(c.mesh); };
  ch.refresh = function(){ for (const c of ch.cards) c.redraw(0); panel.redraw(0); floor.redraw(0); };
  return ch;
};

/* =====================================================================
   s07 专用：笔触小球（大气 / 海洋 / 星际气体）
   ===================================================================== */
function fib(n, i){ const y = 1 - 2*(i + 0.5)/n, r = Math.sqrt(1 - y*y), a = i*Math.PI*(3 - Math.sqrt(5)); return [Math.cos(a)*r, y, Math.sin(a)*r]; }
function makeGlobe(kind, RAD, seed){
  const grp = new THREE.Group(), spin = new THREE.Group();
  grp.add(spin);
  const R = V.rng(seed), pick = a => a[Math.floor(R()*a.length)];
  const pts = [];
  let base = null;
  if (kind !== 'gas'){
    base = new THREE.Mesh(new THREE.SphereGeometry(0.97, 32, 22), new THREE.MeshBasicMaterial({ color: kind === 'atm' ? 0x183a78 : 0x112c66, transparent: true }));
    base.renderOrder = 2; spin.add(base);
  }
  if (kind === 'atm'){
    const N = 190;
    for (let i=0;i<N;i++){
      const [x, y, z] = fib(N, i);
      const land = Math.sin(2.6*x + 1.1)*Math.sin(2.2*y + 0.4)*Math.cos(1.8*z - 0.3) + 0.45*Math.sin(4.1*x + 2.3*z + 0.7) + 0.25*Math.sin(5.3*y - 1.7*x);
      const col = land > -0.02 ? pick(['#5e7a3a', '#6f8a44', '#7a8a3e', '#8a8a4a', '#a8964f']) : pick([...V.PAL.deep, V.PAL.mid[0], V.PAL.mid[1], V.PAL.mid[0]]);
      pts.push({ x, y, z, r: 1.03, sh: 0, len: 0.78 + R()*0.3, wid: 0.36 + R()*0.08, col: V.hex(col), a: 1, layer: 0, ph: R()*6.28 });
    }
    for (let i=0;i<56;i++){                               // 云：外壳，转得更快，带旋涡
      const yy = (R()*2 - 1)*0.85, lon = R()*Math.PI*2, rr = Math.sqrt(1 - yy*yy);
      pts.push({ x: Math.cos(lon)*rr, y: yy, z: Math.sin(lon)*rr, r: 1.10, sh: 1, len: 0.95 + R()*0.4, wid: 0.28 + R()*0.06,
        col: V.hex(pick([V.PAL.cream[1], V.PAL.cream[0], V.PAL.pale[1], '#ffffff'])), a: 1, layer: 1, ph: R()*6.28, lon, yy });
    }
  } else if (kind === 'ocean'){
    const N = 190;
    for (let i=0;i<N;i++){
      const [x, y, z] = fib(N, i);
      pts.push({ x, y, z, r: 1.03, len: 0.78 + R()*0.3, wid: 0.36 + R()*0.08, col: V.hex(pick([...V.PAL.deep, ...V.PAL.deep, ...V.PAL.mid, V.PAL.mid[2]])), a: 1, layer: 0, ph: R()*6.28 });
    }
    for (let i=0;i<80;i++){                               // 浪尖白沫
      const yy = (R()*2 - 1)*0.9, lon = R()*Math.PI*2, rr = Math.sqrt(1 - yy*yy);
      pts.push({ x: Math.cos(lon)*rr, y: yy, z: Math.sin(lon)*rr, r: 1.07, len: 0.8 + R()*0.35, wid: 0.24 + R()*0.06,
        col: V.hex(pick([V.PAL.pale[0], V.PAL.pale[1], V.PAL.cream[1], V.PAL.teal[0]])), a: 0.95, layer: 2, ph: R()*6.28, lon, yy });
    }
  } else {
    for (let i=0;i<260;i++){                               // 星云：分层旋转的紫色笔触（蓬松的立体团）
      const q = Math.pow(R(), 0.7), a0 = R()*Math.PI*2, arm = Math.floor(R()*2);
      pts.push({ q, a0: a0 + arm*Math.PI + q*2.6, h: (R() - 0.5)*1.5*(1.15 - q), len: 0.62 + R()*0.45, wid: 0.25 + R()*0.1,
        col: V.hex(pick(['#9b6fd6', '#b58ae6', '#6b4fb0', '#d9a6e8', '#7e5cc4', '#e3b4d8', '#5a86c2'])), a: 0.85, layer: 3 });
    }
  }
  const st = new V.Strokes(pts.length, { renderOrder: 3 });
  spin.add(st.mesh);
  const NG = kind === 'gas' ? 70 : 3;
  const gl = new V.Strokes(NG, { additive: true, shape: 'glow', renderOrder: 4 });
  grp.add(gl.mesh);
  const RG = V.rng(seed + 1), gpts = [];
  for (let i=0;i<NG;i++) gpts.push({ q: Math.pow(RG(), 0.8), a0: RG()*6.28, h: (RG() - 0.5)*0.6, s: 0.5 + RG()*1.2, star: RG() < 0.35,
    col: V.hex(['#b48ae8', '#e0a8e0', '#8f74e0', '#fff2fa'][Math.floor(RG()*4)]) });
  return { grp, spin, base,
    update(t, k){
      grp.scale.setScalar(Math.max(1e-3, RAD*k));
      grp.visible = k > 0.002;
      if (base) base.material.opacity = clamp(k*1.5, 0, 1);
      pts.forEach((d, i) => {
        const rv = clamp(k*1.6 - (i/pts.length)*0.6, 0, 1);
        if (d.layer === 0){
          // 表面笔触：沿纬线方向，带一点扰动
          const ex = -d.z, ez = d.x, el = Math.hypot(ex, ez) + 1e-6;
          const w = 0.35*Math.sin(d.ph + 3*d.y);
          const nx = -d.x*d.y, ny = 1 - d.y*d.y, nz = -d.z*d.y, nl = Math.hypot(nx, ny, nz) + 1e-6;
          const dx = ex/el*Math.cos(w) + nx/nl*Math.sin(w), dy = ny/nl*Math.sin(w), dz = ez/el*Math.cos(w) + nz/nl*Math.sin(w);
          st.set(i, d.x*d.r, d.y*d.r, d.z*d.r, dx, dy, dz, d.len, d.wid, d.col, d.a*rv);
        } else if (d.layer === 1){
          // 云：额外绕轴旋转 + 小旋涡式的方向摆动
          const lon = d.lon + t*0.45, rr = Math.sqrt(1 - d.yy*d.yy);
          const x = Math.cos(lon)*rr, z = Math.sin(lon)*rr, y = d.yy + 0.06*Math.sin(lon*3 + t*0.8 + d.ph);
          const sw = 0.9*Math.sin(lon*2 + d.yy*5 + t*0.6);
          const ex = -Math.sin(lon), ez = Math.cos(lon);
          st.set(i, x*d.r, y*d.r, z*d.r, ex*Math.cos(sw), Math.sin(sw)*0.8, ez*Math.cos(sw), d.len, d.wid, d.col, d.a*rv);
        } else if (d.layer === 2){
          // 浪尖：沿浪纹（正弦带）移动
          const lon = d.lon + t*0.25, wv = Math.sin(lon*7 + d.yy*4 - t*2.2);
          const yy = d.yy + 0.05*wv, rr = Math.sqrt(Math.max(0, 1 - yy*yy));
          const x = Math.cos(lon)*rr, z = Math.sin(lon)*rr;
          const crest = clamp((wv - 0.1)*1.6, 0, 1);
          st.set(i, x*d.r, yy*d.r, z*d.r, -Math.sin(lon), 0.35*Math.cos(lon*7 + d.yy*4 - t*2.2), Math.cos(lon), d.len, d.wid, d.col, d.a*rv*(0.25 + 0.75*crest));
        } else {
          const a = d.a0 + t*(0.9 - 0.55*d.q), r = 0.25 + d.q*1.0;
          const x = Math.cos(a)*r, z = Math.sin(a)*r*0.9, y = d.h + Math.sin(a)*r*0.3;
          st.set(i, x, y, z, -Math.sin(a), Math.cos(a)*0.3, Math.cos(a)*0.9, d.len, d.wid, d.col, d.a*rv);
        }
      });
      st.commit();
      gpts.forEach((d, i) => {
        if (kind !== 'gas'){                     // 地球/海洋：淡淡的大气辉光
          if (i === 0) gl.set(i, 0, 0, 0, 1, 0, 0, 3.0, 3.0, kind === 'atm' ? [0.55, 0.75, 1.0] : [0.4, 0.65, 1.0], 0.32*k);
          else gl.hide(i);
          return;
        }
        const a = d.a0 + t*(0.7 - 0.4*d.q), r = 0.15 + d.q*1.0;
        const x = Math.cos(a)*r, z = Math.sin(a)*r*0.9, y = d.h*1.3 + Math.sin(a)*r*0.3;
        if (d.star) gl.set(i, x, y, z, 1, 0, 0, 0.16*d.s, 0.16*d.s, [1, 0.97, 0.92], k*(0.7 + 0.3*Math.sin(t*3 + i)));
        else gl.set(i, x, y, z, -Math.sin(a), 0, Math.cos(a), 1.1*d.s, 0.95*d.s, d.col, 0.26*k);
      });
      gl.commit();
      spin.rotation.y = kind === 'gas' ? 0 : t*(kind === 'atm' ? 0.35 : 0.22);
    } };
}

/* =====================================================================
   s07 镜头
   ===================================================================== */
const LT = X => -0.18 - (5/3)*(X - 0.6);                 // 理想的 −5/3 直线（与 paint2d 的理论线一致）
const LX0 = 0.25, LX1 = 2.65;
const BADGES = [
  { kind: 'atm',   zh: '大气',     en: 'Atmosphere',       t0: 67.2, pos: [-7, 13.2, 11], X: 1.10 },
  { kind: 'ocean', zh: '海洋',     en: 'Ocean',            t0: 68.1, pos: [5, 7.2, 14],  X: 1.72 },
  { kind: 'gas',   zh: '星际气体', en: 'Interstellar gas', t0: 69.0, pos: [17, 1.2, 17],  X: 2.32 },
];
const BR = 3.3;                                            // 小球半径

V.shot({ id: 's07', start: 62, end: 71, origin: [20000, 0, 0],
  build(ctx){
    const s = ctx.state, g = ctx.group;
    s.root = new THREE.Group(); g.add(s.root);
    const ch = s.ch = V.lib.chart({ seed: 707 });
    s.root.add(ch.group);
    s.line = ch.line(LT, LX0, LX1, { radius: 0.3, n: 280, sheath: true, seed: 71 });
    // 金点（斜率标注处）
    s.dotX = 1.42;
    s.dot = new V.Strokes(4, { additive: true, shape: 'glow', renderOrder: 7 });
    ch.group.add(s.dot.mesh);
    s.dotCore = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true }));
    s.dotCore.renderOrder = 7; ch.group.add(s.dotCore);
    s.slope = V.lib.label({ w: 13.5, h: 3.9, px: 768, bg: 'rgba(7,11,30,0.72)', border: 'rgba(232,197,71,0.75)',
      lines: [{ text: '斜率 −5/3', font: `900 150px ${SANS}`, color: V.COL.gold, y: 0.55, glow: 'rgba(232,197,71,0.6)' }] });
    ch.group.add(s.slope.mesh); ch.faceList.push(s.slope); ch.cards.push(s.slope);
    // 三个徽章
    s.badges = BADGES.map((b, i) => {
      const grp = new THREE.Group(); grp.position.set(...b.pos); ch.group.add(grp);
      const globe = makeGlobe(b.kind, BR, 900 + i*17);
      grp.add(globe.grp);
      const lab = V.lib.label({ w: 11.6, h: 4.6, px: 768, bg: 'rgba(7,11,30,0.74)', border: 'rgba(232,197,71,0.55)',
        lines: [
          { text: b.zh, font: `900 ${b.zh.length > 2 ? 124 : 138}px ${SANS}`, color: '#F2EEE4', x: 0.07, y: 0.38, align: 'left' },
          { text: b.en, font: `italic 74px ${GARA}`, color: '#B9BCD0', x: 0.075, y: 0.76, align: 'left' } ],
        check: { x: 0.86, y: 0.42, size: 0.42, color: V.COL.gold, k: 0 } });
      grp.add(lab.mesh); ch.cards.push(lab);
      const contact = ch.p(b.X, LT(b.X), 0.2);
      const start = V.v3(...b.pos).add(V.v3(0, -BR*(b.kind === 'gas' ? 0.75 : 1.12), 0));
      const mid = start.clone().lerp(contact, 0.5).add(V.v3(-1.2, 0, 2.5));
      const curve = new THREE.QuadraticBezierCurve3(start, mid, contact);
      const NT = 46;
      const thread = new V.Strokes(NT, { renderOrder: 6 });
      const tglow = new V.Strokes(NT + 4, { additive: true, shape: 'glow', renderOrder: 6 });
      ch.group.add(thread.mesh); ch.group.add(tglow.mesh);
      return { b, grp, globe, lab, curve, thread, tglow, NT, checkKey: -1 };
    });
    // 视差层：空间里稀疏漂浮的笔触
    const dpal = [...V.PAL.deep, ...V.PAL.deep, ...V.PAL.deep, V.PAL.mid[0], V.PAL.mid[1], V.PAL.mid[0]];
    s.dustFar = V.lib.dust(260, 7071, [-110, 110, -60, 60, -80, -16], { len: 4.2, wid: 1.1, pal: dpal });
    s.dustNear = V.lib.dust(46, 7072, [-80, 80, -45, 45, 6, 44], { len: 2.4, wid: 0.5, hole: [0, -3, 22, 44, 26, 30], pal: [...dpal, V.PAL.pale[0], V.PAL.cream[0]] });
    s.dustFront = V.lib.dust(40, 7073, [-60, 45, -32, 26, 38, 54], { len: 5.5, wid: 1.3, hole: [-6, -5, 46, 22, 11, 40], pal: dpal });
    g.add(s.dustFar.mesh); g.add(s.dustNear.mesh); g.add(s.dustFront.mesh);
    ctx.refresh = () => ch.refresh();
  },
  update(t, lt, ctx){
    const s = ctx.state, ch = s.ch;
    V.backdrop.set({ opacity: 0.85 });
    /* ---------- 镜头：持续环绕 ~40° + 缓慢推进 ---------- */
    const u0 = P(t, 61.6, 71.4), u = 1 - Math.pow(1 - u0, 1.6);          // 前快后慢：62–67 转 ~30°，67–71 再转 ~12°
    const az = lerp(-38, 18, u)*D2R;
    const dist = lerp(92, 76, u);
    const kb = E(t, 66.3, 69.8);
    // 目标点低于图心 → 图在画面中偏上（y 110–720 的安全区）
    const tgt = V.v3(lerp(-0.5, 3.5, kb), lerp(-8.4, -8.0, kb), lerp(0, 3, kb));
    const crane = lerp(0.5, 13, E(t, 61.8, 66.6)) - lerp(0, 6, E(t, 66.6, 71.2));         // 升降：平视 → 俯视 → 回落
    const pos = V.v3(Math.sin(az)*dist, tgt.y + crane + 0.5*Math.sin(t*0.7), Math.cos(az)*dist).add(V.v3(tgt.x, 0, tgt.z));
    ctx.cam(pos, tgt, 50, 0.025*Math.sin(t*0.5));
    /* ---------- 图：漂浮 ---------- */
    s.root.rotation.set(0.02*Math.sin(t*0.37), 0.04*Math.sin(t*0.29), 0.012*Math.sin(t*0.41));
    s.root.position.set(0, 0.5*Math.sin(t*0.55), 0);
    s.root.updateMatrixWorld(true);
    const A = vis(t, 61.5, 71.5, 0.6, 0.4);
    ch.frame(t, { axes: E(t, 61.7, 62.9), grid: E(t, 61.6, 62.6), alpha: A });
    /* ---------- 金色 −5/3 直线 ---------- */
    const gold = V.hex(V.COL.gold);
    const prog = easeOut(P(t, 62.4, 65.4))*0.85 + 0.15*P(t, 62.4, 65.4);
    s.line.set({ prog, alpha: A, color: () => [gold[0]*1.05, gold[1]*1.02, gold[2]*0.9], halo: () => 0.85 + 0.15*Math.sin(t*2.2), head: 1, glowK: 0.17, haloK: 0.5 });
    /* ---------- 金点 + 斜率标签 ---------- */
    const kd = E(t, 64.6, 65.6);
    const dp = ch.p(s.dotX, LT(s.dotX), 0.5);
    const pulse = 1 + 0.12*Math.sin(t*4.2);
    s.dotCore.visible = kd > 0.001; s.dotCore.position.copy(dp); s.dotCore.scale.setScalar(Math.max(1e-3, easeOut(kd)*pulse));
    s.dotCore.material.opacity = A;
    [[4.2, 0.9], [9, 0.45], [17, 0.18], [1.9, 1]].forEach(([sz, a], i) => {
      if (kd <= 0) { s.dot.hide(i); return; }
      s.dot.set(i, dp.x, dp.y, dp.z, 1, 0, 0, sz*kd*pulse, sz*kd*pulse, i === 3 ? [1, 1, 0.9] : gold, a*kd*A);
    });
    s.dot.commit();
    s.slope.opacity = kd*A;
    s.slope.mesh.position.copy(dp).add(V.v3(-7.8, -5.6 + 1.2*(1 - easeOut(kd)), 1.2));
    s.slope.mesh.scale.setScalar(lerp(0.85, 1, easeOut(kd)));
    /* ---------- 三个徽章 ---------- */
    s.badges.forEach((B, i) => {
      const t0 = B.b.t0;
      const k = clamp(V.easeOut(P(t, t0, t0 + 0.7))*1.08 - 0.08*Math.sin(Math.PI*P(t, t0 + 0.35, t0 + 0.9)), 0, 1.1);
      B.grp.position.set(B.b.pos[0], B.b.pos[1] + 0.35*Math.sin(t*0.9 + i*1.7) - 3*(1 - easeOut(P(t, t0, t0 + 0.8))), B.b.pos[2]);
      B.globe.update(t, k);
      // 徽章整体朝向相机（只绕竖轴），使标签始终在小球右侧
      const wp = B.grp.getWorldPosition(new THREE.Vector3()), cp = V.camera.position;
      B.grp.rotation.y = Math.atan2(cp.x - wp.x, cp.z - wp.z) - s.root.rotation.y;
      const kl = E(t, t0 + 0.2, t0 + 0.8);
      B.lab.opacity = kl*A;
      B.lab.mesh.position.set(BR + 6.6 + (1 - kl)*2, 0, 0.5);
      // ✓：线连上之后打勾（量化重画）
      const kc = Math.round(E(t, t0 + 0.95, t0 + 1.35)*12)/12;
      if (kc !== B.checkKey){ B.lab.o.check.k = kc; B.lab.redraw(t); B.checkKey = kc; }
      // 细光线：从小球连到直线上
      const kt = E(t, t0 + 0.3, t0 + 1.0);
      const tmp = new THREE.Vector3(), tan = new THREE.Vector3();
      for (let j=0;j<B.NT;j++){
        const uu = (j + 0.5)/B.NT;
        if (uu > kt || A <= 0){ B.thread.hide(j); B.tglow.hide(j); continue; }
        B.curve.getPoint(uu, tmp); B.curve.getTangent(uu, tan);
        tmp.y += (B.grp.position.y - B.b.pos[1])*(1 - uu);
        B.thread.set(j, tmp.x, tmp.y, tmp.z, tan.x, tan.y, tan.z, 0.75, 0.16, [1.0, 0.92, 0.66], 0.85*A);
        B.tglow.set(j, tmp.x, tmp.y, tmp.z, tan.x, tan.y, tan.z, 1.4, 1.0, [1.0, 0.82, 0.4], 0.16*A);
      }
      // 沿光线流向直线的能量光点 + 接触点闪光
      for (let j=0;j<4;j++){
        const idx = B.NT + j;
        if (kt < 1 || A <= 0){
          if (j === 3 && kt > 0.95){ const c = B.curve.getPoint(1); B.tglow.set(idx, c.x, c.y, c.z, 1, 0, 0, 3.2, 3.2, gold, 0.6*A); }
          else B.tglow.hide(idx);
          continue;
        }
        if (j === 3){ const c = B.curve.getPoint(1); const fl = 1 + 1.5*Math.exp(-6*(t - t0 - 1.0)); B.tglow.set(idx, c.x, c.y, c.z, 1, 0, 0, 3.2*fl, 3.2*fl, gold, 0.55*A); continue; }
        const uu = ((t - t0)*0.55 + j/3) % 1;
        B.curve.getPoint(uu, tmp);
        B.tglow.set(idx, tmp.x, tmp.y, tmp.z, 1, 0, 0, 1.1, 1.1, [1, 0.95, 0.8], 0.7*A*Math.sin(Math.PI*uu));
      }
      B.thread.commit(); B.tglow.commit();
    });
    /* ---------- 视差层 ---------- */
    s.dustFar.update(t, 0.75*A); s.dustNear.update(t, 0.55*A); s.dustFront.update(t, 0.6*A);
    ch.face();
  },
});
})();

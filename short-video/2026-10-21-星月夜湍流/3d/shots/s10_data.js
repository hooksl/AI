/* s10_data · 91–114s · 数据频谱 / −1 / 颜料混合（非世界镜头，复用 s07 的 V.lib.chart）
   91–95.5   坐标图从左侧斜角入画；金色笔触虚线（理论 −5/3）91.2–92.6 画出；白色发光管（数据 logE+noise）92.2–95.2 随镜头推进生长。
   95.5–100  XA / XB 处两块半透明竖面从地面立起，之间是淡金色光体（95.6–96.6），竖面顶端标「最大漩涡」「最小漩涡」；
             两面之间的数据曲线变金并发光（96.4–97.4），「−5/3」浮现；镜头升起绕到左上方，看清两块竖面的立体关系。
   100–107   镜头俯冲到曲线旁，沿曲线向右前进、掠过 XB 竖面；尾段变蓝 #6FA8FF（103.8–105），蓝色笔触虚线参考斜率 +「斜率 −1」。
   107–114   镜头俯冲进尾段：一团油彩从曲线上的一点"放大"出来——巨大的 3D 笔触丝带（黄、蓝、奶白、深蓝，带刷毛纹理和湿油光泽）
             绕着漩涡相互缠绕、穿插、被拖拽、颜色互相渗入；附「油彩 · 示意」小标签。 */
(function(){
const { E, P, lerp, clamp, vis, easeOut, easeIn, smooth } = V;
const SANS = V.FONT.SANS;
const XA = V.paint2d.XA, XB = V.paint2d.XB;
const DATA = X => V.paint2d.logE(X) + V.paint2d.noise(X);
const LT = X => -0.18 - (5/3)*(X - XA);
const BLUE = V.hex(V.COL.blue), GOLD = V.hex(V.COL.gold), WHITE = [0.93, 0.94, 0.98];
const XT = 2.5;                                            // 镜头钻入的尾段位置

/* =====================================================================
   油彩丝带：CPU 每帧算中心线 → 带刷毛纹理、湿油高光、粗糙边缘的 3D 带状网格
   ===================================================================== */
const RIB_VS = `
attribute vec2 aUv; attribute vec3 aColA; attribute vec3 aColB; attribute vec2 aInfo;
varying vec2 vUv; varying vec3 vA; varying vec3 vB; varying vec2 vInfo; varying vec3 vN; varying vec3 vV;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  vUv = aUv; vA = aColA; vB = aColB; vInfo = aInfo;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const RIB_FS = `
uniform float uTime; uniform float uMix; uniform vec3 uL;
varying vec2 vUv; varying vec3 vA; varying vec3 vB; varying vec2 vInfo; varying vec3 vN; varying vec3 vV;
float h1(float n){ return fract(sin(n)*43758.5453123); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  float a = h1(dot(i, vec2(1.0,57.0))), b = h1(dot(i+vec2(1.0,0.0), vec2(1.0,57.0)));
  float c = h1(dot(i+vec2(0.0,1.0), vec2(1.0,57.0))), d = h1(dot(i+vec2(1.0,1.0), vec2(1.0,57.0)));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }
void main(){
  float s = vUv.x, v = vUv.y, seed = vInfo.x, len = vInfo.y;
  float sl = s*len;
  float flow = uTime*0.35;
  float br  = vn(vec2(v*60.0 + seed*17.0, sl*0.22 - flow));       // 刷毛条纹（沿长度拉长）
  float br2 = vn(vec2(v*120.0 + seed*5.0, sl*0.9 - flow*1.3));
  float streak = 0.6*br + 0.4*br2;
  float mk = vn(vec2(v*7.0 + seed*31.0, sl*0.10 - flow*0.8 + seed*3.0));
  float m = smoothstep(0.70 - 0.42*uMix, 0.82 - 0.42*uMix, mk);  // 另一种颜色沿刷毛渗入
  vec3 col = mix(vA, vB, m);
  col *= 0.70 + 0.45*streak;
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 Vv = normalize(vV);
  float diff = 0.50 + 0.60*max(dot(N, uL), 0.0);
  vec3 H = normalize(uL + Vv);
  float spec = pow(max(dot(N, H), 0.0), 30.0) * (0.25 + 0.9*br2);
  col = col*diff + vec3(1.0, 0.97, 0.88)*spec*0.55;
  float e = 0.05 + 0.10*vn(vec2(sl*1.6, seed*9.0));
  float edge = min(v, 1.0 - v);
  if (edge < e*(0.5 + 0.9*br2)) discard;                          // 粗糙的笔触边缘
  float endD = min(s, 1.0 - s)*len;
  if (endD < 2.2*vn(vec2(v*38.0 + seed, s*4.0))) discard;         // 两端的干笔飞白
  gl_FragColor = vec4(col, 1.0);
}`;

function buildPaint(seed){
  const R = V.rng(seed), grp = new THREE.Group();
  const pick = a => a[Math.floor(R()*a.length)];
  const PAL = { yel: ['#f4d34a', '#e8b830', '#f7e27a', '#f0b833'], blue: ['#2c5ea3', '#22508f', '#4a78b8', '#5a86c2'],
                cream: ['#fdf6d8', '#fbeeb0', '#e6e2b8'], deep: ['#102454', '#183a78', '#1a3070'] };
  const PART = { yel: ['blue', 'cream', 'deep'], blue: ['cream', 'yel'], cream: ['yel', 'blue'], deep: ['blue', 'cream', 'yel'] };
  const O = [2.5, -0.5];                                   // 旋涡中心
  const defs = [];
  const drag = (d, s, t) => d.Ad*Math.exp(-Math.pow((s - (((t*d.dv + d.dp) % 1.5) - 0.25))/0.10, 2));
  const mkCol = (kind) => { const pk = pick(PART[kind]); return [V.hex(pick(PAL[kind])), V.hex(pick(PAL[pk]))]; };
  const kinds = ['yel', 'blue', 'cream', 'deep', 'blue', 'yel', 'deep', 'cream', 'yel', 'blue', 'deep', 'yel', 'cream', 'blue'];
  // 绕旋涡的弧形丝带
  for (let i=0;i<8;i++){
    const kind = kinds[i], [cA, cB] = mkCol(kind);
    const r0 = 4.6 + i*1.8 + R()*0.8;
    const d = { type: 'arc', r0, dr: (R() - 0.5)*5, a0: R()*6.28, span: 2.2 + R()*1.8, om: 0.07 + R()*0.05,
      A1: (0.08 + R()*0.07)*r0, f1: 0.5 + R()*1.0, p1: R()*6.28, w1: 0.5 + R()*0.6, zl: (R() - 0.5)*2.0, Az: 0.7 + R()*0.6, fz: 1 + R()*1.5, pz: R()*6.28, wz: 0.4 + R()*0.5,
      Ad: (R() < 0.6 ? 1 : -1)*(0.6 + R()*0.9), dv: 0.16 + R()*0.1, dp: R()*1.5,
      W: 2.1 + R()*1.4, tw0: (R() - 0.5)*0.6, tw1: 0.35 + R()*0.35, twf: 0.6 + R()*1.2, twp: R()*6.28, tww: 0.3 + R()*0.4, imp: 0.10 + R()*0.08,
      cA, cB, seed: R()*10 };
    d.len = d.r0*d.span;
    defs.push(d);
  }
  // 被拖过画面的直笔触
  for (let i=0;i<5;i++){
    const kind = kinds[9 + i], [cA, cB] = mkCol(kind);
    const ang = -0.5 + i*0.62 + (R() - 0.5)*0.3, off = (i - 2)*4.2 + (R() - 0.5)*2;
    const d = { type: 'line', c: [O[0] - Math.sin(ang)*off, O[1] + Math.cos(ang)*off], dir: [Math.cos(ang), Math.sin(ang)], L: 30 + R()*12, vel: (R() < .5 ? 1 : -1)*(0.5 + R()*0.5),
      A1: 0.8 + R()*1.0, f1: 0.6 + R()*1.0, p1: R()*6.28, w1: 0.5 + R()*0.5, zl: (R() - 0.5)*2.2, Az: 0.8 + R()*0.6, fz: 1 + R()*1.4, pz: R()*6.28, wz: 0.4 + R()*0.4,
      Ad: (R() < .5 ? 1 : -1)*(0.8 + R()*1.0), dv: 0.15 + R()*0.1, dp: R()*1.5,
      W: 2.4 + R()*1.4, tw0: (R() - 0.5)*0.5, tw1: 0.4 + R()*0.4, twf: 0.5 + R()*1.0, twp: R()*6.28, tww: 0.3 + R()*0.4, imp: 0.10 + R()*0.08,
      cA, cB, seed: R()*10 };
    d.len = d.L;
    defs.push(d);
  }
  // 相互缠绕的双股丝带（黄+蓝、奶白+深蓝、蓝+黄）
  [['yel', 'blue'], ['cream', 'deep'], ['blue', 'yel']].forEach(([k1, k2], j) => {
    const base = { type: 'arc', r0: 6 + j*3.8 + R()*0.6, dr: (R() - 0.5)*3, a0: 1.2 + j*2.1 + R()*0.5, span: 2.4 + R()*1.2, om: 0.09 + R()*0.04,
      A1: 0.4, f1: 1.2, p1: R()*6.28, w1: 0.5, zl: 0.6 + (R() - 0.5)*0.8, Az: 0.4, fz: 1, pz: R()*6.28, wz: 0.4, Ad: 0.8, dv: 0.18, dp: R()*1.5 };
    const HR = 1.25 + R()*0.4, turns = 1.8 + R()*1.0, hw = 0.6 + R()*0.4;
    [k1, k2].forEach((kind, q) => {
      const [cA, cB] = [V.hex(pick(PAL[kind])), V.hex(pick(PAL[q ? k1 : k2]))];
      defs.push(Object.assign({}, base, { type: 'helix', base, HR, turns, hw, hp: q*Math.PI, W: 1.35 + R()*0.45,
        tw0: 0, tw1: 0.5, twf: turns, twp: q*Math.PI, tww: hw, imp: 0.14, cA, cB, seed: R()*10, len: base.r0*base.span }));
    });
  });

  const center = (d, s, t, out) => {
    if (d.type === 'arc' || d.type === 'helix'){
      const b = d.type === 'helix' ? d.base : d;
      const a = b.a0 + b.span*(s - 0.5) + b.om*t;
      const r = b.r0 + b.dr*(s - 0.5) + b.A1*Math.sin(6.2832*b.f1*s + b.p1 + b.w1*t) + drag(b, s, t);
      out[0] = O[0] + r*Math.cos(a); out[1] = O[1] + r*Math.sin(a); out[2] = b.zl + b.Az*Math.sin(6.2832*b.fz*s + b.pz + b.wz*t);
      if (d.type === 'helix'){
        // 绕基线螺旋：偏移在（径向, z）平面内
        const ph = 6.2832*d.turns*s + d.hp + d.hw*t;
        out[0] += Math.cos(a)*d.HR*Math.cos(ph); out[1] += Math.sin(a)*d.HR*Math.cos(ph); out[2] += d.HR*0.9*Math.sin(ph);
      }
    } else {
      const u = (s - 0.5)*d.L + d.vel*(t - 110.5);
      const w = d.A1*Math.sin(6.2832*d.f1*s + d.p1 + d.w1*t) + drag(d, s, t);
      out[0] = d.c[0] + d.dir[0]*u - d.dir[1]*w; out[1] = d.c[1] + d.dir[1]*u + d.dir[0]*w;
      out[2] = d.zl + d.Az*Math.sin(6.2832*d.fz*s + d.pz + d.wz*t);
    }
  };

  const SEG = 120, AC = 8, NR = defs.length, VR = (SEG + 1)*(AC + 1);
  const pos = new Float32Array(NR*VR*3), nrm = new Float32Array(NR*VR*3), uv = new Float32Array(NR*VR*2),
        cA = new Float32Array(NR*VR*3), cB = new Float32Array(NR*VR*3), info = new Float32Array(NR*VR*2);
  const idx = [];
  defs.forEach((d, r) => {
    for (let i=0;i<=SEG;i++) for (let j=0;j<=AC;j++){
      const k = r*VR + i*(AC + 1) + j;
      uv[k*2] = i/SEG; uv[k*2+1] = j/AC;
      cA.set(d.cA, k*3); cB.set(d.cB, k*3); info[k*2] = d.seed; info[k*2+1] = d.len;
    }
    for (let i=0;i<SEG;i++) for (let j=0;j<AC;j++){
      const a = r*VR + i*(AC + 1) + j, b = a + 1, c = a + AC + 1, e = c + 1;
      idx.push(a, c, b, b, c, e);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  geo.setAttribute('aUv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('aColA', new THREE.BufferAttribute(cA, 3));
  geo.setAttribute('aColB', new THREE.BufferAttribute(cB, 3));
  geo.setAttribute('aInfo', new THREE.BufferAttribute(info, 2));
  geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({ vertexShader: RIB_VS, fragmentShader: RIB_FS, side: THREE.DoubleSide,
    uniforms: { uTime: {value: 0}, uMix: {value: 0}, uL: {value: new THREE.Vector3(-0.35, 0.55, 0.76).normalize()} } });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 1;
  grp.add(mesh);

  /* 画布底：密集的深蓝笔触，边缘柔和淡出（缩小时看起来像一团颜料，而不是方块） */
  const GW = 70, GH = 52;
  const ground = V.card({ w: GW, h: GH, px: 2048, depthWrite: false, draw(c, Wc, Hc){
    const r = V.rng(seed + 9); c.lineCap = 'round';
    const pal = [...V.PAL.deep, ...V.PAL.deep, ...V.PAL.mid, V.PAL.pale[0], V.PAL.yel[2]];
    for (let i=0;i<9000;i++){
      const px = r()*Wc, py = r()*Hc, dx = (px/Wc - 0.5)*2, dy = (py/Hc - 0.5)*2, rr = Math.hypot(dx, dy);
      const fall = clamp(1.25 - rr*1.25, 0, 1); if (fall <= 0) continue;
      const ox = (px/Wc - 0.5)*GW - O[0], oy = (0.5 - py/Hc)*GH - O[1];
      const ang = -Math.atan2(oy, ox) - Math.PI/2 + (r() - 0.5)*0.5;      // 绕旋涡的切向（canvas y 向下）
      const len = 16 + r()*30, wd = 6 + r()*7;
      c.strokeStyle = pal[Math.floor(r()*pal.length)]; c.globalAlpha = fall*(0.5 + 0.5*r()); c.lineWidth = wd;
      c.beginPath(); c.moveTo(px - Math.cos(ang)*len/2, py - Math.sin(ang)*len/2); c.lineTo(px + Math.cos(ang)*len/2, py + Math.sin(ang)*len/2); c.stroke();
    }
  }});
  ground.mesh.position.z = -2.6; ground.mesh.renderOrder = 0;
  grp.add(ground.mesh);

  /* 漂浮的颜料碎屑（视差）+ 少量光尘 */
  const FN = 420, fl = [];
  for (let i=0;i<FN;i++){
    const kind = pick(['yel', 'blue', 'cream', 'deep', 'blue', 'yel']);
    fl.push({ r: 1.5 + Math.sqrt(R())*20, a0: R()*6.28, z: 0.8 + R()*7.5, w: 0.06 + R()*0.1, len: 0.35 + R()*0.9, wid: 0.12 + R()*0.22, col: V.hex(pick(PAL[kind])), al: 0.7 + R()*0.3, bob: R()*6.28 });
  }
  const flS = new V.Strokes(FN, { renderOrder: 3 });
  grp.add(flS.mesh);

  const tmp = [0, 0, 0], C = [], T = [];
  for (let i=0;i<=SEG;i++){ C.push(new THREE.Vector3()); T.push(new THREE.Vector3()); }
  const Z = new THREE.Vector3(0, 0, 1), nIn = new THREE.Vector3(), n0 = new THREE.Vector3(), wd = new THREE.Vector3(), nn = new THREE.Vector3(), q = new THREE.Vector3(), qn = new THREE.Vector3();
  return { grp, mesh, ground, defs,
    update(t, mix){
      mat.uniforms.uTime.value = t; mat.uniforms.uMix.value = mix;
      defs.forEach((d, r) => {
        for (let i=0;i<=SEG;i++){ center(d, i/SEG, t, tmp); C[i].set(tmp[0], tmp[1], tmp[2]); }
        for (let i=0;i<=SEG;i++) T[i].subVectors(C[Math.min(SEG, i+1)], C[Math.max(0, i-1)]).normalize();
        for (let i=0;i<=SEG;i++){
          const s = i/SEG;
          nIn.crossVectors(Z, T[i]).normalize(); n0.crossVectors(T[i], nIn).normalize();
          const th = d.tw0 + d.tw1*Math.sin(6.2832*d.twf*s + d.twp + d.tww*t);
          wd.copy(nIn).multiplyScalar(Math.cos(th)).addScaledVector(n0, Math.sin(th));
          nn.crossVectors(T[i], wd).normalize(); if (nn.z < 0) nn.negate();
          const w = d.W*(0.45 + 0.55*Math.pow(Math.sin(Math.PI*s), 0.45))*(1 + 0.12*Math.sin(11*s + d.seed));
          for (let j=0;j<=AC;j++){
            const a = j/AC*2 - 1, h = d.imp*w*(1 - a*a);
            q.copy(C[i]).addScaledVector(wd, a*w/2).addScaledVector(nn, h);
            qn.copy(nn).multiplyScalar(w/2).addScaledVector(wd, 2*d.imp*w*a).normalize();
            const k = (r*VR + i*(AC + 1) + j)*3;
            pos[k] = q.x; pos[k+1] = q.y; pos[k+2] = q.z; nrm[k] = qn.x; nrm[k+1] = qn.y; nrm[k+2] = qn.z;
          }
        }
      });
      geo.attributes.position.needsUpdate = true; geo.attributes.normal.needsUpdate = true;
      fl.forEach((f, i) => {
        const a = f.a0 + f.w*t*(6/(f.r + 2));
        const x = O[0] + Math.cos(a)*f.r, y = O[1] + Math.sin(a)*f.r, z = f.z + 0.3*Math.sin(t*0.8 + f.bob);
        flS.set(i, x, y, z, -Math.sin(a), Math.cos(a), 0.1*Math.sin(f.bob + t), f.len, f.wid, f.col, f.al);
      });
      flS.commit();
    } };
}

/* =====================================================================
   s10 镜头
   ===================================================================== */
V.shot({ id: 's10', start: 91, end: 114, origin: [32000, 0, 0],
  build(ctx){
    const s = ctx.state, g = ctx.group;
    const ch = s.ch = V.lib.chart({ seed: 1010 });
    g.add(ch.group);
    s.theory = ch.dashed(LT, 0.3, 2.62, { dash: 1.5, gap: 0.95, wid: 0.5, z: 0.05 });
    s.data = ch.line(DATA, 0.05, 2.97, { radius: 0.3, n: 360, sheath: true, seed: 1011 });
    s.ref1 = ch.dashed(X => V.paint2d.logE(X) + 0.35, XB, 2.95, { dash: 1.3, gap: 0.85, wid: 0.45, z: 0.1 });

    /* ---- XA / XB 竖面 + 中间的淡金光体 ---- */
    const PZ0 = -9, PZ1 = 13, PD = PZ1 - PZ0;
    const pbot = ch.y0 - 1.2, ptop = ch.y0 + ch.H + 0.6, PH = ptop - pbot;
    s.P = { PZ0, PZ1, PD, pbot, ptop, PH };
    const planeCard = () => {
      const cd = V.card({ w: PD, h: PH, px: 512, depthWrite: false, draw(c, Wc, Hc){
        const grd = c.createLinearGradient(0, 0, 0, Hc);
        grd.addColorStop(0, 'rgba(220,232,255,0.30)'); grd.addColorStop(0.5, 'rgba(200,218,250,0.14)'); grd.addColorStop(1, 'rgba(200,218,250,0.06)');
        c.fillStyle = grd; c.fillRect(0, 0, Wc, Hc);
        const r = V.rng(77); c.lineCap = 'round';
        for (let i=0;i<120;i++){ const x = r()*Wc, y = r()*Hc, l = 20 + r()*60; c.strokeStyle = `rgba(230,240,255,${0.04 + r()*0.06})`; c.lineWidth = 3 + r()*5;
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5)*6, y + l); c.stroke(); }
        c.strokeStyle = 'rgba(240,244,255,0.75)'; c.lineWidth = 5; c.strokeRect(2.5, 2.5, Wc - 5, Hc - 5);
        c.fillStyle = 'rgba(255,248,225,0.8)'; c.fillRect(0, 0, Wc, 7);
      }});
      cd.mesh.geometry.translate(0, PH/2, 0);
      cd.mesh.rotation.y = Math.PI/2; cd.mesh.renderOrder = 7;
      g.add(cd.mesh); return cd;
    };
    s.planeA = planeCard(); s.planeA.mesh.position.set(ch.x(XA), pbot, (PZ0 + PZ1)/2);
    s.planeB = planeCard(); s.planeB.mesh.position.set(ch.x(XB), pbot, (PZ0 + PZ1)/2);
    const BW = ch.x(XB) - ch.x(XA);
    s.slices = [-7, -3, 1, 5, 9].map(z => {
      const cd = V.card({ w: BW, h: PH, px: 512, depthWrite: false, draw(c, Wc, Hc){
        const grd = c.createLinearGradient(0, 0, 0, Hc);
        grd.addColorStop(0, 'rgba(232,197,71,0.0)'); grd.addColorStop(0.18, 'rgba(232,197,71,0.10)'); grd.addColorStop(1, 'rgba(232,197,71,0.20)');
        c.fillStyle = grd; c.fillRect(0, 0, Wc, Hc);
        const gx = c.createLinearGradient(0, 0, Wc, 0);
        gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.08, 'rgba(0,0,0,0)'); gx.addColorStop(0.92, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)');
        c.globalCompositeOperation = 'destination-out'; c.fillStyle = gx; c.fillRect(0, 0, Wc, Hc); c.globalCompositeOperation = 'source-over';
      }});
      cd.mesh.geometry.translate(0, PH/2, 0);
      cd.mesh.material.blending = THREE.AdditiveBlending; cd.mesh.renderOrder = 6;
      cd.mesh.position.set((ch.x(XA) + ch.x(XB))/2, pbot, z);
      g.add(cd.mesh); return cd;
    });
    // 光体里缓缓上升的金色光尘 + 竖面边缘的辉光
    const RM = V.rng(1012);
    s.motes = []; for (let i=0;i<150;i++) s.motes.push({ x: lerp(ch.x(XA) + 1, ch.x(XB) - 1, RM()), z: lerp(PZ0 + 1, PZ1 - 1, RM()), ph: RM(), sp: 0.05 + RM()*0.06, sz: 0.5 + RM()*0.9 });
    s.moteS = new V.Strokes(s.motes.length, { additive: true, shape: 'glow', renderOrder: 8 });
    s.edgeS = new V.Strokes(2*(18 + 14), { additive: true, shape: 'glow', renderOrder: 8 });
    g.add(s.moteS.mesh); g.add(s.edgeS.mesh);

    /* ---- 标签 ---- */
    const lab = (text, color, w, size, opt = {}) => {
      const cd = V.lib.label(Object.assign({ w, h: size*1.55, px: 768, bg: 'rgba(7,11,30,0.70)', border: opt.border,
        lines: [{ text, font: `900 ${Math.round(768/w*size)}px ${SANS}`, color, y: 0.55, glow: opt.glow }] }, opt));
      g.add(cd.mesh); ch.cards.push(cd); return cd;
    };
    s.labA = lab('最大漩涡', '#F2EEE4', 11.5, 2.5, { border: 'rgba(234,234,242,0.45)' });
    s.labB = lab('最小漩涡', '#F2EEE4', 11.5, 2.5, { border: 'rgba(234,234,242,0.45)' });
    s.lab53 = lab('−5/3', V.COL.gold, 8.5, 3.2, { border: 'rgba(232,197,71,0.7)', glow: 'rgba(232,197,71,0.6)' });
    s.lab1 = lab('斜率 −1', V.COL.blue, 12, 2.9, { border: 'rgba(111,168,255,0.7)', glow: 'rgba(111,168,255,0.55)' });
    s.labPaint = V.lib.label({ w: 8.4, h: 2.3, px: 512, bg: 'rgba(237,228,211,0.92)', border: 'rgba(90,70,40,0.5)',
      lines: [{ text: '油彩 · 示意', font: `700 ${Math.round(512/8.4*1.25)}px ${SANS}`, color: '#2a2218', y: 0.55 }] });

    /* ---- 颜料微距 ---- */
    s.paint = buildPaint(10107);
    s.paintRoot = new THREE.Group(); g.add(s.paintRoot);
    s.paintRoot.add(s.paint.grp);
    g.add(s.labPaint.mesh);
    s.Pt = ch.p(XT, DATA(XT), 0.15);
    s.Pp = s.Pt.clone().add(V.v3(0, 0, -1.6));

    /* ---- 视差层 ---- */
    const dpal = [...V.PAL.deep, ...V.PAL.deep, ...V.PAL.deep, V.PAL.mid[0], V.PAL.mid[1], V.PAL.mid[0]];
    s.dustFar = V.lib.dust(260, 1013, [-120, 120, -65, 60, -85, -16], { len: 4.2, wid: 1.1, pal: dpal });
    s.dustNear = V.lib.dust(60, 1014, [-90, 90, -50, 45, 6, 60], { len: 2.4, wid: 0.5, hole: [0, -3, 22, 44, 26, 34], pal: [...dpal, V.PAL.pale[0], V.PAL.cream[0]] });
    g.add(s.dustFar.mesh); g.add(s.dustNear.mesh);

    /* ---- 镜头路径（局部坐标）：时间 → 样条参数 ---- */
    const K = [
      [91.0,  [-46, 0, 88],  [-8, -8.2, 0]],
      [93.2,  [-28, -2, 82], [-3, -8.2, 0]],
      [95.4,  [0, 1, 82],    [1, -7.8, 0]],
      [97.8,  [-22, 12, 84], [-1, -7.6, 0]],
      [99.8,  [-24, 11, 70], [2, -7, 0]],
      [101.6, [-6, 3, 36],   [12, -10, 0]],
      [103.0, [5, -2, 28],   [19, -13, 0]],
      [104.4, [11, -4, 32],  [21, -13.0, 0]],
      [106.0, [16, -6, 28],  [21, -12.6, 0]],
      [107.0, [19, -8, 21],  [20, -12.0, 0]],
    ];
    s.K = K;
    /* 108.6–114：绕颜料团法线的缓慢环绕（局部坐标，纯 t 函数） */
    s.orbit = t => {
      const kp = clamp((t - 108.6)/5.4, 0, 1);
      const ang = lerp(0, -0.75, kp), rr = lerp(6.2, 7.2, kp);
      const rel = V.v3(-1.5*Math.cos(ang) + rr*Math.sin(ang) + 0.3*Math.sin(t*0.7), -1.5*Math.sin(ang) - rr*Math.cos(ang) + 0.25*Math.sin(t*0.9), lerp(15, 10.0, smooth(kp)));
      return [s.Pp.clone().add(rel), s.Pp.clone().add(V.v3(lerp(0.5, 3.0, kp), lerp(-0.5, 0.6, kp), 0))];
    };
    /* 91–108.6：按时间参数化的三次 Hermite 样条（Catmull-Rom 切线）。
       关键帧处速度连续；末端（108.6）的位置与速度取环绕运动的起点，镜头无缝交接，不会顿挫或跳帧。 */
    const TE = 108.6, hD = 1e-3;
    const [oP0, oT0] = s.orbit(TE), [oP1, oT1] = s.orbit(TE + hD);
    const kt = [...K.map(k => k[0]), TE];
    const mk = (ps, end, endV) => {
      const P_ = [...ps.map(p => V.v3(...p)), end];
      const V_ = P_.map((p, i) => {
        if (i === P_.length - 1) return endV;
        const a = Math.max(0, i - 1), b = i + 1;
        return P_[b].clone().sub(P_[a]).multiplyScalar(1/(kt[b] - kt[a]));
      });
      return t => {
        let i = 0; while (i < kt.length - 2 && t > kt[i+1]) i++;
        const h = kt[i+1] - kt[i], u = clamp((t - kt[i])/h, 0, 1), u2 = u*u, u3 = u2*u;
        return P_[i].clone().multiplyScalar(2*u3 - 3*u2 + 1).addScaledVector(V_[i], h*(u3 - 2*u2 + u))
          .addScaledVector(P_[i+1], -2*u3 + 3*u2).addScaledVector(V_[i+1], h*(u3 - u2));
      };
    };
    s.posH = mk(K.map(k => k[1]), oP0, oP1.clone().sub(oP0).multiplyScalar(1/hD));
    s.tgtH = mk(K.map(k => k[2]), oT0, oT1.clone().sub(oT0).multiplyScalar(1/hD));
    ctx.refresh = () => { ch.refresh(); s.labPaint.redraw(0); s.paint.ground.redraw(0); };
    // 颜料微距很亮：给顶部标签与画面注释垫一层柔和的暗场，保证可读
    V.overlayHooks.push((c, t) => {
      const k = E(t, 107.7, 108.6)*(t < 114.4 ? 1 : 0); if (k <= 0) return;
      const top = c.createLinearGradient(0, 0, 0, 190);
      top.addColorStop(0, `rgba(5,7,20,${0.78*k})`); top.addColorStop(0.45, `rgba(5,7,20,${0.5*k})`); top.addColorStop(1, 'rgba(5,7,20,0)');
      c.fillStyle = top; c.fillRect(0, 0, 1920, 190);
      c.save(); c.translate(960, 770); c.scale(1, 0.17);
      const g2 = c.createRadialGradient(0, 0, 60, 0, 0, 560);
      g2.addColorStop(0, `rgba(5,7,20,${0.72*k})`); g2.addColorStop(1, 'rgba(5,7,20,0)');
      c.fillStyle = g2; c.beginPath(); c.arc(0, 0, 560, 0, 7); c.fill(); c.restore();
      // 双语字幕背后：亮色颜料上再压一层柔和暗带（字幕区 y 890–1010）
      const sb = c.createLinearGradient(0, 850, 0, 1080);
      sb.addColorStop(0, 'rgba(5,7,20,0)'); sb.addColorStop(0.3, `rgba(5,7,20,${0.42*k})`); sb.addColorStop(1, `rgba(5,7,20,${0.5*k})`);
      c.fillStyle = sb; c.fillRect(0, 850, 1920, 230);
    });
  },

  update(t, lt, ctx){
    const s = ctx.state, ch = s.ch, Pz = s.P;
    V.backdrop.set({ opacity: lerp(0.85, 0.35, E(t, 107.6, 108.6)) });

    /* ---------- 镜头 ---------- */
    const S = Math.exp(lerp(Math.log(0.02), 0, smooth(P(t, 107.0, 108.6))));      // 颜料团的缩放（"放大镜"）
    let pos, tgt;
    if (t < 108.6){
      pos = s.posH(t); tgt = s.tgtH(t);
      pos.y += 0.4*Math.sin(t*0.6)*(1 - smooth(P(t, 106.4, 108.6)));          // 轻微浮动，在交接前平滑收掉
    } else [pos, tgt] = s.orbit(t);
    const fov = lerp(50, 56, smooth(P(t, 107.0, 108.6)));
    const roll = 0.02*Math.sin(t*0.5) + lerp(0, 0.10, smooth(P(t, 108.6, 114)));
    ctx.cam(pos, tgt, fov, roll);

    /* ---------- 坐标图 ---------- */
    const CA = 1 - E(t, 107.3, 108.2);                     // 钻入颜料时坐标图淡出
    ch.group.visible = CA > 0.002;
    ch.frame(t, { axes: E(t, 90.8, 91.9), grid: E(t, 90.7, 91.6), alpha: CA*(1 - E(t, 106.9, 107.6)), labels: 1 - E(t, 99.3, 99.9) });   // 坐标轴先于曲线淡出：俯冲时近处的 x 轴不压字幕
    // 理论线：金色笔触虚线
    s.theory.set({ prog: E(t, 91.2, 92.6), alpha: CA*lerp(1, 0.7, E(t, 96.4, 97.4)), color: GOLD });
    // 数据：白色发光管 → 中段变金 → 尾段变蓝
    const kg = E(t, 96.4, 97.4), kb = E(t, 103.8, 105.0);
    const inBand = X => smooth(clamp((X - XA)/0.05 + 0.5, 0, 1))*smooth(clamp((XB - X)/0.05 + 0.5, 0, 1));
    const inTail = X => smooth(clamp((X - XB)/0.05 + 0.5, 0, 1));
    const colF = X => { const a = kg*inBand(X), b = kb*inTail(X);
      return [lerp(lerp(WHITE[0], GOLD[0]*1.05, a), BLUE[0], b), lerp(lerp(WHITE[1], GOLD[1]*1.02, a), BLUE[1], b), lerp(lerp(WHITE[2], GOLD[2]*0.9, a), BLUE[2], b)]; };
    const haloF = X => 0.32 + 0.68*kg*inBand(X) + 0.5*kb*inTail(X);
    s.data.set({ prog: E(t, 92.2, 95.2), alpha: CA, color: colF, halo: haloF, head: 1, glowK: 0.17, haloK: 0.55, sheathA: 0.75 });
    s.data.halo.material.uniforms.uOpacity.value *= 1 + 0.25*kg*Math.sin(t*2.4);
    // −1 参考斜率
    s.ref1.set({ prog: E(t, 104.0, 105.2), alpha: CA, color: BLUE });

    /* ---------- 竖面 + 光体 ---------- */
    const kr = E(t, 95.6, 96.6), kv = E(t, 95.8, 96.8);
    for (const pl of [s.planeA, s.planeB]){ pl.mesh.scale.y = Math.max(1e-3, kr); pl.opacity = clamp(kr*3, 0, 1)*CA*0.9; }
    const kdim = lerp(1, 0.55, E(t, 100.4, 101.8));          // 沿曲线飞行时压暗近处的金色光体，把注意力留给尾段
    s.slices.forEach(sl => { sl.mesh.scale.y = Math.max(1e-3, kv); sl.opacity = kv*CA*0.55*kdim; });
    s.motes.forEach((m, i) => {
      const yy = ((m.ph + t*m.sp) % 1), y = Pz.pbot + yy*Pz.PH*kv;
      const a = Math.sin(Math.PI*yy)*kv*CA;
      if (a <= 0.01){ s.moteS.hide(i); return; }
      s.moteS.set(i, m.x + 0.3*Math.sin(t*0.7 + i), y, m.z, 0, 1, 0, m.sz*1.8, m.sz, [1.0, 0.85, 0.45], 0.45*a*kdim);
    });
    s.moteS.commit();
    let n = 0;
    for (const X of [XA, XB]){
      const xx = ch.x(X), top = Pz.pbot + Pz.PH*kr;
      for (let i=0;i<18;i++){ const z = lerp(Pz.PZ0, Pz.PZ1, (i + 0.5)/18);
        if (kr <= 0.01) { s.edgeS.hide(n++); continue; }
        s.edgeS.set(n++, xx, top, z, 0, 0, 1, 2.6, 1.4, [1.0, 0.95, 0.8], 0.25*CA*clamp(kr*3, 0, 1)); }
      for (let i=0;i<14;i++){ const y = lerp(Pz.pbot, top, (i + 0.5)/14);
        if (kr <= 0.01) { s.edgeS.hide(n++); continue; }
        s.edgeS.set(n++, xx, y, Pz.PZ1, 0, 1, 0, 3.0, 1.3, [0.85, 0.9, 1.0], 0.18*CA*clamp(kr*3, 0, 1)); }
    }
    s.edgeS.commit();

    /* ---------- 标签 ---------- */
    const kl = E(t, 96.0, 96.8)*(1 - E(t, 99.2, 99.8));
    s.labA.opacity = kl*CA; s.labB.opacity = kl*CA;
    s.labA.mesh.position.set(ch.x(XA), Pz.ptop + 2.6 + (1 - kl)*1.5, 2);
    s.labB.mesh.position.set(ch.x(XB), Pz.ptop + 2.6 + (1 - kl)*1.5, 2);
    const k53 = E(t, 96.6, 97.6);
    s.lab53.opacity = k53*CA*(1 - E(t, 100.5, 101.3));
    s.lab53.mesh.position.copy(ch.p(1.34, LT(1.34), 2)).add(V.v3(1.2, 6.4 + (1 - k53)*1.2, 0));
    s.lab53.mesh.scale.setScalar(lerp(0.8, 1, easeOut(k53)));
    const k1 = E(t, 104.2, 105.2);
    s.lab1.opacity = k1*CA*(1 - E(t, 106.2, 106.8));
    s.lab1.mesh.position.copy(ch.p(2.5, V.paint2d.logE(2.5) + 0.35, 2)).add(V.v3(-1.0, 2.7 + (1 - k1)*1.2, 0));
    // 镜头逼近时按距离缩小，使屏幕上的字号大致恒定，不会胀进顶部标签区
    const d1 = s.lab1.mesh.getWorldPosition(new THREE.Vector3()).distanceTo(V.camera.position);
    s.lab1.mesh.scale.setScalar(lerp(0.8, 1, easeOut(k1))*clamp(d1/30, 0.55, 1));

    /* ---------- 颜料微距 ---------- */
    const pk = t > 106.9;
    s.paintRoot.visible = pk;
    if (!pk) s.labPaint.opacity = 0;
    if (pk){
      s.paintRoot.position.copy(s.Pp);
      s.paint.grp.scale.setScalar(S);
      s.paint.update(t, lerp(0.15, 0.85, smooth(P(t, 107.5, 113.5))));
      // 「油彩 · 示意」小标签：挂在镜头前方 10 个单位处（画面右下、字幕区上方），随镜头轻微漂移
      const kp = 0;                                    // 按用户要求去掉「示意」标签
      s.labPaint.opacity = kp;
      const cam = V.camera, fw = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion), rt = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
      cam.getWorldDirection(fw);
      const dd = 10, hh = dd*Math.tan(cam.fov*Math.PI/360), ppu = 540/hh;
      const lp = cam.position.clone().addScaledVector(fw, dd).addScaledVector(rt, (1590 - 960)/ppu + 0.05*Math.sin(t*0.8)).addScaledVector(up, (540 - 672)/ppu + 0.04*Math.sin(t*1.1));
      s.labPaint.mesh.position.copy(lp).sub(ctx.origin);
      s.labPaint.mesh.scale.setScalar(lerp(0.9, 1, easeOut(kp))*(40/ppu)/1.25);      // 字高约 40px
    }

    /* ---------- 视差层 ---------- */
    s.dustFar.update(t, 0.75*CA); s.dustNear.update(t, 0.55*CA);
    s.dustFar.mesh.visible = s.dustNear.mesh.visible = CA > 0.002;
    for (const c of [s.labA, s.labB, s.lab53, s.lab1, s.labPaint]) if (c.mesh.visible) V.lib.faceCam(c.mesh);
  },
});
})();

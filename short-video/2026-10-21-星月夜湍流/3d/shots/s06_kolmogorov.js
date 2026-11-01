/* s06_kolmogorov · 54–62s · 柯尔莫哥洛夫（非世界镜头）
   54.3  纸质铭牌「柯尔莫哥洛夫 / Andrey Kolmogorov / 1903 – 1987 · MOSCOW」像立体书一样从暗色地面上翻起立住
   55.0  大号金色「1941」由金色笔触从左到右飞聚成形（有前后两层厚度），立在铭牌后方的空中
   56 + i*0.35  6 根由竖向金色笔触堆成的发光柱从地面依次"画"出来，高度按固定比例递减（H0·0.6^i）；
         柱顶各有一个转动的笔触小涡旋，越来越小、转得越来越快；柱子把脚下的笔触地面照成金色
   56.4  左侧竖起"能量"轴（发光笔触线 + 箭头），59.6 地面前方立起"大 ← 漩涡尺度 → 小"轴标签
   60–61.6  一条发光线依次连接各柱顶
   镜头：低机位从铭牌左前方掠过（铭牌、1941、柱列三层视差），沿柱列低角度推移，60s 起升高后退，把整排柱子、连线和两条轴收进画面。 */
(function(){
const { E, P, lerp, clamp, easeOut } = V;
const v3 = V.v3, TAU = Math.PI*2;
const frac = x => x - Math.floor(x);
const easeOutBack = x => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3*Math.pow(x - 1, 3) + c1*Math.pow(x - 1, 2); };

function crKeys(t, K){
  const n = K.length;
  if (t <= K[0][0]) return K[0].slice(1);
  if (t >= K[n-1][0]) return K[n-1].slice(1);
  let i = 0; while (i < n-2 && t > K[i+1][0]) i++;
  const s = (t - K[i][0])/(K[i+1][0] - K[i][0]);
  const p1 = K[i], p2 = K[i+1];
  const p0 = i > 0 ? K[i-1] : p1.map((v,j)=> 2*v - p2[j]);
  const p3 = i < n-2 ? K[i+2] : p2.map((v,j)=> 2*v - p1[j]);
  const out = [];
  for (let j=1;j<p1.length;j++){
    const a=p0[j], b=p1[j], c=p2[j], d=p3[j];
    out.push(0.5*((2*b) + (-a+c)*s + (2*a-5*b+4*c-d)*s*s + (-a+3*b-3*c+d)*s*s*s));
  }
  return out;
}
/* 56–60 沿柱列低机位推移时与柱列保持 ≥ 39 单位、视角略放宽到 54°：第 1 根柱连同柱顶涡旋始终在画面内（顶 ≥ 200px），
   柱脚不压到画面注释（57s 后 ≤ 746px） */
const CAM = [
  [54.0, -60, 2.6, 36,  -46, 9.5, 0],
  [55.0, -53, 2.8, 35,  -38, 10, 0],
  [56.0, -45, 2.6, 36,  -29, 9.6, -2],
  [57.0, -31, 2.5, 39,   -9, 8.9, -2],
  [58.0, -16, 2.5, 43,    9, 8.7, -2],
  [59.0,  -2, 2.7, 46,   22, 8.4, -2],
  [60.0,  10, 3.8, 48.5, 27, 7.8, -2],
  [61.0,  19, 6.2, 52,   28, 7.0, -2],
  [62.0,  25, 8.2, 56,   28, 6.6, -2],
];
const camAt = t => crKeys(t, CAM);
const fovAt = t => 50 + 4*E(t, 56.3, 57.8) - 2*E(t, 60.0, 61.8);

/* 柱列 */
const NB = 6, H0 = 17, RATIO = 0.6, BX0 = 6, BDX = 9, BZ = -2, BR = 2.1;
const colX = i => BX0 + i*BDX;
const colH = i => H0*Math.pow(RATIO, i);
const colT0 = i => 56 + i*0.35;
const vorR = i => 2.9*Math.pow(0.76, i);
const vorW = i => 0.9*Math.pow(1.45, i);
/* 铭牌、1941 */
const PLQ = { x: -50, z: 6, yaw: 0.14, w: 18, h: 9.6, leg: 3.0 };
const N41 = { x: -22, y: 13.5, z: -9, H: 10 };

V.shot({ id: 's06', start: 54, end: 62, origin: [16000, 0, 0],
  build(ctx){
    const s = ctx.state, G = ctx.group, R = V.rng(61941);
    const pick = a => a[Math.floor(R()*a.length)];
    const hx = V.hex;
    const GOLD = [...V.PAL.yel, ...V.PAL.moon];

    /* ===== 暗色地面：底色圆盘 + 横向笔触 ===== */
    {
      const cv = document.createElement('canvas'); cv.width = cv.height = 512;
      const c = cv.getContext('2d'), g = c.createRadialGradient(256, 256, 40, 256, 256, 256);
      g.addColorStop(0, 'rgba(9,14,36,1)'); g.addColorStop(0.6, 'rgba(9,14,36,.92)'); g.addColorStop(1, 'rgba(9,14,36,0)');
      c.fillStyle = g; c.fillRect(0, 0, 512, 512);
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(240, 150), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
      m.rotation.x = -Math.PI/2; m.position.set(0, -0.05, -10); m.renderOrder = 0; G.add(m);
    }
    const GR = s.ground = [];
    const DARK = ['#0e1838', '#142050', '#1a2a5c', '#101a40', '#1e3060', '#18264e'];
    for (let i=0;i<3200;i++){
      const x = -105 + R()*210, z = -60 + R()*100;
      const edge = clamp(1 - Math.max(Math.abs(x)/105, Math.abs(z + 10)/50), 0, 1);
      GR.push({ x, z, a0: (R()-0.5)*0.5, len: 1.6 + R()*1.6, wid: 0.5 + R()*0.25, col: hx(pick(DARK)), al: (0.55 + R()*0.35)*Math.min(1, edge*4) });
    }
    s.groundS = new V.Strokes(GR.length, { renderOrder: 1 });
    G.add(s.groundS.mesh);
    // 柱脚下的光池
    {
      const cv = document.createElement('canvas'); cv.width = cv.height = 256;
      const c = cv.getContext('2d'), g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, 'rgba(255,200,90,.55)'); g.addColorStop(0.35, 'rgba(232,170,60,.22)'); g.addColorStop(1, 'rgba(232,170,60,0)');
      c.fillStyle = g; c.fillRect(0, 0, 256, 256);
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      s.pools = [];
      for (let i=0;i<NB;i++){
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
        m.rotation.x = -Math.PI/2; m.position.set(colX(i), 0.02, BZ); m.renderOrder = 2;
        const sz = 7 + 9*Math.sqrt(colH(i)/H0); m.scale.set(sz, sz, 1);
        G.add(m); s.pools.push(m);
      }
    }

    /* ===== 发光金柱：竖向笔触堆成 ===== */
    /* 柱身笔触：沿柱身螺旋斜绕（像 s01 柏树的笔触），亮面奶黄/金黄，背光面赭石，边缘夹少量深蓝补色笔触，避免"金色玉米棒"的均匀质感 */
    const CO = s.cols = [];
    for (let b=0;b<NB;b++){
      const H = colH(b), n = Math.max(70, Math.round(H*33));
      for (let i=0;i<n;i++){
        const surf = R() < 0.8, a = R()*TAU, rr = BR*(surf ? 0.86 + R()*0.16 : Math.sqrt(R())*0.8);
        const front = Math.cos(a - 0.15);                          // 朝镜头一侧更亮
        let col; const r = R();
        if (front > 0.4) col = r < 0.22 ? pick(V.PAL.cream) : pick([...V.PAL.yel, ...V.PAL.moon]);
        else if (front > -0.25) col = r < 0.08 ? pick(V.PAL.cream) : pick(['#e8b830', '#d9a22a', '#f0b833', '#c99428', '#e0a83a']);
        else col = r < 0.08 && surf ? pick(['#2c5ea3', '#4a78b8']) : pick(['#a87420', '#8a5e1a', '#b8862a', '#9a6a1e']);
        CO.push({ b, u: (i + R())/n, a, rr, tw: 0.28 + R()*0.26, len: 2.0 + R()*1.4, wid: 0.5 + R()*0.28, col: hx(col) });
      }
    }
    s.colS = new V.Strokes(CO.length, { renderOrder: 3 });
    G.add(s.colS.mesh);
    s.colG = new V.Strokes(NB*8, { additive: true, shape: 'glow', renderOrder: 4 });   // 柱身光晕
    G.add(s.colG.mesh);

    /* ===== 柱顶小涡旋 ===== */
    const VO = s.vor = [];
    const vn = v3(0, 0.5, 0.87).normalize();
    const ve1 = v3(1, 0, 0), ve2 = new THREE.Vector3().crossVectors(vn, ve1).normalize();
    s.vb = { n: vn, e1: ve1, e2: ve2 };
    for (let b=0;b<NB;b++){
      const n = Math.max(50, Math.round(170*Math.pow(0.8, b)));
      for (let i=0;i<n;i++){
        const q = 0.08 + Math.sqrt(R())*0.95, r = R();
        const a = R() < 0.6 ? Math.floor(R()*3)*TAU/3 - 2.2*Math.log(q + 0.05) + (R()-0.5)*0.5 : R()*TAU;
        const col = q < 0.3 ? pick([...V.PAL.cream, ...V.PAL.yel]) : q < 0.6 ? (r < .4 ? pick(V.PAL.yel) : pick([...V.PAL.pale, ...V.PAL.cream])) : q < 0.88 ? pick([...V.PAL.mid, ...V.PAL.pale, ...V.PAL.teal]) : pick(V.PAL.mid);
        VO.push({ b, q, a0: a, h: (R()-0.5)*0.25, len: 0.2 + R()*0.1, wid: 0.075 + R()*0.02, col: hx(col) });
      }
    }
    s.vorS = new V.Strokes(VO.length, { renderOrder: 5 });
    G.add(s.vorS.mesh);
    s.vorG = new V.Strokes(NB*2, { additive: true, shape: 'glow', renderOrder: 6 });   // 涡心的金色亮核
    G.add(s.vorG.mesh);

    /* ===== 连接柱顶的发光线 ===== */
    s.tops = [];
    for (let b=0;b<NB;b++) s.tops.push(v3(colX(b), colH(b) + vorR(b)*1.05, BZ + 0.6));
    s.lineSeg = [];
    let L = 0; for (let b=0;b<NB-1;b++){ const d = s.tops[b].distanceTo(s.tops[b+1]); s.lineSeg.push(d); L += d; }
    s.lineL = L;
    const NL = 220;
    s.lineG = new V.Strokes(NL + 1, { additive: true, shape: 'glow', renderOrder: 7 });
    s.lineB = new V.Strokes(NL, { renderOrder: 6 });
    s.NL = NL;
    G.add(s.lineB.mesh); G.add(s.lineG.mesh);

    /* ===== 能量轴（竖）+ 尺度轴 ===== */
    s.axS = new V.Strokes(90, { renderOrder: 6 });
    G.add(s.axS.mesh);
    const mkLabel = (lines, w, h, px, back = 0.6) => {
      const card = V.card({ w, h, px, draw(c, W, H){
        c.save(); c.translate(W/2, H/2); c.scale(W/2, H/2);           // 椭圆形暗底：宽标签也不会出现上下硬边
        const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
        g.addColorStop(0, `rgba(6,9,26,${back})`); g.addColorStop(0.7, `rgba(6,9,26,${back/2})`); g.addColorStop(1, 'rgba(6,9,26,0)');
        c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore();
        c.shadowColor = 'rgba(0,0,0,.95)'; c.shadowBlur = 14;
        for (const [str, y, font, col] of lines) V.txt(c, str, W/2, H*y, font, col);
      }});
      card.mesh.material.depthWrite = false; card.mesh.renderOrder = 8;
      G.add(card.mesh); return card;
    };
    s.labE = mkLabel([['能量', 0.38, `700 120px ${V.FONT.SANS}`, '#F4ECD8'], ['energy', 0.8, `italic 600 66px ${V.FONT.GARA}`, '#C9C6D8']], 8, 4.2, 512);
    s.labE.mesh.position.set(colX(0) - 9.4, 11.5, BZ + 0.5);
    s.labS = mkLabel([['大 ← 漩涡尺度 → 小', 0.4, `700 112px ${V.FONT.SANS}`, '#F4ECD8'], ['large  ←  eddy size  →  small', 0.82, `italic 600 64px ${V.FONT.GARA}`, '#C9C6D8']], 22, 3.9, 1400, 0.3);
    s.labS.mesh.position.set(colX(0) + (colX(NB-1) - colX(0))/2, 0.9, BZ + 11);
    

    /* ===== 铭牌（立体书式翻起） ===== */
    s.plqPivot = new THREE.Group(); s.plqPivot.position.set(PLQ.x, 0, PLQ.z); s.plqPivot.rotation.y = PLQ.yaw;
    G.add(s.plqPivot);
    s.plqHinge = new THREE.Group(); s.plqPivot.add(s.plqHinge);
    const plq = V.card({ w: PLQ.w, h: PLQ.h, px: 1400, doubleSide: false, draw(c, W, H){
      V.drawPaper(c, W, H);
      c.strokeStyle = 'rgba(184,134,42,.85)'; c.lineWidth = 6; c.strokeRect(46, 46, W-92, H-92);
      c.strokeStyle = 'rgba(184,134,42,.45)'; c.lineWidth = 2; c.strokeRect(62, 62, W-124, H-124);
      V.txt(c, '柯尔莫哥洛夫', W/2, H*0.34, `900 156px ${V.FONT.SERIF}`, '#2a2218');
      V.txt(c, 'Andrey Kolmogorov', W/2, H*0.58, `italic 600 100px ${V.FONT.GARA}`, '#4e3e2e');
      c.fillStyle = 'rgba(181,58,47,.75)'; c.fillRect(W/2 - 80, H*0.68, 160, 5);
      c.save(); c.font = `600 62px ${V.FONT.SANS}`; c.fillStyle = '#8a6420'; c.textAlign = 'center'; c.textBaseline = 'middle';
      if ('letterSpacing' in c) c.letterSpacing = '6px';
      c.fillText('1903 – 1987 · MOSCOW', W/2, H*0.80); c.restore();
    }});
    plq.mesh.position.set(0, PLQ.leg + PLQ.h/2, 0.2); plq.mesh.renderOrder = 2;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(PLQ.w + 0.3, PLQ.h + 0.3, 0.35), new THREE.MeshBasicMaterial({ color: 0x8a7a5e, transparent: true }));
    slab.position.set(0, PLQ.leg + PLQ.h/2, 0); slab.renderOrder = 1;
    s.plqHinge.add(slab); s.plqHinge.add(plq.mesh);
    s.plq = plq; s.slab = slab;
    // 两条笔触支脚 + 底座
    s.legS = new V.Strokes(70, { renderOrder: 3 });
    {
      let k = 0;
      for (const lx of [-PLQ.w*0.32, PLQ.w*0.32]) for (let i=0;i<14;i++){
        s.legS.set(k++, lx + (R()-0.5)*0.4, (i + 0.5)/14*PLQ.leg, -0.1, (R()-0.5)*0.15, 1, 0, 0.7, 0.42, hx(pick(['#3a2a20', '#4a3628', '#5a4230', '#2e2018'])), 1);
      }
      for (let i=0;i<42;i++) s.legS.set(k++, (R()-0.5)*PLQ.w*0.9, 0.15 + R()*0.3, (R()-0.5)*2.2, 1, 0, (R()-0.5)*0.3, 1.3, 0.45, hx(pick(['#2a2018', '#3a2a20', '#1e1812'])), 0.9);
      s.legS.commit();
    }
    s.plqHinge.add(s.legS.mesh);

    /* ===== 1941：金色笔触组成的立体数字 ===== */
    {
      const MW = 1000, MH = 380;
      const cv = document.createElement('canvas'); cv.width = MW; cv.height = MH;
      const c = cv.getContext('2d');
      c.fillStyle = '#fff'; c.font = `900 340px ${V.FONT.SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('1941', MW/2, MH/2 + 10);
      const bl = document.createElement('canvas'); bl.width = MW; bl.height = MH;
      const cb = bl.getContext('2d'); cb.filter = 'blur(9px)'; cb.drawImage(cv, 0, 0);
      const A = c.getImageData(0, 0, MW, MH).data, B = cb.getImageData(0, 0, MW, MH).data;
      const al = (D, x, y) => D[(Math.round(clamp(y, 0, MH-1))*MW + Math.round(clamp(x, 0, MW-1)))*4 + 3];
      // 找字形的实际高度，换算成世界单位
      let y0 = MH, y1 = 0, x0 = MW, x1 = 0;
      for (let y=0;y<MH;y+=2) for (let x=0;x<MW;x+=2) if (al(A, x, y) > 128){ y0 = Math.min(y0, y); y1 = Math.max(y1, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
      const sc = N41.H/(y1 - y0), cx = (x0 + x1)/2, cy = (y0 + y1)/2;
      const N = s.n41 = [];
      const STEP = 6.5;
      for (let y=y0; y<=y1; y+=STEP) for (let x=x0; x<=x1; x+=STEP){
        const jx = x + (R()-0.5)*STEP, jy = y + (R()-0.5)*STEP;
        if (al(A, jx, jy) < 140) continue;
        const gx = al(B, jx+4, jy) - al(B, jx-4, jy), gy = al(B, jx, jy+4) - al(B, jx, jy-4);
        const gm = Math.hypot(gx, gy);
        let dx = 0, dy = 1;
        if (gm > 18){ dx = -gy/gm; dy = gx/gm; }                      // 沿字形轮廓方向
        else { dx = (R()-0.5)*0.4; dy = 1; }
        const layers = R() < 0.55 ? 2 : 1;
        for (let L=0; L<layers; L++){
          const back = L === 1;
          const wx = (jx - cx)*sc, wy = -(jy - cy)*sc, wz = back ? -0.55 - R()*0.5 : (R()-0.4)*0.6;
          N.push({ x: wx, y: wy, z: wz, dx, dy: -dy, key: (jx - x0)/(x1 - x0),
            sx: (R()-0.5)*7, sy: (R()-0.5)*6 + 3, sz: 4 + R()*6,
            len: (0.75 + R()*0.45)*(back ? 1.1 : 1), wid: 0.3 + R()*0.1,
            col: hx(back ? pick(['#b8862a', '#9a6a1e', '#c99428']) : pick([...GOLD, GOLD[1], V.PAL.cream[0]])) });
        }
      }
      s.n41S = new V.Strokes(N.length, { renderOrder: 3 });
      s.n41G = new V.Strokes(Math.ceil(N.length/7), { additive: true, shape: 'glow', renderOrder: 4 });
      s.n41grp = new THREE.Group(); s.n41grp.position.set(N41.x, N41.y, N41.z); s.n41grp.rotation.y = 0.18;
      s.n41grp.add(s.n41S.mesh); s.n41grp.add(s.n41G.mesh); G.add(s.n41grp);
    }

    /* ===== 前景光尘 ===== */
    const DU = s.dust = [];
    for (let i=0;i<220;i++) DU.push({ x: -80 + R()*150, y: 0.5 + R()*22, z: 4 + R()*14, ph: R()*TAU, sz: 0.35 + R()*0.6,
      col: hx(pick([...V.PAL.yel, ...V.PAL.cream, ...V.PAL.pale])), a: 0.25 + R()*0.4 });
    s.dustS = new V.Strokes(DU.length, { additive: true, shape: 'glow', renderOrder: 9 });
    G.add(s.dustS.mesh);
  },

  update(t, lt, ctx){
    const s = ctx.state;
    V.backdrop.set({ opacity: 0.75 });

    /* ---- 柱子生长进度 ---- */
    const ck = [], ch = [];
    for (let b=0;b<NB;b++){ const k = easeOut(P(t, colT0(b), colT0(b) + 0.9)); ck.push(k); ch.push(colH(b)*k); }

    /* ---- 地面（被柱子照亮）；离相机很近的笔触淡出，避免低机位时画面下方出现大块糊斑 ---- */
    const cNow = camAt(t);
    s.ground.forEach((d, i) => {
      const dc = Math.hypot(d.x - cNow[0], d.z - cNow[2]), near = clamp((dc - 7)/11, 0, 1);
      if (near <= 0){ s.groundS.hide(i); return; }
      let glow = 0;
      for (let b=0;b<NB;b++){ if (ck[b] <= 0) continue; const dx = d.x - colX(b), dz = d.z - BZ;
        glow += ck[b]*(0.35 + 0.65*Math.sqrt(colH(b)/H0))*Math.exp(-(dx*dx + dz*dz)/(18 + 40*colH(b)/H0)); }
      glow = Math.min(glow, 1)*0.85;
      const c = d.col, col = [lerp(c[0], 0.86, glow), lerp(c[1], 0.62, glow), lerp(c[2], 0.22, glow)];
      s.groundS.set(i, d.x, 0.06, d.z, Math.cos(d.a0), 0, Math.sin(d.a0), d.len, d.wid, col, d.al*near*near);
    });
    s.groundS.commit();
    s.pools.forEach((m, b) => { m.material.opacity = ck[b]; m.visible = ck[b] > 0.01; });

    /* ---- 柱身 ---- */
    s.cols.forEach((d, i) => {
      const k = ck[d.b], H = colH(d.b), y = d.u*H;
      const front = ch[d.b] - y;                                  // 生长前沿以下才显示
      if (k <= 0 || front < -0.2){ s.colS.hide(i); return; }
      const a = d.a + 0.25*Math.sin(t*0.8 + d.u*6);
      const x = colX(d.b) + Math.cos(a)*d.rr, z = BZ + Math.sin(a)*d.rr;
      const nearTop = clamp(1 - front/1.2, 0, 1);
      const col = nearTop > 0 && k < 1 ? [lerp(d.col[0], 1, nearTop*0.7), lerp(d.col[1], 0.97, nearTop*0.7), lerp(d.col[2], 0.85, nearTop*0.7)] : d.col;
      s.colS.set(i, x, Math.min(y, ch[d.b]), z, Math.cos(a + 1.57)*d.tw, 1, Math.sin(a + 1.57)*d.tw, d.len*Math.min(1, 0.4 + H*0.2), d.wid, col, clamp((front + 0.2)*3, 0, 1));
    });
    s.colS.commit();
    for (let b=0;b<NB;b++){
      for (let j=0;j<8;j++){
        const idx = b*8 + j;
        if (ck[b] <= 0){ s.colG.hide(idx); continue; }
        const y = ch[b]*(j + 0.5)/8;
        const pulse = 1 + 0.06*Math.sin(t*2.2 + b + j);
        s.colG.set(idx, colX(b), y, BZ, 0, 1, 0, Math.max(ch[b]/4, 3), BR*4.2*pulse, [1.0, 0.72, 0.28], 0.17*ck[b]);
      }
    }
    s.colG.commit();

    /* ---- 柱顶涡旋 ---- */
    const vb = s.vb;
    s.vor.forEach((d, i) => {
      const b = d.b, k = E(t, colT0(b) + 0.6, colT0(b) + 1.2);
      if (k <= 0){ s.vorS.hide(i); return; }
      const Rv = vorR(b)*lerp(0.3, 1, easeOut(k)), w = vorW(b)*(0.6 + 0.6*(1 - Math.min(d.q, 1)));
      const a = d.a0 + w*(t - 56) + (1 - k)*2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const cx = colX(b), cy = ch[b] + vorR(b)*1.05, cz = BZ + 0.6;
      const r = d.q*Rv, h = d.h*Rv;
      const px = cx + (vb.e1.x*ca + vb.e2.x*sa)*r + vb.n.x*h, py = cy + (vb.e1.y*ca + vb.e2.y*sa)*r + vb.n.y*h, pz = cz + (vb.e1.z*ca + vb.e2.z*sa)*r + vb.n.z*h;
      const tx = -vb.e1.x*sa + vb.e2.x*ca, ty = -vb.e1.y*sa + vb.e2.y*ca, tz = -vb.e1.z*sa + vb.e2.z*ca;
      s.vorS.set(i, px, py, pz, tx, ty, tz, d.len*vorR(b)*3.2, d.wid*vorR(b)*3.2, d.col, k);
    });
    s.vorS.commit();
    for (let b=0;b<NB;b++){
      const k = E(t, colT0(b) + 0.6, colT0(b) + 1.2);
      if (k <= 0){ s.vorG.hide(b*2); s.vorG.hide(b*2+1); continue; }
      const cx = colX(b), cy = ch[b] + vorR(b)*1.05, cz = BZ + 0.6 + 0.2, R0 = vorR(b), pulse = 1 + 0.08*Math.sin(t*3 + b);
      s.vorG.set(b*2, cx, cy, cz, 1, 0, 0, R0*1.5*pulse, R0*1.5*pulse, [1.0, 0.80, 0.36], 0.45*k);
      s.vorG.set(b*2+1, cx, cy, cz, 1, 0, 0, R0*0.55, R0*0.55, [1.0, 0.95, 0.78], 0.8*k);
    }
    s.vorG.commit();

    /* ---- 柱顶连线 60–61.6 ---- */
    const lk = E(t, 60.0, 61.6);
    const tops = s.tops.map((p, b) => v3(p.x, ch[b] + vorR(b)*1.05, p.z));
    const ptAt = dist => {
      let d = dist;
      for (let b=0;b<NB-1;b++){ const L = s.lineSeg[b]; if (d <= L || b === NB-2){ const f = clamp(d/L, 0, 1); return [tops[b].clone().lerp(tops[b+1], f), tops[b+1].clone().sub(tops[b])]; } d -= L; }
    };
    for (let i=0;i<s.NL;i++){
      const dd = (i + 0.5)/s.NL*s.lineL;
      if (lk <= 0 || dd > lk*s.lineL){ s.lineG.hide(i); s.lineB.hide(i); continue; }
      const [p, dir] = ptAt(dd);
      const fl = 0.85 + 0.15*Math.sin(t*6 - i*0.3);
      s.lineB.set(i, p.x, p.y, p.z + 0.3, dir.x, dir.y, dir.z, 0.9, 0.28, [0.99, 0.95, 0.82], 1);
      s.lineG.set(i, p.x, p.y, p.z + 0.3, dir.x, dir.y, dir.z, 1.4, 1.0, [1.0, 0.85, 0.5], 0.32*fl);
    }
    if (lk > 0 && lk < 1){ const [p] = ptAt(lk*s.lineL); s.lineG.set(s.NL, p.x, p.y, p.z + 0.4, 1, 0, 0, 3.2, 3.2, [1, 0.95, 0.8], 0.9); }
    else s.lineG.hide(s.NL);
    s.lineG.commit(); s.lineB.commit();

    /* ---- 轴 ---- */
    const ek = E(t, 56.4, 57.2), sk = E(t, 60.2, 60.9);
    {
      let k = 0;
      const AX = colX(0) - 4.6, top = 20 * ek;
      for (let i=0;i<40;i++){                                     // 竖轴：一串细笔触
        const y = (i + 0.5)/40*20;
        if (y > top) { s.axS.hide(k++); continue; }
        s.axS.set(k++, AX + 0.08*Math.sin(i*1.7), y, BZ, 0.04*Math.sin(i), 1, 0, 1.0, 0.32, [0.96, 0.88, 0.62], 0.95);
      }
      const ah = ek >= 1 ? 1 : 0;
      s.axS.set(k++, AX - 0.45, 19.6, BZ, 0.55, 1, 0, 1.4, 0.3, [0.96, 0.88, 0.62], ah);
      s.axS.set(k++, AX + 0.45, 19.6, BZ, -0.55, 1, 0, 1.4, 0.3, [0.96, 0.88, 0.62], ah);
      const x0 = colX(0) - 3, x1 = colX(NB-1) + 3.5, zA = BZ + 5.5;  // 横轴：地面上的一条细线，两端带箭头
      for (let i=0;i<44;i++){
        const x = lerp(x0, x1, (i + 0.5)/44);
        s.axS.set(k++, x, 0.12, zA, 1, 0, 0.02*Math.sin(i*1.3), 1.4, 0.26, [0.93, 0.9, 0.82], 0.85*sk*clamp((sk*1.2 - (i/44))*4, 0, 1));
      }
      for (const [x, sg] of [[x0, -1], [x1, 1]]){
        s.axS.set(k++, x - sg*0.5, 0.12, zA - 0.45, sg, 0, 0.9, 1.1, 0.2, [0.93, 0.9, 0.82], sk);
        s.axS.set(k++, x - sg*0.5, 0.12, zA + 0.45, sg, 0, -0.9, 1.1, 0.2, [0.93, 0.9, 0.82], sk);
      }
      while (k < 90) s.axS.hide(k++);
      s.axS.commit();
    }
    s.labE.opacity = ek;
    s.labS.opacity = sk;
    { const cp = camAt(58.8); s.labE.mesh.lookAt(ctx.local(cp[0], cp[1], cp[2])); }     // lookAt 需要世界坐标
    { const cp = camAt(61.5); s.labS.mesh.lookAt(ctx.local(cp[0], cp[1], cp[2])); }

    /* ---- 铭牌 ---- */
    {
      const k = P(t, 53.6, 54.5);                       // 提前出现：转场融合时铭牌已在画面里
      s.plqHinge.rotation.x = lerp(-Math.PI/2, 0, clamp(easeOutBack(k), 0, 1.15));
      const op = clamp(k*4, 0, 1);
      s.plq.opacity = op; s.slab.material.opacity = op; s.legS.opacity = op;
      s.plqPivot.visible = op > 0;
      s.plqHinge.position.y = 0.12*Math.sin(t*1.4)*k;
    }

    /* ---- 1941 ---- */
    {
      const N = s.n41, S = s.n41S, Gl = s.n41G, fade = 1 - E(t, 57.7, 58.4);
      let gi = 0;
      for (let i=0;i<N.length;i++){
        const d = N[i];
        const k = easeOut(P(t, 54.9 + d.key*0.7, 54.9 + d.key*0.7 + 0.55));
        if (k <= 0){ S.hide(i); if (i % 7 === 0) Gl.hide(gi++); continue; }
        const o = 1 - k;
        const x = d.x + d.sx*o, y = d.y + d.sy*o + 0.12*Math.sin(t*1.1 + d.x*0.2), z = d.z + d.sz*o;
        S.set(i, x, y, z, d.dx + o*0.6, d.dy, 0, d.len, d.wid, d.col, clamp(k*2, 0, 1)*fade);
        if (i % 7 === 0) Gl.set(gi++, x, y, z - 0.6, 1, 0, 0, 2.4, 2.4, [1.0, 0.78, 0.3], 0.1*k*fade);
      }
      S.commit(); Gl.commit();
    }

    /* ---- 光尘 ---- */
    s.dust.forEach((d, i) => {
      const x = d.x + Math.sin(t*0.4 + d.ph)*1.0, y = d.y + Math.sin(t*0.33 + d.ph*2)*0.8 + 0.25*(t - 54);
      s.dustS.set(i, x, y, d.z, 1, 0, 0, d.sz, d.sz, d.col, d.a*(0.6 + 0.4*Math.sin(t*2.3 + d.ph)));
    });
    s.dustS.commit();

    /* ---- 相机 ---- */
    const c = camAt(t);
    ctx.cam(v3(c[0], c[1], c[2]), v3(c[3], c[4], c[5]), fovAt(t), 0.02*Math.sin(t*0.5));
  },
});
})();

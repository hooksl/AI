/* s05_cascade · 46–54s · 能量级联（非世界镜头）
   46.2  一个由笔触组成、有厚度的立体大涡旋（漏斗形、轴略斜对镜头）长出来
   47.2  金色能量流（glow 粒子 + 短金色笔触）沿曲线从大涡流向 3 个中涡，中涡依次长出
   48.2  中涡再把能量传给 9 个小涡（分布在不同深度）
   49.0  小涡散成橙红色的细碎火花 = 热；每一层逐级变暗、变小、转得更快；每层下方有小型 3D 标签
   50.6 / 51.6 / 52.6  三张米白纸卡（急流 / 烟囱的烟 / 咖啡里的奶）从右后方翻转飞入，卡片上方各有一个 3D 笔触小景，
         纸卡在空中轻微摆动、卷曲；三张卡错开深度与高度、朝向各不相同（三联画式），不排成一行正对镜头
   镜头：沿级联方向（+x）持续横移，从大涡移向小涡；前景有飘浮的光尘，后景有一层深蓝"天空气流"笔触，
         与远处背景天幕形成三层视差；50s 后镜头边横移边后拉、升高，把三张纸卡和级联的尾巴一起收进画面。 */
(function(){
const { E, P, lerp, clamp, easeOut, smooth } = V;
const v3 = V.v3, TAU = Math.PI*2;
const frac = x => x - Math.floor(x);

/* 时间关键帧上的 Catmull-Rom 插值（速度连续，不会在关键帧处停顿） */
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
/* 相机（局部坐标）：[t, 位置 xyz, 目标 xyz] */
const CAM = [
  [46.0, -15, 4.5, 39,    1, 6.5, 0],
  [47.0,  -3, 5.0, 41,   13, 7, 0],
  [48.0,  14, 5.5, 43,   29, 7, -2],
  [49.0,  32, 6.0, 44,   47, 7.2, -3],
  [50.0,  50, 6.5, 47,   63, 7.6, -2],
  [51.0,  66, 7.2, 49,   79, 8.0, 0],
  [52.0,  82, 8.0, 51,   93, 8.5, 2],
  [53.0,  95, 8.8, 52,  102, 8.6, 4],
  [54.0, 106, 9.5, 52,  108, 8.6, 4],
];
const camAt = t => crKeys(t, CAM);

function basis(n){
  const e1 = new THREE.Vector3().crossVectors(v3(0,1,0), n).normalize();
  const e2 = new THREE.Vector3().crossVectors(n, e1).normalize();
  return [e1, e2];
}

/* ---------- 级联结构 ---------- */
const LV = [                              // 每一层：亮度、角速度、标签
  { bright: 1.00, om: 0.55, zh: '大涡', en: 'big eddies',    lab: [ 0, 1.4, 3], tl: 46.7 },
  { bright: 0.84, om: 1.25, zh: '中涡', en: 'smaller',       lab: [29, 2.4, 7], tl: 47.7 },
  { bright: 0.72, om: 2.70, zh: '小涡', en: 'smaller still', lab: [49, 2.6, 5], tl: 48.7 },
  { bright: 0.60, om: 0,    zh: '热',   en: 'heat',          lab: [68, 2.8, 3], tl: 49.35 },
];
const BIG = { C: v3(0, 12.5, 0), n: v3(-0.32, 0.10, 1), R: 9 };
const MID = [                             // 三个中涡在画面上呈三角分布（不同深度），48–49s 不互相遮挡
  { C: v3(23, 18, -6),  n: v3(-0.10, 0.25, 1) },
  { C: v3(29, 9.8, 5),  n: v3(-0.40, -0.05, 1) },
  { C: v3(37, 22, -14), n: v3(0.15, 0.05, 1) },
];
const SMALL = [                           // [位置, 来自哪个中涡]；49s 时屏幕上两两间距 ≥ 100px
  [v3(42, 20, -2), 0], [v3(46, 17, -8), 0], [v3(38.5, 11, 7), 0],
  [v3(43, 8, 9), 1], [v3(49, 6.5, 4), 1], [v3(50, 11.5, 8), 1],
  [v3(53, 27, -16), 2], [v3(56, 22.5, -12), 2], [v3(56, 16, -18), 2],
];
const HEAT = { C: v3(68, 13, -4), r: [9, 6.5, 9] };

/* ---------- 三张纸卡 ---------- */
const CW = 16, CH = 8.8;
/* 三张卡错开深度和高度、各自朝向不同（左卡转向右、右卡转向左，像打开的三联画），不排成一行正对镜头；
   yawOff 为相对"正对 53.4s 时相机"的偏转，最终观看角约 10°–30° */
const EXH = [
  { zh: '急流',       en: 'Rapids',         kind: 'water',  P: v3(86, 9.4, -1),  t0: 50.6, yawOff: 0.45 },
  { zh: '烟囱的烟',   en: 'Chimney smoke',  kind: 'smoke',  P: v3(106, 7.6, 15), t0: 51.6, yawOff: -0.12 },
  { zh: '咖啡里的奶', en: 'Milk in coffee', kind: 'coffee', P: v3(129, 8.4, 6),  t0: 52.6, yawOff: -0.45 },
];
const VSC = { water: 1.15, smoke: 0.85, coffee: 0.9 };   // 小景缩放（急流小景扁平放大一点；烟囱的烟不顶进顶部标签区）

V.shot({ id: 's05', start: 46, end: 54, origin: [12000, 0, 0],
  build(ctx){
    const s = ctx.state, G = ctx.group, R = V.rng(50546);
    const pick = a => a[Math.floor(R()*a.length)];
    const hx = h => V.hex(h);
    const scale = (c, k) => [c[0]*k, c[1]*k, c[2]*k];

    /* ===== 涡旋 ===== */
    const ED = s.ED = [];
    const addEddy = (lvl, C, n, Rr, dir, t0, dur, src) => {
      n = n.clone().normalize(); const [e1, e2] = basis(n);
      ED.push({ lvl, C, n, e1, e2, R: Rr, dir, t0, dur, om: LV[lvl].om, src, k: 0 });
      return ED.length - 1;
    };
    addEddy(0, BIG.C, BIG.n, BIG.R, 1, 46.15, 0.85, -1);
    MID.forEach((m, j) => addEddy(1, m.C, m.n, 4.4, j%2 ? 1 : -1, 47.25 + j*0.1, 0.8, 0));
    SMALL.forEach(([C, pj], j) => addEddy(2, C, v3(Math.sin(j*2.1)*0.45, Math.cos(j*1.7)*0.3, 1), 2.05, j%2 ? -1 : 1, 48.25 + (j%3)*0.08 + pj*0.05, 0.7, 1 + pj));

    const counts = [2300, 560, 140];
    const ED_DATA = s.edData = [];
    ED.forEach((ed, ei) => {
      const lv = LV[ed.lvl], n = counts[ed.lvl];
      const arms = ed.lvl === 0 ? 4 : 3;
      for (let i=0;i<n;i++){
        let q = Math.sqrt(R())*1.18 + 0.03;
        let a;
        if (R() < 0.62){ const arm = Math.floor(R()*arms); a = arm*TAU/arms - 2.4*Math.log(q + 0.05) + (R()-0.5)*0.55; }
        else a = R()*TAU;
        const qq = Math.min(q, 1);
        // 漏斗：中心向内（远离镜头）凹陷，外圈略翘；再加上随机厚度
        const h = -0.62*Math.pow(1 - qq, 1.5) + 0.08*qq*qq + (R()-0.5)*0.30*(1 - 0.45*qq);
        let col;
        const r = R();
        if (q < 0.16) col = pick([...V.PAL.cream, ...V.PAL.yel]);
        else if (q < 0.38) col = r < .25 ? pick(V.PAL.yel) : pick([...V.PAL.pale, ...V.PAL.cream]);
        else if (q < 0.7) col = r < .14 ? pick(V.PAL.yel) : r < .3 ? pick(V.PAL.cream) : pick([...V.PAL.mid, ...V.PAL.pale]);
        else if (q < 0.95) col = r < .1 ? pick(V.PAL.cream) : pick([...V.PAL.mid, ...V.PAL.deep]);
        else col = pick(V.PAL.deep);
        const lenK = ed.lvl === 0 ? 1 : ed.lvl === 1 ? 1.15 : 1.35;
        ED_DATA.push({ e: ei, q, a0: a, h, key: R(),
          len: (0.12 + R()*0.09)*(0.6 + 0.6*qq)*lenK, wid: (0.05 + R()*0.02)*lenK,
          pitch: 0.18 + R()*0.2, col: scale(hx(col), lv.bright), al: q > 1 ? 0.75 : 1 });
      }
    });
    s.edS = new V.Strokes(ED_DATA.length, { renderOrder: 3 });
    G.add(s.edS.mesh);
    // 涡心的金色光晕（能量）
    s.coreG = new V.Strokes(ED.length*2, { additive: true, shape: 'glow', renderOrder: 4 });
    G.add(s.coreG.mesh);

    /* ===== 能量流：沿曲线流动的金色粒子 ===== */
    const FL = s.flows = [];
    const mkCurve = (A, B, side) => {
      const D = B.clone().sub(A), L = D.length();
      const perp = new THREE.Vector3().crossVectors(D, v3(0,0,1)).normalize();
      const c = new THREE.CatmullRomCurve3([
        A, A.clone().addScaledVector(D, 0.35).addScaledVector(perp, side*L*0.13).add(v3(0, 0, L*0.12)),
        A.clone().addScaledVector(D, 0.72).addScaledVector(perp, side*L*0.05).add(v3(0, 0, L*0.06)), B.clone()]);
      return c.getSpacedPoints(64);
    };
    ED.forEach((ed, ei) => {
      if (ed.src < 0) return;
      const P0 = ED[ed.src];
      const dirTo = ed.C.clone().sub(P0.C);
      const planar = dirTo.clone().addScaledVector(P0.n, -dirTo.dot(P0.n)).normalize();
      const A = P0.C.clone().addScaledVector(planar, P0.R*0.8);
      const side = ed.C.y >= P0.C.y ? -1 : 1;           // 上方的子涡向上弓、下方的向下弓，互不交叉
      const pts = mkCurve(A, ed.C, side);
      const ts = ed.lvl === 1 ? 46.85 + (ei-1)*0.1 : 47.85 + (ei%3)*0.06;
      FL.push({ pts, ts, travel: 0.45, sp: ed.lvl === 1 ? 0.55 : 0.8, s0: ed.lvl === 1 ? 1.0 : 0.7, s1: ed.lvl === 1 ? 0.65 : 0.45,
        n: ed.lvl === 1 ? 34 : 15, bright: LV[ed.lvl - 1].bright });
    });
    // 粒子间距、大小、速度都随机：读起来是一股流动的能量，而不是等距虚线
    const FP = s.fp = [];
    FL.forEach((f, fi) => { for (let i=0;i<f.n;i++) FP.push({ f: fi, off: R(), spk: 0.82 + R()*0.36, szk: 0.5 + R()*0.85, ph: R()*TAU, j: (R()-0.5)*0.9, col: V.hex(pick([...V.PAL.yel, ...V.PAL.moon, V.PAL.cream[0]])) }); });
    s.flowG = new V.Strokes(FP.length, { additive: true, shape: 'glow', renderOrder: 5 });
    s.flowB = new V.Strokes(FP.length, { renderOrder: 4 });
    s.NTR = 22;                                                     // 每条能量流的柔光底（已流到的部分）
    s.trail = new V.Strokes(FL.length*s.NTR, { additive: true, shape: 'glow', renderOrder: 4 });
    G.add(s.trail.mesh); G.add(s.flowB.mesh); G.add(s.flowG.mesh);

    /* ===== 热：小涡散出的橙红火花 ===== */
    const HOT = ['#e8743a', '#d9502e', '#f0a050', '#c43c2a', '#f4b060', '#e06040'];
    const SP = s.sp = [];
    const smalls = ED.filter(e => e.lvl === 2);
    for (let i=0;i<230;i++){                // 流出的火花
      const src = smalls[i % 9];
      const tgt = HEAT.C.clone().add(v3((R()-0.3)*HEAT.r[0]*1.6, (R()-0.5)*HEAT.r[1]*2, (R()-0.5)*HEAT.r[2]*2));
      SP.push({ stream: 1, src: src.C, tgt, off: R(), ph: R()*TAU, ph2: R()*TAU, sz: 0.3 + R()*0.35, col: hx(pick(HOT)), brush: R() < 0.45 });
    }
    for (let i=0;i<380;i++){                // 停留、闪烁的热点
      const u = R()*2 - 1, th = R()*TAU, rr = Math.cbrt(R());
      const b = v3(Math.sqrt(1-u*u)*Math.cos(th)*rr, u*rr, Math.sqrt(1-u*u)*Math.sin(th)*rr);
      const base = HEAT.C.clone().add(v3(b.x*HEAT.r[0], b.y*HEAT.r[1], b.z*HEAT.r[2]));
      SP.push({ stream: 0, base, key: clamp((b.x + 1)/2, 0, 1)*0.7 + R()*0.3, ph: R()*TAU, ph2: R()*TAU, ph3: R()*TAU,
        sz: 0.25 + R()*0.4, col: hx(pick(HOT)), brush: R() < 0.4 });
    }
    s.spG = new V.Strokes(SP.length, { additive: true, shape: 'glow', renderOrder: 5 });
    s.spB = new V.Strokes(SP.length, { renderOrder: 4 });
    G.add(s.spB.mesh); G.add(s.spG.mesh);

    /* ===== 前景光尘 + 后景"天空气流" ===== */
    const DU = s.dust = [];
    for (let i=0;i<300;i++) DU.push({ x: -50 + R()*240, y: -12 + R()*44, z: 18 + R()*26, ph: R()*TAU, len: 0.5 + R()*0.9,
      col: hx(pick([...V.PAL.pale, ...V.PAL.cream, ...V.PAL.yel])), a: 0.25 + R()*0.45 });
    s.dustS = new V.Strokes(DU.length, { additive: true, shape: 'glow', renderOrder: 6 });
    G.add(s.dustS.mesh);
    const BG = s.bg = [];
    const GH = [[-30, 30, -150, 30, 1], [40, -12, -170, 34, -1], [100, 34, -160, 32, 1], [160, -6, -150, 30, -1]];
    GH.forEach(([gx, gy, gz, gr, gd]) => { for (let i=0;i<300;i++){
      const q = 0.15 + Math.sqrt(R())*0.95, r = R();
      BG.push({ cx: gx, cy: gy, cz: gz + (R()-0.5)*10, rr: q*gr, a0: R()*TAU, w: gd*(0.05 + 0.08*(1.1 - q)),
        len: 4.5 + R()*3, wid: 1.6 + R()*0.6,
        col: hx(r < .75 ? pick(V.PAL.deep) : pick(V.PAL.mid)), a: 0.12 + R()*0.1 }); } });
    s.bgS = new V.Strokes(BG.length, { renderOrder: 1 });
    G.add(s.bgS.mesh);

    /* ===== 层级标签（小型 3D 文字牌） ===== */
    s.labels = LV.map((lv, i) => {
      const card = V.card({ w: 10.5, h: 3.9, px: 640, draw(c, W, H){
        const g = c.createRadialGradient(W/2, H/2, 10, W/2, H/2, W*0.48);
        g.addColorStop(0, 'rgba(6,9,26,.62)'); g.addColorStop(0.7, 'rgba(6,9,26,.35)'); g.addColorStop(1, 'rgba(6,9,26,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.shadowColor = 'rgba(0,0,0,.95)'; c.shadowBlur = 16;
        V.txt(c, lv.zh, W/2, H*0.37, `700 112px ${V.FONT.SANS}`, i === 3 ? '#F09A62' : '#F4ECD8');
        V.txt(c, lv.en, W/2, H*0.79, `italic 600 64px ${V.FONT.GARA}`, i === 3 ? '#E8B898' : '#C9C6D8');
      }});
      card.mesh.material.depthWrite = false; card.mesh.renderOrder = 7;
      card.mesh.position.set(...lv.lab);
      const cp = camAt(lv.tl + 1.0);
      card.mesh.lookAt(cp[0], lerp(lv.lab[1], cp[1], 0.6), cp[2]);
      G.add(card.mesh);
      return card;
    });

    /* ===== 三张纸卡 + 3D 小景 ===== */
    s.exh = EXH.map((ex, ei) => {
      const g = new THREE.Group(); G.add(g);
      const card = V.card({ w: CW, h: CH, px: 1024, doubleSide: false, draw(c, W, H){
        V.drawPaper(c, W, H);
        c.strokeStyle = 'rgba(42,34,24,.45)'; c.lineWidth = 3; c.strokeRect(40, 40, W-80, H-80);
        V.txt(c, ex.zh, W/2, H*0.43, `900 ${ex.zh.length > 4 ? 150 : 168}px ${V.FONT.SERIF}`, '#2a2218');
        c.fillStyle = 'rgba(181,58,47,.75)'; c.fillRect(W/2 - 60, H*0.62, 120, 5);
        V.txt(c, ex.en, W/2, H*0.76, `italic 600 92px ${V.FONT.GARA}`, '#5a4a38');
      }});
      const geo = new THREE.PlaneGeometry(CW, CH, 20, 11);
      card.mesh.geometry.dispose(); card.mesh.geometry = geo;
      card.mesh.material.side = THREE.FrontSide; card.mesh.renderOrder = 2;
      const back = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xcdbfa4, side: THREE.BackSide, transparent: true }));
      back.renderOrder = 2;
      const paper = new THREE.Group(); paper.add(card.mesh); paper.add(back); g.add(paper);
      const sc = VSC[ex.kind], vig = buildVignette(ex.kind, R, pick, sc);
      const vg = new THREE.Group(); vg.position.set(0, CH/2 + vig.bottom*sc + 0.5, -0.6); vg.scale.setScalar(sc); vg.rotation.x = vig.tilt;
      vig.S.mesh.renderOrder = 4; vg.add(vig.S.mesh); g.add(vg);
      if (vig.G){ vig.G.mesh.renderOrder = 5; g.add(vig.G.mesh); }
      const cpF = camAt(53.4);
      const yaw = Math.atan2(cpF[0] - ex.P.x, cpF[2] - ex.P.z) + ex.yawOff;
      return { ex, g, paper, card, back, geo, base: Float32Array.from(geo.attributes.position.array), vig, yaw, ph: ei*1.9 + 0.4 };
    });
  },

  update(t, lt, ctx){
    const s = ctx.state;
    V.backdrop.set({ opacity: 0.6 });

    /* ---- 涡旋 ---- */
    const ED = s.ED;
    for (const ed of ED) ed.k = E(t, ed.t0, ed.t0 + ed.dur);
    const S = s.edS;
    s.edData.forEach((d, i) => {
      const ed = ED[d.e], k = ed.k;
      const show = k*1.25 - d.key;
      if (show <= 0){ S.hide(i); return; }
      const grow = lerp(0.35, 1, easeOut(k));
      const Rr = ed.R*grow, qq = Math.min(d.q, 1);
      const w = ed.om*ed.dir*(0.45 + 0.85*(1 - qq));
      const a = d.a0 + w*(t - 46) + (1 - grow)*1.6*ed.dir;
      const ca = Math.cos(a), sa = Math.sin(a);
      const e1 = ed.e1, e2 = ed.e2, n = ed.n, C = ed.C;
      const rx = e1.x*ca + e2.x*sa, ry = e1.y*ca + e2.y*sa, rz = e1.z*ca + e2.z*sa;
      const tx = (-e1.x*sa + e2.x*ca)*ed.dir, ty = (-e1.y*sa + e2.y*ca)*ed.dir, tz = (-e1.z*sa + e2.z*ca)*ed.dir;
      const r = d.q*Rr, hh = d.h*Rr;
      const cp = Math.cos(d.pitch), sp = Math.sin(d.pitch);
      S.set(i, C.x + rx*r + n.x*hh, C.y + ry*r + n.y*hh, C.z + rz*r + n.z*hh,
        tx*cp - rx*sp, ty*cp - ry*sp, tz*cp - rz*sp,
        d.len*Rr, d.wid*Rr, d.col, clamp(show*5, 0, 1)*d.al);
    });
    S.commit();
    ED.forEach((ed, i) => {
      const k = ed.k, lv = LV[ed.lvl];
      if (k <= 0){ s.coreG.hide(i*2); s.coreG.hide(i*2+1); return; }
      const pulse = 1 + 0.08*Math.sin(t*(3 + ed.lvl*2) + i);
      const sz = ed.R*1.5*lerp(0.4, 1, easeOut(k))*pulse;
      const c = ed.C.clone().addScaledVector(ed.n, -0.25*ed.R);
      s.coreG.set(i*2, c.x, c.y, c.z, 1, 0, 0, sz, sz, [1.0, 0.80, 0.35], 0.42*k*lv.bright);
      s.coreG.set(i*2+1, c.x, c.y, c.z, 1, 0, 0, sz*0.35, sz*0.35, [1.0, 0.95, 0.75], 0.75*k*lv.bright);
    });
    s.coreG.commit();

    /* ---- 能量流 ---- */
    const at = (pts, u) => { const x = clamp(u, 0, 1)*(pts.length - 1), i = Math.min(Math.floor(x), pts.length - 2), f = x - i;
      return [lerp(pts[i].x, pts[i+1].x, f), lerp(pts[i].y, pts[i+1].y, f), lerp(pts[i].z, pts[i+1].z, f)]; };
    s.fp.forEach((p, i) => {
      const f = s.flows[p.f];
      const fr = clamp((t - f.ts)/f.travel, 0, 1);
      if (fr <= 0){ s.flowG.hide(i); s.flowB.hide(i); return; }
      const u = frac(p.off + (t - f.ts)*f.sp*p.spk);
      if (u > fr){ s.flowG.hide(i); s.flowB.hide(i); return; }
      const a = at(f.pts, u), b = at(f.pts, u + 0.02);
      const j = p.j*Math.sin(t*4 + p.ph);
      const x = a[0], y = a[1] + j*0.6, z = a[2] + j*0.5;
      const sz = lerp(f.s0, f.s1, u)*p.szk;
      const al = Math.min(u/0.06, 1)*Math.min((1 - u)/0.1, 1)*f.bright;
      s.flowG.set(i, x, y, z, b[0]-a[0], b[1]-a[1], b[2]-a[2], sz*3.0, sz*1.8, [1.0, 0.74, 0.28], 0.30*al);
      s.flowB.set(i, x, y, z, b[0]-a[0], b[1]-a[1], b[2]-a[2], sz*2.4, sz*0.58, p.col, al);
    });
    s.flowG.commit(); s.flowB.commit();
    s.flows.forEach((f, fi) => {
      const fr = clamp((t - f.ts)/f.travel, 0, 1);
      for (let j=0;j<s.NTR;j++){
        const idx = fi*s.NTR + j, u = (j + 0.5)/s.NTR;
        if (u > fr){ s.trail.hide(idx); continue; }
        const a = at(f.pts, u), b = at(f.pts, u + 0.03), sz = lerp(f.s0, f.s1, u);
        const al = Math.min(u/0.08, 1)*Math.min((1 - u)/0.12, 1)*f.bright*(0.8 + 0.2*Math.sin(t*5 - u*14));
        s.trail.set(idx, a[0], a[1], a[2], b[0]-a[0], b[1]-a[1], b[2]-a[2], sz*4.2, sz*2.2, [1.0, 0.70, 0.26], 0.10*al);
      }
    });
    s.trail.commit();

    /* ---- 热 ---- */
    const hk = E(t, 49.0, 49.8);
    s.sp.forEach((p, i) => {
      let x, y, z, al, dx, dy, dz;
      if (p.stream){
        const fr = clamp((t - 48.85)/0.7, 0, 1);
        const u = frac(p.off + (t - 48.85)*0.32);
        if (fr <= 0 || u > fr){ s.spG.hide(i); s.spB.hide(i); return; }
        const e = easeOut(u);
        x = lerp(p.src.x, p.tgt.x, e) + Math.sin(t*3.1 + p.ph)*u*1.2;
        y = lerp(p.src.y, p.tgt.y, e) + Math.sin(t*2.7 + p.ph2)*u*1.0 + u*1.5;
        z = lerp(p.src.z, p.tgt.z, e) + Math.cos(t*2.3 + p.ph)*u*1.2;
        al = Math.min(u/0.08, 1)*Math.pow(1 - u, 0.8);
      } else {
        const show = hk*1.2 - p.key;
        if (show <= 0){ s.spG.hide(i); s.spB.hide(i); return; }
        x = p.base.x + Math.sin(t*1.7 + p.ph)*0.8;
        y = p.base.y + Math.sin(t*1.3 + p.ph2)*0.7 + 0.35*Math.max(0, t - 49);
        z = p.base.z + Math.sin(t*1.9 + p.ph3)*0.8;
        al = clamp(show*4, 0, 1);
      }
      const tw = 0.45 + 0.55*Math.abs(Math.sin(t*7.3 + p.ph*3));
      const ang = t*5 + p.ph*4;
      dx = Math.cos(ang); dy = Math.sin(ang); dz = Math.sin(ang*0.7);
      s.spG.set(i, x, y, z, 1, 0, 0, p.sz*1.5, p.sz*1.5, p.col, 0.8*al*tw);
      if (p.brush) s.spB.set(i, x, y, z, dx, dy, dz, p.sz*1.8, p.sz*0.45, p.col, 0.9*al);
      else s.spB.hide(i);
    });
    s.spG.commit(); s.spB.commit();

    /* ---- 前景光尘 / 后景气流 ---- */
    const dk = lerp(1, 0.45, E(t, 50.2, 51.2));                   // 纸卡出现后前景光尘减弱，不糊在卡片文字上
    s.dust.forEach((d, i) => {
      const x = d.x + Math.sin(t*0.5 + d.ph)*1.2, y = d.y + Math.sin(t*0.37 + d.ph*2)*0.9, z = d.z;
      s.dustS.set(i, x, y, z, 1, 0, 0, d.len, d.len, d.col, dk*d.a*(0.6 + 0.4*Math.sin(t*2 + d.ph)));
    });
    s.dustS.commit();
    s.bg.forEach((d, i) => {
      const a = d.a0 + d.w*t, ca = Math.cos(a), sa = Math.sin(a);
      s.bgS.set(i, d.cx + ca*d.rr, d.cy + sa*d.rr, d.cz, -sa*Math.sign(d.w), ca*Math.sign(d.w), 0, d.len, d.wid, d.col, d.a);
    });
    s.bgS.commit();

    /* ---- 标签 ---- */
    s.labels.forEach((L, i) => {
      const k = E(t, LV[i].tl, LV[i].tl + 0.6);
      L.opacity = k;
    });

    /* ---- 纸卡 ---- */
    s.exh.forEach(X => {
      const k = easeOut(P(t, X.ex.t0, X.ex.t0 + 1.0));
      const vis = clamp((t - X.ex.t0)/0.25, 0, 1);
      X.g.visible = vis > 0;
      if (!X.g.visible) return;
      const off = 1 - k;
      X.g.position.set(X.ex.P.x + off*34, X.ex.P.y + off*14 + 0.35*Math.sin(t*1.1 + X.ph), X.ex.P.z - off*48);
      X.g.rotation.set(0.05*Math.sin(t*0.9 + X.ph) + off*0.4, X.yaw + off*(-2.6), 0.03*Math.sin(t*1.25 + X.ph) - off*0.5);
      X.paper.rotation.set(0.04*Math.sin(t*1.3 + X.ph*2), 0.06*Math.sin(t*0.8 + X.ph), 0);
      X.card.opacity = vis; X.back.material.opacity = vis;
      // 纸面卷曲
      const pos = X.geo.attributes.position, b = X.base;
      for (let j=0;j<pos.count;j++){
        const x = b[j*3], y = b[j*3+1];
        const u = x/CW + 0.5, v = y/CH + 0.5;
        let z = -0.004*x*x + (0.22 + off*1.2)*Math.sin(0.42*x + 1.8*t + X.ph)*(0.3 + 0.7*u);
        const cu = Math.max(0, (u - 0.78)/0.22), cv = Math.max(0, (0.3 - v)/0.3);
        z += (0.9 + 0.3*Math.sin(t*1.4 + X.ph))*Math.pow(cu*cv, 1.4);
        pos.setZ(j, z);
      }
      pos.needsUpdate = true;
      X.vig.update(t, easeOut(clamp((t - X.ex.t0 - 0.15)/0.6, 0, 1)), vis);
    });

    /* ---- 相机 ---- */
    const c = camAt(t);
    ctx.cam(v3(c[0], c[1], c[2]), v3(c[3], c[4], c[5]), lerp(50, 52, E(t, 50, 54)), 0.025*Math.sin(t*0.6));
  },
});

/* ---------- 3D 笔触小景（局部坐标，原点在小景中心；外层组把它放在卡片正上方） ---------- */
function buildVignette(kind, R, pick, VSC){
  const hx = V.hex, items = [];
  const Y = 0;
  const SS = (i, x, y, z, dx, dy, dz, len, wid, col, a) => S.set(i, x, y, z, dx, dy, dz, len*VSC, wid*VSC, col, a);
  let S, Gl = null, update, bottom = 3, tilt = 0;
  if (kind === 'water'){
    // 急流：向右下倾的河道，水流笔触顺着水面流动，越过礁石时隆起、翻白，礁石下游拖出白色尾流和小涡；两岸有深色岸边笔触
    bottom = 3.4; tilt = 1.0;                    // 相机在小景下方仰视：水面要向镜头倾斜约 57° 才看得到
    const base = x => 1.0 - 0.24*x;
    const rocks = [{ x: -3.9, z: 0.8, r: 1.25 }, { x: -0.6, z: -1.0, r: 1.1 }, { x: 2.5, z: 1.1, r: 1.0 }, { x: 4.9, z: -0.5, r: 0.85 }];
    rocks.forEach(rk => { rk.y = base(rk.x) - 0.12; });
    const ROCK = ['#3a3630', '#4a443a', '#2e2c28', '#565046', '#423c34'], LIT = ['#8a98ac', '#a8b4c4', '#7a8496'];
    const rockD = [];
    rocks.forEach(rk => { for (let i=0;i<55;i++){
      const a = R()*TAU, el = R()*1.35, rr = rk.r*(0.8 + R()*0.25);
      rockD.push({ x: rk.x + Math.cos(a)*Math.cos(el)*rr, y: rk.y + Math.sin(el)*rr*0.8, z: rk.z + Math.sin(a)*Math.cos(el)*rr,
        dx: -Math.sin(a), dz: Math.cos(a), col: hx(el > 0.8 && R() < 0.55 ? pick(LIT) : pick(ROCK)), len: 0.55 + R()*0.35 }); } });
    const surf = (x, z, t, ph) => {
      let y = base(x) + 0.10*Math.sin(1.9*x - 6*t + ph), foam = 0;
      for (const rk of rocks){
        const dz = (z - rk.z)/(rk.r*1.3); if (Math.abs(dz) >= 1) continue;
        const w = 1 - dz*dz, dx = x - rk.x;
        const hump = rk.r*0.95*Math.exp(-(dx*dx)/(rk.r*rk.r*0.7))*w;
        y += hump - 0.35*rk.r*Math.exp(-((dx - rk.r*1.3)**2)/(rk.r*rk.r*0.5))*w;
        foam = Math.max(foam, hump > 0.3*rk.r ? 1 : 0, dx > 0 && dx < rk.r*3 ? w*(1 - dx/(rk.r*3)) : 0);
      }
      return [y, foam];
    };
    const water = [];
    for (let i=0;i<540;i++){
      const r = R();
      water.push({ z: -2.7 + R()*5.4, off: R(), sp: 0.38 + R()*0.3, ph: R()*TAU, fk: R(), lift: (R()-0.5)*0.12,
        col: hx(r < .38 ? pick(V.PAL.deep) : r < .78 ? pick(V.PAL.mid) : pick(V.PAL.pale)), len: 0.9 + R()*0.7 });
    }
    const spray = [];
    for (let i=0;i<40;i++) spray.push({ rk: rocks[i % 4], off: R(), dz: (R()-0.5)*1.4, h: 0.8 + R()*0.8 });
    const swirl = [];
    rocks.forEach(rk => { for (let i=0;i<15;i++) swirl.push({ c: rk, a0: R()*TAU, rr: 0.25 + R()*0.6, col: hx(pick([...V.PAL.cream, ...V.PAL.pale])) }); });
    const bank = [];
    for (const sg of [-1, 1]) for (let i=0;i<70;i++){
      const x = -7.8 + R()*15.6;
      bank.push({ x, y: base(x) + 0.25 + R()*0.7, z: sg*(3.0 + R()*0.7), dy: -0.24 + (R()-0.5)*0.5, col: hx(pick(['#1f2e22', '#2f4130', '#46553a', '#5e5a3a', '#3e4f2e'])), len: 0.8 + R()*0.6 });
    }
    S = new V.Strokes(rockD.length + water.length + spray.length + swirl.length + bank.length, {});
    const foamC = [hx('#f4ecd0'), hx('#e6eef2'), hx('#fdf6d8')];
    update = (t, k, vis) => {
      let i = 0;
      for (const d of bank) SS(i++, d.x, d.y, d.z, 1, d.dy, 0, d.len*k, 0.36*k, d.col, vis*k);
      for (const d of rockD) SS(i++, d.x, d.y, d.z, d.dx, 0.2, d.dz, d.len*k, 0.36*k, d.col, vis*k);
      for (const d of water){
        const u = frac(d.off + t*d.sp), x = -7.5 + 15*u;
        const [y, f] = surf(x, d.z, t, d.ph), [y2] = surf(x + 0.15, d.z, t, d.ph);
        const fo = f > d.fk*0.9 + 0.08;
        SS(i++, x, y + d.lift + (fo ? 0.08 : 0), d.z, 0.15, y2 - y, 0, d.len*k*(fo ? 0.8 : 1), (fo ? 0.24 : 0.2)*k, fo ? foamC[Math.floor(d.fk*3)] : d.col, vis*k*Math.pow(Math.sin(Math.PI*u), 0.6));
      }
      for (const d of spray){
        const rk = d.rk, u = frac(d.off + t*1.3);
        const x = rk.x - 0.1 + u*rk.r*1.8, y = rk.y + rk.r*0.75 + d.h*4*u*(1 - u), z = rk.z + d.dz;
        SS(i++, x, y, z, rk.r*1.8, d.h*4*(1 - 2*u), 0, 0.3*k, 0.12*k, foamC[1], vis*k*(1 - u)*0.9);
      }
      for (const d of swirl){
        const a = d.a0 - t*3.4, cx = d.c.x + d.c.r*1.7, cz = d.c.z, cy = base(cx) + 0.12;
        SS(i++, cx + Math.cos(a)*d.rr, cy + 0.05*Math.sin(a), cz + Math.sin(a)*d.rr*0.8, -Math.sin(a), 0, Math.cos(a)*0.8, 0.42*k, 0.15*k, d.col, vis*k*0.9);
      }
      S.commit();
    };
  } else if (kind === 'smoke'){
    const BRICK = ['#8a4a32', '#7a3b2a', '#a05a3c', '#5a2a20', '#6a3424'];
    const ROOF = ['#1e2a4d', '#2a3f75', '#18223f', '#22508f'];
    const chim = [], CX = -3.2, CB = Y - 4.4, CT = Y - 0.4;
    bottom = 4.9; tilt = 0.15;
    for (let i=0;i<110;i++){
      const side = Math.floor(R()*4), yy = CB + R()*(CT - CB), w = R()*2 - 1;
      const [x, z, dx, dz] = side === 0 ? [CX + w*0.95, 0.85, 1, 0] : side === 1 ? [CX + 0.95, w*0.85, 0, 1] : side === 2 ? [CX - 0.95, w*0.85, 0, 1] : [CX + w*0.95, -0.85, 1, 0];
      chim.push({ x, y: yy, z, dx, dz, col: hx(pick(BRICK)), len: 0.6 + R()*0.35 });
    }
    for (let i=0;i<14;i++){ const a = i/14*TAU; chim.push({ x: CX + Math.cos(a)*1.05, y: CT + 0.1, z: Math.sin(a)*0.92, dx: -Math.sin(a), dz: Math.cos(a), col: hx('#2a1810'), len: 0.6 }); }
    const roof = [];
    for (let i=0;i<120;i++){
      const x = -7 + R()*14, zz = -2.6 + R()*5.2;
      roof.push({ x, y: Y - 3.6 - Math.abs(zz + 0.4)*0.42, z: zz, col: hx(pick(ROOF)), len: 0.8 + R()*0.6 });
    }
    const smoke = [];
    for (let i=0;i<280;i++){
      const r = R();
      smoke.push({ off: R(), ph: R()*TAU, ph2: R()*TAU, sp: 0.26 + R()*0.1,
        col: hx(r < .4 ? pick(V.PAL.pale) : r < .7 ? pick(V.PAL.teal) : r < .88 ? pick(V.PAL.cream) : pick(V.PAL.mid)) });
    }
    S = new V.Strokes(chim.length + roof.length + smoke.length, {});
    update = (t, k, vis) => {
      let i = 0;
      for (const d of roof) SS(i++, d.x, d.y, d.z, 1, 0, 0.1, d.len*k, 0.32*k, d.col, vis*k);
      for (const d of chim) SS(i++, d.x, d.y, d.z, d.dx, 0, d.dz, d.len*k, 0.3*k, d.col, vis*k);
      for (const d of smoke){
        const u = frac(d.off + t*d.sp);
        const y = CT + 0.4 + u*6.6*k;
        const x = CX + 5.4*u*u + 1.3*u*Math.sin(2.2*y - 1.8*t + d.ph);
        const z = 1.3*u*Math.sin(1.5*y + 1.2*t + d.ph2);
        const th = d.ph + u*7 + t*2.2;
        const len = 0.45 + 1.3*u;
        SS(i++, x, y, z, Math.cos(th), Math.sin(th), 0.3*Math.sin(th*0.7), len, len*0.36, d.col, vis*k*Math.min(u*6, 1)*Math.pow(1 - u, 1.1)*0.9);
      }
      S.commit();
    };
  } else {
    // 咖啡杯：杯身向镜头倾斜，露出杯面上奶的漩涡
    const TILT = 0.62, CY = Y - 1.8;
    bottom = 6.2;                                // 抬高一点：托盘前沿不压到卡片上沿
    const rot = (x, y, z) => [x, CY + y*Math.cos(TILT) - z*Math.sin(TILT), y*Math.sin(TILT) + z*Math.cos(TILT)];
    const cup = [];
    for (let i=0;i<170;i++){
      const a = R()*TAU, h = R();
      const rr = lerp(2.5, 3.5, h), y = lerp(-1.9, 1.6, h);
      const front = 0.5 + 0.5*Math.sin(a);
      const col = hx(front > 0.6 ? pick(V.PAL.mid) : front > 0.3 ? pick([...V.PAL.mid, ...V.PAL.deep]) : pick(V.PAL.deep));
      cup.push({ p: rot(Math.cos(a)*rr, y, Math.sin(a)*rr), d: rot(-Math.sin(a)*0.25, 1, Math.cos(a)*0.25), col, len: 0.75 + R()*0.4, w: 0.34 });
    }
    for (let i=0;i<44;i++){ const a = i/44*TAU; cup.push({ p: rot(Math.cos(a)*3.55, 1.65, Math.sin(a)*3.55), d: rot(-Math.sin(a), 0, Math.cos(a)), col: hx(pick(V.PAL.cream)), len: 0.7, w: 0.22 }); }
    for (let i=0;i<24;i++){ const a = -1.3 + i/23*2.6; cup.push({ p: rot(3.4 + Math.cos(a)*1.1, -0.1 + Math.sin(a)*1.1, 0), d: rot(-Math.sin(a), Math.cos(a), 0), col: hx(pick(V.PAL.mid)), len: 0.5, w: 0.3 }); }
    for (let i=0;i<70;i++){ const a = R()*TAU, rr = 4.6 + R()*0.6; cup.push({ p: rot(Math.cos(a)*rr, -2.0, Math.sin(a)*rr), d: rot(-Math.sin(a), 0, Math.cos(a)), col: hx(pick(V.PAL.pale)), len: 0.8, w: 0.3 }); }
    const coffee = [];
    for (let i=0;i<170;i++){ const q = Math.sqrt(R())*0.96; coffee.push({ q, a0: R()*TAU, col: hx(pick(['#3b2416', '#4a2c1a', '#2e1c12', '#5a3820'])) }); }
    const milk = [];
    for (let i=0;i<160;i++){
      const q = 0.05 + R()*0.9, arm = R() < 0.5 ? 0 : Math.PI;
      milk.push({ q, a0: arm + 2.6*Math.log(q + 0.08) + (R()-0.5)*0.35, col: hx(pick(['#f4e6c4', '#ead2a6', '#d9b282', '#fbf0d6'])) });
    }
    const steam = [];
    for (let i=0;i<36;i++) steam.push({ off: R(), ph: R()*TAU, x0: (R()-0.5)*3 });
    S = new V.Strokes(cup.length + coffee.length + milk.length + steam.length, {});
    const RS = 3.25;
    update = (t, k, vis) => {
      let i = 0;
      for (const d of cup) SS(i++, d.p[0], d.p[1], d.p[2], d.d[0], d.d[1], d.d[2], d.len*k, d.w*k, d.col, vis*k);
      for (const d of coffee){
        const a = d.a0 + 0.5*t*(1.2 - d.q), rr = d.q*RS*k;
        const p = rot(Math.cos(a)*rr, 1.45, Math.sin(a)*rr), dd = rot(-Math.sin(a), 0, Math.cos(a));
        SS(i++, p[0], p[1], p[2], dd[0], dd[1], dd[2], 0.55*k, 0.3*k, d.col, vis*k);
      }
      for (const d of milk){
        const a = d.a0 + 1.7*t*(1.15 - d.q), rr = d.q*RS*k;
        const p = rot(Math.cos(a)*rr, 1.5, Math.sin(a)*rr), dd = rot(-Math.sin(a), 0, Math.cos(a));
        SS(i++, p[0], p[1], p[2], dd[0], dd[1], dd[2], 0.6*k, 0.24*k, d.col, vis*k);
      }
      for (const d of steam){
        const u = frac(d.off + t*0.22);
        const p = rot(d.x0 + 0.6*Math.sin(u*6 + t*1.5 + d.ph), 2.0 + u*4.5, 0);
        SS(i++, p[0], p[1], p[2], Math.sin(u*6 + d.ph)*0.6, 1, 0, 0.8, 0.22, [0.85, 0.88, 0.92], vis*k*0.35*Math.sin(Math.PI*u));
      }
      S.commit();
    };
  }
  return { S, G: Gl, update, bottom, tilt };
}
})();

/* s03_window · 20–34s 病房窗户 → 飞出窗外 → 漩涡标记（世界镜头）
   20–23.5  夜里的病房：床边低机位缓推向拱形铁窗；烛光、墙上做旧铭牌；窗外平静夜（reveal≈0.15，phase 极慢）
   23.5–27  贴近窗户：铁栏前景视差，镜头微转向窗外的麦田与远山
   27–30.5  天空活过来：reveal→1，phase 速度从慢到正常（对速度曲线解析积分，连续）；镜头从 x=0、y≈16.4 穿过铁栏间隙飞出窗外
   30.5–34  回到原画视角并缓慢推移；12 个画中特征依次被金色笔触圆环圈出；右侧空中 3D 计数牌"漩涡 × N"
   房间的静态笔触层挂在 V.world.room（所有世界镜头共用）；麦田、烛光、浮尘等动态元素只在本镜头 group 里。 */
(function(){
const { E, P, lerp, clamp, easeOut, smooth } = V;
const D2R = Math.PI/180;
const RING_T0 = 30.7, RING_DT = 0.2, RING_DUR = 0.45, COUNT_LAG = 0.1;
const H = V.hex;
const mixc = (a, b, k) => [a[0]+(b[0]-a[0])*k, a[1]+(b[1]-a[1])*k, a[2]+(b[2]-a[2])*k];
const mulc = (a, k) => [a[0]*k, a[1]*k, a[2]*k];

/* 时间域三次 Hermite（Catmull-Rom 切线）：关键帧之间速度连续，相机不会在关键帧处停顿 */
function herm(t, K){
  const n = K.length;
  if (t <= K[0][0]) return K[0][1].slice();
  if (t >= K[n-1][0]) return K[n-1][1].slice();
  let i = 0; while (t > K[i+1][0]) i++;
  const [t0, p0] = K[i], [t1, p1] = K[i+1], dt = t1 - t0, s = (t - t0)/dt;
  const tan = j => { const a = K[Math.max(0, j-1)], b = K[Math.min(n-1, j+1)]; return a[1].map((v, k) => (b[1][k] - v)/(b[0] - a[0])); };
  const m0 = tan(i), m1 = tan(i+1), s2 = s*s, s3 = s2*s;
  const h00 = 2*s3 - 3*s2 + 1, h10 = s3 - 2*s2 + s, h01 = -2*s3 + 3*s2, h11 = s3 - s2;
  return p0.map((v, k) => h00*v + h10*dt*m0[k] + h01*p1[k] + h11*dt*m1[k]);
}
/* 相机关键帧：[t, [x, y, z, yaw°(右为正), pitch°(上为正), fov, roll°]] */
const CAM = [
  [20.0, [ 1.9,  9.8, 77.9, 140,    2,   44, 0  ]],     // 主角近景：烛光照着梵高的脸和橙红胡子
  [21.6, [ 0.5, 10.1, 80.9,  84,   -3,   46, 0.4]],     // 绕到左侧：侧脸，身后是拱窗
  [23.2, [ 0.9, 10.9, 84.4,  11,    8,   50, 0.6]],     // 退到身后：越过他的肩膀望向窗外
  [25.3, [ 0.8, 11.9, 82.6,   1,    1,   50, 0.2]],
  [27.0, [ 1.8, 13.0, 79.9,  -8,   -6,   50, -0.3]],
  [28.0, [ 0.3, 15.6, 78.5,  -1.5, 10,   52, 0  ]],     // 正对两竖栏、两横栏围成的空隙，四根铁栏框住画面
  [28.7, [ 0.0, 16.45, 76.95, 0,   13,   54, 0  ]],     // ≈28.82s 穿过空隙（x≈0，y≈16.45，z=76.5）
  [29.5, [ 0.5, 15.6, 73.2,   1.2, 12,   55, -0.4]],    // 飞出窗外：前景麦田、石墙、村庄从下方掠过
  [30.5, [ 1.0, 14.8, 70.0,   0.4, 18.9, 56, 0  ]],     // P0 附近，回到原画构图
  [34.0, [ 3.6, 15.8, 65.4,  -0.4, 19.6, 54.5, 0.4]],   // 缓慢右移 + 升 + 前推：柏树与计数牌产生视差
];
const camAt = t => {
  const c = herm(t, CAM);
  const pos = V.v3(c[0] + 0.035*Math.sin(t*0.9), c[1] + 0.03*Math.sin(t*1.3 + 1), c[2]);
  const yaw = c[3]*D2R, pit = c[4]*D2R;
  const dir = V.v3(Math.sin(yaw)*Math.cos(pit), Math.sin(pit), -Math.cos(yaw)*Math.cos(pit));
  return { pos, dir, fov: c[5], roll: c[6]*D2R };
};
/* 天空相位：速度 S0 →（27–30.5 smoothstep）→ 1；phase = ∫speed，解析积分保证连续 */
const S0 = 0.05, PH_BASE = 20;
function skyPhase(t){
  const x = P(t, 27, 30.5);
  const I = t <= 27 ? 0 : t < 30.5 ? 3.5*(x*x*x - x*x*x*x/2) : 1.75 + (t - 30.5);
  return PH_BASE + S0*(t - 20) + (1 - S0)*I;
}
const skyReveal = t => t < 27 ? 0.15 : lerp(0.15, 1, E(t, 27, 30.2));

const MOON_L = V.v3(-0.42, -0.556, 0.716).normalize();      // 月光方向（月亮在画面右上 → 光从右上方斜射进屋）
const FLOW = (x, y) => 1.1*Math.sin(0.29*x + 0.21*y + 0.5) + 0.8*Math.sin(0.37*y - 0.17*x + 2.1);   // 墙面笔触的流向场

V.shot({ id: 's03', start: 20, end: 34, origin: [0, 0, 0], useWorld: true,
  build(ctx){
    const s = ctx.state, G = ctx.group, R = V.rng(30317);
    const RM = V.world.room;          // 静态的病房笔触挂在世界的病房上：s12 回到病房时同样可见（只在 build 里设置，不影响确定性）
    const pick = a => a[Math.floor(R()*a.length)];
    const WIN = V.world.WIN, yA = WIN.y0 + WIN.h - WIN.w/2, rA = WIN.w/2;   // 拱心 y=16.5，半径 5
    const CANDLE = V.v3(8.5, 10.2, 81);
    const BED = { x0: -11.5, x1: -6.5, y0: 5.1, y1: 7.3, z0: 79, z1: 89 };

    /* ================= 1. 室内笔触（静态） ================= */
    const dabs = [];
    const dab = (x, y, z, dx, dy, dz, len, wid, col, a=1) => dabs.push([x, y, z, dx, dy, dz, len, wid, col, a]);
    const WARM = ['#8a5c30', '#a06c38', '#b8823e', '#7a5030'].map(H);
    const COOL = ['#3c4a74', '#4a5c88', '#3a466e'].map(H);
    const light = (col, x, y, z) => {                       // 烛光暖 / 窗光冷
      const dc = Math.hypot(x - CANDLE.x, (y - CANDLE.y)*1.15, z - CANDLE.z);
      const w = Math.pow(clamp(1 - dc/12, 0, 1), 1.5);
      const dw = Math.hypot(x, (y - 15)*0.8, (z - 76)*1.3);
      const c = Math.pow(clamp(1 - dw/10, 0, 1), 2)*0.5;
      let o = mixc(col, pick(COOL), c);
      o = mixc(o, pick(WARM), w*0.8);
      return mulc(o, 0.92 + 0.3*w);
    };
    const inWin = (x, y, m) => Math.abs(x) < rA + m && y > WIN.y0 - m && (y < yA || x*x + (y - yA)**2 < (rA + m)**2);
    // 正墙（z=76 内侧）：沿流向场成片排列；窗洞周围笔触顺着拱形轮廓走
    const WALL = ['#2e2839', '#332c40', '#372f44', '#2f2c42', '#3a3247', '#342a3c'].map(H);
    for (let i = 0; i < 3600; i++){
      const x = -14 + R()*28, y = 5 + R()*19;
      if (inWin(x, y, 0.45)) continue;
      let a = FLOW(x, y) + (R() - 0.5)*0.35;
      const ex = Math.abs(x) - rA, ey = y < yA ? 99 : Math.hypot(x, y - yA) - rA;
      if (y < yA && y > WIN.y0 && ex < 1.6 && ex > 0) a = Math.PI/2 + (R() - 0.5)*0.2;
      else if (y >= yA && ey < 1.6) a = Math.atan2(y - yA, x) + Math.PI/2 + (R() - 0.5)*0.2;
      else if (y < WIN.y0 && y > WIN.y0 - 1.4 && Math.abs(x) < rA + 0.6) a = (R() - 0.5)*0.2;
      dab(x, y, 76.06, Math.cos(a), Math.sin(a), 0, 0.75 + R()*0.55, 0.3 + R()*0.12, light(pick(WALL), x, y, 76), 0.95);
    }
    for (const sx of [-1, 1]) for (let i = 0; i < 700; i++){
      const z = 76 + R()*18, y = 5 + R()*19, a = FLOW(z*1.3, y) + (R() - 0.5)*0.35;
      dab(sx*13.94, y, z, 0, Math.sin(a), Math.cos(a), 0.85 + R()*0.6, 0.34 + R()*0.14, light(pick(WALL), sx*14, y, z), 0.95);
    }
    // 地板（陶砖，红褐，朝窗方向的笔触）
    const FLOOR = ['#3c2620', '#462b22', '#36231e', '#4e3226', '#33201b'].map(H);
    for (let i = 0; i < 1200; i++){
      const x = -14 + R()*28, z = 76 + R()*18;
      if (x > BED.x0 - 0.2 && x < BED.x1 + 0.2 && z > BED.z0 - 0.2 && z < BED.z1 + 0.2) continue;
      const a = (R() - 0.5)*0.35;
      dab(x, 5.1, z, Math.sin(a), 0, Math.cos(a), 1.0 + R()*0.8, 0.36 + R()*0.16, light(pick(FLOOR), x, 5.1, z), 0.95);
    }
    const CEIL = ['#1e1a26', '#24202e', '#28222f', '#211c2a'].map(H);
    for (let i = 0; i < 400; i++){
      const x = -14 + R()*28, z = 76 + R()*18, a = FLOW(x, z) + (R() - 0.5)*0.3;
      dab(x, 23.94, z, Math.cos(a), 0, Math.sin(a), 1.2 + R()*0.8, 0.45 + R()*0.2, light(pick(CEIL), x, 24, z), 0.9);
    }
    // 窗洞侧壁、窗台、拱腹（world 里拱形部分没有墙厚，这里补一段半圆筒）
    const REV = ['#4a405a', '#443a54', '#504660', '#3e3650'].map(H);
    for (const sx of [-1, 1]) for (let i = 0; i < 170; i++){
      const z = 76.05 + R()*1.3, y = WIN.y0 + R()*(yA - WIN.y0);
      dab(sx*(rA - 0.04), y, z, 0, 1, (R() - 0.5)*0.3, 0.7 + R()*0.5, 0.26 + R()*0.1, light(pick(REV), sx*rA, y, z), 0.95);
    }
    for (let i = 0; i < 170; i++){
      const x = -rA + R()*2*rA, z = 76.05 + R()*1.3;
      dab(x, WIN.y0 + 0.04, z, 1, 0, (R() - 0.5)*0.3, 0.7 + R()*0.5, 0.26 + R()*0.1, light(pick(REV), x, WIN.y0, z), 0.95);
    }
    {
      const soffit = new THREE.CylinderGeometry(rA, rA, 1.4, 32, 1, true, Math.PI/2, Math.PI);
      soffit.rotateX(Math.PI/2);
      const m = new THREE.Mesh(soffit, new THREE.MeshBasicMaterial({color: 0x3d3446, side: THREE.DoubleSide}));
      m.position.set(0, yA, 76.7); RM.add(m);
      for (let i = 0; i < 280; i++){
        const th = R()*Math.PI, z = 76.05 + R()*1.3, r = rA - 0.05;
        const x = Math.cos(th)*r, y = yA + Math.sin(th)*r;
        dab(x, y, z, -Math.sin(th), Math.cos(th), 0, 0.7 + R()*0.5, 0.26 + R()*0.1, light(pick(REV), x, y, z), 0.95);
      }
    }
    // 床：深红毯子 + 枕头 + 木床头板（细笔触，近景不糊）
    const BLANKET = ['#5a2428', '#662a2a', '#4e2024', '#70342c', '#5e2628'].map(h => mulc(H(h), 0.8));
    const PILLOW = ['#5c5850', '#645e55', '#524e48', '#6a6052'].map(h => mulc(H(h), 0.78));
    const WOOD = ['#4a3020', '#55381f', '#3e2818', '#5e3e26'].map(H);
    const BEDWOOD = WOOD.map(c => mulc(c, 0.78));
    {
      const hb = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.2, 0.25), new THREE.MeshBasicMaterial({color: 0x3a2618}));
      hb.position.set(-9, 7.2, 78.85); RM.add(hb);
      const pc = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.86, 2.1), new THREE.MeshBasicMaterial({color: 0x4e4a44}));   // 罩住 world 里偏亮的枕头
      pc.position.set(-9, 7.6, 80); RM.add(pc);
      for (let i = 0; i < 140; i++){
        const x = BED.x0 - 0.1 + R()*5.2, y = 5.2 + R()*4.1;
        const plank = y > 8.9 && R() < 0.6;                 // 竖向木板 + 顶部一道横梁
        dab(x, y, 79.0, plank ? 1 : 0, plank ? 0 : 1, 0, 0.6 + R()*0.5, 0.22 + R()*0.08, light(pick(BEDWOOD), x, y, 79), 1);
      }
    }
    for (let i = 0; i < 900; i++){
      const x = BED.x0 + R()*5, z = BED.z0 + R()*10;
      const onPillow = z < 81.1 && x > -10.9 && x < -7.1;
      const fold = Math.sin(z*1.1 + x*0.6);
      const a = onPillow ? (R() - 0.5)*0.4 : 0.5*fold + (R() - 0.5)*0.4 + (z > 86 ? Math.PI/2 : 0);
      dab(x, onPillow ? 8.08 : 7.34, z, Math.cos(a), 0, Math.sin(a), onPillow ? 0.35 + R()*0.25 : 0.45 + R()*0.35, onPillow ? 0.14 + R()*0.05 : 0.18 + R()*0.08,
          light(mulc(onPillow ? pick(PILLOW) : pick(BLANKET), 0.95 + 0.12*fold), x, 7.3, z), 0.97);
    }
    for (let i = 0; i < 90; i++){                            // 枕头朝床尾的一面（盖住 world 里的浅色方块）
      const x = -10.95 + R()*3.9, y = 7.25 + R()*0.7;
      dab(x, y, 81.1, 1, 0.15*(R() - 0.5), 0, 0.4 + R()*0.3, 0.16 + R()*0.06, light(mulc(pick(PILLOW), 0.85), x, y, 81), 1);
    }
    for (let i = 0; i < 40; i++){
      const z = 79.05 + R()*1.9, y = 7.25 + R()*0.7;
      dab(-6.9, y, z, 0, 0.15*(R() - 0.5), 1, 0.4 + R()*0.3, 0.16 + R()*0.06, light(mulc(pick(PILLOW), 0.8), -7, y, z), 1);
    }
    for (let i = 0; i < 330; i++){
      const z = BED.z0 + R()*10, y = BED.y0 + R()*2.2, wood = y < 5.75;
      dab(BED.x1 + 0.04, y, z, 0, wood ? 0 : 1, wood ? 1 : 0.25*(R() - 0.5), 0.45 + R()*0.35, 0.18 + R()*0.07,
          light(wood ? pick(BEDWOOD) : pick(BLANKET), BED.x1, y, z), 0.97);
    }
    for (let i = 0; i < 150; i++){
      const x = BED.x0 + R()*5, y = BED.y0 + R()*2.2, wood = y < 5.75;
      dab(x, y, BED.z1 + 0.04, wood ? 1 : 0.2*(R() - 0.5), wood ? 0 : 1, 0, 0.45 + R()*0.35, 0.18 + R()*0.07, light(wood ? pick(BEDWOOD) : pick(BLANKET), x, y, BED.z1), 0.97);
    }
    // 桌子（补上桌腿）、画架、蜡烛
    for (let i = 0; i < 110; i++){
      const x = 6.5 + R()*4, z = 79.5 + R()*3;
      dab(x, 9.22, z, 1, 0, (R() - 0.5)*0.2, 0.6 + R()*0.5, 0.24 + R()*0.08, light(pick(WOOD), x, 9.2, z), 1);
    }
    for (const [lx, lz] of [[6.8, 79.8], [10.2, 79.8], [6.8, 82.2], [10.2, 82.2]]){
      const legM = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.9, 0.22), new THREE.MeshBasicMaterial({color: 0x2e2018})); legM.position.set(lx, 6.95, lz); RM.add(legM);
      for (let k = 0; k < 6; k++) dab(lx, 5.3 + k*0.65, lz + 0.12, 0, 1, 0, 0.8, 0.24, light(pick(WOOD), lx, 7, lz), 1);
    }
    for (let k = 0; k < 12; k++){ const y = 5.3 + k*0.78; dab(8.5 - (y - 9.6)*0.12, y, 85.18, -0.12, 1, 0, 1.0, 0.34, light(pick(WOOD), 8.5, y, 85), 1); }
    dab(8.5, 9.62, 81, 0, 1, 0, 0.82, 0.24, H('#efe2c0'), 1);                 // 蜡烛
    dab(8.5, 9.28, 81, 1, 0, 0, 0.7, 0.16, H('#6a5a40'), 1);                  // 烛台
    // 铁栏：在铁栏内侧贴一层深色笔触
    const IRON = ['#15110e', '#221c18', '#2a2228', '#1c1820'].map(H);
    // 笔触宽度贴合铁栏直径（0.32 / 0.26），近景边缘不再发虚；朝烛光一侧加一道细高光（越近烛光越暖），横栏上沿一道冷光
    const RIM_C = H('#3e4a70'), RIM_W = H('#c48a46');
    const rimCol = (x, y, z) => { const dc = Math.hypot(x - CANDLE.x, y - CANDLE.y, z - CANDLE.z); return mixc(RIM_C, RIM_W, Math.pow(clamp(1 - dc/15, 0, 1), 1.1)); };
    for (const x of [-3, -1, 1, 3]){
      const top = yA + Math.sqrt(Math.max(0, rA*rA - x*x));
      for (let y = WIN.y0 + 0.3; y < top - 0.2; y += 0.5) dab(x + (R() - 0.5)*0.02, y, 76.68, (R() - 0.5)*0.04, 1, 0, 0.9, 0.31 + R()*0.03, pick(IRON), 1);
      for (let y = WIN.y0 + 0.35; y < top - 0.3; y += 0.42) dab(x + 0.115, y, 76.7, (R() - 0.5)*0.03, 1, 0, 0.62 + R()*0.2, 0.05 + R()*0.015, rimCol(x, y, 76.7), 0.8);
    }
    for (const y of [11.5, 14.8, 18.1]){
      const hw = y < yA ? rA : Math.sqrt(rA*rA - (y - yA)**2);
      for (let x = -hw + 0.3; x < hw - 0.2; x += 0.5) dab(x, y + (R() - 0.5)*0.02, 76.66, 1, (R() - 0.5)*0.04, 0, 0.9, 0.26 + R()*0.03, pick(IRON), 1);
      for (let x = -hw + 0.35; x < hw - 0.3; x += 0.42) dab(x, y + 0.095, 76.69, 1, (R() - 0.5)*0.03, 0, 0.62 + R()*0.2, 0.045 + R()*0.012, rimCol(x, y, 76.7), 0.7);
    }

    /* ================= 2. 窗外：麦田（动态摆动）+ 低矮石墙 ================= */
    const wallDabs = [];
    {
      const fieldBase = new THREE.Mesh(new THREE.PlaneGeometry(140, 84).rotateX(-Math.PI/2).translate(0, 0.04, 25), new THREE.MeshBasicMaterial({color: 0x191c1c, fog: true}));
      G.add(fieldBase);
      const wallM = new THREE.Mesh(new THREE.BoxGeometry(140, 2.0, 0.8), new THREE.MeshBasicMaterial({color: 0x262a38, fog: true}));
      wallM.position.set(0, 1.0, -17); G.add(wallM);
      const STONE = ['#3e4252', '#343848', '#4a4e60', '#2c3040', '#444860'].map(H);
      for (let i = 0; i < 900; i++){                           // 石墙笔触只属于这个镜头（挂在世界上的话，开场飞过麦田时会在村前出现一道灰墙）
        const x = -70 + R()*140, y = 0.2 + R()*1.7, a = (R() - 0.5)*0.4;
        wallDabs.push([x, y, -16.55, Math.cos(a), Math.sin(a), 0, 1.0 + R()*0.8, 0.45 + R()*0.2, pick(STONE), 0.95]);
      }
    }
    // 麦秆：按到窗口的距离对数均匀采样，笔触尺寸 ∝ 距离 → 屏幕上大小一致、密度均匀
    const WHEAT = ['#5a5434', '#665e38', '#4c4a30', '#72683c', '#525a3c', '#42462e', '#7c7040', '#4a5236'].map(H);
    const MOONLIT = ['#5e6678', '#646a78', '#58627c'].map(H);
    const wheat = [];
    for (let i = 0; i < 16000 && wheat.length < 9000; i++){
      const d = 12*Math.pow(95/12, R()), z = 76 - d, x = (R()*2 - 1)*Math.min(70, 0.95*d + 6);
      if (z < -15.5 || z > 66) continue;
      if (Math.hypot(x + 15, z - 40) < 6.0) continue;            // 柏树脚下
      const far = clamp((d - 12)/83, 0, 1);
      const col = R() < 0.035 ? pick(MOONLIT) : pick(WHEAT);
      const sc = 0.055*d;
      wheat.push({ x, z, y: 0.25 + sc*(0.25 + R()*0.2), len: sc*(0.75 + R()*0.5), wid: sc*(0.26 + R()*0.08), col: mulc(col, 1.0 - 0.3*far), ph: R()*6.28 });
    }
    s.wheat = wheat;
    s.wheatS = new V.Strokes(wheat.length, {renderOrder: 2}); G.add(s.wheatS.mesh);

    /* ================= 3. 月光斑：窗形 + 铁栏影子落在床上和地板上 ================= */
    {
      const L = MOON_L;
      const winHit = (x, y, z) => { const sp = (z - 76.5)/L.z; return [x - L.x*sp, y - L.y*sp, sp]; };
      const barShadow = (wx, wy) => [-3, -1, 1, 3].some(b => Math.abs(wx - b) < 0.2) || [11.5, 14.8, 18.1].some(b => Math.abs(wy - b) < 0.17);
      const bedBlocks = (x, y, z) => {                     // 地板上的点：射向窗户的路径是否穿过床
        for (let u = 0.3; u < 14; u += 0.3){
          const px = x - L.x*u, py = y - L.y*u, pz = z - L.z*u;
          if (px > BED.x0 && px < BED.x1 && py > BED.y0 && py < BED.y1 + 0.05 && pz > BED.z0 && pz < BED.z1) return true;
          if (py > BED.y1 + 0.1) return false;
        }
        return false;
      };
      const lit = [];
      for (let i = 0; i < 20000 && lit.length < 1400; i++){
        const onBed = false;                                   // 床面上的光斑在低机位下读不出窗形，只保留地板
        const x = onBed ? BED.x0 + R()*5 : -14 + R()*16, z = onBed ? BED.z0 + R()*10 : 77 + R()*17;
        const y = onBed ? 7.37 : 5.13;
        if (!onBed && x > BED.x0 - 0.1 && x < BED.x1 + 0.1 && z > BED.z0 - 0.1 && z < BED.z1 + 0.1) continue;
        const [wx, wy] = winHit(x, y, z);
        if (!inWin(wx, wy, -0.1) || barShadow(wx, wy)) continue;
        if (!onBed && bedBlocks(x, y, z)) continue;
        lit.push([x, y, z, onBed]);
      }
      s.moonS = new V.Strokes(lit.length, {additive: true, renderOrder: 3});
      lit.forEach(([x, y, z, onBed], i) => s.moonS.set(i, x, y, z, 0.42, 0, 0.72, 0.42 + R()*0.25, 0.16 + R()*0.06,
        H(pick(onBed ? ['#3a3c62', '#424870', '#363a5a'] : ['#465686', '#50629a', '#3c4a78'])), onBed ? 0.22 : 0.45));
      s.moonS.commit(); RM.add(s.moonS.mesh);
      // 光柱里的浮尘
      s.motes = [];
      for (let i = 0; i < 70; i++){
        const wx = -4 + R()*8, wy = 9.5 + R()*10, u = 1.5 + R()*11;
        s.motes.push({ x: wx + L.x*u, y: wy + L.y*u, z: 76.5 + L.z*u, ph: R()*6.28, f: 0.2 + R()*0.4, sz: 0.04 + R()*0.06 });
      }
      s.moteS = new V.Strokes(s.motes.length, {additive: true, shape: 'glow', renderOrder: 4}); G.add(s.moteS.mesh);
      s.candleS = new V.Strokes(4, {additive: true, shape: 'glow', renderOrder: 5}); G.add(s.candleS.mesh);
    }

    s.roomS = new V.Strokes(dabs.length, {renderOrder: 2});
    dabs.forEach((d, i) => s.roomS.set(i, ...d));
    s.roomS.commit(); RM.add(s.roomS.mesh);
    s.wallS = new V.Strokes(wallDabs.length, {renderOrder: 2});
    wallDabs.forEach((d, i) => s.wallS.set(i, ...d));
    s.wallS.commit(); G.add(s.wallS.mesh);

    /* ================= 4. 墙上的做旧纸质铭牌（左上角一枚图钉，右侧纸面微微离墙卷起） ================= */
    {
      const PW = 6.0, PH = 3.7, PX = 8.45, PY = 15.7, PZ = 76.2;
      const plate = V.card({ w: PW, h: PH, px: 1024, draw(c, W, Hh){
        const r = V.rng(7741);
        c.save();
        c.beginPath();                                   // 不规则的毛边
        const m = 16, st = 22;
        c.moveTo(m, m);
        for (let x = m; x <= W - m; x += st) c.lineTo(x, m + r()*7);
        for (let y = m; y <= Hh - m; y += st) c.lineTo(W - m - r()*7, y);
        for (let x = W - m; x >= m; x -= st) c.lineTo(x, Hh - m - r()*7);
        for (let y = Hh - m; y >= m; y -= st) c.lineTo(m + r()*7, y);
        c.closePath(); c.clip();
        V.drawPaper(c, W, Hh);
        c.fillStyle = 'rgba(140,100,40,.10)'; c.beginPath(); c.ellipse(W*0.82, Hh*0.22, 100, 64, 0.4, 0, 7); c.fill();
        c.strokeStyle = 'rgba(120,90,50,.16)'; c.lineWidth = 3; c.beginPath(); c.ellipse(W*0.82, Hh*0.22, 94, 58, 0.4, 0, 7); c.stroke();
        c.strokeStyle = 'rgba(90,70,40,.14)'; c.lineWidth = 2; c.beginPath(); c.moveTo(W*0.5, 14); c.lineTo(W*0.52, Hh - 14); c.stroke();
        const g = c.createLinearGradient(0, Hh, 0, 0); g.addColorStop(0, 'rgba(255,170,70,.18)'); g.addColorStop(1, 'rgba(60,30,10,.14)');
        c.fillStyle = g; c.fillRect(0, 0, W, Hh);
        V.txt(c, '文森特·梵高', W/2, Hh*0.30, `900 136px ${V.FONT.SERIF}`, '#22170d');
        V.txt(c, 'Vincent van Gogh', W/2, Hh*0.56, `italic 600 86px ${V.FONT.GARA}`, '#3e2e1e');
        c.fillStyle = 'rgba(60,40,20,.35)'; c.fillRect(W*0.28, Hh*0.685, W*0.44, 3);
        V.txt(c, '1853 – 1890', W/2, Hh*0.81, `700 80px ${V.FONT.SANS}`, '#7c4410');
        c.restore();
      }});
      plate.mesh.material.alphaTest = 0.5;
      plate.mesh.renderOrder = 3;                        // 在墙面笔触之后画，墙笔触不会穿到纸面上
      const geo = new THREE.PlaneGeometry(PW, PH, 20, 12);
      s.plateBase = geo.attributes.position.array.slice();
      plate.mesh.geometry = geo;
      plate.mesh.position.set(PX, PY, PZ);
      plate.mesh.rotation.z = -0.03;
      G.add(plate.mesh); s.plate = plate; s.PW = PW; s.PH = PH;
      const pinX = PX - PW/2 + 0.55, pinY = PY + PH/2 - 0.45;
      s.pinS = new V.Strokes(2, {shape: 'dot', renderOrder: 6});
      s.pinS.set(0, pinX, pinY, PZ + 0.12, 1, 0, 0, 0.24, 0.24, H('#2a221c'), 1);
      s.pinS.set(1, pinX - 0.03, pinY + 0.03, PZ + 0.14, 1, 0, 0, 0.08, 0.08, H('#c8b898'), 0.9);
      s.pinS.commit(); G.add(s.pinS.mesh);
      s.shadowS = new V.Strokes(1, {shape: 'glow', renderOrder: 2});
      s.shadowS.set(0, PX + 0.25, PY + 0.25, 76.1, 1, 0, 0, PW*1.3, PH*1.4, [0.02, 0.015, 0.03], 0.6); s.shadowS.commit(); G.add(s.shadowS.mesh);
    }

    /* ================= 5. 平静夜里的少数星 ================= */
    {
      const ids = [3, 6, 7, 2, 9, 13, 15];
      s.calm = ids.map(i => V.world.features[i]).filter(Boolean);
      s.calmS = new V.Strokes(s.calm.length*2, {additive: true, shape: 'glow', renderOrder: 3}); G.add(s.calmS.mesh);
    }

    /* ================= 6. 金色笔触圆环 ================= */
    {
      const feats = V.world.features.filter(f => !f.extra).slice(0, 12);
      s.rings = feats.map((f, i) => {
        const back = 6, dist = V.SKY_R - back;
        const Rr = f.rW*1.08*dist/V.SKY_R;
        const C = f.C.clone().addScaledVector(f.n, -back);
        const segs = Math.max(30, Math.round(2*Math.PI*Rr/3.4));
        const rr = V.rng(900 + i);
        return { f, C, R: Rr, segs, seed: rr()*6.28, seed2: rr()*6.28, jit: Array.from({length: segs*2}, () => rr()),
          wid: 1.55 + 0.012*Rr,
          cols: Array.from({length: segs}, () => H(['#E8C547', '#f0cc50', '#e2b534', '#E8C547'][Math.floor(rr()*4)])),
          cols2: Array.from({length: segs}, () => H(['#f7e27a', '#fbeeb0', '#f4d34a'][Math.floor(rr()*3)])) };
      });
      const nSeg = s.rings.reduce((a, r) => a + r.segs, 0);
      s.ringS = new V.Strokes(nSeg*3, {renderOrder: 7});
      s.ringG = new V.Strokes(s.rings.length*2, {additive: true, shape: 'glow', renderOrder: 8});
      G.add(s.ringS.mesh); G.add(s.ringG.mesh);
    }

    /* ================= 7. 3D 计数牌"漩涡 × N" ================= */
    {
      const CW = 7.4, CH = 4.3;
      s.countAt = t => { let n = 0; for (let i = 0; i < 12; i++) if (t >= RING_T0 + i*RING_DT + COUNT_LAG) n++; return n; };
      const counter = V.card({ w: CW, h: CH, px: 1024, draw(c, W, Hh, t){
        const N = s.countAt(t);
        const r = V.rng(5511);
        c.save(); c.beginPath();
        const m = 14, st = 26;
        c.moveTo(m, m);
        for (let x = m; x <= W - m; x += st) c.lineTo(x, m + r()*6);
        for (let y = m; y <= Hh - m; y += st) c.lineTo(W - m - r()*6, y);
        for (let x = W - m; x >= m; x -= st) c.lineTo(x, Hh - m - r()*6);
        for (let y = Hh - m; y >= m; y -= st) c.lineTo(m + r()*6, y);
        c.closePath(); c.clip();
        V.drawPaper(c, W, Hh);
        c.font = `900 150px ${V.FONT.SERIF}`;
        const a = '漩涡 × ', wa = c.measureText(a).width, wb = c.measureText('12').width;
        const x0 = W/2 - (wa + wb)/2;
        V.txt(c, a, x0, 186, `900 150px ${V.FONT.SERIF}`, '#22170d', 'left');
        V.txt(c, String(N), x0 + wa + wb/2, 186, `900 150px ${V.FONT.SERIF}`, V.COL.seal, 'center');
        V.txt(c, 'whirls', W/2, 318, `italic 600 80px ${V.FONT.GARA}`, '#4e3e2c');
        for (let i = 0; i < 12; i++){
          const cx = W/2 + (i - 5.5)*70, cy = 466;
          c.lineWidth = i < N ? 9 : 3; c.strokeStyle = i < N ? '#b8861c' : 'rgba(90,70,40,.35)';
          c.beginPath(); c.arc(cx, cy, 24, -Math.PI/2, Math.PI*1.5 + (i < N ? 0.35 : 0)); c.stroke();
        }
        c.restore();
      }});
      counter.mesh.material.alphaTest = 0.02;            // 纸边毛刺透明处丢弃，同时允许入场淡入
      const geo = new THREE.PlaneGeometry(CW, CH, 24, 2);
      const pa = geo.attributes.position;
      for (let i = 0; i < pa.count; i++){ const x = pa.getX(i); pa.setZ(i, -0.04*x*x); }      // 轻微卷曲
      counter.mesh.geometry = geo;
      counter.opacity = 0;
      G.add(counter.mesh); s.counter = counter; s.counterN = -1;
      // 计数牌锚点：参考相机（t≈32.8）视野右侧、群星之间的空隙
      const ref = camAt(32.8);
      const fwd = ref.dir.clone().normalize(), right = new THREE.Vector3().crossVectors(fwd, V.v3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(right, fwd);
      const dist = 40, ty = Math.tan(ref.fov/2*D2R), tx = ty*16/9;
      s.cScale = dist/24;                                 // 放远、放大：屏幕尺寸不变，视差减小，不会漂进星的圆环
      const nx = (1555 - 960)/960, ny = -(628 - 540)/540;
      s.cAnchor = ref.pos.clone().addScaledVector(fwd, dist).addScaledVector(right, nx*tx*dist).addScaledVector(up, ny*ty*dist);
    }
  },

  update(t, lt, ctx){
    const s = ctx.state;
    V.world.set({ reveal: skyReveal(t), phase: skyPhase(t) });
    const cam = camAt(t);
    V.setCam(cam.pos, cam.pos.clone().add(cam.dir.clone().multiplyScalar(10)), cam.fov, cam.roll);
    const cf = 0.85 + 0.15*Math.sin(t*9.3)*Math.sin(t*5.1);

    /* 麦田：风吹过的波浪（倾斜 + 亮带同步移动） */
    s.wheat.forEach((w, i) => {
      const wave = Math.sin(t*1.25 - w.z*0.11 + w.x*0.04);
      const lean = 0.3*wave + 0.08*Math.sin(t*2.7 + w.ph);
      const br = 1 + 0.22*Math.max(0, wave);
      s.wheatS.set(i, w.x + lean*w.len*0.5, w.y, w.z, lean, 1, 0.15*Math.sin(w.ph), w.len, w.wid, mulc(w.col, br), 0.95);
    });
    s.wheatS.commit();

    /* 烛光与浮尘（只在室内段可见） */
    const inside = 1 - P(t, 28.4, 29.4);
    s.candleS.set(0, 8.5, 10.15, 81, 1, 0, 0, 13*cf, 13*cf, [1.0, 0.62, 0.28], 0.16*inside);
    s.candleS.set(1, 8.5, 10.2, 81.02, 0, 1, 0, 0.95*cf, 0.5, [1.0, 0.6, 0.2], 0.9*inside);
    s.candleS.set(2, 8.5, 10.22, 81.04, 0, 1, 0, 0.5*cf, 0.26, [1.0, 0.95, 0.75], 1.0*inside);
    s.candleS.set(3, 8.45, 15.0, 76.6, 1, 0, 0, 9*cf, 7.5*cf, [1.0, 0.6, 0.3], 0.07*inside);
    s.candleS.commit();
    s.motes.forEach((m, i) => {
      const x = m.x + 0.5*Math.sin(t*m.f*0.7 + m.ph), y = m.y + 0.4*Math.sin(t*m.f*0.5 + m.ph*1.7), z = m.z + 0.35*Math.sin(t*m.f*0.6 + m.ph*2.3);
      const tw = 0.55 + 0.45*Math.sin(t*m.f*3 + m.ph);
      s.moteS.set(i, x, y, z, 1, 0, 0, m.sz*2.0, m.sz*2.0, [0.72, 0.8, 1.0], 0.38*tw*inside);
    });
    s.moteS.commit();

    /* 铭牌：右侧纸面离墙卷起，纸角被烛火的热气微微掀动；亮度随烛光闪烁 */
    {
      const pa = s.plate.mesh.geometry.attributes.position, b = s.plateBase, w2 = s.PW/2, h2 = s.PH/2;
      const lift = 1 + 0.22*Math.sin(t*1.7) + 0.1*Math.sin(t*3.1);
      for (let i = 0; i < pa.count; i++){
        const x = b[i*3], y = b[i*3+1], u = (x + w2)/(2*w2);
        const cBR = Math.max(0, (x/w2)*0.5 + (-y/h2)*0.5 - 0.35);
        pa.setZ(i, 0.03*Math.sin(x*1.3 + y*0.9) + 0.32*u*u + 1.6*cBR*cBR*lift);
      }
      pa.needsUpdate = true;
      const k = 0.9 + 0.1*cf;
      s.plate.mesh.material.color.setRGB(k, k*0.92, k*0.8);
    }

    /* 平静夜的少数星：天空活过来后交给世界自己的星核 */
    {
      const calmK = 1 - E(t, 27.6, 29.2);
      s.calm.forEach((f, i) => {
        const p = f.C.clone().addScaledVector(f.n, -3);
        const tw = 0.75 + 0.25*Math.sin(t*2.1 + i*1.7);
        const sz = f.rW*0.42*tw;
        s.calmS.set(i*2, p.x, p.y, p.z, 1, 0, 0, sz*2.2, sz*2.2, [1.0, 0.86, 0.5], 0.5*calmK);
        s.calmS.set(i*2+1, p.x, p.y, p.z, 1, 0, 0, sz*0.6, sz*0.6, [1.0, 0.98, 0.9], 0.95*calmK);
      });
      s.calmS.commit();
    }

    /* 金色笔触圆环：从顶部顺时针描出，两端收笔变细，收尾略过头形成手绘搭接 */
    {
      let idx = 0;
      const A = Math.PI*2*1.08;
      s.rings.forEach((rg, ri) => {
        const t0 = RING_T0 + ri*RING_DT;
        const k = easeOut(P(t, t0, t0 + RING_DUR));
        const D = k*A, f = rg.f;
        const ptAt = (phi, rad) => { const th = Math.PI/2 - phi; return rg.C.clone().addScaledVector(f.e1, Math.cos(th)*rad).addScaledVector(f.e2, Math.sin(th)*rad); };
        const radAt = phi => rg.R*(1 + 0.02*Math.sin(2*phi + rg.seed) + 0.012*Math.sin(5*phi + rg.seed2) - 0.04*phi/A);
        for (let j = 0; j < rg.segs; j++){
          const a0 = j/rg.segs*A, a1 = (j + 1)/rg.segs*A;
          const vis = Math.min(a1, D) - a0;
          if (k <= 0 || vis <= 0){ s.ringS.hide(idx); s.ringS.hide(idx+1); s.ringS.hide(idx+2); idx += 3; continue; }
          const am = a0 + vis/2, rad = radAt(am), th = Math.PI/2 - am;
          const tdir = f.e1.clone().multiplyScalar(Math.sin(th)).addScaledVector(f.e2, -Math.cos(th));
          const u = am/A, taper = Math.min(1, 0.35 + u*5, 0.35 + (1 - u)*6)*(0.86 + 0.18*Math.sin(3*am + rg.seed2));
          const L = vis*rad*1.6, jx = rg.jit[j*2], jy = rg.jit[j*2+1];
          const w = rg.wid*taper;
          const p = ptAt(am, rad);
          s.ringS.set(idx, p.x, p.y, p.z, tdir.x, tdir.y, tdir.z, L*1.05, w*1.9, [0.03, 0.05, 0.14], 0.38);
          s.ringS.set(idx+1, p.x, p.y, p.z, tdir.x, tdir.y, tdir.z, L, w*(0.9 + 0.25*jx), rg.cols[j], 1);
          const q = ptAt(am, rad + (jy - 0.5)*w*0.5);
          s.ringS.set(idx+2, q.x, q.y, q.z, tdir.x, tdir.y, tdir.z, L*0.7, w*0.38, rg.cols2[j], 0.85);
          idx += 3;
        }
        const tip = ptAt(D, radAt(D));
        const tipA = (k > 0 && k < 1) ? 0.9 : 0;
        s.ringG.set(ri*2, tip.x, tip.y, tip.z, 1, 0, 0, rg.wid*7, rg.wid*7, [1.0, 0.88, 0.5], tipA);
        const fl = P(t, t0 + RING_DUR*0.8, t0 + RING_DUR*0.8 + 0.7);
        const fa = fl > 0 && fl < 1 ? 0.32*(1 - fl) : 0;
        s.ringG.set(ri*2+1, rg.C.x, rg.C.y, rg.C.z, 1, 0, 0, rg.R*2.4, rg.R*2.4, [1.0, 0.82, 0.4], fa);
      });
      s.ringS.commit(); s.ringG.commit();
    }

    /* 计数牌：翻转入场 + 漂浮；数字变化时重画（按计数档位缓存） */
    {
      const ent = E(t, 30.75, 31.5);
      const c = s.counter;
      c.opacity = E(t, 30.75, 31.15);
      if (ent > 0){
        const N = s.countAt(t);
        if (N !== s.counterN){ c.redraw(t); s.counterN = N; }
        const m = c.mesh;
        m.position.copy(s.cAnchor).add(V.v3(0.0, 0.22*Math.sin(t*1.3) - (1 - ent)*1.5, 0.15*Math.sin(t*0.9)).multiplyScalar(s.cScale));
        m.lookAt(V.camera.position);
        m.rotateY(lerp(1.35, 0, ent) - 0.16 + 0.05*Math.sin(t*1.1));
        m.rotateX(0.04*Math.sin(t*0.8 + 1));
        m.rotateZ(-0.03 + 0.015*Math.sin(t*0.7));
        let pop = 0; for (let i = 0; i < 12; i++){ const tn = RING_T0 + i*RING_DT + COUNT_LAG; if (t >= tn && t < tn + 0.25) pop = 1 - (t - tn)/0.25; }
        m.scale.setScalar(s.cScale*lerp(0.8, 1, ent)*(1 + 0.035*pop));
      }
    }
  },
});
})();

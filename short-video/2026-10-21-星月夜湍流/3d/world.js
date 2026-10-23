/* world.js — 程序化 3D《星月夜》世界 + 跟随相机的背景天幕
   坐标：y 向上，单位约为米。站在 P0 看向 T0 时，构图对应原画。
   V.world        THREE.Group（世界根）
   V.world.set({phase, reveal, opacity})   天空笔触相位 / 出现比例 / 透明度
   V.world.features  画中漩涡/星/月：{k, u, v, C:Vector3, r（世界半径）, e1, e2（切向基）, n（朝外法向）}
   V.world.room   病房（窗户在 z=76，室内 z 76..92）
   V.backdrop.set({opacity, phase})   背景天幕（无限星空漩涡，跟随相机） */
(function(){
const D2R = Math.PI/180;
const P0 = V.P0 = new THREE.Vector3(0, 14, 70);
const T0 = V.T0 = new THREE.Vector3(0, 52, -60);
const SR = V.SKY_R = 220;                          // 天空壳半径（以 P0 为球心）
const AZ_SPAN = 80, EL_TOP = 41.3, EL_SPAN = 50;    // 画面 u∈[0,1] ↔ 方位 80°；v∈[0,0.8] ↔ 仰角 41.3°→-8.7°
const UNIT = SR * AZ_SPAN * D2R;                    // 画面 1 个 u 单位对应的世界长度（≈307）
const azOf = u => (u-0.5)*AZ_SPAN*D2R;
const elOf = v => (EL_TOP - v/0.8*EL_SPAN)*D2R;
const dirOf = (az, el) => new THREE.Vector3(Math.sin(az)*Math.cos(el), Math.sin(el), -Math.cos(az)*Math.cos(el));
V.dirUV = (u,v) => dirOf(azOf(u), elOf(v));
const tangent = n => { const e1 = new THREE.Vector3().crossVectors(n, new THREE.Vector3(0,1,0)).normalize();
  const e2 = new THREE.Vector3().crossVectors(e1, n).normalize(); return [e1, e2]; };

const W = V.world = new THREE.Group(); W.name = 'world';
V.scene.add(W);
const R = V.rng(73692);
const pick = a => a[Math.floor(R()*a.length)];

/* ---------- 漩涡 / 星 / 月（画面坐标同 2D 版） ---------- */
const FEAT = [
  {k:'swirl', u:0.40, v:0.33, r:0.115, s: 1},
  {k:'swirl', u:0.57, v:0.29, r:0.085, s:-1},
  {k:'moon',  u:0.88, v:0.12, r:0.075, s: 1},
  {k:'star',  u:0.06, v:0.10, r:0.045, s: 1},
  {k:'star',  u:0.21, v:0.06, r:0.040, s:-1},
  {k:'star',  u:0.31, v:0.17, r:0.035, s: 1},
  {k:'star',  u:0.48, v:0.09, r:0.040, s:-1},
  {k:'star',  u:0.67, v:0.09, r:0.045, s: 1},
  {k:'star',  u:0.76, v:0.23, r:0.040, s:-1},
  {k:'star',  u:0.95, v:0.33, r:0.035, s: 1},
  {k:'star',  u:0.71, v:0.41, r:0.034, s:-1},
  {k:'star',  u:0.28, v:0.42, r:0.030, s: 1},
];
// 画外补充的星（相机转动/飞行时可见）
const EXTRA = [[-0.22,0.05],[-0.12,0.30],[1.12,0.08],[1.22,0.28],[1.05,-0.12],[-0.05,-0.15],[0.35,-0.18],[0.62,-0.2],[0.85,-0.08],[0.15,-0.08]];
for (const [u,v] of EXTRA) FEAT.push({k:'star', u, v, r:0.03+R()*0.015, s: R()<.5?1:-1, extra:true});
V.world.features = FEAT.map(f => {
  const n = V.dirUV(f.u, f.v); const [e1,e2] = tangent(n);
  return Object.assign({}, f, { n, e1, e2, C: P0.clone().addScaledVector(n, SR), rW: f.r*UNIT });
});

/* ---------- 天空笔触 ---------- */
const hz = u => 0.565 + 0.03*Math.sin(u*5+1) + 0.018*Math.sin(u*11+.5);
const skyItems = [];
for (let i=0; i<26000 && skyItems.length < 13000; i++){
  const u = -0.4 + R()*1.8, v = -0.32 + R()*0.95;
  if (v > hz(u)+0.01) continue;
  let best=null, bq=1e9;
  for (const f of V.world.features){ const q = Math.hypot(u-f.u, v-f.v)/f.r; if (q<bq){ bq=q; best=f; } }
  const n = V.dirUV(u, v), S = P0.clone().addScaledVector(n, SR);
  const len = (0.013 + R()*0.009)*UNIT, wid = (0.0042 + R()*0.0016)*UNIT, key = R();
  if (bq < 1.7){
    const f = best, q = bq, off = S.clone().sub(f.C);
    const x = off.dot(f.e1), y = off.dot(f.e2);
    let col;
    if (f.k==='swirl') col = q<.3 ? pick(V.PAL.pale) : q<.55 ? pick(V.PAL.mid) : q<.8 ? pick(V.PAL.cream) : q<1.1 ? pick(V.PAL.mid) : q<1.4 ? pick(V.PAL.pale) : pick(V.PAL.deep);
    else if (f.k==='moon') col = q<.75 ? pick(V.PAL.moon) : q<1.1 ? pick(V.PAL.yel) : q<1.4 ? pick(V.PAL.cream) : pick(V.PAL.mid);
    else col = q<.45 ? pick(V.PAL.cream) : q<.8 ? pick(V.PAL.yel) : q<1.15 ? pick(V.PAL.teal) : q<1.4 ? pick(V.PAL.cream) : pick(V.PAL.mid);
    skyItems.push({type:0, C:f.C.toArray(), E1:f.e1.toArray(), E2:f.e2.toArray(), d:Math.hypot(x,y), a0:Math.atan2(y,x),
      w: f.s*(0.10 + 0.22*(1-q/1.7)), len, wid, key, col});
  } else {
    const [e1,e2] = tangent(n); const r = R();
    skyItems.push({type:1, C:S.toArray(), E1:e1.toArray(), E2:e2.toArray(), L:0.07*UNIT, ph:R()*20, speed:(0.004+R()*0.004)*UNIT,
      len, wid, key, amp:0.010*UNIT, col: r<.78 ? pick(V.PAL.deep) : r<.94 ? pick(V.PAL.mid) : pick(V.PAL.cream)});
  }
}
/* 大漩涡近景细节层：镜头贴近时补足笔触密度（更小、更密、颜色更丰富） */
{
  const G = V.world.features[0], G2 = V.world.features[1];
  for (const [f, cnt] of [[G, 7000], [G2, 3500]]){
    for (let i=0;i<cnt;i++){
      const q = Math.sqrt(R())*1.45, a = R()*Math.PI*2, d = q*f.rW;
      const col = q<.25 ? pick(V.PAL.cream) : q<.5 ? pick([...V.PAL.pale, ...V.PAL.mid]) : q<.75 ? pick([...V.PAL.cream, ...V.PAL.yel]) : q<1.05 ? pick([...V.PAL.mid, ...V.PAL.teal]) : q<1.3 ? pick([...V.PAL.pale, ...V.PAL.deep]) : pick(V.PAL.deep);
      const sh = (R()-0.5)*6;                                     // 前后错开，飞近时有层次
      const C = f.C.clone().addScaledVector(f.n, sh);
      skyItems.push({type:0, C:C.toArray(), E1:f.e1.toArray(), E2:f.e2.toArray(), d, a0:a, w: f.s*(0.10 + 0.22*(1-Math.min(q,1.45)/1.7)),
        len: (0.006 + R()*0.005)*UNIT, wid: (0.0019 + R()*0.0009)*UNIT, key: R(), col});
    }
  }
}
const sky = new V.SkyStrokes(skyItems, {renderOrder: 1});
W.add(sky.mesh);

/* 天空底色：P0 为球心的大球内壁，竖直渐变 */
const domeMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { uCenter: {value: P0}, uOpacity: {value: 1} },
  vertexShader: `varying vec3 vW; void main(){ vW = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vW,1.0); }`,
  fragmentShader: `uniform vec3 uCenter; uniform float uOpacity; varying vec3 vW;
    void main(){ vec3 d = normalize(vW - uCenter); float e = d.y;
      vec3 top = vec3(0.055,0.125,0.31), mid = vec3(0.10,0.21,0.44), low = vec3(0.06,0.10,0.23);
      vec3 c = e > 0.25 ? mix(mid, top, smoothstep(0.25,0.9,e)) : mix(low, mid, smoothstep(-0.1,0.25,e));
      gl_FragColor = vec4(c*uOpacity, 1.0); }`,
});
const dome = new THREE.Mesh(new THREE.SphereGeometry(SR*1.12, 48, 24), domeMat);
dome.position.copy(P0); dome.renderOrder = -10; W.add(dome);   // 不透明、最先画、不写深度：永远在最后面

/* 星核光晕 + 月亮 */
const glow = new V.Strokes(V.world.features.length*2, {additive:true, shape:'glow', renderOrder: 3});
W.add(glow.mesh);
const moonCard = V.card({w: 1, h: 1, px: 256, draw(c, Wd, H){
  const g = c.createRadialGradient(128,128,0,128,128,128);
  g.addColorStop(0,'rgba(255,236,160,1)'); g.addColorStop(.3,'rgba(245,190,60,1)'); g.addColorStop(.36,'rgba(245,190,60,.55)'); g.addColorStop(1,'rgba(245,190,60,0)');
  c.fillStyle = g; c.fillRect(0,0,256,256);
  c.fillStyle = '#f2b52e'; c.beginPath(); c.arc(128,128,40,0,7); c.fill();
  c.globalCompositeOperation = 'destination-out'; c.fillStyle = 'rgba(0,0,0,.82)';
  c.beginPath(); c.arc(146,118,33,0,7); c.fill();
}});
const moonF = V.world.features[2];
moonCard.mesh.scale.setScalar(moonF.rW*2.6); moonCard.mesh.position.copy(moonF.C).addScaledVector(moonF.n, -2);
moonCard.mesh.lookAt(P0); moonCard.mesh.material.depthWrite = false; moonCard.mesh.renderOrder = 4;
W.add(moonCard.mesh);
/* 天空层（笔触、星光、月亮）跟底色一样：最先画、不做深度测试，地形和房屋总能盖住它们。
   否则镜头升高后，比天空壳更远的远山会被天空笔触画在上面，看起来像透明的。 */
for (const [mesh, ro] of [[sky.mesh, -9], [glow.mesh, -8], [moonCard.mesh, -7]]){
  const m = mesh.material; m.transparent = false; m.depthTest = false; m.depthWrite = false;
  if (m.blending === THREE.NormalBlending){ m.blending = THREE.CustomBlending; m.blendSrc = THREE.SrcAlphaFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor; }
  mesh.renderOrder = ro;
}

/* ---------- 地形：远山 ---------- */
const ridgeH = x => { const u = 0.5 + Math.atan2(x, 180)/(AZ_SPAN*D2R); const el = elOf(hz(u)); return P0.y + 180*Math.tan(el) - 2; };
const TX = 900, TZ = 520, NX = 120, NZ = 60;
const terr = new THREE.PlaneGeometry(TX, TZ, NX, NZ); terr.rotateX(-Math.PI/2); terr.translate(0, 0, -60 - TZ/2);
const tp = terr.attributes.position, tcol = new Float32Array(tp.count*3);
const hAt = (x, z) => {
  const ridge = ridgeH(x) * Math.exp(-(((z+112)/58)**2));
  const far = (34 + 14*Math.sin(x*0.011+1) + 8*Math.sin(x*0.027)) * V.smooth(V.clamp((-z-160)/140, 0, 1));
  const roll = 2.2*Math.sin(x*0.05)*Math.sin(z*0.07);
  return Math.max(0, Math.max(ridge, far) + roll*V.smooth(V.clamp((-z-70)/40,0,1)));
};
for (let i=0;i<tp.count;i++){
  const x = tp.getX(i), z = tp.getZ(i), h = hAt(x,z); tp.setY(i, h);
  const k = V.clamp(h/40, 0, 1);
  const c = new THREE.Color().setRGB(V.lerp(0.04,0.09,k), V.lerp(0.06,0.13,k), V.lerp(0.15,0.27,k), THREE.SRGBColorSpace);   // 山要比天空深：受光、调色提亮之后也不会和天空混成一片
  tcol.set([c.r,c.g,c.b], i*3);
}
terr.setAttribute('color', new THREE.BufferAttribute(tcol,3)); terr.computeVertexNormals();
const terrain = new THREE.Mesh(terr, new THREE.MeshBasicMaterial({vertexColors: true, fog: true}));
W.add(terrain);
// 近处地面
const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 260).rotateX(-Math.PI/2).translate(0,-0.05,60), new THREE.MeshBasicMaterial({color: 0x0d1736, fog: true}));
W.add(ground);
// 山上的笔触（沿等高线方向），从山脚一直铺到山顶；山脚和近处只用深蓝，不然会和天空混在一起，像山底透明
const hillPts = [];
for (let i=0; i<60000 && hillPts.length < 7000; i++){
  const far = hillPts.length >= 2600, x = -440 + R()*880, z = far ? -150 - R()*420 : -60 - R()*110, h = hAt(x, z);
  if (h < (far ? 6 : 2)) continue;
  const dzdx = (hAt(x+1,z) - hAt(x-1,z))/2, k = far ? 1.6 : 1;
  hillPts.push([x, h + 0.4*k, z, 1, dzdx, 0.15*(R()-0.5), (5+R()*5)*k, (far ? 1.6+R()*0.8 : 1.1+R()*0.6)*k,
    V.hex(pick(far ? ['#1a2c5c','#22386e','#2c4680','#1c3456','#3a5890','#5878a8'] : h < 12 ? ['#13204a','#1a2a58','#1c2f63','#16264f','#22386e'] : ['#1c2f63','#2a4480','#25386e','#1e3a5c','#304c88','#3b5a96'])), 0.9]);
}
const hillS = new V.Strokes(hillPts.length, {renderOrder: 2});
hillPts.forEach((p, i) => hillS.set(i, ...p));
hillS.commit(); W.add(hillS.mesh);
// 村庄地面上的笔触
const fieldS = new V.Strokes(1400, {renderOrder: 2});
for (let i=0;i<1400;i++){
  const x = -120 + R()*240, z = -110 + R()*150;
  fieldS.set(i, x, 0.15, z, 1, 0, 0.3*(R()-0.5), 3+R()*3, 1.0+R()*0.6, V.hex(pick(['#16264f','#1f3466','#2a3f75','#24405a','#30486e'])), 0.85);
}
fieldS.commit(); W.add(fieldS.mesh);

/* ---------- 村庄与教堂 ---------- */
const houseMat = [0x2a3b6b, 0x34446e, 0x26355e].map(c => new THREE.MeshBasicMaterial({color: c, fog: true}));
const roofMat = [0x18223f, 0x1e2a4d].map(c => new THREE.MeshBasicMaterial({color: c, fog: true}));
const winMat = new THREE.MeshBasicMaterial({color: 0xf2c94c, fog: false});
const village = new THREE.Group(); W.add(village);
const winList = [];
for (let i=0;i<78;i++){
  const x = -90 + R()*190, z = -108 + R()*82;
  if (x < -5 && z > -40) continue;
  const w = 4+R()*5, h = 3+R()*3.5, d = 4+R()*4;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), pick(houseMat)); body.position.set(x, h/2, z); body.rotation.y = (R()-0.5)*0.5;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*0.75, h*0.7, 4), pick(roofMat));
  roof.position.set(0, h/2 + h*0.35, 0); roof.rotation.y = Math.PI/4; roof.scale.set(w/Math.max(w,d), 1, d/Math.max(w,d));
  body.add(roof);
  if (R() < 0.75){
    const win = new THREE.Mesh(new THREE.PlaneGeometry(w*0.22, h*0.32), winMat.clone()); win.userData.glow = true;
    win.position.set((R()-0.5)*w*0.4, -h*0.05, d/2+0.05); body.add(win); winList.push({m: win, ph: R()*6.28});
  }
  village.add(body);
}
// 房屋笔触层：墙面、屋顶、窗光（静态，按房屋自身的旋转摆放）
const houseS = [];
const addHouseStrokes = (x0, z0, rot, w, h, d, wallPal, roofPal, win) => {
  const cr = Math.cos(rot), sr = Math.sin(rot);
  const P = (lx, ly, lz) => [x0 + lx*cr + lz*sr, ly, z0 - lx*sr + lz*cr];
  const Dv = (dx, dy, dz) => [dx*cr + dz*sr, dy, -dx*sr + dz*cr];
  const nW = Math.round(w*h*1.6), nS = Math.round(d*h*0.9), nR = Math.round(w*d*0.7);
  for (let i=0;i<nW;i++){ const lx = (R()-0.5)*w*0.96, ly = 0.3 + R()*(h-0.5);       // 正面（+z，朝向原画视点）
    houseS.push([...P(lx, ly, d/2+0.06), ...Dv(1, (R()-0.5)*0.5, 0), 0.9+R()*0.8, 0.32+R()*0.14, pick(wallPal)]); }
  for (let i=0;i<nS;i++){ const lz = (R()-0.5)*d*0.96, ly = 0.3 + R()*(h-0.5), sx = R()<.5 ? -1 : 1;   // 侧面
    houseS.push([...P(sx*(w/2+0.06), ly, lz), ...Dv(0, (R()-0.5)*0.5, 1), 0.9+R()*0.8, 0.32+R()*0.14, pick(wallPal)]); }
  for (let i=0;i<nR;i++){ const lx = (R()-0.5)*w*0.9, k = R(), lz = (R()<.5?-1:1)*(1-k)*d*0.5;           // 屋顶两坡
    houseS.push([...P(lx*(1-k*0.6), h + k*h*0.7 + 0.08, lz), ...Dv(1, 0, 0), 0.8+R()*0.7, 0.3+R()*0.12, pick(roofPal)]); }
  if (win) houseS.push([...P(win[0], h/2 + win[1], d/2+0.1), ...Dv(0, 1, 0), win[2]*1.2, win[3]*1.3, '#f2c94c']);
};
village.children.forEach(body => {
  const g = body.geometry && body.geometry.parameters; if (!g || g.width === undefined) return;   // 跳过教堂（Group）
  const win = body.children.find(c => c.geometry && c.geometry.type === 'PlaneGeometry');
  addHouseStrokes(body.position.x, body.position.z, body.rotation.y, g.width, g.height, g.depth,
    ['#2a3b6b','#34446e','#3c5080','#26355e','#4a5c88','#2f4272'], ['#18223f','#1e2a4d','#243258','#141c36'],
    win ? [win.position.x, win.position.y, win.geometry.parameters.width, win.geometry.parameters.height] : null);
});
{ // 教堂
  const pal = ['#22305e','#2a3a6e','#1d2852','#34467c'];
  for (let i=0;i<260;i++){ const x = 14 + (R()-0.5)*6.8, y = 0.4 + R()*8.4; houseS.push([x, y, -58+8.06, 1, (R()-0.5)*0.4, 0, 0.9+R()*0.7, 0.32+R()*0.12, pick(pal)]); }
  for (let i=0;i<160;i++){ const y = 0.4 + R()*13.4, x = 14 + (R()-0.5)*3.9; houseS.push([x, y, -58+8+2.06, 0, 1, 0, 0.9+R()*0.6, 0.3+R()*0.1, pick(pal)]); }
  for (let i=0;i<140;i++){ const k = R(), y = 14 + k*20, r = 2.6*(1-k)*0.95, a = (R()-0.5)*1.4; houseS.push([14 + Math.sin(a)*r, y, -58+8 + Math.cos(a)*r + 0.05, 0, 1, 0, 1.0+R()*0.8, 0.28, pick(['#1d2852','#26346a','#30407a'])]); }
}
const villS = new V.Strokes(houseS.length, {renderOrder: 2});
houseS.forEach((p, i) => villS.set(i, p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], V.hex(p[8]), p[8] === '#f2c94c' ? 0.95 : 0.92));
villS.commit(); W.add(villS.mesh);
// 树丛
const treeMat = new THREE.MeshBasicMaterial({color: 0x101c22, fog: true});
const treeList = [];
for (let i=0;i<40;i++){
  const t = new THREE.Mesh(new THREE.SphereGeometry(2+R()*2.5, 8, 6), treeMat);
  t.position.set(-90 + R()*190, 1.5, -110 + R()*90); t.scale.y = 1.3+R()*0.8; village.add(t);
  treeList.push(t);
}
{ const ts = [];
  treeList.forEach(t => { const r = t.geometry.parameters.radius, sy = t.scale.y;
    for (let i=0;i<34;i++){ const a = R()*Math.PI*2, h = (R()-0.3)*r*sy;
      ts.push([t.position.x + Math.cos(a)*r*0.95, t.position.y + h, t.position.z + Math.sin(a)*r*0.95, (R()-0.5)*0.6, 1, (R()-0.5)*0.6, 0.9+R()*0.8, 0.34+R()*0.12, pick(['#14241e','#1c3028','#22382a','#2a3a34','#10201a'])]); } });
  const treeS = new V.Strokes(ts.length, {renderOrder: 2});
  ts.forEach((p, i) => treeS.set(i, ...p.slice(0, 8), V.hex(p[8]), 0.95)); treeS.commit(); W.add(treeS.mesh); }
// 教堂
const church = new THREE.Group(); church.position.set(14, 0, -58);
const nave = new THREE.Mesh(new THREE.BoxGeometry(7, 9, 16), new THREE.MeshBasicMaterial({color: 0x22305e, fog: true})); nave.position.y = 4.5; church.add(nave);
const tower = new THREE.Mesh(new THREE.BoxGeometry(4, 14, 4), new THREE.MeshBasicMaterial({color: 0x26346a, fog: true})); tower.position.set(0, 7, 8); church.add(tower);
const spire = new THREE.Mesh(new THREE.ConeGeometry(2.6, 20, 4), new THREE.MeshBasicMaterial({color: 0x1d2852, fog: true})); spire.position.set(0, 24, 8); spire.rotation.y = Math.PI/4; church.add(spire);
village.add(church);

/* ---------- 柏树：火焰般扭动的笔触簇 ---------- */
const CYP = new THREE.Vector3(-15, 0, 40), CYP_H = 47;
const cypR = h => 4.6*Math.pow(V.clamp(1 - h/CYP_H, 0, 1), 0.75) * (0.85 + 0.15*Math.sin(h*0.6));
const cypCore = new THREE.Mesh(new THREE.ConeGeometry(4.2, CYP_H, 12, 8, true), new THREE.MeshBasicMaterial({color: 0x111a16, fog: true}));
cypCore.position.copy(CYP).add(new THREE.Vector3(0, CYP_H/2, 0)); W.add(cypCore);
const NC = 4200, cyp = new V.Strokes(NC, {renderOrder: 2}), cypData = [];
for (let i=0;i<NC;i++){
  const h = Math.pow(R(), 0.8)*CYP_H, a = R()*Math.PI*2, rr = cypR(h)*(0.72+R()*0.38);
  const big = i < 900;                                    // 少量大笔触打底，其余为细笔触，近看不糊
  cypData.push({h, a, rr, len: big ? 2.6+R()*2.0 : 1.3+R()*1.5, wid: big ? 0.8+R()*0.3 : 0.42+R()*0.26, col: V.hex(pick(V.PAL.cypress)), ph: R()*6.28});
}
function updateCypress(t){
  for (let i=0;i<NC;i++){
    const d = cypData[i];
    const sway = 0.9*Math.sin(t*0.9 + d.h*0.12) * (d.h/CYP_H);       // 越高摆得越大
    const a = d.a + 0.25*Math.sin(d.h*0.18 + t*0.6);                 // 扭转
    const x = CYP.x + Math.cos(a)*d.rr + sway, z = CYP.z + Math.sin(a)*d.rr, y = d.h;
    const lean = 0.35*Math.sin(d.h*0.5 + d.ph + t*1.1);
    cyp.set(i, x, y, z, lean*Math.cos(a), 1, lean*Math.sin(a), d.len, d.wid, d.col, 1);
  }
  cyp.commit();
}
W.add(cyp.mesh);

/* ---------- 病房：拱形窗、铁栏、室内 ---------- */
const room = V.world.room = new THREE.Group(); W.add(room);
const WIN = V.world.WIN = { z: 76, cx: 0, y0: 8.5, w: 10, h: 13 };   // 窗洞：x∈[-5,5]，y∈[8.5,21.5]，上沿为半圆拱
{
  const s = new THREE.Shape(); s.moveTo(-14, 5); s.lineTo(14, 5); s.lineTo(14, 24); s.lineTo(-14, 24); s.lineTo(-14, 5);
  const hole = new THREE.Path(); const r = WIN.w/2, yA = WIN.y0 + WIN.h - r;
  hole.moveTo(-r, WIN.y0); hole.lineTo(r, WIN.y0); hole.lineTo(r, yA); hole.absarc(0, yA, r, 0, Math.PI, false); hole.lineTo(-r, WIN.y0);
  s.holes.push(hole);
  const wall = new THREE.Mesh(new THREE.ShapeGeometry(s, 32), new THREE.MeshBasicMaterial({color: 0x2c2636, side: THREE.DoubleSide}));
  wall.position.z = WIN.z; room.add(wall);
  // 窗洞侧壁（墙厚）
  const depth = 1.4, frameMat = new THREE.MeshBasicMaterial({color: 0x3d3446, side: THREE.DoubleSide});
  const sideL = new THREE.Mesh(new THREE.PlaneGeometry(depth, yA - WIN.y0), frameMat); sideL.rotation.y = Math.PI/2; sideL.position.set(-r, (WIN.y0+yA)/2, WIN.z+depth/2); room.add(sideL);
  const sideR = sideL.clone(); sideR.position.x = r; room.add(sideR);
  const sill = new THREE.Mesh(new THREE.PlaneGeometry(WIN.w, depth), new THREE.MeshBasicMaterial({color: 0x4a4050, side: THREE.DoubleSide})); sill.rotation.x = -Math.PI/2; sill.position.set(0, WIN.y0, WIN.z+depth/2); room.add(sill);
  // 铁栏
  const barMat = new THREE.MeshBasicMaterial({color: 0x1a1612});
  V.world.bars = new THREE.Group(); room.add(V.world.bars);
  for (const x of [-3, -1, 1, 3]){
    const top = yA + Math.sqrt(Math.max(0, r*r - x*x));
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, top - WIN.y0, 8), barMat); b.position.set(x, (top+WIN.y0)/2, WIN.z+0.5); V.world.bars.add(b);
  }
  for (const y of [11.5, 14.8, 18.1]){
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, WIN.w, 8), barMat); b.rotation.z = Math.PI/2; b.position.set(0, y, WIN.z+0.5); V.world.bars.add(b);
  }
  // 室内：深色墙、地板、床的轮廓、桌上的蜡烛光
  const inMat = new THREE.MeshBasicMaterial({color: 0x1b1722, side: THREE.DoubleSide});
  const back = new THREE.Mesh(new THREE.PlaneGeometry(28, 19), inMat); back.position.set(0, 14.5, WIN.z + 18); room.add(back);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(28, 18), new THREE.MeshBasicMaterial({color: 0x16121c, side: THREE.DoubleSide})); ceil.rotation.x = Math.PI/2; ceil.position.set(0, 24, WIN.z + 9); room.add(ceil);
  for (const x of [-14, 14]){ const sw = new THREE.Mesh(new THREE.PlaneGeometry(18, 19), inMat); sw.rotation.y = Math.PI/2; sw.position.set(x, 14.5, WIN.z + 9); room.add(sw); }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(28, 18), new THREE.MeshBasicMaterial({color: 0x241c1c})); floor.rotation.x = -Math.PI/2; floor.position.set(0, 5.05, WIN.z+9); room.add(floor);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(5, 2.2, 10), new THREE.MeshBasicMaterial({color: 0x2e2a3a})); bed.position.set(-9, 6.2, WIN.z+8); room.add(bed);
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(4, 0.8, 2), new THREE.MeshBasicMaterial({color: 0x4e4a44})); pillow.position.set(-9, 7.6, WIN.z+4); room.add(pillow);
  const table = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 3), new THREE.MeshBasicMaterial({color: 0x3a2a20})); table.position.set(8.5, 9, WIN.z+5); room.add(table);
  const easel = new THREE.Mesh(new THREE.BoxGeometry(0.3, 9, 0.3), new THREE.MeshBasicMaterial({color: 0x3a2a20})); easel.position.set(8.5, 9.6, WIN.z+9); easel.rotation.z = 0.12; room.add(easel);
  V.world.candle = new V.Strokes(2, {additive: true, shape: 'glow', renderOrder: 5}); room.add(V.world.candle.mesh);
}

/* ---------- 湖：村庄西侧，水面笔触 + 随相机计算的星光倒影 ---------- */
const LAKE = V.world.LAKE = { x: -112, z: 30, rx: 52, rz: 38 };
const inLake = (x, z, m=1) => ((x-LAKE.x)/(LAKE.rx*m))**2 + ((z-LAKE.z)/(LAKE.rz*m))**2 < 1;
{
  const g = new THREE.CircleGeometry(1, 64); g.rotateX(-Math.PI/2);
  const lake = new THREE.Mesh(g, new THREE.MeshBasicMaterial({color: 0x0c1c48, fog: true}));
  lake.scale.set(LAKE.rx, 1, LAKE.rz); lake.position.set(LAKE.x, 0.05, LAKE.z); W.add(lake);
}
const RL = V.rng(5150), pickL = a => a[Math.floor(RL()*a.length)];
const ripData = [];
for (let i=0; ripData.length < 3200 && i < 20000; i++){
  const x = LAKE.x + (RL()*2-1)*LAKE.rx, z = LAKE.z + (RL()*2-1)*LAKE.rz;
  if (!inLake(x, z, 0.97)) continue;
  const r = RL();
  ripData.push({x, z, ph: RL()*6.28, len: 1.4+RL()*1.8, wid: 0.22+RL()*0.12,
    col: V.hex(r<.6 ? pickL(V.PAL.deep) : r<.9 ? pickL(V.PAL.mid) : pickL(V.PAL.pale))});
}
const ripS = new V.Strokes(ripData.length, {renderOrder: 2}); W.add(ripS.mesh);
const REFL_N = 12, reflS = new V.Strokes(V.world.features.length*REFL_N, {renderOrder: 3}); W.add(reflS.mesh);
const reflJit = Array.from({length: V.world.features.length*REFL_N}, () => [RL(), RL(), RL()]);
// 湖岸芦苇
const reedData = [];
for (let i=0;i<900;i++){ const a = RL()*Math.PI*2, m = 0.97 + RL()*0.09;
  if (RL() < 0.35) continue;
  reedData.push({x: LAKE.x + Math.cos(a)*LAKE.rx*m, z: LAKE.z + Math.sin(a)*LAKE.rz*m, h: 1.0+RL()*1.6, ph: RL()*6.28, col: V.hex(pickL(['#1c2e26','#26382c','#2e4030','#3a4a32']))}); }
const reedS = new V.Strokes(reedData.length, {renderOrder: 2}); W.add(reedS.mesh);

/* ---------- 农田：西侧麦田 + 东侧犁过的田垄 ----------
   麦子按垄成行：每株 = 两节微弯的麦秆 + 一个下垂的麦穗；株高、颜色按低频噪声成片变化，田边不规则；
   风是一道道推过去的麦浪：浪峰处麦秆弯得更厉害、麦穗被月光照亮。 */
const WHEAT = V.world.WHEAT = { x0: -76, x1: -24, z0: -24, z1: 44 };
const hashW = (x, z) => { const s = Math.sin(x*127.1 + z*311.7)*43758.5453; return s - Math.floor(s); };
const vnW = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf*xf*(3-2*xf), v = zf*zf*(3-2*zf);
  return V.lerp(V.lerp(hashW(xi, zi), hashW(xi+1, zi), u), V.lerp(hashW(xi, zi+1), hashW(xi+1, zi+1), u), v); };
const fieldEdge = (x, z) => Math.min(x - WHEAT.x0, WHEAT.x1 - x, z - WHEAT.z0, WHEAT.z1 - z) + 7*(vnW(x*0.12, z*0.12) - 0.5);   // 到田边的距离（> 0 在田里）
{
  const g = new THREE.PlaneGeometry(WHEAT.x1-WHEAT.x0 + 8, WHEAT.z1-WHEAT.z0 + 8).rotateX(-Math.PI/2);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({color: 0x3a3018, fog: true}));
  m.position.set((WHEAT.x0+WHEAT.x1)/2, 0.04, (WHEAT.z0+WHEAT.z1)/2); W.add(m);
}
const wheatData = [];
const HEADC = ['#d8b45a','#e6c46a','#c9a24a','#f0d27a','#b8913e','#dcb860'], HEADG = ['#b0aa5a','#a09c52','#bcae60'], STEMC = ['#6a5a2c','#7a6a34','#5a4c26','#706232'];
for (let z = WHEAT.z0 - 4; z < WHEAT.z1 + 4; z += 0.46){            // 一垄一垄
  for (let x = WHEAT.x0 - 4 + RL()*0.3; x < WHEAT.x1 + 4; x += 0.2 + RL()*0.18){
    const px = x + (RL()-0.5)*0.16, pz = z + (RL()-0.5)*0.3, e = fieldEdge(px, pz);
    if (e < 0 || inLake(px, pz, 1.05)) continue;
    const nh = vnW(px*0.07, pz*0.07), ng = vnW(px*0.09 + 7, pz*0.09 - 3);
    const h = (1.0 + 0.55*nh + 0.25*RL())*(0.7 + 0.3*V.clamp(e/3, 0, 1));
    const head = V.hex(ng > 0.62 && RL() < 0.7 ? pickL(HEADG) : pickL(HEADC)).map(c => c*0.8);
    wheatData.push({ x: px, z: pz, h, hl: 0.15 + 0.07*RL(), ph: RL()*6.28, lean: (RL()-0.5)*0.12, head, stem: V.hex(pickL(STEMC)).map(c => c*0.62) });
  }
}
const stemS = new V.Strokes(wheatData.length*2, {renderOrder: 2}); W.add(stemS.mesh);
const headS = new V.Strokes(wheatData.length, {renderOrder: 2}); W.add(headS.mesh);
{ // 东侧田垄（静态）
  const rows = [];
  for (let r=0;r<26;r++){ const z = -18 + r*2.8;
    for (let i=0;i<110;i++){ const x = 24 + RL()*92;
      rows.push([x, 0.2, z + (RL()-0.5)*0.6, 1, 0, (RL()-0.5)*0.08, 1.6+RL()*1.4, 0.5+RL()*0.25, pickL(r%3===0 ? ['#3a4a2a','#46562e','#2e3c24'] : ['#4a3a28','#5a4630','#3c3020','#52422c'])]); } }
  const fS = new V.Strokes(rows.length, {renderOrder: 2});
  rows.forEach((p, i) => fS.set(i, ...p.slice(0, 8), V.hex(p[8]).map(c => c*0.8), 0.95)); fS.commit(); W.add(fS.mesh);
}
function updateLakeAndFields(t){
  ripData.forEach((d, i) => {
    const sh = 0.55 + 0.45*Math.sin(t*1.7 + d.ph);
    ripS.set(i, d.x + 0.6*Math.sin(t*0.4 + d.ph), 0.12, d.z, 1, 0, 0.08*Math.sin(d.ph), d.len, d.wid, d.col, 0.55 + 0.4*sh);
  });
  ripS.commit();
  // 倒影：把天上的星/月/漩涡沿水面镜像，按当前相机位置求视线与水面的交点
  const cam = V.camera.position;
  V.world.features.forEach((f, fi) => {
    const Cm = new THREE.Vector3(f.C.x, -f.C.y, f.C.z);
    const k = cam.y / (cam.y - Cm.y);
    const R = cam.clone().lerp(Cm, k);
    const away = new THREE.Vector3(R.x - cam.x, 0, R.z - cam.z).normalize();
    const bright = f.k === 'swirl' ? 0.55 : 1;
    for (let j=0;j<REFL_N;j++){
      const id = fi*REFL_N + j, [a, b, c] = reflJit[id];
      const along = (a - 0.35)*f.rW*0.45*(f.k==='swirl' ? 1.6 : 1), side = (b - 0.5)*f.rW*0.12;
      const x = R.x + away.x*along - away.z*side + 0.4*Math.sin(t*2.1 + c*9), z = R.z + away.z*along + away.x*side;
      if (cam.y > 40 || !inLake(x, z, 0.98)){ reflS.hide(id); continue; }
      const col = f.k === 'moon' ? V.hex('#f5c95a') : f.k === 'swirl' ? V.hex(c < .5 ? '#a8c4dc' : '#e6e2b8') : V.hex(c < .5 ? '#f7e27a' : '#fbeeb0');
      reflS.set(id, x, 0.16, z, -away.z, 0, away.x, 1.6 + c*1.4, 0.32 + a*0.2, col, bright*(0.55 + 0.45*Math.sin(t*3 + c*20)));
    }
  });
  reflS.commit();
  reedData.forEach((d, i) => { const sw = 0.25*Math.sin(t*1.3 + d.ph);
    reedS.set(i, d.x + sw*0.5, d.h/2, d.z, sw, 1, 0, d.h, 0.12, d.col, 0.95); });
  reedS.commit();
  // 麦浪：沿风向一道道推过去；离镜头太近的麦株淡出，免得在镜头前糊成大色块
  const WX = 0.94, WZ = 0.34, col = [0, 0, 0];
  wheatData.forEach((d, i) => {
    const sAlong = d.x*WX + d.z*WZ;
    const wave = 0.5 + 0.5*Math.sin(sAlong*0.21 - t*1.9 + 0.8*Math.sin(d.z*0.045 + t*0.27));
    const th = 0.08 + 0.46*wave*wave + 0.05*Math.sin(t*3.1 + d.ph) + d.lean;          // 弯曲角：浪峰处最弯
    const a1 = th*0.35, a2 = th, a3 = th + 0.45, h1 = d.h*0.55, h2 = d.h*0.45;
    const s1 = Math.sin(a1), c1 = Math.cos(a1), s2 = Math.sin(a2), c2 = Math.cos(a2), s3 = Math.sin(a3), c3 = Math.cos(a3);
    const mx = d.x + WX*s1*h1, my = c1*h1, mz = d.z + WZ*s1*h1, tx = mx + WX*s2*h2, ty = my + c2*h2, tz = mz + WZ*s2*h2;
    const dist = Math.hypot(tx - cam.x, ty - cam.y, tz - cam.z), fade = V.smooth(V.clamp((dist - 0.5)/1.4, 0, 1));
    if (fade <= 0){ stemS.hide(i*2); stemS.hide(i*2+1); headS.hide(i); return; }
    const sb = 0.8 + 0.25*wave, hb = 0.72 + 0.6*wave;                                   // 浪峰处被月光照亮
    for (let k=0;k<3;k++) col[k] = d.stem[k]*sb;
    stemS.set(i*2, d.x + WX*s1*h1/2, my/2, d.z + WZ*s1*h1/2, WX*s1, c1, WZ*s1, h1*1.06, 0.034, col, 0.95*fade);
    stemS.set(i*2+1, (mx + tx)/2, (my + ty)/2, (mz + tz)/2, WX*s2, c2, WZ*s2, h2*1.06, 0.03, col, 0.95*fade);
    for (let k=0;k<3;k++) col[k] = Math.min(1, d.head[k]*hb);
    headS.set(i, tx + WX*s3*d.hl*0.45, ty + c3*d.hl*0.45, tz + WZ*s3*d.hl*0.45, WX*s3, c3, WZ*s3, d.hl, 0.038, col, fade);   // 麦穗细长（长宽约 5:1）
  });
  stemS.commit(); headS.commit();
}

/* ---------- 主角：梵高（笔触人像），站在病房窗前，左手托调色板，右手执笔 ---------- */
const VG = V.world.vangogh = new THREE.Group();
VG.position.set(4.2, 5.05, 80.6); VG.rotation.y = 0.35; VG.scale.setScalar(1.12);            // 面朝窗户（-z），略转向窗心
room.add(VG);
{
  const RV = V.rng(1853), pk = a => a[Math.floor(RV()*a.length)];
  const PAL_VG = {
    trousers: ['#2b3550','#333d5c','#252d45','#3a4566'],
    smock: ['#3f5fa0','#4b6db0','#36528c','#5a7cc0','#2f4a80'],
    skin: ['#d9a878','#c98f62','#e0b48a','#b97a52'],
    hair: ['#c0592a','#d46a2e','#a8481e','#e07a3a'],
    shoe: ['#2a1c14','#3a2618'],
    palette: ['#8a6a40','#9a7848','#7a5a34'],
  };
  const parts = [];        // 每个部件：采样函数 + 调色板 + 数量 + 笔触尺寸
  const ell = (c, r, pal, n, len, wid, filter) => parts.push({n, pal, len, wid, sample(){
    for (;;){ const u = RV()*Math.PI*2, v = Math.asin(RV()*2-1);
      const nn = [Math.cos(v)*Math.cos(u), Math.sin(v), Math.cos(v)*Math.sin(u)];
      const p = [c[0]+r[0]*nn[0], c[1]+r[1]*nn[1], c[2]+r[2]*nn[2]];
      if (filter && !filter(p, nn)) continue;
      return {p, n: [nn[0]/r[0], nn[1]/r[1], nn[2]/r[2]], d: [-Math.sin(u), 0.25*(RV()-0.5), Math.cos(u)]}; } }});
  const cyl = (A, B, rA, rB, pal, n, len, wid, sz=1) => parts.push({n, pal, len, wid, sample(){
    const s = RV(), a = RV()*Math.PI*2, ax = [B[0]-A[0], B[1]-A[1], B[2]-A[2]];
    const L = Math.hypot(...ax), u = ax.map(x => x/L);
    const t1 = Math.abs(u[1]) < 0.9 ? [0,1,0] : [1,0,0];
    let e1 = [u[1]*t1[2]-u[2]*t1[1], u[2]*t1[0]-u[0]*t1[2], u[0]*t1[1]-u[1]*t1[0]]; const l1 = Math.hypot(...e1); e1 = e1.map(x => x/l1);
    const e2 = [u[1]*e1[2]-u[2]*e1[1], u[2]*e1[0]-u[0]*e1[2], u[0]*e1[1]-u[1]*e1[0]];
    const r = rA + (rB - rA)*s, nn = [0,1,2].map(k => Math.cos(a)*e1[k] + Math.sin(a)*e2[k]*sz);
    return {p: [0,1,2].map(k => A[k] + ax[k]*s + nn[k]*r), n: nn, d: u.map((x, k) => x + 0.25*(RV()-0.5))}; }});
  // 腿、鞋
  for (const sx of [-0.32, 0.32]){
    cyl([sx, 0.15, 0], [sx*0.9, 2.45, 0], 0.27, 0.32, PAL_VG.trousers, 170, 0.32, 0.11);
    ell([sx, 0.12, -0.12], [0.2, 0.12, 0.34], PAL_VG.shoe, 30, 0.2, 0.08);
  }
  // 罩衫：上窄下宽，前后略扁
  cyl([0, 2.15, 0], [0, 4.0, 0], 0.98, 0.8, PAL_VG.smock, 900, 0.36, 0.12, 0.7);
  ell([0, 3.95, 0], [0.92, 0.28, 0.56], PAL_VG.smock, 160, 0.3, 0.11);
  // 左臂（托调色板）、右臂（执笔）
  cyl([-0.88, 3.9, 0], [-1.02, 3.05, -0.28], 0.21, 0.19, PAL_VG.smock, 120, 0.28, 0.1);
  cyl([-1.02, 3.05, -0.28], [-0.78, 2.92, -0.95], 0.18, 0.15, PAL_VG.smock, 90, 0.26, 0.09);
  ell([-0.74, 2.92, -1.0], [0.12, 0.1, 0.13], PAL_VG.skin, 20, 0.12, 0.06);
  ell([-0.82, 2.86, -1.15], [0.55, 0.04, 0.38], PAL_VG.palette, 90, 0.2, 0.08);
  cyl([0.88, 3.9, 0], [1.04, 3.1, -0.22], 0.21, 0.19, PAL_VG.smock, 120, 0.28, 0.1);
  cyl([1.04, 3.1, -0.22], [0.72, 3.55, -0.85], 0.18, 0.15, PAL_VG.smock, 90, 0.26, 0.09);
  ell([0.68, 3.6, -0.9], [0.12, 0.11, 0.12], PAL_VG.skin, 20, 0.12, 0.06);
  // 脖子、头、头发、胡子（橙红色是梵高自画像里的标志）
  cyl([0, 4.08, 0], [0, 4.42, -0.04], 0.17, 0.16, PAL_VG.skin, 40, 0.14, 0.06);
  ell([0, 4.78, -0.06], [0.34, 0.43, 0.38], PAL_VG.skin, 260, 0.14, 0.06);
  ell([0, 4.76, -0.46], [0.05, 0.1, 0.05], PAL_VG.skin, 30, 0.08, 0.04);                                                               // 鼻子
  ell([0, 4.86, 0.02], [0.37, 0.41, 0.39], PAL_VG.hair, 190, 0.18, 0.07, (p, n) => n[1] > 0.45 || (n[2] > 0.2 && n[1] > -0.35));   // 头顶与后脑
  ell([0, 4.6, -0.08], [0.35, 0.33, 0.37], PAL_VG.hair, 170, 0.15, 0.065, (p, n) => n[1] < -0.2 && n[2] < 0.25);                     // 下颌的短胡子
  ell([0, 4.66, -0.43], [0.14, 0.035, 0.03], PAL_VG.hair, 24, 0.1, 0.045);                                                           // 唇上的髭
  // 深色衬底（避免笔触间漏光）
  const core = new THREE.MeshBasicMaterial({color: 0x1a2236});
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.95, 1.85, 12), core); body.position.y = 3.07; body.scale.z = 0.68; VG.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), new THREE.MeshBasicMaterial({color: 0x5a3a28})); head.scale.set(0.32, 0.41, 0.36); head.position.set(0, 4.78, -0.06); VG.add(head);
  for (const sx of [-0.32, 0.32]){ const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 2.3, 8), new THREE.MeshBasicMaterial({color: 0x161c2c})); leg.position.set(sx, 1.3, 0); VG.add(leg); }
  // 画笔
  const brush = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.9, 6), new THREE.MeshBasicMaterial({color: 0x6a4a2a}));
  brush.position.set(0.66, 3.85, -1.05); brush.rotation.x = -0.9; VG.add(brush);
  // 生成笔触并按光照着色：右侧烛光偏暖，正面窗光偏冷
  W.updateMatrixWorld(true);
  const toW = new THREE.Vector3(), candleW = new THREE.Vector3(8.5, 10.2, 81), winDir = new THREE.Vector3(0, 0.25, -1).normalize();
  const nW = new THREE.Vector3(), q = new THREE.Quaternion(); VG.getWorldQuaternion(q);
  const items = [];
  for (const part of parts){
    for (let i=0;i<part.n;i++){
      const sm = part.sample();
      toW.set(...sm.p); VG.localToWorld(toW);
      nW.set(...sm.n).normalize().applyQuaternion(q);
      const warm = Math.max(0, nW.dot(candleW.clone().sub(toW).normalize()));
      const cool = Math.max(0, nW.dot(winDir));
      let col = V.hex(pk(part.pal)).map(c => c*0.55);
      col = col.map((c, k) => c + [1.0, 0.62, 0.28][k]*0.55*warm**1.5 + [0.45, 0.58, 0.95][k]*0.28*cool);
      items.push([sm.p, sm.d, part.len*(0.8+RV()*0.5), part.wid*(0.85+RV()*0.3), col.map(c => Math.min(1, c))]);
    }
  }
  const vgS = new V.Strokes(items.length, {renderOrder: 4});
  items.forEach((it, i) => vgS.set(i, ...it[0], ...it[1], it[2], it[3], it[4], 1));
  vgS.commit(); VG.add(vgS.mesh);
  // 五官：眼睛（蓝绿）、眉毛（橙红）
  const face = new V.Strokes(8, {shape: 'dot', renderOrder: 6});
  [-0.13, 0.13].forEach((x, i) => {
    face.set(i*4, x, 4.87, -0.405, 1, 0, 0, 0.1, 0.075, V.hex('#20302c'), 1);
    face.set(i*4+1, x, 4.87, -0.415, 1, 0, 0, 0.055, 0.05, V.hex('#3f6f68'), 1);
    face.set(i*4+2, x + 0.015, 4.885, -0.42, 1, 0, 0, 0.02, 0.02, V.hex('#e8f0e0'), 0.9);
    face.set(i*4+3, x, 4.98, -0.39, 1, x > 0 ? -0.25 : 0.25, 0, 0.16, 0.045, V.hex('#b8541f'), 1);
  });
  face.commit(); VG.add(face.mesh);
  // 调色板上的颜料点
  const dots = new V.Strokes(7, {shape: 'dot', renderOrder: 5});
  ['#f4d34a','#2c5ea3','#fbeeb0','#e8b830','#7ea6d4','#c0392b','#3e4f2e'].forEach((h, i) => { const a = 0.4 + i*0.5;
    dots.set(i, -0.82 + Math.cos(a)*0.32, 2.92, -1.15 + Math.sin(a)*0.22, 1, 0, 0, 0.13, 0.13, V.hex(h), 1); });
  dots.commit(); VG.add(dots.mesh);
}

/* ---------- 每帧更新 ---------- */
const worldParams = { phase: null, reveal: 1, opacity: 1 };
V.world.set = o => Object.assign(worldParams, o);
const tmp = new THREE.Vector3();
V.hooks.pre.push((t, act) => {
  Object.assign(worldParams, { phase: null, reveal: 1, opacity: 1 });
  W.visible = !!(act && act.useWorld);
});
V.hooks.post.push((t, act) => {
  if (!W.visible) return;
  const ph = worldParams.phase ?? t;
  sky.phase = ph; sky.reveal = worldParams.reveal; sky.opacity = worldParams.opacity;
  // 星核：亮度随出现比例渐入，轻微脉动
  const k = V.clamp((worldParams.reveal - 0.3)/0.5, 0, 1);
  V.world.features.forEach((f, i) => {
    if (f.k === 'swirl'){ glow.hide(i*2); glow.hide(i*2+1); return; }
    const pulse = 1 + 0.07*Math.sin(t*1.3 + f.u*20);
    const s = f.rW * (f.k==='moon' ? 1.6 : 1.25) * pulse;
    tmp.copy(f.C).addScaledVector(f.n, -1);
    glow.set(i*2, tmp.x, tmp.y, tmp.z, 1, 0, 0, s, s, [1.0, 0.86, 0.45], 0.85*k*worldParams.opacity);
    glow.set(i*2+1, tmp.x, tmp.y, tmp.z, 1, 0, 0, s*0.42, s*0.42, [1.0, 0.98, 0.88], (f.k==='moon'?0:1)*k*worldParams.opacity);
  });
  glow.commit();
  moonCard.mesh.visible = k > 0.01; moonCard.mesh.material.opacity = k*worldParams.opacity;
  winList.forEach(w => w.m.material.color.setRGB(0.95, V.lerp(0.62,0.80, 0.5+0.5*Math.sin(t*2+w.ph)), 0.3));
  updateCypress(t);
  updateLakeAndFields(t);
  V.world.vangogh.scale.y = 1.12*(1 + 0.006*Math.sin(t*1.6));           // 呼吸
  const cf = 0.85 + 0.15*Math.sin(t*9.3)*Math.sin(t*5.1);
  V.world.candle.set(0, 8.5, 10.2, WIN.z+5, 1,0,0, 6*cf, 6*cf, [1.0,0.7,0.3], 0.55);
  V.world.candle.set(1, 8.5, 10.0, WIN.z+5, 1,0,0, 0.5, 1.0, [1.0,0.95,0.7], 1);
  V.world.candle.commit();
  domeMat.uniforms.uOpacity.value = worldParams.opacity;
});

/* ---------- 背景天幕：以相机为中心的无限漩涡星空（非世界镜头使用） ---------- */
const BR = 700, B = V.backdrop = new THREE.Group(); V.scene.add(B);
const RB = V.rng(42);
const bFeat = [];
for (let i=0;i<46;i++){
  const az = RB()*Math.PI*2, el = (-35 + RB()*115)*D2R, n = dirOf(az, el);
  const [e1,e2] = tangent(n);
  bFeat.push({k: i<14 ? 'swirl' : 'star', n, e1, e2, C: n.clone().multiplyScalar(BR), r: (i<14 ? 0.16+RB()*0.1 : 0.05+RB()*0.03)*BR, s: RB()<.5?1:-1});
}
const bItems = [];
for (let i=0;i<30000 && bItems.length<9000; i++){
  const az = RB()*Math.PI*2, el = Math.asin(-0.6 + RB()*1.6);
  const n = dirOf(az, el), S = n.clone().multiplyScalar(BR);
  let best=null, bq=1e9; for (const f of bFeat){ const q = S.distanceTo(f.C)/f.r; if (q<bq){ bq=q; best=f; } }
  const len = (9 + RB()*6)*(BR/220)*0.45, wid = (3.2+RB()*1.2)*(BR/220)*0.45, key = RB();
  if (bq < 1.5){
    const f = best, off = S.clone().sub(f.C), x = off.dot(f.e1), y = off.dot(f.e2), q = bq;
    const col = f.k==='swirl' ? (q<.35 ? pick(V.PAL.pale) : q<.7 ? pick(V.PAL.mid) : q<1.0 ? pick(V.PAL.cream) : pick(V.PAL.mid))
                              : (q<.5 ? pick(V.PAL.cream) : q<.9 ? pick(V.PAL.yel) : pick(V.PAL.teal));
    bItems.push({type:0, C:f.C.toArray(), E1:f.e1.toArray(), E2:f.e2.toArray(), d:Math.hypot(x,y), a0:Math.atan2(y,x), w:f.s*(0.06+0.14*(1-q/1.5)), len, wid, key, col});
  } else {
    const [e1,e2] = tangent(n); const r = RB();
    bItems.push({type:1, C:S.toArray(), E1:e1.toArray(), E2:e2.toArray(), L:60, ph:RB()*20, speed:3+RB()*3, len, wid, key, amp:3,
      col: r<.85 ? pick(V.PAL.deep) : r<.97 ? pick(V.PAL.mid) : pick(V.PAL.cream)});
  }
}
const bSky = new V.SkyStrokes(bItems, {renderOrder: -1, opacity: 0.55});
bSky.mat.depthTest = false;
B.add(bSky.mesh);
const bGlow = new V.Strokes(bFeat.length, {additive: true, shape: 'glow', renderOrder: -1, depthTest: false});
B.add(bGlow.mesh);
const bParams = { opacity: 1, phase: null };
V.backdrop.set = o => Object.assign(bParams, o);
V.hooks.pre.push((t, act) => { Object.assign(bParams, { opacity: 1, phase: null }); B.visible = !(act && (act.useWorld || act.backdrop === false)); });
V.hooks.post.push((t, act) => {
  if (!B.visible) return;
  B.position.copy(V.camera.position);
  bSky.phase = bParams.phase ?? t; bSky.opacity = 0.55*bParams.opacity;
  bFeat.forEach((f,i) => { if (f.k==='star') bGlow.set(i, f.C.x, f.C.y, f.C.z, 1,0,0, f.r*1.3, f.r*1.3, [1,0.86,0.45], 0.55*bParams.opacity); else bGlow.hide(i); });
  bGlow.commit();
});
})();

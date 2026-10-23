/* world_real.js — 逼真度增强（在 world.js 之后加载）
   1. 光照：天光（半球光）+ 月光（平行光）+ 烛光（点光源）+ 窗口冷光（聚光灯）
   2. 世界里的平涂材质换成受光材质（Lambert），配程序化的笔触纹理：灰泥墙、瓦片屋顶、陶土地砖、木纹、田野
   3. 房屋加烟囱与窗光；病房加画架，画布上是正在画的《星月夜》
   4. 梵高重建：平滑建模的身体、手臂、手，手绘风格面部贴图，橙红头发与胡须体块
   全部只在加载时构建一次，画面仍只由 t 决定。 */
(function(){
const W = V.world, ROOM = W.room, R = V.rng(9090);
const pick = a => a[Math.floor(R()*a.length)];

/* ---------- 程序化纹理 ---------- */
function canvasTex(w, h, draw, repeat){
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d', {willReadFrequently: true});
  draw(c, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
function dabs(c, w, h, n, cols, len, wid, angle, jitter){
  c.lineCap = 'round';
  for (let i=0;i<n;i++){
    const x = R()*w, y = R()*h, a = angle + (R()-0.5)*jitter, L = len*(0.6+R()*0.8);
    c.strokeStyle = pick(cols); c.lineWidth = wid*(0.6+R()*0.8); c.globalAlpha = 0.35 + R()*0.5;
    c.beginPath(); c.moveTo(x - Math.cos(a)*L/2, y - Math.sin(a)*L/2); c.lineTo(x + Math.cos(a)*L/2, y + Math.sin(a)*L/2); c.stroke();
  }
  c.globalAlpha = 1;
}
const TEX = {
  plaster: canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#e4e2dc'; c.fillRect(0,0,w,h);
    dabs(c, w, h, 1400, ['#f4f2ee','#d0ccc4','#c4c0b8','#ffffff','#d8d4cc'], 34, 9, 0.2, 1.2); }),
  roof: canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#9a9aa4'; c.fillRect(0,0,w,h);
    for (let y=0;y<h;y+=26){ const off = (y/26)%2 ? 18 : 0;
      for (let x=-36;x<w+36;x+=36){ c.fillStyle = pick(['#b0b0ba','#8a8a96','#a2a2ae','#c0c0c8']);
        c.beginPath(); c.ellipse(x+off, y+18, 17, 13, 0, 0, Math.PI); c.fill(); c.strokeStyle = 'rgba(20,20,30,.5)'; c.lineWidth = 2; c.stroke(); } }
    dabs(c, w, h, 300, ['#ffffff','#707080'], 22, 4, 0, 0.6); }),
  tiles: canvasTex(512, 512, (c, w, h) => { const s = 64;
    for (let y=0;y<h;y+=s) for (let x=0;x<w;x+=s){ c.fillStyle = pick(['#9a5a3c','#8a4e34','#a8664a','#7e4630','#94583e']); c.fillRect(x+2, y+2, s-4, s-4); }
    c.fillStyle = 'rgba(40,25,18,1)'; for (let k=0;k<=w;k+=s){ c.fillRect(k-2, 0, 4, h); c.fillRect(0, k-2, w, 4); }
    dabs(c, w, h, 700, ['#b8785a','#6a3a26','#c08a6a'], 18, 5, 0, 3); }, [3, 3]),
  wood: canvasTex(256, 512, (c, w, h) => { c.fillStyle = '#6a4428'; c.fillRect(0,0,w,h);
    dabs(c, w, h, 600, ['#7a5232','#5a3620','#8a6040','#4e2e1a'], 60, 5, Math.PI/2, 0.15); }),
  fabric: canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#7a2c2c'; c.fillRect(0,0,w,h);
    dabs(c, w, h, 500, ['#8a3434','#6a2424','#9a4038','#5a2020'], 26, 7, 0.3, 2.5); }),
  ground: canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#d0d0d0'; c.fillRect(0,0,w,h);
    dabs(c, w, h, 1600, ['#ffffff','#b0b0b0','#c8c8c8','#e8e8e8','#9a9a9a'], 40, 8, 0.05, 0.5); }, [40, 24]),
  field: canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#c8c8c8'; c.fillRect(0,0,w,h);
    dabs(c, w, h, 1500, ['#ffffff','#a8a8a8','#d8d8d8','#8a8a8a'], 30, 7, 0.1, 0.8); }, [8, 8]),
  foliage: canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#c0c0c0'; c.fillRect(0,0,w,h);
    dabs(c, w, h, 600, ['#ffffff','#909090','#d0d0d0','#787878'], 20, 7, -1.2, 1.5); }),
};

/* ---------- 光照 ---------- */
const hemi = new THREE.HemisphereLight(0x6a86c4, 0x24281c, 3.8); W.add(hemi);
const moonF = W.features[2];
const moon = new THREE.DirectionalLight(0xb4c6ff, 3.0);
moon.position.copy(moonF.C); moon.target.position.set(0, 0, 0); W.add(moon); W.add(moon.target);
const candleL = new THREE.PointLight(0xffa64a, 46, 30, 2); candleL.position.set(8.5, 10.8, 81); ROOM.add(candleL);
const winL = new THREE.SpotLight(0x8aa4ff, 70, 34, 0.62, 0.7, 2); winL.position.set(0, 19, 69); winL.target.position.set(0, 5, 88);
ROOM.add(winL); ROOM.add(winL.target);
const faceL = new THREE.PointLight(0xc8d0ff, 30, 10, 2); faceL.position.set(2.2, 11.2, 77.2); ROOM.add(faceL);   // 窗边的冷色补光：照亮背对烛光一侧的脸
W.lights = { hemi, moon, candleL, winL, faceL };

/* ---------- 材质替换：平涂 → 受光 + 纹理 ---------- */
const cache = new Map();
function lit(m, map, colorOverride){
  const key = m.uuid + '|' + (map ? map.uuid : '') + '|' + (colorOverride ?? '');
  if (cache.has(key)) return cache.get(key);
  const nm = new THREE.MeshLambertMaterial({ color: colorOverride !== undefined ? new THREE.Color(colorOverride) : m.color.clone(),
    vertexColors: m.vertexColors, side: m.side, fog: m.fog, map: map || null, transparent: m.transparent, opacity: m.opacity });
  cache.set(key, nm); return nm;
}
const brighten = (m, k) => '#' + m.color.clone().multiplyScalar(k).getHexString();
function convertAll(){ W.traverse(o => {
  if (!o.isMesh || !o.material || !o.material.isMeshBasicMaterial) return;
  const m = o.material, g = o.geometry, gp = g.parameters || {};
  if (o.userData.glow || m.map || m.blending === THREE.AdditiveBlending) return;          // 窗光、月亮卡片、发光体保持自发光
  if (o.userData.keepBasic) return;
  const inRoom = (() => { let p = o; while (p){ if (p === ROOM) return true; p = p.parent; } return false; })();
  if (inRoom){
    if (g.type === 'ShapeGeometry') o.material = lit(m, TEX.plaster, '#8c8076');                        // 窗墙：石灰墙
    else if (g.type === 'PlaneGeometry' && Math.abs(o.rotation.x + Math.PI/2) < 0.01 && o.position.y < 6) o.material = lit(m, TEX.tiles, '#c8a898');  // 地砖
    else if (g.type === 'PlaneGeometry') o.material = lit(m, TEX.plaster, brighten(m, 3.4));              // 其余墙面、天花板
    else if (g.type === 'CylinderGeometry' && gp.radiusTop < 0.3) o.material = lit(m, null, '#2a2420');   // 铁栏
    else if (gp.width === 5 && gp.depth === 10) o.material = lit(m, TEX.fabric, '#c8a0a0');               // 床
    else o.material = lit(m, TEX.wood, '#b89a80');                                                        // 桌子、画架、床头板等
    return;
  }
  if (g.type === 'BoxGeometry') o.material = lit(m, TEX.plaster, brighten(m, 1.5));                     // 房屋、教堂墙体
  else if (g.type === 'ConeGeometry' && gp.radialSegments === 4) o.material = lit(m, TEX.roof, brighten(m, 1.7));   // 屋顶、尖塔
  else if (g.type === 'SphereGeometry') o.material = lit(m, TEX.foliage, brighten(m, 1.6));             // 树丛
  else if (m.vertexColors) o.material = lit(m, TEX.ground);                                            // 远山地形
  else if (g.type === 'PlaneGeometry' && gp.width >= 400) o.material = lit(m, TEX.ground, brighten(m, 1.5)); // 近处地面
  else if (g.type === 'PlaneGeometry') o.material = lit(m, TEX.field, brighten(m, 1.5));                // 麦田底
  else if (g.type === 'ConeGeometry') o.material = lit(m, TEX.foliage, brighten(m, 1.4));               // 柏树内核
}); }
convertAll();
// 镜头 build 时往病房里加的平涂物件（例如 s03 的拱腹、床头板），在第一帧前也统一换成受光材质
let converted = false;
V.hooks.pre.push(() => { if (!converted){ converted = true; convertAll(); } });

/* ---------- 房屋：烟囱 + 窗口光晕 ---------- */
const glowWins = [];
W.traverse(o => { if (o.isMesh && o.userData.glow) glowWins.push(o); });
const winGlow = new V.Strokes(glowWins.length*2, {additive: true, shape: 'glow', renderOrder: 3}); W.add(winGlow.mesh);
const tmpV = new THREE.Vector3();
glowWins.forEach((wm, i) => {
  wm.getWorldPosition(tmpV);
  const s = Math.max(wm.geometry.parameters.width, wm.geometry.parameters.height);
  winGlow.set(i*2, tmpV.x, tmpV.y, tmpV.z + 0.3, 1, 0, 0, s*5, s*4, [1.0, 0.72, 0.3], 0.55);
  winGlow.set(i*2+1, tmpV.x, tmpV.y - s*1.5, tmpV.z + 1.2, 1, 0, 0, s*3, s*1.2, [1.0, 0.65, 0.25], 0.25);   // 窗下地面的光斑
});
winGlow.commit();
const chimMat = new THREE.MeshLambertMaterial({ color: 0x6a6070, map: TEX.plaster });
W.traverse(o => {
  if (!o.isMesh || o.geometry.type !== 'BoxGeometry' || !o.children.length || R() > 0.45) return;
  const gp = o.geometry.parameters, ch = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.2, 0.7), chimMat);
  ch.position.set((R()-0.5)*gp.width*0.4, gp.height/2 + gp.height*0.45, (R()-0.5)*gp.depth*0.3); o.add(ch);
});

/* ---------- 病房：画架 + 正在画的《星月夜》 ---------- */
{
  const E_ = new THREE.Group(); E_.position.set(6.7, 5.05, 78.3); E_.rotation.y = -0.85; ROOM.add(E_);
  const wood = new THREE.MeshLambertMaterial({ color: 0xb08a68, map: TEX.wood });
  const leg = (x, z, rx, rz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 7.4, 0.16), wood); m.position.set(x, 3.6, z); m.rotation.set(rx, 0, rz); E_.add(m); };
  leg(-1.1, 0.25, 0.08, 0.14); leg(1.1, 0.25, 0.08, -0.14); leg(0, -0.9, -0.22, 0);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 0.22), wood); bar.position.set(0, 3.0, 0.42); E_.add(bar);
  const painting = V.card({ w: 3.3, h: 2.64, px: 1024, doubleSide: false, draw(c, Wd, H){
    c.fillStyle = '#e8e0d0'; c.fillRect(0, 0, Wd, H);
    V.paint2d.drawStarry(c, 0, Wd/2, H*0.5, Wd, { reveal: 0.78 });     // 未完成：天空笔触还差一些
    c.fillStyle = 'rgba(232,224,208,.55)'; c.fillRect(Wd*0.72, 0, Wd*0.28, H*0.35);   // 右上角尚未上色
  }});
  painting.mesh.material = new THREE.MeshLambertMaterial({ map: painting.tex, side: THREE.FrontSide });
  painting.mesh.position.set(0, 4.55, 0.5); painting.mesh.rotation.x = -0.1; E_.add(painting.mesh);
  const back = new THREE.Mesh(new THREE.BoxGeometry(3.36, 2.7, 0.08), wood); back.position.set(0, 4.55, 0.45); back.rotation.x = -0.1; E_.add(back);
}

/* ---------- 梵高重建 ---------- */
const VG = W.vangogh;
VG.children.forEach(c => { c.visible = false; });                   // 隐藏旧的笔触人像
const skinTex = canvasTex(1024, 512, (c, w, h) => {
  // 等距柱状投影：u=0.75 为面部正前方（-z），v=0.5 为赤道
  c.fillStyle = '#d49a6a'; c.fillRect(0, 0, w, h);
  dabs(c, w, h, 1800, ['#e0aa78','#c88a5a','#d8a070','#b87a4e','#e8b88a'], 26, 7, 0.4, 2.5);
  const fx = 0.75*w;
  const blob = (x, y, rx, ry, col, a) => { c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI*2); c.fill(); c.globalAlpha = 1; };
  blob(fx - 92, 262, 46, 34, '#d07a5a', 0.45); blob(fx + 92, 262, 46, 34, '#d07a5a', 0.45);              // 脸颊红晕
  blob(fx, 222, 120, 26, '#8a9a6a', 0.15);                                                             // 眉骨下的绿灰阴影（梵高自画像的配色）
  for (const sx of [-1, 1]){
    const ex = fx + sx*56, ey = 226;
    blob(ex, ey + 4, 30, 12, '#9a7a5e', 0.35);                                                         // 眼窝
    blob(ex, ey, 22, 10, '#e8e0cc', 0.95);                                                             // 眼白
    blob(ex + sx*2, ey, 11, 10, '#3e6e62', 1); blob(ex + sx*2, ey, 5, 5, '#141a18', 1);               // 蓝绿色虹膜、瞳孔
    blob(ex + sx*2 + 4, ey - 4, 3, 3, '#ffffff', 0.9);                                                 // 高光
    c.strokeStyle = '#4a2a1a'; c.lineWidth = 4; c.beginPath(); c.ellipse(ex, ey, 24, 11, 0, Math.PI*1.05, Math.PI*1.95); c.stroke();   // 上眼睑
    c.strokeStyle = '#b8541f'; c.lineWidth = 9; c.lineCap = 'round';                                   // 橙红眉毛，眉头微蹙
    c.beginPath(); c.moveTo(ex - sx*34, ey - 30); c.quadraticCurveTo(ex, ey - 42, ex + sx*30, ey - 24); c.stroke();
  }
  c.strokeStyle = '#a86a48'; c.lineWidth = 6; c.beginPath(); c.moveTo(fx - 6, 232); c.lineTo(fx - 12, 282); c.lineTo(fx + 8, 290); c.stroke();   // 鼻梁与鼻翼阴影
  c.strokeStyle = '#7a3a2a'; c.lineWidth = 5; c.beginPath(); c.moveTo(fx - 30, 318); c.quadraticCurveTo(fx, 326, fx + 30, 318); c.stroke();      // 抿着的嘴
  c.strokeStyle = 'rgba(140,90,60,.6)'; c.lineWidth = 4;                                                // 额头的皱纹
  for (let k=0;k<3;k++){ c.beginPath(); c.moveTo(fx - 70, 170 + k*12); c.quadraticCurveTo(fx, 162 + k*12, fx + 70, 170 + k*12); c.stroke(); }
});
const hairTex = canvasTex(512, 256, (c, w, h) => { c.fillStyle = '#b8521f'; c.fillRect(0, 0, w, h);
  dabs(c, w, h, 1400, ['#d46a2e','#a8481e','#e07a3a','#8a3a18','#f08a44','#c0592a'], 22, 5, Math.PI/2, 0.9); });
const coatTex = canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#3a5a9e'; c.fillRect(0, 0, w, h);
  for (let k=0;k<14;k++){ const x = R()*w; c.fillStyle = 'rgba(20,30,70,.28)'; c.fillRect(x, 0, 6 + R()*16, h); }   // 竖向衣褶
  dabs(c, w, h, 1600, ['#2f4a88','#4a6cb0','#5a7cc0','#26407a','#6a8ac8','#3e5ea0'], 40, 8, Math.PI/2, 0.5); });
const trouserTex = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#2e3448'; c.fillRect(0, 0, w, h);
  dabs(c, w, h, 500, ['#3a4258','#262c3e','#424a62'], 30, 6, Math.PI/2, 0.4); });
const M = {
  skin: new THREE.MeshLambertMaterial({ color: 0xffffff, map: skinTex }),
  skinPlain: new THREE.MeshLambertMaterial({ color: 0xd49a6a }),
  hair: new THREE.MeshLambertMaterial({ color: 0xffffff, map: hairTex }),
  coat: new THREE.MeshLambertMaterial({ color: 0xffffff, map: coatTex }),
  trousers: new THREE.MeshLambertMaterial({ color: 0xffffff, map: trouserTex }),
  shoe: new THREE.MeshLambertMaterial({ color: 0x2a1c14 }),
  shirt: new THREE.MeshLambertMaterial({ color: 0xd8d4c4 }),
  wood: new THREE.MeshLambertMaterial({ color: 0xc09a70, map: TEX.wood }),
};
const add = (geo, mat, pos, rot, scl) => { const m = new THREE.Mesh(geo, mat); if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); if (scl) m.scale.set(...scl); VG.add(m); return m; };
// 腿与鞋
for (const sx of [-0.31, 0.31]){
  add(new THREE.CylinderGeometry(0.27, 0.24, 2.3, 16), M.trousers, [sx, 1.3, 0]);
  add(new THREE.SphereGeometry(1, 16, 10), M.shoe, [sx, 0.12, -0.12], null, [0.2, 0.13, 0.36]);
}
// 罩衫：车削出肩—胸—腰—下摆的轮廓，前后略扁
{
  const prof = [[0.0,2.05],[0.98,2.05],[1.02,2.25],[0.97,2.7],[0.9,3.2],[0.88,3.6],[0.92,3.85],[0.82,4.02],[0.5,4.12],[0.24,4.16]].map(([r,y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(prof, 40);
  const pa = g.attributes.position;
  for (let i=0;i<pa.count;i++){ const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), a = Math.atan2(z, x);
    const fold = 1 + 0.035*Math.sin(a*9 + y*2) * V.clamp((3.4 - y)/1.3, 0, 1);          // 下摆的布褶
    pa.setXYZ(i, x*fold, y, z*0.7*fold); }
  g.computeVertexNormals();
  add(g, M.coat);
  add(new THREE.TorusGeometry(0.24, 0.06, 8, 24), M.shirt, [0, 4.14, -0.02], [Math.PI/2 + 0.15, 0, 0]);   // 衬衫领口
}
// 手臂：沿曲线的管子；手：椭球
const arm = (pts, r) => add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => V.v3(...p))), 24, r, 12, false), M.coat);
arm([[-0.82, 3.92, 0], [-1.0, 3.45, -0.1], [-1.04, 3.05, -0.3], [-0.86, 2.95, -0.8]], 0.19);       // 左臂：托调色板
arm([[0.82, 3.92, 0], [1.12, 3.5, -0.15], [1.38, 3.28, -0.42], [1.68, 3.5, -0.78]], 0.18);         // 右臂：伸向画布
add(new THREE.SphereGeometry(1, 14, 10), M.skinPlain, [-0.82, 2.93, -0.98], [0.2, 0, 0], [0.13, 0.09, 0.16]);
add(new THREE.SphereGeometry(1, 14, 10), M.skinPlain, [1.74, 3.53, -0.86], [0, 0.5, 0.3], [0.12, 0.1, 0.15]);
// 调色板与画笔
add(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 28), M.wood, [-0.85, 2.86, -1.12], [0, 0, 0], [1, 1, 0.75]);
['#f4d34a','#2c5ea3','#fbeeb0','#e8b830','#7ea6d4','#c0392b','#3e4f2e'].forEach((h, i) => { const a = 0.5 + i*0.55;
  add(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshLambertMaterial({ color: h }), [-0.85 + Math.cos(a)*0.32, 2.9, -1.12 + Math.sin(a)*0.22], null, [1, 0.5, 1]); });
add(new THREE.CylinderGeometry(0.022, 0.016, 1.0, 6), new THREE.MeshLambertMaterial({ color: 0x6a4a2a }), [1.98, 3.66, -1.04], [-1.0, 0, -0.9]);
// 脖子、头（下颌收窄）、鼻子、耳朵
add(new THREE.CylinderGeometry(0.15, 0.17, 0.4, 14), M.skinPlain, [0, 4.3, -0.03]);
{
  const g = new THREE.SphereGeometry(1, 48, 32), pa = g.attributes.position;
  for (let i=0;i<pa.count;i++){ let x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
    if (y < 0){ x *= 1 - 0.22*(-y); }                                   // 下颌收窄
    if (z > 0.3) z *= 0.92;                                             // 后脑略平
    pa.setXYZ(i, x, y, z); }
  g.computeVertexNormals();
  add(g, M.skin, [0, 4.8, -0.04], null, [0.33, 0.42, 0.37]);
  add(new THREE.SphereGeometry(1, 16, 12), M.skinPlain, [0, 4.74, -0.42], [0.25, 0, 0], [0.065, 0.12, 0.075]);   // 鼻子
  for (const sx of [-1, 1]) add(new THREE.SphereGeometry(1, 12, 10), M.skinPlain, [sx*0.33, 4.8, 0.0], null, [0.05, 0.1, 0.08]);   // 耳朵
  // 头发：头顶与后脑的帽状体
  add(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI*2, 0, 1.25), M.hair, [0, 4.82, -0.02], [-0.2, 0, 0], [0.355, 0.44, 0.395]);
  add(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI, 0.9, 1.1), M.hair, [0, 4.78, 0.0], null, [0.35, 0.43, 0.39]);      // phi 0..π 即后脑（+z）一侧
  // 胡须：下巴与两腮的一层体块（只覆盖面部前方和两侧的下半部）
  {                                                                    // 跟头部一样收窄下颌，只从嘴下方开始，贴着脸
    const bg = new THREE.SphereGeometry(1, 36, 18, Math.PI*0.9, Math.PI*1.2, 1.98, 0.9), bp = bg.attributes.position;
    for (let i=0;i<bp.count;i++){ const x = bp.getX(i), y = bp.getY(i); if (y < 0) bp.setX(i, x*(1 - 0.22*(-y))); }
    bg.computeVertexNormals();
    add(bg, M.hair, [0, 4.8, -0.04], null, [0.345, 0.43, 0.385]);
  }
  add(new THREE.CapsuleGeometry(0.028, 0.16, 4, 8), M.hair, [0, 4.665, -0.415], [0, 0, Math.PI/2]);   // 唇上的髭
}
// 笔触描边层：头发、胡须、罩衫边缘一圈细笔触，保留油画质感
{
  const items = [], vgw = new THREE.Vector3();
  const ring = (n, c, r, pal, len, wid, filter) => { for (let i=0;i<n;i++){ const u = R()*Math.PI*2, v = Math.asin(R()*2-1);
    const nn = [Math.cos(v)*Math.cos(u), Math.sin(v), Math.cos(v)*Math.sin(u)]; if (filter && !filter(nn)) { i--; continue; }
    items.push([c[0]+r[0]*nn[0], c[1]+r[1]*nn[1], c[2]+r[2]*nn[2], -Math.sin(u), 0.6*(R()-0.5) - 0.5, Math.cos(u), len*(0.7+R()*0.6), wid, V.hex(pick(pal)).map(x => x*0.85)]); } };
  ring(360, [0, 4.84, -0.02], [0.37, 0.45, 0.41], ['#c0592a','#d46a2e','#e07a3a','#a8481e'], 0.13, 0.035, nn => nn[1] > 0.25 || nn[2] > 0.3);
  ring(220, [0, 4.58, -0.08], [0.29, 0.28, 0.36], ['#c0592a','#d46a2e','#e8843e','#b04a20'], 0.1, 0.03, nn => nn[1] < -0.35 && nn[2] < 0.2);
  const st = new V.Strokes(items.length, {renderOrder: 4});
  items.forEach((p, i) => st.set(i, p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], 0.9)); st.commit(); VG.add(st.mesh);
}
})();

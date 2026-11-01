/* world_real.js — 逼真度增强（在 world.js 之后加载）
   1. 光照：天光（半球光）+ 月光（平行光）+ 烛光（点光源）+ 窗口冷光（聚光灯）
   2. 世界里的平涂材质换成受光材质（Lambert），配程序化的笔触纹理：灰泥墙、瓦片屋顶、陶土地砖、木纹、田野
   3. 房屋加烟囱与窗光；病房加画架，画布上是正在画的《星月夜》
   4. 梵高人像见 vangogh.js
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

/* 梵高人像在 vangogh.js 里构建（共用这里的纹理工具） */
V.real = { canvasTex, dabs, TEX, pick };
})();

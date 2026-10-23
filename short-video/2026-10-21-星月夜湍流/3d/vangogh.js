/* vangogh.js — 主角梵高（按 1889 年圣雷米时期自画像的特征）
   比例：约 7 头身、瘦长；脸：高眉骨、深眼窝、长而直的鼻子、突出的颧骨、凹陷的脸颊、收窄的下颌；
   头发：剪得很短的橙红色，额头高、太阳穴处发际线后退；胡须：紧贴下颌的短须，连着鬓角，唇上有髭；
   眼睛：蓝绿色虹膜，上眼睑压住虹膜上缘；衣着：带翻领与纽扣的蓝色外套，白衬衫领；
   姿势：左手托调色板，右手执笔伸向画布。头部以真人头部扫描为底改形、重新上色（见下方"头"）。
   局部坐标：地面 y=0，面朝 -z，右手在 +x。全部在加载时构建一次，画面只由 t 决定。 */
(function(){
const VG = V.world.vangogh, { canvasTex, dabs, TEX } = V.real, R = V.rng(1853);
VG.children.forEach(c => { c.visible = false; });            // 隐藏旧版人像
V.world.updateMatrixWorld(true);
const pick = a => a[Math.floor(R()*a.length)];
const ss = (a, b, x) => { const t = V.clamp((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t); };
const lerp = V.lerp;

const coatTex = canvasTex(512, 512, (c, W, H) => { c.fillStyle = '#34528e'; c.fillRect(0, 0, W, H);
  for (let k=0;k<16;k++){ const x = R()*W; c.fillStyle = 'rgba(16,24,60,.25)'; c.fillRect(x, 0, 5 + R()*14, H); }
  dabs(c, W, H, 1800, ['#2a4480','#4466a8','#5476b8','#22386c','#6282c0','#3a5a98','#1e3264'], 34, 7, Math.PI/2, 0.5); });
const trouserTex = canvasTex(256, 256, (c, W, H) => { c.fillStyle = '#2c3246'; c.fillRect(0, 0, W, H);
  dabs(c, W, H, 500, ['#3a4258','#22283a','#424a62'], 28, 6, Math.PI/2, 0.4); });
const Mt = {
  skin: new THREE.MeshLambertMaterial({ color: 0xc89870 }),
  coat: new THREE.MeshLambertMaterial({ map: coatTex }),
  lapel: new THREE.MeshLambertMaterial({ map: coatTex, color: 0xb8c4e0, side: THREE.DoubleSide }),
  shirt: new THREE.MeshLambertMaterial({ color: 0xe0dccc, side: THREE.DoubleSide }),
  trousers: new THREE.MeshLambertMaterial({ map: trouserTex }),
  shoe: new THREE.MeshLambertMaterial({ color: 0x2a1c14 }),
  button: new THREE.MeshLambertMaterial({ color: 0x1a1a22 }),
  wood: new THREE.MeshLambertMaterial({ color: 0xc09a70, map: TEX.wood }),
};
const mesh = (geo, mat, parent, pos, rot, scl) => { const m = new THREE.Mesh(geo, mat); if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); if (scl) m.scale.set(...scl); (parent || VG).add(m); return m; };

/* ================= 头 =================
   以 Lee Perry-Smith 头部扫描（CC BY 3.0，见 vendor/lps_head.js）为底，再按梵高 1889 年的自画像改：
   形：脸颊凹陷、下颌收窄、颧骨与眉骨加重、脸略拉长；色：赭黄肤色 + 顺着脸形打转的笔触、睁开的蓝绿色眼睛、橙红眉毛；
   剪短的橙红头发、贴着下颌的短须和唇上的髭用多层"壳"做：每层沿法线外推一点、按发丝噪声镂空，所以能正常受光。
   扫描的贴图是绕头一圈的柱面展开（u = 0.5 正脸，u = 0/1 后脑），下面的区域都画在 1024×1024 的贴图像素坐标里（y 向下），左右镜像。 */
const HG = new THREE.Group(); HG.position.set(0, 4.56, -0.03); HG.rotation.set(0.07, -0.12, 0); VG.add(HG);   // 头微低、略转向画布
const HAIR  = [[-60,-60],[512,-60],[512,142],[470,139],[430,129],[396,129],[372,150],[360,190],[348,240],[340,300],[342,430],[304,440],[296,330],[282,296],[250,288],[214,296],
               [198,330],[192,420],[178,492],[120,506],[60,510],[-60,512]];                                   // 高额头、太阳穴处后退，鬓角一直连到胡须，耳后到颈窝
const BEARD = [[338,382],[372,430],[410,468],[438,498],[470,507],[512,511],[512,702],[440,692],[378,662],[328,612],[304,540],[300,450]];   // 下唇以下、下颌与下巴、腮帮下半
const MOUS  = [[512,436],[480,433],[455,441],[439,459],[431,486],[440,503],[452,482],[470,469],[512,467]];   // 唇上的髭，两端垂到嘴角
const BROW  = [[384,281],[400,266],[428,256],[458,258],[488,268]];                                           // 眉毛（折线，画粗线）
const EYES  = [[400, 478, [-0.69, 1.74, 1.57], -0.70, 0.31], [548, 626, [0.51, 1.72, 1.585], 0.52, 0.31]];
// ↑ 每只眼：贴图上的 x 范围、扫描坐标里的眼球中心（按扫描内部的眼球面拟合）、睁开部分的中心 x 与半宽（两眼角处仍闭合）
const EYE_R = 0.28;
// 扫描时是闭着眼的：贴图 y 278–296 是上眼睑（296 为睑缘），296–306 是两睑之间的缝，306–318 是下眼睑
V.preload.push(buildHead());

async function buildHead(){
  const L = V.LPS, S = 1024;
  const b64 = (s, T) => { const b = atob(s), u = new Uint8Array(b.length); for (let i=0;i<b.length;i++) u[i] = b.charCodeAt(i); return new T(u.buffer); };
  const P = b64(L.pos, Float32Array), N0 = b64(L.nrm, Float32Array), UV = b64(L.uv, Float32Array), I = b64(L.idx, Uint16Array), nv = P.length/3;
  const load = src => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = src; });
  const [imCol, imNrm, imSpec] = await Promise.all([L.col, L.nmap, L.spec].map(load));
  const canvas = draw => { const cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d', {willReadFrequently: true}); draw(c); return cv; };
  const path = (c, pts, close = true) => { c.beginPath();
    for (const m of [1, -1]){ pts.forEach(([x, y], i) => { const X = m > 0 ? x : S - x; i ? c.lineTo(X, y) : c.moveTo(X, y); }); if (close) c.closePath(); } };
  const maskCv = (pts, blur, line) => canvas(c => { c.filter = `blur(${blur}px)`; path(c, pts, !line);
    if (line){ c.strokeStyle = '#fff'; c.lineWidth = line; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); } else { c.fillStyle = '#fff'; c.fill(); } });
  const mk = { hair: maskCv(HAIR, 7), beard: maskCv(BEARD, 9), mous: maskCv(MOUS, 4), brow: maskCv(BROW, 3, 10) };
  const md = {}; for (const k in mk) md[k] = mk[k].getContext('2d').getImageData(0, 0, S, S).data;
  const at = (d, x, y) => d[((Math.min(S - 1, Math.max(0, y|0)))*S + Math.min(S - 1, Math.max(0, x|0)))*4 + 3]/255;
  const tint = (cv, col, alpha, op = 'source-over') => { const t = canvas(c => { c.drawImage(cv, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = col; c.fillRect(0, 0, S, S); });
    return c => { c.globalAlpha = alpha; c.globalCompositeOperation = op; c.drawImage(t, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }; };

  /* ---- 皮肤贴图 ---- */
  const skin = canvas(c => {
    c.drawImage(imCol, 0, 0, S, S);
    c.globalCompositeOperation = 'saturation'; c.globalAlpha = 0.3; c.fillStyle = '#808080'; c.fillRect(0, 0, S, S); c.globalAlpha = 1;   // 压掉扫描里偏粉的红润
    c.globalCompositeOperation = 'multiply'; c.fillStyle = '#ead7a2'; c.fillRect(0, 0, S, S);          // 偏赭黄、晒过的肤色
    c.globalCompositeOperation = 'source-over';
    // 顺着脸形打转的短笔触：颜色取自底图再掺一点梵高自画像里的绿、橙、粉
    const img = c.getImageData(0, 0, S, S).data, mix = ['#8f9a5e','#d58a4a','#d99a86','#e8c98a','#7d8c74'];
    c.lineCap = 'round';
    for (let i=0;i<9000;i++){
      const x = R()*S, y = R()*S;
      const o = ((y|0)*S + (x|0))*4, m = V.hex(pick(mix)), k = 0.12 + R()*0.12;
      const col = [0, 1, 2].map(j => Math.round(lerp(img[o + j], m[j]*255, k)));
      const ang = Math.atan2(y - 380, x - 512) + Math.PI/2 + (R() - 0.5)*0.7, len = 9 + R()*10;
      c.strokeStyle = `rgb(${col})`; c.lineWidth = 2.5 + R()*2; c.globalAlpha = 0.25 + R()*0.2;
      c.beginPath(); c.moveTo(x - Math.cos(ang)*len/2, y - Math.sin(ang)*len/2); c.lineTo(x + Math.cos(ang)*len/2, y + Math.sin(ang)*len/2); c.stroke();
    }
    c.globalAlpha = 1;
    // 上眼睑抬起后，原来的睑缘成了睫毛线；两睑之间的缝藏到眼球后面，涂暗
    for (const [x0, x1] of EYES){
      const g = c.createLinearGradient(0, 284, 0, 312);
      g.addColorStop(0, 'rgba(40,22,14,0)'); g.addColorStop(0.3, 'rgba(40,22,14,.85)'); g.addColorStop(0.75, 'rgba(30,16,10,.9)'); g.addColorStop(0.86, 'rgba(170,105,90,.7)'); g.addColorStop(1, 'rgba(170,105,90,0)');
      c.fillStyle = g; c.beginPath(); c.ellipse((x0 + x1)/2, 298, (x1 - x0)/2, 14, 0, 0, Math.PI*2); c.fill();
    }
    tint(mk.brow, '#7a3c1e', 0.75)(c);                                                    // 橙红偏褐的眉毛
    tint(mk.hair, '#5c2812', 1)(c); tint(mk.beard, '#743414', 0.95)(c); tint(mk.mous, '#7a3616', 1)(c);   // 发根处的深色（上面再长壳）
  });
  const nrm = canvas(c => { c.drawImage(imNrm, 0, 0, S, S); c.filter = 'blur(4px)'; c.fillStyle = 'rgb(128,128,255)';   // 抹掉扫描里闭眼的眼睑褶皱
    for (const [x0, x1] of EYES){ c.beginPath(); c.ellipse((x0 + x1)/2, 298, (x1 - x0)/2 + 4, 15, 0, 0, Math.PI*2); c.fill(); } c.filter = 'none'; });
  const tex = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; return t; };
  const specT = new THREE.Texture(imSpec); specT.needsUpdate = true;

  /* ---- 改形（扫描坐标：y 上、脸朝 +z，下巴 y≈-0.5、头顶 y≈4） ---- */
  const g3 = (x, y, z, cx, cy, cz, r) => Math.exp(-((x - cx)**2 + (y - cy)**2 + (z - cz)**2)/(2*r*r));
  const warp = (x, y, z) => [x*(1 - 0.1*ss(1.2, -0.5, y))*(1 - 0.04*ss(-0.5, 1.2, z)),      // 下颌收窄、脸的前半部分略窄
                             y < 1.7 ? 1.7 + (y - 1.7)*1.04 : y, z];                         // 脸略拉长
  const Q = new Float32Array(P.length), hairV = new Float32Array(nv), beardV = new Float32Array(nv), mousV = new Float32Array(nv), browV = new Float32Array(nv);
  for (let i=0;i<nv;i++){
    let x = P[i*3], y = P[i*3+1], z = P[i*3+2];
    const nx = N0[i*3], ny = N0[i*3+1], nz = N0[i*3+2], ax = Math.abs(x), px = UV[i*2]*S, py = (1 - UV[i*2+1])*S;
    for (const [x0, x1, ec, xm, hw] of EYES){                                          // 睁眼：睑缘移到平滑的杏仁形曲线上，上眼睑厚重、压住虹膜上缘
      if (px < x0 || px > x1 || py < 272 || py > 320) continue;
      const s0 = (x - xm)/hw, s = V.clamp(s0, -1, 1), f = 1 - ss(0.92, 1.12, Math.abs(s0));     // f：眼角以外保持闭合
      const yU = 1.80 - 0.10*s*s, yL = 1.585 + 0.115*s*s;
      if (py < 296){ const w = ss(278, 291, py)*f; y = lerp(y, Math.max(y, yU), w); z -= 0.02*w*(1 - s*s); }
      else if (py > 306) y = lerp(y, Math.min(y, yL), ss(318, 308, py)*f);
    }
    let d = 0;
    d -= 0.17*g3(ax, y, z, 1.15, 0.55, 1.35, 0.42);                                     // 凹陷的脸颊
    d += 0.05*g3(ax, y, z, 1.2, 1.35, 1.6, 0.35);                                       // 颧骨
    d += (0.06*g3(ax, y, z, 0.65, 2.02, 2.0, 0.38) + 0.03*g3(x, y, z, 0, 1.95, 2.15, 0.25))*ss(1.78, 1.98, y);   // 眉骨（不动眼睑）
    d -= 0.05*g3(ax, y, z, 1.45, 2.3, 1.0, 0.4);                                        // 太阳穴
    d += 0.05*g3(x, y, z, 0, 1.05, 2.55, 0.25) + 0.03*g3(x, y, z, 0, 1.6, 2.35, 0.2);   // 长而直的鼻子
    [x, y, z] = warp(x + nx*d, y + ny*d, z + nz*d);
    for (const [x0, x1, ec] of EYES){                                                  // 眼睑贴着眼球：落在眼球里的点推到眼球表面外一点
      if (px < x0 || px > x1 || py < 272 || py > 320 || (py >= 295 && py <= 306.5)) continue;
      const c = warp(...ec), vx = x - c[0], vy = y - c[1], vz = z - c[2], r = Math.hypot(vx, vy, vz), R1 = EYE_R + 0.012;
      if (r < R1){ x = c[0] + vx/r*R1; y = c[1] + vy/r*R1; z = c[2] + vz/r*R1; }
    }
    Q[i*3] = x; Q[i*3+1] = y; Q[i*3+2] = z;
    hairV[i] = at(md.hair, px, py); beardV[i] = at(md.beard, px, py); mousV[i] = at(md.mous, px, py); browV[i] = at(md.brow, px, py);
  }
  // 删掉两睑之间那层夹缝网格，眼裂处直接露出后面的眼球
  const slit = i => { const px = UV[i*2]*S, py = (1 - UV[i*2+1])*S;
    return py >= 295 && py <= 306.5 && EYES.some(([x0, x1, , xm, hw]) => px > x0 && px < x1 && Math.abs(P[i*3] - xm) < hw*0.97); };
  const I2 = []; for (let t=0;t<I.length;t+=3) if (!(slit(I[t]) || slit(I[t+1]) || slit(I[t+2]))) I2.push(I[t], I[t+1], I[t+2]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(Q, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); geo.setIndex(new THREE.BufferAttribute(new Uint16Array(I2), 1));
  geo.computeVertexNormals();
  { // 贴图接缝处的顶点是分开的：同一位置的法线取平均，避免接缝露出棱线
    const Nn = geo.attributes.normal.array, groups = new Map();
    for (let i=0;i<nv;i++){ const k = `${Q[i*3].toFixed(4)},${Q[i*3+1].toFixed(4)},${Q[i*3+2].toFixed(4)}`; (groups.get(k) || groups.set(k, []).get(k)).push(i); }
    for (const ids of groups.values()) if (ids.length > 1){ const s = [0, 0, 0]; ids.forEach(i => { for (let j=0;j<3;j++) s[j] += Nn[i*3+j]; });
      const l = Math.hypot(...s) || 1; ids.forEach(i => { for (let j=0;j<3;j++) Nn[i*3+j] = s[j]/l; }); }
  }
  const head = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ map: tex(skin, true), normalMap: tex(nrm, false), normalScale: new THREE.Vector2(0.7, 0.7),
    specularMap: specT, specular: 0x3a3028, shininess: 18 }));
  const HS = 0.16;                                                                       // 扫描 1 单位（约 5 厘米）→ 人物局部坐标
  const HM = new THREE.Group(); HM.position.set(0, -0.28, 0.03); HM.rotation.y = Math.PI; HM.scale.setScalar(HS); HG.add(HM);   // 转成面朝 -z
  HM.add(head);
  const eyeTex = canvasTex(256, 128, (c, W, H) => {                                      // 眼球贴图：虹膜在 u = 0.25（朝 +z）
    c.fillStyle = '#c2b59e'; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(W*0.25, H/2, 20, W*0.25, H/2, 64); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(150,95,85,.45)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const ig = c.createRadialGradient(W*0.25, H/2, 4, W*0.25, H/2, 19);
    ig.addColorStop(0, '#86947a'); ig.addColorStop(0.4, '#58725e'); ig.addColorStop(0.85, '#34483c'); ig.addColorStop(1, '#1a221c');   // 蓝绿色虹膜
    c.fillStyle = ig; c.beginPath(); c.arc(W*0.25, H/2, 19, 0, Math.PI*2); c.fill();
    c.strokeStyle = 'rgba(160,200,170,.35)'; c.lineWidth = 1;
    for (let k=0;k<40;k++){ const a = k/40*Math.PI*2; c.beginPath(); c.moveTo(W*0.25 + Math.cos(a)*8, H/2 + Math.sin(a)*8); c.lineTo(W*0.25 + Math.cos(a)*16, H/2 + Math.sin(a)*16); c.stroke(); }
    c.fillStyle = '#080a09'; c.beginPath(); c.arc(W*0.25, H/2, 6.5, 0, Math.PI*2); c.fill();
  });
  const eyeM = new THREE.MeshPhongMaterial({ map: eyeTex, specular: 0x3a3a3a, shininess: 160 }), sockM = new THREE.MeshLambertMaterial({ color: 0x5a2c26 });     // 湿润的眼球：烛光会在上面留下高光
  for (const [, , ec] of EYES){
    const e = new THREE.Mesh(new THREE.SphereGeometry(EYE_R, 32, 20), eyeM);
    e.position.set(...warp(...ec)); e.rotation.set(0.12, -0.22, 0); HM.add(e);                  // 目光略向下、偏向他右手边的画布
    const sock = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), sockM);               // 眼窝：眼角处露出的暗红色（泪阜、结膜），也免得从眼裂看穿头部
    sock.position.set(...warp(ec[0], ec[1] - 0.01, ec[2] - 0.1)); sock.scale.set(0.34, 0.22, 0.3); HM.add(sock);
  }

  /* ---- 头发与胡须：多层壳 ---- */
  const NS = 12, Nn = geo.attributes.normal.array;
  const fur = i => Math.max(hairV[i], beardV[i], mousV[i], browV[i]*0.8);
  const tris = []; for (let t=0;t<I.length;t+=3) if (fur(I[t]) > 0.02 || fur(I[t+1]) > 0.02 || fur(I[t+2]) > 0.02) tris.push(I[t], I[t+1], I[t+2]);
  const len = new Float32Array(nv), comb = new Float32Array(nv*3);
  for (let i=0;i<nv;i++){
    const h = hairV[i], b = beardV[i], m = mousV[i], w = browV[i];
    len[i] = Math.max(h*0.24, b*0.17, m*0.26, w*0.05);
    const sx = Math.sign(Q[i*3]) || 1;
    const d = [0*h + 0*b + sx*0.7*m + sx*w, -h - b - m + 0.25*w, -0.8*h + 0.15*b + 0.3*m];          // 头发向后向下梳，胡须向下，髭向下向外，眉毛向外
    const n = [Nn[i*3], Nn[i*3+1], Nn[i*3+2]], dn = d[0]*n[0] + d[1]*n[1] + d[2]*n[2];
    const t = [d[0] - n[0]*dn, d[1] - n[1]*dn, d[2] - n[2]*dn], tl = Math.hypot(...t) || 1;
    comb[i*3] = t[0]/tl; comb[i*3+1] = t[1]/tl; comb[i*3+2] = t[2]/tl;
  }
  // 发丝的颜色与镂空噪声：512 格的随机值，每格一缕；镂空值再乘区域遮罩，所以边缘的发须更短更稀
  const G = 512, cell = S/G, cols = { h: ['#b8582a','#c86a32','#a04a1e','#d88a40','#8a3c1a','#e09a50','#7a3418','#c07a48'], b: ['#c55a26','#d87436','#e8984a','#a84818','#c86630','#b06a3a','#8c4420'] };
  const furCol = canvas(c => { const im = c.createImageData(S, S), p = im.data;
    for (let gy=0;gy<G;gy++) for (let gx=0;gx<G;gx++){
      const x = gx*cell + 1, y = gy*cell + 1, isB = at(md.beard, x, y) + at(md.mous, x, y) > at(md.hair, x, y), rgb = V.hex(pick(isB ? cols.b : cols.h)), k = 0.85 + R()*0.3;
      for (let yy=0;yy<cell;yy++) for (let xx=0;xx<cell;xx++){ const o = ((gy*cell + yy)*S + gx*cell + xx)*4; p[o] = V.clamp(rgb[0]*k, 0, 1)*255; p[o+1] = V.clamp(rgb[1]*k, 0, 1)*255; p[o+2] = V.clamp(rgb[2]*k, 0, 1)*255; p[o+3] = 255; }
    }
    c.putImageData(im, 0, 0);
    tint(mk.brow, '#7a3c1e', 0.7)(c); });
  const furA = canvas(c => { const im = c.createImageData(S, S), p = im.data;
    for (let gy=0;gy<G;gy++) for (let gx=0;gx<G;gx++){
      const r = Math.pow(R(), 0.6);
      for (let yy=0;yy<cell;yy++) for (let xx=0;xx<cell;xx++){ const x = gx*cell + xx, y = gy*cell + yy, o = (y*S + x)*4;
        const m = Math.max(at(md.hair, x, y), at(md.beard, x, y), at(md.mous, x, y), at(md.brow, x, y)*0.8);
        p[o] = p[o+1] = p[o+2] = r*m*255; p[o+3] = 255; }
    }
    c.putImageData(im, 0, 0); });
  const furColT = tex(furCol, true), furAT = tex(furA, false), idxA = new THREE.BufferAttribute(new Uint16Array(tris), 1);
  for (let k=1;k<=NS;k++){
    const f = k/NS, pos = new Float32Array(Q.length);
    for (let i=0;i<nv;i++){ const l = Math.max(len[i]*f, 0.004);
      for (let j=0;j<3;j++) pos[i*3+j] = Q[i*3+j] + Nn[i*3+j]*l + comb[i*3+j]*len[i]*f*f*0.9; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', geo.attributes.normal); g.setAttribute('uv', geo.attributes.uv); g.setIndex(idxA);
    const m = new THREE.MeshLambertMaterial({ map: furColT, alphaMap: furAT, alphaTest: 0.04 + 0.9*(k - 0.5)/NS, color: new THREE.Color().setScalar(lerp(0.4, 0.92, f)) });
    HM.add(new THREE.Mesh(g, m));
  }
  V.vgDebug = { skin, nrm, furCol, furA, mk };                                         // 调试用：导出贴图检查（正式渲染不读）
}

/* ================= 身体：带翻领和纽扣的外套（瘦长比例） ================= */
const prof = [[0.0,2.15],[0.6,2.15],[0.64,2.35],[0.62,2.8],[0.6,3.25],[0.66,3.6],[0.71,3.8],[0.64,3.96],[0.4,4.05],[0.14,4.1]].map(([r, y]) => [r*0.85, y]);   // 瘦削的身形：肩宽约 2.6 个头宽
const coatR = y => { for (let i=0;i<prof.length-1;i++){ const [r0,y0] = prof[i], [r1,y1] = prof[i+1]; if (y >= y0 && y <= y1) return lerp(r0, r1, (y - y0)/(y1 - y0)); } return 0; };
{
  const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 48), pa = g.attributes.position;
  for (let i=0;i<pa.count;i++){ const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), a = Math.atan2(z, x);
    const fold = 1 + 0.03*Math.sin(a*7 + y*2.5)*V.clamp((3.3 - y)/1.1, 0, 1);
    pa.setXYZ(i, x*fold, y, z*0.68*fold); }
  g.computeVertexNormals();
  const torso = mesh(g, Mt.coat); torso.rotation.x = 0.035;                                  // 微微含胸
  for (const sx of [-1, 1]) mesh(new THREE.SphereGeometry(1, 18, 12), Mt.coat, VG, [sx*0.48, 3.82, 0.0], [0, 0, -sx*0.35], [0.15, 0.1, 0.2]);   // 肩头：扁平、顺着肩线下斜
  // 翻领、衬衫领与纽扣（贴在胸前）
  const zf = y => -coatR(y)*0.68 - 0.012;
  const lap = (sx) => { const s = new THREE.Shape(); s.moveTo(sx*0.06, 4.0); s.lineTo(sx*0.26, 3.86); s.lineTo(sx*0.17, 3.5); s.lineTo(sx*0.02, 3.22); s.lineTo(sx*0.06, 4.0);
    const m = mesh(new THREE.ShapeGeometry(s), Mt.lapel, VG, [0, 0, zf(3.7) - 0.004]); m.rotation.x = -0.18; };
  lap(-1); lap(1);
  { const s = new THREE.Shape(); s.moveTo(-0.07, 4.02); s.lineTo(0.07, 4.02); s.lineTo(0.0, 3.62); s.lineTo(-0.07, 4.02);
    const m = mesh(new THREE.ShapeGeometry(s), Mt.shirt, VG, [0, 0, zf(3.8) + 0.002]); m.rotation.x = -0.2; }
  mesh(new THREE.TorusGeometry(0.115, 0.03, 8, 24, Math.PI*1.3), Mt.shirt, VG, [0, 4.07, -0.04], [Math.PI/2 + 0.2, 0, Math.PI*0.85]);   // 衬衫领口
  for (const y of [2.62, 2.92, 3.22]) mesh(new THREE.SphereGeometry(0.03, 10, 8), Mt.button, VG, [0.03, y, zf(y) - 0.005]);
}
// 腿与鞋
for (const sx of [-0.22, 0.22]){
  mesh(new THREE.CylinderGeometry(0.2, 0.17, 2.25, 16), Mt.trousers, VG, [sx, 1.25, 0]);
  mesh(new THREE.SphereGeometry(1, 16, 10), Mt.shoe, VG, [sx, 0.1, -0.1], null, [0.15, 0.11, 0.3]);
}

/* ================= 手臂与手 ================= */
const tube = (pts, r) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => V.v3(...p))), 28, r, 14, false), Mt.coat);
const leftArm = [[-0.55, 3.86, 0], [-0.7, 3.42, -0.02], [-0.78, 3.04, -0.12], [-0.64, 2.84, -0.52]];
const rightArm = [[0.55, 3.86, 0], [0.84, 3.5, -0.12], [1.1, 3.26, -0.3], [1.6, 3.5, -0.62]];
tube(leftArm, 0.13); tube(rightArm, 0.125);
for (const arm of [leftArm, rightArm]){ const w = arm[arm.length - 1], p = arm[arm.length - 2];
  const cuff = mesh(new THREE.TorusGeometry(0.115, 0.028, 8, 20), Mt.shirt, VG, w);
  cuff.lookAt(VG.localToWorld(V.v3(...w).add(V.v3(w[0] - p[0], w[1] - p[1], w[2] - p[2])))); }
function hand(wrist, fwd, up0, curl, thumbSide){
  const f = V.v3(...fwd).normalize(), up = V.v3(...up0).addScaledVector(f, -V.v3(...up0).dot(f)).normalize();
  const back = f.clone().negate(), right = new THREE.Vector3().crossVectors(up, back);
  const g = new THREE.Group(); g.position.set(...wrist);
  g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, back)); VG.add(g);
  mesh(new THREE.SphereGeometry(1, 14, 10), Mt.skin, g, [0, 0, -0.07], null, [0.05, 0.022, 0.065]);          // 手掌
  for (let k=0;k<4;k++){                                                                                  // 四指
    const x = (k - 1.5)*0.022, fg = new THREE.Group(); fg.position.set(x, 0, -0.125); fg.rotation.x = -curl*(0.9 + k*0.05); g.add(fg);
    mesh(new THREE.CapsuleGeometry(0.0105, 0.05 - Math.abs(k - 1.5)*0.006, 4, 8), Mt.skin, fg, [0, 0, -0.03], [Math.PI/2, 0, 0]);
  }
  const th = new THREE.Group(); th.position.set(thumbSide*0.045, 0.004, -0.06); th.rotation.set(-curl*0.5, thumbSide*0.7, 0); g.add(th);
  mesh(new THREE.CapsuleGeometry(0.012, 0.045, 4, 8), Mt.skin, th, [0, 0, -0.03], [Math.PI/2, 0, 0]);
  return g;
}
hand([-0.64, 2.84, -0.52], [0.25, -0.3, -1], [0, 1, 0], 0.5, 1);            // 左手：托着调色板
hand([1.6, 3.5, -0.62], [0.85, 0.45, -0.45], [0, 1, 0.3], 1.25, -1);       // 右手：握笔
// 调色板（拇指穿过的木板）与颜料
mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.03, 32), Mt.wood, VG, [-0.66, 2.79, -0.78], [0.12, 0.2, 0], [1, 1, 0.72]);
['#f4d34a','#2c5ea3','#fbeeb0','#e8b830','#7ea6d4','#c0392b','#3e4f2e','#ffffff'].forEach((h, i) => { const a = 0.4 + i*0.55;
  mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshLambertMaterial({ color: h }), VG, [-0.66 + Math.cos(a)*0.28, 2.82, -0.78 + Math.sin(a)*0.18], null, [1, 0.45, 1]); });
// 画笔：从右手伸向画布
{
  const from = V.v3(1.66, 3.53, -0.68), dir = V.v3(0.98, 0.5, -0.42).normalize(), L = 0.62;
  const b = mesh(new THREE.CylinderGeometry(0.013, 0.008, L, 8), new THREE.MeshLambertMaterial({ color: 0x7a5232 }), VG, from.clone().addScaledVector(dir, L*0.35).toArray());
  b.quaternion.setFromUnitVectors(V.v3(0, 1, 0), dir);
  const tip = mesh(new THREE.ConeGeometry(0.018, 0.08, 8), new THREE.MeshLambertMaterial({ color: 0xe8c547 }), VG, from.clone().addScaledVector(dir, L*0.35 + L/2 + 0.03).toArray());
  tip.quaternion.setFromUnitVectors(V.v3(0, 1, 0), dir);
}
})();

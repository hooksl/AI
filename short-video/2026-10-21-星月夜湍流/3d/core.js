/* core.js —《星月夜的湍流》3D 版渲染框架
   约定：window.render(t) 只由 t 决定画面（固定种子、无计时器、无帧间状态）。
   所有镜头（shot）通过 V.shot({...}) 注册，各自拥有一个 THREE.Group 与该时间段内的相机。 */
(function(){
const V = window.V = {};
V.lib = {};                 // 镜头之间共享的组件（例如 s07 定义的 3D 坐标图，s10 复用）
V.W = 1920; V.H = 1080; V.FPS = 30; V.DURATION = 136;

/* ---------- 配色与字体 ---------- */
V.COL = { gold:'#E8C547', ink:'#EAEAF2', dim:'#9A9AB0', paper:'#EDE4D3', seal:'#B53A2F', night:'#070b1e', blue:'#6FA8FF' };
V.FONT = {
  SANS:  "'Noto Sans SC','Noto Sans CJK SC','PingFang SC','Microsoft YaHei',sans-serif",
  SERIF: "'Noto Serif SC','Noto Serif CJK SC','Songti SC',serif",
  GARA:  "'EB Garamond',Georgia,serif",
  MATH:  "'FreeSerif','STIX Two Math','Cambria Math','Times New Roman',serif",
};
/* 星月夜调色板（sRGB 十六进制） */
V.PAL = {
  deep:  ['#102454','#183a78','#22508f','#2c5ea3','#1a3070'],
  mid:   ['#4a78b8','#5a86c2','#7ea6d4'],
  pale:  ['#a8c4dc','#cfe0e6','#bcd2dc'],
  yel:   ['#f4d34a','#f7e27a','#e8b830'],
  cream: ['#fbeeb0','#fdf6d8','#e6e2b8'],
  teal:  ['#9cc3c9','#86b5bf'],
  moon:  ['#f0b833','#f5c95a','#fbe08a'],
  cypress: ['#1f2e22','#2f4130','#46553a','#5e5a3a','#2a3a4a','#3e4f2e','#162019'],
};

/* ---------- 数学工具 ---------- */
V.clamp = (x,a,b)=>Math.max(a,Math.min(b,x));
V.lerp  = (a,b,t)=>a+(b-a)*t;
V.easeInOut = t => t<.5 ? 2*t*t : 1-((-2*t+2)**2)/2;
V.easeOut = t => 1-(1-t)**3;
V.easeIn  = t => t*t*t;
V.smooth  = t => t*t*(3-2*t);
V.P = (t,a,b) => V.clamp((t-a)/(b-a),0,1);                 // 线性进度
V.E = (t,a,b) => V.easeInOut(V.P(t,a,b));                   // 缓动进度
V.vis = (t,a,b,fi=.6,fo=.6) => (t<a||t>b) ? 0 : Math.min(V.E(t,a,a+fi), 1-V.E(t,b-fo,b));
V.rng = function(seed){ return function(){ let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ t>>>15, t|1); t ^= t + Math.imul(t ^ t>>>7, t|61);
  return ((t ^ t>>>14)>>>0)/4294967296; }; };
V.hex = h => { const n = parseInt(h.slice(1),16); return [(n>>16&255)/255, (n>>8&255)/255, (n&255)/255]; };
V.v3 = (x,y,z) => new THREE.Vector3(x,y,z);
/* 关键帧插值：keys = [[t0, v0], [t1, v1], ...]，v 可为数字或数组/Vector3；段间 easeInOut */
V.keys = function(t, keys, ease=V.easeInOut){
  if (t <= keys[0][0]) return clone(keys[0][1]);
  for (let i=0;i<keys.length-1;i++){
    const [ta,va] = keys[i], [tb,vb] = keys[i+1];
    if (t <= tb){ const k = ease((t-ta)/(tb-ta)); return mix(va,vb,k); }
  }
  return clone(keys[keys.length-1][1]);
  function clone(v){ return v.isVector3 ? v.clone() : Array.isArray(v) ? v.slice() : v; }
  function mix(a,b,k){
    if (a.isVector3) return a.clone().lerp(b,k);
    if (Array.isArray(a)) return a.map((x,i)=>V.lerp(x,b[i],k));
    return V.lerp(a,b,k);
  }
};
/* 速度连续的时间关键帧插值（三次 Hermite + Catmull-Rom 切线）：keys = [[t, [x,y,z,...]], ...]，返回数组 */
V.keysSmooth = function(t, K){
  const n = K.length;
  if (t <= K[0][0]) return K[0][1].slice();
  if (t >= K[n-1][0]) return K[n-1][1].slice();
  let i = 0; while (t > K[i+1][0]) i++;
  const [t0, p0] = K[i], [t1, p1] = K[i+1], dt = t1 - t0, s = (t - t0)/dt;
  const tan = j => { const a = K[Math.max(0, j-1)], b = K[Math.min(n-1, j+1)]; return a[1].map((v, k) => (b[1][k] - v)/(b[0] - a[0])); };
  const m0 = tan(i), m1 = tan(i+1), s2 = s*s, s3 = s2*s;
  const h00 = 2*s3 - 3*s2 + 1, h10 = s3 - 2*s2 + s, h01 = -2*s3 + 3*s2, h11 = s3 - s2;
  return p0.map((v, k) => h00*v + h10*dt*m0[k] + h01*p1[k] + h11*dt*m1[k]);
};
/* 平滑样条：points 为 Vector3 数组，返回 u∈[0,1] → Vector3 */
V.spline = function(points, tension=0.5){
  const c = new THREE.CatmullRomCurve3(points, false, 'catmullrom', tension);
  return u => c.getPoint(V.clamp(u,0,1));
};

/* ---------- 渲染器 ---------- */
const glCanvas = document.getElementById('gl');
V.renderer = new THREE.WebGLRenderer({canvas: glCanvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
V.PR = parseFloat(new URLSearchParams(location.search).get('pr') || '1');   // ?pr=0.5 → 半分辨率快速预览版
V.renderer.setPixelRatio(V.PR);
V.renderer.setSize(V.W, V.H, false);
V.renderer.setClearColor(0x070b1e, 1);
V.scene = new THREE.Scene();
V.camera = new THREE.PerspectiveCamera(50, V.W/V.H, 0.1, 6000);
V.DEFAULT_FOG = () => new THREE.Fog(0x0b1433, 260, 1400);

/* 设置相机：世界坐标 pos / target，fov（度），roll（弧度） */
V.setCam = function(pos, target, fov=50, roll=0){
  const c = V.camera;
  c.position.copy(pos); c.up.set(0,1,0); c.lookAt(target);
  if (roll) c.rotateZ(roll);
  if (c.fov !== fov){ c.fov = fov; c.updateProjectionMatrix(); }
};

/* ---------- 通用笔触系统（CPU 驱动，相机朝向的带状笔触） ----------
   new V.Strokes(n, {additive, shape:'brush'|'glow'|'dot', opacity})
   s.set(i, x,y,z, dx,dy,dz, len, wid, [r,g,b], a)  —— 局部坐标（随所在 Group 变换）
   s.commit()  每帧设置完调用一次 */
const STROKE_VS = `
attribute vec3 iPos; attribute vec3 iDir; attribute vec2 iSize; attribute vec4 iCol;
varying vec2 vUv; varying vec4 vCol; varying float vSeed;
void main(){
  vec3 wp = (modelMatrix * vec4(iPos,1.0)).xyz;
  vec3 wd = normalize(mat3(modelMatrix) * iDir + vec3(1e-7));
  vec3 toCam = normalize(cameraPosition - wp);
  vec3 sd = cross(wd, toCam);
  sd = length(sd) < 1e-4 ? vec3(0.0,1.0,0.0) : normalize(sd);
  vec3 p = wp + wd*position.x*iSize.x + sd*position.y*iSize.y;
  vUv = uv; vCol = iCol;
  vSeed = fract(sin(dot(iPos.xyz, vec3(12.9898,78.233,37.719)))*43758.5453);
  gl_Position = projectionMatrix * viewMatrix * vec4(p,1.0);
}`;
const STROKE_FS = `
uniform float uOpacity; uniform float uShape;
varying vec2 vUv; varying vec4 vCol; varying float vSeed;
void main(){
  if (vCol.a < 0.003) discard;
  vec3 c = vCol.rgb; float a;
  if (uShape > 0.5) {               // glow / dot：圆形
    float r = length(vUv-0.5)*2.0;
    a = uShape > 1.5 ? smoothstep(1.0, 0.7, r) : pow(max(0.0, 1.0-r), 2.0);
  } else {                          // brush：两端收尖 + 刷毛纹理
    float x = vUv.x, y = vUv.y;
    float ends = smoothstep(0.0, 0.14+0.08*vSeed, x) * smoothstep(1.0, 0.80-0.08*vSeed, x);
    float sides = smoothstep(0.0, 0.24, y) * smoothstep(1.0, 0.76, y);
    float bristle = 0.84 + 0.16*sin(y*37.0 + vSeed*21.0)*sin(y*13.0 + x*3.0 + vSeed*7.0);
    a = ends*sides;
    c *= bristle * (0.92 + 0.16*x);
  }
  gl_FragColor = vec4(c, a*vCol.a*uOpacity);
  if (gl_FragColor.a < 0.004) discard;
}`;
V.Strokes = class {
  constructor(n, o={}){
    const base = new THREE.PlaneGeometry(1,1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('uv', base.attributes.uv);
    this.n = n;
    this.pos = new Float32Array(n*3); this.dir = new Float32Array(n*3).fill(0); this.size = new Float32Array(n*2); this.col = new Float32Array(n*4);
    for (let i=0;i<n;i++) this.dir[i*3+1] = 1;
    g.setAttribute('iPos',  new THREE.InstancedBufferAttribute(this.pos, 3));
    g.setAttribute('iDir',  new THREE.InstancedBufferAttribute(this.dir, 3));
    g.setAttribute('iSize', new THREE.InstancedBufferAttribute(this.size, 2));
    g.setAttribute('iCol',  new THREE.InstancedBufferAttribute(this.col, 4));
    g.instanceCount = n;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: STROKE_VS, fragmentShader: STROKE_FS,
      uniforms: { uOpacity: {value: o.opacity ?? 1}, uShape: {value: o.shape==='glow' ? 1 : o.shape==='dot' ? 2 : 0} },
      transparent: true, depthWrite: false, depthTest: o.depthTest ?? true,
      blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide,
    });
    this.geo = g;
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false;
    if (o.renderOrder) this.mesh.renderOrder = o.renderOrder;
  }
  set(i, x,y,z, dx,dy,dz, len, wid, rgb, a=1){
    const p=i*3, q=i*2, r=i*4;
    this.pos[p]=x; this.pos[p+1]=y; this.pos[p+2]=z;
    this.dir[p]=dx; this.dir[p+1]=dy; this.dir[p+2]=dz;
    this.size[q]=len; this.size[q+1]=wid;
    this.col[r]=rgb[0]; this.col[r+1]=rgb[1]; this.col[r+2]=rgb[2]; this.col[r+3]=a;
  }
  hide(i){ this.col[i*4+3] = 0; }
  hideAll(){ for (let i=0;i<this.n;i++) this.col[i*4+3] = 0; }
  set opacity(v){ this.mat.uniforms.uOpacity.value = v; }
  commit(){ for (const k of ['iPos','iDir','iSize','iCol']) this.geo.attributes[k].needsUpdate = true; }
};

/* ---------- GPU 动画的漩涡天空笔触（世界天空与背景天幕共用） ----------
   每个实例：type 0 = 绕中心旋转；type 1 = 沿切向流动（带波浪、两端淡出）
   uniform：uPhase（时间相位），uReveal（出现比例），uOpacity */
const SKY_VS = `
attribute vec3 iC; attribute vec3 iE1; attribute vec3 iE2; attribute vec4 iP; attribute vec4 iS; attribute vec3 iCol;
uniform float uPhase; uniform float uReveal;
varying vec2 vUv; varying vec4 vCol; varying float vSeed;
void main(){
  vec3 pos; vec3 dir; float fade = 1.0;
  if (iP.w < 0.5) {
    float a = iP.y + iP.z*uPhase;
    pos = iC + (cos(a)*iE1 + sin(a)*iE2)*iP.x;
    dir = -sin(a)*iE1 + cos(a)*iE2;
  } else {
    float L = iP.x;
    float s = mod(iP.z*uPhase + iP.y, L);
    float f = s / L;
    fade = sin(3.14159*f);
    float k = 6.2832*2.0 / L;
    pos = iC + iE1*(s - 0.5*L) + iE2*iS.w*sin(k*s + iP.y);
    dir = normalize(iE1 + iE2*iS.w*k*cos(k*s + iP.y));
  }
  vec3 wp = (modelMatrix * vec4(pos,1.0)).xyz;
  vec3 wd = normalize(mat3(modelMatrix) * dir + vec3(1e-7));
  vec3 toCam = normalize(cameraPosition - wp);
  vec3 sd = cross(wd, toCam);
  sd = length(sd) < 1e-4 ? vec3(0.0,1.0,0.0) : normalize(sd);
  vec3 p = wp + wd*position.x*iS.x + sd*position.y*iS.y;
  vUv = uv;
  float show = iS.z <= uReveal ? 1.0 : 0.0;
  vCol = vec4(iCol, show*fade);
  vSeed = fract(sin(dot(iC.xy + iP.yz, vec2(12.9898,78.233)))*43758.5453);
  gl_Position = projectionMatrix * viewMatrix * vec4(p,1.0);
}`;
V.SkyStrokes = class {
  /* items: [{type, C:[x,y,z], E1:[..], E2:[..], d|L, a0|ph, w|speed, len, wid, key, amp, col:'#hex'}] */
  constructor(items, o={}){
    const n = items.length;
    const base = new THREE.PlaneGeometry(1,1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('uv', base.attributes.uv);
    const C = new Float32Array(n*3), E1 = new Float32Array(n*3), E2 = new Float32Array(n*3), Pp = new Float32Array(n*4), S = new Float32Array(n*4), Col = new Float32Array(n*3);
    items.forEach((it,i)=>{
      C.set(it.C, i*3); E1.set(it.E1, i*3); E2.set(it.E2, i*3);
      Pp.set(it.type===0 ? [it.d, it.a0, it.w, 0] : [it.L, it.ph, it.speed, 1], i*4);
      S.set([it.len, it.wid, it.key, it.amp||0], i*4);
      Col.set(V.hex(it.col), i*3);
    });
    g.setAttribute('iC', new THREE.InstancedBufferAttribute(C,3));
    g.setAttribute('iE1', new THREE.InstancedBufferAttribute(E1,3));
    g.setAttribute('iE2', new THREE.InstancedBufferAttribute(E2,3));
    g.setAttribute('iP', new THREE.InstancedBufferAttribute(Pp,4));
    g.setAttribute('iS', new THREE.InstancedBufferAttribute(S,4));
    g.setAttribute('iCol', new THREE.InstancedBufferAttribute(Col,3));
    g.instanceCount = n;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: SKY_VS, fragmentShader: STROKE_FS,
      uniforms: { uPhase:{value:0}, uReveal:{value:1}, uOpacity:{value:o.opacity ?? 1}, uShape:{value:0} },
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false;
    if (o.renderOrder !== undefined) this.mesh.renderOrder = o.renderOrder;
  }
  set phase(v){ this.mat.uniforms.uPhase.value = v; }
  set reveal(v){ this.mat.uniforms.uReveal.value = v; }
  set opacity(v){ this.mat.uniforms.uOpacity.value = v; }
};

/* ---------- 2D 绘图工具（用于 Canvas 贴图：纸张、文字、印章） ---------- */
V.txt = function(c, s, x, y, font, color, align='center', alpha=1, base='middle'){
  if (alpha<=0) return;
  c.save(); c.globalAlpha *= alpha; c.font = font; c.fillStyle = color;
  c.textAlign = align; c.textBaseline = base; c.fillText(s, x, y); c.restore();
};
V.roundRect = function(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y);
  c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); };
/* 做旧米白纸（铺满整张画布） */
V.drawPaper = function(c, W, H){
  c.fillStyle = V.COL.paper; c.fillRect(0,0,W,H);
  const g = c.createRadialGradient(W/2,H/2,Math.min(W,H)*0.2, W/2,H/2,Math.max(W,H)*0.75);
  g.addColorStop(0,'rgba(120,90,40,0)'); g.addColorStop(1,'rgba(120,90,40,.22)');
  c.fillStyle = g; c.fillRect(0,0,W,H);
  const r = V.rng(W*7+H);
  c.fillStyle = 'rgba(90,70,40,.05)';
  for (let i=0;i<260;i++) c.fillRect(r()*W, r()*H, 1+r()*3, 1+r()*3);
  c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 2; c.strokeRect(14,14,W-28,H-28);
};
V.drawSeal = function(c, x, y, text, k=1, size=30){
  if (k<=0) return;
  c.save(); c.translate(x, y); c.rotate(-0.08); const s = V.lerp(1.6,1,V.easeOut(k)); c.scale(s,s);
  c.globalAlpha *= k;
  c.font = `700 ${size}px ${V.FONT.SERIF}`; const w = c.measureText(text).width + size*0.8;
  c.strokeStyle = V.COL.seal; c.lineWidth = size/10; c.strokeRect(-w/2, -size*0.8, w, size*1.6);
  c.fillStyle = V.COL.seal; c.textAlign='center'; c.textBaseline='middle'; c.fillText(text, 0, 1);
  c.restore();
};

/* ---------- Canvas 贴图卡片 ----------
   V.card({w, h, px, draw:(c, W, H, t)=>{}, transparent, doubleSide})
   返回 {mesh, redraw(t)}。mesh 为 w×h（世界单位）的平面，正面朝 +z。 */
V.card = function(o){
  const px = o.px || 1024, W = px, H = Math.round(px * o.h / o.w);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d', {willReadFrequently: true});   // 强制软件光栅：避免 Chrome 按重绘历史切换 GPU/CPU 路径导致同一 t 像素不一致
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({map: tex, transparent: true, side: o.doubleSide === false ? THREE.FrontSide : THREE.DoubleSide, depthWrite: o.depthWrite ?? true, fog: o.fog ?? false});
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.h), mat);
  const api = { mesh, canvas: cv, ctx: c, W, H, tex,
    redraw(t){ c.clearRect(0,0,W,H); o.draw(c, W, H, t); tex.needsUpdate = true; },
    set opacity(v){ mat.opacity = v; mesh.visible = v > 0.002; } };
  api.redraw(0);
  return api;
};

/* ---------- 镜头注册与帧循环 ----------
   V.shot({ id, start, end, origin:[x,y,z], useWorld:false, backdrop:true,
            build(ctx){...}, update(t, lt, ctx){...} })
   ctx: { group, origin(Vector3), cam(posLocal, targetLocal, fov, roll), local(x,y,z)→world Vector3, state:{} } */
V.shots = [];
V.shot = def => V.shots.push(def);
V.hooks = { pre: [], post: [] };     // 世界 / 背景天幕 / 覆盖层挂载点

let built = false;
function buildAll(){
  if (built) return; built = true;
  V.shots.sort((a,b)=>a.start-b.start);
  for (const s of V.shots){
    const group = new THREE.Group();
    const o = s.origin || [0,0,0];
    group.position.set(o[0],o[1],o[2]);
    V.scene.add(group);
    const origin = group.position.clone();
    s.ctx = { group, origin, state: {},
      local: (x,y,z) => new THREE.Vector3(x,y,z).add(origin),
      cam: (p, tgt, fov=50, roll=0) => V.setCam(p.clone().add(origin), tgt.clone().add(origin), fov, roll) };
    try { s.build && s.build(s.ctx); } catch(e){ console.error('[build ' + s.id + ']', e); s.broken = true; }
  }
}
V.activeShot = t => { let a = null; for (const s of V.shots) if (t >= s.start && t < s.end) a = s; return a; };

/* ---------- 镜头间过渡：前后两个镜头各渲染到离屏纹理，再用着色器融合（不是遮挡） ----------
   V.TRANS = { 切点秒: [类型, 时长, 中心偏移] }：以 切点+偏移 为中心、前后各半个时长内同时渲染两个镜头。
   原则：融合贯穿整个时长（不在中间一下子切换）；边缘全部柔化、不加描边；两个镜头在转场里都保持运动（见 coast）。 */
V.TRANS = {
  15.4: ['zoomthru', 1.2, -0.3],   // 冲进漩涡 → 漩涡隧道：继续向前冲，径向拖影交接
  20:   ['glow', 2.0],             // 隧道 → 病房：烛光和窗光先亮起来，房间再慢慢浮现
  34:   ['flow', 1.8],             // 窗外星空 → 小诗：两个画面顺着一股旋流流过去
  46:   ['iris', 1.6],             // 冲进大漩涡 → 能量级联：从漩涡中心柔和地晕开
  54:   ['paintwipe', 1.6],        // 级联 → 柯尔莫哥洛夫：一笔宽刷从左扫到右
  62:   ['dissolve', 1.6],         // 柱状图 → −5/3 直线：柔焦叠化
  71:   ['pan', 1.6],              // 频谱 → 2006 论文：镜头横移到下一块画板
  83:   ['leak', 1.8],             // 自画像 → 2024 论文：一束暖光扫过
  91:   ['whip', 1.0],             // 量漩涡 → 算频谱：甩镜
  114:  ['ink', 1.8],              // 颜料混合 → 纳维-斯托克斯：水彩晕染
  121:  ['defocus', 1.8],          // 百万美元 → 回到星空：跑焦
};
const TR_TYPES = ['zoomthru','glow','flow','iris','paintwipe','dissolve','pan','leak','whip','ink','defocus'];
/* 调色：暗部和中间调提亮、高光基本不动（y = c + a·c·(1−c)²），饱和度 ×1.08；a 按镜头设，越暗的镜头提得越多 */
V.LIFT = { s01a: 1.0, s01b: 1.2, s03: 1.3, s04: 1.2, s05: 1.8, s06: 1.8, s07: 2.0, s08: 1.4, s09: 1.0, s10: 1.8, s11: 1.6, s12: 1.2 };
const liftOf = s => (s && V.LIFT[s.id] != null) ? V.LIFT[s.id] : 1.2;
const rtOpts = { depthBuffer: true, samples: 4 };    // 4× 多重采样，与直接上屏的抗锯齿一致
let rtA = null, rtB = null, trScene = null, trCam = null, trMat = null;
function initTransition(){
  const w = Math.round(V.W*V.PR), h = Math.round(V.H*V.PR);
  rtA = new THREE.WebGLRenderTarget(w, h, rtOpts); rtB = new THREE.WebGLRenderTarget(w, h, rtOpts);
  rtA.texture.colorSpace = rtB.texture.colorSpace = THREE.SRGBColorSpace;   // 与直接上屏一致的色彩空间
  trCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  trMat = new THREE.ShaderMaterial({
    uniforms: { uA:{value:null}, uB:{value:null}, uP:{value:0}, uType:{value:0}, uT:{value:0}, uAspect:{value:V.W/V.H}, uLA:{value:1}, uLB:{value:1} },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      uniform sampler2D uA, uB; uniform float uP, uT, uAspect, uLA, uLB; uniform int uType; varying vec2 vUv;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i=0;i<5;i++){ s += a*vn(p); p *= 2.03; a *= 0.5; } return s; }
      float fbm3(vec2 p){ float a = 0.5, s = 0.0; for (int i=0;i<3;i++){ s += a*vn(p); p *= 2.03; a *= 0.5; } return s/0.875; }
      vec2 mir(vec2 uv){ return 1.0 - abs(1.0 - mod(uv, 2.0)); }       // 镜像取样：画面平移出界时不会出现拉长的边缘
      vec4 tx(sampler2D s, vec2 uv){ return texture2D(s, mir(uv)); }
      vec2 zm(vec2 uv, float z, vec2 c){ return c + (uv - c)/z; }       // z > 1：放大（推近）
      vec4 radial(sampler2D s, vec2 uv, vec2 c, float k){ vec4 a = vec4(0.0); for (int i=0;i<12;i++) a += tx(s, c + (uv - c)*(1.0 - k*float(i)/11.0)); return a/12.0; }
      vec4 dirb(sampler2D s, vec2 uv, vec2 d){ vec4 a = vec4(0.0); for (int i=-6;i<=6;i++) a += tx(s, uv + d*float(i)/6.0); return a/13.0; }
      vec4 disc(sampler2D s, vec2 uv, float r){ vec4 a = tx(s, uv);
        for (int i=1;i<24;i++){ float f = float(i), rr = sqrt(f/23.0)*r, an = f*2.39996; a += tx(s, uv + vec2(cos(an)/uAspect, sin(an))*rr); } return a/24.0; }
      vec3 grade(vec3 c, float a){ vec3 y = c + a*c*(1.0 - c)*(1.0 - c); float L = dot(y, vec3(0.2126, 0.7152, 0.0722));
        return clamp(vec3(L) + (y - L)*1.08, 0.0, 1.0); }
      void main(){
        vec2 uv = vUv, c = vec2(0.5); float p = uP, bell = sin(3.14159*p), lift = mix(uLA, uLB, p);
        vec2 q = (uv - c)*vec2(uAspect, 1.0);
        vec4 A, B; float m;
        if (uType < 0){             // 非转场：原样输出 + 调色（所有帧走同一条管线，进出转场时画质不跳变）
          gl_FragColor = vec4(grade(texture2D(uA, uv).rgb, uLA), 1.0); return;
        } else if (uType == 0){     // zoomthru：前一镜继续向前冲、径向拖影渐强；后一镜的拖影渐弱
          A = radial(uA, zm(uv, 1.0 + 0.55*p*p, c), c, 0.10*p); B = radial(uB, uv, c, 0.07*(1.0 - p));
          m = smoothstep(0.15, 0.85, p);
        } else if (uType == 1){     // glow：后一镜里亮的地方（烛光、窗光）先浮现，带一点柔和的暖色光晕
          A = tx(uA, uv); B = tx(uB, uv);
          float lb = dot(disc(uB, uv, 0.02).rgb, vec3(0.3, 0.59, 0.11));
          m = clamp((p - 0.5)*1.7 + 0.5 + (lb - 0.3)*0.9*bell, 0.0, 1.0); m = m*m*(3.0 - 2.0*m);
          vec3 bloom = max(disc(uB, uv, 0.05).rgb - 0.35, 0.0)*vec3(1.0, 0.82, 0.6)*bell*0.8;
          gl_FragColor = vec4(grade(mix(A.rgb, B.rgb, m) + bloom, lift), 1.0); return;
        } else if (uType == 2){     // flow：两个画面被同一股平滑的旋流（无散度）带着流动，同时叠化
          vec2 s = q*2.0 + vec2(0.0, uT*0.15); float e = 0.02, n0 = fbm3(s);
          vec2 curl = vec2(fbm3(s + vec2(0.0, e)) - n0, -(fbm3(s + vec2(e, 0.0)) - n0))/e;
          vec2 d = curl*0.012*bell/vec2(uAspect, 1.0);
          A = tx(uA, uv + d*(0.4 + p)); B = tx(uB, uv - d*(1.4 - p));
          m = smoothstep(0.2, 0.8, p);
        } else if (uType == 3){     // iris：从漩涡中心向外柔和地晕开（边缘有一点笔触的参差），前一镜同时推近
          vec2 o0 = vec2(0.45, 0.55), o = (uv - o0)*vec2(uAspect, 1.0); float d = length(o);
          float n = (fbm(vec2(atan(o.y, o.x)*2.0, d*3.0 - uT*0.3)) - 0.5)*0.18;
          float R = mix(-0.35, 1.6, p); m = 1.0 - smoothstep(R - 0.22, R + 0.22, d + n);
          A = radial(uA, zm(uv, 1.0 + 0.18*p, o0), o0, 0.04*p); B = tx(uB, uv);
        } else if (uType == 4){     // paintwipe：一笔宽刷从左扫到右，刷痕边缘柔和；画面随之微微横移（像镜头向右摇）
          float n = (fbm(vec2(uv.y*7.0, uv.x*1.2 + 2.0)) - 0.5)*0.16, e = mix(-0.25, 1.25, p);
          m = 1.0 - smoothstep(e - 0.1, e + 0.1, uv.x + n);
          A = tx(uA, zm(uv, 1.0 + 0.03*p, c) + vec2(0.012*p, 0.0)); B = tx(uB, zm(uv, 1.03 - 0.03*p, c) - vec2(0.012*(1.0 - p), 0.0));
        } else if (uType == 5){     // dissolve：柔焦叠化
          A = disc(uA, uv, 0.004*bell); B = disc(uB, uv, 0.004*bell); m = smoothstep(0.1, 0.9, p);
        } else if (uType == 6){     // pan：前一镜向左移出、后一镜从右侧移入，中段叠化，带一点横向动态模糊
          vec2 bl = vec2(0.012*bell, 0.0);
          A = dirb(uA, uv + vec2(0.10*p, 0.0), bl); B = dirb(uB, uv - vec2(0.10*(1.0 - p), 0.0), bl); m = smoothstep(0.25, 0.75, p);
        } else if (uType == 7){     // leak：一束柔和的暖光从左往右扫过，叠化在光最亮时完成（滤色叠加，不会过曝成死白）
          A = tx(uA, uv); B = tx(uB, uv); m = smoothstep(0.25, 0.75, p);
          vec2 o = vec2(uv.x - mix(-0.3, 1.3, p), (uv.y - 0.6)*0.6);
          vec3 L = vec3(1.0, 0.74, 0.42)*(exp(-dot(o, o)*5.0)*0.45 + 0.08)*bell;
          gl_FragColor = vec4(grade(1.0 - (1.0 - mix(A.rgb, B.rgb, m))*(1.0 - L), lift), 1.0); return;
        } else if (uType == 8){     // whip：画面向左加速甩出、后一镜减速甩入，两者在切点处速度相同，模糊在切点最强
          float bl = 0.10*pow(bell, 1.5);
          A = dirb(uA, uv + vec2(0.45*p*p, 0.0), vec2(bl, 0.0)); B = dirb(uB, uv - vec2(0.45*(1.0 - p)*(1.0 - p), 0.0), vec2(bl, 0.0));
          m = smoothstep(0.35, 0.65, p);
        } else if (uType == 9){     // ink：后一镜像颜料在湿纸上一团团化开，边缘柔、略带水痕的流动
          float n = fbm(q*1.6 + 11.0)*0.85 + fbm(q*5.0 - 3.0)*0.15;
          m = smoothstep(n - 0.14, n + 0.14, mix(-0.15, 1.15, p));
          vec2 w = (vec2(fbm(q*3.0 + 5.0), fbm(q*3.0 + 9.0)) - 0.5)*0.03*(4.0*m*(1.0 - m));
          A = tx(uA, uv + w); B = tx(uB, uv - w);
        } else {                    // defocus：前一镜失焦、后一镜从虚到实
          A = disc(uA, uv, 0.012*smoothstep(0.0, 0.6, p)); B = disc(uB, uv, 0.012*(1.0 - smoothstep(0.4, 1.0, p)));
          m = smoothstep(0.3, 0.7, p);
        }
        gl_FragColor = vec4(grade(mix(A, B, m).rgb, lift), 1.0);
      }`,
    depthTest: false, depthWrite: false,
  });
  trScene = new THREE.Scene();
  trScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), trMat));
}
/* 镜头在自己的时间段之外被渲染时（转场的前后半段），相机顺着边界处的速度继续滑行、逐渐减速，
   不会在切点前后突然定住、或从静止突然起步。镜头自己在段外仍在运动的（例如隧道）不干预。 */
const TAIL = 0.6, H1 = 1/30;
function camPose(act, t){ act.update(t, t - act.start, act.ctx); const c = V.camera; return [c.position.clone(), c.quaternion.clone(), c.fov]; }
function coast(act, t){
  const out = t >= act.end ? 1 : t < act.start ? -1 : 0;
  if (!out) return null;
  const te = out > 0 ? act.end - 1e-4 : act.start;
  const [p0, q0, f0] = camPose(act, te), [p1, q1, f1] = camPose(act, te - out*H1), [p2, q2] = camPose(act, te + out*H1);
  if (p0.distanceTo(p2) > 0.5*p0.distanceTo(p1) + 1e-5 || q0.angleTo(q2) > 0.5*q0.angleTo(q1) + 1e-6) return null;
  const k = TAIL*(1 - Math.exp(-Math.abs(t - te)/TAIL))/H1;     // 滑行量 = 边界处每帧的运动 × k
  const pos = p0.clone().add(p0.clone().sub(p1).multiplyScalar(k));
  const dq = q0.clone().multiply(q1.clone().invert()), sgn = dq.w < 0 ? -1 : 1, sw = Math.sqrt(Math.max(0, 1 - dq.w*dq.w));
  const quat = q0.clone();
  if (sw > 1e-7) quat.premultiply(new THREE.Quaternion().setFromAxisAngle(V.v3(dq.x*sgn/sw, dq.y*sgn/sw, dq.z*sgn/sw), 2*Math.acos(Math.min(1, Math.abs(dq.w)))*k));
  return [pos, quat, f0 + (f0 - f1)*k];
}
V._coast = coast;      // 调试用
const CLEAR_RT = new THREE.Color().setRGB(7/255, 11/255, 30/255, THREE.LinearSRGBColorSpace);   // 离屏纹理不做色彩转换，直接写入 sRGB 数值
function renderShot(act, t, target){
  V.scene.fog = V.DEFAULT_FOG();
  if (target) V.renderer.setClearColor(CLEAR_RT, 1); else V.renderer.setClearColor(0x070b1e, 1);
  for (const h of V.hooks.pre) h(t, act);
  for (const s of V.shots) s.ctx.group.visible = (s === act);
  if (act && !act.broken){
    try {
      const cst = coast(act, t);
      act.update(t, t - act.start, act.ctx);
      if (cst){ const c = V.camera; c.position.copy(cst[0]); c.quaternion.copy(cst[1]); c.fov = cst[2]; c.updateProjectionMatrix(); }
    }
    catch(e){ console.error('[update ' + act.id + ' @' + t.toFixed(2) + ']', e); }
  }
  if (window.__camOverride) window.__camOverride(V.camera, act);     // 调试用：覆盖机位（正式渲染不会设置）
  for (const h of V.hooks.post) h(t, act);
  V.renderer.setRenderTarget(target);
  V.renderer.render(V.scene, V.camera);
}
/* 调试探针：只跑镜头 update 得到相机位姿，不渲染（用来分析运镜是否顿挫） */
window.probeCam = function(t){
  buildAll();
  const act = V.activeShot(t);
  for (const h of V.hooks.pre) h(t, act);
  if (act && !act.broken){ try { act.update(t, t - act.start, act.ctx); } catch(e){} }
  const c = V.camera, q = c.quaternion;
  return [act ? act.id : '', c.position.x, c.position.y, c.position.z, q.x, q.y, q.z, q.w, c.fov];
};
V.activeTransition = t => { for (const c in V.TRANS){ const [ty, d, sh = 0] = V.TRANS[c]; if (Math.abs(t - c - sh) < d/2) return { c: +c, ty, d, t0: +c + sh - d/2 }; } return null; };
window.render = function(t){
  buildAll();
  const tr = V.activeTransition(t);
  let act;
  if (!rtA) initTransition();
  if (!tr){
    act = V.activeShot(t);
    renderShot(act, t, rtA);
    trMat.uniforms.uA.value = rtA.texture; trMat.uniforms.uB.value = rtA.texture;
    trMat.uniforms.uP.value = 0; trMat.uniforms.uType.value = -1; trMat.uniforms.uLA.value = trMat.uniforms.uLB.value = liftOf(act);
    V.renderer.setRenderTarget(null);
    V.renderer.render(trScene, trCam);
  } else {
    const a = V.activeShot(tr.c - 1e-3), b = V.activeShot(tr.c);
    renderShot(a, t, rtA);
    renderShot(b, t, rtB);
    const p = V.smooth(V.clamp((t - tr.t0)/tr.d, 0, 1));
    trMat.uniforms.uA.value = rtA.texture; trMat.uniforms.uB.value = rtB.texture;
    trMat.uniforms.uP.value = p; trMat.uniforms.uT.value = t; trMat.uniforms.uType.value = TR_TYPES.indexOf(tr.ty);
    trMat.uniforms.uLA.value = liftOf(a); trMat.uniforms.uLB.value = liftOf(b);
    V.renderer.setRenderTarget(null);
    V.renderer.render(trScene, trCam);
    act = t < tr.c ? a : b;
  }
  V.overlay && V.overlay(t, act);
};
V.preload = V.preload || [];     // 需要异步加载的资源（如图片解码），setup 会等它们全部完成
window.setup = function(done){
  const f = V.FONT;
  const fonts = [`700 46px ${f.SANS}`, `900 64px ${f.SANS}`, `700 40px ${f.SERIF}`, `900 40px ${f.SERIF}`, `italic 28px ${f.GARA}`, `28px ${f.GARA}`, `italic 600 46px ${f.GARA}`, `italic 64px ${f.MATH}`];
  Promise.all([...fonts.map(x => document.fonts.load(x, '星月夜 Turbulence ∂∇ρν')), ...V.preload]).then(() => {
    buildAll();
    for (const s of V.shots) if (s.ctx.refresh) s.ctx.refresh();
    done();
  });
};
})();

/* core.js —《星月夜的湍流》3D 版渲染框架
   约定：window.render(t) 只由 t 决定画面（固定种子、无计时器、无帧间状态）。
   所有镜头（shot）通过 V.shot({...}) 注册，各自拥有一个 THREE.Group 与该时间段内的相机。 */
(function(){
const V = window.V = {};
V.lib = {};                 // 镜头之间共享的组件（例如 s07 定义的 3D 坐标图，s10 复用）
V.W = 1920; V.H = 1080; V.FPS = 30; V.DURATION = 140;

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

window.render = function(t){
  buildAll();
  const act = V.activeShot(t);
  V.scene.fog = V.DEFAULT_FOG();
  V.renderer.setClearColor(0x070b1e, 1);
  for (const h of V.hooks.pre) h(t, act);
  for (const s of V.shots) s.ctx.group.visible = (s === act);
  if (act && !act.broken){
    try { act.update(t, t - act.start, act.ctx); }
    catch(e){ console.error('[update ' + act.id + ' @' + t.toFixed(2) + ']', e); }
  }
  for (const h of V.hooks.post) h(t, act);
  V.renderer.render(V.scene, V.camera);
  V.overlay && V.overlay(t, act);
};
window.setup = function(done){
  const f = V.FONT;
  const fonts = [`700 46px ${f.SANS}`, `900 64px ${f.SANS}`, `700 40px ${f.SERIF}`, `900 40px ${f.SERIF}`, `italic 28px ${f.GARA}`, `28px ${f.GARA}`, `italic 600 46px ${f.GARA}`, `italic 64px ${f.MATH}`];
  Promise.all(fonts.map(x => document.fonts.load(x, '星月夜 Turbulence ∂∇ρν'))).then(() => {
    buildAll();
    for (const s of V.shots) if (s.ctx.refresh) s.ctx.refresh();
    done();
  });
};
})();

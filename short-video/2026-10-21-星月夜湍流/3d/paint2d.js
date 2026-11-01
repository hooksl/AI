/* paint2d.js — 2D 版的程序化绘画工具（来自 v1 平面版），供 3D 镜头做 Canvas 贴图使用。
   V.paint2d.drawStarry(c, t, cx, cy, W, {reveal, alpha})  在 2D 画布上画整幅程序化《星月夜》（画宽 W，画高 0.8W）
   V.paint2d.drawPortrait(c, x, y, w, h, t)                《叼烟斗、缠绷带的自画像》极简剪影
   V.paint2d.drawFit(c, x, y, w, h, k, good, t)             理论分布（金虚线）vs 数据（白线）
   其余：drawVortex / drawChart / drawPaintMacro / drawExampleCard / drawNameplate / drawPaper / drawSeal / txt / roundRect */
(function(){
const CFG = { duration: 140, fps: 30 };
const GOLD = '#E8C547', INK = '#EAEAF2', DIM = '#9A9AB0', PAPER = '#EDE4D3', SEAL = '#B53A2F', SKYBLUE = '#7EA6D4';
const SANS = "'Noto Sans SC','Noto Sans CJK SC','PingFang SC','Microsoft YaHei',sans-serif";
const SERIF = "'Noto Serif SC','Noto Serif CJK SC','Songti SC',serif";
const GARA = "'EB Garamond',Georgia,serif";
const MATH = "'FreeSerif','STIX Two Math','Cambria Math','Times New Roman',serif";
/* ================= 工具函数 ================= */
const clamp = (x,a,b)=>Math.max(a,Math.min(b,x));
const lerp  = (a,b,t)=>a+(b-a)*t;
const easeInOut = t => t<.5 ? 2*t*t : 1-((-2*t+2)**2)/2;
const easeOut = t => 1-(1-t)**3;
const P = (t,a,b) => clamp((t-a)/(b-a),0,1);
const E = (t,a,b) => easeInOut(P(t,a,b));
/* 场景可见度：a 秒淡入，b 秒淡出 */
function vis(t,a,b,fi=.6,fo=.6){ if(t<a||t>b) return 0; return Math.min(E(t,a,a+fi), 1-E(t,b-fo,b)); }
function mulberry32(seed){ return function(){ let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ t>>>15, t|1); t ^= t + Math.imul(t ^ t>>>7, t|61);
  return ((t ^ t>>>14)>>>0)/4294967296; }; }

function txt(c, s, x, y, font, color, align='center', alpha=1, base='middle'){
  if (alpha<=0) return;
  c.save(); c.globalAlpha *= alpha; c.font = font; c.fillStyle = color;
  c.textAlign = align; c.textBaseline = base; c.fillText(s, x, y); c.restore();
}
function roundRect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y);
  c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r);
  c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
/* ================= 程序化《星月夜》 =================
   画布坐标：u ∈ [0,1]，v ∈ [0,0.8]（原作 92.1×73.7 cm）。
   天空由几千个短笔触组成：靠近漩涡/星/月的笔触绕中心旋转，其余沿波浪流动。 */
const FEATURES = [
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
const hz = u => 0.565 + 0.03*Math.sin(u*5+1) + 0.018*Math.sin(u*11+.5);
const CYPRESS = [[0.05,0.82],[0.09,0.62],[0.115,0.46],[0.145,0.30],[0.17,0.15],[0.19,0.025],[0.205,0.11],[0.235,0.28],[0.25,0.44],[0.27,0.60],[0.30,0.82]];
function inPoly(x,y,poly){ let ins=false;
  for (let i=0,j=poly.length-1;i<poly.length;j=i++){
    const [xi,yi]=poly[i],[xj,yj]=poly[j];
    if (((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi)) ins=!ins; }
  return ins; }

const SKY_COLORS = {
  deep:  ['#102454','#183a78','#22508f','#2c5ea3','#1a3070'],
  mid:   ['#4a78b8','#5a86c2','#7ea6d4'],
  pale:  ['#a8c4dc','#cfe0e6','#bcd2dc'],
  yel:   ['#f4d34a','#f7e27a','#e8b830'],
  cream: ['#fbeeb0','#fdf6d8','#e6e2b8'],
  teal:  ['#9cc3c9','#86b5bf'],
  moon:  ['#f0b833','#f5c95a','#fbe08a'],
};
const CY_COLORS = ['#1f2e22','#2f4130','#46553a','#5e5a3a','#2a3a4a','#3e4f2e','#162019'];
const rndP = mulberry32(73692);
const pick = arr => arr[Math.floor(rndP()*arr.length)];
const SKY = [];      // 天空笔触
for (let i=0; i<4200; i++){
  const u = rndP()*1.04-0.02, v = rndP()*0.64;
  if (v > hz(u)+0.01) continue;
  let best=null, bq=1e9;
  for (const f of FEATURES){ const d=Math.hypot(u-f.u, v-f.v), q=d/f.r; if (q<bq){bq=q; best=f;} }
  const p = {k: rndP(), len: 0.010+rndP()*0.008, ph: rndP()*6.28};
  if (bq < 1.7){
    const f = best, q = bq;
    p.type='rot'; p.f=f; p.d=Math.hypot(u-f.u, v-f.v); p.a0=Math.atan2(v-f.v, u-f.u);
    p.w = f.s * (0.10 + 0.22*(1-q/1.7));
    if (f.k==='swirl'){
      p.col = q<.3 ? pick(SKY_COLORS.pale) : q<.55 ? pick(SKY_COLORS.mid) : q<.8 ? pick(SKY_COLORS.cream) : q<1.1 ? pick(SKY_COLORS.mid) : q<1.4 ? pick(SKY_COLORS.pale) : pick(SKY_COLORS.deep);
    } else if (f.k==='moon'){
      p.col = q<.75 ? pick(SKY_COLORS.moon) : q<1.1 ? pick(SKY_COLORS.yel) : q<1.4 ? pick(SKY_COLORS.cream) : pick(SKY_COLORS.mid);
    } else {
      p.col = q<.45 ? pick(SKY_COLORS.cream) : q<.8 ? pick(SKY_COLORS.yel) : q<1.15 ? pick(SKY_COLORS.teal) : q<1.4 ? pick(SKY_COLORS.cream) : pick(SKY_COLORS.mid);
    }
  } else {
    p.type='flow'; p.u0=u; p.v0=v; p.sp = 0.004 + rndP()*0.004;
    const r = rndP();
    p.col = r<.78 ? pick(SKY_COLORS.deep) : r<.94 ? pick(SKY_COLORS.mid) : pick(SKY_COLORS.cream);
  }
  SKY.push(p);
}
const CYP = [];      // 柏树笔触
while (CYP.length < 650){
  const u = 0.04+rndP()*0.27, v = rndP()*0.82;
  if (!inPoly(u,v,CYPRESS)) continue;
  CYP.push({u, v, col: pick(CY_COLORS), len: 0.016+rndP()*0.014, ph: rndP()*6.28});
}
const HILL = [];     // 远山笔触
for (let i=0;i<520;i++){ const u=rndP(); const v=hz(u)+rndP()*0.07;
  HILL.push({u, v, col: pick(['#1c2f63','#2a4480','#3b5a96','#25386e','#6f8fbf']), len: 0.014+rndP()*0.01}); }
const HOUSES = [];   // 村庄
for (let i=0;i<46;i++){ const u=0.27+rndP()*0.7, v=0.645+rndP()*0.14;
  HOUSES.push({u, v, w:0.02+rndP()*0.025, h:0.014+rndP()*0.014, win: rndP()<.7, ph: rndP()*6.28,
    wall: pick(['#2a3b6b','#34446e','#26355e']), roof: pick(['#18223f','#1e2a4d'])}); }
HOUSES.sort((a,b)=>a.v-b.v);
function groupBy(list){ const m=new Map(); for(const p of list){ if(!m.has(p.col)) m.set(p.col,[]); m.get(p.col).push(p);} return [...m.entries()]; }
const SKY_G = groupBy(SKY), CYP_G = groupBy(CYP), HILL_G = groupBy(HILL);

/* 画出整幅画。cx,cy: 画面中心在屏幕上的位置；W: 画宽（像素）。
   o.reveal: 天空笔触出现比例；o.alpha；o.calm: 天空不旋转（窗外平静夜空） */
function drawStarry(c, t, cx, cy, W, o={}){
  const reveal = o.reveal ?? 1, alpha = o.alpha ?? 1;
  if (alpha <= 0) return;
  c.save(); c.globalAlpha = alpha;
  c.translate(cx - W/2, cy - 0.4*W); c.scale(W, W);
  c.beginPath(); c.rect(0,0,1,0.8); c.clip();
  const g = c.createLinearGradient(0,0,0,0.8);
  g.addColorStop(0,'#0e2050'); g.addColorStop(.55,'#1a3570'); g.addColorStop(1,'#0c1636');
  c.fillStyle = g; c.fillRect(0,0,1,0.8);
  c.lineCap = 'round';
  const tt = o.calm ? 0 : t;
  // 天空
  c.lineWidth = 0.0048;
  for (const [col, ps] of SKY_G){
    c.strokeStyle = col; c.beginPath();
    for (const p of ps){
      if (p.k > reveal) continue;
      let x, y, ang;
      if (p.type==='rot'){
        const a = p.a0 + p.w*tt;
        x = p.f.u + Math.cos(a)*p.d; y = p.f.v + Math.sin(a)*p.d;
        ang = a + Math.PI/2;
      } else {
        x = p.u0 + p.sp*tt; x = ((x+0.03)%1.08+1.08)%1.08-0.03;
        const ph = x*12 + p.v0*25 + tt*0.3;
        y = p.v0 + 0.012*Math.sin(ph);
        ang = Math.atan2(0.012*12*Math.cos(ph), 1);
      }
      const dx = Math.cos(ang)*p.len/2, dy = Math.sin(ang)*p.len/2;
      c.moveTo(x-dx, y-dy); c.lineTo(x+dx, y+dy);
    }
    c.stroke();
  }
  // 星核与月亮
  for (const f of FEATURES){
    if (f.k==='swirl') continue;
    const k = clamp((reveal-0.3)/0.5, 0, 1); if (k<=0) continue;
    const pulse = 1 + 0.06*Math.sin(t*1.3 + f.u*20);
    const R = f.r*0.42*pulse;
    const gg = c.createRadialGradient(f.u,f.v,0, f.u,f.v,R*1.8);
    gg.addColorStop(0, f.k==='moon' ? 'rgba(255,236,160,1)' : 'rgba(255,250,225,1)');
    gg.addColorStop(.45, f.k==='moon' ? 'rgba(245,190,60,.95)' : 'rgba(246,220,110,.9)');
    gg.addColorStop(1, 'rgba(246,220,110,0)');
    c.globalAlpha = alpha*k; c.fillStyle = gg;
    c.beginPath(); c.arc(f.u,f.v,R*1.8,0,Math.PI*2); c.fill();
    if (f.k==='moon'){   // 月牙
      c.fillStyle = '#f2b52e'; c.beginPath(); c.arc(f.u,f.v,R*0.9,0,Math.PI*2); c.fill();
      c.fillStyle = 'rgba(150,110,40,.9)'; c.beginPath(); c.arc(f.u+R*0.35,f.v-R*0.2,R*0.72,0,Math.PI*2); c.fill();
    }
  }
  c.globalAlpha = alpha;
  // 远山
  c.fillStyle = '#16264f';
  c.beginPath(); c.moveTo(0,0.8); for(let u=0;u<=1.001;u+=0.02) c.lineTo(u,hz(u)); c.lineTo(1,0.8); c.fill();
  c.lineWidth = 0.005;
  for (const [col, ps] of HILL_G){ c.strokeStyle = col; c.beginPath();
    for (const p of ps){ const ang = Math.atan2(hz(p.u+0.01)-hz(p.u),0.01);
      const dx=Math.cos(ang)*p.len/2, dy=Math.sin(ang)*p.len/2; c.moveTo(p.u-dx,p.v-dy); c.lineTo(p.u+dx,p.v+dy); }
    c.stroke(); }
  // 村庄
  c.fillStyle = '#121d44'; c.fillRect(0,0.63,1,0.2);
  // 教堂尖塔
  c.fillStyle = '#22305e'; c.fillRect(0.555,0.60,0.03,0.08);
  c.beginPath(); c.moveTo(0.555,0.60); c.lineTo(0.57,0.48); c.lineTo(0.585,0.60); c.fill();
  for (const h of HOUSES){
    c.fillStyle = h.wall; c.fillRect(h.u, h.v, h.w, h.h);
    c.fillStyle = h.roof; c.beginPath(); c.moveTo(h.u-0.003,h.v); c.lineTo(h.u+h.w/2,h.v-h.h*0.6); c.lineTo(h.u+h.w+0.003,h.v); c.fill();
    if (h.win){ const fl = 0.75+0.25*Math.sin(t*2+h.ph);
      c.fillStyle = `rgba(242,201,76,${fl})`; c.fillRect(h.u+h.w*0.35, h.v+h.h*0.3, h.w*0.22, h.h*0.35); }
  }
  // 柏树（火焰般向上摆动）
  c.fillStyle = '#111a16'; c.beginPath(); CYPRESS.forEach(([x,y],i)=> i?c.lineTo(x,y):c.moveTo(x,y)); c.fill();
  c.lineWidth = 0.0055;
  for (const [col, ps] of CYP_G){ c.strokeStyle = col; c.beginPath();
    for (const p of ps){ const ang = -Math.PI/2 + 0.35*Math.sin(p.v*18 + p.u*30 + t*1.1 + p.ph*0.2);
      const dx=Math.cos(ang)*p.len/2, dy=Math.sin(ang)*p.len/2; c.moveTo(p.u-dx,p.v-dy); c.lineTo(p.u+dx,p.v+dy); }
    c.stroke(); }
  c.restore();
}
/* 画中坐标 → 屏幕坐标 */
const toScr = (u,v,cx,cy,W) => [cx + (u-0.5)*W, cy + (v-0.4)*W];
/* ================= 母题库 ================= */
function drawPaper(c, x, y, w, h, rot){
  c.save(); c.translate(x, y); c.rotate(rot);
  c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 30; c.shadowOffsetY = 10;
  c.fillStyle = PAPER; roundRect(c, -w/2, -h/2, w, h, 6); c.fill();
  c.shadowColor = 'transparent';
  const g = c.createRadialGradient(0,0,w*0.2, 0,0,w*0.75);
  g.addColorStop(0,'rgba(120,90,40,0)'); g.addColorStop(1,'rgba(120,90,40,.18)');
  c.fillStyle = g; roundRect(c, -w/2, -h/2, w, h, 6); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.10)'; c.lineWidth = 1; roundRect(c, -w/2+10, -h/2+10, w-20, h-20, 4); c.stroke();
  c.restore();
}
function drawSeal(c, x, y, text, k){
  if (k<=0) return;
  c.save(); c.translate(x, y); c.rotate(-0.08); const s = lerp(1.6,1,easeOut(k)); c.scale(s,s);
  c.globalAlpha *= k;
  c.font = `700 30px ${SERIF}`; const w = c.measureText(text).width + 24;
  c.strokeStyle = SEAL; c.lineWidth = 3; c.strokeRect(-w/2, -24, w, 48);
  c.fillStyle = SEAL; c.textAlign='center'; c.textBaseline='middle'; c.fillText(text, 0, 1);
  c.restore();
}
function drawNameplate(c, x, y, zh, en, years, k){
  if (k<=0) return;
  c.save(); c.globalAlpha *= k; c.translate(x, y + (1-easeOut(k))*20);
  c.strokeStyle = 'rgba(232,197,71,.7)'; c.lineWidth = 1.5;
  c.strokeRect(-190, -62, 380, 124);
  txt(c, zh, 0, -22, `700 40px ${SERIF}`, INK);
  txt(c, en, 0, 18, `italic 26px ${GARA}`, DIM);
  txt(c, years, 0, 46, `500 22px ${SANS}`, GOLD);
  c.restore();
}
/* 旋转的涡旋图标：三条螺旋臂，由短笔触组成 */
function drawVortex(c, x, y, r, t, alpha, color, dir=1){
  if (alpha<=0 || r<=1) return;
  c.save(); c.globalAlpha *= alpha; c.translate(x,y); c.rotate(dir*t*1.2*(60/Math.max(r,20))**0.5);
  c.strokeStyle = color; c.lineCap = 'round';
  for (let arm=0; arm<3; arm++){
    for (let s=0.08; s<1; s+=0.045){
      const a = arm*2*Math.PI/3 + s*4.2, rr = r*s;
      const x1 = Math.cos(a)*rr, y1 = Math.sin(a)*rr;
      const a2 = a + 0.25, rr2 = r*(s+0.03);
      c.lineWidth = Math.max(1.2, r*0.07*(1-s*0.6));
      c.beginPath(); c.moveTo(x1,y1); c.lineTo(Math.cos(a2)*rr2, Math.sin(a2)*rr2); c.stroke();
    }
  }
  c.restore();
}
/* 描边自绘：按进度 k 画出路径 */
function strokeProgress(c, pathFn, len, k){
  c.save(); c.setLineDash([len*k, len+10]); pathFn(); c.stroke(); c.restore();
}

/* ---- 频谱图 ----
   X: 0..3 个数量级（漩涡尺度，右侧更小）；logE 分段：大尺度平缓 / −5/3 / −1（巴切勒） */
const XA = 0.6, XB = 2.04;
function logE(X){ return X<XA ? -0.3*X : X<XB ? -0.18-(5/3)*(X-XA) : -0.18-(5/3)*(XB-XA)-(X-XB); }
function noise(X){ return 0.07*Math.sin(X*13.1)+0.05*Math.sin(X*31.7+1.3)+0.035*Math.sin(X*67.3+.4); }
function drawChart(c, t, bx, by, bw, bh, o){
  const mx = X => bx + X/3*bw, my = L => by + (0.15 - L)/3.9*bh;
  c.save(); c.globalAlpha *= o.alpha ?? 1;
  // 坐标轴
  c.strokeStyle = 'rgba(234,234,242,.55)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(bx, by-10); c.lineTo(bx, by+bh); c.lineTo(bx+bw+10, by+bh); c.stroke();
  for (let i=0;i<=3;i++){ c.beginPath(); c.moveTo(mx(i), by+bh); c.lineTo(mx(i), by+bh+8); c.stroke(); }
  txt(c, '大漩涡', bx, by+bh+34, `500 22px ${SANS}`, DIM, 'left');
  txt(c, '小漩涡 →', bx+bw, by+bh+34, `500 22px ${SANS}`, DIM, 'right');
  txt(c, '能量', bx-16, by-4, `500 22px ${SANS}`, DIM, 'right');
  // 理论 −5/3 线
  if (o.theory > 0){
    const k = o.theory;
    c.strokeStyle = o.dataProg>0 ? 'rgba(232,197,71,.55)' : GOLD; c.lineWidth = o.dataProg>0 ? 2.5 : 4;
    if (o.dataProg>0) c.setLineDash([12,10]);
    const x0 = 0.15, x1 = lerp(x0, 2.7, k);
    const lt = X => -0.18-(5/3)*(X-XA);
    c.beginPath(); c.moveTo(mx(x0), my(lt(x0)+0.0)); c.lineTo(mx(x1), my(lt(x1))); c.stroke(); c.setLineDash([]);
    if (o.label53 > 0){
      const X = 1.35, px = mx(X), py = my(lt(X));
      c.fillStyle = GOLD; c.globalAlpha *= 1; c.beginPath(); c.arc(px,py,8*o.label53,0,7); c.fill();
      txt(c, '斜率 −5/3', px+24, py-30, `700 40px ${SANS}`, GOLD, 'left', o.label53);
    }
  }
  // 漩涡尺度范围竖线
  if (o.band > 0){
    c.save(); c.globalAlpha *= o.band;
    c.fillStyle = 'rgba(232,197,71,.08)'; c.fillRect(mx(XA), by, mx(XB)-mx(XA), bh);
    c.strokeStyle = 'rgba(234,234,242,.5)'; c.lineWidth = 1.5; c.setLineDash([8,8]);
    for (const X of [XA, XB]){ c.beginPath(); c.moveTo(mx(X), by-6); c.lineTo(mx(X), by+bh); c.stroke(); }
    c.setLineDash([]);
    txt(c, '最大漩涡', mx(XA), by-24, `500 24px ${SANS}`, INK);
    txt(c, '最小漩涡', mx(XB), by-24, `500 24px ${SANS}`, INK);
    c.restore();
  }
  // 数据曲线
  if (o.dataProg > 0){
    const Xend = lerp(0.05, 2.97, o.dataProg);
    const seg = (a,b,col,w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath();
      for (let X=a; X<=b; X+=0.01){ const L = logE(X)+noise(X); X===a ? c.moveTo(mx(X),my(L)) : c.lineTo(mx(X),my(L)); } c.stroke(); };
    c.lineJoin = 'round';
    seg(0.05, Math.min(Xend, XA), 'rgba(234,234,242,.85)', 3);
    if (Xend > XA){
      c.save(); if (o.glow>0){ c.shadowColor = GOLD; c.shadowBlur = 22*o.glow; }
      seg(XA, Math.min(Xend, XB), o.glow>0 ? GOLD : 'rgba(234,234,242,.85)', 3 + 2*(o.glow||0)); c.restore();
    }
    if (Xend > XB) seg(XB, Xend, o.tail>0 ? '#6FA8FF' : 'rgba(234,234,242,.85)', 3 + 2*(o.tail||0));
  }
  // −1 尾段
  if (o.tail > 0){
    const X = 2.5, L = logE(X)+0.35;
    c.save(); c.globalAlpha *= o.tail; c.strokeStyle = 'rgba(111,168,255,.6)'; c.setLineDash([10,8]); c.lineWidth = 2;
    c.beginPath(); c.moveTo(mx(XB), my(logE(XB)+0.35)); c.lineTo(mx(2.95), my(logE(2.95)+0.35)); c.stroke(); c.restore();
    txt(c, '斜率 −1', mx(X)+10, my(L)-40, `700 40px ${SANS}`, '#6FA8FF', 'center', o.tail);
  }
  c.restore();
}

/* ---- 《叼烟斗、缠绷带的自画像》极简剪影 ---- */
function drawPortrait(c, x, y, w, h, t){
  c.save(); c.translate(x - w/2, y - h/2);
  c.beginPath(); c.rect(0,0,w,h); c.clip();
  c.fillStyle = '#c0392b'; c.fillRect(0,0,w,h*0.55);
  c.fillStyle = '#e67e22'; c.fillRect(0,h*0.55,w,h*0.45);
  // 肩与外套
  c.fillStyle = '#1f4e5f'; c.beginPath(); c.moveTo(w*0.12,h); c.quadraticCurveTo(w*0.2,h*0.68,w*0.5,h*0.66); c.quadraticCurveTo(w*0.8,h*0.68,w*0.9,h); c.fill();
  // 脸
  c.fillStyle = '#e3b98a'; c.beginPath(); c.ellipse(w*0.5,h*0.45,w*0.15,h*0.2,0,0,7); c.fill();
  // 皮帽
  c.fillStyle = '#2b2b3a'; c.beginPath(); c.ellipse(w*0.5,h*0.27,w*0.19,h*0.09,0,0,7); c.fill();
  // 绷带（右耳）
  c.fillStyle = '#f2efe6'; c.beginPath(); c.ellipse(w*0.39,h*0.46,w*0.07,h*0.12,0.2,0,7); c.fill();
  c.strokeStyle = '#f2efe6'; c.lineWidth = w*0.03; c.beginPath(); c.moveTo(w*0.36,h*0.58); c.lineTo(w*0.6,h*0.6); c.stroke();
  // 烟斗与烟
  c.strokeStyle = '#3b2a20'; c.lineWidth = w*0.02; c.beginPath(); c.moveTo(w*0.52,h*0.55); c.lineTo(w*0.66,h*0.6); c.stroke();
  c.fillStyle = '#3b2a20'; c.fillRect(w*0.64,h*0.55,w*0.05,h*0.06);
  c.strokeStyle = 'rgba(240,240,240,.55)'; c.lineWidth = 3;
  for (let i=0;i<3;i++){ c.beginPath();
    for (let s=0;s<1;s+=0.05){ const yy = h*0.54 - s*h*0.35; const xx = w*0.665 + Math.sin(s*8 + t*1.5 + i*2)*w*0.03*(s+0.2);
      s===0 ? c.moveTo(xx,yy) : c.lineTo(xx,yy); } c.stroke(); }
  c.restore();
  c.strokeStyle = 'rgba(234,234,242,.25)'; c.lineWidth = 2; c.strokeRect(x-w/2, y-h/2, w, h);
}

/* ---- 小型统计对比图：理论（金色虚线）vs 数据（白线） ---- */
function drawFit(c, x, y, w, h, k, good, t){
  c.save();
  c.strokeStyle = 'rgba(234,234,242,.4)'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x, y+h); c.lineTo(x+w, y+h); c.stroke();
  const f = s => Math.exp(-(((s-0.5)/0.17)**2)/2);           // 理论分布
  const g = s => good ? f(s) + 0.05*Math.sin(s*40) : 0.75*Math.exp(-(((s-0.42)/0.09)**2)/2) + 0.25*Math.exp(-(((s-0.72)/0.07)**2)/2);
  c.setLineDash([8,6]); c.strokeStyle = GOLD; c.lineWidth = 2.5; c.beginPath();
  for (let s=0;s<=1;s+=0.01){ const px=x+s*w, py=y+h-f(s)*h*0.9; s===0?c.moveTo(px,py):c.lineTo(px,py);} c.stroke(); c.setLineDash([]);
  c.strokeStyle = INK; c.lineWidth = 3; c.beginPath();
  for (let s=0;s<=k;s+=0.01){ const px=x+s*w, py=y+h-clamp(g(s),0,1.1)*h*0.9; s===0?c.moveTo(px,py):c.lineTo(px,py);} c.stroke();
  c.restore();
}

/* ---- 笔触微距：黄、蓝两道油彩被刷子拖开并混合 ---- */
function drawPaintMacro(c, x, y, w, h, t, k){
  if (k<=0) return;
  c.save(); c.globalAlpha *= k;
  roundRect(c, x, y, w, h, 10); c.clip();
  c.fillStyle = '#0d1b3e'; c.fillRect(x,y,w,h);
  const strokes = [
    {col:[244,211,74], y0:0.30, amp:0.10, ph:0.0, t0:107.0},
    {col:[126,166,212], y0:0.52, amp:0.12, ph:1.7, t0:107.6},
    {col:[251,238,176], y0:0.70, amp:0.08, ph:3.1, t0:108.3},
    {col:[44,94,163],  y0:0.42, amp:0.14, ph:4.2, t0:109.0},
  ];
  const rnd = mulberry32(42);
  for (const s of strokes){
    const grow = easeInOut(P(t, s.t0, s.t0+2.4));
    if (grow<=0) continue;
    for (let b=0; b<34; b++){   // 刷毛
      const off = (b/33-0.5)*0.16, jit = rnd()*0.5+0.5, a = 0.35 + rnd()*0.4;
      c.strokeStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${a})`; c.lineWidth = 3 + jit*3;
      c.beginPath();
      for (let q=0; q<=grow; q+=0.02){
        const px = x + q*w*1.05 - w*0.02;
        const py = y + h*(s.y0 + off + s.amp*Math.sin(q*5 + s.ph + t*0.3) + 0.006*Math.sin(q*60 + b));
        q===0 ? c.moveTo(px,py) : c.lineTo(px,py);
      }
      c.stroke();
    }
  }
  c.restore();
  c.strokeStyle = 'rgba(234,234,242,.3)'; c.lineWidth = 2; roundRect(c, x, y, w, h, 10); c.stroke();
}

/* ---- 小卡片：急流 / 烟 / 奶咖 ---- */
function drawExampleCard(c, x, y, k, kind, zh, en, t){
  if (k<=0) return;
  c.save(); c.globalAlpha *= k; c.translate(x + (1-easeOut(k))*60, y);
  c.rotate(0.012*Math.sin(t*0.9 + x));
  drawPaper(c, 0, 0, 380, 128, 0);
  c.strokeStyle = '#3a4a6a'; c.lineWidth = 3; c.lineCap = 'round';
  const ix = -130;
  if (kind==='water'){ for (let i=0;i<3;i++){ c.beginPath();
      for (let s=0;s<=1;s+=0.05){ const px=ix-40+s*80, py=-22+i*20+6*Math.sin(s*9+t*3+i); s===0?c.moveTo(px,py):c.lineTo(px,py);} c.stroke(); } }
  if (kind==='smoke'){ c.fillStyle='#3a4a6a'; c.fillRect(ix-10,10,20,30);
    c.beginPath(); for (let s=0;s<=1;s+=0.04){ const px=ix + 18*s*Math.sin(s*10 - t*2.5), py=8 - s*60; s===0?c.moveTo(px,py):c.lineTo(px,py);} c.stroke(); }
  if (kind==='coffee'){ c.beginPath(); c.ellipse(ix,0,42,30,0,0,7); c.stroke();
    c.strokeStyle = '#a07850'; c.beginPath();
    for (let s=0;s<=1;s+=0.02){ const a=s*12+t*1.5, r=26*s; const px=ix+Math.cos(a)*r, py=Math.sin(a)*r*0.7; s===0?c.moveTo(px,py):c.lineTo(px,py);} c.stroke(); }
  txt(c, zh, -40, -14, `700 38px ${SANS}`, '#2a2218', 'left');
  txt(c, en, -40, 26, `italic 26px ${GARA}`, '#6a5a48', 'left');
  c.restore();
}

V.paint2d = { drawStarry, drawPortrait, drawFit, drawPaintMacro, drawVortex, drawChart, drawExampleCard, drawNameplate, drawPaper, drawSeal, txt, roundRect, toScr, FEATURES, logE, noise, XA, XB };
})();

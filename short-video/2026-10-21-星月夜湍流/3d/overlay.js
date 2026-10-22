/* overlay.js — 2D 覆盖层：双语字幕 / 顶部标签 / 画面注释 / 标题卡 / 笔触转场 / 暗角 / 结尾卡
   字幕与剧本 script.md 一致。V.CUTS 为镜头切换时刻，切换处用一阵旋转笔触扫过画面遮住硬切。 */
(function(){
const { clamp, lerp, easeInOut, easeOut, E, vis } = V;
const F = V.FONT, C = V.COL;

V.SUBTITLES = [
  [0.5, 3.5,  '这片天空，是一个病人画的', 'This sky was painted by a patient.'],
  [3.5, 7.0,  '他不懂物理，也没学过数学', 'He knew no physics. No mathematics.'],
  [7.0, 11.0, '可这些漩涡里，藏着五十多年后才被写下的定律', 'Yet these swirls hide a law written fifty years later.'],
  [11.0, 14.5,'天空，真的会这样<em>「流动」</em>吗？', 'Does the sky really flow like this?'],
  [20.0, 23.5,'1889 年 5 月，梵高住进了圣雷米的精神病院', 'May 1889. Van Gogh enters the asylum at Saint-Rémy.'],
  [23.5, 27.0,'卧室的窗朝东，铁栏外是麦田和远山', 'His window faced east: wheat fields, distant hills.'],
  [27.0, 30.5,'6 月，他凭记忆和想象，画下了这片夜空', 'In June, from memory and imagination, he painted this sky.'],
  [30.5, 34.0,'天空里，有大大小小<em>「十几个漩涡」</em>', 'A dozen whirls, large and small.'],
  [34.0, 38.0,'33 年后，英国气象学家理查森写了一首小诗', '33 years later, meteorologist Lewis Fry Richardson wrote a verse.'],
  [38.0, 42.0,'大涡旋生小涡旋，靠着速度来喂养', '"Big whorls have little whorls, that feed on their velocity,"'],
  [42.0, 46.0,'小涡旋再生更小的，一直到黏性为止', '"And little whorls have lesser whorls, and so on to viscosity."'],
  [46.0, 50.0,'这就是<em>「湍流」</em>：能量从大漩涡，一层层传给小漩涡', 'Turbulence: energy cascades from big eddies to small.'],
  [50.0, 54.0,'急流、烟囱的烟、咖啡里的奶，都是这样', 'Rapids, chimney smoke, milk in coffee — all the same.'],
  [54.0, 58.0,'1941 年，苏联数学家柯尔莫哥洛夫找到了它的规律', '1941. Soviet mathematician Andrey Kolmogorov found its law.'],
  [58.0, 62.0,'漩涡越小，分到的能量越少，而且按<em>「固定比例」</em>', 'The smaller the eddy, the less energy — at a fixed rate.'],
  [62.0, 67.0,'画成图，是一条斜率<em>「−5/3」</em>的直线', 'On a log plot: a straight line, slope −5/3.'],
  [67.0, 71.0,'大气、海洋、星际气体里，都有这条线', 'In air, in oceans, in interstellar gas — the same line.'],
  [71.0, 75.0,'2006 年，阿拉贡等人第一次把梵高的画拿来检验', '2006. Aragón and colleagues put Van Gogh to the test.'],
  [75.0, 79.0,'他精神最躁动时的画，亮度起伏符合湍流统计', 'His most turbulent periods: brightness matched turbulence.'],
  [79.0, 83.0,'而平静时期的自画像，不符合', 'His calm self-portrait did not.'],
  [83.0, 87.0,'2024 年，厦门大学的团队把整幅画的漩涡逐个量了一遍', '2024. A Xiamen University team measured every whirl.'],
  [87.0, 91.0,'他们把<em>「亮度」</em>当成被气流带着走的颜料', 'They treated brightness as a tracer carried by the flow.'],
  [91.0, 95.5,'算出频谱——那条 −5/3 的线，出现了', 'Then the spectrum. The −5/3 line appeared.'],
  [95.5, 100.0,'恰好落在最大和最小漩涡之间', 'Right between the largest whirl and the smallest.'],
  [100.0, 103.5,'还有一个反直觉的细节', 'And one more counterintuitive detail.'],
  [103.5, 107.0,'比最小的漩涡更小，曲线拐了个弯，变成 −1', 'Below the smallest whirl, the curve bends to −1.'],
  [107.0, 110.5,'这是另一条规律：<em>「巴切勒标量湍流」</em>', 'Another law entirely: Batchelor scalar turbulence.'],
  [110.5, 114.0,'研究者推测，它来自笔刷下颜料自己的混合', 'Possibly the paint itself, mixing under the brush.'],
  [114.0, 117.5,'湍流，至今没有被人类完全解开', 'Turbulence is still unsolved.'],
  [117.5, 121.5,'描述它的纳维-斯托克斯方程，悬赏 100 万美元', 'Navier–Stokes: a million-dollar Millennium Prize problem.'],
  [121.5, 124.5,'梵高没算过一行公式', 'Van Gogh never wrote an equation.'],
  [124.5, 128.0,'他只是，比所有人都更用力地看过天空', 'He just looked at the sky harder than anyone.'],
  [136.0, 139.6,'你第一次看《星月夜》时，看见的是什么？', 'What did you see, the first time?'],
];
V.TITLE_CARD = [15, 20, '《星月夜的湍流》', '梵高画下的，是物理学最难的问题之一', "The Turbulence in Van Gogh's Sky"];
/* 章节：[起秒, 顶部标签, 画面注释] —— 各镜头可在 build 里通过 V.setSection 覆盖自己时间段内的注释 */
V.SECTIONS = [
  [0,   '', ''],
  [15,  '', ''],
  [20,  '1889 · 圣雷米 · 圣保罗精神病院', ''],
  [27,  '1889 · 6 月', '原作藏于纽约现代艺术博物馆 · 73.7 × 92.1 cm'],
  [30.5,'1889 · 6 月', ''],
  [34,  '1922 · 英国', 'L. F. 理查森《用数值方法预报天气》· 原诗直译'],
  [46,  '湍流 · 能量级联', '能量逐层传递，最后变成热'],
  [54,  '1941 · 莫斯科', '尺度每小一级，能量按固定比例减少'],
  [62,  '柯尔莫哥洛夫 −5/3 律', '横轴：漩涡尺度（越往右越小）　纵轴：能量（对数）'],
  [71,  '2006 · 阿拉贡等人', '左：躁动期画作　右：《叼烟斗、缠绷带的自画像》1889 年 1 月'],
  [83,  '2024 · 厦门大学', 'Physics of Fluids 36(9), 2024'],
  [87,  '2024 · 厦门大学', '把亮度当作被流动携带的标量'],
  [91,  '−5/3 · 出现', '只在漩涡的尺度范围内成立'],
  [100, '反直觉', '比最小漩涡更小的尺度'],
  [107, '反直觉', '巴切勒尺度 · 研究者推测'],
  [114, '千禧年大奖难题', '克雷数学研究所，2000 年'],
  [121, '', ''],
  [128, '', ''],
];
V.setSection = (t0, label, note) => { const s = V.SECTIONS.find(s => s[0] === t0); if (s){ if (label !== undefined) s[1] = label; if (note !== undefined) s[2] = note; } };
/* 镜头切换时刻：在这些时刻前后 0.35s 用笔触扫屏 */
V.CUTS = [20, 34, 46, 54, 62, 71, 83, 91, 114, 121];

const $ = id => document.getElementById(id);
const ov = $('ov'), oc = ov.getContext('2d');

/* 笔触扫屏：一股星月夜笔触组成的旋流从画面一侧卷过另一侧，在切换时刻刚好盖满全屏
   每根笔触沿以画外某点为中心的大圆弧运动（有方向感），两端收尖、带刷毛纹理。 */
const WIPE_HALF = 0.32;
const WIPE = (() => { const r = V.rng(777), a = [];
  for (let i=0;i<950;i++){
    const lane = r();                                   // 0..1：旋流的径向位置（决定半径）
    a.push({ lane, th0: r(), len: 170+r()*170, wid: 26+r()*18, ph: r()*6.28, k: r(),
      col: r()<.55 ? V.PAL.deep[Math.floor(r()*5)] : r()<.78 ? V.PAL.mid[Math.floor(r()*3)] : r()<.92 ? V.PAL.pale[Math.floor(r()*3)] : V.PAL.yel[Math.floor(r()*3)] });
  }
  return a; })();
const shade = (hex, k) => { const [r,g,b] = V.hex(hex); return `rgb(${Math.round(V.clamp(r*k,0,1)*255)},${Math.round(V.clamp(g*k,0,1)*255)},${Math.round(V.clamp(b*k,0,1)*255)})`; };
function brushStroke(x, y, ang, len, wid, col, a, seed){
  oc.save(); oc.translate(x, y); oc.rotate(ang); oc.globalAlpha = a;
  const L = len/2, Wd = wid/2;
  oc.fillStyle = col;
  oc.beginPath();                                       // 起笔钝圆、收笔渐尖（带一点飞白）
  oc.moveTo(-L + Wd, -Wd);
  oc.bezierCurveTo(-L*0.1, -Wd*1.05, L*0.55, -Wd*0.7, L, -Wd*0.05);
  oc.lineTo(L*0.92, Wd*0.25);
  oc.bezierCurveTo(L*0.5, Wd*0.85, -L*0.1, Wd*1.02, -L + Wd, Wd);
  oc.arc(-L + Wd, 0, Wd, Math.PI/2, Math.PI*1.5);
  oc.fill();
  oc.lineCap = 'round';                                 // 刷毛：几道深浅细线
  for (let b=0;b<3;b++){
    const yy = (b-1)*Wd*0.55 + Math.sin(seed*7+b)*Wd*0.12;
    oc.strokeStyle = b===1 ? shade(col, 1.22) : shade(col, 0.72); oc.lineWidth = Math.max(2, wid*0.09);
    oc.globalAlpha = a*0.55;
    oc.beginPath(); oc.moveTo(-L*0.75, yy); oc.lineTo(L*0.8, yy*0.7); oc.stroke();
  }
  oc.restore();
}
/* 每个切点一种转场（不重复）：在切换时刻（p=0.5）都恰好盖满画面，遮住硬切 */
V.TRANSITIONS = { 20:'dip', 34:'flash', 46:'zoom', 54:'whip', 62:'iris', 71:'starburst', 83:'brush', 91:'curtain', 114:'ink', 121:'blinds' };
const TR_HALF = { dip: 0.45, flash: 0.35, zoom: 0.32, whip: 0.26, iris: 0.5, starburst: 0.4, brush: WIPE_HALF, curtain: 0.42, ink: 0.45, blinds: 0.4 };
const TRR = V.rng(4242);
const ZOOM = Array.from({length: 420}, () => ({a: TRR()*Math.PI*2, r0: 40 + TRR()*900, len: 120 + TRR()*400, w: 2 + TRR()*7, c: TRR()}));
const WHIP = Array.from({length: 240}, () => ({y: TRR()*1080, x: TRR()*1920, len: 300 + TRR()*900, w: 3 + TRR()*14, c: TRR()}));
const INK = Array.from({length: 9}, () => ({x: 200 + TRR()*1520, y: 120 + TRR()*840, s: 0.6 + TRR()*0.7, ph: TRR()*6.28}));
const palC = c => c < .55 ? V.PAL.deep[Math.floor(c*9)%5] : c < .8 ? V.PAL.mid[Math.floor(c*7)%3] : c < .93 ? V.PAL.pale[Math.floor(c*11)%3] : V.PAL.yel[Math.floor(c*13)%3];
function drawTransition(t){
  let cut = null, type = null;
  for (const c of V.CUTS){ const ty = V.TRANSITIONS[c]; if (Math.abs(t - c) < TR_HALF[ty]){ cut = c; type = ty; } }
  if (cut === null) return;
  if (type === 'brush') return drawWipe(t);
  const H = TR_HALF[type], p = (t - cut + H)/(2*H);
  const cover = p < 0.5 ? V.smooth(p/0.5) : 1 - V.smooth((p-0.5)/0.5);
  oc.save();
  if (type === 'dip'){                                    // 沉入黑暗
    oc.fillStyle = `rgba(3,4,10,${cover})`; oc.fillRect(0,0,1920,1080);
  } else if (type === 'flash'){                           // 暖白闪光
    const g = oc.createRadialGradient(960,540,0,960,540,1300);
    g.addColorStop(0, `rgba(255,248,225,${cover})`); g.addColorStop(1, `rgba(255,226,160,${cover*cover})`);
    oc.fillStyle = g; oc.fillRect(0,0,1920,1080);
  } else if (type === 'zoom'){                            // 径向冲刺线
    oc.fillStyle = `rgba(8,14,38,${V.clamp(cover*1.4-0.4,0,1)})`; oc.fillRect(0,0,1920,1080);
    oc.lineCap = 'round';
    for (const z of ZOOM){
      const r = z.r0*(1 + (p-0.5)*1.6), L = z.len*cover*1.6;
      oc.strokeStyle = palC(z.c); oc.lineWidth = z.w*(0.5+cover); oc.globalAlpha = cover;
      oc.beginPath(); oc.moveTo(960 + Math.cos(z.a)*r, 540 + Math.sin(z.a)*r); oc.lineTo(960 + Math.cos(z.a)*(r+L), 540 + Math.sin(z.a)*(r+L)); oc.stroke();
    }
  } else if (type === 'whip'){                            // 横向甩镜
    oc.fillStyle = `rgba(20,40,90,${V.clamp(cover*1.5-0.5,0,1)})`; oc.fillRect(0,0,1920,1080);
    for (const w of WHIP){
      const x = ((w.x + (p-0.5)*5200) % 2600 + 2600) % 2600 - 340;
      const g = oc.createLinearGradient(x, 0, x + w.len, 0);
      const col = palC(w.c); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      oc.globalAlpha = cover; oc.fillStyle = g; oc.fillRect(x, w.y, w.len*(0.4+cover), w.w);
    }
  } else if (type === 'iris'){                            // 圆形光圈收拢再张开（金边）
    const r = Math.max(0, (1 - cover)*1150);
    oc.fillStyle = '#04050c'; oc.beginPath(); oc.rect(0,0,1920,1080); oc.arc(960, 470, r, 0, Math.PI*2, true); oc.fill();
    if (r > 2){ oc.strokeStyle = 'rgba(232,197,71,.8)'; oc.lineWidth = 4; oc.beginPath(); oc.arc(960, 470, r, 0, Math.PI*2); oc.stroke(); }
  } else if (type === 'starburst'){                       // 一颗星炸亮铺满画面
    const r = 40 + cover*2200, g = oc.createRadialGradient(1380, 300, 0, 1380, 300, r);
    g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(0.25, `rgba(252,226,130,${cover})`); g.addColorStop(1, `rgba(250,210,100,${cover*0.9})`);
    oc.fillStyle = g; oc.fillRect(0,0,1920,1080);
    oc.translate(1380, 300); oc.strokeStyle = `rgba(255,250,220,${cover})`; oc.lineWidth = 6;
    for (let k=0;k<8;k++){ oc.rotate(Math.PI/4); oc.beginPath(); oc.moveTo(0,0); oc.lineTo(cover*1600, 0); oc.stroke(); }
  } else if (type === 'curtain'){                         // 斜切幕布，金色边缘
    const slant = 420, e = p < 0.5 ? V.lerp(-slant, 1920 + slant, V.smooth(p/0.5)) : V.lerp(-slant, 1920 + slant, V.smooth((p-0.5)/0.5));
    oc.fillStyle = '#070b1e'; oc.beginPath();
    if (p < 0.5){ oc.moveTo(0,0); oc.lineTo(e + slant/2, 0); oc.lineTo(e - slant/2, 1080); oc.lineTo(0,1080); }
    else { oc.moveTo(e + slant/2, 0); oc.lineTo(1920,0); oc.lineTo(1920,1080); oc.lineTo(e - slant/2, 1080); }
    oc.fill();
    oc.strokeStyle = 'rgba(232,197,71,.9)'; oc.lineWidth = 6; oc.shadowColor = '#E8C547'; oc.shadowBlur = 24;
    oc.beginPath(); oc.moveTo(e + slant/2, 0); oc.lineTo(e - slant/2, 1080); oc.stroke();
  } else if (type === 'ink'){                             // 墨蓝色颜料滴落晕开
    oc.fillStyle = '#0b1a44';
    for (const d of INK){
      const R = cover*1100*d.s; if (R < 1) continue;
      oc.beginPath();
      for (let k=0;k<=48;k++){ const a = k/48*Math.PI*2, rr = R*(1 + 0.12*Math.sin(a*5 + d.ph) + 0.06*Math.sin(a*11 + d.ph*2));
        k ? oc.lineTo(d.x + Math.cos(a)*rr, d.y + Math.sin(a)*rr) : oc.moveTo(d.x + Math.cos(a)*rr, d.y + Math.sin(a)*rr); }
      oc.fill();
    }
    if (cover > 0.9){ oc.fillRect(0,0,1920,1080); }
  } else if (type === 'blinds'){                          // 竖条百叶合拢
    const n = 12, wS = 1920/n;
    for (let k=0;k<n;k++){ const w = wS*Math.min(1, cover*1.08);
      oc.fillStyle = k%2 ? '#0e1d4a' : '#14275e'; oc.fillRect(k*wS + (wS - w)/2, 0, w, 1080);
      oc.fillStyle = 'rgba(232,197,71,.55)'; if (w < wS - 2) { oc.fillRect(k*wS + (wS - w)/2 - 1, 0, 2, 1080); oc.fillRect(k*wS + (wS + w)/2 - 1, 0, 2, 1080); } }
  }
  oc.restore();
}
function drawWipe(t){
  let best = null; for (const c of V.CUTS) if (Math.abs(t - c) < WIPE_HALF && V.TRANSITIONS[c] === 'brush') best = c;
  if (best === null) return;
  const p = (t - best + WIPE_HALF)/(2*WIPE_HALF);         // 0→1，0.5 为切换时刻
  const cover = p < 0.5 ? V.smooth(p/0.5) : 1 - V.smooth((p-0.5)/0.5);
  const idx = V.CUTS.indexOf(best), dir = idx % 2 ? -1 : 1;
  // 旋流中心在画外下方（左右交替），笔触沿大圆弧扫过画面
  const cx = 960 - dir*1500, cy = 1900, R0 = 1250, R1 = 2900;
  const sweep = (p - 0.5)*0.55;                          // 整体角速度：笔触在 0.64s 内扫过约 0.55 弧度
  const base = Math.atan2(540 - cy, 960 - cx);
  for (const s of WIPE){
    if (s.k > cover*1.12) continue;
    const r = R0 + s.lane*(R1 - R0);
    const th = base + (s.th0 - 0.5)*1.1*(1600/r) + dir*sweep*(1.4 - s.lane*0.6);
    const x = cx + Math.cos(th)*r, y = cy + Math.sin(th)*r;
    if (x < -200 || x > 2120 || y < -200 || y > 1280) continue;
    const ang = th + Math.PI/2 + 0.18*Math.sin(s.ph + t*4);
    brushStroke(x, y, ang, s.len, s.wid, s.col, V.clamp((cover*1.12 - s.k)*7, 0, 1), s.ph);
  }
}

function drawVignette(){
  const g = oc.createRadialGradient(960, 540, 520, 960, 540, 1180);
  g.addColorStop(0, 'rgba(4,5,14,0)'); g.addColorStop(1, 'rgba(4,5,14,.55)');
  oc.fillStyle = g; oc.fillRect(0,0,1920,1080);
  const b = oc.createLinearGradient(0, 760, 0, 1080);
  b.addColorStop(0, 'rgba(4,5,14,0)'); b.addColorStop(1, 'rgba(4,5,14,.78)');
  oc.fillStyle = b; oc.fillRect(0, 760, 1920, 320);
}

function drawEndCards(t){
  const d = vis(t, 128, 132.2, 0.6, 0.6);
  if (d>0){ oc.save(); oc.globalAlpha = d;
    oc.fillStyle = 'rgba(8,10,24,.80)'; V.roundRect(oc, 360, 230, 1200, 420, 8); oc.fill();
    oc.strokeStyle = 'rgba(232,197,71,.7)'; oc.lineWidth = 1.5; V.roundRect(oc, 360, 230, 1200, 420, 8); oc.stroke();
    V.txt(oc, '声明', 960, 290, `700 34px ${F.SANS}`, C.gold);
    ['本片演示的是画面亮度的统计规律，', '不代表梵高懂物理，画中也没有真的在流动的空气。', '也有物理学家指出：画没有动能，不算真正的湍流。']
      .forEach((s,i)=> V.txt(oc, s, 960, 380 + i*62, `500 34px ${F.SANS}`, C.ink));
    V.txt(oc, 'Statistics of brightness, not a claim that the painting is a fluid.', 960, 580, `italic 26px ${F.GARA}`, C.dim);
    oc.restore(); }
  const r = vis(t, 132, 136.2, 0.6, 0.6);
  if (r>0){ oc.save(); oc.globalAlpha = r;
    oc.fillStyle = 'rgba(8,10,24,.80)'; V.roundRect(oc, 260, 230, 1400, 420, 8); oc.fill();
    oc.strokeStyle = 'rgba(232,197,71,.7)'; oc.lineWidth = 1.5; V.roundRect(oc, 260, 230, 1400, 420, 8); oc.stroke();
    V.txt(oc, '参考', 960, 290, `700 34px ${F.SANS}`, C.gold);
    V.txt(oc, 'Y. Ma, W. Cheng, S. Huang, F. G. Schmitt, X. Lin, Y. Huang,', 960, 370, `28px ${F.GARA}`, C.ink);
    V.txt(oc, "“Hidden turbulence in van Gogh's The Starry Night”, Physics of Fluids 36(9), 2024", 960, 412, `italic 28px ${F.GARA}`, C.ink);
    V.txt(oc, 'J. L. Aragón, G. G. Naumis, M. Bai, M. Torres, P. K. Maini,', 960, 490, `28px ${F.GARA}`, C.ink);
    V.txt(oc, '“Turbulent luminance in impassioned van Gogh paintings”, J. Math. Imaging Vis., 2008', 960, 532, `italic 28px ${F.GARA}`, C.ink);
    V.txt(oc, 'L. F. Richardson, Weather Prediction by Numerical Process, 1922', 960, 600, `26px ${F.GARA}`, C.dim);
    oc.restore(); }
}

V.overlay = function(t, act){
  oc.clearRect(0,0,1920,1080);
  drawVignette();
  for (const h of (V.overlayHooks || [])) h(oc, t, act);     // 镜头可注册自己的 2D 覆盖绘制
  drawEndCards(t);
  drawTransition(t);
  const inTitle = t >= V.TITLE_CARD[0] && t < V.TITLE_CARD[1];
  const sub = V.SUBTITLES.find(([a,b]) => t >= a && t < b);
  const el = $('subtitle'), elEn = $('subtitle-en');
  if (sub && !inTitle){
    const [a, b, zh, en] = sub;
    const kIn = easeInOut(clamp((t-a)/0.45, 0, 1)), kOut = 1 - easeInOut(clamp((t-(b-0.35))/0.35, 0, 1));
    el.style.opacity = kIn*kOut; el.style.transform = `translateY(${lerp(8,0,kIn)}px)`;
    el.innerHTML = zh; elEn.textContent = en || ''; elEn.style.opacity = kIn*kOut*.95;
  } else { el.innerHTML = ''; elEn.textContent = ''; }
  const tc = $('titlecard');
  if (inTitle){
    tc.style.display = 'flex';
    const k = Math.min(easeInOut(clamp((t-V.TITLE_CARD[0])/1.2, 0, 1)), 1 - easeInOut(clamp((t-(V.TITLE_CARD[1]-0.7))/0.7, 0, 1)));
    tc.style.opacity = k;
    tc.querySelector('.name').textContent = V.TITLE_CARD[2];
    tc.querySelector('.q').textContent = V.TITLE_CARD[3];
    tc.querySelector('.q-en').textContent = V.TITLE_CARD[4];
    tc.querySelector('.name').style.transform = `scale(${lerp(.92, 1, easeOut(clamp((t-V.TITLE_CARD[0])/1.2,0,1)))})`;
  } else tc.style.display = 'none';
  let sec = V.SECTIONS[0]; for (const s of V.SECTIONS) if (t >= s[0]) sec = s;
  const next = V.SECTIONS.find(s => s[0] > t), secEnd = next ? next[0] : V.DURATION;
  const sk = sec[0] === 0 ? 1 : Math.min(E(t, sec[0], sec[0]+0.6), 1 - E(t, secEnd-0.4, secEnd));
  $('toplabel').textContent = sec[1]; $('toplabel').style.opacity = sk;
  $('annotation').textContent = sec[2] || ''; $('annotation').style.opacity = sk;
};
V.overlayHooks = [];
})();

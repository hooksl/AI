const TITLE = '闪电波兰';
// Purpose (SKILL.md "First questions"): 'cinematic' or 'ad'.
const PURPOSE = 'cinematic';
// Look: the film draws its own copperplate engraving (styles/engraving.md); the family below only sets the frame pass.
const LOOKS = {
  'engraving': { grade: null, bloom: 0, texture: null, vignette: 0.1, grain: 0, grainHold: Infinity, hold: 24, line: 0, steps: 0,
    palette: { bg: '#efe5cc', ink: '#1c1510', accent: '#c9a227', dim: '#6f8796', red: '#9b2f2a' } },
};
const LOOK_ID = 'engraving';
const LOOK = LOOKS[LOOK_ID];
const FINISH = { shutter: null, weave: 0, tone: null };
const FPS = 24;
const DURATION = 60;                        // seconds; the picture and the sound both follow this
const BPM = 120;                            // the recording is rubato (no grid): cues sit on measured onsets instead
const BEAT0 = 0;
const beat = (n) => BEAT0 + n * 60 / BPM, bar = (n) => beat(4 * n);
// Chopin, Scherzo No. 3 Op. 39 (La Pianista, public domain): 20.38-60.6 s of the recording on 0-40, a scripted
// silence on 40-46, the coda 433.5-447.5 s on 46-60 (audio/music.wav, cut by ffmpeg from assets/music).
const OWN_MUSIC = { file: 'audio/music.wav', gain: 0.85 };
const INSTRUMENTS = [];
const CAST = {};
const FORMULAS = {};
// paper, ink, and three washes laid by hand, each reserved for one thing: gold, Romania and the sea, the two flags
const PALETTE = { bg: '#efe5cc', ink: '#1c1510', accent: '#c9a227', dim: '#6f8796', red: '#9b2f2a' };
const TYPE = {
  lang: 'en',
  roles: {
    display: { family: 'Noto Serif SC', files: { 600: 'fonts/NotoSerifSC-600-sub.woff2' }, subsets: ['latin'] },
    text: { family: 'Bodoni Moda', pkg: 'bodoni-moda', version: '5.3.0', weights: [500, 700] },
    mono: null,
  },
  check: { strings: { display: ['华沙', '八十吨黄金 向南', '西线', '越过边境', '康斯坦察', '东线', '布列斯特 联合阅兵', '闪电波兰'],
    text: ['WARSZAWA ŁUCK ŚNIATYŃ CONSTANȚA BRZEŚĆ IX.1939'] }, sizes: { display: 0.05, text: 0.03 } },
};

// Cues: measured onsets of the recording (logs: onsets of segment A and the coda), shared by picture and sound.
const CUES = {
  lid: 0.05, nail1: 1.40, nail2: 2.62, nail3: 3.82, stencil: 4.10,
  road: 4.80, bomb1: 7.07, bomb2: 8.85, swerve: 9.17, bomb3: 10.27,
  map: 12.10, west: 14.85, westB: 16.00,
  station: 21.30, bridge: 27.02, border: 29.22,
  port: 31.17, hoist: 32.17, horn: 36.05,
  turn: 40.00, east: 43.00,
  brest: 46.00, chords: [46.3, 47.03, 47.75, 48.75, 49.53, 50.18, 50.75, 51.23, 51.68, 52.08, 52.75, 54.53],
  sea: 56.05, end: DURATION,
};
const VO = [];
const CAPTIONS = null;
const CAPTION_STYLE = { role: 'display', accentRole: 'display', size: 0.062, caps: false, ink: PALETTE.ink, hi: PALETTE.ink, accent: PALETTE.accent, punch: 0.07 };

const SCENES = [
  { chapter: 'C1', from: 0, to: CUES.road, draw: crateNailed, action: 'a lid slides over the gold bars and a hammer nails it shut', amb: { kind: 'room', gain: 0.05 } },
  { chapter: 'C1', from: CUES.road, to: CUES.map, draw: soon, action: 'the convoy drives south through the night and swerves round the bombs', in: { type: 'cut' }, amb: { kind: 'air', gain: 0.06 } },
  { chapter: 'C1', from: CUES.map, to: CUES.station, draw: soon, action: 'the burin cuts the route south while the west hatching presses in', in: { type: 'cut' }, amb: { kind: 'room', gain: 0.04 } },
  { chapter: 'C2', from: CUES.station, to: CUES.port, draw: soon, action: 'the gold train crosses the border bridge into Romania', in: { type: 'cut' }, amb: { kind: 'air', gain: 0.05 } },
  { chapter: 'C2', from: CUES.port, to: CUES.turn, draw: soon, action: 'a crane hoists the crates aboard and the ship pulls out', in: { type: 'cut' }, amb: { kind: 'water', gain: 0.06 } },
  { chapter: 'C3', from: CUES.turn, to: CUES.brest, draw: soon, action: 'the east hatching closes the road the gold took', in: { type: 'cut' }, amb: { kind: 'room', gain: 0.03 } },
  { chapter: 'C3', from: CUES.brest, to: CUES.sea, draw: brestParade, action: 'two columns of tanks parade past one tribune under two red flags', in: { type: 'cut' }, amb: { kind: 'city', gain: 0.05 } },
  { chapter: 'C3', from: CUES.sea, to: CUES.end, draw: soon, action: 'the ship sails out on the dusk sea with one gold glint', in: { type: 'cut' }, amb: { kind: 'water', gain: 0.05 } },
];

const SFX = [];
const ROOM = { secs: 2.2, decay: 3.2, tone: 5000 };
const ARRANGEMENT = [{ section: 'recording', from: 0, to: CUES.end, parts: [] }];

// ============================== ENGRAVING (this film's own engine) ==============================
// Every tone is lines: up to three hatch families (the second crossing at +57°, the third at -38°) switch on by darkness,
// each line swelling and tapering (styles/engraving.md §2). Shapes are { p: Path2D, b: [x0, y0, x1, y1] } in design units
// (1920 x 1080, origin at the centre); lines live in the shape's own space, so they travel with it and never swim.
const DW = 1920, DH = 1080, INK = PALETTE.ink, PAPER = PALETTE.bg, D2R = Math.PI / 180;
const SH = {
  rect: (x, y, w, h) => { const p = new Path2D(); p.rect(x, y, w, h); return { p, b: [x, y, x + w, y + h] }; },
  poly: (pts) => { const p = new Path2D(); let b = [Infinity, Infinity, -Infinity, -Infinity];
    pts.forEach(([x, y], i) => { i ? p.lineTo(x, y) : p.moveTo(x, y); b = [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)]; });
    p.closePath(); return { p, b }; },
  circle: (x, y, r) => { const p = new Path2D(); p.arc(x, y, r, 0, TAU); return { p, b: [x - r, y - r, x + r, y + r] }; },
  ellipse: (x, y, rx, ry) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, 0, 0, TAU); return { p, b: [x - rx, y - ry, x + rx, y + ry] }; },
  round: (x, y, w, h, r) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return { p, b: [x, y, x + w, y + h] }; },
  join: (...ss) => { const p = new Path2D(); let b = [Infinity, Infinity, -Infinity, -Infinity];
    for (const s of ss) { p.addPath(s.p); b = [Math.min(b[0], s.b[0]), Math.min(b[1], s.b[1]), Math.max(b[2], s.b[2]), Math.max(b[3], s.b[3])]; }
    return { p, b }; },
};
// darkness fields 0..1 (0 = bare paper); light always from the upper left
const TN = {
  lit: (cx, cy, r, base, amt = 0.3, nz = 0.06) => (x, y) => base + amt * ((x - cx) * 0.6 + (y - cy) * 0.8) / r + nz * (noise1(x * 0.021 + y * 0.013 + 3) - 0.5),
  flat: (v) => () => v,
  vgrad: (y0, y1, a, b, nz = 0.04) => (x, y) => lerp(a, b, clamp((y - y0) / (y1 - y0))) + nz * (noise1(x * 0.01 + y * 0.03) - 0.5),
  pool: (cx, cy, r, inner, outer, pw = 1.4) => (x, y) => lerp(inner, outer, Math.pow(clamp(Math.hypot(x - cx, (y - cy) * 1.25) / r), pw)),
};

const paperTex = lazy(() => {                 // laid paper, made once, laid in world space so the camera moves over it
  const c = document.createElement('canvas'); c.width = 2600; c.height = 1600;
  const p = c.getContext('2d'), r = rng(91);
  p.fillStyle = PAPER; p.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 46; i++) {               // the sheet's uneven body
    const x = r() * c.width, y = r() * c.height, rr = 140 + r() * 360, gr = p.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, r() < 0.55 ? 'rgba(255,250,236,0.12)' : 'rgba(160,128,80,0.07)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    p.fillStyle = gr; p.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  p.strokeStyle = '#8a7650'; p.lineWidth = 1;
  for (let y = 0; y < c.height; y += 8.5) { p.globalAlpha = 0.035 + 0.02 * r(); p.beginPath(); p.moveTo(0, y); p.lineTo(c.width, y + r() - 0.5); p.stroke(); }
  for (let x = 30; x < c.width; x += 150) { p.globalAlpha = 0.045; p.beginPath(); p.moveTo(x, 0); p.lineTo(x + 4, c.height); p.stroke(); }
  for (let i = 0; i < 3200; i++) {
    const x = r() * c.width, y = r() * c.height, a = r() * TAU, l = 3 + r() * 11;
    p.globalAlpha = 0.05 + r() * 0.09; p.strokeStyle = r() < 0.55 ? '#a08c62' : '#fffaea'; p.lineWidth = 0.6;
    p.beginPath(); p.moveTo(x, y); p.quadraticCurveTo(x + Math.cos(a) * l / 2 + (r() - 0.5) * 3, y + Math.sin(a) * l / 2 + (r() - 0.5) * 3, x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke();
  }
  p.globalAlpha = 1;
  for (let i = 0; i < 30; i++) {               // foxing
    const x = r() * c.width, y = r() * c.height, rr = 2 + r() * 12, gr = p.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, 'rgba(150,100,45,0.18)'); gr.addColorStop(1, 'rgba(150,100,45,0)'); p.fillStyle = gr; p.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  return c;
});

// the camera: cam = { x, y, z } in design units; f < 1 = a far layer (parallax), zf = its own extra zoom (dolly zoom)
function camView(g, S, cam = {}, f = 1, zf = 1) {
  const z = (1 + ((cam.z ?? 1) - 1) * f) * zf, sc = S.W / DW * z;
  g.setTransform(sc, 0, 0, sc, S.W / 2 - (cam.x ?? 0) * f * sc, S.H / 2 - (cam.y ?? 0) * f * sc);
}
function stage(g, S, cam = {}) { camView(g, S, cam); g.drawImage(paperTex(), -1300, -800); }

function emitRun(g, r, nx, ny) {
  const n = r.length / 3; if (n < 2) return;
  const hw = (i) => { const u = i / (n - 1), tp = Math.max(0, Math.min(1, u / 0.22, (1 - u) / 0.22)); return r[i * 3 + 2] * 0.5 * (0.16 + 0.84 * Math.pow(tp, 0.7)); };
  g.moveTo(r[0] + nx * hw(0), r[1] + ny * hw(0));
  for (let i = 1; i < n; i++) g.lineTo(r[i * 3] + nx * hw(i), r[i * 3 + 1] + ny * hw(i));
  for (let i = n - 1; i >= 0; i--) g.lineTo(r[i * 3] - nx * hw(i), r[i * 3 + 1] - ny * hw(i));
  g.closePath();
}
function hatchLines(g, box, angDeg, sp, wmax, th, tone, phase = 0) {
  const a = angDeg * D2R, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  const [x0, y0, x1, y1] = box; let n0 = Infinity, n1 = -Infinity, d0 = Infinity, d1 = -Infinity;
  for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) {
    const n = x * nx + y * ny, d = x * dx + y * dy; n0 = Math.min(n0, n); n1 = Math.max(n1, n); d0 = Math.min(d0, d); d1 = Math.max(d1, d);
  }
  const step = Math.max(2.5, sp * 0.75);
  for (let o = Math.ceil((n0 - phase) / sp) * sp + phase; o <= n1; o += sp) {
    const li = Math.round(o / sp), jit = 0.82 + 0.36 * hash1(li * 7.31 + angDeg * 0.37);
    let run = null;
    for (let s = d0 - step; s <= d1 + step; s += step) {
      const x = nx * o + dx * s, y = ny * o + dy * s, v = tone(x, y);
      const w = v > th ? wmax * jit * Math.pow(Math.min(1, (v - th) / 0.34), 0.8) : 0;
      if (w > 0.14) (run ??= []).push(x, y, w);
      else if (run) { emitRun(g, run, nx, ny); run = null; }
    }
    if (run) emitRun(g, run, nx, ny);
  }
}
function wash(g, s, color, a = 0.6) {          // transparent watercolour: spills a little, a darker tide line at the wet edge
  g.save(); g.globalCompositeOperation = 'multiply'; g.translate(1.8, 1.2);
  g.globalAlpha = a; g.fillStyle = color; g.fill(s.p);
  g.globalAlpha = a * 0.45; g.lineWidth = 2.4; g.strokeStyle = color; g.stroke(s.p); g.restore();
}
function contour(g, s, w = 2) {               // fine toward the light, heavier on the far side (kept outside the shape)
  g.save(); g.strokeStyle = INK; g.lineJoin = 'round'; g.lineWidth = w * 0.5; g.stroke(s.p);
  const out = new Path2D(); out.rect(-6000, -6000, 12000, 12000); out.addPath(s.p);
  g.clip(out, 'evenodd'); g.translate(w * 0.45, w * 0.55); g.lineWidth = w; g.stroke(s.p); g.restore();
}
const FAMS = [[0, 0.12, 1, 1], [57, 0.47, 0.84, 1.1], [-38, 0.76, 0.68, 1.28]];
// engrave(g, shape, { angle, tone, sp, w, wash, washA, line, knock, fams, phase })
function engrave(g, s, o = {}) {
  const tone = typeof o.tone === 'function' ? o.tone : TN.flat(o.tone ?? 0.4);
  g.save();
  if (o.knock !== false) { g.fillStyle = o.knock || PAPER; g.fill(s.p); }
  if (o.wash) wash(g, s, o.wash, o.washA ?? 0.6);
  g.clip(s.p); g.beginPath();
  const a = o.angle ?? 35, sp = o.sp ?? 6.4, w = o.w ?? 2.7;
  for (const [da, th, wk, sk] of o.fams ?? FAMS) hatchLines(g, s.b, a + da, sp * sk, w * wk, th, tone, o.phase ?? 0);
  g.fillStyle = INK; g.fill(); g.restore();
  if (o.line) contour(g, s, o.line);
}
function burst(g, x, y, k, r0 = 18, r1 = 70, n = 11, w = 2.4) {   // short engraved rays round an impact, k 0..1
  if (k <= 0 || k >= 1) return;
  g.save(); g.fillStyle = INK; g.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + hash1(i + 40) * 0.4, a0 = lerp(r0, r1 * 0.6, EASE.out(k)), a1 = lerp(r0 * 1.4, r1, EASE.out(k));
    const run = []; for (let j = 0; j <= 6; j++) { const d = lerp(a0, a1, j / 6); run.push(x + Math.cos(a) * d, y + Math.sin(a) * d, w * (1 - k)); }
    emitRun(g, run, -Math.sin(a), Math.cos(a));
  }
  g.fill(); g.restore();
}

// Lettering belongs to the plate: cut glyph by glyph (a clip opens across each letter like a burin run), never faded.
function cutText(g, S, str, x, y, px, k, o = {}) {
  const role = o.role ?? 'display';
  g.save();
  if (!o.world) g.setTransform(S.W / DW, 0, 0, S.W / DW, 0, 0);
  setType(g, TYPE, role, px, { weight: o.weight ?? (role === 'display' ? 600 : 500), track: o.track ?? (role === 'text' ? 0.16 : 0.08), short: DH });
  g.textBaseline = 'alphabetic'; g.fillStyle = o.color ?? INK;
  const chars = [...str], ws = chars.map((c) => g.measureText(c).width), gap = px * (o.track ?? (role === 'text' ? 0.16 : 0.08));
  const total = ws.reduce((a, b) => a + b, 0) + gap * (chars.length - 1);
  let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
  const n = chars.length, spread = o.spread ?? 0.7;
  g.letterSpacing = '0px';
  chars.forEach((c, i) => {
    const p = clamp((k - (i / n) * spread) / (1 - spread));
    if (p > 0) {
      g.save(); g.beginPath(); g.rect(cx - 2, y - px * 1.2, (ws[i] + 4) * EASE.out(p), px * 1.6); g.clip();
      g.fillText(c, cx, y); g.restore();
      if (p < 1 && c.trim()) { g.fillStyle = '#fff8e0'; g.beginPath(); g.arc(cx + ws[i] * EASE.out(p), y - px * 0.35, px * 0.05, 0, TAU); g.fill(); g.fillStyle = o.color ?? INK; }
    }
    cx += ws[i] + gap;
  });
  g.restore();
}
// a plate caption: a small roman line (place and date) over the Chinese line; k = how far the cutting has gone
function caption(g, S, latin, zh, k, o = {}) {
  const x = o.x ?? 96, y = o.y ?? 968, al = o.align ?? 'left';
  if (latin) cutText(g, S, latin, x, y - 74, 34, clamp(k * 1.6), { role: 'text', align: al, track: 0.2 });
  if (zh) cutText(g, S, zh, x, y, 60, clamp(k * 1.6 - 0.35), { role: 'display', align: al });
}
function plateFrame(g, S) {                   // the plate mark: a pressed rule and a hairline, fixed to the sheet's edge
  g.save(); g.setTransform(S.W / DW, 0, 0, S.W / DW, 0, 0); g.strokeStyle = INK;
  g.lineWidth = 3.2; g.strokeRect(34, 34, DW - 68, DH - 68);
  g.lineWidth = 1; g.strokeRect(46, 46, DW - 92, DH - 92);
  g.restore();
}
function soon(g, k, t, S) { stage(g, S); plateFrame(g, S); }   // scenes not built yet (removed before the draft)

// ---- the gold bar: a frustum seen from above, its four slopes lit by the upper-left light, every face gold-washed
function goldBar(g, x, y, w, h, seed) {
  const i = 13, X = x + w, Y = y + h;
  const faces = [
    [SH.poly([[x + i, y + i], [X - i, y + i], [X - i, Y - i], [x + i, Y - i]]), 0.14, 0],      // top
    [SH.poly([[x, y], [X, y], [X - i, y + i], [x + i, y + i]]), 0.3, 0],                       // north slope, lit
    [SH.poly([[x, y], [x + i, y + i], [x + i, Y - i], [x, Y]]), 0.26, 90],                     // west slope, lit
    [SH.poly([[x, Y], [x + i, Y - i], [X - i, Y - i], [X, Y]]), 0.62, 0],                      // south slope, shade
    [SH.poly([[X, y], [X, Y], [X - i, Y - i], [X - i, y + i]]), 0.66, 90],                     // east slope, shade
  ];
  for (const [s, v, a] of faces) engrave(g, s, { tone: TN.lit(x + w / 2, y + h / 2, w, v, 0.12, 0.05), angle: a, sp: 5.2, w: 2.1, wash: PALETTE.accent, washA: 0.72, line: 1.2 });
  const st = SH.rect(x + w * 0.32, y + h * 0.32, w * 0.36, h * 0.36);                         // the bank's stamp
  engrave(g, st, { tone: 0.5, angle: 45, sp: 3.6, w: 1.3, knock: false, line: 1, fams: [[0, 0.12, 1, 1]] });
  const r = rng(seed); g.save(); g.fillStyle = '#fffbe8'; g.globalAlpha = 0.85;                // burnished glints
  for (let n = 0; n < 3; n++) { g.beginPath(); g.ellipse(x + i + r() * (w - 2 * i), y + i + 4 + r() * 8, 6 + r() * 10, 1.2, 0, 0, TAU); g.fill(); }
  g.restore();
}
function plank(g, x, y, w, h, seed, base = 0.42) {            // a board: grain along it, knots, a dark seam
  const r = rng(seed), kx = x + w * (0.2 + 0.6 * r()), ky = y + h * (0.3 + 0.4 * r());
  const tone = (px, py) => base + 0.16 * (noise1(px * 0.006 + seed) - 0.5) + 0.18 * Math.max(0, 1 - Math.hypot((px - kx) * 0.5, py - ky) / 26) + 0.12 * (py - y) / h;
  const s = SH.rect(x, y, w, h);
  engrave(g, s, { tone, angle: 0, sp: 5.6, w: 2.2, fams: [[0, 0.12, 1, 1], [8, 0.55, 0.7, 1.4]], line: 1.6 });
}

// ---- Scene 1 (0-4.8): Warsaw, the vault. The lid slides over the gold, the hammer nails it, the stencil is cut.
function crateNailed(g, k, t, S) {
  // pan, 4.8 s, ease-out, left to right across the crate, with a slow 6% push
  const cam = { x: lerp(-110, 90, EASE.out(k)), y: lerp(10, -10, k), z: lerp(1.04, 1.1, EASE.inOut(k)) };
  const nails = [CUES.nail1, CUES.nail2, CUES.nail3], hitAge = Math.min(...nails.map((c) => (t >= c ? t - c : 9)));
  const jolt = hitAge < 0.25 ? Math.sin(hitAge * 60) * 6 * (1 - hitAge / 0.25) : 0;
  stage(g, S, { ...cam, y: cam.y + jolt * 0.4 });
  // the vault floor, lit by one lamp above the crate
  engrave(g, SH.rect(-1300, -800, 2600, 1600), { tone: TN.pool(-60, -40, 980, 0.32, 1.0), angle: 0, sp: 6.6, w: 3, knock: false });
  for (let j = -6; j <= 6; j++) { g.save(); g.fillStyle = INK; g.globalAlpha = 0.55; g.fillRect(-1300, j * 120 - 2, 2600, 3); g.restore(); }
  // the crate: rim boards and its shadow
  engrave(g, SH.poly([[-600, -320], [660, -320], [700, 360], [-560, 360]]), { tone: 0.9, angle: -20, sp: 5.4, knock: false });
  const X0 = -620, Y0 = -330, CW = 1240, CH = 660, rim = 46;
  engrave(g, SH.rect(X0 + rim, Y0 + rim, CW - 2 * rim, CH - 2 * rim), { tone: 0.78, angle: 90, sp: 5.6, line: 2 });
  for (let row = 0; row < 4; row++) for (let col = 0; col < 6; col++)
    goldBar(g, X0 + rim + 14 + col * 188, Y0 + rim + 18 + row * 140, 172, 118, row * 6 + col + 1);
  plank(g, X0, Y0, CW, rim, 3, 0.36); plank(g, X0, Y0 + CH - rim, CW, rim, 4, 0.5);
  g.save(); g.translate(X0, Y0); g.rotate(Math.PI / 2); plank(g, 0, -rim, CH, rim, 5, 0.34); g.restore();
  g.save(); g.translate(X0 + CW, Y0); g.rotate(Math.PI / 2); plank(g, 0, 0, CH, rim, 6, 0.52); g.restore();
  // the lid: three boards and two battens slide in from the right, fastest at frame 0
  const lx = lerp(1350, 0, EASE.out(clamp((t - CUES.lid) / 1.25))) + jolt;
  g.save(); g.translate(lx, 0);
  engrave(g, SH.rect(X0 + 26, Y0 + 30, CW, CH), { tone: 0.94, angle: -30, sp: 5, knock: false });   // its shadow
  for (let b = 0; b < 3; b++) plank(g, X0, Y0 + b * (CH / 3), CW, CH / 3, 20 + b, 0.3 + b * 0.05);
  for (const bx of [X0 + 120, X0 + CW - 190]) plank(g, bx, Y0 - 6, 70, CH + 12, 30 + bx, 0.46);
  // stencil, cut letter by letter once the nails are in
  cutText(g, S, 'BANK POLSKI', X0 + CW / 2, Y0 + CH / 2 + 34, 92, clamp((t - CUES.stencil) / 0.7), { role: 'text', weight: 700, world: true, align: 'center', track: 0.3, color: '#2a1d14' });
  // nail heads appear on their strike
  const nx = [X0 + 155, X0 + CW / 2, X0 + CW - 155];
  nails.forEach((c, i) => {
    if (t < c) return;
    const s = SH.circle(nx[i], Y0 + 50, 13);
    engrave(g, s, { tone: TN.lit(nx[i], Y0 + 50, 13, 0.35, 0.5), angle: 45, sp: 3.4, w: 1.6, line: 1.4 });
    burst(g, nx[i], Y0 + 50, (t - c) / 0.22);
  });
  g.restore();
  // the hammer: raised with anticipation, strikes on the cue, rebounds; it travels from nail to nail
  const ni = nails.findIndex((c) => t < c + 0.45), idx = ni < 0 ? 2 : ni, c = nails[idx];
  const hx = nx[idx], hy = Y0 + 50, dtc = t - c;
  let ang = dtc < -0.55 ? -0.9 : dtc < -0.1 ? lerp(-0.9, -1.25, EASE.inOut((dtc + 0.55) / 0.45)) : dtc < 0 ? lerp(-1.25, 0, EASE.in((dtc + 0.1) / 0.1)) : -0.35 * MOTION.spring(dtc, 0.5, 3) - 0.0;
  if (t < 0.9) ang = -0.9 - 0.25 * (1 - t / 0.9);
  const handle = 470, px = hx + 30 + handle, py = hy - 20;
  g.save(); g.translate(px, py); g.rotate(ang);
  engrave(g, SH.round(-handle, -16, handle + 40, 32, 10), { tone: TN.lit(-handle / 2, 0, 200, 0.42, 0.25), angle: 0, sp: 5, w: 2.2, line: 1.8 });
  engrave(g, SH.round(-handle - 46, -64, 92, 128, 8), { tone: TN.lit(-handle, -20, 60, 0.6, 0.3), angle: 90, sp: 4.6, w: 2.3, line: 2.2 });
  g.restore();
  caption(g, S, 'WARSZAWA · IX.1939', '华沙', clamp((t - 0.6) / 1.4));
  plateFrame(g, S);
}

// ---- Scene 7 (46-56.05): Brest, 22 Sept. A locked frontal frame; tanks of both armies pass the tribune on the coda's chords.
function soldierRow(n, x0, x1, y, h) {         // standing men far off: helmet, shoulders, a rifle every few
  const p = new Path2D(), dx = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * dx + dx / 2;
    p.ellipse(x, y - h * 0.86, h * 0.13, h * 0.1, 0, Math.PI, TAU); p.rect(x - h * 0.16, y - h * 0.84, h * 0.32, h * 0.6);
    p.rect(x - h * 0.12, y - h * 0.26, h * 0.1, h * 0.26); p.rect(x + h * 0.02, y - h * 0.26, h * 0.1, h * 0.26);
    if (i % 3 === 0) p.rect(x + h * 0.15, y - h * 1.15, 3, h * 0.6);
  }
  return { p, b: [x0, y - h * 1.2, x1, y] };
}
function figure(x, y, h, salute) {             // an officer on the tribune, a silhouette at distance
  const p = new Path2D();
  p.arc(x, y - h * 0.86, h * 0.075, 0, TAU);
  p.rect(x - h * 0.12, y - h * 0.97, h * 0.24, h * 0.05);
  p.moveTo(x - h * 0.13, y - h * 0.76); p.lineTo(x + h * 0.13, y - h * 0.76); p.lineTo(x + h * 0.16, y - h * 0.3); p.lineTo(x - h * 0.16, y - h * 0.3); p.closePath();
  p.rect(x - h * 0.1, y - h * 0.3, h * 0.08, h * 0.3); p.rect(x + h * 0.02, y - h * 0.3, h * 0.08, h * 0.3);
  if (salute) { p.moveTo(x + h * 0.1, y - h * 0.74); p.lineTo(x + h * 0.2, y - h * 0.86); p.lineTo(x + h * 0.08, y - h * 0.92); p.lineTo(x + h * 0.04, y - h * 0.86); p.closePath(); }
  return { p, b: [x - h * 0.25, y - h, x + h * 0.25, y] };
}
function flag(x, y, w, h, t, ph) {             // cloth on a pole: three folds travelling down the fly
  const pts = [], wav = (u) => Math.sin(u * 7 - t * 4.2 + ph) * 12 * u;
  for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([x + u * w, y + wav(u)]); }
  for (let i = 24; i >= 0; i--) { const u = i / 24; pts.push([x + u * w * (1 - 0.04 * u), y + h + wav(u) * 1.1]); }
  return { s: SH.poly(pts), tone: (px) => 0.2 + 0.3 * (0.5 + 0.5 * Math.cos(((px - x) / w) * 7 - t * 4.2 + ph + 1.2)) };
}
function tank(g, kind, x, y, t) {             // side view, facing right; wheels turn with the distance travelled
  const big = kind === 'bt';
  const hull = big ? SH.poly([[-250, -40], [150, -40], [250, 8], [235, 40], [-250, 40]]) : SH.poly([[-235, -46], [170, -46], [232, -6], [232, 40], [-235, 40]]);
  const track = SH.round(-260, 18, 515, 96, 48);
  g.save(); g.translate(x, y);
  engrave(g, SH.ellipse(0, 128, 300, 18), { tone: 0.85, angle: 0, sp: 5, knock: false });                       // shadow
  engrave(g, track, { tone: TN.lit(0, 60, 260, 0.72, 0.2), angle: 0, sp: 5.2, w: 2.6, line: 2.2 });
  const wheels = big ? [-190, -64, 62, 188] : [-196, -118, -40, 38, 116, 194], wr = big ? 46 : 32;
  for (const wx of wheels) {
    engrave(g, SH.circle(wx, 66, wr), { tone: TN.lit(wx, 66, wr, 0.42, 0.45), angle: 30, sp: 4.6, w: 2, line: 1.8 });
    const rot = -x / wr;
    g.save(); g.fillStyle = INK; for (let s = 0; s < 6; s++) { const a = rot + s * TAU / 6; g.beginPath(); g.arc(wx + Math.cos(a) * wr * 0.62, 66 + Math.sin(a) * wr * 0.62, 3.2, 0, TAU); g.fill(); } g.restore();
  }
  engrave(g, hull, { tone: TN.lit(0, 0, 260, 0.36, 0.3), angle: 12, sp: 5.4, w: 2.6, line: 2.4 });
  const tur = big ? SH.poly([[-90, -40], [70, -40], [90, -78], [60, -112], [-70, -112], [-100, -78]]) : SH.poly([[-60, -46], [80, -46], [96, -96], [-50, -104]]);
  engrave(g, SH.rect(big ? 80 : 90, big ? -86 : -82, big ? 230 : 110, big ? 12 : 14), { tone: 0.62, angle: 0, sp: 4.2, w: 1.8, line: 1.6 });  // gun
  engrave(g, tur, { tone: TN.lit(0, -76, 100, 0.34, 0.35), angle: -20, sp: 5, w: 2.4, line: 2.2 });
  engrave(g, SH.circle(big ? -10 : 10, big ? -116 : -106, 16), { tone: 0.55, angle: 45, sp: 4, w: 1.6, line: 1.4 });  // hatch
  g.restore();
}
function brestParade(g, k, t, S) {
  // locked frontal frame with a <=2% breathing push; one dolly zoom (49.5-52.5) swells the town behind the tribune
  const cam = { x: 0, y: 0, z: 1 + 0.02 * EASE.inOut(k) };
  const dz = 1 + 0.16 * EASE.inOut(clamp((t - 49.5) / 3));
  stage(g, S, cam);
  camView(g, S, cam, 0.6, dz);
  engrave(g, SH.rect(-1300, -800, 2600, 760), { tone: TN.vgrad(-560, -40, 0.1, 0.34), angle: 0, sp: 7, w: 2, knock: false, fams: [[0, 0.12, 1, 1]] });  // cold sky
  // the town: a row of facades with windows
  const r = rng(77);
  let fx = -1250;
  while (fx < 1250) {
    const fw = 150 + r() * 170, fh = 220 + r() * 160, top = 60 - fh;
    engrave(g, SH.poly([[fx, 60], [fx, top], [fx + fw * 0.5, top - 40 - r() * 30], [fx + fw, top], [fx + fw, 60]]), { tone: TN.lit(fx + fw / 2, top + fh / 2, fw, 0.36 + r() * 0.12, 0.2), angle: 90, sp: 5.8, w: 2.2, line: 1.6 });
    const cols = Math.floor(fw / 52), rows = Math.floor((fh - 50) / 70);
    for (let a = 0; a < cols; a++) for (let b = 0; b < rows; b++) {
      const wx = fx + 22 + a * ((fw - 44) / cols) + 6, wy = top + 30 + b * 70;
      engrave(g, SH.rect(wx, wy, 20, 36), { tone: 0.82, angle: 90, sp: 4, w: 1.8, line: 1 });
    }
    fx += fw + 6;
  }
  camView(g, S, cam);
  // the square
  engrave(g, SH.rect(-1300, 40, 2600, 800), { tone: TN.vgrad(40, 540, 0.24, 0.5), angle: 4, sp: 6.4, w: 2.4, knock: false, fams: [[0, 0.12, 1, 1], [57, 0.47, 0.8, 1.1]] });
  // flags: two poles, one red for both
  for (const [px, ph] of [[-440, 0], [440, 1.7]]) {
    engrave(g, SH.rect(px - 7, -470, 14, 680), { tone: TN.lit(px, 0, 20, 0.4, 0.4), angle: 90, sp: 4, w: 1.6, line: 1.4 });
    const f = flag(px + 7, -458, 270, 170, t, ph);
    engrave(g, f.s, { tone: f.tone, angle: 70, sp: 5.2, w: 2.2, wash: PALETTE.red, washA: 0.78, line: 1.8 });
  }
  // soldiers in ranks on both sides
  engrave(g, soldierRow(16, -960, -560, 168, 74), { tone: 0.78, angle: 80, sp: 4.2, w: 1.8, line: 1 });
  engrave(g, soldierRow(16, 560, 960, 168, 74), { tone: 0.78, angle: 80, sp: 4.2, w: 1.8, line: 1 });
  // the tribune: a stepped wooden stand, railing, two officers side by side
  engrave(g, SH.poly([[-300, 210], [300, 210], [270, 40], [-270, 40]]), { tone: TN.lit(0, 120, 300, 0.5, 0.2), angle: 0, sp: 5.4, w: 2.4, line: 2 });
  engrave(g, SH.rect(-270, 18, 540, 24), { tone: 0.3, angle: 0, sp: 5, w: 2, line: 1.6 });
  for (let i = 0; i <= 10; i++) engrave(g, SH.rect(-262 + i * 52, -40, 8, 60), { tone: 0.5, angle: 90, sp: 3.6, w: 1.4, line: 1 });
  engrave(g, SH.rect(-270, -46, 540, 10), { tone: 0.35, angle: 0, sp: 4, w: 1.6, line: 1.2 });
  engrave(g, figure(-60, 18, 120, false), { tone: 0.84, angle: 75, sp: 3.8, w: 1.8, line: 1.2 });
  engrave(g, figure(60, 18, 124, true), { tone: 0.84, angle: 105, sp: 3.8, w: 1.8, line: 1.2 });
  // the column: one tank on each chord, the two armies taking turns
  const v = 760;
  CUES.chords.forEach((c, i) => {
    const x = (t - c) * v;
    if (x > -1500 && x < 1500) tank(g, i % 2 ? 'bt' : 'pz', x, 318, t);
  });
  caption(g, S, 'BRZEŚĆ · 22.IX.1939', '布列斯特 联合阅兵', clamp((t - CUES.brest - 0.4) / 1.6), { x: 1824, align: 'right', y: 120 + 74 });
  plateFrame(g, S);
}

function score(ctx, out) {}                 // the music is the recording (OWN_MUSIC)

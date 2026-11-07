// ---- Scene 2 (4.80-12.10): the night road. The convoy runs south with dimmed lamps; bombs fall ahead; it swerves.
function wheel(g, x, y, r, rot, tone = 0.55) {
  engrave(g, SH.circle(x, y, r), { tone: TN.lit(x, y, r, tone, 0.4), angle: 30, sp: 4.2, w: 1.9, line: 1.6 });
  engrave(g, SH.circle(x, y, r * 0.45), { tone: 0.3, angle: 0, sp: 3.6, w: 1.4, line: 1 });
  g.save(); g.fillStyle = INK; for (let s = 0; s < 5; s++) { const a = rot + s * TAU / 5; g.beginPath(); g.arc(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3, 2.4, 0, TAU); g.fill(); } g.restore();
}
function lampBeam(g, x, y, len, spread, k = 1) {   // a dimmed headlamp: a cone of bare paper cut out of the night
  const s = SH.poly([[x, y - 6], [x + len, y - spread * 0.35], [x + len, y + spread], [x, y + 6]]);
  engrave(g, s, { tone: (px) => 0.05 + 0.32 * clamp((px - x) / len), angle: -4, sp: 7, w: 1.6, knock: 'rgba(243,234,210,' + (0.9 * k).toFixed(2) + ')', fams: [[0, 0.12, 1, 1]] });
}
function bus(g, x, y, t, seed) {              // a 1930s city bus pressed into service: rounded roof, a row of windows, two axles
  g.save(); g.translate(x, y);
  lampBeam(g, 205, 40, 420, 120);
  const body = SH.poly([[-210, 70], [-210, -70], [-180, -100], [170, -100], [200, -70], [212, -10], [212, 70]]);
  engrave(g, body, { tone: TN.lit(0, -20, 220, 0.6, 0.22), angle: 0, sp: 5, w: 2.6, line: 2.2 });
  for (let i = 0; i < 6; i++) engrave(g, SH.rect(-180 + i * 58, -78, 44, 52), { tone: 0.92, angle: 90, sp: 3.8, w: 1.8, line: 1.2 });
  engrave(g, SH.rect(-210, 2, 422, 10), { tone: 0.35, angle: 0, sp: 3.6, w: 1.4, line: 1 });
  engrave(g, SH.circle(204, 38, 9), { tone: 0.04, knock: '#fff6dc', line: 1.4 });
  const rot = x / 46; wheel(g, -130, 74, 40, rot); wheel(g, 128, 74, 40, rot);
  g.restore();
}
function truck(g, x, y, t, seed) {            // a covered lorry: cab, bonnet, canvas tilt over the crates, three wheels
  g.save(); g.translate(x, y);
  lampBeam(g, 222, 34, 420, 120);
  engrave(g, SH.poly([[-230, 50], [-230, -80], [-216, -104], [60, -104], [74, -80], [74, 50]]), { tone: TN.lit(-80, -40, 200, 0.5, 0.2), angle: 90, sp: 5.2, w: 2.4, line: 2.2,
    fams: [[0, 0.12, 1, 1], [57, 0.47, 0.84, 1.1], [-38, 0.76, 0.68, 1.28]] });                                       // canvas tilt
  for (let i = 1; i < 5; i++) engrave(g, SH.rect(-230 + i * 60, -100, 5, 150), { tone: 0.8, angle: 90, sp: 3, w: 1.3, knock: false });
  engrave(g, SH.poly([[74, 54], [74, -64], [150, -64], [168, -14], [226, -8], [226, 54]]), { tone: TN.lit(150, 0, 120, 0.56, 0.24), angle: 0, sp: 5, w: 2.4, line: 2.2 });
  engrave(g, SH.rect(92, -52, 52, 38), { tone: 0.9, angle: 90, sp: 3.6, w: 1.6, line: 1.2 });
  engrave(g, SH.circle(218, 32, 8), { tone: 0.04, knock: '#fff6dc', line: 1.4 });
  const rot = x / 38; wheel(g, -170, 64, 34, rot); wheel(g, -96, 64, 34, rot); wheel(g, 168, 64, 34, rot);
  g.restore();
}
function blast(g, x, y, age) {                // a bomb on the road: flash, rays, then a rising column of smoke
  if (age < 0 || age > 2.6) return;
  const fl = clamp(1 - age / 0.35);
  if (fl > 0) engrave(g, SH.circle(x, y, 60 + 160 * EASE.out(clamp(age / 0.3))), { tone: (px, py) => 0.04 + 0.4 * clamp(Math.hypot(px - x, py - y) / 220), angle: 0, sp: 8, w: 1.4, knock: 'rgba(255,248,226,' + (0.95 * fl).toFixed(2) + ')', fams: [[0, 0.12, 1, 1]] });
  burst(g, x, y, age / 0.5, 40, 260, 15, 4);
  for (let i = 0; i < 6; i++) {
    const a = clamp(age / 2.6), rr = 40 + i * 14 + a * 90, cy = y - 30 - i * 46 * EASE.out(clamp(age / 1.4)) - a * 80;
    engrave(g, SH.circle(x + (hash1(i + 9) - 0.5) * 70 + a * 60, cy, rr), { tone: TN.lit(x, cy, rr, 0.62 - 0.25 * a, 0.3), angle: 60 + i * 15, sp: 5.6, w: 2.2, line: 1.4 * (1 - a) });
  }
}
function convoyNight(g, k, t, S) {
  // tracking shot, 7.3 s, constant, along the convoy from the roadside; it drifts forward in frame
  const lt = t - CUES.road, cam = { x: 260 * lt, y: 0, z: 1 };
  stage(g, S, cam);
  camView(g, S, cam, 0.15);
  engrave(g, SH.rect(-1300 + cam.x * 0.15, -800, 2600, 900), { tone: TN.vgrad(-560, 60, 0.92, 0.72, 0.05), angle: 0, sp: 6.4, w: 2.8, knock: false });   // night sky
  camView(g, S, cam, 0.35);
  const r = rng(8), x0 = Math.floor((cam.x * 0.35 - 1400) / 90) * 90;
  const hills = []; for (let x = x0; x < x0 + 2900; x += 30) hills.push([x, -40 - 50 * noise1(x * 0.004 + 2) - 30 * noise1(x * 0.02)]);
  engrave(g, SH.poly([...hills, [x0 + 2900, 200], [x0, 200]]), { tone: 0.8, angle: 15, sp: 5.6, w: 2.6, line: 1.6 });                     // far ridge
  // a plane far up, crossing before the first bomb (no siren: a drone in the score)
  const pa = clamp((t - 5.6) / 2.4);
  if (pa > 0 && pa < 1) { const px = cam.x * 0.35 - 900 + pa * 1800, py = -380 + pa * 40; g.save(); g.translate(px, py);
    engrave(g, SH.poly([[-60, 0], [50, -6], [64, 0], [50, 6]]), { tone: 0.9, angle: 0, sp: 3, line: 1.4 });
    engrave(g, SH.poly([[-6, -2], [20, -2], [6, -44], [-6, -44]]), { tone: 0.9, angle: 0, sp: 3, line: 1.2 });
    engrave(g, SH.poly([[-6, 2], [20, 2], [6, 30], [-6, 30]]), { tone: 0.9, angle: 0, sp: 3, line: 1.2 }); g.restore(); }
  camView(g, S, cam, 0.7);
  for (let i = Math.floor((cam.x * 0.7 - 1300) / 230); i < Math.floor((cam.x * 0.7 + 1300) / 230); i++) {   // poplars along the verge
    const tx = i * 230 + hash1(i) * 60, th = 300 + hash1(i + 50) * 120;
    engrave(g, SH.ellipse(tx, 120 - th / 2, 34 + hash1(i + 5) * 10, th / 2), { tone: TN.lit(tx, 120 - th / 2, 60, 0.72, 0.25), angle: 80, sp: 4.6, w: 2.2, line: 1.4 });
    engrave(g, SH.rect(tx - 5, 110, 10, 40), { tone: 0.8, angle: 90, sp: 3, w: 1.4 });
  }
  camView(g, S, cam);
  engrave(g, SH.rect(cam.x - 1300, 140, 2600, 700), { tone: TN.vgrad(140, 540, 0.7, 0.86), angle: 3, sp: 6, w: 2.6, knock: false });   // the road
  const blasts = [CUES.bomb1, CUES.bomb2, CUES.bomb3];
  blasts.forEach((c, i) => blast(g, 260 * (c - CUES.road) + 760 + i * 40, 210, t - c));
  const sw = Math.sin(clamp((t - CUES.swerve) / 1.2) * Math.PI) * 46;          // the swerve round the second crater
  const v = 320;                               // the convoy runs a little faster than the camera
  const units = [[bus, -980], [truck, -400], [bus, 180], [truck, 760]];
  units.forEach(([f, off], i) => {
    const x = off + v * lt - 40, lag = i * 0.12, bob = Math.sin((t + i) * 9) * 2.2;
    f(g, x, 290 + bob + sw * clamp((t - CUES.swerve - lag) / 0.4) * (i % 2 ? 1 : 0.8), t, i);
  });
  caption(g, S, 'IX.1939 · 80 T', '八十吨黄金 向南', clamp((t - CUES.road - 0.5) / 1.6));
  plateFrame(g, S);
}

// ---- the map plate, shared by S3 and S6: Poland in 1939, the route cut by the burin, two fronts of hatching
const GEO = { lon0: 23.4, lat0: 51.4, k: 44 };
const geo = (lon, lat) => [(lon - GEO.lon0) * GEO.k, -(lat - GEO.lat0) * GEO.k * 1.55];
const POLAND = [[17.9, 54.8], [18.55, 54.75], [18.8, 54.3], [19.3, 53.6], [20.2, 53.2], [21.5, 53.1], [22.6, 53.6], [22.9, 54.3], [23.5, 54.35], [24.6, 54.1],
  [25.4, 54.6], [26.6, 55.6], [27.6, 55.2], [28.2, 54.6], [27.6, 53.6], [26.9, 52.9], [27.8, 51.7], [27.3, 50.9], [26.6, 50.3], [26.2, 49.8], [26.4, 48.9],
  [25.9, 48.3], [25.2, 48.0], [24.6, 48.1], [23.5, 48.9], [22.6, 49.05], [21.6, 49.4], [20.9, 49.35], [19.8, 49.2], [19.0, 49.5], [18.6, 49.9], [17.9, 50.05],
  [18.4, 50.4], [18.2, 51.1], [17.4, 51.2], [16.9, 51.6], [16.3, 51.95], [16.0, 52.4], [16.2, 52.9], [16.8, 53.2], [17.0, 53.7], [17.4, 54.2], [17.6, 54.6]];
const ROMANIA = [[22.6, 49.05], [23.5, 48.9], [24.6, 48.1], [25.2, 48.0], [25.9, 48.3], [26.6, 48.2], [28.2, 47.9], [29.6, 46.4], [29.0, 45.2], [27.0, 44.6], [22.4, 44.8], [21.2, 46.4], [22.0, 47.8]];
const CITIES = { 'WARSZAWA': [21.0, 52.23], 'LUBLIN': [22.57, 51.25], 'ŁUCK': [25.33, 50.75], 'BRZEŚĆ': [23.65, 52.1], 'ŚNIATYŃ': [25.57, 48.45] };
const ROUTE = [[21.0, 52.23], [21.9, 51.7], [22.57, 51.25], [23.9, 50.95], [25.33, 50.75], [25.6, 50.0], [25.5, 49.2], [25.57, 48.45], [26.0, 47.9]];
function routeAt(u) {                          // a point u (0..1) along the route and the cut so far
  const P = ROUTE.map(([a, b]) => geo(a, b)), L = [0];
  for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const d = u * L[L.length - 1], pts = [P[0]];
  let i = 1; while (i < P.length && L[i] < d) { pts.push(P[i]); i++; }
  if (i < P.length) { const f = (d - L[i - 1]) / (L[i] - L[i - 1]); pts.push([lerp(P[i - 1][0], P[i][0], f), lerp(P[i - 1][1], P[i][1], f)]); }
  return pts;
}
function mapPlate(g, S, t, o) {               // o: { west 0..1, east 0..1, route 0..1, romania wash 0..1, dot (show the gold) }
  const R = 470;
  engrave(g, SH.circle(0, 0, R + 26), { tone: 0.1, angle: 0, sp: 3, w: 1, line: 3 });
  const disc = SH.circle(0, 0, R);
  engrave(g, disc, { tone: 0.2, angle: 0, sp: 4.2, w: 1.1, fams: [[0, 0.12, 1, 1]], line: 1.2 });             // ruled-machine ground
  g.save(); g.clip(disc.p);
  const rom = SH.poly(ROMANIA.map(([a, b]) => geo(a, b)));
  engrave(g, rom, { tone: 0.3, angle: 45, sp: 5, w: 1.6, line: 1.6, wash: o.romania > 0 ? PALETTE.dim : null, washA: 0.55 * o.romania });
  const pl = SH.poly(POLAND.map(([a, b]) => geo(a, b)));
  engrave(g, pl, { tone: TN.lit(0, 0, 400, 0.13, 0.08, 0.04), angle: 0, sp: 6, w: 1.4, line: 2.6 });
  // the fronts: hatching that presses in from the west (and later the east), its edge ragged like a cut not yet cleaned
  const wx = lerp(-480, 60, o.west), ex = lerp(520, 60, o.east);
  if (o.west > 0 || o.east > 0) engrave(g, pl, { knock: false, angle: -30, sp: 5.2, w: 2.8,
    tone: (x, y) => { const j = 40 * (noise1(y * 0.02 + 4) - 0.5); return Math.max(o.west > 0 ? 0.92 * clamp((wx + j - x) / 60) : 0, o.east > 0 ? 0.92 * clamp((x - ex - j) / 60) : 0); } });
  // the route: cut by the burin, the gold point riding at its tip (the signature)
  const pts = routeAt(o.route);
  if (pts.length > 1) { g.save(); g.strokeStyle = INK; g.lineWidth = 5; g.setLineDash([16, 9]); g.lineCap = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.restore(); }
  for (const [name, [a, b]] of Object.entries(CITIES)) {
    const [x, y] = geo(a, b); engrave(g, SH.circle(x, y, 9), { tone: 0.8, angle: 0, sp: 2.4, w: 1.4, line: 1.2 });
    cutText(g, S, name, x + 16, y - 12, 24, 1, { role: 'text', world: true, track: 0.14, weight: 700 });
  }
  const tip = pts[pts.length - 1];
  if (o.dot) {
    engrave(g, SH.circle(tip[0], tip[1], 15), { tone: 0.2, angle: 30, sp: 3, w: 1.4, wash: PALETTE.accent, washA: 0.9, line: 1.6 });
    if (o.route > 0 && o.route < 1) {          // the burin: a lozenge steel shaft held low behind the point, swarf curling ahead
      g.save(); g.translate(tip[0], tip[1]); g.rotate(-0.6);
      engrave(g, SH.poly([[18, -4], [150, -12], [158, 0], [150, 12], [18, 4]]), { tone: TN.lit(80, 0, 80, 0.4, 0.4), angle: 0, sp: 3.4, w: 1.4, line: 1.6 });
      g.strokeStyle = INK; g.lineWidth = 1.6; g.beginPath(); for (let i = 0; i < 30; i++) { const a = i * 0.5 + t * 6, rr = 4 + i * 0.6; g.lineTo(-10 - i * 1.2 + Math.cos(a) * rr, -10 + Math.sin(a) * rr * 0.6); } g.stroke();
      g.restore();
    }
  }
  cutText(g, S, 'ROMÂNIA', geo(26.3, 46.6)[0], geo(26.3, 46.6)[1], 30, 1, { role: 'text', world: true, track: 0.3, align: 'center', weight: 700 });
  cutText(g, S, 'POLSKA', geo(20.4, 50.6)[0], geo(20.4, 50.6)[1], 34, 1, { role: 'text', world: true, track: 0.4, align: 'center', weight: 700 });
  g.restore();
  return tip;
}
function routeCut(g, k, t, S) {
  // pull-back reveal, 3 s, ease-out, from the gold point at Warsaw to the whole plate, then a held loupe
  const w = geo(21.0, 52.23), pk = EASE.out(clamp((t - CUES.map) / 3));
  const cam = { x: lerp(w[0], 0, pk), y: lerp(w[1], 0, pk), z: lerp(2.6, 1.02, pk) };
  stage(g, S, cam);
  mapPlate(g, S, t, { west: 0.55 * EASE.inOut(clamp((t - CUES.west) / 5.5)), east: 0, route: EASE.inOut(clamp((t - CUES.map - 0.6) / 8.2)), romania: 0, dot: true });
  caption(g, S, '1.IX.1939', '西线', clamp((t - CUES.west + 0.2) / 1.4));
  plateFrame(g, S);
}
function eastCloses(g, k, t, S) {
  // locked frame on the plate; the east front closes the road the gold took, in silence
  stage(g, S, { x: 0, y: 0, z: 1.02 });
  const tip = mapPlate(g, S, t, { west: 0.55 + 0.1 * EASE.inOut(clamp((t - CUES.turn) / 6)), east: 0.62 * EASE.out(clamp((t - CUES.east) / 1.6)), route: 1, romania: 1, dot: false });
  burst(g, geo(27.4, 51.2)[0], geo(27.4, 51.2)[1], (t - CUES.east) / 0.4, 30, 160, 13, 3);
  caption(g, S, '17.IX.1939', '东线', clamp((t - CUES.east - 0.2) / 1.4), { x: 1824, align: 'right' });
  plateFrame(g, S);
}

// ---- Scene 4 (21.30-31.17): Śniatyń at dusk. The gold train leaves the platform and crosses the border bridge.
function locomotive(g, x, y, t, moving) {
  g.save(); g.translate(x, y);
  engrave(g, SH.round(-150, -150, 330, 120, 30), { tone: TN.lit(0, -100, 200, 0.5, 0.3), angle: 0, sp: 4.8, w: 2.4, line: 2.2 });   // boiler
  engrave(g, SH.rect(170, -160, 30, 140), { tone: 0.66, angle: 90, sp: 4, w: 2, line: 1.8 });                                      // smokebox
  engrave(g, SH.rect(120, -212, 34, 64), { tone: TN.lit(137, -180, 30, 0.5, 0.4), angle: 90, sp: 3.6, w: 1.8, line: 1.6 });       // chimney
  engrave(g, SH.ellipse(30, -156, 26, 18), { tone: 0.45, angle: 30, sp: 3.6, w: 1.6, line: 1.4 });                              // dome
  engrave(g, SH.poly([[-260, -30], [-260, -200], [-140, -200], [-140, -30]]), { tone: TN.lit(-200, -110, 120, 0.56, 0.2), angle: 90, sp: 4.6, w: 2.2, line: 2 }); // cab
  engrave(g, SH.rect(-236, -176, 64, 56), { tone: 0.94, angle: 90, sp: 3.4, w: 1.8, line: 1.2 });
  engrave(g, SH.rect(-270, -34, 480, 26), { tone: 0.72, angle: 0, sp: 4, w: 2, line: 1.8 });
  const rot = x / 50; for (const wx of [-90, 20, 130]) wheel(g, wx, 18, 50, rot, 0.5);
  wheel(g, -220, 34, 32, rot * 1.5);
  g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(-90 + Math.cos(rot) * 26, 18 + Math.sin(rot) * 26); g.lineTo(130 + Math.cos(rot) * 26, 18 + Math.sin(rot) * 26); g.stroke();   // coupling rod
  g.restore();
}
function boxcar(g, x, y, seed) {
  g.save(); g.translate(x, y);
  engrave(g, SH.rect(-170, -170, 340, 150), { tone: (px, py) => 0.5 + 0.14 * (noise1(px * 0.05 + seed) - 0.5) + 0.1 * (py + 170) / 150, angle: 90, sp: 5, w: 2.4, line: 2 });
  for (let i = 1; i < 6; i++) engrave(g, SH.rect(-170 + i * 56.6, -170, 3, 150), { tone: 0.85, angle: 90, sp: 2, w: 1.2, knock: false });
  engrave(g, SH.poly([[-180, -170], [180, -170], [168, -190], [-168, -190]]), { tone: 0.4, angle: 0, sp: 4, w: 1.8, line: 1.6 });
  engrave(g, SH.rect(-180, -22, 360, 14), { tone: 0.75, angle: 0, sp: 3, w: 1.6, line: 1.2 });
  const rot = x / 28; wheel(g, -110, 10, 28, rot); wheel(g, 110, 10, 28, rot);
  g.restore();
}
function steam(g, x, y, t, amt) {             // puffs from the chimney, rising and thinning backwards
  for (let i = 0; i < 7; i++) {
    const ph = ((t * 1.6 + i / 7) % 1), rr = 24 + ph * 90;
    engrave(g, SH.circle(x - ph * 220 * amt - 20, y - ph * 200, rr), { tone: TN.lit(x, y - ph * 200, rr, 0.32 * (1 - ph * 0.7), 0.3), angle: 40, sp: 5, w: 1.8, line: 1.2 * (1 - ph) });
  }
}
function borderBridge(g, k, t, S) {
  // crane up, 9.9 s, slow ease-in-out, from the platform to the bridge, trucking right with the train
  const cam = { x: lerp(-560, 380, EASE.inOut(k)), y: lerp(120, -40, EASE.inOut(k)), z: lerp(1.12, 0.96, EASE.inOut(k)) };
  stage(g, S, cam);
  camView(g, S, cam, 0.4);
  engrave(g, SH.rect(-1500, -900, 3400, 1000), { tone: (x, y) => 0.12 + 0.5 * clamp((x + 1300) / 3000) * clamp((y + 900) / 900 + 0.3), angle: 0, sp: 6, w: 2.2, knock: false });  // dusk sky, light low in the west
  engrave(g, SH.circle(-900, 30, 70), { tone: 0.02, knock: '#fbf2da', angle: 0, line: 1 });                                             // the sun going down
  const hill = []; for (let x = -1500; x <= 1900; x += 40) hill.push([x, 40 - 60 * noise1(x * 0.003 + 7)]);
  engrave(g, SH.poly([...hill, [1900, 200], [-1500, 200]]), { tone: 0.62, angle: 20, sp: 5.4, w: 2.2, line: 1.4 });
  camView(g, S, cam);
  // the river below the bridge, light on it from the west
  engrave(g, SH.rect(-400, 260, 1500, 500), { tone: (x, y) => 0.4 + 0.3 * clamp((x + 400) / 1500) + 0.1 * Math.sin(y * 0.3 + t * 2), angle: 0, sp: 5.4, w: 2.4, knock: false });
  engrave(g, SH.poly([[-1800, 200], [-400, 200], [-340, 760], [-1800, 760]]), { tone: TN.lit(-1000, 400, 600, 0.55, 0.2), angle: 30, sp: 5.6, w: 2.4, line: 2 });   // home bank
  engrave(g, SH.poly([[1000, 200], [2400, 200], [2400, 760], [1060, 760]]), { tone: TN.lit(1600, 400, 600, 0.58, 0.2), angle: -30, sp: 5.6, w: 2.4, line: 2 });  // far bank
  // the station platform and its lamp
  engrave(g, SH.rect(-1800, 120, 1300, 80), { tone: TN.lit(-1100, 160, 400, 0.4, 0.2), angle: 0, sp: 5, w: 2.2, line: 1.8 });
  engrave(g, SH.rect(-1400, -320, 16, 440), { tone: 0.7, angle: 90, sp: 3, w: 1.6, line: 1.4 });
  engrave(g, SH.poly([[-1420, -330], [-1372, -330], [-1384, -300], [-1408, -300]]), { tone: 0.5, angle: 0, sp: 3, w: 1.6, line: 1.4 });
  // the bridge: piers and a through truss
  for (const px of [-380, 160, 700, 1020]) engrave(g, SH.poly([[px - 40, 200], [px + 40, 200], [px + 54, 700], [px - 54, 700]]), { tone: TN.lit(px, 400, 80, 0.5, 0.4), angle: 90, sp: 4.6, w: 2.2, line: 1.8 });
  engrave(g, SH.rect(-420, 186, 1480, 30), { tone: 0.66, angle: 0, sp: 4, w: 2, line: 1.8 });
  for (let i = 0; i < 12; i++) {
    const x0 = -400 + i * 120;
    g.save(); g.translate(x0, 186); g.rotate((i % 2 ? 1 : -1) * Math.atan2(200, 120));
    engrave(g, SH.rect(0, -6, Math.hypot(200, 120) * (i % 2 ? -1 : 1), 12), { tone: 0.6, angle: 0, sp: 3, w: 1.6, line: 1.2 }); g.restore();
    engrave(g, SH.rect(x0 - 5, -14, 10, 200), { tone: 0.6, angle: 90, sp: 3, w: 1.4, line: 1.2 });
  }
  engrave(g, SH.rect(-410, -24, 1460, 18), { tone: 0.6, angle: 0, sp: 3.4, w: 1.8, line: 1.6 });
  // the border post on the far bank: striped barrier and sentry box; Romania's wash blooms when the train reaches it
  const bw = clamp((t - CUES.border) / 0.8);
  engrave(g, SH.poly([[1150, 190], [1150, 40], [1180, 10], [1210, 40], [1210, 190]]), { tone: TN.lit(1180, 100, 60, 0.4, 0.3), angle: 90, sp: 4, w: 1.8, line: 1.6, wash: bw > 0 ? PALETTE.dim : null, washA: 0.7 * bw });
  g.save(); g.translate(1100, 150); g.rotate(-1.2 * EASE.out(clamp((t - CUES.border + 0.7) / 0.7)));
  for (let i = 0; i < 6; i++) engrave(g, SH.rect(i * 30, -7, 30, 14), { tone: i % 2 ? 0.75 : 0.08, angle: 0, sp: 3, w: 1.6, line: 1, wash: i % 2 || bw <= 0 ? null : PALETTE.dim, washA: 0.7 * bw });
  g.restore();
  // the train: still at the platform until 25 s, then away over the bridge, the locomotive at the post on the border cue
  const go = clamp((t - 25.0) / (CUES.border - 25.0)), tx = lerp(-900, 960, go * go * (1.4 - 0.4 * go)) + Math.max(0, t - CUES.border) * 300;
  steam(g, tx + 137, 186 - 212 - 70, t, 0.4 + go);
  for (let i = 0; i < 4; i++) boxcar(g, tx - 450 - i * 370, 166, i + 2);
  locomotive(g, tx, 166, t, go > 0);
  if (t < 25.4) for (let i = 0; i < 3; i++) {   // the last crates handed up, men at a distance
    const fx = -1150 + i * 140, carry = Math.sin(clamp((t - 21.6 - i * 0.6) / 1.6) * Math.PI);
    engrave(g, figure(fx, 120, 110, false), { tone: 0.85, angle: 80, sp: 3.6, w: 1.6, line: 1.2 });
    engrave(g, SH.rect(fx - 24, 120 - 110 * 0.8 - 30 * carry, 48, 32), { tone: 0.38, angle: 0, sp: 3.6, w: 1.6, line: 1.4, wash: PALETTE.accent, washA: 0.35 });
  }
  caption(g, S, 'ŚNIATYŃ · 13.IX.1939', '越过边境', clamp((t - 26.4) / 1.6));
  plateFrame(g, S);
}

// ---- Scene 5 (31.17-40): Constanța at dawn. A crane swings the crates aboard; the ship pulls out.
function gull(g, x, y, t, s = 1) {
  const f = Math.sin(t * 8 + x) * 0.5;
  g.save(); g.strokeStyle = INK; g.lineWidth = 2.4 * s; g.lineCap = 'round'; g.beginPath();
  g.moveTo(x - 22 * s, y - (8 + 10 * f) * s); g.quadraticCurveTo(x - 9 * s, y - (12 + 6 * f) * s, x, y); g.quadraticCurveTo(x + 9 * s, y - (12 + 6 * f) * s, x + 22 * s, y - (8 + 10 * f) * s); g.stroke(); g.restore();
}
function ship(g, x, y, t, s = 1) {            // a tanker in profile: raised bow and poop, bridge amidships, one funnel aft
  g.save(); g.translate(x, y); g.scale(s, s);
  engrave(g, SH.poly([[-520, -40], [480, -40], [560, -90], [540, 20], [470, 70], [-470, 70], [-540, -10]]), { tone: TN.lit(0, 0, 500, 0.62, 0.18), angle: 0, sp: 5, w: 2.6, line: 2.4 });
  engrave(g, SH.rect(-520, 20, 1000, 12), { tone: 0.3, angle: 0, sp: 3, w: 1.4, knock: false });
  engrave(g, SH.rect(-70, -130, 150, 92), { tone: TN.lit(0, -90, 100, 0.4, 0.3), angle: 90, sp: 4.4, w: 2, line: 1.8 });
  for (let i = 0; i < 4; i++) engrave(g, SH.rect(-58 + i * 34, -118, 22, 20), { tone: 0.9, angle: 90, sp: 3, w: 1.4, line: 1 });
  engrave(g, SH.rect(-460, -100, 170, 62), { tone: TN.lit(-370, -70, 100, 0.42, 0.3), angle: 90, sp: 4.4, w: 2, line: 1.8 });
  engrave(g, SH.poly([[-410, -100], [-350, -100], [-356, -190], [-404, -190]]), { tone: TN.lit(-380, -150, 40, 0.5, 0.4), angle: 90, sp: 3.6, w: 1.8, line: 1.6 });
  engrave(g, SH.rect(380, -260, 8, 220), { tone: 0.7, angle: 90, sp: 2, w: 1.2, line: 1 });
  engrave(g, SH.rect(20, -280, 8, 150), { tone: 0.7, angle: 90, sp: 2, w: 1.2, line: 1 });
  g.restore();
}
function portDawn(g, k, t, S) {
  // dolly out, 8.8 s, ease-in-out, from the crane's load to the harbour mouth
  const cam = { x: lerp(-60, 200, EASE.inOut(k)), y: lerp(-80, 0, EASE.inOut(k)), z: lerp(1.28, 0.98, EASE.inOut(k)) };
  stage(g, S, cam);
  camView(g, S, cam, 0.3);
  engrave(g, SH.rect(-1400, -900, 2800, 1000), { tone: TN.vgrad(-600, 80, 0.36, 0.1), angle: 0, sp: 6.6, w: 2, knock: false, fams: [[0, 0.12, 1, 1]] });   // dawn sky
  engrave(g, SH.poly([[-1400, 60], [-600, 30], [200, 50], [1400, 40], [1400, 110], [-1400, 110]]), { tone: 0.26, angle: 0, sp: 5, w: 1.6, line: 1 });            // far shore in haze
  camView(g, S, cam);
  const sea = SH.rect(-1500, 100, 3000, 800);
  engrave(g, sea, { tone: (x, y) => 0.3 + 0.25 * clamp((y - 100) / 500) + 0.12 * Math.sin(x * 0.03 + y * 0.2 + t * 1.5), angle: 0, sp: 5.4, w: 2.2, knock: false, wash: PALETTE.dim, washA: 0.5 });
  // the quay and its bollards
  engrave(g, SH.rect(-1500, 230, 1180, 600), { tone: TN.lit(-900, 400, 600, 0.5, 0.2), angle: 30, sp: 5.4, w: 2.4, line: 2.2 });
  for (const bx of [-1100, -700]) engrave(g, SH.round(bx, 196, 40, 40, 10), { tone: 0.6, angle: 0, sp: 3, w: 1.6, line: 1.4 });
  // the ship pulls out after the horn
  const sx = 260 + Math.max(0, t - CUES.horn) ** 1.6 * 34;
  ship(g, sx, 180, t, 0.9);
  for (let i = 0; i < 5; i++) { const ph = (t * 0.5 + i / 5) % 1; engrave(g, SH.circle(sx - 340 - ph * 260, 180 - 190 - ph * 160, 20 + ph * 60), { tone: 0.5 * (1 - ph), angle: 50, sp: 5, w: 1.8, knock: false }); }  // funnel smoke
  // the crane: tower, jib swinging over the hold, the crate load on its cable
  const swing = EASE.inOut(clamp((t - CUES.hoist) / 3.2)), lift = Math.sin(clamp((t - CUES.hoist) / 3.4) * Math.PI);
  engrave(g, SH.poly([[-780, 230], [-700, 230], [-720, -340], [-760, -340]]), { tone: TN.lit(-740, 0, 80, 0.55, 0.3), angle: 90, sp: 4, w: 2, line: 1.8 });
  for (let i = 0; i < 8; i++) { const yy = 200 - i * 70; g.save(); g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(-772 + i * 1.4, yy); g.lineTo(-708 - i * 1.4, yy - 70); g.stroke(); g.restore(); }
  const ja = lerp(-0.25, 0.08, swing), L = 760, jx = -740 + Math.cos(ja) * L, jy = -330 + Math.sin(ja) * L * 0.3;
  g.save(); g.strokeStyle = INK; g.lineWidth = 9; g.beginPath(); g.moveTo(-740, -330); g.lineTo(jx, jy); g.stroke(); g.lineWidth = 2; g.beginPath(); g.moveTo(-740, -420); g.lineTo(jx, jy); g.stroke();
  const cy = lerp(160, -40, lift) - 40 * swing;
  g.lineWidth = 2; g.beginPath(); g.moveTo(jx, jy); g.lineTo(jx, cy - 60); g.stroke(); g.restore();
  engrave(g, SH.rect(jx - 70, cy - 60, 140, 90), { tone: TN.lit(jx, cy, 90, 0.38, 0.3), angle: 0, sp: 4.4, w: 2, line: 2 });
  engrave(g, SH.rect(jx - 60, cy - 30, 120, 6), { tone: 0.2, knock: false, wash: PALETTE.accent, washA: 0.5 });
  for (let i = 0; i < 4; i++) gull(g, -200 + i * 230 + Math.sin(t * 0.7 + i) * 60, -300 + i * 30 + Math.cos(t * 0.9 + i) * 30, t, 1.2);
  caption(g, S, 'CONSTANȚA', '康斯坦察', clamp((t - CUES.port - 0.5) / 1.6), { x: 1824, align: 'right' });
  plateFrame(g, S);
}

// ---- Scene 8 (56.05-60): the open sea at dusk. The ship far out, one gold glint; the title is cut.
function seaGlint(g, k, t, S) {
  // dolly out, 3.95 s, slow ease-out, on the horizon; the title cut glyph by glyph above it
  const cam = { x: 0, y: 0, z: lerp(1.12, 1, EASE.out(k)) };
  stage(g, S, cam);
  engrave(g, SH.rect(-1300, -800, 2600, 880), { tone: TN.vgrad(-560, 70, 0.6, 0.16, 0.03), angle: 0, sp: 6.2, w: 2.4, knock: false });   // dusk sky
  engrave(g, SH.circle(-520, 60, 64), { tone: 0.03, knock: '#fbf1d6', line: 1 });
  const sea = SH.rect(-1300, 70, 2600, 800);
  engrave(g, sea, { tone: (x, y) => 0.36 + 0.36 * clamp((y - 70) / 450) - 0.3 * Math.max(0, 1 - Math.abs(x + 520) / 160) * clamp(1 - (y - 70) / 300) + 0.1 * Math.sin(x * 0.02 + y * 0.35 - t * 2), angle: 0, sp: 5.2, w: 2.2, knock: false, wash: PALETTE.dim, washA: 0.45 });
  const sx = 330 + (t - CUES.sea) * 14;
  ship(g, sx, 52, t, 0.14);
  for (let i = 0; i < 4; i++) engrave(g, SH.circle(sx - 60 - i * 26, 22 - i * 8, 6 + i * 4), { tone: 0.4 - i * 0.08, angle: 40, sp: 3, w: 1, knock: false });
  const gk = clamp((t - CUES.sea - 0.6) / 0.5), gw = gk * (0.75 + 0.25 * Math.sin(t * 5));   // one gold glint at the ship
  if (gk > 0) { engrave(g, SH.circle(sx + 10, 44, 7 * gw + 2), { tone: 0.15, knock: '#fff4cf', wash: PALETTE.accent, washA: 0.95, line: 1 }); burst(g, sx + 10, 44, 0.35 + 0.1 * Math.sin(t * 3), 10, 52, 8, 2.2 * gw); }
  cutText(g, S, TITLE, DW / 2, 380, 150, clamp((t - 57.0) / 1.4), { role: 'display', align: 'center', track: 0.3 });
  plateFrame(g, S);
}


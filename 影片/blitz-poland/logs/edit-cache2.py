p='film.html';s=open(p,encoding='utf-8').read()
def R(a,b):
    global s
    assert s.count(a)==1, ('MISSING', a[:90])
    s=s.replace(a,b)
# line spacing floor for things drawn small (a far ship): lines keep a readable gap on screen
R("""const FAMS = [[0, 0.12, 1, 1], [57, 0.47, 0.84, 1.1], [-38, 0.76, 0.68, 1.28]];""","""const FAMS = [[0, 0.12, 1, 1], [57, 0.47, 0.84, 1.1], [-38, 0.76, 0.68, 1.28]];
let SPSCALE = 1;                               // > 1 while something is drawn at a small scale""")
R("""  const a = o.angle ?? 35, sp = o.sp ?? 6.4, w = o.w ?? 2.7;""","""  const a = o.angle ?? 35, sp = (o.sp ?? 6.4) * SPSCALE, w = (o.w ?? 2.7) * SPSCALE;""")
R("""  g.save(); g.translate(x, y); g.scale(s, s);
  engrave(g, SH.poly([[-520, -40], [480, -40]""","""  g.save(); g.translate(x, y); g.scale(s, s); const keep = SPSCALE; SPSCALE = Math.max(1, 0.8 / s);
  engrave(g, SH.poly([[-520, -40], [480, -40]""")
R("""  engrave(g, SH.rect(20, -280, 8, 150), { tone: 0.7, angle: 90, sp: 2, w: 1.2, line: 1 });
  g.restore();""","""  engrave(g, SH.rect(20, -280, 8, 150), { tone: 0.7, angle: 90, sp: 2, w: 1.2, line: 1 });
  SPSCALE = keep; g.restore();""")
# ---- S4
R("""  camView(g, S, cam, 0.4);
  engrave(g, SH.rect(-1500, -900, 3400, 1000), { tone: (x, y) => 0.12""","""  camView(g, S, cam, 0.4);
  cached(g, S, 's4far', [-1500, -900, 1900, 200], 1.08, (g) => {
  engrave(g, SH.rect(-1500, -900, 3400, 1000), { tone: (x, y) => 0.12""")
R("""  engrave(g, SH.poly([...hill, [1900, 200], [-1500, 200]]), { tone: 0.62, angle: 20, sp: 5.4, w: 2.2, line: 1.4 });
  camView(g, S, cam);
  // the river below the bridge, light on it from the west
  engrave(g, SH.rect(-400, 260, 1500, 500), { tone: (x, y) => 0.4 + 0.3 * clamp((x + 400) / 1500) + 0.1 * Math.sin(y * 0.3 + t * 2), angle: 0, sp: 5.4, w: 2.4, knock: false });
  engrave(g, SH.poly([[-1800, 200], [-400, 200], [-340, 760], [-1800, 760]]), { tone: TN.lit(-1000, 400, 600, 0.55, 0.2), angle: 30, sp: 5.6, w: 2.4, line: 2 });   // home bank
  const bw0 = clamp((t - CUES.border) / 0.9);""","""  engrave(g, SH.poly([...hill, [1900, 200], [-1500, 200]]), { tone: 0.62, angle: 20, sp: 5.4, w: 2.2, line: 1.4 });
  });
  camView(g, S, cam);
  const bw0 = clamp((t - CUES.border) / 0.9);""")
R("""  // the station platform and its lamp
  engrave(g, SH.rect(-1800, 120, 1300, 80)""","""  cached(g, S, 's4near', [-1800, -340, 1080, 760], 1.12, (g) => {
  // the river below the bridge, light on it from the west
  engrave(g, SH.rect(-400, 260, 1440, 500), { tone: (x, y) => 0.4 + 0.3 * clamp((x + 400) / 1500) + 0.1 * Math.sin(y * 0.3), angle: 0, sp: 5.4, w: 2.4, knock: false });
  engrave(g, SH.poly([[-1800, 200], [-400, 200], [-340, 760], [-1800, 760]]), { tone: TN.lit(-1000, 400, 600, 0.55, 0.2), angle: 30, sp: 5.6, w: 2.4, line: 2 });   // home bank
  // the station platform and its lamp
  engrave(g, SH.rect(-1800, 120, 1300, 80)""")
R("""  engrave(g, SH.rect(-410, -24, 1460, 18), { tone: 0.6, angle: 0, sp: 3.4, w: 1.8, line: 1.6 });
""","""  engrave(g, SH.rect(-410, -24, 1460, 18), { tone: 0.6, angle: 0, sp: 3.4, w: 1.8, line: 1.6 });
  });
""")
# ---- S5
R("""  camView(g, S, cam, 0.3);
  engrave(g, SH.rect(-1400, -900, 2800, 1000), { tone: TN.vgrad(-600, 80, 0.36, 0.1)""","""  camView(g, S, cam, 0.3);
  cached(g, S, 's5far', [-1400, -900, 1400, 110], 1.2, (g) => {
  engrave(g, SH.rect(-1400, -900, 2800, 1000), { tone: TN.vgrad(-600, 80, 0.36, 0.1)""")
R("""  engrave(g, SH.poly([[-1400, 60], [-600, 30], [200, 50], [1400, 40], [1400, 110], [-1400, 110]]), { tone: 0.26, angle: 0, sp: 5, w: 1.6, line: 1 });            // far shore in haze
  camView(g, S, cam);
  const sea = SH.rect(-1500, 100, 3000, 800);
  engrave(g, sea, { tone: (x, y) => 0.3 + 0.25 * clamp((y - 100) / 500) + 0.12 * Math.sin(x * 0.03 + y * 0.2 + t * 1.5),""","""  engrave(g, SH.poly([[-1400, 60], [-600, 30], [200, 50], [1400, 40], [1400, 110], [-1400, 110]]), { tone: 0.26, angle: 0, sp: 5, w: 1.6, line: 1 });            // far shore in haze
  });
  camView(g, S, cam);
  cached(g, S, 's5near', [-1500, -360, 1500, 900], 1.3, (g) => {
  const sea = SH.rect(-1500, 100, 3000, 800);
  engrave(g, sea, { tone: (x, y) => 0.3 + 0.25 * clamp((y - 100) / 500) + 0.12 * Math.sin(x * 0.03 + y * 0.2),""")
R("""  for (const bx of [-1100, -700]) engrave(g, SH.round(bx, 196, 40, 40, 10), { tone: 0.6, angle: 0, sp: 3, w: 1.6, line: 1.4 });
""","""  for (const bx of [-1100, -700]) engrave(g, SH.round(bx, 196, 40, 40, 10), { tone: 0.6, angle: 0, sp: 3, w: 1.6, line: 1.4 });
  engrave(g, SH.poly([[-780, 230], [-700, 230], [-720, -340], [-760, -340]]), { tone: TN.lit(-740, 0, 80, 0.55, 0.3), angle: 90, sp: 4, w: 2, line: 1.8 });
  for (let i = 0; i < 8; i++) { const yy = 200 - i * 70; g.save(); g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(-772 + i * 1.4, yy); g.lineTo(-708 - i * 1.4, yy - 70); g.stroke(); g.restore(); }
  });
""")
R("""  engrave(g, SH.poly([[-780, 230], [-700, 230], [-720, -340], [-760, -340]]), { tone: TN.lit(-740, 0, 80, 0.55, 0.3), angle: 90, sp: 4, w: 2, line: 1.8 });
  for (let i = 0; i < 8; i++) { const yy = 200 - i * 70; g.save(); g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(-772 + i * 1.4, yy); g.lineTo(-708 - i * 1.4, yy - 70); g.stroke(); g.restore(); }
  const ja""","""  const ja""")
# ---- S8
R("""  stage(g, S, cam);
  engrave(g, SH.rect(-1300, -800, 2600, 880), { tone: TN.vgrad(-560, 70, 0.6, 0.16, 0.03)""","""  stage(g, S, cam);
  cached(g, S, 's8sea', [-1300, -800, 1300, 870], 1.12, (g) => {
  engrave(g, SH.rect(-1300, -800, 2600, 880), { tone: TN.vgrad(-560, 70, 0.6, 0.16, 0.03)""")
R("""clamp(1 - (y - 70) / 300) + 0.1 * Math.sin(x * 0.02 + y * 0.35 - t * 2), angle: 0, sp: 5.2, w: 2.2, knock: false, wash: PALETTE.dim, washA: 0.45 });
""","""clamp(1 - (y - 70) / 300) + 0.1 * Math.sin(x * 0.02 + y * 0.35), angle: 0, sp: 5.2, w: 2.2, knock: false, wash: PALETTE.dim, washA: 0.45 });
  });
""")
open(p,'w',encoding='utf-8').write(s); print('ok part 2')

p='film.html';s=open(p,encoding='utf-8').read()
def R(a,b):
    global s
    assert s.count(a)==1, ('MISSING', a[:90])
    s=s.replace(a,b)
# cache helper
R("""function plateFrame(g, S) {""","""// static layers are engraved once into an offscreen sheet at the largest zoom they are seen at, then laid each frame
const LAYERS = new Map();
function cached(g, S, key, box, zmax, draw) {
  let L = LAYERS.get(key);
  if (!L) {
    const [x0, y0, x1, y1] = box, sc = (S.W / DW) * zmax, c = document.createElement('canvas');
    c.width = Math.ceil((x1 - x0) * sc); c.height = Math.ceil((y1 - y0) * sc);
    const cg = c.getContext('2d'); cg.setTransform(sc, 0, 0, sc, -x0 * sc, -y0 * sc); draw(cg);
    L = { c, box }; LAYERS.set(key, L);
  }
  const [x0, y0, x1, y1] = L.box; g.drawImage(L.c, x0, y0, x1 - x0, y1 - y0);
}
function plateFrame(g, S) {""")
# ---- S1
R("""  // the vault floor, lit by one lamp above the crate
  engrave(g, SH.rect(-1300, -800, 2600, 1600)""","""  const X0 = -620, Y0 = -330, CW = 1240, CH = 660, rim = 46;
  cached(g, S, 's1base', [-1300, -800, 1300, 800], 1.12, (g) => {
  // the vault floor, lit by one lamp above the crate
  engrave(g, SH.rect(-1300, -800, 2600, 1600)""")
R("""  engrave(g, SH.poly([[-600, -320], [660, -320], [700, 360], [-560, 360]]), { tone: 0.9, angle: -20, sp: 5.4, knock: false });
  const X0 = -620, Y0 = -330, CW = 1240, CH = 660, rim = 46;
""","""  engrave(g, SH.poly([[-600, -320], [660, -320], [700, 360], [-560, 360]]), { tone: 0.9, angle: -20, sp: 5.4, knock: false });
""")
R("""  g.save(); g.translate(X0 + CW, Y0); g.rotate(Math.PI / 2); plank(g, 0, 0, CH, rim, 6, 0.52); g.restore();
""","""  g.save(); g.translate(X0 + CW, Y0); g.rotate(Math.PI / 2); plank(g, 0, 0, CH, rim, 6, 0.52); g.restore();
  });
""")
R("""  engrave(g, SH.rect(X0 + 26, Y0 + 30, CW, CH), { tone: 0.94, angle: -30, sp: 5, knock: false });   // its shadow
  for (let b = 0; b < 3; b++) plank(g, X0, Y0 + b * (CH / 3), CW, CH / 3, 20 + b, 0.3 + b * 0.05);
  for (const bx of [X0 + 120, X0 + CW - 190]) plank(g, bx, Y0 - 6, 70, CH + 12, 30 + bx, 0.46);
""","""  cached(g, S, 's1lid', [X0 - 10, Y0 - 16, X0 + CW + 40, Y0 + CH + 40], 1.12, (g) => {
    engrave(g, SH.rect(X0 + 26, Y0 + 30, CW, CH), { tone: 0.94, angle: -30, sp: 5, knock: false });   // its shadow
    for (let b = 0; b < 3; b++) plank(g, X0, Y0 + b * (CH / 3), CW, CH / 3, 20 + b, 0.3 + b * 0.05);
    for (const bx of [X0 + 120, X0 + CW - 190]) plank(g, bx, Y0 - 6, 70, CH + 12, 30 + bx, 0.46);
  });
""")
# ---- S7
R("""  camView(g, S, cam, 0.6, dz);
  engrave(g, SH.rect(-1300, -800, 2600, 760)""","""  camView(g, S, cam, 0.6, dz);
  cached(g, S, 's7far', [-1300, -800, 1300, 80], 1.2, (g) => {
  engrave(g, SH.rect(-1300, -800, 2600, 760)""")
R("""    fx += fw + 6;
  }
  camView(g, S, cam);
  // the square
  engrave(g, SH.rect(-1300, 40, 2600, 800)""","""    fx += fw + 6;
  }
  });
  camView(g, S, cam);
  cached(g, S, 's7near', [-1300, -480, 1300, 840], 1.03, (g) => {
  // the square
  engrave(g, SH.rect(-1300, 40, 2600, 800)""")
R("""  for (const [px, ph, dir] of [[-440, 0, -1], [440, 1.7, 1]]) {
    engrave(g, SH.rect(px - 7, -470, 14, 680), { tone: TN.lit(px, 0, 20, 0.4, 0.4), angle: 90, sp: 4, w: 1.6, line: 1.4 });
    g.save();""","""  for (const px of [-440, 440]) engrave(g, SH.rect(px - 7, -470, 14, 680), { tone: TN.lit(px, 0, 20, 0.4, 0.4), angle: 90, sp: 4, w: 1.6, line: 1.4 });
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
  });
  for (const [px, ph, dir] of [[-440, 0, -1], [440, 1.7, 1]]) {
    g.save();""")
R("""    g.restore();
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
""","""    g.restore();
  }
""")
# ---- S2
R("""  engrave(g, SH.rect(-1300 + cam.x * 0.15, -800, 2600, 900), { tone: TN.vgrad(-560, 60, 0.92, 0.72, 0.05), angle: 0, sp: 6.4, w: 2.8, knock: false });   // night sky""",
"""  g.save(); g.translate(cam.x * 0.15, 0);
  cached(g, S, 's2sky', [-1300, -800, 1300, 100], 1, (g) => engrave(g, SH.rect(-1300, -800, 2600, 900), { tone: TN.vgrad(-560, 60, 0.92, 0.72, 0.05), angle: 0, sp: 6.4, w: 2.8, knock: false }));   // night sky
  g.restore();""")
R("""  const r = rng(8), x0 = Math.floor((cam.x * 0.35 - 1400) / 90) * 90;
  const hills = []; for (let x = x0; x < x0 + 2900; x += 30) hills.push([x, -40 - 50 * noise1(x * 0.004 + 2) - 30 * noise1(x * 0.02)]);
  engrave(g, SH.poly([...hills, [x0 + 2900, 200], [x0, 200]]), { tone: 0.8, angle: 15, sp: 5.6, w: 2.6, line: 1.6 });                     // far ridge""",
"""  cached(g, S, 's2ridge', [-1500, -200, 2500, 210], 1, (g) => {
    const hills = []; for (let x = -1500; x <= 2500; x += 30) hills.push([x, -40 - 50 * noise1(x * 0.004 + 2) - 30 * noise1(x * 0.02)]);
    engrave(g, SH.poly([...hills, [2500, 200], [-1500, 200]]), { tone: 0.8, angle: 15, sp: 5.6, w: 2.6, line: 1.6 });                     // far ridge
  });""")
R("""  for (let i = Math.floor((cam.x * 0.7 - 1300) / 230); i < Math.floor((cam.x * 0.7 + 1300) / 230); i++) {   // poplars along the verge""",
"""  cached(g, S, 's2poplars', [-1400, -320, 2800, 160], 1, (g) => {
  for (let i = -6; i < 12; i++) {   // poplars along the verge""")
R("""    engrave(g, SH.rect(tx - 5, 110, 10, 40), { tone: 0.8, angle: 90, sp: 3, w: 1.4 });
  }""","""    engrave(g, SH.rect(tx - 5, 110, 10, 40), { tone: 0.8, angle: 90, sp: 3, w: 1.4 });
  }
  });""")
R("""  engrave(g, SH.rect(cam.x - 1300, 140, 2600, 700), { tone: TN.vgrad(140, 540, 0.7, 0.86), angle: 3, sp: 6, w: 2.6, knock: false });   // the road""",
"""  g.save(); g.translate(cam.x, 0);
  cached(g, S, 's2road', [-1300, 140, 1300, 840], 1, (g) => engrave(g, SH.rect(-1300, 140, 2600, 700), { tone: TN.vgrad(140, 540, 0.7, 0.86), angle: 3, sp: 6, w: 2.6, knock: false }));   // the road
  g.restore();""")
open(p,'w',encoding='utf-8').write(s); print('ok part 1')

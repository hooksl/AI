p='film.html';s=open(p,encoding='utf-8').read()
def R(a,b):
    global s
    assert s.count(a)==1, ('MISSING', a[:90])
    s=s.replace(a,b)
# bigger captions (phone reading): Chinese 80, roman 44
R("setType(g, TYPE, 'display', 60, { weight: 600, short: DH }); const wz = [...(zh || '')].length * 60 * 1.08;",
  "setType(g, TYPE, 'display', 80, { weight: 600, short: DH }); const wz = [...(zh || '')].length * 80 * 1.08;")
R("setType(g, TYPE, 'text', 34, { weight: 500, short: DH }); g.letterSpacing = '0px'; const wl = g.measureText(latin || '').width + [...(latin || '')].length * 34 * 0.34 + 40;",
  "setType(g, TYPE, 'text', 44, { weight: 500, short: DH }); g.letterSpacing = '0px'; const wl = g.measureText(latin || '').width + [...(latin || '')].length * 44 * 0.3 + 40;")
R("const w = Math.max(wz, wl) + 64, h = 170, x0 = al === 'center' ? x - w / 2 : al === 'right' ? x - w + 32 : x - 32, y0 = y - 132;",
  "const w = Math.max(wz, wl) + 64, h = 212, x0 = al === 'center' ? x - w / 2 : al === 'right' ? x - w + 32 : x - 32, y0 = y - 168;")
R("if (latin) cutText(g, S, latin, x, y - 74, 34, clamp(k * 1.6), { role: 'text', align: al, track: 0.2 });",
  "if (latin) cutText(g, S, latin, x, y - 96, 44, clamp(k * 1.6), { role: 'text', align: al, track: 0.16 });")
R("if (zh) cutText(g, S, zh, x, y, 60, clamp(k * 1.6 - 0.35), { role: 'display', align: al });",
  "if (zh) cutText(g, S, zh, x, y, 80, clamp(k * 1.6 - 0.35), { role: 'display', align: al });")
# map labels: no two touch; a little larger
R("    const lo = name === 'BRZEŚĆ' ? [16, 30] : name === 'WARSZAWA' ? [-16, -14] : [16, -12];\n    cutText(g, S, name, x + lo[0], y + lo[1], 24, 1,",
  "    const lo = name === 'BRZEŚĆ' ? [18, -14] : name === 'WARSZAWA' ? [-18, -14] : name === 'LUBLIN' ? [-18, 34] : name === 'ŁUCK' ? [18, 34] : [18, -12];\n    cutText(g, S, name, x + lo[0], y + lo[1], 30, 1,")
# S3: pull back to the plate, then the loupe follows the burin south
R("""  const w = geo(21.0, 52.23), pk = EASE.out(clamp((t - CUES.map) / 3));
  const cam = { x: lerp(w[0], 0, pk), y: lerp(w[1], 0, pk), z: lerp(2.6, 1.02, pk) };
  stage(g, S, cam);
  mapPlate(g, S, t, { west: 0.55 * EASE.inOut(clamp((t - CUES.west) / 5.5)), east: 0, route: EASE.inOut(clamp((t - CUES.map - 0.6) / 8.2)), romania: 0, dot: true });""",
"""  const w = geo(21.0, 52.23), pk = EASE.out(clamp((t - CUES.map) / 2.6)), ru = EASE.inOut(clamp((t - CUES.map - 0.6) / 8.2));
  const tip = routeAt(ru).at(-1), fk = EASE.inOut(clamp((t - CUES.map - 3.0) / 2.6));   // then the loupe rides with the burin
  const cam = { x: lerp(lerp(w[0], 0, pk), tip[0] * 0.55, fk), y: lerp(lerp(w[1], 0, pk), tip[1] * 0.55, fk), z: lerp(lerp(2.6, 1.02, pk), 1.32, fk) };
  stage(g, S, cam);
  mapPlate(g, S, t, { west: 0.62 * EASE.inOut(clamp((t - CUES.west) / 6.2)), east: 0, route: ru, romania: 0, dot: true });""")
# S6: a new picture of the plate: close on the southern road, a slow push while the east front closes it
R("""  stage(g, S, { x: 0, y: 0, z: 1.02 });
  const tip = mapPlate(g, S, t, {""","""  const c0 = geo(25.0, 49.9), pz = EASE.inOut(clamp((t - CUES.turn) / 6));
  stage(g, S, { x: c0[0] * 0.8 + 20 * pz, y: c0[1] * 0.8 - 30 * pz, z: lerp(1.55, 1.9, pz) });
  const tip = mapPlate(g, S, t, {""")
R("east: EASE.out(clamp((t - CUES.east) / 1.8)), route: 1, romania: 1, dot: false });",
  "east: EASE.out(clamp((t - CUES.east) / 2.6)), route: 1, romania: 1, dot: false });")
R("caption(g, S, '17.IX.1939', '东线', clamp((t - CUES.east - 0.2) / 1.4), { x: 1824, align: 'right' });",
  "caption(g, S, '17.IX.1939', '东线', clamp((t - CUES.east - 0.2) / 1.4), { x: 1824, align: 'right', y: 250 });")
# the turn: one heavy hit, no tick over the silence
R("\"{ at: CUES.east, voice: 'hit', gain: 0.9, wet: 0.5 }\"", "\"{ at: CUES.east, voice: 'hit', gain: 0.9, wet: 0.5 }\"") if False else None
open(p,'w',encoding='utf-8').write(s); print('ok')

/* s01 · 0–20s 开场：笔触在空中长出《星月夜》→ 画变成可以飞进去的世界 → 穿过柏树旁、掠过村庄、冲进大漩涡 → 漩涡隧道里落标题 */
(function(){
const { keys, E, P, lerp, easeOut, vis } = V;

/* 0–15.4：世界内飞行 */
V.shot({ id: 's01a', start: 0, end: 15.4, useWorld: true,
  build(ctx){
    const G = V.world.features[0];                     // 大漩涡
    const fwd = V.T0.clone().sub(V.P0).normalize();
    const s = ctx.state;
    s.G = G;
    s.path = V.spline([
      V.P0.clone().addScaledVector(fwd, 3),
      V.v3(-2.5, 19, 42),
      V.v3(-5, 31, 2),
      G.C.clone().addScaledVector(G.n, -120),
      G.C.clone().addScaledVector(G.n, -45),
      G.C.clone().addScaledVector(G.n, -22),
    ]);
    // 开场 8.6–11.8s 的公式提示（2D 覆盖层）
    V.overlayHooks.push((c, t) => {
      const k = vis(t, 8.6, 11.8, 0.6, 0.8); if (k <= 0) return;
      c.save(); c.globalAlpha = k*0.6; c.fillStyle = '#060a1c'; V.roundRect(c, 1290, 178, 380, 124, 14); c.fill(); c.restore();
      V.txt(c, 'E(k) ∝ k', 1322, 250, `italic 64px ${V.FONT.MATH}`, '#FFF6D8', 'left', k);
      V.txt(c, '−5/3', 1542, 222, `italic 38px ${V.FONT.MATH}`, '#FFF6D8', 'left', k);
    });
  },
  update(t, lt, ctx){
    const s = ctx.state, G = s.G;
    V.world.set({ reveal: lerp(0.06, 1, easeOut(P(t, 0, 5.2))) });
    let pos, tgt, fov = 50;
    if (t < 3.2){
      pos = V.P0.clone().addScaledVector(V.T0.clone().sub(V.P0).normalize(), 3*E(t, 0, 3.2));
      tgt = V.T0.clone();
    } else {
      const u = E(t, 3.2, 14.9);
      pos = s.path(u);
      tgt = V.T0.clone().lerp(G.C, E(t, 4.5, 11.5));
      if (t > 14.9){                                      // 冲进漩涡中心
        const k = V.easeIn(P(t, 14.9, 15.4));
        pos = G.C.clone().addScaledVector(G.n, lerp(-22, 8, k));
        tgt = G.C.clone().addScaledVector(G.n, 40);
      }
      fov = lerp(50, 64, E(t, 12.5, 15.3));
    }
    V.setCam(pos, tgt, fov, 0.05*Math.sin(t*0.45) * E(t, 3.2, 6));
  },
});

/* 15.4–20：漩涡隧道 + 标题卡（标题为 HTML 覆盖层） */
V.shot({ id: 's01b', start: 15.4, end: 20, origin: [0, 3000, 0],
  build(ctx){
    const R = V.rng(1501), N = 2600, s = ctx.state;
    s.st = new V.Strokes(N, {renderOrder: 2});
    s.d = [];
    const pal = [...V.PAL.mid, ...V.PAL.pale, ...V.PAL.cream, ...V.PAL.deep, ...V.PAL.yel];
    for (let i=0;i<N;i++) s.d.push({ a: R()*Math.PI*2, r: 16 + R()*26, z: -R()*520, w: (0.25 + R()*0.35)*(R()<.85?1:-1),
      len: 5+R()*5, wid: 1.6+R()*0.8, col: V.hex(pal[Math.floor(R()*pal.length)]) });
    ctx.group.add(s.st.mesh);
    V.overlayHooks.push((c, t) => {                          // 标题背后的暗场，保证可读
      const k = V.vis(t, 15.0, 20.0, 0.8, 0.7); if (k <= 0) return;
      const g = c.createRadialGradient(960, 540, 60, 960, 540, 620);
      g.addColorStop(0, `rgba(5,7,20,${0.78*k})`); g.addColorStop(1, 'rgba(5,7,20,0)');
      c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
    });
  },
  update(t, lt, ctx){
    const s = ctx.state, camZ = -lt*28;
    V.backdrop.set({ opacity: 0.7 });
    s.d.forEach((d, i) => {
      const a = d.a + d.w*t, z = d.z;
      const near = V.clamp((camZ - z)/30, 0, 1) * V.clamp(1 - (camZ - z - 120)/60, 0, 1);    // 只画相机前方近处：远处收敛到画面中心会干扰标题
      s.st.set(i, Math.cos(a)*d.r, Math.sin(a)*d.r, z, -Math.sin(a), Math.cos(a), 0, d.len, d.wid, d.col, near);
    });
    s.st.commit();
    ctx.cam(V.v3(0, 0, camZ), V.v3(0, 0, camZ - 100), lerp(64, 52, E(lt, 0, 2.5)), lt*0.12);
  },
});
})();

/* s12 · 121–136s 收尾：从漩涡旁倒飞回地面视角 → 退回病房的拱窗内 → 窗前梵高的背影与窗外星空 + 互动问题 */
(function(){
const { E, P, lerp } = V;
V.shot({ id: 's12', start: 121, end: 136, useWorld: true,
  build(ctx){
    const G = V.world.features[0], s = ctx.state;
    s.G = G;
    const curve = new THREE.CatmullRomCurve3([
      G.C.clone().addScaledVector(G.n, -80).add(V.v3(18, -6, 0)),
      G.C.clone().addScaledVector(G.n, -150),
      V.v3(-4, 30, 6),
      V.v3(-1, 18, 52),
      V.P0.clone(),
      V.v3(0, 14.2, 79),
      V.v3(3.0, 11.6, 88.5),           // 退到梵高身后：他的背影居中，窗外是星空
    ], false, 'centripetal');
    s.path = u => curve.getPointAt(V.clamp(u, 0, 1));       // 按弧长取点：速度只由 u(t) 决定，没有折角处的速度突变
    // 片尾 135–136s 渐暗
    V.overlayHooks.push((c, t) => { const k = E(t, 135.0, 136); if (k<=0) return; c.fillStyle = `rgba(4,5,14,${k})`; c.fillRect(0,0,1920,1080); });
  },
  update(t, lt, ctx){
    const s = ctx.state;
    const u = E(t, 121, 130.5);
    const pos = s.path(u).add(V.v3(0, 0.3*Math.sin(t*0.5), 0));
    const tgt = s.G.C.clone().lerp(V.T0, E(t, 121.5, 127.5)).lerp(V.v3(1.6, 9.6, 62), E(t, 127, 131));
    V.world.set({ opacity: lerp(1, 0.82, E(t, 128, 130)) });
    V.setCam(pos, tgt, lerp(56, 46, E(t, 121, 131)), 0.04*Math.sin(t*0.4)*(1 - E(t, 126, 130)));
  },
});
})();

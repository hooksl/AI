/* s01 · 0–20s 开场：贴着湖面掠过 → 穿过麦田 → 越过村庄屋顶 → 冲进大漩涡 → 漩涡隧道里落标题 */
(function(){
const { keys, E, P, lerp, easeOut, vis } = V;

/* 0–15.4：世界内飞行 —— 贴着湖面掠过（水里倒映着星空）→ 穿过麦田 → 越过村庄屋顶、擦过教堂尖塔 → 拉升冲进大漩涡 */
V.shot({ id: 's01a', start: 0, end: 15.4, useWorld: true,
  build(ctx){
    const G = V.world.features[0], s = ctx.state;
    s.G = G;
    const g = k => G.C.clone().addScaledVector(G.n, -k).toArray();
    s.K = [                                   // [t, [x, y, z]]
      [0.0,  [-152, 1.3,  60]],
      [2.4,  [-128, 1.2,  42]],
      [4.6,  [-92,  1.5,  16]],             // 湖东岸
      [6.2,  [-66,  1.9,   2]],             // 进入麦田，麦穗从镜头边掠过
      [8.0,  [-40,  2.4, -14]],
      [9.6,  [-18,  10,  -36]],             // 拉起，越过第一排屋顶
      [11.0, [-2,   17,  -56]],             // 教堂尖塔从右侧擦过
      [12.6, g(70)],
      [14.0, g(38)],
      [14.9, g(15)],
      [15.4, g(2)],                         // 冲到涡心的笔触层里（不冲过头，免得露出笔触层背后的空天空）
    ];
  },
  update(t, lt, ctx){
    const s = ctx.state, G = s.G;
    V.world.set({ reveal: lerp(0.08, 1, easeOut(P(t, 0, 6.0))) });
    const pos = V.v3(...V.keysSmooth(t, s.K)), fov0 = 52;
    // 前进方向（速度方向，前后各取 0.6s 平滑），视线略抬高，让天空与水中倒影同在画面里
    const ahead = V.v3(...V.keysSmooth(Math.min(t + 0.6, 15.4), s.K)).sub(V.v3(...V.keysSmooth(Math.max(0, t - 0.6), s.K))).normalize();
    const fwdT = pos.clone().addScaledVector(ahead, 80).add(V.v3(0, V.lerp(16, 30, E(t, 6, 10)), -30));
    let tgt = fwdT.lerp(G.C, E(t, 8.6, 13.0));
    // 末段相机在漩涡轴线上：看向"前方沿轴 60"与看向涡心方向一致，平滑过渡，穿过涡心时视线不翻转
    tgt.lerp(pos.clone().addScaledVector(G.n, 60), E(t, 13.4, 14.6));
    let fov;
    fov = lerp(lerp(56, 50, E(t, 8, 11)), 64, E(t, 12.5, 15.3));
    const roll = 0.07*Math.sin(t*0.7)*(1 - E(t, 8, 10)) + 0.04*Math.sin(t*0.45)*E(t, 8, 12);
    V.setCam(pos, tgt, fov, roll);
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

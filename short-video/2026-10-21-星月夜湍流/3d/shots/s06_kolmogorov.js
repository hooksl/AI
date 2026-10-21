/* s06_kolmogorov · 54–62s · 占位（待实现）：柯尔莫哥洛夫 */
(function(){
V.shot({ id: 's06', start: 54, end: 62, origin: [16000, 0, 0],
  build(ctx){
    const card = V.card({ w: 40, h: 12, px: 1024, draw(c, W, H){ V.drawPaper(c, W, H); V.txt(c, '占位：柯尔莫哥洛夫', W/2, H/2, `700 90px ${V.FONT.SANS}`, '#2a2218'); } });
    ctx.group.add(card.mesh); ctx.state.card = card;
  },
  update(t, lt, ctx){
    ctx.cam(V.v3(Math.sin(lt*0.3)*10, 2, 60 - lt*2), V.v3(0, 0, 0), 50);
  },
});
})();

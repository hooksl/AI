/* s05_cascade · 46–54s · 占位（待实现）：能量级联 */
(function(){
V.shot({ id: 's05', start: 46, end: 54, origin: [12000, 0, 0],
  build(ctx){
    const card = V.card({ w: 40, h: 12, px: 1024, draw(c, W, H){ V.drawPaper(c, W, H); V.txt(c, '占位：能量级联', W/2, H/2, `700 90px ${V.FONT.SANS}`, '#2a2218'); } });
    ctx.group.add(card.mesh); ctx.state.card = card;
  },
  update(t, lt, ctx){
    ctx.cam(V.v3(Math.sin(lt*0.3)*10, 2, 60 - lt*2), V.v3(0, 0, 0), 50);
  },
});
})();

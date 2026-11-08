const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + process.cwd() + '/film.html?capture=1&w=960&h=540');
  await p.evaluate(() => window.READY);
  for (const t of [1, 3, 6, 9, 13, 18, 23, 28, 33, 38, 42, 47, 51, 55, 58]) {
    const ms = await p.evaluate((f) => { const a = performance.now(); window.renderFrame(f); return performance.now() - a; }, Math.round(t * 24));
    console.log(t, Math.round(ms));
  }
  await b.close();
})();

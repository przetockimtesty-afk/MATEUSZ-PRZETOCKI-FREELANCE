const { chromium } = require('playwright');
(async () => {
  const [svgDir, out] = process.argv.slice(2);
  const fs = require('fs');
  const files = fs.readdirSync(svgDir).filter(f => f.endsWith('.svg'));
  const html = '<html><body style="margin:0;padding:24px;background:#F5F2EC;display:flex;flex-direction:column;gap:24px;align-items:flex-start">' +
    files.map(f => `<div style="padding:16px;background:${f.includes('czerni') ? '#161514' : '#FFFFFF'};border-radius:12px"><img src="file://${svgDir}/${f}" style="height:${f.includes('monogram') ? 64 : 48}px"></div>`).join('') + '</body></html>';
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 400 }, deviceScaleFactor: 2 });
  await p.setContent(html); await p.waitForTimeout(200); await p.screenshot({ path: out, fullPage: true }); await b.close();
})();

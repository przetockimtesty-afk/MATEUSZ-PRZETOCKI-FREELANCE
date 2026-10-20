// Generuje PDF z plan-workflow.html: okładka bez stopki + reszta z numeracją stron.
// Uruchom: node build_plan.js (wymaga Playwright i pypdf)
const { chromium } = require(process.env.PW_PATH || 'playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

(async () => {
  const dir = __dirname;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(dir, 'plan-workflow.html'), { waitUntil: 'networkidle' });

  const footer = `
    <div style="width:100%; font-family: Inter, sans-serif; font-size:7.5pt; color:#5c574f; padding:0 15mm; display:flex; justify-content:space-between;">
      <span>System szukania klientów · plan workflow</span>
      <span>s. <span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>`;

  await page.pdf({ path: path.join(dir, '_cover.pdf'), preferCSSPageSize: true, printBackground: true, pageRanges: '1' });
  await page.pdf({
    path: path.join(dir, '_body.pdf'), preferCSSPageSize: true, printBackground: true, pageRanges: '2-',
    displayHeaderFooter: true, headerTemplate: '<div></div>', footerTemplate: footer,
  });
  await browser.close();

  execFileSync('python3', ['-c', [
    'from pypdf import PdfWriter',
    'w = PdfWriter()',
    'w.append("_cover.pdf")',
    'w.append("_body.pdf")',
    'w.add_metadata({"/Title": "System szukania klientów: plan workflow", "/Author": "Mateusz Przetocki"})',
    'w.write("Plan_workflow_leady.pdf")',
  ].join('\n')], { cwd: dir });
  fs.unlinkSync(path.join(dir, '_cover.pdf'));
  fs.unlinkSync(path.join(dir, '_body.pdf'));
  console.log('OK: Plan_workflow_leady.pdf');
})();

// Generuje PDF z workflow.html: okładka bez stopki + reszta z numeracją stron.
// Uruchom: node build.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

(async () => {
  const dir = __dirname;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(dir, 'workflow.html'), { waitUntil: 'networkidle' });

  const footer = `
    <div style="width:100%; font-family: Inter, sans-serif; font-size:7.5pt; color:#8a93a8; padding:0 16mm; display:flex; justify-content:space-between;">
      <span>Workflow A i B · Od zera do freelancera</span>
      <span>s. <span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>`;

  await page.pdf({ path: path.join(dir, '_wf_cover.pdf'), preferCSSPageSize: true, printBackground: true, pageRanges: '1' });
  await page.pdf({
    path: path.join(dir, '_wf_body.pdf'), preferCSSPageSize: true, printBackground: true, pageRanges: '2-',
    displayHeaderFooter: true, headerTemplate: '<div></div>', footerTemplate: footer,
  });
  await browser.close();

  // Łączenie przez pypdf (pip install pypdf)
  execFileSync('python3', ['-c', [
    'from pypdf import PdfWriter',
    'w = PdfWriter()',
    'w.append("_wf_cover.pdf")',
    'w.append("_wf_body.pdf")',
    'w.add_metadata({"/Title": "Workflow A i B: od pierwszego e-maila do opinii", "/Author": "Mateusz"})',
    'w.write("Workflow_A_B.pdf")',
  ].join('\n')], { cwd: dir });
  fs.unlinkSync(path.join(dir, '_wf_cover.pdf'));
  fs.unlinkSync(path.join(dir, '_wf_body.pdf'));
  console.log('OK: Workflow_A_B.pdf');
})();

// Renders candidate sites in Chromium and extracts signals for scoring.
const { chromium } = require(process.env.PW_PATH);
const fs = require('fs');
const [,, inFile, outFile] = process.argv;
const cands = JSON.parse(fs.readFileSync(inFile, 'utf8'));
const BOOK = ['calendly', 'booksy', 'znanylekarz', 'simplybook', 'bookero', 'cal.com', 'zcal', 'tidycal', 'youcanbook', 'reservio', 'setmore', 'harmonogram', 'wybierz termin', 'zarezerwuj termin', 'umów wizytę online'];
async function inspect(page, url) {
  const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => null);
  if (!resp) return null;
  await page.waitForTimeout(1500);
  return await page.evaluate((BOOK) => {
    const html = document.documentElement.outerHTML.toLowerCase();
    const text = document.body ? document.body.innerText : '';
    const links = [...document.querySelectorAll('a')].map(a => (a.getAttribute('href') || '') + ' ' + a.innerText).join('\n').toLowerCase();
    const years = (text.match(/(?:©|copyright|\b)\s?(20[0-2]\d)\b/gi) || []).map(y => +y.match(/20\d\d/)[0]);
    return {
      title: document.title, finalUrl: location.href, textLen: text.length,
      text: text.slice(0, 4000),
      viewport: !!document.querySelector('meta[name=viewport]'),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 5,
      form: !!document.querySelector('form textarea, form input[type=email], form input[type=tel], iframe[src*="form"], .wpcf7, [class*="form"] textarea'),
      booking: BOOK.filter(k => html.includes(k)),
      tel: html.includes('tel:'), mailto: html.includes('mailto:'),
      whatsapp: html.includes('wa.me') || html.includes('whatsapp'),
      knf: /knf|rejestr pośredników|rpk\d|rpkh\d|numer wpisu/i.test(text),
      maxYear: years.length ? Math.max(...years) : null,
      builder: ['wix', 'webwave', 'squarespace', 'site123', 'strikingly', 'wordpress', 'shoper'].filter(b => html.includes(b)),
      kontakt: [...document.querySelectorAll('a')].map(a => a.href).find(h => /kontakt|contact/i.test(h)) || null,
      links: links.slice(0, 3000),
    };
  }, BOOK);
}
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' + (fs.existsSync('/opt/pw-browsers/chromium/chrome') ? '/chrome' : ''), args: ['--no-sandbox'] }).catch(async () => chromium.launch({ args: ['--no-sandbox'] }));
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148', ignoreHTTPSErrors: false });
  const out = {};
  for (const c of cands) {
    out[c.nazwa] = [];
    for (const d of c.domains) {
      const page = await ctx.newPage();
      let r = null, https = true;
      for (const u of [`https://${d}/`, `https://www.${d}/`, `http://${d}/`]) {
        r = await inspect(page, u);
        if (r) { https = u.startsWith('https'); break; }
      }
      if (r && r.kontakt && r.kontakt.startsWith('http')) {
        const k = await inspect(page, r.kontakt);
        if (k) { r.form = r.form || k.form; r.booking = [...new Set([...r.booking, ...k.booking])]; r.knf = r.knf || k.knf; r.text += '\n' + k.text.slice(0, 2000); }
      }
      if (r) out[c.nazwa].push({ domain: d, https, ...r });
      await page.close();
      console.log(c.nazwa.slice(0, 30), d, r ? 'OK' : '-');
    }
  }
  fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
  await browser.close();
})();

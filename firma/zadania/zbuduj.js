// PDF z zadania.html (A4, numeracja stron w stopce).
// Uruchom: node firma/zadania/zbuduj.js   (Playwright z strona/wordpress/node_modules)
const path = require('path');
const { chromium } = require(require.resolve('playwright-core', { paths: [path.join(__dirname, '..', '..', 'strona', 'wordpress')] }));

(async () => {
	const przegladarka = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
	const page = await przegladarka.newPage();
	await page.goto('file://' + path.join(__dirname, 'zadania.html'), { waitUntil: 'networkidle' });
	await page.evaluate(() => document.fonts.ready);
	const stopka = `<div style="width:100%; font-family: Inter, sans-serif; font-size:7.5pt; color:#5c574f; padding:0 16mm; display:flex; justify-content:space-between;">
		<span>Twoje zadania · stan na 26.10.2026</span><span>s. <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
	await page.pdf({
		path: path.join(__dirname, 'Zadania_Mateusza.pdf'), preferCSSPageSize: true, printBackground: true,
		displayHeaderFooter: true, headerTemplate: '<div></div>', footerTemplate: stopka,
	});
	await przegladarka.close();
	console.log('OK: Zadania_Mateusza.pdf');
})();

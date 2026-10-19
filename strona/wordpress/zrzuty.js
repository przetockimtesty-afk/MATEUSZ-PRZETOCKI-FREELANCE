// Zrzuty ekranu opublikowanej strony (komputer i telefon) do sprawdzenia wyglądu.
// Przeglądarka nie łączy się sama: każde żądanie idzie przez fetch w Node (proxy i certyfikaty środowiska).
// Użycie: NODE_USE_ENV_PROXY=1 node zrzuty.js [ścieżka ...]   → zrzuty/<nazwa>-komputer.png, -telefon.png
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const DOMENA = 'https://mateuszprzetocki.pl';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
const WYJSCIE = path.join(__dirname, 'zrzuty');
fs.mkdirSync(WYJSCIE, { recursive: true });
const sciezki = process.argv.slice(2).length ? process.argv.slice(2) : ['/'];
const WIDOKI = [
	{ nazwa: 'komputer', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
	{ nazwa: 'telefon', viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
];

async function przezNode(route) {
	const req = route.request();
	if (!req.url().startsWith(DOMENA)) return route.abort();
	try {
		const naglowki = { ...req.headers(), 'user-agent': UA };
		delete naglowki['accept-encoding'];
		const res = await fetch(req.url(), { method: req.method(), headers: naglowki, body: req.postDataBuffer() || undefined, redirect: 'manual' });
		const body = Buffer.from(await res.arrayBuffer());
		const headers = {};
		res.headers.forEach((v, k) => { if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(k)) headers[k] = v; });
		await route.fulfill({ status: res.status, headers, body });
	} catch (e) {
		await route.abort();
	}
}

(async () => {
	const przegladarka = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
	for (const w of WIDOKI) {
		const ctx = await przegladarka.newContext({ ...w, userAgent: UA });
		await ctx.route('**/*', przezNode);
		const page = await ctx.newPage();
		for (const s of sciezki) {
			await page.goto(DOMENA + s + (s.includes('?') ? '&' : '?') + 'nc=' + Date.now(), { waitUntil: 'networkidle', timeout: 120000 });
			await page.evaluate(async () => {
				// w prawdziwej przeglądarce obrazy „lazy” ładują się przy przewijaniu; tu wymuszamy je od razu
				document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
				await document.fonts.ready;
				for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
				window.scrollTo(0, 0);
			});
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(800);
			const nazwa = (s.replace(/\//g, '-').replace(/^-|-$/g, '') || 'glowna') + '-' + w.nazwa;
			await page.screenshot({ path: path.join(WYJSCIE, nazwa + '.png'), fullPage: true });
			const wysokosc = await page.evaluate(() => document.body.scrollHeight);
			const poziomo = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
			process.stdout.write(`✓ ${nazwa} (${wysokosc} px${poziomo ? ', UWAGA: przewijanie w bok' : ''})\n`);
		}
		await ctx.close();
	}
	await przegladarka.close();
})().catch((e) => { console.error(e); process.exit(1); });

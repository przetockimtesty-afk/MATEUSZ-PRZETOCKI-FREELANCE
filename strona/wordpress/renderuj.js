// Zamienia ilustracje z projektu w Claude Design (telefony, laptop) i zaślepki zdjęć na obrazy PNG,
// które w WordPressie są zwykłymi blokami Obraz: można je podmienić jednym kliknięciem.
// Użycie: node renderuj.js   → zapisuje ilustracje/png/*.png i ilustracje/lista.json
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const KORZEN = path.resolve(__dirname, '..');
const PROJEKT = path.join(KORZEN, 'projekt-claude-design');
const MARKA = path.join(KORZEN, 'system-marki', 'project');
const WYJSCIE = path.join(__dirname, 'ilustracje', 'png');
fs.mkdirSync(WYJSCIE, { recursive: true });

// Ikony Lucide z pakietu systemu marki
const bundle = fs.readFileSync(path.join(MARKA, 'components', 'bundle.js'), 'utf8');
const ICONS = JSON.parse(bundle.match(/var ICONS = (\{.*?\});/s)[1]);

function attrs(tag) {
	const o = {};
	for (const m of tag.matchAll(/([a-z-]+)="([^"]*)"/g)) o[m[1]] = m[2];
	return o;
}
function svg(name, size, stroke = 1.5) {
	if (!ICONS[name]) throw new Error('Brak ikony ' + name);
	return `<svg class="mp-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}
function phone(a, kids) {
	const w = +a.width || 300, ht = +a.height || Math.round(w * 2.04);
	const pad = Math.round(w * 0.04), rad = Math.round(w * 0.153), nw = Math.round(w * 0.28), nh = Math.round(w * 0.08), nt = Math.round(w * 0.073);
	const demo = `<div class="mp-phone-demo" style="padding-top:${nt + nh + 10 - pad}px">${w < 200 ? 'Demo' : 'Projekt demonstracyjny'}</div>`;
	return `<div class="mp-phone" style="width:${w}px;height:${ht}px;padding:${pad}px;border-radius:${rad}px"><span class="mp-phone-notch" aria-hidden="true" style="top:${nt}px;width:${nw}px;height:${nh}px;margin-left:${-nw / 2}px"></span><div class="mp-phone-screen" style="border-radius:${rad - pad}px">${demo}${kids}</div></div>`;
}
// Zamienia <x-import component-from-global-scope="MP.X" …>…</x-import> na statyczny HTML (od najgłębszych)
function rozwin(html) {
	const re = /<x-import component-from-global-scope="MP\.([A-Za-z]+)"([^>]*)>((?:(?!<x-import)[\s\S])*?)<\/x-import>/;
	let m;
	while ((m = html.match(re))) {
		const [cale, nazwa, reszta, kids] = m;
		const a = attrs(reszta);
		let out;
		if (nazwa === 'Icon') out = svg(a.name, +a.size || 24, a['stroke-width'] || 1.5);
		else if (nazwa === 'IconCircle') out = `<span class="mp-icon-circle">${svg(a.name, 24)}</span>`;
		else if (nazwa === 'PhoneFrame') out = phone(a, kids);
		else if (nazwa === 'LaptopFrame') out = `<div class="mp-laptop"><div class="mp-laptop-screen"><div class="mp-laptop-demo">Projekt demonstracyjny</div>${kids}</div></div>`;
		else if (nazwa === 'Tag') out = `<span class="mp-tag mp-tag-${a.tone || 'blue'}">${kids}</span>`;
		else throw new Error('Nieobsługiwany komponent w ilustracji: ' + nazwa);
		html = html.replace(cale, out);
	}
	return html;
}
// Wycina element <div … role="img" aria-label="…"> razem z zawartością
function ilustracje(plik) {
	const s = fs.readFileSync(path.join(PROJEKT, plik), 'utf8');
	const wyniki = [];
	const re = /<div([^>]*)role="img" aria-label="([^"]*)"([^>]*)>/g;
	let m;
	while ((m = re.exec(s))) {
		const start = m.index;
		let glebokosc = 0, koniec = -1;
		const tagi = /<(\/?)div\b[^>]*>/g;
		tagi.lastIndex = start;
		let t;
		while ((t = tagi.exec(s))) {
			glebokosc += t[1] ? -1 : 1;
			if (glebokosc === 0) { koniec = t.index + t[0].length; break; }
		}
		wyniki.push({ etykieta: m[2], html: s.slice(start, koniec) });
	}
	return wyniki;
}

// Co renderujemy: plik projektu + etykieta → nazwa obrazu (i szerokość dla elastycznych ramek)
const PLAN = [
	{ plik: 'Main.dc.html', etykieta: 'Telefon z ekranem rezerwacji z dema i powiadomieniem o nowej konsultacji w czwartek o 19:30', nazwa: 'telefon-rezerwacja-powiadomienie' },
	{ plik: 'Main.dc.html', etykieta: 'Wyniki wyszukiwania w Google ze stroną ekspertki kredytowej', nazwa: 'telefon-google' },
	{ plik: 'Main.dc.html', etykieta: 'Najczęstsze pytania i wybór terminu na stronie dema', nazwa: 'telefon-pytania-termin' },
	{ plik: 'Main.dc.html', etykieta: 'Potwierdzenie rezerwacji na czwartek 19:30', nazwa: 'telefon-potwierdzenie' },
	{ plik: 'Main.dc.html', etykieta: 'Strona ekspertki kredytowej z dema na komputerze i na telefonie', nazwa: 'demo-laptop-telefon', szerokosc: 600 },
	{ plik: 'Demo-doradca.dc.html', etykieta: 'Pierwszy ekran strony ekspertki kredytowej na komputerze, z wyborem terminu', nazwa: 'demo-laptop', szerokosc: 640 },
	{ plik: 'Doradcy.dc.html', etykieta: 'Ekran rezerwacji konsultacji z dema', nazwa: 'doradcy-rezerwacja' },
	{ plik: 'Doradcy.dc.html', etykieta: 'Formularz wstępnej analizy z przedziałami kwot', nazwa: 'doradcy-formularz' },
	{ plik: 'Biura.dc.html', etykieta: 'Formularz zapytania o współpracę z przedziałami', nazwa: 'biura-formularz' },
	{ plik: 'Biura.dc.html', etykieta: 'Najczęstsze pytania i wybór terminu rozmowy', nazwa: 'biura-pytania-termin' },
	{ plik: 'Biura.dc.html', etykieta: 'Potwierdzenie rozmowy o współpracy', nazwa: 'biura-potwierdzenie' },
	{ plik: 'Terapeuci.dc.html', etykieta: 'Opis podejścia i specjalizacji terapeuty', nazwa: 'terapeuci-podejscie' },
	{ plik: 'Terapeuci.dc.html', etykieta: 'Wybór formy wizyty i terminu', nazwa: 'terapeuci-wizyta' },
	{ plik: 'Terapeuci.dc.html', etykieta: 'Potwierdzenie pierwszej sesji', nazwa: 'terapeuci-potwierdzenie' },
];

// Zaślepki zdjęć: tło piasek-ciemny, ikona i podpis, jak w systemie marki
const ZASLEPKI = [
	{ nazwa: 'zaslepka-portret', w: 800, h: 1000, ikona: 'image', tekst: 'Twoje zdjęcie: portret do pasa', alt: 'Miejsce na Twoje zdjęcie: portret do pasa' },
	{ nazwa: 'zaslepka-przy-pracy', w: 800, h: 600, ikona: 'laptop', tekst: 'Przy pracy', alt: 'Miejsce na zdjęcie przy pracy' },
	{ nazwa: 'zaslepka-zrzut', w: 800, h: 500, ikona: 'image', tekst: 'Miejsce na zrzut ekranu', alt: 'Miejsce na zrzut ekranu' },
	{ nazwa: 'zaslepka-awatar', w: 160, h: 160, ikona: 'user', tekst: '', alt: 'Miejsce na Twoje zdjęcie' },
];

function fonty() {
	const f = (rodzina, plik, waga, styl) => `@font-face{font-family:"${rodzina}";src:url("file://${path.join(MARKA, 'fonts', plik)}") format("woff2");font-weight:${waga};font-style:${styl};font-display:block}`;
	return [
		f('Inter', 'Inter-400.woff2', 400, 'normal'), f('Inter', 'Inter-500.woff2', 500, 'normal'), f('Inter', 'Inter-600.woff2', 600, 'normal'),
		f('Inter Tight', 'InterTight-600.woff2', 600, 'normal'), f('Inter Tight', 'InterTight-700.woff2', 700, 'normal'),
		f('Instrument Serif', 'InstrumentSerif-Italic.woff2', 400, 'italic'), f('Instrument Serif', 'InstrumentSerif-Regular.woff2', 400, 'normal'),
	].join('\n');
}
function strona(srodek, { szerokosc } = {}) {
	const tokens = fs.readFileSync(path.join(PROJEKT, 'ds', 'mp', 'tokens.css'), 'utf8').replace(/@font-face[^}]*\}/g, '');
	const css = fs.readFileSync(path.join(MARKA, 'components', 'bundle.css'), 'utf8');
	const szer = szerokosc ? `#ilustracja{width:${szerokosc}px;flex:none !important}` : '';
	return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><style>${fonty()}\n${tokens}\n${css}\n*,*::before,*::after{box-sizing:border-box}html,body{margin:0;background:transparent !important}.scena{display:inline-block;padding:48px;font-family:var(--font-tekst);color:var(--czern);font-size:18px;line-height:1.6}${szer}</style></head><body><div class="scena">${srodek}</div></body></html>`;
}

(async () => {
	const przegladarka = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
	const lista = [];
	// ilustracje: 2× gęstość pikseli, przezroczyste tło
	const ctx = await przegladarka.newContext({ deviceScaleFactor: 2, viewport: { width: 1400, height: 1200 } });
	const page = await ctx.newPage();
	for (const poz of PLAN) {
		const znalezione = ilustracje(poz.plik).find((x) => x.etykieta === poz.etykieta);
		if (!znalezione) throw new Error('Nie znalazłem ilustracji: ' + poz.etykieta);
		const html = rozwin(znalezione.html).replace(/^<div/, '<div id="ilustracja"');
		await page.setContent(strona(html, poz), { waitUntil: 'load' });
		await page.evaluate(() => document.fonts.ready);
		const pudlo = await page.evaluate(() => {
			const el = document.getElementById('ilustracja');
			let r = el.getBoundingClientRect();
			let x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom;
			for (const d of el.querySelectorAll('*')) {
				// to, co ekran telefonu albo laptopa przycina (overflow: hidden), nie poszerza kadru
				if (d.parentElement && d.parentElement.closest('.mp-phone-screen, .mp-laptop-screen')) continue;
				const q = d.getBoundingClientRect();
				if (!q.width || !q.height) continue;
				x0 = Math.min(x0, q.left); y0 = Math.min(y0, q.top); x1 = Math.max(x1, q.right); y1 = Math.max(y1, q.bottom);
			}
			return { x: Math.floor(x0), y: Math.floor(y0), width: Math.ceil(x1 - x0), height: Math.ceil(y1 - y0) };
		});
		const plik = path.join(WYJSCIE, poz.nazwa + '.png');
		await page.screenshot({ path: plik, clip: pudlo, omitBackground: true });
		lista.push({ nazwa: poz.nazwa, alt: poz.etykieta, szerokosc: pudlo.width, wysokosc: pudlo.height, plik: path.relative(__dirname, plik) });
		process.stdout.write(`✓ ${poz.nazwa} ${pudlo.width}×${pudlo.height}\n`);
	}
	// zaślepki zdjęć: 1×, rozmiar już podwójny
	const ctx1 = await przegladarka.newContext({ deviceScaleFactor: 1, viewport: { width: 1200, height: 1200 } });
	const p1 = await ctx1.newPage();
	for (const z of ZASLEPKI) {
		const rozmiarIkony = Math.round(Math.min(z.w, z.h) / (z.tekst ? 9 : 3.2));
		const srodek = `<div id="ilustracja" style="width:${z.w}px;height:${z.h}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${Math.round(z.h / 40)}px;background:var(--piasek-ciemny);color:var(--grafit);font:500 ${Math.round(Math.min(z.w, z.h) / 22)}px/1.3 var(--font-tekst);text-align:center">${svg(z.ikona, rozmiarIkony, 1.2)}${z.tekst ? `<span>${z.tekst}</span>` : ''}</div>`;
		await p1.setContent(strona(srodek).replace('padding:48px', 'padding:0'), { waitUntil: 'load' });
		await p1.evaluate(() => document.fonts.ready);
		const plik = path.join(WYJSCIE, z.nazwa + '.png');
		await (await p1.$('#ilustracja')).screenshot({ path: plik });
		lista.push({ nazwa: z.nazwa, alt: z.alt, szerokosc: z.w, wysokosc: z.h, plik: path.relative(__dirname, plik) });
		process.stdout.write(`✓ ${z.nazwa} ${z.w}×${z.h}\n`);
	}
	// ikona witryny z monogramu
	const mono = fs.readFileSync(path.join(KORZEN, 'system-marki', 'logo', 'monogram-mp.svg'), 'utf8');
	await p1.setContent(`<!doctype html><html><head><style>${fonty()}html,body{margin:0;background:transparent}#ilustracja{width:512px;height:512px}#ilustracja svg{width:512px;height:512px;display:block}</style></head><body><div id="ilustracja">${mono}</div></body></html>`, { waitUntil: 'load' });
	await p1.evaluate(() => document.fonts.ready);
	await (await p1.$('#ilustracja')).screenshot({ path: path.join(WYJSCIE, 'ikona-witryny.png'), omitBackground: true });
	lista.push({ nazwa: 'ikona-witryny', alt: 'Monogram MP', szerokosc: 512, wysokosc: 512, plik: 'ilustracje/png/ikona-witryny.png' });
	process.stdout.write('✓ ikona-witryny 512×512\n');
	fs.writeFileSync(path.join(__dirname, 'ilustracje', 'lista.json'), JSON.stringify(lista, null, 1));
	await przegladarka.close();
})().catch((e) => { console.error(e); process.exit(1); });

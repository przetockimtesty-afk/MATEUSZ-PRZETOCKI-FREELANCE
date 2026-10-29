// Buduje stronę mateuszprzetocki.pl w blokach WordPressa z projektu w Claude Design.
// Bloki tworzy i zapisuje ten sam kod, którego używa edytor (@wordpress/blocks), więc po otwarciu
// strony w edytorze nie ma komunikatu „nieoczekiwana treść”.
// Użycie: node zbuduj.js   → build/strony/*.html, build/czesci/*.html, build/style-globalne.json, build/strony.json
const fs = require('fs');
const path = require('path');
const { blocks: B } = require('./srodowisko');

const TU = __dirname;
const BUILD = path.join(TU, 'build');
for (const d of ['strony', 'czesci']) fs.mkdirSync(path.join(BUILD, d), { recursive: true });
const wczytaj = (p, zast) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : zast);

// Media i fonty wgrane przez wyslij.py (przed pierwszym wysłaniem: zaślepki do sprawdzenia bloków)
const MEDIA = wczytaj(path.join(BUILD, 'media.json'), {});
const FONTY = wczytaj(path.join(BUILD, 'fonty.json'), null);
const NAWIGACJA_ID = wczytaj(path.join(BUILD, 'nawigacja.json'), { id: 0 }).id;
const LISTA_OBRAZOW = wczytaj(path.join(TU, 'ilustracje', 'lista.json'), []);

// Ikony Lucide z systemu marki
const bundle = fs.readFileSync(path.join(TU, '..', 'system-marki', 'project', 'components', 'bundle.js'), 'utf8');
const ICONS = JSON.parse(bundle.match(/var ICONS = (\{.*?\});/s)[1]);
const svg = (nazwa, rozmiar = 24) => {
	if (!ICONS[nazwa]) throw new Error('Brak ikony: ' + nazwa);
	return `<svg width="${rozmiar}" height="${rozmiar}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[nazwa].replace(/ \/>/g, '/>')}</svg>`;
};

// ---------------------------------------------------------------- adresy

const U = {
	glowna: '/', dlaKogo: '/dla-kogo/', doradcy: '/dla-kogo/doradcy-kredytowi/', biura: '/dla-kogo/biura-rachunkowe/',
	terapeuci: '/dla-kogo/psycholodzy-i-terapeuci/', oferta: '/oferta/', jakPracuje: '/jak-pracuje/', pytania: '/pytania/',
	realizacje: '/realizacje/', demo: '/realizacje/demo-doradca-kredytowy/', oMnie: '/o-mnie/', kontakt: '/kontakt/',
	polityka: '/polityka-prywatnosci/', regulamin: '/regulamin/', rozmowa: '/rozmowa/', cookies: '/polityka-cookies/',
};
// Ankiety z wtyczki MP Ankiety (ankiety.js). Dopóki wtyczki nie ma na stronie, strony z ankietami są szkicami,
// a przyciski „Wyceń stronę” prowadzą do zaślepki #ankieta. Po włączeniu wtyczki: true i wysyłka stron, nagłówka i stopki.
const ANKIETY_WLACZONE = true;
const ANKIETY = require('./ankiety');
const ANKIETA = ANKIETY_WLACZONE ? '/wycena/' : '#ankieta';
const ROZMOWA = U.rozmowa;
// sekcje głównej, do których prowadzą menu, stopka i przekierowania starych podstron
const G = { jakToDziala: '/#jak-to-dziala', pakiety: '/#pakiety', wspolpraca: '/#wspolpraca', oMnie: '/#o-mnie', pytania: '/#pytania', kontakt: '/#kontakt' };
// Demo A (strona ekspertki kredytowej) na razie nie jest pokazywane (decyzja Mateusza z 23.10): strona demo jest szkicem,
// a zamiast przycisków „Zobacz demo” są „Umów 15 minut” i film z kalendarza. Sekcje zostają tu, gotowe do powrotu.
const DEMO_WLACZONE = false;
const DEMO = '#demo';
// Film z kalendarza rezerwacji (nagrany na kopii strony, plik tylko w mediach WordPressa: jest na nim zdjęcie Mateusza)
const FILM = {
	id: 143, url: 'https://mateuszprzetocki.pl/wp-content/uploads/2026/10/kalendarz-rezerwacji-na-telefonie.mp4',
	plakat: { id: 144, url: 'https://mateuszprzetocki.pl/wp-content/uploads/2026/10/kalendarz-rezerwacji-na-telefonie-plakat.webp' },
};
const FILM_ADRES = '/realizacje/#kalendarz';

// ---------------------------------------------------------------- klocki

const czysc = (o) => {
	if (Array.isArray(o)) return o.map(czysc);
	if (o && typeof o === 'object') {
		const w = {};
		for (const [k, v] of Object.entries(o)) {
			if (v === undefined || v === null || (v === false && !['showContent', 'hasFixedLayout'].includes(k))) continue;
			const c = czysc(v);
			if (c && typeof c === 'object' && !Array.isArray(c) && !Object.keys(c).length) continue;
			w[k] = c;
		}
		return w;
	}
	return o;
};
const blok = (nazwa, atr = {}, dzieci = []) => B.createBlock(nazwa, czysc(atr), dzieci.filter(Boolean));
const kl = (...x) => x.filter(Boolean).join(' ') || undefined;
const SEKCJA = 'clamp(72px, 8.4vw, 120px)';
// Odstęp między nagłówkiem sekcji a treścią: preset motywu (30–50 px). WordPress odrzuca clamp() w odstępach bloków.
const MIEDZY = 'var:preset|spacing|50';

function styl(o) {
	const spacing = {};
	if (o.pad) spacing.padding = o.pad;
	if (o.margines) spacing.margin = o.margines;
	if (o.gap !== undefined) spacing.blockGap = o.gap;
	const s = {};
	if (Object.keys(spacing).length) s.spacing = spacing;
	if (o.typo) s.typography = o.typo;
	if (o.wymiary) s.dimensions = o.wymiary;
	return Object.keys(s).length ? s : undefined;
}

// tekst
const p = (content, o = {}) => blok('core/paragraph', { content, className: o.klasa, align: o.wyrownaj, fontSize: o.rozmiar, textColor: o.kolor, style: styl(o) });
const nad = (t, o = {}) => p(t, { ...o, klasa: kl('is-style-nadtytul', o.klasa) });
const nag = (level, content, o = {}) => blok('core/heading', { level, content, className: o.klasa, textAlign: o.wyrownaj, anchor: o.id, fontSize: o.rozmiar, textColor: o.kolor, style: styl(o) });
const h1 = (t, o) => nag(1, t, o);
const h2 = (t, o) => nag(2, t, o);
const h3 = (t, o) => nag(3, t, o);
const wstep = (t, o = {}) => p(t, { ...o, klasa: kl('is-style-wstep', o.klasa) });
const podpis = (t, o = {}) => p(t, { ...o, klasa: kl('is-style-podpis', o.klasa) });
const szary = (t, o = {}) => p(t, { ...o, kolor: 'grafit' });
const strzalka = (t, url) => p(`<a href="${url}">${t}</a>`, { klasa: 'is-style-strzalka' });
const etykieta = (t, ton) => p(t, { klasa: ton ? `is-style-etykieta-${ton}` : 'is-style-etykieta' });
const okruszki = (lista) => p(lista.map((x) => (Array.isArray(x) ? `<a href="${x[1]}">${x[0]}</a>` : x)).join(' › '), { klasa: 'is-style-okruszki' });

// przyciski
const przycisk = (text, url, o = {}) => blok('core/button', { text, url, className: kl(o.obrys && 'is-style-outline', o.strzalka && 'ze-strzalka', o.maly && 'mp-maly', o.klasa) });
const przyciski = (lista, o = {}) => blok('core/buttons', { className: o.klasa, layout: o.srodek ? { type: 'flex', justifyContent: 'center' } : undefined, style: styl(o) }, lista);

// grafika
// Blok „Własny HTML” w WordPressie 7 trzyma kod jako surową treść bloku (innerContent), nie w atrybucie
function html(kod) {
	const b = B.createBlock('core/html', {});
	b.innerContent = [kod];
	return b;
}
const ikona = (nazwa, o = {}) => html(o.kolo === false ? `<span class="mp-ikona-gola" aria-hidden="true">${svg(nazwa, o.rozmiar || 24)}</span>` : `<span class="mp-ikona" aria-hidden="true">${svg(nazwa, o.rozmiar || 24)}</span>`);
function obraz(nazwa, o = {}) {
	const m = MEDIA[nazwa] || { id: 1, url: `/wp-content/uploads/${nazwa}.webp` };
	const opis = LISTA_OBRAZOW.find((x) => x.nazwa === nazwa);
	return blok('core/image', { id: m.id, url: m.url, alt: o.alt ?? (opis ? opis.alt : ''), caption: o.podpis, sizeSlug: 'full', linkDestination: 'none', className: o.klasa, width: o.szer, align: o.wyrownaj });
}

// Dane kontaktowe (e-mail, adres) są tylko w WordPressie, we wzorcach synchronizowanych „Dane kontaktowe · …”.
// W repozytorium jest tylko ich ID (wzorce.json); bez niego zostaje zaślepka.
const WZORCE = wczytaj(path.join(TU, 'wzorce.json'), {});
const wzorzec = (nazwa, zaslepka) => (WZORCE[nazwa] ? blok('core/block', { ref: WZORCE[nazwa].id }) : zaslepka);

// zdjęcia Mateusza: duże (na głównej założone ręce, na „O mnie” ręce w kieszeniach) i małe przy pracy; pliki są tylko w mediach WordPressa, nie w repozytorium
const zdjecia = (duze) => [obraz(duze, { alt: 'Mateusz Przetocki' }), obraz('mateusz-przetocki-przy-komputerze', { alt: 'Mateusz Przetocki przy pracy nad stroną z kalendarzem rezerwacji' })];

// listy
const lista = (pozycje, o = {}) => blok('core/list', { className: o.klasa, ordered: o.numerowana }, pozycje.map((x) => (typeof x === 'string' ? blok('core/list-item', { content: x }) : blok('core/list-item', { content: x.t, className: x.klasa }))));

// układ
const grupa = (dzieci, o = {}) => blok('core/group', { tagName: o.tag, anchor: o.id, align: o.align, className: o.klasa, backgroundColor: o.tlo, textColor: o.tekst, style: styl(o), layout: o.layout }, dzieci);
const wiersz = (dzieci, o = {}) => grupa(dzieci, { ...o, layout: { type: 'flex', flexWrap: o.nowrap ? 'nowrap' : undefined, justifyContent: o.justify, verticalAlignment: o.pion } });
const siatka = (dzieci, o = {}) => grupa(dzieci, { ...o, gap: o.gap ?? '20px', layout: { type: 'grid', minimumColumnWidth: o.min || '240px' } });
const kolumny = (lista_, o = {}) => blok('core/columns', { verticalAlignment: o.pion, className: o.klasa, style: o.gap ? { spacing: { blockGap: { top: o.gap, left: o.gap } } } : undefined }, lista_.map(([w, dzieci, ko = {}]) => blok('core/column', { width: w, className: ko.klasa, verticalAlignment: ko.pion }, dzieci)));

// sekcja na całą szerokość z treścią do 1120 px
function sekcja(dzieci, o = {}) {
	const srodek = grupa(dzieci, { align: 'wide', gap: o.gap ?? MIEDZY, klasa: o.klasaSrodka });
	return grupa([srodek], {
		tag: 'section', id: o.id, align: 'full', klasa: kl(o.ciemna && 'is-style-ciemna', o.klasa),
		tlo: o.ciemna ? 'czern' : o.tlo, tekst: o.ciemna ? 'krem' : undefined,
		pad: { top: o.gora ?? SEKCJA, bottom: o.dol ?? SEKCJA }, layout: { type: 'constrained' },
	});
}
const naglowekSekcji = (nadtytul, tytul, tekst, o = {}) => grupa([
	nad(nadtytul, { wyrownaj: o.srodek ? 'center' : undefined }),
	h2(tytul, { wyrownaj: o.srodek ? 'center' : undefined }),
	tekst ? p(tekst, { kolor: o.czarny ? undefined : 'grafit', wyrownaj: o.srodek ? 'center' : undefined }) : null,
], { klasa: kl('mp-naglowek-sekcji', o.srodek && 'mp-srodek'), gap: '22px' });
const tekstSekcji = (nadtytul, tytul, reszta = []) => [nad(nadtytul), h2(tytul), ...reszta];

// komponenty systemu marki
const karta = (dzieci, o = {}) => grupa(dzieci, { klasa: kl(o.styl || 'is-style-karta', o.klasa), tag: o.tag, gap: o.gap });
const kartaKorzysci = (nazwaIkony, tytul, tekst) => karta([ikona(nazwaIkony), h3(tytul), p(tekst)]);
const etykiety = (lista_, ton) => wiersz(lista_.map((t) => etykieta(t, ton)), { klasa: 'mp-etykiety', gap: '6px' });
const kartaBranzy = ({ nr, kategoria, tytul, tekst, tagi, link, url }) => grupa([
	nad(`${nr} · ${kategoria}`, { klasa: 'mp-bez-kropki' }), h3(tytul), p(tekst), etykiety(tagi), strzalka(link, url),
], { tag: 'article', klasa: 'is-style-karta-branza' });
function pakiet({ nazwa, cena, waluta = 'zł netto +&nbsp;VAT', dla, plus, punkty, polecany, tekstPrzycisku = 'Wyceń stronę w&nbsp;5&nbsp;minut', url = ANKIETA }) {
	return grupa([
		polecany ? etykieta('Polecam', 'czarna') : null,
		h3(nazwa),
		wiersz([p(cena), p(waluta)], { klasa: 'mp-cena' }),
		dla ? p(dla, { klasa: 'mp-dla' }) : null,
		lista([...(plus ? [{ t: 'Wszystko z&nbsp;poprzedniego pakietu, plus:', klasa: 'mp-plus' }] : []), ...punkty], { klasa: 'is-style-lista-pakiet' }),
		przyciski([przycisk(tekstPrzycisku, url, { obrys: !polecany, strzalka: !!polecany })]),
	], { tag: 'article', klasa: polecany ? 'is-style-pakiet-polecany' : 'is-style-pakiet', gap: '0' });
}
const krok = (nr, tytul, tekst) => grupa([p(String(nr), { klasa: 'is-style-cyfra' }), h3(tytul), p(tekst)], { klasa: 'mp-krok', gap: '0' });
const pytanie = (q, a, otwarte = false) => blok('core/details', { summary: q, showContent: otwarte, className: 'is-style-pytanie' }, [p(a)]);
const pytania = (lista_) => grupa(lista_.map(([q, a, o]) => pytanie(q, a, o)), { klasa: 'mp-pytania', gap: '0' });
function cta(tytul, tekst, o = {}) {
	return grupa([
		h2(tytul),
		p(tekst),
		przyciski([
			przycisk(o.glowny || 'Wyceń stronę w&nbsp;5&nbsp;minut', o.glownyUrl || ANKIETA, { strzalka: true }),
			przycisk(o.drugi || 'Wolisz porozmawiać? Umów 15&nbsp;minut', o.drugiUrl || ROZMOWA, { obrys: true }),
		], { srodek: true }),
	], { klasa: 'is-style-cta is-style-ciemna', tlo: 'czern', tekst: 'krem', gap: '20px' });
}
const zobaczTez = (linki) => wiersz([p('Zobacz też:'), ...linki.map(([t, u]) => strzalka(t, u))], { klasa: 'mp-zobacz-tez' });
const STD_CTA = ['Sprawdź, ile kosztowałaby <em>Twoja</em> strona', '5&nbsp;minut pytań, jednostronicowa propozycja w&nbsp;48 godzin. Wypełnienie do niczego nie zobowiązuje.'];
function nastepnyKrok(linki, o = {}) {
	const [tytul, tekst] = o.cta || STD_CTA;
	return sekcja([
		grupa([nad(o.nadtytul || 'Następny krok'), cta(tytul, tekst, o)], { gap: '22px' }),
		zobaczTez(linki),
	], { id: 'nastepny-krok', gora: o.gora, gap: '0' });
}
// pierwszy ekran podstrony: okruszki, nadtytuł albo etykieta, H1, wstęp
function heroPodstrony({ okruszki: o, nadtytul, etykieta: et, tytul, tekst, reszta = [], dol }) {
	return sekcja([
		okruszki(o),
		grupa([
			nadtytul ? nad(nadtytul) : etykieta(et, 'piasek'),
			h1(tytul),
			tekst ? wstep(tekst) : null,
			...reszta,
		], { klasa: 'mp-hero-tekst', gap: '22px' }),
	], { gora: 'clamp(24px, 2.8vw, 40px)', dol: dol || 'clamp(40px, 4.5vw, 64px)', gap: 'var:preset|spacing|50' });
}
const ekran = (nazwa, opis, nr) => grupa([obraz(nazwa), nr ? p(nr, { klasa: 'is-style-numer' }) : null, p(opis, { klasa: 'mp-opis' })], { gap: '0' });
const ekrany = (lista_) => wiersz(lista_.map(([n, o, nr]) => ekran(n, o, nr)), { klasa: 'mp-ekrany', nowrap: true, justify: 'center', gap: '32px', pion: 'top' });
const listaIkon = (pozycje) => grupa(pozycje.map(([n, t]) => wiersz([ikona(n, { kolo: false, rozmiar: 20 }), p(t)], { nowrap: true, gap: '12px', klasa: 'mp-punkt' })), { gap: '10px', klasa: 'mp-lista-ikon' });
const zaufanie = (pozycje) => sekcja([wiersz(pozycje.map(([n, t]) => wiersz([ikona(n, { kolo: false }), p(t)], { nowrap: true })), { klasa: 'mp-zaufanie', justify: 'space-between' })], { ciemna: true, gora: '30px', dol: '30px', klasa: 'mp-pasek-zaufania' });

// ---------------------------------------------------------------- treści wspólne

const PUNKTY = {
	p1: ['Jedna strona, 6&nbsp;sekcji, wersja na telefon', 'Formularz z&nbsp;potwierdzeniem dla klienta', 'Podstawy SEO, polityka prywatności, informacje formalne'],
	p1oferta: ['Jedna strona, 6&nbsp;sekcji, wersja na telefon', 'Formularz z&nbsp;potwierdzeniem dla klienta', 'Treści napisane na podstawie ankiety', 'Podstawy SEO, polityka prywatności, informacje formalne', 'Gotowa w&nbsp;ok.&nbsp;2&nbsp;tygodnie od otrzymania materiałów'],
	p2: ['Formularz wstępnych pytań i&nbsp;kalendarz konsultacji', 'Odpowiedzi na najczęstsze pytania i&nbsp;miejsce na opinie', 'Profil Firmy w&nbsp;Google, gdy firma spełnia wytyczne'],
	p3: ['Film powitalny 60&nbsp;s i&nbsp;poradnik PDF dla klientów', 'System próśb o&nbsp;opinie: karta z&nbsp;kodem QR, SMS, e-mail'],
};
const trzyPakiety = (p1) => siatka([
	pakiet({ nazwa: 'Wizytówka', cena: '1&nbsp;200', dla: 'Gdy wystarczy, że klient Cię znajdzie i&nbsp;napisze.', punkty: p1 }),
	pakiet({ nazwa: 'Wizytówka, która umawia', cena: '1&nbsp;800', dla: 'Gdy chcesz mniej telefonów i&nbsp;krótsze pierwsze rozmowy.', plus: true, punkty: PUNKTY.p2, polecany: true }),
	pakiet({ nazwa: 'Pełny start', cena: '2&nbsp;500', dla: 'Gdy chcesz od razu zbierać opinie i&nbsp;kontakty.', plus: true, punkty: PUNKTY.p3 }),
], { min: '300px', klasa: 'mp-pakiety' });
const pakietPolecany = (punkty) => pakiet({ nazwa: 'Wizytówka, która umawia', cena: '1&nbsp;800', dla: 'Gdy chcesz mniej telefonów i&nbsp;krótsze pierwsze rozmowy.', punkty, polecany: true });
const BRANZE = {
	doradcy: { nr: '01', kategoria: 'Finanse', tytul: 'Doradcy kredytowi', tekst: 'Klient z&nbsp;polecenia szuka Cię wieczorem. Formularz wstępnej analizy i&nbsp;kalendarz sprawiają, że umawia się od razu, a&nbsp;nie rano u&nbsp;kogoś innego.', tagi: ['formularz analizy', 'kalendarz', 'informacje KNF'], link: 'Strona dla doradców kredytowych', url: U.doradcy },
	biura: { nr: '02', kategoria: 'Księgowość', tytul: 'Biura rachunkowe', tekst: 'W&nbsp;sezonie PIT i&nbsp;przy zmianach przepisów telefon dzwoni bez przerwy. Strona odpowiada na stałe pytania, a&nbsp;nowy klient sam umawia rozmowę.', tagi: ['pytania o&nbsp;KSeF', 'ceny „od”', 'umawianie rozmów'], link: 'Strona dla biur rachunkowych', url: U.biura },
	terapeuci: { nr: '03', kategoria: 'Terapia', tytul: 'Psycholodzy i&nbsp;terapeuci', tekst: 'Pierwszy telefon do terapeuty bywa dla klienta trudny. Spokojna strona z&nbsp;Twoim podejściem i&nbsp;kalendarzem pozwala umówić się bez rozmowy.', tagi: ['podejście', 'wizyty online', 'kalendarz'], link: 'Strona dla psychologów', url: U.terapeuci },
	agenci: { nr: '04', kategoria: 'Ubezpieczenia', tytul: 'Agenci ubezpieczeniowi', tekst: 'Klient porównuje polisy wieczorem, a&nbsp;Ty jesteś w&nbsp;terenie. Formularz potrzeb i&nbsp;kalendarz spotkań pozwalają mu umówić się od razu.', tagi: ['formularz potrzeb', 'kalendarz spotkań', 'rejestr agentów'], link: 'Wyceń stronę dla agenta', url: ANKIETA },
	fizjo: { nr: '05', kategoria: 'Fizjoterapia', tytul: 'Fizjoterapeuci', tekst: 'Pacjent dzwoni, gdy jesteś w&nbsp;trakcie zabiegu. Kalendarz wizyt i&nbsp;odpowiedzi o&nbsp;pierwszą wizytę sprawiają, że umawia się sam, bez czekania na oddzwonienie.', tagi: ['kalendarz wizyt', 'pierwsza wizyta', 'informacja, nie reklama'], link: 'Wyceń stronę dla gabinetu', url: ANKIETA },
	prawo: { nr: '06', kategoria: 'Prawo', tytul: 'Kancelarie prawne', tekst: 'Klient z&nbsp;poważną sprawą szuka kancelarii wieczorem. Zakres praktyki i&nbsp;kalendarz pierwszej konsultacji pozwalają mu umówić się, zanim zadzwoni gdzie indziej.', tagi: ['zakres praktyki', 'pierwsza konsultacja', 'zasady samorządu'], link: 'Wyceń stronę dla kancelarii', url: ANKIETA },
	remont: { nr: '07', kategoria: 'Remonty', tytul: 'Firmy remontowe i&nbsp;wykończeniowe', tekst: 'Jesteś na budowie, a&nbsp;telefon dzwoni z&nbsp;prośbą o&nbsp;wycenę. Formularz z&nbsp;zakresem prac, metrażem i&nbsp;zdjęciami oraz kalendarz oględzin oszczędzają Ci jazd na próżno.', tagi: ['realizacje przed i&nbsp;po', 'formularz wyceny', 'termin oględzin'], link: 'Wyceń stronę dla firmy', url: ANKIETA },
};
// Proces współpracy (plan z 23.10, punkt 7): ten sam na „Jak pracuję”, w prezentacji „Jak przebiega współpraca” i w umowie
const PROCES = [
	['Ankieta, 5&nbsp;minut', 'Pytania o&nbsp;Twoją firmę i&nbsp;klientów. Bez telefonu.'],
	['Propozycja w&nbsp;48&nbsp;h', 'Na piśmie: pakiet, łączna kwota i&nbsp;termin. Ważna 14&nbsp;dni.'],
	['Umowa i&nbsp;zadatek 40%', 'Podpisujesz umowę bez spotkania, skanem albo w&nbsp;telefonie, i&nbsp;w&nbsp;3&nbsp;dni wpłacasz zadatek.'],
	['Materiały i&nbsp;dostępy', 'Wypełniasz formularz materiałów i&nbsp;według krótkich filmów dajesz mi dostęp do domeny i&nbsp;hostingu.'],
	['Szkic w&nbsp;5&nbsp;dni roboczych', 'Od kompletu materiałów, z&nbsp;filmem 2–3&nbsp;minuty. Potem 2&nbsp;rundy poprawek.'],
	['Odbiór i&nbsp;publikacja', 'Sprawdzasz stronę według listy, wpłacasz resztę (60%), a&nbsp;ja publikuję stronę i&nbsp;przesyłam instrukcję.'],
	['30&nbsp;dni wsparcia', 'Odpowiadam na pytania i&nbsp;poprawiam drobiazgi. W&nbsp;14. dniu proszę o&nbsp;opinię, w&nbsp;30. wysyłam podsumowanie.'],
];
// Trzy zasady (zaakceptowane przez Mateusza 25.10): na „O mnie”, a w skrócie na głównej
const ZASADY = [
	['Wszystko jest Twoje, bez abonamentu', 'Domena, hosting i&nbsp;strona są na Ciebie, a&nbsp;kalendarz rezerwacji działa na Twojej stronie bez miesięcznego abonamentu.'],
	['Techniką zajmuję się ja', 'Konfiguruję domenę, pocztę, kalendarz i&nbsp;formularze. Dostaję osobne konto na czas pracy, nigdy Twoich haseł.'],
	['Cena, termin i&nbsp;zakres na piśmie', 'Po ankiecie dostajesz propozycję z&nbsp;łączną kwotą i&nbsp;terminem, a&nbsp;po starcie 30&nbsp;dni wsparcia.'],
];
const filmKalendarza = () => blok('core/video', { id: FILM.id, src: FILM.url, poster: FILM.plakat.url, autoplay: true, loop: true, muted: true, playsInline: true, controls: true, preload: 'metadata', className: 'mp-film-telefon' });
const przyciskFilmu = () => przyciski([przycisk('Zobacz film z&nbsp;kalendarza', FILM_ADRES, { obrys: true, strzalka: true })], { srodek: true });
// drugi przycisk w pierwszym ekranie: demo albo rozmowa
const drugiPrzycisk = () => (DEMO_WLACZONE ? przycisk('Zobacz demo', DEMO, { obrys: true }) : przycisk('Umów 15&nbsp;minut', ROZMOWA, { obrys: true }));
const kartaFilmu = (tytulPoziom) => karta([
	kolumny([
		['55%', [etykieta('Projekt własny', 'piasek'), nag(tytulPoziom, 'Kalendarz rezerwacji na telefonie', { klasa: 'mp-tytul-demo' }), szary('Klient wybiera termin, odpowiada na 3&nbsp;krótkie pytania i&nbsp;od razu dostaje potwierdzenie. Zobacz pół minuty nagrania z&nbsp;telefonu.', { klasa: 'mp-tekst-demo' }), etykiety(['kalendarz', 'pytania przed spotkaniem', 'potwierdzenie e-mailem']), przyciski([przycisk('Zobacz film', FILM_ADRES, { strzalka: true }), przycisk('Sprawdź na żywo', ROZMOWA, { obrys: true })])]],
		['45%', [blok('core/image', { id: FILM.plakat.id, url: FILM.plakat.url, alt: 'Kalendarz rezerwacji na telefonie: wybór dnia i godziny', sizeSlug: 'full', linkDestination: 'custom', href: FILM_ADRES, className: 'mp-film-plakat' })]],
	], { pion: 'center', klasa: 'mp-demo-a' }),
], { klasa: 'mp-karta-demo' });
const kartaDemoA = (tytulPoziom, tekst) => karta([
	kolumny([
		['45%', [etykieta('Projekt demonstracyjny', 'piasek'), nag(tytulPoziom, 'Strona ekspertki kredytowej', { klasa: 'mp-tytul-demo' }), szary(tekst, { klasa: 'mp-tekst-demo' }), etykiety(['formularz analizy', 'kalendarz', 'pytania i&nbsp;odpowiedzi']), przyciski([przycisk('Zobacz na żywo', DEMO, { strzalka: true }), przycisk('Opis przykładu', U.demo, { obrys: true })])]],
		['55%', [obraz('demo-laptop-telefon')]],
	], { pion: 'center', klasa: 'mp-demo-a' }),
], { klasa: 'mp-karta-demo' });

// ---------------------------------------------------------------- strony

const STRONY = {};
function strona(klucz, meta, bloki) { STRONY[klucz] = { ...meta, bloki: bloki.filter(Boolean) }; }

// Strona główna (plan z 29.10, teksty: strona/teksty-glownej-2026-10-29.html), opublikowana 29.10 po akceptacji Mateusza.
// Te same sekcje ma szkic strony testowej (nowaGlowna, id 192).
const UMOW = 'Umów 15&nbsp;minut na Google Meet';
const przyciskUmow = (tekst = UMOW) => przyciski([przycisk(tekst, ROZMOWA, { strzalka: true })]);
const scena = (zawod, kiedy, tekst) => karta([etykieta(zawod, 'piasek'), h3(kiedy), p(tekst)]);
const badanie = (liczba, opis, zrodlo, ok) => karta([
	wiersz([ok ? p(ok, { klasa: 'mp-ok' }) : null, p(liczba, { klasa: 'is-style-liczba' })], { klasa: 'mp-liczba', nowrap: true }),
	p(opis, { klasa: 'mp-opis-liczby' }),
	p(`Źródło: ${zrodlo}`, { klasa: 'mp-zrodlo' }),
], { klasa: 'mp-karta-liczba' });
const strata = (zawod, kwota, jednostka, tekst) => karta([etykieta(zawod, 'piasek'), wiersz([p(kwota), p(jednostka)], { klasa: 'mp-cena' }), p(tekst)]);
const porownanie = ({ etykieta: et, ton, tytul, punkty, nasz }) => karta([
	etykieta(et, ton), h3(tytul),
	listaIkon(punkty.map((t) => [nasz ? 'check' : 'x', t])),
], { klasa: nasz ? 'mp-sciezka mp-sciezka-dobra' : undefined, gap: '18px' });
const PAKIET_PODGLAD = { waluta: 'zł netto +&nbsp;VAT', url: ROZMOWA, tekstPrzycisku: 'Umów 15&nbsp;minut' };
const sekcjeGlownej = () => [
	sekcja([
		kolumny([
			['58%', [
				nad('Strona z&nbsp;kalendarzem dla specjalistów, którzy umawiają spotkania'),
				h1('Klienci umawiają się <em>sami.</em><br>Nawet wieczorem.'),
				wstep('Gdy jesteś na spotkaniu, telefon dzwoni na próżno, a&nbsp;klient umawia się u&nbsp;tego, kto odpowie pierwszy. Twoja nowa strona odpowiada za Ciebie: pokazuje wolne terminy, zadaje pytania przed spotkaniem i&nbsp;wpisuje wizytę do Twojego Kalendarza Google.'),
				lista(['od 1&nbsp;800&nbsp;zł netto +&nbsp;VAT, jednorazowo', 'szkic w&nbsp;5&nbsp;dni roboczych', 'Twoja część: ok.&nbsp;1&nbsp;godziny'], { klasa: 'is-style-lista-kropki' }),
				przyciski([przycisk(UMOW, ROZMOWA, { strzalka: true }), przycisk('Zobacz, jak to działa', '#jak-to-dziala', { obrys: true })]),
				podpis('Umówisz się ze mną tym samym kalendarzem, który dostaną Twoi klienci.'),
				wiersz([obraz('mateusz-przetocki-twarz', { alt: '' }), p('Mateusz Przetocki, Kraków. Odpowiadam osobiście.')], { klasa: 'mp-osoba', nowrap: true }),
			], { klasa: 'mp-hero' }],
			['42%', [obraz('telefon-rezerwacja-powiadomienie', { szer: '336px', wyrownaj: 'center', klasa: 'mp-telefon-hero' })]],
		], { pion: 'center', gap: '48px' }),
	], { id: 'start', gora: 'clamp(28px, 3.9vw, 56px)', dol: 'clamp(64px, 6.7vw, 96px)' }),
	zaufanie([['shield-check', 'Strona i&nbsp;domena są Twoje'], ['circle-check', '0&nbsp;zł abonamentu'], ['receipt', 'Płacisz po akceptacji, przez Useme'], ['life-buoy', '30&nbsp;dni pomocy po starcie']]),
	sekcja([
		naglowekSekcji('Brzmi znajomo?', 'Klient dzwoni, a&nbsp;Ty <em>nie możesz</em> odebrać', 'Oddzwaniasz, gdy kończysz. Tyle że klient umówił się już u&nbsp;kogoś, kto odpowiedział szybciej. Tak to wygląda w&nbsp;trzech zawodach:'),
		siatka([
			scena('Doradca kredytowy', 'Sobota, 19:30', 'Para po obejrzeniu mieszkania szuka doradcy i&nbsp;dzwoni do trzech. Jesteś na spotkaniu z&nbsp;innym klientem. Kredyt poprowadzi ten, kto odebrał.'),
			scena('Psycholog', 'Wtorek, 22:10', 'Ktoś pierwszy raz zbiera się, żeby poszukać pomocy. Do gabinetu nie zadzwoni, a&nbsp;gabinet obok ma kalendarz online. Umawia się tam w&nbsp;dwie minuty.'),
			scena('Biuro rachunkowe', 'Marzec, 15:00', 'W&nbsp;sezonie PIT telefon dzwoni co kwadrans. Nowy klient trafia na zajęty numer i&nbsp;dzwoni do następnego biura z&nbsp;listy.'),
		], { min: '280px' }),
		wstep('<strong>Ile takich osób w&nbsp;tygodniu nie dodzwania się do Ciebie?</strong> Każda z&nbsp;nich to spotkanie, którego nie będzie.'),
	], { id: 'problem', tlo: 'piasek' }),
	sekcja([
		naglowekSekcji('Liczą się minuty', 'Kto odpowie <em>pierwszy</em>, ten ma klienta', 'Zainteresowanie stygnie szybciej, niż się wydaje. Tak wynika z&nbsp;badań sprzedaży:'),
		siatka([
			badanie('21×', 'większa szansa na rozmowę, z&nbsp;której coś wynika, gdy odpowiesz w&nbsp;ciągu 5&nbsp;minut, a&nbsp;nie po pół godzinie.', 'Lead Response Management Study (J.&nbsp;Oldroyd, InsideSales.com)'),
			badanie('60×', 'mniejsza szansa, gdy odezwiesz się dopiero po dobie, a&nbsp;nie w&nbsp;ciągu godziny.', '<a href="https://hbr.org/2011/03/the-short-life-of-online-sales-leads">Harvard Business Review</a>'),
			badanie('30%', 'rezerwacji online w&nbsp;badaniu kliniki Mayo przypadło poza godzinami pracy.', '<a href="https://medinform.jmir.org/2021/3/e23450">JMIR Medical Informatics</a>', 'ok.'),
		], { min: '280px', klasa: 'mp-plansza-czasu' }),
		wstep('Kalendarz na Twojej stronie odpowiada od razu, o&nbsp;każdej porze. Klient umawia się, zanim zacznie szukać dalej.'),
	], { id: 'czas-odpowiedzi' }),
	sekcja([
		naglowekSekcji('Rachunek', 'Ile kosztuje Cię <em>jeden</em> nieodebrany telefon', 'Policz na swoich liczbach. Kwoty niżej to przykłady.'),
		siatka([
			strata('Doradca kredytowy', '2&nbsp;000', 'zł', 'Przy kredycie na 400&nbsp;000&nbsp;zł nawet 0,5% prowizji to 2&nbsp;000&nbsp;zł, więcej niż strona z&nbsp;kalendarzem.'),
			strata('Psycholog', '1&nbsp;500', 'zł', 'Nowy klient na 10&nbsp;sesji po 150&nbsp;zł. Prawie cała cena strony z&nbsp;jednej osoby.'),
			strata('Biuro rachunkowe', '6&nbsp;000', 'zł rocznie', 'Klient na pełnej księgowości za 500&nbsp;zł miesięcznie, często na lata.'),
		], { min: '280px' }),
		karta([
			wstep('Strona z&nbsp;kalendarzem kosztuje raz 1&nbsp;800&nbsp;zł netto. Jeśli umówi się przez nią choć jeden klient, który inaczej poszedłby gdzie indziej, zwraca się przy pierwszym albo drugim takim kliencie.'),
			przyciskUmow(),
		], { styl: 'is-style-karta-przerywana', gap: '20px' }),
	], { id: 'rachunek', tlo: 'piasek' }),
	sekcja([
		kolumny([
			['55%', [
				nad('Jak to działa'),
				h2('Tak umawia się <em>Twój</em> klient'),
				listaIkon([
					['calendar-check', '<strong>Wybiera wolny termin.</strong> Widzi tylko godziny, które naprawdę masz wolne w&nbsp;Kalendarzu Google.'],
					['clipboard-list', '<strong>Odpowiada na 2–3 pytania.</strong> Wiesz, z&nbsp;czym przyjdzie, a&nbsp;pierwsza rozmowa jest krótsza.'],
					['mail', '<strong>Dostaje potwierdzenie i&nbsp;przypomnienie.</strong> Wizyta trafia do Twojego Kalendarza Google, z&nbsp;linkiem do Meet, gdy spotkanie jest online.'],
				]),
				szary('<strong>Co znika z&nbsp;Twojego dnia:</strong> telefony w&nbsp;trakcie spotkań, pięć SMS-ów, żeby ustalić termin, zapomniane wizyty i&nbsp;pierwsza rozmowa o&nbsp;tym, co klient mógł napisać wcześniej.'),
				przyciskUmow('Sprawdź na sobie: umów 15&nbsp;minut'),
			]],
			['45%', [filmKalendarza()]],
		], { pion: 'center' }),
	], { id: 'jak-to-dziala' }),
	sekcja([
		naglowekSekcji('Abonament czy własność', 'Płacisz co miesiąc za kalendarz, który <em>nigdy</em> nie będzie Twój?', 'Aplikacje do rezerwacji działają na abonament: płacisz za sam kalendarz, bez własnej strony, a&nbsp;gdy przestajesz płacić, kalendarz znika. Tu płacisz raz i&nbsp;dostajesz całość na własność.'),
		siatka([
			porownanie({ etykieta: 'Aplikacja z&nbsp;abonamentem', ton: 'piasek', tytul: 'Wynajmujesz kalendarz', punkty: [
				'Płacisz co miesiąc, bez końca.',
				'Dostajesz sam kalendarz, bez własnej strony.',
				'Klient umawia się w&nbsp;cudzej aplikacji, często obok konkurencji.',
				'Przestajesz płacić: kalendarz znika, a&nbsp;profil i&nbsp;opinie zostają w&nbsp;aplikacji.',
			] }),
			porownanie({ etykieta: 'Twoja strona z&nbsp;kalendarzem', ton: 'czarna', tytul: 'Masz wszystko na własność', nasz: true, punkty: [
				'Płacisz raz. Potem tylko domena i&nbsp;hosting na Twoje dane.',
				'Strona, kalendarz, pytania przed spotkaniem i&nbsp;przypomnienia w&nbsp;jednej cenie.',
				'Klient umawia się u&nbsp;Ciebie, pod Twoim adresem.',
				'Nikt nie wyłączy Ci kalendarza. Domena, strona i&nbsp;dane klientów są Twoje.',
			] }),
		], { min: '440px' }),
		wiersz([wstep('<strong>Na swojej stronie to Ty ustalasz zasady.</strong>'), przyciskUmow()], { justify: 'space-between', pion: 'center', gap: '16px 32px' }),
	], { id: 'wlasnosc', tlo: 'piasek' }),
	sekcja([
		naglowekSekcji('Pakiety i&nbsp;ceny', 'Wybierz zakres. Cena jest <em>stała</em>.'),
		grupa([
			siatka([
				pakiet({ ...PAKIET_PODGLAD, nazwa: 'Wizytówka', cena: '1&nbsp;200', dla: 'Na start: klient Cię znajdzie i&nbsp;napisze. Kalendarz możesz dodać później.', punkty: PUNKTY.p1 }),
				pakiet({ ...PAKIET_PODGLAD, nazwa: 'Wizytówka, która umawia', cena: '1&nbsp;800', dla: 'Gdy chcesz, żeby klienci umawiali się sami.', plus: true, polecany: true, punkty: ['Kalendarz połączony z&nbsp;Twoim Kalendarzem Google', 'Pytania przed spotkaniem i&nbsp;przypomnienia e-mailem', 'Odpowiedzi na najczęstsze pytania i&nbsp;miejsce na opinie', 'Profil Firmy w&nbsp;Google, gdy firma spełnia wytyczne'] }),
				pakiet({ ...PAKIET_PODGLAD, nazwa: 'Pełny start', cena: '2&nbsp;500', dla: 'Gdy chcesz od razu zbierać opinie i&nbsp;kontakty.', plus: true, punkty: ['Film powitalny 60&nbsp;s i&nbsp;poradnik PDF dla klientów', 'Prośby o&nbsp;opinie: karta z&nbsp;kodem QR i&nbsp;gotowe wiadomości do wysłania z&nbsp;Twojego telefonu'] }),
			], { min: '300px', klasa: 'mp-pakiety' }),
			p('Ceny startowe obowiązują dla pierwszych 3&nbsp;firm, w&nbsp;zamian za opinię po starcie. Twoja część to ok.&nbsp;1&nbsp;godziny: krótki formularz i&nbsp;kilka kliknięć, każde pokazane na filmie. Teksty piszę ja. Haseł nie wysyłasz.', { klasa: 'mp-przypis-tekst' }),
			karta([wiersz([
				ikona('calendar-check'),
				grupa([h2('Masz już stronę?', { klasa: 'mp-h2-maly' }), szary('Jeśli działa na WordPressie, dodam do niej sam kalendarz, w&nbsp;jej stylu. Cena netto +&nbsp;VAT.')], { gap: '8px', klasa: 'mp-rozciagnij' }),
				grupa([wiersz([p('od'), p('800'), p('zł')], { klasa: 'mp-od', nowrap: true }), strzalka('Umów 15&nbsp;minut', ROZMOWA)], { gap: '12px' }),
			], { gap: '24px 48px', klasa: 'mp-masz-strone' })]),
		], { gap: '30px' }),
	], { id: 'pakiety' }),
	sekcja([
		naglowekSekcji('Bezpieczeństwo', 'Płacisz za to, co <em>sprawdzisz</em> i&nbsp;zaakceptujesz', 'Oddajesz stronę w&nbsp;obce ręce, więc każda złotówka czeka, aż zobaczysz efekt.'),
		siatka([
			kartaKorzysci('receipt', 'Płacisz po akceptacji', 'Dwie części po 50% przez Useme. Każda czeka w&nbsp;Useme i&nbsp;trafia do mnie dopiero, gdy zaakceptujesz szkic, a&nbsp;potem gotową stronę. Stała cena na piśmie, szkic w&nbsp;5&nbsp;dni roboczych, 2&nbsp;rundy poprawek i&nbsp;faktura VAT.'),
			kartaKorzysci('shield-check', 'Wszystko jest Twoje', 'Domena, hosting, strona i&nbsp;dane klientów są na Ciebie. Haseł nie wysyłasz, tylko dajesz uprawnienia, które cofasz jednym kliknięciem. Stronę może przejąć każdy inny wykonawca.'),
			kartaKorzysci('life-buoy', 'Pomoc po starcie', '30&nbsp;dni pomocy: odpowiadam na pytania i&nbsp;poprawiam drobiazgi. Potem drobne zmiany na zlecenie, z&nbsp;ceną podaną przed pracą.'),
		], { min: '280px' }),
		p('<strong>Dla gabinetów:</strong> dane z&nbsp;rezerwacji zostają na Twoim hostingu i&nbsp;w&nbsp;Twoim Kalendarzu Google, a&nbsp;pytania przed spotkaniem ustawiamy tak, żeby nie zbierać danych o&nbsp;zdrowiu.', { klasa: 'mp-przypis-tekst' }),
	], { id: 'bezpieczenstwo', tlo: 'piasek' }),
	sekcja([
		naglowekSekcji('Współpraca', 'Od rozmowy do działającej strony w&nbsp;<em>4</em> krokach'),
		grupa([
			siatka([
				krok(1, 'Rozmowa 15&nbsp;minut', 'Na Google Meet. Pytam, jak dziś umawiają się Twoi klienci, i&nbsp;pokazuję kalendarz. Bez zobowiązań.'),
				krok(2, 'Propozycja do 24&nbsp;h', 'Na piśmie: zakres, stała cena i&nbsp;termin.'),
				krok(3, 'Start i&nbsp;szkic w&nbsp;5&nbsp;dni', 'Umowa i&nbsp;pierwsza część płatności przez Useme, potem krótki formularz z&nbsp;materiałami. Szkic dostajesz w&nbsp;5&nbsp;dni roboczych.'),
				krok(4, 'Odbiór i&nbsp;30&nbsp;dni pomocy', 'Sprawdzasz stronę i&nbsp;zgłaszasz poprawki, płacisz drugą część, a&nbsp;ja publikuję stronę.'),
			], { gap: { top: '0', left: '28px' } }),
			wiersz([p('15&nbsp;minut rozmowy · propozycja do 24&nbsp;h · płatność 50/50 przez Useme'), strzalka('Umów 15&nbsp;minut', ROZMOWA)], { klasa: 'mp-przypis-ciemny', justify: 'space-between' }),
		], { gap: '22px' }),
	], { id: 'wspolpraca', ciemna: true }),
	sekcja([
		kolumny([
			['50%', [grupa(zdjecia('mateusz-przetocki-zalozone-rece'), { klasa: 'mp-zdjecia' })]],
			['50%', tekstSekcji('Kto zrobi Twoją stronę', 'Strony robię <em>sam</em>, od rozmowy do startu', [
				p('Nazywam się Mateusz Przetocki. Przez 5&nbsp;lat codziennie rozmawiałem z&nbsp;klientami przy sprzedaży. Wiem, o&nbsp;co ludzie pytają, zanim się zdecydują, i&nbsp;wiem, że rezygnują, gdy nikt nie odpowiada.'),
				p('Strony buduję na WordPressie i&nbsp;każdą testuję ręcznie: formularze, wersję na telefon i&nbsp;szybkość. Na tej stronie działa ten sam kalendarz, który dostaniesz. Umów się na 15&nbsp;minut i&nbsp;sprawdź go na sobie.'),
				etykiety(ZASADY.map(([t]) => t), 'obrys'),
				strzalka('Umów 15&nbsp;minut', ROZMOWA),
			])],
		], { pion: 'center' }),
	], { id: 'o-mnie' }),
	sekcja([
		kolumny([
			['40%', tekstSekcji('Pytania', 'Zanim <em>zapytasz</em>', [szary('Nie ma tu Twojego pytania? Zadaj je na rozmowie: 15&nbsp;minut na Google Meet.'), strzalka('Umów 15&nbsp;minut', ROZMOWA)])],
			['60%', [pytania([
				['Ile kosztuje utrzymanie?', 'Domena i&nbsp;hosting na Twoje dane: ok.&nbsp;55–75&nbsp;zł netto w&nbsp;pierwszym roku, potem ok.&nbsp;320–370&nbsp;zł netto rocznie. Kalendarz nie ma abonamentu.', true],
				['Czyje to wszystko jest?', 'Twoje: domena, hosting, strona i&nbsp;dane Twoich klientów. Prawa do strony przechodzą na Ciebie po zapłacie.'],
				['Ile to trwa?', 'Szkic w&nbsp;5&nbsp;dni roboczych od kompletu materiałów, publikacja po Twojej akceptacji. Zwykle całość zajmuje ok.&nbsp;2&nbsp;tygodnie.'],
				['Mam już stronę. Co wtedy?', 'Jeśli działa na WordPressie, dodam do niej sam kalendarz, w&nbsp;jej stylu. Od 800&nbsp;zł netto +&nbsp;VAT.'],
				['Co po 30&nbsp;dniach?', 'Strona działa dalej, bez abonamentu. Drobne zmiany robię na zlecenie, z&nbsp;ceną podaną przed pracą. Wszystko jest na Ciebie, więc stronę może przejąć każdy inny wykonawca.'],
				['Czego ta strona nie zrobi?', 'Nie sprowadzi ruchu sama z&nbsp;siebie. Klienci muszą o&nbsp;niej usłyszeć: z&nbsp;polecenia, z&nbsp;Profilu Firmy w&nbsp;Google, z&nbsp;Twoich mediów. Strona sprawia, że ci, którzy już Cię szukają, umawiają się, zamiast odpadać.'],
			])]],
		]),
	], { id: 'pytania', tlo: 'piasek' }),
	sekcja([cta('Sprawdź na sobie, jak to <em>działa</em>', 'Umów 15&nbsp;minut. Umówisz się tym samym kalendarzem, który dostaną Twoi klienci, a&nbsp;po rozmowie będziesz wiedzieć, czy to ma sens w&nbsp;Twojej pracy.', { glowny: UMOW, glownyUrl: ROZMOWA, drugi: 'Wolisz na piśmie? Odpowiedz na kilka pytań', drugiUrl: ANKIETA })], { id: 'kontakt', gora: '0' }),
];
strona('glowna', { tytul: 'Strona główna', slug: 'strona-glowna', opis: 'Klienci umawiają się sami, nawet wieczorem. Strona z kalendarzem od 1 800 zł netto, bez abonamentu. Szkic w 5 dni roboczych, płatność po akceptacji.' }, sekcjeGlownej());
strona('nowaGlowna', { status: 'draft', tytul: 'Podgląd nowej strony głównej', slug: 'podglad-nowej-glownej', ukryta: true, opis: 'Podgląd nowej strony głównej do akceptacji: strona z kalendarzem dla specjalistów, rachunek, abonament czy własność, pakiety i bezpieczeństwo.' }, sekcjeGlownej());

// Oferta
strona('oferta', { status: 'draft', tytul: 'Pakiety i ceny', slug: 'oferta', opis: 'Trzy pakiety ze stałą ceną: 1 200, 1 800 i 2 500 zł. Propozycja na piśmie w 48 h od ankiety, strona gotowa w ok. 2 tygodnie. Faktura bez VAT.' }, [
	heroPodstrony({ okruszki: [['Strona główna', U.glowna], 'Oferta'], nadtytul: 'Oferta', tytul: 'Pakiety i&nbsp;<em>ceny</em>', tekst: 'Trzy pakiety ze stałą ceną. W&nbsp;48 godzin od ankiety dostajesz na piśmie propozycję: pakiet, ewentualne dodatki, łączną kwotę i&nbsp;termin.' }),
	sekcja([
		trzyPakiety(PUNKTY.p1oferta),
		p('Domena i&nbsp;hosting na Ciebie: pierwszy rok ok.&nbsp;55–75&nbsp;zł netto, potem ok.&nbsp;320–370&nbsp;zł netto rocznie. Ceny pakietów są stałe, a&nbsp;łączną kwotę z&nbsp;dodatkami podaję w&nbsp;propozycji.', { klasa: 'mp-przypis-tekst' }),
	], { id: 'pakiety', gora: '16px', gap: '30px' }),
	sekcja([
		naglowekSekcji('Porównanie', 'Co jest w&nbsp;<em>każdym</em> pakiecie'),
		grupa([
			blok('core/table', {
				className: 'is-style-porownanie', hasFixedLayout: false, caption: 'Porównanie trzech pakietów',
				head: [{ cells: [{ content: 'Pakiet', tag: 'th', scope: 'col' }, { content: 'Wizytówka', tag: 'th', scope: 'col' }, { content: 'Wizytówka, która umawia', tag: 'th', scope: 'col' }, { content: 'Pełny start', tag: 'th', scope: 'col' }] }],
				body: [
					['Cena', '1&nbsp;200&nbsp;zł', '1&nbsp;800&nbsp;zł', '2&nbsp;500&nbsp;zł'],
					['Dla kogo', 'Gdy wystarczy, że klient Cię znajdzie i&nbsp;napisze', 'Gdy chcesz mniej telefonów i&nbsp;krótsze pierwsze rozmowy', 'Gdy chcesz od razu zbierać opinie i&nbsp;kontakty'],
					['Strona', 'Jedna strona, 6&nbsp;sekcji, wersja na telefon', 'To samo', 'To samo'],
					['Kontakt', 'Formularz z&nbsp;potwierdzeniem dla klienta', 'Formularz wstępnych pytań i&nbsp;kalendarz konsultacji', 'To samo'],
					['Treści', 'Napisane na podstawie ankiety', 'Plus odpowiedzi na najczęstsze pytania i&nbsp;miejsce na opinie', 'Plus film powitalny 60&nbsp;s i&nbsp;poradnik PDF dla klientów'],
					['Google', 'Podstawy SEO, polityka prywatności, informacje formalne', 'Plus Profil Firmy w&nbsp;Google, gdy firma spełnia wytyczne', 'Plus system próśb o&nbsp;opinie (karta z&nbsp;kodem QR, SMS, e-mail)'],
					['Termin', 'Ok.&nbsp;2&nbsp;tygodnie od otrzymania materiałów', 'To samo', 'To samo'],
				].map((w) => ({ cells: w.map((t, i) => (i === 0 ? { content: t, tag: 'th', scope: 'row' } : { content: t, tag: 'td' })) })),
			}),
			podpis('Na telefonie tabelę przesuwasz palcem w&nbsp;bok.'),
		], { gap: '14px' }),
	], { id: 'porownanie', tlo: 'piasek' }),
	sekcja([
		karta([wiersz([
			ikona('calendar-check'),
			grupa([h2('Masz już stronę?', { klasa: 'mp-h2-maly' }), szary('Kalendarz konsultacji i&nbsp;formularz wstępnych pytań dodam do Twojej obecnej strony, w&nbsp;jej stylu.')], { gap: '8px', klasa: 'mp-rozciagnij' }),
			grupa([wiersz([p('od'), p('800'), p('zł')], { klasa: 'mp-od', nowrap: true }), strzalka('Napisz, jaką masz stronę', U.kontakt)], { gap: '12px' }),
		], { gap: '24px 48px', klasa: 'mp-masz-strone' })]),
	], { id: 'masz-strone', dol: '0' }),
	sekcja([
		kolumny([
			['40%', tekstSekcji('Dodatki', 'Dodatki, gdy ich <em>potrzebujesz</em>', [szary('Do każdego pakietu. Podaję ceny „od”, a&nbsp;dokładną kwotę dostajesz w&nbsp;propozycji po ankiecie.')])],
			['60%', [lista([
				'Profil Firmy w&nbsp;Google: założenie albo porządki <strong>od 300&nbsp;zł</strong>',
				'System próśb o&nbsp;opinie: karta z&nbsp;kodem QR, SMS i&nbsp;e-mail <strong>od 250&nbsp;zł</strong>',
				'Film powitalny 60&nbsp;s: scenariusz, nagranie, montaż <strong>od 400&nbsp;zł</strong>',
				'Poradnik PDF dla Twoich klientów (treść merytoryczna od Ciebie) <strong>od 300&nbsp;zł</strong>',
				'Proste logo, tylko razem ze stroną <strong>od 400&nbsp;zł</strong>',
				'Statystyki odwiedzin z&nbsp;oknem zgód na cookies <strong>od 600&nbsp;zł</strong>',
			], { klasa: 'is-style-lista-cennik' })]],
		]),
	], { id: 'dodatki' }),
	sekcja([
		naglowekSekcji('Warunki', 'Wszystko jest na <em>piśmie</em>'),
		lista([
			'Zadatek 40%, reszta przed publikacją. Dwie rundy poprawek.',
			'Prawa autorskie do treści i&nbsp;grafik, które dla Ciebie tworzę, przechodzą na Ciebie po pełnej zapłacie, na podstawie umowy na piśmie. Zdjęcia z&nbsp;banków zdjęć, czcionki i&nbsp;wtyczki mają własne licencje.',
			'30&nbsp;dni wsparcia po starcie. Potem drobne zmiany na zlecenie, wyceniane przed pracą.',
			'Faktura bez VAT (działalność nierejestrowana) albo faktura VAT przez Useme, wtedy cena +&nbsp;23% VAT.',
			'Domena i&nbsp;hosting na Ciebie, płatne u&nbsp;dostawcy: pierwszy rok ok.&nbsp;55–75&nbsp;zł netto, potem ok.&nbsp;320–370&nbsp;zł netto rocznie (z&nbsp;VAT ok.&nbsp;68–92&nbsp;zł i&nbsp;ok.&nbsp;394–455&nbsp;zł).',
			'Propozycja jest ważna 14&nbsp;dni.',
			`Umowę zawieramy na odległość, więc konsument i&nbsp;jednoosobowa firma mają 14&nbsp;dni na odstąpienie; zasady są w&nbsp;<a href="${U.regulamin}">regulaminie</a>.`,
		], { klasa: 'is-style-lista-znaczniki mp-kolumny' }),
	], { id: 'warunki', tlo: 'piasek' }),
	nastepnyKrok([['Jak pracuję', U.jakPracuje], ['Pytania o&nbsp;cenę i&nbsp;warunki', U.pytania]]),
]);

// Realizacje: na środku kalendarz z filmem, pod nim 3 wcześniejsze projekty (zrzuty i opisy dwóch z nich przyśle Mateusz)
// Zrzuty projektów: klucz z media.json albo null. Bez zrzutu karta nie ma obrazka (zamiast szarej zaślepki, decyzja 26.10).
const ZRZUTY = { zestawy: null, kalkulator: null, kreator: null };
const zrzutProjektu = (nazwa) => (ZRZUTY[nazwa] ? obraz(ZRZUTY[nazwa], { klasa: 'mp-zrzut' }) : null);
const projekt = (zrzut, tytul, problem, zrobione, efekt, link) => karta([
	zrzut, etykieta('Projekt własny', 'piasek'), h3(tytul, { klasa: 'mp-h3-maly' }),
	lista([`<strong>Problem</strong> ${problem}`, `<strong>Co zrobiłem</strong> ${zrobione}`, `<strong>Co to daje</strong> ${efekt}`], { klasa: 'is-style-lista-projekt' }),
	link || null,
], { gap: '16px', klasa: 'mp-projekt' });
strona('realizacje', { tytul: 'Realizacje', slug: 'realizacje', opis: 'Kalendarz rezerwacji na filmie i wcześniejsze projekty: wtyczki do sklepów i kalkulator wyceny. Strony klientów pokazuję za ich zgodą.' }, [
	heroPodstrony({ okruszki: [['Strona główna', U.glowna], 'Realizacje'], nadtytul: 'Realizacje', tytul: 'Realizacje', tekst: 'Kalendarz rezerwacji, który dostają moje strony, i&nbsp;wcześniejsze projekty.' }),
	DEMO_WLACZONE ? sekcja([
		kartaDemoA(2, 'Klient z&nbsp;polecenia szuka doradczyni wieczorem i&nbsp;widzi tylko numer telefonu. Na tej stronie czyta odpowiedzi, wypełnia krótki formularz wstępnej analizy i&nbsp;sam wybiera termin konsultacji.'),
	], { id: 'demo-a', gora: '16px', gap: '20px' }) : null,
	sekcja([
		kolumny([
			['50%', [
				nad('Kalendarz rezerwacji'),
				h2('Klient umawia się <em>sam</em>, nawet wieczorem'),
				p('Tak działa kalendarz, który dostajesz na swojej stronie. To ta sama wtyczka, przez którą umówisz się ze mną: moja własna, bez abonamentu i&nbsp;bez płatnych platform rezerwacji.'),
				lista([
					'Klient wybiera dzień i&nbsp;godzinę spośród Twoich wolnych terminów.',
					'Odpowiada na 3&nbsp;krótkie pytania, więc wiesz, z&nbsp;czym przyjdzie.',
					'Od razu dostaje potwierdzenie e-mailem z&nbsp;plikiem do kalendarza, a&nbsp;Ty powiadomienie.',
				], { klasa: 'is-style-lista-znaczniki' }),
				przyciski([przycisk('Sprawdź na żywo', ROZMOWA, { strzalka: true }), przycisk('Wyceń stronę w&nbsp;5&nbsp;minut', ANKIETA, { obrys: true })]),
				podpis('Projekt własny · działa na tej stronie, w&nbsp;zakładce „Umów rozmowę”'),
			], { klasa: 'mp-kalendarz-tekst' }],
			['50%', [filmKalendarza()]],
		], { pion: 'center', gap: '48px', klasa: 'mp-kalendarz-film' }),
	], { id: 'kalendarz', gora: '16px' }),
	sekcja([
		naglowekSekcji('Wcześniejsze projekty', 'Sklepy i&nbsp;wtyczki, które zbudowałem <em>dla siebie</em>', 'Zanim zacząłem robić strony dla specjalistów, prowadziłem własne sklepy internetowe na WooCommerce i&nbsp;pisałem do nich wtyczki. To projekty własne, nie realizacje dla klientów.'),
		siatka([
			projekt(zrzutProjektu('zestawy'), 'Zestawy produktów ze stałym paskiem zakupu',
				'Na długiej stronie produktu przycisk zakupu znikał z&nbsp;ekranu.',
				'Wtyczkę do WooCommerce: zestawy produktów w&nbsp;jednej cenie i&nbsp;pasek z&nbsp;przyciskiem, który zostaje na ekranie.',
				'Przycisk zakupu jest zawsze pod ręką, także na telefonie.'),
			projekt(zrzutProjektu('kalkulator'), 'Kalkulator ceny prania tapicerki',
				'Klient chciał znać cenę od razu, a&nbsp;wycena przez telefon zajmowała czas.',
				'Kalkulator na stronie puresofa.pl: klient wybiera meble i&nbsp;dodatki, a&nbsp;cena liczy się na bieżąco.',
				'Cena z&nbsp;kalkulatora jest ceną ostateczną, bez dopłat przy drzwiach.',
				p('<a href="https://puresofa.pl/" rel="nofollow noopener" target="_blank">Zobacz na puresofa.pl</a>', { klasa: 'is-style-strzalka' })),
			projekt(zrzutProjektu('kreator'), 'Kreator prezentów z&nbsp;podglądem na żywo',
				'Przed zamówieniem prezentu z&nbsp;personalizacją klient nie wiedział, jak będzie wyglądał.',
				'Wtyczkę do WooCommerce: klient wpisuje tekst i&nbsp;wybiera wzór, a&nbsp;podgląd zmienia się na żywo.',
				'Klient widzi gotowy prezent, zanim zapłaci.'),
		], { min: '280px' }),
	], { id: 'wczesniej', tlo: 'piasek' }),
	nastepnyKrok([['Umów 15&nbsp;minut i&nbsp;sprawdź kalendarz na żywo', U.rozmowa], ['Strony dla Twojej branży', U.dlaKogo]]),
]);

// Opis przykładu: Demo A
strona('demo', { status: DEMO_WLACZONE ? undefined : 'draft', tytul: 'Strona ekspertki kredytowej', slug: 'demo-doradca-kredytowy', rodzic: 'realizacje', opis: 'Projekt demonstracyjny: jak doradca kredytowy dostaje konsultacje z kalendarza i formularza analizy. Problem, rozwiązanie i film. Od 1 800 zł.' }, [
	heroPodstrony({
		okruszki: [['Strona główna', U.glowna], ['Realizacje', U.realizacje], 'Strona ekspertki kredytowej'], etykieta: 'Projekt demonstracyjny',
		tytul: 'Strona ekspertki kredytowej, która <em>umawia</em> konsultacje',
		tekst: 'Anna Nowak z&nbsp;Krakowa jest fikcyjna, a&nbsp;strona działa naprawdę: tak wygląda wizytówka, którą doradca dostaje w&nbsp;pakiecie „Wizytówka, która umawia”.',
		reszta: [
			przyciski([przycisk('Zobacz demo na żywo', DEMO, { strzalka: true }), przycisk('Wyceń stronę w&nbsp;5&nbsp;minut', ANKIETA, { obrys: true })]),
			lista(['Branża: doradztwo kredytowe', 'Pakiet: Wizytówka, która umawia', 'Firma i&nbsp;dane są fikcyjne'], { klasa: 'is-style-lista-kropki' }),
		],
		dol: 'clamp(56px, 6.7vw, 96px)',
	}),
	sekcja([kolumny([
		['40%', [nad('01 · Problem'), h2('Klient szuka jej <em>wieczorem</em>')]],
		['60%', [p('Polecony klient sprawdza ekspertkę w&nbsp;Google po pracy i&nbsp;widzi tylko numer telefonu. O&nbsp;21:00 już nie zadzwoni, więc rano umawia się z&nbsp;kimś, kto odebrał pierwszy.'), p('A&nbsp;gdy dochodzi do rozmowy, pierwsza konsultacja idzie na zbieranie podstaw: kwota, wkład własny, forma zatrudnienia.')], { klasa: 'mp-akapity' }],
	])], { id: 'problem', tlo: 'piasek' }),
	sekcja([
		naglowekSekcji('02 · Rozwiązanie', 'Trzy elementy, które <em>odbierają</em> telefon za nią'),
		siatka([
			kartaKorzysci('clipboard-list', 'Formularz wstępnej analizy', 'Klient podaje kwotę, wkład własny i&nbsp;formę zatrudnienia w&nbsp;przedziałach, bez PESEL i&nbsp;skanów.'),
			kartaKorzysci('calendar-check', 'Kalendarz konsultacji', 'Wybiera termin online albo w&nbsp;biurze, także wieczorem, i&nbsp;dostaje potwierdzenie e-mailem.'),
			kartaKorzysci('message-circle-question', 'Odpowiedzi na pytania', 'Pięć najczęstszych pytań, m.in. o&nbsp;dokumenty, wkład własny i&nbsp;koszt konsultacji, napisanych jej słowami.'),
		], { min: '280px' }),
	], { id: 'rozwiazanie' }),
	sekcja([
		naglowekSekcji('03 · Jak to działa', 'Od wyszukiwania do <em>potwierdzenia</em>'),
		wiersz([
			obraz('demo-laptop', { podpis: 'Komputer: od pierwszego ekranu widać, z&nbsp;kim klient się umawia i&nbsp;kiedy.', klasa: 'mp-laptop' }),
			obraz('telefon-pytania-termin', { podpis: 'Telefon: odpowiedzi i&nbsp;wybór godziny.', klasa: 'mp-telefon', alt: 'Najczęstsze pytania i wybór godziny na telefonie' }),
			obraz('telefon-potwierdzenie', { podpis: 'Telefon: potwierdzenie, a&nbsp;u&nbsp;niej komplet odpowiedzi.', klasa: 'mp-telefon', alt: 'Potwierdzenie rezerwacji na telefonie' }),
		], { klasa: 'mp-jak-dziala', justify: 'center', pion: 'bottom', gap: '32px' }),
	], { id: 'jak-dziala', tlo: 'piasek' }),
	sekcja([kolumny([
		['40%', tekstSekcji('04 · Film', 'Zobacz to w&nbsp;<em>90</em> sekund', [szary('Nagranie ekranu z&nbsp;moim komentarzem: jak klient znajduje stronę, czyta odpowiedzi i&nbsp;umawia konsultację.')])],
		['60%', [grupa([ikona('video'), p('Miejsce na film 60–90&nbsp;s')], { klasa: 'is-style-film is-style-ciemna', tlo: 'czern', tekst: 'szary-na-czerni', gap: '14px' })]],
	], { pion: 'center' })], { id: 'film' }),
	sekcja([kolumny([
		['55%', tekstSekcji('05 · Co dostaje klient', 'Gotowa strona w&nbsp;ok.&nbsp;2&nbsp;<em>tygodnie</em>', [
			p('Tak samo działa strona, którą dostajesz w&nbsp;pakiecie „Wizytówka, która umawia”. Teksty piszę z&nbsp;Twojej ankiety, a&nbsp;domena i&nbsp;strona są na Ciebie.'),
			listaIkon([['clock', 'Termin: ok.&nbsp;2&nbsp;tygodnie od otrzymania materiałów'], ['refresh-cw', '2&nbsp;rundy poprawek i&nbsp;30&nbsp;dni wsparcia'], ['shield-check', 'Domena i&nbsp;strona są Twoje']]),
		])],
		['45%', [pakietPolecany(['Jedna strona, 6&nbsp;sekcji, wersja na telefon', 'Formularz wstępnych pytań i&nbsp;kalendarz konsultacji', 'Odpowiedzi na najczęstsze pytania i&nbsp;miejsce na opinie', 'Profil Firmy w&nbsp;Google, gdy firma spełnia wytyczne'])]],
	], { pion: 'center' })], { id: 'co-dostaje', tlo: 'piasek' }),
	nastepnyKrok([['Strona dla doradców kredytowych', U.doradcy], ['Pakiety i&nbsp;ceny', U.oferta]], { nadtytul: '06 · Następny krok', cta: ['Chcesz taką stronę dla <em>siebie</em>?', STD_CTA[1]] }),
]);

// Kontakt
strona('kontakt', { status: 'draft', tytul: 'Kontakt', slug: 'kontakt', opis: 'Wyceń stronę w 5 minut w ankiecie albo umów 15 minut rozmowy na Google Meet. Propozycja na piśmie w 48 h, bez zobowiązań.' }, [
	heroPodstrony({ okruszki: [['Strona główna', U.glowna], 'Kontakt'], nadtytul: 'Kontakt', tytul: 'Kontakt', tekst: 'Najszybciej przez ankietę. Wolisz rozmowę albo e-mail? Też dobrze.' }),
	sekcja([kolumny([
		['55%', [grupa([
			wiersz([ikona('clipboard-list'), etykieta('Najszybciej', 'czarna')], { justify: 'space-between' }),
			h2('Ankieta, 5&nbsp;<em>minut</em>', { klasa: 'mp-h2-sredni' }),
			p('Odpowiadasz na kilka pytań o&nbsp;firmę i&nbsp;klientów. W&nbsp;48 godzin dostajesz na piśmie propozycję: pakiet, łączną kwotę i&nbsp;termin.'),
			lista(['Bez telefonu i&nbsp;bez zobowiązań', 'Propozycja na piśmie w&nbsp;48&nbsp;h', 'Odpowiadam osobiście'], { klasa: 'is-style-lista-znaczniki mp-lista-mala' }),
			przyciski([przycisk('Wyceń stronę w&nbsp;5&nbsp;minut', ANKIETA, { strzalka: true })]),
			podpis('Bez zobowiązań · propozycja w&nbsp;48&nbsp;h'),
		], { klasa: 'is-style-karta-ankieta' })]],
		['45%', [grupa([
			karta([ikona('video'), h3('Rozmowa 15&nbsp;minut na Google Meet'), p('Wybierasz wolny termin w&nbsp;moim kalendarzu i&nbsp;od razu dostajesz potwierdzenie.'), przyciski([przycisk('Umów 15&nbsp;minut', ROZMOWA, { obrys: true })])]),
			karta([ikona('mail'), h3('E-mail'), p('Odpowiadam w&nbsp;ciągu dnia roboczego.'), wzorzec('email', strzalka('kontakt@…', '#email'))]),
		], { gap: '20px' })]],
	])], { id: 'drogi', gora: '16px', dol: '0' }),
	sekcja([kolumny([
		['40%', [nad('Dane usługodawcy'), szary(`Nie podaję numeru telefonu: wszystko ustalamy na piśmie, a&nbsp;jeśli wolisz rozmowę, umówisz ją w&nbsp;kalendarzu. Pełne dane, z&nbsp;adresem, są w&nbsp;<a href="${U.regulamin}">regulaminie</a>.`, { klasa: 'mp-maly-tekst' })]],
		['60%', [lista([
			'<strong>Imię i&nbsp;nazwisko</strong> Mateusz Przetocki',
			'<strong>Miasto</strong> Kraków',
			`<strong>Dokumenty</strong> <a href="${U.polityka}">Polityka prywatności</a> · <a href="${U.cookies}">Polityka cookies</a> · <a href="${U.regulamin}">Regulamin</a>`,
		], { klasa: 'is-style-lista-dane' })]],
	])], { id: 'dane', gora: 'clamp(56px, 6.7vw, 96px)' }),
]);

// Rozmowa: kalendarz z wtyczki MP Rezerwacje (godziny, pytania i e-maile są w jej ustawieniach, plik rezerwacje-ustawienia.json)
strona('rozmowa', { tytul: 'Umów rozmowę', slug: 'rozmowa', opis: 'Umów 15 minut na Google Meet: opowiesz, jak dziś umawiają się Twoi klienci, zobaczysz kalendarz na żywo i usłyszysz, ile kosztuje strona.' }, [
	sekcja([
		okruszki([['Strona główna', U.glowna], 'Rozmowa']),
		kolumny([
			['44%', [
				nad('Rozmowa 15&nbsp;minut'),
				h1('Porozmawiajmy o&nbsp;Twojej <em>stronie</em>'),
				wstep('Wybierz wolny termin w&nbsp;kalendarzu. Umawiasz się tak samo, jak będą się umawiać Twoi klienci.'),
				lista([
					'Opowiadasz, jak dziś umawiają się Twoi klienci, a&nbsp;ja pytam.',
					'Pokazuję na żywo, jak działa strona z&nbsp;kalendarzem.',
					'Mówię, który pakiet pasuje i&nbsp;ile kosztuje.',
					'Propozycję na piśmie dostajesz do 24&nbsp;h po rozmowie.',
				], { klasa: 'is-style-lista-znaczniki' }),
				podpis('Bez zobowiązań · nie musisz niczego przygotowywać'),
				strzalka('Wolisz na piśmie? Odpowiedz na kilka pytań', ANKIETA),
			], { klasa: 'mp-hero-tekst' }],
			['56%', [blok('mp/rezerwacja', {})]],
		], { pion: 'top', gap: '48px', klasa: 'mp-rozmowa' }),
	], { gora: 'clamp(24px, 2.8vw, 40px)', gap: 'var:preset|spacing|50' }),
]);

// Strony z ankietami: tekst po lewej, ankieta po prawej (jak kalendarz na /rozmowa/).
// Wycena jest publiczna, formularze dla klientów są tylko z linku: „ukryta” = noindex i brak w mapie strony.
function stronaAnkiety(klucz, meta, { okruszki: ok, nadtytul, tytul, tekst, punkty, podpis: pd, reszta = [], definicja, ukryta }) {
	strona(klucz, { ...meta, ukryta, status: ANKIETY_WLACZONE ? undefined : 'draft' }, [
		sekcja([
			ok ? okruszki(ok) : null,
			kolumny([
				['40%', [
					nad(nadtytul),
					h1(tytul),
					wstep(tekst),
					lista(punkty, { klasa: 'is-style-lista-znaczniki' }),
					pd ? podpis(pd) : null,
					...reszta,
				], { klasa: 'mp-hero-tekst' }],
				// wstęp ankiety zastępuje tekst strony po lewej
				['60%', [blok('mp/ankieta', { definicja: { ...definicja, wstep: undefined }, ukryta })]],
			], { pion: 'top', gap: '48px', klasa: 'mp-ankieta-uklad' }),
		], { gora: 'clamp(24px, 2.8vw, 40px)', gap: 'var:preset|spacing|50' }),
	]);
}
stronaAnkiety('wycena', { tytul: 'Wycena strony', slug: 'wycena', opis: 'Kilka pytań o firmę i klientów, a w 48 godzin propozycja na piśmie: pakiet, łączna kwota i termin. Bez telefonu i bez zobowiązań.' }, {
	okruszki: [['Strona główna', U.glowna], 'Wycena'],
	nadtytul: 'Wycena w&nbsp;5&nbsp;minut',
	tytul: 'Sprawdź, ile kosztowałaby <em>Twoja</em> strona',
	tekst: 'Kilka pytań o&nbsp;firmę i&nbsp;klientów, a&nbsp;w&nbsp;48 godzin propozycja na piśmie: pakiet, łączna kwota i&nbsp;termin.',
	punkty: [
		'Propozycja opiera się na Twoich odpowiedziach: cel strony, punkt wyjścia i&nbsp;jak sprawdzimy efekt po 3&nbsp;miesiącach.',
		'Bez telefonu i&nbsp;bez zobowiązań. Odpowiadam osobiście.',
	],
	podpis: 'Bez zobowiązań · propozycja w&nbsp;48&nbsp;h',
	reszta: [strzalka('Wolisz porozmawiać? Umów 15&nbsp;minut', ROZMOWA)],
	definicja: ANKIETY.wycena,
});
stronaAnkiety('materialy', { tytul: 'Materiały na stronę', slug: 'materialy', opis: 'Formularz dla klientów: firma, dane do stopki, usługi, pytania klientów i pliki potrzebne do strony.' }, {
	nadtytul: 'Dla klientów', tytul: 'Materiały na <em>stronę</em>',
	tekst: 'Z&nbsp;tych odpowiedzi powstaną teksty i&nbsp;układ Twojej strony. Pisz tak, jak mówisz do klienta, resztę dopracuję ja.',
	punkty: ['Ok. 20 minut, 7&nbsp;krótkich kroków. Możesz przerwać i&nbsp;wrócić: odpowiedzi pamięta ta przeglądarka.', 'Szkic strony dostajesz w&nbsp;5&nbsp;dni roboczych od kompletu materiałów i&nbsp;dostępów.', 'Masz pytanie? Odpowiedz na e-mail z&nbsp;tym linkiem.'],
	definicja: ANKIETY.materialy, ukryta: true,
});
stronaAnkiety('ustawieniaKalendarza', { tytul: 'Ustawienia kalendarza', slug: 'ustawienia-kalendarza', opis: 'Formularz dla klientów: spotkania, godziny, pytania przed spotkaniem i powiadomienia w kalendarzu rezerwacji.' }, {
	nadtytul: 'Dla klientów', tytul: 'Ustawienia <em>kalendarza</em>',
	tekst: 'Jak długo trwa spotkanie, w&nbsp;jakich godzinach przyjmujesz i&nbsp;o&nbsp;co pytać klienta przy rezerwacji.',
	punkty: ['Ok. 7 minut, 5&nbsp;kroków. Wszystko da się później zmienić.', 'Przy odbiorze strony zrobimy razem próbną rezerwację.'],
	definicja: ANKIETY.kalendarz, ukryta: true,
});
stronaAnkiety('uwagiDoSzkicu', { tytul: 'Uwagi do szkicu', slug: 'uwagi-do-szkicu', opis: 'Formularz dla klientów: uwagi do szkicu strony w jednym miejscu.' }, {
	nadtytul: 'Dla klientów', tytul: 'Uwagi do <em>szkicu</em>',
	tekst: 'Wszystkie uwagi w&nbsp;jednym miejscu, żeby żadna nie zginęła w&nbsp;wiadomościach.',
	punkty: ['Obejrzyj szkic na telefonie i&nbsp;na komputerze, a&nbsp;potem wpisz tu wszystkie uwagi.', 'Także drobiazgi: jedna lista to szybsze poprawki.', 'W&nbsp;cenie są 2&nbsp;rundy poprawek.'],
	definicja: ANKIETY.szkic, ukryta: true,
});
stronaAnkiety('odbiorStrony', { tytul: 'Odbiór strony', slug: 'odbior-strony', opis: 'Formularz dla klientów: sprawdzenie strony przed publikacją i potwierdzenie odbioru.' }, {
	nadtytul: 'Dla klientów', tytul: 'Odbiór <em>strony</em>',
	tekst: 'Zanim strona pójdzie w&nbsp;świat, sprawdź ją tak, jak zrobi to Twój klient: formularze, kalendarz, dane i&nbsp;teksty.',
	punkty: ['Ok. 10 minut.', 'Po potwierdzeniu odbioru i&nbsp;płatności końcowej publikuję stronę.'],
	definicja: ANKIETY.odbior, ukryta: true,
});
stronaAnkiety('po30Dniach', { tytul: 'Po 30 dniach', slug: 'po-30-dniach', opis: 'Formularz dla klientów: jak strona działa po pierwszym miesiącu.' }, {
	nadtytul: 'Dla klientów', tytul: 'Pierwsze 30&nbsp;<em>dni</em>',
	tekst: 'Minął miesiąc od startu strony. Kilka pytań o&nbsp;to, jak działa: liczby, opinia i&nbsp;co poprawić.',
	punkty: ['Ok. 5 minut.', 'Podsumowanie z&nbsp;liczbami wyślę Ci e-mailem.'],
	definicja: ANKIETY.po30, ukryta: true,
});

// Strony prawne: spis treści + dokument
const PRZYCISK_COOKIES = '<button type="button" class="cmplz-manage-consent mp-link-cookies">Ustawienia cookies</button>';
function dokument(klucz, meta, { okruszek, tytul, tekst, spis, tresc }) {
	strona(klucz, meta, [
		heroPodstrony({ okruszki: [['Strona główna', U.glowna], okruszek], nadtytul: 'Dokumenty', tytul, tekst }),
		sekcja([kolumny([
			['30%', [grupa([p('Spis treści'), lista(spis.map(([id, t]) => `<a href="#${id}">${t}</a>`), { numerowana: true })], { klasa: 'is-style-spis', tag: 'nav' })]],
			['70%', [grupa(tresc, { klasa: 'mp-dokument' })]],
		])], { gora: '0' }),
	]);
}
const DANE_ZASLEPKA = () => p('Mateusz Przetocki, [adres], e-mail: kontakt@…');
dokument('polityka', { tytul: 'Polityka prywatności', slug: 'polityka-prywatnosci', opis: 'Jakie dane zbieram przez ankietę, kalendarz i e-mail, po co, jak długo je przechowuję, jakie ciasteczka ustawia strona i jakie masz prawa.' }, {
	okruszek: 'Polityka prywatności', tytul: 'Polityka prywatności',
	tekst: 'Kto przetwarza Twoje dane, gdy wypełniasz ankietę, umawiasz rozmowę albo piszesz e-mail, po co, jak długo i&nbsp;jakie ciasteczka ustawia strona.',
	spis: [['administrator', 'Kto jest administratorem'], ['cele', 'Jakie dane, po co i&nbsp;na jakiej podstawie'], ['odbiorcy', 'Komu przekazuję dane'], ['okres', 'Jak długo je przechowuję'], ['prawa', 'Twoje prawa'], ['cookies', 'Ciasteczka, statystyki i&nbsp;reklamy'], ['kontakt-dane', 'Kontakt w&nbsp;sprawie danych']],
	tresc: [
		h2('1. Kto jest administratorem', { id: 'administrator' }),
		p('Administratorem Twoich danych osobowych jestem ja:'),
		wzorzec('dane', DANE_ZASLEPKA()),
		p('Pracuję sam, więc Twoje dane widzę tylko ja. Przechowują je w&nbsp;moim imieniu firmy wymienione w&nbsp;punkcie 3.'),
		h2('2. Jakie dane, po co i&nbsp;na jakiej podstawie', { id: 'cele' }),
		lista([
			'<strong>Ankieta wyceny:</strong> imię albo nazwa firmy, e-mail i&nbsp;odpowiedzi o&nbsp;Twojej firmie. Używam ich, żeby odpowiedzieć na zapytanie i&nbsp;przygotować propozycję. Podstawa: działania przed zawarciem umowy, podjęte na Twoje żądanie (art.&nbsp;6 ust.&nbsp;1 lit.&nbsp;b RODO).',
			'<strong>Rezerwacja rozmowy:</strong> imię, e-mail, telefon (jeśli go podasz), wybrany termin i&nbsp;odpowiedzi na trzy krótkie pytania o&nbsp;Twoją firmę. Używam ich, żeby umówić, przygotować i&nbsp;przeprowadzić rozmowę na Google Meet, przypomnieć o&nbsp;niej i&nbsp;umożliwić zmianę terminu. Podstawa: art.&nbsp;6 ust.&nbsp;1 lit.&nbsp;b RODO.',
			'<strong>E-mail:</strong> adres i&nbsp;treść wiadomości. Używam ich, żeby odpowiedzieć. Podstawa: mój prawnie uzasadniony interes, czyli odpowiadanie na wiadomości (art.&nbsp;6 ust.&nbsp;1 lit.&nbsp;f RODO), a&nbsp;gdy piszesz w&nbsp;sprawie zamówienia, art.&nbsp;6 ust.&nbsp;1 lit.&nbsp;b RODO.',
			'<strong>Wiadomości o&nbsp;nowościach:</strong> tylko gdy zaznaczysz zgodę w&nbsp;ankiecie. Zapisuję e-mail, datę i&nbsp;treść zgody i&nbsp;co jakiś czas wysyłam krótką wiadomość o&nbsp;stronach i&nbsp;rezerwacjach. Podstawa: Twoja zgoda (art.&nbsp;6 ust.&nbsp;1 lit.&nbsp;a RODO).',
			'<strong>Statystyki i&nbsp;reklamy:</strong> tylko po zgodzie w&nbsp;banerze cookies. Google Analytics i&nbsp;piksel Meta (z&nbsp;przeglądarki i&nbsp;przez API konwersji z&nbsp;serwera strony) zbierają informacje o&nbsp;wizycie: odwiedzone strony, skąd trafiasz na stronę, urządzenie, przybliżoną lokalizację i&nbsp;identyfikatory z&nbsp;ciasteczek. Używam ich, żeby wiedzieć, które strony i&nbsp;reklamy działają, i&nbsp;żeby pokazywać moje reklamy osobom, które były na stronie. Podstawa: Twoja zgoda (art.&nbsp;6 ust.&nbsp;1 lit.&nbsp;a RODO i&nbsp;art.&nbsp;399 Prawa komunikacji elektronicznej).',
		]),
		p('Gdy zawrzemy umowę o&nbsp;wykonanie strony, dane potrzebne do jej wykonania i&nbsp;rozliczenia opisuje umowa. Dane mogę też przechowywać, żeby ustalić, dochodzić albo bronić roszczeń (art.&nbsp;6 ust.&nbsp;1 lit.&nbsp;f RODO).'),
		p('Podanie danych jest dobrowolne, ale bez adresu e-mail nie odpowiem na ankietę i&nbsp;nie potwierdzę rozmowy. Nie proszę o&nbsp;dane wrażliwe, np. o&nbsp;zdrowiu. Nie podejmuję wobec Ciebie decyzji opartych wyłącznie na automatycznym przetwarzaniu danych.'),
		h2('3. Komu przekazuję dane', { id: 'odbiorcy' }),
		p('Dane przechowują i&nbsp;przetwarzają w&nbsp;moim imieniu:'),
		lista([
			'<strong>LH.pl:</strong> hosting strony (tu zapisują się odpowiedzi z&nbsp;ankiety i&nbsp;rezerwacje rozmów) i&nbsp;poczta e-mail w&nbsp;domenie mateuszprzetocki.pl.',
			'<strong>Google:</strong> Google Meet (rozmowa), Kalendarz Google (termin rozmowy), Arkusze i&nbsp;Dokumenty Google (kopia odpowiedzi z&nbsp;ankiety i&nbsp;propozycja), poczta Gmail i&nbsp;Google Analytics (statystyki, tylko po zgodzie).',
		]),
		p('Piksel Meta i&nbsp;API konwersji (tylko po zgodzie) przekazują dane o&nbsp;wizycie firmie Meta Platforms Ireland Limited. Za zebranie i&nbsp;przekazanie tych danych odpowiadam razem z&nbsp;Meta, a&nbsp;za to, co Meta robi z&nbsp;nimi dalej, odpowiada Meta: <a href="https://www.facebook.com/privacy/policy/" rel="nofollow noopener" target="_blank">polityka prywatności Meta</a>.'),
		p('Google i&nbsp;Meta mogą przekazywać dane do USA. Obie firmy mają certyfikat EU-US Data Privacy Framework, który według decyzji Komisji Europejskiej zapewnia odpowiedni poziom ochrony danych. Nie sprzedaję danych.'),
		h2('4. Jak długo je przechowuję', { id: 'okres' }),
		lista([
			'<strong>Ankieta wyceny:</strong> do 12 miesięcy od wysłania. Na stronie odpowiedzi usuwają się same po 365 dniach.',
			'<strong>Rezerwacja rozmowy:</strong> dane usuwają się same 365 dni po rozmowie. Zostaje tylko termin, bez danych osobowych.',
			'<strong>Korespondencja:</strong> tak długo, jak potrzebuję jej do załatwienia sprawy.',
			'<strong>Wiadomości o&nbsp;nowościach:</strong> do wycofania zgody.',
			`<strong>Statystyki:</strong> Google Analytics przechowuje dane o&nbsp;wizytach do 14 miesięcy. Czas działania ciasteczek podaje <a href="${U.cookies}">polityka cookies</a>.`,
		]),
		p('Jeśli zawrzemy umowę, dane z&nbsp;ankiety i&nbsp;korespondencji przechowuję przez czas jej wykonania, a&nbsp;potem do przedawnienia roszczeń i&nbsp;tak długo, jak wymagają tego przepisy podatkowe.'),
		h2('5. Twoje prawa', { id: 'prawa' }),
		p('Masz prawo dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania i&nbsp;przeniesienia. Możesz też wnieść sprzeciw wobec przetwarzania opartego na moim prawnie uzasadnionym interesie.'),
		p('Zgodę na wiadomości o&nbsp;nowościach, statystyki i&nbsp;reklamy możesz wycofać w&nbsp;każdej chwili. Nie zmienia to zgodności z&nbsp;prawem tego, co działo się przed jej wycofaniem. Zgodę na ciasteczka zmienisz w&nbsp;ustawieniach cookies (link w&nbsp;stopce strony).'),
		p('Wystarczy e-mail na adres z&nbsp;punktu 1. Odpowiadam najpóźniej w&nbsp;ciągu miesiąca.'),
		p('Masz też prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa).'),
		h2('6. Ciasteczka, statystyki i&nbsp;reklamy', { id: 'cookies' }),
		p('Bez Twojej zgody strona zapisuje w&nbsp;przeglądarce tylko to, czego potrzebuje do działania: Twój wybór w&nbsp;banerze cookies i&nbsp;odpowiedzi z&nbsp;niedokończonej ankiety, żeby nie zniknęły po odświeżeniu (do 14&nbsp;dni).'),
		p('Google Analytics (statystyki) i&nbsp;piksel Meta (reklamy na Facebooku i&nbsp;Instagramie) włączają się dopiero po Twojej zgodzie w&nbsp;banerze cookies. Zgodę zmienisz w&nbsp;każdej chwili przez link „Ustawienia cookies” w&nbsp;stopce strony.'),
		p(`Listę ciasteczek, ich dostawców i&nbsp;czas działania znajdziesz w&nbsp;<a href="${U.cookies}">polityce cookies</a>.`),
		h2('7. Kontakt w&nbsp;sprawie danych', { id: 'kontakt-dane' }),
		p('Pytania o&nbsp;dane wysyłasz e-mailem na adres z&nbsp;punktu 1. Odpowiadam w&nbsp;ciągu dnia roboczego.'),
		p('Ostatnia zmiana: 25 października 2026', { kolor: 'grafit' }),
	],
});
dokument('regulamin', { tytul: 'Regulamin', slug: 'regulamin', opis: 'Zasady zamówienia strony: propozycja, zadatek, poprawki, prawa autorskie, odstąpienie od umowy i reklamacje.' }, {
	okruszek: 'Regulamin', tytul: 'Regulamin',
	tekst: 'Zasady korzystania z&nbsp;ankiety wyceny, rezerwacji rozmowy i&nbsp;kontaktu e-mail na tej stronie.',
	spis: [['uslugodawca', 'Usługodawca'], ['uslugi', 'Jakie usługi obejmuje'], ['wymagania', 'Wymagania techniczne'], ['zasady', 'Zasady korzystania'], ['reklamacje', 'Reklamacje'], ['odstapienie', 'Odstąpienie od umowy o&nbsp;stronę'], ['koncowe', 'Postanowienia końcowe']],
	tresc: [
		h2('1. Usługodawca', { id: 'uslugodawca' }),
		p('Usługi na stronie mateuszprzetocki.pl świadczy:'),
		wzorzec('dane', DANE_ZASLEPKA()),
		h2('2. Jakie usługi obejmuje', { id: 'uslugi' }),
		lista(['<strong>Ankieta wyceny:</strong> formularz, po którego wysłaniu w&nbsp;48 godzin dostajesz propozycję na piśmie.', '<strong>Rezerwacja rozmowy:</strong> wybór terminu 30-minutowej rozmowy na Google Meet.', '<strong>Kontakt e-mail:</strong> odpowiedź na pytanie wysłane na adres z&nbsp;punktu 1.']),
		p('Korzystanie z&nbsp;tych usług jest bezpłatne i&nbsp;do niczego nie zobowiązuje. Umowę o&nbsp;wykonanie strony zawieramy osobno, na piśmie, po akceptacji propozycji.'),
		h2('3. Wymagania techniczne', { id: 'wymagania' }),
		p('Wystarczy urządzenie z&nbsp;dostępem do internetu, aktualna przeglądarka i&nbsp;adres e-mail. Do rozmowy na Google Meet potrzebujesz też mikrofonu.'),
		h2('4. Zasady korzystania', { id: 'zasady' }),
		lista(['Podajesz prawdziwe dane kontaktowe, żebym mógł odpowiedzieć.', 'W&nbsp;formularzach nie podajesz danych wrażliwych, np. o&nbsp;zdrowiu.', 'Nie przesyłasz treści sprzecznych z&nbsp;prawem.', 'Rezerwację rozmowy możesz odwołać lub przenieść z&nbsp;linku w&nbsp;potwierdzeniu.']),
		h2('5. Reklamacje', { id: 'reklamacje' }),
		p('Reklamację dotyczącą działania ankiety albo rezerwacji wysyłasz e-mailem na adres z&nbsp;punktu 1. Odpowiadam w&nbsp;ciągu 14&nbsp;dni.'),
		h2('6. Odstąpienie od umowy o&nbsp;stronę', { id: 'odstapienie' }),
		p('Umowę o&nbsp;wykonanie strony zawieramy na odległość. Konsument i&nbsp;osoba prowadząca jednoosobową firmę, dla której umowa nie ma charakteru zawodowego, mogą od niej odstąpić w&nbsp;ciągu 14&nbsp;dni od jej zawarcia, bez podania przyczyny. Wystarczy e-mail na adres z&nbsp;punktu 1.'),
		p('Jeśli na Twoją prośbę zacznę prace przed upływem tych 14&nbsp;dni, po odstąpieniu płacisz za wykonaną część, a&nbsp;resztę wpłat zwracam w&nbsp;ciągu 14&nbsp;dni. Gdy wykonam całą usługę, prawo odstąpienia wygasa. Szczegóły i&nbsp;formularz odstąpienia są w&nbsp;umowie.'),
		h2('7. Postanowienia końcowe', { id: 'koncowe' }),
		p(`Zasady przetwarzania danych opisuje <a href="${U.polityka}">polityka prywatności</a>, a&nbsp;ciasteczka <a href="${U.cookies}">polityka cookies</a>. O&nbsp;zmianach regulaminu informuję na tej stronie.`),
		p('Obowiązuje od 25 października 2026', { kolor: 'grafit' }),
	],
});
// Polityka cookies: treść i listę ciasteczek generuje Complianz (blok „Dokument”) z odpowiedzi w kreatorze i ze skanu strony
strona('cookies', { tytul: 'Polityka cookies', slug: 'polityka-cookies', opis: 'Jakie ciasteczka ustawia strona, kto je dostarcza i jak długo działają. Statystyki i reklamy włączają się tylko za Twoją zgodą.' }, [
	heroPodstrony({ okruszki: [['Strona główna', U.glowna], 'Polityka cookies'], nadtytul: 'Dokumenty', tytul: 'Polityka cookies', tekst: 'Statystyki i&nbsp;reklamy włączają się tylko za Twoją zgodą. Niżej lista ciasteczek, kto je dostarcza i&nbsp;jak długo działają.' }),
	sekcja([kolumny([
		['30%', [grupa([p('Na skróty'), lista([`<a href="${U.polityka}">Polityka prywatności</a>`, `<a href="${U.regulamin}">Regulamin</a>`]), html(PRZYCISK_COOKIES)], { klasa: 'is-style-spis', tag: 'nav' })]],
		['70%', [grupa([blok('complianz/document', { title: 'Polityka cookies', selectedDocument: 'cookie-statement' })], { klasa: 'mp-dokument mp-dokument-cmplz' })]],
	])], { gora: '0' }),
]);

// Dla kogo
strona('dlaKogo', { tytul: 'Dla kogo', slug: 'dla-kogo', opis: 'Strony dla doradców, biur rachunkowych, terapeutów i innych specjalistów, u których sprzedaż zaczyna się od rozmowy. Znajdź swoją branżę. Od 1 200 zł.' }, [
	heroPodstrony({ okruszki: [['Strona główna', U.glowna], 'Dla kogo'], nadtytul: 'Dla kogo', tytul: 'Dla kogo robię <em>strony</em>', tekst: 'Dla specjalistów i&nbsp;małych firm, u&nbsp;których sprzedaż zaczyna się od rozmowy, wizyty albo oględzin, a&nbsp;telefon dzwoni w&nbsp;trakcie pracy.' }),
	sekcja([
		siatka([
			...['doradcy', 'biura', 'terapeuci', 'agenci', 'fizjo', 'prawo', 'remont'].map((k) => kartaBranzy(BRANZE[k])),
			karta([h3('Nie widzisz swojej branży?'), szary('Niżej kolejne branże w&nbsp;czterech grupach. Jeśli Twojej tam nie ma, napisz, sprawdzę, czy to dla Ciebie.', { klasa: 'mp-maly-tekst' }), strzalka('Pozostałe branże', '#pozostale'), strzalka('Napisz do mnie', U.kontakt)], { styl: 'is-style-karta-przerywana', gap: '14px', klasa: 'mp-inna-branza-pion' }),
		], { min: '250px' }),
	], { id: 'branze', gora: '16px' }),
	sekcja([
		naglowekSekcji('Pozostałe branże', 'Tu też klient <em>umawia się</em> sam', 'Te branże nie mają jeszcze osobnej strony, ale dostają ten sam zestaw: kalendarz, formularz z&nbsp;pytaniami ich zawodu i&nbsp;zasady, o&nbsp;które trzeba zadbać.'),
		siatka([
			['Finanse i&nbsp;prawo', [['Doradcy podatkowi', 'Formularz sprawy i&nbsp;kalendarz pierwszej konsultacji.'], ['Mediatorzy', 'Spokojny opis mediacji i&nbsp;termin pierwszego spotkania.']]],
			['Zdrowie', [['Dietetycy', 'Wizyty w&nbsp;gabinecie i&nbsp;online w&nbsp;jednym kalendarzu.'], ['Gabinety stomatologiczne i&nbsp;lekarskie', 'Zakres świadczeń bez cech reklamy i&nbsp;rejestracja online.'], ['Weterynarze', 'Szczepienia i&nbsp;kontrole w&nbsp;kalendarzu, telefon zostaje dla pilnych.']]],
			['Dom i&nbsp;nieruchomości', [['Instalatorzy klimatyzacji, pomp ciepła i&nbsp;fotowoltaiki', 'Formularz z&nbsp;danymi domu i&nbsp;termin oględzin.'], ['Architekci wnętrz', 'Portfolio, etapy projektu i&nbsp;pierwsza konsultacja.'], ['Pośrednicy nieruchomości', 'Formularz o&nbsp;mieszkaniu i&nbsp;termin spotkania.']]],
			['Rozwój i&nbsp;usługi', [['Coachowie i&nbsp;doradcy zawodowi', 'Opis sesji i&nbsp;kalendarz pierwszej rozmowy.'], ['Trenerzy personalni', 'Pakiety treningów i&nbsp;termin pierwszego spotkania.'], ['Fotografowie', 'Portfolio, pakiety i&nbsp;wolne terminy sesji.'], ['Mechanicy samochodowi', 'Opis usterki w&nbsp;formularzu i&nbsp;terminy przyjęć.']]],
		].map(([g, poz]) => grupa([h3(g, { klasa: 'mp-h3-maly' }), lista(poz.map(([n, o]) => `<strong>${n}</strong> ${o}`), { klasa: 'is-style-lista-branze' })], { gap: '14px' })), { gap: { top: '40px', left: '32px' } }),
	], { id: 'pozostale', tlo: 'piasek' }),
	sekcja([
		naglowekSekcji('Co łączy te branże', 'Ten sam problem, <em>inne</em> słowa'),
		siatka([
			kartaKorzysci('clock', 'Telefon dzwoni w&nbsp;trakcie pracy', 'Prowadzisz konsultację, więc nie odbierasz. Klient nie czeka na oddzwonienie.'),
			kartaKorzysci('message-circle-question', 'Ciągle te same pytania', 'O&nbsp;cenę, dokumenty i&nbsp;pierwsze spotkanie. Strona odpowiada na nie za Ciebie.'),
			kartaKorzysci('calendar-check', 'Klient chce umówić się od razu', 'Także wieczorem. Kalendarz pokazuje wolne terminy, a&nbsp;Ty rano wiesz, z&nbsp;czym przyjdzie.'),
		], { min: '280px' }),
	], { id: 'wspolne', dol: '0' }),
	nastepnyKrok([['Pakiety i&nbsp;ceny', U.oferta], ['Realizacje', U.realizacje]]),
]);

// Strony branżowe: wspólny szkielet z planu strony
function branza(klucz, meta, d) {
	strona(klucz, { ...meta, rodzic: 'dlaKogo' }, [
		heroPodstrony({
			okruszki: [['Strona główna', U.glowna], ['Dla kogo', U.dlaKogo], d.okruszek], nadtytul: d.nadtytul, tytul: d.tytul, tekst: d.tekst,
			reszta: [etykiety(d.tagi), przyciski([przycisk('Wyceń stronę w&nbsp;5&nbsp;minut', ANKIETA, { strzalka: true }), drugiPrzycisk()]), podpis('Bez zobowiązań · propozycja w&nbsp;48&nbsp;h')],
			dol: 'clamp(56px, 6.7vw, 96px)',
		}),
		sekcja([kolumny([
			['40%', [nad('Problem'), h2(d.problem[0])]],
			['60%', d.problem.slice(1).map((t) => p(t)), { klasa: 'mp-akapity' }],
		])], { id: 'problem', tlo: 'piasek' }),
		sekcja([
			naglowekSekcji('Co dostajesz', d.coDostajesz),
			siatka(d.karty.map(([i, t, o]) => kartaKorzysci(i, t, o)), { min: '300px' }),
		], { id: 'co-dostajesz' }),
		sekcja([
			naglowekSekcji('Jak to wygląda', d.jakWyglada, null, { srodek: true }),
			ekrany(d.ekrany),
			DEMO_WLACZONE ? wiersz([przycisk_('Zobacz demo na żywo'), d.opisPrzykladu ? strzalka('Opis przykładu', U.demo) : null].filter(Boolean), { justify: 'center', gap: '16px 28px' }) : przyciskFilmu(),
		], { id: 'jak-wyglada', gora: '0' }),
		sekcja([kolumny([
			['40%', tekstSekcji(d.przepisy[0], d.przepisy[1], [szary(d.przepisy[2])])],
			['60%', [lista(d.przepisy[3], { klasa: 'is-style-lista-tarcza' })]],
		])], { id: 'przepisy', tlo: 'piasek' }),
		sekcja([kolumny([
			['55%', tekstSekcji('Polecany pakiet', d.pakiet[0], [p(d.pakiet[1]), strzalka('Zobacz wszystkie pakiety', U.oferta)])],
			['45%', [pakietPolecany(d.pakiet[2])]],
		], { pion: 'center' })], { id: 'pakiet' }),
		sekcja([kolumny([
			['40%', tekstSekcji(d.pytaniaNadtytul, 'Zanim <em>zapytasz</em>', [strzalka('Wszystkie pytania', U.pytania)])],
			['60%', [pytania(d.pytania)]],
		])], { id: 'pytania', gora: '0' }),
		nastepnyKrok(d.zobaczTez, { gora: '0' }),
	]);
}
const przycisk_ = (t) => przyciski([przycisk(t, DEMO, { obrys: true, strzalka: true })]);
branza('doradcy', { tytul: 'Doradcy kredytowi', slug: 'doradcy-kredytowi', opis: 'Klient umawia konsultację wieczorem, a Ty rano znasz kwotę i wkład własny. Kalendarz, formularz analizy i informacje KNF. Z kalendarzem od 1 800 zł.' }, {
	okruszek: 'Doradcy kredytowi', nadtytul: '01 · Finanse', tytul: 'Strona dla doradcy kredytowego, która <em>umawia</em> konsultacje',
	tekst: 'Klient z&nbsp;polecenia szuka Cię wieczorem. Formularz wstępnej analizy i&nbsp;kalendarz sprawiają, że umawia się od razu, a&nbsp;nie rano u&nbsp;kogoś innego.',
	tagi: ['formularz analizy', 'kalendarz', 'informacje KNF'],
	problem: ['Polecony klient nie <em>czeka</em> do rana', 'Klient z&nbsp;polecenia dzwoni, kiedy jesteś na spotkaniu z&nbsp;innym klientem. Wieczorem może tylko zostawić numer, a&nbsp;rano porównuje już dwie oferty.', 'A&nbsp;pierwsza konsultacja i&nbsp;tak idzie na podstawy: kwotę, wkład własny i&nbsp;formę zatrudnienia.'],
	coDostajesz: 'Konsultacja, na którą klient przychodzi <em>przygotowany</em>',
	karty: [
		['calendar-check', 'Klient umawia konsultację w&nbsp;2&nbsp;kliknięciach', 'Kalendarz pokazuje tylko Twoje wolne terminy, także wieczorem.'],
		['clipboard-list', 'Zanim przyjdzie, wiesz, jakiej kwoty szuka i&nbsp;ile ma wkładu własnego', 'Formularz wstępnej analizy z&nbsp;przedziałami kwot.'],
		['message-circle-question', 'Odpowiedzi na pytania o&nbsp;dokumenty i&nbsp;wkład własny', 'Napisane z&nbsp;Twojej ankiety, Twoimi słowami.'],
		['file-text', 'Informacje formalne w&nbsp;jednym miejscu', 'Wpis do rejestru KNF i&nbsp;informacje, których wymaga ustawa.'],
		['user', 'Dane i&nbsp;logo sieci, jeśli w&nbsp;niej działasz', 'Klient od razu widzi, z&nbsp;kim współpracujesz.'],
	],
	jakWyglada: DEMO_WLACZONE ? 'Demo strony <em>ekspertki</em> kredytowej' : 'Konsultacja umówiona <em>wieczorem</em>',
	ekrany: [['doradcy-rezerwacja', 'Klient wybiera termin, także wieczorem'], ['doradcy-formularz', 'Odpowiada na 3&nbsp;pytania w&nbsp;przedziałach'], ['telefon-potwierdzenie', 'Ty rano masz komplet informacji']],
	opisPrzykladu: true,
	przepisy: ['Przepisy i&nbsp;zasady', 'O&nbsp;co dbam na stronie <em>doradcy</em>', 'Strona doradcy ma informować, nie obiecywać. Te punkty sprawdzam przed publikacją.', ['Wpis do rejestru KNF i&nbsp;informacje z&nbsp;art.&nbsp;17 ustawy o&nbsp;kredycie hipotecznym.', 'Słowa „doradca” i&nbsp;„doradztwo” tylko w&nbsp;zakresie, na który pozwala ustawa.', 'Stopy i&nbsp;raty tylko z&nbsp;przykładem reprezentatywnym.', 'Formularz z&nbsp;przedziałami kwot, bez PESEL i&nbsp;skanów dokumentów.']],
	pakiet: ['Dla doradcy: wizytówka, która <em>umawia</em>', 'Formularz wstępnej analizy i&nbsp;kalendarz konsultacji są w&nbsp;nim od razu. Prostsza wizytówka za 1&nbsp;200&nbsp;zł też działa, ale klient nadal musi do Ciebie zadzwonić.', ['Jedna strona, 6&nbsp;sekcji, wersja na telefon', 'Formularz wstępnej analizy i&nbsp;kalendarz konsultacji', 'Odpowiedzi na najczęstsze pytania i&nbsp;miejsce na opinie', 'Profil Firmy w&nbsp;Google, gdy firma spełnia wytyczne']],
	pytaniaNadtytul: 'Pytania doradców',
	pytania: [
		['Czy mogę pokazać na stronie oprocentowanie i&nbsp;raty?', 'Tylko z&nbsp;przykładem reprezentatywnym. Dane do przykładu podajesz Ty, a&nbsp;ja pilnuję, żeby stał obok każdej stopy i&nbsp;raty.', true],
		['Czy klient wyśle mi przez formularz dokumenty?', 'Nie. Formularz pyta o&nbsp;przedziały kwot i&nbsp;formę zatrudnienia, bez PESEL i&nbsp;skanów. Dokumenty klient przynosi na konsultację.'],
		['Działam w&nbsp;sieci. Czy mogę mieć własną stronę?', 'Tak. Na stronie pokażę dane i&nbsp;logo sieci. Zasady używania logo sprawdzasz w&nbsp;swojej sieci.'],
		['Czy strona pokaże się w&nbsp;Google na „doradca kredytowy Kraków”?', 'Nie obiecuję miejsca w&nbsp;wynikach. Dbam o&nbsp;to, co od niego zależy: szybką stronę, podstawy SEO i&nbsp;Profil Firmy w&nbsp;Google, gdy firma spełnia wytyczne.'],
	],
	zobaczTez: [['Biura rachunkowe', U.biura], ['Psycholodzy i&nbsp;terapeuci', U.terapeuci]],
});
branza('biura', { tytul: 'Biura rachunkowe', slug: 'biura-rachunkowe', opis: 'Strona odpowiada na stałe pytania o KSeF i dokumenty, a nowy klient sam umawia rozmowę o współpracy, także w sezonie PIT. Z kalendarzem od 1 800 zł.' }, {
	okruszek: 'Biura rachunkowe', nadtytul: '02 · Księgowość', tytul: 'Strona dla biura rachunkowego, która <em>umawia</em> rozmowy',
	tekst: 'W&nbsp;sezonie PIT i&nbsp;przy zmianach przepisów telefon dzwoni bez przerwy. Strona odpowiada na stałe pytania, a&nbsp;nowy klient sam umawia rozmowę o&nbsp;współpracy.',
	tagi: ['pytania o&nbsp;KSeF', 'ceny „od”', 'umawianie rozmów'],
	problem: ['W&nbsp;sezonie linia jest <em>zajęta</em>', 'Od lutego do kwietnia telefon dzwoni od rana, a&nbsp;wiele rozmów to te same pytania: o&nbsp;KSeF, o&nbsp;ceny, o&nbsp;zmianę biura.', 'Nowa firma, która chce zapytać o&nbsp;współpracę, trafia na zajętą linię i&nbsp;dzwoni do następnego biura z&nbsp;listy.'],
	coDostajesz: 'Rozmowa z&nbsp;nowym klientem, który wie, czego <em>chce</em>',
	karty: [
		['clipboard-list', 'Nowy klient podaje formę opodatkowania i&nbsp;liczbę dokumentów, zanim porozmawiacie', 'Formularz zapytania z&nbsp;gotowymi przedziałami.'],
		['calendar-check', 'Rozmowa o&nbsp;współpracy w&nbsp;kalendarzu, poza sezonem i&nbsp;w&nbsp;sezonie', 'Ty ustawiasz godziny, a&nbsp;klient wybiera wolny termin.'],
		['message-circle-question', 'Odpowiedzi na pytania o&nbsp;KSeF, dokumenty i&nbsp;zmianę biura', 'Napisane z&nbsp;Twojej ankiety, Twoimi słowami.'],
		['receipt', 'Ceny „od”, które odsiewają pytania o&nbsp;„najtaniej”', 'Dokładną kwotę podajesz po rozmowie.'],
	],
	jakWyglada: 'Zapytanie, które <em>nie</em> zajmuje linii',
	ekrany: [['biura-formularz', 'Klient zaznacza przedziały, bez dokumentów'], ['biura-pytania-termin', 'Czyta odpowiedzi i&nbsp;wybiera termin rozmowy'], ['biura-potwierdzenie', 'Ty wiesz, z&nbsp;jaką firmą rozmawiasz']],
	przepisy: ['Zasady', 'O&nbsp;co dbam na stronie <em>biura</em>', 'Zaufanie budują konkrety, nie obietnice.', ['Formularz zapytania z&nbsp;przedziałami: forma opodatkowania, dokumenty miesięcznie, pracownicy.', 'Ubezpieczenie OC biura i&nbsp;doświadczenie jako dowody zaufania.', 'Bez obietnic w&nbsp;stylu „oszczędzisz na podatkach”.']],
	pakiet: ['Dla biura: wizytówka, która <em>umawia</em>', 'Formularz zapytania i&nbsp;kalendarz rozmów są w&nbsp;nim od razu, a&nbsp;odpowiedzi na stałe pytania odciążają telefon w&nbsp;sezonie.', ['Jedna strona, 6&nbsp;sekcji, wersja na telefon', 'Formularz zapytania i&nbsp;kalendarz rozmów', 'Odpowiedzi na najczęstsze pytania i&nbsp;miejsce na opinie', 'Profil Firmy w&nbsp;Google, gdy firma spełnia wytyczne']],
	pytaniaNadtytul: 'Pytania biur',
	pytania: [
		['Czy mogę podać na stronie ceny?', 'Tak, jako ceny „od”. Odsiewają pytania o&nbsp;„najtaniej”, a&nbsp;dokładną kwotę podajesz po rozmowie.', true],
		['Czy klient wyśle przez formularz dokumenty firmy?', 'Nie. Formularz pyta tylko o&nbsp;przedziały: formę opodatkowania, liczbę dokumentów i&nbsp;pracowników. Dokumenty klient przekazuje już w&nbsp;ramach współpracy.'],
		['Co z&nbsp;sezonem PIT?', 'Kalendarz pokazuje tylko godziny, które ustawisz. W&nbsp;sezonie zostawiasz mniej terminów na rozmowy, a&nbsp;strona dalej odpowiada na stałe pytania.'],
		['Czy napiszesz teksty o&nbsp;KSeF?', 'Napiszę je z&nbsp;Twojej ankiety, Twoimi słowami. Merytorykę sprawdzasz Ty, bo to Twoja specjalizacja.'],
	],
	zobaczTez: [['Doradcy kredytowi', U.doradcy], ['Psycholodzy i&nbsp;terapeuci', U.terapeuci]],
});
branza('terapeuci', { tytul: 'Psycholodzy i terapeuci', slug: 'psycholodzy-i-terapeuci', opis: 'Spokojna strona z Twoim podejściem i kalendarzem: klient umawia wizytę bez telefonu, a formularz nie pyta o zdrowie. Z kalendarzem od 1 800 zł.' }, {
	okruszek: 'Psycholodzy i&nbsp;terapeuci', nadtytul: '03 · Terapia', tytul: 'Strona dla psychologa i&nbsp;terapeuty: wizyta bez <em>telefonu</em>',
	tekst: 'Pierwszy telefon do terapeuty bywa dla klienta trudny. Spokojna strona z&nbsp;Twoim podejściem i&nbsp;kalendarzem pozwala umówić się bez rozmowy.',
	tagi: ['podejście i&nbsp;specjalizacje', 'wizyty online', 'kalendarz'],
	problem: ['Najtrudniejszy jest <em>pierwszy</em> telefon', 'Dla wielu osób zadzwonienie do terapeuty to najtrudniejszy krok. W&nbsp;trakcie sesji nie odbierasz, a&nbsp;ktoś, kto zebrał się na odwagę, nie zawsze zadzwoni drugi raz.', 'Na stronie może spokojnie przeczytać o&nbsp;Twoim podejściu i&nbsp;wybrać termin, kiedy jest gotowy.'],
	coDostajesz: 'Klient umawia się, kiedy jest <em>gotowy</em>',
	karty: [
		['user', 'Klient czyta o&nbsp;Twoim podejściu i&nbsp;umawia się bez telefonu', 'Podejście, kwalifikacje i&nbsp;przebieg pierwszej sesji, Twoimi słowami.'],
		['calendar-check', 'Wizyty w&nbsp;gabinecie i&nbsp;online w&nbsp;jednym kalendarzu', 'Klient wybiera formę wizyty i&nbsp;wolny termin.'],
		['message-circle-question', 'Odpowiedzi na pytania o&nbsp;pierwszą sesję, cenę i&nbsp;odwoływanie wizyt', 'Zanim przyjdzie, wie, czego się spodziewać.'],
		['circle-check', 'Spokojny wygląd bez natłoku informacji', 'Dużo powietrza, krótkie zdania i&nbsp;jeden przycisk do rezerwacji.'],
		['globe', 'Własny kalendarz zamiast płatnych platform', 'Rezerwacje są na Twojej stronie, nie w&nbsp;serwisie z&nbsp;abonamentem.'],
	],
	jakWyglada: 'Trzy ekrany, <em>żadnej</em> rozmowy',
	ekrany: [['terapeuci-podejscie', 'Czyta o&nbsp;Twoim podejściu'], ['terapeuci-wizyta', 'Wybiera gabinet albo online i&nbsp;wolny termin'], ['terapeuci-potwierdzenie', 'Dostaje potwierdzenie bez pytań o&nbsp;zdrowie']],
	przepisy: ['Przepisy i&nbsp;zasady', 'O&nbsp;co dbam na stronie <em>terapeuty</em>', 'Strona informuje o&nbsp;Twojej pracy i&nbsp;chroni prywatność klientów.', ['Formularz bez pytań o&nbsp;zdrowie: to dane szczególnej kategorii w&nbsp;RODO, a&nbsp;już sama rezerwacja może je ujawniać.', 'Bez obietnic efektów terapii.', 'Opinie klientów tylko wtedy, gdy pozwala na to kodeks etyki Twojego towarzystwa.', 'Gabinet wpisany do rejestru podmiotów leczniczych informuje bez cech reklamy (art.&nbsp;14 ustawy o&nbsp;działalności leczniczej).']],
	pakiet: ['Dla terapeuty: wizytówka, która <em>umawia</em>', 'Kalendarz wizyt w&nbsp;gabinecie i&nbsp;online jest w&nbsp;nim od razu, a&nbsp;odpowiedzi na pytania o&nbsp;pierwszą sesję zastępują pierwszy telefon.', ['Jedna strona, 6&nbsp;sekcji, wersja na telefon', 'Kalendarz wizyt w&nbsp;gabinecie i&nbsp;online', 'Odpowiedzi na pytania o&nbsp;pierwszą sesję i&nbsp;cenę', 'Profil Firmy w&nbsp;Google, gdy firma spełnia wytyczne']],
	pytaniaNadtytul: 'Pytania terapeutów',
	pytania: [
		['Czy klient musi napisać, z&nbsp;czym przychodzi?', 'Nie. Formularz nie pyta o&nbsp;zdrowie ani o&nbsp;powód wizyty. Klient wybiera termin i&nbsp;formę wizyty, a&nbsp;resztę mówi na pierwszej sesji.', true],
		['Czy mogę mieć wizyty online i&nbsp;w&nbsp;gabinecie?', 'Tak. Oba rodzaje wizyt są w&nbsp;jednym kalendarzu, a&nbsp;klient wybiera, który mu pasuje.'],
		['Czy muszę płacić za platformę rezerwacji?', 'Nie musisz. Kalendarz jest na Twojej stronie, a&nbsp;nie w&nbsp;serwisie z&nbsp;abonamentem.'],
		['Czy na stronie mogą być opinie klientów?', 'Tylko jeśli pozwala na to kodeks etyki Twojego towarzystwa. Bez tego zaufanie buduje opis podejścia i&nbsp;kwalifikacji.'],
	],
	zobaczTez: [['Doradcy kredytowi', U.doradcy], ['Biura rachunkowe', U.biura]],
});

// Jak pracuję
strona('jakPracuje', { status: 'draft', tytul: 'Jak pracuję', slug: 'jak-pracuje', opis: 'Ankieta w 5 minut, propozycja w 48 h, umowa i zadatek, szkic w 5 dni roboczych, odbiór i 30 dni wsparcia. Twojego czasu potrzebuję ok. 1 h. Strony od 1 200 zł.' }, [
	heroPodstrony({ okruszki: [['Strona główna', U.glowna], 'Jak pracuję'], nadtytul: 'Jak pracuję', tytul: 'Od ankiety do <em>gotowej</em> strony', tekst: 'Wszystko ustalamy na piśmie. Rozmowa na Google Meet tylko wtedy, gdy wolisz porozmawiać.', dol: 'clamp(56px, 6.7vw, 96px)' }),
	sekcja([
		naglowekSekcji('Siedem kroków', 'Każdy krok ma <em>termin</em>'),
		grupa([
			siatka(PROCES.map(([t, o], i) => krok(i + 1, t, o)), { min: '230px', gap: { top: '0', left: '28px' } }),
			wiersz([p('48&nbsp;h na propozycję · 2&nbsp;rundy poprawek · zadatek 40%'), strzalka('Umów 15&nbsp;minut i&nbsp;zapytaj o&nbsp;szczegóły', ROZMOWA)], { klasa: 'mp-przypis-ciemny', justify: 'space-between' }),
		], { gap: '22px' }),
	], { id: 'kroki', ciemna: true }),
	sekcja([kolumny([
		['40%', tekstSekcji('Twoja część', 'Czego <em>potrzebuję</em> od Ciebie', [
			wiersz([p('ok.', { klasa: 'mp-ok' }), p('1&nbsp;h', { klasa: 'is-style-liczba mp-liczba-srednia' })], { klasa: 'mp-liczba', nowrap: true }),
			szary('Twojego czasu, łącznie, od ankiety do startu.', { klasa: 'mp-maly-tekst' }),
		])],
		['60%', [lista([
			'<strong>Ankieta</strong> <em>5&nbsp;minut</em>',
			'<strong>Formularz materiałów</strong> <em>ok.&nbsp;20&nbsp;minut: firma, usługi, pytania klientów, zdjęcie</em>',
			'<strong>Domena i&nbsp;hosting na Twoje dane</strong> <em>zakup albo dostęp według krótkich filmów, bez wysyłania haseł</em>',
			'<strong>Uwagi do szkicu</strong> <em>ok.&nbsp;15&nbsp;minut, w&nbsp;jednym formularzu</em>',
			'<strong>Odbiór strony</strong> <em>ok.&nbsp;10&nbsp;minut, według listy</em>',
		], { klasa: 'is-style-lista-wiersze' })]],
	])], { id: 'potrzebuje' }),
	sekcja([
		naglowekSekcji('Co jest Twoje', 'Strona zostaje <em>u&nbsp;Ciebie</em>'),
		siatka([
			kartaKorzysci('globe', 'Domena, hosting i&nbsp;strona', 'Są na Ciebie i&nbsp;płacisz za nie bezpośrednio u&nbsp;dostawcy.'),
			kartaKorzysci('file-text', 'Prawa do treści i&nbsp;grafik', 'Do tego, co dla Ciebie tworzę, przechodzą na Ciebie po zapłacie, na podstawie umowy na piśmie.'),
			kartaKorzysci('shield-check', 'Dostęp bez Twoich haseł', 'Dostaję osobne konto na czas pracy, nigdy Twoich haseł.'),
		], { min: '280px' }),
	], { id: 'twoje', tlo: 'piasek' }),
	nastepnyKrok([['Pakiety i&nbsp;ceny', U.oferta], ['Pytania o&nbsp;współpracę', U.pytania]], { cta: ['Zacznij od <em>ankiety</em>', 'Krok 1 zajmuje 5&nbsp;minut, a&nbsp;propozycję dostajesz w&nbsp;48 godzin. Wypełnienie do niczego nie zobowiązuje.'] }),
]);

// Pytania
const grupaPytan = (id, nadtytul, lista_) => grupa([nad(nadtytul), pytania(lista_)], { id, klasa: 'mp-grupa-pytan', gap: '18px' });
strona('pytania', { status: 'draft', tytul: 'Pytania', slug: 'pytania', opis: 'Odpowiedzi na 12 pytań przed zamówieniem: koszty w kolejnych latach, domena, poprawki, RODO i kalendarz. Stałe ceny, strony od 1 200 zł.' }, [
	heroPodstrony({ okruszki: [['Strona główna', U.glowna], 'Pytania'], nadtytul: 'Pytania', tytul: 'Zanim <em>zapytasz</em>', tekst: 'Dwanaście odpowiedzi na pytania, które specjaliści zadają przed zamówieniem strony. Nie ma tu Twojego? Napisz albo umów 15&nbsp;minut na Google Meet.' }),
	sekcja([kolumny([
		['28%', [grupa([p('Tematy'), lista([['cena', 'Cena i&nbsp;warunki'], ['wspolpraca', 'Współpraca'], ['wlasnosc', 'Własność i&nbsp;technika'], ['doswiadczenie', 'Doświadczenie']].map(([id, t]) => `<a href="#${id}">${t}</a>`))], { klasa: 'is-style-spis', tag: 'nav' })]],
		['72%', [grupa([
			grupaPytan('cena', '01 · Cena i&nbsp;warunki', [
				['Ile to kosztuje?', `Pakiety kosztują 1&nbsp;200, 1&nbsp;800 albo 2&nbsp;500&nbsp;zł. Łączną kwotę z&nbsp;ewentualnymi dodatkami dostajesz na piśmie w&nbsp;48 godzin od ankiety. <a href="${U.oferta}">Cennik pakietów</a>`, true],
				['Co jest w&nbsp;cenie?', `Strona z&nbsp;wersją na telefon, teksty z&nbsp;Twojej ankiety, formularz, podstawy SEO, polityka prywatności, 2&nbsp;rundy poprawek i&nbsp;30&nbsp;dni wsparcia. Resztę wyznacza pakiet. <a href="${U.oferta}">Co jest w&nbsp;każdym pakiecie</a>`],
				['Czy wystawiasz fakturę?', `Tak: fakturę bez VAT, bo prowadzę działalność nierejestrowaną, albo fakturę VAT przez Useme. Wtedy do ceny dochodzi 23% VAT. <a href="${U.oferta}">Warunki współpracy</a>`],
				['Ile kosztuje utrzymanie strony?', `Domenę i&nbsp;hosting opłacasz u&nbsp;dostawcy, na swoje dane: pierwszy rok ok.&nbsp;55–75&nbsp;zł netto, potem ok.&nbsp;320–370&nbsp;zł netto rocznie. Drobne zmiany po 30&nbsp;dniach wsparcia wyceniam przed pracą. <a href="${U.oferta}">Koszty w&nbsp;kolejnych latach</a>`],
			]),
			grupaPytan('wspolpraca', '02 · Współpraca', [
				['Czy muszę rozmawiać przez telefon?', `Nie. Wszystko ustalamy na piśmie. Jeśli wolisz porozmawiać, umów 15&nbsp;minut na Google Meet. <a href="${U.kontakt}">Kontakt</a>`],
				['Ile to trwa?', `Zwykle 2&nbsp;tygodnie od dnia, w&nbsp;którym dostanę materiały. <a href="${U.jakPracuje}">Kroki i&nbsp;terminy</a>`],
				['Kto pisze teksty?', `Ja, na podstawie Twojej ankiety i&nbsp;Twoimi słowami. Sprawdzasz je w&nbsp;szkicu i&nbsp;masz 2&nbsp;rundy poprawek. <a href="${U.jakPracuje}">Jak pracuję</a>`],
			]),
			grupaPytan('wlasnosc', '03 · Własność i&nbsp;technika', [
				['Kto jest właścicielem domeny i&nbsp;strony?', `Ty. Domena i&nbsp;hosting są na Ciebie, a&nbsp;ja dostaję dostęp na czas pracy. <a href="${U.jakPracuje}">Co jest Twoje</a>`],
				['Mam już stronę. Co wtedy?', `Kalendarz konsultacji i&nbsp;formularz wstępnych pytań dodam do Twojej obecnej strony, w&nbsp;jej stylu. Od 800&nbsp;zł. <a href="${U.oferta}">Szczegóły w&nbsp;ofercie</a>`],
				['Czy zmienię tekst albo godziny bez Twojej pomocy?', 'Tak. Strona jest na WordPressie, a&nbsp;po starcie dostajesz instrukcję i&nbsp;nagranie: jak zmienić tekst, zdjęcie albo godziny w&nbsp;kalendarzu.'],
				['Czy strona będzie w&nbsp;Google?', 'Dbam o&nbsp;to, co od tego zależy: szybką stronę, podstawy SEO, a&nbsp;w&nbsp;pakiecie „Wizytówka, która umawia” także Profil Firmy w&nbsp;Google, gdy firma spełnia wytyczne. Nie obiecuję konkretnego miejsca w&nbsp;wynikach.'],
			]),
			grupaPytan('doswiadczenie', '04 · Doświadczenie', [
				['Czy robiłeś już takie projekty?', `Kalendarz i&nbsp;formularz działają na tej stronie: gdy umawiasz się ze mną, widzisz dokładnie to, co zobaczą Twoi klienci. Wcześniej budowałem własne sklepy internetowe i&nbsp;wtyczki do WordPressa. <a href="${U.realizacje}">Realizacje</a>`],
			]),
		], { gap: '56px' })]],
	])], { gora: '0' }),
	nastepnyKrok([['Pakiety i&nbsp;ceny', U.oferta], ['Jak pracuję', U.jakPracuje]], { gora: '0' }),
]);

// O mnie
strona('oMnie', { status: 'draft', tytul: 'O mnie', slug: 'o-mnie', opis: 'Robię strony wizytówki dla specjalistów, którzy umawiają konsultacje. Wszystko ustalamy na piśmie, a domena i strona są Twoje. Od 1 200 zł.' }, [
	sekcja([
		okruszki([['Strona główna', U.glowna], 'O&nbsp;mnie']),
		kolumny([
			['50%', [grupa(zdjecia('mateusz-przetocki-rece-w-kieszeniach'), { klasa: 'mp-zdjecia mp-tlo-krem' })]],
			['50%', [
				nad('O&nbsp;mnie'),
				h1('Strony robię <em>sam</em>, od ankiety do startu'),
				p('Nazywam się Mateusz Przetocki. Przez 5&nbsp;lat codziennie rozmawiałem z&nbsp;klientami przy sprzedaży. Wiem, o&nbsp;co ludzie pytają, zanim się zdecydują, i&nbsp;wiem, że rezygnują, gdy nikt nie odpowiada.'),
				p('Wcześniej budowałem własne sklepy internetowe na WooCommerce i&nbsp;pisałem do nich wtyczki. Dziś robię strony na WordPressie z&nbsp;własnym kalendarzem rezerwacji, tym samym, przez który umówisz się ze mną. Każdą testuję ręcznie: formularze, wersję na telefon i&nbsp;szybkość.'),
				p('Pracuję z&nbsp;Krakowa i&nbsp;wszystko ustalam na piśmie, z&nbsp;terminem na każdy krok: propozycja w&nbsp;48 godzin, szkic w&nbsp;5&nbsp;dni roboczych, publikacja po Twojej akceptacji.'),
				przyciski([przycisk('Wyceń stronę w&nbsp;5&nbsp;minut', ANKIETA, { strzalka: true }), przycisk('Umów 15&nbsp;minut na Google Meet', ROZMOWA, { obrys: true })]),
			]],
		], { pion: 'center' }),
	], { gora: 'clamp(24px, 2.8vw, 40px)', gap: 'var:preset|spacing|50' }),
	sekcja([
		naglowekSekcji('Dlaczego ja', 'Trzy zasady, których się <em>trzymam</em>'),
		siatka(ZASADY.map(([t, o], i) => krok(i + 1, t, o)), { min: '260px', gap: { top: '0', left: '28px' } }),
	], { id: 'zasady', ciemna: true }),
	nastepnyKrok([['Realizacje', U.realizacje], ['Jak pracuję', U.jakPracuje]], { cta: ['Porozmawiajmy o&nbsp;<em>Twojej</em> stronie', '5&nbsp;minut pytań, jednostronicowa propozycja w&nbsp;48 godzin. Odpowiadam osobiście.'], drugi: 'Umów 15&nbsp;minut na Google Meet' }),
]);

// ---------------------------------------------------------------- części szablonu

const tp = (slug, area) => blok('core/template-part', { slug, tagName: area, theme: 'twentytwentyfive' });
const naglowekStrony = [
	grupa([
		grupa([
			blok('core/site-title', { level: 0 }),
			wiersz([
				blok('core/navigation', { ref: NAWIGACJA_ID || undefined, overlayMenu: 'mobile', overlayBackgroundColor: 'krem', overlayTextColor: 'czern', layout: { type: 'flex', justifyContent: 'right' }, style: { spacing: { blockGap: '30px' } } }),
				przyciski([przycisk('Umów 15&nbsp;minut', ROZMOWA, { maly: true })], { klasa: 'mp-przycisk-naglowka' }),
			], { nowrap: true, gap: '32px', justify: 'right' }),
		], { align: 'wide', klasa: 'mp-naglowek', layout: { type: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between' } }),
	], { align: 'full', tlo: 'krem', layout: { type: 'constrained', wideSize: '1200px' } }),
];
const linkiStopki = (lista_) => lista(lista_.map(([t, u]) => `<a href="${u}">${t}</a>`));
const stopkaStrony = [
	grupa([
		grupa([
			kolumny([
				['34%', [blok('core/site-title', { level: 0 }), p('Strony z&nbsp;kalendarzem, przez które klienci umawiają się sami.'), przyciski([przycisk('Umów 15&nbsp;minut', ROZMOWA, { maly: true })])], { klasa: 'mp-stopka-wstep' }],
				['22%', [h2('Pakiety'), linkiStopki([['Wizytówka · 1&nbsp;200&nbsp;zł netto', G.pakiety], ['Wizytówka, która umawia · 1&nbsp;800&nbsp;zł netto', G.pakiety], ['Pełny start · 2&nbsp;500&nbsp;zł netto', G.pakiety]])]],
				['22%', [h2('Branże'), linkiStopki([['Doradcy kredytowi', U.doradcy], ['Biura rachunkowe', U.biura], ['Psycholodzy i&nbsp;terapeuci', U.terapeuci]])]],
				['22%', [h2('Na skróty'), linkiStopki([['Jak to działa', G.jakToDziala], ['Realizacje', U.realizacje], ['Pytania', G.pytania], ['Umów rozmowę', ROZMOWA], ['Wolisz na piśmie?', ANKIETA]])]],
			], { klasa: 'mp-stopka-kolumny', gap: '40px' }),
			wiersz([
				wzorzec('stopka', p('Mateusz Przetocki · Kraków · kontakt@…')),
				wiersz([
					p(`<a href="${U.polityka}">Polityka prywatności</a>`), p(`<a href="${U.cookies}">Polityka cookies</a>`), p(`<a href="${U.regulamin}">Regulamin</a>`),
					html(PRZYCISK_COOKIES),
				], { klasa: 'mp-stopka-linki', gap: '6px 20px' }),
			], { klasa: 'mp-stopka-dol', justify: 'space-between', gap: '12px 20px' }),
		], { align: 'wide', gap: '56px' }),
	], { align: 'full', klasa: 'mp-stopka is-style-ciemna', tlo: 'czern', tekst: 'szary-na-czerni', pad: { top: 'clamp(64px, 6vw, 80px)', bottom: '40px' }, layout: { type: 'constrained' } }),
	// pasek na telefonie (wersja A z 26.10, od 29.10 z rozmową 15 minut): jasna karta, obietnica po lewej, mały przycisk po prawej
	wiersz([
		grupa([p('Rozmowa 15&nbsp;minut', { klasa: 'mp-pasek-tytul' }), p('Google Meet · bez zobowiązań', { klasa: 'mp-pasek-podpis' })], { klasa: 'mp-pasek-tekst' }),
		przyciski([przycisk('Umów', ROZMOWA, { strzalka: true, maly: true })]),
	], { klasa: 'mp-pasek-telefon', justify: 'space-between', pion: 'center', nowrap: true, gap: '12px' }),
];
const szablon404 = [
	tp('header', 'header'),
	grupa([
		sekcja([kolumny([
			['38%', [p('404', { klasa: 'is-style-404' })]],
			['62%', [
				nad('Błąd 404'),
				h1('Tej strony tu nie ma'),
				p('Link mógł być stary albo w&nbsp;adresie jest literówka. Zacznij od jednej z&nbsp;tych stron:'),
				lista([`<a href="${U.glowna}">Strona główna</a>`, `<a href="${G.pakiety}">Pakiety i&nbsp;ceny</a>`, `<a href="${U.realizacje}">Realizacje</a>`], { klasa: 'is-style-lista-linki' }),
				wiersz([przyciski([przycisk(UMOW, ROZMOWA, { strzalka: true })]), podpis('Bez zobowiązań · odpowiadam osobiście')], { gap: '12px 20px' }),
			]],
		], { pion: 'center' })], { gora: 'clamp(56px, 6.7vw, 96px)' }),
	], { tag: 'main', layout: { type: 'constrained' }, margines: { top: '0' } }),
	tp('footer', 'footer'),
];

// nawigacja: odnośniki do stron po ID (wyslij.py zna ID po utworzeniu stron)
function nawigacja(idStron) {
	const link = (label, klucz) => blok('core/navigation-link', { label, type: 'page', id: idStron[klucz], url: STRONY[klucz].url, kind: 'post-type' });
	const pod = (label, klucz, dzieci) => blok('core/navigation-submenu', { label, type: 'page', id: idStron[klucz], url: STRONY[klucz].url, kind: 'post-type' }, dzieci);
	// od 29.10: sekcje nowej głównej (kotwice) i Realizacje; przycisk „Umów 15 minut” stoi obok menu w nagłówku
	const kotwica = (label, url) => blok('core/navigation-link', { label, url, kind: 'custom', isTopLevelLink: true });
	return [
		kotwica('Jak to działa', G.jakToDziala),
		kotwica('Pakiety', G.pakiety),
		link('Realizacje', 'realizacje'),
		kotwica('O mnie', G.oMnie),
	];
}

// ---------------------------------------------------------------- style globalne

const PALETA = [
	['krem', 'Krem (tło strony)', '#f5f2ec'], ['piasek', 'Piasek (co druga sekcja)', '#e8e0d4'], ['piasek-ciemny', 'Piasek ciemny (miejsce na zdjęcie)', '#dcd3c6'],
	['biel', 'Biel (karty)', '#ffffff'], ['czern', 'Czerń (tekst, przyciski, ciemne pasy)', '#161514'], ['grafit', 'Grafit (tekst pomocniczy)', '#5c574f'],
	['blekit', 'Błękit (akcent na czerni)', '#a7c7e7'], ['blekit-jasny', 'Błękit jasny (polecany pakiet, etykiety)', '#dce8f3'], ['linia', 'Linia (ramki na jasnym)', '#d9d0c3'],
	['szary-na-czerni', 'Szary na czerni (akapity)', '#c9c2b6'], ['linia-ciemna', 'Linia na czerni', '#34312d'], ['blekit-linia', 'Linia na błękicie', '#b9ccdd'],
	['czern-hover', 'Czerń po najechaniu', '#2e2b28'], ['blekit-hover', 'Błękit po najechaniu', '#c3d9ef'],
	// zgodność z szablonami motywu Twenty Twenty-Five (blog, wyszukiwarka)
	['base', 'Motyw: tło', '#f5f2ec'], ['contrast', 'Motyw: tekst', '#161514'], ['accent-1', 'Motyw: akcent 1', '#a7c7e7'], ['accent-2', 'Motyw: akcent 2', '#e8e0d4'],
	['accent-3', 'Motyw: akcent 3', '#5c574f'], ['accent-4', 'Motyw: akcent 4', '#5c574f'], ['accent-5', 'Motyw: akcent 5', '#ffffff'], ['accent-6', 'Motyw: akcent 6', 'color-mix(in srgb, currentColor 20%, transparent)'],
].map(([slug, name, color]) => ({ slug, name, color }));
const ROZMIARY = [
	['podpis', 'Podpis (14 px)', '14px'], ['small', 'Mały (15 px)', '15px'], ['medium', 'Tekst (17–18 px)', 'clamp(17px, 1.25vw, 18px)'],
	['large', 'Wstęp (17–19 px)', 'clamp(17px, 1.32vw, 19px)'], ['x-large', 'Nagłówek karty (22 px)', '22px'],
	['xx-large', 'Nagłówek sekcji (30–44 px)', 'clamp(30px, 3.1vw, 44px)'], ['naglowek-strony', 'Nagłówek strony (40–64 px)', 'clamp(40px, 4.45vw, 64px)'],
].map(([slug, name, size]) => ({ slug, name, size, fluid: false }));
function rodzinyFontow() {
	const f = (FONTY || {});
	const rodzina = (slug, name, stos, twarze) => ({ slug, name, fontFamily: stos, fontFace: (f[slug] || twarze.map(([w, s]) => ({ fontWeight: w, fontStyle: s, src: [`/wp-content/uploads/fonts/${slug}-${w}-${s}.woff2`] }))).map((x) => ({ fontFamily: name, fontStyle: x.fontStyle, fontWeight: x.fontWeight, src: x.src, fontDisplay: 'swap' })) });
	return [
		rodzina('inter', 'Inter', 'Inter, system-ui, sans-serif', [['400', 'normal'], ['500', 'normal'], ['600', 'normal']]),
		rodzina('inter-tight', 'Inter Tight', '"Inter Tight", Inter, system-ui, sans-serif', [['600', 'normal'], ['700', 'normal']]),
		rodzina('instrument-serif', 'Instrument Serif', '"Instrument Serif", Georgia, serif', [['400', 'normal'], ['400', 'italic']]),
	];
}
const PADDING_PRZYCISKU = { top: '0', bottom: '0', left: '26px', right: '26px' };
const STYLE_GLOBALNE = {
	settings: {
		color: { palette: { theme: PALETA } },
		typography: { fontFamilies: { custom: rodzinyFontow() }, fontSizes: { theme: ROZMIARY } },
		layout: { contentSize: '680px', wideSize: '1120px' },
	},
	styles: {
		color: { background: 'var:preset|color|krem', text: 'var:preset|color|czern' },
		typography: { fontFamily: 'var:preset|font-family|inter', fontSize: 'var:preset|font-size|medium', fontWeight: '400', lineHeight: '1.6', letterSpacing: '0' },
		spacing: { blockGap: '22px', padding: { top: '0px', bottom: '0px', left: 'clamp(20px, 2.8vw, 40px)', right: 'clamp(20px, 2.8vw, 40px)' } },
		elements: {
			heading: { typography: { fontFamily: 'var:preset|font-family|inter-tight', fontWeight: '600', letterSpacing: '-0.02em', lineHeight: '1.1' }, color: { text: 'var:preset|color|czern' } },
			h1: { typography: { fontSize: 'var:preset|font-size|naglowek-strony', lineHeight: '1.05' } },
			h2: { typography: { fontSize: 'var:preset|font-size|xx-large', lineHeight: '1.1' } },
			h3: { typography: { fontSize: 'var:preset|font-size|x-large', lineHeight: '1.3', letterSpacing: '-0.01em' } },
			h4: { typography: { fontSize: '18px', lineHeight: '1.35', letterSpacing: '-0.01em' } },
			link: { color: { text: 'var:preset|color|czern' }, typography: { textDecoration: 'underline' }, ':hover': { typography: { textDecoration: 'none' } } },
			button: {
				color: { background: 'var:preset|color|czern', text: 'var:preset|color|krem' },
				border: { radius: '9999px', width: '1.5px', style: 'solid', color: 'var:preset|color|czern' },
				typography: { fontFamily: 'var:preset|font-family|inter', fontSize: '16px', fontWeight: '600', lineHeight: '1' },
				spacing: { padding: PADDING_PRZYCISKU },
				':hover': { color: { background: 'var:preset|color|czern-hover', text: 'var:preset|color|krem' }, border: { color: 'var:preset|color|czern-hover' } },
			},
			caption: { typography: { fontSize: '15px', lineHeight: '1.5' }, color: { text: 'var:preset|color|grafit' } },
		},
		blocks: {
			'core/button': { variations: { outline: { color: { background: 'transparent', text: 'var:preset|color|czern' }, border: { color: 'var:preset|color|czern', width: '1.5px' }, spacing: { padding: PADDING_PRZYCISKU } } } },
			'core/buttons': { spacing: { blockGap: '12px' } },
			'core/columns': { spacing: { blockGap: 'clamp(36px, 5.6vw, 80px)' } },
			'core/navigation': { typography: { fontSize: '15px', fontWeight: '500' } },
			'core/site-title': { typography: { fontFamily: 'var:preset|font-family|inter-tight', fontWeight: '600', fontSize: '20px', letterSpacing: '-0.01em' } },
		},
		css: fs.readFileSync(path.join(TU, 'style', 'marka.css'), 'utf8'),
	},
};

// Tytuły SEO (plan strony, „Tytuły i opisy wszystkich podstron”, poprawione 26.10). Opis SEO to `opis` (zajawka strony).
// Strona bez wpisu dostaje swój tytuł. Do Rank Math wysyła je `wyslij.py seo`, formularze „ukryta” dostają noindex.
const TYTULY_SEO = {
	glowna: 'Strona z kalendarzem dla specjalistów',
	oferta: 'Pakiety i ceny stron wizytówek',
	realizacje: 'Realizacje i kalendarz rezerwacji',
	kontakt: 'Kontakt i wycena strony',
	rozmowa: 'Umów 15 minut rozmowy',
	wycena: 'Wycena strony w 5 minut',
	dlaKogo: 'Dla kogo robię strony',
	doradcy: 'Strona dla doradcy kredytowego',
	biura: 'Strona dla biura rachunkowego',
	terapeuci: 'Strona dla psychologa i terapeuty',
	jakPracuje: 'Jak pracuję: od ankiety do startu',
	pytania: 'Pytania o stronę z kalendarzem',
	oMnie: 'Kim jestem i jak pracuję',
};
const SEO_PODPIS = ' | Mateusz Przetocki';

// ---------------------------------------------------------------- zapis

const serializuj = (lista_) => B.serialize(lista_);
const meta = {};
for (const [klucz, s] of Object.entries(STRONY)) {
	const rodzic = s.rodzic ? STRONY[s.rodzic] : null;
	s.url = klucz === 'glowna' ? '/' : `${rodzic ? `/${rodzic.slug}` : ''}/${s.slug}/`;
}
for (const [klucz, s] of Object.entries(STRONY)) {
	fs.writeFileSync(path.join(BUILD, 'strony', `${klucz}.html`), serializuj(s.bloki));
	const seo = (TYTULY_SEO[klucz] || s.tytul) + SEO_PODPIS;
	// Google ucina dłuższe: tytuł ok. 60 znaków, opis ok. 160
	if (seo.length > 60) throw new Error(`Tytuł SEO strony ${klucz} ma ${seo.length} zn. (najwyżej 60)`);
	if (s.opis.length > 160) throw new Error(`Opis strony ${klucz} ma ${s.opis.length} zn. (najwyżej 160)`);
	meta[klucz] = { tytul: s.tytul, slug: s.slug, rodzic: s.rodzic || null, opis: s.opis, url: s.url, status: s.status, seo, ukryta: s.ukryta || undefined };
}
fs.writeFileSync(path.join(BUILD, 'strony.json'), JSON.stringify(meta, null, 1));
fs.writeFileSync(path.join(BUILD, 'czesci', 'naglowek.html'), serializuj(naglowekStrony));
fs.writeFileSync(path.join(BUILD, 'czesci', 'stopka.html'), serializuj(stopkaStrony));
fs.writeFileSync(path.join(BUILD, 'czesci', 'szablon-404.html'), serializuj(szablon404));
const ids = wczytaj(path.join(BUILD, 'id-stron.json'), Object.fromEntries(Object.keys(STRONY).map((k, i) => [k, i + 100])));
fs.writeFileSync(path.join(BUILD, 'czesci', 'nawigacja.html'), serializuj(nawigacja(ids)));
fs.writeFileSync(path.join(BUILD, 'style-globalne.json'), JSON.stringify(STYLE_GLOBALNE, null, 1));
process.stdout.write(`Zbudowano ${Object.keys(STRONY).length} stron, nagłówek, stopkę, 404, nawigację i style globalne.\n`);

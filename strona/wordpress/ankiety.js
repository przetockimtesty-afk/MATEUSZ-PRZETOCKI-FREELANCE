// Ankiety na mateuszprzetocki.pl (blok „Ankieta” z wtyczki MP Ankiety). Źródło treści: ten plik;
// zbuduj.js wstawia definicje do bloków na stronach. Format opisuje README wtyczki
// (strona/wtyczki/mp-ankiety/README.md). Identyfikatory pytań ankiety wyceny są te same co w Kod.gs
// (PYTA, UMAWIA, KWOTA…), bo automat liczy z nich koszt problemu i propozycję.

// Polska typografia: spójnik albo przyimek z jednej litery nie zostaje na końcu linii.
const twarde = (t) => t.replace(/(^|[\s(„])([aiouwzAIOUWZ]) /g, '$1$2 ');
// Wartości (w) zostają bez zmian, bo odwołują się do nich warunki „gdy” i automat w Kod.gs.
const NIETYKALNE = ['id', 'w', 'typ', 'z_adresu', 'adres', 'gdy', 'pola', 'zdarzenia'];
const opcja = (o) => (typeof o === 'string' ? { w: o, t: twarde(o) } : { ...o, w: o.w ?? o.t, t: twarde(o.t) });
const popraw = (x) => (typeof x === 'string' ? twarde(x) : Array.isArray(x) ? x.map(popraw) : x && typeof x === 'object'
	? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, k === 'opcje' ? v.map(opcja) : NIETYKALNE.includes(k) ? v : popraw(v)]))
	: x);

// ---------------------------------------------------------------- wspólne

const BRANZE = [
	{ w: 'doradca', t: 'Doradztwo kredytowe' },
	{ w: 'ubezpieczenia', t: 'Ubezpieczenia' },
	{ w: 'biuro', t: 'Biuro rachunkowe' },
	{ w: 'psycholog', t: 'Psychologia lub psychoterapia' },
	{ w: 'fizjo', t: 'Fizjoterapia' },
	{ w: 'kancelaria', t: 'Kancelaria prawna' },
	{ w: 'remont', t: 'Remonty i wykończenia' },
];
const KONSULTACJE = ['doradca', 'ubezpieczenia', 'biuro', 'psycholog', 'fizjo', 'kancelaria'];
const GABINETY = ['psycholog', 'fizjo'];
// Wersja A (pierwszy krok to rozmowa albo wizyta) i B (pierwszy krok to wycena zlecenia).
const A = [{ BRANZA: KONSULTACJE }, { MODEL: ['A'] }];
const B = [{ BRANZA: ['remont'] }, { MODEL: ['B'] }];
const branza = (lista) => ({ BRANZA: lista });

const pytanieBranza = (z_adresu) => ({
	id: 'BRANZA', typ: 'jeden', tytul: 'Czym się zajmujesz?', wymagane: true,
	opcje: BRANZE, inne: 'Inna branża', podpowiedz: 'Jaka?', z_adresu,
});
const FIRMA = { id: 'FIRMA', typ: 'tekst', tytul: 'Imię i nazwisko albo nazwa firmy', wymagane: true };
const EMAIL = (tytul = 'Twój e-mail') => ({ id: 'EMAIL', typ: 'email', tytul, wymagane: true, podpowiedz: 'imie@firma.pl' });
const PRYWATNOSC = 'Odpowiedzi widzę tylko ja i wykorzystuję je wyłącznie do naszej współpracy. Zasady opisuję w {polityka}.';
const POLA = { email: 'EMAIL', nazwa: 'FIRMA' };

// ---------------------------------------------------------------- 1. wycena (przycisk „Wyceń stronę w 5 minut”)

const wycena = {
	id: 'wycena',
	nazwa: 'Wycena strony',
	czas: 'ok. 5 minut',
	automat: true,
	zdarzenia: { ga4: 'generate_lead', meta: 'Lead' },
	pola: POLA,
	wyslij: 'Wyślij i poproś o propozycję',
	prywatnosc: PRYWATNOSC,
	dziekuje: {
		naglowek: 'Dziękuję! Odpowiedzi dotarły.',
		tekst: 'Propozycję na piśmie wyślę na {email} w ciągu 48 godzin. Jeśli wolisz porozmawiać wcześniej, umów 15 minut na Google Meet.',
		przycisk: 'Umów 15 minut',
		adres: '/rozmowa/',
	},
	potwierdzenie: {
		temat: 'Dziękuję za odpowiedzi · propozycja w 48 godzin',
		tekst: 'Dziękuję za wypełnienie ankiety. Propozycję na piśmie (zakres, cena i termin) wyślę w ciągu 48 godzin. Poniżej kopia Twoich odpowiedzi. Jeśli coś się zmieniło, po prostu odpisz na tę wiadomość.',
	},
	kroki: [
		{
			tytul: 'Twoja praca',
			opis: 'Kolejne pytania dopasują się do Twojej branży.',
			pytania: [
				pytanieBranza('branza'),
				{ id: 'MODEL', typ: 'jeden', tytul: 'Jak zaczyna się współpraca z nowym klientem?', wymagane: true, gdy: { BRANZA: ['__inne'] },
					opcje: [{ w: 'A', t: 'Od rozmowy, konsultacji albo wizyty' }, { w: 'B', t: 'Od wyceny zlecenia' }] },
				{ id: 'SIEC', typ: 'jeden', tytul: 'Jak działasz?', gdy: branza(['doradca']),
					pomoc: 'Sieci mają czasem zasady co do własnej strony. Sprawdzę je przed startem.',
					opcje: ['W sieci albo u pośrednika', 'Samodzielnie, jako własna firma'] },
				{ id: 'SIEC', typ: 'jeden', tytul: 'Jak działasz?', gdy: branza(['ubezpieczenia']),
					opcje: ['Agent jednego towarzystwa', 'Agent kilku towarzystw', 'Broker'] },
				{ id: 'SIEC', typ: 'jeden', tytul: 'Kto prowadzi kancelarię?', gdy: branza(['kancelaria']),
					pomoc: 'Samorząd zawodowy ma zasady informowania o usługach. Treści piszę zgodnie z nimi.',
					opcje: ['Adwokat', 'Radca prawny', 'Inna kancelaria'] },
				{ id: 'FORMA', typ: 'wiele', tytul: 'Jak pracujesz?', gdy: branza(['psycholog']),
					opcje: ['W gabinecie', 'Online', 'Z parami albo rodzinami'] },
				{ id: 'FORMA', typ: 'wiele', tytul: 'Jak pracujesz?', gdy: branza(['fizjo']),
					opcje: ['W gabinecie', 'Wizyty domowe', 'Konsultacje online'] },
				{ id: 'OBSLUGA', typ: 'wiele', tytul: 'Kogo obsługujesz?', gdy: branza(['biuro']),
					opcje: ['Jednoosobowe firmy', 'Spółki', 'Fundacje i stowarzyszenia', 'Osoby prywatne'] },
				{ id: 'OBSZAR', typ: 'tekst', tytul: 'Gdzie pracujesz?', gdy: branza(['remont']), podpowiedz: 'np. Kraków i 30 km dookoła' },
				{ id: 'STRONA', typ: 'tekst', tytul: 'Masz już stronę albo profil w internecie?', podpowiedz: 'np. www.twojafirma.pl',
					pomoc: 'Wklej adres, jeśli jest. Może być też profil w Google albo na Facebooku.' },
			],
		},
		{
			tytul: 'Nowi klienci',
			opis: 'Wystarczą przybliżone liczby.',
			gdy: A,
			pytania: [
				{ id: 'PYTA', typ: 'liczba', tytul: 'Ile osób w miesiącu pyta o pierwsze spotkanie?', wymagane: true, podpowiedz: 'np. 12', max: 100000 },
				{ id: 'UMAWIA', typ: 'liczba', tytul: 'Ile z nich się umawia?', wymagane: true, podpowiedz: 'np. 7', max: 100000 },
				{ id: 'KLIENCI', typ: 'liczba', tytul: 'Ile z umówionych osób zostaje klientami?', podpowiedz: 'np. 3', max: 100000,
					pomoc: 'Miesięcznie. Jeśli trudno powiedzieć, pomiń.' },
				{ id: 'SKAD', typ: 'wiele', tytul: 'Skąd przychodzą nowi klienci?', wymagane: true, pomoc: 'Zaznacz wszystko, co pasuje.',
					opcje: ['Polecenia', 'Google', 'Media społecznościowe', 'Portal albo katalog (np. ZnanyLekarz)', 'Sieć albo firma, z którą współpracuję'], inne: 'Inne', podpowiedz: 'Skąd jeszcze?' },
			],
		},
		{
			tytul: 'Zapytania i wyceny',
			opis: 'Wystarczą przybliżone liczby.',
			gdy: B,
			pytania: [
				{ id: 'ZAPYTANIA', typ: 'liczba', tytul: 'Ile zapytań o cenę przychodzi w tygodniu?', wymagane: true, podpowiedz: 'np. 10', max: 100000 },
				{ id: 'ZLECENIA', typ: 'liczba', tytul: 'Ile z nich kończy się zleceniem?', podpowiedz: 'np. 4', max: 100000 },
				{ id: 'PRZEPADA', typ: 'liczba', tytul: 'Ile razy w zeszłym tygodniu telefon został bez odpowiedzi, bo trwała praca?', wymagane: true,
					podpowiedz: 'np. 3', max: 10000, pomoc: 'Jeśli ani razu, wpisz 0.' },
				{ id: 'SKAD', typ: 'wiele', tytul: 'Skąd przychodzą zapytania?', wymagane: true, pomoc: 'Zaznacz wszystko, co pasuje.',
					opcje: ['Telefon', 'Messenger albo WhatsApp', 'Formularz na stronie', 'Portal z ogłoszeniami (np. Oferteo)', 'Polecenia', 'Stali klienci'], inne: 'Inne', podpowiedz: 'Skąd jeszcze?' },
			],
		},
		{
			tytul: 'Pierwszy kontakt',
			gdy: A,
			pytania: [
				{ id: 'PRZESZKADZA', typ: 'akapit', tytul: 'Co dziś najbardziej przeszkadza w umawianiu nowych klientów?', wymagane: true,
					pomoc: 'Jednym zdaniem, np. „telefony w trakcie spotkań” albo „ciągle te same pytania”.' },
				{ id: 'ROZMOWA', typ: 'jeden', tytul: 'Ile trwa pierwsza rozmowa z nowym klientem?', opcje: ['do 15 minut', '15–30 minut', '30–60 minut', 'ponad godzinę'] },
				{ id: 'FAQ', typ: 'akapit', tytul: 'O co klienci pytają najczęściej, zanim się umówią?',
					pomoc: 'Kilka pytań wystarczy. Z nich powstanie część „Pytania” na stronie.' },
				{ id: 'INFO', typ: 'akapit', tytul: 'Co musisz wiedzieć przed pierwszą konsultacją?', gdy: branza(['doradca']),
					pomoc: 'Np. kwota kredytu w przedziałach, rodzaj umowy, wkład własny. Z tego powstanie krótki formularz przed spotkaniem.' },
				{ id: 'INFO', typ: 'akapit', tytul: 'Co musisz wiedzieć przed pierwszym spotkaniem?', gdy: branza(['ubezpieczenia']),
					pomoc: 'Np. czego dotyczy ubezpieczenie i kiedy kończy się obecna polisa.' },
				{ id: 'INFO', typ: 'akapit', tytul: 'Co musisz wiedzieć przed pierwszą rozmową?', gdy: branza(['biuro']),
					pomoc: 'Np. forma działalności, liczba dokumentów w miesiącu, VAT.' },
				{ id: 'INFO', typ: 'akapit', tytul: 'Co musisz wiedzieć przed pierwszą konsultacją?', gdy: branza(['kancelaria']),
					pomoc: 'Np. dziedzina sprawy, termin, czy sprawa jest już w sądzie.' },
				{ id: 'INFO', typ: 'akapit', tytul: 'Co powinna wiedzieć osoba przed pierwszą wizytą?', gdy: branza(GABINETY),
					pomoc: 'Np. ile trwa, jak się przygotować, jak odwołać. Na stronie nie zbieramy informacji o zdrowiu.' },
				{ id: 'INFO', typ: 'akapit', tytul: 'Co musisz wiedzieć przed pierwszym spotkaniem?', gdy: { BRANZA: ['__inne'] },
					pomoc: 'Np. kilka informacji, o które zwykle pytasz na początku rozmowy.' },
				{ id: 'HISTORIA', typ: 'akapit', tytul: 'Ostatnia osoba, która zapytała, ale się nie umówiła: co się wtedy stało?', pomoc: 'Krótko, bez nazwisk.' },
			],
		},
		{
			tytul: 'Wyceny',
			gdy: B,
			pytania: [
				{ id: 'PRZESZKADZA', typ: 'akapit', tytul: 'Co w wycenach zabiera najwięcej czasu albo nerwów?', wymagane: true,
					pomoc: 'Jednym zdaniem, np. „wieczory nad wycenami w wiadomościach”.' },
				{ id: 'GODZ', typ: 'jeden', tytul: 'Ile czasu w tygodniu zajmują Ci wyceny?', opcje: ['do 1 godziny', '1–3 godziny', '3–5 godzin', 'ponad 5 godzin'] },
				{ id: 'ELEMENTY', typ: 'wiele', tytul: 'Co musisz wiedzieć, żeby podać cenę?', wymagane: true, pomoc: 'Zaznacz wszystko, co pasuje.',
					opcje: ['Zakres prac', 'Metraż albo wymiary', 'Materiały', 'Zdjęcia obecnego stanu', 'Termin', 'Adres albo dojazd'], inne: 'Coś jeszcze', podpowiedz: 'Co jeszcze?' },
				{ id: 'CENNIK', typ: 'akapit', tytul: 'Jakie prace wyceniasz najczęściej i w jakich cenach?',
					pomoc: 'Wystarczy roboczo, w punktach. Z tego powstanie formularz albo kalkulator wyceny.' },
				{ id: 'HISTORIA', typ: 'akapit', tytul: 'Ostatnie zapytanie, które przepadło: co się wtedy stało?', pomoc: 'Krótko, bez nazwisk.' },
			],
		},
		{
			tytul: 'Cel i start',
			pytania: [
				{ id: 'CEL', typ: 'akapit', tytul: 'Po czym za 3 miesiące poznasz, że strona była warta zachodu?', wymagane: true,
					pomoc: 'Jednym zdaniem, np. „połowa klientów umawia się sama” albo „zapytania przychodzą od razu ze zdjęciami”.' },
				{ id: 'KWOTA', typ: 'liczba', tytul: 'Ile średnio przynosi jeden nowy klient (w zł)?', gdy: A, podpowiedz: 'np. 3000', max: 10000000,
					pomoc: 'Wystarczy średnia.' },
				{ id: 'KWOTA', typ: 'liczba', tytul: 'Ile wynosi przeciętne zlecenie (w zł)?', gdy: B, podpowiedz: 'np. 4500', max: 10000000,
					pomoc: 'Wystarczy średnia.' },
				{ id: 'GOTOWE', typ: 'wiele', tytul: 'Co już masz?',
					opcje: ['Zdjęcie portretowe', 'Logo', 'Opinie w Google', 'Profil Firmy w Google', 'Zdjęcia realizacji', 'Własna domena', 'Strona internetowa', { t: 'Nic z tych rzeczy', sam: true }] },
				{ id: 'KIEDY', typ: 'jeden', tytul: 'Na kiedy potrzebujesz strony?', opcje: ['Jak najszybciej', 'W ciągu miesiąca', 'W ciągu 2–3 miesięcy', 'Na razie sprawdzam ceny'] },
				{ id: 'BUDZET', typ: 'jeden', tytul: 'Jaki masz budżet?', pomoc: 'Pakiety kosztują 1\u00a0200, 1\u00a0800 albo 2\u00a0500 zł.',
					opcje: ['do 1 500 zł', '1 500–3 000 zł', 'powyżej 3 000 zł', 'nie wiem'] },
			],
		},
		{
			tytul: 'Gdzie wysłać propozycję',
			pytania: [
				FIRMA,
				EMAIL('E-mail, na który wyślę propozycję'),
				{ id: 'ZRODLO', typ: 'jeden', tytul: 'Skąd o mnie wiesz?', z_adresu: 'zrodlo',
					opcje: [{ w: 'polecenie', t: 'Z polecenia' }, { w: 'email', t: 'Z mojej wiadomości e-mail' }, { w: 'google', t: 'Z Google' },
						{ w: 'social', t: 'Z mediów społecznościowych' }, { w: 'useme', t: 'Z Useme albo ogłoszenia' }], inne: 'Inaczej', podpowiedz: 'Skąd?' },
				{ id: 'UWAGI', typ: 'akapit', tytul: 'Chcesz coś dodać?' },
				{ id: 'NEWSLETTER', typ: 'zgoda', tytul: 'Chcę dostawać od Mateusza Przetockiego e-maile ze wskazówkami, jak strona może umawiać więcej klientów (najwyżej raz w miesiącu).',
					pomoc: 'Dobrowolne. Wypiszesz się jednym kliknięciem.' },
			],
		},
	],
};

// ---------------------------------------------------------------- 2. materiały na stronę (po zadatku)

const materialy = {
	id: 'materialy',
	nazwa: 'Materiały na stronę',
	czas: 'ok. 20 minut',
	pola: POLA,
	wstep: 'Z tych odpowiedzi napiszę teksty strony. Możesz przerwać i wrócić: odpowiedzi zapamiętuje ta przeglądarka.',
	wyslij: 'Wyślij materiały',
	prywatnosc: PRYWATNOSC,
	dziekuje: {
		naglowek: 'Dziękuję! Materiały dotarły.',
		tekst: 'Przejrzę je i odezwę się na {email}, jeśli czegoś zabraknie. Gdy mam komplet materiałów i dostępów, liczę 5 dni roboczych do szkicu.',
	},
	potwierdzenie: {
		temat: 'Materiały na stronę dotarły',
		tekst: 'Dziękuję za materiały. Poniżej kopia Twoich odpowiedzi. Jeśli chcesz coś zmienić albo dopisać, odpisz na tę wiadomość.',
	},
	kroki: [
		{
			tytul: 'Firma',
			pytania: [
				{ ...FIRMA, tytul: 'Nazwa firmy, tak jak ma być na stronie' },
				EMAIL(),
				pytanieBranza('branza'),
			],
		},
		{
			tytul: 'Dane do stopki i polityki prywatności',
			opis: 'Te dane muszą być na stronie z mocy prawa. Wpisz je tak, jak w rejestrze.',
			pytania: [
				{ id: 'NAZWA_PELNA', typ: 'tekst', tytul: 'Pełna nazwa firmy z CEIDG albo KRS', wymagane: true },
				{ id: 'NIP', typ: 'tekst', tytul: 'NIP', podpowiedz: 'np. 6761234567' },
				{ id: 'ADRES', typ: 'akapit', tytul: 'Adres firmy', wymagane: true,
					pomoc: 'Jeśli pracujesz z domu, napisz, czy ten adres może być widoczny na stronie, czy wolisz adres do korespondencji.' },
				{ id: 'TELEFON_STRONA', typ: 'telefon', tytul: 'Telefon, który ma być na stronie', pomoc: 'Możesz pominąć: klienci umówią się przez kalendarz.' },
				{ id: 'EMAIL_STRONA', typ: 'email', tytul: 'E-mail, który ma być na stronie', pomoc: 'Jeśli inny niż Twój adres wyżej.' },
				{ id: 'REJESTR', typ: 'akapit', tytul: 'Numer wpisu do rejestru KNF i status (pośrednik albo agent)', gdy: branza(['doradca']),
					pomoc: 'Do informacji, których wymaga ustawa o kredycie hipotecznym (art. 17). Jeśli działasz w sieci, dopisz jej nazwę.' },
				{ id: 'REJESTR', typ: 'akapit', tytul: 'Numer wpisu do rejestru agentów i towarzystwa, dla których działasz', gdy: branza(['ubezpieczenia']) },
				{ id: 'REJESTR', typ: 'tekst', tytul: 'Izba i numer wpisu na listę adwokatów albo radców prawnych', gdy: branza(['kancelaria']) },
				{ id: 'REJESTR', typ: 'akapit', tytul: 'Uprawnienia: numer prawa wykonywania zawodu, certyfikaty, towarzystwo', gdy: branza(['psycholog']),
					pomoc: 'Jeśli masz. Np. certyfikat psychoterapeuty i towarzystwo, które go wydało.' },
				{ id: 'REJESTR', typ: 'tekst', tytul: 'Numer prawa wykonywania zawodu fizjoterapeuty', gdy: branza(['fizjo']) },
				{ id: 'REJESTR', typ: 'akapit', tytul: 'Uprawnienia i ubezpieczenie OC biura', gdy: branza(['biuro']),
					pomoc: 'Np. certyfikat księgowy Ministerstwa Finansów, informacja o polisie OC (bez kwot).' },
				{ id: 'ZASADY', typ: 'akapit', tytul: 'Zasady sieci albo samorządu dotyczące strony', gdy: branza(['doradca', 'ubezpieczenia', 'kancelaria']),
					pomoc: 'Np. czy wolno mieć własną stronę, jak podpisywać stanowisko, czy wolno używać logo. Jeśli nie wiesz, napisz „nie wiem”, sprawdzę.' },
			],
		},
		{
			tytul: 'O Tobie',
			pytania: [
				{ id: 'OMNIE', typ: 'akapit', tytul: 'Kilka zdań o sobie: doświadczenie, wykształcenie, od kiedy działasz', wymagane: true,
					pomoc: 'Z tego napiszę część „O mnie”. Wystarczą punkty.' },
				{ id: 'WYROZNIK', typ: 'akapit', tytul: 'Co klienci najbardziej u Ciebie cenią?', pomoc: 'Np. słowa z opinii albo to, co słyszysz najczęściej.' },
				{ id: 'ZDJECIE', typ: 'jeden', tytul: 'Zdjęcie portretowe', wymagane: true,
					opcje: ['Mam dobre zdjęcie i je wyślę', 'Zrobię zdjęcie telefonem według Twojej instrukcji', 'Potrzebuję fotografa'] },
			],
		},
		{
			tytul: 'Usługi',
			pytania: [
				{ id: 'USLUGI', typ: 'akapit', tytul: 'Jakie usługi mają być na stronie?', wymagane: true,
					pomoc: 'Każda w osobnej linii: nazwa, dla kogo, cena albo „od…”, czas trwania.' },
				{ id: 'DLA_KOGO', typ: 'akapit', tytul: 'Dla kogo pracujesz, a dla kogo nie?', pomoc: 'Np. „pierwsze mieszkanie, kredyt z dopłatą; nie robię kredytów firmowych”.' },
				{ id: 'OBSZAR', typ: 'tekst', tytul: 'Gdzie przyjmujesz albo dojeżdżasz?', podpowiedz: 'np. gabinet w Krakowie, online w całej Polsce' },
			],
		},
		{
			tytul: 'Pytania i opinie',
			pytania: [
				{ id: 'FAQ_ODP', typ: 'akapit', tytul: 'Najczęstsze pytania klientów i Twoje odpowiedzi', pomoc: 'Wystarczy 5–8. Pytania z ankiety wyceny już mam, tu dopisz odpowiedzi.' },
				{ id: 'OPINIE', typ: 'akapit', tytul: 'Opinie, które wolno pokazać na stronie', gdy: branza(['doradca', 'ubezpieczenia', 'biuro', 'fizjo', 'kancelaria', 'remont', '__inne']),
					pomoc: 'Link do opinii w Google albo 3–5 cytatów z imieniem, za zgodą autorów.' },
				{ id: 'OPINIE', typ: 'akapit', tytul: 'Opinie, które wolno pokazać na stronie', gdy: branza(['psycholog']),
					pomoc: 'Tylko jeśli pozwala na to kodeks etyki Twojego towarzystwa. Jeśli nie, pomiń: strona obejdzie się bez nich.' },
			],
		},
		{
			tytul: 'Domena, poczta i wygląd',
			pytania: [
				{ id: 'DOMENA', typ: 'jeden', tytul: 'Domena i hosting', wymagane: true,
					opcje: [{ w: 'ma', t: 'Mam domenę i hosting' }, { w: 'domena', t: 'Mam tylko domenę' }, { w: 'nie', t: 'Nie mam: kupię według Twojego filmu' }] },
				{ id: 'DOMENA_ADRES', typ: 'tekst', tytul: 'Adres domeny i gdzie jest zarejestrowana', gdy: { DOMENA: ['ma', 'domena'] }, podpowiedz: 'np. twojafirma.pl, LH.pl' },
				{ id: 'POCZTA', typ: 'jeden', tytul: 'Poczta firmowa',
					opcje: ['Mam skrzynkę w swojej domenie', 'Potrzebuję nowej skrzynki w domenie', 'Wystarczy mi obecny adres (np. Gmail)'] },
				{ id: 'KOLORY', typ: 'tekst', tytul: 'Kolory albo logo, których mam się trzymać', pomoc: 'Możesz pominąć: zaproponuję spokojny zestaw.' },
				{ id: 'PODOBA', typ: 'akapit', tytul: 'Strony, które Ci się podobają, i co w nich', podpowiedz: 'adresy stron i jedno zdanie o każdej' },
			],
		},
		{
			tytul: 'Pliki',
			pytania: [
				{ id: 'PLIKI', typ: 'jeden', tytul: 'Jak wyślesz zdjęcia i logo?', wymagane: true,
					opcje: [{ w: 'link', t: 'Wkleję link do folderu (Dysk Google, Dropbox)' }, { w: 'mail', t: 'Odpowiem na e-mail z załącznikami' }] },
				{ id: 'PLIKI_LINK', typ: 'tekst', tytul: 'Link do folderu', gdy: { PLIKI: ['link'] }, wymagane: true, pomoc: 'Ustaw dostęp „Każdy, kto ma link”.' },
				{ id: 'UWAGI', typ: 'akapit', tytul: 'Coś jeszcze?' },
			],
		},
	],
};

// ---------------------------------------------------------------- 3. ustawienia kalendarza (z nich powstaje plik ustawień MP Rezerwacje)

const CZASY = ['15 min', '20 min', '30 min', '45 min', '50 min', '60 min', '90 min'];
const FORMY = [{ w: 'online', t: 'Online (Google Meet)' }, { w: 'na-miejscu', t: 'Na miejscu (gabinet, biuro)' }, { w: 'telefon', t: 'Telefonicznie' }];

const kalendarz = {
	id: 'kalendarz',
	nazwa: 'Ustawienia kalendarza',
	czas: 'ok. 7 minut',
	pola: POLA,
	wstep: 'Z tych odpowiedzi ustawię kalendarz rezerwacji na Twojej stronie. Wszystko da się później zmienić.',
	wyslij: 'Wyślij ustawienia',
	prywatnosc: PRYWATNOSC,
	dziekuje: { naglowek: 'Dziękuję! Ustawienia dotarły.', tekst: 'Ustawię kalendarz i przy odbiorze strony zrobimy razem próbną rezerwację.' },
	potwierdzenie: { temat: 'Ustawienia kalendarza dotarły', tekst: 'Dziękuję. Poniżej kopia ustawień. Jeśli coś się zmieni, odpisz na tę wiadomość.' },
	kroki: [
		{ tytul: 'Firma', pytania: [FIRMA, EMAIL(), pytanieBranza('branza')] },
		{
			tytul: 'Spotkania',
			pytania: [
				{ id: 'WIZYTA_NAZWA', typ: 'tekst', tytul: 'Jak nazywa się spotkanie, na które klienci mają się umawiać?', wymagane: true, podpowiedz: 'np. Pierwsza konsultacja' },
				{ id: 'WIZYTA_CZAS', typ: 'jeden', tytul: 'Ile trwa?', wymagane: true, opcje: CZASY },
				{ id: 'WIZYTA_FORMA', typ: 'wiele', tytul: 'Gdzie się odbywa?', wymagane: true, pomoc: 'Klient wybierze jedną z zaznaczonych form.', opcje: FORMY },
				{ id: 'ADRES_SPOTKAN', typ: 'tekst', tytul: 'Adres, pod którym przyjmujesz', gdy: { WIZYTA_FORMA: ['na-miejscu'] }, wymagane: true },
				{ id: 'MEET', typ: 'jeden', tytul: 'Link do spotkań online', gdy: { WIZYTA_FORMA: ['online'] }, wymagane: true,
					opcje: [{ w: 'meet', t: 'Zrobię stały link Google Meet według Twojego filmu' }, { w: 'wlasny', t: 'Mam swój link (Zoom, Teams)' }] },
				{ id: 'MEET_LINK', typ: 'tekst', tytul: 'Wklej link', gdy: { MEET: ['wlasny'] }, wymagane: true },
				{ id: 'WIZYTA_OPIS', typ: 'akapit', tytul: 'Co klient ma wiedzieć przed spotkaniem?', pomoc: 'Jedno–dwa zdania pod nazwą spotkania, np. „Nie musisz się przygotowywać”.' },
				{ id: 'DRUGA', typ: 'jeden', tytul: 'Czy jest drugi rodzaj spotkania?', opcje: ['Nie', 'Tak'] },
				{ id: 'WIZYTA2_NAZWA', typ: 'tekst', tytul: 'Nazwa drugiego spotkania', gdy: { DRUGA: ['Tak'] }, wymagane: true, podpowiedz: 'np. Spotkanie kontrolne' },
				{ id: 'WIZYTA2_CZAS', typ: 'jeden', tytul: 'Ile trwa drugie spotkanie?', gdy: { DRUGA: ['Tak'] }, wymagane: true, opcje: CZASY },
				{ id: 'WIZYTA2_FORMA', typ: 'wiele', tytul: 'Gdzie się odbywa drugie spotkanie?', gdy: { DRUGA: ['Tak'] }, wymagane: true, opcje: FORMY },
			],
		},
		{
			tytul: 'Godziny',
			pytania: [
				{ id: 'DNI', typ: 'wiele', tytul: 'W które dni klienci mogą się umawiać?', wymagane: true,
					opcje: ['poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota', 'niedziela'] },
				{ id: 'GODZINY', typ: 'akapit', tytul: 'W jakich godzinach?', wymagane: true, podpowiedz: 'np. pn–pt 9:00–17:00, sob 9:00–13:00',
					pomoc: 'Jeśli w różne dni inaczej, opisz każdy dzień.' },
				{ id: 'PRZERWA', typ: 'jeden', tytul: 'Przerwa między spotkaniami', opcje: ['Bez przerwy', '10 min', '15 min', '30 min'] },
				{ id: 'WYPRZEDZENIE', typ: 'jeden', tytul: 'Najpóźniej ile przed terminem można się umówić?', opcje: ['2 godziny', '12 godzin', '24 godziny', '48 godzin'] },
				{ id: 'OKNO', typ: 'jeden', tytul: 'Na ile do przodu widać wolne terminy?', opcje: ['2 tygodnie', '30 dni', '60 dni', '90 dni'] },
				{ id: 'LIMIT', typ: 'liczba', tytul: 'Najwięcej spotkań w ciągu dnia', podpowiedz: 'np. 4', max: 50, pomoc: 'Puste = bez limitu.' },
				{ id: 'ZMIANY', typ: 'jeden', tytul: 'Do kiedy klient może sam zmienić termin albo odwołać spotkanie?', opcje: ['Do 12 godzin przed', 'Do 24 godzin przed', 'Do 48 godzin przed'] },
			],
		},
		{
			tytul: 'Pytania przed spotkaniem',
			opis: 'Klient odpowiada na nie przy rezerwacji. Krótkie, z wyborem odpowiedzi, bez pytań o zdrowie i numery dokumentów.',
			pytania: [
				{ id: 'PYTANIA', typ: 'wiele', tytul: 'Które pytania dodać?', gdy: branza(['doradca']), opcje: ['Jakiej kwoty kredytu potrzebujesz?', 'Ile masz wkładu własnego?', 'Forma zatrudnienia'] },
				{ id: 'PYTANIA', typ: 'wiele', tytul: 'Które pytania dodać?', gdy: branza(['biuro']), opcje: ['Forma działalności', 'Forma opodatkowania', 'Ile dokumentów miesięcznie?'] },
				{ id: 'PYTANIA', typ: 'wiele', tytul: 'Które pytania dodać?', gdy: branza(['psycholog']), opcje: ['Czy to Twoja pierwsza konsultacja psychologiczna?'] },
				{ id: 'PYTANIA', typ: 'wiele', tytul: 'Które pytania dodać?', gdy: branza(['ubezpieczenia']), opcje: ['Czego dotyczy ubezpieczenie?', 'Kiedy kończy się obecna polisa?'] },
				{ id: 'PYTANIA', typ: 'wiele', tytul: 'Które pytania dodać?', gdy: branza(['kancelaria']), opcje: ['Jakiej dziedziny dotyczy sprawa?', 'Czy sprawa jest już w sądzie?'] },
				{ id: 'PYTANIA', typ: 'wiele', tytul: 'Które pytania dodać?', gdy: branza(['fizjo']), opcje: ['Czy to pierwsza wizyta?'] },
				{ id: 'PYTANIA_WLASNE', typ: 'akapit', tytul: 'Twoje pytania', pomoc: 'Każde w osobnej linii, najlepiej z odpowiedziami do wyboru.' },
				{ id: 'TELEFON_POLE', typ: 'jeden', tytul: 'Numer telefonu klienta w formularzu', opcje: [{ w: 'opcjonalny', t: 'Może podać' }, { w: 'wymagany', t: 'Musi podać' }, { w: 'brak', t: 'Bez telefonu' }] },
			],
		},
		{
			tytul: 'Powiadomienia i Kalendarz Google',
			pytania: [
				{ id: 'EMAIL_POWIADOMIENIA', typ: 'email', tytul: 'Na jaki e-mail mają przychodzić powiadomienia o rezerwacjach?', wymagane: true },
				{ id: 'GOOGLE', typ: 'jeden', tytul: 'Czy chcesz widzieć rezerwacje w Kalendarzu Google?', wymagane: true,
					opcje: [{ w: 'tak', t: 'Tak, używam Kalendarza Google' }, { w: 'nie', t: 'Nie, wystarczą e-maile' }] },
				{ id: 'GOOGLE_KONTO', typ: 'email', tytul: 'Adres konta Google z kalendarzem', gdy: { GOOGLE: ['tak'] }, wymagane: true,
					pomoc: 'Na tym koncie pokażę w filmie, jak udostępnić kalendarz. Nie podajesz mi hasła.' },
				{ id: 'ARKUSZ', typ: 'jeden', tytul: 'Kopia rezerwacji w arkuszu Google?', gdy: { GOOGLE: ['tak'] }, opcje: ['Tak', 'Nie'] },
			],
		},
	],
};

// ---------------------------------------------------------------- 4. uwagi do szkicu

const szkic = {
	id: 'szkic',
	nazwa: 'Uwagi do szkicu',
	czas: 'ok. 20 minut',
	pola: POLA,
	wstep: 'Najlepiej obejrzyj szkic na telefonie i na komputerze, a potem wypisz uwagi w jednym miejscu.',
	wyslij: 'Wyślij uwagi',
	prywatnosc: PRYWATNOSC,
	dziekuje: { naglowek: 'Dziękuję! Uwagi dotarły.', tekst: 'Wprowadzę je i dam znać na {email}, gdy poprawiony szkic będzie gotowy.' },
	potwierdzenie: { temat: 'Uwagi do szkicu dotarły', tekst: 'Dziękuję. Poniżej kopia Twoich uwag.' },
	kroki: [
		{
			tytul: 'Szkic',
			pytania: [
				FIRMA, EMAIL(),
				{ id: 'RUNDA', typ: 'jeden', tytul: 'Która to runda poprawek?', z_adresu: 'runda', opcje: [{ w: '1', t: 'Pierwsza' }, { w: '2', t: 'Druga' }] },
			],
		},
		{
			tytul: 'Uwagi',
			pytania: [
				{ id: 'OCENA', typ: 'jeden', tytul: 'Jak oceniasz szkic?', wymagane: true,
					opcje: [{ w: 'ok', t: 'Akceptuję bez zmian' }, { w: 'drobne', t: 'Drobne poprawki' }, { w: 'wieksze', t: 'Większe zmiany' }] },
				{ id: 'POPRAWKI', typ: 'akapit', tytul: 'Wypisz poprawki', gdy: { OCENA: ['drobne', 'wieksze'] }, wymagane: true,
					pomoc: 'Każda w osobnej linii: gdzie (sekcja albo cytat) i co zmienić. Np. „O mnie, 2. zdanie: zamiast 10 lat napisz 12 lat”.' },
				{ id: 'DANE_OK', typ: 'jeden', tytul: 'Dane firmy w stopce i w polityce prywatności', wymagane: true, opcje: ['Są poprawne', 'Trzeba poprawić'] },
				{ id: 'DANE_POPRAWKI', typ: 'akapit', tytul: 'Co poprawić w danych?', gdy: { DANE_OK: ['Trzeba poprawić'] }, wymagane: true },
				{ id: 'TELEFON_TEST', typ: 'jeden', tytul: 'Szkic na telefonie', opcje: ['Wszystko czytelne', 'Są uwagi (wpisane wyżej)', 'Jeszcze nie sprawdzony'] },
				{ id: 'INFO_ZAKRES', typ: 'info', pomoc: 'Zmiany poza zakresem z umowy wyceniam osobno, zanim zacznę pracę.' },
				{ id: 'UWAGI', typ: 'akapit', tytul: 'Coś jeszcze?' },
			],
		},
	],
};

// ---------------------------------------------------------------- 5. odbiór strony

const odbior = {
	id: 'odbior',
	nazwa: 'Odbiór strony',
	czas: 'ok. 10 minut',
	pola: POLA,
	wstep: 'Zanim strona pójdzie w świat, sprawdź ją tak, jak zrobi to Twój klient.',
	wyslij: 'Wyślij',
	prywatnosc: PRYWATNOSC,
	dziekuje: { naglowek: 'Dziękuję!', tekst: 'Jeśli odbiór jest potwierdzony, wyślę rachunek na płatność końcową. Po wpłacie publikuję stronę i przesyłam instrukcję.' },
	potwierdzenie: { temat: 'Odbiór strony: odpowiedzi dotarły', tekst: 'Dziękuję. Poniżej kopia Twoich odpowiedzi.' },
	kroki: [
		{
			tytul: 'Sprawdzenie',
			pytania: [
				FIRMA, EMAIL(),
				{ id: 'SPRAWDZONE', typ: 'wiele', tytul: 'Co już jest sprawdzone?', wymagane: true,
					opcje: ['Strona na telefonie', 'Strona na komputerze', 'Próbna rezerwacja z własnym e-mailem', 'E-mail z potwierdzeniem rezerwacji', 'Rezerwacja w Kalendarzu Google', 'Dane firmy w stopce', 'Polityka prywatności i regulamin'] },
				{ id: 'UWAGI', typ: 'akapit', tytul: 'Uwagi przed publikacją', pomoc: 'Jeśli wszystko działa, zostaw puste.' },
				{ id: 'ODBIOR', typ: 'jeden', tytul: 'Odbiór', wymagane: true,
					opcje: [{ w: 'tak', t: 'Potwierdzam odbiór, strona może iść w świat po płatności końcowej' }, { w: 'poprawki', t: 'Najpierw poprawki z uwag wyżej' }] },
			],
		},
		{
			tytul: 'Realizacje',
			pytania: [
				{ id: 'REALIZACJE', typ: 'jeden', tytul: 'Czy mogę pokazać Twoją stronę w moich realizacjach?', wymagane: true,
					opcje: ['Tak, z nazwą firmy', 'Tak, bez nazwy firmy', 'Nie'] },
			],
		},
	],
};

// ---------------------------------------------------------------- 6. po 30 dniach

const po30 = {
	id: 'po-30-dniach',
	nazwa: 'Po 30 dniach',
	czas: 'ok. 5 minut',
	pola: POLA,
	wstep: 'Minął miesiąc od startu strony. Kilka pytań o to, jak działa.',
	wyslij: 'Wyślij',
	prywatnosc: PRYWATNOSC,
	dziekuje: { naglowek: 'Dziękuję!', tekst: 'Twoje odpowiedzi pomagają mi robić lepsze strony. Podsumowanie z liczbami wyślę na {email}.' },
	kroki: [
		{
			tytul: 'Liczby',
			pytania: [
				FIRMA, EMAIL(),
				{ id: 'REZERWACJE', typ: 'liczba', tytul: 'Ile osób umówiło się przez stronę w pierwszych 30 dniach?', podpowiedz: 'np. 6', max: 10000,
					pomoc: 'Liczbę znajdziesz w panelu Rezerwacje.' },
				{ id: 'KLIENCI_ZE_STRONY', typ: 'liczba', tytul: 'Ile z nich zostało klientami?', podpowiedz: 'np. 2', max: 10000 },
				{ id: 'TELEFONY', typ: 'jeden', tytul: 'Telefonów w trakcie pracy jest', opcje: ['Mniej', 'Tyle samo', 'Więcej', 'Trudno powiedzieć'] },
			],
		},
		{
			tytul: 'Opinia',
			pytania: [
				{ id: 'DZIALA', typ: 'akapit', tytul: 'Co działa najlepiej?' },
				{ id: 'POPRAWIC', typ: 'akapit', tytul: 'Co poprawić?' },
				{ id: 'POLECENIE', typ: 'skala', tytul: 'Jak bardzo prawdopodobne jest, że polecisz mnie znajomemu?', wymagane: true },
				{ id: 'OPINIA', typ: 'akapit', tytul: 'Opinia do pokazania na mojej stronie', pomoc: '2–3 zdania: co było przed stroną i co się zmieniło.' },
				{ id: 'OPINIA_ZGODA', typ: 'jeden', tytul: 'Jak podpisać opinię?', gdy: { OPINIA: ['*'] }, wymagane: true,
					opcje: ['Imieniem, nazwiskiem i nazwą firmy', 'Samym imieniem', 'Nie publikuj'] },
				{ id: 'POLECENIA', typ: 'akapit', tytul: 'Kogo z Twojego otoczenia mogę zapytać o stronę?',
					pomoc: 'Np. 2 osoby: imię i branża. Napiszę dopiero wtedy, gdy je uprzedzisz.' },
			],
		},
	],
};

module.exports = Object.fromEntries(Object.entries({ wycena, materialy, kalendarz, szkic, odbior, po30 }).map(([k, v]) => [k, popraw(v)]));

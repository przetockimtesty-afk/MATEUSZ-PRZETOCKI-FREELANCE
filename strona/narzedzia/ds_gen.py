import json, os, sys
S = sys.argv[1]
P = os.path.join(S, 'project')
icons = json.load(open(os.path.join(S, 'icons.json'), encoding='utf-8'))
tpl = open(os.path.join(S, 'src', 'bundle.template.js'), encoding='utf-8').read()
js = tpl.replace('__ICONS__', json.dumps(icons, ensure_ascii=False))
assert '</script' not in js.lower() and '<!--' not in js
open(os.path.join(P, 'components', 'bundle.js'), 'w', encoding='utf-8').write(js)

def doc(group, height, body, width=None):
    w = f' width={width}' if width else ''
    return (f'<!-- @dsCard group="{group}" height={height}{w} -->\n<!doctype html>\n<html lang="pl">\n<head><meta charset="utf-8"><title>podgląd</title></head>\n'
            f'<body>\n<div id="root"></div>\n<script>\n  var M = window.MP, h = React.createElement;\n{body}\n</script>\n</body>\n</html>\n')

R = "  ReactDOM.createRoot(document.getElementById('root')).render("
pad = "{ style: { padding: '24px' } }"
comps = {}
comps['Button'] = ('Akcje', 200, None, R + f"""h('div', null,
    h('div', {{ className: 'mp-actions', style: {{ padding: '24px' }} }}, h(M.Button, {{ arrow: true }}, 'Wyceń stronę w 5\\u00a0minut'), h(M.Button, {{ variant: 'outline' }}, 'Zobacz demo'), h(M.Button, {{ size: 'sm' }}, 'Wyceń stronę')),
    h('div', {{ className: 'mp-dark mp-actions', style: {{ padding: '24px' }} }}, h(M.Button, {{ variant: 'accent', arrow: true }}, 'Wyceń stronę w 5\\u00a0minut'), h(M.Button, {{ variant: 'outline-light' }}, 'Wolisz porozmawiać? Umów 30\\u00a0minut'))));""",
 """Przycisk do jednej czynności, w kształcie pigułki, zawsze z czasownikiem na początku.

- `primary` (czarny) na jasnym tle, `accent` (błękitny) tylko na czerni; obok nich drugi przycisk `outline` albo `outline-light`.
- Główna czynność całej strony to „Wyceń stronę w 5 minut” z `arrow`; drugi przycisk to „Zobacz demo” albo „Umów 30 minut”.
- Pod głównym przyciskiem w pierwszym ekranie podpis „Bez zobowiązań · propozycja w 48 h” w stylu `podpis`.
- `size="sm"` tylko w menu i stopce; `full` na telefonie i w kartach pakietów.
- Nie stawiasz dwóch przycisków `primary` obok siebie ani przycisku `accent` na jasnym tle.
- Podajesz `href`, gdy przycisk prowadzi do ankiety, kalendarza albo podstrony; wtedy renderuje się link.""")
comps['ArrowLink'] = ('Akcje', 154, None, R + """h('div', null,
    h('div', { style: { padding: '24px' } }, h(M.ArrowLink, null, 'Zobacz, co jest w każdym pakiecie')),
    h('div', { className: 'mp-dark', style: { padding: '24px' } }, h(M.ArrowLink, null, 'Jak pracuję'))));""",
 """Link tekstowy ze strzałką, prowadzący do podstrony, która rozwija temat.

- Opisowe słowa zamiast „kliknij tutaj”: „Zobacz, co jest w każdym pakiecie”, „Strona dla doradców kredytowych”, „Więcej o mnie”.
- Na czerni (kontener `mp-dark`) link sam przechodzi na `blekit`.
- Najwyżej jeden link ze strzałką na kartę i 2–3 na końcu podstrony, w bloku „Następny krok”.""")
comps['Eyebrow'] = ('Tekst', 96, None, R + """h('div', { style: { padding: '24px', display: 'grid', gap: '18px' } },
    h(M.Eyebrow, null, 'Strony dla specjalistów, którzy umawiają konsultacje'),
    h(M.Eyebrow, { dot: false }, '01 · Finanse')));""",
 """Nadtytuł nad nagłówkiem sekcji: krótki opis tematu wielkimi literami z błękitną kropką.

- Styl `nadtytul`, kolor `grafit`; na czerni `szary-na-czerni`.
- Bez kropki (`dot={false}`) jako numer i kategoria na karcie branży: „01 · Finanse”.
- Najwyżej 6 słów; nie powtarza nagłówka pod nim.""")
comps['Accent'] = ('Tekst', 228, 1000, R + """h('div', null,
    h('h1', { style: { margin: 0, padding: '28px 24px', font: '600 64px/1.05 var(--font-naglowki)', letterSpacing: '-0.02em' } }, 'Klienci umawiają się ', h(M.Accent, null, 'sami.')),
    h('div', { className: 'mp-dark', style: { padding: '28px 24px' } }, h('h2', { style: { margin: 0, font: '600 44px/1.1 var(--font-naglowki)', letterSpacing: '-0.02em' } }, 'Od ankiety do ', h(M.Accent, null, 'gotowej'), ' strony'))));""",
 """Jedno słowo akcentu w dużym nagłówku, pisane Instrument Serif kursywą.

- Tylko w `h1`, `h2` i w końcowej karcie z wezwaniem; nigdy w tekście, przyciskach ani etykietach.
- Jedno słowo na nagłówek, to, które niesie sens: „Klienci umawiają się *sami*.”, „Trzy kroki, *zero* telefonów”.
- Na czerni (kontener `mp-dark`) słowo przechodzi na `blekit`; na jasnym tle zostaje w `czern`.""")
comps['Tag'] = ('Tekst', 80, None, R + """h('div', { className: 'mp-tags', style: { padding: '24px' } },
    h(M.Tag, null, 'kalendarz'), h(M.Tag, null, 'formularz analizy'), h(M.Tag, { tone: 'sand' }, 'Projekt demonstracyjny'), h(M.Tag, { tone: 'black' }, 'Polecam'), h(M.Tag, { tone: 'outline' }, 'Domena i dane są Twoje')));""",
 """Etykieta w kształcie pigułki: funkcja strony, oznaczenie przykładu albo wyróżnienie.

- `blue` (domyślnie, `blekit-jasny`) dla funkcji na kartach branż i realizacji: „kalendarz”, „formularz analizy”.
- `sand` tylko dla „Projekt demonstracyjny”; `black` tylko dla „Polecam” na polecanym pakiecie; `outline` dla zasad w O mnie.
- Najwyżej 3 etykiety na kartę, małymi literami, bez kropek na końcu.""")
icon_cells = ",\n    ".join([f"h('div', {{ key: '{n}', style: {{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--grafit)' }} }}, h(M.Icon, {{ name: '{n}' }}), '{n}')" for n in icons])
comps['Icon'] = ('Ikony', 330, 1000, R + f"""h('div', {{ style: {{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '22px 12px' }} }},
    {icon_cells}));""",
 """Ikony Lucide w kresce 1,5 px, 24 px, w kolorze tekstu.

- Na jasnym tle w `czern`, na czerni (kontener `mp-dark`) w `blekit`.
- Ikona stoi zawsze obok podpisu, który mówi to samo; samodzielna ikona dostaje `label`.
- Zestaw: strzałka, check, plus i minus, menu, kalendarz, lista, dymek z pytaniem, lupa, tarcza, odświeżanie, koło ratunkowe, paragon, osoba, zdjęcie, poczta, wideo, zegar, dokument, glob, laptop, telefon.
- Bez emoji i bez ikon w innym stylu.""")
comps['IconCircle'] = ('Ikony', 96, None, R + """h('div', { style: { padding: '24px', display: 'flex', gap: '16px' } },
    h(M.IconCircle, { name: 'calendar-check' }), h(M.IconCircle, { name: 'clipboard-list' }), h(M.IconCircle, { name: 'message-circle-question' }), h(M.IconCircle, { name: 'search' })));""",
 """Ikona w kółku 48 px z tłem `blekit-jasny`, nad tytułem karty korzyści.

- Jedna na kartę, nad tytułem `h3`.
- Na czerni nie używasz kółka: ikona stoi sama, w `blekit`.""")
comps['Card'] = ('Karty', 280, None, R + """h('div', { style: { padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' } },
    h(M.Card, null, h(M.IconCircle, { name: 'calendar-check' }), h('h3', { className: 'mp-card-title', style: { marginTop: '26px' } }, 'Klient umawia się sam'), h('p', { className: 'mp-card-text', style: { margin: 0 } }, 'Kalendarz konsultacji w 2 kliknięciach i potwierdzenie e-mailem.')),
    h(M.Card, { tone: 'dashed' }, h('h3', { className: 'mp-card-title' }, 'Nie widzisz swojej branży?'), h('p', { className: 'mp-card-text', style: { margin: 0 } }, 'Napisz, sprawdzę, czy to dla Ciebie.'))));""",
 """Biała karta z ramką 1 px w kolorze `linia` i zaokrągleniem `zaokraglenie-karta`, bez cienia.

- Wnętrze `odstep-32`; tytuł w klasie `mp-card-title`, opis w `mp-card-text`.
- `tone="sand"` na kremowym tle, gdy karta ma się odróżnić bez ramki; `tone="dashed"` dla karty zaproszenia, np. „Nie widzisz swojej branży?”.
- Karty w siatce mają odstęp 20 px i równą wysokość.""")
comps['BranchCard'] = ('Karty', 380, 1120, R + """h('div', { style: { padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', background: 'var(--piasek)' } },
    h(M.BranchCard, { number: '01', category: 'Finanse', title: 'Doradcy kredytowi', text: 'Klient z polecenia szuka Cię wieczorem. Formularz wstępnej analizy i kalendarz sprawiają, że umawia się od razu.', tags: ['formularz analizy', 'kalendarz', 'informacje KNF'], linkLabel: 'Strona dla doradców kredytowych' }),
    h(M.BranchCard, { number: '02', category: 'Księgowość', title: 'Biura rachunkowe', text: 'W sezonie PIT telefon dzwoni bez przerwy. Strona odpowiada na stałe pytania, a nowy klient sam umawia rozmowę.', tags: ['pytania o KSeF', 'umawianie rozmów'], linkLabel: 'Strona dla biur rachunkowych' }),
    h(M.BranchCard, { number: '03', category: 'Terapia', title: 'Psycholodzy i terapeuci', text: 'Pierwszy telefon do terapeuty bywa trudny. Spokojna strona z kalendarzem pozwala umówić się bez rozmowy.', tags: ['podejście', 'wizyty online', 'kalendarz'], linkLabel: 'Strona dla psychologów' })));""",
 """Karta branży: numer i kategoria, nazwa branży, jedno zdanie o problemie klienta, etykiety funkcji i link do strony branżowej.

- Podajesz `number` („01”), `category` („Finanse”), `title`, `text` (do 2 zdań), `tags` (do 3) i `linkLabel` z pełną nazwą branży: „Strona dla doradców kredytowych”.
- Na stronie głównej i w Dla kogo: 3 karty w rzędzie na tle `piasek`, a pod nimi karta zaproszenia (`Card tone="dashed"`) na całą szerokość.
- Gdy strony branżowej jeszcze nie ma, link prowadzi do ankiety albo do opisu przykładu.""")
comps['PackageCard'] = ('Karty', 668, 1120, R + """h('div', { style: { padding: '40px 24px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'stretch' } },
    h(M.PackageCard, { name: 'Wizytówka', price: '1\\u00a0200', forWhom: 'Gdy wystarczy, że klient Cię znajdzie i napisze.', items: ['Jedna strona, 6 sekcji, wersja na telefon', 'Formularz z potwierdzeniem dla klienta', 'Podstawy SEO, polityka prywatności, informacje formalne'] }),
    h(M.PackageCard, { name: 'Wizytówka, która umawia', price: '1\\u00a0800', recommended: true, forWhom: 'Gdy chcesz mniej telefonów i krótsze pierwsze rozmowy.', includesPrevious: true, items: ['Formularz wstępnych pytań i kalendarz konsultacji', 'Odpowiedzi na najczęstsze pytania i miejsce na opinie', 'Profil Firmy w Google, gdy firma spełnia wytyczne'] }),
    h(M.PackageCard, { name: 'Pełny start', price: '2\\u00a0500', forWhom: 'Gdy chcesz od razu zbierać opinie i kontakty.', includesPrevious: true, items: ['Film powitalny 60 s i poradnik PDF dla klientów', 'System próśb o opinie: karta z kodem QR, SMS, e-mail'] })));""",
 """Karta pakietu z ceną, zdaniem „dla kogo”, listą zawartości i przyciskiem do ankiety.

- Trzy karty w rzędzie, środkowa `recommended` („Wizytówka, która umawia”): tło `blekit-jasny`, czarna ramka i etykieta „Polecam” na górnej krawędzi. Na telefonie polecany pakiet idzie pierwszy.
- `price` z twardą spacją („1 800”), waluta osobno w `currency`; ceny pakietów są stałe, bez „od”.
- Pakiet 2 i 3 zaczynają listę od `includesPrevious`: „Wszystko z poprzedniego pakietu, plus:”.
- Przycisk: w polecanej karcie `primary` ze strzałką, w pozostałych `outline`; zawsze „Wyceń stronę w 5 minut”.
- Pod kartami jedna linijka o domenie i hostingu: „pierwszy rok ok. 55–75 zł netto, potem ok. 320–370 zł netto rocznie”.""")
comps['TrustBar'] = ('Sekcje', 84, 1120, R + """h(M.TrustBar, { items: [{ icon: 'shield-check', label: 'Domena i strona są Twoje' }, { icon: 'refresh-cw', label: '2 rundy poprawek' }, { icon: 'life-buoy', label: '30 dni wsparcia po starcie' }, { icon: 'receipt', label: 'Faktura bez VAT' }] }));""",
 """Czarny pasek zaufania pod pierwszym ekranem: cztery konkrety z ikonami.

- Zawsze cztery krótkie punkty, które klient sprawdzi w umowie: „Domena i strona są Twoje”, „2 rundy poprawek”, „30 dni wsparcia po starcie”, „Faktura bez VAT”.
- Zastępuje pas logotypów: bez logotypów firm i bez liczb, których nie da się sprawdzić.
- Na telefonie punkty układają się 2 × 2.""")
comps['ProcessStep'] = ('Sekcje', 272, 1120, R + """h('div', { className: 'mp-dark', style: { padding: '8px 40px 40px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '28px' } },
    h(M.ProcessStep, { number: '1', title: 'Ankieta, 5\\u00a0minut', text: 'Pytania o Twoją firmę i klientów. Bez telefonu.' }),
    h(M.ProcessStep, { number: '2', title: 'Propozycja w 48\\u00a0h', text: 'Jednostronicowa, na piśmie: pakiet, cena i termin.' }),
    h(M.ProcessStep, { number: '3', title: 'Szkic w 5 dni roboczych', text: 'Z krótkim filmem i 2 rundami poprawek.' }),
    h(M.ProcessStep, { number: '4', title: 'Start i 30 dni wsparcia', text: 'Publikacja, instrukcja i nagranie dla Ciebie.' })));""",
 """Krok procesu na czarnym pasie: duża cyfra Instrument Serif w `blekit`, tytuł i jedno zdanie.

- Cztery kroki w rzędzie, od ankiety do startu, rozdzielone liniami `linia-ciemna`; na telefonie jeden pod drugim.
- Tytuł z czasem, który klient zna z góry: „Propozycja w 48 h”, „Szkic w 5 dni roboczych”.
- Używasz tylko w kontenerze `mp-dark` (sekcja Jak pracuję).""")
comps['FaqItem'] = ('Sekcje', 324, None, R + """h('div', { style: { padding: '8px 24px 24px', borderTop: '0' } },
    h(M.FaqItem, { open: true, question: 'Ile to kosztuje?', answer: 'Pakiety kosztują 1\\u00a0200, 1\\u00a0800 albo 2\\u00a0500 zł. Łączną kwotę z ewentualnymi dodatkami dostajesz na piśmie w 48 godzin od ankiety.' }),
    h(M.FaqItem, { question: 'Czy muszę rozmawiać przez telefon?' }),
    h(M.FaqItem, { question: 'Kto jest właścicielem domeny i strony?' })));""",
 """Rozwijane pytanie z odpowiedzią, oddzielone cienką linią `linia`.

- Pytanie słowami klienta, odpowiedź w 2–3 zdaniach Twoimi słowami, z linkiem do strony, która rozwija temat.
- Odpowiedź z linkiem podajesz jako treść komponentu (ma pierwszeństwo przed `answer`); sam tekst może iść w `answer`.
- Pierwsze pytanie na liście jest otwarte (`open`).
- Działa bez skryptu (element details); plus zamienia się w minus po rozwinięciu.""")
comps['CtaBand'] = ('Sekcje', 448, 1120, R + """h('div', { style: { padding: '24px' } }, h(M.CtaBand, { text: '5 minut pytań, jednostronicowa propozycja w 48 godzin. Wypełnienie do niczego nie zobowiązuje.', primaryLabel: 'Wyceń stronę w 5\\u00a0minut', secondaryLabel: 'Wolisz porozmawiać? Umów 30\\u00a0minut' }, 'Sprawdź, ile kosztowałaby ', h(M.Accent, null, 'Twoja'), ' strona')));""",
 """Czarna zaokrąglona karta z wezwaniem na końcu strony głównej i podstron, na kremowym tle.

- Nagłówek podajesz jako treść komponentu, z jednym słowem w `Accent` (na czerni w `blekit`); sam tekst bez akcentu może iść w `title`.
- Pod nagłówkiem jedno zdanie (`text`) i dwa przyciski: `accent` do ankiety (`primaryHref`) i `outline-light` do rozmowy (`secondaryHref`).
- Jedna na stronę, tuż nad stopką; nie zastępuje paska z przyciskiem na telefonie.""")
comps['Logo'] = ('Strona', 154, None, R + """h('div', null,
    h('div', { style: { padding: '24px' } }, h(M.Logo, null)),
    h('div', { className: 'mp-dark', style: { padding: '24px' } }, h(M.Logo, null))));""",
 """Logo: imię i nazwisko w stylu `logo` z kropką w `blekit`.

- W menu i stopce zawsze ten komponent albo plik `assets/Logo/logo-mateusz-przetocki.svg` (na czerni `logo-mateusz-przetocki-na-czerni.svg`).
- Bez znaku graficznego obok; monogram „MP” tylko jako ikona karty w przeglądarce.""")
comps['SiteHeader'] = ('Strona', 170, 1280, R + """h('div', null,
    h(M.SiteHeader, null),
    h('div', { style: { height: '24px' } }),
    h('div', { style: { width: '390px', border: '1px solid var(--linia)' } }, h(M.SiteHeader, { compact: true }))));""",
 """Menu strony: logo, pięć pozycji i przycisk do ankiety; na telefonie logo i przycisk menu.

- Pozycje: Dla kogo (rozwijane: branże), Oferta (rozwijane: Pakiety i ceny, Jak pracuję, Pytania), Realizacje, O mnie, Kontakt; przycisk „Wyceń stronę”.
- Bieżąca podstrona dostaje `current`.
- Poniżej 641 px menu samo pokazuje logo i przycisk menu, a przycisk ankiety przechodzi do `MobileCtaBar` na dole ekranu; `compact` wymusza tę wersję na każdej szerokości.
- Na komputerze menu przykleja się u góry i po przewinięciu dostaje cienką linię u dołu.
- Linki podajesz w `items[].href`, logo w `logoHref`, przycisk w `buttonHref`.""")
comps['SiteFooter'] = ('Strona', 438, 1280, R + """h(M.SiteFooter, null));""",
 """Czarna stopka: oferta w jednym zdaniu z przyciskiem, pakiety z cenami, branże, skróty i dane z ustawy.

- Cztery kolumny; pod nimi linia `linia-ciemna`, imię i nazwisko, adres z danych z ustawy, e-mail, polityka prywatności i regulamin.
- Adres i e-mail podajesz w `legal`; ceny pakietów z twardą spacją.
- Pozycje kolumn i linki prawne mogą być tekstem albo `{ label, href }`; przycisk prowadzi do ankiety (`buttonHref`).
- Na telefonie dwie kolumny.""")
comps['Breadcrumbs'] = ('Strona', 72, None, R + """h('div', { style: { padding: '24px' } }, h(M.Breadcrumbs, { items: [{ label: 'Strona główna', href: '#' }, { label: 'Dla kogo', href: '#' }, 'Doradcy kredytowi'] })));""",
 """Okruszki nad tytułem podstrony: droga od strony głównej do bieżącej.

- Na każdej podstronie oprócz strony głównej, nad nadtytułem i nagłówkiem: „Strona główna › Dla kogo › Doradcy kredytowi”.
- Ostatnia pozycja to bieżąca strona, bez linku; pozostałe to linki `{ label, href }`.
- Styl 14 px w `grafit`, linki w `czern` z podkreśleniem.""")
comps['MobileCtaBar'] = ('Strona', 120, 390, R + """h('div', { style: { height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' } }, h(M.MobileCtaBar, null)));""",
 """Czarny pasek z błękitnym przyciskiem ankiety, przyklejony do dołu ekranu na telefonie.

- Stawiasz go raz, na końcu treści strony; widać go tylko poniżej 641 px, na komputerze się nie pokazuje.
- Zawsze „Wyceń stronę w 5 minut” (`label` zmieniasz tylko w teście nagłówków) i link do ankiety w `href`.
- Na stronie z kontaktem i na stronach prawnych go nie ma.""")
comps['PhoneFrame'] = ('Strona', 530, None, R + """h('div', { style: { padding: '24px', display: 'flex', gap: '28px', alignItems: 'flex-end' } },
    h(M.PhoneFrame, { width: 236 }, h('div', { style: { padding: '14px' } }, h('div', { style: { font: '600 18px/1.2 var(--font-naglowki)', marginBottom: '6px' } }, 'Umów konsultację'), h('div', { style: { color: 'var(--grafit)', fontSize: '12px', marginBottom: '14px' } }, '30 minut · online albo w biurze'), h(M.Button, { size: 'sm', full: true }, 'Wybierz termin'))),
    h(M.PhoneFrame, { width: 150, height: 300 }, h('div', { style: { padding: '10px', fontSize: '11px' } }, h('div', { style: { font: '600 13px/1.15 var(--font-naglowki)' } }, 'Kredyt bez stresu, z jednym doradcą'))),
    h(M.PhoneFrame, { width: 150, height: 300, demo: false }, h('div', { style: { padding: '40px 12px 0', color: 'var(--grafit)', fontSize: '11px' } }, 'Bez paska demo: strona prawdziwej klientki.'))));""",
 """Czarna ramka telefonu na zrzuty i ekrany dema; obramowanie i wycięcie skalują się z szerokością.

- Każdy zrzut dema w tej ramce, z paskiem „Projekt demonstracyjny” u góry ekranu (domyślnie; w ramce węższej niż 200 px pasek mówi „Demo”); strona prawdziwej klientki bez paska (`demo={false}`).
- Szerokość 300 px w pierwszym ekranie, 236 px w Jak to wygląda, 150 px obok laptopa w Realizacjach; wysokość wynika z proporcji telefonu albo z `height`.
- Do środka wkładasz zrzut (`img`) albo prosty ekran z komponentów systemu.""")
comps['LaptopFrame'] = ('Strona', 250, None, R + """h('div', { style: { padding: '24px', maxWidth: '560px' } }, h(M.LaptopFrame, null, h('div', { style: { padding: '22px', display: 'grid', gap: '10px' } }, h('div', { style: { font: '600 22px/1.1 var(--font-naglowki)', letterSpacing: '-0.02em' } }, 'Kredyt bez stresu, z jednym doradcą'), h('div', { style: { height: '8px', width: '80%', borderRadius: '4px', background: 'var(--piasek)' } }), h('div', { style: { height: '8px', width: '60%', borderRadius: '4px', background: 'var(--piasek)' } }), h('div', null, h(M.Button, { size: 'sm' }, 'Umów konsultację'))))));""",
 """Ramka laptopa na zrzut strony z komputera: czarny prostokąt z zaokrągleniem `zaokraglenie-maly`.

- Zrzut dema zawsze z paskiem „Projekt demonstracyjny” (domyślnie); strona prawdziwej klientki bez paska (`demo={false}`).
- Zajmuje całą szerokość rodzica; w Realizacjach stoi obok `PhoneFrame` o szerokości 150 px, który zachodzi na jej prawy dolny róg.
- Do środka wkładasz zrzut (`img` na całą szerokość) albo uproszczony ekran z komponentów systemu.""")

for name, (group, height, width, body, readme) in [(k, v if len(v) == 5 else (v[0], v[1], v[2], v[3], v[4])) for k, v in comps.items()]:
    d = os.path.join(P, 'components', name); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'preview.html'), 'w', encoding='utf-8').write(doc(group, height, body, width))
    open(os.path.join(d, 'README.md'), 'w', encoding='utf-8').write(f'# {name}\n\n{readme}\n')
print('komponentów:', len(comps), '; bundle.js', os.path.getsize(os.path.join(P, 'components', 'bundle.js')), 'B')

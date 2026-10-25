/**
 * Ankieta Google → gotowa prezentacja na rozmowę i szkic propozycji.
 *
 * Co robi:
 * 1. setup() tworzy dwie ankiety Google (A „Konsultacja”, B „Wycena”), arkusz z odpowiedziami,
 *    folder na Dysku, szablony propozycji w Google Docs i automat, który działa po każdej wysłanej
 *    ankiecie. Linki (także linki do ankiet z wpisanym źródłem: strona, polecenie, e-mail…) przychodzą mailem.
 * 2. Po każdej odpowiedzi automat kopiuje szablon prezentacji (Google Slides) i szablon propozycji
 *    (Google Docs), wpisuje w pola {{…}} dane z ankiety, ostrożnie liczy koszt problemu, pomija puste slajdy
 *    i wysyła Ci mail z linkami, wskazówkami i szkicem podsumowania.
 * 3. Od 25.10.2026 główna ankieta wyceny jest na stronie (wtyczka MP Ankiety, /wycena/). Strona wysyła odpowiedź
 *    do doPost (aplikacja internetowa), a ta robi to samo co ankiety Google: prezentację i szkic propozycji.
 *    Ankiety Google A i B zostają jako zapasowe.
 *
 * Jak uruchomić krok po kroku: automatyzacja/INSTRUKCJA.md.
 */

// ===================== USTAWIENIA: uzupełnij przed uruchomieniem setup =====================
const USTAWIENIA = {
  // Link do szablonu A „Konsultacja”: plik .pptx na Dysku albo Prezentacja Google.
  szablonA: 'WKLEJ_TUTAJ_LINK_DO_SZABLONU_A',
  // Link do szablonu B „Wycena”: plik .pptx na Dysku albo Prezentacja Google.
  szablonB: 'WKLEJ_TUTAJ_LINK_DO_SZABLONU_B',
  // Dokąd wysyłać linki do gotowych prezentacji. Puste = adres Twojego konta Google.
  email: '',
  // Podpis pod propozycją, np. 'Mateusz Przetocki · e-mail · telefon · mateuszprzetocki.pl'.
  podpis: 'Mateusz Przetocki · mateuszprzetocki.pl',
  // Link do polityki prywatności na Twojej stronie; pojawi się w opisie ankiety. Puste = bez linku.
  politykaPrywatnosci: '',
  // Ceny trzech wariantów w szkicu propozycji (zł). Zmieniasz je tutaj, gdy zmienia się cennik.
  ceny: {A: [1200, 1800, 2500], B: [1600, 2500, 3400]},
  // Domena i hosting, które klient opłaca sam u dostawcy, w zł netto: [od, do] za pierwszy rok i za każdy kolejny.
  // Np. hosting LH.pl Orange albo Kiwi: 50–60 zł, potem 199–249 zł; domena .pl: 5–15 zł, potem ok. 120 zł.
  utrzymanie: {pierwszyRok: [55, 75], kolejneLata: [320, 370]},
  // Folder na Dysku Google na ankiety, arkusz, szablony i gotowe pliki.
  folder: 'Ankiety i prezentacje klientów',
  strefaCzasowa: 'Europe/Warsaw',
};
// ==========================================================================================

const DNI = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];
const MINUTY_ROZMOWY = {'do 15 minut': 10, '15–30 minut': 25, '30–60 minut': 45, 'ponad godzinę': 75};
const GODZINY_WYCEN = {'do 1 godziny': 1, '1–3 godziny': 2, '3–5 godzin': 4, 'ponad 5 godzin': 6};
const BUDZETY = ['do 1 500 zł', '1 500–3 000 zł', 'powyżej 3 000 zł', 'nie wiem'];
const ZRODLA = ['Ze strony internetowej', 'Z polecenia', 'Z mojej wiadomości e-mail', 'Z Useme albo ogłoszenia',
  'Z mediów społecznościowych'];
const NAGLOWKI = ['Data', 'Wersja', 'Firma', 'E-mail klienta', 'Źródło', 'Prezentacja', 'Szkic propozycji'];
const DOPLATA_BEZ_STRONY = 500; // B bez strony: mini-strona z konfiguracją hostingu i domeny (sekcja 23)
const UTRZYMANIE_DOMYSLNE = {pierwszyRok: [55, 75], kolejneLata: [320, 370]}; // gdy w USTAWIENIA nie ma „utrzymanie”
const VAT = 0.23;
// Koszt problemu liczony ostrożnie: strona odzyskuje co trzecią osobę, która dziś się nie umawia
// (w badaniach 30–45% rezerwacji przypada poza godzinami pracy, źródła w zrodlaKosztu).
const ODZYSK = 1 / 3;
// Gdy klient nie podał, ilu umówionych zostaje klientami (A) albo ile zapytań kończy się zleceniem (B).
const SKUTECZNOSC_ZALOZONA = 0.25;
// Podnieś o 1 po zmianie PROPOZYCJA: setup zrobi nowe szablony, a stare dostaną dopisek „(stara wersja)”.
const WERSJA_PROPOZYCJI = 2;

const WSTEP = 'Około 5 minut. Na podstawie odpowiedzi przygotuję propozycję na jednej stronie. ' +
  'Wystarczą przybliżone liczby, a pytania bez gwiazdki można pominąć. ' +
  'Wypełnienie do niczego nie zobowiązuje. Odpowiedzi widzę tylko ja i wykorzystuję je wyłącznie ' +
  'do przygotowania propozycji i ewentualnej rozmowy.';
const POTWIERDZENIE = 'Dziękuję! Odpowiedzi dotarły. Odezwę się w ciągu 48 godzin z propozycją ' +
  'albo pytaniem o termin rozmowy.';

const POCZATEK = [
  {sekcja: 'O firmie'},
  {id: 'FIRMA', typ: 'tekst', tytul: 'Nazwa firmy albo imię i nazwisko', wymagane: true},
  {id: 'EMAIL', typ: 'email', tytul: 'E-mail do kontaktu', wymagane: true},
  {id: 'DATA', typ: 'data', tytul: 'Dzień naszej rozmowy, jeśli jest już ustalony', pomoc: 'Można pominąć.'},
];

const KONIEC = [
  {id: 'ZRODLO', typ: 'jeden', tytul: 'Skąd Państwo o mnie wiedzą?', opcje: ZRODLA, inne: true},
];

const ANKIETY = {
  A: {
    plik: 'Ankieta A · Konsultacja',
    tytul: 'Kilka pytań o Państwa firmę',
    pytania: POCZATEK.concat([
      {sekcja: 'Klienci'},
      {id: 'SKAD', typ: 'wiele', tytul: 'Skąd przychodzili klienci w ostatnich 3 miesiącach?',
        pomoc: 'Proszę zaznaczyć wszystko, co pasuje. Nie potrzebuję żadnych danych klientów.',
        opcje: ['Polecenia', 'Google', 'Sieć, z którą współpracuję', 'Media społecznościowe'], inne: true, wymagane: true},
      {id: 'PYTA', typ: 'liczba', tytul: 'Ile osób miesięcznie pyta o konsultację?', pomoc: 'Wystarczy w przybliżeniu, np. 12.', wymagane: true},
      {id: 'UMAWIA', typ: 'liczba', tytul: 'Ile z nich się umawia?', pomoc: 'Też w przybliżeniu, np. 7.', wymagane: true},
      {id: 'KLIENCI', typ: 'liczba', tytul: 'Ile z umówionych osób zostaje klientami?',
        pomoc: 'Miesięcznie, w przybliżeniu, np. 3. Jeśli trudno powiedzieć, proszę zostawić puste.'},
      {id: 'HISTORIA', typ: 'akapit', tytul: 'Ostatnia osoba, która się odezwała, ale się nie umówiła: co się wtedy stało?',
        pomoc: 'Krótki opis, bez nazwisk.'},
      {sekcja: 'Pierwszy kontakt'},
      {id: 'PRZESZKADZA', typ: 'akapit', tytul: 'Co w kontakcie z nowymi klientami jest najbardziej męczące albo zabiera najwięcej czasu?',
        pomoc: 'Jednym zdaniem, np. „telefony w trakcie spotkań” albo „ciągle te same pytania”.', wymagane: true},
      {id: 'ROZMOWA', typ: 'jeden', tytul: 'Ile trwa pierwsza rozmowa z nowym klientem?', opcje: Object.keys(MINUTY_ROZMOWY)},
      {id: 'FAQ', typ: 'akapit', tytul: 'Jakie pytania klienci zadają najczęściej przed pierwszym spotkaniem?',
        pomoc: 'Wystarczy kilka. Z odpowiedzi powstanie FAQ na stronę.'},
      {id: 'INFO', typ: 'akapit', tytul: 'Jakie informacje trzeba zebrać, zanim da się ocenić sytuację klienta?',
        pomoc: 'Np. dochód w przedziałach, rodzaj umowy, wkład własny. Z tego powstanie formularz wstępnej analizy.'},
      {sekcja: 'Cel i start'},
      {id: 'CEL', typ: 'akapit', tytul: 'Po czym za trzy miesiące będzie widać, że współpraca była warta zachodu?',
        pomoc: 'Jednym zdaniem, np. „połowa konsultacji umawia się sama”.', wymagane: true},
      {id: 'KWOTA', typ: 'liczba', tytul: 'Ile mniej więcej przynosi jeden klient (w złotych)?',
        pomoc: 'Wystarczy średnia, np. 3000. Jeśli wolą Państwo nie podawać, proszę zostawić puste.'},
      {id: 'SIEC', typ: 'jeden', tytul: 'Forma działalności', opcje: ['Agent sieci', 'Działalność samodzielna'], inne: true,
        pomoc: 'Jeśli sieć ma zasady dotyczące własnej strony, proszę je krótko opisać w „Inne”.'},
      {id: 'GOTOWE', typ: 'wiele', tytul: 'Co już jest gotowe?',
        opcje: ['Zdjęcie portretowe', 'Logo', 'Opinie w Google', 'Własna domena', 'Strona internetowa', 'Nic z tych rzeczy']},
      {id: 'STRONA', typ: 'tekst', tytul: 'Adres obecnej strony albo profilu, jeśli jest'},
      {id: 'KIEDY', typ: 'tekst', tytul: 'Na kiedy potrzebna jest strona i dlaczego wtedy?'},
      {id: 'BUDZET', typ: 'jeden', tytul: 'Budżet', opcje: BUDZETY},
    ]).concat(KONIEC),
  },
  B: {
    plik: 'Ankieta B · Wycena',
    tytul: 'Kilka pytań o Państwa firmę',
    pytania: POCZATEK.concat([
      {sekcja: 'Zapytania i wyceny'},
      {id: 'SKAD', typ: 'wiele', tytul: 'Skąd przychodzą zapytania?', pomoc: 'Proszę zaznaczyć wszystko, co pasuje.',
        opcje: ['Telefon', 'Messenger albo WhatsApp', 'Formularz na stronie', 'Portal z ogłoszeniami', 'Polecenia', 'Stali klienci'],
        inne: true, wymagane: true},
      {id: 'ZAPYTANIA', typ: 'liczba', tytul: 'Ile zapytań o cenę przychodzi w tygodniu?', pomoc: 'W przybliżeniu, np. 10.', wymagane: true},
      {id: 'ZLECENIA', typ: 'liczba', tytul: 'Ile z nich kończy się zleceniem?', pomoc: 'W przybliżeniu, np. 4.'},
      {id: 'PRZEPADA', typ: 'liczba', tytul: 'Ile razy w zeszłym tygodniu telefon został bez odpowiedzi, bo trwało zlecenie?',
        pomoc: 'W przybliżeniu. Jeśli ani razu, proszę wpisać 0.', wymagane: true},
      {id: 'HISTORIA', typ: 'akapit', tytul: 'Ostatnie zapytanie, które przepadło: co się wtedy stało?', pomoc: 'Krótki opis, bez nazwisk.'},
      {id: 'PRZESZKADZA', typ: 'akapit', tytul: 'Co w wycenach zabiera najwięcej czasu albo nerwów?',
        pomoc: 'Jednym zdaniem, np. „wieczory nad wycenami w wiadomościach”.'},
      {id: 'GODZ', typ: 'jeden', tytul: 'Ile czasu w tygodniu zajmują wyceny w wiadomościach i przez telefon?', opcje: Object.keys(GODZINY_WYCEN)},
      {sekcja: 'Cena'},
      {id: 'ELEMENTY', typ: 'wiele', tytul: 'Co trzeba wiedzieć, żeby podać cenę?', pomoc: 'Proszę zaznaczyć wszystko, co pasuje.',
        opcje: ['Wymiary albo metraż', 'Liczba sztuk', 'Rodzaj materiału', 'Stopień zabrudzenia', 'Piętro i winda', 'Dojazd', 'Zdjęcia'],
        inne: true, wymagane: true},
      {id: 'CENNIK', typ: 'akapit', tytul: 'Jakie usługi są wyceniane najczęściej i w jakich cenach?', pomoc: 'Wystarczy roboczy cennik, nawet w punktach.'},
      {id: 'DOPLATY', typ: 'akapit', tytul: 'Minimalne zlecenie, dopłaty i rabaty',
        pomoc: 'Np. „minimum 200 zł, dojazd poza miasto 2 zł/km, piętro bez windy +30 zł”.'},
      {id: 'KWOTA', typ: 'liczba', tytul: 'Ile mniej więcej wynosi przeciętne zlecenie (w złotych)?', pomoc: 'Wystarczy średnia, np. 350. Można zostawić puste.'},
      {sekcja: 'Cel i start'},
      {id: 'CEL', typ: 'akapit', tytul: 'Po czym za trzy miesiące będzie widać, że współpraca była warta zachodu?',
        pomoc: 'Jednym zdaniem, np. „zgłoszenia przychodzą z kalkulatora, od razu z wyceną”.', wymagane: true},
      {id: 'TERMINY', typ: 'akapit', tytul: 'Jak są dziś umawiane terminy, ile trwa jedno zlecenie i gdzie mają trafiać zgłoszenia?'},
      {id: 'OPINIE', typ: 'tekst', tytul: 'Ile jest opinii w Google i jak firma o nie prosi?'},
      {id: 'GOTOWE', typ: 'wiele', tytul: 'Co już jest gotowe?',
        opcje: ['Strona internetowa', 'Własna domena', 'Profil Firmy w Google', 'Zdjęcia przed i po', 'Nic z tych rzeczy']},
      {id: 'STRONA', typ: 'tekst', tytul: 'Adres obecnej strony albo profilu, jeśli jest'},
      {id: 'KIEDY', typ: 'tekst', tytul: 'Na kiedy, przed którym sezonem?'},
      {id: 'BUDZET', typ: 'jeden', tytul: 'Budżet', opcje: BUDZETY},
    ]).concat(KONIEC),
  },
};

// Szkic propozycji na jednej stronie (8 bloków z sekcji 17 drogowskazu). Setup robi z tego szablony
// w Google Docs. Szablon możesz potem poprawiać w Dokumentach; pola {{…}} wypełnia automat.
// Po zmianie w tym miejscu podnieś WERSJA_PROPOZYCJI, żeby setup zrobił nowe szablony.
const ROZLICZENIE = 'Rozliczenie do wyboru: faktura bez VAT (działalność nierejestrowana, Mateusz Przetocki) ' +
  'albo faktura VAT przez serwis Useme, wtedy do ceny dochodzi 23% VAT.';
const UTRZYMANIE = 'Domena i hosting na Państwa firmę, płatne bezpośrednio u dostawcy: {{UTRZYMANIE}} ' +
  '(z 23% VAT: {{UTRZYMANIE_VAT}}). Propozycja ważna 14 dni.';
const NASTEPNY_KROK = 'Proszę odpisać numer wariantu. W ciągu doby wyślę umowę i dane do zadatku. Jeśli wolą Państwo ' +
  'omówić propozycję, zadzwonię na 15 minut o wybranej porze.';
const POLECAM = 'Polecam wariant 2, bo rozwiązuje cały problem z punktu 1, bez dodatków, których na start nie potrzeba. ' +
  'Za {{CENA2}} dostają Państwo:';
const POZOSTALE = 'Wariant 1 to mniejszy zakres, a wariant 3 to wariant 2 z dodatkami (tabela niżej).';
const CEL_I_KOSZT = [
  {naglowek: '2. Cel i miara sukcesu'},
  {tekst: 'Cel: {{CEL_ZD}}'},
  {tekst: '{{PUNKT_WYJSCIA}}'},
  {tekst: '{{MIARA}}'},
  {tekst: '{{KOSZT_AKAPIT}}'},
  {tekst: '{{KOSZT_ZRODLA}}', przypis: true},
];

const PROPOZYCJA = {
  A: [
    {tytul: 'Propozycja: strona, która umawia konsultacje'},
    {tekst: 'dla: {{FIRMA}} · {{DATA_PROPOZYCJI}} · ważna do {{WAZNA_DO}}'},
    {naglowek: '1. Sytuacja (czy dobrze rozumiem?)'},
    {tekst: '{{SYTUACJA}}'},
    {tekst: 'Jeśli coś się nie zgadza, proszę o krótką poprawkę w odpowiedzi.'},
  ].concat(CEL_I_KOSZT, [
    {naglowek: '3. Rozwiązanie, które polecam: wariant 2 „Wizytówka, która umawia”'},
    {tekst: POLECAM},
    {lista: [
      'Stronę jednostronicową: zdjęcie, 3 kroki współpracy, opinie i FAQ z najczęstszych pytań klientów',
      'Formularz wstępnej analizy: przedziały kwot, bez numeru PESEL i skanów',
      'Kalendarz konsultacji w 2 kliknięciach i potwierdzenie e-mailem',
      'Zakładkę „Informacje formalne”',
      'Profil Firmy w Google z linkiem do umawiania (jeśli firma spełnia wytyczne Google)',
    ]},
    {tekst: POZOSTALE},
    {naglowek: '4. Trzy warianty'},
    {tabela: [
      ['Wariant', 'Dla kogo', 'Cena'],
      ['1. Wizytówka', 'Gdy wystarczy, że klient znajdzie i napisze (bez formularza analizy i kalendarza)', '{{CENA1}}'],
      ['2. Wizytówka, która umawia (polecam)', 'Gdy chcą Państwo mniej telefonów i krótsze pierwsze rozmowy: wszystko z punktu 3', '{{CENA2}}'],
      ['3. Pełny start', 'Wariant 2 + film powitalny 60 s, system opinii, poradnik PDF', '{{CENA3}}'],
    ], wyroznij: 2},
    {naglowek: '5. Harmonogram'},
    {tekst: 'Szkic w 5 dni roboczych od zadatku i materiałów. Publikacja do {{PUBLIKACJA}}, jeśli zadatek i materiały dotrą do {{MATERIALY_DO}}.'},
    {naglowek: '6. Czego potrzebuję od Państwa'},
    {tekst: 'Zdjęcie portretowe, dane formalne (od sieci, jeśli Państwo w niej działają), informacja, gdzie jest domena ' +
      '(albo jej założenie na Państwa firmę według mojej instrukcji) i ok. 20 minut na uwagi do szkicu. Treści piszę na podstawie ankiety.'},
    {naglowek: '7. Warunki'},
    {tekst: 'Zadatek 40% ({{ZADATEK}} przy wariancie 2), reszta przed publikacją. 2 rundy poprawek. ' +
      'Prawa do grafik i treści po pełnej zapłacie. 30 dni wsparcia po starcie.'},
    {tekst: ROZLICZENIE},
    {tekst: UTRZYMANIE},
    {naglowek: '8. Następny krok'},
    {tekst: NASTEPNY_KROK},
    {tekst: '{{PODPIS}}'},
  ]),
  B: [
    {tytul: 'Propozycja: strona, która wycenia i przyjmuje zgłoszenia'},
    {tekst: 'dla: {{FIRMA}} · {{DATA_PROPOZYCJI}} · ważna do {{WAZNA_DO}}'},
    {naglowek: '1. Sytuacja (czy dobrze rozumiem?)'},
    {tekst: '{{SYTUACJA}}'},
    {tekst: 'Jeśli coś się nie zgadza, proszę o krótką poprawkę w odpowiedzi.'},
  ].concat(CEL_I_KOSZT, [
    {naglowek: '3. Rozwiązanie, które polecam: wariant 2 „Strona, która wycenia”'},
    {tekst: POLECAM},
    {lista: [
      'Kalkulator według Państwa cennika: klient od razu widzi cenę orientacyjną (elementy ceny: {{ELEMENTY_PELNE}})',
      'Zgłoszenie z terminem i zdjęciami oraz potwierdzenie e-mailem dla klienta',
      'Pełną specyfikację zgłoszenia na Państwa e-mail, bez dopytywania',
      'Zdjęcia przed i po, opinie i obszar dojazdu',
      'Profil Firmy w Google z linkiem do wyceny',
    ]},
    {tekst: POZOSTALE},
    {naglowek: '4. Trzy warianty'},
    {tabela: [
      ['Wariant', 'Dla kogo', 'Cena'],
      ['1. {{WARIANT1}}', '{{WARIANT1_DLA}}', '{{CENA1}}'],
      ['2. Strona, która wycenia (polecam)', 'Wszystko z punktu 3: klient z Google sam wycenia i zamawia', '{{CENA2}}'],
      ['3. Pełny start', 'Wariant 2 + 4 rolki „przed i po” i powiadomienia SMS o zgłoszeniach', '{{CENA3}}'],
    ], wyroznij: 2},
    {naglowek: '5. Harmonogram'},
    {tekst: 'Szkic w 5 dni roboczych od zadatku i materiałów. Publikacja do {{PUBLIKACJA}}, jeśli zadatek i materiały dotrą do {{MATERIALY_DO}}.'},
    {naglowek: '6. Czego potrzebuję od Państwa'},
    {tekst: 'Aktualny cennik z dopłatami i minimum, 6–10 zdjęć przed i po, informacja, gdzie jest strona i domena, ' +
      'oraz ok. 20 minut na uwagi do szkicu. Treści piszę na podstawie ankiety.'},
    {naglowek: '7. Warunki'},
    {tekst: 'Zadatek 40% ({{ZADATEK}} przy wariancie 2), reszta przed publikacją. 2 rundy poprawek. Prawa do grafik i treści ' +
      'po pełnej zapłacie, silnik kalkulatora na licencji dla Państwa firmy. 30 dni wsparcia po starcie.'},
    {tekst: ROZLICZENIE},
    {tekst: UTRZYMANIE},
    {naglowek: '8. Następny krok'},
    {tekst: NASTEPNY_KROK},
    {tekst: '{{PODPIS}}'},
  ]),
};

// Szablony prezentacji z poprzedniej wersji: setup podmienia te teksty, żeby nie trzeba było eksportować prezentacji jeszcze raz.
// Slajd „Koszt problemu”: cały tekst kształtu → nowy tekst.
const NOWY_SLAJD_KOSZTU = {
  A: {
    '{{ILE}}': '{{STRATY}}',
    'tyle osób miesięcznie pyta i się nie umawia': 'tyle osób w roku pyta i się nie umawia',
    '{{KWOTA}}': '{{SZANSA}}',
    'średnio z jednego klienta': 'szansa, że zostanie klientem: strona umówi co trzecią osobę, a klientami zostaje {{SKUTECZNOSC}} umówionych',
    '{{MIES}}': '{{NOWI}}',
    'miesięcznie, czyli {{ROK}} rocznie': 'tylu nowych klientów rocznie, czyli {{ROK}} przy {{KWOTA}} z jednego klienta',
  },
  B: {
    '{{ILE}}': '{{STRATY}}',
    'tyle zapytań miesięcznie przepada, bo nikt nie odebrał': 'tyle telefonów w roku zostaje bez odpowiedzi',
    '{{KWOTA}}': '{{SZANSA}}',
    'średnia wartość zlecenia': 'szansa na zlecenie: strona przejmie co trzecie zapytanie, a zleceniem kończy się {{SKUTECZNOSC}} zapytań',
    '{{MIES}}': '{{NOWI}}',
    'miesięcznie, czyli {{ROK}} rocznie': 'tyle dodatkowych zleceń rocznie, czyli {{ROK}} przy {{KWOTA}} za zlecenie',
  },
};
// Pozostałe slajdy: dokładne zdania zamieniane w całym szablonie.
const NOWE_ZDANIA = [
  ['Na Państwa firmę, płatne u dostawcy, ok. 150–400 zł rocznie.', 'Na Państwa firmę, płatne u dostawcy: {{UTRZYMANIE}}.'],
  ['Na Państwa firmę, płatne u dostawcy: pierwszy rok ok. 55–75 zł netto, potem ok. 320–370 zł netto rocznie.',
    'Na Państwa firmę, płatne u dostawcy: {{UTRZYMANIE}}.'],
  ['„Ile osób w miesiącu odzywa się do Pani w sprawie konsultacji? A ile z nich się umawia?”',
    '„Ile osób w miesiącu odzywa się do Pani w sprawie konsultacji? Ile z nich się umawia, a ile zostaje klientami?”'],
  ['dwie przybliżone liczby. Różnica to osoby, które przepadają: z niej liczysz koszt problemu.',
    'trzy przybliżone liczby. Różnica pierwszych dwóch to osoby, które przepadają, a trzecia mówi, ilu umówionych zostaje klientami: z tego liczysz koszt problemu.'],
  ['dwie przybliżone liczby. Różnica to zapytania, które przepadają (tydzień razy 4 to miesiąc).',
    'dwie przybliżone liczby: druga przez pierwszą to skuteczność. Dopytaj: „Ile telefonów w zeszłym tygodniu zostało bez odpowiedzi?” Z tego liczysz koszt problemu.'],
];

// ===================== Uruchamiasz ręcznie =====================

/**
 * Uruchom raz, a potem po każdej zmianie kodu. Tworzy albo aktualizuje ankiety, arkusz, folder,
 * szablony i automat. Ponowne uruchomienie nie tworzy duplikatów, tylko dopisuje to, czego brakuje.
 */
function setup() {
  const szA = idPliku(USTAWIENIA.szablonA);
  const szB = idPliku(USTAWIENIA.szablonB);
  if (!szA || !szB) {
    throw new Error('Najpierw wklej linki do szablonów A i B w USTAWIENIA na górze pliku i zapisz projekt.');
  }

  const props = PropertiesService.getScriptProperties();
  const folder = folderRoboczy();
  // Szablon musi być Prezentacją Google. Plik PowerPoint (.pptx) skrypt sam zamienia na kopię w formacie Google.
  const szablony = {A: szablonGoogle(szA, 'A', folder), B: szablonGoogle(szB, 'B', folder)};
  const slajdy = {A: aktualizujSzablonPrezentacji(szablony.A, 'A'), B: aktualizujSzablonPrezentacji(szablony.B, 'B')};
  const stare = {A: props.getProperty('PROPOZYCJA_A'), B: props.getProperty('PROPOZYCJA_B')};
  const propozycje = {A: szablonPropozycji('A', folder), B: szablonPropozycji('B', folder)};
  const nowePropozycje = ['A', 'B'].some(w => stare[w] && stare[w] !== propozycje[w]);

  let arkusz = otworzJesliJest(props.getProperty('ARKUSZ'), id => SpreadsheetApp.openById(id));
  if (!arkusz) {
    arkusz = SpreadsheetApp.create('Ankiety: odpowiedzi, prezentacje i propozycje');
    DriveApp.getFileById(arkusz.getId()).moveTo(folder);
    arkusz.getSheets()[0].setName('Prezentacje');
    props.setProperty('ARKUSZ', arkusz.getId());
  }
  const log = arkusz.getSheetByName('Prezentacje') || arkusz.insertSheet('Prezentacje');
  // Arkusz z poprzedniej wersji miał link do prezentacji w kolumnie E: robimy miejsce na „Źródło”.
  if (log.getRange(1, 5).getValue() === 'Prezentacja') log.insertColumnBefore(5);
  log.getRange(1, 1, 1, NAGLOWKI.length).setValues([NAGLOWKI]);

  // Automat zakładamy od nowa, żeby nigdy nie działał podwójnie.
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  arkuszZeStrony();
  ScriptApp.newTrigger('porzadekZeStrony').timeBased().everyDays(1).atHour(3).create();
  if (log.getParent().getSheetByName(ARKUSZ_ZE_STRONY).getDataRange().getValues().some(w => w[5] === 'czeka')) zaplanujZeStrony();

  const linki = {};
  ['A', 'B'].forEach(w => {
    let form = otworzJesliJest(props.getProperty('FORM_' + w), id => FormApp.openById(id));
    if (form) {
      uzupelnijAnkiete(form, w); // dopisuje nowe pytania (np. „Skąd Państwo o mnie wiedzą?”) i teksty
    } else {
      form = utworzAnkiete(w);
      form.setDestination(FormApp.DestinationType.SPREADSHEET, arkusz.getId());
      DriveApp.getFileById(form.getId()).moveTo(folder);
      props.setProperty('FORM_' + w, form.getId());
    }
    ScriptApp.newTrigger('poWyslaniu').forForm(form).onFormSubmit().create();
    linki[w] = {dlaKlienta: krotkiLink(form, form.getPublishedUrl()), edycja: form.getEditUrl(), zrodla: linkiZrodel(form)};
  });

  wyslijLinki(linki, arkusz, folder, szablony, propozycje, {slajdy: slajdy, nowePropozycje: nowePropozycje});
  Logger.log('Gotowe. Ankieta A: %s · Ankieta B: %s', linki.A.dlaKlienta, linki.B.dlaKlienta);
}

/** Tworzy prezentacje i propozycje jeszcze raz z ostatnich odpowiedzi w obu ankietach (np. po poprawce szablonu). */
function utworzZOstatnichOdpowiedzi() {
  const props = PropertiesService.getScriptProperties();
  ['A', 'B'].forEach(w => {
    const id = props.getProperty('FORM_' + w);
    if (!id) return;
    const form = FormApp.openById(id);
    const wszystkie = form.getResponses();
    if (!wszystkie.length) return;
    const ostatnia = wszystkie[wszystkie.length - 1];
    const linki = utworzPrezentacje(w, odpowiedzi(id, ostatnia), ostatnia.getTimestamp());
    Logger.log('Wersja %s: %s · %s', w, linki.prezentacja, linki.propozycja);
  });
}

// ===================== Automat (uruchamia się sam) =====================

/** Wyzwalacz: po każdej wysłanej ankiecie A albo B. */
function poWyslaniu(e) {
  try {
    const props = PropertiesService.getScriptProperties();
    const formId = e.source.getId();
    const wersja = formId === props.getProperty('FORM_A') ? 'A' : formId === props.getProperty('FORM_B') ? 'B' : null;
    if (!wersja) return;
    utworzPrezentacje(wersja, odpowiedzi(formId, e.response), e.response.getTimestamp());
  } catch (err) {
    MailApp.sendEmail(adres(), 'Automat ankieta → prezentacja: błąd',
      'Prezentacja nie powstała.\n\n' + err + '\n\n' + (err && err.stack ? err.stack : ''));
    throw err;
  }
}

function utworzPrezentacje(wersja, o, kiedy) {
  const props = PropertiesService.getScriptProperties();
  const dane = policz(wersja, o, kiedy);
  const t = dane.tokeny;
  const folder = folderRoboczy();
  const klucze = Object.keys(t);

  // Prezentacja (Google Slides)
  const szablon = DriveApp.getFileById(props.getProperty('SZABLON_' + wersja) ||
    idPliku(wersja === 'A' ? USTAWIENIA.szablonA : USTAWIENIA.szablonB));
  const kopia = szablon.makeCopy('Rozmowa ' + wersja + ' · ' + t.FIRMA + ' · ' + t.DATA, folder);
  const pres = SlidesApp.openById(kopia.getId());
  klucze.forEach(k => pres.replaceAllText('{{' + k + '}}', t[k], false));
  pres.getSlides().forEach(slajd => {
    const notatki = slajd.getNotesPage().getSpeakerNotesShape();
    if (notatki) klucze.forEach(k => notatki.getText().replaceAllText('{{' + k + '}}', t[k], false));

    const tekst = tekstSlajdu(slajd).toLowerCase();
    if (tekst.indexOf('tylko dla ciebie') !== -1) pomin(slajd); // ściągi: zostają w pliku, nie w pokazie
    else if (tekst.indexOf('koszt problemu') !== -1 && tekst.indexOf('ile kosztuje') !== -1 &&
      (!dane.koszt || tekst.indexOf('{{') !== -1)) pomin(slajd); // bez liczb albo slajd ze starego szablonu
    else if (tekst.indexOf('[nazwa projektu]') !== -1) pomin(slajd); // przykład z portfolio, którego jeszcze nie uzupełniłeś
  });
  pres.saveAndClose();

  // Szkic propozycji (Google Docs)
  const propozycja = utworzPropozycje(wersja, t, folder);

  const linki = {prezentacja: kopia.getUrl(), propozycja: propozycja};
  const arkusz = SpreadsheetApp.openById(props.getProperty('ARKUSZ'));
  const log = arkusz.getSheetByName('Prezentacje') || arkusz.insertSheet('Prezentacje');
  log.appendRow([data(kiedy || new Date(), 'yyyy-MM-dd HH:mm'), wersja, t.FIRMA, t.EMAIL, t.ZRODLO, linki.prezentacja, linki.propozycja]);

  MailApp.sendEmail({
    to: adres(),
    subject: 'Gotowe: prezentacja i szkic propozycji · ' + t.FIRMA + ' (' + wersja + ')',
    htmlBody: trescMaila(wersja, dane, o, linki, arkusz.getUrl()),
  });
  return linki;
}

function utworzPropozycje(wersja, t, folder) {
  const kopia = DriveApp.getFileById(szablonPropozycji(wersja, folder)).makeCopy('Propozycja ' + wersja + ' · ' + t.FIRMA + ' · ' + t.DATA_PROPOZYCJI, folder);
  const doc = DocumentApp.openById(kopia.getId());
  wstawWDokumencie(doc.getBody(), t);
  doc.saveAndClose();
  return kopia.getUrl();
}

/** Zamienia odpowiedzi z ankiety na teksty, które trafiają w pola {{…}} prezentacji i propozycji. */
function policz(w, o, kiedy) {
  const t = {};
  const dzien = dzienRozmowy(o.DATA, kiedy);
  const decyzja = dniRobocze(dzien, 3);
  const dzienPropozycji = dniRobocze(dzien, 1);
  const materialyDo = dniRobocze(dzienPropozycji, 5);
  const ceny = (USTAWIENIA.ceny && USTAWIENIA.ceny[w]) || [0, 0, 0];
  const gotowe = lista(o.GOTOWE);
  const maStrone = gotowe.indexOf('Strona internetowa') !== -1 || /\.[a-z]{2,}/i.test(tekst(o.STRONA));

  t.FIRMA = tekst(o.FIRMA) || 'Twoja firma';
  t.EMAIL = tekst(o.EMAIL) || '—';
  t.ZRODLO = tekst(o.ZRODLO) || '—';
  t.DATA = data(dzien, 'dd.MM.yyyy');
  t.TERMIN = data(dzienPropozycji, 'dd.MM') + ', 18:00';
  t.DECYZJA = DNI[decyzja.getDay()] + ', ' + data(decyzja, 'dd.MM');
  t.SKAD = przytnij(lista(o.SKAD).join(', '), 70) || '—';
  t.CEL = przytnij(tekst(o.CEL), 85) || '—';
  t.CEL_PELNY = tekst(o.CEL) || '—';
  t.CEL_ZD = zdanie(o.CEL) || '—';
  t.PRZESZKADZA = przytnij(tekst(o.PRZESZKADZA), 85) || '—';
  t.PRZESZKADZA_PELNE = tekst(o.PRZESZKADZA) || '—';
  ['HISTORIA', 'FAQ', 'INFO', 'SIEC', 'STRONA', 'KIEDY', 'BUDZET', 'CENNIK', 'DOPLATY', 'TERMINY', 'OPINIE']
    .forEach(k => { t[k] = tekst(o[k]) || '—'; });
  t.GOTOWE = gotowe.join(', ') || '—';

  const kwota = liczba(o.KWOTA);
  let ile = null;          // A: osoby, które pytają i się nie umawiają; B: telefony bez odpowiedzi (miesięcznie)
  let skutecznosc = null;  // A: część umówionych, która zostaje klientami; B: część zapytań, która kończy się zleceniem
  let godz = null;
  let sytuacja = [];
  const punkt = [];
  let miara = '';
  if (w === 'A') {
    const pyta = liczba(o.PYTA);
    const umawia = liczba(o.UMAWIA);
    const klienci = liczba(o.KLIENCI);
    t.PYTA = pyta === null ? '—' : liczbaTekst(pyta);
    t.UMAWIA = umawia === null ? '—' : liczbaTekst(umawia);
    t.KLIENCI = klienci === null ? '—' : liczbaTekst(klienci);
    if (pyta !== null && umawia !== null) ile = Math.max(pyta - umawia, 0);
    if (klienci !== null && umawia) skutecznosc = Math.min(klienci / umawia, 1);
    const minuty = MINUTY_ROZMOWY[tekst(o.ROZMOWA)];
    if (minuty && pyta) godz = minuty * pyta / 4.33 / 60; // rozmowy w miesiącu → godziny w tygodniu
    sytuacja = [
      lista(o.SKAD).length ? 'Skąd przychodzą klienci: ' + lista(o.SKAD).join(', ') + '.' : '',
      pyta !== null ? 'Zapytania o konsultację w miesiącu: ' + t.PYTA + (umawia !== null ? ', umówione konsultacje: ' + t.UMAWIA : '') +
        (klienci !== null ? ', nowi klienci: ' + t.KLIENCI : '') + '.' : '',
      tekst(o.PRZESZKADZA) ? 'Najbardziej przeszkadza: ' + cytat(o.PRZESZKADZA) + '.' : '',
      tekst(o.HISTORIA) ? 'Ostatnia osoba, która się nie umówiła: ' + cytat(o.HISTORIA) + '.' : '',
    ];
    if (pyta && umawia !== null) {
      punkt.push('umówione konsultacje ' + t.UMAWIA + ' z ' + t.PYTA + ' zapytań miesięcznie (' + procent(umawia / pyta) + ')');
      if (skutecznosc !== null) punkt.push('nowi klienci ' + t.KLIENCI + ' z ' + t.UMAWIA + ' umówionych (' + procent(skutecznosc) + ')');
      if (ile >= 1) {
        const cel = Math.min(pyta, umawia + Math.max(1, Math.round(ile * ODZYSK)));
        miara = 'Miara sukcesu po 3 miesiącach od startu: umówione konsultacje co najmniej ' + liczbaTekst(cel) + ' z ' + t.PYTA +
          ' zapytań miesięcznie (' + procent(cel / pyta) + '), część bez telefonu, przez kalendarz na stronie.';
      }
    }
    if (!miara) miara = 'Miara sukcesu: pierwsze konsultacje umówione przez stronę w ciągu 30 dni od startu.';
  } else {
    const zapytania = liczba(o.ZAPYTANIA);
    const zlecenia = liczba(o.ZLECENIA);
    const przepada = liczba(o.PRZEPADA);
    t.ZAPYTANIA = zapytania === null ? '—' : liczbaTekst(zapytania);
    t.ZLECENIA = zlecenia === null ? '—' : liczbaTekst(zlecenia);
    t.PRZEPADA = przepada === null ? '—' : liczbaTekst(przepada);
    if (przepada !== null) ile = przepada * 4; // tydzień → miesiąc
    if (zlecenia !== null && zapytania) skutecznosc = Math.min(zlecenia / zapytania, 1);
    const elementy = lista(o.ELEMENTY).map(malaLitera);
    t.ELEMENTY = przytnij(elementy.join(', '), 80) || 'np. metraż, liczba sztuk, dojazd';
    t.ELEMENTY_PELNE = elementy.join(', ') || 'według Państwa cennika';
    godz = GODZINY_WYCEN[tekst(o.GODZ)] || null;
    sytuacja = [
      lista(o.SKAD).length ? 'Skąd przychodzą zapytania: ' + lista(o.SKAD).join(', ') + '.' : '',
      zapytania !== null ? 'Zapytania o cenę w tygodniu: ' + t.ZAPYTANIA + (zlecenia !== null ? ', zlecenia: ' + t.ZLECENIA : '') +
        (przepada !== null ? ', telefony bez odpowiedzi w zeszłym tygodniu: ' + t.PRZEPADA : '') + '.' : '',
      elementy.length ? 'Do wyceny potrzebne są: ' + elementy.join(', ') + '.' : '',
      tekst(o.PRZESZKADZA) ? 'Najbardziej przeszkadza: ' + cytat(o.PRZESZKADZA) + '.' : '',
      tekst(o.HISTORIA) ? 'Ostatnie zapytanie, które przepadło: ' + cytat(o.HISTORIA) + '.' : '',
    ];
    if (skutecznosc !== null) punkt.push('zlecenia ' + t.ZLECENIA + ' z ' + t.ZAPYTANIA + ' zapytań tygodniowo (' + procent(skutecznosc) + ')');
    if (przepada !== null) punkt.push('telefony bez odpowiedzi w zeszłym tygodniu: ' + t.PRZEPADA);
    if (ile >= 1) {
      const zgloszenia = Math.max(1, Math.round(ile * ODZYSK));
      miara = 'Miara sukcesu po 3 miesiącach od startu: co najmniej ' + liczbaTekst(zgloszenia) + ' ' +
        odmiana(zgloszenia, 'zgłoszenie', 'zgłoszenia', 'zgłoszeń') + ' miesięcznie z kalkulatora, z pełną wyceną, bez telefonu.';
    } else {
      miara = 'Miara sukcesu: zgłoszenia z kalkulatora z pełną specyfikacją w ciągu 30 dni od startu.';
    }
  }
  t.SYTUACJA = sytuacja.filter(Boolean).join(' ') || '—';
  t.PUNKT_WYJSCIA = punkt.length ? 'Punkt wyjścia: ' + punkt.join(', ') + '.' : '';
  t.MIARA = miara + (miara.indexOf('po 3 miesiącach') !== -1 ? ' Sprawdzamy to razem po 30 dniach i po 3 miesiącach.' : '');

  // Koszt problemu, liczony ostrożnie, tak samo na slajdzie i w propozycji: osoby (telefony) w roku
  // × co trzecia wraca przez stronę × skuteczność klienta (albo założenie) = nowi klienci (zlecenia) rocznie.
  const zalozona = skutecznosc === null;
  const sk = zalozona ? SKUTECZNOSC_ZALOZONA : skutecznosc;
  const ileRok = ile === null ? null : ile * 12;
  const klienciRok = ileRok && kwota ? Math.floor(ileRok * ODZYSK * sk + 1e-9) : 0;
  const koszt = kwota !== null && kwota > 0 && klienciRok >= 1;
  t.STRATY = ileRok === null ? '—' : liczbaTekst(ileRok);
  t.SKUTECZNOSC = procent(sk) + (zalozona ? ' (założenie)' : '');
  t.SZANSA = procent(ODZYSK * sk);
  t.NOWI = koszt ? liczbaTekst(klienciRok) : '—';
  t.KWOTA = kwota === null ? '—' : zlote(kwota);
  t.ROK = koszt ? zlote(klienciRok * kwota) : '—';
  t.GODZ = godz ? godzinyTekst(godz) : 'dodatkowe godziny';

  // Propozycja: warianty, ceny, daty, utrzymanie, podpis
  const cena1 = ceny[0] + (w === 'B' && !maStrone ? DOPLATA_BEZ_STRONY : 0);
  t.CENA1 = zlote(cena1);
  t.CENA2 = zlote(ceny[1]);
  t.CENA3 = zlote(ceny[2]);
  t.ZADATEK = zlote(ceny[1] * 0.4);
  t.WARIANT1 = w === 'B' && !maStrone ? 'Mini-strona z kalkulatorem' : 'Kalkulator na obecnej stronie';
  t.WARIANT1_DLA = w === 'B' && !maStrone
    ? 'Pierwszy ekran, kalkulator, opinie i kontakt, z konfiguracją hostingu i domeny'
    : 'Gdy strona już jest: kalkulator i zgłoszenie z terminem, według Państwa cennika';
  t.DATA_PROPOZYCJI = data(dzienPropozycji, 'dd.MM.yyyy');
  t.WAZNA_DO = data(new Date(dzienPropozycji.getTime() + 14 * 86400000), 'dd.MM.yyyy');
  t.MATERIALY_DO = data(materialyDo, 'dd.MM.yyyy');
  t.PUBLIKACJA = data(dniRobocze(materialyDo, 10), 'dd.MM.yyyy');
  t.PODPIS = USTAWIENIA.podpis || 'Mateusz Przetocki';
  const utrzymanie = USTAWIENIA.utrzymanie || UTRZYMANIE_DOMYSLNE;
  t.UTRZYMANIE = 'pierwszy rok ok. ' + zakres(utrzymanie.pierwszyRok) + ' zł netto, potem ok. ' +
    zakres(utrzymanie.kolejneLata) + ' zł netto rocznie';
  t.UTRZYMANIE_VAT = 'ok. ' + zakres(utrzymanie.pierwszyRok, 1 + VAT) + ' zł i ok. ' + zakres(utrzymanie.kolejneLata, 1 + VAT) + ' zł';
  t.KOSZT_AKAPIT = koszt ? akapitKosztu(w, {ileRok: ileRok, sk: sk, zalozona: zalozona, klienciRok: klienciRok, kwota: kwota, cena2: ceny[1]}) : '';
  t.KOSZT_ZRODLA = koszt ? zrodlaKosztu(w) : '';

  return {
    tokeny: t,
    koszt: koszt,
    kwotaJest: kwota !== null && kwota > 0,
    zalozona: zalozona,
    maStrone: maStrone,
    budzetNiski: tekst(o.BUDZET) === BUDZETY[0] && ceny[1] > 1500,
  };
}

/**
 * Akapit „ile kosztuje problem”, liczony ostrożnie: strona odzyskuje co trzecią osobę (zapytanie),
 * a klientami zostaje tyle, ile dziś. Do tego: po ilu klientach i w ilu miesiącach zwraca się wariant 2.
 */
function akapitKosztu(w, d) {
  const odzyskane = Math.round(d.ileRok * ODZYSK);
  const potrzeba = Math.max(1, Math.ceil(d.cena2 / d.kwota - 1e-9)); // ilu klientów (zleceń) pokrywa cenę wariantu 2
  const miesiace = Math.max(1, Math.ceil(potrzeba * 12 / d.klienciRok - 1e-9));
  const tempo = ', przy tym tempie w ciągu ok. ' + (miesiace === 1 ? '1 miesiąca' : miesiace + ' miesięcy') + '.';
  const rocznie = d.klienciRok * d.kwota;
  const kwoty = ' to ok. ' + zlote(rocznie) + ' rocznie (ok. ' + zlote(Math.round(rocznie / 12 / 10) * 10) + ' miesięcznie). ';
  const zalozenie = ' (to moje założenie, proszę je poprawić)';
  if (w === 'A') {
    return 'Ile kosztuje problem, liczone ostrożnie: rocznie nie umawia się ok. ' + liczbaTekst(d.ileRok) + ' osób z pytających. ' +
      'Jeśli strona umówi co trzecią z nich (ok. ' + liczbaTekst(odzyskane) + '), a klientami zostanie ' +
      (d.zalozona ? procent(d.sk) + ' umówionych' + zalozenie : 'tyle, ile dziś (' + procent(d.sk) + ' umówionych)') +
      ', to ok. ' + (d.klienciRok === 1 ? '1 nowego klienta' : liczbaTekst(d.klienciRok) + ' nowych klientów') + ' rocznie. ' +
      'Przy ' + zlote(d.kwota) + ' z jednego klienta' + kwoty + 'Wariant 2 (' + zlote(d.cena2) + ') zwraca się po ' +
      (potrzeba === 1 ? 'pierwszym dodatkowym kliencie' : potrzeba + ' dodatkowych klientach') + tempo;
  }
  return 'Ile kosztuje problem, liczone ostrożnie: rocznie bez odpowiedzi zostaje ok. ' + liczbaTekst(d.ileRok) + ' telefonów. ' +
    'Jeśli strona przejmie co trzecie z tych zapytań (ok. ' + liczbaTekst(odzyskane) + '), a zleceniem skończy się ' +
    (d.zalozona ? procent(d.sk) + ' zapytań' + zalozenie : 'tyle, ile dziś (' + procent(d.sk) + ' zapytań)') +
    ', to ok. ' + (d.klienciRok === 1 ? '1 dodatkowego zlecenia' : liczbaTekst(d.klienciRok) + ' dodatkowych zleceń') + ' rocznie. ' +
    'Przy ' + zlote(d.kwota) + ' za zlecenie' + kwoty + 'Wariant 2 (' + zlote(d.cena2) + ') zwraca się po ' +
    (potrzeba === 1 ? 'pierwszym dodatkowym zleceniu' : potrzeba + ' dodatkowych zleceniach') + tempo;
}

/** Przypis pod kosztem problemu: skąd założenie „co trzecia osoba”. */
function zrodlaKosztu(w) {
  return 'Skąd „co ' + (w === 'A' ? 'trzecia' : 'trzecie') + '”: w badaniu Mayo Clinic ok. 30% samodzielnych rezerwacji ' +
    'przypadało poza godzinami pracy (JMIR Medical Informatics, 2021), a według danych Booksy średnio 45% klientów ' +
    'umawia się poza godzinami pracy salonu. ' + (w === 'A'
      ? 'To osoby, które chcą się umówić wtedy, gdy nikt nie odbiera telefonu.'
      : 'To klienci, którzy chcą poznać cenę i zamówić wtedy, gdy nikt nie odbiera telefonu.') +
    ' Pozostałe liczby pochodzą z Państwa ankiety.';
}

// ===================== Ankieta na stronie (wtyczka MP Ankiety) =====================

const ARKUSZ_ZE_STRONY = 'Ze strony';
const NAGLOWKI_ZE_STRONY = ['Data', 'Ankieta', 'Nr', 'Firma', 'E-mail', 'Stan', 'Dane'];

/**
 * Uruchom raz (i po każdej wymianie sekretu). Tworzy sekret do podpisu wiadomości ze strony.
 * Sekret pokazuje się w dzienniku wykonania: wklej go w WordPressie w Ankiety → Ustawienia → Sekret.
 */
function ustawSekretStrony() {
  const sekret = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('SEKRET_STRONY', sekret);
  arkuszZeStrony();
  Logger.log('Sekret dla Ankiety → Ustawienia (wklej go tylko tam): %s', sekret);
}

/**
 * Aplikacja internetowa (Wdróż → Aplikacja internetowa, wykonuj jako: ja, dostęp: każdy).
 * Wtyczka MP Ankiety wysyła {dane, podpis}. Sprawdzamy podpis HMAC-SHA256 tym samym sekretem, zapisujemy
 * odpowiedź w arkuszu „Ze strony” i odpowiadamy od razu. Prezentację i propozycję robi zeStrony() minutę później.
 */
function doPost(e) {
  try {
    const sekret = PropertiesService.getScriptProperties().getProperty('SEKRET_STRONY');
    if (!sekret) return wynikJson({ok: false, blad: 'Brak sekretu: uruchom w skrypcie ustawSekretStrony.'});
    const tresc = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const dane = String(tresc.dane || '');
    if (!dane || podpisStrony(dane, sekret) !== String(tresc.podpis || '')) return wynikJson({ok: false, blad: 'Zły podpis.'});
    const d = JSON.parse(dane);
    if (d.test) return wynikJson({ok: true, test: true});

    const blokada = LockService.getScriptLock();
    blokada.waitLock(20000);
    try {
      const log = arkuszZeStrony();
      const wiersze = log.getDataRange().getValues();
      const jest = wiersze.some(w => w[1] === d.ankieta && String(w[2]) === String(d.id));
      if (!jest) {
        log.appendRow([new Date(d.utworzona || Date.now()), d.ankieta, d.id, d.nazwa || '', d.email || '', d.ankieta === 'wycena' ? 'czeka' : 'zapisana', dane]);
        if (d.ankieta === 'wycena') zaplanujZeStrony();
      }
    } finally {
      blokada.releaseLock();
    }
    return wynikJson({ok: true});
  } catch (err) {
    return wynikJson({ok: false, blad: String(err)});
  }
}

/** Zadanie jednorazowe: prezentacje i propozycje z ankiet wyceny ze strony (najwyżej 5 naraz). */
function zeStrony() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'zeStrony').forEach(t => ScriptApp.deleteTrigger(t));
  const log = arkuszZeStrony();
  const wiersze = log.getDataRange().getValues();
  let zrobione = 0;
  let zostalo = 0;
  for (let i = 1; i < wiersze.length; i++) {
    if (wiersze[i][5] !== 'czeka') continue;
    if (zrobione >= 5) {
      zostalo++;
      continue;
    }
    zrobione++;
    try {
      const d = JSON.parse(wiersze[i][6]);
      const wersja = wersjaZeStrony(d);
      const linki = utworzPrezentacje(wersja, odpowiedziZeStrony(d), new Date(d.utworzona || Date.now()));
      log.getRange(i + 1, 6).setValue('gotowe ' + wersja + ': ' + linki.propozycja);
    } catch (err) {
      log.getRange(i + 1, 6).setValue('błąd: ' + String(err).slice(0, 300));
      MailApp.sendEmail(adres(), 'Automat ankieta ze strony → prezentacja: błąd',
        'Prezentacja nie powstała (arkusz „' + ARKUSZ_ZE_STRONY + '”, wiersz ' + (i + 1) + ').\n\n' + err + '\n\n' + (err && err.stack ? err.stack : ''));
    }
  }
  if (zostalo) zaplanujZeStrony();
}

/** Prezentacje jeszcze raz z ostatniej ankiety ze strony (np. po poprawce szablonu). */
function utworzZOstatniejZeStrony() {
  const wiersze = arkuszZeStrony().getDataRange().getValues().filter(w => w[1] === 'wycena');
  if (!wiersze.length) return Logger.log('Nie ma jeszcze ankiet wyceny ze strony.');
  const d = JSON.parse(wiersze[wiersze.length - 1][6]);
  const linki = utworzPrezentacje(wersjaZeStrony(d), odpowiedziZeStrony(d), new Date(d.utworzona || Date.now()));
  Logger.log('%s · %s', linki.prezentacja, linki.propozycja);
}

/**
 * Codziennie w nocy: usuwa z arkusza „Ze strony” odpowiedzi starsze niż rok, tak jak obiecuje polityka prywatności strony.
 * Nie rusza arkusza, dopóki czeka w nim ankieta na prezentację (zeStrony() pracuje na numerach wierszy).
 */
function porzadekZeStrony() {
  const blokada = LockService.getScriptLock();
  blokada.waitLock(20000);
  try {
    const log = arkuszZeStrony();
    const wiersze = log.getDataRange().getValues();
    if (wiersze.some(w => w[5] === 'czeka')) return;
    const granica = new Date(Date.now() - 365 * 24 * 3600 * 1000);
    for (let i = wiersze.length - 1; i >= 1; i--) {
      if (wiersze[i][0] instanceof Date && wiersze[i][0] < granica) log.deleteRow(i + 1);
    }
  } finally {
    blokada.releaseLock();
  }
}

/** Wersja B dla firm remontowych i innych branż, w których pierwszy krok to wycena zlecenia. */
function wersjaZeStrony(d) {
  const w = d.wartosci || {};
  return w.BRANZA === 'remont' || w.MODEL === 'B' ? 'B' : 'A';
}

/** Odpowiedzi ze strony w tym samym kształcie co z ankiety Google ({FIRMA: …, PYTA: …}). */
function odpowiedziZeStrony(d) {
  const o = Object.assign({}, d.teksty || {});
  o.FIRMA = o.FIRMA || d.nazwa || '';
  o.EMAIL = o.EMAIL || d.email || '';
  o.ZRODLO = 'Strona' + (o.ZRODLO ? ': ' + tekst(o.ZRODLO) : '');
  o._lista = d.odpowiedzi || [];
  o._branza = (d.wartosci || {}).BRANZA || '';
  return o;
}

function arkuszZeStrony() {
  const props = PropertiesService.getScriptProperties();
  let arkusz = otworzJesliJest(props.getProperty('ARKUSZ'), id => SpreadsheetApp.openById(id));
  if (!arkusz) {
    arkusz = SpreadsheetApp.create('Ankiety: odpowiedzi, prezentacje i propozycje');
    DriveApp.getFileById(arkusz.getId()).moveTo(folderRoboczy());
    props.setProperty('ARKUSZ', arkusz.getId());
  }
  let log = arkusz.getSheetByName(ARKUSZ_ZE_STRONY);
  if (!log) {
    log = arkusz.insertSheet(ARKUSZ_ZE_STRONY);
    log.getRange(1, 1, 1, NAGLOWKI_ZE_STRONY.length).setValues([NAGLOWKI_ZE_STRONY]).setFontWeight('bold');
    log.setFrozenRows(1);
  }
  return log;
}

function zaplanujZeStrony() {
  const jest = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'zeStrony');
  if (!jest) ScriptApp.newTrigger('zeStrony').timeBased().after(60 * 1000).create();
}

function podpisStrony(dane, sekret) {
  return Utilities.computeHmacSha256Signature(dane, sekret, Utilities.Charset.UTF_8)
    .map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function wynikJson(x) {
  return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON);
}

// ===================== Ankiety =====================

function utworzAnkiete(w) {
  const form = FormApp.create(ANKIETY[w].plik);
  ustawTeksty(form, w);
  form.setAllowResponseEdits(false).setShowLinkToRespondAgain(false);
  const mapa = {};
  ANKIETY[w].pytania.forEach(p => {
    if (p.sekcja) {
      form.addSectionHeaderItem().setTitle(p.sekcja);
      return;
    }
    const item = dodajPytanie(form, p);
    mapa[String(item.getId())] = p.id;
  });
  PropertiesService.getScriptProperties().setProperty('MAPA_' + form.getId(), JSON.stringify(mapa));
  return form;
}

/**
 * Ankieta utworzona wcześniej: dopisuje pytania, których jeszcze w niej nie ma (zaraz za pytaniem,
 * które je poprzedza w ANKIETY), i odświeża teksty.
 */
function uzupelnijAnkiete(form, w) {
  const props = PropertiesService.getScriptProperties();
  const mapa = JSON.parse(props.getProperty('MAPA_' + form.getId()) || '{}');
  const pole = {};
  Object.keys(mapa).forEach(id => { pole[mapa[id]] = Number(id); });
  let poprzednie = null;
  ANKIETY[w].pytania.forEach(p => {
    if (!p.id) return;
    if (!pole[p.id]) {
      const item = dodajPytanie(form, p);
      pole[p.id] = item.getId();
      mapa[String(item.getId())] = p.id;
      const przed = poprzednie && otworzJesliJest(pole[poprzednie], id => form.getItemById(id));
      if (przed) form.moveItem(item, przed.getIndex() + 1);
    }
    poprzednie = p.id;
  });
  props.setProperty('MAPA_' + form.getId(), JSON.stringify(mapa));
  ustawTeksty(form, w);
}

function ustawTeksty(form, w) {
  const polityka = String(USTAWIENIA.politykaPrywatnosci || '').trim();
  form.setTitle(ANKIETY[w].tytul)
    .setDescription(WSTEP + (polityka ? ' Zasady przetwarzania danych: ' + polityka : ''))
    .setConfirmationMessage(POTWIERDZENIE);
}

function dodajPytanie(form, p) {
  let item;
  if (p.typ === 'tekst') item = form.addTextItem();
  else if (p.typ === 'email') item = form.addTextItem().setValidation(
    FormApp.createTextValidation().setHelpText('Proszę wpisać adres e-mail.').requireTextIsEmail().build());
  else if (p.typ === 'liczba') item = form.addTextItem().setValidation(
    FormApp.createTextValidation().setHelpText('Proszę wpisać samą liczbę, np. 12.').requireNumber().build());
  else if (p.typ === 'akapit') item = form.addParagraphTextItem();
  else if (p.typ === 'data') item = form.addDateItem();
  else if (p.typ === 'jeden') item = form.addMultipleChoiceItem();
  else if (p.typ === 'wiele') item = form.addCheckboxItem();
  else throw new Error('Nieznany typ pytania: ' + p.typ);

  item.setTitle(p.tytul);
  if (p.pomoc) item.setHelpText(p.pomoc);
  if (p.opcje) item.setChoiceValues(p.opcje);
  if (p.inne) item.showOtherOption(true);
  if (p.wymagane) item.setRequired(true);
  return item;
}

/** Linki do ankiety z zaznaczonym źródłem, np. na stronę, do maili, dla poleceń. */
function linkiZrodel(form) {
  const mapa = JSON.parse(PropertiesService.getScriptProperties().getProperty('MAPA_' + form.getId()) || '{}');
  const itemId = Object.keys(mapa).filter(id => mapa[id] === 'ZRODLO')[0];
  if (!itemId) return [];
  const pytanie = form.getItemById(Number(itemId));
  if (!pytanie) return []; // pytanie usunięte ręcznie z ankiety
  const item = pytanie.asMultipleChoiceItem();
  return ZRODLA.map(zrodlo => {
    const link = form.createResponse().withItemResponse(item.createResponse(zrodlo)).toPrefilledUrl();
    return {zrodlo: zrodlo, link: krotkiLink(form, link)};
  });
}

/** Odpowiedzi z jednej ankiety jako {FIRMA: …, PYTA: …}. Pytań dodanych później ręcznie automat nie zna. */
function odpowiedzi(formId, response) {
  const mapa = JSON.parse(PropertiesService.getScriptProperties().getProperty('MAPA_' + formId) || '{}');
  const o = {};
  response.getItemResponses().forEach(ir => {
    const klucz = mapa[String(ir.getItem().getId())];
    if (klucz) o[klucz] = ir.getResponse();
  });
  return o;
}

// ===================== Szablony =====================

/**
 * Zwraca id szablonu w formacie Google Slides. Plik PowerPoint (.pptx) zamienia raz na kopię Google
 * w folderze roboczym i zapamiętuje ją, więc ponowne uruchomienie setup nie robi kolejnych kopii.
 */
function szablonGoogle(id, litera, folder) {
  const props = PropertiesService.getScriptProperties();
  const zapamietany = props.getProperty('SZABLON_' + litera);
  if (props.getProperty('ZRODLO_' + litera) === id && istnieje(zapamietany)) return zapamietany;
  const typ = DriveApp.getFileById(id).getMimeType();
  let wynik;
  if (typ === MimeType.GOOGLE_SLIDES) {
    wynik = id;
  } else if (typ === MimeType.MICROSOFT_POWERPOINT || typ === MimeType.MICROSOFT_POWERPOINT_LEGACY) {
    const odp = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + id + '/copy', {
      method: 'post',
      contentType: 'application/json',
      headers: {Authorization: 'Bearer ' + ScriptApp.getOAuthToken()},
      payload: JSON.stringify({name: 'Szablon ' + litera + ' · Google Slides', mimeType: MimeType.GOOGLE_SLIDES}),
    });
    wynik = JSON.parse(odp.getContentText()).id;
    DriveApp.getFileById(wynik).moveTo(folder);
  } else {
    throw new Error('Szablon ' + litera + ' nie jest prezentacją (typ pliku: ' + typ + '). ' +
      'Wklej link do prezentacji w Google Slides albo do pliku .pptx na Dysku.');
  }
  SlidesApp.openById(wynik); // sprawdza, czy skrypt może edytować szablon
  props.setProperty('ZRODLO_' + litera, id);
  props.setProperty('SZABLON_' + litera, wynik);
  return wynik;
}

/**
 * Szablon prezentacji z poprzedniej wersji: nowy rachunek na slajdzie „Koszt problemu”, koszty domeny
 * i hostingu oraz pytanie o klientów. Zwraca 'aktualny', 'zaktualizowany' albo 'stary' (nie udało się).
 */
function aktualizujSzablonPrezentacji(presId, w) {
  const pres = SlidesApp.openById(presId);
  let zmiany = 0;
  NOWE_ZDANIA.forEach(z => { zmiany += pres.replaceAllText(z[0], z[1], true); });
  let stan = 'stary';
  pres.getSlides().forEach(slajd => {
    const ksz = ksztalty(slajd.getPageElements(), []);
    const teksty = ksz.map(k => k.getText().asString().trim());
    if (teksty.indexOf('{{NOWI}}') !== -1) { stan = 'aktualny'; return; }
    if (teksty.indexOf('{{MIES}}') === -1) return; // to nie jest stary slajd kosztu
    const zamiany = NOWY_SLAJD_KOSZTU[w];
    // Slajd zmieniony ręcznie zostaje bez zmian: automat go pominie, a mail z setup poprosi o nowy eksport.
    if (!Object.keys(zamiany).every(stary => teksty.indexOf(stary) !== -1)) return;
    ksz.forEach((k, i) => {
      if (zamiany[teksty[i]]) { k.getText().setText(zamiany[teksty[i]]); zmiany++; }
    });
    stan = 'zaktualizowany';
  });
  if (zmiany) pres.saveAndClose();
  return stan;
}

/** Szablon propozycji w Google Docs: tworzony raz, potem poprawiasz go sam w Dokumentach. Usunięty powstaje od nowa. */
function szablonPropozycji(w, folder) {
  const props = PropertiesService.getScriptProperties();
  const jest = props.getProperty('PROPOZYCJA_' + w);
  if (istnieje(jest)) {
    if (props.getProperty('PROPOZYCJA_WERSJA_' + w) === String(WERSJA_PROPOZYCJI)) return jest;
    const stary = DriveApp.getFileById(jest); // szablon poprzedniej wersji zostaje w folderze, z dopiskiem
    stary.setName(stary.getName() + ' (stara wersja)');
  }

  const doc = DocumentApp.create('Szablon propozycji ' + w + (w === 'A' ? ' · Konsultacja' : ' · Wycena'));
  const body = doc.getBody();
  PROPOZYCJA[w].forEach(blok => {
    if (blok.tytul) {
      const p = body.getParagraphs()[0]; // nowy dokument ma jeden pusty akapit: zostaje tytułem
      p.setText(blok.tytul);
      p.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    } else if (blok.naglowek) {
      body.appendParagraph(blok.naglowek).setHeading(DocumentApp.ParagraphHeading.HEADING3);
    } else if (blok.tekst) {
      const p = body.appendParagraph(blok.tekst).setHeading(DocumentApp.ParagraphHeading.NORMAL);
      if (blok.przypis) p.editAsText().setFontSize(9).setItalic(true).setForegroundColor('#5d6782');
    } else if (blok.lista) {
      blok.lista.forEach(el => body.appendListItem(el).setGlyphType(DocumentApp.GlyphType.BULLET)
        .setHeading(DocumentApp.ParagraphHeading.NORMAL));
    } else if (blok.tabela) {
      const tabela = body.appendTable(blok.tabela);
      tabela.getRow(0).editAsText().setBold(true);
      if (blok.wyroznij) { // polecany wariant: pogrubiony wiersz na jasnym tle
        const wiersz = tabela.getRow(blok.wyroznij);
        wiersz.editAsText().setBold(true);
        for (let c = 0; c < wiersz.getNumCells(); c++) wiersz.getCell(c).setBackgroundColor('#fdf0e8');
      }
    }
  });
  doc.saveAndClose();
  DriveApp.getFileById(doc.getId()).moveTo(folder);
  props.setProperty('PROPOZYCJA_' + w, doc.getId());
  props.setProperty('PROPOZYCJA_WERSJA_' + w, String(WERSJA_PROPOZYCJI));
  return doc.getId();
}

/**
 * Wpisuje wartości w pola {{…}} dokumentu. Tekst wstawia dosłownie (bez wyrażeń regularnych).
 * Pole z pustą wartością znika, a pusty po nim akapit jest usuwany.
 */
function wstawWDokumencie(body, tokeny) {
  Object.keys(tokeny).forEach(k => {
    const wzor = '\\{\\{' + k + '\\}\\}';
    const wartosc = String(tokeny[k] == null ? '' : tokeny[k]).replace(/\s*\n+\s*/g, ' ');
    let znalezione = body.findText(wzor);
    // Limit chroni przed pętlą, gdyby odpowiedź klienta zawierała samo pole, np. „{{FIRMA}}”.
    for (let i = 0; znalezione && i < 50; i++) {
      const tekst = znalezione.getElement().asText();
      const start = znalezione.getStartOffset();
      const koniec = znalezione.getEndOffsetInclusive();
      const akapit = tekst.getParent();
      if (wartosc) {
        // Najpierw wstawiamy, potem kasujemy pole: tekst, z którego skasowano wszystko, odpada od akapitu.
        tekst.insertText(start, wartosc);
        tekst.setAttributes(start, start + wartosc.length - 1, tekst.getAttributes(start + wartosc.length)); // styl pola
        tekst.deleteText(start + wartosc.length, koniec + wartosc.length);
      } else {
        tekst.deleteText(start, koniec);
        if (akapit && akapit.getType() === DocumentApp.ElementType.PARAGRAPH && !akapit.asParagraph().getText().trim()) {
          try {
            akapit.removeFromParent();
          } catch (err) {
            // ostatniego akapitu dokumentu nie da się usunąć: zostaje pusty
          }
        }
      }
      znalezione = body.findText(wzor);
    }
  });
}

// ===================== Pomocnicze =====================

function tekstSlajdu(slajd) {
  const czesci = [];
  const zbierz = el => {
    try {
      const typ = el.getPageElementType();
      if (typ === SlidesApp.PageElementType.SHAPE) czesci.push(el.asShape().getText().asString());
      else if (typ === SlidesApp.PageElementType.GROUP) el.asGroup().getChildren().forEach(zbierz);
      else if (typ === SlidesApp.PageElementType.TABLE) {
        const tab = el.asTable();
        for (let r = 0; r < tab.getNumRows(); r++) {
          for (let c = 0; c < tab.getNumColumns(); c++) czesci.push(tab.getCell(r, c).getText().asString());
        }
      }
    } catch (err) {
      // element bez tekstu albo scalona komórka tabeli
    }
  };
  slajd.getPageElements().forEach(zbierz);
  return czesci.join(' ');
}

/** Wszystkie kształty z tekstem na slajdzie, także w grupach. */
function ksztalty(elementy, wynik) {
  elementy.forEach(el => {
    try {
      const typ = el.getPageElementType();
      if (typ === SlidesApp.PageElementType.SHAPE) wynik.push(el.asShape());
      else if (typ === SlidesApp.PageElementType.GROUP) ksztalty(el.asGroup().getChildren(), wynik);
    } catch (err) {
      // element bez tekstu
    }
  });
  return wynik;
}

function pomin(slajd) {
  try {
    slajd.setSkipped(true);
  } catch (err) {
    // starsze API bez pomijania slajdów: slajd zostaje
  }
}

function trescMaila(w, dane, o, linki, arkuszUrl) {
  const t = dane.tokeny;
  const ile = w === 'A'
    ? 'Miesięcznie pyta ' + t.PYTA + ', umawia się ' + t.UMAWIA + '.'
    : 'Zapytań tygodniowo ' + t.ZAPYTANIA + ', bez odpowiedzi ' + t.PRZEPADA + '.';
  const wskazowki = ['Sprawdź w szkicu propozycji warianty, ceny i daty, popraw zdania z ankiety, potem Plik → Pobierz → PDF ' +
    'i wyślij z wiadomością T11.'];
  if (!dane.kwotaJest) wskazowki.push('Klient nie podał kwoty: slajd z kosztem problemu jest pominięty, a w propozycji nie ma akapitu o koszcie.');
  else if (!dane.koszt) wskazowki.push('Przy tych liczbach strona przyniesie mniej niż 1 klienta rocznie, więc slajd i akapit o koszcie ' +
    'są pominięte. Pokaż raczej oszczędność czasu (' + t.GODZ + ' tygodniowo).');
  else if (dane.zalozona) wskazowki.push(w === 'A'
    ? 'Klient nie podał, ilu umówionych zostaje klientami: w propozycji i na slajdzie jest założenie ' + t.SKUTECZNOSC + '. Zapytaj i popraw.'
    : 'Klient nie podał, ile zapytań kończy się zleceniem: w propozycji i na slajdzie jest założenie ' + t.SKUTECZNOSC + '. Zapytaj i popraw.');
  const branza = o._branza || '';
  if (w === 'A' && ['biuro', 'kancelaria'].indexOf(branza) !== -1) wskazowki.push('Rozliczenie: biura rachunkowe i kancelarie są zwykle ' +
    'płatnikami VAT, więc faktura VAT przez Useme może być dla nich wygodniejsza (odliczą VAT). Zapytaj, co wolą.');
  else if (w === 'A') wskazowki.push('Rozliczenie: doradca kredytowy, agent ubezpieczeniowy, psycholog i fizjoterapeuta zwykle mają sprzedaż ' +
    'zwolnioną z VAT, więc faktura VAT przez Useme kosztowałaby ich 23% więcej. Poleć fakturę bez VAT.');
  if (dane.budzetNiski) wskazowki.push('Budżet klienta to do 1 500 zł, a wariant 2 kosztuje ' + t.CENA2 + ': rozważ polecenie wariantu 1 albo mniejszy zakres.');
  if (w === 'A' && dane.maStrone) wskazowki.push('Klient ma już stronę: rozważ zamiast wariantów 1–2 moduł umawiania na obecnej stronie (800–1 200 zł).');
  if (w === 'B' && !dane.maStrone) wskazowki.push('Klient nie ma strony: wariant 1 to mini-strona z kalkulatorem, cena zawiera konfigurację hostingu i domeny.');
  const pary = o._lista
    ? o._lista.map(x => [x.pytanie, x.tekst])
    : ANKIETY[w].pytania.filter(p => p.id).map(p => [p.tytul, tekst(o[p.id])]);
  const wiersze = pary.map(x =>
    '<tr><td style="padding:4px 16px 4px 0;color:#5d6782;vertical-align:top">' + esc(x[0]) +
    '</td><td style="padding:4px 0">' + esc(x[1] || '—') + '</td></tr>').join('');
  return '' +
    '<p><b><a href="' + linki.prezentacja + '">Prezentacja dla ' + esc(t.FIRMA) + '</a></b> (wersja ' + w + ', rozmowa ' + t.DATA + ')' +
    '<br><b><a href="' + linki.propozycja + '">Szkic propozycji</a></b> (do wysłania do ' + t.TERMIN + ')' +
    '<br>Źródło: ' + esc(t.ZRODLO) + '</p>' +
    '<ul>' + wskazowki.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
    '<h3>Szkic podsumowania po rozmowie (5 punktów)</h3><ol>' +
    '<li>Co usłyszałem: ' + esc(t.SKAD) + '. ' + esc(ile) + ' Najbardziej przeszkadza: ' + esc(t.PRZESZKADZA_PELNE) + '</li>' +
    '<li>Cel: ' + esc(t.CEL_PELNY) + '</li>' +
    '<li>Warianty: ' + esc(t.CENA1 + ' / ' + t.CENA2 + ' / ' + t.CENA3) + ' (szczegóły w propozycji)</li>' +
    '<li>Termin: ' + esc(t.KIEDY) + '</li>' +
    '<li>Następny krok: propozycja na piśmie do ' + esc(t.TERMIN) + ', pytanie o decyzję: ' + esc(t.DECYZJA) + '</li></ol>' +
    '<h3>Wszystkie odpowiedzi</h3><table>' + wiersze + '</table>' +
    '<p><a href="' + arkuszUrl + '">Arkusz z odpowiedziami i listą prezentacji</a></p>';
}

function wyslijLinki(linki, arkusz, folder, szablony, propozycje, zmiany) {
  const uwagi = [];
  ['A', 'B'].forEach(w => {
    if (zmiany.slajdy[w] === 'zaktualizowany') uwagi.push('Szablon prezentacji ' + w + ': nowy rachunek na slajdzie „Koszt problemu” ' +
      'i koszty domeny i hostingu.');
    if (zmiany.slajdy[w] === 'stary') uwagi.push('Szablon prezentacji ' + w + ': nie udało się zaktualizować slajdu „Koszt problemu”, ' +
      'więc automat go pomija. Wyeksportuj prezentację z claude.ai jeszcze raz i wklej nowy link w USTAWIENIA (INSTRUKCJA).');
  });
  if (zmiany.nowePropozycje) uwagi.push('Nowe szablony propozycji (polecany wariant 2, ostrożny koszt problemu, rozliczenie, ' +
    'koszty domeny i hostingu). Poprzednie mają w nazwie „(stara wersja)” i możesz je usunąć.');
  const zrodla = ZRODLA.map((z, i) => '<tr><td style="padding:4px 16px 4px 0">' + esc(z) + '</td>' +
    '<td style="padding:4px 16px 4px 0">' + linkLubKreska(linki.A.zrodla[i]) + '</td>' +
    '<td style="padding:4px 0">' + linkLubKreska(linki.B.zrodla[i]) + '</td></tr>').join('');
  const html = '' +
    '<p>Automat ankieta → prezentacja i propozycja jest gotowy.</p>' +
    (uwagi.length ? '<ul>' + uwagi.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
    '<p><b>Ankieta A „Konsultacja”</b>, link dla klienta: <a href="' + linki.A.dlaKlienta + '">' + linki.A.dlaKlienta + '</a>' +
    '<br>edycja pytań: <a href="' + linki.A.edycja + '">otwórz</a></p>' +
    '<p><b>Ankieta B „Wycena”</b>, link dla klienta: <a href="' + linki.B.dlaKlienta + '">' + linki.B.dlaKlienta + '</a>' +
    '<br>edycja pytań: <a href="' + linki.B.edycja + '">otwórz</a></p>' +
    '<h3>Linki z wpisanym źródłem</h3>' +
    '<p>Każdy link otwiera ankietę z zaznaczoną odpowiedzią „Skąd Państwo o mnie wiedzą?”, więc w arkuszu widzisz, który kanał daje klientów. ' +
    'Na stronę wstaw link „Ze strony internetowej”, w e-mailach używaj „Z mojej wiadomości e-mail”, doradczyni daj „Z polecenia”.</p>' +
    '<table><tr><th style="text-align:left;padding:4px 16px 4px 0">Źródło</th><th style="text-align:left;padding:4px 16px 4px 0">Ankieta A</th>' +
    '<th style="text-align:left;padding:4px 0">Ankieta B</th></tr>' + zrodla + '</table>' +
    '<p>Odpowiedzi i lista prezentacji: <a href="' + arkusz.getUrl() + '">arkusz</a>' +
    '<br>Gotowe pliki: <a href="' + folder.getUrl() + '">folder na Dysku</a></p>' +
    '<p>Szablony, z których automat robi kopie (zmiany wprowadzaj tutaj): ' +
    '<a href="https://docs.google.com/presentation/d/' + szablony.A + '/edit">prezentacja A</a> · ' +
    '<a href="https://docs.google.com/presentation/d/' + szablony.B + '/edit">prezentacja B</a> · ' +
    '<a href="https://docs.google.com/document/d/' + propozycje.A + '/edit">propozycja A</a> · ' +
    '<a href="https://docs.google.com/document/d/' + propozycje.B + '/edit">propozycja B</a></p>' +
    '<p>Test: wypełnij ankietę A wymyślonymi danymi. Po około minucie przyjdzie mail z prezentacją i szkicem propozycji.</p>';
  MailApp.sendEmail({to: adres(), subject: 'Automat ankieta → prezentacja: linki', htmlBody: html});
}

function linkLubKreska(x) {
  return x && x.link ? '<a href="' + x.link + '">' + x.link + '</a>' : '—';
}

function folderRoboczy() {
  const props = PropertiesService.getScriptProperties();
  const jest = otworzJesliJest(props.getProperty('FOLDER'), id => DriveApp.getFolderById(id));
  if (jest && !jest.isTrashed()) return jest;
  const znalezione = DriveApp.getFoldersByName(USTAWIENIA.folder);
  const folder = znalezione.hasNext() ? znalezione.next() : DriveApp.createFolder(USTAWIENIA.folder);
  props.setProperty('FOLDER', folder.getId());
  return folder;
}

/** Czy plik o tym id jest na Dysku i nie leży w koszu. */
function istnieje(id) {
  const plik = otworzJesliJest(id, x => DriveApp.getFileById(x));
  return !!plik && !plik.isTrashed();
}

function otworzJesliJest(id, otworz) {
  if (!id) return null;
  try {
    return otworz(id);
  } catch (err) {
    return null;
  }
}

function krotkiLink(form, pelny) {
  try {
    return form.shortenFormUrl(pelny);
  } catch (err) {
    return pelny;
  }
}

function adres() {
  return USTAWIENIA.email || Session.getEffectiveUser().getEmail();
}

function idPliku(link) {
  const s = String(link || '').trim();
  if (!s || s.indexOf('WKLEJ') === 0) return null;
  const m = s.match(/\/d\/([a-zA-Z0-9_-]{20,})/) || s.match(/^([a-zA-Z0-9_-]{20,})$/);
  return m ? m[1] : null;
}

function tekst(x) {
  return (Array.isArray(x) ? x.join(', ') : String(x == null ? '' : x)).trim();
}

function lista(x) {
  return (Array.isArray(x) ? x : (x ? [x] : [])).map(s => String(s).trim()).filter(Boolean);
}

/** Tekst jako zdanie: bez zbędnych spacji i z kropką na końcu. */
function zdanie(x) {
  const s = tekst(x).replace(/\s+/g, ' ');
  if (!s) return '';
  return /[.!?…]$/.test(s) ? s : s + '.';
}

/** Słowa klienta w cudzysłowie, bez kropki na końcu (kropka idzie za cudzysłów). */
function cytat(x) {
  return '„' + tekst(x).replace(/\s+/g, ' ').replace(/\.$/, '') + '”';
}

function liczba(x) {
  const m = String(x == null ? '' : x).replace(/\s/g, '').replace(',', '.').match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function liczbaTekst(n) {
  const r = Math.round(n * 10) / 10;
  const czesci = String(r).split('.');
  return czesci[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (czesci[1] ? ',' + czesci[1] : '');
}

function zlote(n) {
  return liczbaTekst(Math.round(n)) + ' zł';
}

function godzinyTekst(h) {
  const r = Math.max(0.5, Math.round(h * 2) / 2);
  return 'ok. ' + liczbaTekst(r) + ' ' + odmianaGodzin(r);
}

function odmianaGodzin(n) {
  return n % 1 !== 0 ? 'godziny' : odmiana(n, 'godzina', 'godziny', 'godzin');
}

/** Polska odmiana po liczbie: 1 godzina, 2–4 godziny, 5 godzin (także 12–14 godzin, 22 godziny). */
function odmiana(n, jeden, kilka, wiele) {
  if (n === 1) return jeden;
  const j = n % 10;
  const d = n % 100;
  return j >= 2 && j <= 4 && (d < 12 || d > 14) ? kilka : wiele;
}

function procent(x) {
  return Math.round(x * 100) + '%';
}

/** [55, 75] → „55–75”, opcjonalnie przemnożone (np. przez 1,23 dla ceny z VAT). */
function zakres(para, mnoznik) {
  const m = mnoznik || 1;
  const liczby = (Array.isArray(para) ? para : [para]).map(x => liczbaTekst(Math.round(Number(x) * m)));
  return liczby[0] === liczby[liczby.length - 1] ? liczby[0] : liczby[0] + '–' + liczby[liczby.length - 1];
}

function przytnij(s, max) {
  const czysty = String(s || '').replace(/\s+/g, ' ').trim();
  if (czysty.length <= max) return czysty;
  const ciecie = czysty.slice(0, max - 1);
  const spacja = ciecie.lastIndexOf(' ');
  return (spacja > max * 0.6 ? ciecie.slice(0, spacja) : ciecie).replace(/[\s,.;:–-]+$/, '') + '…';
}

function malaLitera(s) {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function data(d, wzor) {
  return Utilities.formatDate(d, USTAWIENIA.strefaCzasowa, wzor);
}

/** Dzień rozmowy z ankiety (RRRR-MM-DD) albo dzień wysłania ankiety; zawsze w południe, żeby strefy czasu nie zmieniały dnia. */
function dzienRozmowy(odp, kiedy) {
  const m = /(\d{4})-(\d{2})-(\d{2})/.exec(String(odp || ''));
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  const czesci = data(kiedy || new Date(), 'yyyy-MM-dd').split('-').map(Number);
  return new Date(czesci[0], czesci[1] - 1, czesci[2], 12);
}

function dniRobocze(d, n) {
  const x = new Date(d.getTime());
  let i = 0;
  while (i < n) {
    x.setDate(x.getDate() + 1);
    const dzien = x.getDay();
    if (dzien !== 0 && dzien !== 6) i++;
  }
  return x;
}

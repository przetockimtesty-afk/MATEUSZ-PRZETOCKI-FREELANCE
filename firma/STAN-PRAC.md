# Stan prac (aktualizacja 20.10.2026)

## Najważniejsze ustalenia

- Oferta: strony wizytówki, przez które klienci specjalistów sami umawiają konsultacje. Pakiety 1 200 / 1 800 (polecany) / 2 500 zł. Szczegóły w `PROFIL.md`.
- Własna strona: domena `mateuszprzetocki.pl` na hostingu LH.pl, WordPress działa (od 19.10).
- Wygląd: krem, piasek, czerń, jasny błękit. Fonty: Inter Tight, Instrument Serif, Inter. Wszystko jest w systemie marki.
- Branże: 3 ze stroną (doradcy kredytowi, biura rachunkowe, psycholodzy i terapeuci); potem agenci ubezpieczeniowi, fizjoterapeuci, kancelarie prawne i firmy remontowe, po jednej na tydzień; 12 kolejnych w 4 grupach na `/dla-kogo/`. Własny adres tylko z własną treścią, bez stron „branża + miasto”.
- Tytuł witryny: „Mateusz Przetocki”, opis „Strony, które umawiają konsultacje”. Tytuł SEO strony głównej: „Strony z kalendarzem konsultacji | Mateusz Przetocki”.
- Drogowskazu (`firma/drogowskaz/`) nie przebudowujemy, dopóki Mateusz o to nie poprosi.

## Zasady pracy z artefaktami

- Prezentacji A i B nie wysyłamy klientom jako linku.
- Projekt w Claude Design: plansz nie renderujemy ani nie sprawdzamy zrzutami, chyba że Mateusz poprosi. Przed publikacją `canvas.json` czytamy jego aktualną wersję.

## Zrobione 19.10.2026 (druga rozmowa)

- [x] Tytuły i opisy SEO wszystkich podstron dopisane do planu strony (claude.ai i `strona/plan-strony.md`, sekcja „Technika, SEO…”).
- [x] Link „Wszystkie branże” w stopce 15 plansz projektu (claude.ai, wersja 21, i `strona/projekt-claude-design/`).
- [x] Przepisy 4 nowych branż sprawdzone w podstawowym zakresie i dopisane do planu pod tabelą „Następne cztery branże”. Mateusz: nie wchodzimy szerzej, szczegóły zna klient.
- [x] Podstawowe ustawienia WordPressa: strefa Europe/Warsaw, opis witryny, statyczna strona główna, komentarze i pingbacki wyłączone, ikona witryny.
- [x] Cała strona z projektu Claude Design wgrana do WordPressa w blokach (14 podstron, nagłówek, stopka, menu, 404, fonty, kolory). Teksty i grafiki Mateusz edytuje w edytorze. Źródło: `strona/wordpress/`, opis instalacji: tabela „Ta instalacja” w `WP-REST.md`. Linki do ankiety, kalendarza i demo to na razie zaślepki (decyzja Mateusza).

## Zrobione 20.10.2026: wzór umowy z klientem

- [x] Własny wzór umowy o wykonanie strony (wersja 1), na podstawie dwóch przykładowych umów od Mateusza (wzór i specyfikacja innego wykonawcy), ale napisany od nowa pod nasze warunki: umowa § 1–11, Załącznik 1 Zamówienie, Załącznik 2 prawo odstąpienia z formularzem, Załącznik 3 protokół odbioru z przeniesieniem praw. Źródło `firma/umowy/`, na Dysku folder „Umowy” z Dokumentami Google „WZÓR · Umowa o wykonanie strony” i „Umowy · jak wypełniać i wysyłać” (opis i linki w `firma/umowy/README.md`).
- [x] Pola do podmiany w kolorach: żółte (klient i umowa), niebieskie (z propozycji), zielone (opcje), fioletowe (dane Mateusza, raz we wzorze). Nazwy pól jak w automacie propozycji (`{{NR_UMOWY}}`, `{{ZADATEK}}`…).
- [x] Sposób wysyłki: e-mail 1 z PDF i zdaniem do odpisania (akceptacja + żądanie rozpoczęcia prac przed upływem 14 dni), e-mail 2 z potwierdzeniem i PDF, po zapłacie Załącznik 3 na papierze w dwóch egzemplarzach (osobiście albo poleconym z kopertą zwrotną) albo podpisami kwalifikowanymi. Treść e-maili w instrukcji.
- [x] Wersja 2 (20.10): zdjęcie albo skan podpisanej umowy wystarcza do jej zawarcia (§ 10 ust. 1), ale nie do przeniesienia praw (§ 7 ust. 3, potrzebny oryginał). To samo w instrukcji i e-mailach 1 i 3. Na Dysku stare wersje i 3 pliki próbne są w koszu; w folderze „Umowy” zostały tylko 2 aktualne dokumenty.

## Otwarte sprawy

- [ ] Uogólnić ankietę A w `Kod.gs` pod wszystkie branże. Teraz nie robimy; przypomnieć, gdy Mateusz zapyta o niedokończone zadania.
- [ ] Dopasować prezentacje i szablon propozycji do nowych kolorów. Odłożone, niepilne.
- [ ] Usunąć folder `plan-freelancer/` ze starego repozytorium `oneproductstore`, jeśli wszystko jest skopiowane tutaj (Mateusz się zgodził). Zablokowane: sesja nie dostała dostępu do `oneproductstore`.
- [x] Zdjęcia Mateusza na stronie (19.10). Dwa zdjęcia z Dysku („zalozonerece_1.png”, „Projekt bez nazwy (17).png”) są na stronie głównej i „O mnie” jako portret, sylwetka i awatar przy imieniu. Mają tło w kolorach marki i są bez metadanych (media 92–94). Plików zdjęć nie ma w repozytorium.
- [ ] Opcjonalnie: zdjęcie przy pracy (np. przy laptopie) do małej ramki, którą teraz zajmuje sylwetka, i zdjęcia w większej rozdzielczości. Obecne mają 600 × 600 px i na dużych ekranach są lekko miękkie. Podmiana w edytorze: „Zastąp”.
- [x] Domena `mateuszprzetocki.pl` i hosting LH.pl kupione, strona działa (19.10).
- [ ] Unieważnić hasło aplikacji WordPress, które 19.10 trafiło do repozytorium w `.env` (plik usunięty, ale zostaje w historii Gita). Nowe hasło trzymać tylko w sekretach środowiska sesji, nigdy w repozytorium.
- [x] Dostęp do WordPressa działa (19.10): konto `agentai`, rola administrator, logowanie przez Network secret, poprawka nagłówka w `.htaccess`. Stan instalacji w tabeli „Ta instalacja” w `WP-REST.md`.
- [ ] Zdecydować, czy konto `agentai` zostaje administratorem, czy schodzi do roli Redaktor.
- [x] Ustawić w WordPressie strefę czasową Europe/Warsaw (19.10).
- [ ] Do startu 27.10 trzymać zaznaczone w wp-admin „Ustawienia → Czytanie → Proś wyszukiwarki o nieindeksowanie” (robi Mateusz, przez API się nie da). W dniu startu odznaczyć.
- [ ] Podmienić zaślepki na stronie, gdy będą gotowe:
  - linki: `#ankieta` (36 przycisków na wszystkich stronach), `#rozmowa` (13, kalendarz rozmowy), `#demo` (11), `#propozycja` (Jak pracuję), `#email` (Kontakt);
  - teksty: `kontakt@…` (stopka, Kontakt, polityka, regulamin; e-mail wpisuje Mateusz sam w edytorze, nie trafia do repozytorium), „[adres z danych z ustawy]” w stopce, „[adres zamieszkania albo do korespondencji…]” i „[data publikacji]” w polityce i regulaminie, trzy uwagi „do ustalenia z radcą” / „sprawdzić przed publikacją” w polityce prywatności.
- [ ] Umowa: Mateusz wpisuje we wzorze na Dysku swoje dane w fioletowe pola (adres, e-mail, numer konta) i pokazuje wzór radcy razem z polityką i regulaminem (lista 7 punktów na końcu instrukcji). Poprawki radcy przenieść też do `firma/umowy/umowa.src.html`.
- [ ] Regulamin strony, pkt 6 „Odstąpienie od umowy o stronę”: zamiast zaślepki „[Zasady odstąpienia… do ustalenia z radcą]” można wstawić skrót § 9 umowy, gdy radca go zatwierdzi.
- [ ] Zdecydować o wtyczkach WordPressa (propozycja z 19.10: Rank Math, cache, SMTP, Koko Analytics, Two Factor) i o własnych wtyczkach „MP Bloki” i „MP Linki”. Instalacja tylko za zgodą Mateusza.
- [ ] Po instalacji wtyczki SEO wpisać tytuły SEO z planu strony (opisy SEO już są w zajawkach stron).

## Ustalenia o WordPressie (19.10.2026)

- Zasady pracy: `WP-REST.md` (wczytywany przez `CLAUDE.md`), zapisy tylko przez `wp.py`: backup → zapis → weryfikacja frontu.
- Dane dostępu tylko w ustawieniach środowiska, nigdy w repozytorium (`.env` jest w `.gitignore`).
- Od 19.10 teksty i grafiki edytuje Mateusz w edytorze WordPressa. `strona/wordpress/wyslij.py` nie nadpisze jego zmian: zatrzymuje się przed zapisem i każe najpierw przenieść je do `zbuduj.js`.
- Ilustracje z telefonami i laptopami to obrazki wyrenderowane z plansz Claude Design (`strona/wordpress/renderuj.js`), nie bloki. Zmiana tekstu w nich = nowy render albo podmiana obrazka w edytorze („Zastąp”).
- Wygląd elementów (karty, etykiety, listy, pytania) daje CSS marki przez klasy `is-style-*`. Własna wtyczka „MP Bloki” może je zarejestrować jako style bloków, wtedy będą do wyboru w edytorze.

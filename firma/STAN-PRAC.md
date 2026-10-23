# Stan prac (aktualizacja 23.10.2026)

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

## Zrobione 20.10.2026: umowa z klientem

- [x] Własny wzór umowy o wykonanie strony, wersja 3 (uproszczona na prośbę Mateusza): jeden dokument, tabela zamówienia na górze, 15 krótkich punktów, podpisy, na ostatniej stronie informacja o odstąpieniu z formularzem. Pola: żółte do wpisania, zielone do wyboru. Źródło `firma/umowy/`, na Dysku folder „Umowy” z Dokumentami Google „WZÓR · Umowa o wykonanie strony” i „Umowa · jak używać” (linki w `firma/umowy/README.md`).
- [x] Podpisywanie bez spotkań i bez papieru: klient podpisuje i odsyła skan, zdjęcie albo podpis palcem na PDF w telefonie; podpis oznacza też prośbę o start od razu (bez czekania 14 dni). Mateusz wysyła 2 e-maile: „Umowa” i „Zaczynam” (ten drugi z podpisaną umową jest potwierdzeniem zawarcia).
- [x] Prawa autorskie: przeniesienie po zapłacie; przy podpisie na skanie klient ma licencję na 50 lat na tych samych polach, a Mateusz nie licencjonuje projektu i tekstów innym. Oryginał tylko na prośbę klienta.
- [x] Wersja 4: w umowie zaraz pod tabelką lista „Co obejmuje zamówienie” (pełna lista dla każdego z wariantów 1–3, w kopii dla klienta zostaje jedna), „Poza ceną” i „Co dostarcza Zamawiający”, więc klient nie musi szukać tego w propozycji.
- [x] Poprzednie wersje (1–3) i pliki próbne są w koszu Dysku.

## Zrobione 20.10.2026: wtyczka MP Rezerwacje

- [x] Własna wtyczka WordPress `strona/wtyczki/mp-rezerwacje/` (wersja 0.1.0): blok „Rezerwacja terminu” w stylu strony (dni jako kafelki, godziny jako pigułki, „Dalej: 3 krótkie pytania”), formularz z pytaniami, ekran „Do zobaczenia…”, e-maile z plikiem .ics, przypomnienia, strona „Twoja rezerwacja” do zmiany terminu i odwołania, panel Rezerwacje (lista spotkań, 7 zakładek ustawień, CSV, widżet w kokpicie), Kalendarz i Arkusz Google przez konto usługi (klient tylko udostępnia kalendarz, bez haseł), RODO. Gotowe zestawy: doradca kredytowy, psycholog, biuro rachunkowe. Opis i instrukcja: `README.md` wtyczki.
- [x] Przetestowana lokalnie (WordPress 7.1.3, SQLite, style strony): rezerwacja na telefonie i komputerze, 5 równoczesnych rezerwacji jednego terminu (przeszła 1), e-maile, zmiana i odwołanie, Google na atrapie API, panel, RODO. Lokalny WordPress i zrzuty są tylko w plikach tymczasowych sesji.

## Zrobione 20.10.2026: kalendarz na mateuszprzetocki.pl, krok 1

- [x] Wtyczka wgrana i włączona przez Mateusza (0.1.0, ten sam kod co w repozytorium). Gałąź z wtyczką i umowami scalona z `main`.
- [x] Ustawienia tej strony w pliku `strona/wordpress/rezerwacje-ustawienia.json` (szkielet wtyczki bez zmian): rozmowa 30 minut online, pn–pt 16:30–20:00, sob 9:00–13:00, święta wolne, 12 h wyprzedzenia, terminy na 30 dni naprzód, najwyżej 2 rozmowy dziennie, 15 minut przerwy, zmiana albo odwołanie do 12 h przed, 3 pytania (branża, adres obecnej strony, co przeszkadza w umawianiu), teksty kalendarza i e-maili. Bez e-maila, telefonu i linku Meet.
- [x] Strona „Umów rozmowę” `/rozmowa/` z kalendarzem jako szkic (id 100). W CSS strony: kalendarz nie chowa się pod przyklejonym nagłówkiem, a na stronie z kalendarzem nie ma dolnego paska z ankietą.
- [x] Próba na lokalnym WordPressie z tą samą wtyczką: plik wczytał się bez uwag, terminy zgodne z godzinami (także po zmianie czasu 25.10), rezerwacja na komputerze i telefonie, błędy formularza, e-maile do klienta i do Mateusza z plikiem .ics, bez błędów JavaScriptu.

## Plan od 23.10.2026 (notatka Mateusza, `firma/notatki/2026-10-23-notatka-z-telefonu.md`)

Ustalenia Mateusza z notatki: demo na razie znika ze strony (sekcje zostają w źródle). Realizacje pokazują na środku kalendarz z filmem, a pod nim 3 wcześniejsze projekty: bundle ze sticky barem, kalkulator prania tapicerki i kreator prezentów z podglądem na żywo. Od startu strona ma GA4, piksel Meta (PixelYourSite, wersja darmowa) i baner Complianz, a baza mailingowa powstaje od początku. Będzie jedna prezentacja sprzedażowa i krótka prezentacja „jak przebiega współpraca”. Filmy dla klientów są w playlistach „wymagane na start” i „dobrowolne”.

Etap 1, do startu we wtorek 27.10:
- [ ] 1. Ankieta wyceny na stronie zamiast ankiet Google A i B: wtyczka MP Ankiety (szkielet dla wszystkich klientów) i jedna ankieta z pytaniami zależnymi od branży. Odpowiedzi idą do automatu propozycji w `Kod.gs`, a na końcu jest dobrowolna zgoda na newsletter. Potem trzeba podpiąć 36 przycisków `#ankieta`.
- [ ] 2. Usunąć demo i zaślepki: stronę 50 przenieść do szkiców i usunąć 11 przycisków `#demo`. Zdjąć też karty Demo A (główna, Realizacje), sekcje demo na 3 stronach branż i link `#propozycja` (Jak pracuję). Zamiast demo: link do `/rozmowa/` albo film. Przedtem przenieść zmiany Mateusza z edytora do `zbuduj.js`.
- [ ] 3. Trzy nowe zasady na „O mnie” i na głównej. Propozycja do akceptacji:
  - wszystko jest Twoje, bez abonamentu;
  - techniką zajmuję się ja, bez Twoich haseł;
  - cena, termin i zakres na piśmie, do tego 30 dni wsparcia.
- [ ] 4. Realizacje: kalendarz na środku z filmem 30–40 s (nagranie na lokalnej kopii strony, MP4 bez YouTube'a), pod nim 3 projekty w układzie problem → co zrobiłem → co to daje. Zrzuty i opisy daje Mateusz; zrzuty puresofa.pl można zrobić samemu.
- [ ] 5. Complianz, PixelYourSite i GA4 (instalacja za zgodą Mateusza, identyfikatory od niego):
  - zdarzenia z wtyczek MP: ankieta wysłana, rozmowa umówiona;
  - test zgód w oknie prywatnym: przy kłopotach PixelYourSite z Complianz piksel idzie przez Complianz;
  - API konwersji na start wyłączone;
  - polityka prywatności i polityka cookies.
- [ ] 6. Mateusz: e-mail i adres w edytorze (stopka, Kontakt, polityka, regulamin), data publikacji. Dopiski „do ustalenia z radcą” zastąpić standardowym brzmieniem, radca sprawdzi je po starcie.

Etap 2, do pierwszego klienta (ok. 6.11):
- [ ] 7. Jeden proces po „TAK” w prezentacji, na „Jak pracuję” i w umowie:
  - umowa i zadatek 40% w 3 dni;
  - formularz materiałów i playlista „Na start”;
  - szkic w 5 dni roboczych od kompletu, 2 rundy poprawek;
  - odbiór, druga płatność i publikacja;
  - 30 dni wsparcia, opinia w dniu 14, podsumowanie w dniu 30.
- [ ] 8. Prezentacja „Jak przebiega współpraca” (6 slajdów, także jako PDF do umowy).
- [ ] 9. Jedna prezentacja sprzedażowa ze szkicu Mateusza (10 slajdów), z poprawkami:
  - badania tylko ze źródłem;
  - ceny gotowych systemów z datą;
  - „0 zł abonamentu za kalendarz” zamiast „0 zł/mc”;
  - nazwy pakietów jak na stronie, do decyzji;
  - zwrot z inwestycji z liczb z ankiety.
  Jako szablon dla automatu pomija slajdy niepasujące do branży.
- [ ] 10. Filmy w 3 playlistach: „Na start”, „Ułatwienia”, „Obsługa strony”. Scenariusze pisze Claude, nagrywa Mateusz. Do uwzględnienia:
  - w LH.pl są „Ustawienia → Uprawnienia do serwerów” zamiast wysyłania haseł;
  - przy linku partnerskim LH.pl powiedzieć wprost, że to polecenie;
  - Gmail od 2026 nie pobiera poczty przez POP3: przekierowanie i „Wyślij jako” albo skrzynka w aplikacji Gmail;
  - Google Workspace z organizacją założoną po maju 2024 domyślnie blokuje klucze kont usługi i osoby spoza domeny;
  - arkusz rezerwacji przez link `/copy`, bez skryptu.
- [ ] 11. Formularze na MP Ankiety, bez indeksowania: Materiały (pytania branżowe), Ustawienia kalendarza (z nich plik ustawień MP Rezerwacje), Uwagi do szkicu, Odbiór, Po 30 dniach.
- [ ] 12. MP Rezerwacje 0.1.1 (za zgodą Mateusza): e-maile i Google w tle, bez duplikatu po ponownym kliknięciu, zdarzenie dla GA4 i piksela.

Etap 3, po starcie:
- [ ] 13. Baza mailingowa:
  - zgody z ankiety od startu, zapisane w WordPressie Mateusza z datą i treścią zgody;
  - narzędzie do wysyłki przy pierwszym newsletterze: Brevo albo MailPoet;
  - bez własnej wysyłki.
- [ ] 14. Search Console i mapa strony w dniu startu, przegląd liczb po 2 tygodniach.

Czeka na Mateusza:
- decyzje: kolejność, zgoda na Complianz, PixelYourSite i MP Rezerwacje 0.1.1, nazwy pakietów (propozycja: bez zmian), treść 3 zasad;
- materiały: zrzuty i opisy 3 projektów, identyfikatory GA4 i piksela, konto partnera LH.pl;
- odpowiedź: czy wydarzenia z rezerwacji pojawiają się już w Kalendarzu Google.

## Otwarte sprawy

- [x] Kalendarz na mateuszprzetocki.pl działa (20.10): Mateusz wczytał ustawienia i dodał cron w LH.pl; strona `/rozmowa/` (100) opublikowana, 13 przycisków na 12 stronach prowadzi do niej, karta na Kontakcie i polityka prywatności (dane z rezerwacji, LH.pl, usuwanie po 365 dniach) zaktualizowane.
- [x] Instrukcja wdrażania kalendarza u klienta (12 kroków, pułapki, pomysły do szkieletu): `firma/wdrozenia/kalendarz-wdrozenie.html` → `Kalendarz_wdrozenie_u_klienta.pdf` (20.10).
- [x] Treść instrukcji jest na Dysku jako Dokument Google „Kalendarz u klienta · wdrożenie krok po kroku (MP Rezerwacje)” (20.10). [ ] Sam PDF (100 KB, za duży dla złącza) wgrywa Mateusz.
- [x] Strona bez nazwy Castoramy (decyzja Mateusza 20.10): nowy akapit o 5 latach rozmów z klientami przy sprzedaży na głównej i „O mnie”, na „O mnie” zdanie o własnym kalendarzu; na głównej nowa sekcja „Kto odpowie pierwszy, ten umawia klienta” (dwie drogi klienta i badanie Harvard Business Review 2011: kontakt w ciągu godziny = prawie 7× większa szansa na rozmowę niż godzinę później, po dobie ponad 60× mniejsza). Kopia planu strony w repozytorium poprawiona; w planie na claude.ai, w planszach Claude Design i w PROFIL.md nazwa zostaje (to pliki wewnętrzne).
- [ ] Kalendarz u Mateusza, dalsze kroki: zdjęcie twarzy (media 104) w zakładce Spotkania, próbna rezerwacja z własnym e-mailem (sprawdzić spam), skrzynka w domenie i wtyczka SMTP. Kalendarz Google w toku (20.10): projekt „KALENDARZ - FREELANCE” na koncie Mateusza, konto usługi bez ról, klucz JSON, kalendarz udostępniony z prawem „Wprowadzaj zmiany (wydarzenia prywatne jako zajęte)”; czeka na wynik „Sprawdź połączenie” i próbną rezerwację. Instrukcja wdrażania u klientów: `firma/wdrozenia/`.
- [ ] Zmienić w ustawieniach środowiska sesji `WP_URL` na `https://mateuszprzetocki.pl` (bez „www”). Sekret logowania działa tylko na adres bez „www”, z „www” jest 401.
- [ ] Pomysły do szkieletu wtyczki MP Rezerwacje (Mateusz kazał zapamiętać 20.10; niewprowadzone, do decyzji, opisane też w PDF z wdrożenia): przy pustym adresie powiadomień kalendarz pokazuje w kodzie strony e-mail administratora WordPressa; forma „Online” nie ma własnej nazwy (np. „Google Meet”); przewijanie do kalendarza nie uwzględnia przyklejonego nagłówka motywu (na tej stronie poprawione w CSS); ustawień nie da się zmienić przez REST, więc agent nie ustawi wtyczki u klienta sam (np. endpoint z uprawnieniem `manage_options`).
- [ ] Wtyczka MP Rezerwacje: test z prawdziwym kontem Google (konto usługi w Google Cloud Mateusza i testowy kalendarz): zajętość i zapis wydarzeń, dodatkowy kalendarz bez dostępu, odwołanie i ponowienie zapisu, całodniowe wydarzenie oznaczone jako „Zajęty”, arkusz. Najprościej na mateuszprzetocki.pl, gdy kalendarz będzie już działał.
- [ ] Wtyczka MP Rezerwacje: zdecydować o aktualizacjach (własny kanał aktualizacji z przyciskiem „Zaktualizuj” na stronach klientów albo ręczne wgrywanie ZIP) i o tym, czy klient ma sam zmieniać godziny i urlopy (dziś tylko administrator).

- [ ] Ankieta wyceny: zamiast uogólniania ankiety A w `Kod.gs` powstaje ankieta na stronie z pytaniami zależnymi od branży (plan z 23.10, punkt 1). W `Kod.gs` zostaje automat propozycji i dochodzi przyjmowanie odpowiedzi ze strony.
- [ ] Dopasować prezentacje i szablon propozycji do nowych kolorów. Odłożone, niepilne.
- [ ] Usunąć folder `plan-freelancer/` ze starego repozytorium `oneproductstore`, jeśli wszystko jest skopiowane tutaj (Mateusz się zgodził). Zablokowane: sesja nie dostała dostępu do `oneproductstore`.
- [x] Zdjęcia Mateusza na stronie, nowe z 20.10 (WebP z Dysku: „zalozonerece_1 (1).webp”, „recewkieszeni 1.webp”, „Nowoczesne biuro programisty z polską stroną internetową.webp”). Na głównej duże z założonymi rękami, na „O mnie” duże z rękami w kieszeniach, na obu małe przy komputerze, a na górze głównej twarz przy imieniu. Media 101–104, bez metadanych. Stare zdjęcia z 19.10 (media 92–94) usunięte z WordPressa. Plików zdjęć nie ma w repozytorium.
- [ ] Opcjonalnie: wycięte zdjęcia mają 600 × 600 px i na dużych ekranach są lekko miękkie; większe oryginały poprawią ostrość. Podmiana w edytorze: „Zastąp”.
- [ ] Na Dysku obok nowych zdjęć WebP leżą ich wersje PNG (3 pliki z 20.10). Zostawione do decyzji Mateusza.
- [x] Domena `mateuszprzetocki.pl` i hosting LH.pl kupione, strona działa (19.10).
- [ ] Unieważnić hasło aplikacji WordPress, które 19.10 trafiło do repozytorium w `.env` (plik usunięty, ale zostaje w historii Gita). Nowe hasło trzymać tylko w sekretach środowiska sesji, nigdy w repozytorium.
- [x] Dostęp do WordPressa działa (19.10): konto `agentai`, rola administrator, logowanie przez Network secret, poprawka nagłówka w `.htaccess`. Stan instalacji w tabeli „Ta instalacja” w `WP-REST.md`.
- [ ] Zdecydować, czy konto `agentai` zostaje administratorem, czy schodzi do roli Redaktor.
- [x] Ustawić w WordPressie strefę czasową Europe/Warsaw (19.10).
- [ ] Do startu 27.10 trzymać zaznaczone w wp-admin „Ustawienia → Czytanie → Proś wyszukiwarki o nieindeksowanie” (robi Mateusz, przez API się nie da). W dniu startu odznaczyć.
- [ ] Podmienić zaślepki na stronie, gdy będą gotowe:
  - linki: `#ankieta` (36 przycisków na wszystkich stronach), `#demo` (11), `#propozycja` (Jak pracuję), `#email` (Kontakt);
  - teksty: `kontakt@…` (stopka, Kontakt, polityka, regulamin; e-mail wpisuje Mateusz sam w edytorze, nie trafia do repozytorium), „[adres z danych z ustawy]” w stopce, „[adres zamieszkania albo do korespondencji…]” i „[data publikacji]” w polityce i regulaminie, trzy uwagi „do ustalenia z radcą” / „sprawdzić przed publikacją” w polityce prywatności.
- [ ] Umowa: Mateusz wpisuje we wzorze na Dysku swój adres, e-mail i numer konta, wstawia zdjęcie podpisu nad linią „Wykonawca” i pokazuje wzór radcy razem z polityką i regulaminem (szczególnie pkt 2 start od razu, 9–10 prawa autorskie i licencja na skanie, 12–14 odstąpienie, zadatek, RODO). Poprawki radcy przenieść też do `firma/umowy/umowa.src.html`.
- [ ] Regulamin strony, pkt 6 „Odstąpienie od umowy o stronę”: zamiast zaślepki „[Zasady odstąpienia… do ustalenia z radcą]” można wstawić skrót § 9 umowy, gdy radca go zatwierdzi.
- [ ] Zdecydować o wtyczkach WordPressa (propozycja z 19.10: Rank Math, cache, SMTP, Koko Analytics, Two Factor) i o własnych wtyczkach „MP Bloki” i „MP Linki”. Instalacja tylko za zgodą Mateusza.
- [ ] Po instalacji wtyczki SEO wpisać tytuły SEO z planu strony (opisy SEO już są w zajawkach stron).

## Ustalenia o WordPressie (19.10.2026)

- Na stronie nie wymieniamy nazwy Castoramy (Mateusz, 20.10). Badania na stronie tylko z prawdziwym źródłem i linkiem.
- Zasady pracy: `WP-REST.md` (wczytywany przez `CLAUDE.md`), zapisy tylko przez `wp.py`: backup → zapis → weryfikacja frontu.
- Dane dostępu tylko w ustawieniach środowiska, nigdy w repozytorium (`.env` jest w `.gitignore`).
- Od 19.10 teksty i grafiki edytuje Mateusz w edytorze WordPressa. `strona/wordpress/wyslij.py` nie nadpisze jego zmian: zatrzymuje się przed zapisem i każe najpierw przenieść je do `zbuduj.js`.
- Ilustracje z telefonami i laptopami to obrazki wyrenderowane z plansz Claude Design (`strona/wordpress/renderuj.js`), nie bloki. Zmiana tekstu w nich = nowy render albo podmiana obrazka w edytorze („Zastąp”).
- Wygląd elementów (karty, etykiety, listy, pytania) daje CSS marki przez klasy `is-style-*`. Własna wtyczka „MP Bloki” może je zarejestrować jako style bloków, wtedy będą do wyboru w edytorze.
- Wtyczka MP Rezerwacje to szkielet wspólny dla wszystkich klientów (ustalenie Mateusza z 20.10). Ustawień jego strony ani innych konkretnych stron nie wpisujemy do jej kodu ani do `branze/`: trzymamy je w pliku ustawień poza katalogiem wtyczki (u Mateusza `strona/wordpress/rezerwacje-ustawienia.json`) i w CSS strony.

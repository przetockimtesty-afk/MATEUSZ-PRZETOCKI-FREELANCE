# Stan prac (aktualizacja 28.10.2026)

## Najważniejsze ustalenia

- Oferta: strony wizytówki, przez które klienci specjalistów sami umawiają konsultacje. Pakiety 1 200 / 1 800 (polecany) / 2 500 zł. Szczegóły w `PROFIL.md`.
- Własna strona: domena `mateuszprzetocki.pl` na hostingu LH.pl, WordPress działa (od 19.10).
- Wygląd: krem, piasek, czerń, jasny błękit. Fonty: Inter Tight, Instrument Serif, Inter. Wszystko jest w systemie marki.
- Branże: 3 ze stroną (doradcy kredytowi, biura rachunkowe, psycholodzy i terapeuci); potem agenci ubezpieczeniowi, fizjoterapeuci, kancelarie prawne i firmy remontowe, po jednej na tydzień; 12 kolejnych w 4 grupach na `/dla-kogo/`. Własny adres tylko z własną treścią, bez stron „branża + miasto”.
- Tytuł witryny: „Mateusz Przetocki”, opis „Strony, które umawiają konsultacje”. Tytuł SEO strony głównej: „Strony z kalendarzem konsultacji | Mateusz Przetocki”.
- Drogowskazu (`firma/drogowskaz/`) nie przebudowujemy, dopóki Mateusz o to nie poprosi.

## Zasady pracy z artefaktami

- Prezentacji sprzedażowej (ani starych A i B) nie wysyłamy klientom jako linku, bo w notatkach są ściągi. Prezentacja „Jak przebiega współpraca” może iść do klienta jako PDF z umową.
- Prezentacje w claude.ai (typ Slides) sprawdzamy dopiero wtedy, gdy Mateusz poprosi: bez renderowania i zrzutów.
- Projekt w Claude Design: plansz nie renderujemy ani nie sprawdzamy zrzutami, chyba że Mateusz poprosi. Przed publikacją `canvas.json` czytamy jego aktualną wersję.
- Od 26.10 ważne materiały (zadania, podsumowania, PDF-y i prezentacje) od razu trafiają na Dysk, a ich nowe wersje też (zasady w `CLAUDE.md`, „Dysk Google”).

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
- [x] 1. (26.10, bez automatu) Ankieta wyceny na stronie zamiast ankiet Google A i B: wtyczka MP Ankiety (szkielet dla wszystkich klientów) i jedna ankieta z pytaniami zależnymi od branży. Odpowiedzi idą do automatu propozycji w `Kod.gs`, a na końcu jest dobrowolna zgoda na newsletter. Potem trzeba podpiąć 36 przycisków `#ankieta`.
  - [x] Wtyczka MP Ankiety 0.1.0 i 6 ankiet (25.10), test lokalny z banerem zgód: cała ścieżka, przywracanie po odświeżeniu, e-maile, zdarzenie `mp_ankieta_wyslana`.
  - [x] Strony w WordPressie jako szkice (25.10): `/wycena/` (136) i formularze tylko z linku `/materialy/` (137), `/ustawienia-kalendarza/` (138), `/uwagi-do-szkicu/` (139), `/odbior-strony/` (140), `/po-30-dniach/` (141).
  - [x] `Kod.gs`: przyjmowanie odpowiedzi ze strony i co noc usuwanie odpowiedzi starszych niż rok; instrukcja w `firma/automatyzacja/INSTRUKCJA.md` („Ankieta na stronie”).
  - [x] Mateusz (26.10): ZIP-y wgrane, na stronie MP Rezerwacje 0.1.1 i MP Ankiety 0.1.0.
  - [ ] Mateusz: wdrożyć `Kod.gs` jako aplikację internetową i wkleić adres i sekret w Ankiety → Ustawienia → Automat. Do tego czasu odpowiedzi zapisują się na stronie i przychodzą e-mailem, bez prezentacji i szkicu propozycji.
  - [x] Agent (26.10): `ANKIETY_WLACZONE = true`, 38 przycisków prowadzi do `/wycena/` (34 na stronach, w tym szkic demo, 4 w nagłówku, stopce i na stronie 404). `/wycena/` i 5 formularzy opublikowane; formularze mają noindex, nofollow i nie ma ich w mapie strony. Ustawienia ankiet domyślne: powiadomienia na adres administratora, nadawca „Mateusz Przetocki”. Próbna ankieta na telefonie przeszła (odpowiedź 201, bez błędów).
- [x] 2. (26.10, przełącznik `DEMO_WLACZONE` w `zbuduj.js`) Usunąć demo i zaślepki: stronę 50 przenieść do szkiców i usunąć 11 przycisków `#demo`. Zdjąć też karty Demo A (główna, Realizacje), sekcje demo na 3 stronach branż i link `#propozycja` (Jak pracuję). Zamiast demo: link do `/rozmowa/` albo film. Przedtem przenieść zmiany Mateusza z edytora do `zbuduj.js`.
- [x] 3. (26.10) Trzy nowe zasady na „O mnie” i na głównej (`ZASADY` w `zbuduj.js`). Zaakceptowane przez Mateusza:
  - wszystko jest Twoje, bez abonamentu;
  - techniką zajmuję się ja, bez Twoich haseł;
  - cena, termin i zakres na piśmie, do tego 30 dni wsparcia.
- [x] 4. (26.10, bez zrzutów) Realizacje: kalendarz na środku z filmem 30–40 s (nagranie na lokalnej kopii strony, MP4 bez YouTube'a), pod nim 3 projekty w układzie problem → co zrobiłem → co to daje. Zrzuty i opisy daje Mateusz; zrzuty puresofa.pl można zrobić samemu.
  - [x] Film 34 s z napisami (telefon, 780 × 1688, MP4 1,2 MB) w mediach WordPressa: 143, okładka 144. Na filmie jest zdjęcie Mateusza, więc pliku nie ma w repozytorium. Skrypt nagrania był w plikach tymczasowych sesji (CDP screencast przy html zoom 2).
  - [x] Karta filmu na głównej, przyciski „Zobacz film z kalendarza” na głównej i 3 stronach branż.
  - [x] Zapowiedź strony klientki („od listopada”) usunięta 26.10 na prośbę Mateusza: karta na Realizacjach, zdanie w nagłówku Realizacji, dopisek na głównej i w odpowiedzi „Czy robiłeś już takie projekty?”. Wróci, gdy strona klientki będzie gotowa.
  - [x] Film z kalendarza na telefonie był przesunięty o 20 px w prawo (ramka liczona poza szerokością); poprawka `box-sizing` w `marka.css` 26.10.
  - [x] Zaślepki zdjęte 26.10: karty projektów są bez obrazka, dopóki nie ma zrzutu (`ZRZUTY` w `zbuduj.js`: klucz z `media.json` albo null).
  - [ ] Mateusz: zrzuty i opisy 3 projektów (Mateusz poprosił, żeby tego nie robić za niego). Zrzut wgrywamy do mediów, wpisujemy klucz w `ZRZUTY` i wysyłamy stronę.
- [x] 5. (25–26.10) Complianz, PixelYourSite i GA4 (instalacja za zgodą Mateusza, identyfikatory od niego):
  - zdarzenia z wtyczek MP: ankieta wysłana, rozmowa umówiona;
  - test zgód w oknie prywatnym: przy kłopotach PixelYourSite z Complianz piksel idzie przez Complianz;
  - API konwersji na start wyłączone;
  - polityka prywatności i polityka cookies.
  - Zrobione: Complianz po kreatorze Mateusza (ściąga `firma/wdrozenia/complianz-kreator.md`) blokuje PixelYourSite do zgody (sprawdzone w kodzie strony 26.10: skrypty `type="text/plain"`, kategoria marketing). Piksel 1850828869571123 i GA4 G-1K161TZP9R wpisał Mateusz (import profilu PYS na świeżej instalacji nie zapisuje ID: błąd wtyczki). API konwersji włączył Mateusz; też działa dopiero po zgodzie, bo zdarzenia z serwera wysyła zablokowany skrypt. Nowa strona `/polityka-cookies/` (133), linki i przycisk „Ustawienia cookies” w stopce, baner w kolorach marki.
  - [ ] Mateusz: znacznik weryfikacji domeny Meta w PixelYourSite → „Verify your domain” (pole puste); jeśli token API konwersji to ten z czatu, wygenerować nowy; drugi skan Complianz (Website Scan → Skanuj, Cookiedatabase → Synchronizuj), żeby polityka cookies miała listę ciasteczek; opcjonalnie krótszy tekst baneru (propozycja w ściądze).
- [x] (26.10) Pasek z przyciskiem na telefonie: wersja A z trzech pokazanych (jasna karta „Wycena w 5 minut · Propozycja w 48 h · bez zobowiązań” i mały przycisk „Wyceń stronę”). Na komputerze i na stronach z kalendarzem albo ankietą ukryty; miejsce na pasek jest na dole stopki, w jej kolorze. Sprawdzony na telefonie 360 i 390 px.
- [x] 6. (25.10) Mateusz: e-mail i adres w edytorze (stopka, Kontakt, polityka, regulamin), data publikacji. Dopiski „do ustalenia z radcą” zastąpić standardowym brzmieniem, radca sprawdzi je po starcie.

Etap 2, do pierwszego klienta (ok. 6.11):
- [x] 7. (26.10) Jeden proces po „TAK” w prezentacji, na „Jak pracuję” i w umowie (`PROCES` w `zbuduj.js`, strona 47 wysłana 26.10, umowa już miała te warunki):
  - umowa i zadatek 40% w 3 dni;
  - formularz materiałów i playlista „Na start”;
  - szkic w 5 dni roboczych od kompletu, 2 rundy poprawek;
  - odbiór, druga płatność i publikacja;
  - 30 dni wsparcia, opinia w dniu 14, podsumowanie w dniu 30.
- [x] 8. (26.10) Prezentacja „Jak przebiega współpraca” (6 slajdów): https://claude.ai/artifact/YJJgiBYqYbL56kq6dz7bvA, źródło w `firma/prezentacje/wspolpraca/`. [ ] PDF do umowy eksportuje Mateusz (Udostępnij → Eksport → PDF).
- [x] 9. (26.10) Jedna prezentacja sprzedażowa ze szkicu Mateusza: https://claude.ai/artifact/HXPH6cbCgCu9JELWYmmzaz, źródło w `firma/prezentacje/sprzedaz/`. Klient widzi 11 slajdów (10 z notatki i „Czy dobrze rozumiem?” z liczbami z ankiety), w szablonie jest 14, bo 3 slajdy mają wersję A i B. Pytania Mateusza są w notatkach. Poprawki:
  - badania tylko ze źródłem: „zasada 5 minut” zastąpiona badaniem Harvard Business Review 2011 (pierwsza godzina), „co trzecia osoba” z Mayo Clinic 2021;
  - ceny gotowych systemów z datą 26.10.2026: Booksy Biz 145 zł netto/mies., Bookero 19,90–89,90 zł (Kalendarz Google dopiero w Premium), SimplyBook.me Basic 13,90 USD, Calendly Standard 10 USD przy płatności rocznej;
  - „0 zł abonamentu za kalendarz”, a obok koszt domeny i hostingu;
  - zdanie „zwraca się w pierwszym roku” usunięte (nieprawda przy tańszych abonamentach); w notatkach: taniej niż Booksy po 13–20 miesiącach, niż Bookero Premium po ok. 2–3 latach;
  - nazwy pakietów jak na stronie, ceny z `USTAWIENIA.ceny`;
  - zwrot z inwestycji z liczb z ankiety: nowe pola `{{ZWROT}}` i `{{ZWROT_CZAS}}` w `Kod.gs`;
  - demo zastąpione testem na żywo na `/rozmowa/` albo filmem z kalendarza; na końcu propozycja, umowa i zadatek (Useme jako faktura VAT).
  Szablon dla automatu: znaczniki `[tylko A]`, `[tylko B]` i `[liczby z ankiety]` w notatkach; `Kod.gs` pomija według nich slajdy, a ten sam plik w `szablonA` i `szablonB` daje jeden szablon Google (test na atrapie Apps Script 26.10). Instrukcja: `firma/automatyzacja/INSTRUKCJA.md`, „Prezentacja sprzedażowa zamiast A i B”.
- [ ] 10. Filmy w 3 playlistach: „Na start”, „Ułatwienia”, „Obsługa strony”. Scenariusze pisze Claude, nagrywa Mateusz. Scenariusze gotowe 26.10: `firma/filmy/scenariusze.md`, ich kopia i tabela ze statusem nagrania w rozpisce (link wyżej, „Czeka na Mateusza”). Do uwzględnienia:
  - w LH.pl są „Ustawienia → Uprawnienia do serwerów” zamiast wysyłania haseł;
  - przy linku partnerskim LH.pl powiedzieć wprost, że to polecenie;
  - Gmail od 2026 nie pobiera poczty przez POP3: przekierowanie i „Wyślij jako” albo skrzynka w aplikacji Gmail;
  - Google Workspace z organizacją założoną po maju 2024 domyślnie blokuje klucze kont usługi i osoby spoza domeny;
  - arkusz rezerwacji przez link `/copy`, bez skryptu.
  - [x] (28.10) Playlista 1 przepisana do nagrania, z decyzją, co jest potrzebne do startu: 7 filmów z tekstem lektora (kolumny „Na ekranie” i „Mówisz”), gdzie nagrywać, co sprawdzić przed nagraniem, co robi Mateusz po kroku klienta, opisy na YouTube, nowy e-mail „Zaczynam” z krokami po kolei i e-mail z adresem konta usługi. Źródło `firma/filmy/na-start.html`, Dokument Google „Scenariusze · filmy „Na start” dla klienta” w folderze firmy. Nowe: 1.4 projekt Google Cloud klienta z rolą „Edytujący” dla Mateusza (wariant A wtyczki), 1.6 stały link Meet (całodniowe wydarzenie co roku, „Wolny”), 1.7 zdjęcie telefonem. Wypadły: arkusz `/copy` (nie ma wzoru, dodatek), film o formularzu materiałów, ID kalendarza. Nazwy przycisków LH.pl i Google sprawdzone tylko przez wyszukiwarkę (sesja nie otwiera lh.pl ani support.google.com), więc przy każdym filmie jest lista „Sprawdź przed nagraniem”.
  - [ ] Mateusz (28.10): nagranie 7 filmów, wgranie jako niepubliczne do playlisty „Na start”, linki w czacie. Potem: linki do e-maila „Zaczynam” w „Umowa · jak używać” (Dysk i `firma/umowy/instrukcja.src.html`) i do dokumentu ze scenariuszami.
  - [ ] Przy okazji nagrania filmu 1.4: pierwszy test wariantu A na prawdziwym koncie Google (projekt testowy, konto usługi, „Sprawdź połączenie”).
  - [x] (28.10, prośba Mateusza) Prezentacja „Jak przebiega współpraca”, slajd 3: kroki klienta w kolejności filmów (domena i hosting, Kalendarz Google w dwóch krokach, dwa formularze), notatki z numerami filmów 1.2–1.7. Wersja 7 na claude.ai, źródło `firma/prezentacje/wspolpraca/slides/materialy.html`. PDF do umowy trzeba wyeksportować od nowa.
- [ ] 11. Formularze na MP Ankiety, bez indeksowania: Materiały (pytania branżowe), Ustawienia kalendarza (z nich plik ustawień MP Rezerwacje), Uwagi do szkicu, Odbiór, Po 30 dniach.
- [x] 12. (25.10) MP Rezerwacje 0.1.1 (za zgodą Mateusza): e-maile i Google w tle, bez duplikatu po ponownym kliknięciu, zdarzenie dla GA4 i piksela, usuwanie spotkań. ZIP w `strona/wtyczki/zip/`, wgrywa Mateusz (Etap 1, punkt 1).

Etap 3, po starcie:
- [ ] 13. Baza mailingowa:
  - zgody z ankiety od startu, zapisane w WordPressie Mateusza z datą i treścią zgody;
  - narzędzie do wysyłki przy pierwszym newsletterze: Brevo albo MailPoet;
  - bez własnej wysyłki.
- [ ] 14. Search Console i mapa strony w dniu startu, przegląd liczb po 2 tygodniach. Od 26.10 strony publiczne są już do indeksowania (bez noindex), a mapa strony to `https://mateuszprzetocki.pl/sitemap_index.xml` (Rank Math, 16 stron, bez formularzy dla klientów i szkicu demo). Search Console można dodać od razu i zgłosić w nim tę mapę.
- [x] 15. (26.10) SEO na Rank Math (wybór Mateusza zamiast Yoast; Yoast zainstalowany, wyłączony, do usunięcia): tytuły z planu strony (`TYTULY_SEO` w `zbuduj.js`), opisy z zajawek, formularze dla klientów noindex i poza mapą, separator „|”, polska strona 404, archiwa autorów wyłączone, dane dla Google: Ty na głównej, okruszki na podstronach. Wysyła `python3 strona/wordpress/wyslij.py seo`. Rejestrację konta Rank Math Mateusz pominął w wp-admin.

  Zamiast wpisywania w edytorze: dane kontaktowe są we wzorcach synchronizowanych „Dane kontaktowe · …” (126 e-mail na Kontakcie, 127 usługodawca w polityce i regulaminie, 128 stopka), tylko w WordPressie. Adres tylko w polityce i regulaminie, telefonu na stronie nie ma (decyzja z 25.10: strona „bez telefonu”). Polityka i regulamin mają standardowe brzmienie z datą 25.10.2026, radca sprawdzi je po starcie.

E-maile ze strony (26.10): WP Mail SMTP nie logował się do skrzynki („Could not authenticate”), więc nie wychodziła żadna poczta, także reset hasła. Mateusz poprawił login i hasło skrzynki (według niego „chyba działa”). Hasło tymczasowe do konta `mateuszprzetocki` ustawione przez API na jego prośbę; ma je zmienić w Profilu. Około 6:00 agent wysłał próbną ankietę i zrobił próbną rezerwację (sobota 21.11, 12:30, „TEST Claude – proszę usunąć”), obie na adres administratora. Czeka na potwierdzenie Mateusza, że przyszły 4 e-maile, i na usunięcie obu prób w panelu (Rezerwacje → Spotkania, Ankiety).

Czeka na Mateusza (26.10). Wszystko w jednym pliku: `firma/zadania/Zadania_Mateusza.pdf` (9 stron: dziś, do pierwszego klienta, później, 9 decyzji, linki, scenariusze filmów; źródło `zadania.html`, PDF z `node firma/zadania/zbuduj.js`; Mateusz dostał go w czacie 26.10; na Dysku jest ta sama treść jako Dokument Google „Zadania · wszystko w jednym miejscu (stan na 26.10.2026)”, a sam PDF wgrywa Mateusz, bo jest za duży dla złącza). Ta sama lista do odhaczania: rozpiska https://claude.ai/artifact/H7J4xq9ZYfYWBnhPVr8T1a (zakładki „Do zrobienia” i „Scenariusze filmów”; odhaczenia i statusy są tylko tam). Przy zmianie zadań poprawiać oba miejsca:
- sprawdzić, czy próbna rezerwacja (sob 21.11, 12:30) jest w Kalendarzu Google: w kalendarzu konta Google podłączonego do sesji jej nie ma. Jeśli u Mateusza też nie, połączenie z Google nie działa (Rezerwacje → Ustawienia → Google → Sprawdź połączenie);
- potwierdzić, że doszły e-maile z próbnej ankiety i rezerwacji, potem usunąć obie próby w panelu; zmienić hasło tymczasowe;
- wdrożenie `Kod.gs` i adres z sekretem w Ankiety → Ustawienia → Automat;
- znacznik weryfikacji domeny Meta, ewentualnie nowy token API konwersji, drugi skan Complianz;
- zrzuty i opisy 3 projektów;
- prezentacja sprzedażowa w automacie: eksport do PowerPointa z notatkami, plik na Dysk, ten sam link w `szablonA` i `szablonB`, e-mail w `USTAWIENIA.podpis`, `setup` i nowa wersja wdrożenia (instrukcja, „Prezentacja sprzedażowa zamiast A i B”);
- PDF „Jak przebiega współpraca” do umowy (eksport z claude.ai);
- nagrania filmów według `firma/filmy/scenariusze.md`;
- decyzja: wersja B w automacie to nadal stara oferta z kalkulatorem (1 600 / 2 500 / 3 400 zł, „Strona, która wycenia”), a strona pokazuje firmom remontowym te same pakiety co innym (1 200 / 1 800 / 2 500 zł). Slajdy B w prezentacji biorą nazwy i ceny z automatu. Zostawić B czy ujednolicić?
- Search Console (indeksowanie jest już włączone, opcja „Proś wyszukiwarki o nieindeksowanie” jest odznaczona): Prefiks URL, tag HTML wklejony w Rank Math (albo kod do agenta, wpisze przez API), potem mapa `sitemap_index.xml`;
- usunąć wyłączoną wtyczkę Yoast;
- decyzje z PDF i rozpiski (9 spraw), m.in. obrazek do udostępniania linku 1200 × 630 px (dziś strona nie ma `og:image`), rola konta `agentai`, Two Factor i cache, narzędzie do newslettera, aktualizacje MP Rezerwacje u klientów;
- decyzja: na górze głównej nadal jest ilustracja telefonu z dema („Projekt demonstracyjny”, Anna Nowak); można ją zamienić na kadr z filmu kalendarza.

## Automat propozycji (27.10)

- [x] `Kod.gs`: `setup` padał na starej ankiecie Google (`moveItem` z `TextItem`); poprawka i odporność na przerwany setup (atrapa FormApp). Mateusz wkleił kod, `setup` przeszedł, mail z linkami poszedł na adres z `USTAWIENIA.email` (skrzynka firmowa).
- [x] MP Ankiety 0.1.1: „Sprawdź połączenie z automatem” dawało kod 400, bo WordPress po przekierowaniu Apps Script wysyłał GET z treścią, a Google go odrzuca. Wtyczka pobiera teraz wynik osobnym GET-em bez treści (atrapa zachowująca się jak Google: stara wersja 400, nowa ok). ZIP `strona/wtyczki/zip/mp-ankiety-0.1.1.zip`.
- [x] Mateusz wgrał MP Ankiety 0.1.1; połączenie z automatem działa, test `/wycena/` dał prezentację, szkic propozycji i mail „Gotowe” (mail przyszedł po `USTAWIENIA.email: ''`: Gmail chowa wiadomość, która wraca do nadawcy przez przekierowanie).
- [x] Szablon „Szablon A · Google Slides” poprawiony ręcznie w Google Slides (27.10): konwersja z PPTX rozbiła tytuły slajdów 1 i 14 na osobne pola („i nie płacić” + „abonamentu”, „Trzy kroki do” + „startu”), które przy innej szerokości czcionki zawijały się i nachodziły na podtytuł. Teraz każdy tytuł to jedno pole z wyróżnionym słowem (Instrument Serif, kursywa). Przesunięte też: podtytuł i plakietki na slajdzie 1, podpis pierwszej karty na slajdzie 2, opis w niebieskiej karcie na slajdzie 8, opis trzeciej karty na slajdzie 13. Prezentacje wygenerowane wcześniej (np. Jadwiga Test) mają stary układ. Uwaga: nowy eksport PPTX z claude.ai wklejony w `USTAWIENIA` znowu rozbije tytuły, więc szablon poprawiamy w Google Slides, a nie eksportem.

## Dysk na koncie kontakt (27.10)

- [x] Złącza Google (Dysk, Dokumenty, Prezentacje, Arkusze, Kalendarz, Gmail) przełączone na przetockimateusz.kontakt@gmail.com. Nowy folder „Mateusz Przetocki Freelance” z kopiami wszystkich plików ze starego folderu (puresofaadmin, archiwum), nazwy z rodzajem na początku, spis „00 · Przeczytaj najpierw”, podfoldery „Umowy” i „Zdjęcia na stronę”. Dowgrane z repozytorium: instrukcja automatu i ściąga Complianz.
- Mateusz odhacza zadania w Dokumencie Google „Zadania · co mam do zrobienia”; 27.10 usunął z listy hasło tymczasowe, Yoasta i drugi skan Complianz (do potwierdzenia, że zrobione). Ten dokument jest nowszy niż `firma/zadania/zadania.html`.
- [x] (28.10) Spis „00 · Przeczytaj najpierw”: nowe wiersze „Scenariusze · filmy „Na start” dla klienta” i „Prezentacja sprzedażowa (PowerPoint)”, rodzaje plików Scenariusze i Prezentacja, PREZENTACJE opisane jako zbędne. W „Zadania · co mam do zrobienia” lista filmów zmieniona na 7, z odnośnikiem do scenariuszy; stary załącznik dla playlisty 1 oznaczony jako nieaktualny (odhaczenia Mateusza bez zmian).
- [ ] Do decyzji Mateusza: wygenerowane prezentacje i propozycje z 15–16.10 w folderze „Ankiety i prezentacje klientów” (Elżbieta Krawczyk, Wiktoria Florczyk: próby czy prawdziwe osoby?) i stare PowerPointy A i B w folderze „PREZENTACJE” (zbędne po przejściu automatu na prezentację sprzedażową).

## Strona i oferta: propozycja zmian (28.10)

Pytania Mateusza z 28.10: za dużo tekstu i podstron, oferta zamiast branż, porównanie z Booksy, czy ankieta jako główny przycisk ma sens, sprzedaż własna zamiast Google, faktury tylko przez Useme. Do tego transkrypt filmu „Jak nigdy więcej nie martwić się o klientów” (równanie wartości Hormoziego, kontakt w 5–10 minut, rozmowa SPIN, pytanie odsiewające w formularzu, przebieg). Pomiary z 28.10: 13 stron z treścią, ok. 5 000 słów; główna na telefonie 16 110 px (19 ekranów), 11 sekcji, ok. 930 słów, 10 przycisków (5 do ankiety); strony branż ok. 10 ekranów.
- [x] Plan w Dokumencie Google „Plan · strona i oferta: co zmienić (propozycja z 28.10)” (źródło `strona/plan-zmian-2026-10-28.html`): główna z 8 sekcjami i ok. 500 słowami, z 13 stron zostają 4 (główna, Realizacje, `/rozmowa/`, `/wycena/`) plus prawne i formularze; reszta jako szkice z przekierowaniem 301; główny przycisk „Umów 15 minut”, ankieta jako druga droga; porównanie z Booksy Biz (145 zł netto/mies., 3 lata 5 220 zł wobec ok. 2 500–2 600 zł); gwarancje do wyboru; Useme: VAT 23% (dla klientów bez odliczenia VAT pakiet 1 800 zł netto to 2 214 zł), opłata 7,8% (min. 29, maks. 349 zł, kto płaci: do sprawdzenia), zadatek do sprawdzenia; Useme także jako źródło zleceń.
- [x] (28.10) Dopisana część „Ceny: zostawić czy podnieść”: ceny zostają jako startowe dla 3 pierwszych firm w zamian za opinię, potem ok. 2 400 zł (z kalendarzem) i 3 200 zł (Pełny start) netto; każdy pakiet z kalendarzem (Wizytówka bez kalendarza tylko na prośbę, pierwszy pakiet: kalendarz na obecnej stronie WordPress, dziś od 800 zł). Rynek według wyszukiwania: strona firmowa do 5 podstron średnio 6 000 zł (CenaUslug), kalendarze od 29 zł (Calendesk), 99 zł (Theraplo) do 145 zł miesięcznie (Booksy Biz); jedno zlecenie psychologa na Useme miało 73 oferty.
- [x] (28.10) Decyzje Mateusza: bez Wizytówki bez kalendarza (8; zmienione później tego dnia: zostają 3 pakiety, niżej), ceny teraz startowe, podwyżka później (5), kierunek: prosty landing prowadzący do rozmowy na Google Meet, ze spójną ofertą, korzyściami i bezpieczeństwem klienta, bez podziału na branże (1 i 2). Strony branż zostają w tle dla Google: opublikowane, w mapie strony, bez menu, link w stopce, ta sama oferta i przycisk; bez ukrytego tekstu. Zapisane na górze planu jako „Ustalenia z 28.10”.
- [x] (28.10) Pytanie Mateusza o psychologię sprzedaży (prowadzić do ankiety czy do rozmowy, jak zacząć kontakt i przekonać). Plan w Dokumencie Google „Plan · sprzedaż: od pierwszej wiadomości do umowy” (źródło `firma/plan-sprzedazy-2026-10-28.html`, wiersz w spisie „00”): pierwsza wiadomość od Mateusza (T5, T1–T4, Useme), po „TAK” film 60–90 s i link do `/rozmowa/`, 15 minut na Google Meet umówione w jego kalendarzu, ankietę wypełnia Mateusz w trakcie rozmowy (zgód nie zaznacza za klienta), propozycja w 24 h, umowa i płatność przez Useme. W planie: psychologia każdego kroku, scenariusz rozmowy minuta po minucie, odpowiedzi na wahania, przepisy (bez zimnych telefonów, art. 398 PKE) i lista zmian w materiałach (ustawienia `/rozmowa/`, koniec filmu po „TAK”, wzory T2, T4, T6–T9 i T11, zdanie o zadatku w szkicu z automatu). Zastępuje sekcje 11 i 16 drogowskazu; drogowskazu nie przebudowujemy.
- [x] (28.10) Pozostałe decyzje Mateusza, wpisane w „Ustalenia z 28.10” i w plan sprzedaży: rozmowa 15 minut (1); gwarancja: szkic w 5 dni roboczych od materiałów i 30 dni pomocy po starcie, bez obietnicy „naprawiam błędy”, bo sugeruje awarię (4); ceny netto + VAT, bezpieczna transakcja przez Useme (6); propozycja do 24 h po rozmowie (7); pakiety zostają jak dziś: Wizytówka 1 200 zł, Wizytówka, która umawia 1 800 zł, Pełny start 2 500 zł, plus kalendarz na obecnej stronie od 800 zł (8). Useme według jego bloga (regulaminu nie sprawdzaliśmy): w transakcji chronionej klient opłaca pro formę na całą kwotę z VAT przed startem, pieniądze czekają w Useme, a wykonawca dostaje je po akceptacji (klient ma 7 dni na odbiór). Zadatek 40% znika więc z materiałów. Kary 50 zł za dzień spóźnienia nie ma w decyzji.
- [ ] Do potwierdzenia przez Mateusza: Pełny start bez abonamentów. Newsletter i automatyczne SMS-y są poza pakietem (darmowy MailerLite od 16.06.2026: 250 odbiorców, 2 500 e-maili miesięcznie); konfiguracja na koncie klienta to osobny dodatek, a abonament klient płaci dostawcy. Prośby o opinie: karta z kodem QR, link i gotowe wiadomości wysyłane z telefonu klienta. W wiadomości z 28.10 środkowy pakiet nazywa się „strona, która umawia”; dopóki Mateusz nie potwierdzi zmiany nazwy, zostaje „Wizytówka, która umawia”. Potem zgoda na budowę: najpierw podgląd nowej głównej na kopii lokalnej, publikacja dopiero po akceptacji. Nic na stronie nie jest zmienione.
- [x] (29.10) Płatność: dwa zlecenia w Useme po 50% (I część za szkic, finalizacja przy odbiorze), w obu umowa i ustalenia z propozycji; każda część czeka w Useme do akceptacji klienta. W umowie „zaliczka” albo „I część wynagrodzenia” zamiast „zadatku” (art. 394 KC). Wpisane w oba plany.
- [x] (29.10) Plan końcowy strony w Dokumencie Google „Plan · nowa strona: mapa i sekcje” (źródło `strona/plan-strony-2026-10-29.html`, wiersz w spisie „00”): mapa (główna, Realizacje, `/rozmowa/`, `/wycena/`, 3 strony branż w tle, prawne, formularze), przekierowania 301 na sekcje, menu i stopka, 9 sekcji głównej z treścią, zmiany poza główną i kolejność prac.
- [x] (29.10) Teksty nowej głównej w Dokumencie Google „Plan · teksty strony głównej” (źródło `strona/teksty-glownej-2026-10-29.html`, wiersz w spisie „00”): 9 sekcji w kolejności problem, jak działa, koszty, pakiety, bezpieczeństwo, kroki, pytania; tabela kosztów po 1 roku i 3 latach (Booksy Biz 1 740 / 5 220 zł, Calendly Standard z osobną stroną ok. 1 800 / 3 550 zł, strona z kalendarzem ok. 1 870 / 2 600 zł) i rozszerzona tabela (Amelia, ZnanyLekarz Terapia 30% + VAT od konsultacji). Booksy z oficjalnego cennika, Calendly i Amelia z serwisów porównawczych; Calendesk, Bookero i Theraplo bez potwierdzonych cen. Przed publikacją sprawdzić każdą cenę i wpisać datę w przypisie.
- [ ] Pełny start: Mateusz uważa, że daje za mało (link do opinii, gotowy SMS, karta z QR). Do przemyślenia później: coś prostego do zrobienia, co daje realną wartość.
- [x] (29.10) Mateusz poprosił o stronę testową nowej głównej: zamiast kopii lokalnej ukryta strona na WordPressie (niżej).
- [x] (29.10) Teksty głównej, wersja 2 ze wszystkimi poprawkami po przeglądzie (ten sam Dokument Google „Plan · teksty strony głównej”, treść podmieniona przez Docs API; źródło `strona/teksty-glownej-2026-10-29.html`): 11 sekcji: sceny z trzech zawodów, badania o czasie odpowiedzi bez lat (21× przy odpowiedzi w 5 minut, 60× mniej po dobie, ok. 30% rezerwacji poza godzinami pracy), rachunek straty (doradca 2 000 zł, psycholog 1 500 zł, biuro 6 000 zł rocznie), koszty po 1 roku i 3 latach (karty zamiast tabeli, „o połowę mniej niż Booksy”), pakiety netto + VAT z cenami startowymi dla 3 pierwszych firm, bezpieczeństwo w 3 grupach z RODO dla gabinetów, współpraca w 4 krokach, „Kto zrobi Twoją stronę”, pytania z „Co po 30 dniach?”. Do tego scenariusz filmu 60 s z Mateuszem (nagrywa Mateusz) i źródła liczb.
- [x] (29.10) Strona testowa https://mateuszprzetocki.pl/podglad-nowej-glownej/ (id 192, klucz `nowaGlowna` w `zbuduj.js`): najpierw szkic, noindex i nofollow ustawione przed publikacją, poza mapą strony; `wp.py check` czysty (1 × H1, CSS, page-id 192), zrzuty z komputera i telefonu obejrzane, kopie w `backups/pages-192-*`. Nagłówek, menu i stopka są jeszcze stare; klasa `mp-ank` w pierwszej sekcji chowa na telefonie stary pasek „Wyceń stronę”. Długość: komputer ok. 11 500 px, telefon ok. 18 900 px (ok. 22 ekrany; obecna główna 19).
- [x] (29.10) `wyslij.py strony --tylko=klucz` wysyła tylko wybrane strony i nie sprawdza pozostałych; `pakiet()` i `cta()` w `zbuduj.js` przyjmują adres przycisku (domyślnie bez zmian, inne strony w buildzie bez różnic).
- [ ] Do akceptacji przez Mateusza: teksty i strona testowa. Przy wdrożeniu: film z kalendarza pokazuje jeszcze „Umów 30 minut” (nagrać ponownie po zmianie `/rozmowa/` na 15 minut), film z Mateuszem do sekcji „Kto zrobi Twoją stronę”, ceny Booksy i Calendly sprawdzić w dniu publikacji i zmienić datę w przypisie, nagłówek, menu, stopka i pasek na telefonie z „Umów 15 minut”, decyzja Mateusza, co ze stroną testową po publikacji.
- Przed wdrożeniem: przenieść do `zbuduj.js` zmiany Mateusza z edytora (`wyslij.py` zatrzyma zapis, jeśli strony zmieniono w WordPressie), ponownie sprawdzić ceny Booksy i zmienić teksty o rozliczeniu na stronie (ceny „netto + VAT”, płatność przez Useme zamiast zadatku, „Faktura bez VAT” w pasku zaufania na fakturę VAT przez Useme, „30 dni pomocy”), w `Kod.gs` (blok „Rozliczenie” i następny krok o zadatku), w prezentacjach i w umowie. Zmiana menu i wyłączenie stron to zmiany na całym serwisie: robimy je dopiero po decyzji Mateusza.

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

- [x] (26.10) Ankieta wyceny: zamiast uogólniania ankiety A w `Kod.gs` powstaje ankieta na stronie z pytaniami zależnymi od branży (plan z 23.10, punkt 1). W `Kod.gs` zostaje automat propozycji i dochodzi przyjmowanie odpowiedzi ze strony.
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
- [x] (26.10) Indeksowanie włączone dzień przed startem: w „Ustawienia → Czytanie” opcja „Proś wyszukiwarki o nieindeksowanie” jest odznaczona.
- [x] (25–26.10) Podmienić zaślepki na stronie (przyciski ankiety prowadzą do `/wycena/`, demo zdjęte, dane kontaktowe we wzorcach, polityka i regulamin ze standardowym brzmieniem):
  - linki: `#ankieta` (36 przycisków na wszystkich stronach), `#demo` (11), `#propozycja` (Jak pracuję), `#email` (Kontakt);
  - teksty: `kontakt@…` (stopka, Kontakt, polityka, regulamin; e-mail wpisuje Mateusz sam w edytorze, nie trafia do repozytorium), „[adres z danych z ustawy]” w stopce, „[adres zamieszkania albo do korespondencji…]” i „[data publikacji]” w polityce i regulaminie, trzy uwagi „do ustalenia z radcą” / „sprawdzić przed publikacją” w polityce prywatności.
- [ ] Umowa: Mateusz wpisuje we wzorze na Dysku swój adres, e-mail i numer konta, wstawia zdjęcie podpisu nad linią „Wykonawca” i pokazuje wzór radcy razem z polityką i regulaminem (szczególnie pkt 2 start od razu, 9–10 prawa autorskie i licencja na skanie, 12–14 odstąpienie, zadatek, RODO). Poprawki radcy przenieść też do `firma/umowy/umowa.src.html`.
- [ ] Regulamin strony, pkt 6 „Odstąpienie od umowy o stronę”: zamiast zaślepki „[Zasady odstąpienia… do ustalenia z radcą]” można wstawić skrót § 9 umowy, gdy radca go zatwierdzi.
- [ ] Zdecydować o wtyczkach WordPressa (propozycja z 19.10: Rank Math, cache, SMTP, Koko Analytics, Two Factor; od 26.10 są Rank Math i WP Mail SMTP, statystyki daje GA4, zostają cache i Two Factor) i o własnych wtyczkach „MP Bloki” i „MP Linki”. Instalacja tylko za zgodą Mateusza.
- [x] (26.10) Tytuły SEO z planu strony wpisane w Rank Math (punkt 15).

## Ustalenia o WordPressie (19.10.2026)

- Na stronie nie wymieniamy nazwy Castoramy (Mateusz, 20.10). Badania na stronie tylko z prawdziwym źródłem i linkiem.
- Zasady pracy: `WP-REST.md` (wczytywany przez `CLAUDE.md`), zapisy tylko przez `wp.py`: backup → zapis → weryfikacja frontu.
- Dane dostępu tylko w ustawieniach środowiska, nigdy w repozytorium (`.env` jest w `.gitignore`).
- Od 19.10 teksty i grafiki edytuje Mateusz w edytorze WordPressa. `strona/wordpress/wyslij.py` nie nadpisze jego zmian: zatrzymuje się przed zapisem i każe najpierw przenieść je do `zbuduj.js`.
- Ilustracje z telefonami i laptopami to obrazki wyrenderowane z plansz Claude Design (`strona/wordpress/renderuj.js`), nie bloki. Zmiana tekstu w nich = nowy render albo podmiana obrazka w edytorze („Zastąp”).
- Wygląd elementów (karty, etykiety, listy, pytania) daje CSS marki przez klasy `is-style-*`. Własna wtyczka „MP Bloki” może je zarejestrować jako style bloków, wtedy będą do wyboru w edytorze.
- Wtyczka MP Rezerwacje to szkielet wspólny dla wszystkich klientów (ustalenie Mateusza z 20.10). Ustawień jego strony ani innych konkretnych stron nie wpisujemy do jej kodu ani do `branze/`: trzymamy je w pliku ustawień poza katalogiem wtyczki (u Mateusza `strona/wordpress/rezerwacje-ustawienia.json`) i w CSS strony.

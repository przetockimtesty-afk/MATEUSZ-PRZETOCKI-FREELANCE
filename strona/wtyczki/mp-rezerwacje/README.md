# MP Rezerwacje

Własna wtyczka WordPress do stron, które umawiają konsultacje. Na stronie klienta stoi kalendarz
w stylu strony (jak na makiecie telefonu), osoba umawiająca się wybiera dzień i godzinę, odpowiada
na 2–4 krótkie pytania i od razu dostaje potwierdzenie. Jedna wtyczka dla wszystkich klientów:
różnią się tylko ustawieniami (gotowe zestawy dla branż) i kolorami z motywu strony.

Wersja 0.1.0 z 20.10.2026: szkielet działający od początku do końca, sprawdzony lokalnie
(lista testów niżej). Nie jest jeszcze zainstalowana na żadnej stronie.

## Co widzi klient końcowy

1. Kalendarz: rodzaj spotkania (gdy jest kilka), tydzień z dniami, wolne godziny (zajęte są przekreślone),
   przycisk „Dalej: 3 krótkie pytania” i zapowiedź pytań pod nim.
2. Dane i pytania: forma spotkania (online, na miejscu, telefon), imię, e-mail, telefon, pytania
   z gotowymi odpowiedziami do kliknięcia, zgoda z linkiem do polityki prywatności.
3. „Do zobaczenia w czwartek o 19:30”: szczegóły, przycisk „Dodaj do Kalendarza Google” i plik .ics.
4. E-mail z potwierdzeniem (z plikiem .ics i linkiem do zmiany terminu albo odwołania),
   przypomnienie X godzin przed spotkaniem.
5. Strona „Twoja rezerwacja” z linku w e-mailu: zmiana terminu w tym samym kalendarzu albo odwołanie
   (do X godzin przed spotkaniem; potem prośba o kontakt).

## Co dostaje właściciel (klient Mateusza)

- E-mail o każdej rezerwacji, zmianie i odwołaniu, z odpowiedziami. „Odpowiedz” pisze prosto do klienta.
- Spotkanie w swoim Kalendarzu Google, a zajęte godziny z Google znikają z kalendarza na stronie (opcjonalnie).
- Wiersz w Arkuszu Google przy każdej rezerwacji, zmianie i odwołaniu (opcjonalnie).
- W WordPressie menu **Rezerwacje → Spotkania**: liczniki, lista dzień po dniu, wyszukiwanie, odwołanie
  z wiadomością do klienta, usuwanie spotkań (pojedynczo albo zaznaczonych, np. próbnych, bez e-maila do klienta),
  CSV do Excela; w kokpicie widżet „Najbliższe spotkania”.

Koszty: zero. Calendar API i Sheets API są bezpłatne w tych ilościach, konto usługi nie wymaga
weryfikacji aplikacji ani płatnego Google Workspace.

## Instalacja na stronie klienta

1. Spakuj katalog: `cd strona/wtyczki && zip -r mp-rezerwacje.zip mp-rezerwacje`.
   W wp-admin: Wtyczki → Dodaj → Wyślij wtyczkę na serwer → Włącz (wgranie ZIP-u działa tylko w wp-admin).
2. **Rezerwacje → Ustawienia → Narzędzia**: wczytaj ustawienia branży.
3. Zakładki po kolei: **Spotkania** (imię, podpis, zdjęcie, rodzaje spotkań, adres, stały link Meet),
   **Dostępność** (godziny, urlopy, zasady), **Formularz** (teksty, telefon, pytania),
   **Powiadomienia** (adres, nadawca, teksty; przycisk „Wyślij mi testowe potwierdzenie”),
   **Google** (opcjonalnie), **Wygląd** (zwykle nic: kolory biorą się z motywu).
4. W edytorze strony dodaj blok **Rezerwacja terminu** (albo shortcode
   `[mp_rezerwacja wizyta="konsultacja" naglowek="Umów rozmowę" osoba="nie"]`).
5. Wysyłka e-maili przez skrzynkę w domenie klienta (np. wtyczka WP Mail SMTP), inaczej potwierdzenia
   lądują w spamie.
6. Na hostingu zadanie cron co 15 minut (LH.pl: panel → Zadania cron), polecenie jest w zakładce Narzędzia.
   Bez tego przypomnienia wychodzą dopiero przy odwiedzinach strony.
7. Próba: rezerwacja, e-maile, zmiana terminu i odwołanie z linku w e-mailu.

## Google krok po kroku

Są dwa warianty. **Domyślny jest A: projekt na koncie klienta**, wtedy nic nie zależy od Mateusza.

### Wariant A: projekt na koncie Google klienta (klient jest niezależny)

**Klient (ok. 5 minut, na koncie Google, na którym ma kalendarz):**

1. Wchodzi na console.cloud.google.com, akceptuje warunki (karta płatnicza nie jest potrzebna).
2. U góry „Wybierz projekt” → „Nowy projekt” → nazwa np. `Strona rezerwacje` → Utwórz.
3. Menu → „Administracja” (IAM i administracja) → „Uprawnienia” → „Przyznaj dostęp” → wpisuje e-mail Mateusza,
   rola **Edytor** → Zapisz. (Edytor wystarczy do reszty i nie wymaga potwierdzania zaproszenia.)
4. Kalendarz Google → Ustawienia kalendarza → Udostępnij określonym osobom → adres konta usługi, który
   poda Mateusz → „Wprowadzanie zmian w wydarzeniach”.

**Mateusz (w projekcie klienta):** włącza Google Calendar API (i Google Sheets API), tworzy konto usługi
i klucz JSON (kroki 1–3 niżej), wkleja klucz we wtyczce, klika „Sprawdź połączenie”, a plik klucza usuwa
ze swojego komputera.

**Koniec współpracy:** klient w „Uprawnieniach” usuwa Mateusza z projektu. Połączenie działa dalej,
bo projekt, konto usługi i klucz są klienta.

Uwaga: przy koncie firmowym Google Workspace administrator firmy może mieć zablokowane tworzenie kluczy
kont usługi; wtedy musi to odblokować dla tego projektu.

### Wariant B: projekt na koncie Mateusza (gdy klient ma abonament opieki)

Prościej dla klienta (tylko krok 4 z wariantu A), ale połączenie zależy od konta Mateusza: usunięcie
projektu, konta usługi albo klucza, wyłączenie API albo blokada konta wyłącza zapis do Kalendarza Google
(strona dalej przyjmuje rezerwacje i wysyła e-maile, ale zajętość z Google przestaje blokować terminy).
Projekt na osobnym koncie Google do pracy, nie prywatnym. Przy rozstaniu z klientem przejść na wariant A.

### Kroki techniczne (w projekcie z wariantu A albo B)

**Mateusz, raz na klienta (ok. 10 minut):**

1. console.cloud.google.com → właściwy projekt → Interfejsy API i usługi →
   włącz **Google Calendar API** (i **Google Sheets API**, jeśli ma być arkusz).
2. Administracja → Konta usługi → Utwórz konto usługi (np. `rezerwacje-nazwa-klienta`, bez ról) →
   Klucze → Dodaj klucz → JSON. Każdy klient ma osobne konto usługi, żeby wyciek klucza z jednej strony
   nie otwierał kalendarzy innych klientów. (Na koncie w organizacji Google Cloud tworzenie kluczy bywa
   domyślnie zablokowane; na zwykłym koncie Gmail działa.)
3. Klucz wklej w zakładce **Google** albo zostaw poza katalogiem strony i wskaż w `wp-config.php`:
   `define( 'MP_REZERWACJE_GOOGLE_KLUCZ', '/home/konto/klucz-rezerwacje.json' );`

**Klient (2 minuty, bez podawania haseł):**

4. Kalendarz Google → Ustawienia kalendarza → Udostępnij określonym osobom → adres konta usługi
   (widać go w zakładce Google, z przyciskiem „Kopiuj”) → „Wprowadzanie zmian w wydarzeniach”.
5. Jeśli ma być arkusz: Udostępnij arkusz temu samemu adresowi jako Edytor.

**Mateusz:** wpisz adres kalendarza (zwykle Gmail klienta), zapisz i kliknij **Sprawdź połączenie**
(logowanie, odczyt zajętości, testowe wydarzenie dodane i od razu usunięte, nagłówki w arkuszu).

Ograniczenia Google: konto usługi nie wysyła zaproszeń gościom (to wymaga Workspace), dlatego
klient końcowy dostaje nasz e-mail z plikiem .ics; link Meet nie tworzy się sam, w ustawieniach jest
jeden stały link do spotkań online. Gdy Google nie odpowiada, rezerwacja i tak się zapisuje, właściciel
dostaje ostrzeżenie w e-mailu, a w panelu jest przycisk „Zapisz je ponownie w Google”.

## Dopasowanie do klienta, branży i wyglądu

- **Ustawienia** są w jednej opcji `mp_rezerwacje`. Zakładka Narzędzia: pobierz plik ustawień i wczytaj
  na innej stronie (klucz Google nie trafia do pliku).
- **Branże** to pliki w `branze/`: `doradca-kredytowy.json`, `psycholog.json`, `biuro-rachunkowe.json`.
  Nowa branża = nowy plik o tej samej budowie (sekcja `ustawienia` nadpisuje spotkania, godziny, zasady,
  pytania, teksty i treści e-maili).
- **Wygląd**: kalendarz bierze kolory z palety motywu (slugi strony Mateusza: `czern`, `krem`, `biel`,
  `grafit`, `linia`, `blekit-jasny`; potem `contrast` i `base` z Twenty Twenty-Five; na końcu kolory marki)
  i fonty motywu. W zakładce Wygląd można nadpisać kolor główny, akcent, tło karty i zaokrąglenie
  (podgląd na żywo).
- **Dla programisty** (filtry i akcje):
  `mp_rezerwacje_ustawienia` (ustawienia), `mp_rezerwacje_terminy` (wolne terminy dzień po dniu),
  `mp_rezerwacje_branze` (dodatkowe branże), `mp_rezerwacje_limit_ip` (rezerwacji na godzinę z jednego
  adresu, domyślnie 5), `mp_rezerwacje_uprawnienie` (kto widzi listę spotkań, domyślnie `edit_pages`);
  akcje `mp_rezerwacje_nowa`, `mp_rezerwacje_zmiana`, `mp_rezerwacje_odwolana`.

## Jak to działa

| Plik | Co robi |
|---|---|
| `mp-rezerwacje.php` | nagłówek wtyczki, autoloader klas z `src/` |
| `src/Wtyczka.php` | start modułów, zadania cykliczne (przypomnienia co godzinę, RODO raz na dobę) |
| `src/Ustawienia.php` | ustawienia domyślne, porządkowanie danych z panelu, branże, eksport i import |
| `src/Czas.php` | strefa czasowa, daty po polsku, godziny pracy z tekstu, wyjątki, święta w Polsce |
| `src/Dostepnosc.php` | wolne terminy: godziny pracy − rezerwacje − zajętość z Google, z przerwą i limitem |
| `src/Rezerwacje.php` | zapis z blokadą przed podwójną rezerwacją, zmiana terminu, odwołanie, przypomnienia |
| `src/Google.php` | konto usługi (JWT), freeBusy, wydarzenia, arkusz, test połączenia |
| `src/Maile.php`, `szablony/mail.php` | e-maile HTML z wersją tekstową i plikiem .ics |
| `src/Rest.php` | `/wp-json/mp-rezerwacje/v1/terminy`, `/rezerwacje`, `/rezerwacje/{token}/zmien` i `/odwolaj` |
| `src/Front.php`, `szablony/` | blok, shortcode i strona „Twoja rezerwacja” (`/?mp_rezerwacja=TOKEN`) |
| `bloki/rezerwacja/` | blok: `block.json`, podgląd w edytorze (`edit.js`), kalendarz (`view.js`), style |
| `src/Panel.php`, `panel/` | menu Rezerwacje: lista spotkań, ustawienia w 7 zakładkach, CSV, widżet |
| `src/Prywatnosc.php` | tekst do polityki prywatności, eksport i usuwanie danych, automatyczne czyszczenie |
| `src/Baza.php` | tabela `{prefiks}mp_rezerwacje` (czasy w UTC) |

Bez kroku budowania: PHP 8.1+, WordPress 6.5+, JavaScript bez bibliotek.

Bezpieczeństwo i dane: losowy 128-bitowy token w linku do rezerwacji, odwołanie tylko przez POST
(skanery linków w poczcie nie odwołają spotkania), blokada zapisu przed podwójną rezerwacją, a zmiana
terminu i odwołanie zapisują się tylko dla wciąż potwierdzonego spotkania, pole-pułapka na boty i limit
5 udanych rezerwacji na godzinę z jednego adresu. Strona „Twoja rezerwacja” nie ładuje skryptów motywu
ani innych wtyczek (token z adresu nie trafi do analityki) i wysyła `Referrer-Policy: no-referrer`;
ona i REST są bez cache i z `noindex`. Formuły w CSV są zneutralizowane. Dane klientów usuwają się same
po ustawionej liczbie dni (domyślnie 365), razem z danymi w opisie wydarzenia w Kalendarzu Google,
i są podpięte pod Narzędzia → Eksport / Usuwanie danych osobowych. Wierszy w Arkuszu Google wtyczka nie
usuwa (narzędzie WordPressa o tym przypomina). Nie pytamy o zdrowie (RODO art. 9); dla psychologów opis
wydarzenia w Google jest domyślnie minimalny.

Odpowiedź dla klienta przychodzi od razu po zapisie rezerwacji, a Kalendarz Google i e-maile idą w tle
(po wysłaniu odpowiedzi przez PHP-FPM albo LiteSpeed, inaczej przez WP-Cron; zaległe co godzinę). E-mail ma
limit 20 s na połączenie z serwerem SMTP. Formularz ma klucz, więc ponowne wysłanie (zerwane połączenie,
podwójne kliknięcie) zwraca tę samą rezerwację zamiast „Ktoś właśnie zajął ten termin”.

Pomiar: po rezerwacji `dataLayer.push({event: 'mp_rezerwacja'})` zawsze, a zdarzenie GA4 `book_appointment`
(`gtag`) i piksela Meta `Schedule` (`fbq`) tylko wtedy, gdy te skrypty są na stronie, czyli po zgodzie na
ciasteczka. Nazwy zmienia filtr `mp_rezerwacje_zdarzenia`.

Google: wydarzenie ma stałe id zależne od rezerwacji, więc ponowienie zapisu nie robi duplikatu;
dodatkowy kalendarz bez dostępu jest pomijany (z wpisem w dzienniku), a zajętość z głównego zostaje;
odwołane spotkanie, którego nie udało się usunąć z Google, czeka na „Zapisz je ponownie w Google”.

## Testy (20.10.2026, lokalnie: WordPress 7.1.3, PHP 8.3, Twenty Twenty-Five ze stylami strony)

- Rezerwacja od początku do końca na telefonie (390 px) i komputerze (1280 px), bez błędów JavaScriptu.
- Błędy formularza przy polach (znikają po poprawieniu), błędy z serwera, pole-pułapka, terminy spoza siatki i z przeszłości.
- Pięć równoczesnych rezerwacji tego samego terminu: jedna przyjęta, cztery dostały „Ktoś właśnie zajął ten termin”.
- E-maile: potwierdzenie, powiadomienie, przypomnienie (raz), zmiana terminu, odwołanie; pliki .ics.
- Strona „Twoja rezerwacja”: zmiana terminu i odwołanie z linku; odwołanie z panelu z wiadomością.
- Google na atrapie API: logowanie JWT, zajętość (z przerwą), dodanie, przesunięcie i usunięcie wydarzenia,
  wiersze w arkuszu, awaria Google (rezerwacja zapisana, ostrzeżenie, ponowienie). **Z prawdziwym kontem
  Google jeszcze nie testowane.**
- Strefa czasowa i zmiana czasu 25.10.2026, święta (11.11), urlop z najbliższym wolnym terminem, kilka rodzajów
  spotkań, spotkanie telefoniczne, limit dzienny, przerwy.
- Panel: wszystkie zakładki, zapis z dodaniem i przesunięciem pytania, test Google, kolory na stronie, CSV,
  eksport i import ustawień, RODO (eksport, usuwanie, automatyczne czyszczenie), blok w edytorze.
- Niezależny przegląd kodu (bezpieczeństwo i logika): 12 uwag, wszystkie poprawione i sprawdzone
  (m.in. równoczesne odwołania: przechodzi jedno, długie nazwy spotkań, strefa „UTC+1”, „<10%” w opcjach,
  zmiana terminu spotkania, którego rodzaju już nie ma w ustawieniach).

## Zmiany

- **0.1.1** (25.10.2026): e-maile i Google w tle (strona nie czeka na serwer poczty), klucz formularza
  (bez duplikatu i fałszywego „termin zajęty” po ponownym wysłaniu), limit czasu SMTP 20 s, zdarzenia
  dla GA4 i piksela Meta, usuwanie spotkań w panelu (pojedynczo i zaznaczonych; wydarzenie znika też
  z Kalendarza Google). Baza: kolumny `klucz` i `w_tle` (dodają się same po aktualizacji).
- **0.1.0** (20.10.2026): pierwsza wersja.

## Czego świadomie nie ma

Płatności online, SMS, zaproszeń Google dla klientów końcowych, automatycznych linków Meet,
kilku pracowników z osobnymi kalendarzami, spotkań cyklicznych i ręcznego dodawania rezerwacji
w panelu (termin blokuje się wydarzeniem w Kalendarzu Google albo wyjątkiem w zakładce Dostępność).

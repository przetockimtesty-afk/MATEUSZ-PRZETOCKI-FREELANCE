# Ankieta Google → prezentacja na rozmowę i szkic propozycji

Klient wypełnia ankietę Google (A „Konsultacja” albo B „Wycena”). Po około minucie dostajesz mail
z dwoma linkami:

- **Prezentacja w Google Slides** („Prezentacja sprzedażowa”) z wypełnionymi polami: firma, data, liczby
  z ankiety, ceny pakietów, zwrot z inwestycji i daty startu. Pytania do klienta i pełne odpowiedzi z ankiety
  są w notatkach pod slajdami.
- **Szkic propozycji w Google Docs**: 8 bloków z sekcji 17 drogowskazu. Zawiera liczby klienta, cel z miarą
  sukcesu, ostrożnie policzony koszt problemu, polecany wariant 2 opisany przed tabelą i wyróżniony w tabeli,
  ceny, daty, rozliczenie i koszty domeny z hostingiem. Sprawdzasz, poprawiasz zdania i wysyłasz PDF.

W mailu są też wskazówki (np. „klient nie ma strony”), szkic podsumowania w 5 punktach, źródło
(skąd klient o Tobie wie) i wszystkie odpowiedzi.

Działa na Twoim koncie Google, za darmo, bez Make, Zapiera i bez AI. Całość to plik `Kod.gs` z tego folderu.

## Ankieta na stronie (od 25.10.2026, ok. 10 minut)

Ankieta wyceny jest teraz na stronie (`/wycena/`, wtyczka MP Ankiety). Strona wysyła każdą odpowiedź
do tego samego skryptu, a on robi z niej prezentację i szkic propozycji, tak jak z ankiety Google.
Ankiety Google A i B zostają jako zapasowe.

1. Zaktualizuj kod jak w punkcie „Masz już poprzednią wersję” niżej (wklej nowy `Kod.gs`, zostaw swoje
   `USTAWIENIA`, uruchom `setup`).
2. Wybierz funkcję `ustawSekretStrony` → **Uruchom**. W „Dzienniku wykonania” pojawi się sekret
   (długi ciąg liter i cyfr). Skopiuj go. Wklejasz go tylko w WordPressie, nigdzie więcej.
3. **Wdróż → Nowe wdrożenie** → ikona koła zębatego → **Aplikacja internetowa**.
   Opis: „Ankieta ze strony”, **Wykonaj jako: Ja**, **Kto ma dostęp: Każdy** → **Wdróż**.
   Zezwól na uprawnienia, jeśli Google zapyta. Skopiuj **adres URL aplikacji internetowej** (kończy się na `/exec`).
4. WordPress → **Ankiety → Ustawienia → Automat**: wklej adres do „Adres automatu”, sekret do „Sekret”
   → **Zapisz ustawienia** → **Sprawdź połączenie z automatem**. Ma się pokazać „Automat odpowiedział poprawnie.”
5. Test: wypełnij `/wycena/` z drugiego adresu e-mail. Po około minucie w arkuszu z odpowiedziami jest
   karta „Ze strony” z wierszem „gotowe A: …” (albo B), a na skrzynkę przychodzi mail z linkami do prezentacji i propozycji.

Dobrze wiedzieć:

- Po każdej zmianie kodu: **Wdróż → Zarządzaj wdrożeniami** → ołówek → Wersja: **Nowa wersja** → **Wdróż**.
  Bez tego aplikacja internetowa działa dalej na starym kodzie. Adres URL się nie zmienia.
- Co noc automat usuwa z karty „Ze strony” odpowiedzi starsze niż rok (tak mówi polityka prywatności strony).
  Na stronie odpowiedzi usuwają się same po 365 dniach (Ankiety → Ustawienia).
- Gdy automat nie odpowiada, strona i tak zapisuje odpowiedź, wysyła Ci e-mail i ponawia wysyłkę do automatu
  (do 3 razy, co godzinę). W panelu Ankiety jest przycisk „Wyślij ponownie do automatu”.
- Wiersz z „błąd: …” w karcie „Ze strony”: popraw przyczynę (zwykle szablon) i uruchom `utworzZOstatniejZeStrony`.

## Prezentacja sprzedażowa zamiast A i B (od 26.10.2026, ok. 10 minut)

Prezentacje A „Konsultacja” i B „Wycena” zastępuje jedna „Prezentacja sprzedażowa” (claude.ai, źródło
w `firma/prezentacje/sprzedaz/`). Automat robi z niej prezentację dla obu wersji i sam pomija slajdy,
które nie pasują do branży klienta.

1. Otwórz „Prezentacja sprzedażowa” w claude.ai → Udostępnij → Eksport → PowerPoint, w wersji z edytowalnym
   tekstem (nie „slajdy jako obrazy”). Notatki muszą zostać w pliku, bo są w nich znaczniki (niżej).
2. Wgraj plik .pptx na Dysk Google i skopiuj link do niego.
3. script.google.com → projekt „Ankieta → prezentacja”: wklej nowy `Kod.gs`, a swoje wartości w `USTAWIENIA`
   zostaw. Ten sam link wklej w `szablonA` i w `szablonB`. W `podpis` dopisz e-mail (i telefon, jeśli chcesz):
   podpis jest też na ostatnim slajdzie prezentacji.
4. Zapisz i uruchom `setup`. Powstanie jeden szablon Google Slides dla obu wersji. Stare szablony A i B
   możesz usunąć z folderu.
5. Wdróż → Zarządzaj wdrożeniami → ołówek → Wersja: Nowa wersja → Wdróż (aplikacja dla ankiety ze strony).
6. Test: uruchom `utworzZOstatniejZeStrony` albo wypełnij ankietę testową. W gotowej prezentacji slajdy
   drugiej wersji są pominięte (na liście slajdów wyszarzone), a slajd „Kiedy strona się zwraca” ma liczby.

Znaczniki w notatkach slajdów:

- `[tylko A]`: slajd tylko dla wersji A (konsultacje), w wersji B pominięty;
- `[tylko B]`: slajd tylko dla wersji B (wyceny, firmy remontowe), w wersji A pominięty;
- `[liczby z ankiety]`: slajd ze zwrotem z inwestycji, pominięty, gdy klient nie podał kwoty albo wychodzi
  mniej niż 1 nowy klient (zlecenie) rocznie.

Znaczników nie usuwaj. Slajd bez znacznika pokazuje się w obu wersjach. Nowy slajd tylko dla jednej wersji
dostaje znacznik na początku notatek.

## Masz już poprzednią wersję: aktualizacja (5 minut)

1. script.google.com → projekt „Ankieta → prezentacja”. Skopiuj do notatek swoje wartości z `USTAWIENIA`:
   `szablonA`, `szablonB`, `podpis` (i `email`, jeśli go wpisano).
2. Skasuj cały kod w edytorze i wklej nowy `Kod.gs`. Wklej z powrotem swoje wartości. Resztę `USTAWIENIA`
   zostaw z nowego pliku: doszło w nim `utrzymanie` (koszty domeny i hostingu, niżej).
3. Zapisz (Ctrl+S), wybierz funkcję `setup` → Uruchom. Jeśli Google poprosi o uprawnienia, zezwól tak samo
   jak za pierwszym razem.

Setup niczego nie dubluje, a ankiety mają te same linki. Ta wersja:

- dopisuje do ankiety A pytanie „Ile z umówionych osób zostaje klientami?” (zaraz po „Ile z nich się umawia?”);
- robi nowe szablony propozycji, a poprzednie dostają w nazwie „(stara wersja)”: możesz je usunąć,
  a swoje poprawki z nich przenieść do nowych;
- sama poprawia Twoje szablony prezentacji w Google Slides: nowy slajd „Koszt problemu”, koszty domeny
  i hostingu na slajdzie „Własność” i pytanie 2 na ściądze. Nie trzeba ich eksportować z claude.ai jeszcze raz;
- wysyła mail z linkami i listą zmian. Jeśli w mailu jest uwaga, że szablonu nie udało się poprawić
  (np. slajd kosztu był zmieniany ręcznie), wyeksportuj tę prezentację z claude.ai jeszcze raz
  (punkt 1 niżej), wklej nowy link w `USTAWIENIA` i uruchom `setup`. Do tego czasu automat pomija ten slajd.

Starsza wersja bez pytania „Skąd Państwo o mnie wiedzą?”: ten sam setup dopisze też je, kolumny „Źródło”
i „Szkic propozycji” w arkuszu oraz nowy tytuł, opis i podziękowanie ankiet.

## Pierwsze uruchomienie (około 20 minut)

### 1. Szablon prezentacji (2 minuty)

1. Otwórz „Prezentacja sprzedażowa” w claude.ai.
2. Udostępnij → Eksport → PowerPoint, w wersji z edytowalnym tekstem (nie „slajdy jako obrazy”).
3. Wgraj plik .pptx na Dysk Google i skopiuj link do niego (otwórz go i skopiuj adres z paska).
   Nie musisz go konwertować: skrypt sam zrobi z niego Prezentację Google „Szablon A · Google Slides”,
   wspólną dla obu wersji.

### 2. Skrypt (5 minut)

1. Wejdź na script.google.com → Nowy projekt. Nazwij go „Ankieta → prezentacja”.
2. Skasuj zawartość pliku `Kod.gs` w edytorze i wklej cały kod z pliku `Kod.gs` z tego folderu.
3. Na górze, w `USTAWIENIA`, wklej link do pliku .pptx w miejsce obu `WKLEJ_TUTAJ_…` (`szablonA` i `szablonB`).
   Uzupełnij `podpis` (pod propozycją i na ostatnim slajdzie). Ceny trzech wariantów są w `ceny`, a koszty domeny i hostingu
   w `utrzymanie`: zmieniasz je tam, gdy zmieni się Twój cennik albo cennik dostawcy.
   Maile przychodzą na adres Twojego konta Google; inny adres wpisz w `email`.
4. Zapisz (Ctrl+S).

### 3. Uruchomienie (2 minuty)

1. U góry wybierz funkcję `setup` → Uruchom.
2. Google poprosi o uprawnienia: Sprawdź uprawnienia → wybierz konto → „Google nie zweryfikował tej
   aplikacji” → Zaawansowane → Przejdź do projektu „Ankieta → prezentacja” → Zezwól.
   To normalne przy własnym skrypcie: aplikacją jesteś Ty, a dane zostają na Twoim koncie.
   Na liście jest też „łączenie z usługą zewnętrzną”: skrypt używa jej tylko do zamiany .pptx
   na Prezentację Google przez Dysk Google.
3. Po chwili przychodzi mail „Automat ankieta → prezentacja: linki”: ankiety A i B, linki ze źródłem,
   arkusz z odpowiedziami, folder na Dysku, szablon prezentacji (ten sam link przy A i B) i dwa szablony propozycji.

Od teraz wzorem dla automatu jest szablon prezentacji z maila. Gdy zmienisz coś w prezentacji na claude.ai,
nanieś tę samą zmianę w szablonie Google (albo wyeksportuj, wgraj nowy .pptx, wklej jego link w `szablonA`
i `szablonB` i uruchom `setup` jeszcze raz).

### 4. Test (3 minuty)

1. Wypełnij ankietę A wymyślonymi danymi: 12 osób pyta, 7 się umawia, 3 zostają klientami,
   jeden klient przynosi 3000 zł.
2. Po około minucie przychodzi mail „Gotowe: prezentacja i szkic propozycji · …”.
3. W prezentacji sprawdź slajd „Kiedy strona się zwraca”: 60 × 14% = 8, czyli 24 000 zł rocznie, a pakiet
   „Wizytówka, która umawia” zwraca się po pierwszym dodatkowym kliencie, w ciągu ok. 2 miesięcy. Slajdy
   wersji B (np. „Czy dobrze rozumiem?” z zapytaniami o cenę) są pominięte. Jeśli długi tekst wychodzi
   poza kafelek, popraw rozmiar w szablonie Google.
4. W szkicu propozycji sprawdź punkt 2 („Punkt wyjścia: 7 z 12… nowi klienci 3 z 7”, miara 9 z 12,
   „Wariant 2 zwraca się po pierwszym dodatkowym kliencie, w ciągu ok. 2 miesięcy”), wyróżniony wiersz
   wariantu 2 w tabeli i punkt 7 (rozliczenie, domena i hosting).
5. Testowe pliki możesz potem usunąć z folderu, a wiersz z arkusza.

## Jak automat liczy koszt problemu

Liczy ostrożnie, tak samo na slajdzie i w propozycji:

| | A „Konsultacja” | B „Wycena” |
|---|---|---|
| Ile się traci w roku | (pyta − umawia się) × 12 | telefony bez odpowiedzi w zeszłym tygodniu × 48 |
| Ile z tego wróci przez stronę | co trzecia osoba | co trzecie zapytanie |
| Ile z tego zostanie klientem | tyle, ile dziś: klienci ÷ umówieni | tyle, ile dziś: zlecenia ÷ zapytania |
| Wynik | nowi klienci rocznie (w dół do pełnych) × kwota z jednego klienta | dodatkowe zlecenia rocznie × przeciętne zlecenie |

Przykład A: 5 osób miesięcznie się nie umawia, czyli 60 rocznie. Co trzecia to 20, a klientami zostaje
3 z 7 umówionych (43%), więc ok. 8 nowych klientów i 24 000 zł rocznie. Wariant 2 za 1 800 zł zwraca się
po pierwszym kliencie, przy tym tempie w ciągu ok. 2 miesięcy.

- **Skąd „co trzecia”:** w badaniu Mayo Clinic ok. 30% samodzielnych rezerwacji przypadało poza
  godzinami pracy (JMIR Medical Informatics, 2021), a według Booksy średnio 45% klientów umawia się
  poza godzinami pracy salonu. To trafia do propozycji jako przypis pod rachunkiem.
- **Klient nie podał, ilu umówionych zostaje klientami** (albo ile zapytań kończy się zleceniem): automat
  przyjmuje 25%, pisze „założenie” na slajdzie i w propozycji, a w mailu prosi, żeby dopytać.
- **Nie podał kwoty** albo wychodzi mniej niż 1 klient rocznie: slajd kosztu i akapit w propozycji są
  pominięte, a mail podpowiada, żeby pokazać raczej oszczędność czasu.

## Linki ze źródłem

W mailu z setup jest tabela: 5 linków do ankiety A i 5 do ankiety B. Każdy otwiera ankietę
z zaznaczoną odpowiedzią na „Skąd Państwo o mnie wiedzą?”. Klient może ją zmienić. Wybór trafia
do arkusza (kolumna „Źródło”) i do maila, więc 13.11 i 13.12 widzisz, który kanał daje ankiety.

| Link | Gdzie go używasz |
|---|---|
| Ze strony internetowej | przycisk „Wyceń stronę w 5 minut” na Twojej stronie: A przy przykładzie doradcy, B przy kalkulatorze |
| Z polecenia | dla osób, które polecają Cię dalej (kolega, doradczyni), i w wiadomościach po przedstawieniu (T2, T4) |
| Z mojej wiadomości e-mail | w wiadomości z pomysłem po „TAK” (T6, T7) |
| Z Useme albo ogłoszenia | w ofertach na Useme (T14) i odpowiedziach na posty (T8) |
| Z mediów społecznościowych | w opisie profilu i pod filmami |

**Ankieta na Twojej stronie:** przycisk z linkiem otwiera ankietę w nowej karcie (na telefonie
wygodniej niż ramka). Zanim wstawisz ją na stronę, wpisz w `USTAWIENIA` link do polityki prywatności
(`politykaPrywatnosci`) i uruchom `setup`: link pojawi się w opisie ankiety. Obcy ludzie ze strony
to nie znajomi z polecenia, więc informacja o przetwarzaniu danych musi być pod ręką.

## Szkic propozycji: co sprawdzić przed wysłaniem (ok. 15 minut)

1. **Sytuacja:** automat składa zdania z ankiety, słowa klienta są w cudzysłowie. Skróć do 3 zdań
   i zostaw „Czy dobrze rozumiem?”.
2. **Cel i miara sukcesu:** cel słowami klienta, punkt wyjścia z jego liczb i miara po 3 miesiącach
   (A: o co trzecią z traconych osób więcej umówionych; B: zgłoszenia z kalkulatora miesięcznie).
   Pod spodem koszt problemu i przypis ze źródłami. Gdy jest „założenie”, dopytaj i popraw.
3. **Rozwiązanie:** punkt 3 to polecany wariant 2 z ceną i listą tego, co klient dostaje. W tabeli
   wariant 2 jest pogrubiony na jasnym tle.
4. **Warianty i ceny:** z `USTAWIENIA.ceny`. W B wariant 1 zależy od tego, czy klient ma stronę:
   bez strony to mini-strona z kalkulatorem, droższa o 500 zł (konfiguracja hostingu i domeny).
   Gdy klient A ma już stronę, mail podpowie moduł umawiania (800–1 200 zł) zamiast wariantów 1–2.
5. **Rozliczenie:** faktura bez VAT (działalność nierejestrowana) albo faktura VAT przez Useme, cena + 23%.
   Doradca kredytowy i agent ubezpieczeniowy zwykle nie odliczają VAT, więc im polecasz fakturę bez VAT.
6. **Domena i hosting:** z `USTAWIENIA.utrzymanie`, netto i z VAT. Domyślnie: hosting LH.pl Orange (5 GB:
   50 zł netto w pierwszym roku, potem 199 zł) albo Kiwi (10 GB i SSH: 60 zł, potem 249 zł) i domena .pl
   (5–15 zł, potem ok. 120 zł netto), razem 55–75 zł w pierwszym roku i ok. 320–370 zł w kolejnych.
   Pakiet Mango kusi ceną na start (37,50 zł), ale odnowienie kosztuje 399 zł.
7. **Daty:** propozycja z datą następnego dnia roboczego po rozmowie (bez daty rozmowy: po wysłaniu
   ankiety), materiały do 5 dni roboczych później, publikacja 10 dni roboczych po materiałach,
   ważność 14 dni. Automat pomija soboty i niedziele, ale nie zna świąt (11.11, 24–26.12): sprawdź daty.
8. Plik → Pobierz → Dokument PDF i wyślij z wiadomością T11.

Szablon propozycji poprawiasz w Dokumentach Google (link w mailu z setup): zmieniasz tekst, a pola
`{{…}}` zostawiasz. Następne szkice powstaną już z poprawionego szablonu.

## Na co dzień

- **Przed Meetem:** wysyłasz klientowi link ze źródłem: „Żeby rozmowa była konkretna, proszę o 5 minut
  na kilka pytań: [link]”. Na rozmowę masz gotową prezentację z jego danymi.
- **Bez Meeta:** klient wypełnia ankietę, Ty w 48 godzin wysyłasz propozycję ze szkicu.
- **Bez ankiety:** ankietę wypełniasz sam w trakcie pytań na Meecie, w drugiej karcie. Po wysłaniu
  prezentacja i szkic są gotowe po około minucie.
- **Pokaz:** prezentację otwierasz z maila → Pokaz slajdów → w Meet udostępniasz kartę. Widok prezentera
  pokazuje notatki: przy każdym slajdzie pytanie do klienta, a przy slajdzie „Czy dobrze rozumiem?”
  pełne odpowiedzi z ankiety.
- Slajdy drugiej wersji (A albo B) są w pliku, ale pominięte w pokazie. Gdy klient nie poda kwoty, slajd
  „Kiedy strona się zwraca” też jest pominięty.
- Klientowi nie wysyłasz linku do prezentacji (notatki są w pliku). Dostaje propozycję w PDF.

## Gdy coś nie działa

- **„Tej czynności nie można wykonać w przypadku tego dokumentu”:** masz bardzo starą wersję skryptu,
  która nie umiała otworzyć pliku .pptx. Wklej aktualny `Kod.gs` (swoje wartości w `USTAWIENIA` zostaw)
  i uruchom `setup` jeszcze raz.
- **Nie przyszedł mail z prezentacją:** dostajesz mail z błędem. Szczegóły: script.google.com → projekt →
  Wykonania.
- **W prezentacji albo w szkicu zostało pole `{{…}}`:** w szablonie zmienił się tekst pola (np. brakuje
  nawiasu). Popraw je w szablonie Google Slides albo Google Docs.
- **Slajd „Koszt problemu” jest zawsze pominięty:** szablon prezentacji ma stary slajd kosztu (mail
  z setup o tym mówi). Wyeksportuj prezentację z claude.ai jeszcze raz i wklej nowy link w `USTAWIENIA`.
- **W prezentacji pokazują się slajdy obu wersji (A i B):** plik .pptx nie ma notatek ze znacznikami
  `[tylko A]` i `[tylko B]`. Wyeksportuj prezentację jeszcze raz (z notatkami) albo dopisz znaczniki
  na początku notatek w szablonie Google.
- **Usunąłeś szablon prezentacji albo propozycji:** uruchom `setup`, zrobi nowy. Szablon propozycji
  automat odtworzy też sam przy następnej ankiecie.
- **Poprawiłeś szablon i chcesz odtworzyć ostatnie pliki:** uruchom funkcję `utworzZOstatnichOdpowiedzi`.
  Robi nową prezentację i nowy szkic z ostatniej odpowiedzi w obu ankietach.
- **Zmieniłeś pytania w ankiecie:** zmiana treści pytania niczego nie psuje. Nowe pytania automat pomija,
  bo nie wie, w które pole je wpisać.
- **Zmieniłeś opis ankiety albo podziękowanie w Formularzach Google:** `setup` ustawi je z powrotem.
  Zmieniaj je w `Kod.gs` (`WSTEP`, `POTWIERDZENIE`).
- **Śmieciowe odpowiedzi ze strony:** usuń pliki z folderu i wiersz z arkusza. Jeśli to się powtarza,
  zamień przycisk na stronie na krótki formularz kontaktowy, a ankietę wysyłaj w odpowiedzi.
- **Wszystko od nowa:** script.google.com → Ustawienia projektu → Właściwości skryptu → usuń wpisy,
  potem uruchom `setup`.
- Limit Gmaila dla skryptów to około 100 maili dziennie, więcej niż potrzebujesz.

## Co trafia w które pole

Prezentacja:

| Pole w szablonie | A „Konsultacja” | B „Wycena” |
|---|---|---|
| `{{FIRMA}}`, `{{DATA}}` | nazwa firmy; dzień rozmowy z ankiety albo dzień wysłania | to samo |
| `{{SKAD}}` | skąd przychodzili klienci | skąd przychodzą zapytania |
| `{{PYTA}}`, `{{UMAWIA}}`, `{{KLIENCI}}` | ile pyta, ile się umawia, ilu zostaje klientami | — |
| `{{ZAPYTANIA}}`, `{{PRZEPADA}}`, `{{ZLECENIA}}` | — | zapytania w tygodniu, telefony bez odpowiedzi, zlecenia |
| `{{PRZESZKADZA}}` | co najbardziej męczy (skrót do 85 znaków) | co przeszkadza w wycenach (to samo) |
| `{{ELEMENTY}}` | — | co trzeba wiedzieć do wyceny (skrót do 80 znaków) |
| `{{CEL}}` | po czym będzie widać, że było warto | to samo |
| `{{STRATY}}` | osoby w roku, które pytają i się nie umawiają | telefony bez odpowiedzi w roku |
| `{{SKUTECZNOSC}}` | klienci ÷ umówieni (bez odpowiedzi: 25% i „założenie”) | zlecenia ÷ zapytania (to samo) |
| `{{SZANSA}}` | co trzecia × skuteczność | to samo |
| `{{NOWI}}` | nowi klienci rocznie: STRATY × SZANSA, w dół do pełnych | dodatkowe zlecenia rocznie |
| `{{KWOTA}}`, `{{ROK}}` | kwota z jednego klienta; NOWI × KWOTA | przeciętne zlecenie; to samo |
| `{{GODZ}}` | czas pierwszej rozmowy razy liczba pytających, na tydzień | czas na wyceny w tygodniu |
| `{{ZWROT}}` | po ilu dodatkowych klientach zwraca się wariant 2: cena ÷ kwota, w górę | po ilu dodatkowych zleceniach |
| `{{ZWROT_CZAS}}` | w ilu miesiącach przy tempie NOWI na rok | to samo |
| `{{CENA1}}`, `{{CENA2}}`, `{{CENA3}}` | ceny pakietów z `USTAWIENIA.ceny.A` | ceny z `USTAWIENIA.ceny.B` |
| `{{WARIANT1}}` | — | kalkulator na obecnej stronie albo mini-strona z kalkulatorem |
| `{{MATERIALY_DO}}`, `{{PUBLIKACJA}}` | jak w szkicu propozycji | to samo |
| `{{PODPIS}}` | `USTAWIENIA.podpis` (ostatni slajd) | to samo |
| `{{UTRZYMANIE}}` | koszty domeny i hostingu z `USTAWIENIA.utrzymanie` | to samo |
| `{{TERMIN}}` | następny dzień roboczy po rozmowie, 18:00 (starsze prezentacje A i B) | to samo |
| `{{DECYZJA}}` | 3 dni robocze po rozmowie (starsze prezentacje A i B) | to samo |

Szkic propozycji:

| Pole w szablonie | Co wpisuje automat |
|---|---|
| `{{FIRMA}}`, `{{DATA_PROPOZYCJI}}`, `{{WAZNA_DO}}` | nazwa firmy, dzień propozycji (jak `{{TERMIN}}`), ważność 14 dni |
| `{{SYTUACJA}}` | zdania z ankiety: skąd klienci, liczby, co przeszkadza, ostatnia sytuacja |
| `{{CEL_ZD}}` | cel klienta jako zdanie |
| `{{PUNKT_WYJSCIA}}`, `{{MIARA}}` | dzisiejsze liczby klienta i miara sukcesu po 3 miesiącach; bez liczb punkt wyjścia znika, a miara jest ogólna |
| `{{KOSZT_AKAPIT}}`, `{{KOSZT_ZRODLA}}` | ostrożny koszt problemu, po ilu klientach i w ilu miesiącach zwraca się wariant 2, przypis ze źródłami; bez kwoty oba znikają |
| `{{CENA1}}`, `{{CENA2}}`, `{{CENA3}}`, `{{ZADATEK}}` | ceny z `USTAWIENIA.ceny`; zadatek 40% wariantu 2 |
| `{{WARIANT1}}`, `{{WARIANT1_DLA}}` | tylko B: kalkulator na obecnej stronie albo mini-strona z kalkulatorem |
| `{{ELEMENTY_PELNE}}` | tylko B: wszystkie elementy ceny, bez skracania |
| `{{UTRZYMANIE}}`, `{{UTRZYMANIE_VAT}}` | koszty domeny i hostingu netto i z 23% VAT |
| `{{MATERIALY_DO}}`, `{{PUBLIKACJA}}` | materiały do 5 dni roboczych po propozycji, publikacja 10 dni roboczych później |
| `{{PODPIS}}` | `USTAWIENIA.podpis` |

Ankieta nie zbiera danych klientów Twojego klienta: tylko liczby i krótkie opisy bez nazwisk.
Odpowiedzi, prezentacje i propozycje są wyłącznie na Twoim Dysku Google.

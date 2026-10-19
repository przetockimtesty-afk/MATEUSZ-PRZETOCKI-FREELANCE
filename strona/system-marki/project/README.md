Marka jednoosobowej pracowni stron dla specjalistów, którzy umawiają konsultacje: doradców kredytowych, biur rachunkowych, psychologów, prawników i podobnych zawodów. Wygląd jest minimalistyczny i ciepły: krem, czerń i jasny błękit jako akcent. Klient ma zobaczyć porządek, a nie efekty.

## Słowa

- Piszesz do jednej osoby, na „Ty”: „Klient wybiera termin wtedy, kiedy Cię szuka, a Ty rano wiesz, z czym przyjdzie”.
- O sobie mówisz „ja”, nigdy „my”: „Strony robię sam, od ankiety do startu”.
- Najpierw korzyść, potem sposób: „Klient umawia się sam”, a pod spodem „Kalendarz konsultacji w 2 kliknięciach i potwierdzenie e-mailem”.
- Liczby zamiast przymiotników: „48 h”, „2 rundy poprawek”, „od 1 800 zł”, „ok. 2 tygodnie”. Bez „kompleksowo”, „profesjonalnie”, „nowocześnie”.
- Nagłówek do 8 słów, zdanie do 20, akapit do 3 zdań. Nagłówki zwykłymi literami, bez wykrzykników i emoji.
- Uczciwie: przykład podpisany „Projekt demonstracyjny”, bez wymyślonych opinii i logotypów. Nie obiecujesz miejsca w Google ani liczby klientów, tylko termin, zakres i testy: „Łatwiej Cię znaleźć w Google”, nie „Będziesz pierwszy w Google”.
- Przyciski zaczynają się od czasownika: „Wyceń stronę w 5 minut”, „Zobacz demo”, „Umów 30 minut”. Pod głównym przyciskiem podpis „Bez zobowiązań · propozycja w 48 h”.
- Twarda spacja między liczbą a jednostką („1 800 zł”, „48 h”) i po jednoliterowych słowach (w, z, i, a, o, u).

## Kolory

- Tło strony `krem`; co druga sekcja `piasek`; karty `biel` z ramką 1 px `linia`.
- Tekst w `czern`, tekst pomocniczy w `grafit`. Na czarnych pasach tekst w `krem`, akapity w `szary-na-czerni`.
- `blekit` występuje tylko na czerni: przycisk, duże cyfry, ikony, słowo akcentu, linki. Na jasnym tle `blekit` służy wyłącznie jako ozdoba (kropka przed nadtytułem i w logo), nigdy jako kolor tekstu ani ikony z treścią.
- `blekit-jasny` to tło polecanego pakietu, etykiet funkcji i kółek z ikoną; tekst na nim zawsze w `czern`.
- Czarne pasy są najwyżej trzy na stronie: pasek zaufania pod pierwszym ekranem, Jak pracuję i końcowa karta z wezwaniem razem ze stopką.
- Bez gradientów, poświat i cieni pod kartami. Karty oddziela ramka, sekcje oddziela zmiana tła `krem` / `piasek`.

## Pismo

- Nagłówki w rodzinie `naglowki` (Inter Tight 600): `h1`, `h2`, `h3`, na telefonie `h1-telefon` i `h2-telefon`.
- W dużym nagłówku jedno słowo akcentu w rodzinie `akcent` (Instrument Serif, kursywa, `akcent-h1`, `akcent-h2`): „Klienci umawiają się *sami*.”, „Trzy kroki, *zero* telefonów”. Nigdy dwa słowa akcentu w jednym nagłówku.
- Tekst w rodzinie `tekst` (Inter): `tekst`, na telefonie `tekst-telefon`, na kartach `tekst-karta`, podpisy `podpis`.
- Nadtytuł `nadtytul`: wielkie litery, `grafit`, błękitna kropka 8 px przed tekstem.
- Duże cyfry kroków `cyfra` w `blekit` na czerni, jedna duża liczba z danymi `liczba` w `czern` zawsze ze źródłem pod spodem.
- Wszystkie kroje mają polskie znaki i licencję OFL; pliki są w `fonts/`, teksty licencji w `licencje/`. Na stronie ładujesz je z własnego serwera, nie z Google Fonts.

## Układ i odstępy

- Treść do `tresc-max` (1 200 px) w 12 kolumnach, marginesy `margines-komputer`, na telefonie `margines-telefon`.
- Sekcja ma `sekcja` (120 px) oddechu u góry i u dołu, na telefonie `sekcja-telefon` (72 px). Odstępy z kroku 8 px: `odstep-8` … `odstep-96`.
- Rogi: karty i zdjęcia `zaokraglenie-karta`, przyciski i etykiety `pigulka`, ramka telefonu `zaokraglenie-telefon`, karta z wezwaniem `zaokraglenie-cta`.
- Na telefonie wszystko w jednej kolumnie, przyciski na całą szerokość, polecany pakiet pierwszy, a od drugiego ekranu przyklejony na dole czarny pasek z przyciskiem `blekit` (`MobileCtaBar`).
- Każda podstrona zaczyna się okruszkami (`Breadcrumbs`) nad nadtytułem i kończy blokiem „Następny krok”: `CtaBand` i 2–3 linki `ArrowLink` do powiązanych stron.

## Stany i ruch

- Czarny przycisk po najechaniu ma tło `czern-hover`, błękitny `blekit-hover`, a strzałka przesuwa się o 4 px.
- Obrys klawiatury: `obrys-fokus` na jasnym tle, `obrys-fokus-na-czerni` w ciemnych pasach.
- Ruch tylko tam, gdzie coś wyjaśnia: pojawienie się sekcji o 12 px, rozwinięcie pytania, wsunięcie powiadomienia. 150–400 ms, raz, i nic, gdy system ma włączone ograniczenie ruchu.
- Treść widoczna bez animacji; nic nie przejmuje przewijania.

## Zdjęcia

- Właściciel zamiast stocku: portret do pasa w dziennym świetle, jasne tło, uśmiech, wzrok w obiektyw, ubranie w kolorach strony.
- Zdjęcia z zaokrągleniem `zaokraglenie-karta`. Postać bez tła stoi na `piasek-ciemny`, przy dolnej krawędzi karty.
- Zrzuty dema zawsze w tych samych ramkach: telefon w `PhoneFrame` (czarna ramka `zaokraglenie-telefon`), laptop w `LaptopFrame` (zaokrąglenie `zaokraglenie-maly`); każdy z paskiem „Projekt demonstracyjny”.
- Puste miejsce na zdjęcie: tło `piasek-ciemny`, ikona zdjęcia i podpis w `grafit`.

## Ikony

- Lucide, kreska 1,5 px, 24 px, w kolorze `czern`; na czerni w `blekit`. Bez emoji.
- Ikona przy korzyści stoi w kółku 48 px z tłem `blekit-jasny`.
- Komponent `Icon` zawiera wybrane ikony Lucide skopiowane z pakietu lucide-static (licencja ISC).

## Logo

- Logo to imię i nazwisko w `logo` (Inter Tight 600) z kropką w `blekit`: `assets/Logo/logo-mateusz-przetocki.svg` na jasnym tle i `logo-mateusz-przetocki-na-czerni.svg` w stopce.
- Monogram „MP” (`assets/Logo/monogram-mp.svg`) służy tylko jako ikona karty w przeglądarce.

## Komponenty

Komponenty są w `window.MP` i potrzebują React 18:

- Akcje: `Button` (`primary`, `outline`, `accent`, `outline-light`), `ArrowLink`.
- Tekst: `Eyebrow`, `Accent`, `Tag`.
- Ikony: `Icon`, `IconCircle`.
- Karty: `Card`, `BranchCard`, `PackageCard`.
- Sekcje: `TrustBar`, `ProcessStep`, `FaqItem`, `CtaBand`.
- Strona: `Logo`, `SiteHeader`, `Breadcrumbs`, `SiteFooter`, `MobileCtaBar`, `PhoneFrame`, `LaptopFrame`.

Ciemne tło sekcji oznaczasz klasą `mp-dark` na kontenerze: `Accent`, `Eyebrow`, `ArrowLink` i `Icon` same przechodzą wtedy na kolory dla czerni.

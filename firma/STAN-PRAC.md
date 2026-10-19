# Stan prac (przekazanie z poprzedniej rozmowy, 19.10.2026)

## Najważniejsze ustalenia

- Oferta: strony wizytówki, przez które klienci specjalistów sami umawiają konsultacje. Pakiety 1 200 / 1 800 (polecany) / 2 500 zł. Szczegóły w `PROFIL.md`.
- Własna strona: domena `mateuszprzetocki.pl` (zostaje). WordPress już na niej działa (Apache), na razie pusty: brak stron i wpisów, strona główna pokazuje wpisy, opis witryny i strefa czasowa nieustawione.
- Wygląd: krem, piasek, czerń, jasny błękit. Fonty: Inter Tight, Instrument Serif, Inter. Wszystko jest w systemie marki.
- Branże: 3 ze stroną (doradcy kredytowi, biura rachunkowe, psycholodzy i terapeuci); potem agenci ubezpieczeniowi, fizjoterapeuci, kancelarie prawne i firmy remontowe, po jednej na tydzień; 12 kolejnych w 4 grupach na `/dla-kogo/`. Własny adres tylko z własną treścią, bez stron „branża + miasto”.
- Tytuł witryny: „Mateusz Przetocki”, opis „Strony, które umawiają konsultacje”. Tytuł SEO strony głównej: „Strony z kalendarzem konsultacji | Mateusz Przetocki”.
- Drogowskazu (`firma/drogowskaz/`) nie przebudowujemy, dopóki Mateusz o to nie poprosi.

## Zasady pracy z artefaktami

- Prezentacji A i B nie wysyłamy klientom jako linku.
- Projekt w Claude Design: plansz nie renderujemy ani nie sprawdzamy zrzutami, chyba że Mateusz poprosi. Przed publikacją `canvas.json` czytamy jego aktualną wersję.

## Otwarte sprawy

- [x] Dostęp do WordPressa przez API działa (19.10, po nowym haśle aplikacji): użytkownik `agentai`, administrator.
- [ ] System szukania klientów z AI (pomysł 19.10): CEIDG (API v3 działa, klucz w ustawieniach środowiska) i rejestr KNF → ocena firm według 5 kryteriów → szkice e-maili z pytaniem o zgodę w arkuszu Google na Dysku (kolumny: firma, branża, miasto, źródło, strona, ocena, powód, e-mail, szkic, status, data). Wysyła Mateusz ręcznie. Start: doradcy kredytowi, 30 firm.
- [ ] Po uzyskaniu dostępu ustawić w WordPressie: opis witryny, strefę czasową Europe/Warsaw, statyczną stronę główną.

- [ ] Dopisać do planu strony tytuły i opisy SEO wszystkich podstron (propozycje są wyżej i w rozmowie z 19.10).
- [ ] W stopce 15 plansz projektu dodać link „Wszystkie branże” (plan już to przewiduje).
- [ ] Sprawdzić przepisy dla 4 nowych branż: ustawa o dystrybucji ubezpieczeń, zasady Krajowej Izby Fizjoterapeutów, kodeksy etyki adwokatów i radców.
- [ ] Uogólnić ankietę A w `Kod.gs` pod wszystkie branże (osobne zadanie).
- [ ] Dopasować prezentacje i szablon propozycji do nowych kolorów (osobne zadanie).
- [ ] Zdecydować, czy usunąć folder `plan-freelancer/` ze starego repozytorium `oneproductstore`.
- [ ] Zdjęcie Mateusza na stronę: dostarczy później; nie trafia do repozytorium.

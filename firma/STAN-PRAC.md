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
- [ ] System szukania klientów z AI. Pierwsza partia gotowa 19.10: arkusz „Leady – doradcy kredytowi Małopolska (19.10.2026)” w folderze na Dysku, 30 firm z CEIDG (PKD 6619Z/6419Z/6499Z, założone od 10.2024), z oceną 3–9, powodem i szkicem e-maila z pytaniem o zgodę (stopka RODO art. 14 tylko przy e-mailu z CEIDG). 13 ma e-mail, 16 bez e-maila (szukać kontaktu), 1 pominięta (ma Calendly). Strony „do sprawdzenia” to domeny zgadnięte po nazwie, niepotwierdzone. Wysyła Mateusz ręcznie, max kilka dziennie. Następnie: po tygodniu policzyć „TAK”, potem zadanie cotygodniowe i kolejne branże (agenci ubezpieczeniowi: 32 firmy z PKD 6622Z w tej samej partii z CEIDG). Uwagi techniczne: API CEIDG v3 przyjmuje max 25 wyników na stronę, duże zapytania kończą się 502, więc zawężać datą (`dataod`); filtr PKD łapie kod na dowolnej pozycji, główny kod trzeba sprawdzać w szczegółach firmy. Przeliczenie 20.10 według reguł (bez Google i KNF, próg tymczasowy: zwycięzca ≥ 54 z 77 możliwych, rezerwa 39–53): 13 zwycięzców (11 z e-mailem, 2 przez formularz na stronie), 16 w rezerwie, 1 odpada (Calendly). Sprawdzenie w Chromium pokazało, że 3 „znalezione” strony należały do innych firm (AJ Finanse, Tomasz Zawada, Home4You). Nowy arkusz czeka na decyzję: włączyć konektor Google Sheets (aktualizacja tego samego pliku) albo wgrać nową wersję. Skrypty i reguły oceny (`REGULY.md`, ustalone 20.10): `firma/automatyzacja/leady/`.
- [ ] Po uzyskaniu dostępu ustawić w WordPressie: opis witryny, strefę czasową Europe/Warsaw, statyczną stronę główną.

- [ ] Dopisać do planu strony tytuły i opisy SEO wszystkich podstron (propozycje są wyżej i w rozmowie z 19.10).
- [ ] W stopce 15 plansz projektu dodać link „Wszystkie branże” (plan już to przewiduje).
- [ ] Sprawdzić przepisy dla 4 nowych branż: ustawa o dystrybucji ubezpieczeń, zasady Krajowej Izby Fizjoterapeutów, kodeksy etyki adwokatów i radców.
- [ ] Uogólnić ankietę A w `Kod.gs` pod wszystkie branże (osobne zadanie).
- [ ] Dopasować prezentacje i szablon propozycji do nowych kolorów (osobne zadanie).
- [ ] Zdecydować, czy usunąć folder `plan-freelancer/` ze starego repozytorium `oneproductstore`.
- [ ] Zdjęcie Mateusza na stronę: dostarczy później; nie trafia do repozytorium.

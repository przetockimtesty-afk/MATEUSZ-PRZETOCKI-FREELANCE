# Umowy z klientami

Jedna umowa (wersja 4 z 20.10.2026): tabela zamówienia, lista „Co obejmuje zamówienie” dla
wybranego wariantu, lista „Co dostarcza Zamawiający”, 15 punktów zasad i podpisy (u klienta ok. 3 strony),
a na ostatniej stronie informacja o odstąpieniu z formularzem. We wzorze są listy wszystkich trzech
wariantów; w kopii dla klienta zostaje jedna. Żywe wersje są w Dokumentach Google w folderze
„Umowy” na Dysku; tu jest ich źródło.

Na Dysku konta przetockimateusz.kontakt@gmail.com (folder https://drive.google.com/drive/folders/1BayTPDz32xQnRddM-FIqxbZfGFU-Io2V, kopie z 27.10; pierwsze wersje zostają na puresofaadmin@gmail.com):

- „Umowa · WZÓR umowy o wykonanie strony”: https://docs.google.com/document/d/1psJH8myyyqnbgYteX7lHS_OBQuLkmg4sWzL-9Nz0XPs/edit
- „Umowa · jak używać wzoru (krok po kroku)”: https://docs.google.com/document/d/17E7mve7MVsrRnLgq8bfYdE07N_cQrvqzwt09kmJypO0/edit

## Jak to działa

1. Kopia wzoru, żółte pola do wpisania, zielone opcje do wyboru (w tym lista zakresu wybranego wariantu), PDF.
2. E-mail „Umowa”: klient podpisuje i odsyła skan albo zdjęcie (albo podpis palcem na PDF w telefonie)
   i wpłaca zadatek. Podpis oznacza też prośbę o start od razu (pkt 2 umowy).
3. E-mail „Zaczynam” z podpisaną umową. Koniec formalności, bez papieru i bez spotkań.

Prawa autorskie (pkt 9 i 10): umowa przenosi prawa po zapłacie. Przeniesienie wymaga podpisów na
oryginale (art. 53 prawa autorskiego), więc przy podpisie na skanie klient ma od zapłaty licencję
na 50 lat na tych samych polach, a Mateusz nie licencjonuje projektu i tekstów nikomu innemu.
Oryginał podpisują tylko wtedy, gdy klient o to poprosi.

## Pliki

| Plik | Co to jest |
|---|---|
| `umowa.src.html` | źródło wzoru umowy |
| `instrukcja.src.html` | źródło instrukcji z dwoma e-mailami |
| `zbuduj.py` | `python3 firma/umowy/zbuduj.py` → `build/umowa.docx` i `build/instrukcja.html` |
| `build/` | pliki wgrane na Dysk (Dysk zamienia je w Dokumenty Google) |

## Zasady

- Zmiany treści robimy w `*.src.html`, budujemy i wgrywamy na Dysk jako nowy plik albo wprowadzamy
  ręcznie w Dokumencie Google i przenosimy tutaj. Obie wersje mają mówić to samo.
- Danych kontaktowych Mateusza ani zdjęcia jego podpisu nie wpisujemy do repozytorium: zostają pola
  `{{EMAIL_KONTAKT}}`, `{{ADRES_WYKONAWCY}}` i `{{NR_KONTA}}`.
- Umowa przez .docx, a nie HTML: konwersja HTML na Dysku gubi podziały stron (sprawdzone 20.10.2026
  na 14 zapisach podziału), a .docx je zachowuje razem z kolorami pól i numeracją.
- Warunki w umowie muszą zgadzać się ze stroną Oferta i z propozycją w `automatyzacja/Kod.gs`
  (zadatek 40%, 2 rundy poprawek, 30 dni wsparcia, faktura bez VAT). Listy zakresu wariantów 1–3
  i lista materiałów odpowiadają stronie Oferta i punktowi 6 propozycji; przy zmianie pakietów zmień wszystkie.
- Wariant B (strona, która wycenia, np. dla pralni) nie ma jeszcze listy zakresu w umowie; dopisać,
  gdy pojawi się taki klient.
- Wzór nie był jeszcze sprawdzony przez radcę.

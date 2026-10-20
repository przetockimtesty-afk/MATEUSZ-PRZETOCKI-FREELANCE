# Umowy z klientami

Wzór umowy o wykonanie strony (wersja 1 z 20.10.2026) i instrukcja wysyłki. Żywe wersje są
w Dokumentach Google, w folderze „Umowy” na Dysku; tu jest ich źródło.

| Plik | Co to jest |
|---|---|
| `umowa.src.html` | źródło wzoru: umowa § 1–11 i załączniki 1–3 |
| `instrukcja.src.html` | źródło instrukcji: co się zmienia, wysyłka, e-maile 1–3, punkty dla radcy |
| `zbuduj.py` | `python3 firma/umowy/zbuduj.py` → `build/umowa.docx` i `build/instrukcja.html` |
| `build/` | pliki wgrane na Dysk (Dysk zamienia je w Dokumenty Google) |

Na Dysku (folder https://drive.google.com/drive/folders/1bNf1iI9igG1IVPrbyNRiolhnoFa9mz1A):

- „WZÓR · Umowa o wykonanie strony”: https://docs.google.com/document/d/1KtsNCeaSxQPIVNJ3y7Jye8pKtcZ1QFHcrE2XBwzLGLc/edit
- „Umowy · jak wypełniać i wysyłać”: https://docs.google.com/document/d/1Cm58nneEbuMnMAZAOD8lH5VHL5G8YcaSj6BwbnGJV7A/edit

## Jak to działa w skrócie

- Treść umowy jest stała. Dla klienta zmieniają się tylko kolorowe pola: żółte (dane klienta
  i umowy), niebieskie (z propozycji), zielone (opcje do wyboru), fioletowe (dane Mateusza, raz we wzorze).
- Umowę z Załącznikami 1–3 klient przyjmuje e-mailem jednym zdaniem, które zawiera też żądanie
  rozpoczęcia prac przed upływem 14 dni na odstąpienie. Potwierdzenie idzie e-mailem z PDF.
- Przeniesienie praw autorskich (Załącznik 3) podpisujemy po zapłacie na papierze w dwóch
  egzemplarzach albo kwalifikowanymi podpisami (art. 53 prawa autorskiego). Do tego czasu klient
  ma licencję z § 7 ust. 2.

## Zasady

- Zmiany treści robimy w `*.src.html`, budujemy i wgrywamy na Dysk jako nowy plik albo wprowadzamy
  ręcznie w Dokumencie Google i przenosimy tutaj. Obie wersje mają mówić to samo.
- Danych kontaktowych Mateusza nie wpisujemy do źródła: zostają pola `{{EMAIL_KONTAKT}}`,
  `{{ADRES_WYKONAWCY}}` i `{{NR_KONTA}}`.
- Umowa przez .docx, a nie HTML: konwersja HTML na Dysku gubi podziały stron (sprawdzone 20.10.2026
  na 14 zapisach podziału), a .docx je zachowuje razem z kolorami pól i numeracją.
- Warunki w umowie muszą zgadzać się ze stroną Oferta i z propozycją w `automatyzacja/Kod.gs`
  (zadatek 40%, 2 rundy poprawek, 30 dni wsparcia, faktura bez VAT).
- Wzór nie był jeszcze sprawdzony przez radcę; punkty do sprawdzenia są na końcu instrukcji.

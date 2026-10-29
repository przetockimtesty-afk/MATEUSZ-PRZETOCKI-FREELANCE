# Mateusz Przetocki · freelance

Pliki mojej działalności: strony wizytówki z umawianiem konsultacji.
Repozytorium jest prywatne i nie trafia do klientów.

## Co jest w repozytorium

```
firma/
  PROFIL.md                 kim jestem, oferta, ceny, decyzje (aktualizowane na bieżąco)
  STAN-PRAC.md              ustalenia, plan i otwarte sprawy (aktualizowane po każdym zadaniu)
  notatki/                  moje notatki przesłane w rozmowie (np. plan z 23.10)
  drogowskaz/               plan działania w PDF i jego źródło (plan.html, build.js)
                            oraz workflow wersji A i B (workflow.html, build_workflow.js)
  automatyzacja/            Kod.gs: ankiety Google → propozycja; INSTRUKCJA.md
  wdrozenia/                instrukcja wdrażania kalendarza MP Rezerwacje u klienta (HTML → PDF, zbuduj.js)
  umowy/                    wzór umowy z klientem i instrukcja (źródła Dokumentów Google)
  prezentacje/
    A-konsultacja/          źródło prezentacji A (deck.json + slajdy)
    B-wycena/               źródło prezentacji B
strona/                     moja strona mateuszprzetocki.pl
  plan-strony.md            kopia dokumentu „Plan strony” (stan z 19.10.2026, po drugiej rozmowie)
  projekt-claude-design/    źródło projektu strony: 16 plansz + canvas.json
  system-marki/             system „Mateusz Przetocki”: kolory, fonty, logo, 21 komponentów
  makieta/                  wcześniejsza makieta HTML strony głównej
  narzedzia/                skrypty do systemu marki (ds_gen.py generuje bundle.js i podglądy)
  wordpress/                strona w blokach WordPressa: generator (zbuduj.js), wysyłka (wyslij.py),
                            walidator bloków, CSS marki, ilustracje wyrenderowane z plansz
  wtyczki/
    mp-rezerwacje/          własna wtyczka: kalendarz rezerwacji, e-maile, Google, panel (README w środku)
klienci/                    projekty klientów, każdy w osobnym folderze
backups/                    kopie zasobów WordPressa sprzed każdej zmiany (wp.py, wyslij.py)
wp.py                       klient WordPress REST API (zapisy z backupem i weryfikacją)
WP-REST.md                  zasady pracy z WordPressem, wczytywane przez CLAUDE.md
```

W źródłach prezentacji adres e-mail jest zastąpiony znacznikiem `{{EMAIL_KONTAKT}}`.

## Co jest poza repozytorium

Na koncie claude.ai (wersje robocze, na których pracuję z Claude):

| Co | Link |
|---|---|
| Plan strony (dokument) | https://claude.ai/artifact/18efhQBKrswtcSeS26i5RJ |
| System marki „Mateusz Przetocki” | https://claude.ai/artifact/DmzGLSZNV7yk6xEj32MEGf |
| Projekt strony w Claude Design | https://claude.ai/artifact/AwjxcZqAzZKw2QsoY7uzQr |
| Prezentacja A · Konsultacja | https://claude.ai/artifact/JYVupAvTxMymEotwHEWnWU |
| Prezentacja B · Wycena | https://claude.ai/artifact/D2HnDLVphSDfE4KnVvHn67 |

W Google: formularze ankiet A i B, arkusz z odpowiedziami, szablony propozycji
i projekt Apps Script z `Kod.gs`.

Na Dysku Google, nie tutaj: zdjęcia, filmy, materiały od klientów i kopie
stron z WordPressa.

## Stan zapisu (29.10.2026)

| Co | GitHub | claude.ai | Dysk Google |
|---|---|---|---|
| Strona mateuszprzetocki.pl (WordPress: 21 opublikowanych stron, w tym `/wycena/` i 5 formularzy dla klientów tylko z linku od 26.10; szkic: demo; indeksowanie włączone) | źródło `strona/wordpress/`, kopie `backups/` (bez wyrenderowanego HTML) | projekt w Claude Design to wzór | — |
| Dane kontaktowe na stronie (e-mail, adres) | nie, z zasady; tylko ID wzorców w `strona/wordpress/wzorce.json` | — | — |
| Film z kalendarza na „Realizacjach” (media 143, okładka 144) | nie: jest na nim zdjęcie Mateusza | — | — |
| Zdjęcia Mateusza (na stronie: media 101–104 w WordPressie) | nie, z zasady | — | oryginały, 3 pliki WebP i ich wersje PNG |
| SEO w Rank Math (tytuły, opisy, noindex formularzy, ustawienia) | tytuły w `strona/wordpress/zbuduj.js` (`TYTULY_SEO`), wysyłka `wyslij.py seo`, kopie ustawień w `backups/rankmath-*` | — | — |
| Ustawienia Complianz i PixelYourSite (piksel, GA4, API konwersji) | ściąga kreatora `firma/wdrozenia/complianz-kreator.md` | — | — |
| Drogowskaz PDF | tak | — | tak, ta sama wersja co w repozytorium |
| Workflow A i B PDF | tak | — | tak, ta sama wersja co w repozytorium |
| PROFIL.md, Kod.gs (ankieta ze strony, jedna prezentacja dla A i B, pola zwrotu), INSTRUKCJA.md | tak | — | — |
| Plan strony (z tytułami SEO i przepisami branż) | kopia z 19.10, po zmianach | wersja robocza | — |
| System marki | tak | tak | — |
| Projekt strony w Claude Design (stopka z „Wszystkie branże”) | tak | tak, wersja 21 | — |
| Prezentacja sprzedażowa (zastępuje A i B w automacie) | źródło `firma/prezentacje/sprzedaz/` | tak: https://claude.ai/artifact/HXPH6cbCgCu9JELWYmmzaz (tytuły slajdów 1 i 14 nadal rozbite na osobne pola, więc nowy eksport PPTX psuje szablon) | „Prezentacja sprzedażowa.pptx” (wgrał Mateusz 27.10) i zrobiony z niej „Szablon A · Google Slides” w folderze „Ankiety i prezentacje klientów”, poprawiony 27.10 tylko tam |
| Prezentacja „Jak przebiega współpraca” (slajd 3 poprawiony 28.10) | źródło `firma/prezentacje/wspolpraca/` | tak: https://claude.ai/artifact/YJJgiBYqYbL56kq6dz7bvA, wersja 7 | — (PDF do umowy eksportuje Mateusz, po 28.10 od nowa) |
| Plan zmian strony i oferty (propozycja z 28.10, decyzje Mateusza z 28.10 na górze) | `strona/plan-zmian-2026-10-28.html` | — | Dokument Google „Plan · strona i oferta: co zmienić (propozycja z 28.10)”, ta sama treść |
| Plan nowej strony: mapa i sekcje (wersja końcowa z 29.10) | `strona/plan-strony-2026-10-29.html` | — | Dokument Google „Plan · nowa strona: mapa i sekcje”, ta sama treść |
| Plan sprzedaży: od pierwszej wiadomości do umowy (propozycja z 28.10, zastępuje sekcje 11 i 16 drogowskazu) | `firma/plan-sprzedazy-2026-10-28.html` | — | Dokument Google „Plan · sprzedaż: od pierwszej wiadomości do umowy”, ta sama treść |
| Prezentacje A i B (stare, zostają jako zapas) | źródła | tak | — |
| Scenariusze filmów dla klientów | playlista 1 „Na start” (7 filmów z tekstem lektora, od 28.10): `firma/filmy/na-start.html`; playlisty 2 i 3: `firma/filmy/scenariusze.md` | stara wersja z 26.10 w zakładce „Scenariusze filmów” rozpiski | Dokument Google „Scenariusze · filmy „Na start” dla klienta” (28.10), ta sama treść co `na-start.html` |
| Lista wszystkich zadań Mateusza (PDF, 9 stron, ze scenariuszami filmów) | `firma/zadania/` (źródło `zadania.html`, PDF z `zbuduj.js`, wersja dla Dokumentów Google z `dokument_google.py`) | ta sama lista w rozpisce (wiersz niżej) | Dokument Google „Zadania · co mam do zrobienia” (od 27.10 Mateusz odhacza w nim zadania, więc jest nowszy niż źródło w repozytorium; 28.10 lista filmów zmieniona na 7 z odnośnikiem do scenariuszy); sam PDF wgrywa Mateusz |
| Rozpiska dla Mateusza: kroki na 26.10, tabela filmów ze statusem, decyzje | skrót w `firma/STAN-PRAC.md` | tak: https://claude.ai/artifact/H7J4xq9ZYfYWBnhPVr8T1a (statusy i odhaczenia są tylko tam) | — |
| Wzór umowy i instrukcja | źródło `firma/umowy/` | — | Dokumenty Google w folderze „Umowy”, ta sama wersja 4 |
| Kalendarz u klienta: wdrożenie krok po kroku | PDF i źródło w `firma/wdrozenia/` | — | Dokument Google z tą samą treścią; PDF do wgrania przez Mateusza |
| Wtyczka MP Rezerwacje (na stronie 0.1.1 od 26.10) | szkielet `strona/wtyczki/mp-rezerwacje/`, ZIP `strona/wtyczki/zip/`, ustawienia mojej strony `strona/wordpress/rezerwacje-ustawienia.json` | — | — |
| Wtyczka MP Ankiety 0.1.0 (na stronie od 26.10) | szkielet `strona/wtyczki/mp-ankiety/`, ZIP `strona/wtyczki/zip/`, ankiety mojej strony `strona/wordpress/ankiety.js` | — | — |

Wersja żywa strony jest w WordPressie (LH.pl). Od 19.10 teksty i grafiki edytuję tam,
w edytorze. Repozytorium ma źródło pierwszego wgrania i kopie sprzed każdej zmiany agenta.

Folder na Dysku (konto przetockimateusz.kontakt@gmail.com, od 27.10): https://drive.google.com/drive/folders/1CdwXf5Rm1dcKV-QBiEEhaQnMhPNzqyUU
(umowy w podfolderze „Umowy”: https://drive.google.com/drive/folders/1BayTPDz32xQnRddM-FIqxbZfGFU-Io2V). Spis plików: „00 · Przeczytaj najpierw” w tym folderze.
Stary folder na puresofaadmin@gmail.com zostaje jako archiwum.
Wzór umowy edytujesz w Dokumencie Google; większą zmianę przenieś też do `firma/umowy/umowa.src.html`.

## Generowanie plików

- PDF drogowskazu: `node firma/drogowskaz/build.js` (wymaga Playwright i pypdf).
- Komponenty systemu marki po zmianie w `system-marki/src/bundle.template.js`:
  `python3 strona/narzedzia/ds_gen.py strona/system-marki`.
- PDF wdrożenia kalendarza: `node firma/wdrozenia/zbuduj.js` (Playwright z `strona/wordpress/node_modules`).
- Strona w WordPressie: raz `npm ci` w `strona/wordpress/`, potem z katalogu głównego
  `python3 strona/wordpress/wyslij.py [etap]` (zasady w `WP-REST.md`).
  Ilustracje z plansz: `node strona/wordpress/renderuj.js`.

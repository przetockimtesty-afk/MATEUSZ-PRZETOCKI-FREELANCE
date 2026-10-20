# Mateusz Przetocki · freelance

Pliki mojej działalności: strony wizytówki z umawianiem konsultacji.
Repozytorium jest prywatne i nie trafia do klientów.

## Co jest w repozytorium

```
firma/
  PROFIL.md                 kim jestem, oferta, ceny, decyzje (aktualizowane na bieżąco)
  drogowskaz/               plan działania w PDF i jego źródło (plan.html, build.js)
                            oraz workflow wersji A i B (workflow.html, build_workflow.js)
  automatyzacja/            Kod.gs: ankiety Google → propozycja; INSTRUKCJA.md
  umowy/                    wzór umowy z klientem i instrukcja wysyłki (źródła Dokumentów Google)
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

## Stan zapisu (20.10.2026, po wzorze umowy)

| Co | GitHub | claude.ai | Dysk Google |
|---|---|---|---|
| Strona mateuszprzetocki.pl (WordPress, 14 podstron) | źródło `strona/wordpress/`, kopie `backups/` | projekt w Claude Design to wzór | — |
| Zdjęcia Mateusza (na stronie: media 92–94 w WordPressie) | nie, z zasady | — | oryginały, 2 pliki |
| Drogowskaz PDF | tak | — | tak, ta sama wersja co w repozytorium |
| Workflow A i B PDF | tak | — | tak, ta sama wersja co w repozytorium |
| PROFIL.md, Kod.gs, INSTRUKCJA.md | tak | — | — |
| Plan strony (z tytułami SEO i przepisami branż) | kopia z 19.10, po zmianach | wersja robocza | — |
| System marki | tak | tak | — |
| Projekt strony w Claude Design (stopka z „Wszystkie branże”) | tak | tak, wersja 21 | — |
| Prezentacje A i B | źródła | tak | — |
| Wzór umowy i instrukcja wysyłki | źródło `firma/umowy/` | — | Dokumenty Google w folderze „Umowy”, ta sama wersja 1 |

Wersja żywa strony jest w WordPressie (LH.pl). Od 19.10 teksty i grafiki edytuję tam,
w edytorze. Repozytorium ma źródło pierwszego wgrania i kopie sprzed każdej zmiany agenta.

Folder na Dysku: https://drive.google.com/drive/folders/1rwFHbmAzA8V6gCV41brlmOkADtZOGauw
(umowy w podfolderze „Umowy”: https://drive.google.com/drive/folders/1bNf1iI9igG1IVPrbyNRiolhnoFa9mz1A).
Wzór umowy edytujesz w Dokumencie Google; większą zmianę przenieś też do `firma/umowy/umowa.src.html`.

## Generowanie plików

- PDF drogowskazu: `node firma/drogowskaz/build.js` (wymaga Playwright i pypdf).
- Komponenty systemu marki po zmianie w `system-marki/src/bundle.template.js`:
  `python3 strona/narzedzia/ds_gen.py strona/system-marki`.
- Strona w WordPressie: raz `npm ci` w `strona/wordpress/`, potem z katalogu głównego
  `python3 strona/wordpress/wyslij.py [etap]` (zasady w `WP-REST.md`).
  Ilustracje z plansz: `node strona/wordpress/renderuj.js`.

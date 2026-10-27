# Zasady pracy w tym repozytorium

- Odpowiadaj po polsku.
- To repozytorium jest prywatne. Pliki z `firma/` nie trafiają do klientów.
- Nie zapisuj w plikach numeru telefonu ani adresu e-mail Mateusza (w prezentacjach jest znacznik `{{EMAIL_KONTAKT}}`). Jego zdjęcie nie trafia do repozytorium.

- Na początku sesji przeczytaj `firma/STAN-PRAC.md` (ustalenia i otwarte sprawy) i aktualizuj go po każdym zadaniu.

## Dysk Google

- Folder „Mateusz Przetocki Freelance” na koncie przetockimateusz.kontakt@gmail.com: https://drive.google.com/drive/folders/1CdwXf5Rm1dcKV-QBiEEhaQnMhPNzqyUU (id `1CdwXf5Rm1dcKV-QBiEEhaQnMhPNzqyUU`), podfoldery „Umowy” i „Zdjęcia na stronę”. Na górze leży „00 · Przeczytaj najpierw: co jest w tym folderze”: po każdym nowym albo przemianowanym pliku popraw ten spis. Nazwy plików zaczynają się od rodzaju (Zadania, Instrukcja, Plan, Umowa, Leady, Zdjęcie). Stary folder na puresofaadmin@gmail.com (`1rwFHbmAzA8V6gCV41brlmOkADtZOGauw`) to archiwum z 19–26.10.
- Ważne materiały dla Mateusza (zadania, podsumowania, PDF-y i prezentacje, o które prosi) od razu wgrywaj do tego folderu. Gdy zmienia się ich treść, na Dysk też idzie nowa wersja (prośba Mateusza z 26.10).
- Złącze Dysku nie przyjmie pliku większego niż ok. kilkadziesiąt KB (plik idzie jako tekst w wywołaniu narzędzia). Wtedy treść wgraj jako Dokument Google (HTML, Dysk sam go zamienia), a sam PDF albo PPTX Mateusz wgrywa sam: daj mu plik w czacie albo link „raw” z GitHuba i link do folderu.
- Od 27.10 są włączone złącza Google Docs i Google Slides (od 27.10 wszystkie złącza Google są na koncie przetockimateusz.kontakt@gmail.com, GitHub na `przetockimtesty-afk`): nową wersję dokumentu albo prezentacji zapisuj w tym samym pliku, link zostaje. Gdy się nie da (np. PDF), nowy plik, a staremu zmień tytuł na „… (stara wersja)” i powiedz o tym Mateuszowi; nie usuwaj go.

## Przypominanie, co jest zapisane

Po każdym większym zadaniu i na początku nowej sesji krótko przypomnij, co jest gdzie zapisane:
- **GitHub** (to repozytorium): co jest wysłane, a co czeka na commit.
- **claude.ai** (plan strony, system marki, projekt w Claude Design, prezentacje): co zmieniło się tylko tam i nie ma kopii w repozytorium.
- **Dysk Google**: które PDF-y są wgrane, a które są nowsze w repozytorium niż na Dysku.
- **Tymczasowe pliki sesji**: co zniknie po jej zamknięciu, jeśli się tego nie zapisze.

Aktualny stan prowadź w tabeli „Stan zapisu” w `README.md`.

## WordPress (mateuszprzetocki.pl)

Przy każdej pracy z WordPressem obowiązują zasady z `WP-REST.md`, a zapisy idą przez `wp.py`. Dane dostępu są w zmiennych środowiska sesji (`WP_URL`, `WP_USER`, `WP_APP_PASS`), nigdy w plikach repozytorium.

@WP-REST.md

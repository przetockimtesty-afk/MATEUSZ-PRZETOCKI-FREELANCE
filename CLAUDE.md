# Zasady pracy w tym repozytorium

- Odpowiadaj po polsku.
- To repozytorium jest prywatne. Pliki z `firma/` nie trafiają do klientów.
- Nie zapisuj w plikach numeru telefonu ani adresu e-mail Mateusza (w prezentacjach jest znacznik `{{EMAIL_KONTAKT}}`). Jego zdjęcie nie trafia do repozytorium.

- Na początku sesji przeczytaj `firma/STAN-PRAC.md` (ustalenia i otwarte sprawy) i aktualizuj go po każdym zadaniu.

## Dysk Google

- Folder „Mateusz Przetocki Freelance”: https://drive.google.com/drive/folders/1rwFHbmAzA8V6gCV41brlmOkADtZOGauw (id `1rwFHbmAzA8V6gCV41brlmOkADtZOGauw`).
- Ważne materiały dla Mateusza (zadania, podsumowania, PDF-y i prezentacje, o które prosi) od razu wgrywaj do tego folderu. Gdy zmienia się ich treść, na Dysk też idzie nowa wersja (prośba Mateusza z 26.10).
- Złącze Dysku nie przyjmie pliku większego niż ok. kilkadziesiąt KB (plik idzie jako tekst w wywołaniu narzędzia). Wtedy treść wgraj jako Dokument Google (HTML, Dysk sam go zamienia), a sam PDF albo PPTX Mateusz wgrywa sam: daj mu plik w czacie albo link „raw” z GitHuba i link do folderu.
- Złącza do edycji Dokumentów i Prezentacji Google nie ma (jest tylko Dysk i Arkusze), więc nowa wersja to nowy plik. Starego nie usuwaj: zmień jego tytuł na „… (stara wersja)” i powiedz o tym Mateuszowi. Gdy złącze Google Docs będzie włączone, zmieniaj ten sam dokument.

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

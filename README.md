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
  prezentacje/
    A-konsultacja/          źródło prezentacji A (deck.json + slajdy)
    B-wycena/               źródło prezentacji B
strona/                     moja strona mateuszprzetocki.pl
  plan-strony.md            kopia dokumentu „Plan strony” (stan z 19.10.2026)
  projekt-claude-design/    źródło projektu strony: 16 plansz + canvas.json
  system-marki/             system „Mateusz Przetocki”: kolory, fonty, logo, 21 komponentów
  makieta/                  wcześniejsza makieta HTML strony głównej
  narzedzia/                skrypty do systemu marki (ds_gen.py generuje bundle.js i podglądy)
klienci/                    projekty klientów, każdy w osobnym folderze
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

## Generowanie plików

- PDF drogowskazu: `node firma/drogowskaz/build.js` (wymaga Playwright i pypdf).
- Komponenty systemu marki po zmianie w `system-marki/src/bundle.template.js`:
  `python3 strona/narzedzia/ds_gen.py strona/system-marki`.

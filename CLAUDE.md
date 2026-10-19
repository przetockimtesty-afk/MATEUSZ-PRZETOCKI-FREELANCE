# AI SKLEP — projekt WordPress

Środowisko: Windows 11, PowerShell. Python uruchamiamy jako `python` (nie `python3`).
Dane dostępowe w `.env` (WP_URL, WP_USER, WP_APP_PASS) — parsuje je `wp.py`.
Nigdy nie wypisuj wartości z `.env` w odpowiedziach ani logach.

<!-- ===== POCZĄTEK BLOKU ===== -->

## WordPress REST API — zasady pracy na tej stronie

> Blok wspólny dla wszystkich projektów WP, używany razem z klientem `wp.py`.
> Każda reguła niżej odpowiada awarii, która już się wydarzyła — nie skracaj ich „bo oczywiste".
> Uzupełnij tylko tabelę **Ta instalacja** na końcu.

**Reguła nadrzędna: to jest produkcja.** Nie ma stagingu, każdy zapis jest od razu żywy
i widoczny dla Google. Dlatego każda zmiana ma trzy kroki, nigdy jeden:
**backup → zapis → weryfikacja na wyrenderowanym froncie.**

### 1. Dostęp

- **Application Password**, nie hasło do konta. Osobny użytkownik (np. `claude`), żeby dało się
  go unieważnić i żeby w historii wpisów było widać, co zrobił agent.
- **Najniższa rola, która wystarcza** — zacznij od *Redaktora*. Administratora nadawaj dopiero,
  gdy konkretny endpoint wtyczki oddaje 403 (regeneracja cache Elementora, opcje SEO, snippety).
  Hasła aplikacyjnego **nie da się ograniczyć do wybranych uprawnień** — dziedziczy całą rolę
  i **omija 2FA**. Traktuj je jak klucz do całego konta.
- **Kill switch:** *Użytkownicy → Profil → Hasła aplikacji → Unieważnij.* Robisz to po skończonym
  zleceniu albo przy pierwszym podejrzeniu wycieku. Odwołanie działa natychmiast.
- `.env` w katalogu projektu, **wpisany do `.gitignore`**.
- ⛔ **Nie rób `source .env`** (ani odpowiednika w PowerShellu). Hasło aplikacyjne ma spacje →
  shell tnie je na kawałki, a Ty dostajesz niewyjaśnione **401**. Parsuj plik (robi to `wp.py`)
  i **usuń spacje** przed Basic auth.
- To samo hasło aplikacyjne autoryzuje **wszystkie przestrzenie REST**: `wp/v2`, `wc/v3`
  (WooCommerce — nie trzeba consumer key/secret), `rankmath/v1`, `elementor/v1`,
  `redirection/v1`, `code-snippets/v1` i własne endpointy.
- Hasło nigdy nie trafia do URL-a, do logu, do commita ani do wiadomości dla użytkownika.
- **Pierwsze wywołanie w każdej sesji:** `python wp.py me` — potwierdza, na kim pracujesz
  i z jaką rolą, zanim cokolwiek ruszysz.

### 2. Zapisy idą przez `wp.py`

| Komenda | Co robi |
|---|---|
| `python wp.py me` | kim jestem, jaka rola, czy API w ogóle odpowiada |
| `python wp.py types` | CPT tej instalacji + `rest_base` + taksonomie |
| `python wp.py schema blog` | jakie pola i jakie **meta** ten CPT naprawdę przyjmuje |
| `python wp.py get "wp/v2/pages/6?context=edit&_fields=title,slug"` | odczyt |
| `python wp.py backup pages 6` | pełny `context=edit` do `backups/` |
| `python wp.py lint payload.json` | asercje na treści bez wysyłki |
| `python wp.py create blog payload.json` | dedup slugu → lint → nowy wpis **jako draft** |
| `python wp.py write pages 6 payload.json` | **lint → backup → POST → porównanie długości** |
| `python wp.py rollback backups/pages-6-*.json` | przywrócenie stanu sprzed zmiany |
| `python wp.py media foto.jpg "Alt tekst"` | upload + `alt_text` + id do `featured_media` |
| `python wp.py check https://domena.pl/s/ "MARKER"` | front **anonimowo**: page-id, canonical, H1, CSS, JSON-LD |

Jeśli w wyjątkowej sytuacji strzelasz ręcznie (`curl.exe` / `Invoke-WebRequest`), cztery rzeczy
są obowiązkowe tak samo: przeglądarkowy User-Agent, sprawdzenie kodu HTTP **przed** parsowaniem
JSON-a, backup przed nadpisaniem i weryfikacja na froncie.

### 3. Rozpoznanie instalacji przed pierwszym zapisem

Nie zakładaj domyślnego WordPressa:

```bash
python wp.py types                  # CPT: nazwa ≠ rest_base; `posts` często NIE jest blogiem
python wp.py schema <rest_base>     # pola i meta — czego tu w ogóle nie da się zapisać
python wp.py get "wp/v2/taxonomies?context=edit&_fields=slug,rest_base,types"
python wp.py get "wp/v2/block-types?_fields=name"    # szukaj bloków acf/
```

- **`rest_base` bywa inny niż nazwa typu**, a blog bywa osobnym CPT (`blog`, `article`,
  `service`, `case-study`). Pomyłka „blog to `posts`" kosztowała 25 duplikatów wpisów.
- **Pre-flight dedup przed każdym utworzeniem treści:** `GET wp/v2/<rest_base>?slug=<slug>`
  ze statusami `publish,draft,pending,future,private`. Brak wpisu potwierdź, nie zakładaj.
- **Taksonomie ustawiaj w tym samym payloadzie**, w którym tworzysz wpis (`{"kategoria":[ID]}`).
- Sprawdź, **skąd bierze się menu i stopka**. Bywają generowane przez snippety PHP, a nie menu WP —
  wtedy podmiana linków w treści ich nie ruszy. Flagi `active` w API wtyczek potrafią kłamać —
  weryfikuj porównaniem kodu z żywym HTML-em.

### 4. Backup przed każdym nadpisaniem — bez wyjątków

- Robi go `python wp.py backup <typ> <id>` (i automatycznie `write`).
- **`?context=edit` jest obowiązkowe.** Bez niego odpowiedź nie zawiera `content.raw`
  ani meta chronionych (`_elementor_data`, pola wtyczek) — backup wygląda na zrobiony, a jest pusty.
- Pliki w `backups/` zostają. Nie kasuj ich „przy sprzątaniu".
- Druga siatka: **rewizje WP niosą też `_elementor_data`** —
  `GET wp/v2/pages/{id}/revisions/{rev}?context=edit`.
- Przy stronie w Elementorze: policz węzły `_elementor_data` przed i po. Ta sama liczba = projekt cały.
- Backupuj też to, co **nie jest treścią**: snippety PHP (`code-snippets/v1/snippets`),
  dodatkowy CSS z Customizera, reguły przekierowań. Nie mają kosza ani rewizji.

### 5. HTTP 200 nie znaczy „udało się"

1. **Antybot hostingu** oddaje stronę „Potwierdź, że nie jesteś robotem" **ze statusem 200**.
   `JSONDecodeError: line 1 column 1` — to **nie jest awaria API**.
2. **`rate limited`** jako goły tekst, też bywa z 200 (albo z 429 i `retry-after`).
3. **Meta wtyczki zapisane w `meta`** — 200, a pole nie zostało zapisane, bo nie jest
   zarejestrowane w REST (§10).
4. **Parser bloków bailuje** na źle zescapowanym bloku i zapisuje kikut treści (§7).
5. **Adres draftu zwraca 200 z cudzą treścią** (WP dopasowuje po slugu). Sprawdzaj `page-id-{ID}`
   w `<body class>` albo `rel=canonical` równy własnemu adresowi.

⚠️ Te sprawdzenia rób **bez uwierzytelnienia** — zalogowanemu WP wyrenderuje też draft.
`wp.py check` celowo nie wysyła Basic auth.

Zasada: **sprawdź, czy odpowiedź w ogóle zaczyna się od `{` albo `[`.** Gdy nie — przerwij robotę,
nie debuguj API. **Weryfikacja zawsze osobnym kanałem: wyrenderowany front z cache-busterem.**

### 6. Limity, WAF, antybot

- **Najpierw User-Agent, dopiero potem backoff.** Domyślne UA Pythona bywają na czarnej liście
  WAF-ów → 403/429. 200 z curla + 429 z Pythona = to UA, nie limit.
- Pauza ~2 s między zapytaniami. Batchuj: `_fields=`, `per_page=`, `include=1,2,3`.
- **429 → przerwij i odczekaj. Nie ponawiaj w pętli.** Blokada bywa na całe IP.
- Rozróżniaj „na pewno nie ma" od „nie udało się sprawdzić" — inaczej powstają duplikaty.
- **Gdy IP jest oflagowane** — REST z zalogowanej karty `wp-admin` w przeglądarce
  (ciasteczko + `X-WP-Nonce` z `/wp-admin/admin-ajax.php?action=rest-nonce`).

### 7. Treść to bloki, nie HTML

| Warstwa | Jak poznać | Zasada |
|---|---|---|
| Bloki Gutenberga | `<!-- wp:paragraph -->` | markery obowiązkowe, inaczej motyw nie ostyluje treści |
| Bloki ACF/motywu | `<!-- wp:acf/nazwa {json} /-->` | treść siedzi w JSON-ie atrybutu |
| Bloki globalne | `<!-- wp:block {"ref":123} -->` | **współdzielone przez wiele stron** |
| Moduły `wp:html` | `<!-- wp:html -->` + własny `<style>` | własne CSS, ToC, czasem JSON-LD |
| Builder (Elementor) | pusty `content`, wszystko w `meta` | edycja wyłącznie przez `_elementor_data` |

- Nagłówki jako `<!-- wp:heading --><h2 class="wp-block-heading" id="h-slug">…</h2><!-- /wp:heading -->`
  (H3: `{"level":3}`), slug deterministycznie, bez polskich znaków.
- **Ustal, skąd bierze się H1** (pole `title` albo pole hero ACF) — w treści ma go wtedy nie być.
- **Escaping bloków ACF:** WP używa `wp_json_encode` z `JSON_HEX_*`, więc w wartościach
  `"` `<` `>` `&` `'` muszą być jako `"` `<` `>` `&` `'`.
  `json.dumps` tego nie robi → parser bailuje i ucina stronę. `wp.py lint` to łapie.
- **Pola powtarzalne ACF:** dopisujesz `..._N_pole` **i** `_..._N_pole` z kluczem `field_…`,
  na końcu podbijasz licznik.
- **Bloków globalnych nie edytuj w miejscu** — sklonuj i przepnij `ref` tylko na stronach docelowych.
- **Moduły `wp:html` mają ToC na sztywno** — liczba `href="#…"` = liczba `id` nagłówków;
  FAQ zmieniaj razem z JSON-LD `FAQPage`.
- **Klon strony przenosi skażenie** (obraz hero, CTA bloku globalnego) — obejrzyj stronę.
- **Edytuj po indeksach bloków top-level, reszta bajt w bajt**, z asercjami przed POST-em.

### 8. Co WordPress robi z Twoim HTML-em

- **`wpautop` tnie pustymi liniami także `<style>`/`<script>`** → wgrywaj taki HTML jako jedną linię.
- **`<main>` nie jest dla `wpautop` blokowy** → `<p></main></p>` rozbija grid. Używaj `div.main`.
- ⚠️ **Goły `&` w inline `<script>`** zmienia się w `&#038;` i zabija skrypt. Pisz JS bez `&&`.
- **`wptexturize`** podmienia znaki typograficzne — licz różnicę długości, zanim uznasz to za typografię.
- Po zapisie **porównaj długość `content.raw` z wysłaną** (`wp.py write` robi to sam).
- Guardraile przed wysyłką: brak nowych linii, jeden `<h1>`, brak `<main>`, brak gołych `&`
  w `<script>`, zbilansowane bloki.
- CSS naprawiający motyw kopiuj razem z `@media`, nie przypinaj do zmiennych kotwic.
- Własne komponenty często potrzebują `!important` i `font-family: inherit`.
- Animacje wejścia: treść domyślnie widoczna, JS dopiero ją ukrywa (+ watchdog).
- Źródłem prawdy jest plik `.src.html` w repo, nigdy treść pobrana z bazy.

### 9. Media i obrazy

- Upload: `python wp.py media plik.jpg "Alt"`. **Nazwa pliku staje się slugiem i URL-em** — nadaj ją świadomie.
- `alt_text` zawsze od razu. Obrazek wyróżniający: `{"featured_media": <id>}`;
  obraz w treści z id w atrybutach bloku (`wp:image {"id":N}`).
- **Media nie mają kosza** — `DELETE ...?force=true` jest nieodwracalne.
- „Nie można utworzyć katalogu uploads" po migracji = zwykle stara opcja `upload_path`.

### 10. Meta wtyczek często nie ma w REST — sprawdź, nie zakładaj

Wysłanie nieistniejącego pola w `meta` **nie daje błędu**. Najpierw `python wp.py schema <rest_base>`.

| Wtyczka | Czego NIE ma w `wp/v2` | Czym to zapisać |
|---|---|---|
| Rank Math | `rank_math_title`, `..._description` | `POST rankmath/v1/updateMeta`; dodatkowo `excerpt` |
| Yoast | `_yoast_wpseo_*` | własny endpoint z `update_post_meta` |
| Yoast na produktach Woo | to samo | `wc/v3/products/{id}` → `meta_data: [{"key":"_yoast_wpseo_metadesc",…}]` |
| AIOSEO | — | `POST aioseo/v1/post` |
| Elementor | nic bez kontekstu | `?context=edit` odblokowuje odczyt **i zapis** `_elementor_data` |
| Forminator / szablony HFE | CRUD | tylko UI |

- Własny endpoint (np. `POST <projekt>/v1/seo-meta`) przez Code Snippets/WPCode — **tylko za zgodą (§16)**.
  W snippecie deklaruj klasę warunkowo (`if (!class_exists(...)) { … }`), `init()` poza guardem.
- Weryfikuj zapis przez `yoast_head_json` albo `<title>`/`<meta name=description>` na froncie.
- **Test uprawnień bez mutowania:** żądanie z ID `999999999` → `404 rest_post_invalid_id` = auth OK.

### 11. Po zapisie: cache i indeksy

- Elementor: `DELETE wp-json/elementor/v1/cache`.
- Autoptimize / LiteSpeed / WP Rocket to osobna warstwa cache.
- Zapis przez REST nie odpala hooków panelu: Yoast indexables, sitemapy Rank Math, full-page cache
  LiteSpeed — **re-save posta** zwykle pomaga. Kolejność: cache wtyczki, potem cache strony.
- `post-<ID>.css` z 404 przy zdrowej stronie to nie test — sprawdzaj wyrenderowany HTML.
- Każdy test frontu z cache-busterem `?nc=<timestamp>`.

### 12. Slug, kasowanie, przekierowania

- **Zmiana `slug` przez REST nie tworzy 301** — przekierowanie to obowiązkowa część operacji.
- Weryfikuj **cel i liczbę skoków**, nie sam kod. >1 skok = łańcuch do spłaszczenia.
- Listing wtyczki Redirection kłamie zaraz po zapisie — weryfikuj realną odpowiedzią serwera.
- **Kosz nie daje 404** (WP zgaduje permalink 301-ką). Kasuj `force=true` z backupem — za zgodą.
- Po zmianie adresu sprawdź menu/stopkę i sitemapę.
- **Nie kasuj cudzych stron ani draftów bez pytania.**

### 13. Weryfikacja: kiedy robota jest skończona

- Po każdej zmianie wyglądu **obejrzyj wyrenderowany front w przeglądarce** (nie edytor WP).
- Każdy typ komponentu osobno: hero, kafelki, tabele, proza, FAQ, CTA.
- Pułapki zrzutów: scroll-reveal, lazy-load, smooth-scroller — nie myl ich z regresją.
- W akordeonach `textContent`, nie `innerText`.
- Jeden `<h1>`, jeden `Article`/`BlogPosting` w JSON-LD, canonical na siebie — `wp.py check`.

### 14. Publikacja nowej treści

1. Utwórz jako **draft** (`wp.py create` wymusza to sam i sprawdza slug).
2. Ustaw **noindex/nofollow** *zanim* opublikujesz.
3. Dopiero `status=publish` → link do akceptacji.
4. Po akceptacji **kopiuj treść do docelowego ID** zamiast przełączać `page_on_front`.
5. Podgląd nie może być w sitemapie i ma mieć `noindex`.
6. Linki zewnętrzne `rel="nofollow"`, wewnętrzne `follow` (chyba że ustalono inaczej).

### 15. Operacje masowe (>5 stron)

1. **Najpierw plan i lista ID** dla użytkownika, potem kod.
2. **`--dry` domyślnie**, pilotaż na jednej stronie.
3. Checkpoint w pliku + wznawialność.
4. Backup per strona.
5. Idempotentność (marker w treści / porównanie stanu).
6. Asercje przerywające całość (`raise SystemExit`).
7. Pauzy, przy 429 przerwanie serii.
8. Wyrywkowa weryfikacja frontu po batchu.

### 16. Czego nie robisz bez wyraźnej zgody użytkownika

- kodu PHP na produkcji (snippety, `functions.php`, edytor plików motywu),
- instalacji, aktywacji i wyłączania wtyczek,
- edycji **bloku globalnego, snippetu, dodatkowego CSS i menu** (CSS dopisuj, nie nadpisuj, z kopią),
- kasowania czegokolwiek z `force=true`,
- zmiany permalinków, strony głównej, struktury menu,
- operacji masowych (>5 stron) bez planu i listy ID,
- otwierania edytora buildera dla dużej strony tylko po to, żeby kliknąć jeden przycisk.

Higiena do sprawdzenia: `WP_DEBUG_LOG=true` na produkcji wystawia `wp-content/debug.log` do sieci.

### 17. Checklista przed każdym zapisem

1. `wp.py me` odpowiada, rola się zgadza.
2. Wiem, w jakim CPT i warstwie pracuję i skąd bierze się H1.
3. Backup w `backups/` z dzisiejszą datą, niepusty, z `content.raw`.
4. `wp.py lint payload.json` czysty.
5. Znam komendę rollbacku i plik backupu istnieje.
6. Po zapisie: długość treści się zgadza, cache odświeżony, `wp.py check` (anonimowo) czysty,
   front obejrzany w przeglądarce.

### Ta instalacja

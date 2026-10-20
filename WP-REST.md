<!-- ===== POCZĄTEK BLOKU ===== -->

## WordPress REST API — zasady pracy na tej stronie

> Blok wspólny dla wszystkich projektów WP, używany razem z klientem `wp.py` (katalog główny repozytorium).
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
- **W tym repozytorium dane dostępu NIE leżą w plikach.** W sesji w chmurze są zmiennymi
  środowiska (`WP_URL`, `WP_USER`, `WP_APP_PASS`) ustawionymi w ustawieniach środowiska.
  `wp.py` czyta je sam. Lokalnie można użyć `.env` (jest w `.gitignore`, nigdy go nie commituj):
  ```
  WP_URL=https://domena.pl
  WP_USER=claude
  WP_APP_PASS=abcd EFGH ijkl MNOP qrst UVWX
  ```
- ⛔ **Nie rób `source .env`.** Hasło aplikacyjne ma spacje → shell tnie je na komendy
  (`command not found: EFGH`), do zmiennej trafia pierwszy segment, a Ty dostajesz
  niewyjaśnione **401** i szukasz błędu w uprawnieniach. `curl -K plik` potyka się tak samo.
  Parsuj plik (robi to `wp.py`) i **usuń spacje** przed Basic auth — WP akceptuje obie formy,
  ale przez Basic auth przechodzi tylko wersja bez spacji.
- To samo hasło aplikacyjne autoryzuje **wszystkie przestrzenie REST**: `wp/v2`, `wc/v3`
  (WooCommerce — nie trzeba consumer key/secret), `rankmath/v1`, `elementor/v1`,
  `redirection/v1`, `code-snippets/v1` i Twoje własne endpointy.
- Hasło nigdy nie trafia do URL-a, do logu, do commita ani do wiadomości dla użytkownika.
- **Pierwsze wywołanie w każdej sesji:** `python3 wp.py me` — potwierdza, na kim pracujesz
  i z jaką rolą, zanim cokolwiek ruszysz.

### 2. Zapisy idą przez `wp.py`

| Komenda | Co robi |
|---|---|
| `python3 wp.py me` | kim jestem, jaka rola, czy API w ogóle odpowiada |
| `python3 wp.py types` | CPT tej instalacji + `rest_base` + taksonomie |
| `python3 wp.py schema blog` | jakie pola i jakie **meta** ten CPT naprawdę przyjmuje |
| `python3 wp.py get "wp/v2/pages/6?context=edit&_fields=title,slug"` | odczyt |
| `python3 wp.py backup pages 6` | pełny `context=edit` do `backups/` |
| `python3 wp.py lint payload.json` | asercje na treści bez wysyłki |
| `python3 wp.py create blog payload.json` | dedup slugu → lint → nowy wpis **jako draft** |
| `python3 wp.py write pages 6 payload.json` | **lint → backup → POST → porównanie długości** |
| `python3 wp.py rollback backups/pages-6-*.json` | przywrócenie stanu sprzed zmiany |
| `python3 wp.py media foto.jpg "Alt tekst"` | upload + `alt_text` + id do `featured_media` |
| `python3 wp.py check https://domena.pl/s/ "MARKER"` | front **anonimowo**: page-id, canonical, H1, CSS, JSON-LD |

Jeśli w wyjątkowej sytuacji strzelasz ręcznie `curl`-em, cztery rzeczy są obowiązkowe tak samo:
przeglądarkowy User-Agent, sprawdzenie kodu HTTP **przed** parsowaniem JSON-a, backup przed
nadpisaniem i weryfikacja na froncie.

### 3. Rozpoznanie instalacji przed pierwszym zapisem

Nie zakładaj domyślnego WordPressa. Pięć minut rekonesansu oszczędza dzień sprzątania:

```bash
python3 wp.py types                  # CPT: nazwa ≠ rest_base; `posts` często NIE jest blogiem
python3 wp.py schema <rest_base>     # pola i meta — czego tu w ogóle nie da się zapisać
python3 wp.py get "wp/v2/taxonomies?context=edit&_fields=slug,rest_base,types"
python3 wp.py get "wp/v2/block-types?_fields=name" | grep acf   # bloki ACF motywu
```

- **`rest_base` bywa inny niż nazwa typu**, a blog bywa osobnym CPT (`blog`, `article`,
  `dictionary`, `service`, `case-study`). Pomyłka „blog to `posts`" kosztowała 25 duplikatów wpisów.
- **Pre-flight dedup przed każdym utworzeniem treści:** `GET wp/v2/<rest_base>?slug=<slug>`
  ze statusami `publish,draft,pending,future,private`. Brak wpisu potwierdź, nie zakładaj.
- **Taksonomie ustawiaj w tym samym payloadzie**, w którym tworzysz wpis (`{"kategoria":[ID]}`).
  „Dopiszemy potem ręcznie" kończy się backfillem na kilkunastu wpisach.
- Sprawdź też, **skąd bierze się menu i stopka**. Bywają generowane przez wtyczkę ze snippetami
  PHP, a nie przez menu WP — wtedy podmiana linków w treści i blokach ich nie ruszy,
  a serwis dalej linkuje przez stare adresy z nagłówka. Flagi typu `active` w API wtyczek
  potrafią kłamać — weryfikuj przez porównanie fragmentu kodu z żywym HTML-em.

### 4. Backup przed każdym nadpisaniem — bez wyjątków

- Robi go `python3 wp.py backup <typ> <id>` (i automatycznie `write`).
- **`?context=edit` jest obowiązkowe.** Bez niego odpowiedź nie zawiera `content.raw`
  ani meta chronionych (`_elementor_data`, pola wtyczek) — backup wygląda na zrobiony, a jest pusty.
- Pliki w `backups/` zostają. Nie kasuj ich „przy sprzątaniu". W sesji w chmurze commituj je
  razem ze zmianą, bo kontener znika.
- Druga siatka bezpieczeństwa: **rewizje WP niosą też `_elementor_data`** —
  `GET wp/v2/pages/{id}/revisions/{rev}?context=edit`. To bywa jedyna droga odzysku po tym,
  jak builder spłaszczy projekt strony.
- Przy stronie zbudowanej w Elementorze: policz węzły przed i po. Ta sama liczba = projekt cały.
  ```bash
  python3 -c "import json,sys;d=json.load(open(sys.argv[1]));ed=d['meta']['_elementor_data']
  n=lambda e:sum(1+n(x.get('elements',[])) for x in e);print(len(ed),'zn.',n(json.loads(ed)),'węzłów')" backup.json
  ```
- Backupuj też to, co **nie jest treścią**: snippety PHP (`code-snippets/v1/snippets`),
  dodatkowy CSS z Customizera, reguły przekierowań. Te rzeczy działają na całym serwisie,
  a nie mają kosza ani rewizji.

### 5. HTTP 200 nie znaczy „udało się"

Pięć fałszywych sukcesów, wszystkie widziane na żywych instalacjach:

1. **Antybot hostingu** oddaje stronę „Potwierdź, że nie jesteś robotem" **ze statusem 200**.
   `json.load()` wywala się wtedy `JSONDecodeError: line 1 column 1` — to **nie jest awaria API**.
2. **`rate limited`** jako goły tekst, też bywa z 200 (albo z 429 i `retry-after`).
3. **Meta wtyczki zapisane w `meta`** — API zwraca 200 i komplet danych, a pole nie zostało zapisane,
   bo nie jest zarejestrowane w REST. Cicho, bez błędu (§10).
4. **Parser bloków bailuje** na pierwszym źle zescapowanym bloku i zapisuje kikut treści —
   status 200, `content` w odpowiedzi krótszy o 90% (§7).
5. **Adres draftu zwraca 200 z cudzą treścią.** WP dopasowuje ścieżkę po slugu i serwuje inny
   wpis o tym slugu (z jego canonicalem). „URL odpowiada 200" **nie jest dowodem publikacji** —
   sprawdzaj `page-id-{ID}` w `<body class>` albo `rel=canonical` równy własnemu adresowi.

⚠️ Te sprawdzenia rób **bez uwierzytelnienia**. Zalogowanemu redaktorowi WordPress wyrenderuje
także draft i stronę prywatną, więc „ja to widzę" nie znaczy „Google to widzi". `wp.py check`
celowo nie wysyła Basic auth — `404` z jego ust to informacja, nie awaria narzędzia.

Zasada, która łapie warianty 1–2 naraz: **nie szukaj konkretnej frazy — sprawdź, czy
odpowiedź w ogóle zaczyna się od `{` albo `[`.** Gdy nie — przerwij robotę, nie debuguj API.

**Weryfikacja zawsze osobnym kanałem: wyrenderowany front z cache-busterem**, nie odpowiedź zapisu.

### 6. Limity, WAF, antybot

- **Najpierw User-Agent, dopiero potem backoff.** Domyślne `python-requests` / `Python-urllib`
  bywają na czarnej liście WAF-ów → 403 albo 429 bez `Retry-After`. Test rozstrzygający w 10 sekund:
  powtórz to samo żądanie `curl`-em. **200 z curla + 429 z Pythona = to UA, nie limit.**
  (Bywa odwrotnie — są hostingi tnące UA `curl/8.x`. Zasada ta sama: zmień UA, zanim zaczniesz czekać.)
- `sleep 2` między zapytaniami. Batchuj: `_fields=`, `per_page=`, `include=1,2,3` —
  jedno wywołanie po trzy strony zamiast trzech osobnych.
- **429 → przerwij i odczekaj. Nie ponawiaj w pętli.** Blokada bywa na całe IP i obejmuje też
  pliki statyczne z `wp-content/uploads/` — „zdjęcie zwraca 429" nie znaczy, że pliku nie ma.
- Kod, który łapie wyjątek i zwraca „nie znaleziono", zamieni blokadę w **cichy fałsz negatywny**
  (skrypt uzna, że wpisu nie ma, i zrobi duplikat). Rozróżniaj „na pewno nie ma"
  od „nie udało się sprawdzić".
- **Gdy IP jest już oflagowane** — REST z zalogowanej karty `wp-admin` (Claude in Chrome).
  Ciasteczko sesji przechodzi tam, gdzie Basic Auth nie:
  ```js
  const nonce = await (await fetch('/wp-admin/admin-ajax.php?action=rest-nonce')).text();
  await fetch('/wp-json/wp/v2/pages/123', {method:'POST', credentials:'same-origin',
    headers:{'Content-Type':'application/json','X-WP-Nonce':nonce},
    body: JSON.stringify({content: nowa})}).then(r=>r.status);
  ```
  Bonus: przy drobnej korekcie podmieniasz jeden string w `content.raw` zamiast przepychać
  cały dokument przez kontekst modelu.

### 7. Treść to bloki, nie HTML

Zanim wyślesz `content`, ustal, **z czego zbudowana jest ta strona**. Prawie nigdy nie jest
to czysty HTML, a każda z warstw ma inne zasady:

| Warstwa | Jak poznać | Zasada |
|---|---|---|
| Bloki Gutenberga | `<!-- wp:paragraph -->` | markery obowiązkowe, inaczej motyw nie ostyluje treści |
| Bloki ACF/motywu | `<!-- wp:acf/nazwa {json} /-->` | treść siedzi w JSON-ie atrybutu, nie w HTML-u |
| Bloki globalne | `<!-- wp:block {"ref":123} -->` | **współdzielone przez dziesiątki stron** |
| Moduły `wp:html` | `<!-- wp:html -->` + własny `<style>` | własne CSS, ToC, czasem JSON-LD |
| Builder (Elementor) | pusty `content`, wszystko w `meta` | edycja wyłącznie przez `_elementor_data` |

- **Surowy `<p>`/`<h2>` w `content` renderuje się bez stylów motywu.** Zwykle brakuje wtedy
  również spisu treści, bo motyw buduje go z `id="h-…"` nagłówków. Nagłówki wysyłaj jako
  `<!-- wp:heading --><h2 class="wp-block-heading" id="h-slug">…</h2><!-- /wp:heading -->`
  (dla H3 atrybut `{"level":3}`), a slug licz deterministycznie ze stripowaniem polskich znaków.
- **Ustal, skąd bierze się H1.** W CPT blogowych H1 generuje pole `title`, więc H1 trzeba
  z treści **wyciąć**. W szablonach ACF H1 bywa polem hero (`header_heading.type`) —
  wtedy ustaw je na `h1`, bo inaczej pierwszy H1 strony przyjedzie z bloku globalnego w połowie strony.
- **Escaping bloków ACF nie jest zwykłym JSON-em.** WP zapisuje je przez `wp_json_encode`
  z `JSON_HEX_QUOT|JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS`, więc w wartościach `"`, `<`, `>`,
  `&`, `'` muszą być jako `"`, `<`, `>`, `&`, `'`. `json.dumps`
  produkuje je dosłownie → parser bloków **bailuje i wycina resztę strony** (21 982 → 1 796 zn.,
  odpowiedź 200). `wp.py lint` to łapie; po zapisie i tak porównaj długości.
- **Pola powtarzalne ACF mają bliźniacze klucze `_field_key`.** Dodając pozycję listy dopisujesz
  `..._N_pole` **i** `_..._N_pole` z tym samym `field_…`, a na końcu podbijasz licznik.
  Bez licznika lub bez klucza pozycja nie istnieje dla motywu.
- **Bloków globalnych nie edytuj w miejscu.** Zmiana `ref` dotyka wszystkich stron, które go
  używają. Wzorzec naprawy: sklonuj blok do wariantu i przepnij `"ref":STARY` → `"ref":NOWY`
  tylko na stronach docelowych, z asercją „dokładnie jedno trafienie" i backupem per strona.
  Gdzie blok wisi, sprawdzisz tylko grepem po `content.raw` wszystkich CPT — WP nie ma na to API.
- **Blok globalny może nieść własne nagłówki.** Zanim policzysz outline strony, pobierz jego
  treść (`wp/v2/blocks/{id}?context=edit`) — bywa, że jeden „blok z logotypami" wnosi dwa H2.
- **Moduły `wp:html` mają spis treści wpisany na sztywno.** Liczba `href="#…"` musi równać się
  liczbie `id` nagłówków; przemianowanie nagłówka bez ToC daje martwą kotwicę. Taki moduł
  często niesie też własny `FAQPage` JSON-LD — podmiana pytań musi objąć obie części naraz.
- **Nagłówek wyłącznie pod SEO**, którego motyw nie stylizuje, wstawiaj jako
  `<h2 class="sr-only">` w bloku `wp:html` — jest w DOM, nie psuje layoutu.
- **Klon strony przenosi skażenie.** Po sklonowaniu landingu na inną usługę/miasto sprawdź nie
  tylko tekst, ale i **pola, których nie widać w treści**: `image` w hero potrafi zostać
  logotypem poprzedniego kanału, a blok globalny — CTA o poprzedniej usłudze. Grep tego nie złapie,
  łapie to dopiero obejrzenie strony.
- **Edytuj po indeksach bloków top-level, reszta bajt w bajt.** Przed POST-em asercje:
  liczba bloków, lista `ref`-ów, obecność wymaganych fraz znak w znak, `len(toc) == len(nagłówki)`.

### 8. Co WordPress robi z Twoim HTML-em

- **`wpautop` zamienia każdą pustą linię na `</p><p>` — również w środku `<style>` i `<script>`.**
  Arkusz zostaje przecięty w pierwszej pustej linii, reszta CSS ginie. Objaw myli, bo pierwsze
  reguły działają. **Lekarstwo: wgrywaj treść jako jedną linię, bez znaków nowej linii.**
- **`<main>` nie jest dla `wpautop` tagiem blokowym** (ani `picture`, `dialog`, `template`, `search`).
  WP wstawia `<p></main></p>`, ten duch zabiera kolumnę grida i sidebar spada pod treść.
  Używaj `div.main{min-width:0}`.
- ⚠️ **Goły `&` w inline `<script>` zabija cały skrypt.** Filtr `the_content` zamienia go na
  `&#038;`, JS pada z `SyntaxError` i blok jest martwy — objawia się jako „elementy są, nic nie
  reaguje", przy czym lokalny podgląd działa. Pisz JS **bez `&&`** (zagnieżdżone `if`,
  `(obj||{}).prop`) i bez gołych `&`; trzymaj asercję w buildzie.
- **`wptexturize` podmienia znaki typograficzne** (`8x10` → `8×10`, cudzysłowy, myślniki).
  Różnica długości z tego powodu to nie błąd zapisu — ale policz ją, zanim uznasz to za typografię.
- Po zapisie **porównaj długość `content.raw` z lokalnym buildem** — zgadza się co do znaku
  albo coś po drodze zmodyfikowało treść (`wpautop`, `kses`, parser bloków). `wp.py write` robi to sam.
- **Guardraile w skrypcie budującym**, przed wysyłką — asercje kosztują nic, a łapią całą klasę
  błędów: brak nowych linii, dokładnie jeden `<h1>`, brak `<main>`, parzysta liczba cudzysłowów
  w CSS, brak gołych `&` w `<script>`, zbilansowane markery bloków, brak fraz zakazanych przez klienta.
- **CSS naprawiający motyw kopiuj razem z jego `@media`** i nie przypinaj go do kotwicy sekcji,
  której nazwa może się zmienić. Fork generatora, który przemianował kotwicę, cofnął naprawę
  grida — a wszystkie bramki strukturalne przeszły, bo markup był poprawny.
- Style motywu bywają globalne i agresywne (np. `table td{background:#fff}`, reset fontów) —
  własne komponenty potrzebują `!important` na tle, kolorze, ramce i `font-family: inherit`.
- **Animacja wejścia domyślnie pokazuje treść**, a JS ją dopiero ukrywa (`.js` na `<html>`)
  + watchdog na `setTimeout`. Odwrotna kolejność (`opacity:0` czekające na IntersectionObserver)
  zostawia puste sekcje, gdy JS padnie albo karta jest w tle.
- Źródłem prawdy jest plik `.src.html` w repo, nigdy treść pobrana z bazy.

### 9. Media i obrazy

- Upload: `POST wp/v2/media` jako `multipart/form-data` (`python3 wp.py media plik.jpg "Alt"`).
  **Nazwa pliku staje się slugiem załącznika i adresem URL** — nadaj ją świadomie przed wysyłką,
  po fakcie nie zmienisz jej przez REST.
- `alt_text`, `title` i `caption` ustawiasz **drugim zapytaniem** na `wp/v2/media/{id}`.
  Upload bez alta to strona z obrazkiem bez alta — nie zostawiaj tego „na potem".
- Obrazek wyróżniający to osobne pole wpisu: `{"featured_media": <id>}`.
  Obraz w treści musi mieć id **w atrybutach bloku** (`wp:image {"id":N}`), nie tylko w `<img src>`.
- **Media nie mają kosza** — `DELETE wp/v2/media/{id}?force=true` jest nieodwracalne.
- „Nie można utworzyć katalogu `uploads/RRRR/MM`" to zwykle **nie uprawnienia**, tylko opcja
  `upload_path` wskazująca na ścieżkę starego konta po migracji hostingu. Fix:
  wyczyścić pole w `options-media.php` (zniknięcie sekcji = potwierdzenie).
- Gdy Basic Auth zbiera 429 przy uploadzie, ta sama wysyłka przechodzi z zalogowanej karty
  `wp-admin` przez `X-WP-Nonce` (§6).

### 10. Meta wtyczek często nie ma w REST — sprawdź, nie zakładaj

Wysłanie nieistniejącego pola w `meta` **nie daje błędu**. Sprawdź schemat
(`python3 wp.py schema <rest_base>`), zanim uznasz zapis za udany.

Znane ścieżki obejścia:

| Wtyczka | Czego NIE ma w `wp/v2` | Czym to zapisać |
|---|---|---|
| Rank Math | `rank_math_title`, `..._description`, meta termów | `POST rankmath/v1/updateMeta` (Basic Auth wystarcza); dodatkowo wypełniaj `excerpt` |
| Yoast | `_yoast_wpseo_*` (także po `register_post_meta`) | własny endpoint z `update_post_meta` |
| Yoast na produktach Woo | to samo | `wc/v3/products/{id}` → `meta_data: [{"key":"_yoast_wpseo_metadesc",…}]` |
| AIOSEO | — | `POST aioseo/v1/post` z `{"id":N,"noindex":true,"nofollow":true,"default":false}` |
| Elementor | nic bez kontekstu | `?context=edit` odblokowuje odczyt **i zapis** `_elementor_data` |
| Forminator / szablony HFE | CRUD formularzy i `elementor-hf` | tylko UI |

**Wzorzec własnego endpointu** (jedyne, co realnie działa na chronione meta): mały plik PHP
rejestrujący `POST <projekt>/v1/seo-meta` z `{id,title,metadesc}`, robiący `update_post_meta`,
`permission_callback => current_user_can('edit_posts')`. Jeden endpoint ogólny na wszystkie CPT
jest lepszy niż kilka wyspecjalizowanych — endpoint zbudowany pod jeden typ odrzuci resztę.
Tylko za zgodą (§16).

- **Gdy nie masz dostępu do plików serwera**, ten PHP wgrywa się przez wtyczkę ze snippetami
  (Code Snippets / WPCode): wklej ciało bez nagłówka plugina, „Run everywhere", Activate.
  Pułapka: snippet z klasą i guardem `if (class_exists(...)) return;` **nigdy nie wykona `init()`**,
  bo PHP hoistuje deklarację klasy w `eval()`. Deklaruj klasę warunkowo
  (`if (!class_exists(...)) { final class … }`), wywołanie `init()` zostaw poza guardem.
- **Weryfikacja zapisu nie przez `meta`** (pole chronione zostaje puste w REST), tylko przez
  `yoast_head_json` w `?context=edit` albo przez `<title>`/`<meta name=description>` na froncie.
- **Test uprawnień bez mutowania danych:** wyślij żądanie z nieistniejącym ID (`999999999`).
  `404 rest_post_invalid_id` = auth i rola przeszły, padła dopiero walidacja zasobu.
  `401`/`403` = problem z dostępem.

### 11. Po zapisie: cache i indeksy

- Builder trzyma własne CSS. Elementor: `DELETE wp-json/elementor/v1/cache`
  (autoryzuje się hasłem aplikacyjnym, bez nonce'a).
- **Wtyczka optymalizacyjna to osobna warstwa.** Autoptimize / LiteSpeed / WP Rocket agregują
  arkusze do własnych plików; Autoptimize nie ma REST-a → czyszczenie z `wp-admin`.
- **Zapis „z boku" nie odpala hooków panelu** — a to one czyszczą cache i przebudowują indeksy:
  - **Yoast Premium serwuje z tabeli `wp_yoast_indexable`.** Po `update_post_meta` tytuł na froncie
    zostaje stary, dopóki nie odpali `save_post`. Lekarstwo: **re-save posta** dowolnym POST-em
    na `wp/v2/<cpt>/{id}` (np. `{"excerpt": …}`) — przy okazji purguje LiteSpeed.
  - **Rank Math trzyma sitemapy w `rank_math_sitemap_cache`.** `noindex` ustawiony skryptem
    nie wypadnie z sitemapy, dopóki nie zawołasz `\RankMath\Sitemap\Cache::invalidate_storage()`.
    **Kolejność: najpierw cache wtyczki, potem cache strony.**
  - **LiteSpeed serwuje full-page cache ZANIM odpali PHP**, więc świeży redirect „nie działa"
    (`hits: 0`). Purge przez REST zwykle nie istnieje; zadziała dotknięcie posta zapisem,
    które unieważnia tag `Po.<id>`.
- Skutek uboczny agregacji: `post-<ID>.css` potrafi zwracać **404 przy zdrowej stronie**.
  Nie używaj obecności tego pliku jako testu — sprawdzaj wyrenderowany HTML.
- Zmiany w PHP mogą nie wchodzić przez OPcache (`validate_timestamps=0`).
- Każdy test frontu z cache-busterem: `?nc=$(date +%s)`.

### 12. Slug, kasowanie, przekierowania

- **Zmiana `slug` przez REST nie tworzy 301.** Stary adres zwraca 404 i cała historia w Google ginie.
  Przekierowanie to **osobny, obowiązkowy krok tej samej operacji**.
- Weryfikuj **cel, nie kod**: `curl -s -o /dev/null -L -A "Mozilla/5.0" -w "skoki=%{num_redirects} %{http_code} %{url_effective}\n" URL`.
  Liczba skoków > 1 to łańcuch do spłaszczenia.
- **Listing wtyczki Redirection kłamie zaraz po zapisie** — `total` i `max(id)` bez nowych reguł,
  przy edycji pokazuje stary cel. Reguły działają. Weryfikuj filtrem `filterBy[url]`
  albo realną odpowiedzią serwera; audyt łańcuchów rób na własnej liście źródeł, nie na listingu.
- **Kosz nie daje 404.** Core'owe `redirect_guess_404_permalink()` robi 301 na najbliższy pasujący
  slug — przy sprzątaniu duplikatów przelewa sygnał na kolejny duplikat. Kasuj `?force=true`,
  z backupem zrobionym **przed** (po `force=true` nie ma czego odtwarzać).
- Po każdej zmianie adresu sprawdź **serwowany HTML dowolnej strony**, czy menu i stopka nie
  linkują dalej po staremu (§3) — i czy nowy URL jest w sitemapie (§11).
- **Nie kasuj cudzych stron ani draftów bez pytania.** Nawet testowych śmieci.

### 13. Weryfikacja: kiedy robota jest skończona

Walidacja strukturalna przechodzi także wtedy, gdy strona wygląda źle. Dlatego po każdej
zmianie wyglądu **obejrzyj wyrenderowany front w przeglądarce**, zanim zgłosisz gotowe.

- Oceniaj **front, nigdy edytor WP**: każdy blok `wp:html` jest w edytorze izolowany i nie widzi
  `<style>` z innego bloku — „sekcja bez stylów" w edytorze to fałszywy alarm.
- Obejrzyj **każdy typ komponentu osobno**: hero, kafelki, każdą tabelę, prozę, FAQ, CTA.
  Sprawdź też, czy tekst mieści się w kartach motywu — limit bywa rzędu 40 słów.
- Pułapki zrzutów ekranu, które dają fałszywe alarmy:
  - motywy z scroll-reveal pokazują puste sekcje przy skokowym scrollu — wyłączaj animacje
    **tylko w treści** (`main *{opacity:1!important;…}`), globalny override odsłania megamenu i cookies;
  - programowy `scrollIntoView` bywa cofany przez smooth-scroller — scrolluj kółkiem;
  - lazy-load daje szary placeholder mimo `naturalWidth > 0`;
  - hero z animacją bywa nieobecne w zrzucie — porównaj z nietkniętą stroną z tej samej rodziny,
    zanim zgłosisz regresję;
  - `resize_window` potrafi nie zmienić `innerWidth` — przy sporze o media queries czytaj CSSOM.
- W akordeonach sprawdzaj `textContent`, nie `innerText` — `innerText` pomija zwiniętą odpowiedź
  i daje fałszywy negatyw co do obecności treści w HTML.
- `view-source` na żywym URL-u: jeden `<h1>`, jeden `Article`/`BlogPosting` w JSON-LD
  (wtyczka SEO często generuje własny — wtedy usuń swój), `FAQPage` tam, gdzie ma być,
  canonical wskazujący na siebie. `wp.py check` wypisuje to jednym wywołaniem.

### 14. Publikacja nowej treści na żywym serwisie

1. Utwórz jako **`status=draft`** (`wp.py create <rest_base> payload.json` wymusza to sam
   i sprawdza po drodze, czy slug nie jest już zajęty).
2. Ustaw **noindex/nofollow** — *zanim* opublikujesz. Odwrotna kolejność wpuszcza podgląd do indeksu.
3. Dopiero `status=publish` → link do akceptacji dla klienta.
4. Po akceptacji **kopiuj treść do docelowego ID**, zamiast przełączać stronę główną
   (`page_on_front`) — zachowujesz adres, historię i linki, a stary projekt zostaje w bazie
   jako rollback. Przy builderze wyłącz tryb edytora (`_elementor_edit_mode: ""`),
   nie kasuj `_elementor_data`.
5. Sprawdź podgląd: nie jest w sitemapie i ma `noindex` — inaczej robisz sobie duplikat.
6. Linki wychodzące na obce domeny dostają `rel="nofollow"`, wewnętrzne zostają `follow`
   (jeśli klient ustalił inaczej — zapisz to w tabeli „Ta instalacja").

### 15. Operacje masowe

Powyżej pięciu stron obowiązuje inny tryb pracy niż przy jednej:

1. **Najpierw plan i lista ID** przedstawione użytkownikowi. Dopiero potem kod.
2. **`--dry` domyślnie**, realny zapis za jawną flagą. Pilotaż na jednej stronie, obejrzenie
   frontu, dopiero potem reszta.
3. **Checkpoint w pliku** (`state_done.json`) + wznawialność. Sieć padnie w połowie 600 wpisów.
4. **Backup per strona**, nie jeden zbiorczy — rollback ma być punktowy.
5. **Idempotentność**: marker w treści albo porównanie stanu przed zapisem. Skrypt puszczony
   drugi raz nie może zdublować sekcji ani doliczyć pozycji do licznika ACF.
6. **Asercje przerywające całość** (`raise SystemExit`), nie ostrzeżenia w logu. Jeśli w treści
   nie ma spodziewanego fragmentu — stop, nie „pomijam i lecę dalej".
7. `sleep` między zapytaniami, a przy 429 przerwanie całej serii (§6).
8. Po batchu **wyrywkowa weryfikacja na froncie** kilku wpisów z różnych końców listy
   i sprawdzenie, czy taksonomie i meta faktycznie siedzą (§10).

### 16. Czego nie robisz bez wyraźnej zgody użytkownika

- kodu PHP na produkcji (snippety, `functions.php`, edytor plików motywu),
- instalacji, aktywacji i wyłączania wtyczek,
- edycji **bloku globalnego, snippetu, dodatkowego CSS i menu** — to zmiany na całym serwisie
  (dodatkowy CSS w Customizerze **dopisuj, nie nadpisuj**, i zrób kopię),
- kasowania czegokolwiek z `force=true`,
- zmiany permalinków, strony głównej, struktury menu,
- operacji masowych (>5 stron) bez wcześniejszego przedstawienia planu i listy ID,
- otwierania w edytorze buildera strony z dużym projektem tylko po to, żeby kliknąć jeden przycisk —
  **każde otwarcie niesie ryzyko spłaszczenia projektu**; jeśli to samo da się zrobić przez REST, zrób przez REST.

Higiena, o którą warto zapytać przy pierwszym kontakcie z instalacją: `WP_DEBUG_LOG=true`
na produkcji zostawia `wp-content/debug.log` **do pobrania z sieci** (rośnie bez limitu
i pcha się do każdego backupu); `WP_DEBUG_DISPLAY=false` przed tym nie chroni.

### 17. Checklista przed każdym zapisem

1. `wp.py me` odpowiada, rola się zgadza.
2. Wiem, w jakim CPT i w jakiej warstwie pracuję (`wp.py types`, §7) i skąd bierze się H1.
3. Backup w `backups/` z dzisiejszą datą, niepusty, z `content.raw`.
4. `wp.py lint payload.json` czysty: jedna linia, jeden H1, brak `<main>`, brak gołego `&`
   w `<script>`, bloki zbilansowane, ACF zescapowane.
5. Znam komendę rollbacku i wiem, że plik backupu istnieje.
6. Po zapisie: długość treści się zgadza, cache i indeks SEO odświeżone, `wp.py check`
   (anonimowo!) czysty, front obejrzany w przeglądarce.

### Ta instalacja

Rozpoznanie 19.10.2026, uzupełnione tego samego dnia po zbudowaniu strony.

| | |
|---|---|
| Domena / API | `https://mateuszprzetocki.pl/wp-json/` · hosting LH.pl · WordPress 7.1.3 |
| Stan | 14 stron opublikowanych w blokach Gutenberga · strona główna = statyczna „Strona główna” (id 40) · tytuł „Mateusz Przetocki”, opis „Strony, które umawiają konsultacje” · strefa Europe/Warsaw · komentarze i pingbacki wyłączone · ikona witryny = media 28 |
| Indeksowanie | do startu 27.10 zaznaczone „Ustawienia → Czytanie → Proś wyszukiwarki o nieindeksowanie” (robi Mateusz w wp-admin; `blog_public` nie jest dostępne przez REST) |
| WP · motyw · builder | motyw **Twenty Twenty-Five 1.5** (blokowy, FSE) · builder: brak (Gutenberg, bloki rdzenia) |
| Wygląd | style globalne użytkownika (`global-styles/9`): paleta marki (plus slugi TT5), rozmiary pisma, układ 680/1120 px, przyciski · dodatkowy CSS = `strona/wordpress/style/marka.css` w `styles.css` · fonty Inter, Inter Tight i Instrument Serif w Bibliotece fontów (pliki na serwerze, bez Google Fonts) |
| Wtyczki | **MP Rezerwacje 0.1.0** (własna, aktywna od 20.10): blok `mp/rezerwacja`, publiczne REST `mp-rezerwacje/v1` (terminy, rezerwacje) · jej ustawienia (opcja `mp_rezerwacje`) zmienia się tylko w wp-admin, więc ustawienia tej strony są w pliku `strona/wordpress/rezerwacje-ustawienia.json` do wczytania w Rezerwacje → Ustawienia → Narzędzia · szkielet wtyczki jest wspólny dla klientów: ustawień tej strony nie wpisujemy do kodu wtyczki |
| SEO · cache · WAF | brak wtyczek SEO i cache · `<title>` = „Tytuł strony – Mateusz Przetocki” (tytuły SEO z planu wejdą z wtyczką SEO) · opisy SEO z planu są w zajawkach stron (`excerpt`), WordPress sam ich nie wypisuje · WAF: nie zaobserwowano |
| Konto agenta i rola | `agentai` (id 2) · **administrator** (plan: Redaktor; zostawić admina tylko do instalacji wtyczek i ustawień) |
| CPT i ich `rest_base` | tylko rdzeń WP: `posts`, `pages`, `media`, `blocks`, `templates`, `template-parts`, `navigation`, `global-styles`, `font-families` |
| Warstwa treści | Gutenberg + szablony FSE · wszystkie strony mają szablon `page-no-title` · zmienione: `twentytwentyfive//header` i `//footer` (template parts), `//404` (szablon) · menu = `wp_navigation` 54 |
| Skąd bierze się H1 | z treści strony (nagłówek w pierwszej sekcji); `page-no-title` nie dokłada tytułu, więc na każdej stronie jest dokładnie 1 H1 |
| ID kluczowych stron | 40 główna · 41 oferta · 42 realizacje · 43 kontakt · 44 polityka prywatności · 45 regulamin · 46 dla kogo · 47 jak pracuję · 48 pytania · 49 o mnie · 50 demo (rodzic 42) · 51 doradcy kredytowi, 52 biura rachunkowe, 53 psycholodzy i terapeuci (rodzic 46) · 100 umów rozmowę `/rozmowa/` (kalendarz, opublikowana 20.10; prowadzą do niej przyciski „Umów 30 minut”) · media: `strona/wordpress/build/media.json` (zdjęcia Mateusza od 20.10: 101 założone ręce, 102 ręce w kieszeniach, 103 przy komputerze, 104 twarz; pliki są tylko w WordPressie, oryginały na Dysku) |
| Źródło i wysyłka | generator `strona/wordpress/zbuduj.js` → `build/` → `python3 strona/wordpress/wyslij.py [etap]` (walidacja bloków, backup, zapis). **Od 19.10 Mateusz edytuje teksty i grafiki w edytorze.** `wyslij.py` zatrzymuje się przed zapisem, gdy zasób zmieniono w WordPressie po ostatniej wysyłce (odciski w `build/wyslane.json`). Takie zmiany najpierw przenieś do `zbuduj.js`; `--nadpisz` tylko za zgodą Mateusza |
| Dane kontaktowe | e-mail i telefon Mateusz wpisuje sam w edytorze. W repozytorium zostają zaślepki (`kontakt@…`, `#email`), także przy przenoszeniu jego zmian do `zbuduj.js` |
| **Czego NIE da się przez REST** | upload wtyczek z ZIP (tylko wp-admin) · „Proś wyszukiwarki o nieindeksowanie” (`blog_public`) · ustawienia MP Rezerwacje |
| Znane pułapki | `WP_URL` z „www” daje 401 „nikt nie jest zalogowany”: sekret logowania jest na `mateuszprzetocki.pl`, a `www…/wp-json/` odpowiada 200 bez przekierowania; używaj adresu bez „www” · LH.pl wycinał nagłówek `Authorization` — poprawka w `.htaccess` (SetEnvIf / RewriteRule nad `# BEGIN WordPress`) · WP 7: blok `core/html` ma pusty `save()`, kod idzie w `innerContent` · `blockGap` z `clamp()` silnik układu odrzuca, używaj presetów (`var:preset\|spacing\|50`) · slug presetu z cyfrą zmienia się w zmiennej CSS (`h1` → `--wp--preset--font-size--h-1`) · `font-faces` zwraca kroje wszystkich rodzin, filtruj po `parent` · WordPress zapisuje w stylach `var:preset\|…` jako `var(--wp--preset--…)` |
| Dostęp z sesji w chmurze | Network secret środowiska (Basic, prefiks `/wp-json/`) — hasła nie ma w sesji; `WP_URL` domyślnie w `wp.py` |

<!-- ===== KONIEC BLOKU ===== -->

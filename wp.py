#!/usr/bin/env python3
"""Bezpieczny klient WP REST dla Claude Code.

Jedyna sankcjonowana droga do API strony. Sam z siebie:
 - czyta dane dostępu z .env albo ze zmiennych środowiska sesji
   (hasło aplikacyjne ma spacje — `source` je gubi),
 - wysyła przeglądarkowy User-Agent (domyślny UA Pythona bywa blokowany: 403/429),
 - sprawdza kod HTTP ZANIM sparsuje JSON i wykrywa antybota (HTML/tekst ze statusem 200),
 - robi backup do backups/ PRZED każdym zapisem,
 - LINTUJE treść przed wysyłką (wpautop, gołe `&` w <script>, bilans bloków, escaping ACF),
 - po zapisie porównuje długość zapisanej treści z wysłaną (wpautop/kses/parser bloków
   potrafią ją zmienić albo uciąć w ciszy).

Użycie:
 python3 wp.py me
 python3 wp.py types                              # CPT + rest_base + taksonomie
 python3 wp.py schema blog                        # jakie pola i jakie meta przyjmuje CPT
 python3 wp.py get  "wp/v2/pages/6?context=edit&_fields=title,slug,modified"
 python3 wp.py backup pages 6
 python3 wp.py lint payload.json                  # same asercje, bez wysyłki
 python3 wp.py create blog payload.json           # dedup slug -> lint -> nowy DRAFT
 python3 wp.py write pages 6 payload.json [--force]   # lint -> backup -> POST -> weryfikacja
 python3 wp.py rollback backups/pages-6-*.json
 python3 wp.py media zdjecie.jpg "Alt tekst" [docelowa-nazwa.jpg]
 python3 wp.py check https://domena.pl/strona/ "UNIKALNY_MARKER"
"""
import base64, glob, json, os, re, sys, time, urllib.error, urllib.request
from datetime import datetime
from pathlib import Path

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
PAUZA = 2          # s między zapytaniami — antybot/LiteSpeed tną serie
BACKUPS = Path("backups")
TYPY_MIME = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "gif": "image/gif",
             "webp": "image/webp", "svg": "image/svg+xml", "pdf": "application/pdf"}


def env(plik=".env"):
    """Parser .env, a gdy pliku nie ma — zmienne środowiska sesji.
    NIE używaj `source` — hasło aplikacyjne ma spacje."""
    d = {}
    if Path(plik).exists():
        for line in Path(plik).read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                d[k.strip()] = v.strip().strip('"').strip("'")

    def z(*klucze):
        for k in klucze:
            if d.get(k) or os.environ.get(k):
                return d.get(k) or os.environ.get(k)
        return ""

    user = z("WP_USER", "WP_LOGIN")
    pw = z("WP_PASSWORD", "WP_APP_PASSWORD", "WP_APP_PASS").replace(" ", "")
    base = z("WP_URL").rstrip("/").removesuffix("/wp-admin")
    if not base:
        sys.exit("BŁĄD: brak WP_URL w .env ani w zmiennych środowiska")
    if not pw:
        # Sesja w chmurze z „Network secret”: proxy samo dokleja nagłówek Authorization
        # do zapytań na /wp-json/ — hasła nie ma w sesji i tak ma zostać.
        print("(hasło nie jest ustawione: logowanie przez Network secret środowiska)", file=sys.stderr)
    return user, pw, base


USER, PW, BASE = env()
AUTH = base64.b64encode(f"{USER}:{PW}".encode()).decode() if PW else None
API = BASE + "/wp-json/"


def zapytaj(sciezka, payload=None, metoda=None, surowe=False, body=None, ctype=None, anon=False):
    url = sciezka if sciezka.startswith("http") else API + sciezka.lstrip("/")
    domyslna = "POST" if (payload is not None or body is not None) else "GET"
    req = urllib.request.Request(url, method=metoda or domyslna)
    # anon=True: front oglądamy JAK GOOGLE — bez Basic auth. Zalogowanemu redaktorowi
    # WordPress wyrenderuje także draft, więc uwierzytelniony `check` kłamałby o publikacji.
    if not anon and AUTH:
        req.add_header("Authorization", "Basic " + AUTH)
    req.add_header("User-Agent", UA)
    req.add_header("Accept", "text/html,application/json" if anon else "application/json")
    if payload is not None:
        req.add_header("Content-Type", "application/json")
        req.data = json.dumps(payload, ensure_ascii=False).encode()
    elif body is not None:
        req.add_header("Content-Type", ctype or "application/octet-stream")
        req.data = body
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            tresc, kod = r.read().decode("utf-8", "replace"), r.status
    except urllib.error.HTTPError as e:
        tresc, kod = e.read().decode("utf-8", "replace"), e.code
    except urllib.error.URLError as e:
        sys.exit(f"BŁĄD sieci: {e.reason}\n(macOS/urllib: export SSL_CERT_FILE=$(python3 -m certifi); "
                 "sesja w chmurze: czy domena jest w Allowed domains środowiska?)")

    if kod == 429:
        sys.exit("429 rate limited — WAF/antybot. PRZERWIJ, odczekaj kilka minut. "
                 "Nie ponawiaj w pętli. Jeśli curl dostaje 200, to blokada User-Agenta.")
    if kod == 401:
        sys.exit("401 — hasło aplikacyjne złe albo ucięte na spacji. Sprawdź: python3 wp.py me")
    if kod == 403:
        sys.exit(f"403 — brak uprawnień roli albo blokada WAF. Body: {tresc[:200]}")
    # Antybot oddaje HTML/goły tekst ZE STATUSEM 200. Nie szukaj konkretnej frazy —
    # sprawdź, czy odpowiedź w ogóle zaczyna się jak JSON.
    if not surowe and tresc.lstrip()[:1] not in "{[":
        sys.exit(f"ANTYBOT/WAF zamiast JSON-a (HTTP {kod}): {tresc[:120]!r}\n"
                 "PRZERWIJ — to nie jest awaria API. Odczekaj albo przejdź na Claude in Chrome.")
    if surowe:
        return kod, tresc
    dane = json.loads(tresc or "{}")
    if kod >= 400:
        sys.exit(f"HTTP {kod}: {dane.get('code')} — {dane.get('message')}")
    return dane


# ---------------------------------------------------------------- rozpoznanie

def typy():
    """CPT tej instalacji. rest_base bywa INNY niż nazwa typu — nie zgaduj `posts`."""
    for nazwa, t in zapytaj("wp/v2/types?context=edit").items():
        tax = ", ".join(t.get("taxonomies") or []) or "—"
        print(f"{nazwa:16} rest_base={str(t.get('rest_base')):16} taksonomie: {tax}")


def schemat(rest_base):
    """Jakie pola i jakie meta CPT naprawdę przyjmuje. Pole spoza schematu = cichy brak zapisu."""
    d = zapytaj(f"wp/v2/{rest_base}", metoda="OPTIONS")
    props = (d.get("schema") or {}).get("properties", {})
    meta = (props.get("meta") or {}).get("properties", {})
    print("pola:", ", ".join(props) or "—")
    print(f"meta ({len(meta)}):", ", ".join(meta)
          or "BRAK — meta wtyczek (Yoast/Rank Math) zapisz własnym endpointem, nie przez `meta`")


# ---------------------------------------------------------------- lint treści

def lint_tresc(html):
    """Asercje PRZED wysyłką. Każda odpowiada awarii, która już się zdarzyła."""
    p = []
    if "\n" in html and ("<style" in html or "<script" in html):
        p.append("treść ma znaki nowej linii, a niesie <style>/<script> — wpautop potnie je "
                 "na </p><p> i rozbije CSS. Wgrywaj taki HTML jako JEDNĄ linię.")
    h1 = len(re.findall(r"<h1[\s>]", html))
    if h1 > 1:
        p.append(f"{h1} × <h1> — ma być dokładnie jeden na stronie (często pochodzi z `title` "
                 "albo z pola ACF hero, wtedy w treści ma go NIE być).")
    if re.search(r"<main[\s>]", html):
        p.append("<main> nie jest dla wpautop tagiem blokowym — WP wstawi <p></main></p>, "
                 "duch zabierze kolumnę grida. Użyj div.main{min-width:0}.")
    for m in re.finditer(r"<script\b[^>]*>(.*?)</script>", html, re.S):
        if re.search(r"&(?!#?\w+;)", m.group(1)):
            p.append("goły `&` (np. `&&`) w <script> — filtr the_content zamieni go na &#038;, "
                     "JS padnie z SyntaxError i CAŁY blok przestanie działać. Przepisz bez `&`.")
            break
    if html.count("<style") and (html.count('"') % 2):
        p.append("nieparzysta liczba cudzysłowów — sprawdź, czy CSS/JSON nie jest ucięty.")
    otw = len(re.findall(r"<!-- wp:[^>]*?(?<!/)-->", html))
    zam = len(re.findall(r"<!-- /wp:", html))
    if otw != zam:
        p.append(f"bloki Gutenberga niezbilansowane: {otw} otwarć vs {zam} zamknięć — "
                 "parser wyciszy resztę treści (200, a w bazie zostanie kikut).")
    for m in re.finditer(r"<!-- wp:acf/.*?-->", html, re.S):
        if re.search(r"[<>]", m.group(0)[5:-3]):
            p.append("surowe < lub > w atrybutach bloku ACF — WP koduje je jako \\u003c/\\u003e "
                     "(wp_json_encode z JSON_HEX_*). json.dumps tego nie robi, parser bailuje "
                     "i tnie treść. Escapuj `\"`, `<`, `>`, `&`, `'` w wartościach.")
            break
    return p


def lint_plik(plik):
    dane = json.loads(Path(plik).read_text(encoding="utf-8"))
    tresc = dane.get("content") if isinstance(dane, dict) else None
    if not isinstance(tresc, str):
        sys.exit("Payload nie ma pola `content` jako stringa — nie ma czego lintować.")
    problemy = lint_tresc(tresc)
    print(f"lint {plik}: {len(tresc)} zn.")
    for x in problemy:
        print("  ✗", x)
    if not problemy:
        print("  OK — asercje przeszły")
    return problemy


# ---------------------------------------------------------------- zapis

def backup(typ, pid):
    BACKUPS.mkdir(exist_ok=True)
    dane = zapytaj(f"wp/v2/{typ}/{pid}?context=edit")
    if "content" not in dane and "meta" not in dane:
        sys.exit("Backup pusty — brak context=edit? Przerywam, nic nie zapisuję.")
    p = BACKUPS / f"{typ}-{pid}-{datetime.now():%Y%m%d-%H%M%S}.json"
    p.write_text(json.dumps(dane, ensure_ascii=False, indent=1), encoding="utf-8")
    tresc = (dane.get("content") or {}).get("raw", "")
    print(f"backup: {p}  ({len(tresc)} zn. treści, {len(dane.get('meta') or {})} meta)")
    return p, dane


def write(typ, pid, plik, force=False):
    payload = json.loads(Path(plik).read_text(encoding="utf-8"))
    if isinstance(payload.get("content"), str):
        problemy = lint_tresc(payload["content"])
        for x in problemy:
            print("LINT ✗", x)
        if problemy and not force:
            sys.exit("Lint nie przeszedł — popraw treść albo świadomie dodaj --force.")
    backup(typ, pid)
    time.sleep(PAUZA)
    odp = zapytaj(f"wp/v2/{typ}/{pid}?context=edit", payload)
    print(f"zapis OK: {odp.get('link')}  status={odp.get('status')}")
    if "content" in payload:
        wyslano, zapisano = len(payload["content"]), len(odp["content"]["raw"])
        znak = "OK" if wyslano == zapisano else "UWAGA"
        print(f"{znak}: wysłano {wyslano} zn., w bazie {zapisano} zn."
              + ("" if wyslano == zapisano
                 else " — kses/wpautop/parser bloków coś zmienił. Duża różnica = ucięta treść."))
    print("PAMIĘTAJ: sprawdź wyrenderowany front (python3 wp.py check <url> <marker>), "
          "obejrzyj go w przeglądarce, a przy Elementorze wyczyść cache: "
          "DELETE $WP_URL/wp-json/elementor/v1/cache")
    return odp


def create(rest_base, plik):
    """Nowa treść ZAWSZE jako draft — status zmieniasz osobno, po obejrzeniu frontu (§14)."""
    payload = json.loads(Path(plik).read_text(encoding="utf-8"))
    if isinstance(payload.get("content"), str):
        problemy = lint_tresc(payload["content"])
        for x in problemy:
            print("LINT ✗", x)
        if problemy:
            sys.exit("Lint nie przeszedł — popraw treść przed utworzeniem wpisu.")
    slug = payload.get("slug")
    if slug:
        byt = zapytaj(f"wp/v2/{rest_base}?slug={slug}&status=publish,draft,pending,future,private"
                      "&_fields=id,link,status")
        if byt:
            sys.exit(f"STOP: slug {slug!r} już istnieje: "
                     + ", ".join(f"id={x['id']} ({x['status']})" for x in byt)
                     + "\nZaktualizuj istniejący wpis (wp.py write) albo zmień slug.")
    payload["status"] = "draft"
    odp = zapytaj(f"wp/v2/{rest_base}?context=edit", payload)
    print(f"utworzono DRAFT id={odp['id']}  {odp.get('link')}")
    if isinstance(payload.get("content"), str):
        w, z = len(payload["content"]), len(odp["content"]["raw"])
        print(("OK" if w == z else "UWAGA") + f": wysłano {w} zn., w bazie {z} zn.")
    print("Dalej: ustaw noindex, obejrzyj front, dopiero potem status=publish (§14).")
    return odp


def rollback(plik):
    sciezki = sorted(glob.glob(plik))
    if not sciezki:
        sys.exit(f"Nie ma pliku backupu: {plik}")
    dane = json.loads(Path(sciezki[-1]).read_text(encoding="utf-8"))
    typ = {"page": "pages", "post": "posts"}.get(dane.get("type"), dane.get("type", "pages") + "s")
    payload = {"content": dane["content"]["raw"], "title": dane["title"]["raw"],
               "slug": dane["slug"], "status": dane["status"]}
    if dane.get("meta"):
        payload["meta"] = dane["meta"]
    print(f"ROLLBACK {typ}/{dane['id']} z {sciezki[-1]} ({len(payload['content'])} zn.)")
    odp = zapytaj(f"wp/v2/{typ}/{dane['id']}", payload)
    print("przywrócono:", odp.get("link"))


def media(sciezka, alt=None, nazwa=None):
    """Upload pliku. Nazwa pliku staje się slugiem załącznika — nadaj ją świadomie."""
    plik = Path(sciezka)
    nazwa = nazwa or plik.name
    mime = TYPY_MIME.get(plik.suffix.lower().lstrip("."), "application/octet-stream")
    granica = "----wp" + datetime.now().strftime("%H%M%S%f")
    cialo = (f"--{granica}\r\nContent-Disposition: form-data; name=\"file\"; "
             f"filename=\"{nazwa}\"\r\nContent-Type: {mime}\r\n\r\n").encode() \
        + plik.read_bytes() + f"\r\n--{granica}--\r\n".encode()
    odp = zapytaj("wp/v2/media", body=cialo, ctype=f"multipart/form-data; boundary={granica}")
    print(f"media id={odp['id']}  {odp.get('source_url')}")
    if alt:
        time.sleep(PAUZA)
        zapytaj(f"wp/v2/media/{odp['id']}", {"alt_text": alt, "title": alt})
        print(f"alt/title ustawione: {alt!r}")
    print(f"aby wstawić jako obrazek wyróżniający: {{\"featured_media\": {odp['id']}}}")
    return odp


# ---------------------------------------------------------------- weryfikacja

def check(url, marker=None):
    kod, html = zapytaj(f"{url}{'&' if '?' in url else '?'}nc={int(time.time())}",
                        metoda="GET", surowe=True, anon=True)
    print(f"HTTP {kod}  ·  {len(html)} zn.   (anonimowo — tak widzi to Google)")
    if kod == 404:
        sys.exit("404 dla anonima — strona jest draftem/prywatna albo slug jest inny. "
                 "To nie błąd narzędzia: zalogowanemu redaktorowi ten sam URL by się wyrenderował.")
    if html.lstrip()[:1] != "<":
        sys.exit(f"To nie jest HTML — antybot? {html[:120]!r}")
    pid = re.search(r"\bpage-id-(\d+)", html) or re.search(r"\bpostid-(\d+)", html)
    print("page-id:", pid.group(1) if pid else "BRAK — to może być inna strona pod tym slugiem "
          "(draft serwowany jako 200) albo szablon bez body_class")
    kan = re.search(r'rel=["\']canonical["\'][^>]*href=["\']([^"\']+)', html) \
        or re.search(r'href=["\']([^"\']+)["\'][^>]*rel=["\']canonical', html)
    if kan:
        zgodny = kan.group(1).rstrip("/") == url.split("?")[0].rstrip("/")
        print(f"canonical: {kan.group(1)}" + ("  OK" if zgodny else "  ← WSKAZUJE GDZIE INDZIEJ"))
    t = re.search(r"<title[^>]*>(.*?)</title>", html, re.S)
    d = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', html, re.S)
    print("title:", (t.group(1).strip()[:90] if t else "BRAK"))
    print("description:", (d.group(1).strip()[:90] if d else "BRAK"))
    h1 = re.findall(r"<h1[\s>]", html)
    print(f"H1: {len(h1)}" + ("  ← ma być dokładnie 1 (chyba że motyw animuje hero)"
                              if len(h1) != 1 else "  OK"))
    if "<style" in html:
        blok = html[html.find("<style"):html.find("<style") + 3000]
        print("CSS:", "ROZBITY przez wpautop (<p> w <style>)" if "<p>" in blok else "OK")
    if "<p></main>" in html or "<p></div>" in html:
        print("UWAGA: wpautop owinął tag blokowy w <p> — duch rozwali grid")
    for m in re.finditer(r"<script\b(?![^>]*\b(?:src=|type=[\"']application/ld\+json))[^>]*>(.*?)</script>",
                         html, re.S):
        if "&#038;" in m.group(1) or "&amp;&amp;" in m.group(1):
            print("UWAGA: &#038; w inline <script> — ten blok JS jest martwy (SyntaxError). "
                  "Przepisz skrypt bez gołych `&`.")
            break
    typy_ld = re.findall(r'"@type"\s*:\s*"([A-Za-z]+)"', html)
    if typy_ld:
        licz = {x: typy_ld.count(x) for x in sorted(set(typy_ld))}
        dubel = [f"{k}×{v}" for k, v in licz.items() if v > 1 and k in
                 ("Article", "BlogPosting", "FAQPage", "AggregateRating", "Product")]
        print("JSON-LD:", ", ".join(f"{k}×{v}" for k, v in licz.items())
              + ("   ← DUBEL: " + ", ".join(dubel) if dubel else ""))
    if marker:
        print(f"marker {marker!r}:", "jest" if marker in html else "BRAK — treść się nie wgrała")


if __name__ == "__main__":
    a = sys.argv[1:]
    cmd = a[0] if a else "me"
    if cmd == "me":
        u = zapytaj("wp/v2/users/me?context=edit&_fields=id,name,roles")
        print(f"zalogowany: {u['name']} (id {u['id']}) · role: {', '.join(u.get('roles', []))}")
        print(f"API: {API}")
    elif cmd == "types":
        typy()
    elif cmd == "schema":
        schemat(a[1])
    elif cmd == "get":
        txt = json.dumps(zapytaj(a[1]), ensure_ascii=False, indent=1)
        print(txt if not sys.stdout.isatty() else txt[:4000])
    elif cmd == "backup":
        backup(a[1], a[2])
    elif cmd == "lint":
        sys.exit(1 if lint_plik(a[1]) else 0)
    elif cmd == "create":
        create(a[1], a[2])
    elif cmd == "write":
        write(a[1], a[2], a[3], force="--force" in a)
    elif cmd == "rollback":
        rollback(a[1])
    elif cmd == "media":
        media(a[1], a[2] if len(a) > 2 else None, a[3] if len(a) > 3 else None)
    elif cmd == "check":
        check(a[1], a[2] if len(a) > 2 else None)
    else:
        sys.exit(__doc__)

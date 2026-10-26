#!/usr/bin/env python3
"""Wgrywa stronę z build/ na mateuszprzetocki.pl przez REST API (klient wp.py).

Kolejność: grafiki → fonty → style globalne → strony → menu → nagłówek i stopka → 404 → ustawienia → SEO (Rank Math).
Przed każdym nadpisaniem robi kopię do backups/ (w katalogu głównym repozytorium).
Ponowne uruchomienie niczego nie dubluje: istniejące media, fonty i strony są aktualizowane.
Nie nadpisuje stron, stylów, menu, nagłówka, stopki ani ustawień zmienionych w WordPressie
po ostatniej wysyłce (odciski w build/wyslane.json). Wtedy zatrzymuje się przed zapisem.

Użycie (z katalogu głównego repozytorium):
  python3 strona/wordpress/wyslij.py            # wszystko
  python3 strona/wordpress/wyslij.py strony     # tylko jeden etap: media|fonty|style|strony|menu|czesci|ustawienia|seo
  ... --nadpisz                                 # świadomie nadpisuje zmiany zrobione w WordPressie
  python3 strona/wordpress/wyslij.py seo --tylko=glowna,oferta   # SEO tylko dla wybranych stron (pilotaż)
"""
import hashlib
import html
import importlib.util
import json
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

from PIL import Image

TU = Path(__file__).resolve().parent
REPO = TU.parent.parent
BUILD = TU / "build"
BACKUPS = REPO / "backups"
PAUZA = 1.5

spec = importlib.util.spec_from_file_location("wp", REPO / "wp.py")
wp = importlib.util.module_from_spec(spec)
_argv, sys.argv = sys.argv, ["wp.py", "x"]
spec.loader.exec_module(wp)
sys.argv = _argv


def zapytaj(*a, **k):
    time.sleep(PAUZA)
    return wp.zapytaj(*a, **k)


def zapisz(nazwa, dane):
    (BUILD / nazwa).write_text(json.dumps(dane, ensure_ascii=False, indent=1), encoding="utf-8")


def wczytaj(nazwa, zast=None):
    p = BUILD / nazwa
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else zast


def kopia(sciezka, nazwa):
    """Kopia zapasowa dowolnego zasobu REST (context=edit) do backups/, bez wyrenderowanego HTML (wp.bez_renderu)."""
    BACKUPS.mkdir(exist_ok=True)
    dane = zapytaj(sciezka + ("&" if "?" in sciezka else "?") + "context=edit")
    p = BACKUPS / f"{nazwa}-{datetime.now():%Y%m%d-%H%M%S}.json"
    p.write_text(json.dumps(wp.bez_renderu(dane), ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"  kopia: {p.relative_to(REPO)}")
    return dane


def surowe(v):
    return v["raw"] if isinstance(v, dict) and "raw" in v else v


def odcisk(dane, pola):
    """Skrót pól, które nadpisujemy, w postaci z edytora (raw)."""
    tekst = json.dumps({k: surowe(dane.get(k)) for k in pola}, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(tekst.encode()).hexdigest()[:16]


def pilnuj(klucz, obecne, pola):
    """Zatrzymuje wysyłkę, gdy zasób zmieniono w WordPressie po naszej ostatniej wysyłce (np. tekst w edytorze)."""
    zapamietany = wczytaj("wyslane.json", {}).get(klucz)
    if zapamietany and zapamietany != odcisk(obecne, pola) and "--nadpisz" not in sys.argv:
        sys.exit(f"{klucz}: zmieniony w WordPressie po ostatniej wysyłce, więc go nie nadpisuję. "
                 "Przenieś te zmiany do zbuduj.js albo, jeśli mają zniknąć, uruchom ponownie z --nadpisz.")


def zapamietaj(klucz, dane, pola):
    odciski = wczytaj("wyslane.json", {})
    odciski[klucz] = odcisk(dane, pola)
    zapisz("wyslane.json", odciski)


def zbuduj():
    subprocess.run(["node", str(TU / "zbuduj.js")], check=True, cwd=TU)


def sprawdz(pliki):
    subprocess.run(["node", str(TU / "sprawdz.js"), *map(str, pliki)], check=True, cwd=TU)


def multipart(pola, pliki):
    granica = "----mp" + datetime.now().strftime("%H%M%S%f")
    czesci = []
    for k, v in pola.items():
        czesci.append(f'--{granica}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    for pole, (nazwa, mime, dane) in pliki.items():
        czesci.append(f'--{granica}\r\nContent-Disposition: form-data; name="{pole}"; filename="{nazwa}"\r\nContent-Type: {mime}\r\n\r\n'.encode() + dane + b"\r\n")
    return b"".join(czesci) + f"--{granica}--\r\n".encode(), f"multipart/form-data; boundary={granica}"


# ---------------------------------------------------------------- etapy

def media():
    print("Grafiki")
    lista = json.loads((TU / "ilustracje" / "lista.json").read_text(encoding="utf-8"))
    wynik = wczytaj("media.json", {})
    webp = TU / "ilustracje" / "webp"
    webp.mkdir(exist_ok=True)
    for poz in lista:
        nazwa = poz["nazwa"]
        png = TU / poz["plik"]
        if nazwa == "ikona-witryny":
            plik, mime, rozszerzenie = png, "image/png", "png"
        else:
            plik = webp / f"{nazwa}.webp"
            Image.open(png).save(plik, "WEBP", quality=90, method=6)
            mime, rozszerzenie = "image/webp", "webp"
        istnieje = zapytaj(f"wp/v2/media?slug={nazwa}&_fields=id,slug,source_url")
        trafienie = next((m for m in istnieje if m["slug"] == nazwa), None)
        if trafienie:
            wynik[nazwa] = {"id": trafienie["id"], "url": trafienie["source_url"]}
            print(f"  = {nazwa} (id {trafienie['id']}, już jest)")
            continue
        body, ctype = multipart({}, {"file": (f"{nazwa}.{rozszerzenie}", mime, plik.read_bytes())})
        odp = zapytaj("wp/v2/media", body=body, ctype=ctype)
        zapytaj(f"wp/v2/media/{odp['id']}", {"alt_text": poz["alt"], "title": poz["alt"], "slug": nazwa})
        wynik[nazwa] = {"id": odp["id"], "url": odp["source_url"]}
        print(f"  + {nazwa} (id {odp['id']}, {plik.stat().st_size // 1024} KB)")
    zapisz("media.json", wynik)


FONTY = {
    "inter": ("Inter", "Inter, system-ui, sans-serif", [("400", "normal", "Inter-400.woff2"), ("500", "normal", "Inter-500.woff2"), ("600", "normal", "Inter-600.woff2")]),
    "inter-tight": ("Inter Tight", '"Inter Tight", Inter, system-ui, sans-serif', [("600", "normal", "InterTight-600.woff2"), ("700", "normal", "InterTight-700.woff2")]),
    "instrument-serif": ("Instrument Serif", '"Instrument Serif", Georgia, serif', [("400", "normal", "InstrumentSerif-Regular.woff2"), ("400", "italic", "InstrumentSerif-Italic.woff2")]),
}


def fonty():
    print("Fonty (Biblioteka fontów WordPressa, pliki na własnym serwerze)")
    katalog = REPO / "strona" / "system-marki" / "project" / "fonts"
    istniejace = {f["font_family_settings"]["slug"]: f for f in zapytaj("wp/v2/font-families?per_page=100&_fields=id,font_family_settings")}
    wynik = {}
    for slug, (nazwa, stos, twarze) in FONTY.items():
        if slug in istniejace:
            fid = istniejace[slug]["id"]
            print(f"  = {nazwa} (id {fid})")
        else:
            odp = zapytaj("wp/v2/font-families", {"font_family_settings": json.dumps({"name": nazwa, "slug": slug, "fontFamily": stos}, ensure_ascii=False)})
            fid = odp["id"]
            print(f"  + {nazwa} (id {fid})")
        # API potrafi zwrócić kroje wszystkich rodzin, więc filtrujemy po rodzicu
        obecne = [x for x in zapytaj(f"wp/v2/font-families/{fid}/font-faces?per_page=100&_fields=id,parent,font_face_settings") if x.get("parent") == fid]
        wynik[slug] = []
        for waga, styl, plik in twarze:
            juz = next((x for x in obecne if str(x["font_face_settings"].get("fontWeight")) == waga and x["font_face_settings"].get("fontStyle") == styl), None)
            if juz:
                src = juz["font_face_settings"]["src"]
            else:
                ustawienia = {"fontFamily": nazwa, "fontStyle": styl, "fontWeight": waga, "src": "plik-0"}
                body, ctype = multipart({"font_face_settings": json.dumps(ustawienia)}, {"plik-0": (plik, "font/woff2", (katalog / plik).read_bytes())})
                odp = zapytaj(f"wp/v2/font-families/{fid}/font-faces", body=body, ctype=ctype)
                src = odp["font_face_settings"]["src"]
                print(f"    + {nazwa} {waga} {styl}")
            wynik[slug].append({"fontWeight": waga, "fontStyle": styl, "src": src if isinstance(src, list) else [src]})
    zapisz("fonty.json", wynik)


def style():
    print("Style globalne (paleta, pismo, przyciski, dodatkowy CSS)")
    zbuduj()
    motyw = zapytaj("wp/v2/themes?status=active&_fields=stylesheet,_links")[0]
    gid = motyw["_links"]["wp:user-global-styles"][0]["href"].rstrip("/").split("/")[-1]
    pilnuj(f"global-styles-{gid}", kopia(f"wp/v2/global-styles/{gid}", f"global-styles-{gid}"), ["settings", "styles"])
    dane = json.loads((BUILD / "style-globalne.json").read_text(encoding="utf-8"))
    odp = zapytaj(f"wp/v2/global-styles/{gid}?context=edit", {"settings": dane["settings"], "styles": dane["styles"]})
    zapamietaj(f"global-styles-{gid}", odp, ["settings", "styles"])
    print(f"  zapisano style globalne (id {odp.get('id')}), CSS: {len(dane['styles']['css'])} zn.")


# nowe strony na końcu, żeby nie przesuwać menu_order (i nie nadpisywać) pozostałych
KOLEJNOSC = ["glowna", "oferta", "realizacje", "demo", "kontakt", "polityka", "regulamin", "dlaKogo", "doradcy", "biura", "terapeuci", "jakPracuje", "pytania", "oMnie", "rozmowa", "cookies", "wycena", "materialy", "ustawieniaKalendarza", "uwagiDoSzkicu", "odbiorStrony", "po30Dniach"]
POLA_STRONY = ["title", "slug", "status", "content", "excerpt", "template", "comment_status", "ping_status", "menu_order", "parent"]


def strony():
    print("Strony")
    zbuduj()
    meta = json.loads((BUILD / "strony.json").read_text(encoding="utf-8"))
    sprawdz([BUILD / "strony" / f"{k}.html" for k in KOLEJNOSC])
    ids = wczytaj("id-stron.json", {})
    # najpierw sprawdzamy wszystkie strony, żeby nie przerwać w połowie zapisu
    obecne = {}
    if ids:
        obecne = {s["id"]: s for s in zapytaj(f"wp/v2/pages?include={','.join(map(str, ids.values()))}&status=publish,draft,pending,future,private"
                                             f"&per_page=100&context=edit&_fields=id,{','.join(POLA_STRONY)}")}
        for pid, s in obecne.items():
            pilnuj(f"pages-{pid}", s, POLA_STRONY)
    # rodzice przed dziećmi
    for klucz in sorted(KOLEJNOSC, key=lambda k: 1 if meta[k]["rodzic"] else 0):
        m = meta[klucz]
        tresc = (BUILD / "strony" / f"{klucz}.html").read_text(encoding="utf-8")
        problemy = wp.lint_tresc(tresc)
        if problemy:
            sys.exit(f"Lint {klucz}: {problemy}")
        payload = {
            "title": m["tytul"], "slug": m["slug"], "status": m.get("status") or "publish", "content": tresc, "excerpt": m["opis"],
            "template": "page-no-title", "comment_status": "closed", "ping_status": "closed",
            "menu_order": KOLEJNOSC.index(klucz), "parent": ids.get(m["rodzic"], 0) if m["rodzic"] else 0,
        }
        pid = ids.get(klucz)
        if not pid:
            byt = zapytaj(f"wp/v2/pages?slug={m['slug']}&status=publish,draft,pending,future,private&_fields=id")
            pid = byt[0]["id"] if byt else None
        if pid in obecne and odcisk(obecne[pid], POLA_STRONY) == odcisk(payload, POLA_STRONY):
            print(f"  = {m['tytul']} (id {pid}) bez zmian")
            continue
        if pid:
            kopia(f"wp/v2/pages/{pid}", f"pages-{pid}")
            odp = zapytaj(f"wp/v2/pages/{pid}?context=edit", payload)
            znak = "~"
        else:
            odp = zapytaj("wp/v2/pages?context=edit", payload)
            znak = "+"
        ids[klucz] = odp["id"]
        zapamietaj(f"pages-{odp['id']}", odp, POLA_STRONY)
        zapisano = len(odp["content"]["raw"])
        print(f"  {znak} {m['tytul']} (id {odp['id']}) {odp['link']}  treść {len(tresc)} → {zapisano} zn." + ("" if zapisano == len(tresc) else "  ← UWAGA: różnica"))
        zapisz("id-stron.json", ids)


def menu():
    print("Menu główne")
    zbuduj()
    tresc = (BUILD / "czesci" / "nawigacja.html").read_text(encoding="utf-8")
    nav = wczytaj("nawigacja.json", {})
    if nav.get("id"):
        pilnuj(f"navigation-{nav['id']}", kopia(f"wp/v2/navigation/{nav['id']}", f"navigation-{nav['id']}"), ["content", "status"])
        odp = zapytaj(f"wp/v2/navigation/{nav['id']}?context=edit", {"content": tresc, "status": "publish"})
    else:
        odp = zapytaj("wp/v2/navigation?context=edit", {"title": "Menu główne", "content": tresc, "status": "publish"})
    zapamietaj(f"navigation-{odp['id']}", odp, ["content", "status"])
    zapisz("nawigacja.json", {"id": odp["id"]})
    print(f"  menu (id {odp['id']})")


def czesci():
    print("Nagłówek, stopka i strona 404")
    zbuduj()
    sprawdz([BUILD / "czesci" / f for f in ("naglowek.html", "stopka.html", "szablon-404.html")])
    czesci_ = [
        ("template-parts", "twentytwentyfive//header", "naglowek.html"),
        ("template-parts", "twentytwentyfive//footer", "stopka.html"),
        ("templates", "twentytwentyfive//404", "szablon-404.html"),
    ]
    # najpierw kopie i sprawdzenie wszystkich trzech, potem zapis
    for typ, ident, plik in czesci_:
        pilnuj(f"{typ}-{ident}", kopia(f"wp/v2/{typ}/{ident}", f"{typ}-{ident.replace('//', '-')}"), ["content"])
    for typ, ident, plik in czesci_:
        tresc = (BUILD / "czesci" / plik).read_text(encoding="utf-8")
        odp = zapytaj(f"wp/v2/{typ}/{ident}?context=edit", {"content": tresc})
        zapamietaj(f"{typ}-{ident}", odp, ["content"])
        print(f"  {ident}: {odp.get('source')} ({len(tresc)} zn.)")


def ustawienia():
    print("Ustawienia: strona główna i ikona witryny")
    ids = wczytaj("id-stron.json", {})
    media_ = wczytaj("media.json", {})
    pola = {"show_on_front": "page", "page_on_front": ids["glowna"], "site_icon": media_["ikona-witryny"]["id"]}
    # kopia tylko tych pól: pełne ustawienia zawierają e-mail administratora, a on nie trafia do repozytorium
    pilnuj("settings", kopia(f"wp/v2/settings?_fields={','.join(pola)}", "settings"), list(pola))
    odp = zapytaj("wp/v2/settings", pola)
    zapamietaj("settings", odp, list(pola))
    print(f"  show_on_front={odp['show_on_front']} page_on_front={odp['page_on_front']} site_icon={odp['site_icon']}")


# Rank Math: ustawienia, które zmieniamy (reszta zostaje domyślna albo taka, jak ustawi Mateusz w panelu)
SEO_TYTULY = {"title_separator": "|", "404_title": "Tej strony tu nie ma %sep% %sitename%", "disable_author_archives": "on",
              "knowledgegraph_type": "person", "knowledgegraph_name": "Mateusz Przetocki", "website_name": "Mateusz Przetocki",
              # strony to usługi, nie artykuły; „Article” dokładał też autora strony (konto agenta) do danych dla Google
              "pt_page_default_rich_snippet": "off"}
SEO_MAPA = {"authors_sitemap": "off"}
# okruszki tylko w danych dla Google (BreadcrumbList); widoczne okruszki są w treści stron, Rank Math ich nie wstawia
SEO_OGOLNE = {"breadcrumbs": "on", "breadcrumbs_home_label": "Strona główna"}
POLA_SEO = ["title", "description", "robots"]
STRONA = wp.API.split("/wp-json/")[0]


def seo_na_froncie(url):
    """Tytuł, opis i roboty z wyrenderowanej strony, bez logowania (tak widzi to Google)."""
    kod, tresc = zapytaj(f"{STRONA}{url}?nc={int(time.time())}", metoda="GET", surowe=True, anon=True)
    if kod != 200 or tresc.lstrip()[:1] != "<":
        sys.exit(f"{url}: HTTP {kod}, to nie jest strona. Przerywam.")

    def znajdz(wzor):
        m = re.search(wzor, tresc, re.S)
        return html.unescape(m.group(1)).strip() if m else ""
    return {"title": znajdz(r"<title[^>]*>(.*?)</title>"),
            "description": znajdz(r"<meta\s+name=[\"']description[\"']\s+content=[\"']([^\"']*)"),
            "robots": znajdz(r"<meta\s+name=[\"']robots[\"']\s+content=[\"']([^\"']*)")}


def ustawienia_seo(typ, zmiany):
    """Ustawienia Rank Math: kopia obecnych (pusty zapis zwraca komplet), pilnowanie zmian z panelu, zapis tylko naszych pól."""
    # przełączniki wysyłamy jako „on”/„off”, a Rank Math odsyła je jako true/false
    norm = lambda v: {"on": True, "off": False}.get(v, v) if isinstance(v, str) else v
    # „updated” musi być listą: Rank Math robi na nim in_array(), a null w PHP 8 kończy się błędem krytycznym (500)
    obecne = zapytaj("rankmath/v1/updateSettings", {"type": typ, "settings": {}, "updated": []})["settings"]
    BACKUPS.mkdir(exist_ok=True)
    p = BACKUPS / f"rankmath-{typ}-{datetime.now():%Y%m%d-%H%M%S}.json"
    p.write_text(json.dumps(obecne, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"  kopia: {p.relative_to(REPO)}")
    chciane = {k: norm(v) for k, v in zmiany.items()}
    teraz = {k: norm(obecne.get(k)) for k in zmiany}
    pilnuj(f"rankmath-{typ}", teraz, list(zmiany))
    if teraz == chciane:
        zapamietaj(f"rankmath-{typ}", teraz, list(zmiany))
        print(f"  = ustawienia {typ} bez zmian")
        return
    odp = zapytaj("rankmath/v1/updateSettings", {"type": typ, "settings": zmiany, "updated": list(zmiany)})["settings"]
    po = {k: norm(odp.get(k)) for k in zmiany}
    if po != chciane:
        sys.exit(f"Rank Math nie zapisał ustawień {typ}: {[k for k in zmiany if po[k] != chciane[k]]}")
    zapamietaj(f"rankmath-{typ}", po, list(zmiany))
    print(f"  ~ ustawienia {typ}: {', '.join(zmiany)}")


def seo():
    print("SEO: Rank Math (tytuły, opisy, noindex formularzy, ustawienia)")
    zbuduj()
    if "rankmath/v1" not in zapytaj("?_fields=namespaces").get("namespaces", []):
        sys.exit("Rank Math nie działa (brak rankmath/v1): wtyczka wyłączona albo w wp-admin nie pominięto rejestracji konta.")
    meta = json.loads((BUILD / "strony.json").read_text(encoding="utf-8"))
    ids = wczytaj("id-stron.json", {})
    ustawienia_seo("titles", SEO_TYTULY)
    ustawienia_seo("sitemap", SEO_MAPA)
    ustawienia_seo("general", SEO_OGOLNE)
    # najpierw sprawdzamy wszystkie strony, żeby nie przerwać w połowie zapisu
    strony_ = [(k, meta[k], ids[k]) for k in KOLEJNOSC if (meta[k].get("status") or "publish") == "publish"]
    tylko = [a.split("=", 1)[1] for a in sys.argv if a.startswith("--tylko=")]  # pilotaż: --tylko=glowna
    if tylko:
        strony_ = [x for x in strony_ if x[0] in tylko[0].split(",")]
    teraz = {}
    for klucz, m, pid in strony_:
        teraz[pid] = seo_na_froncie(m["url"])
        pilnuj(f"seo-{pid}", teraz[pid], POLA_SEO)
    zmienione = 0
    for klucz, m, pid in strony_:
        ukryta = bool(m.get("ukryta"))
        if teraz[pid]["title"] == m["seo"] and teraz[pid]["description"] == m["opis"] and ("noindex" in teraz[pid]["robots"]) == ukryta:
            print(f"  = {m['seo']} (id {pid}) bez zmian")
            continue
        zapytaj("rankmath/v1/updateMeta", {"objectType": "post", "objectID": pid, "meta": {
            "rank_math_title": m["seo"], "rank_math_description": m["opis"],
            "rank_math_robots": ["noindex", "nofollow"] if ukryta else ["index", "follow"]}})
        po = seo_na_froncie(m["url"])
        if po["title"] != m["seo"] or po["description"] != m["opis"] or ("noindex" in po["robots"]) != ukryta:
            sys.exit(f"{m['url']}: na stronie jest inaczej niż wysłane: {po}")
        zapamietaj(f"seo-{pid}", po, POLA_SEO)
        zmienione += 1
        print(f"  ~ {po['title']} (id {pid}) · opis {len(po['description'])} zn. · {po['robots'].split(',')[0]}{', ' + po['robots'].split(',')[1].strip() if ',' in po['robots'] else ''}")
    if zmienione:
        # meta zapisane z boku nie czyszczą pamięci mapy strony Rank Math; czyści ją zapis strony (save_post)
        glowna = ids["glowna"]
        zapytaj(f"wp/v2/pages/{glowna}?_fields=id", {"excerpt": meta["glowna"]["opis"]})
        print("  mapa strony odświeżona (zapis strony głównej bez zmian w treści)")


ETAPY = {"media": media, "fonty": fonty, "style": style, "strony": strony, "menu": menu, "czesci": czesci, "ustawienia": ustawienia,
         "seo": seo}

if __name__ == "__main__":
    wybrane = [a for a in sys.argv[1:] if not a.startswith("--")] or list(ETAPY)
    for e in wybrane:
        ETAPY[e]()
    print("Gotowe.")

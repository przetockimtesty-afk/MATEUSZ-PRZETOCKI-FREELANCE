"""Wersja zadania.html dla Dokumentu Google na Dysku (Dysk sam zamienia HTML na dokument).

Uruchom: python3 firma/zadania/dokument_google.py  → firma/zadania/build/zadania-dokument-google.html
Treść jest ta sama co w PDF. Bez CSS, kafelków i kratek, bo Dokumenty Google ich nie przenoszą,
i bez numerów w nagłówkach, bo Dokument numeruje po swojemu.
"""
import pathlib

from bs4 import BeautifulSoup

TU = pathlib.Path(__file__).parent
WYJSCIE = TU / "build" / "zadania-dokument-google.html"

zupa = BeautifulSoup((TU / "zadania.html").read_text(encoding="utf-8"), "html.parser")
tytul = zupa.title.get_text()
body = zupa.body

# kafelki z podsumowaniem: jedna lista „Dziś: 7 kroków, ok. 1 godzina”
skrot = body.select_one(".skrot")
lista = zupa.new_tag("ul")
for kafelek in skrot.find_all("div", recursive=False):
    li = zupa.new_tag("li")
    li.string = f"{kafelek.strong.get_text()}: {kafelek.b.get_text()} {kafelek.span.get_text()}"
    lista.append(li)
skrot.replace_with(lista)

for e in body.select(".nad, .kratka, h2 .nr"):
    e.decompose()
for czas in body.select(".czas"):
    czas.replace_with(f" ({czas.get_text()})")

# załącznik o poziom niżej: jego tytuł staje się nagłówkiem sekcji całego dokumentu
zalacznik = body.select_one(".zalacznik")
for poziom in range(4, 0, -1):
    for h in zalacznik.find_all(f"h{poziom}"):
        h.name = f"h{poziom + 1}"
zalacznik.h2.string = "Załącznik: scenariusze filmów"
for h in zalacznik.find_all("h5"):  # „Nagranie” leży pod h3, więc bez przeskoku poziomu
    h.name = "h4"

for e in body.select("h1 em, h2 em"):
    e.unwrap()
for e in body.select(".zadanie, .zadanie > div, .scenariusz, .zalacznik"):
    e.unwrap()
for tabela in body.find_all("table"):
    tabela["border"] = "1"
    tabela["cellpadding"] = "5"
for e in body.find_all(True):
    e.attrs.pop("class", None)

tresc = " ".join(str(body.decode_contents()).split())
WYJSCIE.parent.mkdir(exist_ok=True)
WYJSCIE.write_text(f'<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>{tytul}</title></head><body>{tresc}</body></html>\n', encoding="utf-8")
print(f"OK: {WYJSCIE.relative_to(TU.parent.parent)} ({WYJSCIE.stat().st_size} B)")

#!/usr/bin/env python3
"""Buduje pliki do wgrania na Dysk Google, gdzie stają się Dokumentami Google.

    python3 firma/umowy/zbuduj.py

Wejście: firma/umowy/*.src.html. Wyjście w firma/umowy/build/:
- umowa.docx: wzór umowy z załącznikami. Przez .docx, bo konwersja HTML na Dysku gubi podziały stron.
- instrukcja.html: instrukcja (bez podziałów stron, więc wystarcza HTML).

Pola {{…}} dostają kolor według kategorii z POLA; <zolty>, <niebieski>, <zielony> i <fiolet> kolorują
dowolny tekst. Pole spoza POLA zatrzymuje budowanie.
"""
import html
import pathlib
import re
import sys
import zipfile
from html.parser import HTMLParser

KATALOG = pathlib.Path(__file__).resolve().parent
BUILD = KATALOG / 'build'

# Kolory z palety zakreślacza w Dokumentach Google (rząd „jasny 2”), żeby dało się je dobrać ręcznie.
KOLORY = {'zolty': 'FFE599', 'niebieski': '9FC5E8', 'zielony': 'B6D7A8', 'fiolet': 'B4A7D6'}
POLA = {
    'zolty': ['NR_UMOWY', 'FIRMA', 'ZAMAWIAJACY', 'ADRES_ZAMAWIAJACEGO', 'NIP', 'REPREZENTANT',
              'EMAIL_ZAMAWIAJACEGO', 'DOMENA', 'DATA_ZAWARCIA', 'TERMIN_ZADATKU', 'DATA_SPOTKANIA'],
    'niebieski': ['DATA_PROPOZYCJI', 'WARIANT', 'CENA', 'ZADATEK', 'RESZTA', 'MATERIALY_DO', 'PUBLIKACJA',
                  'MATERIALY', 'DODATEK', 'CENA_DODATKU', 'RABAT'],
    'fiolet': ['ADRES_WYKONAWCY', 'EMAIL_KONTAKT', 'NR_KONTA'],
}
KATEGORIA = {pole: kolor for kolor, pola in POLA.items() for pole in pola}


def pokoloruj_pola(tekst):
    def zamien(m):
        if m.group(1) not in KATEGORIA:
            sys.exit(f'Pole {m.group(0)} nie ma kategorii w POLA (zbuduj.py).')
        k = KATEGORIA[m.group(1)]
        return f'<{k}>{m.group(0)}</{k}>'
    return re.sub(r'\{\{([A-Z0-9_]+)\}\}', zamien, re.sub(r'<!--.*?-->', '', tekst, flags=re.S))


# ---------------------------------------------------------------- drzewo ze źródła

class Wezel:
    def __init__(self, tag, attrs=None, rodzic=None):
        self.tag, self.attrs, self.rodzic, self.dzieci = tag, dict(attrs or {}), rodzic, []


class Parser(HTMLParser):
    PUSTE = {'br'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.korzen = self.biezacy = Wezel('korzen')

    def handle_starttag(self, tag, attrs):
        w = Wezel(tag, attrs, self.biezacy)
        self.biezacy.dzieci.append(w)
        if tag not in self.PUSTE:
            self.biezacy = w

    def handle_endtag(self, tag):
        if tag in self.PUSTE:
            return
        if self.biezacy.tag != tag:
            sys.exit(f'Niezamknięty znacznik <{self.biezacy.tag}> przed </{tag}>')
        self.biezacy = self.biezacy.rodzic

    def handle_data(self, data):
        self.biezacy.dzieci.append(data)


def drzewo(tekst):
    p = Parser()
    p.feed(pokoloruj_pola(tekst))
    return p.korzen


def znaczniki(w):
    return [d for d in w.dzieci if not isinstance(d, str)]


# ---------------------------------------------------------------- DOCX

NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
SZER = 9638  # szerokość tekstu na A4 przy marginesach 2 cm (dxa)
FONT = 'Times New Roman'
LINIA = '……………………………………………'


def esc(t):
    return html.escape(t, quote=False)


class Docx:
    def __init__(self):
        self.listy = []  # (numId, abstractNumId); każda lista <ol> numeruje się od 1

    def runy(self, wezly, b=False, kolor=None, rozmiar=None, barwa=None):
        out = []
        for w in wezly:
            if isinstance(w, str):
                t = re.sub(r'\s+', ' ', w)
                if not t:
                    continue
                rpr = ('<w:b/>' if b else '') + (f'<w:color w:val="{barwa}"/>' if barwa else '') \
                    + (f'<w:sz w:val="{rozmiar}"/>' if rozmiar else '') \
                    + (f'<w:shd w:val="clear" w:color="auto" w:fill="{kolor}"/>' if kolor else '')
                out.append(f'<w:r>{"<w:rPr>" + rpr + "</w:rPr>" if rpr else ""}<w:t xml:space="preserve">{esc(t)}</w:t></w:r>')
            elif w.tag == 'br':
                out.append('<w:r><w:br/></w:r>')
            elif w.tag == 'b':
                out += self.runy(w.dzieci, True, kolor, rozmiar, barwa)
            elif w.tag in KOLORY:
                out += self.runy(w.dzieci, b, KOLORY[w.tag], rozmiar, barwa)
            elif w.tag not in ('ol', 'ul'):  # lista zagnieżdżona idzie osobnymi akapitami
                sys.exit(f'Nieobsługiwany znacznik w tekście: <{w.tag}>')
        # spacje po łamaniu wierszy w źródle: bez spacji na początku i końcu akapitu
        if out:
            out[0] = out[0].replace('<w:t xml:space="preserve"> ', '<w:t xml:space="preserve">', 1)
            if out[-1].endswith(' </w:t></w:r>'):
                out[-1] = out[-1][:-len(' </w:t></w:r>')] + '</w:t></w:r>'
        return [r for r in out if '<w:t xml:space="preserve"></w:t>' not in r]

    @staticmethod
    def akapit(runy, styl=None, ppr=''):
        p = f'<w:pStyle w:val="{styl}"/>' if styl else ''
        return f'<w:p><w:pPr>{p}{ppr}</w:pPr>{"".join(runy)}</w:p>'

    def lista(self, w, poziom=0, num=None):
        if num is None:
            self.listy.append((len(self.listy) + 1, 0 if w.tag == 'ol' else 1))
            num = len(self.listy)
        out = []
        for li in znaczniki(w):
            ppr = f'<w:numPr><w:ilvl w:val="{poziom}"/><w:numId w:val="{num}"/></w:numPr><w:spacing w:after="80"/>'
            out.append(self.akapit(self.runy(li.dzieci), ppr=ppr))
            for pod in [d for d in znaczniki(li) if d.tag in ('ol', 'ul')]:
                out += self.lista(pod, poziom + 1, num)
        return out

    @staticmethod
    def tabela(wiersze, szerokosci, ramka=True, tlo=None):
        krawedz = 'w:val="single" w:sz="4" w:space="0" w:color="999999"' if ramka else 'w:val="nil"'
        b = '<w:tblBorders>' + ''.join(f'<w:{s} {krawedz}/>' for s in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV')) + '</w:tblBorders>'
        out = [f'<w:tbl><w:tblPr><w:tblW w:w="{sum(szerokosci)}" w:type="dxa"/>{b}<w:tblLayout w:type="fixed"/>'
               '<w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="100" w:type="dxa"/>'
               '<w:bottom w:w="60" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr>'
               '<w:tblGrid>' + ''.join(f'<w:gridCol w:w="{s}"/>' for s in szerokosci) + '</w:tblGrid>']
        for wiersz in wiersze:
            out.append('<w:tr><w:trPr><w:cantSplit/></w:trPr>')
            for s, akapity in zip(szerokosci, wiersz):
                shd = f'<w:shd w:val="clear" w:color="auto" w:fill="{tlo}"/>' if tlo else ''
                out.append(f'<w:tc><w:tcPr><w:tcW w:w="{s}" w:type="dxa"/>{shd}</w:tcPr>{"".join(akapity)}</w:tc>')
            out.append('</w:tr>')
        return ''.join(out) + '</w:tbl>'

    def komorka(self, td):
        if any(d.tag == 'p' for d in znaczniki(td)):
            return [self.akapit(self.runy(p.dzieci), ppr='<w:spacing w:after="80"/>') for p in znaczniki(td)]
        return [self.akapit(self.runy(td.dzieci), ppr='<w:spacing w:after="0"/>')]

    def bloki(self, korzen):
        out = []
        for w in korzen.dzieci:
            if isinstance(w, str):
                if w.strip():
                    sys.exit(f'Tekst poza akapitem: {w.strip()[:40]!r}')
                continue
            if w.tag == 'h1':
                out.append(self.akapit(self.runy(w.dzieci), 'Nagwek1', '<w:pageBreakBefore/>' if 'nowa-strona' in w.attrs else ''))
            elif w.tag == 'h2':
                out.append(self.akapit(self.runy(w.dzieci), 'Nagwek2'))
            elif w.tag == 'p' and w.attrs.get('class') == 'srodek':
                out.append(self.akapit(self.runy(w.dzieci, barwa='444444'), ppr='<w:spacing w:after="200"/><w:jc w:val="center"/>'))
            elif w.tag == 'p' and w.attrs.get('class') == 'szary':
                out.append(self.akapit(self.runy(w.dzieci, barwa='555555', rozmiar=20)))
            elif w.tag == 'p':
                out.append(self.akapit(self.runy(w.dzieci)))
            elif w.tag in ('ol', 'ul'):
                out += self.lista(w)
            elif w.tag == 'ramka':
                out += [self.tabela([[self.komorka(w)]], [SZER], tlo='F3F3F3'), self.akapit([])]
            elif w.tag == 'tabela':
                wiersze = [[self.komorka(td) for td in znaczniki(tr)] for tr in znaczniki(w)]
                out += [self.tabela(wiersze, [3000, SZER - 3000]), self.akapit([])]
            elif w.tag == 'podpisy':
                pola = [[self.akapit([], ppr='<w:spacing w:before="600" w:after="0"/>'),
                         self.akapit(self.runy([LINIA]), ppr='<w:spacing w:after="0"/><w:jc w:val="center"/>'),
                         self.akapit(self.runy([f'{kto} (data i podpis)'], rozmiar=20), ppr='<w:jc w:val="center"/>')]
                        for kto in ('Zamawiający', 'Wykonawca')]
                out.append(self.tabela([pola], [SZER // 2, SZER - SZER // 2], ramka=False))
            else:
                sys.exit(f'Nieobsługiwany blok: <{w.tag}>')
        return out

    def numbering(self):
        def poziom(i, fmt, tekst, wciecie):
            return (f'<w:lvl w:ilvl="{i}"><w:start w:val="1"/><w:numFmt w:val="{fmt}"/><w:lvlText w:val="{tekst}"/>'
                    f'<w:lvlJc w:val="left"/><w:pPr><w:ind w:left="{wciecie}" w:hanging="360"/></w:pPr></w:lvl>')
        abstrakty = (f'<w:abstractNum w:abstractNumId="0">{poziom(0, "decimal", "%1.", 360)}{poziom(1, "lowerLetter", "%2)", 720)}</w:abstractNum>'
                     f'<w:abstractNum w:abstractNumId="1">{poziom(0, "bullet", "•", 360)}</w:abstractNum>')
        od_1 = ''.join(f'<w:lvlOverride w:ilvl="{i}"><w:startOverride w:val="1"/></w:lvlOverride>' for i in (0, 1))
        nums = ''.join(f'<w:num w:numId="{n}"><w:abstractNumId w:val="{a}"/>{od_1 if a == 0 else ""}</w:num>' for n, a in self.listy)
        return f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering {NS}>{abstrakty}{nums}</w:numbering>'


STYLES = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles {NS}>'
          f'<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" w:cs="{FONT}" w:eastAsia="{FONT}"/>'
          '<w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="pl-PL"/></w:rPr></w:rPrDefault>'
          '<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>'
          '<w:style w:type="paragraph" w:default="1" w:styleId="Normalny"><w:name w:val="Normal"/></w:style>'
          '<w:style w:type="paragraph" w:styleId="Nagwek1"><w:name w:val="heading 1"/><w:basedOn w:val="Normalny"/>'
          '<w:next w:val="Normalny"/><w:pPr><w:keepNext/><w:spacing w:before="0" w:after="160"/><w:jc w:val="center"/>'
          '<w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="30"/><w:szCs w:val="30"/></w:rPr></w:style>'
          '<w:style w:type="paragraph" w:styleId="Nagwek2"><w:name w:val="heading 2"/><w:basedOn w:val="Normalny"/>'
          '<w:next w:val="Normalny"/><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="80"/>'
          '<w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style>'
          '</w:styles>')
TYPY = 'application/vnd.openxmlformats-officedocument.wordprocessingml'
CONTENT_TYPES = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                 '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                 '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                 '<Default Extension="xml" ContentType="application/xml"/>'
                 f'<Override PartName="/word/document.xml" ContentType="{TYPY}.document.main+xml"/>'
                 f'<Override PartName="/word/styles.xml" ContentType="{TYPY}.styles+xml"/>'
                 f'<Override PartName="/word/numbering.xml" ContentType="{TYPY}.numbering+xml"/></Types>')
REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
RELS = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        f'<Relationship Id="rId1" Type="{REL}/officeDocument" Target="word/document.xml"/></Relationships>')
DOC_RELS = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            f'<Relationship Id="rId1" Type="{REL}/styles" Target="styles.xml"/>'
            f'<Relationship Id="rId2" Type="{REL}/numbering" Target="numbering.xml"/></Relationships>')


def zbuduj_docx(zrodlo, cel):
    d = Docx()
    tresc = ''.join(d.bloki(drzewo(zrodlo)))
    sekcja = ('<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
              '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>')
    dokument = f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document {NS}><w:body>{tresc}{sekcja}</w:body></w:document>'
    with zipfile.ZipFile(cel, 'w') as z:
        for nazwa, xml in (('[Content_Types].xml', CONTENT_TYPES), ('_rels/.rels', RELS),
                           ('word/_rels/document.xml.rels', DOC_RELS), ('word/document.xml', dokument),
                           ('word/styles.xml', STYLES), ('word/numbering.xml', d.numbering())):
            z.writestr(zipfile.ZipInfo(nazwa, date_time=(2026, 10, 20, 0, 0, 0)), xml, zipfile.ZIP_DEFLATED, 9)


# ---------------------------------------------------------------- HTML (instrukcja)

TD = "font-family:'Times New Roman';font-size:11pt;padding:4pt 6pt;border:1px solid #999999;vertical-align:top;"
CSS = ("h1{font-family:'Times New Roman';font-size:15pt;font-weight:bold;text-align:center;}"
       "h2{font-family:'Times New Roman';font-size:12pt;font-weight:bold;}"
       "p,li{font-family:'Times New Roman';font-size:11pt;}")


def zbuduj_html(zrodlo):
    t = pokoloruj_pola(zrodlo)
    for nazwa, kolor in KOLORY.items():
        t = t.replace(f'<{nazwa}>', f'<span style="background-color:#{kolor}">').replace(f'</{nazwa}>', '</span>')
    t = t.replace('<tabela>', '<table style="border-collapse:collapse;width:100%">').replace('</tabela>', '</table><p></p>')
    t = t.replace('<td>', f'<td style="{TD}">').replace('<p class="srodek">', '<p style="text-align:center;color:#444444">')
    t = re.sub(r'\n\s*\n+', '\n', t).strip()
    zostalo = re.findall(r'</?(?:ramka|tabela|podpisy|zolty|niebieski|zielony|fiolet)\b|nowa-strona|class="', t)
    if zostalo:
        sys.exit(f'Nieprzetworzone znaczniki w instrukcji: {zostalo}')
    return f'<!DOCTYPE html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>\n{t}\n</body></html>\n'


def main():
    BUILD.mkdir(exist_ok=True)
    umowa = BUILD / 'umowa.docx'
    zbuduj_docx((KATALOG / 'umowa.src.html').read_text(encoding='utf-8'), umowa)
    instrukcja = BUILD / 'instrukcja.html'
    instrukcja.write_text(zbuduj_html((KATALOG / 'instrukcja.src.html').read_text(encoding='utf-8')), encoding='utf-8')
    for p in (umowa, instrukcja):
        print(f'{p.relative_to(KATALOG.parent.parent)}: {p.stat().st_size / 1024:.1f} KB')


if __name__ == '__main__':
    main()

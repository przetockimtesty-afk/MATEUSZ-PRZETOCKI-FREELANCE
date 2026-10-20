# Scores firms per firma/automatyzacja/leady/REGULY.md (without group C and KNF until those sources are connected).
import json, csv, sys, datetime
sel = json.load(open(sys.argv[1]))
TODAY = datetime.date(2026, 10, 20)
A = 24  # doradcy kredytowi: 5+4+5+5+5
# site verdicts from rendered check 20.10: kind, domain, confirmed, notes, knf_info_present, network_agent
SITE = {
 'Magdalena Fior': ('form', 'magdalenafior.pl', True, 'formularz i WhatsApp, bez wyboru terminu, brak numeru wpisu KNF', False, False),
 'Justyna Bajak': ('form', 'plannakredyt.pl', True, 'formularz i przycisk „Umów rozmowę”, bez wyboru terminu, brak numeru wpisu KNF', False, False),
 'mCredit': ('form', 'mcredit.pl', True, 'formularz, bez wyboru terminu, brak numeru wpisu KNF; partner mFinanse (agent sieci)', False, True),
 "Kancelaria L'argent": ('form', 'kancelarialargent.pl', True, 'formularz, bez wyboru terminu, brak numeru wpisu KNF', False, False),
 'Credivo': ('form', 'credivo.pl', False, 'strona o finansowaniu firm z formularzem; nie potwierdzono, że to ta firma', False, False),
 'Finansowa Droga': ('form', 'finansowadroga.pl', False, 'strona z formularzem; nie potwierdzono, że to ta firma', False, False),
 'FINANSE BEZ STRESU': ('booking', 'finansebezstresu.pl', True, 'ma Calendly — bramka', True, False),
 'HipoNova': ('none', 'hiponova.pl', True, 'pod domeną tylko logowanie do CRM, brak strony dla klientów', False, False),
 'TUFinanse': ('none', 'tufinansebip.pl', True, 'domena z e-maila zwraca błąd 403, brak strony', False, False),
 'FINESTINS': ('none', 'finestins.pl', True, 'domena pusta', False, False),
}
WRONG = {'AJ Finanse': 'ajfinanse.pl to inna firma (Ostrów Wlkp.)', 'Tomasz Zawada': 'tomaszzawada.pl to inna osoba', 'Home4You': 'home4you.pl to biuro nieruchomości ze Świnoujścia', 'IWONA BĘTKOWSKA': 'betkowska.pl to inna strona', 'Credenzo': 'credenzo.com nie odpowiada', 'Ekspert Finansowy Paulina': 'waligorska.pl przekierowuje do LinkedIn'}
def find(d, n):
    for k, v in d.items():
        if k.lower() in n.lower(): return v
MIES = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia']
FOOT = ("\n\n—\n{P} adres e-mail pochodzi z publicznego wpisu w CEIDG. Administratorem danych jest Mateusz Przetocki. "
        "Przetwarzam je tylko po to, by zapytać o zgodę na kontakt (art. 6 ust. 1 lit. f RODO), i usunę je, jeśli nie będzie {P1} {zaint}. "
        "Przysługuje {Pd3} prawo dostępu do danych, ich sprostowania, usunięcia, sprzeciwu oraz skargi do Prezesa UODO.")
rows = []
for f in sel:
    n = f['nazwa']; s = find(SITE, n); wrong = find(WRONG, n)
    fem = f['imie'].lower().endswith('a')
    P, P1, Pd, Pd3 = ('Pani', 'Pani', 'Panią', 'Pani') if fem else ('Pana', 'Pan', 'Panem', 'Panu')
    email = f['email'].lower(); own_dom = bool(email) and email.split('@')[1] not in ('gmail.com', 'wp.pl', 'icloud.com', 'o2.pl', 'onet.pl', 'interia.pl')
    kind, dom, conf, notes, knf, agent = s if s else ('none', '', True, 'nie znaleziono strony' + (f' ({wrong})' if wrong else ''), False, False)
    start = datetime.date.fromisoformat(f['start']); months = (TODAY - start).days / 30.44
    det = []
    if kind == 'booking':
        rows.append({'Wynik': 0, 'Kolejka': 'odpada (bramka)', 'Firma': n, 'Właściciel': f"{f['imie']} {f['nazwisko']}", 'Miejscowość': f['miasto'], 'Działa od': f['start'], 'Strona': dom, 'Pewność strony': 'potwierdzona', 'Co na stronie': notes, 'Punkty (A/B/D/E)': '', 'Uzasadnienie': 'Ma już kalendarz online.', 'E-mail': email, 'Temat': '', 'Szkic wiadomości': '', 'Status': 'pominięta', 'Data kontaktu': '', 'Notatki': ''}); continue
    half = 1 if conf else 0.5
    if kind == 'none': b = 20; det.append('B: brak strony 20 (pewność średnia — potwierdzi Google)')
    else:
        b = (12 + (0 if knf else 5)) * half
        det.append(f'B: formularz bez wyboru terminu 12' + ('' if knf else ' + brak nr wpisu KNF 5') + ('' if conf else ' (×½, strona niepotwierdzona)'))
    d = 0
    if 3 <= months <= 24: d += 4; det.append('D: firma 3–24 mies. 4')
    if own_dom or (kind == 'form' and conf): d += 3 * (1 if conf else 0.5); det.append('D: własna domena 3')
    elif kind == 'form': d += 1.5; det.append('D: własna domena 1,5 (×½)')
    e = 0
    if email: e += 6; det.append('E: e-mail w CEIDG 6')
    if kind == 'form': e += 4 * half; det.append(f'E: formularz na stronie {4*half:g}')
    e += 2; det.append('E: Małopolska +2')
    total = A + b + d + e
    queue = 'zwycięzca' if total >= 54 else ('rezerwa' if total >= 39 else 'pomijamy')
    y, m, _ = f['start'].split('-'); od = f'{MIES[int(m)-1]} {y}'
    if kind == 'form' and conf:
        obs = f'Oglądałem {P} stronę {dom}. Klient może zostawić wiadomość w formularzu, ale nie może od razu wybrać terminu — musi czekać, aż {P1} odpisze albo oddzwoni.'
    elif kind == 'none':
        brak = f'Pod adresem {dom} nie ma strony dla klientów' if dom else f'Nie znalazłem {P} strony internetowej'
        obs = f'Trafiłem na {P} firmę w CEIDG (pośrednictwo finansowe, {f["miasto"]}, działalność od {od}). {brak}, więc klient, który chce się z {Pd} umówić, ' + ('musi zadzwonić albo szukać kontaktu na Facebooku.' if email else f'musi do {P} zadzwonić.')
    else:
        obs = f'Trafiłem na {P} firmę w CEIDG (pośrednictwo finansowe, {f["miasto"]}, działalność od {od}).'
    draft = (f'Dzień dobry,\n\n{obs}\n\nRobię strony dla doradców kredytowych, przez które klient sam umawia się na konsultację w wolnym terminie z kalendarza doradcy, a przy okazji dostaje odpowiedzi na pierwsze pytania.\n\n'
             f'Czy mogę przesłać krótki pomysł, jak mogłoby to wyglądać u {P}? Wystarczy odpisać „TAK”. Jeśli to nie jest dobry moment, nie odezwę się ponownie.\n\nPozdrawiam\nMateusz Przetocki')
    if email: draft += FOOT.format(P=P, P1=P1, Pd3=Pd3, zaint='zainteresowana' if fem else 'zainteresowany')
    status = ('do wysłania' if email else ('przez formularz na stronie' if kind == 'form' and conf else 'szukać kontaktu')) if queue != 'pomijamy' else 'pominięta'
    rows.append({'Wynik': round(total, 1), 'Kolejka': queue, 'Firma': n, 'Właściciel': f"{f['imie']} {f['nazwisko']}", 'Miejscowość': f['miasto'], 'Działa od': f['start'],
                 'Strona': dom, 'Pewność strony': 'potwierdzona' if (kind != 'none' and conf) else ('niepotwierdzona' if kind != 'none' else 'nie znaleziono'),
                 'Co na stronie': notes, 'Punkty (A/B/D/E)': f'{A}/{b:g}/{d:g}/{e:g}', 'Uzasadnienie': 'A: doradcy kredytowi 24; ' + '; '.join(det) + ('; D: agent sieci 0' if agent else '') + '. C (Google) i KNF jeszcze nieliczone.',
                 'E-mail': email, 'Temat': 'Krótkie pytanie o stronę', 'Szkic wiadomości': draft, 'Status': status, 'Data kontaktu': '', 'Notatki': ''})
order = {'zwycięzca': 0, 'rezerwa': 1, 'pomijamy': 2, 'odpada (bramka)': 3}
rows.sort(key=lambda r: (order[r['Kolejka']], -r['Wynik'], r['E-mail'] == ''))
with open(sys.argv[2], 'w', newline='', encoding='utf-8') as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
for r in rows: print(f"{r['Wynik']:>5} {r['Kolejka']:16} {r['Firma'][:38]:38} {r['Punkty (A/B/D/E)']:12} {'@' if r['E-mail'] else '-'} {r['Status']}")

import json, sys, re, urllib.request, ssl, concurrent.futures as cf
cands = json.load(open(sys.argv[1]))
def fetch(d):
    for url in (f'https://{d}/', f'https://www.{d}/'):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=15) as r:
                html = r.read(400000).decode('utf-8', 'replace')
                return url, r.geturl(), html
        except Exception as e:
            err = str(e)[:60]
    return None, None, err
def analyze(html):
    h = html.lower()
    t = re.search(r'<title[^>]*>(.*?)</title>', html, re.S | re.I)
    return {
        'title': (t.group(1).strip()[:80] if t else ''),
        'viewport': 'name="viewport"' in h,
        'form': '<form' in h and ('wpcf7' in h or 'contact' in h or 'kontakt' in h or 'textarea' in h),
        'booking': any(k in h for k in ('calendly', 'booksy', 'zarezerwuj', 'umów spotkanie', 'umow-spotkanie', 'kalendarz', 'simplybook', 'bookero', 'cal.com', 'zcal')),
        'tel': 'tel:' in h, 'wp': 'wp-content' in h, 'knf': 'knf' in h,
        'builder': next((b for b in ('wix', 'webwave', 'squarespace', 'shoper', 'site123', 'strikingly') if b in h), ''),
        'parked': any(k in h for k in ('domena na sprzedaż', 'domain is for sale', 'parking', 'ta domena', 'sedo')) or len(h) < 1500,
    }
def run(item):
    res = []
    for d in item['domains']:
        u, final, html = fetch(d)
        if u: res.append({'domain': d, 'final': final, **analyze(html)})
    return item['nazwa'], res
with cf.ThreadPoolExecutor(8) as ex:
    out = dict(ex.map(run, cands))
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
for k, v in out.items():
    print(k[:40], '->', [(r['domain'], r['title'][:40], 'P' if r['parked'] else '', 'B' if r['booking'] else '', 'F' if r['form'] else '', r['builder']) for r in v])

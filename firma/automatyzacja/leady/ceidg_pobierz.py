import json, sys, time, urllib.request, urllib.parse, os
outdir = sys.argv[1]
def get(url):
    for a in range(6):
        try:
            with urllib.request.urlopen(url, timeout=90) as r:
                if r.status == 204: return {}
                return json.load(r)
        except Exception as e:
            print('err', e, url[-60:], flush=True); time.sleep(4 * (a + 1))
    return None
base = 'https://dane.biznes.gov.pl/api/ceidg/v3/firmy?' + urllib.parse.urlencode(
    {'pkd': '6619Z', 'wojewodztwo': 'małopolskie', 'status': 'AKTYWNY', 'dataod': '2024-10-01', 'limit': 25})
lst_path = os.path.join(outdir, 'list2.json')
lst = json.load(open(lst_path)) if os.path.exists(lst_path) else []
if not lst:
    page = 1
    while True:
        d = get(base + f'&page={page}')
        if d is None: sys.exit('list failed at page %d' % page)
        f = d.get('firmy', [])
        if not f: break
        lst += f
        if 'next' not in d.get('links', {}) or len(f) < 25: break
        page += 1; time.sleep(0.5)
    json.dump(lst, open(lst_path, 'w'), ensure_ascii=False)
print('list', len(lst), flush=True)
det_path = os.path.join(outdir, 'details.json')
det = json.load(open(det_path)) if os.path.exists(det_path) else {}
for i, f in enumerate(lst):
    if f['id'] in det: continue
    d = get(f['link'])
    if d is None: continue
    det[f['id']] = (d.get('firma') or [d])[0]
    if i % 25 == 0:
        json.dump(det, open(det_path, 'w'), ensure_ascii=False); print('details', len(det), flush=True)
    time.sleep(0.3)
json.dump(det, open(det_path, 'w'), ensure_ascii=False)
print('done', len(det), flush=True)

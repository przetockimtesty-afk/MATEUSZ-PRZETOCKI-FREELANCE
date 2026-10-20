#!/bin/bash
# Pomiar szybkości stron na telefonie (Lighthouse, jak w PageSpeed Insights).
# Użycie: ./szybkosc.sh domena1.pl domena2.pl ...  (wymaga: npm i lighthouse@12.8.2 w katalogu roboczym)
for d in "$@"; do
  CHROME_PATH=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux*/chrome | head -1) \
    npx lighthouse "https://$d/" --only-categories=performance --form-factor=mobile \
    --output=json --output-path="lh-$d.json" --chrome-flags="--headless=new --no-sandbox" --quiet
  python3 -c "
import json; d = json.load(open('lh-$d.json')); a = d['audits']
big = [(i.get('url', '').split('/')[-1][:30], round(i['totalBytes'] / 1e6, 1)) for i in a['total-byte-weight']['details']['items'][:2]]
print('$d', 'wynik', round(d['categories']['performance']['score'] * 100), 'LCP', a['largest-contentful-paint']['displayValue'], 'waga', round(a['total-byte-weight']['numericValue'] / 1e6, 1), 'MB', big)"
done

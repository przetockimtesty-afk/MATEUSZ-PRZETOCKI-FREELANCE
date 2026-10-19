# Kompiluje tokens.json do tokens.css TYLKO do lokalnego testu podglądów (nie publikujemy go).
import json, sys
src, out, fontbase = sys.argv[1], sys.argv[2], sys.argv[3]
t = json.load(open(src, encoding='utf-8'))
first = t['color']['themes'][0]['id']
L = ['/* %s — generated from tokens.json */' % t['name']]
L.append(':root, [data-theme="%s"] {' % first)
def val(v):
    return v if isinstance(v, str) else v.get(first)
for tok in t['color']['tokens']:
    v = val(tok['value'])
    if v.startswith('{'): v = 'var(--%s)' % v.strip('{}')
    L.append('  --%s: %s;' % (tok['name'], v.lower() if v.startswith('#') else v))
for tok in t.get('shadow', {}).get('tokens', []):
    L.append('  --%s: %s;' % (tok['name'], val(tok['value'])))
L.append('}')
L.append(':root {')
for fam in ('spacing', 'radius'):
    for tok in t.get(fam, {}).get('tokens', []):
        v = tok['value']; v = ('%spx' % v) if isinstance(v, (int, float)) else v
        L.append('  --%s: %s;' % (tok['name'], v))
for k, v in t['type']['families'].items():
    L.append('  --font-%s: %s;' % (k, v))
L.append('}')
props = [('fontSize', 'font-size'), ('lineHeight', 'line-height'), ('fontWeight', 'font-weight'), ('letterSpacing', 'letter-spacing'), ('fontStyle', 'font-style')]
for g in t['type']['groups']:
    for s in g['styles']:
        fam = s.get('family', g['family'])
        decl = ['font-family: var(--font-%s)' % fam]
        for k, css in props:
            if k in s:
                v = s[k]
                if k in ('fontSize', 'letterSpacing') and isinstance(v, (int, float)): v = '%spx' % v
                decl.append('%s: %s' % (css, v))
        L.append('.%s { %s; }' % (s['name'], '; '.join(decl)))
for f in t['type']['fonts']:
    path = f['file'] if '/' in f['file'] else 'fonts/' + f['file']
    L.append('@font-face { font-family: "%s"; src: url("%s/%s") format("woff2"); font-weight: %s; font-style: %s; font-display: swap; }'
             % (f['family'], fontbase, path, f['weight'], f.get('style', 'normal')))
open(out, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
print('\n'.join(L[:8])); print('...', len(L), 'lines')

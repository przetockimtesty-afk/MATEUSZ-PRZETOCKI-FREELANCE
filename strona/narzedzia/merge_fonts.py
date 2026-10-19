import sys, os
from fontTools.ttLib import TTFont
from fontTools.merge import Merger
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
pairs = {
  'Inter-400.woff2': ('fontsource-inter-5.3.0', 'inter-latin-400-normal.woff2', 'inter-latin-ext-400-normal.woff2'),
  'Inter-500.woff2': ('fontsource-inter-5.3.0', 'inter-latin-500-normal.woff2', 'inter-latin-ext-500-normal.woff2'),
  'Inter-600.woff2': ('fontsource-inter-5.3.0', 'inter-latin-600-normal.woff2', 'inter-latin-ext-600-normal.woff2'),
  'InterTight-600.woff2': ('fontsource-inter-tight-5.3.0', 'inter-tight-latin-600-normal.woff2', 'inter-tight-latin-ext-600-normal.woff2'),
  'InterTight-700.woff2': ('fontsource-inter-tight-5.3.0', 'inter-tight-latin-700-normal.woff2', 'inter-tight-latin-ext-700-normal.woff2'),
  'InstrumentSerif-Italic.woff2': ('fontsource-instrument-serif-5.3.0', 'instrument-serif-latin-400-italic.woff2', 'instrument-serif-latin-ext-400-italic.woff2'),
  'InstrumentSerif-Regular.woff2': ('fontsource-instrument-serif-5.3.0', 'instrument-serif-latin-400-normal.woff2', 'instrument-serif-latin-ext-400-normal.woff2'),
}
tmp = os.path.join(out, '_tmp'); os.makedirs(tmp, exist_ok=True)
for name, (pkg, a, b) in pairs.items():
    paths = []
    for f in (a, b):
        t = TTFont(os.path.join(src, pkg, 'package', 'files', f))
        t.flavor = None
        p = os.path.join(tmp, f.replace('.woff2', '.ttf')); t.save(p); paths.append(p)
    merged = Merger().merge(paths)
    merged.flavor = 'woff2'
    dst = os.path.join(out, name); merged.save(dst)
    cmap = merged.getBestCmap()
    need = [ord(c) for c in 'AaĄąĆćĘęŁłŃńÓóŚśŹźŻż0123456789„”–·']
    missing = [chr(c) for c in need if c not in cmap]
    print(f'{name}: {os.path.getsize(dst)} B, znaków {len(cmap)}, brakuje: {"".join(missing) or "nic"}')

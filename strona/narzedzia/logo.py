import sys, os, io
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

font_path, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
tt = TTFont(font_path)
buf = io.BytesIO(); tt.flavor = None; tt.save(buf); data = buf.getvalue()
tt = TTFont(io.BytesIO(data))
upm = tt['head'].unitsPerEm
gs = tt.getGlyphSet()
order = tt.getGlyphOrder()
face = hb.Face(data); hbfont = hb.Font(face)

def shape(text, size, tracking_em=0.0):
    b = hb.Buffer(); b.add_str(text); b.guess_segment_properties()
    hb.shape(hbfont, b, {"kern": True, "liga": True})
    scale = size / upm
    x = 0.0; parts = []
    for info, pos in zip(b.glyph_infos, b.glyph_positions):
        name = order[info.codepoint]
        pen = SVGPathPen(gs)
        tp = TransformPen(pen, (scale, 0, 0, -scale, x + pos.x_offset * scale, -pos.y_offset * scale))
        gs[name].draw(tp)
        d = pen.getCommands()
        if d: parts.append(d)
        x += pos.x_advance * scale + tracking_em * size
    return ' '.join(parts), x - tracking_em * size

asc = tt['OS/2'].sCapHeight
def wordmark(ink, fname):
    size = 48
    d, width = shape('Mateusz Przetocki', size, -0.01)
    cap = asc * size / upm
    pad = 2
    dot_r = 4.5
    w = width + 6 + dot_r * 2 + pad * 2
    h = cap + 14 + pad * 2  # miejsce na ogonki poniżej linii
    base = pad + cap
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}" width="{w:.0f}" height="{h:.0f}" role="img" aria-label="Mateusz Przetocki">'
           f'<path fill="{ink}" transform="translate({pad},{base:.2f})" d="{d}"/>'
           f'<circle cx="{pad + width + 6 + dot_r:.2f}" cy="{base - dot_r:.2f}" r="{dot_r}" fill="#A7C7E7"/></svg>')
    open(os.path.join(out, fname), 'w').write(svg)
    print(fname, round(w), 'x', round(h))

def monogram(fname):
    size = 30
    d, width = shape('MP', size, -0.02)
    cap = asc * size / upm
    S = 64
    x0 = (S - width) / 2; base = (S + cap) / 2
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" width="{S}" height="{S}" role="img" aria-label="MP">'
           f'<rect width="{S}" height="{S}" rx="14" fill="#161514"/>'
           f'<path fill="#F5F2EC" transform="translate({x0:.2f},{base:.2f})" d="{d}"/></svg>')
    open(os.path.join(out, fname), 'w').write(svg)
    print(fname, S, 'x', S)

wordmark('#161514', 'logo-mateusz-przetocki.svg')
wordmark('#F5F2EC', 'logo-mateusz-przetocki-na-czerni.svg')
monogram('monogram-mp.svg')

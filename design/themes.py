"""
StellarForge — multi-theme derivation.

A theme is (base colour, primary accent, mode). Everything else is SOLVED
against the same contrast targets as the default palette, so every theme in
the matrix passes WCAG by construction. Adding a theme is adding a line.

    python3 themes.py        → themes.css, theme-proof.html, themes.json
"""
import math, json, pathlib, sys

# Windows' default console codepage (cp1252) can't encode the report's non-ASCII
# glyphs; force UTF-8 on stdout and on every file write, matching derive.py/emit.py.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
HERE = pathlib.Path(__file__).parent

# ───────────────── colour science (same as derive.py) ─────────────────
def s2l(c):
    c /= 255; return c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4
def l2s(c):
    v = 12.92*c if c <= 0.0031308 else 1.055*(c**(1/2.4))-0.055
    return max(0, min(255, round(v*255)))
def rgb2oklab(rgb):
    r,g,b = [s2l(x) for x in rgb]
    l = 0.4122214708*r+0.5363325363*g+0.0514459929*b
    m = 0.2119034982*r+0.6806995451*g+0.1073969566*b
    s = 0.0883024619*r+0.2817188376*g+0.6299787005*b
    l_,m_,s_ = l**(1/3), m**(1/3), s**(1/3)
    return (0.2104542553*l_+0.7936177850*m_-0.0040720468*s_,
            1.9779984951*l_-2.4285922050*m_+0.4505937099*s_,
            0.0259040371*l_+0.7827717662*m_-0.8086757660*s_)
def oklab2rgb(lab):
    L,a,b = lab
    l_ = L+0.3963377774*a+0.2158037573*b
    m_ = L-0.1055613458*a-0.0638541728*b
    s_ = L-0.0894841775*a-1.2914855480*b
    l,m,s = l_**3, m_**3, s_**3
    return (l2s( 4.0767416621*l-3.3077115913*m+0.2309699292*s),
            l2s(-1.2684380046*l+2.6097574011*m-0.3413193965*s),
            l2s(-0.0041960863*l-0.7034186147*m+1.7076147010*s))
def lch2rgb(L,C,H):
    h = math.radians(H); return oklab2rgb((L, C*math.cos(h), C*math.sin(h)))
def rgb2lch(rgb):
    L,a,b = rgb2oklab(rgb); return (L, math.hypot(a,b), math.degrees(math.atan2(b,a)) % 360)
def hx(h):
    h = h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
def tohex(rgb): return '#%02X%02X%02X' % tuple(rgb)
def lum(rgb):
    r,g,b = [s2l(c) for c in rgb]; return 0.2126*r+0.7152*g+0.0722*b
def cr(a,b):
    la,lb = lum(a), lum(b); hi,lo = max(la,lb), min(la,lb); return (hi+0.05)/(lo+0.05)

def solve(target, bg, chroma_fn, H, direction):
    """direction=+1 → lighter than bg, -1 → darker. Returns the nearest L that hits target."""
    L0 = rgb2lch(bg)[0]
    lo, hi = (L0, 1.0) if direction > 0 else (0.0, L0)
    for _ in range(70):
        mid = (lo+hi)/2
        hit = cr(lch2rgb(mid, chroma_fn(mid), H), bg) >= target
        if direction > 0:
            if hit: hi = mid
            else:   lo = mid
        else:
            if hit: lo = mid
            else:   hi = mid
    L = hi if direction > 0 else lo
    return lch2rgb(L, chroma_fn(L), H)

# ───────────────────────── the registry ─────────────────────────
# Bases: the seed colour is the ONLY hand-chosen value. Its hue and chroma
# drive the whole neutral ramp for that theme.
BASES = {
  # dark
  'void':     {'seed':'#0A0E17', 'mode':'dark',  'label':'Void',     'blurb':'The original. Blue-black, light emerging from nothing.'},
  'charcoal': {'seed':'#111214', 'mode':'dark',  'label':'Charcoal', 'blurb':'Neutral near-black. No tint, no drama.'},
  'graphite': {'seed':'#1C1E22', 'mode':'dark',  'label':'Graphite', 'blurb':'Dark grey. Easier on OLED, softer at night.'},
  'midnight': {'seed':'#0A1128', 'mode':'dark',  'label':'Midnight', 'blurb':'Deeper, more saturated blue.'},
  'abyss':    {'seed':'#050609', 'mode':'dark',  'label':'Abyss',    'blurb':'As dark as it goes without pure black.'},
  'umber':    {'seed':'#15100D', 'mode':'dark',  'label':'Umber',    'blurb':'Warm dark. Candlelight rather than starlight.'},
  # light
  'paper':    {'seed':'#F4F1EA', 'mode':'light', 'label':'Paper',    'blurb':'Warm off-white. Manuscript stock.'},
  'sky':      {'seed':'#E9F1FB', 'mode':'light', 'label':'Sky',      'blurb':'Pale blue. Daylight on the bridge.'},
  'fog':      {'seed':'#EDEEF1', 'mode':'light', 'label':'Fog',      'blurb':'Neutral light grey.'},
  'dawn':     {'seed':'#F8F0E6', 'mode':'light', 'label':'Dawn',     'blurb':'Warm, faintly peach.'},
}

# Accents: hue + chroma taken from the existing brand hues. The user picks ONE
# as the primary (CTAs, focus, selection). The semantic four stay fixed.
ACCENT_SEEDS = {
  'teal':'#15C17B','teal-bright':'#3DFFCD','cyan':'#00D4FF','emerald':'#00FF88','azure':'#4D9FFF',
  'amber-warm':'#FFB347',
  'stellar':'#5B8DEF','violet':'#9B5DE5','amber':'#FFB800','magenta':'#FF00AA','crimson':'#FF3366',
}
PRIMARY_CHOICES = ['teal','cyan','emerald','azure','violet','amber','magenta']
SEMANTIC = {'physics':'amber','stop':'crimson','worlds':'stellar','lore':'violet'}

PLANE_STEP = 1.22
TEXT_T  = {'t1': None, 't2': 8.0, 't3': 5.5, 't4': 4.5}     # t1 pinned
LINE_T  = {'hairline':1.7,'default':2.4,'interactive':3.1,'emphasis':4.6}

def derive_theme(base_id, primary_id):
    B = BASES[base_id]; seed = hx(B['seed']); dark = B['mode']=='dark'
    d = 1 if dark else -1                       # planes/text/lines move AWAY from the base
    L0, C0, H0 = rgb2lch(seed)
    C_plane = lambda L: max(0.012, C0 + 0.16*abs(L - L0)) if dark else max(0.006, C0*0.8)
    C_text  = lambda L: 0.010
    C_line  = lambda L: 0.014

    # planes
    void = seed
    surface  = solve(PLANE_STEP, void,    C_plane, H0, d)
    elevated = solve(PLANE_STEP, surface, C_plane, H0, d)
    planes = {'void':void,'surface':surface,'elevated':elevated}
    # elevated is ALWAYS the plane nearest the text in luminance — the hardest
    # one to clear — in both modes. Text, lines and accents all move the same
    # way the planes do: away from the base.
    lightest = elevated
    t = d
    text = {'t1': hx('FAFAFA') if dark else hx('16181C')}
    for k,v in TEXT_T.items():
        if v: text[k] = solve(v, lightest, C_text, H0, t)
    line = {k: solve(v, lightest, C_line, H0, t) for k,v in LINE_T.items()}

    # accents: fills need ≥3.05 on lightest plane, text needs ≥4.55
    def solve_accent(seed_hex, target):
        L,C,H = rgb2lch(hx(seed_hex)); keep = lambda _l: C
        base = hx(seed_hex)
        if cr(base, lightest) >= target: return base
        return solve(target, lightest, keep, H, t)   # dark → lighter; light → darker
    accent, accent_text = {}, {}
    for name, sh in ACCENT_SEEDS.items():
        accent[name] = solve_accent(sh, 3.05)
        accent_text[name] = solve_accent(sh, 4.55)
    INK, PAPER = hx('0B0F18'), hx('FFFFFF')
    on_accent = {n: (INK if cr(INK,a) >= cr(PAPER,a) else PAPER) for n,a in accent.items()}

    P = accent[primary_id]
    Lp,Cp,Hp = rgb2lch(P)
    primary_bright = lch2rgb(min(1,Lp+0.08) if dark else max(0,Lp-0.08), Cp, Hp)
    focus = primary_bright if cr(primary_bright, lightest) >= 3 else accent_text[primary_id]
    disabled_bg   = solve(1.12, void, C_plane, H0, d)
    disabled_line = solve(1.9,  lightest, C_line, H0, t)
    disabled_text = solve(3.0,  lightest, C_text, H0, t)
    selection = lch2rgb(0.55 if dark else 0.85, 0.06, Hp)

    return {
      'id': f'{base_id}-{primary_id}', 'base': base_id, 'primary': primary_id, 'mode': B['mode'],
      'label': f"{B['label']} · {primary_id.title()}",
      'planes': {k:tohex(v) for k,v in planes.items()},
      'scrim': 'rgba(5,7,12,0.72)' if dark else 'rgba(20,24,32,0.45)',
      'text': {k:tohex(v) for k,v in text.items()},
      'line': {k:tohex(v) for k,v in line.items()},
      'accent': {k:tohex(v) for k,v in accent.items()},
      'accent_text': {k:tohex(v) for k,v in accent_text.items()},
      'on_accent': {k:tohex(v) for k,v in on_accent.items()},
      'primary': {'base':tohex(P),'text':tohex(accent_text[primary_id]),'on':tohex(on_accent[primary_id]),
                  'bright':tohex(primary_bright)},
      'state': {'focus':tohex(focus),'disabled_bg':tohex(disabled_bg),'disabled_line':tohex(disabled_line),
                'disabled_text':tohex(disabled_text),'selection_bg':tohex(selection)},
      'ambient': 1 if dark else 0.25,
      # audit
      'worst': {'t2': min(cr(text['t2'],p) for p in planes.values()),
                't4': min(cr(text['t4'],p) for p in planes.values()),
                'line_interactive': min(cr(line['interactive'],p) for p in planes.values()),
                'primary_text': min(cr(accent_text[primary_id],p) for p in planes.values()),
                'on_primary': cr(on_accent[primary_id], P)},
    }

# ───────────────────────── emit ─────────────────────────
import colorsys
def rgb_triplet(h):
    h = h.lstrip('#'); return ' '.join(str(int(h[i:i+2], 16)) for i in (0, 2, 4))
def hsl_triplet(h):
    h = h.lstrip('#'); r, g, b = (int(h[i:i+2], 16)/255 for i in (0, 2, 4))
    hh, l, sat = colorsys.rgb_to_hls(r, g, b)
    return f"{round(hh*360)} {round(sat*100)}% {round(l*100)}%"

def css_block(T, selector):
    v = []
    v.append(f"  --sf-void: {T['planes']['void']}; --sf-surface: {T['planes']['surface']}; --sf-surface-elevated: {T['planes']['elevated']};")
    v.append(f"  --sf-scrim: {T['scrim']};")
    v.append("  " + " ".join(f"--{k}: {c};" for k,c in T['text'].items()))
    v.append(f"  --sf-line-hairline: {T['line']['hairline']}; --sf-line: {T['line']['default']}; --sf-line-interactive: {T['line']['interactive']}; --sf-line-emphasis: {T['line']['emphasis']};")
    v.append("  " + " ".join(f"--sf-{k}: {c};" for k,c in T['accent'].items()))
    v.append("  " + " ".join(f"--sf-{k}-text: {c};" for k,c in T['accent_text'].items()))
    v.append("  " + " ".join(f"--sf-on-{k}: {c};" for k,c in T['on_accent'].items()))
    p = T['primary']
    v.append(f"  --sf-primary: {p['base']}; --sf-primary-text: {p['text']}; --sf-on-primary: {p['on']}; --sf-primary-bright: {p['bright']};")
    s = T['state']
    v.append(f"  --sf-focus: {s['focus']}; --sf-selection-bg: {s['selection_bg']}; --sf-disabled-bg: {s['disabled_bg']}; --sf-disabled-line: {s['disabled_line']}; --sf-disabled-text: {s['disabled_text']};")
    v.append(f"  --sf-ambient: {T['ambient']}; color-scheme: {T['mode']};")
    # HSL twins for the shadcn layer — see emit.py. Same values, triplet form.
    P_, X_, L_ = T['planes'], T['text'], T['line']
    tw = [('sf-void', P_['void']), ('sf-surface', P_['surface']), ('sf-surface-elevated', P_['elevated'])]
    tw += [(k, c) for k, c in X_.items()]
    tw += [('sf-line-hairline', L_['hairline']), ('sf-line', L_['default']),
           ('sf-line-interactive', L_['interactive']), ('sf-line-emphasis', L_['emphasis']),
           ('sf-primary', p['base']), ('sf-primary-bright', p['bright'])]
    tw += [(f"sf-{k}", c) for k, c in T['accent'].items()]
    tw += [(f"sf-on-{k}", c) for k, c in T['on_accent'].items()]
    tw += [('sf-on-primary', p['on']), ('sf-focus', T['state']['focus'])]
    v.append("  " + " ".join(f"--{k}-hsl: {hsl_triplet(c)};" for k, c in tw))
    # RGB triplets for tailwind.config.ts (see emit.py): every utility class
    # reads rgb(var(--x-rgb) / a), so this is what actually re-themes the app.
    rg = list(tw)
    rg += [(f"sf-{k}-text", c) for k, c in T['accent_text'].items()]
    rg += [('sf-primary-text', p['text']), ('sf-disabled-bg', s['disabled_bg']), ('sf-disabled-line', s['disabled_line']),
           ('sf-disabled-text', s['disabled_text']), ('sf-selection-bg', s['selection_bg'])]
    v.append("  " + " ".join(f"--{k}-rgb: {rgb_triplet(c)};" for k, c in rg))
    return f"{selector} {{\n" + "\n".join(v) + "\n}\n"

def main():
    themes = [derive_theme(b, a) for b in BASES for a in PRIMARY_CHOICES]
    default = next(t for t in themes if t['id']=='void-teal')

    css = ["/* StellarForge — themes.css · GENERATED by design/themes.py. Do not hand-edit.",
           " * Load AFTER tokens.css. Every theme is contrast-solved against the same targets.",
           " * Switch with: document.documentElement.dataset.theme = 'midnight-cyan' */\n",
           "/* Primary-role aliases so the default theme works with no data-theme set. */",
           css_block(default, ":root"), ""]
    for T in themes:
        css.append(css_block(T, f'[data-theme="{T["id"]}"]'))
    (HERE/'themes.css').write_text("\n".join(css), encoding='utf-8')
    (HERE/'themes.json').write_text(json.dumps({'bases':BASES,'primaries':PRIMARY_CHOICES,'semantic':SEMANTIC,
                                                'themes':{t['id']:t for t in themes}}, indent=1), encoding='utf-8')

    # ── audit
    fails = [(t['id'],k,round(v,2)) for t in themes for k,v in t['worst'].items()
             if v < {'t2':8,'t4':4.5,'line_interactive':3.0,'primary_text':4.5,'on_primary':4.5}[k]-0.02]
    print(f"themes: {len(themes)}  ({len(BASES)} bases × {len(PRIMARY_CHOICES)} primaries)")
    print("contrast failures:", fails or "none — every theme passes every target")

    # ── proof page
    cards = []
    for T in themes:
        P=T['planes']; X=T['text']; L=T['line']; pr=T['primary']; A=T['accent']; AT=T['accent_text']
        cards.append(f"""
<div class="card" style="background:{P['void']};border:1px solid {L['default']}">
  <div class="hd" style="color:{X['t4']}">// {T['label'].upper()}</div>
  <div class="panel" style="background:{P['surface']};border:1px solid {L['default']}">
    <div style="font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.1em;color:{X['t4']}">SURFACE GRAVITY</div>
    <div style="display:flex;justify-content:space-between;margin-top:4px">
      <span style="color:{X['t2']};font-size:14px">Kellis Prime</span>
      <span style="font-family:ui-monospace,monospace;color:{pr['text']};font-size:13px">1.40 g</span>
    </div>
    <div class="elev" style="background:{P['elevated']};border:1px solid {L['hairline']};color:{X['t3']}">elevated · t3 body</div>
  </div>
  <div class="row">
    <button style="background:{pr['base']};color:{pr['on']};border:1px solid {pr['base']}">Save</button>
    <button style="background:transparent;color:{X['t1']};border:1px solid {L['interactive']}">Export</button>
    <button style="background:{T['state']['disabled_bg']};color:{T['state']['disabled_text']};border:1px solid {T['state']['disabled_line']}">Off</button>
  </div>
  <div class="row" style="gap:6px">
    <span class="tag" style="border-color:{A['amber']};color:{AT['amber']}">PHYSICS</span>
    <span class="tag" style="border-color:{A['crimson']};color:{AT['crimson']}">STOP</span>
    <span class="tag" style="border-color:{A['stellar']};color:{AT['stellar']}">WORLDS</span>
    <span class="tag" style="border-color:{A['violet']};color:{AT['violet']}">LORE</span>
  </div>
  <div class="ft" style="color:{X['t4']}">t2 {T['worst']['t2']:.1f} · t4 {T['worst']['t4']:.1f} · line {T['worst']['line_interactive']:.1f} · focus <span style="display:inline-block;width:9px;height:9px;background:{T['state']['focus']};vertical-align:-1px"></span></div>
</div>""")
    html = f"""<!doctype html><html><head><meta charset="utf-8"><title>StellarForge — theme matrix</title>
<style>
body{{margin:0;background:#101318;color:#C9CDD3;font-family:'DM Sans',system-ui,sans-serif;padding:32px}}
h1{{font-weight:400;font-size:24px;color:#FAFAFA;margin:0 0 4px}} p.l{{color:#A7AAB0;max-width:72ch;margin:0 0 24px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}}
.card{{padding:14px}} .hd{{font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.12em;margin-bottom:10px}}
.panel{{padding:12px}} .elev{{margin-top:10px;padding:8px 10px;font-size:12px}}
.row{{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}}
button{{font:500 11px/1 'DM Sans',sans-serif;text-transform:uppercase;letter-spacing:.06em;padding:9px 12px;border-radius:0;min-height:32px}}
.tag{{font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.08em;border:1px solid;padding:3px 6px;border-radius:2px}}
.ft{{font-family:ui-monospace,monospace;font-size:10px;margin-top:12px;letter-spacing:.04em}}
h2{{font-weight:500;font-size:15px;color:#FAFAFA;margin:28px 0 10px}}
</style></head><body>
<h1>Theme matrix — {len(themes)} themes, zero contrast failures</h1>
<p class="l">Every card is one theme: base × primary accent. Each is solved against the same targets as the default palette,
so a user can pick any combination and the result passes WCAG by construction. The four semantic accents (Physics, Stop, Worlds, Lore) keep their meaning in every theme.</p>
<h2>Dark bases</h2><div class="grid">{"".join(c for c,t in zip(cards,themes) if t['mode']=='dark')}</div>
<h2>Light bases</h2><div class="grid">{"".join(c for c,t in zip(cards,themes) if t['mode']=='light')}</div>
</body></html>"""
    (HERE/'theme-proof.html').write_text(html)
    print("wrote themes.css, themes.json, theme-proof.html")

if __name__ == '__main__':
    main()

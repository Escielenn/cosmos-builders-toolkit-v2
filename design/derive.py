"""
StellarForge — palette derivation.

Every value below is SOLVED against a contrast target in OKLab, not chosen by eye.
Run this to regenerate tokens.css and tailwind.config.ts. Edit the targets, never
the hex values.

    python3 derive.py
"""
import math, json, pathlib, sys

# Windows' default console codepage (cp1252) can't encode the report's `→`
# glyphs and raises UnicodeEncodeError mid-run — before palette.json gets
# written, since that happens after the printed report. Force UTF-8 stdout
# so `python derive.py` works the same on every platform.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

OUT = pathlib.Path(__file__).parent

# ───────────────────────── colour science ─────────────────────────
def s2l(c):
    c /= 255
    return c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4
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
    h = math.radians(H)
    return oklab2rgb((L, C*math.cos(h), C*math.sin(h)))
def rgb2lch(rgb):
    L,a,b = rgb2oklab(rgb)
    return (L, math.hypot(a,b), math.degrees(math.atan2(b,a)) % 360)
def hx(h):
    h = h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
def tohex(rgb): return '#%02X%02X%02X' % tuple(rgb)
def lum(rgb):
    r,g,b = [s2l(c) for c in rgb]; return 0.2126*r+0.7152*g+0.0722*b
def cr(a,b):
    la,lb = lum(a), lum(b); hi,lo = max(la,lb), min(la,lb)
    return (hi+0.05)/(lo+0.05)

def solve_lighter(target, bg, chroma_fn, H):
    """Smallest L ABOVE the background's lightness that reaches `target` contrast."""
    lo = rgb2lch(bg)[0]
    hi = 1.0
    for _ in range(70):
        mid = (lo+hi)/2
        if cr(lch2rgb(mid, chroma_fn(mid), H), bg) < target: lo = mid
        else: hi = mid
    return lch2rgb(hi, chroma_fn(hi), H)

def solve_darker(target, bg, chroma_fn, H):
    """Largest L BELOW the background's lightness that reaches `target` contrast."""
    lo, hi = 0.0, rgb2lch(bg)[0]
    for _ in range(70):
        mid = (lo+hi)/2
        if cr(lch2rgb(mid, chroma_fn(mid), H), bg) < target: hi = mid
        else: lo = mid
    return lch2rgb(lo, chroma_fn(lo), H)

# ───────────────────────── the brand constants ─────────────────────────
VOID = hx('0A0E17')                    # untouchable. The brand is this colour.
H_N  = 266.5                           # measured off the original void
# Chroma rises with lightness, matching the original #0A0E17 → #161C2B slope,
# so the dark planes read as blue slate rather than grey mud.
def C_plane(L): return max(0.014, 0.0202 + 0.164*(L - 0.1643))
# Text and borders carry a quieter cast so they read neutral against colour.
def C_text(L):  return 0.010
def C_line(L):  return 0.016

# ───────────────────────── 1. PLANES ─────────────────────────
# TARGET: each plane clears 1.22:1 against the one beneath it — the point at
# which an edge becomes perceptible without needing a border to draw it.
PLANE_STEP = 1.22
# THREE planes, never four. Constitution Law: "Three layers, no deeper."
# Modals do not get a fourth plane — they sit on `elevated` above a scrim.
surface  = solve_lighter(PLANE_STEP, VOID,    C_plane, H_N)
elevated = solve_lighter(PLANE_STEP, surface, C_plane, H_N)
planes = {'void': VOID, 'surface': surface, 'elevated': elevated}
LIGHTEST = elevated
scrim = 'rgba(5, 7, 12, 0.72)'   # behind modals, so `elevated` still reads as raised

# ───────────────────────── 2. TEXT ─────────────────────────
# TARGET: solved against the LIGHTEST plane, so one tier is legible everywhere.
# This is the change that matters — the old tiers were only ever checked on void.
# t1 is PINNED to brand white and therefore has no target — it lands wherever
# #FAFAFA lands (12.28:1 on the lightest plane, comfortably AAA). The solved
# targets below apply to t2–t4.
TEXT_TARGETS = {'t2': 8.0, 't3': 5.5, 't4': 4.5}
text = {k: solve_lighter(v, LIGHTEST, C_text, H_N) for k, v in TEXT_TARGETS.items()}
text = {'t1': hx('FAFAFA'), **text}   # brand white, pinned. 18.5:1 on void.
# t5 is RETIRED as a text tier. Nothing readable may live below t4.

# ───────────────────────── 3. LINES ─────────────────────────
# TARGET: interactive boundaries clear WCAG 1.4.11 (3:1) on every plane.
LINE_TARGETS = {'hairline': 1.7, 'default': 2.4, 'interactive': 3.1, 'emphasis': 4.6}
line = {k: solve_lighter(v, LIGHTEST, C_line, H_N) for k, v in LINE_TARGETS.items()}

# ───────────────────────── 4. ACCENTS ─────────────────────────
# Hue and chroma preserved exactly. Only lightness moves, and only when the
# colour fails 4.5:1 on the lightest plane.
ACCENTS_OLD = {
    'teal':'15C17B', 'teal-bright':'3DFFCD', 'amber':'FFB800',
    'amber-warm':'FFB347', 'stellar':'5B8DEF', 'emerald':'00FF88',
    'violet':'9B5DE5', 'crimson':'FF3366', 'azure':'4D9FFF', 'magenta':'FF00AA',
}
# 'cyan' deliberately excluded from the loop above: legacy cyan (#00D4FF) was
# retired product-wide, SF-II settled decision #3, already shipped before
# this package existed. `sf-cyan` is aliased to teal below rather than
# deleted outright, so a lingering `text-sf-cyan`/`bg-sf-cyan` reference
# degrades to the current brand colour instead of silently losing all
# styling. Do not re-add cyan as a distinct solved hue.
# TWO STOPS per accent, which is what keeps the brand intact:
#   X        the canonical hue. Fills, 1px borders, icons. Must clear 3.0:1
#            (WCAG 1.4.11) on every plane — nudged only if it doesn't.
#   X-text   the same hue, lifted to clear 4.5:1 on the lightest plane.
#            The ONLY accent value permitted for body-size text.
accent, accent_text, accent_report = {}, {}, {}
for name, h in ACCENTS_OLD.items():
    old = hx(h)
    L, C, H = rgb2lch(old)
    keep_c = lambda _l, c=C: c
    base  = old if cr(old, LIGHTEST) >= 3.05 else solve_lighter(3.05, LIGHTEST, keep_c, H)
    astxt = old if cr(old, LIGHTEST) >= 4.55 else solve_lighter(4.55, LIGHTEST, keep_c, H)
    accent[name], accent_text[name] = base, astxt
    accent_report[name] = (tohex(old), tohex(base), tohex(astxt),
                           cr(old, LIGHTEST), cr(base, LIGHTEST), cr(astxt, LIGHTEST))

# Retired: cyan aliases to teal, not solved independently. Inserted after the
# main loop so it automatically flows through on-accent/fill-capability below
# exactly like any other accent, rather than needing a second code path.
accent['cyan'] = accent['teal']
accent_text['cyan'] = accent_text['teal']
accent_report['cyan'] = (tohex(hx('00D4FF')), tohex(accent['teal']), tohex(accent_text['teal']),
                          cr(hx('00D4FF'), LIGHTEST), cr(accent['teal'], LIGHTEST), cr(accent_text['teal'], LIGHTEST))

# ───────────────────────── 5. ON-ACCENT LABELS ─────────────────────────
# The text colour that sits ON a filled accent button. Solved, not guessed.
# An accent may only be a FILLED button if a label clears 4.5:1 on it. With an
# ink label all eleven do (violet is the tightest at 4.65:1), but the flag is
# computed rather than assumed — change a hue and this tells you immediately.
on_accent, fill_capable = {}, {}
INK, PAPER = hx('0B0F18'), hx('FFFFFF')   # near-void, and pure white
for name, rgb in accent.items():
    best = INK if cr(INK, rgb) >= cr(PAPER, rgb) else PAPER
    on_accent[name]    = best
    fill_capable[name] = cr(best, rgb) >= 4.5

# ───────────────────────── 6. STATES ─────────────────────────
# Disabled is a COLOUR, never opacity. Opacity multiplies against whatever is
# behind it, so an opacity-based disabled state has no guaranteed contrast.
disabled_bg   = solve_lighter(1.12, VOID, C_plane, H_N)
disabled_line = solve_lighter(1.9, LIGHTEST, C_line, H_N)
disabled_text = solve_lighter(3.0, LIGHTEST, C_text, H_N)
focus         = accent['teal-bright']
selection_bg  = solve_darker(4.6, hx('FAFAFA'), lambda _l: 0.08, 200.0)

# ───────────────────────── REPORT ─────────────────────────
names = list(planes)
def row(v):
    rs = [cr(v, planes[p]) for p in names]
    return " / ".join(f"{r:5.2f}" for r in rs), min(rs)

print("PLANES — each clears %.2f:1 against the plane below" % PLANE_STEP)
prev = None
for n in names:
    d = f"  step {cr(planes[n], prev):.2f}:1" if prev else "  (base — brand colour, unchanged)"
    print(f"  {n:9s} {tohex(planes[n])}{d}")
    prev = planes[n]
print(f"  full range void→elevated: {cr(VOID, elevated):.2f}:1")
print(f"  modal scrim: {scrim}")

print("\nTEXT — ratio on void / surface / elevated")
for k in ['t1','t2','t3','t4']:
    s, w = row(text[k]); print(f"  {k}  {tohex(text[k])}  {s}   worst {w:5.2f}:1")
print("  t5   RETIRED — no readable text below t4")

print("\nLINES — ratio on void / surface / elevated")
for k in ['hairline','default','interactive','emphasis']:
    s, w = row(line[k])
    gate = "≥3.0 required (WCAG 1.4.11)" if k in ('interactive','emphasis') else "decorative"
    print(f"  {k:12s} {tohex(line[k])}  {s}   worst {w:5.2f}:1   {gate}")

print("\nACCENTS — base (fills/borders/icons, needs ≥3.0) + -text (body text, needs ≥4.5)")
print(f"  {'':12s} {'canonical':9s}  {'base':9s} worst   {'-text':9s} worst")
for name, (o, b, t, co, cb, ct) in accent_report.items():
    _, wb = row(accent[name]); _, wt = row(accent_text[name])
    tag = '' if b == o else '  ← nudged'
    print(f"  {name:12s} {o}  {b} {wb:5.2f}   {t} {wt:5.2f}{tag}")

print("\nFILL CAPABILITY — can this accent carry a solid button?")
for name in accent:
    r = cr(on_accent[name], accent[name])
    print(f"  {name:12s} label {tohex(on_accent[name])}  {r:5.2f}:1   "
          f"{'FILL OK' if fill_capable[name] else 'OUTLINE / TINT ONLY'}")

print("\nSTATES")
print(f"  disabled bg    {tohex(disabled_bg)}    vs void {cr(disabled_bg, VOID):.2f}:1")
print(f"  disabled line  {tohex(disabled_line)}  worst {row(disabled_line)[1]:.2f}:1")
print(f"  disabled text  {tohex(disabled_text)}  on disabled bg {cr(disabled_text, disabled_bg):.2f}:1")
print(f"  focus ring     {tohex(focus)}  worst vs any plane {row(focus)[1]:.2f}:1")
print(f"  selection bg   {tohex(selection_bg)}  vs #FAFAFA {cr(selection_bg, hx('FAFAFA')):.2f}:1")

payload = {
    'planes':    {k: tohex(v) for k, v in planes.items()},
    'text':      {k: tohex(v) for k, v in text.items()},
    'line':      {k: tohex(v) for k, v in line.items()},
    'accent':      {k: tohex(v) for k, v in accent.items()},
    'accent_text': {k: tohex(v) for k, v in accent_text.items()},
    'scrim': scrim,
    'on_accent': {k: tohex(v) for k, v in on_accent.items()},
    'fill_capable': fill_capable,
    'state': {'disabled_bg': tohex(disabled_bg), 'disabled_line': tohex(disabled_line),
              'disabled_text': tohex(disabled_text), 'focus': tohex(focus),
              'selection_bg': tohex(selection_bg)},
}
(OUT / 'palette.json').write_text(json.dumps(payload, indent=2))
print("\nwrote palette.json")

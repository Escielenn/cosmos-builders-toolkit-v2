import json, pathlib
HERE = pathlib.Path(__file__).parent
P = json.loads((HERE / 'palette.json').read_text())
pl,tx,ln,ac,at,on,st = P['planes'],P['text'],P['line'],P['accent'],P['accent_text'],P['on_accent'],P['state']

OLD = dict(void='#0A0E17', surface='#0E1320', elevated='#161C2B',
           t1='#FAFAFA', t2='#C8C8C8', t3='rgba(255,255,255,0.45)',
           t4='rgba(255,255,255,0.28)', t5='rgba(255,255,255,0.15)',
           border='rgba(255,255,255,0.08)', borderStrong='rgba(255,255,255,0.14)')

def panel(new):
    v = dict(void=pl['void'], surface=pl['surface'], elevated=pl['elevated'],
             t1=tx['t1'], t2=tx['t2'], t3=tx['t3'], t4=tx['t4'], t5=tx['t4'],
             border=ln['default'], borderStrong=ln['interactive']) if new else OLD
    tealTxt = at['teal'] if new else '#15C17B'
    crimTxt = at['crimson'] if new else '#FF3366'
    onTeal  = on['teal'] if new else '#08110C'
    focus   = st['focus']
    eyebrow = ('font-size:12px;letter-spacing:0.12em;font-weight:600'
               if new else 'font-size:11px;letter-spacing:0.18em;font-weight:500')
    body    = 'font-size:16px;line-height:1.6' if new else 'font-size:15px;line-height:1.55'
    pad     = '14px 24px' if new else '12px 22px'
    minh    = 'min-height:44px;' if new else ''
    disabled = (f"background:{st['disabled_bg']};border-color:{st['disabled_line']};color:{st['disabled_text']}"
                if new else "opacity:0.4;background:#15C17B;border-color:#15C17B;color:#08110C")
    grain = 'opacity:.03'
    return f"""
<section class="pane" style="background:{v['void']}">
  <header class="tag">{'AFTER — derived' if new else 'BEFORE — shipping today'}</header>
  <div class="body">

    <div style="{eyebrow};text-transform:uppercase;color:{v['t4']};font-family:ui-monospace,monospace">// 02 · WORLD SURVEY</div>
    <h2 style="font-size:34px;font-weight:300;color:{v['t1']};margin:10px 0 6px;letter-spacing:.02em">Genesis: Planetary Profile</h2>
    <p style="{body};color:{v['t2']};margin:0 0 22px;max-width:52ch">Define your world's stellar environment, physical characteristics, and the narrative pressures that shape life.</p>

    <div class="card" style="background:{v['surface']};border:1px solid {v['border']}">
      <div style="{eyebrow};text-transform:uppercase;color:{v['t4']};font-family:ui-monospace,monospace">SURFACE CONDITIONS</div>
      <div class="kv">
        <span style="font-family:ui-monospace,monospace;font-size:13px;color:{v['t3']}">SURFACE GRAVITY</span>
        <span style="font-family:ui-monospace,monospace;font-size:13px;color:{tealTxt}">1.40 g</span>
      </div>
      <div class="kv" style="border-top:1px solid {v['border']}">
        <span style="font-family:ui-monospace,monospace;font-size:13px;color:{v['t3']}">DAY LENGTH</span>
        <span style="font-family:ui-monospace,monospace;font-size:13px;color:{v['t2']}">TIDALLY LOCKED</span>
      </div>
      <div class="kv" style="border-top:1px solid {v['border']}">
        <span style="font-family:ui-monospace,monospace;font-size:13px;color:{v['t3']}">ATMOSPHERE</span>
        <span style="font-family:ui-monospace,monospace;font-size:13px;color:{v['t2']}">0.6 bar</span>
      </div>
      <p style="font-size:13px;color:{v['t5']};margin:14px 0 0;font-family:ui-monospace,monospace">// PROJECTED · NOT CANON</p>
    </div>

    <div class="card" style="background:{v['elevated']};border:1px solid {v['border']};margin-top:14px">
      <div style="{eyebrow};text-transform:uppercase;color:{v['t4']};font-family:ui-monospace,monospace">ELEVATED PANEL</div>
      <p style="{body};color:{v['t2']};margin:8px 0 0">This sits one layer above the card behind it.</p>
    </div>

    <label style="display:block;margin:22px 0 7px;{eyebrow};text-transform:uppercase;color:{v['t4']};font-family:ui-monospace,monospace">PLANET NAME</label>
    <input value="" placeholder="Enter designation"
      style="width:100%;{minh}padding:11px 14px;background:{v['surface']};border:1px solid {v['borderStrong']};color:{v['t1']};border-radius:0;font-size:16px;font-family:inherit">

    <div class="row">
      <button style="{minh}padding:{pad};background:{'#15C17B' if not new else ac['teal']};border:1px solid {'#15C17B' if not new else ac['teal']};color:{onTeal};border-radius:0;text-transform:uppercase;letter-spacing:1.2px;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer">Save Draft</button>
      <button style="{minh}padding:{pad};background:transparent;border:1px solid {v['borderStrong']};color:{v['t1']};border-radius:0;text-transform:uppercase;letter-spacing:1.2px;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer">Export</button>
      <button style="{minh}padding:{pad};border:1px solid;border-radius:0;text-transform:uppercase;letter-spacing:1.2px;font-size:13px;font-weight:500;font-family:inherit;{disabled}">Publish</button>
    </div>

    <div class="row" style="margin-top:12px">
      <button class="focusdemo" style="{minh}padding:{pad};background:transparent;border:1px solid {v['borderStrong']};color:{v['t1']};border-radius:0;text-transform:uppercase;letter-spacing:1.2px;font-size:13px;font-weight:500;font-family:inherit;{'outline:2px solid '+focus+';outline-offset:2px' if new else ''}">{'Focused' if new else 'Focused (no ring)'}</button>
      <span style="align-self:center;font-size:13px;color:{crimTxt};font-family:ui-monospace,monospace">PARAMETERS OUTSIDE RANGE</span>
    </div>

    <div style="margin-top:22px;height:1px;background:{v['border']}"></div>
    <p style="font-size:12px;color:{v['t5']};margin:12px 0 0;font-family:ui-monospace,monospace;letter-spacing:{'0.10em' if new else '0.18em'}">39.87°N · 104.97°W · JD 2461268.583</p>
  </div>
  <div class="grain" style="{grain}"></div>
</section>"""

def swatches():
    rows=""
    for name in ac:
        rows += f"""<tr>
          <td class="n">{name}</td>
          <td><span class="sw" style="background:{ac[name]}"></span><code>{ac[name]}</code></td>
          <td><span class="sw" style="background:{at[name]}"></span><code>{at[name]}</code></td>
          <td><span class="chip" style="background:{ac[name]};color:{on[name]}">Button</span></td>
        </tr>"""
    return rows

html = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>StellarForge — Legibility: before / after</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *{{box-sizing:border-box}}
  body{{margin:0;background:#05070C;color:#C9CDD3;font-family:'DM Sans',system-ui,sans-serif;font-size:16px;line-height:1.6}}
  .wrap{{max-width:1280px;margin:0 auto;padding:40px 24px 80px}}
  h1{{font-size:30px;font-weight:400;color:#FAFAFA;letter-spacing:.02em;margin:0 0 6px}}
  .lede{{max-width:70ch;color:#A7AAB0;margin:0 0 34px}}
  .split{{display:grid;grid-template-columns:1fr 1fr;gap:22px}}
  @media(max-width:940px){{.split{{grid-template-columns:1fr}}}}
  .pane{{position:relative;border:1px solid #3A4258;overflow:hidden}}
  .tag{{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;
        padding:9px 16px;background:#141A28;color:#A7AAB0;border-bottom:1px solid #3A4258}}
  .body{{padding:28px 26px 30px;position:relative;z-index:2}}
  .card{{padding:18px 20px}}
  .kv{{display:flex;justify-content:space-between;padding:9px 0}}
  .row{{display:flex;gap:12px;margin-top:20px;flex-wrap:wrap}}
  .grain{{position:absolute;inset:0;z-index:1;pointer-events:none;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}}
  table{{width:100%;border-collapse:collapse;margin-top:14px;font-size:14px}}
  th{{text-align:left;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.12em;
     text-transform:uppercase;color:#9799A0;font-weight:500;padding:8px 10px;border-bottom:1px solid #3A4258}}
  td{{padding:8px 10px;border-bottom:1px solid #232A3A;vertical-align:middle}}
  td.n{{font-family:'JetBrains Mono',monospace;color:#C9CDD3}}
  code{{font-family:'JetBrains Mono',monospace;font-size:12px;color:#A7AAB0}}
  .sw{{display:inline-block;width:15px;height:15px;margin-right:9px;vertical-align:-3px;border:1px solid #3A4258}}
  .chip{{display:inline-block;padding:6px 14px;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:.08em}}
  h2.sec{{font-size:20px;font-weight:500;color:#FAFAFA;margin:48px 0 4px}}
  .note{{max-width:74ch;color:#A7AAB0;margin:0}}
  .ratio{{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:12px;margin-top:16px}}
  .rc{{border:1px solid #3A4258;padding:14px 16px;background:#0F1420}}
  .rc .lbl{{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9799A0}}
  .rc .was{{color:#FF658B;font-family:'JetBrains Mono',monospace;font-size:20px}}
  .rc .now{{color:#3DFFCD;font-family:'JetBrains Mono',monospace;font-size:20px}}
  .arrow{{color:#787D87;padding:0 6px}}
</style></head><body><div class="wrap">

<h1>Legibility — before / after</h1>
<p class="lede">Same layout, same copy, same brand void. The only difference is the token set.
Look at the panel edges, the button outlines, the mono eyebrows, and the disabled button.</p>

<div class="split">{panel(False)}{panel(True)}</div>

<h2 class="sec">What moved</h2>
<div class="ratio">
  <div class="rc"><div class="lbl">Panel / button border</div><span class="was">1.20:1</span><span class="arrow">→</span><span class="now">2.4–3.1:1</span></div>
  <div class="rc"><div class="lbl">Plane separation</div><span class="was">1.04:1</span><span class="arrow">→</span><span class="now">1.23:1</span></div>
  <div class="rc"><div class="lbl">Mono eyebrow (t4)</div><span class="was">2.45:1</span><span class="arrow">→</span><span class="now">4.50:1</span></div>
  <div class="rc"><div class="lbl">t5 / near-hidden</div><span class="was">1.51:1</span><span class="arrow">→</span><span class="now">retired</span></div>
  <div class="rc"><div class="lbl">Disabled button</div><span class="was">2.21:1</span><span class="arrow">→</span><span class="now">4.05:1</span></div>
  <div class="rc"><div class="lbl">Visible focus ring</div><span class="was">none</span><span class="arrow">→</span><span class="now">10.0:1</span></div>
  <div class="rc"><div class="lbl">Scrollbar thumb</div><span class="was">1.40:1</span><span class="arrow">→</span><span class="now">2.40:1</span></div>
  <div class="rc"><div class="lbl">Body / editor size</div><span class="was">15 px</span><span class="arrow">→</span><span class="now">16 / 18 px</span></div>
</div>

<h2 class="sec">Accents — every brand hue survived</h2>
<p class="note">Nothing was recoloured. Each accent now carries two stops: the canonical hue for fills,
borders and icons, and a lifted variant that is the only value legal for body-size text. The button
column proves each hue can still carry a solid label.</p>
<table>
  <thead><tr><th>Token</th><th>Canonical — fills, borders, icons</th><th>–text — body copy only</th><th>Filled</th></tr></thead>
  <tbody>{swatches()}</tbody>
</table>

<h2 class="sec">Planes</h2>
<div class="ratio">
  <div class="rc" style="background:{pl['void']}"><div class="lbl">void</div><code>{pl['void']}</code><div style="font-size:12px;color:#9799A0">unchanged — the brand</div></div>
  <div class="rc" style="background:{pl['surface']}"><div class="lbl">surface</div><code>{pl['surface']}</code><div style="font-size:12px;color:#9799A0">was #0E1320</div></div>
  <div class="rc" style="background:{pl['elevated']}"><div class="lbl">elevated</div><code>{pl['elevated']}</code><div style="font-size:12px;color:#9799A0">was #161C2B</div></div>
</div>

</div></body></html>"""
(HERE / 'legibility-proof.html').write_text(html)
print("wrote legibility-proof.html")

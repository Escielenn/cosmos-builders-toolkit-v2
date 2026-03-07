# StellarForge Aesthetic Bridge
## Bringing Simulator DNA into Tool Pages

**Scope:** Calculators, Cartographers, form-based tools, Learn pages, World Object views
**NOT scope:** Simulators (already have full aesthetic), marketing/landing pages (keep consumer-friendly)

---

## The Problem

The simulators have six distinct levels of visual loudness. The tool pages have two — maybe two and a half. Everything on a calculator page is 14–16px DM Sans in white or "muted gray." There's no whisper. A habitable zone result and a field label and a source citation all occupy the same visual plane. The page reads flat.

The simulators solve this with a strict hierarchy where non-essential information actively recedes — smaller, dimmer, wider-tracked, sometimes a different typeface entirely. This creates information *depth* without information *density*. That's what we're importing.

---

## What Migrates

### 1. MD Nichrome for Tool Titles

**Current:** Space Grotesk 600, 24–32px
**New:** MD Nichrome Test 300, 28–32px, 3–4px letter-spacing, uppercase

This is the single biggest visual unifier across the platform. When a user moves from ExoForge to the Drake Equation Calculator, the title treatment should feel like the same product. Nichrome's thin, wide letterforms at light weight create that retro-SF precision feel at any size.

```css
.tool-title {
  font-family: 'MD Nichrome Test', 'Space Grotesk', sans-serif;
  font-weight: 300;
  font-size: 28px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #FAFAFA;
}
```

**Where:** Tool page H1, modal/dialog titles, World Object names in detail views

**Where NOT:** Body headings within tool descriptions, Learn article titles (those stay DM Sans for readability), nav items, card titles in grid views (too small to be legible in Nichrome)

### 2. The Five-Tier Opacity Hierarchy

This is the real import. The simulators don't just have "bright" and "dim" — they have five distinct levels that tell you how important something is before you even read it.

```css
:root {
  --text-primary:   #FAFAFA;                       /* Tier 1: titles, results, critical info */
  --text-secondary: #C8C8C8;                       /* Tier 2: body text, descriptions */
  --text-muted:     rgba(255, 255, 255, 0.45);     /* Tier 3: field labels, column headers */
  --text-quiet:     rgba(255, 255, 255, 0.28);     /* Tier 4: helper text, units, metadata */
  --text-ghost:     rgba(255, 255, 255, 0.15);     /* Tier 5: source citations, last-updated, version */
}
```

**Note on scaling:** Simulator text-muted is 0.35 — tool pages bump this to 0.45 because the text is being read at a distance from the screen in a normal browsing context, not on a dense instrument panel. The ratios shift up slightly across the board.

#### Tier Assignments for Tool Pages

| Content Type | Tier | Opacity | Size | Example |
|---|---|---|---|---|
| Tool title | 1 — Primary | 1.0 | 28px Nichrome | `DRAKE EQUATION` |
| Result values | 1 — Primary | 1.0 | 20–24px Mono | `N = 12,000` |
| Section headings | 1 — Primary | 1.0 | 18–20px Nichrome | `PARAMETERS` |
| Body descriptions | 2 — Secondary | `#C8C8C8` | 15–16px DM Sans | "Adjust the values below..." |
| Input field content | 2 — Secondary | 0.85 | 14–15px DM Sans | User-entered text |
| Field labels | 3 — Muted | 0.45 | 11–12px DM Sans | `STAR FORMATION RATE` |
| Unit indicators | 4 — Quiet | 0.28 | 11px DM Sans | `stars / year` |
| Helper text / hints | 4 — Quiet | 0.28 | 11–12px DM Sans | "Higher values assume..." |
| Source attributions | 5 — Ghost | 0.15 | 10px DM Sans | "Data: NASA Exoplanet Archive" |
| Last updated | 5 — Ghost | 0.15 | 10px DM Sans | "Updated Jan 2026" |
| Version numbers | 5 — Ghost | 0.15 | 9px Mono | "v2.1.0" |
| Copyright/credits | 5 — Ghost | 0.12 | 9–10px DM Sans | "© 2025–2026 Jason D. Batt" |

The key insight: **tiers 4 and 5 don't exist on the current site.** Everything that should whisper is currently at tier 2–3. Adding these two bottom tiers instantly creates simulator depth.

### 3. JetBrains Mono for Numerical Outputs

**Current:** Calculated results displayed in DM Sans, same as everything else.
**New:** Any computed number, coordinate, measurement, or equation result renders in JetBrains Mono.

```css
.result-value {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
  color: var(--text-primary);
}

.result-unit {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.75em;
  color: var(--text-quiet);
  margin-left: 4px;
}
```

This creates the same instrument-readout feel the simulators have. When a user sees `4.83 × 10⁹` in mono next to `civilizations` in sans-serif, the number feels *measured*, not typed.

**Where:** Calculator results, data tables, coordinate displays, planet/star statistics, any computed value
**Where NOT:** User input fields (keep DM Sans for typing comfort), prose containing numbers, dates in body text

### 4. Green Section Dividers

**Current:** Section breaks are either invisible or a faint white line
**New:** The simulator's muted-green divider treatment, scaled up for tool pages

```css
.tool-section-header {
  font-family: 'MD Nichrome Test', 'Space Grotesk', sans-serif;
  font-weight: 300;
  font-size: 11px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(0, 229, 160, 0.35);
  border-bottom: 1px solid rgba(0, 229, 160, 0.06);
  padding-bottom: 8px;
  margin-top: 32px;
  margin-bottom: 16px;
}
```

These are the "PARAMETERS" / "RESULTS" / "METHODOLOGY" dividers within a tool page. The green tint connects them visually to the StellarForge brand without competing with the cyan interactive elements.

**Sizing note:** Simulators use 8px for these. Tool pages use 11px because they're in a normal scrolling layout, not a dense floating panel. The letter-spacing stays at 3px — that's what makes them read as structural rather than content.

### 5. Reduced Border Radius

**Current:** 12px cards, 6–8px buttons, 6px inputs
**New:** 4px cards, 3px buttons, 2px inputs

Not zero — that's the simulator's instrument-panel language, and it would feel harsh on a form page. But the current 12px is soft consumer UI. The 2–4px range feels precise without feeling hostile. It says "tool" rather than "app."

```css
/* Tool page components */
.tool-card       { border-radius: 4px; }
.tool-button     { border-radius: 3px; }
.tool-input      { border-radius: 2px; }
.tool-badge      { border-radius: 2px; }
.tool-select     { border-radius: 2px; }
.tool-modal      { border-radius: 4px; }
```

### 6. Small Uppercase Tracked Labels

The simulator's field label treatment — tiny, uppercase, letter-spaced — applied to tool page form labels, table headers, and category tags.

```css
.field-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-muted);        /* tier 3 */
  margin-bottom: 6px;
}
```

**Current site labels:** 12–14px, normal case, normal spacing, same gray as body text.
**New:** 11px, uppercase, 1.5px tracking, distinctly dimmer than body text.

This is a subtle change that has outsized impact. When a label says `STAR FORMATION RATE` in small tracked uppercase above an input field, it reads as a scientific instrument label. When it says "Star Formation Rate" in 14px regular weight, it reads as a web form.

### 7. The Glow-From-Within Badge Pattern

The simulator's status badge CSS — background at 0.06, border at 0.2, text at full — applied to tool page badges, tags, and status indicators.

```css
.tool-badge {
  display: inline-block;
  padding: 4px 10px;
  font-size: 10px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
  border-radius: 2px;
  /* Default: green (forge brand) */
  background: rgba(0, 229, 160, 0.06);
  border: 1px solid rgba(0, 229, 160, 0.15);
  color: rgba(0, 229, 160, 0.7);
}
.tool-badge.pro {
  background: rgba(255, 212, 59, 0.06);
  border-color: rgba(255, 212, 59, 0.15);
  color: rgba(255, 212, 59, 0.85);
}
.tool-badge.beta {
  background: rgba(0, 212, 255, 0.06);
  border-color: rgba(0, 212, 255, 0.15);
  color: rgba(0, 212, 255, 0.7);
}
```

**Where:** "Pro" badges on tool cards, "Beta" indicators, category tags, habitability results, any small status/label element

---

## What Does NOT Migrate

| Simulator Element | Why It Stays in Simulators |
|---|---|
| Zero border-radius | Too harsh for form-based pages. 2–4px is the tool compromise. |
| 7–8px text sizes | Too small for normal reading distance. Tool minimum is 9px (ghost tier only). |
| Glass-morphism floating panels | Tools use standard scrolling page layout, not floating overlays. |
| `backdrop-filter: blur()` | Expensive, unnecessary without a canvas behind the UI. |
| Transport controls | Specific to time-based simulations. |
| Canvas rendering specs | Tools don't have full-viewport canvas elements. |
| 3px scrollbar styling | Nice but low priority — can be added later as a polish pass. |
| Ultra-dense spacing (8px margins) | Tools need breathing room. Keep 16–32px margins. |

---

## Font Loading for Tool Pages

Tool pages need to load Nichrome and Mono in addition to the existing fonts:

```html
<!-- Existing -->
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">

<!-- New additions -->
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet">
<link href="https://fonts.cdnfonts.com/css/md-nichrome-test" rel="stylesheet">
```

If loading all three at once on every page is a performance concern, lazy-load Nichrome and Mono — they're only needed after the page shell renders:

```html
<link rel="preload" href="https://fonts.cdnfonts.com/css/md-nichrome-test" as="style" onload="this.onload=null;this.rel='stylesheet'">
```

---

## Dual Accent on Tool Pages

The simulator's cyan/green split applies to tools with one adjustment:

**Cyan (#00D4FF)** — Interactive elements
- Primary CTA buttons (filled cyan background — KEEP from current site)
- Active/selected states
- Input focus borders
- Links within tool context

**Green (#00E5A0)** — Structural/brand elements
- Section dividers (muted green text + border)
- Tool page subtitle ("STELLARFORGE.TOOLS" or category)
- Badge default color
- Hover glow on secondary buttons

**Note:** The current site uses cyan for *everything* — buttons, links, headings, badges. The partial integration introduces green only for structural elements. Primary CTAs stay cyan. This is a softer transition than the simulators' full dual-accent system.

---

## Concrete Application: Calculator Tool Page

Here's how a calculator (e.g., Drake Equation) looks before and after:

### Before (Current)
```
[Space Grotesk 32px bold]  Drake Equation Calculator
[DM Sans 16px gray]       Estimate the number of civilizations...

[DM Sans 14px white]      Star Formation Rate
[input field, 12px radius]
[DM Sans 14px gray]       The rate at which new stars form in our galaxy

[DM Sans 14px white]      Fraction with Planets
[input field, 12px radius]

...

[DM Sans 20px cyan]       Result: N = 12,000
[DM Sans 14px gray]       Based on current parameter values
```

### After (Partial Integration)
```
[Nichrome 300 28px white, 3px tracking]    DRAKE EQUATION
[Nichrome 300 11px green, 3px tracking]    STELLARFORGE.TOOLS · CALCULATOR

[Nichrome 300 11px green, 3px tracking]    ── PARAMETERS ──────────────
[DM Sans 500 11px muted, 1.5px tracking]   STAR FORMATION RATE
[input field, 2px radius]
[DM Sans 400 11px quiet]                   stars / year · higher values assume active formation
[DM Sans 400 10px ghost]                   Default: 1.5 (Conselice et al. 2016)

[DM Sans 500 11px muted, 1.5px tracking]   FRACTION WITH PLANETS
[input field, 2px radius]
[DM Sans 400 11px quiet]                   Current exoplanet surveys suggest fp ≈ 1.0

...

[Nichrome 300 11px green, 3px tracking]    ── RESULTS ─────────────────
[JetBrains Mono 500 24px white]            N = 12,000
[DM Sans 400 12px quiet]                   estimated communicating civilizations
[DM Sans 400 10px ghost]                   Based on current parameter values · Last computed Feb 2026
```

The information hierarchy is now five tiers deep. The title whispers "instrument." The section dividers orient. The labels step back. The units and helper text recede further. The source citations practically disappear unless you look for them. But the result itself — `N = 12,000` in JetBrains Mono — punches through everything.

---

## Implementation Priority

| Priority | Element | Impact | Effort |
|---|---|---|---|
| **1** | Opacity hierarchy (CSS variables) | Massive — transforms every page | Low — CSS-only |
| **2** | MD Nichrome for tool titles | High — visual unifier | Low — font swap |
| **3** | Small uppercase tracked labels | High — biggest "simulator feel" import | Medium — touch every form |
| **4** | JetBrains Mono for results | High — instant instrument quality | Low — targeted swap |
| **5** | Green section dividers | Medium — structural clarity | Low — new component |
| **6** | Reduced border-radius (12→4) | Medium — precision feel | Medium — find/replace |
| **7** | Glow-from-within badges | Low–Medium — polish | Low — CSS pattern |

Priority 1–4 can be done as a single Tailwind/CSS pass. Priority 5–7 are component-level updates.

---

## Migration Instructions for Claude Code

When updating an existing tool page, follow this order:

1. **Add font imports** (Nichrome + JetBrains Mono) if not already present
2. **Add CSS custom properties** for the five opacity tiers
3. **Swap tool title** to Nichrome 300 uppercase with 3px tracking
4. **Add subtitle** below title: tool category in Nichrome 300, green, 11px
5. **Replace form labels** with small uppercase tracked treatment (11px, 1.5px tracking, muted)
6. **Add helper text** below inputs as tier 4 (quiet) — units, ranges, context
7. **Add source citations** as tier 5 (ghost) — data sources, methodology references
8. **Swap result values** to JetBrains Mono
9. **Add result units** as separate tier 4 span
10. **Insert section dividers** (green Nichrome) between logical groups
11. **Reduce border-radius** on cards, buttons, inputs
12. **Update badges** to glow-from-within pattern

**Do NOT:**
- Change body text size (keep 15–16px for readability)
- Make inputs smaller than 14px font-size (accessibility)
- Remove padding/margins to match simulator density
- Use zero border-radius on tool page components
- Apply `backdrop-filter` to non-simulator panels
- Make anything smaller than 9px

---

## Quick Reference: Site vs Simulator vs Tool (Bridge)

| Element | Marketing Site | Tool Pages (Bridge) | Simulators |
|---|---|---|---|
| **Title font** | Space Grotesk 300 | **MD Nichrome 300** | MD Nichrome 300 |
| **Title size** | 36–72px | 28–32px | 28px |
| **Body font** | DM Sans 16px | DM Sans 15–16px | DM Sans 9–10px |
| **Label size** | 12–14px | **11px uppercase tracked** | 8–8.5px uppercase tracked |
| **Data font** | DM Sans | **JetBrains Mono** | JetBrains Mono |
| **Border radius** | 8–12px | **2–4px** | 0px |
| **Opacity tiers** | ~2 (white + gray) | **5 tiers** | 6+ tiers |
| **Section color** | white/cyan | **muted green** | muted green |
| **Accent system** | Cyan only | **Cyan primary + green structural** | Full dual accent |
| **Smallest text** | 12px | **9px (ghost only)** | 7px |
| **Panel style** | Solid cards | Solid cards (sharper) | Glass-morphism float |
| **Helper text** | Same as body | **Tier 4 quiet** | Tier 4–5 |
| **Source citations** | Rarely shown | **Tier 5 ghost** | Tier 5 ghost |

---

*The tools should feel like they were built by the same people who built the simulators — just for a different context.*

© 2025–2026 Jason D. Batt, Ph.D. · StellarForge.tools

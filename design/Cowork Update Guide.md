# StellarForge — Cowork Update Guide

> How to update, extend, and keep every artifact in this project consistent.
> Written for Claude (cowork/Code) sessions. Read this FIRST before touching any file.
> Last full refresh: **2026-07-09** — all dates re-anchored to the **August 11, 2026** launch.

---

## 1. Project Map — what each file is

| File | What it is | Edit directly? |
|---|---|---|
| `shared.css` | **Ground truth for all design tokens** (colors, fonts, tracking, panels, tags, scrollbars, starfield/grain). Every page imports it. | Yes — but changes ripple everywhere |
| `Index.html` | **Mission index** — entry point linking every artifact in three groups (Product / Campaign / System). Add new artifacts here. | Yes |
| `Style Guide.html` | The living style guide (17 sections). Shell + scroll-spy nav. | Yes (shell only) |
| `sg-sections.js` / `sg-sections-p2.js` / `sg-sections-p3.js` | Style-guide section content as JS template strings, injected into `#sgSections`. p3 splices Ambient Telemetry + Scrollbars *before* the dosdonts section. | Yes — this is where guide content lives |
| `Campaign.html` | Campaign hub shell. Loads React 18 + Babel, then `components/*.jsx`. **No content lives here.** | Rarely |
| `components/Primitives.jsx` | Shared React components (Cube, Wordmark, StatusPill, SectionHeader, StatCard…). Exported via `Object.assign(window, {...})`. | Yes |
| `components/S1_Strategy.jsx` | Sector 01 (brief, KPIs, phases) + Sector 02 (3 creative directions) + Sector 02.5 (Promotional Drops: boarding pass, mission patch, zero-G certificate). | Yes |
| `components/S2_Calendar.jsx` | Launch-week day-by-day calendar. | Yes |
| `components/S3_Social.jsx` | Social mockups (IG squares/carousel, X, LinkedIn, Reddit). | Yes |
| `components/S4_Extras.jsx` | Emails, ad creatives, video storyboards, press kit. | Yes |
| `components/Hub.jsx` | Hub assembly: SECTIONS array, sidebar nav, top bar. Renders into `#root`. **Add new sectors here.** | Yes |
| `Landing Page.html` | Public waitlist page. Self-contained. | Yes |
| `Pitch Deck.html` | Internal deck on `deck-stage.js` (11 `<section>` slides). | Yes |
| `Operating Plan.html` | The locked plan: Gantt, channels, budget, KPIs, risks, checklist. Self-contained. | Yes |
| `Home.html` | Product concept A — "Bridge" cockpit dashboard (kept as alternate). | Yes |
| `Home (Writers).html` | Product concept B — warm writer studio (current direction). Pre-warmth backup lives in `archive/`. | Yes |
| `Writing.html` | Scrivener-style manuscript editor: binder tree, pin bar, @mention picker, inspector. | Yes |
| `deck-stage.js` | Deck shell component (starter). | No |
| `design_handoff/` | Frozen dev-handoff bundle (README, tailwind.config.ts, tokens.css, reference components, screenshots). | Regenerate, don't hand-edit |
| `Cowork Implementation Guide.md` | Instructions for building these designs into the production codebase. Companion to this file. | Yes |
| `archive/` | Superseded versions kept for reference. | No |
| `downloads/` | Compiled standalone bundles. **Never edit** — rebuild from sources. | Never |

---

## 2. Golden rules

1. **Tokens come from `shared.css`.** Never hardcode a hex that exists as a token. Palette: teal `#15C17B` (primary), teal-bright `#3DFFCD` (glow only), amber `#FFB800`, stellar `#5B8DEF`, violet `#9B5DE5`, cyan `#00D4FF`, crimson `#FF3366`. Text tiers `--t1`…`--t5`.
2. **Zero border-radius** on containers. Only tags (2px) and avatars/dots (round) are exceptions.
3. **Fonts have strict roles.** MD Nichrome (`--font-display`) = H1/hero only. Jura = section headers/nav. DM Sans = body + ALL buttons. JetBrains Mono = data/coordinates/labels only. **Lora (serif, italic) is the "writer warmth" voice** used on Home (Writers) and Writing — never on the campaign/ops artifacts.
4. **Two voice registers.** Campaign + product-cockpit artifacts use Ship's Voice–adjacent mono labels (`// SECTOR 01`). Writer-facing surfaces (Home (Writers), Writing) use softened labels — no `//` prefixes, no ALL-CAPS mono, italic serif meta instead. Don't mix registers within a page.
5. **Big revisions = copy first** (`Foo v2.html`), targeted tweaks = edit in place.
6. **Campaign content lives in `components/*.jsx`,** not `Campaign.html`. Each jsx file ends with `Object.assign(window, {...})` — keep that, files don't share scope otherwise.
7. **New artifact? Add a card to `Index.html`** so everything stays one hop away. Cross-links: Operating Plan and Style Guide link back to the Index; keep that pattern.

---

## 3. Changing the launch date (the most common update)

The launch date appears in **8 files** in many formats. Current anchor: **Tue Aug 11, 2026**.

Formats to search for (replace ALL of them):
- `AUG 11`, `August 11`, `2026.08.11`, `2026-08-11`, `08.11`, `08<br/>11<br/>26` (boarding-pass stub), `BOARDING-0811` / `BOARD-0811` (clearance codes)
- Countdown chips: `T-33 DAYS` in `components/Hub.jsx` + `S1_Strategy.jsx`, `T-MINUS <span>33</span>` in `Landing Page.html` → recompute days from today
- Phase ranges in `S1_Strategy.jsx` + `Pitch Deck.html`: SIGNAL `JUL 13 → AUG 03`, IGNITE `AUG 04 → AUG 10`, IGNITION `AUG 11 → AUG 18`, ORBIT `AUG 19 →`
- `Operating Plan.html`: 9 Gantt week headers (`Jul 13, Jul 20, Jul 27, Aug 03, Aug 11, Aug 17, Aug 24, Aug 31, Sep 07`), phase-card dates, KPI deadlines (`EOD Aug 8`, `by Sep 6`), checklist due dates, go/no-go gate (`Aug 5`)
- `S2_Calendar.jsx`: 11 day rows `TUE · AUG 04` … `MON · AUG 17 →` — **day-of-week labels must match the real calendar**, and re-sanity-check the content of each row still makes sense on its new weekday (e.g. "light posting day" should land on a weekend)
- KPI horizon dates: `SEP 30` (signups goal), `2026.09.30` (zero-G draw)

**Procedure:** do it as one scripted find/replace pass (longest strings first to avoid substring collisions — e.g. replace `Jun 28` before `Jun 2`). Then reload each page and eyeball the Gantt, calendar, and hero chips.

---

## 4. After any content change — rebuild derived artifacts

1. **Standalone bundles**: re-run the single-file bundler on `Campaign.html` → `downloads/StellarForge-Campaign.html` and `Style Guide.html` → `downloads/StellarForge-Style-Guide.html`. Both source files already contain the required `<template id="__bundler_thumbnail">`. A warning about asset `%23n` is a false positive (SVG filter anchor) — ignore it.
2. **design_handoff/**: if tokens or components changed, update `design_handoff/tokens.css` + `tailwind.config.ts` to match `shared.css`, and re-copy changed sources into `design_handoff/source/`. The README's token tables must agree with `shared.css` — that file wins any conflict.

---

## 5. Page-specific notes

**Campaign hub** — to add a sector: write the section component in an `S*.jsx` file, export to `window`, add one entry to `SECTIONS` in `Hub.jsx` (id, label, code, Comp, accent). Sectors render one-at-a-time via sidebar.

**Style Guide** — sections are HTML strings pushed to `parts[]`. p1 = foundations (00–05), p2 = components/brand (06–14 + dosdonts), p3 = ambient telemetry + scrollbars (spliced before dosdonts). New sections: add to p3's `parts`, add a nav `<a href="#id">` in `Style Guide.html`, keep numbering. Cache-bust script tags (`?v=N`) when editing the JS files.

**Writing.html** — the @mention picker: entity data in the `ENTITIES` array, categories in `CATS`. Entity refs are `<a class="ref-{cat}">` with colored dotted underlines (char=stellar, loc=teal, gloss=violet, scene=amber, cult=amber-warm, thing=cyan). Chrome is responsive: crumbs hide < 1180/980px. Editor is `contenteditable`; picker opens on `@`, Tab cycles categories, Enter inserts, ≥2 chars enables create-new.

**Home (Writers).html** — the warm register. If adding modules, follow: Lora italic headings, sentence-case labels, no `//` prefixes, glowing status dots kept (user loves them), ambient telemetry only in the single footer strip.

**Operating Plan** — statuses in the checklist (`todo/draft/review/ready` classes + `done` row class) should be updated as work completes. The risk register's Clerk row is the launch gate: public date stays unannounced until the soft-launch gate clears.

**Landing Page** — the form is a visual stub (`onsubmit` fakes success). Real ESP wiring is a dev task; note it in any handoff.

**Never use `scrollIntoView`** in new scripts (breaks the host app); scroll containers via `scrollTop`.

---

## 6. Verification checklist (run after every editing session)

- [ ] Open each touched page — zero console errors
- [ ] Campaign hub: click through all 9 sectors (S1–S4 render via Babel; a syntax error in ANY jsx blanks the whole hub)
- [ ] Dates: grep for the OLD anchor date across the repo — should return zero hits
- [ ] Countdown chips match real days-until-launch
- [ ] Bundles in `downloads/` rebuilt and newer than their sources
- [ ] Writer pages still in the warm register; campaign pages still in the mono register

---

*Ground truth hierarchy: `shared.css` → `Style Guide.html` → everything else. When docs disagree, that's the order of authority.*

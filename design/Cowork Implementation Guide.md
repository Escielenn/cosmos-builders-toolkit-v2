# StellarForge — Cowork Implementation Guide

> How to fully implement every design in this project into the real codebase
> (**Vite + React + TypeScript + Tailwind + Supabase + Clerk + Stripe**, repo: `cosmos-builders-toolkit-v2`).
> The HTML files here are **design references, not production code** — recreate them idiomatically.
>
> **Doc hierarchy:** this guide = *build it into the product* · `Cowork Update Guide.md` = *maintain these design artifacts* · `design_handoff/README.md` = *tokens + primitive components install* (do that FIRST).

---

## 0. Order of operations

1. **Foundations** — follow `design_handoff/README.md` install steps: `tokens.css`, `tailwind.config.ts`, fonts (MD Nichrome woff2 + Google fonts incl. **Lora**), `StellarBackground` (starfield + grain), scrollbar classes. Everything below assumes those exist.
2. **Landing / waitlist page** (public, ships first — campaign needs it by Jul 15)
3. **Studio Home** (logged-in home, writer register)
4. **Manuscript editor** (binder, pins, @mentions, inspector)
5. **Ambient telemetry + polish** (velocity dial, footer strips, easter eggs)

One PR per phase. Reference file for each is listed below — open it in a browser next to the code.

---

## 1. Two visual registers — pick correctly per surface

| | **Mono register** (marketing, dashboards, settings) | **Writer register** (home, editor, anything a writer reads/writes in) |
|---|---|---|
| Reference | `Landing Page.html`, `Campaign.html` | `Home (Writers).html`, `Writing.html` |
| Headings | MD Nichrome caps / Jura tracked | **Lora italic**, sentence case |
| Labels | JetBrains Mono, `// PREFIX`, ALL-CAPS, tracked | Lora italic or DM Sans small-caps, no `//` |
| Meta text | `T-33 DAYS`, coordinates, telemetry | "yesterday, 22:14" · "1,402 words yesterday" |
| Buttons | Uppercase, 0.12em tracking | Sentence case, 0.04em tracking |
| Shared by both | Zero radius · token palette · glowing status dots · 1px `--sf-border` hairlines · dark void background |

Rule of thumb: if the user is *operating the ship* → mono; if the user is *writing their book* → writer. Never mix on one page.

---

## 2. Landing / Waitlist page — `Landing Page.html`

Route: `/early` (public, no auth). Components: `LandingHero`, `ManifestPanel`, `StatStrip`, `ToolGrid`, `WaitlistForm`.

- **Hero**: eyebrow rule + mono label, MD Nichrome ~68px headline with teal + stellar-italic accent words, two-paragraph sub (t2 then t3).
- **ManifestPanel** (right): `sf-panel` with glow underline; `<dl>` rows LABEL(mono t3) / VALUE(mono, accent-colored per row); tagline quote at bottom.
- **WaitlistForm**: single email field + submit in one bordered flex row, zero radius, mono uppercase placeholder. **Wire to real backend**: insert into Supabase `waitlist` table + trigger confirmation email (Resend/Loops). On success swap button label to `SIGNAL RECEIVED` (no toast, no redirect). Fine print in mono t4.
- **StatStrip**: 4 columns (25 / 5 / ∞ / $4.99) — MD Nichrome number + small t3 caption, top hairline.
- **ToolGrid**: 5-col grid of tool cards — mono category label (colored per cascade layer: amber=stars, azure=worlds, emerald=life, violet=civ, stellar=myth, teal=integration), display-font name, t3 blurb.
- **Countdown chip** (`T-MINUS 33 DAYS`): compute live from launch-date constant. Put the launch date in ONE config constant (`LAUNCH_DATE = '2026-08-11T09:00:00-07:00'`) — never hardcode it in copy.
- SEO/OG: title "StellarForge — Early Access opens August 11", OG image = boarding-pass frame from Campaign sector 02.5.

## 3. Studio Home — `Home (Writers).html`

Route: `/` (authed). Layout: 52px topbar + 230px left rail + main column (max ~1280px).

- **Topbar**: cube glyph + "Stellarforge STUDIO" colophon wordmark (Lora italic + small display-font suffix), center tabs (Studio · Manuscript · Atlas · Cast · Lore · Timeline), right: PRO pill + avatar with Lora-italic name/meta. Tabs are real routes.
- **Left rail**: three groups — Projects (with counts), per-project Workbench (Manuscript 68k, Atlas, Cast, Cultures, Languages, Timeline, Bestiary, Glossary), Tools (Cascade, Naming forge, Map maker, Trash). Active = 2px teal left border + teal tint. Data: projects/entities from Supabase.
- **Greeting**: Lora italic 44px "Good morning, {firstName}." + a *contextual* sub-line generated from last session (last chapter touched, mid-sentence state). Right meta: streak in prose ("Day 47 · twelve mornings in a row"), not gamified badges.
- **Streak strip**: 14 vertical cells (lit gradient, today = bright teal glow) + three Lora ledger stats (today's words / manuscript total / pages this month). Data: daily wordcount rollup table.
- **Continue-writing card** (the hero): breadcrumb in Lora-italic teal → scene title → POV/location/status line → **the actual last sentence written** as a teal-left-bordered blockquote → CONTINUE WRITING (primary) + REVIEW LAST SESSION (ghost) → right sub-panel with SVG progress ring (chapter %) + book/cycle progress bars. Deep-links into the editor at the saved cursor position.
- **Bookshelf**: 3/4-ratio book covers (gradient background + minimal SVG motif + inner 1px inset frame + Lora-italic title), meta row with status pill + Lora-italic stats, dashed "+ Begin a new project" tile.
- **Cast grid** (3-col): gradient portrait initial, Lora-italic name, italic role, small tag chips.
- **Scratchpad**: amber-dot pinned notes, Lora body, italic source labels ("From the cascade", "Quote to use"). CRUD against a `notes` table; notes are pinnable from anywhere (see §4 pins).
- **World prompt panel**: violet accent, Lora-italic 26px prompt *generated from the user's own world data* (character + location + last scene), actions: Open as new scene / Save to scratchpad / Try another.
- **Activity feed**: journal-voice rows — italic when · "**closed** the session in *Ch 7*" · small colored delta ("+1,402 words", "pinned", "published"). Derive from an events table.
- **Footer**: single quiet strip — status dot + "Stellarforge Studio · online" + autosave age + Sol/JD/coordinates. This is the ONLY ambient telemetry on the page.

## 4. Manuscript editor — `Writing.html` (the flagship build)

Route: `/write/:sceneId`. Grid: `44px topbar / 1fr / 32px statusbar` × `280px binder / 1fr editor / 320px inspector`.

**Topbar** — brand · **segmented mode control** (Outline / Editor / Corkboard — active segment solid teal with dark text) · abbreviated breadcrumb (home icon / "Aerwyn · Bk II" / "Ch 7" / Lora-italic scene title; hide segments < 1180px, all < 980px) · one compact session meter (`● 1,402 · 42m · CH 4,820/6k`) · focus + overflow icon buttons. Keep it to ONE meter — details live in the bottom bar.

**Binder** (left) — collapsible tree: Books → Parts → Chapters → Scenes, plus Research & World and Trash. Type-differentiated rows (books = display caps, parts = mono caps, chapters = Lora italic, scenes = Lora), per-row wordcount meta + status dot (todo/draft1=amber/draft2=stellar/final=teal glow). Search field on top; footer buttons `+ Scene · + Chapter · + Folder · Import`. Implement with dnd-kit for reorder; persist tree to Supabase. Active scene = teal left border.

**Pin bar** (above editor) — horizontally scrolling cards pinned *to the scene*: color-coded by entity type (character=stellar, location=teal, term=violet, scene-ref=amber, rule=any). Card = dot + mono type label + Lora title; click opens the entity in the inspector; `+ PIN` opens the entity search. **Any worksheet-backed entity (planet, species, religion, culture…) must be pinnable.** Persist per-scene.

**Editor** (center, max 720px) — mono chapter mark → Lora-italic 30px title → meta row (status pill / POV / location / count) → `· · ·` divider → **Lora 18px/1.78 prose** with drop-cap first paragraph. In production use **TipTap** (already in the repo), not raw contenteditable. Two custom extensions:
1. **EntityMention** — trigger `@`. Popup spec (see reference): header shows live query, category tabs with counts (Recent / Characters / Places / Terms / Cultures / Objects / Scenes), fuzzy-matched results with highlighted substring + type glyph + badge, **"Create «query»"** row when ≥2 chars (creates the entity in the world bible AND inserts the link), footer kbd hints. Keys: ↑↓ navigate, Tab cycles category, Enter inserts, Esc dismisses. Inserted mention = inline node rendering as colored dotted-underline text (`ref-char` stellar / `ref-loc` teal / `ref-gloss` violet italic / `ref-scene` amber / `ref-cult` amber-warm / `ref-thing` cyan); hover tint; click opens entity panel. **This works in every rich-text surface in the app** (scenes, notes, synopses, worksheet text fields) — build it once as a shared extension.
2. **Cursor-line highlight** — active paragraph gets 2px teal left rule + faint gradient (editor decoration on selection).
Clamp any popup to the viewport; never `scrollIntoView`.

**Inspector** (right) — tabs: Synopsis / Notes / Refs / Cascade. Blocks: scene meta (status, label chip, POV, time, place, words vs target, created/edited) · synopsis (dashed-border Lora box) · beats checklist (teal filled / hollow todo dots) · present-in-scene roster (portraits + role) · theme chips · **World Influence panel** (mono gauge rows — gravity/tide/temp/culture — values pulled live from the world's worksheet data, plus "N lines reference world parameters · consistent" footer; this is the cascade differentiator, do not cut it) · linked references (dotted-underline list, color-coded). Inspector must also host **entity search**: a search field at top of the Refs tab over all world entities, results pinnable to the scene.

**Bottom bar** — left: pulsing save-dot + "SAVED · 12s ago", scene/chapter/book counts; right: today vs goal + mini progress bar + streak + Sol/JD. Autosave heartbeat animates the dot.

## 5. Ambient telemetry (product-wide garnish)

Reference: Style Guide §15–16. Implement from `design_handoff/reference-components/`:
- `VelocityDial.tsx` — footer of dashboard/settings pages; cycles Earth rotation → solar orbit → solar apex → galactic orbit every 3.4s.
- `ParallaxStrips.tsx` — marketing pages only, never in the editor.
- Scrollbars: apply `.sf-sb` to all scroll containers (`--slim` in rails, `--idle` in the editor).
- Easter eggs (cheap, high-charm): Sol counter + Julian Day in footers, one "breathing" star in the starfield, Konami-code star chart. All must respect `prefers-reduced-motion`.

---

## 6. Data model implied by the designs

| Entity | Used by | Notes |
|---|---|---|
| `projects` | rail, bookshelf | title, type (cycle/novel/novella), status, target words |
| `binder_nodes` | binder tree | parent_id, kind (book/part/chapter/scene/research/trash), order, status, wordcount |
| `scenes` | editor | TipTap JSON, synopsis, POV entity, location entity, time label, target, beats[] |
| `entities` | @mentions, pins, cast, inspector | kind (character/place/term/culture/object), name, glyph, meta, worksheet_id? |
| `pins` | pin bar, scratchpad | scope (scene/global), entity_id or free note, color kind |
| `sessions` / `word_events` | streaks, meters, feed | per-day rollups |
| `world_params` | World Influence panel | gravity/tide/temp/etc. from worksheets |

## 7. Acceptance checklist per page

- [ ] Pixel-matches the reference at 1440w (open side by side); tokens only, no rogue hex
- [ ] Correct register (§1) — no `//` labels on writer surfaces, no Lora on marketing chrome
- [ ] Zero border-radius except tags/avatars/dots
- [ ] `@` mention works in every rich-text field, creates entities, links are colored by type
- [ ] Pin bar accepts any worksheet-backed entity; pins persist per scene
- [ ] Landing form writes to Supabase + sends confirmation
- [ ] Launch date sourced from the single `LAUNCH_DATE` constant
- [ ] Keyboard: mention picker fully drivable without mouse; Esc always dismisses
- [ ] `prefers-reduced-motion` disables dial/pulse/parallax
- [ ] No `scrollIntoView`; popups clamp to viewport

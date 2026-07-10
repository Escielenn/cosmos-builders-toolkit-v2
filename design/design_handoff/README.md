# StellarForge — Aesthetic Uplift Handoff

> Canonical design-system package for the StellarForge web app. Hand this to Claude Code (or any developer) and they can recreate the full aesthetic inside your Vite + React + TypeScript + Tailwind codebase.

---

## TL;DR for Claude Code

**You are porting a complete aesthetic system — not shipping the HTML.**

The `source/` folder contains HTML/CSS prototypes. Do **not** copy the HTML. Instead:

1. Read `source/Style Guide.html` with the adjacent `.js` files to see every component, token, and pattern rendered.
2. Install the tokens from `tokens.css` and the Tailwind config from `tailwind.config.ts` into the existing Vite + React + TS + Tailwind codebase.
3. Recreate the primitives (`Button`, `Panel`, `Tag`, `Input`, etc.) as idiomatic React + TypeScript + Tailwind components. `reference-components/` has five examples to copy the patterns from.
4. Apply the system pass-by-pass across the existing app — don't rewrite routes or logic, only visual surface.

This is a **hi-fidelity** handoff. Every hex value, font size, tracking, and motion duration is final.

---

## Target Stack (confirmed)

- **Build**: Vite
- **UI**: React 18+ / TypeScript
- **Styling**: Tailwind CSS v3 + CSS variables (tokens.css)
- **Data**: Supabase (Postgres)
- **Auth**: Clerk (not Supabase Auth)
- **Hosting**: Vercel
- **Payments**: Stripe

Prefer Tailwind utilities. Fall back to CSS variables (`var(--sf-teal)`) only when the token isn't in the Tailwind theme (it should be — check `tailwind.config.ts` first).

---

## What's in this Bundle

```
design_handoff/
├── README.md                     ← you are here
├── tailwind.config.ts            ← drop into project root
├── tokens.css                    ← @import before Tailwind directives
├── reference-components/         ← idiomatic Tailwind ports (study + copy pattern)
│   ├── Button.tsx
│   ├── Panel.tsx
│   ├── VelocityDial.tsx
│   ├── ParallaxStrips.tsx
│   └── StellarBackground.tsx
├── source/                       ← the original HTML/CSS prototypes
│   ├── Style Guide.html          ← open in browser to see every token live
│   ├── shared.css                ← source of truth for tokens
│   ├── sg-sections.js            ← style guide sections part 1
│   ├── sg-sections-p2.js         ← part 2 (components, brand, patterns)
│   ├── sg-sections-p3.js         ← part 3 (ambient telemetry, scrollbars)
│   └── assets/                   ← logos, fonts (MD Nichrome), product screenshots
└── screenshots/                  ← reference renders of each section
```

---

## Install Steps (do these first)

### 1. Copy font files
```bash
cp design_handoff/source/assets/fonts/*.woff2 public/fonts/
```

### 2. Copy logo + marks
```bash
cp design_handoff/source/assets/*.svg public/brand/
```

### 3. Install tokens.css
```bash
cp design_handoff/tokens.css src/styles/tokens.css
```

Then in your root stylesheet (e.g. `src/main.css` or `src/index.css`):

```css
@import "./styles/tokens.css";
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. Replace Tailwind config
Merge `design_handoff/tailwind.config.ts` into your existing `tailwind.config.ts`. If you have no existing customizations, just replace it.

### 5. Add Google Fonts to `index.html`
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Jura:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@300;400;500;700&display=swap" rel="stylesheet">
```

### 6. Mount the background layer at the root
Follow `reference-components/StellarBackground.tsx` — mount once in `App.tsx` or your top-level layout. Every page inherits the void + starfield + grain.

---

## Design Principles (memorize before you code)

StellarForge is **the ship's instrument panel**, not a web app. Every surface should feel like it came off the same bridge console.

1. **Zero radius.** Containers, panels, cards, inputs — all square. The only exception: `<Tag>` (2px). Buttons are NOT pill-shaped.
2. **Three layers, no deeper.** Void → Surface → Surface-Elevated. Never stack four.
3. **One focal moment per screen.** Brackets + glow + bold border + gradient stacked on everything = slop. Pick one element per view to amplify.
4. **Teal means Integration. Amber means Physics. Crimson means Stop.** Color is a cascade layer, never decorative. See Color System below.
5. **Mono for numbers.** All coordinates, counters, timestamps, IDs use JetBrains Mono. Never body copy.
6. **Motion: 120–280ms, linear or assertive easing.** No bouncy springs, no elastic, no 600ms reveals.
7. **Voice = Ship's Voice.** No "Oops!", no emoji, no exclamation points, no "Let's go!". See Voice section.
8. **Ambient telemetry everywhere.** The ship is always on. Coordinates in footers, velocity dials in loading states, drifting background data. Never essential, never blocking.

---

## Design Tokens

### Colors

| Role | Token | Hex | Usage |
|---|---|---|---|
| **Void** | `--sf-void` / `bg-sf-void` | `#0A0E17` | body background, deepest layer |
| **Surface** | `--sf-surface` / `bg-sf-surface` | `#0E1320` | panels, cards |
| **Surface Elevated** | `--sf-surface-elevated` / `bg-sf-surface-elevated` | `#161C2B` | hovered cards, modals |
| **Border** | `--sf-border` | `rgba(255,255,255,0.08)` | 1px separators |
| **Border Strong** | `--sf-border-strong` | `rgba(255,255,255,0.14)` | hover states, focus rings |
| **Teal (Integration)** | `--sf-teal` / `text-sf-teal` | `#15C17B` | primary CTAs, success |
| **Teal Bright** | `--sf-teal-bright` | `#3DFFCD` | hover text, glow |
| **Amber (Physics)** | `--sf-amber` | `#FFB800` | warnings, data tags |
| **Stellar (Worlds)** | `--sf-stellar` | `#5B8DEF` | navigation accent, phase: SIGNAL |
| **Violet (Lore)** | `--sf-violet` | `#9B5DE5` | phase: ORBIT |
| **Crimson (Stop)** | `--sf-crimson` | `#FF3366` | errors, destructive actions |
| **Azure** | `--sf-azure` | `#4D9FFF` | creative direction 2, links |
| **Magenta** | `--sf-magenta` | `#FF00AA` | social artifacts, rare accent |
| **Cyan** | `--sf-cyan` | `#00D4FF` | tech-tag accent |
| **Emerald** | `--sf-emerald` | `#00FF88` | data nodes |

### Text Tiers (on dark)

| Token | Value | Use for |
|---|---|---|
| `text-t1` | `#FAFAFA` | primary text, headings |
| `text-t2` | `#C8C8C8` | body copy |
| `text-t3` | `rgba(255,255,255,0.45)` | muted, eyebrows, secondary |
| `text-t4` | `rgba(255,255,255,0.28)` | micro labels, mono eyebrows |
| `text-t5` | `rgba(255,255,255,0.15)` | near-hidden, ambient-only |

**AAA contrast rule**: body copy MUST be `text-t2` or `text-t1`. Never set running paragraphs in `text-t3`.

### Typography

| Family | Tailwind | Usage |
|---|---|---|
| **MD Nichrome** (display) | `font-display` | H1 only. 96px hero, 56px section. Weight 300. |
| **Jura** (heading) | `font-heading` | eyebrows, section labels, all-caps tracked 2px. Weight 500. |
| **DM Sans** (sans) | `font-sans` | body copy, buttons, forms. Weight 400. |
| **JetBrains Mono** (mono) | `font-mono` | numbers, coordinates, tags, timestamps, code. |

**NEVER**: Nichrome on buttons or body copy. Mono for anything that isn't a number/coordinate/code. Jura for body copy.

Type scale (use the `sf-*` Tailwind font-size tokens):

| Class | Size / LH / Weight | Use |
|---|---|---|
| `text-sf-hero` | 96 / 0.98 / 300 | hero H1 |
| `text-sf-h1` | 56 / 1 / 300 | section header |
| `text-sf-h2` | 36 / 1.15 / 300 | sub-section |
| `text-sf-h3` | 24 / 1.25 / 400 | card title |
| `text-sf-body` | 15 / 1.55 / 400 | body |
| `text-sf-small` | 13 / 1.55 / 400 | supporting |
| `text-sf-mono` | 11 / 1.4 + 0.18em track | mono eyebrows |
| `text-sf-eyebrow` | 11 / 0.2em track / 500 | section eyebrow |

### Spacing

All spacing is a multiple of 4px. Use the `sf-*` aliases for intent:

| Class | px |
|---|---|
| `p-sf-1` | 4 |
| `p-sf-2` | 8 |
| `p-sf-3` | 12 |
| `p-sf-4` | 16 |
| `p-sf-5` | 20 |
| `p-sf-6` | 24 |
| `p-sf-8` | 32 |
| `p-sf-12` | 48 |
| `p-sf-16` | 64 |
| `p-sf-20` | 80 |

### Border Radius

**Zero, everywhere.** Containers, panels, cards, inputs, buttons — `rounded-none`.
Only exception: `<Tag>` uses `rounded-[2px]`.

### Motion

| Class | Duration | Use |
|---|---|---|
| `duration-fast` | 120ms | hover colour shifts |
| `duration-base` | 180ms | buttons, tag transitions |
| `duration-slow` | 280ms | panel slide-ins |
| `duration-ambient` | 2400ms | velocity dial needle, ambient |

Easing:
- `ease-sf-out` — cubic-bezier(0.2, 0, 0, 1) — default
- `ease-sf-inout` — cubic-bezier(0.4, 0, 0.2, 1) — ambient
- `ease-sf-snap` — cubic-bezier(0.6, 0, 0.1, 1) — assertive

**Never** use spring physics, bouncy curves, or reveals > 300ms on UI elements. Only ambient telemetry may exceed 300ms.

### Shadows

Glow is the only shadow style. **No soft drop shadows.**

| Class | Use |
|---|---|
| `shadow-sf-glow-teal` | primary button hover |
| `shadow-sf-glow-amber` | warning emphasis |
| `shadow-sf-glow-crimson` | error emphasis |
| `shadow-sf-inset-teal` | ghost button hover |

---

## Components to Build

Work through this list in order. Each has a reference render in `screenshots/` and source in `Style Guide.html`.

### Primitives (build first)

- [ ] **Button** — primary (teal fill) + ghost (outline). See `reference-components/Button.tsx`.
- [ ] **Panel** — the surface primitive. Layer prop: void / surface / elevated. See `reference-components/Panel.tsx`.
- [ ] **Tag** — inline mono pill, 2px radius. Color variants: teal, amber, azure, violet, emerald, stellar, crimson.
- [ ] **Input** — square, 1px border, focus ring teal. Never blue browser default.
- [ ] **Select** / **Dropdown** — matches Input. Custom chevron.
- [ ] **Checkbox** / **Radio** — square checkbox, square radio. Teal fill on check.
- [ ] **Toggle / Switch** — rectangular, no rounded ends.
- [ ] **StatusPill** — `●` dot + label, color-coded to phase (SIGNAL, IGNITE, IGNITION, ORBIT).
- [ ] **Eyebrow** — mono or Jura; 0.2em tracking; uppercase; `text-t3` or `text-sf-teal`.

### Layout

- [ ] **SectionHeader** — eyebrow code (`// 01 · SECTION`) + display H1. Optional right-aligned subtitle.
- [ ] **Sidebar** — sticky, `bg-[rgba(10,14,23,0.7)]`, `backdrop-blur-sf-side`. Nav items = 2px teal border-left on active.
- [ ] **TopBar** — brand wordmark left, status pills right, border-bottom.
- [ ] **Footer** — coordinates (`39.87°N · 104.97°W`), build hash, copyright. Mono, `text-t5`.
- [ ] **Divider** — gradient: `transparent → var(--sf-border-strong) → transparent`.

### Data Display

- [ ] **StatGrid** — 4-column grid, mono eyebrow + display value. No cards.
- [ ] **KeyValueRow** — mono label `:`  mono value. Used in telemetry panels.
- [ ] **DataTable** — 1px borders, no alt-row shading. Header = mono eyebrow. Body = small sans.
- [ ] **Progress Bar** — rectangular, no rounded caps. Teal fill. Optional mono % above.

### Feedback

- [ ] **Toast** — 1px border (teal for success, amber for warn, crimson for error), slide-in top-right, 280ms.
- [ ] **EmptyState** — uses VelocityDial as centerpiece. Mono copy. NEVER: "Oops! Nothing here yet!"
- [ ] **LoadingState** — scanning lines, NOT spinners. See sg-sections-p2.js for recipes.
- [ ] **Error boundary** — crimson bracket + SYSTEM FAULT header + mono stack trace.

### Ambient Telemetry (signature!)

- [ ] **VelocityDial** — see `reference-components/VelocityDial.tsx`. Footer + loading states.
- [ ] **ParallaxStrips** — see `reference-components/ParallaxStrips.tsx`. Hero sections, empty states.
- [ ] **JulianDayClock** — ticks in top bar. Format: `JD 2461158.5`.
- [ ] **SolCounter** — integer days since 2020-01-01. `SOL 19,327`.
- [ ] **BreathingStar** — one star in starfield pulses 0.08–0.12 Hz.
- [ ] **KonamiCode** — ↑↑↓↓←→←→BA → unlock full-screen star chart modal.

---

## Voice & Copywriting

The product is **the ship**, not an app. Every string the user sees should feel like it came from mission control.

**Ship's Voice examples**:

| Web slop | Ship's Voice |
|---|---|
| "Great job saving your world! 🎉" | `WORLD FILE SECURED.` |
| "Oops! Something went wrong." | `OPERATION FAILED. RETRY WHEN READY.` |
| "Your export is done! Check your downloads." | `EXPORT COMPLETE. TRANSMISSION LOGGED.` |
| "Welcome back, Jason! We missed you!" | `SESSION ESTABLISHED.` |
| "Ready to create your first species? Let's go!" | `NO SPECIES ON FILE. BEGIN SURVEY WHEN READY.` |
| "Please enter a valid value." | `PARAMETERS OUTSIDE OPERATIONAL RANGE.` |

**Rules**:
1. Uppercase for all system messages. Sentence case only for human-written content (lore, docs).
2. No exclamation points. No emoji. No second-person excitement.
3. Past tense for confirmation (`SAVED`, `LOGGED`), imperative for action (`BEGIN SURVEY`).
4. Use coordinates, timestamps, and identifiers wherever possible.
5. `//` prefix for section labels. `§` prefix for sub-sections in long-form.

---

## Scrollbar Skinning

Every scrollable container in the app gets `className="sf-sb"` (or `sf-sb sf-sb--slim` for narrow surfaces). `tokens.css` defines three variants:

- **`.sf-sb`** — default, 8px, always visible. Use on sidebars, modals, body.
- **`.sf-sb--slim`** — 6px. Use on chat, command palette, anything <360px wide.
- **`.sf-sb--idle`** — fades after 800ms of inactivity. Use on long-form docs only. Requires JS helper:

```tsx
// Hook: add to a wrapper if you want idle-hide
function useIdleScrollbar(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let t: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      el.classList.add('is-scrolling');
      clearTimeout(t);
      t = setTimeout(() => el.classList.remove('is-scrolling'), 800);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [ref]);
}
```

**Forbidden**: `overflow:hidden` to "fix" a layout problem. Never tint thumbs teal, amber, or any accent. Never pill-shape.

---

## Do / Don't (the checklist)

### Do

- Zero radius on all containers.
- Nichrome only for H1 titles.
- Mono for numbers & coordinates.
- Ship's Voice in all system strings.
- Panels use CSS tokens (`bg-sf-surface`), never hardcoded hex.
- One primary button per screen.
- Motion 120–280ms, linear or assertive.
- `//` prefix for section headers.
- Coordinates footer: `39.87°N · 104.97°W`.
- Starfield + grain on every page.
- Body copy in DM Sans.
- AAA contrast for body text.
- Teal = Integration. Amber = Physics.
- One focal moment per screen.

### Don't

- Rounded cards with 8px+ border-radius.
- Nichrome on buttons or body copy.
- Jura or DM Sans tweened for data readouts.
- Color chosen "because it looks nice".
- "Oops!", emoji, exclamation points, "Let's go!".
- Hardcoded `#0E1320` or similar hex.
- Three teal CTAs competing in the same view.
- Bouncy spring curves, 600ms reveals, elastic.
- Icon + sentence headers in every card.
- Generic "© 2026 Company Name".
- Solid black or gradient backgrounds.
- Body copy in Jura or Inter.
- Muted `text-t3` used for running copy.
- Teal used for the Worlds section header (it's stellar blue).
- Glow + brackets + bold border + gradient stacked on one element.

---

## The One-Line Test

> If the screen feels like a ship, ship it. If it feels like a website, start over.

Apply this on every route before committing. The starfield, the mono coordinates, the bracket corners, the zero-radius panels, the Ship's Voice copy — all of these together make it a ship.

---

## Clerk + Supabase + Stripe — Stylistic Notes

When wiring the auth, data, or payments layer:

- **Clerk UI**: override the Clerk appearance to match. Use `<SignIn appearance={{ elements: { card: 'bg-sf-surface border border-sf-border rounded-none', formButtonPrimary: 'bg-sf-teal text-sf-void rounded-none tracking-wide uppercase' } }} />`. No rounded pill buttons, no default Clerk purple.
- **Supabase error messages**: map raw PostgREST errors to Ship's Voice before showing to user. `23505` → `RECORD CONFLICT. ENTRY ALREADY ON FILE.`
- **Stripe checkout redirect**: on success, show a panel with `TRANSACTION LOGGED` + mono transaction ID + amount in mono monospace. Never "Payment successful! 🎉".

---

## Rollout Plan (suggested order)

1. **Install** tokens + Tailwind config + fonts. Confirm `bg-sf-void text-t1 font-sans` on body renders as dark navy with off-white text.
2. **Mount** StellarBackground at root. Starfield + grain visible behind all routes.
3. **Primitives** — port Button, Panel, Tag, Input. Replace across the app using grep for the old class names.
4. **Layout** — replace the existing top bar, sidebar, and footer. This alone will shift 60% of the visual feel.
5. **Ambient** — drop VelocityDial in footer, ParallaxStrips in hero / empty states. This is the 40% that makes it feel like a ship.
6. **Voice pass** — ctrl-F every user-facing string in the app and rewrite to Ship's Voice.
7. **QA** — run through the Do/Don't checklist per-route.

---

## Questions / Assumptions Made

- Tailwind v3 assumed (v4 has a different config API).
- App is dark-only. If light mode is needed later, the token file has `:root` scope — fork to `.light { ... }` overrides.
- `clsx` or `classnames` assumed for conditional class composition (reference components use `clsx`). Install with `npm i clsx`.
- Fonts self-hosted from `/public/fonts/` for MD Nichrome; Google Fonts CDN for the rest. Swap to self-host if you need to pass strict CSP.

---

## Reference Screenshots

See the `screenshots/` folder. Each shot shows the canonical rendering of one part of the style guide.

| File | Shows |
|---|---|
| `01-overview.png` | sidebar navigation + hero chrome |
| `02-hero.png` | full sidebar nav anatomy |
| `03-typography.png` | type specimen |
| `04-ambient-telemetry.png` | velocity dial + principles |
| `05-scrollbars.png` | three scrollbar variants side-by-side |
| `06-color-system.png` | palette + usage rules |
| `07-buttons.png` | button variants + states |
| `08-voice.png` | Ship's Voice before/after |
| `09-dosdonts.png` | the checklist |

---

## Contact

This system is authored for Jason D. Batt's StellarForge. If a token looks wrong, trust `source/shared.css` over any markdown table above — that file is the ground truth.

`39.87°N · 104.97°W`

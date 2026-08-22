# StellarForge — Aesthetic Uplift Handoff · REVISION 1 · SUPERSEDED

> **Archived April 2026. Do not build from this file.**
>
> This was the original design handoff. Its **principles, voice guidance, and
> component inventory still hold** and are worth reading. Its **colour, border,
> and type values do not** — they were measured on 2026-08-16 and the border
> and micro-label tokens failed WCAG by wide margins.
>
> Canonical replacements:
> - Values → `design/tokens.css` + `design/tailwind.config.ts` (**generated** by `design/derive.py`)
> - Rationale → `docs/stellarforge/10-LEGIBILITY.md`
> - Agent-facing summary → `.claude/skills/stellarforge-design/SKILL.md`
> - Token map v1 → v2 → `archive/README.md`

---

## What this was

A hi-fidelity port of the StellarForge aesthetic into the Vite + React + TS +
Tailwind codebase. The original bundle shipped as:

```
design_handoff/
├── README.md                     ← this file
├── tailwind.config.ts            ← superseded (generated now)
├── tokens.css                    ← superseded (generated now)
├── reference-components/         ← superseded (see components/ in this package)
│   ├── Button.tsx  Panel.tsx  VelocityDial.tsx
│   ├── ParallaxStrips.tsx  StellarBackground.tsx
├── source/
│   ├── Style Guide.html          ← still useful as a visual inventory
│   ├── shared.css                ← preserved here as shared.css.v1
│   ├── sg-sections{,-p2,-p3}.js
│   └── assets/                   ← MD Nichrome woff2, logos, screenshots
└── screenshots/                  ← 9 reference renders
```

**The `source/`, `assets/`, and `screenshots/` folders are not bundled in this
package.** They remain in the *StellarForge.tools Part II* Claude project.
Nothing in them is needed to build; the Style Guide HTML is worth opening once
to see every v1 component rendered together.

---

## What still holds

These survived revision 2 unchanged, and several were promoted into the
Constitution and the design skill.

### Design principles

1. **Zero radius.** Containers, panels, cards, inputs — all square. Only `Tag`
   (2px) is exempt. *(v2 adds one documented exception: simulator canvases.)*
2. **Three layers, no deeper.** Void → Surface → Surface-Elevated.
   *(v2 enforces this harder — modals sit on `elevated` over a scrim rather
   than inventing a fourth plane.)*
3. **One focal moment per screen.** Brackets + glow + bold border + gradient
   stacked on everything is slop.
4. **Teal means Integration. Amber means Physics. Crimson means Stop.**
   Colour is a cascade layer, never decorative.
5. **Mono for numbers.** Coordinates, counters, timestamps, IDs use JetBrains
   Mono. Never body copy.
6. **Motion 120–280ms**, linear or assertive easing. No bouncy springs, no
   elastic, no 600ms reveals.
7. **Voice = Ship's Voice.** No "Oops!", no emoji, no exclamation points.
8. **Ambient telemetry everywhere.** The ship is always on. Never essential,
   never blocking. *(v2 gates all of it behind `var(--sf-ambient)`.)*

### The font roles

MD Nichrome for H1 only · Jura for eyebrows and section labels · DM Sans for
body and buttons · JetBrains Mono for numbers. **Never** Nichrome on buttons or
body copy, mono for anything that isn't a number, or Jura for body copy.
*(v2 keeps all four roles and changes only sizes and tracking.)*

### Ship's Voice

| Web slop | Ship's Voice |
|---|---|
| "Great job saving your world! 🎉" | `WORLD FILE SECURED.` |
| "Oops! Something went wrong." | `OPERATION FAILED. RETRY WHEN READY.` |
| "Your export is done!" | `EXPORT COMPLETE. TRANSMISSION LOGGED.` |
| "Welcome back, Jason! We missed you!" | `SESSION ESTABLISHED.` |
| "Ready to create your first species? Let's go!" | `NO SPECIES ON FILE. BEGIN SURVEY WHEN READY.` |
| "Please enter a valid value." | `PARAMETERS OUTSIDE OPERATIONAL RANGE.` |

Rules: uppercase for system messages · no exclamation points, no emoji, no
second-person excitement · past tense for confirmation, imperative for action ·
coordinates and identifiers wherever possible · `//` prefixes section labels,
`§` prefixes long-form sub-sections.

### The component inventory

Still the right list. Build order: **Primitives** (Button, Panel, Tag, Input,
Select, Checkbox, Radio, Toggle, StatusPill, Eyebrow) → **Layout**
(SectionHeader, Sidebar, TopBar, Footer, Divider) → **Data display**
(StatGrid, KeyValueRow, DataTable, Progress) → **Feedback** (Toast, EmptyState,
LoadingState, ErrorBoundary) → **Ambient** (VelocityDial, ParallaxStrips,
JulianDayClock, SolCounter, BreathingStar, KonamiCode).

### Integration notes

- **Clerk** — override the appearance to match. No rounded pill buttons, no
  default Clerk purple.
- **Supabase** — map raw PostgREST errors to Ship's Voice before display.
  `23505` → `RECORD CONFLICT. ENTRY ALREADY ON FILE.`
- **Stripe** — on success show `TRANSACTION LOGGED` with a mono transaction ID.
  Never "Payment successful! 🎉".

### The one-line test

> If the screen feels like a ship, ship it. If it feels like a website,
> start over.

*(v2 adds a twin: **if the writer can't feel the world pushing back on the page,
start over** — and the Squint Test, which this revision would have failed on
every screen.)*

---

## What did not hold

| v1 claim | Reality |
|---|---|
| "AAA contrast rule: body copy must be `text-t2` or `text-t1`" | Correct, and `t1`/`t2` did pass at 18.5:1 and 11.5:1. But nothing checked the *non-text* contrast, and that was the actual failure. |
| `--sf-border` for "1px separators" | 1.20:1. WCAG 1.4.11 requires 3.0:1 for the boundary of a UI control. |
| `--sf-border-strong` for "hover states, focus rings" | 1.45:1 — and no focus ring was ever actually defined anywhere in the system. |
| Three layers void/surface/elevated | Real in the token file, invisible on screen: the planes separated at 1.04:1 and 1.09:1. |
| `t4` "micro labels, mono eyebrows" | 2.45:1, applied at 11px with 0.18em tracking — small, thin, tracked, and low-contrast at once. |
| `t5` "near-hidden, ambient-only" | 1.51:1. Retired in v2: nothing readable lives below `t4`. |
| `.sf-sb--idle` "fades after 800ms" | A scrollbar that hides fails 1.4.11 for exactly as long as the user spends hunting for it. Removed. |
| `disabled:opacity-40` | 2.21:1 — reads as dim-but-clickable. Disabled is a colour in v2. |
| "Every hex value, font size, tracking, and motion duration is final." | The motion durations were. The rest was not measured. |

The last row is the lesson, and it is the reason `design/derive.py` exists:
**a palette that is chosen can drift; a palette that is solved cannot.**

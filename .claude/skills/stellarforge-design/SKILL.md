---
name: stellarforge-design
description: "StellarForge design system — the canonical visual language for stellarforge.tools, the Cosmos Builders Toolkit, and any StellarForge-branded artifact. Use this skill whenever building, modifying, or reviewing any StellarForge interface, component, page, or visual asset, or when Jason asks for something 'in the StellarForge style' or 'with a StellarForge aesthetic.' Also trigger when Jason mentions StellarForge, Cosmos Builders, dark cosmic UI, the design system, contrast, legibility, or readability. This is the source of truth for visual surface; the stellarforge-canon skill governs data architecture."
---

# StellarForge Design System

**Revision 2 · August 2026.** Every colour below is *solved* against a WCAG contrast target in OKLab by `design/derive.py`, not chosen by eye. `tokens.css` and `tailwind.config.ts` are generated from it.

> **Supersedes revision 1.** If you have seen a StellarForge palette built on `#0D0D0F` with cyan primary, 8px card radius, and Clash Display / Satoshi, it is obsolete. It described a direction that was never shipped, and it failed its own contrast targets (muted text 3.66:1, card borders 1.61:1). Use the values here.

---

## The principle

**Light emerging from void.** The forge is not an object but the action of shaping cosmos from darkness.

With one hard constraint learned the expensive way: *darkness is the mood, not the interface.* The first revision of this system put panel borders at 1.20:1 and plane separation at 1.04:1 — the app had no visible structure at all. Atmosphere lives in the background layer. Structure stays legible.

**StellarForge is the ship's instrument panel, not a web app.** Real consoles have visible bezels.

---

## Planes — three, never four

| Token | Value | Use |
|---|---|---|
| `--sf-void` | `#0A0E17` | body background, deepest layer |
| `--sf-surface` | `#1B2334` | panels, cards |
| `--sf-surface-elevated` | `#273249` | hovered cards, modals, popovers |
| `--sf-scrim` | `rgba(5, 7, 12, 0.72)` | behind modals |

Each plane clears **1.22:1** against the one below, so a panel edge is visible before any border is drawn. Modals sit on `elevated` above the scrim — never a fourth plane.

Never pure black. Never a flat grey — the ramp carries the void's 266.5° blue.

## Text — four tiers

| Token | Value | Use | Worst case |
|---|---|---|---|
| `--t1` | `#FAFAFA` | headings, primary | 12.28:1 |
| `--t2` | `#C9CDD3` | body copy | 8.03:1 |
| `--t3` | `#A7AAB0` | secondary, captions | 5.50:1 |
| `--t4` | `#9799A0` | micro labels, mono eyebrows | 4.50:1 |

**There is no `t5`.** Nothing readable lives below `t4`. If an element should recede, make it *smaller*, never fainter. Every tier is solved on the lightest plane, so one tier works everywhere.

## Lines — solid, never alpha

| Token | Value | Use |
|---|---|---|
| `--sf-line-hairline` | `#50555E` | table rules, dividers |
| `--sf-line` | `#676B75` | panel edges, card boundaries |
| `--sf-line-interactive` | `#787D87` | **anything operable** — WCAG 1.4.11, ≥3:1 |
| `--sf-line-emphasis` | `#979BA5` | hover, active, selected |

Alpha borders composite unpredictably over the starfield, grain, and video layers. `rgba(255,255,255,0.08)` is not a contrast ratio — it's a gamble. Solid tokens only.

## Accents — two stops each

Hues are the brand and never change. Each carries a canonical stop and a lifted `-text` stop.

| Token | Canonical — fills, borders, icons, large text | `-text` — body copy only | |
|---|---|---|---|
| `--sf-teal` | `#15C17B` | `#15C17B` | — |
| `--sf-teal-bright` | `#3DFFCD` | `#3DFFCD` | — |
| `--sf-amber` | `#FFB800` | `#FFB800` | — |
| `--sf-amber-warm` | `#FFB347` | `#FFB347` | — |
| `--sf-stellar` | `#5B8DEF` | `#6698FC` | lifted for body text |
| `--sf-emerald` | `#00FF88` | `#00FF88` | — |
| `--sf-violet` | `#9B5DE5` | `#BA7DFF` | lifted for body text |
| `--sf-crimson` | `#FF3366` | `#FF658B` | lifted for body text |
| `--sf-azure` | `#4D9FFF` | `#4D9FFF` | — |
| `--sf-magenta` | `#FF00AA` | `#FF54D4` | lifted for body text |

**The rule:** `--sf-crimson` for the error border, icon, and destructive fill. `--sf-crimson-text` for the sentence explaining the error. Never the reverse.

`--sf-on-{name}` is the label colour for a filled button — `#0B0F18` in every case.

**Colour is a cascade layer, never decoration.** Teal = Integration · Amber = Physics · Stellar = Worlds · Violet = Lore · Crimson = Stop.

**`--sf-cyan` is retired, not listed above.** Legacy cyan `#00D4FF` was killed product-wide before this package existed (SF-II settled decision #3, already shipped). The token still exists as an alias to teal — so a lingering `text-sf-cyan` reference degrades to the brand colour instead of losing all styling — but it is never a distinct hue again. Never write `#00D4FF`, and never describe simulator canvases as "keeping legacy cyan."

## States — never opacity

| Token | Value |
|---|---|
| `--sf-disabled-bg` | `#151B29` |
| `--sf-disabled-line` | `#575C65` |
| `--sf-disabled-text` | `#787B81` |
| `--sf-focus` | `#3DFFCD` — 2px ring, 2px offset, 10:1 |
| `--sf-selection-bg` | `#277D82` |

`opacity-40` guarantees nothing — it multiplies against whatever is behind it. Disabled is a colour.

---

## Typography

| Family | Token | Use |
|---|---|---|
| **MD Nichrome** | `font-display` | H1 only, weight 300 |
| **Jura** | `font-heading` | eyebrows, section labels, all-caps |
| **DM Sans** | `font-sans` | body copy, buttons, forms |
| **JetBrains Mono** | `font-mono` | numbers, coordinates, IDs, timestamps |

| Class | Size / LH | Use |
|---|---|---|
| `text-sf-hero` | `clamp(48px, 8vw, 88px)` / 1.02 / 300 | hero H1 |
| `text-sf-h1` | `clamp(34px, 5vw, 52px)` / 1.08 / 300 | section header |
| `text-sf-h2` | `clamp(26px, 3vw, 34px)` / 1.2 / 400 | sub-section |
| `text-sf-h3` | 22 / 1.3 / 500 | card title |
| `text-sf-prose` | 18 / 1.7 | the Studio editor |
| `text-sf-body` | 16 / 1.6 | body |
| `text-sf-small` | 14 / 1.55 | supporting |
| `text-sf-mono` | 12 / 1.45 / 0.10em | mono eyebrows |
| `text-sf-eyebrow` | 12 / 1.3 / 0.12em / 600 | section eyebrow |

**Never track text under 12px.** The old 11px / 0.18em mono eyebrow was the least readable element in the product — small, thin, letter-spaced, and at 2.45:1 all at once. Tracking destroys word shape exactly where word shape is doing the most work.

**Never:** Nichrome on buttons or body. Mono for anything that isn't a number, coordinate, or code. Jura for body copy. Inputs below 16px (iOS Safari zooms the viewport).

---

## Structure

- **Zero radius.** Two exceptions: `Tag` at 2px, and simulator canvases (`rounded-lg`, product teal on `#09090B`, per the Tidelock reference — legacy cyan is retired, see above).
- **44px minimum hit target** (`min-h-hit`). Icon-only buttons carry an `aria-label`.
- **Running prose bounded** by `.sf-measure` (68ch) or `.sf-measure-wide` (84ch).
- **Every interactive element shows a `:focus-visible` ring.** No component may suppress the global default.
- **Spacing is a multiple of 4px.** Use the `sf-*` aliases.
- **One focal moment per screen.** Brackets + glow + bold border + gradient stacked on everything is slop.

## Motion

120ms hover · 180ms buttons · 280ms panels · 2400ms ambient only.
Easing `cubic-bezier(0.2, 0, 0, 1)` default. No springs, no elastic, no reveals over 300ms outside ambient telemetry. Honour `prefers-reduced-motion`.

## Ambient telemetry

The ship is always on. Coordinates in footers, velocity dials in loading states, drifting background data. Never essential, never blocking.

**Every decorative layer multiplies `var(--sf-ambient)`** — starfield, grain, texture, video. One variable turns the whole atmosphere off. Honour `prefers-contrast` and `prefers-reduced-transparency`, and expose a Display setting (Standard / High Contrast / Reduce Ambient).

**Text over video or imagery always gets `.sf-scrim`.** A measured ratio means nothing over a moving background.

---

## Voice

The product is the ship, not an app. Uppercase system messages, no emoji, no exclamation points, no second-person excitement. Past tense for confirmations, imperative for actions.

| Web slop | Ship's Voice |
|---|---|
| "Great job saving your world! 🎉" | `WORLD FILE SECURED.` |
| "Oops! Something went wrong." | `OPERATION FAILED. RETRY WHEN READY.` |
| "Welcome back, Jason!" | `SESSION ESTABLISHED.` |
| "Please enter a valid value." | `PARAMETERS OUTSIDE OPERATIONAL RANGE.` |

`//` prefixes section labels. `§` prefixes long-form sub-sections. Map PostgREST errors before display: `23505` → `RECORD CONFLICT. ENTRY ALREADY ON FILE.`

---

## Do / Don't

**Do:** zero radius · solid line tokens · Nichrome for H1 only · mono for numbers · colour as cascade layer · one focal moment · AAA body copy · visible focus everywhere · scrim over imagery · generate tokens, never hand-write them.

**Don't:** alpha borders · opacity for states · `t5` (it's gone) · canonical accents as body text · tracking under 12px · pure black · a fourth plane · rounded cards · Nichrome on buttons · emoji or exclamation points · hardcoded hex · glow as the only state indicator · a new always-on layer without naming the one it replaces.

---

## The tests

> If the screen feels like a ship, ship it. If it feels like a website, start over.

> **The Squint Test.** Blur the screen or step back six feet. Can you still tell where the panels are and which thing is the button? Structure must survive before detail does.

# 10 · LEGIBILITY

> The measured audit, the re-derived palette, and the rules that keep it from rotting.
> Generated artifacts live in `design/`. **Never hand-edit them** — change a target in `design/derive.py` and re-run.

---

## The diagnosis

Measured against the shipping tokens, 2026-08-16. Every figure is a WCAG 2.1 contrast ratio computed from the token file, not estimated.

| Element | Measured | Required | Verdict |
|---|---|---|---|
| `t1` body/heading on void | 18.49:1 | 4.5 | fine |
| `t2` body on void | 11.54:1 | 4.5 | fine |
| `t3` muted on elevated | 4.43:1 | 4.5 | marginal fail |
| **`t4` micro labels / mono eyebrows** | **2.45:1** | 4.5 | **fail** |
| **`t5`** | **1.51:1** | 4.5 | **fail by construction** |
| **`--sf-border` (white 8%)** | **1.20:1** | 3.0 | **fail — 40% of minimum** |
| **`--sf-border-strong` (white 14%)** | **1.45:1** | 3.0 | **fail — 48% of minimum** |
| **void → surface separation** | **1.04:1** | ~1.25 | **effectively zero** |
| surface → elevated | 1.09:1 | ~1.25 | effectively zero |
| **Disabled button (`opacity-40`)** | **2.21:1** | — | reads as dim-but-usable |
| Scrollbar thumb `#2E3548` on void | 1.40:1 | 3.0 | invisible |
| Visible focus ring | **absent** | 3.0 | keyboard users are blind |

### What this actually means

**The text was never the problem.** `t1` and `t2` are excellent. The failure is that *nothing has an edge*.

The ghost button is the clearest case: its **label** measures 18.49:1 and its **boundary** measures 1.45:1. It isn't a button you can't read — it's a button that doesn't look like a button. Every panel has the same problem from the other direction: surfaces separate at 1.04:1 and their borders sit at 1.20:1, so the documented three-layer system renders as one flat plane.

Two compounding factors make the real numbers worse than the table:

1. **Alpha borders composite unpredictably.** `rgba(255,255,255,0.08)` over the starfield, grain, texture overlay, and video background is not 1.20:1 — it's whatever happens to be behind it that frame.
2. **Ten always-on decorative layers** sit between the user and the content, and every one of them reduces effective contrast below the flat-background figures above.

Then the worst single element in the system: the mono eyebrow, spec'd at **11px, weight 500, 0.18em tracking, in `t4` (2.45:1)**. Small, thin, letter-spaced, and low contrast simultaneously. Wide tracking below 12px is a legibility failure on its own; combining it with a failing contrast ratio makes the section labels — the elements that tell you *what you're looking at* — the least readable text in the product.

---

## The method

Every replacement value is **solved**, not chosen. `design/derive.py` works in OKLab, so the ramp is perceptually even rather than eyeballed in hex, and each token is binary-searched against an explicit contrast target.

```
python3 design/derive.py     # solve → palette.json, prints the full audit
python3 design/emit.py       # palette.json → tokens.css + tailwind.config.ts
```

**The hex values are outputs, not inputs.** If a value looks wrong, change its target and re-run. This is what stops the palette drifting back over the next year.

### The targets

| Group | Target | Rationale |
|---|---|---|
| Plane → plane below | ≥ 1.22:1 | the point where an edge is perceptible without a border |
| `t1` | *pinned* | brand white `#FAFAFA`, not solved — lands at 12.28:1 on the lightest plane |
| `t2` | ≥ 8:1 | on the lightest plane |
| `t3` | ≥ 5.5:1 | on the lightest plane |
| `t4` | ≥ 4.5:1 | on the lightest plane — AA, everywhere |
| `line-hairline` | ≥ 1.7:1 | decorative rules only |
| `line` | ≥ 2.4:1 | panel edges |
| `line-interactive` | ≥ 3.1:1 | **WCAG 1.4.11** — anything you can operate |
| `line-emphasis` | ≥ 4.6:1 | hover, active, selected |
| Accent (canonical) | ≥ 3.05:1 | fills, borders, icons, large text |
| Accent `-text` | ≥ 4.55:1 | the only accent value legal for body text |
| Focus ring | ≥ 3:1 vs component **and** background | measured at 10:1 |

**Solved against the lightest plane, always.** The old tiers were only ever checked on the void — which is why they collapsed on `elevated`. One tier that works everywhere beats five that work in one place.

---

## What changed

### Planes — three, never four

| | Was | Now | Step |
|---|---|---|---|
| void | `#0A0E17` | `#0A0E17` | **unchanged — the default theme's base.** Users choose among 10 bases; see `13-THE-LIFT.md` §0. |
| surface | `#0E1320` | `#1B2334` | 1.23:1 above void |
| elevated | `#161C2B` | `#273249` | 1.23:1 above surface |
| scrim | — | `rgba(5,7,12,0.72)` | new |

Modals do **not** get a fourth plane. They sit on `elevated` above the scrim — which satisfies Law VII and gives modals better separation than a fourth layer would.

Chroma rises with lightness along the original `#0A0E17 → #161C2B` slope, so the planes read as blue slate rather than grey mud. The hue is measured off the existing void (266.5°) and never moves.

### Text — t5 is retired

| | Was | Now | Worst case |
|---|---|---|---|
| `t1` | `#FAFAFA` | `#FAFAFA` unchanged (pinned) | 12.28:1 |
| `t2` | `#C8C8C8` | `#C9CDD3` | 8.03:1 |
| `t3` | white 45% | `#A7AAB0` | 5.50:1 |
| `t4` | white 28% → 2.45:1 | `#9799A0` | **4.50:1** |
| `t5` | white 15% → 1.51:1 | **removed** | — |

**Nothing readable may live below `t4`.** `t5` existed to make text nearly invisible, which is not a design intent — it's a defect with a token name. Ambient telemetry that genuinely should recede uses `t4` at reduced *size*, not reduced contrast.

### Lines — solid, not alpha

| | Was | Now | Worst case |
|---|---|---|---|
| hairline | — | `#50555E` | 1.71:1 |
| `line` | white 8% → 1.20:1 | `#676B75` | 2.40:1 |
| `line-interactive` | white 14% → 1.45:1 | `#787D87` | **3.10:1** |
| `line-emphasis` | — | `#979BA5` | 4.61:1 |

Four tiers by *function*, not by strength. The rule that matters: **anything a user can operate gets `line-interactive` or better.** Panel edges can be quieter; input and button boundaries cannot.

Solid values were chosen deliberately over alpha so that a border's contrast is the same over the starfield, over grain, over video, and over a plain plane.

### Accents — two stops, zero recolouring

Every surviving brand hue kept its identity. Nothing was replaced.

| Token | Canonical (fills, borders, icons) | `-text` (body copy only) |
|---|---|---|
| teal | `#15C17B` | `#15C17B` |
| teal-bright | `#3DFFCD` | `#3DFFCD` |
| amber | `#FFB800` | `#FFB800` |
| emerald | `#00FF88` | `#00FF88` |
| azure | `#4D9FFF` | `#4D9FFF` |
| stellar | `#5B8DEF` | `#6698FC` |
| violet | `#9B5DE5` | `#BA7DFF` |
| crimson | `#FF3366` | `#FF658B` |
| magenta | `#FF00AA` | `#FF54D4` |

`cyan` is not in this table. Legacy cyan `#00D4FF` was retired product-wide before this package existed (SF-II settled decision #3, already shipped) — it is not one of the ten surviving hues, and `design/derive.py` aliases `sf-cyan`/`sf-cyan-text` to teal rather than solving it independently. Never reintroduce it as a distinct accent.

The four mid-luminance hues fail 4.5:1 as body text on `elevated` — they always did; nobody measured. Rather than dulling the brand, each gets a lifted twin at identical hue and chroma.

> **The rule:** `--sf-crimson` for the error border, the error icon, the destructive button fill. `--sf-crimson-text` for the sentence explaining the error. Never the reverse.

Every accent also carries `--sf-on-{name}` — the label colour for a filled button, which is near-void `#0B0F18` in all eleven cases, at 4.65:1 to 14.95:1.

### States — never opacity

`opacity-40` was doing the work of a disabled state. Opacity multiplies against whatever sits behind it, so it guarantees no contrast at all — and at 2.21:1 it read as "dim but clickable."

| Token | Value |
|---|---|
| `--sf-disabled-bg` | `#151B29` |
| `--sf-disabled-line` | `#575C65` |
| `--sf-disabled-text` | `#787B81` (4.05:1 on the disabled fill) |
| `--sf-focus` | `#3DFFCD` (10:1 worst case, 2px, 2px offset) |
| `--sf-selection-bg` | `#277D82` |

### Type

| | Was | Now | Why |
|---|---|---|---|
| body | 15px / 1.55 | **16px / 1.6** | this is a writing tool |
| Studio editor | — | **18px / 1.7** | new `sf-prose` size |
| small | 13px | 14px | 13px was being used for real content |
| mono eyebrow | 11px / 0.18em / w500 | **12px / 0.10em / w600** | the worst element in the system |
| eyebrow | 11px / 0.20em / w500 | **12px / 0.12em / w600** | |
| `--tr-wide` | 0.20em | 0.12em | tracking below 12px destroys word shape |
| `--tr-ultra` | 0.40em | 0.24em | permitted at 24px+ only |
| hero / h1 / h2 | fixed px | `clamp()` | 96px hero overflowed small screens |
| inputs | inherited | **16px** | below 16px, iOS Safari zooms on focus |

### Structure

- `--hit-min: 44px` and Tailwind `min-h-hit` / `min-w-hit`. The old `sm` button computed to ~30px tall.
- `.sf-measure` (68ch) and `.sf-measure-wide` (84ch). Unbounded line length is a legibility failure independent of contrast.
- `.sf-sb--idle` **removed.** A scrollbar that hides for 800ms fails 1.4.11 for exactly as long as the user spends hunting for it.
- `.sf-scrim` required behind any text over video or imagery.

### Ambient layers — one dial

Every decorative layer multiplies by `--sf-ambient`. Set it to `0` and the starfield, grain, texture, and video all vanish together.

Honoured automatically:

- `prefers-contrast: more` → lifts `t3`/`t4` to `t2`, promotes lines, ambient to 0.4
- `prefers-reduced-transparency: reduce` → ambient 0
- `prefers-reduced-motion: reduce` → all animation collapsed

And exposed to the user as a **Display** setting, which is the honest answer to a signature aesthetic that some people cannot read:

- `[data-contrast="high"]` — lines promoted, `t3`/`t4` raised to `t2`, ambient off
- `[data-ambient="off"]` — keeps the palette, drops the atmosphere

---

## The rules that keep it fixed

1. **Never hand-edit `tokens.css` or `tailwind.config.ts`.** They are generated. Change a target, re-run `derive.py && emit.py`.
2. **Never use an alpha value for a border.** Solid tokens only.
3. **Never use opacity for a state.** Disabled, muted, and inactive are colours.
4. **Never put body text in a canonical accent.** Use the `-text` stop.
5. **Nothing readable below `t4`.** If it needs to recede, make it smaller, not fainter.
6. **Anything operable gets `line-interactive` minimum.**
7. **Wide tracking is for 12px and up.** Never track small text.
8. **Every interactive element has a visible `:focus-visible` ring.** No exceptions.
9. **Colour is never the only signal.** Errors get an icon or a `//` prefix as well as crimson.
10. **Text over motion or imagery gets a scrim.** A measured ratio means nothing over a moving background.
11. **Glow is decoration.** It may never be the only indicator of a state.
12. **New ambient layers respect `--sf-ambient`** or they don't ship.

---

## Component pass — paste-ready brief

```
Read docs/stellarforge/10-LEGIBILITY.md first, then load the
stellarforge-design skill.

The token layer is already replaced (design/tokens.css,
design/tailwind.config.ts — both generated, do not hand-edit).
This pass updates the components that consume it.

For each primitive in src/components/ui/ and src/components/tools/:

1. BORDERS — replace every sf-border / sf-border-strong / rgba(255,255,255,x)
   border with the right functional token:
     panel edges, dividers        → sf-line
     table rules                  → sf-line-hairline
     inputs, buttons, selects,
     checkboxes, toggles, tabs    → sf-line-interactive   (WCAG 1.4.11)
     hover / active / selected    → sf-line-emphasis

2. STATES — delete every disabled:opacity-* . Replace with
   sf-disabled-bg / sf-disabled-line / sf-disabled-text.
   Grep the whole repo for `opacity-4` and `opacity-3` and justify
   every remaining instance or remove it.

3. FOCUS — every interactive element gets a visible :focus-visible ring.
   tokens.css sets a global default; remove any component rule that
   suppresses it. Verify by tabbing through a tool page end to end.

4. TEXT — replace t5 everywhere. If it was ambient, use t4 at a smaller
   size. If it was content, use t3. Replace any accent-coloured body text
   with the matching -text token.

5. TYPE — mono eyebrows to text-sf-mono (12px/0.10em/600). Body to
   text-sf-body (16px). Studio editor to text-sf-prose (18px).
   Remove any tracking on text under 12px.

6. TARGETS — every button, icon button, tab, and toggle gets min-h-hit.
   Icon-only buttons get an aria-label.

7. MEASURE — wrap running prose in .sf-measure. The Studio editor gets a
   measure control, defaulting to 68ch.

8. AMBIENT — StellarBackground, TextureOverlay, DataBurstOverlay,
   VideoBackground and the starfield all multiply their opacity by
   var(--sf-ambient). Add a Display setting (Standard / High Contrast /
   Reduce Ambient) persisted to localStorage, writing data-contrast and
   data-ambient on <html>.

Constraints:
- Do not change any layout, spacing, or copy in this pass.
- Zero radius holds. Tag stays 2px; simulator canvases keep rounded-lg.
- Ship's Voice unchanged.
- After each component, screenshot it and confirm against the before/after
  in design/legibility-proof.html.

Finish with /sf-contrast across the repo, then /sf-ship.
```

---

## Regenerating

```bash
cd design
python3 derive.py    # prints the full audit table, writes palette.json
python3 emit.py      # writes tokens.css + tailwind.config.ts
python3 proof.py     # rebuilds legibility-proof.html
```

Run `/sf-contrast` in CI. A merge that introduces a failing pair should not land.

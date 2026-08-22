---
description: Measure every foreground/background pair in the repo against its WCAG target. Run in CI and before any visual merge.
---

# /sf-contrast

Audit legibility. This is the automatable half of `docs/stellarforge/10-LEGIBILITY.md`.

Scope: `$ARGUMENTS` if given (a component, directory, or route), otherwise the whole repo.

## Checks

**1. Forbidden alpha borders.** Any `border` or `outline` colour expressed as `rgba(...)`, `/[0-9]{1,2}%` Tailwind opacity, or `border-white/N`. Alpha borders composite unpredictably over the starfield, grain, and video layers. Solid `sf-line-*` tokens only.

**2. Forbidden opacity states.** Any `disabled:opacity-*`, `opacity-40`, `opacity-30`, or `opacity-[0.x]` used to express a *state* rather than an animation. Report each with the token that should replace it.

**3. Retired tokens.** Any use of `t5`, `sf-border`, or `sf-border-strong`. All three are gone.

**4. Accent text misuse.** Any canonical accent token (`text-sf-crimson`, `text-sf-violet`, `text-sf-stellar`, `text-sf-magenta`) applied to text under 24px. These must use the `-text` stop.

**5. Measured pairs.** For every colour pair you can resolve statically — component foreground against its declared background — compute the ratio and compare to the target table in `10-LEGIBILITY.md`. Report every pair below target with file, line, computed ratio, and required ratio.

**6. Focus.** Any interactive element (`button`, `a`, `input`, `select`, `textarea`, `[role="button"]`, `[tabindex]`) with `outline: none`, `outline-0`, or `focus:outline-none` and no replacement `:focus-visible` treatment.

**7. Hit targets.** Any button, icon button, tab, or toggle whose computed height is under 44px. Flag icon-only buttons missing `aria-label`.

**8. Small tracked text.** Any `letter-spacing` / `tracking-*` applied at a font size under 12px.

**9. Unbounded measure.** Any container rendering running prose with no `max-w` and no `.sf-measure`.

**10. Ungated ambient.** Any fixed-position decorative layer whose opacity does not multiply `var(--sf-ambient)`.

**11. Colour-only signalling.** Any error, warning, or success state conveyed by colour alone, with no icon, prefix, or text label.

**12. Generated-file drift.** Confirm `tokens.css` and `tailwind.config.ts` match the output of `design/derive.py && design/emit.py`. If they differ, someone hand-edited a generated file — report it as blocking.

## Output

Ship's Voice, mono:

```
// CONTRAST AUDIT · <date>

PAIRS MEASURED            412
BELOW TARGET               17     ← LEGIBILITY
ALPHA BORDERS              23     ← FORBIDDEN
OPACITY STATES              9     ← FORBIDDEN
RETIRED TOKENS IN USE      31
ACCENT TEXT MISUSE          6
MISSING FOCUS RINGS        14     ← WCAG 2.4.7
UNDERSIZED TARGETS         11     ← WCAG 2.5.8
TRACKED SMALL TEXT          8
UNGATED AMBIENT LAYERS      4
GENERATED FILE DRIFT        0

// FINDINGS
[blocking] <file:line> · <what> · measured X:1, needs Y:1 · <token to use>
...
```

Order: generated-file drift > below-target pairs > missing focus > alpha borders > opacity states > retired tokens > everything else.

Do not fix anything. Report only, then name the three fixes with the widest blast radius — usually a shared primitive rather than a page.

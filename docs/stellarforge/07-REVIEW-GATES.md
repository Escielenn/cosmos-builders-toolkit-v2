# 07 · REVIEW GATES

> The tests that catch philosophy drift. Run before every merge.
> `/sf-ship` runs the automatable ones. The manual ones are manual on purpose.

---

## The Five Tests

### 1. The Two-Hop Test *(manual, per feature)*

> From any field in any tool, can you reach the prose it affects in **two clicks or fewer** — and from any sentence in the Studio, can you reach the field that governs it in two clicks or fewer?

Pick three fields at random. Walk it both directions. If any path is three hops or a dead end, the feature is not done.

This is the Prime Law made checkable.

### 2. The Orphan Sweep *(automated — `/sf-audit`)*

> Every user input maps to a canon predicate or carries `ephemeral: true` with a reason.

Fails on: unmanifested tools, fields absent from both `produces` and the ephemeral list, predicates not in the vocabulary, two producers for one predicate.

### 3. The Consequence Test *(manual, per tool)*

> Change one upstream number. At least one downstream surface must visibly change, **or** the tool must explicitly say `NO DEPENDENTS ON FILE`.

Silence is the failure state. A writer who changes a value and sees nothing happen learns that the connections aren't real, and that lesson doesn't wash out.

### 4. The Squint Test *(manual, per surface)*

> Step back six feet from the screen, or blur it. **Can you still tell where the panels are and which thing is the button?**

Structure should survive before detail does. The old palette failed this on every screen: panels separated at 1.04:1 and their borders sat at 1.20:1, so a blurred screenshot was a single flat rectangle.

### 5. The Ship Test *(existing, from the design system)*

> If the screen feels like a ship, ship it. If it feels like a website, start over.

Plus the interconnection twin: **if the writer can't feel the world pushing back on the page, start over.**

---

## Pre-merge checklist

### Interconnection

- [ ] Manifest present, valid, and passing `/sf-audit`
- [ ] Every non-ephemeral field maps to a vocabulary predicate
- [ ] Tool opens pre-filled from canon; canon-sourced values carry provenance chips
- [ ] Reads go through `src/canon/`, never direct Supabase
- [ ] Writes go through `canon.assert()`; conflicts surface as a diff, never a silent overwrite
- [ ] At least one derivation carries a `narrative` string that states a *consequence*, not a restatement
- [ ] `studio` block declares a real rail contribution, verified by opening a scene
- [ ] `upstream` / `downstream` populated and driving the callouts
- [ ] Two-Hop Test passes in both directions
- [ ] Consequence Test passes

### Data safety

- [ ] No path can overwrite `confidence:'canon'` without explicit user confirmation
- [ ] No path can modify a user's prose
- [ ] Recompute marks stale; it does not silently recalculate
- [ ] Structural operations snapshot first
- [ ] RLS verified on every new table and view

### Time

- [ ] Every fact write sets `valid_from` (or explicitly null for always-true)
- [ ] Every graph read takes an epoch and defaults to the world's present
- [ ] Nothing assumes the present epoch is the only epoch

### Legibility  *(new — see `10-LEGIBILITY.md`)*

- [ ] `/sf-contrast` passes with zero blocking findings
- [ ] `tokens.css` / `tailwind.config.ts` unmodified by hand — regenerate, never edit
- [ ] Every border uses a solid `sf-line-*` token; no alpha, no `border-white/N`
- [ ] Operable elements use `sf-line-interactive` or better (≥3:1, WCAG 1.4.11)
- [ ] No `disabled:opacity-*` — states use `sf-disabled-*` tokens
- [ ] No `t5`, no `sf-border`, no `sf-border-strong` anywhere
- [ ] Accent-coloured body text uses the `-text` stop
- [ ] Visible `:focus-visible` ring on every interactive element; verified by tabbing
- [ ] Hit targets ≥44px; icon-only buttons carry an `aria-label`
- [ ] No `letter-spacing` under 12px
- [ ] Running prose bounded by `.sf-measure`
- [ ] No state signalled by colour alone
- [ ] Text over video or imagery has `.sf-scrim`
- [ ] Any new decorative layer multiplies `var(--sf-ambient)`
- [ ] Renders correctly under `prefers-contrast: more` and `[data-contrast="high"]`

### Design system

- [ ] Zero radius. Two documented exceptions only: `Tag` at 2px, and simulator canvases, which use product teal on `#09090B` with `rounded-lg` per the Tidelock reference (legacy cyan `#00D4FF` is retired — SF-II settled decision #3 — and must never reappear). Everything else is `rounded-none`.
- [ ] No more than three surface layers stacked
- [ ] One focal moment per screen
- [ ] Mono only for numbers, coordinates, IDs, timestamps
- [ ] Motion 120–280 ms, no springs, no reveals over 300 ms outside ambient telemetry
- [ ] Colour carries meaning — teal Integration, amber Physics, crimson Stop
- [ ] Every scrollable container has `sf-sb`
- [ ] Body copy is `text-t1`/`text-t2`, never `text-t3` for running text
- [ ] Tokens, never hardcoded hex
- [ ] No new always-on chrome layer (or: name the one it replaces)

### Voice

- [ ] All system strings in Ship's Voice — uppercase, no emoji, no exclamation points
- [ ] Past tense for confirmations, imperative for actions
- [ ] Empty states use the VelocityDial pattern, never "Nothing here yet!"
- [ ] Errors are `SYSTEM FAULT` + crimson bracket + mono detail
- [ ] Supabase/PostgREST errors mapped before display

### The Studio, specifically

- [ ] Nothing blocks a keystroke
- [ ] Everything in the rail disappears in Focus mode
- [ ] The rail fits one screen without scrolling
- [ ] Advisories are gutter-only, dismissible, and off by default
- [ ] Autosave verified; word count and target unaffected by the change

### Density

- [ ] Scroll-to-first-input under 400 px on tool pages
- [ ] No new modal if an existing one can be extended (the inventory is already 14+)
- [ ] The 1024–1279 px band renders gracefully (the right rail's weak spot)

---

## Weekly ritual

Run `/sf-audit` on Monday. It reports:

```
// INTERCONNECTION AUDIT · <date>

TOOLS MANIFESTED           18 / 27
PREDICATES DECLARED        214
DUPLICATE PRODUCERS         3     ← FORBIDDEN: PARALLEL TRUTH
DEAD-END READOUTS           7     ← LAW III
UNBOUND TOOLS               4     ← PRIME LAW
DERIVATIONS W/O NARRATIVE  11
CANON BYPASSES              9     ← BYPASSING src/canon
ORPHAN ENTITIES            31

CROSS-SURFACE REFERENCE DENSITY   4.2 facts / document  (prev 3.8)
```

That last line is the one metric from `01-NORTH-STAR.md`. If tool count rises while density stays flat, the product is drifting toward World Anvil with better fonts. Say so out loud when it happens.

---

## When a gate blocks something good

Gates are not sacred; the Constitution is. If a gate is blocking genuinely valuable work:

1. Name which law the exception touches.
2. Write it in `docs/stellarforge/AMENDMENTS.md` with a date and a reason.
3. Ship it.

An exception recorded three times is a law that has already been repealed in practice. Amend it properly or enforce it properly — drifting between the two is the only outcome that's actually bad.

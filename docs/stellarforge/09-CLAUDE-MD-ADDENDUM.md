# 09 · CLAUDE.md ADDENDUM

> Append this block to the StellarForge repo's root `CLAUDE.md`.
> It is written to be read by Claude at the start of every session — short, absolute, and pointing at the deeper docs.

---

```markdown
## THE PRIME LAW OF THIS CODEBASE

StellarForge is Scrivener × Stellaris × World Anvil: one instrument in which
deciding what is true about a universe and writing that universe are the same
motion.

**The tools and the writing space are one organism.** Anything that weakens
the connection between them is a regression, regardless of how good it looks
in isolation.

Every change is measured against one question:

> Does this shorten the distance between a number the writer decided and a
> sentence the writer wrote?

Full text: `docs/stellarforge/00-CONSTITUTION.md`. Read it before any
architectural decision. The seven laws are not aspirational.

### The seven laws, in brief

1. **No orphan data.** Every input becomes a Fact on the Canon Graph or is
   explicitly tagged ephemeral. There is no third state.
2. **Provenance up, consequence down.** Every fact knows who asserted it and
   what breaks if it changes.
3. **Every surface is two-way.** No dead-end readouts. Display implies edit,
   or a one-click path to the place you edit.
4. **Prose is a first-class citizen of the graph.** Scenes bind to facts.
   Prose can propose canon.
5. **Time is an axis, not a page.** Facts carry validity intervals.
6. **Simulation is canon-generating, not decorative.**
7. **One focal surface per intent.** Before adding a view, name the view it
   absorbs.

### Non-negotiables

- All world data reads and writes go through `src/canon/`. A component that
  imports Supabase to read world data is a Constitution violation.
- Every tool has a `manifest.ts` conforming to `ToolManifest`. No manifest,
  no merge.
- Predicates come from `src/canon/vocabulary.ts`. Adding one is deliberate —
  use `/sf-fact`. Never rename a predicate; deprecate and alias.
- `canon.assert()` never silently overwrites `confidence:'canon'`.
- Nothing ever modifies the user's prose.
- Recompute marks stale and offers. It does not silently recalculate.
- No new always-on chrome layer without naming the one it replaces.

### Before you build

| If you're... | Read |
|---|---|
| making any architectural call | `00-CONSTITUTION.md` |
| touching the data model | `02-ARCHITECTURE.md` |
| adding or wiring a tool | `03-TOOL-CHARTER.md` + `08-VOCABULARY.md` |
| touching the Studio | `04-STUDIO-CHARTER.md` |
| touching any simulator | `11-SIMULATOR-CONSTELLATION.md` |
| proposing a new feature | `05-NEW-SYSTEMS.md` (the four questions) |
| deciding what's next | `12-SESSION-SEQUENCE.md`, then `06-BUILD-ORDER.md` |
| about to merge | `07-REVIEW-GATES.md` |
| themes, IA, or what to build next at scale | `13-THE-LIFT.md` |
| anything WebGL / three.js / the Atlas / sim rendering | `14-RENDER-ENGINE.md` |

### Commands

`/sf-audit` · `/sf-new-tool` · `/sf-wire` · `/sf-fact` · `/sf-situation` ·
`/sf-studio-bind` · `/sf-contrast` · `/sf-ship`

Use `/sf-wire` for retrofitting existing tools — one tool per session, never
batched.

### Design system

The visual language is governed by the `stellarforge-design` skill and the
design handoff README. Summary of the rules most often broken:

- Zero radius everywhere. Two documented exceptions: Tag (2px), and
  simulator canvases (product teal on #09090B, `rounded-lg`, per the
  Tidelock reference chrome — legacy cyan #00D4FF is retired product-wide,
  SF-II settled decision #3, and must never reappear). The site/simulator
  radius split is intentional and is a known source of drift — do not "fix"
  it by unifying without asking.
- MD Nichrome for H1 only. Jura for eyebrows and section labels. DM Sans for
  body and buttons. JetBrains Mono for numbers, coordinates, IDs, timestamps
  — never body copy.
- Three surface layers maximum: void → surface → elevated. Modals sit on
  `elevated` above `--sf-scrim`; there is no fourth plane.
- One focal moment per screen.
- Motion 120–280ms. No springs. No reveals over 300ms outside ambient
  telemetry.
- Colour is a cascade layer: amber = Physics, stellar blue = Worlds,
  violet = Lore, crimson = Stop, teal = Integration. These never move.
- **`sf-primary` is a role, `sf-teal` is a meaning.** Buttons, focus, selection,
  active nav, links use `sf-primary` — the user chooses it (70 themes, all
  contrast-solved, `design/themes.py`). Never put a role on a named hue.
- Tokens, never hardcoded hex.
- Every scrollable container gets `sf-sb`.

### Legibility — non-negotiable

`tokens.css`, `tailwind.config.ts`, `themes.css` (+ `themes.json`) are **GENERATED** by
`design/derive.py` + `design/emit.py` + `design/themes.py`. Every value is solved against a WCAG
target in OKLab. Hand-editing either file is a blocking review failure.
To change a colour, change its target and re-run both scripts.

Full audit and rationale: `docs/stellarforge/10-LEGIBILITY.md`.

- **No alpha borders.** Solid `sf-line-*` tokens only — alpha composites
  unpredictably over the starfield, grain, and video layers.
    - `sf-line-hairline` table rules · `sf-line` panel edges
    - `sf-line-interactive` anything operable (WCAG 1.4.11, ≥3:1)
    - `sf-line-emphasis` hover, active, selected
- **No opacity for states.** Disabled uses `sf-disabled-bg` /
  `sf-disabled-line` / `sf-disabled-text`. `opacity-40` guarantees nothing.
- **`t5` is retired.** Nothing readable lives below `t4`. If it should
  recede, make it smaller — never fainter.
- **Accent text uses the `-text` stop.** `--sf-crimson` for the error
  border and icon; `--sf-crimson-text` for the sentence. Never the reverse.
- **Every interactive element has a visible `:focus-visible` ring.** No
  component may suppress the global default.
- **44px minimum hit target** (`min-h-hit`). Icon-only buttons need an
  `aria-label`.
- **No tracking under 12px.** Wide tracking on small text destroys word
  shape — it was the worst legibility defect in the old system.
- **Running prose is bounded** by `.sf-measure` (68ch).
- **Colour is never the only signal.** Errors carry an icon or `//` prefix.
- **Text over video or imagery gets `.sf-scrim`.**
- **New ambient layers multiply `var(--sf-ambient)`** or they don't ship.
- Body copy is `text-t1` or `text-t2`. Never `text-t3` for running text.

- **One definition per token.** `tokens.css`/`themes.css` own every `--sf-*`
  and `--t*` name. `src/index.css`'s legacy `.dark` block maps shadcn's
  semantic variables onto the generated `--x-hsl` twins and defines nothing
  of its own. Tailwind utilities read `rgb(var(--x-rgb) / a)`, which is
  what makes `text-t1` follow the active theme. Redefining a token name
  anywhere else is Parallel Truth and `/sf-contrast` check 14 blocks it.

Run `/sf-contrast` before any visual merge.

### Ship's Voice

All system strings: uppercase, no emoji, no exclamation points, no second-
person excitement. Past tense for confirmations, imperative for actions.

  WORLD FILE SECURED.
  PARAMETERS OUTSIDE OPERATIONAL RANGE.
  CLAIM DETECTED. NOT ON FILE. ADOPT?
  PARAMETER REVISED. 6 DERIVED VALUES STALE. 4 DOCUMENTS AFFECTED.

Never: "Oops!", "Great job!", "Let's go!", emoji, or exclamation points.

Map PostgREST errors before display. `23505` → `RECORD CONFLICT. ENTRY
ALREADY ON FILE.`

### The two one-line tests

> If the screen feels like a ship, ship it. If it feels like a website,
> start over.

> If the writer can't feel the world pushing back on the page, start over.
```

# AMENDMENTS

> The Constitution can be amended. It cannot be quietly ignored.
> When a law or gate blocks work that is genuinely right, record the exception
> here — then ship.

An exception recorded three times is a law that has already been repealed in
practice. Make it official or make it stick. Drifting between the two is the
only outcome that's actually bad.

## Format

```
## YYYY-MM-DD · <short title>

**Touches:** Law <n> — <name>  ·  or  Gate: <gate name>
**Scope:** <the specific surface, tool, or component>
**Why:** <what the law would have cost here, concretely>
**Instead:** <what you did>
**Revisit:** <a date, a milestone, or "permanent">
```

## Example

```
## 2026-09-14 · Simulator canvases keep rounded-lg

**Touches:** Design system — zero radius
**Scope:** the five simulator canvases only
**Why:** the Tidelock reference chrome is the most recently tightened surface
  in the app and unifying it with the site idiom would undo that work for no
  legibility gain — the canvases are self-contained and carry no form controls.
**Instead:** documented as the second permitted radius exception alongside Tag.
**Revisit:** permanent, unless the simulators gain form controls.
```

---

## Log

## 2026-09-06 · RESOLVED — the two entity models are one (F3)

**Touches:** the 2026-09-03 finding below; Forbidden Pattern: Parallel Truth
**Scope:** `entities` + `entity_connections` → `world_entries` + `world_connections`
**Decisions taken** (the three the proposal left open):
  1. **Fold direction:** `entities` → `world_entries`, as proposed. The facts,
     the chronicle and the manuscript already point at `world_entries`.
  2. **Collision policy:** the `world_entries` row is kept, the `entities`
     row's edges are re-attached to it, and every collision is written to
     `public.f3_fold_report` and printed by the migration.
  3. **Renderer:** `WorldConnectionsGraph`, with `CascadeFilterBar`,
     `GraphSearch` and `TimelineScrubber` lifted into its toolbar. The other
     two renderers, and a third nobody had mounted, are deleted.
**One exception worth naming:** the house rule is *ids are the only identity*.
  The two tables share no id — that is the whole finding — so the fold matches
  on `(world_id, entry_type, title)`. That is a ONE-TIME migration heuristic
  whose every match is written to a report for a human to read, never a
  runtime one. Nothing in the app resolves an entity by name, before or after.
  `public.entity_fold_map` keeps `entities.id → world_entries.id` permanently
  so a legacy id in an old URL still resolves by id.
**Still open:** the epoch scrubber in the Web view is local until F6 puts the
  global one in the top bar; the sidebar's Codex and Entities tabs are now two
  views of the same rows, which F6 folds.
**Applied:** 2026-09-06, after a read-only dry run. 39 entities moved, **0
  collisions**, 0 near-duplicates, 50 edges folded (53 entry-to-entry edges
  now on `world_connections`), 0 edges left without a cascade stage, 0
  orphaned fold-map rows. Nothing needed a human decision.
**Revisit:** when a later migration drops `entities` / `entity_connections`,
  which this one leaves in place, read-only, for one release.

## 2026-09-03 · FINDING — two entity models (`world_entries` vs `entities`)

**Touches:** 02-ARCHITECTURE (Entity), Forbidden Pattern: Parallel Truth
**Scope:** the whole app; surfaced while building F1
**What:** the codebase carries TWO entity tables. `world_entries` is what
  `entity_worksheets`, `chronicle_events.linked_entry_id` and
  `writing_entry_entities` reference — worksheets, facts, chronicle and
  manuscript mentions all resolve here. `entities` + `entity_connections`
  is the graph model (typed edges, cascade stage, graph_x/y) used by
  EntitySidebar, EntityTreeView, the @mention extension and `scene_pins`.
  A planet can exist in both, with different ids, and nothing joins them.
**Decision for F1:** `:entityId` means `world_entries.id`. That is where
  the facts are, and the Prime Law says facts → sentences. The page's
  Relations section reads `world_connections` (untyped) for now.
**Instead (F3, "one graph"):** fold `entities`/`entity_connections` into
  `world_entries`/`world_connections` — migrate `entity_connections` rows
  onto typed `world_connections.connection_type` (the vocabulary in
  `entity-graph-types.ts` RELATIONSHIP_TYPES_BY_STAGE is the right one),
  repoint `scene_pins.entity_id` and the EntityMention extension, then
  drop `entities`. Until then `sf-navigate-entity` (mentions) and
  `sf-navigate-element` (wiki links) go to different places.
**Revisit:** F3.

## 2026-09-02 · Generated twins (`--x-hsl`, `--x-rgb`) are the ONLY bridge to the shadcn layer

**Touches:** Legibility — "tokens.css is the single source of truth"
**Scope:** `src/index.css` `.dark` block; `tailwind.config.ts` colour values
**Why:** the block redefined 17 token names (`--sf-void`, `--t3`, `--sf-teal` …)
  as HSL triplets with its own numbers. Tailwind hoists `@layer base` after
  the tokens import, so the legacy numbers won at runtime: measured on the
  built site, `--t3` was `rgba(255,255,255,.45)` and `var(--sf-teal)` used as
  a colour was the invalid string `157 80% 42%`. Every solved value in
  tokens.css was dead on arrival, and themes could not move the background.
**Instead:** `emit.py`/`themes.py` emit `--x-hsl` (for `hsl(var(--x))`
  consumers) and `--x-rgb` (for Tailwind's `<alpha-value>`) twins of every
  solved token; the `.dark` block now only maps shadcn semantics onto twins;
  `tailwind.config.ts` colours are `rgb(var(--x-rgb) / <alpha-value>)`.
  Also fixed on the way: `--primary-foreground` was pure white on teal
  (2.4:1) and `--destructive-foreground` white on crimson (3.1:1); both now
  use the solved on-accent labels.
**Revisit:** when the legacy `.dark` block is deleted outright (Phase 5).

## 2026-09-02 · Cyan returns as a user-selectable PRIMARY ROLE, not as a meaning hue

**Touches:** Design system — SF-II settled decision #3 (legacy cyan `#00D4FF` retired)
**Scope:** `design/themes.py` `PRIMARY_CHOICES` and the `[data-theme="*-cyan"]` blocks only
**Why:** the owner asked for user-switchable colour aesthetics ("green, cyan,
  etc. — yes, I'm reversing"). Decision #3 retired cyan as a *brand meaning*.
  It stays retired in that sense: `sf-cyan` remains an alias to teal, no
  component may write `#00D4FF`, and simulator chrome keeps product teal by
  default. What changes is that `--sf-primary` — the *role* every button,
  focus ring, and link uses — can be set to a contrast-solved cyan by the
  user, exactly like emerald, azure, violet, amber or magenta.
**Instead:** roles live on `sf-primary`; meanings live on named hues. See
  `13-THE-LIFT.md` §0 and the `stellarforge-design` skill.
**Revisit:** if a theme-cyan ever leaks into a `sf-cyan` call site, that is a
  role-on-a-hue bug (`/sf-contrast` check 12), not a reason to reopen this.

## 2026-09-02 · The void is the DEFAULT base, not the only base

**Touches:** `10-LEGIBILITY.md` "void is untouchable"
**Scope:** `design/themes.py` BASES (10 bases, charcoal → sky)
**Why:** same request. Void·Teal is the identity and the default; the
  contrast targets are the constraint, and every base is solved against them.
**Revisit:** never, unless a base fails a target — then fix the base.

## 2026-10-17 · Five design decisions settled after the 0.7414 uplift

**Touches:** Design system (stellarforge-design skill, CLAUDE.md)
**Scope:** typography, simulator radius, cascade colours, scale palettes, archived state
**Why:** the uplift surfaced five places where the written rules and the
  shipped product disagreed. Each was settled toward what ships, or toward
  the rule that already existed, rather than toward a new direction.
**Instead:**
  1. *Lora is the sanctioned writer voice* (index.html, SF-II #4): writing
     surfaces plus marketing "Studio meld" accents. Never instrument chrome
     or buttons. CascadeFooter on tool pages moved off it. "Four fonts only"
     now reads "four interface fonts plus Lora".
  2. *Simulators are square.* No simulator ever shipped `rounded-lg`; the
     exception is retired. Tag (2px) is the only rounded element.
  3. *Cascade colours follow the tool categories:* amber Physics, azure
     Environment, emerald Biology, magenta Psychology, stellar Mythology,
     violet Culture, teal Integration, crimson Stop. About and Getting
     Started had Culture as teal and as orange; both now violet. The old
     "stellar = Worlds" line never matched the code and is corrected.
  4. *Ordered scales use a distinct hue per step* (emerald → amber →
     crimson → magenta). Amber and amber-warm never sit on adjacent steps.
     Applied to Time Dilation, LexDrift, Drake, Space Expansion barriers and
     surface-gravity escape regimes.
  5. *Archived is stored, not disabled.* Archived world cards keep the
     normal surface with a dashed edge and the ARCHIVED badge; disabled
     tokens stay reserved for things that cannot be operated.
**Revisit:** permanent unless the owner reopens one.

## 2026-10-17 · Softening pass: quieter edges, fields as wells

**Touches:** Design system — line tokens, 10-LEGIBILITY rule 6
**Scope:** product-wide
**Why:** Jason: borders "too close to the touch, too opaque". With panel edges at 2.4:1 and every operable thing boxed at 3.1:1, the Studio read as a grid of cages, worst on the writing page.
**Instead:** re-solved `line-hairline` 1.7 → 1.32, `line` 2.4 → 1.7, `line-emphasis` 4.6 → 4.0 (`line-interactive` unchanged at 3.1). Fields became recessed wells whose baseline alone carries 1.4.11 (`.sf-field`, generated input defaults). Labelled buttons/tabs moved to `line` (`.sf-quiet`). The editor lost its frame. Scrollbar thumb moved up to `line-interactive` and now follows the theme. High Contrast mode restores strong edges.
**Revisit:** permanent

## 2026-10-19 · The facts table stores only what cannot be derived; projected facts stay computed on read

**Touches:** Law I — No orphan data; 02-ARCHITECTURE "Phase A" (projection run on save)
**Scope:** `public.facts` (migration `20261019_canon_facts.sql`), `src/canon/`, `src/lib/writing/world-index.ts`
**Why:** 02 Phase A has each tool's projection write `Fact[]` rows on save. Doing that now would copy every worksheet value into a second store that can drift from its blob (Parallel Truth by construction) and needs a backfill of every existing worksheet, while the blob is still the write path. The read-time projection (`worksheet-facts` → `world-index`) already gives every surface the same answer.
**Instead:** `public.facts` holds only asserted facts: prose, manual, sim-promoted, import, and tool writes made through `canon.assert()`. `canon.facts()` merges those rows with the projection on read, precedence **canon > proposed > projected** per (subject, predicate); losers stay attached (`outranks`, `conflicted`) and the Studio shows every fact with a CANON / PROPOSED / PROJECTED tag, so a proposal that outranks a worksheet value still shows the disagreement. Projected facts are never written to the table and their refs and values are unchanged. The lead's precedence puts `proposed` above `projected`; 12-SESSION-SEQUENCE C2 said only canon outranks projection. The merge keeps C2's intent by flagging the conflict instead of hiding it. Pipeline keys (`surfaceGravity`) are not renamed: `src/canon/vocabulary.ts` aliases them to predicates, and anything unmapped resolves to `legacy.<key>`. The deprecated spellings Solaris publishes (`planet.orbital_distance_au`, `planet.mass_earths`, `star.luminosity_lsun`) are declared there too; `published-facts.ts` keeps its own `PREDICATE_ALIASES` for now, and a test holds the two in agreement.
**Revisit:** Phase C (graph authoritative), one tool at a time via `/sf-wire`. Also C4: validity intervals (`valid_from/valid_to`) are not on the table yet.

## 2026-10-19 · Owners assert on save (refines the computed-on-read note)

**Touches:** AMENDMENTS 2026-10-19 (projected facts computed on read)
**Scope:** the nine manifested tools in `src/canon/ownership.ts` (SINGLE_HOME)
**Why:** one home per value needs the owner's value on file, or consumers have nothing stable to read and continuity can't resolve to one value.
**Instead:** an owning tool asserts its owned predicates as canon after a successful worksheet save (a sheet re-saving its own earlier value replaces it with history kept; any other differing canon value opens KEEP CANON / REPLACE). Everything else stays computed on read until Phase C.
**Revisit:** Phase C

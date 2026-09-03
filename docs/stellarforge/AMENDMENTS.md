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


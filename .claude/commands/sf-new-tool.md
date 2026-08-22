---
description: Scaffold a new graph-native StellarForge tool. Gates on the four questions before writing any code.
---

# /sf-new-tool

Create a new tool: `$ARGUMENTS`.

## The gate

A product with 27 tools and a wiring debt does not need tool 28 unless it earns it. Before anything else, answer the four questions from `docs/stellarforge/05-NEW-SYSTEMS.md` and show me the answers:

1. **What predicates does it produce that nothing else produces?**
2. **What does it consume that already exists?**
3. **What does it change about how a scene reads?** (If you can't answer this, it's a calculator, not a StellarForge tool.)
4. **What existing surface does it absorb or replace?**

If question 3 has no good answer, say so and recommend against building it. That is a valid outcome of this command.

Also check: does `06-BUILD-ORDER.md` say we're in a phase where new tools are frozen? If so, say that too.

## After I confirm

Read `03-TOOL-CHARTER.md`, `08-VOCABULARY.md`, and the `stellarforge-design` skill.

**1. Vocabulary first.** Any new predicate goes into `src/canon/vocabulary.ts` before the tool exists. Follow the naming rules — no tool names in predicates, units on the value, snake_case. Run `/sf-fact` logic: check for near-duplicates of existing predicates before adding.

**2. `src/tools/<id>/manifest.ts`** — complete, including the `studio` block. Write the manifest *before* the components; it's the spec.

**3. Derivations** — register in `src/canon/derivations/`. Every one needs a `narrative()` returning one Ship's-Voice sentence of consequence.

**4. Components** — use `ToolPageLayout` and existing primitives from `src/components/ui/` and `src/components/tools/`. Do not invent new panel, section, or sidebar patterns. Watch scroll-to-first-input: target under 400px.

**5. Situations** — if the tool's outputs can sit in productive tension with other facts, author the rule now (`/sf-situation`), not later.

**6. Wire the rail** — the tool's `studio` contribution must be visible in a real document before this is done.

**7. Route + registry** — add to the tools index with correct category, type (Worksheet / Calculator / Simulator / Cartographer), accent colour, and Pro gating.

## Simulators specifically

If `kind: 'simulator'`, implement the SimRun contract from `02-ARCHITECTURE.md`:

- ingest canon on open (never make the user retype the world)
- emit a deterministic snapshot on run: `(seed, params) → outputs`
- offer `PROMOTE N VALUES TO CANON` with a reviewable diff — never automatic
- store `(seed, params)`, not canvas state
- simulators use product teal on `#09090B` with `rounded-lg`, per the documented split — match the Tidelock reference chrome (legacy cyan `#00D4FF` is retired, SF-II settled decision #3 — never use it)

## Finish

Run the Definition of Done checklist from `03-TOOL-CHARTER.md`, then `/sf-audit` scoped to the new tool.

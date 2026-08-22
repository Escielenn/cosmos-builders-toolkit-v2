---
name: stellarforge-canon
description: "StellarForge's Canon Graph — the fact/entity/derivation model that connects the 27 worldbuilding tools to the Studio writing space. Use this skill whenever working in the StellarForge codebase on data modeling, tool wiring, the Studio rail, the cascade, situations, the Chronicle, or any question of how one surface should know about another. Also trigger when Jason mentions the canon graph, facts, predicates, cascade, situations, interconnection, or asks why two StellarForge tools don't talk to each other. This is the architectural source of truth; the stellarforge-design skill is the visual source of truth."
---

# StellarForge Canon Graph

The architecture that makes StellarForge **Scrivener × Stellaris × World Anvil** instead of 27 calculators next to a text editor.

Full documents live at `docs/stellarforge/`. This skill is the compressed version — enough to make correct decisions without loading everything.

---

## The Prime Law

**The tools and the writing space are one organism.** Anything that weakens the connection between them is a regression, regardless of how good it looks in isolation.

Measure every change against: *does this shorten the distance between a number the writer decided and a sentence the writer wrote?*

## The seven laws

1. **No orphan data.** Every input becomes a Fact or is explicitly ephemeral.
2. **Provenance up, consequence down.** Every fact knows its source and its blast radius.
3. **Every surface is two-way.** No dead-end readouts.
4. **Prose is a first-class citizen.** Scenes bind to facts; prose can propose canon.
5. **Time is an axis, not a page.** Facts carry validity intervals.
6. **Simulation is canon-generating, not decorative.**
7. **One focal surface per intent.** Name what a new view absorbs.

## The inversion

The graph owns the data. Tools are lenses over it.

- **worksheet** = a curated question-set that reads some facts and writes others
- **calculator** = a registered derivation function with a UI
- **simulator** = a bulk fact generator emitting a provenanced snapshot
- **Studio** = a fact consumer with a claim detector
- **Codex / Wiki / Graph / Connections / Chronicle / Cartographer** = views of one substrate, differing only in projection

## The five node kinds

| Node | Is | Key fields |
|---|---|---|
| **Entity** | a thing that persists | `type` (closed vocabulary), `name`, `parent_id`, `epoch_range` |
| **Fact** | a typed assertion | `subject_id`, `predicate`, `object`, `confidence`, `valid_from/to`, `source` |
| **Derivation** | how a fact was computed | `inputs[]`, `output`, `fn`, **`narrative`** |
| **Doc / DocBinding** | prose as a node | `pov_entity_id`, and bindings of kind `mention \| depends_on \| asserts \| set_in \| pov` |
| **Situation** | tension made visible | pure predicate over the graph, cited, actionable |

`confidence: 'canon' | 'working' | 'proposed' | 'contradicted'` — prose-captured claims always enter as `proposed`.

**The `narrative` field on a derivation is not garnish.** `1.4 g` is data; *"Stairs are a hazard. Architecture goes low and wide."* is the product. A derivation without a narrative is one the writer will never use.

## Non-negotiables

- All world data goes through `src/canon/`. Direct Supabase reads of world data are a Constitution violation.
- Every tool has `manifest.ts` conforming to `ToolManifest` — entities, produces, consumes, derives, situations, **studio**, upstream, downstream.
- Predicates come from `src/canon/vocabulary.ts`. `<domain>.<attribute>`, snake_case, units on the value, **never a tool name in a predicate**. Never rename; deprecate and alias.
- Exactly one producer per predicate. Two producers = Parallel Truth = highest-severity bug.
- **Ids are the only truth.** Entities are identified by UUID, never by name or value
  similarity. A matcher may *suggest* a duplicate; it may never merge one. Silent
  merges destroy distinctions the writer meant to keep (forks, what-ifs, reused names).
  Every match candidate is a bug report about a missing id handoff — instrument the count
  and drive it to zero.
- `canon.assert()` never silently overwrites `confidence:'canon'`.
- Recompute marks **stale** and offers. It never silently recalculates.
- Nothing ever modifies the user's prose.
- Nothing blocks a keystroke in the Studio.

## Migration posture

Three phases, in order. **Never attempt Phase C first.**

- **A** — graph alongside blobs. Each tool gets a projection `worksheetJSON → Fact[]`, run on save. Blob is the write path; graph is the read path for everything cross-surface. This unlocks the rail, the ledger, and situations *without migrating anything*.
- **B** — graph becomes writable. Tools open pre-filled from canon; conflicts surface as a diff.
- **C** — graph becomes authoritative. New tools keep no blob; old tools migrate one at a time.

## The query surface

```
canon.facts(worldId, { subject, predicate, epoch })
canon.entity(worldId, entityId, { epoch })
canon.assert(worldId, fact)      → { conflicts, staleDerived, affectedDocs }
canon.blastRadius(factId)
canon.provenance(factId)
canon.forDoc(docId, { epoch })   // powers the Studio rail
canon.situations(worldId, { epoch })
canon.promote(simRunId, predicates[])
```

## The forbidden patterns

**Worksheet Silo** (a blob only one tool can parse) · **Link Illusion** (a foreign key that computes nothing) · **One-Way Cascade** (physics reaches culture, never reaches the page) · **Parallel Truth** (the same value entered in four tools, diverging) · **Feature Adjacency** (tool #28 while 1–27 can't talk) · **Decorative Sim** (a beautiful canvas producing no canon) · **Chrome Creep** (another always-on overlay).

## Commands

`/sf-audit` · `/sf-new-tool` · `/sf-wire` · `/sf-fact` · `/sf-situation` · `/sf-studio-bind` · `/sf-contrast` · `/sf-ship`

## The two tests

> If the screen feels like a ship, ship it. If it feels like a website, start over.

> If the writer can't feel the world pushing back on the page, start over.

---

For the visual language — colour, type, motion, Ship's Voice — use the `stellarforge-design` skill. This skill governs structure; that one governs surface.

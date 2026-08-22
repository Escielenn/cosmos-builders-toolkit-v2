# 02 · ARCHITECTURE — THE CANON GRAPH

> The spine. Everything else in this bundle is a consequence of this document.
> **[NEW]** marks proposals; unmarked items describe or extend what already exists in the build.

---

## The inversion

Today, StellarForge is organized around **tools that own data**. A worksheet saves a blob; the Codex indexes the blob; the graph draws lines between blobs; the Studio rail reads a few extracted values out of blobs.

That model tops out. Every new tool adds N new adapters. Every cross-tool feature is a special case. The Check tab knows about "7 facts" because someone hand-extracted them.

The target model inverts it:

> **The graph owns the data. Tools are lenses over the graph.**

- A **worksheet** is a curated question-set that reads some facts and writes others.
- A **calculator** is a registered derivation function with a UI.
- A **simulator** is a bulk fact generator that emits a provenanced snapshot.
- The **Studio** is a fact consumer with a claim detector.
- The **Codex, Wiki, Graph, Connections, Chronicle, Cartographer** are all *views* of the same substrate, differing only in projection.

Once that's true, a new tool costs a manifest, not an integration project.

---

## The five node kinds

### 1. Entity — a thing that persists

```ts
type Entity = {
  id: UUID
  world_id: UUID
  type: EntityType          // world | galaxy | system | star | planet | moon | place |
                            // species | character | polity | culture | language | deity |
                            // vessel | artifact | route | tech
                            // (the world itself is an entity — world.* facts hang off it)
  name: string
  aliases: string[]
  parent_id?: UUID          // spatial/organizational containment
  created_by: SourceRef
  epoch_range?: [Epoch, Epoch | null]   // when this thing exists
}
```

Entities already half-exist (the Codex "Elements", the entity graph, `@mention` in the Studio). The upgrade is making **entity type a closed vocabulary** and making every tool that names something create or reuse an entity rather than storing a string.

> The single highest-value missing entity type is **character**. See `05-NEW-SYSTEMS.md`.

### 2. Fact — a typed assertion

The atom. Everything else is a view over facts.

```ts
type Fact = {
  id: UUID
  world_id: UUID
  subject_id: UUID          // entity
  predicate: Predicate      // 'planet.surface_gravity' — see 08-VOCABULARY.md
  object: FactValue         // { kind:'scalar', value:1.4, unit:'g' }
                            // { kind:'ref',    entity_id }
                            // { kind:'enum',   value:'m-dwarf' }
                            // { kind:'text',   value:'...' }
                            // { kind:'range',  min, max, unit }
  confidence: 'canon' | 'working' | 'proposed' | 'contradicted'
  valid_from?: Epoch        // null = always
  valid_to?: Epoch
  source: SourceRef
  created_at, updated_at
}

type SourceRef =
  | { kind:'tool',      tool_id: string, worksheet_id: UUID, field: string }
  | { kind:'sim',       tool_id: string, run_id: UUID, seed: string }
  | { kind:'derived',   derivation_id: string, inputs: UUID[] }
  | { kind:'prose',     doc_id: UUID, range: [number, number] }
  | { kind:'manual',    user_id: UUID }
  | { kind:'import',    provider: string, ref: string }   // e.g. NASA exoplanet archive
```

Three things this buys you immediately, none of which are possible today:

1. **One truth per predicate per subject per epoch.** The Parallel Truth failure mode becomes structurally impossible — Genesis and Atlas and Gravitas all read `planet.surface_gravity` for the same planet, so they cannot disagree.
2. **`confidence` gives prose a safe on-ramp.** Canon captured from a draft enters as `proposed`, never silently overwriting canon.
3. **`valid_from/valid_to` makes the Chronicle an axis** (Law V) with zero new storage.

### 3. Derivation — how a fact was computed

```ts
type Derivation = {
  id: string                // 'atlas.surface_gravity_from_mass_radius'
  label: string             // shown to the user in the provenance trail
  inputs: Predicate[]
  output: Predicate
  fn: (inputs: Record<Predicate, FactValue>) => FactValue
  invalidates: 'always' | 'on_input_change'
  narrative?: (out: FactValue, ins: ...) => string  // one Ship's-Voice sentence
}
```

The `narrative` field is not garnish. It is how the cascade becomes legible: *"1.4 g. Falls are 40% more punishing. Expect low ceilings, wide stances, short ladders."* That sentence is what appears in the Studio rail. **A derivation without a narrative is a derivation the writer will never use.**

Derivations form a DAG. The DAG *is* the Cascade tool — Cascade stops being a worksheet and becomes a **visualization of the live derivation graph**. That's a promotion, not a deletion.

### 4. Text — prose as a node

```ts
type Doc = {
  id, world_id, parent_id, order, kind: 'folder'|'document'
  title, synopsis, label, status, pov_entity_id?, target_words?
  body: TiptapJSON
}

type DocBinding = {          // [NEW] the load-bearing table
  doc_id: UUID
  kind: 'mention' | 'depends_on' | 'asserts' | 'set_in' | 'pov'
  entity_id?: UUID
  fact_id?: UUID
  range?: [number, number]   // character offsets in body
  strength: 'explicit' | 'inferred'
}
```

`DocBinding` is the physical implementation of Law IV. It is what lets you answer, in both directions:

- *"Which scenes break if I change this fact?"* → `SELECT doc_id FROM doc_bindings WHERE fact_id = ? AND kind='depends_on'`
- *"What is true about the world in this scene?"* → the rail.

`mention` is already implemented (the `@` and `[[` affordances in the editor). `depends_on`, `asserts`, and `pov` are the new work.

### 5. Situation — tension made visible **[NEW]**

The Stellaris layer.

```ts
type SituationRule = {
  id: string                       // 'high-g-spaceflight-ambition'
  severity: 'tension' | 'contradiction' | 'opportunity'
  reads: Predicate[]               // drives re-evaluation when any of these change
  when: (g: GraphQuery) => boolean // pure predicate over the graph
  title: string                    // 'GRAVITY WELL / EXIT COST'
  body: (g) => string              // specific, names the actual entities and values
  cites: (g) => UUID[]             // the fact ids that triggered it — required
  suggests: Array<
    | { kind:'tool',  tool_id: string }
    | { kind:'scene', prompt: string }
    | { kind:'event', epoch_hint: Epoch }
  >
}
```

Situations are **deterministic**, derived from the writer's own facts, and always cite the facts that produced them. No black-box generation. That's what makes them trustworthy enough to act on.

A `contradiction`-severity Situation is what the Studio's Check tab already gestures at. Generalize it to world level: the **Contradiction Ledger**.

---

## Storage — how to get there without a rewrite

You are on Supabase/Postgres with RLS. Do this incrementally.

### Phase A — the graph alongside the blobs

Add five tables: `entities`, `facts`, `doc_bindings`, `sim_runs`, `situations`. Leave every existing worksheet table untouched. (Derivations are code, not rows — they live in `src/canon/derivations/` and their outputs are ordinary facts with `source:{kind:'derived'}`.)

Each tool gains a **projection function**: `worksheetJSON → Fact[]`. Run it on save. The blob remains the write path; the graph becomes the read path for everything cross-surface.

This is the whole trick. **The graph is derived from the blobs at first, and only later becomes authoritative.** You get the Studio rail, the Contradiction Ledger, the Situations engine, and cross-tool prefill *without migrating a single existing worksheet*.

### Phase B — the graph becomes writable

Add the reverse: `Fact[] → worksheet field prefill`. Tools open pre-populated from canon. Conflicts surface as a diff (`CANON SAYS 1.4 g · THIS SHEET SAYS 1.1 g · [ADOPT] [OVERRIDE] [FORK]`).

### Phase C — the graph becomes authoritative

New tools write facts directly and keep no blob. Old tools migrate one at a time. Some never need to.

**Do not attempt Phase C first.** A big-bang migration of 27 tools while the save/load test pass is still an open roadmap blocker is how this project dies.

### Indexing notes

- `facts(world_id, subject_id, predicate, valid_from)` — the hot path.
- Materialize a `canon_current` view (`confidence='canon'` and epoch-current) — the Studio rail hits this on every keystroke-debounce and it must be fast.
- `doc_bindings(fact_id)` for blast-radius queries; `doc_bindings(doc_id)` for the rail.
- RLS mirrors `worlds` exactly. No new sharing semantics — a shared world shares its graph.

---

## Epochs and time

```ts
type Epoch = { value: number, scale: 'year'|'kyr'|'myr'|'gyr', label?: string }
```

One canonical numeric axis per world, with a user-defined zero and label ("Common Era", "After Landing"). The Chronicle already renders events on it (`1200 TEST`, `1540 SGFSFGSFD`, `PRESENT`); the change is that **facts join it**.

- Every read of the graph takes an epoch, defaulting to the world's `present_epoch`.
- The Codex, graph, map, and Studio rail all inherit an epoch from a single world-level scrubber.
- A Studio document may pin its own epoch (`set_in`) — so a flashback scene's rail shows the world *as it was*.

That last sentence is worth the entire implementation cost. No competitor does it.

---

## The recompute loop

When a fact changes:

1. Walk the derivation DAG forward from the changed predicate.
2. Mark dependent derived facts `stale`. **Do not silently recompute** — the writer's authorship over their world is absolute. Offer.
3. Walk `doc_bindings` forward. Mark dependent docs `canon-changed` (a badge in the binder, not a modal).
4. Re-evaluate Situation rules touching the changed predicates.
5. Emit one Ship's-Voice summary: `PARAMETER REVISED. 6 DERIVED VALUES STALE. 4 DOCUMENTS AFFECTED. REVIEW WHEN READY.`

Step 2's *offer, don't overwrite* rule is the difference between a tool writers trust and a tool that eats their work. Nothing in this architecture may ever change a user's words or a user's explicit canon without a confirmation.

---

## Simulator integration

```ts
type SimRun = {
  id, world_id, tool_id, seed: string
  params: Record<string, FactValue>       // resolved from canon where available
  outputs: Record<Predicate, FactValue>
  promoted: boolean
  created_at
}
```

Contract for all five existing simulators (Rogue, Tidelock, Exosky, ExoForge, Solaris) and every future one:

1. **Ingest canon on open.** If the world has a star class and a planet radius, the simulator opens with them loaded. Never make the user retype what the world already knows.
2. **Emit a snapshot on run.** Deterministic given `(seed, params)`.
3. **Offer promotion.** `PROMOTE 14 VALUES TO CANON` with a reviewable diff, never automatic.
4. **Stay reproducible.** Storing `(seed, params)` is enough to regenerate; don't store megabytes of canvas state.

This single contract converts five screensavers into the world's physics engine.

---

## Query surface

One module, `src/canon/`, is the only thing that touches these tables. Everything else calls it.

```ts
canon.facts(worldId, { subject, predicate, epoch })
canon.entity(worldId, entityId, { epoch })
canon.assert(worldId, fact)                 // returns { conflicts, staleDerived, affectedDocs }
canon.blastRadius(factId)
canon.provenance(factId)                    // the full chain, rendered for humans
canon.forDoc(docId, { epoch })              // powers the Studio rail
canon.situations(worldId, { epoch })
canon.promote(simRunId, predicates[])
```

If a component imports Supabase directly to read world data, that's a Constitution violation and `/sf-audit` should flag it. One door in, one door out — that is how a graph stays a graph.

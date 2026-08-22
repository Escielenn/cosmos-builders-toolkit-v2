# 04 · STUDIO CHARTER

> The writing space. Where the product ends.
> Everything upstream — 27 tools, five simulators, a galaxy map — exists to make this one surface better.

---

## Current state (observed 2026-08-16)

The Studio at `/write/:docId` already has:

- **Binder** — left column, `+ Document` / `+ Folder`, hierarchy
- **Editor** — Tiptap, `@` for entity mentions, `[[` for wiki links, H1–H3, quote, code, four colour dots
- **Right rail, four tabs**:
  - `Entities` — "Entities cross-referenced from your world's Codex appear here for @mention + pin while you write."
  - `World` — "// WORLD INFLUENCE — The environmental parameters your world runs on, and which ones this scene touches." Falls back to *"This world hasn't set its environmental parameters yet. Open the Cascade tool →"*
  - `Refs` — worksheet values as reference cards (`GLORY SAINT / CIVILIZATION LONGEVITY (YEARS) / 10000`), with `Open the wiki →` and `Open the entity graph →`
  - `Check` — *"Consistent so far. Nothing here contradicts the 7 facts your world records."*
- **Top bar** — word count, `Export`, `Board`, `Focus`
- **Footer** — `Saved · 11s ago`, `0 WORDS · 0 / 500 TODAY`

**This is further along than it looks.** The four rail tabs are exactly the right four. `Check` already reads canon facts. The scaffolding for Law IV exists; what's missing is depth in each tab and the reverse direction.

---

## Part 1 — Scrivener parity (the table stakes)

Match the 80% writers actually use. Ship these before adding graph cleverness, because a writer who can't structure a novel here will never stay long enough to see the graph.

| Feature | State | Priority |
|---|---|---|
| Binder hierarchy, drag-reorder | partial | P0 |
| **Corkboard** — index cards with synopsis, drag to reorder | `Board` button exists | P0 |
| **Outliner** — table view with metadata columns | missing | P0 |
| **Document metadata** — label, status, POV, target words, notes | `Add a synopsis` only | P0 |
| **Compile** — manuscript output (DOCX, PDF, EPUB, MD) with format presets, front/back matter, separators | `Export` exists, scope unknown | P0 |
| **Snapshots** — versioned captures with diff and restore | missing | P1 |
| **Collections** — saved sets of documents | missing | P1 |
| **Split view** — two documents, or document + reference | missing | P1 |
| **Focus / composition mode** | `Focus` exists | done |
| **Targets** — session, document, project, with deadline pacing | daily target exists | P1 |
| **Search across the binder**, with regex | missing | P1 |
| Import from DOCX / Markdown / Scrivener `.scriv` | missing | P2 |

**On import:** a `.scriv` importer is worth more than three new worksheets. Writers do not abandon a manuscript in progress to try a new tool. Let them bring the book.

---

## Part 2 — The graph bindings (why this is not Scrivener)

These are the features Scrivener structurally cannot have, because it has no model of the world.

### 2.1 — The rail, deepened

The four tabs stay. Each gets a real backing query against `canon.forDoc(docId, { epoch })`.

**`Entities`** — not a flat index. Scoped and ranked:
- entities mentioned in *this* document, first
- entities related to those by one graph hop, second
- pinnable, and a pinned entity's key facts stay visible while you write
- hovering an `@mention` in the text shows a card: type, one-line description, three most relevant facts, `OPEN CODEX →`

**`World`** — the live Cascade, scoped to this scene. Not the full parameter dump: the six-to-ten facts that *touch this scene*, determined by POV entity, setting entity, and epoch. Each rendered as its derivation `narrative`, not as a number.

```
// WORLD INFLUENCE · EPOCH 2340 · KELLIS BAND

GRAVITY          1.4 g      Stairs are a hazard. Architecture goes low, wide.
DAY LENGTH       ——         Tidally locked. No day. No dawn. No word for morning.
ATMOSPHERE       0.6 bar    Voices carry short. Shouting is useless. People stand close.
LIGHT            M4V red    Your POV species sees no blue. Do not write a blue sky.
```

That block is the product. Everything else is infrastructure for that block.

**`Refs`** — worksheet values, as today, but sorted by relevance to this document rather than by recency, and each with a provenance chip and an inline-edit affordance (Law III: no dead-end readouts).

**`Check`** — see 2.3.

**[NEW] A fifth tab: `Situations`** — story hooks derived from graph tension, scoped to this document's entities and epoch. Each is a scene seed with `INSERT AS BEAT` and `LOG TO CHRONICLE` actions.

### 2.2 — Canon Capture (prose → facts)

**The most important unbuilt feature in the product.**

Writers discover their worlds by drafting. Today, every discovery made in prose is lost to the graph unless the writer stops, opens a worksheet, and re-enters it. Nobody does that. So the world in the binder and the world in the tools diverge — the Parallel Truth failure at the worst possible seam.

The fix:

1. **Detect claims.** On a debounce, scan the paragraph for assertions about known entities: measurements, counts, colours, durations, relations, names. Start rule-based and narrow — numbers with units near an entity mention gets you most of the value. Widen later.
2. **Offer, never take.** A quiet inline affordance in the gutter — not a modal, not a popup, never anything that interrupts a sentence in flight.
   ```
   ⟡ NO FACT ON FILE: place.height
     "1.5 miles" → THE SPIRES · height
     [ADOPT AS CANON]  [WORKING]  [DISMISS]
   ```
3. **Enter as `proposed`.** Adopted claims land with `confidence: 'proposed'` and `source: { kind:'prose', doc_id, range }`. They show up in the tools as *"proposed from Chapter 3"* until the writer confirms. Canon is never silently overwritten by a draft.
4. **Bind.** Adoption writes a `DocBinding` of kind `asserts`. The prose is now the *source* of that fact — which means if the writer later deletes the sentence, the graph can say so.

Ship's Voice for the whole flow: `CLAIM DETECTED. NOT ON FILE. ADOPT?`

### 2.3 — The Contradiction Ledger

Generalize the `Check` tab from "this document vs. canon" to a world-level surface.

- Every contradiction is a `Situation` of severity `contradiction`.
- Each one cites both sides with click-through: *the fact*, and *the prose or worksheet that disagrees*.
- Three resolutions, always: **canon is right** (flag the prose), **the prose is right** (update canon, cascade), **both are right** (add an epoch boundary or a conditional — worlds change).

That third option matters. Most "contradictions" in a long project are actually the world changing over time, and a tool that can't express that will train writers to ignore its warnings.

### 2.4 — POV binding

A document declares `pov_entity_id`. From that one field:

- Sensorium constrains the rail (what this POV can perceive)
- Phylo constrains it further (lifespan, metabolism, what "cold" means to this body)
- Mythos supplies what they swear by and what they will not say
- Lexdrift supplies how they'd name a thing they've never seen

**[NEW] Perception advisories.** Soft, dismissible, never blocking: the writer wrote a colour a colourblind species can't see, a sound below their hearing floor, a distance their eyes can't resolve. Ship's Voice: `POV CANNOT PERCEIVE COLOUR. REVIEW.`

Get the tone right or this becomes Clippy. Rules: gutter-only, never mid-sentence, never red, dismissible per-document, and off by default until the writer turns it on.

### 2.5 — Canon-changed badges

When an upstream fact changes, every document bound to it gets a badge in the binder. Not a modal. Not an email. A small mono marker and a filter: `SHOW CANON-CHANGED (4)`.

Opening the document shows what changed, when, and by which tool — with `ACKNOWLEDGE` (I've handled it) and `REVERT CANON` (that change was wrong).

### 2.6 — Graph-aware Collections

A Collection can be a saved graph query instead of a manual list:

- *every scene with POV = Verrid*
- *every scene set in the Kellis Band*
- *every scene that depends on any fact about the Spires*
- *every scene in epoch 2300–2400*
- *every canon-changed scene*

This is a small feature that will feel like magic, because no other writing tool can express the third one.

### 2.7 — Compile with canon

Export gains graph-derived back matter, generated at compile time, never hand-maintained:

- **Glossary** — every entity mentioned in the compiled set, with its one-line description
- **Dramatis personae** — character entities, by first appearance
- **Timeline** — Chronicle events falling within the compiled span
- **Series bible** — the full canon dump for the writer's editor, agent, or continuity reader
- **Continuity report** — outstanding contradictions, as an author-only appendix

A writer who can hand their editor a generated series bible will never leave.

---

## What the Studio must never do

- **Never write the prose.** Not a sentence, not a paraphrase, not a "smart" rewrite. StellarForge makes the world push back; it does not push the pen.
- **Never block a keystroke.** Every check, flag, and advisory is asynchronous and dismissible.
- **Never lose words.** Autosave, snapshot before any structural operation, and an undo that survives a reload.
- **Never make the rail mandatory.** `Focus` must hide all of it. Some days the writer needs the ship to shut up.
- **Never let the rail exceed one screen.** If the World tab needs a scrollbar, the relevance ranking is wrong.

---

## The Studio's own one-line test

> **Can the writer feel the world in the room without looking away from the sentence?**

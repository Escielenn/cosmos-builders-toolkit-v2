# 00 · THE CONSTITUTION

> Read this before every architectural decision. It is short on purpose.

---

## The Prime Law

**The tools and the writing space are one organism.**

StellarForge is not a suite of worldbuilding calculators that happens to include an editor, and it is not an editor that happens to ship with calculators. It is a single instrument in which *thinking about a world* and *writing that world* are the same motion.

Every feature is measured against one question:

> **Does this shorten the distance between a number the writer decided and a sentence the writer wrote?**

If the answer is no, the feature is decoration. Decoration is allowed only after the connection work is done, never instead of it.

---

## The Seven Laws

### I. No orphan data

Nothing a user types may live only in the surface where they typed it.

Every input either becomes a **Fact** on the Canon Graph, or is explicitly tagged **ephemeral** (scratch notes, moodboards, drafts-of-drafts). There is no third category. A worksheet field that stores a value nowhere but its own JSON blob is a bug, not a feature.

> *Test:* pick any field in any tool. Ask "where else in the product does this value appear?" If the honest answer is "nowhere," you found work.

### II. Provenance up, consequence down

Every fact must answer two questions on demand:

- **Who asserted this?** — a tool run, a simulator snapshot, a manual entry, a line of prose, an import.
- **What breaks if I change it?** — the full downstream set, computed, not guessed.

A number the user cannot trace is a number the user will not trust. A change whose blast radius is invisible is a change the user will not make.

### III. Every surface is two-way

If a surface can *display* a fact, it must either be a place you can *edit* that fact, or it must link — in one click — to the single place you can.

No dead-end readouts. No "this value comes from somewhere else, good luck."

Conversely: writing a value anywhere propagates everywhere, immediately, without a save-and-refresh ritual.

### IV. Prose is a first-class citizen of the graph

This is the law that separates StellarForge from World Anvil.

Text is not the *output* of the worldbuilding. Text is a **node type**. A scene that mentions an entity creates an edge. A scene that depends on a fact registers as a dependent of that fact. Change the fact, the scene is flagged.

And the reverse, which is the whole game:

**Prose proposes canon.** Writers discover their worlds by drafting. When a writer types *"the Spires rise a mile and a half through the cloud deck,"* and no fact records Spire height, the system notices and offers: *`ADOPT AS CANON?`* One keystroke, and the discovery is now load-bearing everywhere else.

A worldbuilding tool that only flows outward from the tools to the page is a tool that fights how writers actually work.

### V. Time is an axis, not a page

Facts have validity intervals. The Chronicle is not a feature that lives at `/chronicle`; it is a dimension every fact carries. The Codex, the graph, the map, and the Studio rail are all scrubbable to an epoch.

"What did this civilization believe in 1540?" must be answerable by moving a slider, not by maintaining parallel worksheets.

### VI. Simulation is canon-generating, not decorative

A simulator is not a toy that sits beside the worksheets. It is the **physics engine underneath them**.

Every simulator run produces a **snapshot**: run id, seed, input parameters, and a set of derived facts the user can promote to canon with provenance attached. If Tidelock computes a terminator-band temperature gradient, that gradient is available to Phylo, to Mythos, and to the Studio rail — or the simulator is a screensaver.

### VII. One focal surface per intent

The product already carries ten always-on chrome layers, 27 tools, and five overlapping graph/map/outline views. Interconnection is not achieved by adding surfaces; it is achieved by making fewer surfaces carry more meaning.

Before adding a view, name the view it replaces or absorbs.

---

## The Forbidden Patterns

These are the ways this product will fail. Name them out loud when you see them.

| Pattern | Why it kills the vision |
|---|---|
| **The Worksheet Silo** | A tool stores a rich JSON blob only it can parse. Every other surface must special-case it. Interconnection becomes N² adapters and dies. |
| **The Link Illusion** | Two worksheets are "connected" because a foreign key exists, but nothing computes, nothing invalidates, nothing surfaces. A line on a mind map is not a relationship. |
| **The One-Way Cascade** | Physics flows to biology flows to culture — and stops. Nothing flows back to the page, and nothing flows from the page back to the model. |
| **The Parallel Truth** | The same fact — surface gravity, star class, species name — is entered independently in four tools and slowly diverges. This is the single most common failure mode in worldbuilding software. |
| **Feature Adjacency** | Shipping tool #28 while tools 1–27 still can't talk. Every new unwired tool increases the wiring debt superlinearly. |
| **The Decorative Sim** | A beautiful canvas that produces no canon. |
| **Chrome Creep** | Another always-on overlay, another FAB, another ticker. Ambient telemetry is signature; ambient *noise* is slop. |

---

## Amendment procedure

These laws may be amended. They may not be quietly ignored.

If a law blocks something genuinely valuable, write the case down in `docs/stellarforge/AMENDMENTS.md`, state which law, state what replaces it, and date it. A law that gets worked around three times without amendment is a law that has already been repealed — make it official or make it stick.

---

## The One-Line Test (interconnection edition)

The design system already has one: *if the screen feels like a ship, ship it.*

This is its twin:

> **If the writer can't feel the world pushing back on the page, start over.**

# 01 · NORTH STAR

> The endgame. Not the next sprint — the thing the next three years are aiming at.
> `docs/stellarforge/06-BUILD-ORDER.md` is where this becomes tractable. Read this one for direction, that one for velocity.

---

## The sentence

**StellarForge is the instrument where a science fiction writer decides what is true about a universe, watches those decisions collide, and writes the book — without ever leaving the ship.**

Three products got close and each stopped one step short:

- **Scrivener** understood that long-form writing needs structure — a binder, a corkboard, compile — but its "research" folder is a filing cabinet. It knows nothing about your world. It cannot tell you that chapter 14 contradicts chapter 3.
- **World Anvil** understood that a world is a linked knowledge base — but its articles are prose describing prose. Nothing *computes*. Change the gravity and no article notices.
- **Stellaris** understood that a universe is a **running state machine** — parameters produce consequences produce events produce stories — but you can't write a novel in it, and the world it generates isn't yours.

StellarForge is the intersection none of them can reach from where they stand, because each would have to rebuild its spine.

StellarForge's spine is already half-built. That's the opportunity.

---

## What each parent contributes

### From Scrivener — the writing space is the destination

Not a tab. Not a "notes" feature. **The Studio is where the product ends.** Every other surface is upstream of it.

What must be true:
- A binder that holds a novel, not a document (folders, ordering, drag, hierarchy, collections).
- A corkboard/outliner with real metadata: POV, status, label, target, synopsis.
- Compile that produces a manuscript a publisher would accept.
- Snapshots and versioning, because writers destroy and restore.
- Focus mode that makes 27 tools disappear entirely.

**What StellarForge adds that Scrivener cannot:** the binder is *graph-aware*. A Collection can be a saved graph query — *"every scene that depends on any fact about the Spires."* A snapshot diffs not just the prose but the canon the prose was written against. Compile can inject a generated appendix, series bible, or glossary straight from the graph.

### From World Anvil — the world is a linked body of knowledge

Codex, Wiki, entity graph, cross-references, sharing, showcase. StellarForge already has all of this in some form.

**What StellarForge adds that World Anvil cannot:** the links *compute*. World Anvil's connection between "desert planet" and "water-scarce religion" is a hyperlink a human typed. StellarForge's is a **derivation** — a named function with inputs, outputs, and an invalidation rule. When the writer changes the planet's water inventory, the religion worksheet doesn't just link to the planet; it goes stale, flags itself, and offers the recomputation.

### From Stellaris — the world is a running system

All three layers, in order of tractability:

**1. Systemic simulation.** The world has *state* that evolves. Not a game loop — a **what-if engine**. "Advance 200 years under these pressures." "What happens to this polity if the trade lane closes?" The user is not playing; they're stress-testing their premise. The existing Cascade tool is the seed of this: it already believes physics → environment → biology → psychology → mythology → culture. Make that chain executable.

**2. The map as primary surface.** Stellar Cartographer is currently a Pro toy with 3D projection and trade routes. It should be the **spatial index of the entire world** — every entity with a location lives on it, click-through to its Codex entry, draw a route and get an Impulse worksheet seeded with the real distance. The galaxy map is how a space-opera writer navigates their own head.

**3. The event engine.** This is the layer that most directly serves the Prime Law. Where facts sit in *productive tension* — high surface gravity plus spacefaring ambition; a monotheistic mythology plus a first-contact event on the Chronicle; a language that has drifted past mutual intelligibility plus a polity that assumes shared administration — the system emits a **Situation**: a short, specific, world-derived story hook.

Situations are not AI-generated fluff. They are *deterministic consequences of the writer's own decisions*, surfaced at the moment of writing. A Situation lands in the Studio rail as a scene seed and in the Chronicle as a candidate event.

**That is the moment the three products fuse.** A Stellaris-style event, generated from a World Anvil-style knowledge graph, delivered into a Scrivener-style binder as the next scene to write.

---

## The five-year picture, in one user's day

> She opens the Bridge. Not a dashboard of cards — a state view of one world at one epoch. `EPOCH: 2340 CE · 3 SITUATIONS PENDING · 2 CONTRADICTIONS`.
>
> A Situation is flagged: her terminator-band settlement's population curve, computed from Tidelock's insolation model and Phylo's metabolic requirements, goes negative in 80 years. Her outline has them thriving in year 200.
>
> She clicks through. The derivation chain is right there: stellar flux → habitable band width → arable area → carrying capacity. She changes one thing — the species' caloric requirement, in Phylo — and the chain recomputes. Four scenes in her binder flag as *canon-changed*, because they reference the famine that no longer happens.
>
> She opens scene 14. The rail shows: this POV is a Verrid; Sensorium says they have no trichromatic vision but exceptional infrasound. The paragraph she wrote about the "red sunset" gets a soft flag. She rewrites it as pressure and low sound. In the same paragraph she invents that Verrid mourning song has seven tones — and the rail offers `ADOPT AS CANON`. She takes it. Mythos now knows. Lexdrift now knows.
>
> At the end of the session she compiles. The manuscript comes out clean, with an appendix generated from the graph she never had to maintain by hand.

Everything in that paragraph is reachable from what already exists. None of it is reachable without the Canon Graph.

---

## What StellarForge is deliberately not

Naming the boundaries keeps the scope survivable.

- **Not a game.** No win condition, no opponents, no resource management for its own sake. Simulation exists to pressure-test premises, never to be played.
- **Not a general-purpose wiki.** Fantasy, historical, and contemporary worldbuilding are not the target. The physics is the point; the physics is science-fictional.
- **Not a co-author.** Generative text is at most a *prompt* — a Situation, a question, a flag. StellarForge never writes the book. It makes the world push back.
- **Not a collaboration platform first.** Sharing and showcase are real; real-time multi-cursor is not the differentiator and should stay in the backlog.
- **Not a replacement for Scrivener's whole surface area.** Match the 80% writers actually use. Don't chase Scrivings, custom compile scripting, or the Windows/Mac parity war.

---

## The one metric

If you track one number to know whether the vision is being served:

> **Cross-surface reference density** — the average number of distinct canon facts a given Studio document is bound to.

A world where scenes reference nothing is a world where the tools are decoration. Watch this number go up and the product is working. Watch it stay flat while the tool count rises and you are building World Anvil with better fonts.

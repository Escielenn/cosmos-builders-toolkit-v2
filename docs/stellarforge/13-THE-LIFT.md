# 13 · THE LIFT

> The aggressive plan. Written 2026-08-16 against the build as observed earlier that day; the visual
> pass against today's pixels is owed once Chrome reconnects.
> This document is where the product stops being "27 tools and an editor" and becomes one thing.

---

## 0 · The reversal, and why it's cheap

`00-CONSTITUTION.md` and the design skill said the void `#0A0E17` was untouchable. **That's rescinded.** The user chooses.

It costs almost nothing, because of a decision already made: the palette is *solved*, not chosen. `design/themes.py` takes a base seed and a primary hue and derives everything else against the same contrast targets as the default. So:

- **10 bases** — six dark (Void, Charcoal, Graphite, Midnight, Abyss, Umber), four light (Paper, Sky, Fog, Dawn)
- **7 primaries** — Teal, Cyan, Emerald, Azure, Violet, Amber, Magenta
- **70 themes, zero contrast failures**, verified by running it. `design/theme-proof.html` shows every one.

Adding a base is one line. Adding a primary is one line. Nothing is hand-tuned, so nothing can drift.

**The rule that keeps meaning intact:** the user picks the *primary* — CTAs, focus ring, selection, links. The four **semantic** accents are fixed in every theme: amber = Physics, crimson = Stop, stellar = Worlds, violet = Lore. They're re-solved per base for contrast but never re-assigned. A user on Midnight·Magenta still sees amber on a physics warning. Colour stays a cascade layer.

What changes for the codebase: everything that currently says `sf-teal` for a *role* (button fill, focus, active nav, selection) becomes `sf-primary`. Everything that says `sf-teal` because it *means Integration* stays `sf-teal`. That's one grep and a judgement call per hit; `/sf-contrast` gets a check for it.

What "Void is the brand" becomes: **Void·Teal is the default.** The marketing site, the screenshots, the identity — that's the void. Inside the product, the writer decides what they stare at for six hours.

---

## 1 · The holistic product — one IA

Today a world has these surfaces: Dashboard (Worksheets / Elements / Build / Notes / History), Codex sidebar, Write, Wiki, Chronicle, Graph, Connections (Mind Map / Worksheet Graph / Outline), Showcase, Pages, plus 27 tool routes and the Cartographer. **Fourteen places for a world to be.**

The "weird tools" are weird for one reason: **they're separate destinations for the same information.**

| What it is | What it actually shows | The problem |
|---|---|---|
| `/graph` "Knowledge Graph" | worksheets + wiki entries as nodes, typed by tool | a second graph view |
| `/connections` "World Connections" | Mind Map / Worksheet Graph / Outline over worksheet links, "YOUR WORLD MAP — No entities yet" | a *third* graph view, plus a map that isn't a map |
| `/wiki` | free-text entries with a type (`DOCUMENT`, `SIGNAL PROFILE`) | an encyclopedia **disconnected from the entities it describes** |
| Codex sidebar | registry of worksheets | the *right* idea, as a sidebar |
| Elements tab | entities | the *right* idea, as a tab |
| `/pages/:id` | a document that isn't a Studio document | a fourth document type |

The wiki feels like Wikipedia bolted on because that is what it is: articles about things, stored apart from the things. World Anvil has the same disease. The cure is the thing World Anvil never did.

### The four spaces

Every world has exactly four places to be. Everything else is a *view* inside one of them.

```
BRIDGE        the state of the world. Situations, contradictions, next actions, epoch.
CODEX         every entity. One page per thing. Views: List · Web · Atlas · Timeline.
INSTRUMENTS   the 27 tools + 5 sims, opened ON an entity, never in a vacuum.
MANUSCRIPT    the Studio. Binder, corkboard, outliner, compile.
```

And one control that isn't a place: the **epoch scrubber**, global, in the top bar. Every space obeys it.

### What each absorbs

**CODEX** absorbs Wiki, Elements, Graph, Connections, Pages, and the Codex sidebar.

The move that fixes everything: **an entity's page *is* its wiki article.** Infobox generated from facts. Prose body for lore. Worksheets attached below. Backlinks ("mentioned in 14 scenes"). Relations. Chronicle events. Media. One URL per thing, forever.

Its four views are projections of the same list:
- **List** — filterable, typed, sortable. The Elements tab, done properly.
- **Web** — the relational graph. `/graph` and `/connections` collapse into this one view with a filter bar. Typed edges: *orbits, member_of, rules, speaks, worships, at_war, descends_from, located_in, built_by*.
- **Atlas** — the spatial view. The Stellar Cartographer promoted from a Pro toy to the map of the world, with zoom levels: galaxy → system → planet → region. Every located entity is a pin. Click a pin, land on its Codex page. This is what "YOUR WORLD MAP — No entities yet" was reaching for.
- **Timeline** — entities laid on the Chronicle by lifespan. The Chronicle page becomes this view.

**INSTRUMENTS** absorbs the tool index and all 27 routes — but with one change that matters: **a tool opens on an entity.** Genesis opens *on Kellis Prime*. There is no "blank Genesis" that later gets matched to a planet by name; the matching problem from doc 11 stops existing at the source. The "Begin survey" wizard on the Bridge creates the entity first and drops you into the right instrument.

**MANUSCRIPT** absorbs Write, Board, Focus, Notes, and Pages. Notes become documents in a `Notes` folder of the binder. Pages become documents. Two document types collapse to one.

**BRIDGE** absorbs the dashboard, Recent Activity, Build/History, and Showcase's authoring side.

Fourteen surfaces → four. That is the holistic product, and it's Law VII applied all the way through.

### What gets deleted

Not deprecated. Deleted, with redirects.

- `/graph` and `/connections` → `/worlds/:id/codex?view=web`
- `/wiki` → `/worlds/:id/codex` (entries migrate to entity pages; unmatched entries become `lore` entities)
- `/pages/:id` → Manuscript documents
- Timeline tool → Codex Timeline view
- Elements tab, Notes tab → gone
- The Codex *sidebar* → stays, but as a navigator into the Codex space, not a separate registry

---

## 2 · The feature list

Big, as asked. Organised by parent, tiered by leverage. **Every item passed the four questions** from `05-NEW-SYSTEMS.md` or is marked as infrastructure. Items already in the package are marked ◆ with their doc.

### 2.1 World Anvil — the encyclopedia, done right

**Tier 1 — the spine**
- **Unified Codex** — entity = page = wiki article = graph node = map pin. One URL per thing.
- **Entity type vocabulary** — star, planet, moon, place, species, character, polity, culture, language, deity, vessel, artifact, tech, organization, material, event, route. Closed. Each has a template (its worksheets) and an infobox schema.
- **Infoboxes from facts** — never hand-maintained. Gravity, star class, population, era: read from canon, provenance chip on each.
- **Typed relations** — the edge vocabulary above. Rendered in Web view, listed on the page, queryable.
- **Backlinks** — "mentioned in" across scenes, worksheets, other entities. The ◆`DocBinding` table (02) makes this free.
- **Aliases & redirects** — rename anything, nothing breaks, old links resolve.
- **Atlas** — galaxy → system → planet → region zoom levels. Pins → pages. Territory overlays from Dominion. Routes from Impulse. ◆`05` B5.
- **Timeline view** — Chronicle as axis, ◆`05` B2. Entity lifespans. Era bands. Scrub, and every other view follows.

**Tier 2 — depth**
- **Lineage** — family trees, succession, dynasty. A relation type + a renderer.
- **Organizations** — polities *and* the guilds, churches, companies, crews inside them. Membership over time.
- **Materials & resources** — the Stellaris resource layer. What a world has, what it lacks, what it trades. Feeds Impulse and the economy model.
- **Media per entity** — cover, gallery, moodboard. The existing Moodboard sheet, attached to the thing.
- **Categories & tags** — cross-cutting, user-defined, filterable everywhere.
- **Secrets & spoiler gating** — every fact and paragraph can be author-only, reader-safe, or gated to a Chronicle position. This is what makes public worlds possible.
- **Public world** — Showcase upgraded: an explorable, epoch-scrubbable, spoiler-gated read-only Codex. A reader can stand in the world at the moment of chapter 12.
- **Global search** — ⌘K. Every entity, tool, document, fact, action. Typed prefixes: `@` entity, `/` tool, `#` doc, `:` epoch.

**Tier 3 — reach**
- **Import** — World Anvil export, Obsidian vault (`[[links]]` → entities), Notion, CSV of entities. Writers won't retype a world.
- **Export** — world bible PDF (◆ Compile with canon, `04` §2.7), static site, JSON, Obsidian vault.
- **MCP server for a world** — a read-only endpoint so Claude, or any agent, can query a writer's canon. *"What does my POV character believe about the founding?"* answered from the graph. This is a moat and it's cheap given the query surface in `02`.
- **Templates / starter worlds** — The Tidelock Archives as a forkable template. Three or four more. New writers start inside a working world, not a blank one.

### 2.2 Scrivener — the manuscript

**Tier 1 — parity, the 80% writers use**
- **Binder** — folders, drag-reorder, nesting, icons by type. Exists; needs depth.
- **Corkboard** — index cards, synopsis, drag to reorder, label colour. `Board` exists; make it real.
- **Outliner** — table view: title, synopsis, POV, setting, epoch, status, label, words, target.
- **Document metadata** — label, status, POV entity, `set_in` entity, epoch, target words, notes. ◆`04`.
- **Compile** — DOCX, PDF, EPUB, Markdown. Presets (manuscript, paperback, ebook). Front/back matter. Separators. Per-document include/exclude.
  *Implementation note (2026-09-03, from the writing-tools shortlist):* the in-browser `@react-pdf/renderer` path already in the repo is right for the **World Bible** — it wears the design system. For **manuscript** output (DOCX, EPUB, `.scriv`) the quality bar is Pandoc, which needs a server-side job: a Supabase Edge Function or Trigger.dev task that takes the compiled HTML and returns the file. Don't try to reach DOCX quality in the browser.
- **Snapshots** — versioned captures, diff, restore. ◆`04`.
- **Targets** — session, document, project, with a deadline and daily pace. The `0 / 500 TODAY` widget, finished.
- **Search** — across binder, regex, replace, scoped to a folder.
- **Focus** — exists. Add typewriter scrolling and a measure control (◆ `.sf-measure`).

**Tier 2 — the graph-aware binder, which Scrivener structurally cannot have**
- **Collections as graph queries** — ◆`04` §2.6. *Every scene set in the Kellis Band. Every scene that depends on any fact about the Spires. Every canon-changed scene.*
- **Canon Capture** — ◆`04` §2.2. Prose proposes canon. The single most important unbuilt feature.
- **Contradiction Ledger** — ◆`04` §2.3. Three-way resolution.
- **POV binding + perception advisories** — ◆`04` §2.4. Sensorium in the rail.
- **Canon-changed badges** — ◆`04` §2.5.
- **Scrivenings** — view a folder as one continuous document. Editing stays per-document.
- **Comments & annotations** — inline, author-only, with @mentions of entities that create bindings.
- **Revision mode** — track changes, accept/reject. Needed the moment there's a second author.
- **Split editor** — document + document, or document + Codex page.
- **Name generator → Onomastics** — ◆`05` B1. Every name field, every tool, from the culture's phonology.

**Tier 3 — polish that retains**
- **Import** — `.scriv`, DOCX, Markdown. A writer mid-novel will not switch without this.
- **Keyboard-first** — every action has a shortcut; ⌘K reaches all of them.
- **Typewriter mode, dictation, footnotes** — table stakes for long-form.
- **Offline / local-first** — big. Later. But a writing tool that dies without wifi is not a writing tool. Flag it for Q+3.

### 2.3 Stellaris — the living system

**Tier 1 — the world talks back**
- **Sim consequence flags** — ◆`11` S4. Ten rules, no dependencies, this week.
- **Situations engine** — ◆`02`, `05` A2. World-level tension → scene seeds.
- **Publish / open-on** — ◆`11` S1. Simulators write and read entities.
- **Rogue as world-generator** — ◆`11` S2. Encounters create worlds and Chronicle events.
- **Living sky** — ◆`11` S3. Precession over centuries.
- **Precession × Mythos** — ◆`11` §4. The constellation that no longer exists.
- **Sensory brief** — ◆`11` §3, with the guardrails.

**Tier 2 — systems**
- **Tech tree** — Paradigm becomes a graph with prerequisites and consequences, not a worksheet. *You cannot have fusion torches without X.* Unlock order is story structure.
- **Species traits** — Phylo's 13 sections distilled to trait cards with mechanical meaning (g-tolerance, lifespan, senses). Inherited by characters. ◆ Dossier, `05` A1.
- **Polity ethics & civics** — Dominion's governance fields become a combinable set (Stellaris's best UI idea) with derived consequences: *militarist + theocratic + xenophobe → these Situations fire.*
- **Resources & trade** — materials on planets, lanes on the Atlas, scarcity feeds Impulse and Exodus. The economy the sims currently gesture at.
- **Population & carrying capacity** — the slow-variable model. ◆`05` B3. Tidelock band width × Phylo metabolism × Symbiosis productivity → a number that goes negative at a date.
- **Advance the clock** — ◆`05` B3. Stress-test, not generator. `THESE 6 FACTS BECOME UNSUSTAINABLE BY 2520.`
- **Fork & diff** — ◆`05` B4. What-if worlds, merged or discarded.

**Tier 3 — emergence**
- **Anomalies** — a Situation subtype: a *place* on the Atlas with an unresolved property. *Unexplained thermal signature at 41°S.* The writer decides what it is; the system remembers they haven't.
- **Crises** — multi-epoch Situations with stages. A famine that becomes a migration that becomes a war, each stage a Chronicle event the writer accepts or rewrites.
- **First contact modelling** — Sensorium × Sensorium × Lexdrift: two species, disjoint senses, no shared channel. What was the first successful message, and how long did it take?
- **Galactic map generation** — Cartographer's procedural mode seeded from Signal's Drake N, so a "teeming" galaxy actually has neighbours on the Atlas.

### 2.4 Connective tissue — the thing that makes it one product

All ◆, all specced, listed so the dependency is visible:

- Canon graph — entities (exist), projected facts (exist, need subjects), asserted facts (`12` C2)
- `src/canon/` as the only door — `02`
- Tool manifests + `/sf-audit` — `03`
- Studio rail — Entities / World / Refs / Check / **Situations** — `04`
- Two-hop navigation — `07`
- Provenance chips on every canon-sourced value — `03`
- The Bridge — `05` A3
- Cross-surface reference density as the one metric — `01`

### 2.4b Render — Stellaris-level effects, as one engine

All in `14-RENDER-ENGINE.md`. The headline: **one engine (`forge-gl`), five scenes, every visual property a function of canon.** Black-body star colour from `star.temp_effective`; atmosphere rim from `planet.atmo_composition`; territory borders that move when you scrub the epoch. Bloom, corona, fresnel, nebulae, hyperlanes, a continuous galaxy→system→planet camera. Proof at `design/forge-gl-proof.html` — 30,000 stars, 60fps, ~220 lines.

- **Tier 1** — black-body stars, corona, atmosphere rim, terminator, territory, hyperlanes
- **Tier 2** — bloom, nebulae, parallax, vignette/grain, the continuous camera, theme-aware selection glow
- **Tier 3** — lens flare, god rays, rings/moons/belts, clouds, night-side city lights, ship trails, WebGPU
- **Chart tier** — light themes and low-end GPUs get a *drafted* star chart, not a degraded demo

### 2.5 Platform — the things that make it feel finished

- **Theme system** — `design/themes.py`, 70 themes, `ThemePicker.tsx`. **Built.**
- **Display settings** — contrast, ambient, motion, density (comfortable / compact). ◆ `StellarBackground.tsx`.
- **Command palette** — ⌘K, as above.
- **Onboarding** — "Begin survey": name a world → pick a star → the Bridge appears with three Situations already waiting. Under five minutes to the first *"oh."*
- **Collaboration** — shared worlds with roles; co-authors *propose* facts into a queue (the `proposed` confidence tier does this for free); comments on entities and scenes. Real-time cursors stay out.
  *Later, if ever:* simultaneous editing of one document is Yjs over Supabase Realtime (Tiptap has first-party bindings) or PartyKit. It is a Block after G, not before — the `proposed` queue covers 90% of co-authoring, and Yjs changes how documents are stored.
- **World version history** — snapshots of the *world*, not just documents. Restore a world to last Tuesday.
- **Notifications digest** — weekly: new Situations, contradictions, canon-changed scenes. Ship's Voice, email.
- **Reader mode** — the public world on a phone. Read-only, fast, epoch-scrubbable.
- **Community** — forkable public worlds, shared worksheet presets, a gallery. Exists in outline; becomes real once worlds are exportable.
- **Billing tiers that match the product** — Free: 1 world, 3 tools. Pro: everything. Team: collaboration + org billing (already roadmapped).

---

## 3 · Tool triage — the 27, honestly

Applying the four questions to what exists. **K** = keep as is, **P** = promote, **M** = merge, **F** = fold into another tool, **R** = rethink.

| Tool | Verdict | Into / becoming |
|---|---|---|
| Genesis | **P** | the planet entity's primary worksheet; opens *on* a planet |
| Atlas (gravity) | **F** | a derivation inside Genesis. A calculator with one input is a field. |
| Goldilocks | **F** | a derivation inside Orrery. Same reason. |
| Orrery | **P** | the system entity's primary worksheet; feeds Atlas view |
| Solaris | **P** | Orrery's generative mode. Two tools for "make a star system" is one too many — Solaris becomes Orrery's *Generate* button, keeping its N-body engine. |
| ExoForge | **P** | Genesis's generative mode, same logic. NASA import stays. |
| Tidelock | **K** → wire | the first sim to get consequence flags |
| Rogue | **P** | world-generator, `11` S2 |
| Exosky | **P** | living sky, `11` S3; feeds Mythos |
| Stellar Cartographer | **P** | becomes the **Atlas view** of the Codex. Stops being a tool. |
| Phylo | **P** | species entity's primary worksheet; emits trait cards |
| Symbiosis | **P** | becomes Ecology — trophic model, `05` B6 |
| Sensorium | **P** | the POV rail binding; the demo |
| Axiom | **K** | root fact. Add the preset library (folds Quantum & Beyond) |
| Impulse | **K** → wire | consumes real Atlas distances |
| Vessel | **K** → wire | consumes Impulse, Gravitas |
| Gravitas | **F** | into Vessel as a derivation; standalone for habitats stays as a mode |
| Dominion | **P** | ethics/civics combinables; territory on the Atlas |
| Paradigm | **P** | tech tree |
| Exodus | **K** → wire | phases become Chronicle events |
| Paradox | **F** | a derivation on any route; Warp Travel folds in as a mode |
| Signal | **K** | root fact; seeds galactic generation |
| Lexdrift | **P** | Onomastics service everywhere |
| K-Scale | **F** | a derivation on a polity from its energy budget |
| Mythos | **P** | consumes Exosky constellations; the precession Situation |
| Cascade | **R** | stops being a worksheet; becomes the derivation-DAG *viewer* — the World rail tab at world scale |
| Timeline | **M** | into Codex Timeline view |

Net: **27 tools → 17 instruments + 4 Codex views**, and every one of the 17 opens on an entity. The roadmap's ten "coming soon" items were already reduced to five builds in `05`; this pass reduces the existing surface by a third. **The product gets smaller and denser at the same time.** That's the lift.

Worth saying plainly: folding Atlas, Goldilocks, Gravitas, Paradox and K-Scale is not a demotion of the physics. The derivations survive intact and become *more* visible, because they now appear inline, with narratives, wherever their inputs live — rather than on a separate page the writer has to know to visit.

---

## 4 · Sequencing — Blocks E and F

Extends `12-SESSION-SEQUENCE.md`. Block A–D stand. These slot in **after Block B**, because they don't depend on the facts table and they change what the user sees every day.

| # | Session | Size | Ends with |
|---|---|---|---|
| | **BLOCK E — appearance** | | |
| E1 | `sf-teal` role → `sf-primary` split | ~2 days | grep clean; `/sf-contrast` checks it |
| E2 | Load `themes.css`, mount `ThemePicker`, no-flash script | ~1 day | switch themes live |
| E3 | Light-mode audit of ambient layers — starfield off, paper grain on | ~1 day | light themes don't look like a dark app with the lights on |
| | **BLOCK F — one IA** | | |
| F1 | Codex space: entity page = infobox + prose + worksheets + backlinks | ~2 weeks | one URL per thing |
| F2 | Wiki migration → entity pages; `/wiki` redirects | ~3 days | wiki is gone and nothing is lost |
| F3 | Web view — `/graph` + `/connections` collapse | ~1 week | one graph, typed edges, filter bar |
| F4 | Instruments open *on* an entity; "Begin survey" wizard | ~1 week | no blank worksheets exist |
| F5 | Atlas view — Cartographer promoted | ~2 weeks | pins → pages, zoom levels |
| F6 | Manuscript absorbs Notes + Pages; Bridge replaces dashboard | ~1 week | four spaces, top nav |
| F7 | Tool folds: Atlas→Genesis, Goldilocks→Orrery, Gravitas→Vessel, Paradox as derivation, K-Scale as derivation, Solaris→Orrery mode, ExoForge→Genesis mode | ~2 weeks, one per session | 17 instruments |
| | **BLOCK G — render engine** *(see `14-RENDER-ENGINE.md` §6)* | | |
| G1–G7 | `forge-gl`: core → materials → System → Galaxy → Sky → Encounter → Chart tier | ~8 weeks | the Stellaris shot, driven by canon |

Then C and D as written. **Block F before Block C** is the honest order: the simulators publishing into a Codex that has one page per entity is a far better product than simulators publishing into a wiki, a graph, and an elements tab that don't agree.

---

## 5 · Briefs

### Brief E1 — the primary role

```
Read docs/stellarforge/13-THE-LIFT.md §0.

Split the teal token into a ROLE and a MEANING.

  sf-primary        the user-chosen accent. Button fills, focus, active nav,
                    selection, links, progress. Reads from --sf-primary.
  sf-teal           the Integration colour. Cascade edges, the Integration
                    category, the Check tab's "consistent" state. Unchanged.

1. Grep every use of sf-teal, sf-teal-bright, sf-teal-text, sf-on-teal,
   text-sf-teal, border-sf-teal. Show me the count by file.
2. For each hit, decide: ROLE → sf-primary(-text/-bright/-on). MEANING → stays.
   Show me the list with your call on each before changing anything.
3. Add a /sf-contrast check: any sf-teal on a button fill, focus ring, or
   nav-active state is flagged as "role token misuse".

Do not touch themes.css or ThemePicker in this session.
```

### Brief E2 — switchable themes

```
Read docs/stellarforge/13-THE-LIFT.md §0 and components/ThemePicker.tsx.

1. Load design/themes.css AFTER tokens.css in the root stylesheet.
2. Copy ThemePicker.tsx into src/components/ui/. Wire it into Settings
   under DISPLAY, above the contrast/ambient controls.
3. Add the no-flash script from ThemePicker's footer comment to index.html.
4. Verify: switch to midnight-cyan, reload, no flash, /sf-contrast clean.
   Switch to paper-teal, screenshot the Studio and one tool page.

Constraint: if any component still shows teal on a button after switching
to a non-teal primary, E1 wasn't finished — stop and say so.
```

### Brief F1 — the Codex entity page

```
Read docs/stellarforge/13-THE-LIFT.md §1 and 02-ARCHITECTURE.md (Entity).

Build the entity page: /worlds/:id/codex/:entityId

Sections, top to bottom:
  1. Header — name, type tag, aliases, epoch range. Rename inline.
  2. Infobox — generated from canon.facts(subject=entityId). Never hand-
     edited. Provenance chip on every row; click-through to the producer.
  3. Body — a prose editor (reuse the Studio's Tiptap). This IS the wiki
     article. @mentions create relations.
  4. Instruments — the worksheets attached to this entity, with "open in".
  5. Relations — typed edges in and out.
  6. Mentioned in — scenes and worksheets, from doc_bindings.
  7. Chronicle — events touching this entity.

The Codex sidebar links here. The Elements tab links here. Nothing else
renders an entity in full.

Do NOT migrate the wiki in this session — that's F2. Stop and show me the
page with one planet and one species before wiring the sidebar.
```

### Brief F3 — one graph

```
Read docs/stellarforge/13-THE-LIFT.md §1.

/graph and /connections are three views of two graphs on two routes.
Collapse them into one: /worlds/:id/codex?view=web

1. Nodes are ENTITIES (not worksheets). Edges are typed relations from the
   vocabulary in §2.1. A worksheet is not a node; it's a property of one.
2. Keep the best renderer of the three. Delete the other two.
3. Filter bar: entity type, edge type, epoch. The epoch filter reads the
   global scrubber.
4. Click a node → its Codex page. Hover → infobox summary.
5. Redirect /graph and /connections. Delete the Drake Context sidebar —
   that's a Signal readout and belongs on the galaxy entity's page.

Show me the node/edge types before touching the renderer.
```

---

## 6 · What this asks of you

Three things, honestly.

**Deleting is harder than building.** Block F removes six routes and folds seven tools. Every one of them was work. The product gets better by getting smaller, and that is emotionally different from shipping features. The tool count goes on the roadmap page as a *decrease*, and that's the correct number to be proud of.

**The order is Studio-last and that's deliberate.** Block D — Canon Capture, the Ledger, Dossier — is where StellarForge becomes itself. It sits after F because those features land in a Codex that has one page per thing, and that's a different product from landing in a wiki. If the calendar slips, slip C, not D.

**Chrome.** I owe you the visual pass against today's build. Reconnect the extension and I'll walk every surface in Block F's scope, screenshot each, and annotate the redlines directly onto them.

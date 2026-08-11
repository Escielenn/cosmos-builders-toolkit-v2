# The Science Fiction Scrivener — Product Direction

**Thesis:** Scrivener's Research folder is inert. It holds notes that cannot disagree with your prose. StellarForge's research folder is **structured, computed, and internally consistent** — a planet knows its gravity, a drive knows its cruise velocity. That difference is the entire product.

So the goal is not "Scrivener with a wiki bolted on." It is:

> **The manuscript and the world are the same document, and the world can tell you when the manuscript is wrong.**

No other writing tool can build that, because it requires the worldbuilding to be data rather than notes. StellarForge already has the data (13 tools mapped through `worksheetPaths`, and `worksheets.data` for the rest). It just isn't doing anything with it while you write.

---

## Part 1 — Parity: what a novelist expects and cannot currently do

These are table stakes. Until they exist, a working novelist will draft in Scrivener or Word and paste in. Ranked by how often a novelist hits them.

| # | Capability | State today | Why it matters |
|---|---|---|---|
| P1 | **Corkboard / outliner view** | Absent. The binder is a flat list of titles (`Write.tsx`). | This is *the* reason people buy Scrivener. Structure is spatial: drag scenes, read synopses side by side, see the shape of act two. Without it you cannot restructure a novel. |
| P2 | **Per-document metadata** — synopsis, POV, status, label | Absent. `metadata: {}` is written at creation and never read (`use-writing-documents.ts:128`). | Powers the corkboard, the outliner, and every "show me all Kael POV scenes still in first draft" question. **P1 depends on this.** |
| P3 | **Scene tier** | Absent — only document and folder exist (`use-writing-documents.ts:4-5`). | Novels are chapters *of scenes*. A two-level model forces one document per chapter, which makes reordering scenes impossible. |
| P4 | **Snapshots / version history** | Written but unreachable, and broken three ways (see `2026-08-09` plan, BUGS 8–10). | Writers rewrite. Without rollback they keep "chapter3-v4-FINAL.docx" and lose faith in the tool. |
| P5 | **Project & session targets** | Goal exists (`dailyGoalWords`) but is invisible while writing; the footer shows a Julian Day instead. | The single most motivating number in Scrivener. Already 80% built. |
| P6 | **Find & replace** | Absent anywhere. | Renaming a character across a manuscript is currently impossible. |
| P7 | **Composition mode** | Focus mode only collapses side panels; no fullscreen, no typography control on the live surface. | The full-bleed writing experience is why people tolerate Scrivener's ugliness. |
| P8 | **Collections / saved searches** | Absent. | "All scenes mentioning the Talto" without moving anything. Cheap once P2 exists. |
| P9 | **Split view** | Absent. | Draft chapter 12 while reading chapter 3. The Refs panel is a partial substitute. |
| P10 | **Trash / restore** | **Done** — soft delete with 90-day recovery. | — |
| P11 | **Autosave + export** | **Done** — autosave hardened, per-document docx/md/txt shipped 0.6885. | — |

**Sequence:** P2 → P1 → P3 unlocks the structural core. P5 and P6 are small and high-gratitude. P4 needs its bugs fixed first.

---

## Part 2 — The three things only this product can do

This is the moat. Each is impossible in Scrivener by construction.

### D1 — The Continuity Engine (the flagship)

Your world is numbers. Your prose is claims. Compare them.

A writer sets Ashfall at **1.47 g** in Genesis, then writes *"she leapt the fence easily."* The editor flags it: **"Ashfall is 1.47 g — a leap costs ~47% more effort than Earth."** Not a correction; a nudge with the number attached.

Buildable in tiers, cheapest first:

- **Tier 1 — Contradiction of stated facts.** Already possible today. `extractWorksheetFacts` gives labelled values; scan prose for numerals and units near the same concept ("two moons" vs `moonCount: 1`; "18-hour day" vs `dayLength: 32`). Pure string/number work, no ML, unit-testable, ships in days.
- **Tier 2 — Physical implausibility.** Rules keyed to cascade layers: high gravity vs effortless motion; tidally locked vs "sunset"; vacuum vs "she shouted across the hull." A rules table, not a model.
- **Tier 3 — Cascade drift.** The Environmental Cascade already encodes downstream consequences (`buildsOn`/`feedsInto` in `tool-wiki-data.ts`). If gravity changes upstream, flag prose describing downstream biology written under the old value.

Where it lives: the inspector already has the right home (`WorldInfluencePanel` counts keyword hits — this is that idea with values and judgement). Presented as an **editor's margin note**, never as a blocking error. Writers break physics on purpose; the tool's job is to make it a *choice*.

**This is the headline feature. It is what "science fiction Scrivener" actually means.**

### D2 — Research that computes instead of sitting there

- **Inline fact insert** — shipped. `WorksheetFactsPanel` puts real values at the cursor.
- **Live transclusion.** `{{ashfall.surfaceGravity}}` in prose renders as `1.47 g` and updates when the worksheet changes. Scrivener cannot do this because its research has no fields.
- **Entity sheets from prose.** You write "the Kajalites" three times; the tool offers to create the species entry, pre-filled from context. `scanForEntities` already does the detection — it just links instead of creating.
- **Ask the world.** "How long from Sol to Proxima at my drive's cruise velocity?" answered from the Time Dilation worksheet, in the margin, no context switch.

### D3 — Compile that carries the world

- **World appendix** — shipped (0.6885), off by default.
- **Auto-generated glossary** from entities actually mentioned in the compiled scenes.
- **Series bible export** — the artifact agents and editors ask for, that no writing tool produces.
- **Continuity report as a deliverable** — a per-manuscript list of every physics claim and whether the world backs it. Nothing else on the market prints this.

---

## Part 3 — Experience: earn the "elegant"

The register work (`2026-08-10-writer-register-and-streamlining.md`) is the foundation. Beyond it:

- **One surface, not four.** Studio, `/write`, `/worlds/:id/write`, `/workshop` still coexist; `WorldWritingSpace.tsx` is 865 unreachable lines. Decide and delete.
- **The world page should open like a book, not a dashboard.** It is 1,246 lines against Studio's 418. See the panel decision below.
- **Command palette (⌘K) that reaches the world.** Search already exists; it should jump to any scene, entity, or worksheet from one keystroke.
- **Session ritual.** Studio's "Good evening" + last-touched + streak is the best screen in the product. It should be the front door of a writing session, with one button: continue where you stopped.
- **Never lose a word.** Autosave is hardened, but offline drafting and conflict recovery are unproven. For a writing tool this is existential.

---

## Part 4 — The panel decision (needs the product owner)

`WorldDashboard.tsx` renders these, in order. Mark each **A** = above the fold when I open a world, **B** = useful but can live behind a tab or disclosure, **C** = delete or demote to the status bar.

| Panel | Line | Notes |
|---|---|---|
| Back to Bridge | 681 | Navigation |
| Action bar (Write · Wiki · Export ▾ · ⋮) | 688 | Consolidated in 0.6896 |
| Collaborator banner | 803 | Only renders for non-owners |
| Theme cover image | 813 | Decorative; sets the mood |
| World header — name, icon, description, tags | 825 | |
| Cascade progress bar | 843 | How complete the cascade is |
| Recent Activity — last 10 items | 850 | Overlaps with Studio's "last touched" |
| World Notes | 853 | Freeform notes |
| Version History | 863 | Owner only |
| World Elements — entities grouped by type | 868 | Overlaps with the Codex sidebar |
| Tools Grid — 21 cards, drag-reorderable | 937 | The biggest block on the page |
| Guided First World — onboarding | 971 | Should disappear once a world has content |

**My recommendation, for you to overrule:** **A** = header, cover, action bar, Recent Activity. **B** = Tools Grid (behind "Build" — 21 cards is a wall, and the Codex already navigates), World Elements (the sidebar duplicates it), World Notes, Version History. **C** = Cascade progress bar demoted to a single line in the header; Guided First World auto-hides once the world is non-empty.

Rationale: opening a world should answer *"where was I, and what do I do next?"* — which is exactly what Studio answers well. Everything else is a drawer.

---

## Recommended order

1. **P2 + P5** — metadata plus visible goal progress. Small, unlocks the corkboard, immediately felt.
2. **D1 Tier 1** — contradiction detection on stated facts. The demo that defines the product. Ships on data that already exists.
3. **P1 + P3** — corkboard/outliner and the scene tier. The structural core.
4. **Register + panel pass** — make it feel like Studio everywhere.
5. **P4** — snapshots, after fixing BUGS 8–10.
6. **D2/D3** — transclusion, glossary, series bible, continuity report.

If only one thing gets built: **D1 Tier 1.** Everything in Part 1 makes StellarForge a competent writing tool. D1 makes it the only one of its kind.

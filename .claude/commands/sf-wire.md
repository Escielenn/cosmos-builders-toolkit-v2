---
description: Retrofit one existing StellarForge tool to the Tool Charter. One tool per session — never batch.
---

# /sf-wire

Wire `$ARGUMENTS` (a tool id, e.g. `phylo`) into the Canon Graph.

**One tool per session.** Retrofitting is mechanical, and batching it across 27 files is how subtle mistakes get made everywhere at once. If `$ARGUMENTS` names more than one tool, wire the first and tell me to run the command again.

## Before writing code

Read, in this order:

1. `docs/stellarforge/03-TOOL-CHARTER.md` — the manifest spec, the five obligations, the retrofit table row for this tool, and the anti-duplication registry
2. `docs/stellarforge/08-VOCABULARY.md` — the domains this tool touches
3. The tool's existing components and save path

Then **stop and show me**:

- the field inventory: every user input this tool currently renders
- the proposed mapping: field → predicate, or field → ephemeral (with a reason)
- any predicate this tool would produce that another tool already produces (parallel truth — must be resolved before proceeding)
- what this tool should contribute to the Studio rail

Do not write code until I confirm the mapping.

## Then build

**1. `src/tools/<id>/manifest.ts`** — full `ToolManifest`: entities, produces, consumes, derives, situations, studio, upstream, downstream. Every derivation gets a `narrative()` that states a *consequence*, not a restatement of the number.

**2. Ingest** — the tool opens pre-filled from canon. Canon-sourced fields render with a provenance chip (mono, `text-t4`, e.g. `// FROM ORRERY`) that click-throughs to the producer. Never make the writer retype what the world knows.

**3. Emit** — save writes through `canon.assert()`, not directly to Supabase. Keep the existing blob write as-is (Phase A: blob is the write path, graph is derived). Conflicts with existing canon render as a diff:

```
CANON SAYS 1.4 g   ·   THIS SHEET SAYS 1.1 g
[ADOPT CANON]  [OVERRIDE CANON]  [FORK]
```

Never silently overwrite `confidence:'canon'`.

**4. Consume** — any predicate this tool needs but doesn't own becomes a readout, not an input. Each gets an `onMissing` handler and a one-click path to its producer (Law III).

**5. Reach the page** — implement the `studio` block. Verify by hand: open a document bound to a relevant entity, confirm the contribution appears in the `World` or `Refs` rail tab.

**6. Point onward** — `upstream`/`downstream` drive the existing `UpstreamCallout` and `CascadeSuggestionToast`. Remove any hardcoded equivalents.

## Constraints

- Do not restructure the tool's UI. This is a wiring pass, not a redesign.
- Do not migrate data.
- Follow the `stellarforge-design` skill for anything visual. Zero radius, mono for numbers, Ship's Voice.
- New chrome must justify itself against Law VII.

## Finish

Run the Definition of Done checklist at the end of `03-TOOL-CHARTER.md` and report pass/fail per line. Then run the Two-Hop Test and the Consequence Test by hand and describe what you did.

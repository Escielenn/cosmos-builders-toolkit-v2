---
description: Sweep the codebase for interconnection violations — orphan data, dead-end readouts, unmanifested tools, parallel truth.
---

# /sf-audit

Run the interconnection audit. This is the automated half of `docs/stellarforge/07-REVIEW-GATES.md`.

Read `docs/stellarforge/00-CONSTITUTION.md` and `03-TOOL-CHARTER.md` first if not already in context.

## Scope

If `$ARGUMENTS` names a tool or path, audit only that. Otherwise audit the whole repo.

## Checks

Run these in parallel where possible. For each, report the count and list up to ten offenders with `file:line`.

**1. Manifest coverage** — every directory under `src/tools/` has a `manifest.ts` exporting a valid `ToolManifest`.

**2. Orphan data (Law I)** — for each manifested tool, cross-reference the form fields rendered in its components against `produces[].from` and the ephemeral list. Any field in neither is an orphan.

**3. Vocabulary drift** — every predicate in every `produces`/`consumes` exists in `src/canon/vocabulary.ts` and is not deprecated.

**4. Parallel truth** — any predicate with more than one producer across all manifests. This is the highest-severity finding; list every instance.

**5. Dead-end readouts (Law III)** — every `consumes` entry has an `onMissing` handler, and the rendering component for that value offers either inline edit or a link to the producer tool.

**6. Unbound tools (Prime Law)** — any manifest with no `studio` block, or a `studio` block whose `influences` are empty.

**7. Illegible derivations** — any id in `derives` whose registered `Derivation` has no `narrative`.

**8. Canon bypass** — any file outside `src/canon/` that imports the Supabase client and queries a world-data table (`worlds`, `entities`, `facts`, worksheet tables). Reads must go through `src/canon/`.

**9. Orphan entities** — entities in the fixture/dev world with zero facts and zero `doc_bindings`.

**10. Cross-surface reference density** — average distinct facts bound per Studio document, from `doc_bindings`. Report the number and compare to the value in `docs/stellarforge/.audit-history` if present; append today's.

## Output

Ship's Voice, mono, in this shape:

```
// INTERCONNECTION AUDIT · <date>

TOOLS MANIFESTED           18 / 27
PREDICATES DECLARED        214
DUPLICATE PRODUCERS         3     ← FORBIDDEN: PARALLEL TRUTH
DEAD-END READOUTS           7     ← LAW III
UNBOUND TOOLS               4     ← PRIME LAW
DERIVATIONS W/O NARRATIVE  11
CANON BYPASSES              9     ← BYPASSING src/canon
ORPHAN ENTITIES            31

CROSS-SURFACE REFERENCE DENSITY   4.2 facts / document  (prev 3.8)

// FINDINGS
[severity] <law> · <file:line> · <one line>
...
```

Order findings by severity: parallel truth > canon bypass > unbound tool > orphan data > dead end > vocabulary drift > illegible derivation > orphan entity.

Do not fix anything. Report only. End with the three findings you'd fix first and why.

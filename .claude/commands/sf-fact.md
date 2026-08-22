---
description: Add, inspect, or deprecate a predicate in the canon vocabulary. Guards the namespace against drift.
---

# /sf-fact

Operate on the canon vocabulary. `$ARGUMENTS` is either a predicate name, or `add <predicate>`, or `deprecate <predicate> -> <replacement>`.

Read `docs/stellarforge/08-VOCABULARY.md` first.

## Inspect (default)

For the named predicate, report:

- **Definition** — domain, kind, unit, enum vocabulary if applicable
- **Producer** — the single tool that owns it. If more than one manifest produces it, this is a **PARALLEL TRUTH** violation. Say so loudly.
- **Consumers** — every manifest that reads it
- **Derivations** — what it's computed from, and what's computed from it (walk the DAG both directions)
- **Studio reach** — which rail contributions surface it, and its `narrative` string
- **Situations** — which rules read it
- **Usage** — count of facts with this predicate in the dev/fixture world

End with the blast radius: if this predicate changed for one entity, how many derived facts and how many documents would be affected.

## Add

Before adding, check for near-duplicates. Semantic collisions are how vocabularies rot — `planet.temp_mean` and `planet.average_temperature` must never both exist.

Then:

1. Confirm naming rules: `<domain>.<attribute>`, snake_case, no tool name in the predicate, unit on the value not in the name.
2. Add to `src/canon/vocabulary.ts` with kind, unit, and a one-line description.
3. If it's an enum, register the enum vocabulary alongside it.
4. If it's a `struct`, **require a justification comment** explaining why it can't decompose into scalars. Unjustified structs re-create the Worksheet Silo.
5. Assign exactly one producer tool and update that manifest.
6. If it's derivable from existing predicates, register the derivation with a `narrative()` rather than making it a raw input.
7. Update `docs/stellarforge/08-VOCABULARY.md` so the doc and the code stay in sync.

## Deprecate

Never rename. Add `{ deprecated: true, alias_of: '<replacement>' }`. Reads follow the alias; writes warn in dev and fail `/sf-audit`. Update every manifest that references the old name. Leave the old entry in place permanently.

## Output

Mono, Ship's Voice, short. This command should feel like querying a ship's registry, not reading a report.

---
description: Author a Situation rule — the Stellaris event layer. Deterministic, cited, actionable.
---

# /sf-situation

Author or review a Situation rule: `$ARGUMENTS`.

Read `docs/stellarforge/02-ARCHITECTURE.md` (the Situation node) and `05-NEW-SYSTEMS.md` A2 first.

## What a Situation is

A point of **productive tension** in the writer's own facts, surfaced as a story hook. Not generated fiction. Not advice. A consequence of decisions they already made, that they haven't noticed yet.

The bar: a writer reads it and thinks *"oh — I hadn't thought about that."* If it reads as generic writing-prompt filler, it's not a Situation.

## Hard constraints

- **Deterministic.** A pure predicate over the graph. No randomness, no model calls, no side effects.
- **Cited.** The rule must name the specific facts that triggered it, with click-through. A situation the writer cannot trace is a situation they will not trust.
- **Specific.** `body()` references the actual entity names and actual values, never a template with the nouns swapped.
- **Non-blocking.** Dismissible per world. Never a modal.
- **Silent when quiet.** A rule that fires on most worlds is noise. Tune the threshold until it fires on the worlds where it matters.

## Build

```ts
export const rule: SituationRule = {
  id: 'kebab-case-id',
  severity: 'tension' | 'contradiction' | 'opportunity',
  reads: ['predicate.a', 'predicate.b'],   // drives re-evaluation on change
  when: (g) => /* pure predicate */,
  title: 'SHORT MONO HEADLINE',            // Ship's Voice, uppercase
  body: (g) => `...cites g.fact('...') by name and value...`,
  cites: (g) => [ /* fact ids */ ],
  suggests: [
    { kind: 'tool',  tool_id: '...' },
    { kind: 'scene', prompt: '...' },      // one sentence, a situation not a plot
    { kind: 'event', epoch_hint: ... },
  ],
}
```

Register in `src/canon/situations/`. Add its id to the `situations` array of every manifest whose predicates appear anywhere in the rule's input chain — including tools that own inputs to a *derived* trigger predicate.

## Test

Write a fixture world that triggers the rule and one that shouldn't. Assert:

- it fires exactly when intended
- `cites()` returns the facts a human would point at
- `body()` contains the real entity names, not placeholders
- it re-evaluates when any predicate in `reads` changes
- dismissal persists

## Review

If reviewing an existing rule rather than authoring one, score it against the bar above and be blunt. A mediocre Situation is worse than no Situation — it teaches the writer to ignore the tab, and then the good ones never get read.

---
description: Bind a canon surface into the Studio rail. The Prime Law made concrete.
---

# /sf-studio-bind

Bind `$ARGUMENTS` (a tool, predicate domain, or subsystem) into the writing space.

Read `docs/stellarforge/04-STUDIO-CHARTER.md` first, plus `00-CONSTITUTION.md` Law IV.

## The question this command answers

> What does this subsystem change about **how a scene reads**?

Not "what data does it have." What does a writer put differently on the page because of it. If you can't answer that in one sentence, stop and tell me — the binding isn't ready and forcing it adds rail noise.

## Which tab

| Tab | Holds |
|---|---|
| `Entities` | things named in or one hop from this document |
| `World` | environmental and physical facts touching this scene, rendered as derivation `narrative` strings |
| `Refs` | worksheet values relevant to this document, editable inline |
| `Check` | contradictions between this prose and canon |
| `Situations` | tension-derived scene seeds for this document's entities and epoch |

Pick one. A binding that wants to be in three tabs is three bindings, or it's unclear.

## Build

**1. Query** — extend `canon.forDoc(docId, { epoch })`. Scope by the document's POV entity, `set_in` entity, mentioned entities, and epoch. Rank by relevance, not recency.

**2. Relevance budget** — the rail must fit one screen. Six to ten items in `World`, not thirty. If your query returns more, the ranking is wrong, not the budget.

**3. Render as consequence, not data.** This is the difference between the product working and not:

```
   BAD    SURFACE GRAVITY   1.4 g
   GOOD   GRAVITY  1.4 g    Stairs are a hazard. Architecture goes low, wide.
```

The narrative string comes from the derivation, not from the rail component.

**4. Two-way (Law III)** — every rendered value is either inline-editable or one click from the place it's edited, with a provenance chip showing where it came from.

**5. Epoch-aware** — respect the document's `set_in` epoch if pinned, otherwise the world's present. A flashback scene shows the world as it was.

**6. Performance** — the rail updates on a debounce as the writer moves through the document. It may never block a keystroke. Budget: under 16ms on the main thread; move anything heavier off it.

**7. Focus mode** — all of it disappears. Verify.

## Advisories

If the binding produces advisories (perception limits, taboo violations, contradictions), the rules are strict:

- gutter only, never inline in the sentence
- never red — crimson is reserved for Stop
- dismissible per document, and the dismissal persists
- off by default until the writer enables the category
- never fire mid-sentence; wait for a paragraph boundary or a pause

Get this tone wrong and the feature becomes Clippy and the writer turns off the whole rail.

## Finish

Open a real document in a real world and screenshot the rail. If the binding doesn't visibly change what a writer would write, it isn't done.

---
description: Pre-commit gate — interconnection, data safety, design system, and Ship's Voice. Run before every merge.
---

# /sf-ship

Review the current diff against `docs/stellarforge/07-REVIEW-GATES.md`.

Scope: uncommitted changes plus anything on this branch not on the default branch, unless `$ARGUMENTS` narrows it.

## Run

**Automated:**
1. `/sf-audit` scoped to the changed files
2. Typecheck, lint, tests
3. Grep the diff for: hardcoded hex outside `tokens.css`, `rounded-` classes other than `rounded-none`/`rounded-[2px]`/simulator `rounded-lg`, `text-t3` on running copy, direct Supabase imports outside `src/canon/`, scrollable containers missing `sf-sb`, emoji, exclamation points in user-facing strings

**Manual — you must actually do these, not assert them:**
4. **Two-Hop Test** — pick three changed fields. Walk field → prose and prose → field. Report the click counts.
5. **Consequence Test** — change one upstream value touched by this diff. Report what visibly changed downstream, or confirm the tool says `NO DEPENDENTS ON FILE`.
6. **Ship Test** — screenshot the changed surface. Does it read as an instrument panel or as a website?
7. **Focus Test** — if the Studio changed, verify everything new disappears in Focus mode.

## Report

Walk the full checklist in `07-REVIEW-GATES.md` — interconnection, data safety, time, design system, voice, Studio, density — and report pass / fail / n-a per line. Do not skip sections because they seem unrelated; the point of a checklist is catching the thing you weren't thinking about.

Then:

```
// SHIP REVIEW · <branch>

BLOCKING     <n>
ADVISORY     <n>

// BLOCKING
<law or gate> · <file:line> · <what> · <fix>

// ADVISORY
...

VERDICT: HOLD | SHIP
```

## Blocking vs advisory

**Blocking** — any Constitution law violated; any path that can overwrite canon or modify prose without confirmation; missing manifest; parallel truth; canon bypass; a keystroke-blocking check in the Studio; missing RLS.

**Advisory** — design-system drift, voice slips, density regressions, missing narratives.

Be honest about the verdict. A gate that passes everything is a gate nobody reads.

## If it's a HOLD

Do not fix anything unless I ask. List the blocking items in the order you'd fix them and stop.

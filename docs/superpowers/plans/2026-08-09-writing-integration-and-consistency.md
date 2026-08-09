# Writing Integration & Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Status — updated 2026-08-09

| Task | State | Commit |
|---|---|---|
| A1 folders visible in binder | **done** | 297d4b3 |
| A2 sort_order stops reshuffling | **done** | 297d4b3 |
| A3 flush autosave on doc switch | **done** | 297d4b3 |
| A4 live save indicator / fresh title / save errors | **done** | 297d4b3 |
| A5 atomic word ledger | **migration written, NOT applied** — needs the (user_id, day) unique constraint confirmed by someone with DB access; `rollWordSession` carries a comment pointing at it | 344288c |
| B1 surface decision | **recorded, awaiting sign-off** — recommendation is port-then-delete | — |
| B2 Ctrl+S + Escape | **done** | 344288c |
| B3 goal progress in the footer | **not started** | — |
| B4 retire WorldWritingSpace | **blocked on B1 sign-off** (deletes 865 lines; its version history is broken per BUGS 8–10 and must be fixed before porting) | — |
| B5 auth-gated redirect + Studio world-scoped link | **done** | 344288c |
| C1 extractWorksheetFacts + tests | **done** (11 tests) | 344288c |
| C2 WorksheetFactsPanel in the Refs tab | **done** | 344288c |
| C3 pins carry real data | **done** | 344288c |
| C4 world appendix in compile | **done** | 6edf6c9 |
| C5 extend tool coverage | **in progress** — 7 → 13 tools mapped | — |
| D6 unify word counters | **done** | 5d3a182 |
| D1, D2 | **blocked** — need DDL / the entity merge, gated by SF-II Phase 0 | — |
| D3, D4, D5 | **not started** — need product decisions, see Phase D | — |

**Deviation from the plan, recorded deliberately:** Task A1 proposed extracting a
`buildBinder` helper with its own unit test. On reading the code, `useWritingDocuments`
*already* builds the correct folder tree and then discards it, so adding a second copy
would have duplicated the logic. The implementation consumes the hook's existing
`folders`/`unfiledDocs` instead, and the planned test was dropped rather than testing a
function that should not exist.

**Verification standing after the work above:** typecheck-strict passes, total type
errors unchanged at the pre-existing 254, eslint unchanged at 62 errors / 73 warnings,
tests 18 → 29 passing, production build succeeds. The editor UI itself has **not** been
behaviourally verified: `/write` requires authentication and no test credentials exist
in this environment, so Phase A/B fixes are argued from code, not driven in a browser.
They deserve a manual pass on a real account.

**Goal:** Make every tool's real data usable inside the writing surface, collapse the four competing writing entry points into one, and fix the correctness bugs that currently corrupt word counts, binder order, and version history.

**Architecture:** Three phases, ordered by risk. Phase A fixes correctness bugs in the live editor (`Write.tsx` + its hooks) with no schema change. Phase B resolves the writing-surface split — `WorldWritingSpace.tsx` is 865 lines of richer features (zen mode, version history, font controls) that is imported but never routed, so it is dead code today. Phase C adds real tool-data integration, built entirely on the existing `worksheets.data` blob read client-side through `entity-config.ts` `worksheetPaths` + `getNestedValue`, requiring **no new Supabase tables or columns**.

**Tech Stack:** React 18 + TypeScript + Vite, Tailwind, TanStack Query v5, Supabase (Postgres + RLS), TipTap editor, Vitest.

## Global Constraints

- **No DDL.** The SF-II plan (`StellarForge.tools Part IIi/STELLARFORGE_II_IMPLEMENTATION_PLAN_v2.md` §4.2, status "Definitive v2.3") has already **decided** the `world_entries` → `entities` merge and gates all schema work behind a Phase-0 profiling sign-off ("**Gate: no DDL ships before sign-off**", §B0). This plan must not add tables or columns, and must not re-litigate the merge. Anything requiring it is deferred to Phase D and left unbuilt.
- **Two entity tables are currently unlinked.** `writing_entry_entities.entity_id` and `entity_worksheets.entity_id` both FK `world_entries(id)`, while the editor's `WritingEntityPanel` lists rows from the separate `entities` table (`src/services/entity-graph-crud.ts:20-22`). Confirmed as a known bug in SF-II §2.2 items 3–4. **Do not build any feature that requires joining these two.** Phase C is designed to avoid the join entirely.
- **Design system:** per `CLAUDE.md` — fonts MD Nichrome (H1 only) / Jura (headers) / DM Sans (body + all buttons) / JetBrains Mono (data); zero border-radius on panels; weights 300 or 500 only, never bold; text tiers t1 titles / t2 body / t3 labels / t4 helpers / t5 ghost.
- **Verification gates (must all hold after every task):** `node scripts/typecheck-strict.mjs` exits 0; total `tsc` errors stay at **254** (pre-existing, tolerated); eslint stays at **62 errors / 73 warnings**; `npx vitest run` stays green. Any increase is a regression introduced by the task.
- **Bump `APP_VERSION`** in `src/config/version.ts` (+1 per fix task, +10 per phase) and name the version in the commit subject.

---

## File Structure

| File | Responsibility after this plan |
|---|---|
| `src/pages/Write.tsx` | The one writing surface. Owns editor, binder, inspector, autosave lifecycle. |
| `src/hooks/use-writing-documents.ts` | Document/folder CRUD + ordering. Must stop discarding its own folder tree. |
| `src/hooks/use-write-doc.ts` | Single doc fetch + session word ledger. Needs atomic increment. |
| `src/lib/worksheet-facts.ts` | **NEW.** Pure extraction of labeled facts from a worksheet blob. No React, no Supabase. Unit-tested. |
| `src/components/writing/WorksheetFactsPanel.tsx` | **NEW.** Renders extracted facts in the editor's dead "Refs" tab, with insert-into-prose. |
| `src/hooks/use-writing-pins.ts` | Pin store. Must carry real content and notify across instances. |
| `src/components/tools/PinToWritingButton.tsx` | Pin trigger on tool pages. Must pass real worksheet data. |

---

## Phase A — Correctness in the live editor

### Task A1: Make folders visible in the binder

**Context:** `useWritingDocuments` computes a correct folder tree then throws it away: it sets `data: structured.allDocs` where `allDocs` was filtered with `e.entry_type !== "folder"` (`use-writing-documents.ts:72`, `:96`). `Write.tsx:57` consumes that folder-free list and re-derives folders from it (`Write.tsx:106`), which is therefore **always `[]`**. Effect: the folder render block (`Write.tsx:170-181`) is unreachable dead code, and the `+ Folder` button (`Write.tsx:227`) writes rows the user can never see or delete.

**Files:**
- Modify: `src/pages/Write.tsx:57`, `:103-112`, `:170-181`
- Test: `src/pages/__tests__/write-binder.test.tsx` (create)

**Interfaces:**
- Consumes: `useWritingDocuments(worldId)` already returns `{ data, folders, unfiledDocs, docsByFolder }` (`use-writing-documents.ts:96-100`).
- Produces: nothing new; later tasks rely on `folders` being non-empty when folders exist.

- [ ] **Step 1: Write the failing test**

```tsx
// src/pages/__tests__/write-binder.test.tsx
import { describe, it, expect } from "vitest";
import { buildBinder } from "@/pages/Write";

describe("buildBinder", () => {
  it("keeps folders and nests their documents", () => {
    const folders = [{ id: "f1", title: "Act I", entry_type: "folder", sort_order: 0 }];
    const docs = [
      { id: "d1", title: "Ch 1", entry_type: "document", parent_id: "f1", sort_order: 0 },
      { id: "d2", title: "Notes", entry_type: "document", parent_id: null, sort_order: 10 },
    ];
    const result = buildBinder(folders as never, docs as never);
    expect(result.folders.map((f) => f.id)).toEqual(["f1"]);
    expect(result.docsByFolder.f1.map((d) => d.id)).toEqual(["d1"]);
    expect(result.unfiled.map((d) => d.id)).toEqual(["d2"]);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/pages/__tests__/write-binder.test.tsx`
Expected: FAIL — `buildBinder` is not exported from `Write.tsx`.

- [ ] **Step 3: Extract and export `buildBinder`, then consume the hook's tree**

In `src/pages/Write.tsx`, replace the local re-derivation at `:103-112` with an exported pure helper and feed it the hook's real folder list:

```tsx
export function buildBinder(
  folders: WorldEntry[],
  docs: WorldEntry[],
): { folders: WorldEntry[]; docsByFolder: Record<string, WorldEntry[]>; unfiled: WorldEntry[] } {
  const bySort = (a: WorldEntry, b: WorldEntry) =>
    (a.sort_order ?? 0) - (b.sort_order ?? 0);
  const sortedFolders = [...folders].sort(bySort);
  const docsByFolder: Record<string, WorldEntry[]> = {};
  const unfiled: WorldEntry[] = [];
  for (const d of [...docs].sort(bySort)) {
    if (d.parent_id && folders.some((f) => f.id === d.parent_id)) {
      (docsByFolder[d.parent_id] ??= []).push(d);
    } else {
      unfiled.push(d);
    }
  }
  for (const f of sortedFolders) docsByFolder[f.id] ??= [];
  return { folders: sortedFolders, docsByFolder, unfiled };
}
```

Then change the consumer at `Write.tsx:57` to destructure the tree the hook already builds:

```tsx
const { data: entries, folders: folderRows } = useWritingDocuments(worldId);
const binder = useMemo(
  () => buildBinder(folderRows ?? [], entries ?? []),
  [folderRows, entries],
);
```

Use `binder.folders`, `binder.docsByFolder`, `binder.unfiled` in the render at `:170-190`.

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx vitest run src/pages/__tests__/write-binder.test.tsx`
Expected: PASS.

- [ ] **Step 5: Verify gates and commit**

```bash
node scripts/typecheck-strict.mjs
npx tsc -p tsconfig.app.json --noEmit 2>&1 | grep -c "error TS"   # must print 254
npx eslint src/ 2>&1 | grep '^✖'                                  # must print 62 errors, 73 warnings
npx vitest run
git add src/pages/Write.tsx src/pages/__tests__/write-binder.test.tsx src/config/version.ts
git commit -m "fix(write): 0.6855 - show folders in the binder

useWritingDocuments filtered folders out of `data` then Write.tsx
re-derived folders from that same filtered list, so the folder list was
always empty: the render block was dead code and + Folder wrote invisible
rows. Write.tsx now consumes the folder tree the hook already computes."
```

---

### Task A2: Stop the binder reshuffling as you type

**Context:** Reordering persists `sort_order: i * 10` (`use-writing-documents.ts:419`), but every new document and folder is created with `sort_order: 0` (`:130`, `:346`). The query orders by `updated_at desc` (`:54`), so all the 0-ties resolve to most-recently-edited-first. Typing in any not-yet-dragged document jumps it to the top of the binder.

**Files:**
- Modify: `src/hooks/use-writing-documents.ts:130` (createDocument), `:346` (createFolder)
- Test: `src/hooks/__tests__/next-sort-order.test.ts` (create)

**Interfaces:**
- Produces: `nextSortOrder(siblings: { sort_order: number | null }[]): number` — exported from `use-writing-documents.ts`, used by both create paths.

- [ ] **Step 1: Write the failing test**

```ts
// src/hooks/__tests__/next-sort-order.test.ts
import { describe, it, expect } from "vitest";
import { nextSortOrder } from "@/hooks/use-writing-documents";

describe("nextSortOrder", () => {
  it("returns 0 for an empty list", () => {
    expect(nextSortOrder([])).toBe(0);
  });
  it("returns max + 10 so new items land last", () => {
    expect(nextSortOrder([{ sort_order: 0 }, { sort_order: 30 }])).toBe(40);
  });
  it("treats null as 0", () => {
    expect(nextSortOrder([{ sort_order: null }])).toBe(10);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/hooks/__tests__/next-sort-order.test.ts`
Expected: FAIL — `nextSortOrder` is not exported.

- [ ] **Step 3: Implement and use it in both create paths**

```ts
// src/hooks/use-writing-documents.ts
export function nextSortOrder(siblings: { sort_order: number | null }[]): number {
  if (siblings.length === 0) return 0;
  return Math.max(...siblings.map((s) => s.sort_order ?? 0)) + 10;
}
```

In `useCreateDocument`, replace the hardcoded `sort_order: 0` at `:130` with a value derived from the current cache, and do the same at `:346` in `useCreateFolder`:

```ts
const existing = qc.getQueryData<WorldEntry[]>(docKeys.all(worldId!)) ?? [];
// ...
sort_order: nextSortOrder(existing),
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx vitest run src/hooks/__tests__/next-sort-order.test.ts`
Expected: PASS.

- [ ] **Step 5: Verify gates and commit**

```bash
node scripts/typecheck-strict.mjs && npx vitest run
git add src/hooks/use-writing-documents.ts src/hooks/__tests__/next-sort-order.test.ts src/config/version.ts
git commit -m "fix(write): 0.6856 - new docs no longer tie at sort_order 0

Every create wrote sort_order: 0 while the query orders by updated_at
desc, so all ties resolved to most-recently-edited and typing in a
document jumped it above ones the user had dragged into place."
```

---

### Task A3: Flush autosave on document switch (fixes corrupted word counts and streak ledger)

**Context:** The 1200 ms autosave debounce (`Write.tsx:114-131`) is never cleared or flushed when the document changes (`openDoc` navigates immediately, `:152-155`). Sequence: type in doc A → timer armed → open doc B → the doc-change effect resets `lastCount.current` to **B's** count (`:87`) → A's pending timer fires and computes `delta = w - lastCount.current`, i.e. **A's words minus B's baseline**. That delta is committed to the streak table (`:127`) and `setWords(w)` paints A's count while B is on screen. There is also no `beforeunload` guard, so the last ≤1.2 s of typing is lost on tab close.

**Files:**
- Modify: `src/pages/Write.tsx:82-89`, `:114-155`

**Interfaces:**
- Consumes: `nextSortOrder` is unrelated; this task only touches the debounce lifecycle.
- Produces: `flushPending()` — a local `useCallback` in `Write.tsx` that commits any pending save immediately. Referenced by Task B2.

- [ ] **Step 1: Add the flush-and-clear lifecycle**

Hold the in-flight document id alongside the timer so a late-firing timer can never attribute its delta to the wrong document:

```tsx
const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
const pending = useRef<{ docId: string; html: string; words: number } | null>(null);

const flushPending = useCallback(() => {
  if (debounce.current) {
    clearTimeout(debounce.current);
    debounce.current = null;
  }
  const p = pending.current;
  if (!p) return;
  pending.current = null;
  updateContent.mutate({ docId: p.docId, content: p.html });
  if (user && lastCount.current !== null && p.docId === docId) {
    rollWordSession(user.id, p.words - lastCount.current);
    lastCount.current = p.words;
  }
}, [updateContent, user, docId]);
```

- [ ] **Step 2: Flush on document change and on unmount**

```tsx
useEffect(() => flushPending, [docId, flushPending]);
```

- [ ] **Step 3: Guard the tab close**

```tsx
useEffect(() => {
  const onBeforeUnload = (e: BeforeUnloadEvent) => {
    if (!pending.current) return;
    flushPending();
    e.preventDefault();
  };
  window.addEventListener("beforeunload", onBeforeUnload);
  return () => window.removeEventListener("beforeunload", onBeforeUnload);
}, [flushPending]);
```

- [ ] **Step 4: Manually verify the bug is gone**

Run `npm run dev`. Open a document, type a sentence, and within 1 second click a different document in the binder. Confirm: the word count in the footer matches the document now on screen (previously it showed the previous document's count), and no spurious delta appears in the day's total.

- [ ] **Step 5: Verify gates and commit**

```bash
node scripts/typecheck-strict.mjs && npx vitest run
git add src/pages/Write.tsx src/config/version.ts
git commit -m "fix(write): 0.6857 - flush autosave before switching documents

The debounce was never cleared on doc change, so a pending timer for doc A
fired after the effect had already rebased lastCount to doc B, committing
(A words - B baseline) to the streak ledger and painting A's count while B
was open. Adds a beforeunload flush so the last second of typing survives."
```

---

### Task A4: Fix the frozen save indicator and stale title

**Context:** Two independent staleness bugs. (1) `Write.tsx:383` computes `Saved · Ns ago` during render with nothing scheduling a re-render, so it sticks at "Saved · 1s ago" forever. (2) `useRenameDocument.onSuccess` invalidates only `docKeys.all` (`use-writing-documents.ts:210-211`), never `["write-doc", docId]`, so the header (`Write.tsx:296`) and `document.title` keep the old name after a rename. `useUpdateDocumentContent` (`:178-181`) omits the same invalidation.

**Files:**
- Modify: `src/pages/Write.tsx:381-384`
- Modify: `src/hooks/use-writing-documents.ts:210-211`, `:178-181`

- [ ] **Step 1: Replace the frozen duration with a relative-time state that ticks**

```tsx
const [savedAgo, setSavedAgo] = useState<string>("");
useEffect(() => {
  if (!savedAt) return;
  const tick = () => {
    const s = Math.round((Date.now() - savedAt.getTime()) / 1000);
    setSavedAgo(s < 5 ? "just now" : s < 60 ? `${s}s ago` : `${Math.round(s / 60)}m ago`);
  };
  tick();
  const id = setInterval(tick, 5000);
  return () => clearInterval(id);
}, [savedAt]);
```

Render `{updateContent.isPending ? "Saving…" : savedAt ? `Saved · ${savedAgo}` : "Ready"}`.

- [ ] **Step 2: Surface save failure instead of showing nothing**

`useUpdateDocumentContent` has no `onError` (`use-writing-documents.ts:157-182`), so a failed save is silent. Add one that reports it:

```ts
onError: () => {
  toast({
    title: "SAVE FAILED.",
    description: "Your last change did not reach the server. Copy your text before closing this tab.",
    variant: "destructive",
  });
},
```

- [ ] **Step 3: Invalidate the single-doc query on rename and content update**

In both `useRenameDocument.onSuccess` and `useUpdateDocumentContent.onSuccess`, add alongside the existing invalidation:

```ts
qc.invalidateQueries({ queryKey: ["write-doc", variables.docId] });
```

- [ ] **Step 4: Manually verify**

Rename a document; confirm the header and the browser tab title both update immediately. Watch the footer for 30 seconds after a save; confirm the elapsed time advances.

- [ ] **Step 5: Verify gates and commit**

```bash
node scripts/typecheck-strict.mjs && npx vitest run
git add src/pages/Write.tsx src/hooks/use-writing-documents.ts src/config/version.ts
git commit -m "fix(write): 0.6858 - live save indicator, fresh title, visible save errors"
```

---

### Task A5: Make the session word ledger atomic

**Context:** `rollWordSession` (`use-write-doc.ts:72-83`) is a read-modify-write: `SELECT words` then `upsert({ words: (row?.words ?? 0) + delta })`. Two concurrent autosaves, or two tabs, both read the same value and the second overwrites the first, so daily totals under-count. The `upsert` also passes no `onConflict` target.

**Files:**
- Create: `supabase/migrations/<timestamp>_increment_writing_session.sql`
- Modify: `src/hooks/use-write-doc.ts:67-84`

**Note on the no-DDL constraint:** this adds a **function only**, no table or column change, so it does not touch the SF-II merge surface. If the reviewer prefers zero migrations until SF-II Phase 0 signs off, defer this task and leave the race documented in a code comment — do not attempt a client-side lock.

- [ ] **Step 1: Write the RPC**

```sql
create or replace function increment_writing_session(p_user_id uuid, p_day date, p_delta int)
returns void
language sql
security definer
set search_path = public
as $$
  insert into writing_sessions (user_id, day, words)
  values (p_user_id, p_day, greatest(p_delta, 0))
  on conflict (user_id, day)
  do update set words = writing_sessions.words + excluded.words;
$$;
```

- [ ] **Step 2: Confirm the unique constraint the upsert depends on exists**

Run against the project: `select conname from pg_constraint where conrelid = 'writing_sessions'::regclass and contype = 'u';`
Expected: a unique constraint covering `(user_id, day)`. If absent, **stop** — adding it is DDL on a table and needs SF-II sign-off; report back instead of proceeding.

- [ ] **Step 3: Call the RPC instead of read-modify-write**

```ts
await supabase.rpc("increment_writing_session", {
  p_user_id: userId,
  p_day: new Date().toISOString().slice(0, 10),
  p_delta: delta,
});
```

- [ ] **Step 4: Verify concurrency**

Open the editor in two tabs on different documents, type in both, and confirm the day's total equals the sum of both deltas rather than only the larger.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations src/hooks/use-write-doc.ts src/config/version.ts
git commit -m "fix(write): 0.6859 - atomic daily word increment"
```

---

## Phase B — One writing surface

### Task B1: Decide and record the surface decision

**Context:** There are four writing entry points and the relationship exists only in code comments. `Write.tsx:1-7` claims it is "the ONE writing surface … Supersedes the old /worlds/:id/write", while `WorldWritingSpace.tsx:4` still declares `// Route: /worlds/:worldId/write`. In fact `WorldWritingSpace` is lazily imported at `App.tsx:62` and **never rendered as a route element** — `/worlds/:worldId/write` maps to `WorldWriteRedirect` (`App.tsx:235`). So 865 lines containing zen mode with Escape, version history, Ctrl+S, and font/line-spacing controls are unreachable, and `/workshop` is a fourth surface nothing in Studio's chrome links to.

**This task is a decision, not code.** The recommendation is **port-then-delete**: keep `Write.tsx` as the surface (it is the one users reach and the one with the working autosave), port the four capabilities users actually lose, then delete `WorldWritingSpace.tsx`. Reviving it instead would mean shipping BUGS 8–10 below, which are latent only because the page is dead.

- [ ] **Step 1: Record the decision in `docs/ROADMAP.md` under Priority 3**, listing the four capabilities to port: zen mode with Escape exit, version history, Ctrl+S, font/line-spacing preferences.
- [ ] **Step 2: Confirm with the product owner before Task B4 deletes the file.** Deleting 865 lines is irreversible in effect even if recoverable in git; do not proceed to B4 without explicit sign-off.

---

### Task B2: Port zen mode and keyboard shortcuts into `Write.tsx`

**Context:** `Write.tsx` binds no shortcuts at all — no Ctrl+S, no focus toggle, no doc switcher — and its "Focus" button (`:315-318`) only collapses the side panels via `grid-cols-1` (`:336`), with no Escape exit and no fullscreen. The real zen mode is `WorldWritingSpace.tsx:583-635` with Escape at `:561-571`; shortcuts are at `:526-558`.

**Files:**
- Modify: `src/pages/Write.tsx`
- Reference (read, do not import): `src/pages/WorldWritingSpace.tsx:526-571`, `:583-635`

**Interfaces:**
- Consumes: `flushPending()` from Task A3 — Ctrl+S must call it rather than duplicating save logic.

- [ ] **Step 1: Add the shortcut handler**

```tsx
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      flushPending();
      return;
    }
    if (e.key === "Escape" && focus) setFocus(false);
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [focus, flushPending]);
```

- [ ] **Step 2: Show the shortcut in the Focus button title** so it is discoverable: `title="Focus mode (Esc to exit)"`.
- [ ] **Step 3: Manually verify** Ctrl+S saves immediately (footer flips to "Saving…") and Escape leaves focus mode.
- [ ] **Step 4: Verify gates and commit.**

---

### Task B3: Surface goal progress and session words where the writing happens

**Context:** The footer currently spends its space on a Julian Day readout (`Write.tsx:386`, `:37`) while goals and streaks — which exist and work (`GoalSetting.tsx:20-92`, `use-writing-stats.ts:28-83`, `use-writing-preferences.ts:16-19` `dailyGoalWords: 500`) — are never imported by `Write.tsx`. Separately, session deltas are written to `writing_sessions` (`use-write-doc.ts:67-84`) and rendered nowhere.

**Known reconciliation problem to respect:** there are two disjoint "words today" ledgers. The editor writes `writing_sessions`; `use-writing-stats.ts:100-114` computes `wordsToday` from `writing_entries.word_count` instead, and nothing reads `writing_sessions` back. **This task must read `writing_sessions`** for the editor's own progress indicator, and must not pretend the two agree. Reconciling them is Task D3.

**Files:**
- Modify: `src/pages/Write.tsx:380-390`
- Create: `src/hooks/use-session-words.ts`

- [ ] **Step 1: Add a hook that reads today's row**

```ts
export function useSessionWords() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["writing-session", user?.id, new Date().toISOString().slice(0, 10)],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("writing_sessions")
        .select("words")
        .eq("user_id", user!.id)
        .eq("day", new Date().toISOString().slice(0, 10))
        .maybeSingle();
      return data?.words ?? 0;
    },
  });
}
```

- [ ] **Step 2: Replace the Julian Day readout with goal progress**, keeping the mono/tier styling: `{sessionWords} / {dailyGoalWords} today` plus the existing per-document count. Keep the document word count; drop `julianDay()` from the footer.
- [ ] **Step 3: Verify gates and commit.**

---

### Task B4: Retire `WorldWritingSpace.tsx` (BLOCKED on B1 sign-off)

**Do not start without the sign-off from Task B1 Step 2.**

**Context:** Once B2 and B3 land, the remaining unported capabilities are version history and font/line-spacing preferences. Note that the version history on that page is **broken in three ways** and must not be ported as-is:

- **BUG 8:** `useDocumentVersions(selectedDocId, docTitle, editorContent)` is fed `editorContent`, but `handleEditorChange` writes only to a ref (`WorldWritingSpace.tsx:274` `pendingContentRef.current = html`) and never calls `setEditorContent` while typing. The hook snapshots from `contentRef` (`use-document-versions.ts:332`), so **Ctrl+S saves the document as it was when opened**, discarding the session.
- **BUG 9:** the 5-minute auto-snapshot guard is `content !== lastAutoSnapshotContentRef.current` (`use-document-versions.ts:349`) where `content` never changes per BUG 8 — so it never fires. Its effect deps also include `createSnapshotInternal`, which depends on `snapshots` (`:326`), so the timer resets on every snapshot-list change.
- **BUG 10 (data loss):** `clearLocalSnapshots(documentId)` runs unconditionally (`:240`) while the migration upload is fire-and-forget and gated on a lookup that can fail (`:206`, `:223`). If the upload fails, local revision history is already deleted, silently and permanently.

- [ ] **Step 1: Port font and line-spacing preferences** into `Write.tsx`, reading the existing per-world key `` `sf-writing-prefs-${worldId}` `` (`WorldWritingSpace.tsx:194`) so existing users keep their settings. `Write.tsx:362` currently hardcodes `className="sf-writing-serif"`.
- [ ] **Step 2: Port version history only after fixing BUGS 8–10** in `use-document-versions.ts`: pass live content (not a ref written behind React's back), and make `clearLocalSnapshots` conditional on a confirmed successful insert.
- [ ] **Step 3: Remove the dead import** at `src/App.tsx:62` and delete `src/pages/WorldWritingSpace.tsx`.
- [ ] **Step 4: Fix the delete-confirmation copy** that contradicts behavior: the prompt says "This cannot be undone" (`WorldWritingSpace.tsx:335`) while the mutation soft-deletes and toasts "Recoverable for 90 days" (`use-writing-documents.ts:238`, `:245`). If the page is deleted this moves to wherever the confirm lives; also align `ChapterTree.tsx:311-316`, which deletes a folder with **no** confirmation at all while `useDeleteFolder` is a **hard** delete (`use-writing-documents.ts:504-507`).
- [ ] **Step 5: Verify gates and commit.**

---

### Task B5: Fix the world-write redirect and Studio's world-crossing link

**Context:** Two entry-point defects. (1) `WorldWriteRedirect` reads `{ user, loading }` from auth but uses neither in its effect or deps (`Write.tsx:449-461`), and `useWritingDocuments` is gated only on `worldId` (`use-writing-documents.ts:59`), so navigating to `/worlds/:id/write` can fire `createDoc.mutate({ title: "Untitled" })` before auth resolves. Because `kicked.current = true` is set at `:452` before the branch, it never retries, leaving the user on `return <div />` (`:464`) with only a toast. (2) `Studio.tsx:75` renders `Workbench · {worlds[0].name}` with a "Write" link to `/write` (`:79`), but `/write` resolves to the globally most recent document across **all** worlds (`use-write-doc.ts:53-60`), so clicking Write under "World A" can open World B's document.

**Files:**
- Modify: `src/pages/Write.tsx:449-464`
- Modify: `src/pages/Studio.tsx:79`

- [ ] **Step 1: Gate the redirect effect on resolved auth**

```tsx
useEffect(() => {
  if (loading || !user) return;
  if (isLoading || !worldId || kicked.current) return;
  // ...existing body
}, [entries, isLoading, worldId, loading, user]);
```

- [ ] **Step 2: Only mark `kicked` once the navigation or creation actually succeeds**, so a failed create can retry rather than stranding the user on a blank page.
- [ ] **Step 3: Make Studio's Write link world-scoped**: point it at `/worlds/${worlds[0].id}/write` so the destination matches the world named in the heading.
- [ ] **Step 4: Manually verify** in a signed-out browser that `/worlds/<id>/write` redirects to `/auth` without creating a document (check the `world_entries` table count before and after).
- [ ] **Step 5: Verify gates and commit.**

---

## Phase C — Real tool data in the writing surface

This is the phase that answers "integration of every tool into the writing feature." It requires **no schema change**.

**Why it works without the entity-table merge:** every tool's filled-in answers already live in `worksheets.data` (a single `Json` column, `types.ts:870-881`), queryable per world by `useWorksheets(worldId)` (`use-worksheets.ts:43-57`) and per tool by `useWorksheetsByType` (`:311-327`). The map from tool slug into that blob already exists as `MasterFieldDef.worksheetPaths` — "Maps tool slug → dot-notation path into worksheet data JSON" (`entity-config.ts:71-75`), e.g. `{ label: "Surface Gravity (g)", worksheetPaths: { "planetary-profile": "physicalCharacteristics.surfaceGravity" } }` (`entity-config.ts:110-113`). Reading it needs only `getNestedValue` (`entity-prepopulate.ts:63-78`). Pairing label + value is exactly the loop already proven in `syncWorksheetToEntity` (`entity-sync.ts:55-75`) — so Phase C lifts that loop into a pure, tested helper and renders it. No join between `entities` and `world_entries` is involved.

**Avoid:** `useWorksheet` (single-worksheet hook) hard-throws for non-owners — `throw new Error("Unauthorized: ...")` (`use-worksheets.ts:300-302`) — which would break for collaborators. Use the list hooks, which rely on RLS (`use-worksheets.ts:67`).

### Task C1: Pure fact extraction

**Files:**
- Create: `src/lib/worksheet-facts.ts`
- Test: `src/lib/__tests__/worksheet-facts.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface WorksheetFact { key: string; label: string; value: string; }
  export function extractWorksheetFacts(
    toolType: string,
    data: unknown,
  ): WorksheetFact[];
  ```
  Later tasks (C2, C3, D2) call exactly this signature.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { extractWorksheetFacts } from "@/lib/worksheet-facts";

describe("extractWorksheetFacts", () => {
  it("pairs the master-field label with the value at the tool's path", () => {
    const facts = extractWorksheetFacts("planetary-profile", {
      physicalCharacteristics: { surfaceGravity: 1.47 },
    });
    expect(facts).toContainEqual({
      key: "surfaceGravity",
      label: "Surface Gravity (g)",
      value: "1.47",
    });
  });

  it("omits fields with no value rather than emitting blanks", () => {
    const facts = extractWorksheetFacts("planetary-profile", {});
    expect(facts).toEqual([]);
  });

  it("returns nothing for a tool with no mapped paths", () => {
    expect(extractWorksheetFacts("not-a-tool", { a: 1 })).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/lib/__tests__/worksheet-facts.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
import { ENTITY_MASTER_FIELDS } from "@/lib/entity-config";
import { getNestedValue } from "@/lib/entity-prepopulate";

export interface WorksheetFact {
  key: string;
  label: string;
  value: string;
}

/**
 * Reads the labeled facts a tool recorded, using the same
 * worksheetPaths map entity-sync already relies on. Pure: no React,
 * no network, so it is unit-testable and safe to call while rendering.
 */
export function extractWorksheetFacts(toolType: string, data: unknown): WorksheetFact[] {
  const facts: WorksheetFact[] = [];
  const seen = new Set<string>();
  for (const fields of Object.values(ENTITY_MASTER_FIELDS)) {
    for (const field of fields) {
      const path = field.worksheetPaths?.[toolType];
      if (!path || seen.has(field.key)) continue;
      const raw = getNestedValue(data as Record<string, unknown>, path);
      if (raw === undefined || raw === null || raw === "") continue;
      seen.add(field.key);
      facts.push({
        key: field.key,
        label: field.label,
        value: Array.isArray(raw) ? raw.join(", ") : String(raw),
      });
    }
  }
  return facts;
}
```

- [ ] **Step 4: Run the test to confirm it passes.**
- [ ] **Step 5: Commit.**

---

### Task C2: Fill the dead "Refs" tab with real tool data

**Context:** The inspector's Refs tab is a stub — text plus two outbound links, carrying nothing (`Write.tsx:258-265`). This is the natural home for tool data and is purely additive.

**Files:**
- Create: `src/components/writing/WorksheetFactsPanel.tsx`
- Modify: `src/pages/Write.tsx:258-265`

**Interfaces:**
- Consumes: `extractWorksheetFacts` (C1); `useWorksheets(worldId)` (`use-worksheets.ts:43`); `insertIntoEditor` (`Write.tsx:41-46`).
- Produces: `<WorksheetFactsPanel worldId onInsert />`.

- [ ] **Step 1: Build the panel**, grouping by worksheet with the canonical tool name from `getToolDisplayName(ws.tool_type)`, each fact a row of `label` (tier-3, 11px uppercase tracking-[1.5px]) and `value` (JetBrains Mono, tier-1), plus an insert button per fact and a link to the worksheet at `getToolRoute(ws.tool_type)?worldId=…&worksheetId=…`.
- [ ] **Step 2: Empty state** must name the fix, not just the absence: "No tool data in this world yet. Fill in a tool and its values appear here." linking to `/guide/tools`.
- [ ] **Step 3: Wire into the Refs tab**, replacing the stub, passing `onInsert={(t) => insertIntoEditor(t)}`.
- [ ] **Step 4: Manually verify** with a world that has a saved Planetary Profile: the panel lists "Surface Gravity (g) 1.47", and clicking insert puts that text in the prose at the cursor.
- [ ] **Step 5: Verify gates and commit.**

---

### Task C3: Make pins carry real data instead of a static tagline

**Context:** Both pin paths store the tool's marketing subtitle, not the writer's data: `PinToWritingButton` is passed `content={cfg.subtitle}` (`ToolPageLayout.tsx:169`) and `handlePinWorksheet` uses `content: cfg?.subtitle ?? ""` (`WritingReferencePanel.tsx:155`). So a writer pins "Genesis: Planetary Profile" and their writing space shows a generic description instead of their planet's gravity. Additional defects in the same store: pins are localStorage-only (`use-writing-pins.ts:26`) even though "Cloud sync across devices" is a sold Pro feature; each hook instance keeps its own copy with no `storage` listener, so pinning on a tool page does not update an open writing space; `removePin(id)` filters by id alone (`:93`) while `addPin` dedupes on `(id, type)` (`:75`); and `PinToWritingButtonProps.itemType` omits `"snippet"`, which `PinnedItem.type` allows, making that variant unreachable.

Also note `onPinEntity` in the editor is a toast no-op — `toast({ title: \`Pinned ${e.name}\` })` (`Write.tsx:251`) — so pinning from the inspector is unimplemented end to end.

**Files:**
- Modify: `src/hooks/use-writing-pins.ts`
- Modify: `src/components/tools/PinToWritingButton.tsx`, `src/components/tools/ToolPageLayout.tsx:163-172`
- Modify: `src/components/writing/WritingReferencePanel.tsx:145-158`

- [ ] **Step 1: Pass real facts as the pin content.** At the `ToolPageLayout` call site, replace `content={cfg.subtitle}` with a summary built from `extractWorksheetFacts(toolType, formState)` — e.g. the first three facts as `label: value` joined by `" · "`. The tool page already holds the live form state.
- [ ] **Step 2: Fix `removePin` to match on `(id, type)`** so a note and a worksheet sharing an id cannot delete each other.
- [ ] **Step 3: Align the two type unions** so `PinToWritingButtonProps.itemType` and `PinnedItem["type"]` are one exported type.
- [ ] **Step 4: Cross-instance sync.** Add a `storage` event listener in `useWritingPins` so a pin created on a tool page appears in an already-open writing space:

```ts
useEffect(() => {
  const onStorage = (e: StorageEvent) => {
    if (e.key === storageKey(worldId)) setPins(loadPins(worldId));
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}, [worldId]);
```

- [ ] **Step 5: Make pinned rows clickable** — currently the Pinned tab renders a title, a type chip, and an unpin button, with no way to reach the source (`WritingReferencePanel.tsx:429-470`). Link worksheet pins to their tool route.
- [ ] **Step 6: Document the sync limitation honestly.** Add a one-line note in the Pinned tab empty state that pins are per-browser, or promote them to Supabase — but promotion needs a table, so it is Phase D. Do not leave a UI that implies cloud sync.
- [ ] **Step 7: Verify gates and commit.**

---

### Task C4: Put tool data into the compiled manuscript

**Context:** `WorldCompile` sources only writing documents (`WorldCompile.tsx:76-77`); chapters are built purely from `doc.title` / `doc.content` (`:142-164`). No world or tool data reaches the export, so a compiled manuscript carries none of the worldbuilding.

**Files:**
- Modify: `src/pages/WorldCompile.tsx:142-164`

- [ ] **Step 1: Add an optional "World Appendix" chapter**, off by default, appended to the `chapters` memo. Build its content from `extractWorksheetFacts` across the world's worksheets rather than `generateGenericText` (`src/lib/text/templates/generic.ts:24`), whose fixed-width ASCII frame (`formatters.ts:18`, `:101`) is built for file export, not for a chapter body.
- [ ] **Step 2: Respect the preview's sanitizer** — the preview renders through `sanitizeHtml` (`WorldCompile.tsx:419`), so wrap plain text in markup rather than emitting raw newlines.
- [ ] **Step 3: Verify** the appendix appears in the `.docx`, `.md`, and `.txt` exports (`WorldCompile.tsx:186`, `:201`, `:208`) and can be toggled off.
- [ ] **Step 4: Verify gates and commit.**

---

## Phase D — Deferred (needs schema or cross-team decisions)

These are **not** to be implemented under this plan. Each is recorded with why it is blocked.

- **D1 — Cloud-synced pins.** Needs a new table or a payload column; `writing_entry_entities` has no payload column (`types.ts:1555-1560`). Blocked by the SF-II no-DDL gate.
- **D2 — Entity ↔ worksheet facts in the entity inspector.** Requires resolving the two-table split (SF-II §4.2). Until the merge, an entity chosen in `WritingEntityPanel` (from `entities`) is not addressable by `entity_worksheets` (which FKs `world_entries`).
- **D3 — Reconcile the two "words today" ledgers.** The editor writes `writing_sessions`; the goal UI reads `writing_entries.word_count` (`use-writing-stats.ts:100-114`). Deciding the canonical source is a product decision, and streaks currently measure *entry creation* rather than writing (`use-writing-stats.ts:37`), so a novelist editing the same chapter daily shows 0 words and breaks their streak while the UI calls it a "day streak" (`StatsPanel.tsx:80`).
- **D4 — Per-document metadata (POV, status, synopsis).** `metadata: {}` is written at creation and never read or updated (`use-writing-documents.ts:128`, `:347`). Additive to an existing `jsonb` column, but needs product definition first.
- **D5 — Find/replace, typewriter mode, scene tier, per-document export.** All absent; each is a feature, not a fix. The document model has only two levels — document and folder (`use-writing-documents.ts:4-5`) — so a scene tier is a model change.
- **D6 — Unify the three word counters.** `ChapterTree.tsx:74-79`, `use-document-versions.ts:56-60`, and `@/lib/text` each define their own `countWords`; none decode HTML entities, so TipTap's `&nbsp;` glues words together and surfaces legitimately disagree.

---

## Self-Review

**Spec coverage.** The request was consistency plus integration of every tool into the writing feature, plus small bugs and discontinuities. Consistency: Tasks A1–A5 and B5 remove behavioural inconsistency; B1–B4 remove the four-surface split; C3 removes the pin/data inconsistency. Integration: C1–C4 carry real tool data into the inspector, the pins, and the compiled manuscript, covering every tool that declares `worksheetPaths`. Small bugs: 15 numbered defects are cited with file:line and each is assigned to a task or explicitly deferred in Phase D.

**Coverage gap — measured, and it changes the shape of "every tool".** `extractWorksheetFacts` can only surface tools that appear in `ENTITY_MASTER_FIELDS[*].worksheetPaths`. Verified count:

```bash
grep -oE '"[a-z-]+":\s*"[a-zA-Z.]+"' src/lib/entity-config.ts | grep -oE '^"[a-z-]+"' | tr -d '"' | sort -u
```

**Only 7 of 28 tools are mapped:** `empire-designer`, `evolutionary-biology`, `planetary-profile`, `spacecraft-designer`, `star-system-builder`, `technology-consequences`, `xenomythology-framework-builder`. So Phase C as written reaches a quarter of the catalog. The remaining 21 split into three groups needing different work, and **Task C5 below is required before this counts as "every tool"**:

1. **~15 worksheet-backed tools with no mapping** (`propulsion-consequences-map`, `space-expansion-modeler`, `drake-equation-calculator`, `species-interaction-matrix`, `one-big-lie`, `time-dilation`, `habitable-zone-calculator`, `lexdrift`, `surface-gravity-calculator`, `timeline`, `sensorium`, `gravitas`, `kardashev-scale`, …). These need `worksheetPaths` entries added — data entry against each tool's form-state shape, no new code.
2. **6 tools that do not use `worksheets` at all.** The five simulators and the cartographer persist to a **separate `simulation_saves` table** (`use-simulation-save.ts:67`, `:89`), so `extractWorksheetFacts` will never see them regardless of mapping. Integrating them needs a parallel extractor reading `simulation_saves`.
3. **Environmental Chain Reaction stores qualitative slugs, not values** (`use-world-parameters.ts:12-19`, `world-parameters.ts:4-5`), so its facts must render through `parseParameterSlug` labels (`world-parameters.ts:98-111`). `writing-workshop` is not a worldbuilding tool and is out of scope.

### Task C5: Extend coverage to the rest of the catalog

- [ ] **Step 1:** For each of the ~15 unmapped worksheet tools, open its page, read the form-state shape it saves, and add `worksheetPaths` entries for its 3–5 most narratively useful fields to the matching `MasterFieldDef` in `src/lib/entity-config.ts`. Add a `worksheet-facts` test case per tool as you go, mirroring C1's test.
- [ ] **Step 2:** Write `extractSimulationFacts(toolType, data)` in `src/lib/worksheet-facts.ts` with the same `WorksheetFact[]` return type, reading `simulation_saves` rows, and render it in the same panel so simulators appear alongside worksheets.
- [ ] **Step 3:** Special-case Environmental Chain Reaction to emit `parseParameterSlug(...).label` values.
- [ ] **Step 4:** Verify the panel shows facts for a world exercising one tool from each group, then commit.

**Placeholder scan.** No "TBD" or "add error handling" steps; every code step carries the actual code. Task A5 Step 2 and Task B4 are deliberate stop-and-ask gates, not placeholders.

**Type consistency.** `WorksheetFact` / `extractWorksheetFacts(toolType, data)` is defined in C1 and used with that exact signature in C2, C3, and C4. `nextSortOrder(siblings)` is defined in A2 and used in both create paths. `flushPending()` is defined in A3 and consumed by B2.

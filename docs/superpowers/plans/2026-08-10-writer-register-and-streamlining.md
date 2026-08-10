# Writer Register & Streamlining Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use `- [ ]` checkboxes.

**Goal:** Make the world surfaces read like Studio and the writing space — the two screens the product owner singled out as "easier on the eyes" — and close the remaining streamlining gaps.

**Architecture:** No new design system. The codebase already declares two typographic **registers** in its own file headers, and the loved screens are one of them. This plan extends that register to the surfaces that never got it, then removes the leftover inconsistencies.

---

## 0. BLOCKER — the work is not on production

**None of the last 24 commits are live.** Every Vercel deployment for `feat/solaris-native-rebuild` has `environment: "Preview"`. Production (`stellarforge.tools`) serves `main` — verified by pulling the live bundle, which contains `0.6844`, while the branch is at `0.6885`.

- [ ] **Decide how this branch reaches production.** It is 23+ commits ahead of `main` and mixes the Solaris native rebuild with this UI work. Options: open a PR and merge to `main`; or cherry-pick the UI/writing commits onto `main` if Solaris should not ship yet.
- [ ] Until that happens, review on the preview URL, not stellarforge.tools. Get the current one with:
  ```bash
  ID=$(gh api "repos/Escielenn/cosmos-builders-toolkit-v2/deployments?per_page=1" --jq '.[0].id')
  gh api "repos/Escielenn/cosmos-builders-toolkit-v2/deployments/$ID/statuses" --jq '.[0].environment_url'
  ```

---

## 1. The register diagnosis

The codebase names two voices in file headers:

- `src/pages/Studio.tsx:4` — *"Register: WRITER — Lora italic voice, sentence case, no // prefixes"*
- `src/pages/Write.tsx:4` — *"Register: WRITER (Lora)"*
- `src/pages/EarlyAccess.tsx:4` — *"Register: MONO (campaign voice — // labels, tracked caps, no Lora)"*

Both screens singled out as easy on the eyes are WRITER. Measured split (`font-serif` uses vs `uppercase tracking-[` uses):

| Surface | serif (WRITER) | tracked caps (MONO) |
|---|---|---|
| `Studio.tsx` | **33** | 0 |
| `Write.tsx` | **10** | 2 |
| `WorldDashboard.tsx` | **0** | 3 |
| `WikiBrowse.tsx` | **0** | 5 |
| `WorldGraph.tsx` | **0** | 5 |
| `Worlds.tsx` | **0** | 2 |
| `Collection.tsx` | **0** | 1 |
| `WorldChronicle.tsx` | **0** | 0 |

Six world/library surfaces contain **zero** WRITER voice. That is the whole of the "harder on the eyes" complaint, and it is a register mismatch, not a color or spacing problem.

**Where MONO stays.** MONO is right for instrument readouts and should not be purged: simulator HUDs, the StatusBar telemetry, tool-page data panels, and `EarlyAccess`. The rule this plan establishes:

> **WRITER for surfaces a writer inhabits** (Studio, Write, world dashboard, wiki, chronicle, collection, worlds list). **MONO for instruments that report numbers** (simulators, tool readouts, status bar).

### Task 1.1: Write the register down where it can be enforced

- [ ] Add a "Typographic registers" section to `CLAUDE.md` after the Typography section, stating the rule above and giving the WRITER type ramp copied from `Studio.tsx`:
  - Hero: `font-serif text-[34px] md:text-[44px] italic leading-tight text-t1`
  - Section head: `font-serif text-[20px] italic text-t1`
  - Rail label / meta: `font-serif text-[13px] italic text-t3`
  - Body: `font-serif text-[16px] leading-[1.7] text-t2`
- [ ] Add a `Register:` header comment to each file converted below, matching the existing convention.

### Task 1.2: Convert `WorldDashboard.tsx` (the page named in the request)

`WorldDashboard.tsx` is 1,246 lines vs Studio's 418, so density is a second problem on top of register. Convert the page chrome first, leave data panels alone.

- [ ] Replace the H1 at `WorldDashboard.tsx` (`font-display text-3xl md:text-4xl font-light tracking-sf-title uppercase text-t1`) with the Studio hero ramp in sentence case, e.g. *"Mr. Ix"* rather than *"MR. IX"*.
- [ ] Replace `font-mono text-[12px] tracking-[0.18em] uppercase text-t3` eyebrows with `font-serif text-[13px] italic text-t3`. Keep mono only where the value is a number or coordinate.
- [ ] Replace `font-heading ... uppercase tracking-[2px]` section heads with `font-serif text-[20px] italic text-t1`.
- [ ] Raise body copy to `text-t2` at `text-[15px]/leading-[1.7]`; the page currently leans on tier-3.
- [ ] Verify against Studio side by side at 1600px before moving on.

### Task 1.3: Convert the remaining five surfaces

Same treatment, one commit each so each is independently reviewable and revertable:

- [ ] `Worlds.tsx`
- [ ] `Collection.tsx`
- [ ] `WikiBrowse.tsx`
- [ ] `WorldChronicle.tsx`
- [ ] `WorldGraph.tsx` — chrome only; the graph canvas keeps its instrument styling.

---

## 2. Density — the second half of "easier on the eyes"

Studio reads well partly because it shows *less*. `WorldDashboard.tsx` is three times its length.

- [ ] **Measure before cutting.** List every distinct panel rendered by `WorldDashboard.tsx` and mark each: (a) a writer opens the world to see it, (b) useful but secondary, (c) telemetry/decoration.
- [ ] Keep (a) above the fold. Move (b) behind a disclosure or a secondary tab. Delete (c) or demote it to the status bar.
- [ ] Target: the world dashboard fits one 1080px viewport before scrolling, like Studio does.
- [ ] Apply Studio's rhythm: a left rail for navigation, one column of content, generous vertical spacing (`mb-7`/`mb-12`), no nested bordered panels more than one level deep.

---

## 3. Open bugs

### 3.1 Background previews do not render — NEEDS A REPRO

Investigated and **could not reproduce statically**. Verified all of:
- The image URLs return HTTP 200 (`images.unsplash.com`, `cdn.esahubble.org`).
- `index.html`'s CSP `img-src` explicitly allows both hosts.
- Vercel sends **no** `Content-Security-Policy` header, so nothing overrides the meta tag.
- The selector renders a plain `<img src={option.url}>` (`BackgroundSelector.tsx:78-82`).

- [ ] Get from the product owner: which screen exactly (Settings → Background? the world Appearance dialog?), and the browser console output when it happens. Do **not** "fix" this speculatively — every layer checks out, so the cause is something only the failing session shows (an extension, a cached bundle, or a specific option whose `url` is empty).
- [ ] Once reproduced, add an `onError` fallback to the preview tile so a dead image degrades to the starfield placeholder instead of a blank box.

### 3.2 Apply the atomic word-ledger migration

- [ ] Apply `supabase/migrations/20260809_atomic_writing_session_increment.sql`. Its prerequisite is confirmed: `writing_sessions` is declared `primary key (user_id, day)` (`20260710_add_manuscript_layer.sql:67-73`), which is the unique constraint `ON CONFLICT` needs. It adds a function only — no table DDL, so it is outside the SF-II Phase-0 gate.
- [ ] No coordinated deploy needed: `rollWordSession` already calls the RPC and falls back to read-modify-write when it is absent, so clients become atomic the moment the function lands.

### 3.3 Still-open items from the previous plan

Carried forward from `2026-08-09-writing-integration-and-consistency.md`:

- [ ] **Decide the one writing surface.** `WorldWritingSpace.tsx` (865 lines: zen mode, version history, font controls) is imported at `App.tsx:62` but never routed. Recommendation: port-then-delete. Its version history must be fixed before porting — it snapshots content as of document *open*, its auto-snapshot never fires, and a failed migration deletes local history unconditionally.
- [ ] **Goal progress in the editor footer** (B3): the footer spends its space on a Julian Day readout while `dailyGoalWords` exists and is never shown while writing.
- [ ] **Tool coverage** (C5 continued): 13 of 28 tools are mapped into the fact extractor. Remaining worksheet-backed tools need `worksheetPaths` entries; the 5 simulators plus the cartographer persist to `simulation_saves` and need a parallel extractor.

---

## 4. Consistency sweep — verify, don't assume

Each of these is a check with a command. Fix only what the command actually finds.

- [ ] **No tool link bypasses the shared route map:**
  ```bash
  grep -rn '`/tools/\${' src/ --include=*.tsx | grep -v getToolRoute
  ```
  Every hit should either use `getToolRoute()` or be a world-scoped `/worlds/:id/tools/:slug` path.
- [ ] **No bold weights return:**
  ```bash
  grep -rnE "font-(semibold|bold|extrabold|black)" src/ --include=*.tsx
  ```
  Only the semantic `<strong>` in `PortableTextRenderer.tsx` may match.
- [ ] **No type below the 10px floor:**
  ```bash
  grep -roE "text-\[[0-9]px\]" src/ --include=*.tsx
  ```
  Should return nothing.
- [ ] **No hardcoded catalog counts:** every user-facing count derives from `FREE_TOOL_COUNT` / `PRO_TOOL_COUNT` / `TOTAL_TOOL_COUNT` / `SIMULATOR_COUNT` in `tools-config.ts`.
- [ ] **Gates hold after every change:** typecheck-strict exits 0, `tsc` error count stays at the pre-existing **254**, eslint stays at **62 errors / 73 warnings**, `npx vitest run` green (currently 35 tests).

---

## Self-Review

**Coverage.** The request was: verify the deploy (§0, resolved — it is preview-only, which is why the screenshot shows 0.6844), get Supabase going for A5 (§3.2, resolved without DB access by reading the migration history), another pass and plan for a smooth consistent UI/UX (§1–2, grounded in the codebase's own register concept and a measurement), the background preview bug (§3.1, investigated and honestly parked pending a repro), the world page feeling like Studio (§1.2), and export from writing (**already shipped** in 0.6885).

**Honesty about the one unknown.** §3.1 is the only item without a fix. Four independent layers check out, so proposing a change would be guessing at a cause I have no evidence for. It needs one console screenshot from a failing session.

**No placeholders.** Every task names files, exact class strings, or a runnable command. §2's first step is deliberately a measurement rather than a cut list, because deciding which of a 1,246-line page's panels a writer needs is the product owner's call, not something to guess at.

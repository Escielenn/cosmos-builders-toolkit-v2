# StellarForge — Improvements Backlog

*Full-product review, 2026-07-10. Grounded in: Supabase advisors (security + performance), the production build profile, the codebase scan, the Cowork Implementation Guide, and the StellarForge II plan. Ordered by impact ÷ effort within each tier.*

Baseline at review: build **v0.6702**, all 5 launch-guide phases shipped, security review complete, fork_world fixed. Launch: **Aug 11, 2026**.

---

## Tier 0 — Do before launch (correctness, trust, first-impression)

1. **Rotate Supabase keys once.** The repo is public and a real `.env` sat briefly in early git history (only `VITE_` publishable values — low risk, RLS is the real guard — but rotation closes it cleanly). Dashboard → Settings → API. *5 min, you must do it.*
2. **Auth "connection lost" state.** The paused-DB incident showed the app hangs on an unreachable backend instead of failing loudly. Add a timeout + retry + friendly banner to the auth flow (and ideally a global Supabase health ping). *Prevents the worst first-impression failure mode.*
3. **Regenerate Supabase types.** The manuscript tables (`binder_nodes`, `scene_pins`, `writing_sessions`, extended `writing_entries`) are accessed through a quarantined `any` cast in `useManuscript.ts`. `supabase gen types typescript` restores full type safety on the newest, least-tested surface. *15 min.*
4. **Damaged-fork repair pass.** `fork_world` is fixed going forward, but forks created before today still have flattened trees / missing timelines. Count them, then run a one-off repair (or offer affected users a re-fork). *Data users already made.*
5. **Waitlist confirmation email domain.** Confirm `noreply@stellarforge.tools` is verified in Resend and SPF/DKIM pass, or confirmation emails land in spam during the campaign's most important window. *Verify before the campaign drives traffic.*

## Tier 1 — High impact, near-term

6. **Database performance sweep** (Supabase advisors, ~0 correctness risk):
   - **~80 `auth_rls_initplan` warnings** — older RLS policies call `auth.uid()` per-row instead of `(select auth.uid())`. On large worlds this is a real query-time tax. My recent migrations use the fast pattern; retrofit the rest in one migration.
   - **~40 `multiple_permissive_policies`** — several tables have multiple SELECT policies for the same role, each evaluated on every query. Consolidate into single `OR`'d policies.
   - **~26 unindexed foreign keys** — add covering indexes (cheap; helps joins and cascade deletes).
   - **~35 unused indexes** — drop after confirming they're not needed for planned features (smaller writes, less storage).
7. **Bundle diet.** `vendor-pdf` is **1.6 MB**, main `index` **796 KB**, `lucide-react` **664 KB**. Actions: lazy-load `@react-pdf/renderer` only when an export is triggered (it's on the critical path now); replace the barrel `lucide-react` import with per-icon imports (tree-shakes hundreds of KB); confirm `html2canvas`/`docx` are lazy. *Directly improves load time — a Track-S "smooth" goal and an SEO signal.*
8. **Test coverage from ~1 → a real suite.** One placeholder test guards a 478-component app with money and user worlds on the line. Priority targets: the `fork_world` invariant (I verified it by hand — encode it), RLS parity per role, the waitlist edge function, word-count/streak math, and a Playwright smoke of signup → studio → write → save.
9. **Studio ↔ editor loop polish.** Now that `/write` exists: wire the streak strip to the real `writing_sessions` rollup (today it approximates from entry timestamps); add "new scene from Studio"; make the continue-card's progress ring read live chapter/book percentages.
10. **Mobile pass on the new surfaces.** `/studio`, `/write`, and `/early` were built desktop-first. The editor especially (binder + editor + inspector three-column) needs the guide's mobile patterns: collapse rails to sheets, bottom-bar simplification, touch targets ≥44px. *Writers draft on phones.*

## Tier 2 — Quality of life & product depth

11. **The cascade, made visible.** The product's core promise is "change upstream → everything downstream shifts," but nothing in the UI *shows* the cascade propagating. A "cascade ripple" view — pick a worksheet value, see which downstream entities/worksheets depend on it — would make the differentiator legible. (The `connections` layer already has the data.)
12. **World Influence panel in the editor** (guide §4, deferred). The inspector's Refs tab exists; add the mono gauge rows (gravity/tide/temp/culture) pulled live from the world's worksheet data, with the "N lines reference world parameters · consistent" footer. This is the cascade differentiator inside the writing flow.
13. **Corkboard drag-reorder + binder drag-reorder.** The binder and corkboard render correctly but reordering is not yet wired (the guide calls for dnd-kit). High-value for anyone organizing a manuscript.
14. **Snapshot restore.** `world_versions` stores history but there's no restore path (SF-II OQ1). Ship "fork-from-snapshot" so version history is actionable, not just a ledger.
15. **Command palette (⌘K).** 25 tools + 5 sims + worlds + entities across 78 pages is a lot to navigate by menu. A fuzzy launcher (reuse the `@`-mention search infra) would make power users fast.
16. **Export polish.** Now that the print palette is tokenized, add: cover-page options, a "world bible" full-compile (partially there via WorldCompile), and EPUB export for manuscripts (writers will ask).
17. **Autosave affordance everywhere.** The editor has a save-dot; extend the same "saved 12s ago" language to worksheets and the wiki so the privacy-first promise ("your worlds are yours") feels continuously safe.

## Tier 3 — Platform & polish

18. **Simulator overhaul (SF-II Track S).** The five sims still lag the rest of the app: Rogue is an iframe seam, ExoSky/Solaris are unprofiled for frame rate, only Solaris lacks a Science page. The plan scopes this as beautiful/smooth/effective — the biggest single remaining design lift. Start with S0 (perf baseline + the Solaris science page).
19. **SF-II Pillar B (the big dedup).** `world_entries` and `entities` are still two parallel "thing in a world" models; the manuscript layer I built deliberately reused `writing_entries` to avoid adding a *third*. The canonical-model merge is the plan's center of gravity and unblocks a cleaner graph, fork, and snapshot story. Gated behind B0 production profiling.
20. **Accessibility audit.** 118 of 478 components use aria/role; images are clean (0 missing alt). Run axe across the token-unified surfaces, verify AA contrast per text tier per surface (tier-4/5 will fail on some panels — encode the "decorative only" policy), and confirm keyboard nav through the editor and mention picker.
21. **Analytics for the launch.** No product analytics wired. Even a lightweight, privacy-respecting event stream (signup funnel, tool usage, waitlist→activation) would make the Aug 11 launch measurable against the Operating Plan's KPIs (800 waitlist, signups goal).
22. **CI lint debt.** 226 pre-existing ESLint errors are informational-only in CI right now. Ratchet them down (like the hex baseline) so the number can only shrink.

---

### What's already solid (don't touch)
Clean codebase hygiene (0 TODO/FIXME, 3 console.logs, 0 missing alt text). Strict CSP. Privacy-first architecture with owner-scoped RLS. A real design token system with CI enforcement. Sentry wired. The teal design language is cohesive and distinctive — genuinely not "AI slop."

*These worlds exist in you — and now in exactly the right number of tables.*

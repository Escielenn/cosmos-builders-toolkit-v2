# StellarForge Backlog

Tasks, integrations, and improvements discussed but not yet implemented.

---

## Internationalization (i18n)

**Status:** Infrastructure complete, string extraction pending

### What's Done
- `i18next` + `react-i18next` + `i18next-http-backend` + `i18next-browser-languagedetector` installed
- Config at `src/lib/i18n.ts` — loads JSON from `/public/locales/{lng}/{ns}.json`
- Language detection: localStorage (`stellarforge-language`) → browser language → English fallback
- Language tab added to Settings dialog with selector UI
- Initial English namespace: `public/locales/en/common.json` (nav, actions, settings, worksheets, export, sharing, worlds, auth)

### What's Left
- **String extraction** (~2,000-4,000 keys across the app):
  - [ ] Common UI (nav, buttons, dialogs, toasts) — use `t()` calls with `common` namespace
  - [ ] Tool page UI (labels, placeholders, headings) — 19 tools × 30-80 strings each
  - [ ] Simulator pages — 3 × 20-40 strings
  - [ ] Landing page / marketing copy — ~50-80 strings
  - [ ] PDF/DOCX export templates — 19 tools × 2 templates × 20-40 strings
  - [ ] Markdown text export templates — 19 tools × 15-30 strings
  - [ ] Error messages, validation text — ~50-80 strings
  - [ ] Tool intros (`src/lib/tool-intros.ts`) — 19 blocks of paragraph text
  - [ ] Scientific data labels (various `data.ts` files)
- **Add target languages** — uncomment in `SUPPORTED_LANGUAGES` in `src/lib/i18n.ts` as translations land
- **Translation files** — create `public/locales/{es,fr,de,...}/common.json` etc.
- **Branded names** (Cascade, Vessel, Gravitas, etc.) should NOT be translated — use interpolation variables or keep outside the translation system
- **PDF font support** — CJK languages need different fonts bundled in react-pdf
- **Sanity CMS articles** — separate localization via Sanity's own i18n (field-level or document-level)
- **Number/date formatting** — calculators display numbers that vary by locale (`1,000.5` vs `1.000,5`)
- **Layout flex** — German text ~30% longer; RTL languages (Arabic, Hebrew) need layout mirroring

---

## SENSORIUM — Remaining Phases

**Status:** ~70% complete (Phase 1 done, Phase 2-5 partial)

### Phase 2 Completion — Richer Validation
- [ ] `calculatePlausibilityScore(selectedModalities, environment)` → 0-100% weighted score
- [ ] `suggestAlternatives(invalidModality, environment)` → ranked replacement options
- Currently `validateSelection` returns basic pass/fail; spec calls for weighted scoring

### Phase 3 Completion — Push-to-Worksheet Sync
- [ ] "Push derived senses to linked Phylo worksheet" feature
- [ ] `pushSensoryData(sensoriumState, targetWorksheetId)` function
- [ ] "Push to Worksheet" button in worksheet link section

### Phase 4 — Advanced Features
- [ ] **Fine-tuning sliders** — per-modality sensitivity (0-100%) without removing modalities
- [ ] **Comparative species view** — side-by-side 2-3 species sensory profiles
- [ ] **Perceptual simulation text** — "What does this species experience when..." narrative generator (new file: `src/lib/sensorium/experiential.ts`)

### Phase 5 — Polish
- [ ] Tooltips with scientific explanations per modality card
- [ ] Keyboard navigation (arrow keys, Enter, Tab)
- [ ] Framer Motion transitions on modality add/remove
- [ ] First-use tutorial overlay

---

## Tool Enhancements

### Species Interaction Matrix (Symbiosis) — Swapped Icons
- [ ] `species-interaction-matrix` currently uses `technology-consequences.svg` and `technology-consequences` uses `species-interaction.svg` — icons are swapped in `src/components/icons/tool-icons.tsx` (lines 22-24). Fix when new distinct icons are available.

### Timeline
- [ ] Collaborative editing conflict resolution (beyond presence avatars)
- [ ] More timeline templates

### Gravitas
- [ ] Additional presets for exotic scenarios (neutron star surface, Lagrange points)

---

## Export System

- [ ] **Notion export** — integration exists but could be expanded to more tools
- [ ] **CSV/spreadsheet export** — for data-heavy tools (Drake, Species Matrix, Star System)
- [ ] **Cross-tool linked export** — export multiple related worksheets as a single document

---

## Infrastructure & DevOps

- [ ] **CI/CD pipeline** — currently manual deploy via `npx vercel --prod`; could add GitHub Actions
- [ ] **Automated testing** — no test suite currently; Vitest + React Testing Library would be natural fit
- [ ] **Bundle size optimization** — `vendor-pdf` chunk is 1.5MB; consider lazy-loading react-pdf only on export

---

## Collaboration (Phase 3+)

- [ ] **Real-time co-editing** — beyond presence; actual field-level sync via Supabase Realtime
- [ ] **Comments/annotations** — per-field discussion threads on worksheets
- [ ] **Activity feed** — show recent changes by collaborators on the world dashboard

---

## Content

- [ ] **More Learn articles** — Sanity CMS has room for expansion
- [ ] **Bookshelf expansion** — curated reading lists per genre/topic
- [ ] **Tool tutorials** — embedded video walkthroughs per tool (YouTube + CSP already configured)

---

## Accessibility

- [ ] Full keyboard navigation audit across all tools
- [ ] Screen reader testing (ARIA labels, live regions for dynamic content)
- [ ] Color contrast audit (especially on glass-panel components)
- [ ] Reduced motion preferences (respect `prefers-reduced-motion`)

---

*Last updated: 2026-02-18*

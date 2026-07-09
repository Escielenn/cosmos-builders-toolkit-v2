# DESIGN-TOKENS.md — StellarForge II Token Architecture

**Status: ACTIVE (Phase 1, activated 2026-07-09).** Supersedes the scattered
token guidance in `DESIGN.md` / `DESIGN.json` / `SIMULATOR_AESTHETIC.md` and
the retired `src/lib/STELLARFORGE-DESIGN-SYSTEM.md`.

## Sources of truth

| File | Role |
|---|---|
| `src/styles/tokens.css` | Canonical CSS custom properties — three governed tiers. Imported FIRST by `src/index.css`. |
| `src/styles/tokens.ts` | TypeScript mirror for consumers that can't read CSS vars (canvas, three.js, PDF). Keep in sync by hand until the generator lands. |
| `src/lib/pdf/palette.ts` | GENERATED print palette (derives from `tokens.ts` at module load). PDFs/docx consume this, never raw hex. |
| `src/lib/palettes/**` | DATA palettes (star spectral classes, planet albedos, timeline categories) — not theme; exempt from the hex lint but still single-source. |

## The three tiers

1. **Tier 1 — primitives** (`--sf2-*`): raw ramps. Components never reference these.
2. **Tier 2 — semantic** (`--surface-*`, `--text-1…5`, `--accent`, `--cat-*`, `--ok/--warn/--danger/--info`, `--border-*`, glow alphas, radius ladder, fonts, motion, z-ladder): what components consume.
3. **Tier 3 — surface overrides** (`--sim-*`, writing themes, print): only where a surface legitimately differs.

shadcn semantics (`--primary`, `--card`, …) alias Tier 2, so Radix/shadcn
components inherit the system automatically.

## Settled decisions (Jason, 2026-06-11 — enforced by CI)

- **Legacy cyan is RETIRED product-wide.** No cyan primitive exists. `--sf-cyan`
  in `index.css` is a transition ALIAS that resolves to teal; delete it (and all
  `sf-cyan` class references) at Phase 5. CI hard-fails on the old cyan hex.
- **Four fonts only:** MD Nichrome (H1 display only) / Jura (headings, nav) /
  DM Sans (body + ALL buttons) / JetBrains Mono (data). Space Grotesk is
  retired; CI hard-fails on references. Inter remains forbidden.
- **Weights 300/400/500 only. Zero radius on panels.** Radius ladder: 0/2/3/4px.
- **Dark-only product:** `index.html` hard-sets `<html class="dark">`. The old
  light-theme palette was removed from `index.css` (2026-07-09).

## Legacy layers (transition aliases — retire at Phase 5)

- `--t1…--t5` and `--sf-tier-*` and `--sf-text-*` all resolve to the canonical
  `--text-1…--text-5` hierarchy. New code uses `--text-*` / Tailwind `t1–t5`.
- `.dark` block in `index.css` still defines the v2.x `--sf-*` set; surfaces
  migrate onto Tier-2 tokens during their re-skin, then the block shrinks.

## Rules

- **No raw hex/hsl literals in `src/**`** outside the allowed homes above.
  CI ratchet: `.github/workflows/sf2-guardrails.yml` + `.github/sf2-hex-baseline.txt`
  (count may only go down; lower the baseline in the same PR).
- **Theme vs data:** if a color means "this is our brand/UI" it's a token; if it
  means "M-class stars are red" it's data → `src/lib/palettes/`.
- **Canvas/WebGL:** import `tokens` from `@/styles/tokens` — never
  `getComputedStyle` per frame.
- **Glow pattern:** tint 0.06 / border 0.15 / text 1.0 / shadow 0.2 (bright).
  `--sf-teal-bright` (#3DFFCD) is for glows/arcs ONLY, never solid fills.

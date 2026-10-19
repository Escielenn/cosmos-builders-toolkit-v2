# 15 · Page Chrome

*Decision 2026-10-19. One frame, one header, one notice, everywhere.*

Jason: "headers are inconsistent from worlds to studio." A survey of 20 signed-in
pages found the H1 in three fonts (MD Nichrome, Lora, Jura) at 20–52px, three
casing styles ("YOUR WORLDS", "My worlds.", "Kepler Reach"), the title starting
anywhere from 100px to 512px down the page, five different back links, four
eyebrow formats, four left edges, and the site header disappearing when you
went from a world into its Manuscript. This document is the fix and the rule.

## 1 · The frame

| Layer | Rule |
|---|---|
| Site header | On **every** app page, signed in or not, including the Manuscript and `/studio`. Focus mode is the only thing that hides it. The early-access banner shows on marketing pages and Home only, never inside a world. |
| World nav | `WorldSpaceNav` (Bridge · Codex · Instruments · Manuscript) sits directly under the site header on **every** `/worlds/:id/*` route, including the Manuscript. |
| World index | The world sidebar shows on Bridge, Codex, Chronicle, Instruments, Compile and in-world tools. It is hidden on the Manuscript (the binder is that surface's index). |
| Content | `PageContainer`: `standalone` (1200px, centred), `wide` (1440px, grids), `space` (inside WorldLayout). Gutters 24px, 16px on phones. Every page's left edge lines up. |
| Full-bleed | The Manuscript editor and the simulator canvases are the only surfaces without a `PageHeader`; they keep the site header and (in a world) the world nav. |

## 2 · The header (`PageHeader`)

```
[KEPLER REACH / CODEX]                   ← breadcrumbs (in a world)
                                         or ← BACK TO <PARENT> (standalone child page)
──── // EYEBROW                          ← mono 12px, accent -text, accent hairline
[icon] Title in MD Nichrome    [actions] ← H1, weight 300, as written
Lede in DM Sans 16px, t2, sf-measure
──                                       ← light arc
```

- **Sizes.** `page` for standalone pages (`text-sf-h1`), `space` inside a world (`text-sf-h2`), `card` for the title of a compact centred card or gate screen (`text-sf-h2`, tighter rhythm, 14px lede): sign-in and reset-password cards, invite and join flows, shared-link errors, the Pro lock screens, the connection-lost overlay, SYSTEM FAULT. Same anatomy at every size.
- **Alignment.** `align="center"` centres every row (eyebrow gets a hairline on both sides, the light arc becomes symmetric). Use it only where the surrounding card or page is centred (card flows, 404). Default is `start`. Both props are optional; existing callers are unchanged.
- **H1** is always MD Nichrome, weight 300. Written in title or sentence case as the page names itself, never forced uppercase, never a trailing period, never an italic Lora accent word. (Lora stays in the *prose* of writing surfaces and in marketing heroes. Landing, Pricing and Features keep their marketing heroes and do not use `PageHeader`.)
- **Eyebrow** is always `// LABEL`. Its accent is the page's cascade colour (tools: their category; Codex: integration teal; Chronicle: stellar) or `primary` for everything else.
- **Breadcrumbs XOR back link.** Inside a world: breadcrumbs (`WORLD NAME / SPACE / ITEM`), no back link, because the world nav is the navigation. Standalone child pages (a tool, a learn article, a guide section) get one back link to their real parent: `BACK TO TOOLS`, `BACK TO LEARN`. There is no "RETURN HOME"; the logo goes home.
- **Actions** sit right of the title on desktop and wrap under it on phones. Primary action uses `sf-primary` fill; the rest are `sf-ghost`.
- **Tool pages:** header first, then the sticky `ToolActionBar`, then the quote. (The action bar used to sit above the title.)

### Simulators

- **Canvas title.** A simulator canvas is full-bleed and has no `PageHeader`. Its one title block is `SimulatorTitle` (`src/components/simulators/SimulatorTitle.tsx`): MD Nichrome 300 uppercase at 26px / 0.24em (20px / 0.12em on phones), a DM Sans 12px uppercase subtitle in `t3`, an optional 13px context line in primary `-text` (the system or planet in view), then the status badge. It owns the canvas `h1` and is on the guard's allow-list. The four static iframe sims (Rogue, Tidelock, ExoForge, Solaris) match it through `public/tools/_shared/sim-title.css`; keep the two in step.
- **Science pages** are standalone child pages of their simulator: `SimulatorSciencePage` renders `PageContainer` + `PageHeader` (`BACK TO ROGUE`, `// THE SCIENCE`, "Showing our work") above the static explainer in an auto-height iframe. The explainer hides its own title block when framed (`public/tools/_shared/science-embed.js`); opened directly it is unchanged.

## 3 · The notice (`Notice`)

One inline notice for hints, explainers, cautions and inline errors.

- A 2px left rule in the tone's hue (info = primary, caution = amber, danger = crimson, success = emerald) on a soft `sf-line` frame.
- **Label** in mono caps, short (`// WORLD INDEX`). **Body** in DM Sans sentence case, `t2`. Never a paragraph of uppercase mono.
- Dismiss is a 44px `×` top-right. `FirstTimeHint` is built on it; hint copy is written `LABEL: body`.

## 4 · Section headings inside a page

- `h2`: `font-heading text-sf-eyebrow uppercase text-t4` with a `sf-line-hairline` rule beneath (the section-header pattern), or `font-display text-sf-h3` for a named block. Pick per page; never mix both on one page.
- `CollapsibleSection` keeps its numbered badge.

## 5 · Overlay titles (dialogs, sheets, alert dialogs)

- One title style, owned by the primitives in `src/components/ui/` (`DialogTitle`, `SheetTitle`, `AlertDialogTitle`): Jura at `text-sf-h3`, weight 400, `t1`, written in sentence case. Descriptions are DM Sans 14px `t2`.
- Callers pass layout classes only (`flex items-center gap-2`, `sr-only`). Never a font, size, case, tracking or colour override; no Lora, no mono caps. The one kept colour is `text-sf-crimson-text` on a destructive confirm.
- A short Ship's-Voice label above the title (`// INPUT REQUIRED`) is a separate mono `text-sf-mono` line, not the title.

## 6 · Enforcement

- `src/components/layout/page-chrome/` owns `PageHeader`, `Breadcrumbs`, `PageContainer`, `Notice`.
- CI (`scripts/check-page-chrome.mjs`, `npm run check:chrome`, the "Page chrome guard" step in `.github/workflows/sf2-guardrails.yml`): an `<h1` outside `page-chrome/`, marketing heroes and the allow-list fails the build. Back-link labels must start with `BACK TO`.
- Allow-list: marketing heroes (`landing/`, Pricing, Features and its `ShowcaseHero`, WorldShowcase), print templates, `dev/`, editor document headings, and `SimulatorTitle`.

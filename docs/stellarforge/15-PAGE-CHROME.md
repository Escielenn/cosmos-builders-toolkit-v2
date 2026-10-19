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

- **Sizes.** `page` for standalone pages (`text-sf-h1`), `space` inside a world (`text-sf-h2`). Same anatomy.
- **H1** is always MD Nichrome, weight 300. Written in title or sentence case as the page names itself, never forced uppercase, never a trailing period, never an italic Lora accent word. (Lora stays in the *prose* of writing surfaces and in marketing heroes. Landing, Pricing and Features keep their marketing heroes and do not use `PageHeader`.)
- **Eyebrow** is always `// LABEL`. Its accent is the page's cascade colour (tools: their category; Codex: integration teal; Chronicle: stellar) or `primary` for everything else.
- **Breadcrumbs XOR back link.** Inside a world: breadcrumbs (`WORLD NAME / SPACE / ITEM`), no back link, because the world nav is the navigation. Standalone child pages (a tool, a learn article, a guide section) get one back link to their real parent: `BACK TO TOOLS`, `BACK TO LEARN`. There is no "RETURN HOME"; the logo goes home.
- **Actions** sit right of the title on desktop and wrap under it on phones. Primary action uses `sf-primary` fill; the rest are `sf-ghost`.
- **Tool pages:** header first, then the sticky `ToolActionBar`, then the quote. (The action bar used to sit above the title.)

## 3 · The notice (`Notice`)

One inline notice for hints, explainers, cautions and inline errors.

- A 2px left rule in the tone's hue (info = primary, caution = amber, danger = crimson, success = emerald) on a soft `sf-line` frame.
- **Label** in mono caps, short (`// WORLD INDEX`). **Body** in DM Sans sentence case, `t2`. Never a paragraph of uppercase mono.
- Dismiss is a 44px `×` top-right. `FirstTimeHint` is built on it; hint copy is written `LABEL: body`.

## 4 · Section headings inside a page

- `h2`: `font-heading text-sf-eyebrow uppercase text-t4` with a `sf-line-hairline` rule beneath (the section-header pattern), or `font-display text-sf-h3` for a named block. Pick per page; never mix both on one page.
- `CollapsibleSection` keeps its numbered badge.

## 5 · Enforcement

- `src/components/layout/page-chrome/` owns `PageHeader`, `Breadcrumbs`, `PageContainer`, `Notice`.
- CI (`scripts/check-page-chrome.mjs`): an `<h1` outside `page-chrome/`, marketing heroes and the allow-list fails the build. Back-link labels must start with `BACK TO`.

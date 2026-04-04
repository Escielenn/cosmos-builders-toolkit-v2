# StellarForge UI Consistency Fix Spec

**Document:** `StellarForge_UI_Consistency_Fix_Spec.md`
**Author:** Jason D. Batt, Ph.D.
**Date:** April 4, 2026
**Purpose:** Claude Code handoff — systematic fix for 10 UI consistency issues across StellarForge worksheets, simulators, navigation, and menus.
**Priority:** Pre-launch blocking

---

## PRE-FLIGHT PROTOCOL (MANDATORY)

Before touching ANY file, the implementing AI instance must:

1. Read `CLAUDE.md` and `SIMULATOR_AESTHETIC.md` (canonical design references)
2. Read `SIMULATOR_AESTHETIC_V2.md` and `AESTHETIC_BRIDGE.md` if they exist
3. Audit existing shared components — check for a shared layout wrapper, sidebar components, navigation components
4. Inspect the Supabase schema if any fix touches data
5. Inspect the routing structure (`/tools/` routes, worksheet routes, simulator routes)
6. Run a clean build (`npm run build` or equivalent) and confirm zero errors before making changes
7. Run a clean build again after each major fix to prevent cascading breakage

---

## DESIGN SYSTEM QUICK REFERENCE

**Colors:**
- Background: `#09090B`
- Panel surface: `#0F0F10` / `rgba(15, 15, 16, 0.92)` with `backdrop-filter: blur(16px)`
- Panel border: `rgba(255, 255, 255, 0.08)`
- Primary accent: `#00D4FF` (cyan)
- Text primary: `#FAFAFA`
- Text secondary: `#C8C8C8`
- Text muted: `rgba(255, 255, 255, 0.35)`
- Text ghost: `rgba(255, 255, 255, 0.18)`

**Fonts:**
- Structural/display: `Space Grotesk` (weight 300 for titles, 600 for section headers)
- Body/labels: `DM Sans` (weight 400)
- Data/numbers: `JetBrains Mono` (weight 300-500)
- Never use JetBrains Mono for prose. Never use Space Grotesk for body paragraphs.

**Panel specs:**
- Max panel width: 220–260px for side panels
- Panel border-radius: 8px
- Button border-radius: 6px
- Modal border-radius: 12px

---

## ISSUE 1: Worksheet Content Overlapped by Navigation/Readout Panels

**Severity:** HIGH — affects usability on every worksheet
**Screenshot reference:** Orrery sections extend behind the right-side Navigation and Readout panels

### Problem
The main content area of worksheets extends full-width, but the right column contains two fixed/sticky panels (Navigation and Readout). Content flows underneath these panels and becomes unreadable/unclickable.

### Affected Worksheets (all must be checked and fixed)
- Orrery (star system builder) — confirmed broken
- Goldilocks (habitable zone) — confirmed broken
- Atlas (stellar cartographer)
- Phylo (evolutionary biology)
- Symbiosis (ecosystem)
- Sensorium (sensory system)
- Axiom (one big lie / physics declaration)
- Impulse (propulsion)
- Vessel (spacecraft)
- Exodus (migration/colonization)
- Paradigm (cultural matrix)
- Dominion (political/civilization)
- Paradox (Fermi paradox)
- Signal (communication)
- Gravitas (gravity)
- Mythos (mythology)
- Cascade (environmental cascade)
- Epoch (timeline/history) — NOTE: Epoch lacks both Navigation and Readout panels entirely, which is itself a bug (see below)

### Fix
The layout needs a proper three-column (or two-column + sidebar) structure:

```
[Main Content Area]  [Right Sidebar: Navigation + Readout]
```

The main content column must have a `max-width` or `margin-right` / `padding-right` that accounts for the sidebar width. The sidebar should be `position: sticky` or `position: fixed` with a defined width.

**Approach:**
1. Identify the shared worksheet layout component (likely a wrapper used by all worksheet pages).
2. If no shared component exists, create one. All 18 worksheets should import the same layout wrapper.
3. The content column should have `margin-right` or be placed in a CSS Grid / Flexbox container that reserves space for the sidebar.
4. Sidebar width should be consistent: **260px** per the aesthetic guide, plus adequate gap (16-24px).
5. Content area: `max-width: calc(100% - 280px)` or equivalent grid definition.
6. On mobile (<768px), sidebar collapses to a floating overlay or bottom sheet.

**For Epoch specifically:** Add Navigation and Readout panels to match all other worksheets.

### DO NOT
- Use `overflow: hidden` on the content area as a band-aid (it will clip intentional elements)
- Set a fixed pixel width on content area — it should be fluid within its column
- Break the existing scroll behavior of the sidebar panels

---

## ISSUE 2: Mythos Worksheet — Xenomythology CTA Box

**Severity:** LOW — feature addition, not a bug

### Request
Add a callout box at the bottom of the Mythos worksheet that introduces xenomythology as a discipline and links to xenomythology.com.

### Specification

**Placement:** After the final section of the Mythos worksheet, before any footer.

**Design:** Use the standard StellarForge card/panel pattern:
```css
background: rgba(15, 15, 16, 0.92);
border: 1px solid rgba(0, 212, 255, 0.15);
backdrop-filter: blur(16px);
border-radius: 8px;
padding: 24px 28px;
```

**Content:**
```
// EXPLORE XENOMYTHOLOGY

Section header (Space Grotesk 600, muted cyan, 7.5px, uppercase, 2.5px letter-spacing)

Body text (DM Sans 400, ~14px, text-secondary color):

"Xenomythology is the study of how mythology will evolve beyond Earth — how
alien environments, biologies, and psychologies will generate entirely new
mythological systems. The myths you're building aren't just decoration for
your world; they're the deepest expression of how your species makes meaning."

CTA button:
"EXPLORE XENOMYTHOLOGY" → links to https://xenomythology.com
(Space Grotesk 500, 8px, uppercase, 1.5px letter-spacing)
Standard button style with cyan hover glow
Opens in new tab (target="_blank" rel="noopener")
```

### DO NOT
- Make this a popup or modal
- Use marketing/sales language — this should feel scholarly and earned, like a natural extension of the tool

---

## ISSUE 3: Navigation Panel Inconsistencies (All Worksheets)

**Severity:** MEDIUM — visual inconsistency across tools

### Problem
The Navigation sidebar panels across all worksheets are inconsistent:
- Some have "Back to Top" AND "Go to Bottom" buttons
- Some have only one of these
- Some have neither
- The font used in navigation items does not match the design system (not using Space Grotesk or DM Sans per the aesthetic guide)

### Fix — Standardize All Navigation Panels

**Every worksheet Navigation panel must include:**
1. `// NAVIGATION` header (Space Grotesk 600, muted cyan `rgba(0, 212, 255, 0.35)`, 7.5px, uppercase, 2.5px letter-spacing, bottom border `rgba(0, 212, 255, 0.06)`)
2. Numbered section links (DM Sans 400, 8-9px, `rgba(255, 255, 255, 0.5)`, hover → `#FAFAFA`)
3. Active section highlighted with cyan text (`#00D4FF`) and left border indicator
4. "BACK TO TOP" button at bottom of nav list
5. "GO TO BOTTOM" button below that
6. Both buttons use standard button styling (Space Grotesk 500, 8px, uppercase, 1.5px letter-spacing)

**Font correction:** All navigation items must use:
- Section numbers: `JetBrains Mono` weight 300, 8px
- Section names: `DM Sans` weight 400, 8.5px, uppercase, 1.2px letter-spacing
- Buttons: `Space Grotesk` weight 500, 8px, uppercase, 1.5px letter-spacing

**Approach:**
1. Find or create a shared `WorksheetNavigation` component
2. All 18 worksheets should use this single component, passing their section list as props
3. The component handles scroll-to behavior, active section tracking, and consistent styling
4. Refactor each worksheet to use the shared component

### Readout Panel
Similarly audit the `// READOUT` panel across all worksheets — it should use the same font hierarchy (Space Grotesk for headers, JetBrains Mono for values, DM Sans for labels). Ensure consistency.

---

## ISSUE 4: Guide Dropdown Menu Misaligned

**Severity:** MEDIUM — navigation UX issue

### Problem
On desktop, the dropdown menu for "Guide" in the top navigation bar appears offset to the left rather than positioned directly beneath the "Guide" menu item.

### Fix
The dropdown should be positioned with `left: 0` relative to the "Guide" nav item's container (not relative to the page or navbar). The parent `<li>` or `<div>` containing "Guide" must have `position: relative`, and the dropdown should have `position: absolute; left: 0; top: 100%;`.

Check all other nav dropdowns (WORLDS, TOOLS, GUIDE) for the same issue. Every dropdown should align its left edge with the left edge of its trigger word.

### DO NOT
- Use `transform: translateX()` hacks — fix the positioning hierarchy properly
- Break mobile hamburger behavior

---

## ISSUE 5: Tools Dropdown Menu — Font Size and Layout

**Severity:** MEDIUM — discoverability and readability

### Problem
The tools listed in the TOOLS dropdown menu use a font that is too small, and the single-column or two-column layout feels cramped. The menu "feels off."

### Fix — Three-Column Grid with Micro Icons

Redesign the TOOLS dropdown as a **mega menu** with:

**Layout:**
- Three-column grid
- Each tool gets a row: `[micro icon] [tool name]`
- Columns organized by category (Simulators | Calculators | Cartographers | Worksheets — or however the tools are currently grouped)
- Category headers above each column (Space Grotesk 600, muted cyan, 7.5px, uppercase)

**Typography:**
- Tool names: `DM Sans` 400, **12-13px** (up from current), normal case
- Tool descriptions (if space allows): `DM Sans` 400, 10px, text-muted color, single line
- Category headers: `Space Grotesk` 600, 7.5px, uppercase, 2.5px letter-spacing, muted cyan

**Micro icons:**
- Each tool should have its unique colored icon at 16-20px size
- If existing tool icons exist at larger sizes, scale them down
- If no icons exist for some tools, use a generic category icon temporarily (star for simulators, calculator for calculators, globe for cartographers, clipboard for worksheets)

**Panel:**
```css
background: rgba(15, 15, 16, 0.96);
border: 1px solid rgba(255, 255, 255, 0.08);
backdrop-filter: blur(20px);
border-radius: 8px;
padding: 20px 24px;
min-width: 600px; /* or width: max-content */
```

**Hover state on each tool row:**
```css
background: rgba(0, 212, 255, 0.06);
border-radius: 6px;
```

### DO NOT
- Make the menu taller than viewport (if too many tools, add internal scrolling)
- Remove any existing tools from the menu
- Break the mobile navigation (on mobile, this should remain a stacked list)

---

## ISSUE 6: Narrative Bridge — General Notes Field (All Simulators)

**Severity:** MEDIUM — feature gap

### Problem
The Narrative Bridge sections in simulators currently only support prompted writing (fill-in-the-blank or guided prompts). Users need a **non-prompted, freeform writing area** for general notes.

### Fix
Add a "GENERAL NOTES" section to the Narrative Bridge of every simulator.

**Placement:** At the end of the Narrative Bridge section, after all prompted fields.

**UI:**
```
// GENERAL NOTES
[Section header per aesthetic guide]

[textarea — full width of the Narrative Bridge panel]
Placeholder: "Free-form notes, observations, story ideas..."
```

**Textarea styling:**
```css
font-family: 'DM Sans', sans-serif;
font-size: 12px;
line-height: 1.6;
color: rgba(255, 255, 255, 0.8);
background: rgba(255, 255, 255, 0.03);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 6px;
padding: 12px 14px;
min-height: 120px;
resize: vertical;
width: 100%;
```

**Focus state:**
```css
border-color: rgba(0, 212, 255, 0.25);
outline: none;
```

**Data persistence:** This field must save/load with the rest of the simulator state (same save/draft mechanism that other Narrative Bridge fields use). Confirm the Supabase schema can accommodate a `general_notes` text field or equivalent.

### Affected Simulators
All simulators that have a Narrative Bridge section:
- ROGUE
- ExoSky
- TIDELOCK
- SOLARIS
- ExoForge
- K-SCALE
- GRAVITAS
- SENSORIUM
- LEXDRIFT
- Any others with Narrative Bridge

---

## ISSUE 7: Planetary Profile Route Broken

**Severity:** HIGH — page is completely non-functional

### Problem
Navigating to `https://stellarforge.tools/tools/planetary-profile` results in a "System Malfunction" error page.

### Fix
1. Check the route configuration — is `/tools/planetary-profile` defined?
2. Check if the component file exists and exports correctly
3. Check for import errors, missing dependencies, or build-time failures
4. Check Supabase queries — does the page try to load data from a table that doesn't exist or has wrong permissions?
5. Check browser console for the actual error and fix accordingly

**If the tool was renamed or moved:** Update the route and add a redirect from the old path.
**If the tool was never built:** Create a placeholder page that says "Coming soon" with proper StellarForge styling, or remove it from any navigation that links to it.

### DO NOT
- Leave the "System Malfunction" error in place — even a styled "under construction" page is better

---

## ISSUE 8: ExoForge — Left Menu Overlaps Title Box

**Severity:** MEDIUM — usability issue

### Problem
On ExoForge, the left-side control/menu column overlaps the title area, hiding options.

### Fix
The title block and the left control panel need proper vertical stacking or the title needs to sit above the panel in the z-order with adequate top margin.

**Option A (preferred):** Title block sits at top of page in its own row, full-width. Left panel begins below the title.
**Option B:** Title block has sufficient `margin-left` or `padding-left` to clear the left panel width (220-260px + gap).

Per the simulator aesthetic guide, the title block placement is "Top-left: Tool title + status badge." If the left control panel starts at the same Y position, the title must have enough left clearance.

Check that all menu/control options in the left panel are visible and clickable without scrolling into hidden territory.

---

## ISSUE 9: TIDELOCK — Multiple Overlap Issues + Title Style Proposal

**Severity:** MEDIUM-HIGH — multiple overlapping elements

### Sub-issues

**9a. Left toolbar overlaps title section**
Same class of issue as ExoForge (#8). The left toolbar/control panel overlaps the title text. Fix the same way — ensure adequate clearance.

**9b. Temperature cross-section (right side) overlaps the right info column and content below**
The temperature visualization element is overflowing its container and covering adjacent UI. This needs:
- Proper `max-width` or `width` constraint on the cross-section visualization
- Or proper grid/flex layout that allocates space for both the visualization and the info column
- The info column below or beside the cross-section should not be covered

**9c. Title style — TIDELOCK's title is NOT in a box (unlike other simulators). Jason prefers this unboxed style.**

### CONFIRMED: Apply unboxed title to ALL simulators
Jason has confirmed: TIDELOCK's unboxed title treatment is the preferred standard. Remove the boxed/paneled title from all other simulators and replace with this unboxed style.

**The unboxed title style (apply to all simulators):**
```css
/* Title floats directly on the canvas, no panel background */
font-family: 'Space Grotesk', sans-serif;
font-weight: 300;
font-size: 26px;
letter-spacing: 6px;
text-transform: uppercase;
color: #FAFAFA;
/* NO background panel, NO border, NO backdrop-filter on the title element */
/* Subtle text-shadow for readability over canvas: */
text-shadow: 0 0 20px rgba(0, 0, 0, 0.6);
```

**Affected simulators (all that currently use a boxed/paneled title):**
- ROGUE
- ExoSky
- SOLARIS
- ExoForge
- K-SCALE
- GRAVITAS
- SENSORIUM
- LEXDRIFT
- Any others with a panel-background title block

**TIDELOCK already uses this style — do not modify TIDELOCK's title.**

This is a confirmed directive, not a proposal. Implement alongside the overlap fixes.

---

## ISSUE 10: Background Video Thumbnails Not Showing

**Severity:** MEDIUM — affects all background selection menus across the platform

### Problem
When users open the background selection menu (to choose cosmic background videos), the thumbnail previews for the videos are not displaying. The selection UI appears but without visual previews.

### Likely Causes (investigate in order)
1. **Thumbnail URLs are broken** — video thumbnails may point to a CDN path, S3 bucket, or Supabase storage URL that has changed or expired
2. **CORS issue** — thumbnails hosted externally may be blocked
3. **Missing poster/thumbnail assets** — the video files exist but no corresponding thumbnail images were generated
4. **Lazy loading / intersection observer bug** — thumbnails may only attempt to load when scrolled into view, and the observer isn't triggering
5. **CSS issue** — thumbnails may be loading but invisible (opacity: 0, height: 0, display: none)

### Fix
1. Identify where background video metadata is stored (Supabase table? local config file?)
2. Check the thumbnail URLs — do they resolve? Test in browser.
3. If thumbnails don't exist, generate them from the video files (ffmpeg: `ffmpeg -i video.mp4 -ss 00:00:01 -vframes 1 thumbnail.jpg`)
4. If the URLs are correct but not rendering, check for CSS / loading / CORS issues
5. Ensure the background selection component properly renders an `<img>` tag with the thumbnail URL

### DO NOT
- Replace video thumbnails with placeholder icons as a permanent solution — users need to see what the background looks like before selecting it

---

## IMPLEMENTATION ORDER (SUGGESTED)

1. **Issue 7** — Planetary Profile route (quick diagnostic, potentially quick fix)
2. **Issue 1** — Worksheet content overlap (highest impact, most worksheets affected)
3. **Issue 3** — Navigation panel consistency (ties directly to Issue 1's layout work)
4. **Issue 8 + 9** — ExoForge and TIDELOCK overlaps + unboxed title standardization across all simulators (same class of layout fix; title change is confirmed)
5. **Issue 4** — Guide dropdown alignment (quick CSS fix)
6. **Issue 5** — Tools mega menu (medium effort, high UX value)
7. **Issue 6** — General Notes field (requires schema + component work)
8. **Issue 10** — Background video thumbnails (investigation required)
9. **Issue 2** — Mythos xenomythology box (low priority, additive)

---

## TESTING CHECKLIST

After all fixes, verify:

- [ ] All 18 worksheets render without content overlap on desktop (1280px+)
- [ ] All 18 worksheets render correctly on tablet (768-1024px)
- [ ] All 18 worksheets render correctly on mobile (<768px)
- [ ] Navigation panels on all worksheets have consistent "Back to Top" + "Go to Bottom" buttons
- [ ] Navigation panel fonts match design system (Space Grotesk / DM Sans / JetBrains Mono)
- [ ] Readout panels use consistent font hierarchy
- [ ] Epoch worksheet has Navigation and Readout panels
- [ ] Guide dropdown aligns under the word "Guide"
- [ ] TOOLS mega menu is three-column with micro icons and readable font size
- [ ] TOOLS mega menu works on mobile (stacked list)
- [ ] `/tools/planetary-profile` loads without error
- [ ] ExoForge left menu does not overlap title — all options visible
- [ ] TIDELOCK left toolbar does not overlap title
- [ ] TIDELOCK temperature cross-section does not overlap right info column
- [ ] All simulator titles use unboxed style (no panel background) matching TIDELOCK's treatment
- [ ] Narrative Bridge in all simulators has a "General Notes" freeform textarea
- [ ] General Notes persists on save/load
- [ ] Background video thumbnails display in all background selection menus
- [ ] Mythos worksheet has xenomythology CTA box at bottom
- [ ] Clean build passes with zero errors
- [ ] No visual regressions on homepage, Learn section, or other non-affected pages

---

## AESTHETIC COMPLIANCE REMINDER

Every new or modified component must comply with:

- **Space Grotesk** for structural elements (titles, section dividers, buttons, modal headings)
- **DM Sans** for readable elements (labels, descriptions, input fields, notes)
- **JetBrains Mono** for numerical values only (data readouts, slider values, coordinates)
- Opacity pattern: `0.08` background / `0.2` border / `1.0` text for all status/accent elements
- Panel glass-morphism: `rgba(15, 15, 16, 0.92)` + `backdrop-filter: blur(16px)`
- No pure black (`#000000`) — always use `#09090B` or near-black tints
- Zero border-radius on worksheet content panels (border-radius reserved for floating panels and buttons)
- Custom 3px cyan scrollbars on all scrollable panels

---

*These worlds exist in you. Waiting to be found.*

© 2025–2026 Jason D. Batt, Ph.D. · StellarForge.tools

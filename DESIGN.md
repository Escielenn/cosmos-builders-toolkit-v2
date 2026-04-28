---
name: StellarForge
description: A scholarly worldbuilding workspace for science fiction writers — light emerging from void.
colors:
  deep-void: "#0A0E17"
  panel-navy: "#0E1320"
  surface-lift: "#161C2B"
  beacon-teal: "#15C17B"
  phosphor-glow: "#3DFFCD"
  telemetry-amber: "#FFB800"
  velocity-amber: "#FFB347"
  wonder-blue: "#5B8DEF"
  section-green: "#00FF88"
  pro-indigo: "#9B5DE5"
  hazard-crimson: "#FF3366"
  link-azure: "#4D9FFF"
  legacy-cyan: "#00D4FF"
  tier-1-text: "#FAFAFA"
  tier-2-text: "#C8C8C8"
typography:
  hero:
    fontFamily: "MD Nichrome, Jura, system-ui, sans-serif"
    fontSize: "96px"
    fontWeight: 300
    lineHeight: "0.98"
    letterSpacing: "0.03em"
  display:
    fontFamily: "MD Nichrome, Jura, system-ui, sans-serif"
    fontSize: "56px"
    fontWeight: 300
    lineHeight: "1"
    letterSpacing: "0.04em"
  headline:
    fontFamily: "Jura, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 300
    lineHeight: "1.15"
    letterSpacing: "0.03em"
  title:
    fontFamily: "Jura, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: "1.25"
    letterSpacing: "0.02em"
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "1.55"
    letterSpacing: "normal"
  label:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: "1.2"
    letterSpacing: "0.2em"
  data:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: "1.4"
    letterSpacing: "0.18em"
rounded:
  panel: "0px"
  card: "4px"
  badge: "3px"
  input: "2px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "32px"
  xl: "64px"
  xxl: "120px"
components:
  button-primary:
    backgroundColor: "{colors.beacon-teal}"
    textColor: "#FFFFFF"
    rounded: "{rounded.panel}"
    padding: "12px 24px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.beacon-teal}"
    textColor: "#FFFFFF"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.tier-2-text}"
    rounded: "{rounded.panel}"
    padding: "12px 24px"
  button-destructive:
    backgroundColor: "{colors.hazard-crimson}"
    textColor: "#FFFFFF"
    rounded: "{rounded.panel}"
    padding: "12px 24px"
  input-text:
    backgroundColor: "rgba(255,255,255,0.04)"
    textColor: "rgba(255,255,255,0.8)"
    rounded: "{rounded.input}"
    padding: "12px 16px"
    typography: "{typography.body}"
  card-glass:
    backgroundColor: "rgba(14,19,32,0.9)"
    rounded: "{rounded.panel}"
    padding: "24px"
  badge-glow-teal:
    backgroundColor: "rgba(21,193,123,0.06)"
    textColor: "{colors.beacon-teal}"
    rounded: "{rounded.badge}"
    padding: "4px 8px"
    typography: "{typography.label}"
  nav-item-active:
    backgroundColor: "rgba(21,193,123,0.06)"
    textColor: "{colors.beacon-teal}"
    rounded: "{rounded.panel}"
    padding: "8px 12px"
---

# Design System: StellarForge

## 1. Overview

**Creative North Star: "The Bridge of a Slow Ship"**

StellarForge looks like the cockpit of a science vessel that has time. Not the panicked flicker of a NASA-cosplay launch sequence, not the chrome-and-orange of a Hollywood spaceship — the lit ring of a deep-space observatory at hour 38 of a 200-day transit, where the navigator has the room dim, the coffee cold, and is patiently making the next reading. Linear's discipline meets Are.na's curatorial slowness. Every element earns its brightness; nothing strobes.

The system rejects four specific moods (carried verbatim from PRODUCT.md): generic AI-tool SaaS gradients and glassmorphic hero cards; friendly writing-platform pastels and encouragement copy; NASA-cosplay neon-green CRT-terminal mimicry; empty Notion-clone soft-grey neutering. What's left is a quiet space-navy interface lit by a single teal beacon, with monospace numerals where data lives, sharp zero-radius edges throughout, and a 5-tier text hierarchy that refuses to put labels at the same brightness as titles.

**Key Characteristics:**

- Three-tier surface depth (deep void → panel navy → surface lift), no shadows, no blur-as-default.
- Single primary accent (Beacon Teal) carries CTAs, focus, and active-state. Secondary accents (Telemetry Amber, Wonder Blue, Section Green, Pro Indigo, Hazard Crimson, Link Azure) each have one job.
- Sharp edges. Zero radius on panels, 4px max on cards, 3px on badges, 2px on inputs.
- Four typefaces, four jobs: MD Nichrome for H1 only, Jura for sectional voice, DM Sans for body and buttons, JetBrains Mono for data and labels.
- Light arcs over shadows: depth signaled by a 1px gradient line at panel edges, not a drop shadow.
- Restrained motion: 120–280ms state changes, exponential ease-out, no bounce, no choreographed entrances.

## 2. Colors

A tinted-cool dark palette with a single saturated accent. Primary, Secondary, and Neutral roles only — no Tertiary expansion. Every neutral is tinted toward the navy hue; pure black and pure white are forbidden.

### Primary

- **Beacon Teal** (#15C17B / `hsl(157 80% 42%)`): the lit indicator on the bridge. CTAs, primary buttons, current selection, focus rings, active state, links inside content. Used on ≤10% of any given screen.
- **Phosphor Glow** (#3DFFCD / `hsl(157 100% 62%)`): the afterimage. Box-shadow glows, light-arc gradients, hover highlights. Forbidden as a solid fill or text color.

### Secondary (used sparingly, each with one role)

- **Telemetry Amber** (#FFB800): data highlights, velocity readouts, warnings.
- **Velocity Amber** (#FFB347): nav numbers, softer warm accents.
- **Wonder Blue** (#5B8DEF): creativity, exploration, the "Stellar" semantic role.
- **Section Green** (#00FF88): section-divider headers in tool pages. Different green from Beacon Teal on purpose — green carries hierarchy, teal carries action.
- **Pro Indigo** (#9B5DE5): Pro-tier badges and gating affordances. Never decorative.
- **Hazard Crimson** (#FF3366): destructive actions only. Delete, error, danger. Never a stylistic choice.
- **Link Azure** (#4D9FFF): inline links and informational accents.
- **Legacy Cyan** (#00D4FF): simulator canvases only. Inherited from earlier system; do not extend to new surfaces.

### Neutral

- **Deep Void** (#0A0E17 / `hsl(222 30% 5%)`): page background. The deepest layer.
- **Panel Navy** (#0E1320 / `hsl(222 25% 9%)`): glass-panel surfaces, cards, popovers.
- **Surface Lift** (#161C2B / `hsl(222 20% 12%)`): elevated panels, dropdown menus, dialog content.
- **Tier-1 Text** (#FAFAFA): titles and result values only. Reserved.
- **Tier-2 Text** (#C8C8C8): body text, descriptions.
- **Tier-3 Text** (`rgba(255,255,255,0.45)`): labels, column headers.
- **Tier-4 Text** (`rgba(255,255,255,0.28)`): units, helper text, chevrons.
- **Tier-5 Text** (`rgba(255,255,255,0.15)`): citations, metadata, ghost text.

### Named Rules

**The 0.06 / 0.15 / 1.0 Glow Rule.** Interactive elements with an accent color follow this opacity stack: background `hsl(accent / 0.06)`, border `1px solid hsl(accent / 0.15)`, text or icon `hsl(accent)`. Glow effects use the bright variant (Phosphor Glow) at 0.2 alpha in box-shadow only. Solid fills at 1.0 are reserved for the primary CTA and the destructive button.

**The One Voice Rule.** Beacon Teal is used on ≤10% of any given screen. Its rarity is the point. If the page reads as "teal-themed," the rule has been broken — the user can no longer tell which element is the live one.

**The No Pure-Black Rule.** `#000` and `#fff` are forbidden. Every neutral tints toward the navy hue (`hsl(222 …%)`). The cool drift is the texture of the system.

## 3. Typography

**Display Font:** MD Nichrome (with Jura, system-ui fallback)
**Heading Font:** Jura (with system-ui fallback)
**Body Font:** DM Sans (with system-ui fallback)
**Mono Font:** JetBrains Mono

**Character:** Four typefaces, four jobs. The pairing is built on weight contrast (always 300 vs 500, never bold) and on uppercase letter-spacing as voice. MD Nichrome's geometric authority carries the H1. Jura's slight technical edge carries section voice. DM Sans is the workhorse — body, buttons, labels. JetBrains Mono is reserved for things that ARE numbers (data, IDs, telemetry). Inter is forbidden. System defaults are forbidden as primary type.

### Hierarchy

- **Hero** (MD Nichrome 300, 96px, line-height 0.98, letter-spacing 0.03em): marketing hero only.
- **Display / H1** (MD Nichrome 300, 56px, line-height 1, letter-spacing 0.04em): tool page titles ONLY. Never on buttons, never inside cards.
- **Headline / H2** (Jura 300, 36px, line-height 1.15, letter-spacing 0.03em): section opens.
- **Title / H3** (Jura 400, 24px, line-height 1.25, letter-spacing 0.02em): subsection headers.
- **Section header** (Jura 300, 14px, uppercase, letter-spacing 3px, Section Green): the green-divider pattern that names a tool's collapsible regions.
- **Body** (DM Sans 400, 15px, line-height 1.55, max 65–75ch): all running prose.
- **Label** (DM Sans 500, 11px, uppercase, letter-spacing 1.5px, Tier-3): every form label across the entire surface.
- **Eyebrow** (DM Sans 500, 11px, uppercase, letter-spacing 0.2em): mono-style category tags above titles.
- **Data / Mono** (JetBrains Mono 400, 11px, line-height 1.4, letter-spacing 0.18em): readout values, badges, numbered list pips, telemetry.

### Named Rules

**The Nichrome H1-Only Rule.** MD Nichrome appears as H1 and the marketing hero. Nowhere else. Buttons, cards, body, badges — all DM Sans. Display fonts in UI labels is the loudest cliché; the rule prevents it.

**The Two-Weight Rule.** 300 (light) and 500 (medium) are the only weights. 400 exists for body but isn't used for emphasis. Bold (700) is forbidden anywhere. Hierarchy lives in scale and tracking, not in weight saturation.

**The Tier Discipline Rule.** Never put labels, units, and descriptions at the same brightness. The 5-tier text hierarchy is load-bearing — if a label, a unit, and a result value all read at the same opacity, the result no longer wins the eye. Tier-1 is reserved.

## 4. Elevation

**Flat by default. Tonal layering plus light arcs replaces shadows.**

The system has three vertical layers (Deep Void → Panel Navy → Surface Lift), and that is the elevation vocabulary. Shadows exist only as accent glows on interactive elements, never as drop-shadows under cards.

### Shadow Vocabulary (used sparingly)

- **Glow Teal** (`box-shadow: 0 0 24px hsl(157 100% 62% / 0.3)`): hover state on primary CTAs.
- **Glow Amber** (`box-shadow: 0 0 20px hsl(43 100% 50% / 0.25)`): warning indicators, velocity ticker.
- **Glow Crimson** (`box-shadow: 0 0 20px hsl(347 100% 60% / 0.25)`): destructive button hover.
- **Inset Teal** (`box-shadow: inset 0 0 20px hsl(157 100% 62% / 0.08)`): focused input fields, subtle.
- **Glass Drop** (`box-shadow: 0 8px 32px hsl(0 0% 0% / 0.4)`): the only drop-shadow in the system. Used on glass panels to lift them off the void background. Never on cards, badges, or buttons.

### Named Rules

**The Light-Arc Rule.** Edges of important panels carry a 1px gradient line, not a shadow. The line is `linear-gradient(to right, transparent, hsl(157 100% 62% / 0.25), transparent)` and sits at the bottom or top edge. This is the system's signature elevation cue.

**The Flat-By-Default Rule.** No drop-shadows under cards. No `filter: drop-shadow()` on icons. No layered card-on-card stacks. Surfaces are flat at rest. Glow appears only as a response to state (hover, active, focus, error).

**The Glassmorphism Tax.** Backdrop-blur is permitted only on glass panels that float over the void (modals, popovers, the simulator HUDs). Decorative blur on non-floating cards is forbidden.

## 5. Components

Every component leads with a short character line, then specifies shape, color assignment, and states.

### Buttons

Sharp, mono-padded, action-honest. Three variants only.

- **Shape:** zero radius (`rounded-none`), sharp 90° corners.
- **Primary:** Beacon Teal background, white text, DM Sans 500 14px, padding 12px 24px. Hover adds a Glow Teal box-shadow, no background shift. Disabled state: 40% opacity, no glow.
- **Ghost:** transparent background, Tier-2 text, no border. Hover lifts text to Tier-1 and adds a subtle Beacon Teal underline.
- **Destructive:** Hazard Crimson background, white text, same padding. Hover adds Glow Crimson box-shadow. Used for delete confirmations only.

### Inputs

Quiet stroke, focused-glow.

- **Shape:** 2px radius (`rounded-xs`).
- **Background:** `rgba(255,255,255,0.04)` over Panel Navy.
- **Border:** 1px solid `rgba(255,255,255,0.1)`.
- **Text:** DM Sans 400 14px, `rgba(255,255,255,0.8)`.
- **Focus:** border becomes `hsl(157 80% 42% / 0.35)`, optional Inset Teal glow inside. No outline ring on focus — the border-shift IS the affordance, plus a 2px Beacon Teal `:focus-visible` ring on keyboard focus only.
- **Error:** border `hsl(347 100% 60% / 0.5)`; helper text Tier-2 in Hazard Crimson below the field.
- **Disabled:** 40% opacity, no border-shift on focus.

### Glass Panel (the canonical container)

The system's signature surface.

- **Corner Style:** zero radius (sharp).
- **Background:** Panel Navy at 0.9 alpha.
- **Border:** 1px solid `rgba(255,255,255,0.08)`.
- **Backdrop filter:** `blur(16px)` over the void.
- **Shadow Strategy:** Glass Drop only. No card-on-card.
- **Light arc:** when `glow` prop is set, a 1px Phosphor Glow gradient line at the bottom edge.
- **Internal padding:** 24px on desktop, 16px on mobile.

### Badges & Chips

- **Shape:** 3px radius (`rounded-sm`).
- **Glow variants:** background `hsl(accent / 0.06)`, border `1px solid hsl(accent / 0.15)`, text `hsl(accent)`. JetBrains Mono 11px.
- **Variants by accent:** Beacon Teal (default), Telemetry Amber (data warnings), Pro Indigo (Pro tier), Section Green (status), Legacy Cyan (simulator-only).
- **Numbered pips** (used in collapsible sections): 32×32px squares, mono 14px, same 0.06/0.15/1.0 stack.

### Navigation

- **Style:** Jura 11px uppercase, letter-spacing 1.2px, Tier-3 text by default.
- **Active state:** 2px left border in Phosphor Glow, text shifts to Phosphor Glow color, background gets `hsl(157 / 0.06)` tint.
- **Numbered nav (instrument-style):** mono 9px Velocity Amber prefix on each item.
- **Hover:** text lifts to Tier-2, no background shift.
- **Mobile:** collapses behind a hamburger trigger; opens as a Sheet not a Dropdown.

### Light-Arc Divider (the signature ornament)

A 1px horizontal gradient line, transparent → Phosphor Glow at 0.25 → transparent. Sits at panel edges, between major content blocks, and beneath section titles. This is the elevation cue that replaces shadow stacking. One per major surface, not decorative.

## 6. Do's and Don'ts

### Do:

- **Do** use the 5-tier text hierarchy on every page. If labels, units, and body text are all at the same brightness, the page is broken.
- **Do** reserve Tier-1 (#FAFAFA) for titles and result values only. Body text is Tier-2 (#C8C8C8) maximum.
- **Do** use MD Nichrome for H1 page titles only. Everything else is Jura, DM Sans, or JetBrains Mono.
- **Do** put DM Sans on every button. Buttons in display fonts are forbidden.
- **Do** apply the 0.06 / 0.15 / 1.0 glow stack to all accent-colored interactive elements.
- **Do** use light arcs (1px Phosphor Glow gradient) at panel edges instead of drop-shadows.
- **Do** keep panels at zero radius. Sharp edges are core identity.
- **Do** use weight contrast (300 vs 500) for hierarchy. Never bold.
- **Do** test every interactive element with a `:focus-visible` ring; tab cycle must be visible.
- **Do** respect `prefers-reduced-motion` — every keyframe animation in this system honors it.

### Don't:

- **Don't** use Inter. Forbidden anywhere in the system. (Repeated from CLAUDE.md.)
- **Don't** use MD Nichrome on buttons, badges, body text, or labels. H1 only.
- **Don't** use bold (font-weight 700) anywhere. Light (300) and medium (500) are the only weights.
- **Don't** use `#000` or `#fff` directly. Every neutral tints toward navy.
- **Don't** use Phosphor Glow (#3DFFCD) as a solid fill or text color. Box-shadow glow only.
- **Don't** use gradient text (`background-clip: text`). Decorative, never meaningful. Emphasis via weight or size.
- **Don't** use `border-left` greater than 1px as a colored stripe on cards, alerts, or callouts. Forbidden by impeccable's absolute bans.
- **Don't** add drop-shadows under cards. Use tonal layering plus light arcs.
- **Don't** use glassmorphism (backdrop-blur) decoratively on non-floating surfaces.
- **Don't** put labels, units, descriptions, and titles at the same brightness — collapses the hierarchy.
- **Don't** mimic NASA mission-control chrome (CRT terminal aesthetic, neon-green telemetry, fake gauges that don't compute). The instrumentation is real; the styling honors that, not fakes it.
- **Don't** use SaaS purple-gradient hero cards or floating-screenshot heroes. The product is not generic AI-tool SaaS.
- **Don't** add encouragement copy ("you got this!", "great job!"). The voice is a research notebook, not a coach.
- **Don't** soft-grey-and-white the whole surface. The product has a voice; sterile professionalism erases it.
- **Don't** use em dashes (`—`) or double hyphens (`--`) in copy. Use commas, colons, semicolons, periods, or parentheses. Repeated from impeccable's absolute bans.
- **Don't** use modal-as-first-thought for any UX problem. Inline and progressive disclosure first.
- **Don't** use rounded corners on GlassPanel. Always zero radius.

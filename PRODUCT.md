# Product

## Register

product

## Users

Beginning science fiction writers — first novel, first short story, or first time taking worldbuilding seriously. They have story instincts but stall on the systematic side: orbital mechanics, atmospheric chemistry, evolutionary biology, sociocultural cascades. They want rigor without becoming armchair physicists, and a structured starting point that beats blank-page paralysis.

Secondary: experienced SF writers who use the calculators and simulators as quick checks (habitable zone, surface gravity, time dilation, propulsion consequences) rather than full worldbuilding workspaces.

The core context is private writing time at a desk: deep focus, dim room, a single browser tab, often hours-long sessions. Tools serve a flow state, not a quick-glance dashboard. Every interruption costs.

## Product Purpose

StellarForge is a worldbuilding workspace organized around the Environmental Cascade principle: Physics → Environment → Biology → Psychology → Mythology → Culture. Twenty-one worksheets and calculators plus five canvas simulators let writers move through the cascade systematically, with each tool's output becoming the next tool's input. A privacy-first dashboard ("Your Worlds Are Yours Alone") holds the resulting worlds; an entity graph tracks the connections between species, places, technologies, and myths.

Success looks like a writer producing a coherent, internally-consistent world they can confidently set fiction in. Not a pile of generated content, but a thinking instrument they used.

## Brand Personality

Three words: **scholarly, instrumental, patient.**

The voice is the navigator's log: precise, measured, comfortable with technical precision but never showing off. Closer to a research notebook than a marketing brochure. Confident enough to use the word "physics" without softening it; humble enough to know the writer is the one doing the worldbuilding. The tools just hold the data.

Reference points:

- **Linear** — keyboard-first execution discipline, principled minimalism, dark default that doesn't feel goth. Restraint as posture.
- **Are.na / Cosmos** — curatorial slow-web feel. The sense that what's on the page deserves time. Treats content as primary.

The existing identity — "light emerging from void," deep navy backgrounds, teal-green accents that glow like indicator lights, sharp zero-radius edges, monospace data — sits in the lane formed by those two references.

## Anti-references

The interface should NOT look like:

- **Generic AI-tool SaaS.** Purple gradients, glassmorphic cards, hero with a floating product screenshot, "AI-powered" copy, ChatGPT-clone aesthetic. The product is not a chatbot wrapper.
- **Friendly writing platforms** (Wattpad, Reedsy, NaNoWriMo). Pastel palettes, mascot illustrations, encouragement copy ("you got this!"), soft rounded corners, friendly emoji. Treats writers like beginners who need a hug; StellarForge treats them like apprentice scientists.
- **NASA-cosplay sci-fi.** Heavy-handed instrument-panel mimicry, neon-green CRT-terminal aesthetic, decorative telemetry that means nothing, fake mission-control chrome. The instrumentation is real (data readouts come from real calculations); the styling honors that, not fakes it.
- **Empty Notion-clone.** Clean-white-canvas, soft-grey-and-white everything, every personality decision deferred to "professional." Sterile in a way that the worldbuilding subject matter is not.

## Design Principles

1. **Restraint as posture.** Every element earns its brightness. Tier-1 text (#FAFAFA) is reserved for results and titles; everything else lives quieter. The instrument panel doesn't shout. It's lit selectively.

2. **The simulation is the hero, the UI is the instrument panel.** Tool chrome should disappear into the task. If the user is reading their world's data, the surrounding interface should fade.

3. **Cascade over taxonomy.** Tools relate Physics → Environment → Biology → Culture. The interface should make those upstream-downstream relationships visible, not flatten them into a category grid.

4. **Privacy is voice, not feature.** "Your Worlds Are Yours Alone" is how the product talks. Sharing is opt-in, off-by-default; the language never assumes the user wants to publish.

5. **Science-credible, never science-cosplay.** Calculations are real, citations exist, the cosmology is rigorous. Decoration that imitates but doesn't compute is the failure mode (see: NASA-cosplay anti-reference).

## Accessibility & Inclusion

Target: **WCAG 2.2 AA** across the entire surface.

- Contrast: 4.5:1 for body text (DM Sans 15px against `--sf-void` #0A0E17). Tier-3/4/5 text classes (45% / 28% / 15% white) carry non-essential signal — never load-bearing copy.
- Keyboard: every interactive element reachable; visible `:focus-visible` ring; sidebar resize will gain keyboard parity (Phase 4 of the impeccable rollout plan).
- Motion: `prefers-reduced-motion` is already honored via `MotionConfig reducedMotion="user"` in `App.tsx`. Ambient animations (`sf-pulse`, `sf-scan`) respect it.
- Screen reader: semantic HTML, ARIA labels on icon-only buttons, live regions for cascade-suggestion toasts.
- 44px touch targets on all interactive elements. Tested at 375 / 768 / 1024 / 1280 / 1920px viewports.

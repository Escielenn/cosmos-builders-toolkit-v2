# StellarForge Simulator Normalization + Features Addendum

**For:** Claude Code / VS Code Implementation
**Companion to:** StellarForge_Layout_Normalization_Spec.md (worksheets) and StellarForge_Final_Remediation_Spec_v2.md
**Scope:** 5 standalone simulators + Stellar Cartographer + Gravitas classification

---

## SIMULATOR VISUAL AUDIT

### Consistent (Keep)
- Three-column layout: left controls, center canvas, right data readouts
- Cyan accent `#00D4FF` on deep black `#09090B`
- Left panel: scrollable control sections with uppercase cyan section headers
- Center: full-bleed interactive canvas
- Right panel: data readout with section groupings

### Inconsistent (Normalize)

| Element | ROGUE | Tidelock | ExoSky | ExoForge | Solaris | Cartographer |
|---------|-------|----------|--------|----------|---------|--------------|
| **Nav links** | HOME, WORLDS, TOOLS, THE SCIENCE | HOME, WORLDS, TOOLS, THE SCIENCE | None | HOME, WORLDS, TOOLS | None | MAPPED, ← TOOLS |
| **Branding** | Name + full subtitle + system desc + attribution | Name + STELLARFORGE.TOOLS | Name + planet name only | Name + STELLARFORGE.TOOLS | Name + STELLARFORGE.TOOLS | Name + STELLARFORGE.TOOLS |
| **Science page link** | THE SCIENCE (button) | THE SCIENCE (button) | "The Science" (footer link) | None | None | None |

### Normalization Rules

**Navigation:** All simulators get the same nav bar: HOME | WORLDS | TOOLS | THE SCIENCE (where a science page exists). If no science page exists for a simulator, show HOME | WORLDS | TOOLS only.

**Branding:** All simulators show:
```
SIMULATOR NAME
STELLARFORGE.TOOLS
[Current state description, e.g., "Our Solar System — 8 planets"]
```
Three lines max. Name in the existing simulator display font (large, tracked). "STELLARFORGE.TOOLS" as a subtle attribution line. State description in the third line, context-dependent.

**Science page:** ExoForge and Solaris should get science pages to match ROGUE, Tidelock, and ExoSky. (Content creation task, not code.)

---

## FONT SIZE INCREASE

All simulator panel text is too small. Apply these minimum sizes:

| Element | Current (approx) | Target |
|---------|-------------------|--------|
| Section headers (cyan uppercase) | 10-11px | 12px |
| Parameter labels | 11-12px | 13px |
| Parameter values | 11-12px | 13px, JetBrains Mono |
| Right panel data labels | 10-11px | 12px |
| Right panel data values | 11-12px | 14px, JetBrains Mono |
| Right panel section headers (cyan) | 10-11px | 12px |
| Button text | 10-11px | 12px |
| Canvas overlays / tooltips | 11px | 13px |

**Implementation:** Each simulator is standalone HTML/JS. Font sizes are set in their own CSS. Update each simulator's stylesheet individually. Do NOT extract into a shared file (simulators are intentionally independent).

---

## GRAVITAS CLASSIFICATION

**Decision:** Gravitas stays as a worksheet, not a simulator. It uses the standard worksheet layout (back link, action bar, title, intro panel, CollapsibleSections) with an interactive visualization inside Section 3. The visualization is a feature of the worksheet, not a reason to reclassify it.

**Action:** Ensure Gravitas follows the worksheet `ToolPageLayout.tsx` normalization from the main layout spec. No simulator-specific treatment needed.

---

## NEW FEATURE: SIMULATOR WRITING CONNECTION

### Concept
After running a simulation, a pull-out panel slides from the right offering guided questions that bridge the physics output to narrative implications. This is the Cascade applied to simulators: the simulation produces physics data, the writing panel asks what that data means for environment, biology, psychology, mythology, and culture.

### Design

**Trigger:** A "NARRATIVE BRIDGE" button (or similar ship's-computer label) appears in the simulator UI after any simulation has been run or any meaningful state exists. Clicking it slides open a right-side panel over the data readout.

**Panel contents:**
```
┌── NARRATIVE BRIDGE ──────────────────┐
│                                       │
│  Based on your simulation:            │
│  [1-line summary of current state]    │
│                                       │
│  ENVIRONMENT                          │
│  What does this mean for the          │
│  surface conditions of your world?    │
│  [textarea]                           │
│                                       │
│  BIOLOGY                              │
│  How would life adapt to these        │
│  conditions?                          │
│  [textarea]                           │
│                                       │
│  CULTURE                              │
│  What societies might emerge from     │
│  this environment?                    │
│  [textarea]                           │
│                                       │
│  MYTHOLOGY                            │
│  What stories would the inhabitants   │
│  tell about these phenomena?          │
│  [textarea]                           │
│                                       │
│  [Save to World]                      │
│                                       │
└───────────────────────────────────────┘
```

### Per-Simulator Questions

Questions should be contextual to what the simulator produces:

**ROGUE:** "A rogue [object type] passed through [system]. What lasting effects did this encounter leave? How do the inhabitants remember this event? What political or religious consequences followed?"

**Tidelock:** "Your world is tidally locked. What civilizations form on the permanent day side vs the night side? What is the terminator zone's role? What myths explain the frozen sun?"

**ExoSky:** "From the surface of [planet], the night sky looks like this. What constellations do the inhabitants draw? What navigational systems emerge? What cosmological myths arise from these star patterns?"

**ExoForge:** "You've generated a [planet type] with [key characteristics]. What are the primary survival challenges? What resources does this world offer? What makes this world worth settling or avoiding?"

**Solaris:** "Your [N]-body star system has [description]. How do multiple suns affect calendars, agriculture, religion? What happens during eclipses or conjunctions?"

**Stellar Cartographer:** "Your galaxy contains [N] empires across [N] systems. What are the major trade disputes? Where are the frontiers? What regions are contested?"

### Implementation Notes

- Questions are stored in a config file: `src/lib/simulator-narrative-questions.ts`
- Answers are stored as part of the simulation save data (see next section)
- "Save to World" triggers the Publish to World flow with both simulation data AND narrative responses
- The panel uses the simulator aesthetic (cyan on black), not the worksheet aesthetic
- Panel is a React component rendered by the simulator wrapper page, not inside the iframe

---

## NEW FEATURE: SIMULATION SAVE & REPLAY

### Concept
Save a specific simulation state (parameters + results) for later replay. This is the simulator equivalent of Save Draft. The saved state becomes the data payload for Publish to World.

### What Gets Saved Per Simulator

**ROGUE:** Star system selection, intruder type, mass, approach distance, velocity, approach angle, time scale, simulation result (planet statuses: orbiting/ejected/captured), encounter duration.

**Tidelock:** Star type, planet mass/radius/orbital distance, atmosphere settings, surface settings, computed temperatures, habitability results.

**ExoSky:** Observation point (planet), atmosphere settings, Milky Way settings, display toggles, custom constellations drawn by the user, view position (RA/Dec/FOV).

**ExoForge:** All physical parameters (radius, mass, temperature, composition, ocean coverage, clouds, terrain, rings), computed derived values (gravity, density, escape velocity, habitability), data source (custom/NASA import).

**Solaris:** Star configuration (single/binary/trinary+), star types, system name, planet count, conditions, generated system state (orbital parameters for all bodies).

**Stellar Cartographer:** Galaxy name, structure type, star count, arms, spread, seed, named systems, empire assignments, trade routes, wormholes.

### Data Structure

Each simulator save produces a JSON payload:
```typescript
interface SimulationSave {
  simulatorType: 'rogue' | 'tidelock' | 'exosky' | 'exoforge' | 'solaris' | 'cartographer';
  name: string;           // user-assigned name
  parameters: Record<string, unknown>;  // input settings
  results: Record<string, unknown>;     // computed output
  narrativeNotes?: Record<string, string>; // from the Narrative Bridge panel
  savedAt: string;        // ISO timestamp
  thumbnailUrl?: string;  // screenshot of the canvas at save time
}
```

### Save Flow

1. User clicks "SAVE SIMULATION" button in the simulator UI
2. Simulator posts a message to the parent frame:
   ```javascript
   window.parent.postMessage({
     type: 'STELLARFORGE_SAVE',
     payload: { /* SimulationSave */ }
   }, '*');
   ```
3. React wrapper receives the message and either:
   a. Saves to a new `simulation_saves` Supabase table (world_id, user_id, simulator_type, name, data JSONB, thumbnail_url, created_at)
   b. Shows Publish to World dialog if the user wants to create an entity

### Replay Flow

1. User navigates to a saved simulation (from Codex, or from a "Saved Simulations" section on the simulator page)
2. React wrapper loads the save data and posts it back to the iframe:
   ```javascript
   iframeRef.current.contentWindow.postMessage({
     type: 'STELLARFORGE_LOAD',
     payload: { /* SimulationSave */ }
   }, '*');
   ```
3. Simulator receives the message and restores its state from the payload
4. Each simulator needs a `handleLoad(data)` function added to its JS

### UI: Save Button Placement

Add a "SAVE" button to each simulator's control panel, consistent position across all simulators. Suggested: bottom of the left control panel, same row as existing action buttons (GENERATE, LAUNCH, etc.), styled in the simulator aesthetic.

### Database

```sql
CREATE TABLE simulation_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  simulator_type TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled',
  data JSONB NOT NULL,
  narrative_notes JSONB,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: users can only access their own saves
ALTER TABLE simulation_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own simulation saves"
  ON simulation_saves
  FOR ALL
  USING (auth.uid() = user_id);
```

---

## INTEGRATION WITH PUBLISH TO WORLD

The three features form a pipeline:

```
RUN SIMULATION
     ↓
NARRATIVE BRIDGE (optional guided questions)
     ↓
SAVE SIMULATION (persists parameters + results + notes)
     ↓
PUBLISH TO WORLD (creates entity, triggers fuzzy match dialog, 
                   stacks data profile on wiki page)
```

Each step is optional and independent. A user can:
- Run and save without publishing (exploratory mode)
- Run and publish without saving (quick canon entry)  
- Run, reflect via Narrative Bridge, save, then publish (full workflow)

The Publish to World flow uses the same entity-match dialog and dossier stacking model from the remediation spec. Simulator output becomes another data profile section on the wiki page, alongside worksheet data profiles.

---

## IMPLEMENTATION ORDER (WITHIN SIMULATOR WORK)

```
1. Font size normalization across all 6 simulators          2-3 hours
2. Navigation bar normalization                              2-3 hours  
3. Branding normalization                                    1 hour
4. Save/Replay infrastructure (PostMessage + DB)             6-8 hours
5. Narrative Bridge panel (React wrapper component)          4-6 hours
6. Per-simulator SAVE handler (one per simulator)            6-8 hours
7. Per-simulator LOAD handler (one per simulator)            4-6 hours
8. Publish to World integration                              (covered in main spec)
```

**Total simulator-specific work:** 25-35 hours (in addition to the main spec's Publish to World bridge)

---

## DO NOT TOUCH

- The simulator canvas rendering code (WebGL, Canvas 2D, Three.js)
- The physics engines inside each simulator
- The star catalog data (exosky-stars.json)
- The Web Worker (exosky-mw-worker.js)
- The existing simulator HTML structure (add to it, don't restructure)

---

*These worlds exist in you. Waiting to be found.*

© 2025-2026 Jason D. Batt, Ph.D. · StellarForge.tools

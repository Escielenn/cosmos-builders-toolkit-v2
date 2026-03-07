// Time Dilation Calculator—Data Constants
// Journey presets, propulsion methods, reference frames, story prompts

import type { Section } from "@/components/tools/SectionNavigation";

// ─── Journey Presets ─────────────────────────────────────────────────

export interface JourneyPair {
  id: string;
  origin: string;
  destination: string;
  distanceLY: number; // distance in light-years
  annotation?: string; // e.g., "1.28 light-seconds"
}

export interface JourneyCategory {
  id: string;
  label: string;
  pairs: JourneyPair[];
}

export const JOURNEY_PRESETS: JourneyCategory[] = [
  {
    id: "solar-inner",
    label: "Solar System (Inner)",
    pairs: [
      { id: "earth-moon", origin: "Earth", destination: "Moon", distanceLY: 4.063e-8, annotation: "1.28 light-seconds" },
      { id: "earth-mars-close", origin: "Earth", destination: "Mars (closest approach)", distanceLY: 5.77e-6, annotation: "~3 light-minutes" },
      { id: "earth-mars-avg", origin: "Earth", destination: "Mars (average)", distanceLY: 2.378e-5, annotation: "~12.5 light-minutes" },
      { id: "earth-jupiter", origin: "Earth", destination: "Jupiter", distanceLY: 6.646e-5, annotation: "~35 light-minutes" },
      { id: "earth-saturn", origin: "Earth", destination: "Saturn", distanceLY: 1.348e-4, annotation: "~1.18 light-hours" },
    ],
  },
  {
    id: "solar-outer",
    label: "Solar System (Outer)",
    pairs: [
      { id: "earth-uranus", origin: "Earth", destination: "Uranus", distanceLY: 2.879e-4, annotation: "~2.52 light-hours" },
      { id: "earth-neptune", origin: "Earth", destination: "Neptune", distanceLY: 4.599e-4, annotation: "~4.03 light-hours" },
      { id: "earth-pluto", origin: "Earth", destination: "Pluto (avg)", distanceLY: 6.243e-4, annotation: "~5.47 light-hours" },
      { id: "earth-voyager1", origin: "Earth", destination: "Voyager 1 (~2025)", distanceLY: 2.579e-3, annotation: "~22.6 light-hours" },
      { id: "sun-oort", origin: "Sun", destination: "Oort Cloud (inner edge)", distanceLY: 0.032, annotation: "~2,000 AU" },
    ],
  },
  {
    id: "interstellar",
    label: "Interstellar",
    pairs: [
      { id: "sol-proxima", origin: "Sol", destination: "Proxima Centauri", distanceLY: 4.24, annotation: "4.24 ly" },
      { id: "sol-barnards", origin: "Sol", destination: "Barnard's Star", distanceLY: 5.96, annotation: "5.96 ly" },
      { id: "sol-sirius", origin: "Sol", destination: "Sirius", distanceLY: 8.6, annotation: "8.6 ly" },
      { id: "sol-tau-ceti", origin: "Sol", destination: "Tau Ceti", distanceLY: 11.9, annotation: "11.9 ly" },
      { id: "sol-kepler442", origin: "Sol", destination: "Kepler-442", distanceLY: 1206, annotation: "~1,206 ly" },
      { id: "sol-sgra", origin: "Sol", destination: "Sagittarius A* (galactic center)", distanceLY: 26000, annotation: "~26,000 ly" },
    ],
  },
  {
    id: "intergalactic",
    label: "Intergalactic",
    pairs: [
      { id: "mw-lmc", origin: "Milky Way", destination: "Large Magellanic Cloud", distanceLY: 160000, annotation: "~160,000 ly" },
      { id: "mw-andromeda", origin: "Milky Way", destination: "Andromeda Galaxy", distanceLY: 2537000, annotation: "~2.54 million ly" },
    ],
  },
];

// ─── Propulsion Methods ──────────────────────────────────────────────

export interface PropulsionMethod {
  id: string;
  label: string;
  maxVelocityC: number; // fraction of c
  note: string;
  isAlcubierre?: boolean;
}

export const PROPULSION_METHODS: PropulsionMethod[] = [
  { id: "chemical", label: "Chemical Rocket", maxVelocityC: 0.00005, note: "Voyager-class. No meaningful time dilation." },
  { id: "ion", label: "Ion Drive / Solar Electric", maxVelocityC: 0.0003, note: "Dawn/Deep Space 1 class. Efficient but slow." },
  { id: "nuclear-thermal", label: "Nuclear Thermal", maxVelocityC: 0.003, note: "NERVA-class. Realistic near-future." },
  { id: "nuclear-pulse", label: "Nuclear Pulse (Orion-type)", maxVelocityC: 0.03, note: "Project Orion. Ride the bomb." },
  { id: "fusion", label: "Fusion Drive", maxVelocityC: 0.1, note: "Theoretical tokamak propulsion." },
  { id: "light-sail", label: "Light Sail (Laser-Pushed)", maxVelocityC: 0.2, note: "Breakthrough Starshot concept." },
  { id: "antimatter", label: "Antimatter Drive", maxVelocityC: 0.5, note: "Near-maximum energy density." },
  { id: "alcubierre", label: "Alcubierre Drive (Speculative)", maxVelocityC: 10, note: "Requires exotic matter. Your One Big Lie.", isAlcubierre: true },
  { id: "custom", label: "Custom Drive", maxVelocityC: 0, note: "Set your own maximum velocity." },
];

// ─── Reference Frames ────────────────────────────────────────────────

export interface ReferenceFrame {
  id: string;
  label: string;
  description: string;
}

export const REFERENCE_FRAMES: ReferenceFrame[] = [
  { id: "earth", label: "Earth Standard Time", description: "Default reference frame" },
  { id: "mars", label: "Mars Colony Time", description: "Sol-based (37 min longer day)" },
  { id: "lunar", label: "Lunar Standard Time", description: "Synchronized with Earth" },
  { id: "origin", label: "Origin Point", description: "The departure location" },
  { id: "destination", label: "Destination", description: "The arrival location" },
  { id: "custom", label: "Custom Frame", description: "Name your own reference" },
];

// ─── Story Prompts ───────────────────────────────────────────────────

export type DilationSeverity = "negligible" | "notable" | "significant" | "extreme";

export interface StoryPrompt {
  title: string;
  prompt: string;
}

export const STORY_PROMPTS: Record<DilationSeverity, StoryPrompt[]> = {
  negligible: [
    {
      title: "No Narrative Tension from Dilation",
      prompt: "Time dilation is negligible at this speed. Your characters won't notice the difference. Story tension comes from distance and isolation, not time.",
    },
  ],
  notable: [
    {
      title: "The Missed Birthday",
      prompt: "A few days or weeks of difference—enough to miss a birthday, an anniversary, a deadline. Small but personal.",
    },
    {
      title: "News Delay",
      prompt: "Events at home happen slightly faster than you experience. News feels stale when it arrives. Scheduling conflicts emerge.",
    },
    {
      title: "Precision Matters",
      prompt: "For scientific missions, even small time offsets can cascade into navigation errors. GPS satellites already correct for relativistic drift.",
    },
  ],
  significant: [
    {
      title: "The Changed Face",
      prompt: "You return to find your children visibly older. Your partner has new lines around their eyes. Months have passed that you didn't live.",
    },
    {
      title: "Career Displacement",
      prompt: "Your professional skills are slightly outdated. Colleagues have been promoted past you. The world moved on while you traveled.",
    },
    {
      title: "The Twin Paradox",
      prompt: "Classic storytelling device: one twin travels, one stays. Who aged more, and how does each feel about it?",
    },
    {
      title: "Communication Gaps",
      prompt: "Letters and messages arrive out of sync. Conversations span different experienced durations. Relationships fracture under temporal asymmetry.",
    },
  ],
  extreme: [
    {
      title: "Civilizational Drift",
      prompt: "Languages have changed. Governments have risen and fallen. You are a living fossil, a refugee from history.",
    },
    {
      title: "The Stranger Returns",
      prompt: "You left behind a young family. You return to find grandchildren—or an empty house. Your partner aged decades while you aged years.",
    },
    {
      title: "Temporal Exile",
      prompt: "By traveling, you've exiled yourself from your own time. The world you return to is not the world you left. This is a one-way trip through time.",
    },
    {
      title: "The Forever War",
      prompt: "Soldiers fight across years of ship time while centuries pass at home. What do they return to? (Joe Haldeman's masterwork explores this.)",
    },
    {
      title: "Time as a Weapon",
      prompt: "Deliberate use of time dilation: send prisoners on relativistic exile, preserve knowledge-keepers in slow time, or outlast your enemies by simply waiting.",
    },
  ],
};

// ─── Section Navigation ──────────────────────────────────────────────

export const TIME_DILATION_SECTIONS: Section[] = [
  { id: "section-journey", title: "1. Journey" },
  { id: "section-propulsion", title: "2. Propulsion" },
  { id: "section-velocity", title: "3. Velocity Profile" },
  { id: "section-results", title: "4. Results" },
  { id: "section-reference", title: "5. Reference Frame" },
  { id: "section-story", title: "6. Story Notes" },
];

// ─── Section Helper Text ─────────────────────────────────────────────

export const SECTION_HELPERS: Record<string, string> = {
  journey: "Choose your origin and destination. The distance between them determines the baseline travel time before dilation effects apply.",
  propulsion: "Your propulsion method determines the maximum speed your vessel can reach, which directly controls how much time dilation your travelers experience.",
  velocity: "Constant velocity assumes instantaneous acceleration—clean for napkin math. Brachistochrone is realistic: accelerate halfway, decelerate the rest.",
  results: "All values computed using special relativity. The Lorentz factor (γ) tells you how much time slows for the traveler relative to the observer.",
  reference: "Where does your story keep time? The 'home clock' is the calendar that matters for your narrative—the one your characters measure their absence against.",
  story: "Use these prompts to explore how time dilation affects your characters, their relationships, and the world they return to.",
};

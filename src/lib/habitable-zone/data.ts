// Habitable Zone Calculator, Data Constants
// Star presets, spectral types, section navigation, zone implications

import type { Section } from "@/components/tools/SectionNavigation";

// ─── Star Presets ────────────────────────────────────────────────────

export interface StarPreset {
  id: string;
  label: string;
  spectralType: string;
  mass: number;         // solar masses
  luminosity: number;   // solar luminosities
  temperature: number;  // K
  description: string;
  knownPlanets?: { name: string; distanceAU: number }[];
}

export const STAR_PRESETS: StarPreset[] = [
  {
    id: "sol",
    label: "Sol (G2V)",
    spectralType: "G",
    mass: 1.0,
    luminosity: 1.0,
    temperature: 5778,
    description: "Our Sun, the baseline for all comparisons.",
    knownPlanets: [
      { name: "Venus", distanceAU: 0.723 },
      { name: "Earth", distanceAU: 1.0 },
      { name: "Mars", distanceAU: 1.524 },
    ],
  },
  {
    id: "proxima",
    label: "Proxima Centauri (M5.5V)",
    spectralType: "M",
    mass: 0.122,
    luminosity: 0.0017,
    temperature: 3042,
    description: "Nearest star. Red dwarf with a tiny habitable zone, tidal locking is almost certain.",
    knownPlanets: [
      { name: "Proxima b", distanceAU: 0.0485 },
    ],
  },
  {
    id: "sirius",
    label: "Sirius A (A1V)",
    spectralType: "A",
    mass: 2.063,
    luminosity: 25.4,
    temperature: 9940,
    description: "Brightest star visible from Earth. Wide HZ, but short main-sequence lifetime.",
  },
  {
    id: "kepler442",
    label: "Kepler-442 (K-type)",
    spectralType: "K",
    mass: 0.61,
    luminosity: 0.12,
    temperature: 4402,
    description: "Hosts a confirmed habitable zone super-Earth. Long-lived and stable.",
    knownPlanets: [
      { name: "Kepler-442b", distanceAU: 0.409 },
    ],
  },
  {
    id: "trappist1",
    label: "TRAPPIST-1 (M8V)",
    spectralType: "M",
    mass: 0.089,
    luminosity: 0.000525,
    temperature: 2566,
    description: "Ultra-cool dwarf with 7 Earth-sized planets, 3 in the habitable zone.",
    knownPlanets: [
      { name: "TRAPPIST-1d", distanceAU: 0.02228 },
      { name: "TRAPPIST-1e", distanceAU: 0.02928 },
      { name: "TRAPPIST-1f", distanceAU: 0.03853 },
      { name: "TRAPPIST-1g", distanceAU: 0.04688 },
    ],
  },
  {
    id: "custom",
    label: "Custom Star",
    spectralType: "G",
    mass: 1.0,
    luminosity: 1.0,
    temperature: 5778,
    description: "Define your own stellar parameters.",
  },
];

// ─── Spectral Type Defaults ─────────────────────────────────────────

export interface SpectralTypeData {
  type: string;
  subtype: string;
  mass: number;
  luminosity: number;
  temperature: number;
}

export const SPECTRAL_TYPES: SpectralTypeData[] = [
  { type: "O", subtype: "O5", mass: 60, luminosity: 790000, temperature: 42000 },
  { type: "B", subtype: "B0", mass: 17.5, luminosity: 44000, temperature: 30000 },
  { type: "A", subtype: "A0", mass: 2.9, luminosity: 54, temperature: 9800 },
  { type: "F", subtype: "F0", mass: 1.6, luminosity: 6.5, temperature: 7300 },
  { type: "G", subtype: "G0", mass: 1.05, luminosity: 1.5, temperature: 5940 },
  { type: "G", subtype: "G2", mass: 1.0, luminosity: 1.0, temperature: 5778 },
  { type: "K", subtype: "K0", mass: 0.79, luminosity: 0.42, temperature: 5270 },
  { type: "K", subtype: "K5", mass: 0.67, luminosity: 0.15, temperature: 4410 },
  { type: "M", subtype: "M0", mass: 0.51, luminosity: 0.077, temperature: 3870 },
  { type: "M", subtype: "M5", mass: 0.18, luminosity: 0.0027, temperature: 3240 },
  { type: "M", subtype: "M8", mass: 0.08, luminosity: 0.0001, temperature: 2660 },
];

// Get default values for a spectral class (uses first entry for that class)
export function getSpectralDefaults(spectralType: string): SpectralTypeData | undefined {
  return SPECTRAL_TYPES.find((s) => s.type === spectralType);
}

// ─── Spectral Colors (for Canvas rendering) ─────────────────────────

export const SPECTRAL_COLORS: Record<string, { fill: string; glow: string }> = {
  O: { fill: "#9BB0FF", glow: "rgba(155, 176, 255, 0.6)" },
  B: { fill: "#AABFFF", glow: "rgba(170, 191, 255, 0.5)" },
  A: { fill: "#CAD7FF", glow: "rgba(202, 215, 255, 0.4)" },
  F: { fill: "#F8F7FF", glow: "rgba(248, 247, 255, 0.35)" },
  G: { fill: "#FFF4EA", glow: "rgba(255, 244, 234, 0.35)" },
  K: { fill: "#FFD2A1", glow: "rgba(255, 210, 161, 0.3)" },
  M: { fill: "#FFCC6F", glow: "rgba(255, 100, 50, 0.3)" },
};

// ─── Planet Zone Types ──────────────────────────────────────────────

export type PlanetZone =
  | "scorched"
  | "hot-optimistic"
  | "inner-habitable"
  | "sweet-spot"
  | "outer-habitable"
  | "cold-optimistic"
  | "frozen"
  | "near-snowline";

export interface WorldbuildingImplication {
  title: string;
  description: string;
  category: "climate" | "biology" | "culture" | "technology";
}

export const ZONE_NAMES: Record<PlanetZone, string> = {
  "scorched": "Scorched (Inside HZ)",
  "hot-optimistic": "Hot Optimistic Zone",
  "inner-habitable": "Inner Habitable Zone",
  "sweet-spot": "Sweet Spot",
  "outer-habitable": "Outer Habitable Zone",
  "cold-optimistic": "Cold Optimistic Zone",
  "frozen": "Frozen (Outside HZ)",
  "near-snowline": "Near Snowline",
};

export const ZONE_COLORS: Record<PlanetZone, string> = {
  "scorched": "#E74C3C",
  "hot-optimistic": "#FFA500",
  "inner-habitable": "#2ECC71",
  "sweet-spot": "#2ECC71",
  "outer-habitable": "#2ECC71",
  "cold-optimistic": "#4D9FFF",
  "frozen": "#4D9FFF",
  "near-snowline": "#ADD8E6",
};

// ─── Zone Worldbuilding Descriptions ────────────────────────────────

export const ZONE_DESCRIPTIONS: Record<PlanetZone, string> = {
  "scorched":
    "Your world is too hot for liquid surface water. Consider: Venus-analog with crushing atmosphere, subsurface oceans beneath reflective cloud layers, or a tidally locked world where the terminator zone might be habitable.",
  "hot-optimistic":
    "Your world is in the optimistic inner zone, potentially habitable but at the edge. Expect intense stellar flux, risk of runaway greenhouse effect, and a narrow window for liquid water stability.",
  "inner-habitable":
    "Your world receives intense stellar flux. Expect: thick cloud cover, potential runaway greenhouse risk, hot oceans. Biology would favor heat tolerance, reflective surfaces, deep-ocean life. Think Dune's Arrakis (without the spice-engineered ecology).",
  "sweet-spot":
    "Your world sits in the most Earth-like region. Liquid water is stable across a wide temperature range. This gives you maximum flexibility for biology and climate, but remember, 'Earth-like' doesn't mean 'Earth-identical.'",
  "outer-habitable":
    "Your world is at the edge of habitability. Expect: glaciation pressure, thick CO\u2082 atmosphere needed for greenhouse warming, dim sunlight. Biology would favor insulation, dark pigmentation for heat absorption, long metabolic cycles. Think Hoth meets Europa.",
  "cold-optimistic":
    "Your world is in the optimistic outer zone, liquid water requires significant greenhouse warming. A thick CO\u2082 or methane atmosphere could maintain habitable conditions, but the climate balance is precarious.",
  "frozen":
    "No liquid surface water without extreme greenhouse effects. Consider: subsurface oceans heated by tidal forces (like Europa/Enceladus), rogue planet with internal heat, or a captured moon of a gas giant inside the HZ.",
  "near-snowline":
    "Your world is near the frost line where water ice is stable. This region favors gas giant formation, if your world is rocky here, that's a story in itself (migration? capture?). Asteroid belt analogs form near here.",
};

// ─── Zone Worldbuilding Implications ────────────────────────────────

export const ZONE_IMPLICATIONS: Record<PlanetZone, WorldbuildingImplication[]> = {
  "scorched": [
    { title: "Extreme Heat Survival", description: "Civilizations must live underground, in pressurized domes, or in permanent twilight zones on tidally locked worlds. Surface excursions become dangerous pilgrimages.", category: "technology" },
    { title: "Thermophilic Biology", description: "Life, if it exists, would be extremophilic, heat-resistant biochemistry, possibly silicon-based or using alternative solvents. Think deep-sea hydrothermal vent organisms scaled to a planetary surface.", category: "biology" },
    { title: "Light-Driven Culture", description: "If tidally locked: the terminator zone becomes the only habitable strip, creating linear civilizations. If rotating: night becomes the time of activity, day becomes the time of shelter.", category: "culture" },
    { title: "Venus Analog", description: "A thick atmosphere could create a runaway greenhouse, crushing pressures, acid rain, and surface temperatures that melt lead. Above the cloud deck, floating habitats become the only option.", category: "climate" },
  ],
  "hot-optimistic": [
    { title: "Greenhouse Tightrope", description: "Your world walks a razor's edge between habitable and Venus. Small changes in atmospheric composition could tip the balance. This creates existential stakes around climate engineering.", category: "climate" },
    { title: "Cloud World", description: "Thick reflective cloud cover may be necessary to maintain habitable temperatures. Permanent overcast skies shape psychology, stargazing becomes mythology rather than science.", category: "culture" },
    { title: "Aquatic Dominance", description: "Hot oceans favor marine and amphibious life. Land may be too hot for complex organisms during the day. Coastal and underwater civilizations become the norm.", category: "biology" },
  ],
  "inner-habitable": [
    { title: "Tropical World", description: "Warm temperatures across most of the surface. Polar regions become the temperate zones. The equator may be too hot for unprotected habitation.", category: "climate" },
    { title: "Heat-Adapted Life", description: "Biology favors reflective surfaces, efficient cooling mechanisms, nocturnal behavior, and deep-root systems to access groundwater. Think desert-adapted species scaled to global conditions.", category: "biology" },
    { title: "Water as Currency", description: "In a hot world, water becomes the most precious resource. Cultures develop around water rights, conservation rituals, and the technology of moisture capture. Dune's Fremen are the archetype.", category: "culture" },
    { title: "Energy Abundance", description: "Intense stellar flux means abundant solar energy. Civilizations develop along energy-rich paths, but the waste heat problem shapes architecture and urban design.", category: "technology" },
  ],
  "sweet-spot": [
    { title: "Maximum Flexibility", description: "This is the goldilocks zone within the Goldilocks zone. You have the most creative freedom here, liquid water is stable, temperature ranges are moderate, and biology can go in almost any direction.", category: "climate" },
    { title: "Earth-Analog Potential", description: "Your planet could host Earth-like biospheres, but it doesn't have to. An Earth-like position doesn't guarantee Earth-like outcomes. Mars sits in our HZ too.", category: "biology" },
    { title: "Agricultural Abundance", description: "Stable climate supports diverse agriculture. Civilizations can develop traditional farming, leading to settled populations, cities, and the full range of social complexity.", category: "culture" },
    { title: "Balanced Technology", description: "Neither energy-scarce nor energy-overloaded, civilizations develop balanced technology paths. The challenges are social and political rather than purely environmental.", category: "technology" },
  ],
  "outer-habitable": [
    { title: "Ice Age Pressure", description: "Glaciation is a constant threat. Even small orbital variations or volcanic events can tip the planet into snowball states. Climate stability requires active greenhouse maintenance.", category: "climate" },
    { title: "Cold-Adapted Biology", description: "Life favors insulation, dark pigmentation for heat absorption, antifreeze biochemistry, and long metabolic cycles. Hibernation may be universal. Think Arctic biology scaled to global conditions.", category: "biology" },
    { title: "Subterranean Civilization", description: "Underground warmth becomes essential. Civilizations dig deep, geothermal energy is life itself. Surface expeditions are seasonal or ceremonial.", category: "culture" },
    { title: "Atmospheric Engineering", description: "Maintaining a thick enough greenhouse atmosphere is an existential technology. CO\u2082 management isn't politics, it's survival infrastructure.", category: "technology" },
  ],
  "cold-optimistic": [
    { title: "Precarious Warmth", description: "Liquid water is possible but requires significant greenhouse warming. The climate is inherently unstable, a volcanic winter or impact event could freeze the oceans.", category: "climate" },
    { title: "Dim Sunlight", description: "Plants (or their equivalents) would need to be highly efficient photosynthesizers, likely dark-pigmented to absorb maximum light. Bioluminescence may supplement solar energy.", category: "biology" },
    { title: "Light Worship", description: "In a world where the sun provides barely enough warmth, solar worship isn't metaphorical, it's rational. Architecture orients toward light capture. Solstices mark survival milestones.", category: "culture" },
  ],
  "frozen": [
    { title: "Subsurface Oceans", description: "Under a thick ice shell, tidal heating from a parent body (if a moon) or residual heat could maintain liquid water. Life develops in total darkness around hydrothermal vents.", category: "biology" },
    { title: "Ice Shell Architecture", description: "Civilization builds within and upon the ice. The surface is a frozen desert; the ocean below is warm and alive. Vertical geography replaces horizontal, depth is direction.", category: "culture" },
    { title: "Tidal Heating Dependency", description: "If orbiting a gas giant, tidal forces provide the energy budget. Orbital mechanics become existential, resonance changes could freeze or boil the ocean.", category: "climate" },
    { title: "Rogue Planet Option", description: "A world ejected from its system could maintain subsurface oceans through radioactive decay alone. No star, no sky, no concept of 'day', a truly alien starting point.", category: "technology" },
  ],
  "near-snowline": [
    { title: "Volatile Richness", description: "Near the frost line, water ice and other volatiles are abundant. This region is rich in the raw materials for life, but surface conditions are harsh.", category: "climate" },
    { title: "Gas Giant Moons", description: "The snowline is where gas giants form. If your world is here, it's likely a moon of a jovian planet, with all the tidal, radiation, and orbital implications that entails.", category: "biology" },
    { title: "Mining Economy", description: "Asteroid belts form near the snowline. A rocky world here sits amid tremendous mineral wealth, but also amid the debris of planetary formation.", category: "culture" },
    { title: "Migration History", description: "A rocky world at the snowline likely migrated there, either outward from the inner system or inward from beyond. That migration history is a geological and biological story.", category: "technology" },
  ],
};

// ─── Section Navigation ─────────────────────────────────────────────

export const HZ_SECTIONS: Section[] = [
  { id: "section-star", title: "1. Star" },
  { id: "section-diagram", title: "2. Orbital Diagram" },
  { id: "section-planet", title: "3. Planet Placement" },
  { id: "section-results", title: "4. Analysis" },
  { id: "section-implications", title: "5. Worldbuilding" },
  { id: "section-story", title: "6. Story Notes" },
];

// ─── Section Helpers ────────────────────────────────────────────────

export const SECTION_HELPERS: Record<string, string> = {
  star: "Define your host star. Choose a preset or customize mass, luminosity, and temperature. The star determines everything that follows.",
  diagram: "The orbital diagram shows the habitable zone as concentric bands around your star. Use the slider below to position your planet.",
  planet: "Place your planet within the system. Its position relative to the habitable zone determines climate, chemistry, and life potential.",
  results: "Calculated boundaries, equilibrium temperature, stellar flux, and orbital period. All values derive from your stellar parameters.",
  implications: "What your planet's position means for worldbuilding: climate, biology, culture, and technology implications cascade from orbital mechanics.",
  story: "Capture narrative ideas about how your star and planet shape the stories set in this system.",
};

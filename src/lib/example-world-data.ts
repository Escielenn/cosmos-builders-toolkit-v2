// ---------------------------------------------------------------------------
// Example World Seed: "The Tidelock Archives"
// A tidally locked planet demonstrating the full Environmental Cascade.
// Used as the community example world all users can explore and fork.
// ---------------------------------------------------------------------------

export interface ExampleWorldSeed {
  world: {
    name: string;
    description: string;
    icon: string;
    tags: string[];
    visibility: string;
    license: string;
    is_example: boolean;
  };
  entities: Array<{
    name: string;
    entity_type: string;
    cascade_stage: string;
    color: string | null;
    summary: string;
    description: string;
    tags: string[];
  }>;
  connections: Array<{
    source_name: string;
    target_name: string;
    relationship_type: string;
    relationship_label: string | null;
    cascade_stage: string;
    bidirectional: boolean;
    strength: number;
  }>;
  worksheets: Array<{
    tool_type: string;
    title: string;
    data: Record<string, unknown>;
  }>;
  entries: Array<{
    title: string;
    entry_type: string;
    content: string;
  }>;
  notes: Array<{
    title: string;
    content: string;
    tags: string[];
  }>;
}

export const EXAMPLE_WORLD: ExampleWorldSeed = {
  world: {
    name: "The Tidelock Archives",
    description:
      "A tidally locked world orbiting a red dwarf star, where civilization clings to the narrow twilight band between eternal day and eternal night. Every element of this world — from its physics to its mythology — flows through the Environmental Cascade.",
    icon: "🌗",
    tags: ["example", "tidal-locking", "red-dwarf", "cascade-demo"],
    visibility: "public",
    license: "fork_allowed",
    is_example: true,
  },

  entities: [
    // ── Physics ──────────────────────────────────────────────
    {
      name: "Kepri",
      entity_type: "star",
      cascade_stage: "physics",
      color: "#FF6B35",
      summary: "A cool red dwarf star, spectral type M4V.",
      description:
        "Kepri is a red dwarf star with roughly 0.2 solar masses and 0.01 solar luminosities. Its habitable zone orbits at just 0.08 AU, close enough to tidally lock any rocky planet within a few hundred million years. Kepri's frequent flare activity drives the evolution of radiation-resistant biology on Tidelock-7b.",
      tags: ["red-dwarf", "M4V", "flare-star"],
    },
    {
      name: "Tidelock-7b",
      entity_type: "planet",
      cascade_stage: "physics",
      color: "#4D9FFF",
      summary: "A tidally locked rocky world in Kepri's habitable zone.",
      description:
        "Tidelock-7b orbits Kepri at 0.08 AU with a period of 14 Earth days. Tidal locking means one hemisphere permanently faces the star (the Scorchlands) while the other faces away (the Darkside). Between them lies the Twilight Band — a narrow ring of perpetual dusk where temperatures allow liquid water and life.",
      tags: ["tidally-locked", "rocky", "habitable"],
    },

    // ── Environment ──────────────────────────────────────────
    {
      name: "The Twilight Band",
      entity_type: "location",
      cascade_stage: "environment",
      color: "#00D4FF",
      summary: "The narrow habitable zone between eternal day and eternal night.",
      description:
        "A ring approximately 800 km wide circling the terminator line of Tidelock-7b. Perpetual twilight. Temperatures range from 5°C at the dark edge to 35°C at the light edge. Constant winds blow from the Darkside toward the Scorchlands as the atmosphere circulates heat. Most life and all civilization exists here.",
      tags: ["terminator", "habitable-zone", "twilight"],
    },
    {
      name: "The Scorchlands",
      entity_type: "location",
      cascade_stage: "environment",
      color: "#FF3366",
      summary: "The star-facing hemisphere — a molten wasteland.",
      description:
        "The substellar point reaches 400°C. Rock flows as lava within 200 km of the center. The atmosphere here is thin, stripped by Kepri's flares. Nothing survives. Yet the Scorchlands drive the thermal engine that creates the Twilight Band's winds, making them essential to the planet's habitability.",
      tags: ["hostile", "volcanic", "substellar"],
    },

    // ── Biology ──────────────────────────────────────────────
    {
      name: "The Shade-Runners",
      entity_type: "species",
      cascade_stage: "biology",
      color: "#00FF88",
      summary: "The dominant sentient species, evolved for perpetual twilight.",
      description:
        "Bipedal, 1.8m tall, with wide-spectrum eyes adapted to dim light. Their skin contains radiation-resistant melanin that darkens when exposed to flares. They navigate primarily by echolocation in the dimmer regions and by sight near the light-edge. Their metabolism is efficient — evolved under resource scarcity in the narrow habitable band.",
      tags: ["sentient", "echolocation", "radiation-resistant"],
    },
    {
      name: "Thermal Bloom",
      entity_type: "species",
      cascade_stage: "biology",
      color: "#FFB800",
      summary: "Bioluminescent flora that forms the base of the food chain.",
      description:
        "Sessile organisms that harvest both dim starlight and geothermal heat. They glow faintly in the dark — blue near the light-edge, red near the dark-edge. The Shade-Runners cultivate them for food, light, and medicine. Thermal Bloom spore dispersal is driven by the constant terminator winds.",
      tags: ["bioluminescent", "flora", "thermophilic"],
    },

    // ── Psychology ────────────────────────────────────────────
    {
      name: "Dusk Perception",
      entity_type: "concept",
      cascade_stage: "psychology",
      color: "#9B5DE5",
      summary: "The Shade-Runner psychological framework shaped by eternal twilight.",
      description:
        "The Shade-Runners have no concept of 'day' or 'night' as temporal events — only as spatial directions. Walking toward the light is called 'brightward'; walking toward the dark is 'shadeward.' Their emotional spectrum maps onto this axis: hope and ambition are 'brightward feelings,' while fear and introspection are 'shadeward feelings.' Depression is described as 'standing still.'",
      tags: ["spatial-emotion", "perception", "twilight-psychology"],
    },

    // ── Mythology ────────────────────────────────────────────
    {
      name: "The Eternal Noon",
      entity_type: "religion",
      cascade_stage: "mythology",
      color: "#FF00AA",
      summary: "The dominant religion — worship of the unreachable substellar point.",
      description:
        "The Shade-Runners worship Kepri not as a sun that rises and sets, but as a fixed god that burns eternally at the center of the Scorchlands. The substellar point is called 'The Eternal Noon' — a sacred place no living being has ever reached. Pilgrimages go brightward, each step a prayer. The holiest individuals are those who have traveled farthest toward the light and returned.",
      tags: ["solar-worship", "pilgrimage", "sacred-geography"],
    },

    // ── Culture ──────────────────────────────────────────────
    {
      name: "The Meridian Collective",
      entity_type: "faction",
      cascade_stage: "culture",
      color: "#FFB800",
      summary: "The governing body of the Twilight Band settlements.",
      description:
        "A loose confederation of settlement-states arranged along the terminator line. Political power is measured by how much of the Band a faction controls longitudinally. The Collective's capital sits at the 'Midpoint' — the location on the terminator with the most moderate temperature. Disputes are settled by 'shadow walks' — ritual negotiations conducted while walking shadeward.",
      tags: ["government", "confederation", "terminator-politics"],
    },
    {
      name: "Shadow Tongue",
      entity_type: "language",
      cascade_stage: "culture",
      color: "#00FF88",
      summary: "The primary language — uses spatial metaphors for all abstract concepts.",
      description:
        "Shadow Tongue encodes direction into every verb. To 'speak brightward' means to tell an optimistic truth; to 'speak shadeward' means to deliver bad news gently. The language has no past or future tense — only 'brightward time' (planned, hoped for) and 'shadeward time' (remembered, mourned). Written Shadow Tongue is carved into stone that faces different directions to encode emotional context.",
      tags: ["constructed-language", "spatial-grammar", "directional-verbs"],
    },
  ],

  connections: [
    { source_name: "Kepri", target_name: "Tidelock-7b", relationship_type: "illuminates", relationship_label: "Illuminates", cascade_stage: "physics", bidirectional: false, strength: 10 },
    { source_name: "Tidelock-7b", target_name: "The Twilight Band", relationship_type: "terrain_of", relationship_label: "Creates habitable zone", cascade_stage: "environment", bidirectional: false, strength: 9 },
    { source_name: "Tidelock-7b", target_name: "The Scorchlands", relationship_type: "terrain_of", relationship_label: "Star-facing hemisphere", cascade_stage: "environment", bidirectional: false, strength: 8 },
    { source_name: "The Twilight Band", target_name: "The Shade-Runners", relationship_type: "inhabits", relationship_label: "Evolved in twilight", cascade_stage: "biology", bidirectional: false, strength: 9 },
    { source_name: "The Twilight Band", target_name: "Thermal Bloom", relationship_type: "inhabits", relationship_label: "Grows along terminator", cascade_stage: "biology", bidirectional: false, strength: 8 },
    { source_name: "Thermal Bloom", target_name: "The Shade-Runners", relationship_type: "symbiotic_with", relationship_label: "Cultivated for food and light", cascade_stage: "biology", bidirectional: true, strength: 7 },
    { source_name: "The Shade-Runners", target_name: "Dusk Perception", relationship_type: "psychologically_shaped_by", relationship_label: "Twilight shapes cognition", cascade_stage: "psychology", bidirectional: false, strength: 8 },
    { source_name: "The Scorchlands", target_name: "The Eternal Noon", relationship_type: "sacred_to", relationship_label: "Unreachable holy site", cascade_stage: "mythology", bidirectional: false, strength: 9 },
    { source_name: "Dusk Perception", target_name: "The Eternal Noon", relationship_type: "inspired_by", relationship_label: "Awe of the unreachable light", cascade_stage: "mythology", bidirectional: false, strength: 7 },
    { source_name: "The Shade-Runners", target_name: "The Meridian Collective", relationship_type: "founded_by", relationship_label: "Governs the Band", cascade_stage: "culture", bidirectional: false, strength: 8 },
    { source_name: "The Shade-Runners", target_name: "Shadow Tongue", relationship_type: "speaks", relationship_label: "Primary language", cascade_stage: "culture", bidirectional: false, strength: 9 },
    { source_name: "Dusk Perception", target_name: "Shadow Tongue", relationship_type: "psychologically_shaped_by", relationship_label: "Spatial emotions → spatial grammar", cascade_stage: "culture", bidirectional: false, strength: 8 },
  ],

  worksheets: [
    {
      tool_type: "planetary-profile",
      title: "Tidelock-7b Planetary Profile",
      data: {
        stellarEnvironment: {
          starType: "M4V Red Dwarf",
          starTypeNotes: "Cool, low-luminosity, frequent flares. Habitable zone at 0.08 AU.",
          luminosity: "0.01 solar",
          habitableZonePosition: "Inner edge",
          orbitalPeriod: "14 Earth days",
          tidalLocking: "Fully tidally locked",
        },
        physicalCharacteristics: {
          planetaryMass: "0.85 Earth masses",
          planetaryRadius: "0.95 Earth radii",
          surfaceGravity: "0.94g",
          rotationPeriod: "Synchronous (14 days)",
        },
        atmosphere: {
          composition: "Nitrogen-dominant with CO2 and water vapor",
          pressure: "0.9 atm at sea level",
          notes: "Thin on the day side due to stellar wind stripping. Dense circulation patterns from day to night side.",
        },
      },
    },
  ],

  entries: [
    {
      title: "The Brightward Pilgrimage",
      entry_type: "lore",
      content:
        "<p>Every Shade-Runner is expected to make at least one brightward pilgrimage in their lifetime. The journey begins at the shadeward edge of the Twilight Band, where the Thermal Blooms glow red and the air is cold. Pilgrims walk brightward for days, sometimes weeks, passing through increasingly warm and luminous terrain.</p><p>The holiest pilgrims push past the comfortable zone into the scorching margins where the air shimmers and the ground radiates heat. They carry \"shade stones\" — rocks from the dark edge — that they leave as markers. The farthest shade stone marks the pilgrim's spiritual achievement.</p><p>No one has ever reached The Eternal Noon. The theology holds that reaching it would mean becoming one with Kepri — a form of transcendence indistinguishable from death.</p>",
    },
    {
      title: "Shadow Walk Negotiations",
      entry_type: "lore",
      content:
        "<p>When two settlement-states disagree, their leaders conduct a \"shadow walk\" — a negotiation held while walking shadeward together. The logic is elegant: as they walk into increasing darkness, the stakes feel higher and the urge to compromise grows stronger.</p><p>If no agreement is reached by the time they enter true darkness, the negotiation is considered failed, and the matter is escalated to the Meridian Collective's central council. Walking back into the light together after a successful shadow walk is called \"returning bright\" and is celebrated with Thermal Bloom tea ceremonies.</p>",
    },
  ],

  notes: [
    {
      title: "Cascade Flow Notes",
      content: "This world demonstrates the full Environmental Cascade: Kepri (physics) → tidal locking creates the Twilight Band (environment) → species evolve for twilight (biology) → spatial perception replaces temporal (psychology) → pilgrimage toward unreachable light (mythology) → directional language and shadow-walk politics (culture).",
      tags: ["meta", "cascade"],
    },
    {
      title: "Story Hooks",
      content: "1. A pilgrim claims to have reached The Eternal Noon and returned. What did they see? 2. The Thermal Bloom is dying on the dark edge — the Band is shrinking. 3. A Shade-Runner born blind (no echolocation) becomes the greatest shadow walk negotiator because they cannot be intimidated by darkness.",
      tags: ["story-seeds"],
    },
    {
      title: "Open Questions",
      content: "What happens on the dark side? Are there creatures adapted to complete darkness? How does the Meridian Collective handle longitudinal expansion — at some point settlements on opposite sides of the planet are maximally distant. What does Shadow Tongue writing look like when carved into stone facing different directions?",
      tags: ["worldbuilding", "questions"],
    },
  ],
};

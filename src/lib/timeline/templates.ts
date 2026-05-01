// Timeline Tool, Pre-built Template Data (Phase 4)

import type { TrackType, EventType, ImportanceLevel } from "./types";

export type TemplateCategory = "civilization" | "character" | "conflict" | "exploration";

export interface TemplateEvent {
  trackIndex: number;
  name: string;
  eventType: EventType;
  importance: ImportanceLevel;
  shortDescription: string;
  hasDuration: boolean;
  relativeYear: number;
  relativeEndYear?: number;
  parentIndex?: number;
}

export interface TimelineTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: string;
  tracks: { name: string; type: TrackType; color: string }[];
  events: TemplateEvent[];
}

export const TIMELINE_TEMPLATES: TimelineTemplate[] = [
  // ─── 1. Rise and Fall of a Civilization ─────────────────────────────
  {
    id: "rise-and-fall",
    name: "Rise & Fall of a Civilization",
    description:
      "Three-track arc from founding through golden age to collapse. Great for mapping a dominant culture's lifecycle.",
    category: "civilization",
    icon: "TrendingDown",
    tracks: [
      { name: "The Hegemony", type: "civilization", color: "#3b82f6" },
      { name: "Leadership", type: "character", color: "#8b5cf6" },
      { name: "Homeworld", type: "planet", color: "#22c55e" },
    ],
    events: [
      {
        trackIndex: 0,
        name: "Founding of the Hegemony",
        eventType: "founding",
        importance: "epochal",
        shortDescription:
          "Scattered colonies ratify a charter, unifying under a single governing body.",
        hasDuration: false,
        relativeYear: 0,
      },
      {
        trackIndex: 2,
        name: "Homeworld Terraforming Begins",
        eventType: "terraforming_start",
        importance: "major",
        shortDescription:
          "Atmospheric processors are deployed across the capital world's southern hemisphere.",
        hasDuration: true,
        relativeYear: 5,
        relativeEndYear: 80,
      },
      {
        trackIndex: 1,
        name: "First Archon Elected",
        eventType: "custom",
        importance: "major",
        shortDescription:
          "A charismatic war hero becomes the first elected ruler, consolidating political power.",
        hasDuration: false,
        relativeYear: 12,
      },
      {
        trackIndex: 0,
        name: "Expansion Wars",
        eventType: "war",
        importance: "major",
        shortDescription:
          "Three decades of military campaigns double Hegemony territory and bring rival systems into the fold.",
        hasDuration: true,
        relativeYear: 50,
        relativeEndYear: 80,
      },
      {
        trackIndex: 0,
        name: "Golden Age",
        eventType: "custom",
        importance: "epochal",
        shortDescription:
          "Two centuries of peace, technological breakthroughs, and cultural renaissance define the Hegemony's peak.",
        hasDuration: true,
        relativeYear: 100,
        relativeEndYear: 300,
      },
      {
        trackIndex: 1,
        name: "The Tyrant's Ascension",
        eventType: "custom",
        importance: "major",
        shortDescription:
          "A populist leader seizes emergency powers and dismantles democratic institutions.",
        hasDuration: false,
        relativeYear: 310,
      },
      {
        trackIndex: 0,
        name: "The Great Schism",
        eventType: "schism",
        importance: "epochal",
        shortDescription:
          "Outer colonies declare independence, splitting the Hegemony in two.",
        hasDuration: false,
        relativeYear: 350,
      },
      {
        trackIndex: 0,
        name: "Collapse",
        eventType: "collapse",
        importance: "epochal",
        shortDescription:
          "Internal strife, resource depletion, and foreign incursions bring the Hegemony to its knees.",
        hasDuration: false,
        relativeYear: 400,
      },
    ],
  },

  // ─── 2. First Contact Scenario ──────────────────────────────────────
  {
    id: "first-contact",
    name: "First Contact Scenario",
    description:
      "Two species meet for the first time. Track parallel perspectives from pre-contact isolation through first encounter to aftermath.",
    category: "exploration",
    icon: "Eye",
    tracks: [
      { name: "Species Alpha", type: "civilization", color: "#3b82f6" },
      { name: "Species Beta", type: "civilization", color: "#d946ef" },
      { name: "Neutral Zone", type: "system", color: "#eab308" },
    ],
    events: [
      {
        trackIndex: 0,
        name: "Alpha Achieves FTL",
        eventType: "invention",
        importance: "epochal",
        shortDescription:
          "Species Alpha cracks faster-than-light travel, beginning their expansion into nearby star systems.",
        hasDuration: false,
        relativeYear: 0,
      },
      {
        trackIndex: 1,
        name: "Beta Launches Generation Ship",
        eventType: "departure",
        importance: "major",
        shortDescription:
          "Without FTL, Beta sends a massive generation ship toward a promising star system.",
        hasDuration: false,
        relativeYear: 20,
      },
      {
        trackIndex: 2,
        name: "Anomalous Signal Detected",
        eventType: "discovery",
        importance: "major",
        shortDescription:
          "Both species independently detect an artificial signal originating from the same region of space.",
        hasDuration: false,
        relativeYear: 60,
      },
      {
        trackIndex: 0,
        name: "Alpha Expeditionary Fleet Deployed",
        eventType: "voyage",
        importance: "moderate",
        shortDescription:
          "Alpha dispatches a science-military fleet to investigate the signal source.",
        hasDuration: true,
        relativeYear: 65,
        relativeEndYear: 70,
      },
      {
        trackIndex: 2,
        name: "First Contact",
        eventType: "first_contact",
        importance: "epochal",
        shortDescription:
          "Alpha scouts encounter the Beta generation ship in orbit around an unclaimed world. Communication is attempted.",
        hasDuration: false,
        relativeYear: 72,
      },
      {
        trackIndex: 2,
        name: "Misunderstanding Incident",
        eventType: "battle",
        importance: "major",
        shortDescription:
          "A cultural miscommunication escalates into a brief armed skirmish with casualties on both sides.",
        hasDuration: false,
        relativeYear: 73,
      },
      {
        trackIndex: 2,
        name: "Treaty of Shared Stars",
        eventType: "treaty",
        importance: "epochal",
        shortDescription:
          "After months of negotiation, both species sign a landmark treaty establishing diplomatic relations and trade corridors.",
        hasDuration: false,
        relativeYear: 75,
      },
    ],
  },

  // ─── 3. Generational Voyage ─────────────────────────────────────────
  {
    id: "generational-voyage",
    name: "Generational Voyage",
    description:
      "A multi-generation starship journey from departure to arrival. Track the ship, its crew culture, and the destination world.",
    category: "exploration",
    icon: "Rocket",
    tracks: [
      { name: "The Ark", type: "ship", color: "#ef4444" },
      { name: "Crew & Society", type: "organization", color: "#8b5cf6" },
      { name: "Destination", type: "planet", color: "#22c55e" },
    ],
    events: [
      {
        trackIndex: 0,
        name: "Launch from Sol",
        eventType: "departure",
        importance: "epochal",
        shortDescription:
          "The generation ship departs Earth orbit carrying 10,000 colonists in cryogenic and active habitation modules.",
        hasDuration: false,
        relativeYear: 0,
      },
      {
        trackIndex: 1,
        name: "First Generation Born in Transit",
        eventType: "birth",
        importance: "major",
        shortDescription:
          "The first children born entirely in space mark a psychological shift, the ship becomes home, not a vehicle.",
        hasDuration: false,
        relativeYear: 25,
      },
      {
        trackIndex: 0,
        name: "Midpoint Engine Failure",
        eventType: "catastrophe",
        importance: "major",
        shortDescription:
          "A critical drive malfunction forces emergency repairs, adding decades to the journey.",
        hasDuration: false,
        relativeYear: 120,
      },
      {
        trackIndex: 1,
        name: "The Schism of Decks",
        eventType: "schism",
        importance: "major",
        shortDescription:
          "Ideological differences split the crew into Forward (pro-destination) and Rooted (ship-is-home) factions.",
        hasDuration: false,
        relativeYear: 180,
      },
      {
        trackIndex: 1,
        name: "Reunification Accords",
        eventType: "unification",
        importance: "moderate",
        shortDescription:
          "A new generation of leaders negotiates peace between the factions, establishing a shared council.",
        hasDuration: false,
        relativeYear: 220,
      },
      {
        trackIndex: 2,
        name: "Destination System Scanned",
        eventType: "discovery",
        importance: "moderate",
        shortDescription:
          "Long-range probes confirm the target planet is habitable but hosts complex non-sentient life.",
        hasDuration: false,
        relativeYear: 280,
      },
      {
        trackIndex: 0,
        name: "Orbital Insertion",
        eventType: "arrival",
        importance: "epochal",
        shortDescription:
          "After 350 years, the Ark enters orbit around the destination world. A new chapter begins.",
        hasDuration: false,
        relativeYear: 350,
      },
      {
        trackIndex: 2,
        name: "First Landing",
        eventType: "settlement",
        importance: "epochal",
        shortDescription:
          "The first colonists set foot on solid ground, a world none of their ancestors ever saw.",
        hasDuration: false,
        relativeYear: 352,
      },
    ],
  },

  // ─── 4. War & Treaty ────────────────────────────────────────────────
  {
    id: "war-and-treaty",
    name: "War & Treaty",
    description:
      "A conflict arc between two factions, from political tensions through open war to eventual peace. Perfect for military sci-fi.",
    category: "conflict",
    icon: "Swords",
    tracks: [
      { name: "Terran Federation", type: "civilization", color: "#3b82f6" },
      { name: "Outer Rim Alliance", type: "civilization", color: "#ef4444" },
      { name: "Diplomacy & Neutral Parties", type: "organization", color: "#eab308" },
    ],
    events: [
      {
        trackIndex: 0,
        name: "Trade Embargo Declared",
        eventType: "custom",
        importance: "major",
        shortDescription:
          "The Federation imposes punishing tariffs on Outer Rim raw materials, triggering economic crisis.",
        hasDuration: false,
        relativeYear: 0,
      },
      {
        trackIndex: 1,
        name: "Outer Rim Mobilization",
        eventType: "custom",
        importance: "moderate",
        shortDescription:
          "Alliance worlds begin converting civilian infrastructure to wartime production.",
        hasDuration: true,
        relativeYear: 2,
        relativeEndYear: 5,
      },
      {
        trackIndex: 2,
        name: "Failed Mediation Summit",
        eventType: "custom",
        importance: "moderate",
        shortDescription:
          "Neutral powers attempt to broker peace, but hardliners on both sides sabotage negotiations.",
        hasDuration: false,
        relativeYear: 4,
      },
      {
        trackIndex: 0,
        name: "War Declared",
        eventType: "war",
        importance: "epochal",
        shortDescription:
          "The Federation formally declares war after an Outer Rim patrol destroys a border station.",
        hasDuration: true,
        relativeYear: 6,
        relativeEndYear: 18,
      },
      {
        trackIndex: 1,
        name: "Battle of Cygnus Gate",
        eventType: "battle",
        importance: "major",
        shortDescription:
          "The Alliance scores a surprising victory at the strategic Cygnus chokepoint, stalling the Federation advance.",
        hasDuration: false,
        relativeYear: 10,
      },
      {
        trackIndex: 0,
        name: "Siege of New Geneva",
        eventType: "battle",
        importance: "major",
        shortDescription:
          "The Federation's capital comes under orbital bombardment, shocking the civilian population into demanding peace.",
        hasDuration: true,
        relativeYear: 15,
        relativeEndYear: 17,
      },
      {
        trackIndex: 2,
        name: "Armistice Signed",
        eventType: "treaty",
        importance: "epochal",
        shortDescription:
          "War-weary populations on both sides force their leaders to the negotiating table. An armistice takes effect.",
        hasDuration: false,
        relativeYear: 18,
      },
      {
        trackIndex: 2,
        name: "Treaty of Cygnus",
        eventType: "treaty",
        importance: "epochal",
        shortDescription:
          "A comprehensive peace treaty establishes new borders, trade agreements, and a joint peacekeeping force.",
        hasDuration: false,
        relativeYear: 20,
      },
    ],
  },

  // ─── 5. Terraforming Project ────────────────────────────────────────
  {
    id: "terraforming-project",
    name: "Terraforming Project",
    description:
      "Transform a barren world into a habitable one. From initial survey through atmospheric processing to the first open-air settlement.",
    category: "exploration",
    icon: "TreePine",
    tracks: [
      { name: "Planet Kepler-442b", type: "planet", color: "#22c55e" },
      { name: "Colony Operations", type: "organization", color: "#f59e0b" },
    ],
    events: [
      {
        trackIndex: 0,
        name: "Planetary Survey Complete",
        eventType: "discovery",
        importance: "major",
        shortDescription:
          "Robotic probes finish a comprehensive survey: thin CO₂ atmosphere, subsurface water ice, no native life detected.",
        hasDuration: false,
        relativeYear: 0,
      },
      {
        trackIndex: 1,
        name: "Colony Ship Arrives",
        eventType: "arrival",
        importance: "epochal",
        shortDescription:
          "The first colonists arrive and establish a pressurized base camp near the equatorial ice fields.",
        hasDuration: false,
        relativeYear: 5,
      },
      {
        trackIndex: 0,
        name: "Atmospheric Processing Phase I",
        eventType: "terraforming_start",
        importance: "epochal",
        shortDescription:
          "Massive atmospheric processors begin converting CO₂ to breathable oxygen. Expected runtime: centuries.",
        hasDuration: true,
        relativeYear: 10,
        relativeEndYear: 200,
      },
      {
        trackIndex: 1,
        name: "Dome City Founded",
        eventType: "settlement",
        importance: "major",
        shortDescription:
          "The first permanent enclosed city is established, housing 5,000 colonists under geodesic domes.",
        hasDuration: false,
        relativeYear: 30,
      },
      {
        trackIndex: 0,
        name: "First Rainfall",
        eventType: "custom",
        importance: "epochal",
        shortDescription:
          "After a century of atmospheric modification, liquid water falls from the sky for the first time in the planet's history.",
        hasDuration: false,
        relativeYear: 120,
      },
      {
        trackIndex: 0,
        name: "Terraforming Complete",
        eventType: "terraforming_complete",
        importance: "epochal",
        shortDescription:
          "Atmospheric composition reaches breathable levels. Colonists step outside without pressure suits for the first time.",
        hasDuration: false,
        relativeYear: 200,
      },
    ],
  },
];

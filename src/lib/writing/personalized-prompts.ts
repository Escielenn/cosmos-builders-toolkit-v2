/**
 * Personalized prompt generator — creates writing prompts from a world's entities.
 *
 * Takes entity data (planets, species, factions, characters, etc.) and produces
 * 3-5 prompts that reference actual names, types, and relationships.
 */

import type { WritingPrompt, PromptCategory, PromptDifficulty } from "./prompts";

// ---------------------------------------------------------------------------
// Entity shape (minimal — works with WorldEntry from world-data service)
// ---------------------------------------------------------------------------

export interface Entity {
  id: string;
  entry_type: string;
  title: string;
  content?: string | null;
  metadata?: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Template system
// ---------------------------------------------------------------------------

interface PromptTemplate {
  /** Entity types required (at least one of each must be present). */
  requires: string[];
  category: PromptCategory;
  difficulty: PromptDifficulty;
  wordGoal: number;
  /** Returns [title, promptText]. Slots filled by matched entities. */
  build: (entities: Record<string, Entity>) => [string, string];
}

const TEMPLATES: PromptTemplate[] = [
  // ── Single-entity templates ────────────────────────────────────────────

  {
    requires: ["planet"],
    category: "worldbuilding",
    difficulty: "beginner",
    wordGoal: 500,
    build: (e) => [
      `Dawn on ${e.planet.title}`,
      `On ${e.planet.title}, the sun is rising — but nothing about this sunrise is familiar. Describe the first ten minutes of daylight: the color of the sky, the texture of the air, the sounds that begin. Ground every detail in the physics and environment of this world.`,
    ],
  },
  {
    requires: ["planet"],
    category: "scene",
    difficulty: "intermediate",
    wordGoal: 700,
    build: (e) => [
      `Storm Season on ${e.planet.title}`,
      `The worst storm in living memory is about to hit ${e.planet.title}. Write the scene from the perspective of someone who must decide whether to shelter in place or evacuate. What makes this storm unique to this world's physics?`,
    ],
  },
  {
    requires: ["species"],
    category: "character",
    difficulty: "intermediate",
    wordGoal: 600,
    build: (e) => [
      `A Day in the Life of the ${e.species.title}`,
      `Write a single day from the perspective of an ordinary member of the ${e.species.title}. What do they eat? How do they communicate? What do they fear? Reveal their biology and psychology through mundane routine, not exposition.`,
    ],
  },
  {
    requires: ["species"],
    category: "worldbuilding",
    difficulty: "advanced",
    wordGoal: 800,
    build: (e) => [
      `What the ${e.species.title} Cannot Perceive`,
      `The ${e.species.title} have a rich sensory world — but there are things they simply cannot detect. Describe the aspects of their own planet that are invisible to them, and how this blind spot has shaped their science, their myths, and their mistakes.`,
    ],
  },
  {
    requires: ["character"],
    category: "character",
    difficulty: "beginner",
    wordGoal: 450,
    build: (e) => [
      `${e.character.title}'s Secret`,
      `${e.character.title} has been keeping a secret that could change everything. Write the moment they almost reveal it — and pull back. What stops them? What would happen if the truth came out?`,
    ],
  },
  {
    requires: ["faction"],
    category: "dialogue",
    difficulty: "intermediate",
    wordGoal: 700,
    build: (e) => [
      `Inside ${e.faction.title}`,
      `Two members of ${e.faction.title} disagree about the faction's future direction. One wants to hold to tradition; the other sees an opportunity that requires abandoning a core principle. Write the argument.`,
    ],
  },
  {
    requires: ["vessel"],
    category: "scene",
    difficulty: "beginner",
    wordGoal: 500,
    build: (e) => [
      `Aboard the ${e.vessel.title}`,
      `Something is wrong aboard the ${e.vessel.title}, but no one can pinpoint what. The instruments read normal, the crew is healthy, and yet everyone feels it — a wrongness in the hum of the engines. Write the scene when someone finally figures out the cause.`,
    ],
  },
  {
    requires: ["technology"],
    category: "theme",
    difficulty: "intermediate",
    wordGoal: 650,
    build: (e) => [
      `The Consequences of ${e.technology.title}`,
      `When ${e.technology.title} was invented, no one predicted what it would do to daily life three generations later. Write a scene set in that future — where the technology's second- and third-order effects have reshaped society in ways its creators never imagined.`,
    ],
  },
  {
    requires: ["mythology"],
    category: "theme",
    difficulty: "intermediate",
    wordGoal: 600,
    build: (e) => [
      `The Heretic's Version`,
      `The dominant mythology surrounding ${e.mythology.title} is accepted by nearly everyone — except one person who has found evidence that the story is wrong. Write the moment they decide whether to speak or stay silent.`,
    ],
  },
  {
    requires: ["location"],
    category: "scene",
    difficulty: "beginner",
    wordGoal: 500,
    build: (e) => [
      `Return to ${e.location.title}`,
      `A traveler returns to ${e.location.title} after twenty years away. Everything has changed — or has it? Write the walk through a place that is simultaneously familiar and alien, grounding every observation in sensory detail.`,
    ],
  },

  // ── Multi-entity templates ─────────────────────────────────────────────

  {
    requires: ["planet", "species"],
    category: "worldbuilding",
    difficulty: "intermediate",
    wordGoal: 750,
    build: (e) => [
      `How ${e.species.title} Shaped ${e.planet.title}`,
      `The ${e.species.title} have lived on ${e.planet.title} long enough to change it. Describe the ways their biology, agriculture, and industry have altered the planet's surface, atmosphere, or ecosystems — intentionally or not.`,
    ],
  },
  {
    requires: ["species", "species2"],
    category: "dialogue",
    difficulty: "advanced",
    wordGoal: 800,
    build: (e) => [
      `First Words Between Worlds`,
      `The ${e.species.title} and the ${e.species2.title} are meeting for the first time. Neither species communicates the way the other expects. Write the attempt at dialogue — what succeeds, what fails, and what is accidentally communicated.`,
    ],
  },
  {
    requires: ["faction", "faction2"],
    category: "dialogue",
    difficulty: "advanced",
    wordGoal: 850,
    build: (e) => [
      `The ${e.faction.title}–${e.faction2.title} Accord`,
      `${e.faction.title} and ${e.faction2.title} have been enemies for generations. A ceasefire has been called, and representatives meet in neutral territory. Write the negotiation — the tension, the concessions, the thing neither side is willing to say aloud.`,
    ],
  },
  {
    requires: ["character", "faction"],
    category: "scene",
    difficulty: "intermediate",
    wordGoal: 700,
    build: (e) => [
      `${e.character.title}'s Betrayal`,
      `${e.character.title} has been secretly communicating with enemies of ${e.faction.title}. Today, someone found the evidence. Write the confrontation — not just the accusation, but what ${e.character.title} believes they were doing and why.`,
    ],
  },
  {
    requires: ["character", "planet"],
    category: "character",
    difficulty: "beginner",
    wordGoal: 500,
    build: (e) => [
      `${e.character.title} Touches Ground`,
      `${e.character.title} has spent their entire life in space. Today they set foot on ${e.planet.title} for the first time. Write the sensory overwhelm — the wind, the gravity, the smell of soil, the terrifying openness of a sky without walls.`,
    ],
  },
  {
    requires: ["species", "planet"],
    category: "theme",
    difficulty: "advanced",
    wordGoal: 900,
    build: (e) => [
      `When ${e.planet.title} Dies`,
      `${e.planet.title} is dying — slowly, but undeniably. The ${e.species.title} must decide: adapt, migrate, or accept the end. Write the moment the community faces the choice, exploring what it means to lose a homeworld.`,
    ],
  },
  {
    requires: ["artifact"],
    category: "scene",
    difficulty: "intermediate",
    wordGoal: 650,
    build: (e) => [
      `The ${e.artifact.title} Speaks`,
      `After decades of study, someone finally activates ${e.artifact.title}. It does something no one expected. Write the scene in the lab — the anticipation, the activation, and the aftermath.`,
    ],
  },
  {
    requires: ["language"],
    category: "dialogue",
    difficulty: "advanced",
    wordGoal: 800,
    build: (e) => [
      `Untranslatable`,
      `There is a word in ${e.language.title} that has no equivalent in any human language. It describes an emotion, a state of being, or a relationship that humans have never needed to name. Write a scene where a human first encounters this concept.`,
    ],
  },
];

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/** Simple hash for deterministic but varied selection. */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Given a list of world entities, generate 3-5 personalized writing prompts
 * that reference actual entity names, types, and relationships.
 */
export function generatePersonalizedPrompts(entities: Entity[]): WritingPrompt[] {
  if (!entities || entities.length === 0) return [];

  // Group entities by type
  const byType: Record<string, Entity[]> = {};
  for (const entity of entities) {
    const type = entity.entry_type;
    if (!byType[type]) byType[type] = [];
    byType[type].push(entity);
  }

  const results: WritingPrompt[] = [];
  const usedTemplateIndices = new Set<number>();

  // Seed based on entity IDs for deterministic-per-world output
  const seed = simpleHash(entities.map((e) => e.id).sort().join("|"));

  for (let attempt = 0; attempt < TEMPLATES.length && results.length < 5; attempt++) {
    // Walk templates in a seeded order
    const idx = (seed + attempt) % TEMPLATES.length;
    if (usedTemplateIndices.has(idx)) continue;

    const template = TEMPLATES[idx];
    const entitySlots: Record<string, Entity> = {};
    let canFill = true;

    for (const req of template.requires) {
      // Handle numbered duplicates like "species2", "faction2"
      const baseType = req.replace(/\d+$/, "");
      const slotIndex = req !== baseType ? parseInt(req.replace(baseType, ""), 10) - 1 : 0;

      const available = byType[baseType];
      if (!available || available.length <= slotIndex) {
        canFill = false;
        break;
      }
      // Pick a deterministic entity from the available pool
      const pick = available[(seed + slotIndex) % available.length];
      // Ensure we don't pick the same entity for two slots of the same base type
      if (slotIndex > 0) {
        const firstPick = entitySlots[baseType];
        if (firstPick && firstPick.id === pick.id && available.length > 1) {
          entitySlots[req] = available[(seed + slotIndex + 1) % available.length];
          continue;
        }
      }
      entitySlots[req] = pick;
    }

    if (!canFill) continue;

    usedTemplateIndices.add(idx);
    const [title, promptText] = template.build(entitySlots);

    results.push({
      id: `pp-${seed}-${idx}`,
      title,
      prompt: promptText,
      category: template.category,
      difficulty: template.difficulty,
      wordGoal: template.wordGoal,
    });
  }

  return results;
}

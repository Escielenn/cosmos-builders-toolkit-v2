/** Static SF writing prompts — placeholder data until Sanity CMS integration. */

export type PromptCategory = 'worldbuilding' | 'character' | 'scene' | 'dialogue' | 'theme';
export type PromptDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface WritingPrompt {
  id: string;
  title: string;
  prompt: string;
  category: PromptCategory;
  difficulty: PromptDifficulty;
  wordGoal?: number;
}

export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: "wp-001",
    title: "The Last Transmission",
    prompt: "A deep-space relay station receives a signal from a civilization that went extinct 10,000 years ago. The message is a warning. Write the scene where the operator decodes it.",
    category: "scene",
    difficulty: "beginner",
    wordGoal: 500,
  },
  {
    id: "wp-002",
    title: "Gravity's Children",
    prompt: "On a world with three times Earth's gravity, describe how bipedal creatures have evolved differently. What does their architecture look like? How do they move, eat, sleep?",
    category: "worldbuilding",
    difficulty: "intermediate",
    wordGoal: 750,
  },
  {
    id: "wp-003",
    title: "The Translator's Dilemma",
    prompt: "Two species are meeting for the first time. One communicates through bioluminescent patterns, the other through subsonic vibrations. Write the dialogue—including what gets lost in translation.",
    category: "dialogue",
    difficulty: "advanced",
    wordGoal: 800,
  },
  {
    id: "wp-004",
    title: "Terraform Morning",
    prompt: "It's the first sunrise on a newly terraformed world. The atmosphere is breathable but the sky is the wrong color. Describe what a colonist sees stepping outside for the first time.",
    category: "scene",
    difficulty: "beginner",
    wordGoal: 400,
  },
  {
    id: "wp-005",
    title: "The Cartographer's Oath",
    prompt: "In a civilization that has mapped every star within 500 light-years, one region remains deliberately blank on all charts. Write about the person who decides to map it anyway.",
    category: "character",
    difficulty: "intermediate",
    wordGoal: 600,
  },
  {
    id: "wp-006",
    title: "Cascade Failure",
    prompt: "A single environmental change—the extinction of a keystone pollinator—triggers a cascade that reshapes an entire alien ecosystem. Trace the chain of consequences across three generations.",
    category: "worldbuilding",
    difficulty: "advanced",
    wordGoal: 1000,
  },
  {
    id: "wp-007",
    title: "The One Rule",
    prompt: "Your civilization has one law of physics that works differently from ours. What is it, and how has society adapted? Write a scene that reveals this difference through action, not exposition.",
    category: "theme",
    difficulty: "intermediate",
    wordGoal: 600,
  },
  {
    id: "wp-008",
    title: "Homeworld Nostalgia",
    prompt: "A third-generation spacefarer has never set foot on a planet. Write their internal monologue as they watch archived footage of Earth's ocean for the first time.",
    category: "character",
    difficulty: "beginner",
    wordGoal: 500,
  },
  {
    id: "wp-009",
    title: "The Artifact Interview",
    prompt: "Archaeologists have unearthed a device from an alien civilization. It still works, but no one knows what it does. Write the lab report as increasingly strange things happen during testing.",
    category: "scene",
    difficulty: "intermediate",
    wordGoal: 700,
  },
  {
    id: "wp-010",
    title: "Sensory Deprivation",
    prompt: "Describe a world from the perspective of a species that has no vision but perceives reality through echolocation and electromagnetic field detection. What is beautiful to them?",
    category: "worldbuilding",
    difficulty: "advanced",
    wordGoal: 800,
  },
  {
    id: "wp-011",
    title: "The Treaty Clause",
    prompt: "Two interstellar empires are negotiating peace. The sticking point is a single clause about the rights of AI entities. Write the negotiation scene from both sides.",
    category: "dialogue",
    difficulty: "advanced",
    wordGoal: 900,
  },
  {
    id: "wp-012",
    title: "Myths They Tell",
    prompt: "An alien species has a creation myth that is scientifically accurate—they just don't know it yet. Write the myth as an elder tells it to children, then show the scientist who realizes the truth.",
    category: "theme",
    difficulty: "intermediate",
    wordGoal: 700,
  },
  {
    id: "wp-013",
    title: "First Contact Protocol",
    prompt: "You are the linguist on humanity's first contact team. The aliens have been broadcasting a repeating mathematical sequence for decades. Today, they changed it. What happens next?",
    category: "scene",
    difficulty: "beginner",
    wordGoal: 500,
  },
  {
    id: "wp-014",
    title: "The Slow Ship",
    prompt: "A generation ship has been traveling for 400 years. The current generation has developed customs and beliefs that the original crew would find unrecognizable. Describe their daily life.",
    category: "worldbuilding",
    difficulty: "intermediate",
    wordGoal: 750,
  },
  {
    id: "wp-015",
    title: "What We Left Behind",
    prompt: "Write a letter from a colonist to someone they'll never see again on Earth. The colony is thriving, but something fundamental has been lost. What is it?",
    category: "character",
    difficulty: "beginner",
    wordGoal: 400,
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Get today's prompt (deterministic — same for all users on the same day). */
export function getTodaysPrompt(): WritingPrompt {
  const day = getDayOfYear();
  return WRITING_PROMPTS[day % WRITING_PROMPTS.length];
}

/** Look up a prompt by ID. */
export function getPromptById(id: string): WritingPrompt | undefined {
  return WRITING_PROMPTS.find((p) => p.id === id);
}

/** Category display labels. */
export const CATEGORY_LABELS: Record<PromptCategory, string> = {
  worldbuilding: "Worldbuilding",
  character: "Character",
  scene: "Scene",
  dialogue: "Dialogue",
  theme: "Theme",
};

/** Difficulty display labels. */
export const DIFFICULTY_LABELS: Record<PromptDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

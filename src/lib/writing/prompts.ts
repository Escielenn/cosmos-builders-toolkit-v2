/** Static SF writing prompts - placeholder data until Sanity CMS integration. */

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
    prompt: "Two species are meeting for the first time. One communicates through bioluminescent patterns, the other through subsonic vibrations. Write the dialogue, including what gets lost in translation.",
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
    prompt: "A single environmental change - the extinction of a keystone pollinator - triggers a cascade that reshapes an entire alien ecosystem. Trace the chain of consequences across three generations.",
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
    prompt: "An alien species has a creation myth that is scientifically accurate - they just don't know it yet. Write the myth as an elder tells it to children, then show the scientist who realizes the truth.",
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

  // ── Worldbuilding (wp-016 through wp-026) ──────────────────────────────

  {
    id: "wp-016",
    title: "Tidal Lock",
    prompt: "A tidally locked planet has a permanent day side and a permanent night side. Describe the narrow twilight band where most life thrives: the geology, the weather patterns, the way organisms have adapted to eternal dusk.",
    category: "worldbuilding",
    difficulty: "intermediate",
    wordGoal: 700,
  },
  {
    id: "wp-017",
    title: "The Sound of a Binary Sunset",
    prompt: "On a planet orbiting a binary star system, sunset happens twice, and sometimes simultaneously. Describe how the double-shadow phenomenon has shaped the local culture's concept of time, seasons, and ritual.",
    category: "worldbuilding",
    difficulty: "advanced",
    wordGoal: 800,
  },
  {
    id: "wp-018",
    title: "Living Atmosphere",
    prompt: "The atmosphere itself is alive, a diffuse colonial organism spanning the entire sky. How does surface life co-exist with it? What happens when the atmosphere gets hungry?",
    category: "worldbuilding",
    difficulty: "advanced",
    wordGoal: 900,
  },
  {
    id: "wp-019",
    title: "The Dry Ocean",
    prompt: "A world that once had vast oceans lost its water over millions of years. Describe the ocean basins now: what sediment layers remain, what creatures adapted to the slow drying, and what the deepest trench looks like today.",
    category: "worldbuilding",
    difficulty: "intermediate",
    wordGoal: 750,
  },
  {
    id: "wp-020",
    title: "Magnetic Seasons",
    prompt: "A planet's magnetic field flips every thirty years. Describe the ecological upheaval during a flip: species that migrate, species that die, and the one species that has learned to predict it.",
    category: "worldbuilding",
    difficulty: "advanced",
    wordGoal: 850,
  },
  {
    id: "wp-021",
    title: "Megastructure Dawn",
    prompt: "A Dyson swarm is being constructed around your star. From the surface of the innermost planet, describe what the sky looks like as more and more collectors come online over the decades.",
    category: "worldbuilding",
    difficulty: "intermediate",
    wordGoal: 600,
  },
  {
    id: "wp-022",
    title: "Subsurface Eden",
    prompt: "Life on this ice moon exists entirely beneath a frozen crust, warmed by tidal heating. Describe the ecosystem around a hydrothermal vent: the food chain, the light sources, the pressure.",
    category: "worldbuilding",
    difficulty: "beginner",
    wordGoal: 500,
  },
  {
    id: "wp-023",
    title: "The Canopy World",
    prompt: "A world where the surface is uninhabitable due to toxic gas, and all civilization exists in interconnected platforms built in the upper branches of kilometer-tall trees. Describe a typical commute.",
    category: "worldbuilding",
    difficulty: "beginner",
    wordGoal: 500,
  },
  {
    id: "wp-024",
    title: "Radioactive Bloom",
    prompt: "After a nearby supernova bathes the planet in radiation, certain organisms begin to thrive rather than die. Trace the environmental cascade: what adapts, what goes extinct, and what new niches open up.",
    category: "worldbuilding",
    difficulty: "advanced",
    wordGoal: 1000,
  },
  {
    id: "wp-025",
    title: "Pressure Gradient Civilization",
    prompt: "On a super-Earth with extreme atmospheric pressure differences between lowlands and highlands, two civilizations evolved in isolation. One adapted to crushing depths, the other to thin air. Describe the border zone.",
    category: "worldbuilding",
    difficulty: "intermediate",
    wordGoal: 750,
  },
  {
    id: "wp-026",
    title: "Orbital Debris Culture",
    prompt: "A ring of ancient debris orbits the planet, the remains of a moon that was shattered millennia ago. How has this ring influenced the planet's tides, agriculture, mythology, and navigation?",
    category: "worldbuilding",
    difficulty: "intermediate",
    wordGoal: 700,
  },

  // ── Character (wp-027 through wp-035) ──────────────────────────────────

  {
    id: "wp-027",
    title: "The Hive Individualist",
    prompt: "In a eusocial species where individual identity is nearly meaningless, one worker begins to want things for itself. Write its internal experience. How does desire feel to a mind not built for it?",
    category: "character",
    difficulty: "advanced",
    wordGoal: 800,
  },
  {
    id: "wp-028",
    title: "Memory Trader",
    prompt: "A xenobiologist discovers that the alien species she studies can literally trade memories, cutting experiences from their own minds and grafting them into others. She is offered one. Write the scene.",
    category: "character",
    difficulty: "intermediate",
    wordGoal: 600,
  },
  {
    id: "wp-029",
    title: "The Ambassador's Skin",
    prompt: "A human diplomat has been surgically modified to appear as a member of the alien species they represent. After years in the role, they're not sure which species they identify with anymore. Write their journal entry.",
    category: "character",
    difficulty: "intermediate",
    wordGoal: 650,
  },
  {
    id: "wp-030",
    title: "Predator Turned Herbivore",
    prompt: "An alien species has genetically engineered away its predatory instincts over centuries. Write from the perspective of one who discovers old recordings of the hunt, and feels something stir.",
    category: "character",
    difficulty: "intermediate",
    wordGoal: 700,
  },
  {
    id: "wp-031",
    title: "The Gravity Swimmer",
    prompt: "A low-gravity native visits a high-gravity world for the first time. Every step is agony, every breath is labor. Write the character's first day: their physical struggle and psychological determination.",
    category: "character",
    difficulty: "beginner",
    wordGoal: 500,
  },
  {
    id: "wp-032",
    title: "Last of the Long-Lived",
    prompt: "A species that lives for thousands of years is down to its final member. They carry the entire cultural memory of their people. Write the moment they realize no one will remember after them.",
    category: "character",
    difficulty: "advanced",
    wordGoal: 800,
  },
  {
    id: "wp-033",
    title: "The Child Who Sees Dark Matter",
    prompt: "A child born on a deep-space station perceives something the adults cannot: patterns in the void that correspond to dark matter filaments. Write the scene where she tries to explain what she sees.",
    category: "character",
    difficulty: "beginner",
    wordGoal: 450,
  },
  {
    id: "wp-034",
    title: "Symbiont Separation",
    prompt: "Two organisms that have been symbiotic partners for forty years must be separated for medical reasons. Write from both perspectives, the host and the symbiont, as the procedure begins.",
    category: "character",
    difficulty: "advanced",
    wordGoal: 900,
  },
  {
    id: "wp-035",
    title: "Second-Generation Alien",
    prompt: "Born to human parents on an alien world, a teenager has never been to Earth but is expected to act human. Write the moment they realize they feel more kinship with the native species than their own.",
    category: "character",
    difficulty: "beginner",
    wordGoal: 500,
  },

  // ── Scene (wp-036 through wp-044) ──────────────────────────────────────

  {
    id: "wp-036",
    title: "The Gift Exchange",
    prompt: "First contact protocol requires an exchange of gifts. The humans bring a golden record. The aliens bring something that is alive, screaming, and apparently very valuable. Write the ceremony.",
    category: "scene",
    difficulty: "intermediate",
    wordGoal: 700,
  },
  {
    id: "wp-037",
    title: "Silence in the Engine Room",
    prompt: "The ship's drive has been humming for eleven years straight. When it suddenly stops, the silence is the most terrifying thing the crew has ever heard. Write the next sixty seconds.",
    category: "scene",
    difficulty: "beginner",
    wordGoal: 400,
  },
  {
    id: "wp-038",
    title: "Fossilized City",
    prompt: "An expedition discovers a city preserved in volcanic ash on an uninhabited world. The architecture suggests the inhabitants saw the eruption coming and chose not to leave. Write the archaeologist's walk through the central plaza.",
    category: "scene",
    difficulty: "intermediate",
    wordGoal: 750,
  },
  {
    id: "wp-039",
    title: "The Water Reclamation Funeral",
    prompt: "On a desert world where water is sacred, funerals involve reclaiming every drop from the deceased. Write the ceremony for a beloved community leader: the grief, the ritual, the practicality.",
    category: "scene",
    difficulty: "intermediate",
    wordGoal: 700,
  },
  {
    id: "wp-040",
    title: "Gravity Well Rescue",
    prompt: "A ship is caught in a gas giant's gravity well and sinking. The rescue window is twelve minutes. Write the rescue from inside the doomed ship: the physics, the fear, the decisions.",
    category: "scene",
    difficulty: "advanced",
    wordGoal: 900,
  },
  {
    id: "wp-041",
    title: "The Market at the Edge",
    prompt: "A black market operates in the no-man's-land between two hostile empires. Every species you've ever imagined trades here. Describe a single transaction that goes wrong.",
    category: "scene",
    difficulty: "beginner",
    wordGoal: 500,
  },
  {
    id: "wp-042",
    title: "Bioluminescent Storm",
    prompt: "A massive electrical storm on an alien world triggers a planet-wide bioluminescent response. Every organism lights up at once. Write the scene from a hilltop observation post.",
    category: "scene",
    difficulty: "beginner",
    wordGoal: 450,
  },
  {
    id: "wp-043",
    title: "The Quarantine Break",
    prompt: "A biologist inside a Level-5 quarantine facility realizes that the alien organism they are studying has already escaped containment. Three days ago. Write the moment of discovery and the first response.",
    category: "scene",
    difficulty: "advanced",
    wordGoal: 850,
  },
  {
    id: "wp-044",
    title: "Landing on a Living World",
    prompt: "The landing team's boots sink into the ground, and the ground flinches. The entire surface is a single organism. Write the first ten minutes after they realize the planet is alive.",
    category: "scene",
    difficulty: "intermediate",
    wordGoal: 700,
  },

  // ── Dialogue (wp-045 through wp-052) ───────────────────────────────────

  {
    id: "wp-045",
    title: "Chemical Conversation",
    prompt: "A species communicates through pheromone cocktails. A human linguist has built a crude chemical translator. Write their first real conversation: messy, partial, and full of misunderstandings.",
    category: "dialogue",
    difficulty: "advanced",
    wordGoal: 800,
  },
  {
    id: "wp-046",
    title: "The Embargo Debate",
    prompt: "A galactic council debates whether to embargo a pre-spaceflight civilization to protect it or trade with it to accelerate its development. Write the arguments from three different species' perspectives.",
    category: "dialogue",
    difficulty: "advanced",
    wordGoal: 900,
  },
  {
    id: "wp-047",
    title: "Liar's Frequency",
    prompt: "An alien species is physically incapable of lying. Their biology makes deception impossible. Write a trade negotiation between them and a human delegation that they know can lie.",
    category: "dialogue",
    difficulty: "intermediate",
    wordGoal: 700,
  },
  {
    id: "wp-048",
    title: "The Surrender Terms",
    prompt: "Two fleets face each other after a war that has lasted centuries. Neither side can translate the other's concept of 'peace.' Write the negotiation where they try to end the war without a shared word for it.",
    category: "dialogue",
    difficulty: "advanced",
    wordGoal: 850,
  },
  {
    id: "wp-049",
    title: "Parent and Larva",
    prompt: "An alien parent explains death to their offspring, but in this species, death is a metamorphosis into a completely different organism. Write the conversation, revealing the biology through dialogue.",
    category: "dialogue",
    difficulty: "intermediate",
    wordGoal: 600,
  },
  {
    id: "wp-050",
    title: "The Mutiny Vote",
    prompt: "A generation ship crew votes on whether to change course toward a newly discovered habitable world, abandoning their original destination and the promises made to the founders. Write the debate.",
    category: "dialogue",
    difficulty: "intermediate",
    wordGoal: 750,
  },
  {
    id: "wp-051",
    title: "Singing the Law",
    prompt: "In a species where laws are encoded as songs, a young legislator proposes a new law by composing a melody. An elder objects, not to the law, but to the harmony. Write the musical argument.",
    category: "dialogue",
    difficulty: "beginner",
    wordGoal: 500,
  },
  {
    id: "wp-052",
    title: "Time-Delay Diplomacy",
    prompt: "Two civilizations negotiate across a 40-minute light-speed delay. Every message is already obsolete by the time it arrives. Write the exchange as tensions escalate between transmissions.",
    category: "dialogue",
    difficulty: "intermediate",
    wordGoal: 700,
  },

  // ── Theme (wp-053 through wp-062) ──────────────────────────────────────

  {
    id: "wp-053",
    title: "The Identity Ship",
    prompt: "A consciousness is copied across three bodies to survive a journey. When they arrive, all three copies insist they are the original. Write the philosophical crisis. Who is real?",
    category: "theme",
    difficulty: "advanced",
    wordGoal: 800,
  },
  {
    id: "wp-054",
    title: "Alone Between Stars",
    prompt: "The sole crew member of an automated cargo ship has been alone for eighteen months. She talks to the ship's systems, names the stars, and has started leaving notes for herself that she doesn't remember writing. Write a day in her life.",
    category: "theme",
    difficulty: "intermediate",
    wordGoal: 700,
  },
  {
    id: "wp-055",
    title: "Transcendence Tax",
    prompt: "A civilization can upload minds into a digital paradise, but for every mind that ascends, one must stay behind to maintain the hardware. Write about the people who stay.",
    category: "theme",
    difficulty: "advanced",
    wordGoal: 900,
  },
  {
    id: "wp-056",
    title: "The Ethics of Terraforming",
    prompt: "Terraforming a planet will make it habitable for humans but will destroy the existing microbial biosphere, the only other life ever found. Write the ethics committee hearing.",
    category: "theme",
    difficulty: "intermediate",
    wordGoal: 750,
  },
  {
    id: "wp-057",
    title: "A Thousand Years of Tuesday",
    prompt: "A time loop traps a space station in the same 24 hours for what feels like centuries. Write about the person who has lived this day a thousand times: what changes, what doesn't, and what they've learned.",
    category: "theme",
    difficulty: "intermediate",
    wordGoal: 700,
  },
  {
    id: "wp-058",
    title: "The Zoo Hypothesis",
    prompt: "Humanity discovers it has been observed by an advanced civilization for millennia, treated as a nature preserve. Write the moment the 'zookeepers' finally make contact and explain the rules.",
    category: "theme",
    difficulty: "beginner",
    wordGoal: 500,
  },
  {
    id: "wp-059",
    title: "Entropy's Witness",
    prompt: "In the far future, the last intelligent being watches the final stars go dark. Write their meditation on whether existence was worth it. Not as despair, but as honest accounting.",
    category: "theme",
    difficulty: "advanced",
    wordGoal: 800,
  },
  {
    id: "wp-060",
    title: "The Inherited War",
    prompt: "Two species have been at war so long that neither remembers why it started. A historian from each side meets to reconstruct the original cause, and discovers it was a translation error. Write the revelation.",
    category: "theme",
    difficulty: "intermediate",
    wordGoal: 700,
  },
  {
    id: "wp-061",
    title: "Convergent Loneliness",
    prompt: "Two completely unrelated species, separated by thousands of light-years, independently develop the same myth about being alone in the universe. When they finally meet, write what it means to both of them.",
    category: "theme",
    difficulty: "beginner",
    wordGoal: 500,
  },
  {
    id: "wp-062",
    title: "The Moral Weight of Simulation",
    prompt: "A civilization discovers it can simulate entire universes, complete with suffering, conscious beings, and moral complexity. The beings inside don't know they're simulated. Should the simulation keep running? Write the debate.",
    category: "theme",
    difficulty: "advanced",
    wordGoal: 900,
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Get today's prompt (deterministic - same for all users on the same day). */
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

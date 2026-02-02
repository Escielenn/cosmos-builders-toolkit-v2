// Species Interaction Matrix - Data Constants

export const SPECIES_REGISTRY_LIMITS = {
  min: 2,
  max: 6,
};

export const RELATIONSHIP_LEVELS = [
  { value: "symbiotic", label: "Symbiotic", description: "Mutually beneficial, interdependent" },
  { value: "cooperative", label: "Cooperative", description: "Work together when beneficial" },
  { value: "neutral", label: "Neutral", description: "Indifferent, minimal interaction" },
  { value: "competitive", label: "Competitive", description: "Rival for resources or status" },
  { value: "hostile", label: "Hostile", description: "Active conflict or animosity" },
  { value: "predatory", label: "Predatory", description: "One exploits or preys upon the other" },
];

export const PHYSICAL_COMPATIBILITY = {
  environment: [
    { value: "identical", label: "Identical Needs", description: "Same atmosphere, gravity, temperature" },
    { value: "overlapping", label: "Overlapping", description: "Can share some environments with adaptation" },
    { value: "adjacent", label: "Adjacent", description: "Different but can create shared spaces" },
    { value: "incompatible", label: "Incompatible", description: "Cannot share environment without technology" },
    { value: "hostile", label: "Mutually Hostile", description: "One's environment is toxic to the other" },
  ],
  biology: [
    { value: "similar", label: "Similar Biochemistry", description: "Can consume same foods, medicines work" },
    { value: "compatible", label: "Compatible", description: "Some shared biology, some differences" },
    { value: "orthogonal", label: "Orthogonal", description: "Different biochemistry, no overlap" },
    { value: "toxic", label: "Mutually Toxic", description: "Contact can harm one or both" },
    { value: "parasitic", label: "Parasitic Potential", description: "One can parasitize the other" },
  ],
  reproduction: [
    { value: "interfertile", label: "Interfertile", description: "Can produce hybrid offspring" },
    { value: "assisted", label: "Assisted Only", description: "Can reproduce with technological help" },
    { value: "impossible", label: "Impossible", description: "Cannot interbreed at all" },
    { value: "asymmetric", label: "Asymmetric", description: "One direction possible, not the other" },
    { value: "engineered", label: "Engineered Options", description: "Artificial hybrid creation possible" },
  ],
  lifespan: [
    { value: "similar", label: "Similar Lifespans", description: "Live roughly the same length" },
    { value: "2x", label: "2x Difference", description: "One lives twice as long" },
    { value: "10x", label: "10x Difference", description: "One lives ten times as long" },
    { value: "100x", label: "100x+ Difference", description: "Mayfly vs tortoise scale" },
    { value: "immortal-vs-mortal", label: "Immortal vs Mortal", description: "One doesn't age naturally" },
  ],
};

export const COMMUNICATION = {
  language: [
    { value: "shared", label: "Shared Language", description: "Common tongue exists and is used" },
    { value: "translation", label: "Translation Tech", description: "Rely on universal translators" },
    { value: "limited", label: "Limited Exchange", description: "Basic concepts only, nuance lost" },
    { value: "specialists", label: "Specialists Only", description: "Only trained individuals can communicate" },
    { value: "impossible", label: "Impossible Direct", description: "Require intermediary species or AI" },
  ],
  perception: [
    { value: "same", label: "Same Senses", description: "See, hear, feel same things" },
    { value: "overlapping", label: "Overlapping", description: "Some shared, some different senses" },
    { value: "different", label: "Different Primary", description: "Rely on completely different senses" },
    { value: "extended", label: "Extended", description: "One perceives things the other cannot" },
    { value: "alien", label: "Alien Perception", description: "Fundamentally different reality model" },
  ],
  nonverbal: [
    { value: "intuitive", label: "Intuitive", description: "Body language naturally understood" },
    { value: "learned", label: "Learnable", description: "Can be taught with effort" },
    { value: "confusing", label: "Confusing", description: "Same signals mean different things" },
    { value: "invisible", label: "Invisible", description: "One cannot perceive other's cues" },
    { value: "dangerous", label: "Dangerous", description: "Miscommunication risks conflict" },
  ],
  cultural: [
    { value: "familiar", label: "Familiar Concepts", description: "Similar cultural frameworks" },
    { value: "translatable", label: "Translatable", description: "Different but can be explained" },
    { value: "alien", label: "Alien Concepts", description: "Some ideas don't translate at all" },
    { value: "offensive", label: "Mutually Offensive", description: "Core values clash fundamentally" },
    { value: "incomprehensible", label: "Incomprehensible", description: "Cannot understand each other's worldview" },
  ],
};

export const ECONOMIC_RELATIONS = {
  trade: [
    { value: "integrated", label: "Integrated Economies", description: "Fully intertwined economic systems" },
    { value: "active-trade", label: "Active Trade", description: "Regular commerce, distinct systems" },
    { value: "limited-trade", label: "Limited Trade", description: "Specific goods only" },
    { value: "embargo", label: "Embargo", description: "Trade restricted or forbidden" },
    { value: "impossible", label: "Nothing to Trade", description: "No economic complementarity" },
  ],
  resources: [
    { value: "no-overlap", label: "No Overlap", description: "Want different things" },
    { value: "complementary", label: "Complementary", description: "Each has what the other needs" },
    { value: "competitive", label: "Competitive", description: "Want the same scarce things" },
    { value: "dependent", label: "Dependent", description: "One controls what other needs" },
    { value: "exploitative", label: "Exploitative", description: "One extracts from the other" },
  ],
  labor: [
    { value: "integrated", label: "Integrated Workforce", description: "Work together routinely" },
    { value: "specialized", label: "Specialized Roles", description: "Each species does what they're best at" },
    { value: "segregated", label: "Segregated", description: "Work separately, rare overlap" },
    { value: "hierarchy", label: "Hierarchical", description: "One species manages, other labors" },
    { value: "slavery", label: "Slavery/Servitude", description: "One species forced to serve" },
  ],
  dependencies: [
    { value: "independent", label: "Independent", description: "Neither needs the other economically" },
    { value: "mutual", label: "Mutual Dependence", description: "Both need each other equally" },
    { value: "asymmetric", label: "Asymmetric", description: "One depends more than the other" },
    { value: "parasitic", label: "Parasitic", description: "One drains the other's economy" },
    { value: "colonial", label: "Colonial", description: "One extracts wealth from the other's territory" },
  ],
};

export const POLITICAL_RELATIONS = {
  sovereignty: [
    { value: "equal", label: "Equal Sovereignty", description: "Both recognized as autonomous" },
    { value: "federated", label: "Federated", description: "Shared governance structure" },
    { value: "hegemonic", label: "Hegemonic", description: "One dominates politically" },
    { value: "client-state", label: "Client State", description: "One formally subordinate" },
    { value: "occupied", label: "Occupation", description: "One rules the other by force" },
  ],
  alliance: [
    { value: "unified", label: "Unified Front", description: "Act as single political entity externally" },
    { value: "allied", label: "Allied", description: "Mutual defense and cooperation pacts" },
    { value: "non-aligned", label: "Non-Aligned", description: "No formal political ties" },
    { value: "rivals", label: "Rivals", description: "Competing for influence and power" },
    { value: "enemies", label: "Enemies", description: "Active political opposition" },
  ],
  representation: [
    { value: "full", label: "Full Representation", description: "Both have voice in shared governance" },
    { value: "proportional", label: "Proportional", description: "Representation by population or power" },
    { value: "token", label: "Token", description: "Symbolic representation only" },
    { value: "none", label: "No Representation", description: "One excluded from governance" },
    { value: "separate", label: "Separate Systems", description: "Each governs own affairs only" },
  ],
  treaties: [
    { value: "comprehensive", label: "Comprehensive Treaties", description: "Detailed legal framework" },
    { value: "basic", label: "Basic Agreements", description: "Essential rules only" },
    { value: "informal", label: "Informal", description: "Customs and norms, not law" },
    { value: "disputed", label: "Disputed", description: "Conflicting interpretations" },
    { value: "none", label: "No Treaties", description: "Lawless interaction" },
  ],
};

export const CULTURAL_EXCHANGE = {
  adoption: [
    { value: "bidirectional", label: "Bidirectional", description: "Both cultures adopt from each other" },
    { value: "dominant", label: "Dominant Flow", description: "One culture is more influential" },
    { value: "fusion", label: "Fusion", description: "Hybrid culture emerging" },
    { value: "selective", label: "Selective", description: "Adopt technology, reject values" },
    { value: "resistance", label: "Resistance", description: "Active rejection of cultural influence" },
  ],
  mixing: [
    { value: "integrated", label: "Fully Integrated", description: "Live together, intermarry, share spaces" },
    { value: "cosmopolitan", label: "Cosmopolitan Zones", description: "Mixed areas and separate areas" },
    { value: "segregated", label: "Segregated", description: "Live in separate communities" },
    { value: "ghettos", label: "Ghettos", description: "One confined to certain areas" },
    { value: "forbidden", label: "Forbidden", description: "Contact between species prohibited" },
  ],
  attitudes: [
    { value: "celebration", label: "Celebration", description: "Differences valued and celebrated" },
    { value: "tolerance", label: "Tolerance", description: "Differences accepted, not celebrated" },
    { value: "tension", label: "Tension", description: "Friction but coexistence" },
    { value: "discrimination", label: "Discrimination", description: "One group marginalized" },
    { value: "hatred", label: "Hatred", description: "Deep-seated animosity" },
  ],
  hybrid: [
    { value: "valued", label: "Hybrids Valued", description: "Mixed-species individuals celebrated" },
    { value: "accepted", label: "Hybrids Accepted", description: "Treated normally" },
    { value: "marginal", label: "Hybrids Marginal", description: "Don't fit either society" },
    { value: "rejected", label: "Hybrids Rejected", description: "Ostracized by one or both" },
    { value: "impossible", label: "No Hybrids", description: "Cannot produce mixed offspring" },
  ],
};

export const HISTORICAL_CONTEXT = {
  firstContact: [
    { value: "ancient", label: "Ancient Contact", description: "Met in prehistoric times" },
    { value: "historical", label: "Historical", description: "Centuries or millennia ago" },
    { value: "recent", label: "Recent", description: "Within living memory" },
    { value: "ongoing", label: "Ongoing", description: "First contact still happening" },
    { value: "future", label: "Not Yet", description: "Contact hasn't occurred yet" },
  ],
  contactType: [
    { value: "peaceful", label: "Peaceful", description: "First meeting was friendly" },
    { value: "cautious", label: "Cautious", description: "Wary but non-violent" },
    { value: "accidental", label: "Accidental", description: "Unintended encounter" },
    { value: "violent", label: "Violent", description: "First meeting involved conflict" },
    { value: "one-sided", label: "One-Sided", description: "One found the other, not mutual" },
  ],
  conflicts: [
    { value: "none", label: "No Wars", description: "Never engaged in warfare" },
    { value: "ancient-wars", label: "Ancient Wars", description: "Wars in distant past, now peaceful" },
    { value: "recent-wars", label: "Recent Wars", description: "Conflict in living memory" },
    { value: "cold-war", label: "Cold War", description: "Ongoing tension without open warfare" },
    { value: "active-war", label: "Active War", description: "Currently at war" },
  ],
  cooperation: [
    { value: "none", label: "No History", description: "Never worked together" },
    { value: "occasional", label: "Occasional", description: "Rare cooperation when necessary" },
    { value: "regular", label: "Regular", description: "Frequent joint projects" },
    { value: "unified", label: "Unified Efforts", description: "Major shared achievements" },
    { value: "essential", label: "Essential Alliance", description: "Survival depends on cooperation" },
  ],
};

export const TENSION_POINTS = {
  current: [
    { value: "territorial", label: "Territorial Disputes", description: "Conflicting claims to space/resources" },
    { value: "economic", label: "Economic Grievances", description: "Unfair trade, exploitation" },
    { value: "cultural", label: "Cultural Friction", description: "Values and practices clash" },
    { value: "historical", label: "Historical Wounds", description: "Unresolved past conflicts" },
    { value: "religious", label: "Religious Conflict", description: "Spiritual beliefs incompatible" },
    { value: "political", label: "Political Competition", description: "Power struggles" },
    { value: "none", label: "No Major Tensions", description: "Relations are good" },
  ],
  futureRisks: [
    { value: "resource-wars", label: "Resource Wars", description: "Competition for scarce resources" },
    { value: "expansion", label: "Expansion Conflict", description: "Growing populations clash" },
    { value: "ideology", label: "Ideological Conflict", description: "Incompatible worldviews" },
    { value: "technology", label: "Technology Gap", description: "One advances, other falls behind" },
    { value: "intervention", label: "Third Party", description: "External power exploits tensions" },
    { value: "accident", label: "Accidental Escalation", description: "Misunderstanding leads to conflict" },
    { value: "stable", label: "Stable Equilibrium", description: "Low risk of future conflict" },
  ],
};

export const SYNTHESIS_OPTIONS = {
  equilibrium: [
    { value: "stable-harmony", label: "Stable Harmony", description: "Sustainable positive relations" },
    { value: "stable-tension", label: "Stable Tension", description: "Sustainable but uneasy" },
    { value: "unstable-improving", label: "Improving", description: "Getting better over time" },
    { value: "unstable-declining", label: "Declining", description: "Getting worse over time" },
    { value: "volatile", label: "Volatile", description: "Unpredictable, could go either way" },
    { value: "powder-keg", label: "Powder Keg", description: "One spark from explosion" },
  ],
  trajectory: [
    { value: "integration", label: "Toward Integration", description: "Becoming one society" },
    { value: "coexistence", label: "Toward Coexistence", description: "Separate but peaceful" },
    { value: "separation", label: "Toward Separation", description: "Growing apart" },
    { value: "conflict", label: "Toward Conflict", description: "Heading for war" },
    { value: "extinction", label: "Toward Extinction", description: "One or both declining" },
    { value: "transcendence", label: "Toward Transcendence", description: "Beyond current categories" },
  ],
};

export const SF_INTERACTION_EXAMPLES = [
  {
    name: "Human-Vulcan (Star Trek)",
    type: "Cooperative Mentorship",
    description: "Older civilization guides younger, cultural exchange despite physical/emotional differences",
    dynamics: "Mutual respect but persistent misunderstanding, Spock embodies the hybrid tension",
  },
  {
    name: "Human-Heptapod (Arrival)",
    type: "Radically Different Communication",
    description: "Non-linear time perception creates fundamental communication challenge",
    dynamics: "Understanding requires transformation of self, gift-giving contact",
  },
  {
    name: "Human-Prawns (District 9)",
    type: "Failed Integration",
    description: "Refugees treated as unwanted aliens, segregation and exploitation",
    dynamics: "Dehumanization, bureaucratic oppression, transformation forces empathy",
  },
  {
    name: "Humans-Buggers (Ender's Game)",
    type: "Existential Misunderstanding",
    description: "War caused by inability to recognize the other as sentient",
    dynamics: "Genocide born of communication failure, posthumous understanding",
  },
  {
    name: "Human-Klingon (Star Trek)",
    type: "Rival to Ally",
    description: "Former enemies become uneasy allies against common threats",
    dynamics: "Cultural fascination and repulsion, honor-based respect",
  },
  {
    name: "Human-Oankali (Lilith's Brood)",
    type: "Forced Symbiosis",
    description: "Genetic traders merge with humanity, consent is complicated",
    dynamics: "Cannot survive separately, fundamental bodily autonomy questions",
  },
  {
    name: "Human-Moties (The Mote in God's Eye)",
    type: "Dangerous Contact",
    description: "Brilliant species with dark biological secret threatens human space",
    dynamics: "Admiration and fear, containment vs engagement debate",
  },
  {
    name: "Human-Piggies (Speaker for the Dead)",
    type: "Misunderstood Ritual",
    description: "Alien lifecycle makes 'murder' actually honor, devastating misunderstanding",
    dynamics: "Good intentions cause harm, true understanding requires paradigm shift",
  },
];

export const STORY_PROMPT_TEMPLATES = [
  "A member of Species A discovers they have more in common with Species B than their own people",
  "A treaty ceremony goes wrong due to a cultural misunderstanding about [concept]",
  "Children of both species form a friendship that adults cannot understand",
  "An interspecies relationship challenges both societies' assumptions",
  "A shared crisis forces bitter rivals to cooperate",
  "One species discovers the other's darkest secret",
  "A hybrid individual must choose which world they belong to",
  "First contact goes wrong in an unexpected way",
  "An ancient alliance begins to crack under modern pressures",
  "Two species must share a generation ship for centuries",
];

// Empire/Government Designer Data
// Comprehensive options for designing political structures

// Government Types
export const GOVERNMENT_TYPES = [
  {
    id: "democracy",
    name: "Democracy",
    description: "Citizens participate in governance through voting",
    subtypes: [
      { id: "direct", name: "Direct Democracy", description: "Citizens vote on all major decisions" },
      { id: "representative", name: "Representative Democracy", description: "Elected officials make decisions" },
      { id: "constitutional", name: "Constitutional Democracy", description: "Framework limits majority power" },
      { id: "parliamentary", name: "Parliamentary System", description: "Executive from legislature" },
      { id: "presidential", name: "Presidential System", description: "Separate executive election" },
    ],
    consequences: [
      "Requires informed citizenry",
      "Slow decision-making",
      "Legitimacy through consent",
      "Vulnerable to demagoguery",
      "Peaceful power transitions",
    ],
  },
  {
    id: "monarchy",
    name: "Monarchy",
    description: "Hereditary rule by royal family",
    subtypes: [
      { id: "absolute", name: "Absolute Monarchy", description: "Monarch holds all power" },
      { id: "constitutional", name: "Constitutional Monarchy", description: "Ceremonial monarch, elected government" },
      { id: "elective", name: "Elective Monarchy", description: "Monarch chosen by council" },
      { id: "theocratic", name: "Theocratic Monarchy", description: "Divine right to rule" },
    ],
    consequences: [
      "Succession crises possible",
      "Quick decisions",
      "Stability through tradition",
      "Depends on ruler quality",
      "Clear chain of command",
    ],
  },
  {
    id: "oligarchy",
    name: "Oligarchy",
    description: "Rule by a small elite group",
    subtypes: [
      { id: "aristocracy", name: "Aristocracy", description: "Hereditary noble class" },
      { id: "plutocracy", name: "Plutocracy", description: "Rule by the wealthy" },
      { id: "meritocracy", name: "Meritocracy", description: "Rule by the competent" },
      { id: "technocracy", name: "Technocracy", description: "Rule by technical experts" },
      { id: "gerontocracy", name: "Gerontocracy", description: "Rule by elders" },
    ],
    consequences: [
      "Elite interests prioritized",
      "Efficient coordination",
      "Limited social mobility",
      "Internal power struggles",
      "Concentrated expertise",
    ],
  },
  {
    id: "dictatorship",
    name: "Dictatorship/Autocracy",
    description: "Rule by a single individual with absolute power",
    subtypes: [
      { id: "military", name: "Military Dictatorship", description: "Military leader in power" },
      { id: "civilian", name: "Civilian Dictatorship", description: "Non-military strongman" },
      { id: "totalitarian", name: "Totalitarian Regime", description: "Controls all aspects of life" },
      { id: "benevolent", name: "Benevolent Dictatorship", description: "Autocrat acts in public interest" },
    ],
    consequences: [
      "Rapid decision-making",
      "Unstable succession",
      "Suppression of dissent",
      "Efficiency vs. legitimacy",
      "Cult of personality",
    ],
  },
  {
    id: "theocracy",
    name: "Theocracy",
    description: "Rule by religious authority",
    subtypes: [
      { id: "clerical", name: "Clerical Theocracy", description: "Priests hold political power" },
      { id: "divine-king", name: "Divine Kingship", description: "Ruler is god or god's voice" },
      { id: "council", name: "Religious Council", description: "Multiple religious leaders" },
    ],
    consequences: [
      "Law and morality unified",
      "Dissent is heresy",
      "Strong social cohesion",
      "Resistance to change",
      "Persecution of non-believers",
    ],
  },
  {
    id: "republic",
    name: "Republic",
    description: "Government without monarchy, various forms",
    subtypes: [
      { id: "federal", name: "Federal Republic", description: "Power divided between levels" },
      { id: "unitary", name: "Unitary Republic", description: "Centralized power" },
      { id: "corporate", name: "Corporate Republic", description: "Business entities hold power" },
      { id: "soviet", name: "Council Republic", description: "Local councils form hierarchy" },
    ],
    consequences: [
      "No hereditary rule",
      "Various power structures",
      "Citizen involvement varies",
      "Written constitutions common",
    ],
  },
  {
    id: "confederation",
    name: "Confederation",
    description: "Loose alliance of sovereign states",
    subtypes: [
      { id: "military", name: "Military Alliance", description: "Defense cooperation" },
      { id: "economic", name: "Economic Union", description: "Trade and commerce focus" },
      { id: "cultural", name: "Cultural Confederation", description: "Shared heritage binding" },
    ],
    consequences: [
      "Weak central authority",
      "Member state autonomy",
      "Difficult coordination",
      "Can dissolve easily",
      "Diverse internal policies",
    ],
  },
  {
    id: "anarchy",
    name: "Anarchy/Stateless",
    description: "No formal government structure",
    subtypes: [
      { id: "anarcho-communism", name: "Anarcho-Communism", description: "Communal ownership, no state" },
      { id: "anarcho-capitalism", name: "Anarcho-Capitalism", description: "Pure market, no state" },
      { id: "tribal", name: "Tribal/Clan System", description: "Kinship-based organization" },
    ],
    consequences: [
      "Maximum individual freedom",
      "No centralized services",
      "Emergent power structures",
      "Vulnerable to external threats",
      "Local solutions to problems",
    ],
  },
  {
    id: "hive-mind",
    name: "Hive Mind/Collective",
    description: "Unified consciousness governance",
    subtypes: [
      { id: "biological", name: "Biological Collective", description: "Shared neural network" },
      { id: "technological", name: "Technological Collective", description: "AI-mediated consensus" },
      { id: "psychic", name: "Psychic Gestalt", description: "Telepathic unity" },
    ],
    consequences: [
      "Perfect coordination",
      "No internal conflict",
      "Loss of individuality",
      "Alien to individual minds",
      "Rapid adaptation",
    ],
  },
  {
    id: "ai-governance",
    name: "AI Governance",
    description: "Artificial intelligence makes decisions",
    subtypes: [
      { id: "advisory", name: "AI Advisory", description: "AI advises human leaders" },
      { id: "administrative", name: "AI Administration", description: "AI handles bureaucracy" },
      { id: "sovereign", name: "AI Sovereign", description: "AI makes all decisions" },
    ],
    consequences: [
      "Potentially optimal decisions",
      "Questions of values/goals",
      "Alienation from governance",
      "Efficiency vs. humanity",
      "Single point of failure",
    ],
  },
];

// Legitimacy Sources
export const LEGITIMACY_SOURCES = [
  { id: "tradition", name: "Tradition", description: "Always been this way" },
  { id: "divine", name: "Divine Right", description: "God(s) chose the rulers" },
  { id: "consent", name: "Consent of Governed", description: "People agree to be ruled" },
  { id: "conquest", name: "Right of Conquest", description: "Power through victory" },
  { id: "performance", name: "Performance", description: "Results justify rule" },
  { id: "expertise", name: "Expertise", description: "Most qualified should rule" },
  { id: "heredity", name: "Bloodline", description: "Born to rule" },
  { id: "revolution", name: "Revolutionary", description: "Overthrew previous regime" },
  { id: "prophecy", name: "Prophecy", description: "Destined to rule" },
];

// Power Structure Elements
export const POWER_BRANCHES = [
  { id: "executive", name: "Executive", description: "Enforces laws, leads state" },
  { id: "legislative", name: "Legislative", description: "Makes laws" },
  { id: "judicial", name: "Judicial", description: "Interprets laws, resolves disputes" },
  { id: "military", name: "Military", description: "Defense and warfare" },
  { id: "religious", name: "Religious", description: "Spiritual authority" },
  { id: "economic", name: "Economic", description: "Controls resources and trade" },
  { id: "intelligence", name: "Intelligence", description: "Information and security" },
  { id: "bureaucratic", name: "Bureaucratic", description: "Administration and records" },
];

// Succession Methods
export const SUCCESSION_METHODS = [
  { id: "hereditary-primogeniture", name: "Primogeniture", description: "Eldest child inherits" },
  { id: "hereditary-ultimogeniture", name: "Ultimogeniture", description: "Youngest child inherits" },
  { id: "hereditary-tanistry", name: "Tanistry", description: "Most capable family member" },
  { id: "election-popular", name: "Popular Election", description: "Citizens vote" },
  { id: "election-elite", name: "Elite Election", description: "Nobles/council choose" },
  { id: "appointment", name: "Appointment", description: "Predecessor names successor" },
  { id: "merit-exam", name: "Examination", description: "Tests determine leader" },
  { id: "combat", name: "Trial by Combat", description: "Strongest rules" },
  { id: "lottery", name: "Lottery", description: "Random selection" },
  { id: "consensus", name: "Consensus", description: "Agreement of all parties" },
];

// Territory Scale
export const TERRITORY_SCALES = [
  { id: "city-state", name: "City-State", description: "Single city and surroundings" },
  { id: "regional", name: "Regional Power", description: "Multiple cities, one region" },
  { id: "nation", name: "Nation-State", description: "Large territory, one people" },
  { id: "empire", name: "Empire", description: "Multiple peoples, vast territory" },
  { id: "interplanetary", name: "Interplanetary", description: "Multiple worlds, one system" },
  { id: "interstellar", name: "Interstellar", description: "Multiple star systems" },
  { id: "galactic", name: "Galactic", description: "Significant portion of galaxy" },
  { id: "intergalactic", name: "Intergalactic", description: "Multiple galaxies" },
];

// Economic Systems
export const ECONOMIC_SYSTEMS = [
  { id: "capitalism", name: "Capitalism", description: "Private ownership, market economy" },
  { id: "socialism", name: "Socialism", description: "Social ownership of production" },
  { id: "communism", name: "Communism", description: "Communal ownership, no private property" },
  { id: "feudalism", name: "Feudalism", description: "Land-based hierarchy, service obligations" },
  { id: "mercantilism", name: "Mercantilism", description: "State-directed trade for power" },
  { id: "mixed", name: "Mixed Economy", description: "Combination of systems" },
  { id: "post-scarcity", name: "Post-Scarcity", description: "Abundant resources for all" },
  { id: "command", name: "Command Economy", description: "State controls all production" },
  { id: "gift", name: "Gift Economy", description: "Status through giving" },
  { id: "barter", name: "Barter System", description: "Direct exchange of goods" },
];

// Military Doctrine
export const MILITARY_DOCTRINES = [
  { id: "defensive", name: "Defensive", description: "Protect borders, avoid wars" },
  { id: "expansionist", name: "Expansionist", description: "Actively seek new territory" },
  { id: "deterrent", name: "Deterrent", description: "Maintain peace through strength" },
  { id: "guerrilla", name: "Guerrilla", description: "Asymmetric, insurgent tactics" },
  { id: "total-war", name: "Total War", description: "Mobilize entire society" },
  { id: "professional", name: "Professional Army", description: "Small, elite standing force" },
  { id: "conscript", name: "Conscript Army", description: "Mandatory service" },
  { id: "mercenary", name: "Mercenary", description: "Hired soldiers" },
  { id: "pacifist", name: "Pacifist", description: "Minimal or no military" },
];

// Cultural Values
export const CULTURAL_VALUES = [
  { id: "honor", name: "Honor/Glory", description: "Reputation and martial valor" },
  { id: "duty", name: "Duty/Obligation", description: "Service to collective" },
  { id: "freedom", name: "Freedom/Liberty", description: "Individual autonomy" },
  { id: "order", name: "Order/Stability", description: "Predictability and control" },
  { id: "progress", name: "Progress/Innovation", description: "Change and advancement" },
  { id: "tradition", name: "Tradition/Heritage", description: "Preserving the past" },
  { id: "piety", name: "Piety/Devotion", description: "Religious adherence" },
  { id: "wealth", name: "Wealth/Prosperity", description: "Material success" },
  { id: "knowledge", name: "Knowledge/Wisdom", description: "Learning and understanding" },
  { id: "harmony", name: "Harmony/Balance", description: "Equilibrium in all things" },
  { id: "strength", name: "Strength/Power", description: "Dominance and capability" },
  { id: "justice", name: "Justice/Fairness", description: "Equitable treatment" },
];

// Faction Types
export const FACTION_TYPES = [
  { id: "reformist", name: "Reformists", description: "Want gradual change within system" },
  { id: "conservative", name: "Conservatives", description: "Preserve current order" },
  { id: "revolutionary", name: "Revolutionaries", description: "Overthrow current system" },
  { id: "separatist", name: "Separatists", description: "Want independence" },
  { id: "expansionist", name: "Expansionists", description: "Want territorial growth" },
  { id: "isolationist", name: "Isolationists", description: "Avoid foreign entanglement" },
  { id: "religious", name: "Religious Faction", description: "Push theological agenda" },
  { id: "military", name: "Military Faction", description: "Military interests first" },
  { id: "merchant", name: "Merchant/Trade Faction", description: "Commercial interests" },
  { id: "populist", name: "Populists", description: "Appeal to common people" },
  { id: "technocrat", name: "Technocrats", description: "Expert-led governance" },
];

// External Relations
export const DIPLOMATIC_STANCES = [
  { id: "hegemonic", name: "Hegemonic", description: "Seeks to dominate neighbors" },
  { id: "cooperative", name: "Cooperative", description: "Prefers alliances and trade" },
  { id: "isolationist", name: "Isolationist", description: "Minimal foreign contact" },
  { id: "missionary", name: "Missionary", description: "Spread ideology/religion" },
  { id: "opportunistic", name: "Opportunistic", description: "Acts on circumstances" },
  { id: "defensive-alliance", name: "Defensive Alliance", description: "Mutual defense pacts" },
  { id: "tributary", name: "Tributary", description: "Subordinate to greater power" },
  { id: "neutral", name: "Neutral", description: "Refuses to take sides" },
];

// Stability Factors
export const STABILITY_FACTORS = {
  strengths: [
    "Strong economy",
    "Popular legitimacy",
    "Effective military",
    "Cultural unity",
    "Competent leadership",
    "Geographic advantages",
    "Technological superiority",
    "Religious cohesion",
    "Efficient bureaucracy",
    "Strong institutions",
  ],
  vulnerabilities: [
    "Economic inequality",
    "Succession crisis",
    "Military overreach",
    "Cultural divisions",
    "Corrupt leadership",
    "Geographic weakness",
    "Technological lag",
    "Religious conflict",
    "Bureaucratic decay",
    "Weak institutions",
  ],
};

// SF Examples
export const SF_EMPIRE_EXAMPLES = [
  {
    name: "Galactic Empire (Star Wars)",
    type: "Military Dictatorship",
    description: "Centralized authoritarian rule through fear and military might",
    notable: "Shows how democracies can fall to autocracy through crisis exploitation",
  },
  {
    name: "United Federation of Planets (Star Trek)",
    type: "Federal Republic",
    description: "Voluntary federation of diverse species with democratic governance",
    notable: "Explores post-scarcity governance and multi-species diplomacy",
  },
  {
    name: "The Imperium of Man (Warhammer 40K)",
    type: "Theocratic Empire",
    description: "Vast, decaying empire held together by religious fervor",
    notable: "Shows how size and ideology can prevent adaptation",
  },
  {
    name: "The Culture (Iain M. Banks)",
    type: "Post-Scarcity Anarchy",
    description: "AI-assisted anarchist utopia with no formal government",
    notable: "Explores governance without scarcity or need",
  },
  {
    name: "Dune Imperium",
    type: "Feudal Empire",
    description: "Great Houses controlling planets under nominal Emperor",
    notable: "Medieval-style politics in spacefaring civilization",
  },
  {
    name: "Foundation (Asimov)",
    type: "Evolving Systems",
    description: "Multiple government forms over centuries",
    notable: "Shows political evolution over long time scales",
  },
  {
    name: "Covenant (Halo)",
    type: "Theocratic Confederation",
    description: "Religious alliance of multiple species",
    notable: "Inter-species hierarchy based on religious doctrine",
  },
  {
    name: "Systems Alliance (Mass Effect)",
    type: "Parliamentary Democracy",
    description: "Human government within galactic community",
    notable: "Balancing internal democracy with external threats",
  },
];

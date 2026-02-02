// Technology Consequences Map - Data Constants

export const TECHNOLOGY_CATEGORIES = [
  { value: "energy", label: "Energy & Power", description: "Fusion, antimatter, zero-point, dyson structures" },
  { value: "propulsion", label: "Propulsion & Transportation", description: "FTL, sublight drives, teleportation" },
  { value: "communication", label: "Communication & Information", description: "Ansible, quantum entanglement, neural networks" },
  { value: "biotechnology", label: "Biotechnology & Medicine", description: "Genetic engineering, life extension, cloning" },
  { value: "materials", label: "Materials & Manufacturing", description: "Nanofabrication, metamaterials, programmable matter" },
  { value: "computing", label: "Computing & AI", description: "Artificial intelligence, quantum computing, uploads" },
  { value: "weapons", label: "Weapons & Defense", description: "Directed energy, kinetics, planetary defense" },
  { value: "environment", label: "Environmental Control", description: "Terraforming, weather control, ecosystem engineering" },
  { value: "social", label: "Social Technologies", description: "Governance systems, economic tools, surveillance" },
  { value: "other", label: "Other / Hybrid", description: "Technologies that don't fit standard categories" },
];

export const TECHNOLOGY_MATURITY = [
  { value: "theoretical", label: "Theoretical", description: "Exists only in theory, not yet demonstrated" },
  { value: "experimental", label: "Experimental", description: "Laboratory demonstrations, unreliable" },
  { value: "prototype", label: "Prototype", description: "Working models, expensive and limited" },
  { value: "early-adoption", label: "Early Adoption", description: "Available to wealthy/military, improving rapidly" },
  { value: "mainstream", label: "Mainstream", description: "Widely available, reliable, commoditized" },
  { value: "mature", label: "Mature/Ubiquitous", description: "Background technology, taken for granted" },
  { value: "declining", label: "Declining", description: "Being replaced by newer technologies" },
  { value: "legacy", label: "Legacy/Abandoned", description: "No longer developed, maintained only" },
];

export const ACCESS_LEVELS = [
  { value: "universal", label: "Universal Access", description: "Available to everyone, often free" },
  { value: "commercial", label: "Commercial", description: "Purchasable by individuals or businesses" },
  { value: "licensed", label: "Licensed/Regulated", description: "Requires permits, training, or approval" },
  { value: "institutional", label: "Institutional Only", description: "Governments, corporations, universities" },
  { value: "military", label: "Military/Security", description: "Restricted to armed forces and agencies" },
  { value: "elite", label: "Elite/Wealthy", description: "Only the very rich can afford it" },
  { value: "forbidden", label: "Forbidden", description: "Illegal, black market only" },
  { value: "secret", label: "Secret", description: "Existence not publicly known" },
];

export const PHYSICAL_CONSEQUENCES = {
  infrastructure: [
    { value: "minimal", label: "Minimal", description: "No new infrastructure required" },
    { value: "retrofit", label: "Retrofit Existing", description: "Adapts to current infrastructure" },
    { value: "parallel", label: "Parallel Systems", description: "New infrastructure alongside old" },
    { value: "replacement", label: "Total Replacement", description: "Requires complete infrastructure overhaul" },
    { value: "distributed", label: "Distributed", description: "Enables decentralized infrastructure" },
    { value: "megastructure", label: "Megastructure", description: "Requires massive construction projects" },
  ],
  environment: [
    { value: "clean", label: "Clean/Beneficial", description: "Reduces environmental impact" },
    { value: "neutral", label: "Neutral", description: "No significant environmental effect" },
    { value: "localized", label: "Localized Impact", description: "Environmental effects contained to area" },
    { value: "regional", label: "Regional Impact", description: "Affects ecosystems across regions" },
    { value: "global", label: "Global Impact", description: "Planet-wide environmental consequences" },
    { value: "catastrophic", label: "Potentially Catastrophic", description: "Could cause irreversible damage" },
  ],
  resources: [
    { value: "abundant", label: "Enables Abundance", description: "Makes resources plentiful" },
    { value: "efficient", label: "More Efficient", description: "Better use of existing resources" },
    { value: "substitution", label: "Resource Substitution", description: "Replaces scarce with common resources" },
    { value: "rare-input", label: "Requires Rare Inputs", description: "Depends on scarce materials" },
    { value: "extractive", label: "Resource Intensive", description: "High consumption of resources" },
    { value: "depleting", label: "Depleting", description: "Accelerates resource exhaustion" },
  ],
};

export const ECONOMIC_CONSEQUENCES = {
  industries: [
    { value: "creates", label: "Creates New Industries", description: "Entirely new sectors emerge" },
    { value: "transforms", label: "Transforms Existing", description: "Current industries adapt and change" },
    { value: "obsoletes", label: "Obsoletes Industries", description: "Makes entire sectors irrelevant" },
    { value: "consolidates", label: "Consolidates", description: "Merges multiple industries" },
    { value: "fragments", label: "Fragments", description: "Breaks industries into niches" },
    { value: "minimal", label: "Minimal Disruption", description: "Industries continue largely unchanged" },
  ],
  employment: [
    { value: "creates-skilled", label: "Creates Skilled Jobs", description: "New high-skill employment" },
    { value: "creates-mixed", label: "Creates Mixed Jobs", description: "Jobs across skill levels" },
    { value: "displaces-gradual", label: "Gradual Displacement", description: "Slow reduction in jobs" },
    { value: "displaces-rapid", label: "Rapid Displacement", description: "Quick, massive job losses" },
    { value: "transforms-roles", label: "Transforms Roles", description: "Same jobs, different skills" },
    { value: "post-labor", label: "Post-Labor", description: "Eliminates need for most human work" },
  ],
  wealth: [
    { value: "equalizing", label: "Equalizing", description: "Reduces wealth inequality" },
    { value: "neutral", label: "Neutral", description: "Maintains current distribution" },
    { value: "concentrating", label: "Concentrating", description: "Wealth flows to fewer hands" },
    { value: "new-elites", label: "Creates New Elites", description: "New class of wealthy emerges" },
    { value: "volatile", label: "Volatile", description: "Rapid shifts in who holds wealth" },
    { value: "post-scarcity", label: "Post-Scarcity", description: "Wealth becomes meaningless" },
  ],
};

export const SOCIAL_CONSEQUENCES = {
  class: [
    { value: "dissolves", label: "Dissolves Distinctions", description: "Class boundaries blur" },
    { value: "reinforces", label: "Reinforces Existing", description: "Strengthens current hierarchy" },
    { value: "inverts", label: "Inverts Hierarchy", description: "Former lower class rises" },
    { value: "new-axis", label: "New Class Axis", description: "Different basis for stratification" },
    { value: "splits", label: "Splits Classes", description: "Divides groups into sub-classes" },
    { value: "complex", label: "Complex Stratification", description: "Multiple overlapping hierarchies" },
  ],
  family: [
    { value: "traditional", label: "Supports Traditional", description: "Reinforces nuclear/extended family" },
    { value: "optional", label: "Makes Optional", description: "Family becomes lifestyle choice" },
    { value: "redefines", label: "Redefines Family", description: "New family structures emerge" },
    { value: "disperses", label: "Disperses Families", description: "Physical separation normalized" },
    { value: "extends", label: "Extends Families", description: "Multi-generational cohabitation" },
    { value: "obsoletes", label: "Obsoletes Traditional", description: "Family as we know it disappears" },
  ],
  community: [
    { value: "strengthens-local", label: "Strengthens Local", description: "More connected neighborhoods" },
    { value: "enables-virtual", label: "Enables Virtual", description: "Online communities flourish" },
    { value: "isolates", label: "Isolates Individuals", description: "Less need for community" },
    { value: "global-tribes", label: "Global Tribes", description: "Interest-based worldwide groups" },
    { value: "forced-proximity", label: "Forced Proximity", description: "Technology requires clustering" },
    { value: "hybrid", label: "Hybrid Communities", description: "Mix of physical and virtual" },
  ],
  identity: [
    { value: "reinforces", label: "Reinforces Identity", description: "Strengthens cultural/personal identity" },
    { value: "fragments", label: "Fragments Identity", description: "Multiple fluid identities" },
    { value: "expands", label: "Expands Options", description: "More ways to define self" },
    { value: "homogenizes", label: "Homogenizes", description: "Cultural convergence" },
    { value: "transcends", label: "Transcends Biology", description: "Identity separate from body" },
    { value: "questions", label: "Questions Fundamentals", description: "What does 'human' mean?" },
  ],
};

export const POLITICAL_CONSEQUENCES = {
  power: [
    { value: "democratizes", label: "Democratizes Power", description: "Power distributed to many" },
    { value: "centralizes", label: "Centralizes Power", description: "Power flows to few actors" },
    { value: "shifts-lateral", label: "Lateral Shift", description: "Power moves between equal groups" },
    { value: "new-actors", label: "Creates New Actors", description: "Previously powerless gain influence" },
    { value: "fragments", label: "Fragments Power", description: "No one holds decisive power" },
    { value: "transcends", label: "Transcends Politics", description: "Makes political power irrelevant" },
  ],
  surveillance: [
    { value: "enables-mass", label: "Enables Mass Surveillance", description: "States can monitor everyone" },
    { value: "enables-resistance", label: "Enables Resistance", description: "Harder to surveil, easier to hide" },
    { value: "mutual", label: "Mutual Transparency", description: "Everyone can watch everyone" },
    { value: "asymmetric", label: "Asymmetric", description: "Some watch, others are watched" },
    { value: "makes-irrelevant", label: "Makes Irrelevant", description: "Nothing to hide, surveillance pointless" },
    { value: "cat-mouse", label: "Cat and Mouse", description: "Constant surveillance/privacy arms race" },
  ],
  governance: [
    { value: "empowers-state", label: "Empowers State", description: "Government capabilities expand" },
    { value: "empowers-corporate", label: "Empowers Corporations", description: "Private sector gains influence" },
    { value: "empowers-citizens", label: "Empowers Citizens", description: "Individual agency increases" },
    { value: "requires-global", label: "Requires Global Governance", description: "Only international bodies can regulate" },
    { value: "enables-local", label: "Enables Local Autonomy", description: "Small communities can self-govern" },
    { value: "ungovernable", label: "Makes Ungovernable", description: "Technology defies regulation" },
  ],
};

export const MILITARY_CONSEQUENCES = {
  warfare: [
    { value: "obsoletes-war", label: "Obsoletes Warfare", description: "Makes traditional war pointless" },
    { value: "asymmetric", label: "Enables Asymmetric", description: "Small actors threaten large ones" },
    { value: "decisive", label: "Decisive Advantage", description: "First adopter wins decisively" },
    { value: "mutual-destruction", label: "Mutual Destruction", description: "Everyone loses if used" },
    { value: "constant-conflict", label: "Constant Low Conflict", description: "Perpetual small-scale warfare" },
    { value: "new-domains", label: "New Domains", description: "Warfare in new arenas (space, cyber, etc.)" },
  ],
  defense: [
    { value: "offense-dominant", label: "Offense Dominant", description: "Attacking easier than defending" },
    { value: "defense-dominant", label: "Defense Dominant", description: "Defending easier than attacking" },
    { value: "balanced", label: "Balanced", description: "Neither side has clear advantage" },
    { value: "irrelevant", label: "Defense Irrelevant", description: "No effective defense possible" },
    { value: "total-defense", label: "Total Defense", description: "Complete protection possible" },
    { value: "dynamic", label: "Dynamic Balance", description: "Advantage shifts constantly" },
  ],
  deterrence: [
    { value: "strengthens-mad", label: "Strengthens MAD", description: "Mutual assured destruction works" },
    { value: "undermines-deterrence", label: "Undermines Deterrence", description: "Deterrence becomes unreliable" },
    { value: "new-deterrence", label: "New Forms of Deterrence", description: "Different basis for preventing conflict" },
    { value: "first-strike", label: "First Strike Temptation", description: "Advantage to striking first" },
    { value: "no-deterrence", label: "No Deterrence Needed", description: "Conflict motivation disappears" },
    { value: "complex-deterrence", label: "Complex Web", description: "Multiple interlocking deterrence systems" },
  ],
};

export const PSYCHOLOGICAL_CONSEQUENCES = {
  perception: [
    { value: "expands", label: "Expands Perception", description: "See more, sense more" },
    { value: "filters", label: "Filters Reality", description: "Mediated experience of world" },
    { value: "overwhelms", label: "Overwhelms Senses", description: "Too much information" },
    { value: "splits", label: "Splits Realities", description: "Multiple simultaneous experiences" },
    { value: "transcends", label: "Transcends Human", description: "Non-human modes of perception" },
    { value: "unchanged", label: "Largely Unchanged", description: "Human perception remains similar" },
  ],
  values: [
    { value: "reinforces", label: "Reinforces Existing", description: "Current values strengthened" },
    { value: "challenges", label: "Challenges Values", description: "Forces reconsideration of beliefs" },
    { value: "fragments", label: "Fragments Consensus", description: "No shared values remain" },
    { value: "new-values", label: "Creates New Values", description: "Previously unknown ethics emerge" },
    { value: "polarizes", label: "Polarizes", description: "Opposing value systems intensify" },
    { value: "post-values", label: "Post-Value", description: "Traditional ethics framework breaks down" },
  ],
  fears: [
    { value: "resolves-old", label: "Resolves Old Fears", description: "Traditional anxieties eliminated" },
    { value: "creates-new", label: "Creates New Fears", description: "Previously unknown anxieties" },
    { value: "existential", label: "Existential Dread", description: "Questions meaning of existence" },
    { value: "practical", label: "Practical Concerns", description: "Specific, addressable worries" },
    { value: "reduces-fear", label: "Reduces Fear", description: "Greater security and certainty" },
    { value: "fear-fatigue", label: "Fear Fatigue", description: "Too many threats to process" },
  ],
};

export const CONSEQUENCE_TIMEFRAMES = [
  { value: "immediate", label: "Immediate", description: "Days to weeks after introduction" },
  { value: "short-term", label: "Short-term", description: "Months to a few years" },
  { value: "medium-term", label: "Medium-term", description: "5-20 years" },
  { value: "long-term", label: "Long-term", description: "Generations (50+ years)" },
  { value: "permanent", label: "Permanent", description: "Irreversible civilizational change" },
];

export const SF_TECHNOLOGY_EXAMPLES = [
  {
    name: "Ansible (Le Guin)",
    category: "communication",
    description: "Instant FTL communication transforms interstellar politics",
    consequences: "Enables galactic governance but creates cultural homogenization pressure",
  },
  {
    name: "Replicators (Star Trek)",
    category: "materials",
    description: "Matter-energy conversion creates post-scarcity economics",
    consequences: "Eliminates material want but raises questions about art, achievement",
  },
  {
    name: "Genetic Castes (Brave New World)",
    category: "biotechnology",
    description: "Engineered social stratification from birth",
    consequences: "Stable but static society, individual purpose predetermined",
  },
  {
    name: "Memory Edit (Eternal Sunshine)",
    category: "biotechnology",
    description: "Selective memory removal technology",
    consequences: "Questions identity continuity, enables abuse, complicates relationships",
  },
  {
    name: "Slow Glass (Shaw)",
    category: "materials",
    description: "Glass that delays light passage by years",
    consequences: "New art forms, preserved moments, voyeurism concerns",
  },
  {
    name: "Cortical Stack (Altered Carbon)",
    category: "computing",
    description: "Consciousness backup and transfer",
    consequences: "Redefines death, extreme wealth inequality, identity questions",
  },
  {
    name: "Spice Melange (Herbert)",
    category: "biotechnology",
    description: "Substance enabling prescience and longevity",
    consequences: "Total control of resource means total political power",
  },
  {
    name: "Worldweb (Simmons)",
    category: "propulsion",
    description: "Farcaster network enabling instant planetary travel",
    consequences: "Planets become neighborhoods, rich live across multiple worlds",
  },
  {
    name: "Ansible (Card)",
    category: "communication",
    description: "Philotic communication, instant across any distance",
    consequences: "Fleet coordination, but also enables species-wide manipulation",
  },
  {
    name: "Room Temperature Superconductors",
    category: "materials",
    description: "Lossless electrical transmission",
    consequences: "Revolutionizes power grid, transportation, computing",
  },
];

export const CONTRADICTION_PROMPTS = [
  "This technology increases individual freedom but enables totalitarian surveillance",
  "This creates material abundance but intensifies status competition",
  "This eliminates one form of suffering but creates new forms of despair",
  "This empowers the marginalized but also empowers bad actors",
  "This makes life easier but removes sources of meaning",
  "This connects people globally but fragments local communities",
  "This extends life but strains intergenerational relationships",
  "This enables peace but removes the impetus for social progress",
  "This reduces inequality but homogenizes culture",
  "This solves environmental problems but creates new dependencies",
];

export const STORY_CONFLICT_PROMPTS = [
  "Who loses when this technology wins? How do they fight back?",
  "What happens when this technology fails at the worst possible moment?",
  "Who can't access this technology, and how does that shape their choices?",
  "What unexpected use of this technology creates the central crisis?",
  "How does someone exploit the gap between technology's promise and reality?",
  "What happens when two incompatible technologies collide?",
  "Who remembers the world before, and how does that knowledge matter?",
  "What crime becomes possible that wasn't before?",
  "What relationship breaks under this technology's pressure?",
  "What does this technology make people forget how to do?",
];

// One Big Lie - Data Constants
// Section navigation, SF examples, and option arrays

import type { Section } from "@/components/tools/SectionNavigation";

// Section definitions for navigation sidebar
export const ONE_BIG_LIE_SECTIONS: Section[] = [
  { id: "section-approach", title: "1. Choose Your Approach" },
  { id: "section-core", title: "2. Core Statement" },
  { id: "section-justification", title: "3. Justification" },
  { id: "section-testability", title: "4. Testability Check" },
  { id: "section-physical", title: "5A. Physical/Bio Consequences" },
  { id: "section-tech", title: "5B. Tech/Economic Consequences" },
  { id: "section-social", title: "5C. Social/Psych Consequences" },
  { id: "section-rigor", title: "6. Rigor Commitment" },
  { id: "section-consistency", title: "7. Consistency Stress Test" },
  { id: "section-declaration", title: "8. Physics Declaration" },
];

// Approach options for Section 1 RadioGroup
export const APPROACH_OPTIONS = [
  {
    id: "big-lie",
    label: "The One Big Lie",
    description:
      "A single violation of known physics, like The Expanse's Epstein Drive or The Martian's exaggerated Martian wind.",
  },
  {
    id: "what-if",
    label: "The One What If?",
    description:
      "A counterfactual premise explored rigorously, like 'What if consciousness could be digitized?' or 'What if gravity worked differently at quantum scales?'",
  },
] as const;

// SF reference examples for the inspiration accordion
export interface SFExample {
  name: string;
  source: string;
  lie: string;
  cascade: string;
}

export const SF_EXAMPLES: SFExample[] = [
  {
    name: "The Expanse",
    source: "James S.A. Corey",
    lie: "The Epstein Drive, a highly efficient fusion propulsion system that makes interplanetary travel practical within the solar system.",
    cascade:
      "Everything else follows real physics. Ships are built like skyscrapers because thrust creates artificial gravity. High-G burns are weapons. The entire political structure of the Sol system, Earth, Mars, and the Belt, flows directly from drive capabilities and travel times. Belt colonization creates a new labor class, which drives political revolution.",
  },
  {
    name: "The Martian",
    source: "Andy Weir",
    lie: "Martian wind force strong enough to damage equipment and threaten a habitat. In reality, Mars's atmosphere is too thin for wind to have that kind of force.",
    cascade:
      "This single lie enables the entire plot, stranding Mark Watney on Mars. All other science is rigorously accurate: orbital mechanics that dictate the rescue timeline, botany that determines food supply, chemistry that produces water and oxygen. Weir has called this his one acknowledged cheat.",
  },
  {
    name: "Dune",
    source: "Frank Herbert",
    lie: "The Holtzman Effect enables space folding, but only spice-mutated Guild Navigators can safely pilot through folded space.",
    cascade:
      "This creates total dependency on melange, a rare substance found on only one planet. The Spacing Guild becomes a secretive monopoly. The entire political economy of the Imperium revolves around spice control. FTL isn't just transportation, it's the foundation of political power, religious prophecy, and ecological warfare.",
  },
  {
    name: "Star Trek",
    source: "Gene Roddenberry et al.",
    lie: "Warp drive via matter-antimatter reaction regulated by dilithium crystals, allowing ships to exceed light speed while remaining stationary relative to local spacetime.",
    cascade:
      "Science-adjacent, parallels the real Alcubierre metric published in 1994. Requires hand-waving 'exotic matter' (dilithium) but maintains internal consistency across series. Enables the entire premise of exploration, first contact scenarios, and the Federation as a political entity spanning hundreds of light-years.",
  },
  {
    name: "Tau Zero",
    source: "Poul Anderson",
    lie: "Bussard ramjet feasibility, a ship that scoops interstellar hydrogen as fuel, allowing indefinite acceleration.",
    cascade:
      "Anderson rigorously explores relativistic consequences. As the crew accelerates past the ability to decelerate, they experience time dilation that lets them witness the universe's future, galaxies forming and dying. The physics of relativity is handled with exceptional accuracy; only the ramjet's feasibility is the lie.",
  },
];

// Helper text for each section (from the user's spec)
export const SECTION_HELPERS = {
  approach:
    "There are two paths to speculative worldbuilding. The 'One Big Lie' declares a single violation of known physics and maintains strict realism everywhere else, like The Expanse's Epstein Drive or The Martian's exaggerated wind force on Mars. The 'One What If?' takes a counterfactual premise and explores its implications rigorously, like 'What if everyone could ensoul objects?' Both demand the same discipline: specificity, testability, and cascading consequences.",
  coreStatement:
    "State your speculative element in one clear sentence. Be specific. 'Faster-than-light travel exists' is too vague. 'A warp bubble can be generated by matter-antimatter reaction regulated by dilithium crystals, allowing ships to exceed light speed while remaining stationary relative to local spacetime' is specific and testable within your world's logic.",
  justification:
    "Every speculative element must pass the test of consequentiality: if you can remove it and the story proceeds the same way, it shouldn't be there. Your Big Lie should be load-bearing, the thing the entire world rests upon.",
  testability:
    "Testability means that within the limits of your fictional world, your speculative element should feel grounded, not completely bizarre or tacked on. It should fit coherently within the world's internal logic. Could a character in your world design an experiment to test or demonstrate this element? If not, it may be too vague.",
  physicalConsequences:
    "This is where the real worldbuilding happens. The StellarForge cascade principle: Physics shapes environment. Environment shapes biology. Biology shapes psychology. Psychology shapes mythology. Mythology shapes culture. Your Big Lie is a stone dropped into the pond of your world, now trace the ripples. Each consequence should feel inevitable, not arbitrary.",
  physicalSub:
    "How does your speculative element change the physical or biological reality of your world? Think about energy, materials, ecosystems, evolution, human (or alien) bodies.",
  techConsequences:
    "Technology follows physics, and economics follows technology. The Expanse's Epstein Drive doesn't just move ships, it makes Belt colonization possible, which creates a new labor class, which drives political revolution. What does your Big Lie build, and who profits?",
  socialConsequences:
    "Dune's space folding doesn't just move ships, it requires Guild Navigators mutated by spice, creating total dependency on a rare substance and a secretive organization. FTL as driver of political economy rather than mere transportation. How does your Big Lie reshape how people think, relate, and organize?",
  rigorCommitment:
    "The 'One Big Lie' framework only works if you hold the line everywhere else. Declaring three areas of maintained scientific rigor forces you to be honest about where you're speculating and where you're grounding. This is what separates science fiction from fantasy with spaceships.",
  consistencyTest:
    "The best speculative elements survive stress testing. Try to break your own idea. If you can't find the cracks, your readers will find them for you.",
  declaration:
    "This is your formal declaration, the contract between you and your reader. Everything that follows in your worldbuilding should be consistent with this statement.",
};

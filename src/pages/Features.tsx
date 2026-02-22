import Header from "@/components/layout/Header";
import ShowcaseHero from "@/components/showcase/ShowcaseHero";
import ToolShowcaseBlock from "@/components/showcase/ToolShowcaseBlock";
import ProAdvantageSection from "@/components/showcase/ProAdvantageSection";
import DataSovereigntySection from "@/components/showcase/DataSovereigntySection";
import FinalCTASection from "@/components/showcase/FinalCTASection";
import Footer from "@/components/layout/Footer";
import { PageBursts } from "@/components/ui/data-burst";
import { FEATURES_BURSTS } from "@/lib/data-bursts";

// Tool data for showcase blocks
const TOOLS = [
  // Free Tools
  {
    id: "environmental-chain-reaction",
    title: "Environmental Chain Reaction",
    description: "Map how planetary parameters cascade into biology, psychology, mythology, and culture. Start with gravity, end with gods.",
    features: [
      "5-level consequence cascade from physics to myth",
      "Automatic implication suggestions",
      "Export comprehensive world profiles",
    ],
    isPro: false,
  },
  {
    id: "spacecraft-designer",
    title: "Lived-In Spacecraft Designer",
    description: "Design ships that feel inhabited with cultural context, life support realities, and ship-as-character development.",
    features: [
      "Hull type, propulsion, and crew integration",
      "Life support and resource calculations",
      "Cultural and operational identity",
    ],
    isPro: false,
  },
  {
    id: "propulsion-consequences-map",
    title: "Propulsion Consequences Map",
    description: "Trace how your propulsion system shapes economics, politics, social structures, and psychology.",
    features: [
      "12+ propulsion types with cascading effects",
      "Economic and political implications",
      "Social structure consequences",
    ],
    isPro: false,
  },
  // Pro Tools
  {
    id: "planetary-profile",
    title: "Planetary Profile Template",
    description: "Define your world's stellar environment, physical characteristics, atmosphere, and the narrative pressures that shape life.",
    features: [
      "Star type, orbital mechanics, and day/year cycles",
      "Atmosphere composition and habitability",
      "Narrative pressure identification",
    ],
    isPro: true,
  },
  {
    id: "drake-equation-calculator",
    title: "Drake Equation Calculator",
    description: "Calculate the number of civilizations in your galaxy. Establish your cosmic context from lonely universe to teeming space opera.",
    features: [
      "Interactive sliders for all 7 Drake variables",
      "Real-time N calculation with interpretations",
      "Worldbuilding implications for each result",
    ],
    isPro: true,
  },
  {
    id: "xenomythology-framework-builder",
    title: "Xenomythology Framework Builder",
    description: "Create comprehensive alien mythological systems derived from species biology, environment, and evolutionary pressures.",
    features: [
      "12 archetype channels from biology to myth",
      "AI-suggested implications from environment",
      "Complete mythology framework export",
    ],
    isPro: true,
  },
  {
    id: "evolutionary-biology",
    title: "Evolutionary Biology Design Sheet",
    description: "Design biologically plausible alien species with 13 comprehensive sections from biochemistry to psychology.",
    features: [
      "Biochemistry, body plan, and sensory systems",
      "Social evolution and cognition modeling",
      "Non-human viewpoint validation",
    ],
    isPro: true,
  },
  {
    id: "star-system-builder",
    title: "Star System Builder",
    description: "Design multi-planet systems with stellar relationships, orbital mechanics, and system-wide narrative elements.",
    features: [
      "Spectral classification and stellar configurations",
      "Planetary bodies with orbital zones and resonances",
      "System history and habitability analysis",
    ],
    isPro: true,
  },
  {
    id: "empire-designer",
    title: "Empire/Government Designer",
    description: "Create political structures, governance systems, and the factions that challenge or support them.",
    features: [
      "Government types with legitimacy and succession",
      "Internal factions and external relations",
      "Stability assessment and trajectory analysis",
    ],
    isPro: true,
  },
  {
    id: "technology-consequences",
    title: "Technology Consequences Map",
    description: "Map how any technology cascades through physical, economic, social, political, military, and psychological domains.",
    features: [
      "7 consequence domains with timeframe tracking",
      "Contradiction analysis for story conflicts",
      "SF examples and story potential synthesis",
    ],
    isPro: true,
  },
  {
    id: "species-interaction-matrix",
    title: "Species Interaction Matrix",
    description: "Define complex relationships between 2-6 alien species across physical, cultural, economic, and political dimensions.",
    features: [
      "Pairwise relationship mapping",
      "Historical context and tension points",
      "Equilibrium and trajectory assessment",
    ],
    isPro: true,
  },
];

const Features = () => {
  return (
    <div className="min-h-screen bg-background sf-atmosphere">
      <Header />

      <main className="relative z-10">
        <PageBursts bursts={FEATURES_BURSTS} />
        {/* Hero Section */}
        <ShowcaseHero />

        {/* Tool Showcases */}
        <section className="container mx-auto px-4 py-16">
          <div className="space-y-24">
            {TOOLS.map((tool, index) => (
              <ToolShowcaseBlock
                key={tool.id}
                toolId={tool.id}
                title={tool.title}
                description={tool.description}
                features={tool.features}
                isPro={tool.isPro}
                imageSide={index % 2 === 0 ? "left" : "right"}
              />
            ))}
          </div>
        </section>

        {/* Pro Advantage Section */}
        <ProAdvantageSection />

        {/* Data Sovereignty */}
        <DataSovereigntySection />

        {/* Final CTA */}
        <FinalCTASection />
      </main>

      <Footer />
    </div>
  );
};

export default Features;

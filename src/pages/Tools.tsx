// ---------------------------------------------------------------------------
// /tools — the full instrument catalog.
//
// This used to be the bottom half of the signed-in home. The home is now
// "your worlds + continue writing" (onboarding review item 2); the catalog
// lives here, reachable from the header's Tools menu, the footer and ⌘K.
// ---------------------------------------------------------------------------

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  Atom,
  Clock,
  Cpu,
  Calculator,
  Rocket,
  Sparkles,
  Crown,
  Dna,
  Sun,
  Network,
  Orbit,
  Languages,
  Weight,
  Eye,
  Map as MapIcon,
  Zap,
  ContactRound,
  Ship,
} from "lucide-react";
import {
  TOOL_WIKI,
  CATEGORY_META,
  type ToolCategory,
  type ToolType,
  type ComplexityLevel,
} from "@/lib/tool-wiki-data";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ToolCard from "@/components/dashboard/ToolCard";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import SFDivider from "@/components/ui/sf-divider";
import QuickUpgradeCard from "@/components/subscription/QuickUpgradeCard";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import { useMetaTags } from "@/hooks/use-meta-tags";

interface CatalogTool {
  id: string;
  title: string;
  description: string;
  icon?: typeof Globe;
  status: "available";
  path?: string;
}

// All tools organized by wiki category
const TOOLS_BY_CATEGORY: { category: ToolCategory; tools: CatalogTool[] }[] = [
  {
    category: "stars-systems",
    tools: [
      {
        id: "habitable-zone-calculator",
        title: "Goldilocks: Habitable Zone Calculator",
        description:
          "Calculate habitable zone boundaries for any star. Place your planet and see how orbital position shapes climate, biology, and civilization.",
        icon: Sun,
        status: "available",
      },
      {
        id: "star-system-builder",
        title: "Orrery: Star System Builder",
        description:
          "Design multi-planet systems with stellar relationships and orbital mechanics.",
        icon: Sun,
        status: "available",
      },
      {
        id: "exosky",
        title: "Exosky: Alien Night Sky",
        description:
          "Alien night sky simulator. View the stars from any exoplanet using real astronomical data and create your own constellations.",
        status: "available",
      },
      {
        id: "stellar-cartographer",
        title: "Stellar Cartographer: Galaxy Mapper",
        description:
          "Interactive galaxy mapping tool. Generate procedural galaxies with 3D projection, empire territories, trade routes, and wormholes.",
        status: "available",
      },
      {
        id: "solaris",
        title: "Solaris: Procedural Star System Simulator",
        description:
          "Design single and multi-star systems with real orbital mechanics, habitable zone science, and N-body dynamics.",
        status: "available",
      },
    ],
  },
  {
    category: "worlds",
    tools: [
      {
        id: "planetary-profile",
        title: "Genesis: Planetary Profile",
        description:
          "Define your world's stellar environment, physical characteristics, atmosphere, habitability, and the narrative pressures that shape life.",
        icon: Globe,
        status: "available",
      },
      {
        id: "surface-gravity-calculator",
        title: "Ballast: Surface Gravity Calculator",
        description:
          "Calculate surface gravity for any planet and trace how weight shapes biology, psychology, mythology, and culture.",
        icon: Weight,
        status: "available",
      },
      {
        id: "surface-cartographer",
        title: "Surface Cartographer: Planet & Moon Maps",
        description:
          "Map a planet or moon from your own sheet or a generated one. Places carry coordinates, and inherit sky, climate and travel time from canon.",
        icon: MapIcon,
        status: "available",
      },
      {
        id: "exoforge",
        title: "ExoForge: Procedural Exoplanet Forge",
        description:
          "Shape rocky, oceanic, and gas worlds with real physics. Import 58 real NASA exoplanets or build from scratch.",
        status: "available",
      },
      {
        id: "tidelock",
        title: "Tidelock: Locked World Simulator",
        description:
          "Tidally locked world simulator. Explore habitable zones, atmospheric dynamics, and surface conditions on exoplanets around M-dwarf and K-dwarf stars.",
        status: "available",
      },
      {
        id: "rogue",
        title: "Rogue: Wandering Object Encounters",
        description:
          "N-body gravitational encounter simulator. Launch black holes, brown dwarfs, and rogue planets at real star systems.",
        path: "/rogue",
        status: "available",
      },
    ],
  },
  {
    category: "life",
    tools: [
      {
        id: "evolutionary-biology",
        title: "Phylo: Evolutionary Biology",
        description:
          "Design biologically plausible alien species with 13 comprehensive sections covering biochemistry, body plan, cognition, and psychology.",
        icon: Dna,
        status: "available",
      },
      {
        id: "species-interaction-matrix",
        title: "Symbiosis: Species Interaction Matrix",
        description:
          "Map predator-prey dynamics, mutualism, parasitism: the ecological web of your world.",
        icon: Network,
        status: "available",
      },
      {
        id: "sensorium",
        title: "Sensorium: Alien Sensory Systems",
        description:
          "Design evolutionarily plausible sensory systems for alien species. Derive senses from environmental constraints or validate custom selections.",
        icon: Eye,
        status: "available",
      },
    ],
  },
  {
    category: "civilizations",
    tools: [
      {
        id: "one-big-lie",
        title: "Axiom: The One Big Lie",
        description:
          "Declare your single violation of known physics and trace its consequences across your entire world.",
        icon: Atom,
        status: "available",
      },
      {
        id: "propulsion-consequences-map",
        title: "Impulse: Propulsion Consequences",
        description:
          "Trace how your propulsion system shapes economics, politics, social structures, and psychology.",
        icon: Atom,
        status: "available",
      },
      {
        id: "spacecraft-designer",
        title: "Vessel: Lived-In Spacecraft Designer",
        description:
          "Design ships that feel inhabited with cultural context, life support realities, and ship-as-character development.",
        icon: Rocket,
        status: "available",
      },
      {
        id: "empire-designer",
        title: "Dominion: Empire Designer",
        description: "Create political structures, governance systems, and internal factions.",
        icon: Crown,
        status: "available",
      },
      {
        id: "technology-consequences",
        title: "Paradigm: Technology Consequences",
        description: "Map how any technology cascades through society, economy, and culture.",
        icon: Cpu,
        status: "available",
      },
      {
        id: "space-expansion-modeler",
        title: "Exodus: Space Expansion Modeler",
        description:
          "Model how competing forces shape humanity's expansion beyond Earth across phases of development.",
        icon: Orbit,
        status: "available",
      },
      {
        id: "time-dilation",
        title: "Paradox: Time Dilation Calculator",
        description:
          "Calculate relativistic time dilation for interstellar journeys. See how fast travel warps time for your characters.",
        icon: Clock,
        status: "available",
      },
      {
        id: "drake-equation-calculator",
        title: "Signal: Drake Equation Calculator",
        description:
          "Calculate the number of civilizations in your galaxy. Establish your cosmic context from lonely universe to teeming space opera.",
        icon: Calculator,
        status: "available",
      },
      {
        id: "lexdrift",
        title: "Lexdrift: Language Evolution",
        description:
          "Model how languages evolve during interstellar travel. Calculate divergence rates, predict change types, and generate sample texts.",
        icon: Languages,
        status: "available",
      },
      {
        id: "gravitas",
        title: "Gravitas: Gravity Simulator",
        description:
          "Calculate gravity conditions on spacecraft, habitats, and planetary surfaces. Spin, thrust, orbital, and artificial gravity with experiential output.",
        icon: Weight,
        status: "available",
      },
      {
        id: "kardashev-scale",
        title: "K-Scale: Kardashev Scale Calculator",
        description:
          "Classify civilizations by energy consumption. Calculate Kardashev numbers, trace cascade implications, and project growth timelines.",
        icon: Zap,
        status: "available",
      },
      {
        id: "dossier",
        title: "Dossier: Character Development",
        description:
          "Characters born into your world. Lifespan, senses, native gravity, phonology and funeral customs inherited from your tools, with every override marked.",
        icon: ContactRound,
        status: "available",
      },
    ],
  },
  {
    category: "mythology",
    tools: [
      {
        id: "xenomythology-framework-builder",
        title: "Mythos: Xenomythology Framework",
        description:
          "Create comprehensive alien mythological systems derived from species biology, environment, and evolutionary pressures.",
        icon: Sparkles,
        status: "available",
      },
    ],
  },
  {
    category: "integration",
    tools: [
      {
        id: "environmental-chain-reaction",
        title: "Cascade: Environmental Chain Reaction",
        description:
          "Map how planetary parameters cascade into biology, psychology, mythology, and culture.",
        icon: Globe,
        status: "available",
      },
      {
        id: "timeline",
        title: "Timeline",
        description:
          "Plot events across deep time. Build multi-track timelines that reveal how characters, civilizations, and technologies intersect.",
        icon: Clock,
        status: "available",
      },
      {
        id: "generation-ship",
        title: "Ark: Generation Ship Designer",
        description:
          "Size a multi-generational voyage: crew genetics, closed-loop life support, spin habitat, and drift events for the Chronicle.",
        icon: Ship,
        status: "available",
      },
    ],
  },
];

/** Every tool id the catalog lists (exported for the honesty test). */
export const CATALOG_TOOL_IDS = TOOLS_BY_CATEGORY.flatMap((g) => g.tools.map((t) => t.id));

/**
 * Not built yet. Only things with no shipping equivalent belong here: the
 * Generation Ship (Ark), the planet/moon cartographer (Surface Cartographer),
 * the solar-system orrery (Orrery, Solaris), warp travel (Paradox's warp
 * mode) and the year calculator (Goldilocks) all ship and were removed.
 */
export const COMING_SOON_ITEMS = [
  { title: "BDO: Big Dumb Object", subtitle: "Megastructures and cosmic artifacts" },
  { title: "Quantum and Beyond", subtitle: "A preset library of physics beyond our understanding, for Axiom" },
  { title: "AI Development", subtitle: "Artificial intelligence in your universe" },
  { title: "Atmosphere Composition Calculator", subtitle: "Model atmospheric chemistry from first principles" },
] as const;

type SortMode = "category" | "type" | "complexity";

const TYPE_GROUP_META: Record<ToolType, { label: string; color: string; description: string }> = {
  worksheet: { label: "Worksheets", color: "var(--sf-azure-text)", description: "In-depth design tools with guided questions and exportable results." },
  calculator: { label: "Calculators", color: "var(--sf-amber-text)", description: "Quick-reference tools for specific physical parameters." },
  simulator: { label: "Simulators", color: "var(--sf-emerald-text)", description: "Interactive visual simulations and procedural generators." },
  cartographer: { label: "Cartographers", color: "var(--sf-violet-text)", description: "Spatial mapping and visualization tools." },
};

const COMPLEXITY_GROUP_META: Record<ComplexityLevel, { label: string; color: string; description: string }> = {
  entry: { label: "Entry Level", color: "var(--sf-emerald-text)", description: "No prerequisites. Great starting points for new worldbuilders." },
  intermediate: { label: "Intermediate", color: "var(--sf-amber-text)", description: "Benefits from prior tool outputs. Deeper domain exploration." },
  advanced: { label: "Advanced", color: "var(--sf-violet-text)", description: "Maximum flexibility. Best with prior tool experience." },
};

const TYPE_ORDER: ToolType[] = ["worksheet", "calculator", "simulator", "cartographer"];
const COMPLEXITY_ORDER: ComplexityLevel[] = ["entry", "intermediate", "advanced"];

function getToolBadge(toolId: string, mode: SortMode): { label: string; color: string } | undefined {
  const wiki = TOOL_WIKI[toolId];
  if (!wiki) return undefined;
  if (mode === "category") {
    return { label: TYPE_GROUP_META[wiki.type].label, color: TYPE_GROUP_META[wiki.type].color };
  }
  const meta = CATEGORY_META[wiki.category];
  return { label: meta.label, color: meta.color };
}

const ComingSoonCard = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <GlassPanel className="p-4 border-dashed border border-sf-disabled-line bg-sf-disabled-bg">
    <div className="flex items-center justify-between gap-2 mb-1">
      <h3 className="font-heading font-medium text-sm text-t3">{title}</h3>
      <Badge variant="outline" className="text-xs shrink-0">COMING SOON</Badge>
    </div>
    <p className="text-xs text-t3">{subtitle}</p>
  </GlassPanel>
);

const Tools = () => {
  useMetaTags({ title: "All Tools" });
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();
  const [sortMode, setSortMode] = useState<SortMode>("category");

  const groupedTools = useMemo(() => {
    if (sortMode === "category") {
      return TOOLS_BY_CATEGORY.map(({ category, tools }) => {
        const meta = CATEGORY_META[category];
        return { key: category, label: meta.label, color: meta.color, description: meta.description, tools };
      });
    }
    const allTools = TOOLS_BY_CATEGORY.flatMap((g) => g.tools);
    const groups = new Map<string, CatalogTool[]>();
    for (const tool of allTools) {
      const wiki = TOOL_WIKI[tool.id];
      if (!wiki) continue;
      const key = sortMode === "type" ? wiki.type : wiki.complexity;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tool);
    }
    const order: string[] = sortMode === "type" ? TYPE_ORDER : COMPLEXITY_ORDER;
    const getMeta =
      sortMode === "type"
        ? (k: string) => TYPE_GROUP_META[k as ToolType]
        : (k: string) => COMPLEXITY_GROUP_META[k as ComplexityLevel];
    return order
      .filter((key) => groups.has(key))
      .map((key) => ({ key, ...getMeta(key), tools: groups.get(key)! }));
  }, [sortMode]);

  return (
    <div className="min-h-screen bg-sf-void sf-atmosphere">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <section className="mb-16">
          <div className="flex flex-col gap-4 mb-8">
            <p className="font-heading text-sf-eyebrow uppercase text-t4">// INSTRUMENT CATALOG</p>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h1 className="font-display text-sf-h1 tracking-title text-t1">ALL TOOLS</h1>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/getting-started"
                  className="inline-flex min-h-hit items-center px-3 text-xs font-heading uppercase tracking-wide text-sf-primary-text border border-sf-primary hover:border-sf-line-emphasis rounded-none transition-colors duration-base"
                >
                  Getting Started
                </Link>
                <Link
                  to="/guide/tools"
                  className="inline-flex min-h-hit items-center px-3 text-xs font-heading uppercase tracking-wide text-t3 hover:text-t1 border border-sf-line hover:border-sf-line-emphasis rounded-none transition-colors duration-base"
                >
                  Tool Reference
                </Link>
              </div>
            </div>
            <p className="sf-measure text-sf-body text-t2">
              Inside a world, every instrument opens on a subject from its Codex. Open a world's
              Instruments to start from an entity; open one here to start standalone.
            </p>
            <div
              role="group"
              aria-label="Sort tools"
              className="flex items-center gap-1 p-0.5 bg-sf-surface-elevated rounded-none border border-sf-line w-fit"
            >
              {([
                { mode: "category" as SortMode, label: "Category" },
                { mode: "type" as SortMode, label: "Type" },
                { mode: "complexity" as SortMode, label: "Difficulty" },
              ]).map(({ mode, label }) => (
                <button
                  type="button"
                  key={mode}
                  aria-pressed={sortMode === mode}
                  onClick={() => setSortMode(mode)}
                  className={`min-h-hit px-3 text-xs uppercase tracking-[0.12em] font-medium rounded-none transition-colors duration-base ${
                    sortMode === mode
                      ? "bg-sf-primary/[0.06] border border-sf-primary text-sf-primary-text"
                      : "border border-transparent text-t3 hover:text-t1"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Quick-jump nav, scrolls to each group section under the active sort mode. */}
            <div className="flex flex-wrap items-center gap-2">
              {groupedTools.map(({ key, label, color }) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => {
                    document
                      .getElementById(`tools-group-${key}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="flex min-h-hit items-center gap-1.5 px-3 text-xs uppercase tracking-[0.12em] font-medium rounded-none border border-sf-line hover:border-sf-line-emphasis text-t3 hover:text-t1 transition-colors duration-base"
                >
                  <span className="w-1.5 h-1.5 shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
                  <span style={{ color }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {groupedTools.map(({ key, label, color, description, tools: sectionTools }, idx) => (
            <div key={key} id={`tools-group-${key}`} className="scroll-mt-24">
              {idx > 0 && <SFDivider className="hidden md:block" />}
              <div className="mt-8 first:mt-0 mb-6">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-2 h-2" style={{ backgroundColor: color }} aria-hidden="true" />
                  <h2 className="font-heading font-light text-lg uppercase tracking-wide" style={{ color }}>
                    {label}
                  </h2>
                </div>
                <p className="text-xs text-t3 ml-[18px]">{description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sectionTools.map((tool) => (
                  <ToolCard key={tool.id} {...tool} category={getToolBadge(tool.id, sortMode)} />
                ))}
              </div>
            </div>
          ))}

          <SFDivider className="hidden md:block" />

          {/* Coming Soon: only what has no shipping equivalent. */}
          <div className="mt-8 mb-6 flex items-center justify-between gap-4">
            <h2 className="font-heading font-light text-lg uppercase tracking-wide text-t3">Coming Soon</h2>
            {isSubscribed && (
              <Link
                to="/roadmap"
                className="inline-flex min-h-hit items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-sf-primary-text transition-colors duration-base"
              >
                <MapIcon className="w-3.5 h-3.5" aria-hidden="true" />
                Vote on the Roadmap
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COMING_SOON_ITEMS.map((tool) => (
              <ComingSoonCard key={tool.title} {...tool} />
            ))}
          </div>

          {user && !isSubscribed && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <QuickUpgradeCard />
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Tools;

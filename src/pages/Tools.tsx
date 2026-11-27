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
import { PageContainer, PageHeader } from "@/components/layout/page-chrome";
import { Button } from "@/components/ui/button";

// Section headings (15-PAGE-CHROME §4): the section-header pattern.
const sectionHeading = "font-heading text-sf-eyebrow uppercase text-t4";
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
          "See the night sky from any exoplanet, using real star data, and draw your own constellations.",
        status: "available",
      },
      {
        id: "stellar-cartographer",
        title: "Stellar Cartographer: Galaxy Mapper",
        description:
          "Generate a galaxy in 3D and map empire territories, trade routes, and wormholes.",
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
          "Map a planet or moon from your own sheet or a generated one. Places carry coordinates and inherit sky, climate, and travel time from canon.",
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
          "Simulate a tidally locked planet around a red or orange dwarf: where it is habitable, how its air moves, and what its surface is like.",
        status: "available",
      },
      {
        id: "rogue",
        title: "Rogue: Wandering Object Encounters",
        description:
          "Send black holes, brown dwarfs, and rogue planets through real star systems and watch the gravity play out.",
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
          "Design biologically plausible alien species across 13 sections covering biochemistry, body plan, cognition, and psychology.",
        icon: Dna,
        status: "available",
      },
      {
        id: "species-interaction-matrix",
        title: "Symbiosis: Species Interaction Matrix",
        description:
          "Map predators and prey, mutualism, and parasitism across your world's ecology.",
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
          "Design ships people live on: their culture, the limits of life support, and the ship as a character.",
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
          "Calculate relativistic time dilation for interstellar journeys and see how much time your characters lose.",
        icon: Clock,
        status: "available",
      },
      {
        id: "drake-equation-calculator",
        title: "Signal: Drake Equation Calculator",
        description:
          "Estimate how many civilizations share your galaxy, from a lonely universe to a crowded space opera.",
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
          "Calculate gravity on spacecraft, habitats, and planets, from spin, thrust, or orbit, and read what it feels like.",
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
          "Characters born into your world. Lifespan, senses, native gravity, phonology, and funeral customs come from your tools, with every override marked.",
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
          "Build alien mythologies from a species' biology, environment, and evolutionary history.",
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
          "Plot events across deep time on parallel tracks, so you can see where characters, civilizations, and technologies cross.",
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
  worksheet: { label: "Worksheets", color: "var(--sf-azure-text)", description: "Design tools with guided questions and exportable results." },
  calculator: { label: "Calculators", color: "var(--sf-amber-text)", description: "Quick-reference tools for specific physical parameters." },
  simulator: { label: "Simulators", color: "var(--sf-emerald-text)", description: "Interactive visual simulations and procedural generators." },
  cartographer: { label: "Cartographers", color: "var(--sf-violet-text)", description: "Spatial mapping and visualization tools." },
};

const COMPLEXITY_GROUP_META: Record<ComplexityLevel, { label: string; color: string; description: string }> = {
  entry: { label: "Entry Level", color: "var(--sf-emerald-text)", description: "No prerequisites. Good places to start." },
  intermediate: { label: "Intermediate", color: "var(--sf-amber-text)", description: "Works best with results from earlier tools." },
  advanced: { label: "Advanced", color: "var(--sf-violet-text)", description: "The most room to adjust. Best once you know the earlier tools." },
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
      <main className="relative z-10">
        <PageContainer variant="wide">
        <section className="mb-16">
          <PageHeader
            size="page"
            title="All tools"
            lede="Open a tool here to use it on its own, or open it from a world's Instruments to work on something in that world."
            actions={
              <>
                <Button asChild variant="sf-ghost" size="sf-md">
                  <Link to="/getting-started">Getting started</Link>
                </Button>
                <Button asChild variant="sf-ghost" size="sf-md">
                  <Link to="/guide/tools">Tool reference</Link>
                </Button>
              </>
            }
          />
          <div className="flex flex-col gap-4 mb-8">
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
              <div className="mt-8 first:mt-0 mb-6 border-b border-sf-line-hairline pb-3">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-2 h-2" style={{ backgroundColor: color }} aria-hidden="true" />
                  <h2 className={sectionHeading}>{label}</h2>
                </div>
                <p className="text-sf-small text-t3 ml-[18px]">{description}</p>
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
          <div className="mt-8 mb-6 flex items-center justify-between gap-4 border-b border-sf-line-hairline pb-3">
            <h2 className={sectionHeading}>Coming soon</h2>
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
        </PageContainer>
      </main>
      <Footer />
    </div>
  );
};

export default Tools;

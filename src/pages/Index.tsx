import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  Users,
  Atom,
  Clock,
  BookOpen,
  Cpu,
  Shield,

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
  ChevronDown,
  Map,
  Zap,
} from "lucide-react";
import {
  TOOL_WIKI,
  CATEGORY_META,
  type ToolCategory,
  type ToolType,
  type ComplexityLevel,
} from "@/lib/tool-wiki-data";
import Header from "@/components/layout/Header";
import ToolCard from "@/components/dashboard/ToolCard";
import WorldCard from "@/components/dashboard/WorldCard";
import CreateWorldButton from "@/components/dashboard/CreateWorldButton";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useWorlds } from "@/hooks/use-worlds";
import { useSubscription } from "@/hooks/use-subscription";
import WelcomeHero from "@/components/landing/WelcomeHero";
import LoggedInHero from "@/components/landing/LoggedInHero";
import ToolShowcase from "@/components/landing/ToolShowcase";
import ValueProposition from "@/components/landing/ValueProposition";
import VideoShowcase from "@/components/landing/VideoShowcase";
import { Loader } from "@/components/ui/loader";
import { CosmicTelemetry } from "@/components/layout/CosmicVelocityTicker";
import { COORDINATE_DATA } from "@/lib/cosmic-telemetry";
import QuickUpgradeCard from "@/components/subscription/QuickUpgradeCard";
import SubscriptionBanner from "@/components/subscription/SubscriptionBanner";
import BetaBanner from "@/components/BetaBanner";
import Footer from "@/components/layout/Footer";
import RecentArticles from "@/components/landing/RecentArticles";
import WelcomeDialog from "@/components/onboarding/WelcomeDialog";
import { TagFilter } from "@/components/dashboard/TagFilter";
import { ArchiveToggle } from "@/components/dashboard/ArchiveToggle";
import SharedWorldsSection from "@/components/dashboard/SharedWorldsSection";
import SFDivider from "@/components/ui/sf-divider";
import { HomepageQuote } from "@/components/quotes/HomepageQuote";
import { BracketPanel } from "@/components/ui/bracket-panel";
import { PageBursts } from "@/components/ui/data-burst";
import { ALL_DASHBOARD_BURSTS } from "@/lib/data-bursts";

// Helper to get category metadata for a tool
function getToolCategory(toolId: string): { label: string; color: string } | undefined {
  const wiki = TOOL_WIKI[toolId];
  if (!wiki) return undefined;
  const meta = CATEGORY_META[wiki.category];
  return { label: meta.label, color: meta.color };
}

// All tools organized by wiki category
const toolsByCategory: {
  category: ToolCategory;
  tools: {
    id: string;
    title: string;
    description: string;
    icon?: typeof Globe;
    status: "available";
    week?: number;
    path?: string;
  }[];
}[] = [
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
        title: "Atlas: Surface Gravity Calculator",
        description:
          "Calculate surface gravity for any planet and trace how weight shapes biology, psychology, mythology, and culture.",
        icon: Weight,
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
          "Map predator-prey dynamics, mutualism, parasitism—the ecological web of your world.",
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
        description:
          "Create political structures, governance systems, and internal factions.",
        icon: Crown,
        status: "available",
      },
      {
        id: "technology-consequences",
        title: "Paradigm: Technology Consequences",
        description:
          "Map how any technology cascades through society, economy, and culture.",
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
    ],
  },
];

type SortMode = 'category' | 'type' | 'complexity';

const TYPE_GROUP_META: Record<ToolType, { label: string; color: string; description: string }> = {
  worksheet: { label: 'Worksheets', color: '#4D9FFF', description: 'In-depth design tools with guided questions and exportable results.' },
  calculator: { label: 'Calculators', color: '#FFB800', description: 'Quick-reference tools for specific physical parameters.' },
  simulator: { label: 'Simulators', color: '#00FF88', description: 'Interactive visual simulations and procedural generators.' },
  cartographer: { label: 'Cartographers', color: '#9B5DE5', description: 'Spatial mapping and visualization tools.' },
};

const COMPLEXITY_GROUP_META: Record<ComplexityLevel, { label: string; color: string; description: string }> = {
  entry: { label: 'Entry Level', color: '#00FF88', description: 'No prerequisites. Great starting points for new worldbuilders.' },
  intermediate: { label: 'Intermediate', color: '#FFB800', description: 'Benefits from prior tool outputs. Deeper domain exploration.' },
  advanced: { label: 'Advanced', color: '#9B5DE5', description: 'Maximum flexibility. Best with prior tool experience.' },
};

const CATEGORY_ORDER: ToolCategory[] = ['stars-systems', 'worlds', 'life', 'civilizations', 'mythology', 'integration'];
const TYPE_ORDER: ToolType[] = ['worksheet', 'calculator', 'simulator', 'cartographer'];
const COMPLEXITY_ORDER: ComplexityLevel[] = ['entry', 'intermediate', 'advanced'];

function getToolBadge(toolId: string, mode: SortMode): { label: string; color: string } | undefined {
  const wiki = TOOL_WIKI[toolId];
  if (!wiki) return undefined;
  if (mode === 'category') {
    return { label: TYPE_GROUP_META[wiki.type].label, color: TYPE_GROUP_META[wiki.type].color };
  }
  const meta = CATEGORY_META[wiki.category];
  return { label: meta.label, color: meta.color };
}

const comingSoonItems = [
  { title: "BDO: Big Dumb Object", subtitle: "Create megastructures and cosmic artifacts" },
  { title: "Solar System Cartographer", subtitle: "Map entire solar systems in an interactive orrery" },

  { title: "Quantum and Beyond", subtitle: "Technology beyond our understanding" },
  { title: "Generation Ship Designer", subtitle: "Design self-sustaining interstellar arks" },
  { title: "Character Development", subtitle: "Individual characters connected to your world" },
  { title: "AI Development", subtitle: "Explore artificial intelligence in your universe" },
  { title: "Warp Travel Calculator", subtitle: "Calculate warp-based journey parameters" },
  { title: "Orbital Mechanics / Year Calculator", subtitle: "Compute orbital periods and mechanics" },
  { title: "Atmosphere Composition Calculator", subtitle: "Model atmospheric compositions" },
  { title: "Planet / Moon Cartographer", subtitle: "Map planetary and lunar surfaces" },
];


const ComingSoonCard = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <GlassPanel className="p-4 border-dashed border border-muted opacity-70">
    <div className="flex items-center justify-between mb-1">
      <h3 className="font-heading font-semibold text-sm">{title}</h3>
      <Badge variant="outline" className="text-[10px] shrink-0">Coming Soon</Badge>
    </div>
    <p className="text-xs text-muted-foreground">{subtitle}</p>
  </GlassPanel>
);

const SIGNUP_WELCOME_KEY = "sf-welcome-signup-shown";

const Index = () => {
  const { user, profile } = useAuth();
  const [showArchived, setShowArchived] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSignupWelcome, setShowSignupWelcome] = useState(false);

  // Show signup welcome for brand new accounts (within 5 minutes of creation)
  useEffect(() => {
    if (!user || !profile?.created_at) return;
    try {
      if (localStorage.getItem(SIGNUP_WELCOME_KEY)) return;
      const ageMs = Date.now() - new Date(profile.created_at).getTime();
      if (ageMs < 5 * 60 * 1000) {
        localStorage.setItem(SIGNUP_WELCOME_KEY, "true");
        setShowSignupWelcome(true);
      }
    } catch { /* localStorage unavailable */ }
  }, [user, profile]);

  const { worlds, isLoading, deleteWorld, archiveWorld, unarchiveWorld, allWorldTags } = useWorlds(showArchived);
  const { isSubscribed } = useSubscription();
  const [sortMode, setSortMode] = useState<SortMode>('category');

  const groupedTools = useMemo(() => {
    if (sortMode === 'category') {
      return toolsByCategory.map(({ category, tools }) => {
        const meta = CATEGORY_META[category];
        return { key: category, label: meta.label, color: meta.color, description: meta.description, tools };
      });
    }
    const allTools = toolsByCategory.flatMap(g => g.tools);
    const groups = new Map<string, typeof allTools>();
    for (const tool of allTools) {
      const wiki = TOOL_WIKI[tool.id];
      if (!wiki) continue;
      const key = sortMode === 'type' ? wiki.type : wiki.complexity;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tool);
    }
    const order = sortMode === 'type' ? TYPE_ORDER : COMPLEXITY_ORDER;
    const getMeta = sortMode === 'type'
      ? (k: string) => TYPE_GROUP_META[k as ToolType]
      : (k: string) => COMPLEXITY_GROUP_META[k as ComplexityLevel];
    return order
      .filter(key => groups.has(key))
      .map(key => ({ key, ...getMeta(key), tools: groups.get(key)! }));
  }, [sortMode]);

  // Count archived worlds
  const archivedCount = useMemo(() => {
    return worlds.filter((w) => w.archived_at !== null).length;
  }, [worlds]);

  // Get all unique tags from worlds
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    worlds.forEach((w) => {
      (w.tags || []).forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [worlds]);

  // Filter worlds by selected tags
  const filteredWorlds = useMemo(() => {
    if (selectedTags.length === 0) return worlds;
    return worlds.filter((w) =>
      selectedTags.some((tag) => (w.tags || []).includes(tag))
    );
  }, [worlds, selectedTags]);

  const handleDeleteWorld = (worldId: string) => {
    deleteWorld.mutate(worldId);
  };

  const handleArchiveWorld = (worldId: string) => {
    archiveWorld.mutate(worldId);
  };

  const handleUnarchiveWorld = (worldId: string) => {
    unarchiveWorld.mutate(worldId);
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTags((prev) => [...prev, tag]);
  };

  const handleTagRemove = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleClearTags = () => {
    setSelectedTags([]);
  };

  return (
    <div className="min-h-screen bg-background sf-atmosphere">
      <Header />
      <div className="pt-16">
        <BetaBanner position="top" />
      </div>

      <main className="container mx-auto px-4 pt-8 pb-16 relative z-10">
        <PageBursts bursts={ALL_DASHBOARD_BURSTS} />
        {/* Conditional Hero Section */}
        {!user ? (
          <WelcomeHero />
        ) : (
          <LoggedInHero />
        )}

        {/* Subscription status banner for logged-in users */}
        {user && <SubscriptionBanner />}

        {/* Landing Page Sections - non-logged-in users only */}
        {!user && <SFDivider label="— ·· — SECTOR: WORLDBUILDING — ·· —" className="hidden md:block" />}
        {!user && <VideoShowcase />}
        {!user && (
          <CosmicTelemetry
            data={COORDINATE_DATA}
            variant="horizontal"
            align="center"
            className="my-8"
          />
        )}
        {!user && <HomepageQuote />}
        {!user && <ToolShowcase />}
        {!user && <SFDivider />}
        {!user && <ValueProposition />}

        {/* My Worlds Section - logged-in users only */}
        {user && (
          <section id="worlds" className="mb-16 scroll-mt-24">
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-light text-2xl uppercase tracking-sf-wide">My Worlds</h2>
                <ArchiveToggle
                  showArchived={showArchived}
                  onToggle={setShowArchived}
                  archivedCount={showArchived ? archivedCount : worlds.filter((w) => w.archived_at).length || (allWorldTags.length > 0 ? 0 : 0)}
                />
              </div>
              {availableTags.length > 0 && (
                <TagFilter
                  availableTags={availableTags}
                  selectedTags={selectedTags}
                  onTagSelect={handleTagSelect}
                  onTagRemove={handleTagRemove}
                  onClear={handleClearTags}
                />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CreateWorldButton />

              {isLoading && (
                <GlassPanel className="p-5 h-full min-h-[200px] flex flex-col items-center justify-center">
                  <Loader size="sm" />
                </GlassPanel>
              )}

              {!isLoading && filteredWorlds.length === 0 && (
                <GlassPanel className="p-5 h-full min-h-[200px] flex flex-col items-center justify-center border-dashed border border-muted">
                  <p className="text-sm text-muted-foreground text-center">
                    {selectedTags.length > 0
                      ? "No worlds match the selected tags."
                      : "Your worlds will appear here once you create them."}
                  </p>
                </GlassPanel>
              )}

              {filteredWorlds.map((world) => (
                <WorldCard
                  key={world.id}
                  id={world.id}
                  name={world.name}
                  description={world.description}
                  headerImageUrl={world.header_image_url}
                  headerImageFocusY={world.header_image_focus_y}
                  icon={world.icon}
                  tags={world.tags}
                  archivedAt={world.archived_at}
                  updatedAt={world.updated_at}
                  onDelete={handleDeleteWorld}
                  onArchive={handleArchiveWorld}
                  onUnarchive={handleUnarchiveWorld}
                />
              ))}
            </div>

            {/* Scroll hint */}
            <div className="flex flex-col items-center mt-8 text-tier-4 animate-pulse">
              <span className="font-mono text-[10px] uppercase tracking-[2px]">Scroll</span>
              <ChevronDown className="w-4 h-4 mt-0.5" />
            </div>
          </section>
        )}

        {/* Shared with Me Section */}
        {user && <SharedWorldsSection />}

        {/* Worldbuilding Tools Section - logged-in users only (non-logged-in see ToolShowcase) */}
        {user && (
          <section id="tools" className="mb-16 scroll-mt-24">
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-light text-2xl uppercase tracking-sf-wide">
                  Worldbuilding Tools
                </h2>
                <div className="flex items-center gap-4">
                  <Link
                    to="/getting-started"
                    className="text-xs text-primary hover:text-primary/80 font-heading uppercase tracking-wider transition-colors hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-primary/20 hover:border-primary/40 rounded-sm"
                  >
                    Getting Started?
                  </Link>
                  <Link
                    to="/guide/tools"
                    className="text-xs text-tier-3 hover:text-tier-2 font-heading uppercase tracking-wider transition-colors"
                  >
                    Browse All →
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-1 p-0.5 bg-muted/20 rounded-md border border-border/20 w-fit">
                {([
                  { mode: 'category' as SortMode, label: 'Category' },
                  { mode: 'type' as SortMode, label: 'Type' },
                  { mode: 'complexity' as SortMode, label: 'Difficulty' },
                ]).map(({ mode, label }) => (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => setSortMode(mode)}
                    className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] font-medium rounded transition-all ${
                      sortMode === mode
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {groupedTools.map(({ key, label, color, description, tools: sectionTools }, idx) => (
              <div key={key}>
                {idx > 0 && <SFDivider className="hidden md:block" />}
                <div className="mt-8 first:mt-0 mb-6">
                  <div className="flex items-center gap-2.5 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <h3
                      className="font-heading font-light text-lg uppercase tracking-sf-wide"
                      style={{ color }}
                    >
                      {label}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground ml-[18px]">
                    {description}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sectionTools.map((tool) => {
                    const badge = getToolBadge(tool.id, sortMode);
                    return (
                      <ToolCard
                        key={tool.id}
                        {...tool}
                        category={badge}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            <SFDivider className="hidden md:block" />

            {/* Coming Soon */}
            <div className="mt-8 mb-6 flex items-center justify-between">
              <h3 className="font-heading font-light text-lg uppercase tracking-sf-wide text-muted-foreground">
                Coming Soon
              </h3>
              {isSubscribed && (
                <Link
                  to="/roadmap"
                  className="text-[11px] font-medium uppercase tracking-[1.5px] text-primary/70 hover:text-primary transition-colors duration-300 flex items-center gap-1.5"
                >
                  <Map className="w-3.5 h-3.5" />
                  Vote on the Roadmap
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comingSoonItems.map((tool) => (
                <ComingSoonCard key={tool.title} {...tool} />
              ))}
            </div>

            {/* Quick upgrade card for non-Pro users */}
            {!isSubscribed && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <QuickUpgradeCard />
              </div>
            )}
          </section>
        )}

        {/* Features Section - logged-in users only (non-logged-in see ValueProposition) */}
        {user && (
          <section>
            <BracketPanel color="teal">
            <GlassPanel glow lightArc className="p-8 md:p-12 relative">
              <PageBursts bursts={[
                { content: "AUTH: VERIFIED", position: { top: "8%", right: "4%" }, variant: "status" },
                { content: "SYSTEMS: NOMINAL", position: { top: "18%", left: "3%" }, variant: "coordinates" },
              ]} />
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center md:text-left">
                  <div className="w-12 h-12 rounded-none bg-primary/10 flex items-center justify-center mb-4 mx-auto md:mx-0">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-light text-lg mb-2 uppercase tracking-wider">
                    Cross-Tool Integration
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Data flows between tools. Your spacecraft references your
                    planet's atmosphere automatically.
                  </p>
                </div>
                <div className="text-center md:text-left">
                  <div className="w-12 h-12 rounded-none bg-accent/10 flex items-center justify-center mb-4 mx-auto md:mx-0">
                    <BookOpen className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-heading font-light text-lg mb-2 uppercase tracking-wider">
                    Export & Print
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Generate beautiful PDFs, print-friendly views, and markdown
                    exports of your worldbuilding.
                  </p>
                </div>
                <div className="text-center md:text-left">
                  <div className="w-12 h-12 rounded-none bg-primary/10 flex items-center justify-center mb-4 mx-auto md:mx-0">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-light text-lg mb-2 uppercase tracking-wider">
                    Shareable Links
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Share your worlds with collaborators or readers via read-only
                    links.
                  </p>
                </div>
              </div>
            </GlassPanel>
            </BracketPanel>
          </section>
        )}

        <SFDivider label="— ·· — COMMS: LEARN — ·· —" className="hidden md:block" />

        {/* Latest from Learn - shown to all users */}
        <RecentArticles />
      </main>

      <BetaBanner position="bottom" />

      <Footer />

      {/* Signup welcome dialog (first-time users) */}
      <WelcomeDialog open={showSignupWelcome} onOpenChange={setShowSignupWelcome} variant="signup" />
    </div>
  );
};

export default Index;

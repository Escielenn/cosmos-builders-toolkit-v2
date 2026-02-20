import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  Users,
  Atom,
  Clock,
  BookOpen,
  Cpu,
  Shield,
  Loader2,
  Calculator,
  Rocket,
  Sparkles,
  Dna,
  Sun,
  Crown,
  Unlock,
  Network,
  Orbit,
  Languages,
  Weight,
  Eye,
} from "lucide-react";
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
import { CosmicTelemetry } from "@/components/layout/CosmicVelocityTicker";
import { COORDINATE_DATA } from "@/lib/cosmic-telemetry";
import QuickUpgradeCard from "@/components/subscription/QuickUpgradeCard";
import BetaBanner from "@/components/BetaBanner";
import Footer from "@/components/layout/Footer";
import RecentArticles from "@/components/landing/RecentArticles";
import { TagFilter } from "@/components/dashboard/TagFilter";
import { ArchiveToggle } from "@/components/dashboard/ArchiveToggle";
import SharedWorldsSection from "@/components/dashboard/SharedWorldsSection";
import SFDivider from "@/components/ui/sf-divider";
import { BracketPanel } from "@/components/ui/bracket-panel";
import DataScatter from "@/components/ui/data-scatter";

const tools = [
  {
    id: "environmental-chain-reaction",
    title: "Cascade: Environmental Chain Reaction",
    description:
      "Map how planetary parameters cascade into biology, psychology, culture, and mythology.",
    icon: Globe,
    status: "available" as const,
    week: 1,
  },
  {
    id: "spacecraft-designer",
    title: "Vessel: Lived-In Spacecraft Designer",
    description:
      "Design ships that feel inhabited with cultural context, life support realities, and ship-as-character development.",
    icon: Rocket,
    status: "available" as const,
    week: 2,
  },
  {
    id: "propulsion-consequences-map",
    title: "Impulse: Propulsion Consequences",
    description:
      "Trace how your propulsion system shapes economics, politics, social structures, and psychology.",
    icon: Atom,
    status: "available" as const,
    week: 3,
  },
  {
    id: "planetary-profile",
    title: "Genesis: Planetary Profile",
    description:
      "Define your world's stellar environment, physical characteristics, atmosphere, habitability, and the narrative pressures that shape life.",
    icon: Globe,
    status: "available" as const,
    week: 4,
  },
  {
    id: "space-expansion-modeler",
    title: "Exodus: Space Expansion Modeler",
    description:
      "Model how competing forces shape humanity's expansion beyond Earth across phases of development.",
    icon: Orbit,
    status: "available" as const,
    week: 5,
  },
  {
    id: "xenomythology-framework-builder",
    title: "Mythos: Xenomythology Framework",
    description:
      "Create comprehensive alien mythological systems derived from species biology, environment, and evolutionary pressures.",
    icon: Sparkles,
    status: "available" as const,
    week: 6,
  },
  {
    id: "evolutionary-biology",
    title: "Phylo: Evolutionary Biology",
    description:
      "Design biologically plausible alien species with 13 comprehensive sections covering biochemistry, body plan, cognition, and psychology.",
    icon: Dna,
    status: "available" as const,
    week: 7,
  },
  {
    id: "star-system-builder",
    title: "Orrery: Star System Builder",
    description:
      "Design multi-planet systems with stellar relationships and orbital mechanics.",
    icon: Sun,
    status: "available" as const,
    week: 8,
  },
  {
    id: "empire-designer",
    title: "Dominion: Empire Designer",
    description:
      "Create political structures, governance systems, and internal factions.",
    icon: Crown,
    status: "available" as const,
    week: 9,
  },
  {
    id: "technology-consequences",
    title: "Paradigm: Technology Consequences",
    description:
      "Map how any technology cascades through society, economy, and culture.",
    icon: Cpu,
    status: "available" as const,
    week: 10,
  },
  {
    id: "species-interaction-matrix",
    title: "Symbiosis: Species Interaction Matrix",
    description:
      "Define complex relationships between multiple alien species.",
    icon: Network,
    status: "available" as const,
    week: 11,
  },
  {
    id: "one-big-lie",
    title: "Axiom: The One Big Lie",
    description:
      "Declare your single violation of known physics and trace its consequences across your entire world.",
    icon: Atom,
    status: "available" as const,
    week: 12,
  },
  {
    id: "timeline",
    title: "Timeline",
    description:
      "Plot events across deep time. Build multi-track timelines that reveal how characters, civilizations, and technologies intersect.",
    icon: Clock,
    status: "available" as const,
    week: 18,
  },
  {
    id: "sensorium",
    title: "Sensorium: Alien Sensory Systems",
    description:
      "Design evolutionarily plausible sensory systems for alien species. Derive senses from environmental constraints or validate custom selections.",
    icon: Eye,
    status: "available" as const,
    week: 19,
  },
];

const calculatorTools = [
  {
    id: "drake-equation-calculator",
    title: "Signal: Drake Equation Calculator",
    description:
      "Calculate the number of civilizations in your galaxy. Establish your cosmic context from lonely universe to teeming space opera.",
    icon: Calculator,
    status: "available" as const,
    week: 21,
  },
  {
    id: "time-dilation",
    title: "Paradox: Time Dilation Calculator",
    description:
      "Calculate relativistic time dilation for interstellar journeys. See how fast travel warps time for your characters.",
    icon: Clock,
    status: "available" as const,
    week: 22,
  },
  {
    id: "habitable-zone-calculator",
    title: "Goldilocks: Habitable Zone Calculator",
    description:
      "Calculate habitable zone boundaries for any star. Place your planet and see how orbital position shapes climate, biology, and civilization.",
    icon: Sun,
    status: "available" as const,
    week: 23,
  },
  {
    id: "lexdrift",
    title: "Lexdrift: Language Evolution",
    description:
      "Model how languages evolve during interstellar travel. Calculate divergence rates, predict change types, and generate sample texts.",
    icon: Languages,
    status: "available" as const,
    week: 24,
  },
  {
    id: "surface-gravity-calculator",
    title: "Atlas: Surface Gravity Calculator",
    description:
      "Calculate surface gravity for any planet and trace how weight shapes biology, psychology, culture, and mythology.",
    icon: Weight,
    status: "available" as const,
    week: 25,
  },
  {
    id: "gravitas",
    title: "Gravitas: Gravity Simulator",
    description:
      "Calculate gravity conditions on spacecraft, habitats, and planetary surfaces. Spin, thrust, orbital, and artificial gravity with experiential output.",
    icon: Weight,
    status: "available" as const,
    week: 26,
  },
];

const comingSoonTools = [
  { title: "Character Development", subtitle: "Individual characters connected to your world" },

  { title: "AI Development", subtitle: "Explore artificial intelligence in your universe" },
  { title: "Generation Ship Designer", subtitle: "Design self-sustaining interstellar arks" },
  { title: "Quantum and Beyond", subtitle: "Technology beyond our understanding" },
  { title: "BDO: Big Dumb Object", subtitle: "Create megastructures and cosmic artifacts" },
  { title: "Warp Travel Calculator", subtitle: "Calculate warp-based journey parameters" },
  { title: "K-Scale (Kardashev Scale)", subtitle: "Classify civilizations by energy consumption" },
];

const comingSoonCalculators = [
  { title: "Orbital Mechanics / Year Calculator", subtitle: "Compute orbital periods and mechanics" },
  { title: "Atmosphere Composition Calculator", subtitle: "Model atmospheric compositions" },
];

const comingSoonCartographers = [
  { title: "Solar System Cartographer", subtitle: "Map solar systems" },
  { title: "Planet / Moon Cartographer", subtitle: "Map planetary and lunar surfaces" },
];

const comingSoonSimulators: { title: string; subtitle: string }[] = [];

const ComingSoonCard = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <GlassPanel className="p-4 border-dashed border border-muted opacity-70">
    <div className="flex items-center justify-between mb-1">
      <h3 className="font-heading font-semibold text-sm">{title}</h3>
      <Badge variant="outline" className="text-[10px] shrink-0">Coming Soon</Badge>
    </div>
    <p className="text-xs text-muted-foreground">{subtitle}</p>
  </GlassPanel>
);

const Index = () => {
  const { user } = useAuth();
  const [showArchived, setShowArchived] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { worlds, isLoading, deleteWorld, archiveWorld, unarchiveWorld, allWorldTags } = useWorlds(showArchived);
  const { isSubscribed } = useSubscription();

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
        <DataScatter count={5} />
        {/* Conditional Hero Section */}
        {!user ? (
          <WelcomeHero />
        ) : (
          <LoggedInHero isSubscribed={isSubscribed} />
        )}

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
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
          </section>
        )}

        {/* Shared with Me Section */}
        {user && <SharedWorldsSection />}

        {/* Worldbuilding Tools Section - logged-in users only (non-logged-in see ToolShowcase) */}
        {user && (
          <section id="tools" className="mb-16 scroll-mt-24">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading font-light text-2xl uppercase tracking-sf-wide">
                Worldbuilding Tools
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => (
                <ToolCard key={tool.id} {...tool} />
              ))}
              {comingSoonTools.map((tool) => (
                <ComingSoonCard key={tool.title} {...tool} />
              ))}
            </div>

            <SFDivider className="hidden md:block" />

            {/* Calculators Subsection */}
            <div className="mt-12">
              <h3 className="font-heading font-light text-lg uppercase tracking-sf-wide text-muted-foreground mb-6">
                Calculators
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {calculatorTools.map((tool) => (
                  <ToolCard key={tool.id} {...tool} />
                ))}
                {comingSoonCalculators.map((tool) => (
                  <ComingSoonCard key={tool.title} {...tool} />
                ))}
              </div>
            </div>

            <SFDivider className="hidden md:block" />

            {/* Simulators Subsection */}
            <div className="mt-12">
              <h3 className="font-heading font-light text-lg uppercase tracking-sf-wide text-muted-foreground mb-6">
                Simulators
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link to="/rogue" className="block">
                  <GlassPanel hover className="p-5 h-full flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-orange-500/20 overflow-hidden">
                        <img src="/icons/035-black hole.svg" alt="" className="w-8 h-8" draggable={false} />
                      </div>
                      <div className="flex items-center gap-2">
                        {isSubscribed ? (
                          <Badge variant="secondary" className="group/badge text-xs bg-green-500/20 text-green-600 dark:text-green-400 cursor-default">
                            <Unlock className="w-3 h-3" />
                            <span className="inline-block max-w-0 overflow-hidden opacity-0 group-hover/badge:max-w-[5rem] group-hover/badge:opacity-100 group-hover/badge:ml-1 transition-all duration-300 ease-out whitespace-nowrap">
                              Unlocked
                            </span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            <Crown className="w-3 h-3 mr-1" />
                            Pro
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          Tool 27
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-lg hover:text-primary transition-colors">
                        Rogue: Wandering Object Encounters
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        N-body gravitational encounter simulator. Launch black holes, brown dwarfs, and rogue planets at real star systems.
                      </p>
                    </div>
                  </GlassPanel>
                </Link>
                <Link to="/tools/tidelock" className="block">
                  <GlassPanel hover className="p-5 h-full flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-blue-500/20 overflow-hidden">
                        <img src="/icons/044-day and night.svg" alt="" className="w-8 h-8" draggable={false} />
                      </div>
                      <div className="flex items-center gap-2">
                        {isSubscribed ? (
                          <Badge variant="secondary" className="group/badge text-xs bg-green-500/20 text-green-600 dark:text-green-400 cursor-default">
                            <Unlock className="w-3 h-3" />
                            <span className="inline-block max-w-0 overflow-hidden opacity-0 group-hover/badge:max-w-[5rem] group-hover/badge:opacity-100 group-hover/badge:ml-1 transition-all duration-300 ease-out whitespace-nowrap">
                              Unlocked
                            </span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            <Crown className="w-3 h-3 mr-1" />
                            Pro
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          Tool 28
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-lg hover:text-primary transition-colors">
                        Tidelock: Locked World Simulator
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tidally locked world simulator. Explore habitable zones, atmospheric dynamics, and surface conditions on exoplanets around M-dwarf and K-dwarf stars.
                      </p>
                    </div>
                  </GlassPanel>
                </Link>
                <Link to="/tools/exosky" className="block">
                  <GlassPanel hover className="p-5 h-full flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20 overflow-hidden">
                        <img src="/icons/016-constellation.svg" alt="" className="w-8 h-8" draggable={false} />
                      </div>
                      <div className="flex items-center gap-2">
                        {isSubscribed ? (
                          <Badge variant="secondary" className="group/badge text-xs bg-green-500/20 text-green-600 dark:text-green-400 cursor-default">
                            <Unlock className="w-3 h-3" />
                            <span className="inline-block max-w-0 overflow-hidden opacity-0 group-hover/badge:max-w-[5rem] group-hover/badge:opacity-100 group-hover/badge:ml-1 transition-all duration-300 ease-out whitespace-nowrap">
                              Unlocked
                            </span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            <Crown className="w-3 h-3 mr-1" />
                            Pro
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          Tool 29
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-lg hover:text-primary transition-colors">
                        Exosky: Alien Night Sky
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Alien night sky simulator. View the stars from any exoplanet using real astronomical data and create your own constellations.
                      </p>
                    </div>
                  </GlassPanel>
                </Link>
                {comingSoonSimulators.map((tool) => (
                  <ComingSoonCard key={tool.title} {...tool} />
                ))}
              </div>
            </div>

            <SFDivider className="hidden md:block" />

            {/* Cartographers Subsection */}
            <div className="mt-12">
              <h3 className="font-heading font-light text-lg uppercase tracking-sf-wide text-muted-foreground mb-6">
                Cartographers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link to="/tools/stellar-cartographer" className="block">
                  <GlassPanel hover className="p-5 h-full flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-indigo-500/20 overflow-hidden">
                        <img src="/icons/003-map.svg" alt="" className="w-8 h-8" draggable={false} />
                      </div>
                      <div className="flex items-center gap-2">
                        {isSubscribed ? (
                          <Badge variant="secondary" className="group/badge text-xs bg-green-500/20 text-green-600 dark:text-green-400 cursor-default">
                            <Unlock className="w-3 h-3" />
                            <span className="inline-block max-w-0 overflow-hidden opacity-0 group-hover/badge:max-w-[5rem] group-hover/badge:opacity-100 group-hover/badge:ml-1 transition-all duration-300 ease-out whitespace-nowrap">
                              Unlocked
                            </span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            <Crown className="w-3 h-3 mr-1" />
                            Pro
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          Tool 30
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-lg hover:text-primary transition-colors">
                        Stellar Cartographer: Galaxy Mapper
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Interactive galaxy mapping tool. Generate procedural galaxies with 3D projection, empire territories, trade routes, and wormholes.
                      </p>
                    </div>
                  </GlassPanel>
                </Link>
                {comingSoonCartographers.map((tool) => (
                  <ComingSoonCard key={tool.title} {...tool} />
                ))}
              </div>
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
              <DataScatter count={3} />
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
    </div>
  );
};

export default Index;

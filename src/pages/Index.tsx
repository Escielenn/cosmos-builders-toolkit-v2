import {
  Globe,
  Users,
  Atom,
  BookOpen,
  Cpu,
  Shield,
  Loader2,
  Calculator,
  Rocket,
  Sparkles,
} from "lucide-react";
import Header from "@/components/layout/Header";
import ToolCard from "@/components/dashboard/ToolCard";
import WorldCard from "@/components/dashboard/WorldCard";
import CreateWorldButton from "@/components/dashboard/CreateWorldButton";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useBackground } from "@/hooks/use-background";
import { useAuth } from "@/contexts/AuthContext";
import { useWorlds } from "@/hooks/use-worlds";
import { useSubscription } from "@/hooks/use-subscription";
import WelcomeHero from "@/components/landing/WelcomeHero";
import LoggedInHero from "@/components/landing/LoggedInHero";
import ToolShowcase from "@/components/landing/ToolShowcase";
import ValueProposition from "@/components/landing/ValueProposition";
import ProStatusBanner from "@/components/subscription/ProStatusBanner";
import QuickUpgradeCard from "@/components/subscription/QuickUpgradeCard";

const tools = [
  {
    id: "environmental-chain-reaction",
    title: "Environmental Chain Reaction",
    description:
      "Map how planetary parameters cascade into biology, psychology, culture, and mythology.",
    icon: Globe,
    status: "available" as const,
    week: 1,
  },
  {
    id: "spacecraft-designer",
    title: "Lived-In Spacecraft Designer",
    description:
      "Design ships that feel inhabited with cultural context, life support realities, and ship-as-character development.",
    icon: Rocket,
    status: "available" as const,
    week: 2,
  },
  {
    id: "propulsion-consequences-map",
    title: "Propulsion Consequences Map",
    description:
      "Trace how your propulsion system shapes economics, politics, social structures, and psychology.",
    icon: Atom,
    status: "available" as const,
    week: 3,
  },
  {
    id: "planetary-profile",
    title: "Planetary Profile Template",
    description:
      "Define your world's stellar environment, physical characteristics, atmosphere, habitability, and the narrative pressures that shape life.",
    icon: Globe,
    status: "available" as const,
    week: 4,
  },
  {
    id: "drake-equation-calculator",
    title: "Drake Equation Calculator",
    description:
      "Calculate the number of civilizations in your galaxy. Establish your cosmic context from lonely universe to teeming space opera.",
    icon: Calculator,
    status: "available" as const,
    week: 5,
  },
  {
    id: "xenomythology-framework-builder",
    title: "Xenomythology Framework Builder",
    description:
      "Create comprehensive alien mythological systems derived from species biology, environment, and evolutionary pressures.",
    icon: Sparkles,
    status: "available" as const,
    week: 6,
  },
  {
    id: "species-creator",
    title: "Species Creator",
    description:
      "Design alien species with consistent biology and evolutionary history.",
    icon: Users,
    status: "coming-soon" as const,
    week: 7,
  },
  {
    id: "culture-designer",
    title: "Culture Designer",
    description:
      "Build societies with coherent values, rituals, and social structures.",
    icon: BookOpen,
    status: "coming-soon" as const,
    week: 8,
  },
  {
    id: "technology-mapper",
    title: "Technology Mapper",
    description: "Map technological capabilities and their societal impacts.",
    icon: Cpu,
    status: "coming-soon" as const,
    week: 9,
  },
];

const Index = () => {
  // Initialize background hook to apply stored preference
  useBackground();

  const { user } = useAuth();
  const { worlds, isLoading, deleteWorld } = useWorlds();
  const { isSubscribed } = useSubscription();

  const handleDeleteWorld = (worldId: string) => {
    deleteWorld.mutate(worldId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Conditional Hero Section */}
        {!user ? (
          <WelcomeHero />
        ) : (
          <LoggedInHero isSubscribed={isSubscribed} />
        )}

        {/* Pro Status Banner - logged-in users only */}
        {user && <ProStatusBanner isSubscribed={isSubscribed} />}

        {/* Landing Page Sections - non-logged-in users only */}
        {!user && <ToolShowcase />}
        {!user && <ValueProposition />}

        {/* My Worlds Section - logged-in users only */}
        {user && (
          <section id="worlds" className="mb-16 scroll-mt-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-semibold">My Worlds</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CreateWorldButton />

              {isLoading && (
                <GlassPanel className="p-5 h-full min-h-[200px] flex flex-col items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </GlassPanel>
              )}

              {!isLoading && worlds.length === 0 && (
                <GlassPanel className="p-5 h-full min-h-[200px] flex flex-col items-center justify-center border-dashed border border-muted">
                  <p className="text-sm text-muted-foreground text-center">
                    Your worlds will appear here once you create them.
                  </p>
                </GlassPanel>
              )}

              {worlds.map((world) => (
                <WorldCard
                  key={world.id}
                  id={world.id}
                  name={world.name}
                  description={world.description}
                  headerImageUrl={world.header_image_url}
                  icon={world.icon}
                  updatedAt={world.updated_at}
                  onDelete={handleDeleteWorld}
                />
              ))}
            </div>
          </section>
        )}

        {/* Worldbuilding Tools Section - logged-in users only (non-logged-in see ToolShowcase) */}
        {user && (
          <section id="tools" className="mb-16 scroll-mt-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-semibold">
                Worldbuilding Tools
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool) => (
                <ToolCard key={tool.id} {...tool} />
              ))}
              {/* Quick upgrade card for non-Pro users */}
              {!isSubscribed && <QuickUpgradeCard />}
            </div>
          </section>
        )}

        {/* Features Section - logged-in users only (non-logged-in see ValueProposition) */}
        {user && (
          <section>
            <GlassPanel glow className="p-8 md:p-12">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center md:text-left">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto md:mx-0">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">
                    Cross-Tool Integration
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Data flows between tools. Your spacecraft references your
                    planet's atmosphere automatically.
                  </p>
                </div>
                <div className="text-center md:text-left">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 mx-auto md:mx-0">
                    <BookOpen className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">
                    Export & Print
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Generate beautiful PDFs, print-friendly views, and markdown
                    exports of your worldbuilding.
                  </p>
                </div>
                <div className="text-center md:text-left">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto md:mx-0">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">
                    Shareable Links
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Share your worlds with collaborators or readers via read-only
                    links.
                  </p>
                </div>
              </div>
            </GlassPanel>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 StellarForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

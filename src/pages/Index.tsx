import {
  Rocket,
  Globe,
  Users,
  Atom,
  BookOpen,
  Cpu,
  Shield,
} from "lucide-react";
import Header from "@/components/layout/Header";
import ToolCard from "@/components/dashboard/ToolCard";
import CreateWorldButton from "@/components/dashboard/CreateWorldButton";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { useBackground } from "@/hooks/use-background";

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
    id: "species-creator",
    title: "Species Creator",
    description:
      "Design alien species with consistent biology and evolutionary history.",
    icon: Users,
    status: "coming-soon" as const,
    week: 4,
  },
  {
    id: "culture-designer",
    title: "Culture Designer",
    description:
      "Build societies with coherent values, rituals, and social structures.",
    icon: BookOpen,
    status: "coming-soon" as const,
    week: 5,
  },
  {
    id: "technology-mapper",
    title: "Technology Mapper",
    description: "Map technological capabilities and their societal impacts.",
    icon: Cpu,
    status: "coming-soon" as const,
    week: 6,
  },
];

const Index = () => {
  // Initialize background hook to apply stored preference
  useBackground();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Build <span className="gradient-text">Lived-In</span> Worlds
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Comprehensive worldbuilding tools for science fiction creators.
            Design spacecraft, planets, cultures, and more with internal
            consistency.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="gap-2">
              <Rocket className="w-4 h-4" />
              Get Started
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Learn More
            </Button>
          </div>
        </section>

        {/* My Worlds Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-semibold">My Worlds</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CreateWorldButton />
            <GlassPanel className="p-5 h-full min-h-[200px] flex flex-col items-center justify-center border-dashed border border-muted">
              <p className="text-sm text-muted-foreground text-center">
                Your worlds will appear here once you create them.
              </p>
            </GlassPanel>
          </div>
        </section>

        {/* Worldbuilding Tools Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-semibold">
              Worldbuilding Tools
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <ToolCard key={tool.id} {...tool} />
            ))}
          </div>
        </section>

        {/* Features Section */}
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
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © 2026 Jason D. Batt, Ph.D. •{" "}
            <a
              href="https://jbatt.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              jbatt.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

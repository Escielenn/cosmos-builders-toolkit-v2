import { Rocket, CreditCard, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/glass-panel";

const ShowcaseHero = () => {
  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          {/* Badge */}
          <Badge className="mb-8 sf-reveal sf-reveal-1" variant="secondary">
            <Sparkles className="w-3 h-3 mr-1" />
            SYSTEMS OVERVIEW
          </Badge>

          {/* Headline */}
          <h1 className="font-display font-light text-4xl md:text-5xl lg:text-7xl mb-6 leading-tight sf-reveal sf-reveal-2">
            <span className="uppercase tracking-sf-wide">INSTRUMENT</span>
            <br />
            <span className="gradient-text uppercase tracking-sf-wide">MANIFEST</span>
          </h1>

          {/* Subhead */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed sf-reveal sf-reveal-3">
            Every parameter cascades. Every choice has consequences. Build worlds
            where the physics shapes the environment, the environment shapes the biology,
            and the biology shapes the culture.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 justify-center sf-reveal sf-reveal-4">
            <Button size="lg" className="gap-2 text-base px-8" asChild>
              <Link to="/auth">
                <Rocket className="w-5 h-5" />
                Start Free
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="gap-2 text-base px-8" asChild>
              <Link to="/pricing">
                <CreditCard className="w-5 h-5" />
                View Pricing
              </Link>
            </Button>
          </div>
        </div>

        {/* Animated Dashboard Preview */}
        <div className="max-w-5xl mx-auto sf-reveal sf-reveal-5">
          <GlassPanel lightArc className="p-6 md:p-8">
            <DashboardMockup />
          </GlassPanel>
        </div>
      </div>
    </section>
  );
};

/**
 * Animated dashboard mockup showing floating tool cards
 */
const DashboardMockup = () => {
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-sf-void/50">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-30" />

      {/* Floating tool cards */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid grid-cols-3 gap-4 md:gap-6 p-4 md:p-8">
          {/* Tool card mockups with staggered animations */}
          <MockToolCard
            title="Drake Equation"
            value="N = 42"
            delay={0}
            color="cyan"
          />
          <MockToolCard
            title="Planetary Profile"
            value="Earth-like"
            delay={0.2}
            color="amber"
          />
          <MockToolCard
            title="Xenomythology"
            value="12 Archetypes"
            delay={0.4}
            color="violet"
          />
          <MockToolCard
            title="ECR Cascade"
            value="5 Levels"
            delay={0.6}
            color="emerald"
          />
          <MockToolCard
            title="Spacecraft"
            value="ISV Aurora"
            delay={0.8}
            color="azure"
          />
          <MockToolCard
            title="Evolutionary Bio"
            value="Carbon-based"
            delay={1.0}
            color="magenta"
          />
        </div>
      </div>

      {/* Subtle scan line accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>
    </div>
  );
};

interface MockToolCardProps {
  title: string;
  value: string;
  delay: number;
  color: "cyan" | "amber" | "violet" | "emerald" | "azure" | "magenta";
}

const MockToolCard = ({ title, value, delay, color }: MockToolCardProps) => {
  const colorMap = {
    cyan: "border-sf-cyan/30",
    amber: "border-amber-500/30",
    violet: "border-sf-violet/30",
    emerald: "border-sf-emerald/30",
    azure: "border-sf-azure/30",
    magenta: "border-sf-magenta/30",
  };

  const textColorMap = {
    cyan: "text-sf-cyan",
    amber: "text-amber-500",
    violet: "text-sf-violet",
    emerald: "text-sf-emerald",
    azure: "text-sf-azure",
    magenta: "text-sf-magenta",
  };

  return (
    <div
      className={`
        bg-sf-surface/80 backdrop-blur-sm border rounded-lg p-3 md:p-4
        transform transition-all duration-500
        hover:scale-105 hover:z-10
        ${colorMap[color]}
      `}
      style={{
        animation: `float-card 3s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
        {title}
      </div>
      <div className={`text-sm md:text-base font-heading font-light ${textColorMap[color]}`}>
        {value}
      </div>
    </div>
  );
};

export default ShowcaseHero;

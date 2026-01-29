import { Crown, Zap, Link2, FileDown, Infinity } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: Zap,
    title: "4 Additional Pro Tools",
    description:
      "Access Planetary Profile, Drake Equation Calculator, Xenomythology Framework, and Evolutionary Biology Design Sheet.",
  },
  {
    icon: Link2,
    title: "Cross-Tool Integration",
    description:
      "Link worksheets together. Your spacecraft references your planet's atmosphere automatically.",
  },
  {
    icon: FileDown,
    title: "Professional Exports",
    description:
      "Generate beautiful PDFs, print-friendly summaries, and detailed full reports of your worldbuilding.",
  },
  {
    icon: Infinity,
    title: "Unlimited Worlds",
    description:
      "Create as many worlds and worksheets as you need. Build entire galaxies of interconnected settings.",
  },
];

const ProAdvantageSection = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6">
          <Crown className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-amber-500 uppercase tracking-wider">
            Pro Subscription
          </span>
        </div>
        <h2 className="font-display font-light text-3xl md:text-4xl uppercase tracking-sf-wide mb-4">
          Why Go Pro?
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Unlock the full power of StellarForge with tools designed for serious worldbuilders.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <GlassPanel
              key={benefit.title}
              lightArc
              className="p-6 sf-reveal"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-display font-light text-lg mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </GlassPanel>
          );
        })}
      </div>

      <div className="text-center">
        <Button
          size="lg"
          className="gap-2 bg-amber-500 hover:bg-amber-600 text-black"
          asChild
        >
          <Link to="/pricing">
            <Crown className="w-4 h-4" />
            See Pricing
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground mt-3">
          Starting at $9/month • Cancel anytime
        </p>
      </div>
    </section>
  );
};

export default ProAdvantageSection;

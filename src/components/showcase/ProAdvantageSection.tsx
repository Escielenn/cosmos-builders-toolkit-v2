import { Crown, Zap, Link2, FileDown, Infinity as InfinityIcon, ExternalLink, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { PRO_TOOL_IDS, PRICING } from "@/lib/tools-config";

const benefits = [
  {
    icon: Zap,
    title: `${PRO_TOOL_IDS.length} Additional Pro Tools`,
    description:
      "Access Planetary Profile, Star System Builder, Empire Designer, Drake Equation, Xenomythology Framework, Evolutionary Biology, Technology Consequences, and Species Interaction Matrix.",
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
      "Generate PDFs, Word docs, plain text, and JSON. Export directly to your Notion workspace.",
  },
  {
    icon: ExternalLink,
    title: "Notion Integration",
    description:
      "Connect your Notion workspace and export worksheets as pages. Your worldbuilding, where you work.",
  },
  {
    icon: InfinityIcon,
    title: "Unlimited Worlds",
    description:
      "Create as many worlds and worksheets as you need. Build entire galaxies of interconnected settings.",
  },
  {
    icon: GraduationCap,
    title: "Worldbuilding Courses",
    description:
      "Free video courses on science fiction worldbuilding, included with your Pro membership.",
    comingSoon: true,
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
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-display font-light text-lg">
                      {benefit.title}
                    </h3>
                    {benefit.comingSoon && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
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
          Starting at ${PRICING.monthly.price}/month • Cancel anytime
        </p>
      </div>
    </section>
  );
};

export default ProAdvantageSection;

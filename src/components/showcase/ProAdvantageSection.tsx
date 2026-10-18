import { Zap, BookOpen, FileDown, Users, Palette, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { PRO_TOOL_COUNT, SIMULATOR_COUNT, PRICING } from "@/lib/tools-config";

// Only what Pro actually gates (see src/lib/plan-features.ts). The Studio,
// Codex, Chronicle, Compile and worksheet exports are free for every account,
// and no world limit exists on any plan.
const benefits = [
  {
    icon: Zap,
    title: `${PRO_TOOL_COUNT} Additional Pro Instruments`,
    description:
      `All ${SIMULATOR_COUNT} simulators (Rogue, Tidelock, Exosky, ExoForge, Solaris), both cartographers, Genesis, Orrery, Phylo, Mythos, Lexdrift, Dossier, Dominion and the rest of the catalog.`,
  },
  {
    icon: BookOpen,
    title: "World Bible",
    description:
      "Generate a single PDF of an entire world: its worksheets and notes, laid out as a reference document.",
  },
  {
    icon: FileDown,
    title: "Full-World Exports",
    description:
      "Export a whole world as a Word document, a Markdown archive with wiki links, or a Scrivener 3 project.",
  },
  {
    icon: Users,
    title: "Collaborators",
    description:
      "Invite others into a world as viewers or editors.",
  },
  {
    icon: Palette,
    title: "World Appearance",
    description:
      "Give each world its own accent colour, icon and cover image, and play your own uploaded audio while you work.",
  },
  {
    icon: GraduationCap,
    title: "Worldbuilding Courses",
    description:
      "Free video courses on science fiction worldbuilding, included with your Pro Access.",
    comingSoon: true,
  },
];

const ProAdvantageSection = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-sf-amber/10 border border-sf-amber mb-6">
          <Zap className="w-4 h-4 text-sf-amber-text" />
          <span className="text-sm text-sf-amber-text uppercase tracking-wider">
            Pro Access
          </span>
        </div>
        <h2 className="font-display font-light text-3xl md:text-4xl uppercase tracking-wide mb-4">
          Why Go Pro?
        </h2>
        <p className="text-t2 max-w-2xl mx-auto">
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
                <div className="w-12 h-12 rounded-none bg-sf-amber/[0.06] border border-sf-amber flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-sf-amber-text" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-heading font-light text-lg">
                      {benefit.title}
                    </h3>
                    {benefit.comingSoon && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-t2">
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
          className="gap-2 bg-sf-amber text-sf-on-amber hover:bg-sf-amber hover:shadow-sf-glow-amber"
          asChild
        >
          <Link to="/pricing">
            <Zap className="w-4 h-4" />
            See Pricing
          </Link>
        </Button>
        <p className="text-sm text-t2 mt-3">
          Starting at ${PRICING.pro.monthly.price}/month • Cancel anytime
        </p>
      </div>
    </section>
  );
};

export default ProAdvantageSection;

import { Link } from "react-router-dom";
import { Sparkles, Wrench, Compass, BookOpen, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GuideNav } from "@/components/layout/GuideNav";
import { TOTAL_TOOL_COUNT } from "@/lib/tools-config";
import { useMetaTags } from "@/hooks/use-meta-tags";

// ── Hub card data ──────────────────────────────────────────

const SECTIONS = [
  {
    title: "Getting Started",
    description:
      "Learn the Environmental Cascade principle and build your first world through a guided 4-step pathway.",
    to: "/getting-started",
    icon: Sparkles,
    accent: "text-sf-emerald-text",
    accentBorder: "group-hover:border-sf-emerald",
    accentBar: "bg-sf-emerald/60",
  },
  {
    title: "Tool Reference",
    description: `Browse all ${TOTAL_TOOL_COUNT} tools by category, cascade position, complexity, or workshop week.`,
    to: "/guide/tools",
    icon: Wrench,
    accent: "text-sf-primary-text",
    accentBorder: "group-hover:border-sf-primary",
    accentBar: "bg-sf-primary/60",
  },
  {
    title: "Field Manual",
    description:
      "Platform navigation, sharing, keyboard shortcuts, and operational systems.",
    to: "/guide/field-manual",
    icon: Compass,
    accent: "text-sf-azure-text",
    accentBorder: "group-hover:border-sf-azure",
    accentBar: "bg-sf-azure/60",
  },
  {
    title: "SF University",
    description:
      "Articles, simulator science explainers, and worldbuilding courses.",
    to: "/learn",
    icon: BookOpen,
    accent: "text-sf-stellar-text",
    accentBorder: "group-hover:border-sf-stellar",
    accentBar: "bg-sf-stellar/60",
  },
];

// ── Component ──────────────────────────────────────────────

const Guide = () => {
  useMetaTags({ title: "Guide" });
  return (
    <div className="min-h-screen bg-sf-void sf-atmosphere">
      <Header />

      <main className="relative container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <GuideNav />

        {/* Page header */}
        <header className="text-center mb-12">
          <div className="font-mono text-xs uppercase tracking-wide text-sf-primary-text mb-3">
            // Navigation Systems
          </div>
          <h1 className="font-display text-sf-h1 tracking-title text-t1 mb-3">
            STELLARFORGE GUIDE
          </h1>
          <p className="text-sm text-t2 max-w-lg mx-auto leading-relaxed">
            All systems reference. All courses charted.
          </p>
        </header>

        {/* Section cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.to} to={section.to} className="group">
                <GlassPanel
                  className={`p-6 h-full relative overflow-hidden transition-all duration-slow group-hover:-translate-y-0.5 ${section.accentBorder}`}
                >
                  {/* Bottom accent bar */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-[2px] ${section.accentBar} scale-x-0 origin-left transition-transform duration-slow group-hover:scale-x-100`}
                  />

                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 ${section.accent}`}>
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-heading text-sm font-light uppercase tracking-wide text-t1 mb-2 flex items-center gap-2">
                        {section.title}
                        <ChevronRight className="w-3.5 h-3.5 text-t4 transition-transform duration-slow group-hover:translate-x-0.5" />
                      </h2>
                      <p className="text-xs text-t3 leading-relaxed">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </GlassPanel>
              </Link>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Guide;

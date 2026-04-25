import { Link } from "react-router-dom";
import { Sparkles, Wrench, Compass, BookOpen, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GuideNav } from "@/components/layout/GuideNav";

// ── Hub card data ──────────────────────────────────────────

const SECTIONS = [
  {
    title: "Getting Started",
    description:
      "Learn the Environmental Cascade principle and build your first world through a guided 4-step pathway.",
    to: "/getting-started",
    icon: Sparkles,
    accent: "text-sf-emerald",
    accentBorder: "group-hover:border-emerald-400/20",
    accentBar: "bg-emerald-400/60",
  },
  {
    title: "Tool Reference",
    description:
      "Browse all 25 instruments by category, cascade position, complexity, or workshop week.",
    to: "/guide/tools",
    icon: Wrench,
    accent: "text-primary",
    accentBorder: "group-hover:border-primary/20",
    accentBar: "bg-primary/60",
  },
  {
    title: "Field Manual",
    description:
      "Platform navigation, sharing, keyboard shortcuts, and operational systems.",
    to: "/guide/field-manual",
    icon: Compass,
    accent: "text-[#4D9FFF]",
    accentBorder: "group-hover:border-[#4D9FFF]/20",
    accentBar: "bg-[#4D9FFF]/60",
  },
  {
    title: "SF University",
    description:
      "Articles, simulator science explainers, and worldbuilding courses.",
    to: "/learn",
    icon: BookOpen,
    accent: "text-[#5B8DEF]",
    accentBorder: "group-hover:border-[#5B8DEF]/20",
    accentBar: "bg-[#5B8DEF]/60",
  },
];

// ── Component ──────────────────────────────────────────────

const Guide = () => {
  return (
    <div className="min-h-screen bg-background sf-atmosphere">
      <Header />

      <main className="relative container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <GuideNav />

        {/* Page header */}
        <header className="text-center mb-12">
          <div className="font-mono text-[9px] uppercase tracking-[3px] text-primary/40 mb-3">
            // Navigation Systems
          </div>
          <h1 className="font-display text-3xl md:text-4xl tracking-sf-title text-t1 mb-3">
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
                  className={`p-6 h-full relative overflow-hidden transition-all duration-300 group-hover:-translate-y-0.5 ${section.accentBorder}`}
                >
                  {/* Bottom accent bar */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-[2px] ${section.accentBar} scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100`}
                  />

                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 ${section.accent}`}>
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-heading text-sm font-light uppercase tracking-[2px] text-t1 mb-2 flex items-center gap-2">
                        {section.title}
                        <ChevronRight className="w-3.5 h-3.5 text-t4 transition-transform duration-300 group-hover:translate-x-0.5" />
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

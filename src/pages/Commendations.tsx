import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { SectionHero } from "@/components/ui/section-hero";
import { BADGE_DEFINITIONS, type BadgeTier, type BadgeCategory } from "@/lib/badges/definitions";
import { TIER_STYLES, TIER_LABELS } from "@/lib/badges/tiers";
import { useEarnedBadges } from "@/hooks/use-badges";
import { BadgeCard } from "@/components/badges/BadgeCard";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

const TIER_ORDER: BadgeTier[] = ["nascent", "forming", "stellar", "legendary"];
const CATEGORY_ORDER: BadgeCategory[] = ["exploration", "consistency", "depth"];

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  exploration: "Exploration",
  consistency: "Consistency",
  depth: "Depth",
};

const CATEGORY_DESCRIPTIONS: Record<BadgeCategory, string> = {
  exploration: "Charting new territory: worlds created, tools discovered, connections made.",
  consistency: "The discipline of return: streaks held, words committed, habits forged.",
  depth: "Mastery through layers: cascade thinking, cross-tool synthesis, architectural vision.",
};

export default function Commendations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { earnedSet, earnedMap, isLoading } = useEarnedBadges();
  const [activeCategory, setActiveCategory] = useState<BadgeCategory | null>(null);

  // Refs for category sections to scroll to
  const categorySectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const earnedCount = earnedSet.size;
  const totalCount = BADGE_DEFINITIONS.length;

  // Filter badges by active category, then group by tier
  const filteredBadges = activeCategory
    ? BADGE_DEFINITIONS.filter((b) => b.category === activeCategory)
    : BADGE_DEFINITIONS;

  const badgesByTier = TIER_ORDER.map((tier) => ({
    tier,
    badges: filteredBadges.filter((b) => b.tier === tier),
  })).filter(({ badges }) => badges.length > 0);

  // Count earned per category
  const categoryStats = CATEGORY_ORDER.map((cat) => {
    const total = BADGE_DEFINITIONS.filter((b) => b.category === cat).length;
    const earned = BADGE_DEFINITIONS.filter((b) => b.category === cat && earnedSet.has(b.id)).length;
    return { category: cat, total, earned };
  });

  const handleCategoryClick = (category: BadgeCategory) => {
    if (activeCategory === category) {
      setActiveCategory(null);
    } else {
      setActiveCategory(category);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-t3 font-sans text-sm">Sign in to view your commendations.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28">
          {/* Back nav */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-t4 hover:text-t2 mb-6 -ml-2"
            onClick={() => navigate("/profile")}
          >
            <ArrowLeft className="w-4 h-4" />
            Profile
          </Button>

          {/* Header */}
          <SectionHero
            eyebrow="// COMMENDATIONS"
            title={<>Marks of <span className="text-sf-teal">progress.</span></>}
            subtitle="Each commendation is earned through use: worlds built, words written, systems explored. The cascade rewards the doer, not the visitor."
            className="mb-12"
          />

          {/* Progress overview */}
          <GlassPanel className="p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="font-heading text-xs uppercase tracking-[3px] text-emerald">
                Overall Progress
              </span>
              <span className="font-mono text-sm text-t1">
                {earnedCount} / {totalCount}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/[0.04] rounded-none overflow-hidden mb-6">
              <div
                className="h-full bg-primary/60 transition-all duration-700"
                style={{ width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%` }}
              />
            </div>

            {/* Category breakdown, clickable filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {categoryStats.map(({ category, total, earned }) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryClick(category)}
                    className={cn(
                      "border p-4 text-left transition-all duration-200 group",
                      isActive
                        ? "border-primary bg-primary/[0.04]"
                        : "border-sf-line hover:border-sf-line hover:bg-white/[0.02]"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "font-heading text-[12px] uppercase tracking-[2px] transition-colors",
                        isActive ? "text-primary" : "text-t2 group-hover:text-t1"
                      )}>
                        {CATEGORY_LABELS[category]}
                      </span>
                      <span className="font-mono text-[12px] text-t4">
                        {earned}/{total}
                      </span>
                    </div>
                    <p className="font-sans text-[12px] text-t4 leading-relaxed">
                      {CATEGORY_DESCRIPTIONS[category]}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Active filter indicator */}
            {activeCategory && (
              <div className="mt-4 flex items-center gap-2">
                <span className="font-mono text-[12px] uppercase tracking-wider text-t4">
                  Showing:
                </span>
                <span className="font-heading text-[12px] uppercase tracking-[2px] text-primary">
                  {CATEGORY_LABELS[activeCategory]}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveCategory(null)}
                  className="font-mono text-[12px] uppercase tracking-wider text-t4 hover:text-t2 ml-auto transition-colors"
                >
                  Show All
                </button>
              </div>
            )}
          </GlassPanel>

          {/* Badges by tier */}
          {isLoading ? (
            <div className="py-12">
              <p className="font-mono text-[12px] uppercase tracking-wider text-white/[0.15] text-center">
                Loading commendations...
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {badgesByTier.map(({ tier, badges }) => {
                const tierStyle = TIER_STYLES[tier];
                const tierEarned = badges.filter((b) => earnedSet.has(b.id)).length;

                return (
                  <section key={tier}>
                    {/* Tier header */}
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className={cn(
                          "font-mono text-[12px] uppercase tracking-wider px-2 py-1 rounded-sm border",
                          tierStyle.bg,
                          tierStyle.border,
                          tierStyle.text
                        )}
                      >
                        {TIER_LABELS[tier]}
                      </span>
                      <div className="flex-1 h-px bg-white/[0.06]" />
                      <span className="font-mono text-[12px] text-t4">
                        {tierEarned} / {badges.length}
                      </span>
                    </div>

                    {/* Badge grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {badges.map((badge) => (
                        <BadgeCard
                          key={badge.id}
                          definition={badge}
                          earned={earnedSet.has(badge.id)}
                          earnedAt={earnedMap.get(badge.id)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

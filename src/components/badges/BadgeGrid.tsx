import { BADGE_DEFINITIONS } from "@/lib/badges/definitions";
import { useEarnedBadges } from "@/hooks/use-badges";
import { BadgeCard } from "./BadgeCard";

export function BadgeGrid() {
  const { earnedSet, earnedMap, isLoading } = useEarnedBadges();

  if (isLoading) {
    return (
      <div className="py-4">
        <p className="font-mono text-[10px] uppercase tracking-wider text-white/[0.15] text-center">
          Loading commendations...
        </p>
      </div>
    );
  }

  const earnedCount = earnedSet.size;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-sm uppercase tracking-[3px] text-emerald">
          Commendations
        </h3>
        <span className="font-mono text-[11px] text-white/[0.28]">
          {earnedCount} / {BADGE_DEFINITIONS.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {BADGE_DEFINITIONS.map((badge) => (
          <BadgeCard
            key={badge.id}
            definition={badge}
            earned={earnedSet.has(badge.id)}
            earnedAt={earnedMap.get(badge.id)}
          />
        ))}
      </div>
    </div>
  );
}

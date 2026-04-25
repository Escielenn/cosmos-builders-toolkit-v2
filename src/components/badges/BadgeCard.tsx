import { cn } from "@/lib/utils";
import type { BadgeDefinition } from "@/lib/badges/definitions";
import { TIER_STYLES, TIER_LABELS } from "@/lib/badges/tiers";

interface BadgeCardProps {
  definition: BadgeDefinition;
  earned: boolean;
  earnedAt?: string;
}

export function BadgeCard({ definition, earned, earnedAt }: BadgeCardProps) {
  const tier = TIER_STYLES[definition.tier];
  const Icon = definition.icon;

  if (!earned) {
    return (
      <div
        className={cn(
          "rounded-none border p-4 flex items-start gap-3",
          "bg-white/[0.01] border-white/[0.06]"
        )}
      >
        <div className="shrink-0 mt-0.5">
          <Icon className="w-5 h-5 text-white/[0.15]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-[12px] uppercase tracking-[2px] text-white/[0.28]">
            {definition.name}
          </p>
          <p className="font-sans text-[11px] text-white/[0.15] mt-0.5">
            {definition.lockedHint}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-none border p-4 flex items-start gap-3",
        tier.bg,
        tier.border,
        tier.glow,
        tier.animation
      )}
    >
      <div className="shrink-0 mt-0.5">
        <Icon className={cn("w-5 h-5", tier.text)} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("font-heading text-[12px] uppercase tracking-[2px] text-t1")}>
            {definition.name}
          </p>
          <span
            className={cn(
              "font-mono text-[7px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm border",
              tier.bg,
              tier.border,
              tier.text
            )}
          >
            {TIER_LABELS[definition.tier]}
          </span>
        </div>
        <p className="font-sans text-[11px] text-t2 mt-0.5">
          {definition.description}
        </p>
        {earnedAt && (
          <p className="font-mono text-[9px] text-white/[0.28] mt-1.5">
            {new Date(earnedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

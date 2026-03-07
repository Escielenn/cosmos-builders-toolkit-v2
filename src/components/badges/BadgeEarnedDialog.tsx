import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBadgeContext } from "@/contexts/BadgeContext";
import { BADGE_MAP } from "@/lib/badges/definitions";
import { TIER_STYLES, TIER_LABELS } from "@/lib/badges/tiers";
import { cn } from "@/lib/utils";

export function BadgeEarnedDialog() {
  const { pendingBadgeIds, dismissNext } = useBadgeContext();

  const currentId = pendingBadgeIds[0];
  const badge = currentId ? BADGE_MAP.get(currentId) : undefined;

  if (!badge) return null;

  const tier = TIER_STYLES[badge.tier];
  const Icon = badge.icon;

  return (
    <Dialog open={!!currentId} onOpenChange={() => dismissNext()}>
      <DialogContent
        className={cn(
          "rounded-none max-w-sm border bg-[#0E1320]/95 backdrop-blur-xl",
          tier.border,
          tier.glow
        )}
      >
        <div className="flex flex-col items-center text-center py-4 gap-4">
          {/* Tier label */}
          <span
            className={cn(
              "font-mono text-[8px] uppercase tracking-[3px] px-2 py-1 rounded-sm border",
              tier.bg,
              tier.border,
              tier.text
            )}
          >
            {TIER_LABELS[badge.tier]}
          </span>

          {/* Icon */}
          <div className={cn("p-3", tier.animation)}>
            <Icon className={cn("w-12 h-12", tier.text)} />
          </div>

          {/* Badge name */}
          <h2 className="font-heading text-xl uppercase tracking-[2px] text-tier-1">
            {badge.name}
          </h2>

          {/* Description */}
          <p className="font-sans text-sm text-tier-2 max-w-[280px]">
            {badge.description}
          </p>

          {/* Tier-specific earn message */}
          <p className={cn("font-mono text-[10px] italic tracking-wide", tier.text)}>
            {tier.earnMessage}
          </p>

          {/* Acknowledge button */}
          <Button
            onClick={dismissNext}
            className="mt-2 font-sans rounded-none"
          >
            Acknowledged
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

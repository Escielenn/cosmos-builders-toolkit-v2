// ---------------------------------------------------------------------------
// LicenseBadge, Shows license type with color coding and tooltip
// ---------------------------------------------------------------------------

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const LICENSE_META: Record<
  string,
  { label: string; tone: string; tip: string }
> = {
  cc_by: {
    label: "CC BY",
    tone: "bg-sf-teal/[0.06] border-sf-teal text-sf-teal-text",
    tip: "Creative Commons Attribution -- fork and remix with credit.",
  },
  cc_by_sa: {
    label: "CC BY-SA",
    tone: "bg-sf-azure/[0.06] border-sf-azure text-sf-azure-text",
    tip: "Creative Commons Attribution-ShareAlike -- forks must use the same license.",
  },
  cc_by_nc: {
    label: "CC BY-NC",
    tone: "bg-sf-violet/[0.06] border-sf-violet text-sf-violet-text",
    tip: "Creative Commons Attribution-NonCommercial -- non-commercial use only.",
  },
  view_only: {
    label: "View Only",
    tone: "bg-sf-amber/[0.06] border-sf-amber text-sf-amber-text",
    tip: "This world cannot be forked. View and admire only.",
  },
};

interface LicenseBadgeProps {
  license: string;
  className?: string;
}

export default function LicenseBadge({ license, className }: LicenseBadgeProps) {
  const meta = LICENSE_META[license] || LICENSE_META.cc_by;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={`font-mono text-xs cursor-default ${meta.tone} ${className ?? ""}`}
        >
          {meta.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-xs">
        {meta.tip}
      </TooltipContent>
    </Tooltip>
  );
}

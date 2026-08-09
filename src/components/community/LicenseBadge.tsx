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
  { label: string; color: string; tip: string }
> = {
  cc_by: {
    label: "CC BY",
    color: "#15C17B",
    tip: "Creative Commons Attribution -- fork and remix with credit.",
  },
  cc_by_sa: {
    label: "CC BY-SA",
    color: "#4D9FFF",
    tip: "Creative Commons Attribution-ShareAlike -- forks must use the same license.",
  },
  cc_by_nc: {
    label: "CC BY-NC",
    color: "#9B5DE5",
    tip: "Creative Commons Attribution-NonCommercial -- non-commercial use only.",
  },
  view_only: {
    label: "View Only",
    color: "#FFB800",
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
          className={`font-mono text-[12px] cursor-default ${className ?? ""}`}
          style={{
            backgroundColor: `${meta.color}0F`,
            borderColor: `${meta.color}26`,
            color: meta.color,
          }}
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

// ---------------------------------------------------------------------------
// EntityHistory — Subtle metadata showing when an entity was created/modified.
// Uses date-fns formatDistanceToNow for relative timestamps.
// ---------------------------------------------------------------------------

import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface EntityHistoryProps {
  createdAt: string;
  updatedAt: string;
  className?: string;
}

export function EntityHistory({
  createdAt,
  updatedAt,
  className,
}: EntityHistoryProps) {
  const createdDate = new Date(createdAt);
  const updatedDate = new Date(updatedAt);
  const wasModified = updatedDate.getTime() - createdDate.getTime() > 1000;

  return (
    <div className={cn("space-y-0.5", className)}>
      <p className="font-mono text-[9px] text-tier-5 tracking-[0.5px]">
        Created {formatDistanceToNow(createdDate, { addSuffix: true })}
      </p>
      {wasModified && (
        <p className="font-mono text-[9px] text-tier-5 tracking-[0.5px]">
          Last modified {formatDistanceToNow(updatedDate, { addSuffix: true })}
        </p>
      )}
    </div>
  );
}

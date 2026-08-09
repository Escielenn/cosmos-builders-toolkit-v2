/**
 * UpstreamCallout, Displays contextual notes from upstream cascade layers.
 *
 * Renders above the CollapsibleSections in each tool page when the user has
 * relevant upstream worksheet data in the same world. Each callout is
 * individually dismissable via localStorage.
 */

import { X } from "lucide-react";
import { useUpstreamContext, type UpstreamCallout as CalloutData } from "@/hooks/use-upstream-context";
import { useHintDismissed } from "@/hooks/use-hint-dismissed";

// ---------------------------------------------------------------------------
// Single callout item (dismissable)
// ---------------------------------------------------------------------------

interface CalloutItemProps {
  callout: CalloutData;
  toolType: string;
  index: number;
}

function CalloutItem({ callout, toolType, index }: CalloutItemProps) {
  const hintKey = `upstream-${toolType}-${callout.sourceToolType}-${index}`;
  const [isDismissed, dismiss] = useHintDismissed(hintKey);

  if (isDismissed) return null;

  return (
    <div className="relative mb-4 px-4 py-2.5 border border-primary/10 bg-primary/[0.03] animate-in fade-in duration-300">
      <p className="font-mono text-[12px] uppercase tracking-wider text-primary/50 mb-1">
        Upstream Context
      </p>
      <p className="text-xs text-t3 leading-relaxed pr-5">
        {callout.message}
      </p>
      <p className="text-[11px] text-t5 mt-1">
        Source: {callout.sourceBrandName}
      </p>
      <button
        onClick={dismiss}
        className="absolute top-1.5 right-1.5 text-t3/30 hover:text-t3/60 transition-colors"
        aria-label="Dismiss upstream callout"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Container component, used by ToolPageLayout
// ---------------------------------------------------------------------------

interface UpstreamCalloutProps {
  toolType: string;
  worldId: string | null;
}

export default function UpstreamCallout({ toolType, worldId }: UpstreamCalloutProps) {
  const { callouts, isLoading } = useUpstreamContext(toolType, worldId);

  // Don't render anything while loading or if there are no callouts
  if (isLoading || callouts.length === 0) return null;

  return (
    <div className="mb-2">
      {callouts.map((callout, i) => (
        <CalloutItem
          key={`${callout.sourceToolType}-${i}`}
          callout={callout}
          toolType={toolType}
          index={i}
        />
      ))}
    </div>
  );
}

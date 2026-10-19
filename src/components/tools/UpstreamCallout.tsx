/**
 * UpstreamCallout, Displays contextual notes from upstream cascade layers.
 *
 * Renders above the CollapsibleSections in each tool page when the user has
 * relevant upstream worksheet data in the same world. Each callout is
 * individually dismissable via localStorage.
 */

import { Notice } from "@/components/layout/page-chrome";
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
    <Notice
      tone="info"
      compact
      label="UPSTREAM CONTEXT"
      onDismiss={dismiss}
      className="mb-4 animate-in fade-in duration-slow"
    >
      <p>{callout.message}</p>
      <p className="mt-1 text-[12px] text-t4">Source: {callout.sourceBrandName}</p>
    </Notice>
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

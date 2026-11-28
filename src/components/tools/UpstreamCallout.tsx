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
import { useMemo } from "react";
import { manifestForTool } from "@/canon/manifests";
import { useCanonFacts } from "@/canon/hooks";
import { narrativeBlocks } from "@/canon/narrate";

/**
 * 1.9 F-02 / F-11: for a tool with a manifest, the upstream context comes
 * from canon through src/canon, not from reading other tools' worksheets: the
 * manifest's `upstream` tools, each saying what its facts mean, in that
 * tool's own words. Tools without a manifest keep the old worksheet reader.
 */
function useManifestCallouts(toolType: string, worldId: string | null): CalloutData[] | null {
  const manifest = manifestForTool(toolType);
  const { data: facts } = useCanonFacts(manifest ? worldId ?? undefined : undefined);
  return useMemo(() => {
    if (!manifest) return null;
    const blocks = narrativeBlocks(facts ?? []).filter((b) => manifest.upstream.includes(b.toolId));
    return blocks.slice(0, 2).map((b) => ({
      message: b.lines[0],
      sourceToolType: b.toolId,
      sourceBrandName: b.brand,
    }));
  }, [manifest, facts]);
}

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
  const fromCanon = useManifestCallouts(toolType, worldId);
  // Manifested tools pass "" so the legacy worksheet query never runs.
  const legacy = useUpstreamContext(fromCanon ? "" : toolType, worldId);
  const callouts = fromCanon ?? legacy.callouts;
  const isLoading = fromCanon ? false : legacy.isLoading;

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

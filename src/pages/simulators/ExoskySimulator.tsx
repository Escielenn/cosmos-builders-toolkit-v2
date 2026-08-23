import { lazy, Suspense, useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Save, FolderOpen, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useWorldId } from "@/hooks/use-world-id";
import { useSimulationSave } from "@/hooks/use-simulation-save";
import SaveSimulationDialog from "@/components/simulators/SaveSimulationDialog";
import LoadSimulationSheet from "@/components/simulators/LoadSimulationSheet";
import PublishToWorldDialog from "@/components/simulators/PublishToWorldDialog";
import Header from "@/components/layout/Header";
import NarrativeBridgePanel, { useNarrativeBridge } from "@/components/simulators/NarrativeBridgePanel";
import { SIMULATOR_NARRATIVE_CONFIGS } from "@/lib/simulator-narrative-questions";
import { decodeHandoff, type HandoffPayload } from "@/lib/simulators/handoff";
import { getEntry } from "@/services/world-entries";
import { reconstructSolarisHandoff } from "@/lib/simulators/published-facts";

/**
 * A Solaris planet has an orbital distance in AU but no galactic position;
 * ExoSky's "custom coordinates" vantage needs a galactic l/b/distance. This
 * spreads different AU values across different patches of sky (so two
 * handoffs don't collide) rather than claiming a real placement Solaris
 * never had. Distance is a flat 10 pc placeholder for the same reason: the
 * handoff carries no distance-from-Earth, so this view says so on screen.
 */
function deriveExoskySeed(planetAU: number, starMassLum: number) {
  const galL = ((planetAU * 40) % 360 + 360) % 360;
  const galB = Math.max(-60, Math.min(60, (starMassLum - 1) * 25));
  const distPc = 10;
  return { galL, galB, distPc };
}

const ExoSkyV2 = lazy(() => import("@/components/simulators/ExoSkySimulator"));

const SimLoader = () => (
  <div className="w-full h-full flex items-center justify-center bg-background">
    <div className="text-center">
      <Loader className="mb-3" />
      <p className="text-xs text-white/40 font-mono tracking-widest uppercase">Loading EXOSKY</p>
    </div>
  </div>
);

const ExoskySimulator = () => {
  const worldId = useWorldId();
  const [searchParams, setSearchParams] = useSearchParams();
  const handoffPayload = useMemo(() => decodeHandoff(searchParams), [searchParams]);

  // open-on (Brief S1): ?entity=<uuid> from a published planet (see
  // published-facts.ts). Unlike ?handoff=, this is a network fetch, so it's
  // state + effect rather than a pure useMemo. Reconstructs the same
  // HandoffPayload shape the ?handoff= path already produces — see
  // reconstructSolarisHandoff's doc comment for why that's reuse, not a new
  // tool-to-tool coupling.
  const entityId = searchParams.get("entity");
  const [entityHandoffPayload, setEntityHandoffPayload] = useState<HandoffPayload | null>(null);
  useEffect(() => {
    if (!entityId) {
      setEntityHandoffPayload(null);
      return;
    }
    let cancelled = false;
    getEntry(entityId)
      .then((entry) => {
        if (!cancelled) setEntityHandoffPayload(reconstructSolarisHandoff(entry));
      })
      .catch(() => {
        if (!cancelled) setEntityHandoffPayload(null);
      });
    return () => {
      cancelled = true;
    };
  }, [entityId]);

  const initialHandoff = useMemo(() => {
    const payload = handoffPayload ?? entityHandoffPayload;
    if (!payload) return null;
    return { payload, ...deriveExoskySeed(payload.planetAU, payload.starMassLum) };
  }, [handoffPayload, entityHandoffPayload]);
  // Called by ExoSkyV2 once it has actually applied initialHandoff to its own
  // state, not before: stripping the param earlier risks this wrapper
  // re-rendering with a null initialHandoff before the lazy-loaded component
  // below has mounted and read the original value. A refresh mid-session
  // would otherwise silently re-seed and discard whatever the writer has
  // since configured.
  const clearHandoffParam = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("handoff");
      next.delete("entity");
      return next;
    }, { replace: true });
  }, [setSearchParams]);
  const narrativeBridge = useNarrativeBridge();
  const [loadSheetOpen, setLoadSheetOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const {
    saves,
    isLoadingSaves,
    pendingPayload,
    saveDialogOpen,
    setSaveDialogOpen,
    createSave,
    loadSave,
    requestSave,
    refreshPayload,
  } = useSimulationSave({
    simulatorType: "exosky",
    worldId,
  });

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "STELLARFORGE_PUBLISH") {
        // Ask for the live state first. Without this the dialog opened on a
        // null payload and published a bare name into the world.
        refreshPayload();
        setPublishDialogOpen(true);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [refreshPayload]);

  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        <div style={{ position: "fixed", top: 64, left: 0, right: 0, bottom: 0 }}>
          <Suspense fallback={<SimLoader />}>
            <ExoSkyV2
              narrativeBridgeOpen={narrativeBridge.panelProps.open}
              worldId={worldId}
              initialHandoff={initialHandoff}
              onHandoffConsumed={clearHandoffParam}
            />
          </Suspense>
          {/* Save/Load controls */}
          {(
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 border border-sf-teal bg-sf-void/90 px-1.5 py-1 backdrop-blur-sm">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Read the simulator now. Publishing used to send whatever
                  // the last Save left behind, which was usually nothing.
                  refreshPayload();
                  setPublishDialogOpen(true);
                }}
                className="bg-sf-void/80 border-sf-line text-sf-teal hover:bg-sf-void text-[13px] uppercase tracking-wider h-7 px-2.5"
              >
                <Rocket className="w-3 h-3 mr-1" />
                Publish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLoadSheetOpen(true)}
                className="bg-sf-void/80 border-sf-line text-sf-teal hover:bg-sf-void text-[13px] uppercase tracking-wider h-7 px-2.5"
              >
                <FolderOpen className="w-3 h-3 mr-1" />
                Load
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={requestSave}
                className="bg-sf-void/80 border-sf-line text-sf-teal hover:bg-sf-void text-[13px] uppercase tracking-wider h-7 px-2.5"
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
            </div>
          )}
          <NarrativeBridgePanel
            config={SIMULATOR_NARRATIVE_CONFIGS["exosky"]}
            {...narrativeBridge.panelProps}
          />
        </div>
      </div>
      <SaveSimulationDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        payload={pendingPayload}
        worldId={worldId ?? undefined}
        onSave={(name, chosenWorld) => {
          if (pendingPayload) {
            createSave.mutate({ name, data: pendingPayload, worldId: chosenWorld });
          }
        }}
        isSaving={createSave.isPending}
      />
      <LoadSimulationSheet
        open={loadSheetOpen}
        onOpenChange={setLoadSheetOpen}
        saves={saves}
        isLoading={isLoadingSaves}
        onLoad={loadSave}
      />
      <PublishToWorldDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        payload={pendingPayload}
        worldId={worldId}
        simulatorType="exosky"
        narrativeNotes={narrativeBridge.notes}
      />
    </>
  );
};

export default ExoskySimulator;

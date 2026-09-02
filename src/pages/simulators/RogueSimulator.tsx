import { useState, useRef, useEffect, useMemo } from "react";
import { Save, FolderOpen, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorldId } from "@/hooks/use-world-id";
import { useSimulationSave } from "@/hooks/use-simulation-save";
import SaveSimulationDialog from "@/components/simulators/SaveSimulationDialog";
import LoadSimulationSheet from "@/components/simulators/LoadSimulationSheet";
import PublishToWorldDialog from "@/components/simulators/PublishToWorldDialog";
import Header from "@/components/layout/Header";
import NarrativeBridgePanel, { useNarrativeBridge } from "@/components/simulators/NarrativeBridgePanel";
import { SIMULATOR_NARRATIVE_CONFIGS } from "@/lib/simulator-narrative-questions";
import { SimulatorWorldEntityPicker } from "@/components/simulators/SimulatorWorldEntityPicker";
import { evaluateRogueRunFlags, type RogueBodyReport } from "@/sims/flags";
import { SimFlagStrip } from "@/components/simulators/SimFlagStrip";
import { useDismissedFlags } from "@/hooks/use-dismissed-flags";

const RogueSimulator = () => {
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const worldId = useWorldId();
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
    simulatorType: "rogue",
    worldId,
    iframeRef,
  });

  // Brief S4: consequence flags over what the encounter actually did.
  // sim.html posts results.bodies[] (pre/post semi-major axis, eccentricity,
  // ejected) and the system's habZone; nothing is recomputed here.
  const { dismissedIds, dismiss: dismissFlag } = useDismissedFlags();
  const simFlags = useMemo(() => {
    const r = pendingPayload?.results;
    if (!r) return [];
    return evaluateRogueRunFlags({
      habZone: (r.habZone as [number, number] | null | undefined) ?? null,
      bodies: (r.bodies as RogueBodyReport[] | undefined) ?? null,
      simTime: Number(r.simTime) || 0,
    });
  }, [pendingPayload]);

  // The sim announces each change of encounter class (orbit → perturb →
  // eject → chaos) exactly once. Re-read state then — the moment something
  // happened — rather than polling a running n-body integration.
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "STELLARFORGE_STATUS") refreshPayload();
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [refreshPayload]);

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
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 relative" style={{ marginTop: 64 }}>
          {!loaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background">
              <div className="w-10 h-10 border-2 border-primary border-t-primary rounded-full animate-spin" />
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
                Initializing ROGUE
              </p>
            </div>
          )}
          {/* Wrapper shrinks 340px right when NarrativeBridge is open so the
              iframe's internal data panels render adjacent to the bridge
              instead of being covered by it. Iframe itself stays w-full
              h-full so its WebGL canvas sizes reliably. */}
          <div
            className="absolute inset-y-0 left-0"
            style={{
              right: narrativeBridge.panelProps.open ? 340 : 0,
              transition: 'right 280ms cubic-bezier(0.2, 0, 0, 1)',
            }}
          >
            <iframe
              ref={iframeRef}
              src="/rogue/sim.html"
              title="Rogue, Wandering Object Encounters"
              allow="fullscreen"
              className={`w-full h-full border-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setLoaded(true)}
            />
          </div>
          {/* Save/Load controls */}
          {loaded && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-stretch gap-1.5">
            <div className="flex items-center gap-1.5 border border-sf-primary bg-sf-void/90 px-1.5 py-1 backdrop-blur-sm">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Read the simulator now. Publishing used to send whatever
                  // the last Save left behind, which was usually nothing.
                  refreshPayload();
                  setPublishDialogOpen(true);
                }}
                className="bg-sf-primary/[0.12] border-sf-primary text-sf-primary-bright-text hover:bg-sf-primary/25 hover:text-white text-[13px] uppercase tracking-wider h-8 px-3"
              >
                <Rocket className="w-3 h-3 mr-1" />
                Publish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLoadSheetOpen(true)}
                className="bg-sf-primary/[0.12] border-sf-primary text-sf-primary-bright-text hover:bg-sf-primary/25 hover:text-white text-[13px] uppercase tracking-wider h-8 px-3"
              >
                <FolderOpen className="w-3 h-3 mr-1" />
                Load
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={requestSave}
                className="bg-sf-primary/[0.12] border-sf-primary text-sf-primary-bright-text hover:bg-sf-primary/25 hover:text-white text-[13px] uppercase tracking-wider h-8 px-3"
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
              {/* Browses a world's own entities, so it genuinely needs one.
                  Save and Publish do not: they ask which world instead. */}
              {worldId && (
                <SimulatorWorldEntityPicker
                  worldId={worldId}
                  simulatorType="rogue"
                  entityTypes={["planet", "star"]}
                  iframeRef={iframeRef}
                />
              )}
            </div>
              {simFlags.length > 0 && (
                <div className="max-w-sm border border-sf-primary bg-sf-void/90 px-3 py-2 backdrop-blur-sm">
                  <SimFlagStrip flags={simFlags} dismissedIds={dismissedIds} onDismiss={dismissFlag} />
                </div>
              )}
            </div>
          )}
          <NarrativeBridgePanel
            config={SIMULATOR_NARRATIVE_CONFIGS["rogue"]}
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
        simulatorType="rogue"
        narrativeNotes={narrativeBridge.notes}
      />
    </>
  );
};

export default RogueSimulator;

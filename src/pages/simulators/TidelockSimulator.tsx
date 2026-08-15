import { useState, useRef, useEffect } from "react";
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

const TidelockSimulator = () => {
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
    simulatorType: "tidelock",
    worldId,
    iframeRef,
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
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 relative" style={{ marginTop: 64 }}>
          {!loaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background">
              <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
                Initializing TIDELOCK
              </p>
            </div>
          )}
          {/* Wrapper shrinks 340px right when NarrativeBridge is open;
              iframe inside stays w-full h-full so its WebGL canvas sizes
              reliably. */}
          <div
            className="absolute inset-y-0 left-0"
            style={{
              right: narrativeBridge.panelProps.open ? 340 : 0,
              transition: 'right 280ms cubic-bezier(0.2, 0, 0, 1)',
            }}
          >
            <iframe
              ref={iframeRef}
              src="/tools/tidelock/sim.html"
              title="Tidelock, Locked World Simulator"
              allow="fullscreen"
              className={`w-full h-full border-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setLoaded(true)}
            />
          </div>
          {/* Save/Load controls */}
          {loaded && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 border border-sf-teal/30 bg-sf-void/90 px-1.5 py-1 backdrop-blur-sm">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Read the simulator now. Publishing used to send whatever
                  // the last Save left behind, which was usually nothing.
                  refreshPayload();
                  setPublishDialogOpen(true);
                }}
                className="bg-sf-teal/[0.12] border-sf-teal/70 text-[#3DFFCD] hover:bg-sf-teal/25 hover:text-white text-[13px] uppercase tracking-wider h-8 px-3"
              >
                <Rocket className="w-3 h-3 mr-1" />
                Publish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLoadSheetOpen(true)}
                className="bg-sf-teal/[0.12] border-sf-teal/70 text-[#3DFFCD] hover:bg-sf-teal/25 hover:text-white text-[13px] uppercase tracking-wider h-8 px-3"
              >
                <FolderOpen className="w-3 h-3 mr-1" />
                Load
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={requestSave}
                className="bg-sf-teal/[0.12] border-sf-teal/70 text-[#3DFFCD] hover:bg-sf-teal/25 hover:text-white text-[13px] uppercase tracking-wider h-8 px-3"
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
              {/* Browses a world's own entities, so it genuinely needs one.
                  Save and Publish do not: they ask which world instead. */}
              {worldId && (
                <SimulatorWorldEntityPicker
                  worldId={worldId}
                  simulatorType="tidelock"
                  entityTypes={["planet"]}
                  iframeRef={iframeRef}
                />
              )}
            </div>
          )}
          <NarrativeBridgePanel
            config={SIMULATOR_NARRATIVE_CONFIGS["tidelock"]}
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
        simulatorType="tidelock"
        narrativeNotes={narrativeBridge.notes}
      />
    </>
  );
};

export default TidelockSimulator;

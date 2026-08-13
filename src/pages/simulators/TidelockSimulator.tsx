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
  } = useSimulationSave({
    simulatorType: "tidelock",
    worldId,
    iframeRef,
  });

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "STELLARFORGE_PUBLISH") {
        setPublishDialogOpen(true);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

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
          {loaded && worldId && (
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPublishDialogOpen(true)}
                className="bg-sf-void/80 border-sf-border text-sf-teal hover:bg-sf-void text-[12px] uppercase tracking-wider h-7 px-2.5"
              >
                <Rocket className="w-3 h-3 mr-1" />
                Publish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLoadSheetOpen(true)}
                className="bg-sf-void/80 border-sf-border text-sf-teal hover:bg-sf-void text-[12px] uppercase tracking-wider h-7 px-2.5"
              >
                <FolderOpen className="w-3 h-3 mr-1" />
                Load
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={requestSave}
                className="bg-sf-void/80 border-sf-border text-sf-teal hover:bg-sf-void text-[12px] uppercase tracking-wider h-7 px-2.5"
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
              <SimulatorWorldEntityPicker
                worldId={worldId}
                simulatorType="tidelock"
                entityTypes={["planet"]}
                iframeRef={iframeRef}
              />
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

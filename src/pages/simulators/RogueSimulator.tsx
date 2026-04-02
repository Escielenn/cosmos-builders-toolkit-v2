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
  } = useSimulationSave({
    simulatorType: "rogue",
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
                Initializing ROGUE
              </p>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src="/rogue/sim.html"
            title="Rogue — Wandering Object Encounters"
            allow="fullscreen"
            className={`w-full h-full border-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ position: 'absolute', inset: 0 }}
            onLoad={() => setLoaded(true)}
          />
          {/* Save/Load controls */}
          {loaded && worldId && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPublishDialogOpen(true)}
                className="bg-[#09090B]/80 border-white/10 text-[#00D4FF] hover:bg-[#09090B] text-[10px] uppercase tracking-wider h-7 px-2.5"
              >
                <Rocket className="w-3 h-3 mr-1" />
                Publish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLoadSheetOpen(true)}
                className="bg-[#09090B]/80 border-white/10 text-[#00D4FF] hover:bg-[#09090B] text-[10px] uppercase tracking-wider h-7 px-2.5"
              >
                <FolderOpen className="w-3 h-3 mr-1" />
                Load
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={requestSave}
                className="bg-[#09090B]/80 border-white/10 text-[#00D4FF] hover:bg-[#09090B] text-[10px] uppercase tracking-wider h-7 px-2.5"
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
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
        onSave={(name) => {
          if (pendingPayload) {
            createSave.mutate({ name, data: pendingPayload });
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

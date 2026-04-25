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

const ExoforgeSimulator = () => {
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
    simulatorType: "exoforge",
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
                Initializing EXOFORGE
              </p>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src="/tools/exoforge/sim.html"
            title="ExoForge — Procedural Exoplanet Forge"
            allow="fullscreen"
            className={`w-full h-full border-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ position: 'absolute', inset: 0 }}
            onLoad={() => setLoaded(true)}
          />
          {/* Unboxed floating title overlay — covers iframe internal title */}
          {loaded && (
            <div
              className="absolute z-20 pointer-events-none select-none"
              style={{
                top: 0,
                left: 0,
                width: 360,
                height: 120,
                background: 'radial-gradient(ellipse at 0% 0%, rgba(9,9,11,0.95) 0%, rgba(9,9,11,0.7) 50%, transparent 100%)',
              }}
            >
              <div style={{ position: 'absolute', top: 20, left: 20 }}>
                <h1
                  className="font-display text-[28px] font-light uppercase tracking-[4px] text-t1 leading-none"
                  style={{ textShadow: '0 0 20px rgba(0, 0, 0, 0.6)' }}
                >
                  ExoForge
                </h1>
                <p
                  className="font-display text-[10px] font-light uppercase tracking-[3px] mt-1"
                  style={{ color: 'rgba(0, 229, 160, 0.35)', textShadow: '0 0 20px rgba(0, 0, 0, 0.6)' }}
                >
                  StellarForge.tools
                </p>
              </div>
            </div>
          )}
          {/* Save/Load controls */}
          {loaded && worldId && (
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPublishDialogOpen(true)}
                className="bg-sf-void/80 border-white/10 text-sf-cyan hover:bg-sf-void text-[10px] uppercase tracking-wider h-7 px-2.5"
              >
                <Rocket className="w-3 h-3 mr-1" />
                Publish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLoadSheetOpen(true)}
                className="bg-sf-void/80 border-white/10 text-sf-cyan hover:bg-sf-void text-[10px] uppercase tracking-wider h-7 px-2.5"
              >
                <FolderOpen className="w-3 h-3 mr-1" />
                Load
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={requestSave}
                className="bg-sf-void/80 border-white/10 text-sf-cyan hover:bg-sf-void text-[10px] uppercase tracking-wider h-7 px-2.5"
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
            </div>
          )}
          <NarrativeBridgePanel
            config={SIMULATOR_NARRATIVE_CONFIGS["exoforge"]}
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
        simulatorType="exoforge"
        narrativeNotes={narrativeBridge.notes}
      />
    </>
  );
};

export default ExoforgeSimulator;

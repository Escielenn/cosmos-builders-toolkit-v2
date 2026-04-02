import { lazy, Suspense, useState } from "react";
import { Save, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useWorldId } from "@/hooks/use-world-id";
import { useSimulationSave } from "@/hooks/use-simulation-save";
import SaveSimulationDialog from "@/components/simulators/SaveSimulationDialog";
import LoadSimulationSheet from "@/components/simulators/LoadSimulationSheet";
import Header from "@/components/layout/Header";
import NarrativeBridgePanel, { useNarrativeBridge } from "@/components/simulators/NarrativeBridgePanel";
import { SIMULATOR_NARRATIVE_CONFIGS } from "@/lib/simulator-narrative-questions";

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
  const narrativeBridge = useNarrativeBridge();
  const [loadSheetOpen, setLoadSheetOpen] = useState(false);
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
    simulatorType: "exosky",
    worldId,
  });

  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        <div style={{ position: "fixed", top: 64, left: 0, right: 0, bottom: 0 }}>
          <Suspense fallback={<SimLoader />}>
            <ExoSkyV2 />
          </Suspense>
          {/* Save/Load controls */}
          {worldId && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
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
            config={SIMULATOR_NARRATIVE_CONFIGS["exosky"]}
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
    </>
  );
};

export default ExoskySimulator;

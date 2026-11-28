import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Save, FolderOpen, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { Loader } from "@/components/ui/loader";
import { useWorldId } from "@/hooks/use-world-id";
import { useSimulationSave } from "@/hooks/use-simulation-save";
import { useSimOpenOn } from "@/hooks/use-sim-open-on";
import SaveSimulationDialog from "@/components/simulators/SaveSimulationDialog";
import SimRunExportButton from "@/components/simulators/SimRunExportButton";
import SimulatorCascadeFooter from "@/components/simulators/SimulatorCascadeFooter";
import LoadSimulationSheet from "@/components/simulators/LoadSimulationSheet";
import PublishToWorldDialog from "@/components/simulators/PublishToWorldDialog";
import Header from "@/components/layout/Header";
import NarrativeBridgePanel, { NarrativeBridgeToggle, useNarrativeBridge } from "@/components/simulators/NarrativeBridgePanel";
import { SIM_FLAGS, SIM_MAIN, SIM_STAGE, SIM_TOOLBAR, SIM_TOOLBAR_WRAP, simStageStyle } from "@/components/simulators/sim-chrome";
import { SIMULATOR_NARRATIVE_CONFIGS } from "@/lib/simulator-narrative-questions";
import { SimulatorWorldEntityPicker } from "@/components/simulators/SimulatorWorldEntityPicker";
import { evaluateRogueRunFlags, type RogueBodyReport } from "@/sims/flags";
import { SimFlagStrip } from "@/components/simulators/SimFlagStrip";
import { useDismissedFlags } from "@/hooks/use-dismissed-flags";
import SimSubjectChip from "@/components/simulators/SimSubjectChip";

const RogueSimulator = () => {
  useMetaTags({ title: "Rogue" });
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

  // open-on (Brief S1): ?entityId=<uuid> seeds this run from the entity's
  // canon. The sim never learns which tool published it — open-on.ts reads
  // predicates by name.
  useSimOpenOn({ simulatorType: "rogue", iframeRef, loaded, refreshPayload });

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

  // 1.9 (R3): a run whose integration drifted is not published. The sim
  // posts results.energyError (|E - E0| / |E0| since launch) and the limit;
  // Publish asks for fresh state, then opens the dialog only if the run is
  // within it. Otherwise it says why, in place.
  const [publishBlocked, setPublishBlocked] = useState<string | null>(null);
  const publishWaitRef = useRef<{ from: unknown; at: number } | null>(null);
  const [publishTick, setPublishTick] = useState(0);
  const requestPublish = useCallback(() => {
    // Ask for the live state first. Without this the dialog opened on a
    // null payload and published a bare name into the world.
    publishWaitRef.current = { from: pendingPayload, at: Date.now() };
    setPublishTick((n) => n + 1);
    refreshPayload();
  }, [pendingPayload, refreshPayload]);
  useEffect(() => {
    const wait = publishWaitRef.current;
    if (!wait) return;
    const fresh = pendingPayload !== wait.from;
    const decide = () => {
      publishWaitRef.current = null;
      const r = pendingPayload?.results as Record<string, unknown> | undefined;
      const err = typeof r?.energyError === "number" ? r.energyError : null;
      const max = typeof r?.publishMaxEnergyError === "number" ? r.publishMaxEnergyError : 1e-3;
      if (err !== null && err > max) {
        setPublishBlocked(
          `// ENERGY ERROR ${err.toExponential(1)}, ABOVE ${max.toExponential(0)}. RUN NOT PUBLISHED. Reset, or try a wider or slower pass.`,
        );
        return;
      }
      setPublishBlocked(null);
      setPublishDialogOpen(true);
    };
    if (fresh) {
      decide();
      return;
    }
    // No answer yet: decide on what we have after a short wait.
    const t = window.setTimeout(decide, 600);
    return () => window.clearTimeout(t);
  }, [pendingPayload, publishTick]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "STELLARFORGE_PUBLISH") requestPublish();
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [requestPublish]);

  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        {/* One viewport tall rather than flex-1, so the cascade footer sits
            below the simulator instead of squeezing it. */}
        <main id="main" tabIndex={-1} className={SIM_MAIN} style={{ marginTop: 64 }}>
          {!loaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background">
              <Loader message="LOADING ROGUE" />
            </div>
          )}
          {/* Wrapper shrinks 340px right when NarrativeBridge is open so the
              iframe's internal data panels render adjacent to the bridge
              instead of being covered by it. Iframe itself stays w-full
              h-full so its WebGL canvas sizes reliably. */}
          <div
            className={SIM_STAGE}
            style={simStageStyle(narrativeBridge.panelProps.open)}
          >
            <iframe
              ref={iframeRef}
              src="/rogue/sim.html"
              title="Rogue, Wandering Object Encounters"
              allow="fullscreen"
              className={`w-full h-full border-0 transition-opacity duration-slow ease-sf-out ${loaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setLoaded(true)}
            />
          </div>
          {/* Save/Load controls */}
          {loaded && (
            <div className={SIM_TOOLBAR_WRAP}>
            <div className={SIM_TOOLBAR}>
              <Button
                variant="outline"
                size="sm"
                onClick={requestPublish}
                className="bg-sf-primary/[0.06] border-sf-primary text-sf-primary-text hover:bg-sf-primary/[0.12] hover:text-t1 text-[13px] min-h-hit px-3"
              >
                <Rocket className="w-3 h-3 mr-1" />
                Publish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLoadSheetOpen(true)}
                className="bg-sf-primary/[0.06] border-sf-primary text-sf-primary-text hover:bg-sf-primary/[0.12] hover:text-t1 text-[13px] min-h-hit px-3"
              >
                <FolderOpen className="w-3 h-3 mr-1" />
                Load
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={requestSave}
                className="bg-sf-primary/[0.06] border-sf-primary text-sf-primary-text hover:bg-sf-primary/[0.12] hover:text-t1 text-[13px] min-h-hit px-3"
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
              {/* Run summary as Markdown or PDF: inputs, outputs, facts for canon. */}
              <SimRunExportButton
                simulatorType="rogue"
                payload={pendingPayload}
                refreshPayload={refreshPayload}
                narrativeNotes={narrativeBridge.notes}
              />
              {/* Brief S1: the writer can see what this run is ON. */}
              <SimSubjectChip worldId={worldId} />
              <NarrativeBridgeToggle {...narrativeBridge.panelProps} />
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
                <div className={SIM_FLAGS}>
                  <SimFlagStrip flags={simFlags} dismissedIds={dismissedIds} onDismiss={dismissFlag} />
                </div>
              )}
              {publishBlocked && (
                <div className={SIM_FLAGS}>
                  <p
                    role="status"
                    className="rounded-none border border-sf-crimson bg-sf-crimson/[0.06] px-3 py-2 font-sans text-[13px] text-sf-crimson-text"
                  >
                    {publishBlocked}
                  </p>
                </div>
              )}
            </div>
          )}
          <NarrativeBridgePanel
            config={SIMULATOR_NARRATIVE_CONFIGS["rogue"]}
            {...narrativeBridge.panelProps}
          />
        </main>
        <SimulatorCascadeFooter simulatorType="rogue" />
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

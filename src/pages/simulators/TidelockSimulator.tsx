import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
import { decodeHandoff } from "@/lib/simulators/handoff";
import { checkTidelockPlausibility } from "@/lib/simulators/plausibility-notes";
import { PlausibilityStrip } from "@/components/simulators/PlausibilityStrip";
import { extractSimulationFacts } from "@/lib/simulation-facts";
import { SceneProseButton } from "@/components/simulators/SceneProseButton";

/**
 * Solaris's five habitable-zone bounds (public/tools/solaris/sim.html's
 * STARS.hz, lines ~407-412), duplicated here only as far as needed to turn
 * a handoff's `planetAU` into a zone-relative fraction. Tidelock has its
 * own, much narrower orbital range (tidal-lock candidates sit close to
 * their star), so what crosses over is "how far into the habitable zone
 * was this planet", not the raw AU number.
 */
const SOLARIS_HZ_MID: Record<string, number> = {
  blue: (3.5 + 7.0) / 2,
  white: (2.4 + 4.5) / 2,
  yellow: (1.6 + 3.0) / 2,
  orange: (0.8 + 1.7) / 2,
  red: (0.2 + 0.7) / 2,
};

const TidelockSimulator = () => {
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const worldId = useWorldId();
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Plausibility notes read the same `pendingPayload.results` that Save and
  // Publish already populate. sim.html only ever answers a state request:
  // its one postMessage call site (STELLARFORGE_SAVE, sim.html:1778) fires
  // solely from inside the STELLARFORGE_REQUEST_STATE handler, never on its
  // own initiative (no spontaneous post on a slider drag, say). So
  // `pendingPayload`, and therefore this strip, only refreshes at three
  // moments: mount (this effect), Save click (`requestSave`), and Publish
  // click (`refreshPayload` above). Between those, a note can go stale if the
  // writer drags a slider without saving or publishing, but it is always
  // current at the two moments that actually persist data, since both Save
  // and Publish already refresh before their dialogs open. Ask once here so
  // the strip has something to say on load rather than staying empty until
  // the first Save; no timer, no polling.
  //
  // NOTE: when a `?handoff=` seed is present, this early call races the
  // handoff effect below and would read Tidelock's stock defaults before the
  // seed lands. The handoff effect re-requests state itself, after posting
  // the seed, which is what actually lands in `pendingPayload` in that case.
  useEffect(() => {
    if (!loaded) return;
    refreshPayload();
  }, [loaded, refreshPayload]);

  const plausibilityNotes = useMemo(
    () => (pendingPayload?.results ? checkTidelockPlausibility(pendingPayload.results) : []),
    [pendingPayload],
  );

  // Same pendingPayload the plausibility strip above already reads, run
  // through the same fact extractor ContinuityPanel and the Refs panel use
  // (extractTidelockFacts under the "tidelock" dispatch), so the prose
  // button describes the exact configuration a writer is about to Save or
  // Publish, not a stale or separately-derived snapshot of it.
  const sceneFacts = useMemo(
    () => (pendingPayload ? extractSimulationFacts("tidelock", pendingPayload) : []),
    [pendingPayload],
  );

  // A Solaris planet handed off via `?handoff=`: once the iframe has loaded
  // (so it has a listener registered), send its star and orbital distance
  // as a STELLARFORGE_LOAD with a handoffSeed field. sim.html's own load
  // handler applies it to the star-type dropdown and orbital-distance
  // slider before the writer touches anything. Sent once per page load.
  //
  // refreshPayload() is called here, after the seed postMessage, on purpose:
  // postMessages to the same target window are delivered and processed in
  // order, so by the time sim.html handles the STELLARFORGE_REQUEST_STATE
  // this triggers, the seed above has already been applied. The plausibility
  // effect above also calls refreshPayload() on mount, but that call can
  // land before this seed exists (Tidelock's stock defaults), so this
  // second, later call is what actually leaves `pendingPayload` holding the
  // seeded configuration.
  const handoffSent = useRef(false);
  useEffect(() => {
    if (!loaded || handoffSent.current) return;
    const handoff = decodeHandoff(searchParams);
    if (!handoff) return;
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    handoffSent.current = true;
    const hzMid = SOLARIS_HZ_MID[handoff.starType] ?? 1;
    iframe.contentWindow.postMessage(
      {
        type: "STELLARFORGE_LOAD",
        payload: {
          handoffSeed: {
            // starType is not read on the Tidelock side (sim.html matches by
            // nearest luminosity, via starLuminosity below, since Solaris's
            // blue/white/yellow/orange/red vocabulary and Tidelock's M9V..F0V
            // spectral types share no keys). Left out rather than sent dead.
            starLuminosity: handoff.starMassLum,
            auFraction: handoff.planetAU / hzMid,
          },
        },
      },
      "*",
    );
    refreshPayload();
    // The seed has been applied (or is about to be, per the ordering above);
    // strip the param so a mid-session refresh does not silently re-seed and
    // discard whatever the writer has since configured.
    const next = new URLSearchParams(searchParams);
    next.delete("handoff");
    setSearchParams(next, { replace: true });
  }, [loaded, searchParams, refreshPayload, setSearchParams]);

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
          {/* Save/Load controls, plus plausibility notes on the configuration
              those controls would save or publish right now. Tidelock has no
              React-rendered data-readout panel of its own: the numeric
              results live entirely inside sim.html's own DOM readout panel
              (its updateReadout() sets element .textContent, sim.html:1243),
              not this wrapper. So the strip sits in this same floating
              chrome rather than "below the numeric results", and only takes
              up space when it has something to say. */}
          {loaded && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-stretch gap-1.5">
              <div className="flex items-center gap-1.5 border border-sf-teal/30 bg-sf-void/90 px-1.5 py-1 backdrop-blur-sm">
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
              {plausibilityNotes.length > 0 && (
                <div className="max-w-sm border border-sf-teal/30 bg-sf-void/90 px-3 py-2 backdrop-blur-sm">
                  <PlausibilityStrip notes={plausibilityNotes} />
                </div>
              )}
              {/* Same floating chrome as the plausibility strip above, for the
                  same reason: Tidelock has no React-rendered data panel of its
                  own to sit beneath, so this sits in the chrome that exists
                  rather than a panel that doesn't. */}
              <div className="max-w-sm border border-sf-teal/30 bg-sf-void/90 px-3 py-2 backdrop-blur-sm">
                <SceneProseButton facts={sceneFacts} simulatorType="tidelock" />
              </div>
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

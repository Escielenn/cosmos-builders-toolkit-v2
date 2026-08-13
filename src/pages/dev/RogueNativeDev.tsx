/**
 * RogueNativeDev, the native React rebuild of ROGUE.
 *
 * Route: /dev/rogue. The live simulator stays on the iframe at /tools/rogue
 * until this reaches parity and is signed off, following the Solaris precedent:
 * flipping a route before the controls are all present is a regression even when
 * the new build is better underneath.
 *
 * Physics is lib/simulators/nbody.ts, layout is rogue-systems.ts, trails are
 * trail-buffer.ts, persistence is rogue-save.ts. All four are pure and tested, so
 * this file is only wiring: state, the step loop, and the shared save dialogs.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Save, FolderOpen, Rocket } from "lucide-react";
import Header from "@/components/layout/Header";
import RogueCanvas from "@/components/rogue/RogueCanvas";
import type { Camera, RogueDisplay } from "@/components/rogue/rogueView";
import { RogueControls, RogueReadout } from "@/components/rogue/RoguePanels";
import SaveSimulationDialog from "@/components/simulators/SaveSimulationDialog";
import LoadSimulationSheet from "@/components/simulators/LoadSimulationSheet";
import PublishToWorldDialog from "@/components/simulators/PublishToWorldDialog";
import { useWorldId } from "@/hooks/use-world-id";
import { useSimulationSave } from "@/hooks/use-simulation-save";
import {
  DT_BASE,
  classifyEncounter,
  step as physicsStep,
  type EncounterStatus,
} from "@/lib/simulators/nbody";
import {
  SYSTEMS,
  buildBodies,
  defaultIntruder,
  systemScale,
  type IntruderConfig,
  type RogueBody,
} from "@/lib/simulators/rogue-systems";
import { TrailSet } from "@/lib/simulators/trail-buffer";
import { toRoguePayload, fromRogueSave } from "@/lib/simulators/rogue-save";

const HEADER_H = 64;

/** Physics steps per frame. The original ran many small steps per rendered frame
 *  so a close pass stays resolved; see the energy note in nbody.ts. */
const STEPS_PER_FRAME = 90;

/** How many steps between trail samples. Every step would fill the buffer in
 *  under a second of wall time and the path would read as a short stub. */
const TRAIL_EVERY = 4;

const RogueNativeDev = () => {
  const worldId = useWorldId();
  const [systemKey, setSystemKey] = useState("solar");
  const system = SYSTEMS[systemKey] ?? SYSTEMS.solar;

  const [intruder, setIntruder] = useState<IntruderConfig>(() =>
    defaultIntruder(SYSTEMS.solar),
  );
  const [launched, setLaunched] = useState(false);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<EncounterStatus>("awaiting");
  const [ejected, setEjected] = useState<Set<string>>(new Set());
  const [simYears, setSimYears] = useState(0);
  const [speedScale, setSpeedScale] = useState(1);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [followName, setFollowName] = useState<string | null>(null);

  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: SYSTEMS.solar.defaultZoom });
  const [display, setDisplay] = useState<RogueDisplay>({
    trails: true,
    labels: true,
    orbits: true,
    habitableZone: true,
    grid: false,
    gravityLines: true,
  });

  // Bodies live in a ref: the physics mutates them 90 times a frame and putting
  // that in state would re-render the tree at the same rate.
  const bodiesRef = useRef<RogueBody[]>([]);
  const [bodiesVersion, setBodiesVersion] = useState(0);
  const trails = useMemo(() => new TrailSet(), []);
  const trailCounter = useRef(0);

  /**
   * Rewind history: periodic snapshots rather than every step.
   *
   * Snapshotting each step would cost 90 array copies a frame. Every 20th gives
   * a usable scrub with a bounded cost, which is what the original's rewind did.
   */
  const history = useRef<{ years: number; bodies: RogueBody[] }[]>([]);
  const stepsSinceSnapshot = useRef(0);
  const [canRewind, setCanRewind] = useState(false);

  const rebuild = useCallback(
    (key: string, cfg: IntruderConfig) => {
      const sys = SYSTEMS[key] ?? SYSTEMS.solar;
      bodiesRef.current = buildBodies(sys, cfg);
      trails.reset();
      history.current = [];
      trailCounter.current = 0;
      stepsSinceSnapshot.current = 0;
      setCanRewind(false);
      setLaunched(false);
      setRunning(false);
      setStatus("awaiting");
      setEjected(new Set());
      setSimYears(0);
      setSelectedName(null);
      setFollowName(null);
      setCamera({ x: 0, y: 0, zoom: sys.defaultZoom });
      setBodiesVersion((v) => v + 1);
    },
    [trails],
  );

  // Build on mount and whenever the scenario changes.
  useEffect(() => {
    rebuild(systemKey, intruder);
    // Intentionally not depending on `intruder`: changing a slider must not
    // rebuild mid-flight. The parked intruder is repositioned separately below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemKey, rebuild]);

  const handleSystemChange = (key: string) => {
    const sys = SYSTEMS[key] ?? SYSTEMS.solar;
    const cfg = defaultIntruder(sys);
    setIntruder(cfg);
    setSystemKey(key);
  };

  /**
   * Reposition the parked intruder as the sliders move.
   *
   * Only before launch. Once it is live, changing its approach would teleport a
   * body mid-encounter and invalidate everything already integrated.
   */
  useEffect(() => {
    if (launched) return;
    const bodies = bodiesRef.current;
    const idx = bodies.findIndex((b) => b.isIntruder);
    if (idx === -1) return;
    const rebuilt = buildBodies(system, intruder);
    const fresh = rebuilt.find((b) => b.isIntruder);
    if (fresh) bodies[idx] = fresh;
    setBodiesVersion((v) => v + 1);
  }, [intruder, launched, system]);

  // ── The step loop ───────────────────────────────────────────────
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const reach = systemScale(system).extentAU;

    const frame = () => {
      const bodies = bodiesRef.current;
      const dt = DT_BASE * speedScale;

      for (let i = 0; i < STEPS_PER_FRAME; i++) {
        physicsStep(bodies, dt, launched);

        trailCounter.current++;
        if (trailCounter.current >= TRAIL_EVERY) {
          trailCounter.current = 0;
          for (const b of bodies) {
            if (b.isIntruder && !b.active) continue;
            trails.for(b.name).push(b.x, b.y);
          }
        }

        stepsSinceSnapshot.current++;
        if (stepsSinceSnapshot.current >= 20) {
          stepsSinceSnapshot.current = 0;
          history.current.push({
            years: simYearsRef.current,
            bodies: bodies.map((b) => ({ ...b })),
          });
          if (history.current.length > 400) history.current.shift();
        }
        simYearsRef.current += dt;
      }

      setSimYears(simYearsRef.current);
      const { status: next, ejected: gone } = classifyEncounter(bodies, launched, reach);
      setStatus(next);
      setEjected((prev) => (sameSet(prev, gone) ? prev : gone));
      setCanRewind(history.current.length > 1);
      setBodiesVersion((v) => v + 1);

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, launched, speedScale, system, trails]);

  const simYearsRef = useRef(0);
  useEffect(() => {
    simYearsRef.current = simYears;
  }, [simYears]);

  // ── Actions ─────────────────────────────────────────────────────
  const launch = () => {
    const intruderBody = bodiesRef.current.find((b) => b.isIntruder);
    if (intruderBody) intruderBody.active = true;
    history.current = [];
    setLaunched(true);
    setRunning(true);
  };

  const stepOnce = () => {
    const bodies = bodiesRef.current;
    const dt = DT_BASE * speedScale;
    for (let i = 0; i < STEPS_PER_FRAME; i++) {
      physicsStep(bodies, dt, launched);
      simYearsRef.current += dt;
    }
    for (const b of bodies) {
      if (b.isIntruder && !b.active) continue;
      trails.for(b.name).push(b.x, b.y);
    }
    setSimYears(simYearsRef.current);
    const { status: next, ejected: gone } = classifyEncounter(
      bodies,
      launched,
      systemScale(system).extentAU,
    );
    setStatus(next);
    setEjected(gone);
    setBodiesVersion((v) => v + 1);
  };

  const rewind = () => {
    // Drop the newest snapshot and restore the one before, so repeated presses
    // walk backwards instead of sticking on the same frame.
    if (history.current.length < 2) return;
    history.current.pop();
    const snap = history.current[history.current.length - 1];
    bodiesRef.current = snap.bodies.map((b) => ({ ...b }));
    simYearsRef.current = snap.years;
    setSimYears(snap.years);
    trails.clear();
    setCanRewind(history.current.length > 1);
    setBodiesVersion((v) => v + 1);
  };

  // ── Persistence ─────────────────────────────────────────────────
  const {
    saves,
    isLoadingSaves,
    pendingPayload,
    saveDialogOpen,
    setSaveDialogOpen,
    createSave,
    loadSave,
    requestSave,
  } = useSimulationSave({ simulatorType: "rogue", worldId });

  const [loadSheetOpen, setLoadSheetOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const buildPayload = useCallback(
    () =>
      toRoguePayload({
        systemKey,
        systemName: system.name,
        intruder,
        status,
        simYears: simYearsRef.current,
        launched,
        bodies: bodiesRef.current,
        ejected,
      }),
    [systemKey, system.name, intruder, status, launched, ejected],
  );

  // Component simulators speak the STELLARFORGE protocol over window events.
  // ExoSky shipped without these listeners and its Save was a silent no-op for
  // months; see project-simulator-save-trap.
  useEffect(() => {
    const onRequestState = () => {
      window.postMessage({ type: "STELLARFORGE_SAVE", payload: buildPayload() }, "*");
    };
    const onLoad = (e: Event) => {
      const save = fromRogueSave((e as CustomEvent).detail);
      if (!save) return;
      setSystemKey(save.systemKey in SYSTEMS ? save.systemKey : "solar");
      setIntruder({
        kind: save.intruder.kind,
        massFraction: save.intruder.massFraction,
        distanceAU: save.intruder.distanceAU,
        speedKmS: save.intruder.speedKmS,
        angleDeg: save.intruder.angleDeg,
      });
      // Restore the exact bodies rather than regenerating, so a mid-encounter
      // save reopens where it was left.
      if (save.bodies.length > 0) {
        const rebuilt = buildBodies(SYSTEMS[save.systemKey] ?? SYSTEMS.solar, {
          kind: save.intruder.kind,
          massFraction: save.intruder.massFraction,
          distanceAU: save.intruder.distanceAU,
          speedKmS: save.intruder.speedKmS,
          angleDeg: save.intruder.angleDeg,
        });
        for (const snap of save.bodies) {
          const live = rebuilt.find((b) => b.name === snap.name);
          if (!live) continue;
          live.x = snap.x;
          live.y = snap.y;
          live.vx = snap.vx;
          live.vy = snap.vy;
          if (live.isIntruder) live.active = save.launched;
        }
        bodiesRef.current = rebuilt;
        trails.reset();
        setLaunched(save.launched);
        setRunning(false);
        setStatus(save.status);
        setEjected(new Set(save.ejectedNames));
        simYearsRef.current = save.simYears;
        setSimYears(save.simYears);
        setBodiesVersion((v) => v + 1);
      }
    };

    window.addEventListener("STELLARFORGE_REQUEST_STATE", onRequestState);
    window.addEventListener("STELLARFORGE_LOAD", onLoad as EventListener);
    return () => {
      window.removeEventListener("STELLARFORGE_REQUEST_STATE", onRequestState);
      window.removeEventListener("STELLARFORGE_LOAD", onLoad as EventListener);
    };
  }, [buildPayload, trails]);

  // Dev/test hook, matching the Solaris one.
  useEffect(() => {
    (window as unknown as { __rogueDev?: unknown }).__rogueDev = {
      getBodies: () => bodiesRef.current,
      getStatus: () => status,
      getEjected: () => [...ejected],
      getYears: () => simYearsRef.current,
      buildPayload,
      launch,
      isRunning: () => running,
    };
  });

  const [viewerHeight, setViewerHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight - HEADER_H : 600,
  );
  useEffect(() => {
    const onResize = () => setViewerHeight(window.innerHeight - HEADER_H);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const selected = useMemo(
    () => bodiesRef.current.find((b) => b.name === selectedName) ?? null,
    // bodiesVersion is the signal that the ref's contents changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedName, bodiesVersion],
  );

  const toolBtn =
    "flex items-center gap-1.5 border border-[#15C17B]/45 bg-[#15C17B]/[0.12] px-3 h-8 font-mono text-[12px] uppercase tracking-wider text-[#3DFFCD] transition-colors hover:bg-[#15C17B]/25 hover:text-white";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div style={{ marginTop: HEADER_H }} className="relative overflow-hidden">
        {/* Left of the readout panel, which is 268px wide at right-3. Sharing
            that corner put this badge straight over the status row. */}
        <div className="pointer-events-none absolute right-[292px] top-3 z-30 hidden lg:block">
          <span className="border border-amber-400/25 bg-amber-400/[0.07] px-2 py-1 font-mono text-[11px] uppercase tracking-[2px] text-amber-400/80">
            Native rebuild · dev preview
          </span>
        </div>

        {/* Save / Load / Publish. Top-centre, clear of both panels. */}
        <div className="absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-1.5 border border-[#15C17B]/30 bg-[#09090B]/90 px-1.5 py-1 backdrop-blur-sm">
          <button type="button" onClick={requestSave} className={toolBtn} title="Save encounter">
            <Save className="h-3 w-3" /> Save
          </button>
          <button
            type="button"
            onClick={() => setLoadSheetOpen(true)}
            className={toolBtn}
            title="Load encounter"
          >
            <FolderOpen className="h-3 w-3" /> Load
          </button>
          <button
            type="button"
            onClick={() => setPublishOpen(true)}
            className={toolBtn}
            title="Publish to world"
          >
            <Rocket className="h-3 w-3" /> Publish
          </button>
        </div>

        <RogueCanvas
          bodies={bodiesRef.current}
          trails={trails}
          camera={camera}
          onCameraChange={setCamera}
          display={display}
          habZone={system.habZone}
          ejected={ejected}
          followName={followName}
          onSelect={setSelectedName}
          selectedName={selectedName}
          height={viewerHeight}
        />

        <RogueControls
          systemKey={systemKey}
          onSystemChange={handleSystemChange}
          system={system}
          intruder={intruder}
          onIntruderChange={setIntruder}
          launched={launched}
          running={running}
          onLaunch={launch}
          onTogglePause={() => setRunning((r) => !r)}
          onStep={stepOnce}
          onRewind={rewind}
          onReset={() => rebuild(systemKey, intruder)}
          canRewind={canRewind}
          display={display}
          onDisplayChange={setDisplay}
          speedScale={speedScale}
          onSpeedScale={setSpeedScale}
        />

        <RogueReadout
          system={system}
          bodies={bodiesRef.current}
          status={status}
          ejected={ejected}
          simYears={simYears}
          selected={selected}
          onFollow={setFollowName}
          followName={followName}
        />
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
        open={publishOpen}
        onOpenChange={setPublishOpen}
        payload={pendingPayload ?? buildPayload()}
        worldId={worldId ?? undefined}
        simulatorType="rogue"
      />
    </div>
  );
};

/** Cheap set comparison, so an unchanged ejection list does not re-render. */
function sameSet(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export default RogueNativeDev;

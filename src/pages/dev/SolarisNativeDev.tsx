/**
 * SolarisNativeDev, Hidden dev preview of the native React/R3F Solaris rebuild.
 *
 * Route: /dev/solaris  (NOT in prod nav; live Solaris stays on the static-HTML
 * iframe until parity + sign-off — see docs/SOLARIS_NATIVE_REBUILD.md).
 *
 * M5 scope: persistence. Save/Load/Publish wired through the shared
 * useSimulationSave hook. As a component (non-iframe) simulator, it speaks the
 * same STELLARFORGE_* protocol over window events. Payloads are written in a
 * superset of the original sim's shape — see saveFormat.ts.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Save, FolderOpen, Rocket } from "lucide-react";
import Header from "@/components/layout/Header";
import { SolarisViewer } from "@/components/solaris/SolarisViewer";
import SolarisEditPanel from "@/components/solaris/SolarisEditPanel";
import SaveSimulationDialog from "@/components/simulators/SaveSimulationDialog";
import LoadSimulationSheet from "@/components/simulators/LoadSimulationSheet";
import PublishToWorldDialog from "@/components/simulators/PublishToWorldDialog";
import { useWorldId } from "@/hooks/use-world-id";
import { useSimulationSave } from "@/hooks/use-simulation-save";
import { generateSystem, createPlanet, createMoon, PALETTE } from "@/components/solaris/generator";
import SolarisGeneratePanel from "@/components/solaris/SolarisGeneratePanel";
import {
  DEFAULT_GENERATE_SETTINGS,
  toGenerateOptions,
  type GenerateSettings,
} from "@/components/solaris/generateSettings";
import { toSavePayload, fromSavePayload } from "@/components/solaris/saveFormat";
import type { StarSystem, PlanetData, MoonData, SelectedBody } from "@/components/solaris/types";

const HEADER_H = 64;

function orbitForBand(band: string | undefined, hzIn: number, hzOut: number): number {
  if (band === "inner") return 0.6 * hzIn;
  if (band === "habitable") return (hzIn + hzOut) / 2;
  if (band === "outer") return hzOut * 1.6;
  return hzOut * 3;
}

const SolarisNativeDev = () => {
  const [gen, setGen] = useState<GenerateSettings>(DEFAULT_GENERATE_SETTINGS);
  const [genKey, setGenKey] = useState(0);
  const [system, setSystem] = useState<StarSystem>(() => generateSystem({ seed: "sol" }));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadSheetOpen, setLoadSheetOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const worldId = useWorldId();
  const { saves, isLoadingSaves, pendingPayload, saveDialogOpen, setSaveDialogOpen, createSave, loadSave, requestSave } =
    useSimulationSave({ simulatorType: "solaris", worldId });

  const [viewerHeight, setViewerHeight] = useState(typeof window !== "undefined" ? window.innerHeight - HEADER_H : 600);
  useEffect(() => {
    const onResize = () => setViewerHeight(window.innerHeight - HEADER_H);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const systemRef = useRef(system);
  systemRef.current = system;

  const applySystem = useCallback((s: StarSystem) => {
    setSystem(s);
    setSelectedId(null);
    setGenKey((k) => k + 1);
  }, []);

  const generate = useCallback(
    (settings: GenerateSettings) => applySystem(generateSystem(toGenerateOptions(settings))),
    [applySystem],
  );

  const randomize = () => {
    // A new seed, keeping the settings: the conditions a writer set are the
    // part they want held constant while the system varies.
    const next = { ...gen, seed: Math.random().toString(36).slice(2, 9) };
    setGen(next);
    generate(next);
  };

  // ── STELLARFORGE protocol (component simulator speaks it over window events) ──
  useEffect(() => {
    const onRequestState = () => {
      window.postMessage({ type: "STELLARFORGE_SAVE", payload: toSavePayload(systemRef.current) }, "*");
    };
    const onLoad = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const restored = fromSavePayload(detail);
      if (restored) applySystem(restored.system);
    };
    window.addEventListener("STELLARFORGE_REQUEST_STATE", onRequestState);
    window.addEventListener("STELLARFORGE_LOAD", onLoad as EventListener);
    return () => {
      window.removeEventListener("STELLARFORGE_REQUEST_STATE", onRequestState);
      window.removeEventListener("STELLARFORGE_LOAD", onLoad as EventListener);
    };
  }, [applySystem]);

  const selectedIndex = selectedId ? system.planets.findIndex((p) => p.id === selectedId) : -1;

  // Dev/test hook: deterministic selection + in-memory save→load round-trip.
  useEffect(() => {
    (window as unknown as { __solarisDev?: unknown }).__solarisDev = {
      selectFirst: () => setSelectedId(systemRef.current.planets[0]?.id ?? null),
      planetCount: () => systemRef.current.planets.length,
      getSystem: () => systemRef.current,
      buildPayload: () => toSavePayload(systemRef.current),
      roundTrip: () => {
        const payload = toSavePayload(systemRef.current);
        const restored = fromSavePayload(payload);
        if (restored) applySystem(restored.system);
        return restored?.exact ?? false;
      },
      loadPayload: (payload: unknown) => {
        const restored = fromSavePayload(payload as never);
        if (restored) applySystem(restored.system);
        return restored?.exact ?? false;
      },
    };
  }, [applySystem]);

  const handleSelect = useCallback((b: SelectedBody | null) => {
    if (b && b.type === "planet") setSelectedId((b.data as { id?: string }).id ?? null);
    else setSelectedId(null);
  }, []);

  // ── Edit handlers ──
  const addPlanet = useCallback((archKey: string) => {
    setSystem((s) => {
      const hzIn = s.star.habitableZoneInnerAU;
      const hzOut = s.star.habitableZoneOuterAU;
      const band = PALETTE.find((p) => p.key === archKey)?.band;
      let sma = orbitForBand(band, hzIn, hzOut);
      while (s.planets.some((p) => Math.abs(p.semiMajorAxisAU - sma) < 0.12 * Math.max(hzIn, 0.1))) sma *= 1.15;
      const starMass = (s.stars ?? [s.star]).reduce((sum, st) => sum + st.massSOL, 0);
      return { ...s, planets: [...s.planets, createPlanet(archKey, sma, starMass, hzIn, hzOut)] };
    });
  }, []);

  const patchPlanet = useCallback((index: number, patch: Partial<PlanetData>) => {
    setSystem((s) => {
      const planets = s.planets.slice();
      planets[index] = { ...planets[index], ...patch };
      return { ...s, planets };
    });
  }, []);

  const removePlanet = useCallback((index: number) => {
    setSystem((s) => ({ ...s, planets: s.planets.filter((_, i) => i !== index) }));
  }, []);

  const addMoon = useCallback((index: number) => {
    setSystem((s) => {
      const planets = s.planets.slice();
      planets[index] = { ...planets[index], moons: [...planets[index].moons, createMoon()] };
      return { ...s, planets };
    });
  }, []);

  const patchMoon = useCallback((index: number, moonIdx: number, patch: Partial<MoonData>) => {
    setSystem((s) => {
      const planets = s.planets.slice();
      const moons = planets[index].moons.slice();
      moons[moonIdx] = { ...moons[moonIdx], ...patch };
      planets[index] = { ...planets[index], moons };
      return { ...s, planets };
    });
  }, []);

  const removeMoon = useCallback((index: number, moonIdx: number) => {
    setSystem((s) => {
      const planets = s.planets.slice();
      planets[index] = { ...planets[index], moons: planets[index].moons.filter((_, i) => i !== moonIdx) };
      return { ...s, planets };
    });
  }, []);

  /**
   * Move a planet to a new orbit, keeping its physics honest.
   *
   * A dragged orbit is not just a number: the period follows Kepler's third law
   * from the system's total mass, and whether the planet is in the habitable
   * zone changes with it. Updating the axis alone would leave a world reporting
   * a year it no longer has.
   */
  const reorbitPlanet = useCallback((planetKey: string, semiMajorAxisAU: number) => {
    setSystem((s) => {
      const index = s.planets.findIndex((p) => (p.id ?? p.name) === planetKey);
      const planet = s.planets[index];
      if (!planet) return s;

      const au = Math.round(semiMajorAxisAU * 1000) / 1000;
      if (au === planet.semiMajorAxisAU) return s;

      const totalMass = (s.stars ?? [s.star]).reduce((sum, st) => sum + st.massSOL, 0);
      const planets = s.planets.slice();
      planets[index] = {
        ...planet,
        semiMajorAxisAU: au,
        orbitalPeriodYears:
          Math.round(Math.sqrt(Math.pow(au, 3) / Math.max(totalMass, 0.05)) * 1000) / 1000,
        inHabitableZone:
          au >= s.star.habitableZoneInnerAU && au <= s.star.habitableZoneOuterAU,
      };
      // Keep the list ordered outward so the camera buttons, the readout and the
      // roman numerals in generated names all stay in agreement.
      planets.sort((p, q) => p.semiMajorAxisAU - q.semiMajorAxisAU);
      return { ...s, planets };
    });
  }, []);

  // ── Naming ──
  // These are what make the simulator a source of reference material rather
  // than a toy: a named system and named stars survive into the save, and from
  // there into the writing surface via extractSolarisFacts.
  const renameSystem = useCallback((name: string) => {
    setSystem((s) => ({ ...s, name }));
  }, []);

  const renameStar = useCallback((starIndex: number, name: string) => {
    setSystem((s) => {
      const stars = (s.stars ?? [s.star]).slice();
      if (!stars[starIndex]) return s;
      stars[starIndex] = { ...stars[starIndex], name };
      // stars[0] and star are two views of the primary; both must agree or the
      // readout panel and the save disagree about what the star is called.
      const star = starIndex === 0 ? { ...s.star, name } : s.star;
      return { ...s, star, stars };
    });
  }, []);

  const ctrl = "font-mono text-[13px] uppercase tracking-wider h-8 rounded-none border";
  const actionBtn = `${ctrl} bg-sf-primary/[0.12] border-sf-primary text-sf-primary-bright hover:bg-sf-primary/25 hover:text-white px-3 flex items-center gap-1.5`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div
        style={{ marginTop: HEADER_H }}
        className="relative"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const key = e.dataTransfer.getData("text/solaris-archetype");
          if (key) addPlanet(key);
        }}
      >
        <div className="absolute top-2 right-3 z-20 pointer-events-none">
          <span className="font-mono text-[12px] uppercase tracking-[2px] text-amber-400/70 border border-sf-amber bg-amber-400/5 px-2 py-1 rounded-none">
            Native rebuild · dev preview
          </span>
        </div>

        {/* ── Save / Load / Publish ──
            Sits top-centre, clear of both side panels, and reads as a real
            toolbar rather than three faint outlines. These were easy to miss
            against the starfield when they carried only a hairline border. */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 border border-sf-primary bg-sf-void/90 px-1.5 py-1 backdrop-blur-sm">
          <button onClick={requestSave} className={actionBtn} title="Save simulation">
            <Save className="w-3 h-3" /> Save
          </button>
          <button onClick={() => setLoadSheetOpen(true)} className={actionBtn} title="Load simulation">
            <FolderOpen className="w-3 h-3" /> Load
          </button>
          <button onClick={() => setPublishOpen(true)} className={actionBtn} title="Publish to world">
            <Rocket className="w-3 h-3" /> Publish
          </button>
        </div>

        {/* key remounts (rebuilds engine) only on Generate/Load; edits keep it stable */}
        <SolarisViewer
          key={genKey}
          system={system}
          height={viewerHeight}
          onBodySelect={handleSelect}
          onReorbit={reorbitPlanet}
        />

        <SolarisEditPanel
          system={system}
          selectedIndex={selectedIndex >= 0 ? selectedIndex : null}
          onAddPlanet={addPlanet}
          onPatchPlanet={patchPlanet}
          onRemovePlanet={removePlanet}
          onAddMoon={addMoon}
          onPatchMoon={patchMoon}
          onRemoveMoon={removeMoon}
          onRenameSystem={renameSystem}
          onRenameStar={renameStar}
        />

        <SolarisGeneratePanel
          settings={gen}
          onChange={setGen}
          onGenerate={() => generate(gen)}
          onRandomize={randomize}
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
      <LoadSimulationSheet open={loadSheetOpen} onOpenChange={setLoadSheetOpen} saves={saves} isLoading={isLoadingSaves} onLoad={loadSave} />
      <PublishToWorldDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        payload={pendingPayload ?? toSavePayload(system)}
        worldId={worldId}
        simulatorType="solaris"
      />
    </div>
  );
};

export default SolarisNativeDev;

/**
 * SolarisNativeDev, Hidden dev preview of the native React/R3F Solaris rebuild.
 *
 * Route: /dev/solaris  (NOT in prod nav; live Solaris stays on the static-HTML
 * iframe until parity + sign-off — see docs/SOLARIS_NATIVE_REBUILD.md).
 *
 * M4 scope: native editing — palette add-planet (click or drag), per-planet
 * sliders, rings toggle, moon panel, and the display toggles. Edits mutate
 * system state; the physics engine reconciles without resetting orbits.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/components/layout/Header";
import { SolarisViewer } from "@/components/solaris/SolarisViewer";
import SolarisEditPanel from "@/components/solaris/SolarisEditPanel";
import { generateSystem, createPlanet, createMoon, PALETTE } from "@/components/solaris/generator";
import type { StarSystem, PlanetData, MoonData, SelectedBody } from "@/components/solaris/types";

const HEADER_H = 64;
type Arch = "auto" | "single" | "binary" | "trinary" | "quaternary";

function orbitForBand(band: string | undefined, hzIn: number, hzOut: number): number {
  if (band === "inner") return 0.6 * hzIn;
  if (band === "habitable") return (hzIn + hzOut) / 2;
  if (band === "outer") return hzOut * 1.6;
  return hzOut * 3;
}

const SolarisNativeDev = () => {
  const [seed, setSeed] = useState("sol");
  const [arch, setArch] = useState<Arch>("auto");
  const [genKey, setGenKey] = useState(0);
  const [system, setSystem] = useState<StarSystem>(() => generateSystem({ seed: "sol" }));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [viewerHeight, setViewerHeight] = useState(typeof window !== "undefined" ? window.innerHeight - HEADER_H : 600);
  useEffect(() => {
    const onResize = () => setViewerHeight(window.innerHeight - HEADER_H);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const regenerate = (s: string) => {
    setSystem(generateSystem({ seed: s.trim() || "sol", architecture: arch === "auto" ? undefined : arch }));
    setSelectedId(null);
    setGenKey((k) => k + 1);
  };
  const generate = () => regenerate(seed);
  const randomize = () => {
    const s = Math.random().toString(36).slice(2, 9);
    setSeed(s);
    regenerate(s);
  };

  const selectedIndex = selectedId ? system.planets.findIndex((p) => p.id === selectedId) : -1;

  // Dev/test hook: drive selection deterministically (same path a click uses).
  const systemRef = useRef(system);
  systemRef.current = system;
  useEffect(() => {
    (window as unknown as { __solarisDev?: unknown }).__solarisDev = {
      selectFirst: () => setSelectedId(systemRef.current.planets[0]?.id ?? null),
      planetCount: () => systemRef.current.planets.length,
    };
  }, []);

  const handleSelect = useCallback((b: SelectedBody | null) => {
    if (b && b.type === "planet") setSelectedId((b.data as { id?: string }).id ?? null);
    else setSelectedId(null);
  }, []);

  // ── Edit handlers ──
  const addPlanet = useCallback(
    (archKey: string) => {
      setSystem((s) => {
        const hzIn = s.star.habitableZoneInnerAU;
        const hzOut = s.star.habitableZoneOuterAU;
        const band = PALETTE.find((p) => p.key === archKey)?.band;
        let sma = orbitForBand(band, hzIn, hzOut);
        while (s.planets.some((p) => Math.abs(p.semiMajorAxisAU - sma) < 0.12 * Math.max(hzIn, 0.1))) sma *= 1.15;
        const starMass = (s.stars ?? [s.star]).reduce((sum, st) => sum + st.massSOL, 0);
        const p = createPlanet(archKey, sma, starMass, hzIn, hzOut);
        return { ...s, planets: [...s.planets, p] };
      });
    },
    []
  );

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

  const ctrl = "font-mono text-[10px] uppercase tracking-wider h-7 rounded-none border";

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
          <span className="font-mono text-[9px] uppercase tracking-[2px] text-amber-400/70 border border-amber-400/20 bg-amber-400/5 px-2 py-1 rounded-none">
            Native rebuild · dev preview
          </span>
        </div>

        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder="seed"
            spellCheck={false}
            className={`w-28 bg-sf-void/80 border-sf-border text-white/85 tracking-wider px-2.5 ${ctrl} font-mono focus:border-sf-teal/50 outline-none`}
          />
          <select value={arch} onChange={(e) => setArch(e.target.value as Arch)} className={`bg-sf-void/80 border-sf-border text-white/75 px-1.5 ${ctrl}`}>
            <option value="auto">auto</option>
            <option value="single">single</option>
            <option value="binary">binary</option>
            <option value="trinary">trinary</option>
            <option value="quaternary">quaternary</option>
          </select>
          <button onClick={generate} className={`bg-sf-teal/10 border-sf-teal/30 text-sf-teal hover:bg-sf-teal/20 px-3 ${ctrl}`}>
            Generate
          </button>
          <button onClick={randomize} className={`bg-sf-void/80 border-sf-border text-white/75 hover:bg-sf-void px-3 ${ctrl}`}>
            Random
          </button>
        </div>

        {/* key remounts (rebuilds engine) only on Generate; edits keep the same key */}
        <SolarisViewer key={genKey} system={system} height={viewerHeight} onBodySelect={handleSelect} />

        <SolarisEditPanel
          system={system}
          selectedIndex={selectedIndex >= 0 ? selectedIndex : null}
          onAddPlanet={addPlanet}
          onPatchPlanet={patchPlanet}
          onRemovePlanet={removePlanet}
          onAddMoon={addMoon}
          onPatchMoon={patchMoon}
          onRemoveMoon={removeMoon}
        />
      </div>
    </div>
  );
};

export default SolarisNativeDev;

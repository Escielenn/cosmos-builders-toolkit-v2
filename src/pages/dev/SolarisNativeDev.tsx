/**
 * SolarisNativeDev, Hidden dev preview of the native React/R3F Solaris rebuild.
 *
 * Route: /dev/solaris  (NOT in prod nav; the live Solaris stays at
 * /tools/solaris on the static-HTML iframe until parity + sign-off — see
 * docs/SOLARIS_NATIVE_REBUILD.md).
 *
 * M2 scope: deterministic procedural generator wired to a seed + Generate.
 * Editing, persistence, and multi-star land in later milestones.
 */

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import { SolarisViewer } from "@/components/solaris/SolarisViewer";
import { generateSystem } from "@/components/solaris/generator";

const HEADER_H = 64;

const SolarisNativeDev = () => {
  const [seed, setSeed] = useState("sol");
  const [activeSeed, setActiveSeed] = useState("sol");
  const system = useMemo(() => generateSystem(activeSeed), [activeSeed]);

  const [viewerHeight, setViewerHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight - HEADER_H : 600
  );
  useEffect(() => {
    const onResize = () => setViewerHeight(window.innerHeight - HEADER_H);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const generate = () => setActiveSeed(seed.trim() || "sol");
  const randomize = () => {
    const s = Math.random().toString(36).slice(2, 9);
    setSeed(s);
    setActiveSeed(s);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div style={{ marginTop: HEADER_H }} className="relative">
        {/* Dev marker */}
        <div className="absolute top-2 right-3 z-20 pointer-events-none">
          <span className="font-mono text-[9px] uppercase tracking-[2px] text-amber-400/70 border border-amber-400/20 bg-amber-400/5 px-2 py-1 rounded-none">
            Native rebuild · dev preview
          </span>
        </div>

        {/* Generate controls (top-center, clear of the sim's left panel) */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
            placeholder="seed"
            spellCheck={false}
            className="w-40 bg-sf-void/80 border border-sf-border text-white/85 font-mono text-[11px] tracking-wider px-2.5 h-7 rounded-none outline-none focus:border-sf-teal/50"
          />
          <button
            onClick={generate}
            className="bg-sf-teal/10 border border-sf-teal/30 text-sf-teal hover:bg-sf-teal/20 font-mono text-[10px] uppercase tracking-wider h-7 px-3 rounded-none"
          >
            Generate
          </button>
          <button
            onClick={randomize}
            className="bg-sf-void/80 border border-sf-border text-white/75 hover:bg-sf-void font-mono text-[10px] uppercase tracking-wider h-7 px-3 rounded-none"
          >
            Random
          </button>
        </div>

        {/* key remounts the viewer per system so the camera re-fits */}
        <SolarisViewer key={system.id} system={system} height={viewerHeight} />
      </div>
    </div>
  );
};

export default SolarisNativeDev;

/**
 * SolarisNativeDev, Hidden dev preview of the native React/R3F Solaris rebuild.
 *
 * Route: /dev/solaris  (NOT in prod nav; the live Solaris stays at
 * /tools/solaris on the static-HTML iframe until parity + sign-off — see
 * docs/SOLARIS_NATIVE_REBUILD.md).
 *
 * M3 scope: deterministic generator + N-body physics. Seed + architecture
 * controls; single- and multi-star systems generate and simulate.
 */

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import { SolarisViewer } from "@/components/solaris/SolarisViewer";
import { generateSystem } from "@/components/solaris/generator";

const HEADER_H = 64;
type Arch = "auto" | "single" | "binary" | "trinary" | "quaternary";

const SolarisNativeDev = () => {
  const [seed, setSeed] = useState("sol");
  const [arch, setArch] = useState<Arch>("auto");
  const [active, setActive] = useState<{ seed: string; arch: Arch }>({ seed: "sol", arch: "auto" });

  const system = useMemo(
    () => generateSystem({ seed: active.seed, architecture: active.arch === "auto" ? undefined : active.arch }),
    [active]
  );

  const [viewerHeight, setViewerHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight - HEADER_H : 600
  );
  useEffect(() => {
    const onResize = () => setViewerHeight(window.innerHeight - HEADER_H);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const generate = () => setActive({ seed: seed.trim() || "sol", arch });
  const randomize = () => {
    const s = Math.random().toString(36).slice(2, 9);
    setSeed(s);
    setActive({ seed: s, arch });
  };

  const ctrl = "font-mono text-[10px] uppercase tracking-wider h-7 rounded-none border";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div style={{ marginTop: HEADER_H }} className="relative">
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
            className={`w-32 bg-sf-void/80 border-sf-border text-white/85 tracking-wider px-2.5 ${ctrl} font-mono focus:border-sf-teal/50 outline-none`}
          />
          <select
            value={arch}
            onChange={(e) => setArch(e.target.value as Arch)}
            className={`bg-sf-void/80 border-sf-border text-white/75 px-1.5 ${ctrl}`}
          >
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

        {/* key remounts the viewer per system so the camera re-fits */}
        <SolarisViewer key={`${system.id}-${system.architecture}`} system={system} height={viewerHeight} />
      </div>
    </div>
  );
};

export default SolarisNativeDev;

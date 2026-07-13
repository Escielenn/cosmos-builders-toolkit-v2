/**
 * SolarisNativeDev, Hidden dev preview of the native React/R3F Solaris rebuild.
 *
 * Route: /dev/solaris  (NOT in prod nav; the live Solaris stays at
 * /tools/solaris on the static-HTML iframe until parity + sign-off — see
 * docs/SOLARIS_NATIVE_REBUILD.md).
 *
 * M1 scope: render a real sample StarSystem in the R3F viewer with the
 * speed multiplier and camera modes wired. Generator, editing, and
 * persistence land in later milestones.
 */

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { SolarisViewer } from "@/components/solaris/SolarisViewer";
import { SAMPLE_SYSTEM } from "@/components/solaris/sampleSystem";

const HEADER_H = 64;

const SolarisNativeDev = () => {
  const [viewerHeight, setViewerHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight - HEADER_H : 600
  );

  useEffect(() => {
    const onResize = () => setViewerHeight(window.innerHeight - HEADER_H);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div style={{ marginTop: HEADER_H }} className="relative">
        {/* Dev-only marker */}
        <div className="absolute top-2 right-3 z-20 pointer-events-none">
          <span className="font-mono text-[9px] uppercase tracking-[2px] text-amber-400/70 border border-amber-400/20 bg-amber-400/5 px-2 py-1 rounded-none">
            Native rebuild · dev preview
          </span>
        </div>
        <SolarisViewer system={SAMPLE_SYSTEM} height={viewerHeight} />
      </div>
    </div>
  );
};

export default SolarisNativeDev;

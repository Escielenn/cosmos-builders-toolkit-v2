import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { JulianDayClock } from "@/components/ambient/JulianDayClock";
import { SolCounter } from "@/components/ambient/SolCounter";
import { LunarPhase } from "@/components/ambient/LunarPhase";
import { TargetStar } from "@/components/ambient/TargetStar";

// Simulator routes, status bar hidden on these (same as TextureOverlay)
const SIMULATOR_ROUTES = ["/rogue", "/tools/tidelock", "/tools/exosky", "/tools/stellar-cartographer"];

/** Map pathname to a human-readable sector label */
const getSectorLabel = (pathname: string): string => {
  if (pathname === "/") return "HOME";
  if (pathname.startsWith("/tools/planetary")) return "TOOLS → PLANETARY";
  if (pathname.startsWith("/tools/drake")) return "TOOLS → SIGNAL";
  if (pathname.startsWith("/tools/environmental")) return "TOOLS → CASCADE";
  if (pathname.startsWith("/tools/spacecraft")) return "TOOLS → VESSEL";
  if (pathname.startsWith("/tools/evolutionary")) return "TOOLS → PHYLO";
  if (pathname.startsWith("/tools/star-system")) return "TOOLS → ORRERY";
  if (pathname.startsWith("/tools/empire")) return "TOOLS → DOMINION";
  if (pathname.startsWith("/tools/technology")) return "TOOLS → PARADIGM";
  if (pathname.startsWith("/tools/species-interaction")) return "TOOLS → SYMBIOSIS";
  if (pathname.startsWith("/tools/xenomythology")) return "TOOLS → MYTHOS";
  if (pathname.startsWith("/tools/one-big-lie")) return "TOOLS → AXIOM";
  if (pathname.startsWith("/tools/time-dilation")) return "TOOLS → PARADOX";
  if (pathname.startsWith("/tools/space-expansion")) return "TOOLS → EXODUS";
  if (pathname.startsWith("/tools/habitable-zone")) return "TOOLS → GOLDILOCKS";
  if (pathname.startsWith("/tools/lexdrift")) return "TOOLS → LEXDRIFT";
  if (pathname.startsWith("/tools/surface-gravity")) return "TOOLS → ATLAS";
  if (pathname.startsWith("/tools/timeline")) return "TOOLS → TIMELINE";
  if (pathname.startsWith("/tools/sensorium")) return "TOOLS → SENSORIUM";
  if (pathname.startsWith("/tools/gravitas")) return "TOOLS → GRAVITAS";
  if (pathname.startsWith("/tools/propulsion")) return "TOOLS → IMPULSE";
  if (pathname.startsWith("/tools/")) return "TOOLS";
  if (pathname.startsWith("/world/")) return "WORLD";
  if (pathname.startsWith("/worlds")) return "WORLDS";
  if (pathname.startsWith("/learn")) return "COMMS → LEARN";
  if (pathname.startsWith("/pricing")) return "COMMS → PRICING";
  if (pathname.startsWith("/features")) return "COMMS → FEATURES";
  if (pathname.startsWith("/bookshelf")) return "COMMS → BOOKSHELF";
  if (pathname.startsWith("/settings")) return "SYSTEMS → SETTINGS";
  if (pathname.startsWith("/auth")) return "SYSTEMS → AUTH";
  return "NAV";
};

/** Format elapsed seconds as HH:MM:SS */
const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const StatusBar = () => {
  const { pathname } = useLocation();
  const [elapsed, setElapsed] = useState(0);

  const isSimulator = SIMULATOR_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  // The manuscript editor is a focused full-screen surface with its own
  // status footer — the global bar would overlap it.
  const isEditor = pathname.startsWith("/write");

  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (isSimulator || isEditor) return null;

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, ".");
  const sector = getSectorLabel(pathname);

  return (
    <div className="sf-status-bar" aria-hidden="true">
      {/* Left: velocity data */}
      <div className="hidden md:flex items-center gap-4">
        <span>
          <span className="text-t4">CMB </span>
          <span className="text-sf-amber-warm/60">627 km/s</span>
        </span>
        <span className="text-t4">·</span>
        <span>
          <span className="text-t4">GALACTIC </span>
          <span className="text-sf-amber-warm/60">230 km/s</span>
        </span>
        <span className="text-t4">·</span>
        <span>
          <span className="text-t4">SOLAR </span>
          <span className="text-sf-amber-warm/60">29.78 km/s</span>
        </span>
      </div>

      {/* Mobile left: condensed */}
      <div className="flex md:hidden items-center gap-2">
        <span className="text-t4">CMB </span>
        <span className="text-sf-amber-warm/60">627 km/s</span>
      </div>

      {/* Center: sector + target star + lunar phase */}
      <div className="hidden md:flex items-center gap-4">
        <span className="text-sf-teal/40">
          // SECTOR: {sector}
        </span>
        <span className="hidden xl:inline text-t4">·</span>
        <TargetStar className="hidden xl:inline" />
        <span className="hidden 2xl:inline text-t4">·</span>
        <LunarPhase className="hidden 2xl:inline" />
      </div>

      {/* Right: session + date + sol counter */}
      <div className="flex items-center gap-3">
        <span className="text-t4">
          SESSION {formatTime(elapsed)}
        </span>
        <span className="hidden md:inline text-t4">·</span>
        <span className="hidden md:inline text-t4">{today}</span>
        <span className="hidden lg:inline text-t4">·</span>
        <SolCounter className="hidden lg:inline" />
        <span className="hidden xl:inline text-t4">·</span>
        <JulianDayClock className="hidden xl:inline" />
      </div>
    </div>
  );
};

export default StatusBar;

// ---------------------------------------------------------------------------
// The reader's motion preference, as a hook.
//
// 14-RENDER-ENGINE §3 makes this a FORCED input to the render tier, not a
// nicety: a drifting orrery and a churning corona are precisely what the
// setting exists to switch off.
//
// Subscribes to changes rather than reading once — the preference can be
// toggled while a scene is on screen, and a scene that keeps moving after the
// reader asked it to stop is worse than one that never moved.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export default usePrefersReducedMotion;

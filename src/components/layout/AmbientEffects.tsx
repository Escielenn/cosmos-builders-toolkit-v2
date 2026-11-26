import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { applyAmbient, useDisplayPref } from "@/lib/display-prefs";
import { isSimulatorPath } from "@/lib/simulator-routes";
import "./texture-overlay.css";


/** Sets --scroll-y on <html> for CSS-driven parallax. Runs once globally. */
function useScrollYProperty() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          document.documentElement.style.setProperty(
            "--scroll-y",
            String(window.scrollY)
          );
          ticking = false;
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}

/**
 * AmbientEffects, single mount point for decorative overlays.
 *
 * 1.6 "Quiet Instrument" ambient budget (finding 8): the floating telemetry
 * text that used to live here (UPLINK / SYNC / MHz header bursts, the film
 * frame edge marks, the T_CMB footer readouts and the TIER // WORLDS status)
 * was fixed to the viewport, so it drifted over whatever content scrolled
 * beneath it. It is gone. Telemetry survives only in the footer (coordinates,
 * build sigil, commit ticker), the optional bottom bar (StatusBar) and
 * loading states. What remains here is the grain/scanline texture, which
 * carries no text and multiplies --sf-ambient.
 *
 * Also applies the Display menu's ambient preference (data-ambient on <html>).
 */
const AmbientEffects = () => {
  const { pathname } = useLocation();
  const ambient = useDisplayPref("ambient");

  useScrollYProperty();

  useEffect(() => {
    applyAmbient(ambient);
  }, [ambient]);

  // Simulator routes repaint a full-screen canvas every frame; an animated
  // full-viewport texture above it is re-blended on each of those frames.
  const isSimulator = isSimulatorPath(pathname);

  if (isSimulator) return null;

  return (
    <div className="sf-texture-overlay" aria-hidden="true">
      <div className="sf-grain" />
      <div className="sf-scanlines" />
    </div>
  );
};

export default AmbientEffects;

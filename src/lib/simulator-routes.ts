/**
 * Routes whose page is a full-bleed animating canvas.
 *
 * One list, read by every always-on ambient layer (the grain / scanline
 * texture, the breathing star, the telemetry bar). A fixed, animated,
 * full-viewport layer above or below a canvas that repaints every frame
 * makes the compositor re-blend the whole screen on each of those frames,
 * for an effect that is invisible against a starfield. On these routes the
 * simulation is the hero and the ambient layers stand down.
 *
 * Before 1.7 the texture overlay and the status bar each kept their own
 * copy of this list, and both copies were missing ExoForge and Solaris.
 */
export const SIMULATOR_ROUTES = [
  "/rogue",
  "/tools/tidelock",
  "/tools/exosky",
  "/tools/exoforge",
  "/tools/solaris",
  "/tools/stellar-cartographer",
] as const;

/** True on a simulator canvas page (not on its /science explainer). */
export function isSimulatorCanvasPath(pathname: string): boolean {
  return SIMULATOR_ROUTES.some((route) => pathname === route || pathname === `${route}/`);
}

/** True on a simulator route or anything beneath it (legacy matching). */
export function isSimulatorPath(pathname: string): boolean {
  return SIMULATOR_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

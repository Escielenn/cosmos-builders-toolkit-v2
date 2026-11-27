/**
 * sim-chrome: the layout classes the five simulator pages share (Rogue,
 * ExoForge, Solaris, Tidelock, ExoSky).
 *
 * Desktop (lg and up) keeps the instrument-panel arrangement: the simulator
 * fills the area under the header and the Publish / Load / Save toolbar
 * floats over it, centred at the top. Below lg there is no room for that:
 * the centred toolbar ran off both edges of a phone and sat on top of the
 * simulator's own title and controls. So below lg the toolbar docks as a
 * strip above the simulator (scrolling sideways inside itself if it has to)
 * and the simulator takes the rest of the height. Nothing overlaps.
 *
 * The narrative-bridge offset is a CSS variable so it only applies where
 * the bridge sits beside the simulator (lg and up). Below lg the bridge
 * opens as a drawer over it instead.
 */
import type { CSSProperties } from "react";

/** `<main>`: one viewport tall under the 64px header. */
export const SIM_MAIN = "relative flex flex-col h-[calc(100dvh-64px)] shrink-0";

/** The simulator itself (iframe or canvas host). */
export const SIM_STAGE =
  "relative flex-1 min-h-0 lg:absolute lg:inset-y-0 lg:left-0 lg:right-[var(--sf-bridge-offset,0px)] lg:transition-[right] lg:duration-slow lg:ease-sf-out";

/** Outer toolbar wrapper (toolbar plus the consequence-flag strip). */
export const SIM_TOOLBAR_WRAP =
  "order-first relative z-20 flex flex-col items-stretch gap-2 lg:order-none lg:absolute lg:top-3 lg:left-1/2 lg:-translate-x-1/2 lg:max-w-[calc(100%-7rem)]";

/** The button row. Docked strip below lg, floating panel at lg and up. */
export const SIM_TOOLBAR =
  "flex items-center gap-2 border-b border-sf-line bg-sf-surface py-2 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] overflow-x-auto sf-sb lg:border lg:px-3 lg:overflow-x-visible [&>*]:shrink-0";

/** The consequence-flag strip under the toolbar. */
export const SIM_FLAGS = "border-b border-sf-line bg-sf-surface px-3 py-2 lg:max-w-sm lg:border";

/**
 * Width the closed narrative-bridge tab occupies at the right edge (lg+).
 * The tab is `w-10` in NarrativeBridgePanel; the stage stops short of it so
 * the tab never sits on a simulator's readout panel (1.9, X12).
 */
export const BRIDGE_TAB_PX = 40;

/** Style for the stage: how far the narrative bridge (open panel or closed tab) pushes it (lg+). */
export function simStageStyle(bridgeOpen: boolean): CSSProperties {
  return { "--sf-bridge-offset": bridgeOpen ? "340px" : `${BRIDGE_TAB_PX}px` } as CSSProperties;
}

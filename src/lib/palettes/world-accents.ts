// ---------------------------------------------------------------------------
// World accent presets (World Appearance, a Pro setting).
//
// A DATA palette: a writer picks one accent for one of their worlds and it is
// stored on that world as a hex string. It tints that world's cover and ambient
// glow. It is not the app's `sf-primary` role and never colours buttons, focus
// or links.
// ---------------------------------------------------------------------------

import { tokens } from "@/styles/tokens";

/** The accent a world has until its writer picks one: the product glow. */
export const DEFAULT_WORLD_ACCENT: string = tokens.hue.tealBright;

/** `DEFAULT_WORLD_ACCENT` as an "r, g, b" triple, for rgba() composition. */
export const DEFAULT_WORLD_ACCENT_RGB = "61, 255, 205";

export interface WorldAccentPreset {
  name: string;
  hex: string;
}

export const WORLD_ACCENT_PRESETS: readonly WorldAccentPreset[] = [
  { name: "Teal", hex: DEFAULT_WORLD_ACCENT },
  { name: "Magenta", hex: "#FF3D8E" },
  { name: "Amber", hex: tokens.hue.amberWarm },
  { name: "Green", hex: "#4ADE80" },
  { name: "Blue", hex: tokens.hue.stellar },
  { name: "White", hex: "#E0E4E8" },
  { name: "Coral", hex: "#FF6B6B" },
  { name: "Violet", hex: "#A78BFA" },
];

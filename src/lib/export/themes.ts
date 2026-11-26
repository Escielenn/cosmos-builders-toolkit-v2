/**
 * Export theme definitions for PDF and DOCX styling.
 * Each theme provides a color palette that plugs into createThemedStyles().
 * "Classic" derives from the canonical print palette (SF-II §3.5) —
 * brand hues come from src/styles/tokens.ts, never hand-copied hex.
 */

import { exportThemeInks, printPalette } from "@/lib/pdf/palette";

export interface ExportThemeColors {
  primary: string;
  primaryLight: string;
  text: { primary: string; secondary: string; muted: string };
  border: string;
  borderLight: string;
  background: string;
  accent: string;
}

export interface ExportTheme {
  id: string;
  name: string;
  description: string;
  colors: ExportThemeColors;
  /** Hex swatch shown in the theme picker */
  swatch: [string, string, string];
}

export const EXPORT_THEMES: ExportTheme[] = [
  {
    id: "classic",
    name: "StellarForge Classic",
    description: "Default deep teal on white",
    colors: {
      primary: printPalette.primary,
      primaryLight: printPalette.primaryLight,
      text: { ...printPalette.text },
      border: printPalette.border,
      borderLight: printPalette.borderLight,
      background: printPalette.background,
      accent: printPalette.accent,
    },
    swatch: [printPalette.primary, printPalette.primaryLight, printPalette.background],
  },
  {
    id: "dark-nebula",
    name: "Dark Nebula",
    description: "Deep slate with teal highlights",
    colors: { ...exportThemeInks.darkNebula, text: { ...exportThemeInks.darkNebula.text } },
    swatch: [
      exportThemeInks.darkNebula.primary,
      exportThemeInks.darkNebula.background,
      exportThemeInks.darkNebula.primaryLight,
    ],
  },
  {
    id: "solar-flare",
    name: "Solar Flare",
    description: "Warm amber and orange tones",
    colors: { ...exportThemeInks.solarFlare, text: { ...exportThemeInks.solarFlare.text } },
    swatch: [
      exportThemeInks.solarFlare.primary,
      exportThemeInks.solarFlare.primaryLight,
      exportThemeInks.solarFlare.background,
    ],
  },
  {
    id: "cosmic-violet",
    name: "Cosmic Violet",
    description: "Rich purple with soft lavender",
    colors: { ...exportThemeInks.cosmicViolet, text: { ...exportThemeInks.cosmicViolet.text } },
    swatch: [
      exportThemeInks.cosmicViolet.primary,
      exportThemeInks.cosmicViolet.primaryLight,
      exportThemeInks.cosmicViolet.background,
    ],
  },
];

export function getThemeById(id: string): ExportTheme {
  return EXPORT_THEMES.find((t) => t.id === id) || EXPORT_THEMES[0];
}

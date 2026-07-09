/**
 * Export theme definitions for PDF and DOCX styling.
 * Each theme provides a color palette that plugs into createThemedStyles().
 * "Classic" derives from the canonical print palette (SF-II §3.5) —
 * brand hues come from src/styles/tokens.ts, never hand-copied hex.
 */

import { printPalette } from "@/lib/pdf/palette";

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
    colors: {
      primary: "#2dd4bf",
      primaryLight: "#1e293b",
      text: { primary: "#f1f5f9", secondary: "#94a3b8", muted: "#64748b" },
      border: "#334155",
      borderLight: "#1e293b",
      background: "#0f172a",
      accent: "#5eead4",
    },
    swatch: ["#2dd4bf", "#0f172a", "#1e293b"],
  },
  {
    id: "solar-flare",
    name: "Solar Flare",
    description: "Warm amber and orange tones",
    colors: {
      primary: "#b45309",
      primaryLight: "#fffbeb",
      text: { primary: "#1c1917", secondary: "#44403c", muted: "#78716c" },
      border: "#d6d3d1",
      borderLight: "#e7e5e4",
      background: "#ffffff",
      accent: "#f59e0b",
    },
    swatch: ["#b45309", "#fffbeb", "#ffffff"],
  },
  {
    id: "cosmic-violet",
    name: "Cosmic Violet",
    description: "Rich purple with soft lavender",
    colors: {
      primary: "#7c3aed",
      primaryLight: "#f5f3ff",
      text: { primary: "#1e1b4b", secondary: "#4c1d95", muted: "#6d28d9" },
      border: "#c4b5fd",
      borderLight: "#ede9fe",
      background: "#ffffff",
      accent: "#a78bfa",
    },
    swatch: ["#7c3aed", "#f5f3ff", "#ffffff"],
  },
];

export function getThemeById(id: string): ExportTheme {
  return EXPORT_THEMES.find((t) => t.id === id) || EXPORT_THEMES[0];
}

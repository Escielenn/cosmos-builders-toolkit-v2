import type { DataBurstConfig } from "./types";

/** Star chart behind hero title */
export const HERO_BURSTS: DataBurstConfig[] = [
  {
    content: "RA 17h 45m 40.0s  DEC −29° 00′ 28″",
    position: { top: "8%", right: "4%" },
    variant: "starchart",
    animation: "live",
    parallax: -0.08,
  },
  {
    content: "BEARING: 266.4° GAL",
    position: { top: "14%", left: "3%" },
    variant: "coordinates",
    animation: "breathe",
    parallax: -0.12,
  },
  {
    content: "PARALLAX: 0.7687 mas",
    position: { top: "11%", right: "18%" },
    variant: "coordinates",
    parallax: -0.06,
  },
];

/** Welcome area status burst */
export const WELCOME_BURSTS: DataBurstConfig[] = [
  {
    content: "SESSION INIT",
    position: { top: "22%", right: "6%" },
    variant: "status",
    animation: "flicker",
    parallax: -0.05,
  },
  {
    content: "HANDSHAKE: OK",
    position: { top: "26%", right: "8%" },
    variant: "coordinates",
    parallax: -0.1,
  },
];

/** Margin coordinates alongside tool card grid */
export const TOOLS_GRID_BURSTS: DataBurstConfig[] = [
  {
    content: "47.3892 −122.0841",
    position: { top: "38%", left: "0.5%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.1,
  },
  {
    content: "d = 8.178 ± 0.013 kpc",
    position: { top: "52%", right: "0.5%" },
    variant: "margin",
    animation: "live",
    parallax: -0.06,
  },
  {
    content: "μ_α = −3.156 mas/yr",
    position: { top: "66%", left: "0.5%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.12,
  },
  {
    content: "σ_v = 166.1 km/s",
    position: { top: "45%", right: "0.5%" },
    variant: "margin",
    parallax: -0.08,
  },
  {
    content: "M_BH = 4.15 × 10⁶ M☉",
    position: { top: "80%", left: "0.5%" },
    variant: "margin",
    animation: "live",
    parallax: -0.05,
  },
];

/** Worlds section */
export const WORLDS_SECTION_BURSTS: DataBurstConfig[] = [
  {
    content: "SURVEY LOG: CARTOGRAPHY",
    position: { top: "78%", right: "2%" },
    variant: "status",
    parallax: -0.07,
  },
];

export const ALL_DASHBOARD_BURSTS: DataBurstConfig[] = [
  ...HERO_BURSTS,
  ...WELCOME_BURSTS,
  ...TOOLS_GRID_BURSTS,
  ...WORLDS_SECTION_BURSTS,
];

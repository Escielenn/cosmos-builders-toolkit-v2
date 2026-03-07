import type { DataBurstConfig } from "./types";

export const WORLDS_BURSTS: DataBurstConfig[] = [
  {
    content: "SURVEY LOG: ALL WORLDS",
    position: { top: "6%", right: "3%" },
    variant: "status",
    parallax: -0.05,
  },
  {
    content: "CATALOG: USER CARTOGRAPHY",
    position: { top: "22%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.1,
  },
  {
    content: "CLASS: M (HABITABLE)",
    position: { top: "55%", right: "1.5%" },
    variant: "coordinates",
    parallax: -0.08,
  },
  {
    content: "SURVEY RANGE: 50 kpc",
    position: { top: "40%", left: "1%" },
    variant: "margin",
    animation: "live",
    parallax: -0.12,
  },
  {
    content: "SPECTRAL: G2V (SOL-TYPE)",
    position: { top: "72%", left: "1%" },
    variant: "coordinates",
    animation: "breathe",
    parallax: -0.06,
  },
];

export const WORLD_DASHBOARD_BURSTS: DataBurstConfig[] = [
  {
    content: "WORLD SURVEY: ACTIVE",
    position: { top: "4%", right: "3%" },
    variant: "status",
    animation: "flicker",
    parallax: -0.05,
  },
  {
    content: "SECTOR: ASSIGNED",
    position: { top: "16%", left: "1%" },
    variant: "margin",
    parallax: -0.1,
  },
  {
    content: "WORKSHEETS: INDEXING",
    position: { top: "30%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.08,
  },
  {
    content: "REVISION: HEAD",
    position: { top: "45%", right: "1.5%" },
    variant: "coordinates",
    parallax: -0.12,
  },
];

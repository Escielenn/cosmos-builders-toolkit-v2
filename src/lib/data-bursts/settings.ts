import type { DataBurstConfig } from "./types";

export const SETTINGS_BURSTS: DataBurstConfig[] = [
  {
    content: "PROFILE: ACTIVE",
    position: { top: "6%", right: "3%" },
    variant: "status",
    parallax: -0.05,
  },
  {
    content: "ACCOUNT: SIGNED IN",
    position: { top: "28%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.1,
  },
  {
    content: "SESSION: ACTIVE",
    position: { top: "48%", right: "1.5%" },
    variant: "coordinates",
    parallax: -0.08,
  },
  {
    content: "PREFERENCES: USER-LOCAL",
    position: { top: "65%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.12,
  },
];

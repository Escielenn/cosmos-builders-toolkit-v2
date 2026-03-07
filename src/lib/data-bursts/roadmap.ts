import type { DataBurstConfig } from "./types";

export const ROADMAP_BURSTS: DataBurstConfig[] = [
  {
    content: "MANIFEST: DEVELOPMENT QUEUE",
    position: { top: "6%", right: "2%" },
    variant: "status",
    parallax: -0.05,
  },
  {
    content: "VANGUARD: VOTE PROTOCOL",
    position: { top: "18%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.1,
  },
  {
    content: "PRIORITY: VOTE-WEIGHTED",
    position: { top: "45%", right: "1.5%" },
    variant: "coordinates",
    parallax: -0.08,
  },
  {
    content: "CYCLE: BILLING-ALIGNED",
    position: { top: "68%", left: "1%" },
    variant: "coordinates",
    animation: "flicker",
    parallax: -0.06,
  },
];

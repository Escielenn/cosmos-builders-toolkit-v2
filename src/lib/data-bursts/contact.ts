import type { DataBurstConfig } from "./types";

export const CONTACT_BURSTS: DataBurstConfig[] = [
  {
    content: "COMM CHANNEL: OPEN",
    position: { top: "6%", right: "3%" },
    variant: "status",
    animation: "flicker",
    parallax: -0.06,
  },
  {
    content: "FREQ: 14.225 MHz USB",
    position: { top: "22%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.1,
  },
  {
    content: "ORIGIN: 39.87°N 104.97°W",
    position: { top: "50%", right: "2%" },
    variant: "coordinates",
    parallax: -0.08,
  },
  {
    content: "SIGNAL STRENGTH: −42 dBm",
    position: { top: "38%", left: "1%" },
    variant: "margin",
    animation: "live",
    parallax: -0.12,
  },
  {
    content: "ENCRYPTION: TLS 1.3",
    position: { top: "68%", right: "1.5%" },
    variant: "coordinates",
    animation: "breathe",
    parallax: -0.05,
  },
];

import type { DataBurstConfig } from "./types";

export const PRICING_BURSTS: DataBurstConfig[] = [
  {
    content: "REQUISITION: TIER SELECT",
    position: { top: "6%", right: "3%" },
    variant: "status",
    parallax: -0.05,
  },
  {
    content: "BILLING: STRIPE SECURE",
    position: { top: "22%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.1,
  },
  {
    content: "PROTOCOL: PCI-DSS L1",
    position: { top: "55%", right: "1.5%" },
    variant: "coordinates",
    parallax: -0.08,
  },
  {
    content: "CLEARANCE: STD → PRO → VANGUARD",
    position: { top: "38%", left: "1%" },
    variant: "margin",
    animation: "flicker",
    parallax: -0.12,
  },
  {
    content: "TOKEN: VALID",
    position: { top: "72%", left: "1%" },
    variant: "coordinates",
    animation: "breathe",
    parallax: -0.06,
  },
];

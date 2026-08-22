import type { DataBurstConfig } from "./types";
import { TOTAL_TOOL_COUNT } from "@/lib/tools-config";

export const FEATURES_BURSTS: DataBurstConfig[] = [
  {
    content: "CAPABILITY READOUT // FULL",
    position: { top: "6%", right: "3%" },
    variant: "status",
    animation: "flicker",
    parallax: -0.05,
  },
  {
    content: `SYSTEMS: ${TOTAL_TOOL_COUNT} TOOLS ONLINE`,
    position: { top: "18%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.12,
  },
  {
    content: "ENCRYPTION: AES-256-GCM",
    position: { top: "42%", right: "1.5%" },
    variant: "margin",
    parallax: -0.08,
  },
  {
    content: "UPTIME: 99.97% (30d)",
    position: { top: "65%", left: "1%" },
    variant: "coordinates",
    animation: "live",
    parallax: -0.06,
  },
  {
    content: "AUTH: SUPABASE RLS",
    position: { top: "80%", right: "2%" },
    variant: "coordinates",
    parallax: -0.1,
  },
  {
    content: "STORAGE: ENCRYPTED AT REST",
    position: { top: "52%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.14,
  },
  {
    content: "LATENCY: 23 ms (p95)",
    position: { top: "90%", left: "1%" },
    variant: "coordinates",
    animation: "live",
    parallax: -0.05,
  },
];
